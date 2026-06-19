/* eslint-disable no-underscore-dangle */
const fs = require('hexo-fs');
const path = require('path');
const fetch = require('node-fetch');
const log = require('hexo-log').default({
  debug: false,
  silent: false
});
const LIMIT = 100;
const USER_AGENT = 'mmdjiji/hexo-bangumis (https://github.com/mmdjiji/hexo-bangumis)';
const PROBE_TIMEOUT = 10000; // ms, reachability probe timeout for each mirror

// default upstreams, used when no mirror list is configured in _config.yml
const DEFAULT_API_MIRRORS = ['https://api.bgm.tv'];
const DEFAULT_IMAGE_MIRRORS = ['https://lain.bgm.tv'];

const BGMTV_TYPE = {
  1: '书籍',
  2: '动画',
  3: '音乐',
  4: '游戏',
  6: '三次元'
};

// strip trailing slash so we can safely concat paths
const normalizeBase = (base) => {
  const trimmed = String(base).trim();
  return trimmed.replace(/\/+$/, '');
};

// fetch with an abort-based timeout, so an unreachable mirror doesn't hang forever
const fetchWithTimeout = async (url, options = {}, timeout = PROBE_TIMEOUT) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

// Pick the first reachable mirror from `mirrors`, probing top-to-bottom.
// `buildProbeUrl(base)` returns the URL used to test a single mirror. A mirror
// counts as reachable as soon as the host returns ANY HTTP response — a 404 or
// 403 still proves the host is not blocked/timing out, which is exactly the
// condition we fall back on (DNS failure, connection refused, timeout). The
// chosen base is returned (without trailing slash) and should be reused for the
// rest of the run. Throws when every mirror is unreachable.
const resolveMirror = async (mirrors, buildProbeUrl, options, label) => {
  const candidates = (Array.isArray(mirrors) && mirrors.length ? mirrors : [])
    .map(normalizeBase)
    .filter(Boolean);
  let lastError;
  for (const base of candidates) {
    try {
      const res = await fetchWithTimeout(buildProbeUrl(base), options);
      log.info(`Using ${label} mirror: ${base} (probe status ${res.status})`);
      return { base, res };
    } catch (error) {
      lastError = error;
      log.info(`${label} mirror ${base} unreachable (${error.message}), trying next...`);
    }
  }
  throw new Error(`All ${label} mirrors are unreachable: ${lastError ? lastError.message : 'no mirror configured'}`);
};

// get a user's bangumi list
const getBangumiList = async (bgmtv_uid, apiBase) => {
  const wantWatch = []; // type=1
  const watching = [];  // type=3
  const watched = [];   // type=2
  if (bgmtv_uid) {
    let offset = 0;
    let total = 0;

    do {
      // eslint-disable-next-line no-mixed-operators
      const req = await (await fetchWithTimeout(`${apiBase}/v0/users/${bgmtv_uid}/collections?subject_type=2&limit=${LIMIT}&offset=${offset}`, {
        headers: {
          'User-Agent': USER_AGENT
        }
      })).json();
      // eslint-disable-next-line prefer-destructuring
      total = req.total;
      for (const i of req.data) {
        const { subject_id, updated_at } = i;
        if (i.type === 1) {
          wantWatch.push({ subject_id, updated_at });
        } else if (i.type === 3) {
          watching.push({ subject_id, updated_at });
        } else if (i.type === 2) {
          watched.push({ subject_id, updated_at });
        }
      }
      offset += LIMIT;
    } while (offset < total);
    log.info(`Get bangumi list successfully, found ${total} bangumis`);
  }

  return { wantWatch, watching, watched };
};

// get a bangumi by id
const getBangumi = async (bgm, cachePath, apiBase) => {
  const bangumi_id = bgm.subject_id;
  const savedPath = path.join(cachePath, `/${bangumi_id}.json`);
  if (await fs.exists(savedPath)) {
    try {
      const read = await JSON.parse(await fs.readFile(savedPath));
      if (read.id === bangumi_id) {
        if (read?.eps > 0) {
          return read;
        }
      } else {
        throw new Error(`Id not match when trying to load id = ${bangumi_id}`);
      }
    } catch (error) {
      // invalid bangumi
      console.error(error);
      return undefined;
    }
  }

  try {
    const req = await fetchWithTimeout(`${apiBase}/v0/subjects/${bangumi_id}`, {
      headers: {
        'User-Agent': USER_AGENT
      }
    });
    if (req.status === 200) {
      const item = await req.json();
      const obj =  {
        id: item.id,
        name: item.name,
        name_cn: item.name_cn,
        type: BGMTV_TYPE[item.type],
        image: /\w+\/\w+\/\w+.jpg$/.exec(item.images.common)[0],
        link: `https://bgm.tv/subject/${item.id}`,
        eps: item.eps,
        collection: item.collection,
        date: item.date,
        summary: item.summary?.trim(),
        rating: item.rating,
        updated_at: bgm.updated_at
      };
      fs.writeFile(savedPath, JSON.stringify(obj), (err) => {
        if (err) {
          log.info(`Failed to write data to cache/${bangumi_id}.json`);
          console.error(err);
        }
      });
      return obj;
    }
  } catch (error) {
    console.log(error);
    log.info(`Failed to get bangumi (${bangumi_id}), please check network!`);
    return undefined;
  }
  fs.writeFile(savedPath, '{}', (err) => { // mark as invalid bangumi
    if (err) {
      log.info(`Failed to write data to cache/${bangumi_id}.json`);
      console.error(err);
    }
  });
  log.info(`Get bangumi (${bangumi_id}) Failed, maybe invalid!`);
};

const getImage = (image_url, imagesPath, image_level, imageBase) => {
  if (image_url && !fs.existsSync(`${imagesPath}/${image_url}`)) {
    fetch(`${imageBase}/pic/cover/${image_level}/${image_url}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/octet-stream' }
    }).then((res) => res.buffer())
      .then((image) => {
        fs.writeFile(`${imagesPath}/${image_url}`, image, 'binary', (err) => {
          console.error(err);
        });
      });
  }
};

module.exports.getBgmData = async (bgmtv_uid, download_image, image_level, source_dir, mirrors = {}) => {
  const apiMirrors = mirrors.api_mirrors || DEFAULT_API_MIRRORS;
  const imageMirrors = mirrors.image_mirrors || DEFAULT_IMAGE_MIRRORS;

  // create folders if not exist
  const bangumisPath = path.join(source_dir, '/_data/bangumis');
  const cachePath = path.join(bangumisPath, '/cache');
  const imagesPath = path.join(source_dir, '/images/bangumis');
  const pathList = [bangumisPath, cachePath, imagesPath];
  for (const i of pathList) {
    if (!fs.existsSync(i)) {
      fs.mkdirsSync(i);
    }
  }

  // resolve a reachable API mirror, probing top-to-bottom; the chosen base is
  // reused for every subsequent request this run
  const apiProbeUrl = (base) => {
    if (bgmtv_uid) {
      return `${base}/v0/users/${bgmtv_uid}/collections?subject_type=2&limit=1&offset=0`;
    }
    return `${base}/v0/subjects/1`;
  };
  const { base: apiBase } = await resolveMirror(
    apiMirrors,
    apiProbeUrl,
    { headers: { 'User-Agent': USER_AGENT } },
    'API'
  );

  // resolve a reachable image mirror only when local images are requested
  let imageBase;
  if (download_image) {
    imageBase = (await resolveMirror(
      imageMirrors,
      (base) => `${base}/pic/cover/${image_level}/`,
      { method: 'GET' },
      'image'
    )).base;
  }

  // get user's bangumi list
  const bangumiList = bgmtv_uid ? (await getBangumiList(bgmtv_uid, apiBase)) : (await JSON.parse(fs.readFileSync(path.join(bangumisPath, '/index.json'))));

  if (bgmtv_uid) {
    fs.writeFile(path.join(bangumisPath, '/index.json'), JSON.stringify(bangumiList), (err) => {
      if (err) {
        log.info('Failed to write data to bangumis/index.json');
        console.error(err);
      }
    });
  }

  // for each bangumi, get its information in detail
  const batch = async (list) => {
    const result = [];
    for (const item of list) {
      const info = await getBangumi(item, cachePath, apiBase);
      if (info) {
        result.push(info);
        if (download_image) {
          getImage(info.image, imagesPath, image_level, imageBase);
        }
        log.info(`Get bangumi 《${info.name_cn || info.name}》 (${info.id}) Success!`);
      }
    }
    return result;
  };

  const wantWatch = (await batch(bangumiList.wantWatch)).sort((a, b) => a.updated_at - b.updated_at);
  const watching = (await batch(bangumiList.watching)).sort((a, b) => a.updated_at - b.updated_at);
  const watched = (await batch(bangumiList.watched)).sort((a, b) => a.updated_at - b.updated_at);

  const result = { wantWatch, watching, watched };

  fs.writeFile(path.join(bangumisPath, '/bangumis.json'), JSON.stringify(result), (err) => {
    if (err) {
      log.info('Failed to write data to cache/bangumis.json');
      console.error(err);
    }
  });

  const total = bangumiList.wantWatch.length + bangumiList.watching.length + bangumiList.watched.length;
  const succeed = result.wantWatch.length + result.watching.length + result.watched.length;
  const failed = total - succeed;
  log.info(`Generated bangumis.json, total ${total} bangumis, ${succeed} succeed, ${failed} failed`);
};

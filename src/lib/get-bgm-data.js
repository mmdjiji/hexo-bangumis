/* eslint-disable no-underscore-dangle */
const fs = require('hexo-fs');
const path = require('path');
const fetch = require('node-fetch');
const log = require('hexo-log')({
  debug: false,
  silent: false
});
// const bangumiData = require('bangumi-data');

const BGMTV_TYPE = {
  1: '书籍',
  2: '动画',
  3: '音乐',
  4: '游戏',
  6: '三次元'
};

// const jp2cnName = (name) => bangumiData.items.find((item) => item.title === name)?.titleTranslate?.['zh-Hans']?.[0] || name;

const LIMIT = 100;
const USER_AGENT = 'mmdjiji/hexo-bangumis (https://github.com/mmdjiji/hexo-bangumis)';

// get a user's bangumi list
const getBangumiList = async (bgmtv_uid) => {
  const wantWatch = []; // type=1
  const watching = [];  // type=3
  const watched = [];   // type=2
  if (bgmtv_uid) {
    let offset = 0;
    let total = 0;

    do {
      // eslint-disable-next-line no-mixed-operators
      const req = await (await fetch(`https://api.bgm.tv/v0/users/${bgmtv_uid}/collections?limit=${LIMIT}&offset=${offset}`, {
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
// jsdelivr -> raw -> bgmtv
const getBangumi = async (bgm, cachePath) => {
  const bangumi_id = bgm.subject_id;
  const savedPath = path.join(cachePath, `/${bangumi_id}.json`);
  if (await fs.exists(savedPath)) {
    try {
      const read = await JSON.parse(await fs.readFile(savedPath));
      if (read.id === bangumi_id) {
        return read;
      }
      throw new Error(`Id not match when trying to load id=${bangumi_id}`);
    } catch (error) {
      // invalid bangumi
      console.error(error);
      return undefined;
    }
  }

  // !!! special bug if use this code, exit when getting the bangumi information
  // const cdnList = ['https://cdn.jsdelivr.net/gh/czy0729/Bangumi-Subject@master/data/', 'https://raw.githubusercontent.com/czy0729/Bangumi-Subject/master/data/'];
  // for (let i = 0; i < cdnList.length; i += 1) {
  //   const url = `${cdnList[i]}${parseInt(parseInt(bangumi_id, 10) / 100, 10)}/${bangumi_id}.json`;
  //   try {
  //     const req = await fetch(url, {
  //       headers: {
  //         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36 Edg/97.0.1072.69'
  //       }
  //     });
  //     if (req.status === 200) {
  //       const item = await req.json();
  //       const obj =  {
  //         id: item.id,
  //         name: item.name,
  //         name_cn: item.name_cn,
  //         type: BGMTV_TYPE[item.type],
  //         image: /\w+\/\w+\/\w+.jpg$/.exec(item.image)[0],
  //         link: `https://bgm.tv/subject/${item.id}`,
  //         eps: item.eps.length,
  //         collection: item.collection,
  //         date: item.date,
  //         summary: item.summary?.trim(),
  //         rating: item.rating,
  //         updated_at: bgm.updated_at
  //       };
  //       fs.writeFile(savedPath, JSON.stringify(obj), (err) => {
  //         if (err) {
  //           log.info(`Failed to write data to cache/${bangumi_id}.json`);
  //           console.error(err);
  //         }
  //       });
  //       return obj;
  //     }
  //   } catch (error) {
  //     // do nothing, cdn failure is normal
  //     // if (i === cdnList.length - 1) {
  //     //   log.info(`Failed to get bangumi ${bangumi_id} by cdn`);
  //     //   console.error(error);
  //     // }
  //   }
  // }

  try {
    const req = await fetch(`https://api.bgm.tv/v0/subjects/${bangumi_id}`, {
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
    log.info(`Failed to get bangumi (${bangumi_id}), please check network!`);
    return undefined;
    // console.log(error);
  }
  fs.writeFile(savedPath, '{}', (err) => { // mark as invalid bangumi
    if (err) {
      log.info(`Failed to write data to cache/${bangumi_id}.json`);
      console.error(err);
    }
  });
  log.info(`Get bangumi (${bangumi_id}) Failed, maybe invalid!`);
};

const getImage = (image_url, imagesPath, image_level) => {
  if (image_url && !fs.existsSync(`${imagesPath}/${image_url}`)) {
    fetch(`https://lain.bgm.tv/pic/cover/${image_level}/${image_url}`, {
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

module.exports.getBgmData = async (bgmtv_uid, download_image, image_level, source_dir) => {
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

  // get user's bangumi list
  const bangumiList = bgmtv_uid ? (await getBangumiList(bgmtv_uid)) : (await JSON.parse(fs.readFileSync(path.join(bangumisPath, '/index.json'))));

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
      const info = await getBangumi(item, cachePath);
      if (info) {
        result.push(info);
        if (download_image) {
          getImage(info.image, imagesPath, image_level);
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

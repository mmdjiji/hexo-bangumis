'use strict';

// Tests for the mirror fallback logic in getBgmData.
//
// These hit the REAL anibt mirrors over the network with the real uid
// `leechael`, no mocking. They require internet access and depend on those
// mirrors being up; treat a network failure as an environment problem, not a
// code regression. `leechael`'s collection is small, so each test fetches it
// in full.
//
// Runs against the compiled dist/ output, since that is what gets published
// and require()'d by Hexo. Run `npm run build` first (the `test` script does).

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { getBgmData } = require('../dist/get-bgm-data');

const UID = 'leechael';
const API_MIRROR = 'https://bgmapi.anibt.net';
const IMAGE_MIRROR = 'https://bgmimg.anibt.net';
// A mirror that is guaranteed unreachable: TCP connect to port 1 is refused.
const DEAD = 'http://127.0.0.1:1';
// Real network can be slow; generous per-test ceiling.
const NET_TIMEOUT = 120000;

// Fresh source_dir per test; getBgmData creates the subfolders itself.
const makeSourceDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bangumis-test-'));

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

// bangumis.json is written via async fs.writeFile, so poll briefly for it.
const readResultWhenReady = (sourceDir) => new Promise((resolve, reject) => {
  const file = path.join(sourceDir, '_data', 'bangumis', 'bangumis.json');
  let tries = 0;
  const tick = () => {
    if (fs.existsSync(file)) {
      resolve(readJson(file));
    } else if (++tries > 200) {
      reject(new Error('bangumis.json was not written in time'));
    } else {
      setTimeout(tick, 50);
    }
  };
  tick();
});

const totalCount = (r) => r.wantWatch.length + r.watching.length + r.watched.length;

test('fetches leechael\'s real collection through the anibt API mirror', { timeout: NET_TIMEOUT }, async () => {
  const sourceDir = makeSourceDir();
  await getBgmData(UID, false, 'c', sourceDir, { api_mirrors: [API_MIRROR] });
  const result = await readResultWhenReady(sourceDir);

  // The collection changes over time, so assert on structure, not a fixed count.
  assert.ok(totalCount(result) > 0, 'should have fetched at least one bangumi for leechael');
  const sample = [...result.wantWatch, ...result.watching, ...result.watched][0];
  assert.ok(typeof sample.id === 'number', 'each item should carry a numeric id');
  assert.ok(typeof sample.image === 'string' && sample.image.length > 0, 'each item should carry an image path');
  // index.json (the raw collection list) should also have been written.
  assert.ok(fs.existsSync(path.join(sourceDir, '_data', 'bangumis', 'index.json')));
});

test('falls back to the anibt API mirror when the first mirror is unreachable', { timeout: NET_TIMEOUT }, async () => {
  const sourceDir = makeSourceDir();
  // Dead mirror first -> must probe past it and lock onto the real one.
  await getBgmData(UID, false, 'c', sourceDir, { api_mirrors: [DEAD, API_MIRROR] });
  const result = await readResultWhenReady(sourceDir);
  assert.ok(totalCount(result) > 0, 'should have fetched data via the fallback mirror');
});

test('downloads covers through the anibt image mirror (with image-mirror fallback)', { timeout: NET_TIMEOUT }, async () => {
  const sourceDir = makeSourceDir();
  await getBgmData(UID, true, 'c', sourceDir, {
    api_mirrors: [API_MIRROR],
    image_mirrors: [DEAD, IMAGE_MIRROR] // dead first -> exercises image-mirror fallback too
  });
  await readResultWhenReady(sourceDir);

  // Images are written via async fire-and-forget fetch; poll for at least one.
  const imagesDir = path.join(sourceDir, 'images', 'bangumis');
  const sawImage = await new Promise((resolve) => {
    let tries = 0;
    const tick = () => {
      const files = fs.existsSync(imagesDir)
        ? fs.readdirSync(imagesDir, { recursive: true }).filter((f) => String(f).endsWith('.jpg'))
        : [];
      if (files.length > 0) {
        resolve(true);
      } else if (++tries > 300) {
        resolve(false);
      } else {
        setTimeout(tick, 100);
      }
    };
    tick();
  });
  assert.ok(sawImage, 'at least one cover image should have been downloaded via the image mirror');
});

test('throws when every API mirror is unreachable', { timeout: NET_TIMEOUT }, async () => {
  const sourceDir = makeSourceDir();
  await assert.rejects(
    getBgmData(UID, false, 'c', sourceDir, { api_mirrors: [DEAD, 'http://127.0.0.1:2'] }),
    /All API mirrors are unreachable/
  );
});

test('normalizes a trailing slash on the mirror base', { timeout: NET_TIMEOUT }, async () => {
  const sourceDir = makeSourceDir();
  // base with trailing slash must not produce a double slash in the request
  await getBgmData(UID, false, 'c', sourceDir, { api_mirrors: [`${API_MIRROR}/`] });
  const result = await readResultWhenReady(sourceDir);
  assert.ok(totalCount(result) > 0, 'trailing-slash base should still work');
});

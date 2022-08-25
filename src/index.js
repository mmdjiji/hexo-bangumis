/* global hexo */
'use strict';
const fs = require('hexo-fs');
const path = require('path');
const log = require('hexo-log')({
  debug: false,
  silent: false
});

const { getBgmData } = require('./dist/get-bgm-data');

// eslint-disable-next-line no-var
if (typeof URL !== 'function') var { URL } = require('url');

const options = {
  options: [
    { name: '-u, --update', desc: 'Update data' },
    { name: '-d, --delete', desc: 'Delete data' }
  ]
};
hexo.extend.generator.register('bangumis', function (locals) {
  if (!this?.config?.bangumis?.enable) {
    return;
  }
  if (!fs.existsSync(path.join(this.source_dir, '/images/loading.gif'))) {
    fs.copyFile(path.join(__dirname, 'img/loading.gif'), path.join(this.source_dir, '/images/loading.gif'));
  }
  return require('./dist/bangumi-generator').call(this, locals);
});
hexo.extend.console.register('bangumis', 'Generate pages of bangumis for Hexo', options, function (args) {
  if (args.d) {
    if (fs.existsSync(path.join(this.source_dir, '/_data/bangumis/index.json'))) {
      fs.unlinkSync(path.join(this.source_dir, '/_data/bangumis/index.json'));
      log.info('Bangumis data has been deleted');
    } else {
      log.info('No bangumis data to delete');
    }
  } else if (args.u) {
    if (!this?.config?.bangumis) {
      log.info('Please add config to _config.yml');
      return;
    }
    const { enable, bgmtv_uid, download_image, image_level } = this.config.bangumis;
    if (!enable) {
      return;
    }
    getBgmData(bgmtv_uid, download_image, image_level, this.source_dir);
  } else {
    log.info('Unknown command, please use "hexo bangumis -h" to see the available commands');
  }
});

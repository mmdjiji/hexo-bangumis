/* global hexo */
'use strict';

var fs = require('hexo-fs');

var path = require('path');

var log = require('hexo-log')({
  debug: false,
  silent: false
});

var _require = require('./dist/get-bgm-data'),
    getBgmData = _require.getBgmData; // eslint-disable-next-line no-var


if (typeof URL !== 'function') var _require2 = require('url'),
    URL = _require2.URL;
var options = {
  options: [{
    name: '-u, --update',
    desc: 'Update data'
  }, {
    name: '-d, --delete',
    desc: 'Delete data'
  }]
};
hexo.extend.generator.register('bangumis', function (locals) {
  var _this$config, _this$config$bangumis;

  if (!(this !== null && this !== void 0 && (_this$config = this.config) !== null && _this$config !== void 0 && (_this$config$bangumis = _this$config.bangumis) !== null && _this$config$bangumis !== void 0 && _this$config$bangumis.enable)) {
    return;
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
    var _this$config2;

    if (!(this !== null && this !== void 0 && (_this$config2 = this.config) !== null && _this$config2 !== void 0 && _this$config2.bangumis)) {
      log.info('Please add config to _config.yml');
      return;
    }

    var _this$config$bangumis2 = this.config.bangumis,
        enable = _this$config$bangumis2.enable,
        bgmtv_uid = _this$config$bangumis2.bgmtv_uid,
        download_image = _this$config$bangumis2.download_image;

    if (!enable) {
      return;
    }

    getBgmData(bgmtv_uid, download_image, this.source_dir);
  } else {
    log.info('Unknown command, please use "hexo bangumis -h" to see the available commands');
  }
});

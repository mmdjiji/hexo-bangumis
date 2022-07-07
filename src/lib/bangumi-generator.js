'use strict';

const ejs = require('ejs');
const path = require('path');
const { i18n } = require('./util');
const fs = require('hexo-fs');
const log = require('hexo-log')({
  debug: false,
  silent: false
});

module.exports = async function (locals) {
  const { config } = this;
  if (!config?.bangumis?.enable) {
    return;
  }

  let { root } = config;
  if (root.endsWith('/')) {
    root = root.slice(0, root.length - 1);
  }
  let wantWatch = [];
  let watching = [];
  let watched = [];
  if (!fs.existsSync(path.join(this.source_dir, '/_data/bangumis/bangumis.json'))) {
    log.info('Can\'t find bangumis.json, please use "hexo bangumis -u" command to get data');
  } else {
    ({ wantWatch, watching, watched } = JSON.parse(fs.readFileSync(path.join(this.source_dir, '/_data/bangumis/bangumis.json'))));

    log.info(`${wantWatch.length + watching.length + watched.length} bangumis have been loaded`);
  }

  // eslint-disable-next-line no-underscore-dangle
  const __ = i18n.__(config.language);

  const contents = await ejs.renderFile(path.join(__dirname, 'templates/bangumi.ejs'), {
    quote: config.bangumis.quote,
    show: config.bangumis.show || 1,
    loading: config.bangumis.loading,
    color_meta: config.bangumis.color_meta ? `style="color:${config.bangumis.color_meta}"` : '',
    color: config.bangumis.color ? `style="color:${config.bangumis.color}"` : '',
    lazyload: config.bangumis.lazyload ?? true,
    wantWatch,
    watched,
    watching,
    __,
    root
  }, { async: false });

  const customPath = config.bangumis.path;
  return {
    path: customPath || ('bangumis/index.html'),
    data: {
      title: config.bangumis.title,
      content: contents,
      ...config?.bangumis?.extra_options
    },
    layout: ['page', 'post']
  };
};

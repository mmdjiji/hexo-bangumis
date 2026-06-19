'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
var ejs = require('ejs');
var path = require('path');
var _require = require('./util'),
  i18n = _require.i18n;
var fs = require('hexo-fs');
var log = require('hexo-log')["default"]({
  debug: false,
  silent: false
});
module.exports = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(locals) {
    var _config$bangumis, _config$bangumis$lazy, _config$bangumis$marg, _config$bangumis$down, _config$bangumis$imag, _config$bangumis$imag2, _config$bangumis2;
    var config, root, wantWatch, watching, watched, _JSON$parse, __, contents, customPath;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          config = this.config;
          if (config !== null && config !== void 0 && (_config$bangumis = config.bangumis) !== null && _config$bangumis !== void 0 && _config$bangumis.enable) {
            _context.next = 3;
            break;
          }
          return _context.abrupt("return");
        case 3:
          root = config.root;
          if (root.endsWith('/')) {
            root = root.slice(0, root.length - 1);
          }
          wantWatch = [];
          watching = [];
          watched = [];
          if (!fs.existsSync(path.join(this.source_dir, '/_data/bangumis/bangumis.json'))) {
            log.info('Can\'t find bangumis.json, please use "hexo bangumis -u" command to get data');
          } else {
            _JSON$parse = JSON.parse(fs.readFileSync(path.join(this.source_dir, '/_data/bangumis/bangumis.json')));
            wantWatch = _JSON$parse.wantWatch;
            watching = _JSON$parse.watching;
            watched = _JSON$parse.watched;
            log.info("".concat(wantWatch.length + watching.length + watched.length, " bangumis have been loaded"));
          }

          // eslint-disable-next-line no-underscore-dangle
          __ = i18n.__(config.language);
          _context.next = 12;
          return ejs.renderFile(path.join(__dirname, 'templates/bangumi.ejs'), {
            quote: config.bangumis.quote,
            show: config.bangumis.show || 1,
            loading: config.bangumis.loading,
            color_meta: config.bangumis.color_meta ? "style=\"color:".concat(config.bangumis.color_meta, "\"") : '',
            color: config.bangumis.color ? "style=\"color:".concat(config.bangumis.color, "\"") : '',
            lazyload: (_config$bangumis$lazy = config.bangumis.lazyload) !== null && _config$bangumis$lazy !== void 0 ? _config$bangumis$lazy : true,
            margin: (_config$bangumis$marg = config.bangumis.margin) !== null && _config$bangumis$marg !== void 0 ? _config$bangumis$marg : '20px',
            download_image: (_config$bangumis$down = config.bangumis.download_image) !== null && _config$bangumis$down !== void 0 ? _config$bangumis$down : false,
            image_level: (_config$bangumis$imag = config.bangumis.image_level) !== null && _config$bangumis$imag !== void 0 ? _config$bangumis$imag : 'c',
            // when not localizing images, the page links straight to the image CDN;
            // use the first configured image mirror, falling back to the official one
            image_base: (((_config$bangumis$imag2 = config.bangumis.image_mirrors) === null || _config$bangumis$imag2 === void 0 ? void 0 : _config$bangumis$imag2[0]) || 'https://lain.bgm.tv').replace(/\/+$/, ''),
            wantWatch: wantWatch,
            watched: watched,
            watching: watching,
            __: __,
            root: root
          }, {
            async: false
          });
        case 12:
          contents = _context.sent;
          customPath = config.bangumis.path;
          return _context.abrupt("return", {
            path: customPath || 'bangumis/index.html',
            data: _objectSpread({
              title: config.bangumis.title,
              content: contents
            }, config === null || config === void 0 || (_config$bangumis2 = config.bangumis) === null || _config$bangumis2 === void 0 ? void 0 : _config$bangumis2.extra_options),
            layout: ['page', 'post']
          });
        case 15:
        case "end":
          return _context.stop();
      }
    }, _callee, this);
  }));
  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

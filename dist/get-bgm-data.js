"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { (0, _defineProperty2["default"])(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
/* eslint-disable no-underscore-dangle */
var fs = require('hexo-fs');
var path = require('path');
var fetch = require('node-fetch');
var log = require('hexo-log')["default"]({
  debug: false,
  silent: false
});
var LIMIT = 100;
var USER_AGENT = 'mmdjiji/hexo-bangumis (https://github.com/mmdjiji/hexo-bangumis)';
var PROBE_TIMEOUT = 10000; // ms, reachability probe timeout for each mirror

// default upstreams, used when no mirror list is configured in _config.yml
var DEFAULT_API_MIRRORS = ['https://api.bgm.tv'];
var DEFAULT_IMAGE_MIRRORS = ['https://lain.bgm.tv'];
var BGMTV_TYPE = {
  1: '书籍',
  2: '动画',
  3: '音乐',
  4: '游戏',
  6: '三次元'
};

// strip trailing slash so we can safely concat paths
var normalizeBase = function normalizeBase(base) {
  var trimmed = String(base).trim();
  return trimmed.replace(/\/+$/, '');
};

// fetch with an abort-based timeout, so an unreachable mirror doesn't hang forever
var fetchWithTimeout = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(url) {
    var options,
      timeout,
      controller,
      timer,
      _args = arguments;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          options = _args.length > 1 && _args[1] !== undefined ? _args[1] : {};
          timeout = _args.length > 2 && _args[2] !== undefined ? _args[2] : PROBE_TIMEOUT;
          controller = new AbortController();
          timer = setTimeout(function () {
            return controller.abort();
          }, timeout);
          _context.prev = 4;
          _context.next = 7;
          return fetch(url, _objectSpread(_objectSpread({}, options), {}, {
            signal: controller.signal
          }));
        case 7:
          return _context.abrupt("return", _context.sent);
        case 8:
          _context.prev = 8;
          clearTimeout(timer);
          return _context.finish(8);
        case 11:
        case "end":
          return _context.stop();
      }
    }, _callee, null, [[4,, 8, 11]]);
  }));
  return function fetchWithTimeout(_x) {
    return _ref.apply(this, arguments);
  };
}();

// Pick the first reachable mirror from `mirrors`, probing top-to-bottom.
// `buildProbeUrl(base)` returns the URL used to test a single mirror. A mirror
// counts as reachable as soon as the host returns ANY HTTP response — a 404 or
// 403 still proves the host is not blocked/timing out, which is exactly the
// condition we fall back on (DNS failure, connection refused, timeout). The
// chosen base is returned (without trailing slash) and should be reused for the
// rest of the run. Throws when every mirror is unreachable.
var resolveMirror = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(mirrors, buildProbeUrl, options, label) {
    var candidates, lastError, _iterator, _step, base, res;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          candidates = (Array.isArray(mirrors) && mirrors.length ? mirrors : []).map(normalizeBase).filter(Boolean);
          _iterator = _createForOfIteratorHelper(candidates);
          _context2.prev = 2;
          _iterator.s();
        case 4:
          if ((_step = _iterator.n()).done) {
            _context2.next = 20;
            break;
          }
          base = _step.value;
          _context2.prev = 6;
          _context2.next = 9;
          return fetchWithTimeout(buildProbeUrl(base), options);
        case 9:
          res = _context2.sent;
          log.info("Using ".concat(label, " mirror: ").concat(base, " (probe status ").concat(res.status, ")"));
          return _context2.abrupt("return", {
            base: base,
            res: res
          });
        case 14:
          _context2.prev = 14;
          _context2.t0 = _context2["catch"](6);
          lastError = _context2.t0;
          log.info("".concat(label, " mirror ").concat(base, " unreachable (").concat(_context2.t0.message, "), trying next..."));
        case 18:
          _context2.next = 4;
          break;
        case 20:
          _context2.next = 25;
          break;
        case 22:
          _context2.prev = 22;
          _context2.t1 = _context2["catch"](2);
          _iterator.e(_context2.t1);
        case 25:
          _context2.prev = 25;
          _iterator.f();
          return _context2.finish(25);
        case 28:
          throw new Error("All ".concat(label, " mirrors are unreachable: ").concat(lastError ? lastError.message : 'no mirror configured'));
        case 29:
        case "end":
          return _context2.stop();
      }
    }, _callee2, null, [[2, 22, 25, 28], [6, 14]]);
  }));
  return function resolveMirror(_x2, _x3, _x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

// get a user's bangumi list
var getBangumiList = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(bgmtv_uid, apiBase) {
    var wantWatch, watching, watched, offset, total, req, _iterator2, _step2, i, subject_id, updated_at;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) switch (_context3.prev = _context3.next) {
        case 0:
          wantWatch = []; // type=1
          watching = []; // type=3
          watched = []; // type=2
          if (!bgmtv_uid) {
            _context3.next = 17;
            break;
          }
          offset = 0;
          total = 0;
        case 6:
          _context3.next = 8;
          return fetchWithTimeout("".concat(apiBase, "/v0/users/").concat(bgmtv_uid, "/collections?subject_type=2&limit=").concat(LIMIT, "&offset=").concat(offset), {
            headers: {
              'User-Agent': USER_AGENT
            }
          });
        case 8:
          _context3.next = 10;
          return _context3.sent.json();
        case 10:
          req = _context3.sent;
          // eslint-disable-next-line prefer-destructuring
          total = req.total;
          _iterator2 = _createForOfIteratorHelper(req.data);
          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              i = _step2.value;
              subject_id = i.subject_id, updated_at = i.updated_at;
              if (i.type === 1) {
                wantWatch.push({
                  subject_id: subject_id,
                  updated_at: updated_at
                });
              } else if (i.type === 3) {
                watching.push({
                  subject_id: subject_id,
                  updated_at: updated_at
                });
              } else if (i.type === 2) {
                watched.push({
                  subject_id: subject_id,
                  updated_at: updated_at
                });
              }
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
          offset += LIMIT;
        case 15:
          if (offset < total) {
            _context3.next = 6;
            break;
          }
        case 16:
          log.info("Get bangumi list successfully, found ".concat(total, " bangumis"));
        case 17:
          return _context3.abrupt("return", {
            wantWatch: wantWatch,
            watching: watching,
            watched: watched
          });
        case 18:
        case "end":
          return _context3.stop();
      }
    }, _callee3);
  }));
  return function getBangumiList(_x6, _x7) {
    return _ref3.apply(this, arguments);
  };
}();

// get a bangumi by id
var getBangumi = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(bgm, cachePath, apiBase) {
    var bangumi_id, savedPath, read, req, _item$summary, item, obj;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          bangumi_id = bgm.subject_id;
          savedPath = path.join(cachePath, "/".concat(bangumi_id, ".json"));
          _context4.next = 4;
          return fs.exists(savedPath);
        case 4:
          if (!_context4.sent) {
            _context4.next = 25;
            break;
          }
          _context4.prev = 5;
          _context4.t0 = JSON;
          _context4.next = 9;
          return fs.readFile(savedPath);
        case 9:
          _context4.t1 = _context4.sent;
          _context4.next = 12;
          return _context4.t0.parse.call(_context4.t0, _context4.t1);
        case 12:
          read = _context4.sent;
          if (!(read.id === bangumi_id)) {
            _context4.next = 18;
            break;
          }
          if (!((read === null || read === void 0 ? void 0 : read.eps) > 0)) {
            _context4.next = 16;
            break;
          }
          return _context4.abrupt("return", read);
        case 16:
          _context4.next = 19;
          break;
        case 18:
          throw new Error("Id not match when trying to load id = ".concat(bangumi_id));
        case 19:
          _context4.next = 25;
          break;
        case 21:
          _context4.prev = 21;
          _context4.t2 = _context4["catch"](5);
          // invalid bangumi
          console.error(_context4.t2);
          return _context4.abrupt("return", undefined);
        case 25:
          _context4.prev = 25;
          _context4.next = 28;
          return fetchWithTimeout("".concat(apiBase, "/v0/subjects/").concat(bangumi_id), {
            headers: {
              'User-Agent': USER_AGENT
            }
          });
        case 28:
          req = _context4.sent;
          if (!(req.status === 200)) {
            _context4.next = 36;
            break;
          }
          _context4.next = 32;
          return req.json();
        case 32:
          item = _context4.sent;
          obj = {
            id: item.id,
            name: item.name,
            name_cn: item.name_cn,
            type: BGMTV_TYPE[item.type],
            image: /\w+\/\w+\/\w+.jpg$/.exec(item.images.common)[0],
            link: "https://bgm.tv/subject/".concat(item.id),
            eps: item.eps,
            collection: item.collection,
            date: item.date,
            summary: (_item$summary = item.summary) === null || _item$summary === void 0 ? void 0 : _item$summary.trim(),
            rating: item.rating,
            updated_at: bgm.updated_at
          };
          fs.writeFile(savedPath, JSON.stringify(obj), function (err) {
            if (err) {
              log.info("Failed to write data to cache/".concat(bangumi_id, ".json"));
              console.error(err);
            }
          });
          return _context4.abrupt("return", obj);
        case 36:
          _context4.next = 43;
          break;
        case 38:
          _context4.prev = 38;
          _context4.t3 = _context4["catch"](25);
          console.log(_context4.t3);
          log.info("Failed to get bangumi (".concat(bangumi_id, "), please check network!"));
          return _context4.abrupt("return", undefined);
        case 43:
          fs.writeFile(savedPath, '{}', function (err) {
            // mark as invalid bangumi
            if (err) {
              log.info("Failed to write data to cache/".concat(bangumi_id, ".json"));
              console.error(err);
            }
          });
          log.info("Get bangumi (".concat(bangumi_id, ") Failed, maybe invalid!"));
        case 45:
        case "end":
          return _context4.stop();
      }
    }, _callee4, null, [[5, 21], [25, 38]]);
  }));
  return function getBangumi(_x8, _x9, _x10) {
    return _ref4.apply(this, arguments);
  };
}();
var getImage = function getImage(image_url, imagesPath, image_level, imageBase) {
  if (image_url && !fs.existsSync("".concat(imagesPath, "/").concat(image_url))) {
    fetch("".concat(imageBase, "/pic/cover/").concat(image_level, "/").concat(image_url), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    }).then(function (res) {
      return res.buffer();
    }).then(function (image) {
      fs.writeFile("".concat(imagesPath, "/").concat(image_url), image, 'binary', function (err) {
        console.error(err);
      });
    });
  }
};
module.exports.getBgmData = /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(bgmtv_uid, download_image, image_level, source_dir) {
    var mirrors,
      apiMirrors,
      imageMirrors,
      bangumisPath,
      cachePath,
      imagesPath,
      pathList,
      _i,
      _pathList,
      i,
      apiProbeUrl,
      _yield$resolveMirror,
      apiBase,
      imageBase,
      bangumiList,
      batch,
      wantWatch,
      watching,
      watched,
      result,
      total,
      succeed,
      failed,
      _args6 = arguments;
    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) switch (_context6.prev = _context6.next) {
        case 0:
          mirrors = _args6.length > 4 && _args6[4] !== undefined ? _args6[4] : {};
          apiMirrors = mirrors.api_mirrors || DEFAULT_API_MIRRORS;
          imageMirrors = mirrors.image_mirrors || DEFAULT_IMAGE_MIRRORS; // create folders if not exist
          bangumisPath = path.join(source_dir, '/_data/bangumis');
          cachePath = path.join(bangumisPath, '/cache');
          imagesPath = path.join(source_dir, '/images/bangumis');
          pathList = [bangumisPath, cachePath, imagesPath];
          for (_i = 0, _pathList = pathList; _i < _pathList.length; _i++) {
            i = _pathList[_i];
            if (!fs.existsSync(i)) {
              fs.mkdirsSync(i);
            }
          }

          // resolve a reachable API mirror, probing top-to-bottom; the chosen base is
          // reused for every subsequent request this run
          apiProbeUrl = function apiProbeUrl(base) {
            if (bgmtv_uid) {
              return "".concat(base, "/v0/users/").concat(bgmtv_uid, "/collections?subject_type=2&limit=1&offset=0");
            }
            return "".concat(base, "/v0/subjects/1");
          };
          _context6.next = 11;
          return resolveMirror(apiMirrors, apiProbeUrl, {
            headers: {
              'User-Agent': USER_AGENT
            }
          }, 'API');
        case 11:
          _yield$resolveMirror = _context6.sent;
          apiBase = _yield$resolveMirror.base;
          if (!download_image) {
            _context6.next = 17;
            break;
          }
          _context6.next = 16;
          return resolveMirror(imageMirrors, function (base) {
            return "".concat(base, "/pic/cover/").concat(image_level, "/");
          }, {
            method: 'GET'
          }, 'image');
        case 16:
          imageBase = _context6.sent.base;
        case 17:
          if (!bgmtv_uid) {
            _context6.next = 23;
            break;
          }
          _context6.next = 20;
          return getBangumiList(bgmtv_uid, apiBase);
        case 20:
          _context6.t0 = _context6.sent;
          _context6.next = 26;
          break;
        case 23:
          _context6.next = 25;
          return JSON.parse(fs.readFileSync(path.join(bangumisPath, '/index.json')));
        case 25:
          _context6.t0 = _context6.sent;
        case 26:
          bangumiList = _context6.t0;
          if (bgmtv_uid) {
            fs.writeFile(path.join(bangumisPath, '/index.json'), JSON.stringify(bangumiList), function (err) {
              if (err) {
                log.info('Failed to write data to bangumis/index.json');
                console.error(err);
              }
            });
          }

          // for each bangumi, get its information in detail
          batch = /*#__PURE__*/function () {
            var _ref6 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(list) {
              var result, _iterator3, _step3, item, info;
              return _regenerator["default"].wrap(function _callee5$(_context5) {
                while (1) switch (_context5.prev = _context5.next) {
                  case 0:
                    result = [];
                    _iterator3 = _createForOfIteratorHelper(list);
                    _context5.prev = 2;
                    _iterator3.s();
                  case 4:
                    if ((_step3 = _iterator3.n()).done) {
                      _context5.next = 12;
                      break;
                    }
                    item = _step3.value;
                    _context5.next = 8;
                    return getBangumi(item, cachePath, apiBase);
                  case 8:
                    info = _context5.sent;
                    if (info) {
                      result.push(info);
                      if (download_image) {
                        getImage(info.image, imagesPath, image_level, imageBase);
                      }
                      log.info("Get bangumi \u300A".concat(info.name_cn || info.name, "\u300B (").concat(info.id, ") Success!"));
                    }
                  case 10:
                    _context5.next = 4;
                    break;
                  case 12:
                    _context5.next = 17;
                    break;
                  case 14:
                    _context5.prev = 14;
                    _context5.t0 = _context5["catch"](2);
                    _iterator3.e(_context5.t0);
                  case 17:
                    _context5.prev = 17;
                    _iterator3.f();
                    return _context5.finish(17);
                  case 20:
                    return _context5.abrupt("return", result);
                  case 21:
                  case "end":
                    return _context5.stop();
                }
              }, _callee5, null, [[2, 14, 17, 20]]);
            }));
            return function batch(_x15) {
              return _ref6.apply(this, arguments);
            };
          }();
          _context6.next = 31;
          return batch(bangumiList.wantWatch);
        case 31:
          wantWatch = _context6.sent.sort(function (a, b) {
            return a.updated_at - b.updated_at;
          });
          _context6.next = 34;
          return batch(bangumiList.watching);
        case 34:
          watching = _context6.sent.sort(function (a, b) {
            return a.updated_at - b.updated_at;
          });
          _context6.next = 37;
          return batch(bangumiList.watched);
        case 37:
          watched = _context6.sent.sort(function (a, b) {
            return a.updated_at - b.updated_at;
          });
          result = {
            wantWatch: wantWatch,
            watching: watching,
            watched: watched
          };
          fs.writeFile(path.join(bangumisPath, '/bangumis.json'), JSON.stringify(result), function (err) {
            if (err) {
              log.info('Failed to write data to cache/bangumis.json');
              console.error(err);
            }
          });
          total = bangumiList.wantWatch.length + bangumiList.watching.length + bangumiList.watched.length;
          succeed = result.wantWatch.length + result.watching.length + result.watched.length;
          failed = total - succeed;
          log.info("Generated bangumis.json, total ".concat(total, " bangumis, ").concat(succeed, " succeed, ").concat(failed, " failed"));
        case 44:
        case "end":
          return _context6.stop();
      }
    }, _callee6);
  }));
  return function (_x11, _x12, _x13, _x14) {
    return _ref5.apply(this, arguments);
  };
}();

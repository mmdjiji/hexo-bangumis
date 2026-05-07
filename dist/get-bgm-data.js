"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));
var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
/* eslint-disable no-underscore-dangle */
var fs = require('hexo-fs');
var path = require('path');
var fetch = require('node-fetch');
var log = require('hexo-log')({
  debug: false,
  silent: false
});
var LIMIT = 100;
var USER_AGENT = 'mmdjiji/hexo-bangumis (https://github.com/mmdjiji/hexo-bangumis)';
var BGMTV_TYPE = {
  1: '书籍',
  2: '动画',
  3: '音乐',
  4: '游戏',
  6: '三次元'
};

// get a user's bangumi list
var getBangumiList = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(bgmtv_uid) {
    var wantWatch, watching, watched, offset, total, req, _iterator, _step, i, subject_id, updated_at;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) switch (_context.prev = _context.next) {
        case 0:
          wantWatch = []; // type=1
          watching = []; // type=3
          watched = []; // type=2
          if (!bgmtv_uid) {
            _context.next = 17;
            break;
          }
          offset = 0;
          total = 0;
        case 6:
          _context.next = 8;
          return fetch("https://api.bgm.tv/v0/users/".concat(bgmtv_uid, "/collections?subject_type=2&limit=").concat(LIMIT, "&offset=").concat(offset), {
            headers: {
              'User-Agent': USER_AGENT
            }
          });
        case 8:
          _context.next = 10;
          return _context.sent.json();
        case 10:
          req = _context.sent;
          // eslint-disable-next-line prefer-destructuring
          total = req.total;
          _iterator = _createForOfIteratorHelper(req.data);
          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              i = _step.value;
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
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
          offset += LIMIT;
        case 15:
          if (offset < total) {
            _context.next = 6;
            break;
          }
        case 16:
          log.info("Get bangumi list successfully, found ".concat(total, " bangumis"));
        case 17:
          return _context.abrupt("return", {
            wantWatch: wantWatch,
            watching: watching,
            watched: watched
          });
        case 18:
        case "end":
          return _context.stop();
      }
    }, _callee);
  }));
  return function getBangumiList(_x) {
    return _ref.apply(this, arguments);
  };
}();

// get a bangumi by id
// jsdelivr -> raw -> bgmtv
var getBangumi = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(bgm, cachePath) {
    var bangumi_id, savedPath, read, req, _item$summary, item, obj;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) switch (_context2.prev = _context2.next) {
        case 0:
          bangumi_id = bgm.subject_id;
          savedPath = path.join(cachePath, "/".concat(bangumi_id, ".json"));
          _context2.next = 4;
          return fs.exists(savedPath);
        case 4:
          if (!_context2.sent) {
            _context2.next = 25;
            break;
          }
          _context2.prev = 5;
          _context2.t0 = JSON;
          _context2.next = 9;
          return fs.readFile(savedPath);
        case 9:
          _context2.t1 = _context2.sent;
          _context2.next = 12;
          return _context2.t0.parse.call(_context2.t0, _context2.t1);
        case 12:
          read = _context2.sent;
          if (!(read.id === bangumi_id)) {
            _context2.next = 18;
            break;
          }
          if (!((read === null || read === void 0 ? void 0 : read.eps) > 0)) {
            _context2.next = 16;
            break;
          }
          return _context2.abrupt("return", read);
        case 16:
          _context2.next = 19;
          break;
        case 18:
          throw new Error("Id not match when trying to load id = ".concat(bangumi_id));
        case 19:
          _context2.next = 25;
          break;
        case 21:
          _context2.prev = 21;
          _context2.t2 = _context2["catch"](5);
          // invalid bangumi
          console.error(_context2.t2);
          return _context2.abrupt("return", undefined);
        case 25:
          _context2.prev = 25;
          _context2.next = 28;
          return fetch("https://api.bgm.tv/v0/subjects/".concat(bangumi_id), {
            headers: {
              'User-Agent': USER_AGENT
            }
          });
        case 28:
          req = _context2.sent;
          if (!(req.status === 200)) {
            _context2.next = 36;
            break;
          }
          _context2.next = 32;
          return req.json();
        case 32:
          item = _context2.sent;
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
          return _context2.abrupt("return", obj);
        case 36:
          _context2.next = 43;
          break;
        case 38:
          _context2.prev = 38;
          _context2.t3 = _context2["catch"](25);
          console.log(_context2.t3);
          log.info("Failed to get bangumi (".concat(bangumi_id, "), please check network!"));
          return _context2.abrupt("return", undefined);
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
          return _context2.stop();
      }
    }, _callee2, null, [[5, 21], [25, 38]]);
  }));
  return function getBangumi(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();
var getImage = function getImage(image_url, imagesPath, image_level) {
  if (image_url && !fs.existsSync("".concat(imagesPath, "/").concat(image_url))) {
    fetch("https://lain.bgm.tv/pic/cover/".concat(image_level, "/").concat(image_url), {
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
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(bgmtv_uid, download_image, image_level, source_dir) {
    var bangumisPath, cachePath, imagesPath, pathList, _i, _pathList, i, bangumiList, batch, wantWatch, watching, watched, result, total, succeed, failed;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) switch (_context4.prev = _context4.next) {
        case 0:
          // create folders if not exist
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

          // get user's bangumi list
          if (!bgmtv_uid) {
            _context4.next = 11;
            break;
          }
          _context4.next = 8;
          return getBangumiList(bgmtv_uid);
        case 8:
          _context4.t0 = _context4.sent;
          _context4.next = 14;
          break;
        case 11:
          _context4.next = 13;
          return JSON.parse(fs.readFileSync(path.join(bangumisPath, '/index.json')));
        case 13:
          _context4.t0 = _context4.sent;
        case 14:
          bangumiList = _context4.t0;
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
            var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(list) {
              var result, _iterator2, _step2, item, info;
              return _regenerator["default"].wrap(function _callee3$(_context3) {
                while (1) switch (_context3.prev = _context3.next) {
                  case 0:
                    result = [];
                    _iterator2 = _createForOfIteratorHelper(list);
                    _context3.prev = 2;
                    _iterator2.s();
                  case 4:
                    if ((_step2 = _iterator2.n()).done) {
                      _context3.next = 12;
                      break;
                    }
                    item = _step2.value;
                    _context3.next = 8;
                    return getBangumi(item, cachePath);
                  case 8:
                    info = _context3.sent;
                    if (info) {
                      result.push(info);
                      if (download_image) {
                        getImage(info.image, imagesPath, image_level);
                      }
                      log.info("Get bangumi \u300A".concat(info.name_cn || info.name, "\u300B (").concat(info.id, ") Success!"));
                    }
                  case 10:
                    _context3.next = 4;
                    break;
                  case 12:
                    _context3.next = 17;
                    break;
                  case 14:
                    _context3.prev = 14;
                    _context3.t0 = _context3["catch"](2);
                    _iterator2.e(_context3.t0);
                  case 17:
                    _context3.prev = 17;
                    _iterator2.f();
                    return _context3.finish(17);
                  case 20:
                    return _context3.abrupt("return", result);
                  case 21:
                  case "end":
                    return _context3.stop();
                }
              }, _callee3, null, [[2, 14, 17, 20]]);
            }));
            return function batch(_x8) {
              return _ref4.apply(this, arguments);
            };
          }();
          _context4.next = 19;
          return batch(bangumiList.wantWatch);
        case 19:
          wantWatch = _context4.sent.sort(function (a, b) {
            return a.updated_at - b.updated_at;
          });
          _context4.next = 22;
          return batch(bangumiList.watching);
        case 22:
          watching = _context4.sent.sort(function (a, b) {
            return a.updated_at - b.updated_at;
          });
          _context4.next = 25;
          return batch(bangumiList.watched);
        case 25:
          watched = _context4.sent.sort(function (a, b) {
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
        case 32:
        case "end":
          return _context4.stop();
      }
    }, _callee4);
  }));
  return function (_x4, _x5, _x6, _x7) {
    return _ref3.apply(this, arguments);
  };
}();

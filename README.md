# hexo-bangumis

[![](https://nodei.co/npm/hexo-bangumis.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/hexo-bangumis)

## 介绍

**为 Hexo 添加 [Bangumi](https://bangumi.tv/) 追番页面，参考自 [HCLonely/hexo-bilibili-bangumi](https://github.com/HCLonely/hexo-bilibili-bangumi)**.

## 特色功能

* 使用 [bgm.tv](https://bgm.tv) 的官方 [API](https://github.com/bangumi/api) 来进行爬取，番剧更多，可用性更高
* 支持数据缓存及番剧封面图本地化，防止因上游服务挂掉导致连锁效应，爬取好番剧后可纯离线场景下部署
* 极端条件下可通过编辑文件来自定义番剧列表，可自定义添加 [bgm.tv](https://bgm.tv) 没有的番剧
* 总的来说，只要你爬取过这个番剧，那么就算将来 [bgm.tv](https://bgm.tv) 上把这个番剧删掉了，你也可以继续使用这个番剧

## 预览

![](img/preview.png)

## 安装

在 Hexo 文件夹下执行:
```bash
$ npm install hexo-bangumis --save
```

## 配置

将下面的配置写入 **站点** 的配置文件 `_config.yml` 中:

``` yaml
bangumis:
  enable: true              # 是否启用
  path: bangumis/index.html # 生成追番页面的路径
  show: 1                   # 想看，在看，看完
  title: '追番列表'          # 标题
  quote: '生命不息，追番不止' # 格言
  color_meta: "#555"        # 追番项元数据的颜色
  color_summary: "#555"     # 追番项简介的颜色
  bgmtv_uid: mmdjiji        # bgm.tv的uid
  download_image: true      # 下载图片并使用本地图片，否则使用bgm.tv提供的网络图源
  image_level: c            # 图片高清等级 (l, c, m, s, g)
  lazyload: true            # 是否开启懒加载
  margin: 20px              # 封面图的偏移量微调
  api_mirrors:              # API 镜像站列表，从上往下依次探测，遇到不可达自动切换下一个
    # - https://bgmapi.anibt.net
    - https://api.bgm.tv
  image_mirrors:            # 图片 CDN 镜像站列表，规则同上
    # - https://bgmimg.anibt.net
    - https://lain.bgm.tv
```

> 由于 [bgm.tv](https://bgm.tv) 在部分网络环境下不可达，可在 `api_mirrors` / `image_mirrors` 中按优先级填入镜像站地址。
> 抓取数据 (`hexo bangumis -u`) 时会从上往下依次探测可达性，选用第一个能连通的镜像并在本次运行中复用；全部不可达时会报错提示。
> 两个字段均可省略，省略时使用官方源 `https://api.bgm.tv` 与 `https://lain.bgm.tv`。
>
> **关于图片镜像**：插件不会直接使用 API 返回的完整图片 URL，而是从中提取相对路径（如 `aa/bb/12345.jpg`），再用镜像域名按 `<镜像>/pic/cover/<image_level>/<相对路径>` 重新拼接。因此 `image_mirrors` 中填入的站点必须沿用 [lain.bgm.tv](https://lain.bgm.tv) 的 URL 结构（即同样以 `/pic/cover/{等级}/{相对路径}` 提供封面），`bgmimg.anibt.net` 这类 lain 镜像即满足此要求；URL 结构不同的图床无法直接作为镜像使用。

## 使用

更新追番数据:
```bash
$ hexo bangumis -u
```

删除追番数据:
```
$ hexo bangumis -d
```

## 测试

镜像 fallback 逻辑的测试位于 [`test/mirror.test.js`](test/mirror.test.js)，基于 Node.js 内置的 [`node:test`](https://nodejs.org/api/test.html)（无需额外依赖）。

运行测试:
```bash
$ npm test
```

该命令会依次执行：`npm run build`（重新构建 `dist/`）→ `node --test`（运行测试）→ `ejslint`（检查模板语法）。

测试覆盖以下场景:

* 通过 anibt 镜像抓取真实用户的追番列表
* 首个镜像不可达时，自动 fallback 到下一个镜像
* 经图片镜像下载封面（同样验证图片镜像的 fallback）
* 所有镜像均不可达时正确抛错
* 镜像地址带尾部 `/` 时能正确归一化

> ⚠️ 这些测试会**真实联网**访问镜像站（默认 `https://bgmapi.anibt.net` 与 `https://bgmimg.anibt.net`），因此需要网络环境可达对应镜像。若因断网或镜像下线导致失败，属环境问题而非代码缺陷。

## 发版

发版由 GitHub Actions 工作流 [`.github/workflows/publish.yml`](.github/workflows/publish.yml) 自动完成，**推送形如 `1.2.1` 的 tag**（无 `v` 前缀）即触发。

发版步骤（开发者只需做第 1、2 步）：

1. 在 `main` 分支提交代码改动（**不要手动修改 `package.json` 的 `version`**，交由 CI 处理）:
   ```bash
   $ git commit -m "feat: ..."
   $ git push origin main
   ```
2. 打 tag 并推送（tag 名即目标版本号）:
   ```bash
   $ git tag 1.2.1
   $ git push origin 1.2.1
   ```
3. 随后 CI 自动完成：
   * `npm version <tag> --no-git-tag-version` —— 按 tag 设置版本号
   * `npm publish` —— 发布到 npm
   * 将版本号变更 `chore: bump version to <tag>` 提交回 `main`
   * 创建对应的 GitHub Release

> ⚠️ **切勿在打 tag 前手动把 `package.json` 改成目标版本**。CI 的 `npm version <tag>` 在版本未变化时会报 `Version not changed` 并中断发版。版本号始终由 CI 依据 tag 写入。

## 获取 [bgm.tv](https://bgm.tv) 的 uid

登录 [bgm.tv](https://bgm.tv) 后打开控制台（快捷键 `Ctrl` + `Shift` + `J`），输入 `CHOBITS_UID` 后按回车，得到的数字就是 `uid` 啦~

## Lisense

[Apache Licence 2.0](LICENSE)

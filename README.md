# hexo-bangumis

![](https://nodei.co/npm/hexo-bangumis.png?downloads=true&downloadRank=true&stars=true)

## 介绍

**为 Hexo 添加 [Bangumi](https://bangumi.tv/) 追番页面，参考自 [HCLonely/hexo-bilibili-bangumi](https://github.com/HCLonely/hexo-bilibili-bangumi)**.

## 安装

在 Hexo 文件夹下执行:
```bash
$ npm install hexo-bangumis --save
```

## 配置

将下面的配置写入 **站点** 的配置文件 `_config.yml` 中:

``` yaml
bangumis:
  enable: true # 是否启用
  path: bangumis/index.html # 生成追番页面的路径
  show: 1 # 想看，在看，看完
  title: '追番列表' # 标题
  quote: '生命不息，追番不止' # 格言
  color_meta: "#555" # 追番项元数据的颜色
  color_summary: "#555" # 追番项简介的颜色
  bgmtv_uid: mmdjiji # bgm.tv的uid
  download_image: true # 下载图片并使用本地图片，否则使用bgm.tv提供的网络图源

```

## 使用

更新追番数据:
```bash
$ hexo bangumis -u
```

删除追番数据:
```
$ hexo bangumis -d
```

## 获取 [bgm.tv](https://bgm.tv) 的 uid

登录 [bgm.tv](https://bgm.tv) 后打开控制台（快捷键 `Ctrl` + `Shift` + `J`），输入 `CHOBITS_UID` 后按回车，得到的数字就是 `uid` 啦~


## Lisense

[Apache Licence 2.0](LICENSE)

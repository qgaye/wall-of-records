# Record Wall

一个零依赖的亚克力专辑墙原型，使用原生 HTML、CSS、JavaScript 和 Node.js 实现。

在目录内启动自带的本地服务：

```bash
npm start
```

浏览器访问 `http://localhost:8000`。

> 直接打开 `index.html` 仍然可以查看墙面，但网易云歌单导入依赖同源接口，需要通过 `npm start`（或 `node server.js`）启动。

## 调整内容

页面右上角可以切换 `4×2`、`3×3` 和 `3×2` 排列。点击“导入歌单”，粘贴网易云公开歌单链接、官方分享短链或歌单 ID，程序会按当前布局随机抽取对应数量的歌曲，并把专辑封面渲染到墙面。重复导入会重新随机抽取。

`server.js` 负责安全解析网易云链接并代理歌单数据，避免浏览器跨域限制。在 `script.js` 的 `records` 数组中可以修改默认唱片内容；CSS 中的 `.plate-*`、`.plate-reflection` 与 `.screw` 分别负责亚克力结构、环境反射和金属固定钉。

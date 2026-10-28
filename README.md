# Alioth's wiki

Alioth 的个人 Wiki。AI Infra 方向研究生在读中。

网站：https://hachimitu-6221.github.io/

## 内容

仅保留一篇自我介绍：《你好，我是 Alioth》。原有六篇示例文章已移除。

## 本地修改

- `source/src/posts.ts`：文章内容。
- `source/src/App.tsx`：站名、首页与关于页。
- `source/src/index.css`：排版与主题。

进入 `source` 后安装依赖并构建：

```sh
npm ci
npm run dev
npm run build
```

构建会生成自包含 HTML，并自动更新仓库根目录 `index.html`。提交到 `main` 后，GitHub Pages 会自动发布。

根目录的 `index.html` 是发布入口，`.nojekyll` 标记纯静态发布。排版参考 [jyywiki](https://jyywiki.cn/)。

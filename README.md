# Alioth's wiki

Alioth 的个人 Wiki。AI Infra 方向研究生在读中。

网站：<https://hachimitu-6221.github.io/>

## 写文章：只需要 Markdown 和 git

本地仓库：`/Users/alioth/hachimitu-6221.github.io`

1. 在 **`content/posts/`** 新建一个 `.md` 文件。例如 `cuda-gemm.md`（也支持中文文件名）。
2. 写入下面的内容，或者复制 `templates/post.md`。模板默认是草稿，发布前将 `draft` 改为 `false`。
3. 提交并 push。GitHub Actions 会自动构建并发布到 GitHub Pages，不需要你手动运行 npm 或修改网页代码。

````markdown
---
title: CUDA GEMM 学习笔记
date: 2026-10-28
tag: CUDA
excerpt: 从朴素实现到 Shared Memory 优化。
---

## 为什么要优化

这里是正文。支持 **粗体**、列表、表格、引用、任务列表和代码块。

```cuda
__global__ void gemm() {
    // ...
}
```
````

发布命令（在仓库根目录执行）：

```sh
cd /Users/alioth/hachimitu-6221.github.io
git add content
git commit -m "更新文章"
git push
```

到仓库的 **Actions → Publish Alioth wiki** 查看发布进度。通常需要一两分钟；成功后刷新网站即可。格式错误会使构建失败，线上会继续保留上一次成功发布的版本。

也可以在 GitHub 网页上直接新建/编辑 `content/posts/*.md`，提交到 `main` 后同样自动发布。

## 文件与元信息

- `title`：标题；省略时使用正文第一个一级标题，再其次使用文件名。
- `date`：`YYYY-MM-DD`，推荐显式填写；省略时依次使用文件名前缀日期、该文件最近一次 Git 提交日期、本地修改日期。
- `tag`：单个分类，默认“随笔”。
- `excerpt`：文章摘要；省略时从正文提取。
- `slug`：可选的固定网址名称，默认是不带 `.md` 的文件名。只允许文字、数字、连字符和下划线，并以文字或数字开头。子目录下的文章也必须保持 slug 唯一。
- `draft: true`：不进入发布产物、首页、归档或搜索。默认 `false`。注意：草稿文件仍在公开 Git 仓库中，请勿提交隐私内容。

文件头不是必填项，直接写普通 Markdown 也能发布。首页、文章归档、主题筛选、搜索、阅读时间和二/三级标题目录都会自动生成。

图片放到 **`content/images/`**，在 `content/posts/example.md` 中写：

```markdown
![示意图](../images/gemm.png)
[自我介绍](hello-alioth.md)
[跳到正文标题](#为什么要优化)
```

子目录文章的图片路径要对应调整，例如 `posts/cuda/gemm.md` 使用 `../../images/gemm.png`。相对 `.md` 链接会跳到站内文章。Markdown 不执行内嵌 HTML 或脚本。

## 修改外观 / 本地预览（可选）

- `source/src/App.tsx`：站名、页面与 Markdown 渲染。
- `source/src/index.css`：排版与主题。
- `source/scripts/build-content.mjs`：文章收集与校验。
- `.github/workflows/deploy.yml`：自动构建发布。

安装 Node.js 24 后：

```sh
cd source
npm ci
npm run dev
```

打开终端显示的本地地址。修改 Markdown 后会自动刷新预览。

```sh
npm test
npm run build
```

生产产物位于 `source/dist/`。根目录 `index.html` 是本地构建生成的便携副本，不再纳入 Git；GitHub Pages 直接部署 Actions 生成的 `source/dist/`。

排版参考 [jyywiki](https://jyywiki.cn/)。标题使用 Merienda One，正文使用 Kalam，代码使用 Fira Mono。字体通过 Fontsource 随构建打包，预览时不依赖字体 CDN；中文沿用浏览器的后备字体。

代码高亮使用 highlight.js 11.6.0 自带的 Default 主题，与 [jyywiki 的 M2 页面](https://jyywiki.cn/OS/2026/labs/M2.md) 一致。关键字保留深色加粗，类型、字符串与函数名使用暗红色；CUDA 代码按 C++ 高亮。

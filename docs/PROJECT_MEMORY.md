# 项目记忆

更新时间：2026-05-11

## 关键目标

- 项目目标是做一个面向 Zotero 9 的 `xpi` 插件和本地 helper，帮助把指定目录中的 PDF 文献整理到 Zotero，并生成 NotebookLM 友好的导入目录。
- NotebookLM 侧暂不假设存在公开稳定 API。第一版以“Zotero 插件 + 导出中间包”为主，后续可加“浏览器自动化上传器”。
- 需要新建独立 GitHub 仓库；本地目录 `D:\GitHub\codex\02zotero插件开发` 应作为独立 git 仓库管理，不混入外层 `D:\GitHub` 仓库。
- GitHub 远端仓库为 `https://github.com/valeryzhu/zotero2notebookLM.git`，本地 `main` 已推送到 `origin/main`。
- 产品方向更新：插件侧应提供侧边栏，从 Zotero collection 或本地目录中选择一组资料，把 PDF、Zotero 笔记和附件整理并导入 NotebookLM。

## 当前架构决策

- Zotero 插件按 Zotero 9 兼容目标搭建，使用 `manifest.json`、`bootstrap.js` 和 `chrome/content` 资源。
- helper 使用 Node.js 标准库实现，先不引入依赖，降低安装和打包门槛。
- helper 输出 `manifest.json`、`manifest.csv`、`README.md`，并复制 PDF 到 `pdf/` 子目录。
- NotebookLM 网页自动化暂不放进 Zotero 插件进程；后续应通过本地 helper 或独立脚本接 Playwright。
- 不在 Zotero 插件内收集或保存 Google 账号密码。NotebookLM 登录应交给浏览器自身登录态或系统浏览器 profile，插件只检测登录状态并提示用户登录。

## 约定

- 与用户沟通使用中文。
- 重要项目决策写入本文件，普通临时信息不写。
- 如果需要图片、封面、配图素材，优先使用 Unsplash、Pexels、Pixabay 等可免费商用来源。
- 简要引用文献时使用 `(Zhu et al., Nature, 2016)` 格式。

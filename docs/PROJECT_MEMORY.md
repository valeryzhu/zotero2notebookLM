# 项目记忆

更新时间：2026-05-11

## 关键目标

- 项目目标是做一个面向 Zotero 9.0.3+ 的 `xpi` 插件和本地 helper，帮助把 Zotero 条目、本地目录中的 PDF、附件和笔记整理成 NotebookLM 友好的导入包。
- NotebookLM 侧暂不假设存在公开稳定 API。第一版以“Zotero 插件 + 导出中间包”为主，后续可加“浏览器自动化上传器”。
- GitHub 远端仓库为 `https://github.com/valeryzhu/zotero2notebookLM.git`。
- 本地项目目录 `D:\GitHub\codex\02zotero插件开发` 是独立 git 仓库。
- 产品方向：插件侧提供侧边栏，从 Zotero collection、当前选择或本地目录中选择一组资料，把 PDF、Zotero notes 和附件整理为 NotebookLM 可上传内容。

## 当前架构决策

- Zotero 插件按 Zotero 9.0.3 兼容目标搭建，使用 `manifest.json`、`bootstrap.js` 和 `chrome/content/` 资源结构。
- 插件 ID 为 `zotero2notebooklm@valeryzhu.github.io`。
- 参考本机可安装的 Awesome GPT 后，XPI 顶层包含 `manifest.json`、`install.rdf`、`chrome.manifest`、`bootstrap.js`、`prefs.js`。
- 在 `bootstrap.js` 中通过 `amIAddonManagerStartup.registerChrome()` 注册 `content zotero2notebooklm chrome/content/`。
- 对 Zotero 9.0.3 的实测结论：本项目 XPI 不带 `applications.zotero.update_url` 时，Add-on Manager 会在临时 profile 中忽略该 XPI，手动安装时表现为“不兼容/无法安装”。加入 `update_url` 后，同一包可进入 `extensions.json` 且 `appDisabled=false`。
- `manifest.json` 当前使用 `strict_min_version=6.999`、`strict_max_version=10.*`，并带 `update_url=https://raw.githubusercontent.com/valeryzhu/zotero2notebookLM/main/updates.json`。
- helper 使用 Node.js 标准库实现，先不引入依赖，降低安装和打包门槛。
- helper 输出 `manifest.json`、`manifest.csv`、`README.md`，并复制 PDF 到 `pdf/` 子目录。
- NotebookLM 网页自动化暂不放进 Zotero 插件进程；后续应通过本地 helper 或独立脚本接 Playwright。
- 不在 Zotero 插件内收集或保存 Google 账号密码。NotebookLM 登录交给浏览器自身登录态或系统浏览器 profile，插件只检测登录状态并提示用户登录。

## 约定

- 与用户沟通使用中文。
- 重要项目决策写入本文档，普通临时信息不写。
- 如需图片、封面、配图素材，优先使用 Unsplash、Pexels、Pixabay 等可免费商用来源。
- 简要引用文献时使用 `(Zhu et al., Nature, 2016)` 格式。

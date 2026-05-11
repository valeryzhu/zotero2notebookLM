# 项目记忆

更新时间：2026-05-11

## 关键目标

- 项目目标是做一个面向 Zotero 9.0.3+ 的 `xpi` 插件和本地 helper，帮助把 Zotero 条目、本地目录中的 PDF、附件和笔记整理成 NotebookLM 友好的导入包。
- NotebookLM 侧暂不假设存在公开稳定 API。当前以“Zotero 插件 + 导出中间包”为主，后续可加“浏览器自动化上传器”。
- GitHub 远端仓库为 `https://github.com/valeryzhu/zotero2notebookLM.git`。
- 本地项目目录 `D:\GitHub\codex\02zotero插件开发` 是独立 git 仓库。

## 当前架构决策

- Zotero 插件按 Zotero 9.0.3 兼容目标搭建，使用 `manifest.json`、`bootstrap.js` 和 `chrome/content/` 资源结构。
- 插件 ID 为 `zotero2notebooklm@valeryzhu.github.io`。
- XPI 顶层包含 `manifest.json`、`install.rdf`、`chrome.manifest`、`bootstrap.js`、`prefs.js`。
- 在 `bootstrap.js` 中通过 `amIAddonManagerStartup.registerChrome()` 注册 `content zotero2notebooklm chrome/content/`。
- Zotero 9.0.3 实测：本项目 XPI 不带 `applications.zotero.update_url` 时，Add-on Manager 会在临时 profile 中忽略该 XPI，手动安装时表现为“不兼容/无法安装”。加入 `update_url` 后，同一包可进入 `extensions.json` 且 `appDisabled=false`。
- `manifest.json` 当前使用 `strict_min_version=6.999`、`strict_max_version=10.*`，并带 `update_url=https://raw.githubusercontent.com/valeryzhu/zotero2notebookLM/main/updates.json`。
- v0.1.4 已在 Zotero 插件内实现基础导出包：来源为 selection、collection 或本地目录；输出 `pdf/`、`notes/`、`manifest.json`、`manifest.csv`、`README.md`。
- v0.1.4 在 Zotero collection 右键菜单加入 `导出到 NotebookLM...` 入口，并新增 helper 命令 `notebooklm-import`，用于调用本机 `nlm` CLI 创建同名 NotebookLM notebook 并导入目录内文件。
- 插件导出 Zotero notes 时先转成纯文本；NotebookLM 网页自动化暂不放进 Zotero 插件进程，后续通过本地 helper 或独立 Playwright 脚本接入。
- 不在 Zotero 插件内收集或保存 Google 账号密码。NotebookLM 登录交给浏览器自身登录态或系统浏览器 profile。

## 约定

- 与用户沟通使用中文。
- 重要项目决策写入本文档，普通临时信息不写。
- 如需图片、封面、配图素材，优先使用 Unsplash、Pexels、Pixabay 等可免费商用来源。
- 简要引用文献时使用 `(Zhu et al., Nature, 2016)` 格式。

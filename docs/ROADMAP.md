# Roadmap

## v0.1 骨架

- [x] 独立项目结构。
- [x] Zotero 9 插件基础文件。
- [x] 本地 helper 扫描 PDF 并生成 NotebookLM 导入包。
- [x] XPI 打包脚本。
- [x] GitHub 仓库创建脚本。

## v0.2 Zotero 内功能

- [x] Zotero 侧边栏 UI。
- [x] 扫描当前 collection 或当前选中条目的 PDF/notes 数量。
- [x] 选择本地目录并生成 helper 命令。
- [ ] 递归扫描 PDF。
- [ ] 导出 Zotero notes。
- [ ] 导入 PDF 到指定 collection。
- [ ] 调用 Zotero metadata retrieval。
- [ ] 从 Zotero items 导出 NotebookLM manifest。

## v0.3 Helper 增强

- [x] 递归扫描 PDF。
- [x] 扫描 TXT、Markdown、HTML 笔记文件。
- [x] 生成 `pdf/`、`notes/`、`manifest.json`、`manifest.csv` 和 README。
- [ ] 文件名规范化策略可配置。
- [ ] DOI/标题/作者元数据提取。
- [ ] 跳过重复 PDF。
- [ ] 支持 dry-run 和差异报告。

## v0.4 NotebookLM 自动化

- [ ] 不在插件中保存 Google 密码，仅复用浏览器登录态。
- [ ] Playwright 登录状态复用。
- [ ] 打开指定 NotebookLM notebook。
- [ ] 批量上传 PDF。
- [ ] 批量上传 Zotero notes 导出的文本文件。
- [ ] 失败重试和上传结果报告。

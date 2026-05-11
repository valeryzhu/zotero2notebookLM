# 功能设计草案

更新时间：2026-05-11

## 产品目标

在 Zotero 9 中选择一个资料范围，把其中的 PDF、Zotero 笔记和相关附件整理成 NotebookLM 可使用的资料源，并尽量自动上传到指定 NotebookLM notebook。

## 安全边界

- 插件内不输入、不保存 Google 账号或密码。
- 登录 NotebookLM 使用系统浏览器或 Playwright 持久化浏览器 profile 的现有登录态。
- 插件只显示登录状态、打开登录页、提示用户在浏览器中完成登录。
- 后续如支持 OAuth，只在 Google 官方 OAuth 流程和明确授权范围内实现；当前不把它作为 v1 依赖。

## 核心用户流程

1. 用户打开 Zotero 侧边栏。
2. 选择资料来源：
   - 当前 Zotero collection。
   - 当前选中的 Zotero 条目。
   - 本地目录。
3. 插件扫描资料：
   - PDF 附件。
   - Zotero 笔记。
   - 可转文本的附件，如 `.txt`、`.md`、`.docx`，后续扩展。
4. 用户选择 NotebookLM 目标：
   - 生成本地导入包。
   - 上传到已存在 notebook。
   - 新建 notebook 后上传。
5. 插件展示进度、跳过项和失败项。
6. 完成后保存导入报告。

## v1 必做功能

- Zotero 侧边栏 UI。已完成基础入口。
- 选择 Zotero collection 或本地目录。已完成基础入口和扫描计数。
- 递归扫描 PDF。helper 已完成。
- 扫描 note-like 文件：`.txt`、`.md`、`.markdown`、`.html`、`.htm`。helper 已完成。
- 导出 Zotero notes 为 Markdown 或纯文本。
- 生成 NotebookLM 导入包。helper 已完成基础版：
  - `pdf/`
  - `notes/`
  - `manifest.json`
  - `manifest.csv`
  - `README.md`
- 文件去重和文件名规范化。
- 导入报告：成功、跳过、失败、原因。

## v1 可选功能

- 调用本地 helper 打开浏览器，进入 NotebookLM。
- 使用浏览器登录态上传 PDF 和 notes。
- 支持选择“新建 NotebookLM notebook”或“上传到现有 notebook”。

## 后续增强

- 从 Zotero 条目读取 DOI、标题、作者、期刊、年份，写入 manifest。
- 对每篇论文生成简短来源说明文本，帮助 NotebookLM 识别上下文。
- 支持 EPUB、DOCX、网页快照、Markdown。
- 失败重试和断点续传。
- 上传前预估 NotebookLM 文件数量和大小限制。
- 多 notebook 批量创建：按 collection 自动拆分。

## 关键技术问题

- NotebookLM 是否有稳定公开导入 API仍需持续确认。
- 若只能做网页自动化，必须把选择器、登录态和上传流程隔离在 helper 中，避免 Zotero 插件频繁改动。
- Zotero 侧的本地文件权限、外部进程调用和侧边栏实现需要单独验证。

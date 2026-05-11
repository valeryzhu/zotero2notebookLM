# Zotero NotebookLM Bridge

这是一个面向 Zotero 9.0.3+ 的 Zotero 插件和本地 helper 项目。目标是把 Zotero 条目、本地目录中的 PDF、附件和笔记整理成 NotebookLM 友好的导入包，后续再接浏览器自动化上传。

当前不承诺直接调用 NotebookLM 官方 API，因为尚未确认 NotebookLM 提供公开、稳定的批量导入 API。第一版采用更稳的两段式流程：

1. Zotero 插件：在 Zotero 中提供侧边栏入口，扫描当前选中条目或 collection 中的 PDF 和 notes。
2. 本地 helper：把 PDF 和 note-like 文本文件整理到导入目录，生成 `manifest.json`、`manifest.csv` 和说明文件。后续可接 Playwright 上传器。

## 目录结构

- `zotero-plugin/`：Zotero 9.0.3+ XPI 插件源码，包含侧边栏 UI。
- `helper/`：本地 Node.js CLI helper，支持 PDF、TXT、Markdown、HTML。
- `scripts/`：XPI 打包、GitHub 仓库创建等脚本。
- `docs/`：项目记忆、路线图和开发说明。
- `samples/`：本地测试输入样例目录。
- `dist/`：构建产物，已加入 `.gitignore`。
- `outputs/`：helper 输出目录，已加入 `.gitignore`。

## 常用命令

```powershell
npm install
npm run check
npm run build
node .\helper\src\cli.js prepare --input .\samples\input --output .\outputs\notebooklm-import
```

构建 XPI：

```powershell
npm run build:xpi
```

构建结果在 `dist/zotero-notebooklm-bridge.xpi`。开发时可在 Zotero 的 Add-ons 页面中通过 `Install Add-on From File...` 安装该 XPI。

## 账号策略

插件内不输入、不保存 Google 账号或密码。NotebookLM 登录交给浏览器自身登录态或后续的本地 Playwright helper 复用浏览器 profile。

## 当前能力

- Zotero 插件侧边栏入口。
- 扫描当前 Zotero selection 或 collection 中的 PDF 附件和 Zotero notes 数量。
- 选择本地目录，并生成 helper 命令。
- 本地 helper 可扫描 PDF、TXT、Markdown、HTML，并生成 NotebookLM 导入包。

尚未实现：

- Zotero 内部一键导出附件和 notes 到 helper。
- 元数据提取和去重。
- NotebookLM 网页自动化上传。

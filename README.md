# Zotero NotebookLM Bridge

这是一个面向 Zotero 9.0.3+ 的 Zotero 插件和本地 helper 项目。目标是把 Zotero 条目、本地目录中的 PDF、附件和笔记整理成 NotebookLM 友好的导入包，后续再接浏览器自动化上传。

当前不承诺直接调用 NotebookLM 官方 API，因为尚未确认 NotebookLM 提供公开、稳定的批量导入 API。第一版采用更稳的两段式流程：

1. Zotero 插件：在 Zotero 中提供侧边栏入口，扫描当前选中条目、collection 或本地目录。
2. 导入包生成：导出 PDF 和 notes 到 `pdf/`、`notes/`，并生成 `manifest.json`、`manifest.csv` 和 `README.md`。

## 目录结构

- `zotero-plugin/`：Zotero 9.0.3+ XPI 插件源码，包含侧边栏 UI 和基础导出功能。
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

## 插件基础功能

- 打开 Zotero 侧边栏入口 `NotebookLM Bridge`。
- 在 collection 右键菜单中点击 `导出到 NotebookLM...`。
- 来源支持当前选中条目、当前 collection、本地目录。
- 扫描并导出 PDF 附件。
- 导出 Zotero notes 为纯文本。
- 本地目录支持 `.pdf`、`.txt`、`.md`、`.markdown`、`.html`、`.htm`。
- 输出 NotebookLM 导入包，包含 `pdf/`、`notes/`、`manifest.json`、`manifest.csv`、`README.md`。

## NotebookLM 直导

NotebookLM 直导通过本机外部 CLI 完成，插件不保存 Google 账号。先安装并登录一个 `nlm` CLI，然后运行：

```powershell
node .\helper\src\cli.js notebooklm-import --input "D:\NotebookLM导入包\CRISPRa" --name "CRISPRa" --cli nlm
```

CLI 会按目录名或 `--name` 创建 NotebookLM notebook，并把目录内支持的 PDF 和 notes 逐个加入。

## 账号策略

插件内不输入、不保存 Google 账号或密码。NotebookLM 登录交给浏览器自身登录态或后续的本地 Playwright helper 复用浏览器 profile。

## 尚未实现

- 直接从插件进程启动外部 NotebookLM CLI。
- DOI/标题/作者的深度元数据提取和去重策略。
- 直接创建或选择 NotebookLM notebook。

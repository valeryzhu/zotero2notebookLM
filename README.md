# Zotero NotebookLM Bridge

这是一个面向 Zotero 7+ / 9 的项目骨架，目标是把本地目录中的 PDF 文献整理成 NotebookLM 友好的导入包，并为后续浏览器自动化上传预留接口。

当前设计不直接承诺调用 NotebookLM 官方 API，因为目前没有确认到公开、稳定的 NotebookLM 批量导入 API。第一版采用更稳的“两段式”流程：

1. Zotero 插件：在 Zotero 中提供侧边栏入口，扫描当前选中条目或 collection 中的 PDF 和 notes。
2. 本地 helper：把 PDF 和 note-like 文本文件整理到导入目录，生成 `manifest.json`、`manifest.csv` 和说明文件，后续可接 Playwright 上传器。

## 目录结构

- `zotero-plugin/`：Zotero 7+ / 9 XPI 插件源码，包含侧边栏 UI。
- `helper/`：本地 Node.js CLI helper，支持 PDF、TXT、Markdown、HTML。
- `scripts/`：打包 XPI、创建 GitHub 仓库等脚本。
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

创建 GitHub 仓库需要先安装并登录 GitHub CLI：

```powershell
winget install --id GitHub.cli
gh auth login
npm run github:init
```

默认会创建私有仓库 `zotero-notebooklm-bridge`。可以通过参数改名：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\create-github-repo.ps1 -RepoName my-repo-name -Visibility private
```

## Zotero 插件开发

构建 XPI：

```powershell
npm run build:xpi
```

构建结果在 `dist/zotero-notebooklm-bridge.xpi`。开发时可在 Zotero 的 Add-ons 页面中通过 “Install Add-on From File...” 安装该 XPI。

## 当前能力

- 已有 Zotero 插件侧边栏入口。
- 可扫描当前 Zotero selection 或 collection 中的 PDF 附件和 Zotero notes 数量。
- 可选择本地目录，并生成 helper 命令。
- 已有本地 helper，可扫描 PDF、TXT、Markdown、HTML 并生成 NotebookLM 导入包。
- 尚未实现 Zotero 内部一键导出附件到 helper、元数据抓取和 NotebookLM 网页自动化上传。
- NotebookLM 自动上传会作为独立 helper 功能加入，避免网页结构变化影响 Zotero 插件主体。

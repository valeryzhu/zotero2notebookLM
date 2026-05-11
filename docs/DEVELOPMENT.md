# Development Notes

## 本地要求

- Node.js 22 或更高版本。
- PowerShell 5+。
- Zotero 9。
- 可选：GitHub CLI `gh`，用于创建远端仓库。

## 构建 XPI

```powershell
npm run build:xpi
```

脚本会把 `zotero-plugin/` 下的内容压缩成 `dist/zotero-notebooklm-bridge.xpi`。

## Helper CLI

```powershell
npm run helper -- prepare --input .\samples\input --output .\outputs\notebooklm-import
```

输出目录结构：

```text
outputs/notebooklm-import/
  README.md
  manifest.csv
  manifest.json
  pdf/
```

## GitHub 仓库

本机需要先安装 GitHub CLI：

```powershell
winget install --id GitHub.cli
gh auth login
```

然后运行：

```powershell
npm run github:init
```

如果仓库还没有首个 commit，该脚本会提交当前项目骨架后再创建远端并推送。

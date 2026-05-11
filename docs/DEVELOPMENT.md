# Development Notes

## 本地要求

- Node.js 22 或更高版本。
- PowerShell 5+。
- Zotero 9.0.3 或更高版本。
- 可选：GitHub CLI `gh`，用于创建或管理远端仓库。

## 构建 XPI

```powershell
npm run build:xpi
```

脚本会把 `zotero-plugin/` 下的内容压缩成 `dist/zotero-notebooklm-bridge.xpi`。

## 安装兼容性

Zotero 9.0.3 本地实测需要 `manifest.json` 中包含：

```json
{
  "applications": {
    "zotero": {
      "id": "zotero2notebooklm@valeryzhu.github.io",
      "update_url": "https://raw.githubusercontent.com/valeryzhu/zotero2notebookLM/main/updates.json",
      "strict_min_version": "6.999",
      "strict_max_version": "10.*"
    }
  }
}
```

没有 `update_url` 时，本项目 XPI 在临时 Zotero profile 中不会进入 `extensions.json`，手动安装也会表现为“不兼容/无法安装”。加入 `update_url` 后，同一插件包可被 Zotero 识别。

## Helper CLI

```powershell
node .\helper\src\cli.js prepare --input .\samples\input --output .\outputs\notebooklm-import
```

当前支持的输入文件：

- PDF: `.pdf`
- 文本笔记: `.txt`
- Markdown: `.md`, `.markdown`
- HTML: `.html`, `.htm`，会转成纯文本

输出目录结构：

```text
outputs/notebooklm-import/
  README.md
  manifest.csv
  manifest.json
  pdf/
  notes/
```

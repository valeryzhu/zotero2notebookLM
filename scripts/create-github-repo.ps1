param(
    [string]$RepoName = "zotero-notebooklm-bridge",
    [ValidateSet("private", "public", "internal")]
    [string]$Visibility = "private",
    [string]$Description = "Zotero 9 plugin and helper for preparing NotebookLM import packages."
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI 'gh' is not installed. Install it with: winget install --id GitHub.cli"
}

gh auth status | Out-Host

if (-not (Test-Path -LiteralPath ".git")) {
    git init
}

git branch -M main

$hasCommit = $true
git rev-parse --verify HEAD *> $null
if ($LASTEXITCODE -ne 0) {
    $hasCommit = $false
}

if (-not $hasCommit) {
    git add .github .gitignore README.md docs helper package.json scripts zotero-plugin
    git commit -m "Initial project skeleton"
}

$visibilityFlag = "--$Visibility"

gh repo create $RepoName $visibilityFlag --source . --remote origin --description $Description
git push -u origin main

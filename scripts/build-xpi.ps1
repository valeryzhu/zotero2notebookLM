param(
    [string]$SourceDir = "zotero-plugin",
    [string]$DistDir = "dist",
    [string]$OutputName = "zotero-notebooklm-bridge.xpi"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$source = Resolve-Path (Join-Path $root $SourceDir)
$dist = Join-Path $root $DistDir
$output = Join-Path $dist $OutputName
$tempZip = Join-Path $dist ($OutputName -replace "\.xpi$", ".zip")

New-Item -ItemType Directory -Force -Path $dist | Out-Null

if (Test-Path -LiteralPath $output) {
    Remove-Item -LiteralPath $output -Force
}

if (Test-Path -LiteralPath $tempZip) {
    Remove-Item -LiteralPath $tempZip -Force
}

Push-Location $source
try {
    Compress-Archive -Path * -DestinationPath $tempZip -Force
}
finally {
    Pop-Location
}

Move-Item -LiteralPath $tempZip -Destination $output -Force
Write-Host "Built $output"

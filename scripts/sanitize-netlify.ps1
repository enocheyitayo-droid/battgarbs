$ErrorActionPreference = 'Stop'
$stagingRoot = (Resolve-Path -LiteralPath '.netlify').Path
function Assert-StagingPath([string]$candidate) {
    $resolved = [IO.Path]::GetFullPath($candidate)
    if (-not $resolved.StartsWith($stagingRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw 'Path outside deployment staging' }
    return $resolved
}
$privatePattern = '^\.env(?:$|\.(?:local|production|production\.local|deploy-private)$)'
$functionRoot = Assert-StagingPath (Join-Path $stagingRoot 'functions-internal')
Get-ChildItem -LiteralPath $functionRoot -File -Recurse -Force | Where-Object Name -Match $privatePattern | ForEach-Object {
    $target = Assert-StagingPath $_.FullName
    Remove-Item -LiteralPath $target
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archivePath = Assert-StagingPath (Join-Path $stagingRoot 'functions/___netlify-server-handler.zip')
$archive = [IO.Compression.ZipFile]::Open($archivePath, [IO.Compression.ZipArchiveMode]::Update)
try {
    $entries = @($archive.Entries | Where-Object { [IO.Path]::GetFileName($_.FullName) -match $privatePattern })
    foreach ($entry in $entries) { $entry.Delete() }
} finally { $archive.Dispose() }
Write-Output 'Local environment files removed from deployment staging and archive; project originals remain untouched.'

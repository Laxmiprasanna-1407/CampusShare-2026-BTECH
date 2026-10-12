$sourceDir = "C:\JFS\CampusShare"
$zipPath = "C:\JFS\CampusShare\CAMPUSSHARE.zip"

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

$excludePatterns = @(
    "\\node_modules\\",
    "\\target\\",
    "\\dist\\",
    "\\.git\\",
    "\\data\\",
    "\\logs\\",
    "\\.idea\\",
    "\\.vscode\\",
    "\\.antigravity\\",
    "package_zip\\.ps1$",
    "\\.env$",
    "\\.log$",
    "\\.db$",
    "CAMPUSSHARE\\.zip$"
)

$allFiles = Get-ChildItem -Path $sourceDir -Recurse -File

$count = 0
foreach ($file in $allFiles) {
    $relPath = $file.FullName.Substring($sourceDir.Length + 1)
    
    $shouldExclude = $false
    foreach ($pattern in $excludePatterns) {
        if ($file.FullName -match $pattern) {
            $shouldExclude = $true
            break
        }
    }

    if (-not $shouldExclude) {
        # Normalize relative path to forward slashes for cross-platform zip compatibility
        $entryName = $relPath.Replace("\", "/")
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $entryName)
        $count++
    }
}

$zip.Dispose()

Write-Host "Zipped $count files to $zipPath"
$zipItem = Get-Item $zipPath
$sizeBytes = $zipItem.Length
$sizeMB = [math]::Round($sizeBytes / 1MB, 2)
$sha256 = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash

Write-Host "ZIP_PATH=$zipPath"
Write-Host "ZIP_BYTES=$sizeBytes"
Write-Host "ZIP_MB=$sizeMB"
Write-Host "ZIP_SHA256=$sha256"

# Vize teslim paketi: teslim/<OgrenciNo>-WEB.zip ve Teams icin ayni dosyanin .PDF uzantili kopyasi.
# Yalniz site dosyalari girer; node_modules, docs (test goruntuleri), _arsiv, teslim ve .claude disarida kalir.
# Kullanim: npm run package   (ya da: powershell -NoProfile -File scripts/package.ps1)
# Ogrenci numarasi depoya yazilmaz: -OgrenciNo parametresi, OGRENCI_NO ortam degiskeni ya da
# proje kokundeki .ogrenci-no dosyasi (gitignore; tek satir) okunur.
param([string]$OgrenciNo = $env:OGRENCI_NO)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
if (-not $OgrenciNo -and (Test-Path ".ogrenci-no")) { $OgrenciNo = (Get-Content ".ogrenci-no" -TotalCount 1).Trim() }
if (-not $OgrenciNo) { throw "Ogrenci numarasi yok: .ogrenci-no dosyasina yaz ya da -OgrenciNo ver." }

$out = Join-Path $root "teslim"
$stage = Join-Path $out "_paket"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force -Confirm:$false }
New-Item -ItemType Directory -Force $stage | Out-Null

# Pakete girecek klasorler ve dosyalar
$dirs = @("css", "js", "i18n", "data", "assets", "vendor", "partials", "scripts")
$files = @("index.html", "hakkimda.html", "projeler.html", "blog.html", "galeri.html", "iletisim.html", "404.html",
           "favicon.svg", "robots.txt", "llms.txt", "sitemap.xml", "README.md", "CONTENT.md", "CLAUDE.md",
           "package.json", "package-lock.json")

foreach ($d in $dirs) { if (Test-Path $d) { Copy-Item $d -Destination $stage -Recurse } }
foreach ($f in $files) { if (Test-Path $f) { Copy-Item $f -Destination $stage } }
# odev kontrol listesi (etiket -> sayfa:satir) docs icinden tek dosya olarak
New-Item -ItemType Directory -Force (Join-Path $stage "docs") | Out-Null
if (Test-Path "docs/odev-kontrol-listesi.md") { Copy-Item "docs/odev-kontrol-listesi.md" (Join-Path $stage "docs") }

$zip = Join-Path $out "$OgrenciNo-WEB.zip"
$pdf = Join-Path $out "$OgrenciNo-WEB.PDF"
if (Test-Path $zip) { Remove-Item $zip -Force -Confirm:$false }
if (Test-Path $pdf) { Remove-Item $pdf -Force -Confirm:$false }
# Windows'un yerlesik tar araci (bsdtar) standart ZIP yazar: yollar "/" ile (Compress-Archive ve eski .NET
# "\" yazar; Mac/Linux'ta klasorler bozulur). -a: uzantidan bicim secer (.zip)
Push-Location $stage
& tar.exe -a -c -f $zip *
Pop-Location
if (-not (Test-Path $zip)) { throw "ZIP olusturulamadi" }
Add-Type -AssemblyName System.IO.Compression.FileSystem
# Teams .zip kabul etmedigi icin: ayni dosya, uzanti .PDF (icerik ZIP'tir; acmak icin uzantiyi .zip yap)
Copy-Item $zip $pdf
Remove-Item $stage -Recurse -Force -Confirm:$false

$mb = [math]::Round((Get-Item $zip).Length / 1MB, 1)
$z = [IO.Compression.ZipFile]::OpenRead($zip); $n = $z.Entries.Count
$backslash = @($z.Entries | Where-Object { $_.FullName -like "*\*" }).Count; $z.Dispose()
if ($backslash -gt 0) { Write-Output "UYARI: $backslash girdide ters egik cizgi var" }
Write-Output "Paket hazir: $zip ($mb MB, $n dosya)"
Write-Output "Teams kopyasi: $pdf"
if ($mb -gt 300) { Write-Output "UYARI: 300 MB sinirini asiyor!" }

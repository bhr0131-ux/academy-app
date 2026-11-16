# ════════════════════════════════════════════════════════════════════
#  미션팡 최신 웹 코드 → C:\harang-app 반영 스크립트
#  · 바꾸는 것 : src 폴더, public 폴더 안 assets·privacy.html, index.html
#  · 안 건드림 : android 폴더, capacitor.config, 서명키(.jks), package.json, vite.config
#  · 시작하기 전에 지금 상태를 C:\harang-app-backup-날짜시각 폴더에 백업합니다.
#
#  위치: 저장소의 tools\ 폴더 — GitHub 에서 받은 ZIP 을 풀면 그 안에 같이 들어 있다.
#  실행 방법 (PowerShell, 다운로드 폴더에 academy-app-main 으로 풀었을 때):
#    powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\academy-app-main\tools\update-harang-app.ps1"
#  새 코드 = 이 스크립트가 들어 있는 폴더의 바로 위 폴더(압축을 푼 폴더)를 자동으로 쓴다.
#  다른 폴더의 코드를 쓰려면 뒤에 -NewCode "그 폴더" 를 붙이세요.
# ════════════════════════════════════════════════════════════════════
param(
  [string]$NewCode = (Split-Path -Parent $PSScriptRoot),
  [string]$AppDir  = "C:\harang-app"
)
$ErrorActionPreference = "Stop"
function Say($msg, $color = "White") { Write-Host $msg -ForegroundColor $color }
function Fail($msg) { Say "`n[중단] $msg" Red; Read-Host "엔터를 누르면 닫힙니다"; exit 1 }
$utf8 = New-Object System.Text.UTF8Encoding $false

# ── 0. 폴더 확인 ───────────────────────────────────────────────
Say "`n[0/6] 폴더 확인" Cyan
foreach ($p in @("$NewCode\src\App.jsx", "$NewCode\index.html", "$NewCode\public\assets")) {
  if (-not (Test-Path $p)) { Fail "새 코드 폴더가 아닙니다 — '$p' 가 없습니다.`n        압축을 푼 폴더(안에 src, public, index.html 이 있는 폴더)를 -NewCode 로 알려 주세요." }
}
foreach ($p in @("$AppDir\android", "$AppDir\src", "$AppDir\package.json")) {
  if (-not (Test-Path $p)) { Fail "'$p' 가 없습니다. 앱 폴더 경로를 확인해 주세요." }
}
Say "  새 코드 : $NewCode"
Say "  앱 폴더 : $AppDir"

# ── 1. 백업 ────────────────────────────────────────────────────
$stamp  = Get-Date -Format "yyyyMMdd-HHmm"
$backup = "C:\harang-app-backup-$stamp"
Say "`n[1/6] 백업 → $backup" Cyan
New-Item -ItemType Directory -Path $backup | Out-Null
Copy-Item "$AppDir\src" "$backup\src" -Recurse
if (Test-Path "$AppDir\public")     { Copy-Item "$AppDir\public" "$backup\public" -Recurse }
if (Test-Path "$AppDir\index.html") { Copy-Item "$AppDir\index.html" "$backup\index.html" }
Say "  기존 src·public·index.html 백업 완료 (문제가 생기면 이 폴더의 것을 다시 복사해 넣으면 원래대로 돌아갑니다)"

# ── 2. src 교체 (앱 전용 css 는 살린다) ─────────────────────────
Say "`n[2/6] src 교체" Cyan
# 새 코드에 없는 src 바로 아래 css (예: index.css — safe-area 여백) 는 앱 전용이므로 보존
$keepCss = @(Get-ChildItem "$backup\src" -Filter *.css -File | Where-Object { -not (Test-Path "$NewCode\src\$($_.Name)") })
Remove-Item "$AppDir\src" -Recurse -Force
Copy-Item "$NewCode\src" "$AppDir\src" -Recurse
foreach ($f in $keepCss) { Copy-Item $f.FullName "$AppDir\src\$($f.Name)"; Say "  보존: src\$($f.Name)" Green }

# 예전 코드가 보존한 css 를 불러오고 있었다면(import './index.css') 새 main.jsx 맨 위에 똑같이 넣는다.
# main.jsx 뿐 아니라 App.jsx 등 예전 src 의 모든 js/jsx 를 뒤져서 찾는다.
$newMain = "$AppDir\src\main.jsx"
if ($keepCss.Count -gt 0 -and (Test-Path $newMain)) {
  $mainText = [IO.File]::ReadAllText($newMain)
  $add = @()
  foreach ($f in $keepCss) {
    $usedBefore = Get-ChildItem "$backup\src" -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx |
      Select-String -SimpleMatch -Pattern $f.Name -Quiet
    if ($usedBefore -and -not $mainText.Contains($f.Name)) { $add += "import './$($f.Name)';" }
    elseif (-not $usedBefore) { Say "  주의: src\$($f.Name) 는 예전에도 어디서도 불러오지 않던 파일이라 연결하지 않았습니다." Yellow }
  }
  if ($add.Count -gt 0) {
    [IO.File]::WriteAllText($newMain, (($add -join "`r`n") + "`r`n" + $mainText), $utf8)
    foreach ($l in $add) { Say "  main.jsx 맨 위에 연결: $l  (safe-area 여백 유지)" Green }
  }
}
if (-not (Test-Path "$AppDir\src\index.css")) { Say "  주의: index.css 를 찾지 못했습니다 — safe-area 여백 파일이 다른 이름인지 확인이 필요합니다." Yellow }

# ── 3. 그림·폰트 (public\assets) + 개인정보처리방침 교체 ─────────
Say "`n[3/6] public\assets · privacy.html 교체" Cyan
robocopy "$NewCode\public\assets" "$AppDir\public\assets" /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { Fail "그림 파일 복사 실패 (robocopy 코드 $LASTEXITCODE)" }
$global:LASTEXITCODE = 0
if (Test-Path "$NewCode\public\privacy.html") { Copy-Item "$NewCode\public\privacy.html" "$AppDir\public\privacy.html" -Force }
Say "  완료 ($((Get-ChildItem "$AppDir\public\assets" -Recurse -File).Count)개 파일)"

# ── 4. index.html 교체 ─────────────────────────────────────────
Say "`n[4/6] index.html 교체" Cyan
Copy-Item "$NewCode\index.html" "$AppDir\index.html" -Force
Say "  완료"

# ── 5. 개발자 모드(DEV_MODE) ───────────────────────────────────
Say "`n[5/6] 개발자 모드 확인" Cyan
$appJsx = "$AppDir\src\App.jsx"
$appText = [IO.File]::ReadAllText($appJsx)
if ($appText -match "const DEV_MODE = true;") {
  Say "  지금 코드는 DEV_MODE = true (설정에 개발용 치트 패널이 보이는 상태)입니다." Yellow
  $ans = Read-Host "  플레이스토어 출시용이면 꺼야 합니다. 끌까요? (Y/N)"
  if ($ans -match "^[Yy]") {
    [IO.File]::WriteAllText($appJsx, $appText.Replace("const DEV_MODE = true;", "const DEV_MODE = false;"), $utf8)
    Say "  DEV_MODE = false 로 바꿨습니다 (앱 폴더에서만)" Green
  } else { Say "  그대로 둡니다 — 이 상태로는 출시용 AAB 를 만들지 마세요." Yellow }
} else { Say "  DEV_MODE 는 이미 꺼져 있습니다." Green }

# ── 6. 빌드 → 안드로이드 반영 ───────────────────────────────────
Say "`n[6/6] 빌드 → 안드로이드 반영 (1~3분)" Cyan
Push-Location $AppDir
try {
  npm.cmd install;            if ($LASTEXITCODE -ne 0) { Fail "npm install 실패 — 위 빨간 글씨를 캡처해 보내 주세요." }
  npm.cmd run build;          if ($LASTEXITCODE -ne 0) { Fail "웹 빌드 실패 — 위 빨간 글씨를 캡처해 보내 주세요." }
  npx.cmd cap sync android;   if ($LASTEXITCODE -ne 0) { Fail "cap sync 실패 — 위 빨간 글씨를 캡처해 보내 주세요." }
} finally { Pop-Location }

Say "`n[완료] 이제 Android Studio 에서 C:\harang-app\android 를 열고 폰에서 ▶ 로 확인하세요." Green
Say "   백업 폴더: $backup"
Read-Host "엔터를 누르면 닫힙니다"

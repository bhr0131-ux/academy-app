# tools

| 파일 | 하는 일 |
|---|---|
| `app-icon/` | 미션팡 앱 아이콘(과녁) — 안드로이드 `res` 폴더에 그대로 덮어쓸 아이콘 세트와 플레이스토어용 `play-store-icon-512.png`. 원화와 만드는 스크립트는 `art-src/app-icon-target-src.webp` · `art-src/tools/app_icon.py` |
| `update-harang-app.ps1` | 최신 미션팡 웹 코드를 PC의 안드로이드 앱 폴더(`C:\harang-app`)에 반영하고 빌드·`cap sync`까지 한다. android 폴더·Capacitor 설정·서명키는 건드리지 않고, 시작 전에 `C:\harang-app-backup-날짜시각`에 백업한다. |

## 쓰는 법 (Windows)
1. GitHub에서 Code → Download ZIP → 다운로드 폴더에 `academy-app-main`으로 압축 풀기
2. PowerShell에서:
   ```
   powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\academy-app-main\tools\update-harang-app.ps1"
   ```
3. 끝나면 Android Studio에서 `C:\harang-app\android`를 열어 폰으로 확인 → AAB 만들기

※ 웹 빌드(vite)에는 포함되지 않는다 — `public/`·`src/` 밖에 있다.

## 앱 아이콘 넣기 (Windows, 한 번만 — 아이콘을 바꿀 때만 다시)
PowerShell에서 (ZIP을 다운로드 폴더에 `academy-app-main`으로 풀었을 때):
```
Copy-Item "$env:USERPROFILE\Downloads\academy-app-main\tools\app-icon\res\*" "C:\harang-app\android\app\src\main\res" -Recurse -Force
```
그다음 Android Studio에서 ▶. 폰 홈 화면 아이콘이 안 바뀌어 보이면 폰에서 앱을 지웠다 다시 ▶(런처가 아이콘을 기억해 둔다).

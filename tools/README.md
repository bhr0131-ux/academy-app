# tools

| 파일 | 하는 일 |
|---|---|
| `update-harang-app.ps1` | 최신 미션팡 웹 코드를 PC의 안드로이드 앱 폴더(`C:\harang-app`)에 반영하고 빌드·`cap sync`까지 한다. android 폴더·Capacitor 설정·서명키는 건드리지 않고, 시작 전에 `C:\harang-app-backup-날짜시각`에 백업한다. |

## 쓰는 법 (Windows)
1. GitHub에서 Code → Download ZIP → 다운로드 폴더에 `academy-app-main`으로 압축 풀기
2. PowerShell에서:
   ```
   powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\academy-app-main\tools\update-harang-app.ps1"
   ```
3. 끝나면 Android Studio에서 `C:\harang-app\android`를 열어 폰으로 확인 → AAB 만들기

※ 웹 빌드(vite)에는 포함되지 않는다 — `public/`·`src/` 밖에 있다.

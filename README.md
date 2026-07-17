# 미션팡 (MissionPang)

아이 미션·보상 관리 앱. Vite + React, Capacitor 배포.

## 폴더 구조
```
src/
├─ App.jsx                  # 메인 화면·상태 (수정 대부분 여기)
├─ main.jsx                 # 진입점 (건드릴 일 없음)
├─ data/
│  ├─ tokens.js             # 디자인 토큰·색상·테마
│  ├─ gameData.jsx          # 레벨·펫·진화·칭호 + 아일랜드맵
│  ├─ characters.js         # 캐릭터 이미지 경로·보상·상점(꾸미기) 데이터
│  └─ sampleData.js         # 샘플/초기 데이터
├─ utils/dates.js           # 날짜·저장소 유틸
└─ components/
   ├─ helpers.jsx           # 작은 공용 컴포넌트
   └─ Onboarding.jsx        # 온보딩·가이드

public/assets/growth-characters/{adventure|bakery}/{boy|girl}/stage-1~5.webp
```

## 자주 하는 일
- **DEV_MODE 끄기(배포 전 필수)**: `src/App.jsx` 상단 `const DEV_MODE = true` → `false`
- **캐릭터 이미지 교체**: 같은 경로·파일명으로 webp 덮어쓰기 (코드 수정 불필요)
- **상점 아이템 추가/가격 수정**: `src/data/characters.js`
- **테마 색 수정**: `src/data/tokens.js`

## 빌드
GitHub에 커밋하면 Actions가 자동 빌드 → Actions 탭에서 `missionpang-dist` 다운로드
→ Capacitor 프로젝트의 웹 폴더에 넣고 앱 빌드.

## Claude와 작업하는 법
수정할 기능의 파일 1~2개만 업로드하면 됨. 어떤 파일인지 모르면
"○○ 기능 고치고 싶은데 어느 파일이야?"라고 물어보면 알려줌.
q

# art-src — 캐릭터·장비 원화 보관소

ChatGPT로 생성한 **가공 전 원본 이미지**를 보관한다. 배포(dist)에는 포함되지 않으므로
앱 용량에 영향이 없고, 재가공이 필요할 때 이 원화에서 원패스로 다시 만든다.

**규칙**: 사용자가 새 원화를 주면 가공·탑재와 함께 반드시 이 폴더에도 원본을 저장한다.

**보관 형식**: 원본은 **webp(q92)** 로 저장한다. PNG로 두면 저장소가 빠르게 커진다
(58장 63MB → 8MB). 화질 손실은 재가공에 지장 없는 수준.

**아바타 베이스 교체 규칙**: 모자·신발·상의 등 장비 그림은 1024×1024 안에서
'베이스가 있던 자리'에 맞춰 그려져 있다. 그래서 베이스를 새로 넣을 땐 반드시
**현행 베이스의 bbox(키·중심x·발끝)에 맞춰 배율·위치를 잡아야** 장비가 어긋나지 않는다.
현행 기준값 — 남아 x365~657 / y122~935, 여아 x349~673 / y121~936 (중심x 511).
눈 위치(장비 정렬 기준) — 남아 간격 96.8·중심 (512, 321) / 여아 간격 106.8·중심 (510, 303).
얼굴을 덮는 장비(모자 등)의 배율은 **눈 간격이 아니라 '베이스 윤곽선이 안 삐져나오는 최소 배율'** 로
정한다. 눈 간격으로 맞추면 얼굴 폭 비율이 달라 턱선·귀선이 겹쳐 보인다(실제로 겪음).
검증법: 베이스의 검은 윤곽선 픽셀 중 오버레이 밖에 남는 개수를 세어 0이 되는 배율을 찾는다.
  남아 — 0.97배 554개 남음 → 1.05배 0개 (여아는 양갈래가 밖에 남는 게 정상이라 0이 안 된다)
현행 탐험 헬멧 = 원화의 1.05배, 눈 중심 (511, 312)에 정렬.

**정리 이력**: 교체·은퇴된 원본 26개(37MB)는 작업 폴더에서 삭제했다.
필요하면 git 히스토리에서 되살릴 수 있다 — `git log --all --diff-filter=D --name-only -- art-src`

**폰트**: 현재 앱 전체 글씨체는 **카페24 써라운드** 한 종류다 (사용자 확정).
제작사 배포 woff2를 서브셋 없이 그대로 쓴다 — 전체 11,440자에 392KB로,
예전 두 폰트(의연체+Pretendard)를 상용 2,780자로 서브셋한 합(1.13MB)보다도 작다.
서브셋을 안 하니 글자가 빠질 일도 없다.

이전 폰트 원본(의연체·콘콘체·Pretendard·Gmarket)은 아래 표 밖에 그대로 보관 중이라
되돌리거나 부분적으로 다시 쓸 수 있다. 되돌릴 땐 크기 재조정이 필요하다 —
**써라운드는 의연체보다 약 1.85배 넓고, Pretendard보다 1.15배 넓다** (같은 px 기준 실측).
그래서 의연체를 쓰던 자리는 크기를 0.55배로 줄여 놓았다.

| 파일 | 용도 | 탑재 에셋 |
|---|---|---|
| base-boy-v3.webp | 남아 아바타 베이스 원화 v3 (현행 — 배경 제거·현행 bbox에 맞춰 정렬 탑재) | avatar/base/default.webp |
| base-girl-v3.webp | 여아 아바타 베이스 원화 v3 (현행 — 배경 제거·현행 bbox에 맞춰 정렬 탑재) | avatar/base/default-girl.webp |
| base-boy.webp | 남아 아바타 베이스 원화 v2 (교체됨) | — |
| base-girl.webp | 여아 아바타 베이스 원화 v2 (교체됨) | — |
| boots-explorer-sockless.webp | 탐험 부츠 착용 원화 (맨발목, 현행) | avatar/shoes/explorer-boots.webp |
| boots-cream-sockless.webp | 크림 부츠 착용 원화 (맨발목, 현행) | avatar/shoes/cream-boots.webp |
| hat-explorer-v2.webp | 탐험 헬멧 착용 원화 v2 (현행 — 얼굴째 덮는 방식, 배율 1.05) | avatar/hat/explorer-helmet.webp |
| hat-explorer-wearing.webp | 탐험 헬멧 착용 원화 v1 (교체됨) | — |
| boots-explorer-sockless-v2.webp | 탐험 부츠 착용 원화 (맨발목 v2, 최종 승인본) | avatar/shoes/explorer-boots.webp |
| boots-green-wearing-v2.webp | 새싹 부츠 착용 원화 (v2, 현행 승인본) | avatar/shoes/green-boots.webp |
| btn-parent-badge-v2.webp | '엄마용' 원형 뱃지 v2 (엄마 얼굴, 현행) | btn-parent.webp |
| btn-child-switch-badge-v2.webp | 아이 전환 원형 뱃지 v2 (남매, 2명 이상일 때만 노출, 현행) | btn-child-switch.webp |
| btn-my-avatar-badge.webp | '내 아바타' 원형 뱃지 (초록 실루엣, 현행 — 팻말에서 교체) | btn-my-avatar.webp |
| btn-growth-character-badge.webp | '성장캐릭터' 원형 뱃지 (새싹, 현행 — 팻말에서 교체) | btn-growth-character.webp |
| adventure-map-v9-src.webp | 긴 지도 v9 수채화 (853×1844, 짧은 v8과 한 세트, PATH 재추출) | adventure-map.webp |
| adventure-map-short-v8-src.webp | 짧은 지도 v8 수채화 (951×1654, 긴 지도 v8과 한 세트, PATH 재추출) | adventure-map-short.webp |
| map-bld-treehouse-v2.webp | 지도 학원 건물 v7-1 (나무 위의 집, 흰 원→투명 펀칭) | map-bld-treehouse.webp |
| map-bld-stonearch-v2.webp | 지도 학원 건물 v7-2 (돌 아치문, 흰 원→투명 펀칭) | map-bld-stonearch.webp |
| map-bld-tent-v2.webp | 지도 학원 건물 v7-3 (탐험가 텐트, 흰 원→투명 펀칭) | map-bld-tent.webp |
| map-bld-tikihut-v2.webp | 지도 학원 건물 v7-4 (티키 초가 오두막, 흰 원→투명 펀칭) | map-bld-tikihut.webp |
| journal-card-v4-src.webp | 모험일지 초록 노트 원화 v4 (장식 정리판, 모서리 검정→투명 펀칭 탑재) | journal-card.webp |
| chest-open-v2.webp | 열린 보물상자 원화 v2 (도착 시 지도의 닫힌 상자 위에 덮어 그림) | chest-open.webp |
| chest-patch.webp | 모래 텍스처 조각 (도착 시 배경의 '닫힌 상자'를 지우는 용도, 타원 마스크로 이음매 제거) | chest-patch.webp |
| coin-front.webp | 금화 원화 정면 (상자 도착 연출, 뒤집히며 튀어오름) | coin-front.webp |
| coin-tilt.webp | 금화 원화 반측면 (상자 도착 연출, 구르듯 회전) | coin-tilt.webp |
| map-walkers/{pink,apricot,green,purple,blue}-{boy,girl}.webp | 지도 위를 걷는 탐험가 10종 (5테마×성별, 이모지 대체) | map-char/*.webp |

# art-src — 캐릭터·장비 원화 보관소

ChatGPT로 생성한 **가공 전 원본 이미지**를 보관한다. 배포(dist)에는 포함되지 않으므로
앱 용량에 영향이 없고, 재가공이 필요할 때 이 원화에서 원패스로 다시 만든다.

**규칙**: 사용자가 새 원화를 주면 가공·탑재와 함께 반드시 이 폴더에도 원본을 저장한다.

**보관 형식**: 원본은 **webp(q92)** 로 저장한다. PNG로 두면 저장소가 빠르게 커진다
(58장 63MB → 8MB). 화질 손실은 재가공에 지장 없는 수준.

**아바타 베이스 구조**: 베이스는 **'몸통'과 '머리' 두 장**으로 나뉘어 있다
(base/body.webp + base/head.webp, 여아는 -girl). 합본(default.webp)은 로드 실패 시 폴백용.
모자처럼 얼굴째 덮는 장비는 카탈로그에 `hidesHead: true`를 달면 머리 장을 아예 안 그리고
그 자리에 장비 그림만 얹는다 — 베이스 머리 위에 덮어 씌우면 크기가 조금만 어긋나도
턱선·귀선이 겹쳐 보이던 문제가 이 구조로 원천 해결된다.
남아 머리/몸통 경계 y=403(턱 끝) · 여아 y=405. 얼굴 덮는 장비는 **턱 끝을 이 y에 맞추고
얼굴 최대폭을 243(남)/241(여)에 맞추면** 목이 자연스럽게 이어진다.

**아바타 베이스 교체 규칙**: 모자·신발·상의 등 장비 그림은 1024×1024 안에서
'베이스가 있던 자리'에 맞춰 그려져 있다. 그래서 베이스를 새로 넣을 땐 반드시
**현행 베이스의 bbox(키·중심x·발끝)에 맞춰 배율·위치를 잡아야** 장비가 어긋나지 않는다.
현행 기준값 — 남아 x365~657 / y122~935, 여아 x349~673 / y121~936 (중심x 511).
눈 위치(장비 정렬 기준) — 남아 간격 96.8·중심 (512, 321) / 여아 간격 106.8·중심 (510, 303).
(옛 방식 기록 — 머리 장을 안 그리기 전에는 얼굴 덮는 장비를 '베이스 윤곽선이 안 삐져나오는
최소 배율'로 키워야 했다. 지금은 머리를 아예 안 그리므로 그런 여유가 필요 없고,
턱 끝·얼굴폭만 맞추면 된다.)

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
| base-boy-v4-head.webp | 남아 머리 원화 v4 (현행 — 몸통과 이어 붙여 탑재) | avatar/base/head.webp |
| base-boy-v4-body.webp | 남아 몸통 원화 v4 (현행 — 머리와 이어 붙여 탑재) | avatar/base/body.webp |
| base-boy-v3.webp | 남아 아바타 베이스 원화 v3 (교체됨) | — |
| base-girl-v3.webp | 여아 아바타 베이스 원화 v3 (현행 — 배경 제거·현행 bbox에 맞춰 정렬 탑재) | avatar/base/default-girl.webp |
| base-boy.webp | 남아 아바타 베이스 원화 v2 (교체됨) | — |
| base-girl.webp | 여아 아바타 베이스 원화 v2 (교체됨) | — |
| boots-explorer-sockless.webp | 탐험 부츠 착용 원화 (맨발목, 현행) | avatar/shoes/explorer-boots.webp |
| boots-cream-sockless.webp | 크림 부츠 착용 원화 (맨발목, 현행) | avatar/shoes/cream-boots.webp |
| hat-explorer-v2.webp | 탐험 헬멧 착용 원화 v2 (현행 — 머리 장을 숨기고 이 그림으로 대체, hidesHead) | avatar/hat/explorer-helmet.webp |
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

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
남아 머리/몸통 경계 y=404(턱 끝, 중심 x=506) · 여아 y≈395.
**얼굴 덮는 장비 탑재 공식** — 원화의 눈 간격을 베이스 머리(124.5)에 맞춰 배율을 잡고,
턱 끝을 y=404 · 중심 x=506 에 정렬한다. 모자 4종 모두 이 방식(배율 1.08~1.13).
**신발 탑재 공식** — 현행 신발 에셋의 bbox 안에 비율 유지로 넣되 **바닥(y1)을 일치**시킨다
(발이 뜨거나 파묻히지 않게). 현행 기준 바닥 y — 탐험 946 / 새싹·크림 947.
**어깨끈(배낭) 탑재 공식** — 원화가 '앞에서 본 어깨끈'이면 등 슬롯 기본 z(15, 캐릭터 뒤)로는
몸통에 가려진다. 카탈로그 아이템에 `z: 37`(상의 35 위·목장식 40 아래)을 달아 앞으로 끌어온다.
배치는 침낭 롤이 어깨선에 얹히게 — 탐험 배낭은 배율 0.88, 좌상단 (408, 414)에 탑재.
왼쪽 롤의 끝이 몸통 실루엣 가장자리(x≈408)와 맞아떨어져 잘린 티가 안 난다.
몸통 기준값(남녀 거의 동일) — 어깨선 y≈450~470 · 셔츠 중심 x≈508 · 반바지 시작 y≈576.

**아바타 베이스 교체 규칙**: 모자·신발·상의 등 장비 그림은 1024×1024 안에서
'베이스가 있던 자리'에 맞춰 그려져 있다. 그래서 베이스를 새로 넣을 땐 반드시
**현행 베이스의 bbox(키·중심x·발끝)에 맞춰 배율·위치를 잡아야** 장비가 어긋나지 않는다.
현행 기준값 — 남아 x365~657 / y122~935, 여아 x350~674 / y124~936 (중심x 511).
눈 위치(장비 정렬 기준) — 남아 간격 96.8·중심 (512, 321) / 여아 간격 106.8·중심 (510, 306).
**목 이음매 확인** — 머리 장과 몸통 장을 따로 배치하면 목 부분에 몇 px 투명 틈이 생길 수 있다.
목 열(여아 x486~534)마다 `머리 아래끝 vs 몸통 위끝`을 재서 틈이 0 이하가 되게 머리를 내려 맞춘다
(여아 v4는 눈 정렬값에서 3px 내려 top=124로 확정 — 드러난 목 32px로 기존과 동일).
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
| base-girl-v4-head.webp | 여아 머리 원화 v4 (현행 — 눈 정렬 후 3px 내려 몸통과 이어 붙여 탑재) | avatar/base/head-girl.webp |
| base-girl-v4-body.webp | 여아 몸통 원화 v4 (현행 — 발끝 y936 정렬, 머리와 이어 붙여 탑재) | avatar/base/body-girl.webp |
| base-girl-v3.webp | 여아 아바타 베이스 원화 v3 (교체됨) | — |
| base-boy.webp | 남아 아바타 베이스 원화 v2 (교체됨) | — |
| base-girl.webp | 여아 아바타 베이스 원화 v2 (교체됨) | — |
| boots-explorer-v3.webp | 탐험 부츠 원화 v3 (현행) | avatar/shoes/explorer-boots.webp |
| boots-green-v3.webp | 새싹 부츠 원화 v3 (현행) | avatar/shoes/green-boots.webp |
| boots-cream-v3.webp | 크림 부츠 원화 v3 (현행) | avatar/shoes/cream-boots.webp |
| hat-explorer-v3.webp | 탐험 헬멧 원화 v3 (현행, hidesHead) | avatar/hat/explorer-helmet.webp |
| hat-safari-brown.webp | 사파리 모자 원화 (현행, hidesHead) | avatar/hat/safari-brown.webp |
| hat-aviator-cap.webp | 비행사 모자 원화 (현행, hidesHead) | avatar/hat/aviator-cap.webp |
| hat-blossom.webp | 꽃 헬멧 원화 (현행, hidesHead) | avatar/hat/blossom-helmet.webp |
| back-explorer-straps.webp | 탐험 배낭 원화 (앞에서 본 어깨끈 — 침낭 롤·버클·칼집, z:37로 앞에 그림) | avatar/back/explorer-straps.webp |
| hat-explorer-v2.webp / hat-explorer-wearing.webp | 탐험 헬멧 원화 v2·v1 (교체됨) | — |
| boots-*-sockless*.webp / boots-green-wearing-v2.webp | 부츠 원화 v1·v2 (교체됨) | — |
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

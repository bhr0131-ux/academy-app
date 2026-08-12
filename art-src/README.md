# art-src — 캐릭터·장비 원화 보관소

ChatGPT로 생성한 **가공 전 원본 이미지**를 보관한다. 배포(dist)에는 포함되지 않으므로
앱 용량에 영향이 없고, 재가공이 필요할 때 이 원화에서 원패스로 다시 만든다.

**규칙**: 사용자가 새 원화를 주면 가공·탑재와 함께 반드시 이 폴더에도 원본을 저장한다.

**보관 형식**: 원본은 **webp(q92)** 로 저장한다. PNG로 두면 저장소가 빠르게 커진다
(58장 63MB → 8MB). 화질 손실은 재가공에 지장 없는 수준.
사용자가 PNG를 주더라도 **PNG를 남기지 말고 webp로 변환해 보관**한다
(탐험 배경·캐릭터·깃발·건물 원본 21장 14.6MB → 1.4MB).

**[사용자 확정 2026-07-31] 구버전 삭제 규칙**: 같은 그림을 새 원화로 교체하면
**이전 버전 원본은 지운다**(이 표의 해당 행도 함께 삭제). 되돌릴 일이 생기면
git 히스토리에서 꺼낸다 — 예: `git show <커밋>:art-src/... > 복구.webp`.

**아바타 베이스 구조**: 베이스는 **'몸통'과 '머리' 두 장**으로 나뉘어 있다
(base/body.webp + base/head.webp, 여아는 -girl). 합본(default.webp)은 로드 실패 시 폴백용.
모자처럼 얼굴째 덮는 장비는 카탈로그에 `hidesHead: true`를 달면 머리 장을 아예 안 그리고
그 자리에 장비 그림만 얹는다 — 베이스 머리 위에 덮어 씌우면 크기가 조금만 어긋나도
턱선·귀선이 겹쳐 보이던 문제가 이 구조로 원천 해결된다.
남아 머리/몸통 경계 y=404(턱 끝, 중심 x=506) · 여아 y≈395.
**얼굴 덮는 장비 탑재 공식** — 원화의 눈 간격을 베이스 머리에 맞춰 배율을 잡고,
턱 끝을 y=404 · 중심 x=506 에 정렬한다. 남아 모자 4종 모두 이 방식(배율 1.08~1.13).
기준 눈(bbox 중심 기준) — 남아 머리 간격 124.5 / 여아 머리 간격 111.0 · 중심 (510, 309).
**여아 전용 모자** — 남녀 얼굴 크기가 달라(눈 간격 124.5 vs 111.0) 같은 모자 그림을
공유하면 여아 얼굴이 남아 얼굴로 바뀐다. 여아 원화가 있으면 카탈로그에 `imgGirl`을 달고
여아 머리 기준(간격 111.0 · 중심 510,309)에 맞춰 따로 탑재한다. 뷰어가 성별로 골라 그린다.
현행 여아 4종 — 사파리 361×358 @(327,107) / 비행사 307×353 @(357,112)
/ 꽃 367×352 @(322,112) / 탐험 368×352 @(320,109).
**목 이음매 보정(중요)** — 눈 기준으로만 맞추면 모자 그림의 턱이 베이스보다 높게 그려져 있어
턱과 목 사이에 4~12px 투명 슬릿이 생긴다. 표시 240px에서도 배경색이 비쳐 보인다.
그래서 눈 정렬 후 **'목 열'(몸통 최상단 y로부터 3px 이내로 시작하는 열, 여아 x481~536)에서
빈틈이 0 이하가 될 때까지 모자를 내린다.** 남아 4종도 같은 이유로 정수 픽셀만큼 내려 보정했다
(탐험 +6 / 사파리 +5 / 비행사 +12 / 꽃 +4 — 리샘플 없는 정수 이동이라 화질 손실 없음).
눈이 몇 px 내려가지만(표시 200px 기준 1~2px) 목이 끊겨 보이는 쪽이 훨씬 눈에 띈다.
**눈 검출 방법** — 어두운 픽셀 연결요소를 잡되, 눈동자 하이라이트 때문에 한쪽 눈이
두 조각으로 갈라지는 일이 있다. bbox가 4px 이내로 붙은 조각을 합친 뒤
'좌우 폭이 비슷하고 y가 맞는 쌍'을 고르면 안정적이다 (병합 간격을 10px로 키우면
땋은 머리까지 붙어버려 실패한다).
**신발 탑재 공식 — 좌·우 짝 따로 · 남녀 따로 (사용자 확정, 2026-07)**
원화는 **한 짝씩** 받아 좌·우를 각각 배치한다. 두 짝이 한 장에 그려진 예전 방식은
좌우 비대칭을 못 잡아서 폐기했다. 성별로도 값이 달라 `imgGirl`로 그림을 따로 둔다.
크기는 **부츠 높이를 140px로 통일**해야 세 신발이 캐릭터에서 같은 높이로 보인다
(원화 높이가 140·152·686으로 제각각이라 그대로 쓰면 안 된다).

| 신발 | 남아 좌 (중심x/밑창y) | 남아 우 | 여아 좌 | 여아 우 |
|---|---|---|---|---|
| 탐험 | 432 / 963 | 578 / 966 | 434 / 978 | 582 / 981 |
| 새싹 | 432 / 963 | 578 / 966 | 434 / 978 | 582 / 981 |
| 크림 | 437 / 963 | 571 / 966 | 440 / 965 | 576 / 968 |

**접지 그림자는 신발을 따라간다** — 밑창이 맨발 바닥(남 934·여 936)보다 30~45px 아래라,
그림자를 고정하면 신발만 그림자 밖으로 나간다. 카탈로그 아이템의 `soleY`/`soleYGirl`을
뷰어가 읽어 그림자 높이를 정한다. 맨발이면 935.

**미리보기 눈금 주의** — 위치 확인용 확대 이미지는 계단식(nearest) 확대라 가장자리가
네모나게 보인다. 그림 결함이 아니다 (실측: 원화 6장 모두 떠 있는 조각 0개).

**어깨끈(배낭) 탑재 공식** — 원화가 '앞에서 본 어깨끈'이면 등 슬롯 기본 z(15, 캐릭터 뒤)로는
몸통에 가려진다. 카탈로그 아이템에 `z: 37`(상의 35 위·목장식 40 아래)을 달아 앞으로 끌어온다.
배치는 침낭 롤이 어깨선에 얹히게 — 탐험 배낭은 배율 0.88, 좌상단 (408, 414)에 탑재.
왼쪽 롤의 끝이 몸통 실루엣 가장자리(x≈408)와 맞아떨어져 잘린 티가 안 난다.
**색 변형 정렬법** — 같은 구도의 다른 색 원화는 눈으로 맞추지 말고 **기존 탑재본과의
알파 IoU를 최대화**하는 (배율, 좌상단)을 탐색해서 정한다. 크림은 IoU 0.91로 그대로 채택
(238×202 @408,412). 파랑은 원화가 두 끈을 더 벌려 그려서(가로세로비 1.37 vs 1.18)
IoU 최적값은 끈이 짧아진다 — 끈 길이를 기준으로 272×199 @388,412로 조정했다.
설치본 바닥 y: 초록 615 / 파랑 611 / 크림 614.
몸통 기준값(남녀 거의 동일) — 어깨선 y≈450~470 · 셔츠 중심 x≈508 · 반바지 시작 y≈576.

**아바타 베이스 교체 규칙**: 모자·신발·상의 등 장비 그림은 1024×1024 안에서
'베이스가 있던 자리'에 맞춰 그려져 있다. 그래서 베이스를 새로 넣을 땐 반드시
**현행 베이스의 bbox(키·중심x·발끝)에 맞춰 배율·위치를 잡아야** 장비가 어긋나지 않는다.
현행 기준값 — 남아 x365~657 / y122~935, 여아 x350~674 / y124~936 (중심x 511).
눈 위치(장비 정렬 기준) — 남아 간격 96.8·중심 (512, 321) / 여아 간격 106.8·중심 (510, 306).
**목 이음매 확인** — 머리 장과 몸통 장을 따로 배치하면 목 부분에 몇 px 투명 틈이 생길 수 있다.
목 열(여아 x481~536 / 남아 x478~531)마다 `머리 아래끝 vs 몸통 위끝`을 재서 틈이 0 이하가 되게
머리를 내려 맞춘다.
**틈이 0이어도 부족하다(중요)** — 몸통 장의 목은 위쪽이 뭉툭하게 잘려 있어서, 턱 아치가 그 잘린
자리에 '겨우 닿기만' 하면 양옆에 턱이 진 것처럼 보이고 머리가 붙여 놓은 것처럼 뜬다.
턱 아치가 목의 잘린 윗부분을 **덮을 만큼** 더 내려야 목 외곽선이 턱선에서 자연스럽게 이어진다.
현행 확정값 — 여아 머리는 +5px 내려 확정(전신 y129~936).
남아는 이후 별도 조정 — 머리 0.965배 축소(턱끝 y411·목중심 x506 고정) 후 5px 위로,
전신 y137~934 · 머리 폭 291→278. 판단은 목 부분을 4~6배 확대해 v2 원본과 비교해서 했다.

**흰 테두리(halo) 제거 — 알파 1px 침식**: 배경 제거 때 가장자리에 '밝고 반투명한' 픽셀이
남으면 배경 위에서 흰 실선처럼 도드라진다. 진단은 `0<alpha<248` 이면서 밝기>205 인 픽셀 수로
한다 — 남아는 머리 1158개·몸통 2534개나 있었고, 여아는 0개(하드 알파)라 원래 깨끗했다.
**침식은 쓰지 말 것(중요)** — 1px 침식으로는 덜 지워지고, 2px까지 하면 양말처럼 외곽선이
반투명하게 그려진 곳에서 **외곽선 자체가 사라진다**. 알파를 건드리는 방법은 전부 같은 위험이 있다.
**올바른 방법 = 색만 고치기**: 반투명 픽셀 중 '가장 가까운 불투명 픽셀보다 25 이상 밝은' 것만
골라 그 이웃의 RGB로 바꾼다. 알파를 안 건드리니 실루엣이 안 줄고, 원래 어두운 반투명 외곽선은
조건에 안 걸려 그대로 남는다. 판정·수정 모두 이 지표 하나로 된다(수정 후 0이 되면 끝).
2026-07 일괄 보정 — 아바타 에셋 17장에서 17,516px 보정(모자 8·배낭 2·하의 3·신발 2·남아 베이스 2).
여아 베이스와 하늘 배낭·크림 부츠는 하드 알파라 원래 0이었다.
실루엣 외곽선 두께는 머리·몸통 모두 3px로 원래 같았다 — '몸 선이 얇아 보이던' 건
halo가 외곽선을 흐려서 생긴 착시였다.
(옛 방식 기록 — 머리 장을 안 그리기 전에는 얼굴 덮는 장비를 '베이스 윤곽선이 안 삐져나오는
최소 배율'로 키워야 했다. 지금은 머리를 아예 안 그리므로 그런 여유가 필요 없고,
턱 끝·얼굴폭만 맞추면 된다.)

**[사용자 확정 2026-08-05] 배포 에셋은 '화면 표시 폭 × 3.5배'로 줄여 넣는다.**
원화는 art-src에 원본 크기로 두되, public/assets에는 실제로 그려지는 크기의
3.5배(레티나 3배 + 여유)만 넣는다. 표시 폭은 눈대중이 아니라 브라우저에서
getBoundingClientRect로 재서 정한다. 2026-08-05 점검에서 이 기준을 넘던
14장을 정리했다 — 713KB → 405KB.
  캠프 이름표 판 964→413px · 명패 판 842→354px (표시 118·101px, 8배가 넘었다)
  캠프 아이콘 8장 540→459px (아이콘을 20% 줄인 뒤라 4.1배가 돼 있었다)
  지도 건물 4장 →340px (짧은 지도에서 가장 크게 그려질 때가 95px)

**정리 이력**: 교체·은퇴된 원본(초기 26개 37MB + 2026-07-31 구버전 18개) + 미사용 후보 폰트 4종(11.7MB)은 작업 폴더에서 삭제했다. 46MB → 11MB.
필요하면 git 히스토리에서 되살릴 수 있다 — `git log --all --diff-filter=D --name-only -- art-src`

**폰트**: 현재 앱 전체 글씨체는 **카페24 써라운드** 한 종류다 (사용자 확정).
제작사 배포 woff2를 서브셋 없이 그대로 쓴다 — 전체 11,440자에 392KB로,
예전 두 폰트(의연체+Pretendard)를 상용 2,780자로 서브셋한 합(1.13MB)보다도 작다.
서브셋을 안 하니 글자가 빠질 일도 없다.

[사용자 확정 2026-07-31] **쓰지 않는 후보 폰트 4종(의연체·콘콘체·Pretendard·Gmarket, 11.7MB)은 삭제했다.**
되돌릴 일이 생기면 git 히스토리에서 꺼내거나 배포처에서 다시 받으면 된다.
되돌릴 땐 크기 재조정이 필요하다 —
**써라운드는 의연체보다 약 1.85배 넓고, Pretendard보다 1.15배 넓다** (같은 px 기준 실측).
그래서 의연체를 쓰던 자리는 크기를 0.55배로 줄여 놓았다.

| 파일 | 용도 | 탑재 에셋 |
|---|---|---|
| base-boy-v4-head.webp | 남아 머리 원화 v4 (현행 — 몸통과 이어 붙여 탑재) | avatar/base/head.webp |
| base-boy-v4-body.webp | 남아 몸통 원화 v4 (현행 — 머리와 이어 붙여 탑재) | avatar/base/body.webp |
| base-girl-v4-head.webp | 여아 머리 원화 v4 (현행 — 눈 정렬 후 3px 내려 몸통과 이어 붙여 탑재) | avatar/base/head-girl.webp |
| base-girl-v4-body.webp | 여아 몸통 원화 v4 (현행 — 발끝 y936 정렬, 머리와 이어 붙여 탑재) | avatar/base/body-girl.webp |
| shoe-explorer-L/R.webp | 탐험 부츠 원화 한 짝씩 (현행) | avatar/shoes/explorer-boots(-girl).webp |
| shoe-green-L/R.webp | 새싹 부츠 원화 한 짝씩 (현행) | avatar/shoes/green-boots(-girl).webp |
| shoe-cream-L/R.webp | 크림 부츠 원화 한 짝씩 (현행, 고해상도 원본) | avatar/shoes/cream-boots(-girl).webp |
| hat-explorer-v3.webp | 탐험 헬멧 원화 남아 v3 (현행, hidesHead) | avatar/hat/explorer-helmet.webp |
| hat-explorer-helmet-girl.webp | 탐험 헬멧 원화 여아 (현행, imgGirl) | avatar/hat/explorer-helmet-girl.webp |
| hat-safari-brown.webp | 사파리 모자 원화 남아 (현행, hidesHead) | avatar/hat/safari-brown.webp |
| hat-safari-brown-girl.webp | 사파리 모자 원화 여아 (현행, imgGirl) | avatar/hat/safari-brown-girl.webp |
| hat-aviator-cap.webp | 비행사 모자 원화 남아 (**겨울 시즌 보관** — season:"winter", 상점 미노출) | avatar/hat/aviator-cap.webp |
| hat-aviator-cap-girl.webp | 비행사 모자 원화 여아 (**겨울 시즌 보관**) | avatar/hat/aviator-cap-girl.webp |
| hat-blossom.webp | 꽃 헬멧 원화 남아 (현행, hidesHead) | avatar/hat/blossom-helmet.webp |
| hat-blossom-helmet-girl.webp | 꽃 헬멧 원화 여아 (현행, imgGirl) | avatar/hat/blossom-helmet-girl.webp |
| bottom-khaki-cargo.webp | 카키 반바지 원화 (벨트 달린 카고) | avatar/bottom/khaki-cargo.webp |
| bottom-cream-cargo.webp | 크림 반바지 원화 (카고) | avatar/bottom/cream-cargo.webp |
| bottom-denim-shorts.webp | 데님 반바지 원화 (밑단 롤업) | avatar/bottom/denim-shorts.webp |
| back-explorer-straps.webp | 탐험 배낭 원화 (초록 롤 + 갈색 가죽끈, z:37로 앞에 그림) | avatar/back/explorer-straps.webp |
| back-sky-straps.webp | 하늘 배낭 원화 (파랑 롤 + 갈색 가죽끈) | avatar/back/sky-straps.webp |
| back-cream-straps.webp | 크림 배낭 원화 (크림 롤 + 캔버스끈, 체커보드 배경 제거) | avatar/back/cream-straps.webp |
| btn-parent-badge-v2.webp | '엄마용' 원형 뱃지 v2 (엄마 얼굴, 현행) | btn-parent.webp |
| btn-child-switch-badge-v2.webp | 아이 전환 원형 뱃지 v2 (남매, 2명 이상일 때만 노출, 현행) | btn-child-switch.webp |
| btn-my-avatar-badge.webp | '내 아바타' 원형 뱃지 (초록 실루엣, 현행 — 팻말에서 교체) | btn-my-avatar.webp |
| btn-growth-character-badge.webp | '성장캐릭터' 원형 뱃지 (새싹, 현행 — 팻말에서 교체) | btn-growth-character.webp |
| chest-closed-v1-src.webp | 닫힌 보물상자 (v10 지도 원화에서 오려 낸 것 — v11 지도엔 상자가 안 그려져 있어 따로 얹는다. 화면용 230px) | chest-closed.webp |
| map-ev/parrot-v1-src.webp | 지도 동물 — 앵무새 (그루터기 대신 나무 횃대+수풀, 투명. 지도 폭의 16%) | map-ev/parrot.webp |
| map-ev/monkey-v2-src.webp | 지도 동물 — 원숭이 v2 (바위에 앉은 모습, 나뭇가지·덩굴 없음. 원화가 검정 배경으로 와서 테두리에 닿은 검정만 지우고 가장자리를 다듬어 탑재. 지도 폭의 20%) | map-ev/monkey.webp |
| map-ev/toucan-v1-src.webp | 지도 동물 — 큰부리새 (나뭇가지, 투명. 지도 폭의 20%) | map-ev/toucan.webp |
| map-ev/boar-v1-src.webp | 지도 동물 — 멧돼지 (투명. 지도 폭의 17%) | map-ev/boar.webp |
| map-ev/frog-v1-src.webp | 지도 동물 — 개구리 (바위+수풀, 투명. 지도 폭의 24% — 사용자 요청으로 20→24% 확대) | map-ev/frog.webp |
| map-bld-treehouse-v2.webp | 지도 학원 건물 v7-1 (나무 위의 집, 흰 원→투명 펀칭) | map-bld-treehouse.webp |
| map-bld-stonearch-v2.webp | 지도 학원 건물 v7-2 (돌 아치문, 흰 원→투명 펀칭) | map-bld-stonearch.webp |
| map-bld-tent-v2.webp | 지도 학원 건물 v7-3 (탐험가 텐트, 흰 원→투명 펀칭) | map-bld-tent.webp |
| map-bld-tikihut-v2.webp | 지도 학원 건물 v7-4 (티키 초가 오두막, 흰 원→투명 펀칭) | map-bld-tikihut.webp |
| journal-card-v6-src.webp | 모험일지 스프링 노트 원화 v6 (1254×1254 — 제본링·나침반·발자국 장식이 들어간 판. 왼쪽 세로줄에 아이콘 넷(시계·버스·배낭·과녁)만 있고 글자는 앱이 오른쪽에 얹는다. 모서리 검정→투명 펀칭 후 1254px q86 그대로 탑재, 현행) | journal-card.webp |
| chest-open-v2.webp | 열린 보물상자 원화 v2 (도착 시 지도의 닫힌 상자 위에 덮어 그림) | chest-open.webp |
| chest-patch.webp | 모래 텍스처 조각 (도착 시 배경의 '닫힌 상자'를 지우는 용도, 타원 마스크로 이음매 제거) | chest-patch.webp |
| coin-front.webp | 금화 원화 정면 (상자 도착 연출, 뒤집히며 튀어오름) | coin-front.webp |
| coin-tilt.webp | 금화 원화 반측면 (상자 도착 연출, 구르듯 회전) | coin-tilt.webp |
| map-walkers/{pink,apricot,green,purple,blue}-{boy,girl}.webp | 지도 위를 걷는 탐험가 10종 (5테마×성별, 이모지 대체) | map-char/*.webp |
| map-bld-v8/treehouse2-src.webp | 지도 학원 건물 v8-1 (나무 위의 집, 구멍 투명 제공됨) | map-bld-treehouse2.webp |
| map-bld-v8/stonearch2-src.webp | 지도 학원 건물 v8-2 (돌 아치문+팻말, 구멍 투명 제공됨) | map-bld-stonearch2.webp |
| map-bld-v8/tent2-src.webp | 지도 학원 건물 v8-3 (텐트+모닥불·배낭·랜턴, 흰 원→투명 펀칭) | map-bld-tent2.webp |
| map-bld-v8/tikihut2-src.webp | 지도 학원 건물 v8-4 (티키 초가+항아리, 구멍 투명 제공됨) | map-bld-tikihut2.webp |
| expedition/char/common-{walk,swim,success}-src.webp | 탐험 씬 캐릭터 포즈 3종 (남아 원화, halo 보정 후 탑재) | expedition/char/common-*.webp |
| expedition/char/girl-{idle,walk,run,swim,success}-src.webp | 탐험 씬 캐릭터 포즈 5종 여아 원화 (2026-08-08 — 원본 316×597 / 197×345 / 521×867 / 414×266 / 217×370. halo 재색칠 후 **남아와 같은 높이**(412·276·220·207·301)로 줄여 탑재 — 그림은 높이로만 크기가 정해져서 높이를 맞춰야 두 성별이 같게 그려진다. 이로써 포즈는 남녀 전부 따로) | expedition/char/girl-*.webp |
| expedition/ride/{키}-girl-src.webp | 탐험 씬 탈것 여아 원화 **32종 전부** (2026-08-08). 탈것 그림에는 타고 있는 아이도 같이 그려져 있어 성별이 갈린다. 대개 남아 판과 크기가 거의 같아 그대로 탑재하지만, 크게 온 것은 **남아와 같은 높이로 줄인다**(거북이 487→302 · 고래 888→266 · 잠수함 1341→356 등) — 그림은 높이로만 크기가 정해지므로 높이를 맞춰야 두 성별이 같은 해상도로 보인다. 배경이 박혀 온 것(열기구 여아 마젠타 · 열기구/잠수함 검정)은 테두리 flood fill 로만 지운다 — 색으로 지우면 눈·외곽선까지 뚫린다. halo 재색칠은 전부 적용 | expedition/ride/{키}-girl.webp |
| expedition/char/common-idle-src.webp | 탐험 씬 기본 서있기 포즈 (미션 0개일 때 출발지 대기 — halo 보정 후 탑재) | expedition/char/common-idle.webp |
| expedition/char/{common,girl}-sit-src.webp | 앉기 포즈 남녀 원화 (2026-08-09, 남아 278×459 / 여아 493×716 — 받은 순서가 여아·남아라 처음에 반대로 넣었다가 바로잡았다). **쓰는 곳은 '쉬는 날 무대'다** — 탈것용이 아니다. 탈것 원화 32종에 이미 아이가 함께 그려져 있어(RIDE_READY·RIDE_GIRL_READY 각 32) 앱은 탈 때 탈것 한 장만 그리고, 어느 챕터도 pose:"ride"를 안 쓴다. [사용자 확정] 무대 캐릭터를 바꾸는 게 아니라, '오늘은 탐험 장소가 없어요' · '오늘은 미션이 없어요!' 빈 칸의 이모지(😴 · 🗒️) 자리에 높이 108px로 넣는다(ADV_SIT_IMG·ADV_SIT_EMPTY_H, 탐험 스킨 한정). 탑재는 **줄인 뒤에 halo 재색칠** — 리샘플이 가장자리에 밝고 반투명한 픽셀을 새로 만들어서, 원본에서 먼저 고쳐도 줄이면 다시 생긴다(남아 0 → 281개 실측). 여아는 676px 높이로 줄이고, 남아는 원본이 459px뿐이라 그대로 쓴다 (표시 108px 기준 남아 4.2배·여아 6.3배 — 원본을 더 줄일 수도 있지만 둘 합쳐 85KB라 그대로 뒀다) | expedition/char/{common,girl}-sit.webp |
| expedition/bg/bg-river-v4-src.webp | 강 배경 v4 (1484×1060 = 1.4:1 — 큰 카드용 재제작, 현행) | expedition/bg-river.webp |
| expedition/flag/{red,blue,green,yellow}-src.webp | 도착 깃발 4색 (빨강 잎가지·파랑 물방울·초록 잎·노랑 별 — halo 보정 후 탑재) | expedition/flag/*.webp |
| expedition/bg/bg-mountain-v2-src.webp | 바위산 배경 v2 (1484×1060 = 1.4:1 — 큰 카드용 재제작, 돌계단 대각선 등반, 현행) | expedition/bg-mountain.webp |
| expedition/bg/bg-forest-v3-src.webp | 깊은 숲 배경 v3 (1484×1060 = 1.4:1 — 큰 카드용 재제작, 여우·부엉이·개울, 현행) | expedition/bg-forest.webp |
| expedition/bg/bg-wood-v4-src.webp | 숲길 산책 배경 v4 (1485×1059 = 1.4:1 — 토끼 크기 축소, 현행) | expedition/bg-wood.webp |
| expedition/bg/bg-cave-v3-src.webp | 동굴 배경 v3 (1483×1061 = 1.4:1 — 큰 카드용 재제작, 현행) | expedition/bg-cave.webp |
| expedition/bg/bg-meadow-v2-src.webp | 초원 배경 v2 (1484×1060 = 1.4:1 — 큰 카드용 재제작, 언덕·들꽃, 현행) | expedition/bg-meadow.webp |
| expedition/bg/bg-skyisle-v3-src.webp | 하늘섬 배경 v3 (1484×1060 = 1.4:1 — 큰 카드용 재제작, 현행) | expedition/bg-skyisle.webp |
| map-ev/butterfly-src.webp | 지도 이벤트 손님 나비 — 이벤트 날에만 지도에 나타남 (ev_butterfly) | map-ev/butterfly.webp |
| map-ev/turtle-src.webp | 지도 이벤트 손님 거북이 — 이벤트 날에만 지도에 나타남 (ev_turtle) | map-ev/turtle.webp |
| map-ev/rainbow-src.webp | 지도 이벤트 손님 무지개 — 이벤트 날에만 지도 하늘에 나타남 (ev_rainbow, 👋 없음) | map-ev/rainbow.webp |
| expedition/bg/bg-snow-v2-src.webp | 설원 배경 v2 (1484×1060 = 1.4:1 — 큰 카드용 재제작, 현행) | expedition/bg-snow.webp |
| expedition/bg/bg-treasure-v3-src.webp | 보물섬 배경 v3 (1484×1060 = 1.4:1 — 큰 카드용 재제작, 현행) | expedition/bg-treasure.webp |
| expedition/bg/bg-space-v4-src.webp | 우주 배경 v4 (1484×1060 = 1.4:1 — 오른쪽 우주기지·은하수 띠·우주비행사·UFO, 현행) | expedition/bg-space.webp |
| expedition/bg/bg-sea-v2-src.webp | 바다 배경 v2 (1484×1060 = 1.4:1 — 큰 카드용 재제작, 수면+물속 반반, 현행) | expedition/bg-sea.webp |
| expedition/bg/bg-desert-v2-src.webp | 사막 배경 v2 (1484×1060 = 1.4:1 — 큰 카드용 재제작, 현행) | expedition/bg-desert.webp |
| expedition/ride/horse-src.webp | 탑승 원화 7 말 — 숲·깊은숲·초원 대표 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/horse.webp |
| expedition/ride/dolphin-src.webp | 탑승 원화 5 돌고래 — 강·바다·보물 대표 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/dolphin.webp |
| expedition/ride/deer-src.webp | 탑승 원화 9 사슴 — 숲 대표·바위산/깊은숲 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/deer.webp |
| expedition/ride/canoe-src.webp | 탑승 원화 1 카누 — 강 대표 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/canoe.webp |
| expedition/ride/camel-src.webp | 탑승 원화 10 낙타 — 사막 대표 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/camel.webp |
| expedition/ride/carpet-src.webp | 탑승 원화 19 마법양탄자 — 사막 대표 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/carpet.webp |
| expedition/ride/goat-src.webp | 탑승 원화 11 산양 — 바위산 대표 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/goat.webp |
| expedition/ride/cablecar-v3-src.webp | 탑승 원화 12 케이블카 v3 — 바위산 (142×152, 곤돌라만. 줄은 앱이 지나는 길에 그린다, 현행) | expedition/ride/cablecar.webp |
| expedition/ride/unicorn-src.webp | 탑승 원화 18 유니콘 — 깊은숲 대표·보물 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/unicorn.webp |
| expedition/ride/minecart-src.webp | 탑승 원화 21 광산 수레 — 동굴 대표 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/minecart.webp |
| expedition/ride/bat-src.webp | 탑승 원화 22 박쥐 — 동굴 대표 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/bat.webp |
| expedition/ride/balloon-src.webp | 탑승 원화 14 열기구 남아 (하늘 lift). **2026-08-08 재제작 113×177 → 200×310** (표시 55×86px의 3.5배 — 실측). 받은 원화가 검정 배경이라 테두리 flood fill 로 투명 처리(26.5%) 후 가장자리 알파 깃털. 여아 판도 같은 200×310 | expedition/ride/balloon.webp |
| expedition/ride/sailboat-src.webp | 탑승 원화 3 범선 — 보물 대표·강/바다 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/sailboat.webp |
| expedition/ride/ship-src.webp | 탑승 원화 4 큰배 — 바다 대표·강 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/ship.webp |
| expedition/ride/turtle-src.webp | 탑승 원화 6 거북이 — 강·바다 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/turtle.webp |
| expedition/ride/raft-src.webp | 탑승 원화 2 뗏목 — 강 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/raft.webp |
| expedition/ride/donkey-src.webp | 탑승 원화 8 당나귀 — 숲·깊은숲·초원 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/donkey.webp |
| expedition/ride/dragon-src.webp | 탑승 원화 17 드래곤 — 깊은숲·동굴·보물 변형 (하늘 lift 5) (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/dragon.webp |
| expedition/ride/cloud-src.webp | 탑승 원화 15 구름 남아 — 초원·사막·보물 변형 (하늘 lift 7). **2026-08-08 재제작 137×153 → 280×310** (표시 77×86px의 3.5배 — 실측으로 정한 값). 여아 판도 같은 높이 310으로 다시 뽑아 둘이 같은 해상도다 | expedition/ride/cloud.webp |
| expedition/ride/eagle-src.webp | 탑승 원화 13 독수리 — 바위산·사막 변형 (하늘 lift 8) (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/eagle.webp |
| expedition/ride/crystal-src.webp | 탑승 원화 23 수정 슬라이드 — 동굴 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/crystal.webp |
| expedition/ride/owl-src.webp | 탑승 원화 24 큰 부엉이 — 깊은숲 변형 (하늘 lift 7) (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/owl.webp |
| expedition/ride/flamingo-src.webp | 탑승 원화 25 플라밍고 — 강 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/flamingo.webp |
| expedition/ride/whale-src.webp | 탑승 원화 31 고래 — 바다 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/whale.webp |
| expedition/ride/sled-src.webp | 탑승 원화 20 썰매 — 설원 대표 | expedition/ride/sled.webp |
| expedition/ride/reindeersled-src.webp | 탑승 원화 30 순록 썰매 — 설원 대표 | expedition/ride/reindeersled.webp |
| expedition/ride/iceslide-src.webp | 탑승 원화 29 얼음 미끄럼틀 — 설원 변형 | expedition/ride/iceslide.webp |
| expedition/ride/rocket-src.webp | 탑승 원화 16 로켓 — 하늘섬 변형 (우주 챕터 기본 예정) | expedition/ride/rocket.webp |
| expedition/ride/meteor-src.webp | 탑승 원화 26 유성 — 우주 대표 | expedition/ride/meteor.webp |
| expedition/ride/motorbike-src.webp | 탑승 원화 27 오토바이 — 사막 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/motorbike.webp |
| expedition/ride/sandboard-src.webp | 탑승 원화 28 모래 보드 — 사막 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/sandboard.webp |
| expedition/ride/submarine-src.webp | 탑승 원화 32 잠수정 — 바다 변형 (탈것+앉은 캐릭터 한 장, halo 보정 후 탑재) | expedition/ride/submarine.webp |
| expedition/char/common-run-src.webp | 탐험 씬 달리기 포즈 (초원 전용 — 이동 속도도 조금 빠르게, halo 보정 후 탑재) | expedition/char/common-run.webp |
| bg-adventure-meadow-v10-src.webp | 탐험 모드 무대 기본 배경 v10 (866×1815 = 1:2.10 — 무대 칸 비율에 맞춘 세로 긴 판. v9과 구도는 같고 전체를 더 밝고 맑게 뺀 판(하늘 하늘색·모래 밝은 베이지). 우측 나무도 빠져 좌우가 트였다. 받은 그대로 톤 보정 없음, 현행) | stage-adventure-meadow.webp |
| adventure-map-v12-src.webp | 탐험지도 긴 판 v12 (885×1778 — 학원 4곳 이상용). v11과 구도는 같고 모래길이 좁아지고 굽이가 바뀌었다. 그래서 길 중심선을 직각-걷기로 다시 뽑고(90점), 새 길에 걸린 자리 3곳을 옮겼다 | adventure-map.webp |
| adventure-map-short-v3-src.webp | 탐험지도 짧은 판 v3 (922×1706 — 학원 0~3곳용). v2와 길이 거의 같아(기존 85점 중 83점이 그대로 길 위) 좌표는 손대지 않았다 | adventure-map-short.webp |
| camp-bag-v2-src.webp | 캐릭터 탭 가방 카드 '빈 틀' v2 (1260×860 = 비율 1.465, 투명 = 표시 359px의 3.5배). 세로는 그대로 두고 가로만 넓힌 판 — 종이면이 넓어져 "👑 Lv.20 전설의 탐험가"가 한 줄에 들어간다. 안쪽 종이면 x 9.9~90.0% · y 24.1~86.7%(실측)에 레벨·진행막대·코인/XP를 앱이 그린다 — 값이 매일 바뀌므로 그림에 넣지 않는다. 좁은 v1(1000×862)은 규칙 6에 따라 삭제 | camp/bag.webp |
| camp-{deco,item,box,pet,book,title,streak,history}-v2-src.webp | 캐릭터 탭 격자 아이콘 **8종 전부** (490×490 정사각 = 표시 138px의 3.5배, 받침 없이 캔버스를 꽉 채운 판). 앱이 정사각 칸에 objectFit:contain 으로 넣으므로 여덟 칸의 무게가 저절로 맞는다. 그루터기 붙은 v1은 규칙 6에 따라 삭제 | camp/st-*.webp |
| bg-deepsea-v7-src.webp | 꾸미기 배경 '깊은 바다' 원화 v7 (864×1820 = 1:2.106 — 무대 칸 1:2.09 와 거의 같아 위아래가 아주 조금 잘린다). v6(해저 신전 아치)에서 구도가 통째로 바뀌었다 — 바위 협곡 사이로 난 넓은 모랫길, 위쪽에 큰 고래 실루엣, 가운데 바다거북, 좌우에 산호·해초·조개, 멀리 작은 물고기 떼, 수면에서 내려오는 빛줄기. v6보다 물색이 한 톤 더 맑고 밝다. deco 는 🫧 🐙 ✨ 🫧 🐠 — v6에 촘촘하던 기포 줄기가 이 판엔 아예 없어 🫧 를 다시 앞으로 올렸고, 물고기는 멀리 작은 실루엣뿐이라 앞쪽 생기를 맡을 🐠 를 하나 남겼다. 🐬 는 고래가 그려져 있어 계속 뺀 상태. tint 0.10 · darkStage 끔 — v6부터 같은 설정이다(위쪽이 흰 빛줄기라 크림색 문구가 안 읽힌다). 받은 그대로 톤 보정 없음. art-src 는 q92(194KB), 배포본은 q80(66KB) | stage-bg-deepsea.webp |
| bg-dino-v3-src.webp | 꾸미기 배경 '공룡 섬' 원화 v3 (865×1819 = 1:2.10 — 무대 칸 1:2.09 와 거의 같다). v2와 구도·소품은 그대로고 하늘만 달라진 판 — 왼쪽 위에 큰 뭉게구름이 들어오고 오른쪽에도 구름이 더해져 하늘이 덜 비어 보인다. 초원도 살짝 진해졌다. 구도가 같아 deco·tint·darkStage 는 v2 설정 그대로 둔다. 받은 그대로 톤 보정 없음. art-src 는 q92(197KB), 배포본은 q80(78KB) | stage-bg-dino.webp |
| bg-space-v3-src.webp | 꾸미기 배경 '우주 탐사' 원화 v3 (868×1812 = 1:2.088 — 무대 칸 1:2.09 와 사실상 같아 잘리는 데가 없다). v2와 구도는 같다(아래 지구의 둥근 지평선이 아이가 서는 바닥, 오른쪽 위 보름달, 왼쪽 토성, 가운데를 가로지르는 로켓) — 색이 맑아지고 은하수 띠가 또렷해졌으며 잔별 노이즈가 줄었다. 그림이 장식 이모지로 넣던 것을 거의 다 이미 그려서(🚀 🪐 🌎 🌙 ⭐ 🌌) deco 는 그림에 없는 셋만 둔다: ☄️ 🛸 🌠. tint 0.12 · darkStage 유지(밤하늘이라 응원문구는 크림색). v2 는 입자가 거칠어 배포본을 q74 로 낮췄지만, v3 은 결이 매끈해 q80 에서도 115KB 라 집 기준인 q80 으로 돌아왔다. 받은 그대로 톤 보정 없음. art-src 는 q92(297KB), 배포본은 q80(115KB) | stage-bg-space.webp |
| bg-jungle-v3-src.webp | 꾸미기 배경 '정글 원정대' 원화 v3 (868×1811 = 1:2.087 — 무대 칸 1:2.09 와 사실상 같아 잘리는 데가 없다). v2와 구도·소품은 그대로다(아래쪽 개울을 건너는 큰 징검다리 위에 아이가 서고, 길 끝에 코끼리, 왼쪽 나무에 나무늘보, 오른쪽 가지에 큰부리새, 멀리 산) — 안개가 걷히고 잎·나무 결이 또렷해졌으며 초록이 노란빛 쪽으로 밝아졌다. 그림이 장식으로 넣던 것을 대부분 그려서(🌴 🍃 🌿 🦜) deco 는 그림에 없는 셋만 둔다: 🐒 🐍 🌺. tint 연한 초록 0.10 · darkStage 끔 — v1부터 같은 설정이다(위쪽이 밝은 연둣빛이라 크림색 문구가 안 읽힌다). 받은 그대로 톤 보정 없음. art-src 는 q92(187KB), 배포본은 q80(80KB) | stage-bg-jungle.webp |

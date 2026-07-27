# art-src — 캐릭터·장비 원화 보관소

ChatGPT로 생성한 **가공 전 원본 이미지**를 보관한다. 배포(dist)에는 포함되지 않으므로
앱 용량에 영향이 없고, 재가공이 필요할 때 이 원화에서 원패스로 다시 만든다.

**규칙**: 사용자가 새 원화를 주면 가공·탑재와 함께 반드시 이 폴더에도 원본을 저장한다.

**보관 형식**: 원본은 **webp(q92)** 로 저장한다. PNG로 두면 저장소가 빠르게 커진다
(58장 63MB → 8MB). 화질 손실은 재가공에 지장 없는 수준.

**정리 이력**: 교체·은퇴된 원본 26개(37MB)는 작업 폴더에서 삭제했다.
필요하면 git 히스토리에서 되살릴 수 있다 — `git log --all --diff-filter=D --name-only -- art-src`

**폰트**: 배포본(public/assets/fonts/)은 상용 한글 2,780자 + ASCII·문장부호로 **서브셋**한 파일이다.
원본 전체 글리프(11,172자) 파일은 아래 art-src의 ttf/otf에 있으니, 글자가 빠지면 원본에서 다시 서브셋한다.
(서브셋 6.2MB → 2.0MB, 이후 콘콘체 제거로 1.1MB. 첫 화면에서 폰트가 대역폭을 독점해
 캐릭터·배경 이미지가 늦게 뜨던 문제 해소. 콘콘체 원본 ttf는 보관 중이라 되돌릴 수 있다)

| 파일 | 용도 | 탑재 에셋 |
|---|---|---|
| base-boy.webp | 남아 아바타 베이스 원화 (신규 교체본, 배경 제거·정렬 탑재) | avatar/base/default.webp |
| base-girl.webp | 여아 아바타 베이스 원화 (신규 교체본, 배경 제거·정렬 탑재) | avatar/base/default-girl.webp |
| boots-explorer-sockless.webp | 탐험 부츠 착용 원화 (맨발목, 현행) | avatar/shoes/explorer-boots.webp |
| boots-cream-sockless.webp | 크림 부츠 착용 원화 (맨발목, 현행) | avatar/shoes/cream-boots.webp |
| hat-explorer-wearing.webp | 탐험 헬멧 착용 원화 | avatar/hat/explorer-helmet.webp |
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
| coin-front.webp | 금화 원화 정면 (상자 도착 연출, 뒤집히며 튀어오름) | coin-front.webp |
| coin-tilt.webp | 금화 원화 반측면 (상자 도착 연출, 구르듯 회전) | coin-tilt.webp |
| map-walkers/{pink,apricot,green,purple,blue}-{boy,girl}.webp | 지도 위를 걷는 탐험가 10종 (5테마×성별, 이모지 대체) | map-char/*.webp |

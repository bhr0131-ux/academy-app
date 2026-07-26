# art-src — 캐릭터·장비 원화 보관소

ChatGPT로 생성한 **가공 전 원본 이미지**를 보관한다. 배포(dist)에는 포함되지 않으므로
앱 용량에 영향이 없고, 재가공이 필요할 때 이 원화에서 원패스로 다시 만든다.

**규칙**: 사용자가 새 원화를 주면 가공·탑재와 함께 반드시 이 폴더에도 원본을 저장한다.

| 파일 | 용도 | 탑재 에셋 |
|---|---|---|
| base-boy.png | 남아 아바타 베이스 원화 (신규 교체본, 배경 제거·정렬 탑재) | avatar/base/default.webp |
| base-girl.png | 여아 아바타 베이스 원화 (신규 교체본, 배경 제거·정렬 탑재) | avatar/base/default-girl.webp |
| boots-explorer-wearing.png | 탐험 부츠 착용 원화 (양말 버전, 구) | (교체됨) |
| boots-explorer-sockless.png | 탐험 부츠 착용 원화 (맨발목, 현행) | avatar/shoes/explorer-boots.webp |
| boots-green-wearing.png | 새싹 부츠 착용 원화 (구) | (교체됨) |
| boots-cream-wearing.png | 크림 부츠 착용 원화 (양말 버전, 구) | (교체됨) |
| boots-cream-sockless.png | 크림 부츠 착용 원화 (맨발목, 현행) | avatar/shoes/cream-boots.webp |
| boots-desert-wearing-retired.png | 모래 부츠 원화 (판매 중단, 보관용) | (은퇴) |
| hat-explorer-wearing.png | 탐험 헬멧 착용 원화 | avatar/hat/explorer-helmet.webp |
| boots-explorer-sockless-v2.png | 탐험 부츠 착용 원화 (맨발목 v2, 최종 승인본) | avatar/shoes/explorer-boots.webp |
| boots-pink-ribbon-wearing.png | 리본 부츠 원화 (판매 중단, 보관용) | (은퇴) |
| boots-green-wearing-v2.png | 새싹 부츠 착용 원화 (v2, 현행 승인본) | avatar/shoes/green-boots.webp |
| btn-my-avatar-sign.png | '내 아바타' 나무 팻말 버튼 원화 (구) | (교체됨) |
| btn-growth-character-sign.png | '성장캐릭터' 나무 팻말 버튼 원화 (구) | (교체됨) |
| btn-parent-badge.png | '엄마용' 원형 뱃지 버튼 원화 (구) | (교체됨) |
| btn-child-switch-badge.png | 아이 전환 원형 뱃지 버튼 원화 (구) | (교체됨) |
| btn-parent-badge-v2.png | '엄마용' 원형 뱃지 v2 (엄마 얼굴, 현행) | btn-parent.webp |
| btn-child-switch-badge-v2.png | 아이 전환 원형 뱃지 v2 (남매, 2명 이상일 때만 노출, 현행) | btn-child-switch.webp |
| btn-my-avatar-badge.png | '내 아바타' 원형 뱃지 (초록 실루엣, 현행 — 팻말에서 교체) | btn-my-avatar.webp |
| btn-growth-character-badge.png | '성장캐릭터' 원형 뱃지 (새싹, 현행 — 팻말에서 교체) | btn-growth-character.webp |
| adventure-map-src.png | 모험 지도 배경 원화 v3 (정글 세로형 854×1842, 무수정 사용) | adventure-map.webp |
| map-bld-junglehut.png | 지도 학원 건물 원화 1 (정글 오두막 v3, 구) | (교체됨) |
| map-bld-tileroof.png | 지도 학원 건물 원화 2 (파란 기와집 v3, 구) | (교체됨) |
| map-bld-greenroof.png | 지도 학원 건물 원화 3 (초록지붕 울타리집 v3, 구) | (교체됨) |
| map-bld-artisthouse.png | 지도 학원 건물 원화 4 (화방 v3, 구) | (교체됨) |
| map-bld-treehouse.png | 지도 학원 건물 v6-1 (수채화풍, 구) | (교체됨) |
| map-bld-stonearch.png | 지도 학원 건물 v6-2 (수채화풍, 구) | (교체됨) |
| map-bld-tent.png | 지도 학원 건물 v6-3 (수채화풍, 구) | (교체됨) |
| map-bld-tikihut.png | 지도 학원 건물 v6-4 (수채화풍, 구) | (교체됨) |
| adventure-map-v6-src.png | 긴 지도 v7 크리스프 카툰 (구) | (교체됨) |
| adventure-map-v8-src.png | 긴 지도 v8 수채화 (구) | (교체됨) |
| adventure-map-v9-src.png | 긴 지도 v9 수채화 (853×1844, 짧은 v8과 한 세트, PATH 재추출) | adventure-map.webp |
| adventure-map-short-v6-src.png | 짧은 지도 v7 크리스프 카툰 (구) | (교체됨) |
| adventure-map-short-v8-src.png | 짧은 지도 v8 수채화 (951×1654, 긴 지도 v8과 한 세트, PATH 재추출) | adventure-map-short.webp |
| map-bld-treehouse-v2.png | 지도 학원 건물 v7-1 (나무 위의 집, 흰 원→투명 펀칭) | map-bld-treehouse.webp |
| map-bld-stonearch-v2.png | 지도 학원 건물 v7-2 (돌 아치문, 흰 원→투명 펀칭) | map-bld-stonearch.webp |
| map-bld-tent-v2.png | 지도 학원 건물 v7-3 (탐험가 텐트, 흰 원→투명 펀칭) | map-bld-tent.webp |
| map-bld-tikihut-v2.png | 지도 학원 건물 v7-4 (티키 초가 오두막, 흰 원→투명 펀칭) | map-bld-tikihut.webp |
| adventure-map-short-src.png | 모험 지도 배경 원화 v2 (3:5 양피지 972×1619, 학원 0~2곳용) | adventure-map-short.webp |
| journal-card-src.png | 모험일지 학원 카드 양피지 노트 원화 (1181×1338, 구) | (교체됨) |
| journal-card-v2-src.png | 모험일지 초록 노트 원화 v2 (라벨 글자 포함, 구) | (교체됨) |
| journal-card-v3-src.png | 모험일지 초록 노트 원화 v3 (구) | (교체됨) |
| journal-card-v4-src.png | 모험일지 초록 노트 원화 v4 (장식 정리판, 모서리 검정→투명 펀칭 탑재) | journal-card.webp |

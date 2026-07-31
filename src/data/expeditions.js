/* ════════════════════════════════════════════════════════════════════════
   expeditions — 미션 탭 '하루 한 탐험' 시스템 데이터 (사용자 기획서 확정)
   ────────────────────────────────────────────────────────────────────────
   핵심: "미션을 완료하면 진행률이 오르는 게 아니라, 탐험가 캐릭터가
   실제로 목적지까지 이동한다." 진행률 바는 없다.
     · 하루는 하나의 탐험 목표만 — 날짜 순서대로 순환 (강→산→…→유적→강, 요일 고정 아님)
     · 미션 n개 중 k개 완료 → 캐릭터가 길의 k/n 지점에 서 있다
     · 마지막 미션 완료 → 도착 + 성공 연출

   ── 포즈 4종만 쓴다 (사용자 확정 — 제작 효율) ──────────────────────────
     walk(걷기) · swim(수영) · ride(공용 탑승 1자세) · success(성공 공용)
   탈것(Riding Sheet 20종)·아이템(Adventure Item 13종)은 캐릭터를 새로
   그리지 않고 PNG만 교체/추가한다. 발견물은 이모지 그대로 (별도 PNG 없음).
   캐릭터는 항상 오른쪽을 향한다 (왼쪽 필요 시 좌우 반전).

   ── 원화 드롭인 규약 (그림이 오면 데이터에 경로만 채우면 된다) ─────────
     배경   : public/assets/expedition/bg-{key}.webp   → 각 항목의 bgImg 필드
              (가로형 · 출발 왼쪽 · 도착 오른쪽 · 중앙 비움 · 글자/캐릭터 없음)
     캐릭터 : public/assets/expedition/char/{gender}-{pose}.webp → CHAR_IMG
     탈것   : public/assets/expedition/ride/{mount}.webp → MOUNTS[].img
              (같은 시점·크기·중심·탑승 높이 — 공용 탑승 포즈 하나로 전부 커버)
     아이템 : public/assets/expedition/item/{item}.webp → ITEMS[].img
   지금은 원화가 없어 지도용 걷기 캐릭터(mapWalkers) + 이모지 + CSS 배경으로
   동작한다. img 필드가 채워지면 컴포넌트가 자동으로 그림을 쓴다.
   원본 원화는 art-src/expedition/ 에 보관할 것 (CLAUDE.md 5).
   ════════════════════════════════════════════════════════════════════════ */

/* ── Riding Sheet (20종) — 탈것은 이모지/PNG 교체만, 탑승 포즈는 공용 ── */
export const MOUNTS = {
  /* 물 */    canoe:{ emoji:"🛶", name:"카누" }, raft:{ emoji:"🪵", name:"뗏목" },
  sailboat:{ emoji:"⛵", name:"범선" }, ship:{ emoji:"🚢", name:"큰배" },
  dolphin:{ emoji:"🐬", name:"돌고래" }, turtle:{ emoji:"🐢", name:"거북이" },
  /* 육상 */  horse:{ emoji:"🐴", name:"말" }, donkey:{ emoji:"🫏", name:"당나귀" },
  deer:{ emoji:"🦌", name:"사슴" }, camel:{ emoji:"🐪", name:"낙타" },
  goat:{ emoji:"🐐", name:"산양" }, cablecar:{ emoji:"🚠", name:"케이블카" },
  /* 하늘 */  eagle:{ emoji:"🦅", name:"독수리" }, balloon:{ emoji:"🎈", name:"열기구" },
  cloud:{ emoji:"☁️", name:"구름" }, rocket:{ emoji:"🚀", name:"로켓" },
  /* 판타지 */ dragon:{ emoji:"🐉", name:"드래곤" }, unicorn:{ emoji:"🦄", name:"유니콘" },
  carpet:{ emoji:"🧞", name:"마법양탄자" }, sled:{ emoji:"🛷", name:"썰매" },
};

/* ── Adventure Item Sheet (13종) — 걷기 캐릭터에 아이템만 추가 ── */
export const ADVENTURE_ITEMS = {
  backpack:{ emoji:"🎒", name:"배낭" },   map:{ emoji:"🗺️", name:"보물지도" },
  compass:{ emoji:"🧭", name:"나침반" },  flag:{ emoji:"🚩", name:"깃발" },
  torch:{ emoji:"🔥", name:"횃불" },      shovel:{ emoji:"🪏", name:"삽" },
  rope:{ emoji:"🪢", name:"밧줄" },       telescope:{ emoji:"🔭", name:"망원경" },
  lantern:{ emoji:"🏮", name:"랜턴" },    bottle:{ emoji:"🧉", name:"물병" },
  lunchbox:{ emoji:"🍱", name:"도시락" }, firstaid:{ emoji:"🩹", name:"구급파우치" },
  goldkey:{ emoji:"🗝️", name:"황금열쇠" },
};

/* ── 탐험 목록 (사용자 확정: 요일 고정이 아니라 '날짜 순서대로' 순환한다 —
      강→산→숲→동굴→사막→바다→유적, 끝나면 처음부터. 배경을 더 만들면
      EXPEDITION_ORDER에 끝에 추가만 하면 되고, 7종을 넘는 순간 주간 반복도 깨진다) ──
   pose  : walk | ride  (수영은 강이지만 v1은 카누 탑승 — 수영 원화가 오면 swim으로 교체)
   mount : pose가 ride일 때 MOUNTS 키
   item  : 걷기에 얹는 ADVENTURE_ITEMS 키 (기획 예시: 동굴=횃불 · 숲=나침반 · 사막=물병 · 보물=지도)
   goal  : 오른쪽 도착 지점 이모지 (goalImg 깃발 원화가 있으면 그걸 우선 — 사용자 확정)
   goalImg: 도착 깃발 원화 — 빨강=산·사막 / 파랑=강·바다 / 초록=숲 / 노랑=동굴·유적
   scene : CSS 폴백 배경 — sky·ground 그라데이션, 장식은 가장자리만(중앙 비움 규칙)
           deco: [x%, y%, 이모지, 크기px] (x는 0~22 또는 78~100만 쓸 것)          */
export const EXPEDITIONS = {
  river: { key:"river", title:"강을 건너자!", emoji:"🌊",
    pose:"swim", goal:"⛺", goalImg:"assets/expedition/flag/blue.webp",   // 도착 = 물방울 깃발 (사용자 원화)
    bgImg:"assets/expedition/bg-river.webp",   // 사용자 배경 원화 (원본 art-src/expedition/bg/)
    scene:{ sky:["#BFE3F2","#E8F5EC"], ground:["#7FC4DE","#5FA8CC"], groundH:34,
      /* 배경 원화 전용 위치 보정: 양쪽 잔디 사이 물길이 중앙이라
         charB/goalB(bottom%)·x0/x1(이동 구간)을 그림에 맞춘다 */
      charB:6, goalB:22, gx:92.5, x0:9, x1:86.5,   /* gx: 깃발을 더 우측으로 (사용자 조정) */
      /* 출발 전(미션 0개) 대기 자리 — 도착 텐트(x90·bottom22)와 같은 높이·좌우 대칭
         (사용자 확정: 출발지는 도착이랑 일직선) */
      xi:10.5, iB:22,
      /* 도착 후 만세 높이 — 물이 아니라 땅(잔디) 위 (사용자 확정). x는 깃발 앞(기본값) */
      aB:26,
      deco:[[6,30,"🌳",26],[13,66,"🌿",15],[93,28,"🌲",24],[87,66,"🪨",14],[8,84,"💧",11],[94,84,"🐟",12]] } },
  mountain: { key:"mountain", title:"바위산에 오르자!", emoji:"🏔️",
    pose:"walk", item:"rope", goal:"🚩", goalImg:"assets/expedition/flag/red.webp",   // 정상 정복 = 빨간 깃발
    bgImg:"assets/expedition/bg-mountain.webp",   // 사용자 배경 원화 (바위산 — 원본 art-src/expedition/bg/)
    scene:{ sky:["#CDE6F5","#F2EFE2"], ground:["#B9C9A0","#8FA878"], groundH:38,
      /* 대각선 등반 — 왼쪽 아래 모랫길에서 돌계단을 따라 오른쪽 위 정상으로.
         charB(출발 높이)→charB1(도착 높이)을 진행률에 따라 보간한다 */
      charB:6, charB1:56, goalB:60, x0:12, x1:79,
      xi:12, iB:6, aB:56,
      deco:[[7,26,"🏔️",30],[14,64,"🌲",18],[92,24,"☁️",18],[88,64,"🪨",15],[5,84,"🌼",11]] } },
  forest: { key:"forest", title:"숲을 통과하자!", emoji:"🌳",
    pose:"walk", item:"compass", goal:"🏡", goalImg:"assets/expedition/flag/green.webp",   // 숲 = 나뭇잎 깃발
    bgImg:"assets/expedition/bg-forest.webp",   // 사용자 배경 원화 v2 '깊은 숲' (v1 숲길은 art-src 보존)
    scene:{ sky:["#D8EFC9","#F0F6E2"], ground:["#9CBF7C","#7BA45E"], groundH:36,
      /* 깊은 숲 흙길 — 왼쪽에서 오른쪽으로 살짝 오르막 (charB→charB1 보간) */
      charB:29, charB1:35, goalB:38, x0:10, x1:81,
      deco:[[6,28,"🌳",28],[14,62,"🍄",13],[93,30,"🌳",26],[87,66,"🌿",14],[9,84,"🦋",11]] } },
  cave: { key:"cave", title:"동굴을 빠져나가자!", emoji:"🕳️",
    pose:"walk", item:"torch", goal:"🌕", goalImg:"assets/expedition/flag/yellow.webp",   // 어둠 속 별 깃발
    bgImg:"assets/expedition/bg-cave.webp",   // 사용자 배경 원화 (왼쪽 입구→오른쪽 수정 아치 출구, 박쥐·수정)
    scene:{ sky:["#4D4661","#6B617E"], ground:["#5D5470","#443C55"], groundH:34,
      /* 바닥 흙길을 따라 왼쪽 입구에서 오른쪽 수정 출구로 */
      charB:20, goalB:24, x0:10, x1:80,
      deco:[[6,26,"🪨",22],[13,80,"💎",12],[93,26,"🦇",14],[88,64,"🪨",16],[95,80,"✨",10]], dark:true } },
  desert: { key:"desert", title:"사막을 건너자!", emoji:"🏜️",
    pose:"ride", mount:"camel", goal:"🌴", goalImg:"assets/expedition/flag/red.webp",   // 모래 대비 빨간 깃발
    scene:{ sky:["#FBE3B7","#FDF2DC"], ground:["#EBCB8B","#D9B26C"], groundH:36,
      deco:[[7,30,"🌵",22],[16,78,"🪨",13],[92,26,"☀️",20],[87,66,"🌵",15],[6,84,"🦂",10]] } },
  sea: { key:"sea", title:"보물섬에 도착하자!", emoji:"🏝️",
    pose:"ride", mount:"sailboat", goal:"🏝️", goalImg:"assets/expedition/flag/blue.webp",   // 바다 = 물방울 깃발
    scene:{ sky:["#BEE4F5","#E9F6F0"], ground:["#6FBDDD","#4E9FC6"], groundH:40,
      deco:[[6,28,"☁️",18],[13,64,"🐚",12],[93,26,"🌴",24],[88,66,"🐬",14],[8,84,"🫧",11]] } },
  wood: { key:"wood", title:"숲길을 산책하자!", emoji:"🌲",
    pose:"walk", item:"lunchbox", goal:"🏡", goalImg:"assets/expedition/flag/green.webp",   // 숲 = 나뭇잎 깃발
    bgImg:"assets/expedition/bg-wood.webp",   // 사용자 배경 원화 v2 (토끼 좌측 배치 — 원본 art-src/expedition/bg/)
    scene:{ sky:["#CBE8F5","#EAF6E9"], ground:["#A9CF7F","#8AB763"], groundH:36,
      /* 넓은 흙길이 하단을 가로지른다 — 길 위 산책. 토끼들(좌측 잔디)은 장식 */
      charB:22, goalB:24, x0:10, x1:81,
      deco:[[6,30,"🌳",26],[14,64,"🌼",13],[93,30,"🌳",26],[87,66,"🌿",14],[9,84,"🐇",12]] } },
  meadow: { key:"meadow", title:"초원을 달리자!", emoji:"🌾",
    pose:"walk", goal:"🏁", goalImg:"assets/expedition/flag/yellow.webp",   // 결승선 = 별 깃발
    bgImg:"assets/expedition/bg-meadow.webp",   // 사용자 배경 원화 (양·풍차 초원 — 원본 art-src/expedition/bg/)
    scene:{ sky:["#BDE3F7","#EAF6E0"], ground:["#A5D06A","#8CBE52"], groundH:38,
      /* 탁 트인 풀밭을 달린다 — 양(중앙)은 장식, 풍차 언덕이 도착 방향 */
      charB:24, goalB:28, x0:10, x1:81,
      deco:[[6,30,"🌳",26],[14,66,"🌼",13],[93,26,"🌻",18],[87,66,"🌿",14],[8,84,"🦋",11]] } },
  ruins: { key:"ruins", title:"보물상자를 찾자!", emoji:"🎁",
    pose:"walk", item:"map", goal:"🎁", goalImg:"assets/expedition/flag/yellow.webp",   // 보물 = 별 깃발
    scene:{ sky:["#E4D9C3","#F4EDDD"], ground:["#C8B48E","#AE9770"], groundH:36,
      deco:[[6,26,"🏛️",26],[14,64,"🪨",14],[93,28,"🗿",22],[87,66,"🌿",13],[95,84,"✨",10]] } },
};

/* 순환 순서 — 배열 순서 = 탐험 순서. 새 배경은 끝에 추가. */
export const EXPEDITION_ORDER = ["river","mountain","forest","cave","desert","sea","ruins","wood","meadow"];   // 순서대로 순환 — 새 배경은 끝에 추가
/* 기준일(2026-01-05 월 = 강)부터 하루에 한 칸씩 순서대로 돈다.
   날짜만으로 정해지는 고정 시드라 과거·미래 어느 날짜를 열어도 항상 같다. */
const EXP_EPOCH = new Date("2026-01-05T00:00:00");
export function getExpedition(dateStr) {
  const d = new Date(String(dateStr || "") + "T00:00:00");
  const days = Math.round((d - EXP_EPOCH) / 86400000);
  const n = EXPEDITION_ORDER.length;
  const idx = Number.isFinite(days) ? ((days % n) + n) % n : 0;
  return EXPEDITIONS[EXPEDITION_ORDER[idx]] || EXPEDITIONS.ruins;
}

/* 캐릭터 포즈 원화 (사용자 원화 2026-07-30 — 원본 art-src/expedition/char/).
   [사용자 확정] 지금은 남자아이 원화 하나를 남녀 공용으로 쓴다 — 여아 원화가
   오면 girl 경로만 교체하면 된다. halo 보정(반투명 흰 픽셀 재색칠) 적용됨.
   ride(공용 앉기)는 아직 없다 → 컴포넌트가 walk로 대체하고, 오면 여기만 채운다. */
const _CP = "assets/expedition/char/";
export const CHAR_IMG = {
  idle:    { boy: _CP+"common-idle.webp",    girl: _CP+"common-idle.webp" },   // 미션 0개 — 출발지 기본 자세 (사용자 확정)
  walk:    { boy: _CP+"common-walk.webp",    girl: _CP+"common-walk.webp" },
  swim:    { boy: _CP+"common-swim.webp",    girl: _CP+"common-swim.webp" },
  ride:    null,
  success: { boy: _CP+"common-success.webp", girl: _CP+"common-success.webp" },
};

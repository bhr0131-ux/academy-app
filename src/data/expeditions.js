/* ════════════════════════════════════════════════════════════════════════
   expeditions — 미션 탭 '하루 한 탐험' 시스템 데이터 (사용자 기획서 확정)
   ────────────────────────────────────────────────────────────────────────
   핵심: "미션을 완료하면 진행률이 오르는 게 아니라, 탐험가 캐릭터가
   실제로 목적지까지 이동한다." 진행률 바는 없다.
     · 하루는 하나의 탐험 목표만 — 날짜 순서대로 순환 (강→산→…→유적→강, 요일 고정 아님)
     · 미션 n개 중 k개 완료 → 캐릭터가 길의 k/n 지점에 서 있다
     · 마지막 미션 완료 → 도착 + 성공 연출

   ── 포즈 원화 (사용자 확정 — 제작 효율) ────────────────────────────────
     walk(걷기) · swim(수영) · success(성공 공용) · idle(출발지 대기) · run(초원 달리기)
   탑승은 별도 포즈가 아니라 '탈것+앉은 캐릭터'가 한 장인 Riding Sheet(32종)로 대체한다 —
   그 한 장이 캐릭터 그림을 통째로 대신한다. 아이템(13종)은 걷기 캐릭터에 배지만 얹는다.
   발견물은 이모지 그대로 (별도 PNG 없음).
   캐릭터는 항상 오른쪽을 향한다 (왼쪽 필요 시 좌우 반전).

   ── 원화 드롭인 규약 (그림이 오면 데이터에 경로만 채우면 된다) ─────────
     배경   : public/assets/expedition/bg-{key}.webp   → 각 항목의 bgImg 필드
              (가로형 · 출발 왼쪽 · 도착 오른쪽 · 중앙 비움 · 글자/캐릭터 없음)
     캐릭터 : public/assets/expedition/char/{gender}-{pose}.webp → CHAR_IMG
     탈것   : public/assets/expedition/ride/{mount}.webp → RIDE_READY 배열에 키 추가
              (탈것+앉은 캐릭터 한 장 · 오른쪽 3/4 시점 · 앉기 높이 통일 — 시트 규칙)
     아이템 : public/assets/expedition/item/{item}.webp → ITEMS[].img
   지금은 원화가 없어 지도용 걷기 캐릭터(mapWalkers) + 이모지 + CSS 배경으로
   동작한다. img 필드가 채워지면 컴포넌트가 자동으로 그림을 쓴다.
   원본 원화는 art-src/expedition/ 에 보관할 것 (CLAUDE.md 5).
   ════════════════════════════════════════════════════════════════════════ */

/* ── Riding Sheet — 탑승 그림 32종 (사용자 시트 v1.0 20종 + 신규 12종) ──
   [중요] 탑승 원화는 '탈것 + 캐릭터(공용 앉기 자세)'가 한 장에 함께 그려져 있다.
   그래서 캐릭터를 따로 겹치지 않고, img가 있으면 그 한 장이 캐릭터를 통째로 대신한다.
     · 규격: 1024×1024 투명 PNG · 오른쪽 3/4 시점 · 앉기 높이 통일 (시트 공통 규칙)
     · 드롭인: public/assets/expedition/ride/{키}.webp 로 넣고 아래 img만 채우면 끝.
       원본은 art-src/expedition/ride/ 에 webp(q92)로 보관 (CLAUDE.md 5).
     · img가 없는 탈것은 그날 순환에서 자동으로 건너뛰고 기본 이동(걷기·수영)이 된다
       → 그림을 하나씩 받아도 그날그날 바로 살아난다.
   hMul : 표시 높이 배율(기본 1.35) — 탈것이 커서 캐릭터가 작게 보이는 그림만 키운다.
   lift : 나는 탈것을 땅에서 띄우는 값(bottom% 가산) — 열기구가 모래에 붙어 보이면 안 되니까.
   [주의] 키 이름은 씬별 mounts 목록·순환 계산에 쓰이므로 바꾸지 말 것. 새 탈것은 뒤에 추가.
   번호는 사용자 시트의 번호와 같다 (그림 받을 때 대조용). */
const _RP = "assets/expedition/ride/";
export const MOUNTS = {
  /* 물 1~6 */   canoe:{ n:1, emoji:"🛶", name:"카누" },      raft:{ n:2, emoji:"🪵", name:"뗏목" },
  sailboat:{ n:3, emoji:"⛵", name:"범선" },                  ship:{ n:4, emoji:"🚢", name:"큰배" },
  dolphin:{ n:5, emoji:"🐬", name:"돌고래" },                 turtle:{ n:6, emoji:"🐢", name:"거북이" },
  /* 육상 7~12 */ horse:{ n:7, emoji:"🐴", name:"말" },       donkey:{ n:8, emoji:"🫏", name:"당나귀" },
  deer:{ n:9, emoji:"🦌", name:"사슴" },                      camel:{ n:10, emoji:"🐪", name:"낙타" },
  goat:{ n:11, emoji:"🐐", name:"산양" },                     cablecar:{ n:12, emoji:"🚠", name:"케이블카", hMul:1.55 },
  /* 하늘 13~16 */ eagle:{ n:13, emoji:"🦅", name:"독수리", lift:8 }, balloon:{ n:14, emoji:"🎈", name:"열기구", hMul:1.75, lift:9 },
  cloud:{ n:15, emoji:"☁️", name:"구름", lift:7 },                    rocket:{ n:16, emoji:"🚀", name:"로켓", lift:8 },
  /* 판타지 17~20 */ dragon:{ n:17, emoji:"🐉", name:"드래곤", lift:5 }, unicorn:{ n:18, emoji:"🦄", name:"유니콘" },
  carpet:{ n:19, emoji:"🧞", name:"마법양탄자", lift:4 },             sled:{ n:20, emoji:"🛷", name:"썰매" },
  /* 신규 시트 21~32 (사용자 2026-07-31) */
  minecart:{ n:21, emoji:"🚋", name:"광산 수레", hMul:1.5 },            bat:{ n:22, emoji:"🦇", name:"박쥐", hMul:1.55, lift:7 },
  crystal:{ n:23, emoji:"💎", name:"수정 슬라이드", hMul:1.5 },         owl:{ n:24, emoji:"🦉", name:"큰 부엉이", hMul:1.45, lift:7 },
  flamingo:{ n:25, emoji:"🦩", name:"플라밍고", hMul:1.6 },             meteor:{ n:26, emoji:"🌠", name:"유성", lift:10 },
  motorbike:{ n:27, emoji:"🏍️", name:"오토바이", hMul:1.4 },            sandboard:{ n:28, emoji:"🏄", name:"모래 보드", hMul:1.3 },
  iceslide:{ n:29, emoji:"🧊", name:"얼음 미끄럼틀" },        reindeersled:{ n:30, emoji:"🦌", name:"순록 썰매" },
  whale:{ n:31, emoji:"🐳", name:"고래", hMul:1.55 },                    submarine:{ n:32, emoji:"🟡", name:"잠수정", hMul:1.7 },
};
/* ── 원화가 들어온 탈것 ──────────────────────────────────────────────
   그림을 받을 때마다 이 배열에 키만 추가하면 된다. 파일은 항상
   public/assets/expedition/ride/{키}.webp (원본은 art-src/expedition/ride/).
   여기 없는 탈것은 그날 순환에서 건너뛰고 기본 이동(걷기·수영)이 나온다. */
export const RIDE_READY = [
  "horse","dolphin","deer","canoe",           // 1차 (사용자 원화 2026-07-31)
  "camel","carpet","goat","cablecar",         // 2차
  "unicorn","minecart","bat","balloon",       // 3차
  "sailboat","ship","turtle","raft",          // 4차
  "donkey","dragon","cloud","eagle",          // 5차
  "crystal","owl","flamingo","whale",         // 6차
  "motorbike","sandboard","submarine",        // 7차
  "rocket","meteor",                          // 하늘섬·우주 챕터 개설로 가동 (설원용 3종은 배경 대기)
];
RIDE_READY.forEach((k) => { if (MOUNTS[k]) MOUNTS[k].img = _RP + k + ".webp"; });

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

/* ── 도착 표시(깃발·도착 이모지) 스위치 ──────────────────────────────────
   [사용자 확정 2026-07-31] "깃발은 우선 다 떼줘" — 배경 원화 자체가 도착지를
   보여주므로 깃발을 전부 숨긴다. 다시 켜고 싶으면 이 값만 true로 바꾸면 되고,
   씬별 깃발 원화(goalImg)·위치(gx/goalB/goalH)는 지우지 않고 그대로 뒀다. */
export const GOAL_MARK_ENABLED = false;

/* ── 탐험 목록 (사용자 확정: 요일 고정이 아니라 '날짜 순서대로' 순환한다 —
      강→산→숲→동굴→사막→바다→유적, 끝나면 처음부터. 배경을 더 만들면
      EXPEDITION_ORDER에 끝에 추가만 하면 되고, 7종을 넘는 순간 주간 반복도 깨진다) ──
   pose  : 그 챕터의 '기본' 이동 (walk | swim | run | ride)
   mounts: 그 챕터의 탈것 목록 — 앞의 두 개가 '대표 탈것' (사용자 기획서 2026-07-31).
           같은 챕터가 돌아올 때마다 기본 → 대표1 → 대표2 → 변형… 순으로 바뀐다
           (getExpeditionMount). 같은 배경을 오래 쓰기 위한 장치.
   mount : mounts가 없을 때 쓰는 고정 탈것 (구버전 필드)
   item  : 걷기에 얹는 ADVENTURE_ITEMS 키 (기획 예시: 동굴=횃불 · 숲=나침반 · 사막=물병 · 보물=지도)
   goal  : 오른쪽 도착 지점 이모지 (goalImg 깃발 원화가 있으면 그걸 우선 — 사용자 확정)
   goalImg: 도착 깃발 원화 — 빨강=산·사막 / 파랑=강·바다 / 초록=숲 / 노랑=동굴·유적
   scene : CSS 폴백 배경 — sky·ground 그라데이션, 장식은 가장자리만(중앙 비움 규칙)
           deco: [x%, y%, 이모지, 크기px] (x는 0~22 또는 78~100만 쓸 것)          */
export const EXPEDITIONS = {
  river: { key:"river", title:"강을 건너자!", emoji:"🌊",
    /* Ch2 강 — 대표: 카누·돌고래 (사용자 기획서 2026-07-31) */
    mounts:["canoe","dolphin","raft","sailboat","ship","turtle","flamingo"],
    pose:"swim", goal:"⛺", goalImg:"assets/expedition/flag/blue.webp",   // 도착 = 물방울 깃발 (사용자 원화)
    bgImg:"assets/expedition/bg-river.webp",   // 사용자 배경 원화 v3 (1.87:1 권장 비율 — 구도는 v2와 동일, 원본 art-src)
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
    /* Ch3 바위산 — 대표: 산양·케이블카 (사용자 기획서 2026-07-31) */
    mounts:["goat","cablecar","deer","horse","eagle"],
    pose:"walk", item:"rope", goal:"🚩", goalImg:"assets/expedition/flag/red.webp",   // 정상 정복 = 빨간 깃발
    bgImg:"assets/expedition/bg-mountain.webp",   // 사용자 배경 원화 (바위산 — 원본 art-src/expedition/bg/)
    scene:{ sky:["#CDE6F5","#F2EFE2"], ground:["#B9C9A0","#8FA878"], groundH:38,
      /* 대각선 등반 — 왼쪽 아래 모랫길에서 돌계단을 따라 오른쪽 위 정상으로.
         charB(출발 높이)→charB1(도착 높이)을 진행률에 따라 보간한다 */
      charB:6, charB1:56, goalB:60, x0:12, x1:79,
      xi:12, iB:6, aB:56,
      deco:[[7,26,"🏔️",30],[14,64,"🌲",18],[92,24,"☁️",18],[88,64,"🪨",15],[5,84,"🌼",11]] } },
  forest: { key:"forest", title:"숲을 통과하자!", emoji:"🌳",
    /* Ch4 깊은 숲 — 대표: 말·유니콘 (사용자 기획서 2026-07-31) */
    mounts:["horse","unicorn","deer","donkey","dragon","owl"],
    pose:"walk", item:"compass", goal:"🏡", goalImg:"assets/expedition/flag/green.webp",   // 숲 = 나뭇잎 깃발
    bgImg:"assets/expedition/bg-forest.webp",   // 사용자 배경 원화 v2 '깊은 숲' (v1 숲길은 art-src 보존)
    scene:{ sky:["#D8EFC9","#F0F6E2"], ground:["#9CBF7C","#7BA45E"], groundH:36,
      /* 깊은 숲 흙길 — 왼쪽에서 오른쪽으로 살짝 오르막 (charB→charB1 보간) */
      charB:29, charB1:35, goalB:38, x0:10, x1:81,
      deco:[[6,28,"🌳",28],[14,62,"🍄",13],[93,30,"🌳",26],[87,66,"🌿",14],[9,84,"🦋",11]] } },
  cave: { key:"cave", title:"동굴을 빠져나가자!", emoji:"🕳️",
    /* Ch5 동굴 — 대표: 광산 수레·박쥐 (사용자 기획서 2026-07-31) */
    mounts:["minecart","bat","crystal","dragon"],
    pose:"walk", item:"torch", goal:"🌕", goalImg:"assets/expedition/flag/yellow.webp",   // 어둠 속 별 깃발
    bgImg:"assets/expedition/bg-cave.webp",   // 사용자 배경 원화 v2 (1.93:1 — 출구 아치가 안전 영역 안, 원본 art-src)
    scene:{ sky:["#4D4661","#6B617E"], ground:["#5D5470","#443C55"], groundH:34,
      /* 바닥 흙길을 따라 왼쪽 입구에서 오른쪽 수정 출구로 */
      charB:20, goalB:24, x0:10, x1:80,
      deco:[[6,26,"🪨",22],[13,80,"💎",12],[93,26,"🦇",14],[88,64,"🪨",16],[95,80,"✨",10]], dark:true } },
  desert: { key:"desert", title:"사막을 건너자!", emoji:"🏜️",
    /* Ch7 사막 — 대표: 낙타·마법양탄자 (사용자 기획서 2026-07-31) */
    mounts:["camel","carpet","cloud","eagle","balloon","motorbike","sandboard"],
    pose:"walk",   // 기획서: 사막의 기본은 걷기 — 탈것(낙타·양탄자…)은 회차마다 mounts에서
    goal:"🌴", goalImg:"assets/expedition/flag/red.webp",   // 모래 대비 빨간 깃발
    bgImg:"assets/expedition/bg-desert.webp",   // 사용자 배경 원화 (오아시스·유적 아치 — 원본 art-src/expedition/bg/)
    scene:{ sky:["#FBE3B7","#FDF2DC"], ground:["#EBCB8B","#D9B26C"], groundH:36,
      /* 앞쪽 모래벌판을 따라 왼쪽에서 오른쪽 유적 쪽으로 */
      charB:12, goalB:14, gx:90, x0:9, x1:83,
      deco:[[7,30,"🌵",22],[16,78,"🪨",13],[92,26,"☀️",20],[87,66,"🌵",15],[6,84,"🦂",10]] } },
  sea: { key:"sea", title:"보물섬에 도착하자!", emoji:"🏝️",
    /* Ch9 바다 — 대표: 큰배·돌고래 (사용자 기획서 2026-07-31) */
    mounts:["ship","dolphin","canoe","sailboat","turtle","whale","submarine"],
    pose:"swim",   // 기획서: 바다의 기본은 수영 — 배·돌고래 등은 회차마다 mounts에서
    idlePose:"swim",   // 출발지도 바다 한가운데 — 서 있을 땅이 없어 물에 떠서 기다린다
    goal:"🏝️", goalImg:"assets/expedition/flag/blue.webp",   // 바다 = 물방울 깃발
    bgImg:"assets/expedition/bg-sea.webp",   // 사용자 배경 원화 (수평선 위 보물섬 — 원본 art-src/expedition/bg/)
    scene:{ sky:["#BEE4F5","#E9F6F0"], ground:["#6FBDDD","#4E9FC6"], groundH:40,
      /* 앞바다(아래)에서 수평선 위 섬(오른쪽 위)으로 — 멀어지는 만큼 높이도 크기도 줄인다 */
      /* 수영 원화는 가로로 넓어 x0/xi를 안쪽으로 (왼쪽 끝에서 잘리지 않게) */
      charB:6, charB1:27, charH:58, charH1:32, x0:14, x1:68,
      gx:76, goalB:30, goalH:30,   /* 깃발은 섬 왼쪽 빈 백사장 (보물 동굴 왼편) */
      xi:15, iB:6, xa:73, aB:29,   /* 만세는 백사장 위 — 섬 왼쪽 끝은 모래가 좁아 안쪽으로 */
      deco:[[6,28,"☁️",18],[13,64,"🐚",12],[93,26,"🌴",24],[88,66,"🐬",14],[8,84,"🫧",11]] } },
  wood: { key:"wood", title:"숲길을 산책하자!", emoji:"🌲",
    /* Ch1 숲 — 대표: 사슴·말 (사용자 기획서 2026-07-31) */
    mounts:["deer","horse","donkey","unicorn","dragon"],
    pose:"walk", item:"lunchbox", goal:"🏡", goalImg:"assets/expedition/flag/green.webp",   // 숲 = 나뭇잎 깃발
    bgImg:"assets/expedition/bg-wood.webp",   // 사용자 배경 원화 v2 (토끼 좌측 배치 — 원본 art-src/expedition/bg/)
    scene:{ sky:["#CBE8F5","#EAF6E9"], ground:["#A9CF7F","#8AB763"], groundH:36,
      /* 넓은 흙길이 하단을 가로지른다 — 길 위 산책. 토끼들(좌측 잔디)은 장식 */
      charB:22, goalB:24, x0:10, x1:81,
      deco:[[6,30,"🌳",26],[14,64,"🌼",13],[93,30,"🌳",26],[87,66,"🌿",14],[9,84,"🐇",12]] } },
  meadow: { key:"meadow", title:"초원을 달리자!", emoji:"🌾",
    /* Ch6 초원 — 대표: 말·열기구 (사용자 기획서 2026-07-31) */
    mounts:["horse","balloon","deer","donkey","cloud"],
    /* [사용자 확정] 초원은 '달리기' — 전용 달리기 원화 + 이동 속도도 조금 빠르게(moveMs) */
    pose:"run", moveMs:1000, goal:"🏁", goalImg:"assets/expedition/flag/yellow.webp",   // 결승선 = 별 깃발
    bgImg:"assets/expedition/bg-meadow.webp",   // 사용자 배경 원화 (양·풍차 초원 — 원본 art-src/expedition/bg/)
    scene:{ sky:["#BDE3F7","#EAF6E0"], ground:["#A5D06A","#8CBE52"], groundH:38,
      /* 탁 트인 풀밭을 달린다 — 양(중앙)은 장식, 풍차 언덕이 도착 방향 */
      charB:24, goalB:28, x0:10, x1:81,
      deco:[[6,30,"🌳",26],[14,66,"🌼",13],[93,26,"🌻",18],[87,66,"🌿",14],[8,84,"🦋",11]] } },
  /* [사용자 확정 2026-07-31] 유적 → 보물섬으로 교체 (제목 '보물상자를 찾자!'는 그대로).
     키도 ruins → treasure 로 바꿨다 — 저장되는 값이 아니라 안전하다. */
  treasure: { key:"treasure", title:"보물상자를 찾자!", emoji:"🎁",
    /* Ch12 보물섬 — 대표: 범선·돌고래 (사용자 기획서 2026-07-31) */
    mounts:["sailboat","dolphin","canoe","unicorn","dragon","cloud"],
    pose:"walk", item:"map", goal:"🎁", goalImg:"assets/expedition/flag/yellow.webp",   // 보물 = 별 깃발
    bgImg:"assets/expedition/bg-treasure.webp",   // 사용자 배경 원화 (황금 보물섬·무지개·폭포 — 원본 art-src)
    scene:{ sky:["#7EC8F0","#D9EFB0"], ground:["#EBD188","#D6B863"], groundH:34,
      /* 앞쪽 모랫길을 따라 왼쪽 황금나무 아래에서 오른쪽 보물상자 쪽으로 (살짝 오르막) */
      /* 탈것 그림이 가로로 넓어 x0/xi를 안쪽으로 (왼쪽 끝에서 잘리지 않게) */
      charB:24, charB1:30, x0:14, x1:74,
      xi:14, iB:24,
      /* 도착 만세는 보물상자 앞 둔덕 아래 */
      xa:78, aB:32, gx:88, goalB:38,
      deco:[[6,26,"🌴",26],[14,64,"💎",14],[93,28,"🎁",22],[87,66,"🌿",13],[95,84,"✨",10]] } },
  skyisle: { key:"skyisle", title:"하늘섬으로 날아가자!", emoji:"☁️",
    /* Ch10 하늘 — 대표: 구름·열기구 (사용자 기획서). 하늘은 걸어서 갈 수 없어
       '기본(걷기)' 회차 없이 항상 탈것을 탄다(alwaysMount) — 6종 모두 원화가 있다. */
    mounts:["cloud","balloon","eagle","dragon","unicorn","rocket"], alwaysMount:true,
    pose:"walk",   // 폴백(실제로는 늘 탑승) — 도착 만세만 걷기 계열 원화를 쓴다
    goal:"🏰", goalImg:"assets/expedition/flag/yellow.webp",
    bgImg:"assets/expedition/bg-skyisle.webp",   // 사용자 배경 원화 (성 있는 부유섬·무지개 — 원본 art-src)
    scene:{ sky:["#7FC7F5","#CFEBFB"], ground:["#9AD1F0","#7CBEE6"], groundH:30,
      /* 왼쪽 작은 부유섬(잔디 bottom 36%)에서 출발해 오른쪽 성이 있는 섬(잔디 bottom 44%)으로.
         가는 길에 가운데 작은 섬(x 55~62%)을 지난다 */
      /* 나는 탈것은 저마다 lift(5~9)만큼 더 뜨므로, 출발 높이는 왼쪽 섬(36%)보다
         낮게 잡아야 제목 칩과 안 겹친다. 도착 높이는 성 섬 잔디(44%)에 맞춘다 */
      charB:24, charB1:36, x0:13, x1:74,
      xi:14, iB:24,
      /* 도착 만세는 성 앞 잔디 위 (탈것에서 내려서) */
      xa:82, aB:43, gx:88, goalB:44,
      deco:[[6,26,"☁️",22],[14,64,"🎈",14],[93,26,"🌈",22],[88,66,"☁️",16],[8,84,"✨",10]] } },
  space: { key:"space", title:"우주를 탐험하자!", emoji:"🚀",
    /* Ch11 우주 — 대표: 로켓·유성 (사용자 기획서). 하늘섬처럼 늘 탈것을 탄다 */
    mounts:["rocket","meteor","dragon","unicorn","cloud"], alwaysMount:true,
    pose:"walk",   // 폴백(실제로는 늘 탑승) — 도착 만세만 걷기 계열 원화를 쓴다
    goal:"🛰️", goalImg:"assets/expedition/flag/yellow.webp",
    bgImg:"assets/expedition/bg-space.webp",   // 사용자 배경 원화 (발사대→우주기지 — 원본 art-src)
    scene:{ sky:["#2C2A63","#4B3F86"], ground:["#5C4E96","#463B7A"], groundH:30,
      /* 왼쪽 발사대(바닥 36%)에서 은하수 띠를 따라 오른쪽 우주기지(바닥 31%)로 */
      /* 출발 높이는 제목 칩과 겹치지 않게 발사대(36%)보다 낮춘다 — 어차피 떠서 간다 */
      charB:30, charB1:33, x0:14, x1:78,
      xi:14, iB:30,
      /* 도착 만세는 우주기지 앞 (탈것에서 내려서) */
      xa:84, aB:31, gx:88, goalB:33,
      deco:[[7,26,"🌕",26],[14,64,"⭐",14],[92,26,"🛰️",20],[88,66,"🪐",16],[8,84,"✨",10]], dark:true } },
  /* ── 배경 원화가 오면 추가할 챕터 (사용자 기획서 2026-07-31의 12챕터 중 남은 것) ──
     [배경 없음] 설원(Ch8) — 기본=걷기, mounts:["sled","reindeersled","iceslide","dragon","unicorn","cloud"]
       (대표: 썰매·순록 썰매). 탑승 원화 3종(썰매·순록 썰매·얼음 미끄럼틀)은 이미 받아
       art-src/expedition/ride/ 에 보관돼 있다 — 배경이 오면 배포본만 다시 뽑아 RIDE_READY에 추가.
     ※ 기획서 Ch12 보물섬 = treasure(보물상자를 찾자). 바다(sea)는 '보물섬에 도착하자'로
       섬에 닿는 것까지, treasure는 섬에서 보물을 찾는 것까지로 나뉜다. */
};

/* 순환 순서 — 배열 순서 = 탐험 순서. 새 배경은 끝에 추가. */
export const EXPEDITION_ORDER = ["river","mountain","forest","cave","desert","sea","treasure","wood","meadow","skyisle","space"];   // 순서대로 순환 — 새 배경은 끝에 추가
/* 기준일(2026-01-05 월 = 강)부터 하루에 한 칸씩 순서대로 돈다.
   날짜만으로 정해지는 고정 시드라 과거·미래 어느 날짜를 열어도 항상 같다. */
const EXP_EPOCH = new Date("2026-01-05T00:00:00");
export function getExpedition(dateStr) {
  const d = new Date(String(dateStr || "") + "T00:00:00");
  const days = Math.round((d - EXP_EPOCH) / 86400000);
  const n = EXPEDITION_ORDER.length;
  const idx = Number.isFinite(days) ? ((days % n) + n) % n : 0;
  return EXPEDITIONS[EXPEDITION_ORDER[idx]] || EXPEDITIONS.treasure;
}

/* ── 그날의 탈것 (사용자 기획서 2026-07-31: "챕터마다 대표 탈것 + 변형 탈것") ──
   같은 배경이 다시 돌아올 때마다 다음 탈것으로 넘어간다. 한 바퀴(=EXPEDITION_ORDER
   길이)를 돌 때마다 회차가 1 늘고, 그 회차로 씬의 mounts 목록을 순환한다.
     회차 0 → 기본(걷기·수영·달리기) / 회차 1 → mounts[0](대표1) / 회차 2 → mounts[1](대표2) / …
   기본을 한 칸 끼워 넣는 이유: 기획서에서 각 챕터의 '기본'도 한 줄로 따로 적혀 있다.
   날짜만으로 정해지는 고정 시드라 저장할 게 없고, 과거·미래 어느 날을 열어도 같다.
   [지금은 아무 것도 바뀌지 않는다] 공용 탑승(앉기) 원화가 없어 컴포넌트가 탈것을
   그리지 않기 때문. 원화가 오면 이 함수가 그대로 그날의 탈것을 정해 준다. */
export function getExpeditionMount(dateStr) {
  const exp = getExpedition(dateStr);
  const list = exp.mounts || [];
  if (!list.length) return exp.mount || null;   // 목록이 없으면 씬 고정 탈것
  const d = new Date(String(dateStr || "") + "T00:00:00");
  const days = Math.round((d - EXP_EPOCH) / 86400000);
  if (!Number.isFinite(days)) return null;
  const lap = Math.floor(days / EXPEDITION_ORDER.length);   // 몇 바퀴째인지 (음수 날짜도 내림)
  /* alwaysMount 씬(하늘섬)은 '기본' 칸이 없다 — 하늘은 걸어서 갈 수 없으니 늘 탈것 */
  if (exp.alwaysMount) return list[((lap % list.length) + list.length) % list.length];
  const cycle = list.length + 1;                            // 기본 1칸 + 탈것 n칸
  const i = ((lap % cycle) + cycle) % cycle;
  return i === 0 ? null : list[i - 1];                      // null = 기본(걷기·수영 등)
}

/* 캐릭터 포즈 원화 (사용자 원화 2026-07-30 — 원본 art-src/expedition/char/).
   [사용자 확정] 지금은 남자아이 원화 하나를 남녀 공용으로 쓴다 — 여아 원화가
   오면 girl 경로만 교체하면 된다. halo 보정(반투명 흰 픽셀 재색칠) 적용됨.
   ride(공용 앉기)는 아직 없다 → 컴포넌트가 walk로 대체하고, 오면 여기만 채운다. */
const _CP = "assets/expedition/char/";
export const CHAR_IMG = {
  idle:    { boy: _CP+"common-idle.webp",    girl: _CP+"common-idle.webp" },   // 미션 0개 — 출발지 기본 자세 (사용자 확정)
  walk:    { boy: _CP+"common-walk.webp",    girl: _CP+"common-walk.webp" },
  run:     { boy: _CP+"common-run.webp",     girl: _CP+"common-run.webp" },    // 초원 전용 달리기 (사용자 원화 2026-07-31)
  swim:    { boy: _CP+"common-swim.webp",    girl: _CP+"common-swim.webp" },
  ride:    null,
  success: { boy: _CP+"common-success.webp", girl: _CP+"common-success.webp" },
};

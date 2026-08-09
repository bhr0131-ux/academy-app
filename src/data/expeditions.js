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
   hMul : 표시 높이 배율(기본 1) — [사용자 확정 2026-08-01] 32종 전부 같은 크기로,
          걷는 캐릭터와 같은 세로 81px(390 폭 카드 기준 = 카드 높이의 29%)로 그린다.
          사용자가 준 기준 그림(당나귀)을 실측해 맞춘 값이다.
          한동안 배는 0.7, 플라밍고는 1.1로 따로 뒀다가 전부 1로 되돌렸다.
          특정 탈것만 다르게 하고 싶을 때만 이 값을 준다.
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
  goat:{ n:11, emoji:"🐐", name:"산양" },
  /* cable: 지나는 길에 회색 줄을 그린다 — 곤돌라 맨 위(도르래)를 줄이 지나간다 */
  cablecar:{ n:12, emoji:"🚠", name:"케이블카", cable:true },
  /* 하늘 13~16 */ eagle:{ n:13, emoji:"🦅", name:"독수리", lift:8 }, balloon:{ n:14, emoji:"🎈", name:"열기구", lift:9 },
  /* [사용자 확정 2026-07-31] 구름은 '하늘 전용' — 하늘섬에서만 탄다.
     다른 챕터에도 넣으면 "드디어 구름을 탄다"는 하늘 챕터의 특별함이 옅어진다. */
  cloud:{ n:15, emoji:"☁️", name:"구름", lift:7 },                    rocket:{ n:16, emoji:"🚀", name:"로켓", lift:8 },
  /* 판타지 17~20 */ dragon:{ n:17, emoji:"🐉", name:"드래곤", lift:5 }, unicorn:{ n:18, emoji:"🦄", name:"유니콘" },
  carpet:{ n:19, emoji:"🧞", name:"마법양탄자", lift:4 },             sled:{ n:20, emoji:"🛷", name:"썰매" },
  /* 신규 시트 21~32 (사용자 2026-07-31) */
  minecart:{ n:21, emoji:"🚋", name:"광산 수레" },            bat:{ n:22, emoji:"🦇", name:"박쥐", lift:7 },
  crystal:{ n:23, emoji:"💎", name:"수정 슬라이드" },         owl:{ n:24, emoji:"🦉", name:"큰 부엉이", lift:7 },
  flamingo:{ n:25, emoji:"🦩", name:"플라밍고" },             meteor:{ n:26, emoji:"🌠", name:"유성", lift:10 },
  motorbike:{ n:27, emoji:"🏍️", name:"오토바이" },            sandboard:{ n:28, emoji:"🏄", name:"모래 보드" },
  iceslide:{ n:29, emoji:"🧊", name:"얼음 미끄럼틀" },        reindeersled:{ n:30, emoji:"🦌", name:"순록 썰매" },
  whale:{ n:31, emoji:"🐳", name:"고래" },                    submarine:{ n:32, emoji:"🟡", name:"잠수정" },
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
  "rocket","meteor",                          // 하늘섬·우주 챕터 개설로 가동
  "sled","reindeersled","iceslide",           // 설원 챕터 개설로 가동 — 시트 32종 전부 탑재
];
/* 원화에서 잰 가로세로비(가로÷세로). 그림 크기는 높이로만 정하기 때문에,
   화면 밖으로 삐져나가는지 계산하려면 폭을 알아야 한다 — 그 값이다.
   [사용자 확정 2026-08-01] 출발 자리가 전 챕터 13%로 같아지면서, 날개를 편 박쥐처럼
   폭이 넓은 그림은 왼쪽이 잘렸다. 그림을 줄이는 대신(24종을 최대 37%까지 줄여야 했다)
   삐져나가는 만큼만 안쪽으로 밀어 넣는다 — ExpeditionTrack이 이 값으로 계산한다.
   그림을 새로 교체하면 이 숫자도 다시 재서 고칠 것. */
const _RIDE_AR = {
  canoe:1.17,          raft:1.18,           sailboat:0.98,       ship:1.1,
  dolphin:1.04,        turtle:1.03,         horse:0.87,          donkey:0.89,
  deer:0.92,           camel:1.01,          goat:0.9,            cablecar:0.93,
  eagle:0.88,          balloon:0.64,        cloud:0.9,           rocket:0.76,
  dragon:1.07,         unicorn:0.99,        carpet:1.21,         sled:1.01,
  minecart:0.85,       bat:1.23,            crystal:0.99,        owl:1.12,
  flamingo:0.57,       meteor:1.03,         motorbike:0.88,      sandboard:0.91,
  iceslide:0.87,       reindeersled:1.05,   whale:0.84,          submarine:0.88,
};
/* ── 포즈별 표시 크기 [사용자 확정 2026-08-01] ────────────────────────────
   서있기·걷기·달리기는 scene.charH 그대로(390 폭 카드에서 세로 81px).
   만세와 수영은 그림 비율이 달라 그대로 두면 혼자 커 보인다 — 아래 배율로 맞춘다.
     만세 : 가로를 서있기와 같은 40px에 맞춘다 → 세로 67px (0.83배)
     수영 : 누워서 가는 자세라 낮게 → 세로 57px · 가로 90px (0.7배)
   배율이라 씬이 charH를 다르게 줘도(바다의 원근) 비율이 그대로 따라간다. */
export const POSE_MUL = { success: 0.83, swim: 0.7 };

/* 이동 방식 [사용자 확정 2026-08-01] — 그날 탈것이 어느 길로 가는지.
   fly=하늘길 · dive=물속길 · (안 적힌 것은 전부 바닥길, 걷기·달리기·수영도 바닥길)
   챕터의 scene.fly / scene.dive 에 그 길의 값이 있으면 그리로 간다. */
const _FLY = ["eagle", "balloon", "cloud", "rocket", "dragon", "carpet", "bat", "owl", "meteor",
  /* [사용자 확정 2026-08-01] 케이블카는 줄에 매달려 가므로 하늘길 */
  "cablecar"];
const _DIVE = ["submarine"];
_FLY.forEach((k) => { if (MOUNTS[k]) MOUNTS[k].k = "fly"; });
_DIVE.forEach((k) => { if (MOUNTS[k]) MOUNTS[k].k = "dive"; });

/* 여아 전용 탈것 그림 [사용자 원화 2026-08-08]
   탈것 그림에는 타고 있는 아이도 같이 그려져 있어서, 여아가 남아 그림을 쓰면
   화면 속 아이의 성별이 바뀐다. 여아 원화가 온 탈것만 여기에 키를 적으면
   {키}-girl.webp 를 imgGirl 로 달아 두고, 뷰어가 성별로 골라 그린다.
   나머지는 imgGirl 이 없으므로 지금까지처럼 공용 그림을 쓴다.
   가로세로비는 남아 것과 0.01 안쪽이라 _RIDE_AR 를 그대로 쓴다. */
const RIDE_GIRL_READY = ["unicorn", "dragon", "rocket", "eagle",
                         "deer", "camel", "goat", "cablecar",
                         "horse", "donkey", "dolphin", "ship",
                         "sailboat", "canoe", "raft",
                         "flamingo", "owl", "crystal", "bat",
                         "minecart", "sled", "turtle", "cloud",
                         "carpet", "meteor", "sandboard", "motorbike",
                         "whale", "reindeersled", "iceslide", "balloon",
                         "submarine"];

RIDE_READY.forEach((k) => {
  if (!MOUNTS[k]) return;
  MOUNTS[k].img = _RP + k + ".webp";
  if (RIDE_GIRL_READY.includes(k)) MOUNTS[k].imgGirl = _RP + k + "-girl.webp";
  MOUNTS[k].ar = _RIDE_AR[k] || 1;
});

/* 성별에 맞는 탈것 그림 — 여아 원화가 없으면 공용 그림으로 떨어진다 */
export const mountImgOf = (mount, gender) =>
  (gender === "girl" && mount?.imgGirl) || mount?.img || null;

/* ── 희귀도 4단계 (사용자 확정 2026-07-31) ────────────────────────────────
   아이가 "오늘은 평소보다 특별한 탈것이다!"를 바로 느끼게 하는 장치.
     ⚪ common(65%) · 🟢 rare(25%) · 🟣 epic(10%) · 🟡 legendary(5%)
   기본 이동(걷기·수영·달리기)도 common 취급이다. */
export const RARITY = { common:"common", rare:"rare", epic:"epic", legendary:"legendary" };
export const RARITY_LABEL = { common:"⚪ 흔함", rare:"🟢 조금 특별", epic:"🟣 아주 특별", legendary:"🟡 전설" };
export const RARITY_WEIGHT = { common:65, rare:25, epic:10, legendary:5 };
const _RARITY_OF = {
  common: ["horse","deer","donkey","camel","canoe","raft","ship","sled"],
  /* [사용자 확정] 로켓은 우주 챕터의 '기본 이동'이라 rare — 우주 후보가 전부 전설이면
     12일마다 전설이 확정돼 전설이 흔해진다 (실측 15% → 8%). */
  rare:   ["flamingo","turtle","goat","cablecar","sailboat","balloon","eagle","minecart","sandboard","reindeersled","rocket"],
  epic:   ["cloud","bat","crystal","dolphin","whale","submarine","motorbike","iceslide","owl"],   // [사용자 확정 2026-08-01] 돌고래↔플라밍고 교환
  legendary: ["unicorn","dragon","carpet","meteor"],
};
Object.entries(_RARITY_OF).forEach(([r, keys]) => keys.forEach((k) => { if (MOUNTS[k]) MOUNTS[k].r = r; }));
Object.values(MOUNTS).forEach((m) => { if (!m.r) m.r = "common"; });

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
   mounts: 그 챕터에서 탈 수 있는 탈것 목록. [사용자 확정 2026-07-31] '대표 탈것'은 두지
           않는다 — 목록 안에서는 전부 동등하고, 배열 순서는 등장 순서일 뿐이다.
           같은 챕터가 돌아올 때마다 기본 → 목록 순서대로 한 칸씩 (getExpeditionMount).
           같은 배경을 오래 쓰기 위한 장치.
   mount : mounts가 없을 때 쓰는 고정 탈것 (구버전 필드)
   item  : 걷기에 얹는 ADVENTURE_ITEMS 키 (기획 예시: 동굴=횃불 · 숲=나침반 · 사막=물병 · 보물=지도)
   goal  : 오른쪽 도착 지점 이모지 (goalImg 깃발 원화가 있으면 그걸 우선 — 사용자 확정)
   goalImg: 도착 깃발 원화 — 빨강=산·사막 / 파랑=강·바다 / 초록=숲 / 노랑=동굴·유적
   scene : CSS 폴백 배경 — sky·ground 그라데이션, 장식은 가장자리만(중앙 비움 규칙)
           deco: [x%, y%, 이모지, 크기px] (x는 0~22 또는 78~100만 쓸 것)

   ── 출발 자리 [사용자 확정 2026-08-01] ──────────────────────────────────
   한 번 전 챕터 13%로 맞췄다가, 배경마다 모래톱·길이 시작되는 자리가 달라
   지금은 챕터별로 사용자가 직접 정한다 (강 10 · 숲길 13 …).
   대체로 10~13% 사이에 둬서 어느 탐험을 열어도 비슷한 자리에서 출발한다.
   xi·iB(대기 자리)는 이동선의 시작과 같게 두는 게 기본 — 어긋나면 첫 미션에
   캐릭터가 위아래로 튄다.                                              */
export const EXPEDITIONS = {
  river: { key:"river", title:"강을 건너자!", emoji:"🌊",
    /* Ch2 강 — 물 위를 건넌다 (목록 안 탈것은 모두 동등) */
    mounts:["canoe","raft","dolphin","turtle","flamingo","ship"],   // [사용자 확정 2026-08-01] 범선은 뺀다 (바다 챕터에는 그대로)
    pose:"swim", goal:"⛺", goalImg:"assets/expedition/flag/blue.webp",   // 도착 = 물방울 깃발 (사용자 원화)
    bgImg:"assets/expedition/bg-river.webp",   // 사용자 배경 원화 v4 (1.4:1 — 큰 카드용, 원본 art-src)
    scene:{ sky:["#BFE3F2","#E8F5EC"], ground:["#7FC4DE","#5FA8CC"], groundH:34,
      /* [사용자 확정] 1.4:1 배경 → 높이 고정을 풀고 비율 카드로 (기기 폭이 달라도 안 잘림) */
      bgAR:1.4,
      /* [사용자 확정 2026-08-01] 왼쪽 모래톱(10·25)에 서 있다가, 출발하면 바로 수영으로
         바꿔 같은 높이로 물을 건너 오른쪽 모래톱(90·25)에 닿는다.
         탈것 회차는 서 있지 않고 처음부터 탄 채로 출발한다 (대기 자리가 같아 그대로 이어진다) */
      /* [사용자 확정 2026-08-01] 물살은 20보다 낮은 15 — 헤엄칠 땐 물에 잠기고,
         서고 만세할 땐 모래톱 위(20)로 올라선다 */
      charB:15, charB1:15, x0:10, x1:90,
      goalB:24, gx:92.5,
      xi:10, iB:20,     /* 출발 대기 — 왼쪽 모래톱 위 (물보다 한 단 높다) */
      xa:90, aB:20,     /* 도착 만세 — 오른쪽 모래톱 위 */
      /* 탈것 회차는 모래톱이 아니라 물 위(20)에서 탄 채로 출발 — 높이도 물살(15)에 맞춘다 */
      ride:{ x0:20, iB:15 },
      deco:[[6,30,"🌳",26],[13,66,"🌿",15],[93,28,"🌲",24],[87,66,"🪨",14],[8,84,"💧",11],[94,84,"🐟",12]] } },
  mountain: { key:"mountain", title:"바위산에 오르자!", emoji:"🏔️",
    /* Ch3 바위산 — 바위를 오른다 */
    mounts:["goat","cablecar","deer","horse","eagle","unicorn"],
    pose:"walk", item:"rope", goal:"🚩", goalImg:"assets/expedition/flag/red.webp",   // 정상 정복 = 빨간 깃발
    bgImg:"assets/expedition/bg-mountain.webp",   // 사용자 배경 원화 v2 (1.4:1 — 큰 카드용, 원본 art-src)
    scene:{ sky:["#CDE6F5","#F2EFE2"], ground:["#B9C9A0","#8FA878"], groundH:38,
      bgAR:1.4,
      /* [사용자 확정 2026-08-01] 여러 점을 지나는 길 —
         아래 흙길을 조금 걷다가(13~30) 돌계단으로 붙어(40) 대각선으로 올라
         정상 바로 아래(75·65)에서 한 뼘 더 오른다(75·70).
         진행도는 지나온 거리에 비례한다 (구간을 똑같이 나누지 않는다) */
      path:[[13,10],[30,10],[40,18],[75,65],[75,70]],
      xi:13, iB:10,
      xa:75, aB:70, gx:82, goalB:58,
      /* 하늘길(독수리·케이블카) [사용자 확정] — 시작부터 도착까지 일직선.
         10·40에서 떠서 바닥길과 같은 규칙
         (지나온 거리에 비례)으로 날아 도착 바위에 내려앉고, 내려서 75·70에서 만세.
         하늘길 높이는 캐릭터 가운데 기준이라, 발밑이 만세 자리(70)에 닿는
         가운데 값은 84다 (독수리 세로 29% / 반 14.5).
         [한계] 도착이 카드 위쪽이라 '하늘에서 쭉 내려오는' 구간을 넣을 여유가 없다 —
         위로 안 잘리는 가운데 최대가 85뿐이다. 내려오는 걸 보이게 하려면
         만세 자리를 낮추거나 도착 x를 더 왼쪽으로 옮겨야 한다. */
      fly:{ path:[[10,40],[75,84]] },
      deco:[[7,26,"🏔️",30],[14,64,"🌲",18],[92,24,"☁️",18],[88,64,"🪨",15],[5,84,"🌼",11]] } },
  forest: { key:"forest", title:"숲을 통과하자!", emoji:"🌳",
    /* Ch4 깊은 숲 — 숲길을 통과한다 */
    mounts:["horse","unicorn","deer","donkey","dragon","owl"],
    pose:"walk", item:"compass", goal:"🏡", goalImg:"assets/expedition/flag/green.webp",   // 숲 = 나뭇잎 깃발
    bgImg:"assets/expedition/bg-forest.webp",   // 사용자 배경 원화 v3 (1.4:1 — 큰 카드용, 원본 art-src)
    scene:{ sky:["#D8EFC9","#F0F6E2"], ground:["#9CBF7C","#7BA45E"], groundH:36,
      bgAR:1.4,
      /* 앞쪽 풀밭 길 — 사용자가 배경 위에 직접 그려 준 선 그대로 (2026-08-01).
         왼쪽 끝에서 오른쪽 끝까지 거의 평지로 가로지른다 (여우·부엉이는 길가 장식) */
      charB:31, charB1:32, x0:13, x1:88,
      xi:13, iB:31,
      xa:88, aB:32, gx:90, goalB:40,
      deco:[[6,28,"🌳",28],[14,62,"🍄",13],[93,30,"🌳",26],[87,66,"🌿",14],[9,84,"🦋",11]] } },
  cave: { key:"cave", title:"동굴을 빠져나가자!", emoji:"🕳️",
    /* Ch5 동굴 — 어둠 속을 빠져나간다 */
    mounts:["minecart","bat","crystal","dragon"],
    pose:"walk", item:"torch", goal:"🌕", goalImg:"assets/expedition/flag/yellow.webp",   // 어둠 속 별 깃발
    bgImg:"assets/expedition/bg-cave.webp",   // 사용자 배경 원화 v3 (1.4:1 — 큰 카드용, 원본 art-src)
    scene:{ sky:["#4D4661","#6B617E"], ground:["#5D5470","#443C55"], groundH:34,
      bgAR:1.4,
      /* 동굴 바닥(bottom 27~44%)을 따라 왼쪽 입구에서 오른쪽 수정 출구로 (거의 평지) */
      /* 수정 슬라이드·광산 수레는 그림이 넓어 출발 x를 안쪽으로 */
      charB:33, charB1:36, x0:13, x1:78,
      xi:13, iB:34,
      xa:82, aB:36, gx:90, goalB:42,
      deco:[[6,26,"🪨",22],[13,80,"💎",12],[93,26,"🦇",14],[88,64,"🪨",16],[95,80,"✨",10]], dark:true } },
  desert: { key:"desert", title:"사막을 건너자!", emoji:"🏜️",
    /* Ch7 사막 — 모래벌판을 건넌다 */
    mounts:["camel","carpet","eagle","balloon","motorbike","sandboard"],
    pose:"walk",   // 기획서: 사막의 기본은 걷기 — 탈것(낙타·양탄자…)은 회차마다 mounts에서
    goal:"🌴", goalImg:"assets/expedition/flag/red.webp",   // 모래 대비 빨간 깃발
    bgImg:"assets/expedition/bg-desert.webp",   // 사용자 배경 원화 v2 (1.4:1 — 큰 카드용, 원본 art-src)
    scene:{ sky:["#FBE3B7","#FDF2DC"], ground:["#EBCB8B","#D9B26C"], groundH:36,
      bgAR:1.4,
      /* 앞쪽 모래벌판(bottom 0~32%)을 따라 왼쪽 선인장 옆에서 오른쪽 유적으로 (살짝 오르막) */
      charB:24, charB1:32, x0:13, x1:74,
      xi:13, iB:24,
      xa:78, aB:34, gx:90, goalB:40,
      deco:[[7,30,"🌵",22],[16,78,"🪨",13],[92,26,"☀️",20],[87,66,"🌵",15],[6,84,"🦂",10]] } },
  sea: { key:"sea", title:"보물섬에 도착하자!", emoji:"🏝️",
    /* Ch9 바다 — 수평선 위 섬까지 간다 */
    mounts:["ship","dolphin","canoe","raft","sailboat","turtle","whale","submarine"],
    pose:"swim",   // 기획서: 바다의 기본은 수영 — 배·돌고래 등은 회차마다 mounts에서
    idlePose:"swim",   // 출발지도 바다 한가운데 — 서 있을 땅이 없어 물에 떠서 기다린다
    goal:"🏝️", goalImg:"assets/expedition/flag/blue.webp",   // 바다 = 물방울 깃발
    bgImg:"assets/expedition/bg-sea.webp",   // 사용자 배경 원화 v2 (1.4:1 — 큰 카드용, 원본 art-src)
    scene:{ sky:["#BEE4F5","#E9F6F0"], ground:["#6FBDDD","#4E9FC6"], groundH:40,
      bgAR:1.4,
      /* 수면 띠(bottom 39~51%)를 따라 앞바다에서 오른쪽 수평선의 섬으로.
         멀어지는 만큼 높이도 크기도 줄여 원근을 준다 (아래 물속은 배경 장식) */
      charB:41, charB1:48, charH:54, charH1:30, x0:13, x1:68,
      xi:13, iB:41,
      xa:74, aB:50,                /* 만세는 섬 백사장 위 */
      gx:80, goalB:51, goalH:30,
      deco:[[6,28,"☁️",18],[13,64,"🐚",12],[93,26,"🌴",24],[88,66,"🐬",14],[8,84,"🫧",11]] } },
  wood: { key:"wood", title:"숲길을 산책하자!", emoji:"🌲",
    /* Ch1 숲 — 숲길을 산책한다 */
    mounts:["deer","horse","donkey","unicorn","dragon"],
    pose:"walk", item:"lunchbox", goal:"🏡", goalImg:"assets/expedition/flag/green.webp",   // 숲 = 나뭇잎 깃발
    bgImg:"assets/expedition/bg-wood.webp",   // 사용자 배경 원화 v4 (1.4:1 — 토끼 축소, 원본 art-src)
    scene:{ sky:["#CBE8F5","#EAF6E9"], ground:["#A9CF7F","#8AB763"], groundH:36,
      bgAR:1.4,
      /* [사용자 확정 2026-08-01] 바닥길 — 넓은 흙길을 따라 평지로 가로지른다 */
      charB:20, charB1:20, x0:13, x1:90,
      xi:13, iB:20,
      xa:90, aB:20, gx:90, goalB:26,
      /* 하늘길(드래곤) [사용자 확정] — 나무 위 높이(70)를 유지한 채 90까지 곧게 날아가고,
         도착하면 만세 자리(90·23)로 내려앉는다. 하강은 도착 트윈이 알아서 만든다 */
      fly:{ charB:70, charB1:70 },
      deco:[[6,30,"🌳",26],[14,64,"🌼",13],[93,30,"🌳",26],[87,66,"🌿",14],[9,84,"🐇",12]] } },
  meadow: { key:"meadow", title:"초원을 달리자!", emoji:"🌾",
    /* Ch6 초원 — 풀밭을 달린다 */
    mounts:["horse","balloon","deer","donkey","unicorn"],
    /* [사용자 확정] 초원은 '달리기' — 전용 달리기 원화 + 이동 속도도 조금 빠르게(moveMs) */
    pose:"run", moveMs:1000, goal:"🏁", goalImg:"assets/expedition/flag/yellow.webp",   // 결승선 = 별 깃발
    bgImg:"assets/expedition/bg-meadow.webp",   // 사용자 배경 원화 v2 (1.4:1 — 큰 카드용, 원본 art-src)
    scene:{ sky:["#BDE3F7","#EAF6E0"], ground:["#A5D06A","#8CBE52"], groundH:38,
      bgAR:1.4,
      /* [사용자 확정 2026-08-01] 탁 트인 풀밭을 달린다 —
         앞쪽에서 살짝 내려섰다가(10·19 -> 20·16) 오른쪽 언덕으로 길게 오른다(90·35).
         [사용자 확정] 원안(24 -> 21 -> 40)에서 통째로 5 내린 값 — 풀밭에 더 붙는다.
         출발 대기·만세도 같이 5 내려 이동선과 높이를 맞춘다 */
      path:[[10,19],[20,16],[90,35]],
      xi:10, iB:19,
      xa:90, aB:35, gx:88, goalB:24,
      /* 하늘길(열기구) [사용자 확정] — 13·75에서 떠서 같은 높이로 90까지 곧게 날아가고,
         도착하면 90·35(바닥 만세 자리)로 내려앉아 만세.
         하늘길 높이는 캐릭터 가운데 기준 */
      fly:{ path:[[13,75],[90,75]] },
      deco:[[6,30,"🌳",26],[14,66,"🌼",13],[93,26,"🌻",18],[87,66,"🌿",14],[8,84,"🦋",11]] } },
  /* [사용자 확정 2026-07-31] 유적 → 보물섬으로 교체 (제목 '보물상자를 찾자!'는 그대로).
     키도 ruins → treasure 로 바꿨다 — 저장되는 값이 아니라 안전하다. */
  treasure: { key:"treasure", title:"보물상자를 찾자!", emoji:"🎁",
    /* Ch12 보물섬 — 섬 안 모랫길을 지나 보물상자로. 배경이 육지라 배 대신 육상·하늘 탈것 */
    mounts:["horse","deer","unicorn","dragon","owl","carpet"],
    pose:"walk", item:"map", goal:"🎁", goalImg:"assets/expedition/flag/yellow.webp",   // 보물 = 별 깃발
    bgImg:"assets/expedition/bg-treasure.webp",   // 사용자 배경 원화 v3 (1.4:1 — 큰 카드용, 원본 art-src)
    scene:{ sky:["#7EC8F0","#D9EFB0"], ground:["#EBD188","#D6B863"], groundH:34,
      bgAR:1.4,
      /* 앞쪽 모랫길(bottom 18~32%)을 따라 왼쪽 황금나무 아래에서 오른쪽 보물상자로 (살짝 오르막) */
      charB:22, charB1:28, x0:13, x1:74,
      xi:13, iB:22,
      /* 도착 만세는 보물상자 바로 앞 */
      xa:78, aB:30, gx:88, goalB:38,
      deco:[[6,26,"🌴",26],[14,64,"💎",14],[93,28,"🎁",22],[87,66,"🌿",13],[95,84,"✨",10]] } },
  snow: { key:"snow", title:"설원을 건너자!", emoji:"❄️",
    /* Ch8 설원 — 눈길을 건넌다 */
    mounts:["sled","reindeersled","iceslide","dragon","unicorn"],
    pose:"walk", goal:"🏡", goalImg:"assets/expedition/flag/red.webp",   // 눈 대비 빨간 깃발
    bgImg:"assets/expedition/bg-snow.webp",   // 사용자 배경 원화 v2 (1.4:1 — 큰 카드용, 원본 art-src)
    scene:{ sky:["#BBD9F7","#E8F3FC"], ground:["#EAF2FA","#CFE2F2"], groundH:34,
      bgAR:1.4,
      /* 눈길(밝은 띠, bottom 28~36%)을 따라 왼쪽 눈사람 쪽에서 오른쪽 통나무집으로 */
      charB:32, charB1:38, x0:13, x1:76,
      xi:13, iB:32,
      /* 도착 만세는 통나무집·선물 팻말 앞 */
      xa:80, aB:40, gx:90, goalB:44,
      deco:[[6,26,"🌲",26],[14,64,"⛄",16],[93,28,"🏡",22],[87,66,"🌲",16],[8,84,"❄️",11]] } },
  skyisle: { key:"skyisle", title:"하늘섬으로 날아가자!", emoji:"☁️",
    /* Ch10 하늘 — 하늘은 걸어서 갈 수 없어
       '기본(걷기)' 회차 없이 항상 탈것을 탄다(alwaysMount) — 6종 모두 원화가 있다. */
    mounts:["cloud","balloon","eagle","dragon","unicorn","rocket"], alwaysMount:true,
    pose:"walk",   // 폴백(실제로는 늘 탑승) — 도착 만세만 걷기 계열 원화를 쓴다
    goal:"🏰", goalImg:"assets/expedition/flag/yellow.webp",
    bgImg:"assets/expedition/bg-skyisle.webp",   // 사용자 배경 원화 v3 (1.4:1 — 큰 카드용, 원본 art-src)
    scene:{ sky:["#7FC7F5","#CFEBFB"], ground:["#9AD1F0","#7CBEE6"], groundH:30,
      /* [사용자 확정] 1.4:1 배경 → 비율 카드 */
      bgAR:1.4,
      /* 왼쪽 작은 부유섬(잔디 bottom 39%) 옆에서 출발해 오른쪽 성 섬(잔디 bottom 44%)으로.
         제목 칩이 그림 밖으로 나가서 위쪽 여유가 생겼다 — 출발을 섬 높이에 맞춰 올렸다 */
      /* 로켓·열기구는 그림이 가로로 넓어 출발 x를 안쪽으로 (왼쪽 끝에서 잘리지 않게) */
      charB:34, charB1:42, x0:13, x1:76,
      xi:13, iB:36,
      /* 도착 만세는 성 앞 잔디 위 (탈것에서 내려서) */
      xa:84, aB:44, gx:88, goalB:45,
      deco:[[6,26,"☁️",22],[14,64,"🎈",14],[93,26,"🌈",22],[88,66,"☁️",16],[8,84,"✨",10]] } },
  space: { key:"space", title:"우주를 탐험하자!", emoji:"🚀",
    /* Ch11 우주 — 하늘섬처럼 늘 탈것을 탄다 */
    mounts:["rocket","meteor","dragon","unicorn"], alwaysMount:true,
    pose:"walk",   // 폴백(실제로는 늘 탑승) — 도착 만세만 걷기 계열 원화를 쓴다
    goal:"🛰️", goalImg:"assets/expedition/flag/yellow.webp",
    bgImg:"assets/expedition/bg-space.webp",   // 사용자 배경 원화 v4 (1.4:1 — 오른쪽 우주기지·은하수 띠, 원본 art-src)
    scene:{ sky:["#2C2A63","#4B3F86"], ground:["#5C4E96","#463B7A"], groundH:30,
      bgAR:1.4,
      /* 왼쪽 은하수 띠 시작점(바닥 36%)에서 띠를 따라 오른쪽 우주기지 쪽(바닥 38%)으로 — 거의 수평 */
      charB:36, charB1:38, x0:13, x1:74,
      xi:13, iB:36,
      /* 도착 만세는 우주기지 발판 위 (탈것에서 내려서).
         [배경 v4] 기지가 전보다 높이 떠 있어 발판 윗면이 바닥 45~46% — 예전 38%는 허공이라 올려 잡았다 */
      xa:82, aB:46, gx:90, goalB:48,
      deco:[[7,26,"🌕",26],[14,64,"⭐",14],[92,26,"🛰️",20],[88,66,"🪐",16],[8,84,"✨",10]], dark:true } },
  /* ── 배경 원화가 오면 추가할 챕터 (사용자 기획서 2026-07-31의 12챕터 중 남은 것) ──
     ※ 기획서 Ch12 보물섬 = treasure(보물상자를 찾자). 바다(sea)는 '보물섬에 도착하자'로
       섬에 닿는 것까지, treasure는 섬에서 보물을 찾는 것까지로 나뉜다. */
};

/* 순환 순서 — 배열 순서 = 탐험 순서. 새 배경은 끝에 추가. */
/* [사용자 확정 2026-07-31] 12일 흐름 — 밝고 안전하게 시작해 색감·분위기를 번갈아 뒤집고
   판타지(하늘→우주)로 올라간 뒤 마지막 여행(바다)과 최종 보상(보물상자)으로 닫는다.
     숲길(안전한 시작) → 강(첫 변화) → 바위산(모험 시작) → 초원(탁 트임) → 숲(다시 자연)
     → 동굴(분위기 반전) → 사막(색감 반전) → 설원(또 한 번 반전)
     → 하늘섬(판타지) → 우주(클라이맥스) → 바다(마지막 여행) → 보물상자(최종 보상) */
export const EXPEDITION_ORDER = ["wood","river","mountain","meadow","forest","cave","desert","snow","skyisle","space","sea","treasure"];
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

/* ── 그날의 탈것 — 희귀도 + 중복 방지 (사용자 확정 2026-07-31) ─────────────
   [규칙 1] 최근 5일 안에 탄 것은 후보에서 뺀다 (챕터가 달라도).
   [규칙 2] 같은 챕터에서 최근 3회 안에 탄 것도 뺀다 — 강에서 돌고래가 나왔으면
            강이 세 번 더 지나기 전엔 돌고래가 안 나온다.
   [규칙 3] 남은 후보를 희귀도 가중치로 뽑는다 (⚪65 · 🟢25 · 🟣10 · 🟡5).
   기본 이동(걷기·수영·달리기)도 하나의 후보(⚪)로 함께 경쟁한다.

   ── 저장하지 않는다 ──
   '최근'을 알려면 이력이 필요한데, 저장해 두면 기기마다 달라지고 기존 저장 키도
   건드려야 한다. 그래서 기준일부터 그날까지를 매번 '재생'해서 이력을 만든다.
   난수도 날짜로 만든 고정 시드라 어느 기기·어느 시점에 열어도 결과가 같다.
   (하루 한 번 계산이라 기준일에서 몇 년이 지나도 수천 번 루프 = 1ms 미만) */
const _RECENT_DAYS = 5;      // 규칙 1
const _RECENT_LAPS = 3;      // 규칙 2
const _LEGEND_COOL = 20;     // 규칙 4 — 전설은 최소 20일 간격 (목표 5%에 맞춘 값)

/* 날짜 시드 난수 (mulberry32) — 같은 시드면 언제나 같은 값 */
function _rng(seed) {
  let a = (seed + 0x6D2B79F5) >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 하루치 후보 목록 — 기본 이동은 "_walk"처럼 밑줄 키로 구분해 이력에 남긴다 */
function _candidates(exp) {
  const list = (exp.mounts || []).filter((k) => MOUNTS[k] && MOUNTS[k].img);
  return exp.alwaysMount ? list : ["_" + exp.pose].concat(list);
}
function _rarityOf(key) {
  return key.startsWith("_") ? "common" : (MOUNTS[key]?.r || "common");
}

const _memo = new Map();     // days → 그날 뽑힌 키 (재생 결과 캐시)
function _pickUpTo(days) {
  if (_memo.has(days)) return _memo.get(days);
  const n = EXPEDITION_ORDER.length;
  const lastDay = {};        // 후보 → 마지막으로 탄 날 (규칙 1)
  const lastVisit = {};      // "챕터|후보" → 그 챕터 몇 번째 방문에서 탔는지 (규칙 2)
  const visits = {};         // 챕터 → 지금까지 방문 횟수
  let picked = null;
  let lastLegend = -1e9;     // 마지막으로 전설이 나온 날 (규칙 4)
  for (let d = 0; d <= days; d++) {
    const key = EXPEDITION_ORDER[((d % n) + n) % n];
    const exp = EXPEDITIONS[key];
    const all = _candidates(exp);
    const v = (visits[key] = (visits[key] || 0) + 1);
    /* 규칙 1: 최근 5일 안에 탄 것 제외 / 규칙 2: 이 챕터 최근 3회 안에 탄 것 제외 */
    /* 규칙 2의 제외 창은 후보 수에 맞춘다 — 후보가 4개뿐인 우주에서 3회를 막으면
       비전설(로켓)이 4번에 1번밖에 못 나와 전설이 강제된다 */
    const lapsBlock = Math.min(_RECENT_LAPS, Math.max(1, all.length - 3));
    let ok = all.filter((c) =>
      d - (lastDay[c] ?? -1e9) > _RECENT_DAYS &&
      v - (lastVisit[key + "|" + c] ?? -1e9) > lapsBlock);
    /* 규칙 4 — 전설은 최소 열흘 간격. 전설이 여러 개인 챕터(하늘·우주)에서 전설이
       몰려 나오는 걸 막는다. 전설밖에 없는 챕터(우주)면 이 줄이 비워져 그대로 나온다 */
    if (d - lastLegend <= _LEGEND_COOL) {
      const noL = ok.filter((c) => _rarityOf(c) !== "legendary");
      if (noL.length) ok = noL;
    }
    /* 규칙끼리 부딪히면(후보가 적고 다른 챕터와 겹칠 때) 규칙을 버리는 대신
       '가장 오래전에 탄 것'들만 남긴다 — 그래야 어제 탄 게 또 나오는 일이 없다 */
    let pool = ok;
    if (!pool.length) {
      /* 규칙끼리 부딪히면 '가장 오래전에 탄 것'들만 남긴다. 이때도 전설 쿨타임은
         지킨다 — 안 그러면 후보가 빠듯한 챕터에서 전설이 새어 나온다 */
      let base2 = all;
      if (d - lastLegend <= _LEGEND_COOL) {
        const noL = all.filter((c) => _rarityOf(c) !== "legendary");
        if (noL.length) base2 = noL;
      }
      const sorted = base2.slice().sort((a, b) => (lastDay[a] ?? -1e9) - (lastDay[b] ?? -1e9));
      pool = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
    }
    /* 규칙 3 — 희귀도 확률. [중요] 후보 하나하나에 가중치를 주면 전설이 여러 개인
       챕터에서 전설이 몰려 나온다(실측 22%). 그래서 '등급을 먼저 뽑고 → 그 등급
       안에서 하나를 고르는' 2단계로 한다. 그래야 어느 챕터든 ⚪65 🟢25 🟣10 🟡5 에 맞는다
       (그 등급이 아예 없는 챕터는 남은 등급끼리 비율을 다시 나눈다). */
    const byTier = {};
    pool.forEach((c) => (byTier[_rarityOf(c)] ||= []).push(c));
    const tiers = Object.keys(byTier);
    const tw = tiers.map((t) => RARITY_WEIGHT[t] || 1);
    const tsum = tw.reduce((a, b) => a + b, 0);
    const rnd = _rng(d * 977 + 17);
    let r = rnd() * tsum;
    let tier = tiers[tiers.length - 1];
    for (let i = 0; i < tiers.length; i++) { r -= tw[i]; if (r < 0) { tier = tiers[i]; break; } }
    const bucket = byTier[tier];
    const hit = bucket[Math.min(bucket.length - 1, Math.floor(rnd() * bucket.length))];
    lastDay[hit] = d;
    lastVisit[key + "|" + hit] = v;
    if (_rarityOf(hit) === "legendary") lastLegend = d;
    picked = hit;
    if (d >= days - 400) _memo.set(d, hit);   // 최근 구간만 캐시 (메모리 보호)
  }
  return picked;
}

export function getExpeditionMount(dateStr) {
  const exp = getExpedition(dateStr);
  if (!(exp.mounts || []).length) return exp.mount || null;
  const d = new Date(String(dateStr || "") + "T00:00:00");
  const days = Math.round((d - EXP_EPOCH) / 86400000);
  if (!Number.isFinite(days) || days < 0) return null;
  const hit = _pickUpTo(days);
  return hit && hit.startsWith("_") ? null : hit;   // null = 기본(걷기·수영·달리기)
}

/* 그날 탈것의 희귀도 (무대 문구·연출용). 기본 이동이면 "common" */
export function getExpeditionRarity(dateStr) {
  const k = getExpeditionMount(dateStr);
  return k ? (MOUNTS[k]?.r || "common") : "common";
}

/* 캐릭터 포즈 원화 (사용자 원화 2026-07-30 — 원본 art-src/expedition/char/).
   halo 보정(반투명 흰 픽셀 재색칠) 적용됨.
   [사용자 원화 2026-08-08] 여아 원화 5종(서있기·걷기·달리기·수영·만세)이 들어와
   포즈는 남녀가 모두 따로 그려진다. 그림은 '높이'로만 크기가 정해지므로
   (ExpeditionTrack의 imgH) 배포본을 남아와 같은 높이로 맞춰 두 성별이 같은
   크기로 그려진다 — 412 / 276 / 220 / 207 / 301.
   [2026-08-09 확인] ride(앉기)는 '없어서 비어 있는' 게 아니라 '쓸 데가 없어서' 비어 있다.
   탈것 원화 32종에 아이가 함께 그려져 있어 탄 회차에는 탈것 한 장만 그리고
   (ExpeditionTrack 480줄 근처), 어느 챕터도 pose:"ride"를 쓰지 않는다.
   받아 둔 앉기 원화는 art-src/expedition/char/{common,girl}-sit-src.webp 에 있다 —
   쓸 데가 생기면(예: 쉬는 날 대기 포즈) 그때 가공해 여기 채운다. */
const _CP = "assets/expedition/char/";
export const CHAR_IMG = {
  idle:    { boy: _CP+"common-idle.webp",    girl: _CP+"girl-idle.webp" },     // 미션 0개 — 출발지 기본 자세
  walk:    { boy: _CP+"common-walk.webp",    girl: _CP+"girl-walk.webp" },
  run:     { boy: _CP+"common-run.webp",     girl: _CP+"girl-run.webp" },      // 초원 전용 달리기 (사용자 원화 2026-07-31)
  swim:    { boy: _CP+"common-swim.webp",    girl: _CP+"girl-swim.webp" },
  ride:    null,
  success: { boy: _CP+"common-success.webp", girl: _CP+"girl-success.webp" },
};

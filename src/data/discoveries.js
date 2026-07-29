/* ════════════════════════════════════════════════════════════════════════
   오늘의 발견 — 데이터 & 순수 로직
   ────────────────────────────────────────────────────────────────────────
   기획 의도 (사용자 확정)
     "XP +50"만 뜨는 보상은 기억에 안 남는다. 탐험을 끝낸 날 아주 짧게
     "오늘은 파란 나비를 발견했어!" 한 줄이 붙으면, 아이는 보상보다
     '오늘은 뭘 발견했을까?'를 기대하게 된다. 그 기대감이 이 앱의 핵심 재미다.

   종류는 많을수록 좋은 게 아니다 (사용자 확정)
     "적은 종류를 자주 만나고, 가끔 희귀한 걸 만나는 것"이 아이가 더 좋아한다.
     그래서 59종에서 멈추고, 대신 6개 도감으로 나눠 채우는 재미를 준다.
     흔한 것은 금방 모으고, 전설은 오래도록 목표로 남는다.

   설계 원칙
     · 게임처럼 복잡하게 만들지 않는다. 발견은 하루 1개, 자동, 조작 없음.
     · 발견은 '아이템'이 아니라 '추억'이다 → 날짜와 함께 쌓고 지우지 않는다.
     · 같은 날은 몇 번을 다시 그려도 같은 발견이 나와야 한다(고정 시드).
     · 저장은 새 키(v6_discoveries)로만. 기존 키는 건드리지 않는다 (CLAUDE.md 6·7).
   ════════════════════════════════════════════════════════════════════════ */

/* ── 저장 키 (신규) ──────────────────────────────────────────────────────
   { [childId]: { log: [{d:"2026-07-29", id:"blue_butterfly"}] } }
   log는 날짜 오름차순으로 쌓기만 한다. 도감 보유 여부는 log에서 유도한다. */
export const DISCOVERY_KEY = "v6_discoveries";

/* ── 희귀도 (확률: 사용자 확정) ──────────────────────────────────────────
   흔한 건 금방 모이고, 전설은 몇 달을 해도 목표로 남는 배분이다.       */
export const DISCOVERY_RARITY = {
  common:   { label: "일반",     star: "⭐",     color: "#8A7458", weight: 70 },
  uncommon: { label: "희귀",     star: "⭐⭐",   color: "#3B82F6", weight: 20 },
  rare:     { label: "매우 희귀", star: "⭐⭐⭐", color: "#8B5CF6", weight: 8  },
  legend:   { label: "전설",     star: "🌈",     color: "#F59E0B", weight: 2  },
};

/* ── 도감 분류 ───────────────────────────────────────────────────────────
   "오늘은 새로운 도감이 열릴까?"를 만들기 위해 종류를 나눠 둔다.        */
export const DISCOVERY_CATEGORIES = [
  { key: "plant",    label: "식물 도감", emoji: "🌼" },
  { key: "bug",      label: "곤충 도감", emoji: "🦋" },
  { key: "feather",  label: "깃털 도감", emoji: "🪶" },
  { key: "treasure", label: "보물 도감", emoji: "🪙" },
  { key: "food",     label: "먹거리 도감", emoji: "🍎" },
  { key: "mystery",  label: "신비 도감", emoji: "🥚" },
];

/* ── 발견 목록 (59종) ────────────────────────────────────────────────────
   c   : 도감 분류
   msg : 말풍선 한 줄. 아이에게 말 거는 말투로. 가끔은 사건처럼
         ("원숭이가 바나나를 선물했어!") 써서 랜덤 이벤트 느낌을 준다.
   pet : 펫과 연결될 효과.
         [주의] 아직 펫 수치에 반영하지 않는다 — 정의만 해 둔 상태다.
         펫 데이터(v6_pet)에 친밀도·먹이 개념을 먼저 넣어야 연결할 수 있다.
   hint: 아직 못 끝낸 날 탐험일지에 뜨는 힌트 (기대하며 시작하게)        */
const D = (id, c, emoji, name, rarity, msg, hint, pet = null) => ({ id, c, emoji, name, rarity, msg, hint, pet });

export const DISCOVERIES = [
  /* ── 🌼 식물 도감 (15종) ── */
  D("flower_yellow", "plant", "🌼", "노란 꽃",     "common",   "노란 꽃을 발견했어!",        "오늘 꽃향기가 많이 나!"),
  D("flower_pink",   "plant", "🌸", "분홍 꽃",     "common",   "분홍 꽃이 활짝 폈어!",       "오늘 꽃향기가 많이 나!"),
  D("flower_red",    "plant", "🌺", "빨간 꽃",     "common",   "빨간 꽃을 발견했어!",        "오늘 꽃향기가 많이 나!"),
  D("sunflower",     "plant", "🌻", "해바라기",     "common",   "커다란 해바라기를 만났어!",   "햇볕이 유난히 좋아!"),
  D("sprout",        "plant", "🌱", "새싹",        "common",   "새싹이 빼꼼 올라왔어!",      "땅에서 뭔가 자라는 것 같아!"),
  D("mushroom",      "plant", "🍄", "버섯",        "common",   "비가 와서 버섯이 자랐어!",    "비 온 뒤라 뭔가 자랐을지도!"),
  D("grass_seed",    "plant", "🌾", "풀씨",        "common",   "풀씨가 바람에 날아왔어!",     "바람이 살랑살랑 불어!"),
  D("herb",          "plant", "🌿", "허브잎",       "common",   "향긋한 허브잎을 땄어!",      "좋은 냄새가 나는 것 같아!"),
  D("acorn",         "plant", "🌰", "도토리",       "common",   "도토리를 주웠어!",          "숲에서 바스락 소리가 나!", { kind: "친밀도", amount: 5 }),
  D("chestnut",      "plant", "🥜", "밤",          "common",   "알밤을 하나 주웠어!",        "숲에서 바스락 소리가 나!", { kind: "먹이", amount: 1 }),
  D("maple",         "plant", "🍂", "단풍잎",       "common",   "예쁜 단풍잎을 주웠어!",      "나뭇잎 색이 곱네!"),
  D("branch",        "plant", "🪵", "나뭇가지",     "common",   "튼튼한 나뭇가지를 찾았어!",   "숲에서 바스락 소리가 나!"),
  D("shiny_stone",   "plant", "🪨", "반짝이는 돌",  "common",   "반짝이는 돌을 주웠어!",      "오늘은 반짝이는 걸 찾을 것 같아!"),
  D("clover",        "plant", "🍀", "네잎클로버",   "uncommon", "네잎클로버를 찾았어!",       "발밑을 잘 보고 걸어봐!"),
  D("crystal_shard", "plant", "💎", "수정 조각",    "rare",     "땅속에서 수정 조각이 나왔어!", "땅속에 뭔가 묻혀 있는 것 같아!"),

  /* ── 🦋 곤충 도감 (10종) ── */
  D("ladybug",     "bug", "🐞", "무당벌레",   "common",   "무당벌레가 손에 앉았어!",      "작은 친구들이 많이 보여!"),
  D("bee",         "bug", "🐝", "꿀벌",      "common",   "꿀벌이 꽃을 찾아다녀!",        "꽃 주변이 붕붕거려!"),
  D("grasshopper", "bug", "🦗", "메뚜기",     "common",   "메뚜기가 폴짝 뛰었어!",        "풀숲이 들썩들썩해!"),
  D("beetle",      "bug", "🪲", "딱정벌레",   "common",   "딱정벌레를 발견했어!",         "나무 밑을 살펴봐!"),
  D("caterpillar", "bug", "🐛", "애벌레",     "common",   "애벌레를 만났어!",            "나뭇잎이 오물오물 흔들려!", { kind: "먹이", amount: 1 }),
  D("spider",      "bug", "🕷️", "거미",      "common",   "거미줄이 반짝반짝 빛나!",       "거미줄에 이슬이 맺혔어!"),
  D("dragonfly",   "bug", "🪰", "잠자리",     "common",   "잠자리가 머리 위를 맴돌아!",     "오늘 나풀나풀 뭔가 날아다녀!"),
  D("butterfly",   "bug", "🦋", "파란 나비",   "uncommon", "희귀한 파란 나비를 발견했어!",   "오늘 나풀나풀 뭔가 날아다녀!"),
  D("firefly",     "bug", "✨", "반딧불이",    "uncommon", "반딧불이가 길을 밝혀 줬어!",     "밤에 뭔가 반짝일 것 같아!"),
  D("gold_butterfly", "bug", "🦋", "황금 나비", "rare",    "황금 나비가 날아왔어!",        "오늘 나풀나풀 뭔가 날아다녀!"),

  /* ── 🪶 깃털 도감 (8종) ── */
  D("feather_sparrow", "feather", "🪶", "참새 깃털",   "common",   "참새가 깃털을 떨어뜨렸어!",      "어디선가 새 소리가 들려!"),
  D("feather_green",   "feather", "🦜", "초록 깃털",   "common",   "초록 깃털을 주웠어!",           "어디선가 새 소리가 들려!"),
  D("feather_red",     "feather", "❤️", "빨간 깃털",   "common",   "빨간 깃털을 주웠어!",           "어디선가 새 소리가 들려!"),
  D("feather_parrot",  "feather", "🦜", "앵무새 깃털", "uncommon", "앵무새가 깃털 하나를 선물했어!",  "어디선가 새 소리가 들려!", { kind: "친밀도", amount: 5 }),
  D("feather_blue",    "feather", "💙", "파란 깃털",   "uncommon", "파란 깃털을 주웠어!",           "어디선가 새 소리가 들려!"),
  D("feather_owl",     "feather", "🦉", "부엉이 깃털", "rare",     "부엉이가 인사하고 깃털을 줬어!",  "누가 나를 지켜보는 것 같아!"),
  D("feather_peacock", "feather", "🦚", "공작 깃털",   "rare",     "화려한 공작 깃털을 발견했어!",    "오늘 뭔가 화려한 걸 볼 것 같아!"),
  D("feather_rainbow", "feather", "🌈", "무지개 깃털", "legend",   "무지개 깃털을 발견했어!!",       "오늘은 아주 특별한 날 같아!", { kind: "친밀도", amount: 10 }),

  /* ── 🪙 보물 도감 (8종) ── */
  D("coin",      "treasure", "🪙", "동전",       "common",   "오래된 탐험가의 동전을 주웠어!", "땅속에 뭔가 묻혀 있는 것 같아!"),
  D("compass",   "treasure", "🧭", "나침반",      "common",   "낡은 나침반을 발견했어!",       "길을 알려줄 뭔가가 있을 것 같아!"),
  D("old_key",   "treasure", "🗝️", "오래된 열쇠", "uncommon", "오래된 열쇠를 주웠어!",         "어딘가 잠긴 문이 있을지도!"),
  D("old_map",   "treasure", "📜", "낡은 지도",   "uncommon", "낡은 보물 지도를 발견했어!",     "오늘은 길을 잘 봐야 할 것 같아!"),
  D("ring",      "treasure", "💍", "보물 반지",   "uncommon", "반짝이는 반지를 찾았어!",       "오늘은 반짝이는 걸 찾을 것 같아!"),
  D("gold_coin", "treasure", "💰", "금화",       "rare",     "진짜 금화를 발견했어!",         "땅속에 뭔가 묻혀 있는 것 같아!"),
  D("gem",       "treasure", "💎", "보석",       "rare",     "커다란 보석을 발견했어!",       "오늘은 반짝이는 걸 찾을 것 같아!"),
  D("crown",     "treasure", "👑", "왕관 조각",   "legend",   "왕관 조각을 발견했어!!",        "오늘은 아주 특별한 날 같아!"),

  /* ── 🍎 먹거리 도감 (8종) ── */
  D("strawberry", "food", "🍓", "딸기",      "common",   "빨간 딸기를 땄어!",            "달콤한 냄새가 나!", { kind: "먹이", amount: 1 }),
  D("banana",     "food", "🍌", "바나나",     "common",   "원숭이가 바나나를 선물했어!",    "나무 위가 시끌시끌해!", { kind: "먹이", amount: 2 }),
  D("blueberry",  "food", "🫐", "블루베리",   "common",   "블루베리를 한 줌 땄어!",        "달콤한 냄새가 나!", { kind: "먹이", amount: 1 }),
  D("apple",      "food", "🍎", "사과",      "common",   "잘 익은 사과를 땄어!",          "달콤한 냄새가 나!", { kind: "먹이", amount: 1 }),
  D("watermelon", "food", "🍉", "수박 조각",  "common",   "시원한 수박을 나눠 먹었어!",     "오늘 좀 덥네!", { kind: "먹이", amount: 1 }),
  D("coconut",    "food", "🥥", "코코넛",     "common",   "코코넛이 톡 떨어졌어!",         "나무 위가 시끌시끌해!", { kind: "먹이", amount: 1 }),
  D("mango",      "food", "🥭", "망고",      "uncommon", "잘 익은 망고를 발견했어!",       "달콤한 냄새가 나!", { kind: "먹이", amount: 2 }),
  D("honey",      "food", "🍯", "꿀단지",     "rare",     "벌집에서 꿀단지를 얻었어!",      "꽃 주변이 붕붕거려!", { kind: "친밀도", amount: 5 }),

  /* ── 🥚 신비 도감 (10종) ── */
  D("stardust",     "mystery", "✨", "별가루",      "common",   "별가루가 손에 묻었어!",         "오늘 밤하늘이 예쁠 것 같아!"),
  D("cloud",        "mystery", "☁️", "구름 조각",   "common",   "구름 조각을 붙잡았어!",        "하늘이 폭신폭신해 보여!"),
  D("small_egg",    "mystery", "🥚", "작은 알",     "common",   "작은 알을 발견했어!",          "둥지가 있을 것 같아!", { kind: "친밀도", amount: 5 }),
  D("star_piece",   "mystery", "⭐", "별조각",      "common",   "떨어진 별조각을 주웠어!",       "오늘 밤하늘이 예쁠 것 같아!"),
  D("moon_piece",   "mystery", "🌙", "달조각",      "uncommon", "달조각이 빛나고 있어!",        "오늘 밤하늘이 예쁠 것 같아!"),
  D("sun_crystal",  "mystery", "☀️", "햇살 결정",   "uncommon", "햇살이 굳어서 결정이 됐어!",    "햇볕이 유난히 좋아!"),
  D("rainbow_bit",  "mystery", "🌈", "무지개 조각", "uncommon", "무지개 조각을 발견했어!",       "비 온 뒤라 뭔가 자랐을지도!"),
  D("orb",          "mystery", "🔮", "신비한 구슬", "rare",     "신비한 구슬을 발견했어!",       "오늘 뭔가 신비한 일이 있을 것 같아!"),
  D("fossil",       "mystery", "🦕", "공룡 화석",   "rare",     "공룡 화석을 발굴했어!",        "땅속에 뭔가 묻혀 있는 것 같아!"),
  D("dragon_egg",   "mystery", "🐉", "드래곤 알",   "legend",   "드래곤 알을 발견했어!!",       "오늘은 아주 특별한 날 같아!", { kind: "친밀도", amount: 10 }),
];

/* ── 구 id 별칭 (읽기 폴백) ──────────────────────────────────────────────
   15종이던 첫 버전에서 59종으로 늘리며 일부 id를 바꿨다. 이미 저장된 기록이
   사라지면 안 되므로(발견은 '추억'이다) 읽을 때만 새 id로 바꿔 준다.
   저장된 값 자체는 건드리지 않는다 (CLAUDE.md 7 — 마이그레이션은 읽기 폴백으로). */
const LEGACY_ID = {
  yellow_flower:   "flower_yellow",
  seed:            "sprout",          // '꽃씨' → 가장 가까운 '새싹'
  blue_butterfly:  "butterfly",
  parrot_feather:  "feather_parrot",
  old_coin:        "coin",
  monkey:          "banana",          // '원숭이가 바나나를 선물' 문구를 바나나가 이어받음
  star_shell:      "shiny_stone",     // '별무늬 조개' 은퇴 → 가장 가까운 수집품
  rainbow_feather: "feather_rainbow",
  gold_egg:        "dragon_egg",      // 전설 알 → 드래곤 알
  crystal:         "crystal_shard",
};
export const normalizeDiscoveryId = (id) => LEGACY_ID[id] || id;

export const getDiscovery = (id) => DISCOVERIES.find(d => d.id === normalizeDiscoveryId(id)) || null;
export const DISCOVERY_TOTAL = DISCOVERIES.length;

/* ── 고정 시드 뽑기 ──────────────────────────────────────────────────────
   같은 아이·같은 날짜면 항상 같은 결과가 나와야 한다. 화면을 다시 그릴 때마다
   발견이 바뀌면 '오늘의 발견'이 아니게 되고, 저장 전에 새로고침하면 값이
   달라지는 버그가 된다. 그래서 난수 대신 문자열 해시를 쓴다. */
function hash32(str) {
  let h = 2166136261;                       // FNV-1a
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/* 그날의 발견 1개를 정한다. childId+date만 있으면 어디서 불러도 같은 값. */
export function rollDiscovery(childId, dateStr) {
  const h = hash32(`${childId}|${dateStr}|discovery`);
  /* ① 희귀도부터 정한다 (가중치 70/20/8/2) */
  const rar = Object.entries(DISCOVERY_RARITY);
  const totalW = rar.reduce((a, [, v]) => a + v.weight, 0);
  let pick = h % totalW, chosen = "common";
  for (const [key, v] of rar) {
    if (pick < v.weight) { chosen = key; break; }
    pick -= v.weight;
  }
  /* ② 그 희귀도 안에서 하나 (①과 다른 비트를 써야 종류가 한쪽으로 쏠리지 않는다) */
  const pool = DISCOVERIES.filter(d => d.rarity === chosen);
  return pool[(h >>> 8) % pool.length];
}

/* 오늘 힌트 — 아직 못 끝낸 날 탐험일지에 뜬다. 오늘 발견의 hint를 그대로 쓴다.
   ("오늘은 반짝이는 걸 찾을 것 같아!" → 아이가 기대하며 시작한다) */
export const getTodayHint = (childId, dateStr) => rollDiscovery(childId, dateStr).hint;

/* ── 랜덤 이벤트 (사용자 확정 ⑤) ────────────────────────────────────────
   발견과 별개로, 아주 가끔(15%) 길에서 겪는 작은 사건. 매일 나오면 특별함이
   없어서 확률을 낮게 잡았다 (사용자: 10~20%).
   '획득'은 없다 — 획득이 생기면 발견(도감)과 겹쳐 복잡해진다. 만남·인사만.
   동물들은 지도 원화에 실제로 그려져 있는 친구들이다 (원숭이·앵무새·개구리·멧돼지…).
   [주의] 목록의 순서·개수를 바꾸면 과거 날짜의 이벤트도 바뀐다 — 저장하지 않고
   그날그날 다시 계산하기 때문. 지난 추억 표시가 달라지므로 확정 후엔 고정할 것. */
export const DISCO_EVENTS = [
  { id: "ev_monkey",  emoji: "🐒", msg: "원숭이가 나무에서 손을 흔들었어!" },
  { id: "ev_parrot",  emoji: "🦜", msg: "앵무새가 길을 알려 줬어!" },
  { id: "ev_frog",    emoji: "🐸", msg: "개구리와 인사했어!" },
  { id: "ev_boar",    emoji: "🐗", msg: "멧돼지를 조심조심 지나갔어!" },
  { id: "ev_rainbow", emoji: "🌈", msg: "하늘에 무지개가 떴어!" },
  { id: "ev_butterfly", emoji: "🦋", msg: "나비들이 길 안내를 해 줬어!" },
  { id: "ev_turtle",  emoji: "🐢", msg: "거북이가 느릿느릿 응원해 줬어!" },
  { id: "ev_toucan",  emoji: "🐦", msg: "큰부리새가 노래를 불러 줬어!" },
];
export function rollEvent(childId, dateStr) {
  const h = hash32(`${childId}|${dateStr}|event`);
  if (h % 100 >= 15) return null;                       // 15%만 이벤트가 있는 날
  return DISCO_EVENTS[(h >>> 8) % DISCO_EVENTS.length]; // 발견처럼 다른 비트로 종류 결정
}

/* ── 지도 발견 지점 (사용자 확정 ②) ─────────────────────────────────────
   길 중간(진행률 32~74%)의 한 지점. 날마다 자리가 바뀌어야 "오늘은 어디서
   찾을까?"가 생긴다. 캐릭터가 이 지점을 지나면 지도에서 발견 팝이 뜬다. */
export function rollSparkT(childId, dateStr) {
  const h = hash32(`${childId}|${dateStr}|spark`);
  return 0.32 + (h % 1000) / 1000 * 0.42;
}

/* ── 저장 데이터 순수 로직 ───────────────────────────────────────────── */
/* 저장된 기록을 읽을 때 구 id를 새 id로 바꿔서 돌려준다 (원본은 그대로 둔다) */
export const getDiscoveryLog = (data, childId) =>
  ((data?.[childId]?.log) || []).map(e => ({ ...e, id: normalizeDiscoveryId(e.id) }));

export const getDiscoveryOn = (data, childId, dateStr) =>
  getDiscoveryLog(data, childId).find(e => e.d === dateStr) || null;

/* 오늘 발견을 기록한다. 이미 기록돼 있으면 그대로 둔다(하루 1개).
   반환: { next, entry, isNew } — isNew일 때만 연출을 띄운다. */
export function recordDiscovery(data, childId, dateStr) {
  const log = getDiscoveryLog(data, childId);
  const already = log.find(e => e.d === dateStr);
  if (already) return { next: data, entry: already, isNew: false };
  const d = rollDiscovery(childId, dateStr);
  const entry = { d: dateStr, id: d.id };
  const next = { ...(data || {}), [childId]: { ...(data?.[childId] || {}), log: [...log, entry] } };
  return { next, entry, isNew: true };
}

/* 도감 — 지금까지 발견한 종류와 각각 몇 번 찾았는지 */
export function getCollection(data, childId) {
  const counts = {};
  for (const e of getDiscoveryLog(data, childId)) counts[e.id] = (counts[e.id] || 0) + 1;
  return DISCOVERIES.map(d => ({ ...d, count: counts[d.id] || 0, found: !!counts[d.id] }));
}

/* 도감별로 묶어서 준다 — "오늘은 새로운 도감이 열릴까?"를 만들기 위한 화면용 */
export function getCollectionByCategory(data, childId) {
  const all = getCollection(data, childId);
  return DISCOVERY_CATEGORIES.map(cat => {
    const items = all.filter(d => d.c === cat.key);
    return { ...cat, items, found: items.filter(d => d.found).length, total: items.length };
  });
}

export const getCollectedCount = (data, childId) =>
  getCollection(data, childId).filter(d => d.found).length;

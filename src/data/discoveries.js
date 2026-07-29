/* ════════════════════════════════════════════════════════════════════════
   오늘의 발견 — 데이터 & 순수 로직
   ────────────────────────────────────────────────────────────────────────
   기획 의도 (사용자 확정)
     "XP +50"만 뜨는 보상은 기억에 안 남는다. 탐험을 끝낸 날 아주 짧게
     "오늘은 파란 나비를 발견했어!" 한 줄이 붙으면, 아이는 보상보다
     '오늘은 뭘 발견했을까?'를 기대하게 된다. 그 기대감이 이 앱의 핵심 재미다.

   설계 원칙
     · 게임처럼 복잡하게 만들지 않는다. 발견은 하루 1개, 자동, 조작 없음.
     · 발견은 '아이템'이 아니라 '추억'이다 → 날짜와 함께 쌓고 지우지 않는다.
     · 같은 날은 몇 번을 다시 그려도 같은 발견이 나와야 한다(고정 시드).
     · 저장은 새 키(v6_discoveries)로만. 기존 키는 건드리지 않는다 (CLAUDE.md 6·7).
   ════════════════════════════════════════════════════════════════════════ */

/* ── 저장 키 (신규) ──────────────────────────────────────────────────────
   { [childId]: { log: [{d:"2026-07-29", id:"blue_butterfly"}], } }
   log는 날짜 오름차순으로 쌓기만 한다. 도감 보유 여부는 log에서 유도한다. */
export const DISCOVERY_KEY = "v6_discoveries";

/* ── 희귀도 ──────────────────────────────────────────────────────────────
   legend는 아주 가끔만. 매일 나오면 특별함이 사라진다(사용자 확정). */
export const DISCOVERY_RARITY = {
  common: { label: "흔함",   color: "#8A7458", weight: 62 },
  rare:   { label: "귀함",   color: "#3B82F6", weight: 30 },
  legend: { label: "전설",   color: "#F59E0B", weight: 8  },
};

/* ── 발견 도감 ───────────────────────────────────────────────────────────
   emoji  : 도감·말풍선에 쓰는 그림 (나중에 원화로 교체 가능)
   name   : 도감에 적히는 이름
   msg    : 말풍선 한 줄. 아이에게 말 거는 말투로.
   pet    : 펫과 연결되는 효과 (없으면 null) — 표시용 문구까지 여기서 관리한다.
   hint   : 탐험 시작 전 펫이 흘리는 힌트 (같은 종류끼리 겹쳐도 괜찮다)      */
export const DISCOVERIES = [
  /* ── 흔함 ── */
  { id: "yellow_flower", emoji: "🌼", name: "노란 꽃",       rarity: "common", msg: "노란 꽃을 발견했어!",           pet: null,                       hint: "오늘 꽃향기가 많이 나!" },
  { id: "acorn",         emoji: "🌰", name: "도토리",         rarity: "common", msg: "도토리를 주웠어!",              pet: { kind: "친밀도", amount: 5 }, hint: "숲에서 바스락 소리가 나!" },
  { id: "shiny_stone",   emoji: "🪨", name: "반짝이는 돌",     rarity: "common", msg: "반짝이는 돌을 주웠어!",          pet: null,                       hint: "오늘은 반짝이는 걸 찾을 수 있을 것 같아!" },
  { id: "clover",        emoji: "🍀", name: "네잎클로버",      rarity: "common", msg: "네잎클로버를 찾았어!",           pet: null,                       hint: "발밑을 잘 보고 걸어봐!" },
  { id: "caterpillar",   emoji: "🐛", name: "애벌레",         rarity: "common", msg: "애벌레를 만났어!",              pet: { kind: "먹이", amount: 1 },   hint: "나뭇잎이 오물오물 흔들려!" },
  { id: "seed",          emoji: "🌱", name: "꽃씨",           rarity: "common", msg: "꽃씨를 발견했어!",              pet: null,                       hint: "오늘 꽃향기가 많이 나!" },
  { id: "mushroom",      emoji: "🍄", name: "빨간 버섯",       rarity: "common", msg: "빨간 버섯을 발견했어!",          pet: { kind: "먹이", amount: 1 },   hint: "비 온 뒤라 뭔가 자랐을지도!" },

  /* ── 귀함 ── */
  { id: "blue_butterfly", emoji: "🦋", name: "파란 나비",      rarity: "rare",   msg: "희귀한 파란 나비를 발견했어!",     pet: null,                       hint: "오늘 나풀나풀 뭔가 날아다녀!" },
  { id: "parrot_feather", emoji: "🪶", name: "앵무새 깃털",     rarity: "rare",   msg: "앵무새가 깃털 하나를 선물했어!",   pet: { kind: "친밀도", amount: 5 }, hint: "어디선가 새 소리가 들려!" },
  { id: "old_coin",       emoji: "🪙", name: "탐험가의 동전",   rarity: "rare",   msg: "오래된 탐험가의 동전을 주웠어!",   pet: null,                       hint: "땅속에 뭔가 묻혀 있는 것 같아!" },
  { id: "monkey",         emoji: "🐒", name: "장난꾸러기 원숭이", rarity: "rare",  msg: "원숭이를 만나 바나나를 받았어!",   pet: { kind: "먹이", amount: 2 },   hint: "나무 위가 시끌시끌해!" },
  { id: "star_shell",     emoji: "🐚", name: "별무늬 조개",     rarity: "rare",   msg: "별무늬 조개를 주웠어!",          pet: null,                       hint: "물가 쪽에서 뭔가 반짝여!" },

  /* ── 전설 ── */
  { id: "rainbow_feather", emoji: "🌈", name: "무지개 깃털",    rarity: "legend", msg: "무지개 깃털을 발견했어!!",        pet: { kind: "친밀도", amount: 10 }, hint: "오늘은 아주 특별한 날 같아!" },
  { id: "gold_egg",        emoji: "🥚", name: "황금 알",        rarity: "legend", msg: "황금 알을 발견했어!!",           pet: { kind: "친밀도", amount: 10 }, hint: "오늘은 아주 특별한 날 같아!" },
  { id: "crystal",         emoji: "💎", name: "탐험가의 원석",   rarity: "legend", msg: "전설의 원석을 발견했어!!",        pet: null,                        hint: "오늘은 아주 특별한 날 같아!" },
];

export const getDiscovery = (id) => DISCOVERIES.find(d => d.id === id) || null;
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
  /* ① 희귀도부터 정한다 (가중치) */
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

/* 오늘 힌트 — 탐험 시작 전 펫이 흘리는 말. 오늘 발견의 hint를 그대로 쓴다.
   ("오늘은 반짝이는 걸 찾을 수 있을 것 같아!" → 아이가 기대하며 시작한다) */
export const getTodayHint = (childId, dateStr) => rollDiscovery(childId, dateStr).hint;

/* ── 저장 데이터 순수 로직 ───────────────────────────────────────────── */
export const getDiscoveryLog = (data, childId) => (data?.[childId]?.log) || [];

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

export const getCollectedCount = (data, childId) =>
  getCollection(data, childId).filter(d => d.found).length;

/* ════════════════════════════════════════════════════════════════════════
   아바타 꾸미기 장비 시스템 v2 — 데이터 & 순수 로직
   ────────────────────────────────────────────────────────────────────────
   [캐릭터 제작 규격 — 고정 (docs/CHARACTER_SPEC.md 참조)]
     · 캔버스: 1024×1024, 투명 PNG(저장은 webp)
     · 발바닥 기준선 y=940 / 몸통 중심 x=512 / 머리 중심 (512,285)
     · 전체 키 820px(머리 위 y=120) / 얼굴 정면 고정
     · 장비 이미지도 "같은 1024 캔버스"에 제자리에 그려 저장한다.
       → 앱은 전 레이어를 100% 크기로 그대로 겹치기만 한다 (위치 보정 코드 없음)

   [설계 원칙 — CLAUDE.md 준수]
     · 저장 키는 전부 신규(v2). 구 키(v6_avatar_owned 등)는 절대 변경·삭제하지
       않고, 읽기 폴백(마이그레이션)으로만 사용한다.
     · 아이템 수치·목록은 이 파일에서만 관리 (화면 하드코딩 금지)
     · 이미지는 base64 금지, public/assets/avatar/ 경로 방식
   ════════════════════════════════════════════════════════════════════════ */

/* ── 저장 키 (v2 신규) ───────────────────────────────────────────────── */
export const AVATAR_OWNED_KEY      = "v6_avatar_owned2";     // { [childId]: string[] }
export const AVATAR_EQUIPPED_KEY   = "v6_avatar_equipped2";  // { [childId]: {slot:itemId|null} }
export const CHAR_DISPLAY_MODE_KEY = "v6_char_display_mode"; // "growth"|"avatar" (구조 동일, 유지)

/* 구버전(v1) 키 — 읽기 전용. 절대 여기에 쓰지 않는다. */
export const LEGACY_AVATAR_OWNED_KEY    = "v6_avatar_owned";
export const LEGACY_AVATAR_EQUIPPED_KEY = "v6_avatar_equipped";

/* ── 표시 모드 상수 ─────────────────────────────────────────────────── */
export const CHAR_DISPLAY_GROWTH = "growth"; // 성장(탐험가) 캐릭터 표시
export const CHAR_DISPLAY_AVATAR = "avatar"; // 꾸미기(아바타) 캐릭터 표시
export const DEFAULT_CHAR_DISPLAY_MODE = CHAR_DISPLAY_GROWTH;

/* ── 아바타 기본(베이스) 캐릭터 ──────────────────────────────────────────
   꾸미기 전용 캐릭터 1장. 모자·안경·손지물 없이 맨몸(기본옷)으로 제작된
   1024×1024 이미지. 모든 장비는 이 위에 덧씌워진다.
   아트가 아직 없으면 뷰어가 성장 3단계 캐릭터 → 이모지 순으로 폴백한다. */
export const AVATAR_BASE_IMG   = "assets/avatar/base/default.webp";        // 남아(기본)
export const AVATAR_BASE_IMG_GIRL = "assets/avatar/base/default-girl.webp"; // 여아
export const AVATAR_BASE_EMOJI = "🧒";

/* ── 기본 배경 (아이템 아님) ────────────────────────────────────────── */
export const DEFAULT_AVATAR_BG = "assets/avatar/background/forest.webp";

/* ── 테마 구분 ──────────────────────────────────────────────────────────
   장비마다 theme 값을 둔다. 상점 필터·시즌 노출 제어에 사용.           */
export const AVATAR_THEMES = {
  adventure: { label: "탐험",   emoji: "🧭", color: "#16A34A" },
  bakery:    { label: "베이커리", emoji: "🧁", color: "#F472B6" },
  common:    { label: "공용",   emoji: "⭐", color: "#64748B" },
  seasonal:  { label: "시즌",   emoji: "🎄", color: "#DC2626" },
};

/* ── 슬롯 구조 (렌더 순서 = zIndex 오름차순) ─────────────────────────────
   배경(10) → 등(15, 캐릭터 뒤) → [베이스 캐릭터 z=20] → 신발(25) → 하의(30)
   → 상의(35) → 목(40) → 얼굴장식(45) → 모자(50) → 손(55) → 효과(70)

   emojiPos: 아트 미제작 시 이모지 폴백의 대략 위치 {x,y: 0~1 중심좌표, s: 크기비율}
   (이미지 에셋이 준비되면 위치는 이미지 자체에 박혀 있으므로 사용 안 함)   */
export const AVATAR_SLOTS = [
  { key: "background", label: "배경",     emoji: "🌈", zIndex: 10, removable: true, emojiPos: null },
  { key: "back",       label: "등 장비",  emoji: "🎒", zIndex: 15, removable: true, emojiPos: { x: 0.30, y: 0.48, s: 0.34 } },
  { key: "shoes",      label: "신발",     emoji: "👟", zIndex: 25, removable: true, emojiPos: { x: 0.50, y: 0.87, s: 0.24 } },
  { key: "bottom",     label: "하의",     emoji: "👖", zIndex: 30, removable: true, emojiPos: { x: 0.50, y: 0.70, s: 0.28 } },
  { key: "top",        label: "상의",     emoji: "👕", zIndex: 35, removable: true, emojiPos: { x: 0.50, y: 0.55, s: 0.32 } },
  { key: "neck",       label: "목 장식",  emoji: "🧣", zIndex: 40, removable: true, emojiPos: { x: 0.50, y: 0.47, s: 0.24 } },
  { key: "face",       label: "얼굴 장식", emoji: "🥽", zIndex: 45, removable: true, emojiPos: { x: 0.50, y: 0.30, s: 0.26 } },
  { key: "hat",        label: "모자",     emoji: "🎩", zIndex: 50, removable: true, emojiPos: { x: 0.50, y: 0.10, s: 0.30 } },
  { key: "hand",       label: "손 장비",  emoji: "🪄", zIndex: 55, removable: true, emojiPos: { x: 0.80, y: 0.58, s: 0.26 } },
  { key: "effect",     label: "효과",     emoji: "✨", zIndex: 70, removable: true, emojiPos: { x: 0.50, y: 0.50, s: 0.85 } },
];

/* 베이스 캐릭터가 그려지는 z (등 장비 뒤/신발 앞 사이) — 뷰어에서 사용 */
export const AVATAR_BASE_Z = 20;

export const AVATAR_SLOT_KEYS = AVATAR_SLOTS.map(s => s.key);
export const getSlot = (key) => AVATAR_SLOTS.find(s => s.key === key) || null;

/* ── 희귀도 ─────────────────────────────────────────────────────────── */
export const AVATAR_RARITY = {
  common:    { label: "일반", color: "#9CA3AF", order: 0 },
  rare:      { label: "레어", color: "#3B82F6", order: 1 },
  epic:      { label: "에픽", color: "#8B5CF6", order: 2 },
  legendary: { label: "전설", color: "#F59E0B", order: 3 },
};

/* ── 아이템 카탈로그 ────────────────────────────────────────────────────
   초기 6종은 슬롯을 분산해 꾸미는 재미를 확보한다 (손 장비는 제작 난이도
   문제로 v1에서 제외, 목 장식으로 대체). 전부 탐험 테마 — 6종을 모두
   장착하면 "완전무장 탐험가" 컨셉 아트가 완성되도록 구성.
   배경 3종은 v1에서 그대로 승계(id·가격 동일 → 마이그레이션 시 보유 이전).

   각 아이템: id / slot / label / emoji(폴백) / price / rarity / theme /
             img(1024 정렬 webp) / starter(기본 지급)                     */
export const AVATAR_CATALOG = [
  /* 배경 (3) — v1 승계 */
  { id: "background_sky",    slot: "background", label: "하늘",     emoji: "🌤️", price: 0,   rarity: "common", theme: "common", img: "assets/avatar/background/sky.webp", starter: true },
  { id: "background_forest", slot: "background", label: "숲속",     emoji: "🌲", price: 120, rarity: "rare",   theme: "common", img: "assets/avatar/background/item-forest.webp" },
  { id: "background_galaxy", slot: "background", label: "은하수",   emoji: "🌌", price: 300, rarity: "epic",   theme: "common", img: "assets/avatar/background/galaxy.webp" },

  /* 초기 장비 6종 — 탐험 테마 */
  { id: "hat_explorer",   slot: "hat",   label: "탐험 헬멧",   emoji: "🪖", price: 200, rarity: "epic",   theme: "adventure", img: "assets/avatar/hat/explorer-helmet.webp" },
  { id: "face_goggles",   slot: "face",  label: "탐험 고글",   emoji: "🥽", price: 120, rarity: "rare",   theme: "adventure", img: "assets/avatar/face/goggles.webp" },
  { id: "top_vest",       slot: "top",   label: "탐험 조끼",   emoji: "🦺", price: 150, rarity: "rare",   theme: "adventure", img: "assets/avatar/top/explorer-vest.webp" },
  { id: "shoes_boots",    slot: "shoes", label: "탐험 부츠",   emoji: "🥾", price: 80,  rarity: "common", theme: "adventure", img: "assets/avatar/shoes/explorer-boots.webp" },
  { id: "shoes_boots_green", slot: "shoes", label: "새싹 부츠", emoji: "🌱", price: 100, rarity: "common", theme: "adventure", img: "assets/avatar/shoes/green-boots.webp" },
  { id: "shoes_boots_sand", slot: "shoes", label: "모래 부츠", emoji: "🏜️", price: 120, rarity: "common", theme: "adventure", img: "assets/avatar/shoes/sand-boots.webp" },
  { id: "neck_scarf",     slot: "neck",  label: "빨간 스카프", emoji: "🧣", price: 90,  rarity: "common", theme: "adventure", img: "assets/avatar/neck/red-scarf.webp" },
  { id: "back_backpack",  slot: "back",  label: "탐험 배낭",   emoji: "🎒", price: 250, rarity: "epic",   theme: "adventure", img: "assets/avatar/back/purple-backpack.webp" },
];

/* ── 조회 헬퍼 ─────────────────────────────────────────────────────── */
export const getAvatarItem  = (id) => AVATAR_CATALOG.find(it => it.id === id) || null;
export const getItemsBySlot = (slotKey) => AVATAR_CATALOG.filter(it => it.slot === slotKey);
export const STARTER_ITEM_IDS = AVATAR_CATALOG.filter(it => it.starter).map(it => it.id);

/** 신규 사용자 기본 장착: 스타터(하늘 배경)만. 장비 슬롯은 전부 비움 */
export const getDefaultEquipped = () => {
  const eq = {};
  for (const slot of AVATAR_SLOTS) eq[slot.key] = null;
  for (const it of AVATAR_CATALOG) if (it.starter) eq[it.slot] = it.id;
  return eq;
};

/* ── v1 → v2 마이그레이션 (읽기 폴백) ───────────────────────────────────
   구 키에 구매 기록이 있는 사용자 보호:
     · id가 v2 카탈로그에도 있으면(배경 3종) → 보유 그대로 이전
     · v2에 없는 구 아이템 → 구매가만큼 코인 환불
   반환: { carryOwned: string[], refund: number }                        */
const LEGACY_PRICES = {
  body_robot: 200, body_cat: 150, face_wink: 80, face_star: 180,
  hair_short: 60, hair_curly: 100, hair_ponytail: 100,
  hat_cap: 90, hat_party: 130, hat_crown: 350, hat_wizard: 220,
  glasses_round: 70, glasses_sun: 140, glasses_star: 200,
  top_hoodie: 110, top_dress: 150, top_armor: 320,
  hand_wand: 160, hand_balloon: 90, effect_sparkle: 130, effect_rainbow: 260,
  background_forest: 120, background_galaxy: 300,
};
export const computeAvatarMigration = (legacyOwnedList) => {
  const list = Array.isArray(legacyOwnedList) ? legacyOwnedList : [];
  const carryOwned = [];
  let refund = 0;
  for (const id of list) {
    if (getAvatarItem(id)) { if (!carryOwned.includes(id)) carryOwned.push(id); }
    else refund += LEGACY_PRICES[id] || 0;
  }
  return { carryOwned, refund };
};

/* ── 정규화 (로드 직후 방어) ────────────────────────────────────────── */
export const normalizeOwned = (ownedList) => {
  const valid = new Set(AVATAR_CATALOG.map(it => it.id));
  const base = Array.isArray(ownedList) ? ownedList.filter(id => valid.has(id)) : [];
  const set = new Set(base);
  for (const id of STARTER_ITEM_IDS) set.add(id);
  return [...set];
};

export const normalizeEquipped = (equippedMap, ownedList) => {
  const owned = new Set(normalizeOwned(ownedList));
  const src = equippedMap && typeof equippedMap === "object" ? equippedMap : {};
  const out = {};
  for (const slot of AVATAR_SLOTS) {
    const cur = src[slot.key];
    const item = cur ? getAvatarItem(cur) : null;
    out[slot.key] = (item && item.slot === slot.key && owned.has(cur)) ? cur : null;
  }
  for (const it of AVATAR_CATALOG) {
    if (it.starter && !out[it.slot]) out[it.slot] = it.id;
  }
  return out;
};

/* ── 순수 로직: 구매 (성공 시 자동 장착) ─────────────────────────────── */
export const computeAvatarPurchase = (ownedList = [], equippedMap = {}, coins = 0, itemId) => {
  const item = getAvatarItem(itemId);
  if (!item) return { ok: false, reason: "not_found", nextOwned: ownedList, nextEquipped: equippedMap, cost: 0 };
  if (ownedList.includes(itemId)) return { ok: false, reason: "already_owned", nextOwned: ownedList, nextEquipped: equippedMap, cost: 0 };
  if (coins < item.price) return { ok: false, reason: "insufficient", nextOwned: ownedList, nextEquipped: equippedMap, cost: item.price };
  return { ok: true, reason: null, nextOwned: [...ownedList, itemId], nextEquipped: { ...equippedMap, [item.slot]: itemId }, cost: item.price };
};

/* ── 순수 로직: 장착/벗기 토글 ──────────────────────────────────────── */
export const computeAvatarEquipToggle = (ownedList = [], equippedMap = {}, itemId) => {
  const item = getAvatarItem(itemId);
  if (!item) return { ok: false, reason: "not_found", nextEquipped: equippedMap };
  if (!ownedList.includes(itemId)) return { ok: false, reason: "not_owned", nextEquipped: equippedMap };
  const slot = getSlot(item.slot);
  const currentlyEquipped = equippedMap[item.slot] === itemId;
  const nextEquipped = (currentlyEquipped && slot && slot.removable)
    ? { ...equippedMap, [item.slot]: null }
    : { ...equippedMap, [item.slot]: itemId };
  return { ok: true, reason: null, nextEquipped };
};

/* ── 순수 로직: 홈 표시 모드 토글 ───────────────────────────────────── */
export const computeCharDisplayToggle = (mode) =>
  mode === CHAR_DISPLAY_AVATAR ? CHAR_DISPLAY_GROWTH : CHAR_DISPLAY_AVATAR;

/* ── 완성 아바타 레이어 목록 (뷰어가 map 렌더) ───────────────────────── */
export const getAvatarLayers = (equippedMap = {}) => {
  return AVATAR_SLOTS
    .map(slot => {
      const id = equippedMap[slot.key];
      const item = id ? getAvatarItem(id) : null;
      return item ? { slot: slot.key, item, zIndex: slot.zIndex, emojiPos: slot.emojiPos } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.zIndex - b.zIndex);
};

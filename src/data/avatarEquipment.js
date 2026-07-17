/* ════════════════════════════════════════════════════════════════════════
   아바타 꾸미기 장비 시스템 — 데이터 & 순수 로직
   ────────────────────────────────────────────────────────────────────────
   목적: 성장(진화) 캐릭터와 별개로, 아이가 코인으로 파츠를 사서 자기 아바타를
        꾸미는 시스템. 9개 슬롯에 파츠를 겹쳐(layer) 하나의 아바타를 완성한다.

   설계 원칙 (CLAUDE.md 준수)
     - 저장 키는 v6_ 접두사 규칙을 따르고, 전부 신규 키다. 기존 키는 안 건드린다.
     - 아이템 수치·목록은 전부 이 데이터 파일에서만 관리 (화면 하드코딩 금지).
     - 이미지 에셋은 base64 금지, public/assets/avatar/ 경로 방식.
     - 구매/장착 로직은 App 밖 순수 함수로 분리 (characters.js의 compute* 패턴과 동일).

   슬롯 렌더 순서(zIndex): 배열 인덱스가 곧 겹침 순서다.
   background(맨 뒤) → body → face → hair → hat → glasses → top → hand → effect(맨 앞)
   ════════════════════════════════════════════════════════════════════════ */

/* ── 저장 키 (전부 신규, v6_ 규칙 준수) ───────────────────────────── */
export const AVATAR_OWNED_KEY    = "v6_avatar_owned";        // string[]  보유 아이템 id 목록
export const AVATAR_EQUIPPED_KEY = "v6_avatar_equipped";     // { [slot]: itemId | null }
export const CHAR_DISPLAY_MODE_KEY = "v6_char_display_mode"; // "growth" | "avatar"  홈 표시 모드

/* ── 표시 모드 상수 ───────────────────────────────────────────────── */
export const CHAR_DISPLAY_GROWTH = "growth"; // 성장(진화) 캐릭터 표시
export const CHAR_DISPLAY_AVATAR = "avatar"; // 꾸미기 아바타 표시
export const DEFAULT_CHAR_DISPLAY_MODE = CHAR_DISPLAY_GROWTH; // 신규/구버전 사용자 기본값

/* ── 기본 배경 (아이템 아님) ──────────────────────────────────────────
   성장캐릭터와 동일한 기본 배경 그림. 아바타 프레임 맨 뒤에 항상 깔린다.
   배경 슬롯 아이템(하늘·은하수 등)을 장착하면 그 위를 덮고,
   아이템 이미지가 아직 없으면(아트 미제작) 이 기본 배경이 그대로 보인다. */
export const DEFAULT_AVATAR_BG = "assets/avatar/background/forest.webp";

/* ── 9슬롯 정의 (렌더 순서 = 배열 순서) ──────────────────────────────
   removable=false 인 슬롯(배경·몸체·얼굴)은 항상 뭔가 장착돼 있어야 하는
   필수 슬롯. 나머지는 벗기(장착 해제) 가능.
   ──────────────────────────────────────────────────────────────────── */
export const AVATAR_SLOTS = [
  { key: "background", label: "배경",   emoji: "🌈", zIndex: 10, removable: true  },
  { key: "body",       label: "몸체",   emoji: "🧍", zIndex: 20, removable: false },
  { key: "face",       label: "얼굴",   emoji: "😊", zIndex: 30, removable: false },
  { key: "hair",       label: "머리",   emoji: "💇", zIndex: 40, removable: true  },
  { key: "hat",        label: "모자",   emoji: "🎩", zIndex: 50, removable: true  },
  { key: "glasses",    label: "안경",   emoji: "👓", zIndex: 60, removable: true  },
  { key: "top",        label: "상의",   emoji: "👕", zIndex: 45, removable: true  },
  { key: "hand",       label: "손지물", emoji: "🪄", zIndex: 55, removable: true  },
  { key: "effect",     label: "효과",   emoji: "✨", zIndex: 70, removable: true  },
];

export const AVATAR_SLOT_KEYS = AVATAR_SLOTS.map(s => s.key);
export const getSlot = (key) => AVATAR_SLOTS.find(s => s.key === key) || null;

/* ── 희귀도 (characters.js DECOR_RARITY와 톤 통일) ───────────────────── */
export const AVATAR_RARITY = {
  common:    { label: "일반",   color: "#9CA3AF", order: 0 },
  rare:      { label: "레어",   color: "#3B82F6", order: 1 },
  epic:      { label: "에픽",   color: "#8B5CF6", order: 2 },
  legendary: { label: "전설",   color: "#F59E0B", order: 3 },
};

/* ── 27개 아이템 카탈로그 ────────────────────────────────────────────
   각 아이템:
     id       : 전역 유일 (슬롯키_이름). 저장/장착의 기준.
     slot     : 소속 슬롯 key
     label    : 표시 이름
     emoji    : 이미지 없을 때 폴백으로 쓰는 대표 이모지
     price    : 코인 가격 (0 = 기본 지급, 상점 비노출·항상 보유)
     rarity   : AVATAR_RARITY 키
     img      : public/assets/avatar/<slot>/<파일>.webp  (없으면 이모지 폴백)
     starter  : true 면 처음부터 보유 (필수 슬롯 기본값)

   슬롯별 개수: background3 body3 face3 hair3 hat4 glasses3 top4 hand2 effect2 = 27
   ──────────────────────────────────────────────────────────────────── */
export const AVATAR_CATALOG = [
  /* 배경 (3) */
  /* 배경 아이템 아트는 추후 제작 — img 경로는 파일이 준비되면 연결.
     장착해도 이미지가 없으면 AvatarViewer가 기본 배경(DEFAULT_AVATAR_BG)을 유지한다. */
  { id: "background_sky",     slot: "background", label: "하늘",       emoji: "🌤️", price: 0,   rarity: "common",    img: "assets/avatar/background/sky.webp",     starter: true },
  { id: "background_forest",  slot: "background", label: "숲속",       emoji: "🌲", price: 120, rarity: "rare",      img: "assets/avatar/background/item-forest.webp" },
  { id: "background_galaxy",  slot: "background", label: "은하수",     emoji: "🌌", price: 300, rarity: "epic",      img: "assets/avatar/background/galaxy.webp" },

  /* 몸체 (3) — 필수 슬롯, 하나는 starter */
  { id: "body_default",       slot: "body",       label: "기본 몸",    emoji: "🧍", price: 0,   rarity: "common",    img: "assets/avatar/body/default.webp",       starter: true },
  { id: "body_robot",         slot: "body",       label: "로봇 몸",    emoji: "🤖", price: 200, rarity: "epic",      img: "assets/avatar/body/robot.webp" },
  { id: "body_cat",           slot: "body",       label: "고양이 몸",  emoji: "🐱", price: 150, rarity: "rare",      img: "assets/avatar/body/cat.webp" },

  /* 얼굴 (3) — 필수 슬롯, 하나는 starter */
  { id: "face_smile",         slot: "face",       label: "미소",       emoji: "😊", price: 0,   rarity: "common",    img: "assets/avatar/face/smile.webp",         starter: true },
  { id: "face_wink",          slot: "face",       label: "윙크",       emoji: "😉", price: 80,  rarity: "common",    img: "assets/avatar/face/wink.webp" },
  { id: "face_star",          slot: "face",       label: "별눈",       emoji: "🤩", price: 180, rarity: "rare",      img: "assets/avatar/face/star.webp" },

  /* 머리 (3) */
  { id: "hair_short",         slot: "hair",       label: "단발",       emoji: "💇", price: 60,  rarity: "common",    img: "assets/avatar/hair/short.webp" },
  { id: "hair_curly",         slot: "hair",       label: "곱슬",       emoji: "👩‍🦱", price: 100, rarity: "rare",     img: "assets/avatar/hair/curly.webp" },
  { id: "hair_ponytail",      slot: "hair",       label: "포니테일",   emoji: "👱‍♀️", price: 100, rarity: "rare",     img: "assets/avatar/hair/ponytail.webp" },

  /* 모자 (4) */
  { id: "hat_cap",            slot: "hat",        label: "야구모자",   emoji: "🧢", price: 90,  rarity: "common",    img: "assets/avatar/hat/cap.webp" },
  { id: "hat_party",          slot: "hat",        label: "파티모자",   emoji: "🥳", price: 130, rarity: "rare",      img: "assets/avatar/hat/party.webp" },
  { id: "hat_crown",          slot: "hat",        label: "왕관",       emoji: "👑", price: 350, rarity: "legendary", img: "assets/avatar/hat/crown.webp" },
  { id: "hat_wizard",         slot: "hat",        label: "마법사모자", emoji: "🧙", price: 220, rarity: "epic",      img: "assets/avatar/hat/wizard.webp" },

  /* 안경 (3) */
  { id: "glasses_round",      slot: "glasses",    label: "동그란안경", emoji: "👓", price: 70,  rarity: "common",    img: "assets/avatar/glasses/round.webp" },
  { id: "glasses_sun",        slot: "glasses",    label: "선글라스",   emoji: "🕶️", price: 140, rarity: "rare",      img: "assets/avatar/glasses/sun.webp" },
  { id: "glasses_star",       slot: "glasses",    label: "별모양안경", emoji: "🌟", price: 200, rarity: "epic",      img: "assets/avatar/glasses/star.webp" },

  /* 상의 (4) */
  { id: "top_tshirt",         slot: "top",        label: "티셔츠",     emoji: "👕", price: 0,   rarity: "common",    img: "assets/avatar/top/tshirt.webp",         starter: true },
  { id: "top_hoodie",         slot: "top",        label: "후드티",     emoji: "🧥", price: 110, rarity: "rare",      img: "assets/avatar/top/hoodie.webp" },
  { id: "top_dress",          slot: "top",        label: "원피스",     emoji: "👗", price: 150, rarity: "rare",      img: "assets/avatar/top/dress.webp" },
  { id: "top_armor",          slot: "top",        label: "갑옷",       emoji: "🛡️", price: 320, rarity: "legendary", img: "assets/avatar/top/armor.webp" },

  /* 손지물 (2) */
  { id: "hand_wand",          slot: "hand",       label: "마법봉",     emoji: "🪄", price: 160, rarity: "epic",      img: "assets/avatar/hand/wand.webp" },
  { id: "hand_balloon",       slot: "hand",       label: "풍선",       emoji: "🎈", price: 90,  rarity: "common",    img: "assets/avatar/hand/balloon.webp" },

  /* 효과 (2) */
  { id: "effect_sparkle",     slot: "effect",     label: "반짝임",     emoji: "✨", price: 130, rarity: "rare",      img: "assets/avatar/effect/sparkle.webp" },
  { id: "effect_rainbow",     slot: "effect",     label: "무지개",     emoji: "🌈", price: 260, rarity: "epic",      img: "assets/avatar/effect/rainbow.webp" },
];

/* ── 조회 헬퍼 ────────────────────────────────────────────────────── */
export const getAvatarItem = (id) => AVATAR_CATALOG.find(it => it.id === id) || null;

export const getItemsBySlot = (slotKey) =>
  AVATAR_CATALOG.filter(it => it.slot === slotKey);

/** 처음부터 보유하는 스타터 아이템 id 목록 (필수 슬롯 기본값 등) */
export const STARTER_ITEM_IDS = AVATAR_CATALOG.filter(it => it.starter).map(it => it.id);

/** 신규 사용자의 기본 장착 상태: 각 필수/스타터 슬롯에 starter 아이템을 끼운다 */
export const getDefaultEquipped = () => {
  const eq = {};
  for (const slot of AVATAR_SLOTS) eq[slot.key] = null;
  for (const it of AVATAR_CATALOG) {
    if (it.starter) eq[it.slot] = it.id;
  }
  return eq;
};

/* ── 순수 로직: 보유/장착 정규화 (로드 직후 방어) ─────────────────────
   저장 데이터가 오래됐거나 손상돼도 앱이 깨지지 않도록, 로드된 owned/equipped를
   현재 카탈로그 기준으로 정리한다. (존재하지 않는 id 제거, 스타터 항상 보유 등)
   ──────────────────────────────────────────────────────────────────── */
export const normalizeOwned = (ownedList) => {
  const valid = new Set(AVATAR_CATALOG.map(it => it.id));
  const base = Array.isArray(ownedList) ? ownedList.filter(id => valid.has(id)) : [];
  // 스타터는 항상 보유로 보정
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
    // 장착값이 유효하고(카탈로그 존재) 슬롯이 맞고 보유 중이면 유지
    if (item && item.slot === slot.key && owned.has(cur)) {
      out[slot.key] = cur;
    } else {
      out[slot.key] = null;
    }
  }
  // 필수 슬롯이 비었으면 스타터로 채운다
  for (const it of AVATAR_CATALOG) {
    if (it.starter && !out[it.slot]) out[it.slot] = it.id;
  }
  return out;
};

/* ── 순수 로직: 구매 ──────────────────────────────────────────────────
   반환: { ok, reason, nextOwned, nextEquipped, cost }
     ok=false 인 경우 reason: "not_found" | "already_owned" | "insufficient"
   구매 성공 시 해당 슬롯에 자동 장착(characters.js computeDecorPurchase와 동일 UX).
   ──────────────────────────────────────────────────────────────────── */
export const computeAvatarPurchase = (ownedList = [], equippedMap = {}, coins = 0, itemId) => {
  const item = getAvatarItem(itemId);
  if (!item) {
    return { ok: false, reason: "not_found", nextOwned: ownedList, nextEquipped: equippedMap, cost: 0 };
  }
  if (ownedList.includes(itemId)) {
    return { ok: false, reason: "already_owned", nextOwned: ownedList, nextEquipped: equippedMap, cost: 0 };
  }
  if (coins < item.price) {
    return { ok: false, reason: "insufficient", nextOwned: ownedList, nextEquipped: equippedMap, cost: item.price };
  }
  const nextOwned = [...ownedList, itemId];
  const nextEquipped = { ...equippedMap, [item.slot]: itemId }; // 구매 즉시 자동 장착
  return { ok: true, reason: null, nextOwned, nextEquipped, cost: item.price };
};

/* ── 순수 로직: 장착 토글 ─────────────────────────────────────────────
   보유한 아이템을 눌렀을 때:
     - 이미 그 슬롯에 그 아이템이 장착돼 있고 슬롯이 removable 이면 → 벗기(null)
     - 아니면 → 그 아이템으로 교체 장착
   반환: { ok, reason, nextEquipped }
     ok=false reason: "not_found" | "not_owned"
   ──────────────────────────────────────────────────────────────────── */
export const computeAvatarEquipToggle = (ownedList = [], equippedMap = {}, itemId) => {
  const item = getAvatarItem(itemId);
  if (!item) return { ok: false, reason: "not_found", nextEquipped: equippedMap };
  if (!ownedList.includes(itemId)) return { ok: false, reason: "not_owned", nextEquipped: equippedMap };

  const slot = getSlot(item.slot);
  const currentlyEquipped = equippedMap[item.slot] === itemId;

  let nextEquipped;
  if (currentlyEquipped && slot && slot.removable) {
    nextEquipped = { ...equippedMap, [item.slot]: null }; // 벗기
  } else {
    nextEquipped = { ...equippedMap, [item.slot]: itemId }; // 교체 장착
  }
  return { ok: true, reason: null, nextEquipped };
};

/* ── 순수 로직: 홈 표시 모드 토글 ────────────────────────────────────── */
export const computeCharDisplayToggle = (mode) =>
  mode === CHAR_DISPLAY_AVATAR ? CHAR_DISPLAY_GROWTH : CHAR_DISPLAY_AVATAR;

/* ── 완성 아바타의 레이어 목록 (뷰어가 그대로 map 렌더) ─────────────────
   equippedMap → [{ slot, item, zIndex }] (zIndex 오름차순 = 뒤→앞)
   ──────────────────────────────────────────────────────────────────── */
export const getAvatarLayers = (equippedMap = {}) => {
  return AVATAR_SLOTS
    .map(slot => {
      const id = equippedMap[slot.key];
      const item = id ? getAvatarItem(id) : null;
      return item ? { slot: slot.key, item, zIndex: slot.zIndex } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.zIndex - b.zIndex);
};

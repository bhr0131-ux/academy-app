/* ════════════════════════════════════════════════════════════════════════
   아바타 꾸미기 장비 시스템 v2 — 데이터 & 순수 로직
   ────────────────────────────────────────────────────────────────────────
   [캐릭터 제작 규격 — 고정 (docs/CHARACTER_SPEC.md 참조)]
     · 캔버스: 1024×1024, 투명 PNG(저장은 webp)
     · 발바닥 기준선 y=940 / 몸통 중심 x=512 / 얼굴 정면 고정
     · [사용자 확정 2026-08-14 · 베이스 v6] 전체 키 848px — 머리 꼭대기 y91 · 턱 y343 ·
       몸통 목 top y340 · 발끝 y938. 머리/키 = 29.8%.
       v5(키 815 · 머리 31% · 턱 y378)에서 **몸을 5% 키우고 머리를 위로 올려 목을 드러냈다**
       — v5는 턱이 목을 8px 덮어 목이 4px밖에 안 보였다. 지금은 13px 보인다.
       몸통 원화의 목이 짧아(원화 32px = 캔버스 13px) 이게 열 수 있는 최대치다.
       더 긴 목을 원하면 몸통 원화를 고쳐야 한다.
       [2026-08-16] 몸통 그림을 옷 입은 판으로 교체했다 — 흰 반팔·초록 반바지·흰 양말.
       예전엔 '민소매+속옷+맨발'이라 아무것도 안 입히면 속옷 차림으로 보였다.
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
export const AVATAR_BASE_IMG   = "assets/avatar/base/default.webp?v=7";        // 남아(머리+몸통 합본 — 폴백용)
export const AVATAR_BASE_IMG_GIRL = "assets/avatar/base/default-girl.webp?v=7"; // 여아(합본 — 폴백용)
/* 베이스를 '몸통'과 '머리' 두 장으로 나눠 둔다 (사용자 확정).
   모자처럼 얼굴째 덮는 장비(hidesHead)를 쓰면 머리 장을 아예 안 그리고 그 자리에 장비 그림만 얹는다.
   → 예전처럼 베이스 머리 위에 덮어 씌우면 크기가 조금만 안 맞아도 턱선·귀선이 겹쳐 보였는데,
     아예 안 그리므로 그 문제가 원천적으로 사라진다.
   두 장은 합본과 같은 1024×1024 좌표계라 그냥 겹쳐 그리면 정확히 맞는다.
   [2026-08-19] 베이스 v7 로 교체 (사용자 확정 — 남아·여아 둘 다). v6(옷 입은 몸)과 비율이
   완전히 다른 치비 몸이고 속옷 차림이라, 기본 반팔티·반바지를 '기본 지급 아이템'으로
   따로 넣었다(아래 top_tee_white · bottom_shorts_green).
   탑재: 원화 723×1536 의 알파 상자 높이를 848 로 줄여 발끝 y940 · 가로 중심 x512
   (v6 과 같은 화면 자리 — 아바타 크기가 안 바뀐다).
   목선(원화 남 y630 · 여 y578)에서 머리/몸통을 갈랐다. 여아 갈래머리 끝은 어깨와 붙어 있어
   몸통 장에 남는데, 지금 카탈로그에 hidesHead 장비가 없어 보이는 데 문제는 없다.
   파일명은 그대로 덮어썼고 경로에 ?v=7 을 붙여 기존 기기의 캐시를 끊는다. */
export const AVATAR_BASE_BODY_IMG      = "assets/avatar/base/body.webp?v=7";
export const AVATAR_BASE_HEAD_IMG      = "assets/avatar/base/head.webp?v=7";
export const AVATAR_BASE_BODY_IMG_GIRL = "assets/avatar/base/body-girl.webp?v=7";
export const AVATAR_BASE_HEAD_IMG_GIRL = "assets/avatar/base/head-girl.webp?v=7";
export const AVATAR_BASE_EMOJI = "🧒";

/* ── 기본 배경 (아이템 아님) ────────────────────────────────────────── */
export const DEFAULT_AVATAR_BG = "assets/avatar/background/forest.webp";

/* ── 테마 구분 ──────────────────────────────────────────────────────────
   장비마다 theme 값을 둔다. 상점 필터·시즌 노출 제어에 사용.           */
export const AVATAR_THEMES = {
  adventure: { label: "탐험",   emoji: "🧭", color: "#16A34A" },
  bakery:    { label: "베이커리", emoji: "🧁", color: "#F472B6" },
  common:    { label: "공용",   emoji: "⭐", color: "#64748B" },
  picnic:    { label: "소풍",   emoji: "🍓", color: "#FB7185" },
  magic:     { label: "마법",   emoji: "🔮", color: "#8B5CF6" },
  space:     { label: "우주",   emoji: "🚀", color: "#6366F1" },
  pirate:    { label: "해적",   emoji: "🏴‍☠️", color: "#1E3A5F" },
  seasonal:  { label: "시즌",   emoji: "🎄", color: "#DC2626" },
  /* [2026-08-14] 마법학교 세트 — 탐험복과 분위기를 확실히 나누려고 테마를 따로 뒀다.
     모자·신발·상의·하의·가방·목장식·얼굴장식·손장비 8종을 채울 예정이고,
     지금은 하의(별빛 마법사 주름치마) 한 종만 들어와 있다. */
  magic:     { label: "마법학교", emoji: "🪄", color: "#5B4B8A" },
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

/* 꾸미기 상점 탭 순서 (사용자 확정) — 위 AVATAR_SLOTS의 렌더 z 순서와는 별개다.
   '배경'은 구 꾸미기 상점과 중복되어 제외, '효과'도 제외(사용자 확정). */
export const SHOP_SLOT_ORDER = ["hat", "shoes", "top", "bottom", "back", "neck", "face", "hand"];

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
   [2026-08-19 개편] 사용자 확정 — 예전 아이템(탐험 헬멧·꽃 헬멧·비행사 모자·탐험 고글·
   반바지 4종·탐험 부츠·크림 부츠·빨간 스카프·하늘/크림 배낭)을 전부 카탈로그에서 뺐다.
   앞으로는 '사파리 세트'처럼 남녀 원화를 따로 받은 세트 단위로만 채운다.
   · 이미 산 아이는 손해 보지 않는다 — 앱을 켤 때 1회, 산 값 그대로 코인으로 돌려주고
     보유·장착 기록을 비운다(App.jsx의 전면 환불 블록 + 아래 RETIRED_ITEM_INFO).
   · 뺀 아이템의 그림 파일은 지우지 않고 public/assets/avatar/ 에 그대로 둔다.
     (비행사 모자를 겨울 시즌용으로 남겨 둔 것과 같은 방식 — 다시 넣을 때 그대로 쓴다.
      art-src 원본도 유지. 새 그림으로 '교체'한 게 아니라 '보류'라 CLAUDE.md 6번 대상 아님)

   각 아이템: id / slot / label / emoji(폴백) / price / rarity / theme /
             img(1024 정렬 webp) / starter(기본 지급) / z(슬롯 기본 z 덮어쓰기) /
             imgGirl(여아 전용 그림 — 얼굴째 덮는 모자처럼 성별 얼굴이 필요한 장비용,
                     없으면 img를 남녀 공용으로 쓴다) /
             forGender(그 성별 상점에만 노출) / hidesHead·hidesHeadGirl(베이스 머리 감춤) /
             soleY·soleYGirl(신발 밑창 높이 — 접지 그림자가 따라간다) /
             thumb(상점 카드 그림 — 없으면 emoji로 폴백)                     */
export const AVATAR_CATALOG = [
  /* ── 사파리 세트 (여아) — 사용자 원화 2026-08-19 ────────────────────────
     원화 4장을 기존 아이템 4종에 갈아 끼웠다. id·가격은 그대로라 데이터가 안 깨진다.
     여아 그림만 먼저 들어와서 4종 모두 forGender:"girl" (남아 원화는 나중에).
     탑재값(배율·좌표)은 art-src/README.md '사파리 세트(여아) 탑재값'에 적어 뒀다. */

  /* ── 기본 지급 옷 2종 — 값 0, 처음부터 갖고 시작한다 ────────────────────
     베이스 v7 이 속옷 차림이라 '옷'을 아이템으로 뺐다(art-src/README 확정값으로 탑재).
     starter 가 붙으면 normalizeOwned 가 항상 보유에 넣고 getDefaultEquipped 가 입혀 준다.
     그리고 벗을 수 없다(computeAvatarEquipToggle) — 벗으면 속옷만 남기 때문이다.
     다른 상의·하의를 입으면 그 슬롯에서 자연스럽게 교체된다. */
  { id: "top_tee_white",       slot: "top",    label: "기본 반팔티", emoji: "👕", price: 0, rarity: "common", theme: "common", starter: true, img: "assets/avatar/top/starter-tee.webp",       imgGirl: "assets/avatar/top/starter-tee-girl.webp",       thumb: "assets/avatar/thumb/top_tee_white.webp" },
  { id: "bottom_shorts_green", slot: "bottom", label: "기본 반바지", emoji: "🩳", price: 0, rarity: "common", theme: "common", starter: true, img: "assets/avatar/bottom/starter-shorts.webp", imgGirl: "assets/avatar/bottom/starter-shorts-girl.webp", thumb: "assets/avatar/thumb/bottom_shorts_green.webp" },

  /* 머리띠 — 머리를 덮는 물건이 아니라 hidesHead 를 안 쓴다.
     (얼굴째 덮던 남아 사파리 모자 그림은 v7 몸에 안 맞아 카탈로그에서 뺐다 — 파일은 남아 있다)
     [2026-08-20] '베이스가 쓰고 있는 머리 그림'을 새로 받아 다시 탑재했다(?v=3).
     예전엔 머리띠만 오려 낸 그림을 눈으로 맞춰서 머리보다 크게 얹혀 있었다
     (탑재 상자 362~659 → 391~640, 머리 폭 안으로 들어옴). art-src/README 참고. */
  { id: "hat_safari",     slot: "hat",   label: "사파리 머리띠", emoji: "🌼", price: 180, rarity: "rare",   theme: "adventure", forGender: "girl", img: "assets/avatar/hat/safari-band-girl.webp?v=3", thumb: "assets/avatar/thumb/hat_safari.webp" },
  /* 해적 모자 — 머리띠와 같은 방식('베이스가 쓰고 있는 머리 그림' → 얼굴 상자로 맞춤).
     챙이 이마를 덮지만 얼굴은 그대로 보이므로 hidesHead 는 안 쓴다.
     떼어낼 때 가장 큰 덩어리에 앞머리·눈까지 딸려 와서(모자를 쓰면 앞머리가 다르게 그려진다)
     머리카락색·살색을 걸러 모자만 남겼다 — 베이스 얼굴이 그대로 살아 있어야 한다. */
  /* 딸기 밀짚모자 — 해적 모자와 같은 방식(쓰고 있는 머리 그림 → 얼굴 상자로 맞춤).
     챙이 이마를 덮어 앞머리가 딸려 오므로 머리카락색·살색을 걸러 냈고,
     그래도 남는 얇은 머리 가닥은 열기 연산(침식→팽창)으로 잘라 냈다. */
  { id: "hat_picnic",     slot: "hat",   label: "딸기 밀짚모자", emoji: "👒", price: 200, rarity: "rare", theme: "picnic", forGender: "girl", img: "assets/avatar/hat/picnic-hat-girl.webp", thumb: "assets/avatar/thumb/hat_picnic.webp" },
  { id: "hat_pirate",     slot: "hat",   label: "해적 모자",   emoji: "🏴‍☠️", price: 240, rarity: "epic", theme: "pirate", forGender: "girl", img: "assets/avatar/hat/pirate-hat-girl.webp", thumb: "assets/avatar/thumb/hat_pirate.webp" },
  /* 사파리 옷 — 원화가 블라우스+반바지 한 장이라 상의 슬롯 하나로 넣는다(사용자 확정).
     상의(35)가 하의(30) 위라 하의를 같이 껴도 이 그림이 덮는다. */
  /* [2026-08-20] 남아 원화가 들어와 남녀 공용이 됐다 — 그림이 성별로 갈리는 첫 아이템.
       남아: 크림 셔츠 + 탄색 조끼 + 카고 반바지 · 여아: 블라우스 + 반바지
     상점 카드 그림도 갈린다(thumbGirl) — 남아에게 여아 블라우스를 보여 주면 헷갈린다.
     남아 탑재값은 배율 0.62 · 가로만 1.12배 · 깃 위끝 y380 (art-src/README 참고).
     옷걸이에 건 모양이라 어깨선이 처져 있어서, 깃을 기본 반팔티 자리(y411)에 맞추면
     어깨 위에 맨살 띠가 남는다. 세로를 올려야 없어진다. */
  { id: "top_vest",       slot: "top",   label: "사파리 옷",   emoji: "🦺", price: 150, rarity: "rare",   theme: "adventure", coversBottom: true, img: "assets/avatar/top/safari-outfit-boy.webp", imgGirl: "assets/avatar/top/safari-outfit-girl.webp?v=2", thumb: "assets/avatar/thumb/top_vest.webp", thumbGirl: "assets/avatar/thumb/top_vest-girl.webp" },

  /* ── 딸기 소풍 · 별빛 마법사 (여아) — 사용자 원화 2026-08-19 ─────────────
     이 두 벌은 원화를 **베이스 v7 여아가 입은 전신 그림**으로 받았다. 그래서 배율을
     눈으로 맞출 필요가 없다 — 전신 그림을 베이스와 같은 자리(키 848·발끝 y940)에 맞춘 뒤
     베이스와 다른 픽셀만 남기면 그게 곧 제자리에 놓인 옷이다(맨살·머리 부분은 저절로 빠진다).
     앞으로 옷 원화는 이 방식으로 받는 게 제일 정확하다.
     둘 다 상·하의가 한 장이라 사파리 옷과 같이 상의 슬롯 하나로 넣는다. */
  { id: "top_picnic",     slot: "top",   label: "딸기 소풍 옷", emoji: "🍓", price: 180, rarity: "rare", theme: "picnic", forGender: "girl", coversBottom: true, img: "assets/avatar/top/picnic-outfit-girl.webp", thumb: "assets/avatar/thumb/top_picnic.webp" },
  { id: "top_magic",      slot: "top",   label: "별빛 마법사 옷", emoji: "🌟", price: 220, rarity: "epic", theme: "magic",  forGender: "girl", coversBottom: true, img: "assets/avatar/top/magic-outfit-girl.webp",  thumb: "assets/avatar/thumb/top_magic.webp" },
  /* 하늘 나들이 옷 — 이 원화만 '입은 전신 그림'이 아니라 '옷만 오려 낸 그림'으로 왔다.
     게다가 그린 몸이 베이스 v7 보다 다리가 길어서, 같이 온 '타이츠 있는 판'은
     어깨에 맞추면 타이츠가 발등까지 내려오고 발목에 맞추면 소매가 팔보다 좁았다.
     그래서 타이츠 없는 판을 골라 상체만 맞췄다 — 다리 길이 차이가 상관없어진다.
     배율 0.74 · 깃 위끝을 y372(기본 반팔티 깃과 같은 자리) → 탑재 상자 (356,372)-(666,751). */
  { id: "top_sky",        slot: "top",   label: "하늘 나들이 옷", emoji: "☁️", price: 200, rarity: "rare", theme: "picnic", forGender: "girl", coversBottom: true, img: "assets/avatar/top/sky-outing-girl.webp", thumb: "assets/avatar/thumb/top_sky.webp" },
  /* 우주복 — 옷이 흰색이라 '베이스와 색이 다른 픽셀' 규칙만으로는 안 떼어졌다.
     베이스 속옷도 희고 살색과도 가까워서다. 그래서 '베이스가 살색인 자리에서만 색차를 본다'로
     바꿔서 떼어냈다(art-src/README 참고). 팔·다리까지 다 덮는 한 벌이라 상의 슬롯 하나. */
  /* 해적 옷 — 이 원화도 '옷만 오려 낸 그림'이라 상체를 눈으로 맞췄다(하늘 나들이 옷과 같은 방식).
     긴소매라 소맷부리가 손목에 닿는 배율을 골랐다 — 0.72는 팔뚝이 남고 0.76부터는 손을 덮는다.
     배율 0.74 · 깃 위끝 y372(기본 반팔티 깃과 같은 자리) → 탑재 상자 (350,372)-(674,754). */
  { id: "top_pirate",     slot: "top",   label: "해적 옷",     emoji: "⚓", price: 240, rarity: "epic", theme: "pirate", forGender: "girl", coversBottom: true, img: "assets/avatar/top/pirate-outfit-girl.webp", thumb: "assets/avatar/thumb/top_pirate.webp" },
  { id: "top_space",      slot: "top",   label: "우주복",       emoji: "🚀", price: 250, rarity: "epic", theme: "space",  forGender: "girl", coversBottom: true, img: "assets/avatar/top/space-suit-girl.webp",    thumb: "assets/avatar/thumb/top_space.webp" },

];

/* ── 조회 헬퍼 ─────────────────────────────────────────────────────── */
export const getAvatarItem  = (id) => AVATAR_CATALOG.find(it => it.id === id) || null;

/* ── 한 벌 옷(coversBottom) 규칙 ────────────────────────────────────────
   사파리·딸기 소풍·별빛 마법사·우주복은 원화가 상·하의 한 장이라 상의 슬롯에 넣었다.
   이걸 입으면 아래 입고 있던 기본 반바지를 벗어야 한다 — 안 그러면 옷 밑단·가랑이
   틈으로 초록이 비친다(실측: 딸기 소풍 옷에서 반바지의 10.3%가 안 가려진다).
   벗으면 기본 반바지가 다시 돌아온다. 보유 기록은 안 건드리고 장착만 오간다.  */
export const STARTER_ID_BY_SLOT = (slotKey) =>
  AVATAR_CATALOG.find(it => it.starter && it.slot === slotKey)?.id || null;
export const topCoversBottom = (equippedMap = {}) => {
  const top = getAvatarItem(equippedMap.top);
  return !!(top && top.coversBottom);
};
export const applyBottomRule = (equippedMap = {}) => {
  const next = { ...equippedMap };
  if (topCoversBottom(next)) next.bottom = null;              // 한 벌 옷 → 하의 벗김
  else if (!next.bottom) next.bottom = STARTER_ID_BY_SLOT("bottom"); // 벗으면 기본 반바지 복귀
  return next;
};
/* 한 벌 옷을 입은 채로 하의를 고르면 '바지를 입겠다'는 뜻이다 —
   그대로 두면 하의가 다시 벗겨져 버튼이 아무 일도 안 하는 것처럼 보인다.
   그래서 상의를 기본 반팔티로 되돌린 뒤 하의를 입힌다. */
const yieldTopForBottom = (equippedMap = {}, slotKey) =>
  (slotKey === "bottom" && topCoversBottom(equippedMap))
    ? { ...equippedMap, top: STARTER_ID_BY_SLOT("top") }
    : equippedMap;

/* ── 2026-08-19 꾸미기 전면 개편: 산 것 전부 환불 ────────────────────────
   사용자 확정 — 꾸미기 상점을 사파리 세트 기준으로 새로 채우기로 해서,
   지금까지 산 아바타 아이템을 **한 아이도 손해 없이** 전부 코인으로 돌려준다.
   · 카탈로그에 남아 있는 4종도 환불 대상이다("다 환불"). 보유·장착을 싹 비우고
     새 상점에서 다시 사게 한다.
   · 카탈로그에서 뺀 아이템은 가격을 알 길이 없으므로 아래 표에 이름·값을 남긴다.
     (구 v1 아이템은 LEGACY_PRICES, 그 전에 은퇴한 4종은 App.jsx RETIRED_AVATAR_ITEMS)
   · 새 키 1개만 추가한다(CLAUDE.md 9번) — 기존 키·로직은 그대로 둔다.        */
export const AVATAR_RESET_KEY = "v6_avatar_reset_2608";   // 이 개편의 1회 실행 표식

/* 카탈로그에서 뺀 아이템 — 환불 안내에 쓸 이름과 되돌려 줄 코인 */
export const RETIRED_ITEM_INFO = {
  hat_explorer:       { label: "탐험 헬멧",   price: 200 },
  hat_aviator:        { label: "비행사 모자", price: 260 },
  hat_blossom:        { label: "꽃 헬멧",     price: 220 },
  face_goggles:       { label: "탐험 고글",   price: 120 },
  bottom_khaki:       { label: "카키 반바지", price: 130 },
  bottom_cream:       { label: "크림 반바지", price: 150 },
  bottom_denim:       { label: "데님 반바지", price: 170 },
  bottom_magic_skirt: { label: "별빛 마법사 주름치마", price: 200 },   // 새 '별빛 마법사 옷'으로 대체 — 그림은 지웠다
  shoes_boots:        { label: "탐험 부츠",   price: 80  },
  shoes_boots_sand:   { label: "크림 부츠",   price: 120 },
  neck_scarf:         { label: "빨간 스카프", price: 90  },
  shoes_boots_green:  { label: "사파리 부츠", price: 100 },   // [2026-08-20] 사용자 확정으로 뺐다 (그림은 남아 있다)
  back_backpack:      { label: "사파리 가방", price: 250 },   // [2026-08-20] 사용자 확정으로 뺐다 (그림은 남아 있다)
  shoes_picnic:       { label: "딸기 구두",   price: 180 },   // [2026-08-20] 넣었다가 사용자 확정으로 뺐다 (그림은 남아 있다)
  back_backpack_sky:  { label: "하늘 배낭",   price: 270 },
  back_backpack_cream:{ label: "크림 배낭",   price: 290 },
  /* 더 예전에 은퇴한 것들 — 이미 환불됐을 수 있지만 남아 있으면 여기서 처리된다 */
  shoes_boots_desert: { label: "사막 부츠",   price: 140 },
  shoes_boots_ribbon: { label: "리본 부츠",   price: 150 },
  background_forest:  { label: "마법 숲 배경", price: 120 },
  background_galaxy:  { label: "은하수 배경",  price: 300 },
  background_sky:     { label: "하늘 배경",    price: 0   },
};

/* 아이템 id → 환불 정보. 카탈로그에 있으면 카탈로그 값, 없으면 위 표를 본다.
   둘 다 없는 정체불명 id는 이름만 붙여 0코인으로 (보유 목록에서는 지운다). */
export const getRefundInfo = (id) => {
  const it = getAvatarItem(id);
  if (it) return { label: it.label, price: Number(it.price) || 0 };
  return RETIRED_ITEM_INFO[id] || { label: String(id), price: 0 };
};

/* 한 아이의 보유 목록 → 환불 명세.  { items:[{id,label,price}], sum } */
export const computeAvatarRefund = (ownedList) => {
  const seen = new Set();
  const items = [];
  let sum = 0;
  for (const id of (Array.isArray(ownedList) ? ownedList : [])) {
    if (seen.has(id)) continue;              // 같은 아이템을 두 번 세지 않는다
    seen.add(id);
    const { label, price } = getRefundInfo(id);
    if (price > 0) { items.push({ id, label, price }); sum += price; }
  }
  return { items, sum };
};
/* ── 시즌 아이템 ────────────────────────────────────────────────────────
   season이 붙은 아이템은 그 시즌이 열렸을 때만 상점에 나온다. 지금 열린 시즌은 없다.
   겨울 이벤트·설원 맵을 만들 때 여기에 "winter"를 넣으면 그대로 살아난다
   (그림·id·가격 전부 유지 → 이미 산 아이는 계속 착용 가능).                      */
export const ACTIVE_SEASONS = [];
export const isItemInSeason = (it) => !it.season || ACTIVE_SEASONS.includes(it.season);

/* ── 성별 전용 아이템 ───────────────────────────────────────────────────
   forGender가 붙은 아이템("girl"/"boy")은 그 성별에게만 상점에 나온다.
   시즌과 같은 방식이라 getAvatarItem/레이어 조회는 성별과 무관하게 동작한다
   → 이미 산·입은 아이템은 성별을 바꿔도 그대로 유지된다(데이터 안 깨짐).      */
export const isItemForGender = (it, gender) => !it.forGender || !gender || it.forGender === gender;

/* ── 머리를 덮는 장비 ───────────────────────────────────────────────────
   모자처럼 얼굴째 덮는 그림은 베이스 '머리' 장을 안 그린다(hidesHead).
   같은 id라도 남녀 그림이 다를 수 있어서(예: 남아=사파리 모자 / 여아=머리띠)
   여아일 때만 다르게 두고 싶으면 hidesHeadGirl 을 붙인다. 없으면 hidesHead 그대로. */
export const itemHidesHead = (it, gender) =>
  (gender === "girl" && it && it.hidesHeadGirl !== undefined) ? !!it.hidesHeadGirl : !!(it && it.hidesHead);

/* ── 그림 대기 아이템 ────────────────────────────────────────────────────
   [버그 2026-08-15] 카탈로그에는 있는데 img 파일이 없는 아이템이 3종 있었다
   (탐험 고글 120 · 탐험 조끼 150 · 빨간 스카프 90). 사면 그림 대신 이모지만
   [2026-08-19] 탐험 조끼는 사파리 옷 원화가 들어와 artPending을 뗐다. 남은 건 2종.
   떠서, 돈을 내고 미완성품을 받는 상태였다.
   artPending 이 붙으면 상점에 안 나온다. 시즌과 같은 방식이라
   getAvatarItem·레이어 조회는 그대로 → 이미 산 아이는 계속 쓸 수 있다.
   그림이 들어오면 이 한 줄만 지우면 원래대로 팔린다. */
export const isItemArtReady = (it) => !it.artPending;

/* 상점 목록 — 시즌이 안 열렸거나 다른 성별 전용인 아이템은 빼고 보여 준다.
   gender를 안 넘기면 예전처럼 전부 돌려준다(기존 호출부 보호).
   (getAvatarItem/레이어 조회는 시즌·성별과 무관하게 그대로 동작 → 보유·착용 데이터 안 깨짐) */
export const getItemsBySlot = (slotKey, gender) =>
  AVATAR_CATALOG.filter(it => it.slot === slotKey && isItemInSeason(it) && isItemForGender(it, gender) && isItemArtReady(it));
export const STARTER_ITEM_IDS = AVATAR_CATALOG.filter(it => it.starter).map(it => it.id);

/** 신규 사용자 기본 장착: 스타터(하늘 배경)만. 장비 슬롯은 전부 비움 */
export const getDefaultEquipped = () => {
  const eq = {};
  for (const slot of AVATAR_SLOTS) eq[slot.key] = null;
  for (const it of AVATAR_CATALOG) if (it.starter) eq[it.slot] = it.id;
  return applyBottomRule(eq);
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
  return applyBottomRule(out);
};

/* ── 순수 로직: 구매 (성공 시 자동 장착) ─────────────────────────────── */
export const computeAvatarPurchase = (ownedList = [], equippedMap = {}, coins = 0, itemId) => {
  const item = getAvatarItem(itemId);
  if (!item) return { ok: false, reason: "not_found", nextOwned: ownedList, nextEquipped: equippedMap, cost: 0 };
  if (ownedList.includes(itemId)) return { ok: false, reason: "already_owned", nextOwned: ownedList, nextEquipped: equippedMap, cost: 0 };
  if (coins < item.price) return { ok: false, reason: "insufficient", nextOwned: ownedList, nextEquipped: equippedMap, cost: item.price };
  return { ok: true, reason: null, nextOwned: [...ownedList, itemId], nextEquipped: applyBottomRule({ ...yieldTopForBottom(equippedMap, item.slot), [item.slot]: itemId }), cost: item.price };
};

/* ── 순수 로직: 장착/벗기 토글 ──────────────────────────────────────── */
export const computeAvatarEquipToggle = (ownedList = [], equippedMap = {}, itemId) => {
  const item = getAvatarItem(itemId);
  if (!item) return { ok: false, reason: "not_found", nextEquipped: equippedMap };
  if (!ownedList.includes(itemId)) return { ok: false, reason: "not_owned", nextEquipped: equippedMap };
  const slot = getSlot(item.slot);
  const currentlyEquipped = equippedMap[item.slot] === itemId;
  /* 기본 지급 옷(starter)은 벗을 수 없다 — 벗으면 속옷만 남는다.
     다른 상의·하의를 입으면 그 슬롯에서 알아서 교체되므로 갈아입는 데 지장은 없다. */
  const from = yieldTopForBottom(equippedMap, item.slot);
  const nextEquipped = applyBottomRule((currentlyEquipped && slot && slot.removable && !item.starter)
    ? { ...from, [item.slot]: null }
    : { ...from, [item.slot]: itemId });
  return { ok: true, reason: null, nextEquipped };
};

/* ── 순수 로직: 홈 표시 모드 토글 ───────────────────────────────────── */
export const computeCharDisplayToggle = (mode) =>
  mode === CHAR_DISPLAY_AVATAR ? CHAR_DISPLAY_GROWTH : CHAR_DISPLAY_AVATAR;

/* ── 완성 아바타 레이어 목록 (뷰어가 map 렌더) ───────────────────────── */
export const getAvatarLayers = (equippedMap = {}) => {
  /* 한 벌 옷을 입고 있으면 하의 장은 아예 안 그린다.
     상점 '입어보기'는 장착 로직을 안 거치고 화면만 겹쳐 보여 주므로 여기서도 막아야 한다. */
  const hideBottom = topCoversBottom(equippedMap);
  return AVATAR_SLOTS
    .map(slot => {
      if (hideBottom && slot.key === "bottom") return null;
      const id = equippedMap[slot.key];
      const item = id ? getAvatarItem(id) : null;
      /* 아이템에 z가 있으면 슬롯 기본 z보다 우선 — 원화가 '앞에서 본 모습'이라
         슬롯 기본 순서로는 몸통에 가려지는 장비(탐험 배낭의 어깨끈 등)를 위해. */
      return item ? { slot: slot.key, item, zIndex: item.z ?? slot.zIndex, emojiPos: slot.emojiPos } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.zIndex - b.zIndex);
};

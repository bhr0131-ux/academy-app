import { DECOR_PRICE } from "./characters.js";
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
export const AVATAR_BASE_IMG   = "assets/avatar/base/default.webp?v=11";        // 남아(머리+몸통 합본 — 폴백용)
export const AVATAR_BASE_IMG_GIRL = "assets/avatar/base/default-girl.webp?v=13"; // 여아(합본 — 폴백용)
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
   [2026-09-27] 베이스 v8 로 교체 (사용자가 디자인만 다듬어 다시 그려 줌 — 남아 앞머리·
   여아 갈래머리 모양이 달라졌다). 원화 캔버스·알파 상자·목선 y가 v7과 거의 같아
   (남 630 · 여 578 그대로 맞았다 — 겹쳐서 확인함) 위 탑재 공식을 그대로 재사용했다.
   파일명은 그대로 덮어썼고 경로에 ?v=8 을 붙여 기존 기기의 캐시를 끊는다.
   [2026-10-02] 남아만 베이스 v9 (사용자 원화 — v8 을 다듬은 판). v8 과 같은 자리·높이에 맞추면
   실루엣이 97.6% 겹쳐 장비를 다시 맞출 필요가 없다. 머리/몸통은 v8 과 같은 y405 에서 잘랐다.
   [2026-10-02] 남아 베이스 v10 — **민머리 + 머리카락 머리** (사용자 확정). 모자를 쓸 때 머리카락이
   모자 밖으로 삐져나오지 않게 하려는 구조다.
     · body.webp = 민머리 몸 전체(머리째, 속옷 차림). 목에서 자르지 않고 맨 아래에 깐다.
     · head.webp = 머리카락 머리. 평소에는 민머리 위에 얹혀 이 모습만 보인다.
     · 얼굴째 덮는 모자(hidesHead)를 쓰면 head.webp 만 빠지고 민머리 위에 모자 그림이 얹힌다
       → 남아 모자는 앞으로 얼굴까지 통째로 그려 hidesHead 를 붙인다.
     · 속옷은 기본 반팔티·반바지(starter, 벗을 수 없음)가 늘 가린다.
   보일 모습(민머리+머리카락)이 v9 와 98.9% 겹쳐 기존 옷·장비는 그대로 맞는다.
   [2026-10-02] head.webp 가 턱선 아래로 3px(y399~401) 더 내려와 목보다 진한 주황 띠가 보였다(사용자 지적)
   → 열마다 턱선(진한 선) 바로 아래부터 알파를 지웠다(432px). 경로 head·default ?v=11.
   [2026-10-02] 여아 베이스 v10 — 남아와 같은 **민머리 + 머리카락 머리** 구조 (사용자 원화).
     머리카락 머리를 민머리 얼굴(눈~입)에 템플릿 매칭(배율 0.996 · 일치 0.906)으로 얹은 합본을 v8 실루엣에 맞췄다
     (배율 0.6957, IoU 0.991) → 기존 여아 옷·모자를 다시 맞출 필요가 없다. 갈래머리는 머리 장에 들어 있다.
     머리 장이 턱선 아래로 2~5px 내려온 살색은 얼굴 폭(x430~600) 안에서만 지웠다(147px). 경로 ?v=10.
   [2026-10-02] 여아 민머리 몸만 사용자 수정판으로 교체 — 수영복 양옆 선을 안쪽으로 넣어 몸통이 날씬해졌다
   (같은 캔버스 자리라 같은 변환). 사파리·하늘 나들이 옷 옆으로 비치던 흰 수영복이 줄었다. body·default ?v=11.
   [2026-10-02] 여아 민머리 몸 두 번째 수정판 — 왼쪽 팔(화면 기준) 안쪽 선을 매끈하게 다듬어 겨드랑이 꺾임이 없어졌다.
   원화가 1px 아래로 밀려 있어 그만큼 올려 같은 변환. body·default ?v=12.
   [2026-10-02] 세 번째 수정판 — 가랑이 가운데 세로 띠(원화 704px)를 투명하게 깎았다. 색은 그대로, 같은 변환. body·default ?v=13. */
export const AVATAR_BASE_BODY_IMG      = "assets/avatar/base/body.webp?v=10";
export const AVATAR_BASE_HEAD_IMG      = "assets/avatar/base/head.webp?v=11";
export const AVATAR_BASE_BODY_IMG_GIRL = "assets/avatar/base/body-girl.webp?v=13";
export const AVATAR_BASE_HEAD_IMG_GIRL = "assets/avatar/base/head-girl.webp?v=10";
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
/* wearVerb — 상점 하단 버튼 문구를 만드는 말("이 {label} {wearVerb}").
   모자는 '쓰기', 신발은 '신기'… 슬롯마다 한국어 동사가 다른데, 화면 코드에
   슬롯별 if 를 늘어놓으면 슬롯을 하나 더 만들 때마다 화면을 고쳐야 한다.
   상의·하의만 label 대신 '옷'을 쓴다(wearNoun) — "이 상의 입기"는 어색하다. */
export const AVATAR_SLOTS = [
  { key: "background", label: "배경",     emoji: "🌈", zIndex: 10, removable: true, wearVerb: "깔기", emojiPos: null },
  { key: "back",       label: "등 장비",  emoji: "🎒", zIndex: 15, removable: true, wearVerb: "메기", emojiPos: { x: 0.30, y: 0.48, s: 0.34 } },
  { key: "shoes",      label: "신발",     emoji: "👟", zIndex: 25, removable: true, wearVerb: "신기", emojiPos: { x: 0.50, y: 0.87, s: 0.24 } },
  { key: "bottom",     label: "하의",     emoji: "👖", zIndex: 30, removable: true, wearVerb: "입기", wearNoun: "옷", emojiPos: { x: 0.50, y: 0.70, s: 0.28 } },
  { key: "top",        label: "상의",     emoji: "👕", zIndex: 35, removable: true, wearVerb: "입기", wearNoun: "옷", emojiPos: { x: 0.50, y: 0.55, s: 0.32 } },
  { key: "neck",       label: "목 장식",  emoji: "🧣", zIndex: 40, removable: true, wearVerb: "하기", emojiPos: { x: 0.50, y: 0.47, s: 0.24 } },
  { key: "face",       label: "얼굴 장식", emoji: "🥽", zIndex: 45, removable: true, wearVerb: "쓰기", emojiPos: { x: 0.50, y: 0.30, s: 0.26 } },
  { key: "hat",        label: "모자",     emoji: "🎩", zIndex: 50, removable: true, wearVerb: "쓰기", emojiPos: { x: 0.50, y: 0.10, s: 0.30 } },
  { key: "hand",       label: "손 장비",  emoji: "🪄", zIndex: 55, removable: true, wearVerb: "들기", emojiPos: { x: 0.80, y: 0.58, s: 0.26 } },
  { key: "effect",     label: "효과",     emoji: "✨", zIndex: 70, removable: true, wearVerb: "켜기", emojiPos: { x: 0.50, y: 0.50, s: 0.85 } },
];

/* 베이스 캐릭터가 그려지는 z (등 장비 뒤/신발 앞 사이) — 뷰어에서 사용 */
export const AVATAR_BASE_Z = 20;

/* 꾸미기 상점 탭 순서 (사용자 확정) — 위 AVATAR_SLOTS의 렌더 z 순서와는 별개다.
   '배경'은 구 꾸미기 상점과 중복되어 제외, '효과'도 제외(사용자 확정). */
export const SHOP_SLOT_ORDER = ["hat", "shoes", "top", "bottom", "back", "neck", "face", "hand"];

/* ── 상점 탭 ───────────────────────────────────────────────────────────
   [사용자 확정 2026-09-26] 상점에서는 '상의'·'하의'를 나누지 않고 **'옷' 한 탭**으로
   묶는다. 아이가 고를 때 위아래를 따로 생각하지 않고, 지금 파는 옷은 대부분
   위아래가 붙은 한 장 그림이라 '상의' 탭에 치마가 들어가 있는 꼴이었다.

   [중요] 이건 **보여 주는 방식**만 묶는 것이다. slot(top/bottom)은 그대로 둔다 —
   아바타 겹치는 순서(z)와 저장된 착용 데이터(equipped.top / equipped.bottom)가
   전부 slot 을 쓴다. 여기서 슬롯을 합치면 기존 사용자 데이터가 깨진다.

   slots : 이 탭이 모아 보여 줄 슬롯들 (앞에 적힌 순서대로 목록에 쌓인다) */
export const SHOP_TABS = [
  { key: "hat",     label: "모자",      emoji: "🎩", slots: ["hat"] },
  { key: "shoes",   label: "신발",      emoji: "👟", slots: ["shoes"] },
  { key: "clothes", label: "옷",        emoji: "👕", slots: ["top", "bottom"] },
  { key: "back",    label: "등 장비",   emoji: "🎒", slots: ["back"] },
  { key: "neck",    label: "목 장식",   emoji: "🧣", slots: ["neck"] },
  { key: "face",    label: "얼굴 장식", emoji: "🥽", slots: ["face"] },
  { key: "hand",    label: "손 장비",   emoji: "🪄", slots: ["hand"] },
];
export const getShopTab = (key) => SHOP_TABS.find(t => t.key === key) || null;

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
     (얼굴째 덮는 남아 사파리 모자는 아래 hat_safari_boy — 2026-10-02 새 원화로 다시 넣었다)
     [2026-08-20] '베이스가 쓰고 있는 머리 그림'을 새로 받아 다시 탑재했다(?v=3).
     예전엔 머리띠만 오려 낸 그림을 눈으로 맞춰서 머리보다 크게 얹혀 있었다
     (탑재 상자 362~659 → 391~640, 머리 폭 안으로 들어옴). art-src/README 참고. */
  /* [2026-10-04] 들꽃 머리띠 새 원화로 교체 — 머리띠 + 얼굴·양갈래 머리 한 장(사용자 원화 488×486). 위 탑재값은 옛 판 기록.
     남아 캡모자들처럼 hidesHead 로 여아 기본 머리 장을 빼고 이 그림이 머리를 대신한다. 얼굴(눈~입) 템플릿 매칭(일치 0.976)으로
     배율 0.688, 원점 (346,87). 양갈래가 목 아래로 내려와 여아 기본 머리처럼 아래를 자르지 않았다(목 이음매 없음). 탑재 상자 (346,87,682,421). img ?v=4. */
  { id: "hat_safari",     slot: "hat",   label: "들꽃 머리띠", emoji: "🌼", price:DECOR_PRICE.rare, rarity: "rare",   theme: "adventure", forGender: "girl", hidesHead: true, img: "assets/avatar/hat/safari-band-girl.webp?v=4", thumb: "assets/avatar/thumb/hat_safari.webp?v=2" },
  /* 해적 모자 — 머리띠와 같은 방식('베이스가 쓰고 있는 머리 그림' → 얼굴 상자로 맞춤).
     챙이 이마를 덮지만 얼굴은 그대로 보이므로 hidesHead 는 안 쓴다.
     떼어낼 때 가장 큰 덩어리에 앞머리·눈까지 딸려 와서(모자를 쓰면 앞머리가 다르게 그려진다)
     머리카락색·살색을 걸러 모자만 남겼다 — 베이스 얼굴이 그대로 살아 있어야 한다. */
  /* 딸기 밀짚모자 — 해적 모자와 같은 방식(쓰고 있는 머리 그림 → 얼굴 상자로 맞춤).
     챙이 이마를 덮어 앞머리가 딸려 오므로 머리카락색·살색을 걸러 냈고,
     그래도 남는 얇은 머리 가닥은 열기 연산(침식→팽창)으로 잘라 냈다. */
  /* [2026-10-04] 딸기 밀짚모자 새 원화로 교체 — 밀짚모자(딸기 리본) + 얼굴·양갈래 머리 한 장(사용자 원화 541×526). 위 설명은 옛 판 기록.
     들꽃 머리띠와 같은 방식(hidesHead) — 얼굴(눈~입) 템플릿 매칭(일치 0.920)으로 배율 0.6800000000000002, 원점 (329,68). 아래는 자르지 않음.
     탑재 상자 (329,68,697,426). img ?v=4. */
  { id: "hat_picnic",     slot: "hat",   label: "딸기 밀짚모자", emoji: "👒", price:DECOR_PRICE.rare, rarity: "rare", theme: "picnic", forGender: "girl", hidesHead: true, img: "assets/avatar/hat/picnic-hat-girl.webp?v=4", thumb: "assets/avatar/thumb/hat_picnic.webp?v=2" },
  /* [2026-10-04] 꼬마해적 모자 새 원화로 교체 — 남색 삼각 해적모(주황 테두리·불가사리) + 얼굴·양갈래 머리 한 장(사용자 원화 521×517).
     들꽃 머리띠와 같은 방식(hidesHead) — 얼굴 템플릿 매칭(일치 0.948)으로 배율 0.700, 원점 (337,57). 아래는 자르지 않음.
     탑재 상자 (337,57,702,419). img ?v=4.
     [2026-10-04] 사용자 조정 — 아래로 1·왼쪽으로 1(원점 (336,58)). 탑재 상자 (336,58,701,420). img ?v=5. */
  { id: "hat_pirate",     slot: "hat",   label: "꼬마해적 모자",   emoji: "🏴‍☠️", price:DECOR_PRICE.epic, rarity: "epic", theme: "pirate", forGender: "girl", hidesHead: true, img: "assets/avatar/hat/pirate-hat-girl.webp?v=5", thumb: "assets/avatar/thumb/hat_pirate.webp?v=2" },
  /* 우편부 모자 [2026-10-04] — 여아. 파란 우편모(날개 편지 배지) + 얼굴·양갈래 머리 한 장(사용자 원화 490×524). 파랑 우편부 옷과 짝.
     들꽃 머리띠와 같은 방식(hidesHead) — 얼굴 템플릿 매칭(일치 0.916)으로 배율 0.668, 원점 (351,68). 아래는 자르지 않음.
     탑재 상자 (351,68,678,418).
     [2026-10-04] 사용자 조정 — 3% 크게(배율 0.688, 턱 y345·얼굴 가운데 고정) 후 오른쪽으로 1, 원점 (347,60). 탑재 상자 (347,60,684,421). img ?v=2.
     [2026-10-04] 아래로 1(원점 (347,61)). 탑재 상자 (347,61,684,422). img ?v=3.
     [2026-10-04] 1% 크게(배율 0.6949, 턱·얼굴 가운데 고정, 원점 (345,58)). 탑재 상자 (345,58,686,422). img ?v=4. */
  { id: "hat_post_girl",  slot: "hat",   label: "우편부 모자", emoji: "💌", price:DECOR_PRICE.rare, rarity: "rare", theme: "common", forGender: "girl", hidesHead: true, img: "assets/avatar/hat/post-cap-girl.webp?v=4", thumb: "assets/avatar/thumb/hat_post_girl.webp?v=2" },
  /* 요리사 모자 [2026-10-04] — 여아. 흰 요리사 모자(분홍 띠·크루아상 장식) + 얼굴·양갈래 머리 한 장(사용자 원화 520×584). 핑크 파티시에 옷과 짝.
     들꽃 머리띠와 같은 방식(hidesHead) — 얼굴 템플릿 매칭(일치 0.924)으로 배율 0.660, 원점 (348,28). 아래는 자르지 않음.
     탑재 상자 (349,28,691,413).
     [2026-10-04] 사용자 조정 — 3% 크게(배율 0.6798, 턱·얼굴 가운데 고정, 원점 (343,18)). 탑재 상자 (344,18,696,415). img ?v=2.
     [2026-10-04] 1% 더 크게(배율 0.6866, 원점 (341,15)). 탑재 상자 (342,15,698,416). img ?v=3.
     [2026-10-04] 아래로 3(원점 (341,18)). 탑재 상자 (342,18,698,419). img ?v=4.
     [2026-10-04] 아래로 1 더(원점 (341,19)). 탑재 상자 (342,19,698,420). img ?v=5. */
  { id: "hat_chef_girl",  slot: "hat",   label: "요리사 모자", emoji: "👩‍🍳", price:DECOR_PRICE.rare, rarity: "rare", theme: "common", forGender: "girl", hidesHead: true, img: "assets/avatar/hat/chef-hat-girl.webp?v=5", thumb: "assets/avatar/thumb/hat_chef_girl.webp?v=2" },
  /* 구름 모자 [2026-10-04] — 여아. 노란 벙거지(청록 띠·무지개 구름 장식) + 얼굴·양갈래 머리 한 장(사용자 원화 535×505). 노란 우비룩과 짝.
     들꽃 머리띠와 같은 방식(hidesHead) — 얼굴 템플릿 매칭(일치 0.959)으로 배율 0.676, 원점 (333,74). 아래는 자르지 않음.
     탑재 상자 (333,74,695,415).
     [2026-10-04] 사용자 조정 — 3% 크게(배율 0.6963, 턱·얼굴 가운데 고정, 원점 (328,66)). 탑재 상자 (328,66,701,418). img ?v=2.
     [2026-10-04] 아래로 2(원점 (328,68)). 탑재 상자 (328,68,701,420). img ?v=3. */
  { id: "hat_cloud_girl", slot: "hat",   label: "구름 모자", emoji: "☁️", price:DECOR_PRICE.rare, rarity: "rare", theme: "common", forGender: "girl", hidesHead: true, img: "assets/avatar/hat/cloud-hat-girl.webp?v=3", thumb: "assets/avatar/thumb/hat_cloud_girl.webp?v=2" },
  /* 마법사 모자 [2026-10-04] — 여아. 보라 마법사 모자(금 초승달·별 장식) + 얼굴·양갈래 머리 한 장(사용자 원화 657×574). 달빛 마법사 옷과 짝.
     들꽃 머리띠와 같은 방식(hidesHead) — 얼굴 템플릿 매칭(일치 0.943)으로 배율 0.696, 원점 (295,20). 아래는 자르지 않음.
     탑재 상자 (295,20,752,420).
     [2026-10-04] 사용자 조정 — 아래로 2·왼쪽으로 1(원점 (294,22)). 탑재 상자 (294,22,751,422). img ?v=2.
     [2026-10-04] 다시 아래로 2·왼쪽으로 1(원점 (293,24)). 탑재 상자 (293,24,750,424). img ?v=3. */
  { id: "hat_wizard_girl", slot: "hat",  label: "마법사 모자", emoji: "🧙‍♀️", price:DECOR_PRICE.epic, rarity: "epic", theme: "common", forGender: "girl", hidesHead: true, img: "assets/avatar/hat/wizard-hat-girl.webp?v=3", thumb: "assets/avatar/thumb/hat_wizard_girl.webp?v=2" },
  /* 우주 헬멧 [2026-10-04] — 여아. 흰 우주 헬멧(보라 귀덮개·토성 장식·보라 목깃) + 얼굴·양갈래 머리 한 장(사용자 원화 492×514). 별빛 우주인 옷과 짝.
     들꽃 머리띠와 같은 방식(hidesHead) — 얼굴 템플릿 매칭(일치 0.881, 헬멧 유리 반사로 조금 낮음)으로 배율 0.692, 원점 (345,68).
     아래는 자르지 않음 — 보라 목깃이 목에 걸쳐 우주복 깃 위로 자연스럽게 이어진다. 탑재 상자 (345,68,685,424).
     [2026-10-04] 사용자 조정 — 위로 5(원점 (345,63)). 탑재 상자 (345,63,685,419). img ?v=2.
     [2026-10-04] 오른쪽으로 4(원점 (349,63)). 탑재 상자 (349,63,689,419). img ?v=3.
     [2026-10-04] 왼쪽으로 5(원점 (344,63)). 탑재 상자 (344,63,684,419). img ?v=4.
     [2026-10-04] 왼쪽으로 3 더(원점 (341,63)). 탑재 상자 (341,63,681,419). img ?v=5. */
  { id: "hat_helmet_girl", slot: "hat",  label: "우주 헬멧", emoji: "🧑‍🚀", price:DECOR_PRICE.epic, rarity: "epic", theme: "space", forGender: "girl", hidesHead: true, img: "assets/avatar/hat/space-helmet-girl.webp?v=5", thumb: "assets/avatar/thumb/hat_helmet_girl.webp?v=2" },
  /* 남아 사파리 모자 [2026-10-02] — 모자+얼굴 한 장(사용자 원화)이라 hidesHead: 쓰면 머리카락 머리 장이 빠지고
     민머리 위에 얹힌다(베이스 v10 구조). 얼굴(눈~입) 템플릿 매칭으로 맞춤(배율 0.4065 · 일치 0.970).
     원화에 달린 목은 z50 이라 높은 깃(우주복·후드·도토리)을 덮어서 기본 머리 장처럼 y404 에서 잘랐다. */
  /* [2026-10-04] 새 원화로 교체·이름 사파리 모자 → 정글 모자 — 베이지 정글 모자(초록 띠·헤드램프) + 얼굴 한 장(사용자 원화 593×496).
     위 탑재값은 옛 판 기록. 얼굴(눈~입) 템플릿 매칭(일치 0.955)으로 배율 0.664, 원점 (317,67), y404 아래 자름. 탑재 상자 (317,67,711,396). img ?v=3.
     [2026-10-05] 사용자 조정 — 3% 크게(배율 0.6839, 턱·얼굴 가운데 고정) 후 왼쪽으로 2, 원점 (309,57). 탑재 상자 (309,57,715,396). img ?v=4.
     [2026-10-05] 아래로 3·왼쪽으로 1(원점 (308,60)). 탑재 상자 (308,60,714,399). img ?v=5. */
  { id: "hat_safari_boy", slot: "hat",   label: "정글 모자", emoji: "🧢", price:DECOR_PRICE.rare, rarity: "rare", theme: "adventure", forGender: "boy", hidesHead: true, img: "assets/avatar/hat/safari-brown.webp?v=5", thumb: "assets/avatar/thumb/hat_safari_boy.webp" },
  /* 번개 캡모자 [2026-10-04] — 남아. 청록 캡(뒤로 쓴 챙·형광 번개) + 얼굴 한 장(사용자 원화 589×500). 번개 스케이터 옷과 짝.
     사파리 모자와 같은 방식 — hidesHead 로 기본 머리 장을 빼고 이 그림이 머리를 대신한다. 얼굴(눈~입) 템플릿 매칭(일치 0.956)으로
     배율 0.644, 원점 (336,76). 기본 머리 장처럼 y404 아래는 잘랐다. 탑재 상자 (336,76,715,398).
     [2026-10-04] 사용자 조정 — 아래로 1(원점 (336,77)). 탑재 상자 (336,77,715,399). img ?v=2.
     [2026-10-04] 아래로 1 더(원점 (336,78)). 탑재 상자 (336,78,715,400). img ?v=3.
     [2026-10-04] 머리 3% 크게(배율 0.6633, 턱 아래끝·얼굴 가운데 x516 고정, 원점 (331,68)). 탑재 상자 (331,68,722,400). img ?v=4.
     [2026-10-04] 2% 더 크게(배율 0.6766, 턱·가운데 고정, 원점 (327,61)). 탑재 상자 (327,61,726,399). img ?v=5.
     [2026-10-04] 왼쪽으로 2·아래로 1(원점 (325,62)). 탑재 상자 (325,62,724,400). img ?v=6. */
  { id: "hat_cap_boy",    slot: "hat",   label: "번개 캡모자", emoji: "🧢", price:DECOR_PRICE.rare, rarity: "rare", theme: "common", forGender: "boy", hidesHead: true, img: "assets/avatar/hat/lightning-cap-boy.webp?v=6", thumb: "assets/avatar/thumb/hat_cap_boy.webp" },
  /* 썸머 썬캡 [2026-10-04] — 남아. 주황 썬캡(조개 장식) + 얼굴 한 장(사용자 원화 520×456). 썸머 웨이브 옷과 짝.
     번개 캡모자와 같은 방식(hidesHead) — 얼굴(눈~입) 템플릿 매칭(일치 0.953)으로 배율 0.676, 원점 (339,83). y404 아래 자름.
     탑재 상자 (339,83,691,391).
     [2026-10-04] 사용자 조정 — 2% 크게(배율 0.6895, 턱·얼굴 가운데 고정) 후 아래로 5, 원점 (335,82). 탑재 상자 (335,82,694,396). img ?v=2.
     [2026-10-04] 아래로 3 더(원점 (335,85)). 탑재 상자 (335,85,694,399). img ?v=3. */
  { id: "hat_visor_boy",  slot: "hat",   label: "썸머 썬캡", emoji: "🧢", price:DECOR_PRICE.rare, rarity: "rare", theme: "common", forGender: "boy", hidesHead: true, img: "assets/avatar/hat/summer-visor-boy.webp?v=3", thumb: "assets/avatar/thumb/hat_visor_boy.webp" },
  /* 해적 모자 남아 [2026-10-04] — 남색 삼각 해적모(금 테두리·해골) + 얼굴 한 장(사용자 원화 574×475). 꼬마 해적단 옷과 짝.
     여아 꼬마해적 모자(hat_pirate)는 그대로 두고 남아용 id 를 따로 둔다. 번개 캡모자와 같은 방식(hidesHead) —
     얼굴(눈~입) 템플릿 매칭(일치 0.972)으로 배율 0.712, 원점 (318,58). y404 아래 자름. 탑재 상자 (318,58,727,396).
     [2026-10-04] 사용자 조정 — 아래로 4·왼쪽으로 1(원점 (317,62)). 탑재 상자 (317,62,726,400). img ?v=2. */
  { id: "hat_pirate_boy", slot: "hat",   label: "해적 모자", emoji: "🏴‍☠️", price:DECOR_PRICE.epic, rarity: "epic", theme: "pirate", forGender: "boy", hidesHead: true, img: "assets/avatar/hat/pirate-hat-boy.webp?v=2", thumb: "assets/avatar/thumb/hat_pirate_boy.webp" },
  /* 사파리 옷 — 원화가 블라우스+반바지 한 장이라 상의 슬롯 하나로 넣는다(사용자 확정).
     상의(35)가 하의(30) 위라 하의를 같이 껴도 이 그림이 덮는다. */
  /* [2026-08-20] 남아 원화가 들어와 남녀 공용이 됐다 — 그림이 성별로 갈리는 첫 아이템.
       남아: 크림 셔츠 + 탄색 조끼 + 카고 반바지 · 여아: 블라우스 + 반바지
     상점 카드 그림도 갈린다(thumbGirl) — 남아에게 여아 블라우스를 보여 주면 헷갈린다.
     남아 탑재값은 배율 0.58 · 가로만 1.06배 · 깃 위끝 y382 (art-src/README 참고).
     [2026-08-21] 가랑이 V 틈으로 베이스 흰 속옷이 비쳐서 그 자리만 반바지 색으로 메웠다.
     옷걸이에 건 모양이라 어깨선이 처져 있어서, 깃을 기본 반팔티 자리(y411)에 맞추면
     어깨 위에 맨살 띠가 남는다. 세로를 올려야 없어진다.
     [2026-10-02] 남아 그림 교체 (사용자 원화 v2 — 초록 긴소매 + 카키 조끼 + 카키 반바지).
     베이스 v9 남아에 맞춰 배율 0.65 · 가로 1.02배 · 위끝 y402 · 중심 515 로 넣은 뒤, 사용자가 격자로 보며
     2% 키우고 2px 내려 확정 — 배율 0.663 · 가로 1.02배 · 위끝 y404 · 중심 515 (art-src/README 참고).
     [2026-10-02] 다시 1% 줄이고 왼쪽 1px(배율 0.6564 · 중심 514) → 사용자가 그 판의 어깨를 직접 늘려
     보내 주신 손질본을 (369,404) 에 1% 확대해서 얹었다(safari-boy-outfit-edit-src).
     배율 0.663 · 가로 1.02배 · 중심 x516. 가랑이 V 메움은 하지 않는다 — 사용자가
     기본 아바타를 바꿀 예정이라. 새 베이스 올 때 다시 맞춘다 (사용자 확정). */
  /* [2026-10-02] 여아 사파리 옷 새 원화로 교체 — 크림 블라우스(데이지 자수 깃) + 벨트 초록 반바지(사용자 원화).
     베이커리룩과 같은 방식: 원화 목 외곽선 중심(x181)을 여아 목 중심 x512.5 에, 목이 어깨로 넓어지는 원화 y15 를 y372 에 맞추고
     배율 0.70(원화 목 폭 63 → 여아 목 44 와 같아지는 값, 수영복 비침 1px). 원화 목은 페이드. imgGirl ?v=5 · thumbGirl ?v=2. */
  { id: "top_vest",       slot: "top",   label: "정글 탐험대",   emoji: "🌿", labelGirl: "들꽃 탐험가", emojiGirl: "🌼", price:DECOR_PRICE.rare, rarity: "rare",   theme: "adventure", coversBottom: true, img: "assets/avatar/top/safari-outfit-boy.webp?v=9", imgGirl: "assets/avatar/top/safari-outfit-girl.webp?v=5", thumb: "assets/avatar/thumb/top_vest.webp?v=6", thumbGirl: "assets/avatar/thumb/top_vest-girl.webp?v=3" },

  /* ── 딸기 소풍 · 별빛 마법사 (여아) — 사용자 원화 2026-08-19 ─────────────
     이 두 벌은 원화를 **베이스 v7 여아가 입은 전신 그림**으로 받았다. 그래서 배율을
     눈으로 맞출 필요가 없다 — 전신 그림을 베이스와 같은 자리(키 848·발끝 y940)에 맞춘 뒤
     베이스와 다른 픽셀만 남기면 그게 곧 제자리에 놓인 옷이다(맨살·머리 부분은 저절로 빠진다).
     앞으로 옷 원화는 이 방식으로 받는 게 제일 정확하다.
     둘 다 상·하의가 한 장이라 사파리 옷과 같이 상의 슬롯 하나로 넣는다. */
  /* [2026-10-02] 딸기 소풍 옷 새 원화로 교체 — 분홍 깅엄 짧은 재킷 + 흰 둥근 깃 블라우스·분홍 리본 + 분홍 반바지(사용자 원화, 옷만 오려 낸 그림).
     위의 '입은 전신 그림' 방식은 옛 판 기록. 원화 목 외곽선 중심(x198.5)을 여아 목 중심 x512.5 에, 원화 y14(목이 깃으로 들어가기 직전)를 y370 에 맞췄다.
     원화 목 폭 64px 를 베이스 목 폭 45px 에 맞춘 배율 0.70 — 흰 수영복 비침 0. 원화 목 위쪽은 페이드로 베이스 목과 섞었다. 탑재 상자 (374,360,646,673). img ?v=4 · thumb ?v=2. */
  { id: "top_picnic",     slot: "top",   label: "딸기 소풍룩", emoji: "🍓", price:DECOR_PRICE.rare, rarity: "rare", theme: "picnic", forGender: "girl", coversBottom: true, img: "assets/avatar/top/picnic-outfit-girl.webp?v=4", thumb: "assets/avatar/thumb/top_picnic.webp?v=3" },
  /* [2026-10-02] 여아 별빛 마법사 옷 새 원화로 교체 — 보라 후드 망토(별 브로치) + 연보라 원피스·별 무늬 치마, 소매 끝에 치마를 잡은 손까지 그려져 있다(사용자 원화).
     원화 맨 위의 턱 곡선을 지우고, 후드 사이 목 중심(x255.5)을 여아 목 중심 x512.5 에, 원화 턱선 y14 를 여아 턱선 y361 에 맞췄다.
     배율 0.62 — 원화 손이 아바타 손 자리(x357~417·y560~658)를 덮어 손이 두 쌍으로 안 보인다(흰 수영복 비침 0). 원화 목은 페이드. img ?v=4 · thumb ?v=2.
     [2026-10-02] 사용자 요청 — 옷에 그려진 손만 보이게, 입었을 때 손을 뺀 몸(bodyImgGirl)을 쓴다.
     [2026-10-02] 사용자 조정 — 위치(턱선 y361)는 그대로 두고 0.62 → 0.6577(약 6% 키움). 손을 뺀 몸도 새 소매 자리에 맞춰 다시 만들었다. img ?v=5 · body ?v=2.
     [2026-10-02] 다시 키움 0.6577 → 0.698(×1.02×1.02×1.01×1.01), 위치 그대로. 목 양옆 어깨 노출 2px. img ?v=6 · body ?v=3. */
  { id: "top_magic",      slot: "top",   label: "달빛 마법사", emoji: "🌙", price:DECOR_PRICE.epic, rarity: "epic", theme: "magic",  forGender: "girl", coversBottom: true, bodyImgGirl: "assets/avatar/base/body-girl-nohands.webp?v=3", img: "assets/avatar/top/magic-outfit-girl.webp?v=6",  thumb: "assets/avatar/thumb/top_magic.webp?v=5" },
  /* 베이커리룩 [2026-10-02] — 크림 셔츠 + 분홍 깃·앞치마·주름치마 원피스(사용자 원화). 원화 목 외곽선 중심(x174.75)을 여아 목 중심 x512.5 에,
     목이 어깨로 넓어지는 원화 y18 을 여아 같은 지점 y372 에 맞추고 흰 수영복이 다 가려지는 가장 작은 배율 0.71.
     원화 목 살·목 옆선은 위에서 아래로 페이드해 베이스 목과 섞었다. */
  { id: "top_bakery_girl", slot: "top",   label: "핑크 파티시에",   emoji: "🥐", price:DECOR_PRICE.rare, rarity: "rare", theme: "common", forGender: "girl", coversBottom: true, img: "assets/avatar/top/bakery-outfit-girl.webp", thumb: "assets/avatar/thumb/top_bakery.webp?v=2" },
  /* 노란 우비 [2026-10-02] — 노란 우비(흰 둥근 깃·구름 주머니) + 청록 반바지 한 벌(사용자 원화). 베이커리룩과 같은 방식:
     원화 목 외곽선 중심(x226.5)을 여아 목 중심 x512.5 에, 곧은 목선이 끝나는 원화 y19 를 y372 에 맞추고
     배율 0.69(원화 목 폭 64 → 여아 목 44, 소매가 손목에서 끝난다). 원화 목은 페이드.
     [2026-10-02] 사용자 요청으로 우비 밑단 아래 청록 반바지만 5% 키웠다(허리 가운데 기준, 우비는 그대로). ?v=2 */
  { id: "top_raincoat_girl", slot: "top", label: "노란 우비룩",    emoji: "🌈", price:DECOR_PRICE.rare, rarity: "rare", theme: "common", forGender: "girl", coversBottom: true, img: "assets/avatar/top/raincoat-girl.webp?v=2", thumb: "assets/avatar/thumb/top_raincoat.webp?v=3" },
  /* 배달부룩 [2026-10-02] — 하늘색 세일러 블라우스(크림 깃·파란 리본) + 파란 주름치마 원피스(사용자 원화, 검은 배경으로 받음).
     베이커리룩과 같은 방식: 원화 목 외곽선 중심(x241.25)을 여아 목 중심 x512.5 에, 곧은 목선이 끝나는 원화 y15 를 y372 에 맞추고
     흰 수영복이 다 가려지는 배율 0.60(목 폭 기준 0.58 과 거의 같다). 원화 목은 페이드. */
  { id: "top_delivery_girl", slot: "top", label: "파랑 우편부",     emoji: "💌", price:DECOR_PRICE.rare, rarity: "rare", theme: "common", forGender: "girl", coversBottom: true, img: "assets/avatar/top/delivery-outfit-girl.webp", thumb: "assets/avatar/thumb/top_delivery.webp?v=2" },
  /* 우주복 — 옷이 흰색이라 '베이스와 색이 다른 픽셀' 규칙만으로는 안 떼어졌다.
     베이스 속옷도 희고 살색과도 가까워서다. 그래서 '베이스가 살색인 자리에서만 색차를 본다'로
     바꿔서 떼어냈다(art-src/README 참고). 팔·다리까지 다 덮는 한 벌이라 상의 슬롯 하나.
     [2026-09-25] 남아 원화가 들어와 남녀 공용이 됐다 (사파리·해적 옷에 이어 세 번째).
     [2026-09-29 남아 원화 교체] 사용자가 헬멧·가방·신발까지 갖춘 '우주 세트'로 새로 그려
     보내 왔다 — 남아 우주복만 이 그림으로 갈아 끼웠다(그림 교체, CLAUDE.md 6). id·가격은
     그대로라 이미 산 아이는 그대로 입고 있다. 새 그림: 흰 우주복 + 남색 어깨·벨트·무릎보호대 +
     제어판·토성 패치 + 주황 포인트. 손·발은 알파 0(투명)으로 비워 베이스 맨손·맨발이 비친다
     (해적 옷과 같은 방식, 다만 이번엔 색이 아니라 손·발 상자를 직접 지워 골라냈다).
     탑재: 여러 장(옷만·헬멧만·헬멧+신발·헬멧+가방+신발)을 받아 목깃 높이(y640)·벨트 폭을
     기준으로 배율 0.638 균등 산출 → 목깃 위끝 y640, 발목깃 y1425(맨발 시작 전) 잘라
     탑재 상자 대략 (224,-3)~(608+224,1053-3). 우주 헬멧(hat_astronaut)·로켓 가방
     (back_rocket)·우주 부츠(shoes_astronaut)도 같은 배율·목깃선으로 맞춰 세트가 어긋나지
     않는다(art-src/README '우주 세트' 참고).
     [2026-10-03] 남아 우주복 새 원화로 교체(같은 디자인, 어깨·소매까지 다 그려진 461×713 한 장, 사용자 원화). 위 탑재값은 옛 판 기록.
     옛 판 자리(배율 0.716 에 상관 0.95 로 겹침)에서는 어깨 위로 베이스 어깨 살·속옷 끈이 비쳐서, 목깃 가운데(원화 x230.5)를 x516 에 두고
     배율 0.758·목깃 위끝 y394(옛 판보다 위로 10)로 올려 어깨를 덮었다. 목깃 안(원화 y0~31, x140~329)의 R≥B 픽셀(턱선·목 살)은 지워
     베이스 목이 비친다. 바지 끝 y934 — 우주 부츠(z25)의 부츠목을 덮는다. 탑재 상자 (341,394,690,934). img ?v=4.
     [2026-10-03] 사용자 조정 — 8% 작게(배율 0.6974, 목깃 가운데 x516·위끝 y394 고정). 탑재 상자 (355,394,677,891). img ?v=5.
     [2026-10-03] 사용자 조정 — 위로 3(목깃 위끝 y391). 탑재 상자 (355,391,677,888). img ?v=6.
     [2026-10-03] 사용자 조정 — 왼쪽으로 3·위로 2(목깃 가운데 x513, 위끝 y389). 탑재 상자 (352,389,674,886). img ?v=7.
     [2026-10-03] 사용자 조정 — 오른쪽으로 1(목깃 가운데 x514). 탑재 상자 (353,389,675,886). img ?v=8.
     [2026-10-03] 사용자 조정 — 1% 작게(배율 0.6904)·위로 1(목깃 가운데 x514 고정, 위끝 y388). 탑재 상자 (355,388,673,880). img ?v=9.
     [2026-10-03] 사용자 조정 — 화면 왼쪽 다리만 오른쪽으로 1. 다리가 갈라지는 y676 부터 60px 에 걸쳐 0→1px 로 서서히 옮겨
     (y736 아래는 1px) 허리에 이음매가 없다. 이후 배율·위치를 다시 바꾸면 이 다리 옮김도 다시 적용해야 한다. img ?v=10.
     [2026-10-03] 화면 왼쪽 다리 오른쪽으로 1 더(합계 2px, 같은 방식 y676 부터 60px 에 걸쳐 0→2px). img ?v=11. */
  /* 해적 옷 — 이 원화도 '옷만 오려 낸 그림'이라 상체를 눈으로 맞췄다(하늘 나들이 옷과 같은 방식).
     긴소매라 소맷부리가 손목에 닿는 배율을 골랐다 — 0.72는 팔뚝이 남고 0.76부터는 손을 덮는다.
     배율 0.74 · 깃 위끝 y372(기본 반팔티 깃과 같은 자리) → 탑재 상자 (350,372)-(674,754). */
  /* [2026-08-21] 남아 원화가 들어와 남녀 공용이 됐다 (사파리 옷에 이어 두 번째).
       남아: 줄무늬 셔츠 + 남색 조끼 + 빨간 띠 + 검정 반바지 · 여아: 블라우스 + 남색 반바지
     남아 원화는 '입고 있는 전신 그림'인데 **알파 채널에 옷만 담겨 있었다** —
     RGB 는 몸까지 다 있고 알파는 옷 모양이다. 그래서 배경을 지워 몸 실루엣으로 배율만 잡고
     (머리끝·발끝 → 배율 0.59329), 같은 변환을 알파에 담긴 옷에 그대로 적용했다.
     색으로 옷을 골라낼 필요가 없어서 제일 깔끔하다. 탑재 상자 (358,397)-(670,763). */
  /* [2026-10-02] 여아 해적 옷 새 원화로 교체 — 크림 퍼프 블라우스(둥근 깃·주황 리본) + 주황 허리띠 남색 반바지(사용자 원화).
     베이커리룩과 같은 방식: 원화 목 외곽선 중심(x209)을 여아 목 중심 x512.5 에, 곧은 목선이 끝나는 원화 y15 를 y372 에 맞추고
     배율 0.70(원화 목 폭 63 → 여아 목 44, 흰 수영복도 이 값부터 다 가려진다). 원화 목은 페이드. imgGirl ?v=4 · thumbGirl ?v=2.
     [2026-10-02] 사용자 수정판으로 교체 — 반바지 밑단 아래가 조금 늘었다. 같은 탑재값. imgGirl ?v=5 · thumbGirl ?v=3. */
  { id: "top_pirate",     slot: "top",   label: "꼬마 해적단",     emoji: "🏴‍☠️", price:DECOR_PRICE.epic, rarity: "epic", theme: "pirate", coversBottom: true, img: "assets/avatar/top/pirate-outfit-boy.webp", imgGirl: "assets/avatar/top/pirate-outfit-girl.webp?v=5", thumb: "assets/avatar/thumb/top_pirate.webp?v=2", thumbGirl: "assets/avatar/thumb/top_pirate-girl.webp?v=4" },
  /* 민트 후드 — 남아 전용 첫 아이템(forGender:"boy"). 크림 후드 + 왼팔만 보라 소매 +
     민트 후드 안감·꽃 패치 + 짙은 카고 반바지. 상·하의가 한 장이라 상의 슬롯 하나.
     원화는 옷만 오려 낸 깨끗한 그림인데 **후드 안쪽 목·가슴 살은 일부러 남겼다** —
     후드 구멍이 베이스 목(폭 58~62)보다 훨씬 넓어서, 살을 지우면 그 자리가 뻥 뚫린다.
     배율 가로 0.50 · 세로 0.45 (세로 10% 눌림 — 원화가 베이스보다 홀쭉하다) ·
     후드 위끝 y396 → 탑재 상자 (350,394)-(674,737).
     실측: 소매부리 y635(손목 y625 바로 아래) · 반바지 밑단 y737(허벅지 중간).
     어깨에 드러나는 베이스는 줄당 1~8px 뿐이라 화면에서 안 보인다.
     [주의] id 를 top_hoodie 로 하면 안 된다 — 구 v1 아이템 id 와 겹쳐서
     (LEGACY_PRICES.top_hoodie = 110), 옛 기록을 가진 아이가 환불 대신 '보유'로
     넘어와 버린다(computeAvatarMigration). 그래서 top_hoodie_mint 로 둔다. */
  /* [사용자 확정 2026-09-26] 이름을 '민트꽃 후드' → '민트 후드' 로 줄였다.
     id(top_hoodie_mint)는 그대로 둔다 — 보유·착용 기록이 id 로 저장돼 있어서
     바꾸면 이미 산 아이가 옷을 잃는다. */
  /* [2026-10-02] 새 원화로 교체 (민트 집업 후드 + 흰 티 + 남색 카고 긴바지 한 벌, 사용자 원화).
     원화 위쪽에 함께 그려진 턱으로 위치를 잡았다(배율 0.695 · 왼쪽 위 (355,365)) — 턱이 베이스 턱과 겹친다.
     턱은 지우고 목 살은 턱선 아래(원화 y53~)부터 남겼다 — 다 지우면 구멍으로 베이스 민소매 끈이 비친다. */
  { id: "top_hoodie_mint", slot: "top",  label: "바다 탐험대",    emoji: "🌊", price:DECOR_PRICE.rare, rarity: "rare", theme: "common", forGender: "boy", coversBottom: true, img: "assets/avatar/top/hoodie-boy.webp?v=2", thumb: "assets/avatar/thumb/top_hoodie.webp?v=3" },
  /* 비치룩 [2026-10-02] — 꽃무늬 오렌지 셔츠 + 흰 티 + 청록 수영 반바지 한 벌(사용자 원화). 비치 테마가 없어 공용(common).
     원화 목 중심을 베이스 목 중심(x516)에, 턱선(원화 y28)을 y402 에 맞추고 어깨가 다 가려지는 배율 0.72 로 얹었다.
     턱은 지우고, 원화 턱선이 베이스 턱보다 ~7px 낮아 목 위쪽(원화 y30~52)을 서서히 투명하게 해서 베이스 목과 섞었다.
     [2026-10-02 격자 확정] 턱을 지울 때 깃 끝 윤곽선까지 지워져 잘려 보였다 → 턱 살과 그 둘레만 지우게 고쳐 되살림.
     사용자가 격자로 보고 배율 2% 줄이고(0.7056) 위로 3(원화 y28 → y399) 확정. 탑재 상자 (359,393)-(665,737). */
  { id: "top_beach_boy",  slot: "top",   label: "썸머 웨이브",       emoji: "🏝️", price:DECOR_PRICE.rare, rarity: "rare", theme: "common", forGender: "boy", coversBottom: true, img: "assets/avatar/top/beach-outfit-boy.webp?v=2", thumb: "assets/avatar/thumb/top_beach.webp?v=3" },
  /* 보드룩 [2026-10-02] — 크림 후드(남색·청록 소매) + 남색 카고 반바지 한 벌(사용자 원화). 비치룩과 같은 방식:
     원화 목 중심(x228.95)을 x516 에, 원화 턱선 y25 를 y399 에 고정하고 어깨가 다 가려지는 가장 작은 배율 0.71.
     턱(위 가장자리에 닿는 살 덩어리 + 둘레 갈색 선)을 지우고 목 위쪽(원화 y26~48)은 페이드로 베이스 목과 섞었다. */
  { id: "top_board_boy",  slot: "top",   label: "번개 스케이터",       emoji: "⚡", price:DECOR_PRICE.rare, rarity: "rare", theme: "common", forGender: "boy", coversBottom: true, img: "assets/avatar/top/board-outfit-boy.webp", thumb: "assets/avatar/thumb/top_board.webp?v=2" },
  /* 도토리 탐험복 — 남아 (사용자 원화 2026-09-26). 크림 셔츠 + 나뭇잎 망토 +
     도토리 금브로치 + 가죽 벨트 + 갈색 카고 반바지.
     원화가 '옷만 오려 낸 깨끗한 그림'이라(연결 조각 1개·안쪽 구멍 0) 색으로
     떼어낼 일이 없었다 — 후드·사파리와 같은 경우다.
     배율 0.42 균등 · 망토 위끝 y383 → 탑재 상자 (366,383)-(661,740).
     배율은 사파리 옷 남아에 맞춰 잡았다 — 소매부리 폭 293px, 상자 x366~661 로
     둘이 거의 같은 자리에 온다(사파리 (366,386)-(659,742)). 같은 몸에 입히는
     같은 종류의 옷이라 자리가 어긋나면 갈아입을 때 튄다.
     망토 깃 안쪽 목·가슴 살은 남겼다 — 깃 구멍(폭 39)이 베이스 목(폭 67)보다
     좁아서 살을 지우면 깃 사이로 구멍이 보인다(민트 후드와 같은 이유). */
  /* [2026-10-02] 새 원화로 교체 (잎사귀 망토 + 크림 셔츠 + 갈색 반바지 한 벌, 사용자 원화) — 위 탑재값은 옛 판 기록.
     비치룩·보드룩과 같은 방식: 원화 목 중심(x227.43)을 x516 에, 턱선 y14 를 y399 에 고정하고 어깨·속옷이 다 가려지는
     가장 작은 배율 0.71. 턱은 지우고, 목 살(크림 깃과 R−B 로 구분)만 페이드로 베이스 목과 섞었다. 탑재 상자 (355,391)-(671,782). */
  { id: "top_acorn",      slot: "top",   label: "도토리 숲지기", emoji: "🌰", price:DECOR_PRICE.rare, rarity: "rare", theme: "adventure", forGender: "boy", coversBottom: true, img: "assets/avatar/top/acorn-outfit-boy.webp?v=4", thumb: "assets/avatar/thumb/top_acorn.webp?v=5" },
  /* [2026-10-02] 여아 우주복 새 원화로 교체 — 흰 우주복(보라 목둘레·어깨·무릎 패드, 금 버클), 발목까지 오는 한 벌(사용자 원화).
     원화 맨 위의 턱선과 목둘레 안쪽 목 살을 지워 베이스 목이 그대로 보이게 하고, 목둘레 안 목 중심(x214)을 여아 목 중심 x512.5 에,
     원화 턱 자리 y2 를 여아 턱선 y361 에 맞췄다. 배율 0.70 — 흰 수영복·다리가 다 가려지고 발목·손목에서 끝난다. imgGirl ?v=2.
     [2026-10-02] 사용자 조정 — 위로 5·왼쪽 1·2% 크게: 배율 0.714, 목 중심 x511.5, 턱 자리 y356. 탑재 상자 (359,355,662,891). imgGirl ?v=4.
     (?v=3 은 조정값이 안 먹고 0.68배로 잘못 들어갔던 판)
     [2026-10-03] 여아 우주복 원화 다시 교체(같은 디자인, 팔·다리가 조금 날씬한 판, 423×747). 사용자가 맞춘 자리를 잇도록
     새 원화를 옛 원화에 템플릿 매칭(상관 0.88)해 옛 원화 좌표 = 0.995×새 좌표 + (3,2) 를 얻고 같은 탑재값으로 옮겼다 —
     배율 0.7104, 목 중심 새 원화 x212.06 → x511.5, 턱 자리 y0 → y356. 목둘레 안(y0~23, x173~255)과 맨 위(y0~5)의 보라 아닌 픽셀을 지웠다.
     옛 판과 겹침 IoU 0.956. 탑재 상자 (361,356,662,887). imgGirl ?v=5.
     [2026-10-03] 사용자 조정 — 왼쪽으로 2(목 중심 x509.5). 탑재 상자 (359,356,660,887). imgGirl ?v=6. */
  { id: "top_space",      slot: "top",   label: "우주 탐험대",       emoji: "🚀", labelGirl: "별빛 우주인", emojiGirl: "🪐", price:DECOR_PRICE.epic, rarity: "epic", theme: "space",  coversBottom: true, img: "assets/avatar/top/space-suit-boy.webp?v=11", imgGirl: "assets/avatar/top/space-suit-girl.webp?v=6", thumb: "assets/avatar/thumb/top_space.webp?v=4", thumbGirl: "assets/avatar/thumb/top_space-girl.webp?v=5" },

  /* ── 우주 세트 (남아) — 사용자 원화 2026-09-29 ────────────────────────────
     우주복(top_space)과 같은 원화 세트에서 나온 가방·신발. 둘 다 남아 전용 첫
     세트 아이템이고(back·shoes 슬롯에 살아 있는 아이템이 이제껏 하나도 없었다),
     같은 배율(0.638)·목깃선(y640)으로 탑재해 우주복과 갈아입어도 자리가 안 어긋난다.
     [2026-09-30] 우주 헬멧(hat_astronaut)은 사용자가 미리보기를 보고 바로
     빼 달라고 해서 뺐다 — 아래 RETIRED_ITEM_INFO 참고, 그림 파일은 남겨 둔다. */
  /* 로켓 가방 — 원화가 어깨 너머로 들여다본 모습이라, 몸통에 가려지는 부분은 버리고
     실루엣 밖으로 삐져나온 로켓 덩어리만 오려 냈다(등 슬롯 기본 z15 그대로 — 몸통 뒤에서
     튀어나온 부분만 보이면 되므로 앞으로 끌어올 필요가 없었다). */
  { id: "back_rocket",    slot: "back",  label: "로켓 가방",    emoji: "🚀", price:DECOR_PRICE.rare, rarity: "rare", theme: "space", forGender: "boy", img: "assets/avatar/back/rocket-pack-boy.webp", thumb: "assets/avatar/thumb/back_rocket.webp" },
  /* 우주 부츠 — 우주복 바지 밑단(y1425 근처)에 발목깃이 물리게 맞췄다. */
  /* [2026-10-03] 새 원화로 교체 — 남색·흰 우주 부츠(하늘색 띠·주황 탭) 두 짝, 사용자 원화 352×173. 위 탑재값은 옛 판 기록.
     여아 신발과 같은 방식 — 두 짝을 따로 잘라 원화 부츠목 가운데(왼짝 x85 · 오른짝 x56.5)를 남아 다리 가운데(x450.5 · x574.5)에,
     배율 0.72, 밑창 아래끝 y949(밑창 홈 사이로 발가락이 비치지 않게 발바닥 y939 보다 10 아래), 왼짝 +2·오른짝 −2. 맨발 9px(밑창 홈 끝, 눈에 안 띔).
     여아 우주 부츠처럼 옷 위로 그린다(z37, 사용자 확정 "우주 부츠는 옷 위로"). 탑재 상자 (391,824,632,949). img·thumb ?v=2.
     [2026-10-03] 사용자 조정 — 두 짝 1% 크게(배율 0.7272, 밑창·부츠목 가운데 고정). 탑재 상자 (391,823,632,949). img ?v=3.
     [2026-10-03] 화면 왼쪽 짝만 왼쪽으로 2(왼짝 +2 → 0). 탑재 상자 (389,823,632,949). img ?v=4. */
  { id: "shoes_astronaut",slot: "shoes", label: "우주 부츠",    emoji: "🚀", price:DECOR_PRICE.common, rarity: "common", theme: "space", forGender: "boy", z: 37, img: "assets/avatar/shoes/astronaut-boots-boy.webp?v=4", thumb: "assets/avatar/thumb/shoes_astronaut.webp?v=3" },

  /* 라이트 부츠(처음 이름 정글 부츠, 2026-10-03 사용자 요청으로 바꿈) [2026-10-03] — 남아. 카키 하이탑 + 회색 양말, 불 들어오는 밑창 두 짝, 사용자 원화 369×235. 정글 탐험대 옷과 짝.
     여아 신발과 같은 방식 — 두 짝을 따로 잘라 원화 양말 가운데(왼짝 x100.5 · 오른짝 x64)를 남아 다리 가운데(x450.5 · x574.5)에,
     배율 0.68, 왼짝 +3. 밑창이 안쪽으로 비스듬히 올라가 그 아래로 발가락이 비쳐서, 밑창 아래끝을 y956(발바닥 y939 보다 17 아래)까지 내려
     맨발 0px. 탑재 상자 (385,796,637,956).
     [2026-10-03] 사용자 조정 — 화면 왼쪽 짝만 1% 크게(0.6868, 밑창·양말 가운데 고정)·왼쪽으로 2(왼짝 +3 → +1). 탑재 상자 (382,795,637,956). img ?v=2.
     [2026-10-03] 화면 왼쪽 짝만 1% 더 크게(0.6937). 탑재 상자 (382,793,637,956). img ?v=3. */
  { id: "shoes_jungle", slot: "shoes", label: "정글 등산화",   emoji: "💡", price:DECOR_PRICE.common, rarity: "common", theme: "adventure", forGender: "boy", img: "assets/avatar/shoes/jungle-boots-boy.webp?v=3", thumb: "assets/avatar/thumb/shoes_jungle.webp?v=2" },
  /* 꼬마해적 신발 [2026-10-03] — 남아. 갈색 버클 부츠(접힌 목) 두 짝, 사용자 원화 340×177. 꼬마 해적단 옷과 짝.
     기존 남아 "해적 신발"(shoes_pirate)은 그대로 두고 따로 추가했다(사용자 요청 "추가").
     [2026-10-03] 한 번 뺐다가(판매 중단·환불 목록에 올렸음) 같은 날 사용자 요청으로 마지막 조정값 그대로 되살렸다.
     두 짝의 원화 밑창 높이가 달라(왼짝 y175 · 오른짝 y167) 짝마다 위아래를 딱 맞게 잘라 둘 다 같은 바닥에 서게 했다.
     원화 부츠목 가운데(왼짝 x84 · 오른짝 x55)를 남아 다리 가운데(x450.5 · x574.5)에, 배율 0.72, 왼짝 +4·오른짝 −3,
     밑창 아래끝 y955(발 안쪽 발가락이 밑창 안쪽 끝 아래로 비치지 않게). 맨발 9px(안쪽 끝, 눈에 안 띔). 탑재 상자 (394,836,628,955).
     [2026-10-03] 사용자 조정 — 두 짝 1% 크게(0.7272, 밑창·부츠목 가운데 고정), 화면 왼쪽 짝 왼쪽으로 1(+3)·오른쪽 짝 오른쪽으로 1(−2). 탑재 상자 (392,835,630,955). img ?v=2.
     [2026-10-03] 화면 왼쪽 짝만 왼쪽으로 1 더(+2). 탑재 상자 (391,835,630,955). img ?v=3.
     [2026-10-03] 화면 왼쪽 짝만 왼쪽으로 1 더(+1). 탑재 상자 (390,835,630,955). img ?v=4. */
  { id: "shoes_pirate_kid", slot: "shoes", label: "해적 부츠", emoji: "🏴‍☠️", price:DECOR_PRICE.common, rarity: "common", theme: "pirate", forGender: "boy", img: "assets/avatar/shoes/pirate-boots-kid-boy.webp?v=4", thumb: "assets/avatar/thumb/shoes_pirate_kid.webp?v=2" },
  /* 도토리 부츠(처음 이름 정글 부츠) [2026-10-03] — 남아. 초록 끈 부츠(나뭇잎 무늬) + 니트 양말 두 짝, 사용자 원화 339×204. 정글 탐험대 옷과 짝.
     처음 "정글 부츠"로 넣었던 shoes_jungle 은 이름을 라이트 부츠로 바꿔 그대로 두고, 이 신발은 새 id 로 넣었다.
     두 짝을 따로 잘라 원화 양말 가운데(왼짝 x82 · 오른짝 x56)를 남아 다리 가운데(x450.5 · x574.5)에, 배율 0.72, 왼짝 +4·오른짝 −2,
     밑창 아래끝 y952(발 안쪽이 밑창 아래로 비치지 않게). 맨발 2px. 탑재 상자 (395,805,628,952).
     [2026-10-03] 사용자 조정 — 이름 정글 부츠 → 도토리 부츠, 두 짝 2% 크게(배율 0.7344, 밑창·양말 가운데 고정). 탑재 상자 (394,802,629,952). img ?v=2.
     [2026-10-03] 두 짝 2% 더 크게(배율 0.7491). 탑재 상자 (393,799,631,952). img ?v=3.
     [2026-10-03] 화면 왼쪽 짝만 왼쪽으로 5(+4 → −1). 탑재 상자 (388,799,631,952). img ?v=4. */
  { id: "shoes_jungle_leaf", slot: "shoes", label: "도토리 부츠",   emoji: "🌿", price:DECOR_PRICE.common, rarity: "common", theme: "adventure", forGender: "boy", img: "assets/avatar/shoes/jungle-boots-leaf-boy.webp?v=4", thumb: "assets/avatar/thumb/shoes_jungle_leaf.webp?v=2" },
  /* 번개 운동화 [2026-10-03] — 남아. 청록 하이탑(형광 번개 무늬) + 흰 양말 두 짝, 사용자 원화 369×211. 번개 스케이터 옷과 짝.
     두 짝을 따로 잘라 원화 양말 가운데(왼짝 x94 · 오른짝 x61)를 남아 다리 가운데(x450.5 · x574.5)에, 배율 0.70, 왼짝 +4·오른짝 −4,
     밑창 아래끝 y952(발 안쪽이 밑창 아래로 비치지 않게). 맨발 13px(밑창 안쪽 끝, 눈에 안 띔). 탑재 상자 (389,804,639,952).
     [2026-10-03] 사용자 조정 — 양말만 3% 크게. 원화에서 신발(청록·형광) 위쪽 양말 부분만 떼어 양말 아래끝·가운데를 고정해 1.03배 하고
     신발 밑에 다시 끼웠다(신발 목 흰 테두리는 제외). 신발 크기·위치는 그대로. 탑재 상자 (389,801,639,952). img ?v=2.
     [2026-10-03] 양쪽 양말 10% 더 크게(원화 대비 1.133배, 원화에서 다시 만듦). 탑재 상자 (389,798,639,952). img ?v=3.
     [2026-10-03] 양말 위쪽 양옆에 원래 양말 테두리(검은 선)가 남던 것을 정리 — 양말 폭을 줄마다 따로 잡아 떼어냈다. img ?v=4.
     [2026-10-03] 화면 왼쪽 짝 왼쪽으로 2(+2)·오른쪽 짝 오른쪽으로 2(−2). img ?v=5.
     [2026-10-03] 운동화만 1% 크게(배율 0.707), 양말은 크기 그대로 두려고 원화 대비 양말 배율을 1.133/1.01=1.1218 로 다시 만들었다. img ?v=6.
     [2026-10-03] 운동화만 1% 더 크게(배율 0.7141), 양말 배율은 1.133/1.0201=1.1107 로 맞춰 화면 크기 유지. img ?v=7.
     [2026-10-04] 운동화·양말 함께 2% 크게(신발 배율 0.7284, 양말 비율 그대로). img ?v=8. */
  { id: "shoes_lightning", slot: "shoes", label: "번개 운동화",   emoji: "⚡", price:DECOR_PRICE.common, rarity: "common", theme: "common", forGender: "boy", img: "assets/avatar/shoes/lightning-sneakers-boy.webp?v=8", thumb: "assets/avatar/thumb/shoes_lightning.webp?v=2" },
  /* 썸머 샌들 [2026-10-03] — 남아. 주황 띠 샌들(청록 밑창), 발까지 그려진 원화 352×148. 썸머 웨이브 옷과 짝.
     원화에 발이 그려져 있어 아바타 맨발을 샌들 속 발로 다 덮게 맞췄다. 두 짝을 따로 잘라(짝마다 위아래 딱 맞게)
     원화 뒤끈 가운데(왼짝 x90.5 · 오른짝 x58.5)를 남아 다리 가운데(x450.5 · x574.5)에, 배율 0.74, 왼짝 +2·오른짝 −2,
     밑창 아래끝 y946. 맨발 0px. 탑재 상자 (386,842,638,946). */
  { id: "shoes_sandal", slot: "shoes", label: "썸머 샌들",   emoji: "🏝️", price:DECOR_PRICE.common, rarity: "common", theme: "common", forGender: "boy", img: "assets/avatar/shoes/summer-sandals-boy.webp", thumb: "assets/avatar/thumb/shoes_sandal.webp?v=2" },
  /* 바다 오리발 [2026-10-03] — 남아. 하늘색 오리발(남색 띠·금 버클) 두 짝, 사용자 원화 431×185. 바다 탐험대 옷과 짝.
     두 짝을 따로 잘라(짝마다 위아래 딱 맞게) 원화 발목 입구 가운데(왼짝 x131.5 · 오른짝 x62.5)를 남아 다리 가운데(x450.5 · x574.5)에,
     배율 0.72, 왼짝 +6·오른짝 −6, 밑창 아래끝 y955. 날개가 바깥으로 넓게 퍼져 상자가 넓다. 맨발 0px. 탑재 상자 (362,827,656,955).
     [2026-10-04] 사용자 조정 — 화면 왼쪽 짝 왼쪽으로 5(+6 → +1)·오른쪽 짝 오른쪽으로 3(−6 → −3). img ?v=2.
     [2026-10-04] 두 짝 3% 크게(배율 0.7416, 밑창·입구 가운데 고정), 오른쪽 짝 오른쪽으로 4(−3 → +1). img ?v=3.
     [2026-10-04] 두 짝 3% 더 크게(배율 0.7638). img ?v=4. */
  { id: "shoes_fins", slot: "shoes", label: "바다 오리발",   emoji: "🌊", price:DECOR_PRICE.common, rarity: "common", theme: "common", forGender: "boy", img: "assets/avatar/shoes/sea-fins-boy.webp?v=4", thumb: "assets/avatar/thumb/shoes_fins.webp?v=2" },
  /* 들꽃 신발 [2026-10-02] — 여아 신발 첫 아이템. 올리브 끈 부츠 두 짝(흰 양말 목, 주황 끈·밑창) 사용자 원화 264×191.
     두 짝을 따로 잘라 각각 다리 위에 얹었다 — 원화 발목 가운데(왼짝 x61 · 오른짝 x51.5)를 여아 다리 가운데(x455 · x556)에,
     밑창 아래끝을 y942(발바닥 y940 바로 아래)에 맞췄다. 배율 0.64 — 발등·발가락이 다 가려지고(맨발 0px) 부츠 목이 종아리 아래(y820)에서 끝난다.
     탑재 상자 (416,820,590,942). 들꽃 탐험가 옷과 같은 테마(adventure).
     [2026-10-03] 사용자 조정 — 화면 오른쪽 짝만 오른쪽으로 2, 2% 크게(배율 0.6528, 밑창·발목 가운데 고정). 탑재 상자 (416,817,593,942). img ?v=2.
     [2026-10-03] 오른쪽 짝만 2% 더 크게(배율 0.6659). 탑재 상자 (416,815,594,942). img ?v=3.
     [2026-10-03] 오른쪽 짝만 1% 더 크게(배율 0.6725). 탑재 상자 (416,814,594,942). img ?v=4. */
  { id: "shoes_wildflower", slot: "shoes", label: "들꽃 부츠",   emoji: "🥾", price:DECOR_PRICE.common, rarity: "common", theme: "adventure", forGender: "girl", img: "assets/avatar/shoes/wildflower-boots-girl.webp?v=4", thumb: "assets/avatar/thumb/shoes_wildflower.webp?v=2" },
  /* 딸기 신발 [2026-10-03] — 여아. 빨간 메리제인 + 흰 프릴 양말 두 짝, 사용자 원화 253×156.
     예전에 뺀 "딸기 구두"(shoes_picnic, 환불 처리됨)와 섞이지 않게 새 id 를 쓴다.
     들꽃 신발과 같은 방식 — 두 짝을 따로 잘라 원화 양말 가운데(왼짝 x53.5 · 오른짝 x47.5)를 다리 가운데(x455 · x556)에 두고
     배율 0.66, 밑창 아래끝 y944. 여아 발이 발바닥 쪽에서 바깥으로 벌어져 왼짝 -3 · 오른짝 +1 옮겨 맨발 0px.
     탑재 상자 (417,841,590,944). */
  { id: "shoes_strawberry", slot: "shoes", label: "딸기 구두",   emoji: "🍓", price:DECOR_PRICE.common, rarity: "common", theme: "picnic", forGender: "girl", img: "assets/avatar/shoes/strawberry-shoes-girl.webp", thumb: "assets/avatar/thumb/shoes_strawberry.webp?v=2" },
  /* 꼬마해적 신발 [2026-10-03] — 여아. 갈색 끈 부츠 + 흰 양말 두 짝, 사용자 원화 268×221.
     남아 해적 신발(shoes_pirate)은 그대로 두고 여아용 id 를 따로 둔다(꼬마해적 모자처럼).
     들꽃 신발과 같은 방식 — 두 짝을 따로 잘라 원화 발목 가운데(왼짝 x63.5 · 오른짝 x50.5)를 다리 가운데(x455 · x556)에,
     배율 0.61, 밑창 아래끝 y942, 오른짝 +1. 맨발 0px 가 되는 가장 작은 배율. 탑재 상자 (416,807,591,942).
     [2026-10-03] 사용자 조정 — 두 짝 모두 4% 크게(배율 0.6344, 밑창·발목 가운데 고정). 탑재 상자 (415,802,592,942). img ?v=2.
     [2026-10-03] 두 짝 4% 더 크게(배율 0.6598). 탑재 상자 (413,796,594,942). img ?v=3.
     [2026-10-03] 두 짝 4% 더 크게(배율 0.6862). 탑재 상자 (411,790,595,942). img ?v=4.
     [2026-10-03] 두 짝 4% 더 크게(배율 0.7136). 탑재 상자 (410,784,597,942). img ?v=5. */
  { id: "shoes_pirate_girl", slot: "shoes", label: "꼬마 해적 부츠", emoji: "🥾", price:DECOR_PRICE.common, rarity: "common", theme: "pirate", forGender: "girl", img: "assets/avatar/shoes/pirate-boots-girl.webp?v=5", thumb: "assets/avatar/thumb/shoes_pirate_girl.webp?v=2" },
  /* 파랑 신발 [2026-10-03] — 여아. 파란 운동화 + 파란 줄 흰 양말 두 짝, 사용자 원화 286×191. 파랑 우편부 옷과 짝.
     들꽃 신발과 같은 방식 — 두 짝을 따로 잘라 원화 양말 가운데(왼짝 x72 · 오른짝 x53.5)를 다리 가운데(x455 · x556)에,
     배율 0.62(양말 폭이 다리 폭과 맞는 크기), 밑창 아래끝 y944. 맨발 0px. 탑재 상자 (410,826,596,944).
     [2026-10-03] 사용자 조정 — 두 짝 6% 크게(배율 0.6572, 밑창·양말 가운데 고정). 탑재 상자 (408,818,598,944). img ?v=2.
     [2026-10-03] 두 짝 4% 더 크게(배율 0.6835). 탑재 상자 (406,813,599,944). img ?v=3.
     [2026-10-03] 화면 오른쪽 짝만 오른쪽으로 3. 탑재 상자 (406,813,602,944). img ?v=4. */
  { id: "shoes_blue", slot: "shoes", label: "파랑 운동화",   emoji: "👟", price:DECOR_PRICE.common, rarity: "common", theme: "common", forGender: "girl", img: "assets/avatar/shoes/blue-sneakers-girl.webp?v=4", thumb: "assets/avatar/thumb/shoes_blue.webp?v=2" },
  /* 노랑 장화 [2026-10-03] — 여아. 노란 장화(청록 테두리·구름 무늬) 두 짝, 사용자 원화 261×197. 노란 우비룩과 짝.
     들꽃 신발과 같은 방식 — 두 짝을 따로 잘라 원화 장화목 가운데(왼짝 x59.5 · 오른짝 x52)를 다리 가운데(x455 · x556)에,
     배율 0.66, 밑창 아래끝 y944. 맨발 0px. 탑재 상자 (416,814,592,944).
     [2026-10-03] 사용자 조정 — 두 짝 4% 크게(배율 0.6864, 밑창·장화목 가운데 고정). 탑재 상자 (414,809,593,944). img ?v=2.
     [2026-10-03] 화면 오른쪽 짝만 오른쪽으로 3. 탑재 상자 (414,809,596,944). img ?v=3. */
  { id: "shoes_rain", slot: "shoes", label: "노랑 장화",   emoji: "🥾", price:DECOR_PRICE.common, rarity: "common", theme: "common", forGender: "girl", img: "assets/avatar/shoes/rain-boots-girl.webp?v=3", thumb: "assets/avatar/thumb/shoes_rain.webp?v=2" },
  /* 핑크 구두 [2026-10-03] — 여아. 분홍 메리제인 + 흰 프릴 양말 두 짝, 사용자 원화 264×166. 핑크 파티시에 옷과 짝.
     들꽃 신발과 같은 방식 — 두 짝을 따로 잘라 원화 양말 가운데(왼짝 x60.5 · 오른짝 x50.5)를 다리 가운데(x455 · x556)에,
     배율 0.69, 밑창 아래끝 y944, 오른짝 +3(사용자가 장화·파랑 신발에서 맞춘 크기·위치와 같게). 맨발 0px. 탑재 상자 (413,829,597,944). */
  { id: "shoes_pink", slot: "shoes", label: "핑크 구두",   emoji: "👞", price:DECOR_PRICE.common, rarity: "common", theme: "common", forGender: "girl", img: "assets/avatar/shoes/pink-shoes-girl.webp", thumb: "assets/avatar/thumb/shoes_pink.webp?v=2" },
  /* 보라 부츠 [2026-10-03] — 여아. 보라 끈 부츠(금색 밑창·달 무늬) + 흰 프릴 양말 두 짝, 사용자 원화 262×228. 달빛 마법사 옷과 짝.
     원화가 흰 불투명 배경이라 테두리에서 이어진 흰 영역만 지웠다(부츠 외곽선 안쪽의 흰 프릴은 그대로).
     들꽃 신발과 같은 방식 — 두 짝을 따로 잘라 원화 부츠목 가운데(왼짝 x57.5 · 오른짝 x55)를 다리 가운데(x455 · x556)에,
     배율 0.71, 밑창 아래끝 y944, 오른짝 +3(꼬마해적 신발과 같은 크기). 맨발 0px. 탑재 상자 (414,782,597,944). */
  { id: "shoes_purple", slot: "shoes", label: "달빛 부츠",   emoji: "🥾", price:DECOR_PRICE.common, rarity: "common", theme: "magic", forGender: "girl", img: "assets/avatar/shoes/purple-boots-girl.webp", thumb: "assets/avatar/thumb/shoes_purple.webp?v=2" },
  /* 보라 우주 부츠 [2026-10-03] — 여아. 보라 우주 부츠(흰 앞코·금 버클) 두 짝, 사용자 원화 268×198. 별빛 우주인 옷과 짝.
     남아 우주 부츠(shoes_astronaut)는 그대로 두고 여아용 id 를 따로 둔다(꼬마해적 신발과 같은 방식).
     들꽃 신발과 같은 방식 — 두 짝을 따로 잘라 원화 부츠목 가운데(왼짝 x62.5 · 오른짝 x52)를 다리 가운데(x455 · x556)에,
     배율 0.71, 밑창 아래끝 y944, 오른짝 +3(보라 부츠·꼬마해적 신발과 같은 크기). 맨발 0px. 탑재 상자 (411,803,596,944).
     [2026-10-03 사용자 확정] 우주 부츠는 옷 위로 보여야 한다 — z37 로 상의(z35) 위·목 장식(z40) 아래에 그린다.
     그래서 우주복을 입으면 부츠목이 바지 끝(y887)을 덮는다.
     [2026-10-03] 사용자 조정 — 두 짝 8% 크게(배율 0.7668, 밑창·부츠목 가운데 고정). 탑재 상자 (407,792,599,944). img ?v=2.
     [2026-10-03] 화면 왼쪽 짝만 왼쪽으로 5. 탑재 상자 (402,792,599,944). img ?v=3. */
  { id: "shoes_space_girl", slot: "shoes", label: "우주 부츠", emoji: "🥾", price:DECOR_PRICE.common, rarity: "common", theme: "space", forGender: "girl", z: 37, img: "assets/avatar/shoes/space-boots-girl.webp?v=3", thumb: "assets/avatar/thumb/shoes_space_girl.webp?v=2" },

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
  /* [버그 수정 2026-09-26] 산 상의를 '벗기' 하면 top 이 빈 채로 남아 **속옷 차림**이
     됐다. 하의는 여기서 기본 반바지로 되돌리는데 상의에는 같은 규칙이 없었다.
     "벗기로 속옷이 되는 길은 막혀 있다"는 건 기본 옷을 못 벗게 한 것뿐이었고,
     빈 슬롯을 다시 채우는 건 normalizeEquipped(=앱을 새로 켤 때)뿐이라
     벗은 그 자리에서는 앱을 껐다 켜기 전까지 속옷이 그대로 보였다.
     상의도 하의와 똑같이 기본 옷으로 되돌린다. (top 을 먼저 정해야 아래
     한 벌 옷 판단이 맞는다) */
  if (!next.top) next.top = STARTER_ID_BY_SLOT("top");        // 벗으면 기본 반팔티 복귀
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
  hat_astronaut:      { label: "우주 헬멧",   price: 350 },   // [2026-09-30] 사용자가 미리보기 보고 바로 빼 달라고 해서 뺐다 (그림은 남아 있다)
  top_sky:            { label: "하늘 나들이 옷", price: 350 },   // [2026-10-02] 사용자 요청으로 뺐다 — 산 아이에게 환불 (그림은 남아 있다)
  shoes_pirate:       { label: "해적 신발",   price: 200 },   // [2026-10-03] 남아 옛 해적 신발 — 꼬마해적 신발이 들어와 사용자 요청으로 뺐다, 산 아이에게 환불 (그림은 남아 있다)
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

/* [2026-10-02] 남아 옷 7벌의 상점 목록 그림(thumb)을 사용자가 따로 그린 아이콘 그림으로 바꿨다.
   입히는 그림(img)은 그대로다. 원본은 art-src/thumb-src-<id>.webp.
   여아 옷 8벌도 같은 날 같은 방식으로 바꿨다(공용 id 는 thumbGirl, 원본 thumb-src-<id>-girl.webp).
   [2026-10-03] 여아 신발 8켤레도 상점 목록 그림만 한 짝 옆모습 아이콘으로 바꿨다(원본 thumb-src-<id>.webp).
   [2026-10-04] 남아 신발 7켤레도 같은 방식으로 바꿨다.
   [2026-10-04] 여아 모자 8개도 상점 목록 그림만 모자 아이콘으로 바꿨다. */
/* ── 성별마다 다른 이름 ──────────────────────────────────────────────────
   남녀가 같은 id 를 쓰는데 그림이 다른 옷(사파리·우주복)은 여아 이름·이모지를
   labelGirl / emojiGirl 로 따로 둔다. 화면에 이름을 보일 때는 이 두 함수를 쓴다. */
export const itemLabel = (it, gender) => (it ? ((gender === "girl" && it.labelGirl) || it.label) : "");
export const itemEmoji = (it, gender) => (it ? ((gender === "girl" && it.emojiGirl) || it.emoji) : "");

/* ── 머리를 덮는 장비 ───────────────────────────────────────────────────
   모자처럼 얼굴째 덮는 그림은 베이스 '머리' 장을 안 그린다(hidesHead).
   같은 id라도 남녀 그림이 다를 수 있어서(예: 남아=사파리 모자 / 여아=머리띠)
   여아일 때만 다르게 두고 싶으면 hidesHeadGirl 을 붙인다. 없으면 hidesHead 그대로. */
export const itemHidesHead = (it, gender) =>
  (gender === "girl" && it && it.hidesHeadGirl !== undefined) ? !!it.hidesHeadGirl : !!(it && it.hidesHead);

/* ── 몸 그림을 바꾸는 장비 ───────────────────────────────────────────────
   옷 원화에 손까지 그려져 있으면 베이스 손과 두 쌍으로 겹친다. 그런 옷은 손을 뺀 몸 그림을
   bodyImg(남아) / bodyImgGirl(여아) 로 달아 두고, 입었을 때만 베이스 몸 대신 그걸 그린다. */
export const itemBodySrc = (it, gender) =>
  !it ? null : (gender === "girl" ? (it.bodyImgGirl || null) : (it.bodyImg || null));

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

/* [사용자 확정 2026-09-26] 기본 지급 옷(기본 반팔티·기본 반바지)은 **상점 목록에
   안 띄운다.** 처음부터 가지고 있고, 벗을 수도 없어서(starter) 상점에서 할 수 있는
   게 '입는 중' 확인뿐이었다 — 살 수 있는 옷 사이에 껴 있으면 자리만 차지한다.
   [중요] 취급은 하나도 안 바뀐다. 지급·자동 장착(getDefaultEquipped·
   normalizeEquipped)·벗기 금지(computeAvatarEquipToggle)는 카탈로그를 보지
   이 함수를 안 본다. 여기서 빼는 건 '상점 진열'뿐이다. */
export const isItemInShop = (it) => !it.starter;

/* 상점 탭 하나가 보여 줄 목록 — 탭이 여러 슬롯을 묶으면(옷 = 상의+하의) 적힌
   순서대로 이어 붙인다. */
/* ── 상점 진열 순서 (사용자 확정 2026-10-02) ─────────────────────────────
   남녀 공용 id(해적·우주·사파리)가 성별마다 다른 자리에 오므로 순서표를 따로 둔다.
   표에 없는 아이템은 기본 지급(starter)이면 맨 앞, 아니면 카탈로그 순서대로 맨 뒤. */
export const SHOP_ORDER = {
  boy:  ["top_vest", "top_hoodie_mint", "top_pirate", "top_board_boy", "top_acorn", "top_space", "top_beach_boy",
         /* [2026-10-04 사용자 확정] 신발도 짝이 되는 옷 순서대로 */
         "shoes_jungle", "shoes_fins", "shoes_pirate_kid", "shoes_lightning", "shoes_jungle_leaf", "shoes_astronaut", "shoes_sandal"],
  girl: ["top_vest", "top_picnic", "top_raincoat_girl", "top_delivery_girl", "top_bakery_girl", "top_space", "top_pirate", "top_magic",
         "shoes_wildflower", "shoes_strawberry", "shoes_rain", "shoes_blue", "shoes_pink", "shoes_space_girl", "shoes_pirate_girl", "shoes_purple"],
};
const shopRank = (it, gender) => {
  const i = (SHOP_ORDER[gender === "girl" ? "girl" : "boy"] || []).indexOf(it.id);
  return i >= 0 ? i : (it.starter ? -1 : 1e6);
};
export const getItemsByTab = (tabKey, gender) => {
  const tab = getShopTab(tabKey);
  if (!tab) return [];
  return tab.slots.flatMap(slotKey => getItemsBySlot(slotKey, gender)).filter(isItemInShop)
    .map((it, k) => ({ it, k }))
    .sort((a, b) => (shopRank(a.it, gender) - shopRank(b.it, gender)) || (a.k - b.k))
    .map(x => x.it);
};
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

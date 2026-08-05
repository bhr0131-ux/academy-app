/* ════════════════════════════════════════════════════════════════════════
   campLayout — 캠프 화면의 '확정된 숫자'만 모아 둔 곳
   ────────────────────────────────────────────────────────────────────────
   시안(CampPrototype)과 실제 화면(CampScene)이 같은 값을 쓰게 하려고 뺐다.
   시안에서 눈으로 정한 값이 여기 있고, 실제 화면은 이 값을 그대로 따른다 —
   따로 두면 시안에서 고친 것이 실제 화면에 반영되지 않아 둘이 어긋난다.

   숫자의 출처는 두 가지뿐이다.
     · 원화 픽셀 실측 (판 비율·텐트 안쪽 자리·글자 폭)
     · 사용자가 시안을 보고 고른 값 (크기·겹침·축소율)
   눈대중으로 넣은 값은 없다.
   ════════════════════════════════════════════════════════════════════════ */

/* 캠프 톤 — 텐트·그루터기·배경 원화에서 실측한 색 */
export const CAMP = {
  panel:   "#FBF0D8",   // 천막 패널
  panelB:  "#D9BE86",   // 패널 테두리
  ink:     "#4A3418",   // 글자
  inkSub:  "#8A6B3E",   // 보조 글자
  label:   "#587220",   // 이름표 초록
  labelInk:"#F4E9C8",   // 이름표 글자
  badge:   "#F4D7A1",   // 작은 명패
  wood:    "#8A5614",   // 나무
  woodD:   "#734309",   // 진한 나무
  grass:   "#AAB73C",   // 잔디
  grassD:  "#8FA932",   // 숲 초록
  dirt:    "#F0D488",   // 흙길
  sky:     "#4BBAFD",   // 하늘
  bar:     "#7FB335",   // 진행바
};

/* ── 스테이션 ──────────────────────────────────────────────────────────
   아이콘 칸 비율은 '여덟 원화 중 가장 세로로 긴 것보다 조금 더 세로로 길게'
   잡아야 한다. 여덟 장 모두 가장 넓은 가로줄이 그루터기이고 그 폭이 곧
   그림 폭이라(바닥에서 30~46% 높이), 칸 폭을 꽉 채우기만 하면 그루터기
   폭이 저절로 여덟 칸 똑같아진다. 칸이 그림보다 가로로 길면 contain이
   세로에 맞춰 그림을 줄여 그 칸만 그루터기가 가늘어진다.
   원화 실측 비율: 아이템 1.065 · 발견 도감 1.134 · 꾸미기 1.146 · 상장 1.169
                   보물창고 1.184 · 연속 달성 1.192 · 나의 펫 1.203 · 탐험 기록 1.230
   → 이보다 세로로 긴 원화가 새로 오면 이 숫자를 그 아래로 내려야 한다. */
export const ART_AR = 1.06;
/* [사용자 확정 2026-08-05] 아이콘은 칸 폭의 80%. 꽉 채우면 그루터기가
   화면을 눌러 배경 길이 거의 안 보였다. 판은 같이 줄이지 않는다 —
   판 크기는 글자에 맞춰 잡은 값이라 줄이면 글자가 작아진다. */
export const ICON_SCALE = 0.80;

export const NAME_AR  = 964 / 334;    // 초록 이름표 판 (원화 실측)
export const BADGE_AR = 842 / 210;    // 베이지 명패 판 (원화 실측)
export const NAME_W   = 0.72;         // 이름표 판 폭 (칸 폭 대비)
export const BADGE_W  = 0.62;         // 명패 판 폭 (칸 폭 대비)
export const NAME_OVER  = 0.30;       // 이름표가 아이콘과 겹치는 비율
export const BADGE_OVER = 0.34;       // 명패가 이름표와 겹치는 비율
export const NAME_INNER  = 270 / 334; // 판 안쪽(테두리 제외) 높이 비율
export const BADGE_INNER = 160 / 210;

/* ── 텐트 ──────────────────────────────────────────────────────────────
   원화 1198×1130(여백 제외). 글자를 얹을 자리는 원화 픽셀에서 물 채우기로
   찾았다 — 가운데에서 색을 번지게 하면 테두리 선에서 멈추고, 그 영역이
   곧 판 자리다. 값은 그림 폭·높이의 %. */
export const TENT_AR = 1198 / 1130;
export const TENT_PANEL = { l: 19.9, r: 79.5, t: 41.0, b: 85.0 };  // 천막 면
/* 깃발은 점선 테두리 안쪽을 쓴다 — 바깥 천 가장자리(52.3~75.5 / 3.7~18.4)까지
   채우면 글자가 점선을 넘어간다. */
export const TENT_FLAG = { l: 53.3, r: 74.5, t: 4.5, b: 17.6 };
export const PANEL_PAD = 4.5;         // 천막 면 테두리에서 글자를 띄우는 여백(면 폭의 %)

/* ── 화면 폭 기준 ──────────────────────────────────────────────────────
   시안은 폰 폭 390 · 탭 안쪽 360에서 정했다. 실제 화면은 폭이 다를 수 있어
   그때 잡은 값을 '안쪽 폭 대비 비율'로 바꿔 둔다. 그래야 넓은 폰에서도
   시안과 같은 모양이 된다. */
export const BASE_CONTENT_W = 360;
export const GAP_RATIO  = 52 / BASE_CONTENT_W;   // 두 칸 사이 가로 간격
export const TENT_RATIO = 320 / BASE_CONTENT_W;  // 텐트 폭
export const ROW_GAP    = 12;                    // 줄 사이 세로 간격(px 고정)

/* 안쪽 폭 하나로 캠프의 모든 크기를 뽑는다 */
export function campSizes(contentW) {
  const gap   = contentW * GAP_RATIO;
  const stW   = (contentW - gap) / 2;
  const iconW = stW * ICON_SCALE;
  const artH  = iconW / ART_AR;
  const nameW  = stW * NAME_W,  nameH  = nameW / NAME_AR;
  const badgeW = stW * BADGE_W, badgeH = badgeW / BADGE_AR;
  const tentW = contentW * TENT_RATIO;
  const tentH = tentW / TENT_AR;
  return {
    gap, stW, iconW, artH, nameW, nameH, badgeW, badgeH, tentW, tentH,
    nameF:  Math.round(nameH * NAME_INNER * 0.52),
    badgeF: Math.round(badgeH * BADGE_INNER * 0.62 * 10) / 10,
    panelW: tentW * (TENT_PANEL.r - TENT_PANEL.l) / 100,
    panelH: tentH * (TENT_PANEL.b - TENT_PANEL.t) / 100,
    panelPadPct: (TENT_PANEL.r - TENT_PANEL.l) * PANEL_PAD / 100,
    flagIW: tentW * (TENT_FLAG.r - TENT_FLAG.l) / 100 * 0.90,
    flagIH: tentH * (TENT_FLAG.b - TENT_FLAG.t) / 100 * 0.88,
  };
}

/* ── 글자 폭 ───────────────────────────────────────────────────────────
   브라우저에서 실측했다 (카페24 써라운드, letterSpacing -0.3px).
   '한글은 정사각형이니 1.0배'로 어림했더니 필요보다 20% 작게 나왔다. */
export const GLYPH_HANGUL = 0.95, GLYPH_SPACE = 0.30, LETTER_SPACING = 0.3;
export const textUnits = (s) =>
  [...s].reduce((a, c) => a + (c === " " ? GLYPH_SPACE : GLYPH_HANGUL), 0);
/* 폭 boxW 에 들어가는 가장 큰 글자 크기 */
export const fitByWidth = (s, boxW) => (boxW + LETTER_SPACING * s.length) / textUnits(s);

/* 깃발 이름 — 줄바꿈·글자 크기·이모지 크기를 같이 정한다.
   상장 이름은 3자('숙제왕')부터 10자('디저트 왕국의 주인')까지다.
   깃발 안쪽이 좁아(작게 기준 61×35px) 한 크기로 고정할 수 없다.
   한 줄에 시원하게 들어가면 이모지를 크게, 안 들어가면 이모지를 줄여
   이름 자리를 넓히고 띄어쓰기에서 두 줄로 접는다.
   이모지 비율 0.56은 눈으로 정했다 — 이모지 글리프는 지정한 크기보다 작게
   그려져서(16px로 주면 12px쯤으로 보인다) 0.46으로는 이름과 비슷해 보였다. */
export function fitFlag(name, boxW, boxH) {
  const plan = (emojiRatio) => {
    const em = Math.round(boxH * emojiRatio);
    const room = boxH - em * 1.06 - 1;
    const size = (lines) => Math.min(
      Math.min(...lines.map(s => fitByWidth(s.trim(), boxW))),
      (room / lines.length) * 0.86,
    );
    let best = { lines: [name], f: size([name]) };
    const sp = name.split(" ");
    for (let i = 1; i < sp.length; i++) {
      const two = [sp.slice(0, i).join(" "), sp.slice(i).join(" ")];
      const f = size(two);
      if (f > best.f) best = { lines: two, f };
    }
    return { em, ...best };
  };
  const big = plan(0.56);
  if (big.f >= 10) return { ...big, f: Math.round(big.f * 10) / 10 };
  const small = plan(0.36);
  const pick = small.f > big.f ? small : big;
  return { ...pick, f: Math.round(pick.f * 10) / 10 };
}

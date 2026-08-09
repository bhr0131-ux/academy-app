/* ════════════════════════════════════════════════════════════════════════
   gridLayout — 캐릭터 탭 '가방 + 격자' 배치 확정값
   ────────────────────────────────────────────────────────────────────────
   [사용자 시안 2026-08-06] 캠프 그림(배경+텐트+그루터기+명패)을 걷어내고,
   종이 위에 가방 카드 하나와 아이콘 2열 격자를 올리는 배치로 간다.

   시안 실측 (853×1844 스크린샷)
     가방 카드   x145~703  w559 = 화면폭 65.5% · 가로세로비 1.160
     아이콘 아트 w257~289  평균 275 = 화면폭 32.2%
     열 중심     좌 31.2% / 우 68.2%   (중심 간격 37.0%)
     아트↔라벨   19px = 화면폭 2.2%
     라벨 글자   대문자 높이 29px = 화면폭 3.4%

   앱은 '화면폭'이 아니라 탭 안쪽 폭(contentW)을 재서 쓴다. 시안의 화면폭
   853에는 좌우 바깥 여백이 포함돼 있으므로, 아래 비율은 실측값을
   contentW 기준으로 환산한 값이다 (환산 계수 = 853 / 시안 콘텐츠폭 786).

   아이콘 원화 규격 — 8종 모두 '정사각 한 장'으로 통일한다.
   그루터기·받침 없이 물건만, 투명 여백을 최소로 해서 캔버스를 꽉 채운다.
   앱은 정사각 칸에 objectFit:contain 으로 넣으므로 여덟 칸의 무게가 맞는다.
   ════════════════════════════════════════════════════════════════════════ */

/* 시안의 콘텐츠 폭 — 좌우 바깥 여백(가장 넓은 아이콘 x117~736)을 뺀 값 */
export const MOCK_SCREEN_W  = 853;
export const MOCK_CONTENT_W = 736 - 117;   // 619

/* 가방 카드 ─ 폭은 콘텐츠 폭 대비.
   [사용자 확정 2026-08-09] 세로는 그대로 두고 가로만 넓혔다 (283×244 → 359×245).
   좁을 때는 "👑 Lv.20 전설의 탐험가" 같은 긴 등급 이름이 두 줄로 접혔다. */
export const CARD_W_RATIO = 0.94;   // 시안 65.5% → 가로 확장판 (430폭에서 359px)
export const CARD_AR      = 1.465;  // 가로 / 세로 (원화 1260×860)

/* 격자 ─ 2열. 열 간격과 행 간격은 콘텐츠 폭 대비 */
export const COLS         = 2;
export const COL_GAP_R    = 0.045;
export const ROW_GAP_R    = 0.055;

/* 아이콘 ─ 칸 폭 대비. 정사각 칸이라 높이는 폭과 같다 */
export const ICON_W_RATIO = 0.76;   // 시안 아트 32.2%(화면폭) → 칸 폭 대비 환산

/* 라벨 ─ 아이콘 아래. 간격·글자크기 모두 콘텐츠 폭 대비 */
export const LABEL_GAP_R  = 0.022;
export const LABEL_F_R    = 0.050;
export const LABEL_F_MIN  = 12.5;
export const LABEL_F_MAX  = 18.5;

/* 카드 위/아래 여백 */
export const CARD_TOP_R    = 0.030;
export const CARD_BOTTOM_R = 0.075;

/* 카드 안쪽 종이면 — 받은 가방 원화 v2(1260×860)에서 실측한 값.
   밝은 크림색 픽셀이 이어지는 구간을 가로·세로 가운데 줄에서 찾았다
   (px 기준 x 124~1135 · y 206~746, 모서리 둥글기는 10px 남짓이라 무시해도 된다).
   가로가 넓어져 종이면이 카드 폭의 76.1% → 80.2% 가 됐다 — 글자가 그만큼 더 들어간다. */
export const CARD_PANEL = { l: 9.9, r: 90.0, t: 24.1, b: 86.7 };

/* 캐릭터 탭 종이 배경색 — 시안 실측 rgb(251,243,237).
   [사용자 확정 2026-08-08] 캐릭터 탭은 배경 그림 없이 이 색만 깐다. */
export const PAPER = "#FBF3ED";
export const INK = "#4E432A";
export const INK_SUB = "#8A7A5E";
export const BAR_FILL = "#8DBF3F";
export const BAR_TRACK = "rgba(74,52,24,0.14)";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* 탭 안쪽 폭 하나로 화면에 필요한 크기를 전부 뽑는다.
   폰 폭이 달라도 시안과 같은 비율이 되도록 전부 비례식으로 둔다. */
export function gridSizes(contentW) {
  const CW = contentW || 360;
  const colGap  = Math.round(CW * COL_GAP_R);
  const rowGap  = Math.round(CW * ROW_GAP_R);
  const cellW   = Math.floor((CW - colGap * (COLS - 1)) / COLS);
  const iconW   = Math.round(cellW * ICON_W_RATIO);
  const cardW   = Math.round(CW * CARD_W_RATIO);
  const cardH   = Math.round(cardW / CARD_AR);
  const labelF  = clamp(Math.round(CW * LABEL_F_R * 10) / 10, LABEL_F_MIN, LABEL_F_MAX);
  return {
    cw: CW, colGap, rowGap, cellW,
    iconW, iconH: iconW,                       // 정사각 칸
    cardW, cardH,
    labelGap: Math.round(CW * LABEL_GAP_R),
    labelF,
    cardTop:    Math.round(CW * CARD_TOP_R),
    cardBottom: Math.round(CW * CARD_BOTTOM_R),
    panelW: Math.round(cardW * (CARD_PANEL.r - CARD_PANEL.l) / 100),
    panelH: Math.round(cardH * (CARD_PANEL.b - CARD_PANEL.t) / 100),
  };
}

/* 배포 에셋 권장 크기 — [사용자 확정 2026-08-05] 표시 폭 × 3.5배 */
export const ASSET_SCALE = 3.5;
export const assetPx = (displayW) => Math.ceil(displayW * ASSET_SCALE / 10) * 10;

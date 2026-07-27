/* ════════════════════════════════════════════════════════════════════════
   mapWalkers — 모험 지도 위를 걷는 탐험가 캐릭터 (테마색 × 성별)
   ────────────────────────────────────────────────────────────────────────
   사용자 원화 10종(5테마 × 남/여). 지도에서 이모지 대신 이 그림을 쓴다.
   아이가 고른 테마색(CHILD_THEME_COLORS)에 맞춰 자동 선택하고,
   테마를 안 고른 아이는 성별 기본색(GENDER_THEME)이 가장 가까운 테마로 매칭된다.
   원본은 art-src/map-walkers/ 보관.
   ════════════════════════════════════════════════════════════════════════ */

// 테마키 ↔ CHILD_THEME_COLORS main 색
const WALKER_THEMES = [
  { key: "pink",    main: "#FF6FA3" },  // 분홍
  { key: "apricot", main: "#FFB66B" },  // 살구
  { key: "green",   main: "#7BE0A6" },  // 연두
  { key: "purple",  main: "#A78BFA" },  // 보라
  { key: "blue",    main: "#60A8FF" },  // 파랑
];

const rgb = (hex) => {
  const h = String(hex || "").replace("#", "");
  if (h.length !== 6) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

// 임의의 테마색 → 가장 가까운 탐험가 테마키 (성별 기본색도 자연스럽게 매칭됨:
// 남아 기본 #3B7ECD→파랑 / 여아 기본 #DE869C→분홍)
export const walkerThemeKey = (mainHex) => {
  const c = rgb(mainHex);
  if (!c) return "blue";
  let best = WALKER_THEMES[4], bd = Infinity;
  for (const t of WALKER_THEMES) {
    const p = rgb(t.main);
    const d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2;
    if (d < bd) { bd = d; best = t; }
  }
  return best.key;
};

// 지도용 걷는 캐릭터 이미지 경로
export const getMapWalker = (mainHex, gender) =>
  `assets/map-char/${walkerThemeKey(mainHex)}-${gender === "girl" ? "girl" : "boy"}.webp`;

/* DiscoveryMemo — 탐험일지 수첩 위에 붙인 '오늘의 발견' 메모지 (탐험 스킨 전용)
   [사용자 확정 2026-10-01] 크림색 종이 + 연두 마스킹테이프 한 장. 수첩에 장식이 많아서
   테두리는 긋지 않고 그림자와 살짝 거친 가장자리로만 종이처럼 보이게 한다.
   폭은 수첩보다 살짝 좁게, 높이는 두 줄. */

const FONT = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

/* 손으로 뜯은 듯한 가장자리 — 몇 px만 들쭉날쭉해서 눈에 띄지 않게 */
const TORN_EDGE = "polygon(0% 3px, 6% 0%, 14% 2px, 23% 0%, 34% 3px, 47% 1px, 58% 3px, 69% 0%, 81% 2px, 92% 0%, 100% 3px, " +
  "99.6% 30%, 100% 62%, 99.5% 100%, 90% calc(100% - 2px), 78% 100%, 66% calc(100% - 3px), 52% calc(100% - 1px), " +
  "40% 100%, 28% calc(100% - 3px), 15% calc(100% - 1px), 5% 100%, 0% calc(100% - 3px), 0.4% 60%, 0% 28%)";

export default function DiscoveryMemo({ found, emoji, text, count, onOpenBook }) {
  return (
    <div style={{ position: "relative", margin: "10px 10px 16px",
      filter: "drop-shadow(0 2px 3px rgba(110,84,50,0.16)) drop-shadow(0 6px 10px rgba(110,84,50,0.08))" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "15px 14px 13px 14px",
        clipPath: TORN_EDGE,
        background: "radial-gradient(120% 140% at 20% 0%, #FFFBEE 0%, #FBF3DD 55%, #F6EBCF 100%)," +
          "repeating-linear-gradient(8deg, rgba(160,130,80,0.035) 0 2px, transparent 2px 7px)",
        backgroundBlendMode: "multiply" }}>
        <span style={{ fontSize: 30, lineHeight: 1, flexShrink: 0, width: 38, textAlign: "center",
          opacity: found ? 1 : 0.85 }}>{found ? emoji : "🐾"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: FONT, fontSize: 11.5, fontWeight: 400, color: "#9C8A6E", letterSpacing: 0.3 }}>
            오늘의 발견
          </p>
          {/* 힌트가 길면 한 줄로는 잘린다 (사용자 지적) → 두 줄까지 접어서 보여 준다 */}
          <p style={{ margin: "3px 0 0", fontFamily: FONT, fontSize: 16.5, fontWeight: 400, lineHeight: 1.3,
            color: found ? "#4A3523" : "#5E4A36", wordBreak: "keep-all", overflow: "hidden",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {text}
          </p>
        </div>
        <button onClick={onOpenBook}
          style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3,
            padding: "6px 10px 6px 12px", borderRadius: 999, cursor: "pointer",
            background: "rgba(176,186,128,0.28)", border: "1.5px solid rgba(140,156,90,0.45)",
            color: "#5C5432", fontFamily: FONT, fontSize: 12.5, fontWeight: 400, whiteSpace: "nowrap" }}>
          도감 {count}개
          <span style={{ fontSize: 14, lineHeight: 1, marginTop: -1 }}>›</span>
        </button>
      </div>
      {/* 연두 마스킹테이프 — 메모 위쪽 가운데. 반투명이라 아래 종이가 살짝 비친다 */}
      <div aria-hidden style={{ position: "absolute", top: -7, left: "50%", width: 78, height: 18,
        transform: "translateX(-50%) rotate(-1.5deg)",
        background: "radial-gradient(circle, rgba(255,255,255,0.55) 1px, transparent 1.6px) 0 0 / 7px 7px," +
          "rgba(150,176,96,0.72)",
        clipPath: "polygon(2% 0, 98% 4%, 100% 30%, 97% 55%, 100% 100%, 3% 96%, 0 70%, 3% 45%, 0 15%)" }}/>
    </div>
  );
}

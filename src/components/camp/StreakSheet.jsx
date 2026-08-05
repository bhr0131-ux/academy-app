import { C } from "../../data/tokens.js";

/* ════════════════════════════════════════════════════════════════════════
   StreakSheet — 연속 달성 (캐릭터 탭에서 열리는 바텀시트)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-03] 캐릭터 탭을 캠프 장면으로 바꾸기로 하면서,
   제자리에서 펼쳐지던 아코디언을 시트로 옮긴다. 캠프는 고정된 그림이라
   그루터기가 제자리에서 펼쳐지면 장면이 두 동강 나기 때문이다.

   이 단계에서는 '담는 그릇'만 바꾼다 — 보여 주는 내용(현재·최고기록 두 칸)은
   아코디언에 있던 것을 그대로 옮겼다. 색도 그대로다(탐험 스킨=어두운 카드,
   베이커리 스킨=옅은 카드).

   props
     open, onClose
     dark   : 탐험 스킨이면 true (베이커리는 false)
     streak : 지금 며칠 연속
     best   : 최고 기록
     faint  : 베이커리 스킨에서 쓰는 옅은 배경색 (CT.faint)
     gold   : 베이커리 스킨 최고기록 숫자색 (GP.gold)
   ════════════════════════════════════════════════════════════════════════ */
export default function StreakSheet({ open, onClose, dark, streak = 0, best = 0, faint, gold }) {
  if (!open) return null;

  /* 아코디언에 있던 두 칸을 그대로 옮긴 것 — 값만 크게 보여 준다 */
  const box = (on) => on
    ? { background: `linear-gradient(135deg, #2E2740 0%, ${on === "now" ? "#5A3A2A" : "#5E4E28"} 100%)`,
        borderRadius: 16, padding: "18px 12px", textAlign: "center",
        border: `1px solid ${on === "now" ? "rgba(255,176,99,0.34)" : "rgba(255,216,107,0.34)"}`,
        boxShadow: `0 0 11px ${on === "now" ? "rgba(255,150,70,0.14)" : "rgba(255,216,107,0.15)"} inset, 0 4px 12px rgba(8,16,40,0.4)` }
    : { background: faint, borderRadius: 16, padding: "16px 12px", textAlign: "center", border: `1px solid ${C.border}` };

  const cards = [
    { k: "now",  label: "🔥 현재",   value: streak, labelColor: "rgba(255,205,160,0.9)", numColor: "#FFAE63", glow: "rgba(255,174,99,0.4)" },
    { k: "best", label: "🏆 최고기록", value: best,   labelColor: "rgba(255,228,160,0.9)", numColor: "#FFD86B", glow: "rgba(255,216,107,0.4)" },
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 4000,
      background: "rgba(20,16,32,0.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "88vh",
        overflow: "hidden", background: dark ? "#20293A" : "#fff", borderRadius: "24px 24px 0 0",
        display: "flex", flexDirection: "column", boxShadow: "0 -12px 40px rgba(0,0,0,0.3)" }}>

        {/* 머리 — 캐릭터 탭 카드와 같은 청회색이라 이어지는 느낌을 준다 */}
        <div style={{ padding: "16px 20px 14px",
          background: dark ? "linear-gradient(160deg, #82A8B5, #71939F)" : "linear-gradient(160deg,#FDE7EF,#F9C5D6)",
          color: dark ? "#fff" : "#6B4A5C", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>🔥 연속 달성</p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700,
                color: dark ? "rgba(255,255,255,0.85)" : "#8A6B7A" }}>
                매일 미션을 해내면 며칠 연속인지 쌓여요
              </p>
            </div>
            <button onClick={onClose} aria-label="닫기" style={{ border: "none", cursor: "pointer",
              background: dark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.6)",
              color: dark ? "#fff" : "#6B4A5C", borderRadius: 10, width: 30, height: 30,
              fontSize: 15, fontWeight: 900, flexShrink: 0 }}>✕</button>
          </div>
        </div>

        {/* 내용 */}
        <div style={{ padding: "18px 18px 26px", overflowY: "auto", background: dark ? "#20293A" : "#fff" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {cards.map(c => (
              <div key={c.k} style={box(dark ? c.k : null)}>
                <p style={{ fontSize: 12.5, fontWeight: 800, margin: "0 0 6px",
                  color: dark ? c.labelColor : C.sub }}>{c.label}</p>
                <p style={{ fontSize: dark ? 34 : 28, fontWeight: 900, margin: 0, lineHeight: 1,
                  color: dark ? c.numColor : (c.k === "best" ? gold : C.text),
                  textShadow: dark ? `0 0 12px ${c.glow}` : "none" }}>
                  {c.value}<span style={{ fontSize: 15, marginLeft: 3 }}>일</span>
                </p>
              </div>
            ))}
          </div>
          <p style={{ margin: "16px 2px 0", fontSize: 12.5, fontWeight: 700, lineHeight: 1.6,
            color: dark ? "rgba(255,255,255,0.7)" : C.sub }}>
            하루라도 미션을 다 못 하면 현재 기록은 0일로 돌아가요. 최고기록은 그대로 남아요.
          </p>
        </div>
      </div>
    </div>
  );
}

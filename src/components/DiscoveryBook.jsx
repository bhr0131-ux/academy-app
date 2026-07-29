import { DISCOVERY_RARITY, DISCOVERY_TOTAL, getCollection, getDiscoveryLog, getDiscovery } from "../data/discoveries.js";

/* ════════════════════════════════════════════════════════════════════════
   DiscoveryBook — 발견 도감 (탐험일지 맨 아래 버튼으로 연다)
   ────────────────────────────────────────────────────────────────────────
   빈 슬롯을 먼저 보여 주고 하나씩 채워 나가는 방식 (사용자 확정).
   아직 못 찾은 칸은 물음표로 남겨 둬야 '뭐가 더 있지?'가 생긴다.

   아래쪽엔 날짜별 기록을 최근 순으로 쌓는다 — 발견은 아이템이 아니라
   '추억'이라, 몇 달 뒤에 다시 보는 게 이 화면의 진짜 목적이다.

   props
     open, onClose
     data    : v6_discoveries 원본
     childId : 현재 아이
     childName : 표시용 이름
   ════════════════════════════════════════════════════════════════════════ */
export default function DiscoveryBook({ open, onClose, data, childId, childName = "" }) {
  if (!open) return null;

  const list = getCollection(data, childId);
  const found = list.filter(d => d.found).length;
  const log = [...getDiscoveryLog(data, childId)].reverse();   // 최근 날짜가 위로

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 4000,
        background: "rgba(20,16,32,0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 14,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460, maxHeight: "92vh", overflow: "hidden",
          background: "#FBF4E4", borderRadius: 26, display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)", border: "2px solid #D9C08C",
        }}
      >
        {/* 헤더 */}
        <div style={{ padding: "16px 20px", background: "linear-gradient(135deg,#8A6B47,#B08A5B)", color: "#fff" }}>
          <p style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>📖 발견 도감</p>
          <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 700, opacity: 0.92 }}>
            {childName ? `${childName}이(가) ` : ""}지금까지 <b>{found}</b> / {DISCOVERY_TOTAL} 가지를 발견했어요
          </p>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "14px 16px 4px" }}>
          {/* 슬롯 — 못 찾은 칸도 자리를 보여 준다 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 9 }}>
            {list.map((d) => {
              const rc = DISCOVERY_RARITY[d.rarity] || DISCOVERY_RARITY.common;
              return (
                <div key={d.id} style={{
                  borderRadius: 14, padding: "9px 4px 7px", textAlign: "center",
                  background: d.found ? "#fff" : "rgba(138,107,71,0.07)",
                  border: d.found ? `2px solid ${rc.color}55` : "1.5px dashed rgba(138,107,71,0.35)",
                }}>
                  <div style={{ fontSize: 26, lineHeight: 1.2, filter: d.found ? "none" : "grayscale(1)", opacity: d.found ? 1 : 0.35 }}>
                    {d.found ? d.emoji : "❔"}
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 10, fontWeight: 800, color: d.found ? "#5A4430" : "#A2917C" }}>
                    {d.found ? d.name : "???"}
                  </p>
                  {d.count > 1 && (
                    <p style={{ margin: "1px 0 0", fontSize: 9, fontWeight: 800, color: rc.color }}>×{d.count}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* 발견 기록 — 날짜별 '추억' */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 2px 10px" }}>
            <div style={{ flex: 1, height: 2, borderRadius: 2, background: "rgba(138,107,71,0.25)" }} />
            <span style={{ fontSize: 12.5, fontWeight: 900, color: "#8A6B47" }}>🗓️ 발견 기록</span>
            <div style={{ flex: 1, height: 2, borderRadius: 2, background: "rgba(138,107,71,0.25)" }} />
          </div>

          {log.length === 0 ? (
            <p style={{ textAlign: "center", color: "#A2917C", fontSize: 12.5, fontWeight: 700, padding: "18px 0 24px" }}>
              아직 발견한 게 없어요.<br />오늘 미션을 다 끝내면 무언가 발견할 수 있어요!
            </p>
          ) : (
            <div style={{ paddingBottom: 10 }}>
              {log.map((e, i) => {
                const d = getDiscovery(e.id);
                if (!d) return null;
                const rc = DISCOVERY_RARITY[d.rarity] || DISCOVERY_RARITY.common;
                return (
                  <div key={`${e.d}-${i}`} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 10px", marginBottom: 6, borderRadius: 12,
                    background: "#fff", border: `1px solid ${rc.color}33`,
                  }}>
                    <span style={{ fontSize: 20 }}>{d.emoji}</span>
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 800, color: "#5A4430" }}>{d.name}</span>
                    {d.rarity !== "common" && (
                      <span style={{ fontSize: 9.5, fontWeight: 900, color: rc.color }}>{rc.label}</span>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#A2917C" }}>{e.d.replace(/-/g, ".")}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: "10px 16px 16px", borderTop: "1px solid rgba(138,107,71,0.25)" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", border: "none", borderRadius: 14, padding: "13px 0",
              fontWeight: 900, fontSize: 15, cursor: "pointer",
              background: "rgba(138,107,71,0.12)", color: "#6B523A",
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

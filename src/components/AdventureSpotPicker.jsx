/* ════════════════════════════════════════════════════════════════════════
   AdventureSpotPicker — 모험일지 위 '탐험장소' 선택 줄
   ────────────────────────────────────────────────────────────────────────
   시간순 학원을 지도와 같은 건물 아이콘(이모지 구멍 포함)으로 나열하고
   화살표(→)로 잇는다. 누르면 해당 학원이 아래 모험일지 카드에 표시된다.
   건물 배정은 AdventureMap의 journalBuildings 재사용 → 지도와 항상 일치.

   props
     items      : [{id,name,icon}]  시간순 학원 (icon=학원 이모지)
     selectedId : string            현재 모험일지에 표시 중인 학원
     onSelect   : (id)=>void
   ════════════════════════════════════════════════════════════════════════ */
import { journalBuildings } from "./AdventureMap.jsx";

export default function AdventureSpotPicker({ items = [], selectedId, onSelect }) {
  const blds = journalBuildings(items.length);
  return (
    <div>
      {/* 섹션 구분 — 탐험장소 (모험지도·모험일지 구분선과 동일 디자인·갈색톤) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "2px 2px 12px" }}>
        <div style={{ flex: 1, height: 2, borderRadius: 2, background: "linear-gradient(90deg, rgba(138,107,71,0) 10%, rgba(138,107,71,0.4))" }} />
        <span style={{ flexShrink: 0, fontSize: 13.5, fontWeight: 900, letterSpacing: 0.4, color: "#8A6B47" }}>🧭 탐험장소</span>
        <div style={{ flex: 1, height: 2, borderRadius: 2, background: "linear-gradient(90deg, rgba(138,107,71,0.4), rgba(138,107,71,0) 90%)" }} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
        {items.map((it, i) => {
          const B = blds[i] || {};
          const on = it.id === selectedId;
          return (
            <div key={it.id} style={{ display: "flex", alignItems: "center" }}>
              {i > 0 && <span style={{ fontSize: 15, fontWeight: 900, color: "#B08D5F", margin: "0 2px 24px" }}>→</span>}
              <button onClick={() => onSelect && onSelect(it.id)} className="jelly-tap"
                style={{ background: "none", border: "none", padding: "4px 5px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{ position: "relative", display: "block", width: 62, transition: "all .18s",
                  filter: on ? "drop-shadow(0 0 6px rgba(212,160,60,0.9)) drop-shadow(0 3px 5px rgba(93,70,51,0.3))" : "drop-shadow(0 2px 4px rgba(93,70,51,0.25))",
                  opacity: on ? 1 : 0.8, transform: on ? "scale(1.08)" : "none" }}>
                  {B.src && <>
                    <span style={{ position: "absolute", left: `${B.cx}%`, top: `${B.cy}%`, width: `${(B.d || 38) + 5}%`, aspectRatio: "1/1",
                      transform: "translate(-50%,-50%)", borderRadius: "50%", background: "#FFF9EC",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, lineHeight: 1, zIndex: 0 }}>{it.icon}</span>
                    <img src={B.src} alt="" draggable={false} style={{ position: "relative", zIndex: 1, width: "100%", height: "auto", display: "block" }} />
                  </>}
                </span>
                <span style={{ fontSize: 11, fontWeight: on ? 900 : 700, color: on ? "#5D4633" : "#8A7458",
                  maxWidth: 76, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

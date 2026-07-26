/* ════════════════════════════════════════════════════════════════════════
   AdventureSpotPicker — 모험일지 위 '모험장소' 선택 줄 (= 오늘의 진행 경로)
   ────────────────────────────────────────────────────────────────────────
   위 지도와 같은 건물 그림을 쓰지만 시각 위계를 뒤집는다 (사용자 확정).
     · 지도   : 건물 > 정보   — 실제 장소를 지도에서 찾는 곳
     · 여기   : 무슨 학원인지 > 건물 — 이모지가 주인공, 건물은 은은한 배경
   그래서 건물은 작고 채도를 낮추고, 학원 이모지는 구멍 원보다 크게(120%)
   얹어 '스티커를 붙인' 느낌을 낸다. 발자국은 진하고 크게 — 아이가 글자를
   읽기 전에 🎹 → 🔢 → 📖 순서를 먼저 인식하게 하는 것이 이 줄의 핵심.

   상태별 표현
     지나온 학원 : 건물 채도 확 낮춤 + ✓ 배지 (오늘 어디까지 왔는지)
     현재 학원   : 정상 채도 + 반짝임
     남은 학원   : 살짝 낮춘 채도 (건물은 배경 역할)

   props
     items      : [{id,name,icon,passed,current}]  시간순 학원
     selectedId : string   현재 모험일지에 표시 중인 학원
     onSelect   : (id)=>void
   ════════════════════════════════════════════════════════════════════════ */
import { journalBuildings } from "./AdventureMap.jsx";

const BW = 48;   // 건물 표시 폭 px (사용자 조정: 62 → 48, 약 23% 축소)

export default function AdventureSpotPicker({ items = [], selectedId, onSelect }) {
  const blds = journalBuildings(items.length);
  return (
    <div>
      <style>{`
        @keyframes spNow{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
      `}</style>
      {/* 섹션 구분 — 모험장소 (모험지도·모험일지 구분선과 동일 디자인·갈색톤) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "2px 2px 12px" }}>
        <div style={{ flex: 1, height: 2, borderRadius: 2, background: "linear-gradient(90deg, rgba(138,107,71,0) 10%, rgba(138,107,71,0.4))" }} />
        <span style={{ flexShrink: 0, fontSize: 13.5, fontWeight: 900, letterSpacing: 0.4, color: "#8A6B47" }}>🧭 모험장소</span>
        <div style={{ flex: 1, height: 2, borderRadius: 2, background: "linear-gradient(90deg, rgba(138,107,71,0.4), rgba(138,107,71,0) 90%)" }} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: 2, flexWrap: "wrap", marginBottom: 4 }}>
        {items.map((it, i) => {
          const B = blds[i] || {};
          const on = it.id === selectedId;
          const holeD = BW * ((B.d || 38) + 5) / 100;          // 구멍(크림 원판) 지름 px
          const emSize = Math.round(holeD * 1.2);              // 이모지는 원 지름의 120% — 살짝 넘치게(스티커 느낌)
          // 건물은 배경 역할: 남은 학원도 채도를 살짝 낮추고, 지나온 학원은 확 낮춘다
          const bldFx = it.passed ? "saturate(0.35) brightness(1.06) contrast(0.88)" : "saturate(0.75)";
          return (
            <div key={it.id} style={{ display: "flex", alignItems: "center" }}>
              {/* 건물 사이 연결 — 지도와 같은 발자국 트레일. 이 줄에선 '경로'가 핵심이라 진하고 크게 */}
              {i > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: 5, margin: "0 2px 8px" }}>
                  {[0, 1, 2].map(k => (
                    <span key={k} style={{ display: "inline-block", transform: `translateY(${k % 2 ? 3 : -3}px) rotate(90deg)`, opacity: 0.75 }}>
                      <span style={{ display: "block", width: 4.8, height: 8, borderRadius: "50%", background: "#7E4E20" }} />
                      <span style={{ display: "block", width: 2.9, height: 2.9, borderRadius: "50%", background: "#7E4E20", margin: "1px auto 0" }} />
                    </span>
                  ))}
                </span>
              )}
              <button onClick={() => onSelect && onSelect(it.id)} className="jelly-tap"
                style={{ background: "none", border: "none", padding: "4px 5px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <span style={{ position: "relative", display: "block", width: BW, transition: "all .18s",
                  filter: on ? "drop-shadow(0 0 6px rgba(212,160,60,0.9)) drop-shadow(0 3px 5px rgba(93,70,51,0.3))" : "drop-shadow(0 2px 4px rgba(93,70,51,0.25))",
                  transform: on ? "scale(1.08)" : "none" }}>
                  {B.src && <>
                    {/* 구멍 뒤 크림 원판 — 이모지 받침 */}
                    <span style={{ position: "absolute", left: `${B.cx}%`, top: `${B.cy}%`, width: `${(B.d || 38) + 5}%`, aspectRatio: "1/1",
                      transform: "translate(-50%,-50%)", borderRadius: "50%", background: "#FFF9EC", zIndex: 0 }} />
                    <img src={B.src} alt="" draggable={false}
                      style={{ position: "relative", zIndex: 1, width: "100%", height: "auto", display: "block", filter: bldFx, transition: "filter .3s ease" }} />
                    {/* 학원 이모지 — 건물 '위'에 크게 얹어 스티커처럼 (이 줄의 주인공) */}
                    <span style={{ position: "absolute", left: `${B.cx}%`, top: `${B.cy}%`, transform: "translate(-50%,-50%)",
                      fontSize: emSize, lineHeight: 1, zIndex: 2, pointerEvents: "none",
                      filter: "drop-shadow(0 1px 2px rgba(93,70,51,0.35))" }}>{it.icon}</span>
                    {/* 지나온 학원 ✓ 배지 / 현재 학원 반짝임 */}
                    {it.passed && (
                      <span style={{ position: "absolute", right: -2, top: -2, zIndex: 3, width: 15, height: 15, borderRadius: "50%",
                        background: "#7FA35A", color: "#fff", fontSize: 9.5, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1.5px solid #FFF9EC" }}>✓</span>
                    )}
                    {it.current && !it.passed && <>
                      <span style={{ position: "absolute", left: -6, top: -4, fontSize: 12, zIndex: 3, animation: "spNow 2.4s ease-in-out infinite" }}>✨</span>
                      <span style={{ position: "absolute", right: -4, top: "24%", fontSize: 9, zIndex: 3, animation: "spNow 2.4s ease-in-out infinite -1.1s" }}>✨</span>
                    </>}
                  </>}
                </span>
                <span style={{ fontSize: 11, fontWeight: on ? 900 : 700, color: on ? "#5D4633" : (it.passed ? "#9A8B76" : "#8A7458"),
                  maxWidth: 76, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

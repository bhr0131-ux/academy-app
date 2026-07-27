/* ════════════════════════════════════════════════════════════════════════
   AdventureSpotPicker — 탐험일지 위 '탐험장소' 선택 줄 (= 오늘의 진행 경로)
   ────────────────────────────────────────────────────────────────────────
   위 지도와 시각 위계를 뒤집는다 (사용자 확정).
     · 지도   : 건물 그림이 주인공 — 실제 장소를 지도에서 찾는 곳
     · 여기   : 무슨 학원인지가 주인공 — 건물 그림을 빼고 학원 이모지만
   이모지를 크림색 원판에 얹어 '스탬프'처럼 찍은 모양으로 만든다. 건물 그림이
   빠진 만큼 칸이 작아져 한 줄에 더 많이 들어가고, 아이는 글자를 읽기 전에
   🎹 → 🔢 → 📖 순서를 먼저 인식하게 된다 (이 줄의 핵심).

   진행 상태는 '원판 테두리 색'으로만 표현 — 배지를 얹지 않아 깔끔하다.
     지나온 학원 : 초록 테두리 + 원판·이모지 톤다운 (오늘 어디까지 왔는지)
     현재 학원   : 골드 테두리 + 반짝임
     남은 학원   : 연갈색 테두리
     선택된 학원 : 골드 외곽 링 + 살짝 확대

   props
     items      : [{id,name,icon,passed,current}]  시간순 학원
     selectedId : string   현재 탐험일지에 표시 중인 학원
     onSelect   : (id)=>void
   ════════════════════════════════════════════════════════════════════════ */
import { Fragment } from "react";

const D = 38;           // 스탬프 원판 지름 px
const EM = 21;          // 학원 이모지 크기 px
const PER_ROW = 6;      // 한 줄에 넣을 학원 수 (건물 그림 제거로 5→6곳)
const CELL = 46;        // 학원 한 칸 폭 px (고정)
// 발자국 연결 구간은 '남는 폭을 나눠 갖는' 신축 구간 —
// 학원이 적은 날은 넓게 벌어지고(최대 44px), 6곳이 꽉 차면 최소 14px까지 좁아진다.
const FP_MIN = 20, FP_MAX = 52;  // 발자국 3개가 들어가도록 최소·최대 확대

export default function AdventureSpotPicker({ items = [], selectedId, onSelect }) {
  return (
    <div>
      <style>{`
        @keyframes spNow{0%,100%{opacity:.35;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}
      `}</style>
      {/* 섹션 구분 — 탐험장소 (탐험지도·탐험일지 구분선과 동일 디자인·갈색톤) */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "2px 2px 12px" }}>
        <div style={{ flex: 1, height: 2, borderRadius: 2, background: "linear-gradient(90deg, rgba(138,107,71,0) 10%, rgba(138,107,71,0.4))" }} />
        <span style={{ flexShrink: 0, fontSize: 13.5, fontWeight: 900, letterSpacing: 0.4, color: "#8A6B47" }}>🧭 탐험장소</span>
        <div style={{ flex: 1, height: 2, borderRadius: 2, background: "linear-gradient(90deg, rgba(138,107,71,0.4), rgba(138,107,71,0) 90%)" }} />
      </div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", flexWrap: "wrap", rowGap: 16, width: "100%", marginBottom: 16 }}>
        {items.map((it, i) => {
          const on = it.id === selectedId;
          const rowStart = i % PER_ROW === 0;
          // 진행 상태 = 테두리 색 (별도 배지 없이 색으로만 구분)
          const ring = it.passed ? "#7FA35A" : it.current ? "#D9A441" : "rgba(155,114,74,0.38)";
          return (
            <Fragment key={it.id}>
              {/* 칸 사이 연결 — 지도와 같은 발자국 트레일 (경로 느낌). 남는 폭만큼 늘어난다 */}
              {!rowStart && (
                <span style={{ flex: `1 1 ${FP_MIN}px`, minWidth: FP_MIN, maxWidth: FP_MAX, height: D, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                  {[0, 1, 2].map(k => (
                    <span key={k} style={{ display: "inline-block", transform: `translateY(${k % 2 ? 3 : -3}px) rotate(90deg)`, opacity: 0.75 }}>
                      <span style={{ display: "block", width: 4.4, height: 7.4, borderRadius: "50%", background: "#7E4E20" }} />
                      <span style={{ display: "block", width: 2.7, height: 2.7, borderRadius: "50%", background: "#7E4E20", margin: "1px auto 0" }} />
                    </span>
                  ))}
                </span>
              )}
              <button onClick={() => onSelect && onSelect(it.id)} className="jelly-tap"
                style={{ background: "none", border: "none", padding: 0, cursor: "pointer", width: CELL, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                {/* 스탬프 — 크림 원판 + 학원 이모지. 테두리 색이 곧 진행 상태 */}
                <span style={{ position: "relative", width: D, height: D, borderRadius: "50%",
                  background: it.passed ? "#F2EEE2" : "#FFF9EC",
                  border: `2.5px solid ${ring}`, boxSizing: "border-box",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all .18s",
                  transform: on ? "scale(1.08)" : "none",
                  boxShadow: on
                    ? "0 0 0 3px rgba(212,160,60,0.30), 0 3px 7px rgba(93,70,51,0.28)"
                    : "0 2px 5px rgba(93,70,51,0.18)" }}>
                  <span style={{ fontSize: EM, lineHeight: 1,
                    opacity: it.passed ? 0.82 : 1,
                    filter: it.passed ? "saturate(0.55)" : "none" }}>{it.icon}</span>
                  {/* 현재 학원 반짝임 */}
                  {it.current && !it.passed && <>
                    <span style={{ position: "absolute", left: -7, top: -6, fontSize: 12, animation: "spNow 2.4s ease-in-out infinite" }}>✨</span>
                    <span style={{ position: "absolute", right: -6, bottom: -3, fontSize: 9, animation: "spNow 2.4s ease-in-out infinite -1.1s" }}>✨</span>
                  </>}
                </span>
                <span style={{ fontSize: 10.5, lineHeight: 1.2, fontWeight: on ? 900 : 700,
                  color: on ? "#5D4633" : (it.passed ? "#9A8B76" : "#8A7458"),
                  width: "100%", textAlign: "center", wordBreak: "keep-all",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{it.name}</span>
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

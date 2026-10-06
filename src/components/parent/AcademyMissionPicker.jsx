/* ════════════════════════════════════════════════════════════════════════
   AcademyMissionPicker — '학원별 미션 추가'를 누르면 뜨는 학원 고르기 시트 (엄마용 미션탭)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-10-06] 미션 추가·관리 상자에 학원이 줄줄이 펼쳐져 복잡했다 →
   상자는 '반복 미션 / 학원별 미션 / 생활 미션' 세 줄로 줄이고, 학원은 여기서 고른다.
   고르기만 한다 — 고른 학원의 미션 수정 팝업은 부모(App)가 연다.

   props
     academies : [{ id, name, color, count }]   count = 그날 등록된 미션 수
     onPick    : (ac) => void
     onClose   : () => void
     tone      : { main, text, sub, border, faint }
   ════════════════════════════════════════════════════════════════════════ */

import { RAD, FW, FS } from "../../data/tokens.js";

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

export default function AcademyMissionPicker({ academies = [], onPick, onClose, tone }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,20,40,0.55)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "22px 22px 0 0",
        padding: "10px 18px calc(26px + env(safe-area-inset-bottom))", width: "100%", maxWidth: 430,
        boxSizing: "border-box", maxHeight: "74vh", overflowY: "auto", fontFamily: F }}>
        <div aria-hidden="true" style={{ width: 38, height: 4, borderRadius: RAD.pill,
          background: tone.border, margin: "0 auto 12px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: FS.modalTitle, fontWeight: FW.bold, color: tone.text }}>학원별 미션 추가</h3>
          <button onClick={onClose} aria-label="닫기" className="jelly-tap"
            style={{ background: tone.faint + "88", border: "none", borderRadius: RAD.sm, width: 28, height: 28,
              cursor: "pointer", color: tone.sub, fontSize: 15, fontFamily: F }}>✕</button>
        </div>
        <p style={{ fontSize: FS.sub, color: tone.sub, fontWeight: FW.normal, margin: "0 0 8px", lineHeight: 1.45 }}>
          미션을 추가할 곳을 골라 주세요.
        </p>
        {academies.length === 0 ? (
          <p style={{ textAlign: "center", color: tone.sub, fontSize: 13, padding: "18px 0 6px", margin: 0 }}>등록된 학원이 없어요</p>
        ) : academies.map((ac, i) => (
          <button key={ac.id} onClick={() => onPick(ac)} className="jelly-tap"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 2px", width: "100%",
              border: "none", borderTop: i ? `1px solid ${tone.border}` : "none", background: "transparent",
              cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: ac.color, flexShrink: 0 }} />
            <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ minWidth: 0, fontSize: FS.cardTitle, fontWeight: FW.bold, color: tone.text,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ac.name}</span>
              <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: tone.sub }}>({ac.count})</span>
            </span>
            <span aria-hidden="true" style={{ flexShrink: 0, fontSize: 15, color: "#B9B3AD", fontWeight: 900, lineHeight: 1 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

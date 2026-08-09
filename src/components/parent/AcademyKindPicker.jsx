import { useEffect, useRef, useState } from "react";
import { ACADEMY_KINDS, ACADEMY_KIND_CUSTOM } from "../../data/gameData.jsx";

/* ════════════════════════════════════════════════════════════════════════
   AcademyKindPicker — 학원 '종류' 고르기 (검색 + 직접 입력)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-09] 예전엔 학원 이름만 받아서 그 안의 낱말로 아이콘을
   추측했다 — "청담어학원"처럼 과목 낱말이 없으면 아이콘이 안 붙었다.
   이제 종류를 골라 두면 아이콘·던전 이름이 그 종류에서 바로 나온다.

   종류가 서른 개가 넘어 목록만 늘어놓으면 못 찾는다 → 검색칸을 위에 두고,
   목록에 없으면 '직접 입력'으로 적는다.

   여기는 '고르기'만 한다 — 고른 값을 어디에 어떻게 저장할지는 부모 화면이 정한다.

   props
     open      : 열림 여부
     value     : 지금 고른 종류 key ("" 이면 없음)
     customLabel : 직접 입력으로 적어 둔 이름 (value === "custom" 일 때)
     onPick    : (key, label) => void   목록에서 고르거나 직접 입력을 확정했을 때
     onClose   : () => void
     accent    : 테마색
   ════════════════════════════════════════════════════════════════════════ */

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

export default function AcademyKindPicker({ open, value = "", customLabel = "", onPick, onClose, accent = "#F58BB0" }) {
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState("");
  const boxRef = useRef(null);

  // 열 때마다 검색어를 비우고, 직접 입력칸은 이미 적어 둔 값으로 되돌린다
  useEffect(() => {
    if (!open) return;
    setQ("");
    setCustom(value === ACADEMY_KIND_CUSTOM ? customLabel : "");
    if (boxRef.current) boxRef.current.scrollTop = 0;
  }, [open, value, customLabel]);

  if (!open) return null;

  const key = q.trim().toLowerCase();
  const list = key
    ? ACADEMY_KINDS.filter(k => k.label.toLowerCase().includes(key) || (k.kw || "").toLowerCase().includes(key))
    : ACADEMY_KINDS;

  const inp = {
    width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 13,
    border: "1.5px solid #E7E0DA", fontSize: 15, fontWeight: 700, outline: "none", fontFamily: F,
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 260,
      background: "rgba(20,16,14,0.45)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 430, background: "#fff",
        borderRadius: "22px 22px 0 0", height: "78vh", display: "flex", flexDirection: "column",
        boxSizing: "border-box", fontFamily: F, boxShadow: "0 -10px 40px rgba(0,0,0,0.28)" }}>

        <div style={{ padding: "20px 18px 12px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#2E2A26" }}>학원 종류 고르기</h3>
            <button onClick={onClose} aria-label="닫기"
              style={{ background: "#F5F1ED", border: "none", borderRadius: 10, width: 30, height: 30,
                cursor: "pointer", color: "#8A8078", fontSize: 15, fontFamily: F }}>✕</button>
          </div>
          <input value={q} onChange={e => setQ(e.target.value)} autoFocus
            placeholder="검색 (예: 피아노, 영어, 태권도)" style={inp} />
        </div>

        <div ref={boxRef} style={{ flex: 1, overflowY: "auto", padding: "0 18px", WebkitOverflowScrolling: "touch" }}>
          {list.map(k => {
            const on = value === k.key;
            return (
              <button key={k.key} onClick={() => onPick(k.key, k.label)} className="nav-menu-tap"
                style={{ width: "100%", border: "none", background: "none", cursor: "pointer",
                  padding: "13px 4px", display: "flex", alignItems: "center", gap: 11, fontFamily: F,
                  borderBottom: "1px solid rgba(90,70,60,0.07)", textAlign: "left" }}>
                <span style={{ fontSize: 21, width: 26, flexShrink: 0, textAlign: "center" }}>{k.icon}</span>
                <span style={{ flex: 1, fontSize: 15.5, fontWeight: on ? 900 : 700, color: on ? accent : "#3E3832" }}>
                  {k.label}
                </span>
                {on && <span style={{ fontSize: 14, fontWeight: 900, color: accent }}>●</span>}
              </button>
            );
          })}
          {list.length === 0 && (
            <p style={{ textAlign: "center", color: "#9A9086", fontSize: 14, fontWeight: 700, padding: "26px 0 10px" }}>
              찾는 종류가 없어요. 아래에 직접 적어 주세요.
            </p>
          )}

          {/* 직접 입력 — 목록에 없는 종류 */}
          <div style={{ margin: "16px 0 24px", padding: "14px", borderRadius: 15,
            background: "#FBF7F3", border: "1.5px dashed #E0D6CC" }}>
            <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 900, color: "#6E645C" }}>✏️ 직접 입력</p>
            <input value={custom} onChange={e => setCustom(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && custom.trim()) onPick(ACADEMY_KIND_CUSTOM, custom.trim()); }}
              placeholder="예: 뮤지컬" style={{ ...inp, background: "#fff", marginBottom: 9 }} />
            <button onClick={() => custom.trim() && onPick(ACADEMY_KIND_CUSTOM, custom.trim())}
              disabled={!custom.trim()}
              style={{ width: "100%", border: "none", borderRadius: 12, padding: "12px",
                background: custom.trim() ? accent : "#EDE7E1", color: custom.trim() ? "#fff" : "#B4ABA3",
                fontSize: 14.5, fontWeight: 900, cursor: custom.trim() ? "pointer" : "default", fontFamily: F }}>
              이 종류로 하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

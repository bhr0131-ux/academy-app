/* ════════════════════════════════════════════════════════════════════════
   CalendarMarks — 달력 칸에 찍는 표시와 그 설명(범례) 시트
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-09] 예전엔 칸마다 🚌 🎒 📝 이모지가 줄줄이 붙어서,
   정작 중요한 결석·보충·방학이 평범한 셔틀 일정에 묻혔다. 규칙을 바꾼다.

     · 달력에는 '평소와 다른 일'만 찍는다. 매일 반복되는 학원·셔틀은 안 찍는다
       (반복 일정은 주간 보기와 아래 상세 카드에서 본다).
     · 이모지 대신 색+모양 도형을 쓴다. 기기마다 모양이 달라지지 않고,
       색만으로 구분하지 않으므로 색을 구분하기 어려운 사람도 알아볼 수 있다.
         결석   ● 빨강 동그라미      보충 예정 ◆ 주황 마름모
         보충 완료 ✓ 초록 체크        방학     ◎ 주황 링(속 빈 원)
         추가 준비물 ■ 분홍 네모       메모     ▬ 회색 막대
         학원비 납부일 ▲ 파랑 삼각형

   MARKS 의 key 는 달력 칸과 범례가 같이 쓴다. 순서가 곧 표시 우선순위다.
   ════════════════════════════════════════════════════════════════════════ */

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

export const MARK_COLORS = {
  absent: "#E5484D", makeup: "#F5A524", makeupDone: "#2FB67C",
  vacation: "#E65100", supply: "#E0619B", memo: "#8E949B", fee: "#4A7BE0",
};

/* [사용자 확정 2026-08-10] 도형 셋만 찍으니 정보가 너무 없었다 → 일곱 가지를 다 찍되
   도형 대신 '짧은 글자'로 쓴다. 도형은 범례를 봐야 뜻을 알지만 글자는 바로 읽힌다.
   색은 그대로 유지해서 익숙해지면 색만 보고도 구분된다.
   칸이 좁아 (360px 기준 한 칸 약 44px) 두세 글자로 줄인다. */
export const MARK_TEXT = {
  absent: "결석", makeup: "보충", makeupDone: "완료",
  vacation: "휴원", fee: "학원비", supply: "준비물", memo: "메모",
};

/* 달력 칸에 찍는 글자 한 조각 */
export function MarkText({ kind, size = 8.5 }) {
  return (
    <span style={{ fontSize: size, fontWeight: 800, lineHeight: 1.15,
      color: MARK_COLORS[kind] || MARK_COLORS.memo, whiteSpace: "nowrap" }}>
      {MARK_TEXT[kind] || ""}
    </span>
  );
}

/* 도형 하나 — size 는 칸(6~7px)과 범례(9px)에서 다르게 쓴다 */
export function Mark({ kind, size = 7 }) {
  const c = MARK_COLORS[kind] || MARK_COLORS.memo;
  const base = { display: "block", flexShrink: 0 };
  if (kind === "makeupDone") {
    return (
      <svg width={size + 2} height={size + 2} viewBox="0 0 10 10" style={base} aria-hidden="true">
        <path d="M1.6 5.4 L4 7.8 L8.4 2.6" fill="none" stroke={c} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "makeup") {   // 주황 점 — 마름모는 노란 원과 헷갈렸다 (사용자 지적 2026-08-10)
    return <span style={{ ...base, width: size, height: size, borderRadius: "50%", background: c }} />;
  }
  if (kind === "vacation") { // 속 빈 원
    return <span style={{ ...base, width: size, height: size, borderRadius: "50%",
      border: `2px solid ${c}`, boxSizing: "border-box" }} />;
  }
  if (kind === "supply") {   // 네모
    return <span style={{ ...base, width: size, height: size, borderRadius: 2, background: c }} />;
  }
  if (kind === "fee") {      // 삼각형 (학원비 납부일)
    return (
      <svg width={size + 1} height={size + 1} viewBox="0 0 10 10" style={base} aria-hidden="true">
        <path d="M5 1 L9.2 8.6 L0.8 8.6 Z" fill={c} />
      </svg>
    );
  }
  if (kind === "memo") {     // 가로 막대
    return <span style={{ ...base, width: size + 2, height: Math.max(2, size - 4), borderRadius: 2, background: c }} />;
  }
  return <span style={{ ...base, width: size, height: size, borderRadius: "50%", background: c }} />;
}

/* 순서가 곧 칸에 찍히는 순서(=중요도)다. 놓치면 곤란한 것부터 앞에 둔다. */
export const MARKS = [
  { key: "absent",     label: "학원에 못 간 날" },
  { key: "makeup",     label: "보충수업 예정" },
  { key: "makeupDone", label: "보충수업 완료" },
  { key: "vacation",   label: "학원 방학·휴원" },
  { key: "fee",        label: "학원비 내는 날" },
  { key: "supply",     label: "평소와 다른 준비물" },
  { key: "memo",       label: "내가 적어 둔 메모" },
];

/* 범례 — 달력 오른쪽 위 작은 버튼을 누르면 열리는 바텀시트 (사용자 확정).
   늘 두 줄을 차지하던 범례를 접어 넣고, 필요할 때만 펼쳐 본다. */
export function CalendarLegendSheet({ onClose, tone }) {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,20,40,0.55)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "22px 22px 0 0",
        padding: "10px 18px calc(26px + env(safe-area-inset-bottom))", width: "100%", maxWidth: 430,
        boxSizing: "border-box", fontFamily: F }}>
        <div aria-hidden="true" style={{ width: 38, height: 4, borderRadius: 999,
          background: tone.border, margin: "0 auto 12px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: tone.text }}>달력 표시 보기</h3>
          <button onClick={onClose} aria-label="닫기" className="jelly-tap"
            style={{ background: tone.faint + "88", border: "none", borderRadius: 10, width: 28, height: 28,
              cursor: "pointer", color: tone.sub, fontSize: 15, fontFamily: F }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: tone.sub, fontWeight: 600, margin: "0 0 12px", lineHeight: 1.5 }}>
          월간 달력에는 평소와 다른 일정만 표시해요.<br/>
          매일 반복되는 학원·셔틀은 날짜를 누르거나 주간 보기에서 확인할 수 있어요.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
          {MARKS.map((m, i) => (
            <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 11, padding: "7px 2px",
              borderTop: i === 0 ? "none" : `1px solid ${tone.border}` }}>
              <span style={{ width: 34, display: "flex", justifyContent: "flex-start" }}>
                <MarkText kind={m.key} size={11} />
              </span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: tone.text }}>{m.label}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: tone.sub, fontWeight: 600, margin: 0, opacity: 0.85, lineHeight: 1.5 }}>
          날짜를 누르면 아래에서 그날 자세한 내용을 볼 수 있어요.
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   CalendarMarks — 달력 칸에 찍는 표시와 그 설명(범례) 시트
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-09] 예전엔 칸마다 🚌 🎒 📝 이모지가 줄줄이 붙어서,
   정작 중요한 결석·보충·방학이 평범한 셔틀 일정에 묻혔다. 규칙을 바꾼다.

     · 달력에는 '평소와 다른 일'만 찍는다. 매일 반복되는 학원·셔틀은 안 찍는다
       (반복 일정은 주간 보기와 아래 상세 카드에서 본다).
     · 이모지 대신 색+모양 도형을 쓴다. 기기마다 모양이 달라지지 않고,
       색만으로 구분하지 않으므로 색을 구분하기 어려운 사람도 알아볼 수 있다.
     · [2026-08-19] 위 규칙에 한 줄 붙는다 — '그날 가는 학원'은 학원 카드 색 작은 점으로
       찍는다(CalendarTab). 글자가 아니라 점이라 칸이 복잡해지지 않는다.

         결석   ● 빨강 동그라미      보충 예정 ◆ 주황 마름모
         보충 완료 ✓ 초록 체크        방학     ◎ 주황 링(속 빈 원)
         추가 준비물 ■ 분홍 네모       메모     ▬ 회색 막대
         학원비 납부일 ▲ 파랑 삼각형

   [2026-08-20] 범례 시트는 뺐다(사용자 확정) — 글자 표시라 뜻이 바로 읽히고,
   학원 점은 학원 카드 색 그대로라 따로 설명할 게 없었다.
   찍히는 순서(=중요도)는 CalendarTab 의 marks 배열이 정한다.
   ════════════════════════════════════════════════════════════════════════ */

export const MARK_COLORS = {
  absent: "#E5484D", makeup: "#F5A524", makeupDone: "#2FB67C",
  vacation: "#E65100", supply: "#E0619B", memo: "#8E949B", fee: "#4A7BE0",
};

/* [사용자 확정 2026-08-10] 도형 셋만 찍으니 정보가 너무 없었다 → 일곱 가지를 다 찍되
   도형 대신 '짧은 글자'로 쓴다. 도형은 범례를 봐야 뜻을 알지만 글자는 바로 읽힌다.
   색은 그대로 유지해서 익숙해지면 색만 보고도 구분된다.
   칸이 좁아 (360px 기준 한 칸 약 44px) 두세 글자로 줄인다. */
export const MARK_TEXT = {
  absent: "결석", makeup: "보충", makeupDone: "보충",
  vacation: "휴원", fee: "학원비", supply: "준비물", memo: "메모",
};

/* 달력 칸에 찍는 글자 한 조각.
   [사용자 확정 2026-08-10] 보충 완료를 '완료'라는 다른 낱말로 쓰니 같은 일(보충수업)인데
   말이 갈라졌다 → 똑같이 '보충'이라 쓰고 옆에 작은 초록 체크를 붙인다.
   예정은 주황 '보충', 완료는 초록 '보충✓' — 색과 체크 둘 다로 구분된다. */
export function MarkText({ kind, size = 8.5 }) {
  const c = MARK_COLORS[kind] || MARK_COLORS.memo;
  const done = kind === "makeupDone";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.18,
      fontSize: size, fontWeight: 800, lineHeight: 1.15, color: c, whiteSpace: "nowrap" }}>
      {MARK_TEXT[kind] || ""}
      {done && (
        <svg width={size * 0.8} height={size * 0.8} viewBox="0 0 10 10" aria-hidden="true"
          style={{ display: "block", flexShrink: 0 }}>
          <path d="M1.4 5.3 L3.9 7.9 L8.6 2.3" fill="none" stroke={c} strokeWidth="2.4"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
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

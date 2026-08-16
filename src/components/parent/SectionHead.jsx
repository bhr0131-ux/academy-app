import { C, mixWhite, mixBlack } from "../../data/tokens.js";
import CareIcon from "./CareIcons.jsx";

/* ════════════════════════════════════════════════════════════════════════
   SectionHead — 엄마용 구역 머리 (알약 하나 + 오른쪽으로 뻗는 가는 선)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-16] 홈의 '오늘의 학원 / 등록 학원' 토글과 같은 모양을
   미션 탭·보상 탭에서도 쓴다. 그쪽은 고를 것이 없어 알약이 하나뿐이므로,
   토글이 아닌 이 컴포넌트로 뺐다 (ParentHomeTab 의 토글은 그대로 둔다 —
   두 개를 오가는 버튼이라 생김새만 같을 뿐 하는 일이 다르다).

   icon  : CareIcons 이름 (school · mission · reward …)
   label : 구역 이름
   note  : 이름 뒤에 옅게 붙는 짧은 말 ('3곳', '고학년 이상' 처럼). 없으면 생략.
   ════════════════════════════════════════════════════════════════════════ */
export default function SectionHead({ icon, label, note, th, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 15px", ...style }}>
      <span style={{
        flexShrink: 0, padding: "5px 10px", borderRadius: 9,
        fontSize: 14, fontWeight: 900, letterSpacing: 0.2,
        background: mixWhite(th.main, 0.88), color: mixBlack(th.main, 0.35),
        display: "inline-flex", alignItems: "center", gap: 5,
      }}>
        <span style={{ color: th.main, display: "flex" }}><CareIcon name={icon} size={14} /></span>
        {label}
        {note ? <span style={{ fontSize: 12.5, fontWeight: 700, color: C.sub }}>{note}</span> : null}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

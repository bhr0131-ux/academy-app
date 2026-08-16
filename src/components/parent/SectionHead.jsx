import { C, RAD, FW, FS } from "../../data/tokens.js";
import CareIcon from "./CareIcons.jsx";

/* ════════════════════════════════════════════════════════════════════════
   SectionHead — 엄마용 구역 머리 (아이콘 + 이름 + 오른쪽으로 뻗는 가는 선)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-16] 홈의 '오늘의 학원 / 등록 학원' 토글 자리에 맞춰
   미션 탭·보상 탭에도 같은 머리를 둔다. 그쪽은 고를 것이 없어 하나뿐이므로,
   토글이 아닌 이 컴포넌트로 뺐다 (ParentHomeTab 의 토글은 그대로 둔다 —
   두 개를 오가는 버튼이라 생김새만 같을 뿐 하는 일이 다르다).

   icon  : CareIcons 이름 (school · mission · reward …)
   label : 구역 이름
   note  : 이름 뒤에 옅게 붙는 짧은 말 ('3곳', '고학년 이상' 처럼). 없으면 생략.
   ════════════════════════════════════════════════════════════════════════ */
/* [사용자 확정 2026-08-16] 알약(연한 테마색 배경)을 벗기고 글씨는 검정으로.
   목록 위 제목이 버튼처럼 보여 눌러 보게 됐다 — 여기는 누를 데가 아니다.
   이름 뒤의 옅은 말(개수·연령대)과 오른쪽 가는 선은 그대로 둔다. */
export default function SectionHead({ icon, label, note, th, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 15px", ...style }}>
      <span style={{
        flexShrink: 0, padding: "5px 0",
        /* [사용자 확정 2026-08-16] '구매 승인 대기' 제목(15/900)과 같은 크기로 맞춘다 —
           같은 층의 구역 제목인데 하나만 작아 단이 어긋나 보였다. */
        fontSize: FS.title, fontWeight: FW.bold, letterSpacing: 0.2, color: C.text,
        display: "inline-flex", alignItems: "center", gap: 5,
      }}>
        <span style={{ color: th.main, display: "flex" }}><CareIcon name={icon} size={15} /></span>
        {label}
        {note ? <span style={{ fontSize: FS.sub, fontWeight: FW.normal, color: C.sub }}>{note}</span> : null}
      </span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

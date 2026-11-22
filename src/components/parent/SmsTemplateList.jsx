import { C, FS, FW, RAD } from "../../data/tokens.js";
import CareIcon from "./CareIcons.jsx";

/* ════════════════════════════════════════════════════════════════════════
   SmsTemplateList — 문자 템플릿 관리 (목록 · 새 템플릿 · 수정 · 삭제)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-11-22] 기타 탭 '문자관리'에 있던 내용을 떼어 냈다 — 학원 카드의 문자 창
   '템플릿 관리'에서도 같은 화면을 팝업으로 띄운다. 두 곳이 같은 컴포넌트라 한쪽만 바뀌지 않는다.
   '사용 가능한 변수' → '자동 입력 항목'(사용자 확정) — 문자에 적어 두면 보낼 때 자동으로 채워진다.

   props: templates, onNew(), onEdit(tmpl), onDelete(id), th, CT
   ════════════════════════════════════════════════════════════════════════ */
export const SMS_AUTO_FIELDS = ["{아이이름}", "{학원명}", "{날짜}", "{시간}"];

export default function SmsTemplateList({ templates = [], onNew, onEdit, onDelete, th, CT, hideLabel = false }) {
  const btnSmall = { padding: "5px 11px", borderRadius: RAD.sm, fontSize: FS.sub, fontWeight: FW.semi, cursor: "pointer", fontFamily: "inherit" };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: hideLabel ? "flex-end" : "space-between", alignItems: "center", marginBottom: 12 }}>
        {!hideLabel && <p style={{ fontSize: FS.sub, color: C.sub, fontWeight: FW.semi, margin: 0 }}>문자 템플릿 관리</p>}
        <button onClick={onNew} style={{ ...btnSmall, border: "none", background: th.grad, color: "#fff" }}>＋ 새 템플릿</button>
      </div>

      <div style={{ background: `${C.purple}08`, border: `1px solid ${C.purple}25`, borderRadius: RAD.sm, padding: "10px 13px", marginBottom: 13 }}>
        <p style={{ fontSize: FS.sub, color: C.purple, fontWeight: FW.semi, margin: "0 0 2px" }}>자동 입력 항목</p>
        <p style={{ fontSize: FS.tag, color: C.sub, fontWeight: FW.normal, margin: "0 0 7px" }}>새 템플릿을 추가할 때 넣어 두면 아이 이름·학원 이름 등으로 자동으로 바뀌어요</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {SMS_AUTO_FIELDS.map(v => (
            <span key={v} style={{ fontSize: FS.sub, padding: "3px 9px", borderRadius: RAD.sm, background: C.purpleL, color: C.purple, fontWeight: FW.normal }}>{v}</span>
          ))}
        </div>
      </div>

      {/* [사용자 확정 2026-08-18] 흰 카드 안에 또 흰 카드가 들어가 단계가 겹쳐 보였다 →
          안쪽은 옅은 칸(그림자 없음), 그 안의 본문 미리보기만 흰색으로 뒤집는다. */}
      {templates.map(tmpl => (
        <div key={tmpl.id} style={{ background: CT.faint, borderRadius: RAD.md, padding: "12px 13px", marginBottom: 10, border: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, minWidth: 0, fontWeight: FW.semi, fontSize: FS.body, color: C.text,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span style={{ color: C.sub, display: "flex", flexShrink: 0 }}><CareIcon name="sms" size={13} /></span>{tmpl.title}
            </span>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={() => onEdit(tmpl)} style={{ ...btnSmall, border: `1px solid ${C.border}`, background: "#fff", color: C.sub }}>수정</button>
              <button onClick={() => onDelete(tmpl.id)} style={{ ...btnSmall, border: `1px solid ${C.red}30`, background: `${C.red}0A`, color: C.red }}>삭제</button>
            </div>
          </div>
          <p style={{ fontSize: FS.sub, fontWeight: FW.normal, color: C.sub, margin: 0, whiteSpace: "pre-wrap", background: "#fff", borderRadius: RAD.sm, padding: "9px 11px", lineHeight: 1.5 }}>{tmpl.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   MissionOverview — 미션 탭 아래 '전체 미션' 목록
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-11-24 · 2차] 같은 줄 모양으로 두 목록 — App 이 '오늘의 미션'(그날 미션 전부,
   반복에서 온 것은 제목 앞 반복 그림만)과 '반복 미션'(아랫줄 밑에 반복 주기)을 따로 부른다.
   (아래 1차 설명 중 '한 목록'·'ruleId 는 뺀다'는 2차에서 바뀌었다.)
   [사용자 확정 2026-11-24] 여기는 '쭉 보는 곳'. 오늘의 미션 / 반복 설정된 미션을
   제목으로 나누지 않고 한 목록으로 늘어놓는다 — 위에 그날의 하루 미션, 아래에 반복 미션.
     · 줄 모양은 하나로 통일: 미션 이름 / [반복 주기] · 학원 · +점 · +코인 / 오른쪽 끝 ✎
     · 체크 동그라미는 없다 (체크는 홈·미션 창에서)
     · ✎ 를 누르면 그 줄이 편집으로 바뀐다 — 미션 내용 · 코인 · [저장] 아래 [삭제]
     · 반복 미션의 '삭제'는 반복을 끄는 것이다 (이미 들어간 그날 미션은 남는다)
   그리기와 편집 입력만 한다 — 저장은 App 이 onSave / onDelete 로 한다.
   그날 미션 중 반복 규칙에서 생긴 것(ruleId)은 아래 반복 미션 줄과 겹치므로 위쪽에서 뺀다
   (App 이 걸러서 넘긴다).

   props
     dayItems  : [{ key, text, acName, acColor, coin, done, failed }]   하루 미션
     rules     : [{ key, text, acName, acColor, coin, repeatText }]     반복 미션
     th, TM    : 테마색 / 용어 (TM.xpUnit, TM.coin)
     onSave(row, {text, coin})  onDelete(row)
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { C, FS, FW, RAD, DEFAULT_HOMEWORK_SCORE } from "../../data/tokens.js";
import CareIcon from "./CareIcons.jsx";

const pill = { flexShrink: 0, fontSize: 11.5, fontWeight: 800, padding: "2px 8px", borderRadius: 20 };

export default function MissionOverview({ dayItems = [], rules = [], th, TM, onSave, onDelete, emptyText = "등록된 미션이 없어요" }) {
  const [edit, setEdit] = useState(null);     // { key, text, coin }
  const rows = [...dayItems.map(r => ({ ...r, kind: "day" })), ...rules.map(r => ({ ...r, kind: "rule" }))];
  const xpU = (TM && TM.xpUnit) || "점", coinU = (TM && TM.coin) || "코인";

  if (!rows.length) {
    return (
      <div style={{ textAlign: "center", padding: "18px 10px", color: C.sub }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: "50%", background: "#EEF1F6" }}>
          <CareIcon name="mission" size={22} />
        </span>
        <p style={{ fontSize: 13, fontWeight: 700, margin: "8px 0 0" }}>{emptyText}</p>
      </div>
    );
  }

  const save = (row) => {
    const t = String(edit.text || "").trim();
    if (!t) return;
    const raw = String(edit.coin).trim();
    const c = raw === "" ? row.coin : Math.max(0, Math.round(Number(raw) || 0));
    if (row.kind === "rule" && edit.type === "days" && !(edit.days || []).length) return;   // 요일을 하나는 골라야 한다
    onSave && onSave(row, { text: t, coin: c, ...(row.kind === "rule" ? { type: edit.type, days: edit.type === "days" ? [...edit.days] : [] } : {}) });
    setEdit(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {rows.map(row => {
        const editing = edit && edit.key === row.key;
        const faded = row.kind === "day" && (row.done || row.failed);
        return (
          <div key={row.key} style={{ display: "flex", alignItems: editing ? "stretch" : "center", gap: 10, padding: "10px 12px 10px 14px",
            borderRadius: RAD.md, background: "#fff", border: `1px solid ${editing ? th.main + "55" : C.border}` }}>
            {editing ? (
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 7 }}>
                <input value={edit.text} autoFocus onChange={e => setEdit(p => ({ ...p, text: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && save(row)} aria-label="미션 내용"
                  style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: RAD.sm, padding: "8px 10px",
                    fontSize: FS.body, fontWeight: 700, color: C.text, outline: "none", fontFamily: "inherit", background: "#F6F8FC" }} />
                {/* [사용자 확정 2026-11-24] 코인 옆에 저장 · 삭제 · 취소 를 한 줄로 */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="number" min="0" value={edit.coin} onChange={e => setEdit(p => ({ ...p, coin: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && save(row)} aria-label={coinU}
                    style={{ width: 50, flexShrink: 0, boxSizing: "border-box", border: `1px solid ${C.border}`, borderRadius: RAD.sm, padding: "7px 4px",
                      fontSize: FS.body, fontWeight: 800, color: "#2E8FD6", textAlign: "center", outline: "none", fontFamily: "inherit", background: "#F6F8FC" }} />
                  <span style={{ fontSize: FS.sub, color: C.sub, fontWeight: FW.semi, flexShrink: 0 }}>{coinU}</span>
                  <span style={{ marginLeft: "auto", display: "flex", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => save(row)} className="jelly-tap"
                      style={{ background: th.main, border: "none", color: "#fff", borderRadius: RAD.sm, padding: "7px 11px", fontSize: FS.sub, fontWeight: FW.semi, cursor: "pointer", fontFamily: "inherit" }}>저장</button>
                    <button onClick={() => { onDelete && onDelete(row); setEdit(null); }} className="jelly-tap"
                      style={{ background: "#fff", border: `1px solid ${C.red}55`, color: C.red, borderRadius: RAD.sm, padding: "6px 10px", fontSize: FS.sub, fontWeight: FW.semi, cursor: "pointer", fontFamily: "inherit" }}>삭제</button>
                    <button onClick={() => setEdit(null)} className="jelly-tap"
                      style={{ background: "#fff", border: `1px solid ${C.border}`, color: C.sub, borderRadius: RAD.sm, padding: "6px 10px", fontSize: FS.sub, fontWeight: FW.semi, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
                  </span>
                </div>
                {/* 반복 미션은 반복 주기도 바꾼다 — 매일 · 특정 요일 · 학원 가는 날(학원 미션만) */}
                {row.kind === "rule" && (
                  <div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[{ k: "daily", l: "매일" }, { k: "days", l: "특정 요일" }, ...(row.allowClass ? [{ k: "class", l: "학원 가는 날" }] : [])].map(o => {
                        const on = edit.type === o.k;
                        return (
                          <button key={o.k} onClick={() => setEdit(p => ({ ...p, type: o.k }))} aria-pressed={on}
                            style={{ padding: "5px 11px", borderRadius: 999, fontFamily: "inherit", fontSize: FS.sub, fontWeight: on ? FW.bold : FW.semi, cursor: "pointer",
                              border: `1.5px solid ${on ? th.main : C.border}`, background: on ? `${th.main}16` : "#fff", color: on ? th.main : C.sub }}>{o.l}</button>
                        );
                      })}
                    </div>
                    {edit.type === "days" && (
                      <div style={{ display: "flex", gap: 4, marginTop: 7 }}>
                        {["월", "화", "수", "목", "금", "토", "일"].map(d => {
                          const on = (edit.days || []).includes(d);
                          return (
                            <button key={d} onClick={() => setEdit(p => ({ ...p, days: on ? p.days.filter(x => x !== d) : [...(p.days || []), d] }))} aria-pressed={on}
                              style={{ flex: 1, height: 30, borderRadius: RAD.sm, fontFamily: "inherit", fontSize: FS.sub, fontWeight: FW.bold, cursor: "pointer",
                                border: `1.5px solid ${on ? th.main : C.border}`, background: on ? th.main : "#fff",
                                color: on ? "#fff" : d === "일" ? C.red : d === "토" ? "#4A7BD8" : C.sub }}>{d}</button>
                          );
                        })}
                      </div>
                    )}
                    {edit.type === "days" && !(edit.days || []).length && (
                      <p style={{ margin: "6px 0 0", fontSize: FS.tag, color: C.red, fontWeight: FW.semi }}>요일을 하나 이상 골라 주세요</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 800, lineHeight: 1.35, overflowWrap: "anywhere",
                    color: faded ? C.sub : C.text, textDecoration: faded ? "line-through" : "none" }}>
                    {/* 오늘의 미션 중 반복에서 온 것은 주기 글 없이 반복 그림만 (사용자 확정 2026-11-24) */}
                    {row.kind === "day" && row.repeat && <span title="반복 미션" style={{ display: "inline-flex", verticalAlign: "-0.1em", marginRight: 5, color: th.main }}><CareIcon name="repeat" size={13} /></span>}
                    {row.text}
                  </p>
                  {/* 아랫줄 — 하루·반복 모두 같은 모양: 학원 · +점 · +코인 (사용자 확정 2026-11-24) */}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, fontSize: FS.sub, color: C.sub }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: row.acColor || th.main, flexShrink: 0 }} />
                      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.acName}</span>
                    </span>
                    <span style={{ ...pill, background: `${C.orange}14`, color: C.orange }}>+{DEFAULT_HOMEWORK_SCORE}{xpU}</span>
                    <span style={{ ...pill, background: "#2E8FD614", color: "#2E8FD6" }}>+{row.coin}{coinU}</span>
                    {/* 완료는 줄이 그어지는 것으로 충분해 글자를 뺐다. 미완료(실패)만 남긴다 */}
                    {row.kind === "day" && row.failed && <span style={{ ...pill, background: `${C.sub}14`, color: C.sub }}>미완료</span>}
                  </div>
                  {/* 반복 미션은 그 아래 한 줄에 반복 주기 */}
                  {row.kind === "rule" && (
                    <p style={{ margin: "6px 0 0", display: "flex", alignItems: "center", gap: 4, fontSize: FS.sub, fontWeight: FW.bold, color: th.main }}>
                      <CareIcon name="repeat" size={12} />{row.repeatText}
                    </p>
                  )}
                </div>
                <button onClick={() => setEdit({ key: row.key, text: row.text, coin: String(row.coin), type: row.type, days: [...(row.days || [])] })} className="jelly-tap"
                  aria-label={`${row.text} 고치기`}
                  style={{ flexShrink: 0, width: 36, height: 36, border: "none", background: "none", color: C.sub, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CareIcon name="pencil" size={16} />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

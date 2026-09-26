/* ════════════════════════════════════════════════════════════════════════
   RepeatMissionSheet — 반복 미션 만들기·관리 (엄마용 미션탭)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-09-26] 학원을 안 다니는 아이도 반복 할 일을 쓸 수 있어야 한다.
   자주 쓰는 미션("이 닦기", "책 읽기")을 여기에 저장해 두면, 미션을 넣는
   팝업(공부방·어린이집 …·생활·일반)에서 칩을 눌러 바로 넣는다.

   장소는 여기서 안 정한다 — **넣는 순간 고른다.** 같은 "이 닦기"를
   어제는 생활·일반에, 오늘은 공부방에 넣을 수 있다.

   저장은 App이 한다. 여기는 입력만 받아 onAdd/onEdit/onRemove 로 넘긴다.
   규칙(빈 글자·중복·최대 개수·점수 다듬기)은 data/repeatMissions.js 가 갖는다.

   props
     open      : boolean
     list      : [{id,text,point,kind}]
     canScore  : boolean   엄마 권한(PIN)이 열렸나 — 점수 칸을 열지 말지
     defaultPoint : number
     onAdd({text,point,kind}) · onEdit(id,{text,point,kind}) · onRemove(id)
     onClose   : ()=>void
     tone      : {text,sub,border,faint,main,grad,red}
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { REPEAT_MISSION_MAX, REPEAT_TEXT_MAX } from "../../data/repeatMissions.js";

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

const KINDS = [{ k: "todo", l: "할 일" }, { k: "hw", l: "숙제" }];

export default function RepeatMissionSheet({
  open, list = [], canScore = false, defaultPoint = 10,
  onAdd, onEdit, onRemove, onClose, tone,
}) {
  const [text, setText] = useState("");
  const [point, setPoint] = useState(String(defaultPoint));
  const [kind, setKind] = useState("todo");
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editPoint, setEditPoint] = useState("");
  const [askRemove, setAskRemove] = useState(null);   // 지우기 전에 한 번 더 묻는다
  if (!open) return null;

  const full = list.length >= REPEAT_MISSION_MAX;
  const inp = {
    width: "100%", boxSizing: "border-box", background: "#fff",
    border: `1px solid ${tone.border}`, borderRadius: 12, padding: "11px 13px",
    fontSize: 15, color: tone.text, outline: "none", fontFamily: F, fontWeight: 700,
  };
  const submit = () => {
    const v = text.trim(); if (!v) return;
    onAdd && onAdd({ text: v, point: canScore ? point : defaultPoint, kind });
    setText(""); setPoint(String(defaultPoint));
  };
  const saveEdit = () => {
    const v = editText.trim(); if (!v) { setEditId(null); return; }
    onEdit && onEdit(editId, { text: v, ...(canScore ? { point: editPoint } : null) });
    setEditId(null);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,20,40,0.55)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "22px 22px 0 0",
        padding: "10px 18px calc(26px + env(safe-area-inset-bottom))", width: "100%", maxWidth: 430,
        boxSizing: "border-box", maxHeight: "88vh", overflowY: "auto", fontFamily: F }}>
        <div aria-hidden="true" style={{ width: 38, height: 4, borderRadius: 999,
          background: tone.border, margin: "0 auto 12px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: tone.text }}>반복 미션</h3>
          <button onClick={onClose} aria-label="닫기" className="jelly-tap"
            style={{ marginLeft: "auto", background: tone.faint + "88", border: "none", borderRadius: 10,
              width: 28, height: 28, cursor: "pointer", color: tone.sub, fontSize: 15, fontFamily: F }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: tone.sub, fontWeight: 600, margin: "0 0 15px", lineHeight: 1.5 }}>
          자주 쓰는 미션을 저장해 두면, 미션을 넣을 때 눌러서 바로 넣을 수 있어요.
          학원이든 생활·일반이든 <b style={{ color: tone.text }}>넣을 곳은 그때 고르면 돼요.</b>
        </p>

        {/* ── 새로 만들기 ── */}
        <div style={{ background: tone.faint, borderRadius: 14, padding: "12px 12px 13px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "stretch", gap: 8, marginBottom: 8 }}>
            <div style={{ flexShrink: 0, width: 62, display: "flex", flexDirection: "column", gap: 5 }}>
              {KINDS.map(o => (
                <button key={o.k} onClick={() => setKind(o.k)} className="jelly-tap" aria-pressed={kind === o.k}
                  style={{ width: "100%", cursor: "pointer", borderRadius: 9, padding: "4px 0", fontFamily: F, fontSize: 12,
                    border: `1.5px solid ${kind === o.k ? tone.main : tone.border}`,
                    fontWeight: kind === o.k ? 900 : 700,
                    background: kind === o.k ? tone.grad : "#fff", color: kind === o.k ? "#fff" : tone.sub }}>{o.l}</button>
              ))}
            </div>
            <input value={text} onChange={e => setText(e.target.value.slice(0, REPEAT_TEXT_MAX))}
              onKeyDown={e => e.key === "Enter" && submit()} disabled={full}
              placeholder={full ? `최대 ${REPEAT_MISSION_MAX}개까지예요` : "예) 이 닦기"} aria-label="반복 미션 내용"
              style={{ ...inp, flex: 1, minWidth: 0, background: full ? tone.faint : "#fff" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 62, textAlign: "right", flexShrink: 0, fontSize: 12, fontWeight: 700, color: tone.sub }}>보상</span>
            <input type="number" min="1" value={canScore ? point : defaultPoint}
              onChange={e => setPoint(e.target.value)} disabled={!canScore}
              title={canScore ? "" : "점수는 엄마 권한을 열면 바꿀 수 있어요"} aria-label="보상 점수"
              style={{ ...inp, width: 56, flex: "0 0 auto", textAlign: "center", padding: "8px 6px", fontSize: 14,
                background: canScore ? "#fff" : tone.faint, color: canScore ? tone.text : tone.sub,
                cursor: canScore ? "text" : "not-allowed" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: tone.sub }}>점</span>
            <button onClick={submit} disabled={full || !text.trim()} className="jelly-tap"
              style={{ marginLeft: "auto", flexShrink: 0, padding: "0 16px", minHeight: 38, borderRadius: 9, border: "none",
                background: (full || !text.trim()) ? tone.border : tone.grad, color: "#fff",
                fontWeight: 900, fontSize: 14, cursor: (full || !text.trim()) ? "not-allowed" : "pointer", fontFamily: F }}>
              저장
            </button>
          </div>
        </div>

        {/* ── 저장된 목록 ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px" }}>
          <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 900, color: tone.text }}>
            저장된 반복 미션 <span style={{ color: tone.sub, fontWeight: 800 }}>{list.length}/{REPEAT_MISSION_MAX}</span>
          </span>
          <div style={{ flex: 1, height: 1, background: tone.border }} />
        </div>

        {list.length === 0 ? (
          <p style={{ textAlign: "center", color: tone.sub, fontSize: 13, fontWeight: 700,
            padding: "22px 10px", margin: 0, lineHeight: 1.6 }}>
            아직 없어요<br />
            <span style={{ fontSize: 12, fontWeight: 600 }}>위에서 하나 만들어 보세요</span>
          </p>
        ) : (
          <div>
            {list.map((it, i) => (
              <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 2px",
                borderTop: i ? `1px solid ${tone.border}` : "none" }}>
                {editId === it.id ? (
                  <>
                    <input value={editText} onChange={e => setEditText(e.target.value.slice(0, REPEAT_TEXT_MAX))}
                      onKeyDown={e => e.key === "Enter" && saveEdit()} autoFocus aria-label="반복 미션 고치기"
                      style={{ ...inp, flex: 1, minWidth: 0, padding: "8px 10px", fontSize: 14 }} />
                    {canScore && (
                      <input type="number" min="1" value={editPoint} onChange={e => setEditPoint(e.target.value)}
                        aria-label="보상 점수"
                        style={{ ...inp, width: 50, flex: "0 0 auto", textAlign: "center", padding: "8px 4px", fontSize: 13 }} />
                    )}
                    <button onClick={saveEdit} className="jelly-tap"
                      style={{ flexShrink: 0, border: "none", background: tone.grad, color: "#fff", borderRadius: 9,
                        padding: "8px 12px", fontWeight: 900, fontSize: 13, cursor: "pointer", fontFamily: F }}>확인</button>
                  </>
                ) : (
                  <>
                    <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 900, borderRadius: 7, padding: "2px 7px",
                      background: it.kind === "hw" ? `${tone.main}18` : tone.faint,
                      color: it.kind === "hw" ? tone.main : tone.sub }}>
                      {it.kind === "hw" ? "숙제" : "할 일"}
                    </span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 800, color: tone.text,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.text}</span>
                    <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, color: tone.sub }}>{it.point}점</span>
                    <button onClick={() => { setEditId(it.id); setEditText(it.text); setEditPoint(String(it.point)); }}
                      aria-label="고치기" className="jelly-tap"
                      style={{ flexShrink: 0, background: "none", border: "none", color: tone.sub, cursor: "pointer",
                        padding: "2px 5px", fontSize: 13, fontFamily: F }}>✎</button>
                    <button onClick={() => setAskRemove(it.id)} aria-label="지우기" className="jelly-tap"
                      style={{ flexShrink: 0, background: "none", border: "none", color: tone.red || "#DC2626",
                        cursor: "pointer", padding: "2px 5px", fontSize: 13, fontFamily: F }}>✕</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 지우기 확인 — 저장된 것을 없애는 일이라 한 번 더 묻는다.
            (이미 오늘 미션에 넣어 둔 것은 그대로 남는다 — 복사해서 넣기 때문) */}
        {askRemove && (() => {
          const target = list.find(x => x.id === askRemove);
          return (
            <div onClick={() => setAskRemove(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(20,20,40,0.5)", zIndex: 1100,
                display: "flex", alignItems: "center", justifyContent: "center", padding: 22 }}>
              <div onClick={e => e.stopPropagation()}
                style={{ background: "#fff", borderRadius: 18, padding: "18px 18px 14px", width: "100%", maxWidth: 300, fontFamily: F }}>
                <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 900, color: tone.text }}>
                  「{target?.text}」를 지울까요?
                </p>
                <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 600, color: tone.sub, lineHeight: 1.5 }}>
                  이미 오늘 미션에 넣어 둔 건 그대로 남아요.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => setAskRemove(null)} className="jelly-tap"
                    style={{ flex: 1, border: `1px solid ${tone.border}`, background: "#fff", color: tone.sub,
                      borderRadius: 11, padding: "10px", fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: F }}>그대로 두기</button>
                  <button onClick={() => { onRemove && onRemove(askRemove); setAskRemove(null); }} className="jelly-tap"
                    style={{ flex: 1, border: "none", background: tone.red || "#DC2626", color: "#fff",
                      borderRadius: 11, padding: "10px", fontWeight: 900, fontSize: 14, cursor: "pointer", fontFamily: F }}>지우기</button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   RepeatMissionChips — 미션 추가 팝업 안에서 반복 미션을 눌러 넣는 칩 줄
   저장된 게 없으면 아무것도 안 그린다 (팝업이 괜히 길어지지 않게).
   이미 오늘 그 칸에 들어 있는 것은 ✓ 로 두고 못 누르게 한다 — 두 번 눌러
   같은 미션이 두 줄 생기는 걸 막는다.
   ════════════════════════════════════════════════════════════════════════ */
export function RepeatMissionChips({ list = [], isInEntry, onPick, isExtra = false, tone }) {
  if (!list.length) return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 12, fontWeight: 800, color: tone.sub, margin: "0 0 7px" }}>
        반복 미션에서 고르기
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {list.map(it => {
          const already = isInEntry ? isInEntry(it) : false;
          const showKind = !isExtra && it.kind === "hw";
          return (
            <button key={it.id} onClick={() => !already && onPick && onPick(it)}
              disabled={already} className={already ? undefined : "jelly-tap"}
              title={already ? "이미 오늘 미션에 있어요" : `${it.text} · ${it.point}점`}
              style={{ border: `1.5px solid ${already ? tone.border : tone.main + "55"}`,
                background: already ? tone.faint : "#fff",
                color: already ? tone.sub : tone.text,
                borderRadius: 999, padding: "6px 11px", fontSize: 12.5, fontWeight: 800,
                cursor: already ? "default" : "pointer", fontFamily: F,
                display: "flex", alignItems: "center", gap: 5, maxWidth: "100%" }}>
              <span aria-hidden="true" style={{ flexShrink: 0, color: already ? tone.sub : tone.main, fontWeight: 900 }}>
                {already ? "✓" : "+"}
              </span>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.text}</span>
              {showKind && (
                <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 900, color: tone.sub }}>숙제</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

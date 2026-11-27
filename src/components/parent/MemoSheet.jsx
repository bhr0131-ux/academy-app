/* ════════════════════════════════════════════════════════════════════════
   MemoSheet — 캘린더 날짜 메모 추가·수정 창
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-11-27] 날짜마다 메모를 여러 개, 반복(매주 그 요일 / 매월 그 날)도.
     · 흰 바닥 시트 + 동그란 회색 ✕ + 테마색 저장 버튼 (다른 모달과 같은 모양)
     · 수정일 때만 '삭제' — 반복 메모면 '이 날짜만 삭제' / '전체 반복 삭제' 를 고른다
   저장·삭제는 App(saveMemo / deleteMemo)이 한다 — 여기는 입력만 받는다.

   props
     dateStr("YYYY-MM-DD"), dn("금"), memo(수정할 메모 | null), th, CT
     onSave({text, repeat}), onDelete(scope:"one"|"all"), onClose
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { createPortal } from "react-dom";
import { C, FS, FW, RAD, CLOSE_BTN } from "../../data/tokens.js";

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

const DN = ["일", "월", "화", "수", "목", "금", "토"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];   // 칩은 월~일 순서 (값은 getDay: 일=0)
export const memoRepeatLabel = (memo) => {
  if (!memo || !memo.repeat || memo.repeat === "none") return "";
  const d = new Date(String(memo.date).replace(/-/g, "/"));
  if (memo.repeat === "weekly") {
    const days = (memo.days && memo.days.length) ? memo.days : [d.getDay()];
    return `매주 ${WEEK_ORDER.filter(x => days.includes(x)).map(x => DN[x]).join("·")}`;
  }
  if (memo.repeat === "monthly") return `매월 ${Number(memo.mday) || d.getDate()}일`;
  if (memo.repeat === "yearly") { const [mm, dd] = (memo.md || String(memo.date).slice(5)).split("-").map(Number); return `매년 ${mm}월 ${dd}일`; }
  return "";
};

export default function MemoSheet({ dateStr, dn, memo = null, th, CT, onSave, onDelete, onClose }) {
  const editing = !!memo;
  const [text, setText] = useState(memo ? memo.text : "");
  const [repeat, setRepeat] = useState(memo ? (memo.repeat || "none") : "none");
  const [askDel, setAskDel] = useState(false);
  const [y, m, d] = dateStr.split("-").map(Number);
  /* [사용자 확정 2026-11-27] 주기 4가지 + 주기별 날짜·요일 고르기. 기본값은 창을 연 날짜.
     수정할 때는 그 메모에 저장된 값을 먼저 채운다(예전 메모는 시작일에서 계산). */
  const base = memo && memo.date ? new Date(memo.date.replace(/-/g, "/")) : new Date(y, m - 1, d);
  const [oneDate, setOneDate] = useState(memo && (memo.repeat || "none") === "none" ? memo.date : dateStr);
  const [days, setDays] = useState(memo && memo.days && memo.days.length ? memo.days : [base.getDay()]);
  const [mday, setMday] = useState(memo && memo.mday ? Number(memo.mday) : base.getDate());
  const [ymd, setYmd] = useState(() => {
    const [mm, dd] = (memo && memo.md ? memo.md : `${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`).split("-").map(Number);
    return { m: mm, d: dd };
  });
  const opts = [{ k: "none", l: "이 날만" }, { k: "weekly", l: "매주" }, { k: "monthly", l: "매월" }, { k: "yearly", l: "매년" }];
  const maxDayOf = (mm) => [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mm - 1];
  const toggleDay = (x) => setDays(p => p.includes(x) ? p.filter(v => v !== x) : [...p, x]);
  const fieldBox = { width: "100%", boxSizing: "border-box", background: CT.faint, border: `1px solid ${CT.faintB}`, borderRadius: RAD.sm,
    padding: "11px 12px", color: C.text, fontSize: FS.cardTitle, outline: "none", fontFamily: "inherit" };
  const isRepeat = memo && memo.repeat && memo.repeat !== "none";
  const canSave = text.trim().length > 0 && (repeat !== "weekly" || days.length > 0) && (repeat !== "none" || !!oneDate);
  const lbl = { fontSize: FS.body, color: C.sub, display: "block", marginBottom: 7, fontWeight: FW.normal };

  /* body 바로 아래로 — 캘린더 안에 두면 하단 메뉴가 창 아래쪽(저장 버튼)을 덮었다 */
  return createPortal(
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,20,40,0.5)", display: "flex", alignItems: "flex-end", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "22px 22px 0 0", padding: "24px 20px 40px",
        width: "100%", maxWidth: 430, margin: "0 auto", boxSizing: "border-box", fontFamily: F }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: C.text }}>{editing ? "메모 수정" : "메모 추가"}</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 600, color: C.sub }}>{m}월 {d}일 {dn}요일</p>
          </div>
          <button onClick={onClose} aria-label="닫기" className="jelly-tap" style={CLOSE_BTN}>✕</button>
        </div>

        <label style={lbl}>메모</label>
        <textarea autoFocus={!editing} value={text} onChange={e => setText(e.target.value)} rows={3}
          placeholder="이 날 기억할 일 (예: 준비물 사기, 상담 전화)"
          className="memo-faint-ph"
          style={{ width: "100%", boxSizing: "border-box", background: CT.faint, border: `1px solid ${CT.faintB}`, borderRadius: RAD.sm,
            padding: "12px 14px", color: C.text, fontSize: FS.cardTitle, outline: "none", fontFamily: "inherit", resize: "none",
            lineHeight: 1.5, marginBottom: 16 }} />
        <style>{`.memo-faint-ph::placeholder{color:#C4C9D4;opacity:1}`}</style>

        <label style={lbl}>반복</label>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {opts.map(o => {
            const on = repeat === o.k;
            return (
              <button key={o.k} onClick={() => setRepeat(o.k)} className="jelly-tap" aria-pressed={on}
                style={{ flex: "1 1 0", minWidth: 0, padding: "9px 6px", borderRadius: RAD.pill, cursor: "pointer", fontFamily: "inherit",
                  border: `1.5px solid ${on ? th.main : C.border}`, background: on ? `${th.main}14` : "#fff",
                  color: on ? th.main : C.sub, fontSize: FS.sub, fontWeight: FW.semi, whiteSpace: "nowrap" }}>
                {o.l}
              </button>
            );
          })}
        </div>
        {/* 주기별 날짜·요일 */}
        <div style={{ marginBottom: 22 }}>
          {repeat === "none" && (
            <input type="date" value={oneDate} onChange={e => setOneDate(e.target.value)} aria-label="메모 날짜" style={fieldBox} />
          )}
          {repeat === "weekly" && (<>
            <div style={{ display: "flex", gap: 5 }}>
              {WEEK_ORDER.map(x => {
                const on = days.includes(x);
                return (
                  <button key={x} onClick={() => toggleDay(x)} className="jelly-tap" aria-pressed={on} aria-label={`${DN[x]}요일`}
                    style={{ flex: 1, minWidth: 0, height: 38, borderRadius: 999, cursor: "pointer", fontFamily: "inherit", padding: 0,
                      border: `1.5px solid ${on ? th.main : C.border}`, background: on ? th.main : "#fff",
                      color: on ? "#fff" : x === 0 ? C.red : x === 6 ? "#3498DB" : C.sub, fontSize: FS.body, fontWeight: FW.semi }}>
                    {DN[x]}
                  </button>
                );
              })}
            </div>
            <p style={{ margin: "7px 0 0", fontSize: FS.tag, color: days.length ? C.sub : C.red, fontWeight: FW.semi }}>
              {days.length ? "여러 요일을 고를 수 있어요" : "요일을 하나 이상 골라 주세요"}
            </p>
          </>)}
          {repeat === "monthly" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: FS.body, color: C.sub, fontWeight: FW.semi, flexShrink: 0 }}>매월</span>
              <select value={mday} onChange={e => setMday(Number(e.target.value))} aria-label="매월 며칠" style={{ ...fieldBox, width: "auto", flex: 1 }}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}일</option>)}
              </select>
            </div>
          )}
          {repeat === "monthly" && mday > 28 && (
            <p style={{ margin: "7px 0 0", fontSize: FS.tag, color: C.sub, fontWeight: FW.semi }}>{mday}일이 없는 달은 그달 마지막 날에 보여요</p>
          )}
          {repeat === "yearly" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: FS.body, color: C.sub, fontWeight: FW.semi, flexShrink: 0 }}>매년</span>
              <select value={ymd.m} onChange={e => { const mm = Number(e.target.value); setYmd(p => ({ m: mm, d: Math.min(p.d, maxDayOf(mm)) })); }} aria-label="매년 몇 월" style={{ ...fieldBox, width: "auto", flex: 1 }}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}월</option>)}
              </select>
              <select value={ymd.d} onChange={e => setYmd(p => ({ ...p, d: Number(e.target.value) }))} aria-label="매년 며칠" style={{ ...fieldBox, width: "auto", flex: 1 }}>
                {Array.from({ length: maxDayOf(ymd.m) }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}일</option>)}
              </select>
            </div>
          )}
        </div>

        <button onClick={() => canSave && onSave({ text, repeat, date: oneDate, days, mday,
            md: `${String(ymd.m).padStart(2, "0")}-${String(ymd.d).padStart(2, "0")}` })} className="jelly-tap" aria-disabled={!canSave}
          style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: th.grad || th.main, color: "#fff",
            fontSize: 17, fontWeight: 700, cursor: canSave ? "pointer" : "default", opacity: canSave ? 1 : 0.45, fontFamily: "inherit" }}>
          저장하기
        </button>

        {editing && !askDel && (
          <button onClick={() => (isRepeat ? setAskDel(true) : onDelete("all"))} className="jelly-tap"
            style={{ width: "100%", marginTop: 10, padding: 12, borderRadius: 14, border: `1px solid ${C.red}44`, background: "#fff",
              color: C.red, fontSize: FS.body, fontWeight: FW.semi, cursor: "pointer", fontFamily: "inherit" }}>
            메모 삭제
          </button>
        )}
        {editing && askDel && (
          /* 반복 메모 — 어디까지 지울지 고른다 */
          <div style={{ marginTop: 10, padding: "12px", borderRadius: 14, background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
            <p style={{ margin: "0 0 10px", fontSize: FS.sub, fontWeight: FW.semi, color: C.text, textAlign: "center" }}>
              반복 메모를 어떻게 지울까요?
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => onDelete("one")} className="jelly-tap"
                style={{ flex: 1, padding: "10px 6px", borderRadius: 12, border: `1px solid ${C.red}44`, background: "#fff", color: C.red,
                  fontSize: FS.sub, fontWeight: FW.semi, cursor: "pointer", fontFamily: "inherit" }}>이 날짜만 삭제</button>
              <button onClick={() => onDelete("all")} className="jelly-tap"
                style={{ flex: 1, padding: "10px 6px", borderRadius: 12, border: "none", background: C.red, color: "#fff",
                  fontSize: FS.sub, fontWeight: FW.semi, cursor: "pointer", fontFamily: "inherit" }}>전체 반복 삭제</button>
            </div>
            <button onClick={() => setAskDel(false)} className="jelly-tap"
              style={{ width: "100%", marginTop: 6, padding: 8, border: "none", background: "none", color: C.sub, fontSize: FS.sub,
                fontWeight: FW.semi, cursor: "pointer", fontFamily: "inherit" }}>취소</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

import { useEffect, useState } from "react";
import { CLOSE_BTN, C, FS, FW, RAD, mixBlack } from "../../data/tokens.js";
import CareIcon from "./CareIcons.jsx";

/* ════════════════════════════════════════════════════════════════════════
   DaySupplySheet — 홈 '오늘 가는 학원' 카드의 [준비물 수정] 창
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-11-22] 학원 수정 창의 준비물 칸과 같은 모양으로 — '항상'을 체크할 수 있다.
     · 항상 ☑ 로 추가  → 그 학원의 항상 챙길 준비물(가는 날마다)
     · 항상 ☐ 로 추가  → 이 날짜 준비물
     · '항상' 칩의 ✕  → 항상 챙길 준비물에서 지운다 (학원 수정 창과 같다)
     · '그날' 칩의 ✕  → 지우기
   [사용자 확정 2026-11-22] 머리의 '다른 날'을 누르면 작은 달력이 펴진다 — 그 학원 '가는 날'만 누를 수 있고
     (다른 날은 흐리게), 고르면 그 날짜 준비물을 넣는다.
     '오늘만 빼기·되돌리기'와 그 안내 문구는 뺐다.
   넣고 빼면 바로 저장된다(예전 준비물 창과 같다). 미션은 여기서 다루지 않는다.

   props
     ac        : 학원 {id,name,color,baseSupplies}
     dateLabel : "오늘" · "내일" · "11/25" …  (칩·안내에 쓰는 짧은 이름)
     dateText  : "11/22(일) (오늘)" 처럼 머리에 쓰는 긴 이름
     entry     : 그날 일별 기록 {supplies, hiddenBase, ...}
     onSaveEntry(nextEntry)  : 그날 기록 저장
     onAddBase(text)         : 항상 챙길 준비물에 추가 (학원 정보 저장)
     onRemoveBase(text)      : 항상 챙길 준비물에서 지우기
     date                    : 지금 보는 날짜 "YYYY-MM-DD"
     isClassDay(date)        : 그 학원에 가는 날인지 (정규·보충, 결석·휴원 제외)
     onPickDate(date)        : 달력에서 날짜를 고르면
     onClose, th, inp(입력칸 스타일), onToast
   ════════════════════════════════════════════════════════════════════════ */
const pad = (n) => String(n).padStart(2, "0");
const ymd = (y, m0, d) => `${y}-${pad(m0 + 1)}-${pad(d)}`;
const todayStr = () => { const t = new Date(); return ymd(t.getFullYear(), t.getMonth(), t.getDate()); };

export default function DaySupplySheet({ ac, dateLabel, dateText, date, isClassDay = () => true, onPickDate, entry, onSaveEntry, onAddBase, onRemoveBase, onClose, th, inp, onToast }) {
  const [text, setText] = useState("");
  const [always, setAlways] = useState(false);
  /* [사용자 확정 2026-11-22] 날짜 줄은 늘 보이지 않고, '다른 날'을 눌렀을 때만 편다 */
  const [pickDay, setPickDay] = useState(false);
  useEffect(() => { setText(""); setAlways(false); }, [ac && ac.id, dateText]);
  useEffect(() => { setPickDay(false); }, [ac && ac.id]);
  /* 달력에 보이는 달 — 고른 날짜의 달에서 시작 */
  const [view, setView] = useState(() => { const d = date ? new Date(date.replace(/-/g, "/")) : new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });
  useEffect(() => { if (pickDay && date) { const d = new Date(date.replace(/-/g, "/")); setView({ y: d.getFullYear(), m: d.getMonth() }); } }, [pickDay]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (!ac) return null;

  const base = ac.baseSupplies || [];
  const hidden = entry.hiddenBase || [];
  const day = entry.supplies || [];
  const shownBase = base.filter(x => !hidden.includes(x));

  const add = () => {
    const v = text.trim(); if (!v) return;
    if (always) {
      if (base.includes(v)) { onToast && onToast("이미 항상 챙길 준비물에 있어요"); return; }
      onAddBase(v);
      if (day.includes(v)) onSaveEntry({ ...entry, supplies: day.filter(x => x !== v) });   // 그날 칸에 있던 같은 이름은 항상으로 옮긴다
    } else {
      if (day.includes(v) || shownBase.includes(v)) { onToast && onToast("이미 있는 준비물이에요"); return; }
      onSaveEntry({ ...entry, supplies: [...day, v] });
    }
    setText(""); setAlways(false);
  };

  const chipS = (isBase) => ({ fontSize: FS.cardTitle, padding: "5px 10px", borderRadius: RAD.lg,
    background: isBase ? `${th.main}18` : `${C.orange}14`, color: isBase ? th.main : mixBlack(C.orange, 0.15),
    display: "flex", alignItems: "center", gap: 5, fontWeight: FW.semi });
  const xBtn = { background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14, padding: 0, opacity: 0.8 };
  const lblIcon = { fontSize: FS.cardTitle, fontWeight: FW.bold, color: C.text, display: "flex", alignItems: "center", gap: 6, margin: "0 0 8px" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,20,40,0.5)", display: "flex", alignItems: "flex-end", zIndex: 300 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "22px 22px 0 0", padding: "22px 20px 34px",
        width: "100%", maxWidth: 430, margin: "0 auto", maxHeight: "calc(var(--am-vh, 100vh) * 0.88)", overflowY: "auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: ac.color, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: FS.modalTitle, fontWeight: FW.bold, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ac.name}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <span style={{ fontSize: FS.sub, color: C.sub, fontWeight: FW.semi }}>{dateText}</span>
              <button onClick={() => setPickDay(v => !v)} aria-expanded={pickDay}
                /* 잘 안 보였다(사용자 지적 2026-11-22) → 접혀 있을 때도 테마색을 옅게 입힌다 */
                style={{ border: `1px solid ${pickDay ? th.main : `${th.main}66`}`, background: pickDay ? `${th.main}22` : `${th.main}12`, color: th.main,
                  borderRadius: 999, padding: "2px 9px", fontSize: FS.tag, fontWeight: FW.bold, cursor: "pointer", fontFamily: "inherit" }}>
                다른 날 {pickDay ? "▴" : "▾"}
              </button>
            </div>
          </div>
          <button onClick={onClose} aria-label="닫기" style={CLOSE_BTN}>✕</button>
        </div>

        {/* 날짜 — '다른 날'을 눌렀을 때만. 그 학원 가는 날만 오간다 */}
        {pickDay && (() => {
          const first = new Date(view.y, view.m, 1).getDay();
          const last = new Date(view.y, view.m + 1, 0).getDate();
          const cells = [...Array(first).fill(null), ...Array.from({ length: last }, (_, i) => i + 1)];
          const today = todayStr();
          const move = (k) => setView(v => { const d = new Date(v.y, v.m + k, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
          const nav = { width: 34, height: 30, border: "none", background: "none", fontSize: 19, fontWeight: 900, color: C.sub, cursor: "pointer" };
          return (
            <div style={{ background: "#F7F8FB", border: `1px solid ${C.border}`, borderRadius: RAD.md, padding: "8px 8px 10px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                <button onClick={() => move(-1)} aria-label="이전 달" style={nav}>‹</button>
                <span style={{ flex: 1, textAlign: "center", fontSize: FS.title, fontWeight: FW.bold, color: C.text }}>{view.y}년 {view.m + 1}월</span>
                <button onClick={() => move(1)} aria-label="다음 달" style={nav}>›</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3, textAlign: "center" }}>
                {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => (
                  <span key={w} style={{ fontSize: FS.tag, fontWeight: FW.bold, padding: "2px 0", color: i === 0 ? C.red : i === 6 ? "#4A7BD8" : C.sub }}>{w}</span>
                ))}
                {cells.map((d, i) => {
                  if (!d) return <span key={`e${i}`} />;
                  const ds = ymd(view.y, view.m, d);
                  const can = isClassDay(ds);
                  const sel = ds === date, isT = ds === today;
                  return (
                    <button key={ds} disabled={!can} onClick={() => { onPickDate(ds); setPickDay(false); }}
                      aria-label={`${view.m + 1}월 ${d}일${can ? "" : " (수업 없음)"}`}
                      style={{ height: 34, borderRadius: 10, fontFamily: "inherit", fontSize: FS.body, cursor: can ? "pointer" : "default",
                        border: isT && !sel ? `1.5px solid ${th.main}` : "1.5px solid transparent",
                        background: sel ? th.main : can ? `${ac.color || th.main}1F` : "transparent",
                        color: sel ? "#fff" : can ? C.text : "#C9CED8", fontWeight: can || sel ? FW.bold : FW.normal }}>
                      {d}
                    </button>
                  );
                })}
              </div>
              <p style={{ margin: "8px 2px 0", fontSize: FS.tag, color: C.sub }}>색칠된 날이 {ac.name}에 가는 날이에요</p>
            </div>
          );
        })()}
        <label style={lblIcon}><CareIcon name="bag" size={14} />준비물</label>
        {(shownBase.length > 0 || day.length > 0) ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {shownBase.map(x => (
              <span key={`b${x}`} style={chipS(true)}>
                <span style={{ fontSize: 10.5, fontWeight: 900, padding: "1px 6px", borderRadius: 8, background: th.main, color: "#fff" }}>항상</span>
                {x}<button aria-label={`${x} 항상에서 빼기`} onClick={() => onRemoveBase(x)} style={xBtn}>✕</button>
              </span>
            ))}
            {day.map((x, i) => (
              <span key={`d${i}`} style={chipS(false)}>
                <span style={{ fontSize: 10.5, fontWeight: 900, opacity: 0.8 }}>{dateLabel}</span>
                {x}<button aria-label={`${x} 빼기`} onClick={() => onSaveEntry({ ...entry, supplies: day.filter((_, j) => j !== i) })} style={xBtn}>✕</button>
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: FS.sub, color: C.sub, margin: "0 0 8px" }}>{dateLabel} 챙길 준비물이 없어요</p>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()}
            placeholder={always ? "항상 챙길 준비물 입력" : `${dateLabel} 준비물 입력`} style={{ ...inp, flex: 1, width: "auto", minWidth: 0, fontSize: FS.title }} />
          <button onClick={() => setAlways(v => !v)} aria-pressed={always}
            style={{ padding: "0 11px", borderRadius: RAD.sm, cursor: "pointer", fontFamily: "inherit", fontSize: FS.body, fontWeight: FW.bold, flexShrink: 0,
              border: `1.5px solid ${always ? th.main : C.border}`, background: always ? `${th.main}14` : "#fff", color: always ? th.main : "#B2B7C6",
              display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${always ? th.main : "#C9CED8"}`, background: always ? th.main : "#fff",
              color: "#fff", fontSize: 11, lineHeight: "13px", textAlign: "center", fontWeight: 900 }}>{always ? "✓" : ""}</span>
            항상
          </button>
          <button onClick={add} style={{ padding: "0 15px", borderRadius: RAD.sm, border: "none", background: th.main, color: "#fff", fontWeight: FW.normal, fontSize: FS.cardTitle, cursor: "pointer", flexShrink: 0 }}>추가</button>
        </div>
        <p style={{ fontSize: FS.tag, color: C.sub, margin: "6px 0 18px", lineHeight: 1.5 }}>
          '항상'을 체크하고 추가하면 이 학원에 가는 날마다 보여요. 체크하지 않으면 {dateLabel}만 보여요.
        </p>
        <button onClick={onClose} style={{ width: "100%", padding: 14, borderRadius: RAD.md, border: "none", background: th.grad || th.main, color: "#fff", fontSize: FS.title, fontWeight: FW.bold, cursor: "pointer", fontFamily: "inherit" }}>완료</button>{/* 넣은 내용은 바로 저장된다는 느낌으로 '완료' (사용자 확정 2026-11-26) */}
      </div>
    </div>
  );
}

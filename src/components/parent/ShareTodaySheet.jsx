/* ════════════════════════════════════════════════════════════════════════
   ShareTodaySheet — '오늘 일정'을 이미지(PNG)로 만들어 카톡 등으로 보내기
   ────────────────────────────────────────────────────────────────────────
   [사용자 요청 2026-11-26] 미세미세 앱의 '위 화면 공유하기'처럼.
     · 홈 '오늘 챙길 일' 카드 오른쪽 위 공유 아이콘 → 이 창
     · 공유용 카드(아래 ShareCard)를 화면 밖에 그려 html-to-image 로 PNG 를 만들고
       가운데에 미리보기로 띄운다
     · '이 일정 공유하기' → 앱(안드로이드)은 휴대폰 공유창(utils/native.js shareImageFile),
       브라우저는 Web Share API(파일), 파일 공유를 못 하는 곳(PC 등)은 PNG 저장 + 토스트

   공유 카드에는 누를 수 있는 것(전화·문자·준비물 수정)을 넣지 않는다 — 이미지에선 못 누른다.
   학원 카드는 모두 펼친 상태(학원 이름·수업 시간·셔틀·준비물·오늘 미션)로 그린다.

   props
     open, onClose, th
     data : ParentHomeTab 이 만든 값 그대로 (화면과 같은 계산을 쓴다)
       { childName, dateText, listLabel, alerts:[{icon,name,color,items,allDone,memo}],
         academies:[{key,kindLabel,name,emoji,color,timeText,timeColor,duration,shuttle,
                     supplies:[{label,on}], missions:[{text,done,failed}], badge }] }
     onToast(msg)
   html-to-image 는 이 창을 열 때만 불러온다(처음 화면 용량을 늘리지 않게).
   ════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState, Fragment } from "react";
import { createPortal } from "react-dom";
import { C, FS, FW, RAD, SHADOW, CLOSE_BTN, mixWhite, mixBlack, SUB_LABEL } from "../../data/tokens.js";
import CareIcon from "./CareIcons.jsx";
import EmojiIcon from "../EmojiIcon.jsx";
import { isNativeApp, shareImageFile } from "../../utils/native.js";

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";
const SUBD = "#5F678C";
const PAGE_BG = "#F5F6FA";
const CARD_W = 360;   // 이미지 폭(CSS px) — 휴대폰 화면 폭과 비슷하게. 실제 PNG 는 2배

/* 체크 칩 — 홈 화면 CheckChip 과 같은 모양이지만 누를 수 없는 그림 */
function StaticChip({ label, on, failed }) {
  const G = C.green;
  return (
    <span style={{ fontSize: FS.sub, fontWeight: FW.semi, padding: "5px 10px", borderRadius: RAD.pill, maxWidth: "100%",
      background: on ? `${G}1F` : failed ? `${C.sub}10` : "#fff", border: `1px solid ${on ? G + "88" : C.border}`,
      color: on ? G : failed ? "#A6ADBD" : SUBD, textDecoration: failed ? "line-through" : "none",
      display: "inline-flex", alignItems: "center", gap: 5, minWidth: 0, boxSizing: "border-box" }}>
      <span style={{ flexShrink: 0, display: "flex" }}><CareIcon name={on ? "check" : "checkEmpty"} size={13} /></span>
      <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{label}</span>
    </span>
  );
}

const emptyChip = { fontSize: FS.sub, fontWeight: FW.normal, padding: "3px 9px", borderRadius: RAD.lg, lineHeight: 1.5 };

/* 이미지로 찍히는 카드 — 화면 밖에 그린다 */
function ShareCard({ data, th }) {
  const { childName, dateText, listLabel, alerts = [], academies = [] } = data;
  return (
    <div style={{ width: CARD_W, boxSizing: "border-box", padding: "18px 14px 14px", background: PAGE_BG, fontFamily: F, color: C.text }}>
      {/* 맨 위 — 아이 이름 · 날짜 */}
      <div style={{ background: th.grad || th.main, borderRadius: RAD.lg, padding: "16px 16px 15px", marginBottom: 12, color: "#fff" }}>
        <p style={{ margin: 0, fontSize: 21, fontWeight: FW.bold, lineHeight: 1.3 }}>{childName ? `${childName}의 일정` : "오늘의 일정"}</p>
        <p style={{ margin: "4px 0 0", fontSize: FS.body, fontWeight: FW.semi, opacity: 0.92 }}>{dateText}</p>
      </div>

      {/* 오늘 챙길 일 — 홈 카드와 같은 줄 모양 */}
      <div style={{ background: "#fff", border: `1px solid ${th.main}22`, borderRadius: RAD.md, padding: "13px 14px 6px", boxShadow: SHADOW.sm, marginBottom: 16 }}>
        <p style={{ fontSize: FS.sub, fontWeight: FW.semi, margin: "0 0 4px", color: C.sub }}>{listLabel}</p>
        {alerts.length === 0 ? (
          <p style={{ margin: "6px 0 9px", fontSize: FS.body, fontWeight: FW.semi, color: mixBlack(th.main, 0.45), display: "flex", alignItems: "center", gap: 7 }}>
            <CareIcon name="check" size={14} />챙길 일 없어요!
          </p>
        ) : alerts.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderTop: i ? `1px solid ${C.border}` : "none" }}>
            <span style={{ flexShrink: 0, width: 84, display: "inline-flex", alignItems: "center", gap: 5, fontSize: FS.sub, fontWeight: FW.bold, color: mixBlack(a.color, 0.45), lineHeight: 1.45, paddingTop: 1 }}>
              <CareIcon name={a.icon} size={13} />{a.name}
            </span>
            <span style={{ flex: 1, minWidth: 0, fontSize: FS.body, fontWeight: FW.semi, color: C.text, lineHeight: 1.5 }}>
              {a.allDone
                ? <span style={{ fontSize: FS.tag, fontWeight: FW.bold, padding: "2px 8px", borderRadius: RAD.sm, background: `${C.green}14`, color: C.green }}>완료</span>
                : a.memo ? <span style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{a.items[0]}</span>
                : a.items.map((t, k) => (
                  <Fragment key={k}><span style={{ whiteSpace: "nowrap" }}>{t}{k < a.items.length - 1 ? <span style={{ color: C.sub, marginLeft: 5 }}>·</span> : null}</span>{k < a.items.length - 1 ? " " : null}</Fragment>
                ))}
            </span>
          </div>
        ))}
      </div>

      {/* 오늘 가는 학원 — 모두 펼친 상태 */}
      <p style={{ margin: "0 2px 8px", fontSize: FS.sub, fontWeight: FW.bold, color: C.sub }}>
        {academies.length ? `가는 학원 ${academies.length}곳` : "가는 학원"}
      </p>
      {academies.length === 0 && (
        <div style={{ background: "#fff", border: `1px solid ${C.border}`, borderRadius: RAD.md, padding: "16px", textAlign: "center", fontSize: FS.body, fontWeight: FW.semi, color: C.sub }}>
          학원이 없는 날이에요
        </div>
      )}
      {academies.map((ac) => (
        <div key={ac.key} style={{ background: "#fff", borderRadius: RAD.md, marginBottom: 10, border: `1px solid ${C.border}`, boxShadow: SHADOW.sm, overflow: "hidden", display: "flex" }}>
          <div style={{ width: 4, background: ac.color, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, padding: "11px 13px 12px 12px" }}>
            {/* 종류 · 시간 · 미션 배지 */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
              <span style={{ fontSize: FS.title, fontWeight: FW.bold, color: ac.color, minWidth: 0, overflowWrap: "anywhere" }}>{ac.kindLabel}</span>
              <span style={{ fontSize: FS.cardTitle, fontWeight: FW.normal, flexShrink: 0, color: ac.timeColor || SUBD }}>{ac.timeText}</span>
              <span style={{ flex: 1 }} />
              {ac.badge && (
                <span style={{ flexShrink: 0, fontSize: FS.tag, fontWeight: FW.semi, padding: "3px 8px", borderRadius: RAD.sm,
                  background: ac.badge.done ? `${C.green}14` : `${C.orange}14`, color: ac.badge.done ? C.green : C.orange }}>{ac.badge.text}</span>
              )}
            </div>
            {/* 학원 이름 · 수업 길이 */}
            <p style={{ margin: "9px 0 0", display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
              <span style={{ fontSize: FS.cardTitle, fontWeight: FW.bold, color: C.text, overflowWrap: "anywhere" }}>
                {ac.emoji && <EmojiIcon emoji={ac.emoji} size={FS.cardTitle} style={{ verticalAlign: "-0.18em", marginRight: 4 }} />}{ac.name}
              </span>
              {ac.duration ? <span style={{ fontSize: FS.sub, ...SUB_LABEL, whiteSpace: "nowrap" }}>· {ac.duration}분 수업</span> : null}
            </p>
            {/* 셔틀 */}
            {ac.shuttle && (
              <p style={{ margin: "8px 0 0", display: "flex", alignItems: "flex-start", gap: 5, fontSize: FS.sub, fontWeight: FW.normal, color: SUBD, lineHeight: 1.35 }}>
                <span style={{ marginTop: 1, flexShrink: 0 }}><CareIcon name="shuttle" size={13} /></span>
                <span style={{ minWidth: 0, whiteSpace: "pre-wrap" }}>
                  {ac.shuttle.time ? <><span style={{ fontWeight: FW.bold, color: C.text }}>{ac.shuttle.time}</span>{"  "}<span style={SUB_LABEL}>{ac.shuttle.place}</span></> : ac.shuttle.raw}
                </span>
              </p>
            )}
            {/* 준비물 · 오늘 미션 */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, color: SUBD }}>
                  <CareIcon name="bag" size={14} /><span style={{ fontSize: FS.tag, ...SUB_LABEL }}>준비물</span>
                </span>
                {ac.supplies.length
                  ? ac.supplies.map((s, i) => <StaticChip key={i} label={s.label} on={s.on} />)
                  : <span style={{ ...emptyChip, background: mixWhite(th.main, 0.9), color: SUBD }}>없음</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, color: SUBD }}>
                  <CareIcon name="mission" size={14} /><span style={{ fontSize: FS.tag, ...SUB_LABEL }}>오늘 미션</span>
                </span>
                {ac.missions.length
                  ? ac.missions.map((m, i) => <StaticChip key={i} label={m.text} on={!!m.done} failed={!!m.failed} />)
                  : <span style={{ ...emptyChip, background: mixWhite(th.main, 0.9), color: SUBD }}>없음</span>}
              </div>
            </div>
          </div>
        </div>
      ))}

      <p style={{ margin: "12px 0 0", textAlign: "center", fontSize: 11, fontWeight: FW.semi, color: "#A6ADBD" }}>미션팡</p>
    </div>
  );
}

const dataUrlToFile = async (dataUrl, name) => {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], name, { type: "image/png" });
};

export default function ShareTodaySheet({ open, onClose, data, th, onToast }) {
  const cardRef = useRef(null);
  const [img, setImg] = useState(null);       // 만든 PNG (data URL)
  const [state, setState] = useState("idle"); // idle | making | ready | error
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) { setImg(null); setState("idle"); return; }
    let cancelled = false;
    setState("making");
    (async () => {
      try {
        const { toPng } = await import("html-to-image");
        try { await document.fonts?.ready; } catch { /* 무시 */ }
        await new Promise(r => setTimeout(r, 60));   // 화면 밖 카드가 다 그려질 때까지
        const node = cardRef.current;
        if (!node) throw new Error("no node");
        const opts = { pixelRatio: 2, backgroundColor: PAGE_BG, cacheBust: false };
        await toPng(node, opts).catch(() => null);   // 첫 번째는 글꼴·그림을 불러오기만 한다(일부 기기에서 첫 장이 빈 칸으로 나와서)
        const url = await toPng(node, opts);
        if (!cancelled) { setImg(url); setState("ready"); }
      } catch (e) {
        if (!cancelled) setState("error");
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  if (!open) return null;

  const fileName = `missionpang-${(data.dateKey || "today")}.png`;
  const title = data.childName ? `${data.childName}의 일정 (${data.dateText})` : `오늘의 일정 (${data.dateText})`;

  const doShare = async () => {
    if (!img || busy) return;
    setBusy(true);
    try {
      if (isNativeApp()) {
        const r = await shareImageFile(img, fileName, title);
        if (!r.ok && r.reason !== "cancel") onToast && onToast("공유 창을 열지 못했어요");
        return;
      }
      const file = await dataUrlToFile(img, fileName);
      if (navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title }); }
        catch (e) { if (e && e.name !== "AbortError") onToast && onToast("공유하지 못했어요"); }
        return;
      }
      // 파일 공유를 못 하는 곳(PC 등) — PNG 내려받기
      const a = document.createElement("a");
      a.href = img; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
      onToast && onToast("이미지가 저장되었어요!");
    } finally {
      setBusy(false);
    }
  };

  /* body 바로 아래로 띄운다 — 홈 화면 안에 두면 하단 메뉴가 창 아래쪽(공유 버튼)을 덮었다 */
  return createPortal(
    <>
      {/* 이미지로 찍을 카드 — 화면 밖(보이지 않게). 바깥 상자만 밖으로 빼고, 찍는 카드는 보통 배치 그대로 */}
      <div aria-hidden="true" style={{ position: "fixed", left: -10000, top: 0, pointerEvents: "none" }}>
        <div ref={cardRef}><ShareCard data={data} th={th} /></div>
      </div>

      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,20,40,0.55)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}>
        <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 400,
          maxHeight: "92vh", display: "flex", flexDirection: "column", boxSizing: "border-box", padding: "16px 16px 16px", fontFamily: F }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <p style={{ margin: 0, flex: 1, minWidth: 0, fontSize: 17, fontWeight: 900, color: C.text }}>일정 공유</p>
            <button onClick={onClose} aria-label="닫기" className="jelly-tap" style={CLOSE_BTN}>✕</button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", borderRadius: 14, background: PAGE_BG, border: `1px solid ${C.border}` }}>
            {state === "ready" && img
              ? <img src={img} alt="공유할 일정 이미지" style={{ display: "block", width: "100%", height: "auto" }} />
              : <p style={{ margin: 0, padding: "60px 16px", textAlign: "center", fontSize: FS.body, fontWeight: FW.semi, color: C.sub }}>
                  {state === "error" ? "이미지를 만들지 못했어요. 잠시 뒤 다시 열어 주세요." : "이미지를 만드는 중이에요…"}
                </p>}
          </div>
          <button onClick={doShare} disabled={state !== "ready" || busy} className="jelly-tap"
            style={{ width: "100%", marginTop: 14, padding: 15, borderRadius: 14, border: "none", background: th.grad || th.main,
              color: "#fff", fontSize: 17, fontWeight: 700, cursor: state === "ready" ? "pointer" : "default",
              opacity: state === "ready" && !busy ? 1 : 0.5, fontFamily: F }}>
            이 일정 공유하기
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

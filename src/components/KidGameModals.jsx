import { useState } from "react";
import EmojiIcon, { EmojiText } from "./EmojiIcon.jsx";
import { C, GAME_MODAL_STYLE, mixWhite, mixBlack } from "../data/tokens.js";
import { TITLE_RARITY } from "../data/characters.js";
import { getAvatarItem, itemLabel, itemEmoji } from "../data/avatarEquipment.js";

/* ════════════════════════════════════════════════════════════════════════
   아이 화면 게임 팝업 — 보물상자 획득 · 레벨업/진화 · 보물 발견(상자 열기) · 상장 · 성장 장비 선물
   App.jsx 에서 분리 (CLAUDE.md 3). 큐·상태는 App 이 그대로 들고 있고 여기는 그리기만 한다.

   [사용자 확정 2026-11-27] 탐험 테마 팝업 정리
   · 보상·안내 영역은 '버튼처럼 보이지 않는' 크림 정보 카드(#FFFBF0 · 테두리 #E5DEC9 · 진한 갈색 글씨)
   · [확인]은 따뜻한 오렌지·골드 한 가지로 통일 (형광 핑크 테마 그라데이션 사용 안 함)
   · 헤더는 쨍한 원색 대신 부드러운 파스텔 톤 + 진한 글씨
   · 상장: 보상은 크림 카드, [확인]은 진한 네이비
   · 'TREASURE OPEN' → '보물 발견!'
   베이커리(cute) 모드는 원래 디자인 그대로 둔다.
   ════════════════════════════════════════════════════════════════════════ */

export const EX = {
  card: "#FFFBF0", cardBd: "#E5DEC9", ink: "#4A3420", sub: "#8A7458",
  btn: "linear-gradient(180deg,#F6B95A 0%,#E48A2C 100%)",
  btnShadow: "0 3px 0 #C8701D, 0 8px 18px rgba(228,138,44,.28)",
  navy: "#1E2547",
};
/* 헤더 — 종류별 부드러운 톤 (글씨는 진한 색) */
const EX_HEAD = {
  level:    { bg: "linear-gradient(160deg,#FFEBB8 0%,#F2BD66 100%)", ink: "#5A3A12" },
  box:      { bg: "linear-gradient(160deg,#FFF1CC 0%,#EEC679 100%)", ink: "#5A3A12" },
  title:    { bg: "linear-gradient(160deg,#FFEFC2 0%,#EAC06A 100%)", ink: "#5A3A12" },
  gear:     { bg: "linear-gradient(160deg,#E6F4D8 0%,#A9D08B 100%)", ink: "#2E4E1C" },
  treasure: { bg: "linear-gradient(160deg,#FFF0C4 0%,#E8BE63 100%)", ink: "#5A3A12" },
};
/* 상자 등급별 헤더(데이터의 원색 그라데이션) → 탐험 팝업용 부드러운 톤 */
const SOFT_BOX_HEAD = {
  "linear-gradient(135deg,#94A3B8,#CBD5E1)": { bg: "linear-gradient(160deg,#F2F4F7 0%,#C9D2DD 100%)", ink: "#34404F" },
  "linear-gradient(135deg,#3B82F6,#60A5FA)": { bg: "linear-gradient(160deg,#E4F0FC 0%,#A6C8EC 100%)", ink: "#1F3D63" },
  "linear-gradient(135deg,#F59E0B,#FDE68A)": EX_HEAD.treasure,
};

const SPARKLES = (cute) => (cute ? ["🧁", "🍪", "🎀", "🌸", "🧁"] : ["✨", "⭐", "✨", "💫", "⭐"]);
function Sparkles({ cute }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {SPARKLES(cute).map((s, i) => (
        <span key={i} style={{ position: "absolute", left: `${18 + i * 16}%`, top: `${34 + (i % 2) * 12}%`, fontSize: 24, animation: `sparkleFloat ${0.9 + i * 0.12}s ease-out infinite`, animationDelay: `${i * 0.12}s` }}>
          {s}
        </span>
      ))}
    </div>
  );
}

/* 크림 정보 카드 — 버튼과 헷갈리지 않게 얇은 테두리·차분한 글씨 */
export function InfoCard({ children, ink = EX.ink, style }) {
  return (
    <div style={{ background: EX.card, border: `1px solid ${EX.cardBd}`, color: ink, borderRadius: 14,
      padding: "11px 12px", fontSize: 13, fontWeight: 800, lineHeight: 1.55, ...style }}>
      {children}
    </div>
  );
}
const lines = (txt) => String(txt).split("\n").map((l, i) => <div key={i}><EmojiText>{l}</EmojiText></div>);

/* 탐험 버튼 — main(오렌지 골드) · sub(크림 외곽선) · navy(상장) */
export function ExButton({ children, onClick, tone = "main", style }) {
  const t = tone === "navy"
    ? { background: EX.navy, color: "#fff", boxShadow: "0 6px 16px rgba(30,37,71,.28)", border: "none" }
    : tone === "sub"
      ? { background: "#fff", color: "#8A5A1E", boxShadow: "none", border: `1.5px solid ${EX.cardBd}` }
      : { background: EX.btn, color: "#fff", boxShadow: EX.btnShadow, border: "none", textShadow: "0 1px 1px rgba(150,80,10,.35)" };
  return (
    <button onClick={onClick} style={{ width: "100%", borderRadius: 14, padding: "13px 10px", fontSize: 15, fontWeight: 900,
      cursor: "pointer", fontFamily: "inherit", ...t, ...style }}>
      {children}
    </button>
  );
}

/* 성장 장비 썸네일 */
function GearThumb({ id, gender }) {
  const [failed, setFailed] = useState(false);
  const it = getAvatarItem(id);
  if (!it) return null;
  const src = (gender === "girl" && it.thumbGirl) || it.thumb;
  return (
    <div style={{ flex: "1 1 0", minWidth: 0, maxWidth: 130, background: "#fff", border: `1px solid ${EX.cardBd}`, borderRadius: 14,
      padding: "10px 6px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ width: 64, height: 56, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {src && !failed
          ? <img src={"/" + src.replace(/^\/+/, "")} alt="" draggable={false} onError={() => setFailed(true)}
              style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          : <span style={{ fontSize: 34 }}>{itemEmoji(it, gender)}</span>}
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 900, color: EX.ink, lineHeight: 1.25, wordBreak: "keep-all" }}>{itemLabel(it, gender)}</span>
    </div>
  );
}

/* ── 상장 ─────────────────────────────────────────────────────────────── */
function CertCard({ ev, cute, onClose, more }) {
  const rar = TITLE_RARITY[ev.rarity] || TITLE_RARITY.common;
  const cFrame   = cute ? "linear-gradient(135deg,#f7c6d6,#f3a8c0)" : "linear-gradient(135deg,#1e2547,#0f1430)";
  const cPaper   = cute
    ? "radial-gradient(circle at 18% 12%, rgba(255,255,255,.6), transparent 45%), linear-gradient(160deg,#fff6f3,#ffeef2)"
    : "radial-gradient(circle at 20% 15%, rgba(245,179,1,.05), transparent 40%), radial-gradient(circle at 80% 90%, rgba(245,179,1,.06), transparent 40%), linear-gradient(160deg,#fbf6e9,#f3ead0)";
  const cBorder  = cute ? "rgba(231,140,170,.5)" : "rgba(180,140,40,.45)";
  const cInner   = cute ? "rgba(231,140,170,.14)" : "rgba(180,140,40,.12)";
  const cEyebrow = cute ? "#d06a92" : "#9a7b1e";
  const cTitle   = cute ? "#7a4257" : "#1e2547";
  const cRibbon  = cute ? "linear-gradient(90deg,#f3a8c0,#ffd1c2)" : "linear-gradient(90deg,#caa23a,#f5d062)";
  const cName    = cute ? "#7a4257" : "#1e2547";
  const cReason  = cute ? "#7d5f68" : "#4a4636";
  const cSealBg  = cute ? "radial-gradient(circle at 35% 30%,#ffd6e2,#f3a8c0)" : "radial-gradient(circle at 35% 30%,#f5d062,#caa23a)";
  const cSealTx  = cute ? "#9c3a63" : "#5a4410";
  const cSealSh  = cute ? "0 3px 8px rgba(200,90,130,.35)" : "0 3px 8px rgba(120,90,10,.4)";
  const sealMark = cute ? "✿" : "★";
  return (
    <div style={{ width: "100%", maxWidth: 330, borderRadius: 18, overflow: "hidden", background: cFrame, padding: 9, animation: "gamePop .5s cubic-bezier(.18,.9,.32,1.2)", position: "relative", boxShadow: "0 25px 90px rgba(0,0,0,.45)" }}>
      <div style={{ position: "relative", borderRadius: 10, padding: "30px 26px 26px", textAlign: "center", background: cPaper }}>
        <div style={{ position: "absolute", inset: 9, borderRadius: 5, border: `1.5px solid ${cBorder}`, boxShadow: `inset 0 0 0 4px ${cInner}`, pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, borderRadius: 10, overflow: "hidden", pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: 0, left: "-60%", width: "45%", height: "100%", background: "linear-gradient(105deg,transparent,rgba(255,255,255,.5),transparent)", transform: "skewX(-18deg)", animation: "shineMove 3.2s ease-in-out infinite" }} />
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ lineHeight: 1, marginBottom: 6, filter: "drop-shadow(0 3px 6px rgba(0,0,0,.18))" }}><EmojiIcon emoji={ev.emoji} size={50} /></div>
          <div style={{ fontSize: 11, letterSpacing: 5, fontWeight: 800, color: cEyebrow, marginBottom: 6 }}>CERTIFICATE</div>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 8, color: cTitle, marginBottom: 4 }}>상 장</div>
          <div style={{ display: "inline-block", height: 3, width: 54, borderRadius: 2, background: cRibbon, margin: "10px auto 16px" }} />
          <div style={{ fontSize: 21, fontWeight: 900, color: cName, marginBottom: 3 }}>{ev.name}</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: rar.color, marginBottom: 16 }}>{rar.icon} {rar.name}</div>
          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.75, color: cReason, marginBottom: 20, wordBreak: "keep-all", whiteSpace: "pre-line" }}>{ev.desc}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginBottom: cute ? 24 : 16 }}>
            <div style={{ width: 50, height: 50, borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 900, flexShrink: 0, transform: "rotate(-12deg)", background: cSealBg, color: cSealTx, boxShadow: cSealSh }}>
              <span style={{ fontSize: 17, lineHeight: 1 }}>{sealMark}</span>수여
            </div>
          </div>
          {cute ? (<>
            {ev.reward && (
              <div style={{ borderRadius: 11, padding: "10px 12px", fontSize: 13, fontWeight: 900, marginBottom: 10, marginTop: 6, background: "#fff", color: "#c25c84", border: "1px solid rgba(231,140,170,.45)" }}>
                {lines(ev.reward)}
              </div>
            )}
            <button onClick={onClose}
              style={{ marginTop: ev.reward ? 2 : 18, width: "100%", border: "none", borderRadius: 13, padding: 13, fontSize: 15, fontWeight: 900, cursor: "pointer", background: "linear-gradient(135deg,#f3a8c0,#f7c6d6)", color: "#7a4257" }}>
              확인 {more > 0 ? `(${more}개 더)` : ""}
            </button>
          </>) : (<>
            {ev.reward && <InfoCard ink={EX.navy} style={{ marginBottom: 14, fontWeight: 900 }}>{lines(ev.reward)}</InfoCard>}
            <ExButton tone="navy" onClick={onClose}>확인 {more > 0 ? `(${more}개 더)` : ""}</ExButton>
          </>)}
        </div>
      </div>
    </div>
  );
}

/* ── 통합 게임 이벤트 팝업 (레벨업·진화·상자 획득·펫·성장 장비) ─────────────── */
/* props: ev(지금 띄울 이벤트 1개), more(뒤에 남은 개수), cute, th, GP,
          onClose(), onWearGear(ev) — 성장 장비 '바로 갈아입기' */
export function GameEventModal({ ev, more = 0, cute, th, GP, onClose, onWearGear }) {
  if (!ev) return null;
  const gear = ev.type === "gear";
  const head = cute ? null : (EX_HEAD[ev.type] || EX_HEAD.level);
  const cuteHead = ev.type === "level"
    ? `linear-gradient(135deg, ${th.main}, ${mixWhite(th.main, 0.4)})`
    : ev.type === "title" ? "linear-gradient(135deg,#F5B301,#FFD98E)"
      : ev.type === "box" ? "linear-gradient(135deg,#F8A5C2,#FAD0C4)"
        : `linear-gradient(135deg, ${th.main}, ${mixWhite(th.main, 0.4)})`;
  const moreTx = more > 0 ? ` (${more}개 더)` : "";
  return (
    /* z10000: 보물창고 시트(4000)·상자 결과(9999) 위, 토스트(99999) 아래.
       key=ev.id — 다음 팝업으로 넘어갈 때 새로 그려 등장 애니메이션이 다시 돈다(이전 것과 겹쳐 보이지 않게) */
    <div key={ev.id} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: 20 }}>
      <Sparkles cute={cute} />
      {ev.cert ? <CertCard ev={ev} cute={cute} onClose={onClose} more={more} /> : (
        <div style={{ width: "100%", maxWidth: 350, borderRadius: cute ? 32 : 26, overflow: "hidden", background: "#fff", textAlign: "center",
          boxShadow: cute ? `0 25px 90px ${th.main}44, 0 8px 28px rgba(0,0,0,.18)` : "0 25px 90px rgba(0,0,0,.38)",
          animation: "gamePop .45s ease-out", position: "relative", border: cute ? `2px solid ${mixWhite(th.main, 0.55)}` : "none" }}>
          {/* 헤더 */}
          <div style={{ position: "relative", overflow: "hidden", padding: "26px 20px 22px", color: cute ? "#6B4A5C" : head.ink, background: cute ? cuteHead : head.bg }}>
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent, rgba(255,255,255,${cute ? 0.45 : 0.35}), transparent)`, animation: "shineMove 1.8s ease-in-out infinite" }} />
            {ev.charImg
              ? <div style={{ margin: "0 0 6px", position: "relative", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 6 }}>
                  <img src={ev.charImgPrev || ev.charImg} alt="진화 전 캐릭터" draggable={false}
                    style={{ display: "block", height: 88, width: "auto", maxWidth: "none", opacity: 0.55, filter: "grayscale(0.35) drop-shadow(0 4px 8px rgba(0,0,0,0.18))", marginBottom: 10 }} />
                  <div style={{ fontSize: 22, fontWeight: 900, color: cute ? "#DE869C" : "#B7741F", marginBottom: 44, animation: "jellyIn 0.55s ease-out 0.15s backwards" }}>➜</div>
                  <img src={ev.charImg} alt="진화한 캐릭터" draggable={false}
                    style={{ display: "block", height: 148, width: "auto", maxWidth: "none", filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.25))", animation: "jellyIn 0.55s ease-out 0.25s backwards" }} />
                </div>
              : <p style={{ margin: "0 0 8px", position: "relative" }}><EmojiIcon emoji={ev.emoji} size={56} /></p>}
            <p style={{ fontSize: cute ? 22 : 23, fontWeight: 900, margin: 0, position: "relative" }}>{ev.title}</p>
          </div>
          {/* 본문 */}
          <div style={{ padding: "20px 20px 22px" }}>
            {ev.name && <p style={{ fontSize: gear ? 17 : 20, fontWeight: 900, color: cute ? C.text : EX.ink, margin: "0 0 6px", lineHeight: 1.35, wordBreak: "keep-all" }}><EmojiText>{ev.name}</EmojiText></p>}
            {ev.desc && <p style={{ fontSize: 13, fontWeight: 800, color: cute ? C.sub : EX.sub, margin: "0 0 14px", lineHeight: 1.5, wordBreak: "keep-all", whiteSpace: "pre-line" }}>{ev.desc}</p>}
            {gear && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
                {(ev.ids || []).map((id) => <GearThumb key={id} id={id} gender={ev.gender} />)}
              </div>
            )}
            {ev.reward && (cute
              ? <div style={{ background: mixWhite(th.main, 0.86), border: `1px solid ${mixWhite(th.main, 0.6)}`, color: mixBlack(th.main, 0.25), borderRadius: 14, padding: "11px 12px", fontSize: 13, fontWeight: 900, marginBottom: 16, lineHeight: 1.5 }}>{lines(ev.reward)}</div>
              : <InfoCard style={{ marginBottom: 16 }}>{lines(ev.reward)}</InfoCard>)}
            {gear && ev.held && ev.held.length > 0 ? (
              /* 그 칸에 산 꾸미기를 입고 있으면 덮어쓰지 않고 고르게 한다 */
              <div style={{ display: "flex", gap: 8 }}>
                <ExButton tone="sub" onClick={onClose} style={{ flex: 1, fontSize: 14 }}>옷장에 넣어두기</ExButton>
                <ExButton onClick={() => { onWearGear && onWearGear(ev); onClose(); }} style={{ flex: 1, fontSize: 14 }}>바로 갈아입기</ExButton>
              </div>
            ) : cute ? (
              <button onClick={onClose}
                style={{ width: "100%", border: "none", borderRadius: 14, padding: "13px", background: th.grad, color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer" }}>
                확인{moreTx}
              </button>
            ) : (
              <ExButton onClick={onClose}>확인{moreTx}</ExButton>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── 보물 발견! (상자 열기 결과) ───────────────────────────────────────── */
export function TreasureResultModal({ tm, cute, th, GP, TM, onClose }) {
  if (!tm) return null;
  const head = cute ? null : (SOFT_BOX_HEAD[tm.headerGrad] || EX_HEAD.treasure);
  return (
    <div style={GAME_MODAL_STYLE.overlay}>
      <Sparkles cute={cute} />
      <div style={cute ? { ...GAME_MODAL_STYLE.card, borderRadius: 32, border: `2px solid ${mixWhite(th.main, 0.55)}`, boxShadow: `0 25px 90px ${th.main}44, 0 8px 28px rgba(0,0,0,.18)` } : { ...GAME_MODAL_STYLE.card, borderRadius: 26 }}>
        <div style={{ padding: "26px 20px 22px", textAlign: "center", position: "relative", overflow: "hidden",
          color: cute ? "#6B4A5C" : head.ink,
          background: cute ? (tm.headerGrad || `linear-gradient(135deg, ${GP.gold}, ${th.main})`) : head.bg }}>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent, rgba(255,255,255,${cute ? 0.4 : 0.35}), transparent)`, animation: "shineMove 1.8s ease-in-out infinite" }} />
          <p style={{ margin: "0 0 8px", position: "relative" }}><EmojiIcon emoji={tm.emoji} size={56} /></p>
          <p style={{ margin: 0, fontSize: cute ? 22 : 23, fontWeight: 900, position: "relative" }}>{cute ? "DESSERT BOX" : "보물 발견!"}</p>
        </div>
        <div style={{ ...GAME_MODAL_STYLE.body, textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 900, color: cute ? C.sub : EX.sub, margin: "0 0 8px" }}>{tm.boxName}</p>
          <p style={{ fontSize: 30, fontWeight: 900, color: cute ? th.main : "#C98A12", margin: "0 0 4px" }}><EmojiIcon emoji={TM.coinEmoji} size={30} style={{ verticalAlign: "-0.18em", marginRight: 3 }} />+{tm.rewardCoin}</p>
          <p style={{ fontSize: 13, color: cute ? C.sub : EX.sub, fontWeight: 800, margin: "0 0 16px" }}>
            {cute ? `${TM.box} 보상을 받았어요!` : `${TM.box} 보상을 획득했어요!`}
          </p>
          {tm.titleReward && (cute ? (
            <div style={{ marginTop: 18, marginBottom: 16, padding: "14px", borderRadius: 14, background: mixWhite(th.main, 0.86), border: "2px solid #F5B301" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#F5B301" }}>✨ 전설 상장 획득</p>
              <p style={{ fontSize: 20, fontWeight: 900, margin: "6px 0 0", color: C.text }}>
                <EmojiIcon emoji={tm.titleReward.emoji} size={20} style={{ verticalAlign: "-0.18em", marginRight: 4 }} />{tm.titleReward.name}
              </p>
            </div>
          ) : (
            <InfoCard style={{ marginTop: 4, marginBottom: 16, padding: "13px 12px" }}>
              <p style={{ margin: 0, fontSize: 12.5, fontWeight: 900, color: "#A8761A" }}>✨ 전설 상장 획득</p>
              <p style={{ fontSize: 19, fontWeight: 900, margin: "5px 0 0", color: EX.ink }}>
                <EmojiIcon emoji={tm.titleReward.emoji} size={19} style={{ verticalAlign: "-0.18em", marginRight: 4 }} />{tm.titleReward.name}
              </p>
            </InfoCard>
          ))}
          {cute
            ? <button onClick={onClose} style={{ width: "100%", border: "none", borderRadius: 16, padding: "14px", background: th.grad, color: "#fff", fontWeight: 900, fontSize: 16, cursor: "pointer", boxShadow: "0 6px 18px rgba(0,0,0,.12)" }}>확인</button>
            : <ExButton onClick={onClose}>확인</ExButton>}
        </div>
      </div>
    </div>
  );
}

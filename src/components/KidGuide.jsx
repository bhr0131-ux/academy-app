import { useState } from "react";
import EmojiIcon from "./EmojiIcon.jsx";
import { KID_PAPER } from "../data/tokens.js";
import { TILE_ACCENT } from "./HomeSheet.jsx";
import { GROWTH_GEAR, getAvatarItem, itemLabel, itemEmoji } from "../data/avatarEquipment.js";

/* ════════════════════════════════════════════════════════════════════════
   아이 모드 첫 안내 (탐험) — 5단계 (사용자 확정 2026-11-28)
   ────────────────────────────────────────────────────────────────────────
   · 다른 탐험 팝업처럼 위쪽 파스텔 헤더 안에 그림·제목
   · 설명과 페이지 점 사이에 '실제 화면 미니 미리보기'
       1 탐험 탭 / 2 미션 탭 / 3 캐릭터 탭 — 실제 탭 줄(HomeSheet)과 같은 색으로 그 탭만 강조
       4 맨 위 상태바(💎 코인 | ⭐ 점수 | 🔥 연속)
       5 레벨별 성장 장비 그림 (아이 성별에 맞춰, 진화 단계 1~5)
   · 점 5개·버튼은 오렌지·골드(#F97316 → #F59E0B)
   베이커리 안내는 helpers.jsx KidCoachmark 의 기존 모양을 그대로 쓴다.

   props: onFinish, gender("boy"|"girl"), TM(용어), coin, xp, streak (상태바 미리보기 숫자)
   ════════════════════════════════════════════════════════════════════════ */

const ORANGE = "linear-gradient(135deg,#F97316 0%,#F59E0B 100%)";
const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

const STEPS = [
  { icon: "🗺️", title: "오늘 갈 곳을 확인해요", desc: "탐험 탭에서 오늘 갈 곳과 시간,\n챙길 준비물을 볼 수 있어요.",
    head: "linear-gradient(160deg,#F6EAD8 0%,#D9B88A 100%)", ink: "#5A3E22", preview: { tab: "area" } },
  { icon: "🎯", title: "미션을 해내요", desc: "미션 탭에서 할 일을 눌러 완료하면\n코인(💎)과 점수(⭐)를 받아요.",
    head: "linear-gradient(160deg,#E4F0FC 0%,#A6C8EC 100%)", ink: "#1F3D63", preview: { tab: "today" } },
  { icon: "💎", title: "코인을 모아요!", desc: "간식 같은 보상을 받고\n내 캐릭터도 꾸밀 수 있어요.",
    head: "linear-gradient(160deg,#EEF4D8 0%,#BFD08A 100%)", ink: "#3E5526", preview: { tab: "growth" } },
  { icon: "⭐", title: "점수를 모아요!", desc: "레벨이 오르고 보물상자도 받아요.\n연속으로 해내면 펫이 진화해요!",
    head: "linear-gradient(160deg,#FFEBB8 0%,#F2BD66 100%)", ink: "#5A3A12", preview: { status: true } },
  { icon: "🎁", title: "레벨업하면 장비를 선물받아요!", desc: "레벨이 올라 진화할 때마다\n멋진 탐험 장비를 하나씩 선물받아요!",
    head: "linear-gradient(160deg,#FFE7DC 0%,#F6B48E 100%)", ink: "#5A2A14", preview: { gear: true } },
];

/* 💎·⭐ 를 앱 이모지 그림으로 (폰 기본 이모지와 섞이면 튄다) */
const withIcons = (txt) => txt.split(/(💎|⭐)/).map((s, k) => (s === "💎" || s === "⭐")
  ? <EmojiIcon key={k} emoji={s} size={16} style={{ verticalAlign: "-2px", margin: "0 1px" }} /> : s);

/* ── 미리보기: 탐험 | 미션 | 캐릭터 탭 줄 (실제 HomeSheet 탭과 같은 색) ── */
function TabBarPreview({ active }) {
  const tabs = [{ k: "area", t: "탐험" }, { k: "today", t: "미션" }, { k: "growth", t: "캐릭터" }];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: 8, borderRadius: 14, background: KID_PAPER.sheet, border: "1px solid #EFE3CF" }}>
      {tabs.map(({ k, t }) => {
        const on = k === active, ac = TILE_ACCENT[k];
        return (
          <span key={k} style={{ padding: "6px 4px", borderRadius: 11, fontFamily: F, fontSize: 13.5, lineHeight: 1.2, whiteSpace: "nowrap",
            border: on ? `2px solid ${ac.border}` : "1.5px solid #E6DAC3", background: on ? ac.bg : KID_PAPER.chip,
            color: on ? ac.text : "#B7A88F", boxShadow: on ? "0 3px 10px rgba(155,114,74,0.18)" : "none",
            transform: on ? "scale(1.04)" : "none" }}>{t}</span>
        );
      })}
    </div>
  );
}

/* ── 미리보기: 맨 위 상태바 (💎 코인 | ⭐ 점수 | 🔥 연속) ── */
function StatusPreview({ TM, coin, xp, streak }) {
  const items = [
    { e: TM.coinEmoji || "💎", n: Number(coin || 0).toLocaleString(), u: "" },
    { e: TM.xpEmoji || "⭐", n: Number(xp || 0).toLocaleString(), u: TM.xpUnit || "점" },
    { e: "🔥", n: String(streak || 0), u: "일" },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "7px 10px", borderRadius: 11,
      background: "#fff", border: "1px solid #EFE3CF", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", fontFamily: F, whiteSpace: "nowrap" }}>
      {items.map((it, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          {i > 0 && <span aria-hidden="true" style={{ width: 1, height: 11, background: "rgba(0,0,0,0.08)", marginRight: 10 }} />}
          <EmojiIcon emoji={it.e} size={14} />
          <span><span style={{ fontSize: 14, color: "#2F2416" }}>{it.n}</span>{it.u && <span style={{ fontSize: 11, color: "#9CA3AF" }}>{it.u}</span>}</span>
        </span>
      ))}
    </div>
  );
}

/* ── 미리보기: 진화 단계별 성장 장비 (Lv.1·5·9·13·17) ── */
function GearPreview({ gender }) {
  const g = gender === "girl" ? "girl" : "boy";
  const table = GROWTH_GEAR[g];
  const lvs = Object.keys(table).map(Number).sort((a, b) => a - b);
  return (
    <div style={{ display: "flex", alignItems: "stretch", justifyContent: "center", gap: 1, margin: "0 -6px" }}>
      {lvs.map((lv, i) => {
        const it = getAvatarItem(table[lv][0]);   // 4단계 남아(가방+카메라)는 대표로 첫 장비(가방)
        if (!it) return null;
        const src = (g === "girl" && it.thumbGirl) || it.thumb;
        return (
          <div key={lv} style={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            {i > 0 && <span aria-hidden="true" style={{ fontSize: 10, color: "#D2B48C", fontWeight: 900 }}>›</span>}
            <div style={{ width: 46, padding: "5px 2px 4px", borderRadius: 11, background: "#fff", border: "1px solid #EFE3CF",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ width: 36, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {src
                  ? <img src={"/" + src.replace(/^\/+/, "")} alt={itemLabel(it, g)} draggable={false} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  : <span style={{ fontSize: 24 }}>{itemEmoji(it, g)}</span>}
              </div>
              <span style={{ fontFamily: F, fontSize: 10.5, color: "#A8611A", lineHeight: 1.1 }}>Lv.{lv}</span>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#9A8A74", lineHeight: 1.1 }}>{i + 1}단계</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function KidGuide({ onFinish, gender = "boy", TM = {}, coin = 0, xp = 0, streak = 0 }) {
  const [i, setI] = useState(0);
  const last = i === STEPS.length - 1;
  const c = STEPS[i];
  const pv = c.preview || {};
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(15,16,30,0.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", wordBreak: "keep-all" }}>
      <div style={{ background: "#fff", borderRadius: 26, overflow: "hidden", width: "100%", maxWidth: 340, boxSizing: "border-box", textAlign: "center",
        boxShadow: "0 24px 70px rgba(0,0,0,0.32)", display: "flex", flexDirection: "column" }}>
        {/* 헤더 — 그림·제목 */}
        <div key={i} style={{ position: "relative", overflow: "hidden", padding: "26px 18px 20px", background: c.head, color: c.ink, animation: "popInUp .25s ease both" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent)", animation: "shineMove 1.8s ease-in-out infinite" }} />
          <div style={{ position: "relative", height: 56, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}><EmojiIcon emoji={c.icon} size={50} /></div>
          <p style={{ position: "relative", fontSize: last ? 19 : 21, fontWeight: 900, margin: 0, lineHeight: 1.3 }}>{c.title}</p>
        </div>
        {/* 본문 — 설명 · 미리보기 · 점 · 버튼 (높이를 고정해 장마다 카드가 들썩이지 않게) */}
        <div style={{ display: "flex", flexDirection: "column", padding: "18px 20px 20px" }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#5A4A3A", lineHeight: 1.65, margin: 0, minHeight: 50, whiteSpace: "pre-line" }}>{withIcons(c.desc)}</p>
          <div style={{ minHeight: 86, display: "flex", flexDirection: "column", justifyContent: "center", margin: "14px 0 4px" }}>
            {pv.tab && <TabBarPreview active={pv.tab} />}
            {pv.status && <StatusPreview TM={TM} coin={coin} xp={xp} streak={streak} />}
            {pv.gear && <GearPreview gender={gender} />}
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "12px 0 16px" }}>
            {STEPS.map((_, idx) => (<span key={idx} style={{ width: idx === i ? 22 : 8, height: 8, borderRadius: 99, background: idx === i ? ORANGE : "#EDE3D2", transition: "all .25s" }} />))}
          </div>
          <button onClick={() => (last ? onFinish() : setI(i + 1))} style={{ width: "100%", padding: 15, borderRadius: 15, border: "none", background: ORANGE, color: "#fff",
            fontSize: 17, fontWeight: 900, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 3px 0 #C8701D, 0 8px 18px rgba(249,115,22,.28)", textShadow: "0 1px 1px rgba(150,80,10,.35)" }}>
            {last ? "시작하기 🎉" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}

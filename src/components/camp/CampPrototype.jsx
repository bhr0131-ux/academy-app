import { useLayoutEffect, useRef, useState } from "react";

/* ════════════════════════════════════════════════════════════════════════
   CampPrototype — 캐릭터 탭 '캠프' 배치 시안 (개발자 도구 전용)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-03] 캐릭터 탭을 목록에서 캠프 장면으로 바꾸기로 했다.
   원화(배경·텐트·스테이션 8장)를 받기 전에 '크기·간격·터치감'부터 확정하려고
   이모지로 자리만 잡아 본다. 여기서 정한 숫자가 그대로 원화 주문서가 된다.

   실제 앱 화면은 건드리지 않는다 — 개발자 도구에서만 열린다.

   구조 (원화가 오면 그림만 갈아 끼운다)
     배경   : 지금은 CSS 그라데이션(하늘→잔디+흙길). → 세로로 긴 원화 1장
     텐트   : 지금은 CSS 도형. → 투명 배경 원화 1장. 천막 패널 위에 상태를 얹는다
     스테이션: 지금은 이모지+그루터기 타원. → 투명 배경 원화 8장
              ※ 이름표(초록 알약)와 뱃지는 원화에 넣지 않는다 — 여기서 그린다.
                숫자가 살아 움직여야 하고, 이름 길이에 맞춰 폭이 달라져야 한다.

   색은 사용자가 준 원화 픽셀에서 직접 뽑았다 (임의로 정하지 않았다).
   ════════════════════════════════════════════════════════════════════════ */

/* 캠프 톤 — 텐트·그루터기·배경 원화에서 실측한 색 */
export const CAMP = {
  panel:   "#FBF0D8",   // 천막 패널 (카드 바탕)
  panelB:  "#D9BE86",   // 패널 테두리
  ink:     "#4A3418",   // 글자
  inkSub:  "#8A6B3E",   // 보조 글자
  label:   "#587220",   // 이름표 초록
  labelInk:"#F4E9C8",   // 이름표 글자
  badge:   "#F2D8A1",   // 작은 뱃지
  wood:    "#8A5614",   // 나무
  woodD:   "#734309",   // 진한 나무
  grass:   "#AAB73C",   // 잔디
  grassD:  "#8FA932",   // 숲 초록
  dirt:    "#F0D488",   // 흙길
  sky:     "#4BBAFD",   // 하늘
  bar:     "#7FB335",   // 진행바
};

/* 8개 스테이션 — 배열 순서가 곧 화면 순서(왼→오, 위→아래).
   위 2줄 = 상점, 가운데 = 소지품, 아래 = 기록. 지금 탭의 '즐기기/내 기록' 구분을
   섹션 제목 없이 자리로만 유지한다. */
const STATIONS = [
  { key:"deco",    emoji:"👕", name:"꾸미기 상점", badge:"21개 보유" },
  { key:"item",    emoji:"🛒", name:"아이템 상점", badge:"총 구매 3개" },
  { key:"box",     emoji:"🎁", name:"보물창고",   badge:"📦1 🎁1 👑1" },
  { key:"pet",     emoji:"🐣", name:"나의 펫",    badge:"아기 드래곤" },
  { key:"book",    emoji:"📖", name:"발견 도감",   badge:"10 / 59" },
  { key:"title",   emoji:"👑", name:"상장",       badge:"1 / 20개" },
  { key:"streak",  emoji:"🔥", name:"연속 달성",   badge:"현재 3일" },
  { key:"history", emoji:"📜", name:"탐험 기록",   badge:"최근 12건" },
];

/* 크기 후보 — 어느 쪽으로 갈지 눈으로 보고 정하려고 셋을 둔다.
   스테이션 폭이 정해지면 배경 원화 세로 길이가 따라 정해진다. */
const SIZES = {
  L: { label:"넉넉", gap:12, tentW:340, pill:32, badgeH:22, name:16,   badgeF:12 },
  M: { label:"보통", gap:30, tentW:330, pill:30, badgeH:21, name:15,   badgeF:11.5 },
  S: { label:"작게", gap:58, tentW:320, pill:28, badgeH:20, name:13.5, badgeF:10.5 },
};
const CONTENT_W = 360;      // 탭 안쪽 폭 (좌우 15px 여백)
const TAB_W = 390;          // 폰 폭 기준
const ART_AR = 983 / 1022;  // 스테이션 원화 실측 가로/세로
const TENT_AR = 1209 / 1095;// 텐트 원화 실측 가로/세로
const BG_W = 1086;          // 배경 원화 가로 (사용자가 준 그림 기준)

export default function CampPrototype({ onClose }) {
  const [sz, setSz] = useState("L");
  const [h, setH] = useState(0);
  const sceneRef = useRef(null);
  const S = SIZES[sz];
  const stW = (CONTENT_W - S.gap) / 2;          // 스테이션 한 칸 폭
  const artH = stW / ART_AR;                     // 그루터기+물건 그림 높이
  const tentH = S.tentW / TENT_AR;

  useLayoutEffect(() => {
    if (sceneRef.current) setH(Math.round(sceneRef.current.scrollHeight));
  }, [sz]);

  const bgNeed = h ? Math.round(BG_W / (TAB_W / h)) : 0;

  const pill = {
    background: CAMP.label, color: CAMP.labelInk, border: `2px solid ${CAMP.woodD}`,
    borderRadius: 999, padding: `0 ${S.pill * 0.42}px`, height: S.pill, lineHeight: `${S.pill - 4}px`,
    fontSize: S.name, fontWeight: 900, whiteSpace: "nowrap", display: "inline-block",
    boxShadow: "0 2px 4px rgba(74,52,24,0.22)",
  };
  const badge = {
    background: CAMP.badge, color: CAMP.ink, border: `1.5px solid ${CAMP.panelB}`,
    borderRadius: 999, padding: "0 9px", height: S.badgeH, lineHeight: `${S.badgeH - 3}px`,
    fontSize: S.badgeF, fontWeight: 800, whiteSpace: "nowrap", display: "inline-block",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(20,20,40,0.55)", zIndex:3200,
      display:"flex", flexDirection:"column", alignItems:"center" }}>

      {/* 머리줄 — 크기 후보 고르기 + 실측 결과 */}
      <div style={{ width:"100%", maxWidth:430, background:"#fff", padding:"12px 14px",
        boxSizing:"border-box", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:9 }}>
          <p style={{ margin:0, fontSize:15, fontWeight:900, color:CAMP.ink }}>🏕️ 캠프 배치 시안</p>
          <button onClick={onClose} style={{ background:"#F1EFEA", border:"none", borderRadius:10,
            width:28, height:28, cursor:"pointer", fontSize:14 }}>✕</button>
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:8 }}>
          {Object.entries(SIZES).map(([k, v]) => (
            <button key={k} onClick={() => setSz(k)} style={{ flex:1, border:`1px solid ${sz===k?CAMP.label:"#DDD"}`,
              background: sz===k ? CAMP.label : "#fff", color: sz===k ? "#fff" : CAMP.ink,
              borderRadius:999, padding:"7px 0", fontSize:12.5, fontWeight:900, cursor:"pointer" }}>
              {v.label}
            </button>
          ))}
        </div>
        <p style={{ margin:0, fontSize:11.5, fontWeight:700, color:CAMP.inkSub, lineHeight:1.6 }}>
          스테이션 {Math.round(stW)}×{Math.round(artH)}px · 이름표 {S.name}px · 뱃지 {S.badgeF}px<br />
          전체 높이 <b style={{ color:CAMP.ink }}>{h}px</b> · 한 화면(620px)에서 {Math.max(0, h - 620)}px 스크롤<br />
          → 배경 원화 <b style={{ color:CAMP.ink }}>{BG_W} × {bgNeed}</b> 필요
        </p>
      </div>

      {/* 캠프 — 실제 폰 폭(390)으로 */}
      <div style={{ width:TAB_W, flex:1, overflowY:"auto", background:"#000", WebkitOverflowScrolling:"touch" }}>
        <div ref={sceneRef} style={{ position:"relative", minHeight:"100%",
          /* 배경 자리 — 원화가 오면 이 그라데이션 대신 <img>를 깐다 */
          background:`linear-gradient(180deg, ${CAMP.sky} 0%, #9FD9FF 14%, ${CAMP.grassD} 22%, ${CAMP.grass} 30%, ${CAMP.grass} 100%)`,
          paddingBottom:24 }}>
          {/* 흙길 — 가운데로 내려오는 길 (배경 원화에 그려질 부분) */}
          <div style={{ position:"absolute", left:"50%", top:"24%", bottom:0, width:"46%",
            transform:"translateX(-50%)", background:CAMP.dirt, opacity:0.55,
            borderRadius:"40% 40% 0 0 / 6% 6% 0 0", pointerEvents:"none" }} />

          {/* ── 텐트 + 상태 ── */}
          <div style={{ position:"relative", width:S.tentW, height:tentH, margin:"14px auto 0" }}>
            {/* 텐트 실루엣 자리 (원화로 교체) */}
            <div style={{ position:"absolute", inset:0, background:CAMP.panelB,
              clipPath:"polygon(50% 0%, 97% 34%, 100% 92%, 0% 92%, 3% 34%)" }} />
            <div style={{ position:"absolute", inset:"3px 4px 4px", background:CAMP.panel,
              clipPath:"polygon(50% 0%, 97% 34%, 100% 92%, 0% 92%, 3% 34%)" }} />
            {/* 천막 패널 위 상태 — 원화가 와도 이 부분은 그대로 HTML */}
            <div style={{ position:"absolute", left:"9%", right:"9%", top:"38%",
              display:"flex", flexDirection:"column", gap:7 }}>
              <p style={{ margin:0, fontSize:17, fontWeight:900, color:CAMP.ink }}>🌊 Lv.9 바다 탐험가</p>
              <div style={{ height:12, borderRadius:6, background:"rgba(74,52,24,0.16)", overflow:"hidden" }}>
                <div style={{ width:"72%", height:"100%", borderRadius:6, background:CAMP.bar }} />
              </div>
              <p style={{ margin:0, fontSize:11.5, fontWeight:700, color:CAMP.inkSub }}>
                다음 레벨 🏝️ Lv.10 섬 탐험가 · 260/280 · 20 남음
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:2 }}>
                {[["💎 보유 코인","7,848"],["⭐ 누적 XP","1,400"]].map(([t,v]) => (
                  <div key={t} style={{ background:"#fff", border:`1.5px solid ${CAMP.panelB}`,
                    borderRadius:12, padding:"6px 9px" }}>
                    <p style={{ margin:0, fontSize:10.5, fontWeight:800, color:CAMP.inkSub }}>{t}</p>
                    <p style={{ margin:0, fontSize:17, fontWeight:900, color:CAMP.ink }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 스테이션 8개 (2×4) ── */}
          <div style={{ display:"grid", gridTemplateColumns:`repeat(2, ${stW}px)`,
            justifyContent:"center", gap:`12px ${S.gap}px`, marginTop:18 }}>
            {STATIONS.map(st => (
              <button key={st.key} onClick={() => {}} style={{ width:stW, border:"none", background:"none",
                padding:0, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center" }}>
                {/* 그루터기 + 물건 자리 (원화로 교체) */}
                <div style={{ width:stW, height:artH, position:"relative" }}>
                  <div style={{ position:"absolute", left:0, right:0, top:"6%", textAlign:"center",
                    fontSize:artH * 0.42, lineHeight:1 }}>{st.emoji}</div>
                  {/* 그루터기 */}
                  <div style={{ position:"absolute", left:"12%", right:"12%", bottom:"6%", height:"26%",
                    background:`linear-gradient(180deg, ${CAMP.wood}, ${CAMP.woodD})`,
                    borderRadius:"50% 50% 46% 46% / 34% 34% 22% 22%",
                    boxShadow:"0 3px 6px rgba(74,52,24,0.3)" }} />
                </div>
                {/* 이름표 — 원화에 넣지 않고 여기서 그린다 */}
                <span style={{ ...pill, marginTop:-S.pill * 0.55, position:"relative", zIndex:1 }}>{st.name}</span>
                <span style={{ ...badge, marginTop:5 }}>{st.badge}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

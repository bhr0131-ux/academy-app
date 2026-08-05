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
     스테이션: 원화 세 장을 겹쳐서 만든다 [사용자 확정 2026-08-05]
              ① 아이콘(그루터기+물건) — 스테이션마다 다른 유일한 그림, 8장 필요
              ② 초록 이름표 판 — 8개 공통 1장
              ③ 베이지 명패 판 — 8개 공통 1장
              판을 공통으로 쓰니 여덟 칸의 판 위치·크기가 저절로 똑같아진다
              (원화마다 판을 그려 넣으면 조금씩 어긋나서 글자가 삐뚤어졌다).
              글자는 판 위에 앱이 얹는다 — 숫자가 살아 움직여야 하기 때문.

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
  badge:   "#F4D7A1",   // 작은 명패 — 원화에 그려져 오는 판의 실측색
                        //  [2026-08-03] 판만 놓고 보면 흙길(#F6CD6D)과 밝기 차가 11뿐이라
                        //  묻힐 뻔했지만, 원화 판에는 나무 테두리와 그림자가 있어 구분된다.
                        //  그래서 판 색은 그대로 두고 '글자'만 진한 갈색으로 올린다.
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
  { key:"deco",    emoji:"👕", name:"꾸미기 상점", badge:"21개 보유", img:"st-deco.webp" },
  { key:"item",    emoji:"🛒", name:"아이템 상점", badge:"총 구매 3개", img:"st-item.webp" },
  { key:"box",     emoji:"🎁", name:"보물창고",   badge:"상자 3개", img:"st-box.webp" },
  { key:"pet",     emoji:"🐣", name:"나의 펫",    badge:"아기 드래곤", img:"st-pet.webp" },
  { key:"book",    emoji:"📖", name:"발견 도감",   badge:"10 / 59", img:"st-book.webp" },
  { key:"title",   emoji:"👑", name:"상장",       badge:"1 / 20개", img:"st-title.webp" },
  { key:"streak",  emoji:"🔥", name:"연속 달성",   badge:"현재 3일", img:"st-streak.webp" },
  { key:"history", emoji:"📜", name:"탐험 기록",   badge:"최근 12건", img:"st-history.webp" },
];

/* 크기 후보 — 어느 쪽으로 갈지 눈으로 보고 정하려고 셋을 둔다.
   스테이션 폭이 정해지면 배경 원화 세로 길이가 따라 정해진다. */
const SIZES = {
  L: { label:"넉넉", gap:12, tentW:340, pill:32, badgeH:22, name:16,   badgeF:12 },
  M: { label:"보통", gap:30, tentW:330, pill:30, badgeH:21, name:15,   badgeF:11.5 },
  S: { label:"작게", gap:52, tentW:320, pill:29, badgeH:21, name:14,   badgeF:11.5 },
};
const CONTENT_W = 360;      // 탭 안쪽 폭 (좌우 15px 여백)
const TAB_W = 390;          // 폰 폭 기준
/* 원화 실측 가로/세로 — 여백을 잘라낸 그림 자체의 비율 */
/* 스테이션 아이콘 칸의 비율.
   그림은 이 틀 안에 objectFit:contain 으로 넣어 늘어나지 않게 하고,
   아래쪽(center bottom)에 붙여 그루터기 밑동 선을 여덟 칸이 같이 쓰게 한다.
   이름표 판이 밑동을 물고 올라오므로 맞춰야 하는 건 위가 아니라 아래다.

   [사용자 확정 2026-08-05] 이 값은 '여덟 원화 중 가장 세로로 긴 것보다 조금 더
   세로로 길게' 잡아야 한다. 원화 여덟 장 모두 가장 넓은 가로줄이 그루터기이고
   그 폭이 곧 그림 폭이라(바닥에서 30~46% 높이), 칸 폭을 꽉 채우기만 하면
   그루터기 폭이 저절로 여덟 칸 똑같아진다.
   그런데 칸이 그림보다 가로로 길면 contain이 세로에 맞춰 그림을 줄여 버려
   그 칸만 그루터기가 가늘어진다 — 아이템 상점(1.065)이 154 → 139px로 줄었었다.
   그래서 최소 비율 1.065보다 조금 작은 1.06으로 잡아 전부 폭에 맞게 했다.
   원화 실측 비율: 아이템 1.065 · 발견 도감 1.134 · 꾸미기 1.146 · 상장 1.169
                   보물창고 1.184 · 연속 달성 1.192 · 나의 펫 1.203 · 탐험 기록 1.230
   → 이보다 세로로 긴 원화가 새로 오면 이 숫자를 그 아래로 내려야 한다. */
const ART_AR   = 1.06;         // 스테이션 아이콘 칸 (그루터기+물건)
const NAME_AR  = 964 / 334;    // 초록 이름표 판
const BADGE_AR = 842 / 210;    // 베이지 명패 판
/* 판을 얼마나 크게 놓을지 (스테이션 폭 대비) — 참고 합본 비율에서 잡았다 */
const NAME_W  = 0.72;
const BADGE_W = 0.62;
/* 겹침 — 이름표는 아이콘 밑동에, 명패는 이름표 아래에 살짝 물린다 */
const NAME_OVER  = 0.30;   // 이름표 높이의 30%만큼 아이콘과 겹침
const BADGE_OVER = 0.34;   // 명패 높이의 34%만큼 이름표와 겹침
/* 판 안쪽(테두리 제외) 비율 — 글자 크기를 여기에 맞춘다 */
const NAME_INNER  = 270 / 334;
const BADGE_INNER = 160 / 210;
/* 텐트 원화 (1198×1130, 여백 잘라낸 그림 자체 기준).
   글자를 얹을 자리는 눈대중이 아니라 원화 픽셀에서 물 채우기로 찾았다 —
   천막 면은 테두리 선에서 멈춘 영역, 깃발도 같은 방법. 값은 그림 폭·높이의 %다. */
const TENT_AR = 1198 / 1130;
const TENT_PANEL = { l: 19.9, r: 79.5, t: 41.0, b: 85.0 };  // 천막 면 (테두리 안쪽)
/* 깃발은 '점선 테두리 안쪽'을 쓴다 — 바깥 천 가장자리(52.3~75.5 / 3.7~18.4)까지
   글자를 채우면 점선을 넘어가 지저분해진다. 점선 위치도 픽셀에서 실측했다. */
const TENT_FLAG  = { l: 53.3, r: 74.5, t:  4.5, b: 17.6 };  // 꼭대기 깃발 (점선 안쪽)
const PANEL_PAD  = 4.5;     // 천막 면 테두리에서 글자를 띄우는 여백 (면 폭의 %)
const BG_W = 1086;          // 배경 원화 가로 (사용자가 준 그림 기준)

/* 깃발에 걸 상장 — 실제 앱에서는 getSelectedTitle(childId)이 준 {emoji, name}이 들어간다.
   시안에서는 길이가 다른 셋을 넣고 깃발을 눌러 돌려 본다. 가장 긴 이름 하나만
   봐서는 짧은 이름이 어떻게 보이는지 알 수 없고, 반대도 마찬가지다.
   3자 / 6자 / 10자 — 실제 상장 이름 길이의 양 끝과 가운데다. */
const FLAG_SAMPLES = [
  { emoji: "🎗️", name: "꼬마 탐험가" },        // 6자 — 가장 흔한 길이
  { emoji: "📚", name: "숙제왕" },              // 3자 — 가장 짧은 축
  { emoji: "🍰", name: "디저트 왕국의 주인" },   // 10자 — 가장 긴 상장 이름
];

/* 글자 폭 — 브라우저에서 실측했다 (카페24 써라운드, letterSpacing -0.3px).
   한글 한 자 = 글자크기의 0.95배 · 공백 = 0.30배 · 자간이 글자마다 0.3px씩 줄인다.
   눈대중으로 '한글은 정사각형이니 1.0배'로 잡았더니 필요보다 20% 작게 나왔다. */
const GLYPH_HANGUL = 0.95, GLYPH_SPACE = 0.30, LETTER_SPACING = 0.3;
const textUnits = (s) => [...s].reduce((a, c) => a + (c === " " ? GLYPH_SPACE : GLYPH_HANGUL), 0);
/* 폭 boxW 에 들어가는 가장 큰 글자 크기 */
const fitByWidth = (s, boxW) => (boxW + LETTER_SPACING * s.length) / textUnits(s);

/* 깃발 이름 — 줄바꿈과 크기, 그리고 이모지 크기까지 같이 정한다.
   상장 이름은 3~10글자로 편차가 크다(가장 긴 것이 '디저트 왕국의 주인' 10자).
   깃발 안쪽이 좁아서(작게 기준 61×35px) 이모지가 높이를 많이 먹으면
   긴 이름이 7px까지 쪼그라든다. 그래서 이름이 한 줄에 시원하게 들어가면
   이모지를 크게 두고, 안 들어가면 이모지를 조금 줄여 이름 자리를 넓힌다.
   이모지 비율(0.56)은 눈으로 정했다 — 이모지 글리프는 지정한 크기보다 작게
   그려져서(16px로 주면 12px쯤으로 보인다) 이름과 비슷해 보였다. */
function fitFlag(name, boxW, boxH) {
  const plan = (emojiRatio) => {
    const em = Math.round(boxH * emojiRatio);
    const room = boxH - em * 1.06 - 1;              // 이모지 아래 남는 높이
    const size = (lines) => Math.min(
      Math.min(...lines.map(s => fitByWidth(s.trim(), boxW))),
      (room / lines.length) * 0.86,
    );
    let best = { lines: [name], f: size([name]) };
    const sp = name.split(" ");
    for (let i = 1; i < sp.length; i++) {   // 띄어쓰기마다 두 줄로 접어 보고 제일 큰 것
      const two = [sp.slice(0, i).join(" "), sp.slice(i).join(" ")];
      const f = size(two);
      if (f > best.f) best = { lines: two, f };
    }
    return { em, ...best };
  };
  const big = plan(0.56);
  if (big.f >= 10) return { ...big, f: Math.round(big.f * 10) / 10 };   // 짧은 이름 — 이모지 크게
  const small = plan(0.36);                                            // 긴 이름 — 이름 자리 넓히기
  const pick = small.f > big.f ? small : big;
  return { ...pick, f: Math.round(pick.f * 10) / 10 };
}

export default function CampPrototype({ onClose }) {
  const [sz, setSz] = useState("S");   // [사용자 확정] 배경 원화 비율(1:3.09)에 맞는 크기
  const [h, setH] = useState(0);
  const [flagIdx, setFlagIdx] = useState(0);   // 깃발을 눌러 상장 표본을 돌려 본다
  const sceneRef = useRef(null);
  const S = SIZES[sz];
  const stW = (CONTENT_W - S.gap) / 2;          // 스테이션 한 칸 폭
  const artH = stW / ART_AR;                     // 그루터기+물건 그림 높이
  /* 판 두 장 — 원화 비율 그대로 놓고, 글자는 '판 안쪽 높이'에 맞춰 키운다 */
  const nameW  = stW * NAME_W,  nameH  = nameW / NAME_AR;
  const badgeW = stW * BADGE_W, badgeH = badgeW / BADGE_AR;
  const nameF  = Math.round(nameH * NAME_INNER * 0.52);
  const badgeF = Math.round(badgeH * BADGE_INNER * 0.62 * 10) / 10;
  const tentH = S.tentW / TENT_AR;
  /* 천막 면 실측 크기 — 글자가 다 들어가는지 눈이 아니라 숫자로 확인하려고 꺼내 둔다.
     좌우 여백은 '면 폭의 %'로 주는데 style의 left/right는 '텐트 폭의 %'라 환산해야 한다. */
  const panelW = S.tentW * (TENT_PANEL.r - TENT_PANEL.l) / 100;
  const panelH = tentH   * (TENT_PANEL.b - TENT_PANEL.t) / 100;
  const panelPadPct = (TENT_PANEL.r - TENT_PANEL.l) * PANEL_PAD / 100;
  const panelGap = panelH > 145 ? 7 : 5;
  /* 깃발 — 전시 중인 상장을 이모지 크게 + 이름 작게로 얹는다 [사용자 확정 2026-08-05] */
  const flagW = S.tentW * (TENT_FLAG.r - TENT_FLAG.l) / 100;
  const flagH = tentH   * (TENT_FLAG.b - TENT_FLAG.t) / 100;
  const flagIW = flagW * 0.90, flagIH = flagH * 0.88;   // 점선에서 살짝 띄운 안쪽
  const flagTitle = FLAG_SAMPLES[flagIdx % FLAG_SAMPLES.length];
  const flag = fitFlag(flagTitle.name, flagIW, flagIH);

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
  /* 원화로 올 '명패'를 흉내 낸 것 — 나무 테두리 + 그림자가 있어야 흙길 위에서 분리된다 */
  const badge = {
    background: CAMP.badge, color: CAMP.ink, border: `1.5px solid ${CAMP.wood}`,
    borderRadius: 999, padding: "0 9px", height: S.badgeH, lineHeight: `${S.badgeH - 3}px`,
    fontSize: S.badgeF, fontWeight: 800, whiteSpace: "nowrap", display: "inline-block",
    boxShadow: "0 2px 3px rgba(74,52,24,0.3)",
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
          스테이션 {Math.round(stW)}×{Math.round(artH)}px · 이름표 판 {Math.round(nameW)}×{Math.round(nameH)}({nameF}px 글자)
          · 명패 판 {Math.round(badgeW)}×{Math.round(badgeH)}({badgeF}px 글자)<br />
          텐트 {S.tentW}×{Math.round(tentH)} · 천막 면 {Math.round(panelW)}×{Math.round(panelH)}
          · 깃발 {Math.round(flagW)}×{Math.round(flagH)}(이모지 {flag.em} · 이름 {flag.f}px {flag.lines.length}줄)<br />
          전체 높이 <b style={{ color:CAMP.ink }}>{h}px</b> · 한 화면(620px)에서 {Math.max(0, h - 620)}px 스크롤<br />
          → 배경 원화 <b style={{ color:CAMP.ink }}>{BG_W} × {bgNeed}</b> 필요
        </p>
      </div>

      {/* 캠프 — 실제 폰 폭(390)으로 */}
      <div style={{ width:TAB_W, flex:1, overflowY:"auto", background:"#000", WebkitOverflowScrolling:"touch" }}>
        <div ref={sceneRef} style={{ position:"relative", minHeight:"100%",
          background:CAMP.grass, paddingBottom:24 }}>
          {/* 배경 원화 — 724×2172(1:3.00). '작게' 배치와 비율이 정확히 같아
              가로세로 어느 쪽도 잘리지 않는다. */}
          <img src="assets/camp/bg.webp" alt="" draggable={false}
            style={{ position:"absolute", inset:0, width:"100%", height:"100%",
              objectFit:"cover", objectPosition:"center top", pointerEvents:"none", zIndex:0 }} />

          {/* 앞쪽(텐트·스테이션)은 한 겹으로 묶어 배경 위에 올린다.
              배경 <img>가 position:absolute라, 묶지 않으면 위치를 안 준 요소
              (뱃지 같은 인라인)가 배경 아래로 깔려 안 보인다 — CSS 그리는 순서 때문. */}
          {/* paddingTop 14 — 텐트에 margin-top을 주면 그 여백이 이 겹과 장면 밖으로
              빠져나가(마진 상쇄) 장면 전체가 내려앉고 맨 위에 검은 띠가 보였다.
              여백을 마진 대신 패딩으로 주면 상쇄가 일어나지 않는다. */}
          <div style={{ position:"relative", zIndex:1, paddingTop:14 }}>

          {/* ── 텐트 + 상태 ── */}
          <div style={{ position:"relative", width:S.tentW, height:tentH, margin:"0 auto" }}>
            <img src="assets/camp/tent.webp" alt="" draggable={false}
              style={{ position:"absolute", inset:0, width:"100%", height:"100%", display:"block" }} />

            {/* 꼭대기 깃발 — 전시 중인 상장 (이모지 크게, 이름 작게) */}
            <button onClick={() => setFlagIdx(i => i + 1)}
              title="눌러서 다른 길이의 상장 이름 보기 (시안 전용)"
              style={{ position:"absolute", border:"none", background:"none", padding:0, cursor:"pointer",
              left:`${TENT_FLAG.l}%`, width:`${TENT_FLAG.r - TENT_FLAG.l}%`,
              top:`${TENT_FLAG.t}%`,  height:`${TENT_FLAG.b - TENT_FLAG.t}%`,
              display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", lineHeight:1 }}>
              <span style={{ fontSize:flag.em, lineHeight:1 }}>{flagTitle.emoji}</span>
              <span style={{ marginTop:1, fontSize:flag.f, fontWeight:900, color:CAMP.ink,
                letterSpacing:-0.3, lineHeight:1.06, textAlign:"center", whiteSpace:"pre" }}>
                {flag.lines.join("\n")}
              </span>
            </button>

            {/* 천막 면 위 상태 — 판 자리는 원화에서 실측한 %, 글자는 앱이 얹는다 */}
            <div style={{ position:"absolute",
              left:`${TENT_PANEL.l + panelPadPct}%`, right:`${100 - TENT_PANEL.r + panelPadPct}%`,
              top:`${TENT_PANEL.t}%`, bottom:`${100 - TENT_PANEL.b}%`,
              display:"flex", flexDirection:"column", justifyContent:"center", gap:panelGap }}>
              <p style={{ margin:0, fontSize:S.name + 1, fontWeight:900, color:CAMP.ink }}>🌊 Lv.9 바다 탐험가</p>
              <div style={{ height:11, borderRadius:6, background:"rgba(74,52,24,0.16)", overflow:"hidden" }}>
                <div style={{ width:"72%", height:"100%", borderRadius:6, background:CAMP.bar }} />
              </div>
              <p style={{ margin:0, fontSize:S.badgeF - 0.5, fontWeight:700, color:CAMP.inkSub }}>
                다음 레벨 🏝️ Lv.10 섬 탐험가 · 260/280 · 20 남음
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginTop:1 }}>
                {[["💎 보유 코인","7,848"],["⭐ 누적 XP","1,400"]].map(([t,v]) => (
                  <div key={t} style={{ background:"rgba(255,255,255,0.72)", border:`1.5px solid ${CAMP.panelB}`,
                    borderRadius:11, padding:"5px 8px" }}>
                    <p style={{ margin:0, fontSize:10, fontWeight:800, color:CAMP.inkSub }}>{t}</p>
                    <p style={{ margin:0, fontSize:S.name + 1, fontWeight:900, color:CAMP.ink }}>{v}</p>
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
                {/* ① 아이콘 — 그루터기+물건. 스테이션마다 다른 유일한 그림 */}
                {st.img
                  ? <img src={`assets/camp/${st.img}`} alt="" draggable={false}
                      style={{ width:stW, height:artH, display:"block",
                        objectFit:"contain", objectPosition:"center bottom" }} />
                  : <div style={{ width:stW, height:artH, position:"relative" }}>
                      <div style={{ position:"absolute", left:0, right:0, top:"6%", textAlign:"center",
                        fontSize:artH * 0.42, lineHeight:1 }}>{st.emoji}</div>
                      <div style={{ position:"absolute", left:"12%", right:"12%", bottom:"6%", height:"26%",
                        background:`linear-gradient(180deg, ${CAMP.wood}, ${CAMP.woodD})`,
                        borderRadius:"50% 50% 46% 46% / 34% 34% 22% 22%",
                        boxShadow:"0 3px 6px rgba(74,52,24,0.3)" }} />
                    </div>}
                {/* ② 초록 이름표 — 판은 8개 공통 원화, 글자만 얹는다 */}
                <div style={{ width:nameW, height:nameH, position:"relative", zIndex:2,
                  marginTop:-nameH * NAME_OVER }}>
                  <img src="assets/camp/plate-name.webp" alt="" draggable={false}
                    style={{ width:"100%", height:"100%", display:"block" }} />
                  <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:nameF, fontWeight:900, color:CAMP.labelInk,
                    letterSpacing:-0.2, textShadow:"0 1px 2px rgba(60,44,14,0.45)", whiteSpace:"nowrap" }}>
                    {st.name}
                  </span>
                </div>
                {/* ③ 베이지 명패 — 이것도 8개 공통 원화 */}
                <div style={{ width:badgeW, height:badgeH, position:"relative", zIndex:3,
                  marginTop:-badgeH * BADGE_OVER }}>
                  <img src="assets/camp/plate-badge.webp" alt="" draggable={false}
                    style={{ width:"100%", height:"100%", display:"block" }} />
                  <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:badgeF, fontWeight:800, color:CAMP.ink,
                    letterSpacing:-0.2, whiteSpace:"nowrap" }}>
                    {st.badge}
                  </span>
                </div>
              </button>
            ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

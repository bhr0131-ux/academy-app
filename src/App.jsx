import { useState, useEffect } from "react";

// ── 상수 ─────────────────────────────────
const DAYS = ["월","화","수","목","금","토","일"];
const DAY_COLORS = { 월:"#FF6B6B", 화:"#FF9F43", 수:"#4A90E2", 목:"#9B59B6", 금:"#1ABC9C", 토:"#3498DB", 일:"#E74C3C" };

// 성별별 테마
const GENDER_THEME = {
  boy:  { emoji:"👦", main:"#3B7ECD", light:"#E4EDF8", lightTop:"#F5F9FC", grad:"linear-gradient(135deg,#3B7ECD,#80A9DA)" },
  girl: { emoji:"👧", main:"#DE869C", light:"#FAEEF1", lightTop:"#FDF9FA", grad:"linear-gradient(135deg,#DE869C,#EEC8D1)" },
};

const CHILD_THEME_COLORS = [
  // 던전/베이커리 공통 5가지 테마색.
  // 던전모드는 이 색을 화면 전체에 칠하지 않고, 밤하늘 베이스 위에 포인트로만 입힌다.
  { name:"분홍", main:"#FF6FA3", light:"#FCE7F1", lightTop:"#FFF7FB", grad:"linear-gradient(135deg,#FF6FA3,#FFB6CC)" },
  { name:"살구", main:"#FFB66B", light:"#FFF0DF", lightTop:"#FFFBF6", grad:"linear-gradient(135deg,#FF9F5A,#FFD68A)" },
  { name:"연두", main:"#7BE0A6", light:"#E7F8ED", lightTop:"#F7FFF9", grad:"linear-gradient(135deg,#63CF88,#B9F0D2)" },
  { name:"보라", main:"#A78BFA", light:"#F0EAFF", lightTop:"#FAF8FF", grad:"linear-gradient(135deg,#8B5CF6,#CDBDFF)" },
  { name:"파랑", main:"#60A8FF", light:"#E5F1FF", lightTop:"#F6FAFF", grad:"linear-gradient(135deg,#3D79FF,#A9C9FF)" },
];

const C = {
  bg:"#F4F6FB", card:"#FFFFFF", border:"#EAECF5",
  text:"#1A1A35", sub:"#8890B0", faint:"#F0F2FF", faintB:"#DDE3FF",
  green:"#22C9A0", red:"#FF5C7A", orange:"#FF9F43",
  purple:"#6C63FF", purpleL:"#EEF0FF",
};

// 테마색(main)을 흰색과 섞어 옅은 배경색 생성 (wf=흰색 비율, 1=완전 흰색)
const mixWhite = (hex, wf) => {
  const h = (hex||"#FFFFFF").replace("#","");
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  const m = (v)=>Math.max(0,Math.min(255,Math.round(v*(1-wf)+255*wf)));
  const hx = (v)=>v.toString(16).padStart(2,"0").toUpperCase();
  return `#${hx(m(r))}${hx(m(g))}${hx(m(b))}`;
};
// 테마색을 검정과 섞어 더 진하게 (bf=검정 비율). 같은 계열 명암 그라데이션용
const mixBlack = (hex, bf) => {
  const h = (hex||"#000000").replace("#","");
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  const m = (v)=>Math.max(0,Math.min(255,Math.round(v*(1-bf))));
  const hx = (v)=>v.toString(16).padStart(2,"0").toUpperCase();
  return `#${hx(m(r))}${hx(m(g))}${hx(m(b))}`;
};
// 맑고 따뜻한 그림책 파스텔: 따뜻한 크림 화이트(#FFF9F2)와 섞고,
// 채도를 살짝 낮춰(부스트가 아니라 감소) 형광기 없는 부드러운 마카롱 톤을 만든다.
// 파랑~보라는 더 연하게, 파랑은 맑은 하늘색으로 살짝 끌어올린다.
const softTint = (hex, wf, satBoost=0.92) => {
  const CREAM = [255,249,242];
  const h0 = (hex||"#FFFFFF").replace("#","");
  let r0 = parseInt(h0.slice(0,2),16), g0 = parseInt(h0.slice(2,4),16), b0 = parseInt(h0.slice(4,6),16);
  // 원본 색상(hue) 파악 → 파랑/보라면 보정
  let _skyLift = 0;  // 파랑 계열을 맑은 하늘색으로 끌어올리는 양
  {
    const rr=r0/255, gg=g0/255, bb=b0/255;
    const mx=Math.max(rr,gg,bb), mn=Math.min(rr,gg,bb); let H=0;
    if(mx!==mn){ const d=mx-mn;
      if(mx===rr) H=((gg-bb)/d+(gg<bb?6:0)); else if(mx===gg) H=((bb-rr)/d+2); else H=((rr-gg)/d+4); H*=60; }
    // 파랑~보라(약 205°~290°)면 더 연하게, 채도 더 낮춤
    if(H>=205 && H<=292){
      wf = wf + (1-wf)*0.20;       // 크림을 더 섞어 연하게
      satBoost = satBoost*0.95;    // 채도 더 낮춤 → 부드럽게
      // 파랑(하늘색 영역)은 진한 코발트라, 맑은 하늘색으로 끌어올린다
      if(H>=200 && H<=242) _skyLift = 0.16;
    }
    // 분홍~빨강~주황~노랑(따뜻한 색)은 크림을 살짝 더
    else if(H>=330 || H<=55){
      wf = wf + (1-wf)*0.06;
    }
  }
  // 하늘색 이동: 크림과 섞기 전에 원색을 명도↑·채도↓·색조를 청록 쪽으로 살짝 틀어 맑은 하늘색으로
  if(_skyLift>0){
    let rr=r0/255, gg=g0/255, bb=b0/255;
    const mx=Math.max(rr,gg,bb), mn=Math.min(rr,gg,bb); let H=0,S=0; const L0=(mx+mn)/2;
    if(mx!==mn){ const d=mx-mn; S=L0>0.5?d/(2-mx-mn):d/(mx+mn);
      if(mx===rr) H=((gg-bb)/d+(gg<bb?6:0)); else if(mx===gg) H=((bb-rr)/d+2); else H=((rr-gg)/d+4); H/=6; }
    H = (H + 10/360) % 1.0;   // 색조를 청록(하늘색) 쪽으로 +10°
    const L1=Math.min(1,L0+_skyLift); const S1=Math.max(0,S-_skyLift*0.5);
    const hue2=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
    let xr,xg,xb;
    if(S1===0){ xr=xg=xb=L1; } else { const q=L1<0.5?L1*(1+S1):L1+S1-L1*S1; const p=2*L1-q; xr=hue2(p,q,H+1/3); xg=hue2(p,q,H); xb=hue2(p,q,H-1/3); }
    r0=xr*255; g0=xg*255; b0=xb*255;
  }
  // 1) 크림과 섞기
  let r = r0*(1-wf)+CREAM[0]*wf, g = g0*(1-wf)+CREAM[1]*wf, b = b0*(1-wf)+CREAM[2]*wf;
  // 2) RGB→HSL, 채도 부스트
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b); let H=0,S=0; const L=(max+min)/2;
  if(max!==min){ const d=max-min; S=L>0.5?d/(2-max-min):d/(max+min);
    if(max===r) H=((g-b)/d+(g<b?6:0)); else if(max===g) H=((b-r)/d+2); else H=((r-g)/d+4); H/=6; }
  S=Math.min(1,S*satBoost);
  // 3) HSL→RGB
  const hue=(p,q,t)=>{ if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
  let nr,ng,nb;
  if(S===0){ nr=ng=nb=L; } else { const q=L<0.5?L*(1+S):L+S-L*S; const p=2*L-q; nr=hue(p,q,H+1/3); ng=hue(p,q,H); nb=hue(p,q,H-1/3); }
  const HX=(v)=>Math.max(0,Math.min(255,Math.round(v*255))).toString(16).padStart(2,"0").toUpperCase();
  return `#${HX(nr)}${HX(ng)}${HX(nb)}`;
};
// 던전 톤 생성: 남색 베이스(#1B1D2B)에 테마색을 은은히 섞어 '채도 낮은 차분한 다크'를 만든다.
// 레퍼런스(배경 #1B1D2B~#3E4371)처럼 어느 테마색이든 던전 분위기를 유지하면서 색만 살짝 달라지게.
// lift: 밝기 절대 가산(0=가장 깊은 배경, 클수록 밝은 카드). tf: 테마색 반영 강도(기본 0.16, 은은하게)
const DUNGEON_BASE = [22, 24, 38]; // 베이스 (레퍼런스 #1B1D2B보다 살짝 깊게)
const dungeonTone = (main, lift=0, tf=0.16) => {
  const h = (main||"#6C63FF").replace("#","");
  const r0=parseInt(h.slice(0,2),16), g0=parseInt(h.slice(2,4),16), b0=parseInt(h.slice(4,6),16);
  // 1) 테마색의 채도를 낮춰(회색과 섞어) 탁하지 않은 차분한 색으로
  const gray=(r0+g0+b0)/3, desat=0.5;
  let tr=r0*(1-desat)+gray*desat, tg=g0*(1-desat)+gray*desat, tb=b0*(1-desat)+gray*desat;
  // 2) 남색 베이스가 지배하고 테마색은 tf 비율로 은은히 → 남보라/청록/적갈 등 베이스가 잡힌 톤
  let r=DUNGEON_BASE[0]*(1-tf)+tr*tf, g=DUNGEON_BASE[1]*(1-tf)+tg*tf, b=DUNGEON_BASE[2]*(1-tf)+tb*tf;
  // 3) 밝기 단계: lift만큼 밝게 (배경→카드 위계)
  r=Math.min(255,r+lift); g=Math.min(255,g+lift); b=Math.min(255,b+lift);
  const HX=(v)=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0").toUpperCase();
  return `#${HX(r)}${HX(g)}${HX(b)}`;
};
// 던전모드 "보물상점" 전용 스타일 토큰 (아이템 상점 카드/지갑/아이콘) ----------
const DUNGEON_SHOP = {
  walletBg: "linear-gradient(135deg, #243B6A 0%, #355490 100%)",
  walletBorder: "1px solid rgba(150, 190, 255, 0.28)",
  // 목록 전체를 하나로 잇는 위→아래 그라데이션 (밝은 보물상자 블루 → 깊은 던전 네이비)
  listBg: "linear-gradient(180deg, #6D82A8 0%, #4F6593 45%, #38507F 100%)",
  listBorder: "1px solid rgba(210, 230, 255, 0.24)",
  listShadow: "0 10px 24px rgba(15, 35, 75, 0.28), inset 0 1px 0 rgba(255,255,255,0.14)",
  itemCommonBg: "linear-gradient(135deg, #566884 0%, #6D82A8 100%)",
  itemRareBg:   "linear-gradient(135deg, #4B6FA3 0%, #6289C6 100%)",
  itemEpicBg:   "linear-gradient(135deg, #5D4F92 0%, #7C67BF 100%)",
  itemLegendBg: "linear-gradient(135deg, #C18B16 0%, #FFD86B 100%)",
  itemLegendShadow: "0 0 25px rgba(255,215,100,0.45), 0 10px 24px rgba(120,80,10,0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
  itemBorder: "1px solid rgba(210, 230, 255, 0.24)",
  itemShadow: "0 10px 24px rgba(15, 35, 75, 0.28), inset 0 1px 0 rgba(255,255,255,0.14)",
  iconBoxBg: "rgba(255,255,255,0.12)",
  iconBoxBorder: "1px solid rgba(255,255,255,0.22)",
  arrowBg: "rgba(255,255,255,0.14)",
  arrowColor: "#FFD166",
};
// 등급별 대표색 (카드 왼쪽 컬러 바용)
const getDungeonShopGradeColor = (grade="common") => {
  if(grade==="legendary") return "#FFD86B";
  if(grade==="epic")      return "#9B86E0";
  if(grade==="rare")      return "#6FA0E8";
  return "#9DB2D4";
};
const getDungeonShopItemBg = (grade="common") => {
  if(grade==="legendary") return DUNGEON_SHOP.itemLegendBg;
  if(grade==="epic")      return DUNGEON_SHOP.itemEpicBg;
  if(grade==="rare")      return DUNGEON_SHOP.itemRareBg;
  return DUNGEON_SHOP.itemCommonBg;
};
// 등급별 밝은 테두리 (구매하고 싶은 카드처럼 또렷한 가장자리)
const getDungeonShopItemBorder = (grade="common") => {
  if(grade==="legendary") return "1.5px solid rgba(255,232,150,0.8)";
  if(grade==="epic")      return "1.5px solid rgba(206,188,255,0.62)";
  if(grade==="rare")      return "1.5px solid rgba(168,205,255,0.6)";
  return "1.5px solid rgba(215,232,255,0.5)";
};
// 등급별 그림자 + inset highlight (위쪽 광택 / 아래쪽 깊이 / 전설은 골드 글로우)
const getDungeonShopItemShadow = (grade="common") => {
  if(grade==="legendary") return DUNGEON_SHOP.itemLegendShadow;
  if(grade==="epic")      return "0 8px 20px rgba(70,50,130,0.34), inset 0 1.5px 0 rgba(255,255,255,0.28), inset 0 -8px 16px rgba(20,10,50,0.28)";
  if(grade==="rare")      return "0 8px 20px rgba(25,55,120,0.34), inset 0 1.5px 0 rgba(255,255,255,0.28), inset 0 -8px 16px rgba(10,25,65,0.28)";
  return "0 8px 18px rgba(20,40,85,0.3), inset 0 1.5px 0 rgba(255,255,255,0.24), inset 0 -8px 16px rgba(12,28,65,0.26)";
};

// 핵심 원칙: 던전은 항상 밤하늘/남색 베이스를 유지하고,
// 분홍·살구·연두·보라·파랑은 진행바/버튼/테두리/글로우에만 입힌다.
const hexToRgb = (hex="#FFFFFF") => {
  const h = hex.replace("#","");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
};
const rgbToHex = ([r,g,b]) => {
  const hx=(v)=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0").toUpperCase();
  return `#${hx(r)}${hx(g)}${hx(b)}`;
};
const mixHex = (a,b,t=0.5) => {
  const A=hexToRgb(a), B=hexToRgb(b);
  return rgbToHex([A[0]*(1-t)+B[0]*t, A[1]*(1-t)+B[1]*t, A[2]*(1-t)+B[2]*t]);
};
const colorDistance = (a,b) => {
  const A=hexToRgb(a), B=hexToRgb(b);
  return Math.abs(A[0]-B[0])+Math.abs(A[1]-B[1])+Math.abs(A[2]-B[2]);
};
const DUNGEON_THEME_PRESETS = [
  { key:"pink",    match:"#FF6FA3", point:"#FF6FA3", point2:"#FF8FC0", soft:"#FFB6CC", deep:"#4B243D", scenery:"#C75FA0", aura:"rgba(255,111,163,0.38)" },
  { key:"apricot", match:"#FFB66B", point:"#FFB66B", point2:"#FFD681", soft:"#FFE1B8", deep:"#33241A", scenery:"#BE6E38", aura:"rgba(255,182,107,0.34)" },
  { key:"green",   match:"#7BE0A6", point:"#7BE0A6", point2:"#B9F0D2", soft:"#D9FBE7", deep:"#223F32", scenery:"#78C58B", aura:"rgba(123,224,166,0.32)" },
  { key:"purple",  match:"#A78BFA", point:"#A78BFA", point2:"#CDBDFF", soft:"#E4D9FF", deep:"#33285A", scenery:"#8E72E8", aura:"rgba(167,139,250,0.36)" },
  { key:"blue",    match:"#60A8FF", point:"#60A8FF", point2:"#A9C9FF", soft:"#D7E8FF", deep:"#1E3356", scenery:"#5D8FEA", aura:"rgba(96,168,255,0.36)" },
];
const getDungeonThemePreset = (main="#60A8FF") =>
  DUNGEON_THEME_PRESETS.reduce((best,p)=> colorDistance(main,p.match)<colorDistance(main,best.match)?p:best, DUNGEON_THEME_PRESETS[4]);
const dungeonPalette = (main="#60A8FF") => {
  const d = getDungeonThemePreset(main);
  const bg0 = "#0F1220";
  const bg1 = mixHex("#11162A", d.deep, 0.34);
  const bg2 = mixHex("#1B2140", d.deep, 0.42);
  const card1 = mixHex("#18203A", d.deep, 0.38);
  const card2 = mixHex("#11182E", d.deep, 0.48);
  return {
    dark:bg0,
    dark2:bg2,
    gold:"#FFD166",
    coin:"#5ED9FF",
    xp:d.point,
    streak:d.point2,
    accent:d.point,
    themePoint:d.point,
    themePoint2:d.point2,
    themeSoft:d.soft,
    themeDeep:d.deep,
    green:"#7BE0A6",
    neon:d.point,
    red:"#FF5C7A",
    scenery:d.scenery,
    aura:d.aura,
    panelBg:`radial-gradient(110% 85% at 18% 0%, ${d.aura} 0%, transparent 54%), linear-gradient(160deg, ${bg2}, ${bg0})`,
    panelText:"#F6F7FB",
    panelSub:"#A8ADC5",
    headerBg:`radial-gradient(120% 95% at 18% 0%, ${d.aura} 0%, transparent 60%), linear-gradient(135deg, ${bg2}, ${bg0})`,
    onDark:"#F6F7FB",
    onDarkSub:"rgba(246,247,251,0.72)",
    chipBg:"rgba(255,255,255,0.09)",
    chipBorder:`${d.point}55`,
    chipText:"#F6F7FB",
    bubble:"rgba(255,255,255,0.08)",
    divider:"rgba(255,255,255,0.1)",
    boxBg:`radial-gradient(100% 90% at 18% 0%, ${d.aura} 0%, transparent 58%), linear-gradient(150deg, ${card1}, ${card2})`,
    boxSolid:card2,
    boxText:"#F6F7FB",
    boxSub:"rgba(246,247,251,0.68)",
    boxBorder:`${d.point}66`,
    boxShadowCol:"rgba(3,8,24,0.48)",
    appBg:`linear-gradient(180deg, ${bg1} 0%, ${bg0} 48%, #090C18 100%)`,
    tabActive:`linear-gradient(135deg, ${d.point}, ${d.point2})`,
    accentBar:`linear-gradient(90deg, ${d.point}, ${d.point2})`,
    missionDark:true,
    radCard:22,
    radMid:18,
    radSmall:14,
  };
};

// 현재 테마(main)에 맞춰 흰색 계열 박스색을 같은 계열로 물들인 색 세트 생성
const makeThemeColors = (main) => ({
  ...C,
  card:   mixWhite(main, 0.96), // 거의 흰색이나 테마기운
  faint:  mixWhite(main, 0.90), // 항목 칸 기본 배경
  faintB: mixWhite(main, 0.82), // 항목 칸 테두리/진한 배경
});

// ── 디자인 토큰 ───────────────────────────────────────
// 글씨·여백·모서리·그림자를 일정 단계로 통일해 화면 전반의 통일감을 유지한다.
const FS = { // font-size scale
  cap:11,   // 캡션/뱃지 보조
  sm:13,    // 보조 설명
  base:15,  // 본문 기본
  md:17,    // 강조 본문/버튼
  lg:20,    // 카드 제목
  xl:24,    // 섹션 헤드라인
  xxl:30,   // 큰 수치
};
const RAD = { sm:10, md:14, lg:20, pill:999 }; // border-radius scale
const SP  = { xs:6, sm:10, md:14, lg:20, xl:28 }; // spacing scale
const SHADOW = {
  sm:"0 2px 8px rgba(20,24,60,0.05)",
  md:"0 6px 18px rgba(20,24,60,0.07)",
  lg:"0 16px 44px rgba(20,24,60,0.12)",
};

const gameCard = {
  background:"#fff",
  borderRadius:RAD.lg,
  border:`1px solid ${C.border}`,
  boxShadow:SHADOW.md
};

const CHARACTER_CARD = {
  borderRadius:22,
  padding:"18px",
  marginBottom:14,
  background:"#fff",
  border:`1px solid ${C.border}`,
  boxShadow:"0 4px 14px rgba(0,0,0,.05)"
};

const GAME_MODAL_STYLE = {
  overlay:{
    position:"fixed",
    inset:0,
    background:"rgba(0,0,0,.72)",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    zIndex:9999,
    padding:20
  },
  card:{
    width:"100%",
    maxWidth:360,
    borderRadius:28,
    overflow:"hidden",
    background:"#fff",
    boxShadow:"0 25px 80px rgba(0,0,0,.35)",
    animation:"gamePop .45s ease-out",
    position:"relative"
  },
  body:{
    padding:"24px"
  }
};
const PALETTE = ["#FF6B6B","#FFC312","#26de81","#4A90E2","#9B59B6","#E91E8C"];
const DEFAULT_HOMEWORK_SCORE = 10;
const EXTRA_QUEST_ID = "extra_quest";
const DEV_PIN = "9999"; // 개발자 도구 진입용 PIN

// ── 프리미엄(유료) 설정 ─────────────────────────────────
// PREMIUM_ENABLED = false 이면 모든 잠금이 해제되어 지금처럼 전 기능 무료로 동작한다.
// 유료 전환 시점에 이 값만 true 로 바꾸면 잠금이 일제히 작동한다. (그 외 코드 수정 불필요)
const PREMIUM_ENABLED = false;
// 창립 사용자(무료 기간 설치자)는 PREMIUM_ENABLED 가 켜져도 평생 프리미엄으로 대우할지 여부
const FOUNDING_USER_IS_PREMIUM = true;
// 무료로 열어줄 테마 개수 (앞에서부터 N개는 무료, 나머지는 프리미엄 잠금)
const FREE_THEME_COUNT = 2;

const DEFAULT_LEVELS = [
  { level:1,  name:"루키",         minScore:0,     emoji:"⚔️" },
  { level:2,  name:"탐험가",       minScore:40,    emoji:"🧭" },
  { level:3,  name:"수련생",       minScore:120,   emoji:"📘" },
  { level:4,  name:"어드벤처",     minScore:240,   emoji:"🗺️" },
  { level:5,  name:"헌터",         minScore:400,   emoji:"🏹" },
  { level:6,  name:"에이스",       minScore:600,   emoji:"⭐" },
  { level:7,  name:"가디언",       minScore:840,   emoji:"🛡️" },
  { level:8,  name:"챌린저",       minScore:1120,  emoji:"🚀" },
  { level:9,  name:"마스터",       minScore:1440,  emoji:"🏆" },
  { level:10, name:"챔피언",       minScore:1800,  emoji:"🥇" },
  { level:11, name:"히어로",       minScore:2200,  emoji:"🦸" },
  { level:12, name:"레인저",       minScore:2640,  emoji:"🌲" },
  { level:13, name:"워리어",       minScore:3120,  emoji:"🗡️" },
  { level:14, name:"커맨더",       minScore:3640,  emoji:"🎖️" },
  { level:15, name:"그랜드마스터", minScore:4200,  emoji:"💎" },
  { level:16, name:"레전드",       minScore:4800,  emoji:"👑" },
  { level:17, name:"미스틱",       minScore:5440,  emoji:"🔮" },
  { level:18, name:"타이탄",       minScore:6120,  emoji:"🗿" },
  { level:19, name:"불멸자",       minScore:6840,  emoji:"🌌" },
  { level:20, name:"월드클래스",   minScore:7600,  emoji:"🌟" },
];

// 베이커리(cute) 모드 레벨 — 던전과 동일한 minScore 임계값을 공유하고
// 이름/이모지만 갈아끼운다. (level 번호로 매칭)
const BAKERY_LEVELS = [
  { level:1,  name:"밀가루 요정",     emoji:"🌾" },
  { level:2,  name:"반죽 요정",       emoji:"🥣" },
  { level:3,  name:"쿠키 요정",       emoji:"🍪" },
  { level:4,  name:"컵케이크 요정",   emoji:"🧁" },
  { level:5,  name:"초보 제빵사",     emoji:"👧", emojiByGender:{boy:"👦",girl:"👧"} },
  { level:6,  name:"견습 파티시에",   emoji:"👩‍🍳", emojiByGender:{boy:"👨‍🍳",girl:"👩‍🍳"} },
  { level:7,  name:"달콤한 제빵사",   emoji:"🍰" },
  { level:8,  name:"케이크 전문가",   emoji:"🎂" },
  { level:9,  name:"인기 파티시에",   emoji:"🌸" },
  { level:10, name:"베이커리 스타",   emoji:"🌟" },
  { level:11, name:"마카롱 장인",     emoji:"🎀" },
  { level:12, name:"디저트 연구원",   emoji:"📖" },
  { level:13, name:"무지개 파티시에", emoji:"🌈" },
  { level:14, name:"왕실 파티시에",   emoji:"🍮" },
  { level:15, name:"디저트 수호자",   emoji:"💎" },
  { level:16, name:"황금 제빵사",     emoji:"🥇" },
  { level:17, name:"꿈의 파티시에",   emoji:"🍭" },
  { level:18, name:"별빛 파티시에",   emoji:"⭐" },
  { level:19, name:"디저트 여왕",     emoji:"👑" },
  { level:20, name:"전설의 파티시에", emoji:"✨" },
];

// 레벨 객체(=DEFAULT_LEVELS 항목)를 현재 스킨에 맞춰 이름/이모지만 치환해 반환.
// minScore 등 나머지 필드는 그대로 유지하므로 점수 계산 로직은 영향 없음.
const levelView = (lv, skin, gender) => {
  if(!lv) return lv;
  if(skin==="cute"){
    const b = BAKERY_LEVELS.find(x=>x.level===lv.level);
    if(b){
      const emoji = (b.emojiByGender && gender && b.emojiByGender[gender]) || b.emoji;
      return { ...lv, name:b.name, emoji };
    }
  }
  return lv;
};

const GAME = {
  dark:"#15162E",
  dark2:"#20224A",
  gold:"#FFD166",
  coin:"#F4C542",
  xp:"#6C63FF",
  streak:"#FF6B6B",
  blue:"#4A90E2",
  neon:"#6C63FF",
  green:"#22C9A0",
  red:"#FF5C7A",
};

// ════════════════════════════════════════════════════════════
// 스킨 시스템 — 모든 모드별 디자인/텍스트/세계관을 한곳에 모음
// 구조는 동일, 값만 모드별로 다름. 렌더부는 SKINS[mode] 를 참조.
// ════════════════════════════════════════════════════════════
const SKINS = {
  // ── 던전 모드 (기존) ──────────────────────────────────────
  dungeon: {
    id:"dungeon",
    name:"던전 게임",
    selectEmoji:"⚔️",
    selectDesc:"용사가 되어 던전을 클리어하자!",
    // 팔레트
    palette:{
      dark:"#15162E", dark2:"#20224A",
      gold:"#FFD166", coin:"#F4C542", xp:"#6C63FF",
      streak:"#FF6B6B", accent:"#6C63FF",
      green:"#22C9A0", neon:"#6C63FF", red:"#FF5C7A",
      panelBg:"linear-gradient(160deg,#1B1D3A,#15162E)",
      panelText:"#FFFFFF", panelSub:"#A8AED0",
      // 헤더(dark 배경) 위에 올라가는 요소 토큰 — 던전은 기존 흰색 룩 유지
      headerBg:"linear-gradient(135deg, #15162E, #20224A)", // dark→th.main 은 렌더부에서 합성, 여기는 폴백용
      onDark:"#FFFFFF", onDarkSub:"rgba(255,255,255,0.75)",
      chipBg:"rgba(255,255,255,0.16)", chipBorder:"rgba(255,255,255,0.35)",
      chipText:"#FFFFFF",
      bubble:"rgba(255,255,255,0.08)", divider:"rgba(255,255,255,0.1)",
      // 던전식 '어두운 박스' 토큰 — 던전은 기존 어두운 룩 유지
      boxBg:"linear-gradient(135deg, #15162E, #20224A)",
      boxSolid:"#15162E",
      boxText:"#FFFFFF", boxSub:"rgba(255,255,255,0.72)",
      boxBorder:"rgba(255,255,255,0.1)",
      boxShadowCol:"rgba(20,22,46,0.33)",
      // 화면 전체 바탕 — 던전은 기존 차가운 톤 유지
      appBg:null,
      // 학원카드 내부 미션 강조박스 — 던전은 어두운(테마색 어둡게) 그대로
      missionDark:true,
      radCard:20, radMid:18, radSmall:14,
    },
    // 아이별 테마색(분홍·살구·연두·보라·파랑)을 던전 룩에 입히는 함수.
    // static palette는 폴백이고, 실제 렌더링은 이 paletteFn 결과를 사용한다.
    paletteFn:(main)=>dungeonPalette(main),
    // 세계관 텍스트
    text:{
      tabs:{ quest:"⚔️ 미션", character:"🧙 내 캐릭터" },
      heroStatus:"HERO STATUS",
      dailyArea:"TODAY MISSION",
      todayQuest:"오늘의 미션",
      questList:"📜 미션 목록",
      missionEmoji:"🎯",
      missionTag:"⚔️ TODAY'S MISSION",
      remainMission:"⚔️ 남은 미션",
      doneIcon:"🏆", failIcon:"💥", clearShort:"CLEAR",
      ready:"READY", clear:"CLEAR", failed:"FAILED",
      readyEmoji:"⚔️",
      restDay:"오늘은 미션이 없어요!",
      noQuest:"등록된 미션이 없어요",
      completeWord:"클리어",
      // 모험 장소(학원 일정) 섹션
      areaTag:"🗺️ ADVENTURE MAP",
      todayArea:"오늘의 모험 장소",
      dateAreaSuffix:"모험 장소",   // "{날짜} 모험 장소"
      noArea:"오늘은 모험 장소가 없어요",
      noAreaEmoji:"😴",
      areaCountIcon:"🏰",
      // 진행도별 응원 메시지
      progress:{
        rest:"오늘은 쉬어가는 날이야 😴",
        start:"오늘의 모험을 시작해볼까?",
        low:"아직 미션이 남아있어!",
        high:"거의 다 왔어!",
        done:"오늘 미션 클리어 완료!",
      },
      // 활동 기록(모험 기록) 라벨
      logName:"모험 기록",
      log:{
        quest:{icon:"⚔️",title:"미션 클리어"},
        treasure:{icon:"🎁",title:"보물상자 오픈"},
        reward:{icon:"🛒",title:"아이템 구매"},
        level_bonus:{icon:"✨",title:"레벨업 보너스"},
        badge_reward:{icon:"🏆",title:"업적 보상"},
        manual:{icon:"✍️",title:"엄마 XP 조정"},
        default:{icon:"📜",title:"모험 기록"},
      },
    },
    // 완료 표시 = 기존 체크(던전은 도장 모티프 OFF)
    stamp:{ on:false },
    // 학원명 → 아이콘/라벨 매칭 (기존 던전 규칙)
    academyRules:[
      { kw:["영어","english","어학","파닉스","토익","토플"], icon:"📖", label:"마법 언어의 탑" },
      { kw:["수학","math","산수","연산","사고력"],            icon:"🔢", label:"숫자 미궁" },
      { kw:["국어","논술","독서","글쓰기","문해"],            icon:"✍️", label:"고대 문헌의 방" },
      { kw:["과학","science","코딩","로봇","컴퓨터","sw","stem"], icon:"🔬", label:"연금술 실험실" },
      { kw:["태권","태권도","검도","합기도","유도","무술","주짓수"], icon:"🥋", label:"용사의 도장" },
      { kw:["피아노","바이올린","음악","첼로","기타","드럼","악기"], icon:"🎹", label:"선율의 신전" },
      { kw:["미술","그림","드로잉","아트","art","디자인"],     icon:"🎨", label:"색채의 화방" },
      { kw:["발레","무용","댄스","dance","방송댄스"],          icon:"🩰", label:"춤추는 무대" },
      { kw:["수영","swim","스포츠","축구","농구","체육","운동"], icon:"🏊", label:"물의 시련장" },
      { kw:["바둑","장기","체스","보드"],                      icon:"♟️", label:"전략의 방" },
      { kw:["한자","중국어","일본어","제2외국어","스페인어"],  icon:"🀄", label:"동방 문자의 길" },
      { kw:["요리","쿠킹","베이킹"],                           icon:"🍳", label:"마녀의 부엌" },
    ],
    academyDefault:{ icon:"🏰", label:"미지의 던전" },
    // 완료 연출 타입
    clearEffect:"slash", // 검 베기 느낌
  },

  // ── 귀여운 모드 (베이커리/디저트 가게 🧁) ─────────────────
  cute: {
    id:"cute",
    name:"베이커리 게임",
    selectEmoji:"🧁",
    selectDesc:"달콤한 가게의 주인이 되어 도장을 모으자!",
    // 팔레트 — 맑고 부드러운 톤 (연한 핑크·크림빛으로 화면 전반을 감싼다)
    palette:{
      // dark/dark2 는 던전에선 어두운 배경이지만, 베이커리에선
      // '맑은 박스 위 진한 글씨색'으로만 의미를 가진다 (박스 배경은 boxBg 가 담당).
      dark:"#6B4A5C", dark2:"#A23E63",          // 코코아 / 진베리 (글씨·포인트)
      gold:"#F7A8C4", coin:"#FFC98A", xp:"#C3A0E6",
      streak:"#FF9DBE", accent:"#F7A8C4",
      green:"#7FCBBC", neon:"#C3A0E6", red:"#FF8FB0",
      panelBg:"linear-gradient(160deg,#FFF6FA,#FBF1F7)",
      panelText:"#6B4A5C", panelSub:"#B392A4",
      // 헤더 — 연한 핑크/크림 그라데이션 + 진한 코코아 글씨
      headerBg:"linear-gradient(135deg, #FFEAF1, #FBEFF6)",
      onDark:"#6B4A5C", onDarkSub:"rgba(107,74,92,0.62)",
      chipBg:"rgba(255,255,255,0.7)", chipBorder:"rgba(107,74,92,0.18)",
      chipText:"#6B4A5C",
      bubble:"rgba(255,255,255,0.5)", divider:"rgba(107,74,92,0.12)",
      // 던전식 '어두운 박스'들이 참조하는 토큰 — 베이커리는 맑은 크림박스
      boxBg:"linear-gradient(135deg, #FFF3F8, #FBEDF4)",
      boxSolid:"#FFF3F8",
      boxText:"#6B4A5C", boxSub:"rgba(107,74,92,0.6)",
      boxBorder:"rgba(107,74,92,0.14)",
      boxShadowCol:"rgba(214,160,184,0.30)",
      // 화면 전체 바탕 — 연한 핑크·크림빛으로 감싼다
      appBg:"linear-gradient(180deg, #FFF0F6 0%, #FFF6F2 45%, #FDF4F8 100%)",
      // 학원카드 내부 미션 강조박스 — 베이커리는 맑은 박스
      missionDark:false,
      radCard:28, radMid:22, radSmall:16,
    },
    // 테마색 적용 팔레트 — '진한 마카롱 카드 + 연한 크림 내용칸' 구조.
    // 카드(박스) 배경을 진하게 깔고, 그 안의 작은 칸을 연하게 해서
    // 진한 액자 안에 보송한 카드가 담긴 마카롱 디저트 박스 느낌을 낸다.
    // 글씨는 진코코아로 통일(진한 카드/연한 칸 양쪽 다 또렷).
    paletteFn:(main)=>{
      const m = main || "#DE869C";
      const tint = (wf)=>softTint(m, wf);   // 크림빛+채도부스트(맑고 따뜻하게)
      const COCOA = "#5A3A4A";
      const COCOA_SUB = "rgba(90,58,74,0.62)";
      // ── 농도 (역전): 카드가 진하고, 내용칸이 연하다. 전반적으로 크림화이트를 더 섞음 ──
      const L_app   = tint(0.88);  // 바탕 (크림에 가깝게, 햇살 가득)
      const L_card  = tint(0.62);  // 카드/박스 (부드러운 마카롱)  ← 액자
      const L_inner = tint(0.93);  // 내용칸/칩 (거의 크림)        ← 보송한 알맹이
      const L_innerD= tint(0.88);  // 내용칸 살짝 진한 변형
      const L_deep  = tint(0.42);  // 강조 포인트(가장 진한 칸도 부드럽게)
      return {
        dark:COCOA, dark2:"#A23E63",
        gold:L_deep, coin:"#F7B85C", xp:L_deep,
        streak:L_deep, accent:L_deep,
        green:"#5FC2AE", neon:L_deep, red:"#FF7DA0",
        themePop:L_deep, themePopD:tint(0.16),
        tabActive:`linear-gradient(135deg, ${mixBlack(m,0.20)}, ${mixBlack(m,0.04)})`,
        accentBar:`linear-gradient(135deg, ${tint(0.16)}, ${L_deep})`,
        panelBg:`linear-gradient(160deg, ${L_card}, ${tint(0.34)})`,
        panelText:COCOA, panelSub:COCOA_SUB,
        // 헤더 — 진한 마카롱 카드 톤 (바탕보다 진하게 떠 보임)
        headerBg:`linear-gradient(135deg, ${tint(0.54)}, ${tint(0.66)})`,
        onDark:COCOA, onDarkSub:COCOA_SUB,
        // 칩/내용칸 — 연한 크림 (진한 카드 위에서 보송하게 떠 보임)
        chipBg:L_inner, chipBorder:"rgba(255,255,255,0.55)", chipText:COCOA,
        bubble:"rgba(255,255,255,0.35)", divider:"rgba(90,58,74,0.18)",
        // 박스/카드 — 진한 마카롱 (액자)
        boxBg:`linear-gradient(135deg, ${L_card}, ${tint(0.34)})`,
        boxSolid:L_card,
        boxText:COCOA, boxSub:COCOA_SUB,
        boxBorder:"rgba(90,58,74,0.18)",
        boxShadowCol:"rgba(190,150,165,0.22)",
        // 내용칸 토큰 (진한 카드 안에 들어가는 연한 칸)
        innerBg:L_inner, innerBgD:L_innerD, innerText:COCOA, innerBorder:"rgba(255,255,255,0.6)",
        // 강조 포인트 칸 (가장 진한 마카롱) — 특별히 띄울 때
        popBox:L_deep, popBoxText:COCOA, popBoxBorder:"rgba(90,58,74,0.24)",
        appBg:`linear-gradient(180deg, ${L_app} 0%, ${tint(0.76)} 45%, ${tint(0.73)} 100%)`,
        missionDark:false,
        // 둥글기 — 베이커리는 더 말랑하게(큰 카드 28, 중간 22, 작은 16)
        radCard:28, radMid:22, radSmall:16,
        // 배경 스프링클 점무늬(포장지 느낌) — appBg 위에 겹친다
        appPattern:`radial-gradient(${tint(0.40)} 1.5px, transparent 1.6px), radial-gradient(${tint(0.40)} 1.5px, transparent 1.6px)`,
        appPatternSize:"22px 22px", appPatternPos:"0 0, 11px 11px",
      };
    },
    // 세계관 텍스트 — 베이커리/도장
    text:{
      tabs:{ quest:"🎀 오늘 할 일", character:"🧸 내 캐릭터" },
      heroStatus:"오늘의 나",
      dailyArea:"오늘의 가게",
      todayQuest:"오늘의 미션",
      questList:"🧾 미션 목록",
      missionEmoji:"🧁",
      missionTag:"🧁 오늘의 베이킹",
      remainMission:"🍰 남은 미션",
      doneIcon:"🎀", failIcon:"🥲", clearShort:"완료",
      ready:"준비!", clear:"참 잘했어요", failed:"아쉬워요",
      readyEmoji:"🧁",
      restDay:"오늘은 쉬는 날이에요! 🍪",
      noQuest:"아직 할 일이 없어요",
      completeWord:"도장 꾹",
      // 모험 장소(학원 일정) 섹션 → 베이커리 톤
      areaTag:"TODAY'S STREET",
      todayArea:"🏡 오늘의 거리",
      dateAreaSuffix:"들를 가게",   // "{날짜} 들를 가게"
      noArea:"오늘은 들를 가게가 없어요",
      noAreaEmoji:"🍪",
      areaCountIcon:"🏡",
      // 진행도별 응원 메시지 → 베이커리 톤
      progress:{
        rest:"오늘은 가게 문을 닫고 쉬는 날이에요 🍪",
        start:"오늘도 달콤하게 시작해볼까요? 🧁",
        low:"아직 만들 게 남았어요!",
        high:"거의 다 구웠어요! 🍞",
        done:"오늘 가게 일 끝! 참 잘했어요 🎀",
      },
      // 활동 기록(베이커리 일기) 라벨
      logName:"베이커리 일기",
      log:{
        quest:{icon:"🧁",title:"미션 완료"},
        treasure:{icon:"🎀",title:"디저트상자 오픈"},
        reward:{icon:"🛍️",title:"아이템 구매"},
        level_bonus:{icon:"✨",title:"레벨업 보너스"},
        badge_reward:{icon:"🏆",title:"업적 보상"},
        manual:{icon:"✍️",title:"엄마 XP 조정"},
        default:{icon:"📖",title:"베이커리 일기"},
      },
    },
    // 완료 표시 = 도장 찍기 (베이커리 핵심 모티프)
    stamp:{
      on:true,
      color:"#D6455A",        // 도장 잉크색(빨강)
      face:"🎀",              // 도장 안에 찍히는 것 (이모지 또는 글자)
      ringText:"참잘했어요",   // 도장 테두리 문구(원형)
      anim:"stampDrop .5s cubic-bezier(.3,1.5,.5,1) both",
    },
    // 학원명 → 베이커리/디저트 아이콘·라벨 (던전과 같은 12개 카테고리)
    academyRules:[
      { kw:["영어","english","어학","파닉스","토익","토플"], icon:"🍓", label:"딸기 알파벳 카페" },
      { kw:["수학","math","산수","연산","사고력"],            icon:"🍩", label:"도넛 숫자 가게" },
      { kw:["국어","논술","독서","글쓰기","문해"],            icon:"📕", label:"책읽는 북카페" },
      { kw:["과학","science","코딩","로봇","컴퓨터","sw","stem"], icon:"🧪", label:"보글보글 실험실" },
      { kw:["태권","태권도","검도","합기도","유도","무술","주짓수"], icon:"🥋", label:"씩씩한 도장" },
      { kw:["피아노","바이올린","음악","첼로","기타","드럼","악기"], icon:"🎵", label:"멜로디 음악방" },
      { kw:["미술","그림","드로잉","아트","art","디자인"],     icon:"🎨", label:"알록달록 그림방" },
      { kw:["발레","무용","댄스","dance","방송댄스"],          icon:"🩰", label:"반짝 무대" },
      { kw:["수영","swim","스포츠","축구","농구","체육","운동"], icon:"⛹️", label:"신나는 운동장" },
      { kw:["바둑","장기","체스","보드"],                      icon:"🧩", label:"생각하는 놀이방" },
      { kw:["한자","중국어","일본어","제2외국어","스페인어"],  icon:"🌏", label:"세계 친구들" },
      { kw:["요리","쿠킹","베이킹"],                           icon:"🧁", label:"달콤 베이커리" },
    ],
    academyDefault:{ icon:"🏡", label:"포근한 우리 가게" },
    // 완료 연출 타입
    clearEffect:"stamp", // 도장 꾹 찍기
  },
};
const DEFAULT_SKIN = "dungeon";
const getSkin = (mode) => SKINS[mode] || SKINS[DEFAULT_SKIN];

// ── 학원명 → 던전 아이콘/테마 자동 매칭 ─────────────────────
// 학원 이름 속 키워드로 RPG 던전 느낌의 아이콘과 라벨을 자동 부여한다.
const ACADEMY_DUNGEON_RULES = [
  { kw:["영어","english","어학","파닉스","토익","토플"],            icon:"📖", label:"마법 언어의 탑" },
  { kw:["수학","math","산수","연산","사고력"],                       icon:"🔢", label:"숫자 미궁" },
  { kw:["국어","논술","독서","글쓰기","문해"],                       icon:"✍️", label:"고대 문헌의 방" },
  { kw:["과학","science","코딩","로봇","컴퓨터","sw","stem"],        icon:"🔬", label:"연금술 실험실" },
  { kw:["태권","태권도","검도","합기도","유도","무술","주짓수"],     icon:"🥋", label:"용사의 도장" },
  { kw:["피아노","바이올린","음악","첼로","기타","드럼","악기"],     icon:"🎹", label:"선율의 신전" },
  { kw:["미술","그림","드로잉","아트","art","디자인"],               icon:"🎨", label:"색채의 화방" },
  { kw:["발레","무용","댄스","dance","방송댄스"],                    icon:"🩰", label:"춤추는 무대" },
  { kw:["수영","swim","스포츠","축구","농구","체육","운동"],         icon:"🏊", label:"물의 시련장" },
  { kw:["바둑","장기","체스","보드"],                                icon:"♟️", label:"전략의 방" },
  { kw:["한자","중국어","일본어","제2외국어","스페인어"],            icon:"🀄", label:"동방 문자의 길" },
  { kw:["요리","쿠킹","베이킹"],                                     icon:"🍳", label:"마녀의 부엌" },
];
const getAcademyDungeon = (name="") => {
  const n = String(name).toLowerCase();
  for(const r of ACADEMY_DUNGEON_RULES){
    if(r.kw.some(k=>n.includes(k.toLowerCase()))) return r;
  }
  return { icon:"🏰", label:"미지의 던전" };
};

// ── 스킨별 학원 아이콘/라벨 매칭 ───────────────────────────
// 베이커리(cute) 모드는 SKINS.cute.academyRules/academyDefault 를 사용하고,
// 그 외(던전 등)는 기존 getAcademyDungeon 규칙을 그대로 사용한다.
const getAcademyTheme = (name="", skin=DEFAULT_SKIN) => {
  const s = SKINS[skin];
  if(s && s.academyRules){
    const n = String(name).toLowerCase();
    for(const r of s.academyRules){
      if(r.kw.some(k=>n.includes(k.toLowerCase()))) return r;
    }
    return s.academyDefault || { icon:"🏡", label:"우리 가게" };
  }
  return getAcademyDungeon(name);
};

const CHARACTER_EVOLUTIONS = [
  { minLevel:1,  name:"새싹 모험가",   avatar:{boy:"🧒",girl:"👧"},  badge:"⚔️", bg:"linear-gradient(135deg,#E0F2FE,#F8FAFC)" },
  { minLevel:5,  name:"견습 용사",     avatar:{boy:"🧑",girl:"👩"},  badge:"🛡️", bg:"linear-gradient(135deg,#DCFCE7,#F8FAFC)" },
  { minLevel:9,  name:"숙련 헌터",     avatar:{boy:"🧝‍♂️",girl:"🧝‍♀️"},  badge:"🏹", bg:"linear-gradient(135deg,#FEF3C7,#F8FAFC)" },
  { minLevel:13, name:"영웅 기사",     avatar:{boy:"🦸‍♂️",girl:"🦸‍♀️"}, badge:"🗡️", bg:"linear-gradient(135deg,#EDE9FE,#F8FAFC)" },
  { minLevel:17, name:"전설의 수호자", avatar:{boy:"🧙‍♂️",girl:"🧙‍♀️"}, badge:"👑", bg:"linear-gradient(135deg,#FFF7ED,#FEF3C7)" },
];

// ── 펫 진화 (한 길, 0→4단계). 보물상자에서 낮은 확률로 1단계씩 진화 ──
const PET_STAGES = [
  { stage:0, emoji:"🥚", name:"신비한 알",     desc:"모든 모험의 시작" },
  { stage:1, emoji:"🐣", name:"아기 드래곤",   desc:"세상을 처음 만난 작은 용" },
  { stage:2, emoji:"🦎", name:"개구쟁이 드래곤", desc:"호기심 가득한 장난꾸러기" },
  { stage:3, emoji:"🐲", name:"늠름한 청룡",   desc:"용기와 책임감을 갖춘 수호자" },
  { stage:4, emoji:"🐉", name:"전설의 드래곤", desc:"전설로 남을 위대한 존재" },
];
// 상자 등급별 펫 진화 확률
const PET_EVOLVE_CHANCE = { normal:0.10, rare:0.18, legend:0.30 };
// 전설상자 안전망: 전설상자 2개 열 때마다 1단계 진화 보장(확률 진화와 별개의 천장).
const PET_EVOLVE_LEGEND_PITY = 2;

// 진화 단계별 격려 문구
const EVOLUTION_MESSAGES = {
  "새싹 모험가":   "모든 위대한 모험은 작은 한 걸음에서 시작돼요.",
  "견습 용사":     "매일의 작은 노력이 강한 용사를 만들고 있어요.",
  "숙련 헌터":     "해야 할 일을 스스로 찾아 해결하는 힘이 생겼어요.",
  "영웅 기사":     "책임감과 용기를 갖춘 진정한 영웅으로 성장하고 있어요.",
  "전설의 수호자": "자신의 길을 스스로 만들어가는 전설적인 수호자예요.",
};

// ════════════════════════════════════════════════════════════
// 베이커리(cute) 모드 — 성장체 / 펫 / 설명 치환 데이터
// 던전 구조(단계 수·minLevel·stage)는 그대로 두고 이름·이모지만 교체.
// ════════════════════════════════════════════════════════════
// 성장체 5단계 (CHARACTER_EVOLUTIONS 와 1:1 매칭, 남녀 공통 이모지)
const BAKERY_EVOLUTIONS = [
  // 파티시에 성장 4단계. 베이커리 전용 레벨 구간(minLevel): 1-6 / 7-11 / 12-16 / 17~
  { minLevel:1,  name:"꼬마 제빵사",     avatar:{boy:"👦",girl:"👧"},      bg:"linear-gradient(135deg,#FFF1F6,#FFFBF8)" },
  { minLevel:7,  name:"씩씩한 견습",     avatar:{boy:"🧑",girl:"👩"},      bg:"linear-gradient(135deg,#FFE8F1,#FFFBF8)" },
  { minLevel:12, name:"베이커리 요리사", avatar:{boy:"👨‍🍳",girl:"👩‍🍳"},  bg:"linear-gradient(135deg,#FCE7F3,#FFFBF8)" },
  { minLevel:17, name:"전설의 파티시에", avatar:{boy:"🤴",girl:"👸"},      bg:"linear-gradient(135deg,#FFF7ED,#FCE7F3)" },
];
// 성장체별 격려 문구 (베이커리)
const BAKERY_DESCRIPTION = {
  "꼬마 제빵사":     "모든 달콤한 꿈은 작은 첫걸음에서 시작돼요.",
  "씩씩한 견습":     "하나씩 해내는 미션이 멋진 성장을 만들고 있어요.",
  "베이커리 요리사": "꾸준한 노력으로 어엿한 요리사가 되었어요.",
  "전설의 파티시에": "모두가 인정하는 최고의 파티시에가 되었어요.",
};
// 펫 = 강아지→유니콘 성장 라인 (PET_STAGES 5단계와 1:1 매칭, 아바타 디저트와 구분)
const BAKERY_PET_DESCRIPTION = {
  "호기심 강아지": "세상에 대해 궁금한 것이 많은 작은 강아지예요.",
  "꿈꾸는 강아지": "언젠가 하늘을 달리는 유니콘이 되고 싶어 해요.",
  "별빛 조랑말":   "매일 노력하며 조금씩 꿈에 가까워지고 있어요.",
  "무지개 준마":   "이제 유니콘이 될 준비를 거의 마쳤어요.",
  "전설의 유니콘": "꿈을 포기하지 않아 마침내 유니콘이 되었어요.",
};
const BAKERY_PETS = [
  { emoji:"🐶", name:"호기심 강아지" },
  { emoji:"🐕", name:"꿈꾸는 강아지" },
  { emoji:"🐴", name:"별빛 조랑말" },
  { emoji:"🐎", name:"무지개 준마" },
  { emoji:"🦄", name:"전설의 유니콘" },
].map(p=>({ ...p, desc:BAKERY_PET_DESCRIPTION[p.name] }));

// 성장체 객체를 현재 스킨에 맞춰 치환 (idx = 단계 순서)
const evoView = (evo, idx, skin) => {
  if(!evo) return evo;
  if(skin==="cute"){
    // 베이커리는 4단계(던전은 5단계)라 idx가 범위를 넘으면 마지막(전설) 단계로 클램프
    const bi = Math.min(idx, BAKERY_EVOLUTIONS.length-1);
    const b = BAKERY_EVOLUTIONS[bi];
    if(b) return { ...evo, name:b.name, emoji:b.avatar?.girl||b.avatar?.boy, bg:b.bg,
                   avatar:{ boy:b.avatar?.boy, girl:b.avatar?.girl } };
  }
  return evo;
};
// 펫 객체를 현재 스킨에 맞춰 치환 (stage = 단계 순서)
const petView = (pet, stage, skin) => {
  if(!pet) return pet;
  if(skin==="cute"){
    const b = BAKERY_PETS[stage];
    if(b) return { ...pet, emoji:b.emoji, name:b.name, desc:b.desc };
  }
  return pet;
};
// 성장체 격려 문구를 현재 스킨에 맞춰 반환
const evoMsgView = (evoName, skin) => {
  if(skin==="cute") return BAKERY_DESCRIPTION[evoName] || EVOLUTION_MESSAGES[evoName] || "";
  return EVOLUTION_MESSAGES[evoName] || "";
};

const LEVEL_UP_REWARDS = {
  5:20, 10:40, 15:80, 20:150
};

const LEVEL_DESCRIPTION = {
  1:"모험을 시작한 새내기",
  2:"세상을 탐험하기 시작했어요",
  3:"꾸준히 성장하는 수련생",
  4:"본격적인 모험가",
  5:"숙제를 사냥하는 헌터",
  6:"믿음직한 에이스",
  7:"팀을 지키는 가디언",
  8:"도전을 즐기는 챌린저",
  9:"실력을 인정받는 마스터",
  10:"최고 수준의 챔피언",
  11:"모두가 인정하는 히어로",
  12:"새로운 길을 개척하는 레인저",
  13:"강인한 워리어",
  14:"팀을 이끄는 커맨더",
  15:"전설 직전의 그랜드마스터",
  16:"살아있는 전설",
  17:"신비로운 미스틱",
  18:"거대한 힘의 타이탄",
  19:"쓰러지지 않는 불멸자",
  20:"최고의 월드클래스"
};

const REWARD_GRADES = [
  { id:"common",    name:"일반", color:"#888888" },
  { id:"rare",      name:"희귀", color:"#4A90E2" },
  { id:"epic",      name:"영웅", color:"#9B59B6" },
  { id:"legendary", name:"전설", color:"#FF9F43" },
];

const getRewardGrade=(reward)=>REWARD_GRADES.find(g=>g.id===(reward.grade||"common"))||REWARD_GRADES[0];

const DEFAULT_REWARDS = [
  { id:1,  title:"사탕 하나",              point:10,    emoji:"🍬", grade:"common"    },
  { id:2,  title:"작은 과자",              point:50,    emoji:"🍪", grade:"common"    },
  { id:3,  title:"엄마랑 보드게임 15분",   point:100,   emoji:"🎲", grade:"common"    },
  { id:4,  title:"아이스크림",             point:300,   emoji:"🍦", grade:"rare"      },
  { id:5,  title:"영상 20분",              point:450,   emoji:"📺", grade:"rare"      },
  { id:6,  title:"편의점 간식 고르기",     point:600,   emoji:"🏪", grade:"rare"      },
  { id:7,  title:"게임 30분",              point:900,   emoji:"🎮", grade:"epic"      },
  { id:8,  title:"주말 특별 디저트",       point:1200,  emoji:"🧁", grade:"epic"      },
  { id:9,  title:"문구점 쇼핑",            point:1700,  emoji:"✏️", grade:"epic"      },
  { id:10, title:"작은 장난감",            point:2500,  emoji:"🧸", grade:"legendary" },
  { id:11, title:"키즈카페/놀이터 데이트", point:3800,  emoji:"🎡", grade:"legendary" },
  { id:12, title:"큰 선물 도전권",         point:5500,  emoji:"🎁", grade:"legendary" },
];

const TREASURE_REWARD_TABLE = {
  normal:{
    name:"일반상자",
    emoji:"📦",
    min:20,
    max:40,
    headerGrad:"linear-gradient(135deg,#94A3B8,#CBD5E1)"
  },
  rare:{
    name:"희귀상자",
    emoji:"🎁",
    min:40,
    max:80,
    headerGrad:"linear-gradient(135deg,#3B82F6,#60A5FA)"
  },
  legend:{
    name:"전설상자",
    emoji:"👑",
    min:100,
    max:160,
    headerGrad:"linear-gradient(135deg,#F59E0B,#FDE68A)"
  }
};

// 베이커리(cute) 모드: 보물창고 → 디저트상자 컨셉에 맞춘 상자 이름/이모지.
// (등급 구조·보상 수치는 그대로, 표시용 name/emoji 만 교체)
const BAKERY_BOX_MAP = {
  normal:{ name:"기본 상자", emoji:"📦", headerGrad:"linear-gradient(135deg,#F9C5D6,#FDE7EF)" },
  rare:  { name:"달콤 상자", emoji:"🎁", headerGrad:"linear-gradient(135deg,#F78FB3,#FAD0C4)" },
  legend:{ name:"스페셜 상자", emoji:"💝", headerGrad:"linear-gradient(135deg,#F5B301,#FFD98E)" },
};
// 상자 종류(normal/rare/legend)의 표시 정보를 현재 스킨에 맞춰 반환.
const getBoxInfo = (boxType, skin=DEFAULT_SKIN) => {
  const base = TREASURE_REWARD_TABLE[boxType] || TREASURE_REWARD_TABLE.normal;
  if(skin==="cute"){
    const b = BAKERY_BOX_MAP[boxType];
    if(b) return { ...base, name:b.name, emoji:b.emoji, ...(b.headerGrad?{headerGrad:b.headerGrad}:{}) };
  }
  return base;
};

const getRandomTreasureCoin=(boxType)=>{
  const table=TREASURE_REWARD_TABLE[boxType]||TREASURE_REWARD_TABLE.normal;
  return Math.floor(Math.random()*(table.max-table.min+1))+table.min;
};

const UI_TEXT = {
  tabs:{
    quest:"⚔️ 미션",
    character:"🧙 내 캐릭터",
  },
  section:{
    heroStatus:"HERO STATUS",
    dailyDungeon:"TODAY MISSION",
    todayQuest:"⚔️ 오늘의 미션",
    questList:"📜 미션 목록",
    itemShop:"🛒 아이템 상점",
    titleBook:"👑 상장",
    treasureStorage:"🎁 보물창고",
    xpHistory:"⭐ XP 통장",
  },
  status:{
    ready:"READY",
    clear:"CLEAR",
    failed:"FAILED",
  },
  label:{
    totalXp:"누적 XP",
    coin:"보유 코인",
    streak:"연속 달성",
    badge:"업적",
    box:"보물상자",
    nextLevel:"NEXT LEVEL",
  },
  button:{
    open:"열기 ▼",
    close:"닫기 ▲",
    requestBuy:"🎁 받을래요!",
    pending:"엄마 기다리는 중",
    needCoin:"코인이 더 필요해요",
    equip:"장착",
    equipped:"EQUIPPED",
    fail:"실패",
    cancelFail:"실패 취소",
  },
  message:{
    noQuest:"등록된 미션이 없어요",
    restDay:"오늘은 미션이 없어요!",
    needMoreCoin:"코인이 더 필요해요",
    waitingApproval:"엄마가 확인하고 있어요!",
  }
};

const LEGENDARY_TITLES = [
  { id:"gold_hunter",      name:"황금 사냥꾼",   emoji:"🥇", rarity:"legendary", condition:"전설상자 드롭", award:"전설상자에서 빛나는 보물을 찾아낸 행운의 모험가에게 이 상장을 드립니다 🥇", description:"전설상자에서만 획득 가능" },
  { id:"dragon_knight",    name:"드래곤 기사",   emoji:"🛡️", rarity:"legendary", condition:"전설상자 드롭", award:"전설상자에서 용맹한 기사의 힘을 얻은 모험가에게 이 상장을 드립니다 🛡️", description:"전설상자에서만 획득 가능" },
  { id:"treasure_king",    name:"보물왕",        emoji:"💎", rarity:"legendary", condition:"전설상자 드롭", award:"전설상자에서 최고의 보물을 손에 넣은 모험가에게 이 상장을 드립니다 💎", description:"전설상자에서만 획득 가능" },
  { id:"starlight_wizard", name:"별빛 마법사",   emoji:"✨", rarity:"legendary", condition:"전설상자 드롭", award:"전설상자에서 반짝이는 마법을 얻은 모험가에게 이 상장을 드립니다 ✨", description:"전설상자에서만 획득 가능" },
  { id:"shadow_assassin",  name:"그림자 암살자", emoji:"🌙", rarity:"legendary", condition:"전설상자 드롭", award:"전설상자에서 신비한 그림자의 힘을 만난 모험가에게 이 상장을 드립니다 🌙", description:"전설상자에서만 획득 가능" },
];

const TITLE_RARITY = {
  common:    { name:"일반", color:"#94A3B8", bg:"#F8FAFC",  icon:"⚪" },
  rare:      { name:"희귀", color:"#3B82F6", bg:"#EFF6FF",  icon:"🔵" },
  epic:      { name:"영웅", color:"#9333EA", bg:"#FAF5FF",  icon:"🟣" },
  legendary: { name:"전설", color:"#F59E0B", bg:"#FFF7ED",  icon:"👑" },
};

const DEFAULT_TITLES = [
  { id:"rookie", name:"꼬마 모험가", emoji:"⚔️", condition:"기본 상장", award:"드디어 모험의 첫걸음을 내디딘 꼬마 모험가에게 이 상장을 드립니다 ⚔️", rarity:"common" },
  { id:"first_quest", name:"첫걸음 용사", emoji:"👣", condition:"첫 미션 완료", award:"첫 번째 임무를 용감하게 해낸 모험가에게 이 상장을 드립니다 👣", rarity:"common" },
  { id:"quest_10_title", name:"미션 입문자", emoji:"🎯", condition:"미션 10개 완료", award:"임무를 10개나 완수한 멋진 모험가에게 이 상장을 드립니다 🎯", rarity:"common" },
  { id:"xp_100_title", name:"반짝 새싹", emoji:"🌱", condition:"100 XP 달성", award:"경험치 100을 모으며 쑥쑥 자라난 모험가에게 이 상장을 드립니다 🌱", rarity:"common" },
  { id:"reward_1_title", name:"첫 쇼핑러", emoji:"🛒", condition:"첫 보상 구매", award:"열심히 모은 코인으로 첫 보상을 받은 모험가에게 이 상장을 드립니다 🛒", rarity:"common" },

  { id:"quest_hunter", name:"미션 헌터", emoji:"🏹", condition:"미션 50개 완료", award:"임무를 50개나 끝까지 해낸 멋진 모험가에게 이 상장을 드립니다 🏹", rarity:"rare" },
  { id:"homework_master", name:"숙제왕", emoji:"📚", condition:"숙제 30개 완료", award:"숙제를 30개나 완수한 성실한 모험가에게 이 상장을 드립니다 📚", rarity:"rare" },
  { id:"streak_3_title", name:"꾸준한 아이", emoji:"🔥", condition:"5일 연속 달성", award:"5일 연속 하루도 빠지지 않은 꾸준한 모험가에게 이 상장을 드립니다 🔥", rarity:"rare" },
  { id:"xp_500_title", name:"성실 수련생", emoji:"📘", condition:"500 XP 달성", award:"경험치 500을 모으며 꾸준히 성장한 모험가에게 이 상장을 드립니다 📘", rarity:"rare" },
  { id:"reward_3_title", name:"알뜰 쇼핑러", emoji:"🏷️", condition:"보상 5번 구매", award:"코인을 알뜰하게 모아 보상을 5번 받은 모험가에게 이 상장을 드립니다 🏷️", rarity:"rare" },

  { id:"streak_master", name:"불꽃 루틴러", emoji:"⚡", condition:"10일 연속 달성", award:"10일 연속 임무를 해낸 불꽃 같은 모험가에게 이 상장을 드립니다 ⚡", rarity:"epic" },
  { id:"quest_100_title", name:"집중의 신", emoji:"🧠", condition:"미션 100개 완료", award:"임무를 100개나 완수한 집중력 뛰어난 모험가에게 이 상장을 드립니다 🧠", rarity:"epic" },
  { id:"champion", name:"챔피언", emoji:"🏅", condition:"Lv.10 달성", award:"마침내 10레벨에 도달한 자랑스러운 챔피언에게 이 상장을 드립니다 🏅", rarity:"epic" },
  { id:"xp_3000_title", name:"빛나는 성장러", emoji:"🌟", condition:"3000 XP 달성", award:"경험치 3000을 모으며 눈부시게 성장한 모험가에게 이 상장을 드립니다 🌟", rarity:"epic" },
  { id:"reward_30_title", name:"쇼핑 마스터", emoji:"💳", condition:"보상 30번 구매", award:"보상을 30번이나 받은 진정한 쇼핑 마스터에게 이 상장을 드립니다 💳", rarity:"epic" },

  { id:"legend", name:"전설의 모험가", emoji:"👑", condition:"Lv.20 달성", award:"마침내 20레벨에 도달하여 모두의 모범이 된 전설의 모험가에게 이 상장을 드립니다 👑", rarity:"legendary" },
  { id:"streak_30_title", name:"30일 전설", emoji:"☄️", condition:"30일 연속 달성", award:"30일 연속이라는 전설적인 기록을 세운 모험가에게 이 상장을 드립니다 ☄️", rarity:"legendary" },
  { id:"treasure_master", name:"보물 사냥꾼", emoji:"💰", condition:"보물상자 50개 오픈", award:"보물상자를 50개나 열어젖힌 최고의 보물 사냥꾼에게 이 상장을 드립니다 💰", rarity:"legendary" },
  { id:"world_class", name:"월드클래스", emoji:"🌍", condition:"12000 XP 달성", award:"경험치 12000을 모은 세계 최고 수준의 모험가에게 이 상장을 드립니다 🌍", rarity:"legendary" },
  { id:"quest_700_title", name:"미션의 신화", emoji:"🌌", condition:"미션 700개 완료", award:"임무를 700개나 완수하여 신화를 써낸 모험가에게 이 상장을 드립니다 🌌", rarity:"legendary" },
];

// ── 베이커리(cute) 상장 치환 — 던전 상장 id 와 1:1 매칭 ──
// 등급·획득조건(condition은 표시용)·rarity는 그대로, 이름/이모지만 교체.
const BAKERY_TITLE_MAP = {
  // common
  rookie:           { name:"반죽 도우미",     emoji:"🥄", condition:"기본 상장", award:"드디어 베이커리의 첫걸음을 내디딘 반죽 도우미에게 이 상장을 드립니다 🥄" },
  first_quest:      { name:"쿠키 굽기 초보",  emoji:"🍪", condition:"첫 미션 완료", award:"첫 번째 미션을 맛있게 해낸 꼬마 제빵사에게 이 상장을 드립니다 🍪" },
  quest_10_title:   { name:"달콤한 제빵사",   emoji:"🧁", condition:"미션 10개 완료", award:"미션을 10개나 완성한 달콤한 제빵사에게 이 상장을 드립니다 🧁" },
  xp_100_title:     { name:"첫 반죽 친구",    emoji:"🌱", condition:"경험치 100 달성", award:"경험치 100을 모으며 쑥쑥 자라난 제빵사에게 이 상장을 드립니다 🌱" },
  reward_1_title:   { name:"첫 쿠키 손님",    emoji:"🛒", condition:"첫 보상 구매", award:"열심히 모은 코인으로 첫 보상을 받은 제빵사에게 이 상장을 드립니다 🛒" },
  // rare
  quest_hunter:     { name:"인기 파티시에",   emoji:"🍰", condition:"미션 50개 완료", award:"미션을 50개나 완성한 솜씨 좋은 파티시에에게 이 상장을 드립니다 🍰" },
  homework_master:  { name:"디저트 장인",     emoji:"🎀", condition:"숙제 30개 완료", award:"숙제를 30개나 완수한 성실한 디저트 장인에게 이 상장을 드립니다 🎀" },
  streak_3_title:   { name:"베이커리 스타",   emoji:"🌸", condition:"5일 연속 달성", award:"5일 연속 하루도 빠지지 않은 베이커리 스타에게 이 상장을 드립니다 🌸" },
  xp_500_title:     { name:"성실한 제빵사",   emoji:"📖", condition:"경험치 500 달성", award:"경험치 500을 모으며 꾸준히 성장한 제빵사에게 이 상장을 드립니다 📖" },
  reward_3_title:   { name:"알뜰 단골손님",   emoji:"🏷️", condition:"보상 5번 구매", award:"코인을 알뜰하게 모아 보상을 5번 받은 단골손님에게 이 상장을 드립니다 🏷️" },
  // epic
  streak_master:    { name:"꾸준한 제빵사",   emoji:"🥐", condition:"10일 연속 달성", award:"10일 연속 미션을 해낸 따끈따끈한 제빵사에게 이 상장을 드립니다 🥐" },
  quest_100_title:  { name:"케이크 마스터",   emoji:"🎂", condition:"미션 100개 완료", award:"미션을 100개나 완성한 솜씨 뛰어난 케이크 마스터에게 이 상장을 드립니다 🎂" },
  champion:         { name:"왕실 파티시에",   emoji:"🎖️", condition:"Lv.10 달성", award:"마침내 10레벨에 도달한 자랑스러운 왕실 파티시에에게 이 상장을 드립니다 🎖️" },
  xp_3000_title:    { name:"무지개 제빵사",   emoji:"🌈", condition:"경험치 3000 달성", award:"경험치 3000을 모으며 눈부시게 성장한 제빵사에게 이 상장을 드립니다 🌈" },
  reward_30_title:  { name:"쿠키 수집가",     emoji:"🛍️", condition:"보상 30번 구매", award:"보상을 30번이나 받은 진정한 쿠키 수집가에게 이 상장을 드립니다 🛍️" },
  // legendary (default)
  legend:           { name:"디저트 왕국의 주인", emoji:"👑", condition:"Lv.20 달성", award:"마침내 20레벨에 도달하여 모두가 사랑하는 디저트 왕국의 주인에게 이 상장을 드립니다 👑" },
  streak_30_title:  { name:"디저트 여왕",     emoji:"🌹", condition:"30일 연속 달성", award:"30일 연속이라는 전설적인 기록을 세운 디저트 여왕에게 이 상장을 드립니다 🌹" },
  treasure_master:  { name:"베이커리 사장님", emoji:"💰", condition:"디저트상자 50개 오픈", award:"디저트상자를 50개나 열어본 어엿한 베이커리 사장님에게 이 상장을 드립니다 💰" },
  world_class:      { name:"전설의 파티시에", emoji:"✨", condition:"경험치 12000 달성", award:"경험치 12000을 모은 세계 최고의 파티시에에게 이 상장을 드립니다 ✨" },
  quest_700_title:  { name:"신화의 레시피",   emoji:"📜", condition:"미션 700개 완료", award:"미션을 700개나 완성하여 신화를 써낸 제빵사에게 이 상장을 드립니다 📜" },
  // legendary (보물상자 전용)
  gold_hunter:      { name:"황금 크루아상",   emoji:"🥨", condition:"스페셜 상자에서 획득", award:"스페셜 상자에서 황금 크루아상을 찾아낸 행운의 제빵사에게 이 상장을 드립니다 🥨", description:"스페셜 상자에서만 획득 가능" },
  dragon_knight:    { name:"전설의 오븐 기사", emoji:"🔥", condition:"스페셜 상자에서 획득", award:"스페셜 상자에서 전설의 오븐을 만난 제빵사에게 이 상장을 드립니다 🔥", description:"스페셜 상자에서만 획득 가능" },
  treasure_king:    { name:"디저트 상자왕",   emoji:"💝", condition:"스페셜 상자에서 획득", award:"스페셜 상자에서 최고의 선물을 손에 넣은 제빵사에게 이 상장을 드립니다 💝", description:"스페셜 상자에서만 획득 가능" },
  starlight_wizard: { name:"별빛 파티시에",   emoji:"💫", condition:"스페셜 상자에서 획득", award:"스페셜 상자에서 반짝이는 마법을 얻은 제빵사에게 이 상장을 드립니다 💫", description:"스페셜 상자에서만 획득 가능" },
  shadow_assassin:  { name:"한밤의 제빵 요정", emoji:"🌙", condition:"스페셜 상자에서 획득", award:"스페셜 상자에서 신비한 밤의 요정을 만난 제빵사에게 이 상장을 드립니다 🌙", description:"스페셜 상자에서만 획득 가능" },
};
// 상장 객체를 현재 스킨에 맞춰 이름/이모지만 치환
const titleView = (t, skin) => {
  if(!t) return t;
  if(skin==="cute"){
    const b = BAKERY_TITLE_MAP[t.id];
    if(b) return { ...t, name:b.name, emoji:b.emoji, ...(b.condition?{condition:b.condition}:{}), ...(b.award?{award:b.award}:{}), ...(b.description?{description:b.description}:{}) };
  }
  return t;
};

// ══════════════════════════════════════════════════════════════
// 꾸미기(데코) 시스템 — 모자 / 테두리 / 배경 3종
// 구조: 카탈로그(기본 제공)는 전역 상수. 가격은 부모가 상점에서 수정 가능
// (수정값은 priceOverrides 로 아이별 아닌 전역 저장). 보유/장착은 아이별.
// 스킨별 이모지·이름이 약간 다름 → bakery 필드로 치환(없으면 공통).
// ══════════════════════════════════════════════════════════════
const DECOR_RARITY = {
  common:    { color:"#94A3B8" },
  rare:      { color:"#3B82F6" },
  epic:      { color:"#9333EA" },
  legendary: { color:"#F59E0B" },
};
// 모자: 캐릭터 이모지 위(머리)에 겹쳐 표시
const DECOR_HATS = [
  { id:"hat_tophat",  emoji:"🎩", name:"마술사 모자",  price:200,  rarity:"common",    bakery:{ emoji:"🍓", name:"딸기 모자" } },
  { id:"hat_goggles", emoji:"🥽", name:"전투 고글",    price:700,  rarity:"epic",      bakery:{ emoji:"💎", name:"보석 티아라" } },
  { id:"hat_thunder", emoji:"⚡", name:"천둥의 힘",    price:1200, rarity:"legendary", bakery:{ emoji:"🎀", name:"리본" } },
  { id:"hat_flame",   emoji:"🔥", name:"용의 불꽃",    price:1800, rarity:"legendary", bakery:{ emoji:"👑", name:"공주 왕관" } },
  { id:"hat_star",    emoji:"💫", name:"전설의 별빛",  price:2400, rarity:"legendary", bakery:{ emoji:"🌸", name:"벚꽃 머리띠" } },
  { id:"hat_crown",   emoji:"👑", name:"군주의 왕관",  price:2800, rarity:"legendary", bakery:{ emoji:"🌈", name:"무지개 왕관" } },
];
// 테두리: 프로필 액자 테두리 색/광택 (emoji 는 상점 표시용 아이콘)
// glow 는 던전(다크 무대)용, glowCute 는 베이커리(밝은 크림 무대)용 — 모드별로 빛번짐 색을 다르게 둔다.
const DECOR_BORDERS = [
  { id:"bd_bronze",  emoji:"🥉", name:"브론즈",  price:150,  rarity:"common",    grad:"linear-gradient(135deg,#CD7F32,#E8B583)", glow:"rgba(205,127,50,0.5)",  glowCute:"rgba(205,127,50,0.28)" },
  { id:"bd_silver",  emoji:"🥈", name:"실버",    price:400,  rarity:"rare",      shimmer:true, grad:"linear-gradient(115deg,#8A909C 0%,#C7CCD4 20%,#FFFFFF 38%,#D5D9E0 52%,#9CA3AF 70%,#EAECF0 86%,#B6BBC4 100%)", glow:"rgba(190,196,206,0.7)", glowCute:"rgba(150,156,168,0.35)" },
  { id:"bd_gold",    emoji:"🥇", name:"골드",    price:800,  rarity:"epic",      shimmer:true, grad:"linear-gradient(115deg,#C8860B 0%,#F5C542 18%,#FFF6C9 36%,#FBD24E 52%,#E0A21A 70%,#FFE89B 86%,#D9A323 100%)", glow:"rgba(245,180,30,0.78)", glowCute:"rgba(232,165,40,0.4)" },
  { id:"bd_diamond", emoji:"💎", name:"다이아",  price:1500, rarity:"legendary", shimmer:true, grad:"linear-gradient(115deg,#22D3EE 0%,#A5F3FC 22%,#FFFFFF 40%,#7DD3FC 58%,#67E8F9 76%,#C7F9FF 92%,#38BDF8 100%)", glow:"rgba(34,211,238,0.72)", glowCute:"rgba(120,200,220,0.36)", bakery:{ emoji:"❤️", name:"루비", grad:"linear-gradient(115deg,#E11D48 0%,#FDA4AF 22%,#FFFFFF 40%,#FB7185 58%,#F43F5E 76%,#FFE4E6 92%,#BE123C 100%)", glow:"rgba(244,63,94,0.72)", glowCute:"rgba(244,114,128,0.4)" } },
  { id:"bd_legend",  emoji:"👑", name:"레전드",  price:2500, rarity:"legendary", rainbow:true, grad:"linear-gradient(115deg,#FF5E8A,#FF9F43,#FFE14D,#4ADE80,#38BDF8,#A78BFA,#FF5E8A)", glow:"rgba(167,139,250,0.75)", glowCute:"rgba(190,160,235,0.4)" },
];
// 배경: 프로필 카드 배경 장식 (장식 이모지 + 은은한 그라데이션 오버레이)
// 기본(base) = 던전 톤, bakery = 베이커리 톤. decorView 가 cute 일 때 bakery 필드로 치환.
const DECOR_BGS = [
  { id:"bg_cloud",   emoji:"🚀", name:"우주여행",     price:200,  rarity:"common",    deco:["🚀","🌎","⭐"],   tint:"rgba(90,110,200,0.32)",  bakery:{ emoji:"☁️", name:"솜사탕 구름", deco:["☁️","☁️","🍬"], tint:"rgba(186,230,253,0.35)" } },
  { id:"bg_star",    emoji:"⭐", name:"별빛 성좌",   price:450,  rarity:"rare",      deco:["⭐","✨","🌟"],    tint:"rgba(120,150,230,0.3)",  bakery:{ emoji:"🍬", name:"별사탕 배경", deco:["🍬","🌟","🍭"], tint:"rgba(253,224,71,0.28)" } },
  { id:"bg_sakura",  emoji:"🔥", name:"화염 오라",   price:700,  rarity:"epic",      deco:["🔥","🔥","✨"],    tint:"rgba(255,110,60,0.3)",   bakery:{ emoji:"🌸", name:"벚꽃 배경", deco:["🌸","🌷","🌸"], tint:"rgba(251,207,232,0.4)" } },
  { id:"bg_rainbow", emoji:"⚡", name:"용의 기운",   price:1300, rarity:"legendary", deco:["⚡","🐉","⚡"],    tint:"rgba(150,120,240,0.3)",  bakery:{ emoji:"🌈", name:"무지개 배경", deco:["🌈","🧁","🍰"], tint:"rgba(196,181,253,0.32)" } },
];
// 캐릭터 스킨: 최종 성장체(Lv17) 달성 시 잠금 해제. 장착하면 성장체 대신 이 이모지로 보이고 모자는 숨겨짐(완성형).
// locked:true → 최종 성장체 도달 전엔 상점에 자물쇠로 표시. emoji 는 성별 공통(없으면 단일).
const DECOR_SKINS = [
  { id:"sk_vampire", emoji:"🧛",   name:"뱀파이어",   price:3000, rarity:"legendary", skin:true, bakery:{ emoji:"🧞",   name:"소원 요정" } },
  { id:"sk_robot",   emoji:"🤖",   name:"로봇",       price:3000, rarity:"legendary", skin:true, bakery:{ emoji:"👼",   name:"별빛 천사" } },
  { id:"sk_astro",   emoji:"👨‍🚀", name:"우주인",     price:3000, rarity:"legendary", skin:true, bakery:{ emoji:"👩‍🎨", name:"케이크 아티스트" } },
  { id:"sk_ninja",   emoji:"🥷",   name:"닌자",       price:3000, rarity:"legendary", skin:true, bakery:{ emoji:"🧚",   name:"꽃요정" } },
  { id:"sk_spy",     emoji:"🥸",   name:"변장 요원",  price:3000, rarity:"legendary", skin:true, bakery:{ emoji:"🧜‍♀️", name:"인어공주" } },
];
// 펫 스킨: 펫이 최종 진화(전설의 드래곤/유니콘) 했을 때 잠금 해제. 장착하면 펫 대신 이 동물 이모지로 보임(완성형).
// 캐릭터 스킨과 동일한 구조 — petskin:true. 던전/베이커리 공용 이모지(동물은 두 모드 모두 자연스러움).
const DECOR_PET_SKINS = [
  { id:"pk_fox",       emoji:"🦊",   name:"불꽃 여우",     price:2000, rarity:"epic",      petskin:true, bakery:{ name:"솜사탕 여우" } },
  { id:"pk_panda",     emoji:"🐼",   name:"대나무 판다",   price:2800, rarity:"epic",      petskin:true, bakery:{ name:"마시멜로 판다" } },
  { id:"pk_rabbit",    emoji:"🐰",   name:"질풍 토끼",     price:3600, rarity:"epic",      petskin:true, bakery:{ emoji:"🐦", name:"노래하는 새" } },
  { id:"pk_butterfly", emoji:"🦋",   name:"신비한 나비",   price:4500, rarity:"legendary", petskin:true, bakery:{ emoji:"🐰", name:"딸기 토끼" } },
  { id:"pk_lion",      emoji:"🦁",   name:"용맹한 사자",   price:5500, rarity:"legendary", petskin:true, bakery:{ name:"꿀빛 사자" } },
  { id:"pk_dragon",    emoji:"🦄",   name:"전설의 유니콘", price:6800, rarity:"legendary", petskin:true, bakery:{ emoji:"🦋", name:"반짝 나비" } },
];
const DECOR_GROUPS = [
  { key:"hat",     label:"모자",     icon:"👑", items:DECOR_HATS },
  { key:"border",  label:"테두리",   icon:"💎", items:DECOR_BORDERS },
  { key:"bg",      label:"배경",     icon:"🌸", items:DECOR_BGS },
  { key:"skin",    label:"캐릭터",   icon:"🦸", items:DECOR_SKINS,     lockUntilMaxEvo:true },
  { key:"petskin", label:"펫",       icon:"🐾", items:DECOR_PET_SKINS, lockUntilMaxPet:true },
];
const ALL_DECOR = [...DECOR_HATS, ...DECOR_BORDERS, ...DECOR_BGS, ...DECOR_SKINS, ...DECOR_PET_SKINS];
const getDecorById = (id) => ALL_DECOR.find(d=>d.id===id) || null;
// 스킨에 맞춰 이름/이모지/장식 치환한 데코 객체 반환
const decorView = (d, skin) => {
  if(!d) return d;
  if(skin==="cute" && d.bakery){
    return { ...d, ...d.bakery };
  }
  return d;
};

// ── 모드별 용어(재화·아이콘) ─────────────────────────────
// 던전: ⭐ XP / 💎 코인 / 🎁 보물상자
// 베이커리: ⭐ 경험치 / 🍪 쿠키 / 🎀 디저트상자 / 🎁 디저트 보관함
const TERMS = {
  dungeon: {
    xp:"XP", xpEmoji:"⭐",
    coin:"코인", coinEmoji:"💎",
    box:"보물상자", boxEmoji:"🎁",
    book:"보물창고", bookEmoji:"🎁",
  },
  cute: {
    xp:"경험치", xpEmoji:"⭐",
    coin:"쿠키", coinEmoji:"🍪",
    box:"디저트상자", boxEmoji:"🎀",
    book:"디저트 보관함", bookEmoji:"🧁",
  },
};
const getTerms = (skin) => TERMS[skin] || TERMS.dungeon;
const HOLIDAYS = {
  // 2025
  "2025-01-01":"신정",
  "2025-01-28":"설날 연휴",
  "2025-01-29":"설날",
  "2025-01-30":"설날 연휴",
  "2025-03-01":"삼일절",
  "2025-03-03":"대체공휴일",
  "2025-05-05":"어린이날",
  "2025-05-06":"어린이날 대체",
  "2025-05-15":"부처님오신날",
  "2025-06-06":"현충일",
  "2025-08-15":"광복절",
  "2025-10-03":"개천절",
  "2025-10-05":"추석 연휴",
  "2025-10-06":"추석",
  "2025-10-07":"추석 연휴",
  "2025-10-08":"대체공휴일",
  "2025-10-09":"한글날",
  "2025-12-25":"성탄절",
  // 2026
  "2026-01-01":"신정",
  "2026-02-16":"설날 연휴",
  "2026-02-17":"설날",
  "2026-02-18":"설날 연휴",
  "2026-03-01":"삼일절",
  "2026-03-02":"대체공휴일",
  "2026-05-05":"어린이날",
  "2026-05-24":"부처님오신날",
  "2026-05-25":"대체공휴일",
  "2026-06-06":"현충일",
  "2026-08-15":"광복절",
  "2026-09-24":"추석 연휴",
  "2026-09-25":"추석",
  "2026-09-26":"추석 연휴",
  "2026-10-03":"개천절",
  "2026-10-05":"대체공휴일",
  "2026-10-09":"한글날",
  "2026-12-25":"성탄절",
};
const isHoliday = (dateStr) => !!HOLIDAYS[dateStr];
const getHolidayName = (dateStr) => HOLIDAYS[dateStr]||"";

// ── 날짜 유틸 ─────────────────────────────
const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const TODAY = getToday();
const parseLocal = (s) => { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmt = (s) => { const d=parseLocal(s); return `${d.getMonth()+1}/${d.getDate()}(${["일","월","화","수","목","금","토"][d.getDay()]})`; };
const addDays = (s,n) => { const d=parseLocal(s); d.setDate(d.getDate()+n); return toStr(d); };
const todayDN = () => ["일","월","화","수","목","금","토"][new Date().getDay()];
const getCalDays = (y,m) => {
  const first=new Date(y,m,1).getDay(), last=new Date(y,m+1,0).getDate();
  const offset=first===0?6:first-1, arr=[];
  for(let i=0;i<offset;i++) arr.push(null);
  for(let d=1;d<=last;d++) arr.push(d);
  return arr;
};
const getDN = (y,m,d) => ["일","월","화","수","목","금","토"][new Date(y,m,d).getDay()];

// ── 저장 ─────────────────────────────────
const save = async (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const load = async (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };

// ── SMS ─────────────────────────────────
const smsLink=(phone,body="")=>{ const enc=encodeURIComponent(body); const ios=/iPad|iPhone|iPod/.test(navigator.userAgent); return `sms:${phone}${body?(ios?`&body=${enc}`:`?body=${enc}`):""}` };

// ── 기본 아이 데이터 ─────────────────────
const DEFAULT_CHILDREN = [
  { id:"child_1", name:"아이1", gender:"boy" }
];

// ── 최초 실행 시 한 번만 주입되는 샘플 데이터 (처음 쓰는 사람 참고용) ──
const buildSampleData = (seq=1, cid="child_1") => {
  const uniq = `${Date.now()}_${seq}`;
  const acSample = `sample_ac_${uniq}`;
  const children = [{ id:cid, name:"아이1(예시)", gender:"boy" }];
  const PRESETS = [
    { name:"피아노 학원 (예시)", color:"#6C63FF", time:"16:00", teacher:"김선생님", fee:150000,
      baseSupplies:["악보","연필"], baseHomeworks:["하농 1번 연습","오늘 배운 곡 1회 복습"],
      shuttleInfo:"학원 차량 16:00 아파트 정문", memo:"매주 토요일 연주회 준비",
      homeworks:["바이엘 20번 5회 연습","체르니 3번 양손 연습"], todos:["메트로놈 60에 맞춰 치기","악보 한 곡 외워오기"], supplies:["연습장"] },
    { name:"수학 학원 (예시)", color:"#FF6B6B", time:"17:00", teacher:"이선생님", fee:200000,
      baseSupplies:["교재","공책","연필"], baseHomeworks:["연산 문제 2장 풀기","오답 노트 정리"],
      shuttleInfo:"", memo:"매월 모의고사 응시",
      homeworks:["단원평가 1회분 풀기","틀린 문제 다시 풀기"], todos:["구구단 외우기"], supplies:["계산기"] },
    { name:"영어 학원 (예시)", color:"#34C759", time:"18:00", teacher:"박선생님", fee:180000,
      baseSupplies:["단어장","워크북"], baseHomeworks:["단어 20개 암기","리딩 1지문 읽기"],
      shuttleInfo:"학원 차량 18:00 아파트 후문", memo:"매주 금요일 단어 시험",
      homeworks:["단어 시험 대비 복습","듣기 1회 풀기"], todos:["영어 일기 3줄 쓰기"], supplies:["이어폰"] },
    { name:"태권도 (예시)", color:"#FF9500", time:"15:00", teacher:"최사범님", fee:120000,
      baseSupplies:["도복","띠"], baseHomeworks:["품새 1회 연습","스트레칭 10분"],
      shuttleInfo:"학원 차량 15:00 아파트 정문", memo:"다음 달 승급 심사",
      homeworks:["발차기 50회","팔굽혀펴기 20회"], todos:["오늘 배운 동작 복습"], supplies:["물통"] },
  ];
  const p = PRESETS[(seq-1) % PRESETS.length];
  const academies = {
    [cid]: [
      {
        ...EMPTY_AC,
        id:acSample,
        name:p.name,
        days:["월","화","수","목","금","토","일"],
        time:p.time,
        duration:60,
        color:p.color,
        teacher:p.teacher,
        phone:"010-1234-5678",
        address:"행복아파트 상가 3층",
        fee:p.fee,
        payDay:5,
        baseSupplies:p.baseSupplies,
        baseHomeworks:p.baseHomeworks,
        shuttleInfo:p.shuttleInfo,
        memo:p.memo,
      },
    ]
  };
  // 오늘 날짜에 숙제·미션 (직접 눌러서 XP·코인 체험)
  const dailyData = {
    [`${cid}-${acSample}-${TODAY}`]: {
      homeworks:p.homeworks.map((t,i)=>({ id:Date.now()+i, text:t, done:false, point:10 })),
      todos:p.todos.map((t,i)=>({ id:Date.now()+100+i, text:t, done:false, point:10 })),
      supplies:p.supplies
    },
  };
  return { children, academies, dailyData };
};

const SAMPLE_TMPL = [
  { id:1, title:"결석 안내", body:"안녕하세요. {아이이름} 학부모입니다.\n{날짜} {학원명} 수업을 결석하게 되었습니다.\n양해 부탁드립니다." },
  { id:2, title:"조기 하원 요청", body:"안녕하세요. {아이이름} 학부모입니다.\n오늘 {학원명} 수업을 일찍 마치고 하원해야 할 것 같습니다.\n{시간}에 데리러 가겠습니다. 감사합니다." },
  { id:3, title:"보충 수업 문의", body:"안녕하세요. {아이이름} 학부모입니다.\n{날짜} 결석 건으로 보충 수업 일정을 문의드립니다.\n편하신 날짜를 알려주시면 감사하겠습니다." },
  { id:4, title:"준비물 확인", body:"안녕하세요. {아이이름} 학부모입니다.\n{학원명} 준비물 관련하여 확인 부탁드립니다. 감사합니다." },
];

const EMPTY_AC = {
  name:"", days:[], time:"15:00", duration:60,
  useCustomSchedule:false, schedules:[],
  shuttleInfo:"", useCustomShuttle:false, shuttleSchedules:[],
  fee:0, payDay:1, color:"#FF6B6B",
  baseSupplies:[], baseHomeworks:[], phone:"", teacher:"", address:"", memo:""
};
const EMPTY_ABS = { academyId:"", date:TODAY, reason:"", makeupDate:"", makeupDone:false };

// ── 요일별 스케줄 유틸 (하이브리드: 기본 공통시간 + 예외 요일별 시간) ──
const hasClassOnDay = (academy, day) => {
  if (academy.useCustomSchedule) return (academy.schedules||[]).some(s=>s.day===day);
  return (academy.days||[]).includes(day);
};
const getScheduleForDay = (academy, day) => {
  if (academy.useCustomSchedule) return (academy.schedules||[]).find(s=>s.day===day);
  if ((academy.days||[]).includes(day)) return {day, time:academy.time||"", duration:academy.duration||60};
  return null;
};
const getClassTime = (academy, day) => getScheduleForDay(academy, day)?.time || "";
const getClassDuration = (academy, day) => getScheduleForDay(academy, day)?.duration || 0;
const getSchedules = (academy) => {
  if (academy.useCustomSchedule && (academy.schedules||[]).length>0) return academy.schedules;
  return (academy.days||[]).map(day=>({day, time:academy.time||"", duration:academy.duration||60}));
};

// ── 셔틀 헬퍼 ──────────────────────────────
const getShuttleText = (academy, day) => {
  if (!academy) return "";
  if (academy.useCustomShuttle) {
    const s=(academy.shuttleSchedules||[]).find(x=>x.day===day);
    const customText=[s?.time,s?.place,s?.memo].filter(Boolean).join(" ");
    return customText||academy.shuttleInfo||"";
  }
  return academy.shuttleInfo||"";
};

// ── 공통 UI 컴포넌트 ────────────────────────────
function CharacterSectionHeader({icon,title,subtitle,open,onToggle,dark=false}){
  const tx = dark ? "#FFFFFF" : C.text;
  const sub = dark ? "rgba(255,255,255,0.66)" : C.sub;
  return (
    <div onClick={onToggle} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
      <div>
        <p style={{margin:0,fontSize:18,fontWeight:900,color:tx}}>{icon} {title}</p>
        {subtitle&&<p style={{margin:"4px 0 0",fontSize:12,color:sub,fontWeight:700,whiteSpace:"pre-line",lineHeight:1.5}}>{subtitle}</p>}
      </div>
      <div style={{fontSize:12,fontWeight:900,color:dark?"#fff":C.purple,background:dark?"rgba(255,255,255,0.12)":C.purpleL,border:`1px solid ${dark?"rgba(255,255,255,0.2)":C.purple+"22"}`,padding:"6px 10px",borderRadius:999,whiteSpace:"nowrap",flexShrink:0}}>
        {open?UI_TEXT.button.close:UI_TEXT.button.open}
      </div>
    </div>
  );
}

function GameModalHeader({emoji,title,color,cute=false}){
  return (
    <div style={{padding:"26px 20px",textAlign:"center",color:cute?"#6B4A5C":"#fff",background:color,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg, transparent, rgba(255,255,255,${cute?0.4:0.55}), transparent)`,animation:"shineMove 1.6s ease-in-out infinite"}}/>
      <p style={{fontSize:56,margin:"0 0 10px",position:"relative"}}>{emoji}</p>
      <p style={{margin:0,fontSize:cute?22:24,fontWeight:900,letterSpacing:cute?0:undefined,position:"relative"}}>{title}</p>
    </div>
  );
}

function GameModalButton({onClick,grad,label="확인",cute=false}){
  return (
    <button onClick={onClick}
      style={{width:"100%",border:"none",borderRadius:cute?16:14,padding:"14px",background:grad,color:"#fff",fontWeight:900,fontSize:16,cursor:"pointer",boxShadow:cute?"0 6px 18px rgba(0,0,0,.12)":"none"}}>
      {label}
    </button>
  );
}

function KidCoachmark({ th, onFinish, skin="dungeon" }){
  const TH=th||{ main:"#3B7ECD", grad:"linear-gradient(135deg,#3B7ECD,#80A9DA)" };
  const cute=skin==="cute";
  const cards = cute
    ? [
        { emoji:"📝", title:"오늘의 미션을 체크해요", desc:"오늘 할 일 탭에서 미션과 숙제를\n동그라미를 눌러 완료해요!" },
        { emoji:"🍪", title:"쿠키와 경험치가 쌓여요", desc:"미션을 해내면 쿠키와 경험치(⭐)를 받아요.\n모은 쿠키로 멋진 보상을 받을 수 있어요!" },
        { emoji:"🧑‍🍳🦄", title:"파티시에와 펫이 자라요", desc:"내 캐릭터 탭에서 레벨이 오르고\n펫도 점점 자라나는 걸 볼 수 있어요!" },
      ]
    : [
        { emoji:"📝", title:"오늘의 미션을 체크해요", desc:"미션 탭에서 오늘 할 일과 숙제를\n동그라미를 눌러 완료해요!" },
        { emoji:"💎", title:"코인과 XP가 쌓여요", desc:"미션을 해내면 코인과 XP(별)을 받아요.\n모은 코인으로 멋진 보상을 받을 수 있어요!" },
        { emoji:"🧙‍♀️🐲", title:"캐릭터와 펫이 자라요", desc:"내 캐릭터 탭에서 레벨이 오르고\n펫도 점점 자라나는 걸 볼 수 있어요!" },
      ];
  const [i,setI]=useState(0);
  const last=i===cards.length-1;
  const c=cards[i];
  return (
    <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(15,16,30,0.8)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"28px"}}>
      <div style={{background:"#fff",borderRadius:26,padding:"32px 24px 24px",width:"100%",maxWidth:340,minHeight:380,boxSizing:"border-box",textAlign:"center",boxShadow:"0 24px 70px rgba(0,0,0,0.32)",display:"flex",flexDirection:"column"}}>
        <div style={{height:74,display:"flex",alignItems:"center",justifyContent:"center",fontSize:c.emoji.length>3?46:64,letterSpacing:4,marginBottom:14}}>{c.emoji}</div>
        <div style={{height:34,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <p style={{fontSize:21,fontWeight:900,color:"#1A1A35",margin:0,lineHeight:1.3}}>{c.title}</p>
        </div>
        <div style={{height:60,display:"flex",alignItems:"center",justifyContent:"center",margin:"10px 0 0"}}>
          <p style={{fontSize:15,fontWeight:600,color:"#5A6072",lineHeight:1.7,margin:0,whiteSpace:"pre-line"}}>{c.desc}</p>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"center",margin:"auto 0 20px"}}>
          {cards.map((_,idx)=>(<span key={idx} style={{width:idx===i?22:8,height:8,borderRadius:99,background:idx===i?TH.main:"#D9DEE8",transition:"all .25s"}}/>))}
        </div>
        <button onClick={()=>last?onFinish():setI(i+1)} style={{width:"100%",padding:16,borderRadius:15,border:"none",background:TH.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",boxShadow:`0 6px 18px ${TH.main}45`}}>
          {last?"시작하기 🎉":"다음"}
        </button>
      </div>
    </div>
  );
}

// ── 아이모드 모드(스킨) 선택 화면 ──────────────────────────
// 코치마크 직후 1회, 또는 설정에서 호출. onPick(skinId) 으로 선택 전달.
function ModeSelect({ onPick }){
  const dgSel=SKINS.dungeon, ckSel=SKINS.cute;
  const wrap={position:"fixed",inset:0,zIndex:9998,background:"linear-gradient(160deg,#F3EEF7,#FBF1F3)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px"};
  const panel={width:"100%",maxWidth:360,background:"linear-gradient(170deg,#FBF8FC,#F7EFF4)",borderRadius:30,padding:"30px 18px 30px",boxSizing:"border-box",boxShadow:"0 18px 50px rgba(60,52,90,0.2)"};
  const pill={fontSize:13,fontWeight:800,color:"#9A8FA8",background:"#fff",padding:"6px 16px",borderRadius:999,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"};
  const card=(bg,shadow)=>({flex:1,minWidth:0,borderRadius:24,padding:"20px 14px 18px",cursor:"pointer",background:bg,boxShadow:shadow,display:"flex",flexDirection:"column",border:"3px solid transparent"});
  const chip=(bg,col)=>({fontSize:11,fontWeight:700,padding:"5px 10px",borderRadius:999,textAlign:"center",background:bg,color:col});
  return (
    <div style={wrap}>
      <div style={panel}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:22}}><span style={pill}>🎒 아이용 · 처음 왔어요!</span></div>
        <div style={{textAlign:"center",marginBottom:24,paddingTop:8}}>
          <p style={{fontSize:23,fontWeight:900,color:"#2D2536",margin:0,letterSpacing:"-0.5px"}}>어떤 게임이 좋아요?</p>
          <p style={{fontSize:13.5,fontWeight:600,color:"#9A8FA8",margin:"8px 0 0",lineHeight:1.55}}>마음에 드는 세계를 골라주세요.<br/>한 번 고르면 바꿀 수 없으니 신중하게!</p>
        </div>
        <div style={{display:"flex",gap:13}}>
          {/* 던전 게임 */}
          <div style={card("linear-gradient(155deg,#3A3470,#2E2F5C)","0 10px 24px rgba(58,52,112,0.32)")} onClick={()=>onPick("dungeon")}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:1,color:"#FFD166",marginBottom:6}}>1번</div>
            <div style={{fontSize:40,lineHeight:1,marginBottom:8}}>⚔️</div>
            <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>던전 게임</div>
            <div style={{fontSize:12.5,fontWeight:600,color:"#C5C8E8",marginTop:9,lineHeight:1.5,flex:1}}>용사가 되어 던전을 클리어해요!</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:14}}>
              <span style={chip("rgba(255,209,102,0.18)","#FFD166")}>⚔️ 미션</span>
              <span style={chip("rgba(255,209,102,0.18)","#FFD166")}>🏰 던전 클리어</span>
            </div>
          </div>
          {/* 베이커리 게임 */}
          <div style={card("linear-gradient(155deg,#E85A77,#D6455A)","0 10px 24px rgba(214,69,90,0.32)")} onClick={()=>onPick("cute")}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:1,color:"#FFE3EC",marginBottom:6}}>2번</div>
            <div style={{fontSize:40,lineHeight:1,marginBottom:8}}>🧁</div>
            <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>베이커리 게임</div>
            <div style={{fontSize:12.5,fontWeight:600,color:"#FFE3EC",marginTop:9,lineHeight:1.5,flex:1}}>달콤한 가게에서<br/>도장을 모아요!</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:14}}>
              <span style={chip("rgba(255,255,255,0.22)","#FFFFFF")}>🎀 오늘 할 일</span>
              <span style={chip("rgba(255,255,255,0.22)","#FFFFFF")}>⭐ 도장 꾹</span>
            </div>
          </div>
        </div>
        <div style={{textAlign:"center",fontSize:12,color:"#A0A6C0",marginTop:22,fontWeight:600}}>탭하면 그 모드로 시작해요</div>
      </div>
    </div>
  );
}

function CoachmarkOverlay({ th, onFinish }){
  const TH=th||{ main:"#3B7ECD", grad:"linear-gradient(135deg,#3B7ECD,#80A9DA)" };
  const items=[
    { icon:"🏠", name:"홈", desc:"등록한 학원과 오늘의 미션을 한눈에 봐요. 학원·미션을 추가하는 곳이에요." },
    { icon:"🎁", name:"보상", desc:"미션을 관리하고 아이가 모은 코인으로 받을 보상을 설정해요." },
    { icon:"🗓", name:"달력", desc:"날짜별 학원 일정과 미션을 달력으로 확인해요." },
    { icon:"💰", name:"학원비", desc:"학원별 수강료와 납부 현황을 관리해요." },
    { icon:"🏥", name:"결석", desc:"결석을 기록하고 보충 일정을 챙겨요." },
    { icon:"⚙️", name:"기타", desc:"데이터 백업·복원, 비밀번호, 사용 가이드를 볼 수 있어요." },
    { icon:"🎒", name:"아이용", desc:"오른쪽 위 '🎒 아이용' 버튼을 누르면\n아이 화면으로 바뀌어요." },
  ];
  const [i,setI]=useState(0);
  const last=i===items.length-1;
  const it=items[i];
  return (
    <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(15,16,30,0.78)",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"24px"}}>
      <div style={{textAlign:"center",marginBottom:"auto",marginTop:"22vh"}}>
        <p style={{color:"rgba(255,255,255,0.85)",fontSize:14,fontWeight:700,margin:0}}>화면 아래 탭을 눌러 이동해요</p>
        <p style={{color:"#fff",fontSize:22,fontWeight:900,margin:"8px 0 0"}}>{i+1} / {items.length}</p>
      </div>
      <div style={{background:"#fff",borderRadius:22,padding:"24px 22px",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{width:48,height:48,borderRadius:14,background:`${TH.main}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{it.icon}</div>
          <p style={{fontSize:20,fontWeight:900,color:"#1A1A35",margin:0}}>{it.name}</p>
        </div>
        <div style={{minHeight:54,marginBottom:20}}>
          <p style={{fontSize:15,fontWeight:600,color:"#5A6072",lineHeight:1.7,margin:0,whiteSpace:"pre-line"}}>{it.desc}</p>
        </div>
        <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:18}}>
          {items.map((_,idx)=>(<span key={idx} style={{width:idx===i?20:7,height:7,borderRadius:99,background:idx===i?TH.main:"#D9DEE8",transition:"all .25s"}}/>))}
        </div>
        <div style={{display:"flex",gap:10}}>
          {!last&&<button onClick={onFinish} style={{flex:1,padding:15,borderRadius:14,border:"1.5px solid #E3E8F0",background:"#fff",color:"#8890B0",fontSize:15,fontWeight:800,cursor:"pointer"}}>건너뛰기</button>}
          <button onClick={()=>last?onFinish():setI(i+1)} style={{flex:2,padding:15,borderRadius:14,border:"none",background:TH.grad,color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer",boxShadow:`0 6px 18px ${TH.main}40`}}>
            {last?"시작하기 🎉":"다음"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OnboardingFlow({ onFinish }){
  const TH={ main:"#3B7ECD", grad:"linear-gradient(135deg,#3B7ECD,#80A9DA)", faint:"#EEF4FB" };
  const DAYS=["월","화","수","목","금","토","일"];
  const [step,setStep]=useState(0);
  const [childName,setChildName]=useState("");
  const [gender,setGender]=useState("boy");
  const [acName,setAcName]=useState("");
  const [acDays,setAcDays]=useState([]);
  const [acTime,setAcTime]=useState("16:00");
  const [homework,setHomework]=useState("");
  const [todo,setTodo]=useState("");

  const inp={width:"100%",padding:"15px 16px",borderRadius:14,border:"1.5px solid #E3E8F0",fontSize:17,boxSizing:"border-box",outline:"none",fontWeight:600};
  const lbl={fontSize:22,fontWeight:900,color:"#1A1A35",margin:"0 0 6px",lineHeight:1.3};
  const sub={fontSize:14,color:"#8890B0",margin:"0 0 24px",fontWeight:600,lineHeight:1.5};

  const toggleDay=(d)=>setAcDays(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d]);

  const steps=[
    { kind:"welcome" },
    { kind:"input", title:"아이의 이름이 무엇인가요?", sub:"아이 화면과 미션에 표시돼요.", canNext:()=>childName.trim().length>0 },
    { kind:"academy", title:"어떤 학원에 다니나요?", sub:"우선 하나만 등록해요. 나중에 더 추가할 수 있어요.", canNext:()=>acName.trim().length>0 },
    { kind:"homework", title:"오늘의 숙제가 있나요?", sub:"없으면 건너뛰어도 돼요.", canNext:()=>true },
    { kind:"todo", title:"오늘의 미션(할 일)이 있나요?", sub:"숙제 외에 스스로 할 일이 있다면 적어주세요.", canNext:()=>true },
  ];
  const cur=steps[step];
  const isLast=step===steps.length-1;

  const next=()=>{ if(isLast){ finish(); } else setStep(s=>s+1); };
  const finish=()=>onFinish({ childName, gender, acName, acDays, acTime, homework, todo });

  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"#fff",display:"flex",flexDirection:"column"}}>
      {cur.kind!=="welcome"&&(
        <div style={{padding:"16px 22px 0"}}>
          <div style={{height:5,borderRadius:99,background:"#EEF1F6",overflow:"hidden"}}>
            <div style={{width:`${(step/(steps.length-1))*100}%`,height:"100%",background:TH.grad,borderRadius:99,transition:"width .3s"}}/>
          </div>
        </div>
      )}

      <div style={{flex:1,overflowY:"auto",padding:"32px 24px",display:"flex",flexDirection:"column"}}>
        {cur.kind==="welcome"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
            <div style={{fontSize:64,marginBottom:18}}>🌱</div>
            <p style={{fontSize:12,fontWeight:800,letterSpacing:3,color:TH.main,margin:"0 0 8px"}}>HARANG</p>
            <h2 style={{fontSize:25,fontWeight:900,color:"#1A1A35",margin:"0 0 32px",lineHeight:1.3}}>아이 성장 미션에<br/>오신 걸 환영해요</h2>
            <p style={{fontSize:15,fontWeight:600,color:"#8890B0",lineHeight:1.8,margin:0}}>
              동기부여가 고민이었던 엄마도,<br/>
              숙제가 재미없던 아이도,<br/>
              아이 성장 미션과 함께해요.<br/><br/>
              미션(숙제)을 완료하면 코인을 얻고,<br/>
              원하는 보상으로 바꾸며 즐겁게 성장해봐요.<br/><br/>
              작은 미션이 쌓여 아이의 큰 성장을 만들어요.
            </p>
          </div>
        )}

        {cur.kind==="input"&&(
          <div>
            <p style={lbl}>{cur.title}</p>
            <p style={sub}>{cur.sub}</p>
            <input autoFocus value={childName} onChange={e=>setChildName(e.target.value)} placeholder="예: 하랑" style={inp}
              onKeyDown={e=>e.key==="Enter"&&cur.canNext()&&next()}/>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              {[{k:"boy",t:"👦 남자아이"},{k:"girl",t:"👧 여자아이"}].map(g=>(
                <button key={g.k} onClick={()=>setGender(g.k)} style={{flex:1,padding:14,borderRadius:14,border:`2px solid ${gender===g.k?TH.main:"#E3E8F0"}`,background:gender===g.k?`${TH.main}12`:"#fff",color:gender===g.k?TH.main:"#8890B0",fontSize:15,fontWeight:800,cursor:"pointer"}}>{g.t}</button>
              ))}
            </div>
          </div>
        )}

        {cur.kind==="academy"&&(
          <div>
            <p style={lbl}>{cur.title}</p>
            <p style={sub}>{cur.sub}</p>
            <input autoFocus value={acName} onChange={e=>setAcName(e.target.value)} placeholder="예: 피아노 학원" style={inp}/>
            <p style={{fontSize:14,fontWeight:800,color:"#1A1A35",margin:"22px 0 10px"}}>수업 요일</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {DAYS.map(d=>(
                <button key={d} onClick={()=>toggleDay(d)} style={{width:42,height:42,borderRadius:12,border:`2px solid ${acDays.includes(d)?TH.main:"#E3E8F0"}`,background:acDays.includes(d)?TH.main:"#fff",color:acDays.includes(d)?"#fff":"#8890B0",fontSize:15,fontWeight:800,cursor:"pointer"}}>{d}</button>
              ))}
            </div>
            <p style={{fontSize:14,fontWeight:800,color:"#1A1A35",margin:"22px 0 10px"}}>수업 시간</p>
            <input type="time" value={acTime} onChange={e=>setAcTime(e.target.value)} style={inp}/>
          </div>
        )}

        {cur.kind==="homework"&&(
          <div>
            <p style={lbl}>{cur.title}</p>
            <p style={sub}>{cur.sub}</p>
            <input autoFocus value={homework} onChange={e=>setHomework(e.target.value)} placeholder="예: 문제집 5쪽" style={inp}
              onKeyDown={e=>e.key==="Enter"&&next()}/>
          </div>
        )}

        {cur.kind==="todo"&&(
          <div>
            <p style={lbl}>{cur.title}</p>
            <p style={sub}>{cur.sub}</p>
            <input autoFocus value={todo} onChange={e=>setTodo(e.target.value)} placeholder="예: 책가방 스스로 챙기기" style={inp}
              onKeyDown={e=>e.key==="Enter"&&next()}/>
          </div>
        )}
      </div>

      <div style={{padding:"16px 24px 28px",display:"flex",gap:10}}>
        {(cur.kind==="homework"||cur.kind==="todo")&&(
          <button onClick={next} style={{flex:1,padding:16,borderRadius:14,border:"1.5px solid #E3E8F0",background:"#fff",color:"#8890B0",fontSize:16,fontWeight:800,cursor:"pointer"}}>없음</button>
        )}
        <button onClick={next} disabled={cur.canNext&&!cur.canNext()}
          style={{flex:2,padding:16,borderRadius:14,border:"none",background:(cur.canNext&&!cur.canNext())?"#C8D0DE":TH.grad,color:"#fff",fontSize:16,fontWeight:900,cursor:(cur.canNext&&!cur.canNext())?"default":"pointer",boxShadow:(cur.canNext&&!cur.canNext())?"none":`0 6px 18px ${TH.main}40`}}>
          {cur.kind==="welcome"?"시작하기":isLast?"완료하고 시작하기 🎉":"다음"}
        </button>
      </div>
    </div>
  );
}

function GuideModal({type="guide",th,onClose,skin="dungeon"}){
  const isReward=type==="reward";
  const isCute=skin==="cute";
  const xpW=isCute?"경험치":"XP";
  const coinW=isCute?"쿠키":"코인";

  const steps=isReward
    ? [
        { ic:"🎁", t:"보상 탭 열기", d:"'확인 필요한 구매 요청'이 보여요" },
        { ic:"✅", t:"구매 승인", d:`승인하면 ${coinW}이 차감돼요` },
        { ic:"🥰", t:"보상 전해주기", d:"아이에게 직접 보상을 주세요!" },
      ]
    : [
        { ic:"🧒", t:"아이 등록", d:"" },
        { ic:"🏫", t:"학원 등록", d:"" },
        { ic:"📝", t:"미션 추가", d:"숙제·할 일을 미션으로" },
        { ic:"✅", t:"아이가 직접 체크", d:"완수하면 스스로 체크!" },
        { ic:"⭐", t:`${xpW}·${coinW} 획득`, d:"" },
        { ic:"🎁", t:"보상 받기", d:`${coinW}으로 원하는 보상을` },
      ];

  return (
    <div style={{
      position:"fixed",
      inset:0,
      background:"rgba(20,20,40,0.55)",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      zIndex:5000,
      padding:20
    }} onClick={onClose}>
      <div
        onClick={e=>e.stopPropagation()}
        style={{
          background:"#fff",
          borderRadius:24,
          padding:0,
          width:"100%",
          maxWidth:370,
          boxSizing:"border-box",
          overflow:"hidden",
          boxShadow:"0 20px 60px rgba(0,0,0,0.22)"
        }}
      >
        {/* 소개 헤더 (맨 위, 테마 그라데이션) */}
        <div style={{
          background:th.grad,
          padding:"26px 24px 22px",
          color:"#fff",
          textAlign:"center"
        }}>
          <p style={{fontSize:11,fontWeight:800,letterSpacing:3,margin:"0 0 6px",opacity:0.85}}>{isReward?"REWARD":"HARANG"}</p>
          <h2 style={{fontSize:isReward?23:27,fontWeight:900,margin:0,letterSpacing:-0.5,textShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>{isReward?"구매 요청이 왔어요! 🛒":"아이 성장 미션"}</h2>
          <div style={{width:38,height:3,borderRadius:99,background:"rgba(255,255,255,0.6)",margin:"12px auto 14px"}}/>
          <p style={{fontSize:14.5,fontWeight:800,lineHeight:1.6,margin:0}}>
            {isReward?<>아이가 모은 {coinW}으로<br/>첫 보상을 신청했어요 🎉</>:<>매일의 작은 미션이 쌓여<br/>아이의 큰 성장을 만들어요 ✨</>}
          </p>
        </div>

        {/* 사용 방법 */}
        <div style={{padding:"22px 24px 24px"}}>
          <p style={{fontSize:13,fontWeight:900,letterSpacing:0.5,color:th.main,margin:"0 0 14px"}}>
            {isReward?"🎁 이렇게 보상을 전해주세요":"🚀 이렇게 시작해요"}
          </p>

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {steps.map((s,i)=>(
              <div key={s.t} style={{display:"flex",alignItems:"center",gap:12,background:`${th.main}0E`,borderRadius:13,padding:"11px 13px"}}>
                <span style={{
                  flexShrink:0,
                  width:34,height:34,
                  borderRadius:10,
                  background:`${th.main}18`,
                  fontSize:18,
                  display:"flex",alignItems:"center",justifyContent:"center"
                }}>{s.ic}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:14.5,fontWeight:900,color:C.text,margin:0,lineHeight:1.2}}>
                    <span style={{color:th.main,marginRight:5}}>{i+1}</span>{s.t}
                  </p>
                  {s.d&&<p style={{fontSize:12,fontWeight:600,color:C.sub,margin:"2px 0 0"}}>{s.d}</p>}
                </div>
              </div>
            ))}
          </div>

          {!isReward&&(
          <div style={{
            background:`${th.main}0E`,
            borderRadius:12,
            padding:"11px 13px",
            margin:"16px 0 0",
            fontSize:12,fontWeight:700,color:C.sub,lineHeight:1.55
          }}>
            {isCute?"🍪":"💎"} 미션을 완료하면 {xpW}와 {coinW}을 받고, {coinW}으로 원하는 보상을 받을 수 있어요!
          </div>
          )}

          <button
            onClick={onClose}
            style={{
              width:"100%",
              padding:15,
              borderRadius:14,
              border:"none",
              background:th.grad,
              color:"#fff",
              fontSize:16,
              fontWeight:900,
              cursor:"pointer",
              marginTop:18,
              boxShadow:`0 6px 18px ${th.main}40`
            }}
          >
            {isReward?"보상 탭으로 가기 🎁":"닫기"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [loaded,setLoaded] = useState(false);
  const [appMode,setAppMode] = useState("child");
  const [showParentPin,setShowParentPin] = useState(false);
  const [parentPin,setParentPin] = useState("1234");
  const [pinInput,setPinInput] = useState("");
  const [showPinChangeModal,setShowPinChangeModal] = useState(false);
  const [oldPinInput,setOldPinInput] = useState("");
  const [newPinInput,setNewPinInput] = useState("");
  const [newPinConfirm,setNewPinConfirm] = useState("");
  const [childTab,setChildTab] = useState("today");
  const [showChildRewards,setShowChildRewards] = useState(false);
  const [showChildXP,setShowChildXP] = useState(false);
  const [showParentXP,setShowParentXP] = useState(false);
  const [openRewardId,setOpenRewardId] = useState(null);
  const [showParentTodayQuest,setShowParentTodayQuest] = useState(true);
  const [showParentRewardManage,setShowParentRewardManage] = useState(false);
  const [showParentXpAdjust,setShowParentXpAdjust] = useState(false);
  const [showParentGrowthManage,setShowParentGrowthManage] = useState(false);
  const [showParentRecordManage,setShowParentRecordManage] = useState(false);
  // 내 캐릭터 탭 섹션 열림/닫힘
  const [openTitle,setOpenTitle] = useState(false);
  const [openTreasure,setOpenTreasure] = useState(false);
  const [showOnboarding,setShowOnboarding] = useState(false); // 첫 진입 온보딩
  const [showCoachmark,setShowCoachmark] = useState(false);   // 온보딩 후 탭 설명 코치마크
  const [showKidCoachmark,setShowKidCoachmark] = useState(false); // 아이모드 첫 진입 설명
  const [skinByChild,setSkinByChild] = useState({});             // 아이별 디자인 스킨 {cid: "dungeon"|"cute"}
  const [showModeSelect,setShowModeSelect] = useState(false);     // 모드 선택 화면 표시
  const [openPet,setOpenPet] = useState(false);
  const [openHistory,setOpenHistory] = useState(false);
  const [openStreak,setOpenStreak] = useState(false);
  const [openRewardShop,setOpenRewardShop] = useState(false);
  const [lastLevelByChild,setLastLevelByChild] = useState({});
  const [levelUpModal,setLevelUpModal] = useState(null);
  const [questResultModal,setQuestResultModal] = useState(null);
  const [charCheer,setCharCheer] = useState(null); // 완료 시 캐릭터 점프+말풍선 {msg, key}
  const [selectedTitles,setSelectedTitles] = useState({});
  const [treasureData,setTreasureData] = useState({});
  const [treasureModal,setTreasureModal] = useState(null);
  const [openingTreasure,setOpeningTreasure] = useState(false);
  const [showSettingsModal,setShowSettingsModal] = useState(false);
  const [showDevTools,setShowDevTools] = useState(false);
  const [showAcademyCopyModal,setShowAcademyCopyModal] = useState(false);
  const [copySourceChildId,setCopySourceChildId] = useState("");
  const [copySelectedAcademyIds,setCopySelectedAcademyIds] = useState([]);
  const [eventModal,setEventModal] = useState(null);
  const [eventQueue,setEventQueue] = useState([]);
  const [firstTipPending,setFirstTipPending] = useState(false); // 첫 미션 안내창 대기
  const [showFirstMissionTip,setShowFirstMissionTip] = useState(false);
  const [firstTipSeen,setFirstTipSeen] = useState(false); // 안내창 1회만
  const [pinHintSeen,setPinHintSeen] = useState(false); // 엄마모드 비번 안내 1회만
  const [showParentRewardGuide,setShowParentRewardGuide] = useState(false); // 첫 구매요청 후 엄마모드 안내
  const [parentRewardGuideSeen,setParentRewardGuideSeen] = useState(false);
  const [seenTitles,setSeenTitles] = useState({});
  const [earnedTitleIds,setEarnedTitleIds] = useState({}); // 한 번 획득한 상장 영구 보존 {cid:[titleId]}
  const [specialTitles,setSpecialTitles] = useState({});
  const [childDate,setChildDate] = useState(TODAY);
  const [bestStreakData,setBestStreakData] = useState({});
  // ── 꾸미기(데코) 시스템 ──
  const [ownedDecor,setOwnedDecor] = useState({});      // 아이별 보유 {cid:[decorId,...]}
  const [equippedDecor,setEquippedDecor] = useState({}); // 아이별 장착 {cid:{hat,border,bg}}
  const [decorPrices,setDecorPrices] = useState({});     // 전역 가격 오버라이드 {decorId:price} (부모가 수정)
  const [showDecorShop,setShowDecorShop] = useState(false);     // 아이용 꾸미기 상점 모달
  // (꾸미기 가격관리 섹션 제거됨 — 카탈로그 기본가로 자동 운영)

  // 아이 목록 상태
  const [children,setChildren] = useState(DEFAULT_CHILDREN);
  const [childId,setChildId] = useState("child_1");
  // 현재 선택된 아이의 스킨 (아이별로 다름). 미설정이면 기본 스킨.
  const kidSkin = (skinByChild[childId] && SKINS[skinByChild[childId]]) ? skinByChild[childId] : DEFAULT_SKIN;
  // 현재 아이의 스킨을 바꾸는 헬퍼 (모드 선택 시 사용)
  const setKidSkin = (skin)=> setSkinByChild(prev=>({...prev,[childId]:skin}));

  const [tab,setTab] = useState("home");
  const [academies,setAcademies] = useState({});
  const [absences,setAbsences] = useState({});
  const [paidStatus,setPaidStatus] = useState({});
  const [dayMemos,setDayMemos] = useState({});
  const [dailyData,setDailyData] = useState({});
  const [baseSeededKeys,setBaseSeededKeys] = useState({}); // 기본숙제 자동추가 완료한 학원-날짜 기록 {key:true}
  const [petData,setPetData] = useState({}); // 아이별 펫 진화 단계 {cid: stage(0~4)}
  // 설치 정보: 첫 실행 시점·창립 사용자 여부 (향후 유료 전환 시 "이 날짜 이전 = 평생 무료" 분기용)
  const [installInfo,setInstallInfo] = useState(null); // {installDate, isFoundingUser}
  // 결제(프리미엄) 상태: 인앱결제 성공 시 true 로 저장. 결제 연동 전까지는 항상 false.
  const [isPaidPremium,setIsPaidPremium] = useState(false);
  const [scoreData,setScoreData] = useState({});
  const [rewardData,setRewardData] = useState({});
  const [rewardRequests,setRewardRequests] = useState({});
  const [showRewardModal,setShowRewardModal] = useState(false);
  const [rewardForm,setRewardForm] = useState({title:"",point:300,emoji:"🎁",grade:"common"});
  const [editingRewardId,setEditingRewardId] = useState(null);
  const [unlockedBadgeIds,setUnlockedBadgeIds] = useState([]);
  const [showTodoPickerModal,setShowTodoPickerModal] = useState(null);
  const [xpAdjustInput,setXpAdjustInput] = useState("");
  const [xpAdjustLabel,setXpAdjustLabel] = useState("");
  const [xpAdjustSign,setXpAdjustSign] = useState("+"); // "+" or "-" // null or date string
  const [templates,setTemplates] = useState(SAMPLE_TMPL);
  const [feeMonth,setFeeMonth] = useState(new Date().getMonth()+1);
  const [calDate,setCalDate] = useState(new Date());
  const [calSelDate,setCalSelDate] = useState(null);
  const [homeDate,setHomeDate] = useState(TODAY);

  // 모달
  const [showAddAcModal,setShowAddAcModal] = useState(false);
  const [editTarget,setEditTarget] = useState(null);
  const [showDetailModal,setShowDetailModal] = useState(null);
  const [showAbsModal,setShowAbsModal] = useState(false);
  const [showDailyModal,setShowDailyModal] = useState(null);
  const [showSmsModal,setShowSmsModal] = useState(null);
  const [showTmplEdit,setShowTmplEdit] = useState(null);
  const [showGuideModal,setShowGuideModal] = useState(false);
  const [openSmsManage,setOpenSmsManage] = useState(false);
  const [smsDraft,setSmsDraft] = useState("");
  const [editTmpl,setEditTmpl] = useState({title:"",body:""});
  const [newAc,setNewAc] = useState(EMPTY_AC);
  const [newAbs,setNewAbs] = useState(EMPTY_ABS);
  const [supplyInput,setSupplyInput] = useState("");
  const [baseHwInput,setBaseHwInput] = useState("");
  const [showAcMore,setShowAcMore] = useState(false); // 학원폼 상세 정보 펼침
  const [dailyHwInput,setDailyHwInput] = useState("");
  const [dailySupInput,setDailySupInput] = useState("");
  const [dailyTodoInput,setDailyTodoInput] = useState("");
  const [dailyHwPoint,setDailyHwPoint] = useState(DEFAULT_HOMEWORK_SCORE);
  const [dailyTodoPoint,setDailyTodoPoint] = useState(DEFAULT_HOMEWORK_SCORE);
  const [toast,setToast] = useState("");

  // 아이 관리 모달
  const [showChildMgr,setShowChildMgr] = useState(false);
  const [editingChild,setEditingChild] = useState(null);
  const [childForm,setChildForm] = useState({name:"",gender:"boy",theme:CHILD_THEME_COLORS[0]});

  // 방학 데이터: { "childId-academyId": [{id, start, end}] }
  const [vacations,setVacations] = useState({});
  const [showVacModal,setShowVacModal] = useState(null); // {date, acList}
  const [vacForm,setVacForm] = useState({academyId:"", start:"", end:""});

  // 로드
  useEffect(()=>{
    (async()=>{
      const ch=await load("v6_children"), ac=await load("v6_ac"), ab=await load("v6_abs"),
            p=await load("v6_paid"), dm=await load("v6_dm"), dd=await load("v6_daily"),
            bsk=await load("v6_base_seeded"),
            petD=await load("v6_pet"),
            tmpl=await load("v6_tmpl"), cid=await load("v6_cid"), vac=await load("v6_vac"),
            pin=await load("v6_parent_pin"), score=await load("v6_score"),
            reward=await load("v6_reward"), rewardReq=await load("v6_reward_requests"),
            badges=await load("v6_unlocked_badges"),
            lastLv=await load("v6_last_level"), selectedTitle=await load("v6_selected_titles"),
            treasure=await load("v6_treasure"),
            seenTitlesData=await load("v6_seen_titles"),
            earnedTitlesData=await load("v6_earned_titles"),
            specialTitleData=await load("v6_special_titles"),
            bestStreak=await load("v6_best_streak");
      const ownedDec=await load("v6_owned_decor");
      const equipDec=await load("v6_equipped_decor");
      const decPrices=await load("v6_decor_prices");
      const savedSkinMap=await load("v6_kid_skin_map"); // 아이별 스킨 맵 (신규)
      const savedSkin=await load("v6_kid_skin");         // 단일 스킨 (구버전, 마이그레이션용)
      const sampleSeeded=await load("v6_sample_seeded");
      // ── 설치 정보 기록: 한 번도 기록된 적 없으면 최초 1회 저장 (향후 유료 전환 분기용) ──
      // installDate = 첫 실행일, isFoundingUser = 초기(무료 시작) 사용자 표식
      let inst=await load("v6_install_info");
      if(!inst || !inst.installDate){
        inst={ installDate:new Date().toISOString(), isFoundingUser:true };
        save("v6_install_info",inst); // 한 번 심으면 갱신·삭제 안 함
      }
      setInstallInfo(inst);
      // 결제(프리미엄) 상태 복원: 인앱결제 성공 시 저장된 값을 읽어온다.
      const paid=await load("v6_paid_premium");
      if(paid===true) setIsPaidPremium(true);
      // 완전 최초 실행(저장된 아이 데이터 없음)이면 온보딩 시작 (샘플 주입 안 함)
      if(!ch && !sampleSeeded){
        save("v6_sample_seeded","1");
        setLoaded(true);
        const onbDone=await load("v6_onboarding_done");
        if(!onbDone) setShowOnboarding(true);
        return;
      }
      if(ch) setChildren(ch);
      if(ac) setAcademies(ac); if(ab) setAbsences(ab);
      if(p) setPaidStatus(p); if(dm) setDayMemos(dm); if(dd) setDailyData(dd);
      if(bsk) setBaseSeededKeys(bsk);
      if(petD) setPetData(petD);
      if(savedSkinMap && typeof savedSkinMap==="object"){
        setSkinByChild(savedSkinMap);
      } else if(savedSkin && SKINS[savedSkin] && ch){
        // 구버전(단일 스킨) → 기존 모든 아이에 적용해 마이그레이션
        const migrated={}; ch.forEach(c=>{ migrated[c.id]=savedSkin; });
        setSkinByChild(migrated);
        save("v6_kid_skin_map",migrated);
      }
      if(tmpl) setTemplates(tmpl);
      if(cid) setChildId(cid);
      if(vac) setVacations(vac);
      if(pin) setParentPin(pin);
      if(score) setScoreData(score);
      if(reward) setRewardData(reward);
      if(rewardReq) setRewardRequests(rewardReq);
      if(badges) setUnlockedBadgeIds(badges);
      if(lastLv) setLastLevelByChild(lastLv);
      if(selectedTitle) setSelectedTitles(selectedTitle);
      if(treasure) setTreasureData(treasure);
      if(seenTitlesData) setSeenTitles(seenTitlesData);
      if(earnedTitlesData) setEarnedTitleIds(earnedTitlesData);
      if(specialTitleData) setSpecialTitles(specialTitleData);
      if(bestStreak) setBestStreakData(bestStreak);
      if(ownedDec) setOwnedDecor(ownedDec);
      if(equipDec) setEquippedDecor(equipDec);
      if(decPrices) setDecorPrices(decPrices);
      const tipSeen=await load("v6_first_mission_tip_seen");
      if(tipSeen) setFirstTipSeen(true);
      const pinHint=await load("v6_pin_hint_seen");
      if(pinHint) setPinHintSeen(true);
      const prGuideSeen=await load("v6_parent_reward_guide_seen");
      if(prGuideSeen) setParentRewardGuideSeen(true);
      setLoaded(true);
    })();
  },[]);

  useEffect(()=>{ if(loaded) save("v6_children",children); },[children,loaded]);
  useEffect(()=>{ if(loaded) save("v6_kid_skin_map",skinByChild); },[skinByChild,loaded]);
  useEffect(()=>{ if(loaded) save("v6_ac",academies); },[academies,loaded]);
  useEffect(()=>{ if(loaded) save("v6_abs",absences); },[absences,loaded]);
  useEffect(()=>{ if(loaded) save("v6_paid",paidStatus); },[paidStatus,loaded]);
  useEffect(()=>{ if(loaded) save("v6_dm",dayMemos); },[dayMemos,loaded]);
  useEffect(()=>{ if(loaded) save("v6_daily",dailyData); },[dailyData,loaded]);
  useEffect(()=>{ if(loaded) save("v6_base_seeded",baseSeededKeys); },[baseSeededKeys,loaded]);
  useEffect(()=>{ if(loaded) save("v6_pet",petData); },[petData,loaded]);
  useEffect(()=>{ if(loaded) save("v6_tmpl",templates); },[templates,loaded]);
  useEffect(()=>{ if(loaded) save("v6_cid",childId); },[childId,loaded]);
  useEffect(()=>{ if(loaded) save("v6_vac",vacations); },[vacations,loaded]);
  useEffect(()=>{ if(loaded) save("v6_parent_pin",parentPin); },[parentPin,loaded]);
  // 엄마모드 비번 안내를 본 것으로 기록 (다음부터 숨김)
  const markPinHintSeen=()=>{
    if(!pinHintSeen){ setPinHintSeen(true); save("v6_pin_hint_seen","1"); }
  };
  useEffect(()=>{ if(loaded) save("v6_score",scoreData); },[scoreData,loaded]);
  useEffect(()=>{ if(loaded) save("v6_reward",rewardData); },[rewardData,loaded]);
  useEffect(()=>{ if(loaded) save("v6_reward_requests",rewardRequests); },[rewardRequests,loaded]);
  useEffect(()=>{ if(loaded) save("v6_unlocked_badges",unlockedBadgeIds); },[unlockedBadgeIds,loaded]);
  useEffect(()=>{ if(loaded) save("v6_last_level",lastLevelByChild); },[lastLevelByChild,loaded]);
  useEffect(()=>{ if(loaded) save("v6_selected_titles",selectedTitles); },[selectedTitles,loaded]);
  useEffect(()=>{ if(loaded) save("v6_treasure",treasureData); },[treasureData,loaded]);
  useEffect(()=>{ if(loaded) save("v6_seen_titles",seenTitles); },[seenTitles,loaded]);
  useEffect(()=>{ if(loaded) save("v6_earned_titles",earnedTitleIds); },[earnedTitleIds,loaded]);
  useEffect(()=>{ if(loaded) save("v6_special_titles",specialTitles); },[specialTitles,loaded]);
  useEffect(()=>{ if(loaded) save("v6_best_streak",bestStreakData); },[bestStreakData,loaded]);
  useEffect(()=>{ if(loaded) save("v6_owned_decor",ownedDecor); },[ownedDecor,loaded]);
  useEffect(()=>{ if(loaded) save("v6_equipped_decor",equippedDecor); },[equippedDecor,loaded]);
  useEffect(()=>{ if(loaded) save("v6_decor_prices",decorPrices); },[decorPrices,loaded]);

  const showToast=(msg="저장됨 ✓")=>{ setToast(msg); setTimeout(()=>setToast(""),1600); };

  // 온보딩 완료: 입력값을 실제 데이터에 반영 → 홈 진입 → 코치마크
  const finishOnboarding=(data)=>{
    // data = { childName, gender, acName, acDays:[], acTime, homework, todo }
    const cid="child_1";
    setChildren([{ id:cid, name:(data.childName||"우리 아이").trim(), gender:data.gender||"boy" }]);
    setChildId(cid);

    let acId=null;
    if(data.acName && data.acName.trim()){
      acId="ac_"+Date.now();
      const newAcademy={ ...EMPTY_AC, id:acId, name:data.acName.trim(),
        days:(data.acDays&&data.acDays.length)?data.acDays:[], time:data.acTime||"16:00", duration:60,
        color:"#6C63FF" };
      setAcademies({ [cid]:[newAcademy] });

      // 첫 미션(오늘 날짜에 숙제/할일)
      const hw=[], todos=[];
      if(data.homework && data.homework.trim()) hw.push({id:Date.now()+1,text:data.homework.trim(),done:false,point:DEFAULT_HOMEWORK_SCORE});
      if(data.todo && data.todo.trim()) todos.push({id:Date.now()+2,text:data.todo.trim(),done:false,point:DEFAULT_HOMEWORK_SCORE});
      if(hw.length||todos.length){
        const key=`${cid}-${acId}-${TODAY}`;
        setDailyData({ [key]:{homeworks:hw,todos,supplies:[]} });
      }
    }

    save("v6_onboarding_done","1");
    setShowOnboarding(false);
    setAppMode("parent");      // 엄마모드 홈으로
    setTab("home");
    setShowCoachmark(true);    // 탭 설명 코치마크 시작
  };

  const showGameEvent=(event)=>{
    setEventQueue(prev=>[...prev,{
      id:Date.now()+Math.random(),
      type:"title",
      emoji:"🏆",
      title:"NEW EVENT",
      name:"",
      desc:"",
      reward:"",
      ...event
    }]);
  };

  const showQuestResult=({type="clear",xp=0,title=""})=>{
    // 미션 클리어는 화면을 가리는 팝업 대신 그 자리에서 이펙트로 피드백 (캐릭터 점프·코인 튀기·떠오르는 숫자)
    // 미션 실패만 명확한 인지를 위해 팝업으로 안내
    if(type==="clear") return;
    setQuestResultModal({type,xp,title});
    setTimeout(()=>setQuestResultModal(null),1300);
  };

  // 완료 순간 화면 중앙에 큰 보상 연출을 띄운다 (스크롤 위치와 무관하게 항상 보임, 아이 모드 전용)
  const CHEER_MSGS = ["대단해! 🎉","최고야! ⭐","멋지다! 💪","해냈어! 🔥","굿잡! 👍","완벽해! ✨","좋았어! 😆","척척박사! 🧠"];
  const cheerCharacter=(xp=DEFAULT_HOMEWORK_SCORE)=>{
    const msg=CHEER_MSGS[Math.floor(Math.random()*CHEER_MSGS.length)];
    setCharCheer({msg,xp,key:Date.now()});
    setTimeout(()=>setCharCheer(null),1300);
  };

  const enterParentMode=()=>{
    if(pinInput===DEV_PIN){
      setShowParentPin(false);
      setPinInput("");
      setShowDevTools(true);
      showToast("개발자 도구 열림 🧪");
      return;
    }
    if(pinInput===parentPin){
      setAppMode("parent"); setShowParentPin(false); setPinInput("");
      markPinHintSeen();
      showToast("엄마용으로 전환됨 🔓");
      // 첫 구매요청이 있는데 아직 안내 안 봤으면 1회 안내
      if(!parentRewardGuideSeen){
        const anyPending=Object.values(rewardRequests).some(list=>(list||[]).some(r=>r.status==="pending"));
        if(anyPending){
          setParentRewardGuideSeen(true);
          save("v6_parent_reward_guide_seen","1");
          setTimeout(()=>setShowParentRewardGuide(true),450);
        }
      }
    } else {
      showToast("비밀번호가 달라요");
    }
  };
  const addDevXP=(amount)=>{
    addChildScore(childId,amount,`개발자 도구 XP ${amount>=0?"+":""}${amount}`,"dev_xp");
    showToast(`⭐ XP ${amount>=0?"+":""}${amount}`);
  };

  const addDevCoin=(amount)=>{
    setScoreData(prev=>{
      const cur=prev[childId]||{xp:0,coin:0,history:[]};
      return {...prev,[childId]:{...cur,
        coin:Math.max(0,Number(cur.coin??cur.balance??cur.total??0)+amount),
        history:[...(cur.history||[]),{id:Date.now(),point:amount,xp:0,coin:amount,date:TODAY,type:"dev_coin",memo:`개발자 도구 코인 ${amount>=0?"+":""}${amount}`}]
      }};
    });
    showToast(`💎 코인 ${amount>=0?"+":""}${amount}`);
  };

  const giveDevBox=(boxType)=>{
    const cur=getChildTreasure(childId);
    const key=boxType==="legend"?"legendBox":boxType==="rare"?"rareBox":"normalBox";
    setTreasureData(prev=>({...prev,[childId]:{...cur,[key]:Number(cur[key]||0)+1}}));
    showToast(boxType==="legend"?"👑 전설상자 +1":boxType==="rare"?"🎁 희귀상자 +1":"📦 일반상자 +1");
  };

  const loadSampleData=()=>{
    const cid=childId;  // 현재 선택된 아이에 적용
    const existingAcs=academies[cid]||[];
    const seq=existingAcs.filter(a=>/\(예시\)$/.test(a.name)).length+1;
    const sample=buildSampleData(seq,cid);
    const newAc=sample.academies[cid][0];
    // 현재 아이가 children에 없을 때만 추가 (보통은 이미 존재)
    setChildren(prev=>prev.some(c=>c.id===cid)?prev:[...prev,...sample.children]);
    setAcademies(prev=>({...prev,[cid]:[...(prev[cid]||[]),newAc]}));
    setDailyData(prev=>({...prev,...sample.dailyData}));
    const curName=(children.find(c=>c.id===cid)||{}).name||"";
    showToast(`🌱 ${curName?curName+" — ":""}샘플 학원 추가! (${newAc.name})`);
  };

  const generateTestData=(cid)=>{
    setScoreData(prev=>({
      ...prev,
      [cid]:{
        xp:3000,
        coin:5000,
        history:[
          {
            id:Date.now(),
            point:3000,
            xp:3000,
            coin:5000,
            date:TODAY,
            type:"dev_test",
            memo:"테스트 데이터 생성"
          }
        ]
      }
    }));

    setTreasureData(prev=>({
      ...prev,
      [cid]:{
        completedQuestCount:150,
        normalBox:5,
        rareBox:3,
        legendBox:1
      }
    }));

    showToast("🧪 테스트 데이터 생성 완료!");
  };

  const generateLegendTestData=(cid)=>{
    setScoreData(prev=>({
      ...prev,
      [cid]:{
        xp:12000,
        coin:10000,
        history:[
          {
            id:Date.now(),
            point:12000,
            xp:12000,
            coin:10000,
            date:TODAY,
            type:"dev_legend",
            memo:"전설 테스트 모드"
          }
        ]
      }
    }));

    setTreasureData(prev=>({
      ...prev,
      [cid]:{
        completedQuestCount:999,
        normalBox:10,
        rareBox:10,
        legendBox:10
      }
    }));

    showToast("👑 전설 테스트 모드 활성화!");
  };

  const unlockAllTitlesForDev=(cid)=>{
    const allDefaultIds=DEFAULT_TITLES.map(t=>t.id);
    const allLegendaryIds=LEGENDARY_TITLES.map(t=>t.id);
    const allTitleIds=[...allDefaultIds,...allLegendaryIds];
    setSpecialTitles(prev=>({...prev,[cid]:allTitleIds}));
    setSeenTitles(prev=>({...prev,[cid]:allTitleIds}));
    setEarnedTitleIds(prev=>({...prev,[cid]:allTitleIds}));
    showToast("👑 모든 상장 받기");
  };

  const showDevEvent=(type)=>{
    if(type==="level"){ showGameEvent({type:"level",emoji:"🎉",title:"레벨업!",name:"Lv.10 챔피언",desc:"레벨업 팝업 테스트",reward:"🎁 보너스\n⭐ +100 XP · 💎 +100 코인"}); return; }
    if(type==="title"){ showGameEvent({type:"title",cert:true,emoji:"👑",title:"상장을 받았어요!",name:"황금 테스트러",desc:"임무를 50개나 끝까지 해낸 멋진 모험가에게 이 상장을 드립니다",rarity:"epic",reward:"⭐ +100 XP · 💎 +100 코인"}); return; }
    if(type==="box"){ showGameEvent({type:"box",emoji:"📦",title:"보물상자 획득!",name:"일반상자",desc:"미션 10개 달성 보상이에요!",reward:"🎁 보물창고에서 열어보세요"}); return; }
    if(type==="treasure"){ setTreasureModal({emoji:"👑",boxName:"전설상자",rewardCoin:777,titleReward:{id:"dev_title",name:"황금 테스트러",emoji:"👑",rarity:"legendary"},headerGrad:"linear-gradient(135deg,#F59E0B,#FDE68A)"}); return; }
  };

  // ── 개발자: 미션 10개 / 숙제 10개 일괄 추가 ──
  const addDevQuests=(cid,count=10)=>{
    const date=childDate||TODAY;
    const entry=getDailyEntry(cid,EXTRA_QUEST_ID,date);
    const base=Date.now();
    const newTodos=Array.from({length:count},(_,i)=>({
      id:base+i,
      text:`미션 ${i+1}`,
      done:false,
      point:DEFAULT_HOMEWORK_SCORE
    }));
    setDailyEntry(cid,EXTRA_QUEST_ID,date,{...entry,todos:[...(entry.todos||[]),...newTodos]});
    showToast(`📝 미션 ${count}개 추가 완료! (기타 미션)`);
  };

  const addDevHomeworks=(cid,count=10)=>{
    const date=childDate||TODAY;
    // 첫 번째 등록된 학원에 추가 (없으면 기타 미션에 추가)
    const firstAcademy=(academies[cid]||[])[0];
    const targetId=firstAcademy?firstAcademy.id:EXTRA_QUEST_ID;
    const targetName=firstAcademy?firstAcademy.name:"기타 미션";
    const entry=getDailyEntry(cid,targetId,date);
    const base=Date.now();
    const newHws=Array.from({length:count},(_,i)=>({
      id:base+i,
      text:`숙제 ${i+1}`,
      done:false,
      point:DEFAULT_HOMEWORK_SCORE
    }));
    setDailyEntry(cid,targetId,date,{...entry,homeworks:[...(entry.homeworks||[]),...newHws]});
    showToast(`📚 숙제 ${count}개 추가 완료! (${targetName})`);
  };

  const resetGameData=(cid)=>{
    const nm=(children.find(c=>c.id===cid)?.name)||"이 아이";
    if(!window.confirm(`${nm}의 모든 기록이 삭제됩니다.\n정말 초기화할까요?`)) return;
    if(!window.confirm("초기화 후 복구할 수 없습니다.\n정말 진행할까요?")) return;
    setScoreData(prev=>({...prev,[cid]:{xp:0,coin:0,history:[]}}));
    // 등록한 학원·미션은 유지하되, 완료 표시(done/failed)만 해제 → 업적·상장가 다시 해금되지 않도록
    setDailyData(prev=>{
      const next={...prev};
      Object.keys(next).forEach(key=>{
        if(!key.startsWith(`${cid}-`)) return;
        const e=next[key];
        next[key]={
          ...e,
          homeworks:(e.homeworks||[]).map(h=>({...h,done:false,failed:false})),
          todos:(e.todos||[]).map(t=>({...t,done:false,failed:false})),
        };
      });
      return next;
    });
    setTreasureData(prev=>({...prev,[cid]:{completedQuestCount:0,normalBox:0,rareBox:0,legendBox:0,rewardedQuestKeys:[]}}));
    setPetData(prev=>({...prev,[cid]:0}));
    setRewardRequests(prev=>({...prev,[cid]:[]}));
    setSelectedTitles(prev=>({...prev,[cid]:"rookie"}));
    setSpecialTitles(prev=>({...prev,[cid]:[]}));
    setSeenTitles(prev=>({...prev,[cid]:[]}));
    setEarnedTitleIds(prev=>({...prev,[cid]:[]}));
    setUnlockedBadgeIds(prev=>prev.filter(id=>!id.startsWith(`${cid}-`)));
    showToast("게임 데이터 초기화 완료");
  };

  const resetAllAppData=()=>{
    if(!window.confirm("정말 앱 전체를 초기화할까요?")) return;
    if(!window.confirm("아이/학원/미션/설정이 모두 삭제돼요. 정말 삭제할까요?")) return;
    try { localStorage.clear(); } catch (e) {}
    setChildren(DEFAULT_CHILDREN); setChildId("child_1");
    setAcademies({}); setAbsences({}); setPaidStatus({}); setDayMemos({});
    setDailyData({}); setScoreData({}); setRewardData({}); setRewardRequests({});
    setBaseSeededKeys({});
    setPetData({});
    setSkinByChild({});
    setUnlockedBadgeIds([]); setLastLevelByChild({});
    setSelectedTitles({}); setTreasureData({}); setSeenTitles({});
    setEarnedTitleIds({});
    setSpecialTitles({}); setBestStreakData({}); setVacations({});
    setTemplates(SAMPLE_TMPL); setParentPin("1234");
    setShowDevTools(false); setShowSettingsModal(false); setAppMode("child");
    showToast("앱 전체가 초기화되었어요 🔄");
  };

  const exitParentMode=()=>{
    setAppMode("child"); setPinInput("");
    showToast("아이용으로 전환됨 🎒");
    // 아이모드 첫 진입 흐름: 모드선택 먼저 → (모드 고르면) 코치마크를 그 모드에 맞춰 노출.
    // 가이드는 봤지만 모드를 아직 안 골랐으면 모드선택만 띄운다.
    (async()=>{
      const seen=await load("v6_kid_guide_seen");
      const skinPicked=!!skinByChild[childId];   // 현재 아이가 모드를 골랐는지
      if(!skinPicked){
        setTimeout(()=>setShowModeSelect(true),400);      // 모드 먼저 선택 → onPick에서 코치마크 연결
      } else if(!seen){
        setTimeout(()=>setShowKidCoachmark(true),400);    // 모드는 골랐는데 가이드 미시청(구버전 사용자)
      }
    })();
    // 보물상자 있으면 알림
    const treasure=getChildTreasure(childId);
    const total=getTotalTreasureCount(childId);
    if(total>0){
      setTimeout(()=>showToast(`${TM.boxEmoji} ${TM.box} ${total}개가 기다리고 있어요!`),800);
    }
  };

  const getChildAcademies=(cid)=>academies[cid]||[];

  const getWeeklySchedule=(cid)=>{
    const list=academies[cid]||[];
    return DAYS.map(day=>{
      const items=list
        .filter(ac=>hasClassOnDay(ac,day))
        .map(ac=>({...ac,classTime:getClassTime(ac,day),duration:getClassDuration(ac,day),shuttle:getShuttleText(ac,day)}))
        .sort((a,b)=>(a.classTime||"").localeCompare(b.classTime||""));
      return {day,items};
    });
  };

  const toggleCopyAcademy=(academyId)=>{
    setCopySelectedAcademyIds(prev=>
      prev.includes(academyId)?prev.filter(id=>id!==academyId):[...prev,academyId]
    );
  };

  const copyAcademiesToCurrentChild=()=>{
    if(!copySourceChildId){ showToast("가져올 아이를 선택해줘"); return; }
    if(copySelectedAcademyIds.length===0){ showToast("복사할 학원을 선택해줘"); return; }
    const selected=getChildAcademies(copySourceChildId).filter(ac=>copySelectedAcademyIds.includes(ac.id));
    setAcademies(prev=>{
      const current=prev[childId]||[];
      const copied=selected.map(ac=>({...ac,id:Date.now()+Math.random()}));
      return {...prev,[childId]:[...current,...copied]};
    });
    setShowAcademyCopyModal(false);
    setCopySourceChildId("");
    setCopySelectedAcademyIds([]);
    showToast("학원 복사 완료 📚");
  };

  const openNaverMapSearch=()=>{
    const q=newAc.name||"학원";
    window.open(`https://map.naver.com/p/search/${encodeURIComponent(q)}`,"_blank");
  };

  const pickTeacherContact=async()=>{
    if(!("contacts" in navigator)||!navigator.contacts?.select){
      showToast("이 기기에서는 주소록 불러오기를 지원하지 않아요");
      return;
    }
    try {
      const contacts=await navigator.contacts.select(["name","tel"],{multiple:false});
      const contact=contacts?.[0];
      if(!contact) return;
      const name=Array.isArray(contact.name)?contact.name[0]:contact.name;
      const tel=Array.isArray(contact.tel)?contact.tel[0]:contact.tel;
      setNewAc(prev=>({...prev,teacher:name||prev.teacher,phone:tel||prev.phone}));
      showToast("주소록에서 가져왔어요 📞");
    } catch(e) {
      showToast("주소록 선택을 취소했어요");
    }
  };

  const changeParentPin=()=>{
    if(oldPinInput!==parentPin){ showToast("기존 비밀번호가 달라요"); return; }
    if(!newPinInput||newPinInput.length<4){ showToast("새 비밀번호는 4자리 이상으로 해줘"); return; }
    if(newPinInput!==newPinConfirm){ showToast("새 비밀번호 확인이 달라요"); return; }
    setParentPin(newPinInput);
    setOldPinInput(""); setNewPinInput(""); setNewPinConfirm("");
    setShowPinChangeModal(false);
    showToast("비밀번호가 변경됐어요 🔐");
  };

  // ── 결제(프리미엄) 처리 ─────────────────────────────────
  // RevenueCat 등 인앱결제가 성공하면 이 함수를 호출한다. (결제 검증은 결제 SDK가 담당)
  const grantPremium=()=>{
    setIsPaidPremium(true);
    save("v6_paid_premium",true);
    showToast("프리미엄이 활성화됐어요 ✨");
  };
  // (선택) 환불·구독해지 등으로 프리미엄을 회수해야 할 때
  const revokePremium=()=>{
    setIsPaidPremium(false);
    save("v6_paid_premium",false);
  };

  const exportBackup=()=>{
    const backup={
      backupVersion:"1.0",
      appName:"academy-schedule-rpg",
      createdAt:new Date().toISOString(),

      children,
      childId,
      academies,
      absences,
      paidStatus,
      dayMemos,
      dailyData,
      scoreData,
      rewardData,
      rewardRequests,
      unlockedBadgeIds,
      lastLevelByChild,
      selectedTitles,
      treasureData,
      seenTitles,
      earnedTitleIds,
      baseSeededKeys,
      petData,
      skinByChild,
      specialTitles,
      bestStreakData,
      vacations,
      templates,
      parentPin,
      installInfo
    };

    const blob=new Blob([JSON.stringify(backup,null,2)],{
      type:"application/json"
    });

    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`academy-backup-${TODAY}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast("데이터 백업 완료 💾");
  };

  const importBackup=(file)=>{
    if(!file) return;

    if(!window.confirm("현재 데이터를 백업 파일 내용으로 덮어쓸까요?")) return;

    const reader=new FileReader();

    reader.onload=(e)=>{
      try{
        const data=JSON.parse(e.target.result);

        setChildren(data.children||DEFAULT_CHILDREN);
        setChildId(data.childId||data.children?.[0]?.id||"child_1");
        setAcademies(data.academies||{});
        setAbsences(data.absences||{});
        setPaidStatus(data.paidStatus||{});
        setDayMemos(data.dayMemos||{});
        setDailyData(data.dailyData||{});
        setScoreData(data.scoreData||{});
        setRewardData(data.rewardData||{});
        setRewardRequests(data.rewardRequests||{});
        setUnlockedBadgeIds(data.unlockedBadgeIds||[]);
        setLastLevelByChild(data.lastLevelByChild||{});
        setSelectedTitles(data.selectedTitles||{});
        setTreasureData(data.treasureData||{});
        setSeenTitles(data.seenTitles||{});
        setEarnedTitleIds(data.earnedTitleIds||{});
        setBaseSeededKeys(data.baseSeededKeys||{});
        setPetData(data.petData||{});
        setSkinByChild(data.skinByChild||{});
        setSpecialTitles(data.specialTitles||{});
        setBestStreakData(data.bestStreakData||{});
        setVacations(data.vacations||{});
        setTemplates(data.templates||SAMPLE_TMPL);
        setParentPin(data.parentPin||"1234");

        // 설치 정보: 복원본과 현재 중 더 이른 설치일을 유지 (창립 사용자 자격 보존)
        if(data.installInfo?.installDate){
          setInstallInfo(prev=>{
            const cur=prev?.installDate;
            const inc=data.installInfo;
            const keepEarlier=(!cur || new Date(inc.installDate)<new Date(cur))?inc:prev;
            const merged={ installDate:keepEarlier.installDate, isFoundingUser:!!(inc.isFoundingUser||prev?.isFoundingUser) };
            save("v6_install_info",merged);
            return merged;
          });
        }

        showToast("데이터 복원 완료 📂");
      }catch(err){
        showToast("복원 실패: 백업 파일을 확인해줘");
      }
    };

    reader.readAsText(file);
  };

  // 현재 아이 정보
  const curChild = children.find(c=>c.id===childId) || children[0];

  // ── 프리미엄 사용 가능 여부 (잠금 판단의 단일 기준) ──
  // PREMIUM_ENABLED 가 false 면 무조건 true (전 기능 무료).
  // true 로 켜진 뒤에는: 결제했거나 / 창립 사용자면 프리미엄 대우.
  const isFounding = !!installInfo?.isFoundingUser;
  const isPremiumUser = !PREMIUM_ENABLED || isPaidPremium || (FOUNDING_USER_IS_PREMIUM && isFounding);
  // 특정 프리미엄 기능을 막아야 하는지 여부 (true 면 잠금 표시)
  const isLocked = () => !isPremiumUser;

  const getChildTheme = (child) => {
    if (!child) return GENDER_THEME.boy;
    return child.theme || GENDER_THEME[child.gender] || GENDER_THEME.boy;
  };
  const getGenderEmoji = (child) => GENDER_THEME[child?.gender]?.emoji || GENDER_THEME.boy.emoji;

  // 테마색은 던전·베이커리 모두 아이가 고른 색을 그대로 쓴다(아이 구분 유지).
  const th = getChildTheme(curChild);
  const T = getSkin(kidSkin).text;       // 현재 아이모드 스킨의 텍스트 세트(던전/베이커리)
  const TM = getTerms(kidSkin);          // 현재 아이모드 재화/아이콘 용어(던전/베이커리)
  const _skin = getSkin(kidSkin);
  const GP = _skin.paletteFn ? _skin.paletteFn(th.main) : _skin.palette;   // 테마색 적용 팔레트(없으면 정적)
  const ST = _skin.stamp || {on:false};  // 완료 도장(베이커리) 설정
  const thTop = th.lightTop || "#FFFFFF"; // 구버전 테마 폴백
  const CT = makeThemeColors(th.main);   // 현재 테마색에 맞춘 박스색 세트
  // ── 젤리 스타일 헬퍼 (베이커리 전용) ─────────────────────────
  // 색은 기존 톤(흰빛+테마 틴트) 유지, 형태만 말랑한 젤리로 통일.
  const jellyBox = (fallback={}, {radius=22}={}) => kidSkin==="cute"
    ? { position:"relative", borderRadius:radius,
        background:`linear-gradient(160deg, ${mixWhite(th.main,0.92)}, ${mixWhite(th.main,0.78)})`,
        border:"2px solid #fff",
        boxShadow:`0 10px 24px ${th.main}28, inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -7px 14px ${th.main}1c` }
    : fallback;
  const jellyChip = (fallback={}, {radius=16}={}) => kidSkin==="cute"
    ? { borderRadius:radius,
        background:"linear-gradient(160deg, #ffffff, rgba(255,255,255,0.8))",
        border:"2px solid #fff",
        boxShadow:`0 5px 13px ${th.main}28, inset 0 1.5px 3px rgba(255,255,255,0.95)` }
    : fallback;
  // 통일된 젤리 진행바 (베이커리). fallbackFill 로 던전/기타 색 유지.
  // ── 던전 카드 '빛나는' 배경/오버레이 (던전 전용) ───────────
  // 단조로운 남색 카드에 테마색 글로우 + 대각 광택을 더해 RPG 느낌으로.
  const dungeonShinyBg = kidSkin==="cute"
    ? `radial-gradient(120% 90% at 15% 0%, ${th.main}3a 0%, transparent 55%), radial-gradient(110% 80% at 100% 100%, ${dungeonTone(th.main,0)}88 0%, transparent 50%), linear-gradient(135deg, ${dungeonTone(th.main,28)}, ${dungeonTone(th.main,16)})`
    : GP.boxBg;
  const DungeonCardGlow = ()=> kidSkin==="cute" ? null : (
    <>
      {/* 대각 광택 스윕 */}
      <div style={{position:"absolute",top:0,left:"-30%",width:"55%",height:"100%",background:"linear-gradient(105deg, transparent, rgba(255,255,255,0.10), transparent)",transform:"skewX(-18deg)",pointerEvents:"none",animation:"shineMove 4.5s ease-in-out infinite"}}/>
      {/* 상단 모서리 골드 글로우 */}
      <div style={{position:"absolute",top:-30,right:-20,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle, ${GP.gold}26, transparent 70%)`,pointerEvents:"none"}}/>
      {/* 미세한 별빛 */}
      <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:0.5,backgroundImage:`radial-gradient(1.4px 1.4px at 22% 28%, rgba(255,255,255,0.5), transparent), radial-gradient(1.2px 1.2px at 68% 18%, ${GP.gold}aa, transparent), radial-gradient(1.3px 1.3px at 82% 62%, rgba(255,255,255,0.4), transparent), radial-gradient(1.2px 1.2px at 40% 78%, ${GP.neon}88, transparent)`}}/>
    </>
  );
  // 던전 판타지 풍경: 그라데이션 하늘 + 달 + 구름 + 산/성 실루엣 (테마색 반영)
  // 캐릭터 무대 카드 상단 배경으로 사용. 던전 전용.
  const DungeonScenery = ()=> kidSkin==="cute" ? null : (()=>{
    const sky1 = mixHex(GP.dark2 || dungeonTone(th.main,18), GP.scenery || th.main, 0.18);   // 하늘 상단
    const sky2 = mixHex(GP.dark2 || dungeonTone(th.main,38), GP.scenery || th.main, 0.34);   // 하늘 중단
    const hill = mixHex(GP.dark || dungeonTone(th.main,8), GP.scenery || th.main, 0.20);     // 먼 산
    const hill2 = mixHex(GP.dark || dungeonTone(th.main,2), GP.themeDeep || th.main, 0.28);  // 앞 지면
    const castle = mixHex(GP.dark || dungeonTone(th.main,0), GP.themeDeep || th.main, 0.18); // 성 실루엣
    return (
      <div style={{position:"absolute",top:0,left:0,right:0,height:"62%",overflow:"hidden",pointerEvents:"none",zIndex:0,borderRadius:"inherit"}}>
        {/* 그라데이션 하늘 */}
        <div style={{position:"absolute",inset:0,background:`linear-gradient(180deg, ${sky1} 0%, ${sky2} 100%)`}}/>
        {/* 달 + 달무리 (은은하게 — 캐릭터와 겹쳐도 튀지 않게) */}
        <div style={{position:"absolute",top:"13%",right:"12%",width:30,height:30,borderRadius:"50%",background:`radial-gradient(circle at 38% 35%, ${GP.gold}99, ${GP.gold}55 70%, transparent)`,boxShadow:`0 0 10px ${GP.gold}22`,opacity:0.4,filter:"blur(0.8px)"}}/>
        {/* 별빛 */}
        <div style={{position:"absolute",inset:0,opacity:0.7,backgroundImage:`radial-gradient(1.5px 1.5px at 18% 22%, rgba(255,255,255,0.9), transparent), radial-gradient(1.2px 1.2px at 38% 14%, rgba(255,255,255,0.7), transparent), radial-gradient(1.3px 1.3px at 60% 26%, ${GP.gold}cc, transparent), radial-gradient(1.1px 1.1px at 78% 12%, rgba(255,255,255,0.6), transparent), radial-gradient(1.4px 1.4px at 88% 30%, rgba(255,255,255,0.8), transparent), radial-gradient(1.1px 1.1px at 8% 38%, rgba(255,255,255,0.5), transparent)`}}/>
        {/* 구름 */}
        <div style={{position:"absolute",top:"30%",left:"-8%",width:90,height:18,borderRadius:99,background:`${sky2}`,opacity:0.55,filter:"blur(4px)"}}/>
        <div style={{position:"absolute",top:"22%",left:"44%",width:64,height:14,borderRadius:99,background:`${sky2}`,opacity:0.45,filter:"blur(4px)"}}/>
        {/* 산 + 성 실루엣 SVG (하단) */}
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{position:"absolute",bottom:0,left:0,width:"100%",height:"70%"}}>
          {/* 먼 산 */}
          <path d="M0,120 L0,72 L60,40 L120,68 L180,34 L250,66 L320,42 L400,70 L400,120 Z" fill={hill} opacity="0.85"/>
          {/* 성 실루엣 (중앙 좌측) — 뾰족 지붕·톱니 흉벽·아치문으로 성답게 */}
          <g fill={castle} opacity="0.95">
            {/* 본성 몸체 */}
            <rect x="78" y="50" width="60" height="40"/>
            {/* 좌측 탑 + 톱니 흉벽 */}
            <rect x="68" y="44" width="16" height="46"/>
            <path d="M68,44 h16 v-4 h-3 v3 h-3 v-3 h-4 v3 h-3 z"/>
            {/* 우측 탑 + 톱니 흉벽 */}
            <rect x="132" y="44" width="16" height="46"/>
            <path d="M132,44 h16 v-4 h-3 v3 h-3 v-3 h-4 v3 h-3 z"/>
            {/* 중앙 높은 탑 */}
            <rect x="100" y="34" width="16" height="56"/>
            {/* 중앙 탑 뾰족 지붕 + 깃발 */}
            <polygon points="108,20 99,35 117,35"/>
            <rect x="107" y="13" width="1.6" height="8"/>
            <path d="M108.6,13 l6,2 l-6,2 z"/>
            {/* 좌우 탑 뾰족 지붕 */}
            <polygon points="76,30 67,45 85,45"/>
            <polygon points="140,30 131,45 149,45"/>
            {/* 아치형 정문 (어둡게 비워 보이게) */}
            <path d="M104,90 v-12 a4,4 0 0 1 8,0 v12 z" fill={GP.dark||castle} opacity="0.55"/>
            {/* 성 창문 (불빛) */}
            <rect x="86" y="60" width="5" height="8" rx="1.5" fill={GP.gold} opacity="0.8"/>
            <rect x="125" y="60" width="5" height="8" rx="1.5" fill={GP.gold} opacity="0.8"/>
            <rect x="105" y="44" width="6" height="7" rx="2" fill={GP.gold} opacity="0.85"/>
          </g>
          {/* 앞 지면 */}
          <path d="M0,120 L0,92 L80,80 L170,96 L260,82 L340,98 L400,86 L400,120 Z" fill={hill2}/>
        </svg>
      </div>
    );
  })();
  // 베이커리 파스텔 풍경: 맑은 하늘 + 해 + 솜사탕 구름 + 제과점/케이크 언덕 실루엣 (테마색 반영)
  // 메인 프로필 카드 상단 배경으로 사용. 베이커리 전용.
  const BakeryScenery = ()=> kidSkin!=="cute" ? null : (()=>{
    const sky1 = mixWhite(th.main, 0.74);   // 하늘 상단(맑은 파스텔)
    const sky2 = mixWhite(th.main, 0.5);    // 하늘 아래(테마색 진하게)
    const hill = mixWhite(th.main, 0.42);   // 먼 언덕
    const hill2 = mixWhite(th.main, 0.3);   // 앞 지면
    const shop = mixWhite(th.main, 0.2);    // 제과점 실루엣
    return (
      <div style={{position:"absolute",top:0,left:0,right:0,height:"58%",overflow:"hidden",pointerEvents:"none",zIndex:0,borderRadius:"inherit"}}>
        {/* 파스텔 하늘 */}
        <div style={{position:"absolute",inset:0,background:`linear-gradient(180deg, ${sky1} 0%, ${sky2} 100%)`,opacity:0.55}}/>
        {/* 🌈 무지개 (우측 아치 — 바닥은 오른쪽 가까이, 동그란 아치 유지) */}
        <svg viewBox="0 0 200 200" preserveAspectRatio="xMaxYMax meet" style={{position:"absolute",top:0,right:0,width:"58%",height:"100%",opacity:0.5,pointerEvents:"none"}}>
          <g fill="none" strokeLinecap="round">
            <path d="M70,200 A130,130 0 0 1 200,70" stroke="#FF8FA3" strokeWidth="7"/>
            <path d="M82,200 A118,118 0 0 1 200,82" stroke="#FFC078" strokeWidth="7"/>
            <path d="M94,200 A106,106 0 0 1 200,94" stroke="#FFE08A" strokeWidth="7"/>
            <path d="M106,200 A94,94 0 0 1 200,106" stroke="#A0E0A8" strokeWidth="7"/>
            <path d="M118,200 A82,82 0 0 1 200,118" stroke="#8FC8F0" strokeWidth="7"/>
            <path d="M130,200 A70,70 0 0 1 200,130" stroke="#C8A8E8" strokeWidth="7"/>
          </g>
        </svg>
        {/* 반짝임 */}
        <div style={{position:"absolute",inset:0,opacity:0.6,backgroundImage:`radial-gradient(1.6px 1.6px at 20% 24%, #fff, transparent), radial-gradient(1.3px 1.3px at 44% 16%, #fff, transparent), radial-gradient(1.4px 1.4px at 70% 28%, #FFFBEB, transparent), radial-gradient(1.2px 1.2px at 86% 18%, #fff, transparent)`}}/>
        {/* ☁️ 솜사탕 구름 (통통하게 — 작은 덩어리 겹쳐 뭉게뭉게) */}
        <div style={{position:"absolute",top:"30%",left:"-4%",width:78,height:22,borderRadius:99,background:"#fff",opacity:0.78,filter:"blur(2px)",boxShadow:"14px -7px 0 -3px #fff, 34px -4px 0 -1px #fff"}}/>
        <div style={{position:"absolute",top:"18%",left:"60%",width:48,height:15,borderRadius:99,background:"#fff",opacity:0.62,filter:"blur(2px)",boxShadow:"11px -5px 0 -2px #fff"}}/>
        {/* 앞 지면 + 🏠 귀여운 집 (캐릭터 절반 지점부터 시작) SVG (하단) */}
        <svg viewBox="0 0 400 120" preserveAspectRatio="none" style={{position:"absolute",bottom:0,left:0,width:"100%",height:"68%"}}>
          {/* 🏠 귀여운 집 — 중앙(캐릭터 절반)부터 우측으로 */}
          <g opacity="0.95">
            {/* 몸체 */}
            <rect x="206" y="64" width="58" height="40" rx="3" fill={shop}/>
            {/* 삼각 지붕(처마 살짝 돌출) */}
            <polygon points="198,64 272,64 235,40" fill={mixWhite(th.main,0.1)}/>
            {/* 굴뚝 */}
            <rect x="252" y="44" width="9" height="16" rx="1.5" fill={mixWhite(th.main,0.1)}/>
            {/* 둥근 아치문 */}
            <path d="M226,104 v-15 a9,9 0 0 1 18,0 v15 z" fill={mixWhite(th.main,0.5)}/>
            {/* 창문 불빛 */}
            <rect x="212" y="74" width="11" height="11" rx="2" fill="#FFE08A" opacity="0.9"/>
            <rect x="247" y="74" width="11" height="11" rx="2" fill="#FFE08A" opacity="0.75"/>
          </g>
          {/* 앞 지면(둥근 케이크 언덕) */}
          <path d="M0,120 L0,98 Q90,84 180,100 Q270,114 360,96 L400,100 L400,120 Z" fill={hill2}/>
        </svg>
      </div>
    );
  })();
  const JellyBar = ({percent=0, height=14, fallbackTrack, fallbackFill, fallbackBorder, fallbackGlow})=>{
    const cute = kidSkin==="cute";
    const h = cute ? Math.max(height,14) : height;
    const fill = cute
      ? `linear-gradient(90deg, ${mixBlack(th.main,0.08)}, ${mixWhite(th.main,0.15)})`
      : (fallbackFill||GP.accentBar||`linear-gradient(90deg, ${GP.gold}, ${mixWhite(th.main,0.25)} 55%, ${th.main})`);
    return (
      <div style={{height:h,borderRadius:999,overflow:"hidden",position:"relative",
        background:cute?`${th.main}2b`:(fallbackTrack||"rgba(0,0,0,0.34)"),
        border:cute?"none":(fallbackBorder||`1px solid ${th.main}55`),
        boxShadow:cute?`inset 0 2px 5px ${th.main}33`:"inset 0 2px 6px rgba(0,0,0,0.5)"}}>
        {/* 빈 트랙 활기: 은은한 사선 무늬 + 왼쪽 출발 글로우 (0%여도 죽지 않게) */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:cute?0.5:0.4,
          backgroundImage:cute
            ?`repeating-linear-gradient(115deg, ${th.main}1f 0 6px, transparent 6px 13px)`
            :`repeating-linear-gradient(115deg, rgba(255,255,255,0.10) 0 6px, transparent 6px 13px)`}}/>
        <div style={{position:"absolute",top:0,bottom:0,left:0,width:"38%",pointerEvents:"none",borderRadius:999,
          background:cute
            ?`linear-gradient(90deg, ${th.main}3a, transparent)`
            :`linear-gradient(90deg, ${GP.gold}3a, transparent)`}}/>
        <div style={{width:`${percent}%`,height:"100%",borderRadius:999,position:"relative",overflow:"hidden",zIndex:1,
          background:fill,
          transition:"width 0.6s cubic-bezier(.34,1.4,.64,1)",
          boxShadow:cute?"inset 0 2px 3px rgba(255,255,255,0.6)":(fallbackGlow||`0 0 12px ${th.main}, inset 0 1px 2px rgba(255,255,255,0.4)`)}}>
          {cute
            ?<div style={{position:"absolute",top:1.5,left:6,right:6,height:4,borderRadius:999,background:"rgba(255,255,255,0.6)"}}/>
            :<>
              {/* 상단 하이라이트 줄 */}
              <div style={{position:"absolute",top:1,left:4,right:4,height:Math.max(2,h*0.3),borderRadius:999,background:"linear-gradient(180deg, rgba(255,255,255,0.5), transparent)"}}/>
              {/* 에너지 빗살 패턴 (충전 느낌) */}
              <div style={{position:"absolute",inset:0,opacity:0.45,backgroundImage:"linear-gradient(115deg, rgba(255,255,255,0.35) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.35) 75%, transparent 75%)",backgroundSize:"24px 100%",animation:"barStripeMove 0.7s linear infinite"}}/>
              {/* 흐르는 광택 */}
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",backgroundSize:"40px 100%",animation:"gaugeShine 1.1s linear infinite"}}/>
              {/* 진행 끝 펄스 발광 */}
              {percent>3&&percent<100&&<div style={{position:"absolute",top:-1,bottom:-1,right:0,width:Math.max(7,h*0.8),background:"#fff",filter:"blur(3.5px)",animation:"barPulse 1.3s ease-in-out infinite"}}/>}
            </>}
        </div>
      </div>
    );
  };
  // 테마 연동 카드 스타일 (상단도 살짝 테마톤 → light로 자연스러운 계단, 톤 점프 완화)
  const gameCardT = {
    ...gameCard,
    background:`linear-gradient(180deg, ${thTop} 0%, ${th.light} 100%)`,
    border:`1px solid ${th.main}22`,
    boxShadow:`0 8px 24px ${th.main}14`
  };
  const characterCardT = kidSkin==="cute"
    ? {
        ...CHARACTER_CARD,
        position:"relative",
        borderRadius:28,
        background:`linear-gradient(160deg, ${mixWhite(th.main,0.92)}, ${mixWhite(th.main,0.78)})`,
        border:"2px solid #fff",
        boxShadow:`0 12px 26px ${th.main}30, inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -7px 15px ${th.main}1f`
      }
    : {
        ...CHARACTER_CARD,
        background:GP.boxBg,
        border:`1px solid ${GP.boxBorder}`,
        boxShadow:`0 8px 24px ${GP.boxShadowCol}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        color:"#FFFFFF"
      };
  const curAc = academies[childId]||[];
  const curAbs = absences[childId]||[];
  const totalFee=(cid)=>(academies[cid]||[]).reduce((s,a)=>s+Number(a.fee||0),0);

  // 아이 관리 함수
  const saveChild=()=>{
    if(!childForm.name.trim()){ showToast("이름을 입력해줘"); return; }
    if(editingChild){
      setChildren(p=>p.map(c=>c.id===editingChild?{...c,name:childForm.name.trim(),gender:childForm.gender,theme:childForm.theme}:c));
      showToast("수정됨 ✓");
    } else {
      const newId=`child_${Date.now()}`;
      setChildren(p=>[...p,{id:newId,name:childForm.name.trim(),gender:childForm.gender,theme:childForm.theme}]);
      setChildId(newId);
      showToast("추가됨 ✓");
    }
    setShowChildMgr(false); setEditingChild(null);
    setChildForm({name:"",gender:"boy",theme:CHILD_THEME_COLORS[0]});
  };
  const deleteChild=(id)=>{
    if(children.length<=1){ showToast("마지막 아이는 삭제할 수 없어요"); return; }
    setChildren(p=>p.filter(c=>c.id!==id));
    if(childId===id) setChildId(children.find(c=>c.id!==id)?.id||"");
    showToast("삭제됨");
  };
  const openAddChild=()=>{
    setEditingChild(null);
    setChildForm({name:"",gender:"boy",theme:CHILD_THEME_COLORS[0]});
    setShowChildMgr(true);
  };
  const openEditChild=(c)=>{
    setEditingChild(c.id);
    setChildForm({name:c.name,gender:c.gender,theme:c.theme||GENDER_THEME[c.gender]||GENDER_THEME.boy});
    setShowChildMgr(true);
  };

  // dailyKey
  const dKey=(cid,aId,date)=>`${cid}-${aId}-${date}`;
  const getDailyEntry=(cid,aId,date)=>dailyData[dKey(cid,aId,date)]||{homeworks:[],supplies:[],todos:[]};
  const setDailyEntry=(cid,aId,date,entry)=>setDailyData(p=>({...p,[dKey(cid,aId,date)]:entry}));

  // ── 상시 숙제: 자동 추가하지 않음. 미션 모달의 '미션에 추가' 버튼으로만 반영 ──

  const getAcademyById=(cid,academyId)=>{
    if(String(academyId)===String(EXTRA_QUEST_ID)){
      const child=children.find(c=>c.id===cid);
      const t=getChildTheme(child);
      return {id:EXTRA_QUEST_ID,name:"기타",color:t.main};
    }
    return (academies[cid]||[]).find(a=>String(a.id)===String(academyId));
  };

  const getQuestItemsForDate=(cid,date)=>{
    const prefix=`${cid}-`;
    const suffix=`-${date}`;
    const items=[];
    Object.entries(dailyData).forEach(([key,entry])=>{
      if(!key.startsWith(prefix)||!key.endsWith(suffix)) return;
      const academyId=key.slice(prefix.length,key.length-suffix.length);
      const ac=getAcademyById(cid,academyId);
      if(!ac) return;
      (entry.homeworks||[]).forEach(h=>items.push({...h,kind:"homework",academyId,date,academyName:ac.name,academyColor:ac.color,label:h.text}));
      (entry.todos||[]).forEach(t=>items.push({...t,kind:"todo",academyId,date,academyName:ac.name,academyColor:ac.color,label:t.text}));
    });
    return items;
  };

  const getCarryOverQuestItems=(cid,date)=>{
    const prefix=`${cid}-`;
    const items=[];
    Object.entries(dailyData).forEach(([key,entry])=>{
      if(!key.startsWith(prefix)) return;
      const datePart=key.slice(-10);
      if(datePart>=date) return;
      const academyId=key.slice(prefix.length,key.length-11);
      const ac=getAcademyById(cid,academyId);
      if(!ac) return;
      (entry.homeworks||[]).filter(h=>!h.done&&!h.failed).forEach(h=>items.push({...h,kind:"homework",academyId,date:datePart,academyName:ac.name,academyColor:ac.color,label:h.text,carried:true}));
      (entry.todos||[]).filter(t=>!t.done&&!t.failed).forEach(t=>items.push({...t,kind:"todo",academyId,date:datePart,academyName:ac.name,academyColor:ac.color,label:t.text,carried:true}));
    });
    return items;
  };

  const getChildQuestBoardItems=(cid,date)=>[...getCarryOverQuestItems(cid,date),...getQuestItemsForDate(cid,date)];

  const getTodayQuestProgress=(cid,date)=>{
    const items=getChildQuestBoardItems(cid,date);
    const done=items.filter(i=>i.done).length;
    const failed=items.filter(i=>i.failed).length;
    const total=items.length;
    const percent=total?Math.round((done/total)*100):0;
    return {items,done,failed,total,percent};
  };

  const getQuestStatus=(item)=>{
    if(item.done) return {label:T.clear,emoji:"✅",color:C.green,bg:`${C.green}12`};
    if(item.failed) return {label:T.failed,emoji:"❌",color:C.red,bg:`${C.red}10`};
    return {label:T.ready,emoji:T.readyEmoji||"⚔️",color:C.orange,bg:`${C.orange}12`};
  };

  const getQuestRewardText=(item)=>{
    const point=item.point||DEFAULT_HOMEWORK_SCORE;
    return `${TM.xpEmoji} +${point} ${TM.xp}  ·  ${TM.coinEmoji} +${point} ${TM.coin}`;
  };

  const getAdventureLogInfo=(item)=>{
    const L = T.log;
    if(!L) {
      // 안전망(구버전 스킨): 기존 던전 라벨
      switch(item.type){
        case "homework": case "todo": case "quest": return {icon:"⚔️",title:"미션 클리어"};
        case "treasure": return {icon:"🎁",title:"보물상자 오픈"};
        case "reward":   return {icon:"🛒",title:"아이템 구매"};
        case "level_bonus": return {icon:"✨",title:"레벨업 보너스"};
        case "badge_reward": return {icon:"🏆",title:"업적 보상"};
        case "manual":   return {icon:"✍️",title:"엄마 XP 조정"};
        default:         return {icon:"📜",title:"모험 기록"};
      }
    }
    const key = (item.type==="homework"||item.type==="todo") ? "quest" : item.type;
    return L[key] || L.default;
  };

  const getProgressMessage=(percent,total)=>{
    const p = T.progress;
    if(total===0) return p.rest;
    if(percent===0) return p.start;
    if(percent<50) return p.low;
    if(percent<100) return p.high;
    return p.done;
  };

  const getRewardCount=()=>getChildRewards().length;
  const getTotalEarnedXp=(cid)=>{
    const history=scoreData[cid]?.history||[];
    return history.filter(h=>h.point>0).reduce((sum,h)=>sum+h.point,0);
  };
  const getTotalTreasureCount=(cid)=>{
    const t=getChildTreasure(cid);
    return Number(t.normalBox||0)+Number(t.rareBox||0)+Number(t.legendBox||0);
  };

  const getLevelProgressInfo=(cid)=>{
    const xp=getChildXP(cid);
    const current=getChildLevel(cid);
    const next=getNextLevel(cid);
    if(!next) return {currentXp:xp,needXp:xp,remainXp:0,percent:100};
    const currentXp=xp-current.minScore;
    const needXp=next.minScore-current.minScore;
    const remainXp=next.minScore-xp;
    return {currentXp,needXp,remainXp,percent:Math.min(100,Math.round((currentXp/needXp)*100))};
  };

  const isTitleUnlocked=(cid,titleId)=>{
    const owned=specialTitles[cid]||[];
    if(owned.includes(titleId)) return true;
    // 한 번 획득한 상장는 조건이 더 이상 충족되지 않아도 영구 유지
    if((earnedTitleIds[cid]||[]).includes(titleId)) return true;
    const level=getChildLevel(cid).level;
    const questCount=getTotalActivityCount(cid);
    const homeworkCount=getCompletedHomeworkCount(cid);
    const streak=getQuestStreak(cid);
    const rewardCount=getApprovedRewardCount(cid);
    const treasureOpenCount=getScoreHistory(cid).filter(h=>h.type==="treasure").length;
    if(titleId==="rookie") return true;
    if(titleId==="first_quest") return questCount>=1;
    if(titleId==="quest_hunter") return questCount>=50;
    if(titleId==="homework_master") return homeworkCount>=30;
    if(titleId==="streak_master") return streak>=10;
    if(titleId==="champion") return level>=10;
    if(titleId==="legend") return level>=20;
    if(titleId==="quest_10_title") return questCount>=10;
    if(titleId==="xp_100_title") return getChildXP(cid)>=100;
    if(titleId==="streak_3_title") return streak>=5;
    if(titleId==="xp_500_title") return getChildXP(cid)>=500;
    if(titleId==="reward_1_title") return rewardCount>=1;
    if(titleId==="quest_100_title") return questCount>=100;
    if(titleId==="quest_700_title") return questCount>=700;
    if(titleId==="xp_3000_title") return getChildXP(cid)>=3000;
    if(titleId==="reward_3_title") return rewardCount>=5;
    if(titleId==="reward_30_title") return rewardCount>=30;
    if(titleId==="streak_30_title") return streak>=30;
    if(titleId==="treasure_master") return treasureOpenCount>=50;
    if(titleId==="world_class") return getChildXP(cid)>=12000;
    return false;
  };
  const getAllTitles=(cid)=>{
    const owned=specialTitles[cid]||[];
    const legendUnlocked=LEGENDARY_TITLES.filter(t=>owned.includes(t.id));
    return [...DEFAULT_TITLES,...legendUnlocked].map(t=>titleView(t,kidSkin));
  };
  const getUnlockedTitles=(cid)=>getAllTitles(cid).filter(t=>isTitleUnlocked(cid,t.id));
  const getSelectedTitle=(cid)=>{
    const selectedId=selectedTitles[cid]||"rookie";
    return getAllTitles(cid).find(t=>t.id===selectedId)||titleView(DEFAULT_TITLES[0],kidSkin);
  };
  const selectTitle=(titleId)=>{
    if(!isTitleUnlocked(childId,titleId)){ showToast("아직 받지 못한 상장이에요 🔒"); return; }
    setSelectedTitles(prev=>({...prev,[childId]:titleId}));
    showToast("상장을 전시했어요 👑");
  };
  const unlockTitle=(cid,title)=>{
    const key=`${cid}-title_${title.id}`;
    if(!unlockedBadgeIds.includes(key)){
      setUnlockedBadgeIds(prev=>[...prev,key]);
    }
  };

  // ── 상장 보상: 등급별 XP·코인. 상장당 1회만 지급 ──
  const getTitleReward=(title)=>{
    const r=TITLE_RARITY[title?.rarity]||TITLE_RARITY.common;
    if(r===TITLE_RARITY.legendary) return {xp:200,coin:100};
    if(r===TITLE_RARITY.epic)      return {xp:100,coin:50};
    if(r===TITLE_RARITY.rare)      return {xp:50,coin:30};
    return {xp:20,coin:10};
  };
  const giveTitleReward=(cid,title)=>{
    if(!title?.id) return {xp:0,coin:0};
    const reward=getTitleReward(title);
    setScoreData(prev=>{
      const cur=prev[cid]||{xp:0,coin:0,history:[]};
      // 같은 상장 보상 중복 지급 방지
      if((cur.history||[]).some(h=>h.type==="title_reward"&&h.titleId===title.id)) return prev;
      return {
        ...prev,
        [cid]:{
          ...cur,
          xp:Math.max(0,Number(cur.xp??cur.total??0)+reward.xp),
          coin:Math.max(0,Number(cur.coin??cur.balance??cur.total??0)+reward.coin),
          history:[
            ...(cur.history||[]),
            { id:Date.now()+Math.random(), titleId:title.id, point:reward.xp, xp:reward.xp, coin:reward.coin, date:TODAY, type:"title_reward", memo:`${title.name} 상장 보상` }
          ]
        }
      };
    });
    return reward;
  };

  const getChildTreasure=(cid)=>treasureData[cid]||{completedQuestCount:0,normalBox:0,rareBox:0,legendBox:0};
  const getPetStage=(cid)=>Math.max(0,Math.min(PET_STAGES.length-1,Number(petData[cid]??0)));
  const getPet=(cid)=>{
    const st=getPetStage(cid);
    const base=petView(PET_STAGES[st],st,kidSkin);
    // 펫 스킨 장착 + 펫 최종 진화 시 동물 스킨으로 표시(완성형)
    const eqPetSkin=getEquipped(cid,"petskin");
    if(eqPetSkin&&isMaxPet(cid)){
      const pv=decorView(eqPetSkin,kidSkin);
      return { ...base, emoji:pv.emoji, name:pv.name };
    }
    return base;
  };

  // ── 꾸미기(데코) 헬퍼 ──
  // 가격: 부모 오버라이드(decorPrices) 우선, 없으면 카탈로그 기본값
  const getDecorPrice=(decor)=>{ const o=decorPrices[decor.id]; return (o===0||o>0)?Number(o):decor.price; };
  const isDecorOwned=(cid,decorId)=>(ownedDecor[cid]||[]).includes(decorId);
  // 보유 데코 구매 (아이가 코인으로 즉시 구매, 승인 불필요)
  const buyDecor=(decor)=>{
    const cid=childId;
    if(isDecorOwned(cid,decor.id)){ showToast("이미 가지고 있어요 ✨"); return; }
    const price=getDecorPrice(decor);
    if(getChildCoin(cid)<price){ showToast(`${TM.coin}이 부족해요 ${TM.coinEmoji}`); return; }
    spendCoin(cid,price,`${decorView(decor,kidSkin).name} 꾸미기 구매`);
    setOwnedDecor(prev=>({...prev,[cid]:[...(prev[cid]||[]),decor.id]}));
    // 구매 즉시 자동 장착(성취감 즉시 반영)
    const grp=DECOR_GROUPS.find(g=>g.items.some(it=>it.id===decor.id));
    if(grp) setEquippedDecor(prev=>({...prev,[cid]:{...(prev[cid]||{}),[grp.key]:decor.id}}));
    showToast(`${decorView(decor,kidSkin).name} 획득! 🎉`);
  };
  // 장착/해제 토글 (이미 장착된 걸 다시 누르면 해제)
  const toggleEquipDecor=(groupKey,decorId)=>{
    const cid=childId;
    if(!isDecorOwned(cid,decorId)) return;
    setEquippedDecor(prev=>{
      const cur=prev[cid]||{};
      const next=cur[groupKey]===decorId?null:decorId;
      return {...prev,[cid]:{...cur,[groupKey]:next}};
    });
  };
  // 현재 장착 데코 객체 조회 (스킨 반영). 없으면 null
  const getEquipped=(cid,groupKey)=>{
    const id=(equippedDecor[cid]||{})[groupKey];
    return id?decorView(getDecorById(id),kidSkin):null;
  };
  const getOwnedCount=(cid)=>(ownedDecor[cid]||[]).length;

  const getQuestTreasureKey=(kind,academyId,date,questId)=>{
    return `${kind}-${academyId}-${date}-${questId}`;
  };

  const giveTreasureForQuestOnce=(cid,questKey)=>{
    if(!questKey) return;

    const cur=treasureData[cid]||{
      completedQuestCount:0,
      normalBox:0,
      rareBox:0,
      legendBox:0,
      rewardedQuestKeys:[]
    };
    const rewardedQuestKeys=cur.rewardedQuestKeys||[];

    // 이미 이 미션으로 보물상자 카운트 반영했으면 다시 지급 안 함
    if(rewardedQuestKeys.includes(questKey)) return;

    const nextCount=Number(cur.completedQuestCount||0)+1;
    let normalBox=Number(cur.normalBox||0);
    let rareBox=Number(cur.rareBox||0);
    let legendBox=Number(cur.legendBox||0);

    // 이번 미션으로 받은 상자 (겹치면 더 높은 등급 하나)
    let earned=null;
    if(nextCount%50===0){ legendBox+=1; earned="legend"; }
    else if(nextCount%30===0){ rareBox+=1; earned="rare"; }
    else if(nextCount%10===0){ normalBox+=1; earned="normal"; }

    setTreasureData(prev=>{
      const p=prev[cid]||cur;
      const keys=p.rewardedQuestKeys||[];
      if(keys.includes(questKey)) return prev;
      return {
        ...prev,
        [cid]:{
          ...p,
          completedQuestCount:Number(p.completedQuestCount||0)+1,
          normalBox:Number(p.normalBox||0)+(earned==="normal"?1:0),
          rareBox:Number(p.rareBox||0)+(earned==="rare"?1:0),
          legendBox:Number(p.legendBox||0)+(earned==="legend"?1:0),
          rewardedQuestKeys:[...keys,questKey]
        }
      };
    });

    // 상자를 받았으면 가운데 팝업으로 크게 알림 (레벨업·업적과 같은 큐)
    if(earned){
      const bi=getBoxInfo(earned,kidSkin);
      const info={emoji:bi.emoji,name:bi.name,desc:`미션 ${nextCount}개 달성 보상이에요!`};
      showGameEvent({
        type:"box",
        emoji:info.emoji,
        title:kidSkin==="cute"?`새 ${TM.box} 획득!`:"보물상자 획득!",
        name:info.name,
        desc:info.desc,
        reward:`${TM.bookEmoji} ${TM.book}에서 열어보세요`
      });
    }
  };

  const openTreasureBox=(boxType)=>{
    const cur=getChildTreasure(childId);
    const boxKey=boxType==="legend"?"legendBox":boxType==="rare"?"rareBox":"normalBox";
    if(Number(cur[boxKey]||0)<=0){ showToast("열 수 있는 상자가 없어요"); return; }
    const rewardInfo=getBoxInfo(boxType,kidSkin);
    const rewardCoin=getRandomTreasureCoin(boxType);
    const boxName=rewardInfo.name;
    const emoji=rewardInfo.emoji;
    const headerGrad=rewardInfo.headerGrad;
    setTreasureData(prev=>({...prev,[childId]:{...cur,[boxKey]:Number(cur[boxKey]||0)-1}}));
    // 전설상자 상장 드롭: 20% 확률 + 5회 천장(연속 5번 미획득 시 보장), 미획득 상장 중 지급
    // 연타로 여러 개를 빠르게 열어도 중복되지 않도록, 실제 후보 선택은
    // setSpecialTitles 콜백 안에서 "최신 보유 목록(prev)" 기준으로 다시 계산한다.
    const dropResult={ title:null }; // setTimeout 모달이 참조하는 가변 컨테이너
    if(boxType==="legend"){
      const ownedNow=specialTitles[childId]||[];
      const availableNow=LEGENDARY_TITLES.filter(t=>!ownedNow.includes(t.id));
      const pity=Number(cur.legendPity||0)+1; // 이번 오픈 포함 미획득 연속 횟수
      const hit=availableNow.length>0 && (Math.random()<0.20 || pity>=5);
      if(hit){
        // 후보를 동기적으로 먼저 선택 (dropResult를 같은 턴에 안전하게 읽기 위함)
        const pickedNow=availableNow[Math.floor(Math.random()*availableNow.length)];
        setSpecialTitles(prev=>{
          const owned=prev[childId]||[];
          // 연타로 빠르게 열어 이미 보유했으면 중복 추가하지 않음
          if(owned.includes(pickedNow.id)) return prev;
          return {...prev,[childId]:[...owned,pickedNow.id]};
        });
        dropResult.title=pickedNow;
      }
      // 상장 획득 팝업 중복 방지: 상자 결과 모달이 상장를 함께 보여주므로
      // 상장 감지 useEffect가 같은 상장로 팝업을 다시 띄우지 않도록 '본 상장'로 미리 등록
      if(dropResult.title){
        const picked=dropResult.title;
        setSeenTitles(sp=>{
          const seen=sp[childId]||[];
          if(seen.includes(picked.id)) return sp;
          return {...sp,[childId]:[...seen,picked.id]};
        });
        setEarnedTitleIds(ep=>{
          const curIds=ep[childId]||[];
          if(curIds.includes(picked.id)) return ep;
          return {...ep,[childId]:[...curIds,picked.id]};
        });
      }
      // 천장 카운트: 실제 드롭 성공 여부에 맞춰 보정 (성공=0, 미획득=누적)
      setTreasureData(prev=>{
        const t=prev[childId]||cur;
        return {...prev,[childId]:{...t,legendPity:dropResult.title?0:pity}};
      });
    }
    // 펫 진화: 등급별 확률 + 전설상자 천장(2개마다 보장). 이미 최종단계면 진화 없음
    let petEvolved=null;
    const curStage=Math.max(0,Math.min(PET_STAGES.length-1,Number(petData[childId]??0)));
    // 전설상자를 열 때마다 누적 카운트 증가, 2가 되면 이번에 보장
    let petGuaranteed=false;
    let nextPetPity=Number(cur.legendPetPity||0);
    if(boxType==="legend"){
      nextPetPity=Number(cur.legendPetPity||0)+1;
      if(nextPetPity>=PET_EVOLVE_LEGEND_PITY){ petGuaranteed=true; nextPetPity=0; }
    }
    const willEvolve = curStage<PET_STAGES.length-1 &&
      (petGuaranteed || Math.random()<(PET_EVOLVE_CHANCE[boxType]||0));
    // 확률로 먼저 진화가 터졌다면 천장 카운트도 리셋(전설상자 한정)
    if(boxType==="legend" && willEvolve && !petGuaranteed) nextPetPity=0;
    if(boxType==="legend"){
      setTreasureData(prev=>{
        const t=prev[childId]||cur;
        return {...prev,[childId]:{...t,legendPetPity:nextPetPity}};
      });
    }
    if(willEvolve){
      const nextStage=curStage+1;
      petEvolved={ from:petView(PET_STAGES[curStage],curStage,kidSkin), to:petView(PET_STAGES[nextStage],nextStage,kidSkin) };
      setPetData(prev=>({...prev,[childId]:nextStage}));
    }
    setScoreData(prev=>{
      const score=prev[childId]||{xp:0,coin:0,history:[]};
      return {...prev,[childId]:{
        ...score,
        coin:Number(score.coin??score.balance??score.total??0)+rewardCoin,
        history:[...(score.history||[]),{id:Date.now(),point:rewardCoin,xp:0,coin:rewardCoin,date:TODAY,type:"treasure",memo:`${boxName} 보상`}]
      }};
    });
    // 오픈 애니메이션 → 딜레이 후 결과 모달
    setOpeningTreasure(true);
    setTimeout(()=>{
      setOpeningTreasure(false);
      setTreasureModal({emoji,boxName,rewardCoin,titleReward:dropResult.title,headerGrad,petEvolved});
      // 상장 획득 팝업은 상장 감지 useEffect가 일원화해 처리 (중복 방지)
      if(petEvolved){
        setTimeout(()=>showGameEvent({
          type:"title",
          emoji:petEvolved.to.emoji,
          title:kidSkin==="cute"?"펫이 자랐어요!":"펫 진화!",
          name:petEvolved.to.name,
          desc:petEvolved.to.desc,
          reward:`${petEvolved.from.emoji} → ${petEvolved.to.emoji} ${kidSkin==="cute"?"펫이 한 단계 자랐어요!":"펫이 성장했어요!"}`
        }),500);
      }
    },1200);
  };

  const checkLevelUp=(cid,beforeXp,afterXp)=>{
    const sortedDesc=[...DEFAULT_LEVELS].sort((a,b)=>b.minScore-a.minScore);
    const levelAt=(xp)=>sortedDesc.find(lv=>xp>=lv.minScore)||DEFAULT_LEVELS[0];
    const beforeLevel=levelAt(beforeXp);

    // afterXp 기준 레벨 → 그 레벨의 보너스가 또 레벨을 올릴 수 있으므로 누적 처리
    // (무한루프 방지: setScoreData는 1회만, 보너스는 여기서 모두 합산)
    let curXp=afterXp;
    let totalBonus=0;
    const passedLevels=[]; // beforeLevel 이후 통과한 모든 레벨
    const seenLevels=new Set([beforeLevel.level]);

    // beforeLevel보다 높고 현재 xp로 도달한 모든 레벨을 오름차순 수집하는 헬퍼
    const collectUpTo=(fromLevelNum,xp)=>{
      const reached=levelAt(xp).level;
      const arr=[];
      DEFAULT_LEVELS.forEach(L=>{
        if(L.level>fromLevelNum&&L.level<=reached) arr.push(L);
      });
      return arr;
    };

    let fromNum=beforeLevel.level;
    let guard=0;
    while(guard++<DEFAULT_LEVELS.length+2){
      const newly=collectUpTo(fromNum,curXp).filter(L=>!seenLevels.has(L.level));
      if(newly.length===0) break;
      newly.forEach(L=>{
        seenLevels.add(L.level);
        passedLevels.push(L);
        const bonus=LEVEL_UP_REWARDS?.[L.level]||0;
        if(bonus>0){
          totalBonus+=bonus;
          curXp+=bonus; // 보너스가 다음 레벨 경계를 넘길 수 있으므로 누적
        }
      });
      fromNum=passedLevels[passedLevels.length-1].level;
    }

    if(passedLevels.length===0) return;

    if(totalBonus>0){
      setScoreData(prev=>{
        const cur=prev[cid]||{xp:0,coin:0,history:[]};
        return {...prev,[cid]:{
          ...cur,
          xp:Math.max(0,Number(cur.xp??cur.total??0)+totalBonus),
          coin:Math.max(0,Number(cur.coin??cur.balance??cur.total??0)+totalBonus),
          history:[...(cur.history||[]),{id:Date.now()+Math.random(),point:totalBonus,xp:totalBonus,coin:totalBonus,date:TODAY,type:"level_bonus",memo:`레벨업 보너스 합계 (Lv.${passedLevels[passedLevels.length-1].level} 도달)`}]
        }};
      });
    }

    // 통과한 각 레벨마다 팝업 (낮은 레벨 → 높은 레벨 순)
    const _g=children.find(c=>c.id===cid)?.gender;
    let prevName=levelView(beforeLevel,kidSkin,_g).name;
    passedLevels.forEach(L=>{
      const LV=levelView(L,kidSkin,_g);
      const bonus=LEVEL_UP_REWARDS?.[L.level]||0;
      const desc=LEVEL_DESCRIPTION[L.level]
        ? LEVEL_DESCRIPTION[L.level]
        : `${prevName}에서 ${LV.name}으로 성장했어요!`;
      // Lv.17 도달 → 꾸미기 상점에서 캐릭터 스킨 구매 해제 안내
      const unlockSkin=L.level===17;
      const baseReward=bonus>0?`🎁 레벨업 보너스\n${TM.xpEmoji} +${bonus} ${TM.xp} · ${TM.coinEmoji} +${bonus} ${TM.coin}`:"새로운 레벨 달성!";
      showGameEvent({
        type:"level",
        emoji:LV.emoji||"🎉",
        title:"레벨업!",
        name:`Lv.${LV.level} ${LV.name}`,
        desc:unlockSkin?`${desc}\n\n🦸 이제 ${kidSkin==="cute"?"꾸미기 가게":"꾸미기 상점"}에서 특별한 캐릭터를 살 수 있어요!`:desc,
        reward:baseReward
      });
      prevName=LV.name;
    });
  };

  const getChildXP=(cid)=>{
    const data=scoreData[cid];
    if(!data) return 0;
    return Number(data.xp??data.total??0);
  };
  const getChildCoin=(cid)=>{
    const data=scoreData[cid];
    if(!data) return 0;
    return Number(data.coin??data.balance??data.total??0);
  };
  const getChildScore=(cid)=>getChildXP(cid);
  const getChildBalance=(cid)=>getChildCoin(cid); // 하위호환

  const getScoreHistory=(cid)=>scoreData[cid]?.history||[];

  const getScoreHistoryLabel=(item)=>{
    if(item.memo) return item.memo;
    if(item.label) return item.label;
    if(item.type==="reward") return "보상샵 구매";
    if(item.type==="homework") return item.point>=0?"미션 완료":"미션 체크 취소";
    if(item.type==="todo") return item.point>=0?"미션 완료":"미션 체크 취소";
    if(item.type==="manual") return kidSkin==="cute"?`엄마 ${TM.xp} 조정`:"엄마 XP 조정";
    if(item.type==="treasure") return kidSkin==="cute"?`${TM.box} 획득`:"보물상자 획득";
    if(item.type==="level_bonus") return "레벨업 보너스";
    return kidSkin==="cute"?`${TM.xp} 변동`:"XP 변동";
  };

  const getScoreHistoryAmountText=(item)=>{
    if(item.type==="reward") return `${Math.abs(item.coin??item.point)} 💎코인`;
    return `${Math.abs(item.xp??item.point)} ⭐XP`;
  };

  const getCompletedHomeworkCount=(cid)=>{
    let count=0;
    Object.entries(dailyData).forEach(([key,entry])=>{
      if(!key.startsWith(`${cid}-`)) return;
      count+=(entry.homeworks||[]).filter(h=>h.done).length;
    });
    return count;
  };

  const getCompletedQuestCount=(cid)=>{
    let count=0;
    Object.entries(dailyData).forEach(([key,entry])=>{
      if(!key.startsWith(`${cid}-`)) return;
      // 순수 미션(todo)만 카운트 — 숙제는 getCompletedHomeworkCount에서 별도 집계
      count+=(entry.todos||[]).filter(t=>t.done).length;
    });
    return count;
  };

  // 전체 활동(숙제+미션) 누적 — 미션 계열 업적/상장 진척용 (운영 패턴과 무관하게 고르게 적립)
  const getTotalActivityCount=(cid)=>getCompletedHomeworkCount(cid)+getCompletedQuestCount(cid);

  const getApprovedRewardCount=(cid)=>getChildRewardRequests(cid).filter(r=>r.status==="approved").length;

  const hasApprovedReward=(cid)=>getChildRewardRequests(cid).some(r=>r.status==="approved");

  const getQuestItemsOnDateForStreak=(cid,date)=>getQuestItemsForDate(cid,date);

  const isQuestSuccessDay=(cid,date)=>{
    const items=getQuestItemsOnDateForStreak(cid,date);
    if(items.length===0) return false;
    if(items.some(item=>item.failed)) return false;
    if(items.some(item=>!item.done)) return false;
    return true;
  };

  const getQuestStreak=(cid)=>{
    let streak=0;
    let date=TODAY;
    while(isQuestSuccessDay(cid,date)){
      streak+=1;
      date=addDays(date,-1);
    }
    return streak;
  };

  const getBestStreak=(cid)=>{
    return Math.max(Number(bestStreakData[cid]||0),Number(getQuestStreak(cid)||0));
  };

  useEffect(()=>{
    if(!loaded||!childId) return;
    const currentStreak=getQuestStreak(childId);
    setBestStreakData(prev=>{
      const best=Number(prev[childId]||0);
      if(currentStreak<=best) return prev;
      return {...prev,[childId]:currentStreak};
    });
  },[loaded,childId,dailyData]);

  useEffect(()=>{
    if(!loaded||!childId||appMode!=="child") return;
    const unlocked=getUnlockedTitles(childId);
    const seen=seenTitles[childId]||[];
    const newlyUnlocked=unlocked.find(t=>!seen.includes(t.id)&&t.id!=="rookie");
    if(newlyUnlocked){
      setSeenTitles(prev=>({...prev,[childId]:[...(prev[childId]||[]),newlyUnlocked.id]}));
      setEarnedTitleIds(prev=>{
        const cur=prev[childId]||[];
        if(cur.includes(newlyUnlocked.id)) return prev;
        return {...prev,[childId]:[...cur,newlyUnlocked.id]};
      });
      const tReward=giveTitleReward(childId,newlyUnlocked);
      showGameEvent({type:"title",cert:true,emoji:newlyUnlocked.emoji||"🏆",title:"상장을 받았어요!",name:newlyUnlocked.name,desc:newlyUnlocked.award||newlyUnlocked.condition||"새로운 상장을 받았어요!",rarity:newlyUnlocked.rarity||"common",reward:`${TM.xpEmoji} +${tReward.xp} ${TM.xp} · ${TM.coinEmoji} +${tReward.coin} ${TM.coin}`});
    }
  },[scoreData,dailyData,rewardRequests,selectedTitles,specialTitles,childId,loaded,appMode]);

  // 이벤트 큐 처리 - 하나씩 순서대로 표시
  useEffect(()=>{
    if(eventModal) return;
    if(eventQueue.length===0) return;
    const nextEvent=eventQueue[0];
    setEventModal(nextEvent);
    setEventQueue(prev=>prev.slice(1));
  },[eventQueue,eventModal]);

  // 첫 미션 안내창 - 다른 모달(미션결과·레벨업·보물·이벤트)이 모두 닫힌 뒤 1회 표시
  useEffect(()=>{
    if(!firstTipPending) return;
    if(eventModal||eventQueue.length>0) return;
    if(questResultModal||treasureModal||levelUpModal) return;
    const t=setTimeout(()=>{
      setFirstTipPending(false);
      setFirstTipSeen(true);
      save("v6_first_mission_tip_seen","1");
      setShowFirstMissionTip(true);
    },400);
    return ()=>clearTimeout(t);
  },[firstTipPending,eventModal,eventQueue,questResultModal,treasureModal,levelUpModal]);

  const getChildLevel=(cid)=>{
    const score=getChildXP(cid);
    const lv=[...DEFAULT_LEVELS].sort((a,b)=>b.minScore-a.minScore).find(lv=>score>=lv.minScore)||DEFAULT_LEVELS[0];
    return levelView(lv,kidSkin,children.find(c=>c.id===cid)?.gender);
  };
  const getNextLevel=(cid)=>{
    const score=getChildXP(cid);
    const lv=[...DEFAULT_LEVELS].sort((a,b)=>a.minScore-b.minScore).find(lv=>score<lv.minScore)||null;
    return levelView(lv,kidSkin,children.find(c=>c.id===cid)?.gender);
  };
  const getLevelProgress=(cid)=>{
    const score=getChildXP(cid);
    const current=getChildLevel(cid);
    const next=getNextLevel(cid);
    if(!next) return 100;
    const range=next.minScore-current.minScore;
    const gained=score-current.minScore;
    return Math.min(100,Math.max(0,Math.round((gained/range)*100)));
  };

  const getChildRewards=()=>rewardData["shared"]||DEFAULT_REWARDS;

  const getCharacterEvolution=(cid)=>{
    const level=getChildLevel(cid).level;
    if(kidSkin==="cute"){
      // 베이커리 전용 구간: 1-6 / 7-11 / 12-16 / 17~
      const bIdx=[...BAKERY_EVOLUTIONS].map((e,i)=>({...e,i})).reverse().find(e=>level>=e.minLevel)?.i ?? 0;
      // 던전 성장체 객체(badge 등) 위에 베이커리 외형을 덮어씌움
      const baseEvo=CHARACTER_EVOLUTIONS[Math.min(bIdx,CHARACTER_EVOLUTIONS.length-1)];
      return evoView(baseEvo,bIdx,kidSkin);
    }
    const evo=[...CHARACTER_EVOLUTIONS].sort((a,b)=>b.minLevel-a.minLevel).find(e=>level>=e.minLevel)||CHARACTER_EVOLUTIONS[0];
    const idx=CHARACTER_EVOLUTIONS.findIndex(e=>e.minLevel===evo.minLevel);
    return evoView(evo,idx<0?0:idx,kidSkin);
  };
  // 최종 성장체(마지막 단계) 도달 여부 — 캐릭터 스킨 잠금 해제 기준
  const isMaxEvolution=(cid)=>{
    const level=getChildLevel(cid).level;
    const evos=kidSkin==="cute"?BAKERY_EVOLUTIONS:CHARACTER_EVOLUTIONS;
    const maxMin=Math.max(...evos.map(e=>e.minLevel));
    return level>=maxMin;
  };
  // 펫 최종 진화(마지막 단계) 도달 여부 — 펫 스킨 잠금 해제 기준
  const isMaxPet=(cid)=>getPetStage(cid)>=PET_STAGES.length-1;
  const getCharacterAvatar=(cid,hatEquipped=false)=>{
    const child=children.find(c=>c.id===cid);
    const gender=child?.gender||"boy";
    // 캐릭터 스킨 장착 시 성장체 대신 스킨으로 표시(완성형). 최종 성장체 도달했을 때만 유효.
    const eqSkin=getEquipped(cid,"skin");
    if(eqSkin&&isMaxEvolution(cid)) return eqSkin.emoji;
    const evo=getCharacterEvolution(cid);
    let av=evo.avatar?.[gender]||evo.avatar?.boy||"🧒";
    // 셰프 모자를 이미 쓴 요리사 이모지는 모자와 겹치므로, 모자 착용 시 맨머리로 교체
    if(hatEquipped&&(av==="👨‍🍳"||av==="👩‍🍳"||av==="🧑‍🍳")){
      av = gender==="girl" ? "👩" : "🧑";
    }
    return av;
  };

  const getChildRewardRequests=(cid)=>rewardRequests[cid]||[];
  const hasPendingRewardRequest=(cid,rewardId)=>getChildRewardRequests(cid).some(r=>r.rewardId===rewardId&&r.status==="pending");

  const requestReward=(reward)=>{
    const coin=getChildCoin(childId);
    if(coin<reward.point){ showToast(`보유 ${TM.coin}이 부족해요 ${TM.coinEmoji}`); return; }
    if(hasPendingRewardRequest(childId,reward.id)){ showToast("이미 요청한 보상이에요"); return; }
    const newRequest={id:Date.now(),rewardId:reward.id,title:reward.title,point:reward.point,emoji:reward.emoji,status:"pending",requestedAt:new Date().toISOString()};
    setRewardRequests(prev=>({...prev,[childId]:[...getChildRewardRequests(childId),newRequest]}));
    showToast("엄마한테 말했어요 🛒");
  };
  const approveRewardRequest=(requestId)=>{
    const request=getChildRewardRequests(childId).find(r=>r.id===requestId);
    if(!request) return;
    if(getChildCoin(childId)<request.point){ showToast(`보유 ${TM.coin}이 부족해서 승인할 수 없어요`); return; }
    spendCoin(childId,request.point,`${request.title} 구매 승인`);
    setRewardRequests(prev=>({...prev,[childId]:getChildRewardRequests(childId).map(r=>r.id===requestId?{...r,status:"approved",approvedAt:new Date().toISOString()}:r)}));
    showToast("구매 승인 완료! 🎉");
  };
  const rejectRewardRequest=(requestId)=>{
    setRewardRequests(prev=>({...prev,[childId]:getChildRewardRequests(childId).map(r=>r.id===requestId?{...r,status:"rejected",rejectedAt:new Date().toISOString()}:r)}));
    showToast("요청을 거절했어요");
  };
  const deleteRewardRequest=(requestId)=>{
    setRewardRequests(prev=>({...prev,[childId]:getChildRewardRequests(childId).filter(r=>r.id!==requestId)}));
    showToast("요청 기록 삭제됨");
  };
  const openEditReward=(reward)=>{
    setEditingRewardId(reward.id);
    setRewardForm({title:reward.title,point:reward.point,emoji:reward.emoji||"🎁",grade:reward.grade||"common"});
    setShowRewardModal(true);
  };
  const addRewardItem=()=>{
    if(!rewardForm.title.trim()){ showToast("보상 이름을 입력해줘"); return; }
    const rewardPayload={title:rewardForm.title.trim(),point:Number(rewardForm.point||0),emoji:rewardForm.emoji||"🎁",grade:rewardForm.grade||"common"};
    if(editingRewardId){
      setRewardData(prev=>({...prev,shared:getChildRewards().map(r=>r.id===editingRewardId?{...r,...rewardPayload}:r)}));
      showToast("보상이 수정됐어요 ✏️");
    } else {
      setRewardData(prev=>({...prev,shared:[...getChildRewards(),{id:Date.now(),...rewardPayload}]}));
      showToast("보상이 추가됐어요 🎁");
    }
    setRewardForm({title:"",point:300,emoji:"🎁",grade:"common"});
    setEditingRewardId(null);
    setShowRewardModal(false);
  };
  const deleteReward=(rewardId)=>{
    setRewardData(prev=>({...prev,shared:getChildRewards().filter(r=>r.id!==rewardId)}));
    showToast("보상이 삭제됐어요");
  };

  const addChildScore=(cid,point,memo="",type="quest")=>{
    const p=Number(point||0);
    let capturedBefore=null;
    let capturedAfter=null;
    setScoreData(prev=>{
      const cur=prev[cid]||{xp:0,coin:0,history:[]};
      const curXp=Number(cur.xp??cur.total??0);
      capturedBefore=curXp;
      capturedAfter=Math.max(0,curXp+p);
      return {...prev,[cid]:{
        ...cur,
        xp:Math.max(0,curXp+p),
        coin:Math.max(0,Number(cur.coin??cur.balance??cur.total??0)+p),
        history:[...(cur.history||[]),{id:Date.now(),point:p,xp:p,coin:p,date:TODAY,type,memo}]
      }};
    });
    // 상태 반영 후, 캡처한 정확한 before/after로 레벨업 판정
    if(p>0){
      setTimeout(()=>{
        if(capturedBefore!==null&&capturedAfter!==null){
          checkLevelUp(cid,capturedBefore,capturedAfter);
        }
      },50);
    }
  };

  const spendChildScore=(cid,amount,memo="보상샵 구매 승인")=>{
    setScoreData(prev=>{
      const cur=prev[cid]||{xp:0,coin:0,history:[]};
      const cost=Number(amount||0);
      return {...prev,[cid]:{
        ...cur,
        xp:Number(cur.xp??cur.total??0),
        coin:Math.max(0,Number(cur.coin??cur.balance??cur.total??0)-cost),
        history:[...(cur.history||[]),{id:Date.now(),point:-cost,xp:0,coin:-cost,date:TODAY,type:"reward",memo}]
      }};
    });
  };

  // addReward = XP/코인 지급 (미션/보물상자용)
  const addReward=(cid,point,reason="quest")=>addChildScore(cid,point,"",reason);
  // spendCoin = 코인만 차감 (구매용)
  const spendCoin=(cid,amount,memo="")=>spendChildScore(cid,amount,memo);
  const toggleHomeworkDone=(cid,academyId,date,homeworkId)=>{
    const entry=getDailyEntry(cid,academyId,date);
    const homeworks=entry.homeworks||[];
    const target=homeworks.find(h=>h.id===homeworkId);
    if(!target) return;
    const nextDone=!target.done;
    const point=target.point||DEFAULT_HOMEWORK_SCORE;
    const acName=(academies[cid]||[]).find(a=>a.id===academyId)?.name||"학원";
    const isFirstEver=appMode==="child"&&nextDone&&!firstTipSeen;
    setDailyEntry(cid,academyId,date,{...entry,homeworks:homeworks.map(h=>h.id===homeworkId?{...h,done:nextDone,failed:false}:h)});
    addReward(cid,nextDone?point:-point,"homework");
    if(nextDone){
      if(isFirstEver) setFirstTipPending(true);
      giveTreasureForQuestOnce(
        cid,
        getQuestTreasureKey("homework",academyId,date,homeworkId)
      );
      showQuestResult({type:"clear",xp:point,title:target.text});
      if(appMode==="child") cheerCharacter(point);
    } else {
      showToast(`체크 취소 -${point} ${TM.xp} / -${point} ${TM.coin}`);
    }
  };

  const toggleTodoDone=(cid,academyId,date,todoId)=>{
    const entry=getDailyEntry(cid,academyId,date);
    const todos=entry.todos||[];
    const target=todos.find(t=>t.id===todoId);
    if(!target) return;
    const nextDone=!target.done;
    const point=target.point||DEFAULT_HOMEWORK_SCORE;
    const acName=(academies[cid]||[]).find(a=>a.id===academyId)?.name||(academyId===EXTRA_QUEST_ID?"기타":"학원");
    const isFirstEver=appMode==="child"&&nextDone&&!firstTipSeen;
    setDailyEntry(cid,academyId,date,{...entry,todos:todos.map(t=>t.id===todoId?{...t,done:nextDone,failed:false}:t)});
    addReward(cid,nextDone?point:-point,"todo");
    if(nextDone){
      if(isFirstEver) setFirstTipPending(true);
      giveTreasureForQuestOnce(
        cid,
        getQuestTreasureKey("todo",academyId,date,todoId)
      );
      showQuestResult({type:"clear",xp:point,title:target.text});
      if(appMode==="child") cheerCharacter(point);
    } else {
      showToast(`체크 취소 -${point} ${TM.xp} / -${point} ${TM.coin}`);
    }
  };

  const failHomeworkQuest=(cid,academyId,date,homeworkId)=>{
    const entry=getDailyEntry(cid,academyId,date);
    const homeworks=entry.homeworks||[];
    const target=homeworks.find(h=>h.id===homeworkId);
    const willFail=target?!target.failed:true;
    setDailyEntry(cid,academyId,date,{...entry,homeworks:homeworks.map(h=>h.id===homeworkId?{...h,done:false,failed:!h.failed}:h)});
    if(willFail){
      showQuestResult({type:"failed",xp:0,title:target?.text||"미션"});
    } else {
      showToast("실패 취소");
    }
  };

  const failTodoQuest=(cid,academyId,date,todoId)=>{
    const entry=getDailyEntry(cid,academyId,date);
    const todos=entry.todos||[];
    const target=todos.find(t=>t.id===todoId);
    const willFail=target?!target.failed:true;
    setDailyEntry(cid,academyId,date,{...entry,todos:todos.map(t=>t.id===todoId?{...t,done:false,failed:!t.failed}:t)});
    if(willFail){
      showQuestResult({type:"failed",xp:0,title:target?.text||"미션"});
    } else {
      showToast("실패 취소");
    }
  };

  const pendingHwTotal=()=>{
    let n=0;
    Object.entries(dailyData).forEach(([k,e])=>{ if(k.startsWith(childId+"-")) n+=(e.homeworks||[]).filter(h=>!h.done).length; });
    return n;
  };
  const pendingAbsCnt=curAbs.filter(a=>a.makeupDate&&!a.makeupDone).length;
  const todayAc=curAc.filter(a=>hasClassOnDay(a,todayDN())).sort((a,b)=>getClassTime(a,todayDN()).localeCompare(getClassTime(b,todayDN())));

  // 학원 CRUD
  const getNextAcademyColor=()=>{
    const used=(curAc||[]).map(a=>(a.color||"").toUpperCase());
    const unused=PALETTE.find(c=>!used.includes(c.toUpperCase()));
    return unused||PALETTE[(curAc||[]).length%PALETTE.length];
  };
  const openAdd=()=>{ setEditTarget(null); setNewAc({...EMPTY_AC,color:getNextAcademyColor(),baseSupplies:[],baseHomeworks:[]}); setSupplyInput(""); setBaseHwInput(""); setShowAcMore(false); setShowAddAcModal(true); };
  const openEdit=(ac)=>{ setEditTarget(ac.id); setNewAc({...ac,baseSupplies:[...(ac.baseSupplies||[])],baseHomeworks:[...(ac.baseHomeworks||[])],schedules:[...(ac.schedules||[])],days:[...(ac.days||[])]}); setSupplyInput(""); setBaseHwInput(""); setShowAcMore(!!(ac.fee||ac.teacher||ac.phone||ac.address||(ac.baseSupplies||[]).length||(ac.baseHomeworks||[]).length||ac.shuttleInfo||ac.memo)); setShowDetailModal(null); setShowAddAcModal(true); };
  const saveAcademy=()=>{
    if(!newAc.name.trim()||(newAc.useCustomSchedule?(newAc.schedules||[]).length===0:(newAc.days||[]).length===0)){
      showToast("학원명과 수업 요일을 입력해줘"); return;
    }
    const cleaned={...newAc,name:newAc.name.trim(),fee:Number(newAc.fee||0),duration:Number(newAc.duration||0),payDay:Number(newAc.payDay||1),baseSupplies:newAc.baseSupplies||[],baseHomeworks:newAc.baseHomeworks||[],schedules:newAc.schedules||[]};
    setAcademies(prev=>{
      const list=prev[childId]||[];
      return editTarget!==null
        ? {...prev,[childId]:list.map(a=>a.id===editTarget?{...cleaned,id:editTarget}:a)}
        : {...prev,[childId]:[...list,{...cleaned,id:Date.now()}]};
    });
    setShowAddAcModal(false); setEditTarget(null); setNewAc({...EMPTY_AC,baseSupplies:[],baseHomeworks:[]});
    showToast(editTarget?"수정됨 ✓":"추가됨 ✓");
  };
  const deleteAcademy=(id)=>{
    // 학원 삭제
    setAcademies(p=>({...p,[childId]:(p[childId]||[]).filter(a=>a.id!==id)}));
    // 해당 학원 결석 기록 삭제
    setAbsences(p=>({...p,[childId]:(p[childId]||[]).filter(a=>Number(a.academyId)!==id)}));
    // 해당 학원 날짜별 숙제/준비물 삭제
    setDailyData(p=>{
      const next={...p};
      Object.keys(next).forEach(k=>{ if(k.startsWith(`${childId}-${id}-`)) delete next[k]; });
      return next;
    });
    // 해당 학원 방학 데이터 삭제
    setVacations(p=>{ const next={...p}; delete next[vacKey(childId,id)]; return next; });
    setShowDetailModal(null); showToast("삭제됨");
  };
  const toggleDay=(day)=>setNewAc(p=>({...p,days:p.days.includes(day)?p.days.filter(d=>d!==day):[...p.days,day]}));
  const addBaseSupply=()=>{ const v=supplyInput.trim(); if(!v) return; setNewAc(p=>({...p,baseSupplies:[...(p.baseSupplies||[]),v]})); setSupplyInput(""); };
  const addBaseHomework=()=>{ const v=baseHwInput.trim(); if(!v) return; setNewAc(p=>({...p,baseHomeworks:[...(p.baseHomeworks||[]),v]})); setBaseHwInput(""); };
  const removeBaseHomework=(i)=>setNewAc(p=>({...p,baseHomeworks:(p.baseHomeworks||[]).filter((_,idx)=>idx!==i)}));

  // 학원비
  const pKey=(cid,aId)=>`${cid}-${feeMonth}-${aId}`;
  const isPaid=(aId)=>!!paidStatus[pKey(childId,aId)];
  const togglePaid=(aId)=>{ const k=pKey(childId,aId); setPaidStatus(p=>({...p,[k]:!p[k]})); };
  const payStatus=(a)=>{
    const now=new Date(), d=new Date(now.getFullYear(),feeMonth-1,a.payDay);
    const diff=Math.ceil((d-now)/86400000);
    if(isPaid(a.id)) return {label:"납부완료",color:C.green};
    if(diff<0) return {label:`${Math.abs(diff)}일 초과`,color:C.red};
    if(diff===0) return {label:"오늘!",color:C.orange};
    if(diff<=3) return {label:`D-${diff}`,color:C.orange};
    return {label:`D-${diff}`,color:C.sub};
  };

  // 결석
  const addAbs=()=>{
    if(!newAbs.academyId||!newAbs.date){ showToast("학원과 결석일을 선택해줘"); return; }
    setAbsences(p=>({...p,[childId]:[...(p[childId]||[]),{...newAbs,id:Date.now()}]}));
    setNewAbs({...EMPTY_ABS}); setShowAbsModal(false); showToast();
  };
  const deleteAbs=(id)=>setAbsences(p=>({...p,[childId]:(p[childId]||[]).filter(a=>a.id!==id)}));
  const toggleMakeup=(id)=>setAbsences(p=>({...p,[childId]:(p[childId]||[]).map(a=>a.id===id?{...a,makeupDone:!a.makeupDone}:a)}));

  // 문자
  const applyTmpl=(tmpl,ac)=>setSmsDraft(tmpl.body.replace(/{아이이름}/g,curChild?.name||"").replace(/{학원명}/g,ac.name).replace(/{날짜}/g,fmt(TODAY)).replace(/{시간}/g,getClassTime(ac,todayDN())||getSchedules(ac)[0]?.time||""));
  const saveTmpl=()=>{
    if(!editTmpl.title.trim()||!editTmpl.body.trim()){ showToast("제목과 내용을 입력해줘"); return; }
    setTemplates(p=>showTmplEdit==="new"?[...p,{...editTmpl,id:Date.now()}]:p.map(t=>t.id===showTmplEdit?{...editTmpl,id:t.id}:t));
    setShowTmplEdit(null); showToast();
  };

  // 방학 관련
  const vacKey=(cid,aId)=>`${cid}-${aId}`;
  const getVacations=(cid,aId)=>vacations[vacKey(cid,aId)]||[];
  const isVacationDay=(cid,aId,dateStr)=>getVacations(cid,aId).some(v=>v.start<=dateStr&&dateStr<=v.end);
  const addVacation=()=>{
    if(!vacForm.academyId||!vacForm.start||!vacForm.end){ showToast("학원과 기간을 입력해줘"); return; }
    if(vacForm.start>vacForm.end){ showToast("시작일이 종료일보다 늦어요"); return; }
    const k=vacKey(childId,Number(vacForm.academyId));
    setVacations(p=>({...p,[k]:[...(p[k]||[]),{id:Date.now(),start:vacForm.start,end:vacForm.end}]}));
    setVacForm({academyId:"",start:"",end:""});
    setShowVacModal(null); showToast("방학 등록됨 🏖️");
  };
  const deleteVacation=(aId,vacId)=>{
    const k=vacKey(childId,aId);
    setVacations(p=>({...p,[k]:(p[k]||[]).filter(v=>v.id!==vacId)}));
    showToast("삭제됨");
  };

  const mKey=(cid,y,m,d)=>`${cid}-${y}-${m}-${d}`;
  const calDays=getCalDays(calDate.getFullYear(),calDate.getMonth());

  // 공통 스타일
  const inp={ width:"100%",boxSizing:"border-box",background:CT.faint,border:`1px solid ${CT.faintB}`,borderRadius:10,padding:"12px 14px",color:C.text,fontSize:17,outline:"none",fontFamily:"inherit" };
  const lbl={ fontSize:17,color:C.sub,display:"block",marginBottom:7,fontWeight:700 };
  const gamePrimaryButton={width:"100%",padding:"12px",borderRadius:13,border:"none",background:`linear-gradient(135deg, ${GP.gold}, ${GP.neon})`,color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:`0 4px 14px ${GP.neon}30`};
  const gameGhostButton={padding:"8px 11px",borderRadius:11,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:12,fontWeight:900,cursor:"pointer"};
  const devBtn=(bg)=>({width:"100%",border:"none",borderRadius:12,padding:"13px",background:bg,color:"#fff",fontSize:14,fontWeight:900,cursor:"pointer"});
  const devMiniBtn=(bg)=>({border:"none",borderRadius:10,padding:"10px 8px",background:bg,color:"#fff",fontSize:13,fontWeight:900,cursor:"pointer"});
  const devGroup={background:CT.faint,border:`1px solid ${C.border}`,borderRadius:14,padding:"13px"};
  const devGroupTitle={fontSize:13,fontWeight:900,color:C.text,margin:"0 0 9px"};
  const openCloseLabel=(open)=>open?"닫기 ▲":"열기 ▼";
  const openClosePill=(open)=>({fontSize:12,fontWeight:900,color:th.main,background:th.light,padding:"6px 9px",borderRadius:14,whiteSpace:"nowrap",flexShrink:0});
  const parentInnerCard={background:CT.faint,border:`1px solid ${C.border}`,borderRadius:14,padding:"13px"};
  const parentInnerTitle={fontSize:15,fontWeight:900,color:C.text,margin:"0 0 4px"};
  const parentInnerSub={fontSize:12,fontWeight:700,color:C.sub,margin:0,lineHeight:1.45};

  if(!loaded) return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
      <div style={{fontSize:48}}>🎒</div>
      <p style={{color:C.sub,fontSize:17,marginTop:12}}>불러오는 중...</p>
    </div>
  );

  if(showOnboarding) return <OnboardingFlow onFinish={finishOnboarding} />;

  if(appMode==="child") {
    const childDt=new Date(childDate+"T00:00:00");
    const childTodayDN=["일","월","화","수","목","금","토"][childDt.getDay()];
    const isChildToday=childDate===TODAY;
    const childTodayAc=curAc
      .filter(a=>hasClassOnDay(a,childTodayDN)&&!isVacationDay(childId,a.id,childDate))
      .sort((a,b)=>getClassTime(a,childTodayDN).localeCompare(getClassTime(b,childTodayDN)));
    // 캐릭터 상태창 (HUD) — '내 캐릭터' 탭 안에서 사용
    const childHud=(()=>{
            const level=getChildLevel(childId);
            const evo=getCharacterEvolution(childId);
            const nextLevel=getNextLevel(childId);
            const progress=getLevelProgressInfo(childId);
            const title=getSelectedTitle(childId);
            const coin=getChildCoin(childId);
            const xp=getChildXP(childId);
            const treasureCount=getTotalTreasureCount(childId);
            return (
              <>
              <div style={kidSkin==="cute"
                ?{position:"relative",overflow:"hidden",background:`linear-gradient(160deg, ${mixWhite(th.main,0.55)}, ${mixWhite(th.main,0.32)})`,borderRadius:34,padding:"16px",boxShadow:`0 14px 30px ${th.main}3a, inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -8px 18px ${th.main}22`,color:GP.boxText,border:"2px solid #fff",marginBottom:12,animation:"jellyIn .5s cubic-bezier(.34,1.56,.64,1) both"}
                :{position:"relative",overflow:"hidden",background:dungeonShinyBg,borderRadius:GP.radCard,padding:"16px",boxShadow:`0 10px 28px ${GP.boxShadowCol}, inset 0 1px 0 rgba(255,255,255,0.08)`,color:GP.boxText,border:`1px solid ${th.main}55`,marginBottom:12}}>
                {kidSkin==="cute"&&<div style={{position:"absolute",top:0,left:0,right:0,height:"42%",background:"linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0))",borderRadius:"34px 34px 50% 50%",pointerEvents:"none"}}/>}
                <DungeonCardGlow/>
                {/* 레벨 + 상장 + 아바타 */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:kidSkin==="cute"?"center":"flex-start",marginBottom:14,position:"relative",zIndex:1}}>
                  <div style={{minWidth:0,flex:1,paddingRight:10}}>
                    {kidSkin==="cute"
                      ?<>
                        <p style={{fontSize:14,fontWeight:900,margin:"0 0 2px",color:GP.boxSub,letterSpacing:0.3}}>{level.emoji} Lv.{level.level}</p>
                        <p style={{fontSize:20,fontWeight:900,margin:"0 0 8px",color:GP.boxText,lineHeight:1.2,wordBreak:"keep-all"}}>{level.name}</p>
                      </>
                      :<>
                        <p style={{fontSize:11,fontWeight:900,letterSpacing:1.3,opacity:0.72,margin:"0 0 4px",color:GP.boxSub}}>{T.heroStatus}</p>
                        <p style={{fontSize:20,fontWeight:900,margin:"0 0 5px",color:GP.boxText}}>{level.emoji} Lv.{level.level} {level.name}</p>
                      </>}
                    <p style={{display:"inline-block",...jellyChip({background:GP.chipBg,border:`1px solid ${GP.chipBorder}`,borderRadius:20},{radius:20}),fontSize:13,fontWeight:900,color:kidSkin==="cute"?GP.dark2:GP.boxText,padding:"4px 10px",margin:0,maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {title.emoji} {title.name}
                    </p>
                  </div>
                  <div style={{display:"flex",alignItems:"flex-end",gap:6,flexShrink:0,marginRight:kidSkin==="cute"?2:6,marginTop:kidSkin==="cute"?0:8}}>
                    <div style={{position:"relative",width:66,height:66,borderRadius:20,background:evo.bg,border:`1.5px solid ${GP.chipBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,boxShadow:"0 6px 18px rgba(0,0,0,0.16)"}}>
                      <span style={{display:"block",transform:"translateY(1px)",lineHeight:1}}>{getCharacterAvatar(childId)}</span>
                      <span style={{position:"absolute",right:-6,bottom:-6,width:30,height:30,borderRadius:"50%",background:"#fff",border:`2px solid ${GP.gold}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:"0 3px 8px rgba(0,0,0,0.18)"}}>{level.emoji}</span>
                    </div>
                    {(()=>{
                      const pet=getPet(childId);
                      return (
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,marginBottom:2}} title={pet.name}>
                          <div style={{width:36,height:36,borderRadius:14,background:GP.chipBg,border:`1.5px solid ${GP.chipBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{pet.emoji}</div>
                          <span style={{fontSize:11.5,fontWeight:800,opacity:0.7}}>펫</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                {/* 코인/쿠키 + XP/경험치 (가장 중요) */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14,marginBottom:6,position:"relative",zIndex:1}}>
                  <div style={{background:kidSkin==="cute"?"linear-gradient(160deg, #ffffff, rgba(255,255,255,0.8))":(GP.innerBg||GP.chipBg),border:kidSkin==="cute"?"2px solid #fff":`1px solid ${GP.innerBorder||GP.chipBorder}`,borderRadius:kidSkin==="cute"?16:14,padding:"8px 11px",display:"flex",alignItems:"center",gap:8,position:"relative",zIndex:1,boxShadow:kidSkin==="cute"?`0 5px 13px ${th.main}28, inset 0 1.5px 3px rgba(255,255,255,0.95)`:"none"}}>
                    <span style={{fontSize:20}}>{TM.coinEmoji}</span>
                    <div style={{minWidth:0}}>
                      <p style={{fontSize:11,fontWeight:800,opacity:0.7,margin:0,letterSpacing:0.5}}>보유 {TM.coin}</p>
                      <p style={{fontSize:17,fontWeight:900,margin:"1px 0 0",lineHeight:1}}>{coin}</p>
                    </div>
                  </div>
                  <div style={{background:kidSkin==="cute"?"linear-gradient(160deg, #ffffff, rgba(255,255,255,0.8))":(GP.innerBg||GP.chipBg),border:kidSkin==="cute"?"2px solid #fff":`1px solid ${GP.innerBorder||GP.chipBorder}`,borderRadius:kidSkin==="cute"?16:14,padding:"8px 11px",display:"flex",alignItems:"center",gap:8,position:"relative",zIndex:1,boxShadow:kidSkin==="cute"?`0 5px 13px ${th.main}28, inset 0 1.5px 3px rgba(255,255,255,0.95)`:"none"}}>
                    <span style={{fontSize:20}}>{TM.xpEmoji}</span>
                    <div style={{minWidth:0}}>
                      <p style={{fontSize:11,fontWeight:800,opacity:0.7,margin:0,letterSpacing:0.5}}>누적 {TM.xp}</p>
                      <p style={{fontSize:17,fontWeight:900,margin:"1px 0 0",lineHeight:1}}>{xp}</p>
                    </div>
                  </div>
                </div>
                {/* NEXT LEVEL 진행바 */}
                <div>
                  <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",marginBottom:6}}>
                    <span style={{fontSize:11,fontWeight:900,opacity:0.86}}>{nextLevel?`${progress.currentXp}/${progress.needXp}`:"MAX LEVEL"}</span>
                  </div>
                  <JellyBar percent={progress.percent} height={14} />
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:6,fontSize:11.5,fontWeight:800,opacity:0.88}}>
                    <span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nextLevel?<>다음 레벨 : {nextLevel.emoji} Lv.{nextLevel.level} {nextLevel.name}</>:"🏆 최고 레벨 달성!"}</span>
                    <span style={{opacity:0.78,flexShrink:0}}>{nextLevel?`${progress.remainXp} ${TM.xp} 남음`:""}</span>
                  </div>
                </div>
              </div>
              {/* 나머지 정보 - 칸 밖 */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
                {[
                  {icon:TM.boxEmoji,label:TM.box,value:treasureCount},
                  {icon:"👑",label:"상장",value:`${getUnlockedTitles(childId).length}개`},
                  {icon:"🏆",label:"연속달성 최고기록",value:`${getBestStreak(childId)}일`},
                ].map((s,i)=>(
                  <div key={i} style={{...jellyChip({background:GP.innerBg||`${th.main}2E`,border:`1.5px solid ${GP.innerBorder||th.main+"59"}`,borderRadius:14}),padding:"10px 5px",textAlign:"center"}}>
                    <p style={{fontSize:17,margin:0}}>{s.icon}</p>
                    <p style={{fontSize:15,fontWeight:900,margin:"2px 0 0",color:GP.innerText||th.main}}>{s.value}</p>
                    <p style={{fontSize:11,fontWeight:800,color:GP.innerText?GP.boxSub:C.sub,margin:"1px 0 0",lineHeight:1.25}}>{s.label}</p>
                  </div>
                ))}
              </div>
              </>
            );
    })();
    return (
      <div style={{fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",background:GP.appPattern?`${GP.appPattern}, ${GP.appBg}`:(GP.appBg||(kidSkin==="cute"?`linear-gradient(180deg, ${mixWhite(th.main,0.86)} 0%, ${C.bg} 38%, ${C.bg} 100%)`:`radial-gradient(120% 55% at 50% 0%, ${th.main}3a 0%, transparent 52%), radial-gradient(100% 45% at 100% 26%, ${th.main}22 0%, transparent 55%), radial-gradient(100% 45% at 0% 74%, ${th.main}1e 0%, transparent 55%), linear-gradient(180deg, ${dungeonTone(th.main,4)} 0%, ${dungeonTone(th.main,0)} 50%, ${dungeonTone(th.main,10)} 100%)`)),backgroundSize:GP.appPattern?`${GP.appPatternSize}, ${GP.appPatternSize}, cover`:"auto",backgroundPosition:GP.appPattern?`${GP.appPatternPos}, 0 0`:"0 0",minHeight:"100vh",maxWidth:430,margin:"0 auto",color:C.text,paddingBottom:30,position:"relative",overflow:"hidden"}}>
        {/* 말랑한 배경 블롭 */}
        <div style={{position:"absolute",top:-40,right:-50,width:170,height:170,borderRadius:"50%",background:`radial-gradient(circle at 35% 35%, ${th.main}26, transparent 70%)`,filter:"blur(6px)",animation:"blobShift 11s ease-in-out infinite",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"absolute",top:240,left:-60,width:150,height:150,borderRadius:"50%",background:`radial-gradient(circle at 50% 50%, ${GP.gold}24, transparent 70%)`,filter:"blur(6px)",animation:"blobShift 14s ease-in-out infinite 1.5s",pointerEvents:"none",zIndex:0}}/>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet"/>
        <style dangerouslySetInnerHTML={{__html:`
          @keyframes boxBounce{0%{transform:scale(1) rotate(-3deg)}40%{transform:scale(1.18) rotate(3deg)}70%{transform:scale(1.08) rotate(-2deg)}100%{transform:scale(1) rotate(0deg)}}
          @keyframes shimmer{0%,100%{opacity:0.6}50%{opacity:1}}
          @keyframes gamePop{0%{transform:scale(.65);opacity:0}65%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}
          @keyframes sparkleFloat{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-36px) scale(1.25);opacity:0}}
          @keyframes shineMove{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}
          /* ── 말랑(젤리) 모션 ── */
          @keyframes jellyIn{0%{transform:scale(0.5);opacity:0}55%{transform:scale(1.15)}75%{transform:scale(0.94)}100%{transform:scale(1);opacity:1}}
          @keyframes checkPop{0%{transform:scale(0)}45%{transform:scale(1.45)}68%{transform:scale(0.85)}84%{transform:scale(1.1)}100%{transform:scale(1)}}
          /* ── 미완료 체크 버튼: 맥박 링 + 점선 회전 ── */
          @keyframes checkRing{0%{transform:scale(1);opacity:0.6}70%{transform:scale(1.7);opacity:0}100%{transform:scale(1.7);opacity:0}}
          @keyframes dashSpin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
          @keyframes tapNudge{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
          /* ── 도장 찍기(베이커리) ── */
          @keyframes stampDrop{
            0%{transform:translateY(-22px) scale(2.1) rotate(-14deg);opacity:0}
            55%{transform:translateY(0) scale(0.82) rotate(-8deg);opacity:1}
            70%{transform:translateY(0) scale(1.12) rotate(-11deg)}
            85%{transform:translateY(0) scale(0.96) rotate(-9deg)}
            100%{transform:translateY(0) scale(1) rotate(-10deg);opacity:1}
          }
          @keyframes stampInk{0%{box-shadow:0 0 0 0 rgba(214,69,90,0.5)}100%{box-shadow:0 0 0 14px rgba(214,69,90,0)}}
          @keyframes squishCard{0%{transform:scale(1)}30%{transform:scale(1.04,0.96)}55%{transform:scale(0.97,1.03)}78%{transform:scale(1.01,0.99)}100%{transform:scale(1)}}
          @keyframes burstPop{0%{transform:translate(0,0) scale(0.2);opacity:1}100%{transform:translate(var(--bx),var(--by)) scale(1.1);opacity:0}}
          @keyframes floatBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
          @keyframes floatHero{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
          @keyframes spotGlow{0%,100%{opacity:0.75}50%{opacity:1}}
          @keyframes wiggle{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-7deg)}75%{transform:rotate(7deg)}}
          @keyframes blobShift{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(14px,-12px) scale(1.08)}66%{transform:translate(-10px,10px) scale(0.94)}}
          @keyframes barStripe{0%{background-position:0 0}100%{background-position:28px 0}}
          @keyframes popInUp{0%{transform:translateY(14px) scale(0.96);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}
          @keyframes tabBounce{0%{transform:scale(1)}40%{transform:scale(1.12)}70%{transform:scale(0.96)}100%{transform:scale(1)}}
          /* ── 즉각 피드백 모션 ── */
          @keyframes floatUpFade{0%{transform:translate(-50%,0) scale(0.7);opacity:0}20%{transform:translate(-50%,-10px) scale(1.15);opacity:1}100%{transform:translate(-50%,-58px) scale(1);opacity:0}}
          @keyframes coinPop{0%{transform:translate(-50%,-50%) translate(0,0) scale(0.3) rotate(0deg);opacity:1}100%{transform:translate(-50%,-50%) translate(var(--cx),var(--cy)) scale(1.1) rotate(var(--cr));opacity:0}}
          @keyframes charJump{0%{transform:translateY(0) scale(1)}25%{transform:translateY(-16px) scale(1.12,0.92)}45%{transform:translateY(-22px) scale(0.94,1.08)}65%{transform:translateY(0) scale(1.08,0.92)}82%{transform:translateY(0) scale(0.98,1.02)}100%{transform:translateY(0) scale(1)}}
          @keyframes bubblePop{0%{transform:translateX(-50%) scale(0);opacity:0}20%{transform:translateX(-50%) scale(1.15);opacity:1}80%{transform:translateX(-50%) scale(1);opacity:1}100%{transform:translateX(-50%) scale(0.9);opacity:0}}
          @keyframes bubbleIn{0%{transform:scale(0.3);opacity:0}55%{transform:scale(1.12);opacity:1}75%{transform:scale(0.96)}100%{transform:scale(1);opacity:1}}
          @keyframes bgTintIn{0%{opacity:0}100%{opacity:1}}
          @keyframes metalShine{0%{background-position:0% 50%}100%{background-position:200% 50%}}
          @keyframes rainbowFlow{0%{background-position:0% 50%}100%{background-position:200% 50%}}
          @keyframes gaugeShine{0%{background-position:0 0}100%{background-position:32px 0}}
          @keyframes barPulse{0%,100%{opacity:0.55}50%{opacity:1}}
          @keyframes barStripeMove{0%{background-position:0 0}100%{background-position:24px 0}}
          /* ── 중앙 보상 연출 ── */
          @keyframes cheerTextIn{0%{transform:scale(0.3);opacity:0}40%{transform:scale(1.25);opacity:1}60%{transform:scale(0.92)}80%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}
          @keyframes cheerTextOut{0%{opacity:1}100%{opacity:0;transform:scale(0.9) translateY(-10px)}}
          @keyframes bigCoinBurst{0%{transform:translate(-50%,-50%) scale(0.4);opacity:1}100%{transform:translate(calc(-50% + var(--bcx)),calc(-50% + var(--bcy))) scale(1.2) rotate(var(--bcr));opacity:0}}
          .jelly-tap{transition:transform .12s cubic-bezier(.34,1.56,.64,1)}
          .jelly-tap:active{transform:scale(0.9)}
        `}}/>
        {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:th.main,color:"#fff",padding:"10px 24px",borderRadius:20,fontSize:17,fontWeight:700,zIndex:99999,boxShadow:`0 4px 16px ${th.main}55`}}>{toast}</div>}

        {showKidCoachmark&&(
          <KidCoachmark th={th} skin={kidSkin} onFinish={()=>{ setShowKidCoachmark(false); save("v6_kid_guide_seen","1"); }} />
        )}
        {showModeSelect&&(
          <ModeSelect onPick={(skin)=>{ setKidSkin(skin); setShowModeSelect(false); showToast(skin==="cute"?"🧁 베이커리 게임 시작!":"⚔️ 던전 게임 시작!"); load("v6_kid_guide_seen").then(seen=>{ if(!seen) setTimeout(()=>setShowKidCoachmark(true),350); }); }} />
        )}

        {/* ── 아이용 꾸미기 상점 모달 ── */}
        {showDecorShop&&(()=>{
          const coin=getChildCoin(childId);
          const eq=equippedDecor[childId]||{};
          return (
          <div onClick={()=>setShowDecorShop(false)} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(20,16,28,0.55)",backdropFilter:"blur(3px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,maxHeight:"92vh",overflowY:"auto",background:GP.appBg||C.bg,borderRadius:"28px 28px 0 0",boxShadow:"0 -10px 40px rgba(0,0,0,0.3)",animation:"popInUp .35s ease both"}}>
              {/* 헤더 */}
              <div style={{position:"sticky",top:0,zIndex:2,background:kidSkin==="cute"?`linear-gradient(135deg, ${mixWhite(th.main,0.5)}, ${mixWhite(th.main,0.66)})`:GP.headerBg,padding:"18px 18px 14px",borderRadius:"28px 28px 0 0",color:GP.onDark,boxShadow:`0 4px 16px ${th.main}22`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <p style={{fontSize:19,fontWeight:900,margin:0}}>🛍️ {kidSkin==="cute"?"꾸미기 가게":"꾸미기 상점"}</p>
                  <button onClick={()=>setShowDecorShop(false)} style={{border:"none",background:GP.chipBg,color:GP.chipText,width:34,height:34,borderRadius:"50%",fontSize:18,fontWeight:900,cursor:"pointer"}}>✕</button>
                </div>
                <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:8,background:GP.chipBg,border:`1px solid ${GP.chipBorder}`,borderRadius:14,padding:"5px 12px"}}>
                  <span style={{fontSize:16}}>{TM.coinEmoji}</span>
                  <span style={{fontSize:14,fontWeight:900,color:GP.chipText}}>{coin} {TM.coin}</span>
                </div>
              </div>
              {/* 본문: 카테고리별 */}
              <div style={{padding:"6px 16px 26px"}}>
                {DECOR_GROUPS.map(grp=>{
                  const grpLocked = (grp.lockUntilMaxEvo && !isMaxEvolution(childId)) || (grp.lockUntilMaxPet && !isMaxPet(childId));
                  return (
                  <div key={grp.key} style={{marginTop:18}}>
                    <p style={{fontSize:15,fontWeight:900,margin:"0 0 10px",color:C.text}}>{grp.icon} {grp.label}{grp.key==="skin"&&<span style={{fontSize:11,fontWeight:800,color:C.sub,marginLeft:6}}>Lv.17 부터 해제</span>}{grp.key==="petskin"&&<span style={{fontSize:11,fontWeight:800,color:C.sub,marginLeft:6}}>펫 최종 진화 시 해제</span>}</p>
                    {grpLocked?(
                      <div style={{background:C.faint,border:`1.5px dashed ${C.border}`,borderRadius:18,padding:"22px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                        <span style={{fontSize:30}}>🔒</span>
                        {grp.key==="petskin"?(
                          <>
                            <p style={{fontSize:12.5,fontWeight:900,margin:0,color:C.text,textAlign:"center",lineHeight:1.4}}>{kidSkin==="cute"?"펫이 마지막까지 자라면 열려요!":"펫이 마지막까지 진화하면 열려요!"}</p>
                            <p style={{fontSize:11,fontWeight:700,margin:0,color:C.sub,textAlign:"center"}}>{kidSkin==="cute"?"전설의 유니콘이 되면 특별한 펫으로 바꿀 수 있어요 🐾":"전설의 드래곤이 되면 특별한 펫으로 바꿀 수 있어요 🐾"}</p>
                          </>
                        ):(
                          <>
                            <p style={{fontSize:12.5,fontWeight:900,margin:0,color:C.text,textAlign:"center",lineHeight:1.4}}>{kidSkin==="cute"?"전설의 파티시에가 되면 열려요!":"전설의 수호자가 되면 열려요!"}</p>
                            <p style={{fontSize:11,fontWeight:700,margin:0,color:C.sub,textAlign:"center"}}>Lv.17에 도달하면 특별한 캐릭터로 변신할 수 있어요 ✨</p>
                          </>
                        )}
                      </div>
                    ):(
                    <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                      {grp.items.map(raw=>{
                        const it=decorView(raw,kidSkin);
                        const owned=isDecorOwned(childId,it.id);
                        const equipped=eq[grp.key]===it.id;
                        const price=getDecorPrice(it);
                        const rc=(DECOR_RARITY[it.rarity]||DECOR_RARITY.common).color;
                        const canBuy=coin>=price;
                        return (
                          <div key={it.id} style={{background:C.card,border:`1.5px solid ${equipped?th.main:rc+"44"}`,borderRadius:18,padding:"12px 11px",boxShadow:equipped?`0 6px 18px ${th.main}44`:`0 3px 10px ${rc}1f`,display:"flex",flexDirection:"column",alignItems:"center",gap:6,position:"relative",overflow:"hidden"}}>
                            {(it.rarity==="legendary"||it.rarity==="epic")&&<div style={{position:"absolute",inset:0,background:`radial-gradient(80% 60% at 50% 0%, ${rc}1a, transparent 70%)`,pointerEvents:"none"}}/>}
                            {/* 미리보기 */}
                            <div style={{position:"relative",width:54,height:54,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,
                              background:grp.key==="bg"?`radial-gradient(circle at 50% 40%, ${it.tint||rc+"22"}, ${C.faint})`:(grp.key==="border"?it.grad:C.faint),
                              border:grp.key==="border"?"none":`1px solid ${C.border}`,boxShadow:grp.key==="border"?`0 0 12px ${(kidSkin==="cute"&&it.glowCute)?it.glowCute:it.glow}`:"none"}}>
                              {grp.key==="border"?<span style={{width:38,height:38,borderRadius:11,background:C.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🧒</span>:it.emoji}
                            </div>
                            <p style={{fontSize:12.5,fontWeight:900,margin:0,color:C.text,textAlign:"center",lineHeight:1.25}}>{it.name}</p>
                            <span style={{fontSize:10,fontWeight:900,color:rc,background:`${rc}18`,borderRadius:8,padding:"1px 7px"}}>{DECOR_RARITY[it.rarity]?({common:"일반",rare:"희귀",epic:"영웅",legendary:"전설"}[it.rarity]):"일반"}</span>
                            {/* 액션 버튼 */}
                            {!owned?(
                              <button onClick={()=>buyDecor(raw)} disabled={!canBuy}
                                style={{width:"100%",border:"none",borderRadius:11,padding:"8px",fontSize:12.5,fontWeight:900,cursor:canBuy?"pointer":"not-allowed",
                                  background:canBuy?th.grad:"#E5E7EB",color:canBuy?"#fff":"#9CA3AF",marginTop:2}}>
                                {TM.coinEmoji} {price}
                              </button>
                            ):(
                              <button onClick={()=>toggleEquipDecor(grp.key,it.id)}
                                style={{width:"100%",borderRadius:11,padding:"8px",fontSize:12.5,fontWeight:900,cursor:"pointer",marginTop:2,
                                  border:equipped?`1.5px solid ${th.main}`:`1.5px solid ${th.main}55`,
                                  background:equipped?th.main:`${th.main}12`,color:equipped?"#fff":th.main}}>
                                {equipped?"✓ 착용중":"착용하기"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    )}
                  </div>
                  );
                })}
                <p style={{fontSize:11.5,color:C.sub,textAlign:"center",margin:"20px 0 0",lineHeight:1.5}}>꾸민 모습은 '내 캐릭터' 카드에 바로 나타나요 ✨</p>
              </div>
            </div>
          </div>
          );
        })()}

        {/* 아이용 헤더 - RPG 상태창 */}
        <div style={{position:"relative",zIndex:1,background:kidSkin==="cute"
            ?`radial-gradient(130% 100% at 85% -20%, ${mixWhite(th.main,0.30)}, transparent 60%), ${GP.headerBg}`
            :`radial-gradient(130% 100% at 85% -20%, ${th.main}55, transparent 60%), ${GP.headerBg}`,
          padding:"18px 18px 20px",color:GP.onDark,borderRadius:"0 0 32px 32px",boxShadow:`0 10px 32px ${th.main}33`,overflow:"hidden"}}>
          {/* 헤더 장식 버블 */}
          <div style={{position:"absolute",top:-30,right:30,width:90,height:90,borderRadius:"50%",background:kidSkin==="cute"?`${th.main}1f`:GP.bubble,pointerEvents:"none"}}/>
          <div style={{position:"absolute",bottom:-24,left:-10,width:70,height:70,borderRadius:"50%",background:GP.bubble,pointerEvents:"none"}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:GP.chipBg,border:`2.5px solid ${GP.chipBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:"0 4px 14px rgba(0,0,0,0.10)"}}>{_skin.selectEmoji}</div>
              <div>
                <p style={{fontSize:13,opacity:0.75,margin:0,fontWeight:900,letterSpacing:1.5,color:GP.onDarkSub}}>PLAYER STATUS</p>
                <h1 style={{fontSize:24,fontWeight:900,margin:"3px 0 0",color:GP.onDark}}>{curChild?.name}</h1>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:7,alignItems:"stretch"}}>
              <div style={{display:"flex",gap:7,alignItems:"center",justifyContent:"flex-end"}}>
                <button onClick={()=>setShowParentPin(true)}
                  style={{...jellyChip({border:`1px solid ${GP.chipBorder}`,background:GP.chipBg,borderRadius:14}),flex:children.length>1?1:"none",color:GP.chipText,padding:"9px 13px",fontSize:13,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>
                  🔒 엄마용
                </button>
                {children.length<=1&&(
                  <button onClick={()=>setShowKidCoachmark(true)}
                    style={{...jellyChip({border:`1px solid ${GP.chipBorder}`,background:GP.chipBg,borderRadius:14}),color:GP.chipText,padding:"9px 12px",fontSize:13,fontWeight:900,cursor:"pointer"}}>
                    ❓
                  </button>
                )}
              </div>
              {children.length>1&&(
                <select value={childId} onChange={e=>{
                  setChildId(e.target.value);
                  setChildDate(TODAY);
                  setChildTab("today");
                  setShowChildRewards(false);
                  setShowChildXP(false);
                  setOpenRewardId(null);
                }} style={{...jellyChip({border:`1px solid ${GP.chipBorder}`,background:GP.chipBg,borderRadius:14}),width:"100%",boxSizing:"border-box",color:GP.chipText,padding:"9px 10px",fontSize:13,fontWeight:900,outline:"none"}}>
                  {children.map(c=>(
                    <option key={c.id} value={c.id} style={{color:C.text}}>{getGenderEmoji(c)} {c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* ── 대형 캐릭터 영웅 무대 (메인 주인공) ── */}
        {(()=>{
          const q=getTodayQuestProgress(childId,childDate||TODAY);
          const level=getChildLevel(childId);
          const evo=getCharacterEvolution(childId);
          const stageHat=getEquipped(childId,"hat");
          const eqSkinActive=!!getEquipped(childId,"skin")&&isMaxEvolution(childId);
          // 스킨 장착 중엔 모자 숨김(스킨이 완성형)
          const showHat=stageHat&&!eqSkinActive;
          const avatar=getCharacterAvatar(childId,!!showHat);
          const pet=getPet(childId);
          const title=getSelectedTitle(childId);
          const cute=kidSkin==="cute";
          const stageBgDeco=getEquipped(childId,"bg");
          const stageBorder=getEquipped(childId,"border");
          // 테두리 빛번짐(glow) — 베이커리(밝은 무대)에선 채도 낮은 glowCute 사용 + 번짐 약하게
          const bGlow=stageBorder?((cute&&stageBorder.glowCute)?stageBorder.glowCute:stageBorder.glow):null;
          // 진행도에 따른 말풍선 멘트 + 캐릭터 기분
          const msg=getProgressMessage(q.percent,q.total);
          const allDone=q.total>0&&q.percent===100;
          // 꾸미기(모자·테두리·배경·스킨) 중 하나라도 장착하면 둥실 효과 정지 — 초기 기본 상태에서만 둥실거려 생동감을 줌
          const hasAnyDecor=!!(stageHat||stageBorder||stageBgDeco||eqSkinActive);
          const charAnim=hasAnyDecor?"none":"floatHero 2.6s ease-in-out infinite";
          // 무대 배경: 던전은 다크 샤이니, 베이커리는 따뜻한 크림 스포트라이트
          const stageBg=cute
            ?`radial-gradient(120% 95% at 50% 5%, #ffffff, ${mixWhite(th.main,0.5)} 50%, ${mixWhite(th.main,0.38)})`
            :(stageBorder
                // 테두리 장착 시: 안쪽을 테마색 머금은 한 톤 밝은 다크로 → 화려한 프레임이 돋보임
                ?`radial-gradient(125% 100% at 50% 0%, ${th.main}4a 0%, ${dungeonTone(th.main,40)} 42%, ${dungeonTone(th.main,22)} 100%)`
                :`radial-gradient(120% 95% at 50% -10%, ${th.main}40 0%, transparent 55%), ${dungeonShinyBg}`);
          // 무대 위 스포트라이트(캐릭터를 비추는 빛)
          const spotlight=cute
            ?"radial-gradient(ellipse 60% 50% at 50% 62%, rgba(255,255,255,0.55), transparent 70%)"
            :`radial-gradient(ellipse 55% 45% at 50% 60%, ${th.main}33, transparent 72%)`;
          return (
            <div style={{position:"relative",zIndex:1,margin:"16px 16px 0",borderRadius:cute?34:GP.radCard||28,padding:stageBorder?4:0,overflow:"hidden",
              background:stageBorder?stageBorder.grad:"transparent",
              backgroundSize:stageBorder&&(stageBorder.shimmer||stageBorder.rainbow)?"260% 260%":"100% 100%",
              boxShadow:stageBorder?(cute?`0 10px 26px ${bGlow}, 0 0 14px ${bGlow}`:`0 14px 36px ${bGlow}, 0 0 26px ${bGlow}`):"none",
              animation:stageBorder&&stageBorder.rainbow
                ?"rainbowFlow 4s linear infinite, jellyIn .55s cubic-bezier(.34,1.56,.64,1) both"
                :stageBorder&&stageBorder.shimmer
                  ?"metalShine 4s linear infinite, jellyIn .55s cubic-bezier(.34,1.56,.64,1) both"
                  :"jellyIn .55s cubic-bezier(.34,1.56,.64,1) both"}}>
              {/* 반짝이 프레임 광택 스윕 (실버/골드/루비/레전드) */}
              {stageBorder&&(stageBorder.shimmer||stageBorder.rainbow)&&(
                <div style={{position:"absolute",inset:0,borderRadius:"inherit",pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:"-40%",width:"45%",height:"100%",background:`linear-gradient(105deg, transparent, rgba(255,255,255,${cute?0.6:0.85}), transparent)`,transform:"skewX(-18deg)",animation:"shineMove 4s ease-in-out infinite"}}/>
                </div>
              )}
            <div style={{position:"relative",borderRadius:cute?(stageBorder?30:34):(stageBorder?((GP.radCard||28)-4):(GP.radCard||28)),padding:"18px 18px 16px",overflow:"hidden",
              background:stageBg,
              border:stageBorder?"none":(cute?"2px solid #fff":`1px solid ${th.main}66`),
              boxShadow:cute?`0 16px 36px ${th.main}3a, inset 0 2px 8px rgba(255,255,255,0.85)`:`0 14px 34px ${GP.boxShadowCol||"rgba(0,0,0,0.35)"}, inset 0 1px 0 rgba(255,255,255,0.10)`}}>
              {/* 던전 판타지 풍경 (하늘+달+성+산) — 배경 꾸미기 미장착 시 기본 배경으로 */}
              {!cute&&!stageBgDeco&&<DungeonScenery/>}
              {/* 베이커리 기본 풍경 (하늘+해+구름+제과점) — 배경 꾸미기 미장착 시 기본 배경으로 */}
              {cute&&!stageBgDeco&&<BakeryScenery/>}
              {/* 캐릭터 스포트라이트 */}
              <div style={{position:"absolute",inset:0,background:spotlight,pointerEvents:"none",zIndex:0}}/>
              {/* ── 장착 배경 꾸미기 (은은한 tint + 떠다니는 장식) ── */}
              {/* 던전: 구매한 배경 이모지만 사용 / 베이커리: 기본 반짝이와 섞어 조화롭게 */}
              {stageBgDeco&&(()=>{
                const own = (stageBgDeco.deco||[]).filter(Boolean);
                if(own.length===0) return null;
                // 첫 번째 이모지를 '주인공'으로 강조 — 더 자주, 더 크게 등장시킨다.
                // (예: 솜사탕 구름은 ☁️ 가 deco[0] 이므로 구름이 화면을 채우고 나머지는 양념처럼)
                const lead = own[0];
                // 8칸 중 주인공 비중을 높게: 0,2,3,5,7 = 주인공 / 1,4,6 = 나머지 순환
                const leadSlots=[0,2,3,5,7];
                const seq = Array.from({length:8}, (_,i)=>{
                  if(leadSlots.includes(i)) return lead;
                  const rest = own.length>1 ? own.slice(1) : own;
                  return rest[i%rest.length];
                });
                const allDoneBg = allDone; // 미션 100% 완료 시 더 화려하게(축하)
                // 이모지별 크기 보정 (지구·무지개는 작게, 번개·구름은 강조)
                const emScale={"🌎":0.7,"🌍":0.7,"🌏":0.7,"⚡":1.3,"🐉":1.1,"🌈":0.8,"☁️":1.25};
                // 캐릭터(중앙 하단)·레벨/상장 칩(우측 상단~중단)을 피해
                // 상단 가장자리 + 좌측 + 펫 위 여백 위주로 흩뿌림 (빈 공간 채우기)
                const spots=[
                  {l:88,t:5,r:-12,d:0},    {l:70,t:3,r:8,d:0.5},
                  {l:54,t:2,r:-6,d:1.0},   {l:4,t:30,r:10,d:0.7},
                  {l:14,t:50,r:-10,d:1.3}, {l:3,t:70,r:8,d:0.4},
                  {l:30,t:24,r:14,d:0.9},  {l:90,t:24,r:-14,d:1.6},
                ];
                return (
                  <>
                    <div style={{position:"absolute",inset:0,background:`radial-gradient(130% 100% at 50% 0%, ${stageBgDeco.tint}, transparent 72%)`,pointerEvents:"none",zIndex:0,animation:"bgTintIn .6s ease both"}}/>
                    <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0}}>
                      {seq.map((s,i)=>{
                        const sp=spots[i];
                        const baseSize=allDoneBg?(i%2?17:21):(i%2?13:16);
                        return (
                        <span key={`bg${i}`} style={{position:"absolute",
                          left:`${sp.l}%`,top:`${sp.t}%`,
                          fontSize:Math.round(baseSize*(emScale[s]||1)),
                          opacity:allDoneBg?0.92:(i%3===0?0.62:0.5),
                          transform:`rotate(${sp.r}deg)`,
                          filter:`drop-shadow(0 1px 3px rgba(0,0,0,0.12))${s==="⚡"?" drop-shadow(0 0 6px rgba(255,235,90,0.85))":""}`,
                          animation:`sparkleFloat ${2.1+i*0.28}s ease-in-out ${sp.d}s infinite`}}>{s}</span>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
              {/* 말풍선 (맨 위, 캐릭터 위쪽 정렬) — 모자 장착 시에는 모자가 그 자리를 채우므로 숨기고, 응원멘트는 오늘의 미션 카드 하단으로 이동 */}
              {!showHat&&(
              <div style={{position:"relative",zIndex:2,display:"flex",justifyContent:"flex-start",marginBottom:2,marginTop:2,paddingLeft:6}}>
                <div style={{position:"relative",background:cute?"#fff":"rgba(255,255,255,0.95)",color:cute?mixBlack(th.main,0.32):"#2A2A45",borderRadius:18,padding:"8px 16px",fontSize:14,fontWeight:900,boxShadow:"0 6px 16px rgba(0,0,0,0.16)",maxWidth:"82%",textAlign:"left",lineHeight:1.35,
                  animation:"bubbleIn .5s cubic-bezier(.34,1.56,.64,1) both",border:cute?`2px solid ${mixWhite(th.main,0.6)}`:"none"}}>
                  {msg}
                  {/* 말풍선 꼬리 (왼쪽 캐릭터 머리 방향) */}
                  <div style={{position:"absolute",bottom:-7,left:34,width:0,height:0,borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderTop:`8px solid ${cute?"#fff":"rgba(255,255,255,0.95)"}`}}/>
                </div>
              </div>
              )}
              {/* 캐릭터 무대 (좌: 캐릭터+펫 가운데정렬 / 우: 레벨·상장 우측붙임) */}
              <div style={{position:"relative",zIndex:2,display:"flex",alignItems:"center",gap:8,marginTop:18,minHeight:104}}>
                {/* ── 좌측: 캐릭터 + 펫 (남은 공간 가운데 정렬) ── */}
                <div style={{flex:1,minWidth:0,display:"flex",alignItems:"flex-end",justifyContent:"center",gap:6}}>
                  {/* 메인 캐릭터 + 레벨 이모지 뱃지 */}
                  <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center"}}>
                    {/* 황금 무대 조명(던전 전용) — 캐릭터 머리 위에서 발밑까지 조준 */}
                    {!cute&&(
                      <>
                        <div style={{position:"absolute",left:"50%",top:-26,transform:"translateX(-50%)",width:170,height:"calc(100% + 30px)",pointerEvents:"none",zIndex:0,
                          background:`linear-gradient(180deg, ${GP.gold||"#FFD166"}55, transparent 66%)`,
                          filter:"blur(10px)",clipPath:"polygon(30% 0, 70% 0, 124% 100%, -24% 100%)",
                          animation:"spotGlow 3s ease-in-out infinite"}}/>
                        {/* 발밑 빛 웅덩이 */}
                        <div style={{position:"absolute",left:"50%",bottom:6,transform:"translateX(-50%)",width:130,height:30,pointerEvents:"none",zIndex:0,
                          background:`radial-gradient(ellipse 50% 100% at 50% 100%, ${GP.gold||"#FFD166"}55, transparent 70%)`,filter:"blur(6px)"}}/>
                      </>
                    )}
                    <div style={{position:"relative",zIndex:1}}>
                      <div style={{fontSize:78,lineHeight:1,animation:charAnim,filter:"drop-shadow(0 9px 11px rgba(0,0,0,0.24))"}}>{avatar}</div>
                      {showHat&&(()=>{
                        // 전투 고글(던전)은 머리 꼭대기가 아니라 눈 위치에 와야 자연스러움 → 아래로 내림
                        const isGoggles=stageHat.id==="hat_goggles"&&!cute;
                        // 영웅 기사(🦸‍♂️/🦸‍♀️)는 머리가 작아 모자가 커보임 → 던전 모드에서만 모자 축소
                        const isHero=!cute&&(avatar==="🦸‍♂️"||avatar==="🦸‍♀️");
                        return (
                          <span style={{position:"absolute",bottom:isGoggles?"calc(100% - 40px)":(isHero?"calc(100% - 14px)":"calc(100% - 18px)"),left:"50%",transform:"translateX(-50%)",fontSize:isHero?30:40,zIndex:3,pointerEvents:"none",filter:"drop-shadow(0 4px 5px rgba(0,0,0,0.25))"}}>{stageHat.emoji}</span>
                        );
                      })()}
                    </div>
                    {/* 바닥 그림자 */}
                    <div style={{width:60,height:13,borderRadius:"50%",background:cute?"rgba(120,80,100,0.16)":"rgba(0,0,0,0.34)",filter:"blur(3.5px)",marginTop:-4}}/>
                  </div>
                  {/* 펫 */}
                  <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center",marginBottom:8}}>
                    <div style={{fontSize:40,lineHeight:1,animation:"floatHero 2.6s ease-in-out infinite .4s",filter:"drop-shadow(0 6px 8px rgba(0,0,0,0.22))"}}>{pet.emoji}</div>
                    <div style={{width:32,height:8,borderRadius:"50%",background:cute?"rgba(120,80,100,0.14)":"rgba(0,0,0,0.3)",filter:"blur(2.5px)",marginTop:-2}}/>
                    <span style={{position:"absolute",bottom:-14,fontSize:10.5,fontWeight:900,color:cute?mixBlack(th.main,0.3):"rgba(255,255,255,0.82)",whiteSpace:"nowrap"}}>🐾 펫</span>
                  </div>
                </div>
                {/* ── 우측: 레벨 / 상장 세로 나열, 우측 끝 정렬 (향후 꾸미기 슬롯 영역) ── */}
                {(()=>{
                  const tr = TITLE_RARITY[title.rarity] || TITLE_RARITY.common;
                  const lvCol = cute ? "#E8923C" : (GP.gold||"#FFC53D"); // 레벨=골드/꿀빛
                  return (
                <div style={{flexShrink:0,display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
                  {/* 레벨 행 — 골드/경험치 톤으로 통일 */}
                  <div style={{display:"flex",alignItems:"center",gap:6,width:118,boxSizing:"border-box",background:cute?`linear-gradient(135deg, #FFF6E6, #FFEFD0)`:`linear-gradient(135deg, ${lvCol}26, ${lvCol}12)`,border:`1.5px solid ${lvCol}${cute?"":"66"}`,borderRadius:12,padding:"5px 9px",boxShadow:cute?`0 3px 9px ${lvCol}33`:"none"}}>
                    <span style={{fontSize:14,flexShrink:0}}>{level.emoji}</span>
                    <div style={{minWidth:0}}>
                      <p style={{fontSize:8.5,fontWeight:900,margin:0,letterSpacing:0.2,color:lvCol,opacity:0.9,lineHeight:1.1}}>LV.{level.level}</p>
                      <p style={{fontSize:11,fontWeight:900,margin:"1px 0 0",color:cute?mixBlack(lvCol,0.25):"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.15}}>{level.name}</p>
                    </div>
                  </div>
                  {/* 상장 행 — 희귀도별 색으로 차등(등급이 높을수록 화려) · 베이커리는 레벨 칩과 통일감 있게 부드러운 마감 */}
                  <div style={{display:"flex",alignItems:"center",gap:6,width:118,boxSizing:"border-box",background:cute?`linear-gradient(135deg, ${tr.color}30, ${tr.color}16)`:`linear-gradient(135deg, ${tr.color}26, ${tr.color}10)`,border:`1.5px solid ${tr.color}${cute?(title.rarity==="common"?"66":"aa"):(title.rarity==="common"?"55":"99")}`,borderRadius:12,padding:"5px 9px",boxShadow:cute?`0 3px 9px ${tr.color}33`:((title.rarity==="epic"||title.rarity==="legendary")?`0 3px 12px ${tr.color}55`:"none")}}>
                    <span style={{fontSize:14,flexShrink:0}}>{title.emoji}</span>
                    <div style={{minWidth:0}}>
                      <p style={{fontSize:8.5,fontWeight:900,margin:0,letterSpacing:0.2,color:tr.color,opacity:0.9,lineHeight:1.1}}>{tr.icon} {tr.name}</p>
                      <p style={{fontSize:11,fontWeight:900,margin:"1px 0 0",color:cute?mixBlack(tr.color,0.2):"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.15}}>{title.name}</p>
                    </div>
                  </div>
                </div>
                  );
                })()}
              </div>
            </div>
            </div>
          );
        })()}

        {/* 아이용 탭 */}
        <div style={{position:"relative",zIndex:1,display:"flex",background:GP.boxSolid,margin:"16px 16px 0",borderRadius:18,padding:6,border:`1px solid ${GP.boxBorder}`,boxShadow:SHADOW.md,gap:4}}>
          {[["today",T.tabs.quest],["growth",T.tabs.character]].map(([k,label])=>(
            <button key={k} onClick={()=>setChildTab(k)} className="jelly-tap"
              style={{flex:1,border:"none",borderRadius:14,padding:"13px 8px",background:childTab===k?(GP.tabActive||`linear-gradient(135deg, ${GP.gold}, ${th.main})`):"transparent",color:childTab===k?"#fff":GP.boxSub,fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:childTab===k?`0 5px 16px ${th.main}44`:"none",animation:childTab===k?"tabBounce .4s ease-out":"none",transition:"color .2s"}}>
              {label}
            </button>
          ))}
        </div>

        <div key={childTab} style={{padding:"16px",position:"relative",zIndex:1,animation:"popInUp .35s ease-out"}}>
          {/* ── 오늘 탭 ── */}
          {childTab==="today"&&(
            <>
              {/* 오늘의 진행 요약 카드(스킨 공용) */}
              {(()=>{
                const q=getTodayQuestProgress(childId,childDate||TODAY);
                const ready=q.total-q.done-q.failed;
                return (
                  <div style={kidSkin==="cute"
                    ?{position:"relative",overflow:"hidden",background:`linear-gradient(160deg, ${mixWhite(th.main,0.55)}, ${mixWhite(th.main,0.32)})`,border:`2px solid #fff`,borderRadius:34,padding:"16px",marginBottom:14,color:GP.boxText,boxShadow:`0 14px 30px ${th.main}3a, inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -8px 18px ${th.main}22`,boxSizing:"border-box",display:"flex",flexDirection:"column",animation:"jellyIn .5s cubic-bezier(.34,1.56,.64,1) both"}
                    :{position:"relative",overflow:"hidden",background:dungeonShinyBg,border:`1px solid ${th.main}55`,borderRadius:GP.radCard,padding:"16px",marginBottom:14,color:GP.boxText,boxShadow:`0 10px 30px ${GP.boxShadowCol}, inset 0 1px 0 rgba(255,255,255,0.08)`,boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
                    <DungeonCardGlow/>
                    {/* 젤리 광택 */}
                    {kidSkin==="cute"&&<div style={{position:"absolute",top:0,left:0,right:0,height:"45%",background:"linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))",borderRadius:"34px 34px 50% 50%",pointerEvents:"none"}}/>}
                    <div style={{position:"absolute",top:-26,right:-20,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,0.07)",pointerEvents:"none"}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,position:"relative"}}>
                      <div>
                        <p style={{fontSize:13,opacity:0.75,margin:0,fontWeight:900,letterSpacing:1.2}}>{T.dailyArea}</p>
                        <p style={{fontSize:20,fontWeight:900,margin:"3px 0 0"}}><span style={{display:"inline-block",animation:"floatBob 2.6s ease-in-out infinite"}}>{T.missionEmoji}</span> {T.todayQuest}</p>
                      </div>
                      <div style={{width:62,height:62,borderRadius:"50%",background:kidSkin==="cute"?`radial-gradient(circle at 38% 30%, #fff, ${mixWhite(th.main,0.55)})`:(GP.innerBg||GP.chipBg),border:`${kidSkin==="cute"?"3px":"2px"} solid ${kidSkin==="cute"?"#fff":(GP.innerBorder||GP.chipBorder)}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:kidSkin==="cute"?`0 5px 14px ${th.main}4a, inset 0 2px 4px rgba(255,255,255,0.9)`:"none"}}>
                        <p style={{fontSize:17,fontWeight:900,margin:0,color:kidSkin==="cute"?th.main:GP.gold}}>{q.percent}%</p>
                        <p style={{fontSize:11,fontWeight:900,margin:0,opacity:0.8}}>{T.clearShort}</p>
                      </div>
                    </div>
                    <div style={{marginBottom:12}}>
                      <JellyBar percent={q.percent} height={14} />
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,position:"relative"}}>
                      <div style={{background:kidSkin==="cute"?"linear-gradient(160deg, #ffffff, rgba(255,255,255,0.78))":GP.chipBg,borderRadius:18,padding:"9px 6px",textAlign:"center",border:kidSkin==="cute"?"2px solid #fff":"none",boxShadow:kidSkin==="cute"?`0 5px 13px ${th.main}30, inset 0 1.5px 3px rgba(255,255,255,0.95)`:"none"}}>
                        <p style={{fontSize:16,margin:0}}>✅</p>
                        <p style={{fontSize:14,fontWeight:900,margin:"1px 0 0"}}>{q.done}</p>
                        <p style={{fontSize:11,opacity:0.75,margin:0}}>{T.clearShort}</p>
                      </div>
                      <div style={{background:kidSkin==="cute"?"linear-gradient(160deg, #ffffff, rgba(255,255,255,0.78))":GP.chipBg,borderRadius:18,padding:"9px 6px",textAlign:"center",border:kidSkin==="cute"?"2px solid #fff":"none",boxShadow:kidSkin==="cute"?`0 5px 13px ${th.main}30, inset 0 1.5px 3px rgba(255,255,255,0.95)`:"none"}}>
                        <p style={{fontSize:16,margin:0}}>{T.missionEmoji}</p>
                        <p style={{fontSize:14,fontWeight:900,margin:"1px 0 0"}}>{ready}</p>
                        <p style={{fontSize:11,opacity:0.75,margin:0}}>READY</p>
                      </div>
                      <div style={{background:kidSkin==="cute"?"linear-gradient(160deg, #ffffff, rgba(255,255,255,0.78))":GP.chipBg,borderRadius:18,padding:"9px 6px",textAlign:"center",border:kidSkin==="cute"?"2px solid #fff":"none",boxShadow:kidSkin==="cute"?`0 5px 13px ${th.main}30, inset 0 1.5px 3px rgba(255,255,255,0.95)`:"none"}}>
                        <p style={{fontSize:16,margin:0}}>❌</p>
                        <p style={{fontSize:14,fontWeight:900,margin:"1px 0 0"}}>{q.failed}</p>
                        <p style={{fontSize:11,opacity:0.75,margin:0}}>FAILED</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 날짜 이동 (다크 톤 통일) */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",...jellyBox({background:GP.boxBg,border:`1px solid ${GP.boxBorder}`,borderRadius:16,boxShadow:`0 6px 18px ${GP.boxShadowCol}`},{radius:18}),padding:"10px 12px",marginBottom:14}}>
                <button onClick={()=>{const d=new Date(childDate+"T00:00:00");d.setDate(d.getDate()-1);setChildDate(toStr(d));}}
                  style={{...jellyChip({background:GP.chipBg,border:`1px solid ${GP.chipBorder}`,borderRadius:10},{radius:12}),color:GP.chipText,width:34,height:34,fontSize:18,cursor:"pointer",fontWeight:900}}>‹</button>
                <div style={{textAlign:"center"}}>
                  <p style={{fontSize:15,fontWeight:900,margin:0,color:GP.boxText}}>{childDt.getMonth()+1}월 {childDt.getDate()}일 {childTodayDN}요일</p>
                  {!isChildToday&&<p style={{fontSize:11,color:GP.gold,margin:"2px 0 0",fontWeight:800}}>오늘과 다른 날짜예요</p>}
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  {!isChildToday&&<button onClick={()=>setChildDate(TODAY)}
                    style={{background:`linear-gradient(135deg, ${GP.gold}, ${th.main})`,border:"none",color:"#fff",borderRadius:10,padding:"6px 10px",fontSize:11,cursor:"pointer",fontWeight:900}}>오늘</button>}
                  <button onClick={()=>{const d=new Date(childDate+"T00:00:00");d.setDate(d.getDate()+1);setChildDate(toStr(d));}}
                    style={{...jellyChip({background:GP.chipBg,border:`1px solid ${GP.chipBorder}`,borderRadius:10},{radius:12}),color:GP.chipText,width:34,height:34,fontSize:18,cursor:"pointer",fontWeight:900}}>›</button>
                </div>
              </div>

              {/* 오늘 학원 일정 섹션 */}
              <div style={{marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:12,padding:"0 4px"}}>
                  <div>
                    <p style={{fontSize:12,fontWeight:900,letterSpacing:1.5,color:th.main,margin:"0 0 3px"}}>
                      {T.areaTag}
                    </p>
                    <p style={{fontSize:19,fontWeight:900,margin:0,color:C.text}}>
                      {isChildToday?T.todayArea:`${childDt.getMonth()+1}/${childDt.getDate()} ${T.dateAreaSuffix}`}
                    </p>
                  </div>
                  <span style={{fontSize:13,fontWeight:900,color:"#fff",background:`linear-gradient(135deg, ${GP.dark2}, ${th.main})`,borderRadius:999,padding:"7px 13px",whiteSpace:"nowrap",flexShrink:0,boxShadow:`0 3px 10px ${th.main}44`}}>
                    {T.areaCountIcon} {childTodayAc.length}곳
                  </span>
                </div>
                {childTodayAc.length===0?(
                  <div style={{textAlign:"center",padding:"28px 10px",color:kidSkin==="cute"?C.sub:"rgba(255,255,255,0.7)",background:kidSkin==="cute"?"#fff":`linear-gradient(160deg, ${dungeonTone(th.main,30)}, ${dungeonTone(th.main,20)})`,borderRadius:20,border:kidSkin==="cute"?`1px dashed ${C.border}`:`1px dashed rgba(255,255,255,0.18)`}}>
                    <p style={{fontSize:38,margin:0,animation:"wiggle 2.4s ease-in-out infinite"}}>{T.noAreaEmoji}</p>
                    <p style={{fontSize:16,fontWeight:800,margin:"8px 0 0"}}>{T.noArea}</p>
                  </div>
                ):(
                  childTodayAc.map(ac=>{
                    const sc=getScheduleForDay(ac,childTodayDN);
                    const entry=getDailyEntry(childId,ac.id,childDate);
                    const hw=entry.homeworks||[], sup=entry.supplies||[], todos=entry.todos||[];
                    const shuttleText=getShuttleText(ac,childTodayDN);
                    const totalTodoCnt=hw.length+todos.length;
                    const doneCnt=hw.filter(h=>h.done).length+todos.filter(t=>t.done).length;
                    const allDone=totalTodoCnt>0&&doneCnt===totalTodoCnt;
                    const dungeon=getAcademyTheme(ac.name,kidSkin);
                    // ── 던전 카드 색 체계 (흰 카드 폐기, 다크 톤 통일) ──
                    const dk = kidSkin!=="cute";
                    // 카드 본체: 테마색을 머금은 다크. 헤더는 학원색을 살린 진한 톤.
                    const acCardBg = dk ? `linear-gradient(160deg, ${dungeonTone(th.main,30)}, ${dungeonTone(th.main,20)})` : "#fff";
                    const acCardBorder = dk ? `${ac.color}3d` : `2px solid ${ST.on?softTint(ac.color,0.55):ac.color+"40"}`;
                    const acTx = dk ? "#FFFFFF" : C.text;
                    const acSub = dk ? "rgba(255,255,255,0.66)" : C.sub;
                    const acInner = dk ? "rgba(255,255,255,0.07)" : CT.faint;        // 내부 강조 박스
                    const acInnerBorder = dk ? "rgba(255,255,255,0.12)" : C.border;
                    const acChip = dk ? "rgba(255,255,255,0.12)" : null;             // 준비물 칩 등
                    return (
                      <div key={ac.id} style={{borderRadius:ST.on?(GP.radMid||22):22,overflow:"hidden",marginBottom:14,background:acCardBg,border:dk?`1px solid ${acCardBorder}`:`2px solid ${ST.on?softTint(ac.color,0.55):ac.color+"40"}`,boxShadow:dk?`0 8px 24px ${dungeonTone(th.main,0)}99, inset 0 1px 0 rgba(255,255,255,0.06)`:(ST.on?`0 6px 18px ${GP.boxShadowCol}`:`0 8px 26px ${ac.color}26, 0 2px 6px rgba(0,0,0,0.06)`)}}>
                        {/* 헤더 - 던전:진한 그라데이션 / 베이커리:부드러운 학원색 파스텔 */}
                        <div style={{position:"relative",overflow:"hidden",background:ST.on?`linear-gradient(135deg, ${softTint(ac.color,0.50)}, ${softTint(ac.color,0.62)})`:`linear-gradient(135deg, ${mixBlack(ac.color,0.42)}, ${mixBlack(ac.color,0.18)})`,padding:"15px 15px",display:"flex",alignItems:"center",gap:12}}>
                          {/* 헤더 장식 빛무리/버블 */}
                          <div style={{position:"absolute",top:-30,right:-20,width:110,height:110,borderRadius:"50%",background:ST.on?"rgba(255,255,255,0.45)":"rgba(255,255,255,0.14)",pointerEvents:"none"}}/>
                          <div style={{position:"absolute",bottom:-26,left:30,width:70,height:70,borderRadius:"50%",background:ST.on?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.08)",pointerEvents:"none"}}/>
                          <div style={{position:"relative",width:50,height:50,borderRadius:16,background:ST.on?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.22)",border:ST.on?`2px solid rgba(255,255,255,0.85)`:"2px solid rgba(255,255,255,0.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:ST.on?"0 3px 9px rgba(150,110,120,0.18)":"0 4px 12px rgba(0,0,0,0.22)"}}>
                            {dungeon.icon}
                          </div>
                          <div style={{flex:1,minWidth:0,position:"relative"}}>
                            <p style={{fontSize:11,fontWeight:900,color:ST.on?GP.boxSub:"rgba(255,255,255,0.85)",margin:"0 0 3px",letterSpacing:1.2}}>{T.missionEmoji} {dungeon.label}</p>
                            <p style={{fontSize:18,fontWeight:900,margin:0,color:ST.on?GP.boxText:"#fff",textShadow:ST.on?"none":"0 1px 3px rgba(0,0,0,0.25)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ac.name}</p>
                          </div>
                          {totalTodoCnt>0&&<span style={{position:"relative",fontSize:13,fontWeight:900,color:allDone?(ST.on?ST.color:ac.color):GP.dark,background:allDone&&ST.on?`${ST.color}16`:ST.on?"rgba(255,255,255,0.85)":"rgba(255,255,255,0.95)",border:allDone&&ST.on?`1.5px solid ${ST.color}`:"none",borderRadius:12,padding:"6px 11px",flexShrink:0,boxShadow:allDone&&ST.on?`0 2px 8px ${ST.color}33`:ST.on?`0 2px 8px ${GP.boxShadowCol}`:"0 2px 8px rgba(0,0,0,0.18)"}}>{allDone?(ST.on?`${ST.face} ${ST.ringText}`:"✓ 클리어"):`${doneCnt}/${totalTodoCnt}`}</span>}
                        </div>
                        {/* 상세 정보 */}
                        <div style={{padding:"13px 15px"}}>
                        <p style={{fontSize:15,fontWeight:800,color:acTx,margin:"0 0 6px"}}>⏰ {sc?.time} / {sc?.duration}분 수업</p>
                        {shuttleText&&<p style={{fontSize:13,color:acSub,margin:"0 0 8px"}}>🚌 {shuttleText}</p>}
                        {/* 준비물 */}
                        <div style={{marginTop:8,display:"flex",alignItems:"baseline",flexWrap:"wrap",gap:"6px 8px"}}>
                          <p style={{fontSize:15,fontWeight:800,color:acSub,margin:0,flexShrink:0}}>🎒 준비물</p>
                          <div style={{display:"flex",flexWrap:"wrap",gap:6,flex:1,minWidth:0}}>
                            {(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s)).map((s,i)=><span key={`b${i}`} style={{fontSize:13,padding:"4px 11px",borderRadius:20,background:dk?acChip:(ST.on?softTint(ac.color,0.72):`${ac.color}18`),color:dk?"rgba(255,255,255,0.9)":(ST.on?GP.boxText:ac.color),fontWeight:700}}>{s}</span>)}
                            {sup.map((s,i)=><span key={`s${i}`} style={{fontSize:13,padding:"4px 11px",borderRadius:20,background:dk?`${C.orange}26`:(ST.on?softTint(C.orange,0.72):`${C.orange}18`),color:dk?"#FFD9A8":(ST.on?GP.boxText:C.orange),fontWeight:700}}>+ {s}</span>)}
                            {(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s)).length===0&&sup.length===0&&<span style={{fontSize:13,color:acSub}}>없음</span>}
                          </div>
                        </div>
                        {/* 미션 요약 */}
                        <div style={{marginTop:8}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,background:acInner,border:`1px solid ${acInnerBorder}`,borderRadius:14,padding:"7px 12px"}}>
                            <div style={{minWidth:0}}>
                              <p style={{fontSize:13,fontWeight:900,color:acSub,margin:0}}>{T.remainMission}</p>
                            </div>
                            {totalTodoCnt===0?(
                              <span style={{fontSize:13,fontWeight:900,color:acSub,background:dk?"rgba(255,255,255,0.1)":"#fff",border:`1px solid ${acInnerBorder}`,borderRadius:999,padding:"5px 10px",whiteSpace:"nowrap",flexShrink:0}}>
                                0 / 0
                              </span>
                            ):allDone?(
                              <span style={{fontSize:13,fontWeight:900,color:C.green,background:`${C.green}14`,border:`1px solid ${C.green}35`,borderRadius:999,padding:"5px 11px",whiteSpace:"nowrap",flexShrink:0}}>
                                🎉 클리어!
                              </span>
                            ):(
                              <span style={{fontSize:13,fontWeight:900,color:C.orange,background:`${C.orange}14`,border:`1px solid ${C.orange}35`,borderRadius:999,padding:"5px 11px",whiteSpace:"nowrap",flexShrink:0}}>
                                미완료 {totalTodoCnt-doneCnt} / 전체 {totalTodoCnt}
                              </span>
                            )}
                          </div>
                        </div>
                        </div>{/* 상세 정보 end */}
                      </div>
                    );
                  })
                )}
              </div>

              {/* 미션 전체 카드 - 항상 오늘 기준 */}
              {(()=>{
                const allTodayTodos=getChildQuestBoardItems(childId,childDate);
                if(allTodayTodos.length===0) return (
                  <div style={{padding:"30px 16px",textAlign:"center",marginBottom:14,borderRadius:22,background:kidSkin==="cute"?"#fff":`linear-gradient(160deg, ${dungeonTone(th.main,30)}, ${dungeonTone(th.main,20)})`,border:kidSkin==="cute"?`1px dashed ${C.border}`:`1px dashed rgba(255,255,255,0.18)`}}>
                    <p style={{fontSize:42,margin:"0 0 8px",animation:"wiggle 2.4s ease-in-out infinite"}}>🗒️</p>
                    <p style={{fontSize:17,fontWeight:900,color:kidSkin==="cute"?C.text:"#fff",margin:"0 0 4px"}}>{T.restDay}</p>
                    <p style={{fontSize:13,fontWeight:700,color:kidSkin==="cute"?C.sub:"rgba(255,255,255,0.7)",margin:0}}>푹 쉬어도 좋아요 😌</p>
                  </div>
                );
                const q=getTodayQuestProgress(childId,childDate);
                // 미션 강조박스 색 — 던전:어두운 톤 / 베이커리:맑은 박스
                const mD = GP.missionDark;
                const mBg = mD ? dungeonShinyBg : GP.boxBg;
                const mTx = mD ? "#fff" : GP.boxText;
                const mSub = mD ? "rgba(255,255,255,0.78)" : GP.boxSub;
                const mTrack = mD ? "rgba(0,0,0,0.3)" : GP.divider;
                const mChip = mD ? "rgba(255,255,255,0.14)" : GP.chipBg;
                const mBorder = mD ? `${th.main}66` : GP.boxBorder;
                const mShadow = mD ? `${mixBlack(th.main,0.4)}55` : GP.boxShadowCol;
                const mAccent = mD ? GP.gold : GP.dark2;
                return (
                  <div style={{marginBottom:14}}>
                    {/* 게임식 헤더 - 테마 톤 RPG (위 카드들과 자연스럽게 연결) */}
                    <div style={kidSkin==="cute"
                      ?{position:"relative",overflow:"hidden",background:`linear-gradient(160deg, ${mixWhite(th.main,0.5)}, ${mixWhite(th.main,0.28)})`,borderRadius:32,padding:"17px",marginBottom:12,color:mTx,border:"2px solid #fff",boxShadow:`0 14px 28px ${th.main}3a, inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -8px 16px ${th.main}22`,animation:"jellyIn .5s cubic-bezier(.34,1.56,.64,1) both"}
                      :{position:"relative",overflow:"hidden",background:mBg,borderRadius:GP.radCard,padding:"17px",marginBottom:12,color:mTx,border:`1px solid ${mBorder}`,boxShadow:`0 10px 28px ${mShadow}`}}>
                      {kidSkin==="cute"&&<div style={{position:"absolute",top:0,left:0,right:0,height:"45%",background:"linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))",borderRadius:"32px 32px 50% 50%",pointerEvents:"none"}}/>}
                      {kidSkin==="cute"
                        ?<div style={{position:"absolute",top:-30,right:-10,width:120,height:120,borderRadius:"50%",background:`radial-gradient(circle, ${GP.gold}33, transparent 70%)`,pointerEvents:"none"}}/>
                        :<DungeonCardGlow/>}
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:13,position:"relative"}}>
                        <div>
                          <p style={{fontSize:12,margin:0,fontWeight:900,letterSpacing:1.5,color:mAccent}}>{T.missionTag}</p>
                          <p style={{fontSize:21,fontWeight:900,margin:"3px 0 0",color:mTx}}>{T.todayQuest}</p>
                        </div>
                        <div style={{background:kidSkin==="cute"?`radial-gradient(circle at 40% 28%, #fff, ${mixWhite(th.main,0.5)})`:mChip,border:`${kidSkin==="cute"?"2.5px":"1.5px"} solid ${kidSkin==="cute"?"#fff":(mD?GP.gold+"66":GP.chipBorder)}`,borderRadius:kidSkin==="cute"?18:14,padding:"8px 12px",textAlign:"center",boxShadow:kidSkin==="cute"?`0 5px 13px ${th.main}40, inset 0 1.5px 3px rgba(255,255,255,0.9)`:(mD?"0 2px 10px rgba(0,0,0,0.25)":"none")}}>
                          <p style={{fontSize:19,fontWeight:900,margin:0,color:kidSkin==="cute"?th.main:mAccent}}>{q.percent}%</p>
                          <p style={{fontSize:10,margin:0,color:mSub,fontWeight:800,letterSpacing:1}}>{T.clearShort}</p>
                        </div>
                      </div>
                      <div style={{marginBottom:9}}>
                        <JellyBar percent={q.percent} height={13} fallbackTrack={mTrack} fallbackBorder={`1px solid ${mD?"rgba(255,255,255,0.12)":GP.boxBorder}`} />
                      </div>
                      <p style={{fontSize:13,fontWeight:800,margin:0,color:mSub,position:"relative"}}>
                        {T.doneIcon} 완료 {q.done} · {T.failIcon} 실패 {q.failed} · 전체 {q.total}
                      </p>
                      {/* ── 응원멘트 (모자 장착 시 무대 말풍선 대신 진행바 카드 안 맨 아래로 이동, 작게) ── */}
                      {getEquipped(childId,"hat")&&(()=>{
                        const cheer=getProgressMessage(q.percent,q.total);
                        return (
                          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginTop:11,paddingTop:10,borderTop:`1px solid ${mD?"rgba(255,255,255,0.12)":GP.divider}`,position:"relative"}}>
                            <span style={{fontSize:14,flexShrink:0,animation:"floatBob 2.8s ease-in-out infinite"}}>📣</span>
                            <p style={{fontSize:12,fontWeight:800,margin:0,lineHeight:1.35,color:mSub,textAlign:"center"}}>{cheer}</p>
                          </div>
                        );
                      })()}
                    </div>
                    {/* 미션 아이템 목록 */}
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {allTodayTodos.map((item,idx)=>{
                        const status=getQuestStatus(item);
                        // 베이커리(cute)면 학원색을 따뜻한 쪽으로 부드럽게 보정(색 구분은 유지)
                        const acCol = item.academyColor||th.main;
                        return (
                          <div key={`${item.kind}-${item.academyId}-${item.date}-${item.id}`} style={{borderRadius:GP.radMid||22,overflow:"hidden",background:item.done?(kidSkin==="cute"?"#F7F8FB":"#D9DDE8"):(kidSkin==="cute"?"#fff":"#E6E9F2"),border:`2px solid ${item.done?(kidSkin==="cute"?"#D8DCE6":"#C2C7D6"):item.failed?C.red+"45":acCol+(kidSkin==="cute"?"55":"77")}`,boxShadow:item.done?"0 3px 12px rgba(20,24,60,0.06)":item.failed?"0 3px 12px rgba(0,0,0,0.05)":`0 10px 26px ${acCol}26, 0 3px 8px rgba(0,0,0,0.05)`,opacity:item.done?0.82:1,marginBottom:12,animation:item.done?`squishCard .5s ease-out`:`jellyIn .4s cubic-bezier(.34,1.56,.64,1) ${idx*0.05}s both`}}>
                            {/* 스크롤 헤더 - 학원 색 띠 (클리어 시 회색) */}
                            <div style={{padding:"10px 13px",background:item.done?"#EDEFF4":item.failed?`${C.red}0A`:`linear-gradient(135deg, ${acCol}1c, ${acCol}08)`,borderBottom:`1px solid ${item.done?"#DFE3EC":item.failed?C.red+"20":acCol+"22"}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                              <div style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
                                <span style={{fontSize:20,flexShrink:0}}>{getAcademyTheme(item.academyName,kidSkin).icon}</span>
                                <p style={{fontSize:14,fontWeight:900,color:C.text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                  {item.academyName}
                                  {item.carried&&<span style={{fontSize:11,fontWeight:800,color:C.orange,marginLeft:6}}>· 이어하기</span>}
                                </p>
                              </div>
                              <span style={{fontSize:11,fontWeight:900,color:item.done?"#7C8398":item.failed?status.color:"#fff",background:item.done?"#E6E9F0":item.failed?status.bg:`linear-gradient(135deg, ${acCol}, ${mixWhite(item.academyColor||th.main,0.22)})`,border:`1px solid ${item.done?"#D2D7E2":item.failed?status.color+"30":"transparent"}`,padding:"4px 9px",borderRadius:20,flexShrink:0,boxShadow:item.done||item.failed?"none":`0 3px 8px ${acCol}44`}}>
                                {item.done?(ST.on?ST.face:"✓"):status.emoji} {status.label}
                              </span>
                            </div>
                            {/* 스크롤 본문 */}
                            <div style={{padding:"14px 14px 13px",display:"flex",alignItems:"center",gap:12}}>
                              <div style={{position:"relative",flexShrink:0,width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center"}}>
                                {/* 미완료: 맥박 링 + 점선 회전 (눌러봐 유혹) */}
                                {!item.done&&!item.failed&&!(ST.on&&item.done)&&(<>
                                  <span style={{position:"absolute",inset:0,borderRadius:"50%",border:`2px solid ${acCol}`,animation:"checkRing 1.8s ease-out infinite",pointerEvents:"none"}}/>
                                  <span style={{position:"absolute",inset:-3,borderRadius:"50%",border:`2px dashed ${acCol}66`,animation:"dashSpin 6s linear infinite",pointerEvents:"none"}}/>
                                </>)}
                                <button className="jelly-tap" onClick={()=>{
                                if(item.failed) return;
                                if(item.kind==="homework") toggleHomeworkDone(childId,item.academyId,item.date,item.id);
                                else toggleTodoDone(childId,item.academyId,item.date,item.id);
                              }} style={ST.on&&item.done?{
                                // ── 베이커리 도장(완료) ──
                                position:"relative",width:40,height:40,borderRadius:"50%",
                                border:`2.5px solid ${ST.color}`,boxShadow:`0 0 0 2px #fff, 0 0 0 4px ${ST.color}, 0 3px 9px ${ST.color}44`,
                                background:`${ST.color}14`,color:ST.color,fontWeight:900,cursor:"pointer",flexShrink:0,fontSize:13,
                                display:"flex",alignItems:"center",justifyContent:"center",lineHeight:1.0,letterSpacing:-0.5,
                                animation:ST.anim
                              }:{
                                position:"relative",zIndex:1,width:38,height:38,borderRadius:"50%",border:`2.5px solid ${item.done?"#AEB4C2":item.failed?C.red:acCol}`,background:item.done?`linear-gradient(135deg,#B4BAC8,#C9CDD8)`:item.failed?C.red:"#fff",color:item.done||item.failed?"#fff":acCol,fontWeight:900,cursor:item.failed?"default":"pointer",flexShrink:0,fontSize:18,boxShadow:item.done?"0 3px 10px rgba(120,128,150,0.35)":item.failed?"none":`0 4px 12px ${acCol}44`,display:"flex",alignItems:"center",justifyContent:"center",animation:item.done||item.failed?"none":"tapNudge 1.8s ease-in-out infinite"}}>
                                {ST.on&&item.done
                                  ? <span style={{fontSize:17,lineHeight:1}}>{ST.face}</span>
                                  : <span style={{display:"inline-block",lineHeight:1,animation:item.done?"checkPop .45s cubic-bezier(.34,1.56,.64,1)":"none",fontSize:item.done||item.failed?18:13,opacity:item.done||item.failed?1:0.5}}>{item.done?"✓":item.failed?"×":"👆"}</span>}
                              </button>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{fontSize:15,fontWeight:900,color:item.done||item.failed?C.sub:C.text,textDecoration:item.done||item.failed?"line-through":"none",margin:"0 0 5px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                  {item.kind==="homework"?`숙제 : ${item.label}`:item.label}
                                  {item.carried&&<span style={{fontSize:13,fontWeight:800,color:C.orange,marginLeft:6,textDecoration:"none"}}>({(()=>{const d=parseLocal(item.date);return `${d.getMonth()+1}월${d.getDate()}일`;})()})</span>}
                                </p>
                                <p style={{fontSize:13,fontWeight:900,color:item.failed?C.red:GP.gold,margin:0}}>
                                  {item.failed?"보상 없음":getQuestRewardText(item)}
                                </p>
                              </div>
                              {!item.done&&(
                                <button onClick={()=>{
                                  if(item.kind==="homework") failHomeworkQuest(childId,item.academyId,item.date,item.id);
                                  else failTodoQuest(childId,item.academyId,item.date,item.id);
                                }} style={{border:"none",background:item.failed?`${C.red}16`:`${C.sub}14`,color:item.failed?C.red:C.sub,borderRadius:10,padding:"7px 9px",fontSize:11,fontWeight:900,cursor:"pointer",flexShrink:0}}>
                                  {item.failed?UI_TEXT.button.cancelFail:UI_TEXT.button.fail}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

            </>
          )}

          {/* ── 성장 탭 ── */}
          {childTab==="growth"&&(
            <>
              {childHud}

              <p style={{fontSize:13,fontWeight:900,color:C.sub,letterSpacing:0.5,margin:"6px 4px 2px"}}>🎮 즐기기</p>

              <div style={characterCardT}>
                <CharacterSectionHeader
                  dark={kidSkin!=="cute"}
                  icon="🛒" title="아이템 상점"
                  subtitle={`${TM.coin}으로 원하는 보상을 살 수 있어요\n${TM.coinEmoji} ${getChildCoin(childId)} ${TM.coin} 보유`}
                  open={openRewardShop} onToggle={()=>setOpenRewardShop(v=>!v)}
                />
                {openRewardShop&&(
                  <div style={{marginTop:14}}>
                    {/* 지갑 카드 */}
                    <div style={{background:kidSkin==="cute"?`linear-gradient(135deg, ${mixWhite(th.main,0.80)}, ${mixWhite(th.main,0.68)})`:DUNGEON_SHOP.walletBg,borderRadius:14,padding:"13px 14px",color:kidSkin==="cute"?GP.dark:"#fff",marginBottom:12,border:kidSkin==="cute"?`1px solid ${th.main}33`:DUNGEON_SHOP.walletBorder,boxShadow:kidSkin==="cute"?`0 4px 16px ${th.main}14`:"inset 0 1px 0 rgba(255,255,255,0.12)"}}>
                      <p style={{fontSize:13,fontWeight:900,letterSpacing:1,margin:"0 0 4px",color:kidSkin==="cute"?th.main:GP.gold}}>WALLET</p>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <p style={{fontSize:17,fontWeight:900,margin:0}}>보유 {TM.coin}</p>
                        <p style={{fontSize:24,fontWeight:900,margin:0,color:kidSkin==="cute"?"#E09A00":GP.gold}}>{getChildCoin(childId)} {TM.coinEmoji} {TM.coin}</p>
                      </div>
                    </div>
                    {/* 아이템 목록 */}
                    <div style={kidSkin==="cute"
                      ?{display:"flex",flexDirection:"column",gap:10}
                      :{borderRadius:18,padding:10,display:"flex",flexDirection:"column",gap:9,background:DUNGEON_SHOP.listBg,border:DUNGEON_SHOP.listBorder,boxShadow:DUNGEON_SHOP.listShadow}}>
                      {getChildRewards().map((reward,ri)=>{
                        const coin=getChildCoin(childId);
                        const canGet=coin>=reward.point;
                        const remain=Math.max(0,reward.point-coin);
                        const progress=Math.min(100,Math.round((coin/reward.point)*100));
                        const grade=getRewardGrade(reward);
                        const pending=hasPendingRewardRequest(childId,reward.id);
                        const isOpen=openRewardId===reward.id || canGet || pending;
                        const gradeBar=getDungeonShopGradeColor(reward.grade);
                        const isLegend=kidSkin!=="cute"&&reward.grade==="legendary";
                        const dTxt=isLegend?"#3A2705":"#fff";       // 전설(골드)은 진한 갈색 글자로 가독성 확보
                        const dSub=isLegend?"rgba(60,39,5,0.78)":"rgba(255,255,255,0.84)";
                        const cardBg=kidSkin==="cute"
                          ?(canGet?`linear-gradient(135deg, ${grade.color}16, #fff)`:"#fff")
                          :"transparent";
                        const cardBorder=kidSkin==="cute"
                          ?(canGet?grade.color+"55":C.border)
                          :DUNGEON_SHOP.itemBorder;
                        return (
                          <div key={reward.id} style={kidSkin==="cute"
                            ?{borderRadius:14,overflow:"hidden",background:cardBg,border:`1.8px solid ${cardBorder}`,boxShadow:canGet?`0 5px 18px ${grade.color}22`:"0 2px 10px rgba(0,0,0,0.04)"}
                            :{position:"relative",borderRadius:14,overflow:"hidden",background:getDungeonShopItemBg(reward.grade),border:getDungeonShopItemBorder(reward.grade),boxShadow:getDungeonShopItemShadow(reward.grade),opacity:canGet?1:0.92}}>
                            {kidSkin!=="cute"&&reward.grade!=="legendary"&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:gradeBar,opacity:0.9}}/>}
                            <button onClick={()=>setOpenRewardId(isOpen?null:reward.id)}
                              style={{width:"100%",border:"none",background:"transparent",padding:"13px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                              <div style={{display:"flex",alignItems:"center",gap:11,textAlign:"left"}}>
                                <div style={{width:46,height:46,borderRadius:14,background:kidSkin==="cute"?`linear-gradient(135deg, ${grade.color}22, #fff)`:(isLegend?"rgba(255,255,255,0.5)":DUNGEON_SHOP.iconBoxBg),border:kidSkin==="cute"?`1.5px solid ${grade.color}45`:(isLegend?"1px solid rgba(255,255,255,0.7)":DUNGEON_SHOP.iconBoxBorder),display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,boxShadow:kidSkin==="cute"?`0 3px 10px ${grade.color}18`:"inset 0 1px 0 rgba(255,255,255,0.35), 0 2px 6px rgba(0,0,0,0.12)"}}>
                                  {reward.emoji}
                                </div>
                                <div>
                                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                                    <p style={{fontSize:17,fontWeight:900,margin:0,color:kidSkin==="cute"?C.text:dTxt,textShadow:isLegend?"0 1px 2px rgba(120,85,15,0.25)":"none"}}>{reward.title}</p>
                                    <span style={{fontSize:11,fontWeight:900,color:kidSkin==="cute"?grade.color:dTxt,background:kidSkin==="cute"?`${grade.color}18`:(isLegend?"rgba(255,255,255,0.45)":"rgba(255,255,255,0.22)"),padding:"2px 7px",borderRadius:20}}>{grade.name}</span>
                                  </div>
                                  <p style={{fontSize:13,fontWeight:800,margin:0,color:kidSkin==="cute"?C.sub:dSub,textShadow:isLegend?"0 1px 2px rgba(120,85,15,0.18)":"none"}}>{reward.point} {TM.coinEmoji} {TM.coin} 필요</p>
                                </div>
                              </div>
                              <span style={{fontSize:13,fontWeight:900,color:pending?(kidSkin==="cute"?C.purple:(isLegend?"#5B3A8A":"#E6DBFF")):canGet?(kidSkin==="cute"?C.green:(isLegend?"#1E6B3A":"#B6F5C6")):(kidSkin==="cute"?C.orange:(isLegend?"#7A5410":"#FFE9A6")),background:kidSkin==="cute"?(pending?C.purpleL:canGet?`${C.green}15`:`${C.orange}15`):"transparent",padding:kidSkin==="cute"?"5px 8px":"0",borderRadius:20,textShadow:kidSkin==="cute"||isLegend?"none":"0 1px 2px rgba(0,0,0,0.35)"}}>
                                {isOpen?"▲":pending?"대기중":canGet?"구매 가능":"▼"}
                              </span>
                            </button>
                            {isOpen&&(
                              <div style={{padding:kidSkin==="cute"?"0 14px 14px":"0 14px 14px"}}>
                                <div style={{background:kidSkin==="cute"?CT.faint:(isLegend?"rgba(255,255,255,0.32)":"rgba(15,28,58,0.32)"),borderRadius:14,padding:"10px 11px",marginBottom:10,border:kidSkin==="cute"?"none":(isLegend?"1px solid rgba(255,255,255,0.55)":"1px solid rgba(255,255,255,0.14)")}}>
                                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:900,color:kidSkin==="cute"?C.sub:(isLegend?"rgba(60,39,5,0.85)":"rgba(255,255,255,0.9)"),marginBottom:6}}>
                                    <span>모으는 중</span><span>{progress}%</span>
                                  </div>
                                  <JellyBar percent={progress} height={10} fallbackTrack={kidSkin==="cute"?"#fff":(isLegend?"rgba(120,85,15,0.22)":"rgba(0,0,0,0.25)")} fallbackBorder={`1px solid ${kidSkin==="cute"?C.border:(isLegend?"rgba(120,85,15,0.3)":"rgba(255,255,255,0.22)")}`} fallbackGlow="none" fallbackFill={canGet?`linear-gradient(90deg, ${grade.color}, ${GP.gold})`:`linear-gradient(90deg, ${th.main}, ${GP.gold})`} />
                                </div>
                                <p style={{fontSize:13,fontWeight:800,color:kidSkin==="cute"?(pending?C.purple:canGet?C.green:C.orange):(isLegend?(pending?"#5B3A8A":canGet?"#1E6B3A":"#7A5410"):(pending?"#E0D4FF":canGet?"#9CF0B0":"#FFD166")),margin:"0 0 10px"}}>
                                  {pending?UI_TEXT.message.waitingApproval:canGet?"지금 살 수 있어요!":`${remain} ${TM.coinEmoji} ${TM.coin} 더 모으면 살 수 있어요`}
                                </p>
                                <button onClick={()=>requestReward(reward)} disabled={!canGet||pending}
                                  style={{width:"100%",padding:"11px 12px",borderRadius:14,border:"none",background:pending?C.purpleL:canGet?`linear-gradient(135deg, ${grade.color}, ${th.main})`:C.border,color:pending?C.purple:canGet?"#fff":C.sub,fontSize:15,fontWeight:900,cursor:canGet&&!pending?"pointer":"not-allowed",boxShadow:canGet&&!pending?`0 4px 14px ${grade.color}28`:"none"}}>
                                  {pending?UI_TEXT.button.pending+"...":canGet?UI_TEXT.button.requestBuy:UI_TEXT.button.needCoin}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── 꾸미기 상점 진입 (아이템 상점 아래) ── */}
              <button onClick={()=>setShowDecorShop(true)}
                style={{...characterCardT,width:"100%",boxSizing:"border-box",padding:"15px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",textAlign:"left"}}>
                <span style={{display:"flex",alignItems:"center",gap:11}}>
                  <span style={{fontSize:26}}>🛍️</span>
                  <span style={{textAlign:"left"}}>
                    <span style={{display:"block",fontSize:15.5,fontWeight:900,color:C.text}}>{kidSkin==="cute"?"꾸미기 가게":"꾸미기 상점"}</span>
                    <span style={{display:"block",fontSize:11.5,fontWeight:800,opacity:0.72,color:C.sub,marginTop:2}}>모자·테두리·배경으로 프로필 꾸미기 · {getOwnedCount(childId)}개 보유</span>
                  </span>
                </span>
                <span style={{fontSize:18,opacity:0.6,color:C.sub}}>›</span>
              </button>

              {/* 보물창고 / 디저트 보관함 카드 */}
              <div style={kidSkin==="cute"
                ? {...characterCardT, boxShadow:getTotalTreasureCount(childId)>0?`0 12px 26px ${th.main}30, inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -7px 15px ${th.main}1f, 0 0 0 2px #F5B30166`:characterCardT.boxShadow}
                : {...characterCardT,border:getTotalTreasureCount(childId)>0?`2px solid ${GP.gold}55`:characterCardT.border}}>
                <CharacterSectionHeader
                  dark={kidSkin!=="cute"}
                  icon={TM.bookEmoji} title={TM.book}
                  subtitle={getTotalTreasureCount(childId)>0
                    ?`${getBoxInfo("normal",kidSkin).emoji} ${getChildTreasure(childId).normalBox}  ${getBoxInfo("rare",kidSkin).emoji} ${getChildTreasure(childId).rareBox}  ${getBoxInfo("legend",kidSkin).emoji} ${getChildTreasure(childId).legendBox}  ← 탭해서 열기!`
                    :`미션을 완료하면 ${kidSkin==="cute"?TM.box:"상자"}를 받아요 · ${getChildTreasure(childId).completedQuestCount} CLEAR`}
                  open={openTreasure} onToggle={()=>setOpenTreasure(v=>!v)}
                />
                {openTreasure&&(
                  <div style={{marginTop:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                      {[
                        {type:"normal",key:"normalBox",emoji:getBoxInfo("normal",kidSkin).emoji,name:getBoxInfo("normal",kidSkin).name,color:C.sub},
                        {type:"rare",key:"rareBox",emoji:getBoxInfo("rare",kidSkin).emoji,name:getBoxInfo("rare",kidSkin).name,color:C.purple},
                        {type:"legend",key:"legendBox",emoji:getBoxInfo("legend",kidSkin).emoji,name:getBoxInfo("legend",kidSkin).name,color:"#F5B301"},
                      ].map(box=>{
                        const count=getChildTreasure(childId)[box.key]||0;
                        return (
                          <button key={box.type} onClick={()=>openTreasureBox(box.type)} disabled={count<=0}
                            style={{borderRadius:14,padding:"13px 8px",
                              border:`${count>0?(box.type==="legend"?"2.5px":"2px"):"1.5px"} solid ${count>0?box.color:(kidSkin==="cute"?C.border:th.main+"33")}`,
                              background:count>0
                                ?(kidSkin==="cute"
                                    ?(box.type==="legend"?`linear-gradient(135deg, ${box.color}33, #FFFDF5)`:`linear-gradient(135deg, ${box.color}22, #fff)`)
                                    :`linear-gradient(135deg, ${box.color}3a, ${dungeonTone(th.main,22)})`)
                                :(kidSkin==="cute"?CT.faint:dungeonTone(th.main,16)),
                              opacity:count>0?1:0.5,cursor:count>0?"pointer":"not-allowed",textAlign:"center",
                              boxShadow:count>0?(box.type==="legend"?`0 4px 16px ${box.color}66, 0 0 0 1px ${box.color}33`:`0 4px 14px ${box.color}30`):"none"}}>
                            <p style={{fontSize:28,margin:"0 0 5px"}}>{box.emoji}</p>
                            <p style={{fontSize:13,fontWeight:900,color:kidSkin==="cute"?(count>0?C.text:C.sub):(count>0?"#fff":"rgba(255,255,255,0.6)"),margin:"0 0 3px"}}>{kidSkin==="cute"?box.name:`${box.name}상자`}</p>
                            <p style={{fontSize:13,fontWeight:900,color:count>0?box.color:(kidSkin==="cute"?C.sub:"rgba(255,255,255,0.55)"),margin:"0 0 4px"}}>x {count}</p>
                            {count>0&&<p style={{fontSize:11,fontWeight:900,color:"#fff",background:box.color,borderRadius:20,padding:"2px 8px",display:"inline-block",margin:0}}>열기</p>}
                          </button>
                        );
                      })}
                    </div>
                    <p style={{fontSize:11,color:C.sub,fontWeight:700,margin:"12px 0 0",lineHeight:1.4}}>
                      {kidSkin==="cute"?`미션을 모으면 ${TM.box}를 받아요! (겹칠 땐 더 좋은 상자로 받아요)`:"미션을 모으면 상자를 받아요! (겹칠 땐 더 좋은 상자로 받아요)"}
                    </p>
                    <p style={{fontSize:11,color:C.sub,fontWeight:700,margin:"4px 0 0",lineHeight:1.4}}>
                      {getBoxInfo("normal",kidSkin).emoji} 10개 → {getBoxInfo("normal",kidSkin).name} · {getBoxInfo("rare",kidSkin).emoji} 30개 → {getBoxInfo("rare",kidSkin).name} · {getBoxInfo("legend",kidSkin).emoji} 50개 → {getBoxInfo("legend",kidSkin).name}
                    </p>
                  </div>
                )}
              </div>

              {/* 나의 펫 카드 (접이식) */}
              {(()=>{
                const stage=getPetStage(childId);
                const pet=petView(PET_STAGES[stage],stage,kidSkin);
                const isMax=stage>=PET_STAGES.length-1;
                return (
                  <div style={characterCardT}>
                    <CharacterSectionHeader
                      dark={kidSkin!=="cute"}
                      icon={kidSkin==="cute"?"🦄":"🐾"} title="나의 펫"
                      subtitle={`${TM.boxEmoji} ${TM.box}를 열면 ${kidSkin==="cute"?"펫이 조금씩 자라요":"펫이 조금씩 자라요"}\n${pet.emoji} ${pet.name}${isMax?" · 최종 성장 🏆":""}`}
                      open={openPet} onToggle={()=>setOpenPet(v=>!v)}
                    />
                    {openPet&&(
                      <div style={{position:"relative",overflow:"hidden",marginTop:12,textAlign:"center",background:kidSkin==="cute"?`linear-gradient(160deg, ${mixWhite(th.main,0.90)}, ${mixWhite(th.main,0.80)})`:`linear-gradient(135deg, ${mixHex("#3D517A",th.main,0.12)}, ${mixHex("#506895",th.main,0.12)})`,border:kidSkin==="cute"?`1px solid ${th.main}2A`:"2px solid rgba(180,220,255,0.35)",boxShadow:kidSkin==="cute"?"none":"inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 28px rgba(30,60,120,0.22)",borderRadius:14,padding:"14px 16px"}}>
                        {kidSkin!=="cute"&&(
                          <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:0.35,backgroundImage:`radial-gradient(1.5px 1.5px at 20% 25%, rgba(255,255,255,0.9), transparent), radial-gradient(1.3px 1.3px at 75% 20%, rgba(255,209,102,0.9), transparent), radial-gradient(1.2px 1.2px at 85% 60%, rgba(255,255,255,0.6), transparent), radial-gradient(1.4px 1.4px at 35% 78%, rgba(180,220,255,0.8), transparent)`}}/>
                        )}
                        <div style={{position:"relative"}}>
                        <div style={{fontSize:52,lineHeight:1,margin:"0 0 6px",filter:kidSkin==="cute"?"none":"drop-shadow(0 0 8px rgba(255,220,120,0.8))"}}>{pet.emoji}</div>
                        <p style={{fontSize:17,fontWeight:900,color:kidSkin==="cute"?C.text:"#fff",margin:"0 0 3px"}}>{pet.name}</p>
                        <p style={{fontSize:13.5,fontWeight:700,color:kidSkin==="cute"?C.sub:"rgba(255,255,255,0.7)",margin:"0 0 10px",lineHeight:1.45}}>{pet.desc}</p>
                        <div style={{display:"flex",justifyContent:"center",gap:7,marginBottom:10}}>
                          {PET_STAGES.map((p,i)=>{
                            const pv=petView(p,i,kidSkin);
                            return (
                            <span key={i} style={{fontSize:17,opacity:i<=stage?1:0.25,filter:i<=stage?"none":"grayscale(1)"}}>{pv.emoji}</span>
                            );
                          })}
                        </div>
                        <div style={{background:kidSkin==="cute"?"rgba(255,255,255,0.7)":"rgba(15,18,34,0.32)",borderRadius:10,padding:"8px 12px",fontSize:11.5,fontWeight:700,color:kidSkin==="cute"?C.sub:"rgba(255,255,255,0.85)",lineHeight:1.5,border:`1px solid ${kidSkin==="cute"?th.main+"1A":"rgba(255,255,255,0.18)"}`}}>
                          {isMax
                            ? (kidSkin==="cute"?"🏆 최종 성장 완료! 최고의 펫이에요":"🏆 최종 진화 완료! 최고의 펫이에요")
                            : `${TM.boxEmoji} ${TM.box}를 열면 가끔 ${kidSkin==="cute"?"펫이 자라요":"펫이 진화해요"}`}
                        </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <p style={{fontSize:13,fontWeight:900,color:C.sub,letterSpacing:0.5,margin:"24px 4px 2px"}}>📜 내 기록</p>

              {/* 상장 카드 */}
              <div style={characterCardT}>
                <CharacterSectionHeader
                  dark={kidSkin!=="cute"}
                  icon="👑" title="상장"
                  subtitle={`받은 상장을 골라 캐릭터 옆에 전시할 수 있어요\n${getUnlockedTitles(childId).length}/${getAllTitles(childId).length}개 획득`}
                  open={openTitle} onToggle={()=>setOpenTitle(v=>!v)}
                />
                {openTitle&&(
                  <div style={{marginTop:14,display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:9}}>
                    {getAllTitles(childId).map(title=>{
                      const unlocked=isTitleUnlocked(childId,title.id);
                      const selected=getSelectedTitle(childId).id===title.id;
                      const rarity=TITLE_RARITY[title.rarity||"common"];
                      return (
                        <button key={title.id} onClick={()=>selectTitle(title.id)} disabled={!unlocked}
                          style={{borderRadius:14,padding:"12px 10px",position:"relative",
                          background:selected?`linear-gradient(135deg, ${rarity.color}22, #fff)`:unlocked&&title.rarity==="legendary"?"linear-gradient(135deg,#FFF7ED,#FFFBEB)":unlocked?rarity.bg:CT.faint,
                          border:`${selected?"2.5px":title.rarity==="legendary"?"2px":"1.7px"} solid ${selected?rarity.color:unlocked?rarity.color+(title.rarity==="legendary"?"":"55"):C.border}`,
                          boxShadow:selected?`0 4px 16px ${rarity.color}55`:"none",
                          opacity:unlocked?1:0.5,cursor:unlocked?"pointer":"not-allowed",textAlign:"center"}}>
                          {selected&&(
                            <span style={{position:"absolute",top:7,right:7,width:20,height:20,borderRadius:"50%",background:rarity.color,color:"#fff",fontSize:13,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 6px ${rarity.color}66`}}>✓</span>
                          )}
                          <p style={{fontSize:24,margin:"0 0 5px"}}>{unlocked?title.emoji:"🔒"}</p>
                          <p style={{fontSize:11,fontWeight:900,color:rarity.color,margin:"0 0 3px"}}>{rarity.icon} {rarity.name}</p>
                          <p style={{fontSize:13,fontWeight:900,margin:"0 0 3px",color:selected?rarity.color:unlocked?C.text:C.sub}}>{title.name}</p>
                          <p style={{fontSize:11,color:C.sub,margin:0,fontWeight:700,lineHeight:1.3}}>{title.condition}</p>
                          {selected
                            ? <p style={{fontSize:11,fontWeight:900,color:"#fff",background:rarity.color,borderRadius:20,padding:"3px 9px",display:"inline-block",margin:"7px 0 0"}}>✓ 선택됨</p>
                            : unlocked&&<p style={{fontSize:11,fontWeight:900,color:rarity.color,background:"#fff",border:`1px solid ${rarity.color}55`,borderRadius:20,padding:"3px 9px",display:"inline-block",margin:"7px 0 0"}}>선택</p>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 연속 달성 카드 */}
              <div style={characterCardT}>
                <CharacterSectionHeader
                  dark={kidSkin!=="cute"}
                  icon="🔥" title="연속 달성"
                  subtitle={`매일 미션을 해내면 며칠 연속인지 쌓여요\n현재 ${getQuestStreak(childId)}일 · 최고기록 ${getBestStreak(childId)}일`}
                  open={openStreak} onToggle={()=>setOpenStreak(v=>!v)}
                />
                {openStreak&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}>
                    <div style={{background:CT.faint,borderRadius:14,padding:"10px",textAlign:"center",border:`1px solid ${C.border}`}}>
                      <p style={{fontSize:11,color:C.sub,fontWeight:800,margin:"0 0 3px"}}>현재</p>
                      <p style={{fontSize:20,fontWeight:900,margin:0,color:C.text}}>{getQuestStreak(childId)}일</p>
                    </div>
                    <div style={{background:CT.faint,borderRadius:14,padding:"10px",textAlign:"center",border:`1px solid ${C.border}`}}>
                      <p style={{fontSize:11,color:C.sub,fontWeight:800,margin:"0 0 3px"}}>최고 기록</p>
                      <p style={{fontSize:20,fontWeight:900,margin:0,color:GP.gold}}>{getBestStreak(childId)}일</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 모험 기록 카드 */}
              <div style={characterCardT}>
                <CharacterSectionHeader
                  dark={kidSkin!=="cute"}
                  icon="📖" title={T.logName||"활동 기록"}
                  subtitle="최근 미션·보상·아이템 활동 기록"
                  open={openHistory} onToggle={()=>setOpenHistory(v=>!v)}
                />
                {openHistory&&(
                  <div style={{marginTop:14}}>
                    {getScoreHistory(childId).length===0?(
                      <div style={{textAlign:"center",padding:"24px 10px"}}>
                        <p style={{fontSize:42,marginBottom:8}}>📖</p>
                        <p style={{fontSize:15,fontWeight:900,color:C.text,margin:"0 0 6px"}}>아직 {T.logName||"활동 기록"}이 없어요</p>
                        <p style={{fontSize:13,color:C.sub,margin:0}}>미션을 완료하면 기록이 쌓여요</p>
                      </div>
                    ):(
                      <div>
                        {getScoreHistory(childId).slice().reverse().slice(0,15).map(item=>{
                          const info=getAdventureLogInfo(item);
                          const xp=Number(item.xp??0);
                          const coin=Number(item.coin??item.point??0);
                          return (
                            <div key={item.id} style={{display:"flex",gap:12,alignItems:"center",padding:"12px",borderRadius:14,background:"#fff",border:`1px solid ${C.border}`,marginBottom:8}}>
                              <div style={{width:42,height:42,borderRadius:"50%",background:CT.faint,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                                {info.icon}
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{margin:0,fontSize:13,fontWeight:900,color:C.text}}>{info.title}</p>
                                <p style={{marginTop:3,fontSize:13,color:C.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.memo||item.date||""}</p>
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                {xp>0&&<p style={{margin:0,color:GP.gold,fontWeight:900,fontSize:13}}>{TM.xpEmoji} +{xp}</p>}
                                {coin!==0&&<p style={{margin:"2px 0 0",color:coin>0?C.green:C.red,fontWeight:900,fontSize:13}}>{TM.coinEmoji} {coin>0?"+":""}{coin}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* 개발자 도구 모달 */}
        {showDevTools&&(
          <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.6)",display:"flex",alignItems:"flex-end",zIndex:3000}} onClick={()=>setShowDevTools(false)}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 44px",width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto",boxSizing:"border-box"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div>
                  <h3 style={{margin:0,fontSize:17,fontWeight:900,color:C.text}}>🧪 개발자 도구</h3>
                  <p style={{margin:"4px 0 0",fontSize:13,color:C.sub,fontWeight:700}}>테스트용 데이터 생성/초기화</p>
                </div>
                <button onClick={()=>setShowDevTools(false)} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
              </div>

              {/* 현재 아이 상태 */}
              <div style={{background:GP.boxBg,border:`1px solid ${GP.boxBorder}`,borderRadius:14,padding:"10px 14px",marginBottom:14,color:GP.boxText}}>
                <p style={{fontSize:11,opacity:0.7,margin:"0 0 2px",fontWeight:900,letterSpacing:1}}>CURRENT PLAYER</p>
                <p style={{fontSize:13,fontWeight:900,margin:0}}>{children.find(c=>c.id===childId)?.name||"없음"} · Lv.{getChildLevel(childId).level} · {TM.xpEmoji}{getChildXP(childId)} · {TM.coinEmoji}{getChildCoin(childId)}</p>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={loadSampleData} style={devBtn(C.green)}>🌱 샘플 데이터 채우기 (아이·학원·미션)</button>
                <button onClick={()=>generateTestData(childId)} style={devBtn(C.purple)}>🧪 테스트 데이터 생성</button>
                <button onClick={()=>generateLegendTestData(childId)} style={devBtn(GP.gold)}>👑 전설 테스트 모드</button>

                <div style={devGroup}>
                  <p style={devGroupTitle}>미션 · 숙제 일괄 추가 ({fmt(childDate)})</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                    <button onClick={()=>addDevQuests(childId,10)} style={devMiniBtn(C.blue||"#3B82F6")}>📝 미션 10개</button>
                    <button onClick={()=>addDevHomeworks(childId,10)} style={devMiniBtn(C.orange)}>📚 숙제 10개</button>
                  </div>
                </div>

                <div style={devGroup}>
                  <p style={devGroupTitle}>상자 지급</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    <button onClick={()=>giveDevBox("normal")} style={devMiniBtn("#94A3B8")}>📦 일반</button>
                    <button onClick={()=>giveDevBox("rare")} style={devMiniBtn(C.purple)}>🎁 희귀</button>
                    <button onClick={()=>giveDevBox("legend")} style={devMiniBtn(GP.gold)}>👑 전설</button>
                  </div>
                </div>

                <div style={devGroup}>
                  <p style={devGroupTitle}>{TM.xp} 지급</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    <button onClick={()=>addDevXP(10)} style={devMiniBtn(C.green)}>+10</button>
                    <button onClick={()=>addDevXP(50)} style={devMiniBtn(C.green)}>+50</button>
                    <button onClick={()=>addDevXP(100)} style={devMiniBtn(C.green)}>+100</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:8}}>
                    <button onClick={()=>addDevXP(-10)} style={devMiniBtn(C.red)}>-10</button>
                    <button onClick={()=>addDevXP(-50)} style={devMiniBtn(C.red)}>-50</button>
                    <button onClick={()=>addDevXP(-100)} style={devMiniBtn(C.red)}>-100</button>
                  </div>
                </div>

                <div style={devGroup}>
                  <p style={devGroupTitle}>{TM.coin} 지급</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    <button onClick={()=>addDevCoin(100)} style={devMiniBtn(GP.gold)}>+100</button>
                    <button onClick={()=>addDevCoin(500)} style={devMiniBtn(GP.gold)}>+500</button>
                    <button onClick={()=>addDevCoin(1000)} style={devMiniBtn(GP.gold)}>+1000</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:8}}>
                    <button onClick={()=>addDevCoin(-10)} style={devMiniBtn(C.red)}>-10</button>
                    <button onClick={()=>addDevCoin(-50)} style={devMiniBtn(C.red)}>-50</button>
                    <button onClick={()=>addDevCoin(-100)} style={devMiniBtn(C.red)}>-100</button>
                  </div>
                </div>

                <button onClick={()=>unlockAllTitlesForDev(childId)} style={devBtn("#F59E0B")}>👑 모든 상장 받기</button>

                <div style={devGroup}>
                  <p style={devGroupTitle}>이벤트 팝업 테스트</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                    <button onClick={()=>showDevEvent("level")} style={devMiniBtn(th.main)}>🎉 레벨업</button>
                    <button onClick={()=>showDevEvent("title")} style={devMiniBtn("#F59E0B")}>👑 상장</button>
                    <button onClick={()=>showDevEvent("box")} style={devMiniBtn("#FBBF24")}>📦 상자획득</button>
                    <button onClick={()=>showDevEvent("treasure")} style={devMiniBtn(C.orange)}>🎁 상자열기</button>
                  </div>
                </div>

                <button onClick={()=>{ resetGameData(childId); setShowDevTools(false); }} style={devBtn(C.red)}>🧹 현재 아이 게임 데이터 초기화</button>
                <button onClick={resetAllAppData} style={devBtn("#111827")}>💣 앱 전체 초기화</button>
              </div>
            </div>
          </div>
        )}

        {/* PIN 입력 모달 */}
        {showParentPin&&(
          <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
            <div style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:350,boxSizing:"border-box"}}>
              <h3 style={{fontSize:20,fontWeight:900,margin:"0 0 16px",textAlign:"center"}}>🔒 엄마용</h3>
              <input type="password" inputMode="numeric" value={pinInput}
                onChange={e=>setPinInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&enterParentMode()}
                placeholder="비밀번호 4자리"
                style={{width:"100%",boxSizing:"border-box",padding:"14px",borderRadius:14,border:`1.5px solid ${C.border}`,fontSize:20,outline:"none",marginBottom:12,textAlign:"center",letterSpacing:6}}/>
              {parentPin==="1234"&&!pinHintSeen&&(
                <p style={{fontSize:13,fontWeight:700,color:th.main,background:`${th.main}12`,borderRadius:10,padding:"9px 12px",margin:"0 0 12px",textAlign:"center",lineHeight:1.5}}>
                  💡 처음 비밀번호는 <b>1234</b> 예요.<br/>설정 &gt; 비밀번호 변경에서 바꿀 수 있어요.
                </p>
              )}
              <button onClick={enterParentMode}
                style={{width:"100%",padding:14,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",marginBottom:8}}>
                들어가기
              </button>
              <button onClick={()=>{ markPinHintSeen(); setShowParentPin(false); setPinInput(""); }}
                style={{width:"100%",padding:12,borderRadius:14,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:15,fontWeight:700,cursor:"pointer"}}>
                취소
              </button>
            </div>
          </div>
        )}

      {/* ── 보물상자 오픈 애니메이션 모달 ── */}
      {openingTreasure&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.80)",zIndex:2500,display:"flex",justifyContent:"center",alignItems:"center"}}>
          <div style={{textAlign:"center",color:"#fff"}}>
            <div style={{fontSize:82,animation:"boxBounce .7s ease-in-out infinite"}}>{TM.boxEmoji}</div>
            <p style={{fontSize:24,fontWeight:900,marginTop:14,margin:"14px 0 6px"}}>{kidSkin==="cute"?`${TM.box} 여는 중...`:`${TM.box} 오픈 중...`}</p>
            <p style={{fontSize:15,opacity:0.7,margin:0,animation:"shimmer 1s ease-in-out infinite"}}>두근두근...</p>
          </div>
        </div>
      )}

      {/* ── 보물상자 오픈 결과 모달 ── */}
      {treasureModal&&(
        <div style={GAME_MODAL_STYLE.overlay}>
          {/* 반짝이 이펙트 (eventModal과 통일) */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
            {(kidSkin==="cute"?["🧁","🍪","🎀","🌸","🧁"]:["✨","⭐","✨","💫","⭐"]).map((s,i)=>(
              <span key={i} style={{position:"absolute",left:`${18+i*16}%`,top:`${34+(i%2)*12}%`,fontSize:24,animation:`sparkleFloat ${0.9+i*0.12}s ease-out infinite`,animationDelay:`${i*0.12}s`}}>
                {s}
              </span>
            ))}
          </div>
          <div style={kidSkin==="cute"?{...GAME_MODAL_STYLE.card,borderRadius:32,border:`2px solid ${mixWhite(th.main,0.55)}`,boxShadow:`0 25px 90px ${th.main}44, 0 8px 28px rgba(0,0,0,.18)`}:GAME_MODAL_STYLE.card}>
            <GameModalHeader
              cute={kidSkin==="cute"}
              emoji={treasureModal.emoji}
              title={kidSkin==="cute"?"DESSERT BOX":"TREASURE OPEN"}
              color={treasureModal.headerGrad||`linear-gradient(135deg, ${GP.gold}, ${th.main})`}
            />
            <div style={{...GAME_MODAL_STYLE.body,textAlign:"center"}}>
              <p style={{fontSize:15,fontWeight:900,color:C.sub,margin:"0 0 8px"}}>{treasureModal.boxName}</p>
              <p style={{fontSize:30,fontWeight:900,color:kidSkin==="cute"?th.main:GP.gold,margin:"0 0 4px"}}>{TM.coinEmoji} +{treasureModal.rewardCoin}</p>
              <p style={{fontSize:13,color:C.sub,fontWeight:800,margin:"0 0 16px"}}>
                {kidSkin==="cute"?`${TM.box} 보상을 받았어요!`:`${TM.box} 보상을 획득했어요!`}
              </p>
              {treasureModal.titleReward&&(
                <div style={{marginTop:18,padding:"14px",borderRadius:14,background:kidSkin==="cute"?mixWhite(th.main,0.86):"#FFF7ED",border:`2px solid ${kidSkin==="cute"?"#F5B301":"#F59E0B"}`}}>
                  <p style={{margin:0,fontSize:13,fontWeight:900,color:"#F5B301"}}>✨ 전설 상장 획득</p>
                  <p style={{marginTop:6,fontSize:20,fontWeight:900,margin:"6px 0 0",color:C.text}}>
                    {treasureModal.titleReward.emoji} {treasureModal.titleReward.name}
                  </p>
                </div>
              )}
              <GameModalButton cute={kidSkin==="cute"} grad={th.grad} onClick={()=>setTreasureModal(null)}/>
            </div>
          </div>
        </div>
      )}

      {/* ── 미션 클리어 중앙 보상 연출 (화면을 가리지 않음, 스크롤 위치 무관하게 항상 중앙에 표시) ── */}
      {charCheer&&(
        <div key={charCheer.key} style={{position:"fixed",inset:0,zIndex:1250,pointerEvents:"none",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          {/* 사방으로 시원하게 튀는 코인/별 */}
          {[...Array(14)].map((_,si)=>{
            const emo=(kidSkin==="cute"?["🍪","⭐","✨","🧁","🍪","⭐","✨","🌟","🍪","⭐","✨","🎀","🍪","⭐"]:["💎","⭐","✨","🪙","💎","⭐","✨","🌟","💎","⭐","✨","🪙","💎","⭐"])[si];
            const ang=si/14*6.28;
            const dist=110+(si%3)*40;
            return (
              <span key={si} style={{position:"absolute",left:"50%",top:"50%",fontSize:34,"--bcx":`${Math.cos(ang)*dist}px`,"--bcy":`${Math.sin(ang)*dist}px`,"--bcr":`${(si%2?1:-1)*200}deg`,animation:"bigCoinBurst .8s ease-out forwards",animationDelay:`${(si%4)*0.03}s`}}>{emo}</span>
            );
          })}
          {/* 응원 문구 */}
          <div style={{background:"#fff",borderRadius:22,padding:"14px 24px",boxShadow:kidSkin==="cute"?`0 16px 50px ${th.main}3a`:"0 16px 50px rgba(0,0,0,0.28)",border:`3px solid ${kidSkin==="cute"?th.main:GP.gold}`,textAlign:"center",animation:"cheerTextIn .5s cubic-bezier(.34,1.56,.64,1) forwards, cheerTextOut .35s ease-in .95s forwards"}}>
            <p style={{fontSize:26,fontWeight:900,color:GP.dark,margin:"0 0 6px",whiteSpace:"nowrap"}}>{charCheer.msg}</p>
            <p style={{fontSize:19,fontWeight:900,margin:0,whiteSpace:"nowrap"}}>
              <span style={{color:GP.gold}}>{TM.xpEmoji} +{charCheer.xp}</span>
              <span style={{color:C.sub,margin:"0 8px"}}>·</span>
              <span style={{color:C.green}}>{TM.coinEmoji} +{charCheer.xp}</span>
            </p>
          </div>
        </div>
      )}

      {/* ── 미션 실패 안내 모달 (클리어는 인라인 이펙트로 대체) ── */}
      {questResultModal&&questResultModal.type==="failed"&&(
        <div style={{...GAME_MODAL_STYLE.overlay,pointerEvents:"none",zIndex:1300}}>
          <div style={GAME_MODAL_STYLE.card}>
            <GameModalHeader
              emoji="💥"
              title="미션 실패"
              color={`linear-gradient(135deg, ${C.red}, #FF8A80)`}
            />
            <div style={{...GAME_MODAL_STYLE.body,textAlign:"center"}}>
              <p style={{fontWeight:900,fontSize:17,margin:"0 0 10px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {questResultModal.title}
              </p>
              <p style={{fontSize:15,fontWeight:800,color:C.sub,margin:0}}>다음에 다시 도전!</p>
            </div>
          </div>
        </div>
      )}

      {/* ── 통합 게임 이벤트 모달 ── */}
      {eventModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000,padding:20}}>
          {/* 반짝이 이펙트 */}
          <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
            {(kidSkin==="cute"?["🧁","🍪","🎀","🌸","🧁"]:["✨","⭐","✨","💫","⭐"]).map((s,i)=>(
              <span key={i} style={{position:"absolute",left:`${18+i*16}%`,top:`${34+(i%2)*12}%`,fontSize:24,animation:`sparkleFloat ${0.9+i*0.12}s ease-out infinite`,animationDelay:`${i*0.12}s`}}>
                {s}
              </span>
            ))}
          </div>
          {/* 모달 카드 */}
          {eventModal.cert ? (()=>{
            const cute=kidSkin==="cute";
            const rar=TITLE_RARITY[eventModal.rarity]||TITLE_RARITY.common;
            // 모드별 상장 팔레트
            const cFrame   = cute?"linear-gradient(135deg,#f7c6d6,#f3a8c0)":"linear-gradient(135deg,#1e2547,#0f1430)";
            const cPaper   = cute
              ? "radial-gradient(circle at 18% 12%, rgba(255,255,255,.6), transparent 45%), linear-gradient(160deg,#fff6f3,#ffeef2)"
              : "radial-gradient(circle at 20% 15%, rgba(245,179,1,.05), transparent 40%), radial-gradient(circle at 80% 90%, rgba(245,179,1,.06), transparent 40%), linear-gradient(160deg,#fbf6e9,#f3ead0)";
            const cBorder  = cute?"rgba(231,140,170,.5)":"rgba(180,140,40,.45)";
            const cInner   = cute?"rgba(231,140,170,.14)":"rgba(180,140,40,.12)";
            const cEyebrow = cute?"#d06a92":"#9a7b1e";
            const cTitle   = cute?"#7a4257":"#1e2547";
            const cRibbon  = cute?"linear-gradient(90deg,#f3a8c0,#ffd1c2)":"linear-gradient(90deg,#caa23a,#f5d062)";
            const cName    = cute?"#7a4257":"#1e2547";
            const cReason  = cute?"#7d5f68":"#4a4636";
            const cRewardBg= cute?"#fff":"#1e2547";
            const cRewardTx= cute?"#c25c84":"#f5d98e";
            const cRewardBd= cute?"rgba(231,140,170,.45)":"rgba(245,179,1,.4)";
            const cBy      = cute?"#bb8a9c":"#7a6a3a";
            const cSign    = cute?"#7a4257":"#3a3320";
            const cSealBg  = cute?"radial-gradient(circle at 35% 30%,#ffd6e2,#f3a8c0)":"radial-gradient(circle at 35% 30%,#f5d062,#caa23a)";
            const cSealTx  = cute?"#9c3a63":"#5a4410";
            const cSealSh  = cute?"0 3px 8px rgba(200,90,130,.35)":"0 3px 8px rgba(120,90,10,.4)";
            const cBtn     = cute?"linear-gradient(135deg,#f3a8c0,#f7c6d6)":"linear-gradient(135deg,#caa23a,#1e2547)";
            const cBtnTx   = cute?"#7a4257":"#fff";
            const sealMark = cute?"✿":"★";
            const orgName  = cute?"하랑 베이커리":"하랑 모험단";
            return (
              <div style={{width:"100%",maxWidth:330,borderRadius:18,overflow:"hidden",background:cFrame,padding:9,animation:"gamePop .5s cubic-bezier(.18,.9,.32,1.2)",position:"relative",boxShadow:"0 25px 90px rgba(0,0,0,.45)"}}>
                <div style={{position:"relative",borderRadius:10,padding:"30px 26px 26px",textAlign:"center",background:cPaper}}>
                  {/* 이중 헤어라인 테두리 */}
                  <div style={{position:"absolute",inset:9,borderRadius:5,border:`1.5px solid ${cBorder}`,boxShadow:`inset 0 0 0 4px ${cInner}`,pointerEvents:"none"}}/>
                  {/* shine */}
                  <div style={{position:"absolute",inset:0,borderRadius:10,overflow:"hidden",pointerEvents:"none"}}>
                    <div style={{position:"absolute",top:0,left:"-60%",width:"45%",height:"100%",background:"linear-gradient(105deg,transparent,rgba(255,255,255,.5),transparent)",transform:"skewX(-18deg)",animation:"shineMove 3.2s ease-in-out infinite"}}/>
                  </div>
                  <div style={{position:"relative"}}>
                    <div style={{fontSize:50,lineHeight:1,marginBottom:6,filter:"drop-shadow(0 3px 6px rgba(0,0,0,.18))"}}>{eventModal.emoji}</div>
                    <div style={{fontSize:11,letterSpacing:5,fontWeight:800,color:cEyebrow,marginBottom:6}}>CERTIFICATE</div>
                    <div style={{fontSize:30,fontWeight:900,letterSpacing:8,color:cTitle,marginBottom:4}}>상 장</div>
                    <div style={{display:"inline-block",height:3,width:54,borderRadius:2,background:cRibbon,margin:"10px auto 16px"}}/>
                    <div style={{fontSize:21,fontWeight:900,color:cName,marginBottom:3}}>{eventModal.name}</div>
                    <div style={{fontSize:11,fontWeight:800,color:rar.color,marginBottom:16}}>{rar.icon} {rar.name}</div>
                    <div style={{fontSize:13.5,fontWeight:600,lineHeight:1.75,color:cReason,marginBottom:20,wordBreak:"keep-all"}}>{eventModal.desc}</div>
                    {eventModal.reward&&(
                      <div style={{borderRadius:11,padding:"10px 12px",fontSize:13,fontWeight:900,marginBottom:20,background:cRewardBg,color:cRewardTx,border:`1px solid ${cRewardBd}`}}>
                        {String(eventModal.reward).split("\n").map((line,i)=>(<div key={i}>{line}</div>))}
                      </div>
                    )}
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                      <div style={{textAlign:"left"}}>
                        <div style={{fontSize:9,letterSpacing:2,fontWeight:700,color:cBy,opacity:.85}}>AWARDED BY</div>
                        <div style={{fontSize:14,fontWeight:900,color:cSign,marginTop:2}}>{orgName}</div>
                      </div>
                      <div style={{width:50,height:50,borderRadius:"50%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,flexShrink:0,transform:"rotate(-12deg)",background:cSealBg,color:cSealTx,boxShadow:cSealSh}}>
                        <span style={{fontSize:17,lineHeight:1}}>{sealMark}</span>수여
                      </div>
                    </div>
                    <button onClick={()=>setEventModal(null)}
                      style={{marginTop:18,width:"100%",border:"none",borderRadius:13,padding:13,fontSize:15,fontWeight:900,cursor:"pointer",background:cBtn,color:cBtnTx}}>
                      확인 {eventQueue.length>0?`(${eventQueue.length}개 더)`:""}
                    </button>
                  </div>
                </div>
              </div>
            );
          })() : (
          <div style={{width:"100%",maxWidth:350,borderRadius:kidSkin==="cute"?32:28,overflow:"hidden",background:"#fff",textAlign:"center",boxShadow:kidSkin==="cute"?`0 25px 90px ${th.main}44, 0 8px 28px rgba(0,0,0,.18)`:"0 25px 90px rgba(0,0,0,.38)",animation:"gamePop .45s ease-out",position:"relative",border:kidSkin==="cute"?`2px solid ${mixWhite(th.main,0.55)}`:"none"}}>
            {/* 헤더 */}
            <div style={{position:"relative",overflow:"hidden",padding:"28px 20px",color:kidSkin==="cute"?"#6B4A5C":"#fff",
              background:kidSkin==="cute"
                ?(eventModal.type==="level"
                    ?`linear-gradient(135deg, ${th.main}, ${mixWhite(th.main,0.4)})`
                    :eventModal.type==="title"
                      ?"linear-gradient(135deg,#F5B301,#FFD98E)"
                      :eventModal.type==="box"
                        ?"linear-gradient(135deg,#F8A5C2,#FAD0C4)"
                        :`linear-gradient(135deg, ${th.main}, ${mixWhite(th.main,0.4)})`)
                :(eventModal.type==="level"
                  ?`linear-gradient(135deg, ${GP.gold}, ${th.main})`
                  :eventModal.type==="title"
                    ?"linear-gradient(135deg,#F59E0B,#FDE68A)"
                    :eventModal.type==="box"
                      ?"linear-gradient(135deg,#F59E0B,#FBBF24)"
                      :`linear-gradient(135deg, ${GP.dark}, ${th.main})`)
            }}>
              {/* shine 효과 */}
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg, transparent, rgba(255,255,255,.45), transparent)",animation:"shineMove 1.4s ease-in-out infinite"}}/>
              <p style={{fontSize:58,margin:"0 0 8px",position:"relative"}}>{eventModal.emoji}</p>
              <p style={{fontSize:kidSkin==="cute"?22:24,fontWeight:900,margin:0,letterSpacing:kidSkin==="cute"?0:1,position:"relative"}}>{eventModal.title}</p>
            </div>
            {/* 본문 */}
            <div style={{padding:"24px 22px"}}>
              <p style={{fontSize:20,fontWeight:900,color:C.text,margin:"0 0 8px"}}>{eventModal.name}</p>
              <p style={{fontSize:13,fontWeight:800,color:C.sub,margin:"0 0 14px",lineHeight:1.45}}>{eventModal.desc}</p>
              {eventModal.reward&&(
                <div style={{background:kidSkin==="cute"?mixWhite(th.main,0.86):GP.boxSolid,border:`1px solid ${kidSkin==="cute"?mixWhite(th.main,0.6):GP.boxBorder}`,color:kidSkin==="cute"?mixBlack(th.main,0.25):GP.boxText,borderRadius:14,padding:"11px 12px",fontSize:13,fontWeight:900,marginBottom:16,lineHeight:1.5}}>
                  {String(eventModal.reward).split("\n").map((line,i)=>(
                    <div key={i}>{line}</div>
                  ))}
                </div>
              )}
              <button onClick={()=>setEventModal(null)}
                style={{width:"100%",border:"none",borderRadius:14,padding:"13px",background:th.grad,color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer"}}>
                확인 {eventQueue.length>0?`(${eventQueue.length}개 더)`:""}
              </button>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ── 첫 미션 완료 후 상점 안내창 (아이용 설명 디자인) ── */}
      {showFirstMissionTip&&(
        <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(15,16,30,0.8)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"28px"}} onClick={()=>setShowFirstMissionTip(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:26,padding:"32px 24px 24px",width:"100%",maxWidth:340,textAlign:"center",boxShadow:"0 24px 70px rgba(0,0,0,0.32)"}}>
            <div style={{fontSize:64,marginBottom:16}}>{TM.coinEmoji}</div>
            <p style={{fontSize:20,fontWeight:900,color:"#1A1A35",margin:"0 0 12px",lineHeight:1.3}}>{TM.coin}을 얻었네요! 🎉</p>
            <p style={{fontSize:15,fontWeight:600,color:"#5A6072",lineHeight:1.7,margin:"0 0 22px",whiteSpace:"pre-line"}}>{"내 캐릭터 탭 → 아이템 상점에서\n받고 싶은 사탕을 '받을래요!' 눌러요.\n엄마가 확인하면 사탕은 내 거! 🙆"}</p>
            <button onClick={()=>setShowFirstMissionTip(false)} style={{width:"100%",padding:16,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",boxShadow:`0 6px 18px ${th.main}45`}}>
              알겠어요! 🎉
            </button>
          </div>
        </div>
      )}

      </div>
    );
  }

  return (
    <div style={{fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",color:C.text,paddingBottom:90}}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet"/>

      {/* 토스트 */}
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:th.main,color:"#fff",padding:"10px 24px",borderRadius:20,fontSize:17,fontWeight:700,zIndex:99999,boxShadow:`0 4px 16px ${th.main}55`}}>{toast}</div>}

      {showModeSelect&&(
        <ModeSelect onPick={(skin)=>{ setKidSkin(skin); setShowModeSelect(false); showToast(skin==="cute"?"🧁 베이커리 게임으로 변경!":"⚔️ 던전 게임으로 변경!"); }} />
      )}

      {showCoachmark&&(
        <CoachmarkOverlay th={th} onFinish={()=>setShowCoachmark(false)} />
      )}

      {showParentRewardGuide&&(
        <GuideModal type="reward" th={th} skin={kidSkin} onClose={()=>{ setShowParentRewardGuide(false); setTab("reward"); }} />
      )}

      {/* ── 헤더 (소프트 파스텔) ── */}
      <div style={{background:`linear-gradient(165deg, ${mixWhite(th.main,0.32)} 0%, ${mixWhite(th.main,0.6)} 100%)`,padding:"20px 18px 56px",position:"relative",overflow:"hidden"}}>
        {/* 은은한 장식 블롭 */}
        <div style={{position:"absolute",top:-40,right:-30,width:160,height:160,borderRadius:"50%",background:`${th.main}33`,filter:"blur(8px)"}}/>
        <div style={{position:"absolute",bottom:-50,left:-20,width:120,height:120,borderRadius:"50%",background:`${mixWhite(th.main,0.25)}66`,filter:"blur(6px)"}}/>

        <div style={{position:"relative",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <p style={{fontSize:11,color:mixWhite(th.main,0.05),margin:0,letterSpacing:2.5,fontWeight:800,opacity:0.85}}>ACADEMY PLANNER</p>
            <h1 style={{fontSize:23,fontWeight:900,margin:"4px 0 0",color:mixWhite(th.main,0)}}>🎒 엄마 관리</h1>
          </div>
          <button onClick={exitParentMode}
            style={{border:"none",background:"#fff",color:th.main,borderRadius:14,padding:"9px 14px",fontSize:13,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",boxShadow:`0 6px 16px ${th.main}22`}}>
            🎒 아이용
          </button>
        </div>
      </div>

      {/* ── 아이 선택 칩 (헤더와 콘텐츠 사이, 둥둥 뜬 느낌) ── */}
      <div style={{position:"relative",margin:"-36px 14px 0",background:"#fff",borderRadius:20,boxShadow:SHADOW.lg,padding:"10px 10px",display:"flex",alignItems:"center",gap:8,zIndex:5}}>
        <div style={{display:"flex",flex:1,gap:6,overflowX:"auto"}}>
          {children.map(c=>{
            const t=getChildTheme(c);
            const sel=childId===c.id;
            return (
              <button key={c.id} onClick={()=>setChildId(c.id)}
                style={{flex:"0 0 auto",minWidth:64,padding:"9px 16px",border:"none",cursor:"pointer",fontSize:15,fontWeight:sel?900:600,borderRadius:14,
                  background:sel?`linear-gradient(135deg, ${mixWhite(t.main,0.04)}, ${mixWhite(t.main,0.28)})`:mixWhite(t.main,0.9),
                  color:sel?"#fff":mixWhite(t.main,0.05),whiteSpace:"nowrap",transition:"all 0.2s",
                  boxShadow:sel?`0 5px 14px ${t.main}50`:"none"}}>
                {getGenderEmoji(c)} {c.name}
              </button>
            );
          })}
        </div>
        {/* 아이 추가 */}
        <button onClick={openAddChild}
          style={{flexShrink:0,width:42,height:42,borderRadius:14,border:`1.5px dashed ${th.main}55`,background:mixWhite(th.main,0.95),color:th.main,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",lineHeight:1,gap:1}}
          title="아이 추가">
          <span style={{fontSize:15}}>＋</span>
          <span style={{fontSize:9,fontWeight:800}}>아이</span>
        </button>
      </div>

      {/* ── 탭 바 (알약형 파스텔) ── */}
      <div style={{display:"flex",justifyContent:"space-between",gap:5,padding:"14px 14px",position:"sticky",top:0,zIndex:10,background:`${C.bg}F0`,backdropFilter:"blur(8px)"}}>
        {[["home","🏠","홈"],["reward","🎁","보상"],["calendar","🗓","달력"],["fee","💰","학원비"],["absence","🏥","결석"],["etc","⚙️","기타"]].map(([k,ic,l])=>{
          const sel=tab===k;
          return (
            <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"9px 2px",border:"none",borderRadius:14,cursor:"pointer",
              background:sel?`linear-gradient(135deg, ${mixWhite(th.main,0)}, ${mixWhite(th.main,0.22)})`:"#fff",
              color:sel?"#fff":C.sub,boxShadow:sel?`0 6px 16px ${th.main}48`:SHADOW.sm,
              display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"all 0.2s"}}>
              <span style={{fontSize:16,lineHeight:1}}>{ic}</span>
              <span style={{fontSize:11,fontWeight:sel?900:700,whiteSpace:"nowrap"}}>{l}</span>
            </button>
          );
        })}
      </div>

      <div style={{padding:"16px 16px 0"}}>

        {/* ════ 홈 탭 ════ */}
        {tab==="home"&&(()=>{
          const hd=new Date(homeDate.replace(/-/g,"/"));
          const hDN=["일","월","화","수","목","금","토"][hd.getDay()];
          const isToday=homeDate===TODAY;
          const isTomorrow=homeDate===addDays(TODAY,1);
          const isYesterday=homeDate===addDays(TODAY,-1);
          const dayTag=isToday?"오늘":isTomorrow?"내일":isYesterday?"어제":null;
          const fullLabel=`${hd.getMonth()+1}월 ${hd.getDate()}일 ${hDN}요일`;
          const homeAc=curAc.filter(a=>hasClassOnDay(a,hDN)&&!isVacationDay(childId,a.id,homeDate)).sort((a,b)=>getClassTime(a,hDN).localeCompare(getClassTime(b,hDN)));
          const vacAcToday=curAc.filter(a=>hasClassOnDay(a,hDN)&&isVacationDay(childId,a.id,homeDate));
          const absOnHome=curAbs.filter(a=>a.date===homeDate);
          const makeupOnHome=curAbs.filter(a=>a.makeupDate===homeDate);
          const homePendingHw=getQuestItemsForDate(childId,homeDate).filter(it=>it.kind==="homework"&&!it.done&&!it.failed).length;
          const homePendingTodo=getQuestItemsForDate(childId,homeDate).filter(it=>it.kind==="todo"&&!it.done&&!it.failed).length;
          const homeSupplyCount=homeAc.reduce((n,ac)=>{
            const entry=getDailyEntry(childId,ac.id,homeDate);
            const hidden=entry.hiddenBase||[];
            const base=(ac.baseSupplies||[]).filter(s=>!hidden.includes(s)).length;
            const day=(entry.supplies||[]).length;
            return n+base+day;
          },0);
          const pendingHw=pendingHwTotal();
          return (
            <div>
              {/* 날짜 이동 (카드 밖 별도 줄) */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <button onClick={()=>setHomeDate(addDays(homeDate,-1))}
                  style={{width:38,height:38,borderRadius:14,background:mixWhite(th.main,0.92),border:`1px solid ${th.main}33`,color:th.main,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>‹</button>
                <div style={{flex:1,textAlign:"center"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                    <span style={{fontSize:17,fontWeight:900,color:C.text}}>{fullLabel}</span>
                    {dayTag&&<span style={{fontSize:13,background:th.main,color:"#fff",borderRadius:10,padding:"2px 9px",fontWeight:700,flexShrink:0}}>{dayTag}</span>}
                  </div>
                  {!isToday&&(
                    <button onClick={()=>setHomeDate(TODAY)}
                      style={{marginTop:5,background:`${th.main}14`,border:`1px solid ${th.main}40`,borderRadius:10,color:th.main,fontSize:13,cursor:"pointer",padding:"2px 12px",fontWeight:700}}>
                      ↩ 오늘로
                    </button>
                  )}
                </div>
                <button onClick={()=>setHomeDate(addDays(homeDate,1))}
                  style={{width:38,height:38,borderRadius:14,background:mixWhite(th.main,0.92),border:`1px solid ${th.main}33`,color:th.main,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>›</button>
              </div>

              {/* 현황 카드 (소프트 파스텔) */}
              <div style={{background:`linear-gradient(165deg, ${mixWhite(th.main,0.95)} 0%, ${mixWhite(th.main,0.76)} 100%)`,borderRadius:20,padding:"16px 18px",marginBottom:16,color:C.text,boxShadow:`0 4px 16px ${th.main}1F`,border:`1px solid ${th.main}45`}}>
                {/* 이름 + 레벨/코인 한 줄 */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:8}}>
                  <p style={{fontSize:16,fontWeight:900,margin:0,color:mixWhite(th.main,0.1)}}>{getGenderEmoji(curChild)} {curChild?.name}</p>
                  <p style={{fontSize:13,fontWeight:800,margin:0,color:th.main,background:mixWhite(th.main,0.86),border:`1px solid ${th.main}33`,borderRadius:20,padding:"4px 11px",whiteSpace:"nowrap"}}>
                    {getChildLevel(childId).emoji} Lv.{getChildLevel(childId).level} · {getChildXP(childId)} {TM.xp} · {getChildCoin(childId)} {TM.coinEmoji}
                  </p>
                </div>

                {/* 오늘 챙길 일 알림 */}
                {(()=>{
                  const alerts=[];
                  if(homeSupplyCount>0) alerts.push({label:`🎒 준비물 ${homeSupplyCount}개`,color:th.main});
                  if(homePendingHw>0) alerts.push({label:`📝 미완료 숙제 ${homePendingHw}개`,color:th.main});
                  if(homePendingTodo>0) alerts.push({label:`🎯 미완료 미션 ${homePendingTodo}개`,color:th.main});
                  if(absOnHome.length>0) alerts.push({label:`🏥 결석 ${absOnHome.length}개`,color:C.red});
                  if(makeupOnHome.length>0) alerts.push({label:`📚 보충수업 ${makeupOnHome.length}개`,color:C.orange});
                  const hasAlert=alerts.length>0;
                  return (
                    <div style={{background:hasAlert?"#fff":mixWhite(th.main,0.85),border:`1px solid ${hasAlert?th.main+"22":th.main+"40"}`,borderRadius:14,padding:"13px 14px",marginBottom:10,display:"flex",alignItems:hasAlert?"flex-start":"center",gap:12,boxShadow:SHADOW.sm}}>
                      <div style={{fontSize:28,flexShrink:0}}>{hasAlert?"🔔":"✅"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:13,fontWeight:800,margin:"0 0 6px",color:hasAlert?C.sub:mixWhite(th.main,0.15)}}>{dayTag?`${dayTag} 챙길 일`:"이 날 챙길 일"}</p>
                        {hasAlert?(
                          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                            {alerts.map((a,i)=>(
                              <span key={i} style={{fontSize:13,fontWeight:900,color:mixWhite(a.color,0.08),background:mixWhite(a.color,0.88),border:`1px solid ${a.color}33`,borderRadius:10,padding:"4px 10px",whiteSpace:"nowrap"}}>{a.label}</span>
                            ))}
                          </div>
                        ):(
                          <p style={{fontSize:15,fontWeight:900,margin:0,lineHeight:1.35,color:mixWhite(th.main,0.15)}}>챙길 일이 없어요!</p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 요약 지표 3칸 */}
                <div style={{display:"flex",gap:7}}>
                  {[
                    {label:"학원",     value:`${homeAc.length}개`,      alert:false},
                    {label:"결석",     value:`${absOnHome.length}개`,   alert:absOnHome.length>0},
                    {label:"보충수업", value:`${makeupOnHome.length}개`,alert:makeupOnHome.length>0},
                  ].map((s,i)=>(
                    <div key={i} style={{flex:1,background:s.alert?mixWhite(C.red,0.88):"#fff",borderRadius:12,padding:"10px 6px",textAlign:"center",border:`1px solid ${s.alert?C.red+"3A":th.main+"1A"}`,boxShadow:SHADOW.sm}}>
                      <p style={{fontSize:11,color:s.alert?C.red:C.sub,margin:0,fontWeight:700}}>{s.label}</p>
                      <p style={{fontSize:16,fontWeight:900,margin:"3px 0 0",color:s.alert?C.red:th.main}}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 방학 중인 학원 표시 */}
              {vacAcToday.length>0&&(
                <div style={{background:"#FFF8E1",border:"1px solid #F0A500",borderRadius:14,padding:"12px 16px",marginBottom:12}}>
                  <p style={{fontSize:17,fontWeight:700,color:"#E65100",margin:"0 0 8px"}}>🏖️ 방학 중</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {vacAcToday.map(a=>(
                      <span key={a.id} style={{fontSize:17,padding:"4px 12px",borderRadius:20,background:`${a.color}18`,color:a.color,fontWeight:600}}>{a.name}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* 학원 없는 날 */}
              {homeAc.length===0&&absOnHome.length===0&&makeupOnHome.length===0&&(
                <div style={{textAlign:"center",padding:"30px 20px",background:mixWhite(th.main,0.93),borderRadius:18,border:`1.5px dashed ${th.main}40`,marginBottom:14}}>
                  <p style={{fontSize:30,margin:0}}>😴</p>
                  <p style={{color:C.sub,fontSize:17,margin:"8px 0 0"}}>{dayTag||fullLabel}은 학원이 없어요</p>
                </div>
              )}

              {/* 결석 표시 */}
              {absOnHome.length>0&&(
                <div style={{background:`${C.red}08`,border:`1px solid ${C.red}25`,borderRadius:14,padding:"12px 16px",marginBottom:12}}>
                  <p style={{fontSize:17,fontWeight:700,color:C.red,margin:"0 0 6px"}}>🏥 결석</p>
                  {absOnHome.map(ab=>{
                    const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
                    return <p key={ab.id} style={{fontSize:17,color:C.text,margin:"2px 0"}}>{ac.name}{ab.reason&&` · ${ab.reason}`}</p>;
                  })}
                </div>
              )}

              {/* 보충수업 표시 */}
              {makeupOnHome.length>0&&(
                <div style={{background:`${C.orange}08`,border:`1px solid ${C.orange}25`,borderRadius:14,padding:"12px 16px",marginBottom:12}}>
                  <p style={{fontSize:17,fontWeight:700,color:C.orange,margin:"0 0 6px"}}>📚 보충수업</p>
                  {makeupOnHome.map(ab=>{
                    const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
                    return <p key={ab.id} style={{fontSize:17,color:C.text,margin:"2px 0"}}>{ac.name} (결석일: {ab.date})</p>;
                  })}
                </div>
              )}

              {/* 학원 카드 */}
              {homeAc.length>0&&(
                <p style={{fontSize:13,color:C.sub,fontWeight:700,margin:"2px 0 10px",letterSpacing:0.3}}>📍 오늘의 학원 ({homeAc.length})</p>
              )}
              {homeAc.map(ac=>{
                const sc=getScheduleForDay(ac,hDN);
                const [h,m]=(sc?.time||"00:00").split(":").map(Number);
                const tm=h*60+m+Number(sc?.duration||0);
                const endT=`${String(Math.floor(tm/60)%24).padStart(2,"0")}:${String(tm%60).padStart(2,"0")}`;
                const entry=getDailyEntry(childId,ac.id,homeDate);
                const hw=entry.homeworks||[], sup=entry.supplies||[], todos=entry.todos||[];
                const totalTodoCnt=hw.length+todos.length;
                const doneCnt=hw.filter(h=>h.done).length+todos.filter(t=>t.done).length;
                const allDone=totalTodoCnt>0&&doneCnt===totalTodoCnt;
                return (
                  <div key={ac.id} style={{background:CT.card,borderRadius:16,marginBottom:10,border:`1px solid ${ac.color}2A`,boxShadow:SHADOW.sm,overflow:"hidden"}}>
                    <div style={{background:`${ac.color}12`,padding:"11px 13px",display:"flex",alignItems:"center",gap:11}}>
                      <div style={{width:4,height:40,borderRadius:10,background:ac.color,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:15,fontWeight:800,margin:0,color:C.text}}>{ac.name}</p>
                        <p style={{fontSize:13,color:C.sub,margin:"2px 0 0"}}>{sc?.time} ~ {endT} &nbsp;·&nbsp; {sc?.duration}분</p>
                        {(()=>{
                          const shuttleText=getShuttleText(ac,hDN);
                          if(!shuttleText) return null;
                          return <p style={{fontSize:12,color:C.sub,margin:"3px 0 0",lineHeight:1.35,whiteSpace:"pre-wrap"}}>🚌 {shuttleText}</p>;
                        })()}
                      </div>
                      <div style={{display:"flex",gap:7}}>
                        {ac.phone&&<a href={`tel:${ac.phone}`} style={{width:34,height:34,borderRadius:10,background:`${C.green}15`,border:`1px solid ${C.green}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,textDecoration:"none"}}>📞</a>}
                        {ac.phone&&<button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }} style={{width:34,height:34,borderRadius:10,background:C.purpleL,border:`1px solid ${C.purple}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,cursor:"pointer"}}>💬</button>}
                      </div>
                    </div>
                    <div style={{padding:"12px 13px"}}>
                      {/* 준비물 */}
                      <div style={{marginBottom:10}}>
                        <p style={{fontSize:13,fontWeight:700,color:C.sub,margin:"0 0 6px",letterSpacing:0.3}}>🎒 준비물</p>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s)).map((s,i)=><span key={`b${i}`} style={{fontSize:13,padding:"3px 10px",borderRadius:20,background:`${ac.color}18`,color:ac.color,fontWeight:600}}>{s}</span>)}
                          {sup.map((s,i)=><span key={`d${i}`} style={{fontSize:13,padding:"3px 10px",borderRadius:20,background:`${C.orange}15`,color:C.orange,fontWeight:600}}>+{s}</span>)}
                          {(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s)).length===0&&sup.length===0&&<span style={{fontSize:13,color:C.sub,opacity:0.6}}>없음</span>}
                        </div>
                      </div>
                      {/* 학원별 할 일 요약 */}
                      <div style={{marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                          <p style={{fontSize:13,fontWeight:800,color:C.sub,margin:0}}>🎯 미션 요약</p>
                          {totalTodoCnt>0&&<span style={{fontSize:12,fontWeight:800,color:allDone?C.green:C.orange}}>{allDone?"✓ 완료":`${doneCnt}/${totalTodoCnt}`}</span>}
                        </div>
                        {totalTodoCnt===0?(
                          <p style={{fontSize:12,color:C.sub,opacity:0.7,margin:0}}>등록된 미션 없음</p>
                        ):(
                          <div style={{display:"flex",flexDirection:"column",gap:5,background:CT.faint,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 10px"}}>
                            {hw.map(h=>(
                              <div key={`hw-summary-${h.id}`} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:h.done?C.sub:C.text,textDecoration:h.done?"line-through":"none"}}>
                                <span>{h.done?"✅":"⬜"}</span>
                                <span style={{flex:1}}>숙제: {h.text}</span>
                                <span style={{fontSize:11,color:C.orange,fontWeight:800}}>+{h.point||DEFAULT_HOMEWORK_SCORE} {TM.xp}</span>
                              </div>
                            ))}
                            {todos.map(t=>(
                              <div key={`todo-summary-${t.id}`} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:t.done?C.sub:C.text,textDecoration:t.done?"line-through":"none"}}>
                                <span>{t.done?"✅":"⬜"}</span>
                                <span style={{flex:1}}>{t.text}</span>
                                <span style={{fontSize:11,color:C.orange,fontWeight:800}}>+{t.point||DEFAULT_HOMEWORK_SCORE} {TM.xp}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={()=>{ setShowDailyModal({academyId:ac.id,date:homeDate,acName:ac.name,acColor:ac.color,baseSupplies:ac.baseSupplies}); setDailyHwInput(""); setDailySupInput(""); setDailyTodoInput(""); setDailyHwPoint(DEFAULT_HOMEWORK_SCORE); setDailyTodoPoint(DEFAULT_HOMEWORK_SCORE); }}
                        style={{width:"100%",padding:"7px 10px",borderRadius:10,border:`1px dashed ${ac.color}40`,background:`${ac.color}06`,color:ac.color,fontSize:13,fontWeight:600,cursor:"pointer"}}>
                        🎯 미션 · 준비물 편집
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 등록 학원 목록 */}
              <div style={{borderTop:`2px solid ${C.border}`,margin:"24px 0 0",paddingTop:18}}>
              <div style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,background:CT.faint,border:`1px solid ${C.border}`,borderRadius:14,padding:"10px 14px"}}>
                  <p style={{fontSize:15,color:C.text,fontWeight:900,margin:0,letterSpacing:0.3}}>📋 등록 학원 <span style={{color:C.sub,fontWeight:700}}>({curAc.length})</span></p>
                  <button onClick={openAdd} style={{fontSize:13,padding:"5px 12px",borderRadius:10,border:"none",background:th.grad,color:"#fff",fontWeight:700,cursor:"pointer"}}>+ 학원 추가</button>
                  {children.filter(c=>c.id!==childId).length>0&&(
                    <button onClick={()=>{ setCopySourceChildId(children.find(c=>c.id!==childId)?.id||""); setCopySelectedAcademyIds([]); setShowAcademyCopyModal(true); }}
                      style={{fontSize:13,padding:"5px 12px",borderRadius:10,border:`1px solid ${th.main}35`,background:th.light,color:th.main,fontWeight:700,cursor:"pointer"}}>
                      📚 학원 복사
                    </button>
                  )}
                </div>
                {curAc.length===0?(
                  <div style={{textAlign:"center",padding:"28px",color:C.sub,fontSize:17,background:mixWhite(th.main,0.93),borderRadius:18,border:`1.5px dashed ${th.main}40`}}>
                    <p style={{fontSize:24,margin:"0 0 8px"}}>🏫</p>위 버튼으로 학원을 등록하세요
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {curAc.map(ac=>(
                      <div key={ac.id} style={{background:CT.card,borderRadius:16,border:`1px solid ${ac.color}2A`,overflow:"hidden",boxShadow:SHADOW.sm}}>
                        <div style={{background:`${ac.color}12`,padding:"10px 13px",display:"flex",alignItems:"center",gap:9,borderBottom:`1px solid ${ac.color}14`}}>
                          <div style={{width:4,height:34,borderRadius:10,background:ac.color,flexShrink:0}}/>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:15,fontWeight:900,margin:0,color:C.text}}>{ac.name}</p>
                            <p style={{fontSize:13,color:C.sub,margin:"2px 0 0",fontWeight:600}}>
                              {ac.useCustomSchedule
                                ? (ac.schedules||[]).map(s=>`${s.day} ${s.time}`).join(" / ")
                                : `${(ac.days||[]).join("·")} · ${ac.time} · ${ac.duration}분`}
                            </p>
                          </div>
                          <button onClick={()=>openEdit(ac)} style={{padding:"4px 9px",borderRadius:10,border:`1px solid ${ac.color}40`,background:"#fff",color:ac.color,fontSize:13,fontWeight:800,cursor:"pointer",flexShrink:0}}>✏️ 수정</button>
                        </div>
                        <div style={{padding:"8px 13px",display:"flex",alignItems:"center",gap:8,background:"#fff"}}>
                          <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:8,minWidth:0}}>
                            <span style={{fontSize:13.5,color:C.sub,fontWeight:600}}>💰 월 {Number(ac.fee).toLocaleString()}원</span>
                            {ac.teacher&&<span style={{fontSize:13.5,color:C.sub,fontWeight:600}}>👩‍🏫 {ac.teacher}</span>}
                          </div>
                          <div style={{display:"flex",gap:5,flexShrink:0}}>
                            {ac.phone&&<a href={`tel:${ac.phone}`} style={{width:30,height:30,borderRadius:10,background:`${C.green}12`,border:`1px solid ${C.green}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,textDecoration:"none"}}>📞</a>}
                            <button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }} style={{width:30,height:30,borderRadius:10,background:C.purpleL,border:`1px solid ${C.purple}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,cursor:"pointer"}}>💬</button>
                            <button onClick={()=>setShowDetailModal(ac)} style={{width:30,height:30,borderRadius:10,background:CT.faint,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,cursor:"pointer"}}>›</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            </div>
          );
        })()}

        {/* ════ 달력 탭 ════ */}
        {tab==="calendar"&&(()=>{
          const selInfo=calSelDate?(()=>{
            const d=new Date(calSelDate), y=d.getFullYear(), m=d.getMonth(), day=d.getDate();
            const dn=getDN(y,m,day);
            const acList=curAc.filter(a=>hasClassOnDay(a,dn));
            const mk=mKey(childId,y,m,day);
            const absOnDay=curAbs.filter(a=>a.date===calSelDate);
            const makeupOnDay=curAbs.filter(a=>a.makeupDate===calSelDate);
            const holiday=getHolidayName(calSelDate);
            return {y,m,day,dn,acList,mk,absOnDay,makeupOnDay,holiday};
          })():null;
          return (
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <button onClick={()=>{ setCalDate(new Date(calDate.getFullYear(),calDate.getMonth()-1,1)); setCalSelDate(null); }} style={{background:CT.card,border:`1px solid ${C.border}`,borderRadius:10,width:36,height:36,fontSize:17,cursor:"pointer",color:C.text}}>‹</button>
                <span style={{fontWeight:800,fontSize:17}}>{calDate.getFullYear()}년 {calDate.getMonth()+1}월</span>
                <button onClick={()=>{ setCalDate(new Date(calDate.getFullYear(),calDate.getMonth()+1,1)); setCalSelDate(null); }} style={{background:CT.card,border:`1px solid ${C.border}`,borderRadius:10,width:36,height:36,fontSize:17,cursor:"pointer",color:C.text}}>›</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",textAlign:"center",marginBottom:4}}>
                {["월","화","수","목","금","토","일"].map((d,i)=>(
                  <div key={d} style={{fontSize:13,fontWeight:700,color:i===5?"#3498DB":i===6?"#E74C3C":C.sub,padding:"5px 0"}}>{d}</div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                {calDays.map((day,i)=>{
                  if(!day) return <div key={i}/>;
                  const dn=getDN(calDate.getFullYear(),calDate.getMonth(),day);
                  const acList=curAc.filter(a=>hasClassOnDay(a,dn));
                  const mk=mKey(childId,calDate.getFullYear(),calDate.getMonth(),day);
                  const hasMemo=!!dayMemos[mk];
                  const now=new Date();
                  const isToday=now.getDate()===day&&now.getMonth()===calDate.getMonth()&&now.getFullYear()===calDate.getFullYear();
                  const dateStr=`${calDate.getFullYear()}-${String(calDate.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const absOnDay=curAbs.filter(a=>a.date===dateStr);
                  const makeupOnDay=curAbs.filter(a=>a.makeupDate===dateStr&&!a.makeupDone);
                  const makeupDoneDay=curAbs.filter(a=>a.makeupDate===dateStr&&a.makeupDone);
                  const pendingHwD=acList.some(a=>(getDailyEntry(childId,a.id,dateStr).homeworks||[]).some(h=>!h.done));
                  const doneHwD=acList.some(a=>(getDailyEntry(childId,a.id,dateStr).homeworks||[]).every(h=>h.done)&&(getDailyEntry(childId,a.id,dateStr).homeworks||[]).length>0);
                  const hasExSup=acList.some(a=>(getDailyEntry(childId,a.id,dateStr).supplies||[]).length>0);
                  // 방학 여부
                  const vacAcList=acList.filter(a=>isVacationDay(childId,a.id,dateStr));
                  const hasVac=vacAcList.length>0;
                  const holiday=getHolidayName(dateStr);
                  const isSel=calSelDate===dateStr;
                  const badges=[];
                  if(absOnDay.length>0) badges.push("🏥");
                  if(makeupOnDay.length>0) badges.push("📚");
                  if(makeupDoneDay.length>0) badges.push("✅");
                  if(hasVac) badges.push("🏖️");
                  if(doneHwD&&!hasVac) badges.push("✓");
                  if(hasExSup) badges.push("🎒");
                  if(hasMemo) badges.push("📝");
                  const shuttleToday=acList.some(a=>getShuttleText(a,dn));
                  if(shuttleToday) badges.push("🚌");
                  return (
                    <div key={i} onClick={()=>setCalSelDate(isSel?null:dateStr)}
                      style={{background:isToday?th.main:isSel?`${th.main}15`:hasVac?"#FFF3CD":CT.card,borderRadius:10,padding:"4px 3px 3px",minHeight:68,cursor:"pointer",
                        border:`${isSel?"2px":"1px"} solid ${isToday?"transparent":isSel?th.main:hasVac?"#F0A500":C.border}`,
                        position:"relative",boxShadow:isToday?`0 3px 12px ${th.main}50`:isSel?`0 2px 10px ${th.main}30`:"none",
                        display:"flex",flexDirection:"column",transition:"all 0.15s"}}>
                      {/* 날짜 숫자 - 공휴일이면 빨간색 */}
                      <div style={{fontSize:13,fontWeight:isToday||isSel?900:600,
                        color:isToday?"#fff":isSel?th.main:holiday?"#E74C3C":dn==="일"?"#E74C3C":dn==="토"?"#3498DB":C.text,
                        textAlign:"right",paddingRight:3,marginBottom:1}}>{day}</div>
                      {/* 공휴일 이름 */}
                      {holiday&&!isToday&&(
                        <div style={{fontSize:11,color:"#E74C3C",fontWeight:700,paddingLeft:2,marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}}>
                          {getHolidayName(dateStr)}
                        </div>
                      )}
                      {acList.length>0&&<div style={{display:"flex",gap:2,flexWrap:"wrap",paddingLeft:3,marginBottom:2}}>
                        {acList.map((a,j)=><div key={j} style={{width:7,height:7,borderRadius:"50%",background:isToday?"rgba(255,255,255,0.85)":a.color}}/>)}
                      </div>}
                      {badges.length>0&&<div style={{display:"flex",gap:1,flexWrap:"wrap",paddingLeft:2,marginTop:"auto",paddingBottom:2}}>
                        {badges.slice(0,6).map((b,j)=><span key={j} style={{fontSize:b==="✓"?9:10,color:b==="✓"?C.green:"inherit",fontWeight:b==="✓"?900:"normal",lineHeight:1}}>{b}</span>)}
                      </div>}
                    </div>
                  );
                })}
              </div>

              {/* 범례 */}
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:10,padding:"10px 12px",background:CT.card,borderRadius:10,border:`1px solid ${C.border}`}}>
                {[{icon:"●",label:"학원"},{icon:"🏥",label:"결석"},{icon:"📚",label:"보충예정"},{icon:"✅",label:"보충완료"},{icon:"🏖️",label:"방학"},{icon:"🚌",label:"셔틀"},{icon:"🎒",label:"추가준비물"},{icon:"📝",label:"메모"}].map((l,i)=>(
                  <span key={i} style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:C.sub}}>
                    <span style={{fontSize:i===0?8:i===1?10:11,color:i===0?th.main:i===1?"#E74C3C":"inherit"}}>{l.icon}</span>{l.label}
                  </span>
                ))}
              </div>

              {/* 선택 날짜 상세 */}
              {selInfo&&(
                <div style={{marginTop:14,background:CT.card,borderRadius:14,border:`1.5px solid ${th.main}30`,overflow:"hidden",boxShadow:`0 4px 18px ${th.main}12`}}>
                  <div style={{background:`linear-gradient(135deg, ${mixWhite(th.main,0.68)}, ${mixWhite(th.main,0.84)})`,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <p style={{fontSize:20,fontWeight:900,margin:0,color:mixWhite(th.main,0.08)}}>{selInfo.m+1}월 {selInfo.day}일 <span style={{fontSize:13,fontWeight:700,color:th.main,opacity:0.8}}>{selInfo.dn}요일</span></p>
                        {calSelDate===TODAY&&<span style={{fontSize:13,background:th.main,color:"#fff",borderRadius:10,padding:"2px 10px",fontWeight:800}}>오늘</span>}
                        {selInfo.holiday&&<span style={{fontSize:13,background:C.red,color:"#fff",borderRadius:10,padding:"2px 10px",fontWeight:700}}>🎌 {selInfo.holiday}</span>}
                      </div>
                    </div>
                    <button onClick={()=>setCalSelDate(null)} style={{background:"#fff",border:`1px solid ${th.main}22`,borderRadius:10,width:30,height:30,cursor:"pointer",color:th.main,fontSize:15,fontWeight:800,boxShadow:SHADOW.sm}}>✕</button>
                  </div>
                  <div style={{padding:"16px 16px"}}>
                    {/* 방학 표시 */}
                    {(()=>{
                      const vacOnDay=selInfo.acList.filter(a=>isVacationDay(childId,a.id,calSelDate));
                      if(vacOnDay.length===0) return null;
                      return (
                        <div style={{background:"#FFF8E1",border:"1px solid #F0A500",borderRadius:14,padding:"12px 14px",marginBottom:12}}>
                          <p style={{fontSize:17,fontWeight:700,color:"#E65100",margin:"0 0 6px"}}>🏖️ 방학 중</p>
                          {vacOnDay.map(ac=>(
                            <div key={ac.id} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0"}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:ac.color}}/>
                              <span style={{fontSize:17,fontWeight:600,color:C.text}}>{ac.name}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* 결석 */}
                    {selInfo.absOnDay.length>0&&(
                      <div style={{background:`${C.red}08`,border:`1px solid ${C.red}25`,borderRadius:14,padding:"12px 14px",marginBottom:12}}>
                        <p style={{fontSize:17,fontWeight:700,color:C.red,margin:"0 0 8px"}}>🏥 결석</p>
                        {selInfo.absOnDay.map(ab=>{
                          const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
                          return (
                            <div key={ab.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderTop:`1px solid ${C.red}15`}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:ac.color}}/>
                              <div style={{flex:1}}>
                                <span style={{fontSize:17,fontWeight:700,color:C.text}}>{ac.name}</span>
                                {ab.reason&&<span style={{fontSize:17,color:C.sub,marginLeft:6}}>· {ab.reason}</span>}
                              </div>
                              {ac.phone&&<button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }} style={{fontSize:17,padding:"4px 10px",borderRadius:10,border:`1px solid ${C.purple}30`,background:C.purpleL,color:C.purple,cursor:"pointer",fontWeight:600}}>💬 문자</button>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* 보충수업 */}
                    {selInfo.makeupOnDay.length>0&&(
                      <div style={{background:`${C.orange}08`,border:`1px solid ${C.orange}30`,borderRadius:14,padding:"12px 14px",marginBottom:12}}>
                        <p style={{fontSize:17,fontWeight:700,color:C.orange,margin:"0 0 8px"}}>📚 보충수업</p>
                        {selInfo.makeupOnDay.map(ab=>{
                          const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
                          return (
                            <div key={ab.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderTop:`1px solid ${C.orange}15`}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:ac.color}}/>
                              <div style={{flex:1}}>
                                <span style={{fontSize:17,fontWeight:700,color:C.text}}>{ac.name}</span>
                                <p style={{fontSize:17,color:C.sub,margin:"2px 0 0"}}>결석일: {ab.date}</p>
                              </div>
                              <button onClick={()=>setAbsences(p=>({...p,[childId]:(p[childId]||[]).map(a=>a.id===ab.id?{...a,makeupDone:!a.makeupDone}:a)}))}
                                style={{fontSize:13.5,padding:"5px 12px",borderRadius:10,border:"none",background:ab.makeupDone?`${C.green}18`:CT.faint,color:ab.makeupDone?C.green:C.sub,cursor:"pointer",fontWeight:800}}>
                                {ab.makeupDone?"✓ 완료":"미완료"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* 메모 */}
                    <div style={{marginBottom:14}}>
                      <p style={{fontSize:17,fontWeight:700,color:C.sub,margin:"0 0 7px",letterSpacing:0.5}}>📝 날짜 메모</p>
                      <div style={{display:"flex",gap:8}}>
                        <input value={dayMemos[selInfo.mk]||""} onChange={e=>setDayMemos(p=>({...p,[selInfo.mk]:e.target.value}))}
                          placeholder="메모 입력..."
                          style={{flex:1,background:CT.faint,border:`1px solid ${CT.faintB}`,borderRadius:10,padding:"9px 12px",fontSize:17,color:C.text,outline:"none"}}/>
                        {dayMemos[selInfo.mk]&&<button onClick={()=>setDayMemos(p=>({...p,[selInfo.mk]:""}))} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",fontSize:15}}>✕</button>}
                      </div>
                    </div>
                    {selInfo.acList.length===0&&selInfo.absOnDay.length===0&&selInfo.makeupOnDay.length===0&&(
                      <div style={{textAlign:"center",padding:"20px 0",color:C.sub,fontSize:13}}>
                        <p style={{fontSize:24,margin:"0 0 6px"}}>😴</p>학원이 없는 날이에요
                      </div>
                    )}
                    {/* 학원별 숙제/준비물 - 방학 중인 학원 제외 */}
                    {selInfo.acList.filter(ac=>!isVacationDay(childId,ac.id,calSelDate)).map(ac=>{
                      const entry=getDailyEntry(childId,ac.id,calSelDate);
                      const hw=entry.homeworks||[], sup=entry.supplies||[], todos=entry.todos||[];
                      const totalTodoCnt=hw.length+todos.length;
                      const doneCnt=hw.filter(h=>h.done).length+todos.filter(t=>t.done).length;
                      const allDone=totalTodoCnt>0&&doneCnt===totalTodoCnt;
                      const sc=getScheduleForDay(ac,selInfo.dn);
                      const [h,m]=(sc?.time||"00:00").split(":").map(Number);
                      const tm=h*60+m+Number(sc?.duration||0);
                      const endT=`${String(Math.floor(tm/60)%24).padStart(2,"0")}:${String(tm%60).padStart(2,"0")}`;
                      return (
                        <div key={ac.id} style={{marginBottom:10,borderRadius:16,border:`1px solid ${ac.color}2A`,overflow:"hidden",boxShadow:SHADOW.sm}}>
                          <div style={{background:`${ac.color}12`,padding:"11px 13px",display:"flex",alignItems:"center",gap:11}}>
                            <div style={{width:4,height:40,borderRadius:10,background:ac.color,flexShrink:0}}/>
                            <div style={{flex:1,minWidth:0}}>
                              <p style={{fontSize:15,fontWeight:800,margin:0,color:C.text}}>{ac.name}</p>
                              <p style={{fontSize:13,color:C.sub,margin:"2px 0 0"}}>{sc?.time} ~ {endT} · {sc?.duration}분</p>
                              {(()=>{
                                const shuttleText=getShuttleText(ac,selInfo.dn);
                                if(!shuttleText) return null;
                                return <p style={{fontSize:12,color:C.sub,margin:"3px 0 0",lineHeight:1.35,whiteSpace:"pre-wrap"}}>🚌 {shuttleText}</p>;
                              })()}
                            </div>
                            {totalTodoCnt>0&&<span style={{fontSize:12,fontWeight:800,color:allDone?C.green:C.orange,background:allDone?`${C.green}15`:`${C.orange}15`,borderRadius:10,padding:"3px 9px",flexShrink:0}}>{allDone?"✓ 완료":`${doneCnt}/${totalTodoCnt}`}</span>}
                          </div>
                          <div style={{padding:"12px 13px"}}>
                            <div style={{marginBottom:10}}>
                              <p style={{fontSize:13,fontWeight:700,color:C.sub,margin:"0 0 6px",letterSpacing:0.3}}>🎒 준비물</p>
                              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                                {(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s)).map((s,i)=><span key={`b${i}`} style={{fontSize:13,padding:"3px 10px",borderRadius:20,background:`${ac.color}18`,color:ac.color,fontWeight:600}}>{s}</span>)}
                                {sup.map((s,i)=><span key={`d${i}`} style={{fontSize:13,padding:"3px 10px",borderRadius:20,background:`${C.orange}15`,color:C.orange,fontWeight:600}}>+{s}</span>)}
                                {(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s)).length===0&&sup.length===0&&<span style={{fontSize:13,color:C.sub,opacity:0.6}}>없음</span>}
                              </div>
                            </div>
                            <button onClick={()=>{ setShowDailyModal({academyId:ac.id,date:calSelDate,acName:ac.name,acColor:ac.color,baseSupplies:ac.baseSupplies}); setDailyHwInput(""); setDailySupInput(""); setDailyTodoInput(""); setDailyHwPoint(DEFAULT_HOMEWORK_SCORE); setDailyTodoPoint(DEFAULT_HOMEWORK_SCORE); }}
                              style={{width:"100%",padding:"7px 10px",borderRadius:10,border:`1px dashed ${ac.color}40`,background:`${ac.color}06`,color:ac.color,fontSize:13,fontWeight:600,cursor:"pointer"}}>
                              🎯 미션 · 준비물 편집
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {!selInfo&&<div style={{marginTop:12,textAlign:"center",padding:"18px",color:C.sub,fontSize:17,background:mixWhite(th.main,0.93),borderRadius:18,border:`1.5px dashed ${th.main}40`}}>날짜를 탭하면 학원·숙제·결석·보충수업을 확인할 수 있어요</div>}

              {/* 주간 시간표 */}
              <div style={{background:CT.card,borderRadius:18,border:`1px solid ${th.main}22`,padding:"15px",marginTop:14,marginBottom:14,boxShadow:SHADOW.sm}}>
                <p style={{fontSize:17,fontWeight:900,margin:"0 0 4px",color:C.text}}>📅 주간 시간표</p>
                <p style={{fontSize:13,fontWeight:700,color:C.sub,margin:"0 0 12px"}}>{curChild?.name}의 요일별 학원 일정</p>
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                  {getWeeklySchedule(childId).map(({day,items})=>{
                    const isTodayRow=day===todayDN();
                    return (
                      <div key={day} style={{display:"flex",flexDirection:"column",gap:6,minWidth:0}}>
                        <div style={{textAlign:"center",fontSize:13,fontWeight:900,padding:"6px 0",borderRadius:10,background:isTodayRow?th.main:CT.faint,color:isTodayRow?"#fff":C.sub,border:isTodayRow?"none":`1px solid ${C.border}`}}>
                          {day}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:5,minHeight:44}}>
                          {items.length===0?(
                            <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",fontSize:13,color:mixWhite(th.main,0.55),paddingTop:6}}>·</div>
                          ):(
                            items.map(ac=>(
                              <div key={ac.id} style={{background:`${ac.color}12`,border:`1px solid ${ac.color}33`,borderRadius:10,padding:"5px 2px",textAlign:"center",minWidth:0}}>
                                <p style={{fontSize:11,fontWeight:700,margin:0,color:ac.color,lineHeight:1.2,wordBreak:"break-all",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{ac.name}</p>
                                <p style={{fontSize:11.5,fontWeight:700,margin:"2px 0 0",color:C.sub}}>{ac.classTime}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 방학 전체 관리 버튼 */}
              <button onClick={()=>{ setVacForm({academyId:"",start:TODAY,end:TODAY}); setShowVacModal({date:TODAY,acList:curAc}); }}
                style={{width:"100%",marginTop:12,padding:"9px",borderRadius:10,border:"1px dashed #F0A500",background:"#FFFBF0",color:"#E65100",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                🏖️ 방학 기간 관리
              </button>
            </div>
          );
        })()}

        {/* ════ 학원비 탭 ════ */}
        {tab==="fee"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <button onClick={()=>setFeeMonth(m=>Math.max(1,m-1))} style={{background:CT.card,border:`1px solid ${C.border}`,borderRadius:10,width:34,height:34,fontSize:15,cursor:"pointer",color:C.text}}>‹</button>
              <span style={{fontWeight:800,fontSize:15}}>{feeMonth}월 학원비</span>
              <button onClick={()=>setFeeMonth(m=>Math.min(12,m+1))} style={{background:CT.card,border:`1px solid ${C.border}`,borderRadius:10,width:34,height:34,fontSize:15,cursor:"pointer",color:C.text}}>›</button>
            </div>
            <div style={{background:`linear-gradient(165deg, ${mixWhite(th.main,0.95)} 0%, ${mixWhite(th.main,0.72)} 100%)`,borderRadius:20,padding:"18px 20px",marginBottom:16,color:C.text,textAlign:"center",boxShadow:SHADOW.md,border:`1px solid ${th.main}33`}}>
              <p style={{fontSize:13,color:C.sub,margin:0,fontWeight:700}}>{getGenderEmoji(curChild)} {curChild?.name} 총 학원비</p>
              <p style={{fontSize:26,fontWeight:900,margin:"5px 0 3px",color:mixWhite(th.main,0.08)}}>{totalFee(childId).toLocaleString()}원</p>
              <p style={{fontSize:13,color:th.main,margin:0,fontWeight:800}}>납부 {curAc.filter(a=>isPaid(a.id)).length}/{curAc.length}개 완료</p>
            </div>
            {curAc.map(a=>{
              const st=payStatus(a);
              return (
                <div key={a.id} style={{background:CT.card,borderRadius:18,padding:"14px 16px",marginBottom:10,border:`1px solid ${isPaid(a.id)?C.green+"40":th.main+"22"}`,boxShadow:SHADOW.sm}}>
                  <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:11}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:a.color,flexShrink:0}}/>
                    <p style={{fontSize:15,fontWeight:800,margin:0,flex:1,color:C.text}}>{a.name}</p>
                    <button onClick={()=>togglePaid(a.id)} style={{padding:"5px 12px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13.5,fontWeight:800,background:isPaid(a.id)?`${C.green}18`:CT.faint,color:isPaid(a.id)?C.green:C.sub}}>
                      {isPaid(a.id)?"✓ 납부완료":"미납"}
                    </button>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                    <div style={{display:"flex",gap:22}}>
                      <div><p style={{fontSize:13.5,color:C.sub,margin:0,fontWeight:600}}>월 학원비</p><p style={{fontSize:15,fontWeight:800,margin:"2px 0 0",color:C.text}}>{Number(a.fee).toLocaleString()}원</p></div>
                      <div><p style={{fontSize:13.5,color:C.sub,margin:0,fontWeight:600}}>납부일</p><p style={{fontSize:15,fontWeight:800,margin:"2px 0 0",color:C.text}}>매월 {a.payDay}일</p></div>
                    </div>
                    <span style={{fontSize:13,fontWeight:700,padding:"4px 10px",borderRadius:10,background:`${st.color}15`,color:st.color}}>{st.label}</span>
                  </div>
                </div>
              );
            })}
            {curAc.length===0&&<div style={{textAlign:"center",padding:"40px",color:C.sub,fontSize:13,background:mixWhite(th.main,0.93),borderRadius:18,border:`1.5px dashed ${th.main}40`}}>등록된 학원이 없어요</div>}
          </div>
        )}

        {/* ════ 결석 탭 ════ */}
        {tab==="absence"&&(
          <div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[{l:"전체",v:curAbs.length,c:C.red},{l:"보충 예정",v:curAbs.filter(a=>a.makeupDate&&!a.makeupDone).length,c:C.orange},{l:"보충 완료",v:curAbs.filter(a=>a.makeupDone).length,c:C.green}].map((s,i)=>(
                <div key={i} style={{flex:1,background:CT.card,borderRadius:16,padding:"12px 8px",textAlign:"center",border:`1px solid ${s.c}33`,boxShadow:SHADOW.sm}}>
                  <p style={{fontSize:13,color:C.sub,margin:0,fontWeight:600}}>{s.l}</p>
                  <p style={{fontSize:20,fontWeight:800,margin:"3px 0 0",color:s.c}}>{s.v}</p>
                </div>
              ))}
            </div>
            <button onClick={()=>setShowAbsModal(true)} style={{width:"100%",padding:"10px",borderRadius:10,border:`1px dashed ${C.red}40`,background:`${C.red}06`,color:C.red,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:16}}>+ 결석 기록 추가</button>
            {[...curAbs].sort((a,b)=>b.date.localeCompare(a.date)).map(ab=>{
              const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
              const past=ab.makeupDate&&ab.makeupDate<TODAY;
              return (
                <div key={ab.id} style={{background:CT.card,borderRadius:18,padding:"14px 16px",marginBottom:10,border:`1px solid ${ab.makeupDone?C.green+"33":th.main+"22"}`,boxShadow:SHADOW.sm}}>
                  <div style={{display:"flex",gap:9}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:ac.color,marginTop:5,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <p style={{fontWeight:800,fontSize:15,margin:0,color:C.text}}>{ac.name}</p>
                        <button onClick={()=>deleteAbs(ab.id)} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",fontSize:15}}>✕</button>
                      </div>
                      <p style={{fontSize:13.5,color:C.sub,margin:"3px 0 10px",fontWeight:600}}>결석일: {ab.date}{ab.reason&&` · ${ab.reason}`}</p>
                      <div style={{padding:"11px 13px",borderRadius:10,background:ab.makeupDone?`${C.green}0D`:past?`${C.red}0D`:CT.faint,border:`1px solid ${ab.makeupDone?C.green+"33":past?C.red+"33":CT.faintB}`}}>
                        {ab.makeupDate?(
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <p style={{fontSize:11.5,color:C.sub,margin:0,fontWeight:600}}>보충 일정</p>
                              <p style={{fontSize:13,fontWeight:800,margin:"2px 0 0",color:ab.makeupDone?C.green:past?C.red:C.text}}>{ab.makeupDate}</p>
                              {past&&!ab.makeupDone&&<p style={{fontSize:11.5,color:C.red,margin:"2px 0 0",fontWeight:600}}>⚠️ 보충일이 지났어요</p>}
                            </div>
                            <button onClick={()=>toggleMakeup(ab.id)} style={{padding:"5px 12px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13.5,fontWeight:800,background:ab.makeupDone?`${C.green}18`:CT.faint,color:ab.makeupDone?C.green:C.sub}}>{ab.makeupDone?"✓ 완료":"미완료"}</button>
                          </div>
                        ):<p style={{fontSize:13,color:C.sub,margin:0,fontWeight:600}}>📭 보충 일정 미정</p>}
                      </div>
                      <button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }} style={{width:"100%",marginTop:9,padding:"8px",borderRadius:10,border:`1px solid ${C.purple}30`,background:C.purpleL,color:C.purple,fontSize:13,fontWeight:700,cursor:"pointer"}}>💬 결석 안내 문자 보내기</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {curAbs.length===0&&<div style={{textAlign:"center",padding:"40px 20px",background:mixWhite(th.main,0.93),borderRadius:18,border:`1.5px dashed ${th.main}40`}}><p style={{fontSize:32,margin:0}}>🙌</p><p style={{color:C.sub,fontSize:13,margin:"8px 0 0"}}>결석 기록이 없어요!</p></div>}
          </div>
        )}

        {/* ════ 보상 탭 ════ */}
        {tab==="reward"&&(
          <div>
            {/* 오늘의 미션 카드 */}
            {(()=>{
              const rewardTodayTodos=getQuestItemsForDate(childId,TODAY);
              const doneCnt=rewardTodayTodos.filter(i=>i.done).length;
              const allDone=rewardTodayTodos.length>0&&doneCnt===rewardTodayTodos.length;
              return (
                <div style={{background:CT.card,borderRadius:20,padding:"16px",marginBottom:12,border:`1.5px solid ${allDone?C.green+"40":th.main+"1A"}`,boxShadow:SHADOW.sm}}>
                  <button onClick={()=>setShowParentTodayQuest(v=>!v)}
                    style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                    <div style={{textAlign:"left"}}>
                      <p style={{fontSize:17,fontWeight:900,margin:"0 0 3px",color:C.text}}>🎯 오늘의 미션</p>
                      <p style={{fontSize:13,color:C.sub,margin:0,fontWeight:700}}>{doneCnt}/{rewardTodayTodos.length} 완료 · 오늘 미션 관리</p>
                    </div>
                    <span style={{fontSize:13,fontWeight:900,color:allDone?C.green:C.orange,background:allDone?`${C.green}15`:`${C.orange}15`,padding:"6px 9px",borderRadius:14}}>
                      {showParentTodayQuest?"접기 ▲":"열기 ▼"}
                    </span>
                  </button>
                  {showParentTodayQuest&&(
                    <div style={{marginTop:14}}>
                      <button onClick={()=>setShowTodoPickerModal(TODAY)}
                        style={{width:"100%",padding:"9px 10px",borderRadius:10,border:`1px dashed ${th.main}50`,background:`${th.main}08`,color:th.main,fontSize:13,fontWeight:900,cursor:"pointer",marginBottom:10}}>
                        ✏️ 미션 수정
                      </button>
                      {rewardTodayTodos.length===0?(
                        <div style={{textAlign:"center",padding:"18px 10px",color:C.sub}}>
                          <p style={{fontSize:24,margin:0}}>🌿</p>
                          <p style={{fontSize:13,margin:"6px 0 0"}}>등록된 미션이 없어요</p>
                        </div>
                      ):(
                        <div style={{display:"flex",flexDirection:"column",gap:7}}>
                          {rewardTodayTodos.map(item=>(
                            <div key={`${item.kind}-${item.academyId}-${item.date}-${item.id}`} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",borderRadius:10,background:item.done?`${C.green}10`:item.failed?`${C.red}08`:CT.faint,border:`1px solid ${item.done?C.green+"30":item.failed?C.red+"30":C.border}`}}>
                              <button onClick={()=>{
                                if(item.failed) return;
                                if(item.kind==="homework") toggleHomeworkDone(childId,item.academyId,item.date,item.id);
                                else toggleTodoDone(childId,item.academyId,item.date,item.id);
                              }} style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${item.done?C.green:item.failed?C.red:"#CCC"}`,background:item.done?C.green:item.failed?C.red:"transparent",color:"#fff",fontWeight:900,cursor:item.failed?"default":"pointer",flexShrink:0,fontSize:13}}>
                                {item.done?"✓":item.failed?"×":""}
                              </button>
                              <div style={{flex:1,minWidth:0}}>
                                <p style={{fontSize:11,color:item.academyColor,margin:"0 0 1px",fontWeight:800}}>
                                  {item.kind==="homework"?"📚":"✅"} {item.academyName}{item.kind==="homework"?" 미션":""}
                                </p>
                                <p style={{fontSize:15,fontWeight:700,margin:0,color:item.done||item.failed?C.sub:C.text,textDecoration:item.done||item.failed?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.label}</p>
                              </div>
                              <span style={{fontSize:11,color:item.failed?C.red:C.orange,fontWeight:800,flexShrink:0}}>
                                {item.failed?"실패":`+${item.point||DEFAULT_HOMEWORK_SCORE} ${TM.xp}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {getChildRewardRequests(childId).filter(r=>r.status==="pending").length>0&&(
              <div style={{background:mixWhite(C.orange,0.9),border:`1.5px solid ${C.orange}55`,borderRadius:20,padding:"16px",marginBottom:14,boxShadow:SHADOW.sm}}>
                <p style={{fontSize:17,fontWeight:900,margin:"0 0 10px",color:mixWhite(C.orange,0.1)}}>🔔 확인 필요한 구매 요청</p>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {getChildRewardRequests(childId).filter(r=>r.status==="pending").map(req=>(
                    <div key={req.id} style={{background:"#fff",borderRadius:16,padding:"12px",border:`1px solid ${C.orange}40`,boxShadow:SHADOW.sm}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <span style={{fontSize:24}}>{req.emoji}</span>
                        <div style={{flex:1}}>
                          <p style={{fontSize:15,fontWeight:900,margin:0,color:C.text}}>{req.title}</p>
                          <p style={{fontSize:13,color:C.sub,fontWeight:700,margin:"2px 0 0"}}>{req.point} {TM.coin} 사용</p>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>approveRewardRequest(req.id)}
                          style={{flex:1,border:"none",background:C.green,color:"#fff",borderRadius:10,padding:"10px",fontSize:13,fontWeight:900,cursor:"pointer"}}>승인</button>
                        <button onClick={()=>rejectRewardRequest(req.id)}
                          style={{flex:1,border:`1px solid ${C.red}40`,background:`${C.red}0A`,color:C.red,borderRadius:10,padding:"10px",fontSize:13,fontWeight:900,cursor:"pointer"}}>거절</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 보상 관리 */}
            <div style={{background:CT.card,borderRadius:20,padding:"16px",marginBottom:14,border:`1px solid ${th.main}30`,boxShadow:SHADOW.sm}}>
              <button onClick={()=>setShowParentRewardManage(v=>!v)}
                style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                <div style={{textAlign:"left"}}>
                  <p style={{fontSize:17,fontWeight:900,margin:"0 0 3px",color:C.text}}>🎁 보상 관리</p>
                  <p style={{fontSize:13,color:C.sub,margin:0,fontWeight:700}}>보상 목록 추가/삭제</p>
                </div>
                <span style={openClosePill(showParentRewardManage)}>
                  {openCloseLabel(showParentRewardManage)}
                </span>
              </button>
              {showParentRewardManage&&(
                <div style={{marginTop:14}}>
                  <button onClick={()=>{ setEditingRewardId(null); setRewardForm({title:"",point:300,emoji:"🎁",grade:"common"}); setShowRewardModal(true); }}
                    style={{width:"100%",border:"none",background:th.grad,color:"#fff",borderRadius:10,padding:"10px 12px",fontSize:13,fontWeight:900,cursor:"pointer",marginBottom:10}}>
                    + 보상 추가
                  </button>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {getChildRewards().map(reward=>(
                      <div key={reward.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:14,background:CT.faint,border:`1px solid ${C.border}`}}>
                        <span style={{fontSize:24}}>{reward.emoji}</span>
                        <div style={{flex:1}}>
                          <p style={{fontSize:15,fontWeight:900,margin:0,color:C.text}}>{reward.title}</p>
                          <p style={{fontSize:13,color:C.sub,fontWeight:700,margin:"2px 0 0"}}>{reward.point} {TM.coinEmoji} {TM.coin} 필요</p>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          <button onClick={()=>openEditReward(reward)}
                            style={{border:`1px solid ${th.main}30`,background:th.light,color:th.main,borderRadius:10,padding:"5px 9px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
                            수정
                          </button>
                          <button onClick={()=>deleteReward(reward.id)}
                            style={{border:`1px solid ${C.red}30`,background:`${C.red}0A`,color:C.red,borderRadius:10,padding:"5px 9px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 꾸미기 상점은 카탈로그 기본 가격으로 자동 운영 — 부모 가격 설정 UI 제거 */}

            {/* 성장 관리 */}
            <div style={{background:CT.card,borderRadius:20,padding:"16px",marginBottom:14,border:`1px solid ${th.main}30`,boxShadow:SHADOW.sm}}>
              <button onClick={()=>setShowParentGrowthManage(v=>!v)}
                style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                <div style={{textAlign:"left"}}>
                  <p style={{fontSize:17,fontWeight:900,margin:"0 0 3px",color:C.text}}>🎮 성장 관리</p>
                  <p style={{fontSize:13,color:C.sub,margin:0,fontWeight:700}}>{TM.book} · 연속 달성 · 상장</p>
                </div>
                <span style={openClosePill(showParentGrowthManage)}>{openCloseLabel(showParentGrowthManage)}</span>
              </button>
              {showParentGrowthManage&&(
                <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:10}}>
                  {(()=>{
                    const level=getChildLevel(childId);
                    const evo=getCharacterEvolution(childId);
                    const evoList=kidSkin==="cute"?BAKERY_EVOLUTIONS:CHARACTER_EVOLUTIONS;
                    const nextEvoRaw=[...evoList]
                      .sort((a,b)=>a.minLevel-b.minLevel)
                      .find(e=>e.minLevel>level.level);
                    const nextEvo=nextEvoRaw
                      ? evoView(nextEvoRaw,evoList.findIndex(e=>e.minLevel===nextEvoRaw.minLevel),kidSkin)
                      : null;

                    const treasure=getChildTreasure(childId);
                    const title=getSelectedTitle(childId);
                    const rarity=TITLE_RARITY[title.rarity||"common"];

                    return (
                      <>
                        {/* 캐릭터 성장 현황 */}
                        <div style={parentInnerCard}>
                          <p style={parentInnerTitle}>🧬 캐릭터 성장 : {curChild?.name}</p>

                          <div style={{
                            display:"flex",
                            alignItems:"center",
                            gap:12,
                            background:"#fff",
                            border:`1px solid ${C.border}`,
                            borderRadius:14,
                            padding:"12px",
                            marginTop:10
                          }}>
                            <div style={{
                              position:"relative",
                              width:58,
                              height:58,
                              borderRadius:20,
                              background:evo.bg,
                              border:`2px solid ${GP.gold}55`,
                              display:"flex",
                              alignItems:"center",
                              justifyContent:"center",
                              fontSize:32,
                              flexShrink:0
                            }}>
                              {getCharacterAvatar(childId)}
                              <span style={{
                                position:"absolute",
                                right:-5,
                                bottom:-5,
                                width:24,
                                height:24,
                                borderRadius:"50%",
                                background:"#fff",
                                border:`2px solid ${GP.gold}`,
                                display:"flex",
                                alignItems:"center",
                                justifyContent:"center",
                                fontSize:13
                              }}>
                                {level.emoji}
                              </span>
                            </div>

                            <div style={{flex:1,minWidth:0}}>
                              <p style={{fontSize:15,fontWeight:900,color:C.text,margin:0}}>
                                {level.emoji} Lv.{level.level} {level.name}
                              </p>
                              <p style={{fontSize:15,fontWeight:900,color:C.text,margin:"4px 0 0"}}>
                                {TM.xpEmoji} {getChildXP(childId)} {TM.xp}
                              </p>
                              <p style={{fontSize:15,fontWeight:900,color:C.text,margin:"4px 0 0"}}>
                                {TM.coinEmoji} {getChildCoin(childId)} {TM.coin}
                              </p>
                              {getNextLevel(childId)&&(
                                <p style={{fontSize:11,fontWeight:700,color:C.sub,margin:"8px 0 0"}}>
                                  다음 레벨까지 {getLevelProgressInfo(childId).remainXp} {TM.xp} 남음
                                </p>
                              )}
                            </div>
                          </div>
                          {evoMsgView(evo.name,kidSkin)&&(
                            <p style={{fontSize:12.5,fontWeight:700,color:C.sub,lineHeight:1.55,margin:"10px 2px 0"}}>
                              {evo.emoji?`${evo.emoji} `:""}{evoMsgView(evo.name,kidSkin)}
                            </p>
                          )}
                        </div>

                        {/* 보물창고 */}
                        <div style={parentInnerCard}>
                          <p style={parentInnerTitle}>{TM.bookEmoji} {TM.book}</p>
                          <p style={parentInnerSub}>
                            미션 완료 누적 {treasure.completedQuestCount||0}개 · {kidSkin==="cute"?TM.box:"상자"} 총 {getTotalTreasureCount(childId)}개 보유
                          </p>

                          <div style={{
                            display:"grid",
                            gridTemplateColumns:"repeat(3,1fr)",
                            gap:8,
                            marginTop:10
                          }}>
                            {[
                              {label:getBoxInfo("normal",kidSkin).name,emoji:getBoxInfo("normal",kidSkin).emoji,count:treasure.normalBox||0,range:"20~40",color:C.sub},
                              {label:getBoxInfo("rare",kidSkin).name,emoji:getBoxInfo("rare",kidSkin).emoji,count:treasure.rareBox||0,range:"40~80",color:C.purple},
                              {label:getBoxInfo("legend",kidSkin).name,emoji:getBoxInfo("legend",kidSkin).emoji,count:treasure.legendBox||0,range:"100~160",color:"#F5B301"},
                            ].map(box=>(
                              <div key={box.label} style={{
                                background:"#fff",
                                border:`1px solid ${C.border}`,
                                borderRadius:14,
                                padding:"10px 6px",
                                textAlign:"center"
                              }}>
                                <p style={{fontSize:20,margin:0}}>{box.emoji}</p>
                                <p style={{fontSize:17,fontWeight:900,margin:"3px 0 0",color:box.color}}>
                                  {box.count}
                                </p>
                                <p style={{fontSize:11,color:C.sub,fontWeight:800,margin:0}}>
                                  {box.label}
                                </p>
                                <p style={{fontSize:11,color:C.sub,fontWeight:700,margin:"3px 0 0"}}>
                                  {TM.coinEmoji} {box.range}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 연속 달성 */}
                        <div style={parentInnerCard}>
                          <p style={parentInnerTitle}>🔥 연속 달성</p>
                          <p style={parentInnerSub}>미션을 빠짐없이 완료한 기록이에요.</p>

                          <div style={{
                            display:"grid",
                            gridTemplateColumns:"1fr 1fr",
                            gap:8,
                            marginTop:10
                          }}>
                            <div style={{
                              background:"#fff",
                              border:`1px solid ${C.border}`,
                              borderRadius:14,
                              padding:"10px",
                              textAlign:"center"
                            }}>
                              <p style={{fontSize:11,color:C.sub,fontWeight:800,margin:"0 0 3px"}}>현재</p>
                              <p style={{fontSize:20,fontWeight:900,margin:0,color:C.text}}>
                                {getQuestStreak(childId)}일
                              </p>
                            </div>

                            <div style={{
                              background:"#fff",
                              border:`1px solid ${C.border}`,
                              borderRadius:14,
                              padding:"10px",
                              textAlign:"center"
                            }}>
                              <p style={{fontSize:11,color:C.sub,fontWeight:800,margin:"0 0 3px"}}>최고 기록</p>
                              <p style={{fontSize:20,fontWeight:900,margin:0,color:GP.gold}}>
                                {getBestStreak(childId)}일
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 상장 관리 */}
                        <div style={parentInnerCard}>
                          <p style={parentInnerTitle}>👑 상장 관리</p>
                          <p style={parentInnerSub}>
                            현재 전시 중인 상장과 전체 획득 현황이에요.
                          </p>

                          <div style={{
                            background:"#fff",
                            border:`1.5px solid ${rarity.color}55`,
                            borderRadius:14,
                            padding:"11px 12px",
                            marginTop:10,
                            display:"flex",
                            alignItems:"center",
                            justifyContent:"space-between",
                            gap:10
                          }}>
                            <div>
                              <p style={{fontSize:15,fontWeight:900,color:C.text,margin:"0 0 3px"}}>
                                {title.emoji} {title.name}
                              </p>
                              <p style={{fontSize:11,fontWeight:900,color:rarity.color,margin:0}}>
                                {rarity.icon} {rarity.name}
                              </p>
                            </div>

                            <span style={{
                              fontSize:13,
                              fontWeight:900,
                              color:th.main,
                              background:th.light,
                              borderRadius:999,
                              padding:"5px 8px",
                              whiteSpace:"nowrap"
                            }}>
                              {getUnlockedTitles(childId).length}/{getAllTitles(childId).length}
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* 기록 관리 */}
            <div style={{background:CT.card,borderRadius:20,padding:"16px",marginBottom:14,border:`1px solid ${th.main}30`,boxShadow:SHADOW.sm}}>
              <button onClick={()=>setShowParentRecordManage(v=>!v)}
                style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                <div style={{textAlign:"left"}}>
                  <p style={{fontSize:17,fontWeight:900,margin:"0 0 3px",color:C.text}}>📖 기록 관리</p>
                  <p style={{fontSize:13,color:C.sub,margin:0,fontWeight:700}}>{T.logName||"활동 기록"} · {TM.xp} 통장</p>
                </div>
                <span style={openClosePill(showParentRecordManage)}>{openCloseLabel(showParentRecordManage)}</span>
              </button>
              {showParentRecordManage&&(
                <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:10}}>
                  {(()=>{
                    const history=getScoreHistory(childId).slice().reverse();
                    const earnedXp=history
                      .filter(h=>Number(h.xp??h.point??0)>0)
                      .reduce((sum,h)=>sum+Number(h.xp??h.point??0),0);

                    const spentCoin=history
                      .filter(h=>Number(h.coin??0)<0)
                      .reduce((sum,h)=>sum+Math.abs(Number(h.coin??0)),0);

                    const earnedCoin=history
                      .filter(h=>Number(h.coin??0)>0)
                      .reduce((sum,h)=>sum+Number(h.coin??0),0);

                    return (
                      <>
                        {/* XP 통장 요약 */}
                        <div style={parentInnerCard}>
                          <p style={parentInnerTitle}>{TM.xpEmoji} {TM.xp} 통장</p>
                          <p style={parentInnerSub}>
                            지금까지 쌓은 {TM.xp}와 {TM.coin} 흐름을 한눈에 확인해요.
                          </p>

                          <div style={{
                            display:"grid",
                            gridTemplateColumns:"repeat(2,1fr)",
                            gap:8,
                            marginTop:10
                          }}>
                            <div style={{
                              background:"#fff",
                              border:`1px solid ${C.border}`,
                              borderRadius:14,
                              padding:"10px",
                              textAlign:"center"
                            }}>
                              <p style={{fontSize:17,margin:0}}>{TM.xpEmoji}</p>
                              <p style={{fontSize:20,fontWeight:900,margin:"3px 0 0",color:C.text}}>
                                {getChildXP(childId)}
                              </p>
                              <p style={{fontSize:11,color:C.sub,fontWeight:800,margin:0}}>
                                현재 {TM.xp}
                              </p>
                            </div>

                            <div style={{
                              background:"#fff",
                              border:`1px solid ${C.border}`,
                              borderRadius:14,
                              padding:"10px",
                              textAlign:"center"
                            }}>
                              <p style={{fontSize:17,margin:0}}>{TM.coinEmoji}</p>
                              <p style={{fontSize:20,fontWeight:900,margin:"3px 0 0",color:C.green}}>
                                {getChildCoin(childId)}
                              </p>
                              <p style={{fontSize:11,color:C.sub,fontWeight:800,margin:0}}>
                                보유 {TM.coin}
                              </p>
                            </div>

                            <div style={{
                              background:"#fff",
                              border:`1px solid ${C.border}`,
                              borderRadius:14,
                              padding:"10px",
                              textAlign:"center"
                            }}>
                              <p style={{fontSize:17,margin:0}}>📈</p>
                              <p style={{fontSize:17,fontWeight:900,margin:"3px 0 0",color:GP.gold}}>
                                {earnedXp}
                              </p>
                              <p style={{fontSize:11,color:C.sub,fontWeight:800,margin:0}}>
                                총 획득 {TM.xp}
                              </p>
                            </div>

                            <div style={{
                              background:"#fff",
                              border:`1px solid ${C.border}`,
                              borderRadius:14,
                              padding:"10px",
                              textAlign:"center"
                            }}>
                              <p style={{fontSize:17,margin:0}}>🛒</p>
                              <p style={{fontSize:17,fontWeight:900,margin:"3px 0 0",color:C.red}}>
                                {spentCoin}
                              </p>
                              <p style={{fontSize:11,color:C.sub,fontWeight:800,margin:0}}>
                                사용 {TM.coin}
                              </p>
                            </div>
                          </div>

                          <div style={{
                            marginTop:10,
                            background:"#fff",
                            border:`1px solid ${C.border}`,
                            borderRadius:14,
                            padding:"10px 12px"
                          }}>
                            <div style={{
                              display:"flex",
                              justifyContent:"space-between",
                              alignItems:"center",
                              marginBottom:6
                            }}>
                              <span style={{fontSize:13,fontWeight:900,color:C.sub}}>
                                {TM.coin} 흐름
                              </span>
                              <span style={{fontSize:13,fontWeight:900,color:C.text}}>
                                획득 {earnedCoin} · 사용 {spentCoin}
                              </span>
                            </div>

                            <JellyBar percent={earnedCoin+spentCoin===0?0:Math.min(100,Math.round((earnedCoin/(earnedCoin+spentCoin))*100))} height={9} fallbackTrack={CT.faint} fallbackFill={`linear-gradient(90deg, ${C.green}, ${GP.gold})`} fallbackBorder="none" fallbackGlow="none" />
                          </div>
                        </div>

                        {/* 모험기록 상세 */}
                        <div style={parentInnerCard}>
                          <p style={parentInnerTitle}>📖 {T.logName||"활동 기록"}</p>
                          <p style={parentInnerSub}>
                            최근 미션 완료, {kidSkin==="cute"?TM.box:"보물상자"}, 보상 구매 기록이에요.
                          </p>

                          <div style={{marginTop:10}}>
                            {history.length===0 ? (
                              <div style={{
                                textAlign:"center",
                                padding:"20px 10px",
                                background:"#fff",
                                border:`1px dashed ${C.border}`,
                                borderRadius:14
                              }}>
                                <p style={{fontSize:28,margin:"0 0 5px"}}>📖</p>
                                <p style={{fontSize:13,color:C.sub,fontWeight:800,margin:0}}>
                                  아직 기록이 없어요.
                                </p>
                              </div>
                            ) : (
                              history.slice(0,10).map(item=>{
                                const info=getAdventureLogInfo(item);
                                const xp=Number(item.xp??0);
                                const coin=Number(item.coin??0);
                                const isMinus=xp<0||coin<0;

                                return (
                                  <div key={item.id} style={{
                                    display:"flex",
                                    alignItems:"center",
                                    gap:10,
                                    background:"#fff",
                                    border:`1px solid ${isMinus?C.red+"30":C.border}`,
                                    borderRadius:14,
                                    padding:"10px 11px",
                                    marginTop:7
                                  }}>
                                    <div style={{
                                      width:36,
                                      height:36,
                                      borderRadius:"50%",
                                      background:isMinus?`${C.red}10`:CT.faint,
                                      display:"flex",
                                      alignItems:"center",
                                      justifyContent:"center",
                                      fontSize:17,
                                      flexShrink:0
                                    }}>
                                      {info.icon}
                                    </div>

                                    <div style={{flex:1,minWidth:0}}>
                                      <p style={{
                                        fontSize:13,
                                        fontWeight:900,
                                        color:C.text,
                                        margin:0,
                                        overflow:"hidden",
                                        textOverflow:"ellipsis",
                                        whiteSpace:"nowrap"
                                      }}>
                                        {info.title}
                                      </p>

                                      <p style={{
                                        fontSize:11,
                                        color:C.sub,
                                        fontWeight:700,
                                        margin:"2px 0 0",
                                        overflow:"hidden",
                                        textOverflow:"ellipsis",
                                        whiteSpace:"nowrap"
                                      }}>
                                        {item.memo || item.date || ""}
                                      </p>
                                    </div>

                                    <div style={{textAlign:"right",flexShrink:0}}>
                                      {xp!==0&&(
                                        <p style={{
                                          fontSize:13,
                                          fontWeight:900,
                                          margin:0,
                                          color:xp>0?GP.gold:C.red
                                        }}>
                                          {TM.xpEmoji} {xp>0?"+":""}{xp}
                                        </p>
                                      )}

                                      {coin!==0&&(
                                        <p style={{
                                          fontSize:13,
                                          fontWeight:900,
                                          margin:"2px 0 0",
                                          color:coin>0?C.green:C.red
                                        }}>
                                          {TM.coinEmoji} {coin>0?"+":""}{coin}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>

                        {/* 수동 XP 조정 - 기록 관리 맨 아래 */}
                        <div style={parentInnerCard}>
                          <button onClick={()=>setShowParentXpAdjust(v=>!v)}
                            style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                            <div style={{textAlign:"left"}}>
                              <p style={parentInnerTitle}>✍️ 수동 {TM.xp} 조정</p>
                              <p style={{...parentInnerSub,margin:0}}>보너스 지급 / {TM.xp} 차감</p>
                            </div>
                            <span style={{fontSize:13,fontWeight:900,color:th.main,background:th.light,padding:"5px 9px",borderRadius:14}}>
                              {showParentXpAdjust?"닫기 ▲":"열기 ▼"}
                            </span>
                          </button>
                          {showParentXpAdjust&&(
                            <div style={{marginTop:12}}>
                              <div style={{display:"flex",gap:6,marginBottom:8}}>
                                <button onClick={()=>setXpAdjustSign("+")}
                                  style={{flex:1,padding:"8px 0",borderRadius:10,border:`1.5px solid ${xpAdjustSign==="+"?C.green:C.border}`,background:xpAdjustSign==="+"?`${C.green}15`:"#fff",color:xpAdjustSign==="+"?C.green:C.sub,fontSize:13,fontWeight:900,cursor:"pointer"}}>
                                  + 지급
                                </button>
                                <button onClick={()=>setXpAdjustSign("-")}
                                  style={{flex:1,padding:"8px 0",borderRadius:10,border:`1.5px solid ${xpAdjustSign==="-"?C.red:C.border}`,background:xpAdjustSign==="-"?`${C.red}10`:"#fff",color:xpAdjustSign==="-"?C.red:C.sub,fontSize:13,fontWeight:900,cursor:"pointer"}}>
                                  - 차감
                                </button>
                              </div>
                              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                                <input value={xpAdjustLabel} onChange={e=>setXpAdjustLabel(e.target.value)}
                                  placeholder="사유"
                                  style={{flex:1,padding:"9px 10px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:13,outline:"none",background:"#fff",minWidth:0}}/>
                                <input type="number" value={xpAdjustInput} onChange={e=>setXpAdjustInput(e.target.value)}
                                  placeholder={TM.xp}
                                  style={{width:58,padding:"9px 6px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:13,outline:"none",background:"#fff",textAlign:"center",flexShrink:0}}/>
                                <button onClick={()=>{
                                  const v=Number(xpAdjustInput);
                                  if(!v||v<=0){ showToast(`${TM.xp} 값을 입력해줘`); return; }
                                  const point=xpAdjustSign==="+"?v:-v;
                                  addChildScore(childId,point,xpAdjustLabel||"수동 조정","manual");
                                  setXpAdjustInput(""); setXpAdjustLabel("");
                                  showToast(xpAdjustSign==="+"?`+${v} ${TM.xp} 지급 완료`:`-${v} ${TM.xp} 차감 완료`);
                                }} style={{padding:"9px 14px",borderRadius:10,border:"none",background:xpAdjustSign==="+"?C.green:C.red,color:"#fff",fontSize:13,fontWeight:900,cursor:"pointer",flexShrink:0}}>
                                  {xpAdjustSign==="+"?"지급":"차감"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ 문자 탭 ════ */}
        {tab==="etc"&&(
          <div>
            <div style={{...gameCard,padding:"15px 16px",marginBottom:12,border:`1px solid ${th.main}22`,boxShadow:SHADOW.sm}}>
              <p style={{fontSize:15,fontWeight:900,margin:"0 0 3px",color:C.text}}>⚙️ 기타</p>
              <p style={{fontSize:13.5,fontWeight:700,color:C.sub,margin:0}}>
                사용 가이드, 문자관리, 백업/복원, 비밀번호를 관리해요
              </p>
            </div>

            <div style={{...gameCard,padding:"15px 16px",marginBottom:12,border:`1px solid ${th.main}22`,boxShadow:SHADOW.sm}}>
              <button
                onClick={()=>{ setShowSettingsModal(false); setTab("home"); setShowCoachmark(true); }}
                style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left"}}
              >
                <div>
                  <p style={{fontSize:15,fontWeight:900,margin:"0 0 3px",color:C.text}}>📖 사용 가이드 다시 보기</p>
                  <p style={{fontSize:13,fontWeight:700,color:C.sub,margin:0}}>홈부터 각 탭이 어떤 기능인지 다시 안내해요</p>
                </div>
                <span style={openClosePill(true)}>보기</span>
              </button>
            </div>

            {!skinByChild[childId] && (
            <div style={{...gameCard,padding:"15px 16px",marginBottom:12,border:`1px solid ${th.main}22`,boxShadow:SHADOW.sm}}>
              <button
                onClick={()=>{ setShowSettingsModal(false); setShowModeSelect(true); }}
                style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left"}}
              >
                <div>
                  <p style={{fontSize:15,fontWeight:900,margin:"0 0 3px",color:C.text}}>🎨 {children.find(c=>c.id===childId)?.name||"아이"} 게임 디자인 선택</p>
                  <p style={{fontSize:13,fontWeight:700,color:C.sub,margin:0}}>현재: {getSkin(kidSkin).selectEmoji} {getSkin(kidSkin).name} · 한 번 선택하면 변경할 수 없어요</p>
                </div>
                <span style={openClosePill(true)}>선택</span>
              </button>
            </div>
            )}

            <div style={{...gameCard,padding:"15px 16px",marginBottom:12,border:`1px solid ${th.main}22`,boxShadow:SHADOW.sm}}>
              <p style={{fontSize:15,fontWeight:900,margin:"0 0 10px",color:C.text}}>💾 데이터 관리</p>

              <button onClick={exportBackup}
                style={{width:"100%",padding:12,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:13,fontWeight:900,cursor:"pointer",marginBottom:9}}>
                💾 데이터 백업하기
              </button>

              <label style={{display:"block",width:"100%",padding:12,borderRadius:14,border:`1.5px solid ${th.main}35`,background:th.light,color:th.main,fontSize:13,fontWeight:900,textAlign:"center",boxSizing:"border-box",cursor:"pointer"}}>
                📂 데이터 복원하기
                <input
                  type="file"
                  accept="application/json"
                  onChange={e=>importBackup(e.target.files?.[0])}
                  style={{display:"none"}}
                />
              </label>

              <p style={{fontSize:11.5,fontWeight:600,color:C.sub,lineHeight:1.5,margin:"9px 0 0"}}>
                ※ 다른 기기에서도 복원하여 사용할 수 있습니다.
              </p>
            </div>

            <div style={{...gameCard,padding:"15px 16px",marginBottom:12,border:`1px solid ${th.main}22`,boxShadow:SHADOW.sm}}>
              <p style={{fontSize:15,fontWeight:900,margin:"0 0 10px",color:C.text}}>🔐 보안</p>
              <button onClick={()=>setShowPinChangeModal(true)}
                style={{width:"100%",padding:12,borderRadius:14,border:`1.5px solid ${C.border}`,background:CT.faint,color:C.text,fontSize:13,fontWeight:900,cursor:"pointer"}}>
                비밀번호 변경
              </button>
            </div>

            <div style={{...gameCard,padding:"15px 16px",marginBottom:12,border:`1px solid ${th.main}22`,boxShadow:SHADOW.sm}}>
              <button
                onClick={()=>setOpenSmsManage(v=>!v)}
                style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",textAlign:"left"}}
              >
                <div>
                  <p style={{fontSize:15,fontWeight:900,margin:"0 0 3px",color:C.text}}>💬 문자관리</p>
                  <p style={{fontSize:13,fontWeight:700,color:C.sub,margin:0}}>결석 안내, 보충 문의 등 문자 템플릿을 관리해요</p>
                </div>
                <span style={openClosePill(openSmsManage)}>{openCloseLabel(openSmsManage)}</span>
              </button>

              {openSmsManage&&(
                <div style={{marginTop:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <p style={{fontSize:13,color:C.sub,fontWeight:700,margin:0}}>문자 템플릿 관리</p>
              <button onClick={()=>{ setShowTmplEdit("new"); setEditTmpl({title:"",body:""}); }} style={{padding:"6px 12px",borderRadius:10,border:"none",background:th.grad,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ 새 템플릿</button>
            </div>
            <div style={{background:`${C.purple}08`,border:`1px solid ${C.purple}25`,borderRadius:10,padding:"10px 13px",marginBottom:13}}>
              <p style={{fontSize:13,color:C.purple,fontWeight:700,margin:"0 0 6px"}}>📌 사용 가능한 변수</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {["{아이이름}","{학원명}","{날짜}","{시간}"].map(v=><span key={v} style={{fontSize:13,padding:"3px 9px",borderRadius:10,background:C.purpleL,color:C.purple,fontWeight:600}}>{v}</span>)}
              </div>
            </div>
            {templates.map(tmpl=>(
              <div key={tmpl.id} style={{background:CT.card,borderRadius:18,padding:"13px 15px",marginBottom:10,border:`1px solid ${th.main}22`,boxShadow:SHADOW.sm}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontWeight:700,fontSize:13,color:C.text}}>💬 {tmpl.title}</span>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{ setShowTmplEdit(tmpl.id); setEditTmpl({title:tmpl.title,body:tmpl.body}); }} style={{padding:"4px 10px",borderRadius:10,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:13,cursor:"pointer"}}>수정</button>
                    <button onClick={()=>{ setTemplates(p=>p.filter(t=>t.id!==tmpl.id)); showToast("삭제됨"); }} style={{padding:"4px 10px",borderRadius:10,border:`1px solid ${C.red}30`,background:`${C.red}0A`,color:C.red,fontSize:13,cursor:"pointer"}}>삭제</button>
                  </div>
                </div>
                <p style={{fontSize:13,color:C.sub,margin:0,whiteSpace:"pre-wrap",background:CT.faint,borderRadius:10,padding:"9px 11px",lineHeight:1.5}}>{tmpl.body}</p>
              </div>
            ))}
                </div>
              )}
            </div>

            <div style={{...gameCard,padding:"15px 16px",marginTop:12,border:"2px solid #ffb4b4",background:"#fff5f5"}}>
              <p style={{fontSize:15,fontWeight:900,color:"#dc2626",margin:"0 0 4px"}}>⚠️ 위험구역</p>
              <p style={{fontSize:11.5,fontWeight:700,color:"#b91c1c",margin:"0 0 12px",lineHeight:1.4}}>
                초기화는 되돌릴 수 없어요. 미리 데이터 백업을 권장해요.
              </p>

              <button
                onClick={()=>resetGameData(childId)}
                style={{
                  width:"100%",
                  padding:11,
                  borderRadius:10,
                  border:"1.5px solid #fca5a5",
                  background:"#fff",
                  color:"#ea580c",
                  fontSize:13,
                  fontWeight:900,
                  cursor:"pointer",
                  marginBottom:9
                }}
              >
                🗑 현재 아이 초기화
              </button>

              <button
                onClick={resetAllAppData}
                style={{
                  width:"100%",
                  padding:11,
                  borderRadius:10,
                  border:"1.5px solid #f4a0a0",
                  background:"#fef2f2",
                  color:"#dc2626",
                  fontSize:13,
                  fontWeight:900,
                  cursor:"pointer"
                }}
              >
                🗑 전체 데이터 초기화
              </button>
            </div>

            <div style={{...gameCard,padding:"16px",marginTop:14,textAlign:"center"}}>
              <p style={{fontSize:15,fontWeight:900,margin:"0 0 6px",color:C.text}}>ℹ️ 앱 정보</p>
              <p style={{fontSize:13,fontWeight:900,color:C.text,margin:"0 0 3px"}}>
                HARANG 아이 성장 미션
              </p>
              <p style={{fontSize:11,fontWeight:700,color:C.sub,margin:"0 0 6px"}}>
                버전 1.0
              </p>
              <p style={{fontSize:11,fontWeight:700,color:C.sub,margin:0,lineHeight:1.5}}>
                학원 일정과 아이의 성장을 게임처럼 관리하는 플래너
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ════════ 모달들 ════════ */}

      {/* ── 미션 수정 학원 선택 피커 ── */}
      {showTodoPickerModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"flex-end",zIndex:1000}} onClick={()=>setShowTodoPickerModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"22px 18px 44px",width:"100%",maxWidth:430,boxSizing:"border-box",maxHeight:"80vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:900,color:C.text}}>✏️ 미션 수정</h3>
              <button onClick={()=>setShowTodoPickerModal(null)} style={{background:CT.faint,border:"none",borderRadius:10,width:28,height:28,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>
            <p style={{fontSize:13,color:C.sub,fontWeight:600,margin:"0 0 14px"}}>수정할 학원을 선택하거나, 기타 미션을 추가하세요</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {curAc.map(ac=>(
                <button key={ac.id} onClick={()=>{
                  setShowDailyModal({academyId:ac.id,date:showTodoPickerModal,acName:ac.name,acColor:ac.color,baseSupplies:ac.baseSupplies});
                  setDailyHwInput(""); setDailySupInput(""); setDailyTodoInput("");
                  setDailyHwPoint(DEFAULT_HOMEWORK_SCORE); setDailyTodoPoint(DEFAULT_HOMEWORK_SCORE);
                  setShowTodoPickerModal(null);
                }} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:14,border:`1.5px solid ${ac.color}30`,background:`${ac.color}06`,cursor:"pointer",textAlign:"left"}}>
                  <div style={{width:9,height:9,borderRadius:"50%",background:ac.color,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <p style={{fontSize:15,fontWeight:900,margin:0,color:C.text}}>{ac.name}</p>
                    <p style={{fontSize:11,color:C.sub,margin:"2px 0 0",fontWeight:600}}>{getSchedules(ac).map(s=>`${s.day} ${s.time}`).join(" / ")}</p>
                  </div>
                  <span style={{fontSize:13,color:ac.color,fontWeight:700}}>선택 →</span>
                </button>
              ))}
              {/* 기타 미션 */}
              <button onClick={()=>{
                setShowDailyModal({academyId:EXTRA_QUEST_ID,date:showTodoPickerModal,acName:"기타 미션",acColor:th.main,baseSupplies:[]});
                setDailyHwInput(""); setDailySupInput(""); setDailyTodoInput("");
                setDailyHwPoint(DEFAULT_HOMEWORK_SCORE); setDailyTodoPoint(DEFAULT_HOMEWORK_SCORE);
                setShowTodoPickerModal(null);
              }} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:16,border:`1.5px dashed ${th.main}40`,background:`${th.main}06`,cursor:"pointer",textAlign:"left"}}>
                <div style={{width:9,height:9,borderRadius:"50%",background:th.main,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <p style={{fontSize:15,fontWeight:900,margin:0,color:th.main}}>기타 미션</p>
                  <p style={{fontSize:11,color:C.sub,margin:"2px 0 0",fontWeight:600}}>학원 관련 없는 할 일을 추가해요</p>
                </div>
                <span style={{fontSize:13,color:th.main,fontWeight:700}}>선택 →</span>
              </button>
              {curAc.length===0&&<p style={{textAlign:"center",color:C.sub,fontSize:13,padding:"16px 0"}}>등록된 학원이 없어요</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── 보상 추가 모달 ── */}
      {showRewardModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"flex-end",zIndex:1000}} onClick={()=>setShowRewardModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:900,color:C.text}}>🎁 보상 추가</h3>
              <button onClick={()=>setShowRewardModal(false)} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>
            <label style={lbl}>보상 이모지</label>
            <input value={rewardForm.emoji} onChange={e=>setRewardForm(p=>({...p,emoji:e.target.value}))}
              placeholder="예: 🍦" maxLength={4}
              style={{...inp,marginBottom:16,fontSize:24,textAlign:"center"}}/>
            <label style={lbl}>보상 이름 *</label>
            <input value={rewardForm.title} onChange={e=>setRewardForm(p=>({...p,title:e.target.value}))}
              placeholder="예: 아이스크림, 게임 30분, 치킨"
              style={{...inp,marginBottom:16}}/>
            <label style={lbl}>등급</label>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {REWARD_GRADES.map(g=>(
                <button key={g.id} onClick={()=>setRewardForm(p=>({...p,grade:g.id}))}
                  style={{flex:1,padding:"8px 0",borderRadius:10,border:`2px solid ${rewardForm.grade===g.id?g.color:C.border}`,background:rewardForm.grade===g.id?`${g.color}15`:"#fff",color:rewardForm.grade===g.id?g.color:C.sub,fontSize:13,fontWeight:900,cursor:"pointer"}}>
                  {g.name}
                </button>
              ))}
            </div>
            <label style={lbl}>필요 {TM.coin} *</label>
            <input type="number" value={rewardForm.point} onChange={e=>setRewardForm(p=>({...p,point:Number(e.target.value)}))}
              placeholder="예: 300"
              style={{...inp,marginBottom:20}}/>
            <div style={{background:th.light,border:`1px solid ${th.main}30`,borderRadius:14,padding:"14px",marginBottom:20}}>
              <p style={{fontSize:13,fontWeight:800,color:th.main,margin:"0 0 6px"}}>미리보기</p>
              <p style={{fontSize:17,fontWeight:900,color:C.text,margin:0}}>{rewardForm.emoji||"🎁"} {rewardForm.title||"보상 이름"} · {rewardForm.point||0} {TM.coin}</p>
            </div>
            <button onClick={addRewardItem}
              style={{width:"100%",padding:15,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",boxShadow:`0 4px 16px ${th.main}40`}}>
              보상 추가하기
            </button>
          </div>
        </div>
      )}

      {/* ── 비밀번호 변경 모달 ── */}
      {showPinChangeModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={()=>setShowPinChangeModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:24,width:"100%",maxWidth:360,boxSizing:"border-box",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h3 style={{fontSize:20,fontWeight:900,margin:0,color:C.text}}>🔐 엄마 비밀번호 변경</h3>
              <button onClick={()=>setShowPinChangeModal(false)} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>
            <label style={lbl}>기존 비밀번호</label>
            <input type="password" inputMode="numeric" value={oldPinInput} onChange={e=>setOldPinInput(e.target.value)}
              placeholder="현재 비밀번호"
              style={{...inp,marginBottom:14,textAlign:"center",letterSpacing:4,fontSize:20}}/>
            <label style={lbl}>새 비밀번호</label>
            <input type="password" inputMode="numeric" value={newPinInput} onChange={e=>setNewPinInput(e.target.value)}
              placeholder="새 비밀번호 4자리 이상"
              style={{...inp,marginBottom:14,textAlign:"center",letterSpacing:4,fontSize:20}}/>
            <label style={lbl}>새 비밀번호 확인</label>
            <input type="password" inputMode="numeric" value={newPinConfirm} onChange={e=>setNewPinConfirm(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&changeParentPin()}
              placeholder="새 비밀번호 다시 입력"
              style={{...inp,marginBottom:18,textAlign:"center",letterSpacing:4,fontSize:20}}/>
            <button onClick={changeParentPin}
              style={{width:"100%",padding:15,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",marginBottom:8}}>
              변경 완료
            </button>
            <button onClick={()=>{ setShowPinChangeModal(false); setOldPinInput(""); setNewPinInput(""); setNewPinConfirm(""); }}
              style={{width:"100%",padding:12,borderRadius:14,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:15,fontWeight:700,cursor:"pointer"}}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* ── 방학 설정 모달 ── */}
      {showVacModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={()=>setShowVacModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:800,color:C.text}}>🏖️ 방학 기간 설정</h3>
              <button onClick={()=>setShowVacModal(null)} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>

            {/* 방학 추가 폼 */}
            <div style={{background:"#FFFBF0",borderRadius:14,padding:"16px",marginBottom:20,border:"1.5px solid #F0A500"}}>
              <p style={{fontSize:17,fontWeight:700,color:"#E65100",margin:"0 0 14px"}}>새 방학 기간 추가</p>
              <label style={{fontSize:17,color:C.sub,display:"block",marginBottom:6,fontWeight:700}}>학원 선택</label>
              <select value={vacForm.academyId} onChange={e=>setVacForm(p=>({...p,academyId:e.target.value}))}
                style={{width:"100%",boxSizing:"border-box",background:CT.faint,border:`1px solid ${CT.faintB}`,borderRadius:10,padding:"11px 12px",color:C.text,fontSize:17,outline:"none",marginBottom:12}}>
                <option value="">학원 선택</option>
                {(showVacModal.acList||[]).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <div style={{display:"flex",gap:10,marginBottom:14}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:17,color:C.sub,display:"block",marginBottom:6,fontWeight:700}}>시작일</label>
                  <input type="date" value={vacForm.start} onChange={e=>setVacForm(p=>({...p,start:e.target.value}))}
                    style={{width:"100%",boxSizing:"border-box",background:CT.faint,border:`1px solid ${CT.faintB}`,borderRadius:10,padding:"11px 12px",color:C.text,fontSize:17,outline:"none"}}/>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:17,color:C.sub,display:"block",marginBottom:6,fontWeight:700}}>종료일</label>
                  <input type="date" value={vacForm.end} onChange={e=>setVacForm(p=>({...p,end:e.target.value}))}
                    style={{width:"100%",boxSizing:"border-box",background:CT.faint,border:`1px solid ${CT.faintB}`,borderRadius:10,padding:"11px 12px",color:C.text,fontSize:17,outline:"none"}}/>
                </div>
              </div>
              <button onClick={addVacation} style={{width:"100%",padding:13,borderRadius:14,border:"none",background:"linear-gradient(135deg,#F0A500,#FFD54F)",color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer"}}>
                🏖️ 방학 등록
              </button>
            </div>

            {/* 등록된 방학 목록 */}
            <p style={{fontSize:17,fontWeight:700,color:C.sub,margin:"0 0 10px"}}>등록된 방학 기간</p>
            {curAc.map(ac=>{
              const vacs=getVacations(childId,ac.id);
              if(vacs.length===0) return null;
              return (
                <div key={ac.id} style={{marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:ac.color}}/>
                    <span style={{fontSize:17,fontWeight:700,color:C.text}}>{ac.name}</span>
                  </div>
                  {vacs.map(v=>(
                    <div key={v.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:"#FFF8E1",border:"1px solid #F0A500",marginBottom:6}}>
                      <span style={{fontSize:20}}>🏖️</span>
                      <div style={{flex:1}}>
                        <p style={{fontSize:17,fontWeight:600,color:C.text,margin:0}}>{v.start} ~ {v.end}</p>
                        <p style={{fontSize:17,color:C.sub,margin:"2px 0 0"}}>
                          {Math.ceil((new Date(v.end)-new Date(v.start))/86400000)+1}일간
                        </p>
                      </div>
                      <button onClick={()=>deleteVacation(ac.id,v.id)} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",fontSize:17}}>✕</button>
                    </div>
                  ))}
                </div>
              );
            })}
            {curAc.every(ac=>getVacations(childId,ac.id).length===0)&&(
              <div style={{textAlign:"center",padding:"20px",color:C.sub,fontSize:17,background:CT.faint,borderRadius:14}}>
                등록된 방학이 없어요
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 아이 관리 모달 ── */}
      {showChildMgr&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={()=>{ setShowChildMgr(false); setEditingChild(null); }}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:800,color:C.text}}>{editingChild?"아이 정보 수정":"아이 추가"}</h3>
              <button onClick={()=>{ setShowChildMgr(false); setEditingChild(null); }} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>

            <label style={lbl}>이름 *</label>
            <input value={childForm.name} onChange={e=>setChildForm(p=>({...p,name:e.target.value}))} placeholder="예: 이연우" style={{...inp,marginBottom:16}}/>

            <label style={lbl}>성별 *</label>
            <div style={{display:"flex",gap:12,marginBottom:16}}>
              {[{key:"boy",label:"👦 남자아이"},{key:"girl",label:"👧 여자아이"}].map(g=>(
                <button key={g.key} onClick={()=>setChildForm(p=>({...p,gender:g.key}))}
                  style={{flex:1,padding:"14px",borderRadius:14,border:`2px solid ${childForm.gender===g.key?GENDER_THEME[g.key].main:C.border}`,
                    background:childForm.gender===g.key?`${GENDER_THEME[g.key].main}12`:CT.faint,
                    color:childForm.gender===g.key?GENDER_THEME[g.key].main:C.sub,
                    fontSize:17,fontWeight:700,cursor:"pointer"}}>
                  {g.label}
                </button>
              ))}
            </div>

            <label style={lbl}>배경색 *</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
              {CHILD_THEME_COLORS.map((theme,ti)=>{
                const locked = isLocked() && ti>=FREE_THEME_COUNT; // 무료 개수 초과분은 잠금
                const selected = childForm.theme?.main===theme.main;
                return (
                  <button key={theme.name}
                    onClick={()=>{
                      if(locked){ showToast("✨ 프리미엄에서 더 많은 색을 쓸 수 있어요"); return; }
                      setChildForm(p=>({...p,theme}));
                    }}
                    style={{width:58,height:42,borderRadius:14,position:"relative",
                      border:`2px solid ${selected?theme.main:C.border}`,
                      background:theme.grad,cursor:"pointer",
                      opacity:locked?0.5:1,
                      boxShadow:selected?`0 0 0 3px ${theme.light}`:"none"}}
                    title={locked?`${theme.name} (프리미엄)`:theme.name}>
                    {locked&&<span style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:15}}>🔒</span>}
                  </button>
                );
              })}
            </div>

            {/* 색상 미리보기 */}
            <div style={{background:childForm.theme?.grad||GENDER_THEME[childForm.gender].grad,borderRadius:14,padding:"14px 18px",marginBottom:24,color:"#fff",textAlign:"center"}}>
              <p style={{fontSize:28,margin:"0 0 4px"}}>{GENDER_THEME[childForm.gender].emoji}</p>
              <p style={{fontSize:17,fontWeight:700,margin:0}}>{childForm.name||"이름 미입력"}</p>
            </div>

            <button onClick={saveChild} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:childForm.theme?.grad||GENDER_THEME[childForm.gender].grad,color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 16px ${(childForm.theme?.main||GENDER_THEME[childForm.gender].main)}40`}}>
              {editingChild?"수정 완료 ✓":"추가하기"}
            </button>

            {/* 등록된 아이 목록 */}
            {!editingChild&&children.length>0&&(
              <div style={{marginTop:24,borderTop:`1px solid ${C.border}`,paddingTop:18}}>
                <p style={{fontSize:17,fontWeight:700,color:C.sub,margin:"0 0 12px"}}>등록된 아이 ({children.length})</p>
                {children.map(c=>{
                  return (
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:14,border:`1px solid ${C.border}`,marginBottom:8,background:CT.faint}}>
                      <span style={{fontSize:20}}>{getGenderEmoji(c)}</span>
                      <span style={{flex:1,fontSize:17,fontWeight:700,color:C.text}}>{c.name}</span>
                      <button onClick={()=>{ setEditingChild(c.id); setChildForm({name:c.name,gender:c.gender}); }} style={{padding:"5px 12px",borderRadius:10,border:`1px solid ${C.border}`,background:"#fff",color:C.sub,fontSize:17,cursor:"pointer"}}>수정</button>
                      <button onClick={()=>deleteChild(c.id)} style={{padding:"5px 12px",borderRadius:10,border:`1px solid ${C.red}30`,background:`${C.red}0A`,color:C.red,fontSize:17,cursor:"pointer"}}>삭제</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 학원 복사 모달 ── */}
      {showAcademyCopyModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"flex-end",zIndex:2000}} onClick={()=>setShowAcademyCopyModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 44px",width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <div>
                <h3 style={{margin:0,fontSize:17,fontWeight:900,color:C.text}}>📚 아이별 학원 복사</h3>
                <p style={{margin:"4px 0 0",fontSize:13,color:C.sub,fontWeight:700}}>다른 아이의 학원을 {curChild?.name}에게 복사해요</p>
              </div>
              <button onClick={()=>setShowAcademyCopyModal(false)} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>

            <label style={lbl}>가져올 아이</label>
            <select value={copySourceChildId} onChange={e=>{ setCopySourceChildId(e.target.value); setCopySelectedAcademyIds([]); }} style={{...inp,marginBottom:16}}>
              <option value="">아이 선택</option>
              {children.filter(c=>c.id!==childId).map(c=>(
                <option key={c.id} value={c.id}>{getGenderEmoji(c)} {c.name}</option>
              ))}
            </select>

            {copySourceChildId&&(
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {getChildAcademies(copySourceChildId).length===0?(
                  <div style={{textAlign:"center",padding:"24px 10px",borderRadius:14,background:CT.faint,color:C.sub,fontSize:13,fontWeight:700}}>복사할 학원이 없어요</div>
                ):(
                  getChildAcademies(copySourceChildId).map(ac=>{
                    const selected=copySelectedAcademyIds.includes(ac.id);
                    return (
                      <button key={ac.id} onClick={()=>toggleCopyAcademy(ac.id)}
                        style={{width:"100%",textAlign:"left",borderRadius:14,padding:"13px 14px",border:`1.7px solid ${selected?ac.color:C.border}`,background:selected?`${ac.color}10`:"#fff",cursor:"pointer"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${selected?ac.color:"#CCC"}`,background:selected?ac.color:"transparent",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,flexShrink:0}}>
                            {selected?"✓":""}
                          </div>
                          <div style={{flex:1}}>
                            <p style={{fontSize:15,fontWeight:900,margin:0,color:C.text}}>{ac.name}</p>
                            <p style={{fontSize:13,fontWeight:700,color:C.sub,margin:"3px 0 0"}}>
                              {(ac.useCustomSchedule&&ac.schedules?.length)?ac.schedules.map(s=>`${s.day} ${s.time}`).join(" / "):`${(ac.days||[]).join("·")} ${ac.time||""}`}
                            </p>
                            {(ac.teacher||ac.phone)&&<p style={{fontSize:13,fontWeight:700,color:C.sub,margin:"2px 0 0"}}>{ac.teacher} {ac.phone}</p>}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            <button onClick={copyAcademiesToCurrentChild}
              style={{width:"100%",border:"none",borderRadius:14,padding:"14px",background:th.grad,color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer"}}>
              선택한 학원 복사하기
            </button>
          </div>
        </div>
      )}

      {/* ── 학원 추가/수정 모달 ── */}
      {showAddAcModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setShowAddAcModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,maxHeight:"93vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:800,color:C.text}}>{editTarget?"✏️ 학원 수정":"➕ 학원 추가"} ({getGenderEmoji(curChild)} {curChild?.name})</h3>
              <button onClick={()=>setShowAddAcModal(false)} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>
            <label style={lbl}>학원 이름 *</label>
            <input value={newAc.name} onChange={e=>setNewAc(p=>({...p,name:e.target.value}))} placeholder="예: 수학학원" style={{...inp,marginBottom:16}}/>
            <label style={lbl}>수업 요일 *</label>
            <div style={{display:"flex",gap:5,marginBottom:12}}>
              {DAYS.map(day=>{
                const sel=(newAc.days||[]).includes(day);
                return (
                  <button key={day} onClick={()=>{
                    setNewAc(p=>{
                      const days=p.days||[];
                      const newDays=sel?days.filter(d=>d!==day):[...days,day];
                      // useCustomSchedule 켜져있으면 schedules도 동기화
                      if(p.useCustomSchedule){
                        const schedules=sel
                          ?(p.schedules||[]).filter(s=>s.day!==day)
                          :[...(p.schedules||[]),{day,time:p.time||"15:00",duration:p.duration||60}];
                        return {...p,days:newDays,schedules};
                      }
                      return {...p,days:newDays};
                    });
                  }} style={{flex:1,padding:"9px 0",borderRadius:10,border:`1.5px solid ${sel?DAY_COLORS[day]:CT.faintB}`,background:sel?DAY_COLORS[day]:CT.faint,color:sel?"#fff":C.sub,fontSize:17,fontWeight:600,cursor:"pointer"}}>{day}</button>
                );
              })}
            </div>

            {/* 공통 시간 입력 */}
            {!newAc.useCustomSchedule&&(
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                <div style={{flex:1}}><label style={lbl}>시작 시간</label><input type="time" value={newAc.time||""} onChange={e=>setNewAc(p=>({...p,time:e.target.value}))} style={inp}/></div>
                <div style={{flex:1}}><label style={lbl}>수업 시간(분)</label><input type="number" value={newAc.duration===""?"":(newAc.duration||60)} onFocus={e=>e.target.select&&e.target.select()} onChange={e=>setNewAc(p=>({...p,duration:e.target.value===""?"":Number(e.target.value)}))} style={inp}/></div>
              </div>
            )}

            {/* 요일별 시간 토글 버튼 */}
            <button onClick={()=>{
              if(!newAc.useCustomSchedule){
                // 켜기: 선택된 요일로 schedules 생성 (기존 schedules 있으면 유지)
                const existing=newAc.schedules||[];
                const schedules=(newAc.days||[]).map(day=>{
                  const ex=existing.find(s=>s.day===day);
                  return ex||{day,time:newAc.time||"15:00",duration:newAc.duration||60};
                });
                setNewAc(p=>({...p,useCustomSchedule:true,schedules}));
              } else {
                setNewAc(p=>({...p,useCustomSchedule:false}));
              }
            }} style={{width:"100%",padding:"10px",borderRadius:10,border:`1.5px solid ${newAc.useCustomSchedule?th.main:C.border}`,background:newAc.useCustomSchedule?`${th.main}10`:CT.faint,color:newAc.useCustomSchedule?th.main:C.sub,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:12}}>
              {newAc.useCustomSchedule?"✓ 요일별 시간 설정 중":"📅 요일별 시간이 달라요"}
            </button>

            {/* 요일별 시간 개별 입력 */}
            {newAc.useCustomSchedule&&(
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12,background:`${th.main}06`,borderRadius:14,padding:"12px"}}>
                {(newAc.schedules||[]).map(sc=>(
                  <div key={sc.day} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1.5px solid ${DAY_COLORS[sc.day]}40`,borderRadius:10,padding:"8px 10px"}}>
                    <span style={{width:28,fontSize:15,fontWeight:700,color:DAY_COLORS[sc.day],flexShrink:0}}>{sc.day}</span>
                    <input type="time" value={sc.time}
                      onChange={e=>setNewAc(p=>({...p,schedules:(p.schedules||[]).map(s=>s.day===sc.day?{...s,time:e.target.value}:s)}))}
                      style={{...inp,flex:1,width:"auto",fontSize:13,padding:"7px 10px"}}/>
                    <input type="number" value={sc.duration}
                      onChange={e=>setNewAc(p=>({...p,schedules:(p.schedules||[]).map(s=>s.day===sc.day?{...s,duration:Number(e.target.value)}:s)}))}
                      style={{...inp,width:65,fontSize:13,padding:"7px 8px"}}/>
                    <span style={{fontSize:13,color:C.sub,flexShrink:0}}>분</span>
                  </div>
                ))}
                {(newAc.schedules||[]).length===0&&<p style={{fontSize:13,color:C.sub,margin:0,textAlign:"center"}}>위에서 요일을 먼저 선택해주세요</p>}
              </div>
            )}
            <button type="button" onClick={()=>setShowAcMore(v=>!v)} style={{width:"100%",padding:"12px",borderRadius:14,border:`1.5px dashed ${C.border}`,background:CT.faint,color:C.sub,fontSize:13,fontWeight:800,cursor:"pointer",marginBottom:16}}>
              {showAcMore?"▲ 상세 정보 접기":"▼ 상세 정보 추가 (학원비·준비물·연락처 등)"}
            </button>
            {showAcMore&&(<>
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              <div style={{flex:1}}><label style={lbl}>월 학원비(원)</label><input type="number" value={newAc.fee===""?"":newAc.fee} onFocus={e=>{ if(Number(newAc.fee)===0) setNewAc(p=>({...p,fee:""})); }} onChange={e=>setNewAc(p=>({...p,fee:e.target.value===""?"":Number(e.target.value)}))} placeholder="0" style={inp}/></div>
              <div style={{flex:1}}><label style={lbl}>납부일</label><input type="number" min="1" max="31" value={newAc.payDay} onFocus={e=>e.target.select&&e.target.select()} onChange={e=>setNewAc(p=>({...p,payDay:e.target.value===""?"":Number(e.target.value)}))} style={inp}/></div>
            </div>
            <label style={lbl}>색상</label>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              {(()=>{
                const usedColors=(curAc||[]).filter(a=>!editTarget||String(a.id)!==String(editTarget)).map(a=>(a.color||"").toUpperCase());
                return PALETTE.map(c=>{
                  const isUsed=usedColors.includes(c.toUpperCase());
                  const isSel=newAc.color===c;
                  return (
                    <button key={c} onClick={()=>setNewAc(p=>({...p,color:c}))} title={isUsed?"다른 학원이 사용 중":""}
                      style={{position:"relative",width:32,height:32,borderRadius:"50%",background:c,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                        boxShadow:isSel?`0 0 0 3px #fff,0 0 0 5px ${c}`:"0 2px 6px rgba(0,0,0,0.15)"}}>
                      {isUsed&&!isSel&&<span style={{width:8,height:8,borderRadius:"50%",background:"#fff",boxShadow:"0 0 0 1.5px rgba(0,0,0,0.15)"}}/>}
                    </button>
                  );
                });
              })()}
            </div>
            <label style={lbl}>🎒 항상 챙길 준비물</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
              {(newAc.baseSupplies||[]).map((s,i)=>(
                <span key={i} style={{fontSize:17,padding:"5px 12px",borderRadius:20,background:`${newAc.color}18`,color:newAc.color,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>
                  {s}<button onClick={()=>setNewAc(p=>({...p,baseSupplies:p.baseSupplies.filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:newAc.color,cursor:"pointer",fontSize:17,padding:0}}>✕</button>
                </span>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <input value={supplyInput} onChange={e=>setSupplyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addBaseSupply()} placeholder="예: 교재, 필통" style={{...inp,flex:1,width:"auto"}}/>
              <button onClick={addBaseSupply} style={{padding:"0 18px",borderRadius:10,border:"none",background:newAc.color,color:"#fff",fontWeight:700,fontSize:17,cursor:"pointer"}}>추가</button>
            </div>
            <label style={lbl}>📚 항상 해야 할 숙제 <span style={{fontSize:13,color:C.sub,fontWeight:400}}>(미션에서 버튼으로 추가)</span></label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
              {(newAc.baseHomeworks||[]).map((s,i)=>(
                <span key={i} style={{fontSize:17,padding:"5px 12px",borderRadius:20,background:`${newAc.color}18`,color:newAc.color,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>
                  {s}<button onClick={()=>removeBaseHomework(i)} style={{background:"none",border:"none",color:newAc.color,cursor:"pointer",fontSize:17,padding:0}}>✕</button>
                </span>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              <input value={baseHwInput} onChange={e=>setBaseHwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addBaseHomework()} placeholder="예: 문제집 2쪽, 단어 10개" style={{...inp,flex:1,width:"auto"}}/>
              <button onClick={addBaseHomework} style={{padding:"0 18px",borderRadius:10,border:"none",background:newAc.color,color:"#fff",fontWeight:700,fontSize:17,cursor:"pointer"}}>추가</button>
            </div>
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:16}}>
              <p style={{fontSize:17,fontWeight:700,color:C.text,margin:"0 0 14px"}}>📋 연락처 정보 <span style={{fontSize:17,color:C.sub,fontWeight:400}}>(선택)</span></p>
              <label style={lbl}>👩‍🏫 담당 선생님</label>
              <input value={newAc.teacher} onChange={e=>setNewAc(p=>({...p,teacher:e.target.value}))} placeholder="예: 김민준 선생님" style={{...inp,marginBottom:14}}/>
              <label style={lbl}>📞 연락처</label>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <input value={newAc.phone} onChange={e=>setNewAc(p=>({...p,phone:e.target.value}))}
                  placeholder="예: 010-1234-5678" style={{...inp,flex:1,width:"auto",marginBottom:0}}/>
                <button type="button" onClick={pickTeacherContact}
                  style={{padding:"0 12px",borderRadius:10,border:`1px solid ${C.border}`,background:"#fff",color:C.text,fontSize:13,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                  📒 주소록
                </button>
              </div>
              <label style={lbl}>📍 주소</label>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <input value={newAc.address} onChange={e=>setNewAc(p=>({...p,address:e.target.value}))}
                  placeholder="예: 서울시 강남구" style={{...inp,flex:1,width:"auto",marginBottom:0}}/>
                <button type="button" onClick={openNaverMapSearch}
                  style={{padding:"0 12px",borderRadius:10,border:`1px solid ${C.border}`,background:"#fff",color:C.text,fontSize:13,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                  🗺️ 지도검색
                </button>
              </div>

              <label style={lbl}>🚌 셔틀버스 메모</label>
              <textarea value={newAc.shuttleInfo||""} onChange={e=>setNewAc(p=>({...p,shuttleInfo:e.target.value}))}
                placeholder="예: 월수금 하원 차량 / 3시10분 아파트 정문"
                style={{...inp,minHeight:70,resize:"none",marginBottom:10}}/>

              <button type="button" onClick={()=>{
                setNewAc(p=>({...p,
                  useCustomShuttle:!p.useCustomShuttle,
                  shuttleSchedules:p.shuttleSchedules?.length
                    ? p.shuttleSchedules
                    : (p.days||[]).map(day=>({day,time:"",place:"",memo:""}))
                }));
              }} style={{width:"100%",padding:"11px",borderRadius:10,border:`1px dashed ${C.purple}`,background:newAc.useCustomShuttle?C.purpleL:CT.faint,color:C.purple,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10}}>
                {newAc.useCustomShuttle?"🚌 요일별 셔틀 설정 사용중":"🚌 요일별 셔틀 정보가 달라요"}
              </button>

              {newAc.useCustomShuttle&&(
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
                  {(newAc.days||[]).map(day=>{
                    const shuttle=(newAc.shuttleSchedules||[]).find(s=>s.day===day)||{};
                    return (
                      <div key={day} style={{border:`1px solid ${C.border}`,borderRadius:14,padding:"12px",background:CT.faint}}>
                        <div style={{fontWeight:800,marginBottom:8,color:DAY_COLORS[day],fontSize:13}}>{day}요일</div>
                        <div style={{display:"flex",gap:8,marginBottom:8}}>
                          <input type="time" value={shuttle.time||""}
                            onChange={e=>setNewAc(p=>({...p,shuttleSchedules:(p.shuttleSchedules||[]).map(s=>s.day===day?{...s,time:e.target.value}:s)}))}
                            style={{...inp,flex:1,width:"auto",fontSize:13,padding:"8px 10px"}}/>
                          <input value={shuttle.place||""} placeholder="위치"
                            onChange={e=>setNewAc(p=>({...p,shuttleSchedules:(p.shuttleSchedules||[]).map(s=>s.day===day?{...s,place:e.target.value}:s)}))}
                            style={{...inp,flex:2,width:"auto",fontSize:13,padding:"8px 10px"}}/>
                        </div>
                        <input value={shuttle.memo||""} placeholder="메모"
                          onChange={e=>setNewAc(p=>({...p,shuttleSchedules:(p.shuttleSchedules||[]).map(s=>s.day===day?{...s,memo:e.target.value}:s)}))}
                          style={{...inp,fontSize:13,padding:"8px 10px"}}/>
                      </div>
                    );
                  })}
                </div>
              )}

              <label style={lbl}>📝 학원 메모</label>
              <input value={newAc.memo} onChange={e=>setNewAc(p=>({...p,memo:e.target.value}))} placeholder="특이사항, 레벨 등" style={inp}/>
            </div>
            </>)}
            <button onClick={saveAcademy} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 16px ${th.main}40`}}>
              {editTarget?"수정 완료 ✓":"추가하기"}
            </button>
          </div>
        </div>
      )}

      {/* ── 학원 상세 모달 ── */}
      {showDetailModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}} onClick={()=>setShowDetailModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:24,width:"100%",maxWidth:390,boxShadow:"0 20px 60px rgba(0,0,0,0.18)",maxHeight:"88vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <div style={{width:48,height:48,borderRadius:14,background:`${showDetailModal.color}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:showDetailModal.color}}/>
              </div>
              <div style={{flex:1}}>
                <h3 style={{margin:0,fontSize:20,fontWeight:900,color:C.text}}>{showDetailModal.name}</h3>
                <p style={{margin:"3px 0 0",fontSize:17,color:C.sub}}>
                  {showDetailModal.useCustomSchedule
                    ? (showDetailModal.schedules||[]).map(s=>`${s.day} ${s.time}(${s.duration}분)`).join(" / ")
                    : `${(showDetailModal.days||[]).join("·")}요일 · ${showDetailModal.time} · ${showDetailModal.duration}분`}
                </p>
              </div>
            </div>
            {[["💰 월 학원비",`${Number(showDetailModal.fee||0).toLocaleString()}원`],["📆 납부일",`매월 ${showDetailModal.payDay}일`],["🎒 기본 준비물",(showDetailModal.baseSupplies||[]).join(", ")||"없음"],...(showDetailModal.teacher?[["👩‍🏫 선생님",showDetailModal.teacher]]:[]),...(showDetailModal.address?[["📍 주소",showDetailModal.address]]:[])].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:17,color:C.sub,flexShrink:0}}>{k}</span>
                <span style={{fontSize:17,fontWeight:600,color:C.text,textAlign:"right",maxWidth:"58%",marginLeft:8}}>{v}</span>
              </div>
            ))}
            {showDetailModal.memo&&(
              <div style={{background:`${C.orange}0D`,borderRadius:10,padding:"12px 14px",marginTop:12,border:`1px solid ${C.orange}30`}}>
                <p style={{fontSize:17,color:C.orange,margin:"0 0 4px",fontWeight:600}}>📝 메모</p>
                <p style={{fontSize:17,color:C.text,margin:0}}>{showDetailModal.memo}</p>
              </div>
            )}
            {showDetailModal.phone&&(
              <div style={{display:"flex",gap:8,marginTop:16,padding:"14px 0",borderTop:`1px solid ${C.border}`}}>
                <a href={`tel:${showDetailModal.phone}`} style={{flex:1,padding:12,borderRadius:10,background:`${C.green}12`,border:`1px solid ${C.green}30`,color:C.green,fontSize:17,fontWeight:700,textAlign:"center",textDecoration:"none",display:"block"}}>📞 {showDetailModal.phone}</a>
                <button onClick={()=>{ setShowSmsModal(showDetailModal); setShowDetailModal(null); setSmsDraft(""); }} style={{flex:1,padding:12,borderRadius:10,border:`1px solid ${C.purple}44`,background:C.purpleL,color:C.purple,fontSize:17,fontWeight:700,cursor:"pointer"}}>💬 문자 보내기</button>
              </div>
            )}
            <div style={{display:"flex",gap:8,marginTop:showDetailModal.phone?8:16}}>
              <button onClick={()=>openEdit(showDetailModal)} style={{flex:1,padding:12,borderRadius:10,border:`1px solid ${th.main}44`,background:th.light,color:th.main,fontSize:17,fontWeight:700,cursor:"pointer"}}>✏️ 수정</button>
              <button onClick={()=>deleteAcademy(showDetailModal.id)} style={{flex:1,padding:12,borderRadius:10,border:`1px solid ${C.red}44`,background:`${C.red}0D`,color:C.red,fontSize:17,fontWeight:600,cursor:"pointer"}}>🗑 삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 날짜별 숙제/준비물 모달 ── */}
      {showDailyModal&&(()=>{
        const {academyId,date,acName,acColor,baseSupplies}=showDailyModal;
        const isExtra=String(academyId)===String(EXTRA_QUEST_ID); // 기타 미션: 숙제·준비물 없이 미션만
        const entry=getDailyEntry(childId,academyId,date);
        const hw=entry.homeworks||[], sup=entry.supplies||[], todos=entry.todos||[];
        const upd=(ne)=>setDailyEntry(childId,academyId,date,ne);
        const addHw=()=>{ const v=dailyHwInput.trim(); if(!v) return; upd({...entry,homeworks:[...hw,{id:Date.now(),text:v,done:false,point:Number(dailyHwPoint||DEFAULT_HOMEWORK_SCORE)}]}); setDailyHwInput(""); };
        const addSup=()=>{ const v=dailySupInput.trim(); if(!v) return; upd({...entry,supplies:[...sup,v]}); setDailySupInput(""); };
        const addTodo=()=>{ const v=dailyTodoInput.trim(); if(!v) return; upd({...entry,todos:[...todos,{id:Date.now(),text:v,done:false,point:Number(dailyTodoPoint||DEFAULT_HOMEWORK_SCORE)}]}); setDailyTodoInput(""); };
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={()=>setShowDailyModal(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto",boxSizing:"border-box"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                <div style={{width:14,height:14,borderRadius:"50%",background:acColor}}/>
                <div style={{flex:1}}>
                  <p style={{fontWeight:800,fontSize:17,margin:0,color:C.text}}>{acName}</p>
                  <p style={{fontSize:17,color:C.sub,margin:"2px 0 0"}}>{fmt(date)} {date===TODAY?"(오늘)":""}</p>
                </div>
                <button onClick={()=>setShowDailyModal(null)} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:13}}>✕</button>
              </div>
              <p style={{fontSize:17,fontWeight:700,color:C.text,margin:"0 0 10px"}}>🎯 오늘의 미션</p>
              {hw.length===0&&todos.length===0&&<p style={{fontSize:17,color:C.sub,marginBottom:10}}>등록된 미션이 없어요</p>}
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
                {hw.map(h=>(
                  <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,background:h.done?`${C.green}08`:CT.faint,border:`1.5px solid ${h.done?C.green+"30":CT.faintB}`}}>
                    <button onClick={()=>toggleHomeworkDone(childId,academyId,date,h.id)} style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${h.done?C.green:"#CCC"}`,background:h.done?C.green:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:700}}>{h.done?"✓":""}</button>
                    <span style={{flex:1,fontSize:13,color:h.done?C.sub:C.text,textDecoration:h.done?"line-through":"none"}}>숙제: {h.text}</span>
                    <span style={{fontSize:13,color:C.orange,fontWeight:800}}>+{h.point||DEFAULT_HOMEWORK_SCORE} {TM.xp}</span>
                    <button onClick={()=>upd({...entry,homeworks:hw.filter(x=>x.id!==h.id)})} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",fontSize:15}}>✕</button>
                  </div>
                ))}
                {todos.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,background:t.done?`${C.green}08`:CT.faint,border:`1.5px solid ${t.done?C.green+"30":CT.faintB}`}}>
                    <button onClick={()=>toggleTodoDone(childId,academyId,date,t.id)} style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${t.done?C.green:"#CCC"}`,background:t.done?C.green:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:700}}>{t.done?"✓":""}</button>
                    <span style={{flex:1,fontSize:13,color:t.done?C.sub:C.text,textDecoration:t.done?"line-through":"none"}}>{t.text}</span>
                    <span style={{fontSize:13,color:C.orange,fontWeight:800}}>+{t.point||DEFAULT_HOMEWORK_SCORE} {TM.xp}</span>
                    <button onClick={()=>upd({...entry,todos:todos.filter(x=>x.id!==t.id)})} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",fontSize:15}}>✕</button>
                  </div>
                ))}
              </div>
              {!isExtra&&(
              <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
                <input value={dailyHwInput} onChange={e=>setDailyHwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addHw()} placeholder="숙제 입력" style={{...inp,flex:3,width:"auto",fontSize:13,padding:"9px 10px"}}/>
                <input type="number" value={dailyHwPoint} onChange={e=>setDailyHwPoint(e.target.value)} style={{...inp,width:52,fontSize:13,padding:"9px 6px",textAlign:"center"}} min="1"/>
                <span style={{fontSize:13,color:C.sub,flexShrink:0}}>점</span>
                <button onClick={addHw} style={{padding:"9px 12px",borderRadius:10,border:"none",background:acColor,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0}}>숙제</button>
              </div>
              )}
              <div style={{display:"flex",gap:6,marginBottom:20,alignItems:"center"}}>
                <input value={dailyTodoInput} onChange={e=>setDailyTodoInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTodo()} placeholder="미션 입력" style={{...inp,flex:3,width:"auto",fontSize:13,padding:"9px 10px"}}/>
                <input type="number" value={dailyTodoPoint} onChange={e=>setDailyTodoPoint(e.target.value)} style={{...inp,width:52,fontSize:13,padding:"9px 6px",textAlign:"center"}} min="1"/>
                <span style={{fontSize:13,color:C.sub,flexShrink:0}}>점</span>
                <button onClick={addTodo} style={{padding:"9px 12px",borderRadius:10,border:"none",background:acColor,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0}}>미션</button>
              </div>
              {(()=>{
                if(isExtra) return null;
                const acObj=getAcademyById(childId,academyId);
                const base=acObj?.baseHomeworks||[];
                if(base.length===0) return null;
                const existing=hw.map(h=>h.text);
                const addOne=(t)=>{
                  if(existing.includes(t)){ showToast("이미 추가된 숙제예요"); return; }
                  upd({...entry,homeworks:[...hw,{id:Date.now(),text:t,done:false,point:DEFAULT_HOMEWORK_SCORE,fromBase:true}]});
                  showToast("상시 숙제를 추가했어요 📚");
                };
                return (
                  <div style={{marginBottom:20}}>
                    <p style={{fontSize:13,fontWeight:800,color:acColor,margin:"0 0 8px"}}>📌 상시 숙제</p>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {base.map((s,i)=>{
                        const added=existing.includes(s);
                        return (
                          <div key={i} style={{display:"flex",gap:6,alignItems:"center"}}>
                            <div style={{...inp,flex:3,width:"auto",fontSize:13,padding:"9px 10px",display:"flex",alignItems:"center",color:added?C.sub:C.text,background:added?`${C.green}08`:CT.faint,border:`1.5px solid ${added?C.green+"30":CT.faintB}`}}>
                              {added&&<span style={{color:C.green,marginRight:5,fontWeight:900}}>✓</span>}{s}
                            </div>
                            <button onClick={()=>addOne(s)} disabled={added} style={{padding:"9px 12px",borderRadius:10,border:"none",background:added?CT.faintB:acColor,color:added?C.sub:"#fff",fontWeight:700,fontSize:13,cursor:added?"default":"pointer",flexShrink:0}}>
                              {added?"추가됨":"추가"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
              {!isExtra&&(()=>{
              const hiddenBase=entry.hiddenBase||[];
              const visibleBase=(baseSupplies||[]).filter(s=>!hiddenBase.includes(s));
              const hideBase=(s)=>upd({...entry,hiddenBase:[...hiddenBase,s]});
              const restoreBase=(s)=>upd({...entry,hiddenBase:hiddenBase.filter(x=>x!==s)});
              return (<>
              <p style={{fontSize:17,fontWeight:700,color:C.text,margin:"0 0 10px"}}>🎒 오늘의 준비물</p>
              {visibleBase.length===0&&sup.length===0&&<p style={{fontSize:15,color:C.sub,marginBottom:10}}>등록된 준비물이 없어요</p>}
              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:hiddenBase.length>0?8:10}}>
                {visibleBase.map((s,i)=>(
                  <span key={`base${i}`} style={{fontSize:15,padding:"5px 12px",borderRadius:20,background:acColor,color:"#fff",display:"flex",alignItems:"center",gap:6,fontWeight:600}}>
                    📌 {s}<button onClick={()=>hideBase(s)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.85)",cursor:"pointer",fontSize:13,padding:0,lineHeight:1}}>✕</button>
                  </span>
                ))}
                {sup.map((s,i)=>(
                  <span key={`day${i}`} style={{fontSize:15,padding:"5px 12px",borderRadius:20,background:`${acColor}15`,color:acColor,display:"flex",alignItems:"center",gap:6,fontWeight:600}}>
                    {s}<button onClick={()=>upd({...entry,supplies:sup.filter((_,j)=>j!==i)})} style={{background:"none",border:"none",color:acColor,cursor:"pointer",fontSize:13,padding:0,lineHeight:1}}>✕</button>
                  </span>
                ))}
              </div>
              {hiddenBase.length>0&&(
                <div style={{marginBottom:10}}>
                  <p style={{fontSize:13,color:C.sub,margin:"0 0 5px"}}>오늘 제외한 준비물 (눌러서 되돌리기)</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {hiddenBase.map((s,i)=>(
                      <button key={`hb${i}`} onClick={()=>restoreBase(s)} style={{fontSize:13,padding:"4px 11px",borderRadius:20,background:CT.faint,color:C.sub,border:`1px dashed ${CT.faintB}`,cursor:"pointer",textDecoration:"line-through",fontWeight:600}}>
                        {s} ↩
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8,marginBottom:22}}>
                <input value={dailySupInput} onChange={e=>setDailySupInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSup()} placeholder="준비물 입력 후 Enter" style={{...inp,flex:1,width:"auto",fontSize:15,padding:"10px 14px"}}/>
                <button onClick={addSup} style={{padding:"0 18px",borderRadius:10,border:"none",background:acColor,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer"}}>추가</button>
              </div>
              </>);
              })()}
              <button onClick={()=>{ setShowDailyModal(null); showToast(); }} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer"}}>저장 & 닫기</button>
            </div>
          </div>
        );
      })()}

      {/* ── 문자 발송 모달 ── */}
      {showSmsModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={()=>setShowSmsModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 44px",width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:showSmsModal.color}}/>
              <div style={{flex:1}}>
                <p style={{fontWeight:800,fontSize:17,margin:0,color:C.text}}>{showSmsModal.name} 문자 보내기</p>
                {showSmsModal.phone&&<p style={{fontSize:17,color:C.sub,margin:"2px 0 0"}}>📞 {showSmsModal.phone}</p>}
              </div>
              <button onClick={()=>setShowSmsModal(null)} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:13}}>✕</button>
            </div>
            <p style={{fontSize:17,color:C.sub,fontWeight:700,margin:"0 0 10px"}}>📋 템플릿 선택</p>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:16}}>
              {templates.map(t=><button key={t.id} onClick={()=>applyTmpl(t,showSmsModal)} style={{padding:"7px 14px",borderRadius:10,border:`1px solid ${C.purple}40`,background:C.purpleL,color:C.purple,fontSize:17,fontWeight:600,cursor:"pointer"}}>{t.title}</button>)}
            </div>
            <label style={lbl}>✏️ 문자 내용</label>
            <textarea value={smsDraft} onChange={e=>setSmsDraft(e.target.value)} placeholder={"템플릿을 선택하거나\n직접 입력하세요"} style={{...inp,height:140,resize:"none",marginBottom:16,whiteSpace:"pre-wrap"}}/>
            <div style={{display:"flex",gap:10}}>
              {showSmsModal.phone?(
                <>
                  <a href={smsLink(showSmsModal.phone,smsDraft)} style={{flex:2,padding:14,borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.purple},#9B7FFF)`,color:"#fff",fontSize:17,fontWeight:700,textAlign:"center",textDecoration:"none",display:"block",boxShadow:`0 4px 14px ${C.purple}40`}}>📲 문자 앱으로 발송</a>
                  <a href={`tel:${showSmsModal.phone}`} style={{flex:1,padding:14,borderRadius:14,border:`1.5px solid ${C.green}40`,background:`${C.green}10`,color:C.green,fontSize:17,fontWeight:700,textAlign:"center",textDecoration:"none",display:"block"}}>📞 전화</a>
                </>
              ):<p style={{fontSize:17,color:C.red,margin:0}}>⚠️ 연락처가 등록되지 않았어요</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── 템플릿 편집 모달 ── */}
      {showTmplEdit&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={()=>setShowTmplEdit(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,boxSizing:"border-box"}}>
            <h3 style={{margin:"0 0 20px",fontSize:17,fontWeight:800,color:C.text}}>{showTmplEdit==="new"?"새 템플릿 추가":"템플릿 수정"}</h3>
            <label style={lbl}>템플릿 제목</label>
            <input value={editTmpl.title} onChange={e=>setEditTmpl(p=>({...p,title:e.target.value}))} placeholder="예: 결석 안내" style={{...inp,marginBottom:16}}/>
            <label style={lbl}>문자 내용</label>
            <textarea value={editTmpl.body} onChange={e=>setEditTmpl(p=>({...p,body:e.target.value}))} placeholder={"{아이이름}, {학원명}, {날짜}, {시간} 변수 사용 가능"} style={{...inp,height:140,resize:"none",marginBottom:22}}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowTmplEdit(null)} style={{flex:1,padding:14,borderRadius:14,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:17,cursor:"pointer"}}>취소</button>
              <button onClick={saveTmpl} style={{flex:2,padding:14,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer"}}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 결석 추가 모달 ── */}
      {showAbsModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setShowAbsModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,boxSizing:"border-box"}}>
            <h3 style={{margin:"0 0 20px",fontSize:17,fontWeight:800,color:C.text}}>결석 기록 추가 ({getGenderEmoji(curChild)} {curChild?.name})</h3>
            <label style={lbl}>학원 선택</label>
            <select value={newAbs.academyId} onChange={e=>setNewAbs(p=>({...p,academyId:e.target.value}))} style={{...inp,marginBottom:14}}>
              <option value="">학원을 선택하세요</option>
              {curAc.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <label style={lbl}>결석일</label>
            <input type="date" value={newAbs.date} onChange={e=>setNewAbs(p=>({...p,date:e.target.value}))} style={{...inp,marginBottom:14}}/>
            <label style={lbl}>결석 사유</label>
            <input value={newAbs.reason} onChange={e=>setNewAbs(p=>({...p,reason:e.target.value}))} placeholder="예: 감기, 가족 행사" style={{...inp,marginBottom:14}}/>
            <label style={lbl}>보충 예정일</label>
            <input type="date" value={newAbs.makeupDate} onChange={e=>setNewAbs(p=>({...p,makeupDate:e.target.value}))} style={{...inp,marginBottom:24}}/>
            <button onClick={addAbs} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.red},#FF8FA3)`,color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer"}}>기록하기</button>
          </div>
        </div>
      )}
    </div>
  );
}

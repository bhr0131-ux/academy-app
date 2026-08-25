
/* ════════════════════════════════════════════════════════════════════════
   SECTION 1. 디자인 토큰 (색상/사이즈/그림자 상수)
   ════════════════════════════════════════════════════════════════════════ */

// ── 상수 ─────────────────────────────────
export const DAYS = ["월","화","수","목","금","토","일"];
export const DAY_COLORS = { 월:"#FF6B6B", 화:"#FF9F43", 수:"#4A90E2", 목:"#9B59B6", 금:"#1ABC9C", 토:"#3498DB", 일:"#E74C3C" };

// 성별별 테마
/* 색을 따로 안 고른 아이가 쓰는 기본 테마.
   [2026-08-05] name 을 추가했다 — 아래 CHILD_THEME_COLORS 에는 있는데 여기만 없어서
   꾸미기 상점의 '테마색 테두리' 이름이 "undefined 보석"으로 나왔다.
   색을 직접 고른 아이는 "연두 보석"처럼 제대로 나오고, 기본 테마 아이만 깨져 있었다. */
export const GENDER_THEME = {
  boy:  { name:"파랑", emoji:"👦", main:"#3B7ECD", light:"#E4EDF8", lightTop:"#F5F9FC", grad:"linear-gradient(135deg,#3B7ECD,#80A9DA)" },
  girl: { name:"분홍", emoji:"👧", main:"#DE869C", light:"#FAEEF1", lightTop:"#FDF9FA", grad:"linear-gradient(135deg,#DE869C,#EEC8D1)" },
};

export const CHILD_THEME_COLORS = [
  // 아이 테마색 — [사용자 확정 2026-08-09] 네 가지만 쓴다 (연두 삭제).
  // 탐험모드는 이 색을 화면 전체에 칠하지 않고, 밤하늘 베이스 위에 포인트로만 입힌다.
  // ※ 이미 연두를 고른 아이는 색 객체(child.theme)를 통째로 저장해 두므로 그대로 유지된다.
  //   지도 걷기 캐릭터도 연두(green) 그림을 계속 갖고 있다(mapWalkers의 WALKER_THEMES).
  //   여기서 빠지는 건 '고르는 목록'뿐이다.
  { name:"분홍", main:"#FF6FA3", light:"#FCE7F1", lightTop:"#FFF7FB", grad:"linear-gradient(135deg,#FF6FA3,#FFB6CC)" },
  { name:"살구", main:"#FFB66B", light:"#FFF0DF", lightTop:"#FFFBF6", grad:"linear-gradient(135deg,#FF9F5A,#FFD68A)" },
  { name:"보라", main:"#A78BFA", light:"#F0EAFF", lightTop:"#FAF8FF", grad:"linear-gradient(135deg,#8B5CF6,#CDBDFF)" },
  { name:"파랑", main:"#60A8FF", light:"#E5F1FF", lightTop:"#F6FAFF", grad:"linear-gradient(135deg,#3D79FF,#A9C9FF)" },
];

export const C = {
  bg:"#F4F6FB", card:"#FFFFFF", border:"#EAECF5",
  text:"#1A1A35", sub:"#8890B0", faint:"#F0F2FF", faintB:"#DDE3FF",
  /* [사용자 확정 2026-08-16] text(거의 검정)와 sub(연회색) 사이가 비어 있어,
     '한 톤 낮춘 진회색'이 필요할 때마다 화면에서 따로 계산해 넣고 있었다.
     묶음 제목처럼 본문보다 한 단 물러나야 하는 글씨에 쓴다. */
  textSoft:"#68687A",
  green:"#22C9A0", red:"#FF5C7A", orange:"#FF9F43",
  purple:"#6C63FF", purpleL:"#EEF0FF",
};

/* ── 글자 눈금 (엄마용) ────────────────────────────────────────────────
   [사용자 확정 2026-08-16] 같은 역할에 같은 크기를 쓰기 위한 단계.
   지금까지 '보조 설명 한 줄'에 11 · 11.5 · 12 · 12.5 · 13 이 섞여 쓰여
   화면이 미세하게 어긋나 보였다. 새 코드는 이 눈금에서만 고른다.
   (화살표 '‹ ›' 나 꺾쇠 '›' 같은 글리프는 글자가 아니므로 여기 해당 없음) */
export const FS = {
  modalTitle:17, // 팝업 제목 — 준비물 확인 · 미션 확인 …
  title:15,      // 구역 제목 — 오늘의 미션 · 보상 관리 · 구매 승인 대기
  cardTitle:14,  // 카드 안 제목 — 학원 이름 등
  body:13,       // 본문
  sub:12.5,      // 보조 설명 한 줄
  tag:11.5,      // 꼬리표 · 배지 · 캡션
};
/* 굵기도 셋으로 — 600 과 700 은 화면에서 구분되지 않아 한 단으로 합친다 */
export const FW = { bold:900, semi:800, normal:700 };

/* [사용자 확정 2026-08-16] 입력칸·그 옆 버튼의 기준 높이.
   같은 줄에 놓이는 것들이 40 / 38 / 35 로 제각각이라 줄마다 단이 어긋나 보였다.
   padding 으로 높이를 맞추면 글자 크기가 바뀔 때마다 다시 틀어지므로 minHeight 로 못 박는다. */
export const CTRL_H = 40;

// 테마색(main)을 흰색과 섞어 옅은 배경색 생성 (wf=흰색 비율, 1=완전 흰색)
/* ════════════════════════════════════════════════════════════════════════
   SECTION 2. 색상 유틸 (hex 혼합/팔레트 생성)
   ════════════════════════════════════════════════════════════════════════ */

export const mixWhite = (hex, wf) => {
  const h = (hex||"#FFFFFF").replace("#","");
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  const m = (v)=>Math.max(0,Math.min(255,Math.round(v*(1-wf)+255*wf)));
  const hx = (v)=>v.toString(16).padStart(2,"0").toUpperCase();
  return `#${hx(m(r))}${hx(m(g))}${hx(m(b))}`;
};
// 테마색을 검정과 섞어 더 진하게 (bf=검정 비율). 같은 계열 명암 그라데이션용
export const mixBlack = (hex, bf) => {
  const h = (hex||"#000000").replace("#","");
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  const m = (v)=>Math.max(0,Math.min(255,Math.round(v*(1-bf))));
  const hx = (v)=>v.toString(16).padStart(2,"0").toUpperCase();
  return `#${hx(m(r))}${hx(m(g))}${hx(m(b))}`;
};
// 엄마모드 헤더/카드용: 테마색마다 원색 밝기가 크게 달라(연두·살구는 매우 밝고 파랑·보라는 중간),
// 같은 흰색 비율을 섞으면 밝은 색만 눈부시다. 검정을 섞으면 살구·주황 계열이 똥색으로 탁해지므로,
// 검정 대신 '흰색을 덜 섞는' 방식으로 밝은 색의 명도를 낮춘다(채도 유지).
// 추가로 색상(hue)별 미세보정: 주황 계열은 진해 보여 흰색을 더, 초록 계열은 밝아 보여 흰색을 덜 섞는다.
export const headerTone = (hex, baseWf) => {
  const h=(hex||"#60A8FF").replace("#","");
  const r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
  const lum=(0.299*r+0.587*g+0.114*b)/255;
  const ref=0.62;
  let wf=baseWf - Math.max(0,(lum-ref))*1.3;     // 밝은 색일수록 흰색을 덜 섞어 톤다운
  // hue 계산
  const rr=r/255,gg=g/255,bb=b/255,mx=Math.max(rr,gg,bb),mn=Math.min(rr,gg,bb),d=mx-mn;
  let hue=0;
  if(d!==0){ if(mx===rr)hue=60*(((gg-bb)/d)%6); else if(mx===gg)hue=60*((bb-rr)/d+2); else hue=60*((rr-gg)/d+4); }
  hue=(hue+360)%360;
  if(hue>=0&&hue<=50) wf+=0.05;                  // 주황(살구): 흰색 더 → 진함 완화
  if(hue>=90&&hue<=160) wf-=0.05;                // 초록(연두): 흰색 덜 → 밝음 완화
  return mixWhite(hex, Math.max(0.1, Math.min(0.97, wf)));
};
// 맑고 따뜻한 그림책 파스텔: 따뜻한 크림 화이트(#FFF9F2)와 섞고,
// 채도를 살짝 낮춰(부스트가 아니라 감소) 형광기 없는 부드러운 마카롱 톤을 만든다.
// 파랑~보라는 더 연하게, 파랑은 맑은 하늘색으로 살짝 끌어올린다.
export const softTint = (hex, wf, satBoost=0.92) => {
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
// 탐험 톤 생성: 남색 베이스(#1B1D2B)에 테마색을 은은히 섞어 '채도 낮은 차분한 다크'를 만든다.
// 레퍼런스(배경 #1B1D2B~#3E4371)처럼 어느 테마색이든 탐험 분위기를 유지하면서 색만 살짝 달라지게.
// lift: 밝기 절대 가산(0=가장 깊은 배경, 클수록 밝은 카드). tf: 테마색 반영 강도(기본 0.16, 은은하게)
/* ════════════════════════════════════════════════════════════════════════
   SECTION 3. 테마/스킨 토큰 (탐험·베이커리 팔레트)
   ════════════════════════════════════════════════════════════════════════ */

export const DUNGEON_BASE = [52, 70, 106]; // 밝은 저녁하늘 베이스 (살짝 밝게 +10 — 카드 분리감 ↑, 밤 무드 유지)
export const dungeonTone = (main, lift=0, tf=0.22) => {
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
// 탐험모드 "보물상점" 전용 스타일 토큰 (아이템 상점 카드/지갑/아이콘) ----------
export const DUNGEON_SHOP = {
  walletBg: "linear-gradient(135deg, #243B6A 0%, #355490 100%)",
  walletBorder: "1px solid rgba(150, 190, 255, 0.28)",
  // 목록 전체를 하나로 잇는 위→아래 그라데이션 (밝은 보물상자 블루 → 깊은 탐험 네이비)
  listBg: "linear-gradient(180deg, #6D82A8 0%, #4F6593 45%, #38507F 100%)",
  listBorder: "1px solid rgba(210, 230, 255, 0.24)",
  listShadow: "0 10px 24px rgba(15, 35, 75, 0.28), inset 0 1px 0 rgba(255,255,255,0.14)",
  itemCommonBg: "linear-gradient(135deg, #4A608A 0%, #4A608A 55%, #3C5288 100%)",
  itemRareBg:   "linear-gradient(135deg, #2F5A93 0%, #2F5A93 52%, #453E84 100%)",
  itemEpicBg:   "linear-gradient(135deg, #4A3E86 0%, #4A3E86 48%, #6E5A32 100%)",
  itemLegendBg: "linear-gradient(135deg, #5B4488 0%, #735BA3 22%, #A37F2C 58%, #D5BD77 100%)",
  itemLegendShadow: "0 0 18px rgba(213,189,119,0.30), 0 10px 24px rgba(70,45,20,0.34), inset 0 1.5px 0 rgba(255,255,255,0.26), inset 0 -8px 16px rgba(40,25,8,0.3)",
  itemBorder: "1px solid rgba(210, 230, 255, 0.24)",
  itemShadow: "0 10px 24px rgba(15, 35, 75, 0.28), inset 0 1px 0 rgba(255,255,255,0.14)",
  iconBoxBg: "rgba(255,255,255,0.12)",
  iconBoxBorder: "1px solid rgba(255,255,255,0.22)",
  arrowBg: "rgba(255,255,255,0.14)",
  arrowColor: "#FFD166",
};
// 탐험모드 아이템 상점 — 상태별 버튼/문구 톤 (반투명 다크 판타지 UI)
// 대기중=보라빛 / 구매가능=초록빛 / 코인부족=어두운 비활성
export const ITEM_ACTION_STYLE = {
  waiting: {
    statusText: "#FFD76B",
    buttonBg: "linear-gradient(135deg, rgba(123,104,238,.16), rgba(162,135,255,.10))",
    buttonBorder: "1px solid rgba(185,168,255,.18)",
    buttonColor: "#C8B8FF",
    buttonShadow: "inset 0 1px 0 rgba(255,255,255,.08)",
  },
  available: {
    statusText: "#9FFFC4",
    buttonBg: "linear-gradient(135deg, rgba(82,196,126,.30), rgba(130,255,180,.18))",
    buttonBorder: "1px solid rgba(159,255,196,.36)",
    buttonColor: "#DFFFEA",
    buttonShadow: "0 0 14px rgba(82,196,126,.18), inset 0 1px 0 rgba(255,255,255,.14)",
  },
  disabled: {
    statusText: "rgba(255,255,255,.45)",
    buttonBg: "rgba(255,255,255,.08)",
    buttonBorder: "1px solid rgba(255,255,255,.08)",
    buttonColor: "rgba(255,255,255,.45)",
    buttonShadow: "none",
  },
};
// 캐릭터 탭 팝업 시트(꾸미기·아이템 상점 · 상장 · 보물창고 · 나의 펫 · 연속 달성 ·
// 탐험 기록) 전용 밝은 팔레트. [사용자 확정 2026-08-25: "우린 이제 밝은 수채화
// 그림으로 바꿨는데 이것만 어두워"] — 리스킨 전 '던전(RPG)' 시절 남색 배경을
// 걷어내고 앱 나머지가 이미 쓰는 크림·올리브 톤으로 맞췄다.
// 다른 화면 전역 팔레트(GP=dungeonPalette)는 손대지 않았다 — 이 7개 시트 전용이다.
export const CAMP_SHEET = {
  bodyBg: "linear-gradient(180deg, #FFFCF5 0%, #F6EDD6 100%)",
  headerBg: "linear-gradient(135deg, #7CB86A, #4C9450)",
  headerText: "#FFFFFF",
  headerTextSub: "rgba(255,255,255,0.88)",
  chipBg: "rgba(255,255,255,0.22)",
  chipBorder: "rgba(255,255,255,0.55)",
  chipText: "#FFFFFF",
  text: "#3A2E1C",
  textSub: "#8A7458",
};
// 탐험모드 "꾸미기 상점" 카드 전용 — 카드 배경은 흰색으로 통일하고
// 등급은 테두리색 + 은은한 그림자로만 구분.
// rarity 키: common(일반) / rare(희귀) / epic(영웅) / legendary(전설)
export const DUNGEON_DECOR_CARD = {
  // 통일 카드 배경 — 모든 등급 동일. 등급은 테두리·뱃지·그림자로만 표현
  // [사용자 확정 2026-08-25] 순백 대신 살짝 아이보리 — 눈이 더 편하다.
  cardBg: "#FFF9EC",
  // 미리보기 박스(아이콘 자리) — 카드보다 한 단계 따뜻한 크림 톤
  previewBg: "linear-gradient(135deg, #FBF3DE 0%, #F3E6C4 100%)",
  previewBorder: "rgba(180,150,90,0.30)",
  rarity: {
    common:    { border:"#C9A96A", glow:"0 3px 10px rgba(170,140,90,0.16)",  badgeText:"#8A6B2E", badgeBg:"rgba(170,140,90,0.16)" },
    rare:      { border:"#5B9BEA", glow:"0 3px 12px rgba(70,140,230,0.18)",  badgeText:"#2E64AE", badgeBg:"rgba(70,140,230,0.14)" },
    epic:      { border:"#A277E8", glow:"0 3px 12px rgba(150,110,230,0.20)", badgeText:"#6B3FC0", badgeBg:"rgba(150,110,230,0.14)" },
    legendary: { border:"#E8AE2E", glow:"0 3px 14px rgba(230,170,40,0.26)",  badgeText:"#9C6E00", badgeBg:"rgba(230,170,40,0.18)" },
  },
};
export const dungeonDecorRarity = (r="common") => DUNGEON_DECOR_CARD.rarity[r] || DUNGEON_DECOR_CARD.rarity.common;
// 등급별 대표색 (카드 왼쪽 컬러 바용)
export const getDungeonShopGradeColor = (grade="common") => {
  if(grade==="legendary") return "#D5BD77";
  if(grade==="epic")      return "#9B86E0";
  if(grade==="rare")      return "#5C97E8";
  return "#8FA8CE";
};
export const getDungeonShopItemBg = (grade="common") => {
  if(grade==="legendary") return DUNGEON_SHOP.itemLegendBg;
  if(grade==="epic")      return DUNGEON_SHOP.itemEpicBg;
  if(grade==="rare")      return DUNGEON_SHOP.itemRareBg;
  return DUNGEON_SHOP.itemCommonBg;
};
// 등급별 그림자 + inset highlight (테두리 없이 깊이감만)
export const getDungeonShopItemShadow = (grade="common") => {
  if(grade==="legendary") return DUNGEON_SHOP.itemLegendShadow;
  if(grade==="epic")      return "0 8px 20px rgba(60,45,110,0.3), inset 0 1.5px 0 rgba(255,255,255,0.22), inset 0 -8px 16px rgba(20,10,50,0.26)";
  if(grade==="rare")      return "0 8px 20px rgba(25,50,105,0.3), inset 0 1.5px 0 rgba(255,255,255,0.22), inset 0 -8px 16px rgba(10,25,60,0.26)";
  return "0 8px 18px rgba(20,40,85,0.3), inset 0 1.5px 0 rgba(255,255,255,0.24), inset 0 -8px 16px rgba(12,28,65,0.26)";
};

// 핵심 원칙: 탐험은 항상 밤하늘/남색 베이스를 유지하고,
// 분홍·살구·연두·보라·파랑은 진행바/버튼/테두리/글로우에만 입힌다.
export const hexToRgb = (hex="#FFFFFF") => {
  const h = hex.replace("#","");
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
};
export const rgbToHex = ([r,g,b]) => {
  const hx=(v)=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0").toUpperCase();
  return `#${hx(r)}${hx(g)}${hx(b)}`;
};
export const mixHex = (a,b,t=0.5) => {
  const A=hexToRgb(a), B=hexToRgb(b);
  return rgbToHex([A[0]*(1-t)+B[0]*t, A[1]*(1-t)+B[1]*t, A[2]*(1-t)+B[2]*t]);
};
export const colorDistance = (a,b) => {
  const A=hexToRgb(a), B=hexToRgb(b);
  return Math.abs(A[0]-B[0])+Math.abs(A[1]-B[1])+Math.abs(A[2]-B[2]);
};
export const DUNGEON_THEME_PRESETS = [
  // fan: 선택 탭용 판타지 그라데이션 [진한→중간→밝은], job: 직업 느낌 (채도 약간 낮춰 고급스럽게)
  { key:"pink",    match:"#FF6FA3", point:"#FF6FA3", point2:"#FF8FC0", soft:"#FFB6CC", deep:"#4B243D", scenery:"#C75FA0", aura:"rgba(255,111,163,0.38)", fan:["#A85282","#D66BA7","#E89BC6"], job:"요정" },
  { key:"apricot", match:"#FFB66B", point:"#FFB66B", point2:"#FFD681", soft:"#FFE1B8", deep:"#33241A", scenery:"#BE6E38", aura:"rgba(255,182,107,0.34)", fan:["#C77C5B","#E8A17D","#F2C1A3"], job:"힐러" },
  { key:"green",   match:"#7BE0A6", point:"#7BE0A6", point2:"#B9F0D2", soft:"#D9FBE7", deep:"#223F32", scenery:"#78C58B", aura:"rgba(123,224,166,0.32)", fan:["#5E8A56","#7DBE70","#B0E59A"], job:"엘프" },
  { key:"purple",  match:"#A78BFA", point:"#A78BFA", point2:"#CDBDFF", soft:"#E4D9FF", deep:"#33285A", scenery:"#8E72E8", aura:"rgba(167,139,250,0.36)", fan:["#625298","#9079DF","#A491E5"], job:"마법사" },
  { key:"blue",    match:"#60A8FF", point:"#60A8FF", point2:"#A9C9FF", soft:"#D7E8FF", deep:"#1E3356", scenery:"#5D8FEA", aura:"rgba(96,168,255,0.36)", fan:["#3D619A","#5A8EE3","#78A2E8"], job:"탐험가" },
];
export const getDungeonThemePreset = (main="#60A8FF") =>
  DUNGEON_THEME_PRESETS.reduce((best,p)=> colorDistance(main,p.match)<colorDistance(main,best.match)?p:best, DUNGEON_THEME_PRESETS[4]);
export const dungeonPalette = (main="#60A8FF") => {
  const d = getDungeonThemePreset(main);
  // 수채화 숲 톤(Forest 메인) — 네이비 베이스 폐지. '숲속 탐험 일지' 컨셉.
  // 카드: #5F7F68→#477447(Forest) / 테두리 Grass / 글씨 Cloud — 상단 수채화 무대와 한 톤으로 연결.
  // 테마색(d.deep)은 은은하게만 섞어 아이별 개성은 남기되 숲 톤을 유지한다.
  const bg0 = "#33503F";
  const bg1 = mixHex("#3C5E4A", d.deep, 0.16);
  const bg2 = mixHex("#4E7A57", d.deep, 0.18);
  // 카드 톤: 아래쪽이 무겁지 않게 기존보다 ~8% 밝게 (아이 앱 경쾌함)
  const card1 = mixHex("#6B8A74", d.deep, 0.10);
  const card2 = mixHex("#548150", d.deep, 0.10);
  // 종이 질감(3~5%): 미세한 점 + 따뜻한 빛 번짐 — '게임 UI'가 아니라 동화책 일지 느낌
  const paper = `radial-gradient(1.3px 1.3px at 18% 26%, rgba(255,255,255,0.055), transparent), radial-gradient(1.1px 1.1px at 64% 14%, rgba(255,255,255,0.045), transparent), radial-gradient(1.4px 1.4px at 84% 58%, rgba(255,255,255,0.05), transparent), radial-gradient(1.1px 1.1px at 36% 76%, rgba(255,255,255,0.04), transparent), radial-gradient(60% 40% at 82% 0%, rgba(246,209,143,0.06), transparent)`;
  return {
    dark:bg0,
    dark2:bg2,
    gold:"#F6D18F",
    coin:"#62B9E6",
    xp:"#A9B448",
    streak:d.point2,
    accent:d.point,
    themePoint:d.point,
    themePoint2:d.point2,
    themeFan:d.fan,
    themeJob:d.job,
    themeSoft:d.soft,
    themeDeep:d.deep,
    green:"#8FB081",
    neon:d.point,
    red:"#FF5C7A",
    scenery:d.scenery,
    aura:"rgba(246,209,143,0.10)",
    panelBg:`${paper}, linear-gradient(160deg, ${card1}, ${card2})`,
    panelText:"#F0F3F3",
    panelSub:"#DDE8DE",
    headerBg:`linear-gradient(135deg, ${bg2}, ${bg0})`,
    onDark:"#F0F3F3",
    onDarkSub:"rgba(240,243,243,0.75)",
    chipBg:"rgba(255,255,255,0.12)",
    chipBorder:"rgba(143,176,129,0.55)",
    chipText:"#F0F3F3",
    bubble:"rgba(255,255,255,0.08)",
    divider:"rgba(255,255,255,0.1)",
    boxBg:`${paper}, linear-gradient(150deg, ${card1}, ${card2})`,
    boxSolid:card2,
    boxText:"#F0F3F3",
    boxSub:"#DDE8DE",
    boxBorder:"rgba(143,176,129,0.55)",
    boxShadowCol:"rgba(35,64,42,0.35)",
    appBg:`linear-gradient(180deg, ${bg1} 0%, ${bg0} 55%, #2C4636 100%)`,
    tabActive:`linear-gradient(135deg, ${d.point}, ${d.point2})`,
    accentBar:`linear-gradient(90deg, #A9B448, #8FB081)`,
    missionDark:true,
    radCard:22,
    radMid:18,
    radSmall:14,
  };
};

// 현재 테마(main)에 맞춰 흰색 계열 박스색을 같은 계열로 물들인 색 세트 생성
export const makeThemeColors = (main) => ({
  ...C,
  card:   mixWhite(main, 0.96), // 거의 흰색이나 테마기운
  faint:  mixWhite(main, 0.90), // 항목 칸 기본 배경
  faintB: mixWhite(main, 0.82), // 항목 칸 테두리/진한 배경
});

// ── 디자인 토큰 ───────────────────────────────────────
// 글씨·여백·모서리·그림자를 일정 단계로 통일해 화면 전반의 통일감을 유지한다.
export const RAD = { sm:10, md:14, lg:20, pill:999 }; // border-radius scale
export const SHADOW = {
  sm:"0 2px 8px rgba(20,24,60,0.05)",
  md:"0 6px 18px rgba(20,24,60,0.07)",
  lg:"0 16px 44px rgba(20,24,60,0.12)",
};

export const gameCard = {
  background:"#fff",
  borderRadius:RAD.lg,
  border:`1px solid ${C.border}`,
  boxShadow:SHADOW.md
};

export const CHARACTER_CARD = {
  borderRadius:22,
  padding:"18px",
  marginBottom:14,
  background:"#fff",
  border:`1px solid ${C.border}`,
  boxShadow:"0 4px 14px rgba(0,0,0,.05)"
};

export const GAME_MODAL_STYLE = {
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
export const PALETTE = ["#FF6B6B","#FFC312","#26de81","#4A90E2","#9B59B6","#E91E8C"];
export const DEFAULT_HOMEWORK_SCORE = 10;
export const EXTRA_QUEST_ID = "extra_quest";
export const DEV_PIN = "9999"; // 개발자 도구 진입용 PIN

// 비밀번호 복구 질문 목록 (콤보 선택)
export const RECOVERY_QUESTIONS = [
  "아이의 어릴 적 별명은?",
  "내가 졸업한 초등학교 이름은?",
  "기억에 남는 여행지는?",
  "가장 좋아하는 음식은?",
  "어릴 때 키우던 반려동물 이름은?",
];

// ── 프리미엄(유료) 설정 ─────────────────────────────────
// PREMIUM_ENABLED = false 이면 모든 잠금이 해제되어 지금처럼 전 기능 무료로 동작한다.
// 유료 전환 시점에 이 값만 true 로 바꾸면 잠금이 일제히 작동한다. (그 외 코드 수정 불필요)
export const PREMIUM_ENABLED = false;
// 창립 사용자(무료 기간 설치자)는 PREMIUM_ENABLED 가 켜져도 평생 프리미엄으로 대우할지 여부
export const FOUNDING_USER_IS_PREMIUM = true;
// 무료로 열어줄 테마 개수 (앞에서부터 N개는 무료, 나머지는 프리미엄 잠금)
// [사용자 확정 2026-08-09] 색을 넷으로 줄이면서 네 개 다 무료로 연다.
export const FREE_THEME_COUNT = 4;
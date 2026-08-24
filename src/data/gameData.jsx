import { useState, useEffect } from "react";
import { C, mixBlack, softTint, dungeonPalette } from "./tokens.js";


/* ════════════════════════════════════════════════════════════════════════
   SECTION 4. 게임 데이터 (레벨/펫/진화/칭호/보상/꾸미기)
   ════════════════════════════════════════════════════════════════════════ */

export const DEFAULT_LEVELS = [
  // 밸런스: 하루 3미션 기준 만렙(Lv20)까지 약 6개월 페이스 (Lv20 minScore=6000).
  // 곡선 모양은 유지하고 전체 스케일만 키운 값. 미션 1개=XP 10점.
  { level:1,  name:"새싹 탐험가",   minScore:0,     emoji:"🌱" },
  { level:2,  name:"꼬마 탐험가",   minScore:30,    emoji:"🧭" },
  { level:3,  name:"호기심 탐험가", minScore:90,    emoji:"🔍" },
  { level:4,  name:"씩씩한 탐험가", minScore:190,   emoji:"🗺️" },
  { level:5,  name:"숲 탐험가",     minScore:320,   emoji:"🌲" },
  { level:6,  name:"들판 탐험가",   minScore:470,   emoji:"🌾" },
  { level:7,  name:"동굴 탐험가",   minScore:660,   emoji:"🕯️" },
  { level:8,  name:"강 탐험가",     minScore:880,   emoji:"🛶" },
  { level:9,  name:"바다 탐험가",   minScore:1140,  emoji:"🌊" },
  { level:10, name:"섬 탐험가",     minScore:1420,  emoji:"🏝️" },
  { level:11, name:"정글 원정대",   minScore:1740,  emoji:"🌴" },
  { level:12, name:"사막 원정대",   minScore:2080,  emoji:"🏜️" },
  { level:13, name:"설산 원정대",   minScore:2460,  emoji:"🏔️" },
  { level:14, name:"하늘 탐험가",   minScore:2870,  emoji:"🎈" },
  { level:15, name:"구름 탐험가",   minScore:3320,  emoji:"☁️" },
  { level:16, name:"별빛 탐험가",   minScore:3790,  emoji:"🌟" },
  { level:17, name:"은하 탐험가",   minScore:4290,  emoji:"🌌" },
  { level:18, name:"우주 탐험가",   minScore:4830,  emoji:"🚀" },
  { level:19, name:"행성 개척자",   minScore:5400,  emoji:"🪐" },
  { level:20, name:"전설의 탐험가", minScore:6000,  emoji:"👑" },
];

// 베이커리(cute) 모드 레벨 — 탐험과 동일한 minScore 임계값을 공유하고
// 이름/이모지만 갈아끼운다. (level 번호로 매칭)
export const BAKERY_LEVELS = [
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
export const levelView = (lv, skin, gender) => {
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


// ════════════════════════════════════════════════════════════
// 스킨 시스템 — 모든 모드별 디자인/텍스트/세계관을 한곳에 모음
// 구조는 동일, 값만 모드별로 다름. 렌더부는 SKINS[mode] 를 참조.
// ════════════════════════════════════════════════════════════
export const SKINS = {
  // ── 탐험 모드 (기존) ──────────────────────────────────────
  dungeon: {
    id:"dungeon",
    name:"탐험 게임",
    selectEmoji:"🧭",
    selectDesc:"탐험가가 되어 길을 떠나자!",
    // 팔레트
    palette:{
      dark:"#15162E", dark2:"#20224A",
      gold:"#FFD166", coin:"#F4C542", xp:"#6C63FF",
      streak:"#FF6B6B", accent:"#6C63FF",
      green:"#22C9A0", neon:"#6C63FF", red:"#FF5C7A",
      panelBg:"linear-gradient(160deg,#1B1D3A,#15162E)",
      panelText:"#FFFFFF", panelSub:"#A8AED0",
      // 헤더(dark 배경) 위에 올라가는 요소 토큰 — 탐험은 기존 흰색 룩 유지
      headerBg:"linear-gradient(135deg, #15162E, #20224A)", // dark→th.main 은 렌더부에서 합성, 여기는 폴백용
      onDark:"#FFFFFF", onDarkSub:"rgba(255,255,255,0.75)",
      chipBg:"rgba(255,255,255,0.16)", chipBorder:"rgba(255,255,255,0.35)",
      chipText:"#FFFFFF",
      bubble:"rgba(255,255,255,0.08)", divider:"rgba(255,255,255,0.1)",
      // 탐험식 '어두운 박스' 토큰 — 탐험은 기존 어두운 룩 유지
      boxBg:"linear-gradient(135deg, #15162E, #20224A)",
      boxSolid:"#15162E",
      boxText:"#FFFFFF", boxSub:"rgba(255,255,255,0.72)",
      boxBorder:"rgba(255,255,255,0.1)",
      boxShadowCol:"rgba(20,22,46,0.33)",
      // 화면 전체 바탕 — 탐험은 기존 차가운 톤 유지
      appBg:null,
      // 학원카드 내부 미션 강조박스 — 탐험은 어두운(테마색 어둡게) 그대로
      missionDark:true,
      radCard:20, radMid:18, radSmall:14,
    },
    // 아이별 테마색(분홍·살구·연두·보라·파랑)을 탐험 룩에 입히는 함수.
    // static palette는 폴백이고, 실제 렌더링은 이 paletteFn 결과를 사용한다.
    paletteFn:(main)=>dungeonPalette(main),
    // 세계관 텍스트
    text:{
      tabs:{ area:"🗺️ 탐험", quest:"🎯 미션", character:"🧒 내 캐릭터" },
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
      // 탐험 장소(학원 일정) 섹션
      areaTag:"🗺️ ADVENTURE MAP",
      todayArea:"오늘의 탐험 장소",
      dateAreaSuffix:"탐험 장소",   // "{날짜} 탐험 장소"
      noArea:"오늘은 탐험 장소가 없어요",
      noAreaEmoji:"😴",
      areaCountIcon:"🗺️",
      // 진행도별 응원 메시지
      // \n = 응원문구를 두 줄로 끊을 자리 (사용자 확정).
      // 예전엔 화면 쪽에서 '첫 띄어쓰기'를 기계적으로 잘라 "거의 / 다 왔어, 조금만 더!"처럼
      // 의미가 끊겼다. 이제 문구를 쓰는 곳에서 직접 정한다.
      // 끝 이모지는 화면에서 자동으로 떼어 작게 붙이므로 문구 끝에 그대로 둔다.
      // \n이 없으면 한 줄로 나온다. 말풍선 등 다른 자리에선 \n이 공백으로 접혀 한 줄로 보인다.
      progress:{
        rest:"오늘은\n쉬어가는 날! 😴",
        start:"오늘도 신나는\n탐험 출발! 🧭",
        low:"좋아,\n하나씩 해보자! 💪",
        high:"거의 다 왔어,\n조금만 더! ✨",
        done:"오늘 미션\n전부 클리어! ⭐",
      },
      // 활동 기록(탐험 기록) 라벨
      logName:"탐험 기록",
      log:{
        quest:{icon:"⚔️",title:"미션 클리어"},
        treasure:{icon:"🎁",title:"보물상자 오픈"},
        reward:{icon:"🛒",title:"아이템 구매"},
        level_bonus:{icon:"✨",title:"레벨업 보너스"},
        badge_reward:{icon:"🏆",title:"업적 보상"},
        manual:{icon:"✍️",title:"엄마 점수 조정"},
        default:{icon:"📜",title:"탐험 기록"},
      },
    },
    // 완료 표시 = 기존 체크(탐험은 도장 모티프 OFF)
    stamp:{ on:false },
    // 학원명 → 아이콘/라벨 매칭 (기존 탐험 규칙)
    academyRules:[
      { kw:["영어","english","어학","파닉스","토익","토플"], icon:"📖", label:"마법 언어의 탑" },
      { kw:["수학","math","산수","연산","사고력"],            icon:"🔢", label:"숫자 미궁" },
      { kw:["국어","논술","독서","글쓰기","문해"],            icon:"✍️", label:"고대 문헌의 방" },
      { kw:["과학","science","코딩","로봇","컴퓨터","sw","stem"], icon:"🔬", label:"연금술 실험실" },
      { kw:["태권","태권도","검도","합기도","유도","무술","주짓수"], icon:"🥋", label:"용감 도장" },
      { kw:["피아노","바이올린","음악","첼로","기타","드럼","악기"], icon:"🎹", label:"선율의 신전" },
      { kw:["미술","그림","드로잉","아트","art","디자인"],     icon:"🎨", label:"색채의 화방" },
      { kw:["발레","무용","댄스","dance","방송댄스"],          icon:"🩰", label:"춤추는 무대" },
      { kw:["수영","swim","스포츠","축구","농구","체육","운동"], icon:"🏊", label:"물의 시련장" },
      { kw:["바둑","장기","체스","보드"],                      icon:"♟️", label:"전략의 방" },
      { kw:["한자","중국어","일본어","제2외국어","스페인어"],  icon:"🀄", label:"동방 문자의 길" },
      { kw:["요리","쿠킹","베이킹"],                           icon:"🍳", label:"마녀의 부엌" },
    ],
    academyDefault:{ icon:"🏰", label:"미지의 탐험" },
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
      // dark/dark2 는 탐험에선 어두운 배경이지만, 베이커리에선
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
      // 탐험식 '어두운 박스'들이 참조하는 토큰 — 베이커리는 맑은 크림박스
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
        // 테마별 고정 배경색 (안B) — softTint 연산 없이 항상 동일한 색으로 고정
        appBg: (m === "#FF6FA3") ? "linear-gradient(180deg, #FFF0F6 0%, #FFF6F2 45%, #FDF4F8 100%)"  // 분홍
             : (m === "#FFB66B") ? "linear-gradient(180deg, #FFF6EE 0%, #FFFAF5 45%, #FFF8F2 100%)"  // 살구
             : (m === "#7BE0A6") ? "linear-gradient(180deg, #F4FCF6 0%, #F8FEF9 45%, #F3FCF6 100%)"  // 연두
             : (m === "#A78BFA") ? "linear-gradient(180deg, #F8F5FF 0%, #FBF8FF 45%, #F9F6FF 100%)"  // 보라
             : (m === "#60A8FF") ? "linear-gradient(180deg, #F0F8FF 0%, #F6FBFF 45%, #F2F8FF 100%)"  // 파랑
             : `linear-gradient(180deg, ${L_app} 0%, ${tint(0.76)} 45%, ${tint(0.73)} 100%)`,        // 기타(fallback)
        missionDark:false,
        // 둥글기 — 베이커리는 더 말랑하게(큰 카드 28, 중간 22, 작은 16)
        radCard:28, radMid:22, radSmall:16,
        // 배경 스프링클 점무늬 — 테마별 고정색
        appPattern: (m === "#FF6FA3") ? `radial-gradient(#FADADF 1.5px, transparent 1.6px), radial-gradient(#FADADF 1.5px, transparent 1.6px)`  // 분홍
                  : (m === "#FFB66B") ? `radial-gradient(#FFD8B0 1.5px, transparent 1.6px), radial-gradient(#FFD8B0 1.5px, transparent 1.6px)`  // 살구
                  : (m === "#7BE0A6") ? `radial-gradient(#B8E8C8 1.5px, transparent 1.6px), radial-gradient(#B8E8C8 1.5px, transparent 1.6px)`  // 연두
                  : (m === "#A78BFA") ? `radial-gradient(#E4D8FC 1.5px, transparent 1.6px), radial-gradient(#E4D8FC 1.5px, transparent 1.6px)`  // 보라
                  : (m === "#60A8FF") ? `radial-gradient(#B8D8FF 1.5px, transparent 1.6px), radial-gradient(#B8D8FF 1.5px, transparent 1.6px)`  // 파랑
                  : `radial-gradient(${tint(0.40)} 1.5px, transparent 1.6px), radial-gradient(${tint(0.40)} 1.5px, transparent 1.6px)`,         // 기타(fallback)
        appPatternSize:"22px 22px", appPatternPos:"0 0, 11px 11px",
      };
    },
    // 세계관 텍스트 — 베이커리/도장
    text:{
      tabs:{ area:"🏡 거리", quest:"🎀 오늘 할 일", character:"🧸 내 캐릭터" },
      heroStatus:"TODAY'S BAKER",
      dailyArea:"TODAY MISSION",
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
      // 탐험 장소(학원 일정) 섹션 → 베이커리 톤
      areaTag:"",
      todayArea:"오늘의 거리",
      dateAreaSuffix:"들를 가게",   // "{날짜} 들를 가게"
      noArea:"오늘은 들를 가게가 없어요",
      noAreaEmoji:"🍪",
      areaCountIcon:"🏡",
      // 진행도별 응원 메시지 → 베이커리 톤
      progress:{
        rest:"오늘은\n쉬는 날이에요 🍪",
        start:"오늘도 달콤하게\n시작해볼까요? 🧁",
        low:"좋아요,\n하나씩 만들어봐요! 💪",
        high:"거의 다\n구웠어요! 🍞",
        done:"오늘 가게 일 끝!\n참 잘했어요 🎀",
      },
      // 활동 기록(베이커리 일기) 라벨
      logName:"베이커리 일기",
      log:{
        quest:{icon:"🧁",title:"미션 완료"},
        treasure:{icon:"🎀",title:"디저트상자 오픈"},
        reward:{icon:"🛍️",title:"아이템 구매"},
        level_bonus:{icon:"✨",title:"레벨업 보너스"},
        badge_reward:{icon:"🏆",title:"업적 보상"},
        manual:{icon:"✍️",title:"엄마 점수 조정"},
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
    // 학원명 → 베이커리/디저트 아이콘·라벨 (탐험과 같은 12개 카테고리)
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
/* ── 베이커리 모드 출시 스위치 (사용자 확정 2026-07-29) ──────────────────
   탐험 모드만 먼저 출시한다. 베이커리는 완성되면 유료로 추가 예정.
   다시 열 때는 이 값만 true로 바꾸면 된다 — 이 플래그가 가리는 것:
     · 아이 첫 진입의 모드 선택 화면(ModeSelect)  → 끈 동안엔 탐험으로 바로 시작
     · 설정의 '게임 디자인 선택' 카드
     · 저장된 'cute' 스킨 반영 → 끈 동안에도 탐험으로 표시만 하고,
       저장값(v6_kid_skin_map)은 절대 지우지 않는다 (켜면 그대로 복귀)
   끈 동안 새 아이에게 스킨을 자동 저장하지 않는다 — 저장해 버리면
   나중에 베이커리가 열려도 선택 화면이 영영 안 뜬다.
   [현재 꺼짐] 2026-08-09 사용자 확정 — 탐험 단독으로 간다.
   저장값(v6_kid_skin_map)은 그대로 두므로, 다시 true로 바꾸면 쓰던 아이는 베이커리로 복귀한다. */
export const BAKERY_ENABLED = false;

export const DEFAULT_SKIN = "dungeon";
export const getSkin = (mode) => SKINS[mode] || SKINS[DEFAULT_SKIN];

// ── 학원명 → 탐험 아이콘/테마 자동 매칭 ─────────────────────
// 학원 이름 속 키워드로 RPG 탐험 느낌의 아이콘과 라벨을 자동 부여한다.
export const ACADEMY_DUNGEON_RULES = [
  { kw:["영어","english","어학","파닉스","토익","토플"],            icon:"📖", label:"마법 언어의 탑" },
  { kw:["수학","math","산수","연산","사고력"],                       icon:"🔢", label:"숫자 미궁" },
  { kw:["국어","논술","독서","글쓰기","문해"],                       icon:"✍️", label:"고대 문헌의 방" },
  { kw:["과학","science","코딩","로봇","컴퓨터","sw","stem"],        icon:"🔬", label:"연금술 실험실" },
  { kw:["태권","태권도","검도","합기도","유도","무술","주짓수"],     icon:"🥋", label:"용감 도장" },
  { kw:["피아노","바이올린","음악","첼로","기타","드럼","악기"],     icon:"🎹", label:"선율의 신전" },
  { kw:["미술","그림","드로잉","아트","art","디자인"],               icon:"🎨", label:"색채의 화방" },
  { kw:["발레","무용","댄스","dance","방송댄스"],                    icon:"🩰", label:"춤추는 무대" },
  { kw:["수영","swim","스포츠","축구","농구","체육","운동"],         icon:"🏊", label:"물의 시련장" },
  { kw:["바둑","장기","체스","보드"],                                icon:"♟️", label:"전략의 방" },
  { kw:["한자","중국어","일본어","제2외국어","스페인어"],            icon:"🀄", label:"동방 문자의 길" },
  { kw:["요리","쿠킹","베이킹"],                                     icon:"🍳", label:"마녀의 부엌" },
];
/* ── 학원 종류 목록 (사용자 확정 2026-08-09) ───────────────────────────
   예전엔 학원 '이름'만 받아서 그 안의 낱말로 아이콘을 추측했다 —
   "청담어학원"처럼 과목 낱말이 없으면 미지의 탐험(🏰)이 돼 버렸다.
   이제 등록할 때 종류를 골라 두고, 아이콘·던전 이름은 그 종류에서 바로 꺼낸다.
   종류가 많아 검색으로 고르며, 목록에 없으면 '직접 입력'으로 적는다.
     key   : 저장값 (academy.kind)
     label : 화면에 보이는 이름
     icon  : 지도·일지·미션에 쓰는 이모지
     kw    : 던전 이름(선율의 신전 등)을 찾을 때 쓰는 대표 낱말 (ACADEMY_DUNGEON_RULES 기준) */
export const ACADEMY_KINDS = [
  { key:"english",    label:"영어",        icon:"📖",  kw:"영어" },
  { key:"math",       label:"수학",        icon:"🔢",  kw:"수학" },
  { key:"korean",     label:"국어",        icon:"✍️",  kw:"국어" },
  { key:"essay",      label:"논술·글쓰기",  icon:"📝",  kw:"논술" },
  { key:"reading",    label:"독서·독해",    icon:"📚",  kw:"독서" },
  { key:"hanja",      label:"한자",        icon:"🀄",  kw:"한자" },
  { key:"chinese",    label:"중국어",      icon:"🇨🇳", kw:"중국어" },
  { key:"japanese",   label:"일본어",      icon:"🇯🇵", kw:"일본어" },
  { key:"science",    label:"과학",        icon:"🔬",  kw:"과학" },
  { key:"coding",     label:"코딩",        icon:"💻",  kw:"코딩" },
  { key:"robot",      label:"로봇",        icon:"🤖",  kw:"로봇" },
  { key:"piano",      label:"피아노",      icon:"🎹",  kw:"피아노" },
  { key:"violin",     label:"바이올린",     icon:"🎻",  kw:"바이올린" },
  { key:"cello",      label:"첼로",        icon:"🎼",  kw:"첼로" },
  { key:"guitar",     label:"기타(악기)",   icon:"🎸",  kw:"기타" },
  { key:"drum",       label:"드럼",        icon:"🥁",  kw:"드럼" },
  { key:"vocal",      label:"노래·성악",    icon:"🎤",  kw:"음악" },
  { key:"art",        label:"미술",        icon:"🎨",  kw:"미술" },
  { key:"drawing",    label:"그림·드로잉",  icon:"🖍️",  kw:"그림" },
  { key:"design",     label:"디자인",      icon:"🖌️",  kw:"디자인" },
  { key:"taekwondo",  label:"태권도",      icon:"🥋",  kw:"태권도" },
  { key:"kendo",      label:"검도",        icon:"⚔️",  kw:"검도" },
  { key:"jiujitsu",   label:"주짓수·유도",  icon:"🤼",  kw:"주짓수" },
  { key:"ballet",     label:"발레",        icon:"🩰",  kw:"발레" },
  { key:"dance",      label:"댄스·무용",    icon:"💃",  kw:"댄스" },
  { key:"swim",       label:"수영",        icon:"🏊",  kw:"수영" },
  { key:"soccer",     label:"축구",        icon:"⚽",  kw:"축구" },
  { key:"basketball", label:"농구",        icon:"🏀",  kw:"농구" },
  { key:"badminton",  label:"배드민턴",     icon:"🏸",  kw:"스포츠" },
  { key:"pe",         label:"체육",        icon:"🤸",  kw:"체육" },
  { key:"cooking",    label:"요리·베이킹",  icon:"🍳",  kw:"요리" },
  { key:"baduk",      label:"바둑",        icon:"⚫",  kw:"바둑" },
  { key:"chess",      label:"체스",        icon:"♟️",  kw:"체스" },
  { key:"speech",     label:"스피치·웅변",  icon:"📣",  kw:"글쓰기" },
  { key:"worksheet",  label:"학습지",      icon:"📋",  kw:"사고력" },
  { key:"allinone",   label:"보습·종합",    icon:"🏫",  kw:"" },
];
export const ACADEMY_KIND_CUSTOM = "custom";   // 목록에 없어 직접 적은 종류
export const getAcademyKind = (key) => ACADEMY_KINDS.find(k=>k.key===key) || null;
/* 종류를 안 고르고 등록했던 예전 학원 — 이름 속 낱말로 종류를 되짚어 준다 (수정 화면 기본값용).
   2단계로 찾는다. ① 종류 이름이 그대로 들어 있나 ("피아노학원" → 피아노)
   ② 아니면 던전 규칙의 낱말로 과목을 알아낸 뒤 그 과목의 대표 종류로 ("청담어학원" → 어학 → 영어)
   둘 다 안 걸리면(예: "으뜸교실") null — 화면에서 직접 고르게 둔다. */
export const guessAcademyKind = (name="") => {
  const n = String(name).toLowerCase();
  const direct = ACADEMY_KINDS.find(k=>k.kw && (n.includes(k.label.toLowerCase()) || n.includes(k.kw.toLowerCase())));
  if(direct) return direct;
  const rule = ACADEMY_DUNGEON_RULES.find(r=>r.kw.some(k=>n.includes(k.toLowerCase())));
  if(!rule) return null;
  return ACADEMY_KINDS.find(k=>k.kw && rule.kw.includes(k.kw)) || null;
};

export const getAcademyDungeon = (name="") => {
  const n = String(name).toLowerCase();
  for(const r of ACADEMY_DUNGEON_RULES){
    if(r.kw.some(k=>n.includes(k.toLowerCase()))) return r;
  }
  return { icon:"🏰", label:"미지의 탐험" };
};

// ── 스킨별 학원 아이콘/라벨 매칭 ───────────────────────────
// 베이커리(cute) 모드는 SKINS.cute.academyRules/academyDefault 를 사용하고,
// 그 외(탐험 등)는 기존 getAcademyDungeon 규칙을 그대로 사용한다.
/* kindKey를 주면 그 종류로 찾는다 (이름에 과목 낱말이 없어도 아이콘이 맞는다).
   아이콘은 종류에 정해 둔 것을 쓰고, 던전 이름(라벨)만 기존 규칙에서 꺼낸다.
   종류가 없으면 예전처럼 이름으로 추측한다 — 기존 학원이 그대로 동작한다. */
export const getAcademyTheme = (name="", skin=DEFAULT_SKIN, kindKey="") => {
  const kind = getAcademyKind(kindKey);
  const base = kind && kind.kw ? kind.kw : name;
  const s = SKINS[skin];
  let found;
  if(s && s.academyRules){
    const n = String(base).toLowerCase();
    found = s.academyRules.find(r=>r.kw.some(k=>n.includes(k.toLowerCase())))
         || s.academyDefault || { icon:"🏡", label:"우리 가게" };
    return found;                       // 베이커리는 가게 컨셉이라 아이콘을 바꾸지 않는다
  }
  found = getAcademyDungeon(base);
  return kind ? { ...found, icon: kind.icon } : found;
};

// ── 오늘의 탐험 지도 / 오늘의 빵집 지도 : 섬 경로 맵 ─────────────
// 게임 레벨맵처럼 섬 위 구불구불한 길에 학원(스테이지)이 시간순으로 놓인다.
// 탐험 모드=밤의 섬(달·별·횃불 길), 베이커리 모드=캔디랜드.
// 캐릭터가 현재 시각에 따라 길 위를 이동하고, 지나간 길은 밝아진다.
export const _mapToMin = (t="") => { const [h,m]=String(t).split(":").map(Number); return (h||0)*60+(m||0); };

// items: [{ id, name, color, time:"HH:MM", duration, icon, done, total }]
// mode: "today" | "past" | "future"  (past=모두 통과, future=출발 전)
export const IslandMap = ({ items=[], night=true, mode="today", charEmoji="" }) => {
  const [tick,setTick]=useState(0);
  // 현재 시각(분, 초 정밀도). past=아주 큼, future=아주 작음
  const nowMin = mode==="past" ? 100000 : mode==="future" ? -100000
    : (()=>{ const d=new Date(); return d.getHours()*60+d.getMinutes()+d.getSeconds()/60; })();

  const P = night ? {
    sea:"linear-gradient(180deg,#233458 0%,#1B2947 55%,#141F38 100%)",
    shore:"#5C5540", grass:"#37543F", grassDark:"#28402F",
    road:"#FFC85C", roadEdge:"#8F6B2A", roadDash:"#FFF2C9", roadDim:"#4A5468",
    nodeBg:"#FFFDF4", deco:["🌲","🏕️","🔥","🦉","⛰️"],
    labelBg:"rgba(12,20,38,.82)", labelText:"#FFFFFF", gold:"#FFD37A",
    startIcon:"🏠", startLabel:"우리 집", goalIcon:"🏆", goalLabel:"탐험 완료!",
    char:"🦸", doneMark:"⭐",
  } : {
    sea:"linear-gradient(180deg,#FFDCE9 0%,#FFC9DD 55%,#FFBAD3 100%)",
    shore:"#FBE6C9", grass:"#FFF9F0", grassDark:"#F3E2CA",
    // 케이크 컨셉: 미완료=크림만 바른 길, 완료=딸기시럽 코팅
    roadCream:"#FFEED0", roadCreamEdge:"#F4D9B0",   // 크림 (미완료)
    road:"#FCC3D8", roadEdge:"#F0A6C1", roadDash:"#FFF0F6",  // 딸기우유 (완료, 채도↓)
    roadDim:"#FFEED0",  // 미점등 = 크림
    nodeBg:"#FFFFFF", deco:["🍭","🧁","🍩","🍬","🍓"],
    labelBg:"rgba(160,80,110,.80)", labelText:"#FFFFFF", gold:"#E7788F",
    startIcon:"🏡", startLabel:"우리 집", goalIcon:"🎂", goalLabel:"거리 완주!",
    char:"🧑‍🍳", doneMark:"🌸",
  };

  const W=330, STEP=98, PAD_TOP=44, PAD_BOT=52, XL=68, XR=W-68;
  const sorted=[...items].sort((a,b)=>_mapToMin(a.time)-_mapToMin(b.time));
  const nodes=[{kind:"start"},...sorted.map(a=>({kind:"academy",a})),{kind:"goal"}]
    .map((n,i)=>({...n, x:i%2===0?XL:XR, y:PAD_TOP+i*STEP}));
  const H=PAD_TOP+(nodes.length-1)*STEP+PAD_BOT;

  const TRAVEL=30;             // 다음 수업 시작 몇 분 전에 출발
  const GOAL_TRAVEL=20/60;     // 마지막 수업 종료 후 도착점까지(20초)
  const passTime=(n)=>{
    if(n.kind==="start") return sorted.length?_mapToMin(sorted[0].time)-999:0;
    if(n.kind==="goal") return sorted.length?_mapToMin(sorted[sorted.length-1].time)+(sorted[sorted.length-1].duration||40)+GOAL_TRAVEL:1440;
    return _mapToMin(n.a.time)+(n.a.duration||40);
  };

  let charIdx=0;
  nodes.forEach((n,i)=>{ if(nowMin>=passTime(n)) charIdx=i; });
  const curNode=nodes[charIdx], nextNode=nodes[Math.min(charIdx+1,nodes.length-1)];
  let ct=0;
  if(charIdx<nodes.length-1){
    // 다음이 학원: 수업 시작 30분 전 출발 → 시작 시각 도착
    // 다음이 도착점: 마지막 수업 종료 시각 출발 → GOAL_TRAVEL분 뒤 도착
    const lastEndT = passTime(curNode); // curNode=마지막 학원
    const t1 = nextNode.kind==="academy" ? _mapToMin(nextNode.a.time) : lastEndT+GOAL_TRAVEL;
    const t0 = nextNode.kind==="academy" ? t1-TRAVEL : lastEndT;
    ct = t1>t0 ? Math.min(Math.max((nowMin-t0)/(t1-t0),0),1) : (nowMin>=t0?1:0);
  }
  const charX=curNode.x+(nextNode.x-curNode.x)*ct;
  const charY=curNode.y+(nextNode.y-curNode.y)*ct;

  // 갱신 주기: 마지막 학원→도착점 이동(20초) 중이면 1초, 평소엔 1분
  const goalMoving = mode==="today" && curNode.kind==="academy"
    && nextNode.kind==="goal" && ct>0 && ct<1;
  useEffect(()=>{
    if(mode!=="today") return;
    const iv=setInterval(()=>setTick(t=>t+1), goalMoving?1000:60000);
    return ()=>clearInterval(iv);
  },[mode,goalMoving]);


  const segPath=(p,q)=>{ const my=(p.y+q.y)/2; return `M ${p.x} ${p.y} C ${p.x} ${my}, ${q.x} ${my}, ${q.x} ${q.y}`; };
  const decos=nodes.slice(1,-1).map((n,i)=>({
    x:n.x>W/2?XL-30:XR+30, y:n.y+18, e:P.deco[i%P.deco.length], s:20+(i%3)*4,
  }));

  return (
    <div style={{position:"relative", width:"100%", height:H, overflow:"hidden",
      borderRadius:20, background:P.sea}}>
      {/* 물결 / 달빛 반사 */}
      {[0.2,0.5,0.8].map((f,i)=>(
        <div key={i} style={{position:"absolute", left:i%2?"6%":"68%", top:`${f*100}%`,
          width:46, height:8, borderRadius:8,
          background:night?"rgba(180,205,255,.18)":"rgba(255,255,255,.35)"}}/>
      ))}
      {/* 밤: 별 + 반딧불 */}
      {night&&(<>
        {[[14,"4%"],[86,"7%"],[40,"12%"],[70,"30%"],[10,"38%"],[90,"52%"],[22,"66%"],[78,"78%"],[50,"88%"]].map(([x,y],i)=>(
          <div key={`st${i}`} style={{position:"absolute", left:`${x}%`, top:y,
            width:i%3===0?3:2, height:i%3===0?3:2, borderRadius:"50%",
            background:"#FFF6D8", opacity:0.85, boxShadow:"0 0 6px rgba(255,246,216,.9)",
            animation:`mpTwinkle ${2+(i%3)}s ease-in-out ${i*0.4}s infinite`}}/>
        ))}
        {[[30,"26%"],[62,"58%"],[38,"74%"]].map(([x,y],i)=>(
          <div key={`ff${i}`} style={{position:"absolute", left:`${x}%`, top:y,
            width:5, height:5, borderRadius:"50%", background:"#C9F76F", opacity:0.9,
            boxShadow:"0 0 10px rgba(201,247,111,.95)",
            animation:`mpTwinkle ${1.6+i*0.5}s ease-in-out ${i*0.7}s infinite`}}/>
        ))}
      </>)}

      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMin meet"
        style={{position:"absolute", inset:0}}>
        {/* 섬: 모래사장 + 풀 */}
        <g>
          {nodes.map((n,i)=>(<ellipse key={`sh${i}`} cx={n.x} cy={n.y+6} rx={114} ry={62} fill={P.shore}/>))}
          {nodes.slice(0,-1).map((n,i)=>(<ellipse key={`shm${i}`} cx={(n.x+nodes[i+1].x)/2} cy={(n.y+nodes[i+1].y)/2+6} rx={98} ry={58} fill={P.shore}/>))}
          {nodes.map((n,i)=>(<ellipse key={`gr${i}`} cx={n.x} cy={n.y+3} rx={104} ry={53} fill={P.grass}/>))}
          {nodes.slice(0,-1).map((n,i)=>(<ellipse key={`grm${i}`} cx={(n.x+nodes[i+1].x)/2} cy={(n.y+nodes[i+1].y)/2+3} rx={88} ry={50} fill={P.grass}/>))}
          {nodes.map((n,i)=>i%2===0&&(<ellipse key={`gd${i}`} cx={n.x+30} cy={n.y+34} rx={40} ry={16} fill={P.grassDark} opacity={0.35}/>))}
        </g>
        {/* 길: 캐릭터가 지나온 만큼 색이 채워진다 (구간별 부분 채움) */}
        {nodes.slice(0,-1).map((p,i)=>{
          const q=nodes[i+1];
          const fill = i<charIdx ? 1 : i===charIdx ? ct : 0;
          const lit = fill>0.001;
          const dash = `${fill} ${1-fill+0.0001}`;
          const d = segPath(p,q);
          return (
            <g key={`rd${i}`}>
              {night ? (
                /* ── 밤: 횃불 길 (도로 폭 ~30% 축소 — 아기자기하게) ── */
                <>
                  <path d={d} fill="none" stroke={P.roadEdge} strokeWidth={16}
                    strokeLinecap="round" opacity={fill>=1?1:0.55}/>
                  <path d={d} fill="none" stroke={P.roadDim} strokeWidth={11} strokeLinecap="round"/>
                  {lit&&(<path d={d} fill="none" stroke="#FFD873" strokeWidth={19}
                    strokeLinecap="round" pathLength={1} strokeDasharray={dash}
                    opacity={0.45} style={{filter:"blur(5px)"}}/>)}
                  {lit&&(<path d={d} fill="none" stroke={P.road} strokeWidth={11}
                    strokeLinecap="round" pathLength={1} strokeDasharray={dash}
                    style={{filter:"drop-shadow(0 0 6px rgba(255,210,110,.95))"}}/>)}
                  {lit&&(<path d={d} fill="none" stroke="#FFF3C8" strokeWidth={4}
                    strokeLinecap="round" pathLength={1} strokeDasharray={dash} opacity={0.9}/>)}
                  <path d={d} fill="none" stroke={P.roadDash} strokeWidth={2.5}
                    strokeLinecap="round" strokeDasharray="1 12" opacity={fill>=1?1:0.4}/>
                </>
              ) : (
                /* ── 베이커리: 크림 길 → 딸기우유 코팅 (윤기로 완성감) ── */
                <>
                  {/* 크림 테두리 (항상) */}
                  <path d={d} fill="none" stroke={P.roadCreamEdge} strokeWidth={23} strokeLinecap="round"/>
                  {/* 크림 본체 (미완료 구간) */}
                  <path d={d} fill="none" stroke={P.roadCream} strokeWidth={16} strokeLinecap="round"/>
                  {/* 크림 광택 */}
                  <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" opacity={0.4}/>
                  {/* 딸기우유 테두리 (지나간 만큼, 은은하게) */}
                  {lit&&(<path d={d} fill="none" stroke={P.roadEdge} strokeWidth={22}
                    strokeLinecap="round" pathLength={1} strokeDasharray={dash} opacity={0.85}/>)}
                  {/* 딸기우유 코팅 본체 (그림자 없이 부드럽게) */}
                  {lit&&(<path d={d} fill="none" stroke={P.road} strokeWidth={16}
                    strokeLinecap="round" pathLength={1} strokeDasharray={dash}/>)}
                  {/* 시럽 윤기 — 위쪽에 살짝 오프셋된 밝은 하이라이트 (광택 반사) */}
                  {lit&&(<path d={d} fill="none" stroke="#FFFFFF" strokeWidth={4}
                    strokeLinecap="round" pathLength={1} strokeDasharray={dash}
                    opacity={0.6} transform="translate(0,-2.5)"/>)}
                </>
              )}
            </g>
          );
        })}
        {/* 베이커리 전부 완료 시: 길 위에 스프링클 (은은하게, 구간당 1~2개) */}
        {!night && sorted.length>0 && nowMin>=passTime({kind:"goal"}) &&
          nodes.slice(0,-1).flatMap((p,i)=>{
            if(i===0) return []; // 집→첫 학원 구간엔 스프링클 없음
            const q=nodes[i+1];
            const cols=["#F7B8CE","#FFDD9E","#A8DCE8","#C9B8F0"]; // 파스텔
            // 짝수 구간은 1개, 홀수 구간은 2개 → 전체적으로 절반 수준
            const spots = i%2===0 ? [0.5] : [0.38,0.7];
            return spots.map((tp,j)=>{
              const my=(p.y+q.y)/2;
              const bx=(1-tp)*(1-tp)*p.x + 2*(1-tp)*tp*((p.x+q.x)/2) + tp*tp*q.x;
              const by=(1-tp)*(1-tp)*p.y + 2*(1-tp)*tp*my + tp*tp*q.y;
              const off=(j%2?1:-1)*(7+j*2);
              const rot=(i*55+j*80)%360;
              return (
                <g key={`sp${i}-${j}`} transform={`translate(${bx+off} ${by-off*0.5}) rotate(${rot})`} opacity={0.9}>
                  <rect x={-1.3} y={-3.6} width={2.6} height={7.2} rx={1.3}
                    fill={cols[(i*2+j)%cols.length]}
                    style={{filter:"drop-shadow(0 1px 1px rgba(0,0,0,.1))"}}/>
                </g>
              );
            });
          })
        }
      </svg>

      {/* 하늘: 밤=달 / 낮=구름 */}
      {night?(<>
        <div style={{position:"absolute", top:8, right:14, fontSize:30,
          filter:"drop-shadow(0 0 14px rgba(255,240,180,.7))"}}>🌙</div>
        <div style={{position:"absolute", top:H*0.45, left:8, fontSize:18, opacity:0.35}}>☁️</div>
      </>):(<>
        <div style={{position:"absolute", top:10, right:14, fontSize:26, opacity:0.9}}>☁️</div>
        <div style={{position:"absolute", top:H*0.45, left:8, fontSize:20, opacity:0.75}}>☁️</div>
        <div style={{position:"absolute", bottom:30, right:10, fontSize:22, opacity:0.8}}>☁️</div>
      </>)}

      {/* 섬 장식 */}
      {decos.map((d,i)=>(
        <div key={i} style={{position:"absolute", left:d.x, top:d.y, fontSize:d.s,
          transform:"translate(-50%,-50%)", pointerEvents:"none",
          filter:"drop-shadow(0 2px 2px rgba(0,0,0,.15))"}}>{d.e}</div>
      ))}

      {/* 노드 */}
      {nodes.map((n,i)=>{
        if(n.kind==="start"){
          return (
            <div key="start" style={{position:"absolute", left:n.x, top:n.y,
              transform:"translate(-50%,-50%)", display:"flex", flexDirection:"column", alignItems:"center"}}>
              <div style={{fontSize:38, filter:"drop-shadow(0 3px 4px rgba(0,0,0,.2))"}}>{P.startIcon}</div>
              <span style={{marginTop:6, fontSize:10.5, fontWeight:900, color:P.labelText,
                background:P.labelBg, borderRadius:999, padding:"3px 9px"}}>{P.startLabel}</span>
            </div>
          );
        }
        if(n.kind==="goal"){
          const allDone=sorted.length>0&&nowMin>=passTime({kind:"goal"});
          return (
            <div key="goal" style={{position:"absolute", left:n.x, top:n.y,
              transform:"translate(-50%,-50%)", display:"flex", flexDirection:"column", alignItems:"center"}}>
              <div style={{fontSize:42,
                filter:allDone?`drop-shadow(0 0 12px ${P.gold})`:"drop-shadow(0 3px 4px rgba(0,0,0,.2))",
                transition:"filter .4s"}}>{P.goalIcon}</div>
              <span style={{marginTop:6, fontSize:10.5, fontWeight:900, color:P.labelText,
                background:P.labelBg, borderRadius:999, padding:"3px 9px"}}>{P.goalLabel}</span>
            </div>
          );
        }
        const a=n.a;
        const st=_mapToMin(a.time), en=st+(a.duration||40);
        const passed=nowMin>=en, live=st<=nowMin&&nowMin<en;
        const clear=a.total>0&&a.done===a.total;
        return (
          <div key={a.id} style={{position:"absolute", left:n.x, top:n.y,
            transform:"translate(-50%,-50%)", display:"flex", flexDirection:"column", alignItems:"center"}}>
            <div style={{width:live?58:50, height:live?58:50, borderRadius:"50%",
              background:passed&&!clear?(night?"#39404F":"#EDE3E6"):P.nodeBg,
              border:`${live?4:3.5}px solid ${a.color}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:live?26:22, position:"relative",
              boxShadow:live?`0 0 22px ${a.color}, 0 0 0 4px ${a.color}44`
                :passed?`0 2px 6px rgba(0,0,0,.25)`:`0 4px 12px rgba(0,0,0,.22)`,
              opacity:passed&&!clear?0.55:1,
              filter:passed&&!clear?"grayscale(0.5)":"none",
              transition:"all .3s"}}>
              {a.icon}
              {clear&&(<span style={{position:"absolute", top:-9, right:-9, fontSize:17,
                filter:"drop-shadow(0 1px 3px rgba(0,0,0,.3))"}}>{P.doneMark}</span>)}
              {live&&(<span style={{position:"absolute", bottom:-7, left:"50%", transform:"translateX(-50%)",
                fontSize:9, fontWeight:900, color:"#fff", background:a.color,
                borderRadius:999, padding:"1px 7px", whiteSpace:"nowrap",
                boxShadow:`0 2px 6px ${a.color}88`}}>NOW</span>)}
            </div>
            <div style={{marginTop:live?12:9,
              background:passed&&!clear?(night?"rgba(12,20,38,.5)":"rgba(160,80,110,.5)"):P.labelBg,
              borderRadius:12, padding:"4px 11px 5px", textAlign:"center",
              boxShadow:"0 3px 8px rgba(0,0,0,.2)", maxWidth:112,
              opacity:passed&&!clear?0.7:1}}>
              <p style={{margin:0, fontSize:12, fontWeight:900, color:P.labelText,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{String(a.name).split("(")[0].trim()}</p>
              <p style={{margin:"1px 0 0", fontSize:10.5, fontWeight:900, color:P.labelText,
                opacity:0.9, fontVariantNumeric:"tabular-nums"}}>{a.time}</p>
            </div>
          </div>
        );
      })}

      {/* 캐릭터 (오늘만 표시) */}
      {mode==="today"&&(
        <div style={{position:"absolute", left:charX, top:charY-38,
          transform:"translate(-50%,-50%)", fontSize:36, pointerEvents:"none",
          filter:"drop-shadow(0 5px 7px rgba(0,0,0,.35))", zIndex:5,
          animation:"mpCharBob 1.6s ease-in-out infinite",
          transition:goalMoving?"left 1s linear, top 1s linear":"left .5s, top .5s"}}>{charEmoji||P.char}</div>
      )}

      <style>{`@keyframes mpTwinkle{0%,100%{opacity:.9}50%{opacity:.25}}
@keyframes mpCharBob{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-7px)}}`}</style>
    </div>
  );
};

/* 성장 단계 5개 — 캐릭터 '그림'이 바뀌는 구간이다 (레벨 1/5/9/13/17에서 갈린다).
   [사용자 확정 2026-08-09] 단계 이름을 '~기'로 바꿨다.
   예전엔 단계 이름이 레벨 이름을 그대로 재사용해서(새싹 탐험가=Lv.1, 숲 탐험가=Lv.5,
   바다 탐험가=Lv.9, 전설의 탐험가=Lv.20) 레벨 시트에 "Lv.10 섬 탐험가 / 바다 탐험가"처럼
   한 칸 전 레벨 이름이 같이 떠서 뒤로 간 것처럼 읽혔다. 이제 두 층의 이름이 안 겹친다.
   ※ 레벨 이름 20개(DEFAULT_LEVELS)는 그대로다 — 여기만 바꿨다. */
export const CHARACTER_EVOLUTIONS = [
  { minLevel:1,  name:"새싹기", avatar:{boy:"🧒",girl:"👧"},  badge:"🌱", bg:"linear-gradient(135deg,#E0F2FE,#F8FAFC)" },
  { minLevel:5,  name:"모험기", avatar:{boy:"🧑",girl:"👩"},  badge:"🌲", bg:"linear-gradient(135deg,#DCFCE7,#F8FAFC)" },
  { minLevel:9,  name:"항해기", avatar:{boy:"🧑‍✈️",girl:"👩‍✈️"},  badge:"🌊", bg:"linear-gradient(135deg,#E0F2FE,#F8FAFC)" },
  { minLevel:13, name:"영웅기", avatar:{boy:"🦸‍♂️",girl:"🦸‍♀️"}, badge:"🦸", bg:"linear-gradient(135deg,#EDE9FE,#F8FAFC)" },
  { minLevel:17, name:"전설기", avatar:{boy:"🧑‍🚀",girl:"👩‍🚀"}, badge:"🚀", bg:"linear-gradient(135deg,#FFF7ED,#FEF3C7)" },
];

// ── 펫 진화 (한 길, 0→4단계). 보물상자에서 낮은 확률로 1단계씩 진화 ──
// 단계별로 그림을 받은 만큼만 이모지 대신 그림으로 — 사용자 원화(2026-08-24).
// 그림이 아직 없는 단계는 이모지 그대로 (PET_STAGE_IMG[stage] 가 없으면 폴백).
export const PET_STAGE_IMG = {
  0: "/assets/pet/egg.webp",       // 신비한 알
  1: "/assets/pet/stage1.webp",    // 아기 드래곤
};
export const PET_STAGES = [
  { stage:0, emoji:"🥚", name:"신비한 알",     desc:"모든 탐험의 시작" },
  { stage:1, emoji:"🐣", name:"아기 드래곤",   desc:"세상을 처음 만난 작은 용" },
  { stage:2, emoji:"🦎", name:"개구쟁이 드래곤", desc:"호기심 가득한 장난꾸러기" },
  { stage:3, emoji:"🐲", name:"늠름한 청룡",   desc:"용기와 책임감을 갖춘 수호자" },
  { stage:4, emoji:"🐉", name:"전설의 드래곤", desc:"전설로 남을 위대한 존재" },
];
// 상자 등급별 펫 진화 확률 (6개월 만렙 곡선 기준, 4단계 평균완성 약 4.5개월에 맞춰 하향)
// 천장이 기본 보장선을 깔고, 이 확률은 '가끔 일찍 터지는 재미' 보조 역할.
export const PET_EVOLVE_CHANCE = { normal:0.0125, rare:0.021, legend:0.033 };
// 전설상자 안전망: 전설상자 4개 열 때마다 1단계 진화 보장(확률 진화와 별개의 천장).
export const PET_EVOLVE_LEGEND_PITY = 4;

// 진화 단계별 격려 문구
// 성장 단계별 격려 문구 — 열쇠는 CHARACTER_EVOLUTIONS 의 name (단계 이름을 바꾸면 여기도 같이 바꾼다)
export const EVOLUTION_MESSAGES = {
  "새싹기": "작은 한 걸음에서 탐험이 시작돼요.",
  "모험기": "스스로 길을 찾는 힘이 자라고 있어요.",
  "항해기": "넓은 세상으로 용감하게 나아가고 있어요.",
  "영웅기": "꿈을 향해 더 높이 날아오르고 있어요.",
  "전설기": "자신만의 길을 만들어가는 탐험가예요.",
};

// ════════════════════════════════════════════════════════════
// 베이커리(cute) 모드 — 성장체 / 펫 / 설명 치환 데이터
// 탐험 구조(단계 수·minLevel·stage)는 그대로 두고 이름·이모지만 교체.
// ════════════════════════════════════════════════════════════
// 성장체 5단계 (CHARACTER_EVOLUTIONS 와 1:1 매칭, 남녀 공통 이모지)
export const BAKERY_EVOLUTIONS = [
  // 파티시에 성장 5단계 — 탐험 모드(CHARACTER_EVOLUTIONS)와 동일한 레벨 구간: 1-4 / 5-8 / 9-12 / 13-16 / 17~
  { minLevel:1,  name:"꼬마 제빵사",     avatar:{boy:"👦",girl:"👧"},      bg:"linear-gradient(135deg,#FFF1F6,#FFFBF8)" },
  { minLevel:5,  name:"견습 파티시에",   avatar:{boy:"🧑",girl:"👩"},      bg:"linear-gradient(135deg,#FFE8F1,#FFFBF8)" },
  { minLevel:9,  name:"실력파 파티시에", avatar:{boy:"👨‍🍳",girl:"👩‍🍳"},  bg:"linear-gradient(135deg,#FCE7F3,#FFFBF8)" },
  { minLevel:13, name:"스타 파티시에",   avatar:{boy:"🧑‍🎨",girl:"👩‍🎨"},  bg:"linear-gradient(135deg,#EDE9FE,#FFFBF8)" },
  { minLevel:17, name:"전설의 파티시에", avatar:{boy:"🤴",girl:"👸"},      bg:"linear-gradient(135deg,#FFF7ED,#FCE7F3)" },
];
// 성장체별 격려 문구 (베이커리)
export const BAKERY_DESCRIPTION = {
  "꼬마 제빵사":     "작은 첫걸음이 큰 꿈을 만들어요.",
  "견습 파티시에":   "하나씩 해내며 쑥쑥 성장하고 있어요.",
  "실력파 파티시에": "꾸준한 노력이 멋진 실력이 되었어요.",
  "스타 파티시에":   "모두가 인정하는 빛나는 스타가 되었어요.",
  "전설의 파티시에": "최고의 파티시에가 되었어요.",
};
// 펫 = 강아지→유니콘 성장 라인 (PET_STAGES 5단계와 1:1 매칭, 아바타 디저트와 구분)
export const BAKERY_PET_DESCRIPTION = {
  "호기심 강아지": "세상에 대해 궁금한 것이 많은 작은 강아지예요.",
  "꿈꾸는 강아지": "언젠가 하늘을 달리는 유니콘이 되고 싶어 해요.",
  "별빛 조랑말":   "매일 노력하며 조금씩 꿈에 가까워지고 있어요.",
  "무지개 준마":   "이제 유니콘이 될 준비를 거의 마쳤어요.",
  "전설의 유니콘": "꿈을 포기하지 않아 마침내 유니콘이 되었어요.",
};
export const BAKERY_PETS = [
  { emoji:"🐶", name:"호기심 강아지" },
  { emoji:"🐕", name:"꿈꾸는 강아지" },
  { emoji:"🐴", name:"별빛 조랑말" },
  { emoji:"🐎", name:"무지개 준마" },
  { emoji:"🦄", name:"전설의 유니콘" },
].map(p=>({ ...p, desc:BAKERY_PET_DESCRIPTION[p.name] }));

// 성장체 객체를 현재 스킨에 맞춰 치환 (idx = 단계 순서)
export const evoView = (evo, idx, skin) => {
  if(!evo) return evo;
  if(skin==="cute"){
    // 탐험·베이커리 모두 5단계로 통일(1:1 매칭). 방어적으로 마지막 단계 클램프는 유지.
    const bi = Math.min(idx, BAKERY_EVOLUTIONS.length-1);
    const b = BAKERY_EVOLUTIONS[bi];
    if(b) return { ...evo, name:b.name, emoji:b.avatar?.girl||b.avatar?.boy, bg:b.bg,
                   avatar:{ boy:b.avatar?.boy, girl:b.avatar?.girl } };
  }
  return evo;
};
// 펫 객체를 현재 스킨에 맞춰 치환 (stage = 단계 순서)
export const petView = (pet, stage, skin) => {
  if(!pet) return pet;
  if(skin==="cute"){
    const b = BAKERY_PETS[stage];
    if(b) return { ...pet, emoji:b.emoji, name:b.name, desc:b.desc };
  }
  return pet;
};
// 성장체 격려 문구를 현재 스킨에 맞춰 반환
export const evoMsgView = (evoName, skin) => {
  if(skin==="cute") return BAKERY_DESCRIPTION[evoName] || EVOLUTION_MESSAGES[evoName] || "";
  return EVOLUTION_MESSAGES[evoName] || "";
};

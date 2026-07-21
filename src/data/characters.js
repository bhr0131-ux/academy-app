import { DEFAULT_SKIN, CHARACTER_EVOLUTIONS } from "./gameData.jsx";


/* ════════════════════════════════════════════════════════════════════════
   SECTION 4.5. 모험 모드 AI 일러스트 캐릭터 (남아/여아 × 진화 5단계)
   ────────────────────────────────────────────────────────────────────────
   - 380px WebP를 base64로 내장(오프라인 동작·단일 파일 배포 유지)
   - 진화 단계는 CHARACTER_EVOLUTIONS minLevel(1/5/9/13/17)과 1:1
   - 무대 표시 크기: 단계별로 키가 커짐 (120→172px)
   - 베이커리 모드/스킨 장착 시엔 기존 이모지 아바타 유지
   ════════════════════════════════════════════════════════════════════════ */
export const ADV_CHAR_STAGE_OF=(level)=>{
  let idx=0;
  CHARACTER_EVOLUTIONS.forEach((e,i)=>{ if(level>=e.minLevel) idx=i; });
  return idx+1; // 1~5
};
export const ADV_CHAR_SIZE={1:220,2:229,3:236,4:241,5:247}; // 2차 축소 피드백 반영 (245~275에서 약 -10% 추가)
// 홈 무대 아바타(꾸미기) 정사각 캔버스 크기 — 성장 캐릭터와 비연동(독립 조정 가능).
// 캔버스 내 캐릭터 실높이는 80%라 체감 높이 ≈ 값×0.8 (예: 289 → 약 231px).
export const AVATAR_HOME_SIZE={1:289,2:300,3:309,4:316,5:325};
// 베이커리는 셰프 모자 탓에 몸 비중이 작아 단계별로 약간 상향 보정 (특히 3단계: 캔버스 폭 43%로 가장 슬림)
export const BAKERY_CHAR_SIZE={1:232,2:248,3:264,4:270,5:282}; // 시안B 동일 기준

// ── 모험 모드 무대 기본 배경 ────────────────────────────────
// 이미지는 Capacitor public/assets 폴더에 두고 경로로 참조 (base64 임베드 X → App.jsx 경량 유지).
// 지금은 초원 1장. 나중에 성별/진화단계별로 늘릴 땐 ADV_STAGE_BG_OF 안만 바꾸면 됨.
export const ADV_STAGE_BG_MEADOW = "/assets/stage-adventure-meadow.webp";
// (g=성별 'boy'|'girl', stage=진화단계 1~5) → 배경 경로. 지금은 항상 초원.
export const ADV_STAGE_BG_OF = (g, stage) => ADV_STAGE_BG_MEADOW;
// 프리로드 대상 목록 (아래 이미지 프리로드 useEffect에서 사용)
export const ADV_STAGE_BG_ALL = [ADV_STAGE_BG_MEADOW];

/* 성장 캐릭터 이미지 — /public/assets/ 경로 방식 (base64 내장 폐지)
   파일 규칙: /assets/growth-characters/{테마}/{성별}/stage-{단계}.webp
   이미지 교체 시 같은 파일명으로 덮어쓰기만 하면 됨(코드 수정 불필요). */
export const CHAR_IMG = (theme,gender,stage)=>`/assets/growth-characters/${theme}/${gender}/stage-${stage}.webp?v=5`; // v=2: 2026-07-21 갇힌 배경 제거판 캐시 무효화
export const _charSet = (theme)=>({
  boy:  {1:CHAR_IMG(theme,"boy",1), 2:CHAR_IMG(theme,"boy",2), 3:CHAR_IMG(theme,"boy",3), 4:CHAR_IMG(theme,"boy",4), 5:CHAR_IMG(theme,"boy",5)},
  girl: {1:CHAR_IMG(theme,"girl",1),2:CHAR_IMG(theme,"girl",2),3:CHAR_IMG(theme,"girl",3),4:CHAR_IMG(theme,"girl",4),5:CHAR_IMG(theme,"girl",5)},
});
export const ADV_CHAR_IMG = _charSet("adventure");
export const BAKERY_CHAR_IMG = _charSet("bakery");
// 베이커리 모드 캐릭터 (남아/여아 × 5단계) — 진화 구간은 모험과 동일(1/5/9/13/17)


export const LEVEL_UP_REWARDS = {
  5:40, 10:80, 15:150, 20:300
};

export const LEVEL_DESCRIPTION = {
  1:"모험을 시작한 새싹 탐험가",
  2:"지도를 펼친 꼬마 탐험가",
  3:"호기심으로 가득한 탐험가",
  4:"척척 나아가는 씩씩한 탐험가",
  5:"숲을 누비는 탐험가",
  6:"넓은 들판을 가로지르는 탐험가",
  7:"깜깜한 동굴도 두렵지 않아요",
  8:"강을 건너는 용감한 탐험가",
  9:"드넓은 바다로 떠난 탐험가",
  10:"미지의 섬을 발견한 탐험가",
  11:"정글을 헤치는 원정대장",
  12:"뜨거운 사막을 건너는 원정대",
  13:"눈 덮인 설산을 오르는 원정대",
  14:"하늘 높이 떠오른 탐험가",
  15:"구름 위를 여행하는 탐험가",
  16:"별빛을 따라가는 탐험가",
  17:"은하를 누비는 탐험가",
  18:"우주로 떠난 탐험가",
  19:"새 행성을 개척하는 탐험가",
  20:"모두가 우러러보는 전설의 탐험가"
};

export const REWARD_GRADES = [
  { id:"common",    name:"일반", color:"#888888" },
  { id:"rare",      name:"희귀", color:"#4A90E2" },
  { id:"epic",      name:"영웅", color:"#9B59B6" },
  { id:"legendary", name:"전설", color:"#FF9F43" },
];

export const getRewardGrade=(reward)=>REWARD_GRADES.find(g=>g.id===(reward.grade||"common"))||REWARD_GRADES[0];

export const DEFAULT_REWARDS = [
  { id:1,  title:"사탕 하나",              point:30,    emoji:"🍬", grade:"common"    },
  { id:2,  title:"좋아하는 간식",          point:50,    emoji:"🍪", grade:"common"    },
  { id:3,  title:"엄마랑 놀이 15분",       point:90,    emoji:"🧸", grade:"common"    },
  { id:4,  title:"아이스크림",             point:100,   emoji:"🍦", grade:"rare"      },
  { id:5,  title:"영상 20분",              point:120,   emoji:"📺", grade:"rare"      },
  { id:6,  title:"편의점 간식 고르기",     point:160,   emoji:"🏪", grade:"rare"      },
  { id:7,  title:"놀이터 데이트",          point:230,   emoji:"🛝", grade:"epic"      },
  { id:8,  title:"다이소 쇼핑",            point:260,   emoji:"🛒", grade:"epic"      },
  { id:9,  title:"주말 특별 간식",         point:480,   emoji:"🧁", grade:"epic"      },
  { id:10, title:"작은 장난감",            point:700,   emoji:"🧸", grade:"legendary" },
  { id:11, title:"키즈카페",               point:1100,  emoji:"🎡", grade:"legendary" },
  { id:12, title:"큰 선물 도전권",         point:1800,  emoji:"🎁", grade:"legendary" },
];

// 🎒 초등 저학년 보상 세트
export const REWARDS_ELEM_LOW = [
  { id:1,  title:"좋아하는 간식",          point:40,    emoji:"🍪", grade:"common"    },
  { id:2,  title:"편의점 간식 고르기",     point:60,    emoji:"🏪", grade:"common"    },
  { id:3,  title:"다이소 쇼핑",            point:90,    emoji:"🛒", grade:"common"    },
  { id:4,  title:"영상 30분",              point:120,   emoji:"📺", grade:"rare"      },
  { id:5,  title:"게임 30분",              point:140,   emoji:"🎮", grade:"rare"      },
  { id:6,  title:"문구·캐릭터 용품",       point:180,   emoji:"✏️", grade:"rare"      },
  { id:7,  title:"외식 메뉴 선택권",       point:230,   emoji:"🍕", grade:"epic"      },
  { id:8,  title:"용돈 2,000원",           point:260,   emoji:"💰", grade:"epic"      },
  { id:9,  title:"영화관 데이트",          point:310,   emoji:"🎬", grade:"epic"      },
  { id:10, title:"갖고 싶은 장난감",       point:400,   emoji:"🎁", grade:"legendary" },
  { id:11, title:"키즈카페/원하는곳 소풍", point:600,   emoji:"🚌", grade:"legendary" },
  { id:12, title:"큰 선물 도전권",         point:1000,  emoji:"🛍️", grade:"legendary" },
];

// 🎒 초등 고학년 보상 세트
export const REWARDS_ELEM_HIGH = [
  { id:1,  title:"좋아하는 간식",          point:30,    emoji:"🍪", grade:"common"    },
  { id:2,  title:"용돈 1,000원",           point:60,    emoji:"💰", grade:"common"    },
  { id:3,  title:"용돈 2,000원",           point:110,   emoji:"💰", grade:"common"    },
  { id:4,  title:"영상 30분",              point:150,   emoji:"📺", grade:"rare"      },
  { id:5,  title:"게임 30분",              point:170,   emoji:"🎮", grade:"rare"      },
  { id:6,  title:"문구·굿즈 사기",         point:260,   emoji:"✏️", grade:"rare"      },
  { id:7,  title:"용돈 5,000원",           point:290,   emoji:"💵", grade:"epic"      },
  { id:8,  title:"외식·배달 메뉴 선택",    point:340,   emoji:"🍕", grade:"epic"      },
  { id:9,  title:"용돈 10,000원",          point:530,   emoji:"💸", grade:"epic"      },
  { id:10, title:"가고싶은 여행지",        point:700,   emoji:"✈️", grade:"legendary" },
  { id:11, title:"갖고 싶은 장난감",       point:800,   emoji:"🎁", grade:"legendary" },
  { id:12, title:"큰 선물 도전권",         point:1000,  emoji:"🛍️", grade:"legendary" },
];

// 📚 중학생 이상 보상 세트 — 전부 현금 / 포인트는 누진 비례(큰 보상일수록 약간 더 이득 → 모아서 받게 유도), 큰 보상은 큰맘 먹고 받도록 기간↑
export const REWARDS_TEEN = [
  { id:1,  title:"용돈 1,000원",      point:40,    emoji:"💰", grade:"common"    },
  { id:2,  title:"용돈 3,000원",      point:110,   emoji:"💰", grade:"common"    },
  { id:3,  title:"용돈 5,000원",      point:180,   emoji:"💰", grade:"common"    },
  { id:4,  title:"용돈 10,000원",     point:340,   emoji:"💵", grade:"rare"      },
  { id:5,  title:"용돈 20,000원",     point:600,   emoji:"💵", grade:"rare"      },
  { id:6,  title:"용돈 25,000원",     point:750,   emoji:"💵", grade:"rare"      },
  { id:7,  title:"용돈 30,000원",     point:880,   emoji:"💸", grade:"epic"      },
  { id:8,  title:"용돈 40,000원",     point:1000,  emoji:"💸", grade:"epic"      },
  { id:9,  title:"용돈 50,000원",     point:1250,  emoji:"💸", grade:"epic"      },
  { id:10, title:"용돈 70,000원",     point:1800,  emoji:"🤑", grade:"legendary" },
  { id:11, title:"용돈 85,000원",     point:2100,  emoji:"🤑", grade:"legendary" },
  { id:12, title:"용돈 100,000원",    point:2400,  emoji:"🤑", grade:"legendary" },
];

// 연령대 → 보상 세트 매핑
export const REWARD_SETS_BY_AGE = {
  kid:      { label:"어린이용",     emoji:"🧸", rewards:DEFAULT_REWARDS    },
  elemLow:  { label:"초등 저학년",  emoji:"🎒", rewards:REWARDS_ELEM_LOW   },
  elemHigh: { label:"초등 고학년",  emoji:"🎽", rewards:REWARDS_ELEM_HIGH  },
  teen:     { label:"고학년 이상",   emoji:"💸", rewards:REWARDS_TEEN       },
};
export const getRewardsByAge=(age)=>(REWARD_SETS_BY_AGE[age]||REWARD_SETS_BY_AGE.kid).rewards;

export const TREASURE_REWARD_TABLE = {
  normal:{
    name:"일반상자",
    emoji:"📦",
    min:18,
    max:36,
    headerGrad:"linear-gradient(135deg,#94A3B8,#CBD5E1)"
  },
  rare:{
    name:"희귀상자",
    emoji:"🎁",
    min:42,
    max:72,
    headerGrad:"linear-gradient(135deg,#3B82F6,#60A5FA)"
  },
  legend:{
    name:"전설상자",
    emoji:"👑",
    min:108,
    max:168,
    headerGrad:"linear-gradient(135deg,#F59E0B,#FDE68A)"
  }
};

// 베이커리(cute) 모드: 보물창고 → 디저트상자 컨셉에 맞춘 상자 이름/이모지.
// (등급 구조·보상 수치는 그대로, 표시용 name/emoji 만 교체)
export const BAKERY_BOX_MAP = {
  normal:{ name:"기본 상자", emoji:"📦", headerGrad:"linear-gradient(135deg,#F9C5D6,#FDE7EF)" },
  rare:  { name:"달콤 상자", emoji:"🎁", headerGrad:"linear-gradient(135deg,#F78FB3,#FAD0C4)" },
  legend:{ name:"스페셜 상자", emoji:"💝", headerGrad:"linear-gradient(135deg,#F5B301,#FFD98E)" },
};
// 상자 종류(normal/rare/legend)의 표시 정보를 현재 스킨에 맞춰 반환.
export const getBoxInfo = (boxType, skin=DEFAULT_SKIN) => {
  const base = TREASURE_REWARD_TABLE[boxType] || TREASURE_REWARD_TABLE.normal;
  if(skin==="cute"){
    const b = BAKERY_BOX_MAP[boxType];
    if(b) return { ...base, name:b.name, emoji:b.emoji, ...(b.headerGrad?{headerGrad:b.headerGrad}:{}) };
  }
  return base;
};

export const getRandomTreasureCoin=(boxType)=>{
  const table=TREASURE_REWARD_TABLE[boxType]||TREASURE_REWARD_TABLE.normal;
  return Math.floor(Math.random()*(table.max-table.min+1))+table.min;
};

export const UI_TEXT = {
  tabs:{
    area:"🗺️ 모험",
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
    pending:"기다리는 중...",
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

export const LEGENDARY_TITLES = [
  { id:"gold_hunter",      name:"황금 탐험가",   emoji:"🥇", rarity:"legendary", condition:"전설상자 드롭", award:"전설상자에서 빛나는 보물을 찾아낸 행운의 탐험가에게 이 상장을 드립니다 🥇", description:"전설상자에서만 획득 가능" },
  { id:"dragon_knight",    name:"용감한 개척자", emoji:"🛡️", rarity:"legendary", condition:"전설상자 드롭", award:"전설상자에서 용기의 증표를 얻은 탐험가에게 이 상장을 드립니다 🛡️", description:"전설상자에서만 획득 가능" },
  { id:"shadow_assassin",  name:"밤하늘 탐험가", emoji:"🌙", rarity:"legendary", condition:"전설상자 드롭", award:"전설상자에서 신비한 밤하늘의 비밀을 만난 탐험가에게 이 상장을 드립니다 🌙", description:"전설상자에서만 획득 가능" },
];

export const TITLE_RARITY = {
  common:    { name:"일반", color:"#64748B", bg:"#F8FAFC",  icon:"⚪", grad:"linear-gradient(180deg,#F8F9FC 0%,#EEF1F7 100%)", borderClr:"#D9DEE8", dgrad:"linear-gradient(180deg,#D9DEE8 0%,#C9D0DD 100%)", glow:"0 0 10px rgba(217,222,232,0.30)" },
  rare:      { name:"희귀", color:"#3B82F6", bg:"#EFF6FF",  icon:"🔵", grad:"linear-gradient(180deg,#EEF5FF 0%,#DDEBFF 100%)", borderClr:"#6EA9FF", dgrad:"linear-gradient(180deg,#B8CAE8 0%,#9DB5DB 100%)", glow:"0 0 12px rgba(110,169,255,0.35)" },
  epic:      { name:"영웅", color:"#9333EA", bg:"#FAF5FF",  icon:"🟣", grad:"linear-gradient(180deg,#F3EEFF 0%,#E5DAFF 100%)", borderClr:"#A287FF", dgrad:"linear-gradient(180deg,#AFA7D9 0%,#978ED0 100%)", glow:"0 0 13px rgba(162,135,255,0.40)" },
  legendary: { name:"전설", color:"#F59E0B", bg:"#FFF7ED",  icon:"👑", grad:"linear-gradient(180deg,#FFF6D7 0%,#FFE7A2 100%)", borderClr:"#FFD86B", dgrad:"linear-gradient(180deg,#D7C38A 0%,#C8AF63 100%)", glow:"0 0 16px rgba(255,216,107,0.45)" },
};

export const DEFAULT_TITLES = [
  { id:"rookie", name:"꼬마 모험가", emoji:"🎗️", condition:"기본 상장", award:"드디어 모험의 첫걸음을 내디딘 꼬마 모험가에게 이 상장을 드립니다 🎗️", rarity:"common" },
  { id:"first_quest", name:"첫걸음 탐험가", emoji:"👣", condition:"첫 미션 완료", award:"첫 번째 임무를 용감하게 해낸 탐험가에게 이 상장을 드립니다 👣", rarity:"common" },
  { id:"quest_10_title", name:"미션 입문자", emoji:"🎯", condition:"미션 10개 완료", award:"임무를 10개나 완수한 멋진 모험가에게 이 상장을 드립니다 🎯", rarity:"common" },
  { id:"xp_100_title", name:"반짝 새싹", emoji:"🌱", condition:"100 XP 달성", award:"경험치 100을 모으며 쑥쑥 자라난 모험가에게 이 상장을 드립니다 🌱", rarity:"common" },
  { id:"reward_1_title", name:"첫 쇼핑러", emoji:"🛒", condition:"첫 보상 구매", award:"열심히 모은 코인으로 첫 보상을 받은 모험가에게 이 상장을 드립니다 🛒", rarity:"common" },

  { id:"quest_hunter", name:"미션 탐험가", emoji:"🎯", condition:"미션 50개 완료", award:"임무를 50개나 끝까지 해낸 멋진 탐험가에게 이 상장을 드립니다 🎯", rarity:"rare" },
  { id:"homework_master", name:"숙제왕", emoji:"📚", condition:"숙제 30개 완료", award:"숙제를 30개나 완수한 성실한 모험가에게 이 상장을 드립니다 📚", rarity:"rare" },
  { id:"streak_3_title", name:"꾸준한 아이", emoji:"🔥", condition:"5일 연속 달성", award:"5일 연속 하루도 빠지지 않은 꾸준한 모험가에게 이 상장을 드립니다 🔥", rarity:"rare" },
  { id:"xp_500_title", name:"성실 수련생", emoji:"📘", condition:"500 XP 달성", award:"경험치 500을 모으며 꾸준히 성장한 모험가에게 이 상장을 드립니다 📘", rarity:"rare" },
  { id:"reward_3_title", name:"알뜰 쇼핑러", emoji:"🏷️", condition:"보상 5번 구매", award:"코인을 알뜰하게 모아 보상을 5번 받은 모험가에게 이 상장을 드립니다 🏷️", rarity:"rare" },

  { id:"streak_master", name:"불꽃 루틴러", emoji:"⚡", condition:"10일 연속 달성", award:"10일 연속 임무를 해낸 불꽃 같은 모험가에게 이 상장을 드립니다 ⚡", rarity:"epic" },
  { id:"quest_100_title", name:"집중의 신", emoji:"🧠", condition:"미션 100개 완료", award:"임무를 100개나 완수한 집중력 뛰어난 모험가에게 이 상장을 드립니다 🧠", rarity:"epic" },
  { id:"champion", name:"모험 대장", emoji:"🏅", condition:"Lv.10 달성", award:"마침내 10레벨에 도달한 자랑스러운 모험 대장에게 이 상장을 드립니다 🏅", rarity:"epic" },
  { id:"xp_3000_title", name:"빛나는 성장러", emoji:"🌟", condition:"3000 XP 달성", award:"경험치 3000을 모으며 눈부시게 성장한 모험가에게 이 상장을 드립니다 🌟", rarity:"epic" },
  { id:"reward_30_title", name:"쇼핑 마스터", emoji:"💳", condition:"보상 30번 구매", award:"보상을 30번이나 받은 진정한 쇼핑 마스터에게 이 상장을 드립니다 💳", rarity:"epic" },

  { id:"legend", name:"전설의 모험가", emoji:"👑", condition:"Lv.20 달성", award:"마침내 20레벨에 도달하여 모두의 모범이 된 전설의 모험가에게 이 상장을 드립니다 👑", rarity:"legendary" },
  { id:"streak_30_title", name:"30일 전설", emoji:"☄️", condition:"30일 연속 달성", award:"30일 연속이라는 전설적인 기록을 세운 모험가에게 이 상장을 드립니다 ☄️", rarity:"legendary" },
  { id:"treasure_master", name:"보물 사냥꾼", emoji:"💰", condition:"보물상자 50개 오픈", award:"보물상자를 50개나 열어젖힌 최고의 보물 사냥꾼에게 이 상장을 드립니다 💰", rarity:"legendary" },
  { id:"world_class", name:"월드클래스", emoji:"🌍", condition:"12000 XP 달성", award:"경험치 12000을 모은 세계 최고 수준의 모험가에게 이 상장을 드립니다 🌍", rarity:"legendary" },
  { id:"quest_700_title", name:"미션의 신화", emoji:"🌌", condition:"미션 700개 완료", award:"임무를 700개나 완수하여 신화를 써낸 모험가에게 이 상장을 드립니다 🌌", rarity:"legendary" },
];

// ── 베이커리(cute) 상장 치환 — 모험 상장 id 와 1:1 매칭 ──
// 등급·획득조건(condition은 표시용)·rarity는 그대로, 이름/이모지만 교체.
export const BAKERY_TITLE_MAP = {
  // common
  rookie:           { name:"반죽 도우미",     emoji:"🥄", condition:"기본 상장", award:"드디어 베이커리의 첫걸음을 내디딘 반죽 도우미에게 이 상장을 드립니다 🥄" },
  first_quest:      { name:"쿠키 굽기 초보",  emoji:"🍪", condition:"첫 미션 완료", award:"첫 번째 미션을 맛있게 해낸 꼬마 제빵사에게 이 상장을 드립니다 🍪" },
  quest_10_title:   { name:"첫 오븐 졸업",    emoji:"🧁", condition:"미션 10개 완료", award:"미션을 10개나 완성하며 첫 오븐을 멋지게 졸업한 제빵사에게 이 상장을 드립니다 🧁" },
  xp_100_title:     { name:"첫 반죽 친구",    emoji:"🌱", condition:"경험치 100 달성", award:"경험치 100을 모으며 쑥쑥 자라난 제빵사에게 이 상장을 드립니다 🌱" },
  reward_1_title:   { name:"첫 쿠키 손님",    emoji:"🛒", condition:"첫 보상 구매", award:"열심히 모은 코인으로 첫 보상을 받은 제빵사에게 이 상장을 드립니다 🛒" },
  // rare
  quest_hunter:     { name:"미션 사냥꾼",     emoji:"🍳", condition:"미션 50개 완료", award:"미션을 50개나 완성한 솜씨 좋은 미션 사냥꾼에게 이 상장을 드립니다 🍳" },
  homework_master:  { name:"디저트 장인",     emoji:"🎀", condition:"숙제 30개 완료", award:"숙제를 30개나 완수한 성실한 디저트 장인에게 이 상장을 드립니다 🎀" },
  streak_3_title:   { name:"개근 제빵사",     emoji:"🔥", condition:"5일 연속 달성", award:"5일 연속 하루도 빠지지 않은 개근 제빵사에게 이 상장을 드립니다 🔥" },
  xp_500_title:     { name:"성실한 제빵사",   emoji:"📖", condition:"경험치 500 달성", award:"경험치 500을 모으며 꾸준히 성장한 제빵사에게 이 상장을 드립니다 📖" },
  reward_3_title:   { name:"알뜰 단골손님",   emoji:"🏷️", condition:"보상 5번 구매", award:"코인을 알뜰하게 모아 보상을 5번 받은 단골손님에게 이 상장을 드립니다 🏷️" },
  // epic
  streak_master:    { name:"꾸준한 제빵사",   emoji:"🥐", condition:"10일 연속 달성", award:"10일 연속 미션을 해낸 따끈따끈한 제빵사에게 이 상장을 드립니다 🥐" },
  quest_100_title:  { name:"케이크 마스터",   emoji:"🎂", condition:"미션 100개 완료", award:"미션을 100개나 완성한 솜씨 뛰어난 케이크 마스터에게 이 상장을 드립니다 🎂" },
  champion:         { name:"10레벨 챔피언",   emoji:"🎖️", condition:"Lv.10 달성", award:"마침내 10레벨에 도달한 자랑스러운 10레벨 챔피언에게 이 상장을 드립니다 🎖️" },
  xp_3000_title:    { name:"무지개 제빵사",   emoji:"🌈", condition:"경험치 3000 달성", award:"경험치 3000을 모으며 눈부시게 성장한 제빵사에게 이 상장을 드립니다 🌈" },
  reward_30_title:  { name:"쿠키 수집가",     emoji:"🛍️", condition:"보상 30번 구매", award:"보상을 30번이나 받은 진정한 쿠키 수집가에게 이 상장을 드립니다 🛍️" },
  // legendary (default)
  legend:           { name:"디저트 왕국의 주인", emoji:"👑", condition:"Lv.20 달성", award:"마침내 20레벨에 도달하여 모두가 사랑하는 디저트 왕국의 주인에게 이 상장을 드립니다 👑" },
  streak_30_title:  { name:"한 달 개근왕",   emoji:"🌹", condition:"30일 연속 달성", award:"30일 연속이라는 전설적인 기록을 세운 한 달 개근왕에게 이 상장을 드립니다 🌹" },
  treasure_master:  { name:"베이커리 사장님", emoji:"💰", condition:"디저트상자 50개 오픈", award:"디저트상자를 50개나 열어본 어엿한 베이커리 사장님에게 이 상장을 드립니다 💰" },
  world_class:      { name:"월드클래스 셰프", emoji:"✨", condition:"경험치 12000 달성", award:"경험치 12000을 모은 세계 최고의 월드클래스 셰프에게 이 상장을 드립니다 ✨" },
  quest_700_title:  { name:"신화의 레시피",   emoji:"📜", condition:"미션 700개 완료", award:"미션을 700개나 완성하여 신화를 써낸 제빵사에게 이 상장을 드립니다 📜" },
  // legendary (보물상자 전용)
  gold_hunter:      { name:"황금 크루아상",   emoji:"🥨", condition:"스페셜 상자에서 획득", award:"스페셜 상자에서 황금 크루아상을 찾아낸 행운의 제빵사에게 이 상장을 드립니다 🥨", description:"스페셜 상자에서만 획득 가능" },
  dragon_knight:    { name:"전설의 오븐 기사", emoji:"🔥", condition:"스페셜 상자에서 획득", award:"스페셜 상자에서 전설의 오븐을 만난 제빵사에게 이 상장을 드립니다 🔥", description:"스페셜 상자에서만 획득 가능" },
  shadow_assassin:  { name:"한밤의 제빵 요정", emoji:"🌙", condition:"스페셜 상자에서 획득", award:"스페셜 상자에서 신비한 밤의 요정을 만난 제빵사에게 이 상장을 드립니다 🌙", description:"스페셜 상자에서만 획득 가능" },
};
// 상장 객체를 현재 스킨에 맞춰 이름/이모지만 치환
export const titleView = (t, skin) => {
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
export const DECOR_RARITY = {
  common:    { color:"#94A3B8" },
  rare:      { color:"#3B82F6" },
  epic:      { color:"#9333EA" },
  legendary: { color:"#F59E0B" },
};
// 테두리: 프로필 액자 테두리 색/광택 (emoji 는 상점 표시용 아이콘)
// glow 는 모험(다크 무대)용, glowCute 는 베이커리(밝은 크림 무대)용 — 모드별로 빛번짐 색을 다르게 둔다.
// 장비/모자: 상점에서 구매·보유·장착 가능. 캐릭터 외형은 진화 일러스트로만 표현되므로
// 장착해도 캐릭터 위에 이모지로 표시되지는 않는다(getEquipped 에서 hat 그룹은 null 반환).
// 모험 = 장비(도구), 베이커리 = 모자(머리 장식)로 같은 id를 이름/이모지만 치환해 재사용.
export const DECOR_HATS = [
  { id:"hat_light",   emoji:"🔦", name:"꼬마 손전등",  price:0,   rarity:"common",    weapon:true, bakery:{ emoji:"🍒", name:"체리 핀" } },
  { id:"hat_axe",     emoji:"🎒", name:"탐험가 배낭",  price:80,  rarity:"common",    weapon:true, bakery:{ emoji:"🎀", name:"리본" } },
  { id:"hat_tophat",  emoji:"🧭", name:"나침반",      price:270, rarity:"rare",      weapon:true, bakery:{ emoji:"🍓", name:"딸기 모자" } },
  { id:"hat_star",    emoji:"🚲", name:"자전거",      price:400, rarity:"rare",      weapon:true, bakery:{ emoji:"🌸", name:"벚꽃 머리띠" } },
  { id:"hat_goggles", emoji:"📷", name:"카메라",      price:580, rarity:"epic",      weapon:true, bakery:{ emoji:"💎", name:"보석 티아라" } },
  { id:"hat_flame",   emoji:"🗺️", name:"보물 지도",   price:720, rarity:"legendary", weapon:true, bakery:{ emoji:"🎂", name:"케이크 모자" } },
];
// 베이커리 모드 모자 진열 순서(모험과 분리). 가격·등급은 아래 슬롯 테이블을 따름.
export const BAKERY_HAT_ORDER = ["hat_light","hat_tophat","hat_star","hat_axe","hat_goggles","hat_flame"];
export const BAKERY_HAT_PRICE = { hat_light:0, hat_tophat:80, hat_star:270, hat_axe:400, hat_goggles:580, hat_flame:870 };
export const BAKERY_HAT_RARITY = { hat_light:"common", hat_tophat:"common", hat_star:"rare", hat_axe:"rare", hat_goggles:"epic", hat_flame:"legendary" };
export const DECOR_BORDERS = [
  // 테두리 4종 — 테마색(모험:다이아 / 베이커리:루비) · 실버 · 골드 · 무지개
  // 테마 테두리: 아이가 고른 테마색(분홍/살구/연두/보라/파랑)을 그대로 따라간다. grad·glow 는 런타임에 themedBorder() 가 생성.
  { id:"bd_theme",   emoji:"💎", name:"테마",    price:120, rarity:"rare",      shimmer:true, themed:true, grad:"linear-gradient(115deg,#22D3EE 0%,#A5F3FC 22%,#FFFFFF 40%,#7DD3FC 58%,#67E8F9 76%,#C7F9FF 92%,#38BDF8 100%)", glow:"rgba(34,211,238,0.72)", glowCute:"rgba(120,200,220,0.36)" },
  { id:"bd_silver",  emoji:"🥈", name:"실버",    price:220, rarity:"rare",      shimmer:true, grad:"linear-gradient(115deg,#8A909C 0%,#C7CCD4 20%,#FFFFFF 38%,#D5D9E0 52%,#9CA3AF 70%,#EAECF0 86%,#B6BBC4 100%)", glow:"rgba(190,196,206,0.7)", glowCute:"rgba(150,156,168,0.35)" },
  { id:"bd_gold",    emoji:"🥇", name:"골드",    price:400, rarity:"epic",      shimmer:true, grad:"linear-gradient(115deg,#C8860B 0%,#F5C542 18%,#FFF6C9 36%,#FBD24E 52%,#E0A21A 70%,#FFE89B 86%,#D9A323 100%)", glow:"rgba(245,180,30,0.78)", glowCute:"rgba(232,165,40,0.4)" },
  { id:"bd_legend",  emoji:"🌈", name:"무지개",  price:660, rarity:"legendary", rainbow:true, grad:"linear-gradient(115deg,#FF5E8A,#FF9F43,#FFE14D,#4ADE80,#38BDF8,#A78BFA,#FF5E8A)", glow:"rgba(167,139,250,0.75)", glowCute:"rgba(190,160,235,0.4)", bakery:{ emoji:"🌈", name:"무지개빛" } },
];
// 배경: 프로필 카드 배경 장식 (장식 이모지 + 은은한 그라데이션 오버레이)
// 기본(base) = 모험 톤, bakery = 베이커리 톤. decorView 가 cute 일 때 bakery 필드로 치환.
export const DECOR_BGS = [
  { id:"bg_sakura",  emoji:"🌲", name:"마법 숲",     price:160,  rarity:"common",    deco:["🌲","🍄","✨","🦋","🐿️","🦌"],            tint:"rgba(34,150,90,0.28)",   bakery:{ emoji:"🌸", name:"벚꽃 배경", deco:["🌸","🌷","🌸"], tint:"rgba(251,207,232,0.4)" } },
  { id:"bg_rainbow", emoji:"🌊", name:"깊은 바다",   price:220,  rarity:"rare",      deco:["🌊","🐠","🐬","🐚","🐙","🫧","🌊"],       tint:"rgba(56,150,220,0.32)",  bakery:{ emoji:"🌈", name:"무지개 배경", deco:["🌈","🧁","🍰"], tint:"rgba(196,181,253,0.32)" } },
  { id:"bg_jungle",  emoji:"🌴", name:"정글 원정대", price:300,  rarity:"rare",      deco:["🌴","🦜","🐒","🍃","🐍","🌿","🌴"],       tint:"rgba(34,160,80,0.30)",   bakery:{ emoji:"🍃", name:"민트 정원", deco:["🍃","🌿","🍵"], tint:"rgba(167,243,208,0.34)" } },
  { id:"bg_dino",    emoji:"🦕", name:"공룡 섬",     price:350,  rarity:"epic",      deco:["🦕","🦖","🥚","🌋","🌴","🦴"],            tint:"rgba(120,160,90,0.30)",  bakery:{ emoji:"🥚", name:"초코에그 섬", deco:["🥚","🍫","🌴"], tint:"rgba(180,120,80,0.30)" } },
  { id:"bg_star",    emoji:"🏝️", name:"보물섬",     price:450,  rarity:"epic",      deco:["🏝️","🗺️","💰","🏴‍☠️","⚓","🌴"],          tint:"rgba(240,190,90,0.30)",  bakery:{ emoji:"🍮", name:"푸딩 섬", deco:["🍮","🏝️","🌴"], tint:"rgba(253,224,71,0.30)" } },
  { id:"bg_cloud",   emoji:"🚀", name:"우주 탐사",   price:560, rarity:"legendary", deco:["🚀","🪐","🌎","☄️","🛰️","⭐","🌌"],       tint:"rgba(90,110,200,0.32)",  bakery:{ emoji:"☁️", name:"솜사탕 구름", deco:["☁️","☁️","🍬"], tint:"rgba(186,230,253,0.35)" } },
];
// 베이커리 전용 배경 6슬롯 (모험 4슬롯과 분리). deco[0]=메인(가장 자주 등장). 종류 4개↑면 무대카드 전체에 고르게 분산됨.
export const BAKERY_BGS = [
  { id:"bbg_sakura",    emoji:"🌸", name:"벚꽃 마을",         price:110,  rarity:"common",    deco:["🌸","🏡","🌷","🌿"],          tint:"rgba(251,207,232,0.42)", bakeryOnly:true },
  { id:"bbg_strawberry",emoji:"🍓", name:"딸기 농장",         price:250,  rarity:"common",    deco:["🍓","🏡","🌿","🍓"],          tint:"rgba(254,202,202,0.40)", bakeryOnly:true },
  { id:"bbg_starcandy", emoji:"🌟", name:"별사탕 왕국",       price:300,  rarity:"rare",      deco:["🌟","⭐","🍬","🍭"],          tint:"rgba(253,224,71,0.30)",  bakeryOnly:true },
  { id:"bbg_choco",     emoji:"🍫", name:"초콜릿 공장",       price:350,  rarity:"rare",      deco:["🍫","🍩","🍪","🍰"],          tint:"rgba(180,120,80,0.32)",  bakeryOnly:true },
  { id:"bbg_heaven",    emoji:"👼", name:"천상의 베이커리",   price:450,  rarity:"epic",      deco:["👼","☁️","🧁","🍰","✨"],     tint:"rgba(224,231,255,0.40)", bakeryOnly:true },
  { id:"bbg_rainbow",   emoji:"🌈", name:"무지개 케이크 왕국",price:560, rarity:"legendary", deco:["🌈","🎂","🧁","🍭","⭐"],     tint:"rgba(196,181,253,0.36)", bakeryOnly:true },
];
// 펫 스킨: 펫이 최종 진화(전설의 드래곤/유니콘) 했을 때 잠금 해제. 장착하면 펫 대신 이 동물 이모지로 보임(완성형).
// 캐릭터 스킨과 동일한 구조 — petskin:true. 모험/베이커리 공용 이모지(동물은 두 모드 모두 자연스러움).
export const DECOR_PET_SKINS = [
  { id:"pk_fox",       emoji:"🦊",   name:"불꽃 여우",     price:280, rarity:"rare",      petskin:true, bakery:{ name:"솜사탕 여우" } },
  { id:"pk_panda",     emoji:"🐼",   name:"대나무 판다",   price:280, rarity:"rare",      petskin:true, bakery:{ name:"마시멜로 판다" } },
  { id:"pk_rabbit",    emoji:"🐰",   name:"질풍 토끼",     price:380, rarity:"epic",      petskin:true, bakery:{ emoji:"🐦", name:"노래하는 새" } },
  { id:"pk_butterfly", emoji:"🦋",   name:"신비한 나비",   price:380, rarity:"epic",      petskin:true, bakery:{ emoji:"🐰", name:"딸기 토끼" } },
  { id:"pk_lion",      emoji:"🦁",   name:"용맹한 사자",   price:470, rarity:"legendary", petskin:true, bakery:{ name:"꿀빛 사자" } },
  { id:"pk_dragon",    emoji:"🦄",   name:"전설의 유니콘", price:470, rarity:"legendary", petskin:true, bakery:{ emoji:"🦋", name:"반짝 나비" } },
];
// 베이커리 모드 펫 스킨 표시 순서 (모험 순서와 분리). 가격·등급은 슬롯(모험) 값을 그대로 따름.
// 순서: 솜사탕여우→마시멜로판다→노래하는새→반짝나비→딸기토끼→꿀빛사자
export const BAKERY_PETSKIN_ORDER = ["pk_fox","pk_panda","pk_rabbit","pk_dragon","pk_butterfly","pk_lion"];
export const DECOR_GROUPS = [
  { key:"hat",     label:"모자",     icon:"🎩", items:DECOR_HATS },
  { key:"border",  label:"테두리",   icon:"💎", items:DECOR_BORDERS },
  { key:"bg",      label:"배경",     icon:"🌸", items:DECOR_BGS },
  { key:"petskin", label:"펫",       icon:"🐾", items:DECOR_PET_SKINS, lockUntilMaxPet:true },
];
/* ── 순수 규칙: 미션 누적 개수에 따른 보물상자 적립 계산 ──────────
   입력: 현재 아이의 treasure 상태, 이번에 보상 처리할 questKey
   출력: { next(=갱신된 treasure), earned(=이번에 받은 상자등급|null), nextCount }
        이미 보상된 questKey면 changed:false로 알려 호출부가 조기 반환하게 한다.
   적립 규칙(누적 10/30/50의 배수에서 상자 지급)을 한곳에 못박아, 화면 어디서
   호출하든 동일하게 동작하고 단독 테스트가 가능하다. */
export const TREASURE_MILESTONE = { normal:8, rare:20, legend:32 };
export const computeQuestTreasure = (cur, questKey) => {
  const base = cur || { completedQuestCount:0, normalBox:0, rareBox:0, legendBox:0, rewardedQuestKeys:[] };
  const keys = base.rewardedQuestKeys || [];
  if (!questKey || keys.includes(questKey)) {
    return { changed:false, next:base, earned:null, nextCount:Number(base.completedQuestCount||0) };
  }
  const nextCount = Number(base.completedQuestCount||0) + 1;
  let earned = null;
  if (nextCount % TREASURE_MILESTONE.legend === 0) earned = "legend";
  else if (nextCount % TREASURE_MILESTONE.rare === 0) earned = "rare";
  else if (nextCount % TREASURE_MILESTONE.normal === 0) earned = "normal";
  const next = {
    ...base,
    completedQuestCount: nextCount,
    normalBox: Number(base.normalBox||0) + (earned==="normal"?1:0),
    rareBox:   Number(base.rareBox||0)   + (earned==="rare"?1:0),
    legendBox: Number(base.legendBox||0) + (earned==="legend"?1:0),
    rewardedQuestKeys: [...keys, questKey],
  };
  return { changed:true, next, earned, nextCount };
};

export const ALL_DECOR = [...DECOR_HATS, ...DECOR_BORDERS, ...DECOR_BGS, ...BAKERY_BGS, ...DECOR_PET_SKINS];
export const getDecorById = (id) => ALL_DECOR.find(d=>d.id===id) || null;

/* ── 순수 규칙: 데코가 장착될 그룹 키 판정 ──────────────────────────
   DECOR_GROUPS에 속하면 그 그룹 key, 베이커리 전용 배경(BAKERY_BGS)은 "bg"로 간주.
   App 상태와 무관한 순수 함수라 단독 테스트·재사용 가능. */
export const getDecorGroupKey = (decorId) => {
  const grp = DECOR_GROUPS.find(g=>g.items.some(it=>it.id===decorId));
  if (grp) return grp.key;
  if (BAKERY_BGS.some(b=>b.id===decorId)) return "bg";
  return null;
};

/* ── 순수 규칙: 데코 구매 결과 계산 ────────────────────────────────
   입력: 현재 보유목록/장착맵(해당 아이분), 살 데코id
   출력: 다음 보유목록, 다음 장착맵, 장착된 그룹키
   코인 차감·토스트 같은 부수효과는 호출부(App)가 담당. 여기선 "무엇이 어떻게
   바뀌는가"라는 규칙만 한곳에 모은다. */
export const computeDecorPurchase = (ownedList = [], equippedMap = {}, decorId) => {
  const nextOwned = [...ownedList, decorId];
  const groupKey = getDecorGroupKey(decorId);
  const nextEquipped = groupKey
    ? { ...equippedMap, [groupKey]: decorId }   // 구매 즉시 자동 장착
    : equippedMap;
  return { nextOwned, nextEquipped, groupKey };
};
// 스킨에 맞춰 이름/이모지/장식 치환한 데코 객체 반환
export const decorView = (d, skin) => {
  if(!d) return d;
  if(skin==="cute" && d.bakery){
    return { ...d, ...d.bakery };
  }
  return d;
};

// ── 모드별 용어(재화·아이콘) ─────────────────────────────
// 모험: ⭐ XP / 💎 코인 / 🎁 보물상자
// 베이커리: ⭐ 경험치 / 🍪 쿠키 / 🎀 디저트상자 / 🎁 디저트 보관함
export const TERMS = {
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
export const getTerms = (skin) => TERMS[skin] || TERMS.dungeon;
export const HOLIDAYS = {
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
export const getHolidayName = (dateStr) => HOLIDAYS[dateStr]||"";


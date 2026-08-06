import { DAYS, DAY_COLORS, GENDER_THEME, CHILD_THEME_COLORS, C, mixWhite, mixBlack, headerTone, softTint, dungeonTone, DUNGEON_SHOP, ITEM_ACTION_STYLE, DUNGEON_DECOR_CARD, dungeonDecorRarity, getDungeonShopGradeColor, getDungeonShopItemBg, getDungeonShopItemShadow, mixHex, makeThemeColors, SHADOW, gameCard, CHARACTER_CARD, GAME_MODAL_STYLE, PALETTE, DEFAULT_HOMEWORK_SCORE, EXTRA_QUEST_ID, DEV_PIN, RECOVERY_QUESTIONS, PREMIUM_ENABLED, FOUNDING_USER_IS_PREMIUM, FREE_THEME_COUNT } from "./data/tokens.js";
import { DEFAULT_LEVELS, levelView, SKINS, DEFAULT_SKIN, BAKERY_ENABLED, getSkin, getAcademyTheme, IslandMap, CHARACTER_EVOLUTIONS, PET_STAGES, PET_EVOLVE_CHANCE, PET_EVOLVE_LEGEND_PITY, EVOLUTION_MESSAGES, BAKERY_EVOLUTIONS, evoView, petView, evoMsgView } from "./data/gameData.jsx";
import { ADV_CHAR_STAGE_OF, ADV_CHAR_SIZE, AVATAR_HOME_SIZE, BAKERY_CHAR_SIZE, ADV_STAGE_BG_OF, ADV_STAGE_BG_ALL, ADV_CHAR_IMG, BAKERY_CHAR_IMG, LEVEL_UP_REWARDS, LEVEL_DESCRIPTION, REWARD_GRADES, getRewardGrade, DEFAULT_REWARDS, REWARD_SETS_BY_AGE, getRewardsByAge, getBoxInfo, getRandomTreasureCoin, UI_TEXT, LEGENDARY_TITLES, TITLE_RARITY, DEFAULT_TITLES, titleView, DECOR_RARITY, BAKERY_HAT_ORDER, BAKERY_HAT_PRICE, BAKERY_HAT_RARITY, BAKERY_BGS, BAKERY_PETSKIN_ORDER, DECOR_GROUPS, TREASURE_MILESTONE, computeQuestTreasure, getDecorById, computeDecorPurchase, decorView, getTerms, getHolidayName } from "./data/characters.js";
import { TODAY, parseLocal, toStr, fmt, addDays, todayDN, getCalDays, getDN, save, load, clearAllStorage, smsLink, DEFAULT_CHILDREN } from "./utils/dates.js";
import { buildSampleData, SAMPLE_TMPL, EMPTY_AC, EMPTY_ABS, hasClassOnDay, getScheduleForDay, getClassTime, getClassDuration, getSchedules, getShuttleText, getRemainLabel, toKoreanTime } from "./data/sampleData.js";
import { CharacterSectionHeader, GameModalHeader, GameModalButton, KidCoachmark } from "./components/helpers.jsx";
import { ModeSelect, CoachmarkOverlay, OnboardingFlow, GuideModal } from "./components/Onboarding.jsx";
import AvatarViewer from "./components/AvatarViewer.jsx";
import EquipmentShop from "./components/EquipmentShop.jsx";
import DiscoveryBook from "./components/DiscoveryBook.jsx";
import { DISCOVERY_KEY, DISCOVERIES, recordDiscovery, getDiscoveryOn, getDiscovery, getTodayHint, getCollectedCount, rollEvent, rollMapAnimals, rollRainbow, rollSparkT } from "./data/discoveries.js";
import HomeSheet from "./components/HomeSheet.jsx";
import AdventureMap from "./components/AdventureMap.jsx";
import { getMapWalker } from "./data/mapWalkers.js";
import ExpeditionTrack from "./components/ExpeditionTrack.jsx";
import DevToolsPanel from "./components/DevToolsPanel.jsx";
import DevExpeditionPreview from "./components/DevExpeditionPreview.jsx";
import CampPrototype from "./components/camp/CampPrototype.jsx";
import CampScene from "./components/camp/CampScene.jsx";
import DecorShopSheet from "./components/camp/DecorShopSheet.jsx";
import StreakSheet from "./components/camp/StreakSheet.jsx";
import TitleSheet from "./components/camp/TitleSheet.jsx";
import HistorySheet from "./components/camp/HistorySheet.jsx";
import PetSheet from "./components/camp/PetSheet.jsx";
import TreasureSheet from "./components/camp/TreasureSheet.jsx";
import ItemShopSheet from "./components/camp/ItemShopSheet.jsx";
import HeroStage from "./components/HeroStage.jsx";
import AdventureJournalCard from "./components/AdventureJournalCard.jsx";
import AdventureSpotPicker from "./components/AdventureSpotPicker.jsx";
import PageFlip from "./components/PageFlip.jsx";
import {
  AVATAR_OWNED_KEY, AVATAR_EQUIPPED_KEY, CHAR_DISPLAY_MODE_KEY,
  LEGACY_AVATAR_OWNED_KEY, computeAvatarMigration,
  CHAR_DISPLAY_GROWTH, CHAR_DISPLAY_AVATAR, DEFAULT_CHAR_DISPLAY_MODE,
  getDefaultEquipped, computeAvatarPurchase, computeAvatarEquipToggle,
  computeCharDisplayToggle, normalizeOwned, normalizeEquipped, getAvatarItem,
} from "./data/avatarEquipment.js";

import { Fragment, useState, useEffect, useRef } from "react";
/* ════════════════════════════════════════════════════════════════════════
   개발자 도구 플래그
   ────────────────────────────────────────────────────────────────────────
   DEV_MODE = true  → 설정에 개발용 치트 패널 노출(XP/코인/상자 무한 지급,
                      테스트 데이터 생성 등). 개발·디버깅 중에만 켠다.
   DEV_MODE = false → 치트 패널 숨김 + 치트 함수 진입 차단(이중 방어).
                      ※ 배포 시 반드시 false 로 둘 것.
   주의: 정식 "위험구역" 초기화(resetGameData/resetAllAppData)는 사용자 기능이라
        이 플래그와 무관하게 항상 동작한다.
   ════════════════════════════════════════════════════════════════════════ */
const DEV_MODE = true; // ★ 사용자 요청(2026-07-20): 별도 지시 전까지 켜둘 것 — 끄기 전 반드시 사용자 확인

/* ════════════════════════════════════════════════════════════════════════
   SECTION 10. STATE LAYER (도메인별 초기값)

   목적: App()의 useState 초기값을 도메인별 객체(initX)로 묶어 한곳에서 관리한다.
         각 필드는 App 안에서 useState(initX.field) 형태로 개별 상태가 된다.
   원칙:
     - 저장 키(v6_*)·백업 포맷은 절대 바꾸지 않는다 (기존 데이터 호환).
     - 초기값만 여기 모으고, 실제 로드된 값은 App 초기화 effect에서 setXxx로 주입.

   설계 메모: 과거 9개 useReducer로 묶었으나, "한 사건→여러 도메인 변경"
   핸들러가 소수(8개)뿐이라 reducer의 이점 없이 보일러플레이트만 늘어
   useState로 환원했다. 복합 게임 로직(보물상자·구매·레벨업 등)은 reducer가
   아니라 App 밖 순수 함수(applyXxx)로 분리해 일관성·테스트성을 확보한다.
   ════════════════════════════════════════════════════════════════════════ */

// ── 도메인별 초기값 ───────────────────────────────────────────────
const initChildren = {
  children: DEFAULT_CHILDREN,
  childId: "child_1",
  skinByChild: {},
  lastLevelByChild: {},
  childForm: { name:"", gender:"boy", theme:CHILD_THEME_COLORS[0] },
  editingChild: null,
  showChildMgr: false,
};
const initAcademy = {
  academies: {}, absences: {}, paidStatus: {}, vacations: {},
  newAc: EMPTY_AC, editTarget: null,
  supplyInput: "", baseHwInput: "", showAcMore: false,
  vacForm: { academyId:"", start:"", end:"" }, showVacModal: null,
};
const initDaily = {
  dailyData: {}, baseSeededKeys: {},
  dailyHwInput: "", dailySupInput: "", dailyTodoInput: "",
  dailyHwPoint: DEFAULT_HOMEWORK_SCORE, dailyTodoPoint: DEFAULT_HOMEWORK_SCORE,
  showDailyModal: null, showTodoPickerModal: null, showPastMissionModal: null,
};
const initReward = {
  scoreData: {}, rewardData: {}, rewardRequests: {},
  rewardForm: { title:"", point:300, emoji:"🎁", grade:"common" },
  editingRewardId: null, showRewardModal: false,
  openRewardId: null, openRewardShop: false,
  xpAdjustInput: "", xpAdjustLabel: "", xpAdjustSign: "+",
};
const initProgress = {
  petData: {},
  selectedTitles: {}, seenTitles: {}, earnedTitleIds: {}, specialTitles: {},
  treasureData: {},
  ownedDecor: {}, equippedDecor: {}, decorPrices: {},
  unlockedBadgeIds: [], bestStreakData: {},
};
const initSms = {
  templates: SAMPLE_TMPL, editTmpl: { title:"", body:"" },
  smsDraft: "", showSmsModal: null, openSmsManage: false, showTmplEdit: null,
};
const initAuth = {
  appMode: "child",
  parentPin: "1234", pinInput: "",
  oldPinInput: "", newPinInput: "", newPinConfirm: "", showPinChangeModal: false,
  recoveryQuestion: "", recoveryAnswer: "", // 비밀번호 복구용 질문/답
  newRecoveryQ: "", newRecoveryA: "", // 비번 변경 모달 입력값
  showRecoveryModal: false, recoveryAnswerInput: "", // 복구(찾기) 모달
  showRecoverySetupModal: false, setupRecoveryQ: "", setupRecoveryA: "", // 복구질문 설정/변경 모달
  showResetPinModal: false, resetNewPin: "", resetNewPinConfirm: "", // 복구 성공 후 새 PIN만 설정
  isPaidPremium: false, installInfo: null,
};
const initOnboarding = {
  showOnboarding: false, showCoachmark: false, showKidCoachmark: false, showModeSelect: false,
  firstTipPending: false, firstTipSeen: false,
  pinHintSeen: false, showParentRewardGuide: false, parentRewardGuideSeen: false, showParentWelcome: false, parentWelcomeSeen: false,
};
const initUi = {
  childTab: "area",
  showChildRewards: false,
  showChildXP: false,
  showParentTodayQuest: false,
  showParentRewardManage: false,
  showParentXpAdjust: false,
  showParentGrowthManage: false,
  showParentRecordManage: false,
  openTitle: false,
  openTreasure: false,
  openPet: false,
  openHistory: false,
  openStreak: false,
  pastQuestBlockModal: null,
  questResultModal: null,
  charCheer: null,
  treasureModal: null,
  openingTreasure: false,
  showSettingsModal: false,
  showDevTools: false,
  showAcademyCopyModal: false,
  copySourceChildId: "",
  copySelectedAcademyIds: [],
  eventModal: null,
  eventQueue: [],
  childDate: TODAY,
  showDecorShop: false,
  tab: "home",
  dayMemos: {},
  feeMonth: (new Date().getMonth()+1),
  calDate: (new Date()),
  calSelDate: null,
  homeDate: TODAY,
  showAddAcModal: false,
  showDetailModal: null,
  showAbsModal: false,
  newAbs: EMPTY_ABS,
  toast: "",
};




/* ════════════════════════════════════════════════════════════════════════
   SECTION 11. App() — 메인 컴포넌트
   ════════════════════════════════════════════════════════════════════════ */

export default function App() {
  const [loaded,setLoaded] = useState(false);
  // 내 캐릭터 탭 섹션 열림/닫힘
  // ── 꾸미기(데코) 시스템 ──
  // (꾸미기 가격관리 섹션 제거됨 — 카탈로그 기본가로 자동 운영)

  // 아이 목록 상태
  // 현재 선택된 아이의 스킨 (아이별로 다름). 미설정이면 기본 스킨.
  // ── 도메인 A: children (아이 목록/선택/스킨/폼) ─────────────────────
  const [children,         setChildren]         = useState(initChildren.children);
  const [childId,          setChildId]          = useState(initChildren.childId);
  const [skinByChild,      setSkinByChild]      = useState(initChildren.skinByChild);
  const [lastLevelByChild, setLastLevelByChild] = useState(initChildren.lastLevelByChild);
  const [childForm,        setChildForm]        = useState(initChildren.childForm);
  const [editingChild,     setEditingChild]     = useState(initChildren.editingChild);
  const [showChildMgr,     setShowChildMgr]     = useState(initChildren.showChildMgr);

  // ── 도메인 B: academy (학원/결석/결제/휴원/폼) ─────────────────────
  const [academies,   setAcademies]   = useState(initAcademy.academies);
  const [absences,    setAbsences]    = useState(initAcademy.absences);
  const [paidStatus,  setPaidStatus]  = useState(initAcademy.paidStatus);
  const [vacations,   setVacations]   = useState(initAcademy.vacations);
  const [newAc,       setNewAc]       = useState(initAcademy.newAc);
  const [editTarget,  setEditTarget]  = useState(initAcademy.editTarget);
  const [supplyInput, setSupplyInput] = useState(initAcademy.supplyInput);
  const [baseHwInput, setBaseHwInput] = useState(initAcademy.baseHwInput);
  const [showAcMore,  setShowAcMore]  = useState(initAcademy.showAcMore);
  const [acSecSupply, setAcSecSupply] = useState(false); // 상세: 준비물·숙제
  const [acSecFee,    setAcSecFee]    = useState(false); // 상세: 학원비·납부
  const [acSecInfo,   setAcSecInfo]   = useState(false); // 상세: 학원정보
  const [acSecMemo,   setAcSecMemo]   = useState(false); // 상세: 메모
  const [vacForm,     setVacForm]     = useState(initAcademy.vacForm);
  const [showVacModal,setShowVacModal]= useState(initAcademy.showVacModal);

  // ── 도메인 C: daily (일별 숙제/준비물/할일 + 입력) ────────────────
  const [dailyData,           setDailyData]           = useState(initDaily.dailyData);
  const [baseSeededKeys,      setBaseSeededKeys]      = useState(initDaily.baseSeededKeys);
  const [dailyHwInput,        setDailyHwInput]        = useState(initDaily.dailyHwInput);
  const [dailySupInput,       setDailySupInput]       = useState(initDaily.dailySupInput);
  const [dailyTodoInput,      setDailyTodoInput]      = useState(initDaily.dailyTodoInput);
  const [editingDailyItem,    setEditingDailyItem]    = useState(null); // {kind:'hw'|'todo', id} 수정 중인 미션
  const [editingDailyText,    setEditingDailyText]    = useState("");   // 수정 중 텍스트
  const [editingDailyPoint,   setEditingDailyPoint]   = useState("");   // 수정 중 점수(보상탭에서만)
  const [dailyHwPoint,        setDailyHwPoint]        = useState(initDaily.dailyHwPoint);
  const [dailyTodoPoint,      setDailyTodoPoint]      = useState(initDaily.dailyTodoPoint);
  const [showDailyModal,      setShowDailyModal]      = useState(initDaily.showDailyModal);
  const [showTodoPickerModal, setShowTodoPickerModal] = useState(initDaily.showTodoPickerModal);
  const [showPastMissionModal,setShowPastMissionModal]= useState(initDaily.showPastMissionModal);
  const [kidAddAcId,          setKidAddAcId]          = useState("");      // 아이용 미션추가: 선택 학원
  const [kidAddText,          setKidAddText]          = useState("");      // 아이용 미션추가: 입력 텍스트
  const [showKidAddModal,     setShowKidAddModal]     = useState(false);   // 아이용 미션추가 모달

  // ── 도메인 D: reward (점수/보상/구매요청/XP조정) ──────────────────
  const [scoreData,      setScoreData]      = useState(initReward.scoreData);
  const [rewardData,     setRewardData]     = useState(initReward.rewardData);
  const [rewardAgeGroup, setRewardAgeGroup] = useState("kid"); // 현재 보상 연령대 (kid|elemLow|elemHigh|teen|custom)
  const [pendingAgeChange, setPendingAgeChange] = useState(null); // 연령대 변경 확인 모달용 (age 문자열)
  const [pendingRestore, setPendingRestore] = useState(null); // 백업 복원 확인 모달용 (파싱된 데이터)
  const [lastBackupDate, setLastBackupDate] = useState(null); // 마지막 백업 날짜 (YYYY-MM-DD), 없으면 null
  const [lastNudgeDate, setLastNudgeDate] = useState(null); // 마지막으로 백업 권유를 띄운 날짜 (YYYY-MM-DD), 없으면 null
  const [showBackupNudge, setShowBackupNudge] = useState(false); // 백업 권유 모달 표시 여부
  const [backupNudgeChecked, setBackupNudgeChecked] = useState(false); // 이번 세션에서 넛지 체크를 이미 했는지
  const [rewardRequests, setRewardRequests] = useState(initReward.rewardRequests);
  const [rewardForm,     setRewardForm]     = useState(initReward.rewardForm);
  const [editingRewardId,setEditingRewardId]= useState(initReward.editingRewardId);
  const [showRewardModal,setShowRewardModal]= useState(initReward.showRewardModal);
  const [openRewardId,   setOpenRewardId]   = useState(initReward.openRewardId);
  const [openRewardShop, setOpenRewardShop] = useState(initReward.openRewardShop);
  const [xpAdjustInput,  setXpAdjustInput]  = useState(initReward.xpAdjustInput);
  const [xpAdjustLabel,  setXpAdjustLabel]  = useState(initReward.xpAdjustLabel);
  const [xpAdjustSign,   setXpAdjustSign]   = useState(initReward.xpAdjustSign);

  // ── 도메인 E: progress (펫/칭호/보물/꾸미기/뱃지/기록) ────────────
  const [petData,          setPetData]          = useState(initProgress.petData);
  const [selectedTitles,   setSelectedTitles]   = useState(initProgress.selectedTitles);
  const [seenTitles,       setSeenTitles]       = useState(initProgress.seenTitles);
  const [earnedTitleIds,   setEarnedTitleIds]   = useState(initProgress.earnedTitleIds);
  const [specialTitles,    setSpecialTitles]    = useState(initProgress.specialTitles);
  const [treasureData,     setTreasureData]     = useState(initProgress.treasureData);
  const [ownedDecor,       setOwnedDecor]       = useState(initProgress.ownedDecor);
  const [equippedDecor,    setEquippedDecor]    = useState(initProgress.equippedDecor);
  // ── 꾸미기 아바타 장비 시스템 (신규, 아이별 맵. 기존 decor와 별개) ──
  const [avatarOwned,      setAvatarOwned]      = useState({});   // { [childId]: string[] }
  const [avatarEquipped,   setAvatarEquipped]   = useState({});   // { [childId]: {slot:itemId} }
  const [charDisplayMode,  setCharDisplayMode]  = useState({});   // { [childId]: "growth"|"avatar" }
  const [showEquipShop,    setShowEquipShop]    = useState(false);
  const [decorPrices,      setDecorPrices]      = useState(initProgress.decorPrices);
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState(initProgress.unlockedBadgeIds);
  const [bestStreakData,   setBestStreakData]   = useState(initProgress.bestStreakData);

  // ── 도메인 F: sms (문자/템플릿) ──────────────────────────────────
  const [templates,    setTemplates]    = useState(initSms.templates);
  const [editTmpl,     setEditTmpl]     = useState(initSms.editTmpl);
  const [smsDraft,     setSmsDraft]     = useState(initSms.smsDraft);
  const [showSmsModal, setShowSmsModal] = useState(initSms.showSmsModal);
  const [openSmsManage,setOpenSmsManage]= useState(initSms.openSmsManage);
  const [showTmplEdit, setShowTmplEdit] = useState(initSms.showTmplEdit);

  // ── 도메인 G: auth (부모모드/PIN/프리미엄) ──────────────────────
  const [appMode,           setAppMode]           = useState(initAuth.appMode);
  const [confirmDelAc, setConfirmDelAc] = useState(false); // 학원 수정 모달 내 삭제 2단계 확인
  const [parentPin,         setParentPin]         = useState(initAuth.parentPin);
  const [pinInput,          setPinInput]          = useState(initAuth.pinInput);
  const [oldPinInput,       setOldPinInput]       = useState(initAuth.oldPinInput);
  const [newPinInput,       setNewPinInput]       = useState(initAuth.newPinInput);
  const [newPinConfirm,     setNewPinConfirm]     = useState(initAuth.newPinConfirm);
  const [showPinChangeModal,setShowPinChangeModal]= useState(initAuth.showPinChangeModal);
  const [recoveryQuestion,  setRecoveryQuestion]  = useState(initAuth.recoveryQuestion);
  const [recoveryAnswer,    setRecoveryAnswer]    = useState(initAuth.recoveryAnswer);
  const [newRecoveryQ,      setNewRecoveryQ]      = useState(initAuth.newRecoveryQ);
  const [newRecoveryA,      setNewRecoveryA]      = useState(initAuth.newRecoveryA);
  const [showRecoveryModal, setShowRecoveryModal] = useState(initAuth.showRecoveryModal);
  const [recoveryAnswerInput,setRecoveryAnswerInput]= useState(initAuth.recoveryAnswerInput);
  const [showResetPinModal, setShowResetPinModal] = useState(initAuth.showResetPinModal);
  const [resetNewPin,       setResetNewPin]       = useState(initAuth.resetNewPin);
  const [resetNewPinConfirm,setResetNewPinConfirm]= useState(initAuth.resetNewPinConfirm);
  const [showRecoverySetupModal,setShowRecoverySetupModal]= useState(initAuth.showRecoverySetupModal);
  const [setupRecoveryQ,    setSetupRecoveryQ]    = useState(initAuth.setupRecoveryQ);
  const [setupRecoveryA,    setSetupRecoveryA]    = useState(initAuth.setupRecoveryA);
  const [isPaidPremium,     setIsPaidPremium]     = useState(initAuth.isPaidPremium);
  const [installInfo,       setInstallInfo]       = useState(initAuth.installInfo);
  // ── 엄마용은 PIN 없이 진입. 단, '보상' 탭과 '위험구역'만 PIN으로 보호 ──
  const [rewardUnlocked,    setRewardUnlocked]    = useState(false); // 보상탭: 세션 동안 1회 통과하면 유지
  const [gatePin,           setGatePin]           = useState("");    // 게이트 PIN 입력값(기존 pinInput과 분리)
  const [gateAction,        setGateAction]        = useState(null);  // PIN 통과 시 실행할 콜백({run, title})

  // ── 도메인 H: onboarding (온보딩/코치마크/1회성 안내) ────────────
  const [showOnboarding,        setShowOnboarding]        = useState(initOnboarding.showOnboarding);
  const [showCoachmark,         setShowCoachmark]         = useState(initOnboarding.showCoachmark);
  const [showKidCoachmark,      setShowKidCoachmark]      = useState(initOnboarding.showKidCoachmark);
  const [showModeSelect,        setShowModeSelect]        = useState(initOnboarding.showModeSelect);
  const [firstTipPending,       setFirstTipPending]       = useState(initOnboarding.firstTipPending);
  const [firstTipSeen,          setFirstTipSeen]          = useState(initOnboarding.firstTipSeen);
  // 온보딩 직후 첫 홈 화면에서 '학원 추가' → '미션·준비물 편집' 순서로 1회성 버튼 깜빡임 안내
  const [pinHintSeen,           setPinHintSeen]           = useState(initOnboarding.pinHintSeen);
  const [showParentRewardGuide, setShowParentRewardGuide] = useState(initOnboarding.showParentRewardGuide);
  const [parentRewardGuideSeen, setParentRewardGuideSeen] = useState(initOnboarding.parentRewardGuideSeen);
  const [showParentWelcome,    setShowParentWelcome]    = useState(initOnboarding.showParentWelcome);
  const [parentWelcomeSeen,    setParentWelcomeSeen]    = useState(initOnboarding.parentWelcomeSeen);

  // ── 도메인 I: ui (범용 탭/모달/토글) ─────────────────────────────
  const [childTab,               setChildTab]               = useState(initUi.childTab);
  const [journalAcId,            setJournalAcId]            = useState(null); // 탐험일지 표시 학원 (null=시간 기준 자동)
  /* 오늘의 발견 — 지도 발견 지점을 지나간 날 하루 1개 (미션과 무관). 저장은 새 키(v6_discoveries)로만. */
  const [discoveryData,         setDiscoveryData]          = useState({});
  const [openDiscoveryBook,     setOpenDiscoveryBook]      = useState(false);
  /* (삭제됨) discoveryPop — 머리 위 말풍선 전용 상태였는데 말풍선을 빼며 같이 제거 (사용자 확정) */
  // 탐험일지 자동 선택: 아직 안 끝난 첫 수업(진행 중 포함) = 이번에 갈 학원. 다 끝났으면 마지막, 오늘이 아니면 첫 학원.
  const pickJournalAc = (list, dayName, isToday) => {
    if (!list.length) return null;
    const withT = list.map(ac => {
      const sc = getScheduleForDay(ac, dayName);
      const [h, m] = String(sc?.time || "23:59").split(":").map(Number);
      const st = (h || 0) * 60 + (m || 0);
      return { id: ac.id, st, en: st + (sc?.duration || 40) };
    }).sort((a, b) => a.st - b.st);
    if (!isToday) return withT[0].id;
    const now = new Date(); const nm = now.getHours() * 60 + now.getMinutes();
    return (withT.find(x => nm < x.en) || withT[withT.length - 1]).id;
  };
  const [showChildRewards,       setShowChildRewards]       = useState(initUi.showChildRewards);
  const [showChildXP,            setShowChildXP]            = useState(initUi.showChildXP);
  const [showParentTodayQuest,   setShowParentTodayQuest]   = useState(initUi.showParentTodayQuest);
  const [showParentRewardManage, setShowParentRewardManage] = useState(initUi.showParentRewardManage);
  const [showParentXpAdjust,     setShowParentXpAdjust]     = useState(initUi.showParentXpAdjust);
  const [showParentGrowthManage, setShowParentGrowthManage] = useState(initUi.showParentGrowthManage);
  const [showParentRecordManage, setShowParentRecordManage] = useState(initUi.showParentRecordManage);
  const [showHomeAcademyList,    setShowHomeAcademyList]    = useState(false); // 홈탭 등록학원 펼침
  const [openTitle,              setOpenTitle]              = useState(initUi.openTitle);
  const [openTreasure,           setOpenTreasure]           = useState(initUi.openTreasure);
  const [openPet,                setOpenPet]                = useState(initUi.openPet);
  const [openHistory,            setOpenHistory]            = useState(initUi.openHistory);
  const [openStreak,             setOpenStreak]             = useState(initUi.openStreak);
  const [pastQuestBlockModal,    setPastQuestBlockModal]    = useState(initUi.pastQuestBlockModal);
  const [questResultModal,       setQuestResultModal]       = useState(initUi.questResultModal);
  const [charCheer,              setCharCheer]              = useState(initUi.charCheer);
  const [treasureModal,          setTreasureModal]          = useState(initUi.treasureModal);
  const [openingTreasure,        setOpeningTreasure]        = useState(initUi.openingTreasure);
  const [showSettingsModal,      setShowSettingsModal]      = useState(initUi.showSettingsModal);
  const [showDevTools,           setShowDevTools]           = useState(initUi.showDevTools);
  /* 미션 배경 점검 미리보기 (개발자 도구 전용) — 저장 안 함, 열릴 때마다 새로 */
  const [showExpPreview,         setShowExpPreview]         = useState(false);
  const [showCampProto,          setShowCampProto]          = useState(false);
  const [showAcademyCopyModal,   setShowAcademyCopyModal]   = useState(initUi.showAcademyCopyModal);
  const [copySourceChildId,      setCopySourceChildId]      = useState(initUi.copySourceChildId);
  const [copySelectedAcademyIds, setCopySelectedAcademyIds] = useState(initUi.copySelectedAcademyIds);
  const [eventModal,             setEventModal]             = useState(initUi.eventModal);
  const [eventQueue,             setEventQueue]             = useState(initUi.eventQueue);
  const [childDate,              setChildDate]              = useState(initUi.childDate);
  const [showDecorShop,          setShowDecorShop]          = useState(initUi.showDecorShop);
  const [tab,                    setTab]                    = useState(initUi.tab);
  const [dayMemos,               setDayMemos]               = useState(initUi.dayMemos);
  const [feeMonth,               setFeeMonth]               = useState(initUi.feeMonth);
  const [absMonth,               setAbsMonth]               = useState(()=>TODAY.slice(0,7)); // 결석 탭 월 필터 (YYYY-MM)
  const [calDate,                setCalDate]                = useState(initUi.calDate);
  const [calSelDate,             setCalSelDate]             = useState(initUi.calSelDate);
  const [homeDate,               setHomeDate]               = useState(initUi.homeDate);
  const [rewardDate,             setRewardDate]             = useState(TODAY);
  const [showAddAcModal,         setShowAddAcModal]         = useState(initUi.showAddAcModal);
  const [showDetailModal,        setShowDetailModal]        = useState(initUi.showDetailModal);
  const [showAbsModal,           setShowAbsModal]           = useState(initUi.showAbsModal);
  const [newAbs,                 setNewAbs]                 = useState(initUi.newAbs);
  const [toast,                  setToast]                  = useState(initUi.toast);

  /* 베이커리 미출시 동안엔 저장값이 'cute'여도 탐험으로 표시한다.
     저장값은 건드리지 않으므로 BAKERY_ENABLED를 켜면 그대로 복귀한다. */
  const kidSkin = !BAKERY_ENABLED ? DEFAULT_SKIN
    : (skinByChild[childId] && SKINS[skinByChild[childId]]) ? skinByChild[childId] : DEFAULT_SKIN;
  // 현재 아이의 스킨을 바꾸는 헬퍼 (모드 선택 시 사용)
  const setKidSkin = (skin)=> setSkinByChild(prev=>({...prev,[childId]:skin}));

  // 설치 정보: 첫 실행 시점·창립 사용자 여부 (향후 유료 전환 시 "이 날짜 이전 = 평생 무료" 분기용)
  // 결제(프리미엄) 상태: 인앱결제 성공 시 true 로 저장. 결제 연동 전까지는 항상 false.

  // 모달

  // 아이 관리 모달

  // 방학 데이터: { "childId-academyId": [{id, start, end}] }

  // 로드
  // ── 캐릭터 일러스트 프리로드 ──
  //  base64 이미지는 첫 렌더 때 디코딩되며 메인 스레드를 잡아 화면 일부가 늦게 뜬다.
  //  마운트 직후 백그라운드에서 미리 디코딩해두면 무대가 뜰 때 즉시 표시된다.
  useEffect(()=>{
    let cancelled=false;
    const urls=[];
    [ADV_CHAR_IMG,BAKERY_CHAR_IMG].forEach(set=>{
      ["boy","girl"].forEach(g=>{
        for(let s=1;s<=5;s++){ const u=set?.[g]?.[s]; if(u) urls.push(u); }
      });
    });
    // 탐험 모드 무대 기본 배경(초원 등)도 프리로드 — 첫 진입 시 배경이 늦게 뜨는 것 방지
    ADV_STAGE_BG_ALL.forEach(u=>{ if(u) urls.push(u); });
    // requestIdleCallback 이 있으면 유휴 시간에, 없으면 다음 프레임에 순차 디코딩
    const run=()=>{
      urls.forEach(u=>{
        if(cancelled) return;
        const im=new Image();
        im.decoding="async";
        im.src=u;
        if(im.decode) im.decode().catch(()=>{});
      });
    };
    const ric=(typeof window!=="undefined"&&window.requestIdleCallback)
      ? window.requestIdleCallback(run,{timeout:1200})
      : setTimeout(run,60);
    return ()=>{
      cancelled=true;
      if(typeof window!=="undefined"&&window.cancelIdleCallback&&typeof ric==="number") window.cancelIdleCallback(ric);
      else clearTimeout(ric);
    };
  },[]);

  useEffect(()=>{
    (async()=>{
      const ch=await load("v6_children"), ac=await load("v6_ac"), ab=await load("v6_abs"),
            p=await load("v6_paid"), dm=await load("v6_dm"), dd=await load("v6_daily"),
            bsk=await load("v6_base_seeded"),
            petD=await load("v6_pet"), discD=await load(DISCOVERY_KEY),
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
      let ownedDec=await load("v6_owned_decor");
      let equipDec=await load("v6_equipped_decor");
      const decPrices=await load("v6_decor_prices");
      // ── 꾸미기 아바타 데이터 로드 (v2 키. 없으면 빈 값→기본값 폴백) ──
      const avOwned=await load(AVATAR_OWNED_KEY);
      const avEquip=await load(AVATAR_EQUIPPED_KEY);
      // ── v1→v2 마이그레이션 (1회, 읽기 폴백) ──
      //  v2 데이터가 아직 없고 구 키(v6_avatar_owned)에 기록이 있으면:
      //   · v2 카탈로그에도 있는 아이템(배경 3종) → 보유 그대로 이전
      //   · 없어진 구 아이템 → 구매가만큼 코인 환불 (아래 score 반영부에서 처리)
      //  구 키는 읽기만 하고 절대 수정·삭제하지 않는다. (CLAUDE.md 준수)
      let avOwnedMerged=avOwned, avRefunds=null;
      if(!avOwned){
        const legacyOwned=await load(LEGACY_AVATAR_OWNED_KEY);
        if(legacyOwned && typeof legacyOwned==="object"){
          avOwnedMerged={}; avRefunds={};
          for(const lcid of Object.keys(legacyOwned)){
            const mig=computeAvatarMigration(legacyOwned[lcid]);
            avOwnedMerged[lcid]=mig.carryOwned;
            if(mig.refund>0) avRefunds[lcid]=mig.refund;
          }
        }
      }
      // ── 은퇴(판매 중단) 아이템 정리: 보유 제거 + 구매가 환불 (멱등: 정리 저장 후엔 재실행 안 됨) ──
      //  카탈로그에서 뺀 아이템을 이미 구매한 아이가 코인을 잃지 않도록 보호한다.
      //  환불은 아래 기존 avRefunds 반영부(꾸미기 상점 개편 환불)를 그대로 재사용한다.
      const RETIRED_AVATAR_ITEMS={ shoes_boots_desert:140, shoes_boots_ribbon:150, background_forest:120, background_galaxy:300 }; // { 은퇴 아이템 id: 환불 코인 } (배경은 아바타 꾸미기에서 제거됨 — 구 꾸미기 상점 배경과 중복. background_sky는 무료라 환불 없이 normalize에서 정리)
      if(avOwnedMerged && typeof avOwnedMerged==="object"){
        let retiredTouched=false;
        const cleanedOwned={};
        for(const ocid of Object.keys(avOwnedMerged)){
          const list=Array.isArray(avOwnedMerged[ocid])?avOwnedMerged[ocid]:[];
          cleanedOwned[ocid]=list.filter(iid=>{
            const refundAmt=RETIRED_AVATAR_ITEMS[iid];
            if(refundAmt!==undefined){
              avRefunds=avRefunds||{};
              avRefunds[ocid]=(avRefunds[ocid]||0)+refundAmt;
              retiredTouched=true;
              return false;
            }
            return true;
          });
        }
        if(retiredTouched){
          avOwnedMerged=cleanedOwned;
          save(AVATAR_OWNED_KEY,cleanedOwned); // 즉시 저장 → 다음 실행에서 중복 환불 방지
        }
      }
      const avMode=await load(CHAR_DISPLAY_MODE_KEY);
      const savedSkinMap=await load("v6_kid_skin_map"); // 아이별 스킨 맵 (신규)
      const savedSkin=await load("v6_kid_skin");         // 단일 스킨 (구버전, 마이그레이션용)
      // ── 구 '꾸미기 상점'의 장비/모자(hat) 카테고리 제거: 보유 기록 삭제 + 코인 환불 ──
      //  신규 '아바타 꾸미기'와 중복되어 이 상점에서 뺐으므로, 이미 구매한 아이의 코인을 돌려준다.
      //  가격은 아이 스킨(탐험/베이커리)·부모 오버라이드(decPrices)를 반영해 산정.
      //  멱등: 보유목록에서 hat 아이템을 지우고 즉시 저장하므로 다음 실행에선 환불 대상이 없다.
      //  (avRefunds 반영부에서 코인+내역 처리 — RETIRED_AVATAR_ITEMS 방식과 동일)
      {
        const hatItems=(DECOR_GROUPS.find(g=>g.key==="hat")?.items)||[];
        const hatIdSet=new Set(hatItems.map(h=>h.id));
        const hatPriceFor=(id,skin)=>{
          const ov=decPrices?.[id];
          if(ov===0||ov>0) return Number(ov);                 // 부모 오버라이드 우선
          const base=hatItems.find(h=>h.id===id);
          if(!base) return 0;
          return skin==="cute" ? (BAKERY_HAT_PRICE[id]??base.price) : base.price;
        };
        if(ownedDec && typeof ownedDec==="object"){
          let hatTouched=false;
          const cleanedOwnedDec={};
          for(const dcid of Object.keys(ownedDec)){
            const list=Array.isArray(ownedDec[dcid])?ownedDec[dcid]:[];
            const skin=(savedSkinMap&&savedSkinMap[dcid])||savedSkin||DEFAULT_SKIN;
            const kept=[]; let refund=0;
            for(const id of list){
              if(hatIdSet.has(id)){ refund+=hatPriceFor(id,skin); hatTouched=true; }
              else kept.push(id);
            }
            cleanedOwnedDec[dcid]=kept;
            if(refund>0){ avRefunds=avRefunds||{}; avRefunds[dcid]=(avRefunds[dcid]||0)+refund; }
          }
          if(hatTouched){
            ownedDec=cleanedOwnedDec;
            save("v6_owned_decor",cleanedOwnedDec);           // 즉시 저장 → 중복 환불 방지
            if(equipDec && typeof equipDec==="object"){        // 장착된 hat 슬롯도 정리
              const cleanedEqDec={};
              for(const ecid of Object.keys(equipDec)){
                const m=(equipDec[ecid]&&typeof equipDec[ecid]==="object")?{...equipDec[ecid]}:{};
                if("hat" in m) delete m.hat;
                cleanedEqDec[ecid]=m;
              }
              equipDec=cleanedEqDec;
              save("v6_equipped_decor",cleanedEqDec);
            }
          }
        }
      }
      const sampleSeeded=await load("v6_sample_seeded");
      // ── 설치 정보 기록: 한 번도 기록된 적 없으면 최초 1회 저장 (향후 유료 전환 분기용) ──
      // installDate = 첫 실행일, isFoundingUser = 초기(무료 시작) 사용자 표식
      let inst=await load("v6_install_info");
      if(!inst || !inst.installDate){
        inst={ installDate:new Date().toISOString(), isFoundingUser:true };
        save("v6_install_info",inst); // 한 번 심으면 갱신·삭제 안 함
      }
      setInstallInfo(inst);
      // 신규 사용자(설치 24시간 이내)는 등록 학원 목록을 펼친 상태로 시작 (첫 안내 강화).
      // 24시간이 지나면 접힌 기본값(false) 유지. 이후 사용자가 직접 토글하면 그 선택을 따른다.
      {
        const hrs=(Date.now() - new Date(inst.installDate).getTime())/3600000;
        if(hrs>=0 && hrs<24) setShowHomeAcademyList(true);
      }
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
      if(discD) setDiscoveryData(discD);
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
      const recQ=await load("v6_recovery_q");
      if(recQ) setRecoveryQuestion(recQ);
      const recA=await load("v6_recovery_a");
      if(recA) setRecoveryAnswer(recA);
      const lastBk=await load("v6_last_backup_date");
      if(lastBk) setLastBackupDate(lastBk);
      const lastNd=await load("v6_last_nudge_date");
      if(lastNd) setLastNudgeDate(lastNd);
      // ── 아바타 개편 환불 반영 (마이그레이션과 함께 1회만 실행됨) ──
      let scoreFinal=score;
      if(avRefunds && Object.keys(avRefunds).length){
        scoreFinal={...(score||{})};
        for(const rcid of Object.keys(avRefunds)){
          const cur=scoreFinal[rcid]||{xp:0,coin:0,history:[]};
          const amt=avRefunds[rcid];
          scoreFinal[rcid]={...cur,
            coin:Math.max(0,Number(cur.coin??cur.balance??cur.total??0)+amt),
            history:[...(cur.history||[]),{id:Date.now(),point:0,xp:0,coin:amt,date:TODAY,type:"avatar_refund",memo:`꾸미기 상점 개편 코인 환불 +${amt}`}]
          };
        }
        save("v6_score",scoreFinal); // 즉시 저장 (v2 키 생성 후엔 재실행 안 됨)
      }
      if(scoreFinal) setScoreData(scoreFinal);
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
      // ── 꾸미기 아바타 주입: 아이별로 normalize(손상·구버전 방어) ──
      {
        const rawOwned = (avOwnedMerged && typeof avOwnedMerged==="object") ? avOwnedMerged : {};
        const rawEquip = (avEquip && typeof avEquip==="object") ? avEquip : {};
        const rawMode  = (avMode  && typeof avMode ==="object") ? avMode  : {};
        const nextOwnedMap={}, nextEquipMap={}, nextModeMap={};
        const cids=new Set([
          ...Object.keys(rawOwned), ...Object.keys(rawEquip), ...Object.keys(rawMode),
        ]);
        for(const cid of cids){
          const o=normalizeOwned(rawOwned[cid]);
          nextOwnedMap[cid]=o;
          nextEquipMap[cid]=normalizeEquipped(rawEquip[cid], o);
          nextModeMap[cid]=(rawMode[cid]===CHAR_DISPLAY_AVATAR||rawMode[cid]===CHAR_DISPLAY_GROWTH)
            ? rawMode[cid] : DEFAULT_CHAR_DISPLAY_MODE;
        }
        setAvatarOwned(nextOwnedMap);
        setAvatarEquipped(nextEquipMap);
        setCharDisplayMode(nextModeMap);
      }
      const tipSeen=await load("v6_first_mission_tip_seen");
      if(tipSeen) setFirstTipSeen(true);
      const pinHint=await load("v6_pin_hint_seen");
      if(pinHint) setPinHintSeen(true);
      const prGuideSeen=await load("v6_parent_reward_guide_seen");
      if(prGuideSeen) setParentRewardGuideSeen(true);
      const pWelcomeSeen=await load("v6_parent_welcome_seen");
      if(pWelcomeSeen) setParentWelcomeSeen(true);
      const rAge=await load("v6_reward_age_group");
      if(rAge) setRewardAgeGroup(rAge);
      setLoaded(true);
    })();
  },[]);

  useEffect(()=>{ if(loaded) save("v6_children",children); },[children,loaded]);
  // 안전장치: 아이모드에 있는 동안에는 보상탭 잠금을 항상 유지(어떤 경로로 진입하든 PIN 재요구).
  useEffect(()=>{ if(appMode==="child" && rewardUnlocked) setRewardUnlocked(false); },[appMode,rewardUnlocked]);
  useEffect(()=>{ if(loaded) save("v6_kid_skin_map",skinByChild); },[skinByChild,loaded]);
  useEffect(()=>{ if(loaded) save("v6_ac",academies); },[academies,loaded]);
  useEffect(()=>{ if(loaded) save("v6_abs",absences); },[absences,loaded]);
  useEffect(()=>{ if(loaded) save("v6_paid",paidStatus); },[paidStatus,loaded]);
  useEffect(()=>{ if(loaded) save("v6_dm",dayMemos); },[dayMemos,loaded]);
  useEffect(()=>{ if(loaded) save("v6_daily",dailyData); },[dailyData,loaded]);
  useEffect(()=>{ if(loaded) save("v6_base_seeded",baseSeededKeys); },[baseSeededKeys,loaded]);
  useEffect(()=>{ if(loaded) save("v6_pet",petData); },[petData,loaded]);
  useEffect(()=>{ if(loaded) save(DISCOVERY_KEY,discoveryData); },[discoveryData,loaded]);
  /* 오늘의 발견 — 하루 1개. [사용자 확정] 미션과 무관하다.
     지도 위 아이가 '이전 학원을 마치고 이동하며 발견 지점을 지나간 순간'
     (AdventureMap의 시간 기준 판정 → onSparkPass) 기록한다.
     · 무엇이 나올지는 (아이, 날짜) 고정 시드라 다시 그려도 새로고침해도 안 바뀐다.
     · 이미 그날 기록이 있으면 아무것도 안 한다 (하루 1개 가드). */
  const handleSparkPass=(d)=>{
    if(!loaded||!childId) return;
    if(getDiscoveryOn(discoveryData,childId,d)) return;
    const {isNew,next}=recordDiscovery(discoveryData,childId,d);
    if(isNew) setDiscoveryData(next);
    /* 펫 연결 발견의 "먹이 +1" 연출은 지도 발견 지점 위에서 나온다 (사용자 확정 —
       펫이 화면에 안 보일 때가 많아서. AdventureMap의 spark.gain). 펫 말풍선 ❤️는 유지. */
  };
  useEffect(()=>{ if(loaded) save("v6_tmpl",templates); },[templates,loaded]);
  useEffect(()=>{ if(loaded) save("v6_cid",childId); },[childId,loaded]);
  useEffect(()=>{ if(loaded) save("v6_vac",vacations); },[vacations,loaded]);
  useEffect(()=>{ if(loaded) save("v6_parent_pin",parentPin); },[parentPin,loaded]);
  useEffect(()=>{ if(loaded) save("v6_recovery_q",recoveryQuestion); },[recoveryQuestion,loaded]);
  useEffect(()=>{ if(loaded) save("v6_recovery_a",recoveryAnswer); },[recoveryAnswer,loaded]);

  // ── 백업 권유(넛지) 로직 ──
  // 규칙:
  //  · 백업 이력 있음 → 마지막 백업일 + 30일 경과 후, 그 이후 첫 진입에 권유
  //  · 백업 이력 없음 → 설치일 기준. 첫 안내는 15일째 이후 첫 진입(신규 잔소리 방지),
  //    안내한 뒤에도 백업 안 하면 마지막 안내일 + 30일 경과 후 첫 진입에 다시 안내
  //  · "정확히 N일째"가 아니라 "기준일 + 주기가 지났는지"로 판정하므로 그날을 놓쳐도 다음 진입에 뜸
  const BACKUP_NUDGE_DAYS = 30;       // 권유 주기
  const BACKUP_NUDGE_FIRST_DAYS = 15; // 신규(백업 이력 없음) 첫 안내 시점
  // 기준일로부터 경과 일수 계산 (날짜 없으면 null)
  const daysSince = (dateStr)=>{
    if(!dateStr) return null;
    const diff = Math.floor((new Date(TODAY) - new Date(dateStr)) / 86400000);
    return diff < 0 ? 0 : diff;
  };
  const daysSinceBackup  = daysSince(lastBackupDate);
  const daysSinceInstall = daysSince(installInfo?.installDate);
  const daysSinceNudge   = daysSince(lastNudgeDate);
  // 설치 시각으로부터 경과 시간(시간 단위). 신규 사용자 샘플 학원 버튼의 24시간 노출 판정용.
  // daysSinceInstall(날짜 기준)과 달리 설치한 '시각'부터 정확히 24시간을 본다.
  const hoursSinceInstall = (()=>{
    if(!installInfo?.installDate) return null;
    const diff = (Date.now() - new Date(installInfo.installDate).getTime()) / 3600000;
    return diff < 0 ? 0 : diff;
  })();
  // 엄마모드로 들어올 때 1회: 규칙에 맞으면 권유 모달 표시
  useEffect(()=>{
    if(!loaded) return;
    if(appMode!=="parent"){ setBackupNudgeChecked(false); return; } // 엄마모드 벗어나면 다음 진입 때 다시 체크 가능
    if(backupNudgeChecked) return; // 이번 진입에서 이미 체크함
    setBackupNudgeChecked(true);
    let needNudge = false;
    if(lastBackupDate!==null){
      // 백업한 적 있음 → 마지막 백업일 + 30일 경과 후 첫 진입
      needNudge = daysSinceBackup!==null && daysSinceBackup>=BACKUP_NUDGE_DAYS;
    } else if(daysSinceInstall!==null){
      // 백업한 적 없음
      if(lastNudgeDate===null){
        // 아직 한 번도 안내 안 함 → 설치 15일 경과 후 첫 진입
        needNudge = daysSinceInstall>=BACKUP_NUDGE_FIRST_DAYS;
      } else {
        // 이미 안내한 적 있음 → 마지막 안내일 + 30일 경과 후 첫 진입
        needNudge = daysSinceNudge!==null && daysSinceNudge>=BACKUP_NUDGE_DAYS;
      }
    }
    if(needNudge){
      setLastNudgeDate(TODAY);
      save("v6_last_nudge_date",TODAY); // 안내일 기록 → 다음 주기 계산 기준
      setTimeout(()=>setShowBackupNudge(true), 700);
    }
  },[appMode,loaded,backupNudgeChecked,lastBackupDate,daysSinceBackup,daysSinceInstall,lastNudgeDate,daysSinceNudge]);
  // 엄마모드 비번 안내를 본 것으로 기록 (다음부터 숨김)
  const markPinHintSeen=()=>{
    if(!pinHintSeen){ setPinHintSeen(true); save("v6_pin_hint_seen","1"); }
  };
  useEffect(()=>{ if(loaded) save("v6_score",scoreData); },[scoreData,loaded]);
  // ── 꾸미기 아바타 자동저장 (신규 키) ──
  useEffect(()=>{ if(loaded) save(AVATAR_OWNED_KEY,avatarOwned); },[avatarOwned,loaded]);
  useEffect(()=>{ if(loaded) save(AVATAR_EQUIPPED_KEY,avatarEquipped); },[avatarEquipped,loaded]);
  useEffect(()=>{ if(loaded) save(CHAR_DISPLAY_MODE_KEY,charDisplayMode); },[charDisplayMode,loaded]);
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

  const showToast=(msg="저장됨 ✓",ms=1600)=>{ setToast(msg); setTimeout(()=>setToast(""),ms); };

  // 온보딩 완료: 입력값을 실제 데이터에 반영 → 홈 진입 → 코치마크
  const finishOnboarding=(data)=>{
    // data = { childName, gender, acName, acDays:[], acTime, homework, todo }
    const cid="child_1";
    setChildren([{ id:cid, name:(data.childName||"우리 아이").trim(), gender:data.gender||"boy" }]);
    setChildId(cid);

    // 연령대에 맞는 보상 세트 적용 (kid|elem|teen)
    const ageRewards=getRewardsByAge(data.age);
    setRewardData({ shared:ageRewards });
    setRewardAgeGroup(data.age||"kid");
    save("v6_reward_age_group",data.age||"kid");

    let acId=null;
    if(data.acName && data.acName.trim()){
      acId="ac_"+Date.now();
      const newAcademy={ ...EMPTY_AC, id:acId, name:data.acName.trim(),
        days:(data.acDays&&data.acDays.length)?data.acDays:[], time:data.acTime||"16:00", duration:40,
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
  // 미션 완료 효과음 — 음원 파일 없이 Web Audio로 생성 (베이커리: 말랑 팝 / 탐험: 코인 획득)
  const audioCtxRef=useRef(null);
  const playCompleteSound=()=>{
    try{
      if(!audioCtxRef.current) audioCtxRef.current=new (window.AudioContext||window.webkitAudioContext)();
      const c=audioCtxRef.current;
      if(c.state==="suspended") c.resume();
      const tone=({freq,start,dur,type="sine",gain=0.22,slideTo=null})=>{
        const o=c.createOscillator(), g=c.createGain();
        o.type=type; o.frequency.setValueAtTime(freq, c.currentTime+start);
        if(slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime+start+dur);
        g.gain.setValueAtTime(0.0001, c.currentTime+start);
        g.gain.exponentialRampToValueAtTime(gain, c.currentTime+start+0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime+start+dur);
        o.connect(g); g.connect(c.destination);
        o.start(c.currentTime+start); o.stop(c.currentTime+start+dur+0.05);
      };
      if(kidSkin==="cute"){ // 베이커리: 말랑 팝
        tone({freq:520,start:0,dur:0.16,type:"sine",gain:0.28,slideTo:920});
        tone({freq:1200,start:0.13,dur:0.2,type:"sine",gain:0.16});
      } else {             // 탐험: 코인 획득
        tone({freq:988,start:0,dur:0.09,type:"square",gain:0.16});
        tone({freq:1318,start:0.08,dur:0.28,type:"square",gain:0.16});
      }
    }catch(e){/* 오디오 미지원 환경은 조용히 무시 */}
  };
  const cheerCharacter=(xp=DEFAULT_HOMEWORK_SCORE)=>{
    const msg=CHEER_MSGS[Math.floor(Math.random()*CHEER_MSGS.length)];
    setCharCheer({msg,xp,key:Date.now()});
    setTimeout(()=>setCharCheer(null),1300);
  };

  // 보상탭·위험구역 등 보호가 필요한 동작에 PIN을 요구하는 범용 게이트.
  // run: PIN 통과 시 실행할 함수, title: 모달에 표시할 안내 문구
  const askPin=(run,title)=>{ setGatePin(""); setGateAction({run,title}); };
  const submitGatePin=()=>{
    // 개발자 도구: DEV_MODE에서 DEV_PIN 입력 시 보상탭 대신 개발자 도구 진입
    if(DEV_MODE && gatePin===DEV_PIN){
      setGateAction(null); setGatePin("");
      setShowDevTools(true);
      showToast("개발자 도구 열림 🧪");
      return;
    }
    if(gatePin!==parentPin){ showToast("비밀번호가 달라요"); return; }
    markPinHintSeen();
    const act=gateAction;
    setGateAction(null); setGatePin("");
    act?.run?.();
  };

  const addDevXP=(amount)=>{
    if(!DEV_MODE) return;
    addChildScore(childId,amount,`개발자 도구 XP ${amount>=0?"+":""}${amount}`,"dev_xp");
    showToast(`⭐ XP ${amount>=0?"+":""}${amount}`);
  };

  const addDevCoin=(amount)=>{
    if(!DEV_MODE) return;
    setScoreData(prev=>{
      const cur=prev[childId]||{xp:0,coin:0,history:[]};
      return {...prev,[childId]:{...cur,
        coin:Math.max(0,Number(cur.coin??cur.balance??cur.total??0)+amount),
        history:[...(cur.history||[]),{id:Date.now(),point:amount,xp:0,coin:amount,date:TODAY,type:"dev_coin",memo:`개발자 도구 코인 ${amount>=0?"+":""}${amount}`}]
      }};
    });
    showToast(`💎 코인 ${amount>=0?"+":""}${amount}`);
  };

  // ── 개발자: 레벨 직접 설정 (해당 레벨 minScore로 XP 맞춤) ──
  //  · 레벨 상승 시엔 addChildScore로 올려서 레벨업/진화 팝업까지 정상 재현
  //  · 레벨 하락 시엔 팝업 없이 XP만 되돌림 (테스트 반복용)
  const setDevLevel=(targetLevel)=>{
    if(!DEV_MODE) return;
    const lv=DEFAULT_LEVELS.find(l=>l.level===targetLevel);
    if(!lv){ showToast("존재하지 않는 레벨"); return; }
    const curXp=getChildXP(childId);
    const delta=lv.minScore-curXp;
    if(delta===0){ showToast(`이미 Lv.${targetLevel}`); return; }
    if(delta>0){
      // 팝업(레벨업·진화) 재현을 위해 정규 경로로 가산
      addChildScore(childId,delta,`개발자 도구 레벨 → Lv.${targetLevel}`,"dev_level");
      showToast(`⬆️ Lv.${targetLevel} (XP ${lv.minScore})`);
    }else{
      setScoreData(prev=>{
        const cur=prev[childId]||{xp:0,coin:0,history:[]};
        return {...prev,[childId]:{...cur,
          xp:Math.max(0,lv.minScore),
          history:[...(cur.history||[]),{id:Date.now(),point:delta,xp:delta,coin:0,date:TODAY,type:"dev_level",memo:`개발자 도구 레벨 → Lv.${targetLevel}`}]
        }};
      });
      showToast(`⬇️ Lv.${targetLevel} (XP ${lv.minScore})`);
    }
  };

  // ── 개발자: 레벨 ±1 (진화 구간 경계 테스트용) ──
  const stepDevLevel=(dir)=>{
    if(!DEV_MODE) return;
    const curLv=getChildLevel(childId).level;
    const maxLv=Math.max(...DEFAULT_LEVELS.map(l=>l.level));
    const target=Math.min(maxLv,Math.max(1,curLv+dir));
    if(target===curLv){ showToast(dir>0?"이미 최고 레벨":"이미 Lv.1"); return; }
    setDevLevel(target);
  };

  const giveDevBox=(boxType)=>{
    if(!DEV_MODE) return;
    const cur=getChildTreasure(childId);
    const key=boxType==="legend"?"legendBox":boxType==="rare"?"rareBox":"normalBox";
    setTreasureData(prev=>({...prev,[childId]:{...cur,[key]:Number(cur[key]||0)+1}}));
    showToast(boxType==="legend"?"👑 전설상자 +1":boxType==="rare"?"🎁 희귀상자 +1":"📦 일반상자 +1");
  };

  // ── 개발자: 오늘의 발견 · 도감 테스트 ──────────────────────────────────
  /* 보는 날짜(childDate)의 발견을 즉시 기록 — 지도에서 지나간 것과 똑같은 룰(고정 시드) */
  const devDiscoverNow=()=>{
    if(!DEV_MODE) return;
    const d=childDate||TODAY;
    if(getDiscoveryOn(discoveryData,childId,d)){ showToast("이미 이날 발견이 있어요 — 먼저 지우세요"); return; }
    const {next,entry}=recordDiscovery(discoveryData,childId,d);
    setDiscoveryData(next);
    const dd=getDiscovery(entry.id);
    showToast(`${dd.emoji} ${dd.name} 발견!`);
  };
  /* 보는 날짜의 발견을 원하는 것으로 강제 교체 (전설 연출·펫 먹이 연출 테스트용) */
  const devDiscoverAs=(id)=>{
    if(!DEV_MODE) return;
    const d=childDate||TODAY;
    const log=(discoveryData?.[childId]?.log||[]).filter(e=>e.d!==d);
    setDiscoveryData({...discoveryData,[childId]:{...(discoveryData?.[childId]||{}),log:[...log,{d,id}]}});
    const dd=getDiscovery(id);
    showToast(`${dd.emoji} 이날 발견을 '${dd.name}'(으)로 바꿨어요`);
  };
  /* 보는 날짜의 발견 삭제 → ✨ 예고로 돌아가고, 다시 지나가면 재발견 (연출 반복 테스트) */
  const devClearTodayDiscovery=()=>{
    if(!DEV_MODE) return;
    const d=childDate||TODAY;
    const log=(discoveryData?.[childId]?.log||[]).filter(e=>e.d!==d);
    setDiscoveryData({...discoveryData,[childId]:{...(discoveryData?.[childId]||{}),log}});
    showToast("이날 발견을 지웠어요 — 탐험 탭을 다시 열면 재발견돼요");
  };
  /* 지난 n일 발견 기록 심기 — 실제 룰과 같은 고정 시드라 날짜별 결과도 실제와 동일 */
  const devFillDiscoveryDays=(n)=>{
    if(!DEV_MODE) return;
    let data=discoveryData;
    for(let i=1;i<=n;i++){
      const ds=addDays(TODAY,-i);
      if(getDiscoveryOn(data,childId,ds)) continue;
      data=recordDiscovery(data,childId,ds).next;
    }
    setDiscoveryData(data);
    showToast(`지난 ${n}일 발견 기록을 심었어요`);
  };
  /* 도감 전 종류(59종) 채우기 — 종류마다 과거 날짜 하나씩 (완성 도장·진행바 테스트) */
  const devFillDiscoveryAll=()=>{
    if(!DEV_MODE) return;
    const log=DISCOVERIES.map((it,i)=>({d:addDays(TODAY,-(DISCOVERIES.length-i)),id:it.id}));
    setDiscoveryData({...discoveryData,[childId]:{...(discoveryData?.[childId]||{}),log}});
    showToast(`도감 ${DISCOVERIES.length}종을 모두 채웠어요`);
  };
  /* 현재 아이 도감 통째로 초기화 */
  const devResetDiscovery=()=>{
    if(!DEV_MODE) return;
    setDiscoveryData({...discoveryData,[childId]:{log:[]}});
    showToast("도감을 초기화했어요");
  };

  // ── 개발자: 연속 달성 N일 생성 (과거 N일치 미션을 전부 완료 처리 + 더미 보장) ──
  const setDevStreak=(days)=>{
    if(!DEV_MODE) return;
    const acList=getChildAcademies(childId);
    if(acList.length===0){ showToast("학원을 먼저 1개 등록하세요"); return; }
    const acId=acList[0].id;
    const base=Date.now();
    setDailyData(prev=>{
      const next={...prev};
      for(let i=0;i<days;i++){
        const d=addDays(TODAY,-i);
        // 그 날짜의 모든 학원 엔트리를 완료 처리(미완료가 하나라도 있으면 streak이 끊기므로)
        Object.keys(next).forEach(k=>{
          if(k.startsWith(`${childId}-`)&&k.endsWith(`-${d}`)){
            const e=next[k];
            next[k]={...e,
              homeworks:(e.homeworks||[]).map(h=>({...h,done:true,failed:false})),
              todos:(e.todos||[]).map(t=>({...t,done:true,failed:false})),
            };
          }
        });
        // 더미 1개 보장(그 날 미션이 아예 없던 경우 대비)
        const key=`${childId}-${acId}-${d}`;
        const ex=next[key]||{homeworks:[],todos:[],supplies:[]};
        next[key]={...ex,
          homeworks:(ex.homeworks||[]).map(h=>({...h,done:true,failed:false})),
          todos:[...(ex.todos||[]).map(t=>({...t,done:true,failed:false})),{id:base+i,text:`[테스트] 연속달성 ${i+1}`,done:true,point:DEFAULT_HOMEWORK_SCORE}],
        };
      }
      return next;
    });
    showToast(`🔥 연속 달성 ${days}일 생성`);
  };

  // ── 개발자: 최고기록만 직접 설정 ──
  const setDevBestStreak=(days)=>{
    if(!DEV_MODE) return;
    setBestStreakData(prev=>({...prev,[childId]:days}));
    showToast(`🏆 최고기록 ${days}일 설정`);
  };

  // ── 개발자: 연속 달성 진단 ──
  const diagnoseStreak=()=>{
    if(!DEV_MODE) return;
    const acList=getChildAcademies(childId);
    const acId=acList[0]?.id;
    const todayKey=`${childId}-${acId}-${TODAY}`;
    const todayEntry=dailyData[todayKey];
    const todayItems=getQuestItemsForDate(childId,TODAY);
    const success=isQuestSuccessDay(childId,TODAY);
    const streak=getQuestStreak(childId);
    const msg=[
      `학원ID: ${acId||"없음"}`,
      `오늘키 존재: ${todayEntry?"O":"X"}`,
      `오늘 todos: ${(todayEntry?.todos||[]).length}개`,
      `오늘 미션항목: ${todayItems.length}개`,
      `오늘 성공판정: ${success?"O":"X"}`,
      `연속: ${streak}일`,
    ].join(" / ");
    console.log("[연속진단]",{todayKey,todayEntry,todayItems,success,streak,dailyKeys:Object.keys(dailyData)});
    showToast(msg,5000);
  };

  const loadSampleData=()=>{
    if(!DEV_MODE) return;
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

  // 신규 사용자용: 설치 첫날 학원 등록 화면에서 샘플 학원 1개 채우기 (DEV_MODE 무관)
  // loadSampleData와 동일한 데이터를 쓰지만 출시 빌드에서도 동작하도록 게이트 없음
  const addStarterAcademy=()=>{
    const cid=childId;
    const existingAcs=academies[cid]||[];
    const seq=existingAcs.filter(a=>/\(예시\)$/.test(a.name)).length+1;
    const sample=buildSampleData(seq,cid);
    const newAc=sample.academies[cid][0];
    setChildren(prev=>prev.some(c=>c.id===cid)?prev:[...prev,...sample.children]);
    setAcademies(prev=>({...prev,[cid]:[...(prev[cid]||[]),newAc]}));
    setDailyData(prev=>({...prev,...sample.dailyData}));
    const curName=(children.find(c=>c.id===cid)||{}).name||"";
    showToast(`🌱 ${curName?curName+" — ":""}샘플 학원이 추가됐어요! (${newAc.name})`);
  };

  const generateTestData=(cid)=>{
    if(!DEV_MODE) return;
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
    if(!DEV_MODE) return;
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
    if(!DEV_MODE) return;
    const allDefaultIds=DEFAULT_TITLES.map(t=>t.id);
    const allLegendaryIds=LEGENDARY_TITLES.map(t=>t.id);
    const allTitleIds=[...allDefaultIds,...allLegendaryIds];
    setSpecialTitles(prev=>({...prev,[cid]:allTitleIds}));
    setSeenTitles(prev=>({...prev,[cid]:allTitleIds}));
    setEarnedTitleIds(prev=>({...prev,[cid]:allTitleIds}));
    showToast("👑 모든 상장 받기");
  };

  const showDevEvent=(type)=>{
    if(!DEV_MODE) return;
    if(type==="level"){ showGameEvent({type:"level",emoji:"🎉",title:"레벨업!",name:"Lv.10 탐험 대장",desc:"레벨업 팝업 테스트",reward:"🎁 보너스\n⭐ +100 XP · 💎 +100 코인"}); return; }
    if(type==="title"){ showGameEvent({type:"title",cert:true,emoji:"👑",title:"상장을 받았어요!",name:"황금 테스트러",desc:"임무를 50개나 끝까지 해낸 멋진 탐험가에게 이 상장을 드립니다",rarity:"epic",reward:"⭐ +100 XP · 💎 +100 코인"}); return; }
    if(type==="box"){ showGameEvent({type:"box",emoji:"📦",title:"보물상자 획득!",name:"일반상자",desc:`미션 ${TREASURE_MILESTONE.normal}개 달성 보상이에요!`,reward:"🎁 보물창고에서 열어보세요"}); return; }
    if(type==="treasure"){ setTreasureModal({emoji:"👑",boxName:"전설상자",rewardCoin:777,titleReward:{id:"dev_title",name:"황금 테스트러",emoji:"👑",rarity:"legendary"},headerGrad:"linear-gradient(135deg,#F59E0B,#FDE68A)"}); return; }
  };

  // ── 개발자: 미션 10개 / 숙제 10개 일괄 추가 ──
  const addDevQuests=(cid,count=10)=>{
    if(!DEV_MODE) return;
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
    if(!DEV_MODE) return;
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

  // 보상 연령대 변경: 선택한 연령대 세트로 보상 목록을 전체 교체(기존 커스텀 보상은 사라짐)
  // age가 'custom'이면 목록을 비워 엄마가 직접 만들도록 함
  // 버튼 클릭 → 같은 연령대면 무시, 아니면 확인 모달 띄움 (window.confirm은 미리보기에서 차단되므로 인앱 모달 사용)
  const changeRewardAge=(age)=>{
    if(age===rewardAgeGroup){ showToast(age==="custom"?"이미 '나만의 목록'이에요":`이미 '${REWARD_SETS_BY_AGE[age]?.label}' 보상이에요`); return; }
    setPendingAgeChange(age);
  };
  // 확인 모달에서 '변경'을 누르면 실제 적용
  const applyAgeChange=(age)=>{
    if(age==="custom"){
      setRewardData({ shared:[] });
      setRewardAgeGroup("custom");
      save("v6_reward_age_group","custom");
      showToast("✏️ 나만의 목록으로 비웠어요");
    } else {
      const set=REWARD_SETS_BY_AGE[age];
      if(set){
        setRewardData({ shared:set.rewards.map(r=>({...r})) });
        setRewardAgeGroup(age);
        save("v6_reward_age_group",age);
        showToast(`${set.emoji} ${set.label} 보상으로 변경됐어요`);
      }
    }
    setPendingAgeChange(null);
  };

  const resetGameData=(cid)=>{
    const nm=(children.find(c=>c.id===cid)?.name)||"이 아이";
    // 재확인 대신 PIN 입력으로 보호. PIN 통과 시에만 실제 초기화 진행.
    askPin(()=>{
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
    // 꾸미기 구매내역(보유)·장착·스킨까지 싹 초기화
    setOwnedDecor(prev=>({...prev,[cid]:[]}));
    setEquippedDecor(prev=>({...prev,[cid]:{}}));
    setSkinByChild(prev=>({...prev,[cid]:undefined}));
    // 연속기록·마지막 레벨 기록도 초기화
    setBestStreakData(prev=>({...prev,[cid]:0}));
    setLastLevelByChild(prev=>({...prev,[cid]:undefined}));
    setAvatarOwned(prev=>({...prev,[cid]:normalizeOwned([])}));
    setAvatarEquipped(prev=>({...prev,[cid]:getDefaultEquipped()}));
    setCharDisplayMode(prev=>({...prev,[cid]:DEFAULT_CHAR_DISPLAY_MODE}));
    showToast("게임 데이터 초기화 완료");
    }, `🧹 ${nm} 데이터 초기화`);
  };

  const resetAllAppData=()=>{
    askPin(()=>{
    clearAllStorage();
    setChildren(DEFAULT_CHILDREN); setChildId("child_1");
    setAcademies({}); setAbsences({}); setPaidStatus({}); setDayMemos({});
    setDailyData({}); setScoreData({}); setRewardData({}); setRewardRequests({});
    setBaseSeededKeys({});
    setPetData({});
    setSkinByChild({});
    setOwnedDecor({}); setEquippedDecor({}); setDecorPrices({});
    setAvatarOwned({}); setAvatarEquipped({}); setCharDisplayMode({}); setShowEquipShop(false);
    setUnlockedBadgeIds([]); setLastLevelByChild({});
    setSelectedTitles({}); setTreasureData({}); setSeenTitles({});
    setEarnedTitleIds({});
    setSpecialTitles({}); setBestStreakData({}); setVacations({});
    setTemplates(SAMPLE_TMPL); setParentPin("1234");
    setLastBackupDate(null); setLastNudgeDate(null); // 백업·안내 기록도 초기화
    setShowDevTools(false); setShowSettingsModal(false); setAppMode("child"); setRewardUnlocked(false);
    showToast("앱 전체가 초기화되었어요 🔄");
    }, "💣 앱 전체 초기화");
  };

  const exitParentMode=()=>{
    setAppMode("child"); setPinInput(""); setRewardUnlocked(false);
    showToast("아이용으로 전환됨 🎒");
    // 아이모드 첫 진입 흐름: 모드선택 먼저 → (모드 고르면) 코치마크를 그 모드에 맞춰 노출.
    // 가이드는 봤지만 모드를 아직 안 골랐으면 모드선택만 띄운다.
    const skinPicked=!!skinByChild[childId];   // 현재 아이가 모드를 골랐는지 (동기 판단)
    /* 베이커리 미출시 동안엔 모드 선택을 건너뛰고 탐험으로 바로 시작한다.
       스킨을 자동 저장하지 않는다 — 나중에 베이커리가 열리면 그때 선택 화면이 뜨도록. */
    if(BAKERY_ENABLED && !skinPicked){
      setShowModeSelect(true);                 // 즉시 모드선택 노출 (탐험 화면 깜빡임 방지)
    } else {
      (async()=>{
        const seen=await load("v6_kid_guide_seen");
        if(!seen) setTimeout(()=>setShowKidCoachmark(true),400);   // 모드는 골랐는데 가이드 미시청(구버전 사용자)
      })();
    }
    // 보물상자 있으면 알림
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
    if(!newPinInput||newPinInput.length!==4){ showToast("새 비밀번호는 숫자 4자리로 해줘"); return; }
    if(newPinInput!==newPinConfirm){ showToast("새 비밀번호 확인이 달라요"); return; }
    // 복구 질문 필수: 기존에 등록된 게 없으면 이번에 반드시 입력해야 함
    const q=newRecoveryQ.trim(), a=newRecoveryA.trim();
    const hasExisting=!!(recoveryQuestion&&recoveryAnswer);
    if(!hasExisting&&(!q||!a)){ showToast("복구 질문과 답을 입력해 주세요"); return; }
    setParentPin(newPinInput);
    if(q&&a){ setRecoveryQuestion(q); setRecoveryAnswer(a); }
    setOldPinInput(""); setNewPinInput(""); setNewPinConfirm("");
    setNewRecoveryQ(""); setNewRecoveryA("");
    setShowPinChangeModal(false);
    showToast("비밀번호가 변경됐어요 🔐");
  };

  // 복구질문 설정/변경 (기타탭 전용 모달)
  const saveRecoverySetup=()=>{
    const q=setupRecoveryQ.trim(), a=setupRecoveryA.trim();
    if(!q){ showToast("복구 질문을 선택해 주세요"); return; }
    if(!a){ showToast("복구 질문의 답을 입력해 주세요"); return; }
    setRecoveryQuestion(q); setRecoveryAnswer(a);
    setSetupRecoveryQ(""); setSetupRecoveryA("");
    setShowRecoverySetupModal(false);
    showToast("복구 질문이 저장됐어요 🔑");
  };

  // 복구 질문 정답 확인 → (PIN 노출 없이) 새 비밀번호 설정 모달로 이동
  const submitRecovery=()=>{
    if(!recoveryQuestion||!recoveryAnswer){
      showToast("등록된 복구 질문이 없어요"); return;
    }
    const inp=recoveryAnswerInput.trim().toLowerCase();
    const ans=recoveryAnswer.trim().toLowerCase();
    if(inp!==ans){ showToast("답이 일치하지 않아요"); return; }
    // 정답 → 기존 PIN은 보여주지 않고 곧장 새 PIN 설정
    setShowRecoveryModal(false);
    setRecoveryAnswerInput("");
    setGateAction(null); setGatePin("");
    setResetNewPin(""); setResetNewPinConfirm("");
    setShowResetPinModal(true);
  };

  // 복구 성공 후 새 비밀번호만 설정 (기존 PIN 불필요)
  const submitResetPin=()=>{
    if(!resetNewPin||resetNewPin.length!==4){ showToast("새 비밀번호는 숫자 4자리로 해줘"); return; }
    if(resetNewPin!==resetNewPinConfirm){ showToast("새 비밀번호 확인이 달라요"); return; }
    setParentPin(resetNewPin);
    setResetNewPin(""); setResetNewPinConfirm("");
    setShowResetPinModal(false);
    showToast("새 비밀번호로 변경됐어요 🔐");
  };

  // ── 결제(프리미엄) 처리 ─────────────────────────────────
  // RevenueCat 등 인앱결제가 성공하면 이 함수를 호출한다. (결제 검증은 결제 SDK가 담당)
  // (선택) 환불·구독해지 등으로 프리미엄을 회수해야 할 때

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
      recoveryQuestion,
      recoveryAnswer,
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

    setLastBackupDate(TODAY);
    save("v6_last_backup_date",TODAY);
    showToast("데이터 백업 완료 💾");
  };

  const importBackup=(file)=>{
    if(!file) return;

    const reader=new FileReader();

    reader.onload=(e)=>{
      try{
        const data=JSON.parse(e.target.result);
        // 백업 파일 형식 최소 검증 (아무 JSON이나 들어오는 것 방지)
        if(!data || typeof data!=="object" || (!data.children && !data.academies && !data.dailyData)){
          showToast("복원 실패: 올바른 백업 파일이 아니에요");
          return;
        }
        // 검증 통과 → 확인 모달 띄움 (실제 적용은 applyRestore에서)
        setPendingRestore(data);
      }catch(err){
        showToast("복원 실패: 백업 파일을 확인해줘");
      }
    };

    reader.readAsText(file);
  };

  // 복원 확인 모달에서 "네"를 눌렀을 때 실제 데이터 적용
  const applyRestore=(data)=>{
    if(!data) return;
    try{
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
        if(data.recoveryQuestion!==undefined) setRecoveryQuestion(data.recoveryQuestion||"");
        if(data.recoveryAnswer!==undefined) setRecoveryAnswer(data.recoveryAnswer||"");

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
      }finally{
        setPendingRestore(null);
      }
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

  // 테마색은 탐험·베이커리 모두 아이가 고른 색을 그대로 쓴다(아이 구분 유지).
  const th = getChildTheme(curChild);
  const _T = getSkin(kidSkin).text;      // 현재 아이모드 스킨의 텍스트 세트(탐험/베이커리)
  // 어린이용(미취학~초1) 연령대는 영문을 못 읽으므로 탐험모드 상태 라벨을 한글로 교체
  const T = (kidSkin!=="cute" && rewardAgeGroup==="kid")
    ? {..._T, clearShort:"완료", ready:"준비", clear:"완료", failed:"실패"}
    : _T;
  const TM = getTerms(kidSkin);          // 현재 아이모드 재화/아이콘 용어(탐험/베이커리)
  const _skin = getSkin(kidSkin);
  const GP = _skin.paletteFn ? _skin.paletteFn(th.main) : _skin.palette;   // 테마색 적용 팔레트(없으면 정적)
  const ST = _skin.stamp || {on:false};  // 완료 도장(베이커리) 설정
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
  // 통일된 젤리 진행바 (베이커리). fallbackFill 로 탐험/기타 색 유지.
  // ── 탐험 카드 '빛나는' 배경/오버레이 (탐험 전용) ───────────
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
  // 밤·숲속 캠프 무대 배경 — 하나로 연결된 풍경(동물의 숲 / 드림라이트 밸리 톤).
  // 구성: 밤하늘+작은 달+별 → 배경 전체에 깔린 둥근 숲 능선 2겹 → 부드러운 지면 → 캠핑 텐트+모닥불 → 캐릭터 발치 바닥빛(이전 대비 50%).
  // 전부 한 SVG 좌표계(0~400 x 0~240)로 그려 요소들이 같은 장면처럼 연결됨. 탐험 전용 / zIndex:0 / 캐릭터·텍스트는 위에 유지.
  const DungeonScenery = ()=>{
    if(kidSkin==="cute") return null;
    // 현재 아이의 성별/진화단계로 배경 선택 (지금은 항상 초원, 확장 시 ADV_STAGE_BG_OF만 수정)
    const _g = (children.find(c=>c.id===childId)?.gender)==="girl" ? "girl" : "boy";
    const _st = ADV_CHAR_STAGE_OF(getChildLevel(childId).level);
    const bgSrc = ADV_STAGE_BG_OF(_g, _st);
    return (
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0,borderRadius:"inherit"}}>
        {/* 낮 초원 배경 이미지 — /assets 경로 참조 (Capacitor public/assets) */}
        <img src={bgSrc} alt="" draggable={false}
          style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 68%"}}/>
        {/* 하단 살짝 어둡게 — 캐릭터 발밑을 지면에 앉히고 하단 알약칩 가독성 확보 */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg, transparent 55%, rgba(30,60,40,0.12) 78%, rgba(20,45,30,0.26) 100%)"}}/>
        {/* 캐릭터 발치 바닥빛 — 떠 보임 방지용으로 아주 은은하게 */}
        <div style={{position:"absolute",bottom:"7%",left:"50%",transform:"translateX(-50%)",width:"52%",height:30,borderRadius:"50%",background:"radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.35), transparent 70%)",opacity:0.4}}/>
      </div>
    );
  };

  // 구매한 '탐험 배경' 6종의 뒷배경 풍경(SVG). 기본 캠프 무대 톤(깊은 남색) 위에 테마별 풍경을 깐다.
  // 떠다니는 이모지(아래 stageBgDeco 렌더)보다 뒤(zIndex:0), 캐릭터·텍스트보다 아래. 풍경은 은은하게(캐릭터가 주인공).
  const AdventureBgScenery = ({bgId})=>{
    const sc = GP.scenery||th.main;
    // 배경별 하늘 그라데이션 + 풍경 inner SVG (탐험=밤 톤 / 베이커리=파스텔 톤)
    const SK = {
      bg_sakura:  ["#16294C","#1C3A63"],
      bg_rainbow: ["#0E2746","#0A3A63"],
      bg_star:    ["#172A4D","#234A6E"],
      bg_jungle:  ["#16314A","#1E4A3C"],
      bg_dino:    ["#241E3A","#3A2A44"],
      bg_cloud:   ["#10173A","#1B1147"],
      // 베이커리(밝은 파스텔)
      bbg_sakura:     ["#FFE9F2","#FFD3E4"],
      bbg_strawberry: ["#FFEDE3","#FFD5CE"],
      bbg_starcandy:  ["#E9E4FF","#CFC3F5"],
      bbg_choco:      ["#F3E2D0","#E6C6A8"],
      bbg_heaven:     ["#EAF2FF","#D6E6FF"],
      bbg_rainbow:    ["#FFF0F7","#FBE3FF"],
    };
    const isBakery = bgId && bgId.startsWith("bbg_");
    if(!isBakery && kidSkin==="cute") return null;   // 탐험 풍경은 탐험 모드만
    const sky = SK[bgId];
    if(!sky) return null; // 정의 안 된 배경은 풍경 없음
    // 베이커리는 파스텔이라 테마색을 거의 안 섞고, 탐험은 8%만 섞음
    const mixF = isBakery ? 0.03 : 0.08;
    const skyTop = mixHex(sky[0], sc, mixF), skyBot = mixHex(sky[1], sc, mixF);
    const scenes = {
      // 🌲 마법 숲 — 안개 낀 침엽수 실루엣 여러 겹 + 초록 글로우
      bg_sakura:(<g>
        <defs>
          <linearGradient id="ab_s_far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#214a3a" stopOpacity=".5"/><stop offset="1" stopColor="#214a3a" stopOpacity="0"/></linearGradient>
          <linearGradient id="ab_s_front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#163826" stopOpacity=".9"/><stop offset="1" stopColor="#163826" stopOpacity=".15"/></linearGradient>
          <radialGradient id="ab_s_glow" cx="50%" cy="30%" r="60%"><stop offset="0" stopColor="#7CFFB0" stopOpacity=".08"/><stop offset="1" stopColor="#7CFFB0" stopOpacity="0"/></radialGradient>
        </defs>
        <rect width="400" height="240" fill="url(#ab_s_glow)"/>
        <g fill="url(#ab_s_far)">
          <path d="M40,150 l22,80 l-44,0 Z M40,180 l26,55 l-52,0 Z"/>
          <path d="M120,140 l24,90 l-48,0 Z M120,175 l28,60 l-56,0 Z"/>
          <path d="M300,148 l22,82 l-44,0 Z M300,180 l26,55 l-52,0 Z"/>
          <path d="M370,142 l24,88 l-48,0 Z"/>
        </g>
        <g fill="url(#ab_s_front)">
          <path d="M0,170 l30,70 l-60,0 Z M0,200 l34,40 l-68,0 Z"/>
          <path d="M210,160 l30,80 l-60,0 Z M210,195 l34,45 l-68,0 Z"/>
          <path d="M400,165 l30,75 l-60,0 Z"/>
        </g>
        <path d="M0,205 Q200,193 400,202 L400,240 L0,240 Z" fill="#13422c" opacity=".55"/>
      </g>),
      // 🌊 깊은 바다 — 빛줄기 + 해저 + 해초/산호
      bg_rainbow:(<g>
        <defs>
          <radialGradient id="ab_o_ray" cx="50%" cy="-10%" r="90%"><stop offset="0" stopColor="#9fe3ff" stopOpacity=".16"/><stop offset="1" stopColor="#9fe3ff" stopOpacity="0"/></radialGradient>
          <linearGradient id="ab_o_floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0c2f52"/><stop offset="1" stopColor="#08243f"/></linearGradient>
        </defs>
        <rect width="400" height="240" fill="url(#ab_o_ray)"/>
        <g fill="#bfe9ff" opacity=".05">
          <path d="M60,0 L120,240 L90,240 L40,0 Z"/><path d="M200,0 L250,240 L228,240 L182,0 Z"/><path d="M330,0 L370,240 L350,240 L314,0 Z"/>
        </g>
        <path d="M0,206 Q120,196 220,204 Q320,210 400,200 L400,240 L0,240 Z" fill="url(#ab_o_floor)"/>
        <g stroke="#1f8f7a" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".45">
          <path d="M30,238 Q22,205 34,182 Q42,168 36,150"/><path d="M52,238 Q60,210 50,190"/>
          <path d="M360,238 Q352,206 364,184 Q372,170 366,154"/><path d="M382,238 Q390,212 380,192"/>
        </g>
        <g fill="#1c6f86" opacity=".45"><ellipse cx="120" cy="232" rx="34" ry="12"/><ellipse cx="290" cy="234" rx="30" ry="10"/></g>
      </g>),
      // 🏝️ 보물섬 — 달빛 바다 + 모래언덕 섬 + 야자수
      bg_star:(<g>
        <defs>
          <radialGradient id="ab_t_moon" cx="80%" cy="22%" r="30%"><stop offset="0" stopColor="#ffe7b0" stopOpacity=".2"/><stop offset="1" stopColor="#ffe7b0" stopOpacity="0"/></radialGradient>
          <linearGradient id="ab_t_sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a6f8a"/><stop offset="1" stopColor="#1c4f68"/></linearGradient>
          <linearGradient id="ab_t_sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d9b878"/><stop offset="1" stopColor="#a8814a"/></linearGradient>
        </defs>
        <rect width="400" height="240" fill="url(#ab_t_moon)"/>
        <path d="M0,175 L400,175 L400,210 L0,210 Z" fill="url(#ab_t_sea)" opacity=".5"/>
        <g stroke="#bfe6f0" strokeWidth="1.5" opacity=".22" fill="none"><path d="M20,188 q14,-5 28,0 t28,0 t28,0"/><path d="M250,196 q14,-5 28,0 t28,0 t28,0"/></g>
        <path d="M0,202 Q120,178 250,196 Q330,206 400,190 L400,240 L0,240 Z" fill="url(#ab_t_sand)" opacity=".5"/>
        <g stroke="#16324a" strokeWidth="6" strokeLinecap="round" fill="none" opacity=".45"><path d="M64,232 Q58,205 70,186"/></g>
        <g fill="#16324a" opacity=".45"><path d="M70,184 q-26,-10 -40,2 q22,-2 40,6 q-14,-20 2,-34 q4,18 -2,26 q18,-14 36,-8 q-22,4 -36,8 Z"/></g>
      </g>),
      // 🌴 정글 원정대 — 잎사귀 캐노피 + 덤불 지면
      bg_jungle:(<g>
        <defs><radialGradient id="ab_j_ray" cx="30%" cy="-10%" r="80%"><stop offset="0" stopColor="#c6ff9e" stopOpacity=".1"/><stop offset="1" stopColor="#c6ff9e" stopOpacity="0"/></radialGradient></defs>
        <rect width="400" height="240" fill="url(#ab_j_ray)"/>
        <g fill="#1c5a3a" opacity=".65">
          <path d="M-10,-10 Q60,40 30,90 Q10,55 -20,40 Z"/><path d="M70,-10 Q120,46 86,96 Q70,55 44,38 Z"/>
          <path d="M410,-10 Q340,40 372,92 Q392,55 420,40 Z"/><path d="M330,-10 Q286,42 316,96 Q330,56 356,40 Z"/>
        </g>
        <g fill="#247a4c" opacity=".45">
          <path d="M20,-10 Q66,30 44,72 Q30,44 6,34 Z"/><path d="M370,-10 Q330,30 354,74 Q368,44 392,34 Z"/>
        </g>
        <path d="M0,206 Q80,190 160,202 Q260,214 400,198 L400,240 L0,240 Z" fill="#143f2b" opacity=".65"/>
        <g fill="#1c5a3a" opacity=".55"><ellipse cx="60" cy="232" rx="46" ry="16"/><ellipse cx="240" cy="236" rx="56" ry="16"/><ellipse cx="360" cy="232" rx="40" ry="14"/></g>
      </g>),
      // 🦕 공룡 섬 — 먼 능선 + 화산(용암빛) + 양치류
      bg_dino:(<g>
        <defs>
          <radialGradient id="ab_d_volc" cx="72%" cy="55%" r="30%"><stop offset="0" stopColor="#ff7a3c" stopOpacity=".26"/><stop offset="1" stopColor="#ff7a3c" stopOpacity="0"/></radialGradient>
          <linearGradient id="ab_d_mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a2f4a"/><stop offset="1" stopColor="#241d33"/></linearGradient>
        </defs>
        <path d="M0,160 L70,120 L140,158 L210,118 L300,160 L360,128 L400,156 L400,240 L0,240 Z" fill="url(#ab_d_mt)" opacity=".5"/>
        <rect width="400" height="240" fill="url(#ab_d_volc)"/>
        <path d="M250,200 L300,120 L350,200 Z" fill="#2b2238" opacity=".75"/>
        <path d="M288,134 q12,8 24,0 q-4,14 -12,16 q-10,-4 -12,-16 Z" fill="#ff8a3c" opacity=".5"/>
        <path d="M0,206 Q120,194 240,204 Q330,210 400,200 L400,240 L0,240 Z" fill="#2a2440" opacity=".65"/>
        <g stroke="#3f7a52" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".35"><path d="M40,238 Q34,212 46,196 M60,238 Q66,214 56,198"/></g>
      </g>),
      // 🚀 우주 탐사 — 성운 + 고리 행성 + 별먼지
      bg_cloud:(<g>
        <defs>
          <radialGradient id="ab_u_neb" cx="30%" cy="35%" r="55%"><stop offset="0" stopColor="#7b5cff" stopOpacity=".2"/><stop offset="1" stopColor="#7b5cff" stopOpacity="0"/></radialGradient>
          <radialGradient id="ab_u_neb2" cx="78%" cy="60%" r="50%"><stop offset="0" stopColor="#ff5ea8" stopOpacity=".14"/><stop offset="1" stopColor="#ff5ea8" stopOpacity="0"/></radialGradient>
          <radialGradient id="ab_u_planet" cx="40%" cy="38%" r="62%"><stop offset="0" stopColor="#9fb8ff"/><stop offset="100%" stopColor="#37407a"/></radialGradient>
        </defs>
        <rect width="400" height="240" fill="url(#ab_u_neb)"/>
        <rect width="400" height="240" fill="url(#ab_u_neb2)"/>
        <g opacity=".45">
          <ellipse cx="78" cy="206" rx="58" ry="16" fill="none" stroke="#9fb8ff" strokeWidth="3" transform="rotate(-18 78 206)"/>
          <circle cx="78" cy="206" r="34" fill="url(#ab_u_planet)"/>
          <ellipse cx="78" cy="206" rx="58" ry="16" fill="none" stroke="#cdd9ff" strokeWidth="1.5" opacity=".7" transform="rotate(-18 78 206)"/>
        </g>
        <g fill="#fff" opacity=".6">
          <circle cx="120" cy="40" r="1.4"/><circle cx="220" cy="28" r="1.1"/><circle cx="300" cy="56" r="1.4"/><circle cx="350" cy="34" r="1.1"/><circle cx="180" cy="70" r="1.1"/><circle cx="60" cy="60" r="1.2"/><circle cx="270" cy="92" r="1.1"/>
        </g>
      </g>),
      // 🌸 벚꽃 마을 — 둥근 동산 + 벚나무 + 작은 집 (연하게)
      bbg_sakura:(<g opacity="0.6">
        <defs>
          <linearGradient id="bk_k_hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#CFEBC0"/><stop offset="1" stopColor="#A7D89A"/></linearGradient>
          <linearGradient id="bk_k_hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#B9E0AE"/><stop offset="1" stopColor="#8FC788"/></linearGradient>
        </defs>
        <path d="M0,150 Q110,118 220,148 Q320,172 400,140 L400,240 L0,240 Z" fill="url(#bk_k_hill)" opacity=".7"/>
        <path d="M0,182 Q120,158 240,182 Q330,200 400,176 L400,240 L0,240 Z" fill="url(#bk_k_hill2)" opacity=".8"/>
        <g>
          <rect x="70" y="150" width="7" height="26" rx="2" fill="#9a6b4a"/>
          <g fill="#FFC1DC"><circle cx="73" cy="142" r="18"/><circle cx="58" cy="150" r="13"/><circle cx="90" cy="150" r="13"/></g>
          <rect x="320" y="146" width="7" height="26" rx="2" fill="#9a6b4a"/>
          <g fill="#FFB6D5"><circle cx="324" cy="138" r="16"/><circle cx="310" cy="146" r="11"/><circle cx="338" cy="146" r="11"/></g>
        </g>
        <g><rect x="180" y="150" width="40" height="26" rx="3" fill="#FFF3F8"/><polygon points="176,150 224,150 200,134" fill="#F2A6C2"/><rect x="194" y="160" width="12" height="16" rx="2" fill="#E58BB0"/></g>
      </g>),
      // 🍓 딸기 농장 — 들판 + 딸기밭 이랑 + 헛간 (연하게)
      bbg_strawberry:(<g opacity="0.58">
        <defs><linearGradient id="bk_b_field" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#BFE3A8"/><stop offset="1" stopColor="#94CC82"/></linearGradient></defs>
        <path d="M0,158 Q120,140 240,158 Q330,172 400,150 L400,240 L0,240 Z" fill="url(#bk_b_field)" opacity=".8"/>
        <g stroke="#7FB56C" strokeWidth="3" opacity=".5"><path d="M0,200 L400,176"/><path d="M0,216 L400,192"/><path d="M0,232 L400,208"/></g>
        <g fill="#FF6B7E" opacity=".7"><circle cx="60" cy="206" r="4"/><circle cx="150" cy="214" r="4"/><circle cx="250" cy="200" r="4"/><circle cx="330" cy="210" r="4"/><circle cx="110" cy="226" r="4"/><circle cx="300" cy="226" r="4"/></g>
        <g><rect x="300" y="132" width="48" height="30" rx="2" fill="#E2685F"/><polygon points="296,132 352,132 324,116" fill="#C44C46"/><rect x="318" y="142" width="14" height="20" fill="#FBEAD7"/></g>
      </g>),
      // 🌟 별사탕 왕국 — 별가루 + 사탕 언덕 + 막대사탕 나무
      bbg_starcandy:(<g>
        <defs>
          <radialGradient id="bk_c_glow" cx="50%" cy="22%" r="55%"><stop offset="0" stopColor="#FFF6C9" stopOpacity=".5"/><stop offset="1" stopColor="#FFF6C9" stopOpacity="0"/></radialGradient>
          <linearGradient id="bk_c_hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F5C3E4"/><stop offset="1" stopColor="#D89AD0"/></linearGradient>
        </defs>
        <rect width="400" height="240" fill="url(#bk_c_glow)"/>
        <g fill="#FFE9A0" opacity=".8"><circle cx="50" cy="50" r="2"/><circle cx="120" cy="34" r="1.5"/><circle cx="210" cy="46" r="2"/><circle cx="300" cy="32" r="1.5"/><circle cx="360" cy="56" r="2"/><circle cx="160" cy="66" r="1.5"/></g>
        <path d="M0,176 Q110,150 230,176 Q330,196 400,168 L400,240 L0,240 Z" fill="url(#bk_c_hill)" opacity=".8"/>
        <g opacity=".85"><rect x="72" y="160" width="5" height="24" fill="#fff"/><circle cx="74" cy="156" r="13" fill="#FF9ED2"/></g>
        <g opacity=".85"><rect x="320" y="156" width="5" height="24" fill="#fff"/><circle cx="322" cy="152" r="12" fill="#9ED6FF"/></g>
      </g>),
      // 🍫 초콜릿 공장 — 쿠키 언덕 + 초콜릿 강 + 공장 굴뚝 (연하게)
      bbg_choco:(<g opacity="0.55">
        <defs>
          <linearGradient id="bk_ch_river" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8A5A38"/><stop offset="1" stopColor="#6B4226"/></linearGradient>
          <linearGradient id="bk_ch_hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C99A6B"/><stop offset="1" stopColor="#A6764A"/></linearGradient>
        </defs>
        <path d="M0,168 Q120,146 240,168 Q330,184 400,160 L400,240 L0,240 Z" fill="url(#bk_ch_hill)" opacity=".8"/>
        <path d="M0,206 Q120,196 240,208 Q330,216 400,202 L400,240 L0,240 Z" fill="url(#bk_ch_river)" opacity=".85"/>
        <g stroke="#B07A4E" strokeWidth="1.5" opacity=".4" fill="none"><path d="M30,216 q40,-4 80,0 t80,0"/></g>
        <g opacity="0.55">
          <rect x="280" y="120" width="60" height="48" rx="3" fill="#7E5536"/>
          <rect x="292" y="100" width="10" height="22" fill="#5E3D24"/><rect x="318" y="104" width="10" height="18" fill="#5E3D24"/>
          <g fill="#EFE2D4" opacity=".7"><circle cx="297" cy="92" r="7"/><circle cx="305" cy="84" r="6"/><circle cx="323" cy="96" r="6"/></g>
          <rect x="298" y="138" width="12" height="14" fill="#FFD98A"/><rect x="318" y="138" width="12" height="14" fill="#FFD98A"/>
        </g>
      </g>),
      // 👼 천상의 베이커리 — 빛기둥 + 솜구름 섬 + 구름 위 케이크
      bbg_heaven:(<g>
        <defs><radialGradient id="bk_h_light" cx="50%" cy="-10%" r="80%"><stop offset="0" stopColor="#FFF8D8" stopOpacity=".55"/><stop offset="1" stopColor="#FFF8D8" stopOpacity="0"/></radialGradient></defs>
        <rect width="400" height="240" fill="url(#bk_h_light)"/>
        <g fill="#FFF6D0" opacity=".22"><path d="M120,0 L160,240 L120,240 L90,0 Z"/><path d="M260,0 L300,240 L264,240 L228,0 Z"/></g>
        <g fill="#FFFFFF" opacity=".9">
          <ellipse cx="80" cy="180" rx="52" ry="22"/><ellipse cx="110" cy="172" rx="34" ry="20"/>
          <ellipse cx="320" cy="166" rx="46" ry="20"/><ellipse cx="296" cy="160" rx="30" ry="18"/>
          <ellipse cx="200" cy="210" rx="70" ry="24"/>
        </g>
        <g opacity=".85"><rect x="186" y="190" width="28" height="16" rx="3" fill="#FFE3EF"/><rect x="190" y="184" width="20" height="8" rx="3" fill="#FFC4DC"/><circle cx="200" cy="182" r="2.5" fill="#FF7DA8"/></g>
      </g>),
      // 🌈 무지개 케이크 왕국 — 무지개 아치 + 크림 언덕 + 케이크 성 (연하게)
      bbg_rainbow:(<g opacity="0.58">
        <defs><linearGradient id="bk_r_cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE9F4"/><stop offset="1" stopColor="#FAD0E8"/></linearGradient></defs>
        <g fill="none" strokeWidth="7" opacity=".5">
          <path d="M40,200 A160,160 0 0 1 360,200" stroke="#FF8FA8"/>
          <path d="M40,200 A152,152 0 0 1 360,200" stroke="#FFC36E" transform="translate(0,8)"/>
          <path d="M40,200 A144,144 0 0 1 360,200" stroke="#FFE879" transform="translate(0,16)"/>
          <path d="M40,200 A136,136 0 0 1 360,200" stroke="#9BE6A0" transform="translate(0,24)"/>
          <path d="M40,200 A128,128 0 0 1 360,200" stroke="#8FC8FF" transform="translate(0,32)"/>
          <path d="M40,200 A120,120 0 0 1 360,200" stroke="#C9A8FF" transform="translate(0,40)"/>
        </g>
        <path d="M0,190 Q120,168 240,190 Q330,206 400,182 L400,240 L0,240 Z" fill="url(#bk_r_cream)" opacity=".85"/>
        <g>
          <rect x="174" y="150" width="56" height="20" rx="4" fill="#FFD0E6"/>
          <rect x="184" y="134" width="36" height="18" rx="4" fill="#FFC0DC"/>
          <rect x="192" y="120" width="20" height="16" rx="4" fill="#FFB0D2"/>
          <circle cx="202" cy="116" r="3" fill="#FF7DA8"/>
        </g>
      </g>),
    };
    return (
      <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:0,borderRadius:"inherit"}}>
        <div style={{position:"absolute",inset:0,background:`linear-gradient(180deg, ${skyTop} 0%, ${skyBot} 100%)`}}/>
        <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
          {scenes[bgId]}
        </svg>
      </div>
    );
  };
  // 베이커리 파스텔 풍경: 맑은 하늘 + 해 + 솜사탕 구름 + 제과점/케이크 언덕 실루엣 (테마색 반영)
  // 메인 프로필 카드 상단 배경으로 사용. 베이커리 전용.
  const BakeryScenery = ()=> kidSkin!=="cute" ? null : (()=>{
    const sky1 = mixWhite(th.main, 0.74);   // 하늘 상단(맑은 파스텔)
    const sky2 = mixWhite(th.main, 0.5);    // 하늘 아래(테마색 진하게)
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
      ? `linear-gradient(90deg, ${mixHex(th.main,"#000000",0.12)}, ${th.main})`
      : (fallbackFill||GP.accentBar||`linear-gradient(90deg, ${GP.gold}, ${mixWhite(th.main,0.25)} 55%, ${th.main})`);
    return (
      <div style={{height:h,borderRadius:999,overflow:"hidden",position:"relative",
        background:cute?"#F0D8E4":(fallbackTrack||"rgba(0,0,0,0.34)"),
        border:cute?`1px solid ${th.main}55`:(fallbackBorder||`1px solid ${th.main}55`),
        boxShadow:cute?`inset 0 2px 5px rgba(0,0,0,0.08)`:"inset 0 2px 6px rgba(0,0,0,0.5)"}}>
        {/* 빈 트랙: cute모드는 밝은 회색톤 베이스만, 어드벤처는 기존 유지 */}
        <div style={{position:"absolute",inset:0,pointerEvents:"none",opacity:cute?0:0.4,
          backgroundImage:cute
            ?`repeating-linear-gradient(115deg, ${th.main}1f 0 6px, transparent 6px 13px)`
            :`repeating-linear-gradient(115deg, rgba(255,255,255,0.10) 0 6px, transparent 6px 13px)`}}/>
        <div style={{position:"absolute",top:0,bottom:0,left:0,width:"38%",pointerEvents:"none",borderRadius:999,
          background:cute
            ?"transparent"
            :`linear-gradient(90deg, ${GP.gold}3a, transparent)`}}/>
        <div style={{width:`${percent}%`,height:"100%",borderRadius:999,position:"relative",overflow:"hidden",zIndex:1,
          background:fill,
          transition:"width 0.6s cubic-bezier(.34,1.4,.64,1)",
          boxShadow:cute?`0 0 8px ${th.main}55, inset 0 2px 3px rgba(255,255,255,0.55)`:(fallbackGlow||`0 0 12px ${th.main}, inset 0 1px 2px rgba(255,255,255,0.4)`)}}>
          {cute
            ?<>
              <div style={{position:"absolute",top:1.5,left:6,right:6,height:3,borderRadius:999,background:"rgba(255,255,255,0.35)"}}/>
              {/* 흐르는 광택 */}
              <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",backgroundSize:"40px 100%",animation:"gaugeShine 1.4s linear infinite"}}/>
              {/* 진행 끝 발광 */}
              {percent>3&&percent<100&&<div style={{position:"absolute",top:-1,bottom:-1,right:0,width:Math.max(6,h*0.7),background:"#fff",filter:"blur(3px)",opacity:0.85,animation:"barPulse 1.4s ease-in-out infinite"}}/>}
            </>
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
  // [탐험] 캐릭터 탭 카드 — 즐기기·펫·상장 등 하단 카드를 청회색(Sky 계열)으로: 캐릭터 탭 테마와 통일.
  //        초록 숲 카드(characterCardT) 대신 채도 낮은 블루로, 베이커리는 기존 스타일 그대로.
  const skyCard=(c1,c2)=> kidSkin==="cute" ? characterCardT : {
    ...characterCardT,
    background:`linear-gradient(160deg, ${c1}, ${c2})`,
    border:"1px solid rgba(190,220,232,0.4)",
    boxShadow:"0 8px 24px rgba(60,90,105,0.30), inset 0 1px 0 rgba(255,255,255,0.08)",
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

  // dailyKey
  const dKey=(cid,aId,date)=>`${cid}-${aId}-${date}`;
  const getDailyEntry=(cid,aId,date)=>dailyData[dKey(cid,aId,date)]||{homeworks:[],supplies:[],todos:[]};
  const setDailyEntry=(cid,aId,date,entry)=>setDailyData(p=>({...p,[dKey(cid,aId,date)]:entry}));

  // 아이용 미션 추가 (현재 보는 날짜에 할일로 추가, 점수 기본값)
  const kidAddMission=()=>{
    const v=kidAddText.trim();
    if(!kidAddAcId){ showToast("종류를 골라줘"); return; }
    if(!v){ showToast("내용을 입력해줘"); return; }
    const date=childDate||TODAY;
    const entry=getDailyEntry(childId,kidAddAcId,date);
    const item={id:Date.now(),text:v,done:false,point:DEFAULT_HOMEWORK_SCORE,byKid:true};
    setDailyEntry(childId,kidAddAcId,date,{...entry,todos:[...(entry.todos||[]),item]});
    setKidAddText(""); setKidAddAcId(""); setShowKidAddModal(false);
    showToast("추가 완료! ✅");
  };

  // ── 상시 숙제: 자동 추가하지 않음. 미션 모달의 '미션에 추가' 버튼으로만 반영 ──

  const getAcademyById=(cid,academyId)=>{
    if(String(academyId)===String(EXTRA_QUEST_ID)){
      const child=children.find(c=>c.id===cid);
      const t=getChildTheme(child);
      return {id:EXTRA_QUEST_ID,name:"할일",color:t.main};
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

  // 지난 미션 후보: 해당 날짜(date) 이전의 미완료/미실패 미션 전체 (엄마용 '지난 미션 보기' 목록 소스)
  const getPastQuestCandidates=(cid,date)=>{
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

  // 지난 미션은 다음 날 보드로 넘어오지 않고 '원래 날짜'에만 남는다.
  // 엄마용 '지난 미션 보기'에서 못한 지난 미션을 확인하고, 체크(완료)/실패로 마감만 한다.
  const getChildQuestBoardItems=(cid,date)=>getQuestItemsForDate(cid,date);

  // 지난 미션 목록 행 고유 키 (cid|academyId|원래날짜|kind|id) — 리스트 key 용
  const carriedKeyOf=(cid,it)=>`${cid}|${it.academyId}|${it.date}|${it.kind}|${it.id}`;

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
      // 안전망(구버전 스킨): 기존 탐험 라벨
      switch(item.type){
        case "homework": case "todo": case "quest": return {icon:"⚔️",title:"미션 클리어"};
        case "treasure": return {icon:"🎁",title:"보물상자 오픈"};
        case "reward":   return {icon:"🛒",title:"아이템 구매"};
        case "level_bonus": return {icon:"✨",title:"레벨업 보너스"};
        case "badge_reward": return {icon:"🏆",title:"업적 보상"};
        case "manual":   return {icon:"✍️",title:"엄마 XP 조정"};
        default:         return {icon:"📜",title:"탐험 기록"};
      }
    }
    const key = (item.type==="homework"||item.type==="todo") ? "quest" : item.type;
    return L[key] || L.default;
  };
  // 탐험 퀘스트 로그: 기록 종류별 왼쪽 컬러 바 색 (코인/XP/상자/펫진화/미션/업적 구분)
  const getDungeonLogBar=(item)=>{
    switch(item.type){
      case "treasure":     return "#6D88D6"; // 상자 = 파랑
      case "pet_evolve": case "evolve": return "#5FE2C5"; // 펫진화 = 민트
      case "badge_reward": return "#8A7BFF"; // 업적 = 보라
      case "reward":       return "#E0A95C"; // 아이템 구매(코인 소모) = 골드
      case "level_bonus":  return "#FFD86B"; // 레벨업 = 금색
      case "homework": case "todo": case "quest": return "#FF9F5A"; // 미션 = 주황
      case "manual":       return "#9DB0D8"; // 수동 조정 = 회청
      default:             return "#6B7BA8";
    }
  };

  const getProgressMessage=(percent,total)=>{
    const p = T.progress;
    if(total===0) return p.rest;
    if(percent===0) return p.start;
    if(percent<50) return p.low;
    if(percent<100) return p.high;
    return p.done;
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
    const streak=getBestStreak(cid); // 상장은 '한 번이라도 달성'하면 유지 → 최고기록 기준
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
  const getDecorPrice=(decor)=>{
    const o=decorPrices[decor.id];
    if(o===0||o>0) return Number(o);
    return decor.price;
  };
  const isDecorOwned=(cid,decorId)=>(ownedDecor[cid]||[]).includes(decorId);
  // 보유 데코 구매 (아이가 코인으로 즉시 구매, 승인 불필요)
  // 구매 "규칙"(보유 추가·자동 장착)은 순수 함수 computeDecorPurchase가 담당하고,
  // 여기서는 검증·코인 차감·토스트 같은 부수효과만 처리한다.
  const buyDecor=(decor)=>{
    const cid=childId;
    if(isDecorOwned(cid,decor.id)){ showToast("이미 가지고 있어요 ✨"); return; }
    const price=getDecorPrice(decor);
    if(getChildCoin(cid)<price){ showToast(`${TM.coin}이 부족해요 ${TM.coinEmoji}`); return; }
    spendCoin(cid,price,`${decorView(decor,kidSkin).name} 꾸미기 구매`);
    const { nextOwned, nextEquipped, groupKey } =
      computeDecorPurchase(ownedDecor[cid]||[], equippedDecor[cid]||{}, decor.id);
    setOwnedDecor(prev=>({...prev,[cid]:nextOwned}));
    if(groupKey) setEquippedDecor(prev=>({...prev,[cid]:nextEquipped}));
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
  /* ── 꾸미기 아바타: 아이별 조회 헬퍼 ──
     저장 안 된 아이는 기본값(스타터 장착)으로 폴백해 항상 유효한 값을 돌려준다. */
  const getAvatarOwned    = (cid)=> avatarOwned[cid]    || normalizeOwned([]);
  const getAvatarEquipped = (cid)=> avatarEquipped[cid] || getDefaultEquipped();
  const getCharMode       = (cid)=> charDisplayMode[cid] || DEFAULT_CHAR_DISPLAY_MODE;

  /* 아바타 베이스 몸체로 쓸 3단계 성장 캐릭터 이미지 경로.
     현재 모드(탐험/베이커리)·성별을 자동 반영한다. (아바타는 항상 stage 3 사용) */
  const getAvatarBaseCharImg = (cid)=>{
    const g=(children.find(c=>c.id===cid)?.gender)==="girl"?"girl":"boy";
    const set=(kidSkin==="cute"?BAKERY_CHAR_IMG:ADV_CHAR_IMG)[g];
    return set?.[3] || null; // stage-3 고정
  };

  /* 아바타 파츠 구매 (코인 차감은 기존 spendCoin 패턴 그대로) */
  const buyAvatarItem=(itemId)=>{
    const cid=childId;
    const item=getAvatarItem(itemId);
    if(!item) return;
    const owned=getAvatarOwned(cid), equipped=getAvatarEquipped(cid);
    const res=computeAvatarPurchase(owned, equipped, getChildCoin(cid), itemId);
    if(!res.ok){
      if(res.reason==="already_owned") showToast("이미 가지고 있어요 ✨");
      else if(res.reason==="insufficient") showToast(`${TM.coin}이 부족해요 ${TM.coinEmoji}`);
      return;
    }
    spendCoin(cid,res.cost,`${item.label} 꾸미기 파츠 구매`);
    setAvatarOwned(prev=>({...prev,[cid]:res.nextOwned}));
    setAvatarEquipped(prev=>({...prev,[cid]:res.nextEquipped}));
    showToast(`${item.label} 획득! 🎉`);
  };

  /* 아바타 파츠 장착/벗기 토글 */
  const toggleAvatarItem=(itemId)=>{
    const cid=childId;
    const owned=getAvatarOwned(cid), equipped=getAvatarEquipped(cid);
    const res=computeAvatarEquipToggle(owned, equipped, itemId);
    if(!res.ok) return;
    setAvatarEquipped(prev=>({...prev,[cid]:res.nextEquipped}));
  };

  /* 홈 캐릭터 표시 모드 토글 (성장 ↔ 아바타) */
  const toggleCharDisplayMode=()=>{
    const cid=childId;
    setCharDisplayMode(prev=>({...prev,[cid]:computeCharDisplayToggle(getCharMode(cid))}));
  };

  // 현재 장착 데코 객체 조회 (스킨 반영). 없으면 null
  // ── 테마 테두리 색 생성 ──
  //  아이가 고른 테마색(th.main)을 기준으로 보석 느낌의 광택 그라데이션을 만든다.
  //  밝은 하이라이트(흰색) → 원색 → 진한 톤 순으로 섞어 금속/보석 광택을 재현.
  const themedBorder = (d, theme) => {
    if(!d || !d.themed || !theme?.main) return d;
    const m = theme.main;
    const lite = mixWhite(m, 0.55);   // 밝은 톤
    const pale = mixWhite(m, 0.82);   // 하이라이트
    const deep = mixBlack(m, 0.22);   // 진한 톤
    return {
      ...d,
      /* 이름 없는 테마가 또 들어와도 "undefined 보석"이 되지 않게 받쳐 둔다
         (GENDER_THEME 에 name 이 없어서 실제로 그렇게 나왔었다) */
      name: theme.name ? `${theme.name} 보석` : "테마 보석",
      grad: `linear-gradient(115deg, ${deep} 0%, ${lite} 22%, ${pale} 40%, ${m} 58%, ${lite} 76%, ${pale} 92%, ${deep} 100%)`,
      glow: `${m}b8`,
      glowCute: `${m}66`,
    };
  };

  const getEquipped=(cid,groupKey)=>{
    const id=(equippedDecor[cid]||{})[groupKey];
    let d=id?decorView(getDecorById(id),kidSkin):null;
    // 모자/장비 카테고리는 두 모드 모두 상점에서 제거됨 → 이미 장착된 데이터가 있어도 표시하지 않는다.
    // (장착 데이터 자체는 지우지 않아 되돌리기 쉬움)
    if(d&&groupKey==="hat") return null;
    // 테마 테두리는 그 아이의 테마색으로 색을 입힌다
    if(d&&d.themed) d=themedBorder(d, getChildTheme(children.find(c=>c.id===cid)));
    return d;
  };
  const getOwnedCount=(cid)=>(ownedDecor[cid]||[]).length;

  const getQuestTreasureKey=(kind,academyId,date,questId)=>{
    return `${kind}-${academyId}-${date}-${questId}`;
  };

  const giveTreasureForQuestOnce=(cid,questKey)=>{
    if(!questKey) return;
    // 적립 "규칙"은 순수 함수가 계산. 여기선 상태 반영과 팝업 알림만.
    const cur=treasureData[cid];
    const { changed, earned, nextCount } = computeQuestTreasure(cur, questKey);
    if(!changed) return; // 이미 이 미션으로 보상 처리됨

    setTreasureData(prev=>{
      // 최신 prev 기준으로 다시 계산(동시 갱신 안전)
      const r=computeQuestTreasure(prev[cid], questKey);
      if(!r.changed) return prev;
      return {...prev,[cid]:r.next};
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
    // 전설상자 상장 드롭: 40% 확률 + 3회 천장(연속 3번 미획득 시 보장), 미획득 상장 중 지급
    // 연타로 여러 개를 빠르게 열어도 중복되지 않도록, 실제 후보 선택은
    // setSpecialTitles 콜백 안에서 "최신 보유 목록(prev)" 기준으로 다시 계산한다.
    const dropResult={ title:null }; // setTimeout 모달이 참조하는 가변 컨테이너
    let nextLegendPity=Number(cur.legendPity||0); // 전설상장 천장 카운트(최종 통합 set에서 반영)
    if(boxType==="legend"){
      const ownedNow=specialTitles[childId]||[];
      const availableNow=LEGENDARY_TITLES.filter(t=>!ownedNow.includes(t.id));
      const pity=Number(cur.legendPity||0)+1; // 이번 오픈 포함 미획득 연속 횟수
      const hit=availableNow.length>0 && (Math.random()<0.40 || pity>=3);
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
      nextLegendPity = dropResult.title ? 0 : pity;
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
    // ── 첫 상자 부화 보장 (탐험 전용) ──
    // 이 아이가 상자를 처음 여는 거라면(petHatched 플래그 없음) 등급/확률과 무관하게
    // 무조건 1단계 진화(알→아기 드래곤)시켜 "부화 순간"을 첫 보상으로 확정한다.
    // 이미 최종단계인 예외 케이스를 빼면 사실상 알→1단계 전환을 보장.
    // 베이커리(cute)는 강아지 상태로 시작해 부화 개념이 없으므로 보장 로직을 적용하지 않는다.
    const firstHatch = kidSkin!=="cute" && !cur.petHatched && curStage<PET_STAGES.length-1;
    if(firstHatch) petGuaranteed=true;
    const willEvolve = curStage<PET_STAGES.length-1 &&
      (petGuaranteed || Math.random()<(PET_EVOLVE_CHANCE[boxType]||0));
    // 확률로 먼저 진화가 터졌다면 천장 카운트도 리셋(전설상자 한정)
    // (단, 첫 상자 보장으로 켜진 경우는 천장과 무관하므로 리셋하지 않음)
    if(boxType==="legend" && willEvolve && !petGuaranteed) nextPetPity=0;
    // ── treasureData 단일 갱신 ──
    // 개수 감소 + 전설 천장(legendPity/legendPetPity) + 첫부화(petHatched)를 한 번의 set으로 처리.
    // (함수형 업데이트 prev로 처리해 여러 필드를 원자적으로 패치 — 감소가 덮어써지지 않음)
    setTreasureData(prev=>{
      const t=prev[childId]||cur;
      const patch={...t,[boxKey]:Math.max(0,Number(t[boxKey]||0)-1)};
      if(boxType==="legend"){ patch.legendPity=nextLegendPity; patch.legendPetPity=nextPetPity; }
      if(firstHatch) patch.petHatched=true; // 첫 상자 부화 완료 — 다음부터는 일반 확률
      return {...prev,[childId]:patch};
    });
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
        // 첫 상자에서 알→1단계로 깨어난 경우 = "부화 순간". 전용 카피로 이벤트를 특별하게.
        // (첫 부화 보장은 탐험 전용이므로 isFirstHatch 는 탐험에서만 true)
        const isFirstHatch = firstHatch && curStage===0;
        setTimeout(()=>showGameEvent({
          type:"title",
          emoji:petEvolved.to.emoji,
          title:isFirstHatch
            ? "부화 성공! 🎉"
            : (kidSkin==="cute"?"펫이 자랐어요!":"펫 진화!"),
          name:petEvolved.to.name,
          desc:isFirstHatch
            ? "알을 깨고 새로운 동료가 깨어났다!\n이제 함께 탐험을 떠나자 🐣"
            : petEvolved.to.desc,
          reward:`${petEvolved.from.emoji} → ${petEvolved.to.emoji} ${
            isFirstHatch
              ? "펫이 깨어났어요!"
              : (kidSkin==="cute"?"펫이 한 단계 자랐어요!":"펫이 성장했어요!")
          }`
        }),500);
      }
    },1200);
  };

  const checkLevelUp=(cid,beforeXp,afterXp)=>{
    const sortedDesc=[...DEFAULT_LEVELS].sort((a,b)=>b.minScore-a.minScore);
    const levelAt=(xp)=>sortedDesc.find(lv=>xp>=lv.minScore)||DEFAULT_LEVELS[0];

    // ── 중복 팝업 방지: 판정 기준선을 "지금까지 팝업을 띄운 최고 레벨(lastLevelByChild)"로 삼는다 ──
    // beforeXp 기준 레벨과 저장된 최고 레벨 중 더 높은 쪽을 기준선으로 사용 → 같은 레벨업이
    // (setTimeout 중복·보너스 재트리거 등으로) 두 번 들어와도 두 번째부터는 새 레벨이 없어 걸러진다.
    const beforeLevelNum=levelAt(beforeXp).level;
    const recordedNum=Number(lastLevelByChild?.[cid]??0);
    const baselineNum=Math.max(beforeLevelNum,recordedNum);

    // afterXp 기준 레벨 → 그 레벨의 보너스가 또 레벨을 올릴 수 있으므로 누적 처리
    // (무한루프 방지: setScoreData는 1회만, 보너스는 여기서 모두 합산)
    let curXp=afterXp;
    let totalBonus=0;
    const passedLevels=[]; // baseline 이후 통과한 모든 레벨
    const seenLevels=new Set([baselineNum]);

    // baselineNum보다 높고 현재 xp로 도달한 모든 레벨을 오름차순 수집하는 헬퍼
    const collectUpTo=(fromLevelNum,xp)=>{
      const reached=levelAt(xp).level;
      const arr=[];
      DEFAULT_LEVELS.forEach(L=>{
        if(L.level>fromLevelNum&&L.level<=reached) arr.push(L);
      });
      return arr;
    };

    let fromNum=baselineNum;
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

    // 도달한 최고 레벨을 즉시 기록 → 이후 중복 호출은 이 기준선에 막힌다 (팝업보다 먼저 갱신)
    const topLevelNum=passedLevels[passedLevels.length-1].level;
    setLastLevelByChild(prev=>({...prev,[cid]:Math.max(Number(prev?.[cid]??0),topLevelNum)}));

    if(totalBonus>0){
      setScoreData(prev=>{
        const cur=prev[cid]||{xp:0,coin:0,history:[]};
        return {...prev,[cid]:{
          ...cur,
          xp:Math.max(0,Number(cur.xp??cur.total??0)+totalBonus),
          coin:Math.max(0,Number(cur.coin??cur.balance??cur.total??0)+totalBonus),
          history:[...(cur.history||[]),{id:Date.now()+Math.random(),point:totalBonus,xp:totalBonus,coin:totalBonus,date:TODAY,type:"level_bonus",memo:`레벨업 보너스 합계 (Lv.${topLevelNum} 도달)`}]
        }};
      });
    }

    // 통과한 각 레벨마다 팝업 (낮은 레벨 → 높은 레벨 순)
    const _g=children.find(c=>c.id===cid)?.gender;
    const baselineLevelObj=DEFAULT_LEVELS.find(L=>L.level===baselineNum)||DEFAULT_LEVELS[0];
    let prevName=levelView(baselineLevelObj,kidSkin,_g).name;
    passedLevels.forEach(L=>{
      const LV=levelView(L,kidSkin,_g);
      const bonus=LEVEL_UP_REWARDS?.[L.level]||0;
      // 진화 단계 상승 감지(탐험·베이커리 공통) → 팝업에 '이전 → 진화' 비교 일러스트 + '진화' 타이틀
      const _evoUp=L.level>1&&ADV_CHAR_STAGE_OF(L.level)>ADV_CHAR_STAGE_OF(L.level-1);
      const _IMGSET=(kidSkin==="cute"?BAKERY_CHAR_IMG:ADV_CHAR_IMG)[_g==="girl"?"girl":"boy"];
      const _charImg=_evoUp?_IMGSET[ADV_CHAR_STAGE_OF(L.level)]:null;
      const _charImgPrev=_evoUp?_IMGSET[ADV_CHAR_STAGE_OF(L.level-1)]:null;
      const desc=LEVEL_DESCRIPTION[L.level]
        ? LEVEL_DESCRIPTION[L.level]
        : `${prevName}에서 ${LV.name}으로 성장했어요!`;
      const baseReward=bonus>0?`🎁 레벨업 보너스\n${TM.xpEmoji} +${bonus} ${TM.xp} · ${TM.coinEmoji} +${bonus} ${TM.coin}`:"새로운 레벨 달성!";
      showGameEvent({
        type:"level",
        emoji:LV.emoji||"🎉",
        title:_evoUp?"진화!":"레벨업!",
        charImg:_charImg,
        charImgPrev:_charImgPrev,
        name:`Lv.${LV.level} ${LV.name}`,
        desc,
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

  const getScoreHistory=(cid)=>scoreData[cid]?.history||[];



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

  // 첫 미션 안내창은 제거됨 (사탕 구매 유도 팝업 미사용)
  useEffect(()=>{
    if(!firstTipPending) return;
    // 더 이상 팝업을 띄우지 않고, 1회성 플래그만 정리한다.
    setFirstTipPending(false);
    setFirstTipSeen(true);
    save("v6_first_mission_tip_seen","1");
  },[firstTipPending]);

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

  const getChildRewards=()=>rewardData["shared"]||DEFAULT_REWARDS;

  const getCharacterEvolution=(cid)=>{
    const level=getChildLevel(cid).level;
    if(kidSkin==="cute"){
      // 베이커리 전용 구간: 1-6 / 7-11 / 12-16 / 17~
      const bIdx=[...BAKERY_EVOLUTIONS].map((e,i)=>({...e,i})).reverse().find(e=>level>=e.minLevel)?.i ?? 0;
      // 탐험 성장체 객체(badge 등) 위에 베이커리 외형을 덮어씌움
      const baseEvo=CHARACTER_EVOLUTIONS[Math.min(bIdx,CHARACTER_EVOLUTIONS.length-1)];
      return evoView(baseEvo,bIdx,kidSkin);
    }
    const evo=[...CHARACTER_EVOLUTIONS].sort((a,b)=>b.minLevel-a.minLevel).find(e=>level>=e.minLevel)||CHARACTER_EVOLUTIONS[0];
    const idx=CHARACTER_EVOLUTIONS.findIndex(e=>e.minLevel===evo.minLevel);
    return evoView(evo,idx<0?0:idx,kidSkin);
  };
  // 최종 성장체(마지막 단계) 도달 여부 — 캐릭터 스킨 잠금 해제 기준
  // 펫 최종 진화(마지막 단계) 도달 여부 — 펫 스킨 잠금 해제 기준
  const isMaxPet=(cid)=>getPetStage(cid)>=PET_STAGES.length-1;

  const getChildRewardRequests=(cid)=>rewardRequests[cid]||[];
  const hasPendingRewardRequest=(cid,rewardId)=>getChildRewardRequests(cid).some(r=>r.rewardId===rewardId&&r.status==="pending");

  const requestReward=(reward)=>{
    const coin=getChildCoin(childId);
    if(coin<reward.point){ showToast(`보유 ${TM.coin}이 부족해요 ${TM.coinEmoji}`); return; }
    if(hasPendingRewardRequest(childId,reward.id)){ showToast("이미 요청한 보상이에요"); return; }
    // 요청과 동시에 코인 차감 (엄마 승인 전이라도 미리 빠짐 → 거절 시 환불)
    spendCoin(childId,reward.point,`${reward.title} 구매 요청`);
    const newRequest={id:Date.now(),rewardId:reward.id,title:reward.title,point:reward.point,emoji:reward.emoji,status:"pending",requestedAt:new Date().toISOString()};
    setRewardRequests(prev=>({...prev,[childId]:[...getChildRewardRequests(childId),newRequest]}));
    showToast("구매 요청을 보냈어요 🛒");
  };
  const approveRewardRequest=(requestId)=>{
    const request=getChildRewardRequests(childId).find(r=>r.id===requestId);
    if(!request) return;
    // 코인은 요청 시 이미 차감됨 → 승인은 상태만 변경
    setRewardRequests(prev=>({...prev,[childId]:getChildRewardRequests(childId).map(r=>r.id===requestId?{...r,status:"approved",approvedAt:new Date().toISOString()}:r)}));
    showToast("구매 승인 완료! 🎉");
  };
  const rejectRewardRequest=(requestId)=>{
    const request=getChildRewardRequests(childId).find(r=>r.id===requestId);
    if(!request) return;
    // 거절 시 요청할 때 미리 빠진 코인을 환불 (대기 상태였던 건만)
    if(request.status==="pending") refundCoin(childId,request.point,`${request.title} 구매 거절 환불`);
    setRewardRequests(prev=>({...prev,[childId]:getChildRewardRequests(childId).map(r=>r.id===requestId?{...r,status:"rejected",rejectedAt:new Date().toISOString()}:r)}));
    showToast(`요청을 거절했어요 (${request.point} ${TM.coin} 돌려줬어요)`);
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
  // refundCoin = 코인만 환불 (구매 거절 시 되돌려줌, XP·레벨 영향 없음)
  const refundCoin=(cid,amount,memo="구매 거절 환불")=>{
    const back=Number(amount||0);
    setScoreData(prev=>{
      const cur=prev[cid]||{xp:0,coin:0,history:[]};
      return {...prev,[cid]:{
        ...cur,
        xp:Number(cur.xp??cur.total??0),
        coin:Math.max(0,Number(cur.coin??cur.balance??cur.total??0)+back),
        history:[...(cur.history||[]),{id:Date.now(),point:back,xp:0,coin:back,date:TODAY,type:"reward",memo}]
      }};
    });
  };
  // 준비물 챙김 체크 토글 (탐험 카드 ✅/⬜ 칩) — 보상 없이 챙김 표시만
  const toggleSupplyChecked=(cid,academyId,date,name)=>{
    const entry=getDailyEntry(cid,academyId,date);
    const cur=entry.checkedSupplies||[];
    const next=cur.includes(name)?cur.filter(s=>s!==name):[...cur,name];
    setDailyEntry(cid,academyId,date,{...entry,checkedSupplies:next});
  };

  const toggleHomeworkDone=(cid,academyId,date,homeworkId)=>{
    const entry=getDailyEntry(cid,academyId,date);
    const homeworks=entry.homeworks||[];
    const target=homeworks.find(h=>h.id===homeworkId);
    if(!target) return;
    const nextDone=!target.done;
    const point=target.point||DEFAULT_HOMEWORK_SCORE;
    if(nextDone&&appMode==="child") playCompleteSound(); // 누르는 즉시 소리 (상태 갱신 전)
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
    if(nextDone&&appMode==="child") playCompleteSound(); // 누르는 즉시 소리 (상태 갱신 전)
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

  

  // 학원 CRUD
  const getNextAcademyColor=()=>{
    const used=(curAc||[]).map(a=>(a.color||"").toUpperCase());
    const unused=PALETTE.find(c=>!used.includes(c.toUpperCase()));
    return unused||PALETTE[(curAc||[]).length%PALETTE.length];
  };
  const openAdd=()=>{ setEditTarget(null); setConfirmDelAc(false); setNewAc({...EMPTY_AC,color:getNextAcademyColor(),baseSupplies:[],baseHomeworks:[]}); setSupplyInput(""); setBaseHwInput(""); setShowAcMore(false); setAcSecSupply(false); setAcSecFee(false); setAcSecInfo(false); setAcSecMemo(false); setShowAddAcModal(true); };
  const openEdit=(ac)=>{ setEditTarget(ac.id); setConfirmDelAc(false); setNewAc({...ac,baseSupplies:[...(ac.baseSupplies||[])],baseHomeworks:[...(ac.baseHomeworks||[])],schedules:[...(ac.schedules||[])],days:[...(ac.days||[])]}); setSupplyInput(""); setBaseHwInput(""); setShowAcMore(!!(ac.fee||ac.teacher||ac.phone||ac.address||(ac.baseSupplies||[]).length||(ac.baseHomeworks||[]).length||ac.shuttleInfo||ac.memo)); setAcSecSupply(!!((ac.baseSupplies||[]).length||(ac.baseHomeworks||[]).length)); setAcSecFee(!!ac.fee); setAcSecInfo(!!(ac.teacher||ac.phone||ac.address||ac.shuttleInfo)); setAcSecMemo(!!ac.memo); setShowDetailModal(null); setShowAddAcModal(true); };
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
    setShowDetailModal(null);
    // 수정 모달에서 삭제한 경우도 함께 닫고 편집 상태 초기화
    setShowAddAcModal(false); setEditTarget(null); setNewAc({...EMPTY_AC,baseSupplies:[],baseHomeworks:[]}); setConfirmDelAc(false);
    showToast("삭제됨");
  };
  const addBaseSupply=()=>{ const v=supplyInput.trim(); if(!v) return; setNewAc(p=>({...p,baseSupplies:[...(p.baseSupplies||[]),v]})); setSupplyInput(""); };
  const addBaseHomework=()=>{ const v=baseHwInput.trim(); if(!v) return; setNewAc(p=>({...p,baseHomeworks:[...(p.baseHomeworks||[]),v]})); setBaseHwInput(""); };
  const removeBaseHomework=(i)=>setNewAc(p=>({...p,baseHomeworks:(p.baseHomeworks||[]).filter((_,idx)=>idx!==i)}));

  // 학원비
  const pKey=(cid,aId)=>`${cid}-${feeMonth}-${aId}`;
  const isPaid=(aId)=>!!paidStatus[pKey(childId,aId)];
  const togglePaid=(aId)=>{ const k=pKey(childId,aId); setPaidStatus(p=>({...p,[k]:!p[k]})); };
  const payStatus=(a)=>{
    if(Number(a.fee||0)===0) return {label:"-",color:C.sub,free:true};
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
  // 보충 결과를 출석/불참으로 설정 (같은 값을 다시 누르면 미처리로 토글)
  const setMakeupResult=(id,result)=>setAbsences(p=>({...p,[childId]:(p[childId]||[]).map(a=>{
    if(a.id!==id) return a;
    const next = a.makeupStatus===result ? "" : result;       // 같은 버튼 재클릭 → 해제
    return {...a, makeupStatus:next, makeupDone: next!=="" };  // 둘 중 하나 선택되면 처리완료(makeupDone=true)
  })}));

  // 문자
  const applyTmpl=(tmpl,ac)=>setSmsDraft(tmpl.body.replace(/{아이이름}/g,curChild?.name||"").replace(/{학원명}/g,ac.name).replace(/{날짜}/g,fmt(TODAY)).replace(/{시간}/g,getClassTime(ac,todayDN())||getSchedules(ac)[0]?.time||""));
  const saveTmpl=()=>{
    if(!editTmpl.title.trim()||!editTmpl.body.trim()){ showToast("제목과 내용을 입력해줘"); return; }
    setTemplates(p=>showTmplEdit==="new"?[...p,{...editTmpl,id:Date.now()}]:p.map(t=>t.id===showTmplEdit?{...editTmpl,id:t.id}:t));
    setShowTmplEdit(null); showToast();
  };

  // 방학 관련
  const vacKey=(cid,aId)=>`${cid}-${String(aId)}`;
  const getVacations=(cid,aId)=>vacations[vacKey(cid,aId)]||[];
  const isVacationDay=(cid,aId,dateStr)=>getVacations(cid,aId).some(v=>v.start<=dateStr&&dateStr<=v.end);
  const addVacation=()=>{
    if(!vacForm.academyId||!vacForm.start||!vacForm.end){ showToast("학원과 기간을 입력해줘"); return; }
    if(vacForm.start>vacForm.end){ showToast("시작일이 종료일보다 늦어요"); return; }
    const k=vacKey(childId,vacForm.academyId);
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
  /* (이동됨) devBtn·devMiniBtn·devGroup·devGroupTitle — DevToolsPanel.jsx 로 분리 */
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
            return (
              <>
              <div style={kidSkin==="cute"
                ?{position:"relative",overflow:"hidden",background:`linear-gradient(160deg, ${mixWhite(th.main,0.55)}, ${mixWhite(th.main,0.32)})`,borderRadius:34,padding:"17px",boxShadow:`0 14px 30px ${th.main}3a, inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -8px 18px ${th.main}22`,color:GP.boxText,border:"2px solid #fff",marginBottom:12}
                // 캐릭터 탭(탐험): '호수' 느낌 — SkyLight(#B5DBEE) 계열 밝은 그라데이션 + 은은한 종이 질감, 글씨는 딥블루로 대비
                :{position:"relative",overflow:"hidden",background:`radial-gradient(1.3px 1.3px at 20% 28%, rgba(255,255,255,0.35), transparent), radial-gradient(1.2px 1.2px at 68% 16%, rgba(255,255,255,0.28), transparent), radial-gradient(1.3px 1.3px at 82% 64%, rgba(255,255,255,0.3), transparent), linear-gradient(150deg, #CBE7F8, #B4DAF1)`,borderRadius:GP.radCard,padding:"17px",boxShadow:"0 10px 28px rgba(78,130,168,0.28)",color:"#355D76",border:"1px solid #7DB7D8",marginBottom:12}}>
                {kidSkin==="cute"&&<div style={{position:"absolute",top:0,left:0,right:0,height:"42%",background:"linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0))",borderRadius:"34px 34px 50% 50%",pointerEvents:"none"}}/>}
                <DungeonCardGlow/>
                {/* 레벨 + 상장 — 윗줄(라벨+상장뱃지) / 아랫줄(레벨명 한 줄 전체)로 분리해 겹침 방지 */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,position:"relative",zIndex:1}}>
                  <p style={{fontSize:12,fontWeight:900,letterSpacing:1.5,margin:0,color:kidSkin==="cute"?GP.boxSub:"#8A6A2E"}}>{T.heroStatus}</p>
                  <p style={{display:"inline-block",...jellyChip({background:kidSkin==="cute"?`linear-gradient(160deg, ${mixWhite(th.main,0.9)}, ${mixWhite(th.main,0.8)})`:"#EDF8FD",border:kidSkin==="cute"?`2px solid ${mixWhite(th.main,0.78)}`:"1px solid rgba(125,183,216,0.6)",borderRadius:20},{radius:20}),fontSize:13,fontWeight:900,color:kidSkin==="cute"?GP.boxText:"#355D76",padding:"5px 12px",margin:0,maxWidth:"58%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flexShrink:0,boxShadow:kidSkin==="cute"?`0 4px 11px ${th.main}22, inset 0 1.5px 3px rgba(255,255,255,0.7)`:"none"}}>
                    {title.emoji} {title.name}
                  </p>
                </div>
                <div style={{marginTop:5,marginBottom:13,position:"relative",zIndex:1,minWidth:0}}>
                  {(()=>{
                    // 레벨 이름이 길거나 레벨이 두 자리면 글씨를 단계적으로 줄여 한 줄에 맞춘다(말줄임 X)
                    const rawName=level.name||"";
                    const nameLen=rawName.length;
                    const lvDigits=String(level.level).length;
                    const longish=nameLen+lvDigits;
                    const fs= longish>=8 ? 17 : longish>=7 ? 19 : 21;
                    return (
                      <p style={{fontSize:fs,fontWeight:900,margin:0,color:kidSkin==="cute"?GP.boxText:"#355D76",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{level.emoji} Lv.{level.level} {level.name}</p>
                    );
                  })()}
                </div>
                {(()=>{
                  const coinXpBlock=(
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14,marginBottom:6,position:"relative",zIndex:1}}>
                      <div style={{background:kidSkin==="cute"?`linear-gradient(160deg, ${mixWhite(th.main,0.9)}, ${mixWhite(th.main,0.8)})`:"#EDF8FD",border:kidSkin==="cute"?`2px solid ${mixWhite(th.main,0.78)}`:"none",borderRadius:kidSkin==="cute"?16:18,padding:"8px 11px",display:"flex",alignItems:"center",gap:8,position:"relative",zIndex:1,boxShadow:kidSkin==="cute"?`0 4px 11px ${th.main}22, inset 0 1.5px 3px rgba(255,255,255,0.7)`:"none"}}>
                        <span style={{fontSize:20}}>{TM.coinEmoji}</span>
                        <div style={{minWidth:0}}>
                          <p style={{fontSize:11,fontWeight:800,opacity:0.7,margin:0,letterSpacing:0.5}}>보유 {TM.coin}</p>
                          <p style={{fontSize:17,fontWeight:900,margin:"1px 0 0",lineHeight:1}}>{coin}</p>
                        </div>
                      </div>
                      <div style={{background:kidSkin==="cute"?`linear-gradient(160deg, ${mixWhite(th.main,0.9)}, ${mixWhite(th.main,0.8)})`:"#EDF8FD",border:kidSkin==="cute"?`2px solid ${mixWhite(th.main,0.78)}`:"none",borderRadius:kidSkin==="cute"?16:18,padding:"8px 11px",display:"flex",alignItems:"center",gap:8,position:"relative",zIndex:1,boxShadow:kidSkin==="cute"?`0 4px 11px ${th.main}22, inset 0 1.5px 3px rgba(255,255,255,0.7)`:"none"}}>
                        <span style={{fontSize:20}}>{TM.xpEmoji}</span>
                        <div style={{minWidth:0}}>
                          <p style={{fontSize:11,fontWeight:800,opacity:0.7,margin:0,letterSpacing:0.5}}>누적 {TM.xp}</p>
                          <p style={{fontSize:17,fontWeight:900,margin:"1px 0 0",lineHeight:1}}>{xp}</p>
                        </div>
                      </div>
                    </div>
                  );
                  const progressBlock=(
                    <div style={{marginTop:kidSkin==="cute"?0:0}}>
                      {kidSkin==="cute"&&(
                      <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",marginBottom:6}}>
                        <span style={{fontSize:11,fontWeight:900,opacity:0.86}}>{nextLevel?`${progress.currentXp}/${progress.needXp}`:"MAX LEVEL"}</span>
                      </div>
                      )}
                      <JellyBar percent={progress.percent} height={14} fallbackTrack="rgba(47,86,112,0.16)" fallbackBorder="1px solid rgba(143,201,237,0.7)" />
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginTop:6,fontSize:11.5,fontWeight:800,opacity:0.88}}>
                        <span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{nextLevel?<>다음 레벨 : {nextLevel.emoji} Lv.{nextLevel.level} {nextLevel.name}</>:"🏆 최고 레벨 달성!"}</span>
                        <span style={{opacity:0.78,flexShrink:0}}>{nextLevel?(kidSkin==="cute"?`${progress.remainXp} ${TM.xp} 남음`:`${progress.currentXp}/${progress.needXp} · ${progress.remainXp} 남음`):""}</span>
                      </div>
                    </div>
                  );
                  // 탐험 구조로 통일: 진행바 → 보유코인/누적XP
                  return <>{progressBlock}{coinXpBlock}</>;
                })()}
                {/* 성장 단계별 격려 문구 (탐험 구조로 통일 — 양쪽 표시) */}
                {(()=>{
                  const msg=evoMsgView(evo.name,kidSkin)||EVOLUTION_MESSAGES["새싹 탐험가"];
                  return (
                    <div style={{marginTop:16,marginBottom:4,position:"relative",zIndex:1}}>
                      <p style={{fontSize:12.5,fontWeight:700,margin:0,lineHeight:1.4,opacity:0.9,textAlign:"center"}}>“{msg}”</p>
                    </div>
                  );
                })()}
              </div>
              </>
            );
    })();
    // 날짜 이동 바 — 탐험장소/미션 탭 공용. 탐험=밝은 숲색, 미션=원목 브라운 (탭 테마 연동).
    const dateNav=(()=>{
      const _dn=kidSkin!=="cute";
      const _dnBg=childTab==="today"?"#6F8E63":childTab==="growth"?"#79A6BB":"#B38A60";  // 미션=그린·탐험=브라운 (사용자 확정: 톤 맞교환)
      const _dnBtn=childTab==="today"?"#83A177":childTab==="growth"?"#8FB7C9":"#C69C6F";
      const _dnDeep=childTab==="today"?"#5C452C":childTab==="growth"?"#28495C":"#2F4A2C"; // 밝은 버튼 위 화살표·오늘 글씨용 진한 색 (가독성)
      return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",...jellyBox({background:_dn?_dnBg:GP.boxBg,border:_dn?"1px solid rgba(240,243,243,0.18)":`1px solid ${GP.boxBorder}`,borderRadius:16,boxShadow:`0 6px 18px ${GP.boxShadowCol}`},{radius:18}),padding:"6px 10px",marginBottom:14}}>
        <button onClick={()=>{const d=new Date(childDate+"T00:00:00");d.setDate(d.getDate()-1);setChildDate(toStr(d));}}
          style={{...jellyChip({background:_dn?_dnBtn:GP.chipBg,border:_dn?"1px solid rgba(240,243,243,0.22)":`1px solid ${GP.chipBorder}`,borderRadius:10},{radius:12}),color:_dn?_dnDeep:GP.chipText,width:30,height:30,fontSize:17,cursor:"pointer",fontWeight:900}}>‹</button>
        <div style={{textAlign:"center"}}>
          <p style={{fontSize:15,fontWeight:900,margin:0,color:_dn?"#F0F3F3":GP.boxText}}>{childDt.getMonth()+1}월 {childDt.getDate()}일 {childTodayDN}요일</p>
          {!isChildToday&&<p style={{fontSize:11,color:_dn?"#FFF8EB":GP.gold,margin:"2px 0 0",fontWeight:800}}>오늘과 다른 날짜예요</p>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {!isChildToday&&<button onClick={()=>setChildDate(TODAY)}
            style={{background:_dn?"#FFF8EB":`linear-gradient(135deg, ${GP.gold}, ${th.main})`,border:"none",color:_dn?_dnDeep:"#fff",borderRadius:10,padding:"6px 10px",fontSize:11,cursor:"pointer",fontWeight:900}}>오늘</button>}
          <button onClick={()=>{const d=new Date(childDate+"T00:00:00");d.setDate(d.getDate()+1);setChildDate(toStr(d));}}
            style={{...jellyChip({background:_dn?_dnBtn:GP.chipBg,border:_dn?"1px solid rgba(240,243,243,0.22)":`1px solid ${GP.chipBorder}`,borderRadius:10},{radius:12}),color:_dn?_dnDeep:GP.chipText,width:30,height:30,fontSize:17,cursor:"pointer",fontWeight:900}}>›</button>
        </div>
      </div>
      );
    })();
    return (
      <div style={{fontFamily:kidSkin!=="cute"
          // 탐험: 본문 전체를 Pretendard로 통일 — 손글씨는 헤드라인(의연체)·타일 제목(콘콘체)만
          ?"'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif"
          :"'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif",background:kidSkin!=="cute"
          // 탐험(개방감): 루트 바탕도 시트와 같은 아이보리 — 시트·콘텐츠·바닥이 한 장의 종이처럼 이어짐 (카드만 색 유지)
          ?"linear-gradient(180deg, #F0F3F3 0%, #EAEFE9 100%)"
          :(GP.appPattern?`${GP.appPattern}, ${GP.appBg}`:(GP.appBg||`linear-gradient(180deg, ${mixWhite(th.main,0.86)} 0%, ${C.bg} 38%, ${C.bg} 100%)`)),backgroundSize:GP.appPattern&&kidSkin==="cute"?`${GP.appPatternSize}, ${GP.appPatternSize}, cover`:"auto",backgroundPosition:GP.appPattern&&kidSkin==="cute"?`${GP.appPatternPos}, 0 0`:"0 0",minHeight:"100vh",maxWidth:430,margin:"0 auto",color:C.text,paddingBottom:30,position:"relative",overflowX:"clip",overflowY:"visible",wordBreak:"keep-all"}}>
        {/* 말랑한 배경 블롭 */}
        <div style={{position:"absolute",top:-40,right:-50,width:170,height:170,borderRadius:"50%",background:`radial-gradient(circle at 35% 35%, ${th.main}26, transparent 70%)`,filter:"blur(6px)",animation:"blobShift 11s ease-in-out infinite",pointerEvents:"none",zIndex:0}}/>
        <div style={{position:"absolute",top:240,left:-60,width:150,height:150,borderRadius:"50%",background:`radial-gradient(circle at 50% 50%, ${GP.gold}24, transparent 70%)`,filter:"blur(6px)",animation:"blobShift 14s ease-in-out infinite 1.5s",pointerEvents:"none",zIndex:0}}/>
        {/* 동화책 탐험 분위기: 아주 희미한 배경 데코 (탐험모드 전용) */}
        {kidSkin!=="cute"&&(()=>{
          const deco=[
            {e:"☁️",top:"6%",left:"8%",size:30,op:0.10},
            {e:"✨",top:"11%",left:"82%",size:18,op:0.14},
            {e:"🦋",top:"30%",left:"72%",size:20,op:0.12},
            {e:"🌿",top:"48%",left:"5%",size:24,op:0.11},
            {e:"☁️",top:"58%",left:"68%",size:26,op:0.09},
            {e:"🌳",top:"74%",left:"10%",size:28,op:0.11},
            {e:"✨",top:"80%",left:"86%",size:16,op:0.13},
            {e:"🌿",top:"90%",left:"60%",size:22,op:0.10},
          ];
          return deco.map((d,i)=>(
            <div key={`deco${i}`} style={{position:"absolute",top:d.top,left:d.left,fontSize:d.size,opacity:d.op,filter:"grayscale(0.2)",pointerEvents:"none",zIndex:0,userSelect:"none"}}>{d.e}</div>
          ));
        })()}
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
          @keyframes floatHero{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
          @keyframes shadowPulse{0%,100%{transform:translateX(-50%) scale(1);opacity:1}50%{transform:translateX(-50%) scale(0.78);opacity:0.7}}
          @keyframes shadowPulsePet{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(0.93);opacity:0.85}}
          @keyframes floatHat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-3px)}}
          @keyframes wiggle{0%,100%{transform:rotate(0deg)}25%{transform:rotate(-7deg)}75%{transform:rotate(7deg)}}
          @keyframes eggWiggle{0%,86%,100%{transform:rotate(0deg)}88%{transform:rotate(-9deg)}90%{transform:rotate(8deg)}92%{transform:rotate(-6deg)}94%{transform:rotate(4deg)}96%{transform:rotate(-2deg)}98%{transform:rotate(0deg)}}
          @keyframes eggSparkle{0%,82%,100%{opacity:0;transform:scale(0.5)}88%{opacity:1;transform:scale(1.15)}96%{opacity:0.4;transform:scale(0.9)}}
          @keyframes petSparkle{0%,100%{opacity:0;transform:scale(0.5)}50%{opacity:1;transform:scale(1.1)}}
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
        {BAKERY_ENABLED&&showModeSelect&&(
          <ModeSelect onPick={(skin)=>{ setKidSkin(skin); setShowModeSelect(false); showToast(skin==="cute"?"🧁 베이커리 게임 시작!":"🧭 탐험 게임 시작!"); load("v6_kid_guide_seen").then(seen=>{ if(!seen) setTimeout(()=>setShowKidCoachmark(true),350); }); }} />
        )}

        {/* ── 아이용 미션 추가 모달 ── */}
        {showKidAddModal&&(()=>{
          const cute=kidSkin==="cute";
          const acOptions=[...curAc,{id:EXTRA_QUEST_ID,name:"할일"}];
          const sheetBg=cute?"#fff":(GP.appBg||"#1e1b2e");
          const titleColor=cute?th.main:"#fff";
          const fieldBg=cute?mixWhite(th.main,0.93):"rgba(255,255,255,0.10)";
          const fieldBorder=cute?mixWhite(th.main,0.7):`${th.main}66`;
          const fieldText=cute?C.text:"#fff";
          const inputStyle={width:"100%",boxSizing:"border-box",background:fieldBg,border:`1.5px solid ${fieldBorder}`,borderRadius:cute?16:14,padding:"13px 14px",color:fieldText,fontSize:15,fontWeight:700,outline:"none",fontFamily:"inherit"};
          return (
          <div onClick={()=>setShowKidAddModal(false)} style={{position:"fixed",inset:0,zIndex:400,background:"rgba(20,16,28,0.55)",backdropFilter:"blur(3px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,background:sheetBg,borderRadius:"28px 28px 0 0",boxShadow:"0 -10px 40px rgba(0,0,0,0.3)",padding:"22px 20px 40px",boxSizing:"border-box",animation:"popInUp .35s ease both"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <p style={{fontSize:18,fontWeight:900,margin:0,color:titleColor}}>{cute?"🧁 미션 추가하기":"✨ 새 미션 추가"}</p>
                <button onClick={()=>setShowKidAddModal(false)} style={{border:"none",background:cute?mixWhite(th.main,0.88):"rgba(255,255,255,0.14)",color:cute?th.main:"#fff",width:32,height:32,borderRadius:"50%",fontSize:16,fontWeight:900,cursor:"pointer"}}>✕</button>
              </div>
              {/* 종류 선택 (학원들 + 할일) */}
              <p style={{fontSize:13,fontWeight:800,margin:"0 0 7px",color:cute?C.sub:"rgba(255,255,255,0.75)"}}>종류</p>
              <select value={kidAddAcId} onChange={e=>setKidAddAcId(e.target.value)}
                style={{...inputStyle,marginBottom:14,cursor:"pointer"}}>
                <option value="" style={{color:"#333"}}>선택해줘</option>
                {acOptions.map(a=><option key={a.id} value={a.id} style={{color:"#333"}}>{a.name}</option>)}
              </select>
              {/* 내용 입력 */}
              <p style={{fontSize:13,fontWeight:800,margin:"0 0 7px",color:cute?C.sub:"rgba(255,255,255,0.75)"}}>내용</p>
              <input value={kidAddText} onChange={e=>setKidAddText(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&kidAddMission()} autoFocus
                placeholder={cute?"예: 책 30분 읽기":"예: 책 30분 읽기"}
                style={{...inputStyle,marginBottom:18}}/>
              {/* 등록 버튼 */}
              <button onClick={kidAddMission}
                style={{width:"100%",padding:"15px",borderRadius:cute?18:14,border:"none",
                  background:cute?`linear-gradient(135deg, ${th.main}, ${mixWhite(th.main,0.3)})`:`linear-gradient(135deg, ${th.main}, ${mixBlack(th.main,0.25)})`,
                  color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer",
                  boxShadow:cute?`0 8px 20px ${th.main}40`:`0 6px 18px ${mixBlack(th.main,0.3)}66`}}>
                ➕ 등록하기
              </button>
            </div>
          </div>
          );
        })()}

        {/* ── 아이용 꾸미기 상점 모달 ── */}
        {/* ── 꾸미기 상점 — 내용은 src/components/camp/DecorShopSheet.jsx 로 분리 (CLAUDE.md 3).
               구매·장착 로직(buyDecor·toggleEquipDecor)과 코인 차감은 여기 App에 그대로 남는다. */}
        <DecorShopSheet
          open={showDecorShop} onClose={()=>setShowDecorShop(false)}
          kidSkin={kidSkin} th={th} GP={GP} TM={TM}
          coin={getChildCoin(childId)}
          ownedCount={getOwnedCount(childId)}
          avatarOwnedCount={getAvatarOwned(childId).length}
          equipped={equippedDecor[childId]||{}}
          isOwned={(id)=>isDecorOwned(childId,id)}
          priceOf={getDecorPrice}
          themedBorder={themedBorder}
          maxPet={isMaxPet(childId)}
          onBuy={buyDecor}
          onEquip={toggleEquipDecor}
          onOpenAvatarShop={()=>{ setShowDecorShop(false); setShowEquipShop(true); }}
        />

        {/* 연속 달성 시트 — 캐릭터 탭 '연속 달성' 카드에서 연다.
             [주의] 캐릭터 탭은 아이 모드(appMode==="child")의 반환부 안에 있다.
             시트도 반드시 이 반환부 안에 있어야 한다 — 파일 끝의 부모 모드 반환부에
             넣으면 아이 모드에서는 아예 렌더되지 않는다 (처음에 그 실수를 했다). */}
        <StreakSheet open={openStreak} onClose={()=>setOpenStreak(false)}
          dark={kidSkin!=="cute"} streak={getQuestStreak(childId)} best={getBestStreak(childId)}
          faint={CT.faint} gold={GP.gold} />
        {/* 상장 시트 — 캐릭터 탭 '상장' 카드에서 연다 */}
        <TitleSheet open={openTitle} onClose={()=>setOpenTitle(false)}
          dark={kidSkin!=="cute"} titles={getAllTitles(childId)}
          isUnlocked={(id)=>isTitleUnlocked(childId,id)} selectedId={getSelectedTitle(childId).id}
          onSelect={selectTitle} faint={CT.faint}
          unlockedCount={getUnlockedTitles(childId).length} totalCount={getAllTitles(childId).length} />
        {/* 탐험 기록 시트 — 캐릭터 탭 '탐험 기록' 카드에서 연다 */}
        <HistorySheet open={openHistory} onClose={()=>setOpenHistory(false)}
          dark={kidSkin!=="cute"} items={getScoreHistory(childId)}
          logInfo={getAdventureLogInfo} logBar={getDungeonLogBar}
          logName={T.logName||"활동 기록"} faint={CT.faint}
          xpEmoji={TM.xpEmoji} coinEmoji={TM.coinEmoji} gold={GP.gold} />
        {/* 나의 펫 시트 — 캐릭터 탭 '나의 펫' 카드에서 연다 */}
        <PetSheet open={openPet} onClose={()=>setOpenPet(false)}
          dark={kidSkin!=="cute"} stage={getPetStage(childId)} skin={kidSkin}
          themeMain={th.main} boxName={TM.box} boxEmoji={TM.boxEmoji} />
        {/* 보물창고 시트 — 캐릭터 탭 '보물창고' 카드에서 연다 */}
        <TreasureSheet open={openTreasure} onClose={()=>setOpenTreasure(false)}
          dark={kidSkin!=="cute"} skin={kidSkin} treasure={getChildTreasure(childId)}
          onOpen={openTreasureBox} themeMain={th.main} faint={CT.faint}
          boxName={TM.box} bookEmoji={TM.bookEmoji} bookName={TM.book} />
        {/* 아이템 상점 시트 — 캐릭터 탭 '아이템 상점' 카드에서 연다 */}
        <ItemShopSheet open={openRewardShop} onClose={()=>setOpenRewardShop(false)}
          dark={kidSkin!=="cute"} skin={kidSkin} coin={getChildCoin(childId)}
          rewards={getChildRewards()} hasPending={(id)=>hasPendingRewardRequest(childId,id)}
          onRequest={requestReward} themeMain={th.main}
          coinName={TM.coin} coinEmoji={TM.coinEmoji} goldDark={GP.dark} gold={GP.gold}
          approvedCount={getApprovedRewardCount(childId)} />
        {/* ── 아바타 꾸미기 상점 모달 (신규) ── */}
        <EquipmentShop
          open={showEquipShop}
          onClose={()=>setShowEquipShop(false)}
          coins={getChildCoin(childId)}
          owned={getAvatarOwned(childId)}
          equipped={getAvatarEquipped(childId)}
          baseCharImg={getAvatarBaseCharImg(childId)}
          gender={(children.find(c=>c.id===childId)?.gender)==="girl"?"girl":"boy"}
          onBuy={buyAvatarItem}
          onToggle={toggleAvatarItem}
        />
        {/* 발견 도감 — 탐험일지의 '도감' 버튼으로 연다 */}
        <DiscoveryBook
          open={openDiscoveryBook}
          onClose={()=>setOpenDiscoveryBook(false)}
          data={discoveryData}
          childId={childId}
          childName={children.find(c=>c.id===childId)?.name||""}
        />

        {/* 아이용 헤더 - RPG 상태창 */}
        <div style={kidSkin==="cute"
          ?{position:"relative",zIndex:1,background:`radial-gradient(130% 100% at 85% -20%, ${mixWhite(th.main,0.30)}, transparent 60%), ${GP.headerBg}`,
            padding:"18px 18px 20px",color:GP.onDark,borderRadius:"0 0 32px 32px",boxShadow:`0 10px 32px ${th.main}33`,overflow:"hidden"}
          // 탐험(목업형): 헤더를 장면 위 absolute 오버레이로 — 높이와 무관하게 배경이 화면 최상단까지 참
          :{position:"absolute",top:0,left:0,right:0,zIndex:6,
            background:"linear-gradient(180deg, rgba(245,250,255,0.30) 0%, rgba(245,250,255,0.0) 62%, transparent 100%)",
            padding:"18px 18px 0",color:GP.onDark,pointerEvents:"none"}}>
          {/* 헤더 장식 버블 (베이커리만) */}
          {kidSkin==="cute"&&<>
          <div style={{position:"absolute",top:-30,right:30,width:90,height:90,borderRadius:"50%",background:`${th.main}1f`,pointerEvents:"none"}}/>
          <div style={{position:"absolute",bottom:-24,left:-10,width:70,height:70,borderRadius:"50%",background:GP.bubble,pointerEvents:"none"}}/>
          </>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:kidSkin==="cute"?"center":"flex-start",position:"relative",pointerEvents:"auto"}}>
            {kidSkin==="cute" ? (
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:GP.chipBg,border:`2.5px solid ${GP.chipBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:"0 4px 14px rgba(0,0,0,0.10)"}}>{_skin.selectEmoji}</div>
              <div>
                <p style={{fontSize:13,opacity:0.75,margin:0,fontWeight:900,letterSpacing:1.5,color:GP.onDarkSub}}>BAKER</p>
                <h1 style={{fontSize:24,fontWeight:900,margin:"3px 0 0",color:GP.onDark}}>{curChild?.name}</h1>
              </div>
            </div>
            ) : (()=>{
              // 개방감: 나침반·PLAYER·이름 대신 말풍선 문구를 헤더 텍스트로 (목업 스타일: 진한 글자 + 초록 2색)
              const _q=getTodayQuestProgress(childId,childDate||TODAY);
              const _msg=getProgressMessage(_q.percent,_q.total);
              // 문구 끝 이모지는 글자보다 커 보여서 분리해 작게 표시
              const _em=_msg.match(/([\p{Extended_Pictographic}\u{FE0F}\u{200D}]+)\s*$/u);
              const _emoji=_em?_em[1]:"";
              // 줄바꿈은 문구 데이터의 \n이 정한다 (gameData.jsx의 SKINS[].progress).
              // 예전엔 여기서 '첫 띄어쓰기'를 기계적으로 잘라 "거의 / 다 왔어, 조금만 더!"처럼
              // 의미가 끊겼다. \n이 없는 문구는 그냥 한 줄로 나온다.
              const _lines=(_em?_msg.slice(0,_em.index):_msg).trimEnd().split("\n");
              // 꾸미기 배경(darkStage: 밤 톤) 장착 시 무대가 어두워짐 → 응원문구를 밝은 크림색+어두운 그림자로 반전해 가독성 유지
              const _onDark=!!getEquipped(childId,"bg")?.darkStage;
              /* "전부 클리어!"만 있으면 심심하다 (사용자 확정 ⑥) — 발견 지점을 지나간
                 날엔 그 아래에 오늘의 발견 한 줄 + (이벤트 날) 만남 한 줄을 작게 붙인다.
                 발견은 미션과 무관하므로 미션 진행 문구("조금만 더!") 아래에도 붙을 수 있다.
                 [버그 수정] 만남(이벤트)은 발견과 완전히 별개다 — 예전엔 발견이 있는 날에만
                 만남 줄을 계산해서, 지도엔 동물이 나타났는데 무대엔 아무 말이 없는 날이 있었다
                 (학원이 없는 날·아직 발견 지점을 안 지난 시간대). 이제 각자 판정한다. */
              const _dde=getDiscoveryOn(discoveryData,childId,childDate||TODAY);
              const _ddi=_dde?getDiscovery(_dde.id):null;
              const _dev=rollEvent(childId,childDate||TODAY);
              /* [사용자 확정 2026-08-05] 전설 탈것이 걸린 날 뜨던 한 줄
                 ("✨ 오늘은 특별한 탐험! 🐉 드래곤과 함께 떠나요!")은 뺐다.
                 무대 문구는 응원 한 줄 + 발견/만남 한 줄이면 충분하다.
                 탈것은 미션 탭에서 직접 타는 것으로 충분히 드러난다. */
              // 써라운드는 그 자체가 Bold(700) 폰트라 예전의 0.4px 스트로크 보정은 제거 (겹치면 뭉개진다)
              return (
                <h1 style={{fontFamily:"'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif",fontSize:22,fontWeight:400,margin:"30px 0 0 30px",position:"relative",top:20,left:7,lineHeight:1.3,letterSpacing:"0.01em",maxWidth:"62%",color:_onDark?"#FFF3D9":"#5D4633",
                  // 밝은 무대: 흰 글로우 대신 옅은 웜브라운 그림자 — 흰 구름 위에서도 글자가 묻히지 않게
                  textShadow:_onDark?"0 1px 2px rgba(10,20,15,0.6), 0 3px 14px rgba(0,0,0,0.4)":"0 1px 2px rgba(93,70,51,0.30), 0 2px 10px rgba(93,70,51,0.18)"}}>
                  {_lines.map((ln,i)=><Fragment key={i}>{i>0&&<br/>}{ln}</Fragment>)}
                  {_emoji&&<span style={{fontSize:"0.64em",verticalAlign:"baseline",marginLeft:3}}>{_emoji}</span>}
                  {/* 발견·만남 줄은 응원 문구에서 한 뼘 떨어뜨린다 (사용자 조정: 9→18px) */}
                  {_ddi&&<span style={{display:"block",fontSize:13.5,marginTop:18,opacity:0.96}}>{_ddi.emoji} {_ddi.msg}</span>}
                  {_dev&&<span style={{display:"block",fontSize:13.5,marginTop:_ddi?4:18,opacity:0.9}}>{_dev.emoji} {_dev.msg}</span>}
                </h1>
              );
            })()}
            <div style={{display:"flex",flexDirection:"column",gap:kidSkin==="cute"?7:9,alignItems:kidSkin==="cute"?"stretch":"flex-end"}}>
              {/* [탐험] 사용자 원화 원형 뱃지 버튼 2종 위아래 배치 (엄마용 / 아이 전환) — 베이커리는 기존 칩·셀렉트 유지 */}
              {kidSkin==="cute"?(
              <div style={{display:"flex",gap:7,alignItems:"center",justifyContent:"flex-end"}}>
                <button onClick={()=>{ setAppMode("parent"); setTab("home"); }}
                  style={{...jellyChip({border:`1.5px solid ${GP.chipBorder}`,background:GP.chipBg,borderRadius:14}),flex:children.length>1?1:"none",color:GP.chipText,padding:"9px 13px",fontSize:13,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",boxShadow:`0 3px 9px ${th.main}26`,textShadow:"none"}}>
                  👩 엄마용
                </button>
              </div>
              ):(
              <button onClick={()=>{ setAppMode("parent"); setTab("home"); }} className="jelly-tap"
                style={{background:"none",border:"none",padding:0,cursor:"pointer",lineHeight:0}}>
                <img src="assets/btn-parent.webp" alt="엄마용"
                  style={{width:52,height:"auto",display:"block",filter:"drop-shadow(0 3px 9px rgba(155,114,74,0.30))"}}/>
              </button>
              )}
              {children.length>1&&(kidSkin==="cute"?(
                <select value={childId} onChange={e=>{
                  setChildId(e.target.value);
                  setChildDate(TODAY);
                  setChildTab("area");
                  setShowChildRewards(false);
                  setShowChildXP(false);
                  setOpenRewardId(null);
                }} style={{...jellyChip({border:`1.5px solid ${GP.chipBorder}`,background:GP.chipBg,borderRadius:14}),width:"100%",boxSizing:"border-box",color:GP.chipText,padding:"9px 10px",fontSize:13,fontWeight:900,outline:"none",boxShadow:`0 3px 9px ${th.main}26`,textShadow:"none"}}>
                  {children.map(c=>(
                    <option key={c.id} value={c.id} style={{color:C.text}}>{getGenderEmoji(c)} {c.name}</option>
                  ))}
                </select>
              ):(
                /* 아이 전환 뱃지: 그림 위에 투명 select를 겹쳐 네이티브 아이 선택 메뉴 유지 */
                <div className="jelly-tap" style={{position:"relative",lineHeight:0}}>
                  <img src="assets/btn-child-switch.webp" alt="아이 전환"
                    style={{width:52,height:"auto",display:"block",filter:"drop-shadow(0 3px 9px rgba(155,114,74,0.30))"}}/>
                  <select value={childId} onChange={e=>{
                    setChildId(e.target.value);
                    setChildDate(TODAY);
                    setChildTab("area");
                    setShowChildRewards(false);
                    setShowChildXP(false);
                    setOpenRewardId(null);
                  }} style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0,cursor:"pointer"}}>
                    {children.map(c=>(
                      <option key={c.id} value={c.id} style={{color:C.text}}>{getGenderEmoji(c)} {c.name}</option>
                    ))}
                  </select>
                </div>
              ))}
              {/* 아바타 표시 전환 뱃지 — 우측 상단 세로 3번째 (엄마용-아이전환-아바타, 사용자 확정 순서)
                  marginTop 2: 뱃지 원화의 여백 차이로 2·3번째 사이가 좁아 보이는 착시 보정 */}
              {kidSkin!=="cute"&&(
                <button onClick={toggleCharDisplayMode} className="jelly-tap"
                  style={{background:"none",border:"none",padding:0,marginTop:2,cursor:"pointer",lineHeight:0}}>
                  <img
                    src={getCharMode(childId)===CHAR_DISPLAY_AVATAR?"assets/btn-growth-character.webp":"assets/btn-my-avatar.webp"}
                    alt={getCharMode(childId)===CHAR_DISPLAY_AVATAR?"성장캐릭터 보기":"내 아바타 보기"}
                    style={{width:52,height:"auto",display:"block",filter:"drop-shadow(0 3px 9px rgba(155,114,74,0.30))"}}/>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── 대형 캐릭터 영웅 무대 (메인 주인공) ── */}
        {/* 무대 — src/components/HeroStage.jsx 로 분리 (CLAUDE.md 3). 값·함수는 D 하나로 전달 */}
        <HeroStage D={{ GP, th, kidSkin, childId, childDate, children, discoveryData, dungeonShinyBg, DungeonScenery, BakeryScenery, AdventureBgScenery, getAvatarBaseCharImg, getAvatarEquipped, getCharMode, getChildLevel, getEquipped, getPet, getProgressMessage, getSelectedTitle, getTodayQuestProgress, setChildTab, toggleCharDisplayMode }} />

        {/* 아이용 탭 */}
        {(()=>{
          const charLabel = kidSkin==="cute" ? T.tabs.character : `${getGenderEmoji(curChild)} 내 캐릭터`;
          const isCute=kidSkin==="cute";
          const tabEls = [["area",T.tabs.area],["today",T.tabs.quest],["growth",charLabel]].map(([k,label])=>{
            const on=childTab===k;
            // RPG 스킨: 선택 탭 = 테마별 판타지 3단 그라데이션 (진→중→밝).
            const fan=GP.themeFan||[mixBlack(th.main,0.30),th.main,mixWhite(th.main,0.20)];
            const tpBase=GP.themePoint||th.main;
            const rpgActiveBg=`linear-gradient(135deg, ${fan[0]} 0%, ${fan[1]} 55%, ${fan[2]} 100%)`;
            return (
            <button key={k} onClick={()=>setChildTab(k)} className="jelly-tap"
              style={{flex:1,position:"relative",overflow:"hidden",
                border:isCute?"none":(on?"1px solid rgba(255,255,255,.15)":"1px solid rgba(255,255,255,.10)"),
                borderRadius:14,padding:"12px 4px",
                background:on?(isCute?(GP.tabActive||`linear-gradient(135deg, ${GP.gold}, ${th.main})`):rpgActiveBg):"transparent",
                color:on?"#fff":(isCute?GP.boxSub:"rgba(255,255,255,.86)"),fontSize:14.5,fontWeight:900,cursor:"pointer",letterSpacing:0.3,whiteSpace:"nowrap",
                boxShadow:on?(isCute?`0 5px 16px ${th.main}44`:`0 0 18px rgba(255,255,255,.10), 0 0 30px ${tpBase}55, inset 0 1px 0 rgba(255,255,255,.18)`):"none",
                textShadow:on&&!isCute?"0 1px 3px rgba(20,15,60,.4)":(!isCute?"0 1px 3px rgba(0,0,0,.6)":"none"),
                animation:on?"tabBounce .4s ease-out":"none",transition:"color .2s"}}>
              {label}
            </button>
          );});
          // 베이커리: 기존 카드형 탭 유지
          if(isCute) return (
            <div style={{position:"relative",zIndex:1,display:"flex",background:GP.boxSolid,margin:"16px 16px 0",borderRadius:18,padding:6,border:`1px solid ${GP.boxBorder}`,boxShadow:SHADOW.md,gap:6}}>
              {tabEls}
            </div>
          );
          // 탐험: 하단 시트(레벨바+3타일) — 표시부는 HomeSheet 컴포넌트로 분리(CLAUDE.md 3번 점진 분리)
          const _cur=getChildLevel(childId);
          const _qp=getTodayQuestProgress(childId,childDate||TODAY);
          const _tiles=[
            {k:"area",title:"탐험",sub:`${childTodayAc.length}곳`,icon:"🗺️"},
            {k:"today",title:"미션",sub:_qp.total>0?`${_qp.total-Math.round(_qp.total*_qp.percent/100)}개 남음`:"지금 주세요",icon:"🎯"},
            {k:"growth",title:"캐릭터",sub:`레벨 ${_cur.level}`,icon:getGenderEmoji(curChild)},
          ];
          return (
            <HomeSheet dateNav={dateNav}
              tiles={_tiles} activeTab={childTab} onSelect={setChildTab} />
          );
        })()}

        <div key={childTab} className={kidSkin==="cute"?undefined:"amTabFill"} style={{padding:kidSkin==="cute"?"16px":"6px 16px 16px",position:"relative",zIndex:2,animation:"popInUp .35s ease-out",background:kidSkin==="cute"?undefined:"#F0F3F3"}}>
          {/* ── 탐험장소 탭 (학원카드) ── */}
          {childTab==="area"&&(
            <>
              {kidSkin==="cute"&&<div style={{marginBottom:12}}>{dateNav}</div>}
              {/* 오늘의 탐험 장소 요약 카드 (가는 학원 이름 + 총 곳 수) */}
              {(()=>{
                const total=childTodayAc.length;
                // 링에 넘길 학원별 데이터(시각·수업길이·아이콘·미션완료율)
                const ringItems=childTodayAc.map(ac=>{
                  const sc=getScheduleForDay(ac,childTodayDN);
                  const e=getDailyEntry(childId,ac.id,childDate);
                  const hw=e.homeworks||[], td=e.todos||[];
                  const totalCnt=hw.length+td.length;
                  const doneCnt=hw.filter(h=>h.done).length+td.filter(t=>t.done).length;
                  return {
                    id:ac.id, name:ac.name, color:ac.color,
                    time:sc?.time||"", duration:sc?.duration||40,
                    icon:getAcademyTheme(ac.name,kidSkin).icon,
                    done:doneCnt, total:totalCnt,
                  };
                });
                // [탐험] 사용자 확정: '오늘의 탐험 장소' 헤더·N곳 배지·올리브 카드 삭제 —
                //        지도를 탭 바로 아래에서 화면 폭 풀블리드로 확장 (콘텐츠 패딩 상쇄)
                if(kidSkin!=="cute"){
                  if(total===0) return null; // 0곳이면 아래 '오늘은 탐험 장소가 없어요' 박스만
                  return (
                    <>
                    {/* 섹션 구분 — 탐험지도 (캐릭터 탭 즐기기·내기록과 같은 디자인, 갈색톤 — 사용자 확정. 탭과의 여백 축소) */}
                    <div style={{display:"flex",alignItems:"center",gap:12,margin:"-4px 2px 12px"}}>
                      <div style={{flex:1,height:2,borderRadius:2,background:"linear-gradient(90deg, rgba(138,107,71,0) 10%, rgba(138,107,71,0.4))"}}/>
                      <span style={{flexShrink:0,fontSize:13.5,fontWeight:900,letterSpacing:0.4,color:"#8A6B47"}}>🗺️ 탐험지도</span>
                      <div style={{flex:1,height:2,borderRadius:2,background:"linear-gradient(90deg, rgba(138,107,71,0.4), rgba(138,107,71,0) 90%)"}}/>
                    </div>
                    <div style={{margin:"-4px -16px 26px"}}>
                      <AdventureMap
                        items={ringItems}
                        fullBleed
                        onPick={setJournalAcId}
                        mode={isChildToday?"today":(childDate<TODAY?"past":"future")}
                        charEmoji={getMapWalker(th.main, curChild?.gender)}
                        /* (삭제됨) 아이 머리 위 발견 말풍선(bubble) — 무대의 발견 한 줄과
                           중복이라 뺐다 (사용자 확정). 발견 표시는 발견 지점 칩이 계속 맡는다. */
                        spark={(()=>{
                          // 길 위 '오늘의 발견' 지점 — 자리는 날마다 다르고(고정 시드), 발견 전엔 ✨만.
                          // gain: 펫 연결 발견이면 발견 팝 순간 "🍖 먹이 +1"이 그 물건 위로 떠오른다.
                          const _dd=childDate||TODAY;
                          const _de=getDiscoveryOn(discoveryData,childId,_dd);
                          const _d=_de?getDiscovery(_de.id):null;
                          return {t:rollSparkT(childId,_dd),emoji:_d?.emoji||null,found:!!_d,gain:_d?.pet||null};
                        })()}
                        onSparkPass={()=>handleSparkPass(childDate||TODAY)}
                        eventId={rollEvent(childId,childDate||TODAY)?.id||null}
                        /* 지도에 오늘 나오는 동물 두 마리 (사용자 확정: 다섯 중 랜덤 2).
                           이벤트 동물이 그 다섯 중 하나면 반드시 포함된다 —
                           없는 동물 위에 👋 말풍선만 뜨는 일이 없도록. */
                        dayAnimals={rollMapAnimals(childId,childDate||TODAY,rollEvent(childId,childDate||TODAY)?.id||null)}
                        /* 무지개는 동물 뽑기와 별개로 드물게(5%) 뜬다 */
                        showRainbow={rollRainbow(childId,childDate||TODAY,rollEvent(childId,childDate||TODAY)?.id||null)}
                      />
                    </div>
                    </>
                  );
                }
                return (
                  <div style={kidSkin==="cute"
                    ?{position:"relative",overflow:"hidden",background:`linear-gradient(160deg, ${mixWhite(th.main,0.55)}, ${mixWhite(th.main,0.32)})`,border:`2px solid #fff`,borderRadius:34,padding:"16px",marginBottom:14,color:GP.boxText,boxShadow:`0 14px 30px ${th.main}3a, inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -8px 18px ${th.main}22`,boxSizing:"border-box",display:"flex",flexDirection:"column",animation:"jellyIn .5s cubic-bezier(.34,1.56,.64,1) both"}
                    // 탐험 탭(탐험): '풀숲 들판' 느낌 — Olive(#A9B448) 계열 그라데이션 + 은은한 종이 질감, 글씨는 딥올리브로 대비
                    :{position:"relative",overflow:"hidden",background:`radial-gradient(1.3px 1.3px at 20% 30%, rgba(255,255,255,0.3), transparent), radial-gradient(1.2px 1.2px at 70% 18%, rgba(255,255,255,0.25), transparent), radial-gradient(1.3px 1.3px at 84% 66%, rgba(255,255,255,0.25), transparent), linear-gradient(150deg, #CFE175, #C2D65B)`,border:"1px solid #8EA54A",borderRadius:GP.radCard,padding:"16px",marginBottom:14,color:"#48663D",boxShadow:"0 10px 30px rgba(90,102,44,0.28), inset 0 1px 0 rgba(255,255,255,0.25)",boxSizing:"border-box",display:"flex",flexDirection:"column"}}>
                    <DungeonCardGlow/>
                    {kidSkin==="cute"&&<div style={{position:"absolute",top:0,left:0,right:0,height:"45%",background:"linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))",borderRadius:"34px 34px 50% 50%",pointerEvents:"none"}}/>}
                    <div style={{position:"absolute",top:-26,right:-20,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,0.07)",pointerEvents:"none"}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:total>0?4:0,position:"relative"}}>
                      <div>
                        {kidSkin==="cute"&&T.areaTag&&<p style={{fontSize:13,opacity:0.75,margin:0,fontWeight:900,letterSpacing:1.2}}>{T.areaTag}</p>}
                        <p style={{fontSize:20,fontWeight:900,margin:"3px 0 0"}}><span style={{display:"inline-block",animation:"floatBob 2.6s ease-in-out infinite"}}>{T.areaCountIcon}</span> {isChildToday?T.todayArea:`${childDt.getMonth()+1}/${childDt.getDate()} ${T.dateAreaSuffix}`}</p>
                      </div>
                      <div style={{borderRadius:999,padding:"7px 16px",background:kidSkin==="cute"?`radial-gradient(circle at 38% 30%, #fff, ${mixWhite(th.main,0.55)})`:"#EEF4D7",border:`${kidSkin==="cute"?"3px":"2px"} solid ${kidSkin==="cute"?"#fff":"#DCE8B4"}`,display:"flex",alignItems:"center",gap:5,boxShadow:kidSkin==="cute"?`0 5px 14px ${th.main}4a, inset 0 2px 4px rgba(255,255,255,0.9)`:"none",flexShrink:0,whiteSpace:"nowrap"}}>
                        <span style={{fontSize:18,fontWeight:900,color:kidSkin==="cute"?th.main:"#48663D",lineHeight:1}}>{T.areaCountIcon} {total}</span>
                        <span style={{fontSize:13,fontWeight:900,opacity:0.85,lineHeight:1}}>곳</span>
                      </div>
                    </div>
                    {total>0&&(
                    <div style={{position:"relative",marginTop:8}}>
                      {/* 탐험: 그림책 초원 맵(AdventureMap — 사용자 원화 배경+건물 오버레이) / 베이커리: 기존 캔디랜드 IslandMap 유지 */}
                      {kidSkin==="cute"?(
                      <IslandMap
                        items={ringItems}
                        night={false}
                        mode={isChildToday?"today":(childDate<TODAY?"past":"future")}
                        charEmoji={(()=>{
                          const evo=getCharacterEvolution(childId);
                          const g=curChild?.gender==="girl"?"girl":"boy";
                          return evo?.avatar?.[g] || evo?.emoji || "";
                        })()}
                      />
                      ):(
                      <AdventureMap
                        items={ringItems}
                        mode={isChildToday?"today":(childDate<TODAY?"past":"future")}
                        charEmoji={getMapWalker(th.main, curChild?.gender)}
                      />
                      )}
                    </div>
                    )}
                  </div>
                );
              })()}
              {/* 탐험장소 선택 줄 — 시간순 학원을 지도 건물 아이콘으로 나열, 누르면 아래 탐험일지에 표시 (사용자 확정) */}
              {kidSkin!=="cute"&&childTodayAc.length>0&&(()=>{
                const mOf=(t)=>{const [h,m]=String(t||"23:59").split(":").map(Number);return (h||0)*60+(m||0);};
                const jList=[...childTodayAc].sort((a,b)=>mOf(getClassTime(a,childTodayDN))-mOf(getClassTime(b,childTodayDN)));
                const selId=childTodayAc.some(a=>a.id===journalAcId)?journalAcId:pickJournalAc(childTodayAc,childTodayDN,isChildToday);
                // 진행 상태(지나온/현재) — 오늘만 시간 기준, 과거 날짜는 전부 지나온 것으로
                const _now=new Date(), _nowMin=_now.getHours()*60+_now.getMinutes();
                const curId=pickJournalAc(childTodayAc,childTodayDN,isChildToday);
                const isPast=(ac)=>{
                  if(childDate<TODAY) return true;
                  if(!isChildToday) return false;
                  const sc=getScheduleForDay(ac,childTodayDN);
                  return _nowMin >= mOf(sc?.time)+(sc?.duration||40);
                };
                return (
                  <AdventureSpotPicker
                    items={jList.map(ac=>({id:ac.id,name:ac.name,icon:getAcademyTheme(ac.name,kidSkin).icon,
                      passed:isPast(ac), current:isChildToday&&ac.id===curId}))}
                    selectedId={selId}
                    onSelect={setJournalAcId}
                  />
                );
              })()}
              {/* 섹션 구분 — 탐험일지 (탐험 스킨 전용, 지도 아래·학원카드 위, 갈색톤 — 사용자 확정) */}
              {kidSkin!=="cute"&&(
                <div style={{display:"flex",alignItems:"center",gap:12,margin:"28px 2px 14px"}}>
                  <div style={{flex:1,height:2,borderRadius:2,background:"linear-gradient(90deg, rgba(138,107,71,0) 10%, rgba(138,107,71,0.4))"}}/>
                  <span style={{flexShrink:0,fontSize:13.5,fontWeight:900,letterSpacing:0.4,color:"#8A6B47"}}>📜 탐험일지</span>
                  <div style={{flex:1,height:2,borderRadius:2,background:"linear-gradient(90deg, rgba(138,107,71,0.4), rgba(138,107,71,0) 90%)"}}/>
                </div>
              )}
              {/* 오늘의 발견 한 줄 — 발견 지점을 지나갔으면 무엇을 찾았는지, 아직이면 펫이 흘리는 힌트.
                  힌트는 오늘 발견의 hint라 "오늘은 반짝이는 걸 찾을 것 같아!" → 기대하며 시작하게 된다. */}
              {kidSkin!=="cute"&&(()=>{
                const _dd=childDate||TODAY;
                const _de=getDiscoveryOn(discoveryData,childId,_dd);
                const _d=_de?getDiscovery(_de.id):null;
                return (
                  <div style={{display:"flex",alignItems:"center",gap:9,margin:"0 2px 14px",padding:"9px 13px",borderRadius:14,
                    background:_d?"rgba(255,255,255,0.72)":"rgba(138,107,71,0.07)",
                    border:_d?"1.5px solid rgba(138,107,71,0.32)":"1.5px dashed rgba(138,107,71,0.3)"}}>
                    <span style={{fontSize:19,flexShrink:0}}>{_d?_d.emoji:"🐾"}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{margin:0,fontSize:10.5,fontWeight:900,color:"#A2917C",letterSpacing:0.3}}>🌿 오늘의 발견</p>
                      <p style={{margin:"1px 0 0",fontSize:13,fontWeight:800,color:_d?"#5A4430":"#8C7E6B",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {_d?_d.name:getTodayHint(childId,_dd)}
                      </p>
                    </div>
                    <button onClick={()=>setOpenDiscoveryBook(true)}
                      style={{flexShrink:0,border:"1.5px solid rgba(138,107,71,0.4)",background:"#fff",color:"#6B523A",
                        borderRadius:999,padding:"6px 11px",fontSize:11.5,fontWeight:900,cursor:"pointer",
                        fontFamily:"'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif"}}>
                      📖 도감 {getCollectedCount(discoveryData,childId)}
                    </button>
                  </div>
                );
              })()}
              {/* 오늘 학원 일정 섹션 */}
              <div style={{marginTop:2,marginBottom:14}}>
                {childTodayAc.length===0?(
                  <div style={{textAlign:"center",padding:"28px 10px",color:kidSkin==="cute"?C.sub:"#8C7E6B",background:kidSkin==="cute"?"#fff":"#F8F3E8",borderRadius:20,border:kidSkin==="cute"?`1px dashed ${C.border}`:"1px dashed #D5BE96"}}>
                    <p style={{fontSize:38,margin:0,animation:"wiggle 2.4s ease-in-out infinite"}}>{T.noAreaEmoji}</p>
                    <p style={{fontSize:16,fontWeight:800,margin:"8px 0 0"}}>{T.noArea}</p>
                  </div>
                ):kidSkin!=="cute"?(()=>{
                  // [탐험] 양피지 탐험일지 — 선택된 학원 1곳만, 책장 넘김(PageFlip)으로 전환 (사용자 확정)
                  const mOf=(t)=>{const [h,m]=String(t||"23:59").split(":").map(Number);return (h||0)*60+(m||0);};
                  const jList=[...childTodayAc].sort((a,b)=>mOf(getClassTime(a,childTodayDN))-mOf(getClassTime(b,childTodayDN)));
                  const selId=childTodayAc.some(a=>a.id===journalAcId)?journalAcId:pickJournalAc(childTodayAc,childTodayDN,isChildToday);
                  const jIdx=Math.max(0,jList.findIndex(a=>a.id===selId));
                  const ac=jList[jIdx];
                  const goJournal=(d)=>{if(jList.length<2)return;setJournalAcId(jList[(jIdx+d+jList.length)%jList.length].id);};
                  const sc=getScheduleForDay(ac,childTodayDN);
                  const entry=getDailyEntry(childId,ac.id,childDate);
                  const hw=entry.homeworks||[], sup=entry.supplies||[], todos=entry.todos||[];
                  const shuttleText=getShuttleText(ac,childTodayDN);
                  const totalTodoCnt=hw.length+todos.length;
                  const doneCnt=hw.filter(h=>h.done).length+todos.filter(t=>t.done).length;
                  const allDone=totalTodoCnt>0&&doneCnt===totalTodoCnt;
                  const dungeon=getAcademyTheme(ac.name,kidSkin);
                  const baseSup=(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s));
                  const rl=isChildToday?getRemainLabel(sc?.time,sc?.duration||40):null;
                  const chipSty=(checked)=>({fontSize:11,padding:"3px 11px",borderRadius:999,cursor:"pointer",fontWeight:400,transition:"all .15s",
                    fontFamily:"'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif",
                    background:checked?"rgba(127,163,90,0.30)":"rgba(122,88,50,0.10)",
                    border:checked?"1.5px solid #7FA35A":"1px solid rgba(122,88,50,0.4)",
                    color:checked?"#3E5C28":"#5A4430"});
                  return (
                    <PageFlip flipKey={ac.id} order={jIdx} total={jList.length}>
                      <AdventureJournalCard
                        onPrev={()=>goJournal(-1)} onNext={()=>goJournal(1)}
                        icon={dungeon.icon} title={dungeon.label} name={ac.name}
                        time={sc?.time?toKoreanTime(sc.time):"-"}
                        remain={rl?`${rl.icon} ${rl.text}`:""}
                        shuttle={shuttleText||"없음"}
                        missionText={totalTodoCnt===0?"미션 없음":allDone?"미션 클리어! 🎉":`미션 ${totalTodoCnt-doneCnt}개 남음`}
                        missionTone={totalTodoCnt===0?"#8A7458":allDone?"#4E7B3A":"#B4652A"}
                        supplies={<>
                          {baseSup.map((s,i)=>{
                            const checked=(entry.checkedSupplies||[]).includes(s);
                            return <button key={`b${i}`} onClick={()=>toggleSupplyChecked(childId,ac.id,childDate,s)} style={chipSty(checked)}>{checked?"✅":"⬜"} {s}</button>;
                          })}
                          {sup.map((s,i)=>{
                            const key="+"+s; const checked=(entry.checkedSupplies||[]).includes(key);
                            return <button key={`s${i}`} onClick={()=>toggleSupplyChecked(childId,ac.id,childDate,key)} style={chipSty(checked)}>{checked?"✅":"⬜"} +{s}</button>;
                          })}
                          {baseSup.length===0&&sup.length===0&&<span style={{fontSize:13,color:"#8A7458",fontWeight:700,alignSelf:"center"}}>없음</span>}
                        </>}
                      />
                    </PageFlip>
                  );
                })():(
                  childTodayAc.map(ac=>{
                    const sc=getScheduleForDay(ac,childTodayDN);
                    const entry=getDailyEntry(childId,ac.id,childDate);
                    const hw=entry.homeworks||[], sup=entry.supplies||[], todos=entry.todos||[];
                    const shuttleText=getShuttleText(ac,childTodayDN);
                    const totalTodoCnt=hw.length+todos.length;
                    const doneCnt=hw.filter(h=>h.done).length+todos.filter(t=>t.done).length;
                    const allDone=totalTodoCnt>0&&doneCnt===totalTodoCnt;
                    const dungeon=getAcademyTheme(ac.name,kidSkin);
                    // ── 탐험 카드 색 체계 (흰 카드 폐기, 다크 톤 통일) ── (이 분기는 베이커리 전용, dk는 항상 false)
                    const dk = kidSkin!=="cute";
                    // 카드 본체: 테마색을 머금은 다크. 헤더는 학원색을 살린 진한 톤.
                    const acCardBg = dk ? "linear-gradient(180deg, #3A4156 0%, #333A4C 100%)" : "#fff"; // 10% 밝게 + 남색기 완화
                    const acTx = dk ? "#FFFFFF" : C.text;
                    const acSub = dk ? "rgba(255,255,255,0.66)" : C.sub;
                    const acInner = dk ? "rgba(255,255,255,0.07)" : CT.faint;        // 내부 강조 박스
                    const acInnerBorder = dk ? "rgba(255,255,255,0.12)" : C.border;
                    return (
                      <div key={ac.id} style={{borderRadius:dk?26:(ST.on?(GP.radMid||22):22),overflow:"hidden",marginBottom:14,background:acCardBg,border:dk?"1px solid rgba(255,255,255,0.10)":`2px solid ${ST.on?softTint(ac.color,0.55):ac.color+"40"}`,boxShadow:dk?"0 10px 26px rgba(0,0,0,0.18)":(ST.on?`0 6px 18px ${GP.boxShadowCol}`:`0 8px 26px ${ac.color}26, 0 2px 6px rgba(0,0,0,0.06)`)}}>
                        {/* 헤더 - 탐험:진한 그라데이션 / 베이커리:부드러운 학원색 파스텔 */}
                        <div style={{position:"relative",overflow:"hidden",background:ST.on?`linear-gradient(135deg, ${softTint(ac.color,0.50)}, ${softTint(ac.color,0.62)})`:`linear-gradient(135deg, ${mixBlack(ac.color,0.42)}, ${mixBlack(ac.color,0.18)})`,padding:"11px 15px",display:"flex",alignItems:"center",gap:12}}>
                          {/* 헤더 장식 빛무리/버블 (베이커리 모드에서만) */}
                          {ST.on&&<>
                          <div style={{position:"absolute",top:-30,right:-20,width:110,height:110,borderRadius:"50%",background:"rgba(255,255,255,0.45)",pointerEvents:"none"}}/>
                          <div style={{position:"absolute",bottom:-26,left:30,width:70,height:70,borderRadius:"50%",background:"rgba(255,255,255,0.35)",pointerEvents:"none"}}/>
                          </>}
                          <div style={{position:"relative",width:50,height:50,borderRadius:16,background:ST.on?"rgba(255,255,255,0.7)":"rgba(255,255,255,0.22)",border:ST.on?`2px solid rgba(255,255,255,0.85)`:"2px solid rgba(255,255,255,0.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:ST.on?"0 3px 9px rgba(150,110,120,0.18)":"0 4px 12px rgba(0,0,0,0.22)"}}>
                            {dungeon.icon}
                          </div>
                          <div style={{flex:1,minWidth:0,position:"relative"}}>
                            {/* 탐험 구조로 통일: 학원명(위) → 라벨(아래) + 남은시간 배지(우측 하단) */}
                            <p style={{fontSize:dk?17:16,fontWeight:dk?400:900,margin:0,color:dk?"#fff":GP.boxText,textShadow:dk?"0 1px 3px rgba(0,0,0,0.25)":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.1}}>{ac.name}</p>
                            <p style={{fontSize:11.5,fontWeight:900,color:dk?"rgba(255,255,255,0.78)":GP.boxSub,margin:"3px 0 0",letterSpacing:1,paddingRight:96,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{dungeon.label}</p>
                            {isChildToday&&(()=>{
                              const rl=getRemainLabel(sc?.time,sc?.duration||40);
                              if(!rl) return null;
                              const tx = dk
                                ? (rl.tone==="urgent"?"#FFC089":rl.tone==="now"?"#A6F0CF":rl.tone==="soon"?"#FFFFFF":"rgba(255,255,255,0.6)")
                                : (rl.tone==="urgent"?C.orange:rl.tone==="now"?C.green:rl.tone==="soon"?GP.boxText:GP.boxSub);
                              return <span style={{position:"absolute",right:0,bottom:0,fontSize:10.5,fontWeight:900,color:tx,background:dk?mixBlack(ac.color,0.62):"rgba(255,255,255,0.9)",border:dk?`1px solid ${mixBlack(ac.color,0.35)}`:`1px solid ${ac.color}33`,borderRadius:999,padding:dk?"3px 9px":"5px 10px",whiteSpace:"nowrap",lineHeight:1.2,boxShadow:dk?"0 2px 5px rgba(0,0,0,0.20)":`0 2px 6px ${ac.color}22`}}>{rl.icon} {rl.text}</span>;
                            })()}
                          </div>
                        </div>
                        {/* 상세 정보 */}
                        <div style={{padding:"15px 16px 16px",background:dk?"linear-gradient(180deg, rgba(40,46,60,0.96), rgba(48,55,70,0.96))":"transparent"}}>
                        {/* 시간 (탐험 구조로 통일: 시작 시각만 / 남은시간은 헤더 배지로) */}
                        <p style={{fontSize:16,fontWeight:900,color:acTx,margin:"0 0 12px"}}>🕓 {toKoreanTime(sc?.time)} 시작</p>
                        {shuttleText&&<p style={{fontSize:13,color:acSub,margin:"0 0 8px"}}>🚌 셔틀 · {shuttleText}</p>}
                        {/* 준비물 (탐험 구조로 통일: ✅/⬜ 토글 버튼으로 챙김 여부 체크) */}
                        <div style={{marginTop:8,display:"flex",alignItems:"baseline",flexWrap:"wrap",gap:"6px 8px"}}>
                          <p style={{fontSize:15,fontWeight:800,color:dk?"rgba(255,255,255,0.82)":acSub,margin:0,flexShrink:0}}>🎒 준비물</p>
                          <div style={{display:"flex",flexWrap:"wrap",gap:6,flex:1,minWidth:0}}>
                            {/* 색 통일: 준비물 칩은 전부 학원색 계열, 챙기면 노랑 포인트 (탐험) */}
                            {(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s)).map((s,i)=>{
                              const checked=(entry.checkedSupplies||[]).includes(s);
                              return <button key={`b${i}`} onClick={()=>toggleSupplyChecked(childId,ac.id,childDate,s)} style={{fontSize:13,padding:"5px 12px",borderRadius:999,cursor:"pointer",background:checked?(dk?"rgba(246,209,143,0.22)":softTint(ac.color,0.62)):(dk?`${ac.color}1f`:`${ac.color}14`),border:checked?(dk?"1px solid #F6D18F":`1px solid ${ac.color}88`):`1px solid ${dk?ac.color+"55":ac.color+"33"}`,color:checked?(dk?"#FFE9BE":GP.boxText):(dk?softTint(ac.color,0.85):GP.boxText),fontWeight:800,transition:"all .15s"}}><span style={{fontSize:11,marginRight:1}}>{checked?"✅":"⬜"}</span> {s}</button>;
                            })}
                            {sup.map((s,i)=>{
                              const key="+"+s; const checked=(entry.checkedSupplies||[]).includes(key);
                              return <button key={`s${i}`} onClick={()=>toggleSupplyChecked(childId,ac.id,childDate,key)} style={{fontSize:13,padding:"5px 12px",borderRadius:999,cursor:"pointer",background:checked?(dk?"rgba(246,209,143,0.22)":softTint(ac.color,0.62)):(dk?`${ac.color}1f`:`${C.orange}14`),border:checked?(dk?"1px solid #F6D18F":`1px solid ${ac.color}88`):`1px solid ${dk?ac.color+"55":C.orange+"33"}`,color:checked?(dk?"#FFE9BE":GP.boxText):(dk?softTint(ac.color,0.85):C.orange),fontWeight:800,transition:"all .15s"}}><span style={{fontSize:11,marginRight:1}}>{checked?"✅":"⬜"}</span> +{s}</button>;
                            })}
                            {(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s)).length===0&&sup.length===0&&<span style={{fontSize:13,color:acSub}}>없음</span>}
                          </div>
                        </div>
                        {/* 미션 요약 */}
                        <div style={{marginTop:16}}>
                          {(()=>{
                            const cellFilled=(i)=> dk ? i<doneCnt : i>=totalTodoCnt-doneCnt;
                            const cellMark=(i)=>{const on=cellFilled(i);return <span key={i} style={{color:on?(dk?mixBlack(ac.color,0.1):ac.color):(dk?"rgba(255,255,255,0.26)":ac.color+"4d"),fontWeight:900}}>{on?(dk?"■":"●"):(dk?"□":"○")}</span>;};
                            const cntText=<span style={{fontSize:13,fontWeight:900,color:allDone?(dk?"rgba(255,255,255,0.8)":C.green):(dk?"#FFB072":C.orange),whiteSpace:"nowrap"}}>{totalTodoCnt===0?"":allDone?"🎉 클리어!":`${doneCnt}/${totalTodoCnt}`}</span>;
                            // 미션 6개 이상이면 칸을 라벨 아래로 펼쳐 두 줄까지 wrap
                            const stacked=totalTodoCnt>=6;
                            return (
                              <div style={{background:dk?"rgba(255,255,255,0.045)":acInner,border:`1px solid ${dk?"rgba(255,255,255,0.10)":acInnerBorder}`,borderRadius:16,padding:"12px 15px"}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,marginBottom:stacked&&totalTodoCnt>0?9:0}}>
                                  <p style={{fontSize:13,fontWeight:900,color:dk?"rgba(255,255,255,0.8)":acSub,margin:0}}>{T.remainMission}</p>
                                  {totalTodoCnt===0?<span style={{fontSize:13,fontWeight:900,color:acSub}}>미션 없음</span>
                                    :stacked?cntText
                                    :<div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                                       <div style={{display:"flex",gap:4,fontSize:15,lineHeight:1}}>{Array.from({length:totalTodoCnt}).map((_,i)=>cellMark(i))}</div>
                                       {cntText}
                                     </div>}
                                </div>
                                {stacked&&totalTodoCnt>0&&(
                                  <div style={{display:"flex",flexWrap:"wrap",gap:5,fontSize:15,lineHeight:1.4}}>
                                    {Array.from({length:totalTodoCnt}).map((_,i)=>cellMark(i))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                        </div>{/* 상세 정보 end */}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* ── 오늘 탭 ── */}
          {childTab==="today"&&(
            <>
              {/* 날짜바는 시트(HomeSheet)로 이동 — 베이커리(구 탭바)에서만 본문에 표시 */}
              {kidSkin==="cute"&&dateNav}
              {/* 오늘의 진행 요약 카드(스킨 공용) */}
              {(()=>{
                const q=getTodayQuestProgress(childId,childDate||TODAY);
                const ready=q.total-q.done-q.failed;
                /* [탐험] 진행률 카드 대신 '하루 한 탐험' 씬 (사용자 기획서 확정 —
                   %·진행바가 아니라 미션 하나 끝낼 때마다 탐험가가 실제로 이동한다).
                   기존 진행률 카드는 베이커리에서 그대로 쓴다. */
                if(kidSkin!=="cute"){
                  return (
                    /* 풀블리드 — 콘텐츠 패딩(16px) 상쇄해 양옆 꽉 차게 (사용자 확정) */
                    <div style={{margin:"0 -16px 0"}}>
                      <ExpeditionTrack
                        date={childDate||TODAY}
                        done={q.done}
                        total={q.total}
                        charImg={getMapWalker(th.main, curChild?.gender)}
                        gender={curChild?.gender==="girl"?"girl":"boy"}
                        fullBleed
                      />
                    </div>
                  );
                }
                return (
                  <div style={kidSkin==="cute"
                    ?{position:"relative",overflow:"hidden",background:`linear-gradient(160deg, ${mixWhite(th.main,0.55)}, ${mixWhite(th.main,0.32)})`,border:`2px solid #fff`,borderRadius:34,padding:"16px",marginBottom:14,color:GP.boxText,boxShadow:`0 14px 30px ${th.main}3a, inset 0 2px 6px rgba(255,255,255,0.9), inset 0 -8px 18px ${th.main}22`,boxSizing:"border-box",display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:206,animation:"jellyIn .5s cubic-bezier(.34,1.56,.64,1) both"}
                    // 미션 탭(탐험): '탐험 지도·모래 사장' 느낌 — Sand(#F6D18F) 계열 밝은 그라데이션 + 은은한 종이 질감, 글씨는 진갈색으로 대비
                    :{position:"relative",overflow:"hidden",background:`radial-gradient(1.3px 1.3px at 20% 30%, rgba(255,255,255,0.35), transparent), radial-gradient(1.2px 1.2px at 70% 18%, rgba(255,255,255,0.3), transparent), radial-gradient(1.3px 1.3px at 84% 66%, rgba(255,255,255,0.3), transparent), linear-gradient(150deg, #CFE175, #C2D65B)`,border:"1px solid #8EA54A",borderRadius:GP.radCard,padding:"16px",marginBottom:14,color:"#48663D",boxShadow:"0 10px 30px rgba(90,102,44,0.28), inset 0 1px 0 rgba(255,255,255,0.35)",boxSizing:"border-box",display:"flex",flexDirection:"column",justifyContent:"space-between",minHeight:206}}>
                    <DungeonCardGlow/>
                    {/* 젤리 광택 */}
                    {kidSkin==="cute"&&<div style={{position:"absolute",top:0,left:0,right:0,height:"45%",background:"linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0))",borderRadius:"34px 34px 50% 50%",pointerEvents:"none"}}/>}
                    <div style={{position:"absolute",top:-26,right:-20,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,0.07)",pointerEvents:"none"}}/>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,position:"relative"}}>
                      <div>
                        <p style={{fontSize:13,opacity:0.75,margin:0,fontWeight:900,letterSpacing:1.2}}>{T.dailyArea}</p>
                        <p style={{fontSize:20,fontWeight:900,margin:"3px 0 0"}}><span style={{display:"inline-block",animation:"floatBob 2.6s ease-in-out infinite"}}>{T.missionEmoji}</span> {T.todayQuest}</p>
                      </div>
                      <div style={{width:62,height:62,borderRadius:"50%",background:kidSkin==="cute"?`radial-gradient(circle at 38% 30%, #fff, ${mixWhite(th.main,0.55)})`:"#FBF3E6",border:`${kidSkin==="cute"?"3px":"2px"} solid ${kidSkin==="cute"?"#fff":"#D8BF90"}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",boxShadow:kidSkin==="cute"?`0 5px 14px ${th.main}4a, inset 0 2px 4px rgba(255,255,255,0.9)`:"none"}}>
                        <p style={{fontSize:17,fontWeight:900,margin:0,color:kidSkin==="cute"?th.main:"#8E6845"}}>{q.percent}%</p>
                        <p style={{fontSize:11,fontWeight:900,margin:0,opacity:0.8}}>{T.clearShort}</p>
                      </div>
                    </div>
                    <div style={{marginBottom:12}}>
                      <JellyBar percent={q.percent} height={14} fallbackTrack="rgba(90,102,44,0.18)" fallbackBorder="1px solid rgba(140,162,79,0.55)" fallbackFill="linear-gradient(90deg,#C0955C,#D8B57F)" />
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,position:"relative"}}>
                      <div style={{background:kidSkin==="cute"?`linear-gradient(160deg, ${mixWhite(th.main,0.9)}, ${mixWhite(th.main,0.8)})`:"#FBF3E6",borderRadius:18,padding:"9px 6px",textAlign:"center",border:kidSkin==="cute"?`2px solid ${mixWhite(th.main,0.78)}`:"none",boxShadow:kidSkin==="cute"?`0 4px 11px ${th.main}24, inset 0 1.5px 3px rgba(255,255,255,0.7)`:"none"}}>
                        <p style={{fontSize:16,margin:0}}>✅</p>
                        <p style={{fontSize:14,fontWeight:900,margin:"1px 0 0"}}>{q.done}</p>
                        <p style={{fontSize:11,opacity:0.75,margin:0}}>{T.clearShort}</p>
                      </div>
                      <div style={{background:kidSkin==="cute"?`linear-gradient(160deg, ${mixWhite(th.main,0.9)}, ${mixWhite(th.main,0.8)})`:"#FBF3E6",borderRadius:18,padding:"9px 6px",textAlign:"center",border:kidSkin==="cute"?`2px solid ${mixWhite(th.main,0.78)}`:"none",boxShadow:kidSkin==="cute"?`0 4px 11px ${th.main}24, inset 0 1.5px 3px rgba(255,255,255,0.7)`:"none"}}>
                        <p style={{fontSize:16,margin:0}}>{T.missionEmoji}</p>
                        <p style={{fontSize:14,fontWeight:900,margin:"1px 0 0"}}>{ready}</p>
                        <p style={{fontSize:11,opacity:0.75,margin:0}}>{kidSkin==="cute"||rewardAgeGroup==="kid"?"남음":"READY"}</p>
                      </div>
                      <div style={{background:kidSkin==="cute"?`linear-gradient(160deg, ${mixWhite(th.main,0.9)}, ${mixWhite(th.main,0.8)})`:"#FBF3E6",borderRadius:18,padding:"9px 6px",textAlign:"center",border:kidSkin==="cute"?`2px solid ${mixWhite(th.main,0.78)}`:"none",boxShadow:kidSkin==="cute"?`0 4px 11px ${th.main}24, inset 0 1.5px 3px rgba(255,255,255,0.7)`:"none"}}>
                        <p style={{fontSize:16,margin:0}}>❌</p>
                        <p style={{fontSize:14,fontWeight:900,margin:"1px 0 0"}}>{q.failed}</p>
                        <p style={{fontSize:11,opacity:0.75,margin:0}}>{kidSkin==="cute"||rewardAgeGroup==="kid"?"실패":"FAILED"}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 미션 전체 카드 - 항상 오늘 기준 */}
              {(()=>{
                const allTodayTodos=getChildQuestBoardItems(childId,childDate);
                if(allTodayTodos.length===0) return (
                  <div style={{padding:"30px 16px",textAlign:"center",marginTop:2,marginBottom:14,borderRadius:22,background:kidSkin==="cute"?"#fff":"#FBF7EF",border:kidSkin==="cute"?`1px dashed ${C.border}`:"1px dashed #E8D6BA"}}>
                    <p style={{fontSize:42,margin:"0 0 8px",animation:"wiggle 2.4s ease-in-out infinite"}}>🗒️</p>
                    <p style={{fontSize:17,fontWeight:900,color:kidSkin==="cute"?C.text:"#4B3A2F",margin:"0 0 4px"}}>{T.restDay}</p>
                    <p style={{fontSize:13,fontWeight:700,color:kidSkin==="cute"?C.sub:"#7E8C7B",margin:0}}>푹 쉬어도 좋아요 😌</p>
                  </div>
                );
                // 미션 강조박스 색 — 탐험:어두운 톤 / 베이커리:맑은 박스
                return (
                  <div style={{marginTop:2,marginBottom:14}}>
                    {/* 미션 아이템 목록 */}
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {allTodayTodos.map((item,idx)=>{
                        const status=getQuestStatus(item);
                        // 베이커리(cute)면 학원색을 따뜻한 쪽으로 부드럽게 보정(색 구분은 유지)
                        const acCol = item.academyColor||th.main;
                        return (
                          <div key={`${item.kind}-${item.academyId}-${item.date}-${item.id}`} style={{borderRadius:GP.radMid||22,overflow:"hidden",background:kidSkin==="cute"?(item.done?"#F7F8FB":"#fff"):(item.done?"linear-gradient(180deg,#EEEDF5 0%,#E7E5F0 100%)":item.failed?"linear-gradient(180deg,#ECEAF3 0%,#E6E4EE 100%)":`linear-gradient(180deg, ${mixWhite(acCol,0.88)} 0%, ${mixWhite(acCol,0.96)} 100%)`),border:`2px solid ${item.done?(kidSkin==="cute"?"#D8DCE6":"#C2C7D6"):item.failed?(kidSkin==="cute"?C.red+"45":"#D8D7E5"):acCol+(kidSkin==="cute"?"55":"")}`,boxShadow:item.done?"0 3px 12px rgba(20,24,60,0.06)":item.failed?"0 3px 12px rgba(0,0,0,0.05)":(kidSkin==="cute"?`0 10px 26px ${acCol}26, 0 3px 8px rgba(0,0,0,0.05)`:`0 0 18px ${acCol}40, 0 8px 24px rgba(0,0,0,0.18)`),opacity:item.done?0.82:1,marginBottom:12,animation:item.done?`squishCard .5s ease-out`:`jellyIn .4s cubic-bezier(.34,1.56,.64,1) ${idx*0.05}s both`}}>
                            {/* 스크롤 헤더 - 학원 색 띠 (클리어 시 회색) */}
                            <div style={{padding:"10px 13px",background:item.done?"#EDEFF4":item.failed?`${C.red}0A`:`linear-gradient(135deg, ${acCol}24, ${acCol}12)`,borderBottom:`1px solid ${item.done?"#DFE3EC":item.failed?C.red+"20":acCol+"18"}`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                              <div style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
                                <span style={{fontSize:20,flexShrink:0}}>{getAcademyTheme(item.academyName,kidSkin).icon}</span>
                                <p style={{fontSize:14,fontWeight:900,color:C.text,margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                  {item.academyName}
                                </p>
                              </div>
                              {/* 준비 배지: 탐험은 학원색 대신 팔레트 Sky 고정(#7BB5E6) — 쨍한 학원색이 튀지 않게 */}
                              <span style={{fontSize:11,fontWeight:900,color:item.done?"#7C8398":item.failed?"#8A8A9A":"#fff",background:item.done?"#E6E9F0":item.failed?"#ECEAF3":(kidSkin==="cute"?acCol:"#5E93C5"),border:`1px solid ${item.done?"#D2D7E2":item.failed?"#D8D7E5":(kidSkin==="cute"?"transparent":"#4E7FA9")}`,padding:"5px 12px",borderRadius:999,flexShrink:0,boxShadow:item.done||item.failed?"none":(kidSkin==="cute"?`0 6px 16px ${acCol}40`:"0 6px 16px rgba(94,147,197,0.35)")}}>
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
                                if(item.date<TODAY){ setPastQuestBlockModal({label:item.label,date:item.date}); return; }
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
                                  {item.kind==="homework"?`숙제 : ${item.label}`:`할일 : ${item.label}`}{item.byKid&&<span title="내가 추가" style={{fontSize:11,fontWeight:900,marginLeft:5,color:item.academyColor||th.main,background:`${item.academyColor||th.main}1A`,borderRadius:6,padding:"0 5px"}}>+</span>}
                                </p>
                                {item.failed
                                  ? <p style={{fontSize:13,fontWeight:900,color:C.red,margin:0}}>보상 없음</p>
                                  : kidSkin==="cute"
                                    ? <p style={{fontSize:13,fontWeight:900,color:GP.gold,margin:0}}>{getQuestRewardText(item)}</p>
                                    : (()=>{const pt=item.point||DEFAULT_HOMEWORK_SCORE;return (
                                        <div style={{display:"flex",gap:12,fontWeight:900,fontSize:15,opacity:item.done?0.7:1}}>
                                          <span style={{color:"#F6B93B"}}>{TM.xpEmoji} +{pt} {TM.xp}</span>
                                          <span style={{color:"#2EA8FF"}}>{TM.coinEmoji} +{pt} {TM.coin}</span>
                                        </div>
                                      );})()}
                              </div>
                              {!item.done&&(
                                <button onClick={()=>{
                                  if(item.date<TODAY){ setPastQuestBlockModal({label:item.label,date:item.date}); return; }
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

              {/* ── 미션 추가 버튼 (현재 보는 날짜) ── */}
              {/* [탐험] 미션 추가 버튼은 미션 탭 테마(그린 — 사용자 확정: 탭 톤 맞교환에 맞춤) */}
              {(childDate||TODAY)>=TODAY&&(
                  <button onClick={()=>{ setKidAddAcId(""); setKidAddText(""); setShowKidAddModal(true); }}
                    style={{width:"100%",...jellyBox({background:kidSkin==="cute"?GP.boxBg:"#8FA653",border:kidSkin==="cute"?`1px solid ${GP.boxBorder}`:"1px solid #9DB35F",borderRadius:16,boxShadow:kidSkin==="cute"?`0 6px 18px ${GP.boxShadowCol}`:"0 6px 18px rgba(90,102,44,0.32)"},{radius:18}),
                      padding:"13px 12px",marginBottom:14,cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                      color:kidSkin==="cute"?GP.boxText:"#FFF8EB",fontSize:16,fontWeight:900}}>
                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:kidSkin==="cute"?`linear-gradient(135deg, ${GP.gold}, ${th.main})`:"rgba(255,248,235,0.28)",color:"#fff",fontSize:17,fontWeight:900,flexShrink:0}}>＋</span>
                    미션 추가하기
                  </button>
              )}

            </>
          )}

          {/* ── 성장 탭 ── */}
          {childTab==="growth"&&(
            <>
              {/* ── 캠프 (캐릭터 탭 본문) ─────────────────────────────────────
                   [사용자 확정] 카드 목록으로 세로로 길게 늘어놓던 것을
                   텐트 하나 + 그루터기 여덟 개의 캠프 그림으로 바꿨다.
                   내용은 전부 바텀시트로 옮겨 둔 상태라(캠프 개편 1~6/6)
                   여기서 없어진 것은 '목록 겉모습'뿐이고 기능은 그대로다.
                   상태 정보(레벨·경험치·코인·XP·상장)는 텐트가 이어받았다 —
                   그래서 childHud를 따로 얹지 않는다.
                   그리기는 CampScene, 데이터·동작은 여기(App)에 남는다. */}
              {(()=>{
                const level=getChildLevel(childId);
                const pet=petView(PET_STAGES[getPetStage(childId)],getPetStage(childId),kidSkin);
                const tre=getChildTreasure(childId);
                const boxCnt=getTotalTreasureCount(childId);
                const found=getCollectedCount(discoveryData,childId);
                return (
                  <CampScene
                    title={getSelectedTitle(childId)}
                    level={level}
                    nextLevel={getNextLevel(childId)}
                    progress={getLevelProgressInfo(childId)}
                    coin={getChildCoin(childId)} xp={getChildXP(childId)}
                    labels={{coin:TM.coin,xp:TM.xp,coinEmoji:TM.coinEmoji,xpEmoji:TM.xpEmoji}}
                    stations={[
                      { key:"deco", img:"st-deco.webp", name:kidSkin==="cute"?"꾸미기 가게":"꾸미기 상점",
                        badge:`${getOwnedCount(childId)+getAvatarOwned(childId).length}개 보유`,
                        onPress:()=>setShowDecorShop(true) },
                      { key:"item", img:"st-item.webp", name:"아이템 상점",
                        badge:`총 구매 ${getApprovedRewardCount(childId)}개`,
                        onPress:()=>setOpenRewardShop(true) },
                      { key:"box", img:"st-box.webp", name:TM.book,
                        badge:boxCnt>0?`상자 ${boxCnt}개`:"상자 없음",
                        onPress:()=>setOpenTreasure(true) },
                      { key:"pet", img:"st-pet.webp", name:"나의 펫",
                        badge:pet.name, onPress:()=>setOpenPet(true) },
                      { key:"book", img:"st-book.webp", name:"발견 도감",
                        badge:`${found} / ${DISCOVERIES.length}`,
                        onPress:()=>setOpenDiscoveryBook(true) },
                      { key:"title", img:"st-title.webp", name:"상장",
                        badge:`${getUnlockedTitles(childId).length} / ${getAllTitles(childId).length}개`,
                        onPress:()=>setOpenTitle(true) },
                      { key:"streak", img:"st-streak.webp", name:"연속 달성",
                        badge:`현재 ${getQuestStreak(childId)}일`,
                        onPress:()=>setOpenStreak(true) },
                      { key:"history", img:"st-history.webp", name:T.logName||"탐험 기록",
                        badge:`최근 ${getScoreHistory(childId).length}건`,
                        onPress:()=>setOpenHistory(true) },
                    ]}
                  />
                );
              })()}
            </>
          )}
        </div>

        {/* 개발자 도구 모달 (DEV_MODE=false 시 완전히 렌더 안 됨) */}
        {/* PIN 입력 모달 */}
        {/* 범용 PIN 게이트 모달 (보상탭 진입 · 위험구역 초기화 · 개발자도구 보호) */}
        {gateAction&&(
          <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
            <div style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:350,boxSizing:"border-box"}}>
              <h3 style={{fontSize:20,fontWeight:900,margin:"0 0 6px",textAlign:"center"}}>🔒 비밀번호 확인</h3>
              <p style={{fontSize:14,fontWeight:700,color:C.sub,textAlign:"center",margin:"0 0 16px"}}>{gateAction.title}</p>
              <input type="password" inputMode="numeric" value={gatePin} autoFocus
                onChange={e=>setGatePin(e.target.value.replace(/\D/g,"").slice(0,4))}
                maxLength={4}
                onKeyDown={e=>e.key==="Enter"&&submitGatePin()}
                placeholder="비밀번호 4자리"
                style={{width:"100%",boxSizing:"border-box",padding:"14px",borderRadius:14,border:`1.5px solid ${C.border}`,fontSize:20,outline:"none",marginBottom:12,textAlign:"center",letterSpacing:6}}/>
              {parentPin==="1234"&&!pinHintSeen&&(
                <p style={{fontSize:13,fontWeight:700,color:th.main,background:`${th.main}12`,borderRadius:10,padding:"9px 12px",margin:"0 0 12px",textAlign:"center",lineHeight:1.5}}>
                  💡 처음 비밀번호는 <b>1234</b> 예요.<br/>설정 &gt; 비밀번호 변경에서 바꿀 수 있어요.
                </p>
              )}
              <button onClick={submitGatePin}
                style={{width:"100%",padding:14,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",marginBottom:8}}>
                확인
              </button>
              {recoveryQuestion&&(
                <button onClick={()=>{ setRecoveryAnswerInput(""); setShowRecoveryModal(true); }}
                  style={{width:"100%",padding:8,border:"none",background:"transparent",color:th.main,fontSize:13,fontWeight:800,cursor:"pointer",marginBottom:4,textDecoration:"underline"}}>
                  비밀번호를 잊으셨나요?
                </button>
              )}
              <button onClick={()=>{ markPinHintSeen(); setGateAction(null); setGatePin(""); }}
                style={{width:"100%",padding:12,borderRadius:14,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:15,fontWeight:700,cursor:"pointer"}}>
                취소
              </button>
            </div>
          </div>
        )}

      {/* ── 보물상자 오픈 애니메이션 모달 ── */}
      {openingTreasure&&(
        /* zIndex 9998: 보물창고가 시트(4000)로 바뀌며 연출이 그 위에 와야 한다. 결과 모달은 9999. */
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.80)",zIndex:9998,display:"flex",justifyContent:"center",alignItems:"center"}}>
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
              {treasureModal.titleReward&&(()=>{
                const dk = kidSkin!=="cute";
                return (
                <div style={{marginTop:18,padding:"14px",borderRadius:14,
                  background:dk?"linear-gradient(180deg,#3A331C 0%,#2A2413 100%)":mixWhite(th.main,0.86),
                  border:`2px solid ${dk?"#FFD86B":(kidSkin==="cute"?"#F5B301":"#F59E0B")}`,
                  boxShadow:dk?"0 0 18px rgba(255,216,107,0.30), inset 0 1px 0 rgba(255,232,160,.12)":"none"}}>
                  <p style={{margin:0,fontSize:13,fontWeight:900,color:dk?"#FFD86B":"#F5B301",textShadow:dk?"0 0 10px rgba(255,216,107,.5)":"none"}}>✨ 전설 상장 획득</p>
                  <p style={{marginTop:6,fontSize:20,fontWeight:900,margin:"6px 0 0",color:dk?"#FFE9B0":C.text}}>
                    {treasureModal.titleReward.emoji} {treasureModal.titleReward.name}
                  </p>
                </div>
                );
              })()}
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

      {/* ── 지난 미션 완료 차단 안내 모달 (아이 모드: 날짜 지난 미션은 엄마가 처리) ── */}
      {pastQuestBlockModal&&(
        <div style={{...GAME_MODAL_STYLE.overlay}} onClick={()=>setPastQuestBlockModal(null)}>
          <div style={GAME_MODAL_STYLE.card} onClick={e=>e.stopPropagation()}>
            <GameModalHeader
              emoji="⏰"
              title="날짜가 지났어요"
              color={`linear-gradient(135deg, ${C.orange}, #FFC36B)`}
            />
            <div style={{...GAME_MODAL_STYLE.body,textAlign:"center"}}>
              <p style={{fontWeight:900,fontSize:16,margin:"0 0 8px",color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {(()=>{const d=parseLocal(pastQuestBlockModal.date);return `${d.getMonth()+1}월 ${d.getDate()}일`;})()} · {pastQuestBlockModal.label}
              </p>
              <p style={{fontSize:14,fontWeight:800,color:C.sub,margin:"0 0 16px",lineHeight:1.5}}>
                지난 미션은 여기서 완료할 수 없어요.<br/>보호자가 대신 처리할 수 있어요 🙆
              </p>
              <div style={{background:CT.faint,borderRadius:14,padding:"12px 14px",fontSize:13,fontWeight:800,color:C.sub,lineHeight:1.5}}>
                <span style={{color:C.orange,fontWeight:900}}>엄마용 → 보상 탭(🔒 비밀번호)</span>에서 엄마가 완료/실패를 처리해 줄 수 있어요.
              </div>
              <button onClick={()=>setPastQuestBlockModal(null)}
                style={{marginTop:16,width:"100%",padding:"12px",borderRadius:14,border:"none",background:`linear-gradient(135deg, ${C.orange}, #FFC36B)`,color:"#fff",fontSize:15,fontWeight:900,cursor:"pointer"}}>
                알겠어요
              </button>
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
            const cSealBg  = cute?"radial-gradient(circle at 35% 30%,#ffd6e2,#f3a8c0)":"radial-gradient(circle at 35% 30%,#f5d062,#caa23a)";
            const cSealTx  = cute?"#9c3a63":"#5a4410";
            const cSealSh  = cute?"0 3px 8px rgba(200,90,130,.35)":"0 3px 8px rgba(120,90,10,.4)";
            const cBtn     = cute?"linear-gradient(135deg,#f3a8c0,#f7c6d6)":"linear-gradient(135deg,#caa23a,#1e2547)";
            const cBtnTx   = cute?"#7a4257":"#fff";
            const sealMark = cute?"✿":"★";
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
                    <div style={{fontSize:13.5,fontWeight:600,lineHeight:1.75,color:cReason,marginBottom:20,wordBreak:"keep-all",whiteSpace:"pre-line"}}>{eventModal.desc}</div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:10,marginBottom:kidSkin==="cute"?24:20}}>
                      <div style={{width:50,height:50,borderRadius:"50%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,flexShrink:0,transform:"rotate(-12deg)",background:cSealBg,color:cSealTx,boxShadow:cSealSh}}>
                        <span style={{fontSize:17,lineHeight:1}}>{sealMark}</span>수여
                      </div>
                    </div>
                    {eventModal.reward&&(
                      <div style={{borderRadius:11,padding:"10px 12px",fontSize:13,fontWeight:900,marginBottom:kidSkin==="cute"?10:20,marginTop:kidSkin==="cute"?6:0,background:cRewardBg,color:cRewardTx,border:`1px solid ${cRewardBd}`}}>
                        {String(eventModal.reward).split("\n").map((line,i)=>(<div key={i}>{line}</div>))}
                      </div>
                    )}
                    <button onClick={()=>setEventModal(null)}
                      style={{marginTop:kidSkin==="cute"&&eventModal.reward?2:18,width:"100%",border:"none",borderRadius:13,padding:13,fontSize:15,fontWeight:900,cursor:"pointer",background:cBtn,color:cBtnTx}}>
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
              {eventModal.charImg
                ? <div style={{margin:"0 0 6px",position:"relative",display:"flex",alignItems:"flex-end",justifyContent:"center",gap:6}}>
                    {/* 이전 모습: 작고 흐리게 */}
                    <img src={eventModal.charImgPrev||eventModal.charImg} alt="진화 전 캐릭터" draggable={false}
                      style={{display:"block",height:88,width:"auto",maxWidth:"none",opacity:0.55,filter:"grayscale(0.35) drop-shadow(0 4px 8px rgba(0,0,0,0.18))",marginBottom:10}}/>
                    {/* 진화 화살표 */}
                    <div style={{fontSize:22,fontWeight:900,color:kidSkin==="cute"?"#DE869C":"#F5B942",marginBottom:44,animation:"jellyIn 0.55s ease-out 0.15s backwards",textShadow:"0 2px 6px rgba(0,0,0,0.15)"}}>➜</div>
                    {/* 진화한 모습: 크게 + 등장 애니메이션 */}
                    <img src={eventModal.charImg} alt="진화한 캐릭터" draggable={false}
                      style={{display:"block",height:148,width:"auto",maxWidth:"none",filter:"drop-shadow(0 8px 14px rgba(0,0,0,0.25))",animation:"jellyIn 0.55s ease-out 0.25s backwards"}}/>
                  </div>
                : <p style={{fontSize:58,margin:"0 0 8px",position:"relative"}}>{eventModal.emoji}</p>}
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

      </div>
    );
  }

  return (
    <div style={{fontFamily:"'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif",background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",color:C.text,paddingBottom:90,wordBreak:"keep-all"}}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet"/>

      {/* 토스트 */}
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:th.main,color:"#fff",padding:"10px 24px",borderRadius:20,fontSize:17,fontWeight:700,zIndex:99999,boxShadow:`0 4px 16px ${th.main}55`}}>{toast}</div>}

      {/* 범용 PIN 게이트 모달 (부모모드: 보상탭 진입 · 위험구역 초기화 보호) */}
      {gateAction&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}}>
          <div style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:350,boxSizing:"border-box"}}>
            <h3 style={{fontSize:20,fontWeight:900,margin:"0 0 6px",textAlign:"center"}}>🔒 비밀번호 확인</h3>
            <p style={{fontSize:14,fontWeight:700,color:C.sub,textAlign:"center",margin:"0 0 16px"}}>{gateAction.title}</p>
            <input type="password" inputMode="numeric" value={gatePin} autoFocus
              onChange={e=>setGatePin(e.target.value.replace(/\D/g,"").slice(0,4))}
              maxLength={4}
              onKeyDown={e=>e.key==="Enter"&&submitGatePin()}
              placeholder="비밀번호 4자리"
              style={{width:"100%",boxSizing:"border-box",padding:"14px",borderRadius:14,border:`1.5px solid ${C.border}`,fontSize:20,outline:"none",marginBottom:12,textAlign:"center",letterSpacing:6}}/>
            {parentPin==="1234"&&!pinHintSeen&&(
              <p style={{fontSize:13,fontWeight:700,color:th.main,background:`${th.main}12`,borderRadius:10,padding:"9px 12px",margin:"0 0 12px",textAlign:"center",lineHeight:1.5}}>
                💡 처음 비밀번호는 <b>1234</b> 예요.<br/>설정 &gt; 비밀번호 변경에서 바꿀 수 있어요.
              </p>
            )}
            <button onClick={submitGatePin}
              style={{width:"100%",padding:14,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",marginBottom:8}}>
              확인
            </button>
            {recoveryQuestion&&(
              <button onClick={()=>{ setRecoveryAnswerInput(""); setShowRecoveryModal(true); }}
                style={{width:"100%",padding:8,border:"none",background:"transparent",color:th.main,fontSize:13,fontWeight:800,cursor:"pointer",marginBottom:4,textDecoration:"underline"}}>
                비밀번호를 잊으셨나요?
              </button>
            )}
            <button onClick={()=>{ markPinHintSeen(); setGateAction(null); setGatePin(""); }}
              style={{width:"100%",padding:12,borderRadius:14,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:15,fontWeight:700,cursor:"pointer"}}>
              취소
            </button>
          </div>
        </div>
      )}

        {DEV_MODE && showDevTools && (
          /* 개발자 도구 — src/components/DevToolsPanel.jsx 로 분리 (CLAUDE.md 3) */
          <DevToolsPanel D={{ children, childId, childDate, kidSkin, th, CT, GP, TM, fmt, getChildLevel, getChildXP, getChildCoin, loadSampleData, generateTestData, generateLegendTestData, addDevQuests, addDevHomeworks, giveDevBox, getQuestStreak, getBestStreak, setDevStreak, setDevBestStreak, diagnoseStreak, stepDevLevel, setDevLevel, addDevXP, addDevCoin, unlockAllTitlesForDev, showDevEvent, devDiscoverNow, devClearTodayDiscovery, devDiscoverAs, devFillDiscoveryDays, devFillDiscoveryAll, devResetDiscovery, resetGameData, resetAllAppData, setShowDevTools, setShowExpPreview, setShowCampProto, discoveryData }} />
        )}
        {DEV_MODE && showExpPreview && (
          /* 미션 배경·동선 점검 — src/components/DevExpeditionPreview.jsx (CLAUDE.md 2) */
          <DevExpeditionPreview onClose={()=>setShowExpPreview(false)}
            gender={children.find(c=>c.id===childId)?.gender||"boy"} />
        )}
        {DEV_MODE && showCampProto && (
          /* 캐릭터 탭 캠프 배치 시안 — src/components/camp/CampPrototype.jsx
             원화 받기 전에 크기·간격·터치감만 먼저 정하려고 만든 것. 실제 탭은 안 건드린다. */
          <CampPrototype onClose={()=>setShowCampProto(false)} />
        )}


      {BAKERY_ENABLED&&showModeSelect&&(
        <ModeSelect onPick={(skin)=>{ setKidSkin(skin); setShowModeSelect(false); showToast(skin==="cute"?"🧁 베이커리 게임으로 변경!":"🧭 탐험 게임으로 변경!"); }} />
      )}

      {showCoachmark&&(
        <CoachmarkOverlay th={th} onFinish={()=>{
          setShowCoachmark(false);
          setTab("home");
          // 버튼 깜빡임 안내 비활성화 (학원 추가/미션 깜빡임 미사용)
        }} />
      )}

      {showParentRewardGuide&&(
        <GuideModal type="reward" th={th} skin={kidSkin} onClose={()=>{ setShowParentRewardGuide(false); setTab("reward"); }} />
      )}
      {showParentWelcome&&(
        <GuideModal type="welcome" th={th} skin={kidSkin} onClose={()=>setShowParentWelcome(false)} />
      )}

      {/* 보상 연령대 변경 확인 모달 (window.confirm 대체) */}
      {pendingAgeChange&&(()=>{
        const isCustom=pendingAgeChange==="custom";
        const set=REWARD_SETS_BY_AGE[pendingAgeChange];
        const label=isCustom?"✏️ 나만의 목록":`${set?.emoji} ${set?.label}`;
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={()=>setPendingAgeChange(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:26,width:"100%",maxWidth:350,boxSizing:"border-box"}}>
              <h3 style={{fontSize:19,fontWeight:900,margin:"0 0 10px",textAlign:"center"}}>{label}(으)로 바꿀까요?</h3>
              <p style={{fontSize:14,fontWeight:700,color:C.sub,textAlign:"center",lineHeight:1.6,margin:"0 0 20px"}}>
                {isCustom
                  ? <>지금 보상 목록이 <b style={{color:C.red}}>모두 삭제</b>되고,<br/>직접 추가해야 해요.</>
                  : <>지금 보상 목록(직접 수정한 항목 포함)이<br/><b style={{color:C.red}}>모두 새 목록으로 교체</b>돼요.</>}
              </p>
              <button onClick={()=>applyAgeChange(pendingAgeChange)}
                style={{width:"100%",padding:14,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer",marginBottom:8}}>
                네, 바꿀게요
              </button>
              <button onClick={()=>setPendingAgeChange(null)}
                style={{width:"100%",padding:12,borderRadius:14,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:15,fontWeight:700,cursor:"pointer"}}>
                취소
              </button>
            </div>
          </div>
        );
      })()}

      {/* 백업 복원 확인 모달 (window.confirm 대체) */}
      {pendingRestore&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={()=>setPendingRestore(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:26,width:"100%",maxWidth:350,boxSizing:"border-box"}}>
            <h3 style={{fontSize:19,fontWeight:900,margin:"0 0 10px",textAlign:"center"}}>📂 백업으로 복원할까요?</h3>
            <p style={{fontSize:14,fontWeight:700,color:C.sub,textAlign:"center",lineHeight:1.6,margin:"0 0 20px"}}>
              지금 기기의 데이터가<br/><b style={{color:C.red}}>모두 백업 파일 내용으로 교체</b>돼요.<br/>되돌릴 수 없어요.
            </p>
            <button onClick={()=>applyRestore(pendingRestore)}
              style={{width:"100%",padding:14,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer",marginBottom:8}}>
              네, 복원할게요
            </button>
            <button onClick={()=>setPendingRestore(null)}
              style={{width:"100%",padding:12,borderRadius:14,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:15,fontWeight:700,cursor:"pointer"}}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* 백업 권유 넛지 모달 (엄마모드 진입 시, 백업 안 했거나 30일 경과) */}
      {showBackupNudge&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={()=>setShowBackupNudge(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:26,width:"100%",maxWidth:350,boxSizing:"border-box"}}>
            <div style={{fontSize:38,textAlign:"center",marginBottom:6}}>🗂️</div>
            <h3 style={{fontSize:19,fontWeight:900,margin:"0 0 10px",textAlign:"center"}}>데이터를 백업할까요?</h3>
            <p style={{fontSize:14,fontWeight:700,color:C.sub,textAlign:"center",lineHeight:1.6,margin:"0 0 20px",wordBreak:"keep-all"}}>
              {lastBackupDate===null
                ? <>아직 한 번도 백업하지 않았어요.<br/>기기를 바꾸거나 앱을 지우면<br/><b style={{color:C.red}}>모든 기록이 사라져요.</b></>
                : <>마지막 백업이 <b style={{color:C.red}}>{daysSinceBackup}일 전</b>이에요.<br/>지금 백업해두면 안전해요.</>}
            </p>
            <button onClick={()=>{ setShowBackupNudge(false); exportBackup(); }}
              style={{width:"100%",padding:14,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer",marginBottom:8}}>
              💾 지금 백업하기
            </button>
            <button onClick={()=>setShowBackupNudge(false)}
              style={{width:"100%",padding:12,borderRadius:14,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:15,fontWeight:700,cursor:"pointer"}}>
              나중에 할게요
            </button>
          </div>
        </div>
      )}

      <div style={{background:`linear-gradient(165deg, ${headerTone(th.main,0.42)} 0%, ${headerTone(th.main,0.64)} 100%)`,padding:"20px 18px 56px",position:"relative",overflow:"hidden"}}>
        {/* 은은한 장식 블롭 */}
        <div style={{position:"absolute",top:-40,right:-30,width:160,height:160,borderRadius:"50%",background:`${th.main}22`,filter:"blur(8px)"}}/>
        <div style={{position:"absolute",bottom:-50,left:-20,width:120,height:120,borderRadius:"50%",background:`${headerTone(th.main,0.34)}55`,filter:"blur(6px)"}}/>

        <div style={{position:"relative",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <p style={{fontSize:11,color:mixBlack(th.main,0.45),margin:0,letterSpacing:2.5,fontWeight:800,opacity:0.9}}>ACADEMY PLANNER</p>
            <h1 style={{fontSize:23,fontWeight:900,margin:"4px 0 0",color:mixBlack(th.main,0.45)}}>🎒 엄마 관리</h1>
          </div>
          <button onClick={exitParentMode}
            style={{border:"none",background:"#fff",color:mixBlack(th.main,0.35),borderRadius:14,padding:"9px 14px",fontSize:13,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",boxShadow:`0 6px 16px ${th.main}22`}}>
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
              <button key={c.id} onClick={()=>{ setChildId(c.id); setRewardDate(TODAY); }}
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
            <button key={k} onClick={()=>{
              // '보상' 탭은 누를 때마다 항상 PIN 요구. 다른 탭으로 가면 즉시 잠금 해제(rewardUnlocked=false).
              if(k==="reward"){
                if(tab==="reward" && rewardUnlocked){ return; } // 이미 보상탭에 열려있으면 그대로
                askPin(()=>{
                  setRewardUnlocked(true); setTab("reward");
                  // 보상탭 첫 진입 시: 권한 구조 안내(welcome)를 1회만 노출
                  if(!parentWelcomeSeen){
                    setParentWelcomeSeen(true);
                    save("v6_parent_welcome_seen","1");
                    setTimeout(()=>setShowParentWelcome(true),450);
                  } else if(!parentRewardGuideSeen){
                    // (별개) 첫 구매요청이 있는데 아직 안내 안 봤으면 1회 안내
                    const anyPending=Object.values(rewardRequests).some(list=>(list||[]).some(r=>r.status==="pending"));
                    if(anyPending){
                      setParentRewardGuideSeen(true);
                      save("v6_parent_reward_guide_seen","1");
                      setTimeout(()=>setShowParentRewardGuide(true),450);
                    }
                  }
                }, "🎁 보상 관리");
                return;
              }
              // 보상탭이 아닌 다른 탭으로 이동 → 보상 잠금 해제(다음에 보상탭 누르면 다시 PIN)
              if(rewardUnlocked) setRewardUnlocked(false);
              setTab(k);
            }} style={{flex:1,padding:"9px 2px",border:"none",borderRadius:14,cursor:"pointer",
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
                    {!isToday&&(
                      <button onClick={()=>setHomeDate(TODAY)}
                        style={{background:`${th.main}14`,border:`1px solid ${th.main}40`,borderRadius:10,color:th.main,fontSize:13,cursor:"pointer",padding:"2px 10px",fontWeight:700,flexShrink:0}}>
                        ↩ 오늘로
                      </button>
                    )}
                  </div>
                </div>
                <button onClick={()=>setHomeDate(addDays(homeDate,1))}
                  style={{width:38,height:38,borderRadius:14,background:mixWhite(th.main,0.92),border:`1px solid ${th.main}33`,color:th.main,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>›</button>
              </div>

              {/* 현황 카드 (소프트 파스텔) */}
              <div style={{background:`linear-gradient(165deg, ${headerTone(th.main,0.9)} 0%, ${headerTone(th.main,0.72)} 100%)`,borderRadius:20,padding:"16px 18px",marginBottom:16,color:C.text,boxShadow:`0 4px 16px ${th.main}1F`,border:`1px solid ${th.main}45`}}>
                {/* 이름 + 레벨/코인 한 줄 */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:8}}>
                  <p style={{fontSize:16,fontWeight:900,margin:0,color:mixWhite(th.main,0.1)}}>{getGenderEmoji(curChild)} {curChild?.name}</p>
                  <p style={{fontSize:13,fontWeight:800,margin:0,color:th.main,background:mixWhite(th.main,0.86),border:`1px solid ${th.main}33`,borderRadius:20,padding:"4px 11px",whiteSpace:"nowrap"}}>
                    {getChildLevel(childId).emoji} Lv.{getChildLevel(childId).level}
                  </p>
                </div>

                {/* 오늘 챙길 일 알림 */}
                {(()=>{
                  const pendingRewardCnt=getChildRewardRequests(childId).filter(r=>r.status==="pending").length;
                  const alerts=[];
                  if(homeSupplyCount>0) alerts.push({label:`🎒 준비물 ${homeSupplyCount}개`,color:th.main});
                  if(homePendingHw>0) alerts.push({label:`📝 미완료 숙제 ${homePendingHw}개`,color:th.main});
                  if(homePendingTodo>0) alerts.push({label:`🎯 미완료 미션 ${homePendingTodo}개`,color:th.main});
                  if(pendingRewardCnt>0) alerts.push({label:`🎁 보상승인 ${pendingRewardCnt}개`,color:C.green});
                  if(absOnHome.length>0) alerts.push({label:`🏥 결석 ${absOnHome.length}개`,color:C.red});
                  if(makeupOnHome.length>0) alerts.push({label:`📚 보충수업 ${makeupOnHome.length}개`,color:C.orange});
                  const hasAlert=alerts.length>0;
                  return (
                    <div style={{background:hasAlert?"#fff":mixWhite(th.main,0.85),border:`1px solid ${hasAlert?th.main+"22":th.main+"40"}`,borderRadius:14,padding:"13px 14px",marginBottom:10,display:"flex",alignItems:hasAlert?"flex-start":"center",gap:12,boxShadow:SHADOW.sm}}>
                      <div style={{fontSize:28,flexShrink:0}}>{hasAlert?"🔔":"✅"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:13,fontWeight:800,margin:"0 0 6px",color:hasAlert?C.sub:mixBlack(th.main,0.45)}}>{dayTag?`${dayTag} 챙길 일`:"이 날 챙길 일"}</p>
                        {hasAlert?(
                          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                            {alerts.map((a,i)=>(
                              <span key={i} style={{fontSize:13,fontWeight:900,color:mixBlack(a.color,0.5),background:mixWhite(a.color,0.88),border:`1px solid ${a.color}33`,borderRadius:10,padding:"4px 10px",whiteSpace:"nowrap"}}>{a.label}</span>
                            ))}
                          </div>
                        ):(
                          <p style={{fontSize:15,fontWeight:900,margin:0,lineHeight:1.35,color:mixBlack(th.main,0.45)}}>챙길 일이 없어요!</p>
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
                <div style={{display:"flex",alignItems:"center",gap:8,margin:"4px 0 12px"}}>
                  <span style={{fontSize:15,fontWeight:900,color:C.text,letterSpacing:0.3}}>📍 오늘의 학원</span>
                  <div style={{flex:1,height:1,background:C.border}}/>
                </div>
              )}
              {homeAc.map((ac,hi)=>{
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
                  <div key={ac.id} style={{background:CT.card,borderRadius:16,marginBottom:10,border:`1px solid ${ac.color}45`,boxShadow:SHADOW.sm,overflow:"hidden"}}>
                    <div style={{background:`${ac.color}1F`,padding:"11px 13px",display:"flex",alignItems:"center",gap:11}}>
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
                                <span style={{flex:1}}>숙제: {h.text}{h.byKid&&<span title="아이가 추가" style={{fontSize:11,fontWeight:900,marginLeft:5,color:ac.color,background:`${ac.color}1A`,borderRadius:6,padding:"0 5px"}}>+</span>}</span>
                                <span style={{fontSize:11,color:C.orange,fontWeight:800}}>+{h.point||DEFAULT_HOMEWORK_SCORE} {TM.xp}</span>
                              </div>
                            ))}
                            {todos.map(t=>(
                              <div key={`todo-summary-${t.id}`} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:t.done?C.sub:C.text,textDecoration:t.done?"line-through":"none"}}>
                                <span>{t.done?"✅":"⬜"}</span>
                                <span style={{flex:1}}>{t.text}{t.byKid&&<span title="아이가 추가" style={{fontSize:11,fontWeight:900,marginLeft:5,color:ac.color,background:`${ac.color}1A`,borderRadius:6,padding:"0 5px"}}>+</span>}</span>
                                <span style={{fontSize:11,color:C.orange,fontWeight:800}}>+{t.point||DEFAULT_HOMEWORK_SCORE} {TM.xp}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={()=>{ setShowDailyModal({academyId:ac.id,date:homeDate,acName:ac.name,acColor:ac.color,baseSupplies:ac.baseSupplies}); setDailyHwInput(""); setDailySupInput(""); setDailyTodoInput(""); setDailyHwPoint(DEFAULT_HOMEWORK_SCORE); setDailyTodoPoint(DEFAULT_HOMEWORK_SCORE); }}
                        style={{width:"100%",padding:"7px 10px",borderRadius:10,border:`1.5px solid ${ac.color}66`,background:`${ac.color}14`,color:ac.color,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                        🎯 미션 · 준비물 편집
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 등록 학원 목록 */}
              <div style={{margin:"16px 0 0"}}>
              <div style={{marginBottom:8,background:mixWhite(th.main,0.95),border:`1.5px solid ${th.main}30`,borderRadius:18,padding:"14px 13px"}}>
                <button onClick={()=>setShowHomeAcademyList(v=>!v)}
                  style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",background:`linear-gradient(135deg, ${mixWhite(th.main,0)}, ${mixWhite(th.main,0.22)})`,border:"none",borderRadius:14,padding:"13px 15px",cursor:"pointer",boxShadow:`0 6px 16px ${th.main}48`}}>
                  <p style={{fontSize:16,color:"#fff",fontWeight:900,margin:0,letterSpacing:0.3}}>📋 등록 학원 {curAc.length>0&&<span style={{fontSize:13,opacity:0.85}}>({curAc.length})</span>}</p>
                  <span style={{fontSize:15,color:"#fff",fontWeight:900,transition:"transform 0.2s",transform:showHomeAcademyList?"rotate(180deg)":"none"}}>▼</span>
                </button>
                {showHomeAcademyList&&(<>
                <div style={{display:"flex",gap:8,marginTop:12,marginBottom:12}}>
                  <button onClick={()=>{ openAdd(); }} style={{flex:1,fontSize:13,padding:"9px 12px",borderRadius:10,border:`1px solid ${th.main}40`,background:th.light,color:th.main,fontWeight:700,cursor:"pointer"}}>+ 학원 추가</button>
                  {children.filter(c=>c.id!==childId).length>0&&(
                    <button onClick={()=>{ setCopySourceChildId(children.find(c=>c.id!==childId)?.id||""); setCopySelectedAcademyIds([]); setShowAcademyCopyModal(true); }}
                      style={{flex:1,fontSize:13,padding:"9px 12px",borderRadius:10,border:`1px solid ${th.main}35`,background:th.light,color:th.main,fontWeight:700,cursor:"pointer"}}>
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
                      <div key={ac.id} style={{background:CT.card,borderRadius:16,border:`1px solid ${ac.color}45`,overflow:"hidden",boxShadow:SHADOW.sm}}>
                        <div style={{background:`${ac.color}1F`,padding:"10px 13px",display:"flex",alignItems:"center",gap:9,borderBottom:`1px solid ${ac.color}22`}}>
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
                {/* 신규 사용자용: 설치 후 24시간 이내에만 노출되는 샘플 학원 추가 버튼 */}
                {hoursSinceInstall!==null && hoursSinceInstall<24 && (
                  <button onClick={addStarterAcademy}
                    style={{width:"100%",marginTop:12,padding:"12px",borderRadius:14,border:`1.5px dashed ${th.main}55`,background:mixWhite(th.main,0.9),color:th.main,fontSize:13.5,fontWeight:800,cursor:"pointer",lineHeight:1.5}}>
                    🌱 샘플 학원 추가해보기
                    <span style={{display:"block",fontSize:11.5,fontWeight:600,color:C.sub,marginTop:2}}>처음이라면 예시 학원으로 미리 체험해보세요</span>
                  </button>
                )}
                </>)}
              </div>
              </div>
            </div>
          );
        })()}

        {/* ════ 달력 탭 ════ */}
        {tab==="calendar"&&(()=>{
          const effSelDate=calSelDate||TODAY;
          const selInfo=(()=>{
            const d=new Date(effSelDate), y=d.getFullYear(), m=d.getMonth(), day=d.getDate();
            const dn=getDN(y,m,day);
            const acList=curAc.filter(a=>hasClassOnDay(a,dn));
            const mk=mKey(childId,y,m,day);
            const absOnDay=curAbs.filter(a=>a.date===effSelDate);
            const makeupOnDay=curAbs.filter(a=>a.makeupDate===effSelDate);
            const holiday=getHolidayName(effSelDate);
            return {y,m,day,dn,acList,mk,absOnDay,makeupOnDay,holiday};
          })();
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
                  const hasExSup=acList.some(a=>(getDailyEntry(childId,a.id,dateStr).supplies||[]).length>0);
                  // 방학 여부
                  const vacAcList=acList.filter(a=>isVacationDay(childId,a.id,dateStr));
                  const hasVac=vacAcList.length>0;
                  const holiday=getHolidayName(dateStr);
                  const isSel=effSelDate===dateStr&&!isToday;
                  const badges=[];
                  if(absOnDay.length>0) badges.push("🏥");
                  if(makeupOnDay.length>0) badges.push("📚");
                  if(makeupDoneDay.length>0) badges.push("✅");
                  if(hasVac) badges.push("🏖️");
                  if(hasExSup) badges.push("🎒");
                  if(hasMemo) badges.push("📝");
                  const shuttleToday=acList.some(a=>getShuttleText(a,dn));
                  if(shuttleToday) badges.push("🚌");
                  return (
                    <div key={i} onClick={()=>setCalSelDate(isSel?null:dateStr)}
                      style={{background:isToday?th.main:isSel?`${th.main}15`:CT.card,borderRadius:10,padding:"4px 3px 3px",minHeight:68,cursor:"pointer",
                        border:`${isSel?"2px":"1px"} solid ${isToday?"transparent":isSel?th.main:C.border}`,
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
                      {badges.length>0&&<div style={{display:"flex",gap:1,flexWrap:"wrap",paddingLeft:2,paddingBottom:2}}>
                        {badges.slice(0,6).map((b,j)=><span key={j} style={{fontSize:10,lineHeight:1}}>{b}</span>)}
                      </div>}
                    </div>
                  );
                })}
              </div>

              {/* 범례 */}
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:10,padding:"10px 12px",background:CT.card,borderRadius:10,border:`1px solid ${C.border}`}}>
                {[{icon:"🏥",label:"결석"},{icon:"📚",label:"보충예정"},{icon:"✅",label:"보충완료"},{icon:"🏖️",label:"방학"},{icon:"🚌",label:"셔틀"},{icon:"🎒",label:"추가준비물"},{icon:"📝",label:"메모"}].map((l,i)=>(
                  <span key={i} style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:C.sub}}>
                    <span style={{fontSize:l.icon==="🏥"?10:11,color:l.icon==="🏥"?"#E74C3C":"inherit"}}>{l.icon}</span>{l.label}
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
                        {effSelDate===TODAY&&<span style={{fontSize:13,background:th.main,color:"#fff",borderRadius:10,padding:"2px 10px",fontWeight:800}}>오늘</span>}
                        {selInfo.holiday&&<span style={{fontSize:13,background:C.red,color:"#fff",borderRadius:10,padding:"2px 10px",fontWeight:700}}>🎌 {selInfo.holiday}</span>}
                      </div>
                    </div>
                    {effSelDate!==TODAY&&<button onClick={()=>setCalSelDate(null)} title="오늘로" style={{background:"#fff",border:`1px solid ${th.main}22`,borderRadius:10,width:30,height:30,cursor:"pointer",color:th.main,fontSize:15,fontWeight:800,boxShadow:SHADOW.sm}}>✕</button>}
                  </div>
                  <div style={{padding:"16px 16px"}}>
                    {/* 메모 (날짜 바로 아래 고정) */}
                    <div style={{display:"flex",gap:8,marginBottom:14}}>
                      <input value={dayMemos[selInfo.mk]||""} onChange={e=>setDayMemos(p=>({...p,[selInfo.mk]:e.target.value}))}
                        placeholder="메모 입력..."
                        style={{flex:1,background:CT.faint,border:`1px solid ${CT.faintB}`,borderRadius:10,padding:"9px 12px",fontSize:17,color:C.text,outline:"none"}}/>
                      {dayMemos[selInfo.mk]&&<button onClick={()=>setDayMemos(p=>({...p,[selInfo.mk]:""}))} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",fontSize:15,flexShrink:0}}>✕</button>}
                    </div>
                    {/* 방학 표시 */}
                    {(()=>{
                      const vacOnDay=selInfo.acList.filter(a=>isVacationDay(childId,a.id,effSelDate));
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
                              <button onClick={()=>toggleMakeup(ab.id)}
                                style={{fontSize:13.5,padding:"5px 12px",borderRadius:10,border:"none",background:ab.makeupDone?`${C.green}18`:CT.faint,color:ab.makeupDone?C.green:C.sub,cursor:"pointer",fontWeight:800}}>
                                {ab.makeupDone?"✓ 완료":"미완료"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* 메모는 상단으로 이동됨 */}
                    {selInfo.acList.length===0&&selInfo.absOnDay.length===0&&selInfo.makeupOnDay.length===0&&(
                      <div style={{textAlign:"center",padding:"20px 0",color:C.sub,fontSize:13}}>
                        <p style={{fontSize:24,margin:"0 0 6px"}}>😴</p>학원이 없는 날이에요
                      </div>
                    )}
                    {/* 학원별 숙제/준비물 - 방학 중인 학원 제외 */}
                    {selInfo.acList.filter(ac=>!isVacationDay(childId,ac.id,effSelDate)).map(ac=>{
                      const entry=getDailyEntry(childId,ac.id,effSelDate);
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
                            <button onClick={()=>{ setShowDailyModal({academyId:ac.id,date:effSelDate,acName:ac.name,acColor:ac.color,baseSupplies:ac.baseSupplies}); setDailyHwInput(""); setDailySupInput(""); setDailyTodoInput(""); setDailyHwPoint(DEFAULT_HOMEWORK_SCORE); setDailyTodoPoint(DEFAULT_HOMEWORK_SCORE); }}
                              style={{width:"100%",padding:"7px 10px",borderRadius:10,border:`1.5px solid ${ac.color}66`,background:`${ac.color}14`,color:ac.color,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                              🎯 미션 · 준비물 편집
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 주간 시간표 */}
              <div style={{background:CT.card,borderRadius:18,border:`1px solid ${th.main}22`,padding:"15px",marginTop:14,marginBottom:14,boxShadow:SHADOW.sm}}>
                <p style={{fontSize:17,fontWeight:900,margin:"0 0 4px",color:C.text}}>📅 주간 시간표</p>
                <p style={{fontSize:13,fontWeight:700,color:C.sub,margin:"0 0 12px"}}>{curChild?.name}의 요일별 학원 일정</p>
                {(()=>{
                  // effSelDate가 속한 주의 월요일 구하기 (월~일)
                  const sel=new Date(effSelDate.replace(/-/g,"/"));
                  const offset=(sel.getDay()+6)%7; // 월=0 ... 일=6
                  const monday=new Date(sel); monday.setDate(sel.getDate()-offset);
                  const weekDates={};
                  DAYS.forEach((d,i)=>{ const wd=new Date(monday); wd.setDate(monday.getDate()+i); weekDates[d]=toStr(wd); });
                  return (
                <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                  {getWeeklySchedule(childId).map(({day,items})=>{
                    const isTodayRow=day===todayDN();
                    const dayDate=weekDates[day];
                    return (
                      <div key={day} style={{display:"flex",flexDirection:"column",gap:6,minWidth:0}}>
                        <div style={{textAlign:"center",fontSize:13,fontWeight:900,padding:"6px 0",borderRadius:10,background:isTodayRow?th.main:CT.faint,color:isTodayRow?"#fff":C.sub,border:isTodayRow?"none":`1px solid ${C.border}`}}>
                          {day}
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:5,minHeight:44}}>
                          {items.length===0?(
                            <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",fontSize:13,color:mixWhite(th.main,0.55),paddingTop:6}}>·</div>
                          ):(
                            items.map(ac=>{
                              const onVac=isVacationDay(childId,ac.id,dayDate);
                              return (
                              <div key={ac.id} style={{background:onVac?CT.faint:`${ac.color}12`,border:`1px solid ${onVac?C.border:ac.color+"33"}`,borderRadius:10,padding:"5px 2px",textAlign:"center",minWidth:0,opacity:onVac?0.65:1}}>
                                <p style={{fontSize:11,fontWeight:700,margin:0,color:onVac?C.sub:ac.color,lineHeight:1.2,wordBreak:"break-all",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",textDecoration:onVac?"line-through":"none"}}>{ac.name}</p>
                                <p style={{fontSize:11.5,fontWeight:700,margin:"2px 0 0",color:onVac?"#E65100":C.sub}}>{onVac?"🏖️ 방학":ac.classTime}</p>
                              </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                  );
                })()}
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
              <p style={{fontSize:26,fontWeight:900,margin:"5px 0 3px",color:(()=>{const hx=(th.main||"").replace("#","");const r=parseInt(hx.slice(0,2),16),g=parseInt(hx.slice(2,4),16),b=parseInt(hx.slice(4,6),16);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let hue=0;if(d!==0){if(mx===r)hue=60*(((g-b)/d)%6);else if(mx===g)hue=60*((b-r)/d+2);else hue=60*((r-g)/d+4);}hue=(hue+360)%360;const dim=(hue>=20&&hue<=50)||(hue>=90&&hue<=160)||(hue>=230&&hue<=275);return dim?mixBlack(th.main,0.5):mixWhite(th.main,0.08);})()}}>{totalFee(childId).toLocaleString()}원</p>
              <p style={{fontSize:13,color:th.main,margin:0,fontWeight:800}}>{curAc.filter(a=>Number(a.fee||0)>0).length===0?"납부할 학원비가 없어요":`납부 ${curAc.filter(a=>Number(a.fee||0)>0&&isPaid(a.id)).length}/${curAc.filter(a=>Number(a.fee||0)>0).length}개 완료`}</p>
            </div>
            {curAc.map(a=>{
              const st=payStatus(a);
              return (
                <div key={a.id} style={{background:CT.card,borderRadius:18,padding:"14px 16px",marginBottom:10,border:`1px solid ${isPaid(a.id)?C.green+"40":th.main+"22"}`,boxShadow:SHADOW.sm}}>
                  <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:11}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:a.color,flexShrink:0}}/>
                    <p style={{fontSize:15,fontWeight:800,margin:0,flex:1,color:C.text}}>{a.name}</p>
                    {Number(a.fee||0)===0?(
                      <span style={{padding:"5px 12px",borderRadius:10,fontSize:13.5,fontWeight:800,background:CT.faint,color:C.sub}}>-</span>
                    ):(
                      <button onClick={()=>togglePaid(a.id)} style={{padding:"5px 12px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13.5,fontWeight:800,background:isPaid(a.id)?`${C.green}18`:CT.faint,color:isPaid(a.id)?C.green:C.sub}}>
                        {isPaid(a.id)?"✓ 납부완료":"👆 미납"}
                      </button>
                    )}
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                    <div style={{display:"flex",gap:22}}>
                      <div><p style={{fontSize:13.5,color:C.sub,margin:0,fontWeight:600}}>월 학원비</p><p style={{fontSize:15,fontWeight:800,margin:"2px 0 0",color:C.text}}>{Number(a.fee).toLocaleString()}원</p></div>
                      <div><p style={{fontSize:13.5,color:C.sub,margin:0,fontWeight:600}}>납부일</p><p style={{fontSize:15,fontWeight:800,margin:"2px 0 0",color:C.text}}>매월 {a.payDay}일</p></div>
                    </div>
                    {Number(a.fee||0)!==0&&<span style={{fontSize:13,fontWeight:700,padding:"4px 10px",borderRadius:10,background:`${st.color}15`,color:st.color}}>{st.label}</span>}
                  </div>
                </div>
              );
            })}
            {curAc.length===0&&<div style={{textAlign:"center",padding:"40px",color:C.sub,fontSize:13,background:mixWhite(th.main,0.93),borderRadius:18,border:`1.5px dashed ${th.main}40`}}>등록된 학원이 없어요</div>}
          </div>
        )}

        {/* ════ 결석 탭 ════ */}
        {tab==="absence"&&(()=>{
          // 삭제된 학원의 결석은 제외하고 집계(유효 학원만)
          const validAcIds=new Set(curAc.map(a=>String(a.id)));
          const liveAbs=curAbs.filter(a=>validAcIds.has(String(a.academyId)));
          const inMonth=(a)=>(a.date||"").slice(0,7)===absMonth;                       // 이번 달에 결석한 건
          // 이월 규칙: 지난달 이전 결석 중 미처리(출석/불참 안 누름)인 것만.
          //  - 보충일정 있으면 → 그 보충일이 속한 달까지만 이월(보충월 ≥ 현재 보는 달)
          //  - 보충일정 미정이면 → 출석/불참 누를 때까지 항상 이월
          const isCarry=(a)=>{
            if((a.date||"").slice(0,7)>=absMonth) return false;   // 이번 달 이후 결석은 이월 대상 아님
            if(a.makeupDone) return false;                         // 이미 처리(출석/불참)된 건 제외
            if(a.makeupDate) return a.makeupDate.slice(0,7)>=absMonth; // 보충월이 현재 달 이상일 때만 따라옴
            return true;                                           // 보충 미정 → 항상 이월
          };
          const thisMonthAbs=liveAbs.filter(inMonth);                                   // 이번 달 결석
          const carryAbs=liveAbs.filter(isCarry);                                       // 이월된 미처리 건
          const visibleAbs=[...carryAbs,...thisMonthAbs];                               // 화면에 보이는 전체(이월이 위)
          const totalCnt=visibleAbs.length;                                             // 전체 = 이번달 + 이월
          const pendingCnt=visibleAbs.filter(a=>!a.makeupDone).length;                  // 보충 예정 = 아직 출석/불참 안 누른 건
          const doneCnt=visibleAbs.filter(a=>a.makeupDone).length;                      // 보충 완료 = 출석·불참 처리된 건(합산)
          const [ay,am]=absMonth.split("-").map(Number);
          const shiftMonth=(delta)=>{ const d=new Date(ay,am-1+delta,1); setAbsMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); };
          // 정렬: 이월 건 먼저(결석일 최신순) → 이번 달 건(결석일 최신순)
          const sortedAbs=[
            ...carryAbs.sort((a,b)=>b.date.localeCompare(a.date)),
            ...thisMonthAbs.sort((a,b)=>b.date.localeCompare(a.date)),
          ];
          return (
          <div>
            {/* 월 네비게이션 */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
              <button onClick={()=>shiftMonth(-1)} style={{background:CT.card,border:`1px solid ${C.border}`,borderRadius:10,width:34,height:34,fontSize:15,cursor:"pointer",color:C.text}}>‹</button>
              <span style={{fontWeight:800,fontSize:15,color:C.text}}>{ay}년 {am}월 결석</span>
              <button onClick={()=>shiftMonth(1)} style={{background:CT.card,border:`1px solid ${C.border}`,borderRadius:10,width:34,height:34,fontSize:15,cursor:"pointer",color:C.text}}>›</button>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[{l:"전체",v:totalCnt,c:C.red},{l:"보충 예정",v:pendingCnt,c:C.orange},{l:"보충 완료",v:doneCnt,c:C.green}].map((s,i)=>(
                <div key={i} style={{flex:1,background:CT.card,borderRadius:16,padding:"12px 8px",textAlign:"center",border:`1px solid ${s.c}33`,boxShadow:SHADOW.sm}}>
                  <p style={{fontSize:13,color:C.sub,margin:0,fontWeight:600}}>{s.l}</p>
                  <p style={{fontSize:20,fontWeight:800,margin:"3px 0 0",color:s.c}}>{s.v}</p>
                </div>
              ))}
            </div>
            <button onClick={()=>setShowAbsModal(true)} style={{width:"100%",padding:"10px",borderRadius:10,border:`1px dashed ${C.red}40`,background:`${C.red}06`,color:C.red,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:16}}>+ 결석 기록 추가</button>
            {sortedAbs.map(ab=>{
              const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
              const past=ab.makeupDate&&ab.makeupDate<TODAY;
              const carried=isCarry(ab);
              return (
                <div key={ab.id} style={{background:CT.card,borderRadius:18,padding:"14px 16px",marginBottom:10,border:`1px solid ${carried?C.orange+"55":ab.makeupDone?C.green+"33":th.main+"22"}`,boxShadow:SHADOW.sm}}>
                  <div style={{display:"flex",gap:9}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:ac.color,marginTop:5,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          <p style={{fontWeight:800,fontSize:15,margin:0,color:C.text}}>{ac.name}</p>
                          {carried&&<span style={{fontSize:11,fontWeight:800,color:C.orange,background:`${C.orange}18`,border:`1px solid ${C.orange}44`,borderRadius:7,padding:"1px 7px"}}>↩️ 이월 · {Number(ab.date.slice(5,7))}월</span>}
                        </div>
                        <button onClick={()=>deleteAbs(ab.id)} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",fontSize:15}}>✕</button>
                      </div>
                      <p style={{fontSize:13.5,color:C.sub,margin:"3px 0 10px",fontWeight:600}}>결석일: {ab.date}{ab.reason&&` · ${ab.reason}`}</p>
                      <div style={{padding:"11px 13px",borderRadius:10,background:ab.makeupDone?`${C.green}0D`:past?`${C.red}0D`:CT.faint,border:`1px solid ${ab.makeupDone?C.green+"33":past?C.red+"33":CT.faintB}`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:11.5,color:C.sub,margin:0,fontWeight:600}}>보충 일정</p>
                            {ab.makeupDate
                              ? <p style={{fontSize:13,fontWeight:800,margin:"2px 0 0",color:ab.makeupDone?C.green:past?C.red:C.text}}>{ab.makeupDate}</p>
                              : <p style={{fontSize:13,fontWeight:800,margin:"2px 0 0",color:C.sub}}>📭 미정</p>}
                            {ab.makeupDate&&past&&!ab.makeupDone&&<p style={{fontSize:11.5,color:C.red,margin:"2px 0 0",fontWeight:600}}>⚠️ 보충일이 지났어요</p>}
                          </div>
                          <button onClick={()=>toggleMakeup(ab.id)} style={{padding:"5px 12px",borderRadius:10,border:`1px solid ${ab.makeupDone?C.green+"33":past?C.red+"33":CT.faintB}`,cursor:"pointer",fontSize:13.5,fontWeight:800,background:ab.makeupDone?`${C.green}18`:CT.faint,color:ab.makeupDone?C.green:C.sub}}>
                            {ab.makeupDone?"✓ 완료":"👆 미완료"}</button>
                        </div>
                      </div>
                      <button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }} style={{width:"100%",marginTop:9,padding:"8px",borderRadius:10,border:`1px solid ${C.purple}30`,background:C.purpleL,color:C.purple,fontSize:13,fontWeight:700,cursor:"pointer"}}>💬 결석 안내 문자 보내기</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {totalCnt===0&&<div style={{textAlign:"center",padding:"40px 20px",background:mixWhite(th.main,0.93),borderRadius:18,border:`1.5px dashed ${th.main}40`}}><p style={{fontSize:32,margin:0}}>🙌</p><p style={{color:C.sub,fontSize:13,margin:"8px 0 0"}}>{ay}년 {am}월 결석 기록이 없어요!</p></div>}
          </div>
          );
        })()}

        {/* ════ 보상 탭 ════ */}
        {tab==="reward"&&(
          <div>
            {/* 오늘의 미션 카드 */}
            {(()=>{
              const isRewToday=rewardDate===TODAY;
              const rd=new Date(rewardDate.replace(/-/g,"/"));
              const rDN=["일","월","화","수","목","금","토"][rd.getDay()];
              const rIsTomorrow=rewardDate===addDays(TODAY,1);
              const rIsYesterday=rewardDate===addDays(TODAY,-1);
              const rDayTag=isRewToday?"오늘":rIsTomorrow?"내일":rIsYesterday?"어제":null;
              const rFullLabel=`${rd.getMonth()+1}월 ${rd.getDate()}일 ${rDN}요일`;
              const rewardTodayTodos=getChildQuestBoardItems(childId,rewardDate);
              const doneCnt=rewardTodayTodos.filter(i=>i.done).length;
              const allDone=rewardTodayTodos.length>0&&doneCnt===rewardTodayTodos.length;
              return (
                <div style={{background:CT.card,borderRadius:20,padding:"16px",marginBottom:14,border:`1.5px solid ${allDone&&isRewToday?C.green+"40":th.main+"30"}`,boxShadow:SHADOW.sm}}>
                  <button onClick={()=>setShowParentTodayQuest(v=>!v)}
                    style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                    <div style={{textAlign:"left"}}>
                      <p style={{fontSize:17,fontWeight:900,margin:"0 0 3px",color:C.text}}>🎯 미션 관리</p>
                      <p style={{fontSize:13,color:C.sub,margin:0,fontWeight:700}}>날짜별 미션 추가·수정 · 점수 관리</p>
                    </div>
                    <span style={openClosePill(showParentTodayQuest)}>{openCloseLabel(showParentTodayQuest)}</span>
                  </button>
                  {showParentTodayQuest&&(
                    <div style={{marginTop:14}}>
                      {/* 날짜 이동 */}
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                        <button onClick={()=>setRewardDate(addDays(rewardDate,-1))}
                          style={{width:38,height:38,borderRadius:14,background:mixWhite(th.main,0.92),border:`1px solid ${th.main}33`,color:th.main,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>‹</button>
                        <div style={{flex:1,textAlign:"center"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                            <span style={{fontSize:17,fontWeight:900,color:C.text}}>{rFullLabel}</span>
                            {rDayTag&&<span style={{fontSize:13,background:th.main,color:"#fff",borderRadius:10,padding:"2px 9px",fontWeight:700,flexShrink:0}}>{rDayTag}</span>}
                            {!isRewToday&&(
                              <button onClick={()=>setRewardDate(TODAY)}
                                style={{background:`${th.main}14`,border:`1px solid ${th.main}40`,borderRadius:10,color:th.main,fontSize:13,cursor:"pointer",padding:"2px 10px",fontWeight:700,flexShrink:0}}>
                                ↩ 오늘로
                              </button>
                            )}
                          </div>
                          <p style={{fontSize:12,color:C.sub,margin:"4px 0 0",fontWeight:700}}>{doneCnt}/{rewardTodayTodos.length} 완료</p>
                        </div>
                        <button onClick={()=>setRewardDate(addDays(rewardDate,1))}
                          style={{width:38,height:38,borderRadius:14,background:mixWhite(th.main,0.92),border:`1px solid ${th.main}33`,color:th.main,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>›</button>
                      </div>
                      <button onClick={()=>setShowTodoPickerModal(rewardDate)}
                        style={{width:"100%",padding:"9px 10px",borderRadius:10,border:`1px dashed ${th.main}50`,background:`${th.main}08`,color:th.main,fontSize:13,fontWeight:900,cursor:"pointer",marginBottom:10}}>
                        ✏️ 미션 추가/수정
                      </button>
                      {isRewToday&&(()=>{
                        const pastCnt=getPastQuestCandidates(childId,rewardDate).length;
                        return (
                          <button onClick={()=>setShowPastMissionModal(rewardDate)}
                            style={{width:"100%",padding:"9px 10px",borderRadius:10,border:`1px dashed ${C.orange}55`,background:`${C.orange}0D`,color:C.orange,fontSize:13,fontWeight:900,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                            <span>🕗 지난 미션 보기</span>
                            {pastCnt>0&&<span style={{fontSize:11,fontWeight:900,color:"#fff",background:C.orange,borderRadius:20,padding:"1px 7px"}}>{pastCnt}</span>}
                          </button>
                        );
                      })()}
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
                                  {item.kind==="homework"?"📚 숙제":"✅ 할일"} · {item.academyName}
                                </p>
                                <p style={{fontSize:15,fontWeight:700,margin:0,color:item.done||item.failed?C.sub:C.text,textDecoration:item.done||item.failed?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.label}{item.byKid&&<span title="아이가 추가" style={{fontSize:11,fontWeight:900,marginLeft:5,color:item.academyColor||th.main,background:`${item.academyColor||th.main}1A`,borderRadius:6,padding:"0 5px"}}>+</span>}</p>
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
                  <p style={{fontSize:13,color:C.sub,margin:0,fontWeight:700}}>{rewardAgeGroup==="custom"?"✏️ 나만의 목록":`${(REWARD_SETS_BY_AGE[rewardAgeGroup]||REWARD_SETS_BY_AGE.kid).emoji} ${(REWARD_SETS_BY_AGE[rewardAgeGroup]||REWARD_SETS_BY_AGE.kid).label}용`} · 보상승인 · 추가/삭제</p>
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
                    {getChildRewards().slice().sort((a,b)=>a.point-b.point).map(reward=>(
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
                              flexShrink:0,
                              overflow:"hidden"
                            }}>
                              <img src={(kidSkin==="cute"?BAKERY_CHAR_IMG:ADV_CHAR_IMG)[(children.find(c=>c.id===childId)?.gender)==="girl"?"girl":"boy"][ADV_CHAR_STAGE_OF(getChildLevel(childId).level)]}
                                alt="" draggable={false} style={{display:"block",height:46,width:"auto",maxWidth:"none",margin:"0 auto"}}/>
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

                        {/* 탐험기록 상세 */}
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

            {/* 학부모 카카오톡 오픈채팅 — 부모 설정에서 바로 입장 */}
            <div style={{...gameCard,padding:"15px 16px",marginBottom:12,border:`1px solid ${th.main}22`,boxShadow:SHADOW.sm}}>
              <p style={{fontSize:15,fontWeight:900,margin:"0 0 3px",color:C.text}}>💬 학부모 오픈채팅</p>
              <p style={{fontSize:13,fontWeight:700,color:C.sub,margin:"0 0 12px",lineHeight:1.5}}>카카오톡 오픈채팅방에서 공지·문의를 함께 나눠요.</p>
              <button
                onClick={()=>window.open("https://open.kakao.com/o/g6H6WgFi","_blank","noopener,noreferrer")}
                style={{width:"100%",padding:12,borderRadius:14,border:"none",background:"#FEE500",color:"#3C1E1E",fontSize:14,fontWeight:900,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                <span style={{fontSize:16}}>💬</span> 오픈채팅방 입장하기
              </button>
            </div>

            {/* 게임 디자인 선택 — 베이커리 미출시 동안 숨김 (BAKERY_ENABLED) */}
            {BAKERY_ENABLED && !skinByChild[childId] && (
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
              <p style={{fontSize:15,fontWeight:900,margin:"0 0 3px",color:C.text}}>🎁 보상 연령대</p>
              <p style={{fontSize:13,fontWeight:700,color:C.sub,margin:"0 0 12px",lineHeight:1.5}}>연령대를 고르면 그에 맞는 보상 목록으로 바뀌어요.</p>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[["kid","🧸","어린이용"],["elemLow","🎒","초등\n저학년"],["elemHigh","🎽","초등\n고학년"],["teen","💸","고학년\n이상"],["custom","✏️","나만의\n목록"]].map(([k,em,lb])=>{
                  const on=rewardAgeGroup===k;
                  return (
                    <button key={k} onClick={()=>changeRewardAge(k)}
                      style={{flex:"1 1 18%",minWidth:54,padding:"9px 2px",borderRadius:10,border:`2px solid ${on?th.main:C.border}`,background:on?`${th.main}14`:"#fff",color:on?th.main:C.sub,fontSize:11,fontWeight:900,cursor:"pointer",lineHeight:1.3,whiteSpace:"pre-line"}}>
                      <span style={{display:"block",fontSize:17}}>{em}</span>
                      {lb}{on?" ✓":""}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{...gameCard,padding:"15px 16px",marginBottom:12,border:`1px solid ${th.main}22`,boxShadow:SHADOW.sm}}>
              <p style={{fontSize:15,fontWeight:900,margin:"0 0 10px",color:C.text}}>💾 데이터 관리</p>

              {/* 마지막 백업 상태 배너 */}
              {(()=>{
                const never = lastBackupDate===null;
                const stale = !never && daysSinceBackup!==null && daysSinceBackup>=BACKUP_NUDGE_DAYS;
                // 백업 이력 없어도 설치 15일 전이면 경고하지 않고 순한 안내로 (신규 잔소리 방지)
                const earlyNew = never && daysSinceInstall!==null && daysSinceInstall<BACKUP_NUDGE_FIRST_DAYS;
                const warn = (never && !earlyNew) || stale;
                const txt = earlyNew
                  ? "기록이 쌓이면 백업을 안내해 드릴게요"
                  : never
                  ? "아직 백업한 적이 없어요"
                  : daysSinceBackup===0 ? "오늘 백업했어요 ✓"
                  : `마지막 백업: ${daysSinceBackup}일 전`;
                return (
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:12,marginBottom:10,
                    background:warn?`${C.red}12`:`${th.main}10`,border:`1px solid ${warn?C.red+"44":th.main+"22"}`}}>
                    <span style={{fontSize:15}}>{warn?"⚠️":"🗂"}</span>
                    <span style={{fontSize:12.5,fontWeight:800,color:warn?C.red:C.sub,lineHeight:1.4,wordBreak:"keep-all"}}>
                      {txt}{warn&&<><br/><span style={{fontWeight:600}}>기기를 바꾸거나 앱을 지우면 기록이 사라져요. 백업을 권장해요.</span></>}
                    </span>
                  </div>
                );
              })()}

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
              <button onClick={()=>{ setSetupRecoveryQ(recoveryQuestion||""); setSetupRecoveryA(""); setShowRecoverySetupModal(true); }}
                style={{width:"100%",padding:12,borderRadius:14,border:`1.5px solid ${C.border}`,background:CT.faint,color:C.text,fontSize:13,fontWeight:900,cursor:"pointer",marginTop:9}}>
                {recoveryQuestion?"복구 질문 변경":"복구 질문 설정"}
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
                미션팡
              </p>
              <p style={{fontSize:11,fontWeight:700,color:C.sub,margin:"0 0 6px"}}>
                버전 1.0
              </p>
              <p style={{fontSize:11,fontWeight:700,color:C.sub,margin:0,lineHeight:1.5}}>
                학원 일정과 아이의 숙제를 게임처럼 관리하는 플래너
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
              <h3 style={{margin:0,fontSize:17,fontWeight:900,color:C.text}}>✏️ 미션 추가/수정</h3>
              <button onClick={()=>setShowTodoPickerModal(null)} style={{background:CT.faint,border:"none",borderRadius:10,width:28,height:28,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>
            <p style={{fontSize:13,color:C.sub,fontWeight:600,margin:"0 0 14px"}}>수정할 학원을 선택하거나, 할일 미션을 추가하세요</p>
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
                  </div>
                  <span style={{fontSize:13,color:ac.color,fontWeight:700}}>선택 →</span>
                </button>
              ))}
              {/* 할일 미션 */}
              <button onClick={()=>{
                setShowDailyModal({academyId:EXTRA_QUEST_ID,date:showTodoPickerModal,acName:"할일 미션",acColor:th.main,baseSupplies:[]});
                setDailyHwInput(""); setDailySupInput(""); setDailyTodoInput("");
                setDailyHwPoint(DEFAULT_HOMEWORK_SCORE); setDailyTodoPoint(DEFAULT_HOMEWORK_SCORE);
                setShowTodoPickerModal(null);
              }} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:16,border:`1.5px dashed ${th.main}40`,background:`${th.main}06`,cursor:"pointer",textAlign:"left"}}>
                <div style={{width:9,height:9,borderRadius:"50%",background:th.main,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <p style={{fontSize:15,fontWeight:900,margin:0,color:th.main}}>할일 미션</p>
                  <p style={{fontSize:11,color:C.sub,margin:"2px 0 0",fontWeight:600}}>학원 관련 없는 할 일을 추가해요</p>
                </div>
                <span style={{fontSize:13,color:th.main,fontWeight:700}}>선택 →</span>
              </button>
              {curAc.length===0&&<p style={{textAlign:"center",color:C.sub,fontSize:13,padding:"16px 0"}}>등록된 학원이 없어요</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── 지난 미션 보기 모달 (엄마용: 못한 지난 미션 확인 + 체크/실패로 마감) ── */}
      {showPastMissionModal&&(()=>{
        const date=showPastMissionModal;
        const cands=getPastQuestCandidates(childId,date)
          .slice()
          .sort((a,b)=> a.date<b.date?1:a.date>b.date?-1:0); // 최근 날짜 먼저
        return (
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"flex-end",zIndex:1000}} onClick={()=>setShowPastMissionModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"22px 18px 44px",width:"100%",maxWidth:430,boxSizing:"border-box",maxHeight:"82vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:900,color:C.text}}>🕗 지난 미션 보기</h3>
              <button onClick={()=>setShowPastMissionModal(null)} style={{background:CT.faint,border:"none",borderRadius:10,width:28,height:28,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>
            <p style={{fontSize:13,color:C.sub,fontWeight:600,margin:"0 0 14px"}}>아직 안 한 지난 미션이에요. 원래 날짜 기준으로 <b>완료(✓)</b> 또는 <b>실패</b>로 마감할 수 있어요.</p>
            {cands.length===0?(
              <div style={{textAlign:"center",padding:"28px 10px",color:C.sub}}>
                <p style={{fontSize:32,margin:0}}>🎉</p>
                <p style={{fontSize:14,fontWeight:800,margin:"8px 0 0",color:C.text}}>밀린 지난 미션이 없어요</p>
                <p style={{fontSize:12,margin:"4px 0 0"}}>모두 끝냈거나 처리됐어요</p>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {cands.map(item=>{
                  const d=parseLocal(item.date);
                  const dateLabel=`${d.getMonth()+1}월 ${d.getDate()}일`;
                  return (
                    <div key={carriedKeyOf(childId,item)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 13px",borderRadius:14,border:`1.5px solid ${C.border}`,background:CT.faint}}>
                      <div style={{flex:1,minWidth:0}}>
                        <p style={{fontSize:14,fontWeight:900,margin:0,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.label}</p>
                        <p style={{fontSize:11.5,color:C.sub,margin:"2px 0 0",fontWeight:700}}>{item.academyName} · <span style={{color:C.orange,fontWeight:800}}>{dateLabel}</span></p>
                      </div>
                      <button onClick={()=>{
                        if(item.kind==="homework") failHomeworkQuest(childId,item.academyId,item.date,item.id);
                        else failTodoQuest(childId,item.academyId,item.date,item.id);
                      }} style={{flexShrink:0,padding:"7px 13px",borderRadius:20,border:`1px solid ${C.red}40`,background:`${C.red}0C`,color:C.red,fontSize:12.5,fontWeight:900,cursor:"pointer"}}
                        title="실패 처리">실패</button>
                      <button onClick={()=>{
                        if(item.kind==="homework") toggleHomeworkDone(childId,item.academyId,item.date,item.id);
                        else toggleTodoDone(childId,item.academyId,item.date,item.id);
                      }} style={{flexShrink:0,padding:"7px 13px",borderRadius:20,border:`1px solid ${C.green}`,background:"transparent",color:C.green,fontSize:12.5,fontWeight:900,cursor:"pointer"}}
                        title="완료 처리">완료</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        );
      })()}

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
            <input type="password" inputMode="numeric" value={oldPinInput} onChange={e=>setOldPinInput(e.target.value.replace(/\D/g,"").slice(0,4))} maxLength={4}
              placeholder="현재 비밀번호 4자리"
              style={{...inp,marginBottom:14,textAlign:"center",letterSpacing:4,fontSize:20}}/>
            <label style={lbl}>새 비밀번호</label>
            <input type="password" inputMode="numeric" value={newPinInput} onChange={e=>setNewPinInput(e.target.value.replace(/\D/g,"").slice(0,4))} maxLength={4}
              placeholder="새 비밀번호 4자리"
              style={{...inp,marginBottom:14,textAlign:"center",letterSpacing:4,fontSize:20}}/>
            <label style={lbl}>새 비밀번호 확인</label>
            <input type="password" inputMode="numeric" value={newPinConfirm} onChange={e=>setNewPinConfirm(e.target.value.replace(/\D/g,"").slice(0,4))} maxLength={4}
              onKeyDown={e=>e.key==="Enter"&&changeParentPin()}
              placeholder="새 비밀번호 다시 입력"
              style={{...inp,marginBottom:18,textAlign:"center",letterSpacing:4,fontSize:20}}/>

            {!recoveryQuestion&&(
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:4}}>
              <p style={{fontSize:13,fontWeight:800,color:C.text,margin:"0 0 4px"}}>
                🔑 복구 질문 <span style={{color:C.red}}>*필수</span>
              </p>
              <p style={{fontSize:11.5,fontWeight:600,color:C.sub,lineHeight:1.5,margin:"0 0 12px"}}>
                비밀번호를 잊었을 때, 이 질문의 답으로 다시 설정할 수 있어요.
                <br/><b style={{color:C.red}}>비밀번호를 처음 바꿀 땐 꼭 등록해야 해요.</b>
              </p>
              <label style={lbl}>복구 질문</label>
              <select value={newRecoveryQ} onChange={e=>setNewRecoveryQ(e.target.value)}
                style={{...inp,marginBottom:12}}>
                <option value="">질문을 선택하세요</option>
                {RECOVERY_QUESTIONS.map(q=><option key={q} value={q}>{q}</option>)}
              </select>
              <label style={lbl}>복구 질문의 답</label>
              <input type="text" value={newRecoveryA} onChange={e=>setNewRecoveryA(e.target.value)}
                placeholder="답을 입력 (대소문자 구분 안 함)"
                style={{...inp,marginBottom:18}}/>
            </div>
            )}

            <button onClick={changeParentPin}
              style={{width:"100%",padding:15,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",marginBottom:8}}>
              변경 완료
            </button>
            <button onClick={()=>{ setShowPinChangeModal(false); setOldPinInput(""); setNewPinInput(""); setNewPinConfirm(""); setNewRecoveryQ(""); setNewRecoveryA(""); }}
              style={{width:"100%",padding:12,borderRadius:14,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:15,fontWeight:700,cursor:"pointer"}}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* ── 복구 질문 설정/변경 모달 ── */}
      {showRecoverySetupModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={()=>{ setShowRecoverySetupModal(false); setSetupRecoveryQ(""); setSetupRecoveryA(""); }}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:24,width:"100%",maxWidth:360,boxSizing:"border-box",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <h3 style={{fontSize:20,fontWeight:900,margin:0,color:C.text}}>🔑 복구 질문 {recoveryQuestion?"변경":"설정"}</h3>
              <button onClick={()=>{ setShowRecoverySetupModal(false); setSetupRecoveryQ(""); setSetupRecoveryA(""); }} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>
            <p style={{fontSize:11.5,fontWeight:600,color:C.sub,lineHeight:1.5,margin:"0 0 16px"}}>
              비밀번호를 잊었을 때, 이 질문의 답으로 다시 설정할 수 있어요.
              {recoveryQuestion&&<><br/>현재 질문: <b style={{color:th.main}}>{recoveryQuestion}</b></>}
            </p>
            <label style={lbl}>복구 질문</label>
            <select value={setupRecoveryQ} onChange={e=>setSetupRecoveryQ(e.target.value)}
              style={{...inp,marginBottom:12}}>
              <option value="">질문을 선택하세요</option>
              {RECOVERY_QUESTIONS.map(q=><option key={q} value={q}>{q}</option>)}
            </select>
            <label style={lbl}>복구 질문의 답</label>
            <input type="text" value={setupRecoveryA} onChange={e=>setSetupRecoveryA(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&saveRecoverySetup()}
              placeholder="답을 입력 (대소문자 구분 안 함)"
              style={{...inp,marginBottom:18}}/>
            <button onClick={saveRecoverySetup}
              style={{width:"100%",padding:15,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",marginBottom:8}}>
              저장
            </button>
            <button onClick={()=>{ setShowRecoverySetupModal(false); setSetupRecoveryQ(""); setSetupRecoveryA(""); }}
              style={{width:"100%",padding:12,borderRadius:14,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:15,fontWeight:700,cursor:"pointer"}}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* ── 비밀번호 찾기(복구 질문) 모달 ── */}
      {showRecoveryModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:20}} onClick={()=>{ setShowRecoveryModal(false); setRecoveryAnswerInput(""); }}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:24,width:"100%",maxWidth:360,boxSizing:"border-box",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h3 style={{fontSize:20,fontWeight:900,margin:0,color:C.text}}>🔑 비밀번호 찾기</h3>
              <button onClick={()=>{ setShowRecoveryModal(false); setRecoveryAnswerInput(""); }} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>
            <div style={{background:`${th.main}10`,borderRadius:12,padding:"12px 14px",marginBottom:16}}>
              <p style={{fontSize:12,fontWeight:700,color:C.sub,margin:"0 0 4px"}}>복구 질문</p>
              <p style={{fontSize:15,fontWeight:900,color:C.text,margin:0,wordBreak:"keep-all"}}>{recoveryQuestion}</p>
            </div>
            <label style={lbl}>답 입력</label>
            <input type="text" value={recoveryAnswerInput} autoFocus
              onChange={e=>setRecoveryAnswerInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&submitRecovery()}
              placeholder="질문의 답을 입력하세요"
              style={{...inp,marginBottom:18}}/>
            <button onClick={submitRecovery}
              style={{width:"100%",padding:15,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",marginBottom:8}}>
              확인
            </button>
            <button onClick={()=>{ setShowRecoveryModal(false); setRecoveryAnswerInput(""); }}
              style={{width:"100%",padding:12,borderRadius:14,border:`1px solid ${C.border}`,background:CT.faint,color:C.sub,fontSize:15,fontWeight:700,cursor:"pointer"}}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* ── 복구 성공 후 새 비밀번호 설정 모달 (기존 PIN 불필요) ── */}
      {showResetPinModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:20}} onClick={()=>{ setShowResetPinModal(false); setResetNewPin(""); setResetNewPinConfirm(""); }}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:20,padding:24,width:"100%",maxWidth:360,boxSizing:"border-box",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <h3 style={{fontSize:20,fontWeight:900,margin:0,color:C.text}}>🔓 새 비밀번호 설정</h3>
              <button onClick={()=>{ setShowResetPinModal(false); setResetNewPin(""); setResetNewPinConfirm(""); }} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>
            <p style={{fontSize:12.5,fontWeight:700,color:C.sub,lineHeight:1.5,margin:"0 0 18px"}}>
              본인 확인이 완료됐어요. 새 비밀번호를 정해 주세요.
            </p>
            <label style={lbl}>새 비밀번호</label>
            <input type="password" inputMode="numeric" value={resetNewPin} onChange={e=>setResetNewPin(e.target.value.replace(/\D/g,"").slice(0,4))} maxLength={4} autoFocus
              placeholder="새 비밀번호 4자리"
              style={{...inp,marginBottom:14,textAlign:"center",letterSpacing:4,fontSize:20}}/>
            <label style={lbl}>새 비밀번호 확인</label>
            <input type="password" inputMode="numeric" value={resetNewPinConfirm} onChange={e=>setResetNewPinConfirm(e.target.value.replace(/\D/g,"").slice(0,4))} maxLength={4}
              onKeyDown={e=>e.key==="Enter"&&submitResetPin()}
              placeholder="새 비밀번호 다시 입력"
              style={{...inp,marginBottom:18,textAlign:"center",letterSpacing:4,fontSize:20}}/>
            <button onClick={submitResetPin}
              style={{width:"100%",padding:15,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",marginBottom:8}}>
              설정 완료
            </button>
            <button onClick={()=>{ setShowResetPinModal(false); setResetNewPin(""); setResetNewPinConfirm(""); }}
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
            {(()=>{
              const pvMain=childForm.theme?.main||GENDER_THEME[childForm.gender].main;
              return (
                <div style={{background:`linear-gradient(165deg, ${headerTone(pvMain,0.42)} 0%, ${headerTone(pvMain,0.64)} 100%)`,borderRadius:14,padding:"14px 18px",marginBottom:24,color:mixBlack(pvMain,0.45),textAlign:"center"}}>
                  <p style={{fontSize:28,margin:"0 0 4px"}}>{GENDER_THEME[childForm.gender].emoji}</p>
                  <p style={{fontSize:17,fontWeight:800,margin:0}}>{childForm.name||"이름 미입력"}</p>
                </div>
              );
            })()}

            <button onClick={saveChild} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:`linear-gradient(165deg, ${headerTone(childForm.theme?.main||GENDER_THEME[childForm.gender].main,0.42)} 0%, ${headerTone(childForm.theme?.main||GENDER_THEME[childForm.gender].main,0.64)} 100%)`,color:mixBlack(childForm.theme?.main||GENDER_THEME[childForm.gender].main,0.45),fontSize:17,fontWeight:800,cursor:"pointer",boxShadow:`0 4px 16px ${(childForm.theme?.main||GENDER_THEME[childForm.gender].main)}40`}}>
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
                          :[...(p.schedules||[]),{day,time:p.time||"15:00",duration:p.duration||40}];
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
                <div style={{flex:1}}><label style={lbl}>수업 시간(분)</label><input type="number" value={newAc.duration===""?"":(newAc.duration||40)} onFocus={e=>e.target.select&&e.target.select()} onChange={e=>setNewAc(p=>({...p,duration:e.target.value===""?"":Number(e.target.value)}))} style={inp}/></div>
              </div>
            )}

            {/* 요일별 시간 토글 버튼 */}
            <button onClick={()=>{
              if(!newAc.useCustomSchedule){
                // 켜기: 선택된 요일로 schedules 생성 (기존 schedules 있으면 유지)
                const existing=newAc.schedules||[];
                const schedules=(newAc.days||[]).map(day=>{
                  const ex=existing.find(s=>s.day===day);
                  return ex||{day,time:newAc.time||"15:00",duration:newAc.duration||40};
                });
                setNewAc(p=>({...p,useCustomSchedule:true,schedules}));
              } else {
                setNewAc(p=>({...p,useCustomSchedule:false}));
              }
            }} style={{width:"100%",padding:"10px",borderRadius:10,border:`1.5px solid ${newAc.useCustomSchedule?th.main:C.border}`,background:newAc.useCustomSchedule?`${th.main}10`:CT.faint,color:newAc.useCustomSchedule?th.main:C.sub,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:12}}>
              {newAc.useCustomSchedule?"✓ 요일별 수업시간 설정 중":"📅 요일별로 수업시간이 달라요"}
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
            {/* 색상 — 필수 화면 */}
            <label style={lbl}>색상</label>
            <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
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

            <p style={{fontSize:12,color:C.sub,fontWeight:600,margin:"0 0 12px",textAlign:"center"}}>여기까지만 입력해도 등록돼요 · 아래는 필요할 때만 채우면 돼요</p>

            <button type="button" onClick={()=>setShowAcMore(v=>!v)} style={{width:"100%",padding:"13px",borderRadius:14,border:`1.5px dashed ${th.main}80`,background:mixWhite(th.main,0.80),color:th.main,fontSize:14,fontWeight:900,cursor:"pointer",marginBottom:16}}>
              {showAcMore?"▲ 상세 정보 접기":"▼ 상세 정보 추가 (선택)"}
            </button>
            {showAcMore&&(<>

            {/* ① 준비물·숙제 묶음 */}
            <div style={{border:`1.5px solid ${acSecSupply?mixWhite(th.main,0.45):C.border}`,borderRadius:14,overflow:"hidden",marginBottom:10,background:acSecSupply?mixWhite(th.main,0.96):"#fff"}}>
            <button type="button" onClick={()=>setAcSecSupply(v=>!v)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",border:"none",background:acSecSupply?mixWhite(th.main,0.88):CT.faint,color:C.text,fontSize:15,fontWeight:800,cursor:"pointer"}}>
              <span>🎒 상시 준비물 · 상시 숙제</span><span style={{color:C.sub}}>{acSecSupply?"▲":"▼"}</span>
            </button>
            {acSecSupply&&(
            <div style={{padding:"13px 14px"}}>
            <label style={{...lbl,fontSize:14}}>🎒 항상 챙길 준비물</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
              {(newAc.baseSupplies||[]).map((s,i)=>(
                <span key={i} style={{fontSize:14,padding:"5px 11px",borderRadius:16,background:`${th.main}18`,color:th.main,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>
                  {s}<button onClick={()=>setNewAc(p=>({...p,baseSupplies:p.baseSupplies.filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:th.main,cursor:"pointer",fontSize:15,padding:0}}>✕</button>
                </span>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <input value={supplyInput} onChange={e=>setSupplyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addBaseSupply()} placeholder="예: 교재, 필통" style={{...inp,flex:1,width:"auto",fontSize:15,padding:"10px 12px",marginBottom:0}}/>
              <button onClick={addBaseSupply} style={{padding:"0 16px",borderRadius:10,border:"none",background:th.main,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>추가</button>
            </div>
            <label style={{...lbl,fontSize:14}}>📚 항상 해야 할 숙제 <span style={{fontSize:12,color:C.sub,fontWeight:400}}>(미션에서 버튼으로 추가)</span></label>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
              {(newAc.baseHomeworks||[]).map((s,i)=>(
                <span key={i} style={{fontSize:14,padding:"5px 11px",borderRadius:16,background:`${th.main}18`,color:th.main,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>
                  {s}<button onClick={()=>removeBaseHomework(i)} style={{background:"none",border:"none",color:th.main,cursor:"pointer",fontSize:15,padding:0}}>✕</button>
                </span>
              ))}
            </div>
            <div style={{display:"flex",gap:8}}>
              <input value={baseHwInput} onChange={e=>setBaseHwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addBaseHomework()} placeholder="예: 문제집 2쪽, 단어 10개" style={{...inp,flex:1,width:"auto",fontSize:15,padding:"10px 12px",marginBottom:0}}/>
              <button onClick={addBaseHomework} style={{padding:"0 16px",borderRadius:10,border:"none",background:th.main,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>추가</button>
            </div>
            </div>
            )}
            </div>

            {/* ② 학원비·납부 묶음 */}
            <div style={{border:`1.5px solid ${acSecFee?mixWhite(th.main,0.45):C.border}`,borderRadius:14,overflow:"hidden",marginBottom:10,background:acSecFee?mixWhite(th.main,0.96):"#fff"}}>
            <button type="button" onClick={()=>setAcSecFee(v=>!v)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",border:"none",background:acSecFee?mixWhite(th.main,0.88):CT.faint,color:C.text,fontSize:15,fontWeight:800,cursor:"pointer"}}>
              <span>💰 학원비 · 납부일</span><span style={{color:C.sub}}>{acSecFee?"▲":"▼"}</span>
            </button>
            {acSecFee&&(
            <div style={{padding:"13px 14px",display:"flex",gap:10}}>
              <div style={{flex:1}}><label style={{...lbl,fontSize:14}}>월 학원비(원)</label><input type="number" value={newAc.fee===""?"":newAc.fee} onFocus={e=>{ if(Number(newAc.fee)===0) setNewAc(p=>({...p,fee:""})); }} onChange={e=>setNewAc(p=>({...p,fee:e.target.value===""?"":Number(e.target.value)}))} placeholder="0" style={{...inp,fontSize:15,padding:"10px 12px",marginBottom:0}}/></div>
              <div style={{flex:1}}><label style={{...lbl,fontSize:14}}>납부일</label><input type="number" min="1" max="31" value={newAc.payDay} onFocus={e=>e.target.select&&e.target.select()} onChange={e=>setNewAc(p=>({...p,payDay:e.target.value===""?"":Number(e.target.value)}))} style={{...inp,fontSize:15,padding:"10px 12px",marginBottom:0}}/></div>
            </div>
            )}
            </div>

            {/* ③ 학원정보 묶음 */}
            <div style={{border:`1.5px solid ${acSecInfo?mixWhite(th.main,0.45):C.border}`,borderRadius:14,overflow:"hidden",marginBottom:10,background:acSecInfo?mixWhite(th.main,0.96):"#fff"}}>
            <button type="button" onClick={()=>setAcSecInfo(v=>!v)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",border:"none",background:acSecInfo?mixWhite(th.main,0.88):CT.faint,color:C.text,fontSize:15,fontWeight:800,cursor:"pointer"}}>
              <span>📋 학원 정보 (연락처·주소·셔틀)</span><span style={{color:C.sub}}>{acSecInfo?"▲":"▼"}</span>
            </button>
            {acSecInfo&&(
            <div style={{padding:"13px 14px"}}>
              <label style={{...lbl,fontSize:14}}>👩‍🏫 담당 선생님</label>
              <input value={newAc.teacher} onChange={e=>setNewAc(p=>({...p,teacher:e.target.value}))} placeholder="예: 김민준 선생님" style={{...inp,fontSize:15,padding:"10px 12px",marginBottom:12}}/>
              <label style={{...lbl,fontSize:14}}>📞 연락처</label>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input value={newAc.phone} onChange={e=>setNewAc(p=>({...p,phone:e.target.value}))}
                  placeholder="예: 010-1234-5678" style={{...inp,flex:1,width:"auto",fontSize:15,padding:"10px 12px",marginBottom:0}}/>
                <button type="button" onClick={pickTeacherContact}
                  style={{padding:"0 12px",borderRadius:10,border:`1px solid ${C.border}`,background:"#fff",color:C.text,fontSize:13,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                  📒 주소록
                </button>
              </div>
              <label style={{...lbl,fontSize:14}}>📍 주소</label>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input value={newAc.address} onChange={e=>setNewAc(p=>({...p,address:e.target.value}))}
                  placeholder="예: 서울시 강남구" style={{...inp,flex:1,width:"auto",fontSize:15,padding:"10px 12px",marginBottom:0}}/>
                <button type="button" onClick={openNaverMapSearch}
                  style={{padding:"0 12px",borderRadius:10,border:`1px solid ${C.border}`,background:"#fff",color:C.text,fontSize:13,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                  🗺️ 지도검색
                </button>
              </div>

              <label style={{...lbl,fontSize:14}}>🚌 셔틀버스 메모</label>
              <textarea value={newAc.shuttleInfo||""} onChange={e=>setNewAc(p=>({...p,shuttleInfo:e.target.value}))}
                placeholder="예: 월수금 하원 차량 / 3시10분 아파트 정문"
                style={{...inp,fontSize:15,padding:"10px 12px",minHeight:60,resize:"none",marginBottom:10}}/>

              <button type="button" onClick={()=>{
                setNewAc(p=>({...p,
                  useCustomShuttle:!p.useCustomShuttle,
                  shuttleSchedules:p.shuttleSchedules?.length
                    ? p.shuttleSchedules
                    : (p.days||[]).map(day=>({day,time:"",place:"",memo:""}))
                }));
              }} style={{width:"100%",padding:"10px",borderRadius:10,border:`1.5px solid ${newAc.useCustomShuttle?th.main:C.border}`,background:newAc.useCustomShuttle?`${th.main}10`:CT.faint,color:newAc.useCustomShuttle?th.main:C.sub,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10}}>
                {newAc.useCustomShuttle?"✓ 요일별 셔틀 설정 중":"🚌 요일별 셔틀 정보가 달라요"}
              </button>

              {newAc.useCustomShuttle&&(
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
                  {(newAc.days||[]).map(day=>{
                    const shuttle=(newAc.shuttleSchedules||[]).find(s=>s.day===day)||{};
                    return (
                      <div key={day} style={{border:`1px solid ${C.border}`,borderRadius:14,padding:"12px",background:"#fff"}}>
                        <div style={{fontWeight:800,marginBottom:8,color:DAY_COLORS[day],fontSize:14}}>{day}요일</div>
                        <div style={{display:"flex",gap:8,marginBottom:8}}>
                          <input type="time" value={shuttle.time||""}
                            onChange={e=>setNewAc(p=>({...p,shuttleSchedules:(p.shuttleSchedules||[]).map(s=>s.day===day?{...s,time:e.target.value}:s)}))}
                            style={{...inp,flex:1,width:"auto",fontSize:14,padding:"9px 11px"}}/>
                          <input value={shuttle.place||""} placeholder="위치"
                            onChange={e=>setNewAc(p=>({...p,shuttleSchedules:(p.shuttleSchedules||[]).map(s=>s.day===day?{...s,place:e.target.value}:s)}))}
                            style={{...inp,flex:2,width:"auto",fontSize:14,padding:"9px 11px"}}/>
                        </div>
                        <input value={shuttle.memo||""} placeholder="메모"
                          onChange={e=>setNewAc(p=>({...p,shuttleSchedules:(p.shuttleSchedules||[]).map(s=>s.day===day?{...s,memo:e.target.value}:s)}))}
                          style={{...inp,fontSize:14,padding:"9px 11px"}}/>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}
            </div>

            {/* ④ 메모 묶음 */}
            <div style={{border:`1.5px solid ${acSecMemo?mixWhite(th.main,0.45):C.border}`,borderRadius:14,overflow:"hidden",marginBottom:10,background:acSecMemo?mixWhite(th.main,0.96):"#fff"}}>
            <button type="button" onClick={()=>setAcSecMemo(v=>!v)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",border:"none",background:acSecMemo?mixWhite(th.main,0.88):CT.faint,color:C.text,fontSize:15,fontWeight:800,cursor:"pointer"}}>
              <span>📝 메모</span><span style={{color:C.sub}}>{acSecMemo?"▲":"▼"}</span>
            </button>
            {acSecMemo&&(
            <div style={{padding:"13px 14px"}}>
              <textarea value={newAc.memo} onChange={e=>setNewAc(p=>({...p,memo:e.target.value}))} placeholder="특이사항, 레벨, 기타 메모 등" style={{...inp,fontSize:15,padding:"10px 12px",minHeight:70,resize:"none",marginBottom:0}}/>
            </div>
            )}
            </div>
            </>)}
            <button onClick={saveAcademy} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 16px ${th.main}40`}}>
              {editTarget?"수정 완료 ✓":"추가하기"}
            </button>
            {editTarget!==null&&(
              <button onClick={()=>deleteAcademy(editTarget)} style={{width:"100%",marginTop:10,padding:13,borderRadius:14,border:`1.5px solid ${C.red}44`,background:`${C.red}0D`,color:C.red,fontSize:15,fontWeight:700,cursor:"pointer"}}>
                🗑 이 학원 삭제
              </button>
            )}
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
        const isParent=(appMode==="parent");   // 엄마용: 수정 가능 + 완료 체크 비활성
        const isParentEdit=rewardUnlocked;      // 보상탭(PIN) 통과: 삭제·점수수정 허용
        const canCheck=(!isParent)||isParentEdit; // 체크 가능: 아이용 또는 보상탭 통과한 엄마 (엄마 홈탭은 체크 불가)
        const addHw=()=>{ const v=dailyHwInput.trim(); if(!v) return; const pt=isParentEdit?Number(dailyHwPoint||DEFAULT_HOMEWORK_SCORE):DEFAULT_HOMEWORK_SCORE; upd({...entry,homeworks:[...hw,{id:Date.now(),text:v,done:false,point:pt}]}); setDailyHwInput(""); };
        const addSup=()=>{ const v=dailySupInput.trim(); if(!v) return; upd({...entry,supplies:[...sup,v]}); setDailySupInput(""); };
        const addTodo=()=>{ const v=dailyTodoInput.trim(); if(!v) return; const pt=isParentEdit?Number(dailyTodoPoint||DEFAULT_HOMEWORK_SCORE):DEFAULT_HOMEWORK_SCORE; upd({...entry,todos:[...todos,{id:Date.now(),text:v,done:false,point:pt}]}); setDailyTodoInput(""); };
        const startEditItem=(kind,id,text,point)=>{ setEditingDailyItem({kind,id}); setEditingDailyText(text); setEditingDailyPoint(String(point||DEFAULT_HOMEWORK_SCORE)); };
        const saveEditItem=()=>{
          const v=editingDailyText.trim(); if(!v||!editingDailyItem){ setEditingDailyItem(null); return; }
          // 보상탭(isParentEdit)에서만 점수 수정 반영, 아니면 기존 점수 유지
          const applyPt=(orig)=>isParentEdit?Number(editingDailyPoint||orig||DEFAULT_HOMEWORK_SCORE):(orig||DEFAULT_HOMEWORK_SCORE);
          if(editingDailyItem.kind==="hw") upd({...entry,homeworks:hw.map(x=>x.id===editingDailyItem.id?{...x,text:v,point:applyPt(x.point)}:x)});
          else upd({...entry,todos:todos.map(x=>x.id===editingDailyItem.id?{...x,text:v,point:applyPt(x.point)}:x)});
          setEditingDailyItem(null); setEditingDailyText(""); setEditingDailyPoint("");
        };
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
                    <button onClick={()=>{ if(canCheck) toggleHomeworkDone(childId,academyId,date,h.id); }} disabled={!canCheck} style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${h.done?C.green:"#CCC"}`,background:h.done?C.green:"transparent",cursor:canCheck?"pointer":"not-allowed",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:700,opacity:!canCheck&&!h.done?0.5:1}}>{h.done?"✓":""}</button>
                    {editingDailyItem&&editingDailyItem.kind==="hw"&&editingDailyItem.id===h.id ? (
                      <>
                        <input value={editingDailyText} autoFocus onChange={e=>setEditingDailyText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEditItem()} style={{...inp,flex:1,width:"auto",fontSize:13,padding:"6px 9px"}}/>
                        {isParentEdit&&(<>
                          <input type="number" value={editingDailyPoint} onChange={e=>setEditingDailyPoint(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEditItem()} style={{...inp,width:46,fontSize:13,padding:"6px 4px",textAlign:"center"}} min="1"/>
                          <span style={{fontSize:12,color:C.sub,flexShrink:0}}>점</span>
                        </>)}
                        <button onClick={saveEditItem} style={{background:th.main,border:"none",color:"#fff",borderRadius:8,padding:"6px 11px",fontSize:12,fontWeight:800,cursor:"pointer",flexShrink:0}}>저장</button>
                      </>
                    ) : (
                      <>
                        <span style={{flex:1,fontSize:13,color:h.done?C.sub:C.text,textDecoration:h.done?"line-through":"none"}}>숙제: {h.text}{h.byKid&&<span title="아이가 추가" style={{fontSize:11,fontWeight:900,marginLeft:5,color:acColor,background:`${acColor}1A`,borderRadius:6,padding:"0 5px"}}>+</span>}</span>
                        <span style={{fontSize:13,color:C.orange,fontWeight:800}}>+{h.point||DEFAULT_HOMEWORK_SCORE} {TM.xp}</span>
                        {isParentEdit&&<button onClick={()=>upd({...entry,homeworks:hw.filter(x=>x.id!==h.id)})} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",fontSize:15}}>✕</button>}
                        {isParent&&<button onClick={()=>startEditItem("hw",h.id,h.text,h.point)} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",fontSize:15,flexShrink:0}}>✏️</button>}
                      </>
                    )}
                  </div>
                ))}
                {todos.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,background:t.done?`${C.green}08`:CT.faint,border:`1.5px solid ${t.done?C.green+"30":CT.faintB}`}}>
                    <button onClick={()=>{ if(canCheck) toggleTodoDone(childId,academyId,date,t.id); }} disabled={!canCheck} style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${t.done?C.green:"#CCC"}`,background:t.done?C.green:"transparent",cursor:canCheck?"pointer":"not-allowed",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#fff",fontWeight:700,opacity:!canCheck&&!t.done?0.5:1}}>{t.done?"✓":""}</button>
                    {editingDailyItem&&editingDailyItem.kind==="todo"&&editingDailyItem.id===t.id ? (
                      <>
                        <input value={editingDailyText} autoFocus onChange={e=>setEditingDailyText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEditItem()} style={{...inp,flex:1,width:"auto",fontSize:13,padding:"6px 9px"}}/>
                        {isParentEdit&&(<>
                          <input type="number" value={editingDailyPoint} onChange={e=>setEditingDailyPoint(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEditItem()} style={{...inp,width:46,fontSize:13,padding:"6px 4px",textAlign:"center"}} min="1"/>
                          <span style={{fontSize:12,color:C.sub,flexShrink:0}}>점</span>
                        </>)}
                        <button onClick={saveEditItem} style={{background:th.main,border:"none",color:"#fff",borderRadius:8,padding:"6px 11px",fontSize:12,fontWeight:800,cursor:"pointer",flexShrink:0}}>저장</button>
                      </>
                    ) : (
                      <>
                        <span style={{flex:1,fontSize:13,color:t.done?C.sub:C.text,textDecoration:t.done?"line-through":"none"}}>{t.text}{t.byKid&&<span title="아이가 추가" style={{fontSize:11,fontWeight:900,marginLeft:5,color:acColor,background:`${acColor}1A`,borderRadius:6,padding:"0 5px"}}>+</span>}</span>
                        <span style={{fontSize:13,color:C.orange,fontWeight:800}}>+{t.point||DEFAULT_HOMEWORK_SCORE} {TM.xp}</span>
                        {isParentEdit&&<button onClick={()=>upd({...entry,todos:todos.filter(x=>x.id!==t.id)})} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",fontSize:15}}>✕</button>}
                        {isParent&&<button onClick={()=>startEditItem("todo",t.id,t.text,t.point)} style={{background:"none",border:"none",color:C.sub,cursor:"pointer",fontSize:15,flexShrink:0}}>✏️</button>}
                      </>
                    )}
                  </div>
                ))}
              </div>
              {!isExtra&&(
              <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
                <input value={dailyHwInput} onChange={e=>setDailyHwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addHw()} placeholder="숙제 입력" style={{...inp,flex:3,width:"auto",fontSize:13,padding:"9px 10px"}}/>
                <input type="number" value={isParentEdit?dailyHwPoint:DEFAULT_HOMEWORK_SCORE} onChange={e=>setDailyHwPoint(e.target.value)} disabled={!isParentEdit} title={isParentEdit?"":"점수는 엄마용에서 바꿀 수 있어요"} style={{...inp,width:52,fontSize:13,padding:"9px 6px",textAlign:"center",background:isParentEdit?inp.background:CT.faint,color:isParentEdit?C.text:C.sub,cursor:isParentEdit?"text":"not-allowed"}} min="1"/>
                <span style={{fontSize:13,color:C.sub,flexShrink:0}}>점</span>
                <button onClick={addHw} style={{padding:"9px 12px",borderRadius:10,border:"none",background:acColor,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0}}>숙제</button>
              </div>
              )}
              <div style={{display:"flex",gap:6,marginBottom:20,alignItems:"center"}}>
                <input value={dailyTodoInput} onChange={e=>setDailyTodoInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTodo()} placeholder="할일 입력" style={{...inp,flex:3,width:"auto",fontSize:13,padding:"9px 10px"}}/>
                <input type="number" value={isParentEdit?dailyTodoPoint:DEFAULT_HOMEWORK_SCORE} onChange={e=>setDailyTodoPoint(e.target.value)} disabled={!isParentEdit} title={isParentEdit?"":"점수는 엄마용에서 바꿀 수 있어요"} style={{...inp,width:52,fontSize:13,padding:"9px 6px",textAlign:"center",background:isParentEdit?inp.background:CT.faint,color:isParentEdit?C.text:C.sub,cursor:isParentEdit?"text":"not-allowed"}} min="1"/>
                <span style={{fontSize:13,color:C.sub,flexShrink:0}}>점</span>
                <button onClick={addTodo} style={{padding:"9px 12px",borderRadius:10,border:"none",background:acColor,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0}}>할일</button>
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
              <button onClick={()=>{ setShowDailyModal(null); showToast(); }} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:acColor,color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer"}}>저장 & 닫기</button>
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


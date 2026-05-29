import { useState, useEffect } from "react";

// ── 상수 ─────────────────────────────────
const DAYS = ["월","화","수","목","금","토","일"];
const DAY_COLORS = { 월:"#FF6B6B", 화:"#FF9F43", 수:"#4A90E2", 목:"#9B59B6", 금:"#1ABC9C", 토:"#3498DB", 일:"#E74C3C" };

// 성별별 테마
const GENDER_THEME = {
  boy:  { emoji:"👦", main:"#4A90E2", light:"#F0F6FF", grad:"linear-gradient(135deg,#4A90E2,#6EC6F5)" },
  girl: { emoji:"👧", main:"#EFA6B8", light:"#FFF6F8", grad:"linear-gradient(135deg,#EFA6B8,#F7C7D4)" },
};

const CHILD_THEME_COLORS = [
  { name:"하늘",   main:"#4A90E2", light:"#F0F6FF", grad:"linear-gradient(135deg,#4A90E2,#6EC6F5)" },
  { name:"연분홍", main:"#EFA6B8", light:"#FFF6F8", grad:"linear-gradient(135deg,#EFA6B8,#F7C7D4)" },
  { name:"라벤더", main:"#A99BEF", light:"#F6F3FF", grad:"linear-gradient(135deg,#A99BEF,#C9BFFF)" },
  { name:"민트",   main:"#6BCBB8", light:"#F1FFFB", grad:"linear-gradient(135deg,#6BCBB8,#A5E7DA)" },
  { name:"살구",   main:"#F3B27A", light:"#FFF7EF", grad:"linear-gradient(135deg,#F3B27A,#FFD0A3)" },
];

const C = {
  bg:"#F4F6FB", card:"#FFFFFF", border:"#EAECF5",
  text:"#1A1A35", sub:"#8890B0", faint:"#F0F2FF", faintB:"#DDE3FF",
  green:"#22C9A0", red:"#FF5C7A", orange:"#FF9F43",
  purple:"#6C63FF", purpleL:"#EEF0FF",
};
const PALETTE = ["#FF6B6B","#FF9F43","#FFC312","#26de81","#4A90E2","#45AAF2","#9B59B6","#FF6B9D","#1ABC9C","#E91E8C"];
const DEFAULT_HOMEWORK_SCORE = 10;
const EXTRA_QUEST_ID = "extra_quest"; // 학원 무관 기타 퀘스트용 고정 ID

const DEFAULT_LEVELS = [
  { level:1, name:"루키",      minScore:0,    emoji:"⚔️" },
  { level:2, name:"어드벤처",  minScore:100,  emoji:"🗺️" },
  { level:3, name:"헌터",      minScore:300,  emoji:"🏹" },
  { level:4, name:"챔피언",    minScore:700,  emoji:"🛡️" },
  { level:5, name:"레전드",    minScore:1200, emoji:"👑" },
];

const REWARD_GRADES = [
  { id:"common",    name:"일반", color:"#888888" },
  { id:"rare",      name:"희귀", color:"#4A90E2" },
  { id:"epic",      name:"영웅", color:"#9B59B6" },
  { id:"legendary", name:"전설", color:"#FF9F43" },
];

const DEFAULT_REWARDS = [
  { id:1, title:"아이스크림", point:300,  emoji:"🍦" },
  { id:2, title:"게임 30분",  point:500,  emoji:"🎮" },
  { id:3, title:"장난감",     point:1000, emoji:"🧸" },
];

const DEFAULT_BADGES = [
  { id:"first_quest",   title:"첫 퀘스트 완료",  desc:"퀘스트를 처음 완료했어요",   emoji:"🏅" },
  { id:"xp_100",        title:"100 XP 달성",     desc:"100 XP를 모았어요",          emoji:"💯" },
  { id:"xp_500",        title:"500 XP 달성",     desc:"500 XP를 모았어요",          emoji:"🔥" },
  { id:"first_reward",  title:"첫 리워드 구매",   desc:"리워드를 처음 구매했어요",   emoji:"🛒" },
  { id:"homework_10",   title:"숙제 헌터",        desc:"숙제를 10개 완료했어요",     emoji:"📚" },
];

// ── 한국 공휴일 (2025~2026) ──────────────────
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
  baseSupplies:[], phone:"", teacher:"", address:"", memo:""
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
  const [childDate,setChildDate] = useState(TODAY);

  // 아이 목록 상태
  const [children,setChildren] = useState(DEFAULT_CHILDREN);
  const [childId,setChildId] = useState("child_1");

  const [tab,setTab] = useState("home");
  const [academies,setAcademies] = useState({});
  const [absences,setAbsences] = useState({});
  const [paidStatus,setPaidStatus] = useState({});
  const [dayMemos,setDayMemos] = useState({});
  const [dailyData,setDailyData] = useState({});
  const [scoreData,setScoreData] = useState({});
  const [rewardData,setRewardData] = useState({});
  const [rewardRequests,setRewardRequests] = useState({});
  const [showRewardModal,setShowRewardModal] = useState(false);
  const [rewardForm,setRewardForm] = useState({title:"",point:300,emoji:"🎁",grade:"common"});
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
  const [smsDraft,setSmsDraft] = useState("");
  const [editTmpl,setEditTmpl] = useState({title:"",body:""});
  const [newAc,setNewAc] = useState(EMPTY_AC);
  const [newAbs,setNewAbs] = useState(EMPTY_ABS);
  const [supplyInput,setSupplyInput] = useState("");
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
            tmpl=await load("v6_tmpl"), cid=await load("v6_cid"), vac=await load("v6_vac"),
            pin=await load("v6_parent_pin"), score=await load("v6_score"),
            reward=await load("v6_reward"), rewardReq=await load("v6_reward_requests");
      if(ch) setChildren(ch);
      if(ac) setAcademies(ac); if(ab) setAbsences(ab);
      if(p) setPaidStatus(p); if(dm) setDayMemos(dm); if(dd) setDailyData(dd);
      if(tmpl) setTemplates(tmpl);
      if(cid) setChildId(cid);
      if(vac) setVacations(vac);
      if(pin) setParentPin(pin);
      if(score) setScoreData(score);
      if(reward) setRewardData(reward);
      if(rewardReq) setRewardRequests(rewardReq);
      setLoaded(true);
    })();
  },[]);

  useEffect(()=>{ if(loaded) save("v6_children",children); },[children,loaded]);
  useEffect(()=>{ if(loaded) save("v6_ac",academies); },[academies,loaded]);
  useEffect(()=>{ if(loaded) save("v6_abs",absences); },[absences,loaded]);
  useEffect(()=>{ if(loaded) save("v6_paid",paidStatus); },[paidStatus,loaded]);
  useEffect(()=>{ if(loaded) save("v6_dm",dayMemos); },[dayMemos,loaded]);
  useEffect(()=>{ if(loaded) save("v6_daily",dailyData); },[dailyData,loaded]);
  useEffect(()=>{ if(loaded) save("v6_tmpl",templates); },[templates,loaded]);
  useEffect(()=>{ if(loaded) save("v6_cid",childId); },[childId,loaded]);
  useEffect(()=>{ if(loaded) save("v6_vac",vacations); },[vacations,loaded]);
  useEffect(()=>{ if(loaded) save("v6_parent_pin",parentPin); },[parentPin,loaded]);
  useEffect(()=>{ if(loaded) save("v6_score",scoreData); },[scoreData,loaded]);
  useEffect(()=>{ if(loaded) save("v6_reward",rewardData); },[rewardData,loaded]);
  useEffect(()=>{ if(loaded) save("v6_reward_requests",rewardRequests); },[rewardRequests,loaded]);

  const showToast=(msg="저장됨 ✓")=>{ setToast(msg); setTimeout(()=>setToast(""),1600); };

  const enterParentMode=()=>{
    if(pinInput===parentPin){
      setAppMode("parent"); setShowParentPin(false); setPinInput("");
      showToast("엄마 모드로 전환됨 🔓");
    } else {
      showToast("비밀번호가 달라요");
    }
  };
  const exitParentMode=()=>{
    setAppMode("child"); setPinInput("");
    showToast("아이 모드로 전환됨 🎒");
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

  // 현재 아이 정보
  const curChild = children.find(c=>c.id===childId) || children[0];
  const getChildTheme = (child) => {
    if (!child) return GENDER_THEME.boy;
    return child.theme || GENDER_THEME[child.gender] || GENDER_THEME.boy;
  };

  const th = getChildTheme(curChild);
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

  const getChildScore=(cid)=>scoreData[cid]?.total||0;

  const getScoreHistory=(cid)=>scoreData[cid]?.history||[];

  const getScoreHistoryLabel=(item)=>{
    if(item.memo) return item.memo;
    if(item.label) return item.label;
    if(item.type==="reward") return "리워드샵 구매";
    if(item.type==="homework") return item.point>=0?"퀘스트 완료":"퀘스트 체크 취소";
    if(item.type==="todo") return item.point>=0?"퀘스트 완료":"퀘스트 체크 취소";
    if(item.type==="manual") return "엄마 XP 조정";
    return "XP 변동";
  };

  const getCompletedHomeworkCount=(cid)=>{
    let count=0;
    Object.entries(dailyData).forEach(([key,entry])=>{
      if(!key.startsWith(`${cid}-`)) return;
      count+=(entry.homeworks||[]).filter(h=>h.done).length;
    });
    return count;
  };
  const hasApprovedReward=(cid)=>getChildRewardRequests(cid).some(r=>r.status==="approved");
  const isBadgeUnlocked=(cid,badgeId)=>{
    const score=getChildScore(cid);
    const history=getScoreHistory(cid);
    if(badgeId==="first_quest") return history.some(h=>Number(h.point)>0&&(h.type==="homework"||h.type==="todo"));
    if(badgeId==="xp_100") return score>=100;
    if(badgeId==="xp_500") return score>=500;
    if(badgeId==="first_reward") return hasApprovedReward(cid);
    if(badgeId==="homework_10") return getCompletedHomeworkCount(cid)>=10;
    return false;
  };
  const getUnlockedBadges=(cid)=>DEFAULT_BADGES.filter(b=>isBadgeUnlocked(cid,b.id));

  const getChildLevel=(cid)=>{
    const score=getChildScore(cid);
    return [...DEFAULT_LEVELS].sort((a,b)=>b.minScore-a.minScore).find(lv=>score>=lv.minScore)||DEFAULT_LEVELS[0];
  };
  const getNextLevel=(cid)=>{
    const score=getChildScore(cid);
    return [...DEFAULT_LEVELS].sort((a,b)=>a.minScore-b.minScore).find(lv=>score<lv.minScore)||null;
  };
  const getLevelProgress=(cid)=>{
    const score=getChildScore(cid);
    const current=getChildLevel(cid);
    const next=getNextLevel(cid);
    if(!next) return 100;
    const range=next.minScore-current.minScore;
    const gained=score-current.minScore;
    return Math.min(100,Math.max(0,Math.round((gained/range)*100)));
  };

  const getChildRewards=(cid)=>rewardData[cid]||DEFAULT_REWARDS;

  const getChildRewardRequests=(cid)=>rewardRequests[cid]||[];
  const hasPendingRewardRequest=(cid,rewardId)=>getChildRewardRequests(cid).some(r=>r.rewardId===rewardId&&r.status==="pending");

  const requestReward=(reward)=>{
    const score=getChildScore(childId);
    if(score<reward.point){ showToast("XP가 부족해요"); return; }
    if(hasPendingRewardRequest(childId,reward.id)){ showToast("이미 요청한 리워드예요"); return; }
    const newRequest={id:Date.now(),rewardId:reward.id,title:reward.title,point:reward.point,emoji:reward.emoji,status:"pending",requestedAt:new Date().toISOString()};
    setRewardRequests(prev=>({...prev,[childId]:[...getChildRewardRequests(childId),newRequest]}));
    showToast("구매 요청을 보냈어요 🛒");
  };
  const approveRewardRequest=(requestId)=>{
    const request=getChildRewardRequests(childId).find(r=>r.id===requestId);
    if(!request) return;
    if(getChildScore(childId)<request.point){ showToast("점수가 부족해서 승인할 수 없어요"); return; }
    spendChildScore(childId,request.point,`${request.title} 구매 승인`);
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
  const addReward=()=>{
    if(!rewardForm.title.trim()){ showToast("보상 이름을 입력해줘"); return; }
    const newReward={id:Date.now(),title:rewardForm.title.trim(),point:Number(rewardForm.point||0),emoji:rewardForm.emoji||"🎁",grade:rewardForm.grade||"common"};
    setRewardData(prev=>({...prev,[childId]:[...getChildRewards(childId),newReward]}));
    setRewardForm({title:"",point:300,emoji:"🎁",grade:"common"});
    setShowRewardModal(false);
    showToast("리워드가 추가됐어요 🎁");
  };
  const deleteReward=(rewardId)=>{
    setRewardData(prev=>({...prev,[childId]:getChildRewards(childId).filter(r=>r.id!==rewardId)}));
    showToast("보상이 삭제됐어요");
  };
  const addChildScore=(cid,point,memo="",type="quest")=>{
    setScoreData(prev=>{
      const cur=prev[cid]||{total:0,history:[]};
      return {...prev,[cid]:{
        total:Math.max(0,Number(cur.total||0)+Number(point||0)),
        history:[...(cur.history||[]),{id:Date.now(),point:Number(point||0),date:TODAY,type,memo}]
      }};
    });
  };
  const spendChildScore=(cid,point,memo="리워드샵 구매 승인")=>{
    setScoreData(prev=>{
      const cur=prev[cid]||{total:0,history:[]};
      return {...prev,[cid]:{
        total:Math.max(0,Number(cur.total||0)-Number(point||0)),
        history:[...(cur.history||[]),{id:Date.now(),point:-Number(point||0),date:TODAY,type:"reward",memo}]
      }};
    });
  };
  const toggleHomeworkDone=(cid,academyId,date,homeworkId)=>{
    const entry=getDailyEntry(cid,academyId,date);
    const homeworks=entry.homeworks||[];
    const target=homeworks.find(h=>h.id===homeworkId);
    if(!target) return;
    const nextDone=!target.done;
    const point=target.point||DEFAULT_HOMEWORK_SCORE;
    const acName=(academies[cid]||[]).find(a=>a.id===academyId)?.name||"학원";
    setDailyEntry(cid,academyId,date,{...entry,homeworks:homeworks.map(h=>h.id===homeworkId?{...h,done:nextDone}:h)});
    addChildScore(cid,nextDone?point:-point,nextDone?`${acName} 숙제 완료`:`${acName} 숙제 체크 취소`,"homework");
    showToast(nextDone?`퀘스트 완료! +${point} XP ⚡`:`체크 취소 -${point} XP`);
  };

  const toggleTodoDone=(cid,academyId,date,todoId)=>{
    const entry=getDailyEntry(cid,academyId,date);
    const todos=entry.todos||[];
    const target=todos.find(t=>t.id===todoId);
    if(!target) return;
    const nextDone=!target.done;
    const point=target.point||DEFAULT_HOMEWORK_SCORE;
    const acName=(academies[cid]||[]).find(a=>a.id===academyId)?.name||(academyId===EXTRA_QUEST_ID?"기타":"학원");
    setDailyEntry(cid,academyId,date,{...entry,todos:todos.map(t=>t.id===todoId?{...t,done:nextDone}:t)});
    addChildScore(cid,nextDone?point:-point,nextDone?`${acName} 생활 퀘스트 완료`:`${acName} 생활 퀘스트 체크 취소`,"todo");
    showToast(nextDone?`퀘스트 완료! +${point} XP ⚡`:`체크 취소 -${point} XP`);
  };

  const pendingHwTotal=()=>{
    let n=0;
    Object.entries(dailyData).forEach(([k,e])=>{ if(k.startsWith(childId+"-")) n+=(e.homeworks||[]).filter(h=>!h.done).length; });
    return n;
  };
  const pendingAbsCnt=curAbs.filter(a=>a.makeupDate&&!a.makeupDone).length;
  const todayAc=curAc.filter(a=>hasClassOnDay(a,todayDN())).sort((a,b)=>getClassTime(a,todayDN()).localeCompare(getClassTime(b,todayDN())));

  // 학원 CRUD
  const openAdd=()=>{ setEditTarget(null); setNewAc({...EMPTY_AC,baseSupplies:[]}); setSupplyInput(""); setShowAddAcModal(true); };
  const openEdit=(ac)=>{ setEditTarget(ac.id); setNewAc({...ac,baseSupplies:[...(ac.baseSupplies||[])],schedules:[...(ac.schedules||[])],days:[...(ac.days||[])]}); setSupplyInput(""); setShowDetailModal(null); setShowAddAcModal(true); };
  const saveAcademy=()=>{
    if(!newAc.name.trim()||(newAc.useCustomSchedule?(newAc.schedules||[]).length===0:(newAc.days||[]).length===0)){
      showToast("학원명과 수업 요일을 입력해줘"); return;
    }
    const cleaned={...newAc,name:newAc.name.trim(),fee:Number(newAc.fee||0),duration:Number(newAc.duration||0),payDay:Number(newAc.payDay||1),baseSupplies:newAc.baseSupplies||[],schedules:newAc.schedules||[]};
    setAcademies(prev=>{
      const list=prev[childId]||[];
      return editTarget!==null
        ? {...prev,[childId]:list.map(a=>a.id===editTarget?{...cleaned,id:editTarget}:a)}
        : {...prev,[childId]:[...list,{...cleaned,id:Date.now()}]};
    });
    setShowAddAcModal(false); setEditTarget(null); setNewAc({...EMPTY_AC,baseSupplies:[]});
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
  const inp={ width:"100%",boxSizing:"border-box",background:C.faint,border:`1px solid ${C.faintB}`,borderRadius:10,padding:"12px 14px",color:C.text,fontSize:17,outline:"none",fontFamily:"inherit" };
  const lbl={ fontSize:17,color:C.sub,display:"block",marginBottom:7,fontWeight:700 };

  if(!loaded) return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
      <div style={{fontSize:48}}>🎒</div>
      <p style={{color:C.sub,fontSize:17,marginTop:12}}>불러오는 중...</p>
    </div>
  );

  if(appMode==="child") {
    const childDt=new Date(childDate+"T00:00:00");
    const childTodayDN=["일","월","화","수","목","금","토"][childDt.getDay()];
    const isChildToday=childDate===TODAY;
    const childTodayAc=curAc
      .filter(a=>hasClassOnDay(a,childTodayDN)&&!isVacationDay(childId,a.id,childDate))
      .sort((a,b)=>getClassTime(a,childTodayDN).localeCompare(getClassTime(b,childTodayDN)));
    return (
      <div style={{fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",color:C.text,paddingBottom:30}}>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet"/>
        {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:th.main,color:"#fff",padding:"10px 24px",borderRadius:20,fontSize:17,fontWeight:700,zIndex:999,boxShadow:`0 4px 16px ${th.main}55`}}>{toast}</div>}

        {/* 아이 모드 헤더 */}
        <div style={{background:th.grad,padding:"20px 18px 16px",color:"#fff",borderRadius:"0 0 24px 24px",boxShadow:"0 4px 20px rgba(0,0,0,0.12)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <div>
              <p style={{fontSize:13,opacity:0.8,margin:0,fontWeight:700}}>학원 일정</p>
              <h1 style={{fontSize:26,fontWeight:900,margin:"4px 0 0"}}>{th.emoji} {curChild?.name}</h1>
            </div>
            <button onClick={()=>setShowParentPin(true)}
              style={{border:"1px solid rgba(255,255,255,0.35)",background:"rgba(255,255,255,0.18)",color:"#fff",borderRadius:12,padding:"9px 11px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
              🔒 엄마
            </button>
          </div>
          {/* 날짜 이동 */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,0.15)",borderRadius:14,padding:"10px 14px"}}>
            <button onClick={()=>{
              const d=new Date(childDate+"T00:00:00"); d.setDate(d.getDate()-1);
              setChildDate(toStr(d));
            }} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:8,width:32,height:32,fontSize:18,cursor:"pointer",fontWeight:700}}>‹</button>
            <div style={{textAlign:"center"}}>
              <p style={{fontSize:15,fontWeight:900,margin:0}}>
                {childDt.getMonth()+1}월 {childDt.getDate()}일 {childTodayDN}요일
              </p>
              {!isChildToday&&<p style={{fontSize:11,opacity:0.8,margin:"2px 0 0",fontWeight:700}}>오늘과 다른 날짜예요</p>}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              {!isChildToday&&<button onClick={()=>setChildDate(TODAY)}
                style={{background:"rgba(255,255,255,0.25)",border:"none",color:"#fff",borderRadius:8,padding:"4px 8px",fontSize:11,cursor:"pointer",fontWeight:800}}>오늘</button>}
              <button onClick={()=>{
                const d=new Date(childDate+"T00:00:00"); d.setDate(d.getDate()+1);
                setChildDate(toStr(d));
              }} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:8,width:32,height:32,fontSize:18,cursor:"pointer",fontWeight:700}}>›</button>
            </div>
          </div>
        </div>

        {/* 아이 모드 탭 */}
        <div style={{display:"flex",background:C.card,margin:"14px 16px 0",borderRadius:14,padding:4,border:`1px solid ${C.border}`}}>
          {[["today","🎯 퀘스트"],["growth","👤 내 캐릭터"]].map(([k,label])=>(
            <button key={k} onClick={()=>setChildTab(k)}
              style={{flex:1,border:"none",borderRadius:11,padding:"11px 8px",background:childTab===k?th.grad:"transparent",color:childTab===k?"#fff":C.sub,fontSize:15,fontWeight:900,cursor:"pointer"}}>
              {label}
            </button>
          ))}
        </div>

        <div style={{padding:"16px"}}>
          {/* ── 오늘 탭 ── */}
          {childTab==="today"&&(
            <>
              <div style={{background:C.card,borderRadius:18,padding:"18px",marginBottom:14,border:`1px solid ${C.border}`}}>
                <p style={{fontSize:17,fontWeight:900,margin:"0 0 10px"}}>
                  📅 {isChildToday?"오늘":`${childDt.getMonth()+1}/${childDt.getDate()}`} 일정
                </p>
                {childTodayAc.length===0?(
                  <div style={{textAlign:"center",padding:"24px 10px",color:C.sub}}>
                    <p style={{fontSize:34,margin:0}}>😴</p>
                    <p style={{fontSize:17,margin:"8px 0 0"}}>오늘은 학원이 없어요</p>
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
                    return (
                      <div key={ac.id} style={{border:`1.5px solid ${ac.color}30`,borderRadius:14,padding:"14px",marginBottom:10,background:`${ac.color}08`}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <div style={{width:9,height:9,borderRadius:"50%",background:ac.color,flexShrink:0}}/>
                          <strong style={{fontSize:19,color:C.text}}>{ac.name}</strong>
                          {totalTodoCnt>0&&<span style={{marginLeft:"auto",fontSize:13,fontWeight:700,color:allDone?C.green:C.orange,background:allDone?`${C.green}15`:`${C.orange}15`,borderRadius:6,padding:"2px 8px"}}>{allDone?"✓ 완료":`${doneCnt}/${totalTodoCnt}`}</span>}
                        </div>
                        <p style={{fontSize:17,color:C.sub,margin:"0 0 6px"}}>⏰ {sc?.time} / {sc?.duration}분 수업</p>
                        {shuttleText&&<p style={{fontSize:16,color:C.sub,margin:"0 0 8px"}}>🚌 {shuttleText}</p>}
                        {/* 준비물 */}
                        <div style={{marginTop:10}}>
                          <p style={{fontSize:15,fontWeight:800,color:C.sub,margin:"0 0 6px"}}>🎒 준비물</p>
                          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                            {(ac.baseSupplies||[]).map((s,i)=><span key={`b${i}`} style={{fontSize:15,padding:"4px 10px",borderRadius:20,background:`${ac.color}18`,color:ac.color,fontWeight:700}}>{s}</span>)}
                            {sup.map((s,i)=><span key={`s${i}`} style={{fontSize:15,padding:"4px 10px",borderRadius:20,background:`${C.orange}18`,color:C.orange,fontWeight:700}}>+ {s}</span>)}
                            {(ac.baseSupplies||[]).length===0&&sup.length===0&&<span style={{fontSize:15,color:"#BBB"}}>없음</span>}
                          </div>
                        </div>
                        {/* 학원별 할 일 요약 - 체크는 아래 Things to do에서만 */}
                        <div style={{marginTop:12}}>
                          <p style={{fontSize:14,fontWeight:800,color:C.sub,margin:"0 0 6px"}}>🎯 퀘스트 요약</p>
                          {totalTodoCnt===0?(
                            <p style={{fontSize:13,color:"#BBB",margin:0}}>등록된 퀘스트 없음</p>
                          ):(
                            <div style={{display:"flex",flexDirection:"column",gap:5,background:"#fff",border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 10px"}}>
                              {hw.map(h=>(
                                <div key={`hw-summary-${h.id}`} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:h.done?C.sub:C.text,textDecoration:h.done?"line-through":"none"}}>
                                  <span>{h.done?"✅":"⬜"}</span>
                                  <span style={{flex:1}}>숙제: {h.text}</span>
                                  <span style={{fontSize:11,color:C.orange,fontWeight:800}}>+{h.point||DEFAULT_HOMEWORK_SCORE} XP</span>
                                </div>
                              ))}
                              {todos.map(t=>(
                                <div key={`todo-summary-${t.id}`} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:t.done?C.sub:C.text,textDecoration:t.done?"line-through":"none"}}>
                                  <span>{t.done?"✅":"⬜"}</span>
                                  <span style={{flex:1}}>{t.text}</span>
                                  <span style={{fontSize:11,color:C.orange,fontWeight:800}}>+{t.point||DEFAULT_HOMEWORK_SCORE} XP</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* 퀘스트 전체 카드 - 항상 오늘 기준 */}
              {(()=>{
                const todayAcForQuest=curAc
                  .filter(a=>hasClassOnDay(a,todayDN())&&!isVacationDay(childId,a.id,TODAY))
                  .sort((a,b)=>getClassTime(a,todayDN()).localeCompare(getClassTime(b,todayDN())));
                const todayTodos=todayAcForQuest.flatMap(ac=>{
                  const entry=getDailyEntry(childId,ac.id,TODAY);
                  const hw=entry.homeworks||[];
                  const todos=entry.todos||[];
                  return [
                    ...hw.map(h=>({...h,kind:"homework",academyId:ac.id,academyName:ac.name,academyColor:ac.color,label:h.text})),
                    ...todos.map(t=>({...t,kind:"todo",academyId:ac.id,academyName:ac.name,academyColor:ac.color,label:t.text}))
                  ];
                });
                const extraQEntry=getDailyEntry(childId,EXTRA_QUEST_ID,TODAY);
                const extraQTodos=(extraQEntry.todos||[]).map(t=>({...t,kind:"todo",academyId:EXTRA_QUEST_ID,academyName:"기타",academyColor:th.main,label:t.text}));
                const allTodayTodos=[...todayTodos,...extraQTodos];
                if(allTodayTodos.length===0) return null;
                const doneCnt=allTodayTodos.filter(i=>i.done).length;
                const allDone=doneCnt===allTodayTodos.length;
                return (
                  <div style={{background:C.card,borderRadius:18,padding:"18px",marginBottom:14,border:`1.5px solid ${allDone?C.green+"40":C.border}`,boxShadow:allDone?`0 4px 18px ${C.green}15`:"none"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                      <p style={{fontSize:18,fontWeight:900,margin:0,color:C.text}}>🎯 오늘의 퀘스트</p>
                      <span style={{fontSize:14,fontWeight:800,color:allDone?C.green:C.orange,background:allDone?`${C.green}15`:`${C.orange}15`,borderRadius:8,padding:"4px 10px"}}>
                        {allDone?"🎉 모두 완료!":`${doneCnt}/${allTodayTodos.length} 완료`}
                      </span>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {allTodayTodos.map(item=>(
                        <div key={`${item.kind}-${item.id}`} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,background:item.done?`${C.green}10`:"#fff",border:`1.5px solid ${item.done?C.green+"30":C.border}`}}>
                          <button onClick={()=>{
                            if(item.kind==="homework") toggleHomeworkDone(childId,item.academyId,TODAY,item.id);
                            else toggleTodoDone(childId,item.academyId,TODAY,item.id);
                          }} style={{width:28,height:28,borderRadius:"50%",border:`2.5px solid ${item.done?C.green:"#CCC"}`,background:item.done?C.green:"transparent",color:"#fff",fontWeight:900,cursor:"pointer",flexShrink:0,fontSize:14}}>
                            {item.done?"✓":""}
                          </button>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{fontSize:12,color:item.academyColor,fontWeight:700,margin:"0 0 2px"}}>
                              {item.kind==="homework"?"📚":"✅"} {item.academyName}{item.kind==="homework"?" 숙제":""}
                            </p>
                            <p style={{fontSize:16,fontWeight:700,margin:0,color:item.done?C.sub:C.text,textDecoration:item.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.label}</p>
                          </div>
                          <span style={{fontSize:13,fontWeight:800,color:item.done?C.green:C.orange,flexShrink:0}}>+{item.point||DEFAULT_HOMEWORK_SCORE} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {/* ── 성장 탭 ── */}
          {childTab==="growth"&&(
            <>
              {/* 레벨 카드 */}
              {(()=>{
                const level=getChildLevel(childId);
                const nextLevel=getNextLevel(childId);
                const progress=getLevelProgress(childId);
                const score=getChildScore(childId);
                return (
                  <div style={{background:C.card,borderRadius:18,padding:"16px 18px",marginBottom:14,border:`1px solid ${C.border}`,boxShadow:"0 3px 12px rgba(0,0,0,0.04)"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                      <div>
                        <p style={{fontSize:15,color:C.sub,fontWeight:800,margin:"0 0 4px"}}>내 레벨</p>
                        <p style={{fontSize:24,fontWeight:900,margin:0,color:C.text}}>{level.emoji} Lv.{level.level} {level.name}</p>
                      </div>
                      <div style={{background:th.light,color:th.main,padding:"9px 13px",borderRadius:14,fontSize:18,fontWeight:900}}>{score}점</div>
                    </div>
                    <div style={{width:"100%",height:12,borderRadius:99,background:C.faint,overflow:"hidden",marginBottom:8}}>
                      <div style={{width:`${progress}%`,height:"100%",borderRadius:99,background:th.grad,transition:"width 0.25s"}}/>
                    </div>
                    {nextLevel?(
                      <p style={{fontSize:14,color:C.sub,margin:0,fontWeight:700}}>다음 레벨까지 {Math.max(0,nextLevel.minScore-score)} XP 남았어요</p>
                    ):(
                      <p style={{fontSize:14,color:C.green,margin:0,fontWeight:800}}>🎉 최고 레벨 달성!</p>
                    )}
                  </div>
                );
              })()}

              {/* 보상상점 카드 (접었다 펴기) */}
              <div style={{background:C.card,borderRadius:18,padding:"16px 18px",marginBottom:14,border:`1px solid ${C.border}`,boxShadow:"0 3px 12px rgba(0,0,0,0.04)"}}>
                <button onClick={()=>setShowChildRewards(v=>!v)}
                  style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                  <div style={{textAlign:"left"}}>
                    <p style={{fontSize:18,fontWeight:900,margin:0,color:C.text}}>🛒 리워드샵</p>
                    <p style={{fontSize:13,color:C.sub,fontWeight:700,margin:"3px 0 0"}}>XP를 사용해 리워드를 구매해요</p>
                  </div>
                  <span style={{fontSize:14,color:th.main,fontWeight:900,background:th.light,padding:"6px 10px",borderRadius:20}}>
                    {showChildRewards?"닫기 ▲":"열기 ▼"}
                  </span>
                </button>
                {showChildRewards&&(
                  <div style={{display:"flex",flexDirection:"column",gap:9,marginTop:14}}>
                    {getChildRewards(childId).map(reward=>{
                      const score=getChildScore(childId);
                      const canGet=score>=reward.point;
                      const remain=Math.max(0,reward.point-score);
                      const progress=Math.min(100,Math.round((score/reward.point)*100));
                      const grade=REWARD_GRADES.find(g=>g.id===(reward.grade||"common"))||REWARD_GRADES[0];
                      return (
                        <div key={reward.id} style={{border:`1.5px solid ${canGet?C.green+"40":grade.color+"30"}`,background:canGet?`${C.green}08`:C.faint,borderRadius:14,padding:"12px 13px"}}>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                            <div style={{display:"flex",alignItems:"center",gap:9}}>
                              <span style={{fontSize:25}}>{reward.emoji}</span>
                              <div>
                                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                                  <p style={{fontSize:17,fontWeight:900,margin:0,color:C.text}}>{reward.title}</p>
                                  <span style={{fontSize:11,fontWeight:900,color:grade.color,background:`${grade.color}18`,padding:"1px 7px",borderRadius:20}}>{grade.name}</span>
                                </div>
                                <p style={{fontSize:13,fontWeight:700,margin:0,color:C.sub}}>{reward.point} XP 필요</p>
                              </div>
                            </div>
                            {hasPendingRewardRequest(childId,reward.id)?(
                              <span style={{fontSize:13,fontWeight:900,color:C.purple,background:C.purpleL,padding:"5px 9px",borderRadius:20}}>승인 대기 중</span>
                            ):(
                              <span style={{fontSize:13,fontWeight:900,color:canGet?C.green:C.orange,background:canGet?`${C.green}15`:`${C.orange}15`,padding:"5px 9px",borderRadius:20}}>
                                {canGet?"구매 가능!":`${remain} XP 부족`}
                              </span>
                            )}
                          </div>
                          <div style={{width:"100%",height:9,borderRadius:99,background:"#fff",overflow:"hidden"}}>
                            <div style={{width:`${progress}%`,height:"100%",borderRadius:99,background:canGet?C.green:th.grad,transition:"width 0.25s"}}/>
                          </div>
                          <button onClick={()=>requestReward(reward)}
                            disabled={!canGet||hasPendingRewardRequest(childId,reward.id)}
                            style={{width:"100%",marginTop:10,padding:"10px 12px",borderRadius:11,border:"none",
                              background:hasPendingRewardRequest(childId,reward.id)?C.purpleL:canGet?th.grad:C.border,
                              color:hasPendingRewardRequest(childId,reward.id)?C.purple:canGet?"#fff":C.sub,
                              fontSize:15,fontWeight:900,
                              cursor:canGet&&!hasPendingRewardRequest(childId,reward.id)?"pointer":"not-allowed"}}>
                            {hasPendingRewardRequest(childId,reward.id)?"승인 대기 중...":canGet?"🛒 구매 요청":"XP가 더 필요해요"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* XP 통장 카드 */}
              <div style={{background:C.card,borderRadius:18,padding:"16px 18px",marginBottom:14,border:`1px solid ${C.border}`,boxShadow:"0 3px 12px rgba(0,0,0,0.04)"}}>
                <button onClick={()=>setShowChildXP(v=>!v)}
                  style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                  <div style={{textAlign:"left"}}>
                    <p style={{fontSize:18,fontWeight:900,margin:0,color:C.text}}>⭐ XP 통장</p>
                    <p style={{fontSize:13,color:C.sub,fontWeight:700,margin:"3px 0 0"}}>최근 XP 변동 내역이에요</p>
                  </div>
                  <span style={{fontSize:14,color:th.main,fontWeight:900,background:th.light,padding:"6px 10px",borderRadius:20}}>
                    {showChildXP?"닫기 ▲":"열기 ▼"}
                  </span>
                </button>
                {showChildXP&&(
                  <div style={{marginTop:14}}>
                    {getScoreHistory(childId).length===0?(
                      <div style={{textAlign:"center",padding:"18px 8px",color:C.sub}}>
                        <p style={{fontSize:26,margin:0}}>📭</p>
                        <p style={{fontSize:15,margin:"6px 0 0"}}>아직 XP 기록이 없어요</p>
                      </div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:8}}>
                        {getScoreHistory(childId).slice().reverse().slice(0,10).map(item=>{
                          const plus=Number(item.point)>=0;
                          return (
                            <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,background:plus?`${C.green}08`:`${C.red}08`,border:`1px solid ${plus?C.green+"25":C.red+"25"}`}}>
                              <span style={{width:32,height:32,borderRadius:"50%",background:plus?`${C.green}18`:`${C.red}12`,color:plus?C.green:C.red,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16,flexShrink:0}}>
                                {plus?"+":"-"}
                              </span>
                              <div style={{flex:1}}>
                                <p style={{fontSize:14,fontWeight:900,margin:0,color:C.text}}>{getScoreHistoryLabel(item)}</p>
                                <p style={{fontSize:12,color:C.sub,fontWeight:700,margin:"2px 0 0"}}>{item.date||""}</p>
                              </div>
                              <span style={{fontSize:14,fontWeight:900,color:plus?C.green:C.red}}>
                                {plus?"+":""}{item.point} XP
                              </span>
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

        {/* PIN 입력 모달 */}
        {showParentPin&&(
          <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
            <div style={{background:"#fff",borderRadius:22,padding:28,width:"100%",maxWidth:350,boxSizing:"border-box"}}>
              <h3 style={{fontSize:20,fontWeight:900,margin:"0 0 16px",textAlign:"center"}}>🔒 엄마 모드</h3>
              <input type="password" inputMode="numeric" value={pinInput}
                onChange={e=>setPinInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&enterParentMode()}
                placeholder="비밀번호 4자리"
                style={{width:"100%",boxSizing:"border-box",padding:"14px",borderRadius:12,border:`1.5px solid ${C.border}`,fontSize:22,outline:"none",marginBottom:12,textAlign:"center",letterSpacing:6}}/>
              <button onClick={enterParentMode}
                style={{width:"100%",padding:14,borderRadius:13,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",marginBottom:8}}>
                들어가기
              </button>
              <button onClick={()=>{ setShowParentPin(false); setPinInput(""); }}
                style={{width:"100%",padding:12,borderRadius:13,border:`1px solid ${C.border}`,background:C.faint,color:C.sub,fontSize:16,fontWeight:700,cursor:"pointer"}}>
                취소
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
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:th.main,color:"#fff",padding:"10px 24px",borderRadius:20,fontSize:17,fontWeight:700,zIndex:999,boxShadow:`0 4px 16px ${th.main}55`}}>{toast}</div>}

      {/* ── 헤더 ── */}
      <div style={{background:th.grad,padding:"20px 18px 0",boxShadow:"0 4px 20px rgba(0,0,0,0.12)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <p style={{fontSize:11,color:"rgba(255,255,255,0.75)",margin:0,letterSpacing:2,fontWeight:600}}>ACADEMY PLANNER</p>
            <h1 style={{fontSize:22,fontWeight:900,margin:"3px 0 0",color:"#fff"}}>🎒 엄마 관리 모드</h1>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"flex-end"}}>
            <button onClick={exitParentMode}
              style={{border:"1px solid rgba(255,255,255,0.35)",background:"rgba(255,255,255,0.25)",color:"#fff",borderRadius:10,padding:"7px 12px",fontSize:12,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>
              🎒 아이 모드
            </button>
            <button onClick={()=>setShowPinChangeModal(true)}
              style={{border:"1px solid rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.8)",borderRadius:10,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
              🔐 비번 변경
            </button>
          </div>
        </div>

        {/* 아이 탭 + 아이 추가 버튼 */}
        <div style={{display:"flex",alignItems:"flex-end",background:"rgba(0,0,0,0.15)",borderRadius:"12px 12px 0 0",overflow:"hidden"}}>
          <div style={{display:"flex",flex:1,overflowX:"auto"}}>
            {children.map(c=>{
              const t=getChildTheme(c);
              const sel=childId===c.id;
              return (
                <button key={c.id} onClick={()=>setChildId(c.id)}
                  style={{flex:"0 0 auto",minWidth:80,padding:"12px 16px",border:"none",cursor:"pointer",fontSize:17,fontWeight:sel?800:500,
                    background:sel?"rgba(255,255,255,0.95)":"transparent",
                    color:sel?t.main:"rgba(255,255,255,0.82)",whiteSpace:"nowrap",transition:"all 0.2s"}}>
                  {t.emoji} {c.name}
                </button>
              );
            })}
          </div>
          {/* 아이 추가 버튼 - 탭 우측 구석 */}
          <button onClick={openAddChild}
            style={{flexShrink:0,padding:"8px 12px",border:"none",background:"rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.85)",cursor:"pointer",borderLeft:"1px solid rgba(255,255,255,0.15)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}
            title="아이 추가">
            <span style={{fontSize:14,lineHeight:1}}>👶</span>
            <span style={{fontSize:9,fontWeight:600,letterSpacing:0.3,opacity:0.9}}>아이추가</span>
          </button>
        </div>
      </div>

      {/* ── 탭 바 ── */}
      <div style={{display:"flex",background:C.card,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
        {[["home","🏠 홈"],["calendar","🗓 달력"],["fee","💰 학원비"],["absence","🏥 결석"],["reward","🎁 리워드"],["sms","💬 문자"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"13px 2px",border:"none",background:"transparent",fontSize:12,fontWeight:tab===k?800:400,color:tab===k?th.main:C.sub,borderBottom:tab===k?`2.5px solid ${th.main}`:"2.5px solid transparent",cursor:"pointer",whiteSpace:"nowrap",transition:"color 0.2s"}}>{l}</button>
        ))}
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
          const homeTodos=homeAc.flatMap(ac=>{
            const entry=getDailyEntry(childId,ac.id,homeDate);
            const hw=entry.homeworks||[], todos=entry.todos||[];
            return [
              ...hw.map(h=>({...h,kind:"homework",academyId:ac.id,academyName:ac.name,academyColor:ac.color,label:h.text})),
              ...todos.map(t=>({...t,kind:"todo",academyId:ac.id,academyName:ac.name,academyColor:ac.color,label:t.text}))
            ];
          });
          // 기타 퀘스트도 포함
          const extraEntry=getDailyEntry(childId,EXTRA_QUEST_ID,homeDate);
          const extraTodos=(extraEntry.todos||[]).map(t=>({...t,kind:"todo",academyId:EXTRA_QUEST_ID,academyName:"기타",academyColor:th.main,label:t.text}));
          const allHomeTodos=[...homeTodos,...extraTodos];
          const absOnHome=curAbs.filter(a=>a.date===homeDate);
          const makeupOnHome=curAbs.filter(a=>a.makeupDate===homeDate);
          const homePendingHw=homeAc.reduce((n,ac)=>n+(getDailyEntry(childId,ac.id,homeDate).homeworks||[]).filter(h=>!h.done).length,0);
          const pendingHw=pendingHwTotal();
          return (
            <div>
              {/* 날짜 이동 헤더 카드 */}
              <div style={{background:th.grad,borderRadius:16,padding:"16px 18px",marginBottom:16,color:"#fff",boxShadow:`0 4px 18px ${th.main}30`}}>
                <p style={{fontSize:17,opacity:0.85,margin:"0 0 10px",fontWeight:600}}>{th.emoji} {curChild?.name}</p>
                {/* 날짜 이동 행 */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <button onClick={()=>setHomeDate(addDays(homeDate,-1))}
                    style={{width:38,height:38,borderRadius:12,background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.35)",color:"#fff",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>‹</button>
                  <div style={{flex:1,textAlign:"center"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                      <span style={{fontSize:18,fontWeight:900}}>{fullLabel}</span>
                      {dayTag&&<span style={{fontSize:17,background:"rgba(255,255,255,0.3)",borderRadius:6,padding:"2px 9px",fontWeight:700,flexShrink:0}}>{dayTag}</span>}
                    </div>
                    {!isToday&&(
                      <button onClick={()=>setHomeDate(TODAY)}
                        style={{marginTop:5,background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:6,color:"#fff",fontSize:17,cursor:"pointer",padding:"2px 12px",fontWeight:600}}>
                        ↩ 오늘로
                      </button>
                    )}
                  </div>
                  <button onClick={()=>setHomeDate(addDays(homeDate,1))}
                    style={{width:38,height:38,borderRadius:12,background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.35)",color:"#fff",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>›</button>
                </div>
                {/* 레벨/점수 요약 */}
                <div style={{background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.28)",borderRadius:12,padding:"10px 12px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div>
                    <p style={{fontSize:12,opacity:0.8,margin:"0 0 3px",fontWeight:700}}>현재 레벨</p>
                    <p style={{fontSize:17,fontWeight:900,margin:0}}>{getChildLevel(childId).emoji} Lv.{getChildLevel(childId).level} {getChildLevel(childId).name}</p>
                  </div>
                  <p style={{fontSize:20,fontWeight:900,margin:0}}>{getChildScore(childId)} XP</p>
                </div>
                {/* 요약 지표 */}
                <div style={{display:"flex",gap:6}}>
                  {[
                    {label:"학원",              value:`${homeAc.length}개`,           alert:false},
                    {label:"미완\n숙제",         value:`${homePendingHw}개`,            alert:homePendingHw>0},
                    {label:"결석",              value:`${absOnHome.length}개`,         alert:absOnHome.length>0},
                    {label:"보충\n수업",         value:`${makeupOnHome.length}개`,      alert:makeupOnHome.length>0},
                  ].map((s,i)=>(
                    <div key={i} style={{flex:1,background:s.alert?"rgba(255,80,80,0.25)":"rgba(255,255,255,0.2)",borderRadius:10,padding:"9px 4px",textAlign:"center",border:s.alert?"1px solid rgba(255,120,120,0.4)":"1px solid transparent"}}>
                      <p style={{fontSize:10,color:"rgba(255,255,255,0.82)",margin:0,fontWeight:600,whiteSpace:"pre-line",lineHeight:1.3}}>{s.label}</p>
                      <p style={{fontSize:15,fontWeight:800,margin:"3px 0 0",color:s.alert?"#FFE066":"#fff"}}>{s.value}</p>
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
                <div style={{textAlign:"center",padding:"30px 20px",background:C.card,borderRadius:16,border:`1.5px dashed ${C.border}`,marginBottom:14}}>
                  <p style={{fontSize:30,margin:0}}>😴</p>
                  <p style={{color:C.sub,fontSize:17,margin:"8px 0 0"}}>{dayTag||fullLabel}은 학원이 없어요</p>
                </div>
              )}

              {/* 결석 표시 */}
              {absOnHome.length>0&&(
                <div style={{background:`${C.red}08`,border:`1px solid ${C.red}25`,borderRadius:14,padding:"12px 16px",marginBottom:12}}>
                  <p style={{fontSize:17,fontWeight:700,color:C.red,margin:"0 0 6px"}}>🏥 결석</p>
                  {absOnHome.map(ab=>{
                    const ac=curAc.find(a=>a.id===Number(ab.academyId)); if(!ac) return null;
                    return <p key={ab.id} style={{fontSize:17,color:C.text,margin:"2px 0"}}>{ac.name}{ab.reason&&` · ${ab.reason}`}</p>;
                  })}
                </div>
              )}

              {/* 보충수업 표시 */}
              {makeupOnHome.length>0&&(
                <div style={{background:`${C.orange}08`,border:`1px solid ${C.orange}25`,borderRadius:14,padding:"12px 16px",marginBottom:12}}>
                  <p style={{fontSize:17,fontWeight:700,color:C.orange,margin:"0 0 6px"}}>📚 보충수업</p>
                  {makeupOnHome.map(ab=>{
                    const ac=curAc.find(a=>a.id===Number(ab.academyId)); if(!ac) return null;
                    return <p key={ab.id} style={{fontSize:17,color:C.text,margin:"2px 0"}}>{ac.name} (결석일: {ab.date})</p>;
                  })}
                </div>
              )}

              {/* 학원 카드 */}
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
                  <div key={ac.id} style={{background:C.card,borderRadius:18,marginBottom:14,border:`1.5px solid ${ac.color}30`,boxShadow:`0 4px 18px ${ac.color}12`,overflow:"hidden"}}>
                    <div style={{background:`${ac.color}10`,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:5,height:52,borderRadius:3,background:ac.color,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <p style={{fontSize:18,fontWeight:800,margin:0,color:C.text}}>{ac.name}</p>
                        <p style={{fontSize:17,color:C.sub,margin:"3px 0 0"}}>{sc?.time} ~ {endT} &nbsp;·&nbsp; {sc?.duration}분</p>
                        {(()=>{
                          const shuttleText=getShuttleText(ac,hDN);
                          if(!shuttleText) return null;
                          return <p style={{fontSize:14,color:C.sub,margin:"4px 0 0",lineHeight:1.35,whiteSpace:"pre-wrap"}}>🚌 {shuttleText}</p>;
                        })()}
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        {ac.phone&&<a href={`tel:${ac.phone}`} style={{width:38,height:38,borderRadius:10,background:`${C.green}15`,border:`1px solid ${C.green}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,textDecoration:"none"}}>📞</a>}
                        <button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }} style={{width:38,height:38,borderRadius:10,background:C.purpleL,border:`1px solid ${C.purple}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,cursor:"pointer"}}>💬</button>
                      </div>
                    </div>
                    <div style={{padding:"14px 16px"}}>
                      {/* 준비물 */}
                      <div style={{marginBottom:12}}>
                        <p style={{fontSize:17,fontWeight:700,color:C.sub,margin:"0 0 7px",letterSpacing:0.5}}>🎒 준비물</p>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {(ac.baseSupplies||[]).map((s,i)=><span key={`b${i}`} style={{fontSize:17,padding:"4px 11px",borderRadius:20,background:`${ac.color}18`,color:ac.color,fontWeight:600}}>{s}</span>)}
                          {sup.map((s,i)=><span key={`d${i}`} style={{fontSize:17,padding:"4px 11px",borderRadius:20,background:`${C.orange}15`,color:C.orange,fontWeight:600}}>+{s}</span>)}
                          {(ac.baseSupplies||[]).length===0&&sup.length===0&&<span style={{fontSize:17,color:"#CCC"}}>없음</span>}
                        </div>
                      </div>
                      {/* 학원별 할 일 요약 */}
                      <div style={{marginBottom:12}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
                          <p style={{fontSize:15,fontWeight:800,color:C.sub,margin:0}}>🎯 퀘스트 요약</p>
                          {totalTodoCnt>0&&<span style={{fontSize:13,fontWeight:800,color:allDone?C.green:C.orange}}>{allDone?"✓ 완료":`${doneCnt}/${totalTodoCnt}`}</span>}
                        </div>
                        {totalTodoCnt===0?(
                          <p style={{fontSize:14,color:"#CCC",margin:0}}>등록된 퀘스트 없음</p>
                        ):(
                          <div style={{display:"flex",flexDirection:"column",gap:5,background:C.faint,border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 10px"}}>
                            {hw.map(h=>(
                              <div key={`hw-summary-${h.id}`} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:h.done?C.sub:C.text,textDecoration:h.done?"line-through":"none"}}>
                                <span>{h.done?"✅":"⬜"}</span>
                                <span style={{flex:1}}>숙제: {h.text}</span>
                                <span style={{fontSize:11,color:C.orange,fontWeight:800}}>+{h.point||DEFAULT_HOMEWORK_SCORE} XP</span>
                              </div>
                            ))}
                            {todos.map(t=>(
                              <div key={`todo-summary-${t.id}`} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:t.done?C.sub:C.text,textDecoration:t.done?"line-through":"none"}}>
                                <span>{t.done?"✅":"⬜"}</span>
                                <span style={{flex:1}}>{t.text}</span>
                                <span style={{fontSize:11,color:C.orange,fontWeight:800}}>+{t.point||DEFAULT_HOMEWORK_SCORE} XP</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={()=>{ setShowDailyModal({academyId:ac.id,date:homeDate,acName:ac.name,acColor:ac.color,baseSupplies:ac.baseSupplies}); setDailyHwInput(""); setDailySupInput(""); setDailyTodoInput(""); setDailyHwPoint(DEFAULT_HOMEWORK_SCORE); setDailyTodoPoint(DEFAULT_HOMEWORK_SCORE); }}
                        style={{width:"100%",padding:"7px 10px",borderRadius:9,border:`1px dashed ${ac.color}40`,background:`${ac.color}06`,color:ac.color,fontSize:13,fontWeight:600,cursor:"pointer"}}>
                        🎯 퀘스트 · 준비물 편집
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 전체 퀘스트 카드 */}
              <div style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:12,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <p style={{fontSize:16,fontWeight:900,margin:0,color:C.text}}>🎯 오늘의 퀘스트</p>
                  <button onClick={()=>setShowTodoPickerModal(homeDate)}
                    style={{padding:"5px 11px",borderRadius:8,border:`1px solid ${th.main}40`,background:`${th.main}08`,color:th.main,fontSize:12,fontWeight:800,cursor:"pointer"}}>
                    ✏️ 퀘스트 수정
                  </button>
                </div>
                {allHomeTodos.length===0?(
                  <div style={{textAlign:"center",padding:"18px 10px",color:C.sub}}>
                    <p style={{fontSize:26,margin:0}}>🌿</p>
                    <p style={{fontSize:14,margin:"6px 0 0"}}>등록된 퀘스트가 없어요</p>
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {allHomeTodos.map(item=>(
                      <div key={`${item.kind}-${item.academyId}-${item.id}`} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 11px",borderRadius:11,background:item.done?`${C.green}10`:C.faint,border:`1px solid ${item.done?C.green+"30":C.border}`}}>
                        <button onClick={()=>{
                          if(item.kind==="homework") toggleHomeworkDone(childId,item.academyId,homeDate,item.id);
                          else toggleTodoDone(childId,item.academyId,homeDate,item.id);
                        }} style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${item.done?C.green:"#CCC"}`,background:item.done?C.green:"transparent",color:"#fff",fontWeight:900,cursor:"pointer",flexShrink:0,fontSize:12}}>
                          {item.done?"✓":""}
                        </button>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:11,color:item.academyColor,margin:"0 0 1px",fontWeight:800}}>
                            {item.kind==="homework"?"📚":"✅"} {item.academyName}{item.kind==="homework"?" 퀘스트":""}
                          </p>
                          <p style={{fontSize:15,fontWeight:700,margin:0,color:item.done?C.sub:C.text,textDecoration:item.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.label}</p>
                        </div>
                        <span style={{fontSize:11,color:C.orange,fontWeight:800,flexShrink:0}}>+{item.point||DEFAULT_HOMEWORK_SCORE} XP</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 등록 학원 목록 */}
              <div style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <p style={{fontSize:17,color:C.sub,fontWeight:700,margin:0,letterSpacing:0.5}}>📋 등록 학원 ({curAc.length})</p>
                  <button onClick={openAdd} style={{fontSize:13,padding:"5px 12px",borderRadius:8,border:"none",background:th.grad,color:"#fff",fontWeight:700,cursor:"pointer"}}>+ 학원 추가</button>
                </div>
                {curAc.length===0?(
                  <div style={{textAlign:"center",padding:"28px",color:C.sub,fontSize:17,background:C.card,borderRadius:14,border:`1.5px dashed ${C.border}`}}>
                    <p style={{fontSize:26,margin:"0 0 8px"}}>🏫</p>위 버튼으로 학원을 등록하세요
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {curAc.map(ac=>(
                      <div key={ac.id} style={{background:C.card,borderRadius:14,border:`1.5px solid ${ac.color}30`,overflow:"hidden",boxShadow:`0 2px 10px ${ac.color}10`}}>
                        <div style={{background:`${ac.color}10`,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:5,height:42,borderRadius:3,background:ac.color,flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <p style={{fontSize:18,fontWeight:900,margin:0,color:C.text}}>{ac.name}</p>
                            <p style={{fontSize:17,color:C.sub,margin:"3px 0 0"}}>
                              {ac.useCustomSchedule
                                ? (ac.schedules||[]).map(s=>`${s.day} ${s.time}`).join(" / ")
                                : `${(ac.days||[]).join("·")}요일 · ${ac.time} · ${ac.duration}분`}
                            </p>
                          </div>
                          <button onClick={()=>openEdit(ac)} style={{padding:"5px 10px",borderRadius:8,border:`1px solid ${ac.color}40`,background:`${ac.color}10`,color:ac.color,fontSize:13,fontWeight:700,cursor:"pointer",flexShrink:0}}>✏️ 수정</button>
                        </div>
                        <div style={{padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
                          <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:8}}>
                            <span style={{fontSize:17,color:C.sub}}>💰 월 {Number(ac.fee).toLocaleString()}원</span>
                            {ac.teacher&&<span style={{fontSize:17,color:C.sub}}>👩‍🏫 {ac.teacher}</span>}
                          </div>
                          <div style={{display:"flex",gap:6,flexShrink:0}}>
                            {ac.phone&&<a href={`tel:${ac.phone}`} style={{width:34,height:34,borderRadius:8,background:`${C.green}12`,border:`1px solid ${C.green}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,textDecoration:"none"}}>📞</a>}
                            <button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }} style={{width:34,height:34,borderRadius:8,background:C.purpleL,border:`1px solid ${C.purple}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,cursor:"pointer"}}>💬</button>
                            <button onClick={()=>setShowDetailModal(ac)} style={{width:34,height:34,borderRadius:8,background:C.faint,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,cursor:"pointer"}}>›</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                <button onClick={()=>{ setCalDate(new Date(calDate.getFullYear(),calDate.getMonth()-1,1)); setCalSelDate(null); }} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,width:36,height:36,fontSize:18,cursor:"pointer",color:C.text}}>‹</button>
                <span style={{fontWeight:800,fontSize:18}}>{calDate.getFullYear()}년 {calDate.getMonth()+1}월</span>
                <button onClick={()=>{ setCalDate(new Date(calDate.getFullYear(),calDate.getMonth()+1,1)); setCalSelDate(null); }} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,width:36,height:36,fontSize:18,cursor:"pointer",color:C.text}}>›</button>
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
                  if(pendingHwD&&!hasVac) badges.push("⚠️");
                  else if(doneHwD&&!hasVac) badges.push("✓");
                  if(hasExSup) badges.push("🎒");
                  if(hasMemo) badges.push("📝");
                  const shuttleToday=acList.some(a=>getShuttleText(a,dn));
                  if(shuttleToday) badges.push("🚌");
                  return (
                    <div key={i} onClick={()=>setCalSelDate(isSel?null:dateStr)}
                      style={{background:isToday?th.main:isSel?`${th.main}15`:hasVac?"#FFF3CD":C.card,borderRadius:10,padding:"4px 3px 3px",minHeight:68,cursor:"pointer",
                        border:`${isSel?"2px":"1px"} solid ${isToday?"transparent":isSel?th.main:hasVac?"#F0A500":C.border}`,
                        position:"relative",boxShadow:isToday?`0 3px 12px ${th.main}50`:isSel?`0 2px 10px ${th.main}30`:"none",
                        display:"flex",flexDirection:"column",transition:"all 0.15s"}}>
                      {/* 날짜 숫자 - 공휴일이면 빨간색 */}
                      <div style={{fontSize:13,fontWeight:isToday||isSel?900:600,
                        color:isToday?"#fff":isSel?th.main:holiday?"#E74C3C":dn==="일"?"#E74C3C":dn==="토"?"#3498DB":C.text,
                        textAlign:"right",paddingRight:3,marginBottom:1}}>{day}</div>
                      {/* 공휴일 이름 */}
                      {holiday&&!isToday&&(
                        <div style={{fontSize:8,color:"#E74C3C",fontWeight:700,paddingLeft:2,marginBottom:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",lineHeight:1.2}}>
                          {getHolidayName(dateStr)}
                        </div>
                      )}
                      {acList.length>0&&<div style={{display:"flex",gap:2,flexWrap:"wrap",paddingLeft:3,marginBottom:2}}>
                        {acList.map((a,j)=><div key={j} style={{width:7,height:7,borderRadius:"50%",background:isToday?"rgba(255,255,255,0.85)":a.color}}/>)}
                      </div>}
                      {badges.length>0&&<div style={{display:"flex",gap:1,flexWrap:"wrap",paddingLeft:2,marginTop:"auto",paddingBottom:2}}>
                        {badges.slice(0,4).map((b,j)=><span key={j} style={{fontSize:b==="✓"?9:10,color:b==="✓"?C.green:"inherit",fontWeight:b==="✓"?900:"normal",lineHeight:1}}>{b}</span>)}
                      </div>}
                    </div>
                  );
                })}
              </div>

              {/* 범례 */}
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:10,padding:"10px 12px",background:C.card,borderRadius:10,border:`1px solid ${C.border}`}}>
                {[{icon:"●",label:"학원"},{icon:"🔴",label:"공휴일"},{icon:"🏥",label:"결석"},{icon:"📚",label:"보충예정"},{icon:"✅",label:"보충완료"},{icon:"🏖️",label:"방학"},{icon:"🚌",label:"셔틀"},{icon:"⚠️",label:"숙제미완"},{icon:"🎒",label:"추가준비물"},{icon:"📝",label:"메모"}].map((l,i)=>(
                  <span key={i} style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:C.sub}}>
                    <span style={{fontSize:i===0?8:i===1?10:11,color:i===0?th.main:i===1?"#E74C3C":"inherit"}}>{l.icon}</span>{l.label}
                  </span>
                ))}
              </div>

              {/* 선택 날짜 상세 */}
              {selInfo&&(
                <div style={{marginTop:14,background:C.card,borderRadius:16,border:`1.5px solid ${th.main}30`,overflow:"hidden",boxShadow:`0 4px 18px ${th.main}12`}}>
                  <div style={{background:th.grad,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <p style={{fontSize:20,fontWeight:900,margin:0,color:"#fff"}}>{selInfo.m+1}월 {selInfo.day}일 <span style={{fontSize:14,fontWeight:600,opacity:0.85}}>{selInfo.dn}요일</span></p>
                        {calSelDate===TODAY&&<span style={{fontSize:12,background:"rgba(255,255,255,0.3)",color:"#fff",borderRadius:6,padding:"2px 10px",fontWeight:700}}>오늘</span>}
                        {selInfo.holiday&&<span style={{fontSize:12,background:"rgba(231,76,60,0.8)",color:"#fff",borderRadius:6,padding:"2px 10px",fontWeight:700}}>🎌 {selInfo.holiday}</span>}
                      </div>
                    </div>
                    <button onClick={()=>setCalSelDate(null)} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",color:"#fff",fontSize:16}}>✕</button>
                  </div>
                  <div style={{padding:"16px 16px"}}>
                    {/* 방학 표시 */}
                    {(()=>{
                      const vacOnDay=selInfo.acList.filter(a=>isVacationDay(childId,a.id,calSelDate));
                      if(vacOnDay.length===0) return null;
                      return (
                        <div style={{background:"#FFF8E1",border:"1px solid #F0A500",borderRadius:12,padding:"12px 14px",marginBottom:12}}>
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
                      <div style={{background:`${C.red}08`,border:`1px solid ${C.red}25`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                        <p style={{fontSize:17,fontWeight:700,color:C.red,margin:"0 0 8px"}}>🏥 결석</p>
                        {selInfo.absOnDay.map(ab=>{
                          const ac=curAc.find(a=>a.id===Number(ab.academyId)); if(!ac) return null;
                          return (
                            <div key={ab.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderTop:`1px solid ${C.red}15`}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:ac.color}}/>
                              <div style={{flex:1}}>
                                <span style={{fontSize:17,fontWeight:700,color:C.text}}>{ac.name}</span>
                                {ab.reason&&<span style={{fontSize:17,color:C.sub,marginLeft:6}}>· {ab.reason}</span>}
                              </div>
                              {ac.phone&&<button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }} style={{fontSize:17,padding:"4px 10px",borderRadius:7,border:`1px solid ${C.purple}30`,background:C.purpleL,color:C.purple,cursor:"pointer",fontWeight:600}}>💬 문자</button>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* 보충수업 */}
                    {selInfo.makeupOnDay.length>0&&(
                      <div style={{background:`${C.orange}08`,border:`1px solid ${C.orange}30`,borderRadius:12,padding:"12px 14px",marginBottom:12}}>
                        <p style={{fontSize:17,fontWeight:700,color:C.orange,margin:"0 0 8px"}}>📚 보충수업</p>
                        {selInfo.makeupOnDay.map(ab=>{
                          const ac=curAc.find(a=>a.id===Number(ab.academyId)); if(!ac) return null;
                          return (
                            <div key={ab.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderTop:`1px solid ${C.orange}15`}}>
                              <div style={{width:8,height:8,borderRadius:"50%",background:ac.color}}/>
                              <div style={{flex:1}}>
                                <span style={{fontSize:17,fontWeight:700,color:C.text}}>{ac.name}</span>
                                <p style={{fontSize:17,color:C.sub,margin:"2px 0 0"}}>결석일: {ab.date}</p>
                              </div>
                              <button onClick={()=>setAbsences(p=>({...p,[childId]:(p[childId]||[]).map(a=>a.id===ab.id?{...a,makeupDone:!a.makeupDone}:a)}))}
                                style={{fontSize:17,padding:"4px 10px",borderRadius:7,border:`1px solid ${ab.makeupDone?C.green+"40":C.orange+"40"}`,background:ab.makeupDone?`${C.green}12`:`${C.orange}12`,color:ab.makeupDone?C.green:C.orange,cursor:"pointer",fontWeight:700}}>
                                {ab.makeupDone?"✓ 완료":"완료처리"}
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
                          style={{flex:1,background:C.faint,border:`1px solid ${C.faintB}`,borderRadius:9,padding:"9px 12px",fontSize:17,color:C.text,outline:"none"}}/>
                        {dayMemos[selInfo.mk]&&<button onClick={()=>setDayMemos(p=>({...p,[selInfo.mk]:""}))} style={{background:"none",border:"none",color:"#CCC",cursor:"pointer",fontSize:15}}>✕</button>}
                      </div>
                    </div>
                    {selInfo.acList.length===0&&selInfo.absOnDay.length===0&&selInfo.makeupOnDay.length===0&&(
                      <div style={{textAlign:"center",padding:"20px 0",color:C.sub,fontSize:14}}>
                        <p style={{fontSize:26,margin:"0 0 6px"}}>😴</p>학원이 없는 날이에요
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
                        <div key={ac.id} style={{marginBottom:12,borderRadius:14,border:`1.5px solid ${ac.color}25`,overflow:"hidden"}}>
                          <div style={{background:`${ac.color}10`,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:4,height:38,borderRadius:2,background:ac.color,flexShrink:0}}/>
                            <div style={{flex:1}}>
                              <p style={{fontSize:17,fontWeight:800,margin:0,color:C.text}}>{ac.name}</p>
                              <p style={{fontSize:17,color:C.sub,margin:"2px 0 0"}}>{sc?.time} ~ {endT} · {sc?.duration}분</p>
                              {(()=>{
                                const shuttleText=getShuttleText(ac,selInfo.dn);
                                if(!shuttleText) return null;
                                return <p style={{fontSize:14,color:C.sub,margin:"4px 0 0",lineHeight:1.35,whiteSpace:"pre-wrap"}}>🚌 {shuttleText}</p>;
                              })()}
                            </div>
                            {totalTodoCnt>0&&<span style={{fontSize:17,fontWeight:700,color:allDone?C.green:C.orange,background:allDone?`${C.green}15`:`${C.orange}15`,borderRadius:6,padding:"3px 8px"}}>{allDone?"✓ 완료":`${doneCnt}/${totalTodoCnt}`}</span>}
                          </div>
                          <div style={{padding:"12px 14px"}}>
                            <div style={{marginBottom:10}}>
                              <p style={{fontSize:17,fontWeight:700,color:C.sub,margin:"0 0 6px"}}>🎒 준비물</p>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {(ac.baseSupplies||[]).map((s,i)=><span key={`b${i}`} style={{fontSize:17,padding:"3px 10px",borderRadius:20,background:`${ac.color}18`,color:ac.color,fontWeight:600}}>{s}</span>)}
                                {sup.map((s,i)=><span key={`d${i}`} style={{fontSize:17,padding:"3px 10px",borderRadius:20,background:`${C.orange}15`,color:C.orange,fontWeight:600}}>+{s}</span>)}
                                {(ac.baseSupplies||[]).length===0&&sup.length===0&&<span style={{fontSize:17,color:"#CCC"}}>없음</span>}
                              </div>
                            </div>
                            <button onClick={()=>{ setShowDailyModal({academyId:ac.id,date:calSelDate,acName:ac.name,acColor:ac.color,baseSupplies:ac.baseSupplies}); setDailyHwInput(""); setDailySupInput(""); setDailyTodoInput(""); setDailyHwPoint(DEFAULT_HOMEWORK_SCORE); setDailyTodoPoint(DEFAULT_HOMEWORK_SCORE); }}
                              style={{width:"100%",padding:"7px 10px",borderRadius:9,border:`1px dashed ${ac.color}40`,background:`${ac.color}06`,color:ac.color,fontSize:13,fontWeight:600,cursor:"pointer"}}>
                              🎯 퀘스트 · 준비물 편집
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {!selInfo&&<div style={{marginTop:12,textAlign:"center",padding:"18px",color:C.sub,fontSize:17,background:C.card,borderRadius:12,border:`1.5px dashed ${C.border}`}}>날짜를 탭하면 학원·숙제·결석·보충수업을 확인할 수 있어요</div>}

              {/* 이번 주 예정 */}
              <div style={{marginTop:14,marginBottom:14}}>
                <p style={{fontSize:17,color:C.sub,fontWeight:700,marginBottom:10,letterSpacing:0.5}}>📅 이번 주 예정</p>
                <div style={{background:C.card,borderRadius:14,border:`1px solid ${C.border}`,overflow:"hidden"}}>
                  {DAYS.map(day=>{
                    const da=curAc.filter(a=>hasClassOnDay(a,day)).sort((a,b)=>getClassTime(a,day).localeCompare(getClassTime(b,day)));
                    if(da.length===0) return null;
                    const isTodayRow=day===todayDN();
                    const now=new Date();
                    const nowDay=now.getDay()===0?7:now.getDay();
                    const diff=(DAYS.indexOf(day)+1)-nowDay;
                    const rowDate=toStr(new Date(now.getFullYear(),now.getMonth(),now.getDate()+diff));
                    return (
                      <div key={day} style={{display:"flex",alignItems:"center",padding:"11px 14px",borderBottom:`1px solid ${C.border}`,background:isTodayRow?`${th.main}08`:"transparent"}}>
                        <span style={{width:28,fontSize:15,fontWeight:700,color:isTodayRow?th.main:DAY_COLORS[day]}}>{day}</span>
                        {isTodayRow&&<span style={{fontSize:17,background:th.main,color:"#fff",borderRadius:4,padding:"1px 6px",marginRight:6,fontWeight:700,flexShrink:0}}>오늘</span>}
                        <div style={{flex:1,display:"flex",gap:6,flexWrap:"wrap"}}>
                          {da.map(a=>{
                            const onVac=isVacationDay(childId,a.id,rowDate);
                            return (
                              <span key={a.id} style={{fontSize:14,padding:"3px 8px",borderRadius:6,background:onVac?"#FFF8E1":`${a.color}18`,color:onVac?"#E65100":a.color,fontWeight:600}}>
                                {onVac?"🏖️ ":""}{a.name} {getClassTime(a,day)}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {DAYS.every(day=>curAc.filter(a=>hasClassOnDay(a,day)).length===0)&&<p style={{textAlign:"center",padding:"16px",color:C.sub,fontSize:17,margin:0}}>이번 주 예정 없음</p>}
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
              <button onClick={()=>setFeeMonth(m=>Math.max(1,m-1))} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,width:36,height:36,fontSize:18,cursor:"pointer",color:C.text}}>‹</button>
              <span style={{fontWeight:800,fontSize:17}}>{feeMonth}월 학원비</span>
              <button onClick={()=>setFeeMonth(m=>Math.min(12,m+1))} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,width:36,height:36,fontSize:18,cursor:"pointer",color:C.text}}>›</button>
            </div>
            <div style={{background:th.grad,borderRadius:16,padding:"20px 22px",marginBottom:16,color:"#fff"}}>
              <p style={{fontSize:17,opacity:0.8,margin:0,fontWeight:600}}>{th.emoji} {curChild?.name} 총 학원비</p>
              <p style={{fontSize:32,fontWeight:900,margin:"6px 0 4px"}}>{totalFee(childId).toLocaleString()}원</p>
              <p style={{fontSize:17,opacity:0.75,margin:0}}>납부 {curAc.filter(a=>isPaid(a.id)).length}/{curAc.length}개 완료</p>
            </div>
            {curAc.map(a=>{
              const st=payStatus(a);
              return (
                <div key={a.id} style={{background:C.card,borderRadius:14,padding:"16px 18px",marginBottom:12,border:`1px solid ${isPaid(a.id)?C.green+"40":C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:a.color,flexShrink:0}}/>
                    <p style={{fontSize:17,fontWeight:700,margin:0,flex:1,color:C.text}}>{a.name}</p>
                    <button onClick={()=>togglePaid(a.id)} style={{padding:"6px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:17,fontWeight:700,background:isPaid(a.id)?`${C.green}18`:C.faint,color:isPaid(a.id)?C.green:C.sub}}>
                      {isPaid(a.id)?"✓ 납부완료":"미납"}
                    </button>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:20}}>
                      <div><p style={{fontSize:17,color:C.sub,margin:0}}>월 학원비</p><p style={{fontSize:17,fontWeight:800,margin:"3px 0 0",color:C.text}}>{Number(a.fee).toLocaleString()}원</p></div>
                      <div><p style={{fontSize:17,color:C.sub,margin:0}}>납부일</p><p style={{fontSize:17,fontWeight:800,margin:"3px 0 0",color:C.text}}>매월 {a.payDay}일</p></div>
                    </div>
                    <span style={{fontSize:17,fontWeight:700,padding:"5px 12px",borderRadius:8,background:`${st.color}15`,color:st.color}}>{st.label}</span>
                  </div>
                </div>
              );
            })}
            {curAc.length===0&&<div style={{textAlign:"center",padding:"40px",color:C.sub,fontSize:17,background:C.card,borderRadius:14,border:`1.5px dashed ${C.border}`}}>등록된 학원이 없어요</div>}
          </div>
        )}

        {/* ════ 결석 탭 ════ */}
        {tab==="absence"&&(
          <div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[{l:"전체",v:curAbs.length,c:C.red},{l:"보충 예정",v:curAbs.filter(a=>a.makeupDate&&!a.makeupDone).length,c:C.orange},{l:"보충 완료",v:curAbs.filter(a=>a.makeupDone).length,c:C.green}].map((s,i)=>(
                <div key={i} style={{flex:1,background:C.card,borderRadius:12,padding:"14px 8px",textAlign:"center",border:`1px solid ${s.c}20`}}>
                  <p style={{fontSize:17,color:C.sub,margin:0}}>{s.l}</p>
                  <p style={{fontSize:22,fontWeight:800,margin:"4px 0 0",color:s.c}}>{s.v}</p>
                </div>
              ))}
            </div>
            <button onClick={()=>setShowAbsModal(true)} style={{width:"100%",padding:"10px",borderRadius:10,border:`1px dashed ${C.red}40`,background:`${C.red}06`,color:C.red,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:16}}>+ 결석 기록 추가</button>
            {[...curAbs].sort((a,b)=>b.date.localeCompare(a.date)).map(ab=>{
              const ac=curAc.find(a=>a.id===Number(ab.academyId)); if(!ac) return null;
              const past=ab.makeupDate&&ab.makeupDate<TODAY;
              return (
                <div key={ab.id} style={{background:C.card,borderRadius:14,padding:"16px 18px",marginBottom:12,border:`1px solid ${ab.makeupDone?C.green+"33":C.border}`}}>
                  <div style={{display:"flex",gap:10}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:ac.color,marginTop:5,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <p style={{fontWeight:700,fontSize:17,margin:0,color:C.text}}>{ac.name}</p>
                        <button onClick={()=>deleteAbs(ab.id)} style={{background:"none",border:"none",color:"#CCC",cursor:"pointer",fontSize:18}}>✕</button>
                      </div>
                      <p style={{fontSize:17,color:C.sub,margin:"4px 0 10px"}}>결석일: {ab.date}{ab.reason&&` · ${ab.reason}`}</p>
                      <div style={{padding:"12px 14px",borderRadius:10,background:ab.makeupDone?`${C.green}0D`:past?`${C.red}0D`:C.faint,border:`1px solid ${ab.makeupDone?C.green+"33":past?C.red+"33":C.faintB}`}}>
                        {ab.makeupDate?(
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <p style={{fontSize:17,color:C.sub,margin:0}}>보충 일정</p>
                              <p style={{fontSize:17,fontWeight:700,margin:"3px 0 0",color:ab.makeupDone?C.green:past?C.red:C.text}}>{ab.makeupDate}</p>
                              {past&&!ab.makeupDone&&<p style={{fontSize:17,color:C.red,margin:"2px 0 0"}}>⚠️ 보충일이 지났어요</p>}
                            </div>
                            <button onClick={()=>toggleMakeup(ab.id)} style={{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontSize:17,fontWeight:700,background:ab.makeupDone?`${C.green}18`:C.faint,color:ab.makeupDone?C.green:C.sub}}>{ab.makeupDone?"✓ 완료":"완료 처리"}</button>
                          </div>
                        ):<p style={{fontSize:17,color:C.sub,margin:0}}>📭 보충 일정 미정</p>}
                      </div>
                      <button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }} style={{width:"100%",marginTop:10,padding:"9px",borderRadius:10,border:`1px solid ${C.purple}30`,background:C.purpleL,color:C.purple,fontSize:17,fontWeight:700,cursor:"pointer"}}>💬 결석 안내 문자 보내기</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {curAbs.length===0&&<div style={{textAlign:"center",padding:"40px 20px",background:C.card,borderRadius:16,border:`1.5px dashed ${C.border}`}}><p style={{fontSize:32,margin:0}}>🙌</p><p style={{color:C.sub,fontSize:17,margin:"8px 0 0"}}>결석 기록이 없어요!</p></div>}
          </div>
        )}

        {/* ════ 보상 탭 ════ */}
        {tab==="reward"&&(
          <div>
            {getChildRewardRequests(childId).filter(r=>r.status==="pending").length>0&&(
              <div style={{background:"#FFF8E1",border:"1.5px solid #F0A500",borderRadius:16,padding:"16px",marginBottom:14}}>
                <p style={{fontSize:17,fontWeight:900,margin:"0 0 10px",color:"#E65100"}}>🛒 구매 요청 대기</p>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {getChildRewardRequests(childId).filter(r=>r.status==="pending").map(req=>(
                    <div key={req.id} style={{background:"#fff",borderRadius:12,padding:"12px",border:"1px solid #F0A500"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <span style={{fontSize:25}}>{req.emoji}</span>
                        <div style={{flex:1}}>
                          <p style={{fontSize:16,fontWeight:900,margin:0,color:C.text}}>{req.title}</p>
                          <p style={{fontSize:13,color:C.sub,fontWeight:700,margin:"2px 0 0"}}>{req.point} XP 사용</p>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>approveRewardRequest(req.id)}
                          style={{flex:1,border:"none",background:C.green,color:"#fff",borderRadius:10,padding:"10px",fontSize:14,fontWeight:900,cursor:"pointer"}}>승인</button>
                        <button onClick={()=>rejectRewardRequest(req.id)}
                          style={{flex:1,border:`1px solid ${C.red}40`,background:`${C.red}0A`,color:C.red,borderRadius:10,padding:"10px",fontSize:14,fontWeight:900,cursor:"pointer"}}>거절</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{background:C.card,borderRadius:16,padding:"16px",marginBottom:14,border:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div>
                  <p style={{fontSize:17,fontWeight:900,margin:"0 0 3px",color:C.text}}>🎁 리워드 관리</p>
                  <p style={{fontSize:13,color:C.sub,margin:0,fontWeight:700}}>{curChild?.name}의 리워드 목록을 관리해요</p>
                </div>
                <button onClick={()=>setShowRewardModal(true)}
                  style={{border:"none",background:th.grad,color:"#fff",borderRadius:10,padding:"8px 12px",fontSize:13,fontWeight:900,cursor:"pointer"}}>+ 보상</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {getChildRewards(childId).map(reward=>(
                  <div key={reward.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,background:C.faint,border:`1px solid ${C.border}`}}>
                    <span style={{fontSize:23}}>{reward.emoji}</span>
                    <div style={{flex:1}}>
                      <p style={{fontSize:16,fontWeight:900,margin:0,color:C.text}}>{reward.title}</p>
                      <p style={{fontSize:13,color:C.sub,fontWeight:700,margin:"2px 0 0"}}>{reward.point} XP 필요</p>
                    </div>
                    <button onClick={()=>deleteReward(reward.id)}
                      style={{border:`1px solid ${C.red}30`,background:`${C.red}0A`,color:C.red,borderRadius:8,padding:"5px 9px",fontSize:12,fontWeight:800,cursor:"pointer"}}>삭제</button>
                  </div>
                ))}
              </div>
            </div>

            {/* 수동 XP 조정 - 독립 카드 */}
            <div style={{background:C.card,borderRadius:16,padding:"14px 16px",marginBottom:12,border:`1px solid ${C.border}`}}>
              <p style={{fontSize:15,fontWeight:900,color:C.text,margin:"0 0 10px"}}>✍️ 수동 XP 조정</p>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                <button onClick={()=>setXpAdjustSign("+")}
                  style={{flex:1,padding:"8px 0",borderRadius:9,border:`1.5px solid ${xpAdjustSign==="+"?C.green:C.border}`,background:xpAdjustSign==="+"?`${C.green}15`:"#fff",color:xpAdjustSign==="+"?C.green:C.sub,fontSize:14,fontWeight:900,cursor:"pointer"}}>
                  + 지급
                </button>
                <button onClick={()=>setXpAdjustSign("-")}
                  style={{flex:1,padding:"8px 0",borderRadius:9,border:`1.5px solid ${xpAdjustSign==="-"?C.red:C.border}`,background:xpAdjustSign==="-"?`${C.red}10`:"#fff",color:xpAdjustSign==="-"?C.red:C.sub,fontSize:14,fontWeight:900,cursor:"pointer"}}>
                  - 차감
                </button>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input value={xpAdjustLabel} onChange={e=>setXpAdjustLabel(e.target.value)}
                  placeholder="사유"
                  style={{flex:1,padding:"9px 10px",borderRadius:9,border:`1px solid ${C.border}`,fontSize:13,outline:"none",background:"#fff",minWidth:0}}/>
                <input type="number" value={xpAdjustInput} onChange={e=>setXpAdjustInput(e.target.value)}
                  placeholder="XP"
                  style={{width:58,padding:"9px 6px",borderRadius:9,border:`1px solid ${C.border}`,fontSize:14,outline:"none",background:"#fff",textAlign:"center",flexShrink:0}}/>
                <button onClick={()=>{
                  const v=Number(xpAdjustInput);
                  if(!v||v<=0){ showToast("XP 값을 입력해줘"); return; }
                  const point=xpAdjustSign==="+"?v:-v;
                  addChildScore(childId,point,xpAdjustLabel||"수동 조정","manual");
                  setXpAdjustInput(""); setXpAdjustLabel("");
                  showToast(xpAdjustSign==="+"?`+${v} XP 지급 완료`:`-${v} XP 차감 완료`);
                }} style={{padding:"9px 14px",borderRadius:9,border:"none",background:xpAdjustSign==="+"?C.green:C.red,color:"#fff",fontSize:13,fontWeight:900,cursor:"pointer",flexShrink:0}}>
                  {xpAdjustSign==="+"?"지급":"차감"}
                </button>
              </div>
            </div>

            {/* XP 통장 */}
            <div style={{background:C.card,borderRadius:16,padding:"16px",marginBottom:14,border:`1px solid ${C.border}`}}>
              <button onClick={()=>setShowParentXP(v=>!v)}
                style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
                <div style={{textAlign:"left"}}>
                  <p style={{fontSize:17,fontWeight:900,margin:"0 0 2px",color:C.text}}>⭐ XP 통장</p>
                  <p style={{fontSize:13,color:C.sub,margin:0,fontWeight:700}}>{curChild?.name}의 XP 변동 내역</p>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:14,fontWeight:900,color:th.main,background:th.light,padding:"5px 10px",borderRadius:16}}>
                    {getChildScore(childId)} XP
                  </span>
                  <span style={{fontSize:12,color:th.main,fontWeight:900,background:th.light,padding:"5px 9px",borderRadius:12}}>
                    {showParentXP?"닫기 ▲":"열기 ▼"}
                  </span>
                </div>
              </button>

              {showParentXP&&(
                <div style={{marginTop:12}}>
                  {getScoreHistory(childId).length===0?(
                    <div style={{textAlign:"center",padding:"20px 8px",color:C.sub}}>
                      <p style={{fontSize:28,margin:0}}>📭</p>
                      <p style={{fontSize:15,margin:"6px 0 0"}}>아직 XP 기록이 없어요</p>
                    </div>
                  ):(
                    <div style={{display:"flex",flexDirection:"column",gap:7}}>
                      {getScoreHistory(childId).slice().reverse().slice(0,20).map(item=>{
                        const plus=Number(item.point)>=0;
                        return (
                          <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,background:C.faint,border:`1px solid ${C.border}`}}>
                            <span style={{width:28,height:28,borderRadius:"50%",background:plus?`${C.green}15`:`${C.red}10`,color:plus?C.green:C.red,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:14,flexShrink:0}}>
                              {plus?"+":"-"}
                            </span>
                            <div style={{flex:1}}>
                              <p style={{fontSize:14,fontWeight:800,margin:0,color:C.text}}>{getScoreHistoryLabel(item)}</p>
                              <p style={{fontSize:11,color:C.sub,margin:"2px 0 0"}}>{item.date||""}</p>
                            </div>
                            <span style={{fontSize:13,fontWeight:900,color:plus?C.green:C.red,flexShrink:0}}>
                              {plus?"+":""}{item.point} XP
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════ 문자 탭 ════ */}
        {tab==="sms"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <p style={{fontSize:17,color:C.sub,fontWeight:700,margin:0}}>문자 템플릿 관리</p>
              <button onClick={()=>{ setShowTmplEdit("new"); setEditTmpl({title:"",body:""}); }} style={{padding:"7px 14px",borderRadius:8,border:"none",background:th.grad,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ 새 템플릿</button>
            </div>
            <div style={{background:`${C.purple}08`,border:`1px solid ${C.purple}25`,borderRadius:12,padding:"12px 16px",marginBottom:16}}>
              <p style={{fontSize:17,color:C.purple,fontWeight:700,margin:"0 0 6px"}}>📌 사용 가능한 변수</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {["{아이이름}","{학원명}","{날짜}","{시간}"].map(v=><span key={v} style={{fontSize:17,padding:"3px 10px",borderRadius:6,background:C.purpleL,color:C.purple,fontWeight:600}}>{v}</span>)}
              </div>
            </div>
            {templates.map(tmpl=>(
              <div key={tmpl.id} style={{background:C.card,borderRadius:14,padding:"16px 18px",marginBottom:12,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                  <span style={{fontWeight:700,fontSize:17,color:C.text}}>💬 {tmpl.title}</span>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{ setShowTmplEdit(tmpl.id); setEditTmpl({title:tmpl.title,body:tmpl.body}); }} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${C.border}`,background:C.faint,color:C.sub,fontSize:12,cursor:"pointer"}}>수정</button>
                    <button onClick={()=>{ setTemplates(p=>p.filter(t=>t.id!==tmpl.id)); showToast("삭제됨"); }} style={{padding:"4px 10px",borderRadius:6,border:`1px solid ${C.red}30`,background:`${C.red}0A`,color:C.red,fontSize:12,cursor:"pointer"}}>삭제</button>
                  </div>
                </div>
                <p style={{fontSize:17,color:C.sub,margin:0,whiteSpace:"pre-wrap",background:C.faint,borderRadius:8,padding:"10px 12px"}}>{tmpl.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════ 모달들 ════════ */}

      {/* ── 퀘스트 수정 학원 선택 피커 ── */}
      {showTodoPickerModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"flex-end",zIndex:1000}} onClick={()=>setShowTodoPickerModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"22px 18px 44px",width:"100%",maxWidth:430,boxSizing:"border-box",maxHeight:"80vh",overflowY:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:900,color:C.text}}>✏️ 퀘스트 수정</h3>
              <button onClick={()=>setShowTodoPickerModal(null)} style={{background:C.faint,border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
            </div>
            <p style={{fontSize:12,color:C.sub,fontWeight:600,margin:"0 0 14px"}}>수정할 학원을 선택하거나, 기타 퀘스트를 추가하세요</p>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {curAc.map(ac=>(
                <button key={ac.id} onClick={()=>{
                  setShowDailyModal({academyId:ac.id,date:showTodoPickerModal,acName:ac.name,acColor:ac.color,baseSupplies:ac.baseSupplies});
                  setDailyHwInput(""); setDailySupInput(""); setDailyTodoInput("");
                  setDailyHwPoint(DEFAULT_HOMEWORK_SCORE); setDailyTodoPoint(DEFAULT_HOMEWORK_SCORE);
                  setShowTodoPickerModal(null);
                }} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:13,border:`1.5px solid ${ac.color}30`,background:`${ac.color}06`,cursor:"pointer",textAlign:"left"}}>
                  <div style={{width:9,height:9,borderRadius:"50%",background:ac.color,flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <p style={{fontSize:15,fontWeight:900,margin:0,color:C.text}}>{ac.name}</p>
                    <p style={{fontSize:11,color:C.sub,margin:"2px 0 0",fontWeight:600}}>{getSchedules(ac).map(s=>`${s.day} ${s.time}`).join(" / ")}</p>
                  </div>
                  <span style={{fontSize:12,color:ac.color,fontWeight:700}}>선택 →</span>
                </button>
              ))}
              {/* 기타 퀘스트 */}
              <button onClick={()=>{
                setShowDailyModal({academyId:EXTRA_QUEST_ID,date:showTodoPickerModal,acName:"기타 퀘스트",acColor:th.main,baseSupplies:[]});
                setDailyHwInput(""); setDailySupInput(""); setDailyTodoInput("");
                setDailyHwPoint(DEFAULT_HOMEWORK_SCORE); setDailyTodoPoint(DEFAULT_HOMEWORK_SCORE);
                setShowTodoPickerModal(null);
              }} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:13,border:`1.5px dashed ${th.main}40`,background:`${th.main}06`,cursor:"pointer",textAlign:"left"}}>
                <div style={{width:9,height:9,borderRadius:"50%",background:th.main,flexShrink:0}}/>
                <div style={{flex:1}}>
                  <p style={{fontSize:15,fontWeight:900,margin:0,color:th.main}}>기타 퀘스트</p>
                  <p style={{fontSize:11,color:C.sub,margin:"2px 0 0",fontWeight:600}}>학원 관련 없는 할 일을 추가해요</p>
                </div>
                <span style={{fontSize:12,color:th.main,fontWeight:700}}>선택 →</span>
              </button>
              {curAc.length===0&&<p style={{textAlign:"center",color:C.sub,fontSize:14,padding:"16px 0"}}>등록된 학원이 없어요</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── 보상 추가 모달 ── */}
      {showRewardModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"flex-end",zIndex:1000}} onClick={()=>setShowRewardModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:19,fontWeight:900,color:C.text}}>🎁 리워드 추가</h3>
              <button onClick={()=>setShowRewardModal(false)} style={{background:C.faint,border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:16}}>✕</button>
            </div>
            <label style={lbl}>리워드 이모지</label>
            <input value={rewardForm.emoji} onChange={e=>setRewardForm(p=>({...p,emoji:e.target.value}))}
              placeholder="예: 🍦" maxLength={4}
              style={{...inp,marginBottom:16,fontSize:26,textAlign:"center"}}/>
            <label style={lbl}>리워드 이름 *</label>
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
            <label style={lbl}>필요 XP *</label>
            <input type="number" value={rewardForm.point} onChange={e=>setRewardForm(p=>({...p,point:Number(e.target.value)}))}
              placeholder="예: 300"
              style={{...inp,marginBottom:20}}/>
            <div style={{background:th.light,border:`1px solid ${th.main}30`,borderRadius:14,padding:"14px",marginBottom:20}}>
              <p style={{fontSize:14,fontWeight:800,color:th.main,margin:"0 0 6px"}}>미리보기</p>
              <p style={{fontSize:18,fontWeight:900,color:C.text,margin:0}}>{rewardForm.emoji||"🎁"} {rewardForm.title||"보상 이름"} · {rewardForm.point||0} XP</p>
            </div>
            <button onClick={addReward}
              style={{width:"100%",padding:15,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",boxShadow:`0 4px 16px ${th.main}40`}}>
              리워드 추가하기
            </button>
          </div>
        </div>
      )}

      {/* ── 비밀번호 변경 모달 ── */}
      {showPinChangeModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20}} onClick={()=>setShowPinChangeModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:24,width:"100%",maxWidth:360,boxSizing:"border-box",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
              <h3 style={{fontSize:20,fontWeight:900,margin:0,color:C.text}}>🔐 엄마 비밀번호 변경</h3>
              <button onClick={()=>setShowPinChangeModal(false)} style={{background:C.faint,border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:16}}>✕</button>
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
              style={{width:"100%",padding:12,borderRadius:13,border:`1px solid ${C.border}`,background:C.faint,color:C.sub,fontSize:16,fontWeight:700,cursor:"pointer"}}>
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
              <h3 style={{margin:0,fontSize:18,fontWeight:800,color:C.text}}>🏖️ 방학 기간 설정</h3>
              <button onClick={()=>setShowVacModal(null)} style={{background:C.faint,border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:16}}>✕</button>
            </div>

            {/* 방학 추가 폼 */}
            <div style={{background:"#FFFBF0",borderRadius:14,padding:"16px",marginBottom:20,border:"1.5px solid #F0A500"}}>
              <p style={{fontSize:17,fontWeight:700,color:"#E65100",margin:"0 0 14px"}}>새 방학 기간 추가</p>
              <label style={{fontSize:17,color:C.sub,display:"block",marginBottom:6,fontWeight:700}}>학원 선택</label>
              <select value={vacForm.academyId} onChange={e=>setVacForm(p=>({...p,academyId:e.target.value}))}
                style={{width:"100%",boxSizing:"border-box",background:C.faint,border:`1px solid ${C.faintB}`,borderRadius:10,padding:"11px 12px",color:C.text,fontSize:17,outline:"none",marginBottom:12}}>
                <option value="">학원 선택</option>
                {(showVacModal.acList||[]).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <div style={{display:"flex",gap:10,marginBottom:14}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:17,color:C.sub,display:"block",marginBottom:6,fontWeight:700}}>시작일</label>
                  <input type="date" value={vacForm.start} onChange={e=>setVacForm(p=>({...p,start:e.target.value}))}
                    style={{width:"100%",boxSizing:"border-box",background:C.faint,border:`1px solid ${C.faintB}`,borderRadius:10,padding:"11px 12px",color:C.text,fontSize:17,outline:"none"}}/>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:17,color:C.sub,display:"block",marginBottom:6,fontWeight:700}}>종료일</label>
                  <input type="date" value={vacForm.end} onChange={e=>setVacForm(p=>({...p,end:e.target.value}))}
                    style={{width:"100%",boxSizing:"border-box",background:C.faint,border:`1px solid ${C.faintB}`,borderRadius:10,padding:"11px 12px",color:C.text,fontSize:17,outline:"none"}}/>
                </div>
              </div>
              <button onClick={addVacation} style={{width:"100%",padding:13,borderRadius:12,border:"none",background:"linear-gradient(135deg,#F0A500,#FFD54F)",color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer"}}>
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
                      <button onClick={()=>deleteVacation(ac.id,v.id)} style={{background:"none",border:"none",color:"#CCC",cursor:"pointer",fontSize:18}}>✕</button>
                    </div>
                  ))}
                </div>
              );
            })}
            {curAc.every(ac=>getVacations(childId,ac.id).length===0)&&(
              <div style={{textAlign:"center",padding:"20px",color:C.sub,fontSize:17,background:C.faint,borderRadius:12}}>
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
              <h3 style={{margin:0,fontSize:19,fontWeight:800,color:C.text}}>{editingChild?"아이 정보 수정":"아이 추가"}</h3>
              <button onClick={()=>{ setShowChildMgr(false); setEditingChild(null); }} style={{background:C.faint,border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:16}}>✕</button>
            </div>

            <label style={lbl}>이름 *</label>
            <input value={childForm.name} onChange={e=>setChildForm(p=>({...p,name:e.target.value}))} placeholder="예: 이연우" style={{...inp,marginBottom:16}}/>

            <label style={lbl}>성별 *</label>
            <div style={{display:"flex",gap:12,marginBottom:16}}>
              {[{key:"boy",label:"👦 남자아이"},{key:"girl",label:"👧 여자아이"}].map(g=>(
                <button key={g.key} onClick={()=>setChildForm(p=>({...p,gender:g.key}))}
                  style={{flex:1,padding:"14px",borderRadius:12,border:`2px solid ${childForm.gender===g.key?GENDER_THEME[g.key].main:C.border}`,
                    background:childForm.gender===g.key?`${GENDER_THEME[g.key].main}12`:C.faint,
                    color:childForm.gender===g.key?GENDER_THEME[g.key].main:C.sub,
                    fontSize:17,fontWeight:700,cursor:"pointer"}}>
                  {g.label}
                </button>
              ))}
            </div>

            <label style={lbl}>배경색 *</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20}}>
              {CHILD_THEME_COLORS.map((theme)=>(
                <button key={theme.name} onClick={()=>setChildForm(p=>({...p,theme}))}
                  style={{width:58,height:42,borderRadius:12,border:`2px solid ${childForm.theme?.main===theme.main?theme.main:C.border}`,
                    background:theme.grad,cursor:"pointer",
                    boxShadow:childForm.theme?.main===theme.main?`0 0 0 3px ${theme.light}`:"none"}}
                  title={theme.name}/>
              ))}
            </div>

            {/* 색상 미리보기 */}
            <div style={{background:childForm.theme?.grad||GENDER_THEME[childForm.gender].grad,borderRadius:12,padding:"14px 18px",marginBottom:24,color:"#fff",textAlign:"center"}}>
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
                  const t=getChildTheme(c);
                  return (
                    <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:12,border:`1px solid ${C.border}`,marginBottom:8,background:C.faint}}>
                      <span style={{fontSize:22}}>{t.emoji}</span>
                      <span style={{flex:1,fontSize:17,fontWeight:700,color:C.text}}>{c.name}</span>
                      <button onClick={()=>{ setEditingChild(c.id); setChildForm({name:c.name,gender:c.gender}); }} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"#fff",color:C.sub,fontSize:17,cursor:"pointer"}}>수정</button>
                      <button onClick={()=>deleteChild(c.id)} style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${C.red}30`,background:`${C.red}0A`,color:C.red,fontSize:17,cursor:"pointer"}}>삭제</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 학원 추가/수정 모달 ── */}
      {showAddAcModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setShowAddAcModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,maxHeight:"93vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:18,fontWeight:800,color:C.text}}>{editTarget?"✏️ 학원 수정":"➕ 학원 추가"} ({th.emoji} {curChild?.name})</h3>
              <button onClick={()=>setShowAddAcModal(false)} style={{background:C.faint,border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:16}}>✕</button>
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
                  }} style={{flex:1,padding:"9px 0",borderRadius:8,border:`1.5px solid ${sel?DAY_COLORS[day]:C.faintB}`,background:sel?DAY_COLORS[day]:C.faint,color:sel?"#fff":C.sub,fontSize:17,fontWeight:600,cursor:"pointer"}}>{day}</button>
                );
              })}
            </div>

            {/* 공통 시간 입력 */}
            {!newAc.useCustomSchedule&&(
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                <div style={{flex:1}}><label style={lbl}>시작 시간</label><input type="time" value={newAc.time||""} onChange={e=>setNewAc(p=>({...p,time:e.target.value}))} style={inp}/></div>
                <div style={{flex:1}}><label style={lbl}>수업 시간(분)</label><input type="number" value={newAc.duration||60} onChange={e=>setNewAc(p=>({...p,duration:Number(e.target.value)}))} style={inp}/></div>
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
            }} style={{width:"100%",padding:"10px",borderRadius:10,border:`1.5px solid ${newAc.useCustomSchedule?th.main:C.border}`,background:newAc.useCustomSchedule?`${th.main}10`:C.faint,color:newAc.useCustomSchedule?th.main:C.sub,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:12}}>
              {newAc.useCustomSchedule?"✓ 요일별 시간 설정 중":"📅 요일별 시간이 달라요"}
            </button>

            {/* 요일별 시간 개별 입력 */}
            {newAc.useCustomSchedule&&(
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12,background:`${th.main}06`,borderRadius:12,padding:"12px"}}>
                {(newAc.schedules||[]).map(sc=>(
                  <div key={sc.day} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",border:`1.5px solid ${DAY_COLORS[sc.day]}40`,borderRadius:10,padding:"8px 10px"}}>
                    <span style={{width:28,fontSize:15,fontWeight:700,color:DAY_COLORS[sc.day],flexShrink:0}}>{sc.day}</span>
                    <input type="time" value={sc.time}
                      onChange={e=>setNewAc(p=>({...p,schedules:(p.schedules||[]).map(s=>s.day===sc.day?{...s,time:e.target.value}:s)}))}
                      style={{...inp,flex:1,width:"auto",fontSize:14,padding:"7px 10px"}}/>
                    <input type="number" value={sc.duration}
                      onChange={e=>setNewAc(p=>({...p,schedules:(p.schedules||[]).map(s=>s.day===sc.day?{...s,duration:Number(e.target.value)}:s)}))}
                      style={{...inp,width:65,fontSize:14,padding:"7px 8px"}}/>
                    <span style={{fontSize:12,color:C.sub,flexShrink:0}}>분</span>
                  </div>
                ))}
                {(newAc.schedules||[]).length===0&&<p style={{fontSize:13,color:C.sub,margin:0,textAlign:"center"}}>위에서 요일을 먼저 선택해주세요</p>}
              </div>
            )}
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              <div style={{flex:1}}><label style={lbl}>월 학원비(원)</label><input type="number" value={newAc.fee} onChange={e=>setNewAc(p=>({...p,fee:Number(e.target.value)}))} placeholder="0" style={inp}/></div>
              <div style={{flex:1}}><label style={lbl}>납부일</label><input type="number" min="1" max="31" value={newAc.payDay} onChange={e=>setNewAc(p=>({...p,payDay:Number(e.target.value)}))} style={inp}/></div>
            </div>
            <label style={lbl}>색상</label>
            <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
              {PALETTE.map(c=>(<button key={c} onClick={()=>setNewAc(p=>({...p,color:c}))} style={{width:32,height:32,borderRadius:"50%",background:c,border:"none",cursor:"pointer",boxShadow:newAc.color===c?`0 0 0 3px #fff,0 0 0 5px ${c}`:"0 2px 6px rgba(0,0,0,0.15)"}}/>))}
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
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginBottom:16}}>
              <p style={{fontSize:17,fontWeight:700,color:C.text,margin:"0 0 14px"}}>📋 연락처 정보 <span style={{fontSize:17,color:C.sub,fontWeight:400}}>(선택)</span></p>
              <label style={lbl}>👩‍🏫 담당 선생님</label>
              <input value={newAc.teacher} onChange={e=>setNewAc(p=>({...p,teacher:e.target.value}))} placeholder="예: 김민준 선생님" style={{...inp,marginBottom:14}}/>
              <label style={lbl}>📞 연락처</label>
              <input value={newAc.phone} onChange={e=>setNewAc(p=>({...p,phone:e.target.value}))} placeholder="예: 010-1234-5678" style={{...inp,marginBottom:14}}/>
              <label style={lbl}>📍 주소</label>
              <input value={newAc.address} onChange={e=>setNewAc(p=>({...p,address:e.target.value}))} placeholder="예: 서울시 강남구" style={{...inp,marginBottom:14}}/>

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
              }} style={{width:"100%",padding:"11px",borderRadius:10,border:`1px dashed ${C.purple}`,background:newAc.useCustomShuttle?C.purpleL:C.faint,color:C.purple,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:10}}>
                {newAc.useCustomShuttle?"🚌 요일별 셔틀 설정 사용중":"🚌 요일별 셔틀 정보가 달라요"}
              </button>

              {newAc.useCustomShuttle&&(
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:14}}>
                  {(newAc.days||[]).map(day=>{
                    const shuttle=(newAc.shuttleSchedules||[]).find(s=>s.day===day)||{};
                    return (
                      <div key={day} style={{border:`1px solid ${C.border}`,borderRadius:12,padding:"12px",background:C.faint}}>
                        <div style={{fontWeight:800,marginBottom:8,color:DAY_COLORS[day],fontSize:14}}>{day}요일</div>
                        <div style={{display:"flex",gap:8,marginBottom:8}}>
                          <input type="time" value={shuttle.time||""}
                            onChange={e=>setNewAc(p=>({...p,shuttleSchedules:(p.shuttleSchedules||[]).map(s=>s.day===day?{...s,time:e.target.value}:s)}))}
                            style={{...inp,flex:1,width:"auto",fontSize:14,padding:"8px 10px"}}/>
                          <input value={shuttle.place||""} placeholder="위치"
                            onChange={e=>setNewAc(p=>({...p,shuttleSchedules:(p.shuttleSchedules||[]).map(s=>s.day===day?{...s,place:e.target.value}:s)}))}
                            style={{...inp,flex:2,width:"auto",fontSize:14,padding:"8px 10px"}}/>
                        </div>
                        <input value={shuttle.memo||""} placeholder="메모"
                          onChange={e=>setNewAc(p=>({...p,shuttleSchedules:(p.shuttleSchedules||[]).map(s=>s.day===day?{...s,memo:e.target.value}:s)}))}
                          style={{...inp,fontSize:14,padding:"8px 10px"}}/>
                      </div>
                    );
                  })}
                </div>
              )}

              <label style={lbl}>📝 학원 메모</label>
              <input value={newAc.memo} onChange={e=>setNewAc(p=>({...p,memo:e.target.value}))} placeholder="특이사항, 레벨 등" style={inp}/>
            </div>
            <button onClick={saveAcademy} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 16px ${th.main}40`}}>
              {editTarget?"수정 완료 ✓":"추가하기"}
            </button>
          </div>
        </div>
      )}

      {/* ── 학원 상세 모달 ── */}
      {showDetailModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}} onClick={()=>setShowDetailModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:24,width:"100%",maxWidth:390,boxShadow:"0 20px 60px rgba(0,0,0,0.18)",maxHeight:"88vh",overflowY:"auto"}}>
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
                <a href={`tel:${showDetailModal.phone}`} style={{flex:1,padding:12,borderRadius:11,background:`${C.green}12`,border:`1px solid ${C.green}30`,color:C.green,fontSize:17,fontWeight:700,textAlign:"center",textDecoration:"none",display:"block"}}>📞 {showDetailModal.phone}</a>
                <button onClick={()=>{ setShowSmsModal(showDetailModal); setShowDetailModal(null); setSmsDraft(""); }} style={{flex:1,padding:12,borderRadius:11,border:`1px solid ${C.purple}44`,background:C.purpleL,color:C.purple,fontSize:17,fontWeight:700,cursor:"pointer"}}>💬 문자 보내기</button>
              </div>
            )}
            <div style={{display:"flex",gap:8,marginTop:showDetailModal.phone?8:16}}>
              <button onClick={()=>openEdit(showDetailModal)} style={{flex:1,padding:12,borderRadius:11,border:`1px solid ${th.main}44`,background:th.light,color:th.main,fontSize:17,fontWeight:700,cursor:"pointer"}}>✏️ 수정</button>
              <button onClick={()=>deleteAcademy(showDetailModal.id)} style={{flex:1,padding:12,borderRadius:11,border:`1px solid ${C.red}44`,background:`${C.red}0D`,color:C.red,fontSize:17,fontWeight:600,cursor:"pointer"}}>🗑 삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 날짜별 숙제/준비물 모달 ── */}
      {showDailyModal&&(()=>{
        const {academyId,date,acName,acColor,baseSupplies}=showDailyModal;
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
                  <p style={{fontWeight:800,fontSize:18,margin:0,color:C.text}}>{acName}</p>
                  <p style={{fontSize:17,color:C.sub,margin:"2px 0 0"}}>{fmt(date)} {date===TODAY?"(오늘)":""}</p>
                </div>
                <button onClick={()=>setShowDailyModal(null)} style={{background:C.faint,border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:14}}>✕</button>
              </div>
              {(baseSupplies||[]).length>0&&(
                <div style={{background:`${acColor}08`,borderRadius:10,padding:"10px 14px",marginBottom:16}}>
                  <p style={{fontSize:17,color:acColor,margin:"0 0 6px",fontWeight:700}}>🎒 항상 챙길 준비물</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {baseSupplies.map((s,i)=><span key={i} style={{fontSize:17,padding:"3px 10px",borderRadius:20,background:acColor,color:"#fff",fontWeight:600}}>{s}</span>)}
                  </div>
                </div>
              )}
              <p style={{fontSize:17,fontWeight:700,color:C.text,margin:"0 0 10px"}}>🎯 오늘의 퀘스트</p>
              {hw.length===0&&todos.length===0&&<p style={{fontSize:17,color:C.sub,marginBottom:10}}>등록된 퀘스트가 없어요</p>}
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
                {hw.map(h=>(
                  <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,background:h.done?`${C.green}08`:C.faint,border:`1.5px solid ${h.done?C.green+"30":C.faintB}`}}>
                    <button onClick={()=>toggleHomeworkDone(childId,academyId,date,h.id)} style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${h.done?C.green:"#CCC"}`,background:h.done?C.green:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:"#fff",fontWeight:700}}>{h.done?"✓":""}</button>
                    <span style={{flex:1,fontSize:17,color:h.done?C.sub:C.text,textDecoration:h.done?"line-through":"none"}}>숙제: {h.text}</span>
                    <span style={{fontSize:12,color:C.orange,fontWeight:800}}>+{h.point||DEFAULT_HOMEWORK_SCORE} XP</span>
                    <button onClick={()=>upd({...entry,homeworks:hw.filter(x=>x.id!==h.id)})} style={{background:"none",border:"none",color:"#CCC",cursor:"pointer",fontSize:16}}>✕</button>
                  </div>
                ))}
                {todos.map(t=>(
                  <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,background:t.done?`${C.green}08`:C.faint,border:`1.5px solid ${t.done?C.green+"30":C.faintB}`}}>
                    <button onClick={()=>toggleTodoDone(childId,academyId,date,t.id)} style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${t.done?C.green:"#CCC"}`,background:t.done?C.green:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:"#fff",fontWeight:700}}>{t.done?"✓":""}</button>
                    <span style={{flex:1,fontSize:17,color:t.done?C.sub:C.text,textDecoration:t.done?"line-through":"none"}}>{t.text}</span>
                    <span style={{fontSize:12,color:C.orange,fontWeight:800}}>+{t.point||DEFAULT_HOMEWORK_SCORE} XP</span>
                    <button onClick={()=>upd({...entry,todos:todos.filter(x=>x.id!==t.id)})} style={{background:"none",border:"none",color:"#CCC",cursor:"pointer",fontSize:16}}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:6,marginBottom:10,alignItems:"center"}}>
                <input value={dailyHwInput} onChange={e=>setDailyHwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addHw()} placeholder="숙제 입력" style={{...inp,flex:3,width:"auto",fontSize:14,padding:"9px 10px"}}/>
                <input type="number" value={dailyHwPoint} onChange={e=>setDailyHwPoint(e.target.value)} style={{...inp,width:52,fontSize:14,padding:"9px 6px",textAlign:"center"}} min="1"/>
                <span style={{fontSize:12,color:C.sub,flexShrink:0}}>점</span>
                <button onClick={addHw} style={{padding:"9px 12px",borderRadius:10,border:"none",background:acColor,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",flexShrink:0}}>숙제</button>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:20,alignItems:"center"}}>
                <input value={dailyTodoInput} onChange={e=>setDailyTodoInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTodo()} placeholder="퀘스트 입력" style={{...inp,flex:3,width:"auto",fontSize:14,padding:"9px 10px"}}/>
                <input type="number" value={dailyTodoPoint} onChange={e=>setDailyTodoPoint(e.target.value)} style={{...inp,width:52,fontSize:14,padding:"9px 6px",textAlign:"center"}} min="1"/>
                <span style={{fontSize:12,color:C.sub,flexShrink:0}}>점</span>
                <button onClick={addTodo} style={{padding:"9px 12px",borderRadius:10,border:"none",background:acColor,color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",flexShrink:0}}>퀘스트</button>
              </div>
              <p style={{fontSize:17,fontWeight:700,color:C.text,margin:"0 0 10px"}}>📦 이번 수업 추가 준비물</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:10}}>
                {sup.map((s,i)=>(
                  <span key={i} style={{fontSize:17,padding:"5px 14px",borderRadius:20,background:`${acColor}15`,color:acColor,display:"flex",alignItems:"center",gap:5,fontWeight:600}}>
                    {s}<button onClick={()=>upd({...entry,supplies:sup.filter((_,j)=>j!==i)})} style={{background:"none",border:"none",color:acColor,cursor:"pointer",fontSize:17,padding:0}}>✕</button>
                  </span>
                ))}
                {sup.length===0&&<p style={{fontSize:17,color:C.sub,margin:0}}>추가 준비물 없음</p>}
              </div>
              <div style={{display:"flex",gap:8,marginBottom:22}}>
                <input value={dailySupInput} onChange={e=>setDailySupInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSup()} placeholder="추가 준비물 입력 후 Enter" style={{...inp,flex:1,width:"auto",fontSize:17,padding:"10px 14px"}}/>
                <button onClick={addSup} style={{padding:"0 18px",borderRadius:10,border:"none",background:acColor,color:"#fff",fontWeight:700,fontSize:17,cursor:"pointer"}}>추가</button>
              </div>
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
              <button onClick={()=>setShowSmsModal(null)} style={{background:C.faint,border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:14}}>✕</button>
            </div>
            <p style={{fontSize:17,color:C.sub,fontWeight:700,margin:"0 0 10px"}}>📋 템플릿 선택</p>
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:16}}>
              {templates.map(t=><button key={t.id} onClick={()=>applyTmpl(t,showSmsModal)} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${C.purple}40`,background:C.purpleL,color:C.purple,fontSize:17,fontWeight:600,cursor:"pointer"}}>{t.title}</button>)}
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
            <h3 style={{margin:"0 0 20px",fontSize:18,fontWeight:800,color:C.text}}>{showTmplEdit==="new"?"새 템플릿 추가":"템플릿 수정"}</h3>
            <label style={lbl}>템플릿 제목</label>
            <input value={editTmpl.title} onChange={e=>setEditTmpl(p=>({...p,title:e.target.value}))} placeholder="예: 결석 안내" style={{...inp,marginBottom:16}}/>
            <label style={lbl}>문자 내용</label>
            <textarea value={editTmpl.body} onChange={e=>setEditTmpl(p=>({...p,body:e.target.value}))} placeholder={"{아이이름}, {학원명}, {날짜}, {시간} 변수 사용 가능"} style={{...inp,height:140,resize:"none",marginBottom:22}}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowTmplEdit(null)} style={{flex:1,padding:14,borderRadius:12,border:`1px solid ${C.border}`,background:C.faint,color:C.sub,fontSize:17,cursor:"pointer"}}>취소</button>
              <button onClick={saveTmpl} style={{flex:2,padding:14,borderRadius:12,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer"}}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 결석 추가 모달 ── */}
      {showAbsModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setShowAbsModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,boxSizing:"border-box"}}>
            <h3 style={{margin:"0 0 20px",fontSize:18,fontWeight:800,color:C.text}}>결석 기록 추가 ({th.emoji} {curChild?.name})</h3>
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

import { useState, useEffect } from "react";

// ── 상수 ─────────────────────────────────
const DAYS = ["월","화","수","목","금","토","일"];
const DAY_COLORS = { 월:"#FF6B6B", 화:"#FF9F43", 수:"#4A90E2", 목:"#9B59B6", 금:"#1ABC9C", 토:"#3498DB", 일:"#E74C3C" };

// 성별별 테마
const GENDER_THEME = {
  boy:  { emoji:"👦", main:"#4A90E2", light:"#F0F6FF", grad:"linear-gradient(135deg,#4A90E2,#6EC6F5)" },
  girl: { emoji:"👧", main:"#FF6B9D", light:"#FFF0F6", grad:"linear-gradient(135deg,#FF6B9D,#FF9A8B)" },
};

const C = {
  bg:"#F4F6FB", card:"#FFFFFF", border:"#EAECF5",
  text:"#1A1A35", sub:"#8890B0", faint:"#F0F2FF", faintB:"#DDE3FF",
  green:"#22C9A0", red:"#FF5C7A", orange:"#FF9F43",
  purple:"#6C63FF", purpleL:"#EEF0FF",
};
const PALETTE = ["#FF6B6B","#FF9F43","#FFC312","#26de81","#4A90E2","#45AAF2","#9B59B6","#FF6B9D","#1ABC9C","#E91E8C"];

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
  { id:"child_1", name:"첫째", gender:"boy" }
];

const SAMPLE_TMPL = [
  { id:1, title:"결석 안내", body:"안녕하세요. {아이이름} 학부모입니다.\n{날짜} {학원명} 수업을 결석하게 되었습니다.\n양해 부탁드립니다." },
  { id:2, title:"조기 하원 요청", body:"안녕하세요. {아이이름} 학부모입니다.\n오늘 {학원명} 수업을 일찍 마치고 하원해야 할 것 같습니다.\n{시간}에 데리러 가겠습니다. 감사합니다." },
  { id:3, title:"보충 수업 문의", body:"안녕하세요. {아이이름} 학부모입니다.\n{날짜} 결석 건으로 보충 수업 일정을 문의드립니다.\n편하신 날짜를 알려주시면 감사하겠습니다." },
  { id:4, title:"준비물 확인", body:"안녕하세요. {아이이름} 학부모입니다.\n{학원명} 준비물 관련하여 확인 부탁드립니다. 감사합니다." },
];

const EMPTY_AC = { name:"", days:[], time:"", duration:60, fee:0, payDay:1, color:"#FF6B6B", baseSupplies:[], phone:"", teacher:"", address:"", memo:"" };
const EMPTY_ABS = { academyId:"", date:TODAY, reason:"", makeupDate:"", makeupDone:false };

export default function App() {
  const [loaded,setLoaded] = useState(false);

  // 아이 목록 상태
  const [children,setChildren] = useState(DEFAULT_CHILDREN);
  const [childId,setChildId] = useState("child_1");

  const [tab,setTab] = useState("home");
  const [academies,setAcademies] = useState({});
  const [absences,setAbsences] = useState({});
  const [paidStatus,setPaidStatus] = useState({});
  const [dayMemos,setDayMemos] = useState({});
  const [dailyData,setDailyData] = useState({});
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
  const [toast,setToast] = useState("");

  // 아이 관리 모달
  const [showChildMgr,setShowChildMgr] = useState(false);
  const [editingChild,setEditingChild] = useState(null);
  const [childForm,setChildForm] = useState({name:"",gender:"boy"});

  // 방학 데이터: { "childId-academyId": [{id, start, end}] }
  const [vacations,setVacations] = useState({});
  const [showVacModal,setShowVacModal] = useState(null); // {date, acList}
  const [vacForm,setVacForm] = useState({academyId:"", start:"", end:""});

  // 로드
  useEffect(()=>{
    (async()=>{
      const ch=await load("v6_children"), ac=await load("v6_ac"), ab=await load("v6_abs"),
            p=await load("v6_paid"), dm=await load("v6_dm"), dd=await load("v6_daily"),
            tmpl=await load("v6_tmpl"), cid=await load("v6_cid"), vac=await load("v6_vac");
      if(ch) setChildren(ch);
      if(ac) setAcademies(ac); if(ab) setAbsences(ab);
      if(p) setPaidStatus(p); if(dm) setDayMemos(dm); if(dd) setDailyData(dd);
      if(tmpl) setTemplates(tmpl);
      if(cid) setChildId(cid);
      if(vac) setVacations(vac);
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

  const showToast=(msg="저장됨 ✓")=>{ setToast(msg); setTimeout(()=>setToast(""),1600); };

  // 현재 아이 정보
  const curChild = children.find(c=>c.id===childId) || children[0];
  const th = curChild ? GENDER_THEME[curChild.gender]||GENDER_THEME.boy : GENDER_THEME.boy;
  const curAc = academies[childId]||[];
  const curAbs = absences[childId]||[];
  const totalFee=(cid)=>(academies[cid]||[]).reduce((s,a)=>s+Number(a.fee||0),0);

  // 아이 관리 함수
  const saveChild=()=>{
    if(!childForm.name.trim()){ showToast("이름을 입력해줘"); return; }
    if(editingChild){
      setChildren(p=>p.map(c=>c.id===editingChild?{...c,name:childForm.name.trim(),gender:childForm.gender}:c));
      showToast("수정됨 ✓");
    } else {
      const newId=`child_${Date.now()}`;
      setChildren(p=>[...p,{id:newId,name:childForm.name.trim(),gender:childForm.gender}]);
      setChildId(newId);
      showToast("추가됨 ✓");
    }
    setShowChildMgr(false); setEditingChild(null); setChildForm({name:"",gender:"boy"});
  };
  const deleteChild=(id)=>{
    if(children.length<=1){ showToast("마지막 아이는 삭제할 수 없어요"); return; }
    setChildren(p=>p.filter(c=>c.id!==id));
    if(childId===id) setChildId(children.find(c=>c.id!==id)?.id||"");
    showToast("삭제됨");
  };
  const openAddChild=()=>{ setEditingChild(null); setChildForm({name:"",gender:"boy"}); setShowChildMgr(true); };
  const openEditChild=(c)=>{ setEditingChild(c.id); setChildForm({name:c.name,gender:c.gender}); setShowChildMgr(true); };

  // dailyKey
  const dKey=(cid,aId,date)=>`${cid}-${aId}-${date}`;
  const getDailyEntry=(cid,aId,date)=>dailyData[dKey(cid,aId,date)]||{homeworks:[],supplies:[]};
  const setDailyEntry=(cid,aId,date,entry)=>setDailyData(p=>({...p,[dKey(cid,aId,date)]:entry}));

  const pendingHwTotal=()=>{
    let n=0;
    Object.entries(dailyData).forEach(([k,e])=>{ if(k.startsWith(childId+"-")) n+=(e.homeworks||[]).filter(h=>!h.done).length; });
    return n;
  };
  const pendingAbsCnt=curAbs.filter(a=>a.makeupDate&&!a.makeupDone).length;
  const todayAc=curAc.filter(a=>a.days.includes(todayDN())).sort((a,b)=>a.time.localeCompare(b.time));

  // 학원 CRUD
  const openAdd=()=>{ setEditTarget(null); setNewAc({...EMPTY_AC,baseSupplies:[]}); setSupplyInput(""); setShowAddAcModal(true); };
  const openEdit=(ac)=>{ setEditTarget(ac.id); setNewAc({...ac,baseSupplies:[...(ac.baseSupplies||[])]}); setSupplyInput(""); setShowDetailModal(null); setShowAddAcModal(true); };
  const saveAcademy=()=>{
    if(!newAc.name.trim()||newAc.days.length===0){ showToast("학원명과 요일을 입력해줘"); return; }
    const cleaned={...newAc,name:newAc.name.trim(),fee:Number(newAc.fee||0),duration:Number(newAc.duration||0),payDay:Number(newAc.payDay||1),baseSupplies:newAc.baseSupplies||[]};
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
  const applyTmpl=(tmpl,ac)=>setSmsDraft(tmpl.body.replace(/{아이이름}/g,curChild?.name||"").replace(/{학원명}/g,ac.name).replace(/{날짜}/g,fmt(TODAY)).replace(/{시간}/g,ac.time||""));
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

  return (
    <div style={{fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",color:C.text,paddingBottom:90}}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet"/>

      {/* 토스트 */}
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:th.main,color:"#fff",padding:"10px 24px",borderRadius:20,fontSize:17,fontWeight:700,zIndex:999,boxShadow:`0 4px 16px ${th.main}55`}}>{toast}</div>}

      {/* ── 헤더 ── */}
      <div style={{background:th.grad,padding:"20px 18px 0",boxShadow:"0 4px 20px rgba(0,0,0,0.12)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <p style={{fontSize:17,color:"rgba(255,255,255,0.75)",margin:0,letterSpacing:2,fontWeight:600}}>ACADEMY PLANNER</p>
            <h1 style={{fontSize:22,fontWeight:900,margin:"3px 0 0",color:"#fff"}}>🎒 우리 아이 학원 관리</h1>
          </div>
        </div>

        {/* 아이 탭 + 아이 추가 버튼 */}
        <div style={{display:"flex",alignItems:"flex-end",background:"rgba(0,0,0,0.15)",borderRadius:"12px 12px 0 0",overflow:"hidden"}}>
          <div style={{display:"flex",flex:1,overflowX:"auto"}}>
            {children.map(c=>{
              const t=GENDER_THEME[c.gender]||GENDER_THEME.boy;
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
            <span style={{fontSize:15,lineHeight:1}}>👶</span>
            <span style={{fontSize:17,fontWeight:600,letterSpacing:0.3,opacity:0.9}}>아이추가</span>
          </button>
        </div>
      </div>

      {/* ── 탭 바 ── */}
      <div style={{display:"flex",background:C.card,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
        {[["home","🏠 홈"],["calendar","🗓 달력"],["fee","💰 학원비"],["absence","🏥 결석"],["sms","💬 문자"]].map(([k,l])=>(
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
          const homeAc=curAc.filter(a=>a.days.includes(hDN)&&!isVacationDay(childId,a.id,homeDate)).sort((a,b)=>a.time.localeCompare(b.time));
          const vacAcToday=curAc.filter(a=>a.days.includes(hDN)&&isVacationDay(childId,a.id,homeDate));
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
                {/* 요약 지표 */}
                <div style={{display:"flex",gap:6}}>
                  {[
                    {label:"학원",       value:`${homeAc.length}개`,         alert:false},
                    {label:"미완 숙제",  value:`${homePendingHw}개`,          alert:homePendingHw>0},
                    {label:"결석",       value:`${absOnHome.length}개`,       alert:absOnHome.length>0},
                    {label:"보충수업",   value:`${makeupOnHome.length}개`,    alert:makeupOnHome.length>0},
                  ].map((s,i)=>(
                    <div key={i} style={{flex:1,background:s.alert?"rgba(255,80,80,0.25)":"rgba(255,255,255,0.2)",borderRadius:10,padding:"9px 4px",textAlign:"center",border:s.alert?"1px solid rgba(255,120,120,0.4)":"1px solid transparent"}}>
                      <p style={{fontSize:17,color:"rgba(255,255,255,0.82)",margin:0,fontWeight:600}}>{s.label}</p>
                      <p style={{fontSize:17,fontWeight:800,margin:"3px 0 0",color:s.alert?"#FFE066":"#fff"}}>{s.value}</p>
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
                const [h,m]=(ac.time||"00:00").split(":").map(Number);
                const tm=h*60+m+Number(ac.duration||0);
                const endT=`${String(Math.floor(tm/60)%24).padStart(2,"0")}:${String(tm%60).padStart(2,"0")}`;
                const entry=getDailyEntry(childId,ac.id,homeDate);
                const hw=entry.homeworks||[], sup=entry.supplies||[];
                const doneCnt=hw.filter(h=>h.done).length;
                const allDone=hw.length>0&&doneCnt===hw.length;
                return (
                  <div key={ac.id} style={{background:C.card,borderRadius:18,marginBottom:14,border:`1.5px solid ${ac.color}30`,boxShadow:`0 4px 18px ${ac.color}12`,overflow:"hidden"}}>
                    <div style={{background:`${ac.color}10`,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:5,height:52,borderRadius:3,background:ac.color,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <p style={{fontSize:18,fontWeight:800,margin:0,color:C.text}}>{ac.name}</p>
                        <p style={{fontSize:17,color:C.sub,margin:"3px 0 0"}}>{ac.time} ~ {endT} &nbsp;·&nbsp; {ac.duration}분</p>
                        {ac.teacher&&<p style={{fontSize:17,color:C.sub,margin:"2px 0 0"}}>👩‍🏫 {ac.teacher}</p>}
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
                      {/* 숙제 */}
                      <div style={{marginBottom:12}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
                          <p style={{fontSize:17,fontWeight:700,color:C.sub,margin:0,letterSpacing:0.5}}>📝 숙제</p>
                          {hw.length>0&&<span style={{fontSize:17,fontWeight:700,color:allDone?C.green:C.orange}}>{allDone?"✓ 완료":`${doneCnt}/${hw.length} 완료`}</span>}
                        </div>
                        {hw.length===0?<p style={{fontSize:17,color:"#CCC",margin:0}}>등록된 숙제 없음</p>:(
                          <div style={{display:"flex",flexDirection:"column",gap:6}}>
                            {hw.map(h=>(
                              <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:10,background:h.done?`${C.green}08`:C.faint,border:`1px solid ${h.done?C.green+"25":C.faintB}`}}>
                                <button onClick={()=>{ const e=getDailyEntry(childId,ac.id,homeDate); setDailyEntry(childId,ac.id,homeDate,{...e,homeworks:(e.homeworks||[]).map(x=>x.id===h.id?{...x,done:!x.done}:x)}); }}
                                  style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${h.done?C.green:"#CCC"}`,background:h.done?C.green:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:"#fff",fontWeight:700}}>{h.done?"✓":""}</button>
                                <span style={{flex:1,fontSize:17,color:h.done?C.sub:C.text,textDecoration:h.done?"line-through":"none"}}>{h.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={()=>{ setShowDailyModal({academyId:ac.id,date:homeDate,acName:ac.name,acColor:ac.color,baseSupplies:ac.baseSupplies}); setDailyHwInput(""); setDailySupInput(""); }}
                        style={{width:"100%",padding:"9px",borderRadius:10,border:`1.5px dashed ${ac.color}50`,background:`${ac.color}06`,color:ac.color,fontSize:17,fontWeight:700,cursor:"pointer"}}>
                        ✏️ 숙제 · 준비물 편집
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* 이번 주 예정 */}
              <div style={{marginTop:8,marginBottom:14}}>
                <p style={{fontSize:17,color:C.sub,fontWeight:700,marginBottom:10,letterSpacing:0.5}}>📅 이번 주 예정</p>
                <div style={{background:C.card,borderRadius:14,border:`1px solid ${C.border}`,overflow:"hidden"}}>
                  {DAYS.map(day=>{
                    const da=curAc.filter(a=>a.days.includes(day));
                    if(da.length===0) return null;
                    const isTodayRow=day===todayDN();
                    const now=new Date();
                    const nowDay=now.getDay()===0?7:now.getDay();
                    const diff=(DAYS.indexOf(day)+1)-nowDay;
                    const rowDate=toStr(new Date(now.getFullYear(),now.getMonth(),now.getDate()+diff));
                    return (
                      <div key={day} style={{display:"flex",alignItems:"center",padding:"11px 14px",borderBottom:`1px solid ${C.border}`,background:isTodayRow?`${th.main}08`:"transparent"}}>
                        <span style={{width:30,fontSize:17,fontWeight:700,color:isTodayRow?th.main:DAY_COLORS[day]}}>{day}</span>
                        {isTodayRow&&<span style={{fontSize:17,background:th.main,color:"#fff",borderRadius:4,padding:"1px 6px",marginRight:6,fontWeight:700,flexShrink:0}}>오늘</span>}
                        <div style={{flex:1,display:"flex",gap:6,flexWrap:"wrap"}}>
                          {da.map(a=>{
                            const onVac=isVacationDay(childId,a.id,rowDate);
                            return (
                              <span key={a.id} style={{fontSize:17,padding:"3px 10px",borderRadius:6,background:onVac?"#FFF8E1":`${a.color}18`,color:onVac?"#E65100":a.color,fontWeight:600}}>
                                {onVac?"🏖️ ":""}{a.name} {a.time}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {DAYS.every(day=>curAc.filter(a=>a.days.includes(day)).length===0)&&<p style={{textAlign:"center",padding:"16px",color:C.sub,fontSize:17,margin:0}}>이번 주 예정 없음</p>}
                </div>
              </div>

              {/* 등록 학원 목록 */}
              <div style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                  <p style={{fontSize:17,color:C.sub,fontWeight:700,margin:0,letterSpacing:0.5}}>📋 등록 학원 ({curAc.length})</p>
                  <button onClick={openAdd} style={{fontSize:17,padding:"6px 14px",borderRadius:8,border:"none",background:th.grad,color:"#fff",fontWeight:700,cursor:"pointer"}}>+ 학원 추가</button>
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
                            <p style={{fontSize:17,color:C.sub,margin:"3px 0 0"}}>{ac.days.join("·")}요일 &nbsp;·&nbsp; {ac.time} &nbsp;·&nbsp; {ac.duration}분</p>
                          </div>
                          <button onClick={()=>openEdit(ac)} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${ac.color}40`,background:`${ac.color}10`,color:ac.color,fontSize:17,fontWeight:700,cursor:"pointer",flexShrink:0}}>✏️ 수정</button>
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
            const acList=curAc.filter(a=>a.days.includes(dn));
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
                  const acList=curAc.filter(a=>a.days.includes(dn));
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
                {[{icon:"●",label:"학원"},{icon:"🔴",label:"공휴일"},{icon:"🏥",label:"결석"},{icon:"📚",label:"보충예정"},{icon:"✅",label:"보충완료"},{icon:"🏖️",label:"방학"},{icon:"⚠️",label:"숙제미완"},{icon:"🎒",label:"추가준비물"},{icon:"📝",label:"메모"}].map((l,i)=>(
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

                    {/* 방학 설정 버튼 */}
                    {selInfo.acList.length>0&&(
                      <button onClick={()=>{ setVacForm({academyId:"",start:calSelDate,end:calSelDate}); setShowVacModal({date:calSelDate,acList:selInfo.acList}); }}
                        style={{width:"100%",padding:"9px",borderRadius:10,border:"1.5px dashed #F0A500",background:"#FFFBF0",color:"#E65100",fontSize:17,fontWeight:700,cursor:"pointer",marginBottom:14}}>
                        🏖️ 방학 기간 설정
                      </button>
                    )}
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
                    {/* 학원별 숙제/준비물 */}
                    {selInfo.acList.map(ac=>{
                      const entry=getDailyEntry(childId,ac.id,calSelDate);
                      const hw=entry.homeworks||[], sup=entry.supplies||[];
                      const doneCnt=hw.filter(h=>h.done).length;
                      const allDone=hw.length>0&&doneCnt===hw.length;
                      const [h,m]=(ac.time||"00:00").split(":").map(Number);
                      const tm=h*60+m+Number(ac.duration||0);
                      const endT=`${String(Math.floor(tm/60)%24).padStart(2,"0")}:${String(tm%60).padStart(2,"0")}`;
                      return (
                        <div key={ac.id} style={{marginBottom:12,borderRadius:14,border:`1.5px solid ${ac.color}25`,overflow:"hidden"}}>
                          <div style={{background:`${ac.color}10`,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:4,height:38,borderRadius:2,background:ac.color,flexShrink:0}}/>
                            <div style={{flex:1}}>
                              <p style={{fontSize:17,fontWeight:800,margin:0,color:C.text}}>{ac.name}</p>
                              <p style={{fontSize:17,color:C.sub,margin:"2px 0 0"}}>{ac.time} ~ {endT}</p>
                            </div>
                            {hw.length>0&&<span style={{fontSize:17,fontWeight:700,color:allDone?C.green:C.orange,background:allDone?`${C.green}15`:`${C.orange}15`,borderRadius:6,padding:"3px 8px"}}>{allDone?"✓ 완료":`${doneCnt}/${hw.length}`}</span>}
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
                            <div style={{marginBottom:10}}>
                              <p style={{fontSize:17,fontWeight:700,color:C.sub,margin:"0 0 6px"}}>📝 숙제</p>
                              {hw.length===0?<p style={{fontSize:17,color:"#CCC",margin:0}}>없음</p>:(
                                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                                  {hw.map(h=>(
                                    <div key={h.id} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:9,background:h.done?`${C.green}08`:C.faint,border:`1px solid ${h.done?C.green+"25":C.faintB}`}}>
                                      <button onClick={()=>{ const e=getDailyEntry(childId,ac.id,calSelDate); setDailyEntry(childId,ac.id,calSelDate,{...e,homeworks:e.homeworks.map(x=>x.id===h.id?{...x,done:!x.done}:x)}); }}
                                        style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${h.done?C.green:"#CCC"}`,background:h.done?C.green:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:"#fff",fontWeight:700}}>{h.done?"✓":""}</button>
                                      <span style={{flex:1,fontSize:17,color:h.done?C.sub:C.text,textDecoration:h.done?"line-through":"none"}}>{h.text}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button onClick={()=>{ setShowDailyModal({academyId:ac.id,date:calSelDate,acName:ac.name,acColor:ac.color,baseSupplies:ac.baseSupplies}); setDailyHwInput(""); setDailySupInput(""); }}
                              style={{width:"100%",padding:"8px",borderRadius:9,border:`1.5px dashed ${ac.color}50`,background:`${ac.color}06`,color:ac.color,fontSize:17,fontWeight:700,cursor:"pointer"}}>
                              ✏️ 숙제 · 준비물 편집
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {!selInfo&&<div style={{marginTop:12,textAlign:"center",padding:"18px",color:C.sub,fontSize:17,background:C.card,borderRadius:12,border:`1.5px dashed ${C.border}`}}>날짜를 탭하면 학원·숙제·결석·보충수업을 확인할 수 있어요</div>}

              {/* 방학 전체 관리 버튼 */}
              <button onClick={()=>{ setVacForm({academyId:"",start:TODAY,end:TODAY}); setShowVacModal({date:TODAY,acList:curAc}); }}
                style={{width:"100%",marginTop:12,padding:"12px",borderRadius:12,border:"1.5px dashed #F0A500",background:"#FFFBF0",color:"#E65100",fontSize:17,fontWeight:700,cursor:"pointer"}}>
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
            <button onClick={()=>setShowAbsModal(true)} style={{width:"100%",padding:14,borderRadius:12,border:`1.5px dashed ${C.red}55`,background:`${C.red}08`,color:C.red,fontSize:17,fontWeight:700,cursor:"pointer",marginBottom:16}}>+ 결석 기록 추가</button>
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

        {/* ════ 문자 탭 ════ */}
        {tab==="sms"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <p style={{fontSize:17,color:C.sub,fontWeight:700,margin:0}}>문자 템플릿 관리</p>
              <button onClick={()=>{ setShowTmplEdit("new"); setEditTmpl({title:"",body:""}); }} style={{padding:"8px 16px",borderRadius:10,border:"none",background:th.grad,color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer"}}>+ 새 템플릿</button>
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
                    <button onClick={()=>{ setShowTmplEdit(tmpl.id); setEditTmpl({title:tmpl.title,body:tmpl.body}); }} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${C.border}`,background:C.faint,color:C.sub,fontSize:17,cursor:"pointer"}}>수정</button>
                    <button onClick={()=>{ setTemplates(p=>p.filter(t=>t.id!==tmpl.id)); showToast("삭제됨"); }} style={{padding:"5px 12px",borderRadius:7,border:`1px solid ${C.red}30`,background:`${C.red}0A`,color:C.red,fontSize:17,cursor:"pointer"}}>삭제</button>
                  </div>
                </div>
                <p style={{fontSize:17,color:C.sub,margin:0,whiteSpace:"pre-wrap",background:C.faint,borderRadius:8,padding:"10px 12px"}}>{tmpl.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════ 모달들 ════════ */}

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
            <div style={{display:"flex",gap:12,marginBottom:24}}>
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

            {/* 색상 미리보기 */}
            <div style={{background:GENDER_THEME[childForm.gender].grad,borderRadius:12,padding:"14px 18px",marginBottom:24,color:"#fff",textAlign:"center"}}>
              <p style={{fontSize:28,margin:"0 0 4px"}}>{GENDER_THEME[childForm.gender].emoji}</p>
              <p style={{fontSize:17,fontWeight:700,margin:0}}>{childForm.name||"이름 미입력"}</p>
            </div>

            <button onClick={saveChild} style={{width:"100%",padding:15,borderRadius:14,border:"none",background:GENDER_THEME[childForm.gender].grad,color:"#fff",fontSize:17,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 16px ${GENDER_THEME[childForm.gender].main}40`}}>
              {editingChild?"수정 완료 ✓":"추가하기"}
            </button>

            {/* 등록된 아이 목록 */}
            {!editingChild&&children.length>0&&(
              <div style={{marginTop:24,borderTop:`1px solid ${C.border}`,paddingTop:18}}>
                <p style={{fontSize:17,fontWeight:700,color:C.sub,margin:"0 0 12px"}}>등록된 아이 ({children.length})</p>
                {children.map(c=>{
                  const t=GENDER_THEME[c.gender]||GENDER_THEME.boy;
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
            <div style={{display:"flex",gap:5,marginBottom:16}}>
              {DAYS.map(day=>(
                <button key={day} onClick={()=>toggleDay(day)} style={{flex:1,padding:"9px 0",borderRadius:8,border:`1.5px solid ${newAc.days.includes(day)?DAY_COLORS[day]:C.faintB}`,background:newAc.days.includes(day)?DAY_COLORS[day]:C.faint,color:newAc.days.includes(day)?"#fff":C.sub,fontSize:17,fontWeight:600,cursor:"pointer"}}>{day}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              <div style={{flex:1}}><label style={lbl}>시작 시간</label><input type="time" value={newAc.time} onChange={e=>setNewAc(p=>({...p,time:e.target.value}))} style={inp}/></div>
              <div style={{flex:1}}><label style={lbl}>수업 시간(분)</label><input type="number" value={newAc.duration} onChange={e=>setNewAc(p=>({...p,duration:Number(e.target.value)}))} style={inp}/></div>
            </div>
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
                <p style={{margin:"3px 0 0",fontSize:17,color:C.sub}}>{showDetailModal.days.join(", ")}요일 · {showDetailModal.time} ({showDetailModal.duration}분)</p>
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
        const hw=entry.homeworks||[], sup=entry.supplies||[];
        const upd=(ne)=>setDailyEntry(childId,academyId,date,ne);
        const addHw=()=>{ const v=dailyHwInput.trim(); if(!v) return; upd({...entry,homeworks:[...hw,{id:Date.now(),text:v,done:false}]}); setDailyHwInput(""); };
        const addSup=()=>{ const v=dailySupInput.trim(); if(!v) return; upd({...entry,supplies:[...sup,v]}); setDailySupInput(""); };
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
              <p style={{fontSize:17,fontWeight:700,color:C.text,margin:"0 0 10px"}}>📝 이번 수업 숙제</p>
              {hw.length===0&&<p style={{fontSize:17,color:C.sub,marginBottom:10}}>등록된 숙제가 없어요</p>}
              <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
                {hw.map(h=>(
                  <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,background:h.done?`${C.green}08`:C.faint,border:`1.5px solid ${h.done?C.green+"30":C.faintB}`}}>
                    <button onClick={()=>upd({...entry,homeworks:hw.map(x=>x.id===h.id?{...x,done:!x.done}:x)})} style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${h.done?C.green:"#CCC"}`,background:h.done?C.green:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,color:"#fff",fontWeight:700}}>{h.done?"✓":""}</button>
                    <span style={{flex:1,fontSize:17,color:h.done?C.sub:C.text,textDecoration:h.done?"line-through":"none"}}>{h.text}</span>
                    <button onClick={()=>upd({...entry,homeworks:hw.filter(x=>x.id!==h.id)})} style={{background:"none",border:"none",color:"#CCC",cursor:"pointer",fontSize:16}}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8,marginBottom:20}}>
                <input value={dailyHwInput} onChange={e=>setDailyHwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addHw()} placeholder="숙제 입력 후 Enter" style={{...inp,flex:1,width:"auto",fontSize:17,padding:"10px 14px"}}/>
                <button onClick={addHw} style={{padding:"0 18px",borderRadius:10,border:"none",background:acColor,color:"#fff",fontWeight:700,fontSize:17,cursor:"pointer"}}>추가</button>
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

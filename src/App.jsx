import { useState, useEffect } from "react";

// ── 상수 ─────────────────────────────────
const DAYS = ["월","화","수","목","금","토","일"];
const DAY_COLORS = {"월":"#FF6B6B","화":"#FF9F43","수":"#4A90E2","목":"#9B59B6","금":"#1ABC9C","토":"#3498DB","일":"#E74C3C"};

const CHILDREN = [
  { key:"이연우", label:"이연우", emoji:"👦", theme:{ main:"#4A90E2", light:"#F0F6FF", grad:"linear-gradient(135deg,#4A90E2,#6EC6F5)" } },
  { key:"이지우", label:"이지우", emoji:"👧", theme:{ main:"#FF6B9D", light:"#FFF0F6", grad:"linear-gradient(135deg,#FF6B9D,#FF9A8B)" } },
];
const CHILD_MAP = Object.fromEntries(CHILDREN.map(c=>[c.key,c]));

const C = {
  bg:"#F4F6FB", card:"#FFFFFF", border:"#EAECF5",
  text:"#1A1A35", sub:"#8890B0", faint:"#F0F2FF", faintB:"#DDE3FF",
  green:"#22C9A0", red:"#FF5C7A", orange:"#FF9F43",
  purple:"#6C63FF", purpleL:"#EEF0FF",
};
const PALETTE = ["#FF6B6B","#FF9F43","#FFC312","#26de81","#4A90E2","#45AAF2","#9B59B6","#FF6B9D","#1ABC9C","#E91E8C"];

// ── 유틸 ─────────────────────────────────
// 한국 시간 기준 오늘 날짜
const getToday = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const TODAY = getToday();

// UTC 변환 없이 로컬 날짜 기준으로 계산
const addDays = (dateStr, n) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
};

// iOS/Android SMS 링크 분기
const smsLink = (phone, body) => {
  const encoded = encodeURIComponent(body || "");
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  return `sms:${phone}${body ? (isIOS ? `&body=${encoded}` : `?body=${encoded}`) : ""}`;
};

const fmt = (dateStr) => { const [y,m,d]=dateStr.split("-").map(Number); const date=new Date(y,m-1,d); return `${m}/${d}(${["일","월","화","수","목","금","토"][date.getDay()]})`; };
const todayDayName = () => ["일","월","화","수","목","금","토"][new Date().getDay()];
const getCalDays = (year,month) => {
  const first=new Date(year,month,1).getDay(), last=new Date(year,month+1,0).getDate();
  const offset=first===0?6:first-1, days=[];
  for(let i=0;i<offset;i++) days.push(null);
  for(let d=1;d<=last;d++) days.push(d);
  return days;
};
const getDayName = (year,month,day)=>["일","월","화","수","목","금","토"][new Date(year,month,day).getDay()];
const getAcDates = (ac, start=addDays(TODAY,-1), end=addDays(TODAY,13)) => {
  const dates=[]; let d=start;
  while(d<=end){ if(ac.days.includes(["일","월","화","수","목","금","토"][new Date(d).getDay()])) dates.push(d); d=addDays(d,1); }
  return dates;
};

// ── 샘플 데이터 ──────────────────────────
const SAMPLE_AC = {
  "이연우":[
    { id:1, name:"수학학원", days:["월","수","금"], time:"15:00", duration:90, fee:280000, payDay:5, color:"#FF9F43", baseSupplies:["교재","필통"], phone:"02-123-4567", teacher:"김수학 선생님", address:"서울시 강남구", memo:"레벨 테스트 예정" },
    { id:2, name:"영어학원", days:["화","목"], time:"16:30", duration:60, fee:240000, payDay:10, color:"#4A90E2", baseSupplies:["단어장","워크북"], phone:"010-1234-5678", teacher:"이영어 선생님", address:"서울시 서초구", memo:"" },
  ],
  "이지우":[
    { id:3, name:"피아노", days:["화","목"], time:"14:00", duration:30, fee:150000, payDay:1, color:"#FF6B9D", baseSupplies:["악보"], phone:"010-9876-5432", teacher:"박피아노 선생님", address:"서울시 송파구", memo:"발표회 12월" },
    { id:4, name:"미술학원", days:["토"], time:"10:00", duration:120, fee:180000, payDay:15, color:"#9B59B6", baseSupplies:["앞치마","물감"], phone:"02-567-8901", teacher:"최미술 선생님", address:"서울시 마포구", memo:"" },
  ],
};
const SAMPLE_TMPL = [
  { id:1, title:"결석 안내", body:"안녕하세요. {아이이름} 학부모입니다.\n{날짜} {학원명} 수업을 결석하게 되었습니다.\n양해 부탁드립니다." },
  { id:2, title:"조기 하원 요청", body:"안녕하세요. {아이이름} 학부모입니다.\n오늘 {학원명} 수업을 일찍 마치고 하원해야 할 것 같습니다.\n{시간}에 데리러 가겠습니다. 감사합니다." },
  { id:3, title:"보충 수업 문의", body:"안녕하세요. {아이이름} 학부모입니다.\n{날짜} 결석 건으로 보충 수업 일정을 문의드립니다.\n편하신 날짜를 알려주시면 감사하겠습니다." },
  { id:4, title:"준비물 확인", body:"안녕하세요. {아이이름} 학부모입니다.\n{학원명} 준비물 관련하여 확인 부탁드립니다. 감사합니다." },
];

const save = async (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const load = async (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
const EMPTY_AC  = { name:"", days:[], time:"", duration:60, fee:0, payDay:1, color:"#FF6B6B", baseSupplies:[], phone:"", teacher:"", address:"", memo:"" };
const EMPTY_ABS = { academyId:"", date:TODAY, reason:"", makeupDate:"", makeupDone:false };
const EMPTY_TMPL_OBJ = { title:"", body:"" };

// ══════════════════════════════════════════
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [child, setChild]   = useState("이연우");
  // 탭: home | calendar | fee | absence | sms
  const [tab, setTab]       = useState("home");
  const [academies, setAcademies]     = useState(SAMPLE_AC);
  const [absences,  setAbsences]      = useState({"이연우":[],"이지우":[]});
  const [paidStatus,setPaidStatus]    = useState({});
  const [dayMemos,  setDayMemos]      = useState({});
  const [dailyData, setDailyData]     = useState({});
  const [templates, setTemplates]     = useState(SAMPLE_TMPL);
  const [feeMonth,  setFeeMonth]      = useState(new Date().getMonth()+1);
  const [calDate,   setCalDate]       = useState(new Date());
  const [calSelDate,setCalSelDate]    = useState(null); // "YYYY-MM-DD" 선택된 날짜
  const [homeDate,  setHomeDate]      = useState(TODAY); // 홈 기준 날짜

  // 모달
  const [showAddAcModal,   setShowAddAcModal]   = useState(false);
  const [editTarget,       setEditTarget]        = useState(null);
  const [showDetailModal,  setShowDetailModal]   = useState(null); // academy obj
  const [showAbsModal,     setShowAbsModal]      = useState(false);
  const [showMemoModal,    setShowMemoModal]     = useState(null); // {day,month,year}
  const [showDailyModal,   setShowDailyModal]    = useState(null); // {academyId,date,...}
  const [showSmsModal,     setShowSmsModal]      = useState(null); // academy obj
  const [showTmplEdit,     setShowTmplEdit]      = useState(null); // null|"new"|id
  const [smsDraft,         setSmsDraft]          = useState("");
  const [editTmpl,         setEditTmpl]          = useState(EMPTY_TMPL_OBJ);
  const [newAc,            setNewAc]             = useState(EMPTY_AC);
  const [newAbs,           setNewAbs]            = useState(EMPTY_ABS);
  const [supplyInput,      setSupplyInput]       = useState("");
  const [dailyHwInput,     setDailyHwInput]      = useState("");
  const [dailySupInput,    setDailySupInput]     = useState("");
  const [toast,            setToast]             = useState("");

  // ── 로드/저장 ──
  useEffect(()=>{
    (async()=>{
      const ac=await load("v4_ac"), ab=await load("v4_abs"), p=await load("v4_paid"),
            dm=await load("v4_dm"), dd=await load("v4_daily"), tmpl=await load("v4_tmpl");
      if(ac) setAcademies(ac); if(ab) setAbsences(ab); if(p) setPaidStatus(p);
      if(dm) setDayMemos(dm);  if(dd) setDailyData(dd); if(tmpl) setTemplates(tmpl);
      setLoaded(true);
    })();
  },[]);
  useEffect(()=>{ if(loaded) save("v4_ac",academies); },[academies,loaded]);
  useEffect(()=>{ if(loaded) save("v4_abs",absences); },[absences,loaded]);
  useEffect(()=>{ if(loaded) save("v4_paid",paidStatus); },[paidStatus,loaded]);
  useEffect(()=>{ if(loaded) save("v4_dm",dayMemos); },[dayMemos,loaded]);
  useEffect(()=>{ if(loaded) save("v4_daily",dailyData); },[dailyData,loaded]);
  useEffect(()=>{ if(loaded) save("v4_tmpl",templates); },[templates,loaded]);

  const showToast=(msg="저장됨 ✓")=>{ setToast(msg); setTimeout(()=>setToast(""),1600); };

  // ── 파생값 ──
  const th     = CHILD_MAP[child].theme;
  const curAc  = academies[child]||[];
  const curAbs = absences[child]||[];
  const totalFee = (c)=>(academies[c]||[]).reduce((s,a)=>s+Number(a.fee),0);
  const grandTotal = CHILDREN.reduce((s,c)=>s+totalFee(c.key),0);

  const dailyKey = (c,aId,date)=>`${c}-${aId}-${date}`;
  const getDailyEntry = (c,aId,date)=>dailyData[dailyKey(c,aId,date)]||{homeworks:[],supplies:[]};
  const setDailyEntry = (c,aId,date,entry)=>setDailyData(p=>({...p,[dailyKey(c,aId,date)]:entry}));

  const pendingHwTotal = ()=>{
    let n=0;
    Object.entries(dailyData).forEach(([k,e])=>{ if(k.startsWith(child+"-")) n+=(e.homeworks||[]).filter(h=>!h.done).length; });
    return n;
  };
  const pendingAbsCount = curAbs.filter(a=>a.makeupDate&&!a.makeupDone).length;

  // 오늘 수업 있는 학원 (요약 바용)
  const todayAc = curAc.filter(a=>a.days.includes(todayDayName()));

  // ── 학원 CRUD ──
  const openAdd  = ()=>{ setEditTarget(null); setNewAc(EMPTY_AC); setSupplyInput(""); setShowAddAcModal(true); };
  const openEdit = (ac)=>{ setEditTarget(ac.id); setNewAc({...ac}); setSupplyInput(""); setShowDetailModal(null); setShowAddAcModal(true); };
  const saveAcademy = ()=>{
    if(!newAc.name||newAc.days.length===0) return;
    setAcademies(prev=>{
      const list=prev[child]||[];
      return editTarget!==null
        ? {...prev,[child]:list.map(a=>a.id===editTarget?{...newAc,id:editTarget}:a)}
        : {...prev,[child]:[...list,{...newAc,id:Date.now()}]};
    });
    setShowAddAcModal(false); setEditTarget(null); setNewAc(EMPTY_AC);
    showToast(editTarget?"수정됨 ✓":"추가됨 ✓");
  };
  const deleteAcademy = (id)=>{ setAcademies(p=>({...p,[child]:(p[child]||[]).filter(a=>a.id!==id)})); setShowDetailModal(null); showToast("삭제됨"); };
  const toggleDay = (day)=>setNewAc(p=>({...p,days:p.days.includes(day)?p.days.filter(d=>d!==day):[...p.days,day]}));
  const addBaseSupply = ()=>{ const v=supplyInput.trim(); if(!v) return; setNewAc(p=>({...p,baseSupplies:[...(p.baseSupplies||[]),v]})); setSupplyInput(""); };

  // ── 학원비 ──
  const pKey   = (c,aId)=>`${c}-${feeMonth}-${aId}`;
  const isPaid = (aId)=>!!paidStatus[pKey(child,aId)];
  const togglePaid = (aId)=>{ const k=pKey(child,aId); setPaidStatus(p=>({...p,[k]:!p[k]})); };
  const payStatus = (a)=>{
    const now=new Date(), d=new Date(now.getFullYear(),now.getMonth(),a.payDay);
    const diff=Math.ceil((d-now)/(86400000));
    if(isPaid(a.id)) return {label:"납부완료",color:C.green};
    if(diff<0) return {label:`${Math.abs(diff)}일 초과`,color:C.red};
    if(diff===0) return {label:"오늘!",color:C.orange};
    if(diff<=3) return {label:`D-${diff}`,color:C.orange};
    return {label:`D-${diff}`,color:C.sub};
  };

  // ── 결석 ──
  const addAbs = ()=>{
    if(!newAbs.academyId||!newAbs.date) return;
    setAbsences(p=>({...p,[child]:[...(p[child]||[]),{...newAbs,id:Date.now()}]}));
    setNewAbs(EMPTY_ABS); setShowAbsModal(false); showToast();
  };
  const deleteAbs  = (id)=>setAbsences(p=>({...p,[child]:(p[child]||[]).filter(a=>a.id!==id)}));
  const toggleMakeup=(id)=>setAbsences(p=>({...p,[child]:(p[child]||[]).map(a=>a.id===id?{...a,makeupDone:!a.makeupDone}:a)}));

  // ── 문자 ──
  const applyTmpl = (tmpl,ac)=>{
    setSmsDraft(tmpl.body.replace(/{아이이름}/g,child).replace(/{학원명}/g,ac.name).replace(/{날짜}/g,fmt(TODAY)).replace(/{시간}/g,ac.time));
  };
  const saveTmpl = ()=>{
    if(!editTmpl.title||!editTmpl.body) return;
    setTemplates(p=> showTmplEdit==="new" ? [...p,{...editTmpl,id:Date.now()}] : p.map(t=>t.id===showTmplEdit?{...editTmpl,id:t.id}:t));
    setShowTmplEdit(null); showToast();
  };

  // ── 달력 ──
  const memoKey = (c,y,m,d)=>`${c}-${y}-${m}-${d}`;
  const calDays = getCalDays(calDate.getFullYear(),calDate.getMonth());

  // ── 공통 스타일 ──
  const inp={ width:"100%",boxSizing:"border-box",background:C.faint,border:`1px solid ${C.faintB}`,borderRadius:10,padding:"11px 12px",color:C.text,fontSize:14,outline:"none",fontFamily:"inherit" };
  const lbl={ fontSize:12,color:C.sub,display:"block",marginBottom:6,fontWeight:600 };

  if(!loaded) return (
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
      <div style={{fontSize:44}}>🎒</div><p style={{color:C.sub,fontSize:14,marginTop:10}}>불러오는 중...</p>
    </div>
  );

  return (
    <div style={{fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",color:C.text,paddingBottom:90}}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap" rel="stylesheet"/>

      {/* 토스트 */}
      {toast&&<div style={{position:"fixed",top:20,left:"50%",transform:"translateX(-50%)",background:th.main,color:"#fff",padding:"9px 22px",borderRadius:20,fontSize:13,fontWeight:700,zIndex:999,boxShadow:`0 4px 16px ${th.main}55`}}>{toast}</div>}

      {/* ── 헤더 ── */}
      <div style={{background:th.grad,padding:"20px 20px 0",boxShadow:"0 4px 20px rgba(0,0,0,0.12)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <p style={{fontSize:10,color:"rgba(255,255,255,0.75)",margin:0,letterSpacing:2,fontWeight:600}}>ACADEMY PLANNER</p>
            <h1 style={{fontSize:20,fontWeight:900,margin:"3px 0 0",color:"#fff"}}>🎒 우리 아이 학원 관리</h1>
          </div>
          <button onClick={openAdd} style={{background:"rgba(255,255,255,0.25)",backdropFilter:"blur(8px)",border:"1.5px solid rgba(255,255,255,0.45)",borderRadius:12,padding:"8px 14px",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>+ 추가</button>
        </div>
        {/* 아이 선택 탭 */}
        <div style={{display:"flex",background:"rgba(0,0,0,0.15)",borderRadius:"12px 12px 0 0",overflow:"hidden"}}>
          {CHILDREN.map(c=>(
            <button key={c.key} onClick={()=>setChild(c.key)} style={{flex:1,padding:"11px 0",border:"none",cursor:"pointer",fontSize:14,fontWeight:child===c.key?800:500,background:child===c.key?"rgba(255,255,255,0.95)":"transparent",color:child===c.key?CHILD_MAP[c.key].theme.main:"rgba(255,255,255,0.82)",transition:"all 0.2s"}}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 탭 바 (5개로 간소화) ── */}
      <div style={{display:"flex",background:C.card,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:10,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
        {[["home","🏠 홈"],["calendar","🗓 달력"],["fee","💰 학원비"],["absence","🏥 결석"],["sms","💬 문자"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"12px 2px",border:"none",background:"transparent",fontSize:10,fontWeight:tab===k?800:400,color:tab===k?th.main:C.sub,borderBottom:tab===k?`2.5px solid ${th.main}`:"2.5px solid transparent",cursor:"pointer",whiteSpace:"nowrap",transition:"color 0.2s"}}>{l}</button>
        ))}
      </div>

      <div style={{padding:"14px 14px 0"}}>

        {/* ══════════════════════════════
            홈 탭 — 오늘 대시보드
        ══════════════════════════════ */}
        {tab==="home"&&(()=>{
          const hd         = new Date(homeDate);
          const hDayName   = ["일","월","화","수","목","금","토"][hd.getDay()];
          const isToday    = homeDate === TODAY;
          const isTomorrow = homeDate === addDays(TODAY,1);
          const isYesterday= homeDate === addDays(TODAY,-1);
          const dayTag     = isToday?"오늘":isTomorrow?"내일":isYesterday?"어제":null;
          const fullLabel  = `${hd.getMonth()+1}월 ${hd.getDate()}일 ${hDayName}요일`;

          const homeAc      = curAc.filter(a=>a.days.includes(hDayName)).sort((a,b)=>a.time.localeCompare(b.time));
          const absOnHome   = curAbs.filter(a=>a.date===homeDate);
          const makeupOnHome= curAbs.filter(a=>a.makeupDate===homeDate);
          const homePendingHw = homeAc.reduce((n,ac)=>n+(getDailyEntry(child,ac.id,homeDate).homeworks||[]).filter(h=>!h.done).length, 0);

          return (
            <div>
              {/* ── 날짜 이동 헤더 ── */}
              <div style={{background:th.grad,borderRadius:16,padding:"14px 16px",marginBottom:14,color:"#fff",boxShadow:`0 4px 18px ${th.main}30`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  {/* 이전 날 */}
                  <button onClick={()=>setHomeDate(addDays(homeDate,-1))}
                    style={{width:36,height:36,borderRadius:12,background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.35)",color:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>‹</button>
                  {/* 날짜 표시 */}
                  <div style={{flex:1,textAlign:"center"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
                      <span style={{fontSize:17,fontWeight:900,letterSpacing:-0.3}}>{fullLabel}</span>
                      {dayTag&&<span style={{fontSize:10,background:"rgba(255,255,255,0.3)",borderRadius:6,padding:"2px 8px",fontWeight:700,flexShrink:0}}>{dayTag}</span>}
                    </div>
                    {!isToday&&(
                      <button onClick={()=>setHomeDate(TODAY)}
                        style={{marginTop:4,background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.3)",borderRadius:6,color:"#fff",fontSize:10,cursor:"pointer",padding:"2px 10px",fontWeight:600}}>
                        ↩ 오늘로
                      </button>
                    )}
                  </div>
                  {/* 다음 날 */}
                  <button onClick={()=>setHomeDate(addDays(homeDate,1))}
                    style={{width:36,height:36,borderRadius:12,background:"rgba(255,255,255,0.2)",border:"1.5px solid rgba(255,255,255,0.35)",color:"#fff",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>›</button>
                </div>
                {/* 요약 지표 */}
                <div style={{display:"flex",gap:6}}>
                  {[
                    {label:"학원",       value:`${homeAc.length}개`,                                               alert:false},
                    {label:"미완 숙제",  value:`${homePendingHw}개`,                                              alert:homePendingHw>0},
                    {label:"결석",       value:`${absOnHome.length}개`,                                           alert:absOnHome.length>0},
                    {label:"보충수업",   value:`${makeupOnHome.length}개`,                                         alert:makeupOnHome.length>0},
                  ].map((s,i)=>(
                    <div key={i} style={{flex:1,background:s.alert?"rgba(255,80,80,0.25)":"rgba(255,255,255,0.18)",borderRadius:10,padding:"8px 4px",textAlign:"center",border:s.alert?"1px solid rgba(255,120,120,0.4)":"1px solid transparent"}}>
                      <p style={{fontSize:9,color:"rgba(255,255,255,0.82)",margin:0,fontWeight:600}}>{s.label}</p>
                      <p style={{fontSize:13,fontWeight:800,margin:"3px 0 0",color:s.alert?"#FFE066":"#fff"}}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 결석 뱃지 (해당 날짜) */}
              {absOnHome.length>0&&(
                <div style={{background:`${C.red}08`,border:`1px solid ${C.red}25`,borderRadius:12,padding:"10px 14px",marginBottom:10}}>
                  <p style={{fontSize:12,fontWeight:700,color:C.red,margin:"0 0 6px"}}>🏥 결석</p>
                  {absOnHome.map(ab=>{
                    const ac=curAc.find(a=>a.id===Number(ab.academyId));
                    return ac?(
                      <div key={ab.id} style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:ac.color}}/>
                        <span style={{fontSize:13,fontWeight:700,color:C.text}}>{ac.name}</span>
                        {ab.reason&&<span style={{fontSize:11,color:C.sub}}>· {ab.reason}</span>}
                        {ac.phone&&<button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }} style={{marginLeft:"auto",fontSize:11,padding:"3px 9px",borderRadius:7,border:`1px solid ${C.purple}30`,background:C.purpleL,color:C.purple,cursor:"pointer",fontWeight:600}}>💬 문자</button>}
                      </div>
                    ):null;
                  })}
                </div>
              )}

              {/* 보충수업 뱃지 (해당 날짜) */}
              {makeupOnHome.length>0&&(
                <div style={{background:`${C.orange}08`,border:`1px solid ${C.orange}25`,borderRadius:12,padding:"10px 14px",marginBottom:10}}>
                  <p style={{fontSize:12,fontWeight:700,color:C.orange,margin:"0 0 6px"}}>📚 보충수업</p>
                  {makeupOnHome.map(ab=>{
                    const ac=curAc.find(a=>a.id===Number(ab.academyId));
                    return ac?(
                      <div key={ab.id} style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:ac.color}}/>
                        <div style={{flex:1}}>
                          <span style={{fontSize:13,fontWeight:700,color:C.text}}>{ac.name}</span>
                          <p style={{fontSize:11,color:C.sub,margin:"1px 0 0"}}>원래 결석일: {ab.date}</p>
                        </div>
                        <button onClick={()=>setAbsences(p=>({...p,[child]:(p[child]||[]).map(a=>a.id===ab.id?{...a,makeupDone:!a.makeupDone}:a)}))}
                          style={{fontSize:11,padding:"3px 9px",borderRadius:7,border:`1px solid ${ab.makeupDone?C.green+"40":C.orange+"40"}`,background:ab.makeupDone?`${C.green}12`:`${C.orange}12`,color:ab.makeupDone?C.green:C.orange,cursor:"pointer",fontWeight:700}}>
                          {ab.makeupDone?"✓ 완료":"완료처리"}
                        </button>
                      </div>
                    ):null;
                  })}
                </div>
              )}

              {/* 학원 없는 날 */}
              {homeAc.length===0&&absOnHome.length===0&&makeupOnHome.length===0&&(
                <div style={{textAlign:"center",padding:"28px 20px",background:C.card,borderRadius:16,border:`1.5px dashed ${C.border}`,marginBottom:12}}>
                  <p style={{fontSize:26}}>😴</p>
                  <p style={{color:C.sub,fontSize:14,margin:"6px 0 0"}}>{dayTag||fullLabel}은 학원이 없어요</p>
                </div>
              )}

              {/* 학원별 카드 — 달력과 동일 dailyData 연동 */}
              {homeAc.map(ac=>{
                const [h,m]=ac.time.split(":").map(Number);
                const eH=Math.floor((h*60+m+ac.duration)/60), eM=(h*60+m+ac.duration)%60;
                const endT=`${String(eH).padStart(2,"0")}:${String(eM).padStart(2,"0")}`;
                const entry  = getDailyEntry(child,ac.id,homeDate);
                const hw     = entry.homeworks||[];
                const sup    = entry.supplies||[];
                const doneCnt= hw.filter(h=>h.done).length;
                const allDone= hw.length>0&&doneCnt===hw.length;
                return (
                  <div key={ac.id} style={{background:C.card,borderRadius:18,marginBottom:12,border:`1.5px solid ${ac.color}30`,boxShadow:`0 4px 18px ${ac.color}12`,overflow:"hidden"}}>
                    {/* 학원 헤더 */}
                    <div style={{background:`${ac.color}10`,padding:"12px 16px",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:5,height:48,borderRadius:3,background:ac.color,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <p style={{fontSize:16,fontWeight:800,margin:0,color:C.text}}>{ac.name}</p>
                        <p style={{fontSize:12,color:C.sub,margin:"2px 0 0"}}>{ac.time} ~ {endT} · {ac.duration}분</p>
                        {ac.teacher&&<p style={{fontSize:11,color:C.sub,margin:"1px 0 0"}}>👩‍🏫 {ac.teacher}</p>}
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        {ac.phone&&(
                          <a href={`tel:${ac.phone}`} style={{width:34,height:34,borderRadius:10,background:`${C.green}12`,border:`1px solid ${C.green}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,textDecoration:"none"}}>📞</a>
                        )}
                        <button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }}
                          style={{width:34,height:34,borderRadius:10,background:C.purpleL,border:`1px solid ${C.purple}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer"}}>💬</button>
                      </div>
                    </div>

                    <div style={{padding:"12px 16px"}}>
                      {/* 준비물 */}
                      <div style={{marginBottom:10}}>
                        <p style={{fontSize:11,fontWeight:700,color:C.sub,margin:"0 0 6px"}}>🎒 준비물</p>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                          {(ac.baseSupplies||[]).map((s,i)=>(
                            <span key={`b${i}`} style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:`${ac.color}18`,color:ac.color,fontWeight:600}}>{s}</span>
                          ))}
                          {sup.map((s,i)=>(
                            <span key={`d${i}`} style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:`${C.orange}15`,color:C.orange,fontWeight:600}}>+{s}</span>
                          ))}
                          {(ac.baseSupplies||[]).length===0&&sup.length===0&&(
                            <span style={{fontSize:11,color:"#CCC"}}>없음</span>
                          )}
                        </div>
                      </div>

                      {/* 숙제 */}
                      <div style={{marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                          <p style={{fontSize:11,fontWeight:700,color:C.sub,margin:0}}>📝 숙제</p>
                          {hw.length>0&&(
                            <span style={{fontSize:10,fontWeight:700,color:allDone?C.green:C.orange}}>
                              {allDone?"✓ 완료":`${doneCnt}/${hw.length} 완료`}
                            </span>
                          )}
                        </div>
                        {hw.length===0?(
                          <p style={{fontSize:12,color:"#CCC",margin:0}}>등록된 숙제 없음</p>
                        ):(
                          <div style={{display:"flex",flexDirection:"column",gap:5}}>
                            {hw.map(h=>(
                              <div key={h.id} style={{display:"flex",alignItems:"center",gap:9,padding:"7px 10px",borderRadius:9,background:h.done?`${C.green}08`:C.faint,border:`1px solid ${h.done?C.green+"25":C.faintB}`}}>
                                <button onClick={()=>{
                                  const e=getDailyEntry(child,ac.id,homeDate);
                                  setDailyEntry(child,ac.id,homeDate,{...e,homeworks:e.homeworks.map(x=>x.id===h.id?{...x,done:!x.done}:x)});
                                }} style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${h.done?C.green:"#CCC"}`,background:h.done?C.green:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",fontWeight:700}}>{h.done?"✓":""}</button>
                                <span style={{flex:1,fontSize:12,color:h.done?C.sub:C.text,textDecoration:h.done?"line-through":"none"}}>{h.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 편집 버튼 */}
                      <button onClick={()=>{ setShowDailyModal({academyId:ac.id,date:homeDate,acName:ac.name,acColor:ac.color,baseSupplies:ac.baseSupplies}); setDailyHwInput(""); setDailySupInput(""); }}
                        style={{width:"100%",padding:"8px",borderRadius:10,border:`1.5px dashed ${ac.color}50`,background:`${ac.color}06`,color:ac.color,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                        ✏️ 숙제 · 준비물 편집
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* ── 이번 주 예정 ── */}
              <div style={{marginTop:8,marginBottom:12}}>
                <p style={{fontSize:12,color:C.sub,fontWeight:700,marginBottom:8,letterSpacing:0.5}}>📅 이번 주 예정</p>
                <div style={{background:C.card,borderRadius:14,border:`1px solid ${C.border}`,overflow:"hidden"}}>
                  {DAYS.map(day=>{
                    const da=curAc.filter(a=>a.days.includes(day));
                    if(da.length===0) return null;
                    const isHDay=day===hDayName;
                    return (
                      <div key={day} style={{display:"flex",alignItems:"center",padding:"9px 14px",borderBottom:`1px solid ${C.border}`,background:isHDay?`${th.main}08`:"transparent"}}>
                        <span style={{width:28,fontSize:12,fontWeight:700,color:isHDay?th.main:DAY_COLORS[day]}}>{day}</span>
                        {isHDay&&<span style={{fontSize:9,background:th.main,color:"#fff",borderRadius:4,padding:"1px 5px",marginRight:6,fontWeight:700,flexShrink:0}}>오늘</span>}
                        <div style={{flex:1,display:"flex",gap:5,flexWrap:"wrap"}}>
                          {da.map(a=>(
                            <span key={a.id} style={{fontSize:11,padding:"2px 8px",borderRadius:6,background:`${a.color}18`,color:a.color,fontWeight:600}}>{a.name} {a.time}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {curAc.length===0&&(
                    <div style={{textAlign:"center",padding:"20px",color:C.sub,fontSize:13}}>등록된 학원이 없어요</div>
                  )}
                </div>
              </div>

              {/* 등록 학원 목록 */}
              <div style={{marginTop:8,marginBottom:4}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <p style={{fontSize:12,color:C.sub,fontWeight:700,margin:0,letterSpacing:0.5}}>📋 등록 학원 ({curAc.length})</p>
                  <button onClick={openAdd} style={{fontSize:11,padding:"5px 14px",borderRadius:8,border:"none",background:th.grad,color:"#fff",fontWeight:700,cursor:"pointer"}}>+ 학원 추가</button>
                </div>
                {curAc.length===0?(
                  <div style={{textAlign:"center",padding:"28px",color:C.sub,fontSize:13,background:C.card,borderRadius:14,border:`1.5px dashed ${C.border}`}}>
                    <p style={{fontSize:24,margin:"0 0 8px"}}>🏫</p>
                    위 버튼으로 학원을 등록하세요
                  </div>
                ):(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {curAc.map(ac=>(
                      <div key={ac.id} style={{background:C.card,borderRadius:14,border:`1.5px solid ${ac.color}30`,overflow:"hidden",boxShadow:`0 2px 10px ${ac.color}10`}}>
                        {/* 학원 이름 헤더 */}
                        <div style={{background:`${ac.color}12`,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:5,height:40,borderRadius:3,background:ac.color,flexShrink:0}}/>
                          <div style={{flex:1}}>
                            <p style={{fontSize:17,fontWeight:900,margin:0,color:C.text,letterSpacing:-0.3}}>{ac.name}</p>
                            <p style={{fontSize:11,color:C.sub,margin:"2px 0 0"}}>{ac.days.join("·")}요일 &nbsp;·&nbsp; {ac.time} &nbsp;·&nbsp; {ac.duration}분</p>
                          </div>
                          {/* 수정 버튼 */}
                          <button onClick={()=>openEdit(ac)}
                            style={{padding:"5px 11px",borderRadius:8,border:`1px solid ${ac.color}40`,background:`${ac.color}10`,color:ac.color,fontSize:11,fontWeight:700,cursor:"pointer",flexShrink:0}}>✏️ 수정</button>
                        </div>
                        {/* 부가 정보 + 액션 */}
                        <div style={{padding:"9px 14px",display:"flex",alignItems:"center",gap:10}}>
                          <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:6}}>
                            <span style={{fontSize:11,color:C.sub}}>💰 월 {Number(ac.fee).toLocaleString()}원</span>
                            {ac.teacher&&<span style={{fontSize:11,color:C.sub}}>👩‍🏫 {ac.teacher}</span>}
                            {(ac.baseSupplies||[]).length>0&&(
                              <span style={{fontSize:11,color:C.sub}}>🎒 {ac.baseSupplies.join("·")}</span>
                            )}
                          </div>
                          <div style={{display:"flex",gap:6,flexShrink:0}}>
                            {ac.phone&&(
                              <a href={`tel:${ac.phone}`} style={{width:32,height:32,borderRadius:8,background:`${C.green}12`,border:`1px solid ${C.green}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,textDecoration:"none"}}>📞</a>
                            )}
                            <button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }}
                              style={{width:32,height:32,borderRadius:8,background:C.purpleL,border:`1px solid ${C.purple}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,cursor:"pointer"}}>💬</button>
                            <button onClick={()=>setShowDetailModal(ac)}
                              style={{width:32,height:32,borderRadius:8,background:C.faint,border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,cursor:"pointer"}}>›</button>
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

        {/* ══════════════════════════════
            달력 탭
        ══════════════════════════════ */}
        {tab==="calendar"&&(()=>{
          // 선택 날짜 파생값
          const selInfo = calSelDate ? (()=>{
            const d=new Date(calSelDate);
            const y=d.getFullYear(), m=d.getMonth(), day=d.getDate();
            const dn=getDayName(y,m,day);
            const acList=curAc.filter(a=>a.days.includes(dn));
            const mk=memoKey(child,y,m,day);
            const absOnDay=curAbs.filter(a=>a.date===calSelDate);
            const makeupOnDay=curAbs.filter(a=>a.makeupDate===calSelDate); // 보충수업 예정/완료
            return {y,m,day,dn,acList,mk,absOnDay,makeupOnDay};
          })() : null;

          return (
            <div>
              {/* 월 이동 */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <button onClick={()=>{ setCalDate(new Date(calDate.getFullYear(),calDate.getMonth()-1,1)); setCalSelDate(null); }} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,width:34,height:34,fontSize:16,cursor:"pointer",color:C.text}}>‹</button>
                <span style={{fontWeight:800,fontSize:17}}>{calDate.getFullYear()}년 {calDate.getMonth()+1}월</span>
                <button onClick={()=>{ setCalDate(new Date(calDate.getFullYear(),calDate.getMonth()+1,1)); setCalSelDate(null); }} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,width:34,height:34,fontSize:16,cursor:"pointer",color:C.text}}>›</button>
              </div>

              {/* 요일 헤더 */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",textAlign:"center",marginBottom:4}}>
                {["월","화","수","목","금","토","일"].map((d,i)=>(
                  <div key={d} style={{fontSize:11,fontWeight:700,color:i===5?"#3498DB":i===6?"#E74C3C":C.sub,padding:"4px 0"}}>{d}</div>
                ))}
              </div>

              {/* 날짜 그리드 */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
                {calDays.map((day,i)=>{
                  if(!day) return <div key={i}/>;
                  const dn=getDayName(calDate.getFullYear(),calDate.getMonth(),day);
                  const acList=curAc.filter(a=>a.days.includes(dn));
                  const mk=memoKey(child,calDate.getFullYear(),calDate.getMonth(),day);
                  const hasMemo=!!dayMemos[mk];
                  const isToday=new Date().getDate()===day&&new Date().getMonth()===calDate.getMonth()&&new Date().getFullYear()===calDate.getFullYear();
                  const dateStr=`${calDate.getFullYear()}-${String(calDate.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const absOnDay=curAbs.filter(a=>a.date===dateStr);
                  // 보충수업 예정일인지 확인
                  const makeupOnDay=curAbs.filter(a=>a.makeupDate===dateStr&&!a.makeupDone);
                  const makeupDoneOnDay=curAbs.filter(a=>a.makeupDate===dateStr&&a.makeupDone);
                  const pendingHwOnDay=acList.some(a=>(getDailyEntry(child,a.id,dateStr).homeworks||[]).some(h=>!h.done));
                  const doneHwOnDay=acList.some(a=>(getDailyEntry(child,a.id,dateStr).homeworks||[]).every(h=>h.done)&&(getDailyEntry(child,a.id,dateStr).homeworks||[]).length>0);
                  const hasExtraSupply=acList.some(a=>(getDailyEntry(child,a.id,dateStr).supplies||[]).length>0);
                  const isSel=calSelDate===dateStr;

                  // 아이콘 뱃지 목록 계산 (최대 4개)
                  const badges=[];
                  if(absOnDay.length>0)      badges.push({icon:"🏥", title:"결석"});
                  if(makeupOnDay.length>0)   badges.push({icon:"📚", title:"보충예정"});
                  if(makeupDoneOnDay.length>0) badges.push({icon:"✅", title:"보충완료"});
                  if(pendingHwOnDay)          badges.push({icon:"⚠️", title:"숙제미완"});
                  else if(doneHwOnDay)        badges.push({icon:"✓",  title:"숙제완료", color:C.green});
                  if(hasExtraSupply)          badges.push({icon:"🎒", title:"추가준비물"});
                  if(hasMemo)                 badges.push({icon:"📝", title:"메모"});

                  return (
                    <div key={i}
                      onClick={()=>setCalSelDate(isSel?null:dateStr)}
                      style={{background:isToday?th.main:isSel?`${th.main}15`:C.card,borderRadius:10,padding:"4px 3px 3px",minHeight:68,cursor:"pointer",
                        border:`${isSel?"2px":"1px"} solid ${isToday?"transparent":isSel?th.main:C.border}`,
                        position:"relative",boxShadow:isToday?`0 3px 12px ${th.main}50`:isSel?`0 2px 10px ${th.main}30`:"none",
                        transition:"all 0.15s",display:"flex",flexDirection:"column"}}>
                      {/* 날짜 숫자 */}
                      <div style={{fontSize:12,fontWeight:isToday||isSel?900:600,
                        color:isToday?"#fff":isSel?th.main:dn==="일"?"#E74C3C":dn==="토"?"#3498DB":C.text,
                        textAlign:"right",paddingRight:3,marginBottom:1}}>{day}</div>
                      {/* 학원 컬러 도트 */}
                      {acList.length>0&&(
                        <div style={{display:"flex",gap:2,flexWrap:"wrap",paddingLeft:3,marginBottom:2}}>
                          {acList.map((a,j)=>(
                            <div key={j} style={{width:6,height:6,borderRadius:"50%",background:isToday?"rgba(255,255,255,0.8)":a.color,flexShrink:0}}/>
                          ))}
                        </div>
                      )}
                      {/* 상태 아이콘 뱃지 */}
                      {badges.length>0&&(
                        <div style={{display:"flex",gap:1,flexWrap:"wrap",paddingLeft:2,marginTop:"auto",paddingBottom:2}}>
                          {badges.slice(0,4).map((b,j)=>(
                            b.color
                              ? <span key={j} style={{fontSize:8,fontWeight:900,color:b.color,lineHeight:1}}>{b.icon}</span>
                              : <span key={j} style={{fontSize:9,lineHeight:1}}>{b.icon}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 범례 */}
              <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8,padding:"8px 10px",background:C.card,borderRadius:10,border:`1px solid ${C.border}`}}>
                {[
                  {icon:"●", label:"학원", note:"색상 도트"},
                  {icon:"🏥", label:"결석"},
                  {icon:"📚", label:"보충예정"},
                  {icon:"✅", label:"보충완료"},
                  {icon:"⚠️", label:"숙제미완"},
                  {icon:"🎒", label:"추가준비물"},
                  {icon:"📝", label:"메모"},
                ].map((l,i)=>(
                  <span key={i} style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:C.sub}}>
                    <span style={{fontSize:i===0?8:10,color:i===0?th.main:"inherit"}}>{l.icon}</span>{l.label}
                  </span>
                ))}
              </div>

              {/* ── 선택 날짜 상세 패널 ── */}
              {selInfo&&(
                <div style={{marginTop:14,background:C.card,borderRadius:16,border:`1.5px solid ${th.main}30`,overflow:"hidden",boxShadow:`0 4px 18px ${th.main}12`}}>
                  {/* 날짜 헤더 */}
                  <div style={{background:th.grad,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <div>
                      <p style={{fontSize:18,fontWeight:900,margin:0,color:"#fff"}}>
                        {selInfo.m+1}월 {selInfo.day}일 <span style={{fontSize:13,fontWeight:600,opacity:0.85}}>{selInfo.dn}요일</span>
                      </p>
                      {calSelDate===TODAY&&<span style={{fontSize:11,background:"rgba(255,255,255,0.3)",color:"#fff",borderRadius:6,padding:"2px 8px",fontWeight:700}}>오늘</span>}
                    </div>
                    <button onClick={()=>setCalSelDate(null)} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:"#fff",fontSize:14}}>✕</button>
                  </div>

                  <div style={{padding:"14px 16px"}}>
                    {/* 결석 섹션 */}
                    {selInfo.absOnDay.length>0&&(
                      <div style={{background:`${C.red}08`,border:`1px solid ${C.red}25`,borderRadius:12,padding:"10px 14px",marginBottom:12}}>
                        <p style={{fontSize:12,fontWeight:700,color:C.red,margin:"0 0 8px"}}>🏥 결석</p>
                        {selInfo.absOnDay.map(ab=>{
                          const ac=curAc.find(a=>a.id===Number(ab.academyId));
                          if(!ac) return null;
                          return (
                            <div key={ab.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderTop:`1px solid ${C.red}15`}}>
                              <div style={{width:7,height:7,borderRadius:"50%",background:ac.color,flexShrink:0}}/>
                              <div style={{flex:1}}>
                                <span style={{fontSize:13,fontWeight:700,color:C.text}}>{ac.name}</span>
                                {ab.reason&&<span style={{fontSize:11,color:C.sub,marginLeft:6}}>· {ab.reason}</span>}
                              </div>
                              {/* 결석 학원에 바로 문자 */}
                              {ac.phone&&(
                                <button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }}
                                  style={{fontSize:11,padding:"3px 9px",borderRadius:7,border:`1px solid ${C.purple}30`,background:C.purpleL,color:C.purple,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>💬 문자</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 보충수업 섹션 */}
                    {selInfo.makeupOnDay.length>0&&(
                      <div style={{background:`${C.orange}08`,border:`1px solid ${C.orange}30`,borderRadius:12,padding:"10px 14px",marginBottom:12}}>
                        <p style={{fontSize:12,fontWeight:700,color:C.orange,margin:"0 0 8px"}}>📚 보충수업</p>
                        {selInfo.makeupOnDay.map(ab=>{
                          const ac=curAc.find(a=>a.id===Number(ab.academyId));
                          if(!ac) return null;
                          return (
                            <div key={ab.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderTop:`1px solid ${C.orange}15`}}>
                              <div style={{width:7,height:7,borderRadius:"50%",background:ac.color,flexShrink:0}}/>
                              <div style={{flex:1}}>
                                <span style={{fontSize:13,fontWeight:700,color:C.text}}>{ac.name}</span>
                                <p style={{fontSize:11,color:C.sub,margin:"1px 0 0"}}>원래 결석일: {ab.date}{ab.reason&&` · ${ab.reason}`}</p>
                              </div>
                              <button onClick={()=>{ setAbsences(p=>({...p,[child]:(p[child]||[]).map(a=>a.id===ab.id?{...a,makeupDone:!a.makeupDone}:a)})); }}
                                style={{fontSize:11,padding:"3px 9px",borderRadius:7,border:`1px solid ${ab.makeupDone?C.green+"40":C.orange+"40"}`,background:ab.makeupDone?`${C.green}12`:`${C.orange}12`,color:ab.makeupDone?C.green:C.orange,cursor:"pointer",fontWeight:700,whiteSpace:"nowrap"}}>
                                {ab.makeupDone?"✓ 완료":"완료처리"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 메모 */}
                    {(()=>{
                      const memo=dayMemos[selInfo.mk]||"";
                      return (
                        <div style={{marginBottom:14}}>
                          <p style={{fontSize:11,fontWeight:700,color:C.sub,margin:"0 0 6px",letterSpacing:0.5}}>📝 날짜 메모</p>
                          <div style={{display:"flex",gap:8}}>
                            <input value={memo} onChange={e=>setDayMemos(p=>({...p,[selInfo.mk]:e.target.value}))}
                              placeholder="메모 입력..."
                              style={{flex:1,background:C.faint,border:`1px solid ${C.faintB}`,borderRadius:9,padding:"8px 11px",fontSize:13,color:C.text,outline:"none"}}/>
                            {memo&&<button onClick={()=>setDayMemos(p=>({...p,[selInfo.mk]:""}))} style={{background:"none",border:"none",color:"#CCC",cursor:"pointer",fontSize:13,padding:"0 4px"}}>✕</button>}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 학원 없는 날 (결석/보충도 없을 때) */}
                    {selInfo.acList.length===0&&selInfo.absOnDay.length===0&&selInfo.makeupOnDay.length===0&&(
                      <div style={{textAlign:"center",padding:"20px 0",color:C.sub,fontSize:13}}>
                        <p style={{fontSize:24,margin:"0 0 6px"}}>😴</p>학원이 없는 날이에요
                      </div>
                    )}

                    {/* 학원별 숙제 + 준비물 */}
                    {selInfo.acList.map(ac=>{
                      const entry=getDailyEntry(child,ac.id,calSelDate);
                      const hw=entry.homeworks||[], sup=entry.supplies||[];
                      const doneCnt=hw.filter(h=>h.done).length;
                      const allDone=hw.length>0&&doneCnt===hw.length;
                      const [h,m]=ac.time.split(":").map(Number);
                      const eH=Math.floor((h*60+m+ac.duration)/60), eM=(h*60+m+ac.duration)%60;
                      const endT=`${String(eH).padStart(2,"0")}:${String(eM).padStart(2,"0")}`;
                      return (
                        <div key={ac.id} style={{marginBottom:12,borderRadius:14,border:`1.5px solid ${ac.color}25`,overflow:"hidden"}}>
                          {/* 학원 미니 헤더 */}
                          <div style={{background:`${ac.color}10`,padding:"9px 14px",display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:4,height:36,borderRadius:2,background:ac.color,flexShrink:0}}/>
                            <div style={{flex:1}}>
                              <p style={{fontSize:14,fontWeight:800,margin:0,color:C.text}}>{ac.name}</p>
                              <p style={{fontSize:11,color:C.sub,margin:"1px 0 0"}}>{ac.time} ~ {endT}</p>
                            </div>
                            {hw.length>0&&(
                              <span style={{fontSize:10,fontWeight:700,color:allDone?C.green:C.orange,background:allDone?`${C.green}15`:`${C.orange}15`,borderRadius:6,padding:"2px 7px"}}>
                                {allDone?"✓ 완료":`${doneCnt}/${hw.length}`}
                              </span>
                            )}
                          </div>

                          <div style={{padding:"10px 14px"}}>
                            {/* 준비물 */}
                            <div style={{marginBottom:10}}>
                              <p style={{fontSize:11,fontWeight:700,color:C.sub,margin:"0 0 5px"}}>🎒 준비물</p>
                              <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                                {(ac.baseSupplies||[]).map((s,i)=>(
                                  <span key={`b${i}`} style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:`${ac.color}18`,color:ac.color,fontWeight:600}}>{s}</span>
                                ))}
                                {sup.map((s,i)=>(
                                  <span key={`d${i}`} style={{fontSize:11,padding:"3px 9px",borderRadius:20,background:`${C.orange}15`,color:C.orange,fontWeight:600}}>+{s}</span>
                                ))}
                                {(ac.baseSupplies||[]).length===0&&sup.length===0&&(
                                  <span style={{fontSize:11,color:"#CCC"}}>없음</span>
                                )}
                              </div>
                            </div>

                            {/* 숙제 */}
                            <div style={{marginBottom:8}}>
                              <p style={{fontSize:11,fontWeight:700,color:C.sub,margin:"0 0 5px"}}>📝 숙제</p>
                              {hw.length===0?(
                                <p style={{fontSize:12,color:"#CCC",margin:0}}>없음</p>
                              ):(
                                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                                  {hw.map(h=>(
                                    <div key={h.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:8,background:h.done?`${C.green}08`:C.faint,border:`1px solid ${h.done?C.green+"25":C.faintB}`}}>
                                      <button onClick={()=>{
                                        const e=getDailyEntry(child,ac.id,calSelDate);
                                        setDailyEntry(child,ac.id,calSelDate,{...e,homeworks:e.homeworks.map(x=>x.id===h.id?{...x,done:!x.done}:x)});
                                      }} style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${h.done?C.green:"#CCC"}`,background:h.done?C.green:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:700}}>{h.done?"✓":""}</button>
                                      <span style={{flex:1,fontSize:12,color:h.done?C.sub:C.text,textDecoration:h.done?"line-through":"none"}}>{h.text}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* 편집 버튼 */}
                            <button onClick={()=>{ setShowDailyModal({academyId:ac.id,date:calSelDate,acName:ac.name,acColor:ac.color,baseSupplies:ac.baseSupplies}); setDailyHwInput(""); setDailySupInput(""); }}
                              style={{width:"100%",padding:"7px",borderRadius:9,border:`1.5px dashed ${ac.color}50`,background:`${ac.color}06`,color:ac.color,fontSize:12,fontWeight:700,cursor:"pointer"}}>
                              ✏️ 숙제 · 준비물 편집
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 선택 전 안내 */}
              {!selInfo&&(
                <div style={{marginTop:12,textAlign:"center",padding:"18px",color:C.sub,fontSize:13,background:C.card,borderRadius:12,border:`1.5px dashed ${C.border}`}}>
                  날짜를 탭하면 학원·숙제·준비물·결석·보충수업을 확인할 수 있어요
                </div>
              )}
            </div>
          );
        })()}

        {/* ══════════════════════════════
            학원비 탭
        ══════════════════════════════ */}
        {tab==="fee"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <button onClick={()=>setFeeMonth(m=>Math.max(1,m-1))} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,width:34,height:34,fontSize:16,cursor:"pointer",color:C.text}}>‹</button>
              <span style={{fontWeight:800,fontSize:16}}>{feeMonth}월 학원비</span>
              <button onClick={()=>setFeeMonth(m=>Math.min(12,m+1))} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,width:34,height:34,fontSize:16,cursor:"pointer",color:C.text}}>›</button>
            </div>
            <div style={{background:th.grad,borderRadius:16,padding:"18px 20px",marginBottom:14,color:"#fff"}}>
              <p style={{fontSize:11,opacity:0.8,margin:0,fontWeight:600}}>{CHILD_MAP[child].emoji} {child} 총 학원비</p>
              <p style={{fontSize:30,fontWeight:900,margin:"5px 0 2px"}}>{totalFee(child).toLocaleString()}원</p>
              <div style={{display:"flex",gap:16}}>
                <p style={{fontSize:12,opacity:0.75,margin:0}}>납부 {curAc.filter(a=>isPaid(a.id)).length}/{curAc.length}개</p>
                <p style={{fontSize:12,opacity:0.75,margin:0}}>전체 합계 {grandTotal.toLocaleString()}원</p>
              </div>
            </div>
            {curAc.map(a=>{
              const st=payStatus(a);
              return (
                <div key={a.id} style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:10,border:`1px solid ${isPaid(a.id)?C.green+"40":C.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:a.color,flexShrink:0}}/>
                    <p style={{fontSize:15,fontWeight:700,margin:0,flex:1,color:C.text}}>{a.name}</p>
                    <button onClick={()=>togglePaid(a.id)} style={{padding:"5px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:isPaid(a.id)?`${C.green}18`:C.faint,color:isPaid(a.id)?C.green:C.sub}}>
                      {isPaid(a.id)?"✓ 납부완료":"미납"}
                    </button>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{display:"flex",gap:18}}>
                      <div><p style={{fontSize:10,color:C.sub,margin:0}}>월 학원비</p><p style={{fontSize:15,fontWeight:800,margin:"2px 0 0",color:C.text}}>{Number(a.fee).toLocaleString()}원</p></div>
                      <div><p style={{fontSize:10,color:C.sub,margin:0}}>납부일</p><p style={{fontSize:15,fontWeight:800,margin:"2px 0 0",color:C.text}}>매월 {a.payDay}일</p></div>
                    </div>
                    <span style={{fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:8,background:`${st.color}15`,color:st.color}}>{st.label}</span>
                  </div>
                </div>
              );
            })}
            {curAc.length===0&&<div style={{textAlign:"center",padding:"40px",color:C.sub,fontSize:14,background:C.card,borderRadius:14,border:`1.5px dashed ${C.border}`}}>등록된 학원이 없어요</div>}
          </div>
        )}

        {/* ══════════════════════════════
            결석 탭
        ══════════════════════════════ */}
        {tab==="absence"&&(
          <div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              {[{l:"전체",v:curAbs.length,c:C.red},{l:"보충 예정",v:curAbs.filter(a=>a.makeupDate&&!a.makeupDone).length,c:C.orange},{l:"보충 완료",v:curAbs.filter(a=>a.makeupDone).length,c:C.green}].map((s,i)=>(
                <div key={i} style={{flex:1,background:C.card,borderRadius:12,padding:"12px 8px",textAlign:"center",border:`1px solid ${s.c}20`}}>
                  <p style={{fontSize:10,color:C.sub,margin:0}}>{s.l}</p>
                  <p style={{fontSize:20,fontWeight:800,margin:"3px 0 0",color:s.c}}>{s.v}</p>
                </div>
              ))}
            </div>
            <button onClick={()=>setShowAbsModal(true)} style={{width:"100%",padding:12,borderRadius:12,border:`1.5px dashed ${C.red}55`,background:`${C.red}08`,color:C.red,fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:14}}>+ 결석 기록 추가</button>
            {[...curAbs].sort((a,b)=>b.date.localeCompare(a.date)).map(ab=>{
              const ac=curAc.find(a=>a.id===Number(ab.academyId)); if(!ac) return null;
              const past=ab.makeupDate&&ab.makeupDate<TODAY;
              return (
                <div key={ab.id} style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:10,border:`1px solid ${ab.makeupDone?C.green+"33":C.border}`}}>
                  <div style={{display:"flex",gap:10}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:ac.color,marginTop:4,flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <p style={{fontWeight:700,fontSize:15,margin:0,color:C.text}}>{ac.name}</p>
                        <button onClick={()=>deleteAbs(ab.id)} style={{background:"none",border:"none",color:"#CCC",cursor:"pointer",fontSize:16}}>✕</button>
                      </div>
                      <p style={{fontSize:12,color:C.sub,margin:"3px 0 8px"}}>결석일: {ab.date}{ab.reason&&` · ${ab.reason}`}</p>
                      <div style={{padding:"10px 12px",borderRadius:10,background:ab.makeupDone?`${C.green}0D`:past?`${C.red}0D`:C.faint,border:`1px solid ${ab.makeupDone?C.green+"33":past?C.red+"33":C.faintB}`}}>
                        {ab.makeupDate?(
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div>
                              <p style={{fontSize:10,color:C.sub,margin:0}}>보충 일정</p>
                              <p style={{fontSize:13,fontWeight:700,margin:"2px 0 0",color:ab.makeupDone?C.green:past?C.red:C.text}}>{ab.makeupDate}</p>
                              {past&&!ab.makeupDone&&<p style={{fontSize:10,color:C.red,margin:"2px 0 0"}}>⚠️ 보충일이 지났어요</p>}
                            </div>
                            <button onClick={()=>toggleMakeup(ab.id)} style={{padding:"6px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:ab.makeupDone?`${C.green}18`:C.faint,color:ab.makeupDone?C.green:C.sub}}>{ab.makeupDone?"✓ 완료":"완료 처리"}</button>
                          </div>
                        ):<p style={{fontSize:12,color:C.sub,margin:0}}>📭 보충 일정 미정</p>}
                      </div>
                      <button onClick={()=>{ setShowSmsModal(ac); setSmsDraft(""); }} style={{width:"100%",marginTop:8,padding:"7px",borderRadius:10,border:`1px solid ${C.purple}30`,background:C.purpleL,color:C.purple,fontSize:11,fontWeight:700,cursor:"pointer"}}>💬 결석 안내 문자 보내기</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {curAbs.length===0&&<div style={{textAlign:"center",padding:"40px 20px",background:C.card,borderRadius:16,border:`1.5px dashed ${C.border}`}}><p style={{fontSize:30}}>🙌</p><p style={{color:C.sub,fontSize:14}}>결석 기록이 없어요!</p></div>}
          </div>
        )}

        {/* ══════════════════════════════
            문자 템플릿 탭
        ══════════════════════════════ */}
        {tab==="sms"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <p style={{fontSize:13,color:C.sub,fontWeight:700,margin:0,letterSpacing:0.5}}>문자 템플릿 관리</p>
              <button onClick={()=>{ setShowTmplEdit("new"); setEditTmpl(EMPTY_TMPL_OBJ); }} style={{padding:"7px 14px",borderRadius:10,border:"none",background:th.grad,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ 새 템플릿</button>
            </div>
            <div style={{background:`${C.purple}08`,border:`1px solid ${C.purple}25`,borderRadius:12,padding:"10px 14px",marginBottom:14}}>
              <p style={{fontSize:11,color:C.purple,fontWeight:700,margin:"0 0 5px"}}>📌 사용 가능한 변수</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {["{아이이름}","{학원명}","{날짜}","{시간}"].map(v=>(
                  <span key={v} style={{fontSize:11,padding:"2px 8px",borderRadius:6,background:C.purpleL,color:C.purple,fontWeight:600}}>{v}</span>
                ))}
              </div>
            </div>
            {templates.map(tmpl=>(
              <div key={tmpl.id} style={{background:C.card,borderRadius:14,padding:"14px 16px",marginBottom:10,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontWeight:700,fontSize:14,color:C.text}}>💬 {tmpl.title}</span>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>{ setShowTmplEdit(tmpl.id); setEditTmpl({title:tmpl.title,body:tmpl.body}); }} style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${C.border}`,background:C.faint,color:C.sub,fontSize:11,cursor:"pointer"}}>수정</button>
                    <button onClick={()=>{ setTemplates(p=>p.filter(t=>t.id!==tmpl.id)); showToast("삭제됨"); }} style={{padding:"4px 10px",borderRadius:7,border:`1px solid ${C.red}30`,background:`${C.red}0A`,color:C.red,fontSize:11,cursor:"pointer"}}>삭제</button>
                  </div>
                </div>
                <p style={{fontSize:12,color:C.sub,margin:0,whiteSpace:"pre-wrap",background:C.faint,borderRadius:8,padding:"8px 10px"}}>{tmpl.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════ 모달들 ═══════════ */}

      {/* ── 학원 추가/수정 ── */}
      {showAddAcModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setShowAddAcModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,maxHeight:"93vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
              <h3 style={{margin:0,fontSize:18,fontWeight:800,color:C.text}}>{editTarget?"✏️ 학원 수정":"➕ 학원 추가"} ({CHILD_MAP[child].emoji} {child})</h3>
              <button onClick={()=>setShowAddAcModal(false)} style={{background:C.faint,border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:16}}>✕</button>
            </div>
            <label style={lbl}>학원 이름 *</label>
            <input value={newAc.name} onChange={e=>setNewAc(p=>({...p,name:e.target.value}))} placeholder="예: 수학학원" style={{...inp,marginBottom:14}}/>
            <label style={lbl}>수업 요일 *</label>
            <div style={{display:"flex",gap:5,marginBottom:14}}>
              {DAYS.map(day=>(
                <button key={day} onClick={()=>toggleDay(day)} style={{flex:1,padding:"8px 0",borderRadius:8,border:`1.5px solid ${newAc.days.includes(day)?DAY_COLORS[day]:C.faintB}`,background:newAc.days.includes(day)?DAY_COLORS[day]:C.faint,color:newAc.days.includes(day)?"#fff":C.sub,fontSize:13,fontWeight:600,cursor:"pointer"}}>{day}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              <div style={{flex:1}}><label style={lbl}>시작 시간</label><input type="time" value={newAc.time} onChange={e=>setNewAc(p=>({...p,time:e.target.value}))} style={inp}/></div>
              <div style={{flex:1}}><label style={lbl}>수업 시간(분)</label><input type="number" value={newAc.duration} onChange={e=>setNewAc(p=>({...p,duration:+e.target.value}))} style={inp}/></div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:14}}>
              <div style={{flex:1}}><label style={lbl}>월 학원비(원)</label><input type="number" value={newAc.fee} onChange={e=>setNewAc(p=>({...p,fee:+e.target.value}))} placeholder="0" style={inp}/></div>
              <div style={{flex:1}}><label style={lbl}>납부일(매월 n일)</label><input type="number" min="1" max="31" value={newAc.payDay} onChange={e=>setNewAc(p=>({...p,payDay:+e.target.value}))} style={inp}/></div>
            </div>
            <label style={lbl}>색상</label>
            <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
              {PALETTE.map(c=>(<button key={c} onClick={()=>setNewAc(p=>({...p,color:c}))} style={{width:30,height:30,borderRadius:"50%",background:c,border:"none",cursor:"pointer",boxShadow:newAc.color===c?`0 0 0 3px #fff,0 0 0 5px ${c}`:"0 2px 6px rgba(0,0,0,0.15)",transition:"box-shadow 0.2s"}}/>))}
            </div>
            <label style={lbl}>🎒 항상 챙길 준비물</label>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
              {(newAc.baseSupplies||[]).map((s,i)=>(
                <span key={i} style={{fontSize:12,padding:"4px 10px",borderRadius:20,background:`${newAc.color}18`,color:newAc.color,display:"flex",alignItems:"center",gap:4,fontWeight:600}}>
                  {s}<button onClick={()=>setNewAc(p=>({...p,baseSupplies:p.baseSupplies.filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:newAc.color,cursor:"pointer",fontSize:10,padding:0}}>✕</button>
                </span>
              ))}
            </div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              <input value={supplyInput} onChange={e=>setSupplyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addBaseSupply()} placeholder="예: 교재, 필통" style={{...inp,flex:1,width:"auto"}}/>
              <button onClick={addBaseSupply} style={{padding:"0 16px",borderRadius:10,border:"none",background:newAc.color,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>추가</button>
            </div>
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14,marginBottom:14}}>
              <p style={{fontSize:13,fontWeight:700,color:C.text,margin:"0 0 12px"}}>📋 연락처 정보 <span style={{fontSize:11,color:C.sub,fontWeight:400}}>(선택)</span></p>
              <label style={lbl}>👩‍🏫 담당 선생님</label>
              <input value={newAc.teacher} onChange={e=>setNewAc(p=>({...p,teacher:e.target.value}))} placeholder="예: 김민준 선생님" style={{...inp,marginBottom:12}}/>
              <label style={lbl}>📞 연락처</label>
              <input value={newAc.phone} onChange={e=>setNewAc(p=>({...p,phone:e.target.value}))} placeholder="예: 010-1234-5678" style={{...inp,marginBottom:12}}/>
              <label style={lbl}>📍 주소</label>
              <input value={newAc.address} onChange={e=>setNewAc(p=>({...p,address:e.target.value}))} placeholder="예: 서울시 강남구" style={{...inp,marginBottom:12}}/>
              <label style={lbl}>📝 학원 메모</label>
              <input value={newAc.memo} onChange={e=>setNewAc(p=>({...p,memo:e.target.value}))} placeholder="특이사항, 레벨 등" style={inp}/>
            </div>
            <button onClick={saveAcademy} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:`0 4px 16px ${th.main}40`}}>
              {editTarget?"수정 완료 ✓":"추가하기"}
            </button>
          </div>
        </div>
      )}

      {/* ── 학원 상세 ── */}
      {showDetailModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}} onClick={()=>setShowDetailModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:22,padding:24,width:"100%",maxWidth:390,boxShadow:"0 20px 60px rgba(0,0,0,0.18)",maxHeight:"88vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <div style={{width:46,height:46,borderRadius:14,background:`${showDetailModal.color}15`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:showDetailModal.color}}/>
              </div>
              <div style={{flex:1}}>
                <h3 style={{margin:0,fontSize:18,fontWeight:900,color:C.text}}>{showDetailModal.name}</h3>
                <p style={{margin:"2px 0 0",fontSize:12,color:C.sub}}>{showDetailModal.days.join(", ")}요일 · {showDetailModal.time} ({showDetailModal.duration}분)</p>
              </div>
            </div>
            {[
              ["💰 월 학원비",`${Number(showDetailModal.fee).toLocaleString()}원`],
              ["📆 납부일",`매월 ${showDetailModal.payDay}일`],
              ["🎒 기본 준비물",(showDetailModal.baseSupplies||[]).join(", ")||"없음"],
              ...(showDetailModal.teacher?[["👩‍🏫 선생님",showDetailModal.teacher]]:[]),
              ...(showDetailModal.address?[["📍 주소",showDetailModal.address]]:[]),
            ].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,color:C.sub,flexShrink:0}}>{k}</span>
                <span style={{fontSize:13,fontWeight:600,color:C.text,textAlign:"right",maxWidth:"58%",marginLeft:8}}>{v}</span>
              </div>
            ))}
            {showDetailModal.memo&&(
              <div style={{background:`${C.orange}0D`,borderRadius:10,padding:"10px 12px",marginTop:10,border:`1px solid ${C.orange}30`}}>
                <p style={{fontSize:11,color:C.orange,margin:"0 0 4px",fontWeight:600}}>📝 메모</p>
                <p style={{fontSize:13,color:C.text,margin:0}}>{showDetailModal.memo}</p>
              </div>
            )}
            {/* 전화 + 문자 버튼 */}
            {showDetailModal.phone&&(
              <div style={{display:"flex",gap:8,marginTop:14,padding:"12px 0",borderTop:`1px solid ${C.border}`}}>
                <a href={`tel:${showDetailModal.phone}`} style={{flex:1,padding:11,borderRadius:11,background:`${C.green}12`,border:`1px solid ${C.green}30`,color:C.green,fontSize:14,fontWeight:700,textAlign:"center",textDecoration:"none",display:"block"}}>📞 {showDetailModal.phone}</a>
                <button onClick={()=>{ setShowSmsModal(showDetailModal); setShowDetailModal(null); setSmsDraft(""); }} style={{flex:1,padding:11,borderRadius:11,border:`1px solid ${C.purple}44`,background:C.purpleL,color:C.purple,fontSize:14,fontWeight:700,cursor:"pointer"}}>💬 문자 보내기</button>
              </div>
            )}
            <div style={{display:"flex",gap:8,marginTop:showDetailModal.phone?8:14}}>
              <button onClick={()=>openEdit(showDetailModal)} style={{flex:1,padding:11,borderRadius:11,border:`1px solid ${th.main}44`,background:th.light,color:th.main,fontSize:13,fontWeight:700,cursor:"pointer"}}>✏️ 수정</button>
              <button onClick={()=>deleteAcademy(showDetailModal.id)} style={{flex:1,padding:11,borderRadius:11,border:`1px solid ${C.red}44`,background:`${C.red}0D`,color:C.red,fontSize:13,fontWeight:600,cursor:"pointer"}}>🗑 삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 날짜별 숙제/준비물 편집 ── */}
      {showDailyModal&&(()=>{
        const {academyId,date,acName,acColor,baseSupplies}=showDailyModal;
        const entry=getDailyEntry(child,academyId,date);
        const hw=entry.homeworks||[], sup=entry.supplies||[];
        const upd=(newEntry)=>setDailyEntry(child,academyId,date,newEntry);
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={()=>setShowDailyModal(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto",boxSizing:"border-box"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={{width:12,height:12,borderRadius:"50%",background:acColor}}/>
                <div style={{flex:1}}>
                  <p style={{fontWeight:800,fontSize:17,margin:0,color:C.text}}>{acName}</p>
                  <p style={{fontSize:12,color:C.sub,margin:"2px 0 0"}}>{fmt(date)} {date===TODAY?"(오늘)":""}</p>
                </div>
                <button onClick={()=>setShowDailyModal(null)} style={{background:C.faint,border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:C.sub,fontSize:14}}>✕</button>
              </div>
              {(baseSupplies||[]).length>0&&(
                <div style={{background:`${acColor}08`,borderRadius:10,padding:"8px 12px",marginBottom:14}}>
                  <p style={{fontSize:11,color:acColor,margin:"0 0 5px",fontWeight:700}}>🎒 항상 챙길 준비물</p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                    {baseSupplies.map((s,i)=><span key={i} style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:acColor,color:"#fff",fontWeight:600}}>{s}</span>)}
                  </div>
                </div>
              )}
              {/* 숙제 */}
              <p style={{fontSize:13,fontWeight:700,color:C.text,margin:"0 0 8px"}}>📝 이번 수업 숙제</p>
              {hw.length===0&&<p style={{fontSize:12,color:C.sub,marginBottom:8}}>등록된 숙제가 없어요</p>}
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>
                {hw.map(h=>(
                  <div key={h.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:h.done?`${C.green}08`:C.faint,border:`1.5px solid ${h.done?C.green+"30":C.faintB}`}}>
                    <button onClick={()=>upd({...entry,homeworks:hw.map(x=>x.id===h.id?{...x,done:!x.done}:x)})} style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${h.done?C.green:"#CCC"}`,background:h.done?C.green:"transparent",cursor:"pointer",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff",fontWeight:700}}>{h.done?"✓":""}</button>
                    <span style={{flex:1,fontSize:13,color:h.done?C.sub:C.text,textDecoration:h.done?"line-through":"none"}}>{h.text}</span>
                    <button onClick={()=>upd({...entry,homeworks:hw.filter(x=>x.id!==h.id)})} style={{background:"none",border:"none",color:"#CCC",cursor:"pointer",fontSize:15}}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8,marginBottom:18}}>
                <input value={dailyHwInput} onChange={e=>setDailyHwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(()=>{ const v=dailyHwInput.trim(); if(!v) return; upd({...entry,homeworks:[...hw,{id:Date.now(),text:v,done:false}]}); setDailyHwInput(""); })()} placeholder="숙제 입력 후 Enter" style={{...inp,flex:1,width:"auto",fontSize:13,padding:"9px 12px"}}/>
                <button onClick={()=>{ const v=dailyHwInput.trim(); if(!v) return; upd({...entry,homeworks:[...hw,{id:Date.now(),text:v,done:false}]}); setDailyHwInput(""); }} style={{padding:"0 16px",borderRadius:10,border:"none",background:acColor,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>추가</button>
              </div>
              {/* 추가 준비물 */}
              <p style={{fontSize:13,fontWeight:700,color:C.text,margin:"0 0 8px"}}>📦 이번 수업 추가 준비물</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
                {sup.map((s,i)=>(
                  <span key={i} style={{fontSize:12,padding:"5px 12px",borderRadius:20,background:`${acColor}15`,color:acColor,display:"flex",alignItems:"center",gap:5,fontWeight:600}}>
                    {s}<button onClick={()=>upd({...entry,supplies:sup.filter((_,j)=>j!==i)})} style={{background:"none",border:"none",color:acColor,cursor:"pointer",fontSize:11,padding:0}}>✕</button>
                  </span>
                ))}
                {sup.length===0&&<p style={{fontSize:12,color:C.sub,margin:0}}>추가 준비물 없음</p>}
              </div>
              <div style={{display:"flex",gap:8,marginBottom:20}}>
                <input value={dailySupInput} onChange={e=>setDailySupInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(()=>{ const v=dailySupInput.trim(); if(!v) return; upd({...entry,supplies:[...sup,v]}); setDailySupInput(""); })()} placeholder="추가 준비물 입력 후 Enter" style={{...inp,flex:1,width:"auto",fontSize:13,padding:"9px 12px"}}/>
                <button onClick={()=>{ const v=dailySupInput.trim(); if(!v) return; upd({...entry,supplies:[...sup,v]}); setDailySupInput(""); }} style={{padding:"0 16px",borderRadius:10,border:"none",background:acColor,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>추가</button>
              </div>
              <button onClick={()=>{ setShowDailyModal(null); showToast(); }} style={{width:"100%",padding:13,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>저장 & 닫기</button>
            </div>
          </div>
        );
      })()}

      {/* ── 문자 발송 ── */}
      {showSmsModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={()=>setShowSmsModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 44px",width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto",boxSizing:"border-box"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:showSmsModal.color}}/>
              <div style={{flex:1}}>
                <p style={{fontWeight:800,fontSize:16,margin:0,color:C.text}}>{showSmsModal.name} 문자 보내기</p>
                {showSmsModal.phone&&<p style={{fontSize:12,color:C.sub,margin:"2px 0 0"}}>📞 {showSmsModal.phone}</p>}
              </div>
              <button onClick={()=>setShowSmsModal(null)} style={{background:C.faint,border:"none",borderRadius:8,width:28,height:28,cursor:"pointer",color:C.sub,fontSize:14}}>✕</button>
            </div>
            <p style={{fontSize:12,color:C.sub,fontWeight:700,margin:"0 0 8px"}}>📋 템플릿 선택</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {templates.map(t=>(
                <button key={t.id} onClick={()=>applyTmpl(t,showSmsModal)} style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${C.purple}40`,background:C.purpleL,color:C.purple,fontSize:12,fontWeight:600,cursor:"pointer"}}>{t.title}</button>
              ))}
            </div>
            <label style={lbl}>✏️ 문자 내용 (직접 편집 가능)</label>
            <textarea value={smsDraft} onChange={e=>setSmsDraft(e.target.value)} placeholder={"템플릿을 선택하거나\n직접 입력하세요"} style={{...inp,height:130,resize:"none",marginBottom:14,whiteSpace:"pre-wrap"}}/>
            <div style={{display:"flex",gap:10}}>
              {showSmsModal.phone?(
                <>
                  <a href={smsLink(showSmsModal.phone, smsDraft)} style={{flex:2,padding:13,borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.purple},#9B7FFF)`,color:"#fff",fontSize:14,fontWeight:700,textAlign:"center",textDecoration:"none",display:"block",boxShadow:`0 4px 14px ${C.purple}40`}}>📲 문자 앱으로 발송</a>
                  <a href={`tel:${showSmsModal.phone}`} style={{flex:1,padding:13,borderRadius:14,border:`1.5px solid ${C.green}40`,background:`${C.green}10`,color:C.green,fontSize:14,fontWeight:700,textAlign:"center",textDecoration:"none",display:"block"}}>📞 전화</a>
                </>
              ):<p style={{fontSize:13,color:C.red,margin:0}}>⚠️ 연락처가 등록되지 않았어요</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── 템플릿 편집 ── */}
      {showTmplEdit&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:300}} onClick={()=>setShowTmplEdit(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,boxSizing:"border-box"}}>
            <h3 style={{margin:"0 0 18px",fontSize:17,fontWeight:800,color:C.text}}>{showTmplEdit==="new"?"새 템플릿 추가":"템플릿 수정"}</h3>
            <label style={lbl}>템플릿 제목</label>
            <input value={editTmpl.title} onChange={e=>setEditTmpl(p=>({...p,title:e.target.value}))} placeholder="예: 결석 안내" style={{...inp,marginBottom:14}}/>
            <label style={lbl}>문자 내용</label>
            <textarea value={editTmpl.body} onChange={e=>setEditTmpl(p=>({...p,body:e.target.value}))} placeholder={"{아이이름}, {학원명}, {날짜}, {시간} 변수 사용 가능"} style={{...inp,height:130,resize:"none",marginBottom:20}}/>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowTmplEdit(null)} style={{flex:1,padding:13,borderRadius:12,border:`1px solid ${C.border}`,background:C.faint,color:C.sub,fontSize:14,cursor:"pointer"}}>취소</button>
              <button onClick={saveTmpl} style={{flex:2,padding:13,borderRadius:12,border:"none",background:th.grad,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer"}}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 결석 추가 ── */}
      {showAbsModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setShowAbsModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,boxSizing:"border-box"}}>
            <h3 style={{margin:"0 0 18px",fontSize:18,fontWeight:800,color:C.text}}>결석 기록 추가 ({CHILD_MAP[child].emoji} {child})</h3>
            <label style={lbl}>학원 선택</label>
            <select value={newAbs.academyId} onChange={e=>setNewAbs(p=>({...p,academyId:e.target.value}))} style={{...inp,marginBottom:12}}>
              <option value="">학원을 선택하세요</option>
              {curAc.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <label style={lbl}>결석일</label>
            <input type="date" value={newAbs.date} onChange={e=>setNewAbs(p=>({...p,date:e.target.value}))} style={{...inp,marginBottom:12}}/>
            <label style={lbl}>결석 사유 (선택)</label>
            <input value={newAbs.reason} onChange={e=>setNewAbs(p=>({...p,reason:e.target.value}))} placeholder="예: 감기, 가족 행사" style={{...inp,marginBottom:12}}/>
            <label style={lbl}>보충 예정일 (선택)</label>
            <input type="date" value={newAbs.makeupDate} onChange={e=>setNewAbs(p=>({...p,makeupDate:e.target.value}))} style={{...inp,marginBottom:22}}/>
            <button onClick={addAbs} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:`linear-gradient(135deg,${C.red},#FF8FA3)`,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>기록하기</button>
          </div>
        </div>
      )}

      {/* ── 달력 날짜 메모 ── */}
      {showMemoModal&&(()=>{
        const {day,month,year}=showMemoModal;
        const dn=getDayName(year,month,day);
        const acOnDay=curAc.filter(a=>a.days.includes(dn));
        const mk=memoKey(child,year,month,day);
        const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        const absOnDay=curAbs.filter(a=>a.date===dateStr);
        return (
          <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.5)",display:"flex",alignItems:"flex-end",zIndex:200}} onClick={()=>setShowMemoModal(null)}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 48px",width:"100%",maxWidth:430,boxSizing:"border-box"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <div style={{background:th.light,borderRadius:12,padding:"8px 12px",textAlign:"center",flexShrink:0}}>
                  <p style={{fontSize:11,color:th.main,margin:0,fontWeight:700}}>{dn}요일</p>
                  <p style={{fontSize:22,fontWeight:900,margin:0,color:th.main}}>{day}</p>
                </div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:800,fontSize:15,margin:0,color:C.text}}>{CHILD_MAP[child].emoji} {child}</p>
                  {acOnDay.length>0
                    ?<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:4}}>{acOnDay.map(a=><span key={a.id} style={{fontSize:11,padding:"2px 8px",borderRadius:6,background:`${a.color}18`,color:a.color,fontWeight:600}}>{a.name} {a.time}</span>)}</div>
                    :<p style={{fontSize:12,color:C.sub,margin:"4px 0 0"}}>학원 없는 날</p>}
                </div>
              </div>
              {absOnDay.length>0&&<div style={{background:`${C.red}08`,border:`1px solid ${C.red}25`,borderRadius:10,padding:"8px 12px",marginBottom:12}}><p style={{fontSize:12,color:C.red,margin:0,fontWeight:600}}>🏥 결석: {absOnDay.map(a=>curAc.find(ac=>ac.id===Number(a.academyId))?.name).join(", ")}</p></div>}
              <label style={lbl}>📝 날짜 메모</label>
              <textarea value={dayMemos[mk]||""} onChange={e=>setDayMemos(p=>({...p,[mk]:e.target.value}))} placeholder="특이사항, 일정 변경 등..." style={{...inp,height:90,resize:"none",marginBottom:16}}/>
              <button onClick={()=>setShowMemoModal(null)} style={{width:"100%",padding:13,borderRadius:14,border:"none",background:th.grad,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer"}}>저장 & 닫기</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

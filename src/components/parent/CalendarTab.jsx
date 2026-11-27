/* ════════════════════════════════════════════════════════════════════════
   CalendarTab — 엄마용 '달력' 화면
   ────────────────────────────────────────────────────────────────────────
   App.jsx 안에 있던 달력 탭을 그대로 옮겼다 (CLAUDE.md 규칙 3 — 화면을 고칠 때
   그 화면을 조금씩 컴포넌트로 뺀다). 그리기만 하고 저장은 하지 않는다 —
   메모·결석·방학 데이터는 전부 App이 들고 있고, 여기는 받은 값을 늘어놓고
   바뀐 값을 위로 올려 보낸다. 그래서 저장 키(v6_dm / v6_abs / v6_vac)는 손대지 않는다.

   화면 흐름 (사용자 확정 2026-08-09)
     아이 선택 → [월간|주간] → 달력 → 고른 날 요약 → 고른 날 상세
     · 월간은 '그날의 특이사항', 주간은 '반복 일정 비교'로 역할을 나눈다.
     · 달력 글자 표시는 평소와 다른 일만 찍는다 — 셔틀 같은 반복 일정은 안 찍는다.
     · [2026-08-19] 그날 가는 학원은 학원 카드 색 '작은 점'으로 찍는다. 글자가 아니라
       점이라 칸이 안 복잡해지면서 한 달치 학원 요일이 한눈에 들어온다.

   props
     th, CT          : 아이 테마색 / 그 테마에 맞춘 박스색 세트
     childId, childGender, curAc, curAbs
     calDate, setCalDate, calDays          보고 있는 달과 그 달의 날짜 배열
     calSelDate, setCalSelDate             고른 날 (null이면 오늘)
     calView, setCalView                   "month" | "week"
     dayMemos, setDayMemos, memoEdit, setMemoEdit, memoDraft, setMemoDraft
     mKey, isVacationDay, getDailyEntry, getWeeklySchedule, acKindLabel, toggleMakeup
     onSms(ac)                             결석 학원에 문자 보내기
     onVacation()                          방학 기간 관리 열기
     isFeePaidOn(acId, month)              그 달 학원비를 냈는지 (달력의 납부일 표시용)
   ════════════════════════════════════════════════════════════════════════ */

import { C, FS, FW, RAD, CTRL_H, mixWhite, mixBlack, SHADOW, SUB_LABEL } from "../../data/tokens.js";

/* [사용자 확정 2026-08-11] 달력은 일요일부터 토요일 순으로 늘어놓는다.
   앱의 공용 DAYS 는 월요일부터라(학원 등록의 요일 고르기 등이 그 순서를 쓴다)
   달력에서만 쓰는 순서를 여기에 따로 둔다. */
const CAL_DAYS = ["일","월","화","수","목","금","토"];
import { TODAY, getDN, toStr, addDays, parseLocal } from "../../utils/dates.js";
import { hasClassOnDay, getShuttleText, makeupTimeText, getDayPlan, feeDueDay } from "../../data/sampleData.js";
import { getHolidayName } from "../../data/characters.js";
import { ADV_SIT_IMG } from "../../data/characters.js";
import CareIcon from "./CareIcons.jsx";
import { MarkText, MARK_COLORS } from "./CalendarMarks.jsx";
import { useState } from "react";
import MemoSheet, { memoRepeatLabel } from "./MemoSheet.jsx";

/* [사용자 확정 2026-08-17] 달력 아래 하루 상세는 홈의 학원 카드와 같은 것을 보여 주는
   자리인데 글자 크기·굵기·칩 규격이 제각각이었다 → 홈 카드 값에 맞춘다.
   보조 글자색도 홈과 같은 한 단계 진한 청회색을 쓴다 (C.sub 는 카드 위에서 흐렸다). */
const SUBD="#5F678C";

/* (2026-11-27) 왼쪽 세로선 배너(Banner)는 걷고, 알림은 메모 줄과 같은 한 줄 둥근 줄로 바꿨다 — 고른 날 상세의 '알림 줄' 참고 */
/* 배너 안 오른쪽 작은 버튼·배지 — 문자·완료로·미납이 값이 달라 들쭉날쭉했다 */
const bnChip = {flexShrink:0,fontSize:FS.tag,fontWeight:FW.semi,padding:"3px 9px",borderRadius:RAD.sm,
  border:"none",cursor:"pointer",fontFamily:"inherit",lineHeight:1.3};

export default function CalendarTab({
  th, CT, childId, childGender, curAc = [], curAbs = [],
  calDate, setCalDate, calDays = [], calSelDate, setCalSelDate,
  calView, setCalView,
  dayMemos = {}, setDayMemos, memoEdit, setMemoEdit, memoDraft, setMemoDraft,
  mKey, isVacationDay, getDailyEntry, getWeeklySchedule, acKindLabel, toggleMakeup, isFeePaidOn,
  onSms, onVacation,
  getMemosForDate, onSaveMemo, onDeleteMemo,
}) {
  /* [사용자 확정 2026-08-09] 이 화면의 핵심 흐름은 '날짜를 고른다 → 그날 일정을 본다'.
     예전엔 달력과 상세 사이에 주간 시간표가 끼어 있어 흐름이 끊겼다.
       아이 선택 → [월간|주간] → 달력 → 고른 날 요약 → 고른 날 상세
     주간 시간표는 같은 자리의 '보기 전환'으로 옮겼다 — 월간은 그날의 특이사항,
     주간은 반복 일정 비교로 역할을 나눈다. */
  const effSelDate=calSelDate||TODAY;
  /* [사용자 확정 2026-11-27] 고른 날 학원 카드는 홈 탭과 겹친다 → 접어 두고, 누르면 펼친다.
     열쇠는 '날짜:카드' — 날짜를 바꾸면 다시 모두 접힌 상태로 보인다. */
  const [calAcOpen, setCalAcOpen] = useState({});
  const [memoSheet, setMemoSheet] = useState(null);   // 메모 창 {memo: 고칠 메모 | null(새로)}
  const dnOf=(s)=>["일","월","화","수","목","금","토"][new Date(s.replace(/-/g,"/")).getDay()];
  const korDate=(s)=>{ const [,mm,dd]=s.split("-").map(Number); return `${mm}월 ${dd}일`; };
  const selInfo=(()=>{
    const d=parseLocal(effSelDate), y=d.getFullYear(), m=d.getMonth(), day=d.getDate();   // 로컬 날짜로 (new Date("YYYY-MM-DD") 는 UTC 기준이라 시간대에 따라 하루 밀릴 수 있다)
    const dn=getDN(y,m,day);
    const acList=curAc.filter(a=>hasClassOnDay(a,dn));
    const mk=mKey(childId,y,m,day);
    const absOnDay=curAbs.filter(a=>a.date===effSelDate);
    const makeupOnDay=curAbs.filter(a=>a.makeupDate===effSelDate);
    const holiday=getHolidayName(effSelDate);
    return {y,m,day,dn,acList,mk,absOnDay,makeupOnDay,holiday};
  })();
  /* [사용자 확정 2026-08-17] 아래 학원 카드와 준비물 개수는 홈·아이용 지도와 같은
     목록(getDayPlan)을 본다. 그전에는 여기만 '그날 정규 수업'으로 목록을 따로 만들어서,
     결석한 학원이 준비물을 든 채 남고 보충으로만 가는 학원은 아예 안 보였다.
     결석·보충 요약 줄(위)은 그대로 둔다 — 사유·결석일은 거기서만 볼 수 있다. */
  const dayPlan=getDayPlan(curAc,curAbs,effSelDate,selInfo.dn,
    (acId)=>isVacationDay(childId,acId,effSelDate));
  /* 고른 날 한 줄 요약 — 상세 카드를 보기 전에 하루 상황을 먼저 알려 준다 */
  const liveAc=selInfo.acList.filter(a=>!isVacationDay(childId,a.id,effSelDate));
  /* [버그 점검 2026-11-27] 아래 목록에서 결석 줄을 뺐으므로 요약의 '학원 N개'도 결석한 학원은 뺀다
     (결석은 '결석 N개'로 따로 센다). 휴원 계산(vacCnt)은 그대로 liveAc 를 쓴다. */
  const goAcCnt=liveAc.filter(a=>!selInfo.absOnDay.some(x=>String(x.academyId)===String(a.id))).length;
  /* 준비물은 '그날 실제로 가는 학원'의 것만 (사용자 확정 2026-08-17).
       · 결석 → 안 가니까 없다   · 보충 → 가니까 항상 챙길 준비물은 그대로
     같은 학원이 정규+보충으로 두 장이어도 가방은 하나라 한 번만 센다. */
  const supCnt=[...dayPlan.filter(a=>!a._absent)
    .reduce((m,a)=>m.set(String(a.id),a),new Map()).values()]
    .reduce((n,a)=>{
      const e=getDailyEntry(childId,a.id,effSelDate);
      return n+(a.baseSupplies||[]).filter(s=>!(e.hiddenBase||[]).includes(s)).length+(e.supplies||[]).length;
    },0);
  const sumParts=[];
  if(goAcCnt) sumParts.push(`학원 ${goAcCnt}개`);
  if(supCnt) sumParts.push(`준비물 ${supCnt}개`);
  if(selInfo.absOnDay.length) sumParts.push(`결석 ${selInfo.absOnDay.length}개`);
  if(selInfo.makeupOnDay.length) sumParts.push(`보충 ${selInfo.makeupOnDay.length}개`);
  const vacCnt=selInfo.acList.length-liveAc.length;
  if(vacCnt) sumParts.push(`휴원 ${vacCnt}곳`);
  /* 학원비 납부일 — 매월 같은 날이라 '평소와 다른 일'은 아니지만 놓치면 곤란해서 예외로 둔다 */
  const feeDueOnSel=curAc.filter(a=>Number(a.fee||0)>0&&feeDueDay(a,selInfo.y,selInfo.m)===selInfo.day);
  if(feeDueOnSel.length) sumParts.push(`학원비 납부일 ${feeDueOnSel.length}곳`);
  { const mc=getMemosForDate?getMemosForDate(effSelDate).length:0; if(mc) sumParts.push(`메모 ${mc}개`); }   // 메모 개수도 (2026-11-27)

  /* [사용자 확정 2026-08-10] 월 이동 화살표가 주간 보기에서는 아무 일도 하지 않았다 —
     주간은 effSelDate가 속한 주를 그리는데, 화살표는 calDate(달)만 바꿨기 때문이다.
     월간은 달 단위, 주간은 주 단위로 넘긴다. 주를 옮기면 calDate도 같이 맞춰 둬서
     월간으로 돌아갔을 때 그 달이 열린다. */
  const weekMon=(()=>{ const d=parseLocal(effSelDate); return addDays(effSelDate,-d.getDay()); })();   // 그 주의 일요일
  const weekSun=addDays(weekMon,6);                                                                    // 그 주의 토요일
  /* 주간 머리 — '11월 22~28일' (달이 바뀌면 '11/29~12/5') (사용자 확정 2026-11-27) */
  const weekTitle=(()=>{ const [,m1,d1]=weekMon.split("-").map(Number), [,m2,d2]=weekSun.split("-").map(Number); return m1===m2?`${m1}월 ${d1}~${d2}일`:`${m1}/${d1}~${m2}/${d2}`; /* 달이 바뀌는 주는 '11/29~12/5' — 360px 폰에서 '↩ 이번 주로'까지 한 줄에 */ })();
  const goWeek=(dir)=>{
    const next=addDays(weekMon,dir*7);
    setCalSelDate(next);
    const d=parseLocal(next);
    setCalDate(new Date(d.getFullYear(),d.getMonth(),1));
  };
  const goMonth=(dir)=>{ setCalDate(new Date(calDate.getFullYear(),calDate.getMonth()+dir,1)); setCalSelDate(null); };
  const isWeek=calView==="week";
  return (
    <div>
      {/* [사용자 확정 2026-11-27] 달력 전체를 '고른 날 상세'·'결석·보충'과 같은 흰 둥근 카드로 감싸고,
          머리는 한 줄 — 왼쪽 '‹ 2026년 11월 ›'(+ 다른 달이면 '↩ 이번 달로'), 오른쪽 끝 [월간|주간].
          (2026-08-10 의 두 줄 배치를 한 줄로 줄였다. 아주 좁은 폰에서 넘치면 전환 탭만 아랫줄로 내려간다) */}
      <div style={{background:"#FFFFFF",border:`1px solid ${C.border}`,borderRadius:RAD.lg,padding:"10px 10px 10px",boxShadow:SHADOW.sm}}>
      <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",columnGap:4,rowGap:6,marginBottom:8,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",flexShrink:0,minWidth:0}}>
          <button onClick={()=>isWeek?goWeek(-1):goMonth(-1)}
            className="jelly-tap" aria-label={isWeek?"이전 주":"이전 달"}
            style={{background:"none",border:"none",borderRadius:RAD.sm,width:20,height:32,fontSize:18,fontWeight:FW.semi,cursor:"pointer",color:C.sub,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0,padding:0}}>‹</button>
          <span style={{fontWeight:FW.bold,fontSize:FS.title,color:C.text,whiteSpace:"nowrap"}}>
            {isWeek?weekTitle:`${calDate.getFullYear()}년 ${calDate.getMonth()+1}월`}
          </span>
          <button onClick={()=>isWeek?goWeek(1):goMonth(1)}
            className="jelly-tap" aria-label={isWeek?"다음 주":"다음 달"}
            style={{background:"none",border:"none",borderRadius:RAD.sm,width:20,height:32,fontSize:18,fontWeight:FW.semi,cursor:"pointer",color:C.sub,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0,padding:0}}>›</button>
        </div>
        {/* [사용자 확정 2026-11-25] 돌아가기 버튼은 '↩ ○○로' 한 모양 — 주간 '↩ 이번 주로', 월간 '↩ 이번 달로' */}
        {isWeek&&!(TODAY>=weekMon&&TODAY<=weekSun)&&(
          <button onClick={()=>setCalSelDate(TODAY)} className="jelly-tap"
            style={{flexShrink:0,background:`${th.main}14`,border:`1px solid ${th.main}40`,borderRadius:RAD.sm,color:th.main,fontSize:FS.tag,fontWeight:FW.semi,padding:"3px 4px",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",letterSpacing:-0.3}}>
            ↩ 이번 주로
          </button>
        )}
        {!isWeek&&!(calDate.getFullYear()===parseLocal(TODAY).getFullYear()&&calDate.getMonth()===parseLocal(TODAY).getMonth())&&(
          <button onClick={()=>{ const t=parseLocal(TODAY); setCalDate(new Date(t.getFullYear(),t.getMonth(),1)); setCalSelDate(null); }} className="jelly-tap"
            style={{flexShrink:0,background:`${th.main}14`,border:`1px solid ${th.main}40`,borderRadius:RAD.sm,color:th.main,fontSize:FS.tag,fontWeight:FW.semi,padding:"3px 4px",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",letterSpacing:-0.3}}>
            ↩ 이번 달로
          </button>
        )}
        <div style={{display:"flex",background:CT.faint,borderRadius:RAD.md,padding:2,flexShrink:0,marginLeft:"auto"}}>
          {[{k:"month",l:"월간"},{k:"week",l:"주간"}].map(v=>(
            <button key={v.k} onClick={()=>setCalView(v.k)} className="jelly-tap" aria-pressed={calView===v.k}
              style={{border:"none",cursor:"pointer",borderRadius:RAD.sm,padding:"4px 7px",fontFamily:"inherit",
                fontSize:FS.tag,fontWeight:calView===v.k?FW.bold:FW.normal,
                background:calView===v.k?"#fff":"transparent",color:calView===v.k?th.main:C.sub,
                boxShadow:calView===v.k?"0 1px 4px rgba(90,70,60,0.14)":"none"}}>{v.l}</button>
          ))}
        </div>
      </div>

      {/* ── 월간 보기 ── */}
      {calView==="month"&&(<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",textAlign:"center",marginBottom:4}}>
        {CAL_DAYS.map((d,i)=>(
          <div key={d} style={{fontSize:FS.sub,fontWeight:FW.normal,color:i===0?"#E74C3C":i===6?"#3498DB":C.sub,padding:"4px 0"}}>{d}</div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
        {calDays.map((day,i)=>{
          if(!day) return <div key={i}/>;
          const dn=getDN(calDate.getFullYear(),calDate.getMonth(),day);
          const acList=curAc.filter(a=>hasClassOnDay(a,dn));
          const mk=mKey(childId,calDate.getFullYear(),calDate.getMonth(),day);
          const now=new Date();
          const isToday=now.getDate()===day&&now.getMonth()===calDate.getMonth()&&now.getFullYear()===calDate.getFullYear();
          const dateStr=`${calDate.getFullYear()}-${String(calDate.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const holiday=getHolidayName(dateStr);
          const isSel=effSelDate===dateStr;
          /* 달력에는 '평소와 다른 일'만 찍는다 — 매일 반복되는 학원·셔틀은 안 찍는다
             (사용자 확정: 🚌가 모든 날에 붙어 정작 결석·보충이 묻혔다). */
          /* [사용자 확정 2026-08-10] 도형 셋만 찍으니 달력에서 알 수 있는 게 너무 적었다 →
             일곱 가지를 다 되살리되, 도형 대신 '짧은 글자'로 작게 쓴다. 도형은 범례를
             봐야 뜻을 알지만 글자는 바로 읽힌다. 색은 그대로라 익숙해지면 색만 봐도 된다.
             앞에 오는 것부터 중요한 순서 — 결석·보충·완료·휴원·학원비·준비물·메모. */
          const onVac=acList.some(a=>isVacationDay(childId,a.id,dateStr));
          const marks=[];
          if(curAbs.some(a=>a.date===dateStr)) marks.push("absent");
          if(curAbs.some(a=>a.makeupDate===dateStr&&!a.makeupDone)) marks.push("makeup");
          if(curAbs.some(a=>a.makeupDate===dateStr&&a.makeupDone)) marks.push("makeupDone");
          if(onVac) marks.push("vacation");
          if(curAc.some(a=>Number(a.fee||0)>0&&feeDueDay(a,calDate.getFullYear(),calDate.getMonth())===day)) marks.push("fee");
          /* 준비물은 '평소와 다른 것'만 — 그날 따로 넣은 준비물이 있거나
             늘 챙기던 걸 뺀 날에만 찍는다. 매번 같은 기본 준비물로는 찍지 않는다. */
          if(acList.some(a=>{ if(isVacationDay(childId,a.id,dateStr)) return false;
            const e=getDailyEntry(childId,a.id,dateStr);
            return (e.supplies||[]).length>0||(e.hiddenBase||[]).length>0; })) marks.push("supply");
          // 메모 — 여러 개·반복 메모까지 (반복 날짜도 자동으로 찍힌다, 2026-11-27). 옛 한 줄 메모도 함께
          if(getMemosForDate?getMemosForDate(dateStr).length>0:(dayMemos[mk]||"").trim()) marks.push("memo");
          /* [사용자 확정 2026-08-19] 그날 가는 학원을 학원 카드 색 점으로 찍는다.
             글자 표시는 '평소와 다른 일'만 찍는 규칙 그대로고, 점은 그 아래 층이다 —
             한 달을 펼쳐 놓고 '이 아이가 어느 요일에 어디를 가는지'가 한눈에 보인다.
             목록은 홈·상세와 같은 getDayPlan 을 쓴다(결석·휴원은 빠지고 보충은 들어온다).
             같은 학원이 정규+보충으로 두 장이어도 가방은 하나라 점도 하나만 찍는다. */
          const dayAc=[...getDayPlan(curAc,curAbs,dateStr,dn,(acId)=>isVacationDay(childId,acId,dateStr))
            .filter(a=>!a._absent)
            .reduce((m,a)=>m.set(String(a.id),a),new Map()).values()];
          return (
            /* [사용자 확정 2026-08-10] 칸마다 테두리를 두르니 버튼 31개를 늘어놓은 것처럼 보였다.
               보통 날은 테두리·배경 없이, 고른 날만 옅은 배경 + 테두리. 높이 50 → 38 (−24%). */
            <div key={i} onClick={()=>setCalSelDate(dateStr)}
              style={{background:isSel?`${th.main}12`:"transparent",borderRadius:RAD.sm,padding:"3px 2px",minHeight:38,cursor:"pointer",
                border:`1px solid ${isSel?th.main+"55":"transparent"}`,
                display:"flex",flexDirection:"column",alignItems:"center",gap:1,transition:"background .15s"}}>
              {/* 오늘은 숫자만 동그라미로 감싼다 — 칸 전체를 칠하면 안의 표시가 안 보인다 (사용자 지적) */}
              <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                background:isToday?th.main:"transparent",
                fontSize:FS.sub,fontWeight:isToday||isSel?FW.bold:FW.normal,
                color:isToday?"#fff":holiday||dn==="일"?"#E74C3C":dn==="토"?"#3498DB":C.text}}>{day}</div>
              {holiday&&(
                /* 공휴일 이름만 눈금(FS) 밖의 9px — 한 칸이 44px 라 FS.tag(11.5)로는 '대체공휴일'이 잘린다 */
                <div style={{fontSize:9,color:"#E74C3C",fontWeight:FW.normal,lineHeight:1.1,maxWidth:"100%",
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{holiday}</div>
              )}
              {dayAc.length>0&&(
                /* 점은 숫자 바로 아래 한 줄 — 여섯 개까지 찍고 넘치면 아랫줄로 접힌다.
                   (한 칸이 360px 기준 약 44px 라 5.5px 점 여섯 개가 겨우 들어간다) */
                <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",alignItems:"center",
                  columnGap:3,rowGap:2,width:"100%",marginTop:1}}>
                  {dayAc.map(a=>(
                    <span key={a._key} title={a.name} aria-hidden="true"
                      style={{width:5.5,height:5.5,borderRadius:"50%",flexShrink:0,
                        background:a.color||th.main}}/>
                  ))}
                </div>
              )}
              {marks.length>0&&(
                /* 칸이 좁아 한 줄에 두 개쯤 들어간다 — 넘치면 아랫줄로 접힌다.
                   글자끼리 붙어 한 단어처럼 보이지 않게 가로 간격을 세로보다 넓게 준다. */
                <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",alignItems:"center",
                  columnGap:4,rowGap:1,width:"100%",marginTop:1}}>
                  {marks.map(k=><MarkText key={k} kind={k} size={8.5}/>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </>)}

      {/* ── 주간 보기 — 요일을 가로 7칸으로 쪼개면 글자가 두세 줄로 끊긴다.
             세로 목록으로 두면 시간과 학원을 한 줄에 읽을 수 있다 (사용자 확정). ── */}
      {calView==="week"&&(()=>{
        const weekDates={};
        CAL_DAYS.forEach((d,i)=>{ weekDates[d]=addDays(weekMon,i); });
        // getWeeklySchedule 은 월~일 순으로 주므로 달력 순서(일~토)로 다시 늘어놓는다
        const byDay={}; getWeeklySchedule(childId).forEach(r=>{ byDay[r.day]=r.items; });
        return (
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {CAL_DAYS.map(day=>{
              const items=byDay[day]||[];
              const dayDate=weekDates[day];
              const isTodayRow=dayDate===TODAY;
              /* [사용자 확정 2026-11-27] 주간에도 월간 달력의 특이사항을 함께 —
                   학원 줄 옆: 결석 · 보충/보충✓ · 휴원
                   카드 아래 칩: 학원비 · 준비물(그날만 바뀐 것) · 메모(내용 한 줄) */
              const absOn=curAbs.filter(x=>x.date===dayDate);
              const mkOn=curAbs.filter(x=>x.makeupDate===dayDate);
              const itemIds=new Set(items.map(it=>String(it.id)));
              // 정규 수업이 없는 학원의 보충은 줄을 하나 더 만든다
              const extraMk=mkOn.filter(x=>!itemIds.has(String(x.academyId))).map(x=>curAc.find(a=>String(a.id)===String(x.academyId))).filter(Boolean);
              const [yy,mm,dd]=dayDate.split("-").map(Number);
              const feeOn=curAc.filter(a=>Number(a.fee||0)>0&&feeDueDay(a,yy,mm-1)===dd);
              const supOn=items.some(a=>{ if(isVacationDay(childId,a.id,dayDate)||absOn.some(x=>String(x.academyId)===String(a.id))) return false;
                const e=getDailyEntry(childId,a.id,dayDate); return (e.supplies||[]).length>0||(e.hiddenBase||[]).length>0; });
              const memosOn=getMemosForDate?getMemosForDate(dayDate):[];
              const pill=(kind,txt,key)=>(<span key={key||kind} style={{flexShrink:0,display:"inline-flex",alignItems:"center",gap:3,fontSize:11,fontWeight:FW.semi,
                color:MARK_COLORS[kind],background:`${MARK_COLORS[kind]}14`,borderRadius:999,padding:"1px 7px",whiteSpace:"nowrap"}}>{txt}</span>);
              const acBadges=(acId)=>{
                const out=[];
                if(absOn.some(x=>String(x.academyId)===String(acId))) out.push(pill("absent","결석","ab"));
                mkOn.filter(x=>String(x.academyId)===String(acId)).forEach(x=>out.push(x.makeupDone?pill("makeupDone","보충 ✓",`m${x.id}`):pill("makeup","보충",`m${x.id}`)));
                return out;
              };
              const hasChips=feeOn.length||supOn||memosOn.length;
              return (
                <div key={day} onClick={()=>{ setCalSelDate(dayDate); setCalView("month"); }}
                  style={{background:CT.card,borderRadius:RAD.md,border:`1px solid ${isTodayRow?th.main+"55":C.border}`,
                    padding:"10px 12px",cursor:"pointer",display:"flex",gap:12,alignItems:"flex-start"}}>
                  {/* 날짜 칸 폭 — 글자 눈금을 FS.tag(11.5)로 올리면서 '8월 16일'이 두 줄로
                      접혔다. 한 줄에 들어가는 폭으로 넓힌다. */}
                  <div style={{flexShrink:0,width:58,textAlign:"center"}}>
                    <p style={{margin:0,fontSize:FS.body,fontWeight:FW.bold,color:isTodayRow?th.main:C.text}}>{day}요일</p>
                    <p style={{margin:"1px 0 0",fontSize:FS.tag,fontWeight:FW.normal,color:C.sub}}>
                      {isTodayRow?"오늘":korDate(dayDate)}
                    </p>
                  </div>
                  <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:10}}>
                    {items.length===0
                      ? <p style={{margin:0,fontSize:FS.sub,fontWeight:FW.normal,color:C.sub,opacity:0.7}}>일정 없음</p>
                      : items.map(ac=>{
                          const onVac=isVacationDay(childId,ac.id,dayDate);
                          return (
                            /* [사용자 확정 2026-08-10] 취소선이 글꼴과 겹쳐 지저분했다 →
                               줄 전체를 흐리게 하고 시간 자리에 주황 '휴원' 배지를 넣는다.

                               [2026-08-10] 한 줄에 종류와 학원 이름이 둘 다 있어 같은 뜻이 두 번
                               나왔다 → 한 칸만 남기고, 색 띠 → 시간(회색) → 이름(진한 남색·굵게,
                               남는 폭 전부) 순으로 왼쪽부터 바로 읽히게 했다.
                               [2026-08-11] 남기는 쪽을 학원 이름에서 '과목 종류'로 바꿨다(사용자 확정).
                               주간은 한 주 흐름을 훑는 화면이라 '무슨 수업인가'가 먼저다.
                               어느 학원인지는 날짜를 눌러 월간 상세에서 본다.
                               길면 두 줄로 내리지 않고 말줄임 — 카드 높이를 일정하게 둔다. */
                            <div key={ac.id} style={{display:"flex",alignItems:"center",gap:9,minWidth:0,opacity:onVac?0.55:1}}>
                              <span style={{width:3,height:15,borderRadius:RAD.pill,background:ac.color,flexShrink:0}}/>
                              <span style={{flexShrink:0,minWidth:46,display:"flex"}}>
                                {onVac
                                  ? <span style={{fontSize:FS.tag,fontWeight:FW.semi,color:"#E65100",background:"#F0A50022",borderRadius:RAD.sm,padding:"2px 7px"}}>휴원</span>
                                  : <span style={{fontSize:FS.sub,fontWeight:FW.normal,color:C.sub}}>{ac.classTime}</span>}
                              </span>
                              <span style={{flex:1,minWidth:0,fontSize:FS.body,fontWeight:FW.semi,color:C.text,
                                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{acKindLabel(ac)}</span>
                              {acBadges(ac.id)}
                            </div>
                          );
                        })}
                    {/* 정규 수업이 없는 날의 보충 */}
                    {extraMk.map(ac=>(
                      <div key={`mk${ac.id}`} style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
                        <span style={{width:3,height:15,borderRadius:RAD.pill,background:ac.color,flexShrink:0}}/>
                        <span style={{flexShrink:0,minWidth:46,fontSize:FS.sub,fontWeight:FW.bold,color:MARK_COLORS.makeup}}>보충</span>
                        <span style={{flex:1,minWidth:0,fontSize:FS.body,fontWeight:FW.semi,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{acKindLabel(ac)}</span>
                        {acBadges(ac.id)}
                      </div>
                    ))}
                    {/* 날짜 단위 알림 — 학원비 · 준비물 · 메모(내용 한 줄) */}
                    {hasChips?(
                      <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:5,marginTop:items.length||extraMk.length?-2:0,minWidth:0}}>
                        {feeOn.length>0&&pill("fee",`학원비 ${feeOn.map(a=>acKindLabel(a)).join("·")}`)}
                        {supOn&&pill("supply","준비물")}
                        {memosOn.length>0&&(
                          <span style={{flex:"1 1 120px",minWidth:0,display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:FW.semi,
                            color:"#6B7280",background:"#F3F4F6",borderRadius:999,padding:"1px 8px"}}>
                            <span style={{flexShrink:0,color:MARK_COLORS.memo}}>메모</span>
                            <span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.text,fontWeight:FW.normal}}>{memosOn[0].text.split("\n")[0]}</span>
                            {/* 여러 개면 '… 외 N건' — 숫자만 붙이면 몇 번째 메모인지 헷갈렸다 (2026-11-27) */}
                            {memosOn.length>1&&<span style={{flexShrink:0,color:"#6B7280"}}>외 {memosOn.length-1}건</span>}
                          </span>
                        )}
                      </div>
                    ):null}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      </div>{/* ── 달력 카드 끝 ── */}

      {/* ── 고른 날 상세 (월간 보기에서만 — 주간에서는 요일을 누르면 월간으로 돌아온다) ──
          [사용자 확정 2026-11-27] '결석·보충'과 같은 흰 그룹 카드 하나로, 안쪽 겹 상자를 걷었다.
            머리: 날짜 · 요일 · [오늘]  …  [＋ 메모]   /  아래 한 줄 요약
            특이사항: 메모(여러 개·반복) → 학원비 · 휴원 · 결석 배너
            목록: 학원·보충을 시간순으로 한 줄씩 (보충은 '보충 · 과목 · 결석분 · 완료 처리') */}
      {calView==="month"&&(()=>{
        const memos=getMemosForDate?getMemosForDate(effSelDate):[];
        const isTodaySel=effSelDate===TODAY;
        return (
        <div style={{marginTop:14,background:"#FFFFFF",border:`1px solid ${C.border}`,borderRadius:RAD.lg,padding:"14px 10px 10px",boxShadow:SHADOW.sm}}>
          {/* 머리 */}
          <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
            <p style={{fontSize:FS.title,fontWeight:FW.bold,margin:0,color:C.text,whiteSpace:"nowrap"}}>
              {selInfo.m+1}월 {selInfo.day}일 <span style={{fontSize:FS.body,fontWeight:FW.normal,color:C.sub}}>{selInfo.dn}요일</span>
            </p>
            {isTodaySel&&<span style={{flexShrink:0,fontSize:FS.tag,background:th.main,color:"#fff",borderRadius:RAD.sm,padding:"2px 8px",fontWeight:FW.semi}}>오늘</span>}
            <span style={{flex:1}}/>
            {!isTodaySel&&(
              <button onClick={()=>setCalSelDate(null)} className="jelly-tap"
                style={{flexShrink:0,background:`${th.main}14`,border:`1px solid ${th.main}40`,borderRadius:RAD.sm,color:th.main,fontSize:FS.tag,fontWeight:FW.semi,padding:"3px 8px",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
                ↩ 오늘로
              </button>
            )}
            <button onClick={()=>setMemoSheet({memo:null})} className="jelly-tap" aria-label="메모 추가"
              style={{flexShrink:0,display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:999,border:`1px solid ${th.main}40`,
                background:mixWhite(th.main,0.9),color:mixBlack(th.main,0.3),fontSize:FS.tag,fontWeight:FW.semi,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
              ＋ 메모
            </button>
          </div>
          {selInfo.holiday&&<span style={{display:"inline-block",marginTop:6,fontSize:FS.tag,background:`${C.red}14`,color:C.red,borderRadius:RAD.sm,padding:"2px 8px",fontWeight:FW.semi}}>{selInfo.holiday}</span>}
          <p style={{margin:"5px 0 0",fontSize:FS.sub,...SUB_LABEL}}>
            {sumParts.length?sumParts.join(" · "):"일정 없음"}
          </p>

          <div style={{marginTop:12}}>
            {/* [사용자 확정 2026-11-27] 순서: ① 학원·보충 목록 → ② 이날만 준비물 → ③ 휴원·결석·학원비 → ④ 메모 */}
            {/* 학원·보충 — 시간순 한 줄 (홈과 겹치는 내용이라 접어 두고, 누르면 펼친다) */}
            {/* 결석한 학원은 위 '결석' 알림 줄에 이미 있어 목록에서는 뺀다 (2026-11-27) */}
            {dayPlan.filter(ac=>!ac._absent).map(ac=>{
              const entry=getDailyEntry(childId,ac.id,effSelDate);
              const hw=entry.homeworks||[], todos=entry.todos||[];
              /* 결석한 날은 그 학원에 안 가므로 준비물도 없다 (사용자 확정 2026-08-17).
                 미션은 집에서 할 수 있으니 그대로 둔다 — 홈 카드와 같은 규칙이다. */
              const sup=ac._absent?[]:(entry.supplies||[]);
              const baseSup=ac._absent?[]:(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s));
              const supN=baseSup.length+sup.length;
              const totalTodoCnt=hw.length+todos.length;
              const doneCnt=hw.filter(h=>h.done).length+todos.filter(t=>t.done).length;
              const allDone=totalTodoCnt>0&&doneCnt===totalTodoCnt;
              const [h,m]=(ac._time||"00:00").split(":").map(Number);
              const tm=h*60+m+Number(ac._duration||0);
              const endT=`${String(Math.floor(tm/60)%24).padStart(2,"0")}:${String(tm%60).padStart(2,"0")}`;
              const ab=ac._makeup?curAbs.find(x=>String(x.id)===String(ac._abId)):null;
              const timeText=ac._absent?"결석":ac._makeup?"보충":`${ac._time}–${endT}`;
              const shuttleText=getShuttleText(ac,selInfo.dn);
              const openKey=`${effSelDate}:${ac._key||ac.id}`, isOpen=!!calAcOpen[openKey];
              const toggle=()=>setCalAcOpen(p=>({...p,[openKey]:!p[openKey]}));
              const badge=(txt,col)=>(<span style={{flexShrink:0,fontSize:11,fontWeight:FW.semi,whiteSpace:"nowrap",color:col,background:`${col}14`,borderRadius:RAD.sm,padding:"2px 4px"}}>{txt}</span>);
              return (
                <div key={ac._key||ac.id} style={{marginBottom:8,borderRadius:RAD.md,border:`1px solid ${isOpen?ac.color+"44":C.border}`,overflow:"hidden",display:"flex",background:"#fff"}}>
                  <div style={{width:4,background:ac.color,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    {/* 한 줄 — 시간(또는 보충·결석) · 과목 · [준비물 N] · [미션 n/m] · ⌄ */}
                    <div role="button" tabIndex={0} onClick={toggle} onKeyDown={e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); toggle(); } }}
                      aria-expanded={isOpen} aria-label={`${acKindLabel?acKindLabel(ac):ac.name} 자세히`} className="jelly-tap"
                      style={{display:"flex",alignItems:"center",gap:4,padding:"10px 4px 10px 8px",cursor:"pointer",background:isOpen?`${ac.color}0D`:"#fff",
                        touchAction:"manipulation",userSelect:"none",WebkitUserSelect:"none",minWidth:0}}>
                      <span style={{flexShrink:0,fontSize:FS.tag,fontWeight:ac._absent||ac._makeup?FW.bold:FW.normal,
                        color:ac._absent?C.red:ac._makeup?C.orange:SUBD,whiteSpace:"nowrap"}}>{timeText}</span>
                      {/* 과목 — 학원 이름은 길 수 있어 접힌 줄에는 과목 (사용자 확정 2026-11-27) */}
                      {/* 과목 이름이 다른 칸에 밀려 사라지지 않게 — 3글자까지는 꼭 보이고, 길면 말줄임 */}
                      <span style={{flex:ac._makeup?"0 1 auto":"1 1 auto",minWidth:`${Math.min(String(acKindLabel?acKindLabel(ac):ac.name).length,3)*1.05}em`,fontSize:FS.cardTitle,fontWeight:FW.bold,color:ac.color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {acKindLabel?acKindLabel(ac):ac.name}
                      </span>
                      {ac._makeup?(<>
                        {ab&&<span style={{flexShrink:0,fontSize:11,...SUB_LABEL,whiteSpace:"nowrap"}}>({Number(ab.date.slice(5,7))}/{Number(ab.date.slice(8))} 결석분)</span>}
                        <span style={{flex:1}}/>{/* '보충 피아노 (12/21 결석분)'은 왼쪽에 붙이고, 버튼·화살표는 오른쪽 끝 */}
                        {ab&&(ab.makeupStatus==="absent"
                          ? badge("✕ 불참",C.sub)
                          : <button onClick={e=>{ e.stopPropagation(); toggleMakeup(ab.id); }} className="jelly-tap"
                              aria-label={ab.makeupDone?"보충 완료 취소":"보충 완료 처리"}
                              style={{flexShrink:0,fontSize:11,fontWeight:FW.semi,whiteSpace:"nowrap",cursor:"pointer",fontFamily:"inherit",borderRadius:999,padding:"3px 7px",
                                border:ab.makeupDone?"none":`1px solid ${C.orange}66`,background:ab.makeupDone?`${C.green}18`:"#fff",color:ab.makeupDone?C.green:C.orange}}>
                              {ab.makeupDone?"✓ 완료":"완료 처리"}
                            </button>)}
                      </>):(<>
                        {supN>0&&badge(`준비물 ${supN}`,SUBD)}
                        {totalTodoCnt>0&&badge(`미션 ${doneCnt}/${totalTodoCnt}`,allDone?C.green:C.orange)}
                      </>)}
                      <span aria-hidden style={{flexShrink:0,width:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#B9B3AD",fontWeight:FW.bold,
                        transition:"transform .2s",transform:isOpen?"rotate(180deg)":"none"}}>⌄</span>
                    </div>
                    {isOpen&&(
                    <div style={{padding:"4px 12px 11px"}}>
                      {/* 펼치면 학원 이름부터 */}
                      <p style={{margin:"0 0 4px",fontSize:FS.cardTitle,fontWeight:FW.bold,color:C.text,overflowWrap:"anywhere"}}>{ac.name}</p>
                      <p style={{margin:0,fontSize:FS.body,fontWeight:FW.normal,color:ac._absent?C.red:C.text}}>
                        {ac._absent?"결석":ac._makeup?(makeupTimeText(ab||{})||"보충 시간 미정"):`${ac._time}–${endT}`}
                        {!ac._absent&&!ac._makeup&&<span style={{fontSize:FS.sub,color:SUBD,marginLeft:6}}>· {ac._duration}분</span>}
                      </p>
                      {ac._makeup&&ab&&<p style={{margin:"2px 0 0",fontSize:FS.tag,...SUB_LABEL}}>결석일 {korDate(ab.date)} {dnOf(ab.date)}요일</p>}
                      {shuttleText&&!ac._absent&&(
                        <p style={{margin:"4px 0 0",display:"flex",alignItems:"flex-start",gap:6,fontSize:FS.sub,fontWeight:FW.normal,color:SUBD,lineHeight:1.35}}>
                          <span style={{marginTop:1}}><CareIcon name="shuttle" size={13}/></span>
                          <span style={{minWidth:0,whiteSpace:"pre-wrap"}}>{shuttleText}</span>
                        </p>
                      )}
                      <div style={{margin:"6px 0 0",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{color:C.sub,display:"flex"}}><CareIcon name="bag" size={13}/></span>
                        {supN===0
                          ? <span style={{fontSize:FS.sub,fontWeight:FW.normal,padding:"3px 9px",borderRadius:RAD.pill,background:CT.faint,color:SUBD}}>없음</span>
                          : (<>
                              {baseSup.map((s,i)=><span key={`b${i}`} style={{fontSize:FS.sub,padding:"3px 9px",borderRadius:RAD.pill,background:`${ac.color}16`,color:ac.color,fontWeight:FW.normal}}>{s}</span>)}
                              {sup.map((s,i)=><span key={`d${i}`} style={{fontSize:FS.sub,padding:"3px 9px",borderRadius:RAD.pill,background:`${C.orange}14`,color:C.orange,fontWeight:FW.normal}}>{s}</span>)}
                            </>)}
                      </div>
                    </div>
                    )}
                  </div>
                </div>
              );
            })}

            {selInfo.acList.length===0&&selInfo.absOnDay.length===0&&selInfo.makeupOnDay.length===0&&(
              /* 홈 화면과 같은 규칙 — 이모지 대신 앱 캐릭터 원화 (사용자 확정 2026-08-09) */
              <div style={{textAlign:"center",padding:"6px 0 10px",color:C.sub}}>
                <img src={ADV_SIT_IMG[childGender]||ADV_SIT_IMG.boy} alt="" draggable={false}
                  style={{display:"block",height:78,width:"auto",maxWidth:"none",margin:"0 auto"}}/>
                <p style={{fontSize:FS.body,fontWeight:FW.normal,margin:"6px 0 0"}}>학원이 없는 날이에요</p>
              </div>
            )}
            {/* [사용자 확정 2026-11-27] 그날만 바뀐 준비물 — 달력 '준비물' 표시가 있는 날에만 한 줄.
                자리는 알림 줄 아래·학원 목록 바로 위, 바탕은 메모 줄과 같은 차분한 회색(라벨·아이콘만 주황).
                더한 것은 '과목 물건', 늘 챙기던 걸 그날 뺀 것은 '빼기'로. 그날 실제로 가는 학원(dayPlan)만 본다. */}
            {(()=>{
              const seen=new Set(), added=[], removed=[];
              dayPlan.filter(a=>!a._absent).forEach(a=>{
                if(seen.has(String(a.id))) return; seen.add(String(a.id));
                const e=getDailyEntry(childId,a.id,effSelDate);
                const kind=acKindLabel?acKindLabel(a):a.name;
                (e.supplies||[]).forEach(x=>added.push({kind,x}));
                (e.hiddenBase||[]).forEach(x=>removed.push({kind,x}));
              });
              if(!added.length&&!removed.length) return null;
              return (
                <div style={{marginBottom:6,display:"flex",alignItems:"flex-start",gap:8,background:"#F9FAFB",border:"1px solid #E5E7EB",
                  borderRadius:RAD.md,padding:"9px 11px"}}>
                  <span style={{color:C.orange,marginTop:2,flexShrink:0,display:"flex"}}><CareIcon name="bag" size={14}/></span>
                  <span style={{flex:1,minWidth:0,fontSize:FS.body,color:C.text,lineHeight:1.5}}>
                    <span style={{fontSize:FS.tag,fontWeight:FW.bold,color:C.orange,marginRight:6}}>{isTodaySel?"오늘만":"이날만"} 준비물</span>
                    {added.map((it,i)=>(
                      <span key={`a${i}`} style={{whiteSpace:"nowrap"}}>{i?<span style={{color:C.sub,margin:"0 4px"}}>·</span>:null}
                        <span style={{fontSize:FS.tag,...SUB_LABEL,marginRight:3}}>{it.kind}</span><b style={{fontWeight:FW.semi}}>{it.x}</b></span>
                    ))}
                    {removed.length>0&&(
                      <span style={{display:"block",marginTop:2,fontSize:FS.sub,...SUB_LABEL}}>
                        빼기 · {removed.map(it=>`${it.kind} ${it.x}`).join(" · ")}
                      </span>
                    )}
                  </span>
                </div>
              );
            })()}

            {/* 알림 줄 — [사용자 확정 2026-11-27] 메모 줄과 같은 한 줄·둥근 테두리로 통일.
                알림마다 은은한 색 배경은 그대로 두어 메모·학원과 구분한다.
                한 줄 = [아이콘 라벨] 학원 이름 … (오른쪽 상태·버튼) */}
            {(()=>{
              const rows=[];
              const Row=({k,color,bg,icon,mark,label,children,right})=>(
                <div key={k} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,background:bg,border:`1px solid ${color}33`,
                  borderRadius:RAD.md,padding:"8px 10px 8px 11px",minWidth:0}}>
                  <span style={{flexShrink:0,display:"inline-flex",alignItems:"center",gap:5,fontSize:FS.tag,fontWeight:FW.bold,color,whiteSpace:"nowrap"}}>
                    <CareIcon name={icon} size={13}/>{label}
                  </span>
                  <span style={{flex:1,minWidth:0,fontSize:FS.body,fontWeight:FW.semi,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{children}</span>
                  {right}
                </div>
              );
              /* 휴원(방학) — 한 줄에 학원 이름을 이어서 */
              const vacOnDay=selInfo.acList.filter(a=>isVacationDay(childId,a.id,effSelDate));
              if(vacOnDay.length) rows.push(Row({k:"vac",color:"#E65100",bg:"#FFF9EC",icon:"vacation",label:"휴원",
                children:vacOnDay.map(ac=>ac.name).join(" · ")}));
              /* 결석 — 기록마다 한 줄 (사유는 이름 옆에 흐리게, 오른쪽에 문자) */
              selInfo.absOnDay.forEach(ab=>{
                const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return;
                rows.push(Row({k:`abs${ab.id}`,color:C.red,bg:`${C.red}08`,icon:"absent",label:"결석",
                  children:<>{ac.name}{ab.reason&&<span style={{fontSize:FS.tag,fontWeight:FW.normal,color:C.sub}}> · {ab.reason}</span>}</>}));   /* [문자] 버튼은 뺐다 (2026-11-27) — 문자는 결석·보충 카드 ⋮ 에서 */
              });
              /* 학원비 납부일 — 학원마다 한 줄 (낸 것·안 낸 것이 다르므로) */
              feeDueOnSel.forEach(a=>{
                const paid=isFeePaidOn&&isFeePaidOn(a.id,selInfo.m+1,selInfo.y);
                rows.push(Row({k:`fee${a.id}`,color:th.main,bg:`${th.main}0A`,icon:"fee",label:"학원비",   /* ▲ 대신 지폐 선 아이콘 (2026-11-27) */
                  children:<>{a.name}<span style={{fontSize:FS.tag,fontWeight:FW.normal,color:C.sub,marginLeft:6}}>{Number(a.fee).toLocaleString()}원</span></>,
                  right:<span style={{...bnChip,cursor:"default",background:paid?`${C.green}12`:`${C.orange}12`,color:paid?C.green:C.orange}}>{paid?"납부 완료":"미납"}</span>}));
              });
              return rows.length?<div style={{marginBottom:4}}>{rows}</div>:null;
            })()}

            {/* 메모 — 있는 날만. 한 줄씩, 누르면 고치기·지우기 */}
            {memos.length>0&&(
              <div style={{marginTop:2,display:"flex",flexDirection:"column",gap:6}}>
                {memos.map(mm=>{
                  const rl=memoRepeatLabel(mm);
                  return (
                    <button key={mm.id} onClick={()=>setMemoSheet({memo:mm})} className="jelly-tap" aria-label={`메모 고치기: ${mm.text}`}
                      style={{width:"100%",display:"flex",alignItems:"flex-start",gap:8,textAlign:"left",background:"#F9FAFB",border:"1px solid #E5E7EB",
                        borderRadius:RAD.md,padding:"9px 10px 9px 11px",cursor:"pointer",fontFamily:"inherit"}}>
                      <span style={{color:C.sub,marginTop:2,flexShrink:0,display:"flex"}}><CareIcon name="memo" size={14}/></span>
                      <span style={{flex:1,minWidth:0,fontSize:FS.body,fontWeight:FW.normal,color:C.text,lineHeight:1.45}}>
                        {rl&&<span style={{display:"inline-flex",alignItems:"center",gap:3,marginRight:6,verticalAlign:"1px",fontSize:FS.tag,fontWeight:FW.semi,color:th.main,background:`${th.main}14`,borderRadius:RAD.sm,padding:"1px 6px"}}>
                          <CareIcon name="repeat" size={10}/>{({weekly:"매주",monthly:"매월",yearly:"매년"})[mm.repeat]||"반복"}</span>}
                        <span style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{mm.text}</span>
                      </span>
                      <span aria-hidden="true" style={{flexShrink:0,color:"#9CA3AF",marginTop:2,display:"flex"}}><CareIcon name="pencil" size={13}/></span>
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        </div>
        );
      })()}

      {/* 메모 추가·수정 창 (2026-11-27) */}
      {memoSheet&&(
        <MemoSheet dateStr={effSelDate} dn={selInfo.dn} memo={memoSheet.memo} th={th} CT={CT}
          onClose={()=>setMemoSheet(null)}
          onSave={(v)=>{ onSaveMemo&&onSaveMemo(effSelDate,memoSheet.memo,v); setMemoSheet(null); }}
          onDelete={(scope)=>{ onDeleteMemo&&onDeleteMemo(effSelDate,memoSheet.memo,scope); setMemoSheet(null); }}/>
      )}

      {/* 방학 전체 관리 버튼 */}
      <button onClick={onVacation}
        className="jelly-tap"
        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,width:"100%",marginTop:12,minHeight:CTRL_H,padding:"10px",borderRadius:RAD.md,border:"1px dashed #F0A50088",background:"#FFFBF0",color:"#E65100",fontSize:FS.body,fontWeight:FW.semi,cursor:"pointer",fontFamily:"inherit"}}>
        <CareIcon name="vacation" size={14}/> 방학 기간 관리
      </button>
    </div>
  );
}

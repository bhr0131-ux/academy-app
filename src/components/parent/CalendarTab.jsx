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
     · 달력에는 평소와 다른 일만 찍는다 — 매일 반복되는 학원·셔틀은 안 찍는다.

   props
     th, CT          : 아이 테마색 / 그 테마에 맞춘 박스색 세트
     childId, childGender, curAc, curAbs
     calDate, setCalDate, calDays          보고 있는 달과 그 달의 날짜 배열
     calSelDate, setCalSelDate             고른 날 (null이면 오늘)
     calView, setCalView                   "month" | "week"
     onOpenLegend()                        표시 설명 시트 열기
     dayMemos, setDayMemos, memoEdit, setMemoEdit, memoDraft, setMemoDraft
     mKey, isVacationDay, getDailyEntry, getWeeklySchedule, acKindLabel, toggleMakeup
     onSms(ac)                             결석 학원에 문자 보내기
     onVacation()                          방학 기간 관리 열기
   ════════════════════════════════════════════════════════════════════════ */

import { C, DAYS, mixWhite, SHADOW } from "../../data/tokens.js";
import { TODAY, getDN, toStr } from "../../utils/dates.js";
import { hasClassOnDay, getScheduleForDay, getShuttleText, makeupTimeText } from "../../data/sampleData.js";
import { getHolidayName } from "../../data/characters.js";
import { ADV_SIT_IMG } from "../../data/characters.js";
import CareIcon from "./CareIcons.jsx";
import { Mark } from "./CalendarMarks.jsx";

export default function CalendarTab({
  th, CT, childId, childGender, curAc = [], curAbs = [],
  calDate, setCalDate, calDays = [], calSelDate, setCalSelDate,
  calView, setCalView, onOpenLegend,
  dayMemos = {}, setDayMemos, memoEdit, setMemoEdit, memoDraft, setMemoDraft,
  mKey, isVacationDay, getDailyEntry, getWeeklySchedule, acKindLabel, toggleMakeup,
  onSms, onVacation,
}) {
  /* [사용자 확정 2026-08-09] 이 화면의 핵심 흐름은 '날짜를 고른다 → 그날 일정을 본다'.
     예전엔 달력과 상세 사이에 주간 시간표가 끼어 있어 흐름이 끊겼다.
       아이 선택 → [월간|주간] → 달력 → 고른 날 요약 → 고른 날 상세
     주간 시간표는 같은 자리의 '보기 전환'으로 옮겼다 — 월간은 그날의 특이사항,
     주간은 반복 일정 비교로 역할을 나눈다. */
  const effSelDate=calSelDate||TODAY;
  const dnOf=(s)=>["일","월","화","수","목","금","토"][new Date(s.replace(/-/g,"/")).getDay()];
  const korDate=(s)=>{ const [,mm,dd]=s.split("-").map(Number); return `${mm}월 ${dd}일`; };
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
  /* 고른 날 한 줄 요약 — 상세 카드를 보기 전에 하루 상황을 먼저 알려 준다 */
  const liveAc=selInfo.acList.filter(a=>!isVacationDay(childId,a.id,effSelDate));
  const supCnt=liveAc.reduce((n,a)=>{
    const e=getDailyEntry(childId,a.id,effSelDate);
    return n+(a.baseSupplies||[]).filter(s=>!(e.hiddenBase||[]).includes(s)).length+(e.supplies||[]).length;
  },0);
  const sumParts=[];
  if(liveAc.length) sumParts.push(`학원 ${liveAc.length}개`);
  if(supCnt) sumParts.push(`준비물 ${supCnt}개`);
  if(selInfo.absOnDay.length) sumParts.push(`결석 ${selInfo.absOnDay.length}개`);
  if(selInfo.makeupOnDay.length) sumParts.push(`보충수업 ${selInfo.makeupOnDay.length}개`);
  const vacCnt=selInfo.acList.length-liveAc.length;
  if(vacCnt) sumParts.push(`휴원 ${vacCnt}곳`);
  return (
    <div>
      {/* 보기 전환 + 월 이동 */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <div style={{display:"flex",background:CT.faint,borderRadius:11,padding:2,flexShrink:0}}>
          {[{k:"month",l:"월간"},{k:"week",l:"주간"}].map(v=>(
            <button key={v.k} onClick={()=>setCalView(v.k)} className="jelly-tap"
              style={{border:"none",cursor:"pointer",borderRadius:9,padding:"5px 12px",fontFamily:"inherit",
                fontSize:12.5,fontWeight:calView===v.k?900:700,
                background:calView===v.k?"#fff":"transparent",color:calView===v.k?th.main:C.sub,
                boxShadow:calView===v.k?"0 1px 4px rgba(90,70,60,0.14)":"none"}}>{v.l}</button>
          ))}
        </div>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
          <button onClick={()=>{ setCalDate(new Date(calDate.getFullYear(),calDate.getMonth()-1,1)); setCalSelDate(null); }}
            className="jelly-tap" aria-label="이전 달"
            style={{background:CT.card,border:`1px solid ${C.border}`,borderRadius:9,width:26,height:26,fontSize:13,cursor:"pointer",color:C.text,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>‹</button>
          <span style={{fontWeight:900,fontSize:15,color:C.text,whiteSpace:"nowrap"}}>{calDate.getFullYear()}년 {calDate.getMonth()+1}월</span>
          <button onClick={()=>{ setCalDate(new Date(calDate.getFullYear(),calDate.getMonth()+1,1)); setCalSelDate(null); }}
            className="jelly-tap" aria-label="다음 달"
            style={{background:CT.card,border:`1px solid ${C.border}`,borderRadius:9,width:26,height:26,fontSize:13,cursor:"pointer",color:C.text,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>›</button>
        </div>
        {calView==="month"&&(
          <button onClick={onOpenLegend} className="jelly-tap" aria-label="달력 표시 보기"
            style={{flexShrink:0,background:CT.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"5px 9px",fontSize:11.5,fontWeight:700,color:C.sub,cursor:"pointer",fontFamily:"inherit"}}>
            표시 보기
          </button>
        )}
      </div>

      {/* ── 월간 보기 ── */}
      {calView==="month"&&(<>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",textAlign:"center",marginBottom:4}}>
        {["월","화","수","목","금","토","일"].map((d,i)=>(
          <div key={d} style={{fontSize:12,fontWeight:700,color:i===5?"#3498DB":i===6?"#E74C3C":C.sub,padding:"4px 0"}}>{d}</div>
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
          const marks=[];
          if(curAbs.some(a=>a.date===dateStr)) marks.push("absent");
          if(curAbs.some(a=>a.makeupDate===dateStr&&!a.makeupDone)) marks.push("makeup");
          if(curAbs.some(a=>a.makeupDate===dateStr&&a.makeupDone)) marks.push("makeupDone");
          if(acList.some(a=>isVacationDay(childId,a.id,dateStr))) marks.push("vacation");
          if(acList.some(a=>(getDailyEntry(childId,a.id,dateStr).supplies||[]).length>0)) marks.push("supply");
          if(dayMemos[mk]) marks.push("memo");
          return (
            <div key={i} onClick={()=>setCalSelDate(dateStr)}
              style={{background:isSel?`${th.main}14`:CT.card,borderRadius:10,padding:"4px 3px",minHeight:50,cursor:"pointer",
                border:`1px solid ${isSel?th.main+"55":C.border}`,
                display:"flex",flexDirection:"column",alignItems:"center",gap:2,transition:"background .15s"}}>
              {/* 오늘은 숫자만 동그라미로 감싼다 — 칸 전체를 칠하면 안의 표시가 안 보인다 (사용자 지적) */}
              <div style={{width:21,height:21,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                background:isToday?th.main:"transparent",
                fontSize:12.5,fontWeight:isToday||isSel?900:600,
                color:isToday?"#fff":holiday||dn==="일"?"#E74C3C":dn==="토"?"#3498DB":C.text}}>{day}</div>
              {holiday&&(
                <div style={{fontSize:9,color:"#E74C3C",fontWeight:700,lineHeight:1.1,maxWidth:"100%",
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{holiday}</div>
              )}
              {marks.length>0&&(
                <div style={{display:"flex",alignItems:"center",gap:3,marginTop:"auto",paddingBottom:2}}>
                  {marks.slice(0,2).map(k=><Mark key={k} kind={k} size={6}/>)}
                  {marks.length>2&&<span style={{fontSize:8.5,fontWeight:800,color:C.sub}}>+{marks.length-2}</span>}
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
        const sel=new Date(effSelDate.replace(/-/g,"/"));
        const offset=(sel.getDay()+6)%7;                      // 월=0 ... 일=6
        const monday=new Date(sel); monday.setDate(sel.getDate()-offset);
        const weekDates={};
        DAYS.forEach((d,i)=>{ const wd=new Date(monday); wd.setDate(monday.getDate()+i); weekDates[d]=toStr(wd); });
        return (
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {getWeeklySchedule(childId).map(({day,items})=>{
              const dayDate=weekDates[day];
              const isTodayRow=dayDate===TODAY;
              return (
                <div key={day} onClick={()=>{ setCalSelDate(dayDate); setCalView("month"); }}
                  style={{background:CT.card,borderRadius:13,border:`1px solid ${isTodayRow?th.main+"55":C.border}`,
                    padding:"10px 12px",cursor:"pointer",display:"flex",gap:12,alignItems:"flex-start"}}>
                  <div style={{flexShrink:0,width:46,textAlign:"center"}}>
                    <p style={{margin:0,fontSize:13.5,fontWeight:900,color:isTodayRow?th.main:C.text}}>{day}요일</p>
                    <p style={{margin:"1px 0 0",fontSize:10.5,fontWeight:600,color:C.sub}}>
                      {isTodayRow?"오늘":korDate(dayDate)}
                    </p>
                  </div>
                  <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:4}}>
                    {items.length===0
                      ? <p style={{margin:0,fontSize:12.5,fontWeight:600,color:C.sub,opacity:0.7}}>일정 없음</p>
                      : items.map(ac=>{
                          const onVac=isVacationDay(childId,ac.id,dayDate);
                          return (
                            <div key={ac.id} style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                              <span style={{width:3,height:14,borderRadius:9,background:ac.color,flexShrink:0,opacity:onVac?0.4:1}}/>
                              {/* 방학은 시간 대신 '휴원'으로 묶어 쓴다 — 학교 방학과 헷갈리지 않게 (사용자 지적) */}
                              <span style={{flexShrink:0,fontSize:12.5,fontWeight:700,color:onVac?"#E65100":C.sub,minWidth:42}}>
                                {onVac?"휴원":ac.classTime}
                              </span>
                              <span style={{fontSize:13.5,fontWeight:800,color:onVac?C.sub:C.text,minWidth:0,
                                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                                textDecoration:onVac?"line-through":"none"}}>{acKindLabel(ac)}</span>
                              <span style={{marginLeft:"auto",flexShrink:0,fontSize:11,fontWeight:600,color:C.sub,opacity:0.75,
                                maxWidth:104,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ac.name}</span>
                            </div>
                          );
                        })}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* ── 고른 날 상세 (월간 보기에서만 — 주간에서는 요일을 누르면 월간으로 돌아온다) ── */}
      {calView==="month"&&(
        <div style={{marginTop:14,background:CT.card,borderRadius:14,border:`1px solid ${th.main}2A`,overflow:"hidden",boxShadow:"0 2px 8px rgba(90,70,60,0.06)"}}>
          {/* 머리 — 날짜 + 한 줄 요약. 예전엔 파랑 면적이 커서 아래 내용보다 세게 보였다. */}
          <div style={{background:mixWhite(th.main,0.90),padding:"11px 14px",borderBottom:`1px solid ${th.main}1F`}}>
            <div style={{display:"flex",alignItems:"center",gap:7,flexWrap:"wrap"}}>
              <p style={{fontSize:15.5,fontWeight:900,margin:0,color:C.text}}>
                {selInfo.m+1}월 {selInfo.day}일 <span style={{fontSize:13,fontWeight:700,color:C.sub}}>{selInfo.dn}요일</span>
              </p>
              {effSelDate===TODAY&&<span style={{fontSize:11,background:th.main,color:"#fff",borderRadius:8,padding:"2px 8px",fontWeight:800}}>오늘</span>}
              {selInfo.holiday&&<span style={{fontSize:11,background:`${C.red}14`,color:C.red,borderRadius:8,padding:"2px 8px",fontWeight:800}}>{selInfo.holiday}</span>}
              {effSelDate!==TODAY&&(
                <button onClick={()=>setCalSelDate(null)} className="jelly-tap"
                  style={{marginLeft:"auto",background:"#fff",border:`1px solid ${th.main}33`,borderRadius:8,color:th.main,fontSize:11,fontWeight:800,padding:"3px 9px",cursor:"pointer",fontFamily:"inherit"}}>
                  ↩ 오늘로
                </button>
              )}
            </div>
            <p style={{margin:"4px 0 0",fontSize:12,fontWeight:600,color:C.sub}}>
              {sumParts.length?sumParts.join(" · "):"일정 없음"}
            </p>
          </div>
          <div style={{padding:"12px 13px"}}>
            {/* 메모 — 없는 날마다 큰 빈 입력창을 띄우지 않는다 (사용자 확정).
                없으면 '＋ 메모 추가', 쓰는 중이면 입력창+저장, 있으면 내용+수정. */}
            {(()=>{
              const memo=dayMemos[selInfo.mk]||"";
              const editing=memoEdit===selInfo.mk;
              if(editing) return (
                <div style={{display:"flex",gap:7,marginBottom:12}}>
                  <input autoFocus value={memoDraft} onChange={e=>setMemoDraft(e.target.value)}
                    onKeyDown={e=>{ if(e.key==="Enter"){ setDayMemos(p=>({...p,[selInfo.mk]:memoDraft.trim()})); setMemoEdit(null); } }}
                    placeholder="이 날 기억할 일"
                    style={{flex:1,minWidth:0,background:CT.faint,border:`1px solid ${CT.faintB}`,borderRadius:10,padding:"9px 12px",fontSize:13.5,fontWeight:700,color:C.text,outline:"none",fontFamily:"inherit"}}/>
                  <button onClick={()=>{ setDayMemos(p=>({...p,[selInfo.mk]:memoDraft.trim()})); setMemoEdit(null); }} className="jelly-tap"
                    style={{flexShrink:0,padding:"0 14px",borderRadius:10,border:"none",background:th.grad,color:"#fff",fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>저장</button>
                </div>
              );
              if(memo) return (
                <div style={{display:"flex",alignItems:"flex-start",gap:9,marginBottom:12,background:CT.faint,borderRadius:11,padding:"9px 11px"}}>
                  <span style={{color:C.sub,marginTop:1}}><CareIcon name="memo" size={14}/></span>
                  <p style={{margin:0,flex:1,minWidth:0,fontSize:13,fontWeight:700,color:C.text,lineHeight:1.4,
                    display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{memo}</p>
                  <button onClick={()=>{ setMemoDraft(memo); setMemoEdit(selInfo.mk); }}
                    style={{flexShrink:0,background:"none",border:"none",color:th.main,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",textDecoration:"underline",textUnderlineOffset:3}}>수정</button>
                </div>
              );
              return (
                <button onClick={()=>{ setMemoDraft(""); setMemoEdit(selInfo.mk); }} className="jelly-tap"
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:"100%",marginBottom:12,
                    padding:"8px 10px",borderRadius:11,border:`1px dashed ${C.border}`,background:"#fff",
                    color:C.sub,fontSize:12.5,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                  <CareIcon name="memo" size={13}/> 메모 추가
                </button>
              );
            })()}

            {/* 휴원(방학) */}
            {(()=>{
              const vacOnDay=selInfo.acList.filter(a=>isVacationDay(childId,a.id,effSelDate));
              if(vacOnDay.length===0) return null;
              return (
                <div style={{background:"#FFF8E1",border:"1px solid #F0A50055",borderRadius:12,padding:"9px 11px",marginBottom:9}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,color:"#E65100",marginBottom:4}}>
                    <CareIcon name="vacation" size={14}/>
                    <span style={{fontSize:12.5,fontWeight:900}}>휴원 (방학)</span>
                  </div>
                  {vacOnDay.map(ac=>(
                    <p key={ac.id} style={{margin:"2px 0 0",fontSize:13,fontWeight:700,color:C.text}}>{ac.name} 휴원</p>
                  ))}
                </div>
              );
            })()}

            {/* 결석 */}
            {selInfo.absOnDay.length>0&&(
              <div style={{background:`${C.red}08`,border:`1px solid ${C.red}25`,borderRadius:12,padding:"9px 11px",marginBottom:9}}>
                <div style={{display:"flex",alignItems:"center",gap:7,color:C.red,marginBottom:4}}>
                  <CareIcon name="absent" size={14}/><span style={{fontSize:12.5,fontWeight:900}}>결석</span>
                </div>
                {selInfo.absOnDay.map(ab=>{
                  const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
                  return (
                    <div key={ab.id} style={{display:"flex",alignItems:"center",gap:8,marginTop:3}}>
                      <span style={{flex:1,minWidth:0,fontSize:13,fontWeight:800,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                        {ac.name}{ab.reason&&<span style={{fontSize:12,fontWeight:600,color:C.sub}}> · {ab.reason}</span>}
                      </span>
                      {ac.phone&&<button onClick={()=>onSms(ac)} className="jelly-tap"
                        style={{flexShrink:0,fontSize:11.5,padding:"4px 10px",borderRadius:9,border:`1px solid ${C.purple}30`,background:C.purpleL,color:C.purple,cursor:"pointer",fontWeight:800,fontFamily:"inherit"}}>문자</button>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 보충수업 — 날짜를 2026-08-08 대신 한국어로 (사용자 지적) */}
            {selInfo.makeupOnDay.length>0&&(
              <div style={{background:`${C.orange}08`,border:`1px solid ${C.orange}30`,borderRadius:12,padding:"9px 11px",marginBottom:9}}>
                {selInfo.makeupOnDay.map((ab,i)=>{
                  const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
                  return (
                    <div key={ab.id} style={{marginTop:i?7:0,paddingTop:i?7:0,borderTop:i?`1px solid ${C.orange}1F`:"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,color:C.orange}}>
                        <CareIcon name="makeup" size={14}/>
                        <span style={{fontSize:12.5,fontWeight:900}}>보충수업</span>
                        <span style={{fontSize:11.5,fontWeight:700,opacity:0.85}}>· {ab.makeupDone?"완료":"미완료"}</span>
                        <button onClick={()=>toggleMakeup(ab.id)} className="jelly-tap"
                          style={{marginLeft:"auto",flexShrink:0,fontSize:11.5,padding:"4px 10px",borderRadius:9,border:"none",background:ab.makeupDone?`${C.green}18`:CT.faint,color:ab.makeupDone?C.green:C.sub,cursor:"pointer",fontWeight:800,fontFamily:"inherit"}}>
                          {ab.makeupDone?"✓ 완료":"완료로"}
                        </button>
                      </div>
                      <p style={{margin:"3px 0 0",fontSize:13.5,fontWeight:800,color:C.text}}>
                        {ac.name}
                        {makeupTimeText(ab)&&<span style={{fontWeight:800,color:C.orange,marginLeft:7}}>{makeupTimeText(ab)}</span>}
                      </p>
                      <p style={{margin:"1px 0 0",fontSize:11.5,fontWeight:600,color:C.sub}}>
                        결석일 {korDate(ab.date)} {dnOf(ab.date)}요일
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {selInfo.acList.length===0&&selInfo.absOnDay.length===0&&selInfo.makeupOnDay.length===0&&(
              /* 홈 화면과 같은 규칙 — 이모지 대신 앱 캐릭터 원화 (사용자 확정 2026-08-09) */
              <div style={{textAlign:"center",padding:"6px 0 10px",color:C.sub}}>
                <img src={ADV_SIT_IMG[childGender]||ADV_SIT_IMG.boy} alt="" draggable={false}
                  style={{display:"block",height:78,width:"auto",maxWidth:"none",margin:"0 auto"}}/>
                <p style={{fontSize:13.5,fontWeight:700,margin:"6px 0 0"}}>학원이 없는 날이에요</p>
              </div>
            )}

            {/* 학원 카드 — 홈 화면과 같은 규칙(왼쪽 세로선 + 아주 연한 머리 + 흰 본문).
                준비물이 한두 개뿐인데 따로 제목 줄을 두면 카드가 두 배로 길어져서,
                가방 아이콘 옆에 한 줄로 붙인다 (사용자 확정). */}
            {selInfo.acList.filter(ac=>!isVacationDay(childId,ac.id,effSelDate)).map(ac=>{
              const entry=getDailyEntry(childId,ac.id,effSelDate);
              const hw=entry.homeworks||[], sup=entry.supplies||[], todos=entry.todos||[];
              const baseSup=(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s));
              const totalTodoCnt=hw.length+todos.length;
              const doneCnt=hw.filter(h=>h.done).length+todos.filter(t=>t.done).length;
              const allDone=totalTodoCnt>0&&doneCnt===totalTodoCnt;
              const sc=getScheduleForDay(ac,selInfo.dn);
              const [h,m]=(sc?.time||"00:00").split(":").map(Number);
              const tm=h*60+m+Number(sc?.duration||0);
              const endT=`${String(Math.floor(tm/60)%24).padStart(2,"0")}:${String(tm%60).padStart(2,"0")}`;
              const shuttleText=getShuttleText(ac,selInfo.dn);
              return (
                <div key={ac.id} style={{marginBottom:9,borderRadius:13,border:`1px solid ${ac.color}44`,overflow:"hidden",boxShadow:"0 2px 8px rgba(90,70,60,0.06)",display:"flex"}}>
                  <div style={{width:4,background:ac.color,flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0,background:"#fff"}}>
                    <div style={{background:`${ac.color}10`,padding:"9px 12px",display:"flex",alignItems:"center",gap:9}}>
                      <p style={{fontSize:14,fontWeight:800,margin:0,flex:1,minWidth:0,color:C.text,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ac.name}</p>
                      {/* 0/1만 두면 무슨 숫자인지 알 수 없다 → '미션' 을 붙인다 (사용자 지적) */}
                      {totalTodoCnt>0&&(
                        <span style={{flexShrink:0,display:"inline-flex",alignItems:"center",gap:4,fontSize:11.5,fontWeight:800,
                          color:allDone?C.green:C.orange,background:allDone?`${C.green}12`:`${C.orange}12`,borderRadius:9,padding:"3px 9px"}}>
                          <CareIcon name="mission" size={12}/>미션 {doneCnt}/{totalTodoCnt}
                        </span>
                      )}
                    </div>
                    <div style={{padding:"8px 12px 10px"}}>
                      <p style={{margin:0,fontSize:13,fontWeight:700,color:C.text}}>
                        {sc?.time}–{endT}<span style={{fontSize:11.5,fontWeight:600,color:C.sub,marginLeft:6}}>· {sc?.duration}분</span>
                      </p>
                      {shuttleText&&(
                        <p style={{margin:"4px 0 0",display:"flex",alignItems:"flex-start",gap:6,fontSize:11.5,fontWeight:600,color:C.sub,lineHeight:1.35}}>
                          <span style={{marginTop:1}}><CareIcon name="shuttle" size={13}/></span>
                          <span style={{minWidth:0,whiteSpace:"pre-wrap"}}>{shuttleText}</span>
                        </p>
                      )}
                      <div style={{margin:"5px 0 0",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                        <span style={{color:C.sub,display:"flex"}}><CareIcon name="bag" size={13}/></span>
                        {baseSup.length===0&&sup.length===0
                          ? <span style={{fontSize:11.5,fontWeight:600,color:C.sub,opacity:0.7}}>준비물 없음</span>
                          : (<>
                              {baseSup.map((s,i)=><span key={`b${i}`} style={{fontSize:11.5,padding:"2px 9px",borderRadius:20,background:`${ac.color}16`,color:ac.color,fontWeight:700}}>{s}</span>)}
                              {sup.map((s,i)=><span key={`d${i}`} style={{fontSize:11.5,padding:"2px 9px",borderRadius:20,background:`${C.orange}14`,color:C.orange,fontWeight:700}}>+{s}</span>)}
                            </>)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 방학 전체 관리 버튼 */}
      <button onClick={onVacation}
        className="jelly-tap"
        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,width:"100%",marginTop:12,padding:"10px",borderRadius:11,border:"1px dashed #F0A50088",background:"#FFFBF0",color:"#E65100",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
        <CareIcon name="vacation" size={14}/> 방학 기간 관리
      </button>
    </div>
  );
}

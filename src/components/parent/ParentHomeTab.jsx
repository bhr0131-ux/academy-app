/* ════════════════════════════════════════════════════════════════════════
   ParentHomeTab — 엄마용 '홈' 화면
   ────────────────────────────────────────────────────────────────────────
   App.jsx 안에 있던 홈 탭을 그대로 옮겼다 (CLAUDE.md 규칙 3 — 화면을 고칠 때
   그 화면을 컴포넌트로 뺀다). 그리기만 하고 저장은 하지 않는다 —
   학원·결석·미션 데이터는 전부 App이 들고 있고, 여기는 받은 값을 늘어놓고
   눌림만 위로 알린다. 그래서 저장 키(v6_ac / v6_abs / v6_daily)는 손대지 않는다.

   화면 순서 (사용자 확정 2026-08-09)
     날짜 이동 → 오늘 챙길 일 → 오늘의 학원(접힘/펼침) → 결석·보충

   props
     th, CT                : 아이 테마색 / 그 테마에 맞춘 박스색 세트
     TM                    : 아이모드 용어 세트 (탐험/베이커리에 따라 'XP' 이름이 다르다)
     childId, childGender, kidSkin, curAc, curAbs
     homeDate, setHomeDate : 보고 있는 날짜
     homeAcOpen, setHomeAcOpen : 펼친 학원 카드 {학원id:true}
     navH                  : 하단 고정바 높이 (본문 아래 여백 계산용)
     isVacationDay, getDailyEntry, getQuestItemsForDate, getChildRewardRequests,
     acKindLabel, getAcademyTheme  : App이 들고 있는 판단·조회 함수
     onGoTab(key)          : 다른 탭으로 이동 (보상 잠금 해제 포함)
     onOpenSupplyCheck() / onOpenMissionCheck()  : 오늘 챙길 일 칩
     onSms(ac)             : 학원에 문자 보내기
     onEditDaily(ac, date) : 미션·준비물 편집 팝업 열기
   ════════════════════════════════════════════════════════════════════════ */

import { C, mixWhite, mixBlack, SHADOW, DEFAULT_HOMEWORK_SCORE } from "../../data/tokens.js";
import { TODAY, addDays } from "../../utils/dates.js";
import { hasClassOnDay, getScheduleForDay, getClassTime, getShuttleText, makeupTimeText } from "../../data/sampleData.js";
import { ADV_SIT_IMG } from "../../data/characters.js";
import CareIcon from "./CareIcons.jsx";

export default function ParentHomeTab({
  th, CT, TM, childId, childGender, kidSkin, curAc = [], curAbs = [],
  homeDate, setHomeDate, homeAcOpen = {}, setHomeAcOpen, navH = 58,
  isVacationDay, getDailyEntry, getQuestItemsForDate, getChildRewardRequests,
  acKindLabel, getAcademyTheme,
  onGoTab, onOpenSupplyCheck, onOpenMissionCheck, onSms, onEditDaily,
}) {
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
  // [사용자 확정 2026-08-07] 숙제와 미션을 나누지 않고 '미완료 미션' 하나로 센다.
  const homeQuestItems=getQuestItemsForDate(childId,homeDate);
  const homePendingQuest=homeQuestItems.filter(it=>!it.done&&!it.failed).length;
  const homeSupplyCount=homeAc.reduce((n,ac)=>{
    const entry=getDailyEntry(childId,ac.id,homeDate);
    const hidden=entry.hiddenBase||[];
    const base=(ac.baseSupplies||[]).filter(s=>!hidden.includes(s)).length;
    const day=(entry.supplies||[]).length;
    return n+base+day;
  },0);
  return (
    <div>
      {/* 날짜 이동 — [사용자 확정 2026-08-09] 여기가 화면에서 제일 크고 진했는데,
          정작 먼저 봐야 하는 건 준비물과 학원 일정이다. 글자·버튼·높이를 한 단계씩 줄였다.
          (글자 17→15 · 버튼 38→30 · 아래 여백 12→8) */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
        <button onClick={()=>setHomeDate(addDays(homeDate,-1))} className="jelly-tap" aria-label="이전 날"
          style={{width:30,height:30,borderRadius:11,background:mixWhite(th.main,0.92),border:`1px solid ${th.main}33`,color:th.main,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>‹</button>
        <div style={{flex:1,textAlign:"center"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <span style={{fontSize:15,fontWeight:800,color:C.text}}>{fullLabel}</span>
            {dayTag&&<span style={{fontSize:11.5,background:th.main,color:"#fff",borderRadius:9,padding:"2px 8px",fontWeight:800,flexShrink:0}}>{dayTag}</span>}
            {!isToday&&(
              <button onClick={()=>setHomeDate(TODAY)}
                style={{background:`${th.main}14`,border:`1px solid ${th.main}40`,borderRadius:9,color:th.main,fontSize:11.5,cursor:"pointer",padding:"2px 9px",fontWeight:800,flexShrink:0}}>
                ↩ 오늘로
              </button>
            )}
          </div>
        </div>
        <button onClick={()=>setHomeDate(addDays(homeDate,1))} className="jelly-tap" aria-label="다음 날"
          style={{width:30,height:30,borderRadius:11,background:mixWhite(th.main,0.92),border:`1px solid ${th.main}33`,color:th.main,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>›</button>
      </div>

      {/* [사용자 확정 2026-08-08] 현황 카드에서 아이 이름·레벨 줄과 요약 3칸(학원·결석·
          보충수업)을 빼고, 감싸던 파스텔 카드도 없앴다. 이름·레벨은 바로 위 아이 선택
          줄에 이미 있고, 요약 3칸의 결석·보충수업은 '오늘 챙길 일' 칩과 겹쳤다.
          이제 이 자리에는 '오늘 챙길 일' 한 칸만 남는다. */}
      <div style={{marginBottom:16}}>
        {/* 오늘 챙길 일 알림 */}
        {(()=>{
          const pendingRewardCnt=getChildRewardRequests(childId).filter(r=>r.status==="pending").length;
          // 칩마다 누르면 갈 곳을 함께 둔다 (사용자 확정: 개수만 보여 주지 말고 내용까지 확인 가능하게).
          // 준비물·미션은 팝업, 보상승인·결석·보충수업은 이미 처리 화면이 있는 탭으로 보낸다.
          const alerts=[];
          if(homeSupplyCount>0) alerts.push({label:`🎒 준비물 ${homeSupplyCount}개`,color:th.main,
            go:onOpenSupplyCheck});
          if(homePendingQuest>0) alerts.push({label:`🎯 미완료 미션 ${homePendingQuest}개`,color:th.main,
            go:onOpenMissionCheck});
          if(pendingRewardCnt>0) alerts.push({label:`🎁 보상승인 ${pendingRewardCnt}개`,color:C.green,
            go:goRewardTab});
          if(absOnHome.length>0) alerts.push({label:`🏥 결석 ${absOnHome.length}개`,color:C.red,
            go:()=>onGoTab("absence")});
          if(makeupOnHome.length>0) alerts.push({label:`📚 보충수업 ${makeupOnHome.length}개`,color:C.orange,
            go:()=>onGoTab("absence")});
          /* [사용자 확정 2026-08-09] 내용 개수에 따라 카드 높이가 달라진다.
             예전엔 준비물 하나뿐인 날에도 두 줄짜리 카드가 자리를 차지해 비어 보였다.
               0개  → 한 줄 완료 배너
               1개  → 라벨과 칩이 한 줄에 나란히
               2개+ → 지금처럼 라벨 아래에 칩을 펼친다 */
          const label=dayTag?`${dayTag} 챙길 일`:"이 날 챙길 일";
          const chip=(a,i)=>(
            <button key={i} onClick={a.go} className="jelly-tap" aria-label={`${a.label} 확인`}
              style={{fontFamily:"'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif",
                fontSize:13,fontWeight:900,color:mixBlack(a.color,0.5),background:mixWhite(a.color,0.88),
                border:`1px solid ${a.color}33`,borderRadius:10,padding:"5px 10px",whiteSpace:"nowrap",
                cursor:"pointer",display:"inline-flex",alignItems:"center",gap:5}}>
              {a.label}<span style={{fontSize:10,opacity:0.65}}>›</span>
            </button>
          );
          if(alerts.length===0) return (
            <div style={{background:mixWhite(th.main,0.85),border:`1px solid ${th.main}40`,borderRadius:14,
              padding:"9px 13px",display:"flex",alignItems:"center",gap:9,boxShadow:SHADOW.sm}}>
              <span style={{fontSize:15,flexShrink:0}}>✅</span>
              <span style={{fontSize:13.5,fontWeight:800,color:mixBlack(th.main,0.45)}}>{label} 없어요!</span>
            </div>
          );
          if(alerts.length===1) return (
            <div style={{background:"#fff",border:`1px solid ${th.main}22`,borderRadius:14,
              padding:"9px 13px",display:"flex",alignItems:"center",gap:10,boxShadow:SHADOW.sm}}>
              <span style={{fontSize:12.5,fontWeight:800,color:C.sub,flexShrink:0}}>{label}</span>
              <span style={{marginLeft:"auto"}}>{chip(alerts[0],0)}</span>
            </div>
          );
          return (
            <div style={{background:"#fff",border:`1px solid ${th.main}22`,borderRadius:14,padding:"11px 13px",boxShadow:SHADOW.sm}}>
              <p style={{fontSize:12.5,fontWeight:800,margin:"0 0 7px",color:C.sub}}>{label}</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{alerts.map(chip)}</div>
            </div>
          );
        })()}

      </div>

      {/* 방학 중인 학원 표시 */}
      {vacAcToday.length>0&&(
        /* [사용자 확정 2026-08-10] 이 알림 세 칸(방학·결석·보충)만 글자가 17px이라
           카드·칩(12~15px) 사이에서 혼자 튀었다. 달력 상세 카드와 같은 크기로 맞춘다.
           제목 12.5/900 + 본문 13/700, 이모지는 선 아이콘. */
        <div style={{background:"#FFF8E1",border:"1px solid #F0A50055",borderRadius:12,padding:"9px 11px",marginBottom:9}}>
          <div style={{display:"flex",alignItems:"center",gap:7,color:"#E65100",marginBottom:5}}>
            <CareIcon name="vacation" size={14}/><span style={{fontSize:12.5,fontWeight:900}}>휴원 (방학)</span>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {vacAcToday.map(a=>(
              <span key={a.id} style={{fontSize:12.5,padding:"3px 10px",borderRadius:20,background:`${a.color}18`,color:a.color,fontWeight:700}}>{a.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* 학원 없는 날 */}
      {/* 일정이 아무것도 없는 날 — [사용자 확정 2026-08-09] 이모지(😴) 대신 앱 캐릭터로.
          기기마다 모양이 달라지지 않고 앱의 수채화 톤과도 이어진다.
          빈 영역이 너무 넓어 보이지 않게 여백도 줄였다. */}
      {homeAc.length===0&&absOnHome.length===0&&makeupOnHome.length===0&&(
        <div style={{textAlign:"center",padding:"18px 20px 20px",background:mixWhite(th.main,0.93),borderRadius:18,border:`1.5px dashed ${th.main}40`,marginBottom:14}}>
          <img src={ADV_SIT_IMG[childGender]||ADV_SIT_IMG.boy} alt="" draggable={false}
            style={{display:"block",height:88,width:"auto",maxWidth:"none",margin:"0 auto"}}/>
          <p style={{color:C.sub,fontSize:14.5,fontWeight:700,margin:"6px 0 0"}}>{dayTag||fullLabel}은 학원 일정이 없어요</p>
        </div>
      )}

      {/* 결석 표시 */}
      {absOnHome.length>0&&(
        <div style={{background:`${C.red}08`,border:`1px solid ${C.red}25`,borderRadius:12,padding:"9px 11px",marginBottom:9}}>
          <div style={{display:"flex",alignItems:"center",gap:7,color:C.red,marginBottom:4}}>
            <CareIcon name="absent" size={14}/><span style={{fontSize:12.5,fontWeight:900}}>결석</span>
          </div>
          {absOnHome.map(ab=>{
            const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
            return (
              <p key={ab.id} style={{fontSize:13,fontWeight:800,color:C.text,margin:"3px 0 0"}}>
                {ac.name}{ab.reason&&<span style={{fontSize:12,fontWeight:600,color:C.sub}}> · {ab.reason}</span>}
              </p>
            );
          })}
        </div>
      )}

      {/* 보충수업 표시 */}
      {makeupOnHome.length>0&&(
        <div style={{background:`${C.orange}08`,border:`1px solid ${C.orange}30`,borderRadius:12,padding:"9px 11px",marginBottom:9}}>
          <div style={{display:"flex",alignItems:"center",gap:7,color:C.orange,marginBottom:4}}>
            <CareIcon name="makeup" size={14}/><span style={{fontSize:12.5,fontWeight:900}}>보충수업</span>
          </div>
          {makeupOnHome.map(ab=>{
            const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
            const mt=makeupTimeText(ab);
            return (
              <div key={ab.id} style={{marginTop:3}}>
                <p style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>
                  {ac.name}{mt&&<span style={{fontWeight:800,color:C.orange,marginLeft:7}}>{mt}</span>}
                </p>
                <p style={{fontSize:11.5,fontWeight:600,color:C.sub,margin:"1px 0 0"}}>결석일 {ab.date}</p>
              </div>
            );
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
          /* [사용자 확정 2026-08-09] 카드 색을 옅게(배경 1F→12), 테두리는 한 단계 진하게(45→55),
             그림자는 약하게, 카드 간격은 14로 통일. 왼쪽 세로선만 원래 색을 유지해 구분을 준다. */
          <div key={ac.id} style={{background:CT.card,borderRadius:16,marginBottom:14,border:`1px solid ${ac.color}55`,boxShadow:"0 2px 8px rgba(90,70,60,0.07)",overflow:"hidden"}}>
            {/* [사용자 확정 2026-08-09] 접었을 땐 '종류 · 시간 범위'만.
                나머지(학원 이름·수업 시간·셔틀·준비물·미션·편집)는 펼쳐야 나온다 —
                학원이 여럿인 날 카드가 화면을 다 잡아먹어서 오늘 일정을 한눈에 못 봤다.
                요약은 "뭘 하러 몇 시에 가나"(피아노 · 08:45–09:25)만 답하면 되고,
                "어느 학원인가"(노아피아노)는 전화·셔틀을 볼 때 필요하므로 상세로 내렸다.
                시각 하나만 있으면 수업 시작인지 차량 도착인지 헷갈려서 범위로 쓴다. */}
            <button onClick={()=>setHomeAcOpen(p=>({...p,[ac.id]:!p[ac.id]}))} className="jelly-tap"
              aria-expanded={!!homeAcOpen[ac.id]} aria-label={`${ac.name} 자세히`}
              style={{width:"100%",border:"none",background:`${ac.color}12`,padding:"11px 13px",
                display:"flex",alignItems:"center",gap:11,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
              <div style={{width:4,height:34,borderRadius:10,background:ac.color,flexShrink:0}}/>
              <span style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:7,
                overflow:"hidden",whiteSpace:"nowrap"}}>
                <span style={{fontSize:15,fontWeight:900,color:C.text,minWidth:0,
                  overflow:"hidden",textOverflow:"ellipsis"}}>{acKindLabel(ac)}</span>
                <span style={{fontSize:12,color:C.sub,flexShrink:0,opacity:0.55}}>·</span>
                <span style={{fontSize:14,fontWeight:800,color:C.sub,flexShrink:0}}>{sc?.time}–{endT}</span>
              </span>
              {totalTodoCnt>0&&(
                <span style={{flexShrink:0,fontSize:12,fontWeight:900,color:allDone?C.green:C.orange}}>
                  {allDone?"✓":`${doneCnt}/${totalTodoCnt}`}
                </span>
              )}
              <span style={{flexShrink:0,fontSize:13,color:C.sub,fontWeight:900,
                transition:"transform .2s",transform:homeAcOpen[ac.id]?"rotate(180deg)":"none"}}>▼</span>
            </button>
            {homeAcOpen[ac.id]&&(
            <div style={{padding:"12px 13px"}}>
              {/* 학원 이름·수업 시간·셔틀·전화/문자 (종류와 시간 범위는 접힌 줄에 이미 있다) */}
              <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:14.5,fontWeight:900,margin:0,color:C.text,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {getAcademyTheme(ac.name,kidSkin,ac.kind).icon} {ac.name}
                  </p>
                  <p style={{fontSize:13,color:C.sub,margin:"2px 0 0",fontWeight:600}}>총 {sc?.duration}분 수업</p>
                  {(()=>{
                    const shuttleText=getShuttleText(ac,hDN);
                    if(!shuttleText) return null;
                    return (
                      <p style={{margin:"4px 0 0",display:"flex",alignItems:"flex-start",gap:6,fontSize:12,fontWeight:600,color:C.sub,lineHeight:1.35}}>
                        <span style={{marginTop:1}}><CareIcon name="shuttle" size={13}/></span>
                        <span style={{minWidth:0,whiteSpace:"pre-wrap"}}>{shuttleText}</span>
                      </p>
                    );
                  })()}
                </div>
                {/* 아이콘만 두면 무슨 버튼인지 한 번 더 생각하게 된다 → 아래에 작은 글자 (사용자 확정) */}
                <div style={{display:"flex",gap:7,flexShrink:0}}>
                  {ac.phone&&<a href={`tel:${ac.phone}`} style={{width:40,borderRadius:10,background:`${C.green}12`,border:`1px solid ${C.green}30`,color:C.green,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,padding:"5px 0",fontSize:14,textDecoration:"none"}}>
                    📞<span style={{fontSize:9.5,fontWeight:800}}>전화</span></a>}
                  {ac.phone&&<button onClick={()=>onSms(ac)} className="jelly-tap"
                    style={{width:40,borderRadius:10,background:C.purpleL,border:`1px solid ${C.purple}30`,color:C.purple,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1,padding:"5px 0",fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>
                    💬<span style={{fontSize:9.5,fontWeight:800}}>문자</span></button>}
                </div>
              </div>
              {/* 준비물 — [사용자 확정 2026-08-10] '준비물' 라벨 바로 옆에 칩을 붙인다.
                  한 줄에 다 안 들어가면 그때 다음 줄로 넘어간다(flexWrap). 아이콘은 달력과 같은 선 아이콘. */}
              <div style={{marginBottom:10,display:"flex",alignItems:"center",flexWrap:"wrap",gap:6}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:5,flexShrink:0,color:C.sub}}>
                  <CareIcon name="bag" size={14}/>
                  <span style={{fontSize:13,fontWeight:700,letterSpacing:0.3}}>준비물</span>
                </span>
                {(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s)).map((s,i)=><span key={`b${i}`} style={{fontSize:13,padding:"3px 10px",borderRadius:20,background:`${ac.color}18`,color:ac.color,fontWeight:600}}>{s}</span>)}
                {sup.map((s,i)=><span key={`d${i}`} style={{fontSize:13,padding:"3px 10px",borderRadius:20,background:`${C.orange}15`,color:C.orange,fontWeight:600}}>+{s}</span>)}
                {(ac.baseSupplies||[]).filter(s=>!(entry.hiddenBase||[]).includes(s)).length===0&&sup.length===0&&<span style={{fontSize:12.5,color:C.sub,opacity:0.7,fontWeight:600}}>없음</span>}
              </div>
              {/* 학원별 할 일 요약 */}
              <div style={{marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                  <p style={{fontSize:13,fontWeight:800,color:C.sub,margin:0,display:"flex",alignItems:"center",gap:5}}>
                    <CareIcon name="mission" size={14}/> 미션 요약
                  </p>
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
              <button onClick={()=>onEditDaily(ac,homeDate)}
                style={{width:"100%",padding:"7px 10px",borderRadius:10,border:`1.5px solid ${ac.color}66`,background:`${ac.color}14`,color:ac.color,fontSize:13,fontWeight:700,cursor:"pointer"}}>
                🎯 미션 · 준비물 편집
              </button>
            </div>
            )}
          </div>
        );
      })}

    </div>
  );
}

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
     onGoReward()          : 보상 탭으로 (PIN 확인 포함)
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
  onGoTab, onGoReward, onOpenSupplyCheck, onOpenMissionCheck, onSms, onEditDaily,
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
      {/* 날짜 이동 — [사용자 확정 2026-08-10] 좌우 큰 네모 버튼을 없애고 화살표만 남긴다.
          누르는 자리는 34px 그대로 두되 배경·테두리를 빼서 무게를 덜었다. */}
      <div style={{display:"flex",alignItems:"center",gap:2,marginBottom:10}}>
        <button onClick={()=>setHomeDate(addDays(homeDate,-1))} className="jelly-tap" aria-label="이전 날"
          style={{width:34,height:34,borderRadius:10,background:"none",border:"none",color:C.sub,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,flexShrink:0,fontFamily:"inherit"}}>‹</button>
        <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,minWidth:0}}>
          <span style={{fontSize:15,fontWeight:900,color:C.text,whiteSpace:"nowrap"}}>{fullLabel}</span>
          {dayTag&&<span style={{fontSize:11,background:th.main,color:"#fff",borderRadius:8,padding:"2px 7px",fontWeight:800,flexShrink:0}}>{dayTag}</span>}
          {!isToday&&(
            <button onClick={()=>setHomeDate(TODAY)}
              style={{background:"none",border:"none",color:th.main,fontSize:11.5,cursor:"pointer",padding:"2px 4px",fontWeight:800,flexShrink:0,fontFamily:"inherit"}}>
              ↩ 오늘로
            </button>
          )}
        </div>
        <button onClick={()=>setHomeDate(addDays(homeDate,1))} className="jelly-tap" aria-label="다음 날"
          style={{width:34,height:34,borderRadius:10,background:"none",border:"none",color:C.sub,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,flexShrink:0,fontFamily:"inherit"}}>›</button>
      </div>

      {/* [사용자 확정 2026-08-10] '오늘 할 일' 3칸 요약으로 바꿨다가 원래의
          '오늘 챙길 일' 칩 카드로 되돌린다 — 사용자 요청. 개수에 따라 높이가
          달라지는 규칙(0개 배너 / 1개 한 줄 / 2개+ 펼침)도 그대로다. */}
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
            go:onGoReward});
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
        /* [사용자 확정 2026-08-10] 알림 세 종류(휴원·결석·보충)는 학원 카드와 헷갈리지 않게
           얇은 배너로 통일한다 — 테두리 상자 대신 왼쪽 세로선 하나, 배경은 아주 옅게. */
        <div style={{display:"flex",gap:10,background:"#FFF9EC",borderRadius:10,marginBottom:8,overflow:"hidden"}}>
          <div style={{width:3,background:"#F0A500",flexShrink:0}}/>
          <div style={{flex:1,minWidth:0,padding:"8px 11px 8px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,color:"#E65100"}}>
              <CareIcon name="vacation" size={13}/><span style={{fontSize:11.5,fontWeight:900}}>휴원 (방학)</span>
            </div>
            <p style={{margin:"2px 0 0",fontSize:13,fontWeight:800,color:C.text}}>{vacAcToday.map(a=>a.name).join(" · ")}</p>
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
        <div style={{display:"flex",gap:10,background:`${C.red}08`,borderRadius:10,marginBottom:8,overflow:"hidden"}}>
          <div style={{width:3,background:C.red,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0,padding:"8px 11px 8px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,color:C.red}}>
              <CareIcon name="absent" size={13}/><span style={{fontSize:11.5,fontWeight:900}}>결석</span>
            </div>
            {absOnHome.map(ab=>{
              const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
              return (
                <p key={ab.id} style={{fontSize:13,fontWeight:800,color:C.text,margin:"2px 0 0"}}>
                  {ac.name}{ab.reason&&<span style={{fontSize:11.5,fontWeight:600,color:C.sub}}> · {ab.reason}</span>}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {/* 보충수업 표시 */}
      {makeupOnHome.length>0&&(
        /* [사용자 확정 2026-08-10] 보충수업 카드가 학원 카드만큼 커서 정규 일정으로 착각하기 쉬웠다.
           왼쪽 주황 세로선 + 두 줄짜리 얇은 배너로 줄이고, 결석일도 '8월 8일 결석분'으로 자연스럽게. */
        <div style={{display:"flex",gap:10,background:`${C.orange}0A`,borderRadius:10,marginBottom:8,overflow:"hidden"}}>
          <div style={{width:3,background:C.orange,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0,padding:"8px 11px 8px 0"}}>
          {makeupOnHome.map((ab,mi)=>{
            const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
            const mt=makeupTimeText(ab);
            const [,am,ad]=ab.date.split("-").map(Number);
            return (
              <div key={ab.id} style={{marginTop:mi?7:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,color:C.orange}}>
                  <CareIcon name="makeup" size={13}/>
                  <span style={{fontSize:11.5,fontWeight:900}}>보충수업</span>
                  <span style={{fontSize:11.5,fontWeight:800,color:C.sub,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>· {ac.name}</span>
                  {ab.makeupStatus==="absent"&&<span style={{marginLeft:"auto",flexShrink:0,fontSize:11,fontWeight:800,color:C.red}}>불참</span>}
                  {ab.makeupStatus==="done"&&<span style={{marginLeft:"auto",flexShrink:0,fontSize:11,fontWeight:800,color:C.green}}>완료</span>}
                </div>
                <p style={{fontSize:13,fontWeight:800,color:C.text,margin:"2px 0 0"}}>
                  {dayTag||`${hd.getMonth()+1}월 ${hd.getDate()}일`}{mt&&` ${mt}`}
                  <span style={{fontSize:11.5,fontWeight:600,color:C.sub,marginLeft:7}}>{am}월 {ad}일 결석분</span>
                </p>
              </div>
            );
          })}
          </div>
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
          /* [사용자 확정 2026-08-10] 학원마다 카드를 통째로 칠하면 학원이 늘수록 화면이 요란해진다.
             카드 배경은 흰색으로 통일하고, 학원 고유색은 왼쪽 세로선과 종류 글자에만 쓴다. */
          <div key={ac.id} style={{background:"#fff",borderRadius:14,marginBottom:9,border:`1px solid ${C.border}`,boxShadow:"0 2px 8px rgba(90,70,60,0.05)",overflow:"hidden",display:"flex"}}>
            <div style={{width:4,background:ac.color,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
            {/* [사용자 확정 2026-08-09] 접었을 땐 '종류 · 시간 범위'만.
                나머지(학원 이름·수업 시간·셔틀·준비물·미션·편집)는 펼쳐야 나온다 —
                학원이 여럿인 날 카드가 화면을 다 잡아먹어서 오늘 일정을 한눈에 못 봤다.
                요약은 "뭘 하러 몇 시에 가나"(피아노 · 08:45–09:25)만 답하면 되고,
                "어느 학원인가"(노아피아노)는 전화·셔틀을 볼 때 필요하므로 상세로 내렸다.
                시각 하나만 있으면 수업 시작인지 차량 도착인지 헷갈려서 범위로 쓴다. */}
            <button onClick={()=>setHomeAcOpen(p=>({...p,[ac.id]:!p[ac.id]}))} className="jelly-tap"
              aria-expanded={!!homeAcOpen[ac.id]} aria-label={`${ac.name} 자세히`}
              style={{width:"100%",border:"none",background:"transparent",padding:"11px 12px",
                display:"flex",alignItems:"center",gap:9,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>
              <span style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:7,
                overflow:"hidden",whiteSpace:"nowrap"}}>
                <span style={{fontSize:15,fontWeight:900,color:ac.color,minWidth:0,
                  overflow:"hidden",textOverflow:"ellipsis"}}>{acKindLabel(ac)}</span>
                <span style={{fontSize:14,fontWeight:700,color:C.sub,flexShrink:0}}>{sc?.time}–{endT}</span>
              </span>
              {/* [사용자 확정 2026-08-10] '✓'와 '0/1'이 섞여 기준이 달라 보였다.
                  무엇의 상태인지까지 적어 한 벌로 맞춘다. 미션이 없으면 배지 자체를 안 그린다. */}
              {totalTodoCnt>0&&(
                <span style={{flexShrink:0,fontSize:11,fontWeight:800,padding:"3px 8px",borderRadius:8,
                  background:allDone?`${C.green}14`:`${C.orange}14`,color:allDone?C.green:C.orange}}>
                  {allDone?"완료 ✓":`미션 ${doneCnt}/${totalTodoCnt}`}
                </span>
              )}
              <span style={{flexShrink:0,fontSize:12,color:"#B9B3AD",fontWeight:900,
                transition:"transform .2s",transform:homeAcOpen[ac.id]?"rotate(180deg)":"none"}}>⌄</span>
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
                {/* [사용자 확정 2026-08-10] 배경색 있는 큰 버튼이라 학원 정보보다 먼저 눈에 들어왔다.
                    같은 모양의 작은 원형 선 버튼 둘로 맞춘다 (읽어 주는 이름은 aria-label에 남긴다). */}
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  {ac.phone&&<a href={`tel:${ac.phone}`} aria-label={`${ac.name} 전화`} title="전화"
                    style={{width:30,height:30,borderRadius:"50%",border:`1px solid ${C.border}`,color:C.sub,display:"flex",alignItems:"center",justifyContent:"center",textDecoration:"none",background:"#fff"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17.5 17.5 0 0 1 4.5 5.7 2 2 0 0 1 6.5 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg></a>}
                  {ac.phone&&<button onClick={()=>onSms(ac)} className="jelly-tap" aria-label={`${ac.name} 문자`} title="문자"
                    style={{width:30,height:30,borderRadius:"50%",border:`1px solid ${C.border}`,color:C.sub,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:"#fff",fontFamily:"inherit",padding:0}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10.5H9.5L5.5 19v-3H4Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg></button>}
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
                    <CareIcon name="mission" size={14}/> 오늘 미션
                  </p>
                  {totalTodoCnt>0&&<span style={{fontSize:11.5,fontWeight:800,color:allDone?C.green:C.orange}}>{allDone?"완료 ✓":`${doneCnt}/${totalTodoCnt}`}</span>}
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
              {/* [사용자 확정 2026-08-10] 편집은 보조 기능인데 테두리·색이 강해 미션보다 도드라졌다.
                  배경·테두리를 빼고 작은 글자 버튼으로 낮춘다. */}
              <button onClick={()=>onEditDaily(ac,homeDate)}
                style={{width:"100%",padding:"6px 0 2px",border:"none",background:"none",color:C.sub,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                ✎ 준비물 · 미션 수정
              </button>
            </div>
            )}
            </div>
          </div>
        );
      })}

    </div>
  );
}

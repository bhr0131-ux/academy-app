/* ════════════════════════════════════════════════════════════════════════
   AbsenceTab — 엄마용 '결석·보충' 화면
   ────────────────────────────────────────────────────────────────────────
   App.jsx 안에 있던 결석 탭을 그대로 옮겼다 (CLAUDE.md 규칙 3 — 화면을 고칠 때
   그 화면을 조금씩 컴포넌트로 뺀다). 그리기만 하고 저장은 하지 않는다 —
   결석 기록은 전부 App이 들고 있고, 여기는 받은 값을 늘어놓고 눌림만 위로 알린다.
   그래서 저장 키(v6_abs)는 손대지 않는다.

   [사용자 확정 2026-08-17] 옮기면서 글자 크기·굵기·모서리를 전부 tokens.js 척도로
   맞췄다. 그전에는 이 화면만 숫자를 직접 박아 써서(15.5 / 12 / 11 / 10 / 13.5 /
   굵기 600 / 모서리 7·8·9·11·12·13·18) 다른 탭을 정리할 때마다 여기만 뒤처졌다.
   새 값을 쓸 일이 생기면 FS·FW·RAD 에 있는 것 중에서 고른다.

   props
     th, CT       : 아이 테마색 / 그 테마에 맞춘 박스색 세트
     curAc        : 현재 아이의 학원 목록 (결석 기록의 주인을 찾는 데 쓴다)
     absList      : 화면에 뿌릴 결석 기록 — 지워진 학원의 '주인 없는 기록'은
                    App(curAbsLive)에서 이미 걸러서 넘어온다
     absMonth     : 보고 있는 달 "YYYY-MM"        setAbsMonth
     absFilter    : "all" | "pending" | "done"   setAbsFilter
     absMenu      : ⋮ 를 연 기록 id              setAbsMenu
     absTimeEdit  : 보충 일정 수정 칸을 연 기록 id  setAbsTimeEdit
     makeupPick   : 출석 여부 메뉴를 연 기록 id     setMakeupPick
     onAdd()               : '＋ 결석 기록 추가' 팝업 열기
     onPatch(id, patch)    : 보충 일정(makeupDate/makeupStart/makeupEnd) 부분 수정
     onResult(id, "done"|"absent") : 보충 출석 결과 넣기 / 같은 값이면 되돌리기
     onDelete(id)          : 기록 삭제
     onSms(ac)             : 그 학원에 문자 보내기
   ════════════════════════════════════════════════════════════════════════ */

import { C, FS, FW, RAD, CTRL_H, mixWhite, SHADOW } from "../../data/tokens.js";
import { TODAY } from "../../utils/dates.js";
import { makeupTimeText } from "../../data/sampleData.js";
import CareIcon from "./CareIcons.jsx";
import TimeField from "./TimeField.jsx";

/* 상태 색 — 한 상태에 색은 하나. 배지와 '보충 출석 여부' 버튼이 똑같은 값을 쓴다.
   [사용자 확정 2026-08-10]
    · '불참'만 쓰면 원래 수업에 안 간 건지 보충에도 안 온 건지 헷갈린다 → '보충 불참'.
    · '일정 미정'은 배지 회색 / 버튼 주황으로 갈라 뒀는데 같은 상태인데 색이 다르다는
      지적을 받았다. 회색은 못 누르는 버튼처럼 보이고 주황은 '보충 예정'과 겹치므로,
      둘 다 남색기 도는 회청색 하나로 맞춘다. */
const AB_PINK  = "#E85B9C";   // 보충 불참
const AB_SLATE = "#6E7BA6";   // 일정 미정
const AB_MID   = "#6B7392";   // 본문 중간 톤 — C.text(진함)와 C.sub(연함) 사이
const AB_QUIET = "#C3C9DC";   // 끝난 건의 학원색 막대 — 색을 걷고 회색조로

export default function AbsenceTab({
  th, CT, curAc = [], absList = [],
  absMonth, setAbsMonth, absFilter, setAbsFilter,
  absMenu, setAbsMenu, absTimeEdit, setAbsTimeEdit, makeupPick, setMakeupPick,
  onAdd, onPatch, onResult, onDelete, onSms,
}) {
  const inMonth=(a)=>(a.date||"").slice(0,7)===absMonth;                       // 이번 달에 결석한 건
  /* 이월 규칙: 지난달 이전 결석 중 미처리(출석/불참 안 누름)인 것만.
      - 보충일정 있으면 → 그 보충일이 속한 달까지만 이월(보충월 ≥ 현재 보는 달)
      - 보충일정 미정이면 → 출석/불참 누를 때까지 항상 이월 */
  const isCarry=(a)=>{
    if((a.date||"").slice(0,7)>=absMonth) return false;   // 이번 달 이후 결석은 이월 대상 아님
    if(a.makeupDone) return false;                         // 이미 처리(출석/불참)된 건 제외
    if(a.makeupDate) return a.makeupDate.slice(0,7)>=absMonth; // 보충월이 현재 달 이상일 때만 따라옴
    return true;                                           // 보충 미정 → 항상 이월
  };
  const thisMonthAbs=absList.filter(inMonth);                                   // 이번 달 결석
  const carryAbs=absList.filter(isCarry);                                       // 이월된 미처리 건
  const visibleAbs=[...carryAbs,...thisMonthAbs];                               // 화면에 보이는 전체(이월이 위)
  const totalCnt=visibleAbs.length;                                             // 전체 = 이번달 + 이월
  const pendingCnt=visibleAbs.filter(a=>!a.makeupDone).length;                  // 보충 예정 = 아직 출석/불참 안 누른 건
  const doneCnt=visibleAbs.filter(a=>a.makeupDone).length;                      // 보충 완료 = 출석·불참 처리된 건(합산)
  const [ay,am]=absMonth.split("-").map(Number);
  const shiftMonth=(delta)=>{ const d=new Date(ay,am-1+delta,1); setAbsMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); };
  /* [사용자 확정 2026-08-10] 화면에 쓰는 날짜는 '8월 8일'로 짧게.
     연도가 다르면 그때만 '2025. 12. 8.' 처럼 붙인다. */
  const korD=(s)=>{
    if(!s) return "";
    const [yy,mm,dd]=String(s).split("-").map(Number);
    return yy===ay?`${mm}월 ${dd}일`:`${yy}. ${mm}. ${dd}.`;
  };
  /* 상태 한 벌 — '미완료' 하나로 묶으면 '날짜가 잡힌 건'과 '아직 안 잡힌 건'이
     구분되지 않는다는 지적. 넷으로 나눈다. */
  const absState=(ab)=>{
    if(ab.makeupStatus==="absent") return {k:"absent",label:"보충 불참",color:AB_PINK};
    if(ab.makeupDone)              return {k:"done",  label:"보충 완료",color:C.green};
    if(!ab.makeupDate)             return {k:"none",  label:"일정 미정",color:AB_SLATE};
    if(ab.makeupDate<TODAY)        return {k:"late",  label:"일정 지남",color:C.red};
    return {k:"plan",label:"보충 예정",color:C.orange};
  };
  // 정렬: 이월 건 먼저(결석일 최신순) → 이번 달 건(결석일 최신순)
  const sortedAll=[
    ...carryAbs.slice().sort((a,b)=>b.date.localeCompare(a.date)),
    ...thisMonthAbs.slice().sort((a,b)=>b.date.localeCompare(a.date)),
  ];
  // 요약 칸을 누르면 그 상태만 걸러 본다 (사용자 확정)
  const sortedAbs=absFilter==="pending"?sortedAll.filter(a=>!a.makeupDone)
                :absFilter==="done"   ?sortedAll.filter(a=>a.makeupDone)
                :sortedAll;
  /* [사용자 확정 2026-08-17] '전체'로 보면 끝난 것과 안 끝난 것이 뒤섞여 있어
     '내가 아직 뭘 해야 하나'가 한눈에 안 잡혔다(사용자 제보) → 위아래로 나눈다.
     '보충 예정'·'보충 완료'만 걸러 볼 때는 이미 한 종류뿐이라 머리글을 안 붙인다. */
  const pendingList=sortedAbs.filter(a=>!a.makeupDone);
  const doneList=sortedAbs.filter(a=>a.makeupDone);
  const groups=(absFilter==="all"&&pendingList.length>0&&doneList.length>0)
    ? [{key:"pending",head:`아직 안 끝난 것 ${pendingList.length}건`,items:pendingList},
       {key:"done",   head:`끝난 것 ${doneList.length}건`,          items:doneList}]
    : [{key:"one",head:null,items:sortedAbs}];

  /* 보충 일정 수정 칸의 입력 세 개는 한 벌이다 — 날짜칸만 크고 시간칸만 작아서
     줄마다 단이 어긋나 보였다(사용자 점검). 높이는 padding 대신 CTRL_H 기준으로
     못 박는다 — 글자 크기를 바꿔도 다시 틀어지지 않는다. */
  const editInp={ width:"100%",minWidth:0,boxSizing:"border-box",background:"#fff",
    border:`1px solid ${CT.faintB}`,borderRadius:RAD.sm,padding:"0 9px",minHeight:CTRL_H-6,
    fontSize:FS.sub,fontWeight:FW.normal,color:C.text,outline:"none",fontFamily:"inherit" };
  const editLbl={ display:"block",fontSize:FS.tag,fontWeight:FW.normal,color:C.sub,marginBottom:4 };
  const menuItem={ width:"100%",border:"none",background:"none",padding:"11px 13px",textAlign:"left",
    fontSize:FS.body,fontWeight:FW.semi,cursor:"pointer",fontFamily:"inherit",
    display:"flex",alignItems:"center",gap:8 };

  return (
  <div>
    {/* 월 네비게이션 — 홈·달력·학원비와 같은 치수 (사용자 확정 2026-08-17) */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2,marginBottom:12}}>
      <button onClick={()=>shiftMonth(-1)} className="jelly-tap" aria-label="이전 달"
        style={{background:"none",border:"none",borderRadius:RAD.sm,width:34,height:34,fontSize:18,fontWeight:FW.semi,cursor:"pointer",color:C.sub,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>‹</button>
      <span style={{fontWeight:FW.bold,fontSize:FS.title,color:C.text,whiteSpace:"nowrap"}}>{ay}년 {am}월 결석</span>
      <button onClick={()=>shiftMonth(1)} className="jelly-tap" aria-label="다음 달"
        style={{background:"none",border:"none",borderRadius:RAD.sm,width:34,height:34,fontSize:18,fontWeight:FW.semi,cursor:"pointer",color:C.sub,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>›</button>
    </div>

    {/* 요약 3칸 — 높이를 줄이고, 누르면 그 상태만 걸러 본다 (사용자 확정 2026-08-10).
        숫자는 학원비 탭 요약과 같은 크기로 (사용자 확정 2026-08-17). */}
    <div style={{display:"flex",gap:7,marginBottom:14}}>
      {[{k:"all",l:"전체",v:totalCnt,c:C.red},{k:"pending",l:"보충 예정",v:pendingCnt,c:C.orange},{k:"done",l:"보충 완료",v:doneCnt,c:C.green}].map(s=>{
        const on=absFilter===s.k;
        return (
          <button key={s.k} onClick={()=>setAbsFilter(on?"all":s.k)} className="jelly-tap"
            aria-pressed={on} aria-label={`${s.l} ${s.v}건 보기`}
            style={{flex:1,minWidth:0,background:on?`${s.c}12`:CT.card,borderRadius:RAD.md,padding:"8px 6px",textAlign:"center",
              border:`1px solid ${on?s.c+"55":s.c+"26"}`,cursor:"pointer",fontFamily:"inherit",
              boxShadow:on?"none":SHADOW.sm}}>
            <p style={{fontSize:FS.tag,color:C.sub,margin:0,fontWeight:FW.normal}}>{s.l}</p>
            <p style={{fontSize:FS.title,fontWeight:FW.bold,margin:"1px 0 0",color:s.c}}>{s.v}</p>
          </button>
        );
      })}
    </div>
    <button onClick={onAdd} className="jelly-tap"
      style={{width:"100%",padding:"9px",borderRadius:RAD.sm,border:`1px dashed ${C.red}40`,background:`${C.red}06`,color:C.red,fontSize:FS.body,fontWeight:FW.semi,cursor:"pointer",marginBottom:14,fontFamily:"inherit"}}>
      ＋ 결석 기록 추가
    </button>

    {/* 카드 — [사용자 확정 2026-08-10] 카드 안에 또 큰 박스가 들어가는 이중 구조를
        없애고 한 덩어리로 폈다. 한 화면에 1.5건만 보이던 것이 3건 이상 보인다. */}
    {groups.map((g,gi)=>(
    <div key={g.key} style={{marginTop:gi?6:0}}>
    {g.head&&(
      <div style={{display:"flex",alignItems:"center",gap:8,margin:"0 0 10px"}}>
        <span style={{fontSize:FS.sub,fontWeight:FW.semi,color:C.sub,flexShrink:0}}>{g.head}</span>
        <div style={{flex:1,height:1,background:C.border}}/>
      </div>
    )}
    {g.items.map(ab=>{
      const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
      const st=absState(ab);
      const carried=isCarry(ab);
      const mt=makeupTimeText(ab);
      /* [사용자 확정 2026-08-17] "너무 알록달록해서 헷갈려" — 한 화면에 학원색·상태색이
         카드마다 두세 개씩 겹쳐 있었다. 끝난 건은 더 할 일이 없으니 색을 걷는다.
         그러면 화면에 남는 색은 '아직 할 일'뿐이라 눈이 거기로 먼저 간다.
         '보충 불참'만 배지 글자를 원래 색으로 남긴다 — 결과가 나쁜 건은 조용해지면 안 된다.

         왼쪽 막대도 학원색이 아니라 상태색을 쓴다. 이 화면에서는 학원 이름이 막대 바로
         옆에 큰 글씨로 있어 색으로 또 말할 필요가 없는데, 그 색이 상태색과 나란히 놓여
         카드마다 색이 둘씩 됐다. 막대·배지·버튼이 한 색이면 카드 하나가 한 덩어리로 읽힌다.
         (홈·학원비 카드는 학원을 고르는 자리라 거기서는 학원색을 그대로 쓴다.) */
      const quiet=!!ab.makeupDone;
      const badgeC=quiet?(st.k==="absent"?AB_PINK:C.sub):st.color;
      const badgeBg=quiet?(st.k==="absent"?`${AB_PINK}12`:CT.faint):`${st.color}14`;
      return (
        /* [사용자 확정 2026-08-17] 왼쪽 학원색 막대의 둥근 모서리가 반대(오른쪽)로
           들어가 있었다 — 카드 왼쪽 끝에 붙는 막대라 카드 모서리를 따라 왼쪽이
           둥글어야 한다. 홈·학원비 카드와 같은 모양으로 맞춘다.
           카드에 overflow:hidden 을 걸면 아래 ⋮ 메뉴(absolute)까지 잘리므로,
           막대 자신이 왼쪽 두 모서리만 갖는다.
           위아래 여백은 카드가 아니라 오른쪽 내용 칸이 갖는다 — 카드가 여백을 가지면
           막대가 그 안에 갇혀 위아래로 11px씩 짧아진다. */
        <div key={ab.id} style={{position:"relative",background:"#fff",borderRadius:RAD.md,marginBottom:14,border:`1px solid ${C.border}`,boxShadow:SHADOW.sm,display:"flex",gap:11}}>
          <div style={{width:4,borderRadius:`${RAD.md}px 0 0 ${RAD.md}px`,background:quiet?AB_QUIET:st.color,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0,padding:"11px 12px 11px 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <p style={{fontWeight:FW.semi,fontSize:FS.title,margin:0,color:C.text,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ac.name}</p>
              {carried&&<span style={{flexShrink:0,fontSize:FS.tag,fontWeight:FW.semi,color:C.orange,background:`${C.orange}14`,borderRadius:RAD.sm,padding:"1px 6px"}}>이월</span>}
              <span style={{marginLeft:"auto",flexShrink:0,fontSize:FS.tag,fontWeight:FW.semi,padding:"3px 9px",borderRadius:RAD.sm,background:badgeBg,color:badgeC}}>{st.label}</span>
              {/* ✕ 는 '닫기'로도 읽혀서 ⋮ 메뉴로 바꿨다 (사용자 지적) */}
              <button onClick={()=>setAbsMenu(m=>m===ab.id?null:ab.id)} className="jelly-tap"
                aria-label={`${ac.name} 결석 기록 더보기`} aria-expanded={absMenu===ab.id}
                style={{flexShrink:0,width:24,height:24,borderRadius:RAD.sm,border:"none",background:"none",color:C.sub,fontSize:FS.title,fontWeight:FW.bold,cursor:"pointer",fontFamily:"inherit",lineHeight:1,padding:0}}>⋮</button>
            </div>
            {/* [사용자 확정 2026-08-10] 학원명·날짜·상태가 다 비슷한 힘으로 보인다는 지적.
                이 앱 글꼴은 굵기가 하나뿐(Bold)이라 fontWeight 로는 위계가 안 생긴다 →
                앞말('결석'·'보충')은 연하게, 실제 값(날짜·시간)만 진하게 해서 색으로 나눈다.
                [사용자 확정 2026-08-17] 나란한 두 줄이 12 / 12.5 로 달랐다 → 하나로. */}
            <p style={{fontSize:FS.sub,color:C.sub,margin:"4px 0 0",fontWeight:FW.normal}}>
              결석 <span style={{color:AB_MID}}>{korD(ab.date)}</span>{ab.reason&&` · ${ab.reason}`}
            </p>
            <p style={{fontSize:FS.sub,color:C.sub,margin:"2px 0 0",fontWeight:FW.normal}}>
              보충 <span style={{color:ab.makeupDate?C.text:C.sub}}>
                {ab.makeupDate?`${korD(ab.makeupDate)}${mt?` ${mt}`:""}`:"일정 미정"}</span>
            </p>

            {/* 보충 일정 수정 — ⋮ 에서 연다 */}
            {(absTimeEdit===ab.id)&&(
              <div style={{marginTop:8,background:CT.faint,borderRadius:RAD.sm,padding:"9px 10px"}}>
                <label style={editLbl}>보충 예정일</label>
                <input type="date" value={ab.makeupDate||""} aria-label="보충 예정일"
                  onChange={e=>onPatch(ab.id,{makeupDate:e.target.value})}
                  style={{...editInp,display:"block",marginBottom:8}}/>
                <label style={editLbl}>보충 시간 <span style={{opacity:0.75}}>(선택)</span></label>
                {/* 학원 등록의 셔틀 시간칸과 같은 TimeField — <input type="time">은
                    placeholder 를 무시해서, 빈 칸이 무슨 자리인지 알 수 없었다. */}
                <div style={{display:"flex",alignItems:"center",gap:6,minWidth:0}}>
                  <TimeField value={ab.makeupStart||""} hint="시작" hintLeft={9} boxStyle={{flex:1,minWidth:0}}
                    onChange={e=>onPatch(ab.id,{makeupStart:e.target.value})} style={editInp}/>
                  <span style={{flexShrink:0,color:C.sub,fontSize:FS.sub,fontWeight:FW.semi}}>~</span>
                  <TimeField value={ab.makeupEnd||""} hint="종료" hintLeft={9} boxStyle={{flex:1,minWidth:0}}
                    onChange={e=>onPatch(ab.id,{makeupEnd:e.target.value})} style={editInp}/>
                </div>
                <button onClick={()=>setAbsTimeEdit(null)} className="jelly-tap"
                  style={{width:"100%",marginTop:8,padding:"0 11px",minHeight:CTRL_H-6,borderRadius:RAD.sm,border:"none",background:th.grad,color:"#fff",fontSize:FS.sub,fontWeight:FW.bold,cursor:"pointer",fontFamily:"inherit"}}>확인</button>
              </div>
            )}

            <div style={{display:"flex",gap:7,marginTop:9}}>
              {/* 보충 결과 — 눌러서 완료 / 불참 중에 고른다 */}
              <div style={{position:"relative",flex:1,minWidth:0}}>
                <button onClick={()=>setMakeupPick(v=>v===ab.id?null:ab.id)} className="jelly-tap"
                  aria-expanded={makeupPick===ab.id}
                  /* [사용자 확정 2026-08-10] 회색 글자라 못 누르는 버튼처럼 보였다 →
                     배지와 똑같은 상태색을 입혀 살아 있는 버튼으로 만든다.
                     [2026-08-11] '결과 입력'은 무엇의 결과인지 막연했다 →
                     누르면 고르는 게 '보충 완료 / 보충 불참'이므로 그대로 이름에 쓴다. */
                  style={{width:"100%",padding:"8px 0",borderRadius:RAD.sm,cursor:"pointer",fontSize:FS.sub,fontWeight:FW.semi,fontFamily:"inherit",whiteSpace:"nowrap",
                    border:`1px solid ${quiet?C.border:st.color+"44"}`,
                    background:quiet?"#fff":`${st.color}0C`,
                    color:quiet?AB_MID:st.color}}>
                  {ab.makeupStatus?"보충 출석 수정":"보충 출석 여부"}
                </button>
                {makeupPick===ab.id&&(
                  <>
                    <div onClick={()=>setMakeupPick(null)} style={{position:"fixed",inset:0,zIndex:40}}/>
                    <div role="menu" style={{position:"absolute",bottom:40,left:0,zIndex:41,minWidth:130,background:"#fff",borderRadius:RAD.md,border:`1px solid ${C.border}`,boxShadow:"0 8px 24px -6px rgba(90,70,60,0.28)",overflow:"hidden"}}>
                      {[{k:"done",l:"✓ 보충 완료",c:C.green},{k:"absent",l:"✕ 보충 불참",c:AB_PINK}].map((o,oi)=>(
                        <button key={o.k} role="menuitem" className="nav-menu-tap"
                          onClick={()=>{ onResult(ab.id,o.k); setMakeupPick(null); }}
                          style={{...menuItem,color:o.c,borderTop:oi===0?"none":`1px solid ${C.border}`}}>
                          {o.l}{ab.makeupStatus===o.k&&<span style={{marginLeft:"auto",fontSize:FS.tag,fontWeight:FW.normal,color:C.sub}}>선택됨</span>}
                        </button>
                      ))}
                      {ab.makeupStatus&&(
                        /* 보조 동작이라 색만 연하게 — 크기·굵기는 위 두 줄과 같다
                           (사용자 점검: 같은 메뉴 안에서 항목끼리 달랐다) */
                        <button role="menuitem" className="nav-menu-tap"
                          onClick={()=>{ onResult(ab.id,ab.makeupStatus); setMakeupPick(null); }}
                          style={{...menuItem,color:C.sub,borderTop:`1px solid ${C.border}`}}>
                          ↩ 되돌리기
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
              {/* 보조 기능이라 색을 뺀다 — 보라색이면 정작 중요한 '결과 입력'보다
                  먼저 눈에 들어온다(사용자 지적). 시선 순서: 상태 배지 → 결과 → 문자. */}
              <button onClick={()=>onSms(ac)} className="jelly-tap"
                style={{flex:1,minWidth:0,padding:"8px 0",borderRadius:RAD.sm,border:`1px solid ${C.border}`,background:"#fff",color:AB_MID,fontSize:FS.sub,fontWeight:FW.semi,cursor:"pointer",fontFamily:"inherit"}}>
                문자 보내기
              </button>
            </div>
          </div>
          {/* ⋮ 메뉴 */}
          {absMenu===ab.id&&(
            <>
              <div onClick={()=>setAbsMenu(null)} style={{position:"fixed",inset:0,zIndex:40}}/>
              <div role="menu" style={{position:"absolute",top:34,right:8,zIndex:41,minWidth:140,background:"#fff",borderRadius:RAD.md,border:`1px solid ${C.border}`,boxShadow:"0 8px 24px -6px rgba(90,70,60,0.28)",overflow:"hidden"}}>
                <button role="menuitem" className="nav-menu-tap"
                  onClick={()=>{ setAbsTimeEdit(ab.id); setAbsMenu(null); }}
                  style={{...menuItem,color:C.text}}>
                  <CareIcon name="pencil" size={14}/>보충 일정 수정
                </button>
                <button role="menuitem" className="nav-menu-tap"
                  onClick={()=>{ onDelete(ab.id); setAbsMenu(null); }}
                  style={{...menuItem,color:C.red,borderTop:`1px solid ${C.border}`}}>
                  <CareIcon name="trash" size={14}/>기록 삭제
                </button>
              </div>
            </>
          )}
        </div>
      );
    })}
    </div>
    ))}
    {sortedAbs.length===0&&(
      <div style={{textAlign:"center",padding:"36px 20px",background:mixWhite(th.main,0.93),borderRadius:RAD.lg,border:`1.5px dashed ${th.main}40`}}>
        <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:52,height:52,
          borderRadius:"50%",background:`${C.green}14`,color:C.green}}>
          <CareIcon name="check" size={26}/>
        </span>
        <p style={{color:C.sub,fontSize:FS.body,fontWeight:FW.normal,margin:"8px 0 0"}}>
          {totalCnt===0?`${ay}년 ${am}월 결석 기록이 없어요!`:"이 상태의 기록이 없어요"}
        </p>
      </div>
    )}
  </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   AbsenceTab — 엄마용 '결석·보충' 화면
   ────────────────────────────────────────────────────────────────────────
   App.jsx 안에 있던 결석 탭을 그대로 옮겼다 (CLAUDE.md 규칙 3 — 화면을 고칠 때
   그 화면을 조금씩 컴포넌트로 뺀다). 그리기만 하고 저장은 하지 않는다 —
   결석 기록은 전부 App이 들고 있고, 여기는 받은 값을 늘어놓고 눌림만 위로 알린다.
   그래서 저장 키(v6_abs)는 손대지 않는다.

   [사용자 확정 2026-08-17] 글자 크기·굵기·모서리는 전부 tokens.js 척도를 쓴다.
   새 값을 쓸 일이 생기면 FS·FW·RAD 에 있는 것 중에서 고른다.

   [사용자 확정 2026-08-18] 이 화면이 답해야 하는 것은 딱 하나 —
   "결석 → 보충 상태 → 그래서 내가 뭘 해야 하나". 그 순서로 읽히게 다시 짰다.
     · 카드를 5단(학원명/상태/결석일/보충일/버튼 2개)에서 3단으로 압축.
       결석·보충을 각각 한 줄씩 쓰지 않고 '8/13 결석 → 8/14 보충' 한 줄 흐름으로.
     · '일정 지남'처럼 상태만 알려 주던 이름을 '출석 확인 필요'처럼 할 일로 바꿨다.
     · 큰 요약 상자 3개를 한 줄 칩으로 — 여기는 통계 화면이 아니라 목록 화면이다.
     · 정렬을 날짜순이 아니라 '지금 해야 할 일' 순으로 (확인 필요 → 미정 → 예정).
     · 끝난 것은 기본으로 접어 두고, 펼쳐도 버튼 없이 한 줄로만 보여 준다.
     · 카드마다 주된 행동 하나만 채운 버튼으로 세우고 나머지는 ⋮ 로 내렸다.

   props
     th, CT       : 아이 테마색 / 그 테마에 맞춘 박스색 세트
     curAc        : 현재 아이의 학원 목록 (결석 기록의 주인을 찾는 데 쓴다)
     absList      : 화면에 뿌릴 결석 기록 — 지워진 학원의 '주인 없는 기록'은
                    App(curAbsLive)에서 이미 걸러서 넘어온다
     absMonth     : 보고 있는 달 "YYYY-MM"        setAbsMonth
     absFilter    : "all" | "late" | "plan" | "done"   setAbsFilter
     absMenu      : ⋮ 를 연 기록 id              setAbsMenu
     absTimeEdit  : 보충 일정 수정 칸을 연 기록 id  setAbsTimeEdit
     makeupPick   : 출석 확인 메뉴를 연 기록 id     setMakeupPick
     onAdd()               : '＋ 결석 기록 추가' 팝업 열기
     onPatch(id, patch)    : 보충 일정(makeupDate/makeupStart/makeupEnd) 부분 수정
     onResult(id, "done"|"absent") : 보충 출석 결과 넣기 / 같은 값이면 되돌리기
     onDelete(id)          : 기록 삭제
     onSms(ac)             : 그 학원에 문자 보내기 (⋮ 메뉴에서만 — 카드 줄에는 안 둔다)
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { C, FS, FW, RAD, CTRL_H, mixWhite, SHADOW } from "../../data/tokens.js";
import { TODAY } from "../../utils/dates.js";
import { makeupTimeText } from "../../data/sampleData.js";
import CareIcon from "./CareIcons.jsx";
import TimeField from "./TimeField.jsx";

/* 상태 색 — 한 상태에 색은 하나. 막대·배지·주 버튼이 똑같은 값을 쓴다.
   [사용자 확정 2026-08-18] '일정 지남'과 '보충 불참'이 둘 다 핑크 계열이라 뜻이
   섞여 보였다. 둘은 성격이 정반대다 — 하나는 아직 할 일이고 하나는 끝난 결과다.
   할 일 쪽(출석 확인 필요)만 강한 빨강으로 세우고, 끝난 쪽은 아래 묶음에서
   회색조로 가라앉힌다(불참만 글자색을 남긴다). */
const AB_PINK  = "#E85B9C";   // 보충 불참 — 끝났지만 결과가 나쁜 건
const AB_SLATE = "#6E7BA6";   // 보충 없음 (보충 일정을 아직 안 잡은 건)
const AB_MID   = "#6B7392";   // 본문 중간 톤 — C.text(진함)와 C.sub(연함) 사이

export default function AbsenceTab({
  th, CT, curAc = [], absList = [],
  absMonth, setAbsMonth, absFilter, setAbsFilter,
  absMenu, setAbsMenu, absTimeEdit, setAbsTimeEdit, makeupPick, setMakeupPick,
  onAdd, onPatch, onResult, onDelete, onSms,
}) {
  /* 끝난 것은 기본으로 접어 둔다 (사용자 확정 2026-08-18) — 이 화면 자리는
     아직 처리해야 할 결석에 쓰는 게 맞다. 탭을 옮기면 다시 접힌다. */
  const [doneOpen, setDoneOpen] = useState(false);

  /* [사용자 확정 2026-08-18] '끝난 것'은 출석/불참을 누른 건만이 아니다 —
     보충을 안 잡았는데 결석일까지 지난 건은 그냥 결석으로 끝난 것이라 더 할 일이 없다.
     그래서 이 판정을 makeupDone 대신 쓴다 (묶음·개수·이월 모두 같은 기준). */
  const isSettled=(a)=>!!a.makeupDone||(!a.makeupDate&&(a.date||"")<TODAY);
  const inMonth=(a)=>(a.date||"").slice(0,7)===absMonth;                       // 이번 달에 결석한 건
  /* 이월 규칙: 지난달 이전 결석 중 미처리(출석/불참 안 누름)인 것만.
      - 보충일정 있으면 → 그 보충일이 속한 달까지만 이월(보충월 ≥ 현재 보는 달)
      - 보충일정이 없고 결석일도 안 지났으면(미리 적어 둔 건) → 계속 이월 */
  const isCarry=(a)=>{
    if((a.date||"").slice(0,7)>=absMonth) return false;   // 이번 달 이후 결석은 이월 대상 아님
    if(isSettled(a)) return false;                         // 이미 끝난 건은 따라오지 않는다
    if(a.makeupDate) return a.makeupDate.slice(0,7)>=absMonth; // 보충월이 현재 달 이상일 때만 따라옴
    return true;                                           // 보충 미정 → 항상 이월
  };
  const thisMonthAbs=absList.filter(inMonth);                                   // 이번 달 결석
  const carryAbs=absList.filter(isCarry);                                       // 이월된 미처리 건
  const visibleAbs=[...carryAbs,...thisMonthAbs];                               // 화면에 보이는 전체(이월이 위)
  const totalCnt=visibleAbs.length;
  const [ay,am]=absMonth.split("-").map(Number);
  const shiftMonth=(delta)=>{ const d=new Date(ay,am-1+delta,1); setAbsMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); };
  /* [사용자 확정 2026-08-18] 카드 안에서는 '8/13'처럼 더 짧게 — 결석·보충을 한 줄에
     이어 쓰기 때문에 '8월 13일'로는 줄이 금세 넘친다. 연도가 다르면 그때만 붙인다. */
  const shortD=(s)=>{
    if(!s) return "";
    const [yy,mm,dd]=String(s).split("-").map(Number);
    return yy===ay?`${mm}/${dd}`:`${yy}.${mm}.${dd}`;
  };
  /* 상태 한 벌.
     [사용자 확정 2026-08-18] '일정 지남'은 무슨 일이 있었는지만 말할 뿐 뭘 해야
     하는지는 안 알려 줬다 → '출석 확인 필요'. 보충 날짜가 지났는데 갔는지 안 갔는지
     아직 안 넣은 건이라는 뜻이고, 그게 곧 엄마가 할 일이다. */
  const absState=(ab)=>{
    if(ab.makeupStatus==="absent") return {k:"absent",label:"보충 불참",color:AB_PINK};
    if(ab.makeupDone)              return {k:"done",  label:"보충 완료",color:C.green};
    /* [사용자 확정 2026-08-18] '일정 미정'은 '언젠가 잡긴 할 텐데'로 읽혔다.
       보충을 안 하기로 한 결석도 많아서 '보충 없음'이 사실에 맞다. */
    if(!ab.makeupDate)             return {k:"none",  label:"보충 없음",color:AB_SLATE};
    if(ab.makeupDate<TODAY)        return {k:"late",  label:"출석 확인 필요",color:C.red};
    return {k:"plan",label:"보충 예정",color:C.orange};
  };
  /* 카드마다 '지금 할 일' 하나만 채운 버튼으로 세운다 (사용자 확정 2026-08-18).
     예전엔 '보충 출석 여부'와 '문자 보내기'가 같은 크기라 둘 다 주 행동처럼 보였다. */
  const mainAct=(k)=>
      k==="late" ? {label:"출석 확인", act:"pick"}
    : k==="none" ? {label:"보충 추가", act:"time"}
    : k==="plan" ? {label:"일정 변경", act:"time"}
    :              {label:"출석 수정", act:"pick"};   // done · absent

  // 정렬: 이월 건 먼저(결석일 최신순) → 이번 달 건(결석일 최신순)
  const byDate=[
    ...carryAbs.slice().sort((a,b)=>b.date.localeCompare(a.date)),
    ...thisMonthAbs.slice().sort((a,b)=>b.date.localeCompare(a.date)),
  ];
  /* [사용자 확정 2026-08-18] 미처리 건은 날짜순이 아니라 '지금 해야 할 일' 순으로.
     확인 필요(보충일이 지났다) → 보충 없음(아직 안 잡았다) → 보충 예정(기다리면 된다).
     같은 순위 안에서는 위 날짜 정렬을 그대로 따른다. */
  const PRI={late:0,none:1,plan:2};
  const pendingAll=byDate.filter(a=>!isSettled(a))
    .slice().sort((a,b)=>PRI[absState(a).k]-PRI[absState(b).k]);
  const doneAll=byDate.filter(isSettled);
  const lateCnt=pendingAll.filter(a=>absState(a).k==="late").length;
  const planCnt=pendingAll.length-lateCnt;

  /* 요약 칩을 누르면 그 갈래만 걸러 본다 (예전 요약 3칸이 하던 일).
     '보충 예정'은 아직 안 지난 것과 날짜 미정을 함께 센다 — 둘 다 '기다리는 중'이다. */
  const pendingList=absFilter==="late"?pendingAll.filter(a=>absState(a).k==="late")
                  :absFilter==="plan"?pendingAll.filter(a=>absState(a).k!=="late")
                  :absFilter==="done"?[]
                  :pendingAll;
  const doneList=(absFilter==="all"||absFilter==="done")?doneAll:[];
  const shownCnt=pendingList.length+doneList.length;
  // '완료'만 걸러 봤을 때는 접어 두면 아무것도 안 보인다 → 그때는 늘 펼친다
  const doneShown=doneOpen||absFilter==="done";

  /* 보충 일정 수정 칸의 입력 세 개는 한 벌이다 — 높이는 padding 대신 CTRL_H 기준으로
     못 박는다(글자 크기를 바꿔도 다시 틀어지지 않는다). */
  const editInp={ width:"100%",minWidth:0,boxSizing:"border-box",background:"#fff",
    border:`1px solid ${CT.faintB}`,borderRadius:RAD.sm,padding:"0 9px",minHeight:CTRL_H-6,
    fontSize:FS.sub,fontWeight:FW.normal,color:C.text,outline:"none",fontFamily:"inherit" };
  const editLbl={ display:"block",fontSize:FS.tag,fontWeight:FW.normal,color:C.sub,marginBottom:4 };
  const menuItem={ width:"100%",border:"none",background:"none",padding:"11px 13px",textAlign:"left",
    fontSize:FS.body,fontWeight:FW.semi,cursor:"pointer",fontFamily:"inherit",
    display:"flex",alignItems:"center",gap:8 };
  /* [사용자 확정 2026-08-18] 주 행동을 채운 버튼이 아니라 학원비 탭의 '납부 처리'와
     똑같은 모양(밑줄 글자)으로, 카드 오른쪽 아래에 둔다. 색은 그대로 상태색을 쓴다 —
     배지와 링크가 한 색이라 눈이 '무슨 상태인가 → 그래서 뭘 하나'로 이어진다. */
  const actLink={ background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",
    fontSize:FS.sub,fontWeight:FW.semi,textDecoration:"underline",textUnderlineOffset:3,
    padding:"8px 0 8px 12px",flexShrink:0,whiteSpace:"nowrap" };
  const headRow={ display:"flex",alignItems:"center",gap:8,margin:"0 0 10px" };
  const headTxt={ fontSize:FS.sub,fontWeight:FW.semi,color:C.sub,flexShrink:0 };

  /* ── 카드 한 장 ──────────────────────────────────────────────────────
     compact=true 는 끝난 것 묶음 — 버튼 줄 없이 두 줄로만 (사용자 확정 2026-08-18). */
  const card=(ab,compact)=>{
    const ac=curAc.find(a=>String(a.id)===String(ab.academyId)); if(!ac) return null;
    const st=absState(ab);
    const carried=isCarry(ab);
    const mt=makeupTimeText(ab);
    const ma=mainAct(st.k);
    const badgeC=compact?(st.k==="absent"?AB_PINK:C.sub):st.color;
    const badgeBg=compact?(st.k==="absent"?`${AB_PINK}12`:CT.faint):`${st.color}14`;
    const openMain=()=>{ if(ma.act==="pick") setMakeupPick(v=>v===ab.id?null:ab.id);
                         else setAbsTimeEdit(v=>v===ab.id?null:ab.id); };
    return (
      /* 막대는 카드 높이를 꽉 채우고 왼쪽 두 모서리만 둥글다. 카드에 overflow:hidden 을
         걸면 아래 ⋮ 메뉴(absolute)까지 잘리므로 막대 자신이 모서리를 갖는다.
         위아래 여백도 카드가 아니라 오른쪽 내용 칸이 갖는다 — 카드가 여백을 가지면
         막대가 그 안에 갇혀 짧아진다. */
      <div key={ab.id} style={{position:"relative",background:"#fff",borderRadius:RAD.md,marginBottom:compact?8:10,border:`1px solid ${C.border}`,boxShadow:SHADOW.sm,display:"flex",gap:11}}>
        {/* [사용자 확정 2026-08-18] 카드 앞 막대는 학원 테마색 — 끝난 건도 마찬가지다.
            (2026-08-17 에 색을 줄이려고 상태색으로 바꿨었는데, 여기 막대는 '어느 학원인가'를
            말하는 자리라 학원색이 맞다는 사용자 확인. 상태는 배지·주 행동 링크가 말한다.) */}
        <div style={{width:4,borderRadius:`${RAD.md}px 0 0 ${RAD.md}px`,background:ac.color,flexShrink:0}}/>
        <div style={{flex:1,minWidth:0,padding:compact?"9px 12px 9px 0":"10px 12px 10px 0"}}>
          {/* ① 학원명 · 상태 */}
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <p style={{fontWeight:FW.semi,fontSize:FS.title,margin:0,color:C.text,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ac.name}</p>
            {carried&&<span style={{flexShrink:0,fontSize:FS.tag,fontWeight:FW.semi,color:C.orange,background:`${C.orange}14`,borderRadius:RAD.sm,padding:"1px 6px"}}>이월</span>}
            <span style={{marginLeft:"auto",flexShrink:0,fontSize:FS.tag,fontWeight:FW.semi,padding:"3px 9px",borderRadius:RAD.sm,background:badgeBg,color:badgeC}}>{st.label}</span>
            {/* ✕ 는 '닫기'로도 읽혀서 ⋮ 메뉴로 바꿨다 (사용자 지적) */}
            <button onClick={()=>setAbsMenu(m=>m===ab.id?null:ab.id)} className="jelly-tap"
              aria-label={`${ac.name} 결석 기록 더보기`} aria-expanded={absMenu===ab.id}
              style={{flexShrink:0,width:24,height:24,borderRadius:RAD.sm,border:"none",background:"none",color:C.sub,fontSize:FS.title,fontWeight:FW.bold,cursor:"pointer",fontFamily:"inherit",lineHeight:1,padding:0}}>⋮</button>
          </div>

          {/* ② 결석 → 보충 한 줄.
              [사용자 확정 2026-08-18] '결석'·'보충'을 각각 한 줄씩 쓰면 카드가 5단이 된다.
              화살표로 이어 붙이면 '언제 빠져서 언제 메우나'가 한 번에 읽힌다.
              앞말은 연하게, 실제 값(날짜·시간)만 진하게 — 이 글꼴은 굵기가 하나뿐이라
              위계를 색으로 준다. */}
          <p style={{margin:"4px 0 0",fontSize:FS.sub,fontWeight:FW.normal,color:C.sub,lineHeight:1.45}}>
            <span style={{color:AB_MID}}>{shortD(ab.date)}</span> 결석
            {ab.reason&&<span> · {ab.reason}</span>}
            <span style={{margin:"0 5px",color:C.sub}}>→</span>
            {ab.makeupDate
              ? <><span style={{color:compact?AB_MID:C.text}}>{shortD(ab.makeupDate)}{mt?` ${mt}`:""}</span> 보충</>
              : <span>보충 없음</span>}
          </p>

          {/* 보충 일정 수정 — ⋮ 에서 열거나 '보충 추가·일정 변경'으로 연다 */}
          {(absTimeEdit===ab.id)&&(
            <div style={{marginTop:8,background:CT.faint,borderRadius:RAD.sm,padding:"9px 10px"}}>
              {/* [사용자 확정 2026-08-18] 결석일을 잘못 적으면 고칠 데가 없어서 지우고
                  다시 넣어야 했다 → 보충 예정일 위에 결석일 칸을 둔다.
                  날짜를 바꾸면 이 기록이 속한 달도 바뀌므로, 다른 달로 옮기면
                  이 화면(그 달 목록)에서는 사라지고 그 달로 넘어가면 보인다. */}
              <label style={editLbl}>결석일</label>
              <input type="date" value={ab.date||""} aria-label="결석일"
                onChange={e=>{ if(e.target.value) onPatch(ab.id,{date:e.target.value}); }}
                style={{...editInp,display:"block",marginBottom:8}}/>
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

          {/* ③ 할 일 — 학원비 탭 카드와 같은 줄 모양: 왼쪽 보조, 오른쪽 끝에 주 행동.
              (사용자 확정 2026-08-18) */}
          {!compact&&(
            <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
              <div style={{position:"relative",marginLeft:"auto"}}>
                <button onClick={openMain} style={{...actLink,color:st.color}}
                  aria-expanded={ma.act==="pick"?makeupPick===ab.id:absTimeEdit===ab.id}>
                  {ma.label}
                </button>
                {makeupPick===ab.id&&pickMenu(ab,"up")}
              </div>
            </div>
          )}
          {/* 끝난 건은 버튼 줄이 없어 '수정' 글자 바로 아래로 편다 —
              위로 펴면 앞 카드를 덮는다 (실측 확인) */}
          {compact&&makeupPick===ab.id&&(
            <div style={{position:"relative"}}>{pickMenu(ab,"down")}</div>
          )}
        </div>

        {/* ⋮ 메뉴 — 주 버튼에 안 세운 나머지 동작을 전부 여기 모은다.
            (그래야 어떤 상태에서도 할 수 있는 일이 사라지지 않는다) */}
        {absMenu===ab.id&&(
          <>
            <div onClick={()=>setAbsMenu(null)} style={{position:"fixed",inset:0,zIndex:40}}/>
            <div role="menu" style={{position:"absolute",top:34,right:8,zIndex:41,minWidth:150,background:"#fff",borderRadius:RAD.md,border:`1px solid ${C.border}`,boxShadow:"0 8px 24px -6px rgba(90,70,60,0.28)",overflow:"hidden"}}>
              <button role="menuitem" className="nav-menu-tap"
                onClick={()=>{ setAbsMenu(null); setMakeupPick(ab.id); }}
                style={{...menuItem,color:C.text}}>
                <CareIcon name="check" size={14}/>{ab.makeupStatus?"출석 결과 수정":"출석 결과 넣기"}
              </button>
              <button role="menuitem" className="nav-menu-tap"
                onClick={()=>{ setAbsTimeEdit(ab.id); setAbsMenu(null); }}
                style={{...menuItem,color:C.text,borderTop:`1px solid ${C.border}`}}>
                <CareIcon name="pencil" size={14}/>보충 일정 수정
              </button>
              {/* [사용자 확정 2026-08-18] 문자 보내기는 카드 줄에서만 뺀 것이다 —
                  ⋮ 안에는 그대로 둔다. */}
              <button role="menuitem" className="nav-menu-tap"
                onClick={()=>{ setAbsMenu(null); onSms(ac); }}
                style={{...menuItem,color:C.text,borderTop:`1px solid ${C.border}`}}>
                <CareIcon name="sms" size={14}/>문자 보내기
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
  };

  /* 출석 결과 고르기 — 주 버튼 위(up)로, 끝난 건에서는 '수정' 아래(down)로 편다 */
  function pickMenu(ab,dir){
    return (
      <>
        <div onClick={()=>setMakeupPick(null)} style={{position:"fixed",inset:0,zIndex:40}}/>
        <div role="menu" style={{position:"absolute",...(dir==="down"?{top:4,left:0}:{bottom:36,right:0}),zIndex:41,minWidth:150,background:"#fff",borderRadius:RAD.md,border:`1px solid ${C.border}`,boxShadow:"0 8px 24px -6px rgba(90,70,60,0.28)",overflow:"hidden"}}>
          {[{k:"done",l:"✓ 보충 완료",c:C.green},{k:"absent",l:"✕ 보충 불참",c:AB_PINK}].map((o,oi)=>(
            <button key={o.k} role="menuitem" className="nav-menu-tap"
              onClick={()=>{ onResult(ab.id,o.k); setMakeupPick(null); }}
              style={{...menuItem,color:o.c,borderTop:oi===0?"none":`1px solid ${C.border}`}}>
              {o.l}{ab.makeupStatus===o.k&&<span style={{marginLeft:"auto",fontSize:FS.tag,fontWeight:FW.normal,color:C.sub}}>선택됨</span>}
            </button>
          ))}
          {ab.makeupStatus&&(
            /* 보조 동작이라 색만 연하게 — 크기·굵기는 위 두 줄과 같다 */
            <button role="menuitem" className="nav-menu-tap"
              onClick={()=>{ onResult(ab.id,ab.makeupStatus); setMakeupPick(null); }}
              style={{...menuItem,color:C.sub,borderTop:`1px solid ${C.border}`}}>
              ↩ 되돌리기
            </button>
          )}
        </div>
      </>
    );
  }

  return (
  <div>
    {/* 월 네비게이션 — 홈·달력·학원비와 같은 치수 */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:2,marginBottom:10}}>
      <button onClick={()=>shiftMonth(-1)} className="jelly-tap" aria-label="이전 달"
        style={{background:"none",border:"none",borderRadius:RAD.sm,width:34,height:34,fontSize:18,fontWeight:FW.semi,cursor:"pointer",color:C.sub,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>‹</button>
      <span style={{fontWeight:FW.bold,fontSize:FS.title,color:C.text,whiteSpace:"nowrap"}}>{ay}년 {am}월 결석</span>
      <button onClick={()=>shiftMonth(1)} className="jelly-tap" aria-label="다음 달"
        style={{background:"none",border:"none",borderRadius:RAD.sm,width:34,height:34,fontSize:18,fontWeight:FW.semi,cursor:"pointer",color:C.sub,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>›</button>
    </div>

    {/* 요약 한 줄 — [사용자 확정 2026-08-18] 큰 상자 3개가 화면을 많이 차지했다.
        여기는 통계 화면이 아니라 결석 관리 화면이라 목록을 먼저 보여 주는 편이 낫다.
        누르면 그 갈래만 걸러 보는 것(예전 3칸이 하던 일)은 그대로 남긴다. */}
    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:12}}>
      <span style={{fontSize:FS.cardTitle,fontWeight:FW.bold,color:C.text,flexShrink:0,marginRight:2}}>결석 {totalCnt}건</span>
      {[{k:"late",l:"확인 필요",v:lateCnt,c:C.red},
        {k:"plan",l:"보충 예정",v:planCnt,c:C.orange},
        {k:"done",l:"완료",     v:doneAll.length,c:C.sub}].map(s=>{
        const on=absFilter===s.k;
        return (
          <button key={s.k} onClick={()=>setAbsFilter(on?"all":s.k)} className="jelly-tap"
            aria-pressed={on} aria-label={`${s.l} ${s.v}건 보기`}
            style={{flexShrink:0,display:"inline-flex",alignItems:"center",gap:4,cursor:"pointer",fontFamily:"inherit",
              padding:"4px 10px",borderRadius:RAD.pill,
              border:`1px solid ${on?s.c+"66":C.border}`,background:on?`${s.c}12`:"#fff",
              fontSize:FS.tag,fontWeight:FW.normal,color:on?s.c:AB_MID}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:s.c,flexShrink:0,opacity:on?1:0.55}}/>
            {s.l} <span style={{fontWeight:FW.semi,color:s.c}}>{s.v}</span>
          </button>
        );
      })}
    </div>

    <button onClick={onAdd} className="jelly-tap"
      style={{width:"100%",padding:"9px",borderRadius:RAD.sm,border:`1px dashed ${C.red}40`,background:`${C.red}06`,color:C.red,fontSize:FS.body,fontWeight:FW.semi,cursor:"pointer",marginBottom:14,fontFamily:"inherit"}}>
      ＋ 결석 기록 추가
    </button>

    {/* ── 처리 필요 ── */}
    {pendingList.length>0&&(
      <div>
        {absFilter==="all"&&(
          <div style={headRow}>
            <span style={headTxt}>처리 필요 {pendingList.length}건</span>
            <div style={{flex:1,height:1,background:C.border}}/>
          </div>
        )}
        {pendingList.map(ab=>card(ab,false))}
      </div>
    )}

    {/* ── 끝난 것 — 기본 접힘 ── */}
    {doneList.length>0&&(
      <div style={{marginTop:pendingList.length?10:0}}>
        {absFilter==="all"?(
          <button onClick={()=>setDoneOpen(v=>!v)} className="jelly-tap"
            aria-expanded={doneShown}
            style={{...headRow,width:"100%",background:"none",border:"none",padding:"4px 0",cursor:"pointer",fontFamily:"inherit"}}>
            <span style={headTxt}>완료 {doneList.length}건</span>
            <span style={{flexShrink:0,fontSize:FS.tag,color:C.sub,fontWeight:FW.bold,
              transition:"transform .2s",transform:doneShown?"rotate(180deg)":"none",display:"inline-block"}}>⌄</span>
            <div style={{flex:1,height:1,background:C.border}}/>
          </button>
        ):null}
        {doneShown&&doneList.map(ab=>card(ab,true))}
      </div>
    )}

    {shownCnt===0&&(
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

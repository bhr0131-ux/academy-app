/* ════════════════════════════════════════════════════════════════════════
   FeeTab — 엄마용 '학원비' 화면
   ────────────────────────────────────────────────────────────────────────
   App.jsx 안에 있던 학원비 탭을 그대로 옮겼다 (CLAUDE.md 규칙 3 — 화면을 고칠 때
   그 화면을 조금씩 컴포넌트로 뺀다). 그리기만 하고 저장은 하지 않는다 —
   납부 여부·기록·학원 정보는 전부 App이 들고 있고, 여기는 받은 값을 늘어놓고
   눌림만 위로 알린다. 그래서 저장 키(v6_paid / v6_fee_pay_info)는 손대지 않는다.

   [사용자 확정 2026-08-17] 글자 크기·굵기·모서리를 전부 tokens.js 척도로 옮겼다.
   그전에는 이 파일만 숫자를 직접 박아 써서(15.5 / 11 / 10.5 / 굵기 600 / 모서리 9·12·16·18)
   다른 탭을 정리할 때마다 여기만 조금씩 뒤처졌다. 새 값을 쓸 일이 생기면
   FS·FW·RAD 에 있는 것 중에서 고른다 — 없는 값이 필요하면 척도부터 손본다.

   props
     th, CT      : 아이 테마색 / 그 테마에 맞춘 박스색 세트
     curAc       : 현재 아이의 학원 목록
     feeMonth    : 보고 있는 달(1~12)     setFeeMonth
     isPaid(id)  : 그 달 납부 여부         payRec(id) : 납부 기록 {date,amount,method,memo}|null
     payStatus(a): {key,label,color}      상태 배지에 쓰는 색·이름
     feeMenu     : ⋮ 를 연 학원 id        setFeeMenu
     onPay(id)      : 납부 완료 처리 / 내역 보기 시트 열기
     onEditFee(a)   : 학원비 입력 팝업 열기 ({id,fee,payDay})
     onDeleteFee(id): 학원비 지우기
     onCopyAccount(s): 입금 계좌 복사
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { C, FS, FW, RAD, mixWhite, mixBlack, SHADOW } from "../../data/tokens.js";
import { payMethodLabel } from "./FeePaySheet.jsx";
import CareIcon from "./CareIcons.jsx";

/* 카드 안 보조 글자색 — 홈 학원카드와 같은 값.
   C.sub(#8890B0)는 회색 배경 위에서는 맞지만 흰 카드 위에서는 너무 흐려서
   '8월 8일 납부 · 계좌이체' 같은 줄이 안 읽혔다 (사용자 제보). */
const SUBD = "#5F678C";

export default function FeeTab({
  th, CT, curAc = [], feeMonth, setFeeMonth,
  isPaid, payRec, payStatus, feeMenu, setFeeMenu,
  onPay, onEditFee, onDeleteFee, onCopyAccount,
}) {
  /* [사용자 확정 2026-08-09] 이 화면의 일은 '예쁘게 보이기'가 아니라
     "이번 달에 얼마를 더 내야 하고, 어떤 학원이 미납인가"를 빨리 판단하게 하는 것. */
  const billed=curAc.filter(a=>Number(a.fee||0)>0);      // 학원비가 있는 학원만 센다
  const paidList=billed.filter(a=>isPaid(a.id));
  const total=billed.reduce((s,a)=>s+Number(a.fee||0),0);
  const paidSum=paidList.reduce((s,a)=>s+Number(a.fee||0),0);
  const restSum=total-paidSum;
  const thisMonth=new Date().getMonth()+1;
  const won=(n)=>`${n.toLocaleString()}원`;
  /* [사용자 확정 2026-08-18] 다 낸 곳은 더 할 일이 없다 → 아래로 내리고 기본으로 접는다.
     결석 탭과 같은 규칙이다. 이 화면 자리는 '아직 낼 곳'에 쓰는 게 맞다.
     학원비를 아직 안 적은 곳은 '낼 곳' 쪽에 둔다 — 그것도 손이 가야 하는 일이다. */
  const [doneOpen, setDoneOpen] = useState(false);
  const isDone=(a)=>Number(a.fee||0)>0&&isPaid(a.id);
  const todoAc=curAc.filter(a=>!isDone(a));
  const doneAc=curAc.filter(isDone);
  const groups=(todoAc.length>0&&doneAc.length>0)
    ? [{key:"todo",head:`낼 곳 ${todoAc.length}곳`,items:todoAc,fold:false},
       {key:"done",head:`납부 완료 ${doneAc.length}곳`,items:doneAc,fold:true}]
    : [{key:"one",head:null,items:curAc,fold:false}];
  const headRow={ display:"flex",alignItems:"center",gap:8,margin:"0 0 10px" };
  const headTxt={ fontSize:FS.sub,fontWeight:FW.semi,color:C.sub,flexShrink:0 };
  return (
  <div>
    {/* 월 이동 — 화살표를 제목 양옆에 모아 하나의 조작 영역으로 (사용자 지적).
        연도를 같이 써서 지난달을 보다가 헷갈리지 않게 한다. */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:12,position:"relative"}}>
      <button onClick={()=>setFeeMonth(m=>Math.max(1,m-1))} className="jelly-tap" aria-label="이전 달"
        style={{background:"none",border:"none",borderRadius:RAD.sm,width:34,height:34,fontSize:18,fontWeight:FW.semi,cursor:"pointer",color:C.sub,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>‹</button>
      <span style={{fontWeight:FW.bold,fontSize:FS.title,color:C.text}}>{new Date().getFullYear()}년 {feeMonth}월</span>
      <button onClick={()=>setFeeMonth(m=>Math.min(12,m+1))} className="jelly-tap" aria-label="다음 달"
        style={{background:"none",border:"none",borderRadius:RAD.sm,width:34,height:34,fontSize:18,fontWeight:FW.semi,cursor:"pointer",color:C.sub,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>›</button>
      {feeMonth!==thisMonth&&(
        <button onClick={()=>setFeeMonth(thisMonth)} className="jelly-tap"
          style={{position:"absolute",right:0,background:`${th.main}14`,border:`1px solid ${th.main}40`,borderRadius:RAD.sm,color:th.main,fontSize:FS.tag,fontWeight:FW.semi,padding:"3px 9px",cursor:"pointer",fontFamily:"inherit"}}>
          이번 달
        </button>
      )}
    </div>

    {/* 요약 — [사용자 확정 2026-08-09] 3칸을 나란히 두면 금액이 길 때
        '200,00…'처럼 잘린다. 이 화면에서 제일 중요한 숫자가 잘리면 안 되므로
        총액을 위 한 줄로 빼고 아래를 납부·남은 금액 2칸으로 나눈다.
        굵기는 라벨(700) < 금액(800~900) 으로만 차이를 준다 — 셋 다 굵으면 서로 경쟁한다. */}
    {/* [사용자 확정 2026-08-10] 정보는 셋뿐인데 카드가 커서 아래 목록이 늦게 보였다 —
        높이 약 18% 축소, 그라데이션도 약하게. '2곳 중 1곳 납부'는 위 금액으로
        이미 알 수 있어 뺐다(다 냈을 때만 축하 한 줄). */}
    {/* 총액 21px 만 척도(17) 밖이다 — 이 화면의 주인공 숫자라 일부러 한 단 크게 둔다. */}
    <div style={{background:`linear-gradient(165deg, ${mixWhite(th.main,0.96)} 0%, ${mixWhite(th.main,0.88)} 100%)`,borderRadius:RAD.md,padding:"12px 14px 11px",marginBottom:14,border:`1px solid ${th.main}2A`,boxShadow:SHADOW.sm}}>
      <p style={{fontSize:FS.tag,fontWeight:FW.normal,color:C.sub,margin:0,textAlign:"center"}}>{feeMonth}월 총 학원비</p>
      <p style={{fontSize:21,fontWeight:FW.bold,color:C.text,margin:"1px 0 0",textAlign:"center",letterSpacing:-0.3}}>{won(total)}</p>
      <div style={{display:"flex",alignItems:"stretch",marginTop:9,paddingTop:9,borderTop:`1px solid ${th.main}1F`}}>
        <div style={{flex:1,minWidth:0,textAlign:"center"}}>
          <p style={{fontSize:FS.tag,fontWeight:FW.normal,color:C.sub,margin:0}}>납부 완료</p>
          <p style={{fontSize:FS.title,fontWeight:FW.semi,color:C.green,margin:"2px 0 0",whiteSpace:"nowrap"}}>{won(paidSum)}</p>
        </div>
        <div style={{width:1,background:`${th.main}1F`}}/>
        <div style={{flex:1,minWidth:0,textAlign:"center"}}>
          <p style={{fontSize:FS.tag,fontWeight:FW.normal,color:C.sub,margin:0}}>남은 금액</p>
          <p style={{fontSize:FS.title,fontWeight:FW.bold,color:restSum>0?C.red:C.sub,margin:"2px 0 0",whiteSpace:"nowrap"}}>{won(restSum)}</p>
        </div>
      </div>
      {(billed.length===0||restSum===0)&&(
      <p style={{fontSize:FS.tag,fontWeight:FW.normal,color:C.sub,margin:"9px 0 0",textAlign:"center",opacity:0.9}}>
        {billed.length===0
          ? "등록된 학원비가 없어요"
          : `${billed.length}곳 모두 납부했어요`}
      </p>
      )}
    </div>

    {groups.map((g,gi)=>{
      const folded=g.fold&&!doneOpen;
      return (
      <div key={g.key} style={{marginTop:gi?10:0}}>
      {g.head&&(g.fold?(
        <button onClick={()=>setDoneOpen(v=>!v)} className="jelly-tap" aria-expanded={!folded}
          style={{...headRow,width:"100%",background:"none",border:"none",padding:"4px 0",cursor:"pointer",fontFamily:"inherit"}}>
          <span style={headTxt}>{g.head}</span>
          <span style={{flexShrink:0,fontSize:FS.tag,color:C.sub,fontWeight:FW.bold,display:"inline-block",
            transition:"transform .2s",transform:folded?"none":"rotate(180deg)"}}>⌄</span>
          <div style={{flex:1,height:1,background:C.border}}/>
        </button>
      ):(
        <div style={headRow}>
          <span style={headTxt}>{g.head}</span>
          <div style={{flex:1,height:1,background:C.border}}/>
        </div>
      ))}
      {!folded&&g.items.map(a=>{
      const st=payStatus(a);
      const paid=isPaid(a.id);
      const rec=payRec(a.id);
      const hasFee=Number(a.fee||0)>0;
      /* [사용자 확정 2026-08-10] 카드 안 동작은 전부 '내역 보기'와 같은 모양 —
         네모 버튼이 아니라 밑줄 글자 — 로 통일하고, 색은 그 카드의 상태색을 쓴다.
         납부일이 지난 카드의 '납부 처리'는 빨강처럼
         배지와 링크가 같은 색이라 눈이 배지 → 동작으로 자연스럽게 이어진다.

         [사용자 확정 2026-08-10 재조정] 배지는 흰색을 섞어 연하게, 링크는 검정을 섞어
         진하게 쓰다 보니 같은 상태인데 색이 미묘하게 달랐다(사용자 제보 "색이 왜 조금씩 달라").
         → 한 상태에 색은 하나. 이 값 하나를 배지 글자와 링크가 똑같이 쓴다.
         상태색 원본은 흰 바탕에서 흐리므로 검정을 28% 섞은 값을 기준색으로 삼는다. */
      const actC=mixBlack(st.color,0.28);
      /* [사용자 확정 2026-08-18] 링크 글자는 상태색을 따르지 않고 검정 하나로.
         '납부 처리'는 어느 카드에서나 같은 무게의 동작이라 색으로 갈릴 이유가 없고,
         상태는 바로 위 배지가 이미 색으로 말한다 (결석 탭의 주 행동 링크와 같은 규칙).
         actC 는 배지 글자에만 남는다. */
      const actLink={background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",color:C.text,
        fontSize:FS.sub,fontWeight:FW.semi,textDecoration:"underline",textUnderlineOffset:3,
        padding:"8px 0 8px 12px",flexShrink:0,whiteSpace:"nowrap"};
      return (
        /* 카드 구조 (사용자 확정)
             [학원 색 세로선] 학원명 ─────────── 상태 배지  ⋮
                              (미납) 150,000원
                                     납부 예정일 8월 5일         납부 처리
                              (납부) 200,000원 · 매월 5일
                                     8월 5일 납부 · 계좌이체
           동작은 납부·미납 모두 '왼쪽 정보 ─ 오른쪽 밑줄 글자' 같은 줄 모양이다.
           학원 고유색은 왼쪽 세로선에만 쓴다 — 점으로 두면 민트 점이
           '납부 완료' 상태처럼 읽혀서 상태색과 섞인다.
           '매월 5일'은 금액보다 두 단계 작고 연하게 — 값끼리 시선을 나눠 갖지 않게.

           [사용자 확정 2026-08-17] 세로선을 홈 학원카드처럼 카드 높이 전체로 세운다.
           그전에는 카드 패딩 안에 있어 위아래로 11px씩 짧았다. 여백은 카드가 아니라
           오른쪽 내용 칸이 갖는다 — 홈 카드와 같은 구조다.
           카드에 overflow:hidden 을 걸면 아래 ⋮ 메뉴(position:absolute)까지 잘리므로,
           세로선 자신이 왼쪽 두 모서리만 둥글게 갖는다. */
        <div key={a.id} style={{position:"relative",background:CT.card,borderRadius:RAD.md,marginBottom:14,border:`1px solid ${C.border}`,boxShadow:SHADOW.sm,display:"flex"}}>
          <div style={{width:4,borderRadius:`${RAD.md}px 0 0 ${RAD.md}px`,background:a.color,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0,padding:"11px 12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <p style={{fontSize:FS.title,fontWeight:FW.semi,margin:0,flex:1,minWidth:0,color:C.text,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</p>
              {/* 납부는 체크됐는데 상세 기록이 없으면(이 기능 이전에 체크만 한 건)
                  '납부 완료'라고만 쓰면 아래 안내와 모순처럼 읽힌다 → 배지에서 미리 밝힌다 */}
              {/* [사용자 확정 2026-08-10] 미납 카드가 여러 개면 같은 배지가 줄줄이 반복돼
                  화면이 붉고 답답해 보였다 → 배경을 아주 옅게(5%) 깐다.
                  글자는 아래 링크와 똑같은 actC 를 쓴다 — 한 상태에 색은 하나. */}
              {hasFee&&<span style={{flexShrink:0,fontSize:FS.tag,fontWeight:FW.semi,padding:"3px 9px",borderRadius:RAD.sm,background:`${st.color}0D`,color:actC,whiteSpace:"nowrap"}}>{paid&&!rec?"납부 완료 · 상세 미입력":st.label}</span>}
              <button onClick={()=>setFeeMenu(m=>m===a.id?null:a.id)} className="jelly-tap"
                aria-label={`${a.name} 더보기`} aria-expanded={feeMenu===a.id}
                style={{flexShrink:0,width:24,height:24,borderRadius:RAD.sm,border:"none",background:"none",color:SUBD,fontSize:FS.title,fontWeight:FW.bold,cursor:"pointer",fontFamily:"inherit",lineHeight:1}}>⋮</button>
            </div>
            {hasFee?(
              <p style={{margin:"3px 0 0",fontSize:FS.title,fontWeight:FW.bold,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {Number(a.fee).toLocaleString()}원
                {paid&&<span style={{fontSize:FS.tag,fontWeight:FW.normal,color:SUBD,marginLeft:6}}>
                  · 매월 {a.payDay}일
                </span>}
              </p>
            ):(
              <p style={{margin:"3px 0 0",fontSize:FS.sub,fontWeight:FW.normal,color:SUBD}}>학원비가 등록되지 않았어요</p>
            )}
            {/* 납부 완료 — 기록이 있을 때와 없을 때를 나눈다.
                [사용자 지적] '납부 완료'인데 '납부 기록 없음'은 모순처럼 읽힌다.
                기록이 없는 건 이 기능이 생기기 전에 체크만 해 둔 건이라,
                상태를 '상세 미입력'으로 분명히 말하고 채워 넣게 안내한다. */}
            {/* [사용자 확정 2026-08-17] '내역 보기' 링크를 뺐다 — ⋮ > 학원비 수정이 이제
                학원비 설정과 이 달 납부 기록을 한 화면에서 보여 준다. 같은 곳으로 가는
                길이 둘이었다. 낸 날·방법은 여기 한 줄로 그대로 읽힌다. */}
            {hasFee&&paid&&rec&&(
              <p style={{margin:"5px 0 0",fontSize:FS.tag,fontWeight:FW.normal,color:SUBD,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {`${Number(rec.date.slice(5,7))}월 ${Number(rec.date.slice(8,10))}일 납부${rec.method?` · ${payMethodLabel(rec.method)}`:""}${rec.memo?` · ${rec.memo}`:""}`}
              </p>
            )}
            {hasFee&&paid&&!rec&&(
              <div style={{marginTop:6,background:CT.faint,borderRadius:RAD.sm,padding:"8px 10px"}}>
                <p style={{margin:0,fontSize:FS.tag,fontWeight:FW.normal,color:SUBD}}>납부일과 결제 방법을 입력해 주세요</p>
                <button onClick={()=>onPay(a.id)} style={{...actLink,padding:"8px 0 4px"}}>
                  납부 정보 추가
                </button>
              </div>
            )}
            {/* 미납 — 여기서 바로 처리한다. 시트는 오늘 날짜와 학원비가 미리 채워져 있어
                결제 방법만 고르고 저장하면 끝난다 (사용자 확정 흐름).
                [사용자 확정 2026-08-10] 좁은 화면(320px)에서 금액 줄에 링크까지 넣으면
                '· 매월 5일'이 '· 매…'로 잘렸다 → 납부 완료 카드의 낸 날 줄과 똑같이
                따로 한 줄을 쓴다. 왼쪽에는 이번 달 납부 예정일을 온전히 적는다. */}
            {hasFee&&!paid&&(
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
                <span style={{fontSize:FS.tag,fontWeight:FW.normal,color:SUBD,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  납부 예정일 {feeMonth}월 {a.payDay}일
                </span>
                <button onClick={()=>onPay(a.id)} style={{...actLink,marginLeft:"auto"}}>
                  납부 처리
                </button>
              </div>
            )}
            {/* 입금 계좌 — [사용자 확정 2026-08-10] 이체할 때마다 문자를 찾아 헤매지 않게.
                눌러서 복사한다. 학원 등록에서 안 적었으면 아예 안 나온다. */}
            {hasFee&&!paid&&(a.account||"").trim()&&(
              <button onClick={()=>onCopyAccount&&onCopyAccount(a.account)} className="jelly-tap"
                style={{display:"flex",alignItems:"center",gap:6,width:"100%",marginTop:6,padding:"6px 9px",borderRadius:RAD.sm,
                  border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                <span style={{flexShrink:0,display:"flex",color:SUBD}}><CareIcon name="bank" size={13}/></span>
                <span style={{flex:1,minWidth:0,fontSize:FS.tag,fontWeight:FW.normal,color:SUBD,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.account}</span>
                <span style={{flexShrink:0,fontSize:FS.tag,fontWeight:FW.semi,color:th.main}}>복사</span>
              </button>
            )}
            {!hasFee&&(
              <button onClick={()=>onEditFee({id:a.id,fee:"",payDay:String(a.payDay||1)})}
                style={{...actLink,padding:"8px 0 4px",color:mixBlack(th.main,0.28)}}>
                ＋ 학원비 추가
              </button>
            )}
          </div>
          {/* ⋮ 더보기 — 자주 쓰지 않는 수정·삭제는 여기 안에 (사용자 확정).
              큰 삭제 버튼을 항상 띄워 두면 실수로 누를 위험이 있다. */}
          {feeMenu===a.id&&(
            <>
              <div onClick={()=>setFeeMenu(null)} style={{position:"fixed",inset:0,zIndex:40}}/>
              <div role="menu" style={{position:"absolute",top:36,right:8,zIndex:41,minWidth:146,background:"#fff",borderRadius:RAD.md,border:`1px solid ${C.border}`,boxShadow:"0 8px 24px -6px rgba(90,70,60,0.28)",overflow:"hidden"}}>
                <button role="menuitem" className="nav-menu-tap" onClick={()=>{ onEditFee({id:a.id,fee:String(a.fee||""),payDay:String(a.payDay||1)}); setFeeMenu(null); }}
                  style={{width:"100%",border:"none",background:"none",padding:"11px 13px",textAlign:"left",fontSize:FS.body,fontWeight:FW.semi,color:C.text,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:8}}>
                  <CareIcon name="pencil" size={14}/>학원비 수정
                </button>
                {hasFee&&(
                  <button role="menuitem" className="nav-menu-tap" onClick={()=>{ onDeleteFee(a.id); setFeeMenu(null); }} style={{width:"100%",border:"none",background:"none",padding:"11px 13px",textAlign:"left",fontSize:FS.body,fontWeight:FW.semi,color:C.red,cursor:"pointer",fontFamily:"inherit",borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:8}}>
                    <CareIcon name="trash" size={14}/>학원비 삭제
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      );
    })}
      </div>
      );
    })}
    {curAc.length===0&&<div style={{textAlign:"center",padding:"40px",color:C.sub,fontSize:FS.body,background:mixWhite(th.main,0.93),borderRadius:RAD.lg,border:`1.5px dashed ${th.main}40`}}>등록된 학원이 없어요</div>}
    {/* [사용자 확정 2026-08-10] 목록 아래 '＋ 학원비 항목 추가' 버튼은 뺐다 —
        학원비가 없는 학원 카드 안에 이미 '＋ 학원비 추가'가 있어 두 번 나오는 셈이었다. */}
  </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   FeeTab — 엄마용 '학원비' 화면
   ────────────────────────────────────────────────────────────────────────
   App.jsx 안에 있던 학원비 탭을 그대로 옮겼다 (CLAUDE.md 규칙 3 — 화면을 고칠 때
   그 화면을 조금씩 컴포넌트로 뺀다). 그리기만 하고 저장은 하지 않는다 —
   납부 여부·기록·학원 정보는 전부 App이 들고 있고, 여기는 받은 값을 늘어놓고
   눌림만 위로 알린다. 그래서 저장 키(v6_paid / v6_fee_pay_info)는 손대지 않는다.

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

import { C, mixWhite, mixBlack, SHADOW } from "../../data/tokens.js";
import { payMethodLabel } from "./FeePaySheet.jsx";

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
  return (
  <div>
    {/* 월 이동 — 화살표를 제목 양옆에 모아 하나의 조작 영역으로 (사용자 지적).
        연도를 같이 써서 지난달을 보다가 헷갈리지 않게 한다. */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:12,position:"relative"}}>
      <button onClick={()=>setFeeMonth(m=>Math.max(1,m-1))} className="jelly-tap" aria-label="이전 달"
        style={{background:CT.card,border:`1px solid ${C.border}`,borderRadius:10,width:28,height:28,fontSize:14,cursor:"pointer",color:C.text,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>‹</button>
      <span style={{fontWeight:900,fontSize:15.5,color:C.text}}>{new Date().getFullYear()}년 {feeMonth}월</span>
      <button onClick={()=>setFeeMonth(m=>Math.min(12,m+1))} className="jelly-tap" aria-label="다음 달"
        style={{background:CT.card,border:`1px solid ${C.border}`,borderRadius:10,width:28,height:28,fontSize:14,cursor:"pointer",color:C.text,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"inherit",flexShrink:0}}>›</button>
      {feeMonth!==thisMonth&&(
        <button onClick={()=>setFeeMonth(thisMonth)} className="jelly-tap"
          style={{position:"absolute",right:0,background:`${th.main}14`,border:`1px solid ${th.main}40`,borderRadius:9,color:th.main,fontSize:11.5,fontWeight:800,padding:"3px 9px",cursor:"pointer",fontFamily:"inherit"}}>
          이번 달
        </button>
      )}
    </div>

    {/* 요약 — [사용자 확정 2026-08-09] 3칸을 나란히 두면 금액이 길 때
        '200,00…'처럼 잘린다. 이 화면에서 제일 중요한 숫자가 잘리면 안 되므로
        총액을 위 한 줄로 빼고 아래를 납부·남은 금액 2칸으로 나눈다.
        굵기는 라벨(600) < 금액(800~900) 으로만 차이를 준다 — 셋 다 굵으면 서로 경쟁한다. */}
    {/* [사용자 확정 2026-08-10] 정보는 셋뿐인데 카드가 커서 아래 목록이 늦게 보였다 —
        높이 약 18% 축소, 그라데이션도 약하게. '2곳 중 1곳 납부'는 위 금액으로
        이미 알 수 있어 뺐다(다 냈을 때만 축하 한 줄). */}
    <div style={{background:`linear-gradient(165deg, ${mixWhite(th.main,0.96)} 0%, ${mixWhite(th.main,0.88)} 100%)`,borderRadius:16,padding:"12px 14px 11px",marginBottom:14,border:`1px solid ${th.main}2A`,boxShadow:"0 2px 8px rgba(90,70,60,0.05)"}}>
      <p style={{fontSize:11,fontWeight:600,color:C.sub,margin:0,textAlign:"center"}}>{feeMonth}월 총 학원비</p>
      <p style={{fontSize:21,fontWeight:900,color:C.text,margin:"1px 0 0",textAlign:"center",letterSpacing:-0.3}}>{won(total)}</p>
      <div style={{display:"flex",alignItems:"stretch",marginTop:9,paddingTop:9,borderTop:`1px solid ${th.main}1F`}}>
        <div style={{flex:1,minWidth:0,textAlign:"center"}}>
          <p style={{fontSize:11,fontWeight:600,color:C.sub,margin:0}}>납부 완료</p>
          <p style={{fontSize:15.5,fontWeight:800,color:C.green,margin:"2px 0 0",whiteSpace:"nowrap"}}>{won(paidSum)}</p>
        </div>
        <div style={{width:1,background:`${th.main}1F`}}/>
        <div style={{flex:1,minWidth:0,textAlign:"center"}}>
          <p style={{fontSize:11,fontWeight:600,color:C.sub,margin:0}}>남은 금액</p>
          <p style={{fontSize:15.5,fontWeight:900,color:restSum>0?C.red:C.sub,margin:"2px 0 0",whiteSpace:"nowrap"}}>{won(restSum)}</p>
        </div>
      </div>
      {(billed.length===0||restSum===0)&&(
      <p style={{fontSize:11,fontWeight:700,color:C.sub,margin:"9px 0 0",textAlign:"center",opacity:0.9}}>
        {billed.length===0
          ? "등록된 학원비가 없어요"
          : `${billed.length}곳 모두 납부했어요 🎉`}
      </p>
      )}
    </div>

    {curAc.map(a=>{
      const st=payStatus(a);
      const paid=isPaid(a.id);
      const rec=payRec(a.id);
      const hasFee=Number(a.fee||0)>0;
      return (
        /* 카드 구조 (사용자 확정)
             [학원 색 세로선] 학원명 ─────────── 상태 배지  ⋮
                              150,000원 · 매월 5일
                              (납부) 8월 5일 납부 · 계좌이체     내역 보기
                              (미납) [납부 완료 처리]
           학원 고유색은 왼쪽 세로선에만 쓴다 — 점으로 두면 민트 점이
           '납부 완료' 상태처럼 읽혀서 상태색과 섞인다.
           '매월 5일'은 금액보다 두 단계 작고 연하게 — 값끼리 시선을 나눠 갖지 않게. */
        <div key={a.id} style={{position:"relative",background:CT.card,borderRadius:14,padding:"11px 12px 11px 14px",marginBottom:9,border:`1px solid ${paid?C.green+"33":C.border}`,boxShadow:"0 2px 8px rgba(90,70,60,0.06)",display:"flex",gap:11}}>
          <div style={{width:4,borderRadius:10,background:a.color,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <p style={{fontSize:14,fontWeight:800,margin:0,flex:1,minWidth:0,color:C.text,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.name}</p>
              {/* 납부는 체크됐는데 상세 기록이 없으면(이 기능 이전에 체크만 한 건)
                  '납부 완료'라고만 쓰면 아래 안내와 모순처럼 읽힌다 → 배지에서 미리 밝힌다 */}
              {/* [사용자 확정 2026-08-10] 미납 카드가 여러 개면 같은 배지가 줄줄이 반복돼
                  화면이 붉고 답답해 보였다 → 배경과 글자색을 한 단계씩 연하게(약 12%).
                  상태는 그대로 전달되면서 카드가 차분해진다. */}
              {hasFee&&<span style={{flexShrink:0,fontSize:paid&&!rec?10.5:11.5,fontWeight:800,padding:"3px 9px",borderRadius:9,background:`${st.color}0D`,color:mixWhite(st.color,0.12),whiteSpace:"nowrap"}}>{paid&&!rec?"납부 완료 · 상세 미입력":st.label}</span>}
              <button onClick={()=>setFeeMenu(m=>m===a.id?null:a.id)} className="jelly-tap"
                aria-label={`${a.name} 더보기`} aria-expanded={feeMenu===a.id}
                style={{flexShrink:0,width:24,height:24,borderRadius:8,border:"none",background:"none",color:C.sub,fontSize:15,fontWeight:900,cursor:"pointer",fontFamily:"inherit",lineHeight:1}}>⋮</button>
            </div>
            {hasFee?(
              <p style={{margin:"3px 0 0",fontSize:15,fontWeight:800,color:C.text,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {Number(a.fee).toLocaleString()}원
                <span style={{fontSize:11.5,fontWeight:600,color:C.sub,opacity:0.8,marginLeft:6}}>
                  · 매월 {a.payDay}일
                </span>
              </p>
            ):(
              <p style={{margin:"3px 0 0",fontSize:12.5,fontWeight:600,color:C.sub,opacity:0.8}}>학원비가 등록되지 않았어요</p>
            )}
            {/* 납부 완료 — 기록이 있을 때와 없을 때를 나눈다.
                [사용자 지적] '납부 완료'인데 '납부 기록 없음'은 모순처럼 읽힌다.
                기록이 없는 건 이 기능이 생기기 전에 체크만 해 둔 건이라,
                상태를 '상세 미입력'으로 분명히 말하고 채워 넣게 안내한다. */}
            {hasFee&&paid&&rec&&(
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:5}}>
                <span style={{fontSize:11.5,fontWeight:600,color:C.sub,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {`${Number(rec.date.slice(5,7))}월 ${Number(rec.date.slice(8,10))}일 납부${rec.method?` · ${payMethodLabel(rec.method)}`:""}${rec.memo?` · ${rec.memo}`:""}`}
                </span>
                <button onClick={()=>onPay(a.id)}
                  style={{marginLeft:"auto",flexShrink:0,background:"none",border:"none",color:th.main,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",padding:"2px 0",textDecoration:"underline",textUnderlineOffset:3}}>
                  내역 보기
                </button>
              </div>
            )}
            {hasFee&&paid&&!rec&&(
              <div style={{marginTop:6,background:CT.faint,borderRadius:10,padding:"8px 10px"}}>
                <p style={{margin:0,fontSize:11.5,fontWeight:600,color:C.sub}}>납부일과 결제 방법을 입력해 주세요</p>
                <button onClick={()=>onPay(a.id)} className="jelly-tap"
                  style={{marginTop:6,padding:"6px 12px",borderRadius:9,border:`1px solid ${th.main}40`,background:th.light,color:th.main,fontSize:12.5,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                  납부 정보 추가
                </button>
              </div>
            )}
            {/* 입금 계좌 — [사용자 확정 2026-08-10] 이체할 때마다 문자를 찾아 헤매지 않게.
                눌러서 복사한다. 학원 등록에서 안 적었으면 아예 안 나온다. */}
            {hasFee&&!paid&&(a.account||"").trim()&&(
              <button onClick={()=>onCopyAccount&&onCopyAccount(a.account)} className="jelly-tap"
                style={{display:"flex",alignItems:"center",gap:6,width:"100%",marginTop:6,padding:"6px 9px",borderRadius:9,
                  border:`1px solid ${C.border}`,background:"#fff",cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
                <span style={{fontSize:12,flexShrink:0}}>🏦</span>
                <span style={{flex:1,minWidth:0,fontSize:11.5,fontWeight:700,color:C.sub,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.account}</span>
                <span style={{flexShrink:0,fontSize:11,fontWeight:800,color:th.main}}>복사</span>
              </button>
            )}
            {/* 미납 — 여기서 바로 처리한다. 시트는 오늘 날짜와 학원비가 미리 채워져 있어
                결제 방법만 고르고 저장하면 끝난다 (사용자 확정 흐름). */}
            {hasFee&&!paid&&(
              /* [사용자 확정 2026-08-10] 미납 카드마다 꽉 찬 색 버튼이 들어가니 화면이 온통
                 버튼으로 보였다(사용자 제보 "너무 요란해"). 핵심 정보는 금액과 상태인데
                 버튼이 제일 세게 보이던 상태 → 채운 버튼을 옅은 테마색 배경 + 진한 글자로
                 바꾼다. 카드 안에 버튼이 이것 하나뿐이라 눌러야 할 곳은 그대로 분명하다.
                 글자색은 테마색을 그대로 쓰면 옅은 배경에서 흐려지므로 검정을 섞어 진하게 한다. */
              <button onClick={()=>onPay(a.id)} className="jelly-tap"
                style={{width:"100%",marginTop:8,padding:"8px 10px",borderRadius:11,
                  border:`1px solid ${th.main}3A`,background:mixWhite(th.main,0.90),
                  color:mixBlack(th.main,0.30),fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>
                납부 완료로 저장
              </button>
            )}
            {!hasFee&&(
              <button onClick={()=>onEditFee({id:a.id,fee:"",payDay:String(a.payDay||1)})} className="jelly-tap"
                style={{width:"100%",marginTop:8,padding:"8px 10px",borderRadius:11,border:`1px solid ${th.main}40`,background:th.light,color:th.main,fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                ＋ 학원비 추가
              </button>
            )}
          </div>
          {/* ⋮ 더보기 — 자주 쓰지 않는 수정·삭제는 여기 안에 (사용자 확정).
              큰 삭제 버튼을 항상 띄워 두면 실수로 누를 위험이 있다. */}
          {feeMenu===a.id&&(
            <>
              <div onClick={()=>setFeeMenu(null)} style={{position:"fixed",inset:0,zIndex:40}}/>
              <div role="menu" style={{position:"absolute",top:36,right:8,zIndex:41,minWidth:146,background:"#fff",borderRadius:12,border:`1px solid ${C.border}`,boxShadow:"0 8px 24px -6px rgba(90,70,60,0.28)",overflow:"hidden"}}>
                <button role="menuitem" className="nav-menu-tap" onClick={()=>{ onEditFee({id:a.id,fee:String(a.fee||""),payDay:String(a.payDay||1)}); setFeeMenu(null); }}
                  style={{width:"100%",border:"none",background:"none",padding:"11px 13px",textAlign:"left",fontSize:13,fontWeight:800,color:C.text,cursor:"pointer",fontFamily:"inherit"}}>
                  ✏️ 학원비 수정
                </button>
                {hasFee&&(
                  <button role="menuitem" className="nav-menu-tap" onClick={()=>{ onDeleteFee(a.id); setFeeMenu(null); }} style={{width:"100%",border:"none",background:"none",padding:"11px 13px",textAlign:"left",fontSize:13,fontWeight:800,color:C.red,cursor:"pointer",fontFamily:"inherit",borderTop:`1px solid ${C.border}`}}>
                    🗑 학원비 삭제
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      );
    })}
    {curAc.length===0&&<div style={{textAlign:"center",padding:"40px",color:C.sub,fontSize:13,background:mixWhite(th.main,0.93),borderRadius:18,border:`1.5px dashed ${th.main}40`}}>등록된 학원이 없어요</div>}
    {/* [사용자 확정 2026-08-10] 목록 아래 '＋ 학원비 항목 추가' 버튼은 뺐다 —
        학원비가 없는 학원 카드 안에 이미 '＋ 학원비 추가'가 있어 두 번 나오는 셈이었다. */}
  </div>
  );
}

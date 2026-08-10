/* ════════════════════════════════════════════════════════════════════════
   AcademyTab — 엄마용 '학원' 화면 (등록 학원 목록)
   ────────────────────────────────────────────────────────────────────────
   App.jsx 안에 있던 학원 탭을 그대로 옮겼다 (CLAUDE.md 규칙 3).
   [사용자 확정 2026-08-09] 홈에 접혀 있던 '등록 학원'을 하단 메뉴의 한 칸으로
   꺼낸 화면이다. 학원 정보·셔틀·준비물·숙제는 여기서 관리한다.

   그리기만 한다 — 학원 추가·수정·복사는 전부 App의 팝업이 맡고,
   여기서는 어떤 팝업을 열지만 위로 알린다 (저장 키 v6_ac 는 손대지 않는다).

   props
     th, CT, C 계열 색 / curAc, childId, children
     onAdd()             : 학원 추가 팝업
     onEdit(ac)          : 학원 수정 팝업
     onCopy(fromChildId) : 다른 아이 학원 복사 팝업
     onSms(ac)           : 문자 보내기
     onSeedSample()      : 샘플 학원 넣어 보기
     showSample          : 설치 24시간 이내인가 (샘플 버튼 노출 여부는 App이 판단)
   ════════════════════════════════════════════════════════════════════════ */

import { C, mixWhite, SHADOW } from "../../data/tokens.js";

export default function AcademyTab({
  th, CT, curAc = [], childId, children = [], showSample = false,
  onAdd, onEdit, onCopy, onSms, onSeedSample,
}) {
  return (
  <div>
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"0 0 12px"}}>
      <span style={{fontSize:15,fontWeight:900,color:C.text,letterSpacing:0.3}}>
        📋 등록 학원{curAc.length>0&&<span style={{fontSize:13,color:C.sub,fontWeight:800}}> {curAc.length}곳</span>}
      </span>
      <div style={{flex:1,height:1,background:C.border}}/>
    </div>
    <div style={{display:"flex",gap:8,marginTop:12,marginBottom:12}}>
      <button onClick={onAdd} style={{flex:1,fontSize:13,padding:"9px 12px",borderRadius:10,border:`1px solid ${th.main}40`,background:th.light,color:th.main,fontWeight:700,cursor:"pointer"}}>+ 학원 추가</button>
      {children.filter(c=>c.id!==childId).length>0&&(
        <button onClick={()=>onCopy(children.find(c=>c.id!==childId)?.id||"")}
          style={{flex:1,fontSize:13,padding:"9px 12px",borderRadius:10,border:`1px solid ${th.main}35`,background:th.light,color:th.main,fontWeight:700,cursor:"pointer"}}>
          📚 학원 복사
        </button>
      )}
    </div>
    {curAc.length===0?(
      <div style={{textAlign:"center",padding:"28px",color:C.sub,fontSize:17,background:mixWhite(th.main,0.93),borderRadius:18,border:`1.5px dashed ${th.main}40`}}>
        <p style={{fontSize:24,margin:"0 0 8px"}}>🏫</p>위 버튼으로 학원을 등록하세요
      </div>
    ):(
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {curAc.map(ac=>(
          <div key={ac.id} style={{background:CT.card,borderRadius:16,border:`1px solid ${ac.color}45`,overflow:"hidden",boxShadow:SHADOW.sm}}>
            <div style={{background:`${ac.color}1F`,padding:"10px 13px",display:"flex",alignItems:"center",gap:9,borderBottom:`1px solid ${ac.color}22`}}>
              <div style={{width:4,height:34,borderRadius:10,background:ac.color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:15,fontWeight:900,margin:0,color:C.text}}>{ac.name}</p>
                <p style={{fontSize:13,color:C.sub,margin:"2px 0 0",fontWeight:600}}>
                  {ac.useCustomSchedule
                    ? (ac.schedules||[]).map(s=>`${s.day} ${s.time}`).join(" / ")
                    : `${(ac.days||[]).join("·")} · ${ac.time} · ${ac.duration}분`}
                </p>
              </div>
              <button onClick={()=>onEdit(ac)} style={{padding:"4px 9px",borderRadius:10,border:`1px solid ${ac.color}40`,background:"#fff",color:ac.color,fontSize:13,fontWeight:800,cursor:"pointer",flexShrink:0}}>✏️ 수정</button>
            </div>
            {/* [사용자 확정 2026-08-09] 예전엔 '›'를 눌러야 상세 모달에서 보이던 내용을
                카드에 그대로 폈다. 아래 버튼은 전화·문자만 남긴다 (수정은 위 ✏️ 버튼). */}
            <div style={{padding:"4px 13px 10px",background:"#fff"}}>
              {[["💰","월 학원비",Number(ac.fee||0)>0?`${Number(ac.fee).toLocaleString()}원`:null],
                ["🗓️","납부일",Number(ac.fee||0)>0?`매월 ${ac.payDay}일`:null],
                ["🎒","기본 준비물",(ac.baseSupplies||[]).length?(ac.baseSupplies||[]).join(", "):null],
                ["👩‍🏫","선생님",ac.teacher||null],
                ["📍","주소",ac.address||null],
              ].filter(r=>r[2]).map(([em,k,v])=>(
                <div key={k} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{fontSize:14,flexShrink:0}}>{em}</span>
                  <span style={{fontSize:13.5,color:C.sub,fontWeight:700,flexShrink:0}}>{k}</span>
                  <span style={{marginLeft:"auto",fontSize:13.5,color:C.text,fontWeight:800,textAlign:"right",wordBreak:"break-all"}}>{v}</span>
                </div>
              ))}
              {ac.memo&&(
                <div style={{marginTop:9,background:`${C.orange}0F`,border:`1px solid ${C.orange}30`,borderRadius:12,padding:"9px 11px"}}>
                  <p style={{fontSize:12.5,fontWeight:900,color:C.orange,margin:"0 0 3px"}}>📝 메모</p>
                  <p style={{fontSize:13,fontWeight:700,color:C.text,margin:0,lineHeight:1.5,whiteSpace:"pre-wrap"}}>{ac.memo}</p>
                </div>
              )}
              {ac.phone&&(
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <a href={`tel:${ac.phone}`} style={{flex:1,padding:"10px",borderRadius:12,background:`${C.green}12`,border:`1px solid ${C.green}30`,color:C.green,fontSize:13.5,fontWeight:900,textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>📞 {ac.phone}</a>
                  <button onClick={()=>onSms(ac)} className="jelly-tap"
                    style={{flex:"0 0 auto",padding:"10px 16px",borderRadius:12,background:C.purpleL,border:`1px solid ${C.purple}30`,color:C.purple,fontSize:13.5,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>💬 문자</button>
                </div>
              )}
              {!ac.phone&&(
                <button onClick={()=>onSms(ac)} className="jelly-tap"
                  style={{width:"100%",marginTop:10,padding:"10px",borderRadius:12,background:C.purpleL,border:`1px solid ${C.purple}30`,color:C.purple,fontSize:13.5,fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>💬 문자 보내기</button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
    {/* 신규 사용자용: 설치 후 24시간 이내에만 노출되는 샘플 학원 추가 버튼 */}
    {showSample && (
      <button onClick={onSeedSample}
        style={{width:"100%",marginTop:12,padding:"12px",borderRadius:14,border:`1.5px dashed ${th.main}55`,background:mixWhite(th.main,0.9),color:th.main,fontSize:13.5,fontWeight:800,cursor:"pointer",lineHeight:1.5}}>
        🌱 샘플 학원 추가해보기
        <span style={{display:"block",fontSize:11.5,fontWeight:600,color:C.sub,marginTop:2}}>처음이라면 예시 학원으로 미리 체험해보세요</span>
      </button>
    )}
  </div>
  );
}

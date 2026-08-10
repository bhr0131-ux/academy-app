/* ════════════════════════════════════════════════════════════════════════
   AcademyTab — 엄마용 '학원' 화면 (등록 학원 목록)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-10] 예전엔 학원 하나에 요일·시간·학원비·납부일·계좌·
   준비물·선생님·주소·메모·전화·문자가 전부 펼쳐져 있어서, 학원이 두 곳만 돼도
   스크롤이 길었다. '학원 관리 화면'이 아니라 '학원 정보 문서'처럼 읽혔다.

   그래서 기본은 매일 확인하는 것만 보여 준다.
     요일·시간 / 준비물 / 메모 / 전화·문자
   나머지(학원비·납부일·계좌·선생님·주소)는 '상세보기'를 눌러야 나온다 —
   매일 확인하는 정보가 아니기 때문이다.

   색은 왼쪽 세로선에만 진하게 쓰고 나머지는 아주 연하게 (테두리·머리·버튼까지
   같은 색을 반복하면 과해 보인다는 지적).

   그리기만 한다 — 학원 추가·수정·복사는 전부 App의 팝업이 맡고,
   여기서는 어떤 팝업을 열지만 위로 알린다 (저장 키 v6_ac 는 손대지 않는다).

   props
     th, CT / curAc, childId, children
     onAdd()             : 학원 추가 팝업
     onEdit(ac)          : 학원 수정 팝업
     onCopy(fromChildId) : 다른 아이 학원 복사 팝업
     onSms(ac)           : 문자 보내기
     onSeedSample()      : 샘플 학원 넣어 보기
     showSample          : 설치 24시간 이내인가 (판단은 App이 한다)
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { C, DAYS, mixWhite } from "../../data/tokens.js";
import CareIcon from "./CareIcons.jsx";

/* 요일 압축 — 월·화·수·목·금·토·일 을 전부 쓰면 글자 덩어리가 길어진다 (사용자 지적).
   이어지는 구간은 '월~일', 떨어져 있으면 '월·수·금' 으로 쓴다. */
export function daysLabel(days = []) {
  const idx = days.map(d => DAYS.indexOf(d)).filter(i => i >= 0).sort((a, b) => a - b);
  if (idx.length === 0) return "";
  if (idx.length <= 2) return idx.map(i => DAYS[i]).join("·");
  const runs = [];
  let s = idx[0], p = idx[0];
  for (const i of idx.slice(1)) {
    if (i === p + 1) { p = i; continue; }
    runs.push([s, p]); s = i; p = i;
  }
  runs.push([s, p]);
  return runs.map(([a, b]) => (b - a >= 2 ? `${DAYS[a]}~${DAYS[b]}` : DAYS.slice(a, b + 1).join("·"))).join("·");
}

/* 오전/오후 표기 — '오전 8:45' 가 '08:45' 보다 읽기 편하다 */
function ampm(t = "") {
  const [h, m] = String(t).split(":").map(Number);
  if (Number.isNaN(h)) return t;
  const ap = h < 12 ? "오전" : "오후";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${ap} ${hh}:${String(m || 0).padStart(2, "0")}`;
}

function Row({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0" }}>
      <span style={{ color: C.sub, display: "flex", flexShrink: 0, marginTop: 1 }}><CareIcon name={icon} size={13} /></span>
      <span style={{ fontSize: 12.5, color: C.sub, fontWeight: 700, flexShrink: 0 }}>{label}</span>
      <span style={{ marginLeft: "auto", fontSize: 13, color: C.text, fontWeight: 800, textAlign: "right", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

export default function AcademyTab({
  th, CT, curAc = [], childId, children = [], showSample = false,
  onAdd, onEdit, onCopy, onSms, onSeedSample,
}) {
  const [open, setOpen] = useState({});          // 상세보기를 펼친 학원 {id:true}
  const canCopy = children.filter(c => c.id !== childId).length > 0;

  return (
  <div>
    {/* 제목 줄 오른쪽에 버튼을 붙여 위쪽 높이를 줄인다 — 첫 학원 카드가 더 빨리 보인다.
        학원 추가가 기본 행동, 학원 복사는 보조 행동이라 무게를 다르게 준다 (사용자 확정). */}
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"0 0 14px"}}>
      <span style={{fontSize:14.5,fontWeight:900,color:C.text,letterSpacing:0.3,flexShrink:0}}>
        등록 학원{curAc.length>0&&<span style={{fontSize:12.5,color:C.sub,fontWeight:700}}> {curAc.length}곳</span>}
      </span>
      <div style={{flex:1,height:1,background:C.border}}/>
      <button onClick={onAdd} className="jelly-tap"
        style={{flexShrink:0,fontSize:12.5,padding:"7px 12px",borderRadius:10,border:"none",background:th.grad,color:"#fff",fontWeight:900,cursor:"pointer",fontFamily:"inherit"}}>
        ＋ 학원 추가
      </button>
      {canCopy&&(
        <button onClick={()=>onCopy(children.find(c=>c.id!==childId)?.id||"")} className="jelly-tap"
          style={{flexShrink:0,fontSize:12.5,padding:"7px 11px",borderRadius:10,border:`1px solid ${th.main}45`,background:"#fff",color:th.main,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
          복사
        </button>
      )}
    </div>

    {curAc.length===0?(
      <div style={{textAlign:"center",padding:"26px 20px",color:C.sub,background:mixWhite(th.main,0.93),borderRadius:18,border:`1.5px dashed ${th.main}40`}}>
        <p style={{fontSize:24,margin:"0 0 8px"}}>🏫</p>
        <p style={{fontSize:14,fontWeight:700,margin:0}}>위 버튼으로 학원을 등록하세요</p>
      </div>
    ):(
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {curAc.map(ac=>{
          const isOpen=!!open[ac.id];
          const supplies=(ac.baseSupplies||[]);
          const timeLine=ac.useCustomSchedule
            ? (ac.schedules||[]).map(s=>`${s.day} ${ampm(s.time)}`).join(" / ")
            : `${daysLabel(ac.days)} · ${ampm(ac.time)} · ${ac.duration}분`;
          return (
            <div key={ac.id} style={{background:"#fff",borderRadius:16,border:`1px solid ${ac.color}26`,overflow:"hidden",boxShadow:"0 2px 8px rgba(90,70,60,0.05)",display:"flex"}}>
              <div style={{width:4,background:ac.color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                {/* 머리 — 학원 이름 + 요일·시간 두 줄, 오른쪽에 수정 */}
                <div style={{background:`${ac.color}0D`,padding:"11px 13px",display:"flex",alignItems:"center",gap:9}}>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:14.5,fontWeight:900,margin:0,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ac.name}</p>
                    <p style={{fontSize:12.5,color:C.sub,margin:"4px 0 0",fontWeight:600}}>{timeLine}</p>
                  </div>
                  <button onClick={()=>onEdit(ac)} className="jelly-tap"
                    style={{flexShrink:0,display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:10,border:`1px solid ${ac.color}40`,background:"#fff",color:ac.color,fontSize:12.5,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                    <CareIcon name="pencil" size={12}/> 수정
                  </button>
                </div>

                <div style={{padding:"10px 13px 12px"}}>
                  {/* 매일 보는 것 — 준비물과 메모만 기본으로 (사용자 확정) */}
                  <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:7}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:5,flexShrink:0,color:C.sub}}>
                      <CareIcon name="bag" size={13}/><span style={{fontSize:12.5,fontWeight:700}}>준비물</span>
                    </span>
                    {supplies.length
                      ? supplies.map((s,i)=><span key={i} style={{fontSize:12.5,padding:"3px 10px",borderRadius:20,background:`${ac.color}16`,color:ac.color,fontWeight:700}}>{s}</span>)
                      : <span style={{fontSize:12,fontWeight:600,color:C.sub,opacity:0.7}}>없음</span>}
                  </div>
                  {ac.memo&&(
                    <div style={{marginTop:10,background:`${C.orange}0D`,borderRadius:11,padding:"8px 11px",display:"flex",gap:7}}>
                      <span style={{color:C.orange,flexShrink:0,marginTop:1}}><CareIcon name="memo" size={13}/></span>
                      <p style={{fontSize:12.5,fontWeight:700,color:C.text,margin:0,lineHeight:1.45,whiteSpace:"pre-wrap",minWidth:0}}>{ac.memo}</p>
                    </div>
                  )}

                  {/* 상세 — 매일 확인하지 않는 값들 */}
                  {isOpen&&(
                    <div style={{marginTop:10,paddingTop:4,borderTop:`1px solid ${C.border}`}}>
                      {Number(ac.fee||0)>0&&<Row icon="fee" label="월 학원비" value={`${Number(ac.fee).toLocaleString()}원`}/>}
                      {Number(ac.fee||0)>0&&<Row icon="calendar" label="납부일" value={`매월 ${ac.payDay}일`}/>}
                      {(ac.account||"").trim()&&<Row icon="bank" label="입금 계좌" value={ac.account}/>}
                      {ac.teacher&&<Row icon="teacher" label="선생님" value={ac.teacher}/>}
                      {ac.address&&<Row icon="pin" label="주소" value={ac.address}/>}
                      {ac.shuttleInfo&&<Row icon="shuttle" label="셔틀" value={ac.shuttleInfo}/>}
                      {(ac.baseHomeworks||[]).length>0&&<Row icon="mission" label="상시 숙제" value={(ac.baseHomeworks||[]).join(", ")}/>}
                      {!(Number(ac.fee||0)>0||ac.teacher||ac.address||ac.shuttleInfo||(ac.account||"").trim()||(ac.baseHomeworks||[]).length)&&(
                        <p style={{margin:"8px 0 2px",fontSize:12.5,fontWeight:600,color:C.sub,opacity:0.75}}>더 등록된 정보가 없어요</p>
                      )}
                    </div>
                  )}

                  {/* 전화·문자 — 기능마다 색을 달리하면 학원색과 별개의 색 체계가 하나 더 생긴다.
                      둘 다 흰 바탕에 학원색 글씨로 통일한다 (사용자 확정). */}
                  <div style={{display:"flex",gap:7,marginTop:12}}>
                    {ac.phone&&(
                      <a href={`tel:${ac.phone}`} className="jelly-tap"
                        style={{flex:1,minWidth:0,padding:"9px 8px",borderRadius:11,background:"#fff",border:`1px solid ${C.border}`,color:ac.color,fontSize:12.5,fontWeight:800,textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        <CareIcon name="phone" size={13}/><span style={{minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ac.phone}</span>
                      </a>
                    )}
                    <button onClick={()=>onSms(ac)} className="jelly-tap"
                      style={{flex:ac.phone?"0 0 auto":1,padding:"9px 14px",borderRadius:11,background:"#fff",border:`1px solid ${C.border}`,color:ac.color,fontSize:12.5,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      <CareIcon name="sms" size={13}/> 문자
                    </button>
                  </div>

                  <button onClick={()=>setOpen(p=>({...p,[ac.id]:!p[ac.id]}))} className="jelly-tap"
                    aria-expanded={isOpen} aria-label={`${ac.name} 상세보기`}
                    style={{width:"100%",height:32,marginTop:4,padding:0,border:"none",background:"none",color:C.sub,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                    {isOpen?"접기":"상세보기"}
                    <span style={{fontSize:11,transition:"transform .2s",transform:isOpen?"rotate(180deg)":"none"}}>⌄</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
    {/* 신규 사용자용: 설치 후 24시간 이내에만 노출되는 샘플 학원 추가 버튼 */}
    {showSample && (
      <button onClick={onSeedSample}
        style={{width:"100%",marginTop:14,padding:"12px",borderRadius:14,border:`1.5px dashed ${th.main}55`,background:mixWhite(th.main,0.9),color:th.main,fontSize:13.5,fontWeight:800,cursor:"pointer",lineHeight:1.5,fontFamily:"inherit"}}>
        🌱 샘플 학원 추가해보기
        <span style={{display:"block",fontSize:11.5,fontWeight:600,color:C.sub,marginTop:2}}>처음이라면 예시 학원으로 미리 체험해보세요</span>
      </button>
    )}
  </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   AcademyTab — 엄마용 '학원' 화면 (등록 학원 목록)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-10] 예전엔 학원 하나에 요일·시간·학원비·납부일·계좌·
   준비물·선생님·주소·메모·전화·문자가 전부 펼쳐져 있어서, 학원이 두 곳만 돼도
   스크롤이 길었다. '학원 관리 화면'이 아니라 '학원 정보 문서'처럼 읽혔다.

   그래서 기본은 매일 확인하는 것만 보여 준다.
     요일·시간 / 준비물 / 상시 숙제 / 메모 / 전화·문자
   나머지(학원비·납부일·계좌·선생님·주소)는 '상세보기'를 눌러야 나온다 —
   매일 확인하는 정보가 아니기 때문이다.
   [2026-08-11] 상시 숙제만 '상세보기' 안에 있어서 준비물과 짝이 안 맞았다 →
   준비물 바로 아래로 올려 같은 모양으로 늘 보이게 했다 (사용자 확정).

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
     onCopyAccount(txt)  : 입금 계좌 복사
     onOpenMap(addr)     : 주소를 지도에서 열기
     showSample          : 설치 24시간 이내인가 (판단은 App이 한다)
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { C, DAYS, mixWhite, mixBlack } from "../../data/tokens.js";
import CareIcon from "./CareIcons.jsx";

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

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

/* 상세 한 줄 — [아이콘][라벨(고정 폭)][값(오른쪽 정렬)][동작]
   [사용자 확정 2026-08-11] 계좌번호·주소처럼 긴 값이 오른쪽 끝까지 꽉 차 답답했다 →
   라벨 폭을 고정해 값이 시작하는 자리를 맞추고, 긴 값은 두 줄까지 보여 준 뒤 말줄임.
   행 간격은 2px 줄여 표가 촘촘해 보이게 한다. */
function Row({ icon, label, value, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0" }}>
      <span style={{ color: C.sub, display: "flex", flexShrink: 0, marginTop: 2 }}><CareIcon name={icon} size={12} /></span>
      <span style={{ fontSize: 12, color: C.sub, fontWeight: 700, flexShrink: 0, width: 58, marginTop: 1 }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: C.text, fontWeight: 800, textAlign: "right", lineHeight: 1.45,
        display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden", overflowWrap: "anywhere" }}>{value}</span>
      {action}
    </div>
  );
}

/* 값 오른쪽의 작은 동작 단추 (계좌 복사·지도 열기) */
function RowAct({ label, onPress, color }) {
  return (
    <button onClick={onPress} className="jelly-tap" aria-label={label}
      style={{ flexShrink: 0, marginTop: 1, padding: "1px 7px", borderRadius: 7, border: `1px solid ${color}33`,
        background: "#fff", color, fontSize: 10.5, fontWeight: 800, cursor: "pointer", fontFamily: F, whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

export default function AcademyTab({
  th, CT, curAc = [], childId, children = [], showSample = false,
  onAdd, onEdit, onCopy, onSms, onSeedSample, onCopyAccount, onOpenMap,
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
          학원 복사
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
          const homeworks=(ac.baseHomeworks||[]);
          const timeLine=ac.useCustomSchedule
            ? (ac.schedules||[]).map(s=>`${s.day} ${ampm(s.time)}`).join(" / ")
            : `${daysLabel(ac.days)} · ${ampm(ac.time)} · ${ac.duration}분`;
          return (
            <div key={ac.id} style={{background:"#fff",borderRadius:16,border:`1px solid ${ac.color}26`,overflow:"hidden",boxShadow:"0 2px 8px rgba(90,70,60,0.05)",display:"flex"}}>
              <div style={{width:4,background:ac.color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                {/* 머리 — 학원 이름 + 요일·시간 두 줄, 오른쪽에 수정 */}
                {/* [사용자 확정 2026-08-11] 카드가 아직 커서 학원이 넷이면 스크롤이 길다 →
                    머리·본문·아래 버튼의 세로 여백을 한 단계씩 줄인다. */}
                <div style={{background:`${ac.color}0D`,padding:"9px 13px",display:"flex",alignItems:"center",gap:9}}>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:14.5,fontWeight:900,margin:0,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ac.name}</p>
                    <p style={{fontSize:12.5,color:C.sub,margin:"3px 0 0",fontWeight:600}}>{timeLine}</p>
                  </div>
                  <button onClick={()=>onEdit(ac)} className="jelly-tap"
                    style={{flexShrink:0,display:"inline-flex",alignItems:"center",gap:4,padding:"5px 10px",borderRadius:10,border:`1px solid ${ac.color}40`,background:"#fff",color:ac.color,fontSize:12.5,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>
                    <CareIcon name="pencil" size={12}/> 수정
                  </button>
                </div>

                <div style={{padding:"9px 13px 6px"}}>
                  {/* 매일 보는 것 — 준비물·상시 숙제·메모만 기본으로 (사용자 확정).
                      [2026-08-11] 상시 숙제는 '상세보기' 안에 있어서 준비물만 늘 보였다 →
                      준비물 바로 아래로 옮기고 같은 모양으로 늘 보이게 한다(사용자 확정). */}
                  {/* [사용자 확정 2026-08-11] 라벨('준비물')이 값('악보')과 비슷한 크기라
                      한 덩어리로 보였다 → 라벨은 한 단계 작고 연하게, 값은 한 단계 크고 진하게.
                      아이콘도 라벨보다 작게. 눈이 값으로 먼저 간다.
                      '상시 숙제'는 관리 용어처럼 들려 '반복 숙제'로 바꿨다 — 갈 때마다 하는 숙제라는 뜻. */}
                  {[{k:"bag",   label:"준비물",   items:supplies},
                    {k:"mission",label:"반복 숙제",items:homeworks}].map((row,ri)=>(
                    <div key={row.k} style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:7,marginTop:ri?7:0}}>
                      <span style={{display:"inline-flex",alignItems:"center",gap:4,flexShrink:0,color:C.sub,opacity:0.9}}>
                        <CareIcon name={row.k} size={12}/><span style={{fontSize:11.5,fontWeight:600}}>{row.label}</span>
                      </span>
                      {row.items.length
                        ? row.items.map((s,i)=><span key={i} style={{fontSize:13,padding:"3px 10px",borderRadius:20,background:`${ac.color}16`,color:mixBlack(ac.color,0.18),fontWeight:800}}>{s}</span>)
                        : <span style={{fontSize:12,fontWeight:600,color:C.sub,opacity:0.7}}>없음</span>}
                    </div>
                  ))}
                  {ac.memo&&(
                    <div style={{marginTop:9,background:`${C.orange}0D`,borderRadius:11,padding:"8px 11px",display:"flex",gap:7}}>
                      <span style={{color:C.orange,flexShrink:0,marginTop:1}}><CareIcon name="memo" size={13}/></span>
                      {/* 메모가 길면 카드가 다시 길어진다 → 두 줄까지만 (사용자 확정) */}
                      <p style={{fontSize:12.5,fontWeight:700,color:C.text,margin:0,lineHeight:1.45,whiteSpace:"pre-wrap",minWidth:0,
                        display:"-webkit-box",WebkitBoxOrient:"vertical",WebkitLineClamp:2,overflow:"hidden"}}>{ac.memo}</p>
                    </div>
                  )}

                  {/* 상세 — 매일 확인하지 않는 값들 */}
                  {isOpen&&(
                    /* [사용자 확정 2026-08-11] 상세 표 바로 아래에 전화 버튼이 붙어 있어
                       표의 한 줄처럼 보였다 → 아래 여백을 넉넉히(16px) 줘서 '정보'와 '연락'을 나눈다.
                       대신 행끼리는 2px 촘촘하게(Row 의 padding). */
                    <div style={{marginTop:10,paddingTop:4,paddingBottom:16,borderTop:`1px solid ${C.border}`}}>
                      {Number(ac.fee||0)>0&&<Row icon="fee" label="월 학원비" value={`${Number(ac.fee).toLocaleString()}원`}/>}
                      {Number(ac.fee||0)>0&&<Row icon="calendar" label="납부일" value={`매월 ${ac.payDay}일`}/>}
                      {/* 계좌는 눌러서 복사 — 이체할 때 옮겨 적지 않아도 된다 (사용자 확정) */}
                      {(ac.account||"").trim()&&<Row icon="bank" label="입금 계좌" value={ac.account}
                        action={onCopyAccount&&<RowAct label="복사" color={ac.color} onPress={()=>onCopyAccount(ac.account)}/>}/>}
                      {ac.teacher&&<Row icon="teacher" label="선생님" value={ac.teacher}/>}
                      {ac.address&&<Row icon="pin" label="주소" value={ac.address}
                        action={onOpenMap&&<RowAct label="지도" color={ac.color} onPress={()=>onOpenMap(ac.address)}/>}/>}
                      {/* 전화번호는 아래 버튼에서 주소 밑 한 줄로 내렸다 — 버튼이 카드에서 제일 세 보였다 */}
                      {ac.phone&&<Row icon="phone" label="연락처" value={ac.phone}/>}
                      {ac.shuttleInfo&&<Row icon="shuttle" label="셔틀" value={ac.shuttleInfo}/>}
                      {!(Number(ac.fee||0)>0||ac.teacher||ac.address||ac.shuttleInfo||ac.phone||(ac.account||"").trim())&&(
                        <p style={{margin:"8px 0 2px",fontSize:12.5,fontWeight:600,color:C.sub,opacity:0.75}}>더 등록된 정보가 없어요</p>
                      )}
                    </div>
                  )}

                  {/* 전화·문자 — 기능마다 색을 달리하면 학원색과 별개의 색 체계가 하나 더 생긴다.
                      둘 다 흰 바탕에 학원색 글씨로 통일한다 (사용자 확정).
                      [2026-08-11] 전화 칸에 번호를 크게 박아 두니 준비물·숙제보다 먼저 보였다 →
                      번호는 상세의 '연락처' 줄로 내리고, 버튼은 문자와 똑같은 크기·무게로. */}
                  <div style={{display:"flex",gap:7,marginTop:11}}>
                    {ac.phone&&(
                      <a href={`tel:${ac.phone}`} className="jelly-tap" aria-label={`${ac.name} 전화`}
                        style={{flex:1,minWidth:0,padding:"9px 8px",borderRadius:11,background:"#fff",border:`1px solid ${C.border}`,color:ac.color,fontSize:12.5,fontWeight:800,textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                        <CareIcon name="phone" size={13}/> 전화
                      </a>
                    )}
                    <button onClick={()=>onSms(ac)} className="jelly-tap"
                      style={{flex:1,minWidth:0,padding:"9px 8px",borderRadius:11,background:"#fff",border:`1px solid ${C.border}`,color:ac.color,fontSize:12.5,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                      <CareIcon name="sms" size={13}/> 문자
                    </button>
                  </div>

                  <button onClick={()=>setOpen(p=>({...p,[ac.id]:!p[ac.id]}))} className="jelly-tap"
                    aria-expanded={isOpen} aria-label={`${ac.name} 상세보기`}
                    style={{width:"100%",height:30,marginTop:2,padding:0,border:"none",background:"none",color:C.sub,fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
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

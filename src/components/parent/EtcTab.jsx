/* ════════════════════════════════════════════════════════════════════════
   EtcTab — 엄마용 '기타' 화면 (설정 모음)
   ────────────────────────────────────────────────────────────────────────
   App.jsx 안에 있던 기타 탭을 그대로 옮겼다 (CLAUDE.md 규칙 3 — 화면을 고칠 때
   그 화면을 조금씩 컴포넌트로 뺀다). 그리기만 하고 저장은 하지 않는다 —
   백업·초기화·템플릿은 전부 App이 들고 있고, 여기는 눌림만 위로 알린다.

   [사용자 확정 2026-08-18] 옮기면서 점검에서 나온 것을 다 반영했다.
     · 굵기가 빠져 있던 곳(400)과 600 을 척도(900/800/700)로
     · 척도 밖 글자(12 · 11)와 모서리(12 · 18)를 FS·RAD 로
     · 버튼 치수를 큰 것(btnMain) / 작은 것(btnSmall) 두 벌로만
     · 카드 사이 간격 12 → 14 (홈·학원비·결석과 같은 값)
     · 위험구역의 생 hex 8개를 C.red 한 계열로
     · 앱 정보 카드만 달랐던 패딩·테두리를 다른 카드와 같게
     · 제목 이모지를 선 아이콘으로 (다른 탭은 2026-08-11 에 이미 바꿨다)
     · 문자관리의 '카드 안에 또 카드'를 한 단계 낮춰 옅은 칸으로

   props (D 하나로 받는다 — RewardTab·XpAdjustCard 와 같은 방식)
     th, CT, TM        : 아이 테마색 / 박스색 세트 / 용어 세트
     childId, children, kidSkin, getSkin, bakeryEnabled, skinChosen
     onOpenGuide()     : 사용 가이드 다시 보기
     onOpenModeSelect(): 게임 디자인 선택 (베이커리 출시 전에는 안 보임)
     xp                : XpAdjustCard 에 그대로 넘길 값 묶음
     smsOpen, setSmsOpen, templates, onNewTmpl(), onEditTmpl(t), onDeleteTmpl(id)
     onPinChange(), onRecoverySetup(), recoveryQuestion
     backup            : {lastDate, daysSince, daysSinceInstall, nudgeDays, nudgeFirstDays,
                          onExport, onImport(file)}
     onResetChild(), onResetAll()
   ════════════════════════════════════════════════════════════════════════ */

import { C, FS, FW, RAD, gameCard, SHADOW, mixWhite } from "../../data/tokens.js";
import CareIcon from "./CareIcons.jsx";
import XpAdjustCard from "./XpAdjustCard.jsx";

export default function EtcTab({ D }) {
  const {
    th, CT, TM, childId, children = [], kidSkin, getSkin, bakeryEnabled, skinChosen,
    onOpenGuide, onOpenModeSelect, xp,
    smsOpen, setSmsOpen, templates = [], onNewTmpl, onEditTmpl, onDeleteTmpl,
    onPinChange, onRecoverySetup, recoveryQuestion,
    backup = {}, onResetChild, onResetAll,
  } = D;

  /* ── 한 벌로 쓰는 치수 ────────────────────────────────────────────────
     카드는 전부 같은 껍데기, 버튼은 큰 것/작은 것 두 벌뿐이다. */
  const card   = { ...gameCard, padding:"15px 16px", marginBottom:14,
                   border:`1px solid ${th.main}22`, boxShadow:SHADOW.sm };
  const title  = { fontSize:FS.title, fontWeight:FW.bold, margin:"0 0 3px", color:C.text,
                   display:"flex", alignItems:"center", gap:7 };
  const sub    = { fontSize:FS.body, fontWeight:FW.normal, color:C.sub, margin:0, lineHeight:1.5 };
  const btnMain= { width:"100%", padding:12, borderRadius:RAD.md, fontSize:FS.body,
                   fontWeight:FW.bold, cursor:"pointer", fontFamily:"inherit", boxSizing:"border-box" };
  const btnSmall={ padding:"5px 11px", borderRadius:RAD.sm, fontSize:FS.sub,
                   fontWeight:FW.semi, cursor:"pointer", fontFamily:"inherit" };
  const rowBtn = { width:"100%", border:"none", background:"transparent", padding:0,
                   display:"flex", justifyContent:"space-between", alignItems:"center",
                   cursor:"pointer", textAlign:"left", fontFamily:"inherit" };
  const pill   = { fontSize:FS.tag, fontWeight:FW.semi, color:th.main, background:th.light,
                   padding:"5px 10px", borderRadius:RAD.sm, whiteSpace:"nowrap", flexShrink:0 };
  const ico    = (name)=>(<span style={{color:th.main,display:"flex",flexShrink:0}}><CareIcon name={name} size={15}/></span>);

  const { lastDate=null, daysSince=null, daysSinceInstall=null,
          nudgeDays=30, nudgeFirstDays=15, onExport, onImport } = backup;

  return (
    <div>
      {/* 사용 가이드 */}
      <div style={card}>
        <button onClick={onOpenGuide} style={rowBtn}>
          <div>
            <p style={title}>{ico("guide")}사용 가이드 다시 보기</p>
            <p style={sub}>홈부터 각 탭이 어떤 기능인지 다시 안내해요</p>
          </div>
          <span style={pill}>보기</span>
        </button>
      </div>

      {/* [사용자 확정 2026-08-17] '보상 연령대' 카드를 뺐다 — 아이 추가·수정 화면에서
          같은 일을 하게 되어 두 군데가 됐다. 고르는 자리는 하나여야 한다. */}

      {/* 게임 디자인 선택 — 베이커리 미출시 동안 숨김 */}
      {bakeryEnabled && !skinChosen && (
        <div style={card}>
          <button onClick={onOpenModeSelect} style={rowBtn}>
            <div>
              <p style={title}>{ico("star")}{children.find(c=>c.id===childId)?.name||"아이"} 게임 디자인 선택</p>
              <p style={sub}>현재: {getSkin(kidSkin).name} · 한 번 선택하면 변경할 수 없어요</p>
            </div>
            <span style={pill}>선택</span>
          </button>
        </div>
      )}

      {/* [사용자 확정 2026-08-16] 보상 탭에 있던 '수동 점수 조정'을 여기로 옮기고 잠갔다.
          점수를 직접 더하고 빼는 자리라, 잠금이 없으면 아이가 🎒 버튼으로 엄마 관리에
          넘어와 자기 점수를 올릴 수 있다. 잠금은 미션·보상과 같은 스위치를 쓴다. */}
      <XpAdjustCard D={{ TM, th, childId, ...xp, card, secTitle:title, secSub:sub }}/>

      {/* 문자관리 */}
      <div style={card}>
        <button onClick={()=>setSmsOpen(v=>!v)} style={rowBtn} aria-expanded={smsOpen}>
          <div>
            <p style={title}>{ico("sms")}문자관리</p>
            <p style={sub}>결석 안내, 보충 문의 등 문자 템플릿을 관리해요</p>
          </div>
          <span style={pill}>{smsOpen?"닫기 ▲":"열기 ▼"}</span>
        </button>

        {smsOpen&&(
          <div style={{marginTop:14}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <p style={{fontSize:FS.sub,color:C.sub,fontWeight:FW.semi,margin:0}}>문자 템플릿 관리</p>
              <button onClick={onNewTmpl}
                style={{...btnSmall,border:"none",background:th.grad,color:"#fff"}}>＋ 새 템플릿</button>
            </div>

            <div style={{background:`${C.purple}08`,border:`1px solid ${C.purple}25`,borderRadius:RAD.sm,padding:"10px 13px",marginBottom:13}}>
              <p style={{fontSize:FS.sub,color:C.purple,fontWeight:FW.semi,margin:"0 0 6px"}}>사용 가능한 변수</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                {["{아이이름}","{학원명}","{날짜}","{시간}"].map(v=>(
                  <span key={v} style={{fontSize:FS.sub,padding:"3px 9px",borderRadius:RAD.sm,background:C.purpleL,color:C.purple,fontWeight:FW.normal}}>{v}</span>
                ))}
              </div>
            </div>

            {/* [사용자 확정 2026-08-18] 흰 카드 안에 또 흰 카드가 들어가 단계가 겹쳐 보였다 →
                안쪽은 옅은 칸(그림자 없음), 그 안의 본문 미리보기만 흰색으로 뒤집는다. */}
            {templates.map(tmpl=>(
              <div key={tmpl.id} style={{background:CT.faint,borderRadius:RAD.md,padding:"12px 13px",marginBottom:10,border:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:8}}>
                  <span style={{display:"inline-flex",alignItems:"center",gap:6,minWidth:0,fontWeight:FW.semi,fontSize:FS.body,color:C.text,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    <span style={{color:C.sub,display:"flex",flexShrink:0}}><CareIcon name="sms" size={13}/></span>{tmpl.title}
                  </span>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>onEditTmpl(tmpl)}
                      style={{...btnSmall,border:`1px solid ${C.border}`,background:"#fff",color:C.sub}}>수정</button>
                    <button onClick={()=>onDeleteTmpl(tmpl.id)}
                      style={{...btnSmall,border:`1px solid ${C.red}30`,background:`${C.red}0A`,color:C.red}}>삭제</button>
                  </div>
                </div>
                <p style={{fontSize:FS.sub,fontWeight:FW.normal,color:C.sub,margin:0,whiteSpace:"pre-wrap",background:"#fff",borderRadius:RAD.sm,padding:"9px 11px",lineHeight:1.5}}>{tmpl.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 보안 */}
      <div style={card}>
        <p style={{...title,margin:"0 0 10px"}}>{ico("lock")}보안</p>
        <button onClick={onPinChange}
          style={{...btnMain,border:`1.5px solid ${C.border}`,background:CT.faint,color:C.text}}>
          비밀번호 변경
        </button>
        <button onClick={onRecoverySetup}
          style={{...btnMain,border:`1.5px solid ${C.border}`,background:CT.faint,color:C.text,marginTop:9}}>
          {recoveryQuestion?"복구 질문 변경":"복구 질문 설정"}
        </button>
      </div>

      {/* 데이터 관리 */}
      <div style={card}>
        <p style={{...title,margin:"0 0 10px"}}>{ico("save")}데이터 관리</p>

        {/* 마지막 백업 상태 배너 */}
        {(()=>{
          const never = lastDate===null;
          const stale = !never && daysSince!==null && daysSince>=nudgeDays;
          // 백업 이력이 없어도 설치 15일 전이면 경고하지 않고 순한 안내로 (신규 잔소리 방지)
          const earlyNew = never && daysSinceInstall!==null && daysSinceInstall<nudgeFirstDays;
          const warn = (never && !earlyNew) || stale;
          const txt = earlyNew ? "기록이 쌓이면 백업을 안내해 드릴게요"
                    : never    ? "아직 백업한 적이 없어요"
                    : daysSince===0 ? "오늘 백업했어요 ✓"
                    : `마지막 백업: ${daysSince}일 전`;
          return (
            <div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"9px 12px",borderRadius:RAD.md,marginBottom:10,
              background:warn?`${C.red}12`:`${th.main}10`,border:`1px solid ${warn?C.red+"44":th.main+"22"}`}}>
              <span style={{color:warn?C.red:C.sub,display:"flex",flexShrink:0,marginTop:1}}>
                <CareIcon name={warn?"warn":"save"} size={14}/>
              </span>
              <span style={{fontSize:FS.sub,fontWeight:FW.semi,color:warn?C.red:C.sub,lineHeight:1.45,wordBreak:"keep-all"}}>
                {txt}{warn&&<><br/><span style={{fontWeight:FW.normal}}>기기를 바꾸거나 앱을 지우면 기록이 사라져요. 백업을 권장해요.</span></>}
              </span>
            </div>
          );
        })()}

        <button onClick={onExport}
          style={{...btnMain,border:"none",background:th.grad,color:"#fff",marginBottom:9}}>
          데이터 백업하기
        </button>

        <label style={{...btnMain,display:"block",border:`1.5px solid ${th.main}35`,background:th.light,color:th.main,textAlign:"center"}}>
          데이터 복원하기
          <input type="file" accept="application/json"
            onChange={e=>onImport(e.target.files?.[0])} style={{display:"none"}}/>
        </label>

        <p style={{fontSize:FS.tag,fontWeight:FW.normal,color:C.sub,lineHeight:1.5,margin:"9px 0 0"}}>
          ※ 다른 기기에서도 복원하여 사용할 수 있습니다.
        </p>
      </div>

      {/* [사용자 확정 2026-08-16] '학부모 오픈채팅' → '버그 신고'.
          들어가는 곳은 같은 카카오톡 오픈채팅방이고, 무엇을 하러 가는 자리인지를 이름으로 쓴다. */}
      <div style={card}>
        <p style={title}>{ico("bug")}버그 신고</p>
        <p style={{...sub,margin:"0 0 12px"}}>카카오톡 오픈채팅방에서 버그 신고·문의를 함께 나눠요.</p>
        <button
          onClick={()=>window.open("https://open.kakao.com/o/g6H6WgFi","_blank","noopener,noreferrer")}
          style={{...btnMain,border:`1px solid ${C.border}`,background:mixWhite("#FEE500",0.45),color:"#3C1E1E",
            display:"flex",alignItems:"center",justifyContent:"center",gap:7}}>
          <CareIcon name="sms" size={15}/> 오픈채팅방 입장하기
        </button>
      </div>

      {/* 위험구역 — [사용자 확정 2026-08-18] 생 hex 8개를 쓰던 것을 C.red 한 계열로.
          되돌릴 수 없는 자리라 빨강은 그대로 두되, 앱이 쓰는 빨강 하나만 쓴다.
          두 버튼은 '이 아이만'(연함) / '전부'(진함) 로 무게를 나눈다. */}
      <div style={{...card,border:`1px solid ${C.red}40`,background:`${C.red}06`}}>
        <p style={{...title,color:C.red,margin:"0 0 4px"}}>
          <span style={{color:C.red,display:"flex",flexShrink:0}}><CareIcon name="warn" size={15}/></span>위험구역
        </p>
        <p style={{...sub,color:C.red,margin:"0 0 12px",opacity:0.85}}>
          초기화는 되돌릴 수 없어요. 미리 데이터 백업을 권장해요.
        </p>
        <button onClick={onResetChild}
          style={{...btnMain,border:`1.5px solid ${C.red}40`,background:"#fff",color:C.red,marginBottom:9}}>
          현재 아이 초기화
        </button>
        <button onClick={onResetAll}
          style={{...btnMain,border:`1.5px solid ${C.red}55`,background:`${C.red}12`,color:C.red}}>
          전체 데이터 초기화
        </button>
      </div>

      {/* 앱 정보 — 다른 카드와 같은 패딩·테두리 (사용자 점검: 이 카드만 달랐다) */}
      <div style={{...card,marginBottom:0,textAlign:"center"}}>
        <p style={{...title,justifyContent:"center",margin:"0 0 6px"}}>{ico("info")}앱 정보</p>
        <p style={{fontSize:FS.body,fontWeight:FW.bold,color:C.text,margin:"0 0 3px"}}>미션팡</p>
        <p style={{fontSize:FS.tag,fontWeight:FW.normal,color:C.sub,margin:"0 0 6px"}}>버전 1.0</p>
        <p style={{fontSize:FS.tag,fontWeight:FW.normal,color:C.sub,margin:0,lineHeight:1.5}}>
          학원 일정과 아이의 숙제를 게임처럼 관리하는 플래너
        </p>
        {/* [사용자 확정 2026-08-17] 보상 그림으로 Twemoji 를 쓴다 — CC-BY 4.0 은
            저작자 표시를 요구하므로 여기 한 줄로 밝힌다 (자세한 건
            public/assets/emoji/NOTICE.txt). */}
        <p style={{fontSize:FS.tag,fontWeight:FW.normal,color:C.sub,opacity:0.7,margin:"8px 0 0",lineHeight:1.5}}>
          보상 그림: Twemoji © Twitter, Inc and other contributors · CC-BY 4.0
        </p>
      </div>
    </div>
  );
}

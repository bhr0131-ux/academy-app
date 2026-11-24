import { useState } from "react";
import { C, FS, FW, RAD, mixBlack } from "../../data/tokens.js";
import { REWARD_SETS_BY_AGE } from "../../data/characters.js";
import CareIcon from "./CareIcons.jsx";
import EmojiIcon from "../EmojiIcon.jsx";
import RewardApprovals from "./RewardApprovals.jsx";
import SectionHead from "./SectionHead.jsx";

/* ════════════════════════════════════════════════════════════════════════
   RewardTab — 엄마용 '보상' 탭 (구매 승인 · 보상 관리)
   ────────────────────────────────────────────────────────────────────────
   App.jsx에서 분리 (CLAUDE.md 3 — 기존 화면 점진 분리).
   [사용자 확정 2026-08-16] '성장 관리'·'기록 관리' 두 칸을 뺐다 (아래 주석 참고).
   상태와 게임 로직은 전부 App이 갖고 있고, 필요한 값·함수는 D 하나로 받는다
   (HeroStage 와 같은 방식).
   ════════════════════════════════════════════════════════════════════════ */
export default function RewardTab({ D }) {
  const {
    CT, TM, PT = { role:"엄마" },
    approveRewardRequest, childId, children, curChild, deleteReward,
    getChildRewardRequests, getChildRewards, openEditReward,
    rewardAgeGroup,
    setEditingRewardId, setPendingReject, setRewardForm, setShowRewardModal,
    th, parentLocked, unlockRewardManage, rewardSecOpen,
    /* [사용자 확정 2026-11-24] 미션 탭 맨 아래에 '접힌 보상 관리'로 들어간다(embedded).
       승인 대기는 미션 탭 위쪽에 따로 그리므로 여기선 뺀다. 머리 오른쪽 끝에 작은 '연령대 변경'. */
    embedded = false, open = true, setOpen, onPickAge,
  } = D;
  const [ageOpen, setAgeOpen] = useState(false);
  const ageOpts = [...Object.entries(REWARD_SETS_BY_AGE).map(([k, v]) => ({ k, label: v.label, emoji: v.emoji })), { k: "custom", label: "나만의 목록", emoji: "✏️" }];
  const ageNote = rewardAgeGroup === "custom" ? "나만의 목록" : (REWARD_SETS_BY_AGE[rewardAgeGroup] || REWARD_SETS_BY_AGE.kid).label;
  /* 보상 목록(+ 추가 버튼) — 탭에서는 그대로, 미션 탭(embedded)에서는 상자 안에 넣는다 */
  const embeddedList = () => {
        /* [사용자 확정 2026-08-16] 보상 탭 자체는 열려 있고(승인만 하러 들르는 일이 많다),
           목록을 고치는 것만 비밀번호로 막는다. 잠겨 있으면 '＋ 보상 추가'와 항목별
           수정·삭제를 감추고 자물쇠 버튼 하나만 둔다 — 열면 예전 화면 그대로 돌아온다. */
        const canEdit=!parentLocked();
        return (
          <div style={{marginTop:14}}>
            {/* [2026-08-16] 바깥 흰 카드를 벗기면서 줄 배경도 뒤집었다 —
                옅은 회색(CT.faint)은 흰 카드 위에 있을 때만 구분됐고, 배경 위로 나오니
                바탕과 거의 같은 색이 됐다(대비 1.04). 미션 카드와 같은 규칙으로 흰 줄. */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {getChildRewards().slice().sort((a,b)=>a.point-b.point).map(reward=>(
                <div key={reward.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:RAD.md,background:"#fff",border:`1px solid ${C.border}`}}>
                  {/* [사용자 확정 2026-08-17] 잠겨 있을 때는 한 줄 — 이름 왼쪽, 값 오른쪽 끝.
                      값이 한 세로줄에 모여 보상끼리 견주기 쉽고 목록도 짧아진다(61 → 45).
                      열면 수정·삭제가 오른쪽을 차지해 값이 낄 자리가 없다 → 그때만 예전처럼
                      이름 아래 두 줄로 내린다. */}
                  <EmojiIcon emoji={reward.emoji} size={24}/>
                  {canEdit?(
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:FS.title,fontWeight:FW.semi,margin:0,color:C.text,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{reward.title}</p>
                      <p style={{fontSize:FS.body,color:C.sub,fontWeight:FW.normal,margin:"2px 0 0"}}>
                        {reward.point} <EmojiIcon emoji={TM.coinEmoji} size={FS.body} style={{verticalAlign:"-0.18em",marginRight:3}}/> {TM.coin} 필요
                      </p>
                    </div>
                  ):(
                    <>
                      <p style={{flex:1,minWidth:0,fontSize:FS.title,fontWeight:FW.semi,margin:0,color:C.text,
                        overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{reward.title}</p>
                      <span style={{flexShrink:0,fontSize:FS.body,color:C.sub,fontWeight:FW.normal,whiteSpace:"nowrap"}}>
                        <EmojiIcon emoji={TM.coinEmoji} size={FS.body} style={{verticalAlign:"-0.18em",marginRight:3}}/> {reward.point}{TM.coin}
                      </span>
                    </>
                  )}
                  {canEdit&&(
                  /* 두 줄짜리 줄이라 수정·삭제는 예전처럼 세로로 쌓는다 */
                  <div style={{display:"flex",flexDirection:"column",gap:5,flexShrink:0}}>
                    <button onClick={()=>openEditReward(reward)}
                      style={{border:`1px solid ${th.main}30`,background:th.light,color:th.main,borderRadius:RAD.sm,padding:"5px 9px",fontSize:FS.body,fontWeight:FW.semi,cursor:"pointer",fontFamily:"inherit"}}>
                      수정
                    </button>
                    <button onClick={()=>deleteReward(reward.id)}
                      style={{border:`1px solid ${C.red}30`,background:`${C.red}0A`,color:C.red,borderRadius:RAD.sm,padding:"5px 9px",fontSize:FS.body,fontWeight:FW.semi,cursor:"pointer",fontFamily:"inherit"}}>
                      삭제
                    </button>
                  </div>
                  )}
                </div>
              ))}
            </div>
            {/* [사용자 확정 2026-08-17] 이 버튼이 목록 위에 있어 보상을 보려면 늘 지나쳐야 했다 →
                목록 아래로 내린다. 미션 탭의 잠금 칸과 같은 자리(맨 아래)·같은 모양이다.
                잠겼을 때와 열렸을 때 자리가 같아 비밀번호를 넣어도 화면이 안 흔들린다. */}
            {canEdit?(
            <button onClick={()=>{ setEditingRewardId(null); setRewardForm({title:"",point:300,emoji:"🎁",grade:"common"}); setShowRewardModal(true); }}
              style={{width:"100%",border:"none",background:th.grad,color:"#fff",borderRadius:RAD.sm,padding:"10px 12px",fontSize:FS.body,fontWeight:FW.bold,cursor:"pointer",marginTop:10,fontFamily:"inherit"}}>
              + 보상 추가
            </button>
            ):(
            <button onClick={unlockRewardManage} className="jelly-tap"
              style={{width:"100%",marginTop:10,padding:"9px 12px",borderRadius:RAD.md,background:`${th.main}0E`,border:`1px solid ${th.main}33`,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",alignItems:"flex-start",gap:7}}>
              <span style={{color:th.main,display:"flex",flexShrink:0,marginTop:1}}><CareIcon name="lock" size={14}/></span>
              <span style={{minWidth:0}}>
                <span style={{display:"block",fontSize:FS.sub,fontWeight:FW.semi,color:mixBlack(th.main,0.25)}}>{PT.role} 권한 잠금</span>
                <span style={{display:"block",fontSize:FS.tag,fontWeight:FW.normal,color:C.sub,marginTop:2}}>보상 추가·수정·삭제</span>
              </span>
            </button>
            )}
          </div>
        );
  };
  return (
    <div>

      {!embedded&&<RewardApprovals
        requests={getChildRewardRequests(childId).filter(r=>r.status==="pending")}
        childName={curChild?.name||""} showWho={children.length>1}
        coinLabel={TM.coin} th={th} CT={CT}
        onApprove={approveRewardRequest}
        /* 거절은 코인을 돌려주고 되돌릴 수 없다 → 한 번 물어본다 (사용자 확정 2026-08-11) */
        onReject={(req)=>setPendingReject(req)} />}

      {/* 보상 관리 — 바깥 카드 없이 배경 위에 바로 (사용자 확정 2026-08-16)
          [사용자 확정 2026-08-16] 더는 접히지 않는다 — 이 탭에서 늘 펼쳐 두는 자리라
          접는 기능과 화살표를 뺐다. 제목은 이제 버튼이 아니라 그냥 글이다. */}
      <div style={rewardSecOpen}>
        {/* [사용자 확정 2026-08-16] 홈의 '오늘의 학원'과 같은 구역 머리로 바꿨다.
            아랫줄로 길게 적던 설명은 자리가 없어져, 그중 실제 정보인 연령대만
            이름 뒤 옅은 글씨로 옮긴다 ('3곳'이 붙던 자리). */}
        {embedded?(
          /* [사용자 확정 2026-11-24] '미션 추가·관리'와 같은 칸 — 테마색 머리 안에 '보상 관리 · 연령대 · [연령대 변경] · ⌄'.
             개수는 뺐다. 누르면 아래 흰 칸에 목록이 펼쳐진다. */
          <div style={{borderRadius:12,overflow:"hidden",boxShadow:"0 2px 10px rgba(20,24,60,0.06)",border:`1px solid ${C.border}`,background:"#fff"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,background:th.grad,padding:"0 4px 0 4px"}}>
              <button onClick={()=>setOpen&&setOpen(!open)} aria-expanded={open} className="jelly-tap"
                style={{flex:1,minWidth:0,display:"flex",alignItems:"center",gap:7,border:"none",background:"none",padding:"12px 6px 12px 10px",cursor:"pointer",fontFamily:"inherit",textAlign:"left",color:"#fff"}}>
                {/* 좁은 폰에서 연령대 글자가 잘리지 않게 선물 그림은 뺐다 */}
                <span style={{fontSize:FS.cardTitle,fontWeight:FW.bold,flexShrink:0}}>보상 관리</span>
                <span style={{fontSize:FS.sub,fontWeight:FW.semi,opacity:0.92,flexShrink:0,whiteSpace:"nowrap"}}>{ageNote}</span>
              </button>
              <button onClick={()=>{ setAgeOpen(v=>!v); if(setOpen&&!open) setOpen(true); }} aria-expanded={ageOpen} className="jelly-tap"
                style={{flexShrink:0,border:`1px solid ${C.border}`,background:"#fff",color:C.sub,borderRadius:RAD.sm,padding:"5px 8px",fontSize:FS.tag,fontWeight:FW.semi,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{/* 버튼 모양은 예전(흰 바탕·회색 테두리) 그대로 (사용자 확정 2026-11-24) */}
                연령대 변경
              </button>
              {/* 펼침 표시 — 오른쪽 끝. 글자 ⌄ 는 작게 나와 선 그림으로 키웠다 (사용자 확정 2026-11-24) */}
              <button onClick={()=>setOpen&&setOpen(!open)} aria-label={open?"보상 목록 접기":"보상 목록 펼치기"} className="jelly-tap"
                style={{flexShrink:0,width:30,height:34,border:"none",background:"none",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" style={{transition:"transform .2s",transform:open?"rotate(180deg)":"none"}}>
                  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            {(open||ageOpen)&&(
            <div style={{padding:"0 12px 12px"}}>
            {ageOpen&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:7,marginTop:12}}>
                {ageOpts.map(o=>{ const on=rewardAgeGroup===o.k; return (
                  /* 고르면 '목록이 통째로 바뀐다'는 확인 창이 한 번 뜬다(App 의 pendingAgeChange) */
                  <button key={o.k} onClick={()=>{ setAgeOpen(false); if(!on&&onPickAge) onPickAge(o.k); }}
                    style={{padding:"9px 8px",borderRadius:RAD.md,cursor:on?"default":"pointer",fontFamily:"inherit",
                      border:`1.5px solid ${on?th.main:C.border}`,background:on?`${th.main}12`:"#fff",
                      color:on?th.main:C.sub,fontSize:FS.body,fontWeight:on?FW.bold:FW.semi,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                    <EmojiIcon emoji={o.emoji} size={15}/>{o.label}
                  </button>
                ); })}
              </div>
            )}
            {open&&embeddedList()}
            </div>
            )}
          </div>
        ):(
        <SectionHead icon="reward" label="보상 관리" th={th} note={ageNote}/>
        )}
        {!embedded&&embeddedList()}
      </div>

      {/* 꾸미기 상점은 카탈로그 기본 가격으로 자동 운영 — 부모 가격 설정 UI 제거 */}

      {/* [사용자 확정 2026-08-16] '성장 관리'(보물창고·연속 달성·상장)와
          '기록 관리'(활동 기록·점수 통장)를 뺐다 — 엄마용에서 들여다볼 일이 없었고,
          같은 내용은 아이용 캐릭터 탭에서 아이가 직접 본다.
          지우는 것은 보여 주는 칸뿐이라 저장된 기록·상장·연속 달성 값은 그대로 남는다. */}


        {/* [사용자 확정 2026-08-16] '수동 점수 조정'은 '기타' 탭으로 옮겼다 —
            점수를 직접 더하고 빼는 자리라 비밀번호로 잠가야 하는데, 보상 탭은
            승인만 하러 들르는 열린 자리라 성격이 맞지 않았다.
            화면은 components/parent/XpAdjustCard.jsx 로 뺐다. */}
    </div>
  );
}

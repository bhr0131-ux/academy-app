import { C } from "../../data/tokens.js";
import { REWARD_SETS_BY_AGE } from "../../data/characters.js";
import CareIcon from "./CareIcons.jsx";
import RewardApprovals from "./RewardApprovals.jsx";
import SectionHead from "./SectionHead.jsx";

/* ════════════════════════════════════════════════════════════════════════
   RewardTab — 엄마용 '보상' 탭 (구매 승인 · 보상 관리 · 수동 점수 조정)
   ────────────────────────────────────────────────────────────────────────
   App.jsx에서 분리 (CLAUDE.md 3 — 기존 화면 점진 분리).
   [사용자 확정 2026-08-16] '성장 관리'·'기록 관리' 두 칸을 뺐다 (아래 주석 참고).
   상태와 게임 로직은 전부 App이 갖고 있고, 필요한 값·함수는 D 하나로 받는다
   (HeroStage 와 같은 방식).
   ════════════════════════════════════════════════════════════════════════ */
export default function RewardTab({ D }) {
  const {
    CT, TM, addChildScore,
    approveRewardRequest, childId, children, curChild, deleteReward,
    getChildRewardRequests, getChildRewards, openEditReward,
    rewardAgeGroup, rewardSecArrow, rewardSecCard,
    rewardSecSub, rewardSecTitle, setEditingRewardId, setPendingReject, setRewardForm, setShowRewardModal,
    setXpAdjustInput, setXpAdjustLabel, setXpAdjustSign,
    showParentXpAdjust, showToast, th, toggleRewardSec, xpAdjustInput, xpAdjustLabel,
    xpAdjustSign, parentLocked, unlockRewardManage, rewardSecOpen,
  } = D;
  return (
    <div>

      <RewardApprovals
        requests={getChildRewardRequests(childId).filter(r=>r.status==="pending")}
        childName={curChild?.name||""} showWho={children.length>1}
        coinLabel={TM.coin} th={th} CT={CT}
        onApprove={approveRewardRequest}
        /* 거절은 코인을 돌려주고 되돌릴 수 없다 → 한 번 물어본다 (사용자 확정 2026-08-11) */
        onReject={(req)=>setPendingReject(req)} />

      {/* 보상 관리 — 바깥 카드 없이 배경 위에 바로 (사용자 확정 2026-08-16)
          [사용자 확정 2026-08-16] 더는 접히지 않는다 — 이 탭에서 늘 펼쳐 두는 자리라
          접는 기능과 화살표를 뺐다. 제목은 이제 버튼이 아니라 그냥 글이다. */}
      <div style={rewardSecOpen}>
        {/* [사용자 확정 2026-08-16] 홈의 '오늘의 학원'과 같은 구역 머리로 바꿨다.
            아랫줄로 길게 적던 설명은 자리가 없어져, 그중 실제 정보인 연령대만
            이름 뒤 옅은 글씨로 옮긴다 ('3곳'이 붙던 자리). */}
        <SectionHead icon="reward" label="보상 관리" th={th}
          note={rewardAgeGroup==="custom"?"나만의 목록":(REWARD_SETS_BY_AGE[rewardAgeGroup]||REWARD_SETS_BY_AGE.kid).label}/>
        {(()=>{
        /* [사용자 확정 2026-08-16] 보상 탭 자체는 열려 있고(승인만 하러 들르는 일이 많다),
           목록을 고치는 것만 비밀번호로 막는다. 잠겨 있으면 '＋ 보상 추가'와 항목별
           수정·삭제를 감추고 자물쇠 버튼 하나만 둔다 — 열면 예전 화면 그대로 돌아온다. */
        const canEdit=!parentLocked();
        return (
          <div style={{marginTop:14}}>
            {canEdit?(
            <button onClick={()=>{ setEditingRewardId(null); setRewardForm({title:"",point:300,emoji:"🎁",grade:"common"}); setShowRewardModal(true); }}
              style={{width:"100%",border:"none",background:th.grad,color:"#fff",borderRadius:10,padding:"10px 12px",fontSize:13,fontWeight:900,cursor:"pointer",marginBottom:10}}>
              + 보상 추가
            </button>
            ):(
            <button onClick={unlockRewardManage} className="jelly-tap"
              style={{width:"100%",border:`1px solid ${th.main}33`,background:`${th.main}0E`,color:th.main,borderRadius:10,padding:"10px 12px",fontSize:13,fontWeight:900,cursor:"pointer",marginBottom:10,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              <CareIcon name="lock" size={14}/> 보상 추가·수정·삭제
            </button>
            )}
            {/* [2026-08-16] 바깥 흰 카드를 벗기면서 줄 배경도 뒤집었다 —
                옅은 회색(CT.faint)은 흰 카드 위에 있을 때만 구분됐고, 배경 위로 나오니
                바탕과 거의 같은 색이 됐다(대비 1.04). 미션 카드와 같은 규칙으로 흰 줄. */}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {getChildRewards().slice().sort((a,b)=>a.point-b.point).map(reward=>(
                <div key={reward.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:14,background:"#fff",border:`1px solid ${C.border}`}}>
                  <span style={{fontSize:24}}>{reward.emoji}</span>
                  <div style={{flex:1}}>
                    <p style={{fontSize:15,fontWeight:900,margin:0,color:C.text}}>{reward.title}</p>
                    <p style={{fontSize:13,color:C.sub,fontWeight:700,margin:"2px 0 0"}}>{reward.point} {TM.coinEmoji} {TM.coin} 필요</p>
                  </div>
                  {canEdit&&(
                  <div style={{display:"flex",flexDirection:"column",gap:5}}>
                    <button onClick={()=>openEditReward(reward)}
                      style={{border:`1px solid ${th.main}30`,background:th.light,color:th.main,borderRadius:10,padding:"5px 9px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
                      수정
                    </button>
                    <button onClick={()=>deleteReward(reward.id)}
                      style={{border:`1px solid ${C.red}30`,background:`${C.red}0A`,color:C.red,borderRadius:10,padding:"5px 9px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
                      삭제
                    </button>
                  </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
        })()}
      </div>

      {/* 꾸미기 상점은 카탈로그 기본 가격으로 자동 운영 — 부모 가격 설정 UI 제거 */}

      {/* [사용자 확정 2026-08-16] '성장 관리'(보물창고·연속 달성·상장)와
          '기록 관리'(활동 기록·점수 통장)를 뺐다 — 엄마용에서 들여다볼 일이 없었고,
          같은 내용은 아이용 캐릭터 탭에서 아이가 직접 본다.
          지우는 것은 보여 주는 칸뿐이라 저장된 기록·상장·연속 달성 값은 그대로 남는다. */}


        {/* ── 수동 XP 조정 — 기록 관리 밖으로 빼서 그 아래 독립 칸으로 (사용자 확정 2026-08-09) ── */}
        <div style={rewardSecCard}>
          <button onClick={e=>toggleRewardSec("xp",e)}
            style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"inherit"}}>
            <div style={{textAlign:"left",minWidth:0}}>
              <p style={rewardSecTitle}>수동 {TM.xp} 조정</p>
              <p style={rewardSecSub}>보너스 지급 / {TM.xp} 차감</p>
            </div>
            <span aria-hidden="true" style={rewardSecArrow(showParentXpAdjust)}>⌄</span>
          </button>
          {showParentXpAdjust&&(
            <div style={{marginTop:12}}>
              <div style={{display:"flex",gap:6,marginBottom:8}}>
                <button onClick={()=>setXpAdjustSign("+")}
                  style={{flex:1,padding:"8px 0",borderRadius:10,border:`1.5px solid ${xpAdjustSign==="+"?C.green:C.border}`,background:xpAdjustSign==="+"?`${C.green}15`:"#fff",color:xpAdjustSign==="+"?C.green:C.sub,fontSize:13,fontWeight:900,cursor:"pointer"}}>
                  + 지급
                </button>
                <button onClick={()=>setXpAdjustSign("-")}
                  style={{flex:1,padding:"8px 0",borderRadius:10,border:`1.5px solid ${xpAdjustSign==="-"?C.red:C.border}`,background:xpAdjustSign==="-"?`${C.red}10`:"#fff",color:xpAdjustSign==="-"?C.red:C.sub,fontSize:13,fontWeight:900,cursor:"pointer"}}>
                  - 차감
                </button>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <input value={xpAdjustLabel} onChange={e=>setXpAdjustLabel(e.target.value)}
                  placeholder="사유"
                  style={{flex:1,padding:"9px 10px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:13,outline:"none",background:"#fff",minWidth:0}}/>
                <input type="number" value={xpAdjustInput} onChange={e=>setXpAdjustInput(e.target.value)}
                  placeholder={TM.xp}
                  style={{width:58,padding:"9px 6px",borderRadius:10,border:`1px solid ${C.border}`,fontSize:13,outline:"none",background:"#fff",textAlign:"center",flexShrink:0}}/>
                <button onClick={()=>{
                  const v=Number(xpAdjustInput);
                  if(!v||v<=0){ showToast(`${TM.xp} 값을 입력해줘`); return; }
                  const point=xpAdjustSign==="+"?v:-v;
                  addChildScore(childId,point,xpAdjustLabel||"수동 조정","manual");
                  setXpAdjustInput(""); setXpAdjustLabel("");
                  showToast(xpAdjustSign==="+"?`+${v}${TM.xpUnit} 지급 완료`:`-${v}${TM.xpUnit} 차감 완료`);
                }} style={{padding:"9px 14px",borderRadius:10,border:"none",background:xpAdjustSign==="+"?C.green:C.red,color:"#fff",fontSize:13,fontWeight:900,cursor:"pointer",flexShrink:0}}>
                  {xpAdjustSign==="+"?"지급":"차감"}
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

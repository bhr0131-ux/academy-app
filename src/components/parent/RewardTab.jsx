import { C } from "../../data/tokens.js";
import { REWARD_SETS_BY_AGE } from "../../data/characters.js";
import RewardApprovals from "./RewardApprovals.jsx";

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
    setXpAdjustInput, setXpAdjustLabel, setXpAdjustSign, showParentRewardManage,
    showParentXpAdjust, showToast, th, toggleRewardSec, xpAdjustInput, xpAdjustLabel,
    xpAdjustSign,
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

      {/* 보상 관리 */}
      <div style={rewardSecCard}>
        <button onClick={e=>toggleRewardSec("reward",e)}
          style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"inherit"}}>
          <div style={{textAlign:"left",minWidth:0}}>
            <p style={rewardSecTitle}>보상 관리</p>
            {/* '어린이용' 뒤에 '용'을 또 붙여 '어린이용용'이 됐다 — 이모지를 떼면서 드러났다 */}
            <p style={rewardSecSub}>{rewardAgeGroup==="custom"?"나만의 목록":(REWARD_SETS_BY_AGE[rewardAgeGroup]||REWARD_SETS_BY_AGE.kid).label} · 보상승인 · 추가/삭제</p>
          </div>
          <span aria-hidden="true" style={rewardSecArrow(showParentRewardManage)}>⌄</span>
        </button>
        {showParentRewardManage&&(
          <div style={{marginTop:14}}>
            <button onClick={()=>{ setEditingRewardId(null); setRewardForm({title:"",point:300,emoji:"🎁",grade:"common"}); setShowRewardModal(true); }}
              style={{width:"100%",border:"none",background:th.grad,color:"#fff",borderRadius:10,padding:"10px 12px",fontSize:13,fontWeight:900,cursor:"pointer",marginBottom:10}}>
              + 보상 추가
            </button>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {getChildRewards().slice().sort((a,b)=>a.point-b.point).map(reward=>(
                <div key={reward.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:14,background:CT.faint,border:`1px solid ${C.border}`}}>
                  <span style={{fontSize:24}}>{reward.emoji}</span>
                  <div style={{flex:1}}>
                    <p style={{fontSize:15,fontWeight:900,margin:0,color:C.text}}>{reward.title}</p>
                    <p style={{fontSize:13,color:C.sub,fontWeight:700,margin:"2px 0 0"}}>{reward.point} {TM.coinEmoji} {TM.coin} 필요</p>
                  </div>
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
                </div>
              ))}
            </div>
          </div>
        )}
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

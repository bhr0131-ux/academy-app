import { C } from "../../data/tokens.js";
import { evoMsgView } from "../../data/gameData.jsx";
import { ADV_CHAR_IMG, ADV_CHAR_STAGE_OF, BAKERY_CHAR_IMG, REWARD_SETS_BY_AGE, TITLE_RARITY, getBoxInfo } from "../../data/characters.js";
import CareIcon from "./CareIcons.jsx";
import RewardApprovals from "./RewardApprovals.jsx";

/* ════════════════════════════════════════════════════════════════════════
   RewardTab — 엄마용 '보상' 탭 (보상 관리 · 성장 관리 · 기록 관리 · 수동 XP 조정)
   ────────────────────────────────────────────────────────────────────────
   App.jsx에서 분리 (CLAUDE.md 3 — 기존 화면 점진 분리).
   내용은 분리 전 JSX 그대로다 — 로직·화면 변경 없음.
   상태와 게임 로직은 전부 App이 갖고 있고, 필요한 값·함수는 D 하나로 받는다
   (HeroStage 와 같은 방식).
   ════════════════════════════════════════════════════════════════════════ */
export default function RewardTab({ D }) {
  const {
    CT, GP, LOG_ICON, T, TM, addChildScore,
    approveRewardRequest, childId, children, curChild, deleteReward, getAdventureLogInfo,
    getAllTitles, getBestStreak, getCharacterEvolution, getChildCoin, getChildLevel, getChildRewardRequests,
    getChildRewards, getChildTreasure, getChildXP, getLevelProgressInfo, getNextLevel, getQuestStreak,
    getScoreHistory, getSelectedTitle, getTotalTreasureCount, getUnlockedTitles, kidSkin, openEditReward,
    parentInnerSub, parentInnerTitle, rewardAgeGroup, rewardSecArrow, rewardSecCard, rewardSecInner,
    rewardSecSub, rewardSecTitle, setEditingRewardId, setPendingReject, setRewardForm, setShowRewardModal,
    setXpAdjustInput, setXpAdjustLabel, setXpAdjustSign, showParentGrowthManage, showParentRecordManage, showParentRewardManage,
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

      {/* 성장 관리 */}
      <div style={rewardSecCard}>
        <button onClick={e=>toggleRewardSec("growth",e)}
          style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"inherit"}}>
          <div style={{textAlign:"left",minWidth:0}}>
            <p style={rewardSecTitle}>성장 관리</p>
            <p style={rewardSecSub}>{TM.book} · 연속 달성 · 상장</p>
          </div>
          <span aria-hidden="true" style={rewardSecArrow(showParentGrowthManage)}>⌄</span>
        </button>
        {showParentGrowthManage&&(
          <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:10}}>
            {(()=>{
              const level=getChildLevel(childId);
              const evo=getCharacterEvolution(childId);

              const treasure=getChildTreasure(childId);
              const title=getSelectedTitle(childId);
              const rarity=TITLE_RARITY[title.rarity||"common"];

              return (
                <>
                  {/* 캐릭터 성장 현황 */}
                  <div style={rewardSecInner}>
                    <p style={parentInnerTitle}>캐릭터 성장 · {curChild?.name}</p>

                    <div style={{
                      display:"flex",
                      alignItems:"center",
                      gap:12,
                      background:"#fff",
                      border:`1px solid ${C.border}`,
                      borderRadius:14,
                      padding:"12px",
                      marginTop:10
                    }}>
                      <div style={{
                        position:"relative",
                        width:58,
                        height:58,
                        borderRadius:20,
                        background:evo.bg,
                        border:`2px solid ${GP.gold}55`,
                        display:"flex",
                        alignItems:"center",
                        justifyContent:"center",
                        fontSize:32,
                        flexShrink:0,
                        overflow:"hidden"
                      }}>
                        <img src={(kidSkin==="cute"?BAKERY_CHAR_IMG:ADV_CHAR_IMG)[(children.find(c=>c.id===childId)?.gender)==="girl"?"girl":"boy"][ADV_CHAR_STAGE_OF(getChildLevel(childId).level)]}
                          alt="" draggable={false} style={{display:"block",height:46,width:"auto",maxWidth:"none",margin:"0 auto"}}/>
                      </div>

                      {/* [사용자 확정 2026-08-11] 레벨·XP·코인이 같은 크기로 나열돼
                          무엇이 핵심인지 안 보였다 → 레벨을 맨 위에, 그 아래 XP 진행바,
                          맨 아래 남은 XP. 코인은 이 카드의 주인공이 아니라 오른쪽 위에 작게.
                          '50 XP 남음' 글자만 있을 때보다 막대가 있어야 자라는 게 보인다. */}
                      <div style={{flex:1,minWidth:0}}>
                        {(()=>{
                          const pg=getLevelProgressInfo(childId);
                          const hasNext=!!getNextLevel(childId);
                          return (<>
                            {/* 레벨 이름은 줄 전체를 쓴다 — 코인을 옆에 두면 '씩씩한 탐…' 처럼 잘렸다 */}
                            <p style={{fontSize:15,fontWeight:900,color:C.text,margin:0,minWidth:0,
                              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                              Lv.{level.level} {level.name}
                            </p>
                            <div style={{display:"flex",alignItems:"baseline",gap:6,margin:"7px 0 4px"}}>
                              {/* pg.currentXp 는 '이번 레벨 안에서 쌓은 양'이라 총 XP 와 단위가 다르다.
                                  오른쪽 목표치는 '지금 총 XP + 남은 XP' 로 잡아야 왼쪽 숫자와 짝이 맞는다 */}
                              <span style={{fontSize:16,fontWeight:900,color:C.text}}>{getChildXP(childId).toLocaleString()}</span>
                              <span style={{fontSize:11.5,fontWeight:700,color:C.sub}}>
                                {hasNext?`/ ${(getChildXP(childId)+pg.remainXp).toLocaleString()}${TM.xpUnit}`:TM.xp}
                              </span>
                            </div>
                            {hasNext&&(
                              <div style={{height:8,borderRadius:999,background:CT.faint,overflow:"hidden"}}>
                                <div style={{width:`${Math.max(3,Math.min(100,pg.percent))}%`,height:"100%",
                                  background:th.grad,borderRadius:999,transition:"width .3s"}}/>
                              </div>
                            )}
                            {/* [사용자 확정 2026-08-12] 한 줄에 좌우로 갈라 놓았더니 서로 다른 이야기
                                ('레벨까지 얼마 남았나' vs '코인이 얼마 있나')가 한 줄처럼 읽혔다 →
                                두 줄로 나눠 각각 한 줄씩 갖는다. */}
                            <div style={{margin:"5px 0 0",display:"flex",flexDirection:"column",gap:2}}>
                              {hasNext&&<span style={{fontSize:11,fontWeight:700,color:C.sub}}>
                                다음 레벨까지 {pg.remainXp}{TM.xpUnit}
                              </span>}
                              <span style={{fontSize:11,fontWeight:700,color:C.sub}}>
                                {TM.coin} {getChildCoin(childId).toLocaleString()}
                              </span>
                            </div>
                          </>);
                        })()}
                      </div>
                    </div>
                    {evoMsgView(evo.name,kidSkin)&&(
                      <p style={{fontSize:12.5,fontWeight:700,color:C.sub,lineHeight:1.55,margin:"10px 2px 0"}}>
                        {evo.emoji?`${evo.emoji} `:""}{evoMsgView(evo.name,kidSkin)}
                      </p>
                    )}
                  </div>

                  {/* 보물창고 */}
                  <div style={rewardSecInner}>
                    <p style={parentInnerTitle}>{TM.book}</p>
                    {/* [사용자 확정 2026-08-11] '미션 완료 누적 30개 · 상자 총 0개 보유'는
                        한 줄에 두 가지가 붙어 잘 안 읽혔다 → 둘로 나눈다. */}
                    <p style={parentInnerSub}>
                      완료한 미션 {treasure.completedQuestCount||0}개<br/>
                      보유 {kidSkin==="cute"?TM.box:"상자"} {getTotalTreasureCount(childId)}개
                    </p>

                    <div style={{
                      display:"grid",
                      gridTemplateColumns:"repeat(3,1fr)",
                      gap:8,
                      marginTop:10
                    }}>
                      {/* [사용자 확정 2026-08-11] 상자 그림은 이모지 그대로 둔다 —
                          아이 화면의 상자와 같은 그림이어야 엄마도 '그 상자'로 알아본다.
                          (한때 선 아이콘으로 바꿨다가 되돌렸다) */}
                      {[
                        {label:getBoxInfo("normal",kidSkin).name,emoji:getBoxInfo("normal",kidSkin).emoji,count:treasure.normalBox||0,range:"20~40",color:C.sub},
                        {label:getBoxInfo("rare",kidSkin).name,emoji:getBoxInfo("rare",kidSkin).emoji,count:treasure.rareBox||0,range:"40~80",color:C.purple},
                        {label:getBoxInfo("legend",kidSkin).name,emoji:getBoxInfo("legend",kidSkin).emoji,count:treasure.legendBox||0,range:"100~160",color:"#F5B301"},
                      ].map(box=>(
                        <div key={box.label} style={{
                          background:"#fff",
                          border:`1px solid ${C.border}`,
                          borderRadius:14,
                          padding:"10px 6px",
                          textAlign:"center"
                        }}>
                          <p style={{fontSize:20,margin:0}}>{box.emoji}</p>
                          <p style={{fontSize:17,fontWeight:900,margin:"3px 0 0",color:box.color}}>
                            {box.count}
                          </p>
                          <p style={{fontSize:11,color:C.sub,fontWeight:800,margin:0}}>
                            {box.label}
                          </p>
                          {/* '💎 20~40'만 있으면 사는 값인지 받는 값인지 헷갈린다 (사용자 지적) */}
                          <p style={{fontSize:10.5,color:C.sub,fontWeight:700,margin:"3px 0 0"}}>
                            열면 {TM.coinEmoji} {box.range}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 연속 달성 */}
                  <div style={rewardSecInner}>
                    <p style={parentInnerTitle}>연속 달성</p>
                    <p style={parentInnerSub}>미션을 빠짐없이 완료한 기록이에요.</p>

                    <div style={{
                      display:"grid",
                      gridTemplateColumns:"1fr 1fr",
                      gap:8,
                      marginTop:10
                    }}>
                      <div style={{
                        background:"#fff",
                        border:`1px solid ${C.border}`,
                        borderRadius:14,
                        padding:"10px",
                        textAlign:"center"
                      }}>
                        <p style={{fontSize:11,color:C.sub,fontWeight:800,margin:"0 0 3px"}}>현재</p>
                        <p style={{fontSize:20,fontWeight:900,margin:0,color:C.text}}>
                          {getQuestStreak(childId)}일
                        </p>
                      </div>

                      <div style={{
                        background:"#fff",
                        border:`1px solid ${C.border}`,
                        borderRadius:14,
                        padding:"10px",
                        textAlign:"center"
                      }}>
                        <p style={{fontSize:11,color:C.sub,fontWeight:800,margin:"0 0 3px"}}>최고 기록</p>
                        <p style={{fontSize:20,fontWeight:900,margin:0,color:GP.gold}}>
                          {getBestStreak(childId)}일
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 상장 관리 */}
                  <div style={rewardSecInner}>
                    <p style={parentInnerTitle}>상장 관리</p>
                    <p style={parentInnerSub}>
                      현재 전시 중인 상장과 전체 획득 현황이에요.
                    </p>

                    <div style={{
                      background:"#fff",
                      border:`1.5px solid ${rarity.color}55`,
                      borderRadius:14,
                      padding:"11px 12px",
                      marginTop:10,
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"space-between",
                      gap:10
                    }}>
                      <div>
                        <p style={{fontSize:15,fontWeight:900,color:C.text,margin:"0 0 3px"}}>
                          {title.emoji} {title.name}
                        </p>
                        {/* 등급 표시가 ⚪ 🔵 🟣 👑 이모지라 기기마다 크기·색이 달랐다 →
                            등급색을 그대로 쓴 작은 점으로 (사용자 확정 2026-08-11) */}
                        <p style={{fontSize:11,fontWeight:900,color:rarity.color,margin:0,display:"flex",alignItems:"center",gap:5}}>
                          <span style={{width:7,height:7,borderRadius:"50%",background:rarity.color,flexShrink:0}}/>
                          {rarity.name}
                        </p>
                      </div>

                      <span style={{
                        fontSize:13,
                        fontWeight:900,
                        color:th.main,
                        background:th.light,
                        borderRadius:999,
                        padding:"5px 8px",
                        whiteSpace:"nowrap"
                      }}>
                        {getUnlockedTitles(childId).length}/{getAllTitles(childId).length}
                      </span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* 기록 관리 */}
      <div style={rewardSecCard}>
        <button onClick={e=>toggleRewardSec("record",e)}
          style={{width:"100%",border:"none",background:"transparent",padding:0,display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"inherit"}}>
          <div style={{textAlign:"left",minWidth:0}}>
            <p style={rewardSecTitle}>기록 관리</p>
            <p style={rewardSecSub}>{T.logName||"활동 기록"} · {TM.xp} 통장</p>
          </div>
          <span aria-hidden="true" style={rewardSecArrow(showParentRecordManage)}>⌄</span>
        </button>
        {showParentRecordManage&&(
          <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:10}}>
            {(()=>{
              const history=getScoreHistory(childId).slice().reverse();
              const earnedXp=history
                .filter(h=>Number(h.xp??h.point??0)>0)
                .reduce((sum,h)=>sum+Number(h.xp??h.point??0),0);

              const spentCoin=history
                .filter(h=>Number(h.coin??0)<0)
                .reduce((sum,h)=>sum+Math.abs(Number(h.coin??0)),0);

              const earnedCoin=history
                .filter(h=>Number(h.coin??0)>0)
                .reduce((sum,h)=>sum+Number(h.coin??0),0);

              return (
                <>
                  {/* XP 통장 요약 */}
                  <div style={rewardSecInner}>
                    <p style={parentInnerTitle}>{TM.xp} 통장</p>
                    <p style={parentInnerSub}>
                      지금까지 쌓은 {TM.xp}와 {TM.coin} 흐름을 한눈에 확인해요.
                    </p>

                    {/* [사용자 확정 2026-08-11] 숫자 카드 넷 + 아래 '코인 흐름' 카드까지
                        카드 안에 카드가 다섯이라 답답했다 → XP·코인을 두 줄 표로 묶고,
                        '코인 흐름'은 코인 줄의 '누적'에 이미 들어가므로 통째로 뺀다. */}
                    <div style={{marginTop:10,background:"#fff",border:`1px solid ${C.border}`,borderRadius:14,overflow:"hidden"}}>
                      {[{k:TM.xp,cur:getChildXP(childId),curTone:C.text,sum:`${earnedXp} 획득`},
                        {k:TM.coin,cur:getChildCoin(childId),curTone:C.green,sum:`${earnedCoin} 획득 · ${spentCoin} 사용`}].map((row,ri)=>(
                        <div key={row.k} style={{display:"flex",alignItems:"baseline",gap:10,padding:"10px 12px",
                          borderTop:ri?`1px solid ${C.border}`:"none"}}>
                          <span style={{flexShrink:0,width:38,fontSize:11.5,fontWeight:800,color:C.sub}}>{row.k}</span>
                          <span style={{flexShrink:0,fontSize:19,fontWeight:900,color:row.curTone,lineHeight:1.1}}>
                            {row.cur.toLocaleString()}
                          </span>
                          <span style={{marginLeft:"auto",flexShrink:0,fontSize:11.5,fontWeight:700,color:C.sub,textAlign:"right"}}>
                            {row.sum}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 탐험기록 상세 */}
                  <div style={rewardSecInner}>
                    <p style={parentInnerTitle}>{T.logName||"활동 기록"}</p>
                    <p style={parentInnerSub}>
                      최근 미션 완료, {kidSkin==="cute"?TM.box:"보물상자"}, 보상 구매 기록이에요.
                    </p>

                    <div style={{marginTop:10}}>
                      {history.length===0 ? (
                        <div style={{
                          textAlign:"center",
                          padding:"20px 10px",
                          background:"#fff",
                          border:`1px dashed ${C.border}`,
                          borderRadius:14
                        }}>
                          <p style={{fontSize:28,margin:"0 0 5px"}}>📖</p>
                          <p style={{fontSize:13,color:C.sub,fontWeight:800,margin:0}}>
                            아직 기록이 없어요.
                          </p>
                        </div>
                      ) : (
                        history.slice(0,10).map(item=>{
                          const info=getAdventureLogInfo(item);
                          const xp=Number(item.xp??0);
                          const coin=Number(item.coin??0);
                          const isMinus=xp<0||coin<0;

                          return (
                            <div key={item.id} style={{
                              display:"flex",
                              alignItems:"center",
                              gap:10,
                              background:"#fff",
                              border:`1px solid ${isMinus?C.red+"30":C.border}`,
                              borderRadius:14,
                              padding:"10px 11px",
                              marginTop:7
                            }}>
                              <div style={{
                                width:36,
                                height:36,
                                borderRadius:"50%",
                                background:isMinus?`${C.red}10`:CT.faint,
                                display:"flex",
                                alignItems:"center",
                                justifyContent:"center",
                                flexShrink:0,
                                color:isMinus?C.red:C.sub
                              }}>
                                {/* [사용자 확정 2026-08-11] ⚔️ 🎁 🛒 ✨ 🏆 ✍️ 📜 대신 선 아이콘.
                                    종류를 나누는 역할은 그대로고, 색은 줄의 상태(빠진 줄=빨강)를 따른다. */}
                                <CareIcon name={LOG_ICON[item.type]||LOG_ICON.default} size={17}/>
                              </div>

                              <div style={{flex:1,minWidth:0}}>
                                <p style={{
                                  fontSize:13,
                                  fontWeight:900,
                                  color:C.text,
                                  margin:0,
                                  overflow:"hidden",
                                  textOverflow:"ellipsis",
                                  whiteSpace:"nowrap"
                                }}>
                                  {/* [사용자 확정 2026-08-11] '미션 클리어'만 줄줄이 찍혀서
                                      무엇을 했는지 몰랐다 → 미션 이름이 있으면 그걸 제목으로.
                                      점수가 빠진 줄에 '미션 클리어'라고 쓰면 말이 안 되니
                                      '완료 취소'라고 사실대로 적는다. */}
                                  {isMinus&&/^(homework|todo|quest)$/.test(item.type)
                                    ? `${item.memo||"미션"} 완료 취소`
                                    : (item.memo||info.title)}
                                </p>

                                <p style={{
                                  fontSize:11,
                                  color:C.sub,
                                  fontWeight:700,
                                  margin:"2px 0 0",
                                  overflow:"hidden",
                                  textOverflow:"ellipsis",
                                  whiteSpace:"nowrap"
                                }}>
                                  {item.memo ? `${info.title} · ${item.date||""}` : (item.date||"")}
                                </p>
                              </div>

                              <div style={{textAlign:"right",flexShrink:0}}>
                                {xp!==0&&(
                                  <p style={{
                                    fontSize:13,
                                    fontWeight:900,
                                    margin:0,
                                    color:xp>0?GP.gold:C.red
                                  }}>
                                    {TM.xpEmoji} {xp>0?"+":""}{xp}
                                  </p>
                                )}

                                {coin!==0&&(
                                  <p style={{
                                    fontSize:13,
                                    fontWeight:900,
                                    margin:"2px 0 0",
                                    color:coin>0?C.green:C.red
                                  }}>
                                    {TM.coinEmoji} {coin>0?"+":""}{coin}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </>
              );
            })()}
          </div>
        )}
      </div>

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

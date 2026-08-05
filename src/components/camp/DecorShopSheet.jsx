import { C, DUNGEON_DECOR_CARD, dungeonDecorRarity, mixWhite } from "../../data/tokens.js";
import {
  DECOR_GROUPS, DECOR_RARITY, decorView,
  BAKERY_HAT_ORDER, BAKERY_HAT_PRICE, BAKERY_HAT_RARITY, BAKERY_BGS, BAKERY_PETSKIN_ORDER,
} from "../../data/characters.js";

/* ════════════════════════════════════════════════════════════════════════
   DecorShopSheet — 꾸미기 상점 (캠프 '꾸미기 상점' 그루터기에서 연다)
   ────────────────────────────────────────────────────────────────────────
   App.jsx 안에 인라인으로 있던 188행을 그대로 옮겼다. 캐릭터 탭 여덟 칸이
   여는 화면 중 이것만 파일로 안 빠져 있어 짝이 맞지 않았다 (CLAUDE.md 3).

   [주의] 겉모습·동작은 한 줄도 바꾸지 않았다. 옮기면서 달라진 것은
   'App의 값을 어떻게 받는가'뿐이다 —
     getOwnedCount(childId)      → ownedCount
     isDecorOwned(childId, id)   → isOwned(id)
     buyDecor / toggleEquipDecor → onBuy / onEquip
   구매 규칙·코인 차감·장착 저장은 전부 App에 그대로 있다. 여기는 그리기만 한다.

   props
     open, onClose
     kidSkin, th, GP, TM     스킨·테마·표기 토큰
     coin                    보유 코인
     ownedCount              꾸미기 보유 개수 (머리줄 '컬렉션 n개')
     avatarOwnedCount        아바타 파츠 보유 개수 (아바타 꾸미기 카드)
     equipped                { 그룹키: 아이템id } 착용 중인 것
     isOwned(id)             보유 여부
     priceOf(item)           판매가 (부모가 고친 값이 있으면 그 값)
     themedBorder(item, th)  테마색을 입힌 테두리 아이템
     maxPet                  펫이 최종 진화했는가 (펫 스킨 잠금 해제 조건)
     onBuy(rawItem) · onEquip(그룹키, id) · onOpenAvatarShop()
   ════════════════════════════════════════════════════════════════════════ */
export default function DecorShopSheet({
  open, onClose, kidSkin = "dungeon", th, GP, TM,
  coin = 0, ownedCount = 0, avatarOwnedCount = 0, equipped = {},
  isOwned = () => false, priceOf = (it) => it.price, themedBorder = (it) => it,
  maxPet = false, onBuy, onEquip, onOpenAvatarShop,
}) {
  if (!open) return null;
  const eq = equipped;
  return (
    <div onClick={()=>onClose()} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(20,16,28,0.55)",backdropFilter:"blur(3px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:430,maxHeight:"92vh",overflowY:"auto",background:GP.appBg||C.bg,borderRadius:"28px 28px 0 0",boxShadow:"0 -10px 40px rgba(0,0,0,0.3)",animation:"popInUp .35s ease both"}}>
        {/* 헤더 */}
        <div style={{position:"sticky",top:0,zIndex:2,background:kidSkin==="cute"?`linear-gradient(135deg, ${mixWhite(th.main,0.5)}, ${mixWhite(th.main,0.66)})`:GP.headerBg,padding:"18px 18px 14px",borderRadius:"28px 28px 0 0",color:GP.onDark,boxShadow:`0 4px 16px ${th.main}22`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <p style={{fontSize:19,fontWeight:900,margin:0}}>🛍️ {kidSkin==="cute"?"꾸미기 가게":"꾸미기 상점"}</p>
            <button onClick={()=>onClose()} style={{border:"none",background:GP.chipBg,color:GP.chipText,width:34,height:34,borderRadius:"50%",fontSize:18,fontWeight:900,cursor:"pointer"}}>✕</button>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8,flexWrap:"wrap"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:GP.chipBg,border:`1px solid ${GP.chipBorder}`,borderRadius:14,padding:"5px 12px"}}>
              <span style={{fontSize:16}}>{TM.coinEmoji}</span>
              <span style={{fontSize:14,fontWeight:900,color:GP.chipText}}>{coin} {TM.coin}</span>
            </div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:GP.chipBg,border:`1px solid ${GP.chipBorder}`,borderRadius:14,padding:"5px 12px"}}>
              <span style={{fontSize:16}}>{kidSkin==="cute"?"🎀":"🔮"}</span>
              <span style={{fontSize:14,fontWeight:900,color:GP.chipText}}>컬렉션 {ownedCount}개</span>
            </div>
          </div>
        </div>
        {/* 본문: 카테고리별 */}
        <div style={{padding:"6px 16px 26px"}}>
          {/* 아바타 꾸미기 진입 카드 — 홈의 별도 카드를 상점 안으로 통합 (기능은 기존 아바타 꾸미기 모달 그대로) */}
          <button onClick={()=>{ onClose(); onOpenAvatarShop(); }}
            style={{width:"100%",boxSizing:"border-box",marginTop:14,padding:"15px 16px",borderRadius:18,cursor:"pointer",textAlign:"left",
              display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,
              background:kidSkin==="cute"?`linear-gradient(135deg, ${mixWhite(th.main,0.86)}, #fff)`:"linear-gradient(135deg, #7398A8, #648492)",
              border:kidSkin==="cute"?`1.5px solid ${th.main}55`:"1px solid rgba(190,220,232,0.45)",
              boxShadow:kidSkin==="cute"?`0 6px 16px ${th.main}22`:"0 6px 18px rgba(60,90,105,0.28)"}}>
            <span style={{display:"flex",alignItems:"center",gap:9}}>
              <span style={{fontSize:22}}>👗</span>
              <span>
                <span style={{display:"block",fontSize:16,fontWeight:900,color:kidSkin==="cute"?C.text:"#FFFFFF"}}>아바타 꾸미기</span>
                <span style={{display:"block",fontSize:12,fontWeight:800,color:kidSkin==="cute"?C.sub:"rgba(255,255,255,0.85)",marginTop:3}}>파츠를 사서 나만의 아바타를 만들어요 · {avatarOwnedCount}개 보유</span>
              </span>
            </span>
            <span style={{fontSize:17,color:kidSkin==="cute"?C.sub:"rgba(255,255,255,0.85)"}}>›</span>
          </button>
          {DECOR_GROUPS.filter(grp=>grp.key!=="hat").map(grp=>{   // 모자/장비(hat) 카테고리는 신규 '아바타 꾸미기'와 중복되어 이 상점에서 제외(데이터·저장 로직은 유지)
            const grpLocked = grp.lockUntilMaxPet && !maxPet;   // 펫 스킨만 잠금 대상(캐릭터 스킨은 폐지)
            return (
            <div key={grp.key} style={{marginTop:18}}>
              <p style={{fontSize:15,fontWeight:900,margin:"0 0 10px",color:kidSkin!=="cute"?"#EAF0FF":C.text}}>{grp.key==="hat"&&kidSkin!=="cute"?"⚔️":grp.icon} {grp.key==="hat"&&kidSkin!=="cute"?"장비":grp.label}{grp.key==="petskin"&&<span style={{fontSize:11,fontWeight:800,color:kidSkin!=="cute"?"rgba(200,212,240,0.6)":C.sub,marginLeft:6}}>펫 최종 진화 시 해제</span>}</p>
              {grpLocked?(
                <div style={kidSkin!=="cute"
                  ?{background:DUNGEON_DECOR_CARD.previewBg,border:`1.5px dashed rgba(150,175,225,0.3)`,borderRadius:18,padding:"22px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:6}
                  :{background:C.faint,border:`1.5px dashed ${C.border}`,borderRadius:18,padding:"22px 14px",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <span style={{fontSize:30}}>🔒</span>
                  {grp.key==="petskin"?(
                    <>
                      <p style={{fontSize:12.5,fontWeight:900,margin:0,color:kidSkin!=="cute"?"#EAF0FF":C.text,textAlign:"center",lineHeight:1.4}}>{kidSkin==="cute"?"펫이 마지막까지 자라면 열려요!":"펫이 마지막까지 진화하면 열려요!"}</p>
                      <p style={{fontSize:11,fontWeight:700,margin:0,color:kidSkin!=="cute"?"rgba(200,212,240,0.6)":C.sub,textAlign:"center"}}>{kidSkin==="cute"?"전설의 유니콘이 되면 특별한 펫으로 바꿀 수 있어요 🐾":"전설의 드래곤이 되면 특별한 펫으로 바꿀 수 있어요 🐾"}</p>
                    </>
                  ):(
                    <>
                      <p style={{fontSize:12.5,fontWeight:900,margin:0,color:kidSkin!=="cute"?"#EAF0FF":C.text,textAlign:"center",lineHeight:1.4}}>{kidSkin==="cute"?"전설의 파티시에가 되면 열려요!":"전설의 수호자가 되면 열려요!"}</p>
                      <p style={{fontSize:11,fontWeight:700,margin:0,color:kidSkin!=="cute"?"rgba(200,212,240,0.6)":C.sub,textAlign:"center"}}>Lv.17에 도달하면 특별한 캐릭터로 변신할 수 있어요 ✨</p>
                    </>
                  )}
                </div>
              ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
                {(()=>{
                  // 베이커리 모드의 '모자' 그룹만 지정 순서로 재정렬 + 자리기준 등급 적용. 그 외는 원본.
                  let items=grp.items;
                  // 베이커리 모드의 '모자'는 전용 순서로 재배열 + 슬롯 기준 가격/등급 적용
                  if(kidSkin==="cute" && grp.key==="hat"){
                    items=BAKERY_HAT_ORDER.map(id=>grp.items.find(it=>it.id===id)).filter(Boolean)
                      .map(it=>({ ...it, price:BAKERY_HAT_PRICE[it.id]??it.price, rarity:BAKERY_HAT_RARITY[it.id]||it.rarity }));
                  }
                  // 테두리 그룹: 'themed' 아이템은 이 아이의 테마색으로 색을 입혀 미리보기에도 반영
                  if(grp.key==="border"){
                    items=items.map(it=> it.themed ? themedBorder(it, th) : it);
                  }
                  // 베이커리 모드의 '배경'은 전용 6슬롯 배열을 사용(탐험 4슬롯과 분리)
                  if(kidSkin==="cute" && grp.key==="bg"){
                    items=BAKERY_BGS;
                  }
                  // 베이커리 모드의 '펫'은 전용 순서로 재배열(가격·등급은 슬롯 값 유지)
                  if(kidSkin==="cute" && grp.key==="petskin"){
                    items=BAKERY_PETSKIN_ORDER.map(id=>grp.items.find(it=>it.id===id)).filter(Boolean);
                  }
                  return items;
                })().map(raw=>{
                  const it=decorView(raw,kidSkin);
                  const owned=isOwned(it.id);
                  const equipped=eq[grp.key]===it.id;
                  const price=priceOf(it);
                  const rc=(DECOR_RARITY[it.rarity]||DECOR_RARITY.common).color;
                  const canBuy=coin>=price;
                  // 4단계 상태: 착용중 > 보유 > 구매가능 > 구매불가(코인부족) — 탐험모드 카드/버튼/뱃지 공용
                  const state = equipped?"equipped":owned?"owned":canBuy?"available":"locked";
                  // 탐험모드: 카드 배경을 네이비로 통일하고 등급은 테두리+glow 로만 표현 (RPG 장비창 느낌)
                  const dungeon = kidSkin!=="cute";
                  let dr = dungeonDecorRarity(it.rarity);
                  // (통일 규칙) 테두리 아이템도 카드 오라는 등급색만 사용 — 아이템 고유색은 미리보기 썸네일에서만 표현
                  return (
                    <div key={it.id}
                      style={dungeon
                      ?{background:DUNGEON_DECOR_CARD.cardBg,   // 배경 통일 — 상태·등급은 테두리/뱃지/glow로만
                        border:`2px solid ${equipped?"#FFD976":dr.border}`,borderRadius:18,padding:"12px 11px",boxShadow:equipped?`0 0 22px rgba(255,217,118,.28), 0 6px 16px rgba(8,16,40,0.42), inset 0 1px 0 rgba(255,255,255,0.08)`:`${dr.glow}, 0 6px 16px rgba(8,16,40,0.42), inset 0 1px 0 rgba(255,255,255,0.06)`,opacity:state==="locked"?0.55:1,filter:state==="locked"?"grayscale(.25)":"none",display:"flex",flexDirection:"column",alignItems:"center",gap:6,position:"relative",overflow:"hidden"}
                      :{background:equipped?`${th.main}14`:(owned?`${th.main}08`:C.card),border:`1.5px solid ${equipped?th.main:(owned?th.main+"66":rc+"44")}`,borderRadius:18,padding:"12px 11px",boxShadow:equipped?`0 6px 18px ${th.main}44`:`0 3px 10px ${rc}1f`,display:"flex",flexDirection:"column",alignItems:"center",gap:6,position:"relative",overflow:"hidden"}}>
                      {(it.rarity==="legendary"||it.rarity==="epic")&&<div style={{position:"absolute",inset:0,background:dungeon?`radial-gradient(85% 55% at 50% 0%, ${dr.border}26, transparent 72%)`:`radial-gradient(80% 60% at 50% 0%, ${rc}1a, transparent 70%)`,pointerEvents:"none"}}/>}
                      {/* 상태 뱃지 (우측 상단): 베이커리만 사용. 탐험은 하단 액션 영역에서 표시 */}
                      {!dungeon&&equipped?(
                        <span style={{position:"absolute",top:7,right:7,zIndex:2,fontSize:9.5,fontWeight:900,letterSpacing:0.3,color:"#0F1220",background:th.main,borderRadius:999,padding:"2px 8px",boxShadow:"0 2px 6px rgba(0,0,0,0.3)"}}>✓ 착용중</span>
                      ):(!dungeon&&owned)?(
                        <span style={{position:"absolute",top:7,right:7,zIndex:2,fontSize:9.5,fontWeight:900,letterSpacing:0.3,color:th.main,background:`${th.main}18`,border:`1px solid ${th.main+"55"}`,borderRadius:999,padding:"2px 8px"}}>📦 보유중</span>
                      ):(dungeon&&equipped)?(
                        <span style={{position:"absolute",top:7,right:7,zIndex:2,fontSize:9.5,fontWeight:900,letterSpacing:0.3,color:"#1F2937",background:"#fff",borderRadius:999,padding:"2px 8px",boxShadow:"0 2px 6px rgba(0,0,0,0.35)"}}>✓ 착용중</span>
                      ):(dungeon&&state==="available")?(
                        <span style={{position:"absolute",top:7,right:7,zIndex:2,fontSize:9.5,fontWeight:900,letterSpacing:0.3,color:"#fff",background:"rgba(78,163,255,.95)",borderRadius:999,padding:"2px 8px",boxShadow:"0 0 12px rgba(78,163,255,.35)"}}>구매 가능</span>
                      ):null}
                      {/* 미리보기 */}
                      <div style={{position:"relative",width:54,height:54,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,
                        background:grp.key==="bg"?`radial-gradient(circle at 50% 40%, ${it.tint||rc+"22"}, ${dungeon?DUNGEON_DECOR_CARD.previewBg:C.faint})`:(grp.key==="border"?it.grad:(dungeon?DUNGEON_DECOR_CARD.previewBg:C.faint)),
                        border:grp.key==="border"?"none":`1px solid ${dungeon?DUNGEON_DECOR_CARD.previewBorder:C.border}`,boxShadow:grp.key==="border"?`0 0 12px ${(kidSkin==="cute"&&it.glowCute)?it.glowCute:it.glow}`:"none"}}>
                        {grp.key==="border"?<span style={{width:38,height:38,borderRadius:11,background:dungeon?"#27314F":C.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🧒</span>:it.emoji}
                      </div>
                      <p style={{fontSize:12.5,fontWeight:900,margin:0,color:dungeon?"#EAF0FF":C.text,textAlign:"center",lineHeight:1.25}}>{it.name}</p>
                      <span style={{fontSize:10,fontWeight:900,color:dungeon?dr.badgeText:rc,background:dungeon?dr.badgeBg:`${rc}18`,borderRadius:8,padding:"1px 7px"}}>{DECOR_RARITY[it.rarity]?({common:"일반",rare:"희귀",epic:"영웅",legendary:"전설"}[it.rarity]):"일반"}</span>
                      {/* 액션 버튼 */}
                      {!owned?(
                        <button onClick={()=>onBuy(raw)} disabled={!canBuy}
                          style={dungeon
                            ?(price===0
                              // 무료: 민트 그라데이션 CTA
                              ?{width:"100%",borderRadius:11,padding:"8px",fontSize:13,fontWeight:900,cursor:"pointer",marginTop:2,
                                background:"linear-gradient(135deg, rgba(117,235,165,.28), rgba(90,169,255,.18))",
                                border:"1px solid rgba(117,235,165,.35)",
                                color:"#EFFFF5",
                                display:"flex",alignItems:"center",justifyContent:"center",gap:5}
                              :state==="available"
                              // 구매 가능: 밝은 파랑 CTA — "누를 수 있음"이 즉시 보이게
                              ?{width:"100%",borderRadius:11,padding:"8px",fontSize:13,fontWeight:900,cursor:"pointer",marginTop:2,
                                background:"linear-gradient(135deg, #4EA3FF 0%, #78C7FF 100%)",
                                border:"1px solid rgba(180,225,255,.55)",
                                color:"#FFFFFF",
                                boxShadow:"0 0 18px rgba(78,163,255,.28)",
                                display:"flex",alignItems:"center",justifyContent:"center",gap:5}
                              // 구매 불가(코인 부족): 확실히 흐리게
                              :{width:"100%",borderRadius:11,padding:"8px",fontSize:13,fontWeight:900,cursor:"not-allowed",marginTop:2,
                                background:"rgba(255,255,255,.05)",
                                border:"1px solid rgba(255,255,255,.08)",
                                color:"rgba(255,255,255,.35)",
                                display:"flex",alignItems:"center",justifyContent:"center",gap:5})
                            :{width:"100%",border:"none",borderRadius:11,padding:"8px",fontSize:12.5,fontWeight:900,cursor:canBuy?"pointer":"not-allowed",
                              background:canBuy?th.grad:"#E5E7EB",color:canBuy?"#fff":"#9CA3AF",marginTop:2}}>
                          {price===0
                            ?<span>무료</span>
                            :dungeon
                              ?<>{TM.coinEmoji} <span>{price}</span> <span style={{fontSize:10.5,fontWeight:800,opacity:0.72}}>{state==="available"?`${TM.coin} 구매`:TM.coin}</span></>
                              :<>{TM.coinEmoji} {price}</>}
                        </button>
                      ):dungeon?(
                        <button onClick={()=>onEquip(grp.key,it.id)}
                          style={{width:"100%",borderRadius:11,padding:"8px",fontSize:12.5,fontWeight:900,marginTop:2,cursor:"pointer",
                          display:"flex",alignItems:"center",justifyContent:"center",gap:5,
                          border:equipped?"1px solid rgba(255,217,118,.38)":"1px solid rgba(117,235,165,.42)",
                          background:equipped?"rgba(255,217,118,.16)":"linear-gradient(135deg, rgba(75,220,140,.30), rgba(80,190,255,.16))",
                          color:equipped?"#FFD976":"#B8FFD0"}}>
                          {equipped?"✓ 착용중":"착용하기"}
                        </button>
                      ):(
                        <button onClick={()=>onEquip(grp.key,it.id)}
                          style={{width:"100%",borderRadius:11,padding:"8px",fontSize:12.5,fontWeight:900,cursor:"pointer",marginTop:2,
                            border:equipped?`1.5px solid ${th.main}`:`1.5px solid ${th.main}55`,
                            background:equipped?th.main:`${th.main}12`,color:equipped?"#fff":th.main}}>
                          {equipped?"✓ 착용중":"착용하기"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              )}
            </div>
            );
          })}
          <p style={{fontSize:11.5,color:kidSkin!=="cute"?"rgba(200,212,240,0.62)":C.sub,textAlign:"center",margin:"20px 0 0",lineHeight:1.5}}>꾸민 모습은 '내 캐릭터' 카드에 바로 나타나요 ✨</p>
        </div>
      </div>
    </div>
  );
}

import { C } from "../data/tokens.js";
import { ADV_CHAR_STAGE_OF } from "../data/characters.js";
import { DISCOVERIES, getCollectedCount } from "../data/discoveries.js";

/* ════════════════════════════════════════════════════════════════════════
   DevToolsPanel — 개발자 도구 (DEV_MODE 전용 치트 패널)
   ────────────────────────────────────────────────────────────────────────
   App.jsx에서 분리 (CLAUDE.md 3 — 기존 화면 점진 분리, 첫 대상).
   완전히 독립적인 화면이라 가장 안전한 분리 대상이었다.
   상태·게임 로직은 전부 App이 갖고 있고, 여기는 버튼 껍데기만 —
   필요한 값·함수는 D 프로퍼티 하나로 통째로 받는다.
   열고 닫기(DEV_MODE && showDevTools)는 App이 결정한다.
   ════════════════════════════════════════════════════════════════════════ */
export default function DevToolsPanel({ D }) {
  const { children, childId, childDate, kidSkin, th, CT, GP, TM, fmt, getChildLevel, getChildXP, getChildCoin, loadSampleData, generateTestData, generateLegendTestData, addDevQuests, addDevHomeworks, giveDevBox, getQuestStreak, getBestStreak, setDevStreak, setDevBestStreak, diagnoseStreak, stepDevLevel, setDevLevel, addDevXP, addDevCoin, unlockAllTitlesForDev, showDevEvent, devDiscoverNow, devClearTodayDiscovery, devDiscoverAs, devFillDiscoveryDays, devFillDiscoveryAll, devResetDiscovery, resetGameData, resetAllAppData, setShowDevTools, setShowExpPreview, setShowCampProto, discoveryData } = D;
  /* 패널 전용 스타일 헬퍼 (분리 전 App에 있던 것 그대로) */
  const devBtn=(bg)=>({width:"100%",border:"none",borderRadius:12,padding:"13px",background:bg,color:"#fff",fontSize:14,fontWeight:900,cursor:"pointer"});
  const devMiniBtn=(bg)=>({border:"none",borderRadius:10,padding:"10px 8px",background:bg,color:"#fff",fontSize:13,fontWeight:900,cursor:"pointer"});
  const devGroup={background:CT.faint,border:`1px solid ${C.border}`,borderRadius:14,padding:"13px"};
  const devGroupTitle={fontSize:13,fontWeight:900,color:C.text,margin:"0 0 9px"};
  return (
          <div style={{position:"fixed",inset:0,background:"rgba(20,20,40,0.6)",display:"flex",alignItems:"flex-end",zIndex:3000}} onClick={()=>setShowDevTools(false)}>
            <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"22px 22px 0 0",padding:"24px 20px 44px",width:"100%",maxWidth:430,maxHeight:"90vh",overflowY:"auto",boxSizing:"border-box"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div>
                  <h3 style={{margin:0,fontSize:17,fontWeight:900,color:C.text}}>🧪 개발자 도구</h3>
                  <p style={{margin:"4px 0 0",fontSize:13,color:C.sub,fontWeight:700}}>테스트용 데이터 생성/초기화</p>
                </div>
                <button onClick={()=>setShowDevTools(false)} style={{background:CT.faint,border:"none",borderRadius:10,width:30,height:30,cursor:"pointer",color:C.sub,fontSize:15}}>✕</button>
              </div>

              {/* 현재 아이 상태 */}
              <div style={{background:GP.boxBg,border:`1px solid ${GP.boxBorder}`,borderRadius:14,padding:"10px 14px",marginBottom:14,color:GP.boxText}}>
                <p style={{fontSize:11,opacity:0.7,margin:"0 0 2px",fontWeight:900,letterSpacing:1}}>CURRENT PLAYER</p>
                <p style={{fontSize:13,fontWeight:900,margin:0}}>{children.find(c=>c.id===childId)?.name||"없음"} · Lv.{getChildLevel(childId).level} · {TM.xpEmoji}{getChildXP(childId)} · {TM.coinEmoji}{getChildCoin(childId)}</p>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <button onClick={loadSampleData} style={devBtn(C.green)}>🌱 샘플 데이터 채우기 (아이·학원·미션)</button>
                <button onClick={()=>generateTestData(childId)} style={devBtn(C.purple)}>🧪 테스트 데이터 생성</button>
                <button onClick={()=>generateLegendTestData(childId)} style={devBtn(GP.gold)}>👑 전설 테스트 모드</button>

                <div style={devGroup}>
                  <p style={devGroupTitle}>미션 · 숙제 일괄 추가 ({fmt(childDate)})</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                    <button onClick={()=>addDevQuests(childId,10)} style={devMiniBtn(C.blue||"#3B82F6")}>📝 미션 10개</button>
                    <button onClick={()=>addDevHomeworks(childId,10)} style={devMiniBtn(C.orange)}>📚 숙제 10개</button>
                  </div>
                </div>

                <div style={devGroup}>
                  <p style={devGroupTitle}>상자 지급</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    <button onClick={()=>giveDevBox("normal")} style={devMiniBtn("#94A3B8")}>📦 일반</button>
                    <button onClick={()=>giveDevBox("rare")} style={devMiniBtn(C.purple)}>🎁 희귀</button>
                    <button onClick={()=>giveDevBox("legend")} style={devMiniBtn(GP.gold)}>👑 전설</button>
                  </div>
                </div>

                <div style={devGroup}>
                  <p style={devGroupTitle}>🔥 연속 달성 (현재 {getQuestStreak(childId)}일 · 최고 {getBestStreak(childId)}일)</p>
                  <p style={{fontSize:11,color:C.sub,margin:"0 0 8px",fontWeight:600,lineHeight:1.4}}>오늘부터 거꾸로 과거 날짜에 완료된 미션을 심어 실제 연속 기록을 만듭니다 (첫 번째 학원 기준)</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    <button onClick={()=>setDevStreak(3)} style={devMiniBtn(C.streak||"#FF6B6B")}>3일</button>
                    <button onClick={()=>setDevStreak(5)} style={devMiniBtn(C.streak||"#FF6B6B")}>5일</button>
                    <button onClick={()=>setDevStreak(10)} style={devMiniBtn(C.streak||"#FF6B6B")}>10일</button>
                    <button onClick={()=>setDevStreak(30)} style={devMiniBtn(C.streak||"#FF6B6B")}>30일</button>
                  </div>
                  <p style={{fontSize:11,color:C.sub,margin:"10px 0 6px",fontWeight:700}}>최고기록만 설정 (상장 조건 테스트)</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    <button onClick={()=>setDevBestStreak(5)} style={devMiniBtn("#94A3B8")}>5</button>
                    <button onClick={()=>setDevBestStreak(10)} style={devMiniBtn("#94A3B8")}>10</button>
                    <button onClick={()=>setDevBestStreak(30)} style={devMiniBtn("#94A3B8")}>30</button>
                    <button onClick={()=>setDevBestStreak(0)} style={devMiniBtn(C.red)}>초기화</button>
                  </div>
                  <button onClick={diagnoseStreak} style={{...devMiniBtn(C.purple),width:"100%",marginTop:8}}>🔍 연속 진단 (콘솔+토스트)</button>
                </div>

                <div style={devGroup}>
                  <p style={devGroupTitle}>🎚️ 레벨 설정 (진화 테스트)</p>
                  {(()=>{
                    const _lv=getChildLevel(childId);
                    const _st=ADV_CHAR_STAGE_OF(_lv.level);
                    return (
                      <p style={{fontSize:12,fontWeight:800,color:C.text,background:CT.faint,borderRadius:8,padding:"7px 10px",margin:"0 0 8px",textAlign:"center"}}>
                        현재 Lv.{_lv.level} {_lv.name} · XP {getChildXP(childId)}
                        {kidSkin!=="cute"&&<span style={{color:C.sub}}> · 진화 {_st}단계</span>}
                      </p>
                    );
                  })()}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <button onClick={()=>stepDevLevel(-1)} style={devMiniBtn(C.red)}>◀ 레벨 -1</button>
                    <button onClick={()=>stepDevLevel(1)} style={devMiniBtn(C.green)}>레벨 +1 ▶</button>
                  </div>
                  <p style={{fontSize:11,color:C.sub,margin:"10px 0 6px",fontWeight:700}}>진화 구간 바로 이동 (탐험 5단계)</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                    {[1,5,9,13,17].map((lv,i)=>(
                      <button key={lv} onClick={()=>setDevLevel(lv)} style={{...devMiniBtn(i===4?GP.gold:C.purple),fontSize:11,padding:"9px 4px"}}>
                        {i+1}단계<br/><span style={{fontSize:10,opacity:.85}}>Lv.{lv}</span>
                      </button>
                    ))}
                  </div>
                  <p style={{fontSize:11,color:C.sub,margin:"10px 0 6px",fontWeight:700}}>레벨 직접 지정</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                    {[1,4,8,12,16,18,19,20].map(lv=>(
                      <button key={lv} onClick={()=>setDevLevel(lv)} style={{...devMiniBtn("#94A3B8"),fontSize:12,padding:"9px 4px"}}>{lv}</button>
                    ))}
                  </div>
                </div>

                <div style={devGroup}>
                  <p style={devGroupTitle}>{TM.xp} 지급</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    <button onClick={()=>addDevXP(10)} style={devMiniBtn(C.green)}>+10</button>
                    <button onClick={()=>addDevXP(50)} style={devMiniBtn(C.green)}>+50</button>
                    <button onClick={()=>addDevXP(100)} style={devMiniBtn(C.green)}>+100</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:8}}>
                    <button onClick={()=>addDevXP(-10)} style={devMiniBtn(C.red)}>-10</button>
                    <button onClick={()=>addDevXP(-50)} style={devMiniBtn(C.red)}>-50</button>
                    <button onClick={()=>addDevXP(-100)} style={devMiniBtn(C.red)}>-100</button>
                  </div>
                </div>

                <div style={devGroup}>
                  <p style={devGroupTitle}>{TM.coin} 지급</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                    <button onClick={()=>addDevCoin(100)} style={devMiniBtn(GP.gold)}>+100</button>
                    <button onClick={()=>addDevCoin(500)} style={devMiniBtn(GP.gold)}>+500</button>
                    <button onClick={()=>addDevCoin(1000)} style={devMiniBtn(GP.gold)}>+1000</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:8}}>
                    <button onClick={()=>addDevCoin(-10)} style={devMiniBtn(C.red)}>-10</button>
                    <button onClick={()=>addDevCoin(-50)} style={devMiniBtn(C.red)}>-50</button>
                    <button onClick={()=>addDevCoin(-100)} style={devMiniBtn(C.red)}>-100</button>
                  </div>
                </div>

                <button onClick={()=>unlockAllTitlesForDev(childId)} style={devBtn("#F59E0B")}>👑 모든 상장 받기</button>

                <div style={devGroup}>
                  <p style={devGroupTitle}>🌿 오늘의 발견 · 도감 (보는 날짜 {fmt(childDate)} · 현재 {getCollectedCount(discoveryData,childId)}/{DISCOVERIES.length}종)</p>
                  <p style={{fontSize:11,color:C.sub,margin:"0 0 8px",fontWeight:600,lineHeight:1.4}}>발견은 미션과 무관 — 지도에서 발견 지점을 지나면 자동 기록. 아래 버튼은 그 기록을 흉내내거나 되돌립니다</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                    <button onClick={devDiscoverNow} style={devMiniBtn(C.green)}>🌼 이날 발견 즉시</button>
                    <button onClick={devClearTodayDiscovery} style={devMiniBtn(C.red)}>↩️ 이날 발견 취소</button>
                    <button onClick={()=>devDiscoverAs("feather_rainbow")} style={devMiniBtn(GP.gold)}>🌈 전설로 교체</button>
                    <button onClick={()=>devDiscoverAs("banana")} style={devMiniBtn(C.orange)}>🍌 펫먹이로 교체</button>
                  </div>
                  <p style={{fontSize:11,color:C.sub,margin:"10px 0 6px",fontWeight:700}}>도감 채우기 (실제 룰과 같은 날짜별 고정 시드)</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                    <button onClick={()=>devFillDiscoveryDays(7)} style={devMiniBtn(C.purple)}>7일</button>
                    <button onClick={()=>devFillDiscoveryDays(30)} style={devMiniBtn(C.purple)}>30일</button>
                    <button onClick={devFillDiscoveryAll} style={devMiniBtn(GP.gold)}>전종류</button>
                    <button onClick={devResetDiscovery} style={devMiniBtn(C.red)}>초기화</button>
                  </div>
                </div>

                <div style={devGroup}>
                  <p style={devGroupTitle}>미션 배경 점검</p>
                  <button onClick={()=>{ setShowDevTools(false); setShowExpPreview(true); }} style={devBtn("#8B5CF6")}>
                    🗺️ 챕터·탈것·동선 미리보기
                  </button>
                  <p style={{fontSize:11.5,color:C.sub,fontWeight:700,margin:"7px 0 0",lineHeight:1.5}}>
                    챕터를 고르고 그 챕터 탈것을 골라, 출발·25·50·75·도착을 눌러 가며 동선을 본다.
                  </p>
                </div>

                <div style={devGroup}>
                  <p style={devGroupTitle}>캐릭터 탭 개편</p>
                  <button onClick={()=>{ setShowDevTools(false); setShowCampProto(true); }} style={devBtn("#587220")}>
                    🏕️ 캠프 배치 시안
                  </button>
                  <p style={{fontSize:11.5,color:C.sub,fontWeight:700,margin:"7px 0 0",lineHeight:1.5}}>
                    원화 받기 전에 크기·간격·터치감만 먼저 정하는 자리. 크기 후보를 눌러 가며
                    필요한 배경 원화 크기를 확인한다. 실제 캐릭터 탭은 아직 그대로다.
                  </p>
                </div>

                <div style={devGroup}>
                  <p style={devGroupTitle}>이벤트 팝업 테스트</p>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                    <button onClick={()=>showDevEvent("level")} style={devMiniBtn(th.main)}>🎉 레벨업</button>
                    <button onClick={()=>showDevEvent("title")} style={devMiniBtn("#F59E0B")}>👑 상장</button>
                    <button onClick={()=>showDevEvent("box")} style={devMiniBtn("#FBBF24")}>📦 상자획득</button>
                    <button onClick={()=>showDevEvent("treasure")} style={devMiniBtn(C.orange)}>🎁 상자열기</button>
                  </div>
                </div>

                <button onClick={()=>{ resetGameData(childId); setShowDevTools(false); }} style={devBtn(C.red)}>🧹 현재 아이 게임 데이터 초기화</button>
                <button onClick={resetAllAppData} style={devBtn("#111827")}>💣 앱 전체 초기화</button>
              </div>
            </div>
          </div>
  );
}

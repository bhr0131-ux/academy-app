import AvatarViewer from "./AvatarViewer.jsx";
import { mixWhite, mixBlack, dungeonTone } from "../data/tokens.js";
import { ADV_CHAR_IMG, BAKERY_CHAR_IMG, ADV_CHAR_SIZE, BAKERY_CHAR_SIZE, AVATAR_HOME_SIZE, ADV_CHAR_STAGE_OF, TITLE_RARITY } from "../data/characters.js";
import { CHAR_DISPLAY_AVATAR } from "../data/avatarEquipment.js";
import { getDiscovery, getDiscoveryOn } from "../data/discoveries.js";
import { TODAY } from "../utils/dates.js";

/* ════════════════════════════════════════════════════════════════════════
   HeroStage — 아이 홈 상단 '대형 캐릭터 영웅 무대' (메인 주인공 화면)
   ────────────────────────────────────────────────────────────────────────
   App.jsx에서 분리 (CLAUDE.md 3 — 기존 화면 점진 분리, 2번째: DevToolsPanel 다음).
   내용은 분리 전 IIFE 본문 그대로다 — 로직 변경 없음.
     · 성장 캐릭터/아바타 표시, 펫(알·부화·❤️ 말풍선), 무대 배경(기본 풍경/
       꾸미기 배경/테두리), 레벨·상장 칩, 팻말 버튼까지 이 한 화면.
   상태·게임 로직은 전부 App이 갖고 있고, 필요한 값·함수·풍경 컴포넌트는
   D 프로퍼티 하나로 받는다 (DungeonScenery 등은 App 클로저 컴포넌트라 props로).
   ════════════════════════════════════════════════════════════════════════ */
export default function HeroStage({ D }) {
  const { GP, th, kidSkin, childId, childDate, children, discoveryData, dungeonShinyBg, DungeonScenery, BakeryScenery, AdventureBgScenery, getAvatarBaseCharImg, getAvatarEquipped, getCharMode, getChildLevel, getEquipped, getPet, getProgressMessage, getSelectedTitle, getTodayQuestProgress, setChildTab, toggleCharDisplayMode } = D;
          const q=getTodayQuestProgress(childId,childDate||TODAY);
          const level=getChildLevel(childId);
          const pet=getPet(childId);
          /* 오늘의 발견이 펫 연결(pet 필드) 발견인 날은 펫 말풍선이 ❤️가 된다 (사용자 확정 ④).
             수치는 안 건드린다 — 발견이 펫과 이어져 있다는 '기분'만 주는 연출이다. */
          const _petDe=getDiscoveryOn(discoveryData,childId,childDate||TODAY);
          const petHeart=!!(_petDe&&getDiscovery(_petDe.id)?.pet);
          /* 펫 가로 위치 — 성장 캐릭터는 진화할수록 원화 폭이 넓어져(1단계 452px → 4단계 554px)
             고정 62px면 부츠에 붙는다 (사용자 지적). 단계별로 벌린다.
             아바타(꾸미기) 모드는 캔버스 폭이 거의 안 변해 기존 62 유지. */
          const PET_DX={1:62,2:76,3:86,4:98,5:102};
          const petDx=getCharMode(childId)===CHAR_DISPLAY_AVATAR?62:(PET_DX[ADV_CHAR_STAGE_OF(getChildLevel(childId).level)]||62);
          const title=getSelectedTitle(childId);
          const cute=kidSkin==="cute";
          const stageBgDeco=getEquipped(childId,"bg");
          const stageBorder=getEquipped(childId,"border");
          // 테두리 빛번짐(glow) — 베이커리(밝은 무대)에선 채도 낮은 glowCute 사용 + 번짐 약하게
          const bGlow=stageBorder?((cute&&stageBorder.glowCute)?stageBorder.glowCute:stageBorder.glow):null;
          // 진행도에 따른 말풍선 멘트 + 캐릭터 기분
          const msg=getProgressMessage(q.percent,q.total);
          const allDone=q.total>0&&q.percent===100;
          // 무대 응원 말풍선: 배경 장착 시엔 배경 연출을 살리기 위해 숨김
          const hideStageCheer=!!stageBgDeco;
          const charAnim="floatHero 2.6s ease-in-out infinite -1.3s";
          // 무대 배경: 탐험은 다크 샤이니, 베이커리는 따뜻한 크림 스포트라이트
          const stageBg=cute
            ?`radial-gradient(120% 95% at 50% 5%, #ffffff, ${mixWhite(th.main,0.5)} 50%, ${mixWhite(th.main,0.38)})`
            :(stageBorder
                // 테두리 장착 시: 안쪽을 테마색 머금은 한 톤 밝은 다크로 → 화려한 프레임이 돋보임
                ?`radial-gradient(125% 100% at 50% 0%, ${th.main}4a 0%, ${dungeonTone(th.main,40)} 42%, ${dungeonTone(th.main,22)} 100%)`
                :`radial-gradient(120% 95% at 50% -10%, ${th.main}40 0%, transparent 55%), ${dungeonShinyBg}`);
          // 무대 위 스포트라이트(캐릭터를 비추는 빛) — 탐험은 위쪽에 따뜻한 골드 광원을 더해 차가운 블루 단조로움을 풀고 생기를 줌
          const spotlight=cute
            ?"radial-gradient(ellipse 60% 50% at 50% 62%, rgba(255,255,255,0.55), transparent 70%)"
            :`radial-gradient(ellipse 70% 42% at 50% 30%, ${GP.gold||"#FFD166"}30, transparent 68%), radial-gradient(ellipse 58% 48% at 50% 60%, ${th.main}3d, transparent 72%)`;
          // 탐험(개방감): 테두리 장착 시에도 풀블리드 유지 — 프레임은 화면 가장자리 4px 림 + 글로우로만 표현
          return (
            <div style={{position:"relative",zIndex:1,margin:cute?"16px 16px 0":"0",borderRadius:cute?34:"0",padding:stageBorder?4:0,overflow:"hidden",
              background:stageBorder?stageBorder.grad:"transparent",
              backgroundSize:stageBorder&&(stageBorder.shimmer||stageBorder.rainbow)?"260% 260%":"100% 100%",
              boxShadow:stageBorder?(cute?`0 10px 26px ${bGlow}, 0 0 14px ${bGlow}`:`0 14px 36px ${bGlow}, 0 0 26px ${bGlow}`):"none",
              animation:stageBorder&&stageBorder.rainbow
                ?"rainbowFlow 4s linear infinite"
                :stageBorder&&stageBorder.shimmer
                  ?"metalShine 4s linear infinite"
                  :"none"}}>
              {/* 반짝이 프레임 광택 스윕 (실버/골드/루비/레전드) */}
              {stageBorder&&(stageBorder.shimmer||stageBorder.rainbow)&&(
                <div style={{position:"absolute",inset:0,borderRadius:"inherit",pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:"-40%",width:"45%",height:"100%",background:`linear-gradient(105deg, transparent, rgba(255,255,255,${cute?0.6:0.85}), transparent)`,transform:"skewX(-18deg)",willChange:"transform",animation:"shineMove 4s ease-in-out infinite"}}/>
                </div>
              )}
            <div className={cute?undefined:(stageBorder?"amStageFill amStageFillBd":"amStageFill")}
              style={{position:"relative",borderRadius:cute?(stageBorder?30:34):"0",padding:cute?"18px 18px 16px":"120px 18px 26px",overflow:"hidden",
              // 목업형(탐험): 테두리 장착 여부와 무관하게 장면이 화면 높이를 채우고 캐릭터는 하단 정렬 → 하늘이 넓게 열림
              // 높이는 index.html의 .amStageFill(=화면 높이 − 시트 머리)로 준다 — 첫 화면이 탭 줄에서 딱 끝나게.
              ...(!cute?{display:"flex",flexDirection:"column",justifyContent:"flex-end",boxSizing:"border-box"}:{}),
              contain:"paint",   // 카드 내부의 애니메이션 리페인트를 카드 안으로 격리 → 헤더 등 바깥 UI 페인트 지연 방지
              background:stageBg,
              // 탐험(개방감): 테두리 없이 화면 끝까지. 베이커리: 기존 카드형(흰 테두리) 유지
              border:stageBorder?"none":(cute?"2px solid #fff":"none"),
              boxShadow:cute?`0 16px 36px ${th.main}3a, inset 0 2px 8px rgba(255,255,255,0.85)`:"none"}}>
              {/* 탐험 기본 풍경 (밤·숲속 캠프) — 배경 꾸미기 미장착 시 기본 배경으로 */}
              {!cute&&!stageBgDeco&&<DungeonScenery/>}
              {/* 베이커리 기본 풍경 (하늘+해+구름+제과점) — 그대로 유지 */}
              {cute&&!stageBgDeco&&<BakeryScenery/>}
              {/* 캐릭터 스포트라이트 — 탐험/베이커리 공통이라 일단 유지 */}
              <div style={{position:"absolute",inset:0,background:spotlight,pointerEvents:"none",zIndex:0}}/>
              {/* ── 장착 배경 꾸미기 (은은한 tint + 떠다니는 장식) — 탐험·베이커리 공통 ── */}
              {/* 구매 배경의 테마 풍경(탐험: 숲/바다/섬/정글/공룡/우주, 베이커리: 벚꽃/딸기/별사탕/초콜릿/천상/무지개) */}
              {stageBgDeco&&<AdventureBgScenery bgId={stageBgDeco.id}/>}
              {/* 원화 배경 — SVG 풍경 '위에' 덮는 한 장. 그림이 아직 없으면 이 장만 사라지고
                  아래 SVG 풍경이 그대로 보인다 (사용자 확정 2026-08-11: 그림이 없다고 기본
                  초원으로 떨어지면, 바다를 산 아이가 산을 보게 된다). */}
              {stageBgDeco?.img&&(
                <img src={stageBgDeco.img} alt="" draggable={false}
                  onError={e=>{ e.currentTarget.style.display="none"; }}
                  style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",
                    objectPosition:"center 68%",borderRadius:"inherit",pointerEvents:"none",zIndex:0}}/>
              )}
              {/* 탐험·베이커리 모두 구매한 배경 이모지를 흩뿌려 표시 */}
              {stageBgDeco&&(()=>{
                const own = (stageBgDeco.deco||[]).filter(Boolean);
                if(own.length===0) return null;
                // ── 베이커리 전용 배경: id별 고정 좌표 배치(자동 분산 대신) ──
                // 좌표계: 무대카드 전체 기준 %. 캐릭터≈가로40%/세로37%(귀 위), 펫≈가로57%/세로42%(오른쪽 위).
                // {e:이모지, l:left%, t:top%, s:크기배율, r:회전, d:애니딜레이}
                const BAKERY_BG_LAYOUT = {
                  bbg_sakura: [   // 벚꽃 마을 (5개, 종류 전부: 🏡×2 · 🌸 · 🌷 · 🌿)
                    {e:"🏡",l:64,t:30,s:1.0,r:-6,d:0.2},  // 펫 오른쪽 위 (가까운 집)
                    {e:"🏡",l:8,t:14,s:0.95,r:4,d:0.8},   // 좌상단 (먼 집)
                    {e:"🌸",l:84,t:12,s:1.05,r:10,d:0.6},
                    {e:"🌷",l:14,t:66,s:1.0,r:0,d:1.0},
                    {e:"🌿",l:88,t:74,s:0.9,r:-6,d:1.4},
                  ],
                  bbg_strawberry: [   // 딸기 농장 (5개, 종류 전부: 🏡×2 · 🍓×2 · 🌿)
                    {e:"🏡",l:64,t:30,s:1.0,r:-5,d:0.2},  // 펫 오른쪽 위
                    {e:"🏡",l:8,t:14,s:0.95,r:5,d:0.8},
                    {e:"🍓",l:84,t:12,s:1.1,r:10,d:0.6},
                    {e:"🍓",l:14,t:66,s:1.1,r:0,d:1.0},
                    {e:"🌿",l:88,t:74,s:0.9,r:-6,d:1.4},
                  ],
                  bbg_starcandy: [   // 별사탕 왕국 (5개, 종류 전부: 🌟 · ⭐ · 🍬 · 🍭)
                    {e:"⭐",l:10,t:12,s:1.0,r:-8,d:0},
                    {e:"🌟",l:48,t:5,s:1.0,r:0,d:0.3},
                    {e:"🍭",l:64,t:30,s:1.0,r:-6,d:0.2},    // 펫 오른쪽 위
                    {e:"🍬",l:90,t:50,s:0.95,r:-10,d:1.1},
                    {e:"🌟",l:16,t:78,s:1.0,r:0,d:1.0},
                  ],
                  bbg_choco: [   // 초콜릿 공장 (4개, 종류 전부: 🍫 · 🍩 · 🍪 · 🍰)
                    {e:"🍫",l:64,t:28,s:0.92,r:-5,d:0.2},  // 펫 오른쪽 위
                    {e:"🍩",l:86,t:14,s:0.92,r:10,d:0.5},
                    {e:"🍪",l:12,t:74,s:0.98,r:0,d:1.0},
                    {e:"🍰",l:88,t:72,s:1.0,r:6,d:0.7},
                  ],
                  bbg_heaven: [   // 천상의 베이커리 (5개, 종류 전부: 👼 · ☁️ · 🧁 · 🍰 · ✨)
                    {e:"👼",l:62,t:24,s:1.25,r:-4,d:0.1},  // 펫 오른쪽 위
                    {e:"☁️",l:8,t:44,s:1.1,r:0,d:1.0},
                    {e:"🧁",l:14,t:78,s:1.05,r:-6,d:1.2},
                    {e:"🍰",l:86,t:80,s:1.0,r:6,d:0.8},
                    {e:"✨",l:88,t:16,s:0.9,r:0,d:0.5},
                  ],
                  // bbg_rainbow(무지개 케이크 왕국)은 레이아웃 미지정 → 기존 자동 분산 유지
                };
                const fixedLayout = BAKERY_BG_LAYOUT[stageBgDeco.id];
                // 첫 번째 이모지를 '주인공'으로 강조 — 더 자주, 더 크게 등장시킨다.
                // (예: 솜사탕 구름은 ☁️ 가 deco[0] 이므로 구름이 화면을 채우고 나머지는 양념처럼)
                const lead = own[0];
                const manyDeco = own.length>=4;
                let seq;
                // 개수는 절반으로 줄이되 '종류는 모두' 최소 1개씩 나오게 한다.
                //  · 슬롯 수 = max(종류 수, 기존의 절반)  → 종류가 많으면 종류 수만큼만
                //  · 먼저 모든 종류를 1개씩 채우고, 남는 칸은 메인(deco[0])으로
                if(manyDeco){
                  const SLOTS = Math.max(own.length, 5);   // 기존 10 → 5 (종류가 6이면 6)
                  const tmp = [];
                  own.forEach(e=>tmp.push(e));             // 종류 전부 1개씩 보장
                  while(tmp.length < SLOTS) tmp.push(lead);
                  const idx = tmp.map((_,i)=>i).sort((a,b)=>{
                    const ra=(a*7+3)%tmp.length, rb=(b*7+3)%tmp.length;
                    return ra-rb;
                  });
                  seq = idx.map(i=> tmp[i]);
                }else{
                  const N = Math.max(own.length, 4);        // 기존 8 → 4 (종류 전부 보장)
                  const tmp = [];
                  own.forEach(e=>tmp.push(e));
                  while(tmp.length < N) tmp.push(lead);
                  seq = tmp;
                }
                const allDoneBg = allDone; // 미션 100% 완료 시 더 화려하게(축하)
                // 이모지별 크기 보정 (지구·무지개는 작게, 번개·구름은 강조)
                const emScale={"🌎":0.7,"🌍":0.7,"🌏":0.7,"⚡":1.3,"🐉":1.1,"🌈":0.8,"☁️":1.25,"🪐":1.15,"🛸":1.0,"☄️":0.95,"🛰️":0.9,"🚀":1.0,"🌊":1.2,"🐬":1.15,"🐠":1.0,"🐚":0.85,"🦀":0.95,"🫧":0.8,"🐙":0.95,"🍓":1.1,"🌸":1.1,"🏡":0.95,"🌷":0.95,"🌿":0.9,"🍫":1.1,"🍩":1.0,"🍪":1.0,"🍰":1.0,"🧁":1.05,"🎂":1.0,"🍭":0.95,"🍬":0.95,"👼":1.05,"✨":0.85,"⭐":0.9,"🌟":1.0};
                // 카드 전체에 골고루 분산(최대 10칸). 중앙 캐릭터 영역은 비워 둠.
                const spots=[
                  {l:12,t:7,r:-12,d:0},    {l:50,t:5,r:8,d:0.6},
                  {l:86,t:10,r:-10,d:1.0}, {l:5,t:34,r:10,d:0.4},
                  {l:93,t:40,r:-14,d:1.4}, {l:10,t:74,r:8,d:0.9},
                  {l:88,t:78,r:-8,d:0.3},  {l:46,t:88,r:12,d:1.2},
                  {l:28,t:22,r:14,d:0.7},  {l:72,t:60,r:-12,d:1.5},
                ];
                return (
                  <>
                    <div style={{position:"absolute",inset:0,borderRadius:"inherit",background:`radial-gradient(130% 100% at 50% 0%, ${stageBgDeco.tint}, transparent 72%)`,pointerEvents:"none",zIndex:0,animation:"bgTintIn .6s ease both"}}/>
                    <div style={{position:"absolute",inset:0,borderRadius:"inherit",pointerEvents:"none",overflow:"hidden",zIndex:0}}>
                      {fixedLayout
                        ? fixedLayout.map((it,i)=>{
                            const baseSize=allDoneBg?(i%2?17:21):(i%2?13:16);
                            return (
                            <span key={`bg${i}`} style={{position:"absolute",
                              left:`${it.l}%`,top:`${it.t}%`,
                              fontSize:Math.round(baseSize*(it.s||1)),
                              opacity:allDoneBg?0.95:0.6,
                              transform:`rotate(${it.r||0}deg)`,
                              filter:"drop-shadow(0 1px 3px rgba(0,0,0,0.12))",
                              willChange:"transform",
                              animation:`sparkleFloat ${2.1+i*0.28}s ease-in-out ${it.d||0}s infinite`}}>{it.e}</span>
                            );
                          })
                        : seq.map((s,i)=>{
                            const sp=spots[i % spots.length];
                            const baseSize=allDoneBg?(i%2?17:21):(i%2?13:16);
                            return (
                            <span key={`bg${i}`} style={{position:"absolute",
                              left:`${sp.l}%`,top:`${sp.t}%`,
                              fontSize:Math.round(baseSize*(emScale[s]||1)),
                              opacity:allDoneBg?0.92:(i%3===0?0.62:0.5),
                              transform:`rotate(${sp.r}deg)`,
                              filter:`drop-shadow(0 1px 3px rgba(0,0,0,0.12))${s==="⚡"?" drop-shadow(0 0 6px rgba(255,235,90,0.85))":""}`,
                              willChange:"transform",
                              animation:`sparkleFloat ${2.1+i*0.28}s ease-in-out ${sp.d}s infinite`}}>{s}</span>
                            );
                          })}
                    </div>
                  </>
                );
              })()}
              {/* 말풍선 — 진행도 멘트. 탐험(개방감)은 헤더 텍스트로 대체되어 숨김. 베이커리만 캐릭터 위 말풍선 유지. */}
              {!hideStageCheer&&cute&&(
              <div style={{position:"relative",zIndex:2,display:"flex",justifyContent:"center",marginBottom:2,marginTop:2}}>
                <div style={{position:"relative",background:cute?`linear-gradient(160deg, ${mixWhite(th.main,0.88)}, ${mixWhite(th.main,0.78)})`:"#F5F1E8",color:cute?mixBlack(th.main,0.42):"#2A2A45",borderRadius:18,padding:"8px 16px",fontSize:14,fontWeight:900,boxShadow:cute?`0 6px 14px ${th.main}26, inset 0 1.5px 3px rgba(255,255,255,0.7)`:"0 5px 14px rgba(0,0,0,0.22)",maxWidth:cute?"82%":"92%",whiteSpace:cute?"normal":"nowrap",textAlign:"center",lineHeight:1.35,
                  animation:"bubbleIn .5s cubic-bezier(.34,1.56,.64,1) both",border:cute?`2px solid ${mixWhite(th.main,0.7)}`:"none"}}>
                  {msg}
                  {/* 말풍선 꼬리 — 탐험·베이커리 모두 가운데 아래(캐릭터 머리 방향) */}
                  <div style={{position:"absolute",bottom:-7,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderTop:`8px solid ${cute?mixWhite(th.main,0.8):"#F5F1E8"}`}}/>
                </div>
              </div>
              )}
              {/* 캐릭터 무대 — 탐험·베이커리 공통: 중앙 캐릭터+펫 / 레벨·상장은 하단 알약칩 줄로 통일 */}
              <div style={{position:"relative",zIndex:2,display:"flex",alignItems:cute?"center":"stretch",justifyContent:cute?"center":"center",gap:8,marginTop:cute?16:12,minHeight:cute?104:245}}>
                {/* ── 중앙(탐험)·좌측(베이커리): 캐릭터 + 펫 ── */}
                {/* [탐험] 펫은 절대배치(우측 하단) → 캐릭터 본체가 화면 정중앙에 정확히 옴 / [베이커리] 기존 flex 나란히 유지 */}
                {/* [탐험] translateY 6→-14: 발끝이 하단 시트에 눌려 보여 캐릭터·펫을 화면 높이 약 3% 위로 (아바타/성장 공통 컨테이너라 함께 이동)
                    X -14px: 펫이 오른쪽에 붙으면서 우측으로 쏠린 시각 무게중심 보정 (우측 뱃지 아이콘들과의 간격 확보) */}
                <div style={{flex:1,minWidth:0,position:"relative",display:"flex",alignItems:"flex-end",justifyContent:"center",gap:cute?26:14,transform:cute?undefined:"translate(-14px, -14px)"}}>
                  {/* 메인 캐릭터 + 레벨 이모지 뱃지 */}
                  <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center"}}>
                    <div style={{position:"relative",zIndex:1}}>
              {/* 캐릭터+무기를 한 컨테이너로 묶어 같은 둥실(floatHero)로 통째로 움직인다 → 타이밍 100% 일치 */}
                      {/* 목업형: '캐릭터' 타일이 빠진 대신 캐릭터를 탭하면 내 캐릭터 탭이 열린다 (기능 보존) */}
                      <div onClick={cute?undefined:()=>setChildTab("growth")} style={{position:"relative",display:"inline-block",willChange:"transform",animation:charAnim,cursor:cute?undefined:"pointer"}}>
                      {(()=>{ // AI 일러스트 캐릭터 — 탐험/베이커리 모두 (진화 단계별 키 성장, 발끝 하단 정렬)
                        const _st=ADV_CHAR_STAGE_OF(level.level); // 두 모드 동일 구간(1/5/9/13/17)
                        const _g=(children.find(c=>c.id===childId)?.gender)==="girl"?"girl":"boy";
                        const _SZ=cute?BAKERY_CHAR_SIZE:ADV_CHAR_SIZE;
                        const _sz=_SZ[_st];
                        const _IMG=cute?BAKERY_CHAR_IMG:ADV_CHAR_IMG;
                        // 표시 모드가 '아바타'면 꾸미기 아바타를 보여준다 (성장 캐릭터와 토글).
                        if(getCharMode(childId)===CHAR_DISPLAY_AVATAR){
                          // 아바타 원본(1024² 캔버스)은 캐릭터 실폭≈30%·세로 12%~92% 구간에 위치.
                          // [주의] flex 컨테이너에 넣으면 flex-shrink로 정사각형이 눌려 캐릭터가 통째로 축소된다(이전 버그).
                          // → 절대배치로 크기를 완전 고정: 바깥 div가 레이아웃 자리(실루엣 폭×실루엣 높이)만 차지하고,
                          //   아바타 정사각형은 그 중앙·발끝이 바깥 div 바닥선에 오도록 고정 → 펫도 옆에 붙고 접지도 정확.
                          const _avSz=cute?Math.round(_sz*1.18):AVATAR_HOME_SIZE[_st]; // 탐험: 독립 크기표(성장 캐릭터와 비연동) / 베이커리: 기존 비례 유지
                          // [탐험] 레이아웃 박스 높이를 성장 캐릭터(_sz)와 동일하게 → 모드 전환 시 무대 줄 높이가 같아져
                          //        배경 전체 크기·팻말 버튼·펫(알) 위치가 그대로 유지되고, 발끝도 같은 바닥선에 접지된다.
                          //        (아바타 그림 자체 크기는 _avSz 그대로 — 박스 위로만 넘치고 바닥 기준은 불변)
                          return (
                            <div style={{position:"relative",width:Math.round(_avSz*0.42),height:cute?Math.round(_avSz*0.80):_sz}}>
                              <div style={{position:"absolute",left:"50%",bottom:-Math.round(_avSz*0.08),transform:"translateX(-50%)",width:_avSz}}>
                                <AvatarViewer equipped={getAvatarEquipped(childId)} size={_avSz} showFrame={false} showBg={false} baseCharImg={getAvatarBaseCharImg(childId)} gender={(children.find(c=>c.id===childId)?.gender)==="girl"?"girl":"boy"} />
                              </div>
                            </div>
                          );
                        }
                        return (
                          // 타이트 재단 이미지: 높이=_sz, 폭은 그림 비율대로 → 캐릭터 몸에 딱 맞는 박스 (펫·주변 요소가 몸 기준으로 붙음)
                          <img src={_IMG[_g][_st]} alt="캐릭터" draggable={false}
                            decoding="sync" fetchpriority="high"
                            style={{display:"block",height:_sz,width:"auto",maxWidth:"none",filter:cute?"drop-shadow(0 9px 12px rgba(120,60,90,0.25))":"drop-shadow(0 8px 12px rgba(0,0,0,0.35))",transition:"height .3s"}}/>
                        );
                      })()}
                      </div>
                    </div>
                    {/* (삭제됨) 발밑 테마색 라이트 원 — 공중부양 방지용이었으나 접지 그림자로 대체. 사용자 확정. */}
                    {/* 바닥 그림자 — 발에 밀착된 접지 그림자 (marginTop을 크게 당겨 부츠 바로 밑에 붙임)
                        아바타 모드에선 AvatarViewer가 자기 발끝 좌표에 맞춰 직접 그리므로 여기선 생략(이중 그림자 방지). */}
                    {getCharMode(childId)!==CHAR_DISPLAY_AVATAR&&(
                      <div style={{position:"relative",zIndex:1,width:118,height:19,borderRadius:"50%",background:cute?"rgba(120,80,100,0.20)":"rgba(0,0,0,0.26)",filter:"blur(5px)",marginTop:-13,animation:"shadowPulsePet 2.6s ease-in-out infinite -1.3s"}}/>
                    )}
                  </div>
                  {/* 펫 — 보조 역할이므로 캐릭터보다 작게(기존 40 → 34). 알 단계(0)엔 '곧 부화!'로 기대감 UP */}
                  {/* [탐험] 존재감 개선: 구석(우측 10%) → 캐릭터 발 옆(중앙+62px). 알 단계는 말풍선+반짝이+둥지+10초 간헐 흔들림(둥실 제거). */}
                  <div style={{position:cute?"relative":"absolute",left:cute?undefined:"50%",marginLeft:cute?undefined:petDx,bottom:cute?undefined:6,display:"flex",flexDirection:"column",alignItems:"center",marginBottom:cute?8:0}}>
                    {/* (이동됨) 오늘의 발견 말풍선 — 펫 옆이 아니라 탐험지도 위 '아이 머리 위'에 뜬다.
                        아이가 보물상자 옆에 도착해 상자가 열린 다음에 나온다 (사용자 확정 → AdventureMap의 bubble prop). */}
                    {/* "먹이 +1" 연출은 지도 발견 지점 위로 이동 (사용자 확정 — 펫이 화면에
                        안 보일 때가 많아서). 여기엔 그날의 ❤️ 말풍선만 남는다. */}
                    {!cute&&pet.stage===0?(
                    <>
                      {/* 말풍선 — 알 위 (사용자 확정: 위가 더 귀여움), 간격 14→3px + 살짝 우측: 알과 한 덩어리로 보이게.
                          펫 연결 발견을 한 날은 ❤️ — 하트 날은 우측 시프트 없이 알과 가운데 정렬,
                          말풍선·하트를 키우고 더 위로 띄운다 (사용자 조정) */}
                      <div style={{position:"relative",background:"rgba(255,248,235,0.96)",color:"#5D4633",fontSize:petHeart?16:11,fontWeight:900,padding:petHeart?"5px 11px":"4px 9px",borderRadius:petHeart?13:11,boxShadow:"0 2px 7px rgba(93,70,51,0.28)",whiteSpace:"nowrap",marginBottom:petHeart?11:3,transform:petHeart?"none":"translateX(4px)",lineHeight:1.2}}>
                        {petHeart?"❤️":"곧 부화! 🐣"}
                        <div style={{position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:"5px solid rgba(255,248,235,0.96)"}}/>
                      </div>
                      {/* 알 + 반짝이 (5초 주기: 반짝 → 살짝 흔들). 크림 외곽선으로 초록 배경에서 분리 */}
                      <div style={{position:"relative"}}>
                        <span style={{position:"absolute",top:-11,left:-17,fontSize:13,animation:"eggSparkle 5s ease-in-out infinite",pointerEvents:"none"}}>✨</span>
                        <span style={{position:"absolute",top:-4,right:-16,fontSize:11,animation:"eggSparkle 5s ease-in-out infinite -0.3s",pointerEvents:"none"}}>✨</span>
                        <div style={{fontSize:46,lineHeight:1,animation:"eggWiggle 5s ease-in-out infinite",transformOrigin:"50% 90%",filter:"drop-shadow(0 0 2px rgba(246,243,232,0.95)) drop-shadow(0 0 1px rgba(246,243,232,0.9)) drop-shadow(0 5px 7px rgba(0,0,0,0.25))"}}>{pet.emoji}</div>
                      </div>
                      {/* 둥지 */}
                      <div style={{fontSize:15,lineHeight:1,marginTop:-6,letterSpacing:"-0.35em",paddingRight:"0.35em",filter:"drop-shadow(0 2px 3px rgba(40,70,40,0.3))"}}>🌿🌿🌿</div>
                    </>
                    ):!cute?(
                    <>
                      {/* [탐험] 부화한 펫: 캐릭터 키 대비 존재감 확보 — 34→46px + 크림 외곽선 + 상단 말풍선.
                          (삭제됨) 상시 반짝이 ✨ — 지도 발견 지점 ✨와 헷갈려서 뺐다. 알만 유지 (사용자 확정) */}
                      <div style={{position:"relative"}}>
                        <div style={{fontSize:46,lineHeight:1,animation:"floatHero 2.6s ease-in-out infinite -1.3s",filter:"drop-shadow(0 0 2px rgba(246,243,232,0.95)) drop-shadow(0 0 1px rgba(246,243,232,0.9)) drop-shadow(0 6px 8px rgba(0,0,0,0.25))"}}>{pet.emoji}</div>
                      </div>
                      <div style={{width:34,height:8,borderRadius:"50%",background:"rgba(0,0,0,0.3)",filter:"blur(2.5px)",marginTop:-2,animation:"shadowPulsePet 2.6s ease-in-out infinite -1.3s"}}/>
                      {/* 말풍선 — 펫 위 (사용자 확정: 알 말풍선과 통일), 꼬리는 아래로.
                          펫 연결 발견을 한 날은 ❤️로 바뀐다 — 하트 날은 말풍선·하트를 키우고
                          더 위로 띄운다 (사용자 조정: 18→30px, 글자 11→16) */}
                      <div style={{position:"absolute",bottom:"100%",left:"50%",transform:"translateX(-50%)",marginBottom:petHeart?30:18,background:"rgba(255,248,235,0.96)",color:"#5D4633",fontSize:petHeart?16:11,fontWeight:900,padding:petHeart?"5px 11px":"3px 8px",borderRadius:petHeart?13:11,boxShadow:"0 2px 7px rgba(93,70,51,0.28)",whiteSpace:"nowrap",lineHeight:1.2}}>
                        {petHeart?"❤️":"🐾 펫"}
                        <div style={{position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"5px solid transparent",borderRight:"5px solid transparent",borderTop:"5px solid rgba(255,248,235,0.96)"}}/>
                      </div>
                    </>
                    ):(
                    <>
                      <div style={{fontSize:34,lineHeight:1,animation:"floatHero 2.6s ease-in-out infinite -1.3s",filter:"drop-shadow(0 6px 8px rgba(0,0,0,0.22))"}}>{pet.emoji}</div>
                      <div style={{width:28,height:7,borderRadius:"50%",background:"rgba(120,80,100,0.14)",filter:"blur(2.5px)",marginTop:-2,animation:"shadowPulsePet 2.6s ease-in-out infinite -1.3s"}}/>
                      <span style={{position:"absolute",bottom:-17,fontSize:pet.stage===0?12.5:11.5,fontWeight:900,color:mixBlack(th.main,0.3),whiteSpace:"nowrap"}}>{pet.stage===0?"곧 부화! 🐣":"🐾 펫"}</span>
                    </>
                    )}
                  </div>
                </div>
                {/* 우측 칩 제거 — 베이커리도 탐험처럼 캐릭터 중앙 + 레벨/상장 하단 알약칩으로 통일 */}
              </div>
              {/* ── 하단: 레벨·상장 정보 줄 (탐험·베이커리 공용 알약칩) ── */}
              {(()=>{
                const tr = TITLE_RARITY[title.rarity] || TITLE_RARITY.common;
                const lvCol = cute ? mixBlack(th.main,0.22) : (GP.gold||"#FFD166"); // 베이커리=테마 진한색 / 탐험=골드
                // 배경 꾸미기를 장착하면 무대카드가 어둡거나 색이 들어가므로, 그때만 칩을 어두운 배경+흰 글자로.
                const onScene = !!stageBgDeco;
                // 정보 칩: 동그란 이모지 + 라벨 (레벨/상장).
                const InfoChip=({ring,emoji,text})=>{
                  // 탐험은 원래 어두운 칩. 베이커리는 칩 색은 그대로 두되, 배경 꾸미기 장착(무대 어두움) 시 글자만 밝게.
                  const lightText = !cute || onScene;      // 글자를 흰색으로 (탐험 / 배경 꾸미기 장착한 베이커리)
                  const borderOpacity = cute
                    ? ((title.rarity==="common"||title.rarity==="legendary") ? "BB" : "77")
                    : "88";
                  return (
                  <div style={{display:"flex",alignItems:"center",gap:5,
                    background: cute ? `linear-gradient(135deg, ${ring}26, ${ring}12)` : GP.chipBg,
                    border:`1.5px solid ${ring}${borderOpacity}`,borderRadius:999,padding:"3px 10px 3px 4px",
                    boxShadow: cute ? `0 3px 9px ${ring}33` : "0 2px 6px rgba(0,0,0,0.3)"}}>
                    <span style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:cute?`radial-gradient(circle at 50% 35%, #fff, ${ring}22)`:`radial-gradient(circle at 50% 35%, ${ring}44, rgba(0,0,0,0.35))`,border:`1.5px solid ${ring}`,fontSize:13,flexShrink:0}}>{emoji}</span>
                    <span style={{fontSize:10,fontWeight:900,color:lightText?"#fff":mixBlack(ring,0.2),whiteSpace:"nowrap",letterSpacing:0.2,textShadow:lightText?"0 1px 2px rgba(0,0,0,0.55)":"none"}}>{text}</span>
                  </div>
                  );
                };
                // [탐험] 팻말 버튼은 우측 상단 뱃지로 이동 — 이 줄은 베이커리 칩 전용, 탐험은 빈 줄(마진)만 남아 하단 여백 유지
                return (
                  <div style={{position:"relative",zIndex:2,marginTop:cute?10:4,marginBottom:cute?0:10,display:"flex",alignItems:"center",justifyContent:cute?"center":"flex-start",gap:8,flexWrap:"wrap"}}>
                    {cute&&<InfoChip ring={lvCol} emoji={level.emoji} text={`Lv.${level.level}`}/>}
                    {cute&&<InfoChip ring={tr.color} emoji={title.emoji} text={title.name}/>}
                    {/* 성장 캐릭터 ↔ 꾸미기 아바타 표시 전환 — 탐험 모드는 우측 상단 원형 뱃지로 이동(사용자 확정), 베이커리(cute)만 여기 칩 유지 */}
                    {cute&&(
                    <button onClick={toggleCharDisplayMode}
                      style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",
                        background:`linear-gradient(135deg, ${th.main}22, ${th.main}10)`,
                        border:`1.5px solid ${th.main}77`,borderRadius:999,padding:"4px 11px",
                        color:mixBlack(th.main,0.25),fontSize:10,fontWeight:900,whiteSpace:"nowrap",
                        boxShadow:`0 3px 9px ${th.main}33`}}>
                      {getCharMode(childId)===CHAR_DISPLAY_AVATAR?"🌱 성장 보기":"🎒 내 아바타"}
                    </button>
                    )}
                  </div>
                );
              })()}
            </div>
            </div>
          );
}

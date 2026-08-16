import { useState } from "react";
import { DAYS, C } from "../data/tokens.js";
import { getAcademyKind, ACADEMY_KIND_CUSTOM } from "../data/gameData.jsx";
import AcademyKindPicker from "./parent/AcademyKindPicker.jsx";
import CareIcon from "./parent/CareIcons.jsx";
import { NAV_ICONS } from "./parent/ParentNav.jsx";

// 코치마크 직후 1회, 또는 설정에서 호출. onPick(skinId) 으로 선택 전달.
/* ════════════════════════════════════════════════════════════════════════
   SECTION 8. 진입/온보딩 플로우 컴포넌트
   ════════════════════════════════════════════════════════════════════════ */

export function ModeSelect({ onPick }){
  const wrap={position:"fixed",inset:0,zIndex:9998,background:"linear-gradient(160deg,#F3EEF7,#FBF1F3)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",wordBreak:"keep-all"};
  const panel={width:"100%",maxWidth:360,background:"linear-gradient(170deg,#FBF8FC,#F7EFF4)",borderRadius:30,padding:"30px 18px 30px",boxSizing:"border-box",boxShadow:"0 18px 50px rgba(60,52,90,0.2)"};
  const pill={fontSize:13,fontWeight:800,color:"#9A8FA8",background:"#fff",padding:"6px 16px",borderRadius:999,boxShadow:"0 2px 8px rgba(0,0,0,0.05)"};
  const card=(bg,shadow)=>({flex:1,minWidth:0,borderRadius:24,padding:"20px 14px 18px",cursor:"pointer",background:bg,boxShadow:shadow,display:"flex",flexDirection:"column",border:"3px solid transparent"});
  const chip=(bg,col)=>({fontSize:11,fontWeight:700,padding:"5px 10px",borderRadius:999,textAlign:"center",background:bg,color:col});
  return (
    <div style={wrap}>
      <div style={panel}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:22}}><span style={pill}>🎒 아이용 · 처음 왔어요!</span></div>
        <div style={{textAlign:"center",marginBottom:24,paddingTop:8}}>
          <p style={{fontSize:23,fontWeight:900,color:"#2D2536",margin:0,letterSpacing:"-0.5px"}}>어떤 게임이 좋아요?</p>
          <p style={{fontSize:13.5,fontWeight:600,color:"#9A8FA8",margin:"8px 0 0",lineHeight:1.55}}>마음에 드는 세계를 골라주세요.<br/>한 번 고르면 바꿀 수 없으니 신중하게!</p>
        </div>
        <div style={{display:"flex",gap:13}}>
          {/* 탐험 게임 */}
          <div style={card("linear-gradient(155deg,#3A3470,#2E2F5C)","0 10px 24px rgba(58,52,112,0.32)")} onClick={()=>onPick("dungeon")}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:1,color:"#FFD166",marginBottom:6}}>1번</div>
            <div style={{fontSize:40,lineHeight:1,marginBottom:8}}>🧭</div>
            <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>탐험<br/>게임</div>
            <div style={{fontSize:12.5,fontWeight:600,color:"#C5C8E8",marginTop:9,lineHeight:1.5,flex:1}}>탐험가가 되어<br/>탐험을 떠나요</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:14}}>
              <span style={chip("rgba(255,209,102,0.18)","#FFD166")}>🧭 미션</span>
              <span style={chip("rgba(255,209,102,0.18)","#FFD166")}>🗺️ 탐험 떠나기</span>
            </div>
          </div>
          {/* 베이커리 게임 */}
          <div style={card("linear-gradient(155deg,#E85A77,#D6455A)","0 10px 24px rgba(214,69,90,0.32)")} onClick={()=>onPick("cute")}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:1,color:"#FFE3EC",marginBottom:6}}>2번</div>
            <div style={{fontSize:40,lineHeight:1,marginBottom:8}}>🧁</div>
            <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>베이커리<br/>게임</div>
            <div style={{fontSize:12.5,fontWeight:600,color:"#FFE3EC",marginTop:9,lineHeight:1.5,flex:1}}>달콤한 가게에서<br/>도장을 모아요</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:14}}>
              <span style={chip("rgba(255,255,255,0.22)","#FFFFFF")}>🎀 오늘 할 일</span>
              <span style={chip("rgba(255,255,255,0.22)","#FFFFFF")}>⭐ 도장 꾹</span>
            </div>
          </div>
        </div>
        <div style={{textAlign:"center",fontSize:12,color:"#A0A6C0",marginTop:22,fontWeight:600}}>탭하면 그 모드로 시작해요</div>
      </div>
    </div>
  );
}

export function CoachmarkOverlay({ th, onFinish }){
  const TH=th||{ main:"#3B7ECD", grad:"linear-gradient(135deg,#3B7ECD,#80A9DA)" };
  /* [2026-08-09] 하단 고정 메뉴 5칸으로 개편 — 안내도 같은 순서·같은 이름으로 맞췄다.
     [2026-08-16] 학원 칸이 빠져 하단은 네 칸, 안내는 여섯 장이 됐다.
     [사용자 확정 2026-08-11] 일곱 장은 그대로 두고 설명만 한 줄로 줄였다 —
     두 줄씩 읽어야 해서 일곱 번 넘기기 전에 지친다. 문구는 사용자가 정한 그대로 쓴다.
     (잠금만 두 줄 — 비밀번호를 왜 묻는지까지 말해야 뜻이 통한다) */
  /* [사용자 확정 2026-08-11] 안내 카드의 이모지(🏠 🎓 🎯 🎁 ☰ 🔒 🎒)는 기기마다 그림체가
     달라지고, 정작 아이 어머니가 화면에서 보게 될 그림과도 달랐다 →
     탭 다섯은 하단 메뉴에 실제로 그려지는 아이콘(NAV_ICONS)을 그대로 쓴다.
     '이 그림을 찾으면 된다'가 바로 통한다. 잠금·아이용은 같은 결의 선 아이콘. */
  /* [2026-08-16] '학원' 칸을 빼서 여섯 장이 됐다 — 학원 탭이 홈의 '등록 학원'
     토글로 합쳐지면서 하단 메뉴에서 사라졌다(사용자 확정). 없는 탭을 안내하던 장이다.
     같은 이유로 홈 설명도 '학원도 여기서 등록해요'를 덧붙였다 — 학원 등록 자리를
     못 찾는 일이 없어야 한다. */
  const items=[
    { icon:NAV_ICONS.home,     name:"홈", desc:"오늘 챙길 일과 학원 일정을 한눈에 보고, 학원도 여기서 등록해요." },
    { icon:NAV_ICONS.mission,  name:"미션", desc:"날짜별 미션과 점수를 관리해요." },
    { icon:NAV_ICONS.reward,   name:"보상", desc:"코인으로 바꿀 보상을 정하고, 아이가 신청하면 승인해요." },
    { icon:NAV_ICONS.more,     name:"더보기", desc:"달력 · 학원비 · 결석·보충 · 기타가 여기 있어요." },
    { icon:<CareIcon name="lock" size={23}/>, name:"미션·보상은 잠금",
      desc:"이곳은 엄마 권한이라서\n비밀번호를 한번 물어봐요.\n(초기 비밀번호 1234)." },
    { icon:<CareIcon name="bag" size={23}/>, name:"아이용", desc:"오른쪽 위 '🎒 아이용' 버튼을 누르면 아이 화면으로 바뀌어요." },
  ];
  const [i,setI]=useState(0);
  const last=i===items.length-1;
  const it=items[i];
  return (
    <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(15,16,30,0.78)",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"24px",wordBreak:"keep-all"}}>
      <div style={{textAlign:"center",marginBottom:"auto",marginTop:"22vh"}}>
        <p style={{color:"rgba(255,255,255,0.85)",fontSize:14,fontWeight:700,margin:0}}>화면 아래 탭을 눌러 이동해요</p>
        <p style={{color:"#fff",fontSize:22,fontWeight:900,margin:"8px 0 0"}}>{i+1} / {items.length}</p>
      </div>
      <div style={{background:"#fff",borderRadius:22,padding:"24px 22px",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <div style={{width:48,height:48,borderRadius:14,background:`${TH.main}15`,color:TH.main,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{it.icon}</div>
          <p style={{fontSize:20,fontWeight:900,color:"#1A1A35",margin:0}}>{it.name}</p>
        </div>
        <div style={{minHeight:54,marginBottom:20}}>
          <p style={{fontSize:15,fontWeight:600,color:"#5A6072",lineHeight:1.7,margin:0,whiteSpace:"pre-line"}}>{it.desc}</p>
        </div>
        <div style={{display:"flex",gap:5,justifyContent:"center",marginBottom:18}}>
          {items.map((_,idx)=>(<span key={idx} style={{width:idx===i?20:7,height:7,borderRadius:99,background:idx===i?TH.main:"#D9DEE8",transition:"all .25s"}}/>))}
        </div>
        <div style={{display:"flex",gap:10}}>
          {!last&&<button onClick={onFinish} style={{flex:1,padding:15,borderRadius:14,border:"1.5px solid #E3E8F0",background:"#fff",color:"#8890B0",fontSize:15,fontWeight:800,cursor:"pointer"}}>건너뛰기</button>}
          <button onClick={()=>last?onFinish():setI(i+1)} style={{flex:2,padding:15,borderRadius:14,border:"none",background:TH.grad,color:"#fff",fontSize:16,fontWeight:900,cursor:"pointer",boxShadow:`0 6px 18px ${TH.main}40`}}>
            {last?"시작하기 🎉":"다음"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* '수학' + 로/으로 → '수학으로', '피아노' → '피아노로'.
   받침이 없거나 ㄹ 받침이면 '로', 그 밖에는 '으로' (사용자 지적: "비우면 수학로" 가 어색했다) */
function withRo(word){
  const w=String(word||"").trim();
  if(!w) return "";
  const c=w.charCodeAt(w.length-1)-0xAC00;
  if(c<0||c>11171) return `${w}로`;          // 한글이 아니면 그냥 '로'
  const jong=c%28;                            // 0 = 받침 없음, 8 = ㄹ
  return `${w}${jong===0||jong===8?"로":"으로"}`;
}

export function OnboardingFlow({ onFinish }){
  const TH={ main:"#3B7ECD", grad:"linear-gradient(135deg,#3B7ECD,#80A9DA)", faint:"#EEF4FB" };
  const DAYS=["월","화","수","목","금","토","일"];
  const [step,setStep]=useState(0);
  const [celebrating,setCelebrating]=useState(false);   // 마지막 '준비 완료' 잠깐 보여 주기
  const [childName,setChildName]=useState("");
  const [gender,setGender]=useState("boy");
  const [age,setAge]=useState("");  // kid | elem | teen
  const [acKind,setAcKind]=useState("");            // 학원 종류 (필수)
  const [acKindLabel,setAcKindLabel]=useState("");
  const [kindOpen,setKindOpen]=useState(false);
  const [acName,setAcName]=useState("");            // 학원 이름 (선택)
  const [acDays,setAcDays]=useState([]);
  const [acTime,setAcTime]=useState("16:00");
  const [acDuration,setAcDuration]=useState("40");
  const [supply,setSupply]=useState("");          // 항상 챙길 준비물 (선택)
  const [baseHw,setBaseHw]=useState("");          // 반복 숙제 (선택)
  const [mission,setMission]=useState("");        // 오늘 미션 하나 (선택)
  const [missionKind,setMissionKind]=useState("hw");   // hw | todo

  const inp={width:"100%",padding:"15px 16px",borderRadius:14,border:"1.5px solid #E3E8F0",fontSize:17,boxSizing:"border-box",outline:"none",fontWeight:600};
  const lbl={fontSize:22,fontWeight:900,color:"#1A1A35",margin:"0 0 6px",lineHeight:1.3};
  /* whiteSpace:pre-line — 안내 문장에 \n 을 넣어 문장 단위로 줄을 나눈다 (사용자 확정 2026-08-11) */
  const sub={fontSize:14,color:"#8890B0",margin:"0 0 24px",fontWeight:600,lineHeight:1.5,whiteSpace:"pre-line"};
  /* '(선택)'과 '필수' 가 괄호 유무·굵기까지 달라 서로 다른 것처럼 보였다 →
     모양은 하나로 두고 색만 다르게 (사용자 확정 2026-08-11) */
  const tagBase={fontSize:11.5,fontWeight:800,borderRadius:8,padding:"2px 8px",marginLeft:6,verticalAlign:"middle"};
  const tagOpt={...tagBase,color:"#8890B0",background:"#EEF1F6"};
  const tagReq={...tagBase,color:"#E5484D",background:"#FDECEC"};

  const toggleDay=(d)=>setAcDays(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d]);

  /* [사용자 확정 2026-08-11] 앱이 커지면서 첫 등록이 지금 화면과 어긋나 있었다.
     · '오늘의 숙제'와 '오늘의 미션(할 일)'을 따로 물으면서 둘 다 필수라 건너뛸 수 없었다
       → 미션 화면과 같은 방식(종류 고르기 + 내용 하나)으로 합치고 선택으로 바꾼다.
     · 학원 카드가 '수업 40분 · 준비물 · 반복 숙제'까지 보여 주는데 첫 등록에는 없었다
       → 수업 시간(분)과 준비물·반복 숙제를 넣는다. 둘 다 선택이다.
     · 마지막에 '이제 어디서 무엇을 하면 되는지' 한 장을 둔다. */
  const steps=[
    { kind:"welcome" },
    { kind:"input", title:"아이의 이름이 무엇인가요?", sub:"아이 화면과 미션에 표시돼요.", canNext:()=>childName.trim().length>0 },
    { kind:"age", title:"아이의 연령대를 골라주세요", sub:"연령대에 맞는 보상 목록을 자동으로 준비해드려요. 나중에 바꿀 수 있어요.", canNext:()=>age!=="" },
    /* [사용자 지적 2026-08-11] 앱의 학원 등록은 '종류'가 필수고 '이름'이 선택이다.
       첫 등록만 이름을 필수로 받고 있어 규칙이 어긋났다 → 같은 순서·같은 규칙으로 맞춘다.
       이름을 비우면 종류 이름을 그대로 학원 이름으로 쓴다(앱의 saveAcademy 와 같은 규칙). */
    { kind:"academy", title:"어떤 학원에 다니나요?", sub:"우선 하나만 등록해요. 나중에 더 추가할 수 있어요.", canNext:()=>!!acKind },
    { kind:"routine", title:"갈 때마다 챙기는 준비물이 있나요?", sub:"한 번 넣어 두면 그 학원 가는 날마다 보여요.\n비워 둬도 괜찮아요." },
    /* [사용자 확정 2026-08-11] 반복 숙제를 준비물과 떼어 미션 단계로 옮겼다 — 둘 다 '숙제'라
       미션 이야기를 할 때 같이 보는 게 자연스럽다.
       [2026-08-11] 필수는 '오늘 미션' 하나로 정했다(사용자 확정) — 아무 미션도 없이 시작하면
       첫 화면이 텅 비어 무엇을 할지 모른다. 반복 숙제는 없는 학원도 많아 선택으로 둔다. */
    { kind:"mission", title:"오늘 할 미션을 정해볼까요?", sub:"오늘 미션 하나만 넣으면 시작할 수 있어요.",
      canNext:()=>mission.trim().length>0 },
  ];
  const cur=steps[step];
  const isLast=step===steps.length-1;

  /* [사용자 확정 2026-08-11] 마지막에 다섯 칸을 한 장에 몰아 설명하던 화면을 뺐다 —
     바로 뒤에 칸을 하나씩 짚어 주는 안내가 이어져서 같은 말을 두 번 했다.
     대신 '준비 완료'만 잠깐 띄우고 넘어간다. */
  const next=()=>{
    if(isLast){ setCelebrating(true); setTimeout(finish,1500); }
    else setStep(s=>s+1);
  };
  const prev=()=>setStep(s=>Math.max(0,s-1));
  const finish=()=>onFinish({ childName, gender, age, acKind, acKindLabel, acName, acDays, acTime,
    acDuration:Number(acDuration)||40, supply, baseHw, mission, missionKind });

  if(celebrating) return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"#fff",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:24,wordBreak:"keep-all",animation:"navMenuFade .2s ease both"}}>
      <div style={{fontSize:58,marginBottom:14}}>🎉</div>
      <h2 style={{fontSize:23,fontWeight:900,color:"#1A1A35",margin:0,textAlign:"center",lineHeight:1.35}}>
        {childName.trim()||"우리 아이"}의 미션팡 준비 완료!
      </h2>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,background:"#fff",display:"flex",flexDirection:"column",wordBreak:"keep-all"}}>
      {cur.kind!=="welcome"&&(
        <div style={{padding:"16px 22px 0"}}>
          <div style={{height:5,borderRadius:99,background:"#EEF1F6",overflow:"hidden"}}>
            <div style={{width:`${(step/(steps.length-1))*100}%`,height:"100%",background:TH.grad,borderRadius:99,transition:"width .3s"}}/>
          </div>
        </div>
      )}

      <div style={{flex:1,overflowY:"auto",padding:"32px 24px",display:"flex",flexDirection:"column"}}>
        {cur.kind==="welcome"&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",textAlign:"center"}}>
            <div style={{fontSize:64,marginBottom:18}}>🌱</div>
            <p style={{fontSize:12,fontWeight:800,letterSpacing:3,color:TH.main,margin:"0 0 8px"}}>오늘의 미션</p>
            <h2 style={{fontSize:25,fontWeight:900,color:"#1A1A35",margin:"0 0 32px",lineHeight:1.3}}>미션팡에<br/>오신 걸 환영해요</h2>
            <p style={{fontSize:15,fontWeight:600,color:"#8890B0",lineHeight:1.8,margin:0}}>
              동기부여가 고민이었던 엄마도,<br/>
              숙제가 재미없던 아이도,<br/>
              미션팡과 함께해요.<br/><br/>
              미션(숙제)을 완료하면 코인을 얻고,<br/>
              원하는 보상으로 바꾸며 즐겁게 성장해봐요.<br/><br/>
              작은 미션이 쌓여 아이의 큰 성장을 만들어요.
            </p>
          </div>
        )}

        {cur.kind==="input"&&(
          <div>
            <p style={lbl}>{cur.title}</p>
            <p style={sub}>{cur.sub}</p>
            <input autoFocus value={childName} onChange={e=>setChildName(e.target.value)} placeholder="예: 연우" style={inp}
              onKeyDown={e=>e.key==="Enter"&&cur.canNext()&&next()}/>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              {[{k:"boy",t:"👦 남자아이"},{k:"girl",t:"👧 여자아이"}].map(g=>(
                <button key={g.k} onClick={()=>setGender(g.k)} style={{flex:1,padding:14,borderRadius:14,border:`2px solid ${gender===g.k?TH.main:"#E3E8F0"}`,background:gender===g.k?`${TH.main}12`:"#fff",color:gender===g.k?TH.main:"#8890B0",fontSize:15,fontWeight:800,cursor:"pointer"}}>{g.t}</button>
              ))}
            </div>
          </div>
        )}

        {cur.kind==="age"&&(
          <div>
            <p style={lbl}>{cur.title}</p>
            <p style={sub}>{cur.sub}</p>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[
                {k:"kid",      emoji:"🧸", t:"어린이용",     d:"사탕, 놀이터, 키즈카페 등"},
                {k:"elemLow",  emoji:"🎒", t:"초등 저학년",  d:"간식, 놀이, 소액 용돈 등"},
                {k:"elemHigh", emoji:"🎽", t:"초등 고학년",  d:"용돈, 게임, 굿즈 등"},
                {k:"teen",     emoji:"💸", t:"고학년 이상",  d:"현금만 (1천~10만원)"},
              ].map(a=>(
                <button key={a.k} onClick={()=>setAge(a.k)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderRadius:16,border:`2px solid ${age===a.k?TH.main:"#E3E8F0"}`,background:age===a.k?`${TH.main}12`:"#fff",cursor:"pointer",textAlign:"left",width:"100%"}}>
                  <span style={{fontSize:30,flexShrink:0}}>{a.emoji}</span>
                  <span style={{flex:1,minWidth:0}}>
                    <span style={{display:"block",fontSize:17,fontWeight:900,color:age===a.k?TH.main:"#1A1A35"}}>{a.t}</span>
                    <span style={{display:"block",fontSize:13,fontWeight:600,color:"#8890B0",marginTop:2}}>{a.d}</span>
                  </span>
                  {age===a.k&&<span style={{flexShrink:0,fontSize:18,color:TH.main,fontWeight:900}}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {cur.kind==="academy"&&(
          <div>
            <p style={lbl}>{cur.title}</p>
            <p style={sub}>{cur.sub}</p>
            {/* '*' 하나로만 필수를 표시하던 자리 — 미션 단계의 '필수' 배지와 같은 모양으로 (사용자 확정) */}
            <p style={{fontSize:14,fontWeight:800,color:"#1A1A35",margin:"0 0 10px"}}>학원 종류 <span style={tagReq}>필수</span></p>
            {(()=>{
              const k=getAcademyKind(acKind);
              const lab=acKindLabel||k?.label||"";
              const ic=acKind===ACADEMY_KIND_CUSTOM?"✏️":(k?.icon||"🏫");
              return (
                <button onClick={()=>setKindOpen(true)}
                  style={{...inp,display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left",
                    border:`2px solid ${lab?TH.main:"#E3E8F0"}`,background:lab?`${TH.main}0E`:"#fff"}}>
                  <span style={{fontSize:21,flexShrink:0}}>{ic}</span>
                  <span style={{flex:1,minWidth:0,fontWeight:lab?900:600,color:lab?"#1A1A35":"#8890B0",
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {lab||"눌러서 골라 주세요"}
                  </span>
                  <span style={{flexShrink:0,color:"#8890B0",fontSize:15}}>›</span>
                </button>
              );
            })()}
            <p style={{fontSize:14,fontWeight:800,color:"#1A1A35",margin:"22px 0 10px"}}>
              학원 이름 <span style={tagOpt}>선택</span>
            </p>
            <input value={acName} onChange={e=>setAcName(e.target.value)}
              placeholder={acKindLabel?`비우면 '${acKindLabel}'${withRo(acKindLabel).slice(acKindLabel.length)} 저장돼요`:"예: 노아피아노"} style={inp}/>
            <p style={{fontSize:14,fontWeight:800,color:"#1A1A35",margin:"22px 0 10px"}}>수업 요일</p>
            {/* 일곱 칸이 한 줄에 들어가게 폭을 나눠 갖는다 — 고정 폭이면 좁은 기기에서 두 줄로 접혔다 */}
            <div style={{display:"flex",gap:5}}>
              {DAYS.map(d=>(
                <button key={d} onClick={()=>toggleDay(d)} style={{flex:1,minWidth:0,height:42,borderRadius:12,border:`2px solid ${acDays.includes(d)?TH.main:"#E3E8F0"}`,background:acDays.includes(d)?TH.main:"#fff",color:acDays.includes(d)?"#fff":"#8890B0",fontSize:15,fontWeight:800,cursor:"pointer",padding:0}}>{d}</button>
              ))}
            </div>
            <div style={{display:"flex",gap:10,marginTop:22}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:14,fontWeight:800,color:"#1A1A35",margin:"0 0 10px"}}>시작 시간</p>
                <input type="time" value={acTime} onChange={e=>setAcTime(e.target.value)} style={{...inp,minWidth:0}}/>
              </div>
              <div style={{width:112,flexShrink:0}}>
                <p style={{fontSize:14,fontWeight:800,color:"#1A1A35",margin:"0 0 10px"}}>수업 시간</p>
                <div style={{position:"relative"}}>
                  <input type="number" inputMode="numeric" min="10" value={acDuration}
                    onChange={e=>setAcDuration(e.target.value.replace(/[^0-9]/g,""))} aria-label="수업 시간(분)"
                    style={{...inp,minWidth:0,paddingRight:34,textAlign:"right"}}/>
                  <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:15,fontWeight:700,color:"#8890B0",pointerEvents:"none"}}>분</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {cur.kind==="routine"&&(
          <div>
            <p style={lbl}>{cur.title}</p>
            <p style={sub}>{cur.sub}</p>
            <p style={{fontSize:14,fontWeight:800,color:"#1A1A35",margin:"0 0 8px"}}>항상 챙길 준비물</p>
            <input autoFocus value={supply} onChange={e=>setSupply(e.target.value)} placeholder="예: 교재, 악보" style={inp}
              onKeyDown={e=>e.key==="Enter"&&next()}/>
            <p style={{fontSize:12.5,fontWeight:600,color:"#8890B0",margin:"10px 2px 0",lineHeight:1.6}}>
              학원 카드와 홈 화면에 그날 챙길 것으로 나와요.
            </p>
          </div>
        )}

        {cur.kind==="mission"&&(
          <div>
            <p style={lbl}>{cur.title}</p>
            <p style={sub}>{cur.sub}</p>
            <p style={{fontSize:14,fontWeight:800,color:"#1A1A35",margin:"0 0 4px"}}>
              반복 숙제 <span style={tagOpt}>선택</span>
            </p>
            <p style={{fontSize:12.5,fontWeight:600,color:"#8890B0",margin:"0 0 8px"}}>학원에 갈 때마다 하는 숙제예요.</p>
            <input value={baseHw} onChange={e=>setBaseHw(e.target.value)} placeholder="예: 단어 5개 암기" style={inp}/>

            <p style={{fontSize:14,fontWeight:800,color:"#1A1A35",margin:"24px 0 4px"}}>
              오늘 미션 <span style={tagReq}>필수</span>
            </p>
            <p style={{fontSize:12.5,fontWeight:600,color:"#8890B0",margin:"0 0 8px"}}>오늘 하루만 하는 일이에요.</p>
            {/* 종류 고르기는 앱의 미션 편집 화면과 같은 모양으로 (사용자 확정) */}
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {/* 앱의 미션 편집 팝업은 '숙제' '할 일' 글자만 쓴다 — 여기만 이모지가 붙어 있었다 */}
              {[{k:"hw",t:"숙제"},{k:"todo",t:"할 일"}].map(o=>(
                <button key={o.k} onClick={()=>setMissionKind(o.k)} aria-pressed={missionKind===o.k}
                  style={{flex:1,padding:12,borderRadius:14,border:`2px solid ${missionKind===o.k?TH.main:"#E3E8F0"}`,
                    background:missionKind===o.k?`${TH.main}12`:"#fff",color:missionKind===o.k?TH.main:"#8890B0",
                    fontSize:14.5,fontWeight:800,cursor:"pointer"}}>{o.t}</button>
              ))}
            </div>
            <input autoFocus value={mission} onChange={e=>setMission(e.target.value)}
              placeholder={missionKind==="hw"?"예: 문제집 5쪽":"예: 책가방 스스로 챙기기"} style={inp}
              onKeyDown={e=>e.key==="Enter"&&cur.canNext()&&next()}/>
          </div>
        )}
      </div>

      <AcademyKindPicker open={kindOpen} value={acKind} customLabel={acKind===ACADEMY_KIND_CUSTOM?acKindLabel:""}
        accent={TH.main} onClose={()=>setKindOpen(false)}
        onPick={(k,label)=>{ setAcKind(k); setAcKindLabel(label); setKindOpen(false); }}/>

      <div style={{padding:"16px 24px 28px",display:"flex",gap:10}}>
        {step>0&&(
          <button onClick={prev} style={{flex:1,padding:16,borderRadius:14,border:"1.5px solid #E3E8F0",background:"#fff",color:"#8890B0",fontSize:16,fontWeight:800,cursor:"pointer"}}>← 뒤로</button>
        )}
        <button onClick={next} disabled={cur.canNext&&!cur.canNext()}
          style={{flex:2,padding:16,borderRadius:14,border:"none",background:(cur.canNext&&!cur.canNext())?"#C8D0DE":TH.grad,color:"#fff",fontSize:16,fontWeight:900,cursor:(cur.canNext&&!cur.canNext())?"default":"pointer",boxShadow:(cur.canNext&&!cur.canNext())?"none":`0 6px 18px ${TH.main}40`}}>
          {cur.kind==="welcome"?"시작하기":isLast?"미션팡 시작하기":"다음"}
        </button>
      </div>
    </div>
  );
}

/* [2026-08-16] 지금은 아무 데서도 안 쓴다 — 'reward'(보상 탭 안내)와 'welcome'(엄마 권한
   안내)을 차례로 뺐고(사용자 확정), 기본 'guide' 갈래는 원래 부르는 곳이 없었다.
   되돌릴 일에 대비해 남겨 둔다. 같은 파일의 ModeSelect·CoachmarkOverlay·OnboardingFlow 는
   그대로 쓰이고 있다. */
export function GuideModal({type="guide",th,onClose,skin="dungeon"}){
  /* [2026-08-16] type="reward"(보상 탭 안내)는 삭제됐다 — 남은 갈래는 welcome 과 기본뿐. */
  const isWelcome=type==="welcome";
  const isCute=skin==="cute";
  const xpW=isCute?"경험치":"XP";
  const coinW=isCute?"쿠키":"코인";

  const steps=isWelcome
    /* [2026-08-11] '보상탭에서 점수 수정' 은 옛 구조다 — 미션 관리가 '미션' 탭으로 나왔고
       미션·보상 두 칸이 같은 잠금을 쓴다. 지금 동작대로 다시 썼다. */
    /* 줄머리 아이콘도 코치마크와 같은 선 아이콘으로 (사용자 확정 2026-08-11) */
    ? [
        { ic:"unlock",  t:"미션은 아이도 넣을 수 있어요", d:"아이용 화면에서 숙제·할 일을 스스로 추가" },
        { ic:"lock",    t:`미션 삭제·${xpW} 점수 수정은 엄마만`, d:"미션·보상 탭은 비밀번호를 한 번 물어봐요" },
        { ic:"reward",  t:"보상은 엄마가 승인", d:"아이가 신청하면 보상 탭에서 확인하고 승인" },
      ]
    : [
        { ic:"teacher", t:"아이 등록", d:"" },
        { ic:"school",  t:"학원 등록", d:"준비물·반복 숙제까지 한 번에" },
        { ic:"mission", t:"미션 추가", d:"숙제·할 일을 그날 미션으로" },
        { ic:"check",   t:"아이가 직접 체크", d:"완수하면 스스로 체크!" },
        { ic:"star",    t:`${xpW}·${coinW} 획득`, d:"" },
        { ic:"reward",  t:"보상 받기", d:`${coinW}으로 원하는 보상을` },
      ];

  return (
    <div style={{
      position:"fixed",
      inset:0,
      background:"rgba(20,20,40,0.55)",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      zIndex:5000,
      padding:20
    }} onClick={onClose}>
      <div
        onClick={e=>e.stopPropagation()}
        style={{
          background:"#fff",
          borderRadius:24,
          padding:0,
          width:"100%",
          maxWidth:370,
          boxSizing:"border-box",
          overflow:"hidden",
          boxShadow:"0 20px 60px rgba(0,0,0,0.22)"
        }}
      >
        {/* 소개 헤더 (맨 위, 테마 그라데이션) */}
        <div style={{
          background:th.grad,
          padding:"26px 24px 22px",
          color:"#fff",
          textAlign:"center"
        }}>
          <p style={{fontSize:11,fontWeight:800,letterSpacing:3,margin:"0 0 6px",opacity:0.85}}>{isWelcome?"GUIDE":"미션팡"}</p>
          <h2 style={{fontSize:isWelcome?23:27,fontWeight:900,margin:0,letterSpacing:-0.5,textShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>{isWelcome?"여기는 엄마 권한이에요":"오늘의 미션"}</h2>
          <div style={{width:38,height:3,borderRadius:99,background:"rgba(255,255,255,0.6)",margin:"12px auto 14px"}}/>
          <p style={{fontSize:14.5,fontWeight:800,lineHeight:1.6,margin:0}}>
            {isWelcome?<>점수와 보상은 엄마가 관리,<br/>아이는 미션에만 집중!</>:<>매일의 작은 미션이 쌓여<br/>아이의 큰 성장을 만들어요</>}
          </p>
        </div>

        {/* 사용 방법 */}
        <div style={{padding:"22px 24px 24px"}}>
          <p style={{fontSize:13,fontWeight:900,letterSpacing:0.5,color:th.main,margin:"0 0 14px"}}>
            {isWelcome?"이렇게 설계됐어요":"이렇게 시작해요"}
          </p>

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {steps.map((s,i)=>(
              <div key={s.t} style={{display:"flex",alignItems:"center",gap:12,background:`${th.main}0E`,borderRadius:13,padding:"11px 13px"}}>
                <span style={{
                  flexShrink:0,
                  width:34,height:34,
                  borderRadius:10,
                  background:`${th.main}18`,
                  color:th.main,
                  display:"flex",alignItems:"center",justifyContent:"center"
                }}><CareIcon name={s.ic} size={18}/></span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:14.5,fontWeight:900,color:C.text,margin:0,lineHeight:1.2}}>
                    <span style={{color:th.main,marginRight:5}}>{i+1}</span>{s.t}
                  </p>
                  {s.d&&<p style={{fontSize:12,fontWeight:600,color:C.sub,margin:"3px 0 0",lineHeight:1.5}}>{s.d}</p>}
                </div>
              </div>
            ))}
          </div>

          {!isWelcome&&(
          <div style={{
            background:`${th.main}0E`,
            borderRadius:12,
            padding:"11px 13px",
            margin:"16px 0 0",
            fontSize:12,fontWeight:700,color:C.sub,lineHeight:1.55
          }}>
            미션을 완료하면 {xpW}와 {coinW}을 받고, {coinW}으로 원하는 보상을 받을 수 있어요!
          </div>
          )}

          <button
            onClick={onClose}
            style={{
              width:"100%",
              padding:15,
              borderRadius:14,
              border:"none",
              background:th.grad,
              color:"#fff",
              fontSize:16,
              fontWeight:900,
              cursor:"pointer",
              marginTop:18,
              boxShadow:`0 6px 18px ${th.main}40`
            }}
          >
            {isWelcome?"알겠어요":"닫기"}
          </button>
        </div>
      </div>
    </div>
  );
}
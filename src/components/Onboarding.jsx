import { useState } from "react";
import { DAYS, C } from "../data/tokens.js";

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
          {/* 모험 게임 */}
          <div style={card("linear-gradient(155deg,#3A3470,#2E2F5C)","0 10px 24px rgba(58,52,112,0.32)")} onClick={()=>onPick("dungeon")}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:1,color:"#FFD166",marginBottom:6}}>1번</div>
            <div style={{fontSize:40,lineHeight:1,marginBottom:8}}>🧭</div>
            <div style={{fontSize:18,fontWeight:900,color:"#fff",letterSpacing:"-0.5px"}}>모험<br/>게임</div>
            <div style={{fontSize:12.5,fontWeight:600,color:"#C5C8E8",marginTop:9,lineHeight:1.5,flex:1}}>탐험가가 되어<br/>모험을 떠나요</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:14}}>
              <span style={chip("rgba(255,209,102,0.18)","#FFD166")}>🧭 미션</span>
              <span style={chip("rgba(255,209,102,0.18)","#FFD166")}>🗺️ 모험 떠나기</span>
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
  const items=[
    { icon:"🏠", name:"홈", desc:"등록한 학원과 오늘의 미션을 한눈에 봐요. 학원·미션을 추가하는 곳이에요." },
    { icon:"🎁", name:"보상", desc:"미션을 관리하고 아이가 모은 코인으로 받을 보상을 설정해요." },
    { icon:"🗓", name:"달력", desc:"날짜별 학원 일정과 미션을 달력으로 확인해요." },
    { icon:"💰", name:"학원비", desc:"학원별 수강료와 납부 현황을 관리해요." },
    { icon:"🏥", name:"결석", desc:"결석을 기록하고 보충 일정을 챙겨요." },
    { icon:"⚙️", name:"기타", desc:"데이터 백업·복원, 비밀번호, 사용 가이드를 볼 수 있어요." },
    { icon:"🎒", name:"아이용", desc:"오른쪽 위 '🎒 아이용' 버튼을 누르면\n아이 화면으로 바뀌어요." },
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
          <div style={{width:48,height:48,borderRadius:14,background:`${TH.main}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{it.icon}</div>
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

export function OnboardingFlow({ onFinish }){
  const TH={ main:"#3B7ECD", grad:"linear-gradient(135deg,#3B7ECD,#80A9DA)", faint:"#EEF4FB" };
  const DAYS=["월","화","수","목","금","토","일"];
  const [step,setStep]=useState(0);
  const [childName,setChildName]=useState("");
  const [gender,setGender]=useState("boy");
  const [age,setAge]=useState("");  // kid | elem | teen
  const [acName,setAcName]=useState("");
  const [acDays,setAcDays]=useState([]);
  const [acTime,setAcTime]=useState("16:00");
  const [homework,setHomework]=useState("");
  const [todo,setTodo]=useState("");

  const inp={width:"100%",padding:"15px 16px",borderRadius:14,border:"1.5px solid #E3E8F0",fontSize:17,boxSizing:"border-box",outline:"none",fontWeight:600};
  const lbl={fontSize:22,fontWeight:900,color:"#1A1A35",margin:"0 0 6px",lineHeight:1.3};
  const sub={fontSize:14,color:"#8890B0",margin:"0 0 24px",fontWeight:600,lineHeight:1.5};

  const toggleDay=(d)=>setAcDays(p=>p.includes(d)?p.filter(x=>x!==d):[...p,d]);

  const steps=[
    { kind:"welcome" },
    { kind:"input", title:"아이의 이름이 무엇인가요?", sub:"아이 화면과 미션에 표시돼요.", canNext:()=>childName.trim().length>0 },
    { kind:"age", title:"아이의 연령대를 골라주세요", sub:"연령대에 맞는 보상 목록을 자동으로 준비해드려요. 나중에 바꿀 수 있어요.", canNext:()=>age!=="" },
    { kind:"academy", title:"어떤 학원에 다니나요?", sub:"우선 하나만 등록해요. 나중에 더 추가할 수 있어요.", canNext:()=>acName.trim().length>0 },
    { kind:"homework", title:"오늘의 숙제가 있나요?", sub:"하나만 적어볼게요. 나중에 자유롭게 바꿀 수 있어요.", canNext:()=>homework.trim().length>0 },
    { kind:"todo", title:"오늘의 미션(할 일)이 있나요?", sub:"숙제 외에 스스로 할 일을 하나 적어주세요.", canNext:()=>todo.trim().length>0 },
  ];
  const cur=steps[step];
  const isLast=step===steps.length-1;

  const next=()=>{ if(isLast){ finish(); } else setStep(s=>s+1); };
  const prev=()=>setStep(s=>Math.max(0,s-1));
  const finish=()=>onFinish({ childName, gender, age, acName, acDays, acTime, homework, todo });

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
            <input autoFocus value={acName} onChange={e=>setAcName(e.target.value)} placeholder="예: 피아노 학원" style={inp}/>
            <p style={{fontSize:14,fontWeight:800,color:"#1A1A35",margin:"22px 0 10px"}}>수업 요일</p>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {DAYS.map(d=>(
                <button key={d} onClick={()=>toggleDay(d)} style={{width:42,height:42,borderRadius:12,border:`2px solid ${acDays.includes(d)?TH.main:"#E3E8F0"}`,background:acDays.includes(d)?TH.main:"#fff",color:acDays.includes(d)?"#fff":"#8890B0",fontSize:15,fontWeight:800,cursor:"pointer"}}>{d}</button>
              ))}
            </div>
            <p style={{fontSize:14,fontWeight:800,color:"#1A1A35",margin:"22px 0 10px"}}>수업 시간</p>
            <input type="time" value={acTime} onChange={e=>setAcTime(e.target.value)} style={inp}/>
          </div>
        )}

        {cur.kind==="homework"&&(
          <div>
            <p style={lbl}>{cur.title}</p>
            <p style={sub}>{cur.sub}</p>
            <input autoFocus value={homework} onChange={e=>setHomework(e.target.value)} placeholder="예: 문제집 5쪽" style={inp}
              onKeyDown={e=>e.key==="Enter"&&next()}/>
          </div>
        )}

        {cur.kind==="todo"&&(
          <div>
            <p style={lbl}>{cur.title}</p>
            <p style={sub}>{cur.sub}</p>
            <input autoFocus value={todo} onChange={e=>setTodo(e.target.value)} placeholder="예: 책가방 스스로 챙기기" style={inp}
              onKeyDown={e=>e.key==="Enter"&&next()}/>
          </div>
        )}
      </div>

      <div style={{padding:"16px 24px 28px",display:"flex",gap:10}}>
        {step>0&&(
          <button onClick={prev} style={{flex:1,padding:16,borderRadius:14,border:"1.5px solid #E3E8F0",background:"#fff",color:"#8890B0",fontSize:16,fontWeight:800,cursor:"pointer"}}>← 뒤로</button>
        )}
        <button onClick={next} disabled={cur.canNext&&!cur.canNext()}
          style={{flex:2,padding:16,borderRadius:14,border:"none",background:(cur.canNext&&!cur.canNext())?"#C8D0DE":TH.grad,color:"#fff",fontSize:16,fontWeight:900,cursor:(cur.canNext&&!cur.canNext())?"default":"pointer",boxShadow:(cur.canNext&&!cur.canNext())?"none":`0 6px 18px ${TH.main}40`}}>
          {cur.kind==="welcome"?"시작하기":isLast?"완료하고 시작하기 🎉":"다음"}
        </button>
      </div>
    </div>
  );
}

export function GuideModal({type="guide",th,onClose,skin="dungeon"}){
  const isReward=type==="reward";
  const isWelcome=type==="welcome";
  const isCute=skin==="cute";
  const xpW=isCute?"경험치":"XP";
  const coinW=isCute?"쿠키":"코인";

  const steps=isWelcome
    ? [
        { ic:"🔓", t:"아이가 직접 미션을 추가해요", d:"홈탭 또는 아이용에서 숙제·할 일을 등록" },
        { ic:"🔒", t:"점수·삭제는 엄마만", d:"보상탭에서 엄마권한으로 점수 수정·미션 삭제" },
        { ic:"🎁", t:"보상은 엄마가 승인", d:"아이가 신청하면 여기서 확인하고 승인" },
      ]
    : isReward
    ? [
        { ic:"🔓", t:"아이가 직접 미션을 추가해요", d:"홈탭 또는 아이용에서 숙제·할 일을 등록" },
        { ic:"🔒", t:"점수·삭제는 엄마만", d:"보상탭에서 엄마권한으로 점수 수정·미션 삭제" },
        { ic:"🎁", t:"보상은 엄마가 승인", d:"아이가 신청하면 여기서 확인하고 승인" },
      ]
    : [
        { ic:"🧒", t:"아이 등록", d:"" },
        { ic:"🏫", t:"학원 등록", d:"" },
        { ic:"📝", t:"미션 추가", d:"숙제·할 일을 미션으로" },
        { ic:"✅", t:"아이가 직접 체크", d:"완수하면 스스로 체크!" },
        { ic:"⭐", t:`${xpW}·${coinW} 획득`, d:"" },
        { ic:"🎁", t:"보상 받기", d:`${coinW}으로 원하는 보상을` },
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
          <p style={{fontSize:11,fontWeight:800,letterSpacing:3,margin:"0 0 6px",opacity:0.85}}>{isWelcome?"GUIDE":isReward?"REWARD":"미션팡"}</p>
          <h2 style={{fontSize:isReward||isWelcome?23:27,fontWeight:900,margin:0,letterSpacing:-0.5,textShadow:"0 2px 8px rgba(0,0,0,0.12)"}}>{isWelcome?"여기는 엄마 권한이에요 🔒":isReward?"보상탭은 엄마 공간이에요 🔒":"오늘의 미션"}</h2>
          <div style={{width:38,height:3,borderRadius:99,background:"rgba(255,255,255,0.6)",margin:"12px auto 14px"}}/>
          <p style={{fontSize:14.5,fontWeight:800,lineHeight:1.6,margin:0}}>
            {isWelcome?<>점수와 보상은 엄마가 관리,<br/>아이는 미션에만 집중! ✨</>:isReward?<>미션은 아이가 홈탭에서,<br/>점수·보상 관리는 엄마가 여기서 ✨</>:<>매일의 작은 미션이 쌓여<br/>아이의 큰 성장을 만들어요 ✨</>}
          </p>
        </div>

        {/* 사용 방법 */}
        <div style={{padding:"22px 24px 24px"}}>
          <p style={{fontSize:13,fontWeight:900,letterSpacing:0.5,color:th.main,margin:"0 0 14px"}}>
            {isWelcome?"💡 이렇게 설계됐어요":isReward?"🔑 엄마가 할 수 있는 것":"🚀 이렇게 시작해요"}
          </p>

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {steps.map((s,i)=>(
              <div key={s.t} style={{display:"flex",alignItems:"center",gap:12,background:`${th.main}0E`,borderRadius:13,padding:"11px 13px"}}>
                <span style={{
                  flexShrink:0,
                  width:34,height:34,
                  borderRadius:10,
                  background:`${th.main}18`,
                  fontSize:18,
                  display:"flex",alignItems:"center",justifyContent:"center"
                }}>{s.ic}</span>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:14.5,fontWeight:900,color:C.text,margin:0,lineHeight:1.2}}>
                    <span style={{color:th.main,marginRight:5}}>{i+1}</span>{s.t}
                  </p>
                  {s.d&&<p style={{fontSize:12,fontWeight:600,color:C.sub,margin:"3px 0 0",lineHeight:1.5}}>{s.d}</p>}
                </div>
              </div>
            ))}
          </div>

          {!isReward&&!isWelcome&&(
          <div style={{
            background:`${th.main}0E`,
            borderRadius:12,
            padding:"11px 13px",
            margin:"16px 0 0",
            fontSize:12,fontWeight:700,color:C.sub,lineHeight:1.55
          }}>
            {isCute?"🍪":"💎"} 미션을 완료하면 {xpW}와 {coinW}을 받고, {coinW}으로 원하는 보상을 받을 수 있어요!
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
            {isWelcome?"알겠어요 👍":isReward?"보상 탭으로 가기 🎁":"닫기"}
          </button>
        </div>
      </div>
    </div>
  );
}
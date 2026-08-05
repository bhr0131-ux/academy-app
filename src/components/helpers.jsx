import { useState } from "react";
import { C } from "../data/tokens.js";
import { UI_TEXT } from "../data/characters.js";

// ── 공통 UI 컴포넌트 ────────────────────────────
/* ════════════════════════════════════════════════════════════════════════
   SECTION 7. 순수 뷰 헬퍼 & 작은 프레젠테이션 컴포넌트
   ════════════════════════════════════════════════════════════════════════ */

/* sheet=true면 '제자리에서 펼치는' 아코디언이 아니라 '따로 뜨는 시트'를 여는 머리줄이다.
   [2026-08-03] 캐릭터 탭을 캠프 장면으로 바꾸면서 섹션을 하나씩 시트로 옮기는 중 —
   옮긴 것만 sheet를 켜면, 화살표(▼) 대신 '열기 ›'로 바뀌어 눌렀을 때 뭐가 일어날지 맞는다. */
export function CharacterSectionHeader({icon,title,subtitle,open,onToggle,dark=false,sheet=false}){
  const tx = dark ? "#FFFFFF" : C.text;
  const sub = dark ? "rgba(255,255,255,0.85)" : C.sub;  // 0.66 → 0.85: 청회색 카드 위 12px 부제 가독성
  return (
    <div onClick={onToggle} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
      <div>
        <p style={{margin:0,fontSize:18,fontWeight:900,color:tx}}>{icon} {title}</p>
        {subtitle&&<p style={{margin:"4px 0 0",fontSize:12,color:sub,fontWeight:700,whiteSpace:"pre-line",lineHeight:1.5}}>{subtitle}</p>}
      </div>
      <div style={{fontSize:12,fontWeight:900,color:dark?"#fff":C.purple,background:dark?"rgba(255,255,255,0.12)":C.purpleL,border:`1px solid ${dark?"rgba(255,255,255,0.2)":C.purple+"22"}`,padding:"6px 10px",borderRadius:999,whiteSpace:"nowrap",flexShrink:0}}>
        {sheet?"열기 ›":(open?UI_TEXT.button.close:UI_TEXT.button.open)}
      </div>
    </div>
  );
}

export function GameModalHeader({emoji,title,color,cute=false}){
  return (
    <div style={{padding:"26px 20px",textAlign:"center",color:cute?"#6B4A5C":"#fff",background:color,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg, transparent, rgba(255,255,255,${cute?0.4:0.55}), transparent)`,animation:"shineMove 1.6s ease-in-out infinite"}}/>
      <p style={{fontSize:56,margin:"0 0 10px",position:"relative"}}>{emoji}</p>
      <p style={{margin:0,fontSize:cute?22:24,fontWeight:900,letterSpacing:cute?0:undefined,position:"relative"}}>{title}</p>
    </div>
  );
}

export function GameModalButton({onClick,grad,label="확인",cute=false}){
  return (
    <button onClick={onClick}
      style={{width:"100%",border:"none",borderRadius:cute?16:14,padding:"14px",background:grad,color:"#fff",fontWeight:900,fontSize:16,cursor:"pointer",boxShadow:cute?"0 6px 18px rgba(0,0,0,.12)":"none"}}>
      {label}
    </button>
  );
}

export function KidCoachmark({ th, onFinish, skin="dungeon" }){
  const TH=th||{ main:"#3B7ECD", grad:"linear-gradient(135deg,#3B7ECD,#80A9DA)" };
  const cute=skin==="cute";
  const cards = cute
    ? [
        { emoji:"📝", title:"오늘의 미션을 체크해요", desc:"오늘 할 일 탭에서 미션과 숙제를\n동그라미를 눌러 완료해요!" },
        { emoji:"🍪", title:"쿠키와 경험치가 쌓여요", desc:"미션을 해내면 쿠키와 경험치(⭐)를 받아요.\n모은 쿠키로 멋진 보상을 받을 수 있어요!" },
        { emoji:"🧑‍🍳🦄", title:"파티시에와 펫이 자라요", desc:"내 캐릭터 탭에서 레벨이 오르고\n펫도 점점 자라나는 걸 볼 수 있어요!" },
      ]
    : [
        { emoji:"📝", title:"오늘의 미션을 체크해요", desc:"미션 탭에서 오늘 할 일과 숙제를\n동그라미를 눌러 완료해요!" },
        { emoji:"💎", title:"코인과 XP가 쌓여요", desc:"미션을 해내면 코인과 XP(별)을 받아요.\n모은 코인으로 멋진 보상을 받을 수 있어요!" },
        { emoji:"🧙‍♀️🐲", title:"캐릭터와 펫이 자라요", desc:"내 캐릭터 탭에서 레벨이 오르고\n펫도 점점 자라나는 걸 볼 수 있어요!" },
      ];
  const [i,setI]=useState(0);
  const last=i===cards.length-1;
  const c=cards[i];
  return (
    <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(15,16,30,0.8)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"28px",wordBreak:"keep-all"}}>
      <div style={{background:"#fff",borderRadius:26,padding:"32px 24px 24px",width:"100%",maxWidth:340,minHeight:380,boxSizing:"border-box",textAlign:"center",boxShadow:"0 24px 70px rgba(0,0,0,0.32)",display:"flex",flexDirection:"column"}}>
        <div style={{height:74,display:"flex",alignItems:"center",justifyContent:"center",fontSize:c.emoji.length>3?46:64,letterSpacing:4,marginBottom:14}}>{c.emoji}</div>
        <div style={{height:34,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <p style={{fontSize:21,fontWeight:900,color:"#1A1A35",margin:0,lineHeight:1.3}}>{c.title}</p>
        </div>
        <div style={{height:60,display:"flex",alignItems:"center",justifyContent:"center",margin:"10px 0 0"}}>
          <p style={{fontSize:15,fontWeight:600,color:"#5A6072",lineHeight:1.7,margin:0,whiteSpace:"pre-line"}}>{c.desc}</p>
        </div>
        <div style={{display:"flex",gap:6,justifyContent:"center",margin:"auto 0 20px"}}>
          {cards.map((_,idx)=>(<span key={idx} style={{width:idx===i?22:8,height:8,borderRadius:99,background:idx===i?TH.main:"#D9DEE8",transition:"all .25s"}}/>))}
        </div>
        <button onClick={()=>last?onFinish():setI(i+1)} style={{width:"100%",padding:16,borderRadius:15,border:"none",background:TH.grad,color:"#fff",fontSize:17,fontWeight:900,cursor:"pointer",boxShadow:`0 6px 18px ${TH.main}45`}}>
          {last?"시작하기 🎉":"다음"}
        </button>
      </div>
    </div>
  );
}

// ── 아이모드 모드(스킨) 선택 화면 ──────────────────────────
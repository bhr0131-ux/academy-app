/* ════════════════════════════════════════════════════════════════════════
   HomeSheet — 아이 홈(탐험) 하단 시트: 날짜바 + 3타일(탐험/미션/캐릭터)
   ────────────────────────────────────────────────────────────────────────
   App.jsx 홈 화면에서 분리(CLAUDE.md 3번: 수정 시 점진 분리).
   표시 전용 컴포넌트 — 데이터 계산은 App이 하고 props로 받는다.
   레벨·아이 이름 줄과 경험치바는 사용자 확정으로 제거(레벨 정보는 캐릭터 탭 HERO STATUS 카드에서 표시)
   → 그 자리에 날짜바(dateNav)를 배치. 날짜바는 App이 탭별 톤으로 만들어 node로 내려준다.

   ── 시트 동작 (사용자 요청: 코웨이 앱처럼) ─────────────────────────────
   1) 손잡이(짧은 가로바)를 위로 끌거나 탭하면 시트가 화면 맨 위까지 올라온다.
      아래로 끌거나 다시 탭하면 무대(캐릭터 화면)가 보이는 처음 자리로 돌아간다.
   2) 시트가 맨 위에 닿으면 그대로 '고정'돼, 아래 내용을 아무리 스크롤해도 탭이 계속 보인다.

   구현은 position:sticky 하나로 끝낸다. 진짜 바텀시트(fixed + 내부 스크롤)로 만들면
   페이지 전체의 스크롤 모델을 갈아엎어야 하는데, 문서 스크롤 + sticky만으로도
   위 두 동작이 사용자 눈에는 똑같이 보인다 (손잡이 = '그 위치까지 스크롤' 버튼).

   ※ 고정되는 건 '탭 줄'만이다. 손잡이·날짜바까지 같이 고정하면 머리가 화면의 25%를
      차지해 버려서(실측 197px/800px), 탭 줄만 남기고 위쪽은 같이 스크롤되게 했다.
   ※ 그래서 두 조각(윗부분/탭줄)을 형제로 내보낸다. 한 div로 감싸면 sticky가
      그 부모 높이 안에서만 붙을 수 있어(=시트 높이만큼) 사실상 동작하지 않는다.
   ※ sticky가 먹으려면 조상에 overflow:hidden이 없어야 한다 → App 루트를 overflow-x:clip으로 두었다.
      (clip은 hidden과 달리 스크롤 컨테이너를 만들지 않아 sticky가 살아 있다)
   ※ 붙을 때 크기를 바꾸지 않는다 — 높이가 변하면 그만큼 아래 내용이 튀어 스크롤이 흔들린다.

   팔레트: 사용자 확정 수채화 톤 (Cloud 시트 / 타일은 크림·연갈색 — 숲 컨셉 통일)
   폰트: 앱 전역 글씨체(카페24 써라운드) — index.html에서 지정

   props
     dateNav   : node                        날짜 이동 바 (App 제작, 탭별 색)
     tiles     : [{k,title,sub,icon}]        타일 데이터 (k=탭 키)
     activeTab : string                      현재 선택 탭 키
     onSelect  : (k)=>void                   타일 탭 선택
   ════════════════════════════════════════════════════════════════════════ */

import { Fragment, useEffect, useRef, useState } from "react";

// 탭별 선택 색 — 아래 탭 콘텐츠의 메인 카드와 같은 계열, 선택 탭은 메인 카드보다 채도 10~15% 높게 (클릭감)
// (탐험=올리브 그린·미션=허니 브라운·캐릭터=스카이 블루 / 명도 규칙: 선택 탭 中 > 메인 카드 連)
const TILE_ACCENT = {
  area:   { bg:"#D2AD79", border:"#AF8850", text:"#6C5238" },  // 탐험 (브라운 — 사용자 확정: 미션과 톤 맞교환)
  today:  { bg:"#ACC06D", border:"#8CA24F", text:"#48663D" },  // 미션 (그린)
  growth: { bg:"#AED2EC", border:"#83B4D4", text:"#355D76" },  // 캐릭터
};

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

export default function HomeSheet({ dateNav, tiles = [], activeTab, onSelect }) {
  const sheetRef = useRef(null);
  const dragY = useRef(null);
  // stuck = 시트가 화면 맨 위에 붙은 상태 / anchorY = 붙기 직전의 문서상 위치(손잡이가 데려갈 목적지)
  const [stuck, setStuck] = useState(false);
  const anchorY = useRef(0);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const onScroll = () => {
      const top = el.getBoundingClientRect().top;
      setStuck(top <= 0.5);
      // 떨어져 있을 때만 기준선을 갱신 — 붙어 있을 땐 top이 늘 0이라, 다시 재면 값이 망가진다
      if (top > 0.5) anchorY.current = window.scrollY + top;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const go = (y) => window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
  const expand = () => go(anchorY.current);   // 시트를 화면 맨 위로
  const collapse = () => go(0);               // 무대가 보이는 처음 자리로

  return (
    <Fragment>
      {/* ── 시트 윗부분 (손잡이 + 날짜바) — 같이 스크롤돼 올라간다 ── */}
      <div style={{position:"relative",zIndex:3,margin:0,marginTop:-24,padding:"18px 18px 0",
        borderRadius:"30px 30px 0 0",background:"#F0F3F3", // Cloud — 순백 대신 수채화와 이어지는 아이보리·회색
        boxShadow:"0 -10px 30px -12px rgba(40,70,45,0.30)"}}>
        {/* 시트 손잡이 — 위로 끌거나 탭하면 탭 줄이 맨 위로, 아래로 끌거나 다시 탭하면 제자리로 (사용자 요청) */}
        <button type="button" onClick={()=>(stuck?collapse():expand())}
          aria-label={stuck?"시트 내리기":"시트 올리기"}
          onTouchStart={(e)=>{ dragY.current=e.touches[0].clientY; }}
          onTouchEnd={(e)=>{
            const y0=dragY.current; dragY.current=null;
            if(y0==null) return;
            const dy=e.changedTouches[0].clientY-y0;
            // 18px 넘게 끈 건 방향대로, 그보다 짧으면 탭으로 보고 onClick에 맡긴다
            if(dy<-18) expand(); else if(dy>18) collapse();
          }}
          style={{display:"block",width:"100%",background:"none",border:"none",padding:"0 0 7px",margin:"-4px 0 0",
            cursor:"pointer",touchAction:"none",WebkitTapHighlightColor:"transparent"}}>
          <span style={{display:"block",width:44,height:5,borderRadius:999,background:"#D9DED7",margin:"0 auto"}}/>
        </button>
        {/* 날짜바 — 레벨·이름 줄 자리 (탭별 톤은 App의 dateNav가 담당) */}
        {dateNav}
      </div>
      {/* ── 탭 줄 — 화면 맨 위에 닿으면 여기서 고정된다 (아래 내용만 지나간다) ── */}
      <div ref={sheetRef} style={{position:"sticky",top:0,zIndex:8,padding:"6px 18px 22px",background:"#F0F3F3",
        // 붙으면 아래로 그림자를 깔아 '지나가는 내용'과 층을 나눈다
        boxShadow:stuck?"0 6px 16px -6px rgba(40,70,45,0.30)":"none",
        transition:"box-shadow .18s ease"}}>
        {/* 3 타일 (탐험/미션/캐릭터) = 탭 선택 — 아이콘 위·세로 중앙 정렬 */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {tiles.map(t=>{
            const on=activeTab===t.k;
            const ac=TILE_ACCENT[t.k]||TILE_ACCENT.area;
            return (
              <button key={t.k} onClick={()=>onSelect&&onSelect(t.k)} className="jelly-tap" style={{
                display:"flex",flexDirection:"column",alignItems:"center",gap:5,textAlign:"center",cursor:"pointer",
                padding:"14px 8px 12px",borderRadius:22,minWidth:0,
                border:on?`2px solid ${ac.border}`:"1.5px solid #D8C9A8",
                background:on?ac.bg:"#F8F2E6",
                boxShadow:"0 3px 11px rgba(155,114,74,0.10)"}}>
                <span style={{fontSize:30,lineHeight:1}}>{t.icon}</span>
                <b style={{display:"block",fontFamily:F,fontSize:15.5,fontWeight:400,color:on?ac.text:"#4B3A2F",marginTop:3,lineHeight:1.1}}>{t.title}</b>
                <small style={{display:"block",fontFamily:F,fontSize:11.5,fontWeight:400,color:on?ac.text:"#7E8C7B",opacity:on?0.85:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%"}}>{t.sub}</small>
              </button>
            );
          })}
        </div>
      </div>
    </Fragment>
  );
}

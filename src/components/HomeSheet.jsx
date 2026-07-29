/* ════════════════════════════════════════════════════════════════════════
   HomeSheet — 아이 홈(탐험) 하단 시트: 날짜바 + 3타일(탐험/미션/캐릭터)
   ────────────────────────────────────────────────────────────────────────
   App.jsx 홈 화면에서 분리(CLAUDE.md 3번: 수정 시 점진 분리).
   표시 전용 컴포넌트 — 데이터 계산은 App이 하고 props로 받는다.
   레벨·아이 이름 줄과 경험치바는 사용자 확정으로 제거(레벨 정보는 캐릭터 탭 HERO STATUS 카드에서 표시)
   → 그 자리에 날짜바(dateNav)를 배치. 날짜바는 App이 탭별 톤으로 만들어 node로 내려준다.

   ── 시트 동작 (사용자 요청: 코웨이 앱처럼) ─────────────────────────────
   1) 손잡이(짧은 가로바)를 끌면 시트가 손가락을 따라 실시간으로 움직이고,
      손을 떼면 기세·위치를 보고 '맨 위' 또는 '처음 자리'로 붙는다. 탭만 해도 오간다.
   2) 시트가 맨 위에 닿으면 그대로 '고정'돼, 아래 내용을 아무리 스크롤해도 탭이 계속 보인다.

   구현은 문서 스크롤 + position:sticky다. 진짜 바텀시트(fixed + 내부 스크롤)로 만들면
   페이지 전체의 스크롤 모델을 갈아엎어야 하는데, 얻는 건 '손가락 따라오는 감촉' 하나뿐이고
   그건 아래 드래그 처리(손가락 위치만큼 window.scrollTo)로 이미 낸다.
   반면 내부 스크롤로 바꾸면 브라우저 주소창이 안 접히고 iOS 관성이 어색해지는 등
   잃는 게 더 많아 이 구조를 택했다 (사용자와 함께 검토·확정).

   순서는 손잡이 → 탭 줄 → 날짜바 (사용자 확정: 날짜바를 탭 아래로).
   고정되는 건 '손잡이'와 '탭 줄'까지고, 그 아래 날짜바는 같이 스크롤돼 탭 뒤로 숨는다
   (날짜바는 안 보여도 되지만 손잡이는 남아 있어야 한다 — 다시 내려야 하니까).
   손잡이와 탭 줄은 각각 sticky로 만들고, 탭 줄의 top을 손잡이 높이만큼 내려 위아래로 붙인다.

   첫 화면은 '탭 줄 아래'에서 딱 끝난다 — 무대 높이를 화면에서 시트 머리만큼 뺀 값으로
   잡아 두었다(index.html의 .amStageFill). 그래서 손잡이 한 번만 눌러도 탭이 화면 맨 위로 온다.

   ※ 세 조각을 형제로 내보낸다. 한 div로 감싸면 sticky가 그 부모 높이 안에서만
      붙을 수 있어(=시트 높이만큼) 사실상 동작하지 않는다.
   ※ sticky가 먹으려면 조상에 overflow:hidden이 없어야 한다 → App 루트를 overflow-x:clip으로 두었다.
      (clip은 hidden과 달리 스크롤 컨테이너를 만들지 않아 sticky가 살아 있다)
   ※ 붙을 때 크기를 바꾸지 않는다 — 높이가 변하면 그만큼 아래 내용이 튀어 스크롤이 흔들린다.
   ※ 탭 칸은 글자만 남겼다(사용자 확정) — 이모지·부제를 빼 고정되는 머리 높이를 줄인다.

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
  const gripRef = useRef(null);   // 손잡이 조각 (top:0에 붙는다)
  const drag = useRef(null);          // 드래그 중 상태 {시작Y, 시작스크롤, 움직임여부, 속도}
  const justDragged = useRef(false);  // 드래그로 끝났으면 뒤따라오는 click을 무시
  // stuck = 손잡이가 화면 맨 위에 붙은 상태 / anchorY = 붙기 직전의 문서상 위치(손잡이가 데려갈 목적지)
  const [stuck, setStuck] = useState(false);
  const [gripH, setGripH] = useState(30);   // 손잡이 조각 높이 = 탭 줄이 붙을 위치
  const anchorY = useRef(0);

  useEffect(() => {
    const el = gripRef.current;
    if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      setStuck(r.top <= 0.5);
      setGripH(Math.round(r.height));
      // 떨어져 있을 때만 기준선을 갱신 — 붙어 있을 땐 top이 늘 0이라, 다시 재면 값이 망가진다
      if (r.top > 0.5) anchorY.current = window.scrollY + r.top;
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

  // ── 손잡이 드래그 — 손가락을 따라 시트가 실시간으로 움직인다 (사용자 확정) ──
  // 손잡이에 touch-action:none을 줘서 브라우저 기본 스크롤을 끄고 우리가 직접 굴린다.
  // 움직이는 범위는 [처음 자리(0) ~ 맨 위(anchorY)] 로 묶는다 — 손잡이는 시트 여닫기 전용이고,
  // 그보다 더 보는 건 내용 쪽을 스크롤하는 일이라 서로 섞이지 않게 한다.
  const onDragStart = (e) => {
    const t = e.touches[0];
    justDragged.current = false;   // 새 동작이 시작되면 이전 드래그 흔적을 지운다
    drag.current = { y0: t.clientY, s0: window.scrollY, moved: false, lastY: t.clientY, lastT: e.timeStamp, v: 0 };
  };
  const onDragMove = (e) => {
    const d = drag.current; if (!d) return;
    const t = e.touches[0];
    const dy = d.y0 - t.clientY;                    // 위로 끌면 +
    if (!d.moved && Math.abs(dy) < 6) return;       // 손 떨림은 탭으로 본다
    d.moved = true;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) d.v = (d.lastY - t.clientY) / dt;   // px/ms — 놓는 순간의 기세
    d.lastY = t.clientY; d.lastT = e.timeStamp;
    window.scrollTo(0, Math.max(0, Math.min(anchorY.current, d.s0 + dy)));
  };
  const onDragEnd = () => {
    const d = drag.current; drag.current = null;
    if (!d || !d.moved) return;                     // 그냥 탭 → onClick이 처리
    // 드래그 뒤에 따라오는 click 한 번만 무시한다. 타이머로도 풀어 주지 않으면
    // 그 플래그가 계속 남아 '한참 뒤의 진짜 탭'까지 삼켜 버린다 (실제로 겪은 버그)
    justDragged.current = true;
    setTimeout(() => { justDragged.current = false; }, 400);
    const max = anchorY.current;
    // 튕기듯 놓으면(0.35px/ms 이상) 그 방향으로, 아니면 가까운 쪽으로 붙인다
    go(Math.abs(d.v) > 0.35 ? (d.v > 0 ? max : 0) : (window.scrollY > max / 2 ? max : 0));
  };

  return (
    <Fragment>
      {/* ── ① 손잡이 — 맨 위(top:0)에 붙어 계속 남는다. 위로 끌거나 탭하면 올리고, 아래로 끌거나 다시 탭하면 내린다 ── */}
      <div ref={gripRef} style={{position:"sticky",top:0,zIndex:9,margin:0,marginTop:-24,padding:"18px 18px 7px",
        borderRadius:stuck?0:"30px 30px 0 0",background:"#F0F3F3", // Cloud — 순백 대신 수채화와 이어지는 아이보리·회색
        boxShadow:stuck?"none":"0 -10px 30px -12px rgba(40,70,45,0.30)",
        transition:"border-radius .18s ease"}}>
        <button type="button"
          onClick={()=>{ if(justDragged.current){ justDragged.current=false; return; } stuck?collapse():expand(); }}
          aria-label={stuck?"시트 내리기":"시트 올리기"}
          onTouchStart={onDragStart} onTouchMove={onDragMove} onTouchEnd={onDragEnd} onTouchCancel={onDragEnd}
          style={{display:"block",width:"100%",background:"none",border:"none",padding:0,
            cursor:"pointer",touchAction:"none",WebkitTapHighlightColor:"transparent"}}>
          <span style={{display:"block",width:44,height:5,borderRadius:999,background:"#D9DED7",margin:"0 auto"}}/>
        </button>
      </div>
      {/* ── ② 탭 줄 — 손잡이 바로 아래(top=손잡이 높이)에 붙어 계속 남는다 ── */}
      <div style={{position:"sticky",top:gripH,zIndex:8,padding:"1px 18px 10px",background:"#F0F3F3",
        // 붙으면 아래로 그림자를 깔아 '지나가는 내용'과 층을 나눈다
        boxShadow:stuck?"0 6px 16px -6px rgba(40,70,45,0.30)":"none",
        transition:"box-shadow .18s ease"}}>
        {/* 탭 3개 (탐험/미션/캐릭터) — 글자만 (사용자 확정: 이모지·부제를 빼 높이를 줄임) */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
          {tiles.map(t=>{
            const on=activeTab===t.k;
            const ac=TILE_ACCENT[t.k]||TILE_ACCENT.area;
            return (
              <button key={t.k} onClick={()=>onSelect&&onSelect(t.k)} className="jelly-tap" style={{
                display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",cursor:"pointer",
                padding:"9px 8px",borderRadius:16,minWidth:0,
                border:on?`2px solid ${ac.border}`:"1.5px solid #D8C9A8",
                background:on?ac.bg:"#F8F2E6",
                boxShadow:"0 3px 11px rgba(155,114,74,0.10)"}}>
                <b style={{fontFamily:F,fontSize:16,fontWeight:400,color:on?ac.text:"#4B3A2F",lineHeight:1.2,whiteSpace:"nowrap"}}>{t.title}</b>
              </button>
            );
          })}
        </div>
      </div>
      {/* ── ③ 날짜바 — 탭 아래 (사용자 확정). 고정하지 않아 위로 밀려 올라가 탭 뒤로 숨는다 (z-index가 낮아서) ── */}
      <div style={{position:"relative",zIndex:1,padding:"0 18px 14px",background:"#F0F3F3"}}>
        {dateNav}
      </div>
    </Fragment>
  );
}

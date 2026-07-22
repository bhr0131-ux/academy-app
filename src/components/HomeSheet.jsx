/* ════════════════════════════════════════════════════════════════════════
   HomeSheet — 아이 홈(모험) 하단 시트: 레벨 줄 + 진행바 + 3타일(모험/미션/캐릭터)
   ────────────────────────────────────────────────────────────────────────
   App.jsx 홈 화면에서 분리(CLAUDE.md 3번: 수정 시 점진 분리).
   표시 전용 컴포넌트 — 데이터 계산은 App이 하고 props로 받는다.

   팔레트: 사용자 확정 수채화 톤 (Cloud 시트 / Sky 선택 / Forest·Rock·Grass 텍스트)
   폰트: 제목 온글잎 콘콘체 / 부제 Pretendard SemiBold (index.html @font-face)

   props
     name      : string                      아이 이름
     level     : number                      현재 레벨
     pct       : number(0~100)               다음 레벨까지 진행률
     tiles     : [{k,title,sub,icon}]        타일 데이터 (k=탭 키)
     activeTab : string                      현재 선택 탭 키
     onSelect  : (k)=>void                   타일 탭 선택
   ════════════════════════════════════════════════════════════════════════ */

export default function HomeSheet({ name, level, pct = 0, tiles = [], activeTab, onSelect }) {
  return (
    <div style={{position:"relative",zIndex:3,margin:0,marginTop:-24,padding:"18px 18px 22px",
      borderRadius:"30px 30px 0 0",background:"#F0F3F3", // Cloud — 순백 대신 수채화와 이어지는 아이보리·회색
      boxShadow:"0 -10px 30px -12px rgba(40,70,45,0.30)"}}>
      {/* 시트 핸들바 */}
      <div style={{width:44,height:5,borderRadius:999,background:"#D9DED7",margin:"-4px auto 14px"}}/>
      {/* 레벨 줄 */}
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:9}}>
        <span style={{fontSize:17,fontWeight:900,color:"#4B3A2F"}}>레벨{level} {name}</span>
        <span style={{fontSize:18,fontWeight:900,color:"#62B9E6",fontVariantNumeric:"tabular-nums"}}>{pct}%</span>
      </div>
      <div style={{height:12,borderRadius:999,background:"#DDE5DE",overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,borderRadius:999,background:"linear-gradient(90deg,#5C8B57,#8FB081)",boxShadow:"inset 0 2px 0 rgba(255,255,255,0.35)"}}/>
      </div>
      {/* 3 타일 (모험/미션/캐릭터) = 탭 선택 — 아이콘 위·세로 중앙 정렬, 선택 시 파란 강조 */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginTop:15}}>
        {tiles.map(t=>{
          const on=activeTab===t.k;
          return (
            <button key={t.k} onClick={()=>onSelect&&onSelect(t.k)} className="jelly-tap" style={{
              display:"flex",flexDirection:"column",alignItems:"center",gap:5,textAlign:"center",cursor:"pointer",
              padding:"14px 8px 12px",borderRadius:22,minWidth:0,
              border:on?"2px solid #8FC9ED":"1.5px solid #E3E6DE",
              background:on?"#EAF6FD":"#F7F8F6",
              boxShadow:"0 4px 14px rgba(71,116,71,0.10)"}}>
              <span style={{fontSize:30,lineHeight:1}}>{t.icon}</span>
              <b style={{display:"block",fontFamily:"'OwnglyphConCon','Noto Sans KR',sans-serif",fontSize:19,fontWeight:400,color:on?"#477447":"#4B3A2F",marginTop:3,lineHeight:1.1}}>{t.title}</b>
              <small style={{display:"block",fontFamily:"'PretendardSemiBold','Noto Sans KR',sans-serif",fontSize:11.5,fontWeight:400,color:"#7E8C7B",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"100%"}}>{t.sub}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

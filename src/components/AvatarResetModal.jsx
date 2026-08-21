import { C, FS, FW, RAD, SHADOW, CTRL_H } from "../data/tokens.js";

/* ════════════════════════════════════════════════════════════════════════
   AvatarResetModal — 꾸미기 전면 개편 환불 안내 (1회)
   ────────────────────────────────────────────────────────────────────────
   2026-08-19 개편으로 아바타 아이템을 전부 다시 채우면서, 지금까지 산 것을
   코인으로 돌려줬다. 아이가 "샀던 게 왜 없어졌지?" 하고 놀라지 않도록
   앱을 켤 때 한 번, 무엇이 얼마로 돌아왔는지 보여 준다.

   notice = {
     rows:  [{ childId, childName, items:[{id,label,price}], sum }],
     total: number,
     multi: boolean,           // 아이가 2명 이상이면 이름으로 묶어서 보여 준다
     full:  boolean            // true = 상점 전면 개편(1회) · false = 일부 아이템만 판매 중단
   }
   ════════════════════════════════════════════════════════════════════════ */
const won = (n) => Number(n || 0).toLocaleString();

export default function AvatarResetModal({ notice, onClose }) {
  if (!notice || !notice.rows?.length) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position:"fixed", inset:0, zIndex:9000,
        background:"rgba(16,18,40,0.45)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:18,
      }}
    >
      <div
        onClick={(e)=>e.stopPropagation()}
        style={{
          width:"100%", maxWidth:380, maxHeight:"84vh", overflowY:"auto",
          background:C.card, borderRadius:RAD.lg, boxShadow:SHADOW.lg,
        }}
      >
        {/* 머리말 */}
        <div style={{ padding:"22px 20px 16px", textAlign:"center" }}>
          <div style={{ fontSize:38, lineHeight:1 }}>🪙</div>
          {/* [2026-08-20] 전면 개편이 아니라 '일부 아이템만 판매 중단'일 때도 이 팝업을 쓴다.
              그때 '모두·전부'라고 하면 산 걸 다 빼앗긴 것처럼 읽혀서 말을 갈라 쓴다. */}
          <div style={{ fontSize:FS.modalTitle, fontWeight:FW.bold, color:C.text, marginTop:10 }}>
            {notice.full ? "꾸미기 아이템을 모두 환불했어요" : "상점에서 빠진 아이템을 환불했어요"}
          </div>
          <div style={{ fontSize:FS.sub, fontWeight:FW.normal, color:C.sub, marginTop:7, lineHeight:1.55 }}>
            {notice.full ? (<>꾸미기 상점을 새로 단장하는 중이에요.<br />지금까지 산 아이템은 코인으로 전부 돌려드렸어요.</>)
                         : (<>이제 팔지 않는 아이템이 있어요.<br />산 값만큼 코인으로 돌려드렸어요.</>)}
          </div>
        </div>

        {/* 환불 내역 */}
        <div style={{ padding:"0 20px" }}>
          {notice.rows.map((row) => (
            <div key={row.childId} style={{ marginBottom:12 }}>
              {notice.multi && (
                <div style={{ fontSize:FS.tag, fontWeight:FW.semi, color:C.textSoft, marginBottom:6 }}>
                  {row.childName}
                </div>
              )}
              <div style={{
                background:C.bg, borderRadius:RAD.md, border:`1px solid ${C.border}`,
                padding:"10px 12px",
              }}>
                {row.items.map((it) => (
                  <div key={it.id} style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"5px 0",
                  }}>
                    <span style={{ fontSize:FS.body, fontWeight:FW.normal, color:C.text }}>{it.label}</span>
                    <span style={{ fontSize:FS.body, fontWeight:FW.semi, color:C.textSoft }}>
                      +{won(it.price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* 총액 */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            borderTop:`1px solid ${C.border}`, marginTop:4, paddingTop:12,
          }}>
            <span style={{ fontSize:FS.title, fontWeight:FW.bold, color:C.text }}>총 환불</span>
            <span style={{ fontSize:FS.title, fontWeight:FW.bold, color:C.text }}>
              🪙 {won(notice.total)} 코인
            </span>
          </div>
        </div>

        {/* 닫기 */}
        <div style={{ padding:"16px 20px 20px" }}>
          <button
            onClick={onClose}
            style={{
              width:"100%", minHeight:CTRL_H + 6, border:"none", cursor:"pointer",
              borderRadius:RAD.md, background:C.text, color:"#fff",
              fontSize:FS.title, fontWeight:FW.bold,
            }}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

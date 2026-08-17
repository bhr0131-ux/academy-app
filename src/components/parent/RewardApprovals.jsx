/* ════════════════════════════════════════════════════════════════════════
   RewardApprovals — 보상 탭 맨 위 '구매 승인 대기' 카드
   ────────────────────────────────────────────────────────────────────────
   App.jsx 보상 탭에서 분리 (CLAUDE.md 3번: 고칠 때 점진 분리).
   그리기만 한다 — 승인·거절 처리와 코인 환불은 전부 App 이 맡는다.

   [사용자 확정 2026-08-11]
   · 이 화면에서 엄마가 가장 먼저 할 일은 '구매 요청 승인'인데, 아래 관리
     카드들과 크기·무게가 비슷해 눈에 안 띄었다 → 제목을 할 일 그대로
     '구매 승인 대기'로 쓰고 건수를 배지로 붙인다.
   · 주황 테두리 카드가 앱의 분홍·민트와 따로 놀았다 → 바탕은 아주 연한
     테마색, 주황은 건수 배지 하나에만.
   · 승인과 거절이 같은 크기라 둘 다 주요 행동처럼 보였다 → 승인은 채운
     민트 버튼(2칸), 거절은 회색 테두리 글자 버튼(1칸).
   · 아이가 여럿이면 누구 요청인지 카드 안에 배지로 남긴다 — 위쪽 아이 선택이
     바뀐 걸 못 보고 다른 아이 요청을 승인하는 실수를 막는다.

   props
     requests   : [{id,title,emoji,point}]   대기 중인 요청만
     childName  : string   지금 보고 있는 아이 이름
     showWho    : boolean  아이가 둘 이상인가 (요청자 배지 표시 여부)
     coinLabel  : string   코인 용어 (TM.coin)
     th, CT     : 테마·카드 색 토큰
     onApprove(id) / onReject(req)
   ════════════════════════════════════════════════════════════════════════ */

import { C, RAD, FW, FS, mixWhite, mixBlack, SHADOW } from "../../data/tokens.js";
import EmojiIcon from "./EmojiIcon.jsx";

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

export default function RewardApprovals({
  requests = [], childName = "", showWho = false, coinLabel = "코인",
  th, CT, onApprove, onReject,
}) {
  if (!requests.length) return null;
  /* [사용자 확정 2026-08-16] 바깥 큰 테두리 카드를 벗겼다 — '보상 관리'와 같은 이유로,
     카드 안에 카드가 들어앉아 답답했다. 요청 하나하나는 이미 흰 카드라
     배경 위에 바로 놓아도 구분된다. 여백만 남긴다. */
  return (
    <div style={{ marginBottom: 12, padding: "3px 2px", fontFamily: F }}>

      {/* 제목 — 할 일 그대로 쓰고, 건수는 주황 배지 하나로 */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
        <p style={{ fontSize: FS.title, fontWeight: FW.bold, margin: 0, color: C.text }}>구매 승인 대기</p>
        <span style={{ fontSize: FS.tag, fontWeight: FW.bold, color: "#fff", background: C.orange,
          borderRadius: RAD.pill, padding: "2px 9px", flexShrink: 0 }}>{requests.length}건</span>
      </div>
      <p style={{ fontSize: FS.sub, fontWeight: FW.normal, color: C.sub, margin: "0 0 11px" }}>
        {/* '이(가)' 는 이름 받침에 따라 달라져 어색하다 → '의' 로 두면 어떤 이름에도 맞는다 */}
        {childName ? `${childName}의 보상 구매 요청이에요.` : "보상 구매 요청이에요."}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {requests.map(req => (
          <div key={req.id} style={{ background: "#fff", borderRadius: RAD.lg, padding: "11px 12px",
            border: `1px solid ${C.border}`, boxShadow: SHADOW.sm }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
              <EmojiIcon emoji={req.emoji} size={24}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: FS.title, fontWeight: FW.bold, margin: 0, color: C.text,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{req.title}</p>
                <p style={{ fontSize: FS.sub, color: C.sub, fontWeight: FW.normal, margin: "2px 0 0" }}>
                  {req.point} {coinLabel} 사용
                </p>
              </div>
              {showWho && childName && (
                <span style={{ flexShrink: 0, fontSize: FS.tag, fontWeight: FW.semi, color: mixBlack(th.main, 0.35),
                  background: mixWhite(th.main, 0.88), borderRadius: RAD.pill, padding: "3px 9px" }}>
                  {childName}
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => onApprove && onApprove(req.id)} className="jelly-tap"
                style={{ flex: 2, border: "none", background: C.green, color: "#fff", borderRadius: RAD.sm,
                  padding: "10px", fontSize: FS.body, fontWeight: FW.bold, cursor: "pointer", fontFamily: F }}>
                승인
              </button>
              <button onClick={() => onReject && onReject(req)} className="jelly-tap"
                style={{ flex: 1, border: `1px solid ${C.border}`, background: "#fff", color: C.sub,
                  borderRadius: RAD.sm, padding: "10px", fontSize: FS.sub, fontWeight: FW.semi, cursor: "pointer", fontFamily: F }}>
                거절
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

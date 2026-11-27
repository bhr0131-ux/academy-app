import { C, CAMP_SHEET } from "../../data/tokens.js";
import EmojiIcon, { EmojiText } from "../EmojiIcon.jsx";

/* ════════════════════════════════════════════════════════════════════════
   🛡️ 연속 보호권 카드 — 꾸미기 상점 '배경 · 도우미 · 펫' 화면의 '도우미' 섹션 (사용자 확정 2026-11-27)
   아이가 혼자 읽고 이해하도록 요약 한 줄 + 상세 안내 세 줄을 카드 안에 다 적는다.
   동작 규칙·저장은 App(buyStreakShield) + data/streakShield.js. 여기는 보여 주기만.

   props
     count    보유 개수
     price    가격(코인)
     coin     지금 코인
     rescue   { date, days } | null — 어제 하루만 놓쳐 지금 사면 살릴 수 있는 기록
     onBuy()  구매
     cute, th, TM
   ════════════════════════════════════════════════════════════════════════ */
export default function StreakShieldCard({ count = 0, price = 150, coin = 0, rescue = null, onBuy, cute = false, th, TM }) {
  const can = coin >= price;
  const ink = cute ? C.text : CAMP_SHEET.text;
  const sub = cute ? C.sub : CAMP_SHEET.textSub;
  return (
    <div style={{ background: cute ? C.card : "#FFFDF6", border: `2px solid ${cute ? th.main + "44" : "#E9C77A"}`, borderRadius: 18,
      padding: "14px 14px 13px", boxShadow: cute ? `0 3px 10px ${th.main}1f` : "0 0 14px rgba(233,199,122,0.25), 0 3px 10px rgba(0,0,0,0.06)" }}>
      {/* 머리 — 그림 · 이름 · 보유 개수 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: cute ? C.faint : "radial-gradient(circle at 50% 40%, #FFF3CF, #F6E7C1)", border: `1px solid ${cute ? C.border : "#EAD9AE"}` }}>
          <EmojiIcon emoji="🛡️" size={32} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15.5, fontWeight: 900, color: ink }}>연속 보호권</p>
          <p style={{ margin: "3px 0 0", fontSize: 12.5, fontWeight: 800, color: sub, lineHeight: 1.4, wordBreak: "keep-all" }}>
            하루 미션을 놓쳐도 연속 달성 기록이 끊기지 않게 지켜줘요!
          </p>
        </div>
        <span style={{ flexShrink: 0, alignSelf: "flex-start", fontSize: 11.5, fontWeight: 900, borderRadius: 999, padding: "3px 9px",
          color: count > 0 ? "#fff" : sub, background: count > 0 ? "#E0A106" : (cute ? C.faint : "#F1E9D3") }}>
          보유 {count}개
        </span>
      </div>

      {/* 상세 안내 */}
      <ul style={{ margin: "11px 0 0", padding: "9px 12px 9px 26px", listStyle: "disc", borderRadius: 12,
        background: cute ? C.faint : "#FBF4E2", border: `1px solid ${cute ? C.border : "#EFE1BC"}`,
        fontSize: 12, fontWeight: 700, color: sub, lineHeight: 1.6, wordBreak: "keep-all" }}>
        <li>미리 사두면 미션을 놓친 날 자동으로 1회 사용돼요.</li>
        <li>어제 하루만 놓쳤을 때도 구매하면 바로 기록을 이어갈 수 있어요.</li>
        <li>이틀 이상 연속으로 빠진 기록은 복구할 수 없어요.</li>
      </ul>

      {/* 어제 놓친 하루를 지금 살릴 수 있을 때만 */}
      {rescue && (
        <p style={{ margin: "9px 0 0", fontSize: 12.5, fontWeight: 900, color: "#B5560F", textAlign: "center", lineHeight: 1.45, wordBreak: "keep-all" }}>
          <EmojiText>{`🔥 놓친 하루를 지금 지킬 수 있어요! 사면 연속 ${rescue.days}일이 이어져요`}</EmojiText>
        </p>
      )}

      <button onClick={onBuy} disabled={!can}
        style={{ width: "100%", marginTop: 10, borderRadius: 12, padding: "10px", fontSize: 14, fontWeight: 900, fontFamily: "inherit",
          cursor: can ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          ...(cute
            ? { border: "none", background: can ? th.grad : "#E5E7EB", color: can ? "#fff" : "#9CA3AF" }
            : can
              ? { border: "1px solid rgba(180,225,255,.55)", background: "linear-gradient(135deg, #4EA3FF 0%, #78C7FF 100%)", color: "#fff", boxShadow: "0 0 18px rgba(78,163,255,.28)" }
              : { border: "1px solid #E4D6AE", background: "#F1E9D3", color: "#B8A47C" }) }}>
        <EmojiIcon emoji={TM.coinEmoji} size={14} style={{ verticalAlign: "-0.18em" }} />
        <span>{price}</span>
        <span style={{ fontSize: 11.5, fontWeight: 800, opacity: 0.8 }}>{can ? `${TM.coin} 구매` : `${TM.coin} · ${price - coin}개 더 필요`}</span>
      </button>
    </div>
  );
}

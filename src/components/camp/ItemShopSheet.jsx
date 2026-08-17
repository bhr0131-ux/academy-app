import { useState } from "react";
import EmojiIcon from "../parent/EmojiIcon.jsx";
import { C, mixWhite, DUNGEON_SHOP, ITEM_ACTION_STYLE, getDungeonShopGradeColor,
  getDungeonShopItemBg, getDungeonShopItemShadow } from "../../data/tokens.js";
import { getRewardGrade, UI_TEXT } from "../../data/characters.js";

/* ════════════════════════════════════════════════════════════════════════
   ItemShopSheet — 아이템 상점 (캐릭터 탭에서 열리는 바텀시트, 캠프 개편 6/6)
   ────────────────────────────────────────────────────────────────────────
   아코디언에 있던 지갑 카드 + 아이템 목록을 그대로 옮겼다. 등급 색·바,
   펼침 행, '받을래요!' 버튼, 대기중 표시, 탐험/베이커리 스킨 분기 전부
   원본 그대로다.

   구매 로직(requestReward — 코인 차감·승인 대기·기록)은 App에 그대로 있고
   여기서는 부르기만 한다. 행 펼침(어느 아이템이 열려 있나)은 시트 안의
   상태로 옮겼다 — 화면을 닫으면 잊어도 되는 값이라 App에 둘 이유가 없다.

   props
     open, onClose
     dark      : 탐험 스킨이면 true
     skin      : kidSkin
     coin      : getChildCoin(childId)
     rewards   : getChildRewards() 원본 (여기서 가격순 정렬)
     hasPending: (rewardId) => bool
     onRequest : (reward) => void   (App의 requestReward)
     themeMain : th.main
     coinName, coinEmoji : TM.coin / TM.coinEmoji
     goldDark  : GP.dark (베이커리 지갑 글자) · gold : GP.gold
     approvedCount : 총 구매 수 (머리줄)
   ════════════════════════════════════════════════════════════════════════ */
export default function ItemShopSheet({ open, onClose, dark, skin = "dungeon", coin = 0,
  rewards = [], hasPending, onRequest, themeMain = "#60A8FF",
  coinName = "코인", coinEmoji = "💎", goldDark = "#5A4A2A", gold = "#F5B942", approvedCount = 0 }) {
  /* 행 펼침 — 아코디언 시절 App의 openRewardId 였던 것. 시트 전용 상태로 옮김 */
  const [openId, setOpenId] = useState(null);
  if (!open) return null;

  const cute = skin === "cute";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 4000,
      background: "rgba(20,16,32,0.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, height: "88vh",
        overflow: "hidden", background: dark ? "#20293A" : "#fff", borderRadius: "24px 24px 0 0",
        display: "flex", flexDirection: "column", boxShadow: "0 -12px 40px rgba(0,0,0,0.3)" }}>

        <div style={{ padding: "16px 20px 14px",
          background: dark ? "linear-gradient(160deg, #6F95A5, #61828F)" : "linear-gradient(160deg,#FDE7EF,#F9C5D6)",
          color: dark ? "#fff" : "#6B4A5C", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>🛒 아이템 상점</p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700,
                color: dark ? "rgba(255,255,255,0.85)" : "#8A6B7A" }}>
                {coinName}으로 원하는 보상을 살 수 있어요 · 🧾 총 구매 {approvedCount}개
              </p>
            </div>
            <button onClick={onClose} aria-label="닫기" style={{ border: "none", cursor: "pointer",
              background: dark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.6)",
              color: dark ? "#fff" : "#6B4A5C", borderRadius: 10, width: 30, height: 30,
              fontSize: 15, fontWeight: 900, flexShrink: 0 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "14px 14px 28px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {/* 지갑 카드 — 아코디언에 있던 것 그대로 */}
          <div style={{ background: cute ? `linear-gradient(135deg, ${mixWhite(themeMain, 0.80)}, ${mixWhite(themeMain, 0.68)})` : DUNGEON_SHOP.walletBg,
            borderRadius: 14, padding: "13px 14px", color: cute ? goldDark : "#fff", marginBottom: 12,
            border: cute ? `1px solid ${themeMain}33` : DUNGEON_SHOP.walletBorder,
            boxShadow: cute ? `0 4px 16px ${themeMain}14` : "inset 0 1px 0 rgba(255,255,255,0.12)" }}>
            <p style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, margin: "0 0 4px", color: cute ? themeMain : gold }}>WALLET</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontSize: 17, fontWeight: 900, margin: 0 }}>보유 {coinName}</p>
              <p style={{ fontSize: 24, fontWeight: 900, margin: 0, color: cute ? "#E09A00" : gold }}>{coin} {coinEmoji} {coinName}</p>
            </div>
          </div>

          {/* 아이템 목록 — 아코디언에 있던 것 그대로 */}
          <div style={cute
            ? { display: "flex", flexDirection: "column", gap: 10 }
            : { borderRadius: 18, padding: 10, display: "flex", flexDirection: "column", gap: 9,
                background: DUNGEON_SHOP.listBg, border: DUNGEON_SHOP.listBorder, boxShadow: DUNGEON_SHOP.listShadow }}>
            {rewards.slice().sort((a, b) => a.point - b.point).map(reward => {
              const canGet = coin >= reward.point;
              const remain = Math.max(0, reward.point - coin);
              const grade = getRewardGrade(reward);
              const pending = hasPending(reward.id);
              const isOpen = openId === reward.id || canGet || pending;
              const gradeBar = getDungeonShopGradeColor(reward.grade);
              const isLegend = !cute && reward.grade === "legendary";
              const cardBg = cute ? (canGet ? `linear-gradient(135deg, ${grade.color}16, #fff)` : "#fff") : "transparent";
              const cardBorder = cute ? (canGet ? grade.color + "55" : C.border) : DUNGEON_SHOP.itemBorder;
              return (
                <div key={reward.id} style={cute
                  ? { borderRadius: 14, overflow: "hidden", background: cardBg, border: `1.8px solid ${cardBorder}`,
                      boxShadow: canGet ? `0 5px 18px ${grade.color}22` : "0 2px 10px rgba(0,0,0,0.04)" }
                  : { position: "relative", borderRadius: 14, overflow: "hidden", background: getDungeonShopItemBg(reward.grade),
                      border: "none", boxShadow: getDungeonShopItemShadow(reward.grade), opacity: canGet ? 1 : 0.92 }}>
                  {!cute && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: gradeBar, opacity: 0.9 }} />}
                  <button onClick={() => setOpenId(isOpen ? null : reward.id)}
                    style={{ width: "100%", border: "none", background: "transparent", padding: "13px 14px",
                      display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left" }}>
                      <div style={{ width: 46, height: 46, borderRadius: 14,
                        background: cute ? `linear-gradient(135deg, ${grade.color}22, #fff)` : "rgba(255,255,255,0.16)",
                        border: cute ? `1.5px solid ${grade.color}45` : "1px solid rgba(255,255,255,0.3)",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
                        boxShadow: cute ? `0 3px 10px ${grade.color}18` : "inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 6px rgba(0,0,0,0.12)" }}>
                        <EmojiIcon emoji={reward.emoji} size={24}/>
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <p style={{ fontSize: 17, fontWeight: 900, margin: 0, color: cute ? C.text : "#fff",
                            textShadow: isLegend ? "0 1px 3px rgba(60,40,10,0.45)" : "none" }}>{reward.title}</p>
                          <span style={{ fontSize: 11, fontWeight: 900, color: cute ? grade.color : "#fff",
                            background: cute ? `${grade.color}18` : "rgba(255,255,255,0.22)",
                            padding: "2px 7px", borderRadius: 20 }}>{grade.name}</span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 800, margin: 0, color: cute ? C.sub : "rgba(255,255,255,0.84)",
                          textShadow: isLegend ? "0 1px 2px rgba(60,40,10,0.4)" : "none" }}>{reward.point} {coinEmoji} {coinName} 필요</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 900,
                      color: pending ? (cute ? C.purple : "#E6DBFF") : canGet ? (cute ? C.green : "#B6F5C6") : (cute ? C.orange : "#FFE9A6"),
                      background: cute ? (pending ? C.purpleL : canGet ? `${C.green}15` : `${C.orange}15`) : "transparent",
                      padding: cute ? "5px 8px" : "0", borderRadius: 20,
                      textShadow: cute ? "none" : "0 1px 2px rgba(0,0,0,0.35)" }}>
                      {isOpen ? "▲" : pending ? "대기중" : canGet ? "구매 가능" : "▼"}
                    </span>
                  </button>
                  {isOpen && (() => {
                    const actionState = pending ? "waiting" : canGet ? "available" : "disabled";
                    const aStyle = ITEM_ACTION_STYLE[actionState];
                    return (
                      <div style={{ padding: "0 14px 14px" }}>
                        <p style={{ fontSize: 13, fontWeight: 800,
                          color: !cute ? aStyle.statusText : (pending ? C.purple : canGet ? C.green : C.orange), margin: "0 0 10px" }}>
                          {pending ? UI_TEXT.message.waitingApproval : canGet ? "지금 살 수 있어요!" : `${remain} ${coinEmoji} ${coinName} 더 모으면 살 수 있어요`}
                        </p>
                        <button onClick={() => onRequest(reward)} disabled={!canGet || pending}
                          style={!cute
                            ? { width: "100%", padding: "11px 12px", borderRadius: 14, border: aStyle.buttonBorder,
                                background: aStyle.buttonBg, color: aStyle.buttonColor, fontSize: 15, fontWeight: 900,
                                cursor: canGet && !pending ? "pointer" : "not-allowed", boxShadow: aStyle.buttonShadow,
                                transform: canGet && !pending ? "scale(1.02)" : "none", opacity: pending ? 0.85 : 1,
                                transition: "transform .12s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }
                            : { width: "100%", padding: "11px 12px", borderRadius: 14, border: "none",
                                background: pending ? C.purpleL : canGet ? `linear-gradient(135deg, ${grade.color}, ${themeMain})` : C.border,
                                color: pending ? C.purple : canGet ? "#fff" : C.sub, fontSize: 15, fontWeight: 900,
                                cursor: canGet && !pending ? "pointer" : "not-allowed",
                                boxShadow: canGet && !pending ? `0 4px 14px ${grade.color}28` : "none",
                                transform: canGet && !pending ? "scale(1.02)" : "none", opacity: pending ? 0.85 : 1,
                                transition: "transform .12s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          {pending
                            ? UI_TEXT.button.pending + "..."
                            : canGet
                              ? <><span style={{ fontSize: 24, lineHeight: 1 }}>🎁</span><span>받을래요!</span></>
                              : UI_TEXT.button.needCoin}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

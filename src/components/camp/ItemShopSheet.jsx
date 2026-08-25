import { useState } from "react";
import EmojiIcon from "../parent/EmojiIcon.jsx";
import { C, mixWhite, CAMP_SHEET, DUNGEON_DECOR_CARD, dungeonDecorRarity } from "../../data/tokens.js";
import { getRewardGrade, UI_TEXT } from "../../data/characters.js";

/* ════════════════════════════════════════════════════════════════════════
   ItemShopSheet — 아이템 상점 (캐릭터 탭에서 열리는 바텀시트, 캠프 개편 6/6)
   ────────────────────────────────────────────────────────────────────────
   아코디언에 있던 지갑 카드 + 아이템 목록을 그대로 옮겼다. 등급 색·바,
   펼침 행, '받을래요!' 버튼, 대기중 표시, 탐험/베이커리 스킨 분기 전부
   원본 그대로다.

   [사용자 지적 2026-08-24] 탐험 쪽이 리스킨 전 '던전' 시절 색(청회색 헤더·
   진한 남색 지갑 카드·등급별 알록달록 그라데이션)에 그대로 머물러 있었다 —
   같은 캐릭터 탭의 꾸미기 상점(DecorShopSheet)과 같은 재료(DUNGEON_DECOR_CARD)로
   맞췄다. 베이커리(cute) 쪽은 그대로, 손대지 않았다.
   덤으로 고친 것: 카드가 펼쳐지면(구매 가능한 건 자동으로 펼쳐진다)
   '구매 가능' 글자가 화살표(▲) 하나로 바뀌어 버리던 것도 상태 글자는
   그대로 두고 화살표만 따로 돌아가게 했다.

   [사용자 지적 2026-08-25] "이제 밝은 수채화 그림으로 바꿨는데 이것만 어두워" —
   위에서 맞춘 남색 던전 톤을 다시 CAMP_SHEET/DUNGEON_DECOR_CARD 밝은 크림
   팔레트로 바꿨다. 구조는 그대로, 색 값만 남색→크림으로.

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
        overflow: "hidden", background: dark ? CAMP_SHEET.bodyBg : "#fff", borderRadius: "24px 24px 0 0",
        display: "flex", flexDirection: "column", boxShadow: "0 -12px 40px rgba(0,0,0,0.3)" }}>

        <div style={{ position: "sticky", top: 0, zIndex: 5, padding: "16px 20px 14px",
          background: dark ? CAMP_SHEET.headerBg : "linear-gradient(160deg,#FDE7EF,#F9C5D6)",
          color: dark ? CAMP_SHEET.headerText : "#6B4A5C", flexShrink: 0, boxShadow: dark ? `0 4px 16px ${themeMain}22` : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>🛒 아이템 상점</p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700,
                color: dark ? CAMP_SHEET.headerTextSub : "#8A6B7A" }}>
                {coinName}으로 원하는 보상을 살 수 있어요
              </p>
            </div>
            <button onClick={onClose} aria-label="닫기" style={{ border: "none", cursor: "pointer",
              background: dark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.6)",
              color: dark ? "#fff" : "#6B4A5C", borderRadius: 10, width: 30, height: 30,
              fontSize: 15, fontWeight: 900, flexShrink: 0 }}>✕</button>
          </div>
          {/* 코인·총 구매 칩 — 꾸미기 상점 머리줄과 같은 자리·모양 */}
          {dark && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: CAMP_SHEET.chipBg, border: `1px solid ${CAMP_SHEET.chipBorder}`, borderRadius: 14, padding: "5px 12px" }}>
                <span style={{ fontSize: 16 }}>{coinEmoji}</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: CAMP_SHEET.chipText }}>{coin} {coinName}</span>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: CAMP_SHEET.chipBg, border: `1px solid ${CAMP_SHEET.chipBorder}`, borderRadius: 14, padding: "5px 12px" }}>
                <span style={{ fontSize: 16 }}>🧾</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: CAMP_SHEET.chipText }}>총 구매 {approvedCount}개</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 14px 28px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {/* 지갑 카드 — 베이커리만. 탐험은 위 헤더 칩으로 통합(꾸미기 상점과 같은 자리) */}
          {cute && (
            <div style={{ background: `linear-gradient(135deg, ${mixWhite(themeMain, 0.80)}, ${mixWhite(themeMain, 0.68)})`,
              borderRadius: 14, padding: "13px 14px", color: goldDark, marginBottom: 12,
              border: `1px solid ${themeMain}33`, boxShadow: `0 4px 16px ${themeMain}14` }}>
              <p style={{ fontSize: 13, fontWeight: 900, letterSpacing: 1, margin: "0 0 4px", color: themeMain }}>WALLET</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ fontSize: 17, fontWeight: 900, margin: 0 }}>보유 {coinName}</p>
                <p style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#E09A00" }}>{coin} {coinEmoji} {coinName}</p>
              </div>
            </div>
          )}

          {/* 아이템 목록 — 탐험은 꾸미기 상점처럼 카드가 배경 위에 바로 놓인다(감싸는 판 없음) */}
          <div style={{ display: "flex", flexDirection: "column", gap: cute ? 10 : 9 }}>
            {rewards.slice().sort((a, b) => a.point - b.point).map(reward => {
              const canGet = coin >= reward.point;
              const remain = Math.max(0, reward.point - coin);
              const grade = getRewardGrade(reward);
              const pending = hasPending(reward.id);
              const isOpen = openId === reward.id || canGet || pending;
              const dr = dungeonDecorRarity(reward.grade);
              const cardBg = cute ? (canGet ? `linear-gradient(135deg, ${grade.color}16, #fff)` : "#fff") : DUNGEON_DECOR_CARD.cardBg;
              const cardBorder = cute ? (canGet ? grade.color + "55" : C.border) : dr.border;
              // 상태 배지 — 꾸미기 상점의 '구매 가능' 칩과 같은 색 규칙(대기중=보라 · 가능=파랑 · 아직=은은하게)
              const statusPill = pending
                ? { bg: "rgba(167,139,250,.92)", text: "#fff", label: "대기중" }
                : canGet
                  ? { bg: "rgba(78,163,255,.95)", text: "#fff", label: "구매 가능" }
                  : { bg: "#F1E9D3", text: "#B8A47C", label: "모으는 중" };
              return (
                <div key={reward.id} style={cute
                  ? { borderRadius: 14, overflow: "hidden", background: cardBg, border: `1.8px solid ${cardBorder}`,
                      boxShadow: canGet ? `0 5px 18px ${grade.color}22` : "0 2px 10px rgba(0,0,0,0.04)" }
                  : { position: "relative", borderRadius: 18, overflow: "hidden", background: cardBg,
                      border: `2px solid ${cardBorder}`, boxShadow: `${dr.glow}, 0 3px 10px rgba(0,0,0,0.06)`,
                      opacity: canGet || pending ? 1 : 0.85 }}>
                  <button onClick={() => setOpenId(isOpen ? null : reward.id)}
                    style={{ width: "100%", border: "none", background: "transparent", padding: "13px 14px",
                      display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left" }}>
                      <div style={{ width: 46, height: 46, borderRadius: 14,
                        background: cute ? `linear-gradient(135deg, ${grade.color}22, #fff)` : DUNGEON_DECOR_CARD.previewBg,
                        border: cute ? `1.5px solid ${grade.color}45` : `1px solid ${DUNGEON_DECOR_CARD.previewBorder}`,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0,
                        boxShadow: cute ? `0 3px 10px ${grade.color}18` : "none" }}>
                        <EmojiIcon emoji={reward.emoji} size={24}/>
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <p style={{ fontSize: 17, fontWeight: 900, margin: 0, color: cute ? C.text : CAMP_SHEET.text }}>{reward.title}</p>
                          <span style={{ fontSize: 11, fontWeight: 900, color: cute ? grade.color : dr.badgeText,
                            background: cute ? `${grade.color}18` : dr.badgeBg,
                            padding: "2px 7px", borderRadius: 20 }}>{grade.name}</span>
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 800, margin: 0, color: cute ? C.sub : CAMP_SHEET.textSub }}>{reward.point} {coinEmoji} {coinName} 필요</p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 900,
                        color: cute ? (pending ? C.purple : canGet ? C.green : C.orange) : statusPill.text,
                        background: cute ? (pending ? C.purpleL : canGet ? `${C.green}15` : `${C.orange}15`) : statusPill.bg,
                        padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap",
                        boxShadow: !cute && canGet ? "0 0 10px rgba(78,163,255,.35)" : "none" }}>
                        {pending ? "대기중" : canGet ? "구매 가능" : cute ? "▼" : "모으는 중"}
                      </span>
                      {!cute && <span style={{ fontSize: 11, color: CAMP_SHEET.textSub,
                        transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .15s ease", lineHeight: 1 }}>▾</span>}
                    </div>
                  </button>
                  {isOpen && (() => (
                      <div style={{ padding: "0 14px 14px" }}>
                        <p style={{ fontSize: 13, fontWeight: 800,
                          color: cute ? (pending ? C.purple : canGet ? C.green : C.orange) : (pending ? "#6B4FCB" : canGet ? "#1E7D4A" : CAMP_SHEET.textSub),
                          margin: "0 0 10px" }}>
                          {pending ? UI_TEXT.message.waitingApproval : canGet ? "지금 살 수 있어요!" : `${remain} ${coinEmoji} ${coinName} 더 모으면 살 수 있어요`}
                        </p>
                        <button onClick={() => onRequest(reward)} disabled={!canGet || pending}
                          style={!cute
                            ? { width: "100%", padding: "11px 12px", borderRadius: 14, border: "none",
                                background: pending ? "rgba(167,139,250,.22)" : canGet ? "linear-gradient(135deg, #4EA3FF 0%, #78C7FF 100%)" : "#F1E9D3",
                                color: pending ? "#6B3FC0" : canGet ? "#fff" : "#B8A47C", fontSize: 15, fontWeight: 900,
                                cursor: canGet && !pending ? "pointer" : "not-allowed",
                                boxShadow: canGet && !pending ? "0 0 18px rgba(78,163,255,.28)" : "none",
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
                  ))()}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

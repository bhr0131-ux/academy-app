import { C } from "../../data/tokens.js";
import { TITLE_RARITY } from "../../data/characters.js";

/* ════════════════════════════════════════════════════════════════════════
   TitleSheet — 상장 (캐릭터 탭에서 열리는 바텀시트, 캠프 개편 2/6)
   ────────────────────────────────────────────────────────────────────────
   아코디언에 있던 상장 카드 격자를 그대로 옮겼다 — 등급 테두리·오라,
   선택 체크, 잠금(🔒) 표시, 탐험/베이커리 스킨 분기 전부 원본 그대로.
   시트가 화면 전체를 쓰므로 격자가 페이지 스크롤에 끼어 있지 않고
   제 스크롤을 가진다는 것만 달라졌다.

   props
     open, onClose
     dark        : 탐험 스킨이면 true
     titles      : getAllTitles(childId) 결과
     isUnlocked  : (titleId) => bool
     selectedId  : 지금 전시 중인 상장 id
     onSelect    : (titleId) => void  (잠긴 상장 토스트는 App 쪽 selectTitle이 처리)
     faint       : 베이커리 옅은 배경 (CT.faint)
     unlockedCount, totalCount : 머리줄 표시용
   ════════════════════════════════════════════════════════════════════════ */
export default function TitleSheet({ open, onClose, dark, titles = [], isUnlocked, selectedId,
  onSelect, faint, unlockedCount = 0, totalCount = 0 }) {
  if (!open) return null;

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
              <p style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>👑 상장</p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700,
                color: dark ? "rgba(255,255,255,0.85)" : "#8A6B7A" }}>
                받은 상장을 골라 캐릭터 옆에 전시할 수 있어요 · {unlockedCount}/{totalCount}개 획득
              </p>
            </div>
            <button onClick={onClose} aria-label="닫기" style={{ border: "none", cursor: "pointer",
              background: dark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.6)",
              color: dark ? "#fff" : "#6B4A5C", borderRadius: 10, width: 30, height: 30,
              fontSize: 15, fontWeight: 900, flexShrink: 0 }}>✕</button>
          </div>
        </div>

        {/* 상장 격자 — 아코디언에 있던 것 그대로 */}
        <div style={{ padding: "14px 14px 26px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 9 }}>
            {titles.map(title => {
              const unlocked = isUnlocked(title.id);
              const selected = selectedId === title.id;
              const rarity = TITLE_RARITY[title.rarity || "common"];
              const cardBg   = dark ? (unlocked ? rarity.dgrad : "linear-gradient(180deg,#2C3658 0%,#252E4C 100%)") : (unlocked ? rarity.grad : faint);
              const cardBdr  = unlocked ? rarity.borderClr : (dark ? "#3E486B" : C.border);
              const restGlow = dark && unlocked ? rarity.glow : "none";
              const selGlow  = dark
                ? `${rarity.glow}, 0 0 26px ${rarity.borderClr}66, 0 0 0 1px ${rarity.borderClr}, 0 6px 18px rgba(8,16,40,0.55)`
                : `0 0 24px rgba(255,255,255,0.55), 0 0 0 1px ${rarity.color}, 0 6px 18px ${rarity.color}33`;
              const nameClr  = dark ? (unlocked ? "#1B2238" : "rgba(240,245,252,0.78)") : (selected ? rarity.color : unlocked ? C.text : C.sub);
              const condClr  = dark ? (unlocked ? "rgba(27,34,56,0.7)" : "rgba(240,245,252,0.64)") : C.sub;
              const rrClr    = dark
                ? (title.rarity === "legendary" ? "#7A5C12" : title.rarity === "epic" ? "#4A3A8A" : title.rarity === "rare" ? "#244C8A" : "#3A4255")
                : (title.rarity === "common" ? "#5A4A3A" : title.rarity === "legendary" ? "#7B5C00" : rarity.color);
              return (
                <button key={title.id} onClick={() => onSelect(title.id)} disabled={!unlocked}
                  style={{ borderRadius: 14, padding: "12px 10px", position: "relative",
                    transition: "transform .15s ease, box-shadow .15s ease",
                    transform: selected ? "scale(1.03)" : "scale(1)",
                    background: cardBg,
                    border: `2px solid ${cardBdr}`,
                    boxShadow: selected ? selGlow : restGlow,
                    opacity: unlocked ? 1 : 0.5, cursor: unlocked ? "pointer" : "not-allowed", textAlign: "center" }}>
                  {selected && (
                    <span style={{ position: "absolute", top: 7, right: 7, width: 20, height: 20, borderRadius: "50%",
                      background: rarity.color, color: "#fff", fontSize: 13, fontWeight: 900,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: `0 2px 6px ${rarity.color}66` }}>✓</span>
                  )}
                  <p style={{ fontSize: 24, margin: "0 0 5px" }}>{unlocked ? title.emoji : "🔒"}</p>
                  <p style={{ fontSize: 11, fontWeight: 900, color: rrClr, margin: "0 0 3px" }}>{rarity.icon} {rarity.name}</p>
                  <p style={{ fontSize: 13, fontWeight: 900, margin: "0 0 3px", color: nameClr }}>{title.name}</p>
                  <p style={{ fontSize: 11, color: condClr, margin: 0, fontWeight: 700, lineHeight: 1.3 }}>{title.condition}</p>
                  {selected
                    ? <p style={{ fontSize: 11, fontWeight: 900, color: "#fff", background: rarity.color, borderRadius: 20, padding: "3px 9px", display: "inline-block", margin: "7px 0 0" }}>✓ 선택됨</p>
                    : unlocked && <p style={{ fontSize: 11, fontWeight: 900, color: rrClr, background: dark ? "rgba(255,255,255,0.55)" : "#fff", border: `1px solid ${rarity.borderClr}`, borderRadius: 20, padding: "3px 9px", display: "inline-block", margin: "7px 0 0" }}>선택</p>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

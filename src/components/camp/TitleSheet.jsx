import { C, CAMP_SHEET, DUNGEON_DECOR_CARD, dungeonDecorRarity } from "../../data/tokens.js";
import { TITLE_RARITY } from "../../data/characters.js";

/* ════════════════════════════════════════════════════════════════════════
   TitleSheet — 상장 (캐릭터 탭에서 열리는 바텀시트, 캠프 개편 2/6)
   ────────────────────────────────────────────────────────────────────────
   아코디언에 있던 상장 카드 격자를 그대로 옮겼다 — 등급 테두리·오라,
   선택 체크, 잠금(🔒) 표시, 탐험/베이커리 스킨 분기 전부 원본 그대로.
   시트가 화면 전체를 쓰므로 격자가 페이지 스크롤에 끼어 있지 않고
   제 스크롤을 가진다는 것만 달라졌다.

   [사용자 지적 2026-08-24] 탐험 쪽이 리스킨 전 색(청회색 헤더·검은 배경)에
   남아 있었고, 특히 '받은 상장'만 밝은 회백색 카드(rarity.dgrad)로 튀어
   나머지 잠긴 카드들과 한 화면처럼 안 보였다. 카드는 받았든 안 받았든
   같은 판이고, 등급은 테두리·글로우로만 표현한다(꾸미기 상점과 같은 규칙).
   베이커리(cute) 쪽은 그대로, 손대지 않았다.

   [사용자 지적 2026-08-25] "이제 밝은 수채화 그림으로 바꿨는데 이것만 어두워" —
   위에서 맞춘 남색 던전 톤을 다시 CAMP_SHEET/DUNGEON_DECOR_CARD 밝은 크림
   팔레트로 바꿨다. 구조는 그대로, 색 값만 남색→크림으로.

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
        overflow: "hidden", background: dark ? CAMP_SHEET.bodyBg : "#fff", borderRadius: "24px 24px 0 0",
        display: "flex", flexDirection: "column", boxShadow: "0 -12px 40px rgba(0,0,0,0.3)" }}>

        <div style={{ position: "sticky", top: 0, zIndex: 5, padding: "16px 20px 14px",
          background: dark ? CAMP_SHEET.headerBg : "linear-gradient(160deg,#FDE7EF,#F9C5D6)",
          color: dark ? CAMP_SHEET.headerText : "#6B4A5C", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>👑 상장</p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700,
                color: dark ? CAMP_SHEET.headerTextSub : "#8A6B7A" }}>
                받은 상장을 골라 캐릭터 옆에 전시할 수 있어요 · {unlockedCount}/{totalCount}개 획득
              </p>
            </div>
            <button onClick={onClose} aria-label="닫기" style={{ border: "none", cursor: "pointer",
              background: dark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.6)",
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
              const dr = dungeonDecorRarity(title.rarity);
              // 탐험: 받았든 안 받았든 같은 흰 카드(꾸미기 상점과 같은 규칙) — 등급은 테두리·그림자로만
              const cardBg   = dark ? DUNGEON_DECOR_CARD.cardBg : (unlocked ? rarity.grad : faint);
              const cardBdr  = dark ? (selected ? "#E0A106" : dr.border) : (unlocked ? rarity.borderClr : C.border);
              const restGlow = dark ? `${dr.glow}, 0 3px 10px rgba(0,0,0,0.06)` : "none";
              const selGlow  = dark
                ? `0 0 16px rgba(224,161,6,0.24), 0 4px 14px rgba(0,0,0,0.10)`
                : `0 0 24px rgba(255,255,255,0.55), 0 0 0 1px ${rarity.color}, 0 6px 18px ${rarity.color}33`;
              const nameClr  = dark ? (unlocked ? CAMP_SHEET.text : "rgba(58,46,28,0.4)") : (selected ? rarity.color : unlocked ? C.text : C.sub);
              const condClr  = dark ? (unlocked ? CAMP_SHEET.textSub : "rgba(138,116,88,0.6)") : C.sub;
              const rrClr    = dark ? dr.badgeText
                : (title.rarity === "common" ? "#5A4A3A" : title.rarity === "legendary" ? "#7B5C00" : rarity.color);
              return (
                <button key={title.id} onClick={() => onSelect(title.id)} disabled={!unlocked}
                  style={{ borderRadius: 18, padding: "12px 10px", position: "relative",
                    transition: "transform .15s ease, box-shadow .15s ease",
                    transform: selected ? "scale(1.03)" : "scale(1)",
                    background: cardBg,
                    border: `2px solid ${cardBdr}`,
                    boxShadow: selected ? selGlow : restGlow,
                    opacity: unlocked ? 1 : (dark ? 0.6 : 0.5), filter: !unlocked && dark ? "grayscale(.2)" : "none",
                    cursor: unlocked ? "pointer" : "not-allowed", textAlign: "center" }}>
                  {selected && (
                    <span style={{ position: "absolute", top: 7, right: 7, width: 20, height: 20, borderRadius: "50%",
                      background: dark ? "#E0A106" : rarity.color, color: "#fff", fontSize: 13, fontWeight: 900,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: dark ? "0 2px 6px rgba(224,161,6,0.4)" : `0 2px 6px ${rarity.color}66` }}>✓</span>
                  )}
                  <p style={{ fontSize: 24, margin: "0 0 5px" }}>{unlocked ? title.emoji : "🔒"}</p>
                  <p style={{ fontSize: 11, fontWeight: 900, color: rrClr, margin: "0 0 3px",
                    background: dark ? dr.badgeBg : "transparent", display: "inline-block", padding: dark ? "1px 7px" : 0, borderRadius: 8 }}>{rarity.icon} {rarity.name}</p>
                  <p style={{ fontSize: 13, fontWeight: 900, margin: "3px 0 3px", color: nameClr }}>{title.name}</p>
                  <p style={{ fontSize: 11, color: condClr, margin: 0, fontWeight: 700, lineHeight: 1.3 }}>{title.condition}</p>
                  {selected
                    ? <p style={{ fontSize: 11, fontWeight: 900, color: "#fff", background: dark ? "#E0A106" : rarity.color, borderRadius: 20, padding: "3px 9px", display: "inline-block", margin: "7px 0 0" }}>✓ 선택됨</p>
                    : unlocked && <p style={{ fontSize: 11, fontWeight: 900, color: dark ? CAMP_SHEET.text : rrClr, background: dark ? "rgba(0,0,0,0.05)" : "#fff", border: `1px solid ${dark ? "rgba(58,46,28,0.18)" : rarity.borderClr}`, borderRadius: 20, padding: "3px 9px", display: "inline-block", margin: "7px 0 0" }}>선택</p>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

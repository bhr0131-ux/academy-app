import { C } from "../../data/tokens.js";
import { getBoxInfo, TREASURE_MILESTONE } from "../../data/characters.js";

/* ════════════════════════════════════════════════════════════════════════
   TreasureSheet — 보물창고 (캐릭터 탭에서 열리는 바텀시트, 캠프 개편 5/6)
   ────────────────────────────────────────────────────────────────────────
   아코디언에 있던 상자 3칸 격자와 안내 두 줄을 그대로 옮겼다.
   상자를 '여는' 흐름은 전부 App에 남아 있다 — 여기서는 onOpen(type)만 부른다.
     · 두근두근 연출(openingTreasure)·결과 모달(treasureModal)은 원래부터
       아코디언 밖(전체 화면 오버레이)이었으므로 옮길 것이 없다.
     · 연출이 이 시트(zIndex 4000)보다 위에 오도록 App 쪽 연출 zIndex를
       2500 → 9998 로 올렸다. 결과 모달은 원래 9999라 그대로다.
     · 상자를 열고 결과 모달을 닫으면 이 시트로 돌아온다 — 개수는 App
       상태에서 오므로 자동으로 줄어 있다.

   props
     open, onClose
     dark      : 탐험 스킨이면 true
     skin      : kidSkin — getBoxInfo(type, skin) 분기용
     treasure  : getChildTreasure(childId) — {normalBox,rareBox,legendBox,completedQuestCount}
     onOpen    : (boxType) => void  (App의 openTreasureBox)
     themeMain : th.main (베이커리 전설 상자 강조색 배합)
     faint     : CT.faint
     boxName   : TM.box (스킨별 상자 이름)
     bookEmoji, bookName : TM.bookEmoji / TM.book (머리줄)
   ════════════════════════════════════════════════════════════════════════ */
export default function TreasureSheet({ open, onClose, dark, skin = "dungeon", treasure = {},
  onOpen, themeMain = "#60A8FF", faint, boxName = "보물상자", bookEmoji = "🎁", bookName = "보물창고" }) {
  if (!open) return null;

  const cute = skin === "cute";
  const BOXES = [
    { type: "normal", key: "normalBox", color: C.sub,
      rewardBg: "linear-gradient(135deg, #515E78 0%, #657188 100%)", rewardBorder: "#7C8AA1", rewardGlow: "rgba(120,170,255,0.12)" },
    { type: "rare", key: "rareBox", color: C.purple,
      rewardBg: "linear-gradient(135deg, #514A86 0%, #6A6398 100%)", rewardBorder: "#8279A7", rewardGlow: "rgba(150,120,230,0.14)" },
    { type: "legend", key: "legendBox", color: "#F5B301",
      rewardBg: "linear-gradient(135deg, #927526 0%, #B09C62 100%)", rewardBorder: "#B6AA7F", rewardGlow: "rgba(255,215,100,0.24)" },
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 4000,
      background: "rgba(20,16,32,0.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "88vh",
        overflow: "hidden", background: dark ? "#20293A" : "#fff", borderRadius: "24px 24px 0 0",
        display: "flex", flexDirection: "column", boxShadow: "0 -12px 40px rgba(0,0,0,0.3)" }}>

        <div style={{ padding: "16px 20px 14px",
          background: dark ? "linear-gradient(160deg, #7EA7B5, #6E929E)" : "linear-gradient(160deg,#FDE7EF,#F9C5D6)",
          color: dark ? "#fff" : "#6B4A5C", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>{bookEmoji} {bookName}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700,
                color: dark ? "rgba(255,255,255,0.85)" : "#8A6B7A" }}>
                미션을 완료하면 {boxName}를 받아요 · {treasure.completedQuestCount || 0} {cute ? "도장 꾹" : "CLEAR"}
              </p>
            </div>
            <button onClick={onClose} aria-label="닫기" style={{ border: "none", cursor: "pointer",
              background: dark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.6)",
              color: dark ? "#fff" : "#6B4A5C", borderRadius: 10, width: 30, height: 30,
              fontSize: 15, fontWeight: 900, flexShrink: 0 }}>✕</button>
          </div>
        </div>

        {/* 상자 3칸 + 안내 — 아코디언에 있던 것 그대로 */}
        <div style={{ padding: "16px 16px 28px", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {BOXES.map(box => {
              const info = getBoxInfo(box.type, skin);
              const count = treasure[box.key] || 0;
              return (
                <button key={box.type} onClick={() => onOpen(box.type)} disabled={count <= 0}
                  style={{ position: "relative", overflow: "hidden", borderRadius: 14, padding: "13px 8px",
                    border: `${count > 0 ? (box.type === "legend" ? "2.5px" : "2px") : "1.5px"} solid ${count > 0 ? (cute ? box.color : box.rewardBorder) : (cute ? C.border : "rgba(255,255,255,0.30)")}`,
                    background: count > 0
                      ? (cute
                          ? (box.type === "legend" ? `linear-gradient(135deg, ${box.color}33, #FFFDF5)` : `linear-gradient(135deg, ${box.color}22, #fff)`)
                          : box.rewardBg)
                      : (cute ? faint : "rgba(255,255,255,0.12)"),
                    opacity: count > 0 ? 1 : 0.8, cursor: count > 0 ? "pointer" : "not-allowed", textAlign: "center",
                    boxShadow: count > 0
                      ? (cute
                          ? (box.type === "legend" ? `0 4px 16px ${box.color}66, 0 0 0 1px ${box.color}33` : `0 4px 14px ${box.color}30`)
                          : `0 0 18px ${box.rewardGlow}, inset 0 1px 0 rgba(255,255,255,0.25)`)
                      : "none" }}>
                  {!cute && count > 0 && box.type === "legend" && (
                    <span style={{ position: "absolute", top: 8, right: 10, fontSize: 16, opacity: 0.9 }}>✨</span>
                  )}
                  <p style={{ fontSize: cute ? 28 : 40, margin: "0 0 5px",
                    filter: !cute && count > 0 ? "drop-shadow(0 0 10px rgba(255,255,255,0.35))" : "none" }}>{info.emoji}</p>
                  <p style={{ fontSize: 13, fontWeight: 900, color: cute ? (count > 0 ? C.text : C.sub) : (count > 0 ? "#fff" : "rgba(255,255,255,0.85)"), margin: "0 0 3px" }}>{info.name}</p>
                  <p style={{ fontSize: 13, fontWeight: 900, color: cute ? (count > 0 ? box.color : C.sub) : (count > 0 ? "#fff" : "rgba(255,255,255,0.8)"), margin: "0 0 4px" }}>x {count}</p>
                  {count > 0 && <p style={{ fontSize: 11, fontWeight: 900, color: "#fff",
                    background: cute ? box.color : "rgba(255,255,255,0.18)",
                    border: cute ? "none" : "1px solid rgba(255,255,255,0.25)",
                    borderRadius: 20, padding: "2px 8px", display: "inline-block", margin: 0 }}>열기</p>}
                </button>
              );
            })}
          </div>
          <p style={{ fontSize: 11.5, color: dark ? "rgba(255,255,255,0.85)" : C.sub, fontWeight: 700, margin: "14px 0 0", lineHeight: 1.5 }}>
            {cute ? `미션을 모으면 ${boxName}를 받아요! (겹칠 땐 더 좋은 상자로 받아요)` : "미션을 모으면 상자를 받아요! (겹칠 땐 더 좋은 상자로 받아요)"}
          </p>
          <p style={{ fontSize: 11.5, color: dark ? "rgba(255,255,255,0.85)" : C.sub, fontWeight: 700, margin: "5px 0 0", lineHeight: 1.5 }}>
            {getBoxInfo("normal", skin).emoji} {TREASURE_MILESTONE.normal}개 → {getBoxInfo("normal", skin).name} · {getBoxInfo("rare", skin).emoji} {TREASURE_MILESTONE.rare}개 → {getBoxInfo("rare", skin).name} · {getBoxInfo("legend", skin).emoji} {TREASURE_MILESTONE.legend}개 → {getBoxInfo("legend", skin).name}
          </p>
        </div>
      </div>
    </div>
  );
}

import { C, mixWhite, mixHex } from "../../data/tokens.js";
import { PET_STAGES, petView, PET_STAGE_IMG } from "../../data/gameData.jsx";

/* ════════════════════════════════════════════════════════════════════════
   PetSheet — 나의 펫 (캐릭터 탭에서 열리는 바텀시트, 캠프 개편 4/6)
   ────────────────────────────────────────────────────────────────────────
   아코디언에 있던 펫 소개 카드를 그대로 옮겼다 — 큰 이모지, 이름·설명,
   성장 단계 줄(지나온 단계만 컬러), 안내 상자, 탐험 스킨의 반짝이 배경까지
   원본 그대로. 데이터·성장 로직은 App에 있고 여기는 보여 주기만 한다.

   props
     open, onClose
     dark    : 탐험 스킨이면 true
     stage   : getPetStage(childId)
     skin    : kidSkin ("dungeon" | "cute") — petView 분기용
     pet     : App의 getPet(childId) 결과 {emoji,name,desc,img,stage} — 있으면 이걸 그대로
               쓴다. 펫 스킨을 장착했으면(완성형) img가 비어 있어 스킨 이모지로 그려진다.
               안 주면(구버전 호환) 이 컴포넌트가 직접 petView로 계산한다 — 스킨은 반영 안 됨.
     themeMain : th.main (배경 그라데이션에 살짝 섞는 테마색)
     boxName, boxEmoji : TM.box / TM.boxEmoji (스킨별 상자 이름)
   ════════════════════════════════════════════════════════════════════════ */
export default function PetSheet({ open, onClose, dark, stage = 0, skin = "dungeon", pet: petProp,
  themeMain = "#60A8FF", boxName = "보물상자", boxEmoji = "🎁" }) {
  if (!open) return null;

  const pet = petProp || petView(PET_STAGES[stage], stage, skin);
  const isMax = stage >= PET_STAGES.length - 1;
  const cute = skin === "cute";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 4000,
      background: "rgba(20,16,32,0.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "88vh",
        overflow: "hidden", background: dark ? "#20293A" : "#fff", borderRadius: "24px 24px 0 0",
        display: "flex", flexDirection: "column", boxShadow: "0 -12px 40px rgba(0,0,0,0.3)" }}>

        <div style={{ padding: "16px 20px 14px",
          background: dark ? "linear-gradient(160deg, #7BA3B2, #6A8F9D)" : "linear-gradient(160deg,#FDE7EF,#F9C5D6)",
          color: dark ? "#fff" : "#6B4A5C", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>{cute ? "🦄" : "🐾"} 나의 펫</p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700,
                color: dark ? "rgba(255,255,255,0.85)" : "#8A6B7A" }}>
                {boxEmoji} {boxName}를 열면 펫이 조금씩 자라요
              </p>
            </div>
            <button onClick={onClose} aria-label="닫기" style={{ border: "none", cursor: "pointer",
              background: dark ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.6)",
              color: dark ? "#fff" : "#6B4A5C", borderRadius: 10, width: 30, height: 30,
              fontSize: 15, fontWeight: 900, flexShrink: 0 }}>✕</button>
          </div>
        </div>

        {/* 펫 소개 — 아코디언에 있던 카드 그대로 */}
        <div style={{ padding: "16px 16px 28px", overflowY: "auto" }}>
          <div style={{ position: "relative", overflow: "hidden", textAlign: "center",
            background: cute
              ? `linear-gradient(160deg, ${mixWhite(themeMain, 0.90)}, ${mixWhite(themeMain, 0.80)})`
              : `linear-gradient(135deg, ${mixHex("#3D517A", themeMain, 0.12)}, ${mixHex("#506895", themeMain, 0.12)})`,
            border: cute ? `1px solid ${themeMain}2A` : "2px solid rgba(180,220,255,0.35)",
            boxShadow: cute ? "none" : "inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 28px rgba(30,60,120,0.22)",
            borderRadius: 16, padding: "22px 16px" }}>
            {!cute && (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.35,
                backgroundImage: `radial-gradient(1.5px 1.5px at 20% 25%, rgba(255,255,255,0.9), transparent), radial-gradient(1.3px 1.3px at 75% 20%, rgba(255,209,102,0.9), transparent), radial-gradient(1.2px 1.2px at 85% 60%, rgba(255,255,255,0.6), transparent), radial-gradient(1.4px 1.4px at 35% 78%, rgba(180,220,255,0.8), transparent)` }} />
            )}
            <div style={{ position: "relative" }}>
              {!cute && pet.img ? (
                <img src={pet.img} alt={pet.name} draggable={false}
                  style={{ display: "block", height: 64, width: "auto", margin: "0 auto 8px",
                    filter: "drop-shadow(0 0 8px rgba(255,220,120,0.8))" }}/>
              ) : (
                <div style={{ fontSize: 64, lineHeight: 1, margin: "0 0 8px",
                  filter: cute ? "none" : "drop-shadow(0 0 8px rgba(255,220,120,0.8))" }}>{pet.emoji}</div>
              )}
              <p style={{ fontSize: 18, fontWeight: 900, color: cute ? C.text : "#fff", margin: "0 0 3px" }}>{pet.name}</p>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: cute ? C.sub : "rgba(255,255,255,0.7)",
                margin: "0 0 12px", lineHeight: 1.45 }}>{pet.desc}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                {PET_STAGES.map((p, i) => {
                  const pv = petView(p, i, skin);
                  const dim = { opacity: i <= stage ? 1 : 0.25, filter: i <= stage ? "none" : "grayscale(1)" };
                  return !cute && PET_STAGE_IMG[i]
                    ? <img key={i} src={PET_STAGE_IMG[i]} alt={pv.name} draggable={false}
                        style={{ display: "block", height: 19, width: "auto", ...dim }}/>
                    : <span key={i} style={{ fontSize: 19, ...dim }}>{pv.emoji}</span>;
                })}
              </div>
              <div style={{ background: cute ? "rgba(255,255,255,0.7)" : "rgba(15,18,34,0.32)",
                borderRadius: 10, padding: "9px 12px", fontSize: 12, fontWeight: 700,
                color: cute ? C.sub : "rgba(255,255,255,0.85)", lineHeight: 1.5,
                border: `1px solid ${cute ? themeMain + "1A" : "rgba(255,255,255,0.18)"}` }}>
                {isMax
                  ? (cute ? "🏆 최종 성장 완료! 최고의 펫이에요" : "🏆 최종 진화 완료! 최고의 펫이에요")
                  : `${boxEmoji} ${boxName}를 열면 가끔 ${cute ? "펫이 자라요" : "펫이 진화해요"}`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

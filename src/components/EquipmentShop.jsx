import { useState, useEffect } from "react";
import { C } from "../data/tokens.js";
import AvatarViewer from "./AvatarViewer.jsx";
import {
  AVATAR_RARITY, AVATAR_THEMES, SHOP_SLOT_ORDER, getItemsBySlot, getSlot,
} from "../data/avatarEquipment.js";

/* 탭 순서는 데이터(SHOP_SLOT_ORDER)에서만 관리한다 — 배경·효과는 거기서 이미 빠져 있다. */
const SHOP_SLOTS = SHOP_SLOT_ORDER.map(getSlot).filter(Boolean);

/* ════════════════════════════════════════════════════════════════════════
   EquipmentShop — 꾸미기 아바타 상점 모달
   ────────────────────────────────────────────────────────────────────────
   슬롯 탭으로 파츠 종류를 고르고, 그리드에서 파츠를 구매/장착/벗기 한다.
   좌측(넓은 화면)·상단(좁은 화면)에 실시간 미리보기(AvatarViewer)를 보여준다.

   화면 코드에는 아이템 수치를 하드코딩하지 않는다 — 전부 avatarEquipment.js
   카탈로그에서 map 으로 그린다. (CLAUDE.md 5번 준수)

   props
     open      : boolean
     onClose   : () => void
     coins     : number                   보유 코인
     owned     : string[]                 보유 아이템 id
     equipped  : { [slot]: itemId|null }  장착 상태
     onBuy     : (itemId) => void         구매 요청 (App이 코인검증·저장 처리)
     onToggle  : (itemId) => void         장착/벗기 요청
   ════════════════════════════════════════════════════════════════════════ */

export default function EquipmentShop({
  open, onClose, coins = 0, owned = [], equipped = {}, onBuy, onToggle, baseCharImg = null, gender = "boy",
}) {
  const [activeSlot, setActiveSlot] = useState(SHOP_SLOTS[0].key);

  /* 상점을 열면 취급 아이템 그림을 미리 받아 둔다.
     구매 직후 장착할 때 그림이 아직 없어 한 박자 늦게 나타나는 걸 막는다
     (특히 모자는 베이스 머리를 대신하는 그림이라 지연이 그대로 티가 난다). */
  useEffect(() => {
    if (!open) return;
    const seen = new Set();
    for (const s of SHOP_SLOTS) for (const it of getItemsBySlot(s.key)) {
      for (const p of [it.img, it.imgGirl]) {
        if (!p || seen.has(p)) continue;
        seen.add(p);
        const img = new Image();
        img.src = "/" + p.replace(/^\/+/, "");
      }
    }
  }, [open]);

  if (!open) return null;

  const items = getItemsBySlot(activeSlot);
  const slotMeta = getSlot(activeSlot);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 4000,
        background: "rgba(20,16,32,0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 14,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460, maxHeight: "92vh", overflow: "hidden",
          background: C.card, borderRadius: 26, display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* 헤더 */}
        <div style={{
          padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)", color: "#fff",
        }}>
          <div>
            <p style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>👗 꾸미기 상점</p>
            <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 700, opacity: 0.9 }}>
              파츠를 사서 나만의 아바타를 꾸며요
            </p>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.2)",
            padding: "8px 12px", borderRadius: 999, fontWeight: 900, fontSize: 15,
          }}>
            🪙 {coins.toLocaleString()}
          </div>
        </div>

        {/* 미리보기 */}
        <div style={{ padding: "16px 20px 8px", display: "flex", justifyContent: "center" }}>
          <AvatarViewer equipped={equipped} size={150} baseCharImg={baseCharImg} gender={gender} />
        </div>

        {/* 슬롯 탭 (가로 스크롤) */}
        <div style={{
          display: "flex", gap: 6, overflowX: "auto", padding: "6px 16px 12px",
          borderBottom: `1px solid ${C.line || "#EEE"}`,
        }}>
          {SHOP_SLOTS.map((s) => {
            const active = s.key === activeSlot;
            return (
              <button
                key={s.key}
                onClick={() => setActiveSlot(s.key)}
                style={{
                  flexShrink: 0, border: "none", cursor: "pointer",
                  padding: "8px 12px", borderRadius: 999, fontWeight: 800, fontSize: 13,
                  background: active ? C.purple : (C.purpleL || "#F1ECFF"),
                  color: active ? "#fff" : C.purple,
                  transition: "all 0.15s",
                }}
              >
                {s.emoji} {s.label}
              </button>
            );
          })}
        </div>

        {/* 파츠 그리드 */}
        <div style={{
          padding: "14px 16px", overflowY: "auto", flex: 1,
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
        }}>
          {items.length === 0 && (
            <div style={{
              gridColumn: "1 / -1", textAlign: "center", padding: "34px 10px",
              color: "#A0A0B0", fontSize: 13, fontWeight: 700,
            }}>
              🎨 새로운 아이템을 준비하고 있어요!
            </div>
          )}
          {items.map((item) => {
            const isOwned = owned.includes(item.id);
            const isEquipped = equipped[item.slot] === item.id;
            const canAfford = coins >= item.price;
            const rar = AVATAR_RARITY[item.rarity] || AVATAR_RARITY.common;
            const thm = AVATAR_THEMES[item.theme] || null;

            return (
              <div
                key={item.id}
                style={{
                  border: `2px solid ${isEquipped ? C.purple : rar.color + "44"}`,
                  borderRadius: 16, padding: "10px 8px", textAlign: "center",
                  background: isEquipped ? (C.purpleL || "#F5F0FF") : "#fff",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  position: "relative",
                }}
              >
                {/* 희귀도 배지 */}
                <span style={{
                  position: "absolute", top: 6, left: 6, fontSize: 9, fontWeight: 800,
                  color: "#fff", background: rar.color, padding: "2px 6px", borderRadius: 999,
                }}>
                  {rar.label}
                </span>

                {/* 테마 배지 (공용은 생략) */}
                {thm && item.theme !== "common" && (
                  <span style={{
                    position: "absolute", top: 6, right: 6, fontSize: 9, fontWeight: 800,
                    color: thm.color, background: thm.color + "1A",
                    padding: "2px 6px", borderRadius: 999,
                  }}>
                    {thm.emoji} {thm.label}
                  </span>
                )}

                {/* 파츠 아이콘 (이모지 대표) */}
                <div style={{ fontSize: 34, lineHeight: 1, marginTop: 12 }}>{item.emoji}</div>

                {/* 이름 */}
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.text }}>{item.label}</p>

                {/* 액션 버튼 */}
                {!isOwned ? (
                  <button
                    onClick={() => canAfford && onBuy && onBuy(item.id)}
                    disabled={!canAfford}
                    style={{
                      width: "100%", border: "none", borderRadius: 10, padding: "7px 4px",
                      fontWeight: 800, fontSize: 12,
                      cursor: canAfford ? "pointer" : "not-allowed",
                      background: canAfford ? C.purple : "#E5E5EA",
                      color: canAfford ? "#fff" : "#A0A0A8",
                    }}
                  >
                    🪙 {item.price}
                  </button>
                ) : (
                  <button
                    onClick={() => onToggle && onToggle(item.id)}
                    style={{
                      width: "100%", border: "none", borderRadius: 10, padding: "7px 4px",
                      fontWeight: 800, fontSize: 12, cursor: "pointer",
                      background: isEquipped ? "#FEE2E2" : (C.green || "#22C55E"),
                      color: isEquipped ? "#DC2626" : "#fff",
                    }}
                  >
                    {isEquipped ? (slotMeta?.removable ? "벗기" : "장착중") : "장착"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 닫기 */}
        <div style={{ padding: "10px 16px 16px", borderTop: `1px solid ${C.line || "#EEE"}` }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", border: "none", borderRadius: 14, padding: "13px",
              fontWeight: 900, fontSize: 15, cursor: "pointer",
              background: "#F1F1F5", color: C.text,
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

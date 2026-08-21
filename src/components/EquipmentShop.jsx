import { useState, useEffect } from "react";
import { C } from "../data/tokens.js";
import AvatarViewer from "./AvatarViewer.jsx";
import {
  AVATAR_RARITY, SHOP_SLOT_ORDER, getItemsBySlot, getSlot,
} from "../data/avatarEquipment.js";

/* 탭 순서는 데이터(SHOP_SLOT_ORDER)에서만 관리한다 — 배경·효과는 거기서 이미 빠져 있다. */
const SHOP_SLOTS = SHOP_SLOT_ORDER.map(getSlot).filter(Boolean);

/* 카드 그림 — item.thumb 이 있으면 그림, 없거나 로드 실패면 기존 이모지로 폴백.
   높이만 고정하고 폭은 그림 비율대로 두어(모자는 가로로 넓고 부츠는 세로로 길다)
   카드마다 크기가 들쭉날쭉해 보이지 않게 한다. */
/* [2026-08-20] 남녀 그림이 다른 아이템(사파리 옷)이 생겨서 thumbGirl 을 본다 —
   남아에게 여아 블라우스 그림을 보여 주면 무슨 옷인지 헷갈린다. */
function ItemThumb({ item, gender }) {
  const [failed, setFailed] = useState(false);
  const BOX = 46;
  const thumbSrc = (gender === "girl" && item.thumbGirl) || item.thumb;
  if (thumbSrc && !failed) {
    return (
      <div style={{ height: BOX, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={"/" + thumbSrc.replace(/^\/+/, "")}
          alt={item.label}
          onError={() => setFailed(true)}
          draggable={false}
          style={{ height: "100%", width: "auto", objectFit: "contain", pointerEvents: "none" }}
        />
      </div>
    );
  }
  return <div style={{ height: BOX, marginTop: 2, fontSize: 30, lineHeight: `${BOX}px` }}>{item.emoji}</div>;
}

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

  /* 미리보기 — 아직 안 산 파츠를 '입혀만' 보는 상태. { [slot]: itemId }
     슬롯당 하나씩이라 여러 슬롯을 동시에 걸쳐 볼 수 있다(모자+신발 같이 보기).
     실제 장착 상태(equipped)는 건드리지 않고, 미리보기 화면에만 얹는다. */
  const [preview, setPreview] = useState({});
  const previewEquipped = { ...equipped, ...preview };

  /* 상점을 닫으면 미리보기는 초기화 — 다음에 열었을 때 입어보던 게 남아 있으면 헷갈린다 */
  useEffect(() => { if (!open) setPreview({}); }, [open]);

  /* 산 파츠는 App이 바로 장착시키므로 미리보기에서 뺀다 (중복 표시 방지) */
  useEffect(() => {
    setPreview((prev) => {
      const next = {};
      let changed = false;
      for (const [slot, id] of Object.entries(prev)) {
        if (owned.includes(id)) { changed = true; continue; }
        next[slot] = id;
      }
      return changed ? next : prev;
    });
  }, [owned]);

  /* 상점을 열면 취급 아이템 그림을 미리 받아 둔다.
     구매 직후 장착할 때 그림이 아직 없어 한 박자 늦게 나타나는 걸 막는다
     (특히 모자는 베이스 머리를 대신하는 그림이라 지연이 그대로 티가 난다). */
  useEffect(() => {
    if (!open) return;
    const seen = new Set();
    for (const s of SHOP_SLOTS) for (const it of getItemsBySlot(s.key, gender)) {
      for (const p of [it.img, it.imgGirl, it.thumb, it.thumbGirl]) {
        if (!p || seen.has(p)) continue;
        seen.add(p);
        const img = new Image();
        img.src = "/" + p.replace(/^\/+/, "");
      }
    }
  }, [open, gender]);

  if (!open) return null;

  /* 여아 전용·남아 전용 아이템은 그 성별에게만 보인다(데이터의 forGender). */
  const items = getItemsBySlot(activeSlot, gender);
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
        <div style={{ padding: "16px 20px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <AvatarViewer equipped={previewEquipped} size={150} baseCharImg={baseCharImg} gender={gender} />
          {/* 입어보는 중 표시 + 한 번에 벗기 (안 사고 빠져나올 길) */}
          {Object.keys(preview).length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.purple }}>
                👀 입어보는 중 {Object.keys(preview).length}개
              </span>
              <button
                onClick={() => setPreview({})}
                style={{
                  border: "none", borderRadius: 999, padding: "4px 10px", cursor: "pointer",
                  fontSize: 11, fontWeight: 800, background: C.purpleL || "#F1ECFF", color: C.purple,
                }}
              >
                벗기
              </button>
            </div>
          )}
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
            const isPreviewing = !isOwned && preview[item.slot] === item.id;
            const canAfford = coins >= item.price;
            const rar = AVATAR_RARITY[item.rarity] || AVATAR_RARITY.common;

            return (
              <div
                key={item.id}
                style={{
                  border: isPreviewing ? `2px dashed ${C.purple}`
                        : `2px solid ${isEquipped ? C.purple : rar.color + "44"}`,
                  borderRadius: 16, padding: "10px 8px", textAlign: "center",
                  background: (isEquipped || isPreviewing) ? (C.purpleL || "#F5F0FF") : "#fff",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  position: "relative",
                }}
              >
                {/* (삭제됨) 희귀도·테마 배지 — 그림 위를 가려서 뺐다 (사용자 확정).
                    희귀도는 카드 테두리 색으로만 남는다. */}

                {/* 파츠 아이콘 — 그림(thumb) 우선, 없거나 로드 실패면 이모지 */}
                <ItemThumb item={item} gender={gender} />

                {/* 이름 */}
                <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: C.text }}>{item.label}</p>

                {/* 액션 버튼 — 안 산 파츠는 '보기'(입어보기) → 눌러서 입혀보면 '구매'로 바뀐다.
                    같은 슬롯의 다른 파츠를 보기하면 그쪽으로 넘어가고, 이 카드는 다시 '보기'가 된다. */}
                {!isOwned ? (
                  !isPreviewing ? (
                    <button
                      onClick={() => setPreview((p) => ({ ...p, [item.slot]: item.id }))}
                      style={{
                        width: "100%", border: `2px solid ${C.purple}`, borderRadius: 10, padding: "5px 4px",
                        fontWeight: 800, fontSize: 12, cursor: "pointer",
                        background: "#fff", color: C.purple,
                      }}
                    >
                      👀 입어보기
                    </button>
                  ) : (
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
                  )
                ) : (
                  /* 기본 지급 옷(starter)은 벗으면 속옷만 남아서 벗기를 막는다 —
                     버튼도 누를 수 없는 '입는 중'으로 둔다(다른 옷을 입으면 알아서 교체된다). */
                  <button
                    disabled={isEquipped && item.starter}
                    onClick={() => {
                      /* [버그 수정 2026-08-12] 미리보기(preview)가 실제 장착(equipped)을 덮어쓰는
                         구조라(previewEquipped = {...equipped, ...preview}), 같은 슬롯을 입어보던
                         중에 다른 파츠를 '장착'하면 화면이 안 바뀌어 고장난 것처럼 보였다.
                         직접 장착/벗기를 눌렀다는 건 '이걸로 하겠다'는 뜻이므로, 그 슬롯의
                         입어보기를 먼저 걷어낸 뒤 장착한다. */
                      setPreview((p) => {
                        if (!(item.slot in p)) return p;
                        const next = { ...p }; delete next[item.slot]; return next;
                      });
                      onToggle && onToggle(item.id);
                    }}
                    style={{
                      width: "100%", border: "none", borderRadius: 10, padding: "7px 4px",
                      fontWeight: 800, fontSize: 12,
                      cursor: (isEquipped && item.starter) ? "default" : "pointer",
                      background: (isEquipped && item.starter) ? "#EEF0F6" : (isEquipped ? "#FEE2E2" : (C.green || "#22C55E")),
                      color: (isEquipped && item.starter) ? "#8890B0" : (isEquipped ? "#DC2626" : "#fff"),
                    }}
                  >
                    {isEquipped
                      ? (item.starter ? "입는 중" : (slotMeta?.removable ? "벗기" : "장착중"))
                      : "장착"}
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

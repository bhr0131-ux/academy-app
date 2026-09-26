import { useState, useEffect, useRef } from "react";
import { C, CAMP_SHEET } from "../data/tokens.js";
import AvatarViewer from "./AvatarViewer.jsx";
import {
  AVATAR_RARITY, SHOP_SLOT_ORDER, getItemsBySlot, getSlot,
} from "../data/avatarEquipment.js";

/* 탭 순서는 데이터(SHOP_SLOT_ORDER)에서만 관리한다 — 배경·효과는 거기서 이미 빠져 있다. */
const SHOP_SLOTS = SHOP_SLOT_ORDER.map(getSlot).filter(Boolean);

/* 상점 강조색 — 헤더를 아이템 상점과 같은 초록으로 맞춘 뒤(2026-09-26) 안쪽만 보라로
   남아 있어서 한 화면에 두 계열이 섞였다. 상점 전체를 초록 한 계열로 쓴다. */
const G = {
  deep:  "#4C9450",
  main:  "linear-gradient(135deg, #7CB86A, #4C9450)",
  text:  "#3D7A42",
  soft:  "#EAF4E6",
  line:  "#CFE4C8",
};

/* 카드 그림 — item.thumb 이 있으면 그림, 없거나 로드 실패면 기존 이모지로 폴백.
   높이만 고정하고 폭은 그림 비율대로 두어(모자는 가로로 넓고 부츠는 세로로 길다)
   카드마다 크기가 들쭉날쭉해 보이지 않게 한다. */
/* [2026-08-20] 남녀 그림이 다른 아이템(사파리 옷)이 생겨서 thumbGirl 을 본다 —
   남아에게 여아 블라우스 그림을 보여 주면 무슨 옷인지 헷갈린다. */
function ItemThumb({ item, gender }) {
  const [failed, setFailed] = useState(false);
  const BOX = 52;
  const thumbSrc = (gender === "girl" && item.thumbGirl) || item.thumb;
  if (thumbSrc && !failed) {
    return (
      <div style={{ height: BOX, display: "flex", alignItems: "center", justifyContent: "center" }}>
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
  return <div style={{ height: BOX, fontSize: 32, lineHeight: `${BOX}px` }}>{item.emoji}</div>;
}

/* 무대 크기 — 고정값을 쓰지 않고 **남는 자리를 재서 그만큼 채운다** (사용자 확정:
   "배경 네모칸을 아예 확장, 공간을 최대한 활용"). 목록이 짧은 탭(모자 3개)에서는
   아래가 텅 비는 대신 아바타가 커지고, 목록이 긴 탭에서는 목록이 자리를 가져간다.
   아바타 그림은 정사각이라 가로·세로 중 작은 쪽에 맞춘다. */
/* active — 모달이 닫혀 있는 동안은 트리 자체가 없어서(open=false → null) 잴 게 없다.
   열릴 때 다시 재도록 의존성에 넣는다. 안 그러면 처음 재기에 실패한 기본값(200)이
   그대로 굳어 무대가 안 커진다. */
const useBoxSize = (active) => {
  const ref = useRef(null);
  const [size, setSize] = useState(200);
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize(Math.max(120, Math.floor(Math.min(r.width, r.height))));
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [active]);
  return [ref, size];
};

/* ════════════════════════════════════════════════════════════════════════
   EquipmentShop — 꾸미기 아바타 상점 모달
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-09-26 전면 개편]
   예전엔 카드마다 '👀 입어보기' 버튼이 있고, 입어본 뒤 그 카드의 버튼이 '구매'로
   바뀌는 구조였다. 카드가 높아져 한 화면에 몇 개 안 들어오고, 살지 말지를 손가락
   아래 작은 버튼에서 정해야 했다. 그래서 **고르는 곳과 정하는 곳을 나눴다.**

     · 카드      = 고르는 곳. 카드 전체가 버튼이고, 누르면 위 무대에서 입어만 본다.
                   안에는 그림·이름·가격(또는 보유 표시)만 남겨 높이를 줄였다.
     · 하단 바   = 정하는 곳. 고른 것 하나의 행동만 나온다
                   ("이 옷 입기" / "💎 350에 구매" / "벗기").
                   코인이 모자란 안내도 여기 한 곳에서만 한다.

   무대(아바타)와 카테고리는 위에 고정하고 목록만 스크롤한다 — 입어본 모습을
   보면서 다음 옷을 고를 수 있어야 한다.

   화면 코드에는 아이템 수치를 하드코딩하지 않는다 — 전부 avatarEquipment.js
   카탈로그에서 map 으로 그린다. (CLAUDE.md 7번 준수)

   props
     open      : boolean
     onClose   : () => void
     coins     : number                   보유 코인
     owned     : string[]                 보유 아이템 id
     equipped  : { [slot]: itemId|null }  장착 상태
     onBuy     : (itemId) => void         구매 요청 (App이 코인검증·저장 처리)
     onToggle  : (itemId) => void         장착/벗기 요청
     coinEmoji : string                   스킨별 코인 그림 (탐험 💎 / 베이커리 🍪)
   ════════════════════════════════════════════════════════════════════════ */

export default function EquipmentShop({
  open, onClose, coins = 0, owned = [], equipped = {}, onBuy, onToggle, baseCharImg = null, gender = "boy",
  /* 코인 이름·그림은 스킨마다 다르다(탐험 💎 코인 / 베이커리 🍪 쿠키) — 여기서 하드코딩하면
     같은 화면에서 카드는 🪙, 안내는 💎 로 갈린다. App 이 TERMS 값을 내려 준다. */
  coinEmoji = "🪙",
}) {
  /* [버그 수정 2026-09-26] 첫 탭을 고정(모자)으로 두었더니 **남아가 상점을 열면 빈 탭**이었다 —
     모자는 지금 여아 전용 3종뿐이라 남아에게는 아무것도 안 보인다.
     성별에 맞는 아이템이 있는 첫 탭에서 시작한다(남아는 상의, 여아는 모자). */
  const firstFilledSlot = (g) =>
    (SHOP_SLOTS.find((s) => getItemsBySlot(s.key, g).length > 0) || SHOP_SLOTS[0]).key;
  const [activeSlot, setActiveSlot] = useState(() => firstFilledSlot(gender));

  /* 고른 파츠 하나 — 하단 바가 이것 하나의 행동만 보여 준다. */
  const [selectedId, setSelectedId] = useState("");

  /* 입어보기 — 아직 결정하지 않은 상태. { [slot]: itemId }
     슬롯당 하나씩이라 여러 슬롯을 동시에 걸쳐 볼 수 있다(모자+옷 같이 보기).
     실제 장착 상태(equipped)는 건드리지 않고, 무대에만 얹는다. */
  const [preview, setPreview] = useState({});
  const previewEquipped = { ...equipped, ...preview };

  /* 코인이 모자란 채로 구매를 누르면 하단 버튼이 흔들리고 코인 뱃지가 반짝인다 —
     "눌러도 아무 일이 없다"로 보이지 않게. 얼마나 모자란지는 App 의 onBuy 가 띄운다. */
  const [shake, setShake] = useState(0);
  const [coinFlash, setCoinFlash] = useState(0);
  const bumpShort = () => {
    setShake((n) => n + 1); setCoinFlash((n) => n + 1);
  };

  const [stageRef, stage] = useBoxSize(open);

  /* 열 때마다 탭을 다시 잡는다 — 아이를 바꾸면 성별이 달라지고, 비어 있는 탭에
     멈춰 있으면 "상점에 아무것도 없다"로 보인다. */
  useEffect(() => {
    if (!open) return;
    setActiveSlot((cur) => (getItemsBySlot(cur, gender).length > 0 ? cur : firstFilledSlot(gender)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, gender]);

  /* 상점을 닫으면 입어보던 것·고른 것을 비운다 — 다음에 열었을 때 남아 있으면 헷갈린다 */
  useEffect(() => { if (!open) { setPreview({}); setSelectedId(""); } }, [open]);

  /* 산 파츠는 App이 바로 장착시키므로 입어보기에서 뺀다 (중복 표시 방지).
     고른 것(selectedId)은 그대로 둔다 — 산 직후 하단 바가 '벗기'로 이어진다. */
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
  /* 이 탭에 위아래 한 벌(coversBottom)이 하나라도 있으면 '세트' 뜻풀이를 한 줄 붙인다 */
  const hasSet = items.some((it) => it.coversBottom);

  const sel = selectedId ? items.find((it) => it.id === selectedId) || null : null;
  const selOwned = !!sel && owned.includes(sel.id);
  const selEquipped = !!sel && equipped[sel.slot] === sel.id;
  const selAfford = !!sel && coins >= sel.price;
  const selNeed = sel ? Math.max(0, sel.price - coins) : 0;

  /* 카드를 누르면 = 입어만 본다. 사거나 입는 건 하단 바에서 한 번 더 누른다. */
  const pick = (item) => {
    setSelectedId(item.id);
    /* 이미 입고 있는 걸 누르면 무대는 그대로 — 입어보기를 걸 필요가 없다 */
    if (equipped[item.slot] === item.id) {
      setPreview((p) => { if (!(item.slot in p)) return p; const n = { ...p }; delete n[item.slot]; return n; });
      return;
    }
    setPreview((p) => ({ ...p, [item.slot]: item.id }));
  };

  /* 하단 바 — 고른 것 하나의 행동. 없으면 비활성 안내. */
  const wearText = sel
    ? `이 ${getSlot(sel.slot)?.wearNoun || getSlot(sel.slot)?.label || "파츠"} ${getSlot(sel.slot)?.wearVerb || "착용"}`
    : "";
  let bar;
  if (!sel) {
    bar = { label: "마음에 드는 걸 골라보세요", tone: "mute", onPress: null };
  } else if (!selOwned) {
    bar = selAfford
      ? { label: `${coinEmoji} ${sel.price}에 구매`, tone: "go", onPress: () => onBuy && onBuy(sel.id) }
      : { label: `🔒 ${coinEmoji} ${sel.price}에 구매`, tone: "lock",
          note: `${coinEmoji} ${selNeed}개 더 모으면 살 수 있어요`,
          onPress: () => { bumpShort(); onBuy && onBuy(sel.id); } };
  } else if (!selEquipped) {
    bar = { label: wearText, tone: "go",
            onPress: () => {
              /* [버그 수정 2026-08-12] 입어보기가 실제 장착을 덮어쓰는 구조라
                 (previewEquipped = {...equipped, ...preview}), 입어보던 중에 장착하면
                 화면이 안 바뀌어 고장난 것처럼 보였다. 그 슬롯의 입어보기를 먼저 걷는다. */
              setPreview((p) => { if (!(sel.slot in p)) return p; const n = { ...p }; delete n[sel.slot]; return n; });
              onToggle && onToggle(sel.id);
            } };
  } else if (sel.starter || !slotMeta?.removable) {
    /* 기본 지급 옷(starter)은 벗으면 속옷만 남아서 벗기를 막는다 */
    bar = { label: "✓ 지금 입는 중", tone: "mute", onPress: null };
  } else {
    bar = { label: `${sel.label} 벗기`, tone: "off", onPress: () => onToggle && onToggle(sel.id) };
  }

  const barStyle = {
    mute: { background: "#EFEFF3", color: "#9598A8", cursor: "default" },
    go:   { background: G.main,    color: "#fff",    cursor: "pointer" },
    lock: { background: "#E5E5EA", color: "#9598A8", cursor: "pointer" },
    off:  { background: "#FEE9E9", color: "#D14343", cursor: "pointer" },
  }[bar.tone];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 4000,
        background: "rgba(20,16,32,0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 10,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460, height: "94vh", maxHeight: 880, overflow: "hidden",
          background: C.card, borderRadius: 24, display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* 이 모달에서만 쓰는 것들 — 앱 전역 keyframes 는 아이 화면 안쪽에 있어서
            상점(별도 컴포넌트)에서 확실히 쓰려고 여기 둔다.
            esTabs: 카테고리 줄의 스크롤바를 숨긴다. 스크롤바가 줄 높이를 먹어
            탭 글자·아이콘 아래가 잘려 보였다 (사용자 지적 2026-09-26). */}
        <style>{`
          @keyframes esShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-5px)}
            30%{transform:translateX(5px)}45%{transform:translateX(-4px)}
            60%{transform:translateX(4px)}80%{transform:translateX(-2px)}}
          @keyframes esCoinFlash{0%{transform:scale(1)}35%{transform:scale(1.18);
            background:rgba(255,255,255,0.55)}100%{transform:scale(1)}}
          .esTabs{scrollbar-width:none;-ms-overflow-style:none}
          .esTabs::-webkit-scrollbar{display:none}
        `}</style>

        {/* ── 맨 윗줄 — 이름 · 코인 · 닫기만. 설명 문구는 뺐다(사용자 확정):
               무대를 최대한 넓게 쓰려고 머리를 한 줄로 줄였다. ── */}
        <div style={{
          flexShrink: 0, padding: "8px 8px 8px 16px", display: "flex", alignItems: "center", gap: 8,
          background: CAMP_SHEET.headerBg, color: CAMP_SHEET.headerText,
        }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 900, flex: 1, minWidth: 0 }}>👗 꾸미기 상점</p>
          <div key={coinFlash} style={{
            display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.2)",
            padding: "6px 12px", borderRadius: 999, fontWeight: 900, fontSize: 14, flexShrink: 0,
            animation: coinFlash ? "esCoinFlash .55s ease-out" : undefined,
          }}>
            {coinEmoji} {coins.toLocaleString()}
          </div>
          {/* 닫기 — 그림은 작아도 누르는 자리는 48×48 로 남긴다 (안드로이드 권장) */}
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              flexShrink: 0, width: 48, height: 48, border: "none", background: "transparent",
              color: CAMP_SHEET.headerText, fontSize: 22, fontWeight: 900, cursor: "pointer",
              lineHeight: 1, padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── 무대 — 입어본 모습. 목록을 스크롤해도 여기는 안 움직인다.
               flex:1 이라 목록이 짧은 탭에서는 이쪽이 자리를 다 가져간다 ── */}
        <div ref={stageRef} style={{
          flex: "1 1 0", minHeight: 130, position: "relative", padding: "8px 0",
          display: "flex", alignItems: "center", justifyContent: "center", background: G.soft,
        }}>
          <AvatarViewer equipped={previewEquipped} size={stage} baseCharImg={baseCharImg} gender={gender} />
          {/* 입어보던 걸 한 번에 되돌리는 길 — 안 사고 빠져나올 수 있어야 한다 */}
          {Object.keys(preview).length > 0 && (
            <button
              onClick={() => { setPreview({}); setSelectedId(""); }}
              style={{
                position: "absolute", zIndex: 3, right: 12, top: 12, border: `1px solid ${G.line}`,
                background: "rgba(255,255,255,0.92)", color: G.text, borderRadius: 999,
                padding: "6px 12px", fontSize: 11.5, fontWeight: 900, cursor: "pointer",
              }}
            >
              ↩ 되돌리기
            </button>
          )}
        </div>

        {/* ── 카테고리 — 글자가 잘리지 않게 줄 높이를 넉넉히 잡고 스크롤바는 숨긴다 ── */}
        <div className="esTabs" style={{
          flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
          overflowX: "auto", padding: "10px 14px", background: "#fff",
          borderBottom: `1px solid ${C.line || "#EEE"}`,
        }}>
          {SHOP_SLOTS.map((s) => {
            const active = s.key === activeSlot;
            return (
              <button
                key={s.key}
                onClick={() => { setActiveSlot(s.key); setSelectedId(""); }}
                style={{
                  flexShrink: 0, border: "none", cursor: "pointer", minHeight: 38,
                  padding: "0 14px", borderRadius: 999, fontWeight: 800, fontSize: 13.5,
                  lineHeight: 1, whiteSpace: "nowrap",
                  background: active ? G.deep : G.soft,
                  color: active ? "#fff" : G.text,
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {s.emoji} {s.label}
              </button>
            );
          })}
        </div>

        {/* ── 안내 한 줄 ── */}
        <div style={{
          flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
          padding: "8px 16px 2px", background: "#fff",
        }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 800, color: C.sub }}>
            마음에 드는 옷을 골라보세요
          </span>
          {hasSet && (
            <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 900, color: G.text }}>
              세트 = 위아래 한 벌
            </span>
          )}
        </div>

        {/* ── 목록 — 이 화면에서 스크롤되는 곳은 여기뿐이다 ── */}
        <div style={{
          flex: "0 1 auto", minHeight: 0, maxHeight: "52%", overflowY: "auto",
          padding: "10px 16px 16px", background: "#fff",
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9, alignContent: "start",
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
            const isSel = selectedId === item.id;
            const canAfford = coins >= item.price;
            const rar = AVATAR_RARITY[item.rarity] || AVATAR_RARITY.common;

            /* 상태 한 줄 — '보유 중'(가지고만 있음)과 '입는 중'(지금 입고 있음)을 나눈다.
               둘을 같은 말로 묶어 두면 왜 어떤 건 눌러도 안 바뀌는지 알 수 없다. */
            const status = isEquipped
              ? { text: "✓ 입는 중", color: G.deep }
              : isOwned
                ? { text: "보유 중", color: C.sub }
                : { text: `${coinEmoji} ${item.price}`, color: canAfford ? C.text : "#B9BCCB" };

            return (
              <button
                key={item.id}
                onClick={() => pick(item)}
                style={{
                  border: isSel ? `2.5px solid ${G.deep}` : `2px solid ${rar.color}44`,
                  borderRadius: 14, padding: "9px 6px 8px", textAlign: "center", cursor: "pointer",
                  background: isSel ? G.soft : "#fff",
                  boxShadow: isSel ? "0 4px 12px rgba(76,148,80,0.22)" : "none",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  position: "relative",
                }}
              >
                {/* 세트 = 위아래 한 벌(coversBottom). 하의를 따로 안 사도 된다는 표시. */}
                {item.coversBottom && (
                  <span style={{
                    position: "absolute", left: 4, top: 4, background: G.deep, color: "#fff",
                    fontSize: 9, fontWeight: 900, borderRadius: 6, padding: "1px 5px", lineHeight: 1.5,
                  }}>
                    세트
                  </span>
                )}

                {/* 파츠 그림 — thumb 우선, 없거나 로드 실패면 이모지 */}
                <ItemThumb item={item} gender={gender} />

                <span style={{ fontSize: 11.5, fontWeight: 800, color: C.text, lineHeight: 1.25 }}>
                  {item.label}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 900, color: status.color, lineHeight: 1.1 }}>
                  {status.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 하단 — 고른 것 하나의 행동만. 코인이 모자란 안내도 여기 한 곳에서만 한다 ── */}
        <div style={{
          flexShrink: 0, padding: "10px 16px calc(12px + env(safe-area-inset-bottom, 0px))",
          borderTop: `1px solid ${C.line || "#EEE"}`, background: "#fff",
        }}>
          {bar.note && (
            <p style={{ margin: "0 0 7px", textAlign: "center", fontSize: 12, fontWeight: 900, color: C.orange }}>
              {bar.note}
            </p>
          )}
          <button
            key={shake}
            onClick={bar.onPress || undefined}
            disabled={!bar.onPress}
            style={{
              width: "100%", border: "none", borderRadius: 14, padding: "14px",
              fontWeight: 900, fontSize: 15.5, ...barStyle,
              animation: shake ? "esShake .5s ease-out" : undefined,
            }}
          >
            {bar.label}
          </button>
        </div>
      </div>
    </div>
  );
}

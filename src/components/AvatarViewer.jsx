import { useState } from "react";
import {
  getAvatarLayers, DEFAULT_AVATAR_BG, AVATAR_BASE_IMG, AVATAR_BASE_IMG_GIRL, AVATAR_BASE_EMOJI, AVATAR_BASE_Z,
} from "../data/avatarEquipment.js";

/* ════════════════════════════════════════════════════════════════════════
   AvatarViewer — 꾸미기 아바타 레이어 뷰어 (1024 캔버스 겹치기 방식)
   ────────────────────────────────────────────────────────────────────────
   모든 캐릭터·장비 이미지는 동일한 1024×1024 캔버스에 제자리에 그려져
   있으므로, 여기서는 전 레이어를 inset:0 / 100% 크기로 그대로 겹치기만
   한다. 슬롯별 위치 보정 코드는 존재하지 않는다. (CHARACTER_SPEC 준수)

   폴백 체인
     · 장비: img 로드 실패 → 슬롯별 emojiPos 위치에 대표 이모지
     · 베이스: AVATAR_BASE_IMG 실패 → baseCharImg(성장 3단계) → 이모지

   props
     equipped    : { [slot]: itemId | null }
     size        : number  한 변 px (기본 200)
     showFrame   : boolean 프레임 배경 표시 (기본 true)
     showBg      : boolean 아바타 배경(기본 배경+배경 슬롯 장비) 표시 (기본 true)
                   → 모험/베이커리 홈 무대처럼 이미 씬 배경이 깔린 곳에서는
                     false로 넘겨 이중 배경 겹침을 방지한다.
     baseCharImg : string|null  베이스 아트 미제작 시 폴백용 성장 캐릭터
   ════════════════════════════════════════════════════════════════════════ */

/* 장비 레이어 1장 — 이미지 우선, 실패 시 슬롯 지정 위치에 이모지 */
function AvatarLayer({ item, emojiPos, size }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = item.img && !imgFailed;
  const isBackground = item.slot === "background";

  /* 배경은 이미지 없으면 아무것도 안 그림 (뒤의 기본 배경이 보이게) */
  if (isBackground && !showImg) return null;

  if (showImg) {
    return (
      <img
        src={"/" + item.img.replace(/^\/+/, "")}
        alt={item.label}
        onError={() => setImgFailed(true)}
        draggable={false}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: isBackground ? "cover" : "contain",
          borderRadius: isBackground ? "inherit" : 0,
          pointerEvents: "none",
        }}
      />
    );
  }

  /* 이모지 폴백 — emojiPos {x,y,s} 는 0~1 비율 좌표 */
  const p = emojiPos || { x: 0.5, y: 0.5, s: 0.4 };
  return (
    <span
      style={{
        position: "absolute",
        left: `${p.x * 100}%`, top: `${p.y * 100}%`,
        transform: "translate(-50%, -50%)",
        fontSize: Math.round(size * p.s), lineHeight: 1,
        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.18))",
        userSelect: "none", pointerEvents: "none",
      }}
    >
      {item.emoji}
    </span>
  );
}

/* 베이스 캐릭터 — 아바타 전용 아트 → 성장 캐릭터 → 이모지 폴백 */
function BaseCharacter({ baseCharImg, size, gender = "boy" }) {
  const [baseFailed, setBaseFailed] = useState(false);
  const baseSrc = gender === "girl" ? AVATAR_BASE_IMG_GIRL : AVATAR_BASE_IMG;

  if (!baseFailed) {
    return (
      <img
        src={"/" + baseSrc.replace(/^\/+/, "")}
        alt="아바타"
        onError={() => setBaseFailed(true)}
        draggable={false}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "contain", pointerEvents: "none",
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.20))",
        }}
      />
    );
  }
  if (baseCharImg) {
    return (
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={baseCharImg}
          alt="캐릭터"
          draggable={false}
          style={{ height: "88%", width: "auto", maxWidth: "92%", objectFit: "contain",
                   filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.22))", pointerEvents: "none" }}
        />
      </div>
    );
  }
  return (
    <span style={{
      position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)",
      fontSize: Math.round(size * 0.5), lineHeight: 1, userSelect: "none",
    }}>
      {AVATAR_BASE_EMOJI}
    </span>
  );
}

export default function AvatarViewer({ equipped = {}, size = 200, showFrame = true, showBg = true, baseCharImg = null, gender = "boy" }) {
  /* showBg=false면 배경 슬롯 장비도 함께 생략 — 홈 무대 씬 위에 사각 배경이 겹치는 것 방지 */
  const layers = getAvatarLayers(equipped).filter(
    (layer) => showBg || layer.item?.slot !== "background"
  );

  return (
    <div
      style={{
        position: "relative", width: size, height: size, margin: "0 auto",
        borderRadius: showFrame || showBg ? 28 : 0,
        overflow: showFrame || showBg ? "hidden" : "visible",
        background: showFrame
          ? "linear-gradient(160deg, #F1F5FF 0%, #FDF2FF 100%)"
          : "transparent",
        boxShadow: showFrame ? "inset 0 0 0 2px rgba(139,92,246,0.14)" : "none",
      }}
    >
      {/* 기본 배경 — 항상 맨 뒤. 배경 아이템 이미지가 준비된 경우에만 위를 덮는다 (showBg=false면 생략) */}
      {showBg && (
        <img
          src={"/" + DEFAULT_AVATAR_BG.replace(/^\/+/, "")}
          alt=""
          draggable={false}
          style={{ position: "absolute", inset: 0, zIndex: 5, width: "100%", height: "100%",
                   objectFit: "cover", objectPosition: "center 72%", pointerEvents: "none" }}
        />
      )}
      {/* 뒤쪽 레이어(배경·등 장비) → 베이스 캐릭터 → 앞쪽 레이어 순서로 z 배치 */}
      {layers.map((layer) => (
        <div key={layer.slot} style={{ position: "absolute", inset: 0, zIndex: layer.zIndex }}>
          <AvatarLayer item={layer.item} emojiPos={layer.emojiPos} size={size} />
        </div>
      ))}
      <div style={{ position: "absolute", inset: 0, zIndex: AVATAR_BASE_Z }}>
        <BaseCharacter baseCharImg={baseCharImg} size={size} gender={gender} />
      </div>
    </div>
  );
}

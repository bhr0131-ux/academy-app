import { useState } from "react";
import { getAvatarLayers, DEFAULT_AVATAR_BG } from "../data/avatarEquipment.js";

/* ════════════════════════════════════════════════════════════════════════
   AvatarViewer — 꾸미기 아바타 레이어 뷰어
   ────────────────────────────────────────────────────────────────────────
   장착된 파츠(equippedMap)를 zIndex 순서(뒤→앞)로 겹쳐 하나의 아바타로 그린다.
   이미지 에셋(public/assets/avatar/…)이 아직 없을 수 있으므로, 각 레이어는
   이미지 로드 실패 시 자동으로 대표 이모지로 폴백한다. (base64 금지 규칙 준수)

   props
     equipped : { [slot]: itemId | null }   현재 장착 상태
     size     : number  뷰어 한 변 px (기본 200)
     showFrame: boolean 둥근 배경 프레임 표시 여부 (기본 true)
   ════════════════════════════════════════════════════════════════════════ */

/* 개별 레이어 한 장. 이미지 우선, 실패하면 이모지. */
function AvatarLayer({ item, size }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImg = item.img && !imgFailed;

  // 배경 슬롯은 프레임 전체를 채우고, 나머지 파츠는 중앙에 얹는다.
  const isBackground = item.slot === "background";
  const emojiSize = isBackground ? size : Math.round(size * 0.62);

  // 배경 아이템은 이미지가 없거나 로드 실패 시 이모지를 그리지 않는다.
  // (뒤에 항상 깔려 있는 기본 배경(DEFAULT_AVATAR_BG)이 그대로 보이게)
  if (isBackground && !showImg) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      {showImg ? (
        <img
          src={"/" + item.img.replace(/^\/+/, "")}
          alt={item.label}
          onError={() => setImgFailed(true)}
          style={{
            width: isBackground ? "100%" : "82%",
            height: isBackground ? "100%" : "82%",
            objectFit: isBackground ? "cover" : "contain",
            borderRadius: isBackground ? "inherit" : 0,
          }}
        />
      ) : (
        <span
          style={{
            fontSize: emojiSize,
            lineHeight: 1,
            filter: isBackground ? "none" : "drop-shadow(0 2px 4px rgba(0,0,0,0.18))",
            opacity: isBackground ? 0.9 : 1,
            userSelect: "none",
          }}
        >
          {item.emoji}
        </span>
      )}
    </div>
  );
}

export default function AvatarViewer({ equipped = {}, size = 200, showFrame = true, baseCharImg = null }) {
  const layers = getAvatarLayers(equipped);
  // baseCharImg(성장 3단계 캐릭터)가 있으면, 배경(zIndex 10) 위·나머지 파츠 아래에
  // 몸체로 깐다. 이때 카탈로그의 'body' 슬롯 이모지 몸통은 숨겨 중복을 막는다.
  const BASE_Z = 15; // background(10) < base < body(20)~
  const visibleLayers = baseCharImg
    ? layers.filter(l => l.slot !== "body")
    : layers;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        margin: "0 auto",
        borderRadius: 28,
        overflow: "hidden",
        background: showFrame
          ? "linear-gradient(160deg, #F1F5FF 0%, #FDF2FF 100%)"
          : "transparent",
        boxShadow: showFrame ? "inset 0 0 0 2px rgba(139,92,246,0.14)" : "none",
      }}
    >
      {visibleLayers.length === 0 && !baseCharImg ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#B8B8C8",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          아바타를 꾸며보세요
        </div>
      ) : (
        <>
          {/* 기본 배경 — 성장캐릭터와 동일한 그림. 항상 맨 뒤(z:5)에 깔린다.
              배경 아이템(z:10)을 장착하고 그 이미지가 준비된 경우에만 위를 덮는다. */}
          <img
            src={"/" + DEFAULT_AVATAR_BG.replace(/^\/+/, "")}
            alt=""
            draggable={false}
            style={{ position: "absolute", inset: 0, zIndex: 5, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 72%" }}
          />
          {/* 성장 캐릭터를 몸체 베이스로 (있을 때만) */}
          {baseCharImg && (
            <div style={{ position: "absolute", inset: 0, zIndex: BASE_Z, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img
                src={baseCharImg}
                alt="캐릭터"
                draggable={false}
                style={{ height: "88%", width: "auto", maxWidth: "92%", objectFit: "contain", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.22))" }}
              />
            </div>
          )}
          {visibleLayers.map((layer) => (
            <div key={layer.slot} style={{ position: "absolute", inset: 0, zIndex: layer.zIndex }}>
              <AvatarLayer item={layer.item} size={size} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

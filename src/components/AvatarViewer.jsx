import { useState } from "react";
import {
  getAvatarLayers, DEFAULT_AVATAR_BG, AVATAR_BASE_IMG, AVATAR_BASE_IMG_GIRL, AVATAR_BASE_EMOJI, AVATAR_BASE_Z,
  AVATAR_BASE_BODY_IMG, AVATAR_BASE_HEAD_IMG, AVATAR_BASE_BODY_IMG_GIRL, AVATAR_BASE_HEAD_IMG_GIRL,
} from "../data/avatarEquipment.js";

/* ════════════════════════════════════════════════════════════════════════
   AvatarViewer — 꾸미기 아바타 레이어 뷰어 (1024 캔버스 겹치기 방식)
   ────────────────────────────────────────────────────────────────────────
   모든 캐릭터·장비 이미지는 동일한 1024×1024 캔버스에 제자리에 그려져
   있으므로, 여기서는 전 레이어를 inset:0 / 100% 크기로 그대로 겹치기만
   한다. 슬롯별 위치 보정 코드는 존재하지 않는다. (CHARACTER_SPEC 준수)

   폴백 체인
     · 장비: imgGirl(여아 전용, 있을 때) → img → 슬롯별 emojiPos 위치에 대표 이모지
     · 베이스: 몸통+머리 2장 → (로드 실패 시) 합본 1장 → baseCharImg(성장 3단계) → 이모지

   머리 숨김
     hidesHead가 붙은 장비(모자 등)를 착용하면 베이스의 '머리' 장을 아예 안 그린다.
     그 장비 그림이 모자와 얼굴을 함께 담고 있어 머리를 대신하기 때문. 예전처럼 베이스
     머리 위에 덮어 씌우면 크기가 조금만 어긋나도 턱선·귀선이 겹쳐 보였다.

   props
     equipped    : { [slot]: itemId | null }
     size        : number  한 변 px (기본 200)
     showFrame   : boolean 프레임 배경 표시 (기본 true)
     showBg      : boolean 아바타 배경(기본 배경+배경 슬롯 장비) 표시 (기본 true)
                   → 탐험/베이커리 홈 무대처럼 이미 씬 배경이 깔린 곳에서는
                     false로 넘겨 이중 배경 겹침을 방지한다.
     baseCharImg : string|null  베이스 아트 미제작 시 폴백용 성장 캐릭터
   ════════════════════════════════════════════════════════════════════════ */

/* 장비 레이어 1장 — 이미지 우선, 실패 시 슬롯 지정 위치에 이모지
   imgGirl이 있으면 여아일 때 그 그림을 쓴다 (모자처럼 얼굴째 덮는 장비는
   성별 얼굴이 따로 필요하다). 로드 실패 시 공용 img → 이모지 순으로 내려간다. */
function AvatarLayer({ item, emojiPos, size, gender = "boy" }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [girlFailed, setGirlFailed] = useState(false);
  const useGirl = gender === "girl" && item.imgGirl && !girlFailed;
  const src = useGirl ? item.imgGirl : item.img;
  const showImg = src && !imgFailed;
  const isBackground = item.slot === "background";

  /* 배경은 이미지 없으면 아무것도 안 그림 (뒤의 기본 배경이 보이게) */
  if (isBackground && !showImg) return null;

  if (showImg) {
    return (
      <img
        key={src}
        src={"/" + src.replace(/^\/+/, "")}
        alt={item.label}
        onError={() => (useGirl ? setGirlFailed(true) : setImgFailed(true))}
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

/* 베이스 캐릭터 — 몸통+머리 2장 → 합본 1장 → 성장 캐릭터 → 이모지 폴백 */
function BaseCharacter({ baseCharImg, size, gender = "boy", hideHead = false }) {
  const [baseFailed, setBaseFailed] = useState(false);   // 합본까지 실패
  const [splitFailed, setSplitFailed] = useState(false); // 분리본만 실패 → 합본으로
  const girl = gender === "girl";
  const baseSrc = girl ? AVATAR_BASE_IMG_GIRL : AVATAR_BASE_IMG;
  const bodySrc = girl ? AVATAR_BASE_BODY_IMG_GIRL : AVATAR_BASE_BODY_IMG;
  const headSrc = girl ? AVATAR_BASE_HEAD_IMG_GIRL : AVATAR_BASE_HEAD_IMG;
  const imgStyle = { position: "absolute", inset: 0, width: "100%", height: "100%",
    objectFit: "contain", pointerEvents: "none" };
  // 그림자는 두 장을 감싼 div에 한 번만 — 장마다 걸면 머리 그림자가 몸통 위에 진다
  const shadow = { position: "absolute", inset: 0, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.20))" };

  if (!baseFailed && !splitFailed) {
    return (
      <div style={shadow}>
        <img src={"/" + bodySrc.replace(/^\/+/, "")} alt="아바타"
          onError={() => setSplitFailed(true)} draggable={false} style={imgStyle} />
        {!hideHead && (
          <img src={"/" + headSrc.replace(/^\/+/, "")} alt=""
            onError={() => setSplitFailed(true)} draggable={false} style={imgStyle} />
        )}
      </div>
    );
  }
  if (!baseFailed) {
    return (
      <img
        src={"/" + baseSrc.replace(/^\/+/, "")}
        alt="아바타"
        onError={() => setBaseFailed(true)}
        draggable={false}
        style={{ ...imgStyle, filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.20))" }}
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

/* ── 접지 그림자 ──────────────────────────────────────────────────────
   캐릭터가 바닥에 닿아 보이게 발밑에 깔아 주는 타원 그림자.

   비율은 전부 '1024 캔버스 안에서 실측한 값' 기준이다 (뷰어 상자 = 캔버스 1024).
     · 바닥선 : 맨발 y934(남)·936(여) / 신발 신으면 y946~947 → 가운데인 941 을 중심으로
     · 발 폭  : 맨발 205~211px, 부츠 232~241px (캔버스의 20~23.5%)
   그림자 폭은 부츠 발 폭보다 살짝 넓게 잡아 발 바깥으로 조금 번지게 한다.
   퍼센트는 상자 한 변(size) 대비. */
const SHADOW = { w: 0.245, h: 0.055, cy: 941 / 1024, blur: 0.010 };

function GroundShadow({ size }) {
  const w = Math.round(size * SHADOW.w);
  const h = Math.max(4, Math.round(size * SHADOW.h));
  return (
    <div
      aria-hidden
      style={{
        position: "absolute", left: "50%",
        bottom: Math.round((1 - SHADOW.cy) * size - h / 2),
        transform: "translateX(-50%)",
        width: w, height: h, borderRadius: "50%",
        /* 가운데를 넓게 유지하다 바깥에서 빠르게 사라진다 — 중심만 진한 그라디언트는
           블러를 먹이면 거의 안 보인다(실측). 기존 성장 캐릭터 그림자가 '단색'인 것과 같은 이유. */
        background: "radial-gradient(ellipse at center," +
          " rgba(60,45,25,0.42) 0%, rgba(60,45,25,0.38) 42%," +
          " rgba(60,45,25,0.20) 66%, transparent 82%)",
        filter: `blur(${Math.max(2, Math.round(size * SHADOW.blur))}px)`,
        zIndex: AVATAR_BASE_Z - 2,   // 베이스 캐릭터 뒤
        pointerEvents: "none",
      }}
    />
  );
}

export default function AvatarViewer({ equipped = {}, size = 200, showFrame = true, showBg = true, baseCharImg = null, gender = "boy", showShadow = true }) {
  /* showBg=false면 배경 슬롯 장비도 함께 생략 — 홈 무대 씬 위에 사각 배경이 겹치는 것 방지 */
  const layers = getAvatarLayers(equipped).filter(
    (layer) => showBg || layer.item?.slot !== "background"
  );
  // 얼굴째 덮는 장비(모자 등)를 쓰면 베이스 머리를 그리지 않는다
  const hideHead = layers.some((l) => l.item?.hidesHead);

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
      {/* 접지 그림자 — 배경 위, 베이스 캐릭터 아래 */}
      {showShadow && <GroundShadow size={size} />}
      {/* 뒤쪽 레이어(배경·등 장비) → 베이스 캐릭터 → 앞쪽 레이어 순서로 z 배치 */}
      {layers.map((layer) => (
        <div key={layer.slot} style={{ position: "absolute", inset: 0, zIndex: layer.zIndex }}>
          <AvatarLayer item={layer.item} emojiPos={layer.emojiPos} size={size} gender={gender} />
        </div>
      ))}
      <div style={{ position: "absolute", inset: 0, zIndex: AVATAR_BASE_Z }}>
        <BaseCharacter baseCharImg={baseCharImg} size={size} gender={gender} hideHead={hideHead} />
      </div>
    </div>
  );
}

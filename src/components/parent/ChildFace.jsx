/* ════════════════════════════════════════════════════════════════════════
   ChildFace — 아이 이름 앞에 붙는 작은 얼굴 아바타 (엄마용 아이 선택 칩 등)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-09] 이름 앞의 👦/👧 는 운영체제 이모지라 기기마다 모양이
   달라지고 앱의 수채화 그림체와도 어긋난다. 아이 캐릭터의 머리 그림을 그대로 쓴다.

   그림은 아바타와 같은 1024×1024 좌표계의 머리 장(base/head*.webp)이다.
   그중 얼굴만 동그랗게 보여 주려고 아래 네모를 잘라 쓴다 (실측한 값):
     · 남아 머리 알파 범위 (372,137)~(649,407)
     · 여아 머리 알파 범위 (350,129)~(674,467)
   [사용자 확정 2026-11-26] 동그라미 안에 아래쪽 여백 없이 꽉 차게:
     정사각형 아래변을 턱선에 맞추고, 양옆은 머리카락·양갈래 끝을 살짝 잘라
     얼굴이 원을 가득 채우게 성별마다 따로 자른다.
     · 남아 (378,132)에서 한 변 270 (아래변 y=402 = 턱)
     · 여아 (387,114)에서 한 변 250 (아래변 y=364 = 턱, 그 아래는 양갈래)
   원본은 그대로 두고 CSS로만 확대·이동하므로 배포 에셋이 늘지 않는다.
   ════════════════════════════════════════════════════════════════════════ */

import { AVATAR_BASE_HEAD_IMG, AVATAR_BASE_HEAD_IMG_GIRL } from "../../data/avatarEquipment.js";

const SRC_SIDE = 1024;
const CROP_BOY  = { x: 378, y: 132, side: 270 };
const CROP_GIRL = { x: 387, y: 114, side: 250 };

export default function ChildFace({ child, size = 22, bg = "#F3EFEA" }) {
  const girl = child?.gender === "girl";
  const { x: CROP_X, y: CROP_Y, side: CROP_SIDE } = girl ? CROP_GIRL : CROP_BOY;
  const k = size / CROP_SIDE;
  const src = girl ? AVATAR_BASE_HEAD_IMG_GIRL : AVATAR_BASE_HEAD_IMG;
  return (
    <span aria-hidden="true" style={{ position: "relative", flexShrink: 0, display: "block",
      width: size, height: size, borderRadius: "50%", overflow: "hidden", background: bg }}>
      <img src={src} alt="" draggable={false}
        style={{ position: "absolute", left: -CROP_X * k, top: -CROP_Y * k,
          width: SRC_SIDE * k, height: SRC_SIDE * k, maxWidth: "none", display: "block" }} />
    </span>
  );
}

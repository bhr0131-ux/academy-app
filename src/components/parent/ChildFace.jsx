/* ════════════════════════════════════════════════════════════════════════
   ChildFace — 아이 이름 앞에 붙는 작은 얼굴 아바타 (엄마용 아이 선택 칩 등)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-09] 이름 앞의 👦/👧 는 운영체제 이모지라 기기마다 모양이
   달라지고 앱의 수채화 그림체와도 어긋난다. 아이 캐릭터의 머리 그림을 그대로 쓴다.

   그림은 아바타와 같은 1024×1024 좌표계의 머리 장(base/head*.webp)이다.
   그중 얼굴만 동그랗게 보여 주려고 아래 네모를 잘라 쓴다 (실측한 값):
     · 남아 머리 알파 범위 (372,137)~(649,407)
     · 여아 머리 알파 범위 (350,129)~(674,467)
   [사용자 확정 2026-11-26] 동그라미 배경·테두리 없이 머리 그림만, 같은 크기 안에
     잘리는 곳 없이 통째로 넣는다 (그 전의 '원 안에 꽉 채우기'는 양갈래가 잘려 바꿈).
     성별마다 머리 전체(알파 범위, 실측)를 담는 정사각형으로 자른다:
     · 남아 알파 (342,89)~(684,402) → (342,74)에서 한 변 342
     · 여아 알파 (347,92)~(678,421) → (346,91)에서 한 변 332
   원본은 그대로 두고 CSS로만 확대·이동하므로 배포 에셋이 늘지 않는다.
   ════════════════════════════════════════════════════════════════════════ */

import { AVATAR_BASE_HEAD_IMG, AVATAR_BASE_HEAD_IMG_GIRL } from "../../data/avatarEquipment.js";

const SRC_SIDE = 1024;
const CROP_BOY  = { x: 342, y: 74, side: 342 };
const CROP_GIRL = { x: 346, y: 91, side: 332 };

/* bg 는 예전 호출부 호환용으로만 받고 쓰지 않는다 (원 배경을 뺐다) */
export default function ChildFace({ child, size = 22 }) {
  const girl = child?.gender === "girl";
  const { x: CROP_X, y: CROP_Y, side: CROP_SIDE } = girl ? CROP_GIRL : CROP_BOY;
  const k = size / CROP_SIDE;
  const src = girl ? AVATAR_BASE_HEAD_IMG_GIRL : AVATAR_BASE_HEAD_IMG;
  return (
    <span aria-hidden="true" style={{ position: "relative", flexShrink: 0, display: "block",
      width: size, height: size, overflow: "hidden" }}>
      <img src={src} alt="" draggable={false}
        style={{ position: "absolute", left: -CROP_X * k, top: -CROP_Y * k,
          width: SRC_SIDE * k, height: SRC_SIDE * k, maxWidth: "none", display: "block" }} />
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   EmojiIcon — 이모지 자리에 앱이 들고 있는 그림(Twemoji SVG)을 그린다
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-17] 보상 목록의 이모지는 선 아이콘 말고 지금 이모지와
   최대한 비슷하게 — 그래서 그림을 앱이 직접 들고 간다 (src/data/rewardEmoji.js).
   [사용자 확정 2026-09-27] 같은 방식을 보상 밖(학원 종류·재화·상자)으로 넓혔다.
   화면에서 이모지를 그릴 일이 생기면 글자 대신 이걸 쓴다 — 그래야 엄마 폰과
   아이 폰에서 같은 그림이 나온다.

   못 찾으면 예전 그대로 운영체제 이모지를 쓴다. 두 경우 모두 같은 자리·같은
   크기를 차지하도록 감싸는 span 하나로 맞춘다 — 폴백이 섞여도 줄이 안 흔들린다.
     · 그림이 있는 경우  : <img> (onError 로 한 번 더 폴백 — 파일이 빠져도 안전)
     · 그림이 없는 경우  : 글자 그대로

   size 는 '이모지 글자 크기'를 뜻한다. 숫자(px)도 되고 "clamp(20px,7vw,32px)"
   같은 CSS 길이 문자열도 된다. 그림은 그보다 살짝 크게(115%) 그려야 운영체제
   이모지와 눈으로 비슷해 보인다 — 이모지 글리프는 글자칸 안에 여백을 두고
   그려지는데 SVG 는 꽉 차기 때문이다.

   글 사이에 끼워 넣을 때는 style 로 세로 위치를 잡아 준다
   (예: style={{ verticalAlign:"-0.18em", marginRight:4 }}).
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { emojiFileName, hasEmojiArt } from "../data/rewardEmoji.js";

export default function EmojiIcon({ emoji, size = 24, style }) {
  const [failed, setFailed] = useState(false);
  const len = typeof size === "number" ? `${size}px` : size;
  const box = { width: len, height: len, flexShrink: 0, display: "inline-flex",
    alignItems: "center", justifyContent: "center", lineHeight: 1, ...style };

  if (!emoji) return <span style={box} />;
  if (failed || !hasEmojiArt(emoji)) {
    return <span style={{ ...box, fontSize: len }}>{emoji}</span>;
  }
  return (
    <span style={box}>
      <img src={`assets/emoji/${emojiFileName(emoji)}.svg`} alt={emoji}
        onError={() => setFailed(true)}
        style={{ width: "115%", height: "115%", display: "block" }} />
    </span>
  );
}

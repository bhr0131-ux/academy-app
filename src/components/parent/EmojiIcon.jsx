/* ════════════════════════════════════════════════════════════════════════
   EmojiIcon — 이모지 자리에 앱이 들고 있는 그림(Twemoji SVG)을 그린다
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-17] 보상 목록의 이모지는 선 아이콘 말고 지금 이모지와
   최대한 비슷하게 — 그래서 그림을 앱이 직접 들고 간다 (src/data/rewardEmoji.js).

   못 찾으면 예전 그대로 운영체제 이모지를 쓴다. 두 경우 모두 같은 자리·같은
   크기를 차지하도록 감싸는 span 하나로 맞춘다 — 폴백이 섞여도 줄이 안 흔들린다.
     · 그림이 있는 경우  : <img> (onError 로 한 번 더 폴백 — 파일이 빠져도 안전)
     · 그림이 없는 경우  : 글자 그대로

   size 는 '이모지 글자 크기'를 뜻한다. 그림은 그보다 살짝 크게(1.15배) 그려야
   운영체제 이모지와 눈으로 비슷해 보인다 — 이모지 글리프는 글자칸 안에 여백을
   두고 그려지는데 SVG 는 꽉 차기 때문이다.
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { emojiFileName, hasEmojiArt } from "../../data/rewardEmoji.js";

export default function EmojiIcon({ emoji, size = 24, style }) {
  const [failed, setFailed] = useState(false);
  const box = { width: size, height: size, flexShrink: 0, display: "inline-flex",
    alignItems: "center", justifyContent: "center", lineHeight: 1, ...style };

  if (!emoji) return <span style={box} />;
  if (failed || !hasEmojiArt(emoji)) {
    return <span style={{ ...box, fontSize: size }}>{emoji}</span>;
  }
  return (
    <span style={box}>
      <img src={`assets/emoji/${emojiFileName(emoji)}.svg`} alt={emoji}
        onError={() => setFailed(true)}
        style={{ width: size * 1.15, height: size * 1.15, display: "block" }} />
    </span>
  );
}

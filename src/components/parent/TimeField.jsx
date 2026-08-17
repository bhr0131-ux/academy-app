/* ════════════════════════════════════════════════════════════════════════
   TimeField — 시각 입력칸 (안내 글자가 보이는 <input type="time">)
   ────────────────────────────────────────────────────────────────────────
   [사용자 지적 2026-08-17] 장소 옆 빈 칸이 시간 자리인 줄 몰랐다.
   <input type="time"> 은 placeholder 를 무시한다 (브라우저가 안 그린다) → 빈 칸일 때만
   글자색을 투명하게 해 브라우저가 그리는 '--:--' 를 감추고, 그 자리에 안내 글자를 겹친다.
   옆 칸의 placeholder 와 같은 회색·같은 자리라 두 칸이 한 짝으로 읽힌다.
   누르는 순간(focus)에는 안내를 걷고 원래대로 돌려놓는다 — 시·분을 다 넣기 전까지
   value 가 빈 값이라, 안 그러면 치는 동안 숫자가 투명하게 가려진다.
   시계 아이콘은 브라우저가 따로 그리는 것이라 color 에 안 딸려간다 →
   빈 칸일 때만 붙는 .time-empty 로 감춘다 (index.html 참고).

   [2026-08-17] App.jsx 안에 있던 것을 이 파일로 옮겼다 — 학원 등록의 셔틀 시간칸과
   결석 탭의 보충 시간칸이 같은 것을 써야 해서다. App.jsx 에서 import 하면 결석 탭이
   App 을 다시 불러오는 순환이 생기므로, 양쪽이 이 파일을 본다.
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";

export default function TimeField({ value, onChange, hint, hintLeft = 11, style, boxStyle }) {
  const [focused, setFocused] = useState(false);
  const showHint = !value && !focused;
  return (
    <div style={{ position: "relative", display: "flex", minWidth: 0, ...boxStyle }}>
      <input type="time" value={value || ""} onChange={onChange} className={showHint ? "time-empty" : undefined}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ ...style, width: "100%", color: showHint ? "transparent" : undefined }} />
      {showHint && (
        <span style={{ position: "absolute", left: hintLeft, top: "50%", transform: "translateY(-50%)",
          pointerEvents: "none", fontSize: style?.fontSize, color: "#757575", whiteSpace: "nowrap" }}>
          {hint}
        </span>
      )}
    </div>
  );
}

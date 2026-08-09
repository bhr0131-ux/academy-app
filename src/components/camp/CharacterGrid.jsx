import { useLayoutEffect, useRef, useState } from "react";
import {
  gridSizes, CARD_PANEL, PAPER, INK, INK_SUB, BAR_FILL, BAR_TRACK,
} from "./gridLayout.js";

/* ════════════════════════════════════════════════════════════════════════
   CharacterGrid — 캐릭터 탭 본문 (가방 카드 + 아이콘 2열 격자)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-08] 캠프 그림(배경+텐트+그루터기+명패)을 걷어내고
   종이 위에 가방 카드 하나와 아이콘 여덟 개를 두 줄씩 놓는 배치로 바꿨다.
   배경 그림은 쓰지 않는다 — 종이색(PAPER)만 깐다.

   여기는 '그리기'만 한다 — 데이터도 동작도 전부 App에 있고, 이 컴포넌트는
   받은 값을 얹고 눌리면 받은 함수를 부를 뿐이다. 저장 키·계산 로직은
   하나도 건드리지 않는다.

   왜 이 배치인가 (캠프 대비)
     · 이름을 명패 원화 '안'에 끼워 넣지 않아도 되니 글자 맞춤 로직이 사라진다.
     · 아이콘 가로세로비를 서로 맞출 필요가 없다 — 정사각 칸에 contain.
     · 아홉 번째 칸을 늘려도 배경을 다시 그릴 필요가 없다.

   크기는 gridLayout.js 의 확정값을 쓴다. 폭은 실제로 재서(ref) 그 폭에
   비례해 뽑으므로 넓은 폰에서도 시안과 같은 모양이 된다.

   가방 카드는 '빈 틀' 원화(assets/camp/bag.webp, 1000×862)이고 안쪽 종이면
   (x 12.2~88.1% · y 22.5~84.8%, 실측)에 값을 앱이 그린다 — 값이 아이마다
   매일 바뀌므로 그림에 넣을 수 없다.

   props
     stations : [{key,img,name,badge,onPress}] — 배열 순서가 화면 순서
     level    : {emoji,level,name}
     nextLevel: {emoji,level,name} | null
     progress : {percent,currentXp,needXp,remainXp}
     coin, xp : 숫자
     labels   : {coin,xp,coinEmoji,xpEmoji} 스킨별 표기
     onOpenLevel : 가방을 누르면 열리는 레벨 상세 시트 (LevelSheet)
   ════════════════════════════════════════════════════════════════════════ */
export default function CharacterGrid({
  stations = [],
  level = { emoji: "🌱", level: 1, name: "새싹 탐험가" }, nextLevel = null,
  progress = { percent: 0, currentXp: 0, needXp: 0, remainXp: 0 },
  coin = 0, xp = 0,
  labels = { coin: "코인", xp: "XP", coinEmoji: "💎", xpEmoji: "⭐" },
  onOpenLevel,
}) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(0);

  /* 탭 안쪽 폭을 재서 거기에 맞춰 크기를 뽑는다 (폰 폭이 달라도 같은 비율) */
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => setW(el.clientWidth);
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const S = gridSizes(w || 360);
  const pct = Math.max(0, Math.min(100, progress.percent || 0));
  const barH = Math.max(9, Math.round(S.cardH * 0.045));

  /* 코인·XP 줄은 자릿수에 따라 글자를 줄인다. 레벨이 오르면 여섯 자리가 되는데
     (예: 💎 168,000 | ⭐ 900,000) 고정 크기로 두면 양쪽이 "168,…" 처럼 잘린다.
     칸 폭을 재서 맞추는 대신 자릿수로 정한다 — 숫자 폭은 글꼴에서 일정하다. */
  const moneyLen = `${coin.toLocaleString()}${xp.toLocaleString()}`.length;
  const moneyF = Math.round(S.labelF * (moneyLen >= 12 ? 0.72 : moneyLen >= 9 ? 0.84 : 0.98));

  return (
    <div ref={wrapRef} style={{ width: "100%", background: PAPER }}>

      {/* ── 가방 카드 ── 빈 틀 원화 위에 값만 얹는다. 누르면 레벨 상세 시트가 열린다.
          (카드가 커서 아이콘과 같은 0.9 배로 줄이면 화면이 출렁여 보이므로 살짝만 눌린다) ── */}
      <button type="button" onClick={onOpenLevel} className="card-tap"
        aria-label={`내 레벨 Lv.${level.level} ${level.name} 자세히 보기`}
        style={{ display: "block", width: S.cardW, height: S.cardH,
          margin: `${S.cardTop}px auto ${S.cardBottom}px`, position: "relative",
          border: "none", background: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}>
        <img src="assets/camp/bag.webp" alt="" draggable={false}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />

        <div style={{ position: "absolute",
          left: `${CARD_PANEL.l}%`, right: `${100 - CARD_PANEL.r}%`,
          top: `${CARD_PANEL.t}%`, bottom: `${100 - CARD_PANEL.b}%`,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: Math.round(S.cardH * 0.028), pointerEvents: "none" }}>

          {/* 레벨 — 가방 안에서 가장 큰 글자.
              등급 이름이 길면(예: "전설의 대탐험가") 한 줄에 안 들어가므로 두 줄까지 허용한다.
              nowrap + ellipsis 로 두면 이름이 통째로 잘려 무슨 등급인지 알 수 없다. */}
          <p style={{ margin: 0, fontSize: Math.round(S.labelF * 1.12), fontWeight: 900, color: INK,
            lineHeight: 1.18, textAlign: "center", wordBreak: "keep-all", maxWidth: "100%",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {level.emoji} Lv.{level.level} {level.name}
          </p>

          {/* 다음 등급까지 — 다음 레벨이 없으면 최고 레벨 문구 */}
          <p style={{ margin: 0, fontSize: Math.round(S.labelF * 0.8), fontWeight: 800, color: INK_SUB,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
            {nextLevel ? `다음 등급까지 ${Math.max(0, 100 - pct)}%` : "🏆 최고 레벨 달성!"}
          </p>

          {/* 진행 막대 — 왼쪽 발자국에서 오른쪽 깃발까지 (시안대로) */}
          <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: Math.round(barH * 1.25), lineHeight: 1, flexShrink: 0 }}>👣</span>
            <div style={{ flex: 1, height: barH, borderRadius: barH / 2, background: BAR_TRACK, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: barH / 2,
                background: BAR_FILL, transition: "width .5s ease" }} />
            </div>
            <span style={{ fontSize: Math.round(barH * 1.25), lineHeight: 1, flexShrink: 0 }}>🚩</span>
          </div>

          {/* 보유 코인 · 누적 XP — 자릿수가 늘면 한 줄에 안 들어가므로 폭을 반씩 나눠 갖는다
              (한 덩어리로 두면 XP 쪽만 잘려 "90,0…" 처럼 보인다) */}
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            gap: 5, fontSize: moneyF, fontWeight: 900, color: INK }}>
            <span style={{ flex: "0 1 auto", minWidth: 0, whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis" }}>
              {labels.coinEmoji} {coin.toLocaleString()}
            </span>
            <span style={{ color: INK_SUB, fontWeight: 700, flexShrink: 0 }}>|</span>
            <span style={{ flex: "0 1 auto", minWidth: 0, whiteSpace: "nowrap",
              overflow: "hidden", textOverflow: "ellipsis" }}>
              {labels.xpEmoji} {xp.toLocaleString()}
            </span>
          </div>
        </div>
      </button>

      {/* ── 아이콘 격자 (2열) ── 정사각 칸에 contain 이라 원화 비율이 달라도 무게가 맞는다 */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(2, ${S.cellW}px)`,
        justifyContent: "space-between", rowGap: S.rowGap, columnGap: S.colGap, paddingBottom: 6 }}>
        {stations.map(st => (
          <button key={st.key} type="button" onClick={st.onPress} className="icon-tap"
            aria-label={`${st.name} 열기`}
            style={{ width: S.cellW, border: "none", background: "none", padding: 0, cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center",
              fontFamily: "inherit" }}>
            <img src={`assets/camp/${st.img}`} alt="" draggable={false}
              style={{ width: S.iconW, height: S.iconH, display: "block",
                objectFit: "contain", objectPosition: "center bottom" }} />
            <span style={{ marginTop: S.labelGap, fontSize: S.labelF, fontWeight: 900, color: INK,
              letterSpacing: -0.2, whiteSpace: "nowrap" }}>{st.name}</span>
            {st.badge && (
              <span style={{ marginTop: 2, fontSize: Math.round(S.labelF * 0.72), fontWeight: 800,
                color: INK_SUB, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                maxWidth: "100%" }}>{st.badge}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

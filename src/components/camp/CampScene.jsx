import { useLayoutEffect, useRef, useState } from "react";
import {
  CAMP, TENT_PANEL, TENT_FLAG, ROW_GAP, campSizes, fitFlag,
} from "./campLayout.js";

/* ════════════════════════════════════════════════════════════════════════
   CampScene — 캐릭터 탭 본문 (목록 → 캠프 장면)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정] 카드 목록으로 세로로 길게 늘어놓던 캐릭터 탭을,
   텐트 하나와 그루터기 여덟 개가 놓인 캠프 그림으로 바꿨다.

   여기는 '그리기'만 한다 — 데이터도 동작도 전부 App에 있고,
   이 컴포넌트는 받은 값을 얹고 눌리면 받은 함수를 부를 뿐이다.
   그래서 저장 키·계산 로직은 하나도 건드리지 않는다.

   화면 구성
     텐트   : 꼭대기 깃발에 전시 중인 상장, 천막 면에 레벨·경험치바·코인/XP
     스테이션: 2×4 여덟 칸. 그림 위에 이름표(초록)·명패(베이지)를 겹쳐 얹고
              글자만 앱이 그린다. 판은 여덟 칸 공통 원화라 저절로 줄이 맞는다.

   크기는 campLayout.js 에 모아 둔 확정값을 쓴다 (시안과 같은 값).
   폭은 실제로 재서(ref) 그 폭에 비례해 뽑으므로 넓은 폰에서도 모양이 같다.

   props
     stations : [{key,img,name,badge,onPress}] 여덟 개 — 배열 순서가 화면 순서
     title    : {emoji,name}  전시 중인 상장 (깃발)
     level    : {emoji,level,name}
     nextLevel: {emoji,level,name} | null
     progress : {percent,currentXp,needXp,remainXp}
     coin, xp : 숫자
     labels   : {coin,xp,coinEmoji,xpEmoji} 스킨별 표기
   ════════════════════════════════════════════════════════════════════════ */
export default function CampScene({
  stations = [], title = { emoji: "🎗️", name: "꼬마 탐험가" },
  level = { emoji: "🌱", level: 1, name: "새싹 탐험가" }, nextLevel = null,
  progress = { percent: 0, currentXp: 0, needXp: 0, remainXp: 0 },
  coin = 0, xp = 0,
  labels = { coin: "코인", xp: "XP", coinEmoji: "💎", xpEmoji: "⭐" },
}) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(0);

  /* 탭 안쪽 폭을 재서 거기에 맞춰 크기를 뽑는다.
     폰 폭이 달라도 시안(안쪽 360px)과 같은 비율이 되도록. */
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

  const S = campSizes(w || 360);
  const flag = fitFlag(title.name || "", S.flagIW, S.flagIH);
  const panelGap = S.panelH > 145 ? 7 : 5;
  const statF = Math.round(S.nameF * 0.95);          // 천막 면 큰 글자
  const subF  = Math.round(S.badgeF * 10) / 10;      // 천막 면 작은 글자

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%",
      borderRadius: 20, overflow: "hidden", marginBottom: 14,
      background: CAMP.grass, minHeight: 320 }}>

      {/* 배경 — 세로로 긴 원화 한 장. cover라 폭에 맞추고 아래가 조금 잘린다 */}
      <img src="assets/camp/bg.webp" alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center top", pointerEvents: "none", zIndex: 0 }} />

      {/* 앞쪽은 한 겹으로 묶어 배경 위에 올린다. 배경 <img>가 position:absolute라
          묶지 않으면 위치를 안 준 요소가 배경 아래로 깔려 안 보인다.
          위 여백은 margin이 아니라 padding으로 준다 — margin은 이 겹 밖으로
          빠져나가(마진 상쇄) 장면 전체를 내려앉게 한다. */}
      <div style={{ position: "relative", zIndex: 1, paddingTop: 14, paddingBottom: 18 }}>

        {/* ── 텐트 ── */}
        <div style={{ position: "relative", width: S.tentW, height: S.tentH, margin: "0 auto" }}>
          <img src="assets/camp/tent.webp" alt="" draggable={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />

          {/* 꼭대기 깃발 — 전시 중인 상장 (이모지 크게, 이름 작게) */}
          <div style={{ position: "absolute",
            left: `${TENT_FLAG.l}%`, width: `${TENT_FLAG.r - TENT_FLAG.l}%`,
            top: `${TENT_FLAG.t}%`,  height: `${TENT_FLAG.b - TENT_FLAG.t}%`,
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", lineHeight: 1, pointerEvents: "none" }}>
            <span style={{ fontSize: flag.em, lineHeight: 1 }}>{title.emoji}</span>
            <span style={{ marginTop: 1, fontSize: flag.f, fontWeight: 900, color: CAMP.ink,
              letterSpacing: -0.3, lineHeight: 1.06, textAlign: "center", whiteSpace: "pre" }}>
              {flag.lines.join("\n")}
            </span>
          </div>

          {/* 천막 면 — 레벨 · 경험치바 · 코인/XP */}
          <div style={{ position: "absolute",
            left: `${TENT_PANEL.l + S.panelPadPct}%`, right: `${100 - TENT_PANEL.r + S.panelPadPct}%`,
            top: `${TENT_PANEL.t}%`, bottom: `${100 - TENT_PANEL.b}%`,
            display: "flex", flexDirection: "column", justifyContent: "center", gap: panelGap }}>
            <p style={{ margin: 0, fontSize: statF, fontWeight: 900, color: CAMP.ink,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {level.emoji} Lv.{level.level} {level.name}
            </p>
            <div style={{ height: 11, borderRadius: 6, background: "rgba(74,52,24,0.16)", overflow: "hidden" }}>
              <div style={{ width: `${Math.max(0, Math.min(100, progress.percent))}%`, height: "100%",
                borderRadius: 6, background: CAMP.bar, transition: "width .5s ease" }} />
            </div>
            <p style={{ margin: 0, fontSize: subF, fontWeight: 700, color: CAMP.inkSub, lineHeight: 1.35 }}>
              {nextLevel
                ? `다음 레벨 ${nextLevel.emoji} Lv.${nextLevel.level} ${nextLevel.name} · ${progress.currentXp}/${progress.needXp} · ${progress.remainXp} 남음`
                : "🏆 최고 레벨 달성!"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 1 }}>
              {[[`${labels.coinEmoji} 보유 ${labels.coin}`, coin], [`${labels.xpEmoji} 누적 ${labels.xp}`, xp]].map(([t, v]) => (
                <div key={t} style={{ background: "rgba(255,255,255,0.72)", border: `1.5px solid ${CAMP.panelB}`,
                  borderRadius: 11, padding: "5px 8px", minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 800, color: CAMP.inkSub,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t}</p>
                  <p style={{ margin: 0, fontSize: statF, fontWeight: 900, color: CAMP.ink,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 스테이션 여덟 칸 (2×4) ── */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(2, ${S.stW}px)`,
          justifyContent: "center", gap: `${ROW_GAP}px ${S.gap}px`, marginTop: 18 }}>
          {stations.map(st => (
            <button key={st.key} onClick={st.onPress} className="jelly-tap"
              aria-label={`${st.name} 열기`}
              style={{ width: S.stW, border: "none", background: "none", padding: 0,
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* ① 아이콘 — 그루터기+물건. contain + 아래 정렬이라 늘어나지 않고
                     여덟 칸의 밑동 선이 맞는다 */}
              <img src={`assets/camp/${st.img}`} alt="" draggable={false}
                style={{ width: S.iconW, height: S.artH, display: "block",
                  objectFit: "contain", objectPosition: "center bottom" }} />
              {/* ② 초록 이름표 — 판은 여덟 칸 공통 원화, 글자만 얹는다 */}
              <div style={{ width: S.nameW, height: S.nameH, position: "relative", zIndex: 2,
                marginTop: -S.nameH * 0.30 }}>
                <img src="assets/camp/plate-name.webp" alt="" draggable={false}
                  style={{ width: "100%", height: "100%", display: "block" }} />
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: S.nameF, fontWeight: 900, color: CAMP.labelInk,
                  letterSpacing: -0.2, textShadow: "0 1px 2px rgba(60,44,14,0.45)", whiteSpace: "nowrap" }}>
                  {st.name}
                </span>
              </div>
              {/* ③ 베이지 명패 — 이것도 여덟 칸 공통 원화 */}
              <div style={{ width: S.badgeW, height: S.badgeH, position: "relative", zIndex: 3,
                marginTop: -S.badgeH * 0.34 }}>
                <img src="assets/camp/plate-badge.webp" alt="" draggable={false}
                  style={{ width: "100%", height: "100%", display: "block" }} />
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: S.badgeF, fontWeight: 800, color: CAMP.ink,
                  letterSpacing: -0.2, whiteSpace: "nowrap" }}>
                  {st.badge}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

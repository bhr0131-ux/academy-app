/* ════════════════════════════════════════════════════════════════════════
   AdventureMap — 모험 모드 '오늘의 모험 지도' (그림책 초원 맵)
   ────────────────────────────────────────────────────────────────────────
   · 배경(adventure-map.webp)은 완성 원화 그대로 사용 — 절대 가공하지 않는다.
     배경 속 상단 집 = 우리집(출발지), 하단 보물상자 = 오늘의 도착지.
   · 학원은 사용자 제공 건물 PNG(webp 변환본)를 길 위에 Overlay만 한다.
   · 캐릭터는 길 폴리라인 위에서만 이동:
       우리집 → (완료할 때마다) 다음 학원 → 모두 완료 시 보물상자.
   · 완료한 학원 건물은 반짝이고, 전부 완료하면 보물상자에서 축하 효과.
   · 원본 원화는 art-src/ (adventure-map-src.png, map-bld-*.png) 보관.

   props
     items    : [{id,name,time,icon,done,total}]  오늘 가는 학원들 (App이 계산)
     mode     : "today" | "past" | "future"       past=모두 통과, future=출발 전
     charEmoji: string                            캐릭터 (이미지 경로 또는 이모지)
   ════════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";

// 지도 2종: 학원 0~2곳=짧은 정사각 지도 / 3곳 이상=긴 세로 지도 (사용자 확정 — 개수에 따라 자동 전환)
// 학원 건물 아이콘 4종 (정글 세트) — 배치 순서대로 순환 사용 (원화 무수정, 위치·크기만 조정)
// cx/cy/d: 원화에 뚫린 '이모지 동그라미 구멍'의 중심·지름 (이미지 % — 투명 블롭 스캔으로 실측).
// 이모지는 구멍 '뒤'에 크림 원판과 함께 깔려, 원화의 테두리가 이모지를 자연스럽게 감싼다.
// k: 폭 보정 계수 — 원화 가로세로비가 달라도 표시 '높이'가 4종 동일해지도록 (질감 통일)
const BUILDINGS = [
  { src: "assets/map-bld-junglehut.webp",   cx: 48.4, cy: 53.6, d: 39.1, k: 0.92 },
  { src: "assets/map-bld-tileroof.webp",    cx: 36.7, cy: 54.3, d: 37.5, k: 0.98 },
  { src: "assets/map-bld-greenroof.webp",   cx: 42.3, cy: 52.5, d: 39.6, k: 0.99 },
  { src: "assets/map-bld-artisthouse.webp", cx: 35.5, cy: 52.5, d: 37.9, k: 1.0 },
];

// 폴리라인 누적 길이 → t(0~1)로 좌표 보간하는 함수 생성 (지도별로 각각)
const mkPointAt = (PATH, ASPECT) => {
  const l = [0];
  for (let i = 1; i < PATH.length; i++) {
    const dx = PATH[i][0] - PATH[i - 1][0];
    const dy = (PATH[i][1] - PATH[i - 1][1]) * ASPECT;
    l.push(l[i - 1] + Math.hypot(dx, dy));
  }
  const TOTAL = l[l.length - 1];
  return (t) => {
    const d = Math.max(0, Math.min(1, t)) * TOTAL;
    for (let i = 1; i < PATH.length; i++) {
      if (d <= l[i]) {
        const r = (d - l[i - 1]) / (l[i] - l[i - 1] || 1);
        return [
          PATH[i - 1][0] + (PATH[i][0] - PATH[i - 1][0]) * r,
          PATH[i - 1][1] + (PATH[i][1] - PATH[i - 1][1]) * r,
        ];
      }
    }
    return PATH[PATH.length - 1];
  };
};

// 긴 지도 (854×1842, 양피지 보물지도) — 길 중심선 % 좌표: 오두막 계단 → 해변 보물상자 앞
const MAP_LONG = {
  bg: "assets/adventure-map.webp",
  ar: "854 / 1842",
  chest: [50, 89],
  yr: 1842 / 854,
  bw: 26, fs: 24,   // 건물 표시 폭(%)·이모지 크기 (사용자 조정: 소폭 축소)
  // 학원 건물 고정 배치 좌표 (사용자 지정: 길 '옆' 잔디, 좌우 번갈아) — 방문 순서대로
  spots: {
    3: [[68,29],[71,45],[36,76]],
    4: [[68,29],[71,45],[20,63],[36,76]],
  },
  pointAt: mkPointAt([
    [47,17],[51,20],[56,23],[55,27],[48,31],[44,35],[47,39],[53,43],[55,47],
    [50,50.5],[45,53.5],[44,57],[41,61],[41,65],[45,69],[50,73],[52,77],
    [48,81],[45,85],
  ], 1842 / 854),
};
// 짧은 지도 v2 (972×1619, 3:5 양피지) — 학원 0~2곳용, 무대 배경과 비슷한 체감 높이
const MAP_SHORT = {
  bg: "assets/adventure-map-short.webp",
  ar: "972 / 1619",
  chest: [50, 85],
  yr: 1619 / 972,
  bw: 23, fs: 21,   // 짧은 지도는 건물을 한 단계 작게 (사용자 조정: 소폭 축소)
  // 사용자 지정 자리 ①②③ — 숫자는 '사용할 자리 개수' (1곳=①만, 2곳=①②, 3곳=①②③).
  // 학원 배정은 시간순으로 지도의 위→아래 (렌더 시 y로 정렬해서 배정).
  spots: {
    1: [[80,46]],                       // ① 우측 — 원숭이를 덮는 위치 (사용자 확정)
    2: [[80,46],[41,37]],               // +② 좌상
    3: [[80,46],[41,37],[17,79]],       // +③ 좌하 — 개구리를 덮는 위치 (사용자 확정)
  },
  pointAt: mkPointAt([
    [50,22],[54,25],[57,28],[55,32],[48,36],[44,40],[46,44],[52,48],[55,52],
    [51,56],[45,60],[42,64],[39,68],[38,72],[42,77],[47,81],
  ], 1619 / 972),
};

const toMin = (t = "") => { const [h, m] = String(t).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const isImg = (s) => typeof s === "string" && s.includes("assets/");

export default function AdventureMap({ items = [], mode = "today", charEmoji = "", fullBleed = false }) {
  const sorted = [...items].sort((a, b) => toMin(a.time) - toMin(b.time));
  const n = sorted.length;
  // 학원 0~3곳=짧은 지도 / 4곳 이상=긴 지도 (사용자 확정: 짧은 지도에 3곳 배치 지점 지정)
  const M = n <= 3 ? MAP_SHORT : MAP_LONG;
  const pointAt = M.pointAt, CHEST = M.chest;
  // 학원 건물: 지도별 고정 자리(길 옆 잔디)를 위→아래(y) 순으로 정렬해 시간순 학원에 배정 (사용자 확정)
  // 프리셋 밖 개수는 길 위 균등 분배 폴백
  const spots = M.spots[n]
    ? [...M.spots[n]].sort((a, b) => a[1] - b[1])
    : sorted.map((_, i) => pointAt((i + 1) / (n + 1)));
  // 각 건물에서 가장 가까운 길 지점 t를 구한 뒤 오름차순 정렬 — 캐릭터가 길을 앞으로만 이동하도록 보장
  const stopT = spots.map(([sx, sy]) => {
    let bt = 0, bd = Infinity;
    for (let s = 0; s <= 200; s++) {
      const tt = s / 200; const [px, py] = pointAt(tt);
      const dd = (px - sx) ** 2 + ((py - sy) * M.yr) ** 2;
      if (dd < bd) { bd = dd; bt = tt; }
    }
    return bt;
  }).sort((a, b) => a - b);
  const done = (a) => a.total > 0 ? a.done >= a.total : true; // 미션 없는 학원은 통과 취급
  // 순차 진행: 앞에서부터 연속으로 완료한 다음 목적지가 캐릭터의 현재 목표
  let k = 0; while (k < n && done(sorted[k])) k++;
  const allDone = n > 0 && k === n;
  const targetT = mode === "past" ? 1 : mode === "future" ? 0 : (allDone ? 1 : (k === 0 ? 0 : stopT[k]));

  // 캐릭터를 길을 따라 부드럽게 이동 (rAF 트윈 — 길 밖으로 나가지 않음)
  const [t, setT] = useState(mode === "past" ? 1 : 0);
  const cur = useRef(t);
  useEffect(() => {
    const from = cur.current, to = targetT;
    if (Math.abs(to - from) < 0.001) return;
    const dur = 900 + 2600 * Math.abs(to - from);
    let raf, st;
    const step = (ts) => {
      if (st === undefined) st = ts;
      const p = Math.min(1, (ts - st) / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOut
      cur.current = from + (to - from) * e;
      setT(cur.current);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [targetT]);

  const [cx, cy] = allDone && t >= 0.995 ? CHEST : pointAt(t); // 도착하면 상자 앞으로 착지
  const chestParty = mode === "past" || (mode === "today" && allDone && t >= 0.995);

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: M.ar, borderRadius: fullBleed ? 0 : 18, overflow: "hidden", boxShadow: fullBleed ? "none" : "inset 0 0 0 1px rgba(142,165,74,0.35)" }}>
      <style>{`
        @keyframes amBob{0%,100%{transform:translate(-50%,-86%) translateY(0)}50%{transform:translate(-50%,-86%) translateY(-4px)}}
        @keyframes amSpark{0%,100%{opacity:0;transform:scale(.5)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes amStar{0%{opacity:0;transform:translateY(4px) scale(.5)}40%{opacity:1;transform:translateY(-6px) scale(1.15)}100%{opacity:0;transform:translateY(-14px) scale(.8)}}
        @keyframes amGlow{0%,100%{opacity:.25}50%{opacity:.6}}
      `}</style>
      <img src={M.bg} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

      {/* ── 학원 건물 Overlay (배경 무수정 — 길 옆 잔디 고정 좌표, 비슷한 크기) ── */}
      {sorted.map((ac, i) => {
        const [x, y] = spots[i];
        const d = done(ac);
        const B = BUILDINGS[i % BUILDINGS.length];
        return (
          <div key={ac.id} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-78%)", width: `${M.bw * (B.k || 1)}%`, textAlign: "center", pointerEvents: "none" }}>
            <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
              {d && <>
                <span style={{ position: "absolute", top: "-6%", left: "-8%", fontSize: 14, animation: "amSpark 2.8s ease-in-out infinite", zIndex: 2 }}>✨</span>
                <span style={{ position: "absolute", top: "10%", right: "-9%", fontSize: 11, animation: "amSpark 2.8s ease-in-out infinite -1.2s", zIndex: 2 }}>✨</span>
              </>}
              {/* 구멍 뒤 크림 원판 + 학원 이모지 — 아이 학원카드와 같은 이모지를 항상 유지 (완료 표시는 이름표 ✅) */}
              <span style={{ position: "absolute", left: `${B.cx}%`, top: `${B.cy}%`, width: `${B.d + 5}%`, aspectRatio: "1/1", transform: "translate(-50%,-50%)", borderRadius: "50%", background: "#FFF9EC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: M.fs, lineHeight: 1, zIndex: 0 }}>
                {ac.icon}
              </span>
              <img src={B.src} alt="" draggable={false}
                style={{ position: "relative", zIndex: 1, width: "100%", height: "auto", display: "block", filter: d ? "drop-shadow(0 0 2px rgba(255,249,236,0.9)) drop-shadow(0 0 8px rgba(255,224,130,0.85)) drop-shadow(0 5px 6px rgba(60,80,40,0.42))" : "drop-shadow(0 0 2px rgba(255,249,236,0.9)) drop-shadow(0 0 1px rgba(255,249,236,0.8)) drop-shadow(0 5px 6px rgba(60,80,40,0.42))" }} />
            </div>
            {/* 이름표 — 이름 + 시각 (완료 시 ✅ 표시. 아이콘은 건물 동그라미가 담당) */}
            <div style={{ display: "inline-block", marginTop: 2, background: "rgba(255,251,240,0.92)", border: "1px solid rgba(155,114,74,0.35)", borderRadius: 9, padding: "2px 7px", fontSize: 10, fontWeight: 900, color: "#5D4633", whiteSpace: "nowrap", boxShadow: "0 2px 5px rgba(60,80,40,0.18)", maxWidth: "160%", overflow: "hidden", textOverflow: "ellipsis" }}>
              {d ? "✅ " : ""}{ac.name}{ac.time ? ` · ${ac.time}` : ""}
            </div>
          </div>
        );
      })}

      {/* ── 보물상자 축하 효과 (모두 완료 시 — 배경 속 상자 위에 겹치기만) ── */}
      {chestParty && (
        <div style={{ position: "absolute", left: `${CHEST[0]}%`, top: `${CHEST[1]}%`, transform: "translate(-50%,-50%)", width: "26%", aspectRatio: "1/0.8", pointerEvents: "none" }}>
          <div style={{ position: "absolute", inset: "-12%", borderRadius: "50%", background: "radial-gradient(ellipse at 50% 55%, rgba(255,224,130,0.55), transparent 70%)", animation: "amGlow 2.2s ease-in-out infinite" }} />
          {[["⭐", "6%", "-4%", 0], ["✨", "70%", "-10%", 0.5], ["🌟", "40%", "-22%", 1.0], ["✨", "-6%", "30%", 1.5], ["⭐", "86%", "36%", 2.0]].map(([e, l, tp, dl], i) => (
            <span key={i} style={{ position: "absolute", left: l, top: tp, fontSize: 15, animation: `amStar 2.4s ease-in-out ${dl}s infinite` }}>{e}</span>
          ))}
        </div>
      )}

      {/* ── 캐릭터 — 항상 길 위 (폴리라인 보간 위치) ── */}
      <div style={{ position: "absolute", left: `${cx}%`, top: `${cy}%`, transform: "translate(-50%,-86%)", animation: "amBob 2.4s ease-in-out infinite", pointerEvents: "none", zIndex: 3 }}>
        {isImg(charEmoji)
          ? <img src={charEmoji} alt="" draggable={false} style={{ height: 46, width: "auto", display: "block", filter: "drop-shadow(0 0 2px rgba(255,251,240,0.9)) drop-shadow(0 4px 5px rgba(60,80,40,0.35))" }} />
          : <span style={{ fontSize: 32, lineHeight: 1, display: "block", filter: "drop-shadow(0 0 2px rgba(255,251,240,0.9)) drop-shadow(0 4px 5px rgba(60,80,40,0.35))" }}>{charEmoji || "🦸"}</span>}
        <div style={{ width: 26, height: 7, borderRadius: "50%", background: "rgba(60,80,40,0.3)", filter: "blur(2.5px)", margin: "-3px auto 0" }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   AdventureMap — 모험 모드 '오늘의 모험 지도' (그림책 초원 맵)
   ────────────────────────────────────────────────────────────────────────
   · 배경(adventure-map.webp)은 완성 원화 그대로 사용 — 절대 가공하지 않는다.
     배경 속 상단 집 = 우리집(출발지), 하단 보물상자 = 오늘의 도착지.
   · 학원은 사용자 제공 건물 PNG(webp 변환본)를 길 위에 Overlay만 한다.
   · 캐릭터는 길 폴리라인 위에서만, "시간 기준"으로 이동 (사용자 확정 B안):
       수업 시작 30분 전 출발 → 수업 중엔 그 학원 앞 → 마지막 수업 종료 후 보물상자.
       (건물의 ✅·반짝임은 미션 완료 기준 유지)
   · 완료한 학원 건물은 반짝이고, 전부 완료하면 보물상자에서 축하 효과.
   · 원본 원화는 art-src/ (adventure-map-src.png, map-bld-*.png) 보관.

   props
     items    : [{id,name,time,icon,done,total}]  오늘 가는 학원들 (App이 계산)
     mode     : "today" | "past" | "future"       past=모두 통과, future=출발 전
     charEmoji: string                            캐릭터 (이미지 경로 또는 이모지)
   ════════════════════════════════════════════════════════════════════════ */
import { useEffect, useMemo, useRef, useState } from "react";

// 지도 2종 (v5 파스텔 원화 — 이미 저채도라 배경 보정 없이 원본 사용): 0~3곳=짧은 지도 / 4곳 이상=긴 지도
// 학원 건물 아이콘 4종 (정글 세트) — 배치 순서대로 순환 사용 (원화 무수정, 위치·크기만 조정)
// cx/cy/d: 원화에 뚫린 '이모지 동그라미 구멍'의 중심·지름 (이미지 % — 투명 블롭 스캔으로 실측).
// 이모지는 구멍 '뒤'에 크림 원판과 함께 깔려, 원화의 테두리가 이모지를 자연스럽게 감싼다.
// k: 폭 보정 계수 — 원화 가로세로비가 달라도 표시 '높이'가 4종 동일해지도록 (질감 통일)
// v6 정글 세트 (텐트·티키는 원화의 흰 원을 투명으로 뚫어 탑재 — 이모지가 뒤에서 비치도록)
const BUILDINGS = [
  { src: "assets/map-bld-treehouse.webp", cx: 58.7, cy: 49.3, d: 42.7, k: 0.88 },  // 나무 위의 집 (구멍 우측)
  { src: "assets/map-bld-stonearch.webp", cx: 48.3, cy: 50.6, d: 40.4, k: 0.93 },  // 돌 아치문
  { src: "assets/map-bld-tent.webp",      cx: 51.5, cy: 55.7, d: 39.0, k: 0.96 },  // 탐험가 텐트
  { src: "assets/map-bld-tikihut.webp",   cx: 49.5, cy: 54.4, d: 40.8, k: 0.92 },  // 티키 초가 오두막
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
  ar: "853 / 1844",
  chest: [51, 88],
  yr: 1844 / 853,
  bw: 26, fs: 24,   // 건물 표시 폭(%)·이모지 크기 (사용자 조정: 소폭 축소)
  fpk: 64,          // 발자국 개수 (경로 등간격)
  // 학원 건물 고정 배치 좌표 (사용자 지정: 길 '옆' 잔디, 좌우 번갈아) — 방문 순서대로
  spots: {
    3: [[68,29],[71,45],[36,76]],
    4: [[68,29],[71,45],[20,63],[36,76]],
  },
  // 원화 모래길 중심선 자동 추출(색 분류 스캔) 좌표 — 다리 구간은 목재라 수동 보간
  pointAt: mkPointAt([
    [52,16.5],[53.5,17.8],[57,18.9],[61,19.6],[65,20.4],[68,21.3],[69.5,22.3],[68.5,23.4],
    [66,24.5],[62,25.6],[57,26.6],[52,27.6],[47,28.6],[43,29.6],[41,30.7],[41.5,31.9],
    [44.5,32.9],[49,33.8],[54,34.8],[59,35.8],[62.5,36.9],[65,38.2],[66,39.2],[64,40.4],
    [60.5,41.6],[56.5,42.6],[53.5,43.6],[51,44.6],[50,45.7],[50.8,46.8],[53,47.8],[56.5,48.6],
    [60,49.5],[63,50.5],[64.8,51.7],[63.5,52.9],[61,54],[58,55],[56,55.9],[52,56.9],
    [47,58],[42,59],[38,60.1],[36.5,61.2],[35,62.4],[33.8,63.8],[33.3,65.2],[33.8,66.5],
    [35.8,67.6],[39,68.5],[43.5,69.4],[47,70.4],[50.5,71.5],[53.5,72.5],[55.5,73.6],[56.3,74.7],
    [55.5,75.8],[53.5,76.9],[51,77.8],[48,78.8],[45,79.8],[41.5,80.7],[38.5,81.7],[36.5,82.6],
    [35.5,83.5],[37.5,84.7],[41,85.7],[45,86.6],[48.5,87.4],
  ], 1844 / 853),
};
// 짧은 지도 v2 (972×1619, 3:5 양피지) — 학원 0~2곳용, 무대 배경과 비슷한 체감 높이
const MAP_SHORT = {
  bg: "assets/adventure-map-short.webp",
  ar: "952 / 1652",
  chest: [50, 82.5],
  yr: 1652 / 952,
  bw: 23, fs: 21,   // 짧은 지도는 건물을 한 단계 작게 (사용자 조정: 소폭 축소)
  fpk: 50,          // 발자국 개수 (경로 등간격)
  // 사용자 지정 자리 ①②③ — 숫자는 '사용할 자리 개수' (1곳=①만, 2곳=①②, 3곳=①②③).
  // 학원 배정은 시간순으로 지도의 위→아래 (렌더 시 y로 정렬해서 배정).
  // 자리 형식: [x, y, 라벨위치?, 건물번호?] — 라벨위치 "left"=이름표를 집 옆에(기본 집 위),
  // 건물번호는 BUILDINGS 인덱스 고정 지정(없으면 순환). ②는 3번(현 티키 초가 오두막) 고정 — 사용자 확정.
  spots: {
    1: [[80,50]],                                    // ① 우측 — 원숭이를 덮는 위치
    2: [[80,50],[37.7,35.7,null,3]],                 // +② 좌상 (라벨 집 위, 노란 건물)
    3: [[80,50],[37.7,35.7,null,3],[18.5,79,"bottom"]], // +③ 좌하 (라벨 집 아래)
  },
  // 원화 모래길 중심선 자동 추출(색 분류 스캔) 좌표 — 다리 구간은 목재라 수동 보간
  pointAt: mkPointAt([
    [50.5,22],[51,23.8],[52,25.5],[54,27],[57.5,28.3],[61.5,29.5],[65,30.8],[67.3,32],
    [66.8,33.5],[64.5,35],[61,36.4],[56.5,37.7],[51.5,39],[47,40.2],[43.5,41.3],[41.8,42.5],
    [42.8,43.7],[45.5,44.7],[49,45.6],[53,46.5],[57,47.4],[61,48.4],[64.3,49.5],[66,50.7],
    [65.8,52],[63.8,53.2],[61,54.3],[58.3,55.3],[56.2,56.4],[54.7,57.5],[53.8,58.7],[52.5,60],
    [50.5,61.5],[48,63],[45.5,64.6],[43.5,66.2],[41.8,67.8],[40,69.5],[38.5,71.2],[37.6,72.9],
    [37.5,74.6],[38.8,76.3],[41,77.9],[43.8,79.3],[46.3,80.5],[48,81.5],
  ], 1652 / 952),
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
  const done = (a) => a.total > 0 ? a.done >= a.total : true; // 건물 ✅·반짝임용 (미션 완료 기준)

  // ── 시간 기준 이동 (B안) ──────────────────────────────────
  // 수업 시작 30분 전에 출발해 시작 시각에 도착, 수업이 끝나면 다음 학원으로. 마지막 수업 종료 후 보물상자로.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (mode !== "today") return;
    const iv = setInterval(() => setTick(v => v + 1), 60000); // 1분마다 위치 갱신
    return () => clearInterval(iv);
  }, [mode]);
  const nowMin = (() => { const dt = new Date(); return dt.getHours() * 60 + dt.getMinutes(); })();
  const starts = sorted.map(a => toMin(a.time));
  const ends = sorted.map((a, i) => starts[i] + (a.duration || 40));
  const lastEnded = n > 0 && nowMin >= ends[n - 1];
  const TRAVEL = 30; // 다음 수업 시작 몇 분 전에 출발하는지
  let targetT;
  if (mode === "past") targetT = 1;
  else if (mode === "future" || n === 0) targetT = 0;
  else if (lastEnded) targetT = 1;
  else {
    let j = 0; while (j < n && nowMin >= ends[j]) j++;   // 아직 안 끝난 첫 수업 = 현재 목적지
    const from = j === 0 ? 0 : stopT[j - 1];
    const to = stopT[j];
    const t0 = starts[j] - TRAVEL, t1 = starts[j];
    targetT = nowMin <= t0 ? from : nowMin >= t1 ? to : from + (to - from) * ((nowMin - t0) / (t1 - t0));
  }

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

  const arrived = t >= 0.995 && (mode === "past" || lastEnded);
  const [cx, cy] = arrived ? CHEST : pointAt(t); // 도착하면 상자 앞으로 착지
  const chestParty = mode === "past" || (mode === "today" && arrived);

  // ── 지나온 길 발자국 ──────────────────────────────────────
  // 모래길 중심선(pointAt)을 등간격 샘플링해 발자국을 전부 깔아두고,
  // 캐릭터 진행률(t)까지만 보이게 한다 → 이동 트윈을 따라 톡톡 나타나는 연출.
  // 방향은 길의 접선에 맞춰 회전, 좌/우 발은 진행 방향의 수직으로 번갈아 오프셋.
  const prints = useMemo(() => {
    const K = M.fpk || 50, out = [];
    for (let i = 1; i < K; i++) {
      const tt = i / K;
      const [ax, ay] = M.pointAt(Math.min(1, tt + 0.012));
      const [bx, by] = M.pointAt(Math.max(0, tt - 0.012));
      const ang = Math.atan2((ay - by) * M.yr, ax - bx) * 180 / Math.PI;
      const side = i % 2 ? 1 : -1;                     // 왼발/오른발
      const rad = (ang + 90) * Math.PI / 180;
      const [px, py] = M.pointAt(tt);
      out.push({ t: tt, x: px + Math.cos(rad) * 0.9 * side, y: py + (Math.sin(rad) * 0.9 * side) / M.yr, ang });
    }
    return out;
  }, [M]);

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: M.ar, borderRadius: fullBleed ? 0 : 18, overflow: "hidden", boxShadow: fullBleed ? "none" : "inset 0 0 0 1px rgba(142,165,74,0.35)" }}>
      <style>{`
        @keyframes amBob{0%,100%{transform:translate(-50%,-86%) translateY(0)}50%{transform:translate(-50%,-86%) translateY(-4px)}}
        @keyframes amSpark{0%,100%{opacity:0;transform:scale(.5)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes amStar{0%{opacity:0;transform:translateY(4px) scale(.5)}40%{opacity:1;transform:translateY(-6px) scale(1.15)}100%{opacity:0;transform:translateY(-14px) scale(.8)}}
        @keyframes amGlow{0%,100%{opacity:.25}50%{opacity:.6}}
      `}</style>
      <img src={M.bg} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

      {/* ── 지나온 길 발자국 (은은한 황토색 실루엣 — 건물·캐릭터보다 낮은 우선순위) ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {prints.map((p, i) => (
          <div key={i} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            transform: `translate(-50%,-50%) rotate(${p.ang - 90}deg)`,
            opacity: p.t <= t ? 0.55 : 0, transition: "opacity .35s ease" }}>
            {/* 발바닥 실루엣: 패드 타원 + 발끝 점 (이모지 아님) */}
            <div style={{ width: 4.5, height: 7, borderRadius: "50%", background: "#9A6030" }} />
            <div style={{ width: 2.6, height: 2.6, borderRadius: "50%", background: "#9A6030", margin: "1px auto 0" }} />
          </div>
        ))}
      </div>

      {/* ── 학원 건물 Overlay (배경 무수정 — 길 옆 잔디 고정 좌표, 비슷한 크기) ── */}
      {sorted.map((ac, i) => {
        const [x, y, lp, bi] = spots[i];
        const d = done(ac);
        const B = BUILDINGS[(bi ?? i) % BUILDINGS.length];
        const chip = { background: "rgba(255,251,240,0.92)", border: "1px solid rgba(155,114,74,0.35)", borderRadius: 9, padding: "2px 7px", fontSize: 10, fontWeight: 900, color: "#5D4633", whiteSpace: "nowrap", boxShadow: "0 2px 5px rgba(60,80,40,0.18)" };
        return (
          <div key={ac.id} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-78%)", width: `${M.bw * (B.k || 1)}%`, textAlign: "center", pointerEvents: "none" }}>
            {/* 이름표 — 기본은 집 위, lp==="left"=집 왼쪽 옆, lp==="bottom"=집 아래 */}
            {!lp && (
            <div style={{ ...chip, display: "inline-block", marginBottom: -4, position: "relative", zIndex: 3, maxWidth: "160%", overflow: "hidden", textOverflow: "ellipsis" }}>
              {d ? "✅ " : ""}{ac.name}{ac.time ? ` · ${ac.time}` : ""}
            </div>
            )}
            {lp === "left" && (
            <div style={{ ...chip, position: "absolute", right: "74%", top: "15%", marginRight: 3, zIndex: 3 }}>
              {d ? "✅ " : ""}{ac.name}{ac.time ? ` · ${ac.time}` : ""}
            </div>
            )}
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
            {lp === "bottom" && (
            <div style={{ ...chip, display: "inline-block", marginTop: -11, position: "relative", zIndex: 3, maxWidth: "160%", overflow: "hidden", textOverflow: "ellipsis" }}>
              {d ? "✅ " : ""}{ac.name}{ac.time ? ` · ${ac.time}` : ""}
            </div>
            )}
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

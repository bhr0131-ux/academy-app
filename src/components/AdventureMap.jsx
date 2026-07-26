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
// v7 크리스프 카툰 세트 (흰 원을 투명으로 뚫어 탑재 — 이모지가 뒤에서 비치도록)
const BUILDINGS = [
  { src: "assets/map-bld-treehouse.webp", cx: 57.2, cy: 49.9, d: 43.2, k: 0.87 },  // 나무 위의 집 (구멍 우측)
  { src: "assets/map-bld-stonearch.webp", cx: 48.5, cy: 51.2, d: 39.2, k: 0.95 },  // 돌 아치문
  { src: "assets/map-bld-tent.webp",      cx: 51.3, cy: 56.1, d: 39.3, k: 0.95, es: 1.05 },  // 탐험가 텐트 (es: 이모지 5% 확대 — 책 글리프가 작아 보이는 착시 보정)
  { src: "assets/map-bld-tikihut.webp",   cx: 48.5, cy: 53.8, d: 40.6, k: 0.92 },  // 티키 초가 오두막
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
  chest: [52.5, 89],
  cdy: 5.5,         // 진행도 칩(🔒 n/N)을 상자 아래로 내리는 오프셋 (지도 높이 % — 상자 안 가리게)
  yr: 1844 / 853,
  bw: 26, fs: 24,   // 건물 표시 폭(%)·이모지 크기 (사용자 조정: 소폭 축소)
  fpk: 64,          // 발자국 개수 (경로 등간격)
  // 학원 건물 고정 배치 좌표 (길 '옆' 잔디) — v9 지형: ①앵무새 우상 ②원숭이 우측 ③투칸 좌측 ④멧돼지 우측
  spots: {
    3: [[80,30],[71,45],[20,63]],
    4: [[80,30],[71,45],[20,63],[80,67]],
  },
  // v9 수채화 원화 모래길 중심선 자동 추출(색 분류 스캔) 좌표 — 다리 구간은 목재라 수동 보간
  pointAt: mkPointAt([
    [52,19.8],[53.5,21],[54,22],[53,23],[52.9,24.1],[54,25],[56.5,25.8],[59,26.5],
    [61.5,27.2],[64.5,28],[66.8,28.8],[68.5,29.7],[68.6,30.8],[67.5,31.8],[65,32.7],[61,33.5],
    [57,34.2],[53,34.9],[49,35.7],[45.5,36.4],[42.5,37.1],[41,38],[41.3,39],[43,39.9],
    [45.5,40.7],[48.5,41.4],[51.5,42.1],[54.5,42.9],[57.5,43.7],[59.5,44.5],[60.8,45.4],[60.7,46.4],
    [59.8,47.4],[58,48.3],[56,49.2],[53.5,50.1],[51.5,51],[49.8,51.9],[48.5,52.9],[48.3,54],
    [49.5,54.9],[51.5,55.8],[53.5,56.6],[56,57.4],[58.5,58.3],[60.5,59.2],[61.8,60.1],[62,61.1],
    [61,62.1],[59,63],[56,64],[52.5,65],[49,66],[45.5,67],[42,68],[39.5,68.9],
    [38,69.9],[37,70.9],[35.8,71.9],[34.8,72.9],[34.4,74],[35.2,75],[36.8,76],[39,76.9],
    [41.5,77.8],[44,78.6],[46.5,79.4],[48.8,80.2],[50.5,81.1],[51.8,82.1],[52.3,83.2],[52.3,84.4],
    [52.2,85.6],
  ], 1844 / 853),
};
// 짧은 지도 v2 (972×1619, 3:5 양피지) — 학원 0~2곳용, 무대 배경과 비슷한 체감 높이
const MAP_SHORT = {
  bg: "assets/adventure-map-short.webp",
  ar: "952 / 1652",
  chest: [50, 86],
  cdy: 6.5,         // 진행도 칩(🔒 n/N)을 상자 아래로 내리는 오프셋 (지도 높이 % — 상자 안 가리게)
  yr: 1652 / 952,
  bw: 23, fs: 21,   // 짧은 지도는 건물을 한 단계 작게 (사용자 조정: 소폭 축소)
  fpk: 50,          // 발자국 개수 (경로 등간격)
  deco: [[61,90.5,"🐚",13,-15]], // 상자 아래 빈 공간 소품 딱 하나 (사용자 요청: 과하지 않게)
  // 사용자 지정 자리 ①②③ — 숫자는 '사용할 자리 개수' (1곳=①만, 2곳=①②, 3곳=①②③).
  // 학원 배정은 시간순으로 지도의 위→아래 (렌더 시 y로 정렬해서 배정).
  // 자리 형식: [x, y, 라벨위치?, 건물번호?, 라벨x보정px?] — 라벨위치 "left"=이름표를 집 옆에(기본 집 위),
  // 건물번호는 BUILDINGS 인덱스 고정 지정(없으면 순환). ②는 3번(티키 초가 오두막) 고정 — 사용자 확정.
  // 라벨은 건물과 가운데 정렬 (사용자 확정: v7 원화는 좌우 대칭이라 x보정 제거)
  spots: {
    1: [[80,50]],                                    // ① 우측 — 원숭이를 덮는 위치
    2: [[80,50],[37.7,35.7,null,3]],                 // +② 좌상 (라벨 집 위)
    3: [[80,50],[37.7,35.7,null,3],[19.5,79,"bottom"]], // +③ 좌하 (라벨 집 아래, 우측 1% 이동 — 사용자 조정)
  },
  // v8 수채화 원화 모래길 중심선 자동 추출(색 분류 스캔) 좌표 — 다리 구간은 목재라 수동 보간
  pointAt: mkPointAt([
    [54.5,21.5],[54.5,23],[53.5,24.5],[52.8,26],[53,27.3],[54.5,28.5],[57,29.4],[59.5,30.2],
    [62,31],[64.5,31.9],[66.5,32.8],[67.8,33.8],[67.5,35],[66,36.1],[63.5,37],[60,37.8],
    [56.5,38.5],[53,39.2],[49.5,39.9],[46.5,40.5],[43.8,41.2],[41.8,42],[40.3,42.9],[39.2,43.8],
    [39.5,44.8],[40.5,45.7],[42.5,46.5],[45.5,47.2],[48.5,47.9],[51.5,48.6],[54.5,49.3],[57.5,50],
    [60.5,50.7],[62.7,51.5],[64.5,52.3],[65.4,53.2],[64.8,54.3],[63.5,55.2],[61.5,56.1],[59,57],
    [56.5,57.9],[54.5,58.8],[52.8,59.7],[52,60.7],[52.8,61.8],[53.5,62.6],[52.5,63.8],[50.5,65],
    [48,66.2],[45.5,67.4],[43,68.5],[41,69.6],[40.5,70.7],[40,71.7],[39,72.7],[38,73.7],
    [37.4,74.7],[37.5,75.8],[38.2,76.8],[39.5,77.7],[41.5,78.6],[43.8,79.4],[46,80.2],[48,81],
    [49,82],
  ], 1652 / 952),
};

// 모험일지 '탐험장소' 선택 줄이 지도와 같은 건물 배정을 쓰도록 하는 헬퍼:
// 시간순 i번째 학원 → 지도 자리(위→아래) i번째의 건물 (자리 고정 건물번호 bi 우선, 없으면 순환)
export const journalBuildings = (n) => {
  const M = n <= 3 ? MAP_SHORT : MAP_LONG;
  const sp = M.spots[n] ? [...M.spots[n]].sort((a, b) => a[1] - b[1]) : Array.from({ length: n }, () => []);
  return sp.map((s, i) => BUILDINGS[(s[3] ?? i) % BUILDINGS.length]);
};

const toMin = (t = "") => { const [h, m] = String(t).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const isImg = (s) => typeof s === "string" && s.includes("assets/");

// onPick: 학원 건물 탭 → 모험일지에 해당 학원 표시 (App이 setJournalAcId 전달)
export default function AdventureMap({ items = [], mode = "today", charEmoji = "", fullBleed = false, onPick }) {
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

  // 건물 ✅·반짝임 판정: 미션이 있으면 전부 완료 기준, 없으면 수업 종료 시각 기준
  const passedByTime = (i) => mode === "past" || (mode === "today" && nowMin >= ends[i]);
  const done = (a, i) => a.total > 0 ? a.done >= a.total : passedByTime(i);
  // 보물상자 칩(🔒 n/N): '학원에 갔는지' 기준 (사용자 확정) — 수업 시작 시각에 도착하면 +1
  const doneCount = mode === "past" ? n : mode === "today" ? starts.filter(s => nowMin >= s).length : 0;
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

      {/* ── 길 발자국 — 지나온 길만 진한 갈색으로 표시, 남은 길은 숨김 (사용자 확정: 2단계 톤 철회) ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {prints.map((p, i) => (
          <div key={i} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            transform: `translate(-50%,-50%) rotate(${p.ang + 90}deg)`, // +90: 발끝 점이 진행 방향을 향하도록 (사용자 수정: 기존 -90은 반대)
            opacity: p.t <= t ? 0.62 : 0, transition: "opacity .35s ease" }}>
            <div style={{ width: 4.5, height: 7, borderRadius: "50%", background: "#7E4E20" }} />
            <div style={{ width: 2.6, height: 2.6, borderRadius: "50%", background: "#7E4E20", margin: "1px auto 0" }} />
          </div>
        ))}
      </div>

      {/* ── 지도 소품 (deco: [x,y,이모지,크기,회전]) ── */}
      {(M.deco || []).map(([ex, ey, em, efs, erot], i) => (
        <span key={i} style={{ position: "absolute", left: `${ex}%`, top: `${ey}%`,
          transform: `translate(-50%,-50%) rotate(${erot || 0}deg)`, fontSize: efs || 13,
          opacity: 0.95, pointerEvents: "none", filter: "drop-shadow(0 1px 2px rgba(93,70,51,0.3))" }}>{em}</span>
      ))}

      {/* ── 학원 건물 Overlay (배경 무수정 — 길 옆 잔디 고정 좌표, 비슷한 크기) ── */}
      {sorted.map((ac, i) => {
        const [x, y, lp, bi, ldx] = spots[i];
        const d = done(ac, i);
        const B = BUILDINGS[(bi ?? i) % BUILDINGS.length];
        const chip = { background: "rgba(255,251,240,0.92)", border: "1px solid rgba(155,114,74,0.35)", borderRadius: 9, padding: "2px 8px", fontSize: 10, fontWeight: 900, color: "#5D4633", whiteSpace: "nowrap", boxShadow: "0 2px 5px rgba(60,80,40,0.18)" };
        // 이름표 2줄 통일 (사용자 확정): 1줄 학원명 / 2줄 🕘 시간 — 엄마는 시간부터 보므로 시간을 진하게
        const label = (<>
          <span style={{ fontWeight: 700 }}>{d ? "✅ " : ""}{ac.name}</span>
          {ac.time ? <div style={{ fontSize: 10.5, marginTop: 1, color: "#3F2E1E" }}>🕘 {ac.time}</div> : null}
        </>);
        return (
          <div key={ac.id} onClick={onPick ? () => onPick(ac.id) : undefined}
            style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-78%)", width: `${M.bw * (B.k || 1)}%`, textAlign: "center", pointerEvents: onPick ? "auto" : "none", cursor: onPick ? "pointer" : undefined }}>
            {/* 이름표 — 기본은 집 위(+9px 여유: 길에 안 걸치게), lp==="left"=집 왼쪽 옆, lp==="bottom"=집 아래. ldx=x미세보정 */}
            {!lp && (
            <div style={{ ...chip, display: "inline-block", marginBottom: -3, position: "relative", left: ldx || 0, zIndex: 3, maxWidth: "160%", overflow: "hidden", textOverflow: "ellipsis" }}>
              {label}
            </div>
            )}
            {lp === "left" && (
            <div style={{ ...chip, position: "absolute", right: "74%", top: "15%", marginRight: 3, zIndex: 3 }}>
              {label}
            </div>
            )}
            <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
              {d && <>
                <span style={{ position: "absolute", top: "-6%", left: "-8%", fontSize: 14, animation: "amSpark 2.8s ease-in-out infinite", zIndex: 2 }}>✨</span>
                <span style={{ position: "absolute", top: "10%", right: "-9%", fontSize: 11, animation: "amSpark 2.8s ease-in-out infinite -1.2s", zIndex: 2 }}>✨</span>
              </>}
              {/* 구멍 뒤 크림 원판 + 학원 이모지 — 아이 학원카드와 같은 이모지를 항상 유지 (완료 표시는 이름표 ✅) */}
              <span style={{ position: "absolute", left: `${B.cx}%`, top: `${B.cy}%`, width: `${B.d + 5}%`, aspectRatio: "1/1", transform: "translate(-50%,-50%)", borderRadius: "50%", background: "#FFF9EC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(M.fs * (B.es || 1)), lineHeight: 1, zIndex: 0 }}>
                {ac.icon}
              </span>
              <img src={B.src} alt="" draggable={false}
                style={{ position: "relative", zIndex: 1, width: "100%", height: "auto", display: "block", filter: d ? "drop-shadow(0 0 2px rgba(255,249,236,0.9)) drop-shadow(0 0 8px rgba(255,224,130,0.85)) drop-shadow(0 5px 6px rgba(60,80,40,0.42))" : "drop-shadow(0 0 2px rgba(255,249,236,0.9)) drop-shadow(0 0 1px rgba(255,249,236,0.8)) drop-shadow(0 5px 6px rgba(60,80,40,0.42))" }} />
            </div>
            {lp === "bottom" && (
            <div style={{ ...chip, display: "inline-block", marginTop: -3, position: "relative", left: ldx || 0, zIndex: 3, maxWidth: "160%", overflow: "hidden", textOverflow: "ellipsis" }}>
              {label}
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

      {/* ── 보물상자 진행도 칩 — 🔒 n/N, 전부 완료하면 🔓. 상자 '아래' 배치 (사용자 확정) ── */}
      {n > 0 && mode !== "future" && (
        <div style={{ position: "absolute", left: `${CHEST[0]}%`, top: `${CHEST[1] + (M.cdy || 8)}%`, transform: "translate(-50%,-50%)", zIndex: 2, pointerEvents: "none",
          background: "rgba(255,251,240,0.94)", border: `1px solid ${doneCount >= n ? "rgba(212,160,60,0.75)" : "rgba(155,114,74,0.4)"}`, borderRadius: 999,
          padding: "2px 8px", fontSize: 10.5, fontWeight: 900, color: "#5D4633", whiteSpace: "nowrap", boxShadow: "0 2px 5px rgba(60,80,40,0.2)" }}>
          {doneCount >= n ? "🔓" : "🔒"} {doneCount}/{n}
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

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

const BG = "assets/adventure-map.webp";           // 860×1290 (원화 1024×1536 비율 유지)
// 학원 건물 아이콘 5종 — 배치 순서대로 순환 사용 (원화 무수정, 위치·크기만 조정)
const BUILDINGS = [
  "assets/map-bld-roundhouse.webp",
  "assets/map-bld-windmill.webp",
  "assets/map-bld-yellowhouse.webp",
  "assets/map-bld-stonehut.webp",
  "assets/map-bld-tent.webp",
];

// 배경 원화의 길(흙길) 중심선 폴리라인 — 이미지 기준 % 좌표 (x, y). 집 계단 → 보물상자 앞.
const PATH = [
  [45,25],[56,22.5],[66,25],[73,29],[75,34],[69,39],[57,42],[42,45.5],[30,48.5],
  [25,52],[26,55.5],[33,58.5],[46,60.5],[60,62],[71,64.5],[78,67.5],[75,71.5],
  [66,75.5],[54,79],[46,82.5],[40,86],
];
const CHEST = [28, 85];    // 배경 속 보물상자 위치(%)
const ASPECT = 1536 / 1024; // 세로/가로 비 (거리 계산 시 y 보정)

// 폴리라인 누적 길이 → t(0~1)로 좌표 보간
const segLens = (() => {
  const l = [0];
  for (let i = 1; i < PATH.length; i++) {
    const dx = PATH[i][0] - PATH[i - 1][0];
    const dy = (PATH[i][1] - PATH[i - 1][1]) * ASPECT;
    l.push(l[i - 1] + Math.hypot(dx, dy));
  }
  return l;
})();
const TOTAL_LEN = segLens[segLens.length - 1];
const pointAt = (t) => {
  const d = Math.max(0, Math.min(1, t)) * TOTAL_LEN;
  for (let i = 1; i < PATH.length; i++) {
    if (d <= segLens[i]) {
      const r = (d - segLens[i - 1]) / (segLens[i] - segLens[i - 1] || 1);
      return [
        PATH[i - 1][0] + (PATH[i][0] - PATH[i - 1][0]) * r,
        PATH[i - 1][1] + (PATH[i][1] - PATH[i - 1][1]) * r,
      ];
    }
  }
  return PATH[PATH.length - 1];
};

const toMin = (t = "") => { const [h, m] = String(t).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const isImg = (s) => typeof s === "string" && s.includes("assets/");

export default function AdventureMap({ items = [], mode = "today", charEmoji = "" }) {
  const sorted = [...items].sort((a, b) => toMin(a.time) - toMin(b.time));
  const n = sorted.length;
  // 학원 슬롯: 길 위 t 값. 학원이 적으면 뒷공간은 풍경으로 남긴다 (분모 = max(n,4)+1).
  const D = Math.max(n, 4) + 1;
  const slots = sorted.map((_, i) => (i + 1) / D);
  const done = (a) => a.total > 0 ? a.done >= a.total : true; // 미션 없는 학원은 통과 취급
  // 순차 진행: 앞에서부터 연속으로 완료한 다음 목적지가 캐릭터의 현재 목표
  let k = 0; while (k < n && done(sorted[k])) k++;
  const allDone = n > 0 && k === n;
  const targetT = mode === "past" ? 1 : mode === "future" ? 0 : (allDone ? 1 : (k === 0 ? 0 : slots[k]));

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
    <div style={{ position: "relative", width: "100%", aspectRatio: "1024 / 1536", borderRadius: 18, overflow: "hidden", boxShadow: "inset 0 0 0 1px rgba(142,165,74,0.35)" }}>
      <style>{`
        @keyframes amBob{0%,100%{transform:translate(-50%,-86%) translateY(0)}50%{transform:translate(-50%,-86%) translateY(-4px)}}
        @keyframes amSpark{0%,100%{opacity:0;transform:scale(.5)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes amStar{0%{opacity:0;transform:translateY(4px) scale(.5)}40%{opacity:1;transform:translateY(-6px) scale(1.15)}100%{opacity:0;transform:translateY(-14px) scale(.8)}}
        @keyframes amGlow{0%,100%{opacity:.25}50%{opacity:.6}}
      `}</style>
      <img src={BG} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

      {/* ── 학원 건물 Overlay (배경 무수정 — 길 위 배치, 비슷한 크기) ── */}
      {sorted.map((ac, i) => {
        const [x, y] = pointAt(slots[i]);
        const d = done(ac);
        return (
          <div key={ac.id} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-78%)", width: "20%", textAlign: "center", pointerEvents: "none" }}>
            <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
              {d && <>
                <span style={{ position: "absolute", top: "-6%", left: "-8%", fontSize: 14, animation: "amSpark 2.8s ease-in-out infinite" }}>✨</span>
                <span style={{ position: "absolute", top: "10%", right: "-9%", fontSize: 11, animation: "amSpark 2.8s ease-in-out infinite -1.2s" }}>✨</span>
              </>}
              <img src={BUILDINGS[i % BUILDINGS.length]} alt="" draggable={false}
                style={{ width: "100%", height: "auto", display: "block", filter: d ? "drop-shadow(0 0 8px rgba(255,224,130,0.85)) drop-shadow(0 4px 5px rgba(60,80,40,0.3))" : "drop-shadow(0 4px 5px rgba(60,80,40,0.3))" }} />
            </div>
            {/* 이름표 — 학원 아이콘 + 이름 + 시각 (완료 시 ✔) */}
            <div style={{ display: "inline-block", marginTop: 2, background: "rgba(255,251,240,0.92)", border: "1px solid rgba(155,114,74,0.35)", borderRadius: 9, padding: "2px 7px", fontSize: 10, fontWeight: 900, color: "#5D4633", whiteSpace: "nowrap", boxShadow: "0 2px 5px rgba(60,80,40,0.18)", maxWidth: "160%", overflow: "hidden", textOverflow: "ellipsis" }}>
              {d ? "✅" : ac.icon} {ac.name}{ac.time ? ` · ${ac.time}` : ""}
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

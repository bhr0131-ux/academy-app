import { useLayoutEffect, useRef, useState } from "react";
import { gridSizes, assetPx, CARD_PANEL, CARD_AR } from "./gridLayout.js";

/* ════════════════════════════════════════════════════════════════════════
   GridPrototype — 캐릭터 탭 '가방 + 격자' 배치 시안 (개발자 도구 전용)
   ────────────────────────────────────────────────────────────────────────
   원화를 받기 전에 크기·간격·터치감을 먼저 정하고, 필요한 원화 크기를
   실측해서 알려 주는 자리다. 실제 캐릭터 탭은 아직 캠프 그대로다.

   아이콘 자리에는 지금 쓰는 캠프 아이콘(그루터기 붙은 판)을 임시로 깔았다.
   받침이 보이는 건 자리 크기를 보려는 것뿐이고, 새 원화는 받침 없이 온다.

   화면 아래 '원화 규격' 칸의 숫자가 이 시안의 결과물이다 —
   getBoundingClientRect 로 실제 그려진 폭을 재서 3.5배를 붙인다.
   ════════════════════════════════════════════════════════════════════════ */

const PAPER = "#FBF4ED";
const INK   = "#4E432A";
const INK_S = "#7A6E48";

/* 시안 순서 그대로 여덟 칸 — 이름은 실제 화면과 같게 */
const DEMO = [
  { key: "deco",    img: "st-deco.webp",    name: "꾸미기 상점" },
  { key: "item",    img: "st-item.webp",    name: "아이템 상점" },
  { key: "box",     img: "st-box.webp",     name: "보물창고" },
  { key: "pet",     img: "st-pet.webp",     name: "나의 펫" },
  { key: "book",    img: "st-book.webp",    name: "발견 도감" },
  { key: "title",   img: "st-title.webp",   name: "상장" },
  { key: "streak",  img: "st-streak.webp",  name: "연속 달성" },
  { key: "history", img: "st-history.webp", name: "탐험일지" },
];

export default function GridPrototype({ onClose }) {
  const wrapRef = useRef(null);
  const iconRef = useRef(null);
  const cardRef = useRef(null);
  const [w, setW] = useState(0);
  const [real, setReal] = useState({ icon: 0, card: 0 });

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const read = () => {
      setW(el.clientWidth);
      const i = iconRef.current?.getBoundingClientRect();
      const c = cardRef.current?.getBoundingClientRect();
      setReal({ icon: i ? Math.round(i.width * 10) / 10 : 0,
                card: c ? Math.round(c.width * 10) / 10 : 0 });
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const S = gridSizes(w || 360);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 4000, background: PAPER,
      overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

      <div style={{ position: "sticky", top: 0, zIndex: 5, display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "10px 14px", background: "rgba(251,244,237,0.94)",
        borderBottom: "1px solid rgba(120,100,70,0.16)" }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: INK }}>🧳 가방 + 격자 배치 시안</span>
        <button onClick={onClose} style={{ border: "none", background: "#587220", color: "#fff",
          fontSize: 13, fontWeight: 900, borderRadius: 10, padding: "7px 13px", cursor: "pointer" }}>닫기</button>
      </div>

      <div ref={wrapRef} style={{ padding: "0 24px 28px" }}>

        {/* ── 가방 카드 ── 원화가 오기 전이라 틀만 그려 자리를 잡는다 */}
        <div ref={cardRef} style={{ width: S.cardW, height: S.cardH, margin: `${S.cardTop}px auto ${S.cardBottom}px`,
          position: "relative", borderRadius: 18, background: "#7FA8B8",
          border: "3px solid #6B8FA0", boxShadow: "0 6px 16px rgba(74,90,37,0.18)" }}>
          <div style={{ position: "absolute",
            left: `${CARD_PANEL.l}%`, right: `${100 - CARD_PANEL.r}%`,
            top: `${CARD_PANEL.t}%`, bottom: `${100 - CARD_PANEL.b}%`,
            background: "#FCF8F0", borderRadius: 8,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <p style={{ margin: 0, fontSize: Math.round(S.labelF * 1.35), fontWeight: 900, color: INK }}>Lv.10 섬 탐험가</p>
            <p style={{ margin: 0, fontSize: Math.round(S.labelF * 0.85), fontWeight: 800, color: INK_S }}>다음 등급까지 20%</p>
            <div style={{ width: "78%", height: 12, borderRadius: 7, background: "rgba(74,52,24,0.14)", overflow: "hidden" }}>
              <div style={{ width: "20%", height: "100%", borderRadius: 7, background: "#8DBF3F" }} />
            </div>
            <p style={{ margin: 0, fontSize: Math.round(S.labelF * 1.05), fontWeight: 900, color: INK }}>💎 1,340　|　XP 89,400</p>
          </div>
        </div>

        {/* ── 아이콘 격자 ── */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(2, ${S.cellW}px)`,
          justifyContent: "space-between", rowGap: S.rowGap, columnGap: S.colGap }}>
          {DEMO.map((st, i) => (
            <div key={st.key} style={{ width: S.cellW, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img ref={i === 0 ? iconRef : null} src={`assets/camp/${st.img}`} alt="" draggable={false}
                style={{ width: S.iconW, height: S.iconH, display: "block",
                  objectFit: "contain", objectPosition: "center bottom" }} />
              <span style={{ marginTop: S.labelGap, fontSize: S.labelF, fontWeight: 900, color: INK,
                letterSpacing: -0.2, whiteSpace: "nowrap" }}>{st.name}</span>
            </div>
          ))}
        </div>

        {/* ── 실측 결과 ── 이 숫자가 원화 주문서다 */}
        <div style={{ marginTop: 26, padding: "13px 15px", borderRadius: 14,
          background: "rgba(255,255,255,0.72)", border: "1.5px solid rgba(120,100,70,0.22)" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 900, color: INK }}>📐 원화 규격 (표시 폭 × 3.5배)</p>
          <Row k="탭 안쪽 폭" v={`${w}px`} />
          <Row k="아이콘 표시 폭" v={`${real.icon || S.iconW}px`} hi={`정사각 ${assetPx(real.icon || S.iconW)}px`} />
          <Row k="가방 카드 표시 폭" v={`${real.card || S.cardW}px`} hi={`${assetPx(real.card || S.cardW)}px (비율 ${CARD_AR}:1)`} />
          <p style={{ margin: "9px 0 0", fontSize: 11.5, fontWeight: 700, color: INK_S, lineHeight: 1.55 }}>
            아이콘 8종은 받침 없이 정사각 캔버스를 꽉 채워서. 가방은 값이 계속 바뀌니
            글씨·막대 없는 '빈 틀'로만 주시면 안쪽 값은 앱이 그린다.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, hi }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "3px 0" }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: INK_S }}>{k}</span>
      <span style={{ fontSize: 12.5, fontWeight: 900, color: INK }}>
        {v}{hi && <span style={{ color: "#587220" }}>　→　{hi}</span>}
      </span>
    </div>
  );
}

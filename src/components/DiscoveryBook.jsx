import { useState } from "react";
import {
  DISCOVERY_RARITY, DISCOVERY_TOTAL,
  getCollectionByCategory, getCollectedCount, getDiscoveryLog, getDiscovery, rollEvent,
} from "../data/discoveries.js";

/* ════════════════════════════════════════════════════════════════════════
   DiscoveryBook — 발견 도감 (탐험일지의 '도감' 버튼으로 연다)
   ────────────────────────────────────────────────────────────────────────
   도감을 6개로 나눈다 (사용자 확정) — 식물·곤충·깃털·보물·먹거리·신비.
   하나를 다 채우면 '완성' 도장이 찍혀서, 아이가 "오늘은 새로운 도감이
   열릴까?"를 기대하게 만드는 게 목적이다.

   빈 칸도 자리를 보여 준다. 아직 못 찾은 칸을 물음표로 남겨 둬야
   '뭐가 더 있지?'가 생긴다.

   아래 '발견 기록'은 날짜별로 쌓는다 — 발견은 아이템이 아니라 '추억'이라,
   몇 달 뒤에 다시 보는 게 이 화면의 진짜 목적이다.

   props
     open, onClose
     data      : v6_discoveries 원본
     childId   : 현재 아이
     childName : 표시용 이름
   ════════════════════════════════════════════════════════════════════════ */
export default function DiscoveryBook({ open, onClose, data, childId, childName = "" }) {
  /* 기록은 길어질 수 있어 기본은 최근 12개만. 더 보고 싶을 때만 펼친다. */
  const [showAllLog, setShowAllLog] = useState(false);
  if (!open) return null;

  const cats = getCollectionByCategory(data, childId);
  const found = getCollectedCount(data, childId);
  const log = [...getDiscoveryLog(data, childId)].reverse();   // 최근 날짜가 위로
  const logShown = showAllLog ? log : log.slice(0, 12);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 4000,
        background: "rgba(20,16,32,0.55)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 14,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460, maxHeight: "92vh", overflow: "hidden",
          background: "#FBF4E4", borderRadius: 26, display: "flex", flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)", border: "2px solid #D9C08C",
        }}
      >
        {/* 헤더 */}
        <div style={{ padding: "16px 20px", background: "linear-gradient(135deg,#8A6B47,#B08A5B)", color: "#fff" }}>
          <p style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>📖 발견 도감</p>
          <p style={{ margin: "3px 0 0", fontSize: 12, fontWeight: 700, opacity: 0.92 }}>
            {childName ? `${childName}이(가) ` : ""}지금까지 <b>{found}</b> / {DISCOVERY_TOTAL} 가지를 발견했어요
          </p>
          {/* 전체 진행 막대 */}
          <div style={{ marginTop: 8, height: 7, borderRadius: 999, background: "rgba(255,255,255,0.28)", overflow: "hidden" }}>
            <div style={{
              width: `${Math.round((found / DISCOVERY_TOTAL) * 100)}%`, height: "100%",
              borderRadius: 999, background: "linear-gradient(90deg,#FFE9B8,#FFD166)", transition: "width .4s",
            }} />
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "14px 16px 4px" }}>
          {/* 도감 6권 — 권마다 제목 + 진행 + 슬롯 */}
          {cats.map((cat) => {
            const done = cat.found === cat.total;
            return (
              <div key={cat.key} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                  <span style={{ fontSize: 15 }}>{cat.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#6B523A" }}>{cat.label}</span>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: done ? "#4E7B3A" : "#A2917C" }}>
                    {cat.found}/{cat.total}
                  </span>
                  {done && (
                    <span style={{
                      fontSize: 10, fontWeight: 900, color: "#fff", background: "#4E7B3A",
                      padding: "2px 7px", borderRadius: 999,
                    }}>완성!</span>
                  )}
                  <div style={{ flex: 1, height: 2, borderRadius: 2, background: "rgba(138,107,71,0.18)" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {cat.items.map((d) => {
                    const rc = DISCOVERY_RARITY[d.rarity] || DISCOVERY_RARITY.common;
                    return (
                      <div key={d.id} style={{
                        position: "relative",
                        borderRadius: 14, padding: "8px 3px 6px", textAlign: "center",
                        background: d.found ? "#fff" : "rgba(138,107,71,0.07)",
                        border: d.found ? `2px solid ${rc.color}55` : "1.5px dashed rgba(138,107,71,0.32)",
                      }}>
                        {/* 희귀한 것만 별을 붙인다 — 일반까지 붙이면 시끄럽다 */}
                        {d.found && d.rarity !== "common" && (
                          <span style={{ position: "absolute", top: 3, right: 4, fontSize: 8 }}>{rc.star}</span>
                        )}
                        <div style={{ fontSize: 24, lineHeight: 1.2, opacity: d.found ? 1 : 0.32 }}>
                          {d.found ? d.emoji : "❔"}
                        </div>
                        <p style={{ margin: "3px 0 0", fontSize: 9.5, fontWeight: 800, lineHeight: 1.25,
                          color: d.found ? "#5A4430" : "#A2917C" }}>
                          {d.found ? d.name : "???"}
                        </p>
                        {d.count > 1 && (
                          <p style={{ margin: "1px 0 0", fontSize: 8.5, fontWeight: 800, color: rc.color }}>×{d.count}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 발견 기록 — 날짜별 '추억' */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 2px 10px" }}>
            <div style={{ flex: 1, height: 2, borderRadius: 2, background: "rgba(138,107,71,0.25)" }} />
            <span style={{ fontSize: 12.5, fontWeight: 900, color: "#8A6B47" }}>🗓️ 발견 기록</span>
            <div style={{ flex: 1, height: 2, borderRadius: 2, background: "rgba(138,107,71,0.25)" }} />
          </div>

          {log.length === 0 ? (
            <p style={{ textAlign: "center", color: "#A2917C", fontSize: 12.5, fontWeight: 700, padding: "18px 0 24px" }}>
              아직 발견한 게 없어요.<br />탐험 길을 걷다 보면 무언가 발견할 수 있어요!
            </p>
          ) : (
            <div style={{ paddingBottom: 10 }}>
              {logShown.map((e, i) => {
                const d = getDiscovery(e.id);
                if (!d) return null;
                const rc = DISCOVERY_RARITY[d.rarity] || DISCOVERY_RARITY.common;
                /* 그날 랜덤 이벤트(만남)도 추억으로 같이 보여준다 — 고정 시드라
                   저장 없이 날짜만으로 다시 계산된다 ("앵무새 만난 날" 기억용) */
                const ev = rollEvent(childId, e.d);
                return (
                  <div key={`${e.d}-${i}`} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "7px 10px", marginBottom: 6, borderRadius: 12,
                    background: "#fff", border: `1px solid ${rc.color}33`,
                  }}>
                    <span style={{ fontSize: 20 }}>{d.emoji}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: "#5A4430" }}>{d.name}</span>
                      {ev && <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#A2917C", marginTop: 1 }}>{ev.emoji} {ev.msg}</span>}
                    </span>
                    {d.rarity !== "common" && (
                      <span style={{ fontSize: 9.5, fontWeight: 900, color: rc.color }}>{rc.label}</span>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#A2917C" }}>{e.d.replace(/-/g, ".")}</span>
                  </div>
                );
              })}
              {log.length > logShown.length && (
                <button
                  onClick={() => setShowAllLog(true)}
                  style={{
                    width: "100%", border: "1.5px solid rgba(138,107,71,0.3)", background: "#fff",
                    color: "#6B523A", borderRadius: 12, padding: "8px 0", marginTop: 2,
                    fontSize: 12, fontWeight: 800, cursor: "pointer",
                    fontFamily: "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif",
                  }}
                >
                  이전 기록 {log.length - logShown.length}개 더 보기
                </button>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "10px 16px 16px", borderTop: "1px solid rgba(138,107,71,0.25)" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", border: "none", borderRadius: 14, padding: "13px 0",
              fontWeight: 900, fontSize: 15, cursor: "pointer",
              background: "rgba(138,107,71,0.12)", color: "#6B523A",
              fontFamily: "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif",
            }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

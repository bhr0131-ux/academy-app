/* ════════════════════════════════════════════════════════════════════════
   AdventureJournalCard — 탐험일지 학원 카드 (스프링 노트 원화 오버레이)
   ────────────────────────────────────────────────────────────────────────
   사용자 원화(assets/journal-card.webp, 1254×1254 정사각)에는 종이·제본링·
   나침반·발자국 장식과 왼쪽 아이콘 네 개만 그려져 있다. 글자는 전부 앱이
   아이콘 오른쪽에 얹는다. 라벨(제목 글자)은 원화에 없으므로 쓰지 않는다 —
   아이콘이 곧 라벨이다.

   원화 실측 (연결요소 bbox, %는 원화 폭·높이 기준)
     종이면      x 3.7~96.9 · y 3.0~98.0
     모서리 장식 x 90.4~96.4 · y 3.0~5.0
     나침반      x 84.8~92.3 · y 7.7~14.9      ← 제목이 침범하면 안 되는 곳
     발자국      x 14~40    · y 5.9~9.2
     시계        x 16.5~26.2 · y 31.4~41.3  중심 (21.3, 36.4)
     버스        x 15.8~27.5 · y 47.3~55.9  중심 (21.7, 51.6)
     배낭        x 15.8~26.6 · y 61.0~72.7  중심 (21.2, 66.9)
     과녁        x 17.0~28.4 · y 78.2~89.3  중심 (22.7, 83.8)

   글자 열은 아이콘 오른쪽 x 31% 에서 시작해 오른쪽 종이 끝 전(93%)까지.
   제목은 나침반·발자국을 피해 y 16~29% 구간에 놓는다.
   퀘스트(숙제) 목록은 사용자 확정으로 카드에서 제외 — 미션 탭에서 관리.

   props
     icon     : string   학원 이모지 (제목 앞)
     title    : string   던전명 (예: 선율의 신전)
     name     : string   실제 학원명 (부제)
     time     : string   시작 시각 (한글 변환된 값)
     remain   : string   남은시간 라벨 (오늘만, 없으면 "")
     remainTone : "done"|"now"|"urgent"|"soon"  남은시간 상태 (배지 색·체크 표시)
     shuttle  : string   셔틀 정보 (없으면 "없음")
     supplies : node     준비물 체크 칩들 (App이 토글 핸들러와 함께 생성)
     missionText : string  남은 미션 요약 (예: 3개 남음 / 🎉 클리어!)
     missionTone : string  요약 글자색
   ════════════════════════════════════════════════════════════════════════ */

import { useRef } from "react";

// 앱 전체 글씨체(카페24 써라운드)로 통일 — 제목·값 모두 (사용자 확정)
const F_HAND = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";
const F_BODY = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

// 글자 열 — 왼쪽 아이콘 오른쪽에서 시작해 종이 오른쪽 끝 전까지
const COL_L = "31%";
const COL_R = "7%";       // right 값 (= x 93%)

// 아이콘 네 개의 중심 y (원화 실측)
const Y_TIME    = "36.4%";
const Y_SHUTTLE = "51.6%";
const Y_SUPPLY  = "66.9%";
const Y_MISSION = "83.8%";

// onPrev/onNext: 좌우 스와이프로 시간순 이전/다음 학원 일지로 전환 (App이 순환 이동 전달)
// 카드가 학원 전환으로 다시 마운트될 때(key=학원 id) 페이지 넘김 애니메이션 재생
/* [사용자 확정 2026-08-11] '수업 종료' 앞의 ✅ 는 운영체제 이모지라 종이·수채화 위에서
   혼자 튀었다 → 노트의 올리브색을 쓴 둥근 배지로. 수업 중일 땐 따뜻한 갈색 배지,
   아직 남았을 땐 예전처럼 연한 글자만 (조용해야 할 상태라 배지를 씌우지 않는다). */
const REMAIN_BADGE = {
  done: { bg: "rgba(127,163,90,0.22)", border: "#7FA35A", color: "#3E5C28" },
  now:  { bg: "rgba(180,101,42,0.16)", border: "#C08046", color: "#8C4E1E" },
};

export default function AdventureJournalCard({
  icon, title, name, time, remain = "", remainTone = "", shuttle = "없음",
  supplies, missionText, missionTone = "#5A3F22", onPrev, onNext,
}) {
  const touch = useRef(null);
  const badge = REMAIN_BADGE[remainTone];
  return (
    <div
      onTouchStart={(e) => { const t = e.touches[0]; touch.current = [t.clientX, t.clientY]; }}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touch.current[0], dy = t.clientY - touch.current[1];
        touch.current = null;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          if (dx < 0) { onNext && onNext(); } else { onPrev && onPrev(); }
        }
      }}
      style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", marginBottom: 14, touchAction: "pan-y" }}>

      {/* v6 스프링 노트 원화 (1254×1254) — 왼쪽 아이콘 네 개만 있고 글자는 전부 앱이 얹는다 */}
      <img src="assets/journal-card.webp" alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block",
          filter: "drop-shadow(0 6px 14px rgba(74,90,37,0.22))" }} />

      {/* 제목 — [사용자 확정 2026-08-13] 한 줄로 폈다: 학원 이모지 · 던전명 · 학원명.
          예전엔 가운데 정렬 두 줄(던전명 / 그 아래 학원명)이었는데, 아래 네 줄(시계·버스·
          가방·과녁)은 왼쪽 아이콘 열 기준이라 머리말만 혼자 가운데라 축이 어긋나 보였다.
          이제 이모지를 아래 아이콘과 같은 열(9~31%) 가운데에 두고, 글자는 아래 글자열과
          같은 31% 에서 시작한다 — 세로선이 위아래로 쭉 맞는다.
          크기도 한 단계 키웠다(약 +20%). 이모지는 던전명보다 크게(1.35배),
          학원명은 예전처럼 던전명보다 작은 비율(0.61)을 그대로 지킨다.
          top 16% → 13% — 사용자 요청대로 약간 위로. */}
      <div style={{ position: "absolute", left: "14.1%", right: COL_R, top: "13%", height: "13%",
        display: "flex", alignItems: "center", pointerEvents: "none" }}>
        {/* 이모지 칸 14.1~31% — 이모지 글자가 자체 여백 때문에 왼쪽으로 치우쳐서, 칸을 아래 아이콘 네 개의 중심과 맞는다.
            칸 오른쪽 끝은 31%(COL_L)라 글자는 아래 글자열과 같은 자리에서 시작한다. */}
        <span style={{ width: "16.9%", flexShrink: 0, textAlign: "center",
          fontSize: "clamp(20.5px, 7vw, 32.1px)", lineHeight: 1 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "baseline", gap: 7, overflow: "hidden" }}>
          <p style={{ margin: 0, fontFamily: F_HAND, fontWeight: 400, fontSize: "clamp(15.2px, 5.2vw, 23.8px)",
            color: "#4E432A", lineHeight: 1.15, textShadow: "0 1px 0 rgba(255,255,255,0.7)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</p>
          <p style={{ margin: 0, fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(9.3px, 3.2vw, 14.5px)",
            color: "#7A6E48", flexShrink: 0, whiteSpace: "nowrap" }}>{name}</p>
        </div>
      </div>

      {/* 탐험 시작 (시계) — 시각은 왼쪽, 남은시간은 줄 맨 오른쪽 끝에 (사용자 확정: 시각에 붙이지 말고 떼서 우측).
          marginLeft:auto로 밀어 두면 남는 폭이 좁아졌을 때만 아랫줄로 내려가고, 그때도 우측 정렬이 유지된다. */}
      <div style={{ position: "absolute", left: COL_L, right: COL_R, top: Y_TIME, transform: "translateY(-50%)",
        display: "flex", alignItems: "baseline", flexWrap: "wrap", justifyContent: "space-between",
        columnGap: 8, rowGap: 0, pointerEvents: "none" }}>
        <span style={{ fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(11px, 3.7vw, 15.4px)",
          color: "#4E432A", lineHeight: 1.15, whiteSpace: "nowrap", flexShrink: 0 }}>{time}</span>
        {remain && (badge
          ? <span style={{ fontFamily: F_BODY, fontSize: "clamp(8.8px, 3vw, 12.1px)", color: badge.color,
              whiteSpace: "nowrap", marginLeft: "auto", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4,
              background: badge.bg, border: `1px solid ${badge.border}`, borderRadius: 999, padding: "2px 9px" }}>
              {remainTone === "done" && (
                <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="m5.5 12.6 4.2 4.2 8.8-9.6" fill="none" stroke="currentColor" strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {remain}
            </span>
          : <span style={{ fontFamily: F_BODY, fontSize: "clamp(8.8px, 3vw, 12.1px)", color: "#7A6E48",
              whiteSpace: "nowrap", marginLeft: "auto", flexShrink: 0 }}>{remain}</span>)}
      </div>

      {/* 셔틀 (버스) */}
      <div style={{ position: "absolute", left: COL_L, right: COL_R, top: Y_SHUTTLE, transform: "translateY(-50%)",
        textAlign: "left", pointerEvents: "none" }}>
        <p style={{ margin: 0, fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(11px, 3.7vw, 15.4px)",
          color: "#4E432A", lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{shuttle}</p>
      </div>

      {/* 준비물 (배낭) — 체크 칩 (App이 토글 포함해 내려줌, 많으면 스크롤).
          배낭 중심(66.9%)에 맞춰 가운데를 두되, 좁은 폰에서 칩이 두 줄로 접히므로
          높이를 16%까지 준다 — 아래 과녁이 78.2%에서 시작하니 75%까지는 안 부딪친다. */}
      <div style={{ position: "absolute", left: COL_L, right: COL_R, top: "59%", height: "16%",
        display: "flex", flexWrap: "wrap", gap: 5, alignContent: "center", justifyContent: "flex-start",
        overflowY: "auto" }}>
        {supplies}
      </div>

      {/* 남은 미션 (과녁) */}
      <div style={{ position: "absolute", left: COL_L, right: COL_R, top: Y_MISSION, transform: "translateY(-50%)",
        pointerEvents: "none" }}>
        <p style={{ margin: 0, fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(11.6px, 4vw, 16.5px)",
          color: missionTone, whiteSpace: "nowrap" }}>{missionText}</p>
      </div>
    </div>
  );
}

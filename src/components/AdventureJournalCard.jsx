/* ════════════════════════════════════════════════════════════════════════
   AdventureJournalCard — 탐험일지 학원 카드 (양피지 노트 원화 오버레이)
   ────────────────────────────────────────────────────────────────────────
   사용자 원화(assets/journal-card.webp)에 아이콘만 그려져 있고 나머지는 빈
   종이다. 이 컴포넌트는 값을 % 좌표로 얹는다.
   [v5 2026-08-05] 밑줄·패널 상자·우표 장식이 없는 깔끔한 판으로 교체.
   좌표는 원화 픽셀에서 실측했다 (색이 진한 곳 = 아이콘으로 잡아 덩어리별 bbox):
     리스 중심 (31.7%, 20.0%) — 지름 x 21.4~42.1 · y 10.4~29.7
     시계 중심 y 40.7% (x 14.6~28.2)   버스 중심 y 56.6% (x 12.1~28.5)
     배낭 중심 y 72.3% (x 14.4~29.4)   과녁 중심 y 87.7% (x 17.2~28.3)
   아이콘이 x 29.4%에서 끝나므로 글자는 32.5%부터 쓴다.
   제목은 리스 오른쪽(42.1%) 밖으로 빼야 겹치지 않는다.
   퀘스트(숙제) 목록은 사용자 확정으로 카드에서 제외 — 미션 탭에서 관리.

   props
     icon     : string   학원 이모지 (엠블럼 링 안)
     title    : string   던전명 (예: 선율의 신전)
     name     : string   실제 학원명 (부제)
     time     : string   시작 시각 (한글 변환된 값)
     remain   : string   남은시간 라벨 (오늘만, 없으면 "")
     shuttle  : string   셔틀 정보 (없으면 "없음")
     supplies : node     준비물 체크 칩들 (App이 토글 핸들러와 함께 생성)
     missionText : string  남은 미션 요약 (예: 3개 남음 / 🎉 클리어!)
     missionTone : string  요약 글자색
   ════════════════════════════════════════════════════════════════════════ */

import { useRef } from "react";

// 앱 전체 글씨체(카페24 써라운드)로 통일 — 제목·값 모두 (사용자 확정)
const F_HAND = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";
const F_BODY = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

// onPrev/onNext: 좌우 스와이프로 시간순 이전/다음 학원 일지로 전환 (App이 순환 이동 전달)
// 카드가 학원 전환으로 다시 마운트될 때(key=학원 id) 페이지 넘김 애니메이션 재생
export default function AdventureJournalCard({
  icon, title, name, time, remain = "", shuttle = "없음",
  supplies, missionText, missionTone = "#5A3F22", onPrev, onNext,
}) {
  const touch = useRef(null);
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
      {/* v5 초록 노트 원화 (1254×1254 → 화면용 1100px, 모서리 검정은 투명 펀칭).
          빈 종이라 값을 아이콘 오른쪽에 그대로 쓴다. */}
      <img src="assets/journal-card.webp" alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", filter: "drop-shadow(0 6px 14px rgba(74,90,37,0.22))" }} />

      {/* 엠블럼 — 잎 리스 '안'에 들어가게, 리스 원 정중앙 정렬 (실측 중심) */}
      <span style={{ position: "absolute", left: "31.7%", top: "20%", transform: "translate(-50%,-50%)",
        fontSize: "clamp(22px, 8vw, 38px)", lineHeight: 1, pointerEvents: "none" }}>{icon}</span>

      {/* 제목 — 던전명(손글씨 크게) + 학원명(부제), 리스 우측 여백 */}
      <div style={{ position: "absolute", left: "46%", right: "7%", top: "11%", height: "18%",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", pointerEvents: "none" }}>
        <p style={{ margin: 0, fontFamily: F_HAND, fontWeight: 400, fontSize: "clamp(12.7px, 4.3vw, 19.8px)",
          color: "#4E432A", lineHeight: 1.15, textShadow: "0 1px 0 rgba(255,255,255,0.7)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{title}</p>
        <p style={{ margin: "2px 0 0", fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(8.2px, 2.8vw, 12.1px)",
          color: "#7A6E48", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{name}</p>
      </div>

      {/* 탐험 시작 — 시각은 왼쪽 밑줄 위, 남은시간은 줄 맨 오른쪽 끝에 (사용자 확정: 시각에 붙이지 말고 떼서 우측).
          marginLeft:auto로 밀어 두면 남는 폭이 좁아졌을 때만 아랫줄로 내려가고, 그때도 우측 정렬이 유지된다. */}
      <div style={{ position: "absolute", left: "32.5%", right: "6%", top: "40.7%", transform: "translateY(-50%)",
        display: "flex", alignItems: "baseline", flexWrap: "wrap", justifyContent: "space-between", columnGap: 8, rowGap: 0, pointerEvents: "none" }}>
        <span style={{ fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(11px, 3.7vw, 15.4px)", color: "#4E432A", lineHeight: 1.15, whiteSpace: "nowrap", flexShrink: 0 }}>{time}</span>
        {remain && <span style={{ fontFamily: F_BODY, fontSize: "clamp(8.8px, 3vw, 12.1px)", color: "#7A6E48", whiteSpace: "nowrap", marginLeft: "auto", flexShrink: 0 }}>{remain}</span>}
      </div>

      {/* 셔틀 — 버스 아이콘 옆 */}
      <div style={{ position: "absolute", left: "32.5%", right: "8%", top: "56.6%", transform: "translateY(-50%)", textAlign: "left", pointerEvents: "none" }}>
        <p style={{ margin: 0, fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(11px, 3.7vw, 15.4px)", color: "#4E432A", lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{shuttle}</p>
      </div>

      {/* 준비물 — 가방 아이콘 옆 체크 칩 (App이 토글 포함해 내려줌, 많으면 스크롤) */}
      <div style={{ position: "absolute", left: "32.5%", right: "7%", top: "65.8%", height: "13%",
        display: "flex", flexWrap: "wrap", gap: 5, alignContent: "center", justifyContent: "flex-start", overflowY: "auto" }}>
        {supplies}
      </div>

      {/* 남은 미션 배너 값 — 타깃 아이콘 옆 (라벨 없음 → 문구를 온전히 표기) */}
      <div style={{ position: "absolute", left: "32.5%", top: "87.7%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <p style={{ margin: 0, fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(11.6px, 4vw, 16.5px)", color: missionTone, whiteSpace: "nowrap" }}>{missionText}</p>
      </div>
    </div>
  );
}

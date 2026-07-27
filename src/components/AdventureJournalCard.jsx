/* ════════════════════════════════════════════════════════════════════════
   AdventureJournalCard — 탐험일지 학원 카드 (양피지 노트 원화 오버레이)
   ────────────────────────────────────────────────────────────────────────
   사용자 원화(assets/journal-card.webp, 1181×1338)에 아이콘·라벨·구분선·
   하단 '남은 미션' 배너가 모두 그려져 있어, 이 컴포넌트는 값만 % 좌표로
   얹는다. 원화 좌표 실측: 엠블럼 링 중심 (27.7%, 18.1%), 행 중심 y —
   탐험 시작 38.1% / 셔틀 53.4% / 준비물 68.4%, 배너 중심 87%.
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

// 사용자 확정: 응원문구(오늘도 신나는 탐험 출발!)와 같은 손글씨체 'Uiyeun'으로 통일 — 제목·값 모두
const F_HAND = "'Uiyeun','Noto Sans KR','Apple SD Gothic Neo',sans-serif";
const F_BODY = "'Uiyeun','Noto Sans KR','Apple SD Gothic Neo',sans-serif";

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
      {/* v4 초록 노트 원화 (1254×1254, 라벨·장식 정리판) — 값을 아이콘 옆 밑줄 위에 직접 쓴다.
          좌표 실측: 리스 중심 (31.6,20.0)·지름 17.5% / 아이콘 행 중심 y 41.2·56.1·69.1 / 배너 83.4 / 밑줄 시작 x 25% */}
      <img src="assets/journal-card.webp" alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", filter: "drop-shadow(0 6px 14px rgba(74,90,37,0.22))" }} />

      {/* 엠블럼 — 잎 리스 '안'에 들어가게, 리스 원 정중앙 정렬 (실측 중심) */}
      <span style={{ position: "absolute", left: "31.6%", top: "20%", transform: "translate(-50%,-50%)",
        fontSize: "clamp(22px, 8vw, 38px)", lineHeight: 1, pointerEvents: "none" }}>{icon}</span>

      {/* 제목 — 던전명(손글씨 크게) + 학원명(부제), 리스 우측 여백 */}
      <div style={{ position: "absolute", left: "37%", right: "9%", top: "13%", height: "14%",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", pointerEvents: "none" }}>
        <p style={{ margin: 0, fontFamily: F_HAND, fontWeight: 400, fontSize: "clamp(23px, 7.9vw, 36px)",
          color: "#4E432A", lineHeight: 1.15, textShadow: "0 1px 0 rgba(255,255,255,0.7)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{title}</p>
        <p style={{ margin: "2px 0 0", fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(15px, 5vw, 22px)",
          color: "#7A6E48", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{name}</p>
      </div>

      {/* 탐험 시작 — 시각 + 남은시간을 한 줄로 (사용자 조정: 남은시간은 항상 시간 우측, 글자 축소) */}
      <div style={{ position: "absolute", left: "32.5%", right: "6%", top: "41.2%", transform: "translateY(-50%)",
        display: "flex", alignItems: "baseline", flexWrap: "wrap", columnGap: 8, rowGap: 0, pointerEvents: "none" }}>
        <span style={{ fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(20px, 6.8vw, 28px)", color: "#4E432A", lineHeight: 1.15, whiteSpace: "nowrap" }}>{time}</span>
        {remain && <span style={{ fontFamily: F_BODY, fontSize: "clamp(13px, 4.3vw, 17px)", color: "#7A6E48", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{remain}</span>}
      </div>

      {/* 셔틀 — 버스 아이콘 옆 */}
      <div style={{ position: "absolute", left: "32.5%", right: "8%", top: "56.1%", transform: "translateY(-50%)", textAlign: "left", pointerEvents: "none" }}>
        <p style={{ margin: 0, fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(20px, 6.8vw, 28px)", color: "#4E432A", lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{shuttle}</p>
      </div>

      {/* 준비물 — 가방 아이콘 옆 체크 칩 (App이 토글 포함해 내려줌, 많으면 스크롤) */}
      <div style={{ position: "absolute", left: "32%", right: "8%", top: "62.5%", height: "13%",
        display: "flex", flexWrap: "wrap", gap: 5, alignContent: "center", justifyContent: "flex-start", overflowY: "auto" }}>
        {supplies}
      </div>

      {/* 남은 미션 배너 값 — 타깃 아이콘 옆 (라벨 없음 → 문구를 온전히 표기) */}
      <div style={{ position: "absolute", left: "35.5%", top: "85%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <p style={{ margin: 0, fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(21px, 7.2vw, 30px)", color: missionTone, whiteSpace: "nowrap" }}>{missionText}</p>
      </div>
    </div>
  );
}

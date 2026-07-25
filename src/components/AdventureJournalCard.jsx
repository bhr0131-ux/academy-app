/* ════════════════════════════════════════════════════════════════════════
   AdventureJournalCard — 모험일지 학원 카드 (양피지 노트 원화 오버레이)
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

const F_HAND = "'OwnglyphConCon','Noto Sans KR',sans-serif";   // 손글씨 (제목)
const F_BODY = "'PretendardSemiBold','Noto Sans KR',sans-serif"; // 본문 값

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
      style={{ position: "relative", width: "100%", aspectRatio: "1181 / 1338", marginBottom: 14, touchAction: "pan-y" }}>
      <img src="assets/journal-card.webp" alt="" draggable={false}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", filter: "drop-shadow(0 6px 14px rgba(93,70,51,0.20))" }} />

      {/* 엠블럼 — 나무 링 안 학원 이모지 */}
      <span style={{ position: "absolute", left: "27.7%", top: "18.2%", transform: "translate(-50%,-50%)",
        fontSize: "clamp(30px, 11.5vw, 52px)", lineHeight: 1, pointerEvents: "none" }}>{icon}</span>

      {/* 제목 — 던전명(손글씨 크게) + 학원명(부제) */}
      <div style={{ position: "absolute", left: "40%", right: "5%", top: "7.5%", height: "21%",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", pointerEvents: "none" }}>
        <p style={{ margin: 0, fontFamily: F_HAND, fontWeight: 400, fontSize: "clamp(19px, 6.6vw, 30px)",
          color: "#4E392A", lineHeight: 1.15, textShadow: "0 1px 0 rgba(255,246,224,0.6)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{title}</p>
        <p style={{ margin: "2px 0 0", fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(12px, 3.9vw, 17px)",
          color: "#7A6248", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{name}</p>
      </div>

      {/* 탐험 시작 — 시각 + (오늘) 남은시간 한 줄 */}
      <div style={{ position: "absolute", right: "8%", top: "38.1%", transform: "translateY(-50%)", textAlign: "right", pointerEvents: "none" }}>
        <p style={{ margin: 0, fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(15px, 4.9vw, 22px)", color: "#4E392A", lineHeight: 1.15 }}>{time}</p>
        {remain && <p style={{ margin: "2px 0 0", fontFamily: F_BODY, fontSize: "clamp(10px, 3.2vw, 13px)", color: "#8A6B47" }}>{remain}</p>}
      </div>

      {/* 셔틀 */}
      <div style={{ position: "absolute", right: "8%", top: "53.4%", transform: "translateY(-50%)", maxWidth: "52%", textAlign: "right", pointerEvents: "none" }}>
        <p style={{ margin: 0, fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(13px, 4.2vw, 18px)", color: "#4E392A", lineHeight: 1.3,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{shuttle}</p>
      </div>

      {/* 준비물 — 체크 칩 (App이 토글 포함해 내려줌, 많으면 스크롤) */}
      <div style={{ position: "absolute", left: "41%", right: "5.5%", top: "61.5%", height: "17%",
        display: "flex", flexWrap: "wrap", gap: 5, alignContent: "center", justifyContent: "flex-end", overflowY: "auto" }}>
        {supplies}
      </div>

      {/* 남은 미션 배너 값 */}
      <div style={{ position: "absolute", right: "9%", top: "87%", transform: "translateY(-50%)", pointerEvents: "none" }}>
        <p style={{ margin: 0, fontFamily: F_BODY, fontWeight: 400, fontSize: "clamp(15px, 5vw, 22px)", color: missionTone, whiteSpace: "nowrap" }}>{missionText}</p>
      </div>
    </div>
  );
}

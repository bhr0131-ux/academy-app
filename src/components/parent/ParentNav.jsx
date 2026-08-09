/* ════════════════════════════════════════════════════════════════════════
   ParentNav — 엄마 관리 화면 하단 고정 내비게이션 (5칸)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-09] 예전에는 아이 선택 칩 아래에 홈·보상·달력·학원비·
   결석·기타 여섯 칸이 알약 버튼으로 붙어 있었다. 위쪽에 기능이 몰려 답답해서
   화면 맨 아래 고정 바로 내리고, 자주 안 쓰는 셋(학원비·결석·기타)은
   '더보기' 하나로 묶었다.

   · 홈    — 오늘 일정 · 오늘 챙길 일 · 오늘의 학원
   · 학원  — 학원 정보 · 셔틀 · 준비물 · 숙제 관리
   · 보상  — 보상 승인 · 보상 내역 (누를 때마다 PIN)
   · 달력  — 전체 일정
   · 더보기 — 학원비 · 결석 · 기타

   아이콘은 굵기·크기를 맞춘 선형 SVG다 (사용자 확정: 여러 색 이모지 금지).
   currentColor를 쓰므로 선택/비선택 색은 버튼 쪽 color 하나로 정해진다.

   고정 방식 — position:fixed + 앱 폭(maxWidth)에 맞춘 가운데 정렬.
   기기 안전영역(env(safe-area-inset-bottom))만큼 아래 여백을 더 두고,
   본문은 App 쪽에서 PARENT_NAV_SPACE 만큼 아래 여백을 준다.

   여기는 '그리기'만 한다 — 어느 탭인지, 누르면 무엇을 할지는 전부 App이 정한다.

   props
     items  : [{key, label, icon, active, onPress}]
     accent : 선택된 칸 색 (테마색)
     dim    : 선택 안 된 칸 색
     maxWidth : 앱 본문 최대 폭 (가운데 정렬용)
   ════════════════════════════════════════════════════════════════════════ */

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

/* 선형 아이콘 — 24 격자, 굵기 1.8 로 통일. 색은 currentColor */
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
export const NAV_ICONS = {
  home: (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <path {...S} d="M3.6 10.4 12 3.8l8.4 6.6" />
      <path {...S} d="M5.6 9.6V19a1 1 0 0 0 1 1h10.8a1 1 0 0 0 1-1V9.6" />
      <path {...S} d="M9.8 20v-5.2h4.4V20" />
    </svg>
  ),
  academy: (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <path {...S} d="M12 3.6 21 8l-9 4.4L3 8l9-4.4Z" />
      <path {...S} d="M6.6 10.2V15c0 1.6 2.4 3 5.4 3s5.4-1.4 5.4-3v-4.8" />
      <path {...S} d="M20.4 8.6v5" />
    </svg>
  ),
  reward: (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <path {...S} d="M4 10.6h16V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8.4Z" />
      <path {...S} d="M3.2 7.4h17.6v3.2H3.2z" />
      <path {...S} d="M12 7.4V20" />
      <path {...S} d="M12 7.4S10.9 4 9 4a2 2 0 0 0 0 3.4h3Zm0 0S13.1 4 15 4a2 2 0 0 1 0 3.4h-3Z" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <rect {...S} x="3.6" y="5.4" width="16.8" height="14.6" rx="2.6" />
      <path {...S} d="M3.6 10.2h16.8M8.4 3.6v3.4M15.6 3.6v3.4" />
      <path {...S} d="M8 14h2.2M13.8 14H16" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <path {...S} d="M4.4 7.6h15.2M4.4 12h15.2M4.4 16.4h9.6" />
    </svg>
  ),
};

/* 본문 아래에 비워 둘 높이 = 바 높이(58) + 여유(10). 안전영역은 App에서 env()로 더한다 */
export const PARENT_NAV_H = 58;

export default function ParentNav({ items = [], accent = "#F58BB0", dim = "#9AA0A6", maxWidth = 430 }) {
  return (
    <nav aria-label="엄마 관리 메뉴"
      style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 900, pointerEvents: "none" }}>
      <div style={{ maxWidth, margin: "0 auto", pointerEvents: "auto",
        background: "#FFFDFC",                                  // 아주 연한 웜화이트
        borderTop: "1px solid rgba(90,70,60,0.10)",
        boxShadow: "0 -6px 18px -10px rgba(90,70,60,0.28)",
        paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ display: "flex", height: PARENT_NAV_H }}>
          {items.map(it => (
            <button key={it.key} type="button" onClick={it.onPress} className="nav-tap"
              aria-label={it.label} aria-current={it.active ? "page" : undefined}
              style={{ flex: 1, border: "none", background: "none", padding: 0, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 3, fontFamily: F, color: it.active ? accent : dim,
                transition: "color .15s" }}>
              {NAV_ICONS[it.icon] || NAV_ICONS.more}
              <span style={{ fontSize: 11, fontWeight: it.active ? 900 : 700, letterSpacing: -0.2 }}>{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

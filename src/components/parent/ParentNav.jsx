/* ════════════════════════════════════════════════════════════════════════
   ParentNav — 엄마 관리 화면 하단 고정 내비게이션 (5칸)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-09] 예전에는 아이 선택 칩 아래에 홈·보상·달력·학원비·
   결석·기타 여섯 칸이 알약 버튼으로 붙어 있었다. 위쪽에 기능이 몰려 답답해서
   화면 맨 아래 고정 바로 내리고, 자주 안 쓰는 셋(학원비·결석·기타)은
   '더보기' 하나로 묶었다.

   [2026-08-10 개편] 매일 여는 '미션 관리'가 보상 탭 안에 접혀 있어 손이 많이 갔다.
   미션을 칸으로 꺼내고, 대신 달력을 '더보기' 안으로 내렸다.
   [2026-08-16] '학원' 칸을 뺐다 — 홈의 '오늘의 학원 / 등록 학원' 토글이 같은 일을 한다.
   [2026-08-19] 그렇게 빈 자리에 달력을 '더보기' 밖에서 다시 꺼내 미션 옆에 뒀다.

   · 홈    — 오늘 일정 · 오늘 챙길 일 · 오늘의 학원
   · 미션  — 날짜별 미션 추가·수정 · 점수 관리
   · 달력  — 월간·주간 일정 · 그날 상세
   · 보상  — 보상 승인 · 보상 내역 (누를 때마다 PIN)
   · 더보기 — 학원비 · 결석·보충 · 기타

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
  mission: (
    /* 과녁 — 미션 관리(🎯)와 같은 뜻. 동심원 둘에 가운데 점 하나 */
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <circle {...S} cx="12" cy="12" r="8.2" />
      <circle {...S} cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <rect {...S} x="3.6" y="5.4" width="16.8" height="14.6" rx="2.6" />
      <path {...S} d="M3.6 10.2h16.8M8.4 3.6v3.4M15.6 3.6v3.4" />
      <path {...S} d="M8 14h2.2M13.8 14H16" />
    </svg>
  ),
  fee: (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <rect {...S} x="3" y="6.4" width="18" height="11.2" rx="2.4" />
      <circle {...S} cx="12" cy="12" r="2.6" />
      <path {...S} d="M6.4 12h.6M17 12h.6" />
    </svg>
  ),
  absence: (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <rect {...S} x="3.6" y="5.4" width="16.8" height="14.6" rx="2.6" />
      <path {...S} d="M3.6 10.2h16.8M8.4 3.6v3.4M15.6 3.6v3.4" />
      <path {...S} d="M9.4 15.4l1.8 1.8 3.4-3.6" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true">
      <circle {...S} cx="12" cy="12" r="3" />
      <path {...S} d="M12 3.4v2.2M12 18.4v2.2M20.6 12h-2.2M5.6 12H3.4M18.1 5.9l-1.6 1.6M7.5 16.5l-1.6 1.6M18.1 18.1l-1.6-1.6M7.5 7.5 5.9 5.9" />
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

/* menu — '더보기'를 누르면 바 바로 위로 올라오는 선택 목록 (사용자 확정 2026-08-09).
   안드로이드 오버플로 메뉴처럼 같은 칸 디자인(선형 아이콘 + 글자)으로 위에 쌓아 보여 준다.
   바깥을 누르면 닫힌다. props: {open, items:[{key,label,icon,active,onPress}], onClose} */
export default function ParentNav({ items = [], accent = "#F58BB0", dim = "#9AA0A6", maxWidth = 430, menu = null }) {
  const open = !!(menu && menu.open);
  return (
    <nav aria-label="엄마 관리 메뉴"
      style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 900, pointerEvents: "none" }}>

      {/* 바깥 어둡게 — 메뉴가 열렸을 때만. 화면 전체를 덮어 아무 데나 누르면 닫힌다 */}
      {open && (
        <div onClick={menu.onClose} aria-hidden="true"
          style={{ position: "fixed", inset: 0, background: "rgba(20,16,14,0.32)",
            pointerEvents: "auto", animation: "navMenuFade .16s ease both" }} />
      )}

      {open && (
        <div style={{ maxWidth, margin: "0 auto", pointerEvents: "auto", position: "relative",
          padding: "0 10px 8px", animation: "navMenuUp .2s cubic-bezier(.34,1.4,.64,1) both" }}>
          <div role="menu" style={{ background: "#FFFDFC", borderRadius: 18, overflow: "hidden",
            border: "1px solid rgba(90,70,60,0.10)", boxShadow: "0 -10px 30px -8px rgba(90,70,60,0.30)" }}>
            {menu.items.map((it, i) => (
              <button key={it.key} type="button" role="menuitem" onClick={it.onPress} className="nav-menu-tap"
                aria-current={it.active ? "page" : undefined}
                style={{ width: "100%", border: "none", background: "none", cursor: "pointer",
                  padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, fontFamily: F,
                  color: it.active ? accent : "#5A5048",
                  borderTop: i === 0 ? "none" : "1px solid rgba(90,70,60,0.08)" }}>
                {NAV_ICONS[it.icon] || NAV_ICONS.more}
                <span style={{ fontSize: 15, fontWeight: it.active ? 900 : 700 }}>{it.label}</span>
                {it.active && <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 900 }}>●</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ maxWidth, margin: "0 auto", pointerEvents: "auto",
        background: "#FFFDFC",                                  // 아주 연한 웜화이트
        borderTop: "1px solid rgba(90,70,60,0.06)",
        boxShadow: "0 -6px 18px -10px rgba(90,70,60,0.28)",
        paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ display: "flex", height: PARENT_NAV_H }}>
          {items.map(it => (
            <button key={it.key} type="button" onClick={it.onPress} className="nav-tap"
              aria-label={it.label} aria-current={it.active ? "page" : undefined}
              style={{ flex: 1, border: "none", background: "none", padding: 0, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 2, fontFamily: F, color: it.active ? accent : dim,
                transition: "color .15s" }}>
              {NAV_ICONS[it.icon] || NAV_ICONS.more}
              <span style={{ fontSize: 10, fontWeight: it.active ? 900 : 700, letterSpacing: -0.2 }}>{it.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

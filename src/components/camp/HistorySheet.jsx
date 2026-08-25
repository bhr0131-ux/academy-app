import { C, CAMP_SHEET } from "../../data/tokens.js";

/* ════════════════════════════════════════════════════════════════════════
   HistorySheet — 탐험 기록 (캐릭터 탭에서 열리는 바텀시트, 캠프 개편 3/6)
   ────────────────────────────────────────────────────────────────────────
   아코디언에 있던 활동 기록 목록을 그대로 옮겼다.
   아코디언 시절엔 페이지가 길어질까 봐 최근 15건에서 잘랐는데,
   시트는 제 스크롤이 있으므로 40건까지 보여 준다 (전체를 다 그리면
   기록이 수백 건인 아이에게서 느려질 수 있어 상한은 남겼다).

   [사용자 지적 2026-08-25] "이제 밝은 수채화 그림으로 바꿨는데 이것만 어두워" —
   탐험(dark) 쪽 헤더·배경·기록 카드를 리스킨 전 어두운 남색 톤에서 CAMP_SHEET
   밝은 크림 팔레트로 바꿨다. 베이커리(cute) 쪽은 그대로.

   props
     open, onClose
     dark     : 탐험 스킨이면 true
     items    : getScoreHistory(childId) 원본 (오래된 것부터 — 여기서 뒤집는다)
     logInfo  : (item) => {icon,title}   App의 getAdventureLogInfo
     logBar   : (item) => 색             App의 getDungeonLogBar (왼쪽 색 띠)
     logName  : 스킨별 이름 ("탐험 기록" 등)
     faint    : 베이커리 옅은 배경 (CT.faint)
     xpEmoji, coinEmoji, gold : 표기 토큰
   ════════════════════════════════════════════════════════════════════════ */
export default function HistorySheet({ open, onClose, dark, items = [], logInfo, logBar,
  logName = "활동 기록", faint, xpEmoji = "⭐", coinEmoji = "💎", gold }) {
  if (!open) return null;

  const list = items.slice().reverse().slice(0, 40);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 4000,
      background: "rgba(20,16,32,0.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, height: "88vh",
        overflow: "hidden", background: dark ? CAMP_SHEET.bodyBg : "#fff", borderRadius: "24px 24px 0 0",
        display: "flex", flexDirection: "column", boxShadow: "0 -12px 40px rgba(0,0,0,0.3)" }}>

        <div style={{ padding: "16px 20px 14px",
          background: dark ? CAMP_SHEET.headerBg : "linear-gradient(160deg,#FDE7EF,#F9C5D6)",
          color: dark ? CAMP_SHEET.headerText : "#6B4A5C", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>📖 {logName}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700,
                color: dark ? CAMP_SHEET.headerTextSub : "#8A6B7A" }}>
                최근 미션·보상·아이템 활동 기록
              </p>
            </div>
            <button onClick={onClose} aria-label="닫기" style={{ border: "none", cursor: "pointer",
              background: dark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.6)",
              color: dark ? "#fff" : "#6B4A5C", borderRadius: 10, width: 30, height: 30,
              fontSize: 15, fontWeight: 900, flexShrink: 0 }}>✕</button>
          </div>
        </div>

        <div style={{ padding: "14px 14px 26px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {list.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 10px" }}>
              <p style={{ fontSize: 42, marginBottom: 8 }}>📖</p>
              <p style={{ fontSize: 15, fontWeight: 900, color: dark ? CAMP_SHEET.text : C.text, margin: "0 0 6px" }}>
                아직 {logName}이 없어요
              </p>
              <p style={{ fontSize: 13, color: dark ? CAMP_SHEET.textSub : C.sub, margin: 0 }}>
                미션을 완료하면 기록이 쌓여요
              </p>
            </div>
          ) : (
            <div>
              {list.map(item => {
                const info = logInfo(item);
                const xp = Number(item.xp ?? 0);
                const coin = Number(item.coin ?? item.point ?? 0);
                const bar = logBar(item);
                return (
                  <div key={item.id} style={dark
                    ? { display: "flex", gap: 12, alignItems: "center", padding: "12px", paddingLeft: 14, borderRadius: 14,
                        background: "#FFFFFF", border: "1px solid #EAD9AE",
                        borderLeft: `4px solid ${bar}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", marginBottom: 8 }
                    : { display: "flex", gap: 12, alignItems: "center", padding: "12px", borderRadius: 14,
                        background: "#fff", border: `1px solid ${C.border}`, marginBottom: 8 }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%",
                      background: dark ? `${bar}18` : faint,
                      border: dark ? `1px solid ${bar}55` : "none",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {info.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: dark ? CAMP_SHEET.text : C.text }}>{info.title}</p>
                      <p style={{ marginTop: 3, fontSize: 13, color: dark ? CAMP_SHEET.textSub : C.sub,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.memo || item.date || ""}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {xp > 0 && <p style={{ margin: 0, color: dark ? "#1E9270" : gold, fontWeight: 900, fontSize: 13 }}>{xpEmoji} +{xp}</p>}
                      {coin !== 0 && <p style={{ margin: "2px 0 0",
                        color: dark ? (coin > 0 ? "#1E9270" : "#D0466A") : (coin > 0 ? C.green : C.red),
                        fontWeight: 900, fontSize: 13 }}>{coinEmoji} {coin > 0 ? "+" : ""}{coin}</p>}
                    </div>
                  </div>
                );
              })}
              {items.length > 40 && (
                <p style={{ textAlign: "center", fontSize: 12, fontWeight: 700, margin: "10px 0 0",
                  color: dark ? CAMP_SHEET.textSub : C.sub }}>
                  최근 40건까지 보여드려요
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

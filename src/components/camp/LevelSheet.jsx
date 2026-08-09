import { PAPER, INK, INK_SUB, BAR_FILL, BAR_TRACK } from "./gridLayout.js";

/* ════════════════════════════════════════════════════════════════════════
   LevelSheet — 가방(레벨 카드)을 누르면 뜨는 레벨 상세 시트 (캠프 개편 7/7)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-09] 가방 카드에는 자리가 좁아 레벨·막대·코인/XP만
   보여 준다. 누르면 예전 캐릭터 탭 상세정보(HERO STATUS)에 있던 내용을
   전부 볼 수 있게 따로 연다 — 캐릭터 진화 모습, 레벨 설명 한 줄,
   다음 레벨까지 남은 XP, 진화 단계 문구.
   ('앞으로의 레벨' 목록은 사용자 확정으로 뺐다 — 아직 못 간 레벨을 늘어놓으면
   지금 레벨이 초라해 보인다. 다음 한 칸만 보여 주는 게 낫다.)

   다른 캠프 시트들과 같은 방식으로 뜨고(open/onClose·바텀시트), 색만
   캐릭터 탭의 종이 톤(PAPER/INK)을 그대로 쓴다 — 가방에서 이어지는
   화면이라 흰 카드로 바뀌면 튄다.

   여기는 '그리기'만 한다 — 값은 전부 App이 계산해 내려 준다.

   props
     open, onClose
     level     : {emoji,level,name}
     nextLevel : {emoji,level,name} | null
     progress  : {percent,currentXp,needXp,remainXp}
     desc      : string   현재 레벨 한 줄 설명 (LEVEL_DESCRIPTION)
     title     : {emoji,name}  전시 중인 상장
     charImg   : string   지금 진화 단계 캐릭터 원화
     evo       : {emoji,name,msg}  진화 단계 이름과 안내 문구
     coin, xp  : 숫자
     labels    : {coin,xp,coinEmoji,xpEmoji}  스킨별 표기
   ════════════════════════════════════════════════════════════════════════ */

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";
const LINE = "rgba(122,100,66,0.22)";
const TILE = "rgba(255,255,255,0.78)";

export default function LevelSheet({
  open, onClose,
  level = { emoji: "🌱", level: 1, name: "새싹 탐험가" }, nextLevel = null,
  progress = { percent: 0, currentXp: 0, needXp: 0, remainXp: 0 },
  desc = "", title = null, charImg = null, evo = null, coin = 0, xp = 0,
  labels = { coin: "코인", xp: "XP", coinEmoji: "💎", xpEmoji: "⭐" },
}) {
  if (!open) return null;
  const pct = Math.max(0, Math.min(100, progress.percent || 0));

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 4000,
      background: "rgba(20,16,32,0.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "88vh",
        overflow: "hidden", background: PAPER, borderRadius: "24px 24px 0 0", fontFamily: F,
        display: "flex", flexDirection: "column", boxShadow: "0 -12px 40px rgba(0,0,0,0.3)" }}>

        {/* ── 머리 — 제목 + 전시 중인 상장 ── */}
        <div style={{ padding: "16px 18px 12px", flexShrink: 0, borderBottom: `1px solid ${LINE}`,
          display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 19, fontWeight: 900, color: INK, flexShrink: 0 }}>🎒 내 레벨</p>
          {title && (
            <span style={{ fontSize: 12, fontWeight: 900, color: INK_SUB, background: TILE,
              border: `1px solid ${LINE}`, borderRadius: 999, padding: "4px 11px", minWidth: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {title.emoji} {title.name}
            </span>
          )}
          <button onClick={onClose} aria-label="닫기" className="jelly-tap"
            style={{ marginLeft: "auto", flexShrink: 0, background: TILE, fontFamily: F,
              border: `1px solid ${LINE}`, borderRadius: 10, width: 30, height: 30,
              cursor: "pointer", color: INK_SUB, fontSize: 15, fontWeight: 900 }}>✕</button>
        </div>

        <div style={{ padding: "14px 18px 30px", overflowY: "auto", WebkitOverflowScrolling: "touch" }}>

          {/* ── 지금 레벨 — 캐릭터 원화 옆에 등급 이름 ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            {charImg && (
              <div style={{ width: 74, height: 74, borderRadius: 22, flexShrink: 0, background: TILE,
                border: `1px solid ${LINE}`, overflow: "hidden",
                display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <img src={charImg} alt="" draggable={false}
                  style={{ display: "block", height: 64, width: "auto", maxWidth: "none" }} />
              </div>
            )}
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: INK, lineHeight: 1.25,
                wordBreak: "keep-all" }}>
                {level.emoji} Lv.{level.level} {level.name}
              </p>
              {desc && <p style={{ margin: "5px 0 0", fontSize: 13, fontWeight: 700, color: INK_SUB,
                lineHeight: 1.5, wordBreak: "keep-all" }}>“{desc}”</p>}
            </div>
          </div>

          {/* ── 진행 막대 — 가방 카드와 같은 모양(발자국 → 깃발) ── */}
          <div style={{ marginTop: 15, display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>👣</span>
            <div style={{ flex: 1, height: 13, borderRadius: 7, background: BAR_TRACK, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 7, background: BAR_FILL,
                transition: "width .5s ease" }} />
            </div>
            <span style={{ fontSize: 15, flexShrink: 0 }}>🚩</span>
          </div>

          {/* ── 다음 레벨까지 ── */}
          <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 8 }}>
            {nextLevel ? (
              <>
                <span style={{ fontSize: 13, fontWeight: 800, color: INK, minWidth: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  다음 {nextLevel.emoji} Lv.{nextLevel.level} {nextLevel.name}
                </span>
                <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: 12.5, fontWeight: 900,
                  color: INK_SUB, whiteSpace: "nowrap" }}>
                  {labels.xpEmoji} {progress.remainXp.toLocaleString()} 남음
                </span>
              </>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 900, color: INK }}>🏆 최고 레벨을 찍었어요!</span>
            )}
          </div>

          {/* ── 보유 코인 · 누적 XP ── */}
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
            {[[labels.coinEmoji, `보유 ${labels.coin}`, coin], [labels.xpEmoji, `누적 ${labels.xp}`, xp]].map(([em, lab, val]) => (
              <div key={lab} style={{ background: TILE, border: `1px solid ${LINE}`, borderRadius: 14,
                padding: "11px 12px", display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
                <span style={{ fontSize: 21, flexShrink: 0 }}>{em}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: INK_SUB, whiteSpace: "nowrap" }}>{lab}</p>
                  <p style={{ margin: "1px 0 0", fontSize: 18, fontWeight: 900, color: INK,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{val.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── 진화 단계 — 지금 모습이 어떤 단계인지 한 줄로 ── */}
          {evo && (evo.name || evo.msg) && (
            <div style={{ marginTop: 10, background: TILE, border: `1px solid ${LINE}`, borderRadius: 14,
              padding: "11px 13px" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: INK }}>
                {evo.emoji ? `${evo.emoji} ` : "🧬 "}{evo.name}
              </p>
              {evo.msg && <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 700, color: INK_SUB,
                lineHeight: 1.55, wordBreak: "keep-all" }}>{evo.msg}</p>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

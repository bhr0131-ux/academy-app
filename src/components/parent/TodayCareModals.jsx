/* ════════════════════════════════════════════════════════════════════════
   TodayCareModals — 엄마용 홈 '오늘 챙길 일' 칩을 눌렀을 때 뜨는 확인 팝업
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-07] 칩이 개수만 알려 주고 끝나던 것을 눌러서 내용까지
   볼 수 있게 했다. 준비물과 미션은 팝업으로 열고, 보상승인·결석·보충수업은
   해당 탭으로 보낸다(그쪽에 이미 처리 화면이 있으므로 팝업을 새로 만들지 않는다).

   여기는 '그리기'만 한다 — 데이터 계산과 저장은 전부 App에 남고, 이 파일은
   받은 목록을 늘어놓을 뿐이다. 그래서 저장 키·집계 로직은 건드리지 않는다.

   ── SupplyCheckModal (🎒 준비물) ──
   그날 수업이 있는 학원별로 준비물을 묶어 보여 주고, 아이가 탐험일지에서
   체크했는지(✅/⬜)를 그대로 비춘다. 여기서는 보기만 한다 — 체크는 아이 몫이라
   엄마가 대신 누르면 아이 화면의 뜻이 흐려진다.

   ── MissionCheckModal (🎯 미완료 미션) ──
   숙제와 미션을 한 목록으로 합쳐(사용자 확정: 둘을 나누지 않고 '미션'으로 통일)
   학원별로 묶는다. 위쪽에 남은 것, 가운데 구분선, 아래쪽에 완료된 것.
   실패 처리된 항목은 완료 쪽에 '실패'로 표시한다 — 숫자에서만 빠지고
   목록에서 사라지면 어디 갔는지 알 수 없다.

   props (둘 다 공통)
     dateLabel : string   '오늘' / '8월 7일' 처럼 화면에 쓸 날짜 이름
     groups    : 아래 각 컴포넌트 설명 참고
     tone      : {text,sub,border,faint,green,red,orange,main} 색 토큰
     onClose   : ()=>void
   ════════════════════════════════════════════════════════════════════════ */

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

/* 바텀시트 껍데기 — 앱의 다른 엄마용 팝업(지난 미션 보기)과 같은 모양 */
function Sheet({ title, desc, tone, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,20,40,0.55)",
      display: "flex", alignItems: "flex-end", zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "22px 22px 0 0",
        padding: "22px 18px 44px", width: "100%", maxWidth: 430, boxSizing: "border-box",
        maxHeight: "82vh", overflowY: "auto", fontFamily: F }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: tone.text }}>{title}</h3>
          <button onClick={onClose} aria-label="닫기"
            style={{ background: tone.faint, border: "none", borderRadius: 10, width: 28, height: 28,
              cursor: "pointer", color: tone.sub, fontSize: 15, fontFamily: F }}>✕</button>
        </div>
        {desc && <p style={{ fontSize: 13, color: tone.sub, fontWeight: 600, margin: "0 0 14px" }}>{desc}</p>}
        {children}
      </div>
    </div>
  );
}

/* 학원 한 칸의 머리 — 이모지 + 학원명 + 오른쪽 요약 */
function AcHead({ icon, name, color, right, tone }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{icon || "📘"}</span>
      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 900, color: tone.text, minWidth: 0,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
      {right && <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: 11.5, fontWeight: 900,
        color: color || tone.sub }}>{right}</span>}
    </div>
  );
}

function Empty({ emoji, title, sub, tone }) {
  return (
    <div style={{ textAlign: "center", padding: "28px 10px", color: tone.sub }}>
      <p style={{ fontSize: 32, margin: 0 }}>{emoji}</p>
      <p style={{ fontSize: 14, fontWeight: 800, margin: "8px 0 0", color: tone.text }}>{title}</p>
      {sub && <p style={{ fontSize: 12, margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

/* ── 🎒 준비물 ────────────────────────────────────────────────────────────
   groups : [{ acId, name, icon, color, items:[{ key, label, checked, extra }] }]
            extra=true 면 그날만 추가한 준비물(기본 준비물과 구분해 '+' 표시)     */
export function SupplyCheckModal({ dateLabel = "오늘", groups = [], tone, onClose }) {
  const all = groups.reduce((n, g) => n + g.items.length, 0);
  const got = groups.reduce((n, g) => n + g.items.filter(i => i.checked).length, 0);
  return (
    <Sheet title="🎒 준비물 확인" tone={tone} onClose={onClose}
      desc={all === 0 ? undefined : `${dateLabel} 준비물 ${all}개 중 아이가 ${got}개 챙겼어요. 체크는 아이가 탐험일지에서 합니다.`}>
      {all === 0 ? (
        <Empty emoji="🎒" title="챙길 준비물이 없어요" sub="학원에 기본 준비물을 등록하면 여기에 보여요" tone={tone} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map(g => {
            const gGot = g.items.filter(i => i.checked).length;
            const done = gGot === g.items.length;
            return (
              <div key={g.acId} style={{ padding: "12px 13px", borderRadius: 14,
                border: `1.5px solid ${done ? tone.green + "55" : tone.border}`,
                background: done ? tone.green + "0C" : tone.faint }}>
                <AcHead icon={g.icon} name={g.name} tone={tone}
                  color={done ? tone.green : tone.sub} right={`${gGot} / ${g.items.length}`} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {g.items.map(it => (
                    <span key={it.key} style={{ fontSize: 12.5, fontWeight: 800, padding: "5px 11px", borderRadius: 999,
                      whiteSpace: "nowrap",
                      background: it.checked ? tone.green + "1F" : "#fff",
                      border: `1px solid ${it.checked ? tone.green + "88" : tone.border}`,
                      color: it.checked ? tone.green : tone.sub }}>
                      {it.checked ? "✅" : "⬜"} {it.extra ? "+" : ""}{it.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Sheet>
  );
}

/* ── 🎯 미완료 미션 ───────────────────────────────────────────────────────
   groups : { remain:[학원묶음], done:[학원묶음] }
            학원묶음 = { acId, name, icon, color, items:[{ key, label, kind, failed }] }
            kind: "homework" | "todo"  (표시만 다르고 취급은 같다)                */
export function MissionCheckModal({ dateLabel = "오늘", groups = { remain: [], done: [] }, tone, onClose }) {
  const cnt = (list) => list.reduce((n, g) => n + g.items.length, 0);
  const nRemain = cnt(groups.remain), nDone = cnt(groups.done);

  const Row = ({ it, faded }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0" }}>
      <span style={{ fontSize: 13, flexShrink: 0, opacity: faded ? 0.55 : 1 }}>
        {it.failed ? "✖️" : faded ? "✅" : it.kind === "homework" ? "📝" : "🎯"}
      </span>
      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, minWidth: 0, flex: 1,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        color: it.failed ? tone.red : faded ? tone.sub : tone.text,
        textDecoration: faded && !it.failed ? "line-through" : "none" }}>{it.label}</p>
      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 900, color: tone.sub, opacity: 0.8 }}>
        {it.failed ? "실패" : it.kind === "homework" ? "숙제" : "미션"}
      </span>
    </div>
  );

  const Section = ({ list, faded }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {list.map(g => (
        <div key={g.acId} style={{ padding: "11px 13px", borderRadius: 14,
          border: `1.5px solid ${tone.border}`, background: faded ? "#fff" : tone.faint,
          opacity: faded ? 0.9 : 1 }}>
          <AcHead icon={g.icon} name={g.name} tone={tone} color={g.color}
            right={`${g.items.length}개`} />
          <div style={{ borderTop: `1px solid ${tone.border}`, paddingTop: 2 }}>
            {g.items.map(it => <Row key={it.key} it={it} faded={faded} />)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Sheet title="🎯 미션 확인" tone={tone} onClose={onClose}
      desc={`${dateLabel} 숙제와 미션이에요. 남은 것이 위, 끝낸 것이 아래에 있어요.`}>
      {nRemain + nDone === 0 ? (
        <Empty emoji="🗒️" title="이 날은 미션이 없어요" sub="학원별로 숙제나 미션을 넣으면 여기에 보여요" tone={tone} />
      ) : (
        <>
          {/* 위 — 남은 것 */}
          <p style={{ margin: "0 0 8px", fontSize: 12.5, fontWeight: 900, color: nRemain ? tone.orange : tone.green }}>
            {nRemain ? `아직 남은 미션 ${nRemain}개` : "남은 미션 없음 — 다 끝냈어요! 🎉"}
          </p>
          {nRemain > 0 && <Section list={groups.remain} faded={false} />}

          {/* 가운데 구분선 (사용자 확정: 남은 것과 끝낸 것을 줄로 나눈다) */}
          <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "18px 0 12px" }}>
            <span style={{ flex: 1, height: 1, background: tone.border }} />
            <span style={{ fontSize: 11.5, fontWeight: 900, color: tone.sub, whiteSpace: "nowrap" }}>
              끝낸 미션 {nDone}개
            </span>
            <span style={{ flex: 1, height: 1, background: tone.border }} />
          </div>

          {/* 아래 — 끝낸 것 */}
          {nDone > 0
            ? <Section list={groups.done} faded />
            : <p style={{ margin: 0, textAlign: "center", fontSize: 12.5, fontWeight: 700, color: tone.sub, padding: "6px 0 2px" }}>
                아직 끝낸 미션이 없어요
              </p>}
        </>
      )}
    </Sheet>
  );
}

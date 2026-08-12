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
   체크했는지(✅/⬜)를 그대로 비춘다. [사용자 확정 2026-08-07] 엄마도 여기서
   눌러 체크할 수 있다 — 아이 탐험일지와 같은 저장을 쓰므로 양쪽이 같이 바뀐다.

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
     onToggle  : (acId, key)=>void   준비물만. key는 아이 탐험일지와 같은 규칙
                 (기본 준비물은 이름 그대로, 그날 추가분은 앞에 '+')
   ════════════════════════════════════════════════════════════════════════ */

import CareIcon from "./CareIcons.jsx";

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

/* [사용자 확정 2026-08-11] 제목의 🎒 🎯, 체크의 ✅ ⬜, 줄머리의 📝 ✖️ 가 전부
   운영체제 이모지라 기기마다 그림체가 달랐다 → 앱의 선 아이콘(CareIcon)으로 맞춘다.
   색은 감싼 쪽 color 하나로 정해지므로 완료/실패 색과 저절로 같아진다.
   ※ 학원 머리의 아이콘(g.icon)은 학원 '종류'를 나타내는 표식이라 그대로 둔다. */

/* 바텀시트 껍데기 — 앱의 다른 엄마용 팝업(지난 미션 보기)과 같은 모양

   [사용자 확정 2026-08-09] 시트 높이는 내용에 따라 달라진다 — 항목이 하나뿐인데
   화면 절반을 차지하면 비어 보인다. 그래서 높이를 따로 정하지 않고(auto) 최대치만
   막아 두고, 아래 여백도 44px → 안전영역 + 26px 으로 줄였다.
   위쪽 짧은 손잡이 막대는 '아래로 내려 닫는 창'이라는 신호다(장식이라 눌리지 않는다). */
function Sheet({ title, icon, desc, tone, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,20,40,0.55)",
      display: "flex", alignItems: "flex-end", zIndex: 1000 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "22px 22px 0 0",
        padding: "10px 18px calc(26px + env(safe-area-inset-bottom))", width: "100%", maxWidth: 430,
        boxSizing: "border-box", maxHeight: "74vh", overflowY: "auto", fontFamily: F }}>
        {/* 드래그 손잡이 (장식) */}
        <div aria-hidden="true" style={{ width: 38, height: 4, borderRadius: 999,
          background: tone.border, margin: "0 auto 12px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: tone.text,
            display: "flex", alignItems: "center", gap: 7 }}>
            {icon && <span style={{ color: tone.main, display: "flex" }}><CareIcon name={icon} size={17} /></span>}
            {title}
          </h3>
          <button onClick={onClose} aria-label="닫기" className="jelly-tap"
            style={{ background: tone.faint + "88", border: "none", borderRadius: 10, width: 28, height: 28,
              cursor: "pointer", color: tone.sub, fontSize: 15, fontFamily: F }}>✕</button>
        </div>
        {desc && <p style={{ fontSize: 12, color: tone.sub, fontWeight: 600, margin: "0 0 13px", lineHeight: 1.45 }}>{desc}</p>}
        {children}
      </div>
    </div>
  );
}

/* 학원 한 칸의 머리 — 이모지 + 학원명 + 오른쪽 요약
   오른쪽 요약(개수)은 아래 미션 줄의 종류 꼬리표와 '같은 폭의 오른쪽 칸'을 쓴다.
   (사용자 지적: 1개 / 숙제 가 서로 다른 기준선에 걸려 보였다 — TAIL_W 로 맞춘다) */
const TAIL_W = 30;

function AcHead({ icon, name, color, right, tone }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
      <span style={{ fontSize: 15, flexShrink: 0, display: "flex", alignItems: "center", color: tone.sub }}>
        {icon || <CareIcon name="school" size={15} />}
      </span>
      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 900, color: tone.text, minWidth: 0, flex: 1,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
      {right && <span style={{ flexShrink: 0, minWidth: TAIL_W, textAlign: "right", fontSize: 11.5,
        fontWeight: 900, color: color || tone.sub }}>{right}</span>}
    </div>
  );
}

function Empty({ icon, title, sub, tone }) {
  return (
    <div style={{ textAlign: "center", padding: "22px 10px 10px", color: tone.sub }}>
      {/* 이모지 32px 한 글자 대신, 연한 동그라미 안에 선 아이콘 —
          미션 탭·지난 미션 팝업의 빈 상태와 같은 모양이다 (사용자 확정 2026-08-11) */}
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 52, height: 52, borderRadius: "50%", background: tone.faint, color: tone.sub }}>
        <CareIcon name={icon} size={26} />
      </span>
      <p style={{ fontSize: 14, fontWeight: 800, margin: "8px 0 0", color: tone.text }}>{title}</p>
      {sub && <p style={{ fontSize: 12, margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

/* ── 🎒 준비물 ────────────────────────────────────────────────────────────
   groups : [{ acId, name, icon, color, items:[{ key, toggleKey, label, checked, extra }] }]
            extra=true 면 그날만 추가한 준비물(기본 준비물과 구분해 '+' 표시)     */
export function SupplyCheckModal({ dateLabel = "오늘", groups = [], tone, onClose, onToggle }) {
  const all = groups.reduce((n, g) => n + g.items.length, 0);
  const got = groups.reduce((n, g) => n + g.items.filter(i => i.checked).length, 0);
  return (
    /* [사용자 확정 2026-08-12] desc 앞머리 '오늘 준비물 N개 중 M개 챙겼어요'는 뺐다 —
       바로 아래 목록이 학원별로 몇 개 챙겼는지 그대로 보여서 같은 말이 두 번이었다. */
    <Sheet title="준비물 확인" icon="bag" tone={tone} onClose={onClose}
      desc={all === 0 ? undefined : "눌러서 체크할 수 있고, 아이 탐험일지에도 똑같이 반영됩니다."}>
      {all === 0 ? (
        <Empty icon="bag" title="챙길 준비물이 없어요" sub="학원에 기본 준비물을 등록하면 여기에 보여요" tone={tone} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map(g => {
            const gGot = g.items.filter(i => i.checked).length;
            const done = gGot === g.items.length;
            return (
              <div key={g.acId} style={{ padding: "10px 12px", borderRadius: 14,
                border: `1.5px solid ${done ? tone.green + "55" : tone.border}`,
                background: done ? tone.green + "0C" : tone.faint }}>
                <AcHead icon={g.icon} name={g.name} tone={tone}
                  color={done ? tone.green : tone.sub} right={`${gGot} / ${g.items.length}`} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {g.items.map(it => (
                    <button key={it.key} onClick={() => onToggle && onToggle(g.acId, it.toggleKey)}
                      className="jelly-tap"
                      aria-label={`${it.label} ${it.checked ? "체크 해제" : "체크"}`}
                      style={{ fontFamily: F, fontSize: 12.5, fontWeight: 800, padding: "6px 11px", borderRadius: 999,
                        whiteSpace: "nowrap", cursor: onToggle ? "pointer" : "default",
                        background: it.checked ? tone.green + "1F" : "#fff",
                        border: `1px solid ${it.checked ? tone.green + "88" : tone.border}`,
                        color: it.checked ? tone.green : tone.sub,
                        display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <CareIcon name={it.checked ? "check" : "checkEmpty"} size={14} />
                      {it.extra ? "+" : ""}{it.label}
                    </button>
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
      <span style={{ flexShrink: 0, display: "flex", opacity: faded ? 0.75 : 1,
        color: it.failed ? tone.red : faded ? tone.green : tone.sub }}>
        <CareIcon name={it.failed ? "absent" : faded ? "check" : it.kind === "homework" ? "memo" : "mission"} size={14} />
      </span>
      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, minWidth: 0, flex: 1,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        color: it.failed ? tone.red : faded ? tone.sub : tone.text,
        /* [사용자 확정 2026-08-10] 흐린 글자 + 취소선이 겹쳐 읽기 어려웠다.
           앞의 체크 표시가 이미 완료를 뜻하므로 취소선은 뺀다 (실패만 남긴다). */
        textDecoration: it.failed ? "line-through" : "none" }}>{it.label}</p>
      {/* 종류 꼬리표 — 위 학원 머리의 '개수'와 같은 오른쪽 칸(TAIL_W)에 맞춰 세로로 줄 세운다 */}
      <span style={{ flexShrink: 0, minWidth: TAIL_W, textAlign: "right", fontSize: 11,
        fontWeight: 700, color: tone.sub, opacity: 0.8 }}>
        {it.failed ? "실패" : it.kind === "homework" ? "숙제" : "미션"}
      </span>
    </div>
  );

  const Section = ({ list, faded }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {list.map(g => (
        <div key={g.acId} style={{ padding: "9px 12px 8px", borderRadius: 14,
          border: `1px solid ${tone.border}`, background: faded ? "#fff" : tone.faint,
          opacity: faded ? 0.95 : 1 }}>
          <AcHead icon={g.icon} name={g.name} tone={tone} color={g.color}
            right={`${g.items.length}개`} />
          <div style={{ borderTop: `1px solid ${tone.border}`, paddingTop: 1 }}>
            {g.items.map(it => <Row key={it.key} it={it} faded={faded} />)}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Sheet title="미션 확인" icon="mission" tone={tone} onClose={onClose}
      desc={`${dateLabel} 남은 미션을 확인해 주세요.`}>
      {nRemain + nDone === 0 ? (
        <Empty icon="memo" title="이 날은 미션이 없어요" sub="학원별로 숙제나 미션을 넣으면 여기에 보여요" tone={tone} />
      ) : (
        <>
          {/* 위 — 남은 것.
              [사용자 확정 2026-08-09] 줄 전체를 주황으로 칠하면 경고처럼 보인다 —
              글은 본문 색으로 두고 숫자만 강조한다. */}
          <p style={{ margin: "0 0 8px", fontSize: 12.5, fontWeight: 800,
            color: nRemain ? tone.text : tone.green }}>
            {nRemain
              ? <>아직 남은 미션 <b style={{ fontWeight: 900, color: tone.orange }}>{nRemain}개</b></>
              : "남은 미션 없음 — 다 끝냈어요!"}
          </p>
          {nRemain > 0 && <Section list={groups.remain} faded={false} />}

          {/* 가운데 구분선 (사용자 확정: 남은 것과 끝낸 것을 줄로 나눈다)
              끝낸 것이 0개면 나눌 게 없으므로 구분선째 감춘다 — 빈 줄만 남아 시트가 길어진다. */}
          {nDone > 0 && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 9, margin: "16px 0 11px" }}>
                <span style={{ flex: 1, height: 1, background: tone.border }} />
                <span style={{ fontSize: 11.5, fontWeight: 800, color: tone.sub, whiteSpace: "nowrap" }}>
                  끝낸 미션 {nDone}개
                </span>
                <span style={{ flex: 1, height: 1, background: tone.border }} />
              </div>
              <Section list={groups.done} faded />
            </>
          )}
        </>
      )}
    </Sheet>
  );
}

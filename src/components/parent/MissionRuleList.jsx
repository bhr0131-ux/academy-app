/* ════════════════════════════════════════════════════════════════════════
   MissionRuleList — 미션 탭 '전체 미션' 아래 '반복 설정된 미션' 목록
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-11-23] 미션 창 안에 있던 '반복 중인 미션' 칩을 빼고,
   미션 탭 아래쪽 '전체 미션'에 오늘의 미션과 함께 쭉 늘어놓는다.
   줄마다 [반복 종류] 미션 이름 / 학원 · +점 · +코인 / '반복 끄기'.
   반복을 끄면 이미 들어간 그날 미션은 남고, 다음부터 새로 생기지 않는다(stopMissionRule).
   그리기만 한다 — 저장(v6_mission_rules)은 App 이 한다.

   props
     rules      : [{id, acId, text, point, coin, type, days, start}]
     acInfo(id) : {name, color}   학원 이름·색 (생활 습관 미션은 App 이 이름을 채워 준다)
     coinOf(r)  : 그 규칙으로 받는 코인
     th, TM     : 테마색 / 용어 (TM.xpUnit, TM.coin)
     onStop(id) : 반복 끄기
   ════════════════════════════════════════════════════════════════════════ */

import { C, FS, FW, RAD, DEFAULT_HOMEWORK_SCORE } from "../../data/tokens.js";
import CareIcon from "./CareIcons.jsx";

const ruleText = (r) => r.type === "class" ? "학원 가는 날" : r.type === "daily" ? "매일" : `${(r.days || []).join("·")}요일`;

export default function MissionRuleList({ rules = [], acInfo, coinOf, th, TM, onStop }) {
  if (!rules.length) {
    return (
      <p style={{ margin: "2px 0 0", padding: "14px 10px", textAlign: "center", fontSize: FS.sub, fontWeight: FW.semi,
        color: C.sub, background: "#fff", border: `1px dashed ${C.border}`, borderRadius: RAD.md }}>
        반복 설정된 미션이 없어요
      </p>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {rules.map(r => {
        const ac = acInfo(r.acId);
        return (
          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: RAD.md, background: "#fff", border: `1px solid ${C.border}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text, lineHeight: 1.35, overflowWrap: "anywhere" }}>
                {r.text}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5, minWidth: 0, flexWrap: "wrap", rowGap: 5 }}>
                <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3, fontSize: FS.tag, fontWeight: FW.bold,
                  color: th.main, background: `${th.main}14`, borderRadius: 8, padding: "2px 7px" }}>
                  <CareIcon name="repeat" size={11} />{ruleText(r)}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, fontSize: FS.sub, color: C.sub }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: ac.color || th.main, flexShrink: 0 }} />
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ac.name}</span>
                </span>
                <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: `${C.orange}14`, color: C.orange }}>
                  +{DEFAULT_HOMEWORK_SCORE}{(TM && TM.xpUnit) || "점"}
                </span>
                <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, padding: "2px 8px", borderRadius: 20, background: "#2E8FD614", color: "#2E8FD6" }}>
                  +{coinOf(r)}{(TM && TM.coin) || "코인"}
                </span>
              </div>
            </div>
            <button onClick={() => onStop && onStop(r.id)} className="jelly-tap" aria-label={`${r.text} 반복 끄기`}
              style={{ flexShrink: 0, border: `1px solid ${C.border}`, background: "#fff", color: C.sub, borderRadius: RAD.sm,
                padding: "6px 10px", fontSize: FS.tag, fontWeight: FW.semi, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
              반복 끄기
            </button>
          </div>
        );
      })}
    </div>
  );
}

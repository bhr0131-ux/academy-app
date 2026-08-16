import { C } from "../../data/tokens.js";
import CareIcon from "./CareIcons.jsx";

/* ════════════════════════════════════════════════════════════════════════
   XpAdjustCard — '수동 점수 조정' 칸
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-16] 보상 탭에서 '기타' 탭으로 옮기고 비밀번호로 잠갔다.
   점수를 직접 더하고 빼는 자리라, 잠금 없이 두면 아이가 🎒 버튼으로 엄마 관리에
   넘어와 자기 점수를 올릴 수 있다 (엄마용 진입 자체에는 비밀번호가 없다).
   잠금은 미션·보상과 같은 스위치(rewardUnlocked)를 쓴다 — 한 번 풀면 셋 다 열린다.

   잠긴 동안에는 제목 앞에 자물쇠가 붙고, 눌러도 펼쳐지지 않고 비밀번호부터 묻는다.
   통과하면 그 자리에서 바로 펼쳐진다.
   ════════════════════════════════════════════════════════════════════════ */
export default function XpAdjustCard({ D }) {
  const {
    TM, th, card, secTitle, secSub, secArrow,
    open, setOpen, locked, unlock,
    childId, addChildScore, showToast,
    sign, setSign, label, setLabel, input, setInput,
  } = D;

  const onHead = () => {
    if (locked) { unlock(() => setOpen(true)); return; }   // 통과 후 바로 펼친다
    setOpen(!open);
  };

  return (
    <div style={card}>
      <button onClick={onHead}
        style={{ width: "100%", border: "none", background: "transparent", padding: 0, display: "flex",
          alignItems: "center", justifyContent: "space-between", cursor: "pointer", fontFamily: "inherit" }}>
        <div style={{ textAlign: "left", minWidth: 0 }}>
          <p style={{ ...secTitle, display: "flex", alignItems: "center", gap: 6 }}>
            {locked && <span style={{ color: th.main, display: "flex" }}><CareIcon name="lock" size={14} /></span>}
            수동 {TM.xp} 조정
          </p>
          <p style={secSub}>{locked ? "비밀번호를 한 번 물어봐요" : `보너스 지급 / ${TM.xp} 차감`}</p>
        </div>
        {!locked && <span aria-hidden="true" style={secArrow(open)}>⌄</span>}
      </button>

      {!locked && open && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <button onClick={() => setSign("+")}
              style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1.5px solid ${sign === "+" ? C.green : C.border}`,
                background: sign === "+" ? `${C.green}15` : "#fff", color: sign === "+" ? C.green : C.sub,
                fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
              + 지급
            </button>
            <button onClick={() => setSign("-")}
              style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1.5px solid ${sign === "-" ? C.red : C.border}`,
                background: sign === "-" ? `${C.red}10` : "#fff", color: sign === "-" ? C.red : C.sub,
                fontSize: 13, fontWeight: 900, cursor: "pointer" }}>
              - 차감
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="사유"
              style={{ flex: 1, padding: "9px 10px", borderRadius: 10, border: `1px solid ${C.border}`,
                fontSize: 13, outline: "none", background: "#fff", minWidth: 0 }} />
            <input type="number" value={input} onChange={e => setInput(e.target.value)} placeholder={TM.xp}
              style={{ width: 58, padding: "9px 6px", borderRadius: 10, border: `1px solid ${C.border}`,
                fontSize: 13, outline: "none", background: "#fff", textAlign: "center", flexShrink: 0 }} />
            <button onClick={() => {
              const v = Number(input);
              if (!v || v <= 0) { showToast(`${TM.xp} 값을 입력해줘`); return; }
              addChildScore(childId, sign === "+" ? v : -v, label || "수동 조정", "manual");
              setInput(""); setLabel("");
              showToast(sign === "+" ? `+${v}${TM.xpUnit} 지급 완료` : `-${v}${TM.xpUnit} 차감 완료`);
            }} style={{ padding: "9px 14px", borderRadius: 10, border: "none",
              background: sign === "+" ? C.green : C.red, color: "#fff",
              fontSize: 13, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}>
              {sign === "+" ? "지급" : "차감"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   FeePaySheet — 학원비 '납부 완료 처리' 바텀시트
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-09] 학원비 탭에서 미납 카드의 '납부 완료 처리'를 누르면
   열린다. 계좌이체·카드·현금으로 실제 결제는 앱 밖에서 하고, 여기서는 '언제
   얼마를 어떻게 냈는지'만 기록한다.

   저장은 App이 한다 — 여기는 입력만 받아 onSave로 넘긴다.
   기록은 새 저장 키(v6_fee_pay_info)에 들어가고, 기존 납부 여부(v6_paid)는
   그대로 둔다. 기록이 없어도 납부 여부는 예전과 똑같이 동작한다.

   props
     ac       : 학원 {id,name,fee,payDay,color}
     month    : 1~12  (어느 달 학원비인지)
     value    : {date,amount,method,memo} | null   이미 기록이 있으면 채워서 연다
     onClose  : ()=>void
     onSave   : ({date,amount,method,memo})=>void
     onUnpay  : ()=>void        이미 납부 처리된 건을 되돌린다 (기록이 있을 때만 보임)
     tone     : {text,sub,border,faint,green,red,orange,main,grad}

   [사용자 확정 2026-08-17] '학원비 수정'(월 학원비·납부일)과 '납부 기록'이 각각
   다른 시트로 떠 같은 학원비를 두 군데서 만지게 됐다 → 이 시트 하나로 합친다.
     showFee=true     월 학원비 · 납부일 칸을 위에 둔다 (⋮ > 학원비 수정)
     showRecord=true  낸 날·금액·방법·메모 칸을 둔다 (미납 카드의 '납부 완료로 저장',
                      그리고 이미 낸 학원을 ⋮ 로 열었을 때)
   onSave 는 둘을 한 번에 넘긴다 — 받는 쪽(App)이 필요한 것만 쓴다.
   ════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";

const F = "'Cafe24Ssurround','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

/* 결제 방법 — 이 세 가지로 충분하다는 사용자 확정. 값(키)은 저장에 들어가므로 바꾸지 않는다. */
export const PAY_METHODS = [
  { key: "transfer", label: "계좌이체" },
  { key: "card",     label: "카드" },
  { key: "cash",     label: "현금" },
];
export const payMethodLabel = (k) => PAY_METHODS.find(m => m.key === k)?.label || "";
const won = (v) => { const n = String(v ?? "").replace(/[^0-9]/g, ""); return n ? Number(n).toLocaleString() : ""; };

export default function FeePaySheet({ ac, month, value, today, onClose, onSave, onUnpay, tone,
  showFee = false, showRecord = true }) {
  const editing = !!value;
  const [date,   setDate]   = useState(value?.date || today);
  const [amount, setAmount] = useState(String(value?.amount ?? ac?.fee ?? ""));
  const [method, setMethod] = useState(value?.method || "transfer");
  const [memo,   setMemo]   = useState(value?.memo || "");
  const [feeV,     setFeeV]     = useState(String(ac?.fee ?? ""));
  const [payDayV,  setPayDayV]  = useState(String(ac?.payDay ?? 1));
  const [askUnpay, setAskUnpay] = useState(false);   // 되돌리기 확인 (한 번 더 묻는다)
  if (!ac) return null;

  const inp = { width: "100%", boxSizing: "border-box", background: tone.faint,
    border: `1px solid ${tone.border}`, borderRadius: 12, padding: "11px 13px",
    fontSize: 15, color: tone.text, outline: "none", fontFamily: F, fontWeight: 700 };
  const lbl = { display: "block", fontSize: 12, fontWeight: 700, color: tone.sub, margin: "0 0 5px" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,20,40,0.55)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "22px 22px 0 0",
        padding: "10px 18px calc(26px + env(safe-area-inset-bottom))", width: "100%", maxWidth: 430,
        boxSizing: "border-box", maxHeight: "88vh", overflowY: "auto", fontFamily: F }}>
        {/* 드래그 손잡이 (장식) — 다른 바텀시트와 같은 모양 */}
        <div aria-hidden="true" style={{ width: 38, height: 4, borderRadius: 999,
          background: tone.border, margin: "0 auto 12px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <div style={{ width: 4, height: 20, borderRadius: 10, background: ac.color, flexShrink: 0 }} />
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: tone.text, minWidth: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ac.name}</h3>
          <button onClick={onClose} aria-label="닫기" className="jelly-tap"
            style={{ marginLeft: "auto", background: tone.faint + "88", border: "none", borderRadius: 10,
              width: 28, height: 28, cursor: "pointer", color: tone.sub, fontSize: 15, fontFamily: F }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: tone.sub, fontWeight: 600, margin: "0 0 15px" }}>
          {showRecord
            ? `${month}월 학원비 · 낸 날과 방법을 남겨 두면 나중에 확인하기 좋아요.`
            : "매달 얼마를 언제 내는지 적어 두면 학원비 탭이 알아서 챙겨 줘요."}
        </p>

        {/* 학원비 설정 — ⋮ > 학원비 수정으로 열었을 때만. 매달 바뀌지 않는 값이라 위에 둔다. */}
        {showFee && (<>
          <label style={lbl}>월 학원비 (원)</label>
          <div style={{ position: "relative", marginBottom: 13 }}>
            <input type="text" inputMode="numeric" value={won(feeV)}
              onChange={e => setFeeV(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="예: 150,000"
              style={{ ...inp, paddingRight: 38, textAlign: "right", fontSize: 16 }} />
            <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
              fontSize: 14, fontWeight: 700, color: tone.sub, pointerEvents: "none" }}>원</span>
          </div>

          <label style={lbl}>납부일 (매월)</label>
          <div style={{ position: "relative", marginBottom: showRecord ? 20 : 18 }}>
            <input type="text" inputMode="numeric" value={payDayV}
              onChange={e => setPayDayV(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
              placeholder="예: 5"
              style={{ ...inp, paddingRight: 38, textAlign: "right", fontSize: 16 }} />
            <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
              fontSize: 14, fontWeight: 700, color: tone.sub, pointerEvents: "none" }}>일</span>
          </div>
        </>)}

        {/* 납부 기록 — 이번 달에 실제로 낸 내용. 두 묶음이 한 시트에 있으니 선으로 나눈다. */}
        {showFee && showRecord && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 14px" }}>
            <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 900, color: tone.text }}>{month}월 납부 기록</span>
            <div style={{ flex: 1, height: 1, background: tone.border }} />
          </div>
        )}

        {showRecord && (<>
        <label style={lbl}>납부일</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, marginBottom: 13 }} />

        <label style={lbl}>납부 금액</label>
        {/* 금액은 천 단위 쉼표를 넣어 보여준다 — 학원 등록 화면의 학원비 칸과 같은 방식.
            type="number" 로는 쉼표를 못 넣어서 text + inputMode="numeric" 으로 쓴다. */}
        <div style={{ position: "relative", marginBottom: 13 }}>
          <input type="text" inputMode="numeric" value={won(amount)}
            onChange={e => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={won(ac.fee || 0)}
            style={{ ...inp, paddingRight: 38, textAlign: "right", fontSize: 16 }} />
          <span style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)",
            fontSize: 14, fontWeight: 700, color: tone.sub, pointerEvents: "none" }}>원</span>
        </div>

        <label style={lbl}>결제 방법</label>
        <div style={{ display: "flex", gap: 7, marginBottom: 13 }}>
          {PAY_METHODS.map(m => {
            const on = method === m.key;
            return (
              <button key={m.key} onClick={() => setMethod(m.key)} className="jelly-tap"
                style={{ flex: 1, padding: "10px 0", borderRadius: 12, cursor: "pointer", fontFamily: F,
                  fontSize: 13.5, fontWeight: on ? 900 : 700,
                  border: `1.5px solid ${on ? tone.main : tone.border}`,
                  background: on ? `${tone.main}14` : "#fff", color: on ? tone.main : tone.sub }}>
                {m.label}
              </button>
            );
          })}
        </div>

        <label style={lbl}>메모 (선택)</label>
        <input value={memo} onChange={e => setMemo(e.target.value)} placeholder="예: 교재비 포함"
          style={{ ...inp, marginBottom: 18 }} />
        </>)}

        <button onClick={() => onSave({ date, amount: Math.max(0, Number(amount || 0)), method, memo: memo.trim(),
          fee: Math.max(0, Number(feeV || 0)), payDay: Math.min(31, Math.max(1, Number(payDayV || 1))) })}
          className="jelly-tap"
          style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", background: tone.grad,
            color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer", fontFamily: F }}>
          {!showRecord || editing ? "저장하기" : "납부 완료로 저장"}
        </button>

        {/* 되돌리기는 잘못 눌렀을 때만 쓴다.
            [사용자 확정 2026-08-10] 저장 버튼과 너무 가까워 잘못 누를 수 있어 간격을 22px로
            벌리고, 회색 밑줄 대신 연한 빨강으로. 누르면 바로 지우지 않고 한 번 더 묻는다. */}
        {editing && onUnpay && (
          askUnpay ? (
            <div style={{ marginTop: 22, background: `${tone.red}0A`, border: `1px solid ${tone.red}30`,
              borderRadius: 12, padding: "11px 12px" }}>
              <p style={{ margin: "0 0 9px", fontSize: 12.5, fontWeight: 700, color: tone.text }}>
                납부 기록을 지우고 미납 상태로 변경할까요?
              </p>
              <div style={{ display: "flex", gap: 7 }}>
                <button onClick={() => setAskUnpay(false)} className="jelly-tap"
                  style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: `1px solid ${tone.border}`,
                    background: "#fff", color: tone.sub, fontSize: 12.5, fontWeight: 800, cursor: "pointer", fontFamily: F }}>
                  취소
                </button>
                <button onClick={onUnpay} className="jelly-tap"
                  style={{ flex: 1, padding: "9px 0", borderRadius: 10, border: "none",
                    background: tone.red, color: "#fff", fontSize: 12.5, fontWeight: 900, cursor: "pointer", fontFamily: F }}>
                  미납으로 되돌리기
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAskUnpay(true)}
              style={{ width: "100%", marginTop: 22, padding: "9px 0", background: "none", border: "none",
                color: `${tone.red}C0`, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: F }}>
              납부 기록 지우고 미납으로 되돌리기
            </button>
          )
        )}
      </div>
    </div>
  );
}

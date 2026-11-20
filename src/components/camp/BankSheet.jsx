import { useState } from "react";
import { C, CAMP_SHEET } from "../../data/tokens.js";
import EmojiIcon from "../EmojiIcon.jsx";
import {
  BANK_PRODUCTS, BANK_MAX_SLOTS, BANK_MAX_AMOUNT, BANK_MIN_AMOUNT,
  bankInterest, depositStatus, bankTotal, bankClockBack, getBankProduct,
} from "../../data/bank.js";

/* ════════════════════════════════════════════════════════════════════════
   BankSheet — 은행 (캐릭터 탭에서 열리는 바텀시트)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-11-20] 정기예금 3종 (짧은 3일 · 보통 7일 · 긴 14일).
   상품·이자율·한도는 data/bank.js 에서만 정한다.

   여기는 '그리기'와 입력만 한다 — 코인을 실제로 옮기는 일(지갑 ↔ 은행,
   코인 기록 남기기, 저장)은 전부 App 이 한다. 여기서는 받은 함수를 부를 뿐이다.

   props
     open, onClose
     dark       : 탐험 스킨이면 true (CAMP_SHEET 크림 팔레트), 베이커리는 분홍
     today      : "YYYY-MM-DD"
     bank       : getChildBank(...) — {deposits,lastSeen}
     coin       : 지갑 코인
     coinEmoji, coinName : 스킨별 재화 표기 (TM.coinEmoji / TM.coin)
     onDeposit(productId, amount)
     onClaim(depositId)          만기 예금 찾기 (원금 + 이자)
     onWithdrawEarly(depositId)  만기 전 찾기 (원금만)
   ════════════════════════════════════════════════════════════════════════ */
export default function BankSheet({ open, onClose, dark, today, bank = { deposits: [] }, coin = 0,
  coinEmoji = "💎", coinName = "코인", onDeposit, onClaim, onWithdrawEarly }) {
  const [pick, setPick] = useState("mid");
  const [amt, setAmt] = useState("");
  const [confirmEarly, setConfirmEarly] = useState(null);   // 중도 해지 확인을 띄운 예금 id
  if (!open) return null;

  const T = dark
    ? { text: CAMP_SHEET.text, sub: CAMP_SHEET.textSub, card: "#FFF9EC", line: "#EAD9AE", soft: "#FBF3DE",
        accent: "#4C9450", accentText: "#fff", danger: "#C0563B" }
    : { text: C.text, sub: C.sub, card: "#fff", line: C.border, soft: "#FFF4F8",
        accent: "#E06A92", accentText: "#fff", danger: C.red };

  const clockBack = bankClockBack(bank, today);
  const deposits = bank.deposits.slice().sort((a, b) => (a.due < b.due ? -1 : 1));
  const slotsFull = deposits.length >= BANK_MAX_SLOTS;
  const maxCan = Math.min(coin, BANK_MAX_AMOUNT);
  const n = Number(amt || 0);
  const prod = getBankProduct(pick);
  const interest = bankInterest(n, pick);
  const amountErr = !amt ? "" : n < BANK_MIN_AMOUNT ? `${BANK_MIN_AMOUNT} ${coinName}부터 맡길 수 있어요`
    : n > coin ? `${coinName}이 모자라요 (지금 ${coin.toLocaleString()})`
    : n > BANK_MAX_AMOUNT ? `한 번에 ${BANK_MAX_AMOUNT.toLocaleString()}까지 맡길 수 있어요` : "";
  const canDeposit = !clockBack && !slotsFull && n >= BANK_MIN_AMOUNT && !amountErr;

  const setAmount = (v) => setAmt(String(Math.max(0, Math.min(v, maxCan)) || ""));
  const doDeposit = () => {
    if (!canDeposit) return;
    onDeposit && onDeposit(pick, n);
    setAmt("");
  };

  const Coin = ({ size = 13 }) => <EmojiIcon emoji={coinEmoji} size={size} style={{ verticalAlign: "-0.18em", marginRight: 3 }} />;
  const chipBtn = (on) => ({
    border: `1.5px solid ${on ? T.accent : T.line}`, background: on ? T.accent : T.card,
    color: on ? T.accentText : T.text, borderRadius: 999, padding: "6px 11px", fontSize: 12.5,
    fontWeight: 900, cursor: "pointer", fontFamily: "inherit",
  });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 4000,
      background: "rgba(20,16,32,0.55)", backdropFilter: "blur(3px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 460, maxHeight: "calc(var(--am-vh, 100vh) * 0.9)",
        overflow: "hidden", background: dark ? CAMP_SHEET.bodyBg : "#fff", borderRadius: "24px 24px 0 0",
        display: "flex", flexDirection: "column", boxShadow: "0 -12px 40px rgba(0,0,0,0.3)" }}>

        {/* 머리줄 */}
        <div style={{ padding: "16px 20px 14px",
          background: dark ? CAMP_SHEET.headerBg : "linear-gradient(160deg,#FDE7EF,#F9C5D6)",
          color: dark ? CAMP_SHEET.headerText : "#6B4A5C", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ margin: 0, fontSize: 19, fontWeight: 900 }}><EmojiIcon emoji="🏦" size={19} style={{ verticalAlign: "-0.18em", marginRight: 4 }} />은행</p>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, fontWeight: 700,
                color: dark ? CAMP_SHEET.headerTextSub : "#8A6B7A" }}>
                {coinName}을 맡기고 기다리면 이자가 붙어요
              </p>
            </div>
            <button onClick={onClose} aria-label="닫기" style={{ border: "none", cursor: "pointer",
              background: dark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.6)",
              color: dark ? "#fff" : "#6B4A5C", borderRadius: 10, width: 30, height: 30,
              fontSize: 15, fontWeight: 900, flexShrink: 0 }}>✕</button>
          </div>
          {/* 지갑 / 맡긴 코인 */}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {[["내 지갑", coin], ["은행에 맡긴", bankTotal(bank)]].map(([label, v]) => (
              <div key={label} style={{ flex: 1, borderRadius: 12, padding: "8px 10px",
                background: dark ? CAMP_SHEET.chipBg : "rgba(255,255,255,0.65)",
                border: `1px solid ${dark ? CAMP_SHEET.chipBorder : "rgba(255,255,255,0.9)"}` }}>
                <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, opacity: 0.9 }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 900 }}><Coin size={16} />{Number(v).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 16px 28px", overflowY: "auto" }}>
          {clockBack && (
            <div style={{ background: "#FFF1EC", border: "1px solid #F3C2B0", borderRadius: 12, padding: "10px 12px",
              marginBottom: 12, fontSize: 12.5, fontWeight: 800, color: "#9A4A2E", lineHeight: 1.5 }}>
              <EmojiIcon emoji="⚠️" size={13} style={{ verticalAlign: "-0.18em", marginRight: 4 }} />
              휴대폰 날짜가 이상해요. 날짜가 맞을 때까지 새로 맡기기와 이자 받기를 쉬어요.
              (맡긴 {coinName}은 언제든 찾을 수 있어요)
            </div>
          )}

          {/* ── 맡긴 예금 ── */}
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 900, color: T.text }}>
            맡긴 예금 <span style={{ color: T.sub, fontWeight: 800 }}>{deposits.length} / {BANK_MAX_SLOTS}</span>
          </p>
          {deposits.length === 0 ? (
            <div style={{ textAlign: "center", padding: "18px 10px", borderRadius: 14, background: T.soft,
              border: `1px dashed ${T.line}`, marginBottom: 16 }}>
              <p style={{ margin: 0 }}><EmojiIcon emoji="🏦" size={34} /></p>
              <p style={{ margin: "6px 0 0", fontSize: 13, fontWeight: 800, color: T.sub }}>아직 맡긴 {coinName}이 없어요</p>
            </div>
          ) : deposits.map(dep => {
            const st = depositStatus(dep, today);
            const p = st.product;
            const noInterest = st.tampered || clockBack;
            return (
              <div key={dep.id} style={{ borderRadius: 14, padding: "12px 12px 11px", marginBottom: 10,
                background: st.matured && !noInterest ? `linear-gradient(135deg, ${p.color}22, ${T.card})` : T.card,
                border: `${st.matured ? 2 : 1}px solid ${st.matured && !noInterest ? p.color : T.line}`,
                boxShadow: st.matured && !noInterest ? `0 4px 14px ${p.color}33` : "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <EmojiIcon emoji={p.emoji} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 13.5, fontWeight: 900, color: T.text }}>
                      {p.name} <span style={{ fontSize: 11.5, color: T.sub, fontWeight: 800 }}>{p.days}일 · 이자 {Math.round(p.rate * 100)}%</span>
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 14, fontWeight: 900, color: T.text }}>
                      <Coin />{Number(dep.amount).toLocaleString()}
                      <span style={{ color: T.sub, margin: "0 5px" }}>→</span>
                      <span style={{ color: noInterest ? T.sub : p.color }}>{(Number(dep.amount) + (noInterest ? 0 : st.interest)).toLocaleString()}</span>
                      {!noInterest && <span style={{ fontSize: 12, color: p.color, marginLeft: 4 }}>(+{st.interest})</span>}
                    </p>
                  </div>
                </div>
                {/* 진행 막대 */}
                <div style={{ height: 8, borderRadius: 99, background: dark ? "#EFE3C4" : "#F4E4EA", marginTop: 10, overflow: "hidden" }}>
                  <div style={{ width: `${st.matured ? 100 : st.percent}%`, height: "100%", borderRadius: 99, background: p.color,
                    transition: "width .4s ease" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 9 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: st.matured ? p.color : T.sub }}>
                    {st.tampered || (clockBack && st.matured) ? "날짜가 이상해서 지금은 원금만 찾을 수 있어요"
                      : st.matured ? "만기! 지금 찾으면 이자를 받아요"
                      : `만기까지 ${st.left}일 남았어요`}
                  </p>
                  {st.matured || st.tampered ? (
                    <button onClick={() => (noInterest ? onWithdrawEarly : onClaim)(dep.id)} style={{ border: "none", cursor: "pointer",
                      background: noInterest ? T.sub : p.color, color: "#fff", borderRadius: 999, padding: "8px 14px",
                      fontSize: 13, fontWeight: 900, flexShrink: 0, fontFamily: "inherit",
                      boxShadow: noInterest ? "none" : `0 3px 10px ${p.color}55` }}>
                      {noInterest ? "원금 찾기" : "찾기 🎉"}
                    </button>
                  ) : confirmEarly === dep.id ? (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button onClick={() => setConfirmEarly(null)} style={{ ...chipBtn(false), padding: "6px 10px" }}>계속 맡기기</button>
                      <button onClick={() => { setConfirmEarly(null); onWithdrawEarly(dep.id); }}
                        style={{ ...chipBtn(false), padding: "6px 10px", color: T.danger, borderColor: T.danger }}>이자 없이 찾기</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmEarly(dep.id)} style={{ border: `1px solid ${T.line}`, cursor: "pointer",
                      background: "transparent", color: T.sub, borderRadius: 999, padding: "6px 11px",
                      fontSize: 12, fontWeight: 800, flexShrink: 0, fontFamily: "inherit" }}>지금 찾기</button>
                  )}
                </div>
                {confirmEarly === dep.id && (
                  <p style={{ margin: "7px 0 0", fontSize: 11.5, fontWeight: 800, color: T.danger }}>
                    지금 찾으면 이자 +{st.interest}을 못 받아요. {st.left}일만 더 기다리면 받을 수 있어요!
                  </p>
                )}
              </div>
            );
          })}

          {/* ── 새로 맡기기 ── */}
          <p style={{ margin: "18px 0 8px", fontSize: 13, fontWeight: 900, color: T.text }}>새로 맡기기</p>
          {slotsFull ? (
            <p style={{ margin: 0, padding: "12px", borderRadius: 12, background: T.soft, fontSize: 12.5, fontWeight: 800, color: T.sub, lineHeight: 1.5 }}>
              예금은 {BANK_MAX_SLOTS}개까지 맡길 수 있어요. 하나를 찾으면 다시 맡길 수 있어요.
            </p>
          ) : (
            <div style={{ opacity: clockBack ? 0.5 : 1, pointerEvents: clockBack ? "none" : undefined }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                {BANK_PRODUCTS.map(pr => {
                  const on = pr.id === pick;
                  return (
                    <button key={pr.id} onClick={() => setPick(pr.id)} style={{ borderRadius: 14, padding: "10px 4px 9px",
                      border: `${on ? 2.5 : 1.5}px solid ${on ? pr.color : T.line}`, cursor: "pointer", fontFamily: "inherit",
                      background: on ? `linear-gradient(135deg, ${pr.color}26, ${T.card})` : T.card, textAlign: "center",
                      boxShadow: on ? `0 4px 12px ${pr.color}33` : "none" }}>
                      <p style={{ margin: 0 }}><EmojiIcon emoji={pr.emoji} size={28} /></p>
                      <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 900, color: T.text }}>{pr.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 11.5, fontWeight: 800, color: T.sub }}>{pr.days}일 맡기면</p>
                      <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 900, color: pr.color }}>이자 {Math.round(pr.rate * 100)}%</p>
                    </button>
                  );
                })}
              </div>

              {/* 금액 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                <div style={{ flex: 1, minWidth: 0, boxSizing: "border-box", display: "flex", alignItems: "center", border: `1.5px solid ${amountErr ? T.danger : T.line}`,
                  borderRadius: 12, background: T.card, padding: "0 10px" }}>
                  <Coin size={16} />
                  <input type="text" inputMode="numeric" value={amt} placeholder={`맡길 ${coinName}`} size={1}
                    onChange={e => setAmt(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 6))}
                    style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent",
                      fontSize: 16, fontWeight: 900, color: T.text, padding: "10px 4px", fontFamily: "inherit" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                {[10, 50, 100].map(v => (
                  <button key={v} onClick={() => setAmount(n + v)} style={chipBtn(false)}>+{v}</button>
                ))}
                <button onClick={() => setAmount(maxCan)} style={chipBtn(false)}>최대</button>
                {amt && <button onClick={() => setAmt("")} style={{ ...chipBtn(false), color: T.sub }}>지우기</button>}
              </div>

              {/* 미리보기 */}
              <div style={{ marginTop: 12, borderRadius: 12, padding: "11px 12px", background: T.soft,
                border: `1px solid ${T.line}`, fontSize: 13, fontWeight: 800, color: T.text, lineHeight: 1.55 }}>
                {amountErr ? <span style={{ color: T.danger }}>{amountErr}</span>
                  : n >= BANK_MIN_AMOUNT ? (<>
                    <EmojiIcon emoji={prod.emoji} size={14} style={{ verticalAlign: "-0.18em", marginRight: 4 }} />
                    {prod.days}일 뒤에 <Coin />{n.toLocaleString()} → <b style={{ color: prod.color }}>{(n + interest).toLocaleString()}</b>
                    <span style={{ color: prod.color }}> (이자 +{interest})</span>
                  </>) : <span style={{ color: T.sub }}>
                    {coin < BANK_MIN_AMOUNT ? `${coinName}을 ${BANK_MIN_AMOUNT}개 이상 모으면 맡길 수 있어요` : `얼마를 맡길지 적어 주세요 (${BANK_MIN_AMOUNT}~${maxCan.toLocaleString()})`}
                  </span>}
              </div>

              <button onClick={doDeposit} disabled={!canDeposit} style={{ width: "100%", marginTop: 12, border: "none",
                borderRadius: 14, padding: "13px", fontSize: 15, fontWeight: 900, fontFamily: "inherit",
                cursor: canDeposit ? "pointer" : "not-allowed",
                background: canDeposit ? T.accent : (dark ? "#E6DCC4" : "#EEE"), color: canDeposit ? "#fff" : T.sub,
                boxShadow: canDeposit ? `0 4px 14px ${T.accent}44` : "none" }}>
                <EmojiIcon emoji="🏦" size={16} style={{ verticalAlign: "-0.18em", marginRight: 5 }} />맡기기
              </button>
            </div>
          )}

          <p style={{ fontSize: 11.5, color: T.sub, fontWeight: 700, margin: "14px 0 0", lineHeight: 1.55 }}>
            · 오래 맡길수록 이자가 커져요. 만기가 되면 '찾기'를 눌러 받아요.<br />
            · 만기 전에 찾으면 맡긴 {coinName}만 돌려받아요 (이자 없음).<br />
            · 한 번에 {BANK_MIN_AMOUNT}~{BANK_MAX_AMOUNT.toLocaleString()}, 예금은 {BANK_MAX_SLOTS}개까지 맡길 수 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}

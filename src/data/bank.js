/* ════════════════════════════════════════════════════════════════════════
   은행 (정기예금) — 데이터 & 순수 로직
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-11-20] 아이용 캐릭터 탭에 은행을 둔다. 정기예금 3종으로 먼저.
     · 코인을 맡기고 기간을 기다리면 이자가 붙는다 — 길게 맡길수록 이자가 훨씬 크다.
     · 중간에 찾으면 원금만 돌려준다 (잃는 건 없다 — 이자만 없다).
     · 만기가 돼도 저절로 지갑에 들어가지 않는다. 아이가 '찾기'를 눌러 받는다
       (받는 순간이 이 기능의 재미라서).
     · 캐릭터 탭 격자에서 보물창고 바로 옆 칸 (사용자 원화 camp/st-bank.webp, 2026-11-20).

   수치 근거 — 미션 하나 = 15코인(탐험 기준)
     300코인을 보통 예금(7일)에 맡기면 이자 45 = 미션 3개 정도.
     꾸미기 가격(160~640)과 견줘 이자만으로 쉽게 살 수준은 아니게 묶는다.

   저장은 새 키 v6_bank 로만 한다 (CLAUDE.md 8·9 — 기존 코인 저장 v6_score 는 그대로).
     bankData[아이id] = {
       deposits: [{ id, product, amount, start:"YYYY-MM-DD", due:"YYYY-MM-DD" }],
       lastSeen: "YYYY-MM-DD"   // 은행이 마지막으로 본 날짜 — 날짜를 되돌린 걸 알아채려고
     }
   코인이 오가는 기록은 기존 코인 기록(scoreData.history)에 새 type 으로 남긴다
     bank_in(맡김, 코인 -) · bank_out(찾음, 원금 +) · bank_interest(이자 +)
   ════════════════════════════════════════════════════════════════════════ */

export const BANK_KEY = "v6_bank";

/* 상품 — 숫자는 여기서만 바꾼다 (화면 코드에 하드코딩 금지, CLAUDE.md 7) */
export const BANK_PRODUCTS = [
  { id: "short", emoji: "🐣", name: "짧은 예금", days: 3,  rate: 0.05, color: "#5FAE5A" },
  { id: "mid",   emoji: "🐥", name: "보통 예금", days: 7,  rate: 0.15, color: "#E0A030" },
  { id: "long",  emoji: "🦅", name: "긴 예금",   days: 14, rate: 0.35, color: "#6D88D6" },
];

export const BANK_MAX_SLOTS  = 3;     // 동시에 맡길 수 있는 예금 수
export const BANK_MAX_AMOUNT = 1000;  // 한 번에 맡길 수 있는 최대 코인
export const BANK_MIN_AMOUNT = 10;    // 한 번에 맡길 수 있는 최소 코인 (이자가 0이 되지 않게)

export const getBankProduct = (id) => BANK_PRODUCTS.find(p => p.id === id) || BANK_PRODUCTS[0];

/* 이자 — 반올림, 최소 1 (10코인을 3일 맡겨도 0.5 → 1) */
export const bankInterest = (amount, productId) => {
  const a = Math.max(0, Math.floor(Number(amount) || 0));
  if (!a) return 0;
  return Math.max(1, Math.round(a * getBankProduct(productId).rate));
};

/* "YYYY-MM-DD" 두 날짜의 차이(일) — b - a */
const toDate = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
export const bankDaysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);

export const bankAddDays = (s, n) => {
  const d = toDate(s); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const emptyBank = () => ({ deposits: [], lastSeen: "" });

/* 아이 한 명의 은행 — 깨진 값이 와도 빈 은행으로 읽는다 */
export const getChildBank = (bankData, cid) => {
  const b = bankData && bankData[cid];
  if (!b || typeof b !== "object") return emptyBank();
  return {
    deposits: Array.isArray(b.deposits) ? b.deposits.filter(d => d && d.id && Number(d.amount) > 0) : [],
    lastSeen: typeof b.lastSeen === "string" ? b.lastSeen : "",
  };
};

/* 휴대폰 날짜를 뒤로 돌렸나 — 은행이 본 가장 늦은 날짜보다 오늘이 이르면 이상한 것.
   (앞으로 돌려 만기를 당긴 뒤 되돌리면 여기 걸린다 → 진짜 날짜가 따라올 때까지
    새로 맡기기·이자 받기를 막는다. 원금 찾기는 언제나 된다.) */
export const bankClockBack = (bank, today) => !!bank.lastSeen && today < bank.lastSeen;

/* 예금 한 건의 상태 */
export const depositStatus = (dep, today) => {
  const p = getBankProduct(dep.product);
  const total = p.days;
  const left = Math.max(0, bankDaysBetween(today, dep.due));
  const passed = Math.min(total, Math.max(0, total - left));
  return {
    product: p,
    interest: bankInterest(dep.amount, dep.product),
    matured: today >= dep.due,
    left,
    percent: total ? Math.round((passed / total) * 100) : 100,
    /* 맡긴 날보다 오늘이 이르면 날짜를 되돌린 것 — 이 예금은 이자 없이 원금만 */
    tampered: today < dep.start,
  };
};

/* 받침에 맞춘 조사 — 재화 이름이 스킨마다 달라서 ("코인을" · "쿠키를") */
export const josa = (word, pair) => {
  const w = String(word || ""); const c = w.charCodeAt(w.length - 1);
  const has = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
  const [a, b] = { "을를": ["을", "를"], "이가": ["이", "가"], "은는": ["은", "는"] }[pair] || ["", ""];
  return w + (has ? a : b);
};

export const bankTotal = (bank) => bank.deposits.reduce((s, d) => s + Number(d.amount || 0), 0);
export const bankMaturedCount = (bank, today) => bank.deposits.filter(d => today >= d.due && today >= d.start).length;

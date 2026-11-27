import { addDays } from "../utils/dates.js";

/* ════════════════════════════════════════════════════════════════════════
   🛡️ 연속 보호권 (사용자 확정 2026-11-27) — 꾸미기 상점 '배경 · 도우미 · 펫' > 도우미
   ────────────────────────────────────────────────────────────────────────
   · 미리 사 두면: 미션이 있는 날을 못 끝내고 날짜가 넘어가면 1개가 자동으로 쓰여
     그날을 '보호한 날'로 만든다 → 연속 기록이 끊기지 않는다(그날 +1 은 없다).
   · 보호권 없이 어제 하루만 놓쳤으면: 오늘 사는 순간 그 하루를 보호해 기록이 이어진다.
     이틀 이상 연달아 놓친 기록은 살릴 수 없다.
   · 미션이 0개인 날은 원래 건너뛰므로(끊기지 않음) 보호권을 쓰지 않는다.
   · 이어 오던 기록이 0일이면 지킬 게 없으므로 보호권을 쓰지 않는다.

   저장: 새 키 하나 (CLAUDE.md 9) — { [childId]: { count, protected: [날짜], checkedThrough: 날짜 } }
     count           가지고 있는 보호권 개수
     protected       보호권으로 지킨 날짜 목록 (연속 계산에서 '건너뛰는 날'로 본다)
     checkedThrough  자동 사용을 어디까지 따져 봤는지 — 이보다 앞 날짜는 다시 보지 않는다.
                     (처음 따질 때는 어제로만 맞추고 아무것도 쓰지 않는다 →
                      사기 전에 놓친 옛날 기록을 뒤늦게 사서 살리는 일이 없다)

   날짜 상태(states)는 App 이 만든다: { "YYYY-MM-DD": "ok" | "miss" | "open" }
     ok   = 그날 미션을 전부 완료
     miss = 실패한 미션이 있음
     open = 아직 덜 끝냄(실패는 없음)
     (미션이 0개인 날은 states 에 아예 없다)
   ════════════════════════════════════════════════════════════════════════ */

export const STREAK_SHIELD_KEY = "v6_streak_shield";
export const STREAK_SHIELD_PRICE = 150;

export const emptyShield = () => ({ count: 0, protected: [], checkedThrough: null });
export const normShield = (rec) => {
  const r = rec && typeof rec === "object" ? rec : {};
  const n = Number(r.count);
  return {
    count: Number.isFinite(n) && n > 0 ? Math.floor(n) : 0,
    protected: Array.isArray(r.protected) ? r.protected.filter(d => typeof d === "string") : [],
    checkedThrough: typeof r.checkedThrough === "string" ? r.checkedThrough : null,
  };
};

/** fromDate 부터 거슬러 올라가며 센 연속 일수.
    · 미션 0개인 날·보호한 날은 건너뛴다(끊지도 +1 하지도 않음)
    · 오늘(today)이 아직 진행 중(open)이면 건너뛴다 — 오늘 안 끝났다고 어제까지의 기록이 0으로 보이지 않게
    · 그 밖에 못 끝낸 날을 만나면 멈춘다 */
export const countStreak = (states, earliest, fromDate, protectedDates = [], today = null) => {
  if (!earliest || !fromDate) return 0;
  const prot = new Set(protectedDates);
  let n = 0;
  for (let d = fromDate; d >= earliest; d = addDays(d, -1)) {
    const st = states[d];
    if (!st) continue;
    if (st === "ok") { n += 1; continue; }
    if (prot.has(d)) continue;
    if (d === today && st === "open") continue;
    break;
  }
  return n;
};

/** 자동 사용 — checkedThrough 다음 날부터 어제까지, 놓친 날마다 보호권이 있으면 1개씩 쓴다.
    반환: { next, saved: [{ date, days }] }  (days = 그 덕분에 지킨 연속 일수) */
export const applyAutoShield = (states, earliest, rec, today) => {
  const r = normShield(rec);
  const yesterday = addDays(today, -1);
  if (!r.checkedThrough) return { next: { ...r, checkedThrough: yesterday }, saved: [] };
  if (r.checkedThrough >= yesterday) return { next: r, saved: [] };
  let count = r.count;
  const prot = [...r.protected];
  const saved = [];
  for (let d = addDays(r.checkedThrough, 1); d <= yesterday; d = addDays(d, 1)) {
    const st = states[d];
    if (!st || st === "ok" || prot.includes(d) || count <= 0) continue;
    const days = countStreak(states, earliest, addDays(d, -1), prot, today);
    if (days <= 0) continue;                 // 지킬 기록이 없으면 아낀다
    prot.push(d); count -= 1; saved.push({ date: d, days });
  }
  return { next: { count, protected: prot, checkedThrough: yesterday }, saved };
};

/** 어제(오늘 전 마지막으로 미션이 있던 날) 하루만 놓쳐 끊긴 기록을 살릴 수 있는가.
    살릴 수 있으면 { date, days } (days = 이어지는 연속 일수), 아니면 null.
    그 전날까지 이어진 기록이 0 이면(=이틀 이상 연달아 놓침) 살릴 수 없다. */
export const findRecoverableMiss = (states, earliest, rec, today) => {
  const r = normShield(rec);
  if (!earliest) return null;
  let last = null;
  for (let d = addDays(today, -1); d >= earliest; d = addDays(d, -1)) { if (states[d]) { last = d; break; } }
  if (!last || states[last] === "ok" || r.protected.includes(last)) return null;
  const days = countStreak(states, earliest, addDays(last, -1), r.protected, today);
  return days > 0 ? { date: last, days } : null;
};

/** 보호권 1개 구매 — 살릴 수 있는 어제가 있으면 바로 그날에 쓴다.
    반환: { next, recovered: {date,days}|null } */
export const applyShieldPurchase = (states, earliest, rec, today) => {
  const r = normShield(rec);
  const rescue = findRecoverableMiss(states, earliest, r, today);
  if (rescue) return { next: { ...r, protected: [...r.protected, rescue.date] }, recovered: rescue };
  return { next: { ...r, count: r.count + 1 }, recovered: null };
};

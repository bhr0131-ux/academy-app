/* ════════════════════════════════════════════════════════════════════════
   일별 데이터(v6_daily) 월별 분할 저장
   ────────────────────────────────────────────────────────────────────────
   [문제 2026-08-15] 미션을 하나 체크할 때마다 save("v6_daily", 전체) 가 돌아
   지금까지 쌓인 모든 날짜를 통째로 문자열로 만들어 다시 썼다. 데이터가 커질수록
   체크 한 번이 그대로 느려진다 (실측, 데스크톱 크롬):
        10만 글자 1.4ms · 100만 19ms · 200만 63ms · 400만 176ms
   폰은 3~5배 느리다 → 200만 글자만 돼도 체크할 때마다 0.2~0.3초씩 버벅인다.

   [조치] 달별로 쪼개 저장하고, 바뀐 달만 다시 쓴다.
        v6_daily_months  = ["2026-07","2026-08", ...]   (어느 달이 있는지 목록)
        v6_daily_2026-08 = { "child_1-ac_1-2026-08-15": {...}, ... }
   미션 하나를 체크하면 그 달 한 칸만 쓰므로, 몇 년을 써도 저장 시간이
   한 달치(보통 수천~수만 글자) 수준으로 고정된다.

   [기존 데이터] 예전 키 v6_daily 에서 읽어 오는 폴백을 둔다(CLAUDE.md 9).
   처음 실행 때 한 번 쪼개 저장하고, 쪼갠 것을 **다시 읽어 원본과 같은지 확인한
   뒤에만** 예전 키를 지운다. 확인에 실패하면 예전 키를 그대로 두고 손대지 않는다.
   ════════════════════════════════════════════════════════════════════════ */
import { save, load, removeStored } from "./dates.js";

export const DAILY_LEGACY_KEY = "v6_daily";        // 예전 키 (읽기 폴백 전용)
export const DAILY_INDEX_KEY  = "v6_daily_months"; // 신규
export const dailyShardKey = (m) => `v6_daily_${m}`;

/** 일별 키(`아이-학원-YYYY-MM-DD`)에서 달(YYYY-MM)을 뽑는다. 못 뽑으면 null. */
export const monthOfDailyKey = (k) => {
  const m = /(\d{4}-\d{2})-\d{2}$/.exec(k || "");
  return m ? m[1] : null;
};

/** 전체 일별 데이터를 달별로 묶는다. 날짜를 못 읽는 키는 "etc" 칸에 모은다. */
export const groupByMonth = (dailyData) => {
  const out = {};
  for (const [k, v] of Object.entries(dailyData || {})) {
    const m = monthOfDailyKey(k) || "etc";
    (out[m] || (out[m] = {}))[k] = v;
  }
  return out;
};

/* 바뀐 달 찾기 — 값을 참조로만 비교한다(문자열로 만들지 않아 아주 빠르다).
   prev 가 없으면 null 을 돌려 '전부 저장'을 뜻한다. */
export const dirtyMonths = (prev, next) => {
  if (!prev) return null;
  const set = new Set();
  for (const k in next) if (prev[k] !== next[k]) set.add(monthOfDailyKey(k) || "etc");
  for (const k in prev) if (!(k in next)) set.add(monthOfDailyKey(k) || "etc");
  return set;
};

/** 달 목록과, 지정한 달(들)만 저장한다. months 가 null 이면 전부.
    사라진 달(초기화 등으로 그 달 기록이 통째로 없어진 경우)은 키까지 지운다.

    [순서 주의] 반드시 ① 칸 → ② 목록 → ③ 지우기 순으로 쓴다.
    목록을 먼저 쓰면, 그 사이에 앱이 꺼졌을 때 '목록에는 있는데 칸이 없는' 달이
    생겨 그 달 기록이 통째로 빈 것으로 읽힌다. 반대 순서면 최악이라도
    '목록에 없는 칸'이 남을 뿐이라 데이터가 사라지지 않는다. */
export const saveDailyShards = async (dailyData, months) => {
  const grouped = groupByMonth(dailyData);
  const all = Object.keys(grouped).sort();
  const target = months == null ? all : [...months];
  const prevAll = await load(DAILY_INDEX_KEY);

  for (const m of target) if (grouped[m]) await save(dailyShardKey(m), grouped[m]);   // ①
  await save(DAILY_INDEX_KEY, all);                                                   // ②
  for (const m of target) if (!grouped[m]) await removeStored(dailyShardKey(m));      // ③
  if (Array.isArray(prevAll)) {
    for (const m of prevAll) if (!grouped[m]) await removeStored(dailyShardKey(m));
  }
  return { written: target.length, total: all.length };
};

/** 쪼개 둔 것을 모아 읽는다. 아직 쪼갠 적이 없으면 null.
    { data, months, missing } — missing 은 목록에는 있는데 칸이 없는 달 수다. */
export const loadDailyShards = async () => {
  const months = await load(DAILY_INDEX_KEY);
  if (!Array.isArray(months)) return null;
  const data = {}; let missing = 0;
  for (const m of months) {
    const part = await load(dailyShardKey(m));
    if (part == null) missing++;
    else Object.assign(data, part);
  }
  return { data, months: months.length, missing };
};

/* 두 일별 데이터가 같은 내용인지 — 키 개수와 각 항목의 JSON 이 같으면 같다.
   (달별로 모아 읽으면 키 순서가 원본과 달라지므로 통째 문자열 비교는 못 쓴다) */
export const sameDaily = (a, b) => {
  const ka = Object.keys(a || {}), kb = Object.keys(b || {});
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!(k in b)) return false;
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) return false;
  }
  return true;
};

/* ── 보관 기간 (사용자 확정 2026-08-15) ────────────────────────────────────
   미션(일별) 데이터는 최근 1년치만 남긴다. 달 단위로 쪼개 저장하므로 달로 자른다.
   '오늘이 든 달'을 포함해 12개월 전 달까지 남기므로, 어느 날에 보든
   '1년 전 오늘'은 항상 들어 있다(실제로는 12~13개월치가 남는다).

   [지워지는 것] 그 기간보다 오래된 날의 숙제·할일·준비물 기록.
   [남는 것] 코인·XP·점수 이력(v6_score), 상장, 보물상자 누적 개수,
            최고 연속 기록(v6_best_streak), 오늘의 발견 도감, 학원비·결석 —
            전부 다른 키라 이 정리에 영향받지 않는다.
   [영향] 연속 달성(현재 진행)은 보관 기간 경계에서 멈춘다. 1년 넘게 이어 온
          연속은 1년으로 보이게 되지만, 최고 기록은 따로 저장돼 있어 안 깎인다.
   보관 기간을 바꾸거나 끄려면 이 숫자 하나만 고치면 된다(0이면 정리 안 함). */
export const DAILY_KEEP_MONTHS = 12;

/** 남겨 둘 가장 오래된 달(YYYY-MM). 이보다 이전 달은 지운다. */
export const oldestKeepMonth = (today) => {
  const [y, m] = String(today).split("-").map(Number);
  const d = new Date(y, m - 1 - DAILY_KEEP_MONTHS, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/* 보관 기간이 지난 달을 지운다. → { data, removed }
   [순서 주의] 지울 때는 저장할 때와 반대로 ① 목록 → ② 칸 순서다.
   목록에서 먼저 빼야, 중간에 앱이 꺼져도 '목록엔 있는데 칸이 없는' 달이 안 생긴다.
   (남는 최악은 '목록에 없는 칸' 하나뿐이고, 그건 읽히지도 않는다) */
export const pruneOldMonths = async (dailyData, today) => {
  if (!DAILY_KEEP_MONTHS || !today) return { data: dailyData, removed: [] };
  const cut = oldestKeepMonth(today);
  const grouped = groupByMonth(dailyData);
  /* "etc"(날짜를 못 읽는 키)는 언제 것인지 알 수 없으므로 절대 안 지운다 */
  const removed = Object.keys(grouped).filter((m) => m !== "etc" && m < cut).sort();
  if (!removed.length) return { data: dailyData, removed };

  const keep = Object.keys(grouped).filter((m) => !removed.includes(m)).sort();
  await save(DAILY_INDEX_KEY, keep);                                  // ①
  for (const m of removed) await removeStored(dailyShardKey(m));      // ②

  const data = {};
  for (const m of keep) Object.assign(data, grouped[m]);
  return { data, removed };
};

/* 앱 시작 때 한 번 — 쪼갠 게 있으면 그걸 읽고, 없으면 예전 키에서 읽어
   쪼개 저장한 뒤 검증하고 예전 키를 정리한다. 마지막으로 보관 기간을 적용한다.
   돌려주는 값: { dailyData, migrated, verified, removed } */
export const loadOrMigrateDaily = async (today) => {
  const sharded = await loadDailyShards();
  /* 칸이 하나도 안 읽히면(목록만 있고 내용이 통째로 비었다면) 옮기다 만 상태일 수
     있다. 그럴 때만 예전 키를 다시 본다 — 정상이면 이 분기에 들어오지 않는다. */
  const brokenShards = !!sharded && sharded.months > 0 && sharded.missing === sharded.months;
  if (sharded && !brokenShards) {
    const p = await pruneOldMonths(sharded.data, today);
    return { dailyData: p.data, migrated: false, verified: true, removed: p.removed };
  }

  const legacy = await load(DAILY_LEGACY_KEY);
  const dailyData = legacy && typeof legacy === "object" ? legacy : {};
  if (!Object.keys(dailyData).length) {
    // 옮길 게 없다 — 목록만 만들어 두면 다음부터는 쪼갠 쪽으로 간다
    if (!sharded) await save(DAILY_INDEX_KEY, []);
    return { dailyData: sharded ? sharded.data : dailyData, migrated: false, verified: true, removed: [] };
  }

  await saveDailyShards(dailyData, null);
  const back = await loadDailyShards();
  const verified = !!back && sameDaily(dailyData, back.data);
  /* 검증을 통과했을 때만 예전 키를 지운다. 실패하면 예전 키를 그대로 두고
     목록을 지워, 다음 실행에서도 예전 키로 정상 동작하게 되돌린다.
     검증에 실패했으면 보관 기간도 적용하지 않는다 — 옮기지도 못한 걸 지우면 안 된다. */
  if (!verified) { await removeStored(DAILY_INDEX_KEY); return { dailyData, migrated: true, verified, removed: [] }; }
  await removeStored(DAILY_LEGACY_KEY);
  const p = await pruneOldMonths(dailyData, today);
  return { dailyData: p.data, migrated: true, verified: true, removed: p.removed };
};

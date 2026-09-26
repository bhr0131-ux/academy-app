/* ════════════════════════════════════════════════════════════════════════
   반복 미션 — 자주 쓰는 미션을 저장해 두고 한 번에 넣기
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-09-26] 학원을 안 다니는 아이도 반복 할 일을 쓸 수 있어야 한다.
   지금은 미션을 넣을 때마다 같은 글자를 다시 쳐야 했다 ("이 닦기", "책 읽기" …).

   그래서 '반복 미션'을 따로 저장해 두고, 학원이든 생활·일반이든
   **미션을 넣는 자리에서 눌러 바로 넣는다.**

   · 만드는 곳  : 엄마용 미션탭 → '반복 미션 추가'
   · 넣는 곳    : 공부방·어린이집 …·생활·일반 미션 추가 팝업 안의 칩 줄
   · 어디에 넣을지는 **넣는 순간 고른다** — 반복 미션 자체는 장소를 안 가진다.
     같은 "이 닦기"를 어제는 생활·일반에, 오늘은 공부방에 넣을 수 있다.

   [저장] 새 키 하나만 쓴다 (CLAUDE.md 9). 기존 키·저장 로직은 안 건드린다.
     v6_repeat_missions = { [childId]: [ {id, text, point, kind} ] }
       kind : "todo"(할 일) | "hw"(숙제)
     아이별로 둔다 — 점수·미션이 전부 아이별이라 여기만 공용이면 헷갈린다.

   [점수] 점수를 바꾸는 건 원래 '엄마 권한'(PIN)이 있어야 한다. 반복 미션도 같다 —
   잠겨 있으면 기본 점수로만 만들어진다. 이미 만들어 둔 반복 미션을 넣을 때는
   저장된 점수를 그대로 쓴다(PIN 가진 사람이 정해 둔 값이라서).
   ════════════════════════════════════════════════════════════════════════ */

export const REPEAT_MISSION_KEY = "v6_repeat_missions";

/* 한 아이당 최대 개수 — 칩 줄이 화면을 덮지 않을 만큼만 */
export const REPEAT_MISSION_MAX = 20;
export const REPEAT_TEXT_MAX = 30;

/* ── 조회 ─────────────────────────────────────────────────────────── */
export const getRepeatList = (data, cid) => {
  const list = data && typeof data === "object" ? data[cid] : null;
  return Array.isArray(list) ? list.filter(it => it && typeof it.text === "string") : [];
};

/* 저장된 값이 깨져 있어도 화면이 안 죽게 다듬는다 (구버전·수동 편집 방어) */
export const normalizeRepeat = (raw, defaultPoint) => {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [cid, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    const seen = new Set();
    out[cid] = list
      .filter(it => it && typeof it === "object" && String(it.text || "").trim())
      .map(it => ({
        id: String(it.id || ""),
        text: String(it.text).trim().slice(0, REPEAT_TEXT_MAX),
        point: clampPoint(it.point, defaultPoint),
        kind: it.kind === "hw" ? "hw" : "todo",
      }))
      .filter(it => {
        if (!it.id || seen.has(it.id)) return false;
        seen.add(it.id); return true;
      })
      .slice(0, REPEAT_MISSION_MAX);
  }
  return out;
};

/* 점수는 1 이상 정수 — 0·음수·NaN 이 들어오면 기본값으로 되돌린다
   (음수 점수는 미션을 깰수록 코인이 줄어든다) */
export const clampPoint = (v, defaultPoint) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 1 ? n : defaultPoint;
};

/* ── 추가 ─────────────────────────────────────────────────────────────
   id 는 부르는 쪽에서 준다 (App 의 newId) — 이 파일은 순수하게 둔다. */
export const addRepeatMission = (data, cid, { id, text, point, kind }, defaultPoint) => {
  const list = getRepeatList(data, cid);
  const t = String(text || "").trim().slice(0, REPEAT_TEXT_MAX);
  if (!t) return { ok: false, reason: "empty", next: data };
  if (list.length >= REPEAT_MISSION_MAX) return { ok: false, reason: "full", next: data };
  /* 같은 글자를 두 번 저장하면 칩 줄에서 어느 쪽인지 구분이 안 된다 */
  if (list.some(it => it.text === t)) return { ok: false, reason: "duplicate", next: data };
  const item = { id: String(id), text: t, point: clampPoint(point, defaultPoint), kind: kind === "hw" ? "hw" : "todo" };
  return { ok: true, reason: null, item, next: { ...data, [cid]: [...list, item] } };
};

/* ── 수정 ─────────────────────────────────────────────────────────── */
export const editRepeatMission = (data, cid, id, patch, defaultPoint) => {
  const list = getRepeatList(data, cid);
  const t = patch.text === undefined ? undefined : String(patch.text).trim().slice(0, REPEAT_TEXT_MAX);
  if (t !== undefined && !t) return { ok: false, reason: "empty", next: data };
  if (t !== undefined && list.some(it => it.id !== id && it.text === t)) return { ok: false, reason: "duplicate", next: data };
  return {
    ok: true, reason: null,
    next: {
      ...data,
      [cid]: list.map(it => it.id !== id ? it : {
        ...it,
        ...(t !== undefined ? { text: t } : null),
        ...(patch.point !== undefined ? { point: clampPoint(patch.point, defaultPoint) } : null),
        ...(patch.kind !== undefined ? { kind: patch.kind === "hw" ? "hw" : "todo" } : null),
      }),
    },
  };
};

/* ── 삭제 ─────────────────────────────────────────────────────────── */
export const removeRepeatMission = (data, cid, id) => ({
  ...data, [cid]: getRepeatList(data, cid).filter(it => it.id !== id),
});

/* ── 오늘 미션으로 넣기 ───────────────────────────────────────────────
   entry = { homeworks:[], todos:[] } (getDailyEntry 가 주는 그것)
   · isExtra(생활·일반)면 숙제 칸이 없으므로 할 일로 넣는다
   · 같은 글자가 이미 그 칸에 있으면 안 넣는다 — 칩을 두 번 눌러 같은 미션이
     두 줄 생기는 걸 막는다 (화면에서도 ✓ 로 표시한다) */
export const applyRepeatToEntry = (entry, item, { id, isExtra }) => {
  const kind = isExtra ? "todo" : (item.kind === "hw" ? "hw" : "todo");
  const listKey = kind === "hw" ? "homeworks" : "todos";
  const cur = Array.isArray(entry?.[listKey]) ? entry[listKey] : [];
  if (cur.some(x => String(x.text || "").trim() === item.text)) {
    return { ok: false, reason: "already", next: entry };
  }
  return {
    ok: true, reason: null, kind,
    next: { ...entry, [listKey]: [...cur, { id: String(id), text: item.text, done: false, point: item.point }] },
  };
};

/* 이 반복 미션이 지금 보고 있는 칸에 이미 들어 있나 (칩에 ✓ 표시) */
export const isRepeatInEntry = (entry, item, isExtra) => {
  const kind = isExtra ? "todo" : (item.kind === "hw" ? "hw" : "todo");
  const cur = entry?.[kind === "hw" ? "homeworks" : "todos"];
  return Array.isArray(cur) && cur.some(x => String(x.text || "").trim() === item.text);
};

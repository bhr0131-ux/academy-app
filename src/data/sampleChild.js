import { addDays } from "../utils/dates.js";
import { EMPTY_AC } from "./sampleData.js";

/* ════════════════════════════════════════════════════════════════════════
   샘플 아이 (사용자 확정 2026-11-27)
   ────────────────────────────────────────────────────────────────────────
   처음 가이드(온보딩)를 마치면 만든 아이 옆에 '샘플' 아이를 하나 더 넣어,
   처음 쓰는 사람이 앱의 기능을 골고루 눌러 볼 수 있게 한다.
   샘플은 엄마용 화면 아이 칩 옆 ＋(아이 관리)에서 지울 수 있다.

   넣는 것 (모두 기존 저장 형식 그대로 — 새 키는 만들지 않는다)
     · 학원 2곳 — 피아노(월·수·금, 셔틀·준비물·반복 숙제) / 영어(화·목)
     · 오늘 미션(숙제·할 일·준비물) + 지난 일주일 완료 기록(연속 달성·점수 내역)
     · 반복: 피아노 '수업 있는 날마다' 숙제 규칙, 매주 메모, 자주 쓰는 미션
     · 메모(오늘), 결석 1건 + 보충 예정, 학원비(피아노 납부 완료 / 영어 미납)
     · 점수·코인, 보물상자, 펫(연속 기록에 맞는 단계), 연속 보호권 1개
     · 보상 구매 요청(대기 1 · 승인 1), 꾸미기 아이템 1개
   펫·보호권은 기록에 맞춰 미리 맞춰 둬서 처음 켰을 때 진화·보호권 팝업이 쏟아지지 않는다.
   ════════════════════════════════════════════════════════════════════════ */

export const SAMPLE_CHILD_ID = "child_sample";
export const SAMPLE_HINT_KEY = "v6_sample_hint_seen";   // '샘플은 ＋에서 지울 수 있어요' 안내를 봤는지 (1회)
export const isSampleChild = (c) => !!c && (c.sample === true || c.id === SAMPLE_CHILD_ID);

const DN7 = ["일", "월", "화", "수", "목", "금", "토"];
const dnOf = (d) => DN7[new Date(d.replace(/-/g, "/")).getDay()];

/**
 * @param today       "YYYY-MM-DD"
 * @param rewards     보상 목록(첫 아이와 같은 연령대 세트) — 구매 요청에 쓴다
 * @param petStageOf  (best)=>stage  (gameData.petStageForStreak)
 */
export const buildSampleChild = (today, rewards = [], petStageOf = () => 0) => {
  const cid = SAMPLE_CHILD_ID;
  const stamp = Date.now();
  let seq = 0;
  const nid = () => stamp + (seq++);
  const acA = `ac_sample_piano`;
  const acB = `ac_sample_english`;
  const todayDn = dnOf(today);

  /* 오늘이 어느 학원과도 안 겹치면(주말) 피아노를 오늘에도 넣어 '오늘 미션'이 보이게 */
  const daysA = ["월", "수", "금"];
  const daysB = ["화", "목"];
  if (!daysA.includes(todayDn) && !daysB.includes(todayDn)) daysA.push(todayDn);

  const academies = [
    { ...EMPTY_AC, id: acA, name: "피아노 학원", kind: "piano", kindLabel: "피아노",
      days: daysA, time: "16:00", duration: 50, color: "#00B8A9",
      teacher: "김선생님", phone: "010-1234-5678", address: "행복아파트 상가 3층",
      fee: 150000, payDay: 5, account: "국민 123-45-6789 (김선생)",
      baseSupplies: ["피아노 교재"], baseHomeworks: [],
      shuttleInfo: "15:40 아파트 정문", memo: "매달 마지막 주 토요일 작은 연주회" },
    { ...EMPTY_AC, id: acB, name: "영어 학원", kind: "english", kindLabel: "영어",
      days: daysB, time: "17:00", duration: 60, color: "#4E7BFF",
      teacher: "박선생님", phone: "010-2345-6789", address: "중앙로 12 2층",
      fee: 180000, payDay: 25,
      baseSupplies: ["단어장"], baseHomeworks: ["단어 10개 외우기"],
      shuttleInfo: "", memo: "금요일마다 단어 시험" },
  ];

  /* 결석 — 지난 영어 수업 하루를 결석으로, 보충은 다음 토요일 오전 */
  let absDate = null;
  for (let i = 1; i <= 7; i++) { const d = addDays(today, -i); if (daysB.includes(dnOf(d))) { absDate = d; break; } }
  let makeup = addDays(today, 1);
  while (dnOf(makeup) !== "토") makeup = addDays(makeup, 1);
  const absences = absDate ? [{ id: nid(), academyId: acB, date: absDate, reason: "감기로 결석",
    makeupDate: makeup, makeupStart: "10:00", makeupEnd: "11:00", makeupDone: false, makeupStatus: "" }] : [];

  /* 일별 미션 — 지난 7일은 수업 있던 날 전부 완료(연속 달성), 오늘은 아직 안 함 */
  const dailyData = {};
  const history = [];
  let doneCount = 0, streak = 0;
  for (let i = 7; i >= 1; i--) {
    const d = addDays(today, -i), dn = dnOf(d);
    let any = false;
    if (daysA.includes(dn)) {
      dailyData[`${cid}-${acA}-${d}`] = { homeworks: [{ id: nid(), text: "하농 1번 5회 연습", done: true, point: 10 }], todos: [], supplies: [] };
      any = true; doneCount += 1;
    }
    if (daysB.includes(dn) && d !== absDate) {
      dailyData[`${cid}-${acB}-${d}`] = { homeworks: [{ id: nid(), text: "단어 10개 외우기", done: true, point: 10 },
        { id: nid(), text: "리딩 북 2쪽 읽기", done: true, point: 10 }], todos: [], supplies: [] };
      any = true; doneCount += 2;
    }
    if (any) {
      streak += 1;
      history.push({ id: nid(), point: 10, xp: 10, coin: 15, date: d, type: "quest", memo: "미션 완료" });
    }
  }
  /* 오늘 — 수업 있는 학원에 숙제·할 일·준비물 */
  const todayAc = daysA.includes(todayDn) ? acA : acB;
  dailyData[`${cid}-${todayAc}-${today}`] = todayAc === acA
    ? { homeworks: [{ id: nid(), text: "바이엘 20번 3회 연습", done: false, point: 10 }],
        todos: [{ id: nid(), text: "메트로놈 60에 맞춰 치기", done: false, point: 10 }], supplies: ["연필"] }
    : { homeworks: [{ id: nid(), text: "단어 시험 대비 복습", done: false, point: 10 }],
        todos: [{ id: nid(), text: "영어 일기 3줄 쓰기", done: false, point: 10 }], supplies: ["이어폰"] };

  /* 반복 — 피아노 수업 있는 날마다 숙제(오늘부터 만들어진다) · 매주 메모 · 자주 쓰는 미션 */
  const missionRules = [{ id: `rule_sample_${stamp}`, acId: acA, text: "하농 1번 5회 연습", point: 10, type: "class", days: [], start: today }];
  const firstA = DN7.indexOf(daysA[0]);
  const memoList = [
    { id: `memo_sample_w_${stamp}`, text: "피아노 교재 챙기기", date: today, repeat: "weekly", days: [firstA], skip: [] },
    { id: `memo_sample_1_${stamp}`, text: "선생님께 다음 달 연주회 시간 여쭤보기", date: today, repeat: "none", skip: [] },
  ];
  const repeatMissions = [{ id: `rm_sample_${stamp}`, text: "양치하고 잠자기", point: 10, kind: "todo", academyId: null }];

  /* 학원비 — 이번 달 피아노는 납부(기록 포함), 영어는 아직 */
  const [y, m] = today.split("-").map(Number);
  const feeKey = (aId) => `${cid}-${y}-${m}-${aId}`;
  const paidStatus = { [feeKey(acA)]: true };
  const payInfo = { [feeKey(acA)]: { date: `${y}-${String(m).padStart(2, "0")}-05`, amount: 150000, method: "transfer", memo: "" } };

  /* 점수·코인 — Lv.4 정도, 보호권을 살 수 있을 만큼 */
  const xp = 200, coin = 380;
  history.push({ id: nid(), point: 0, xp: 0, coin: 0, date: today, type: "sample", memo: "샘플 아이 시작" });
  const scoreData = { xp, coin, history };

  /* 보상 — 대기 1 · 승인 1 (코인은 이미 빠진 것으로 본다) */
  const rq = (r, status, ago) => r ? ({ id: nid(), rewardId: r.id, title: r.title, point: r.point, emoji: r.emoji, status,
    requestedAt: new Date(Date.now() - ago * 86400000).toISOString(), ...(status === "approved" ? { approvedAt: new Date(Date.now() - (ago - 1) * 86400000).toISOString() } : {}) }) : null;
  const rewardRequests = [rq(rewards[0], "approved", 3), rq(rewards[1], "pending", 0)].filter(Boolean);

  const best = streak;
  return {
    child: { id: cid, name: "샘플", gender: "girl", sample: true },
    academies, absences, dailyData, missionRules, memoList, repeatMissions, paidStatus, payInfo,
    scoreData, rewardRequests,
    treasure: { completedQuestCount: doneCount, normalBox: 1, rareBox: 1, legendBox: 0 },
    petStage: petStageOf(best), bestStreak: best,
    shield: { count: 1, protected: [], checkedThrough: addDays(today, -1), pending: [] },
    avatarOwnedExtra: ["shoes_strawberry"], avatarEquipExtra: { shoes: "shoes_strawberry" },
  };
};

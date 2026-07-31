/* ════════════════════════════════════════════════════════════════════════
   AdventureMap — 탐험 모드 '오늘의 탐험 지도' (그림책 초원 맵)
   ────────────────────────────────────────────────────────────────────────
   · 배경(adventure-map.webp)은 완성 원화 그대로 사용 — 절대 가공하지 않는다.
     배경 속 상단 집 = 우리집(출발지), 하단 보물상자 = 오늘의 도착지(길 끝은 상자 오른쪽).
   · 학원은 사용자 제공 건물 PNG(webp 변환본)를 길 위에 Overlay만 한다.
   · 캐릭터는 길 폴리라인 위에서만, "시간 기준"으로 이동 (사용자 확정 B안):
       수업 시작 30분 전 출발 → 수업 중엔 그 학원 앞 → 마지막 수업 종료 후 보물상자.
       (건물의 ✅·반짝임은 '수업 종료' 기준 — 미션 완료 여부와 무관)
   · 수업이 끝난 학원 건물은 ✅·반짝임, 전부 끝나면 보물상자에서 축하 효과.
   · 원본 원화는 art-src/ (adventure-map-src.png, map-bld-*.png) 보관.

   props
     items    : [{id,name,time,icon,done,total}]  오늘 가는 학원들 (App이 계산)
     mode     : "today" | "past" | "future"       past=모두 통과, future=출발 전
     charEmoji: string                            캐릭터 (이미지 경로 또는 이모지)
     spark    : {t, emoji, found, gain}           길 위 '오늘의 발견' 지점 (사용자 확정 ②)
                                                  t=길 진행률, found=오늘 발견 기록됨,
                                                  gain=펫 연결이면 {kind,amount} ("먹이 +1" 연출)
     onSparkPass : ()=>void                       캐릭터가 발견 지점을 '시간 기준'으로
                                                  지나간 순간 (App이 여기서 발견을 기록)
     eventId  : string|null                       오늘의 랜덤 이벤트 id (ev_monkey 등).
                                                  원화 속 그 동물 머리 위에 👋 말풍선.
                                                  나비·거북이·무지개는 원화에 없어 아직
                                                  안 그린다 (사용자가 그림 주면 심을 것)
   ════════════════════════════════════════════════════════════════════════ */
import { useEffect, useMemo, useRef, useState } from "react";

// 지도 2종 (v5 파스텔 원화 — 이미 저채도라 배경 보정 없이 원본 사용): 0~3곳=짧은 지도 / 4곳 이상=긴 지도
// 학원 건물 아이콘 4종 (정글 세트) — 배치 순서대로 순환 사용 (원화 무수정, 위치·크기만 조정)
// cx/cy/d: 원화에 뚫린 '이모지 동그라미 구멍'의 중심·지름 (이미지 % — 투명 블롭 스캔으로 실측).
// 이모지는 구멍 '뒤'에 크림 원판과 함께 깔려, 원화의 테두리가 이모지를 자연스럽게 감싼다.
// k: 폭 보정 계수 — 원화 가로세로비가 달라도 표시 '높이'가 4종 동일해지도록 (질감 통일)
// v7 크리스프 카툰 세트 (흰 원을 투명으로 뚫어 탑재 — 이모지가 뒤에서 비치도록)
// ar: 원본 가로/세로 비 (탐험장소 줄에서 '표시 높이'를 통일할 때 사용)
// '다녀온 곳' 깃발 색 — 수채화 지도 위에서 한눈에 띄는 벽돌빛 빨강 (사용자 확정).
// 탐험장소 줄(AdventureSpotPicker)의 깃발과 같은 값을 쓴다 — 두 곳이 같은 표시여서.
export const FLAG_RED = "#C8452F";
// fx·fy = '다녀온 학원' 깃발을 꽂을 지붕 마루 좌표 (그림 폭·높이 대비 %) — 원화에서 눈으로 실측
// v8 세트 (사용자 원화 2026-07-29 — 원본 art-src/map-bld-v8/). 구 v7 webp는 롤백 대비 보존.
// 구멍(cx·cy·d)은 투명 블롭 flood-fill 실측. k = 0.9×ar → 4종의 표시 '높이'가 같아진다.
const BUILDINGS = [
  { src: "assets/map-bld-treehouse2.webp", cx: 60.1, cy: 51.8, d: 45.1, k: 0.84, ar: 488 / 526, fx: 60, fy: 7 },   // 나무 위의 집 (구멍 우측, 자체 깃대 끝에 깃발)
  { src: "assets/map-bld-stonearch2.webp", cx: 50.7, cy: 50.1, d: 40.9, k: 1.09, ar: 595 / 493, fx: 48, fy: 10 },  // 돌 아치문
  { src: "assets/map-bld-tent2.webp",      cx: 51.3, cy: 57.5, d: 36.0, k: 0.96, ar: 393 / 367, fx: 50, fy: 7 },   // 탐험가 텐트 (모닥불·배낭·랜턴)
  { src: "assets/map-bld-tikihut2.webp",   cx: 49.3, cy: 55.7, d: 41.7, k: 1.03, ar: 539 / 473, fx: 48, fy: 8 },   // 티키 초가 오두막
];

// 폴리라인 누적 길이 → t(0~1)로 좌표 보간하는 함수 생성 (지도별로 각각)
const mkPointAt = (PATH, ASPECT) => {
  const l = [0];
  for (let i = 1; i < PATH.length; i++) {
    const dx = PATH[i][0] - PATH[i - 1][0];
    const dy = (PATH[i][1] - PATH[i - 1][1]) * ASPECT;
    l.push(l[i - 1] + Math.hypot(dx, dy));
  }
  const TOTAL = l[l.length - 1];
  return (t) => {
    const d = Math.max(0, Math.min(1, t)) * TOTAL;
    for (let i = 1; i < PATH.length; i++) {
      if (d <= l[i]) {
        const r = (d - l[i - 1]) / (l[i] - l[i - 1] || 1);
        return [
          PATH[i - 1][0] + (PATH[i][0] - PATH[i - 1][0]) * r,
          PATH[i - 1][1] + (PATH[i][1] - PATH[i - 1][1]) * r,
        ];
      }
    }
    return PATH[PATH.length - 1];
  };
};

// 긴 지도 (854×1842, 양피지 보물지도) — 길 중심선 % 좌표: 오두막 계단 → 해변 보물상자 앞
/* 그날만 나타나는 이벤트 손님 그림 (사용자 원화 2026-07-31 — 원본 art-src/map-ev/) */
const EV_IMG = {
  ev_rainbow: "assets/map-ev/rainbow.webp",
  ev_butterfly: "assets/map-ev/butterfly.webp",
  ev_turtle: "assets/map-ev/turtle.webp",
};

const MAP_LONG = {
  bg: "assets/adventure-map.webp",
  ar: "853 / 1844",
  chest: [46.5, 89],
  chestOpen: [48, 93.8, 17],   // 도착 시 덮어 그릴 '열린 상자' [중심x%, 바닥y%, 폭%] — 합성 실측(20→17 축소)
  chestHide: [50.5, 89.2, 33, 14.5], // 배경에 그려진 '닫힌 상자'를 지울 모래 패치 [중심x%, 중심y%, 폭%, 높이%]
  cdy: 5.5,         // 진행도 칩(🔒 n/N)을 상자 아래로 내리는 오프셋 (지도 높이 % — 상자 안 가리게)
  // 원화에 그려진 동물들의 머리 위 좌표 (%) — 랜덤 이벤트 날 👋 말풍선 자리 (그리드 실측)
  animals: { ev_parrot: [79, 16.5], ev_monkey: [79.5, 38.5], ev_toucan: [15, 62.5], ev_boar: [76, 63.5], ev_frog: [13.5, 73.5] },
  /* [사용자 확정 2026-07-31] 지도 원화에 없는 손님 3종은 '그날만' 그려 넣는다.
     [중심x%, 중심y%, 폭%] — 평소엔 아예 없다가 그 이벤트가 걸린 날에만 나타난다. */
  evImg: { ev_rainbow: [64, 6, 30], ev_butterfly: [28, 23, 9], ev_turtle: [30, 92, 12] },
  yr: 1844 / 853,
  bw: 18, fs: 17,   // 건물 표시 폭(%)·이모지 크기 (사용자 조정: 자리 8곳 배치에 맞춰 30% 축소)
  fpk: 46,          // 발자국 개수 (경로 등간격) — 적을수록 간격이 넓어짐 (사용자 조정: 64→46)
  // 학원 건물 고정 배치 — ①~④는 사용자가 지도에 찍은 점에 '건물 모서리가 닿도록' 계산한 자리.
  // (점 = 건물의 길 쪽 모서리 중앙 / 자리 좌표는 건물 밑동 기준이라 그림 높이의 35%만큼 아래로 보정)
  // 배정은 '배열 순서 = 시간순' (①이 첫 수업). 긴 지도는 학원 4곳 이상일 때 사용.
  // ※ 사용자 확정 규칙: 자리는 반드시 '길 순서'로 나열한다 — 배열 앞쪽 = 길에서 먼저 만나는 자리.
  //    배열 순서가 곧 시간순이므로, 이렇게 해야 시간이 빠른 학원이 길 앞쪽 자리에 온다
  //    (아이가 길을 따라 걸으며 수업 순서대로 학원을 지나간다).
  //    자리를 옮길 때는 order 검증(길 t값이 배열 순서대로 증가)을 반드시 다시 할 것.
  // 건물번호(4번째 값)를 자리마다 고정한다 — 학원 수가 바뀌어도 같은 자리는 같은 건물로 보이게.
  // ※ 사용자 확정: 프리셋은 '누적'이어야 한다 — n곳 배치는 (n-1)곳 배치 + 새 자리 하나.
  //    학원을 하나 추가했을 때 기존 학원들이 지도에서 자리를 옮기지 않는다.
  //    (예전엔 5→6곳에서 폭포옆 자리가 빠지고 두 자리가 새로 생겨 3번 학원이 껑충 뛰었다)
  //    자리를 고칠 때는 '길 t 단조증가'와 '앞 배치의 자리를 모두 포함하는지'를 같이 검증할 것.
  spots: {
    // 건물번호는 '이웃끼리 같은 그림이 오지 않도록' 배정한다 (사용자: 2·3번 건물이 겹쳐 보임).
    //   [44,33]과 마지막 [22,74]의 그림을 맞바꿔(0↔3) 나무집이 연달아 나오지 않게 함.
    //   [31,38]은 그 여파로 [44,33]과 붙어 3이 겹쳐서 2(텐트)로 옮김.
    // [44,33] → [44,30] (사용자: 위로 3%). 이 지점은 길이 위(y≈24)·아래(y≈36)로 두 번 지나가는
    // 사이라, y가 32.5%를 넘어가면 아래쪽 지나감에, 그보다 위면 위쪽 지나감에 붙는다(t 0.24 ↔ 0.05).
    // 이번 이동으로 위쪽에 붙어 길 1번째가 되므로 배열에서도 맨 앞으로 옮겼다.
    4: [[79.5,28,null,1],[43.7,47.6,null,3],[73.5,56.5,null,2],[22,74,null,0]],
    5: [[44,30,null,0],[79.5,28,null,1],[43.7,47.6,null,3],[73.5,56.5,null,2],[22,74,null,0]],
    6: [[44,30,null,0],[79.5,28,null,1],[43.7,47.6,null,3],[37,60,null,1],[73.5,56.5,null,2],[22,74,null,0]],
    7: [[44,30,null,0],[79.5,28,null,1],[31,38,null,2],[43.7,47.6,null,3],[37,60,null,1],[73.5,56.5,null,2],[22,74,null,0]],
    8: [[44,30,null,0],[79.5,28,null,1],[27,31,null,3],[31,38,null,2],[43.7,47.6,null,3],[37,60,null,1],[73.5,56.5,null,2],[22,74,null,0]],
  },
  // v9 수채화 원화 모래길 중심선 자동 추출(색 분류 스캔) 좌표 — 다리 구간은 목재라 수동 보간
  pointAt: mkPointAt([
    [52,19.8],[53.5,21],[54,22],[53,23],[52.9,24.1],[54,25],[56.5,25.8],[59,26.5],
    [61.5,27.2],[64.5,28],[66.8,28.8],[68.5,29.7],[68.6,30.8],[67.5,31.8],[65,32.7],[61,33.5],
    [57,34.2],[53,34.9],[49,35.7],[45.5,36.4],[42.5,37.1],[41,38],[41.3,39],[43,39.9],
    [45.5,40.7],[48.5,41.4],[51.5,42.1],[54.5,42.9],[57.5,43.7],[59.5,44.5],[60.8,45.4],[60.7,46.4],
    [59.8,47.4],[58,48.3],[56,49.2],[53.5,50.1],[51.5,51],[49.8,51.9],[48.5,52.9],[48.3,54],
    [49.5,54.9],[51.5,55.8],[53.5,56.6],[56,57.4],[58.5,58.3],[60.5,59.2],[61.8,60.1],[62,61.1],
    [61,62.1],[59,63],[56,64],[52.5,65],[49,66],[45.5,67],[42,68],[39.5,68.9],
    [38,69.9],[37,70.9],[35.8,71.9],[34.8,72.9],[34.4,74],[35.2,75],[36.8,76],[39,76.9],
    [41.5,77.8],[44,78.6],[46.5,79.4],[48.8,80.2],[50.5,81.1],[51.8,82.1],[52.3,83.2],[52.3,84.4],
    [52.2,85.6],[54.5,86.2],[57,86.9],[59.5,87.8],[61.5,89],[63,90.5],[64,92],
  ], 1844 / 853),
};
// 짧은 지도 v2 (972×1619, 3:5 양피지) — 학원 0~2곳용, 무대 배경과 비슷한 체감 높이
const MAP_SHORT = {
  bg: "assets/adventure-map-short.webp",
  ar: "952 / 1652",
  chest: [45, 86],
  chestOpen: [45, 90.9, 17], // 도착 시 덮어 그릴 '열린 상자' [중심x%, 바닥y%, 폭%] — 합성 실측(20→17 축소)
  chestHide: [47.5, 86.3, 33, 15], // 배경에 그려진 '닫힌 상자'를 지울 모래 패치 [중심x%, 중심y%, 폭%, 높이%]
  cdy: 6.5,         // 진행도 칩(🔒 n/N)을 상자 아래로 내리는 오프셋 (지도 높이 % — 상자 안 가리게)
  // 원화에 그려진 동물들의 머리 위 좌표 (%) — 랜덤 이벤트 날 👋 말풍선 자리 (그리드 실측)
  animals: { ev_parrot: [81, 15.5], ev_monkey: [79.5, 39.5], ev_toucan: [16, 63.5], ev_boar: [73.5, 65], ev_frog: [15, 75] },
  evImg: { ev_rainbow: [62, 5.5, 31], ev_butterfly: [28, 24, 10], ev_turtle: [30, 91, 13] },
  yr: 1652 / 952,
  bw: 21, fs: 19,   // 짧은 지도 건물 크기 (사용자 조정: v8 세트에서 약간 더 축소 23→21)
  fpk: 36,          // 발자국 개수 (경로 등간격) — 적을수록 간격이 넓어짐 (사용자 조정: 50→36)
  deco: [[70,91,"🐚",13,-15]], // 상자 아래 빈 공간 소품 딱 하나 (사용자 요청: 과하지 않게)
  // 사용자 지정 자리 ①②③ — 숫자는 '사용할 자리 개수' (1곳=①만, 2곳=①②, 3곳=①②③).
  // 학원 배정은 배열 순서 = 시간순 (①이 첫 수업).
  // 자리 형식: [x, y, 라벨위치?, 건물번호?, 라벨x보정px?] — 라벨위치 "left"=이름표를 집 옆에(기본 집 위),
  // 건물번호는 BUILDINGS 인덱스 고정 지정(없으면 순환). ②는 3번(티키 초가 오두막) 고정 — 사용자 확정.
  // 라벨은 건물과 가운데 정렬 (사용자 확정: v7 원화는 좌우 대칭이라 x보정 제거)
  spots: {
    1: [[80,50]],                                    // 우측 — 원숭이를 덮는 위치
    2: [[37.7,35.7,null,3],[80,50]],                 // 좌상(라벨 집 위) → 우측
    3: [[37.7,35.7,null,3],[80,50],[21.5,79,"bottom"]], // 좌상 → 우측 → 좌하(라벨 집 아래)
  },
  // v8 수채화 원화 모래길 중심선 자동 추출(색 분류 스캔) 좌표 — 다리 구간은 목재라 수동 보간
  pointAt: mkPointAt([
    [54.5,21.5],[54.5,23],[53.5,24.5],[52.8,26],[53,27.3],[54.5,28.5],[57,29.4],[59.5,30.2],
    [62,31],[64.5,31.9],[66.5,32.8],[67.8,33.8],[67.5,35],[66,36.1],[63.5,37],[60,37.8],
    [56.5,38.5],[53,39.2],[49.5,39.9],[46.5,40.5],[43.8,41.2],[41.8,42],[40.3,42.9],[39.2,43.8],
    [39.5,44.8],[40.5,45.7],[42.5,46.5],[45.5,47.2],[48.5,47.9],[51.5,48.6],[54.5,49.3],[57.5,50],
    [60.5,50.7],[62.7,51.5],[64.5,52.3],[65.4,53.2],[64.8,54.3],[63.5,55.2],[61.5,56.1],[59,57],
    [56.5,57.9],[54.5,58.8],[52.8,59.7],[52,60.7],[52.8,61.8],[53.5,62.6],[52.5,63.8],[50.5,65],
    [48,66.2],[45.5,67.4],[43,68.5],[41,69.6],[40.5,70.7],[40,71.7],[39,72.7],[38,73.7],
    [37.4,74.7],[37.5,75.8],[38.2,76.8],[39.5,77.7],[41.5,78.6],[43.8,79.4],[46,80.2],[48,81],
    [49,82],[52,82.8],[55,83.5],[57.5,84.4],[59.5,85.7],[60.8,87.1],[61.3,88.6],
  ], 1652 / 952),
};

// (현재 미사용 — 탐험장소 줄이 이모지 스탬프로 바뀌며 건물 그림을 안 쓴다.
//  건물 방식으로 되돌릴 때를 대비해 남겨 둔다)
// 탐험일지 '탐험장소' 선택 줄이 지도와 같은 건물 배정을 쓰도록 하는 헬퍼:
// 시간순 i번째 학원 → 지도 자리(위→아래) i번째의 건물 (자리 고정 건물번호 bi 우선, 없으면 순환)
export const journalBuildings = (n) => {
  const M = n <= 3 ? MAP_SHORT : MAP_LONG;
  const sp = M.spots[n] || Array.from({ length: n }, () => []);
  return sp.map((s, i) => BUILDINGS[(s[3] ?? i) % BUILDINGS.length]);
};

// 도착 연출: 열린 상자에서 튀어오르는 동전(사용자 금화 원화)과 반짝이
//   x=상자 폭 % / s=지름 px / dx·up=궤적 / spin=true면 앞뒤로 뒤집히는 정면 금화,
//   false면 기울어진 금화가 제자리에서 구르듯 회전 (둘을 섞어야 흩날리는 느낌이 산다)
const CHEST_COINS = [
  { x: 30, s: 13, dx: "-15px", dx2: "-22px", up: "-30px", dur: 1.9, delay: 0,    spin: true },
  { x: 43, s: 15, dx: "-5px",  dx2: "-9px",  up: "-44px", dur: 2.2, delay: 0.35, spin: false },
  { x: 56, s: 12, dx: "7px",   dx2: "13px",  up: "-34px", dur: 2.0, delay: 0.75, spin: true },
  { x: 67, s: 14, dx: "17px",  dx2: "25px",  up: "-39px", dur: 2.3, delay: 1.1,  spin: false },
  { x: 49, s: 11, dx: "1px",   dx2: "3px",   up: "-50px", dur: 2.1, delay: 1.5,  spin: true },
];
const CHEST_SPARKS = [
  { x: 16, y: 20, s: 14, d: 0 }, { x: 84, y: 26, s: 11, d: 0.6 }, { x: 50, y: 4, s: 12, d: 1.1 },
  { x: 4, y: 58, s: 10, d: 1.6 }, { x: 92, y: 62, s: 12, d: 2.1 },
];

const toMin = (t = "") => { const [h, m] = String(t).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const isImg = (s) => typeof s === "string" && s.includes("assets/");

// onPick: 학원 건물 탭 → 탐험일지에 해당 학원 표시 (App이 setJournalAcId 전달)
export default function AdventureMap({ items = [], mode = "today", charEmoji = "", fullBleed = false, onPick, spark = null, onSparkPass = null, eventId = null }) {
  const sorted = [...items].sort((a, b) => toMin(a.time) - toMin(b.time));
  const n = sorted.length;
  // 학원 0~3곳=짧은 지도 / 4곳 이상=긴 지도 (사용자 확정: 짧은 지도에 3곳 배치 지점 지정)
  const M = n <= 3 ? MAP_SHORT : MAP_LONG;
  // 5곳 이상이면 이름표를 '시간만' 한 줄로 줄이고 건물 아래에 붙인다 (사용자 확정 — 지도가 빽빽해져서)
  const compact = n >= 5;
  const pointAt = M.pointAt, CHEST = M.chest;
  // 학원 건물: 지도별 고정 자리(길 옆 잔디)를 위→아래(y) 순으로 정렬해 시간순 학원에 배정 (사용자 확정)
  // 프리셋 밖 개수는 길 위 균등 분배 폴백
  // 프리셋은 '배열 순서 = 시간순(①②③…)'으로 작성한다. 예전엔 y로 정렬했지만,
  // 사용자가 자리를 옮기다 ①이 ②보다 아래로 내려가면 두 학원이 서로 뒤바뀌는 문제가 있어
  // 배열 순서를 그대로 쓴다 (자리 번호 = 시간 순번이 항상 일치).
  const spots = M.spots[n]
    ? M.spots[n]
    : sorted.map((_, i) => pointAt((i + 1) / (n + 1)));
  // 도착 지점 = '건물이 길에 걸쳐지는 지점' (사용자 확정).
  // 자리 좌표(sx,sy)는 건물의 밑동 기준점이라 그림 몸통보다 아래 → 그림 세로 중심으로 보정한 뒤
  // 길에서 가장 가까운 지점 t를 찾는다. (그 지점이 곧 건물과 길이 겹치는 곳)
  const stopT = spots.map(([sx, sy, , bi], i) => {
    const B = BUILDINGS[(bi ?? i) % BUILDINGS.length];
    const imgH = M.bw * (B.k || 1) / M.yr / (B.ar || 1);   // 그림 높이 (지도 높이 %)
    const cy = sy - 0.35 * imgH;                            // 그림 몸통 중심
    let bt = 0, bd = Infinity;
    for (let s = 0; s <= 200; s++) {
      const tt = s / 200; const [px, py] = pointAt(tt);
      const dd = (px - sx) ** 2 + ((py - cy) * M.yr) ** 2;
      if (dd < bd) { bd = dd; bt = tt; }
    }
    return bt;
  });
  // 앞으로만 이동하도록 단조 증가로 보정.
  // (예전엔 .sort()로 오름차순 정렬했는데, 자리 배정이 '배열 순서'로 바뀐 뒤로는
  //  정렬하면 학원과 정지 지점의 짝이 어긋난다 — 누적 최댓값으로 바꿔 짝을 유지한다)
  for (let i = 1; i < stopT.length; i++) if (stopT[i] < stopT[i - 1]) stopT[i] = stopT[i - 1];
  // ── 시간 기준 이동 (B안) ──────────────────────────────────
  // 수업 시작 30분 전에 출발해 시작 시각에 도착, 수업이 끝나면 다음 학원으로. 마지막 수업 종료 후 보물상자로.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (mode !== "today") return;
    const iv = setInterval(() => setTick(v => v + 1), 60000); // 1분마다 위치 갱신
    return () => clearInterval(iv);
  }, [mode]);
  const nowMin = (() => { const dt = new Date(); return dt.getHours() * 60 + dt.getMinutes(); })();
  const starts = sorted.map(a => toMin(a.time));
  const ends = sorted.map((a, i) => starts[i] + (a.duration || 40));
  const lastEnded = n > 0 && nowMin >= ends[n - 1];

  // 건물 ✅·반짝임 판정: 미션이 있으면 전부 완료 기준, 없으면 수업 종료 시각 기준
  const passedByTime = (i) => mode === "past" || (mode === "today" && nowMin >= ends[i]);
  // 건물 ✅·반짝임 = '수업이 끝났는지'만 본다 (사용자 확정: 미션 완료 여부와 무관).
  // 미션 진행은 탐험일지·미션 탭에서 보므로, 지도는 '어디까지 다녀왔는지'만 나타낸다.
  const done = (a, i) => passedByTime(i);
  // 보물상자 칩(🔒 n/N) — 건물 ✅과 같은 '수업 종료' 기준 (사용자 확정: 두 숫자가 항상 일치)
  const doneCount = mode === "past" ? n : mode === "today" ? ends.filter(e => nowMin >= e).length : 0;
  const TRAVEL = 30; // 다음 수업 시작 몇 분 전에 출발하는지
  let targetT;
  if (mode === "past") targetT = 1;
  else if (mode === "future" || n === 0) targetT = 0;
  else if (lastEnded) targetT = 1;
  else {
    let j = 0; while (j < n && nowMin >= ends[j]) j++;   // 아직 안 끝난 첫 수업 = 현재 목적지
    const from = j === 0 ? 0 : stopT[j - 1];
    const to = stopT[j];
    const t0 = starts[j] - TRAVEL, t1 = starts[j];
    targetT = nowMin <= t0 ? from : nowMin >= t1 ? to : from + (to - from) * ((nowMin - t0) / (t1 - t0));
  }

  // 캐릭터를 길을 따라 부드럽게 이동 (rAF 트윈 — 길 밖으로 나가지 않음)
  const [t, setT] = useState(mode === "past" ? 1 : 0);
  const cur = useRef(t);
  useEffect(() => {
    const from = cur.current, to = targetT;
    if (Math.abs(to - from) < 0.001) return;
    const dur = 900 + 2600 * Math.abs(to - from);
    let raf, st;
    const step = (ts) => {
      if (st === undefined) st = ts;
      const p = Math.min(1, (ts - st) / dur);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOut
      cur.current = from + (to - from) * e;
      setT(cur.current);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [targetT]);

  const arrived = t >= 0.995 && (mode === "past" || lastEnded);
  // 길 폴리라인의 끝을 '상자 오른쪽'까지 늘려 두었으므로, 도착도 트윈으로 자연스럽게 이어진다
  // (예전엔 도착 순간 좌표를 갈아끼워 순간이동처럼 보였다)
  const [cx, cy] = pointAt(t);
  const chestParty = mode === "past" || (mode === "today" && arrived);
  // (삭제됨) 아이 머리 위 발견 말풍선 — 무대의 발견 한 줄과 중복이라 뺐다 (사용자 확정).
  // 대신 발견 지점의 "{이모지} 발견!" 칩이 사라지지 않고 계속 남는다.

  // ── 길 위 '오늘의 발견' 지점 (사용자 확정 ②) ──────────────────────────
  // 발견 전엔 ✨만 깜빡인다(예고 — 뭐가 나올지는 안 보여준다). 아이가 그 위를
  // 지나는 순간 발견이 기록되고, "{이모지} 발견!" 팝(2초) 후 이모지가 남는다.
  //
  // [사용자 확정] 발견은 미션과 무관하다 — '이전 학원을 마치고 이동하며 그 지점을
  // 지나갔는가'(시간 기준)로만 정한다. 그래서 판정은 눈에 보이는 트윈 t가 아니라
  // 시간으로 계산한 targetT로 한다 (트윈은 열 때마다 0부터 다시 걷는 연출일 뿐이다).
  const sparkT = spark?.t ?? null;
  const sparkTimePassed = sparkT !== null &&
    (mode === "past" || (mode === "today" && targetT >= sparkT - 0.001));
  useEffect(() => {
    if (!spark || spark.found || !sparkTimePassed || !onSparkPass) return;
    onSparkPass();
    // onSparkPass는 App이 매 렌더 새로 만드는 함수라 deps에 넣으면 매번 다시 돈다.
    // 기록되면 spark.found가 true가 되어 다시 부르지 않는다 (App 쪽 하루 1개 가드도 있음).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sparkTimePassed, spark?.found]);
  const sparkDone = !!(spark?.found && sparkT !== null && t >= sparkT - 0.001);
  // sparkPop = '지나가는 순간' 2.3초 창 — "펫 먹이 +1" 떠오르기 전용.
  // 과거 날짜처럼 '이미 지난 채로' 열었으면 재생하지 않는다 (지나가는 순간에만).
  // ("발견!" 칩은 이와 별개로, 한 번 뜨면 그날 내내 남는다 — 사용자 확정)
  const sparkInit = useRef(null);
  if (sparkInit.current === null && sparkT !== null) sparkInit.current = sparkDone;
  const [sparkPop, setSparkPop] = useState(false);
  useEffect(() => {
    if (!sparkDone || sparkInit.current) return;
    setSparkPop(true);
    const to = setTimeout(() => setSparkPop(false), 2300);
    return () => clearTimeout(to);
  }, [sparkDone]);

  // ── 지나온 길 발자국 ──────────────────────────────────────
  // 모래길 중심선(pointAt)을 등간격 샘플링해 발자국을 전부 깔아두고,
  // 캐릭터 진행률(t)까지만 보이게 한다 → 이동 트윈을 따라 톡톡 나타나는 연출.
  // 방향은 길의 접선에 맞춰 회전, 좌/우 발은 진행 방향의 수직으로 번갈아 오프셋.
  const prints = useMemo(() => {
    const K = M.fpk || 50, out = [];
    for (let i = 1; i < K; i++) {
      const tt = i / K;
      const [ax, ay] = M.pointAt(Math.min(1, tt + 0.012));
      const [bx, by] = M.pointAt(Math.max(0, tt - 0.012));
      const ang = Math.atan2((ay - by) * M.yr, ax - bx) * 180 / Math.PI;
      const side = i % 2 ? 1 : -1;                     // 왼발/오른발
      const rad = (ang + 90) * Math.PI / 180;
      const [px, py] = M.pointAt(tt);
      out.push({ t: tt, x: px + Math.cos(rad) * 0.9 * side, y: py + (Math.sin(rad) * 0.9 * side) / M.yr, ang });
    }
    return out;
  }, [M]);

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: M.ar, borderRadius: fullBleed ? 0 : 18, overflow: "hidden", boxShadow: fullBleed ? "none" : "inset 0 0 0 1px rgba(142,165,74,0.35)" }}>
      <style>{`
        @keyframes amBob{0%,100%{transform:translate(-50%,-86%) translateY(0)}50%{transform:translate(-50%,-86%) translateY(-4px)}}
        @keyframes amSpark{0%,100%{opacity:0;transform:scale(.5)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes amStar{0%{opacity:0;transform:translateY(4px) scale(.5)}40%{opacity:1;transform:translateY(-6px) scale(1.15)}100%{opacity:0;transform:translateY(-14px) scale(.8)}}
        @keyframes amGlow{0%,100%{opacity:.25}50%{opacity:.6}}
        @keyframes amChestPop{0%{transform:scale(.8);opacity:0}60%{transform:scale(1.05);opacity:1}100%{transform:scale(1);opacity:1}}
        @keyframes amCoin{
          0%{transform:translate(-50%,0) scale(.4) rotateY(0deg);opacity:0}
          14%{opacity:1}
          50%{transform:translate(calc(-50% + var(--dx)), var(--up)) scale(1) rotateY(540deg);opacity:1}
          100%{transform:translate(calc(-50% + var(--dx2)), 24px) scale(.7) rotateY(1080deg);opacity:0}
        }
        /* 그날만 나타나는 손님(나비·거북이·무지개) — 감싼 div가 위치를 잡으므로
           애니메이션은 위치를 건드리지 않고 위아래로만 살짝 움직인다 */
        @keyframes amGuest{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        @keyframes amGuestSky{ 0%,100%{opacity:.92;transform:translateY(0) scale(1)} 50%{opacity:1;transform:translateY(-2px) scale(1.02)} }
        @keyframes amWave{
          0%,100%{transform:translate(-50%,-100%) translateY(0)}
          50%{transform:translate(-50%,-100%) translateY(-3px)}
        }
        @keyframes amSparkTease{
          0%,100%{opacity:.45;transform:translate(-50%,-50%) scale(.72) rotate(-8deg)}
          50%{opacity:1;transform:translate(-50%,-50%) scale(1.3) rotate(8deg)}
        }
        @keyframes amGainUp{
          0%{opacity:0;transform:translateX(-50%) translateY(5px) scale(.7)}
          16%{opacity:1;transform:translateX(-50%) translateY(0) scale(1.08)}
          30%{transform:translateX(-50%) translateY(-2px) scale(1)}
          100%{opacity:0;transform:translateX(-50%) translateY(-24px) scale(1)}
        }
        @keyframes amFound{
          0%{opacity:0;transform:translateX(-50%) translateY(4px) scale(.5)}
          60%{opacity:1;transform:translateX(-50%) translateY(0) scale(1.12)}
          100%{opacity:1;transform:translateX(-50%) scale(1)}
        }
        @keyframes amCoinRoll{
          0%{transform:translate(-50%,0) scale(.4) rotate(0deg);opacity:0}
          14%{opacity:1}
          50%{transform:translate(calc(-50% + var(--dx)), var(--up)) scale(1) rotate(200deg);opacity:1}
          100%{transform:translate(calc(-50% + var(--dx2)), 24px) scale(.7) rotate(400deg);opacity:0}
        }
      `}</style>
      <img src={M.bg} alt="" draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

      {/* ── 도착 시 '닫힌 상자' 지우개 — 배경에 그려진 잠긴 상자가 열린 상자 뒤로 비쳐 보여서(사용자 지적)
             사용자가 준 모래 텍스처 조각을 그 위에 덮는다. 가장자리는 타원 마스크로 흐려 이음매를 없앤다.
             발자국·캐릭터보다 먼저 그려야 상자 앞 발자국이 지워지지 않는다 (배경 바로 위 레이어). ── */}
      {chestParty && M.chestHide && (() => {
        const [hx, hy, hw, hh] = M.chestHide;
        const fade = "radial-gradient(ellipse closest-side at 50% 50%, #000 80%, transparent 100%)";
        return (
          <div style={{ position: "absolute", left: `${hx}%`, top: `${hy}%`, width: `${hw}%`, height: `${hh}%`,
            transform: "translate(-50%,-50%)", pointerEvents: "none",
            backgroundImage: "url(assets/chest-patch.webp)", backgroundSize: "100% 100%",
            WebkitMaskImage: fade, maskImage: fade }} />
        );
      })()}

      {/* ── 길 발자국 — 지나온 길만 진한 갈색으로 표시, 남은 길은 숨김 (사용자 확정: 2단계 톤 철회) ── */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {prints.map((p, i) => (
          <div key={i} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
            transform: `translate(-50%,-50%) rotate(${p.ang + 90}deg)`, // +90: 발끝 점이 진행 방향을 향하도록 (사용자 수정: 기존 -90은 반대)
            opacity: p.t <= t ? 0.62 : 0, transition: "opacity .35s ease" }}>
            <div style={{ width: 4.5, height: 7, borderRadius: "50%", background: "#7E4E20" }} />
            <div style={{ width: 2.6, height: 2.6, borderRadius: "50%", background: "#7E4E20", margin: "1px auto 0" }} />
          </div>
        ))}
      </div>

      {/* ── 지도 소품 (deco: [x,y,이모지,크기,회전]) ── */}
      {(M.deco || []).map(([ex, ey, em, efs, erot], i) => (
        <span key={i} style={{ position: "absolute", left: `${ex}%`, top: `${ey}%`,
          transform: `translate(-50%,-50%) rotate(${erot || 0}deg)`, fontSize: efs || 13,
          opacity: 0.95, pointerEvents: "none", filter: "drop-shadow(0 1px 2px rgba(93,70,51,0.3))" }}>{em}</span>
      ))}

      {/* ── 학원 건물 Overlay (배경 무수정 — 길 옆 잔디 고정 좌표, 비슷한 크기) ── */}
      {sorted.map((ac, i) => {
        const [x, y, lp, bi, ldx] = spots[i];
        const d = done(ac, i);
        const B = BUILDINGS[(bi ?? i) % BUILDINGS.length];
        // 지나온 학원(수업 종료) 표현 — 지붕의 빨간 깃발 하나로만 나타낸다 (사용자 확정).
        // 예전엔 건물 채도를 -50% 낮췄지만, 다녀온 곳이 흐릿해 보여 철회. 건물은 항상 원색.
        const past = passedByTime(i);
        const chip = past
          ? { background: "rgba(238,233,221,0.90)", border: "1px solid rgba(155,114,74,0.30)", borderRadius: 9, padding: "2px 8px", fontSize: 10, fontWeight: 900, color: "#5D4633", whiteSpace: "nowrap", boxShadow: "0 2px 5px rgba(60,80,40,0.14)" }
          : { background: "rgba(255,251,240,0.92)", border: "1px solid rgba(155,114,74,0.35)", borderRadius: 9, padding: "2px 8px", fontSize: 10, fontWeight: 900, color: "#5D4633", whiteSpace: "nowrap", boxShadow: "0 2px 5px rgba(60,80,40,0.18)" };
        // 이름표 2줄 통일 (사용자 확정): 1줄 학원명 / 2줄 🕘 시간 — 엄마는 시간부터 보므로 시간을 진하게
        const label = (<>
          <span style={{ fontWeight: 700 }}>{d ? "✅ " : ""}{ac.name}</span>
          {ac.time ? <div style={{ fontSize: 10.5, marginTop: 1, color: "#3F2E1E" }}>🕘 {ac.time}</div> : null}
        </>);
        // 5곳 이상(compact)은 한 줄 '아이콘 + 시간'만
        const timeLabel = <span style={{ fontSize: 10.5, color: "#3F2E1E" }}>🕘 {ac.time || "-"}</span>;
        // 다녀온 학원은 이름표를 떼고 지붕에 깃발을 꽂는다 (사용자 확정 — 탐험장소 줄과 같은 표현).
        // 단 '떼기'는 visibility로만 — 자리 좌표가 [이름표+건물] 블록 기준이라 통째로 빼면 건물이 밀린다.
        const labelOff = compact || past;
        return (
          <div key={ac.id} onClick={onPick ? () => onPick(ac.id) : undefined}
            style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-78%)", width: `${M.bw * (B.k || 1)}%`, textAlign: "center", pointerEvents: onPick ? "auto" : "none", cursor: onPick ? "pointer" : undefined }}>
            {/* 이름표 — 기본은 집 위, lp==="left"=집 왼쪽 옆, lp==="bottom"=집 아래. ldx=x미세보정.
                flex 중앙정렬 + flexShrink:0 — 이름표가 건물 폭보다 넓어도 줄어들지 않고 양옆으로 균등하게 넘친다 */}
            {/* compact(5곳 이상)일 땐 이 자리를 '보이지 않게'만 두고 실제 이름표는 건물 아래에 그린다.
                자리를 비우지 않고 남기는 이유: 자리 좌표는 [이름표+건물] 블록의 78% 지점 기준이라
                이름표를 통째로 빼면 지금까지 맞춰 둔 건물 위치가 전부 위로 밀려 올라간다. */}
            {!lp && (
            <div aria-hidden={labelOff || undefined}
              style={{ display: "flex", justifyContent: "center", marginBottom: -3, position: "relative", left: ldx || 0, zIndex: 3,
                visibility: labelOff ? "hidden" : undefined }}>
              <div style={{ ...chip, flexShrink: 0, maxWidth: "230%", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
            </div>
            )}
            {lp === "left" && !past && (
            <div style={{ ...chip, position: "absolute", right: "74%", top: "15%", marginRight: 3, zIndex: 3 }}>
              {label}
            </div>
            )}
            <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
              {/* (삭제됨) 수업 종료 건물의 ✨ 반짝이 — 길 위 '발견 지점' ✨와 헷갈려서 뺐다
                  (사용자 확정). 완료 표시는 지붕 깃발 + 골드 글로우로 충분하다. */}
              {/* 구멍 뒤 크림 원판 + 학원 이모지 — 아이 학원카드와 같은 이모지를 항상 유지 (완료 표시는 이름표 ✅) */}
              <span style={{ position: "absolute", left: `${B.cx}%`, top: `${B.cy}%`, width: `${B.d + 5}%`, aspectRatio: "1/1", transform: "translate(-50%,-50%)", borderRadius: "50%", background: "#FFF9EC", display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(M.fs * (B.es || 1)), lineHeight: 1, zIndex: 0 }}>
                {ac.icon}
              </span>
              <img src={B.src} alt="" draggable={false}
                style={{ position: "relative", zIndex: 1, width: "100%", height: "auto", display: "block", transition: "filter .4s ease", filter: (d ? "drop-shadow(0 0 2px rgba(255,249,236,0.9)) drop-shadow(0 0 8px rgba(255,224,130,0.85)) drop-shadow(0 5px 6px rgba(60,80,40,0.42))" : "drop-shadow(0 0 2px rgba(255,249,236,0.9)) drop-shadow(0 0 1px rgba(255,249,236,0.8)) drop-shadow(0 5px 6px rgba(60,80,40,0.42))") }} />
              {/* 5곳 이상: 시간만 남긴 이름표를 건물 바로 아래에 (사용자 확정).
                  흐름 밖(absolute)에 둬야 블록 높이가 안 변해 건물이 제자리에 그대로 있는다 */}
              {compact && !past && (
                <div style={{ position: "absolute", left: "50%", top: "100%", transform: "translateX(-50%)", marginTop: -3, zIndex: 3 }}>
                  <div style={{ ...chip }}>{timeLabel}</div>
                </div>
              )}
              {/* 다녀온 학원 = 지붕에 꽂은 깃발 (탐험장소 줄의 깃발과 같은 모양·색).
                  건물 그림은 채도를 낮추지만 깃발은 표시라 원색 유지 → 필터 밖(img 형제)에 그린다 */}
              {past && (
                <span aria-hidden="true" style={{ position: "absolute", left: `${B.fx ?? 50}%`, top: `${B.fy ?? 18}%`,
                  transform: "translateY(calc(-100% + 3px))", width: 13, height: 25, zIndex: 2 }}>
                  <span style={{ position: "absolute", left: 0, bottom: 0, width: 2, height: 25, borderRadius: 1, background: "#7E4E20" }} />
                  <span style={{ position: "absolute", left: 2, top: 0, width: 11, height: 9, background: FLAG_RED,
                    clipPath: "polygon(0 0, 100% 0, 72% 50%, 100% 100%, 0 100%)", borderRadius: 1,
                    filter: "drop-shadow(0 1px 1.5px rgba(60,50,40,0.35))" }} />
                </span>
              )}
            </div>
            {lp === "bottom" && (
            <div aria-hidden={past || undefined}
              style={{ display: "flex", justifyContent: "center", marginTop: -3, position: "relative", left: ldx || 0, zIndex: 3,
                visibility: past ? "hidden" : undefined }}>
              <div style={{ ...chip, flexShrink: 0, maxWidth: "230%", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
            </div>
            )}
          </div>
        );
      })}

      {/* ── 보물상자 축하 효과 (모두 완료 시 — 배경 속 상자 위에 겹치기만) ── */}
      {/* 도착하면 배경 속 닫힌 상자를 '열린 보물상자' 원화로 덮고, 동전·반짝이가 튀어오른다 (사용자 확정) */}
      {chestParty && (() => {
        const [ox, oy, ow] = M.chestOpen;
        return (
          <div style={{ position: "absolute", left: `${ox}%`, top: `${oy}%`, width: `${ow}%`, transform: "translate(-50%,-100%)", pointerEvents: "none", zIndex: 2 }}>
            {/* 황금빛 후광 */}
            <div style={{ position: "absolute", left: "50%", top: "52%", width: "165%", aspectRatio: "1 / 0.72", transform: "translate(-50%,-50%)", borderRadius: "50%", background: "radial-gradient(ellipse at 50% 50%, rgba(255,214,90,0.5), transparent 70%)", animation: "amGlow 2.2s ease-in-out infinite" }} />
            <img src="assets/chest-open.webp" alt="" draggable={false}
              style={{ position: "relative", width: "100%", height: "auto", display: "block", transformOrigin: "50% 100%",
                animation: "amChestPop .55s cubic-bezier(.34,1.56,.64,1) both",
                filter: "drop-shadow(0 4px 6px rgba(60,80,40,0.35))" }} />
            {/* 동전 튀어오름 — 상자 입구에서 위로 솟았다가 떨어지며 사라짐 */}
            {CHEST_COINS.map((c, i) => (
              <img key={i} src={c.spin ? "assets/coin-front.webp" : "assets/coin-tilt.webp"} alt="" draggable={false}
                style={{ position: "absolute", left: `${c.x}%`, top: "40%", width: c.s, height: "auto",
                  filter: "drop-shadow(0 1px 2px rgba(120,80,10,0.45))",
                  "--dx": c.dx, "--dx2": c.dx2, "--up": c.up,
                  animation: `${c.spin ? "amCoin" : "amCoinRoll"} ${c.dur}s ease-out ${c.delay}s infinite` }} />
            ))}
            {/* 반짝이 */}
            {CHEST_SPARKS.map((s, i) => (
              <span key={i} style={{ position: "absolute", left: `${s.x}%`, top: `${s.y}%`, fontSize: s.s,
                animation: `amSpark 2.4s ease-in-out ${s.d}s infinite` }}>✨</span>
            ))}
          </div>
        );
      })()}

      {/* ── 보물상자 진행도 칩 — 🔒 n/N, 전부 완료하면 🔓. 상자 '아래' 배치 (사용자 확정) ── */}
      {n > 0 && mode !== "future" && (
        <div style={{ position: "absolute", left: `${CHEST[0]}%`, top: `${CHEST[1] + (M.cdy || 8)}%`, transform: "translate(-50%,-50%)", zIndex: 2, pointerEvents: "none",
          background: "rgba(255,251,240,0.94)", border: `1px solid ${doneCount >= n ? "rgba(212,160,60,0.75)" : "rgba(155,114,74,0.4)"}`, borderRadius: 999,
          padding: "2px 8px", fontSize: 10.5, fontWeight: 900, color: "#5D4633", whiteSpace: "nowrap", boxShadow: "0 2px 5px rgba(60,80,40,0.2)" }}>
          {doneCount >= n ? "🔓" : "🔒"} {doneCount}/{n}
        </div>
      )}

      {/* ── 랜덤 이벤트 — 지도에 없던 손님 (나비·거북이·무지개) ──
             [사용자 확정] 평소엔 지도에 없다가 그 이벤트가 걸린 날에만 나타난다.
             무지개는 동물이 아니라 👋 말풍선을 붙이지 않는다. ── */}
      {eventId && M.evImg?.[eventId] && EV_IMG[eventId] && (() => {
        const [ax, ay, aw] = M.evImg[eventId];
        const wave = eventId !== "ev_rainbow";
        return (
          <div style={{ position: "absolute", left: `${ax}%`, top: `${ay}%`, width: `${aw}%`,
            transform: "translate(-50%,-50%)", pointerEvents: "none", zIndex: 2 }}>
            <img src={EV_IMG[eventId]} alt="" draggable={false}
              style={{ width: "100%", display: "block",
                animation: wave ? "amGuest 2.4s ease-in-out infinite" : "amGuestSky 4s ease-in-out infinite",
                filter: "drop-shadow(0 2px 5px rgba(60,80,40,0.3))" }} />
            {wave && (
              <div style={{ position: "absolute", left: "50%", bottom: "100%", transform: "translateX(-50%)", marginBottom: 2,
                background: "rgba(255,251,240,0.95)", border: "1px solid rgba(155,114,74,0.4)",
                borderRadius: 999, padding: "2px 6px", fontSize: 11, lineHeight: 1.3, whiteSpace: "nowrap",
                boxShadow: "0 2px 5px rgba(60,80,40,0.25)" }}>👋</div>
            )}
          </div>
        );
      })()}

      {/* ── 랜덤 이벤트 — 오늘 만난 동물 머리 위 👋 말풍선 (사용자 확정) ──
             이벤트는 날짜 고정 시드라 하루 종일 같은 동물이 인사한다. 발견 여부와
             무관하게 종일 보여준다 — 지도를 보는 재미가 목적이라서. ── */}
      {eventId && M.animals?.[eventId] && (() => {
        const [ax, ay] = M.animals[eventId];
        return (
          <div style={{ position: "absolute", left: `${ax}%`, top: `${ay}%`,
            animation: "amWave 2s ease-in-out infinite", pointerEvents: "none", zIndex: 2 }}>
            <div style={{ position: "relative", background: "rgba(255,251,240,0.95)", border: "1px solid rgba(155,114,74,0.4)",
              borderRadius: 999, padding: "2px 6px", fontSize: 11, lineHeight: 1.3,
              boxShadow: "0 2px 5px rgba(60,80,40,0.25)" }}>
              👋
              <span style={{ position: "absolute", left: "50%", bottom: -4, transform: "translateX(-50%)", width: 0, height: 0,
                borderLeft: "4px solid transparent", borderRight: "4px solid transparent",
                borderTop: "4px solid rgba(255,251,240,0.95)" }} />
            </div>
          </div>
        );
      })()}

      {/* ── 길 위 '오늘의 발견' 지점 — 발견 전 ✨ 깜빡임 / 지나가면 발견 팝 → 이모지 안착 ── */}
      {spark && sparkT !== null && (() => {
        const [sx, sy] = pointAt(sparkT);
        const base = { position: "absolute", left: `${sx}%`, top: `${sy}%`, pointerEvents: "none", zIndex: 2 };
        if (sparkDone) return (
          <div style={{ ...base, transform: "translate(-50%,-50%)" }}>
            {/* "{이모지} 발견!" 칩 — 한 번 뜨면 사라지지 않고 그날 내내 남는다 (사용자 확정:
                머리 위 말풍선을 뺀 대신 이 칩이 발견 표시를 맡는다). 등장만 팝(amFound). */}
            <div style={{ position: "absolute", left: "50%", bottom: "100%", transform: "translateX(-50%)", marginBottom: 3,
              background: "rgba(255,251,240,0.95)", border: "1px solid rgba(212,160,60,0.65)", borderRadius: 999,
              padding: "2px 8px", fontSize: 10.5, fontWeight: 900, color: "#5D4633", whiteSpace: "nowrap",
              boxShadow: "0 2px 6px rgba(60,80,40,0.25)", animation: "amFound .55s ease-out both" }}>
              {spark.emoji} 발견!
            </div>
            {/* 펫 연결 발견 — 지나가는 순간에만 "🍖 펫 먹이 +1"이 물건 위로 떠오르다 사라진다
                (사용자 확정: 펫은 화면에 안 보일 때가 많아 무대가 아니라 여기서. 칩 없이 글자만) */}
            {sparkPop && spark.gain && (
              <div style={{ position: "absolute", left: "50%", bottom: "100%", marginBottom: 26,
                whiteSpace: "nowrap", fontSize: 11, fontWeight: 900, color: "#B4551D",
                textShadow: "0 0 3px rgba(255,251,240,0.95), 0 0 5px rgba(255,251,240,0.9), 0 1px 2px rgba(255,251,240,0.9)",
                animation: "amGainUp 2.2s ease-out both" }}>
                {spark.gain.kind === "먹이" ? "🍖" : "❤️"} 펫 {spark.gain.kind} +{spark.gain.amount}
              </div>
            )}
            <span style={{ fontSize: 13, lineHeight: 1, display: "block",
              filter: "drop-shadow(0 0 2px rgba(255,251,240,0.9)) drop-shadow(0 2px 3px rgba(60,80,40,0.3))" }}>{spark.emoji}</span>
          </div>
        );
        /* 발견 전 예고 ✨ — 언제든 보이면서 '반짝반짝'해야 한다 (사용자 확정 2건).
           큰 ✨는 절반 아래로 안 어두워지는 펄스(0.45~1 + 크기·기울기 출렁임),
           작은 ✨는 반대 위상으로 완전히 껐다 켜져(amSpark) 둘이 번갈아 반짝인다
           — 한쪽이 어두울 때 다른 쪽이 빛나서 정지해 보이는 순간이 없다. */
        return (
          <div style={{ ...base, transform: "translate(-50%,-50%)", width: 0, height: 0 }}>
            <span style={{ position: "absolute", left: 0, top: 0, fontSize: 15, lineHeight: 1, display: "block",
              filter: "drop-shadow(0 0 3px rgba(255,205,90,0.95)) drop-shadow(0 0 2px rgba(255,251,240,0.9)) drop-shadow(0 1px 3px rgba(60,80,40,0.35))",
              animation: "amSparkTease 1.3s ease-in-out infinite" }}>✨</span>
            <span style={{ position: "absolute", left: 8, top: -11, fontSize: 9, lineHeight: 1, display: "block",
              filter: "drop-shadow(0 0 2px rgba(255,251,240,0.9))",
              animation: "amSpark 1.3s ease-in-out -0.65s infinite" }}>✨</span>
          </div>
        );
      })()}

      {/* ── 캐릭터 — 항상 길 위 (폴리라인 보간 위치) ── */}
      <div style={{ position: "absolute", left: `${cx}%`, top: `${cy}%`, transform: "translate(-50%,-86%)", animation: "amBob 2.4s ease-in-out infinite", pointerEvents: "none", zIndex: 3 }}>
        {isImg(charEmoji)
          ? <img src={charEmoji} alt="" draggable={false} style={{ height: 68, width: "auto", display: "block", filter: "drop-shadow(0 0 2px rgba(255,251,240,0.9)) drop-shadow(0 4px 5px rgba(60,80,40,0.35))" }} />
          : <span style={{ fontSize: 32, lineHeight: 1, display: "block", filter: "drop-shadow(0 0 2px rgba(255,251,240,0.9)) drop-shadow(0 4px 5px rgba(60,80,40,0.35))" }}>{charEmoji || "🦸"}</span>}
        <div style={{ width: 22, height: 6, borderRadius: "50%", background: "rgba(60,80,40,0.3)", filter: "blur(2.5px)", margin: "-2px auto 0" }} />
      </div>
    </div>
  );
}

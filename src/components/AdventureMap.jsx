/* ════════════════════════════════════════════════════════════════════════
   AdventureMap — 탐험 모드 '오늘의 탐험 지도' (그림책 초원 맵)
   ────────────────────────────────────────────────────────────────────────
   · 배경(adventure-map.webp)은 완성 원화 그대로 쓴다 — 가공은 원칙적으로 하지 않는다.
     [예외 · 사용자 확정 2026-08-03] v10 원화 두 장에는 해변 보물상자가 그려져 있지 않았다.
     상자는 '도착 목표' 표시라 없으면 도착 전까지 목표가 안 보이므로, v9 지도의 상자를
     모래째 네모로 떠서(가장자리 페더 + 모래색 맞춤) 해변에 합성해 탑재했다.
     art-src에는 상자 없는 사용자 원본을 그대로 보관한다.
     배경 속 상단 집 = 우리집(출발지), 하단 보물상자 = 오늘의 도착지(길 끝은 상자 오른쪽).
   · 학원은 사용자 제공 건물 PNG(webp 변환본)를 길 위에 Overlay만 한다.
   · 캐릭터는 길 폴리라인 위에서만, "시간 기준"으로 이동 (사용자 확정 B안):
       수업 시작 30분 전 출발 → 수업 중엔 그 학원 앞 → 마지막 수업 종료 후 보물상자.
       (건물의 ✅·반짝임은 '수업 종료' 기준 — 미션 완료 여부와 무관)
   · 수업이 끝난 학원 건물은 ✅·반짝임, 전부 끝나면 보물상자에서 축하 효과.
   · 원본 원화는 art-src/ (adventure-map-v10-src.webp, map-bld-*.png) 보관.

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
  /* [사용자 확정 2026-08-13] v9 세트 — 네 채를 통째로 새 원화로 바꿨다 (원본 art-src/map-bld-v9/).
     파일명은 예전 이름 그대로 둔다(CLAUDE.md 6 — public/assets 는 같은 이름으로 덮어쓴다).
     그림은 아래 주석이 실제 내용이다.
     cx·cy·d 는 원화의 크림색 원(학원 아이콘 자리)을 실측한 값 —
     cx·cy 는 원 중심을 그림 폭·높이의 %로, d 는 가로·세로 지름의 평균을 그림 폭의 %로.
     받은 원화는 그 원이 크림색으로 막혀 있어서(예전 판은 뚫려 있었다) 아이콘이 가린다 →
     탑재할 때 그 원만 알파 0으로 뚫었다. 뒤에 그리는 크림 원판(d+5)이 그 자리를 채운다.
     k 는 '네 채의 표시 높이를 같게' 맞추는 값이다 — 표시높이 = bw·k/ar 이 항상 14.4가 되도록
     k = ar / 1.1083 로 잡았다(예전 네 채도 같은 규칙이었다). 그래서 크기는 예전과 동일하다. */
  { src: "assets/map-bld-treehouse2.webp", cx: 49.3, cy: 59.2, d: 39.3, k: 0.88, ar: 499 / 511, fx: 44, fy: 11 },  // 초가 오두막 (통나무 벽·툇마루·항아리)
  { src: "assets/map-bld-stonearch2.webp", cx: 40.9, cy: 58.5, d: 38.9, k: 0.95, ar: 518 / 490, fx: 38, fy: 13 },  // 주황 기와 오두막 (굴뚝·돌계단·항아리)
  { src: "assets/map-bld-tent2.webp",      cx: 45.3, cy: 61.6, d: 37.0, k: 0.91, ar: 503 / 501, fx: 42, fy: 12 },  // 나무 가판대 (청록 차양·랜턴·물통·나무통)
  { src: "assets/map-bld-tikihut2.webp",   cx: 42.5, cy: 58.8, d: 38.9, k: 0.96, ar: 521 / 489, fx: 40, fy: 12 },  // 조개집 (불가사리·산호·조개 계단)
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
/* 지도에 얹는 동물 다섯 — 하루 두 마리만 나온다 (data/discoveries.js의 rollMapAnimals) */
const ANIMAL_IMG = {
  ev_parrot: "assets/map-ev/parrot.webp",
  ev_monkey: "assets/map-ev/monkey.webp",
  ev_toucan: "assets/map-ev/toucan.webp",
  ev_boar:   "assets/map-ev/boar.webp",
  ev_frog:   "assets/map-ev/frog.webp",
  ev_turtle: "assets/map-ev/turtle.webp",
};
/* [사용자 확정 2026-08-13] 같은 그룹끼리는 하루에 같이 안 나온다.
   자리가 서로 가깝거나 그림 덩치가 비슷해서 둘이 함께 뜨면 한쪽으로 쏠려 보인다.
   여기 없는 동물(나비)은 짝 제한이 없다 — 아무하고나 같이 나올 수 있다.
   하루 두 마리를 고르는 곳(shownAnimals)에서 이 값을 본다. */
const ANIMAL_GROUP = {
  ev_parrot: "parrot-monkey", ev_monkey: "parrot-monkey",   // 오른쪽 위·가운데
  ev_boar:   "boar-turtle",   ev_turtle: "boar-turtle",     // 오른쪽 아래
  ev_frog:   "frog-toucan",   ev_toucan: "frog-toucan",     // 왼쪽
};
/* 하루에 나오는 마릿수 = 그룹 수(3). 그룹마다 한 마리씩 뽑는다 — shownAnimals 참고. */
/* 원화 실측 가로/세로 — 말풍선을 동물 '머리 위'에 놓으려면 높이를 알아야 한다.
   폭만 %로 주고 높이는 비율로 따라오므로, 지도 높이 % 로 환산해서 쓴다:
     높이% = 폭% / (원화비율 × 지도세로비) */
const ANIMAL_AR = { ev_parrot: 738/1158, ev_monkey: 813/936, ev_toucan: 967/809,
                    ev_boar: 870/749, ev_frog: 1406/886,
                    ev_turtle: 300/175 };
const animalTop = (M, id) => {
  const a = M.animals?.[id]; if (!a) return null;
  const [ax, by, aw] = a;
  return [ax, by - aw / (ANIMAL_AR[id] * M.yr)];
};

/* 무지개만 남은 '하늘' 그림 — 동물처럼 땅에 서지 않아 중심 기준으로 놓는다 */
const EV_IMG = { ev_rainbow: "assets/map-ev/rainbow.webp" };

const MAP_LONG = {
  bg: "assets/adventure-map.webp",
  ar: "885 / 1777",   // 원화 v14 실측 (v13과 같은 크기)
  /* [사용자 확정 2026-08-13] 상자를 오른쪽으로 옮겼다 (x 37 → 45.5, 지도에 파란 점으로 찍어 줌).
     길 끝(50,90) '옆'이라는 원칙은 그대로고, 8.5%만큼 길 쪽으로 붙였다 —
     예전 자리는 길에서 너무 떨어져 상자가 지도 왼쪽 구석에 혼자 있는 느낌이었다.
     [중심x%, 바닥y%, 폭%] — v11 원화엔 상자가 안 그려져 있어 따로 얹는다. */
  chest: [45.5, 88],
  chestClosed: [45.5, 93, 16],
  chestOpen: [45.5, 93, 16],    // 도착하면 같은 자리에 '열린 상자'로 갈아 끼운다
  cdy: 5.5,         // 진행도 칩(🔒 n/N)을 상자 아래로 내리는 오프셋 (지도 높이 % — 상자 안 가리게)
  /* 동물 여섯 [중심x%, 바닥y%, 폭%] — 하루 세 마리, 그룹마다 하나씩 (shownAnimals)
     [사용자 확정 2026-08-13] 자리는 사용자가 격자 시트에 파란 점으로 찍어 준 값이다.
     짧은 지도와 같은 배치로 맞췄다 — 큰부리새 왼쪽 위 / 앵무새 오른쪽 위 /
     원숭이 오른쪽 중턱 / 개구리 왼쪽 폭포 옆 / 멧돼지 오른쪽 아래(그대로) /
     거북이 오른쪽 아래 모래사장. 예전엔 왼쪽 아래(x 15)에 셋이 몰려 있었다.
     폭은 17 로 통일하고 개구리만 24.3 — 원화가 납작해(가로세로 1.59:1)
     같은 폭에서 유독 작아 보인다.
     [사용자 확정 2026-08-13] 20 → 17 (개구리 28.6 → 24.3, 같은 비율로 15% 축소).
     기준은 '학원 건물보다 약간 큰 정도' — 건물은 폭 14~16.4 · 높이 14.4 라
     동물 폭 17이 그보다 조금 크다.
     거북이는 70.3,89.6 → 78,84 로 오른쪽·위로 옮겼다 — 아이 도착 지점(60.3,90.6)과
     겹쳤기 때문이다. 강물에 살짝 걸치는 건 사용자가 괜찮다고 했다.
     높이는 원화 비율을 따라가므로 폭이 같아도 종마다 다르다 — 높이% = 폭% / (원화비율 × yr). */
  animals: { ev_parrot: [88, 29.8, 17], ev_monkey: [87.4, 45.9, 17], ev_toucan: [15.3, 34.9, 17],
             ev_boar: [85, 73, 17], ev_frog: [20.6, 61.4, 24.3],
             ev_turtle: [78, 84, 17] },
  /* [사용자 확정 2026-07-31] 지도 원화에 없는 손님 3종은 '그날만' 그려 넣는다.
     [중심x%, 중심y%, 폭%] — 평소엔 아예 없다가 그 이벤트가 걸린 날에만 나타난다. */
  /* [사용자 확정 2026-08-13] 무지개를 오른쪽 위 → 왼쪽 위로 옮기고 살짝 기울였다
     (사용자가 지도에 그려 준 자리). 값은 [중심x%, 중심y%, 폭%, 기울기°].
     이후 한 번 더 위·왼쪽으로 (27,12 → 19,7). 나침반(동서남북)을 가려도 된다고 확인받았다. */
  evImg: { ev_rainbow: [19, 7, 30, -15] },
  yr: 1777 / 885,
  bw: 14.4, fs: 13.6, // 건물 표시 폭(%)·이모지 크기 (사용자 조정 2026-08-12: 여기서 20% 더 축소 18→14.4)
  fpk: 46,          // 발자국 개수 (경로 등간격) — 적을수록 간격이 넓어짐 (사용자 조정: 64→46)
  // 학원 건물 고정 배치 — ①~④는 사용자가 지도에 찍은 점에 '건물 모서리가 닿도록' 계산한 자리.
  // (점 = 건물의 길 쪽 모서리 중앙 / 자리 좌표는 건물 밑동 기준이라 그림 높이의 35%만큼 아래로 보정)
  // 배정은 '배열 순서 = 시간순' (①이 첫 수업). 긴 지도는 학원 4곳 이상일 때 사용.
  // ※ 사용자 확정 규칙: 자리는 반드시 '길 순서'로 나열한다 — 배열 앞쪽 = 길에서 먼저 만나는 자리.
  //    배열 순서가 곧 시간순이므로, 이렇게 해야 시간이 빠른 학원이 길 앞쪽 자리에 온다
  //    (아이가 길을 따라 걸으며 수업 순서대로 학원을 지나간다).
  //    자리를 옮길 때는 order 검증(길 t값이 배열 순서대로 증가)을 반드시 다시 할 것.
  //    [2026-08-03] 6·7·8곳 배치에서 폭포옆 돌집(37·59.8, t=0.588)이 오른쪽 텐트
  //    (73.5·56.4, t=0.502)보다 배열 앞에 있어 길 순서가 뒤집혀 있었다. 아래 단조
  //    보정에 걸려 두 학원이 같은 지점에서 멈췄다(아이가 뒤로 가지 않게 막느라).
  //    자리는 그대로 두고 배열 순서만 길 순서에 맞춰 바꿨다 — 건물 위치·그림은
  //    그대로고, 두 건물에 붙는 시간표만 서로 바뀐다.
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
    /* [사용자 확정 2026-08-13] 여덟 자리 전부 사용자가 지도에 찍어 준 점 그대로다.
       ── 사용자 확정 규칙 두 가지 ──
       (1) 4곳이 '기본'이고, 학원이 하나 늘 때마다 정해진 자리가 하나씩 얹힌다.
           추가 순서: 5번째=(70.5,63.2) → 6번째=(45.1,36.6) → 7번째=(53.6,80.4) → 8번째=(66.2,46.6).
           그래서 n곳 배치는 (n-1)곳 배치 + 새 자리 하나 — 학원을 추가해도 기존 학원이 안 움직인다.
       (2) 배열(=수업 시간) 순서는 '추가된 순서'가 아니라 지도에서 위→아래 순서다.
           그래서 새 자리는 y값이 맞는 위치에 끼워 넣는다
           (예: 6번째로 추가된 (45.1,36.6)은 y가 두 번째로 작아 배열에선 ① 다음에 온다).
       건물 번호는 자리마다 고정하고, 어느 배치에서든 이웃끼리 같은 그림이 안 오게 골랐다. */
    4: [[68.8,31.8,null,1],[32.1,44.5,null,3],[74.3,51.9,null,2],[30.5,74.8,null,0]],
    5: [[68.8,31.8,null,1],[32.1,44.5,null,3],[74.3,51.9,null,2],[70.5,63.2,null,3],[30.5,74.8,null,0]],
    6: [[68.8,31.8,null,1],[45.1,36.6,null,0],[32.1,44.5,null,3],[74.3,51.9,null,2],[70.5,63.2,null,3],[30.5,74.8,null,0]],
    7: [[68.8,31.8,null,1],[45.1,36.6,null,0],[32.1,44.5,null,3],[74.3,51.9,null,2],[70.5,63.2,null,3],[30.5,74.8,null,0],[53.6,80.4,null,2]],
    8: [[68.8,31.8,null,1],[45.1,36.6,null,0],[32.1,44.5,null,3],[57,47,null,1],[74.3,51.9,null,2],[70.5,63.2,null,3],[30.5,74.8,null,0],[53.6,80.4,null,2]],
  },
  pointAt: mkPointAt([
    /* v14 원화 모래길 중심선 — 원화가 바뀌면서 길이 다시 그려져(굽이가 커지고 폭이 넓어졌다)
       옛 90점이 길 밖으로 밀려났다. 새로 뽑은 값이다.
       뽑는 법: 가로줄마다 모래색 구간을 찾아 중심을 잇고(0.8%씩), 3점 이동평균으로 다듬는다.
       다리 구간(y 61~72)은 난간·기둥·상판이 길을 가려 자동 검출이 튄다 → 다리 위아래의
       마지막 실측 중심(56.1@61.2 → 58@64.1 → 45.5@72.4)을 이어 손으로 채웠다.
       꼬리(y 86 아래)도 길이 모래사장에 녹아 경계가 사라진다 → 예전과 같은 곡선으로 이어
       보물상자(45.5) 오른쪽 옆(60.3, 90.6)에서 끝나게 했다. */
    [57.9,21.6],[59,22.4],[59.6,23.2],[59.5,24],[58.8,24.8],[57.6,25.6],[56,26.4],[54.5,27.2],[53.3,28],
    [52.6,28.8],[52.3,29.6],[52.6,30.4],[53.6,31.2],[55.4,32],[58,32.8],[60.4,33.6],[62.7,34.4],
    [63.9,35.2],[64.6,36],[64.2,36.8],[62.6,37.6],[60.1,38.4],[57.1,39.2],[54,40],[51,40.8],[48.3,41.6],
    [46.1,42.4],[44.6,43.2],[43.7,44],[43.4,44.8],[43.6,45.6],[44.5,46.4],[46.2,47.2],[48.6,48],
    [51.4,48.8],[54.2,49.6],[56.9,50.4],[59.4,51.2],[61.2,52],[62.2,52.8],[62.4,53.6],[61.9,54.4],
    [61.2,55.2],[60.1,56],[58.8,56.8],[57.6,57.6],[56.5,58.4],[56,59.2],[55.7,60],[56,60.8],[56.4,61.6],
    [56.9,62.4],[57.4,63.2],[57.4,64],[56.8,64.8],[55.7,65.6],[54.5,66.4],[53.3,67.2],[52.1,68],
    [50.9,68.8],[49.7,69.6],[48.5,70.4],[47.3,71.2],[46,72],[44.5,72.8],[42.9,73.6],[41.3,74.4],
    [39.9,75.2],[38.9,76],[38.1,76.8],[37.8,77.6],[37.9,78.4],[38.6,79.2],[40,80],[41.7,80.8],
    [44.1,81.6],[46,82.4],[47.7,83.2],[48.8,84],[49.7,84.8],[50.3,85.6],[50.6,86.7],[51.2,87.4],
    [52.3,88],[53.8,88.5],[55.5,88.9],[57.2,89.3],[58.6,89.7],[59.7,90.1],[60.3,90.6],
  ], 1777 / 885),
};
// 짧은 지도 v2 (972×1619, 3:5 양피지) — 학원 0~2곳용, 무대 배경과 비슷한 체감 높이
const MAP_SHORT = {
  bg: "assets/adventure-map-short.webp",
  ar: "930 / 1692",   // 원화 v5 실측 (v4와 같은 크기)
  chest: [32, 88],
  /* 길 끝(45,90) 옆 — 길 위에 두면 캐릭터가 상자를 밟고 선다 */
  chestClosed: [32, 93, 17],
  chestOpen: [32, 93, 17],
  cdy: 6.5,         // 진행도 칩(🔒 n/N)을 상자 아래로 내리는 오프셋 (지도 높이 % — 상자 안 가리게)
  /* 동물 [중심x%, 바닥y%, 폭%] — 하루 세 마리, 그룹마다 하나씩 (shownAnimals).
     자리는 사용자가 화면에 찍어 준 점·화살표를 픽셀→% 보정해 환산한 값이다
     (2026-08-13, 여러 차례에 걸쳐 조정). 긴 지도와 같은 배치다.
     폭은 17 로 통일하고 개구리만 24.3 — 원화가 납작해(1.59:1) 같은 폭에서 작아 보인다.
     기준은 '학원 건물보다 약간 큰 정도'(건물 폭 14~16.4 · 높이 14.4).
     거북이는 68,87.9 → 78,84 — 긴 지도와 맞춰 오른쪽·위로 옮겼다.
     높이는 원화 비율을 따라가므로 폭이 같아도 종마다 다르다 — 높이% = 폭% / (원화비율 × yr).

     ※ 나비는 두 지도 모두에서 뺐다 (사용자 확정 2026-08-13) — 그림·목록·뽑기 풀에서 전부. */
  animals: { ev_parrot: [81.9, 31.2, 17], ev_monkey: [88, 42.5, 17], ev_toucan: [11.9, 36, 17],
             ev_boar: [87.8, 74.1, 17], ev_frog: [17.4, 66.7, 24.3],
             ev_turtle: [78, 84, 17] },
  evImg: { ev_rainbow: [19, 7.5, 31, -15] },
  yr: 1692 / 930,
  bw: 15.96, fs: 14.44, // 짧은 지도 건물 크기 (사용자 조정 2026-08-12: 20% 축소 21→16.8 뒤 짧은 지도만 5% 더 16.8→15.96)
  fpk: 36,          // 발자국 개수 (경로 등간격) — 적을수록 간격이 넓어짐 (사용자 조정: 50→36)
  deco: [[68,93,"🐚",13,-15]], // 상자 아래 빈 공간 소품 딱 하나 (사용자 요청: 과하지 않게)
  // 사용자 지정 자리 ①②③ — 숫자는 '사용할 자리 개수' (1곳=①만, 2곳=①②, 3곳=①②③).
  // 학원 배정은 배열 순서 = 시간순 (①이 첫 수업).
  // 자리 형식: [x, y, 라벨위치?, 건물번호?, 라벨x보정px?] — 라벨위치 "left"=이름표를 집 옆에(기본 집 위),
  // 건물번호는 BUILDINGS 인덱스 고정 지정(없으면 순환). ②는 3번(티키 초가 오두막) 고정 — 사용자 확정.
  // 라벨은 건물과 가운데 정렬 (사용자 확정: v7 원화는 좌우 대칭이라 x보정 제거)
  /* [사용자 확정 2026-08-12] 자리 좌표는 사용자가 지도 위에 찍어 준 점 그대로.
       ① 좌상 33.9·39.9 → ② 우측 76.9·55 → ③ 좌하 28·79.6
     (2차 조정: 38·39.8 → 33.9·39.9 / 79.9·54.8 → 76.9·55 / 26.9·76 → 28·79.6
      — ①② 는 길에서 조금 더 멀어지게 왼쪽으로, ③ 은 아래로 내렸다)

     [사용자 확정 2026-08-12] **'하나 고정 후 하나 추가' 방식**으로 바꿨다.
     예전엔 1곳일 때 ②(우측)를 쓰고, 2곳이 되면 ①을 앞에 끼워 넣었다. 그래서 학원을
     하나 더 등록하면 원래 있던 학원이 우측에서 좌상으로 **건너뛰어** 버렸다.
     이제 n곳은 언제나 '①②③ 순서의 앞 n개'다 — 학원을 더해도 앞 학원 자리는 그대로.
     (①②③ 은 길을 따라 내려가는 순서라 걷는 순서도 자연스럽게 맞는다) */
  spots: {
    1: [[33.9,39.9,null,3]],                           // ①만
    2: [[33.9,39.9,null,3],[76.9,55]],                 // ① 고정 + ② 추가
    3: [[33.9,39.9,null,3],[76.9,55],[28,79.6,"bottom"]], // ①② 고정 + ③ 추가(라벨 집 아래)
  },
  /* v5 원화 모래길 중심선 — 긴 판 v14와 같은 방식으로 새로 뽑았다 (원화가 바뀌며 길도 다시 그려졌다).
     다리 구간(y 63~72.5)은 실측 중심 54.8@62.9 → 56.4@66.3 → 43.4@72.5 를 이어 손으로 채웠고,
     꼬리(y 87 아래)는 길이 모래사장에 녹아 경계가 사라져 보물상자(32) 오른쪽 옆(51, 90.4)까지 이어 그렸다. */
  pointAt: mkPointAt([
    [55.5,21.6],[56.4,22.4],[56.9,23.2],[56.8,24],[56.1,24.8],[55.3,25.6],[54.6,26.4],[54,27.2],
    [53.8,28],[54.2,28.8],[55.6,29.6],[57.8,30.4],[60.4,31.2],[63,32],[65.2,32.8],[66.7,33.6],
    [67.5,34.4],[67.6,35.2],[67.1,36],[66,36.8],[64.6,37.6],[61.9,38.4],[59.3,39.2],[56.1,40],
    [53.6,40.8],[50.7,41.6],[48.1,42.4],[46.1,43.2],[44.8,44],[44.1,44.8],[44,45.6],[44.5,46.4],
    [45.6,47.2],[47.5,48],[50,48.8],[52.5,49.6],[55.6,50.4],[58.2,51.2],[61,52],[62.8,52.8],[64.4,53.6],
    [65.3,54.4],[65.4,55.2],[65,56],[64.1,56.8],[62.7,57.6],[61.1,58.4],[59.4,59.2],[57.8,60],
    [56.5,60.8],[55.7,61.6],[55.2,62.4],[55.1,63.2],[55.3,64],[55.7,64.8],[56,65.6],[55.6,66.4],
    [54.5,67.2],[52.8,68],[51.2,68.8],[49.5,69.6],[47.8,70.4],[46.1,71.2],[44.6,72],[43.4,72.8],
    [42.4,73.6],[41.6,74.4],[40.7,75.2],[39.9,76],[39.3,76.8],[39,77.6],[39,78.4],[39.6,79.2],[40.6,80],
    [42.2,80.8],[44.1,81.6],[46,82.4],[47.7,83.2],[49,84],[49.6,84.8],[49.7,85.6],[49.4,86.4],
    [49.2,87.4],[49.1,88.2],[49.4,88.9],[50,89.5],[50.7,90],[51,90.4],
  ], 1692 / 930),   // 경로 가중치는 원화 비율 그대로 (v4 와 크기가 같다)
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

/* 이름표·보물칩의 작은 선 아이콘
   [사용자 확정 2026-08-11] 🕘 ✅ 🔒 🔓 는 운영체제 이모지라 기기마다 그림체가 달라지고,
   수채화 지도 위에서 혼자 튀었다 → 글자색(currentColor)을 그대로 따르는 선 아이콘으로.
   지도 위 글자가 10~10.5px 이라 획을 2.2로 두껍게 잡아야 작아도 형태가 남는다. */
const MP = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" };
const MapIcon = ({ name, size = 11 }) => {
  const c = { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": "true",
    style: { display: "inline-block", verticalAlign: "-1.5px", flexShrink: 0 } };
  if (name === "clock") return (<svg {...c}><circle cx="12" cy="12" r="8.6" {...MP} /><path d="M12 7.2V12l3.2 2" {...MP} /></svg>);
  if (name === "check") return (<svg {...c}><path d="m4.8 12.6 4.4 4.4 9-9.8" {...MP} strokeWidth="2.8" /></svg>);
  // 자물쇠 — 잠김은 고리가 몸통에 닫혀 있고, 열림은 고리 한쪽이 위로 벌어진다
  if (name === "lock") return (<svg {...c}><rect x="4.6" y="10.6" width="14.8" height="9.6" rx="2.4" {...MP} /><path d="M8.4 10.6V7.8a3.6 3.6 0 0 1 7.2 0v2.8" {...MP} /></svg>);
  if (name === "unlock") return (<svg {...c}><rect x="4.6" y="10.6" width="14.8" height="9.6" rx="2.4" {...MP} /><path d="M8.4 10.6V7.8a3.6 3.6 0 0 1 7.2 0" {...MP} /></svg>);
  return null;
};

const toMin = (t = "") => { const [h, m] = String(t).split(":").map(Number); return (h || 0) * 60 + (m || 0); };
const isImg = (s) => typeof s === "string" && s.includes("assets/");

// onPick: 학원 건물 탭 → 탐험일지에 해당 학원 표시 (App이 setJournalAcId 전달)
export default function AdventureMap({ items = [], mode = "today", charEmoji = "", fullBleed = false, onPick, spark = null, onSparkPass = null, eventId = null, dayAnimals = [], showRainbow = false }) {
  /* [사용자 확정 2026-08-13] time 은 '이름표에 찍는 글자'(14:00 · 보충 14:00 · 보충)이고,
     시각 계산은 at(HH:MM)으로 한다 — 보충은 글자와 실제 시각이 다르기 때문이다.
     at 이 없는 예전 호출은 time 을 그대로 시각으로 읽는다(그때는 둘이 같았다). */
  const atOf = (a) => a.at || a.time;
  const sorted = [...items].sort((a, b) => toMin(atOf(a)) - toMin(atOf(b)));
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
  /* ── 오늘 지도에 나올 동물 두 마리 ──────────────────────────────────
     dayAnimals 는 일곱 마리의 '오늘 순서'다. 여기서 앞에서부터 두 마리를
     고르되, **오늘 세워진 건물이 덮는 자리의 동물은 건너뛴다.**
     동물 자리를 건물 피해 옮겨 봤더니 폭포 위나 지도 가장자리로 밀려나
     오히려 어색했다 — 자리는 좋은 곳에 두고, 가리는 날엔 다른 동물이 나온다.
     일곱 자리 중 건물이 덮는 것은 많아야 셋이라 두 마리는 늘 남는다. */
  const shownAnimals = (() => {
    const bh = M.bw / 0.95 / M.yr;                       // 건물 그림의 대략 높이(%)
    const boxes = spots.map(([sx, sy]) => ({
      x0: sx - M.bw / 2, x1: sx + M.bw / 2,
      y0: sy - bh * 0.78, y1: sy + bh * 0.22,
    }));
    /* 보물상자도 넣는다 — 처음에 건물만 보다가 거북이가 상자 뒤에 파묻혔다
       (사용자 지적: "동물이 개구리 하나인데?" — 거북이는 있었는데 안 보였다).
       상자는 늘 그 자리에 있으므로 건물처럼 '가리는 것'으로 함께 센다. */
    if (M.chestClosed) {
      const [kx, ky, kw] = M.chestClosed;
      boxes.push({ x0: kx - kw / 2, x1: kx + kw / 2, y0: ky - kw / M.yr, y1: ky });
    }
    const clear = (id) => {
      const a = M.animals?.[id]; if (!a) return false;
      const [cx, by, aw] = a;
      const ah = aw / ((ANIMAL_AR[id] || 1) * M.yr);
      return !boxes.some(b => cx - aw / 2 < b.x1 && cx + aw / 2 > b.x0 && by - ah < b.y1 && by > b.y0);
    };
    /* [사용자 확정 2026-08-13] 하루에 세 마리 — 그룹마다 반드시 한 마리씩.
       (예전엔 두 마리였는데 지도가 허전해서 늘렸다. 그룹은 ANIMAL_GROUP 참고)
       고르는 순서는 그대로 dayAnimals(그날의 뽑기 순서)다. 그룹 안에서
       '건물·상자에 안 가리는' 첫 마리를 고르고, 그런 게 없으면 그룹의 첫 마리를 쓴다
       (한 마리라도 내보내는 쪽이 그룹이 통째로 비는 것보다 낫다).
       ※ 그룹이 없는 동물(나비)은 이 규칙에선 안 뽑힌다 — 긴 지도의 나비가 그렇다. */
    const groups = [...new Set(Object.values(ANIMAL_GROUP))];
    const pick = [];
    for (const g of groups) {
      const inG = dayAnimals.filter(id => ANIMAL_GROUP[id] === g && M.animals?.[id]);
      if (!inG.length) continue;
      // 그날 이벤트로 걸린 동물은 자기 그룹에서 무조건 이긴다 (말풍선이 그 동물 머리 위에 뜬다)
      const chosen = inG[0] === eventId ? inG[0] : (inG.find(clear) || inG[0]);
      pick.push(chosen);
    }
    return pick.sort((a, b) => dayAnimals.indexOf(a) - dayAnimals.indexOf(b));
  })();

  // 도착 지점 = '건물이 길에 걸쳐지는 지점' (사용자 확정).
  // 자리 좌표(sx,sy)는 건물의 밑동 기준점이라 그림 몸통보다 아래 → 그림 세로 중심으로 보정한 뒤
  // 길에서 가장 가까운 지점 t를 찾는다. (그 지점이 곧 건물과 길이 겹치는 곳)
  /* [2026-08-13] '앞으로만 찾기' — 가장 가까운 지점을 길 전체에서 고르지 않고,
     앞 학원이 멈춘 지점보다 뒤쪽 구간에서만 고른다.
     예전엔 길 전체에서 최근접점을 뽑은 뒤 뒤로 가는 값만 앞 값으로 끌어올렸는데(단조 보정),
     그러면 두 학원이 같은 지점에 겹쳐 서서 아이가 그 사이엔 아예 안 움직인다.
     긴 지도는 길이 S자로 두 번 접혀 있어서, 접힌 안쪽(예: 66,47)에 놓인 학원은
     '아래로 지나가는 길'이 아니라 '위로 지나간 길'이 더 가깝게 잡히는 탓에 이게 잘 터진다.
     구간을 앞으로 제한하면 단조 증가는 그대로 보장되면서 각자 다른 지점에 선다.
     ※ 이미 순서대로 놓인 배치(4곳·5곳·짧은 지도)는 결과가 예전과 완전히 같다 — 검증함. */
  const stopT = [];
  spots.forEach(([sx, sy, , bi], i) => {
    const B = BUILDINGS[(bi ?? i) % BUILDINGS.length];
    const imgH = M.bw * (B.k || 1) / M.yr / (B.ar || 1);   // 그림 높이 (지도 높이 %)
    const cy = sy - 0.35 * imgH;                            // 그림 몸통 중심
    const tmin = i ? stopT[i - 1] : 0;
    let bt = tmin, bd = Infinity;
    for (let s = 0; s <= 200; s++) {
      const tt = s / 200; if (tt < tmin) continue;
      const [px, py] = pointAt(tt);
      const dd = (px - sx) ** 2 + ((py - cy) * M.yr) ** 2;
      if (dd < bd) { bd = dd; bt = tt; }
    }
    stopT.push(bt);
  });
  // ── 시간 기준 이동 (B안) ──────────────────────────────────
  // 수업 시작 30분 전에 출발해 시작 시각에 도착, 수업이 끝나면 다음 학원으로. 마지막 수업 종료 후 보물상자로.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (mode !== "today") return;
    const iv = setInterval(() => setTick(v => v + 1), 60000); // 1분마다 위치 갱신
    return () => clearInterval(iv);
  }, [mode]);
  const nowMin = (() => { const dt = new Date(); return dt.getHours() * 60 + dt.getMinutes(); })();
  const starts = sorted.map(a => toMin(atOf(a)));
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
  /* [사용자 확정 2026-08-13] 상자를 오른쪽으로 옮긴 뒤(37 → 45.5) 길 끝이 상자 위가 돼
     도착한 아이가 '열린 상자'를 가렸다. 두 지도 모두 길 끝 몇 점을 모래사장 오른쪽으로
     구부려, 아이가 상자 오른쪽 옆에 서게 했다 (긴 지도 끝 49.7 → 60.3, 짧은 지도 45.1 → 51).
     아이 그림 폭이 지도 폭의 약 11%(±5.3)라, 상자 오른쪽 끝보다 그만큼 더 오른쪽이어야 안 겹친다. */
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

      {/* ── 평소의 '닫힌 보물상자' ──
             [v11 원화 2026-08-05] 새 지도에는 상자가 그려져 있지 않아, 여기서 얹는다.
             예전에는 배경에 그려진 상자를 도착할 때 모래 조각으로 덮어 지웠는데
             (chestHide), 이제 지울 것이 없으니 그 꼼수가 통째로 사라졌다.
             도착하면 이 자리에 '열린 상자'가 대신 그려진다. ── */}
      {!chestParty && M.chestClosed && (() => {
        const [cx2, cy2, cw] = M.chestClosed;
        return (
          <img src="assets/chest-closed.webp" alt="" draggable={false}
            style={{ position: "absolute", left: `${cx2}%`, top: `${cy2}%`, width: `${cw}%`, height: "auto",
              transform: "translate(-50%,-100%)", pointerEvents: "none", zIndex: 1,
              filter: "drop-shadow(0 3px 5px rgba(60,80,40,0.3))" }} />
        );
      })()}

      {/* ── 오늘의 동물 — 다섯 마리 중 두 마리만 (rollMapAnimals) ──
             [사용자 확정 2026-08-05] 예전에는 지도 원화에 다섯 마리가 그려져 있어 늘 같았다.
             새 지도는 동물이 없는 판이라 따로 얹고, 하루 두 마리만 나온다.
             배경 바로 위(zIndex 없음)에 둬야 발자국·캐릭터가 동물 앞을 지나간다. ── */}
      {shownAnimals.map(id => {
        const a = M.animals?.[id]; if (!a || !ANIMAL_IMG[id]) return null;
        const [ax, ay, aw] = a;
        return (
          <img key={id} src={ANIMAL_IMG[id]} alt="" draggable={false}
            style={{ position: "absolute", left: `${ax}%`, top: `${ay}%`, width: `${aw}%`, height: "auto",
              transform: "translate(-50%,-100%)", pointerEvents: "none",
              filter: "drop-shadow(0 3px 5px rgba(60,80,40,0.28))" }} />
        );
      })}

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
        // 이름표 2줄 통일 (사용자 확정): 1줄 학원명 / 2줄 시각 — 엄마는 시간부터 보므로 시간을 진하게
        const label = (<>
          <span style={{ fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
            {d ? <MapIcon name="check" size={10} /> : null}{ac.name}
          </span>
          {ac.time ? <div style={{ fontSize: 10.5, marginTop: 1, color: "#3F2E1E", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
            <MapIcon name="clock" size={10} />{ac.time}
          </div> : null}
        </>);
        // 5곳 이상(compact)은 한 줄 '아이콘 + 시간'만
        const timeLabel = <span style={{ fontSize: 10.5, color: "#3F2E1E", display: "inline-flex", alignItems: "center", gap: 3 }}>
          <MapIcon name="clock" size={10} />{ac.time || "-"}
        </span>;
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

      {/* ── 보물상자 진행도 칩 — 자물쇠 n/N, 전부 완료하면 열린 자물쇠. 상자 '아래' 배치 (사용자 확정) ── */}
      {n > 0 && mode !== "future" && (
        <div style={{ position: "absolute", left: `${CHEST[0]}%`, top: `${CHEST[1] + (M.cdy || 8)}%`, transform: "translate(-50%,-50%)", zIndex: 2, pointerEvents: "none",
          background: "rgba(255,251,240,0.94)", border: `1px solid ${doneCount >= n ? "rgba(212,160,60,0.75)" : "rgba(155,114,74,0.4)"}`, borderRadius: 999,
          padding: "2px 8px", fontSize: 10.5, fontWeight: 900, whiteSpace: "nowrap", boxShadow: "0 2px 5px rgba(60,80,40,0.2)",
          // 다 열었으면 상자 테두리와 같은 황금빛으로 — 잠겨 있을 땐 종이 글자색 그대로
          color: doneCount >= n ? "#9A6F1E" : "#5D4633",
          display: "flex", alignItems: "center", gap: 4 }}>
          <MapIcon name={doneCount >= n ? "unlock" : "lock"} size={11} />{doneCount}/{n}
        </div>
      )}

      {/* ── 무지개 ──
             [사용자 확정 2026-08-05] '그날만 오는 손님' 개념을 없앴다. 나비·거북이는
             동물 일곱에 합류해 하루 두 마리 뽑기에 들어갔고, 여기 남은 건 무지개뿐이다.
             무지개는 땅에 서지 않으므로 중심 기준으로 놓고, 동물이 아니라 👋도 안 붙인다.
             나오는 빈도는 rollRainbow(5%)가 정한다 — 동물보다 드물게. ── */}
      {showRainbow && M.evImg?.ev_rainbow && (() => {
        const [ax, ay, aw, arot] = M.evImg.ev_rainbow;
        return (
          <div style={{ position: "absolute", left: `${ax}%`, top: `${ay}%`, width: `${aw}%`,
            transform: `translate(-50%,-50%) rotate(${arot || 0}deg)`, pointerEvents: "none", zIndex: 2 }}>
            <img src={EV_IMG.ev_rainbow} alt="" draggable={false}
              style={{ width: "100%", display: "block",
                animation: "amGuestSky 4s ease-in-out infinite",
                filter: "drop-shadow(0 2px 5px rgba(60,80,40,0.3))" }} />
          </div>
        );
      })()}

      {/* ── 랜덤 이벤트 — 오늘 만난 동물 머리 위 👋 말풍선 (사용자 확정) ──
             이벤트는 날짜 고정 시드라 하루 종일 같은 동물이 인사한다. 발견 여부와
             무관하게 종일 보여준다 — 지도를 보는 재미가 목적이라서. ── */}
      {eventId && shownAnimals.includes(eventId) && animalTop(M, eventId) && (() => {
        const [ax, ay] = animalTop(M, eventId);
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

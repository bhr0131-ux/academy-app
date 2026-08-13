import { TODAY } from "../utils/dates.js";

// ── 최초 실행 시 한 번만 주입되는 샘플 데이터 (처음 쓰는 사람 참고용) ──
/* ════════════════════════════════════════════════════════════════════════
   SECTION 6. 샘플/초기 데이터
   ════════════════════════════════════════════════════════════════════════ */

export const buildSampleData = (seq=1, cid="child_1") => {
  const uniq = `${Date.now()}_${seq}`;
  const acSample = `sample_ac_${uniq}`;
  const children = [{ id:cid, name:"아이1(예시)", gender:"boy" }];
  const PRESETS = [
    { name:"피아노 학원 (예시)", color:"#00B8A9", time:"16:00", teacher:"김선생님", fee:150000,
      baseSupplies:["악보"], baseHomeworks:["하농 1번 연습"],
      shuttleInfo:"16:00 아파트 정문", memo:"매주 토요일 연주회 준비",
      homeworks:["바이엘 20번 5회 연습"], todos:["메트로놈 60에 맞춰 치기"], supplies:["연습장"] },
    { name:"수학 학원 (예시)", color:"#FF6B6B", time:"17:00", teacher:"이선생님", fee:200000,
      baseSupplies:["교재"], baseHomeworks:["연산 문제 2장 풀기"],
      shuttleInfo:"", memo:"매월 모의고사 응시",
      homeworks:["단원평가 1회분 풀기"], todos:["구구단 외우기"], supplies:["계산기"] },
    { name:"영어 학원 (예시)", color:"#34C759", time:"18:00", teacher:"박선생님", fee:180000,
      baseSupplies:["단어장"], baseHomeworks:["단어 20개 암기"],
      shuttleInfo:"18:00 아파트 후문", memo:"매주 금요일 단어 시험",
      homeworks:["단어 시험 대비 복습"], todos:["영어 일기 3줄 쓰기"], supplies:["이어폰"] },
    { name:"태권도 (예시)", color:"#FF9500", time:"15:00", teacher:"최사범님", fee:120000,
      baseSupplies:["도복"], baseHomeworks:["품새 1회 연습"],
      shuttleInfo:"15:00 아파트 정문", memo:"다음 달 승급 심사",
      homeworks:["발차기 50회"], todos:["오늘 배운 동작 복습"], supplies:["물통"] },
  ];
  const p = PRESETS[(seq-1) % PRESETS.length];
  const academies = {
    [cid]: [
      {
        ...EMPTY_AC,
        id:acSample,
        name:p.name,
        days:["월","화","수","목","금","토","일"],
        time:p.time,
        duration:40,
        color:p.color,
        teacher:p.teacher,
        phone:"010-1234-5678",
        address:"행복아파트 상가 3층",
        fee:p.fee,
        payDay:5,
        baseSupplies:p.baseSupplies,
        baseHomeworks:p.baseHomeworks,
        shuttleInfo:p.shuttleInfo,
        memo:p.memo,
      },
    ]
  };
  // 오늘 날짜에 숙제·미션 (직접 눌러서 XP·코인 체험)
  const dailyData = {
    [`${cid}-${acSample}-${TODAY}`]: {
      homeworks:p.homeworks.map((t,i)=>({ id:Date.now()+i, text:t, done:false, point:10 })),
      todos:p.todos.map((t,i)=>({ id:Date.now()+100+i, text:t, done:false, point:10 })),
      supplies:p.supplies
    },
  };
  return { children, academies, dailyData };
};

export const SAMPLE_TMPL = [
  { id:1, title:"결석 안내", body:"안녕하세요. {아이이름} 학부모입니다.\n{날짜} {학원명} 수업을 결석하게 되었습니다.\n양해 부탁드립니다." },
  { id:2, title:"조기 하원 요청", body:"안녕하세요. {아이이름} 학부모입니다.\n오늘 {학원명} 수업을 일찍 마치고 하원해야 할 것 같습니다.\n{시간}에 데리러 가겠습니다. 감사합니다." },
  { id:3, title:"보충 수업 문의", body:"안녕하세요. {아이이름} 학부모입니다.\n{날짜} 결석 건으로 보충 수업 일정을 문의드립니다.\n편하신 날짜를 알려주시면 감사하겠습니다." },
  { id:4, title:"준비물 확인", body:"안녕하세요. {아이이름} 학부모입니다.\n{학원명} 준비물 관련하여 확인 부탁드립니다. 감사합니다." },
];

export const EMPTY_AC = {
  /* account = 입금 계좌 (선택). [사용자 확정 2026-08-10] 없던 필드라 기존 학원에는 비어 있고,
     읽는 쪽이 빈 값이면 계좌 줄을 안 그린다 — 마이그레이션이 필요 없다. */
  name:"", days:[], time:"15:00", duration:40, account:"",
  useCustomSchedule:false, schedules:[],
  shuttleInfo:"", useCustomShuttle:false, shuttleSchedules:[],
  fee:0, payDay:1, color:"#FF6B6B",
  baseSupplies:[], baseHomeworks:[], phone:"", teacher:"", address:"", memo:""
};
/* [사용자 확정 2026-08-09] 보충 수업의 시작·종료 시각(makeupStart/makeupEnd)은 선택 입력이다.
   보충 날짜만 잡히고 시간은 나중에 정해지는 경우가 많아 필수로 두지 않는다.
   기존 기록에는 이 두 값이 없다 — 읽는 쪽에서 빈 값으로 보고 시간 줄을 안 그리면 된다
   (저장 키 v6_abs 의 구조를 바꾸지 않고 필드만 늘리는 방식이라 기존 데이터가 안전하다). */
export const EMPTY_ABS = { academyId:"", date:TODAY, reason:"", makeupDate:"", makeupStart:"", makeupEnd:"", makeupDone:false, makeupStatus:"" };

/* 보충 시간 표시용 — 둘 다 없으면 빈 문자열, 시작만 있으면 시작만 */
export const makeupTimeText = (ab) => {
  const s=(ab?.makeupStart||"").trim(), e=(ab?.makeupEnd||"").trim();
  if(!s&&!e) return "";
  if(s&&e) return `${s}–${e}`;
  return s||e;
};

// ── 요일별 스케줄 유틸 (하이브리드: 기본 공통시간 + 예외 요일별 시간) ──
export const hasClassOnDay = (academy, day) => {
  if (academy.useCustomSchedule) return (academy.schedules||[]).some(s=>s.day===day);
  return (academy.days||[]).includes(day);
};
export const getScheduleForDay = (academy, day) => {
  if (academy.useCustomSchedule) return (academy.schedules||[]).find(s=>s.day===day);
  if ((academy.days||[]).includes(day)) return {day, time:academy.time||"", duration:academy.duration||40};
  return null;
};
export const getClassTime = (academy, day) => getScheduleForDay(academy, day)?.time || "";
export const getClassDuration = (academy, day) => getScheduleForDay(academy, day)?.duration || 0;
export const getSchedules = (academy) => {
  if (academy.useCustomSchedule && (academy.schedules||[]).length>0) return academy.schedules;
  return (academy.days||[]).map(day=>({day, time:academy.time||"", duration:academy.duration||40}));
};

/* ── 그날 실제로 가는 학원 (사용자 확정 2026-08-13) ───────────────────────
   엄마용 '오늘의 학원'과 아이용 탐험지도가 같은 목록을 보게 하려고 한 곳에서 만든다.
   예전엔 두 화면이 각자 '요일에 수업 있는 학원 − 휴원'만 걸러서, 결석한 학원도
   그대로 걸어가야 했고 보충 수업은 어디에도 안 나왔다.

   담기는 것
     · 그 요일에 수업 있는 학원 (휴원 제외)      → absent 플래그로 결석 표시
     · 그날이 보충일(makeupDate)인 결석 기록      → makeup:true

   시각 규칙
     · 보통 수업       : 그 요일 시간표 (time·duration)
     · 보충(시간 있음) : makeupStart 자리에 끼워 넣는다. 라벨 '보충 HH:MM'
     · 보충(시간 없음) : 그날 맨 뒤. 앞 수업이 끝나고 30분 뒤에 끝난 것으로 친다
                         (time = 앞 수업 종료, duration = 30). 라벨은 '보충'.
                         앞 수업이 아예 없으면 그 학원의 평소 수업 시간을 기준으로 쓴다.
   반환값은 '학원 객체 + 밑줄 필드'라 기존 코드가 ac.id·ac.name·ac.color 를 그대로 쓴다.
     _time/_duration : 위 규칙으로 정해진 실제 시각 (정렬·완료 판정에 쓴다)
     _label          : 시간 자리에 쓸 글자 ('14:00' · '보충 14:00' · '보충' · '결석')
     _makeup/_absent : 표시 구분용
     _key            : React key — 같은 학원이 '보통 수업 + 보충'으로 두 번 담길 수 있어 따로 둔다
   ──────────────────────────────────────────────────────────────────────── */
const _min = (t) => { const [h,m]=String(t||"00:00").split(":").map(Number); return (h||0)*60+(m||0); };
const _hhmm = (n) => `${String(Math.floor(((n%1440)+1440)%1440/60)).padStart(2,"0")}:${String(((n%60)+60)%60).padStart(2,"0")}`;

export const getDayPlan = (academies = [], absences = [], date, day, isVacation = () => false) => {
  const absToday = new Set((absences||[]).filter(a=>a.date===date).map(a=>String(a.academyId)));
  const timed = (academies||[])
    .filter(a => hasClassOnDay(a, day) && !isVacation(a.id))
    .map(a => {
      const sc = getScheduleForDay(a, day);
      const absent = absToday.has(String(a.id));
      return { ...a, _key: String(a.id), _time: sc?.time||"", _duration: sc?.duration||40,
               _makeup: false, _absent: absent, _label: absent ? "결석" : (sc?.time||"") };
    });
  const makeups = (absences||[])
    .filter(ab => ab.makeupDate === date)
    .map(ab => {
      const ac = (academies||[]).find(x => String(x.id) === String(ab.academyId));
      if (!ac) return null;                       // 학원이 지워진 주인 없는 기록
      const t = String(ab.makeupStart||"").trim();
      return { ac, ab, t };
    })
    .filter(Boolean);
  makeups.filter(m => m.t).forEach(m => {
    timed.push({ ...m.ac, _key: `${m.ac.id}-mk`, _time: m.t, _duration: 40, _makeup: true, _absent: false, _label: `보충 ${m.t}` });
  });
  timed.sort((x, y) => _min(x._time) - _min(y._time));
  // 시간 없는 보충은 맨 뒤 — 앞 수업이 끝나고 30분 뒤에 끝난 것으로 친다
  makeups.filter(m => !m.t).forEach(m => {
    const prev = timed[timed.length-1];
    const start = prev ? _min(prev._time) + Number(prev._duration||0) : _min(m.ac.time||"15:00");
    timed.push({ ...m.ac, _key: `${m.ac.id}-mk`, _time: _hhmm(start), _duration: 30, _makeup: true, _absent: false, _label: "보충" });
  });
  return timed;
};

// ── 셔틀 헬퍼 ──────────────────────────────
export const getShuttleText = (academy, day) => {
  if (!academy) return "";
  if (academy.useCustomShuttle) {
    const s=(academy.shuttleSchedules||[]).find(x=>x.day===day);
    const customText=[s?.time,s?.place,s?.memo].filter(Boolean).join(" ");
    return customText||academy.shuttleInfo||"";
  }
  return academy.shuttleInfo||"";
};

// ── 수업 시작까지 남은시간 계산 ─────────────────
// "16:00" 형식 → 현재 시각 기준. 시작 전이면 '남음', 진행 중이면 '수업 중', 끝났으면 '종료'.
export const getRemainInfo = (timeStr) => {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const now = new Date();
  const startMin = h * 60 + m;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return { diff: startMin - nowMin, startMin, nowMin };
};
export const getRemainLabel = (timeStr, duration=40) => {
  const info = getRemainInfo(timeStr);
  if (!info) return null;
  const { diff, nowMin, startMin } = info;
  if (diff > 0) {
    const hh = Math.floor(diff / 60), mm = diff % 60;
    const text = hh > 0 ? `${hh}시간 ${mm}분 남음` : `${mm}분 남음`;
    return { text, tone: diff <= 30 ? "urgent" : "soon", icon: diff <= 30 ? "⏳" : "🕓" };
  }
  if (nowMin < startMin + duration) return { text: "수업 중", tone: "now", icon: "🎯" };
  return { text: "수업 종료", tone: "done", icon: "✅" };
};

// "16:00" → "오후 2시 30분" 형식의 친근한 한글 시각
export const toKoreanTime = (timeStr) => {
  if (!timeStr || !/^\d{1,2}:\d{2}$/.test(timeStr)) return timeStr || "";
  let [h, m] = timeStr.split(":").map(Number);
  const ap = h < 12 ? "오전" : "오후";
  let h12 = h % 12; if (h12 === 0) h12 = 12;
  return m === 0 ? `${ap} ${h12}시` : `${ap} ${h12}시 ${m}분`;
};

// ── 날짜 유틸 ─────────────────────────────
/* ════════════════════════════════════════════════════════════════════════
   SECTION 5. 날짜·공용 유틸
   ════════════════════════════════════════════════════════════════════════ */

export const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
/* [버그 수정 2026-08-15] TODAY 는 앱을 켤 때 한 번만 계산됐다.
   폰에서 앱을 끄지 않고 자정을 넘기면 출석·오늘의 미션·연속 달성·일별 저장 키가
   전부 '어제' 날짜로 기록됐다(TODAY 를 쓰는 곳이 98군데).
   const → let 으로 바꿔 ES 모듈 라이브 바인딩을 쓴다 — refreshToday() 가 값을
   갱신하면 `import { TODAY }` 한 모든 파일이 새 값을 본다.
   갱신 시점을 잡아 화면을 다시 그리는 건 App.jsx 의 자정 감지 effect 가 맡는다. */
export let TODAY = getToday();

/** 날짜가 바뀌었으면 TODAY 를 갱신하고 새 날짜를 돌려준다. 안 바뀌었으면 null. */
export const refreshToday = () => {
  const t = getToday();
  if (t === TODAY) return null;
  TODAY = t;
  return t;
};
export const parseLocal = (s) => { const [y,m,d]=s.split("-").map(Number); return new Date(y,m-1,d); };
export const toStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const fmt = (s) => { const d=parseLocal(s); return `${d.getMonth()+1}/${d.getDate()}(${["일","월","화","수","목","금","토"][d.getDay()]})`; };
export const addDays = (s,n) => { const d=parseLocal(s); d.setDate(d.getDate()+n); return toStr(d); };
export const todayDN = () => ["일","월","화","수","목","금","토"][new Date().getDay()];
/* [사용자 확정 2026-08-11] 달력 첫 칸을 월요일에서 일요일로 바꿨다.
   한국에서 흔히 쓰는 배열이고, 주말(토·일)이 양쪽 끝으로 갈리지 않고
   일요일이 맨 앞·토요일이 맨 끝에 오면 빨간날을 한눈에 찾기 쉽다. */
export const getCalDays = (y,m) => {
  const offset=new Date(y,m,1).getDay(), last=new Date(y,m+1,0).getDate(), arr=[];
  for(let i=0;i<offset;i++) arr.push(null);
  for(let d=1;d<=last;d++) arr.push(d);
  return arr;
};
export const getDN = (y,m,d) => ["일","월","화","수","목","금","토"][new Date(y,m,d).getDay()];

// ── 저장 ─────────────────────────────────
// 저장소 우선순위: ① Capacitor Preferences(네이티브 앱) → ② localStorage(브라우저) → ③ 인메모리(폴백)
// 앱 재시작 후에도 데이터 유지. 아티팩트/구형 웹뷰에서도 최소한 세션 동안은 동작.
export const __MEM_STORE = {};
export const __CAP_PREFS = (typeof window!=="undefined" && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) || null;
export const __hasLS = (()=>{ try { if(typeof localStorage==="undefined") return false; const t="__v6_ls_test__"; localStorage.setItem(t,"1"); localStorage.removeItem(t); return true; } catch(e){ return false; } })();

/* ── 저장 실패 알림 ──────────────────────────────────────────────────────
   [버그 2026-08-15] save() 가 catch(e){} 로 조용히 삼켜서, 저장소가 꽉 차면
   (localStorage 한도 초과 등) 아무 표시 없이 저장만 멈췄다. 이력·일별 데이터는
   지우는 코드가 없어 계속 쌓이므로 오래 쓰면 실제로 닿을 수 있는 상태다.
   화면 쪽에서 onSaveError 를 등록해 두면 실패를 한 번 알려 준다.
   (저장 로직 자체는 그대로 — 알림만 추가한다)                              */
let __onSaveError = null;
export const setSaveErrorHandler = (fn) => { __onSaveError = fn; };

export const save = async (k, v) => {
  try {
    const s = JSON.stringify(v);
    if(__CAP_PREFS){ await __CAP_PREFS.set({ key:k, value:s }); return; }
    if(__hasLS){ localStorage.setItem(k, s); return; }
    __MEM_STORE[k] = JSON.parse(s);
  } catch (e) {
    /* 한도 초과는 브라우저마다 이름이 달라(QuotaExceededError /
       NS_ERROR_DOM_QUOTA_REACHED / code 22·1014) 이름 대신 넓게 잡는다. */
    const full = e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED"
      || e.code === 22 || e.code === 1014);
    try { __onSaveError && __onSaveError({ key:k, full:!!full, error:e }); } catch (_) {}
  }
};
export const load = async (k) => {
  try {
    if(__CAP_PREFS){ const r = await __CAP_PREFS.get({ key:k }); return r && r.value!=null ? JSON.parse(r.value) : null; }
    if(__hasLS){ const s = localStorage.getItem(k); return s!=null ? JSON.parse(s) : null; }
    return k in __MEM_STORE ? __MEM_STORE[k] : null;
  } catch (e) { return null; }
};
/* 키 하나 지우기 — 월별 분할 저장이 예전 키를 정리할 때만 쓴다.
   (검증을 통과한 뒤에만 부른다 — utils/dailyStore.js 참고) */
export const removeStored = async (k) => {
  try {
    if(__CAP_PREFS){ await __CAP_PREFS.remove({ key:k }); return; }
    if(__hasLS){ localStorage.removeItem(k); return; }
    delete __MEM_STORE[k];
  } catch (e) {}
};
// 전체 저장소 초기화 (데이터 리셋용)
export const clearAllStorage = async () => {
  try {
    if(__CAP_PREFS){ await __CAP_PREFS.clear(); return; }
    if(__hasLS){ localStorage.clear(); return; }
    Object.keys(__MEM_STORE).forEach(k=>delete __MEM_STORE[k]);
  } catch (e) {}
};

/* ── id 발급 ──────────────────────────────────────────────────────────────
   [버그 2026-08-15] 새 항목 id 를 Date.now() 로 만들다 보니 같은 밀리초에 두 건이
   생기면 id 가 겹쳤다(점수 이력에서 실제로 같은 id 2건이 관찰됐다).
   겹친 id 는 목록에서 서로를 못 가려내고 React key 도 중복된다.
   시간 순서는 그대로 두면서 항상 다른 값을 주는 발급기를 쓴다.
   기존 저장 데이터의 id 와 같은 숫자 범위라 마이그레이션이 필요 없다. */
let __lastId = 0;
export const newId = () => {
  const t = Date.now();
  __lastId = t > __lastId ? t : __lastId + 1;
  return __lastId;
};

/* ── 저장소 상태 ────────────────────────────────────────────────────────
   [사용자 질문 2026-08-15] "@capacitor/preferences 가 실제로 깔렸는지 어떻게 확인해?"
   → 앱을 열어 개발자 도구에서 바로 보이게 한다. 코드나 프로젝트 파일을 뒤질 필요 없이,
     실제 기기에서 돌아가는 앱이 어디에 저장하고 있는지가 답이다.
   Preferences 플러그인이 안 깔려 있으면 웹뷰 localStorage 로 내려가고,
   그러면 5MiB 한도가 그대로 걸린다.                                        */
export const STORAGE_KIND = __CAP_PREFS ? "capacitor" : (__hasLS ? "localstorage" : "memory");
export const STORAGE_LABEL = {
  capacitor:    "Capacitor Preferences (네이티브)",
  localstorage: "localStorage (웹뷰)",
  memory:       "메모리 (앱을 끄면 사라져요)",
}[STORAGE_KIND];
/** 웹뷰 localStorage 한도 — 크롬 계열 실측 5 MiB(글자 수 기준, 한글도 1글자=1칸) */
export const LOCALSTORAGE_LIMIT = 5 * 1024 * 1024;

/** 지금 저장소에 무엇이 얼마나 들어 있는지. { kind, label, used, count, limit, top } */
export const storageInfo = async () => {
  let used = 0, count = 0;
  const sizes = [];
  const add = (k, len) => { used += k.length + len; count++; sizes.push([k, len]); };
  try {
    if (__CAP_PREFS) {
      const r = await __CAP_PREFS.keys();
      for (const k of (r && r.keys) || []) {
        const v = await __CAP_PREFS.get({ key: k });
        add(k, (v && v.value && v.value.length) || 0);
      }
    } else if (__hasLS) {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        add(k, (localStorage.getItem(k) || "").length);
      }
    } else {
      for (const k of Object.keys(__MEM_STORE)) add(k, JSON.stringify(__MEM_STORE[k]).length);
    }
  } catch (e) {}
  sizes.sort((a, b) => b[1] - a[1]);
  return {
    kind: STORAGE_KIND, label: STORAGE_LABEL, used, count,
    /* Capacitor Preferences 는 기기 저장공간을 쓰므로 정해진 한도가 없다 */
    limit: STORAGE_KIND === "localstorage" ? LOCALSTORAGE_LIMIT : null,
    top: sizes.slice(0, 5),
  };
};

// ── SMS ─────────────────────────────────
export const smsLink=(phone,body="")=>{ const enc=encodeURIComponent(body); const ios=/iPad|iPhone|iPod/.test(navigator.userAgent); return `sms:${phone}${body?(ios?`&body=${enc}`:`?body=${enc}`):""}` };

// ── 기본 아이 데이터 ─────────────────────
export const DEFAULT_CHILDREN = [
  { id:"child_1", name:"아이1", gender:"boy" }
];

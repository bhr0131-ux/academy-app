// ── 날짜 유틸 ─────────────────────────────
/* ════════════════════════════════════════════════════════════════════════
   SECTION 5. 날짜·공용 유틸
   ════════════════════════════════════════════════════════════════════════ */

export const getToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
export const TODAY = getToday();
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

export const save = async (k, v) => {
  try {
    const s = JSON.stringify(v);
    if(__CAP_PREFS){ await __CAP_PREFS.set({ key:k, value:s }); return; }
    if(__hasLS){ localStorage.setItem(k, s); return; }
    __MEM_STORE[k] = JSON.parse(s);
  } catch (e) {}
};
export const load = async (k) => {
  try {
    if(__CAP_PREFS){ const r = await __CAP_PREFS.get({ key:k }); return r && r.value!=null ? JSON.parse(r.value) : null; }
    if(__hasLS){ const s = localStorage.getItem(k); return s!=null ? JSON.parse(s) : null; }
    return k in __MEM_STORE ? __MEM_STORE[k] : null;
  } catch (e) { return null; }
};
// 전체 저장소 초기화 (데이터 리셋용)
export const clearAllStorage = async () => {
  try {
    if(__CAP_PREFS){ await __CAP_PREFS.clear(); return; }
    if(__hasLS){ localStorage.clear(); return; }
    Object.keys(__MEM_STORE).forEach(k=>delete __MEM_STORE[k]);
  } catch (e) {}
};

// ── SMS ─────────────────────────────────
export const smsLink=(phone,body="")=>{ const enc=encodeURIComponent(body); const ios=/iPad|iPhone|iPod/.test(navigator.userAgent); return `sms:${phone}${body?(ios?`&body=${enc}`:`?body=${enc}`):""}` };

// ── 기본 아이 데이터 ─────────────────────
export const DEFAULT_CHILDREN = [
  { id:"child_1", name:"아이1", gender:"boy" }
];

/* ── 안드로이드 앱(Capacitor) 전용 기능 ────────────────────────────────────
   웹(브라우저)에서는 아무 것도 하지 않고, 앱 안에서만 동작한다.
   네이티브 부품은 Capacitor 프로젝트(C:\harang-app)에 설치해야 쓸 수 있다:
     npm install @capacitor/filesystem @capacitor/share @capacitor/app
     npx cap sync android
   부품이 없으면 각 함수가 '없음'을 알려 주고, 화면은 예전처럼 동작한다.
   (dates.js 의 Preferences 와 같은 방식 — window.Capacitor.Plugins 로 찾는다) */

const cap = () => (typeof window !== "undefined" ? window.Capacitor : null);

export const isNativeApp = () => {
  const C = cap();
  if (!C) return false;
  if (typeof C.isNativePlatform === "function") return C.isNativePlatform();
  return !!(C.getPlatform && C.getPlatform() !== "web");
};

const plugin = (name) => {
  const C = cap();
  if (!C) return null;
  if (C.Plugins && C.Plugins[name]) return C.Plugins[name];
  if (typeof C.isPluginAvailable === "function" && C.isPluginAvailable(name) && typeof C.registerPlugin === "function") {
    try { return C.registerPlugin(name); } catch (e) { return null; }
  }
  return null;
};

/* ── 백업 파일 내보내기 ──────────────────────────────────────────────────
   [버그 2026-10-27] 앱(WebView)에서는 <a download> 가 아무 일도 안 하는데 "백업 완료"가 떴다.
   앱에서는 파일을 앱 캐시에 쓴 뒤 휴대폰 공유창(카톡·드라이브·파일 저장)을 띄운다.
   결과: { ok:true } 공유창에서 보낼 곳을 골랐을 때만 · { ok:false, reason:"cancel"|"plugin"|"error" }
   웹은 지금처럼 파일 다운로드(호출하는 쪽에서 처리). */
export const shareBackupFile = async (text, fileName) => {
  const fs = plugin("Filesystem");
  const share = plugin("Share");
  if (!fs || !share) return { ok: false, reason: "plugin" };
  let uri;
  try {
    const res = await fs.writeFile({ path: fileName, data: text, directory: "CACHE", encoding: "utf8" });
    uri = res && res.uri;
    if (!uri) {
      const u = await fs.getUri({ path: fileName, directory: "CACHE" });
      uri = u && u.uri;
    }
  } catch (e) {
    return { ok: false, reason: "error", error: e };
  }
  const isCancel = (e) => /cancel/i.test(String((e && (e.message || e.errorMessage)) || e));
  const opts = { title: "미션팡 백업 파일", dialogTitle: "백업 파일을 저장할 곳을 골라 주세요" };
  try {
    await share.share({ ...opts, files: [uri] });       // @capacitor/share 5 이상
    return { ok: true };
  } catch (e) {
    if (isCancel(e)) return { ok: false, reason: "cancel" };
    try {                                               // 옛 버전은 files 대신 url
      await share.share({ ...opts, url: uri });
      return { ok: true };
    } catch (e2) {
      return { ok: false, reason: isCancel(e2) ? "cancel" : "error", error: e2 };
    }
  }
};

/* ── 이미지(PNG) 공유 ────────────────────────────────────────────────────
   [사용자 요청 2026-11-26] '오늘 일정' 카드를 이미지로 카톡 등에 보내기.
   앱(WebView)은 navigator.share 로 파일을 못 보내므로, 백업 공유와 같은 방식으로
   앱 캐시에 PNG 를 쓴 뒤 휴대폰 공유창을 띄운다.
   dataUrl: "data:image/png;base64,...."
   결과: { ok:true } · { ok:false, reason:"cancel"|"plugin"|"error" } */
export const shareImageFile = async (dataUrl, fileName, title) => {
  const fs = plugin("Filesystem");
  const share = plugin("Share");
  if (!fs || !share) return { ok: false, reason: "plugin" };
  const base64 = String(dataUrl).split(",")[1] || "";
  let uri;
  try {
    const res = await fs.writeFile({ path: fileName, data: base64, directory: "CACHE" });   // encoding 없음 = base64 그대로 파일
    uri = res && res.uri;
    if (!uri) { const u = await fs.getUri({ path: fileName, directory: "CACHE" }); uri = u && u.uri; }
  } catch (e) {
    return { ok: false, reason: "error", error: e };
  }
  const isCancel = (e) => /cancel/i.test(String((e && (e.message || e.errorMessage)) || e));
  try {
    await share.share({ title, dialogTitle: "보낼 곳을 골라 주세요", files: [uri] });
    return { ok: true };
  } catch (e) {
    if (isCancel(e)) return { ok: false, reason: "cancel" };
    try { await share.share({ title, url: uri }); return { ok: true }; }
    catch (e2) { return { ok: false, reason: isCancel(e2) ? "cancel" : "error", error: e2 }; }
  }
};

/* ── 백업 파일을 휴대폰에 바로 저장 ─────────────────────────────────────
   [사용자 요청 2026-11-16] 공유창 말고 한 번에 폰에 저장하는 버튼.
   '내 파일 → 문서(Documents) → 미션팡' 폴더에 쓴다. Android 11 이상은 권한 없이 저장되고,
   그보다 오래된 폰은 권한이 없어 실패한다 → 호출하는 쪽이 공유창으로 넘긴다(새 권한을 요청하지 않는다).
   앱을 지워도 이 파일은 남으므로, 다시 깔고 '데이터 복원하기'로 고르면 된다.
   결과: { ok:true, folder } · { ok:false, reason:"plugin"|"error" } */
export const BACKUP_DEVICE_FOLDER = "미션팡";
export const saveBackupToDevice = async (text, fileName) => {
  const fs = plugin("Filesystem");
  if (!fs) return { ok: false, reason: "plugin" };
  try {
    await fs.writeFile({ path: `${BACKUP_DEVICE_FOLDER}/${fileName}`, data: text,
      directory: "DOCUMENTS", encoding: "utf8", recursive: true });
    return { ok: true, folder: BACKUP_DEVICE_FOLDER };
  } catch (e) {
    return { ok: false, reason: "error", error: e };
  }
};

/* ── 안드로이드 뒤로가기 ─────────────────────────────────────────────────
   [2026-10-27] 팝업이 떠 있어도 뒤로가기를 누르면 앱이 바로 꺼졌다.
   맨 위 팝업의 바깥(어두운 배경)을 누른 것처럼 처리해 팝업부터 닫는다 — 이 앱의 팝업은
   대부분 '바깥을 누르면 닫힘'으로 만들어져 있어서 팝업마다 코드를 고치지 않아도 된다.
   바깥을 눌러도 안 닫히는 팝업(확인이 꼭 필요한 창)은 그대로 두고, 팝업이 없을 때만 앱을 내린다.
   @capacitor/app 이 없으면 아무 것도 등록하지 않는다(예전 동작 그대로). 해제 함수를 돌려준다.
   onNoPopup(): 팝업이 없을 때 먼저 불린다 — true 를 돌려주면(첫 탭으로 옮김 등) 앱을 내리지 않는다. */
const topOverlay = () => {
  if (typeof document === "undefined") return null;
  const W = window.innerWidth, H = window.innerHeight;
  // 화면 네 귀퉁이 근처 — 팝업 상자는 가운데/아래에 있으므로 귀퉁이는 바깥 배경이다
  const pts = [[3, 3], [W - 3, 3], [3, Math.round(H * 0.3)], [W - 3, Math.round(H * 0.3)]];
  for (const [x, y] of pts) {
    let el = document.elementFromPoint(x, y);
    while (el && el !== document.body) {
      const cs = getComputedStyle(el);
      if (cs.position === "fixed") {
        const r = el.getBoundingClientRect();
        if (r.width >= W * 0.9 && r.height >= H * 0.9) return el;
      }
      el = el.parentElement;
    }
  }
  return null;
};

export const installBackButton = (onNoPopup) => {
  if (!isNativeApp()) return () => {};
  const app = plugin("App");
  if (!app || typeof app.addListener !== "function") return () => {};
  let handle = null, removed = false;
  const onBack = () => {
    const ov = topOverlay();
    if (ov) { ov.click(); return; }                     // 팝업부터 닫는다(안 닫히는 창이면 그대로 둔다)
    try { if (typeof onNoPopup === "function" && onNoPopup()) return; } catch (e) { /* 실패하면 그냥 내린다 */ }
    if (typeof app.minimizeApp === "function") app.minimizeApp();
    else if (typeof app.exitApp === "function") app.exitApp();
  };
  Promise.resolve(app.addListener("backButton", onBack)).then((h) => {
    handle = h;
    if (removed && h && h.remove) h.remove();
  }).catch(() => {});
  return () => { removed = true; if (handle && handle.remove) handle.remove(); };
};

import { useState } from "react";
import { C } from "../data/tokens.js";
import { EXPEDITIONS, EXPEDITION_ORDER, MOUNTS, RARITY_LABEL } from "../data/expeditions.js";
import ExpeditionTrack from "./ExpeditionTrack.jsx";

/* ════════════════════════════════════════════════════════════════════════
   DevExpeditionPreview — 미션 배경·동선 점검 (개발자 도구 전용)
   ────────────────────────────────────────────────────────────────────────
   [사용자 요청 2026-08-01] 챕터를 고르고 → 그 챕터에 나오는 탈것을 고르고 →
   출발·25%·50%·75%·도착 다섯 지점을 눌러 가며 동선을 눈으로 확인한다.
   날짜를 넘겨 가며 원하는 탈것이 나올 때까지 기다릴 필요가 없다.

   실제 화면과 똑같이 보이게 ExpeditionTrack을 그대로 쓴다 —
   previewKey(챕터)·previewMount(탈것)만 강제로 넘긴다.
   진행도는 4칸(total=4)으로 잡아 done 0~4가 곧 0·25·50·75·100%가 된다.

   아래에 지금 적용 중인 좌표를 같이 띄운다 — 숫자를 고칠 때 대조용.
   ════════════════════════════════════════════════════════════════════════ */
const STEPS = [
  { done: 0, label: "출발" },
  { done: 1, label: "25%" },
  { done: 2, label: "50%" },
  { done: 3, label: "75%" },
  { done: 4, label: "도착" },
];
const KIND_LABEL = { fly: "🟣 하늘", dive: "🩵 물속", ground: "🔵 바닥" };
const POSE_LABEL = { walk: "걷기", swim: "수영", run: "달리기" };
/* 길 색 — 미리보기 안에서만 쓰는 값 (토큰에 파랑이 없다) */
const CK = { ground: "#3B82F6", fly: "#8B5CF6", dive: "#0EA5A5" };

export default function DevExpeditionPreview({ onClose, gender = "boy" }) {
  const [key, setKey] = useState(EXPEDITION_ORDER[0]);
  const [mountKey, setMountKey] = useState("");     // "" = 기본 이동(걷기·수영·달리기)
  const [step, setStep] = useState(0);

  const exp = EXPEDITIONS[key];
  const sc = exp.scene;
  const mount = mountKey ? MOUNTS[mountKey] : null;
  const kind = mount ? (mount.k || "ground") : "ground";
  /* 지금 이 조합이 실제로 쓰는 길 — 하늘·물속 길이 있으면 덮어쓴 값까지 합쳐서 본다 */
  const alt = kind !== "ground" ? sc[kind] : null;
  const P = alt ? { ...sc, iB: alt.charB ?? sc.iB, ...alt } : sc;

  const chip = (on, col) => ({
    border: `1px solid ${on ? (col || C.purple) : C.border}`,
    background: on ? (col || C.purple) : "#fff",
    color: on ? "#fff" : C.text,
    borderRadius: 999, padding: "7px 11px", fontSize: 12.5, fontWeight: 900,
    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
  });
  const row = { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" };
  const label = { fontSize: 11.5, fontWeight: 900, color: C.sub, margin: "0 0 6px", letterSpacing: 0.4 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,20,40,0.6)", display: "flex",
      alignItems: "flex-end", zIndex: 3100 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: "22px 22px 0 0",
        padding: "20px 16px 34px", width: "100%", maxWidth: 430, maxHeight: "94vh", overflowY: "auto",
        boxSizing: "border-box" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: C.text }}>🗺️ 미션 배경 점검</h3>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: C.sub, fontWeight: 700 }}>챕터 · 탈것 · 진행도를 골라 동선을 본다</p>
          </div>
          <button onClick={onClose} style={{ background: "#F1EFEA", border: "none", borderRadius: 10,
            width: 30, height: 30, cursor: "pointer", color: C.sub, fontSize: 15 }}>✕</button>
        </div>

        {/* 챕터 */}
        <p style={label}>챕터</p>
        <div style={{ ...row, flexWrap: "wrap", overflowX: "visible", marginBottom: 12 }}>
          {EXPEDITION_ORDER.map((k, i) => (
            <button key={k} onClick={() => { setKey(k); setMountKey(""); }} style={chip(k === key)}>
              {i + 1}. {EXPEDITIONS[k].emoji}
            </button>
          ))}
        </div>

        {/* 카드 — 실제 화면과 같은 컴포넌트 */}
        <ExpeditionTrack date="" previewKey={key} previewMount={mountKey}
          done={STEPS[step].done} total={4} gender={gender} />

        {/* 진행도 */}
        <p style={label}>진행도</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 12 }}>
          {STEPS.map((s, i) => (
            <button key={s.label} onClick={() => setStep(i)} style={{ ...chip(i === step, C.green), padding: "8px 0" }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* 탈것 — 그 챕터에 나오는 것만 */}
        <p style={label}>이동 방법 ({(exp.mounts || []).length + 1}가지)</p>
        <div style={{ ...row, flexWrap: "wrap", overflowX: "visible", marginBottom: 12 }}>
          <button onClick={() => setMountKey("")} style={chip(mountKey === "", CK.ground)}>
            기본 · {POSE_LABEL[exp.pose] || exp.pose}
          </button>
          {(exp.mounts || []).map(k => {
            const m = MOUNTS[k];
            if (!m) return null;
            const col = CK[m.k || "ground"];
            return (
              <button key={k} onClick={() => setMountKey(k)} style={chip(mountKey === k, col)}
                disabled={!m.img} title={m.img ? "" : "원화 없음"}>
                {m.emoji} {m.name}{m.img ? "" : " (그림없음)"}
              </button>
            );
          })}
        </div>

        {/* 지금 값 — 숫자 고칠 때 대조용 */}
        <div style={{ background: "#F7F4ED", border: `1px solid ${C.border}`, borderRadius: 12,
          padding: "11px 13px", fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 5px", fontWeight: 900 }}>
            {exp.emoji} {exp.title} · {mount ? `${mount.emoji} ${mount.name}` : `기본 ${POSE_LABEL[exp.pose] || exp.pose}`}
            <span style={{ color: C.sub, marginLeft: 6 }}>
              {KIND_LABEL[kind]}{mount ? ` · ${RARITY_LABEL[mount.r || "common"]}` : ""}
            </span>
          </p>
          <p style={{ margin: 0, color: C.sub }}>
            이동선 {P.x0}·{P.charB} → {P.x1}·{P.charB1 ?? P.charB}
            {P.charBm != null ? ` (가운데 ${P.charBm})` : ""}<br />
            출발 대기 {P.xi ?? P.x0}·{P.iB ?? P.charB} · 만세 {sc.xa ?? 88}·{sc.aB ?? (sc.charB1 ?? sc.charB)}<br />
            캐릭터 크기 {P.charH ?? 64}{P.charH1 != null ? ` → ${P.charH1}` : ""}
            {mount ? ` · 탈것 배율 ×${mount.hMul ?? 1.35}` : ""}
            {alt ? "" : mount && mount.lift ? ` · 띄우기 ${mount.lift}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

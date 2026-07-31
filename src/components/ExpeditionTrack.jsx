import { useEffect, useRef, useState } from "react";
import { getExpedition, MOUNTS, ADVENTURE_ITEMS, CHAR_IMG, GOAL_MARK_ENABLED } from "../data/expeditions.js";

/* ════════════════════════════════════════════════════════════════════════
   ExpeditionTrack — 미션 탭 '하루 한 탐험' 씬 (사용자 기획서 확정)
   ────────────────────────────────────────────────────────────────────────
   진행률 바를 그리지 않는다. 미션 k/n 완료 = 캐릭터가 길의 k/n 지점에
   '서 있는' 것이고, 하나 끝낼 때마다 다음 지점으로 걸어간다(트윈).
   마지막 미션 완료 = 도착 → 만세 포즈 + 점프만 (사용자 확정: 변신·폭죽·성공 문구 없음).

   포즈는 4종 개념(걷기/수영/탑승/성공)만 쓴다. 지금은 원화가 없어
     · 걷기/탑승 = 지도 걷기 캐릭터(charImg) 재사용
     · 탑승 = 탈것 이모지 위에 캐릭터를 얹음 (공용 탑승 위치)
     · 아이템 = 캐릭터 옆에 이모지 배지
     · 성공 = 점프 애니메이션
   CHAR_IMG·MOUNTS[].img·bgImg가 채워지면 그대로 그림으로 바뀐다.

   props
     date     : "YYYY-MM-DD" (탐험 순환 결정 — 날짜 순서대로 강→산→…)
     done, total : 오늘 미션 완료/전체
     charImg  : 걷기 캐릭터 이미지 (지도 워커 — 테마색·성별 반영)
     gender   : "boy" | "girl" (원화 도입 후 사용)
   ════════════════════════════════════════════════════════════════════════ */
export default function ExpeditionTrack({ date, done = 0, total = 0, charImg = "", gender = "boy", fullBleed = false }) {
  const exp = getExpedition(date);
  const sc = exp.scene;
  /* 탈것은 '공용 탑승(앉기) 원화'가 있을 때만 그린다 — 걷는 캐릭터 발밑에
     탈것 이모지만 깔면 어정쩡해서 (사용자 원화 오면 CHAR_IMG.ride만 채우면 됨) */
  const mount = exp.pose === "ride" && CHAR_IMG.ride ? MOUNTS[exp.mount] : null;
  const item = exp.item ? ADVENTURE_ITEMS[exp.item] : null;
  const arrived = total > 0 && done >= total;

  /* 위치: 출발 10% → 도착 76% (도착 지점 90% 왼쪽 — 성공 포즈가 넓어도 안 겹치게).
     배경 원화가 있는 씬은 그림에 맞춘 x0/x1·높이(charB/goalB)를 쓴다.
     미션이 없으면 출발점에 서 있다. */
  const t = total > 0 ? Math.min(1, done / total) : 0;
  const x0 = sc.x0 ?? 10, x1 = sc.x1 ?? 76;
  const x = x0 + t * (x1 - x0);
  /* charB1이 있으면 이동하며 높이도 보간 — 산처럼 오르막 씬용 (없으면 수평 이동) */
  const cb0 = sc.charB ?? sc.groundH * 0.35;
  const charBottom = sc.charB1 != null ? cb0 + t * (sc.charB1 - cb0) : cb0;
  const goalBottom = sc.goalB ?? sc.groundH * 0.55;
  /* 캐릭터·깃발 크기 — 씬마다 다를 수 있다(바다처럼 멀리 있는 섬으로 가는 그림).
     charH1을 주면 이동하며 크기도 보간해 원근감을 낸다(가까운 앞 → 멀어지며 작게). */
  const ch0 = sc.charH ?? 64;
  const goalH = sc.goalH ?? 56;

  /* 이동 시간 — 기본 1.4초. 씬이 moveMs를 주면 그 속도로 (초원=달리기라 조금 빠르게).
     걸음 흔들림 주기도 같이 줄여야 빨리 움직이는 만큼 다리도 바쁘게 보인다. */
  const moveMs = exp.moveMs ?? 1400;
  const stepMs = (moveMs / 1400) * 0.45;   // 초 단위 (기본 0.45s)

  /* 방금 이동했는지 — 이동 중에만 걷기 기울임, 도착 순간 점프.
     left 트랜지션과 같은 시간만 walking 상태를 켠다. */
  const [walking, setWalking] = useState(false);
  const [back, setBack] = useState(false);      // 뒤로 가는 중(미션 취소) — 좌우 반전용
  const prevT = useRef(t);
  useEffect(() => {
    if (t === prevT.current) return;
    setBack(t < prevT.current);
    prevT.current = t;
    setWalking(true);
    const to = setTimeout(() => setWalking(false), moveMs + 50);
    return () => clearTimeout(to);
  }, [t, moveMs]);

  const dark = !!sc.dark;
  const inkSub = dark ? "rgba(240,240,250,0.75)" : "rgba(90,68,48,0.75)";
  /* 포즈 원화 선택 (사용자 확정) —
       미션 0개 = 출발지에서 '기본 서있기(idle)' / 이동 중 = 걷기·수영 /
       도착 = 성공(만세). ride 원화가 아직 없어 걷기로 대체.
     [사용자 확정] 미션이 1개뿐이어도 완료 순간 바로 만세가 아니라,
     이동하는 1.4초 동안은 수영/걷기로 건너가고 도착한 뒤에 만세.
     → celebrating = 도착했고 '이동이 끝난' 상태.
     원화가 하나도 없으면 지도 워커(charImg) 폴백. */
  /* walking은 이펙트(페인트 후)에서 켜져서, 완료 직후 첫 렌더에 만세가 한 프레임
     번쩍일 수 있다 → prevT와 다른 렌더(=이동 시작 프레임)도 이동 중으로 본다. */
  const moving = walking || t !== prevT.current;
  /* [사용자 확정] 미션을 취소해서 뒤로 갈 때도 수영/걷기로 돌아간다 —
     idle(출발지 대기)은 이동이 끝난 뒤에만. 뒤로 갈 땐 좌우 반전(왼쪽 보기). */
  const idle = !arrived && done === 0 && !moving;
  const facingLeft = t !== prevT.current ? t < prevT.current : (walking && back);
  const celebrating = arrived && !moving;
  /* idlePose: 출발지가 땅이 아닌 씬(바다)은 서 있는 대신 물에 떠 있게 (씬이 정한다) */
  const poseKey = celebrating ? "success" : idle ? (exp.idlePose || "idle") : exp.pose;
  /* poseFallback: 원화가 없는 포즈(지금은 ride)를 무엇으로 대신할지 씬이 정한다 —
     바다는 물 위를 걸을 수 없으니 수영으로 (사막처럼 땅이면 기본값 걷기) */
  const charB = CHAR_IMG[poseKey]?.[gender] || CHAR_IMG[exp.poseFallback]?.[gender]
    || CHAR_IMG.walk?.[gender] || null;
  /* 출발 전엔 대기 위치(xi/iB — 강은 둑 위)로. 도착해 만세할 땐 '깃발 바로 앞'이 기본
     (사용자 확정: 깃발이 뒤, 캐릭터가 앞 — 캐릭터 zIndex가 높아 겹치면 앞에 선다).
     씬별로 xa로 재정의 가능. */
  const xPos = idle ? (sc.xi ?? x0) : celebrating ? (sc.xa ?? ((sc.gx ?? 90) - 2)) : x;
  const bottomPos = idle ? (sc.iB ?? charBottom) : celebrating ? (sc.aB ?? charBottom) : charBottom;
  /* 출발 전엔 출발 크기 그대로, 이동 중·도착은 진행도만큼 보간된 크기 */
  const charH = idle || sc.charH1 == null ? ch0 : ch0 + t * (sc.charH1 - ch0);

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: fullBleed ? 0 : 22, marginBottom: 14,
      /* 풀블리드(사용자 확정: 양옆 꽉 차게)일 땐 위아래 선만 남긴다 */
      border: fullBleed ? "none" : dark ? "1px solid #3A3450" : "1px solid rgba(155,114,74,0.35)",
      borderTop: fullBleed ? (dark ? "1px solid #3A3450" : "1px solid rgba(155,114,74,0.35)") : undefined,
      borderBottom: fullBleed ? (dark ? "1px solid #3A3450" : "1px solid rgba(155,114,74,0.35)") : undefined,
      boxShadow: "0 10px 26px rgba(60,50,30,0.2)" }}>
      <style>{`
        @keyframes expBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        @keyframes expWalk{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
        @keyframes expJump{0%,100%{transform:translateY(0)}30%{transform:translateY(-14px)}55%{transform:translateY(0)}70%{transform:translateY(-7px)}85%{transform:translateY(0)}}
      `}</style>

      {/* ── 배경 — 원화(bgImg)가 오면 그림, 지금은 CSS 하늘+땅 (중앙 비움 규칙) ── */}
      <div style={{ position: "relative", height: 220,
        background: `linear-gradient(180deg, ${sc.sky[0]}, ${sc.sky[1]})` }}>
        {exp.bgImg && (
          <img src={exp.bgImg} alt="" draggable={false}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        )}
        {!exp.bgImg && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${sc.groundH}%`,
            background: `linear-gradient(180deg, ${sc.ground[0]}, ${sc.ground[1]})`,
            borderRadius: "50% 50% 0 0 / 16px 16px 0 0" }} />
        )}
        {/* 가장자리 장식 (기획: 장식은 가장자리 위주 · 중앙 비움) */}
        {!exp.bgImg && sc.deco.map(([dx, dy, em, fs], i) => (
          <span key={i} style={{ position: "absolute", left: `${dx}%`, top: `${dy}%`,
            transform: "translate(-50%,-50%)", fontSize: fs, lineHeight: 1, opacity: 0.9,
            pointerEvents: "none" }}>{em}</span>
        ))}

        {/* ── 도착 지점 (오른쪽 고정) — 도착해도 목표물은 그대로, 변신·폭죽 없음 (사용자 확정:
               "그냥 도착하면 점프하고 탐험 성공!")
             [사용자 확정 2026-07-31] 지금은 깃발/도착 이모지를 전부 뗀다.
             다시 켜려면 expeditions.js의 GOAL_MARK_ENABLED만 true로 —
             씬별 깃발 원화(goalImg)·위치(gx/goalB/goalH)는 그대로 남겨 뒀다. ── */}
        {GOAL_MARK_ENABLED && (
          <div style={{ position: "absolute", left: `${sc.gx ?? 90}%`, bottom: `${goalBottom}%`,
            transform: "translateX(-50%)", textAlign: "center", pointerEvents: "none" }}>
            {/* 깃발 원화(goalImg)가 있으면 깃발, 없으면 이모지 (사용자 확정) */}
            {exp.goalImg ? (
              <img src={exp.goalImg} alt="" draggable={false}
                style={{ height: goalH, width: "auto", display: "block", margin: "0 auto",
                  filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
                  animation: "expBob 2.6s ease-in-out infinite" }} />
            ) : (
              <span style={{ fontSize: 38, lineHeight: 1, display: "block",
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.2))",
                animation: "expBob 2.6s ease-in-out infinite" }}>
                {exp.goal}
              </span>
            )}
          </div>
        )}

        {/* ── 탐험가 — 미션 완료 수만큼 오른쪽으로 (진짜 '이동'이 핵심) ── */}
        <div style={{ position: "absolute", left: `${xPos}%`, bottom: `${bottomPos}%`,
          transform: "translateX(-50%)",
          transition: `left ${moveMs}ms cubic-bezier(.45,.05,.35,1), bottom ${moveMs}ms cubic-bezier(.45,.05,.35,1)`,
          pointerEvents: "none", zIndex: 2 }}>
          <div style={{ position: "relative",
            animation: celebrating ? "expJump 1.5s ease-in-out infinite"
              : moving ? `expWalk ${stepMs.toFixed(2)}s ease-in-out infinite`
              : "expBob 2.6s ease-in-out infinite" }}>
            {/* 탑승: 탈것 위에 공용 탑승 위치(캐릭터를 탈것 위로 띄움).
                도착해 이동이 끝나면 탈것에서 내려 성공 포즈만 (만세하는데 탈것 위면 어색해서) */}
            {mount && !celebrating && (
              <span style={{ position: "absolute", left: "50%", bottom: -8, transform: "translateX(-50%)",
                fontSize: 30, lineHeight: 1, zIndex: 0,
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))" }}>
                {mount.img ? <img src={mount.img} alt="" style={{ height: 34 }} /> : mount.emoji}
              </span>
            )}
            <img src={charB || charImg} alt="" draggable={false}
              style={{ position: "relative", zIndex: 1, height: charH, width: "auto", display: "block",
                transition: `height ${moveMs}ms cubic-bezier(.45,.05,.35,1)`,
                transform: facingLeft ? "scaleX(-1)" : undefined,   // 뒤로 갈 땐 왼쪽을 본다 (기획: 좌우 반전)
                margin: "0 auto", marginBottom: mount && !celebrating ? 14 : 0,
                filter: "drop-shadow(0 0 2px rgba(255,251,240,0.9)) drop-shadow(0 3px 4px rgba(0,0,0,0.3))" }} />
            {/* 아이템: 걷기 캐릭터에 이모지 배지만 추가 (별도 캐릭터 안 만듦) */}
            {item && !mount && (
              <span style={{ position: "absolute", right: -13, top: 8, fontSize: 15, lineHeight: 1, zIndex: 2,
                filter: "drop-shadow(0 0 2px rgba(255,251,240,0.9)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}>
                {item.img ? <img src={item.img} alt="" style={{ height: 16 }} /> : item.emoji}
              </span>
            )}
          </div>
          {/* 접지 그림자 */}
          <div style={{ width: Math.round(34 * charH / 64), height: Math.max(4, Math.round(7 * charH / 64)),
            borderRadius: "50%", margin: "-1px auto 0", transition: `width ${moveMs}ms linear`,
            background: dark ? "rgba(0,0,0,0.45)" : "rgba(60,50,30,0.28)", filter: "blur(2.5px)" }} />
        </div>

        {/* ── 상단: 오늘의 탐험 제목 (왼쪽) + 남은 미션 (오른쪽 — 숫자만, 바 없음) ── */}
        <div style={{ position: "absolute", top: 10, left: 12, right: 12, display: "flex",
          justifyContent: "space-between", alignItems: "flex-start", pointerEvents: "none" }}>
          <div style={{ background: dark ? "rgba(30,26,45,0.72)" : "rgba(255,251,240,0.88)",
            border: dark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(155,114,74,0.35)",
            borderRadius: 12, padding: "5px 11px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>
            {/* 한 줄 표기 (사용자 확정: 줄바꿈 없이, 글씨 크기는 그대로) */}
            <p style={{ margin: 0, whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.5, color: inkSub }}>오늘의 탐험</span>
              <span style={{ fontSize: 14.5, fontWeight: 900, marginLeft: 7,
                color: dark ? "#F5F2FF" : "#4B3A2F" }}>{exp.emoji} {exp.title}</span>
            </p>
          </div>
          {total > 0 && (
            <div style={{ background: dark ? "rgba(30,26,45,0.72)" : "rgba(255,251,240,0.88)",
              border: dark ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(155,114,74,0.35)",
              borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 900,
              color: dark ? "#F5F2FF" : "#4B3A2F", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }}>
              {/* [사용자 확정] '탐험 성공!' 문구는 뺀다 — 도착해도 숫자만 (연출은 만세 포즈로 충분) */}
              {`${exp.emoji} ${done}/${total}`}
            </div>
          )}
        </div>

        {/* [사용자 확정] 미션 없는 날의 '오늘은 쉬어가는 날 😴' 안내도 뺀다 —
            그림 위에 글자를 얹지 않고 캐릭터가 출발지에 서 있는 것만 보여준다 */}
      </div>
    </div>
  );
}

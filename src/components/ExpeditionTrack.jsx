import { useEffect, useRef, useState } from "react";
import { getExpedition, getExpeditionMount, EXPEDITIONS, MOUNTS, ADVENTURE_ITEMS, CHAR_IMG,
  GOAL_MARK_ENABLED } from "../data/expeditions.js";

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
/* 기존 카드 높이(px) — 씬의 크기 값(charH·hMul)은 전부 이 높이를 기준으로 맞춰 둔 값이다.
   비율 카드(bgAR)에서는 이 값을 기준으로 %로 환산해 카드와 함께 커진다. */
const CARD_H = 220;

export default function ExpeditionTrack({ date, done = 0, total = 0, charImg = "", gender = "boy", fullBleed = false,
  previewKey = "", previewMount }) {
  /* previewKey·previewMount: 개발자 도구 미리보기 전용 —
     날짜로 정해지는 챕터·탈것을 무시하고 고른 것을 그린다 (앱 화면은 안 쓴다) */
  const exp = (previewKey && EXPEDITIONS[previewKey]) || getExpedition(date);
  const sc = exp.scene;
  /* 그날의 탈것 — 같은 챕터가 돌아올 때마다 대표→변형 순으로 바뀐다(getExpeditionMount).
     null이면 그 회차는 '기본'(걷기·수영·달리기).
     [사용자 시트 v1.0] 탑승 원화는 '탈것 + 앉은 캐릭터'가 한 장이라, 그림이 있는
     탈것만 태우고 그 한 장으로 캐릭터를 대신한다. 그림이 아직 없는 탈것은
     그날 순환에서 건너뛰고 기본 이동으로 (그림을 하나씩 받아도 바로 반영된다). */
  const mountKey = previewMount !== undefined ? previewMount : getExpeditionMount(date);
  const mount = mountKey && MOUNTS[mountKey]?.img ? MOUNTS[mountKey] : null;
  const item = exp.item ? ADVENTURE_ITEMS[exp.item] : null;
  const arrived = total > 0 && done >= total;

  /* 위치: 출발 10% → 도착 76% (도착 지점 90% 왼쪽 — 성공 포즈가 넓어도 안 겹치게).
     배경 원화가 있는 씬은 그림에 맞춘 x0/x1·높이(charB/goalB)를 쓴다.
     미션이 없으면 출발점에 서 있다. */
  const t = total > 0 ? Math.min(1, done / total) : 0;
  /* ── 이동 방식별 길 [사용자 확정 2026-08-01] ────────────────────────────
     같은 배경이라도 나는 탈것은 하늘로, 잠수정은 물속으로 간다.
     scene.fly / scene.dive 에 다른 값만 적어 두면 그 회차에만 덮어쓴다
     (안 적은 값은 바닥길 그대로). 만세 자리(xa·aB)는 내려서 하므로 항상 바닥길. */
  const rideKind = mount ? (mount.k || "ground") : "ground";
  const alt = mount && rideKind !== "ground" ? sc[rideKind] : null;
  /* 덮어쓰는 순서: 기본(=걷기·수영 길) → scene.ride(탄 회차 공통) → scene.fly/dive(그 길).
     scene.ride 는 '걸어갈 때와 탈것일 때 출발 자리가 다른' 챕터용
     (강 — 걸어서는 모래톱 끝 10에서, 배·돌고래는 물 위 20에서 출발). */
  const over = mount ? { ...(sc.ride || {}), ...(alt || {}) } : null;
  /* 대기 자리(xi·iB)는 그 길의 출발점을 따라간다 — 하늘길인데 땅에서 기다리면 어색하다.
     그 길에 xi·iB를 따로 적어 두면 그 값이 이긴다. */
  const P = over ? { ...sc, xi: over.x0 ?? sc.xi, iB: over.charB ?? sc.iB, ...over } : sc;

  const x0 = P.x0 ?? 10, x1 = P.x1 ?? 76;
  const x = x0 + t * (x1 - x0);
  /* charB1이 있으면 이동하며 높이도 보간 — 산처럼 오르막 씬용 (없으면 수평 이동).
     charBm(가운데 높이)을 주면 그 점을 지나는 곡선으로 — 활처럼 휘는 하늘길용. */
  const cb0 = P.charB ?? sc.groundH * 0.35;
  const cb1 = P.charB1 ?? cb0;
  const charBottom = P.charBm != null
    ? (1 - t) * (1 - t) * cb0 + 2 * (1 - t) * t * (2 * P.charBm - (cb0 + cb1) / 2) + t * t * cb1
    : cb0 + t * (cb1 - cb0);
  const goalBottom = sc.goalB ?? sc.groundH * 0.55;
  /* 캐릭터·깃발 크기 — 씬마다 다를 수 있다(바다처럼 멀리 있는 섬으로 가는 그림).
     charH1을 주면 이동하며 크기도 보간해 원근감을 낸다(가까운 앞 → 멀어지며 작게). */
  const ch0 = P.charH ?? 64;
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
  /* 탈것을 실제로 타고 있는 상태 — 도착해 만세할 땐 내려서 성공 포즈 */
  const riding = !!mount && !celebrating;
  const poseKey = celebrating ? "success" : idle ? (exp.idlePose || "idle") : exp.pose;
  /* poseFallback: 원화가 없는 포즈를 무엇으로 대신할지 씬이 정한다 (없으면 걷기) */
  const charB = CHAR_IMG[poseKey]?.[gender] || CHAR_IMG[exp.poseFallback]?.[gender]
    || CHAR_IMG.walk?.[gender] || null;
  /* 출발 전엔 대기 위치(xi/iB — 강은 둑 위)로. 도착해 만세할 땐 '깃발 바로 앞'이 기본
     (사용자 확정: 깃발이 뒤, 캐릭터가 앞 — 캐릭터 zIndex가 높아 겹치면 앞에 선다).
     씬별로 xa로 재정의 가능. */
  const xPos0 = idle ? (P.xi ?? x0) : celebrating ? (sc.xa ?? ((sc.gx ?? 90) - 2)) : x;
  const bottomPos0 = idle ? (P.iB ?? charBottom) : celebrating ? (sc.aB ?? charBottom) : charBottom;
  /* 나는 탈것(열기구·박쥐…)은 땅에서 살짝 띄운다 — 바닥에 붙으면 떠 있는 느낌이 안 난다.
     하늘길(scene.fly)이 있는 챕터는 길 자체가 이미 높이를 정하므로 띄우지 않는다. */
  const flying = riding && (rideKind === "fly" || !!mount.lift);
  const bottomPos1 = bottomPos0 + (riding && !alt ? (mount.lift ?? 0) : 0);
  /* 출발 전엔 출발 크기 그대로, 이동 중·도착은 진행도만큼 보간된 크기 */
  const charH = idle || P.charH1 == null ? ch0 : ch0 + t * (P.charH1 - ch0);
  /* 실제로 그릴 높이 — 탑승 그림은 탈것까지 들어 있어 캐릭터만 있을 때보다 크게
     (탈것별 hMul로 미세조정, 접지 그림자도 같은 높이를 따라간다) */
  const imgH = Math.round(riding ? charH * (mount.hMul ?? 1.35) : charH);
  /* 그림이 카드 밖으로 삐져나가면 그만큼만 안쪽으로 민다 [사용자 확정 2026-08-01].
     출발 자리를 전 챕터 13%로 통일하면서 날개 편 박쥐·마법양탄자처럼 폭이 넓은 그림이
     왼쪽으로 잘렸다. 그림 자체를 줄이면 24종이 최대 37%까지 작아져 탑승이 초라해지므로,
     자리를 정하는 값(x0·xi)은 그대로 두고 잘리는 회차만 살짝 밀어 준다.
       · 그림은 높이로만 크기를 정하므로 폭은 '높이 × 원화 가로세로비'로 구한다.
       · 높이는 카드 높이의 (imgH/220)이고 카드 높이 = 카드 폭 / bgAR —
         그래서 폭을 '카드 폭의 %'로 바꾸면 아래 식이 된다 (실제 픽셀 폭을 몰라도 된다). */
  const halfW = riding && mount.ar
    ? ((imgH / CARD_H) * mount.ar / (sc.bgAR || 390 / CARD_H)) * 100 / 2
    : 0;
  const xPos = Math.min(Math.max(xPos0, halfW + 0.5), 100 - halfW - 0.5);
  /* 위로도 같은 이유로 민다 — 하늘길을 높게 잡으면 큰 탈것은 머리가 잘린다.
     그림 높이는 카드 높이의 (imgH/220)이므로 그만큼 위를 비워 둔다. */
  const bottomPos = Math.min(bottomPos1, 100 - (imgH / CARD_H) * 100 - 0.5);

  return (
    <div style={{ marginBottom: 14 }}>
    {/* ── 제목·진행 칩 — [사용자 확정 2026-07-31] 그림 밖으로 빼서 날짜와 그림 사이에 둔다.
           풀블리드 카드는 좌우로 16px 삐져나와 있으니 헤더는 그만큼 안쪽으로 넣어 본문과 맞춘다.
           그림 위가 아니라 배경(크림색) 위에 놓이므로 어두운 씬에서도 밝은 칩을 쓴다. ── */}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
      gap: 8, padding: fullBleed ? "0 16px" : 0, marginBottom: 8 }}>
      <div style={{ background: "rgba(255,251,240,0.88)", border: "1px solid rgba(155,114,74,0.35)",
        borderRadius: 12, padding: "5px 11px", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
        {/* 한 줄 표기 (사용자 확정: 줄바꿈 없이, 글씨 크기는 그대로) */}
        <p style={{ margin: 0, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.5, color: "rgba(90,68,48,0.75)" }}>오늘의 탐험</span>
          <span style={{ fontSize: 14.5, fontWeight: 900, marginLeft: 7, color: "#4B3A2F" }}>{exp.emoji} {exp.title}</span>
        </p>
      </div>
      {total > 0 && (
        <div style={{ background: "rgba(255,251,240,0.88)", border: "1px solid rgba(155,114,74,0.35)",
          borderRadius: 999, padding: "5px 11px", fontSize: 12, fontWeight: 900,
          color: "#4B3A2F", boxShadow: "0 2px 6px rgba(0,0,0,0.08)", flexShrink: 0 }}>
          {/* [사용자 확정] '탐험 성공!' 문구는 뺀다 — 도착해도 숫자만 (연출은 만세 포즈로 충분) */}
          {`${exp.emoji} ${done}/${total}`}
        </div>
      )}
    </div>

    <div style={{ position: "relative", overflow: "hidden", borderRadius: fullBleed ? 0 : 22,
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

      {/* ── 배경 — 원화(bgImg)가 오면 그림, 지금은 CSS 하늘+땅 (중앙 비움 규칙) ──
             [사용자 확정 2026-07-31] 배경을 1.4:1로 새로 그리는 챕터는 높이를 고정하지 않고
             '폭 : 높이 = bgAR : 1' 비율 카드로 만든다 → 기기 폭이 달라도 한 픽셀도 안 잘린다.
             (390 기기에서 220 → 279px, 28% 커짐. bgAR이 없는 챕터는 220px 그대로) */}
      <div style={{ position: "relative",
        height: sc.bgAR ? undefined : CARD_H,
        aspectRatio: sc.bgAR ? `${sc.bgAR} / 1` : undefined,
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
          /* 크기 값(charH·hMul)은 '220px 카드 기준 px'이다. 비율 카드에서는 카드가 커진 만큼
             같이 커지도록 카드 높이의 %로 환산한다 — 기기 폭이 달라도 비율이 일정하다 */
          height: sc.bgAR ? `${(imgH / CARD_H) * 100}%` : undefined,
          transition: `left ${moveMs}ms cubic-bezier(.45,.05,.35,1), bottom ${moveMs}ms cubic-bezier(.45,.05,.35,1), height ${moveMs}ms cubic-bezier(.45,.05,.35,1)`,
          pointerEvents: "none", zIndex: 2 }}>
          <div style={{ position: "relative", height: sc.bgAR ? "100%" : undefined,
            animation: celebrating ? "expJump 1.5s ease-in-out infinite"
              : moving ? `expWalk ${stepMs.toFixed(2)}s ease-in-out infinite`
              : "expBob 2.6s ease-in-out infinite" }}>
            {/* 탑승 회차: 탈것 원화 한 장이 캐릭터를 대신한다 (시트가 '탈것+앉은 캐릭터' 통짜).
                도착해 이동이 끝나면 탈것에서 내려 성공 포즈만 (만세하는데 탈것 위면 어색해서) */}
            <img src={riding ? mount.img : (charB || charImg)} alt="" draggable={false}
              style={{ position: "relative", zIndex: 1, width: "auto", display: "block",
                /* 탑승 그림은 탈것까지 들어 있어 캐릭터만 있을 때보다 크게 (탈것별 hMul로 미세조정).
                   비율 카드에서는 감싼 div가 카드 높이의 %로 크기를 잡으므로 여기선 꽉 채우기만 한다 */
                height: sc.bgAR ? "100%" : imgH,
                transition: `height ${moveMs}ms cubic-bezier(.45,.05,.35,1)`,
                transform: facingLeft ? "scaleX(-1)" : undefined,   // 뒤로 갈 땐 왼쪽을 본다 (기획: 좌우 반전)
                margin: "0 auto",
                filter: "drop-shadow(0 0 2px rgba(255,251,240,0.9)) drop-shadow(0 3px 4px rgba(0,0,0,0.3))" }} />
            {/* 아이템: 걷기 캐릭터에 이모지 배지만 추가 (별도 캐릭터 안 만듦) */}
            {item && !mount && (
              <span style={{ position: "absolute", right: -13, top: 8, fontSize: 15, lineHeight: 1, zIndex: 2,
                filter: "drop-shadow(0 0 2px rgba(255,251,240,0.9)) drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}>
                {item.img ? <img src={item.img} alt="" style={{ height: 16 }} /> : item.emoji}
              </span>
            )}
          </div>
          {/* 접지 그림자 — 그림 바로 아래에 붙는다. 나는 탈것(lift)은 그리지 않는다:
              그룹째 떠오르기 때문에 그림자만 공중에 남아 더 어색해진다. */}
          {!flying && (
            <div style={{
              /* 비율 카드에선 높이를 카드 높이 %로 잡고 폭은 가로세로비로 따라오게 한다
                 (폭에 %를 쓰면 카드 '폭' 기준이라 그림자가 과하게 넓어진다) */
              width: sc.bgAR ? undefined : Math.round(34 * imgH / 64),
              aspectRatio: sc.bgAR ? "34 / 7" : undefined,
              height: sc.bgAR ? `${(7 * imgH / 64) / CARD_H * 100}%` : Math.max(4, Math.round(7 * imgH / 64)),
              borderRadius: "50%", margin: "-1px auto 0", transition: `width ${moveMs}ms linear`,
              background: dark ? "rgba(0,0,0,0.45)" : "rgba(60,50,30,0.28)", filter: "blur(2.5px)" }} />
          )}
        </div>

        {/* [사용자 확정] 그림 위에는 글자를 얹지 않는다 — 제목·진행 칩은 그림 밖(위)으로 뺐고,
            미션 없는 날의 '오늘은 쉬어가는 날 😴' 안내도 없앴다. 캐릭터만 보여준다 */}
      </div>
    </div>
    </div>
  );
}

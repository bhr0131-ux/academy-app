/* ════════════════════════════════════════════════════════════════════════
   효과음 — 음원 파일 없이 Web Audio 로 그 자리에서 만든다 (앱 용량 0)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-11-18] 미션 완료 소리 하나뿐이던 것을 늘렸다:
     complete  미션 완료 (베이커리: 말랑 팝 / 탐험: 코인 획득 — 예전 소리 그대로)
     levelUp   레벨업 · 상장 — 올라가는 4음 팡파르
     chestOpen 보물상자 열기 — 덜컹 + 반짝반짝 (결과 창이 뜨는 순간)
     drumRoll  보물상자 여는 중 '두구두구…' — 점점 빨라지고 커지는 북소리
               [사용자 요청 2026-11-19] 오픈 연출(1.2초) 동안 울리고, 결과 창에서 chestOpen 이 '짠!'
     tada      지도 보물상자가 열릴 때 '짜잔!' (그날 학원을 다 다녀와 상자에 도착)
               [사용자 요청 2026-11-19] 짧은 화음 '짜' → 길고 밝은 화음 '잔!' + 반짝
     coinIn    은행에 맡기기·원금 찾기 — 동전 두 번 '짤랑' (2026-11-20 은행)
     bankPayout 은행 이자 받기 — 동전이 쏟아지는 '짜르르' + 반짝
     arrive    탐험 도착 만세 — 짧은 '따다다단!'
     discovery 오늘의 발견 — 높은 반짝 두 번
   소리 켜기/끄기는 setSfxEnabled 로 (App 이 저장 키 v6_sfx_on 에서 읽어 넣는다 — 새 키).
   아이폰은 사람이 화면을 한 번 눌러야 소리를 낼 수 있어서, 첫 터치 때 오디오를 깨워 둔다
   (그래야 스크롤만으로 일어나는 '도착 만세' 소리도 난다).
   ════════════════════════════════════════════════════════════════════════ */
let ctx = null;
let enabled = true;

export const setSfxEnabled = (on) => { enabled = on !== false; };
export const isSfxEnabled = () => enabled;

const getCtx = () => {
  try {
    if (!ctx) {
      const AC = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  } catch (e) { return null; }
};

if (typeof window !== "undefined") {
  const unlock = () => { getCtx(); window.removeEventListener("pointerdown", unlock, true); };
  window.addEventListener("pointerdown", unlock, true);
}

const tone = (c, { freq, start = 0, dur = 0.15, type = "sine", gain = 0.18, slideTo = null }) => {
  const t0 = c.currentTime + start;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
};

/* 북·스네어 같은 '타격음' — 짧은 잡음(스네어 결) + 낮게 떨어지는 사인(북 몸통) */
let noiseBuf = null;
const getNoise = (c) => {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const len = Math.floor(c.sampleRate * 0.2);
  noiseBuf = c.createBuffer(1, len, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
};
const drumHit = (c, { start = 0, gain = 0.2, pitch = 140 }) => {
  const t0 = c.currentTime + start;
  // 북 몸통
  const o = c.createOscillator(), og = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(pitch, t0);
  o.frequency.exponentialRampToValueAtTime(pitch * 0.55, t0 + 0.09);
  og.gain.setValueAtTime(0.0001, t0);
  og.gain.exponentialRampToValueAtTime(gain, t0 + 0.004);
  og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);
  o.connect(og); og.connect(c.destination);
  o.start(t0); o.stop(t0 + 0.14);
  // 스네어 결(잡음)
  const n = c.createBufferSource(); n.buffer = getNoise(c);
  const f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 0.8;
  const ng = c.createGain();
  ng.gain.setValueAtTime(0.0001, t0);
  ng.gain.exponentialRampToValueAtTime(gain * 0.45, t0 + 0.003);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
  n.connect(f); f.connect(ng); ng.connect(c.destination);
  n.start(t0); n.stop(t0 + 0.08);
};

const SOUNDS = {
  complete: (c, skin) => {
    if (skin === "cute") {                                   // 베이커리: 말랑 팝
      tone(c, { freq: 520, dur: 0.16, gain: 0.28, slideTo: 920 });
      tone(c, { freq: 1200, start: 0.13, dur: 0.2, gain: 0.16 });
    } else {                                                 // 탐험: 코인 획득
      tone(c, { freq: 988, dur: 0.09, type: "square", gain: 0.16 });
      tone(c, { freq: 1318, start: 0.08, dur: 0.28, type: "square", gain: 0.16 });
    }
  },
  levelUp: (c) => {                                          // 도·미·솔·도↑ + 반짝
    [523, 659, 784, 1047].forEach((f, i) => tone(c, { freq: f, start: i * 0.1, dur: i === 3 ? 0.42 : 0.14, type: "triangle", gain: 0.2 }));
    tone(c, { freq: 2093, start: 0.42, dur: 0.18, gain: 0.08 });
    tone(c, { freq: 2637, start: 0.5, dur: 0.22, gain: 0.07 });
  },
  chestOpen: (c) => {                                        // 덜컹(낮게 미끄러짐) → 반짝반짝
    tone(c, { freq: 180, dur: 0.16, type: "sawtooth", gain: 0.08, slideTo: 110 });
    [1319, 1568, 2093, 2637].forEach((f, i) => tone(c, { freq: f, start: 0.16 + i * 0.07, dur: 0.22, gain: 0.11 }));
  },
  drumRoll: (c) => {                                         // 두구두구… 점점 빨라지고 커진다 (약 1.1초)
    let t = 0, gap = 0.1;
    while (t < 1.08) {
      const k = t / 1.08;                                    // 0 → 1
      drumHit(c, { start: t, gain: 0.07 + k * 0.17, pitch: 130 + k * 40 });
      t += gap;
      gap = Math.max(0.038, gap * 0.9);
    }
  },
  tada: (c) => {                                             // 짜—잔!
    [523, 659, 784].forEach(f => tone(c, { freq: f, dur: 0.12, type: "triangle", gain: 0.12 }));            // 짜
    [784, 988, 1175, 1568].forEach(f => tone(c, { freq: f, start: 0.16, dur: 0.6, type: "triangle", gain: 0.11 })); // 잔!
    [2093, 2637, 3136].forEach((f, i) => tone(c, { freq: f, start: 0.3 + i * 0.08, dur: 0.2, gain: 0.06 }));  // 반짝
  },
  coinIn: (c) => {                                           // 짤랑 짤랑
    tone(c, { freq: 1760, dur: 0.08, gain: 0.12 }); tone(c, { freq: 2637, start: 0.03, dur: 0.12, gain: 0.07 });
    tone(c, { freq: 1976, start: 0.13, dur: 0.1, gain: 0.12 }); tone(c, { freq: 2960, start: 0.16, dur: 0.16, gain: 0.07 });
  },
  bankPayout: (c) => {                                       // 짜르르르 + 반짝
    [1568, 1760, 1976, 2093, 2349, 2637, 2794, 3136].forEach((f, i) =>
      tone(c, { freq: f, start: i * 0.055, dur: 0.12, gain: 0.09 }));
    [523, 659, 784, 1047].forEach(f => tone(c, { freq: f, start: 0.46, dur: 0.5, type: "triangle", gain: 0.09 }));
  },
  arrive: (c) => {                                           // 따다다단!
    [392, 523, 659].forEach((f, i) => tone(c, { freq: f, start: i * 0.09, dur: 0.1, type: "triangle", gain: 0.18 }));
    tone(c, { freq: 784, start: 0.27, dur: 0.38, type: "triangle", gain: 0.2 });
  },
  discovery: (c) => {                                        // 반짝 반짝
    tone(c, { freq: 1568, dur: 0.12, gain: 0.12, slideTo: 2093 });
    tone(c, { freq: 2349, start: 0.12, dur: 0.24, gain: 0.1 });
  },
};

/* 이름으로 소리 내기. 꺼져 있거나 오디오가 없으면 조용히 넘어간다. */
export const playSfx = (name, skin) => {
  if (!enabled) return;
  const fn = SOUNDS[name]; if (!fn) return;
  const c = getCtx(); if (!c) return;
  try { fn(c, skin); } catch (e) { /* 오디오 미지원 — 무시 */ }
};

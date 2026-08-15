/* ════════════════════════════════════════════════════════════════════════
   useSyncState — 같은 틱에 두 번 눌러도 안전한 상태
   ────────────────────────────────────────────────────────────────────────
   [버그 2026-08-15] 미션 체크·구매 버튼을 빠르게 두 번 누르면 보상이 두 배로
   나가고 코인이 두 번 빠졌다. React 상태는 다음 렌더에야 바뀌므로, 한 렌더
   안에서 두 번 처리하면 둘 다 '옛 값'을 읽고 같은 판단을 두 번 내린다.
     · 10코인짜리 미션 5연타 → XP +50 · 코인 +50 (실측, 이력 5건)
     · 200코인 파츠 2연타 → 코인 400 차감, 아이템은 1개 (실측)

   그래서 값을 ref(거울)에도 함께 들고, 판단에 쓰는 읽기는 ref에서 한다.
   ref는 set 하는 순간 동기적으로 바뀌므로, 두 번째 클릭이 첫 번째 결과를 본다.
   (미션 체크는 이제 두 번 누르면 켰다 끄는 게 되어 보상이 0으로 상쇄된다 —
    토글 버튼의 올바른 동작이고, 어느 쪽이든 두 배로 늘지는 않는다.)

   쓰는 법은 useState와 같고, 세 번째로 ref를 돌려준다.
     const [scoreData, setScoreData, scoreRef] = useSyncState({});
     setScoreData(prev => ...)   // 함수형도 그대로 동작
     scoreRef.current            // 지금 이 순간의 최신값 (렌더 기다리지 않음)

   주의: 렌더 중에 ref.current 를 읽으면 state 보다 한 발 앞선 값일 수 있다.
   화면 표시는 지금처럼 state 를 쓰고, '무엇을 할지 정하는' 코드만 ref 를 쓴다.
   ════════════════════════════════════════════════════════════════════════ */
import { useState, useRef, useCallback } from "react";

export function useSyncState(initial) {
  const [value, setValue] = useState(initial);
  const ref = useRef(value);
  const set = useCallback((next) => {
    ref.current = typeof next === "function" ? next(ref.current) : next;
    setValue(ref.current);
  }, []);
  return [value, set, ref];
}

import { useCallback, useRef } from "react";

/* 가로 스크롤 줄을 PC 마우스로도 넘기게 한다 — 터치폰은 손가락으로 밀면 되지만,
   스크롤바를 숨긴 줄은 PC에서 옆으로 넘길 방법이 없었다 (사용자 지적 2026-10-10).
   · 마우스로 눌러 끌면 넘어간다 (5px 넘게 끌었으면 그 뒤 클릭은 무시 — 끌다 탭이 눌리지 않게)
   · 세로 휠을 굴리면 가로로 넘어간다 (넘칠 게 있을 때만 — 없으면 페이지 스크롤 그대로)
   터치·펜 입력은 건드리지 않는다.
   콜백 ref 로 돌려준다 — 화면이 닫혀 있다가(null) 나중에 그려져도 그때 붙는다. */
export default function useDragScroll() {
  const cleanup = useRef(null);
  return useCallback((el) => {
    if (cleanup.current) { cleanup.current(); cleanup.current = null; }
    if (!el) return;
    let down = null, moved = false;
    const onDown = (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = { x: e.clientX, left: el.scrollLeft }; moved = false;
    };
    const onMove = (e) => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (Math.abs(dx) > 5) moved = true;
      if (moved) { el.scrollLeft = down.left - dx; el.style.cursor = "grabbing"; }
    };
    const onUp = () => { down = null; el.style.cursor = ""; };
    const onClick = (e) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } };
    const onWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("wheel", onWheel, { passive: false });
    cleanup.current = () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);
}

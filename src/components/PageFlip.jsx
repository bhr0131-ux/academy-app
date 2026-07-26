/* ════════════════════════════════════════════════════════════════════════
   PageFlip — 책장 넘기듯 페이지 전환 래퍼 (모험일지용)
   ────────────────────────────────────────────────────────────────────────
   flipKey가 바뀌면 직전 children을 스냅샷으로 겹쳐 두고,
   왼쪽 책등을 축으로 실제 책장처럼 넘긴다 (perspective + rotateY).
   · 앞으로: 직전 페이지가 들려서 왼쪽으로 넘어가며 새 페이지 드러남
   · 뒤로: 새 페이지가 왼쪽에서 덮이며 넘어옴
   방향은 순환 거리로 판단 (total 기준) — 마지막→처음 넘김도 '앞으로'로 자연스럽게.
   스냅샷은 렌더 단계에서 잡는다(직전 구현은 effect에서 잡아 새 페이지가
   한 프레임 먼저 그려지고, 정리 타이머가 매 렌더마다 취소되는 버그가 있었음).

   props
     flipKey  : any     페이지 식별자 (바뀌면 넘김 연출)
     order    : number  시간순 인덱스
     total    : number  전체 페이지 수 (순환 방향 판단용, 기본 0=순환 없음)
     duration : number  ms (기본 620)
     children : node
   ════════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";

export default function PageFlip({ flipKey, order = 0, total = 0, duration = 620, children }) {
  const lastKey = useRef(flipKey);
  const lastOrder = useRef(order);
  const lastNode = useRef(children);
  const [prev, setPrev] = useState(null);

  // 렌더 단계 스냅샷: key가 바뀐 바로 그 렌더에서 직전 노드를 잡아 첫 프레임부터 넘김이 보이게 한다
  if (flipKey !== lastKey.current) {
    let dir;
    if (total > 1) {
      const fwd = ((order - lastOrder.current) % total + total) % total; // 순환 전진 거리
      dir = fwd !== 0 && fwd <= total / 2 ? 1 : -1;
    } else {
      dir = order >= lastOrder.current ? 1 : -1;
    }
    setPrev({ node: lastNode.current, dir, stamp: (prev?.stamp || 0) + 1 });
    lastKey.current = flipKey;
    lastOrder.current = order;
  }
  lastNode.current = children; // 같은 페이지 재렌더 → 스냅샷 최신화 (key 변경 시엔 위에서 이미 직전 노드 사용)

  // 넘김 연출이 끝나면 스냅샷 제거 (stamp로 연속 넘김도 각각 타이머 유지)
  useEffect(() => {
    if (!prev) return;
    const tm = setTimeout(() => setPrev(null), duration + 40);
    return () => clearTimeout(tm);
  }, [prev, duration]);

  const dir = prev ? prev.dir : 1;
  const ease = "cubic-bezier(.35,.08,.28,1)";
  return (
    <div style={{ position: "relative", perspective: 1400 }}>
      <style>{`
        @keyframes pfOut{0%{transform:rotateY(0);filter:brightness(1);opacity:1}55%{opacity:1;filter:brightness(.86)}100%{transform:rotateY(-132deg);filter:brightness(.7);opacity:0}}
        @keyframes pfIn{0%{transform:rotateY(-132deg);opacity:0;filter:brightness(.7)}38%{opacity:1;filter:brightness(.86)}100%{transform:rotateY(0);filter:brightness(1);opacity:1}}
        @keyframes pfReveal{0%{filter:brightness(.85)}100%{filter:brightness(1)}}
        @keyframes pfUnder{0%{filter:brightness(1)}100%{filter:brightness(.85)}}
      `}</style>
      {/* 현재 페이지 — 앞넘김이면 아래에서 드러나고, 뒤넘김이면 위에서 넘어들어온다 */}
      <div key={String(flipKey)} style={{ position: "relative", zIndex: prev && dir === -1 ? 3 : 1,
        transformOrigin: "left center",
        animation: prev ? `${dir === -1 ? "pfIn" : "pfReveal"} ${duration}ms ${ease} both` : "none" }}>
        {children}
      </div>
      {/* 직전 페이지 스냅샷 — 넘김 연출 후 제거. key=stamp: 연속 넘김 시 애니메이션 재시작 보장 */}
      {prev && (
        <div key={`pf${prev.stamp}`} style={{ position: "absolute", inset: 0, zIndex: dir === 1 ? 3 : 0,
          transformOrigin: "left center", pointerEvents: "none",
          animation: `${dir === 1 ? "pfOut" : "pfUnder"} ${duration}ms ${ease} both` }}>
          {prev.node}
        </div>
      )}
    </div>
  );
}

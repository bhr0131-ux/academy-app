/* ════════════════════════════════════════════════════════════════════════
   PageFlip — 책장 넘기듯 페이지 전환 래퍼 (모험일지용)
   ────────────────────────────────────────────────────────────────────────
   flipKey가 바뀌면 직전 children을 스냅샷으로 위에 겹쳐 두고,
   왼쪽 책등을 축으로 실제 책장처럼 넘긴다 (perspective + rotateY).
   · 앞으로(order 증가): 현재 페이지가 들려서 왼쪽으로 넘어가며 새 페이지 드러남
   · 뒤로(order 감소): 새 페이지가 왼쪽에서 덮이며 넘어옴
   90도를 넘기며 뒷면(좌우반전)이 보이는 구간은 opacity로 가려 자연스럽게 처리.

   props
     flipKey  : any     페이지 식별자 (바뀌면 넘김 연출)
     order    : number  시간순 인덱스 (증감으로 넘김 방향 결정)
     duration : number  ms (기본 620)
     children : node
   ════════════════════════════════════════════════════════════════════════ */
import { useEffect, useRef, useState } from "react";

export default function PageFlip({ flipKey, order = 0, duration = 620, children }) {
  const last = useRef({ key: flipKey, order, node: children });
  const [prev, setPrev] = useState(null);

  useEffect(() => {
    if (flipKey !== last.current.key) {
      const dir = order >= last.current.order ? 1 : -1;
      setPrev({ node: last.current.node, dir });
      const tm = setTimeout(() => setPrev(null), duration + 40);
      last.current = { key: flipKey, order, node: children };
      return () => clearTimeout(tm);
    }
    last.current = { key: flipKey, order, node: children }; // 같은 페이지 재렌더 → 스냅샷 최신화
  });

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
      {/* 직전 페이지 스냅샷 — 넘김 연출 후 제거 */}
      {prev && (
        <div style={{ position: "absolute", inset: 0, zIndex: dir === 1 ? 3 : 0,
          transformOrigin: "left center", pointerEvents: "none",
          animation: `${dir === 1 ? "pfOut" : "pfUnder"} ${duration}ms ${ease} both` }}>
          {prev.node}
        </div>
      )}
    </div>
  );
}

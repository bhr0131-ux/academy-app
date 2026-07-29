import { useEffect, useState } from "react";
import { DISCOVERY_RARITY, getDiscovery } from "../data/discoveries.js";

/* ════════════════════════════════════════════════════════════════════════
   DiscoveryBubble — 탐험지도 위 아이 머리 위 '오늘의 발견' 말풍선
   ────────────────────────────────────────────────────────────────────────
   탐험을 끝낸 날에만 뜬다. 항상 떠 있으면 특별함이 없어진다(사용자 확정).
   띄우는 시점은 AdventureMap이 정한다 — 아이가 보물상자 옆에 도착하고
   상자가 열린 다음(사용자 확정). 예전엔 무대 펫 옆에 있었다.

   연출은 두 단계로만 나눈다 — 복잡하게 만들지 않는 게 원칙이다.
     · 보통/귀함 : 말풍선이 톡 떠오른다 (0.5초)
     · 전설      : 뒤에 반짝이가 돌고 말풍선이 커졌다 작아진다 (3초쯤)
   전설을 매일 보면 특별하지 않으므로, 확률은 데이터(DISCOVERY_RARITY)에서 낮게 잡았다.

   props
     id      : 발견 id (없으면 아무것도 안 그림)
     isNew   : 오늘 처음 기록된 것이면 true → 등장 연출을 준다
     onDone  : 전설 연출이 끝났을 때 (없어도 됨)
   ════════════════════════════════════════════════════════════════════════ */
export default function DiscoveryBubble({ id, isNew = false, onDone }) {
  const d = getDiscovery(id);
  const [burst, setBurst] = useState(false);

  const legend = d?.rarity === "legend";
  useEffect(() => {
    if (!d || !isNew || !legend) return;
    setBurst(true);
    const t = setTimeout(() => { setBurst(false); onDone && onDone(); }, 3000);
    return () => clearTimeout(t);
  }, [d, isNew, legend, onDone]);

  if (!d) return null;
  const rc = DISCOVERY_RARITY[d.rarity] || DISCOVERY_RARITY.common;

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
      {/* 전설 반짝이 — 말풍선 뒤에서 도는 별. 전설일 때만, 3초만. */}
      {burst && (
        <div aria-hidden style={{ position: "absolute", inset: -18, zIndex: 0 }}>
          {["✨", "⭐", "✨", "🌟"].map((s, i) => (
            <span key={i} style={{
              position: "absolute", fontSize: 13,
              left: `${[6, 78, 12, 84][i]}%`, top: `${[4, 10, 74, 66][i]}%`,
              animation: `discoTwinkle 1.1s ease-in-out ${i * 0.18}s infinite`,
            }}>{s}</span>
          ))}
        </div>
      )}

      <div style={{
        position: "relative", zIndex: 1,
        background: legend ? "linear-gradient(135deg,#FFF7E0,#FFE9B8)" : "rgba(255,248,235,0.97)",
        color: "#5D4633", fontSize: 11.5, fontWeight: 900,
        padding: "5px 10px", borderRadius: 12,
        /* 문구가 길어도 화면 밖으로 나가지 않게 폭을 잡고 줄바꿈을 허용한다.
           지도 도착 지점(가로 64%)에 뜨므로, 폭 168px이면 화면 폭 360px에서도
           오른쪽이 잘리지 않으면서 대부분의 문구가 두 줄에 들어간다. */
        maxWidth: 168, whiteSpace: "normal", textAlign: "center", lineHeight: 1.35,
        border: legend ? `1.5px solid ${rc.color}` : "none",
        boxShadow: legend ? `0 3px 12px ${rc.color}66` : "0 2px 7px rgba(93,70,51,0.28)",
        animation: isNew ? (legend ? "discoPop 3s ease-out" : "discoRise .5s ease-out") : "none",
      }}>
        {d.emoji} {d.msg}
        {/* 말풍선 꼬리 */}
        <span style={{
          position: "absolute", left: "50%", bottom: -5, transform: "translateX(-50%)",
          width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
          borderTop: `5px solid ${legend ? "#FFE9B8" : "rgba(255,248,235,0.97)"}`,
        }} />
      </div>
    </div>
  );
}

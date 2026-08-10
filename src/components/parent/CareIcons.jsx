/* ════════════════════════════════════════════════════════════════════════
   CareIcons — 엄마용 화면의 작은 선 아이콘 (셔틀·준비물·미션·메모·결석·보충)
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-09] 🚌 🎒 📝 같은 운영체제 이모지는 기기마다 모양이
   달라지고, 앱의 수채화 그림체와도 어울리지 않는다. 하단 메뉴(ParentNav)와
   같은 결의 선 아이콘으로 맞춘다.

   currentColor 를 쓰므로 색은 감싼 쪽의 color 하나로 정해진다.
   ════════════════════════════════════════════════════════════════════════ */

const S = (size) => ({ width: size, height: size, display: "block", flexShrink: 0 });
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };

export default function CareIcon({ name, size = 14 }) {
  const common = { viewBox: "0 0 24 24", style: S(size), "aria-hidden": "true" };
  switch (name) {
    case "shuttle":  // 셔틀 버스
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="11" rx="2.5" {...P} />
          <path d="M3 11h18M8 5v6M16 5v6" {...P} />
          <circle cx="7.5" cy="18.5" r="1.6" {...P} />
          <circle cx="16.5" cy="18.5" r="1.6" {...P} />
        </svg>
      );
    case "bag":      // 준비물 가방
      return (
        <svg {...common}>
          <path d="M5 9.5h14a1 1 0 0 1 1 1V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8.5a1 1 0 0 1 1-1Z" {...P} />
          <path d="M9 9.5V7a3 3 0 0 1 6 0v2.5M9 14h6" {...P} />
        </svg>
      );
    case "mission":  // 미션 과녁
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" {...P} />
          <circle cx="12" cy="12" r="3.4" {...P} />
        </svg>
      );
    case "memo":     // 메모
      return (
        <svg {...common}>
          <path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" {...P} />
          <path d="M14 4v5h5M8 13h8M8 17h5" {...P} />
        </svg>
      );
    case "absent":   // 결석
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.2" {...P} />
          <path d="M9 9l6 6M15 9l-6 6" {...P} />
        </svg>
      );
    case "makeup":   // 보충 수업
      return (
        <svg {...common}>
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H11v15H6.5A2.5 2.5 0 0 0 4 21.5Z" {...P} />
          <path d="M20 6.5A2.5 2.5 0 0 0 17.5 4H13v15h4.5A2.5 2.5 0 0 1 20 21.5Z" {...P} />
        </svg>
      );
    case "reward":   // 보상 (선물)
      return (
        <svg {...common}>
          <rect x="3.5" y="9" width="17" height="11.5" rx="1.8" {...P} />
          <path d="M2.5 6h19v3h-19zM12 6v14.5" {...P} />
          <path d="M12 6C10.5 3.6 8.9 3 7.9 3.6 6.8 4.3 7.3 6 9 6ZM12 6c1.5-2.4 3.1-3 4.1-2.4 1.1.7.6 2.4-1.1 2.4Z" {...P} />
        </svg>
      );
    case "vacation": // 방학·휴원 (파라솔)
      return (
        <svg {...common}>
          <path d="M12 4c4.4 0 8 3.2 8 7H4c0-3.8 3.6-7 8-7Z" {...P} />
          <path d="M12 11v9M12 20a2 2 0 0 0 3 0" {...P} />
        </svg>
      );
    default:
      return null;
  }
}

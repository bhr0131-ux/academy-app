/* ════════════════════════════════════════════════════════════════════════
   RegisteredAcademyList — 엄마용 홈 '등록 학원' 목록
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-16] 홈의 '오늘의 학원' 자리에서 토글로 바꿔 보는 목록.
   생김새를 '오늘의 학원'과 최대한 같게 맞춘다 — 접힌 줄도, 펼친 속도.

   접힌 줄  [종류(학원색)] [요일 시간범위]                      ⌄
            '오늘의 학원'은 [종류][시간범위]인데, 여기는 날짜에 매이지 않으므로
            시간 앞에 요일을 붙인다 (매일 / 평일 / 주말 / 월·수·금).

   펼친 속  '오늘의 학원'과 같은 3단 + 나머지 등록 정보
            ① 🎹 학원 이름 · 40분 수업            ☎ 💬
            ② 🚌 08:30  아파트 정문
            ③ 준비물 [악보]      반복 숙제 [연습 20분]
            ④ 메모 / 월 학원비 · 납부일 · 계좌 · 선생님 · 주소 · 연락처
                                                    ✎ 수정

   ④의 표(Row)와 요일·일정 문구는 AcademyTab 것을 그대로 가져다 쓴다 —
   학원 탭과 홈이 다른 말을 쓰면 안 되기 때문이다.

   그리기만 하고 저장은 하지 않는다 — 추가·수정은 전부 위로 알린다.
   ════════════════════════════════════════════════════════════════════════ */

import { C, mixWhite } from "../../data/tokens.js";
import { getShuttleText } from "../../data/sampleData.js";
import CareIcon from "./CareIcons.jsx";
import { dayGroupLabel, Row, RowAct } from "./AcademyTab.jsx";

/* 홈 탭과 같은 중간 톤 — 보조 글자보다 진하고 본문보다 연하다 */
const SUBD = "#5F678C";
const chip = { fontSize: 12.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20, lineHeight: 1.5 };

/* 시작~끝 시각 — '오늘의 학원'이 쓰는 계산과 같다 (시작 + 수업 길이) */
function timeRange(time, duration) {
  if (!time) return "";
  const [h, m] = String(time).split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const t = h * 60 + m + Number(duration || 0);
  const end = `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  return `${time}–${end}`;
}

/* 정렬 — 월요일부터. 같은 요일에 시작하면 이른 시간이 먼저.
   [사용자 확정 2026-08-16] '오늘의 학원'은 그날 시간순인데(getDayPlan 이 정렬한다),
   등록 학원은 날짜가 없으므로 '언제 가는 학원인가'를 주 초부터 늘어놓는다.
   요일마다 시간이 다른 학원은 그중 가장 이른 요일·시간을 기준으로 잡는다. */
const DAY_ORDER = ["월", "화", "수", "목", "금", "토", "일"];
function sortKey(ac) {
  const slots = ac.useCustomSchedule
    ? (ac.schedules || []).map(s => ({ day: s.day, time: s.time || ac.time }))
    : (ac.days || []).map(d => ({ day: d, time: ac.time }));
  const ranked = slots
    .map(s => ({ d: DAY_ORDER.indexOf(s.day), m: minutesOf(s.time) }))
    .filter(x => x.d >= 0)
    .sort((a, b) => a.d - b.d || a.m - b.m);
  return ranked[0] || { d: 99, m: 0 };   // 요일이 하나도 없는 학원은 맨 뒤
}
function minutesOf(t) {
  const [h, m] = String(t || "").split(":").map(Number);
  return Number.isNaN(h) ? 0 : h * 60 + (m || 0);
}

/* 접힌 줄에 쓸 '요일 + 시간'.
   요일마다 시간이 다른 학원은 한 줄에 다 못 담으므로 요일만 쓰고 시간은 펼쳐서 본다. */
function whenLabel(ac) {
  const day = dayGroupLabel(ac);
  if (ac.useCustomSchedule) {
    const list = ac.schedules || [];
    return list.length ? `${day} · 요일마다 다름` : day;
  }
  const t = timeRange(ac.time, ac.duration);
  return [day, t].filter(Boolean).join(" ");
}

export default function RegisteredAcademyList({
  th, CT, curAc = [], acKindLabel, getAcademyTheme, kidSkin,
  open = {}, setOpen, onEdit, onSms, onCopyAccount, onOpenMap,
}) {
  if (curAc.length === 0) {
    return (
      /* [사용자 확정 2026-08-16] 배경을 학원 카드와 같은 흰색으로 — 빈 칸만 색이 달라 튀었다.
         '아직 없다'는 신호인 점선 테두리는 그대로 둔다. */
      <div style={{ textAlign: "center", padding: "26px 20px", color: C.sub,
        background: "#fff", borderRadius: 18, border: `1.5px dashed ${th.main}40` }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52,
          borderRadius: "50%", background: mixWhite(th.main, 0.82), color: th.main }}>
          <CareIcon name="school" size={26} />
        </span>
        <p style={{ fontSize: 14, fontWeight: 700, margin: "8px 0 0" }}>아래 버튼으로 학원을 등록하세요</p>
      </div>
    );
  }

  return (
    <div>
      {[...curAc].sort((a, b) => {
        const ka = sortKey(a), kb = sortKey(b);
        return ka.d - kb.d || ka.m - kb.m;
      }).map((ac) => {
        const isOpen = !!open[ac.id];
        const supplies = ac.baseSupplies || [];
        const homeworks = ac.baseHomeworks || [];
        const themeIcon = getAcademyTheme ? getAcademyTheme(ac.name, kidSkin, ac.kind).icon : "";
        /* 셔틀 — 요일마다 다른 학원은 요일별로 한 줄씩, 아니면 한 줄만 */
        const shuttleRows = ac.useCustomShuttle
          ? [...new Set((ac.shuttleSchedules || []).map(s => s.day))]
              .map(d => ({ d, text: getShuttleText(ac, d) })).filter(x => x.text)
          : (ac.shuttleInfo ? [{ d: "", text: ac.shuttleInfo }] : []);
        const hasDetail = Number(ac.fee || 0) > 0 || ac.teacher || ac.address
          || ac.phone || (ac.account || "").trim();

        return (
          /* 카드 껍데기는 '오늘의 학원'과 같은 값 — 흰 바탕, 왼쪽 세로선만 학원색 */
          <div key={ac.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 14,
            border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(90,70,60,0.05)",
            overflow: "hidden", display: "flex" }}>
            <div style={{ width: 4, background: ac.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* 접힌 줄 — '오늘의 학원'과 같은 자리·같은 크기. 시간 앞에 요일만 더 붙는다. */}
              <button onClick={() => setOpen(p => (p[ac.id] ? {} : { [ac.id]: true }))} className="jelly-tap"
                aria-expanded={isOpen} aria-label={`${ac.name} 상세보기`}
                style={{ width: "100%", border: "none", background: "transparent", padding: "10px 16px 10px 12px",
                  display: "flex", alignItems: "center", gap: 9, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  touchAction: "manipulation", userSelect: "none", WebkitUserSelect: "none" }}>
                <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 7,
                  overflow: "hidden", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: ac.color, minWidth: 0,
                    overflow: "hidden", textOverflow: "ellipsis" }}>{acKindLabel(ac)}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, flexShrink: 0, color: SUBD }}>{whenLabel(ac)}</span>
                </span>
                {/* 화살표는 카드 오른쪽 끝에서 안쪽으로 들여 놓는다 — 가장자리 제스처 구역과
                    겹치면 눌림 표시만 나고 클릭이 취소된다 (실기기에서 재현·해결 확인).
                    오른쪽 여백을 줄이면 증상이 돌아온다. 자세한 내력은 ParentHomeTab 의 같은 줄. */}
                <span aria-hidden style={{ flexShrink: 0, width: 24, height: 24, display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 12, color: "#B9B3AD", fontWeight: 900,
                  transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "none" }}>⌄</span>
              </button>

              {isOpen && (
                <div style={{ padding: "14px 16px 10px" }}>
                  {/* ① 학원 이름 · 수업 길이 — 전화·문자는 아래 '학원 수정'과 같은 줄로 옮겼다
                      (사용자 확정 2026-08-16). 이름 줄에 있으니 긴 학원 이름과 자리를 다퉜고,
                      누르는 것끼리 한 줄에 모이는 편이 찾기 쉽다. */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <p style={{ flex: 1, minWidth: 0, margin: 0, display: "flex", alignItems: "baseline", gap: 5 }}>
                      <span style={{ minWidth: 0, fontSize: 14.5, fontWeight: 900, color: C.text,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {themeIcon} {ac.name}
                      </span>
                      {!ac.useCustomSchedule && ac.duration && (
                        <span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: SUBD, whiteSpace: "nowrap" }}>
                          · {ac.duration}분 수업</span>
                      )}
                    </p>
                  </div>

                  {/* ①-2 요일마다 시간이 다른 학원만 — 접힌 줄에 못 담은 시간표를 여기서 편다 */}
                  {ac.useCustomSchedule && (ac.schedules || []).length > 0 && (
                    <p style={{ margin: "0 0 10px", display: "flex", alignItems: "flex-start", gap: 5,
                      fontSize: 12.5, fontWeight: 600, color: SUBD, lineHeight: 1.4 }}>
                      <span style={{ marginTop: 1, flexShrink: 0 }}><CareIcon name="calendar" size={13} /></span>
                      <span style={{ minWidth: 0 }}>
                        {(ac.schedules || []).map(s => `${s.day} ${timeRange(s.time, s.duration ?? ac.duration)}`).join("  ·  ")}
                      </span>
                    </p>
                  )}

                  {/* ② 셔틀 — 시각은 진하게, 장소는 보통 굵기 ('오늘의 학원'과 같은 규칙) */}
                  {shuttleRows.map((row, i) => {
                    const m = row.text.match(/^(\d{1,2}:\d{2})\s+([\s\S]+)$/);
                    return (
                      <p key={i} style={{ margin: i === shuttleRows.length - 1 ? "0 0 16px" : "0 0 6px",
                        display: "flex", alignItems: "flex-start", gap: 5, fontSize: 12.5,
                        fontWeight: 600, color: SUBD, lineHeight: 1.35 }}>
                        <span style={{ marginTop: 1, flexShrink: 0 }}><CareIcon name="shuttle" size={13} /></span>
                        <span style={{ minWidth: 0, whiteSpace: "pre-wrap" }}>
                          {row.d && <span style={{ fontWeight: 800 }}>{row.d}  </span>}
                          {m ? <><span style={{ fontWeight: 900, color: C.text }}>{m[1]}</span>{"  "}{m[2]}</> : row.text}
                        </span>
                      </p>
                    );
                  })}

                  {/* ③ 준비물과 반복 숙제를 한 줄에 나란히 — '오늘의 학원'의 준비물/오늘 미션 자리 */}
                  <div style={{ display: "flex", alignItems: "flex-start", flexWrap: "wrap",
                    gap: "10px 14px", marginBottom: 14 }}>
                    {[{ k: "bag", label: "준비물", items: supplies },
                      { k: "mission", label: "반복 숙제", items: homeworks }].map((row) => (
                      <div key={row.k} style={{ flex: "1 1 auto", minWidth: "max-content", maxWidth: "100%",
                        display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0, color: SUBD }}>
                          <CareIcon name={row.k} size={14} />
                          <span style={{ fontSize: 12.5, fontWeight: 700 }}>{row.label}</span>
                        </span>
                        {row.items.length
                          ? row.items.map((s, i) => (
                              <span key={i} style={{ ...chip, background: `${ac.color}18`, color: ac.color }}>{s}</span>
                            ))
                          : <span style={{ ...chip, background: CT.faint, color: SUBD }}>없음</span>}
                      </div>
                    ))}
                  </div>

                  {/* ④ 메모 */}
                  {ac.memo && (
                    <div style={{ marginBottom: 12, background: `${C.orange}0D`, borderRadius: 11,
                      padding: "7px 10px", display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
                        color: C.orange, marginTop: 1 }}>
                        <CareIcon name="memo" size={12} /><span style={{ fontSize: 11.5, fontWeight: 600 }}>메모</span>
                      </span>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.45,
                        whiteSpace: "pre-wrap", minWidth: 0, flex: 1 }}>{ac.memo}</p>
                    </div>
                  )}

                  {/* ⑤ 매일 확인하지 않는 값들 — 학원 탭과 같은 표(Row)를 그대로 쓴다.
                         '오늘의 학원'에는 없는 줄이지만, 등록 정보를 빠짐없이 담아야 해서 넣는다. */}
                  <div style={{ paddingTop: 4, paddingBottom: 8, borderTop: `1px solid ${C.border}` }}>
                    {!hasDetail && (
                      <p style={{ margin: "4px 0 2px", fontSize: 12.5, fontWeight: 600, color: C.sub, opacity: 0.75 }}>
                        더 등록된 정보가 없어요
                      </p>
                    )}
                    {hasDetail && (<>
                      {Number(ac.fee || 0) > 0 && <Row icon="fee" label="월 학원비" value={`${Number(ac.fee).toLocaleString()}원`} />}
                      {Number(ac.fee || 0) > 0 && <Row icon="calendar" label="납부일" value={`매월 ${ac.payDay}일`} />}
                      {(ac.account || "").trim() && <Row icon="bank" label="입금 계좌" value={ac.account}
                        action={onCopyAccount && <RowAct label="복사" color={ac.color} onPress={() => onCopyAccount(ac.account)} />} />}
                      {ac.teacher && <Row icon="teacher" label="선생님" value={ac.teacher} />}
                      {ac.address && <Row icon="pin" label="주소" value={ac.address}
                        action={onOpenMap && <RowAct label="지도" color={ac.color} onPress={() => onOpenMap(ac.address)} />} />}
                      {ac.phone && <Row icon="phone" label="연락처" value={ac.phone} soft />}
                    </>)}
                  </div>

                  {/* ⑥ 맨 아랫줄 — 왼쪽 끝에 전화·문자, 오른쪽 끝에 수정 ('오늘의 학원'과 같은 배치) */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    {/* 전화·문자 — 계좌 '복사' · 주소 '지도' 와 같은 생김새(RowAct)로 통일한다
                        (사용자 확정 2026-08-16). 아이콘만 있던 원형 버튼은 무엇을 누르는지
                        한 번 생각해야 했고, 같은 카드 안에 버튼 모양이 두 가지였다. */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {ac.phone && <RowAct label="전화" color={ac.color} big
                        href={`tel:${ac.phone}`} title={`${ac.name} 전화`} />}
                      {ac.phone && <RowAct label="문자" color={ac.color} big
                        onPress={() => onSms(ac)} title={`${ac.name} 문자`} />}
                    </div>
                    <button onClick={() => onEdit(ac)} className="jelly-tap" aria-label={`${ac.name} 수정`}
                      style={{ border: "none", background: "none", color: SUBD, fontSize: 12, fontWeight: 800,
                        cursor: "pointer", fontFamily: "inherit", padding: "6px 0 6px 12px",
                        display: "inline-flex", alignItems: "center", gap: 5 }}>
                      {/* [사용자 확정 2026-08-16] '오늘의 학원'의 수정은 그날 미션·준비물을
                          고치는 것이고, 여기는 학원 정보 자체를 고친다 → 이름으로 구분한다. */}
                      <CareIcon name="pencil" size={13} />학원 수정
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

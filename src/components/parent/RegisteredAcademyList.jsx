/* ════════════════════════════════════════════════════════════════════════
   RegisteredAcademyList — 엄마용 홈 '등록 학원' 목록
   ────────────────────────────────────────────────────────────────────────
   [사용자 확정 2026-08-16] 홈의 '오늘의 학원' 자리에서 토글로 바꿔 보는 목록.
   학원 탭(AcademyTab)과 같은 내용을 담되, 카드 생김새를 홈의 '오늘의 학원'에
   맞춘다 — 접었을 때 한 줄, 나머지는 전부 '상세보기' 안으로.

   접힌 줄 : [종류(학원색)] [학원 이름]              [요일]  ⌄
   펼친 줄 : 일정 → 준비물·반복 숙제 → 메모 → 학원비·계좌·선생님·주소·연락처·셔틀
             → 전화·문자 → 수정

   AcademyTab 과 달리 날짜에 매이지 않는다 — 홈의 날짜 이동과 무관하게 늘 같은
   목록을 보여 준다. 상세 표(Row)와 일정 문구(scheduleLabel)는 AcademyTab 것을
   그대로 가져다 쓴다 (두 화면이 어긋나지 않게).

   그리기만 하고 저장은 하지 않는다 — 추가·수정·복사는 전부 위로 알린다.

   props
     th, CT            : 아이 테마색 / 그 테마에 맞춘 박스색 세트
     curAc             : 등록 학원 목록
     acKindLabel(ac)   : 학원 종류 이름 (App이 들고 있는 함수)
     open, setOpen     : 펼친 카드 {학원id:true} — 아코디언(한 번에 하나)
     onEdit / onSms / onCopyAccount / onOpenMap : 카드 안 동작
   ════════════════════════════════════════════════════════════════════════ */

import { C, mixWhite } from "../../data/tokens.js";
import CareIcon from "./CareIcons.jsx";
import { scheduleLabel, Row, RowAct } from "./AcademyTab.jsx";

/* 홈 탭과 같은 중간 톤 — 보조 글자보다 진하고 본문보다 연하다 */
const SUBD = "#5F678C";
const chip = { fontSize: 12.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20, lineHeight: 1.5 };

export default function RegisteredAcademyList({
  th, CT, curAc = [], acKindLabel, open = {}, setOpen,
  onEdit, onSms, onCopyAccount, onOpenMap,
}) {
  if (curAc.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "26px 20px", color: C.sub,
        background: mixWhite(th.main, 0.93), borderRadius: 18, border: `1.5px dashed ${th.main}40` }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 52, height: 52,
          borderRadius: "50%", background: mixWhite(th.main, 0.82), color: th.main }}>
          <CareIcon name="school" size={26} />
        </span>
        <p style={{ fontSize: 14, fontWeight: 700, margin: "8px 0 0" }}>위 버튼으로 학원을 등록하세요</p>
      </div>
    );
  }

  return (
    <div>
      {curAc.map((ac) => {
        const isOpen = !!open[ac.id];
        const supplies = ac.baseSupplies || [];
        const homeworks = ac.baseHomeworks || [];
        const days = ac.useCustomSchedule
          ? [...new Set((ac.schedules || []).map(s => s.day))]
          : (ac.days || []);
        const hasDetail = Number(ac.fee || 0) > 0 || ac.teacher || ac.address
          || ac.shuttleInfo || ac.phone || (ac.account || "").trim();

        return (
          /* 카드 껍데기는 '오늘의 학원'과 같은 값 — 흰 바탕, 왼쪽 세로선만 학원색 */
          <div key={ac.id} style={{ background: "#fff", borderRadius: 14, marginBottom: 14,
            border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(90,70,60,0.05)",
            overflow: "hidden", display: "flex" }}>
            <div style={{ width: 4, background: ac.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* 접힌 줄 — 종류·이름만. '오늘의 학원'의 [종류][시간] 자리에 [종류][이름]을 둔다.
                  등록 목록에서는 "언제 가나"보다 "어느 학원인가"를 먼저 찾기 때문이다.
                  요일은 오른쪽 끝에 작게 — 시간·수업길이는 펼쳐야 나온다. */}
              <button onClick={() => setOpen(p => (p[ac.id] ? {} : { [ac.id]: true }))} className="jelly-tap"
                aria-expanded={isOpen} aria-label={`${ac.name} 상세보기`}
                style={{ width: "100%", border: "none", background: "transparent", padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: 9, cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                <span style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 7,
                  overflow: "hidden", whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: ac.color, flexShrink: 0 }}>{acKindLabel(ac)}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: SUBD, minWidth: 0,
                    overflow: "hidden", textOverflow: "ellipsis" }}>{ac.name}</span>
                </span>
                {days.length > 0 && (
                  <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, padding: "3px 8px",
                    borderRadius: 8, background: `${ac.color}14`, color: ac.color }}>
                    {days.length === 7 ? "매일" : days.join("")}
                  </span>
                )}
                <span style={{ flexShrink: 0, fontSize: 12, color: "#B9B3AD", fontWeight: 900,
                  transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "none" }}>⌄</span>
              </button>

              {isOpen && (
                <div style={{ padding: "0 14px 10px" }}>
                  {/* ① 수업 일정 — 접힌 줄의 요일 배지를 풀어 쓴 것 */}
                  <p style={{ margin: "0 0 12px", display: "flex", alignItems: "flex-start", gap: 5,
                    fontSize: 12.5, fontWeight: 700, color: SUBD, lineHeight: 1.35 }}>
                    <span style={{ marginTop: 1, flexShrink: 0 }}><CareIcon name="calendar" size={13} /></span>
                    <span style={{ minWidth: 0 }}>{scheduleLabel(ac)}</span>
                  </p>

                  {/* ② 준비물·반복 숙제 — '오늘의 학원'의 칩과 같은 모양 */}
                  {[{ k: "bag", label: "준비물", items: supplies },
                    { k: "mission", label: "반복 숙제", items: homeworks }].map((row) => (
                    <div key={row.k} style={{ display: "flex", alignItems: "center", flexWrap: "wrap",
                      gap: 6, marginBottom: 8 }}>
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

                  {/* ③ 메모 */}
                  {ac.memo && (
                    <div style={{ marginTop: 2, marginBottom: 8, background: `${C.orange}0D`, borderRadius: 11,
                      padding: "7px 10px", display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
                        color: C.orange, marginTop: 1 }}>
                        <CareIcon name="memo" size={12} /><span style={{ fontSize: 11.5, fontWeight: 600 }}>메모</span>
                      </span>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: C.text, margin: 0, lineHeight: 1.45,
                        whiteSpace: "pre-wrap", minWidth: 0, flex: 1 }}>{ac.memo}</p>
                    </div>
                  )}

                  {/* ④ 매일 확인하지 않는 값들 — 학원 탭과 같은 표(Row)를 그대로 쓴다 */}
                  <div style={{ marginTop: 8, paddingTop: 4, paddingBottom: 10, borderTop: `1px solid ${C.border}` }}>
                    {Number(ac.fee || 0) > 0 && <Row icon="fee" label="월 학원비" value={`${Number(ac.fee).toLocaleString()}원`} />}
                    {Number(ac.fee || 0) > 0 && <Row icon="calendar" label="납부일" value={`매월 ${ac.payDay}일`} />}
                    {(ac.account || "").trim() && <Row icon="bank" label="입금 계좌" value={ac.account}
                      action={onCopyAccount && <RowAct label="복사" color={ac.color} onPress={() => onCopyAccount(ac.account)} />} />}
                    {ac.teacher && <Row icon="teacher" label="선생님" value={ac.teacher} />}
                    {ac.address && <Row icon="pin" label="주소" value={ac.address}
                      action={onOpenMap && <RowAct label="지도" color={ac.color} onPress={() => onOpenMap(ac.address)} />} />}
                    {ac.phone && <Row icon="phone" label="연락처" value={ac.phone} soft />}
                    {ac.shuttleInfo && <Row icon="shuttle" label="셔틀" value={ac.shuttleInfo} />}
                    {!hasDetail && (
                      <p style={{ margin: "8px 0 2px", fontSize: 12.5, fontWeight: 600, color: C.sub, opacity: 0.75 }}>
                        더 등록된 정보가 없어요
                      </p>
                    )}
                  </div>

                  {/* ⑤ 전화·문자·수정 — 학원 탭과 같은 모양, 수정만 여기로 내렸다
                         (접힌 줄을 한 줄로 유지하려면 머리에 버튼을 못 둔다) */}
                  <div style={{ display: "flex", gap: 7 }}>
                    {ac.phone && (
                      <a href={`tel:${ac.phone}`} className="jelly-tap" aria-label={`${ac.name} 전화`}
                        style={{ flex: 1, minWidth: 0, padding: "8px", borderRadius: 11, background: "#fff",
                          border: `1px solid ${C.border}`, color: SUBD, fontSize: 12.5, fontWeight: 800,
                          textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <CareIcon name="phone" size={13} /> 전화
                      </a>
                    )}
                    {ac.phone && (
                      <button onClick={() => onSms(ac)} className="jelly-tap"
                        style={{ flex: 1, minWidth: 0, padding: "8px", borderRadius: 11, background: "#fff",
                          border: `1px solid ${C.border}`, color: SUBD, fontSize: 12.5, fontWeight: 800,
                          cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center",
                          justifyContent: "center", gap: 6 }}>
                        <CareIcon name="sms" size={13} /> 문자
                      </button>
                    )}
                    <button onClick={() => onEdit(ac)} className="jelly-tap" aria-label={`${ac.name} 수정`}
                      style={{ flex: 1, minWidth: 0, padding: "8px", borderRadius: 11, background: "#fff",
                        border: `1px solid ${C.border}`, color: SUBD, fontSize: 12.5, fontWeight: 800,
                        cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center",
                        justifyContent: "center", gap: 6 }}>
                      <CareIcon name="pencil" size={13} /> 수정
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

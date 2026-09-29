/* ════════════════════════════════════════════════════════════════════
   사장님 도구 — 사장님 숫자를 나누는 데까지입니다

   ⚠️⚠️ **기준값을 만들지 마세요.** "인건비율 25%면 정상" · "철거비는
   평당 얼마" 는 업종 · 지역 · 평수 · 시공 수준마다 달라서 우리가 댈
   근거가 없습니다. 그래서 이 도구들은 **판정하지 않고** 상태색
   (`--ok`/`--warn`/`--bad`)도 쓰지 않습니다.

   ⚠️ **안 적은 칸은 `—` 입니다.** 0 으로 치거나 업계 평균으로 메우면
   그 순간 지어낸 숫자입니다. 대신 **무엇을 더 적어야 답이 나오는지**
   를 적어 줍니다.

   ⚠️ **축산 전용을 넣지 마세요.** 예전 도구에 수율 원가 · 육류원가율이
   있었습니다 — 모든 업종의 사장님이 손님인 지금은 한 업종 전용 계산기가
   나머지 열세 업종에게 "여긴 내 자리가 아니네" 가 됩니다.

   ⚠️ 적으신 숫자는 **이 브라우저에만** 남습니다 (`am.tool.*`). 서버로
   보내지 않고, 성함 · 연락처는 담지 않습니다.
   ════════════════════════════════════════════════════════════════════ */

/* 도구 목록 — ⚠️ 새 도구를 만들면 **여섯 군데**를 같이 고치세요:
   여기 · js/app.js(META · routeInfo · render) · build-pages.js(allRoutes ·
   noscriptFor) · check.js(PAGES) · 푸터 · 검색. */
window.AM_TOOLS = [
  { key:"cost",  to:"/tools/cost",  icon:"won",    name:"창업비 정리표",
    lead:"빠뜨리기 쉬운 항목을 늘어놓고, 받으신 견적을 적으면 합계가 나옵니다",
    ask:"항목별로 받은 견적", out:"합계 · 아직 안 받은 칸", time:"5분",
    side:"start" },
  { key:"fixed", to:"/tools/fixed", icon:"calendar", name:"월 고정비 계산",
    lead:"팔리든 안 팔리든 나가는 돈. 하루에 얼마를 벌어야 하는지까지",
    ask:"임차료 · 인건비 · 공과금", out:"월 고정비 · 하루치", time:"2분",
    side:"both" },
  { key:"bep",   to:"/tools/bep",   icon:"target", name:"손익분기 계산",
    lead:"고정비를 공헌이익률로 나눕니다. 본전이 되는 매출이 얼마인지",
    ask:"월 고정비 · 변동비 비율", out:"본전 매출 · 하루 매출", time:"3분",
    side:"both" },
  { key:"labor", to:"/tools/labor", icon:"users",  name:"인건비율 계산",
    lead:"매출 대비 인건비. 사장 인건비를 넣을지는 사장님이 고르십니다",
    ask:"월 매출 · 인건비 합계", out:"인건비율 · 1인당 매출", time:"1분",
    side:"both" },
  { key:"vs",    to:"/tools/vs",    icon:"scale",  name:"신규 창업 vs 매장 인수",
    lead:"새로 만드는 것과 하던 가게를 받는 것. 들어가는 돈과 시간을 나란히",
    ask:"양쪽에 드는 돈 · 기간", out:"초기 비용 차이 · 회수 기준", time:"4분",
    side:"start" },
  { key:"close", to:"/tools/close", icon:"list",   name:"폐업 체크리스트",
    lead:"순서대로 짚어 가며 빠뜨린 것을 찾습니다. 기한이 있는 것이 여럿입니다",
    ask:"해당하는 것 체크", out:"남은 것 · 기한 있는 것", time:"5분",
    side:"close" }
];

window.amTool = function(key){
  var r = (window.AM_TOOLS||[]).filter(function(t){ return t.key === key; });
  return r.length ? r[0] : null;
};
window.amTools = function(side){
  return (window.AM_TOOLS||[]).filter(function(t){
    return !side || t.side === side || t.side === "both"; });
};

/* ── 창업비 정리표 항목 (§10) ──────────────────────────────────────
   ⚠️ **예상 금액을 알려 주지 않습니다.** 지역 · 평수 · 시공 수준에 따라
   항목마다 몇 배씩 차이 납니다. 근거 없는 "예상 3,200만원" 을 적으면
   사장님이 그 숫자로 돈을 빌리러 갑니다.
   하는 일은 셋입니다 — 빠뜨리기 쉬운 항목을 전부 늘어놓고, 사장님이
   **실제로 받은 견적**을 적으면, 합계와 **아직 안 받은 칸**을 보여
   줍니다. 숫자가 전부 사장님 것이라 틀릴 여지가 없습니다. */
window.AM_COST_GROUPS = [
  { h:"자리", items:[
    { key:"deposit", name:"보증금" },
    { key:"premium", name:"권리금" },
    { key:"agency",  name:"중개수수료" },
    { key:"rent1",   name:"첫 달 임차료 · 관리비" }
  ]},
  { h:"공사", items:[
    { key:"interior", name:"인테리어 · 시공" },
    { key:"elec",     name:"전기 증설" },
    { key:"plumb",    name:"급배수 · 설비" },
    { key:"fire",     name:"소방" },
    { key:"sign",     name:"간판 · 외부" }
  ]},
  { h:"채우기", items:[
    { key:"equip",  name:"주요 장비" },
    { key:"furni",  name:"가구 · 집기" },
    { key:"it",     name:"POS · 키오스크 · CCTV · 인터넷" },
    { key:"small",  name:"소모품 · 초도 물품" }
  ]},
  { h:"영업 준비", items:[
    { key:"license", name:"인허가 · 교육 · 검사" },
    { key:"tax",     name:"세무 · 노무 · 법무" },
    { key:"insure",  name:"보험" },
    { key:"mkt",     name:"마케팅 · 사진 · 디자인" }
  ]},
  { h:"여유 자금", items:[
    { key:"buffer", name:"운영 예비비" }
  ]}
];

/* ── 월 고정비 ──────────────────────────────────────────────────── */
window.AM_FIXED = [
  { key:"rent",  name:"임차료",   hint:"월세 + 관리비" },
  { key:"labor", name:"인건비",   hint:"급여 · 4대보험 · 퇴직충당까지" },
  { key:"util",  name:"공과금",   hint:"전기 · 가스 · 수도 · 통신" },
  { key:"lease", name:"리스 · 할부", hint:"장비 · 차량 · POS 약정" },
  { key:"loan",  name:"대출 이자", hint:"원금은 빼고 이자만" },
  { key:"etc",   name:"그 외",    hint:"보험 · 정기구독 · 세무기장료" }
];

/* ── 손익분기 ───────────────────────────────────────────────────── */
window.AM_BEP_VAR = [
  { key:"mat", name:"재료비 · 원가 비율", unit:"%",
    hint:"매출 대비. 파는 물건이나 재료에 나가는 몫" },
  { key:"fee", name:"수수료 비율",       unit:"%",
    hint:"카드 · 배달앱 · 플랫폼 · 포장재 등 팔릴 때마다 나가는 것" }
];
window.AM_BEP_RUN = [
  { key:"days",   name:"월 영업일수", unit:"일",  hint:"쉬는 날을 뺀 실제 영업일" },
  { key:"ticket", name:"객단가",      unit:"원",  hint:"손님 한 분이 평균 얼마를 쓰시는지" }
];

/* ── 인건비율 ───────────────────────────────────────────────────── */
window.AM_LABOR = [
  { key:"sales", name:"월 매출",            unit:"만원",
    hint:"부가세를 뺀 매출로 적으시면 비율이 더 정확합니다", group:"매출" },
  { key:"wage",  name:"급여 합계",          unit:"만원",
    hint:"이번 달에 실제로 나간 급여", group:"인건비" },
  { key:"ins",   name:"4대보험 · 퇴직충당", unit:"만원",
    hint:"사업주 부담분. 모르시면 비워 두세요", group:"인건비" },
  { key:"owner", name:"사장 인건비",        unit:"만원",
    hint:"직접 뛰시는 몫을 넣을지는 사장님이 고르십니다", group:"인건비" },
  { key:"heads", name:"일하는 사람 수",     unit:"명",
    hint:"사장님 포함 여부는 위 사장 인건비와 맞추세요", group:"나눠 보기" }
];

/* ── 신규 창업 vs 매장 인수 (§16) ───────────────────────────────── */
window.AM_VS = [
  { key:"n_fitout", name:"인테리어 · 시공",    side:"new",  hint:"새로 만드는 쪽" },
  { key:"n_equip",  name:"장비 · 가구",        side:"new" },
  { key:"n_deposit",name:"보증금",             side:"new" },
  { key:"n_etc",    name:"그 외 (인허가 · 마케팅 등)", side:"new" },
  { key:"n_days",   name:"문 열기까지 걸리는 날", side:"new", unit:"일" },

  { key:"t_premium",name:"권리금",             side:"take", hint:"하던 가게를 받는 쪽" },
  { key:"t_deposit",name:"보증금",             side:"take" },
  { key:"t_fix",    name:"고쳐야 할 것",       side:"take", hint:"부분 시공 · 교체" },
  { key:"t_etc",    name:"그 외 (명의변경 · 재고 인수 등)", side:"take" },
  { key:"t_days",   name:"문 열기까지 걸리는 날", side:"take", unit:"일" }
];

/* ── 폐업 체크리스트 (§10 · §8) ─────────────────────────────────────
   ⚠️ **기한이 있는 것**에 `due` 를 답니다. 순서를 바꾸지 마세요 —
   화면 차례가 곧 실제로 하실 차례입니다. */
window.AM_CLOSE_CHECK = [
  { h:"먼저 정할 것", items:[
    { key:"c1", t:"넘길 수 있는지 알아봤다 (양도 · 권리금)",
      n:"닫기로 정하기 전에 봅니다. 넘기면 철거비도 안 들고 권리금 회수 기회도 생깁니다" },
    { key:"c2", t:"임대인에게 알렸다", due:true,
      n:"계약서에 정해진 통지 시점이 있습니다. 늦으면 그만큼 차임이 더 나갑니다" }
  ]},
  { h:"계약 끊기", items:[
    { key:"c3", t:"전기 · 가스 · 수도 최종 검침과 해지 · 명의변경" },
    { key:"c4", t:"인터넷 · 전화 · POS · 키오스크 약정 잔여와 위약금 확인" },
    { key:"c5", t:"카드 단말기 · 배달앱 · 정기결제 해지" },
    { key:"c6", t:"리스 · 할부가 남은 장비 정리" },
    { key:"c7", t:"프랜차이즈라면 가맹계약 해지 조건 확인" }
  ]},
  { h:"사람", items:[
    { key:"c8",  t:"해고예고 또는 예고수당", due:true,
      n:"근로기준법상 기한이 있습니다" },
    { key:"c9",  t:"마지막 임금 · 연차수당 · 퇴직금 정산", due:true },
    { key:"c10", t:"4대보험 상실 신고", due:true,
      n:"안 하면 문 닫은 뒤에도 보험료가 계속 부과됩니다" }
  ]},
  { h:"물건", items:[
    { key:"c11", t:"재고 처분 또는 반품" },
    { key:"c12", t:"시설 · 집기 처분 (넘기기 · 매각 · 폐기)" }
  ]},
  { h:"신고", items:[
    { key:"c13", t:"폐업 신고 (세무서 또는 홈택스)", due:true,
      n:"부가가치세법상 지체 없이" },
    { key:"c14", t:"인허가 업종이면 관할 구청에도 폐업 신고", due:true }
  ]},
  { h:"마무리", items:[
    { key:"c15", t:"원상복구 범위를 임대인과 글로 맞췄다" },
    { key:"c16", t:"철거 · 원상복구 · 폐기물 처리 완료" },
    { key:"c17", t:"보증금 정산" },
    { key:"c18", t:"남은 세무 신고 (부가세 확정 · 종합소득세)", due:true }
  ]}
];



window.AM_TOOLS = [
  { key:"cost", grp:"시작하기 전", jy:["startup"],
     to:"/tools/cost",  icon:"won",    name:"창업비 정리표",
    lead:"빠뜨리기 쉬운 항목을 늘어놓고, 받으신 견적을 적으면 합계가 나옵니다",
    ask:"항목별로 받은 견적", out:"합계 · 아직 안 받은 칸", time:"5분",
    side:"start",

    rel:[{cat:"interior"},{cat:"equip"},{cat:"furniture"},{cat:"it"},{cat:"admin"}] },
  { key:"fixed", grp:"얼마를 팔아야 하나", jy:["operation","startup"],
    to:"/tools/fixed", icon:"calendar", name:"월 고정비 계산",
    lead:"팔리든 안 팔리든 나가는 돈. 하루에 얼마를 벌어야 하는지까지",
    ask:"임차료 · 인건비 · 공과금", out:"월 고정비 · 하루치", time:"2분",
    side:"both",
    rel:[{cat:"admin",sub:"tax-agent"},{cat:"it"},{cat:"supply"},{cat:"clean"},
         {cat:"contract"}] },
  { key:"bep", grp:"얼마를 팔아야 하나", jy:["operation","startup"],
      to:"/tools/bep",   icon:"chart",  name:"손익분기 계산",
    lead:"고정비를 공헌이익률로 나눕니다. 본전이 되는 매출이 얼마인지",
    ask:"월 고정비 · 변동비 비율", out:"본전 매출 · 하루 매출", time:"3분",
    side:"both",
    rel:[{cat:"marketing"},{cat:"supply"},{cat:"admin",sub:"tax-agent"}] },
  { key:"labor", grp:"얼마가 남나", jy:["operation"],
    to:"/tools/labor", icon:"users",  name:"인건비율 계산",
    lead:"매출 대비 인건비. 사장 인건비를 넣을지는 사장님이 고르십니다",
    ask:"월 매출 · 인건비 합계", out:"인건비율 · 1인당 매출", time:"1분",
    side:"both",
    rel:[{cat:"staff"},{cat:"admin",sub:"labor-agent"}] },
  { key:"vs", grp:"시작하기 전", jy:["startup","acquisition"],
       to:"/tools/vs",    icon:"scale",  name:"신규 창업 vs 매장 인수",
    lead:"새로 만드는 것과 하던 가게를 받는 것. 들어가는 돈과 시간을 나란히",
    ask:"양쪽에 드는 돈 · 기간", out:"초기 비용 차이 · 회수 기준", time:"4분",
    side:"start",
    rel:[{cat:"store"},{cat:"transfer"},{cat:"asset"},{cat:"interior"}] },
  { key:"close", grp:"정리할 때", jy:["closing"],
    to:"/tools/close", icon:"listck", name:"폐업 체크리스트",
    lead:"순서대로 짚어 가며 빠뜨린 것을 찾습니다. 기한이 있는 것이 여럿입니다",
    ask:"해당하는 것 체크", out:"남은 것 · 기한 있는 것", time:"5분",
    side:"close",
    rel:[{cat:"demolish"},{cat:"restore"},{cat:"waste"},{cat:"tax"},
         {cat:"labor"},{cat:"contract"}] },

  { key:"target", grp:"얼마를 팔아야 하나", jy:["operation"],
    to:"/tools/target", icon:"target", name:"목표 매출 계산",
    lead:"가져가고 싶은 돈을 적으면 그러려면 얼마를 팔아야 하는지",
    ask:"목표 순이익 · 고정비 · 변동비율", out:"필요한 월 매출 · 하루 매출", time:"3분",
    side:"both",
    rel:[{cat:"marketing"},{cat:"supply"},{cat:"admin",sub:"tax-agent"}] },

  { key:"premium", grp:"시작하기 전", jy:["acquisition","startup"],
    to:"/tools/premium", icon:"handover", name:"권리금 따져보기",
    lead:"달라는 권리금이 몇 달이면 돌아오는지. 시설값과 영업권을 갈라 봅니다",
    ask:"권리금 · 시설값 · 월 순이익", out:"회수 개월 · 영업권 몫", time:"2분",
    side:"start",
    rel:[{cat:"transfer"},{cat:"store"},{cat:"asset"},{cat:"law"}] },

  { key:"rent", grp:"시작하기 전", jy:["startup","operation"],
    to:"/tools/rent", icon:"building", name:"임대료 비율 계산",
    lead:"매출에서 임차료가 몇 %인지. 권리금까지 달마다 나눠 보면 더 큽니다",
    ask:"월 매출 · 월세 · 관리비", out:"임차료 비율 · 권리금 포함 비율", time:"2분",
    side:"both",
    rel:[{cat:"store"},{cat:"area"},{cat:"law"}] },

  { key:"hire", grp:"얼마가 남나", jy:["operation","startup"],
    to:"/tools/hire", icon:"coins", name:"직원 고용비용 계산",
    lead:"급여만이 아닙니다. 4대보험 · 퇴직충당 · 식대까지 더한 실제 비용",
    ask:"급여 · 사람 수 · 사업주 부담률", out:"1인 월 비용 · 전체 월 · 1년", time:"3분",
    side:"both",
    rel:[{cat:"staff"},{cat:"admin",sub:"labor-agent"}] },

  { key:"delivery", grp:"얼마가 남나", jy:["operation"],
    to:"/tools/delivery", icon:"truck", name:"배달 한 건 남는 돈",
    lead:"중개 · 결제 수수료와 배달비 · 포장재 · 재료비를 빼면 얼마가 남는지",
    ask:"판매가 · 수수료율 · 배달비", out:"한 건 남는 돈 · 남는 비율", time:"3분",
    side:"both",
    rel:[{cat:"supply"},{cat:"marketing"},{cat:"it",sub:"pos"}] },

  { key:"margin", grp:"얼마가 남나", jy:["operation"],
    to:"/tools/margin", icon:"percent", name:"원가율 · 마진 계산",
    lead:"판매가와 원가를 넣으면 원가율과 한 개 남는 돈이 같이 나옵니다",
    ask:"판매가 · 재료비 · 그 외 변동비", out:"원가율 · 개당 남는 돈", time:"1분",
    side:"both",
    rel:[{cat:"supply"},{cat:"marketing"}] },

  { key:"closecost", grp:"정리할 때", jy:["closing"],
    to:"/tools/closecost", icon:"wallet", name:"폐업 예상비용",
    lead:"나가는 돈과 돌아오는 돈을 같이 놓습니다. 중요한 것은 그 차액입니다",
    ask:"철거 · 원상복구 · 위약금 / 보증금 · 시설 매각", out:"실제 부담 또는 남는 돈", time:"5분",
    side:"close",
    rel:[{cat:"demolish"},{cat:"restore"},{cat:"waste"},{cat:"asset"},
         {cat:"tax"},{cat:"support"}] }
];

window.AM_TARGET = [
  { key:"profit", name:"목표 월 순이익", unit:"만원", group:"가져가고 싶은 돈",
    hint:"사장님이 매달 손에 쥐고 싶은 금액" },
  { key:"fixed",  name:"월 고정비",      unit:"만원", group:"지금 조건",
    hint:"임차료 · 인건비 · 공과금 · 리스 · 이자까지 합친 값" },
  { key:"varpct", name:"팔릴 때마다 나가는 비율", unit:"%", group:"지금 조건",
    hint:"재료비 + 카드 · 배달앱 수수료 + 포장재. 매출 대비 %" },
  { key:"days",   name:"월 영업일수", unit:"일",  group:"나눠 보기",
    hint:"쉬는 날을 뺀 실제 영업일" },
  { key:"ticket", name:"객단가",      unit:"원",  group:"나눠 보기",
    hint:"손님 한 분이 평균 얼마를 쓰시는지" }
];

window.AM_PREMIUM = [
  { key:"premium", name:"달라는 권리금", unit:"만원", group:"금액" },
  { key:"equip",   name:"그중 시설 · 집기 값", unit:"만원", group:"금액",
    hint:"장비 · 가구 · 인테리어처럼 눈에 보이는 것. 중고 시세로 보세요" },
  { key:"profit",  name:"월 순이익", unit:"만원", group:"받은 값",
    hint:"넘기시는 분이 적어 주신 값입니다. 확인은 사장님 몫입니다" },
  { key:"months",  name:"남은 임대차 기간", unit:"개월", group:"받은 값",
    hint:"계약서에 남아 있는 기간. 갱신 여부는 건물주가 정합니다" }
];

window.AM_RENT = [
  { key:"sales",   name:"월 매출", unit:"만원", group:"매출",
    hint:"부가세를 뺀 매출로 적으시면 비율이 더 정확합니다" },
  { key:"rent",    name:"월세",   unit:"만원", group:"달마다 나가는 것" },
  { key:"mgmt",    name:"관리비", unit:"만원", group:"달마다 나가는 것" },
  { key:"premium", name:"권리금", unit:"만원", group:"한 번에 낸 것",
    hint:"있으면. 아래 개월로 나눠 달마다 얼마인지 같이 봅니다" },
  { key:"deposit", name:"보증금", unit:"만원", group:"한 번에 낸 것",
    hint:"돌려받는 돈이라 비용에 안 더합니다 — 얼마가 묶여 있는지만 냅니다" },
  { key:"months",  name:"앞으로 영업할 개월", unit:"개월", group:"한 번에 낸 것",
    hint:"권리금을 나눠 보려면 적으세요" }
];

window.AM_HIRE = [
  { key:"wage",   name:"월 급여", unit:"만원", group:"한 사람 기준",
    hint:"세전 금액" },
  { key:"insPct", name:"사업주 4대보험 부담률", unit:"%", group:"한 사람 기준",
    hint:"건강 · 연금 · 고용 · 산재의 사업주 몫 합계. 국민건강보험공단 모의계산에서 확인하실 수 있습니다" },
  { key:"meal",   name:"식대 · 교통비", unit:"만원", group:"한 사람 기준" },
  { key:"etc",    name:"그 외 (유니폼 · 교육 · 건강검진 등)", unit:"만원", group:"한 사람 기준" },
  { key:"heads",  name:"같은 조건으로 쓰는 사람 수", unit:"명", group:"몇 명" }
];

window.AM_DELIVERY = [
  { key:"price",   name:"메뉴 판매가", unit:"원", group:"받는 돈",
    hint:"배달앱에 올린 값. 부가세를 뺀 값으로 적으시면 더 정확합니다" },
  { key:"feePct",  name:"중개 수수료율", unit:"%", group:"비율로 빠지는 것",
    hint:"계약서에 적힌 값을 그대로" },
  { key:"payPct",  name:"결제 수수료율", unit:"%", group:"비율로 빠지는 것" },
  { key:"deliver", name:"배달비 중 가게 부담", unit:"원", group:"건마다 빠지는 것" },
  { key:"pack",    name:"포장재 · 용기", unit:"원", group:"건마다 빠지는 것" },
  { key:"food",    name:"재료비", unit:"원", group:"건마다 빠지는 것" },
  { key:"ad",      name:"건당 광고비", unit:"원", group:"건마다 빠지는 것",
    hint:"월 광고비 ÷ 월 주문 수. 모르시면 비워 두세요" }
];

window.AM_MARGIN = [
  { key:"price", name:"판매가",        unit:"원", group:"한 개 기준" },
  { key:"cost",  name:"재료비 · 매입가", unit:"원", group:"한 개 기준" },
  { key:"etc",   name:"그 외 변동비",   unit:"원", group:"한 개 기준",
    hint:"포장재 · 수수료처럼 한 개 팔 때마다 나가는 것" },
  { key:"qty",   name:"한 달 판매 수량", unit:"개", group:"한 달로 보면",
    hint:"비워 두셔도 비율은 나옵니다" }
];

window.AM_CLOSE_OUT = [
  { key:"demolish",  name:"철거" },
  { key:"restore",   name:"원상복구" },
  { key:"waste",     name:"폐기물 처리" },
  { key:"penalty",   name:"위약금", hint:"인터넷 · POS · 렌탈처럼 약정이 남은 것" },
  { key:"severance", name:"퇴직금 · 미지급 임금" },
  { key:"tax",       name:"세금 · 기장료", hint:"부가세 · 종합소득세 · 폐업 신고 대행" },
  { key:"etc",       name:"그 외" }
];
window.AM_CLOSE_IN = [
  { key:"deposit",   name:"돌려받는 보증금", hint:"공제될 것을 빼고 적으세요" },
  { key:"premium",   name:"권리금 회수" },
  { key:"equipSell", name:"시설 · 집기 매각" },
  { key:"stockSell", name:"재고 처분" },
  { key:"support",   name:"폐업지원금", hint:"받기로 확정된 것만. 신청만 한 것은 빼세요" }
];

window.amToolsForCat = function(catKey){
  if(!catKey) return [];
  return (window.AM_TOOLS||[]).filter(function(t){
    return (t.rel||[]).some(function(r){ return r.cat === catKey; }); });
};

window.AM_TOOL_GROUPS = ["시작하기 전", "얼마를 팔아야 하나", "얼마가 남나", "정리할 때"];

window.amTool = function(key){
  var r = (window.AM_TOOLS||[]).filter(function(t){ return t.key === key; });
  return r.length ? r[0] : null;
};
window.amTools = function(side){
  return (window.AM_TOOLS||[]).filter(function(t){
    return !side || t.side === side || t.side === "both"; });
};

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

window.AM_FIXED = [
  { key:"rent",  name:"임차료",   hint:"월세 + 관리비" },
  { key:"labor", name:"인건비",   hint:"급여 · 4대보험 · 퇴직충당까지" },
  { key:"util",  name:"공과금",   hint:"전기 · 가스 · 수도 · 통신" },
  { key:"lease", name:"리스 · 할부", hint:"장비 · 차량 · POS 약정" },
  { key:"loan",  name:"대출 이자", hint:"원금은 빼고 이자만" },
  { key:"etc",   name:"그 외",    hint:"보험 · 정기구독 · 세무기장료" }
];

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

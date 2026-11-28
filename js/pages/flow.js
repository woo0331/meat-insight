/* ════════════════════════════════════════════════════════════════════
   창업 · 폐업 플로우 (§6 · §7 · §12 · §21 · §41)

   **이 파일이 Q2 · Q3 에 답합니다** —
   카페 창업자와 미용실 창업자에게 서로 다른 것이 보이고,
   음식점 폐업자와 헬스장 폐업자에게 서로 다른 것이 보입니다.

   갈라 주는 것은 두 곳입니다.
   ① `amCatsFor(업종, side)` — 분류의 **차례**가 업종마다 다릅니다
   ② `amCatItems(분류, 업종)` — 시설·장비의 **하위 분류**가 업종에서 옵니다

   ⚠️ **차례에서 빠진 분류를 잘라 내지 마세요.** `amCatsFor()` 가 뒤에
   붙여 줍니다 — 잘라 내면 그 업종 사장님에게는 그 기능이 아예 없는
   것이 됩니다.
   ⚠️ **업체를 여기서 나열하지 마세요.** 여기는 "무엇이 필요한지" 를
   고르는 자리이고, 업체는 분류를 고른 다음에 나옵니다 (§54).
   ════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════
   /startup — 창업 준비 전문관 (2026-10-17 지시서 §2)

   §2 가 화면을 **여섯 영역**으로 못박았습니다 —
     A 창업 준비 소개            `.stA`
     B 필요한 서비스 선택         `.stB`   ← 가장 중요한 영역 (§3)
     C 선택한 서비스 확인         `.pkb`   (PickBasket)
     D 창업 준비 체크리스트       `.stD`   (펼쳐야 보입니다)
     E 창업 가이드               `.stE`   (카드 넷 + 전체 보기)
     F 견적 신청                 `.stF`
   그 사이에 **업종별 자세히**(기존 보존)와 **함께 하시는 것들**(§11
   추천)이 들어갑니다.

   ⚠️⚠️ **구간 차례를 바꾸시려면 지시서를 먼저 고치세요.**
   `check.js` 의 "창업 준비가 §2 의 여섯 영역이다" 가 셉니다.

   ⚠️⚠️ **기존 기능을 지우지 않았습니다** (§15). 업종 고르개 열넷 ·
   로드맵 14걸음 · 패키지 · 분야 묶음 · 도움 셋 · 여정 넷이 전부
   그대로 있습니다 — **자리와 포장만** 바뀌었습니다.
   ⚠️ 그 가운데 `StepBand` · `JourneyBand` 는 **`/startup/:업종` 이
   그대로 들고 있습니다.** 여기서 내린 까닭은 §2 가 여섯 영역을
   적었고 §11 이 "동일한 설명을 여러 번 반복하지 않는다" 고 적었기
   때문입니다 — 지운 것이 아닙니다.
   ════════════════════════════════════════════════════════════════════ */
/* 창업 쪽 계산기 넷 — `tools.js` 의 **"시작하기 전"** 묶음 그대로
   입니다. ⚠️ 없는 key 를 적으면 `HallCalcBand()` 가 그 카드를 조용히
   뺍니다 (가짜 카드를 깔지 않습니다). */
var START_CALC      = ["cost", "vs", "premium", "rent"];
var START_CALC_TONE = { cost:"sv1", vs:"sv2", premium:"t13", rent:"sv3" };

function PageStartup(){
  var ind = nowQS("i");                      /* 업종을 고르셨으면 그 차례로 */
  var top = amPickTop("startup", ind), rest = amPickRest("startup", ind);
  /* §3 공통 여덟 — ① 소개 ② 서비스 선택 ③ 선택 확인 ④ 통합 견적 신청
     ⑤ 체크리스트 ⑥ 가이드 ⑦ 계산도구 ⑧ 다른 전문관.
     ⚠️⚠️ **⑦ 과 ⑧ 이 창업에만 없었습니다** (2026-10-18 전체 점검에서
     네 전문관을 나란히 재서 찾았습니다). 계산기는 창업 쪽이 제일
     많은데(창업비 · 신규vs인수 · 권리금 · 임대료 비율) 정작 그 화면에
     가는 길이 헤더와 푸터뿐이었고, 다른 전문관으로 넘어가는 줄이
     없어서 **운영 · 양도양수 · 폐업으로 가려면 헤더로 돌아가야**
     했습니다. 둘 다 이미 있던 공통 조각입니다 — 새로 만든 것이
     아닙니다. */
  /* 2026-11-23 모바일 동선 정리 — 업종별 준비 · 창업비 계산(StartSignature)을 머리 바로 아래로.
     진행 과정(5걸음 요약)과 체크리스트(자세한 걸음)를 대표 절차 한 곳(StartRoad · .stD)으로 합쳤고,
     핵심 서비스 카드 여덟(StartKxServices)은 바로 아래 고르기(STEP 01)와 같은 목록이라 내렸습니다
     (분야별 업체 화면으로 가는 길은 고르기 머리말의 '분야별 업체 보기' 한 줄이 받습니다).
     끝의 사진 CTA(StartKxCta)는 STEP 02 신청 구간과 같은 말이라 내렸습니다. */
  /* 2026-11-23 사진형 시안 — 큰 대표 사진 → 사진 핵심 서비스 4 → 사진 진행 절차 4 → 사진 배너 + 실제 도구
     → 업종별 준비 → (기존 고르기 · 신청) → 왜 · 하단 안내. 옛 StartSignature · StartRoad 는 지우지 않았습니다. */
  /* 2026-11-26 모바일 사용성 개편 — 머리 바로 아래가 '어떻게 시작하세요?'(StartSit) */
  /* 2026-11-26 모바일 시안 §2 — 신규/인수를 고르면 결과에 이미 창업비(또는 신규 vs 인수) 계산이 첫 행동으로 나옵니다.
     바로 아래 계산 띠가 같은 말을 되풀이하지 않게, 고른 뒤에는 띠를 뺍니다 (안 고르면 그대로). */
  var stPicked = ["new","take"].indexOf(nowQS("how")) >= 0;
  return StartTop(ind) + StartSit(ind) + StartKpSvc(ind) + StartKpRoad(ind) + (stPicked ? "" : StartKpCalc(ind)) + StartKpInd() +
    /* 2026-11-24 하단 간소화 — 고르개 · 바구니 · 묶음을 '여러 서비스 함께 고르기' 한 구역(기본 접힘)으로.
       옛 StartPickBand · PickBasket · PackPickBand · StartApplyBand 는 지우지 않았습니다 (되살리기는 이 줄).
       STEP 02(StartApplyBand)의 신청 · 접수 안내는 이 구역의 요약(고른 것이 있을 때)과 아래 KpCta 가 받습니다. */
    HallPickFold({ side:"start", path:(nowQS("p") === "pick" ? "pick" : ""),
      body:StartPickBody(top, rest, ind), packKeys:["open", "build"] }) +
    StartGuideBand(ind) +
    /* 2026-11-20 — 아래쪽 계산도구 구간(HallCalcBand)은 위 '창업 비용 계산기' 와 같은 소개의 반복이라
       내렸습니다. 그 구간에만 있던 신규vs인수 · 권리금 · 임대료 비율은 계산기 아래 '다른 계산도구' 줄로 옮겼습니다. */
    KpWhy({ photo:"insu-operations", title:"창업에 필요한 일을 한곳에서 찾고 비교하세요",
      items:KP_WHY }) +
    KpCta({ title:"창업 준비, 어디서부터 시작할지 고민되세요?",
      lead:"업종 · 지역 · 예산을 알려 주시면 필요한 서비스를 함께 정리해 드립니다.",
      second:{ href:"/faq", t:"자주 묻는 질문" }, quote:quoteTo({ side:"start", industry:ind || "" }), goName:"무료 상담 신청하기" }) +
    JourneyBand({ current:"startup", tone:"sec-white",
      title:"다른 것도 준비하고 계신가요?",
      lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." }) +
    PickBar();
}

/* ── 2026-11-23 사진형 시안 (창업) — 본문 조각 ────────────────────────────────────
   ⚠️ 사진은 권리 확인된 것만입니다. 없는 장면은 큰 아이콘 판(kpArt)이 같은 자리를 지킵니다.
   ⚠️ 시안의 카페는 연출 — 문구는 업종을 특정하지 않습니다. 금액 · 실적 · "검증된" 을 적지 않습니다. */
/* 네 페이지가 같이 쓰는 '왜' 셋 — 지금 이 사이트가 실제로 하는 일만 */
var KP_WHY = [
  { ic:"grid",   b:"필요한 서비스를 한곳에서", d:"분야별 서비스와 준비 정보를 한 화면에서 고릅니다" },
  { ic:"doc",    b:"한 번 적어 여러 서비스", d:"고르신 서비스를 한 번의 신청으로 함께 보냅니다" },
  { ic:"shield", b:"연락처는 정해진 뒤에", d:"업체가 정해지면 상호를 알려 드리고 그때 동의를 받습니다" }
];
function StartKpSvc(ind){
  var q = ind ? "&i=" + encodeURIComponent(ind) : "";
  var L = [
    kxSvc("area", "", "상권 · 입지 분석", "상권 · 유동인구 · 임대 조건 확인", "mappin", "kp-st-svc-area"),
    kxSvc("interior", "", "인테리어 · 설계", "매장 설계 · 시공 · 간판", "interior", "svc-interior"),
    kxSvc("equip", "", "주방 · 설비", "장비 · 집기 · 전기 · 급배수", "equip", "svc-equip"),
    kxSvc("admin", "", "인허가 · 행정", "영업 신고 · 사업자 등록 · 세무", "permit", "kp-st-svc-permit")
  ].filter(Boolean);
  if(q) L.forEach(function(x){ x.href += (x.href.indexOf("?") >= 0 ? "&" : "?") + q.slice(1); });
  return KpServices({ id:"st-svc", tone:"sec-white", kicker:"창업 핵심 서비스",
    title:"창업에 꼭 필요한 서비스", lead:"자리 찾기부터 공사 · 설비 · 인허가까지, 분야별로 살펴보세요.", items:L });
}
function StartKpRoad(ind){
  var n = amProcess("startup").length;
  return KpProcess({ id:"st-road-sec", cls:"stD", tone:"sec-ivory", kicker:"창업 진행 절차",
    title:"창업은 이렇게 진행됩니다",
    lead:"걸음마다 걸리는 기간과 비용은 업종 · 지역 · 규모에 따라 다릅니다.",
    moreHtml:FoldAll("st-road", "상세 진행 과정 보기 ("+n+"걸음)", "접기"),
    steps:[{ n:"조건 확인", d:"업종 · 지역 · 예산을 정리하고 자리를 고릅니다", ph:"kp-st-pro-check", ia:"mappin" },
           { n:"설계 · 견적", d:"인테리어 · 설비 계획을 세우고 견적을 받아 봅니다", ph:"kp-st-pro-design", ia:"calc" },
           { n:"시공 · 설비", d:"공사 · 장비 설치 · 인허가를 진행합니다", ph:"hero-start", ia:"interior" },
           { n:"오픈 준비", d:"POS · 재료 · 홍보 · 직원을 맞추고 문을 엽니다", ph:"home-startup", ia:"store" }],
    after:'<div class="is-fold-all kp-fold" id="st-road">'+ProcessBand({ key:"startup", bare:true, industry:ind || "" })+'</div>' });
}
function StartKpCalc(ind){
  var q = ind ? "?i=" + encodeURIComponent(ind) : "";
  return KpBanner({ id:"st-calc", kicker:"창업 비용 계산기", photo:"insu-hero",
    title:"창업 비용, 미리 따져 보세요",
    lead:"빠뜨리기 쉬운 비용 항목을 늘어놓고, 받으신 견적을 적으면 합계를 보여 드립니다. 적으신 값은 저장하지 않습니다.",
    btns:[{ href:"/tools/cost" + q, t:"창업 비용 계산하기", ic:"calc" }, { href:"/tools/vs", t:"신규 vs 인수 비교" }],
    note:"계산 결과는 참고값입니다 — 실제 비용은 업체 견적과 계약 조건에 따라 다릅니다.",
    card:{ title:"이런 항목을 함께 봅니다", list:["보증금 · 권리금 · 중개수수료", "인테리어 · 시공 · 간판", "전기 증설 · 급배수 · 소방", "장비 · 집기 · 운영 예비비"] } });
}
function StartKpInd(){
  var pick = ["restaurant", "cafe", "retail", "beauty"];
  var L = pick.map(function(k){ var x = typeof amIndustry === "function" ? amIndustry(k) : null; if(!x) return null;
    /* 2026-11-25 — 업종 사진(AM_PIC_IND). 맞는 사진이 없는 업종은 같은 자리 · 같은 크기의 월넛 면 */
    return { n:x.name, d:x.lead || "", href:"/startup/" + encodeURIComponent(k), ic:x.icon || "store", ph:picKey("ind", k), go:"준비 순서 보기" }; }).filter(Boolean);
  return KpCards({ id:"st-ig", tone:"sec-white", kicker:"업종별 창업 가이드",
    title:"업종별 창업 준비 과정", lead:"업종마다 준비 순서와 필요한 장비가 다릅니다.", items:L,
    after:'<div class="kp-all">'+FoldAll("st-ind", "전체 업종 "+(window.AM_INDUSTRIES||[]).length+"개 보기", "접기")+
      '<div class="is-fold-all hsg-all-l" id="st-ind">'+IndustryGroupChips("/startup", nowQS("g"))+IndustryGrid("/startup","", nowQS("g"))+'</div></div>',
    note:"업종을 고르시면 그 업종에 흔히 필요한 서비스부터 앞에 놓습니다 — 조회수나 신청 건수 같은 통계가 아니라 저희가 추려 둔 차례입니다." });
}

/* ── 2026-11-23 시안 01_startup — 대표 절차 (KxProcess + 자세한 체크리스트 접힘) ─────────────
   ⚠️ 핵심 서비스 카드 · 사진 CTA 는 모바일 동선 정리로 내렸습니다 (위 PageStartup 주석). */
function StartRoad(ind){
  var n = amProcess("startup").length;
  return KxProcess({ tone:"sec-ivory", cls:"stD", id:"st-road-sec", photo:"home-startup", kicker:"창업 준비 순서",
    title:"상담부터 오픈까지, 이렇게 진행됩니다",
    steps:[["상담", "업종 · 지역 · 예산을 알려 주시면 필요한 일을 함께 정리합니다"],
           ["입지 선정", "상권 · 임대 조건을 확인하고 자리를 고릅니다"],
           ["자금 · 설계", "예산을 나누고 인테리어 · 설비 계획을 세웁니다"],
           ["시공 · 준비", "공사 · 장비 · 인허가 · 직원 준비를 진행합니다"],
           ["오픈", "POS · 식자재 · 홍보를 맞추고 문을 엽니다"]],
    foot:"걸음마다 걸리는 기간과 비용은 업종 · 지역 · 규모에 따라 다릅니다.",
    /* ⚠️ 자세한 체크리스트(StartChecklist 의 ProcessBand)를 여기 접어 둡니다 — 걸음마다 꼭 확인할 것 · 읽을 글 */
    more:'<div class="kx-more">'+FoldAll("st-road", "자세한 체크리스트 "+n+"걸음 보기", "접기")+
      '<div class="is-fold-all" id="st-road">'+ProcessBand({ key:"startup", bare:true, industry:ind || "" })+'</div></div>' });
}

/* ── A. 창업 준비 소개 (§2-A) ─────────────────────────────────────
   > "간단한 제목 · 한 줄 설명 · 바로 서비스 선택으로 이동하는 버튼 ·
   >  무엇을 선택해야 할지 모르는 고객을 위한 도움 요청."
   > "긴 브랜드 소개와 불필요한 대형 배너는 제거한다."

   ⚠️ 단추 둘 다 **실제로 갑니다** — 하나는 바로 아래 고르개로,
   하나는 신청 화면으로. §9-2 대로 **무엇이 일어나는지**를 적습니다
   ("진행하기" 가 아닙니다).
   ⚠️⚠️ 두 번째 단추는 **빈손으로 가도 되는 길**입니다. 무엇이
   필요한지 모르시는 분께 "먼저 고르고 오세요" 라고 하면 거기서
   닫습니다 — 상황만 적으시면 저희가 찾아 드립니다. */
function StartIntro(ind){
  var indOk = !!(ind && typeof amIndustry === "function" && amIndustry(ind));
  var indN  = indOk ? amIndustryName(ind) : "";
  /* 2026-11-18 카테고리 리뉴얼 — 전문관 머리(HallHero) + 계산 · 업종 진입 (StartSignature).
     ⚠️ 주 단추는 견적 접수 상태를 따릅니다 (닫힘이면 접수 안내). 보조 단추는 바로 아래 고르개. */
  return HallHero({
    /* 2026-11-20 — 출처가 확인되지 않은 hero-startup 사진 대신 자체 일러스트(아이디어 → 매장 오픈) */
    sit:true, side:"start", photo:"insu-startup", /* 2026-11-21 ZIP 01_startup (옛 자체 일러스트 hhFlowArt 는 지우지 않았습니다) */
    /* 2026-11-23 4개 카테고리 시안 — 머리말 · 제목. ⚠️ 브랜드 이름과 조사는 손으로 적지 않습니다 (koWith) */
    kicker:"창업 준비 서비스",
    h1raw:"성공하는 창업,<br><em>"+esc(ftWith(amBrand(), "와과"))+" 함께</em><br>시작하세요.",
    /* 2026-11-19 — 설명이 **접수 상태를 따릅니다.** 닫혀 있으면 "한 번에 신청" 을 약속하지 않고
       지금 되는 일(서비스 · 준비 정보 확인)을 말합니다 (data-cta 짝 · 일반 견적 quote). */
    leadHtml:'<span data-cta="off">상권 분석부터 인테리어, 설비, 인허가까지 창업에 필요한 서비스와 준비 정보를 확인하세요.</span>'+
             '<span data-cta="on" hidden>상권 분석부터 인테리어, 설비, 인허가까지 창업에 필요한 서비스를 고르고 한 번에 신청하세요.</span>',
    quote: quoteTo({ side:"start", industry:ind || "" }),
    goName:"무료 상담 신청하기",
    /* 시안의 보조 단추 '창업 비용 계산하기' — 실제 창업비 정리표(/tools/cost)로 갑니다. 서비스 고르기는 바로 아래 칸이 받습니다 */
    second:'<a class="btn btn-lg hh-o" href="/tools/cost'+(indOk ? "?i=" + encodeURIComponent(ind) : "")+'">'+icon("calc",18)+' 창업 비용 계산하기</a>'+
      /* 2026-11-24 — 폰에서는 바로 가기 카드(업종별 준비 보기)를 접어 두어서 업종 고르기가 2,200px 아래에만 있었습니다.
         같은 목적지(아래 quick 의 둘째 칸 · #st-ig 또는 고르신 업종 화면)로 가는 한 줄을 단추 줄 안에 둡니다 —
         ⚠️ 폰 전용(.hh-mo)입니다. PC 는 바로 가기 카드가 같은 칸을 이미 내서, 두면 한 화면에 둘이 됩니다. */
      '<a class="btn btn-lg hh-o hh-mo" href="'+(indOk ? "/startup/" + encodeURIComponent(ind) : "#st-ig")+'">'+
        icon("seed",18)+' '+esc(indN ? indN + " 준비 보기" : "내 업종 준비 보기")+'</a>',
    /* 2026-11-19 — 첫 화면의 두 행동. 업종을 고르셨으면 **그 업종으로** 이어집니다
       (/tools/cost 는 ?i= 를 읽고, /startup/:업종 이 그 업종의 준비 순서입니다). */
    cardTitle:"무엇부터 해 볼까요?", qfirst:true,
    quick:[{ ic:"calc", b:"창업비 계산하기", d:"빠뜨리기 쉬운 비용 항목을 늘어놓고 받은 견적을 더해 봅니다",
             go:(indN ? indN + " 예산 따져 보기" : "예산 미리 따져 보기"),
             href:"/tools/cost" + (indOk ? "?i=" + encodeURIComponent(ind) : "") },
           { ic:"seed", b:"업종별 준비 보기", d:"업종마다 준비 순서 · 필요한 장비가 다릅니다",
             go:(indN ? indN + " 준비 순서 보기" : "업종 고르고 순서 보기"),
             href:(indOk ? "/startup/" + encodeURIComponent(ind) : "#st-ig") }]
  }); /* 2026-11-23 — 계산기 · 업종 진입(StartSignature)은 시안 차례대로 진행 과정 뒤로 옮겼습니다 (PageStartup) */
}

/* 창업 — 시안의 "창업 비용 계산기" + "업종별 창업 준비 과정".
   ⚠️⚠️ 계산기 진입은 **업종 하나만** 받습니다 — 창업비 정리표(/tools/cost)가 읽는 것이
   업종(?i=)뿐이라, 시안의 규모 · 지역 칸을 두면 받아 놓고 안 읽는 칸이 됩니다.
   ⚠️ 업종 카드는 사진이 아니라 아이콘입니다 (업종 사진 권리가 없습니다).
   ⚠️ "맞춤 추천" 은 인기 · 통계가 아니라 업종별로 추려 둔 차례입니다 (amPickTopIds). */
function StartSignature(ind){
  var L = (window.AM_INDUSTRIES || []).filter(function(x){ return x.key !== "etc"; }).slice(0, 6);
  return '<section class="sec sec-white hsg"><div class="w hsg-in">'+
    '<form class="hsg-calc" onsubmit="return stCalcGo(event)">'+
      '<h2>창업 비용 계산기</h2>'+
      /* 2026-11-20 — 정리표의 항목은 업종과 관계없이 같습니다 (AM_COST_GROUPS). 업종은 결과 아래
         '다음에 볼 준비 순서 · 업체 · 가이드' 를 그 업종으로 이어 주는 데 쓰입니다 — 열넷 + 기타 전부 됩니다.
         ⚠️ 업종 고르개는 이 화면 안에서 **한 값**(?i=)입니다 — 여기서 고르시면 아래 서비스 추천 순서도 같은 업종으로 바뀝니다. */
      '<p>빠뜨리기 쉬운 창업 비용 항목을 늘어놓고, 받으신 견적을 적으면 합계를 보여 드립니다. 항목은 업종과 관계없이 같고, 고르신 업종은 결과 아래 준비 순서 · 업체 · 가이드를 그 업종으로 이어 드립니다. 적으신 값은 저장하지 않습니다.</p>'+
      '<div class="f-r"><label for="st-calc-i">업종 <small>(모든 업종 선택 가능 · 서비스 추천 순서와 함께 쓰입니다)</small></label>'+IndustrySelect("st-calc-i", ind || "", "stIndSync(this.value)", "업종을 고르지 않음")+'</div>'+
      '<button class="btn btn-b btn-lg" type="submit">'+icon("calc",18)+' 창업비 정리표 열기</button>'+
      '<p class="hsg-tl"><span>다른 계산도구</span>'+
        '<a href="/tools/vs">새로 차리기 vs 인수</a><a href="/tools/premium">권리금 회수</a><a href="/tools/rent">임대료 비율</a></p>'+
    '</form>'+
    '<div class="hsg-ind" id="st-ig">'+
      /* 2026-11-19 공개 화면 완성도 §4 — "전체 업종 보기" 가 전에는 아래 **서비스 추천 고르개**(#st-indsel)로
         보냈습니다. 이름과 도착이 달랐고, 그 아래 "업종 고르기 (14개)" 구간이 **같은 목적**(업종별 준비 화면)을
         한 번 더 물었습니다. 지금은 이 자리에서 열넷을 펼칩니다 — 아래 구간은 내렸습니다(StartIndustryBand 는 그대로).
         ⚠️ id st-ind 는 그 구간의 것을 그대로 씁니다 (흐름 검사 · 밖으로 나간 동작이 그 이름을 봅니다). */
      '<div class="hsg-hd"><h2>업종별 창업 준비 과정</h2></div>'+
      '<ul class="hsg-ig">'+L.map(function(x){
        return '<li><a href="/startup/'+esc(x.key)+'"><span class="hsg-ii" aria-hidden="true">'+icon(x.icon || "store", 28)+'</span>'+
          '<b>'+esc(x.name)+'</b>'+icon("chev",16)+'</a></li>'; }).join("")+'</ul>'+
      FoldAll("st-ind", "전체 업종 "+(window.AM_INDUSTRIES||[]).length+"개 보기", "접기")+
      '<div class="is-fold-all hsg-all-l" id="st-ind">'+
        IndustryGroupChips("/startup", nowQS("g"))+
        IndustryGrid("/startup","", nowQS("g"))+
      '</div>'+
      '<p class="hsg-note">업종을 고르시면 그 업종에 흔히 필요한 서비스부터 앞에 놓습니다 — 조회수나 신청 건수 같은 통계가 아니라 저희가 추려 둔 차례입니다.</p>'+
    '</div>'+
  '</div></section>';
}
/* 계산기 업종 = 서비스 추천 업종 — 같은 값(?i=) 하나로 잇습니다 (보던 자리는 지킵니다) */
window.stIndSync = function(v){
  go("/startup" + (v ? "?i=" + encodeURIComponent(v) : ""), { keepScroll:true });
};
window.stCalcGo = function(e){
  if(e && e.preventDefault) e.preventDefault();
  var v = (document.getElementById("st-calc-i") || {}).value || "";
  go("/tools/cost" + (v ? "?i=" + encodeURIComponent(v) : ""));
  return false;
};

/* ── B. 필요한 서비스 선택 (§2-B · §3) ───────────────────────────
   > "기본적으로 대표 서비스 6개를 큰 카드로 보여준다. 그 아래
   >  '전체 서비스 보기' 버튼을 배치한다. 전체 서비스 보기에는 기존
   >  DB에 등록된 창업 관련 서비스를 모두 포함한다."

   ⚠️⚠️ **여섯으로 제한하지 않았습니다.** 접어 둔 곳에 창업 쪽 분류가
   **빠짐없이** 들어 있고, 개수는 그 자리에서 센 값입니다 (손으로
   적으면 분류를 늘릴 때 어긋납니다).
   ⚠️ 업종을 고르셨으면 **그 업종 차례**로 나옵니다 — 이 저장소에서
   업종이 갈리는 두 자리 가운데 하나(`amCatsFor()`)입니다. */
function StartPickBand(top, rest, ind){
  /* ⚠️⚠️ **업종은 선택사항입니다** (PART 4-3). 안 고르셔도 서비스
     고르기와 견적 신청이 그대로 됩니다 — 고르면 **그 업종에 흔히
     필요한 것부터** 앞에 섭니다 (PART 4-4).
     ⚠️⚠️ **"인기" · "많이 찾는" 이라고 쓰지 마세요.** 조회 · 클릭 ·
     신청을 하나도 모으지 않아 무엇이 많이 나가는지 **우리는
     모릅니다.** "AI 가 분석했습니다" 도 아닙니다 — 저희가 추려 둔
     순서이고 화면이 그대로 적습니다 (절대 규칙 5). */
  var on   = (typeof amPickIndOn === "function") && amPickIndOn("startup", ind);
  var indN = (ind && typeof amIndustryName === "function") ? amIndustryName(ind) : "";
  return '<section class="sec sec-white stB" id="pick"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">STEP 01</p>'+
      '<h2>'+(on && indN
        ? esc(indN)+' 창업에 필요한 것'
        : '필요한 서비스를 골라 주세요')+'</h2>'+
      '<p><b>여러 개를 함께 고르실 수 있습니다.</b> 고르신 것은 아래에 모입니다. '+
        ctaPair("quote", "한 번만 적어 보내시면 됩니다.",
          "지금은 견적 접수를 받지 않아, 고르신 서비스는 이 기기의 브라우저에 남습니다.")+'</p>'+
      /* 2026-11-23 — 내린 핵심 서비스 카드 여덟의 '자세히 보기' 가 이 한 줄로 옵니다 */
      '<a class="sec-more" href="/providers'+(ind ? "?i=" + encodeURIComponent(ind) : "")+'">분야별 업체 · 정보 보기'+icon("chev",15)+'</a>'+
    '</div>'+
    /* ── 업종 고르개 (PART 4-2 ②) ───────────────────────────────
       ⚠️ 칩 열넷을 깔지 않았습니다 — 폰에서 화면 하나를 먹고 그만큼
       서비스 카드가 밀려납니다. 고르개 한 칸이고, 네이티브 피커라
       어르신도 익숙합니다 (PART 14-2). */
    '<div class="stB-ind">'+
      '<label class="stB-ind-l" for="st-indsel">서비스 추천 순서 — 업종을 고르시면 그 업종에 '+
        '흔히 필요한 것부터 보여 드립니다</label>'+
      '<div class="stB-ind-r">'+
        /* ⚠️⚠️ **id 를 `st-ind` 로 짓지 마세요.** 바로 아래 "업종별로
           자세히" 의 펼침 목록이 그 id 를 쓰고 있어서, 겹치면
           `getElementById()` 가 **먼저 나오는 이 고르개**를 집고
           펼침 단추의 `aria-controls` 도 엉뚱한 데를 가리킵니다 —
           실제로 그렇게 만들었다가 흐름 검사가 잡았습니다. 이
           저장소가 `.lg` · `.how-g` · `.pkg-*` 로 겪은 **클래스
           이름 겹침과 같은 사고**이고, id 는 더 조용합니다. */
        IndustrySelect("st-indsel", ind || "", "startIndGo()", "업종을 고르지 않음")+
        '<span class="stB-ind-n">선택하지 않아도 됩니다</span>'+
      '</div>'+
    '</div>'+
    (on && indN
      ? '<p class="stB-why">'+esc(indN)+' 창업에 흔히 필요한 순서로 '+
        '저희가 추려 둔 것입니다. <b>이용 통계가 아닙니다</b> — 필요 없는 '+
        '것은 그냥 끄시고, 빠진 것은 아래 전체 서비스에서 더 고르시면 됩니다.</p>'
      : "")+
    /* ── 찾기 칸 (PART 3 통일) ─────────────────────────────────
       ⚠️⚠️ **창업에만 없었습니다.** 운영 · 폐업 · 양도양수는
       `PickGroupBand()` 안에 실제로 도는 찾기 칸이 있는데 창업만
       빠져 있어서, 네 전문관의 흐름이 서로 달랐습니다 (PART 3 이
       "레이아웃과 흐름을 통일" 이라고 적은 자리입니다).
       ⚠️ `#pkb-find` 는 `pickFind()` 가 보는 울타리입니다 — 이름을
       바꾸면 검색이 조용히 아무것도 못 찾습니다. */
    /* ── 두 칸 (2026-10-20 시안 2) — 왼쪽 고르기 · 오른쪽 요약 */
    '<div class="pks-g"><div class="pks-main">'+
    '<div id="pkb-find">'+
      '<div class="pkf">'+
        '<label class="pkf-l" for="pkf-q">찾으시는 것을 적어 보세요</label>'+
        '<span class="pkf-w">'+icon("search",18)+
          '<input class="pkf-i" id="pkf-q" type="search" autocomplete="off"'+
            ' placeholder="예: 인테리어, 간판, 세금, 포스"'+
            ' oninput="pickFind(this.value)">'+
        '</span>'+
        '<p class="pkf-r" id="pkb-r" hidden></p>'+
      '</div>'+
    /* ── 빠른 선택 여섯 (2026-10-24) ──────────────────
       ⚠⚠ **창업만 이 줄이 없었습니다.** 재 보니 운영 82칸 · 폐업
       74칸 · 양도양수 52칸은 **하위까지** 고를 수 있는데 창업은
       **분류 열두 칸뿐**이라, "간판" · "세금" · "포스" 를 찾아 오신
       분이 찾기로는 걸리는데 **고를 칸이 없어서** 분류를 눌러야
       했습니다 (PART 3 "네 전문관의 흐름을 통일").
       ⚠️ 생김새 · 클래스는 `PickGroupBand()` 와 **같습니다** — 다른
       이름을 주면 네 전문관이 또 서로 달라집니다.
       ⚠⚠ **분류 대표 여섯에서 빼지 않습니다.** 같은 칸이 두 자리에
       보여도 `pickPaint()` 가 화면의 **모든 `[data-pick]`** 을
       맞춰서 둘이 같이 켜지고 바구니에는 한 번만 들어갑니다.
       ⚠️ 없으면 줄째 뺍니다 (절대 규칙 2). */
    (function(){
      var q = (typeof amPickQuick === "function") ? amPickQuick("startup") : [];
      return q.length
        ? '<div class="pkq">'+
            '<p class="pkq-l">필요한 것이 정해져 있으시면 여기서 '+
              '바로 고르세요</p>'+
            '<ul class="pk-g pk-g-q">'+q.map(PickCard).join("")+'</ul>'+
            '<p class="pkq-n">여기 없는 것은 아래 분야별 목록에 '+
              '전부 있습니다.</p>'+
          '</div>'
        : "";
    })()+
    '<ul class="pk-g">'+top.map(PickCard).join("")+'</ul>'+
    (rest.length
      ? FoldAll("st-rest", "전체 서비스 보기 ("+rest.length+"개 더)", "접기")+
        '<ul class="pk-g pk-g2 is-fold-all" id="st-rest">'+rest.map(PickCard).join("")+'</ul>'
      : "")+
    '</div>'+
    '</div>'+PickAside("start")+'</div>'+
  '</div></section>';
}

/* 2026-11-24 — 창업 고르개 몸통만 (업종 고르개 · 찾기 · 빠른 선택 · 대표 · 전체 보기).
   StartPickBand 와 하단 '여러 서비스 함께 고르기'(HallPickFold)가 같이 씁니다. 오른쪽 요약 패널은 뺍니다. */
function StartPickBody(top, rest, ind){
  var on   = (typeof amPickIndOn === "function") && amPickIndOn("startup", ind);
  var indN = (ind && typeof amIndustryName === "function") ? amIndustryName(ind) : "";
  return ''+
    '<div class="stB-ind">'+
      '<label class="stB-ind-l" for="st-indsel">서비스 추천 순서 — 업종을 고르시면 그 업종에 '+
        '흔히 필요한 것부터 보여 드립니다</label>'+
      '<div class="stB-ind-r">'+
        /* ⚠️⚠️ **id 를 `st-ind` 로 짓지 마세요.** 바로 아래 "업종별로
           자세히" 의 펼침 목록이 그 id 를 쓰고 있어서, 겹치면
           `getElementById()` 가 **먼저 나오는 이 고르개**를 집고
           펼침 단추의 `aria-controls` 도 엉뚱한 데를 가리킵니다 —
           실제로 그렇게 만들었다가 흐름 검사가 잡았습니다. 이
           저장소가 `.lg` · `.how-g` · `.pkg-*` 로 겪은 **클래스
           이름 겹침과 같은 사고**이고, id 는 더 조용합니다. */
        IndustrySelect("st-indsel", ind || "", "startIndGo()", "업종을 고르지 않음")+
        '<span class="stB-ind-n">선택하지 않아도 됩니다</span>'+
      '</div>'+
    '</div>'+
    (on && indN
      ? '<p class="stB-why">'+esc(indN)+' 창업에 흔히 필요한 순서로 '+
        '저희가 추려 둔 것입니다. <b>이용 통계가 아닙니다</b> — 필요 없는 '+
        '것은 그냥 끄시고, 빠진 것은 아래 전체 서비스에서 더 고르시면 됩니다.</p>'
      : "")+
    /* ── 찾기 칸 (PART 3 통일) ─────────────────────────────────
       ⚠️⚠️ **창업에만 없었습니다.** 운영 · 폐업 · 양도양수는
       `PickGroupBand()` 안에 실제로 도는 찾기 칸이 있는데 창업만
       빠져 있어서, 네 전문관의 흐름이 서로 달랐습니다 (PART 3 이
       "레이아웃과 흐름을 통일" 이라고 적은 자리입니다).
       ⚠️ `#pkb-find` 는 `pickFind()` 가 보는 울타리입니다 — 이름을
       바꾸면 검색이 조용히 아무것도 못 찾습니다. */
    /* ── 두 칸 (2026-10-20 시안 2) — 왼쪽 고르기 · 오른쪽 요약 */
    '<div class="pks-g"><div class="pks-main">'+
    '<div id="pkb-find">'+
      '<div class="pkf">'+
        '<label class="pkf-l" for="pkf-q">찾으시는 것을 적어 보세요</label>'+
        '<span class="pkf-w">'+icon("search",18)+
          '<input class="pkf-i" id="pkf-q" type="search" autocomplete="off"'+
            ' placeholder="예: 인테리어, 간판, 세금, 포스"'+
            ' oninput="pickFind(this.value)">'+
        '</span>'+
        '<p class="pkf-r" id="pkb-r" hidden></p>'+
      '</div>'+
    /* ── 빠른 선택 여섯 (2026-10-24) ──────────────────
       ⚠⚠ **창업만 이 줄이 없었습니다.** 재 보니 운영 82칸 · 폐업
       74칸 · 양도양수 52칸은 **하위까지** 고를 수 있는데 창업은
       **분류 열두 칸뿐**이라, "간판" · "세금" · "포스" 를 찾아 오신
       분이 찾기로는 걸리는데 **고를 칸이 없어서** 분류를 눌러야
       했습니다 (PART 3 "네 전문관의 흐름을 통일").
       ⚠️ 생김새 · 클래스는 `PickGroupBand()` 와 **같습니다** — 다른
       이름을 주면 네 전문관이 또 서로 달라집니다.
       ⚠⚠ **분류 대표 여섯에서 빼지 않습니다.** 같은 칸이 두 자리에
       보여도 `pickPaint()` 가 화면의 **모든 `[data-pick]`** 을
       맞춰서 둘이 같이 켜지고 바구니에는 한 번만 들어갑니다.
       ⚠️ 없으면 줄째 뺍니다 (절대 규칙 2). */
    (function(){
      var q = (typeof amPickQuick === "function") ? amPickQuick("startup") : [];
      return q.length
        ? '<div class="pkq">'+
            '<p class="pkq-l">필요한 것이 정해져 있으시면 여기서 '+
              '바로 고르세요</p>'+
            '<ul class="pk-g pk-g-q">'+q.map(PickCard).join("")+'</ul>'+
            '<p class="pkq-n">여기 없는 것은 아래 분야별 목록에 '+
              '전부 있습니다.</p>'+
          '</div>'
        : "";
    })()+
    '<ul class="pk-g">'+top.map(PickCard).join("")+'</ul>'+
    (rest.length
      ? FoldAll("st-rest", "전체 서비스 보기 ("+rest.length+"개 더)", "접기")+
        '<ul class="pk-g pk-g2 is-fold-all" id="st-rest">'+rest.map(PickCard).join("")+'</ul>'
      : "")+
    '</div>'+
    '</div>';
}

/* 업종을 고르면 — ⚠️⚠️ **고르신 서비스를 지우지 않습니다.** 주소만
   바뀌고 `am.pick.v1` 은 그대로라, 업종을 바꿔 보셔도 바구니가
   비지 않습니다 (재서 확인했습니다).
   ⚠️⚠️ **스크롤을 지킵니다** (`keepScroll`). 맨 위로 올라가 버리면
   바로 아래가 무엇으로 바뀌었는지 못 보십니다 — 이 저장소가 메인
   업종 거르개에서 `data-keep` 으로 지켜 둔 그 규칙입니다. */
window.startIndGo = function(){
  var sel = document.getElementById("st-indsel");
  var v   = sel ? sel.value : "";
  go("/startup" + (v ? "?i=" + encodeURIComponent(v) : ""), { keepScroll:true });
};

/* ── 업종별로 자세히 (기존 보존 · §15) ────────────────────────────
   ⚠️⚠️ **지우면 `/startup/:업종` 열넷으로 가는 길이 없어집니다.**
   그 화면들은 색인되어 있고, 업종별 로드맵 · 장비 · 글이 전부
   거기 있습니다. §2 가 적지 않았다고 빼면 안 되는 자리입니다
   (§15 "기존 기능은 존재 여부를 확인하고 반드시 유지한다").
   ⚠️ 접어 둡니다 — 서비스 고르기가 주인공이고, 업종은 **더 보고
   싶은 분**이 누르는 자리입니다. */
function StartIndustryBand(){
  return '<section class="sec sec-ivory stI"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">업종별로 자세히</p>'+
      '<h2>업종이 정해지셨나요?</h2>'+
      '<p>업종을 고르시면 그 업종 창업의 준비 순서 · 필요한 장비 · '+
        '자주 막히는 것을 따로 보여 드립니다.</p>'+
    '</div>'+
    FoldAll("st-ind", "업종 고르기 ("+(window.AM_INDUSTRIES||[]).length+"개)", "접기")+
    '<div class="is-fold-all" id="st-ind">'+
      IndustryGroupChips("/startup", nowQS("g"))+
      IndustryGrid("/startup","", nowQS("g"))+
    '</div>'+
  '</div></section>';
}

/* ── D. 창업 준비 체크리스트 (§2-D) ───────────────────────────────
   > "기존 체크리스트 기능을 유지하되, 고객이 원하는 경우에만
   >  펼쳐보게 한다. 서비스 견적 신청과 체크리스트를 혼동시키지
   >  않는다."

   ⚠️⚠️ **로드맵 14걸음이 그 체크리스트입니다** (`AM_PROCESS.startup`).
   걸음마다 "꼭 확인할 것" 이 붙어 있고 열넷 전부 있습니다 — 여기
   새로 적으면 두 곳이 어긋납니다.
   ⚠️ 구간 머리말이 **"신청" 이라는 말을 쓰지 않습니다** — 지시서가
   혼동을 금지한 자리입니다. */
function StartChecklist(ind){
  var n = amProcess("startup").length;
  return '<section class="sec sec-white stD"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">창업 준비 체크리스트</p>'+
      '<h2>무엇부터 해야 하는지 보고 싶으신가요?</h2>'+
      '<p>'+n+'걸음입니다. 걸음마다 꼭 확인할 것과 읽어 두면 좋은 글이 '+
        '같이 있습니다. <b>여기는 읽는 자리이고 신청은 아래에서 합니다.</b></p>'+
    '</div>'+
    FoldAll("st-road", "준비 순서 "+n+"걸음 보기", "접기")+
    '<div class="is-fold-all" id="st-road">'+
      ProcessBand({ key:"startup", bare:true, industry:ind || "" })+
    '</div>'+
  '</div></section>';
}

/* ── E. 창업 가이드 (§2-E) ────────────────────────────────────────
   > "가이드는 카드 3~4개 정도만 먼저 노출하고 전체 보기로 연결한다.
   >  동일한 서비스 설명을 페이지 곳곳에 반복하지 않는다."
   ⚠️ 맞는 글이 없으면 **구간째 빠집니다** (절대 규칙 2) — `ReadBand`
   가 빈 목록에 `""` 를 돌려줍니다. */
function StartGuideBand(ind){
  return ReadBand({ side:"start", industry:ind || "", limit:4,
                    title:"창업 전에 알아 두면 좋은 것" });
}

/* ── F. 견적 신청 (§2-F) ──────────────────────────────────────────
   > "신청 버튼은 명확하고 크고 쉽게 찾을 수 있어야 한다."
   ⚠️⚠️ 단추 글씨에 **개수**가 들어갑니다 (§9-2) — `pickPaint()` 가
   고르실 때마다 고쳐 적습니다. 안 고치면 "고른 것과 넘어가는 것이
   다릅니다" 가 되고 그게 제일 나쁩니다.
   ⚠️ 하나도 안 고르셔도 **막지 않습니다** — 상황만 적으시는 분이
   있고, 그분을 막으면 거기서 닫습니다. */
function StartApplyBand(){
  var n = (typeof amPickCount === "function") ? amPickCount() : 0;
  return '<section class="sec sec-cream stF"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">STEP 02</p>'+
      /* 2026-11-19 — 접수가 닫혀 있으면 "적어 보내세요" 를 약속하지 않습니다 (data-cta 짝 · quote). */
      '<h2><span data-cta="on" hidden>고르셨으면 한 번만 적어 보내세요</span>'+
        '<span data-cta="off">고르신 서비스는 이 화면에 남아 있습니다</span></h2>'+
      '<p><span data-cta="on" hidden>같은 내용을 업체마다 다시 적지 않으셔도 됩니다. '+
        '지역과 연락처만 적어 주시면 서비스마다 맞는 업체가 있는지 '+
        '운영자가 확인합니다. 무료입니다.</span>'+
        '<span data-cta="off">지금은 견적 접수를 받지 않습니다. 고르신 서비스와 준비 정보는 '+
        '그대로 보실 수 있고, 접수 방법은 접수 안내에서 확인하실 수 있습니다.</span></p>'+
    '</div>'+
    '<div class="row-cta">'+
      '<a class="btn btn-b btn-lg" data-pick-go href="'+esc(amPickQuoteTo())+'">'+
        '<span>'+(n ? "선택한 "+n+"개 서비스 견적 신청하기" : "견적 신청하기")+
        '</span>'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-b btn-lg" href="/intake" data-cta="off">접수 안내 보기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/faq">자주 묻는 질문</a>'+
    '</div>'+
    /* ⚠️ 지킬 수 없는 약속을 적지 마세요 — 회신 시점은 업체가 정합니다 */
    '<p class="sec-note">'+icon("info",15)+
      ' 접수 뒤 담당자가 내용을 보고 연락드립니다. 회신 시점을 '+
      '약속드리지는 않습니다.</p>'+
  '</div></section>';
}

/* ── /startup/:industry — 그 업종의 창업 전부 ────────────────────── */
function PageStartupIndustry(ind){
  var cats = amCatsFor(ind.key, "start");
  var fcat = amFranchiseCat(ind.key);       /* 같은 key 면 그 분류로 보냅니다 */
  /* 2026-11-26 모바일 — 머리를 줄이고(pgh-m-sm · 폰에서 사진 · 설명 · 두 번째 단추 접음) 고르기 → 준비 순서 · 창업비 계산 → 묻는 것 넷 차례 */
  return PgHero({ cls:"pgh-m-sm",
    crumb: Crumb([["창업","/startup"],[ind.name]]),
    kicker:"START · " + ind.name,
    /* ⚠️ 2026-10-06 2차 §5 — 상황과 업종을 고르고 도착하는 **맞춤 결과
       화면**입니다. 머리말이 "무엇을 고르셨는지" 를 되읽어 주어야
       손님이 "내 자리에 왔다" 를 압니다. */
    h1raw:esc(ind.name)+" 창업을<br class=\"br-m\"> 준비하고 계시네요.",
    /* 2026-11-25 — 업종 사진 띠 (AM_PIC_IND · 없으면 띠를 안 그립니다) */
    photo:picKey("ind", ind.key),
    lead:"지금부터 필요한 순서입니다. 걸음마다 꼭 확인할 것과 맡길 곳을 같이 보여 드립니다.",
    cta:'<a class="btn btn-b btn-lg" href="'+esc(quoteTo({industry:ind.key,side:"start"}))+'">'+
        '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/stores?i='+encodeURIComponent(ind.key)+'">'+
        ind.name+' 점포 보기</a>'
  })+
  /* ⚠️⚠️ **순서가 맨 앞입니다** (2026-10-06 2차 §5 — "단순 카드 나열이
     아니라 실제 준비 순서가 되어야 한다"). 전에는 장비 구간이 먼저
     였는데, 그러면 "무엇부터 하나" 로 들어오신 분이 **물건 목록**을
     먼저 봅니다. 장비는 바로 아래에 그대로 둡니다 — 업종이 갈리는
     것을 보여 주는 자리라 지우지 않습니다 (§1 · §12). */
  StartWayBand(ind)+
  /* ⚠️⚠️ **2026-10-08 지시서 §13 STEP 02 · §15** — 같은 업종이어도
     **새로 만드는 분과 있던 가게를 받는 분은 순서가 다릅니다.** 전에는
     창업 화면이 신규 기준 하나뿐이라, 인수를 보고 계신 분은 상권부터
     다시 읽어야 했습니다. 지금은 위에서 고르시면 **이 순서가 통째로
     바뀝니다** (새 화면을 만들지 않고 AM_PROCESS 를 바꿔 끼웁니다).
     ⚠️ 고르신 것은 주소(?how=)에 실립니다 — 뒤로 가기 · 새로고침 ·
     링크 공유에 살아남습니다. */
  (startWay() === "take"
    ? ProcessBand({ key:"acq-in", kicker:"TAKE OVER PROCESS",
        title:ind.name+" 매장 인수, 무엇부터 하나요?",
        lead:amProcess("acq-in").length+"걸음입니다. 권리금과 시설이 같이 오는지, "+
             "임대차가 승계되는지가 금액을 가릅니다.",
        industry:ind.key, tone:"sec-gray", first:3, from:startFrom("acq-in"), cta:startCalcCta(ind),
        note:"매물에 적힌 평수 · 보증금 · 월세 · 권리금 · 매출은 올리신 "+
             "사장님이 적으신 값이고, 저희가 확인하거나 보증하는 값이 아닙니다." })
    : ProcessBand({ key:"startup", kicker:"STARTUP PROCESS",
        title:ind.name+" 창업, 무엇부터 하나요?",
        /* ⚠️ 걸음 수를 손으로 적지 마세요 — 열둘이던 때 적어 둔 "열두
           걸음" 이 열넷이 된 뒤에도 그대로 남아 있었습니다. 세는 값입니다. */
        lead:amProcess("startup").length+"걸음입니다. 걸음마다 "+ind.name+
             "에 맞는 업체 · 장비 · 글로 바로 넘어갑니다.",
        industry:ind.key, tone:"sec-gray", first:3, from:startFrom("startup"), cta:startCalcCta(ind) }))+
  /* 2026-10-09 PART 4 — 묻는 것 넷 (지역 · 예산 · 준비 단계 · 개업 시기)
     2026-11-26 — 준비 순서 **아래**로 옮겼습니다 (폰에서 다음 행동이 3화면 아래였습니다). 고르시면 위 순서가 그 걸음부터 바뀝니다. */
  StartAskBand(ind)+
  (ind.equip && ind.equip.length ? EquipBand(ind) : "")+
  StepBand(ind)+
  (fcat ? FranchiseHint(fcat, ind) : "")+
  BridgeFor(ind, "start")+
  ReadBand({ side:"start", industry:ind.key,
             title:"창업에서 자주 막히는 것" })+
  StartupHelpBand();
}

/* ── 어떻게 시작할 계획이세요? (2026-10-08 §13 STEP 02) ───────────
   ⚠️⚠️ **새 로드맵 데이터를 만들지 않았습니다.** 인수 쪽 여덟 걸음은
   `AM_PROCESS["acq-in"]` 에 **이미 있던 것**이고 `/transfer?t=in` 이
   같은 것을 씁니다 — 여기에 또 적으면 두 곳이 어긋납니다 (§22
   콘텐츠 중복 방지).
   ⚠️ 두 카드의 크기 · 무게가 같아야 합니다. 한쪽을 작게 만들면 그게
   "덜 중요한 것" 이라는 말입니다.
   ⚠️ 카드가 통째로 눌립니다 — 안에 또 링크를 넣지 마세요. */
function startWay(){ return nowQS("how") === "take" ? "take" : "new"; }
/* 2026-11-25 — 로드맵의 '지금 할 일' 은 준비 단계(?st=)를 따릅니다 (AM_START_STAGE 의 at · 1부터) */
function startFrom(key){
  var stg = window.amStartPick ? amStartPick("AM_START_STAGE", nowQS("st")) : null;
  return stg && stg.at && stg.at[key] ? Math.max(0, stg.at[key] - 1) : 0;
}
function startCalcCta(ind){
  return '<p class="pcs-cta"><a class="btn btn-b" href="/tools/cost?i='+encodeURIComponent(ind.key)+'">'+icon("calc",17)+' 창업비 계산하기</a>'+
    '<span>예산을 먼저 따져 보면 걸음마다 맡길 범위가 정해집니다.</span></p>';
}
var START_WAYS = [
  { k:"new",  ic:"seed",     n:"새로 창업하기", ph:"kp-cl-pro-quote",
    d:"자리를 찾고 공사부터 시작합니다", s:"상권 · 입지부터 영업 시작까지" },
  { k:"take", ic:"handover", n:"기존 매장 인수하기", ph:"kp-tr-pro-ready",
    d:"하던 가게를 받아 이어서 엽니다", s:"매장 탐색부터 인계까지" }
];
function StartWayBand(ind){
  var cur = startWay();
  var base = "/startup/" + ind.key;
  return '<section class="sec sec-white swt"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">어떻게 시작하세요?</p>'+
      '<h2>새로 만드는 것과 받는 것은 순서가 다릅니다</h2>'+
      '<p>고르시면 아래 준비 순서가 그에 맞게 바뀝니다.</p>'+
    '</div>'+
    '<div class="swt-g">'+START_WAYS.map(function(w){
      var on = (w.k === cur);
      /* ⚠️ 기본값(새로 창업)은 주소를 깨끗하게 둡니다 — 같은 내용이
         두 주소로 나가면 구글이 둘 다 무시합니다. */
      var to = (w.k === "new") ? base : (base + "?how=" + w.k);
      /* 2026-11-25 — 빈 점포 실측 / 기존 매장 인계 사진으로 가릅니다. 고른 쪽은 테두리 + '선택됨' 문구(색만으로 가르지 않습니다) */
      /* 2026-11-26 — 고르면 다시 그린 뒤 바로 아래 준비 순서(창업비 계산 포함)로 내려갑니다 */
      return '<a class="swt-c swt-pc'+(on ? " on" : "")+'" href="'+esc(to)+'" data-keep data-focus="sw-next"'+
        (on ? ' aria-current="true"' : '')+'>'+
        '<span class="swt-ph" aria-hidden="true">'+picBox(w.ph, w.ic, "(max-width:640px) 92vw, 360px")+
          (on ? '<em class="swt-on">'+icon("check",14)+' 선택됨</em>' : '')+'</span>'+
        '<span class="ic-t">'+icon(w.ic,26)+'</span>'+
        '<span class="swt-t"><b>'+esc(w.n)+'</b>'+
          '<i>'+esc(w.d)+'</i><em>'+esc(w.s)+'</em></span>'+
        '<span class="swt-k" aria-hidden="true">'+icon("arrow",18)+'</span></a>';
    }).join("")+'</div>'+
    (cur === "take"
      ? '<p class="sec-note">'+icon("info",15)+
        ' 인수하실 매장을 먼저 보시겠어요? '+
        '<a href="/stores?i='+encodeURIComponent(ind.key)+'">'+esc(ind.name)+
        ' 매장 매물</a> · <a href="/tools/vs">신규 vs 인수 비교</a></p>'
      : '')+
  '</div></section><span id="sw-next" tabindex="-1"></span>';
}

/* ── 조건 넷 — 지역 · 예산 · 준비 단계 · 개업 시기 (2026-10-09 PART 4)
   ══════════════════════════════════════════════════════════════════
   PART 4 가 창업 쪽에 여섯 가지를 물으라고 적었습니다. 업종(`/startup`)과
   신규 · 인수(`?how=`)는 이미 있고, 여기가 **나머지 넷**입니다.

   ⚠️⚠️ **아무것도 저장하지 않습니다.** 고르신 것은 주소에만 실립니다 —
   화면에 그렇게 적혀 있습니다. 지우지 마세요 (절대 규칙 5).
   ⚠️⚠️ **받아 놓고 안 읽는 칸이 아닙니다.** 넷 다 아래를 바꿉니다 —
   준비 단계는 **로드맵을 지금 걸음부터** 다시 내고, 나머지 셋은 견적
   요청 · 점포 보기에 그대로 실려 갑니다. `gu` · `withEquip` 이 적어
   받아 놓고 몇 달 죽어 있던 자리입니다.
   ⚠️ **비워 두신 칸을 추측하지 않습니다** — 안 고르시면 그 줄이 안
   나가고, 넷 다 비우셔도 화면은 그대로 돕니다. */
function startAskVals(){
  return { r:nowQS("r") || "", b:nowQS("b") || "",
           st:nowQS("st") || "", when:nowQS("when") || "" };
}
window.startAskGo = function(base){
  var v = {};
  ["r","b","st","when"].forEach(function(k){
    var e = document.getElementById("sask-" + k);
    v[k] = e ? e.value : "";
  });
  var q = [];
  /* ⚠️ 기본값(새로 창업)은 주소를 깨끗하게 둡니다 — 같은 내용이 두
     주소로 나가면 구글이 둘 다 무시합니다. 고르신 것만 싣습니다. */
  if(startWay() === "take") q.push("how=take");
  ["r","b","st","when"].forEach(function(k){
    if(v[k]) q.push(k + "=" + encodeURIComponent(v[k]));
  });
  go(base + (q.length ? "?" + q.join("&") : ""));
};
function startAskSel(id, list, cur, first){
  var L = (window[list] || []);
  return '<select class="sel" id="sask-'+esc(id)+'">'+
    '<option value="">'+esc(first)+'</option>'+
    L.map(function(x){
      return '<option value="'+esc(x.k)+'"'+(x.k === cur ? " selected" : "")+'>'+
        esc(x.n)+'</option>'; }).join("")+'</select>';
}
function StartAskBand(ind){
  var v = startAskVals(), base = "/startup/" + ind.key;
  return '<section class="sec sec-gray sask"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">조건을 좁히면</p>'+
      '<h2>지금 상황을 알려 주시면 순서를 맞춰 드립니다</h2>'+
      '<p>모르시는 것은 비워 두셔도 됩니다 — 비운 칸을 저희가 '+
        '추측하지 않습니다.</p>'+
    '</div>'+
    '<div class="sask-g">'+
      '<div class="f-r"><label for="sask-r">희망 지역</label>'+
        RegionSelect("sask-r", v.r, "", "지역 전체")+'</div>'+
      /* ⚠️ 딱지를 길게 적지 마세요 — `<select>` 안은 낱말 잘림 검사에도
         가로 스크롤 검사에도 안 걸립니다 (이 저장소에서 세 번 겪었습니다). */
      '<div class="f-r"><label for="sask-b">예산</label>'+
        startAskSel("b", "AM_START_BUD", v.b, "예산 전체")+'</div>'+
      '<div class="f-r"><label for="sask-st">준비 단계</label>'+
        startAskSel("st", "AM_START_STAGE", v.st, "단계 전체")+'</div>'+
      '<div class="f-r"><label for="sask-when">개업 시기</label>'+
        startAskSel("when", "AM_START_WHEN", v.when, "시기 전체")+'</div>'+
    '</div>'+
    '<p class="row-cta"><button type="button" class="btn btn-b btn-lg" '+
      'onclick="startAskGo(\'' + esc(base) + '\')">이 조건으로 보기'+
      icon("arrow",18)+'</button></p>'+
    /* ⚠️ 하지 않는 저장을 한다고 적지 않습니다 (절대 규칙 5) */
    '<p class="sec-note">'+icon("lock",15)+
      ' 고르신 것은 <b>아무 데도 저장되지 않습니다.</b> 주소에만 실려 '+
      '아래 순서를 맞추고 견적 요청에 그대로 넘어갑니다.</p>'+
    StartAskResult(ind, v)+
  '</div></section>';
}
/* 고르신 것으로 **실제로 달라지는 것**을 그 자리에서 보여 줍니다 */
function StartAskResult(ind, v){
  var key  = (startWay() === "take") ? "acq-in" : "startup";
  var L    = amProcess(key);
  var stg  = window.amStartPick ? amStartPick("AM_START_STAGE", v.st) : null;
  var bud  = window.amStartPick ? amStartPick("AM_START_BUD", v.b) : null;
  var when = window.amStartPick ? amStartPick("AM_START_WHEN", v.when) : null;
  var rn   = v.r ? amRegionName(v.r) : "";
  if(!stg && !bud && !when && !rn) return "";
  /* ⚠️ `at` 은 1부터입니다. 걸음이 줄면 빌드가 멈춥니다 (checkStartAsk) */
  var at   = stg ? Math.max(0, (stg.at[key] || 1) - 1) : 0;
  var next = L.slice(at, at + 3);
  var q    = { industry:ind.key, side:"start" };
  if(v.r) q.region = v.r;
  if(bud) q.bud = bud.n;
  if(when) q.when = when.n;
  return '<div class="sask-r">'+
    '<p class="sask-r-k">'+icon("check",16)+
      esc([rn, (bud ? bud.n : ""), (stg ? stg.n : ""), (when ? when.n : "")]
          .filter(Boolean).join(" · "))+'</p>'+
    (next.length
      ? '<h3 class="sask-r-h">'+(stg ? "지금부터 할 일" : "제일 먼저 할 일")+'</h3>'+
        '<ol class="sask-r-l">'+next.map(function(st2, i){
          return '<li><span class="sask-r-n">'+("0"+(at + i + 1)).slice(-2)+'</span>'+
            '<span class="sask-r-t"><b>'+esc(st2.name)+'</b>'+
              '<i>'+esc(st2.lead)+'</i>'+
              '<span class="sask-r-ls">'+StepLinks(st2, ind.key)+'</span></span></li>';
        }).join("")+'</ol>'
      : '')+
    '<p class="row-cta">'+
      '<a class="btn btn-b" href="'+esc(quoteTo(q))+'">이 조건으로 견적 요청'+
        icon("arrow",18)+'</a>'+
      (v.r
        ? '<a class="btn btn-o" href="/stores?i='+encodeURIComponent(ind.key)+
          '&r='+encodeURIComponent(v.r)+'">'+esc(rn)+' '+esc(ind.name)+' 점포</a>'
        : '')+
      (bud ? '<a class="btn btn-o" href="/tools/cost">창업비 직접 재 보기</a>' : '')+
    '</p>'+
  '</div>';
}

/* 업종 전용 장비 (§12) */
function EquipBand(ind){
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+esc(ind.name)+' 전용</p>'+
      '<h2>이 업종에 필요한 장비</h2>'+
      /* ⚠️ 문장 한가운데 링크를 박지 않습니다 — 21px 이라 누르기
         어렵습니다. 문단 끝에 버튼으로 내놓습니다. */
      '<p>업종마다 다릅니다. 새로 사실 수도 있고, 정리하시는 곳에서 '+
        '중고로 인수하실 수도 있습니다.</p>'+
      '<a class="sec-more" href="/assets?i='+encodeURIComponent(ind.key)+'">'+
        '중고 시설 · 장비 보기'+icon("chev",15)+'</a>'+
    '</div>'+
    /* 2026-11-25 — 제품을 알아볼 수 있는 사진이 있는 장비(AM_PIC_EQ)는 사진 카드, 나머지는 칩 */
    (function(){
      var P = ind.equip.filter(function(e){ return picKey("eq", e.key); }),
          C = ind.equip.filter(function(e){ return !picKey("eq", e.key); });
      var to = function(e){ return '/providers/equip?s='+encodeURIComponent(e.key)+'&i='+encodeURIComponent(ind.key); };
      return (P.length ? '<ul class="eqp-g">'+P.map(function(e){
          return '<li><a class="pcd eqp-c" href="'+to(e)+'"><span class="pcd-ph" aria-hidden="true">'+picBox(picKey("eq", e.key), "equip", "(max-width:640px) 46vw, 200px")+'</span>'+
            '<span class="pcd-tx"><b class="pcd-t">'+esc(e.name)+'</b><i class="pcd-d">대표 이미지 · 업체 보기</i></span></a></li>'; }).join("")+'</ul>' : '')+
        (C.length ? '<ul class="chip-g">'+C.map(function(e){ return '<li><a class="chip" href="'+to(e)+'">'+esc(e.name)+'</a></li>'; }).join("")+'</ul>' : '');
    })()+
  '</div></section>';
}

/* 프랜차이즈로 가는 길 — 같은 업종 분류가 있을 때만 */
function FranchiseHint(fcat, ind){
  return '<section class="sec"><div class="w band-cta">'+
    '<div><p class="eyebrow">프랜차이즈로 시작한다면</p>'+
      '<h2>'+esc(fcat.name)+' 프랜차이즈 비교</h2>'+
      '<p class="lead">창업비 · 가맹비 · 권장 평수 · 모집지역을 나란히 놓고 보십시오. '+
        '본사가 직접 등록한 값만 올라갑니다.</p></div>'+
    '<a class="btn btn-b btn-lg" href="/franchise/'+esc(fcat.key)+'">'+
      esc(fcat.name)+' 브랜드 보기'+icon("arrow",18)+'</a>'+
  '</div></section>';
}

/* ── /closure — 정리 방법 고르기 (§21) ──────────────────────────── */
/* ── 2026-11-23 시안 04_closure — 본문 (KxCalc · 지원사업 찾는 곳) ─────
   ⚠️⚠️ 예상 비용은 /tools/closecost 가 **적으신 값으로** 냅니다 — 시안의 금액(54,800,000원)을 넣지 않습니다.
   ⚠️⚠️ 지원사업은 **공고(AM_SUPPORTS)가 0건이면 0건이라고** 말하고 '찾는 곳'(기관)만 냅니다 —
   모집 상태를 지어내지 않고, 지급을 약속하지 않습니다. */
function CloseKxCalc(){
  return KxCalc({ id:"cl-cost", tone:"sec-calc", photo:"home-closure", kicker:"예상 비용",
    title:"정리 비용, 미리 따져 보세요",
    lead:"철거 · 원상복구 · 폐기물 · 남은 계약 위약금 같은 항목에 받으신 견적을 적으면 합계와 차액을 보여 드립니다. 적으신 값은 저장하지 않습니다.",
    list:["철거 · 원상복구 — 어디까지 되돌려야 하는지(임대차 계약서)",
          "집기 매각 — 팔아서 들어올 돈과 버리는 비용",
          "계약 해지 — 인터넷 · POS · 렌탈의 남은 약정",
          "세금 — 폐업 신고와 부가세 확정신고"],
    btns:[{ href:"/tools/closecost", t:"폐업 예상비용 계산하기", ic:"calc" }, { href:"/tools/close", t:"폐업 체크리스트" }, { href:"/tools/premium", t:"권리금 따져보기" }],
    note:"계산 결과는 적으신 값으로 낸 참고값이며 실제 견적과 다릅니다. 실제 금액은 현장을 본 업체의 견적으로 정해집니다." });
}
function CloseKxSupport(){
  var N = (typeof amSupports === "function") ? amSupports("close").length : 0;
  var W = (typeof amSupportWhere === "function") ? amSupportWhere("close") : [];
  if(!W.length) return "";
  return '<section class="sec sec-ivory kx kx-sup" id="cl-sup"><div class="w">'+
    kxHd({ kicker:"정부지원사업", title:"정리할 때 받을 수 있는 지원, 여기서 찾으세요",
      lead:(N ? "지금 원문을 확인한 공고가 "+N+"건 있습니다. " : "지금 저희가 원문을 확인해 올린 공고는 0건입니다. ")+
        "공고는 해마다 바뀌어서, 모집 여부는 아래 기관에서 확인하십니다." })+
    '<ul class="kx-sup-g">'+W.map(function(x){
      return '<li class="kx-sup-c"><b>'+esc(x.org)+'</b><small>'+esc(x.what)+'</small>'+
        (x.find ? '<span class="kx-sup-f">'+icon("search",14)+'<span>'+esc(x.find)+'</span></span>' : '')+
        (x.url ? '<a class="kx-sup-a" href="'+esc(x.url)+'" target="_blank" rel="noopener">사이트 열기'+icon("arrow",14)+'</a>' : '')+
      '</li>';
    }).join("")+'</ul>'+
    '<p class="kx-note">지원 대상인지 · 얼마를 받는지는 그 기관이 심사합니다. 저희는 지급을 약속하지 않습니다.'+
      (N ? ' <a class="kx-sup-more" href="/support?side=close">공고 보기</a>' : '')+'</p>'+
  '</div></section>';
}

/* ── 2026-11-23 사진형 시안 (폐업) — 본문 조각 ────────────────────────────────────
   ⚠️⚠️ 철거를 맨 앞에 두지 않습니다 — 넘길 수 있으면 철거비 · 원상복구비가 줄어듭니다.
   ⚠️ 예상 비용은 /tools/closecost 가 적으신 값으로 냅니다(참고값). 지원 지급을 약속하지 않습니다. */
function CloseKpSvc(){
  var L = [
    kxSvc("transfer", "", "매장 양도", "넘기면 철거 · 원상복구가 줄어듭니다", "handover", "insu-transfer"),
    kxSvc("asset", "", "집기 · 설비 처분", "냉장고 · 커피머신 · 가구 품목 고르기", "box", "as-fridge"),
    /* 2026-11-25 — 철거(해체 중인 현장)와 원상복구(복구된 바닥 · 벽)를 사진으로 가릅니다 */
    kxSvc("demolish", "", "철거", "무엇을 뜯는지 · 폐기물 범위부터", "demolish", "hero-close"),
    kxSvc("restore", "", "원상복구", "임대 계약 조건에 맞게 바닥 · 벽 복구", "restore", "kind-take"),
    kxSvc("tax", "", "폐업 세무", "폐업 신고 · 부가세 · 종합소득세", "tax", "kp-cl-svc-tax"),
    /* 2026-11-26 — 재고 처분 (누락 카드 사진 13장 · service-inventory) */
    kxSvc("stock", "", "재고 처분", "팔 수 있는 남은 재고 · 소모품부터", "box", "service-inventory")
  ].filter(Boolean);
  /* 집기 처분은 기존 품목 선택 화면으로 */
  L.forEach(function(x){ if(/^\/assets/.test(x.href)) x.href = "/assets?p=pick"; });
  return KpServices({ id:"cl-svc", tone:"sec-white", kicker:"폐업 · 정리 핵심 서비스",
    title:"폐업에 꼭 필요한 서비스", lead:"넘길 수 있는 것부터 확인하고, 남는 것을 정리합니다.", items:L });
}
function CloseKpRoad(){
  return KpProcess({ id:"cl-road", tone:"sec-ivory", kicker:"폐업 진행 절차",
    title:"정리 작업은 이렇게 진행됩니다",
    lead:"기간과 비용은 평수 · 공사 범위 · 건물 조건에 따라 다릅니다.",
    moreHtml:'<a class="btn btn-o" href="#cl-flow" onclick="return hhJump(\'cl-flow\')">상세 진행 과정 보기'+icon("chev",15)+'</a>',
    steps:[{ n:"상담 접수", d:"상황 · 평수 · 정리할 범위를 알려 주십니다", ph:"kp-cl-pro-consult", ia:"doc", ic:"doc" },
           { n:"현장 확인 · 견적", d:"업체가 현장을 보고 범위와 견적을 냅니다", ph:"kp-cl-pro-quote", ia:"calc" },
           { n:"철거 · 정리 진행", d:"집기 처분 · 철거 · 원상복구를 진행합니다", ph:"home-closure", ia:"demolish" },
           { n:"최종 확인", d:"임대인 확인 · 폐기물 증빙 · 신고를 마칩니다", ph:"insu-closure-in", ia:"contract", ic:"check" }] });
}
function CloseKpCalc(){
  return KpBanner({ id:"cl-cost", kicker:"폐업 예상 비용", photo:"kp-cl-ban-cost",
    title:"정리 비용, 미리 따져 보세요",
    lead:"철거 · 원상복구 · 폐기물 · 남은 계약 위약금에 받으신 견적을 적으면 합계와 차액을 보여 드립니다. 적으신 값은 저장하지 않습니다.",
    btns:[{ href:"/tools/closecost", t:"예상 비용 계산하기", ic:"calc" }, { href:"/tools/close", t:"폐업 체크리스트" }],
    note:"계산 결과는 적으신 값으로 낸 참고값이며 실제 견적과 다릅니다.",
    card:{ title:"이런 항목을 함께 봅니다", list:["철거 · 원상복구 범위", "집기 매각으로 들어올 돈", "인터넷 · POS · 렌탈 남은 약정", "폐업 신고 · 부가세"] } });
}
function CloseKpSupport(){
  var N = (typeof amSupports === "function") ? amSupports("close").length : 0;
  var W = ((typeof amSupportWhere === "function") ? amSupportWhere("close") : []).filter(function(x){ return x.url; }).slice(0, 4);
  if(!W.length) return "";
  var ic = ["search", "store", "won", "users"];
  return KpCards({ id:"cl-sup", tone:"sec-white", kicker:"정부지원사업",
    title:"정리할 때 받을 수 있는 지원, 여기서 찾으세요",
    lead:(N ? "지금 원문을 확인한 공고가 "+N+"건 있습니다. " : "지금 저희가 원문을 확인해 올린 공고는 0건입니다. ")+"모집 여부는 아래 기관에서 확인하십니다.",
    more:{ href:"/support?side=close", t:"지원사업 찾는 곳 전체" },
    /* 2026-11-26 — 맨 앞에 '지원사업 찾는 곳 전체'(사진 service-support) · 기관 카드는 아이콘 그대로 (같은 사진을 넷에 깔지 않습니다) */
    items:[{ n:"지원사업 찾는 곳 전체", d:"폐업 · 재기 지원을 찾는 기관과 찾는 말을 한곳에", href:"/support?side=close", ph:"service-support", go:"모아 보기" }]
      .concat(W.map(function(x, i){ return { n:x.org, d:x.what, href:x.url, ic:ic[i % ic.length], ia:"", go:"사이트 열기" }; })),
    note:"지원 대상인지 · 얼마를 받는지는 그 기관이 심사합니다. 저희는 지급을 약속하지 않습니다." });
}

function PageClosure(){
  /* ⚠️⚠️ 2026-10-18 전체 점검 지시서 §3 · §12 — 네 전문관이 **같은
     공통 레이아웃**을 씁니다. 재 보니 폐업에 **고르는 체크칸이
     0개**였습니다 (전부 링크였습니다) — 창업 · 운영은 둘 다 있었고
     폐업과 양도양수만 빠져 있었습니다.

     §12 권장 구조 그대로 —
       ① 소개 ② 필요한 폐업 서비스 선택 ③ 선택 확인 + 통합 신청
       ④ 함께 하시는 것 ⑤ 절차 가이드 ⑥ 업종별 ⑦ 체크리스트 · 비용
       ⑧ 도움 ⑨ 다른 전문관

     ⚠️⚠️ **있던 것을 지우지 않았습니다** (§0-3 · §0-4). 상황 네 갈래
     (`?w=`)와 상황별 로드맵 · 업종 고르개 열넷 · 분류 열두 카드가
     전부 그대로이고, 길어진 만큼 **접었습니다** — 접힌 것도 DOM 에
     그대로 있어서 크롤러 · 링크 검사 · 색인이 안 바뀝니다 (재서
     확인했습니다).
     ⚠️ 390px 에서 12,713px(폰 화면 열넷)이었습니다 — §12-4 가 적은
     "폐업 절차의 과도한 길이" 가 그 숫자입니다. */
  /* ── 두 가지 이용 경로 (2026-10-20 지시서 PART 6-2 · 6-3) ──────
     > PART 6-2 — "A. 폐업 전체 절차 안내받기 / B. 필요한 서비스만 찾기"
     > PART 6-1 — "폐업을 준비하는 고객이 **복잡한 절차에 압도되지
     >  않도록** 한다."

     ⚠️⚠️ **막는 길이 아닙니다** (PART 2-2 "불필요한 중간 단계 강제
     금지"). 안 고르셔도 아래가 전부 그대로 있고, 고르시면 **차례만**
     바뀝니다 — 고르신 것은 주소(`?p=`)에 실려 뒤로 가기 · 새로고침 ·
     링크 공유에 살아남습니다.
     ⚠️⚠️ **상황 네 갈래(`?w=`)를 두 경로로 바꾼 것이 아닙니다.**
     그건 "전체 절차" 안쪽의 더 가는 갈래이고 밖으로 나간 링크가
     그 값을 들고 있습니다 — `WantBand()` 그대로입니다. 다만 경로
     카드 바로 아래 또 고르개를 두면 **같은 선택 영역이 둘**이 되어
     (PART 16-3), 기본 차례에서는 절차 쪽으로 내려갑니다. */
  /* ⚠️⚠️ 2026-11-19 공개 화면 완성도 개선 §1 — 차례를 **첫 행동 셋 → 핵심 정리 순서 →
     체크리스트 · 비용 → 서비스 고르기 → 분야별 상세** 로 정리했습니다.
     전에는 첫 화면 셋 뒤로 정리 순서(여섯) · 두 경로 카드 · 상황 넷 · 서비스 묶음 ·
     도움 카드가 이어져 "매장 양도" 를 다섯 번 고르게 했습니다.
     ⚠️ 지운 것이 없습니다 — 상황 넷(?w=) · 진단(?w=lost) · 상황별 로드맵 · 직원 기한 ·
     분야 열둘 · 업종 열넷 · 폐업 절차(/c/process) · 지원사업(/support) 링크가 전부
     정리 순서 구역과 분야별 상세 구역으로 옮겨 갔습니다.
     ⚠️ 두 경로 카드(?p=all · ?p=pick)는 같은 선택의 반복이라 내렸습니다. 밖으로 나간
     주소는 그대로 열립니다 — ?p=all 은 자세한 순서를 펼친 채로, ?p=pick 은 #pick 으로 갑니다. */
  var path  = nowQS("p") === "all" ? "all" : (nowQS("p") === "pick" ? "pick" : "");
  /* 2026-11-24 하단 간소화 — 위 사진 카드 · 목적별 이동이 기본 동선이고, 여러 서비스를 한 번에
     고르는 것은 '여러 서비스 함께 고르기' 한 구역 안에 **기본 접힘**입니다 (ClosurePickFold).
     ⚠️ 전에는 고르개(#pick) · "고르신 서비스 0개" 바구니 · 함께 하는 묶음 셋이 따로 서서 폰에서 3,381px 였습니다.
     옛 세 구간(PickGroupBand · PickBasket · PackPickBand)은 다른 전문관이 그대로 씁니다. */
  var sel   = ClosurePickFold(path);
  /* 2026-11-23 모바일 동선 정리 — 머리의 상황 셋(양도 검토 · 긴급 철거 · 집기 처분)이 첫 행동입니다.
     폐업 순서 여섯(ClosureFlow)이 대표 절차이고, 새 4단계(상담 → 현장 → 작업 → 완료)는 그 안의
     '업체에 맡기면' 한 줄로 합쳤습니다. 서비스 카드 넷(CloseKxServices)은 절차 여섯과 같은 목적지라 내렸습니다.
     계산 구간은 둘(HallCalcBand · CloseKxCalc)이 같은 두 도구(폐업 예상비용 · 체크리스트)를 내서
     하나(CloseKxCalc · sec-calc)로 합쳤습니다. 체크리스트 · 비용 · 지원사업 링크는 절차 아래 줄에도 있습니다. */
  /* 2026-11-23 사진형 시안 — 큰 대표 사진(상황 셋) → 사진 핵심 서비스 4 → 사진 진행 절차 4 → 사진 배너 + 예상비용
     → 상세 진행 과정(ClosureFlow · #cl-flow) → 철거가 급할 때(#cl-demo) → 고르기 → 분야별 → 가이드
     → 지원사업 찾는 곳(#cl-sup) → 왜 · 하단 안내. 이용 순서(HallSteps)는 사진 절차와 같은 말이라 내렸습니다.
     옛 CloseKxCalc · CloseKxSupport 는 지우지 않았습니다. */
  /* 2026-11-26 모바일 사용성 개편 — 머리 바로 아래가 상황 넷(CloseSit)입니다. 사진 서비스 · 절차 · 계산은 그 아래. */
  /* 2026-11-26 모바일 시안 §5 — 상황을 고르면 결과에 비용 계산 · 체크리스트가 이미 있어서 아래 계산 띠는 뺍니다 */
  var clPicked = ["pass","money","fast","lost"].indexOf(nowQS("w")) >= 0;
  return CloseTop() + CloseSit() + CloseKpSvc() + CloseKpRoad() + (clPicked ? "" : CloseKpCalc()) +
    ClosureFlow(path, true) + ClosureDemoBand() +
    sel+
    ClosureMoreBand()+
    /* ⑥ 가이드 — ⚠️ 맞는 글이 없으면 `ReadBand()` 가 구간째 뺍니다 (절대 규칙 2). */
    ReadBand({ side:"close", limit:4,
               title:"정리하기 전에 알아 두면 좋은 것" })+ CloseKpSupport() +
    KpWhy({ photo:"insu-hero", title:"넘길 수 있는 것부터, 순서대로 정리합니다", items:KP_WHY }) +
    KpCta({ title:"매장 정리, 어디서부터 시작할지 고민되세요?",
      lead:"상황만 적어 주시면 넘길 수 있는 것부터 철거 · 원상복구까지 함께 정리해 드립니다.",
      second:{ href:"/faq", t:"자주 묻는 질문" }, quote:"/quote?mode=close&from=closure-cta", ctaForm:"close", goName:"매장 정리 상담 신청하기" }) +
    JourneyBand({ current:"closing",
      title:"다른 것도 준비하고 계신가요?",
      lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." })+
    PickBar("close");
}

/* ── 여러 서비스 함께 고르기 (2026-11-24 /closure 하단 간소화) ───────────────
   ⚠️⚠️ **고르는 칸 · 저장 · 신청 링크를 새로 만들지 않았습니다.** 고르개 몸통은 다른 전문관과 같은
   PickGroupBody() 이고, 개수 · 목록 · 해제 · 신청 링크는 pickPaint() 가 화면의 같은 표시
   (data-pick-row · pk-list · pk-go-on · pk-go-clr · data-pick-go)를 그대로 맞춥니다.
   ⚠️ 접어도 **고르신 것은 접힘 밖 요약**에서 보이고 해제됩니다. 0개면 요약이 줄째 가려집니다.
   ⚠️ #pick 은 그대로 이 구역입니다 — 밖으로 나간 ?p=pick · #pick 링크가 여기로 옵니다(?p=pick 이면 펼친 채로).
   ⚠️ 함께 하는 묶음은 **폐업 정리 하나만** 둡니다 — 같이 나오던 '매장 운영 패키지' 는 이 화면의 일이 아닙니다. */
function ClosurePickFold(path){
  return HallPickFold({ side:"close", path:path,
    body:PickGroupBody("closure", "close", { noAside:true }), packKeys:["close"],
    fallback:function(){ return PickGroupBand("closure", "close") + PickBasket("close") + PackPickBand("close"); } });
}

/* ⚠️ 폐업 쪽 계산기 — `AM_TOOLS` 의 "정리할 때" 둘(체크리스트 ·
   예상비용)과 권리금입니다. §12 권장 구조의 ⑤ 폐업 체크리스트와
   ⑦ 폐업 비용 계산기가 이 구간 한 곳에서 같이 섭니다.
   ⚠️⚠️ **넷으로 채우지 않았습니다** — 폐업에서 실제로 쓰는 것이
   셋입니다 (`/tools` 의 "정리할 때" 묶음이 둘이고 권리금이 양도와
   걸칩니다). 억지로 하나 더 넣으면 안 쓰는 칸입니다. */
var CLOSE_CALC      = ["close", "closecost", "premium"];
var CLOSE_CALC_TONE = { close:"sv4", closecost:"sv5", premium:"t13" };

/* ── A. 폐업 · 정리 소개 ──────────────────────────────────────────
   ⚠️⚠️ **2026-10-08 지시서 §16 의 첫 메시지 그대로입니다.** "어떻게
   정리하고 싶으세요" 는 이미 정리하기로 정하신 분께 묻는 말인데, 이
   화면이 제일 먼저 할 일은 **넘길 수 있는 것이 있는지**를 알려 드리는
   것입니다 — 양도가 되면 철거비도 원상복구비도 안 드는 경우가 있습니다.
   ⚠️ **폐업을 실패로 말하지 않습니다** (§6). "잘 정리하는 것도
   사업입니다" 까지입니다 — 손실 · 실패를 적지 마세요.
   ⚠️ 단추 둘은 창업 · 운영과 **같은 꼴**입니다 (§3 통일) — 하나는
   바로 아래 고르개로, 하나는 **빈손으로 가도 되는 길**입니다. */
function ClosureIntro(path){
  /* 2026-11-18 카테고리 리뉴얼 — 전문관 머리 + 흐름 띠(ClosureFlow).
     ⚠️⚠️ 흐름의 첫 걸음은 **양도 검토**입니다 — 철거가 맨 앞이 아닙니다
     (넘길 수 있으면 철거비도 원상복구비도 줄어듭니다). */
  return HallHero({ sit:true,
    side:"close", photo:"insu-closure",
    kicker:"폐업 · 철거 서비스",
    h1raw:"매장 정리부터 철거까지<br>폐업의 모든 과정을<br><em>"+esc(ftWith(amBrand(), "이가"))+" 함께합니다.</em>",
    lead:"복잡하고 부담스러운 폐업 절차, 철거 · 원상복구 · 집기 정리 · 세무까지 순서대로 짚어 드립니다. 바로 철거하기 전에 넘길 수 있는 것부터 확인하세요.",
    /* ⚠️ 2026-11-18 — 매장 정리 상담(close) 양식을 따릅니다. 일반 견적이
       닫혀 있어도 매장 정리 상담만 열 수 있습니다. */
    quote: "/quote?mode=close&from=closure-hero", ctaForm:"close",
    goName:"무료 상담 신청하기",
    /* 시안의 '예상 비용 계산하기' — 실제 폐업 예상비용 계산기(/tools/closecost). 결과는 참고값이라고 그 화면이 밝힙니다 */
    second:'<a class="btn btn-lg hh-o" href="/tools/closecost">'+icon("calc",18)+' 예상 비용 계산하기</a>',
    leadM:"철거 · 원상복구 · 집기 정리 · 세무까지, 넘길 수 있는 것부터 확인하세요.",
    /* 시안 오른쪽 '이런 고민이 있으신가요?' — 꾸밈 목록이 아니라 실제로 가는 칸 셋 그대로입니다 */
    cardTitle:"이런 고민이 있으신가요?",
    /* 2026-11-19 — 첫 화면의 선택지는 **이 셋 하나**입니다. 바로 아래 같은 셋을 다시 내던
       ClosureQuick() 구간은 여기로 합쳤습니다 (그 구간의 설명 · 목적지를 그대로 옮겼습니다).
       ⚠️ 철거가 급한 분은 양도 단계를 거치지 않습니다 — 닫혀 있으면 철거 준비 정보(/providers/demolish),
       열려 있으면 기존 매장 정리 상담 경로(CLOSE_QUICK_URGENT · 서버 게이트 그대로)입니다.
       ⚠️ 닫힌 상태의 글은 **실제 목적지**를 말합니다 — "신청" 이라는 말이 안 나옵니다. */
    quick:[{ ic:"handover", b:"매장을 넘길 수 있는지 보기", d:"넘기면 철거비 · 원상복구비가 줄어듭니다",
             go:"양도 순서 보기", href:"/transfer?t=out" },
           { ic:"clock", b:"철거 일정이 급해요", d:"양도 검토 없이 철거 준비로 바로 갑니다",
             go:"철거 준비 보기", goOn:"집기 처분 + 철거 상담 신청",
             href:"#cl-demo", on:CLOSE_QUICK_URGENT },
           { ic:"box", b:"집기 · 설비 처분", d:"주방기기 · 냉장고 · 가구를 정리합니다",
             /* 2026-11-24 — 접수 상태와 관계없이 **품목 고르기**로 바로 갑니다 (/assets?p=pick).
                고른 품목이 신청 화면에 그대로 실리고, 닫혀 있으면 그 화면이 고르기 전에 알립니다. */
             go:"정리할 집기 고르기", goOn:"집기 고르고 상담 신청",
             href:"/assets?p=pick", on:"/assets?p=pick" }]
  }); /* 2026-11-23 — 상세 진행 과정(ClosureFlow) · 철거가 급할 때(ClosureDemoBand)는 사진 절차 · 배너 뒤로 옮겼습니다 (PageClosure) */
}

/* ── 철거가 급할 때 (2026-11-20 카테고리 통합 개선 §2) ─────────────────
   첫 화면 "철거 일정이 급해요" 가 **양도 검토를 거치지 않고** 도착하는 자리입니다.
   ⚠️ 적힌 것은 전부 저희 글(content.js)의 check 를 그대로 옮긴 것이고, 금액 · 기간을 적지 않습니다.
   ⚠️ 매장 정리 상담(close) 이 열려 있으면 철거 상담 단추가, 닫혀 있으면 접수 안내가 섭니다 (data-cta 짝). */
var CLOSE_DEMO_READ = ["cheolgeo-gyeonjeok-gareuneun-geot", "wonsang-bokgu-beomwi", "pyegimul-jeungmyeong"];
var CLOSE_DEMO_HEAD = { "cheolgeo-gyeonjeok-gareuneun-geot":"철거 범위 · 견적",
                        "wonsang-bokgu-beomwi":"원상복구 범위", "pyegimul-jeungmyeong":"폐기물 처리 · 증빙" };
function ClosureDemoBand(){
  var C = (window.AM_CONTENTS || []);
  var cards = CLOSE_DEMO_READ.map(function(slug){
    var c = C.filter(function(x){ return x.slug === slug; })[0];
    if(!c || !c.check || !c.check.length) return "";
    return '<li class="cld-c"><b>'+esc(CLOSE_DEMO_HEAD[slug] || c.title)+'</b>'+
      '<ul>'+c.check.slice(0, 3).map(function(t){ return '<li>'+icon("check",15)+'<span>'+esc(t)+'</span></li>'; }).join("")+'</ul>'+
      '<a class="cld-r" href="/content/'+esc(slug)+'">'+icon("book",15)+'<span>'+esc(c.title)+'</span></a></li>';
  }).join("");
  if(!cards) return "";
  return '<section class="sec sec-white cld" id="cl-demo"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">철거가 급할 때</p>'+
      '<h2>철거 전에 이것만 정리해 두세요</h2>'+
      '<p>견적이 갈리는 것은 평수보다 <b>무엇을 뜯고 어떻게 내보내는가</b>입니다. 업체에 묻기 전에 아래를 먼저 적어 두시면 견적을 비교하기 쉽습니다.</p></div>'+
    '<ul class="cld-g">'+cards+'</ul>'+
    '<div class="row-cta cld-go">'+
      '<a class="btn btn-b" href="'+esc(CLOSE_QUICK_URGENT)+'" data-cta="on" data-cta-form="close" hidden>철거 · 집기 처분 상담 신청'+icon("arrow",16)+'</a>'+
      '<a class="btn btn-b" href="/tools/closecost" data-cta="off" data-cta-form="close">폐업 예상비용 계산'+icon("arrow",16)+'</a>'+
      '<a class="btn btn-o" href="/providers/demolish">철거 분야 보기</a>'+
      '<a class="btn btn-o" href="/providers/restore">원상복구 분야 보기</a>'+
    '</div>'+
    '<p class="cld-n" data-cta="off" data-cta-form="close">'+icon("info",15)+'<span>지금은 매장 정리 상담을 받지 않습니다. 위 항목과 비용 계산으로 먼저 준비해 두세요.</span></p>'+
  '</div></section>';
}

/* ── 바로 고르는 세 갈래 (2026-11-18 STOREWAY 1차) ─────────────────
   ⚠️⚠️ 첫 화면에서 바로 고릅니다 — 넘길 수 있는지 · 철거가 급한지 ·
   집기 처분. **급한 분은 양도 검토를 거치지 않고** 집기 처분 + 철거를
   한 번에 신청하실 수 있습니다.
   ⚠️⚠️ 매장 정리 상담이 닫혀 있으면 신청을 권하지 않습니다 — 두 칸은
   data-cta 짝이고, 닫혀 있을 때는 **실제로 있는 안내 화면**으로 갑니다
   (철거 · 시설 처분 분야). "신청" 이라는 말이 안 나옵니다. */
var CLOSE_QUICK_URGENT = "/quote?mode=close&from=closure-urgent&sv=" +
  encodeURIComponent("asset/kitchen-eq,demolish/full");
var CLOSE_QUICK_ASSET  = "/quote?mode=close&from=closure-asset&sv=" +
  encodeURIComponent("asset/kitchen-eq,asset/furniture");
/* ClosureQuick() 는 2026-11-19 머리의 바로 가기 셋(ClosureIntro 의 quick)으로 합쳤습니다. */

/* 폐업 — 시안의 "폐업 통합 진행 프로세스" 여섯.
   ⚠️ 차례는 지시대로 **양도 검토 → 집기 처분 → 철거 · 원상복구** 를 앞에 둡니다.
   ⚠️ 칸마다 **실제로 있는 화면**으로 갑니다 (가짜 링크 없음). */
var CLOSE_FLOW = [
  ["handover", "매장 양도 검토",   "넘기면 철거비 · 원상복구비가 줄어듭니다", "/transfer?t=out"],
  ["box",      "집기 · 설비 처분", "주방기기 · 가구 · 비품을 팔 길",        "/assets"],
  ["hammer",   "철거 견적",        "무엇을 뜯는지부터 정리",                "/providers/demolish"],
  ["roller",   "원상복구",         "임대 계약 조건에 맞는 범위",            "/providers/restore"],
  ["doc",      "폐업 신고 · 지원", "신고 순서와 지원사업 찾는 곳",          "/c/process"],
  ["calc",     "세무 정리",        "부가세 · 종합소득세 등 폐업 세무",       "/providers/tax"]
];
function ClosureFlow(path, noWant){
  /* ⚠️⚠️ 2026-11-19 — 핵심 정리 순서는 **이 한 구역**입니다. 여섯 칸(요약) 아래에
     ① 자세한 순서(상황별 로드맵 · 접힘) ② 직원 기한 ③ 폐업 절차 · 지원사업 링크
     ④ "어디서부터 시작할지 모르겠어요" (상황 넷 · 진단 · 접힘) 를 모았습니다.
     주소에 상황(?w=)이나 ?p=all 이 실려 오면 ①④ 를 펼친 채로 냅니다. */
  var w = nowQS("w"), wSel = (window.amCloseWant ? amCloseWant(w) : null);
  var openRoad = !!wSel || path === "all";
  return '<section class="sec sec-white hfl" id="cl-flow"><div class="w">'+
    '<div class="sec-hd sec-hd-c"><p class="eyebrow">CLOSE FLOW</p>'+
      '<h2>폐업도 순서대로, 단계별로 정리하세요</h2>'+
      '<p>앞 걸음이 뒤 걸음의 비용을 줄입니다. 칸을 누르면 그 단계 화면으로 갑니다.</p></div>'+
    '<ol class="hfl-g">'+CLOSE_FLOW.map(function(x, i){
      return '<li><a href="'+esc(x[3])+'"><span class="hfl-n">0'+(i+1)+'</span>'+
        '<span class="hfl-i" aria-hidden="true">'+icon(x[0], 28)+'</span>'+
        '<b>'+esc(x[1])+'</b><span class="hfl-d">'+esc(x[2])+'</span></a></li>'; }).join("")+'</ol>'+
    /* 2026-11-23 — 새 4단계 안내를 여기 한 줄로 합쳤습니다 (업체에 맡기는 일 하나하나의 진행) */
    '<div class="hfl-job"><b>업체에 맡기면</b><ol>'+
      ["상담 접수", "현장 확인 · 견적", "작업 진행", "완료 · 확인"].map(function(t, i){
        return '<li><span aria-hidden="true">'+(i+1)+'</span>'+esc(t)+'</li>'; }).join("")+
    '</ol><small>기간과 비용은 평수 · 공사 범위 · 건물 조건에 따라 다릅니다.</small></div>'+
    '<div class="hfl-more">'+
      ClosingProcess(null, true, openRoad)+
      '<p class="row-cta hfl-links">'+
        '<a class="btn btn-o" href="/c/process">'+icon("list",16)+' 폐업 신고 순서 · 필요서류</a>'+
        '<a class="btn btn-o" href="/tools/close">'+icon("check",16)+' 폐업 체크리스트</a>'+
        /* 계산 띠(#cl-cost)가 없으면(상황을 고른 뒤) 계산기 화면으로 바로 갑니다 — hhJump 가 자리가 없으면 true 를 돌려줍니다 */
        '<a class="btn btn-o" href="/tools/closecost" onclick="return hhJump(\'cl-cost\')">'+icon("calc",16)+' 예상 비용 계산</a>'+
        '<a class="btn btn-o" href="#cl-sup" onclick="return hhJump(\'cl-sup\')">'+icon("badge",16)+' 폐업 지원사업 찾는 곳</a>'+
      '</p>'+
      /* 2026-11-26 — 상황 넷은 맨 위 첫 구간(CloseSit)이 받습니다. 같은 선택 영역을 둘 두지 않습니다. */
      (noWant ? "" : ClosureWantFold(wSel))+
    '</div>'+
  '</div></section>';
}
/* "어디서부터 시작할지 모르겠어요" — 상황 넷과 진단을 **도움이 필요한 분만** 펼칩니다.
   ⚠️ 첫 화면의 세 갈래와 같은 질문이라 펼쳐 두면 반복입니다. 고르시면(?w=) 펼친 채로
   그 상황에 맞는 분야와 위 자세한 순서가 바뀝니다. */
function ClosureWantFold(sel){
  var wants = (window.AM_CLOSE_WANTS || []);
  if(!wants.length) return "";
  var list = '<ul class="wnt-l">'+ wants.map(function(w){
      var on = (sel && sel.key === w.key);
      return '<li><a class="wnt'+(on?" on":"")+'" href="'+
        esc("/closure?w=" + encodeURIComponent(w.key))+'"'+
        (on ? ' aria-current="true"' : '')+'>'+
        /* 2026-11-25 — 상황마다 사진 (양도=열쇠와 서류 · 시설=업소용 냉장고 · 완전 폐업=비운 현장 · 모르겠어요=준비 목록) */
        '<span class="wnt-ph" aria-hidden="true">'+picBox(WANT_PH[w.key] || "", w.icon, "(max-width:640px) 46vw, 300px")+
          (on ? '<em class="swt-on">'+icon("check",14)+' 선택됨</em>' : '')+'</span>'+
        '<span class="wnt-ic">'+icon(w.icon,20)+'</span>'+
        '<b>'+esc(w.name)+'</b>'+
        '<span class="wnt-l-d">'+esc(w.lead)+'</span>'+
      '</a></li>'; }).join("")+'</ul>';
  var hit = "";
  if(sel){
    var g = amCloseCatsFor(sel.key, "");
    hit = (sel.key === "lost" ? CloseAsk("/closure", true) : "")+
      '<div class="sec-hd sec-hd-sub"><h3 class="pg-h2">'+esc(sel.name.replace(/[.?]$/, ""))+' — 이것부터입니다</h3>'+
        '<p>'+esc(sel.lead)+' 나머지 분야는 아래 <b>분야별 상세</b>에 그대로 있습니다.</p></div>'+
      '<div class="cat-g cat-g4">'+g.hit.map(function(c){ return CatCard(c, ""); }).join("")+'</div>';
  }
  /* 2026-11-25 디자인 개편 §5 — 네 상황을 사진으로 가르는 자리라 처음부터 펼쳐 둡니다 (접기 단추는 그대로) */
  return '<div class="hfl-want">'+
    '<h3 class="hfl-want-h">지금 상황을 골라 주세요</h3>'+
    '<p class="hfl-want-p">상황을 고르시면 그에 맞는 순서와 분야를 앞으로 꺼내 드립니다.</p>'+
    FoldAll("cl-want", "상황 카드 숨기기", "상황 카드 숨기기", "", true)+
    '<div id="cl-want">'+
      list + hit +
    '</div></div>';
}


/* 2026-11-20 — "분야별 상세" 와 "업종별로 자세히" 를 한 구역으로. 둘 다 **더 보고 싶은 분이 펼치는**
   자리라 따로 두면 같은 꼴의 구역이 두 번 이어졌습니다. 펼침 둘 · 안의 내용 · 주소는 그대로입니다. */
function ClosureMoreBand(){
  var all = (window.amCatsFor ? amCatsFor("", "close") : (window.AM_CLOSE_CATS||[]));
  return '<section class="sec cl-det stI"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">분야 · 업종별로 자세히</p>'+
      '<h2>정리할 것을 분야와 업종으로 보기</h2>'+
      '<p>분야를 누르면 그 분야 화면으로, 업종을 고르면 그 업종의 정리 목록으로 갑니다. 헬스장은 운동기구와 락커가, 음식점은 주방과 닥트가 남습니다.</p>'+
    '</div>'+
    '<div class="clm-f">'+
      FoldAll("cl-all", "분야 "+all.length+"개 펼쳐 보기", "분야 접기")+
      FoldAll("cl-ind", "업종 고르기 ("+(window.AM_INDUSTRIES||[]).length+"개)", "업종 접기")+
    '</div>'+
    '<div class="cat-g cat-g4 is-fold-all" id="cl-all">'+
      all.map(function(c){ return CatCard(c, ""); }).join("")+
    '</div>'+
    '<div class="is-fold-all" id="cl-ind">'+
      IndustryGroupChips("/closure", nowQS("g"))+
      IndustryGrid("/closure","", nowQS("g"))+
    '</div>'+
  '</div></section>';
}

/* ── 두 가지 이용 경로 카드 (PART 6-2) ───────────────────────────
   ⚠️ 카드 전체가 눌립니다 — 안에 또 `<a>` 를 넣지 마세요
   (`<a>` 안의 `<a>` 는 브라우저가 쪼갭니다).
   ⚠️ 고르신 것이 보여야 합니다 — 색만이 아니라 `aria-current` 로도
   냅니다 (읽어 주는 프로그램이 읽습니다). */
var CLOSE_PATHS = [
  { key:"all",  ic:"listck",
    name:"폐업 전체 절차 안내받기",
    lead:"처음 정리하십니다. 임대차 · 원상복구 · 집기 처분 · 직원 · "+
         "세무 · 철거를 순서대로 짚어 드립니다." },
  { key:"pick", ic:"check",
    name:"필요한 서비스만 찾기",
    lead:"무엇이 필요한지 이미 아십니다. 바로 고르시고 한 번에 "+
         "견적을 받으십니다." }
];
function ClosurePathBand(path){
  /* ⚠️ 바로 아래 서비스 선택(`pkb-sel`)이 `sec-ivory` 라 여기도
     아이보리면 **두 구간이 한 구간으로 읽힙니다** (찍어 보고
     알았습니다). 바탕은 톤 클래스가 칠합니다 — 함수 안에서 직접
     칠하지 마세요. */
  return '<section class="sec sec-white clp"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">어느 쪽이 가까우신가요?</p>'+
      '<h2>어떻게 도와드릴까요?</h2>'+
      '<p>고르시면 그 차례로 보여 드립니다. '+
        '<b>안 고르셔도 아래에 전부 그대로 있습니다.</b></p>'+
    '</div>'+
    '<ul class="clp-g">'+ CLOSE_PATHS.map(function(p){
      var on = (path === p.key);
      return '<li><a class="clp-c'+(on ? " on" : "")+'" href="'+
        esc("/closure?p=" + p.key + (p.key === "pick" ? "#pick" : ""))+'"'+
        (on ? ' aria-current="true"' : '')+'>'+
        '<span class="clp-i">'+icon(p.ic, 24)+'</span>'+
        '<b>'+esc(p.name)+'</b>'+
        '<i>'+esc(p.lead)+'</i>'+
        '<span class="clp-go">'+(on ? "보고 계십니다" : "이쪽으로 보기")+
          icon("arrow",15)+'</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}



/* ── 폐업은 목록이 아니라 **무엇을 원하시는가**부터 (§8) ──────────
   폐업 화면에 들어오자마자 분류 열두 개를 늘어놓으면, 이미 지쳐
   계신 분께 숙제를 하나 더 드리는 것입니다.

   ⚠️ **고르신 것에 없는 분류를 숨기지 마세요.** 추린 것 아래에
   나머지도 냅니다 — 숨기면 그 사장님에게는 그 기능이 없는 것이
   됩니다. `check.js` 가 개수를 셉니다. */
var WANT_PH = { pass:"kp-tr-pro-ready", money:"as-fridge", fast:"insu-closure", lost:"kp-op-pro-prior" };
function WantBand(ind){
  var wants = (window.AM_CLOSE_WANTS || []);
  if(!wants.length) return "";
  var i    = ind ? ind.key : "";
  var base = ind ? ("/closure/" + ind.key) : "/closure";
  var now  = nowQS("w");
  var sel  = (window.amCloseWant ? amCloseWant(now) : null);

  var pick = '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">먼저 한 가지만</p>'+
      '<h2>어떻게 정리하고 싶으세요?</h2>'+
      '<p>고르시면 그에 맞는 절차만 앞으로 꺼내 드립니다. '+
        '나머지도 아래에 그대로 있습니다.</p>'+
    '</div>'+
    '<ul class="wnt-l">'+ wants.map(function(w){
      var on = (sel && sel.key === w.key);
      return '<li><a class="wnt'+(on?" on":"")+'" href="'+
        esc(base + "?w=" + encodeURIComponent(w.key))+'"'+
        (on ? ' aria-current="true"' : '')+'>'+
        /* 2026-11-25 — 상황마다 사진 (양도=열쇠와 서류 · 시설=업소용 냉장고 · 완전 폐업=비운 현장 · 모르겠어요=준비 목록) */
        '<span class="wnt-ph" aria-hidden="true">'+picBox(WANT_PH[w.key] || "", w.icon, "(max-width:640px) 46vw, 300px")+
          (on ? '<em class="swt-on">'+icon("check",14)+' 선택됨</em>' : '')+'</span>'+
        '<span class="wnt-ic">'+icon(w.icon,20)+'</span>'+
        '<b>'+esc(w.name)+'</b>'+
        '<span class="wnt-l-d">'+esc(w.lead)+'</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';

  if(!sel){
    /* 아직 안 고르셨으면 분류 전부를 그대로 냅니다 — 고르는 것이
       의무가 되면 안 됩니다 */
    var all = (window.amCatsFor ? amCatsFor(i, "close") : (window.AM_CLOSE_CATS||[]));
    /* ⚠️⚠️ **접었습니다** (2026-10-18 §5 · §12-4). 바로 아래에 고르는
       자리(`PickGroupBand`)가 생겨서, 펼쳐 둔 채로 두면 **같은 서비스
       선택 영역이 한 화면에 둘**이 됩니다 — §5 가 직접 금지한 자리이고
       손님은 어느 쪽에서 골라야 하는지 모릅니다.
       ⚠️ **지운 것이 아닙니다** — 분류 화면(`/c/:cat` · `/stores` ·
       `/assets` · `/support`) 열둘로 가는 길이 여기뿐인 분야가 있어서,
       접힌 채로 DOM 에 그대로 둡니다 (크롤러 · 링크 검사 · 색인이
       안 바뀝니다 — 재서 확인했습니다). */
    return pick + '<section class="sec"><div class="w">'+
      '<div class="sec-hd sec-hd-c">'+
        '<p class="eyebrow">분야별로 자세히</p>'+
        '<h2>정리에 필요한 것 전부</h2>'+
        '<p>어느 분야에 무엇이 있는지 먼저 보고 싶으시면 펼쳐 보세요. '+
          '고르시는 것은 아래에서 하시면 됩니다.</p>'+
      '</div>'+
      FoldAll("cl-all", "분야 "+all.length+"개 펼쳐 보기", "접기")+
      '<div class="cat-g cat-g4 is-fold-all" id="cl-all">'+
        all.map(function(c){ return CatCard(c, i); }).join("")+
      '</div>'+
    '</div></section>';
  }

  var g = amCloseCatsFor(sel.key, i);
  return pick + (sel.key === "lost" ? CloseAsk(base) : "") +
  '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">고르신 것에 맞춰</p>'+
      '<h2>'+esc(sel.name.replace(/[.?]$/, ""))+' — 이것부터입니다</h2>'+
      '<p>'+esc(sel.lead)+'</p>'+
    '</div>'+
    '<div class="cat-g cat-g4">'+
      g.hit.map(function(c){ return CatCard(c, i); }).join("")+
    '</div>'+
    /* ⚠️ 나머지도 **접어서** 그대로 둡니다 — 숨기면 그 사장님에게는
       그 기능이 없는 것이 됩니다 (§0-3). */
    (g.rest.length
      ? '<div class="sec-hd sec-hd-sub sec-hd-c">'+
          '<h2 class="pg-h2">나머지도 그대로 있습니다</h2>'+
          '<p>해당 없으면 건너뛰셔도 됩니다.</p>'+
        '</div>'+
        FoldAll("cl-rest", "나머지 "+g.rest.length+"개 보기", "접기")+
        '<div class="cat-g cat-g4 is-fold-all" id="cl-rest">'+
          g.rest.map(function(c){ return CatCard(c, i); }).join("")+
        '</div>'
      : "")+
    /* ⚠️⚠️ **신청 단추를 여기서 뺐습니다** (§5 · §6). 바로 아래
       바구니(`PickBasket`)가 **신청 단추를 들고 있는 유일한 자리**
       입니다 — 둘을 두면 ① 어느 쪽을 눌러야 하는지 모르고 ② 여기
       단추는 **고르신 것을 안 들고 갑니다** (`quoteTo` 는 분류 하나
       뿐입니다). 운영 전문관에서 신청 단추가 셋이었던 것을 하나로
       줄인 것과 같은 자리입니다.
       ⚠️ 체크리스트 단추도 뺐습니다 — 아래 계산도구 구간이 받습니다
       (한 화면에 같은 데로 가는 단추를 둘 두지 않습니다). */
  '</div></section>';
}

/* ── /closure/:industry ─────────────────────────────────────────── */
/* ── 고르신 상황의 순서 (2026-10-08 §15 · §16 · §17) ──────────────
   ⚠️⚠️ **`AM_PROCESS` 의 key 를 바꿔 끼울 뿐입니다** — 세 로드맵이
   전부 `journey.js` 한 곳에 있고 `/transfer` 도 같은 것을 씁니다.
   여기에 또 적으면 두 곳이 어긋납니다 (§19 콘텐츠 중복 방지).
   ⚠️ 상황을 안 고르셨으면 **전체 절차(closing)** 가 기본입니다 —
   고르는 것이 의무가 되면 안 됩니다. */
var CLOSE_PROC = {
  pass:  { key:"acq-out",   kicker:"TRANSFER PROCESS",
           title:"매장을 넘길 때는 이 순서입니다",
           lead:"통째로 넘기면 철거비와 원상복구가 줄어듭니다. 조건부터 정합니다.",
           note:"매물에 적는 평수 · 보증금 · 월세 · 권리금 · 매출은 사장님이 적으신 값으로 나갑니다 — 저희가 확인하거나 보증하는 값이 아닙니다." },
  money: { key:"asset-out", kicker:"ASSET PROCESS",
           title:"시설 · 장비를 정리할 때는 이 순서입니다",
           lead:"버리면 비용이고 넘기면 돈입니다. 무엇이 남는지부터 적습니다.",
           note:"리스 · 할부 · 렌탈이 남은 장비는 내 것이 아닙니다 — 계약서부터 확인하세요." },
  fast:  { key:"closing",   kicker:"CLOSING PROCESS",
           title:"완전히 정리할 때는 이 순서입니다",
           lead:"기한이 있는 것이 여럿이라 순서가 곧 돈입니다.",
           note:"통째로 넘길 수 있으면 철거비와 원상복구가 줄어듭니다 — 일곱째 걸음을 먼저 보셔도 됩니다." }
};
/* ⚠️⚠️ **직원이 계시면 기한이 붙습니다** (§18 다섯째 질문의 답을
   실제로 씁니다). 해고예고 · 퇴직금 · 4대보험 상실 신고는 전부
   날짜가 정해져 있어서, 순서를 다 읽기 전에 지나가 버립니다.
   ⚠️ **기한 숫자를 여기 적지 마세요** — 근속 기간 · 사업장 규모에
   따라 갈리고, 적어 두면 틀린 날부터 거짓말입니다. 글과 업체로
   보내는 데까지입니다.
   ⚠️ 진단에서 "직원이 있다" 고 하셨을 때만 나옵니다 — 안 고르신
   분께는 안 냅니다 (답을 추측하지 않습니다). */
function StaffNote(){
  if(nowQS("staff") !== "1") return "";
  return '<section class="sec sec-white"><div class="w">'+StaffNoteBox()+'</div></section>';
}
function StaffNoteBox(){
  if(nowQS("staff") !== "1") return "";
  return '<div class="note-box">'+
      '<b>직원이 계시면 기한부터 보세요.</b>'+
      '<p>해고예고 · 퇴직금 · 4대보험 상실 신고는 날짜가 정해져 있습니다. '+
        '아래 순서를 다 읽기 전에 먼저 확인하실 자리입니다.</p>'+
      '<p class="row-cta">'+
        '<a class="btn btn-b btn-sm" href="/content/pyeeop-jigwon-jeongri">'+
          '정리할 때 직원 — 무엇을 언제'+icon("arrow",15)+'</a>'+
        '<a class="btn btn-o btn-sm" href="/providers/labor">노무 전문가 찾기</a>'+
      '</p>'+
    '</div>';
}
function ClosingProcess(ind, bare, opened){
  var w = nowQS("w");
  /* ⚠️ "아직 모르겠어요"(lost)는 **진단이 먼저**라 전체 절차를 냅니다 —
     답하신 뒤에 위 셋 중 하나로 갑니다. */
  var o = CLOSE_PROC[w] || CLOSE_PROC.fast;
  var n = amProcess(o.key).length;
  /* ⚠️⚠️ **접었습니다** (2026-10-18 §12-4). 열세 걸음에 걸음마다 꼭
     확인할 것과 링크가 붙어서, 펼쳐 둔 채로는 이 구간 하나가 폰에서
     화면 넷이었습니다 — 390px 문서가 12,713px(화면 열넷)이던 까닭의
     절반이 여기입니다.
     ⚠️⚠️ **걸음을 지우지 않았습니다** — 접힌 것도 DOM 에 그대로 있어
     크롤러 · 링크 검사 · 색인이 안 바뀝니다. 창업 준비의 체크리스트
     (`StartChecklist`)가 쓰는 것과 **같은 꼴**입니다 (§3 통일).
     ⚠️ `StaffNote()` 는 **접지 않습니다** — 직원이 있으시면 기한이
     붙는 일이라, 펼치지 않아도 보여야 합니다.
     ⚠️ 머리말에 "읽는 자리이고 신청은 아래에서" 를 적습니다 — 위
     바구니가 신청 단추를 들고 있는 유일한 자리입니다 (§5 · §6). */
  /* 2026-11-19 — bare 면 구간 껍데기 없이 /closure 의 정리 순서 구역 안에 들어갑니다. */
  if(bare){
    return '<div class="stD hfl-road">'+
      '<div class="sec-hd sec-hd-sub"><h3 class="pg-h2">'+esc(o.title)+'</h3>'+
        '<p>'+esc(n + "걸음입니다. " + o.lead)+' 걸음마다 꼭 확인할 것과 기한을 적어 두었습니다.</p></div>'+
      StaffNoteBox()+
      FoldAll("cl-road", "자세한 정리 순서 "+n+"걸음 보기", "접기", "", !!opened)+
      '<div class="'+(opened ? "" : "is-fold-all")+'" id="cl-road">'+
        ProcessBand({ key:o.key, bare:true, industry:"", note:o.note })+
      '</div></div>';
  }
  return StaffNote() +
    '<section class="sec sec-white stD"><div class="w">'+
      '<div class="sec-hd sec-hd-c">'+
        '<p class="eyebrow">'+esc(o.kicker)+'</p>'+
        '<h2>'+esc((ind ? ind.name + " — " : "") + o.title)+'</h2>'+
        '<p>'+esc(n + "걸음입니다. " + o.lead)+' '+
          '<b>여기는 읽는 자리이고 신청은 위에서 합니다.</b></p>'+
      '</div>'+
      FoldAll("cl-road", "정리 순서 "+n+"걸음 보기", "접기")+
      '<div class="is-fold-all" id="cl-road">'+
        ProcessBand({ key:o.key, bare:true, industry: ind ? ind.key : "",
                      note:o.note })+
      '</div>'+
    '</div></section>';
}

/* ── §20 간단 진단 — "아직 모르겠어요" 를 고르셨을 때 ──────────────
   ⚠️⚠️ **질문 수를 최소화합니다** (지시서 §20). 넷입니다 — 다섯째부터는
   설문이 되고, 이미 지쳐 계신 분께 숙제를 하나 더 드리는 것입니다.
   ⚠️⚠️ **답을 안 하신 항목을 임의로 추정하지 않습니다** (§20). 아무것도
   안 고르시면 단추가 "모르는 채로 순서대로 보기" 로만 갑니다.
   ⚠️⚠️ **아무것도 저장하지 않습니다.** 서버로도 localStorage 로도 보내지
   않고, 고르신 것은 그 자리에서 **갈 곳 하나를 고르는 데**만 씁니다 —
   저장하는 것처럼 보이면 하지 않은 일을 했다고 말하는 것입니다
   (절대 규칙 5). 화면에 그렇게 적혀 있습니다. 지우지 마세요.
   ⚠️ 판정은 규칙 셋뿐이고 "AI 가 분석했습니다" 라고 하지 않습니다. */
var CLOSE_ASK = [
  { k:"open",  q:"지금도 영업 중이신가요?" },
  { k:"lease", q:"임대차 계약이 아직 남아 있나요?" },
  { k:"hand",  q:"매장을 넘길 생각이 있으신가요?" },
  { k:"equip", q:"쓸 만한 시설 · 장비가 남아 있나요?" },
  /* ⚠️ 2026-10-08 §18 의 다섯째입니다. 직원이 있으면 해고예고 ·
     퇴직금 · 상실 신고에 **기한**이 붙어서 순서가 달라집니다. */
  { k:"staff", q:"직원이 있으신가요?" }
];
window.closeAskGo = function(base){
  var on = {};
  CLOSE_ASK.forEach(function(a){
    var e = document.getElementById("ask-" + a.k);
    on[a.k] = !!(e && e.checked);
  });
  /* ⚠️ 규칙은 둘뿐이고 "AI 가 분석했습니다" 라고 하지 않습니다
     (절대 규칙 5). 넘길 생각이 있으면 **양도가 제일 먼저**입니다 —
     양도가 되면 철거비도 원상복구도 안 드는 경우가 있습니다.
     그 다음이 "쓸 만한 것이 남았는가" 이고, 둘 다 아니면 전체 절차. */
  var w = on.hand ? "pass" : (on.equip ? "money" : "fast");
  /* ⚠️⚠️ **직원이 있으면 기한이 붙습니다** — 해고예고 · 퇴직금 ·
     상실 신고. 순서를 바꾸지는 않고 그 걸음으로 바로 가는 길을
     같이 냅니다 (`?w=` 와 함께 주소에 실립니다). */
  /* 2026-11-26 — 첫 구간(SitFlow)의 진단이면 다시 그린 뒤 그 결과로 내려갑니다 */
  var sit = !!document.getElementById("sit");
  go(base + "?w=" + encodeURIComponent(w) + (on.staff ? "&staff=1" : ""), sit ? { keepScroll:true, focus:"sit-res" } : {});
};
function CloseAsk(base, bare){
  return (bare ? '<div class="cask cask-in">' : '<section class="sec sec-white cask"><div class="w">')+
    '<div class="sec-hd">'+
      '<p class="eyebrow">짧게 네 가지만</p>'+
      '<h2>지금 상황을 알려 주시면 순서를 맞춰 드립니다</h2>'+
      '<p>해당하는 것만 체크하세요. 모르시는 것은 비워 두셔도 됩니다 — '+
        '비운 칸을 저희가 추측하지 않습니다.</p>'+
    '</div>'+
    '<ul class="cask-l">'+CLOSE_ASK.map(function(a){
      return '<li><label class="cask-i" for="ask-'+esc(a.k)+'">'+
        '<input type="checkbox" id="ask-'+esc(a.k)+'">'+
        '<span>'+esc(a.q)+'</span></label></li>';
    }).join("")+'</ul>'+
    '<p class="row-cta"><button type="button" class="btn btn-b btn-lg" '+
      'onclick="closeAskGo(\''+esc(base)+'\')">맞는 순서 보기'+icon("arrow",18)+'</button></p>'+
    /* ⚠️ 하지 않는 저장을 한다고 적지 않습니다 (절대 규칙 5) */
    '<p class="sec-note">'+icon("lock",15)+
      /* ⚠️ `**굵게**` 를 쓰지 마세요 — 이 자리는 mark() 를 안 거쳐서
         별표가 **글자로 찍힙니다** (전수 점검이 잡습니다). */
      ' 체크하신 내용은 <b>아무 데도 저장되지 않습니다.</b> 어느 순서를 '+
      '먼저 보여 드릴지 고르는 데에만 씁니다.</p>'+
  (bare ? '</div>' : '</div></section>');
}

function PageClosureIndustry(ind){
  return PgHero({
    crumb: Crumb([["폐업","/closure"],[ind.name]]),
    kicker:"CLOSE · " + ind.name,
    /* ⚠️ §5 의 맞춤 결과 머리말. ⚠️⚠️ 폐업을 **실패로 말하지 않습니다**
       — "잘 정리하는 것도 사업입니다" 까지입니다. */
    h1raw:esc(ind.name)+" 정리를<br class=\"br-m\"> 준비하고 계시네요.",
    lead:"순서가 있는 일입니다. 지금부터 필요한 차례와 걸음마다 꼭 확인할 것을 보여 드립니다.",
    /* 2026-11-26 — 창업 업종 상세와 같은 업종 공통 사진 */
    photo:picKey("ind", ind.key),
    cta:'<a class="btn btn-b btn-lg" href="'+esc(quoteTo({industry:ind.key,side:"close"}))+'">'+
        '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/assets?i='+encodeURIComponent(ind.key)+'">'+
        '시설 · 집기 내놓기</a>'
  })+
  /* ⚠️⚠️ **순서가 맨 앞입니다** (§5). 전에는 시설 매각 · 희망 조건이
     먼저였는데, 정리하시는 분이 제일 먼저 묻는 것은 "무엇부터 하나"
     입니다. 아래 구간들은 그대로 둡니다 (§1). */
  /* ⚠️ 업종 화면에서도 **고르신 상황의 순서**를 냅니다 (§15 · §16 · §17) —
     여기만 열세 걸음으로 두면 같은 사이트에서 두 가지 말을 합니다. */
  ClosingProcess(ind)+
  (ind.equip && ind.equip.length ? SellBand(ind) : "")+
  WantBand(ind)+
  BridgeFor(ind, "close")+
  ReadBand({ side:"close", industry:ind.key,
             title:"정리할 때 자주 막히는 것" })+
  ClosureHelpBand();
}

/* 업종 장비를 **파는 쪽**에서 본 것 (§24) */
function SellBand(ind){
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+esc(ind.name)+' 정리</p>'+
      '<h2>이 장비들은 버리지 마세요</h2>'+
      '<p>같은 업종을 준비하는 사장님이 찾습니다. 개별로도, 일괄로도, '+
        '시설 전체 인수로도 넘길 수 있는 것들입니다.</p>'+
    '</div>'+
    '<ul class="chip-g">'+ind.equip.map(function(e){
      return '<li><a class="chip" href="/assets?i='+encodeURIComponent(ind.key)+
        '&s='+encodeURIComponent(e.key)+'">'+esc(e.name)+'</a></li>';
    }).join("")+
    (ind.stock||[]).map(function(s){
      return '<li><a class="chip chip-2" href="/assets?i='+encodeURIComponent(ind.key)+
        '&c=stock">'+esc(s)+'</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

/* ── 창업 ↔ 폐업 이어 주기 (§34) ────────────────────────────────
   ⚠️ **없으면 구간째 뺍니다.** 빈 목록을 두면 "여긴 아무것도 없네" 가
   되고, 지어낸 매물로 채우면 그게 허위매물입니다. */
function BridgeFor(ind, side){
  var m = amMatchForStartup(ind.key, "");
  var n = m.stores.length + m.assets.length;
  if(side === "start"){
    if(!n) return "";
    return '<section class="sec"><div class="w band-cta band-cta-b">'+
      '<div><p class="eyebrow">창업 ↔ 폐업</p>'+
        '<h2>정리하시는 '+esc(ind.name)+'에서 나온 것</h2>'+
        '<p class="lead">지금 '+n+'건이 올라와 있습니다. 새로 사는 것보다 싸고, '+
          '시설을 그대로 인수하면 공사 기간이 줄어듭니다.</p></div>'+
      '<a class="btn btn-b btn-lg" href="/assets?i='+encodeURIComponent(ind.key)+'">'+
        '보러 가기'+icon("arrow",18)+'</a>'+
    '</div></section>';
  }
  return '<section class="sec"><div class="w band-cta band-cta-b">'+
    '<div><p class="eyebrow">창업 ↔ 폐업</p>'+
      '<h2>한 사장님의 끝이 다른 사장님의 시작이 됩니다</h2>'+
      '<p class="lead">점포 · 시설 · 집기 · 재고를 올려 두시면 같은 업종을 '+
        '준비하는 사장님에게 보입니다. 등록은 무료입니다.</p></div>'+
    '<a class="btn btn-b btn-lg" href="/assets?i='+encodeURIComponent(ind.key)+'">'+
      '내놓기'+icon("arrow",18)+'</a>'+
  '</div></section>';
}

/* 막다른 길을 두지 않습니다 — 어디서 막히든 다음 한 걸음을 줍니다 */
function StartupHelpBand(){
  return '<section class="sec sec-white"><div class="w help-g">'+
    /* 2026-11-19 — 접수가 닫혀 있으면 이 카드는 견적 화면이 아니라 접수 안내로 갑니다 (일반 견적 기준). */
    HelpCard("doc","무엇부터 할지 모르겠다면","견적 요청서를 한 번만 적으시면 조건에 맞는 업체들에 같이 전달합니다.","/quote","견적 요청하기", ' data-cta="on" data-cta-form="quote" hidden')+
    HelpCard("doc","무엇부터 할지 모르겠다면","지금은 견적 접수를 받지 않습니다. 접수 방법과 지금 쓰실 수 있는 길을 확인하세요.","/intake","접수 안내 보기", ' data-cta="off" data-cta-form="quote"')+
    HelpCard("won","돈이 걱정이라면","창업자금과 정책자금 중 조건에 맞는 것을 모아 둡니다.","/support","지원사업 보기")+
    HelpCard("book","먼저 알아보고 싶다면","창업비용 · 권리금 · 인허가처럼 실제로 막히는 것만 정리했습니다.","/content","정보 보기")+
  '</div></section>';
}
function ClosureHelpBand(){
  return '<section class="sec sec-white"><div class="w help-g">'+
    HelpCard("list","순서를 모르겠다면","폐업 절차와 필요서류, 기한이 있는 것부터 정리했습니다.","/c/process","폐업 절차 보기")+
    HelpCard("badge","지원을 받으실 수 있는지","철거비 지원처럼 조건만 맞으면 신청할 수 있는 것이 있습니다.","/support","폐업지원 보기")+
    /* ⚠️⚠️ **이 카드를 `/quote` 로 바로 보내지 마세요.** 고르신 것을
       안 들고 가서, 손님은 위에서 고른 것이 사라진 빈 신청 화면을
       봅니다 — 한 화면에 신청으로 가는 길이 둘이면 어느 쪽이 맞는지도
       흐려집니다 (§2 · §5). 고르는 자리로 보냅니다. */
    /* 2026-11-25 — 이 띠는 /closure/<업종> 에만 나오고 그 화면에는 #pick 이 없어 눌러도 아무 일이 없었습니다.
       폐업 화면의 고르기 구역으로 넘깁니다. 접수 상태와 상관없이 맞는 말로 둡니다 ("전달합니다" 를 약속하지 않음). */
    HelpCard("doc","여러 곳 견적을 한 번에","철거 · 원상복구 · 폐기물처럼 필요한 것을 한곳에서 함께 고릅니다.","/closure","필요한 것 고르기",
      ' onclick="return hhGoJump(\'/closure\',\'pick\')"')+
  '</div></section>';
}
function HelpCard(ic, t, p, to, label, attr){
  return '<a class="help" href="'+esc(to)+'"'+(attr || "")+'>'+
    '<span class="help-ic">'+icon(ic,20)+'</span>'+
    '<b>'+esc(t)+'</b><span class="help-p">'+esc(p)+'</span>'+
    '<span class="help-go">'+esc(label)+icon("arrow",15)+'</span></a>';
}

/* ── /c/:cat — 정보 · 매물 성격의 분류 ──────────────────────────── */
function PageCat(cat){
  var side = amCatSide(cat.key);
  var ind  = nowQS("i");
  var items = amCatItems(cat, ind);
  return PgHero({
    crumb: Crumb([[side === "start" ? "창업" : "폐업", side === "start" ? "/startup" : "/closure"],[cat.name]]),
    kicker:(side === "start" ? "START" : "CLOSE") + " · " + cat.lead,
    h1:cat.name,
    lead:cat.desc,
    /* 2026-11-26 §8 — 그 분야 일의 연출 사진 (AM_PIC_CAT · 없으면 머리 그대로) */
    photo:picKey("cat", cat.key)
  })+
  '<section class="sec sec-white"><div class="w">'+
    (items.length
      ? '<ul class="chip-g">'+items.map(function(i){
          var to = i.to || (cat.to || "");
          return '<li>'+(to
            ? '<a class="chip" href="'+esc(to)+'">'+esc(i.name)+'</a>'
            : '<span class="chip chip-flat">'+esc(i.name)+'</span>')+'</li>';
        }).join("")+'</ul>'
      : "")+
    Empty({
      icon:cat.icon,
      title:"아직 여기에 올라온 것이 없습니다",
      text:"실제 업체와 자료가 확인된 것만 올립니다. 그동안에는 견적 요청 화면에서 "+
           "지금 접수를 받는지 확인하실 수 있습니다.",
      cta:'<a class="btn btn-b" href="'+esc(quoteTo({cat:cat.key,industry:ind,side:side}))+'">'+
          '견적 요청하기'+icon("arrow",16)+'</a>'+
          '<a class="btn btn-o" href="/join">이 분야 업체라면 입점하기</a>'
    })+
  '</div></section>'+
  /* §6 의 ②③④⑤ — 업체를 찾는 분류와 **같은 함수**입니다
     (js/pages/providers.js 의 SvcPageBands).
     ⚠️ 두 벌로 만들면 같은 구간이 화면마다 달라집니다.
     ⚠️ 내용이 없는 분류는 빈 문자열이라 지금 화면과 같습니다. */
  SvcPageBands(cat, items)+
  /* 여기서 막히신 분께 그 자리에서 답을 냅니다 — 맞는 글이 없으면
     구간째 빠집니다 */
  ReadBand({ cat:cat.key, side:side, industry:ind,
             title:cat.name+"에서 자주 막히는 것" });
}


/* ── /g/:stage — 사업 단계 하나 (2026-10-04 구조 개편) ───────────────
   메인의 여섯 카드가 도착하는 자리입니다. **메인은 단순하게, 내부는
   전문적으로** (§15) — 여기서 그 단계의 분류를 전부 펼칩니다.

   ⚠️⚠️ **분류를 새로 만들지 않습니다.** `catalog.js` 의 분류를
   `lifecycle.js` 가 묶어 둔 차례대로 그릴 뿐이고, 카드를 누르면
   원래 있던 분류 화면(`/providers/:cat` · `/c/:cat` · `/stores` ·
   `/assets` · `/support`)으로 갑니다 — 새 빈 화면을 만들지 않습니다.
   ⚠️ 업체를 여기서 나열하지 마세요. 여기는 "무엇이 필요한지" 를
   고르는 자리입니다 (§54). */
function PageStage(st){
  var cats = amStageCats(st);
  var ind  = nowQS("i");
  /* 단계가 들고 있는 하위 서비스를 **세어서** 냅니다 — 손으로 적지
     않습니다 (분류를 늘리면 저절로 따라옵니다). */
  var n = cats.reduce(function(a, c){ return a + amCatItems(c, ind).length; }, 0);
  var side = (st.side === "both") ? "" : st.side;
  return PgHero({
    crumb: Crumb([["사업 단계","/"],[st.name]]),
    kicker:"STEP " + st.no + " · " + st.sub,
    h1:st.name,
    /* ⚠️ 단계 이름 뒤에 조사를 붙이지 마세요 — 이름에 가운뎃점이
       들어 있어 "폐업 · 정리 에" 가 됩니다 (분류 화면에서 "원상복구
       에서" 로 한 번 겪은 자리입니다). "이 단계" 로 받습니다.
       ⚠️ 숫자는 **세는 값**입니다. 분류를 늘리면 저절로 따라옵니다. */
    lead:st.lead + " 이 단계에 필요한 분야 " + cats.length +
         (n ? "가지와 세부 서비스 " + n + "가지를 모았습니다." : "가지를 모았습니다."),
    cta:'<a class="btn btn-b btn-lg" href="'+esc(quoteTo({industry:ind, side:side || "start"}))+'">'+
        '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/join">이 분야 업체라면 입점하기</a>'
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<ul class="cat-g">'+
      cats.map(function(c){ return '<li>'+CatCard(c, ind)+'</li>'; }).join("")+
      /* 분류가 아닌 화면(프랜차이즈)은 직접 적은 한 장까지입니다 */
      (st.extra || []).map(function(x){
        return '<li><a class="cat" href="'+esc(x.to)+'">'+
          '<span class="cat-ic">'+icon(x.icon,22)+'</span>'+
          '<b>'+esc(x.name)+'</b>'+
          '<span class="cat-l">'+esc(x.lead)+'</span>'+
          '<span class="cat-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
        '</a></li>'; }).join("")+
    '</ul>'+
  '</div></section>'+
  /* 이웃한 단계로 바로 넘어갈 수 있게 — 사업은 한 단계에서 끝나지
     않습니다. ⚠️ 여섯을 다 내지 않고 **앞뒤 하나씩**만 냅니다. */
  StageNear(st)+
  ReadBand({ side:side, industry:ind,
             title:st.name+"에서 자주 막히는 것" });
}

/* 앞뒤 단계 — 차례가 곧 사업의 흐름이라, 끝에서는 한쪽만 나옵니다 */
function StageNear(st){
  var L = (window.AM_STAGES || []);
  var i = L.indexOf(st);
  if(i < 0) return "";
  var near = [L[i-1], L[i+1]].filter(Boolean);
  if(!near.length) return "";
  return '<section class="sec sec-cream"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">이 앞뒤로는</p>'+
      '<h2>사업은 한 단계에서 끝나지 않습니다</h2></div>'+
    /* ⚠️ 카드 생김새는 `StageCard()` **한 곳**입니다 (home.js) —
       여기에 또 적으면 메인과 단계 화면이 서로 달라집니다. */
    '<ul class="mstg-g mstg-g-near">'+near.map(function(s){
      return '<li>'+StageCard(s)+'</li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* ── 창업을 과정으로 (§7) ────────────────────────────────────────
   분류 열세 개를 늘어놓으면 손님이 그걸 공부해야 합니다. 사장님이
   알고 싶은 것은 **"지금 어디까지 왔고 다음에 뭘 해야 하는가"**
   입니다.

   ⚠️ **단계는 업종과 무관하게 같습니다.** 갈리는 것은 단계 **안**의
   하위 서비스입니다 — 카페 3단계에 커피머신, 미용 3단계에 샴푸대.
   ⚠️ **어느 단계에도 안 든 분류가 없어야 합니다.** 빠지면 그 분류가
   조용히 사라집니다 — `check.js` 가 개수를 맞춰 봅니다. */
function StepBand(ind){
  var steps = (window.AM_START_STEPS || []);
  if(!steps.length) return "";
  var i = ind ? ind.key : "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      /* ⚠️⚠️ **바로 위 `ProcessBand()` 와 같은 말을 하지 마세요.**
         저쪽은 "무엇부터 하나요"(할 일 열둘)이고 여기는 "어느 분야가
         있나요"(분야 열셋을 네 묶음으로)입니다. 둘 다 "순서" 라고
         적었더니 **같은 구간을 두 번 낸 것**으로 읽혔습니다 —
         찍어 보고 알았습니다. */
      '<p class="eyebrow">분야로 찾기</p>'+
      '<h2>'+(ind ? esc(ind.name)+' 창업에 필요한 분야' : '창업에 필요한 분야 전부')+'</h2>'+
      '<p>분류를 외우실 필요 없습니다. 지금 하실 단계만 보세요 — '+
        '필요 없는 것은 건너뛰셔도 됩니다.</p>'+
    '</div>'+
    '<ol class="stp-l">'+ steps.map(function(st){
      var cs = (window.amStepCats ? amStepCats(st, i) : []);
      /* ⚠️ 분류가 하나도 없는 단계는 통째로 뺍니다 (절대 규칙 2) */
      if(!cs.length) return "";
      return '<li class="stp">'+
        '<div class="stp-h">'+
          '<span class="stp-n">STEP '+esc(st.n)+'</span>'+
          '<b class="stp-t">'+esc(st.name)+'</b>'+
          '<span class="stp-d">'+esc(st.lead)+'</span>'+
        '</div>'+
        '<div class="stp-c">'+ cs.map(function(c){
          var items = (window.amCatItems ? amCatItems(c, i) : []).slice(0, 5);
          return '<a class="stp-i'+tn(c.tone)+'" href="'+esc(catTo(c))+
            (i ? '?i='+encodeURIComponent(i) : '')+'">'+
            '<span class="stp-i-ic">'+icon(c.icon,20)+'</span>'+
            '<b>'+esc(c.name)+'</b>'+
            /* ⚠️⚠️ **빈 카드를 두지 마세요** (절대 규칙 2). 하위가
               업종에서 오는 분류(`시설 · 장비`)는 업종을 안 고르면 셀
               것이 0 이라 **이름만 덩그러니** 남습니다 — "이 분야는
               준비가 덜 됐나" 로 읽힙니다. 숫자를 지어내지 않고
               데이터에 **처음부터 있던** `lead` 를 냅니다.
               ⚠️ 메인의 분야 격자에서 똑같이 겪고 고쳤던 자리인데,
               그 격자가 /startup 으로 옮겨 오면서 **같은 고장이 따라
               왔습니다.** 전수 점검이 잡았습니다. */
            '<span class="stp-i-s">'+
              (items.length
                ? items.map(function(x){ return esc(x.name); }).join(" · ")
                : esc(c.lead || ""))+'</span>'+
            '<span class="stp-i-go" aria-hidden="true">'+icon("arrow",15)+'</span>'+
          '</a>';
        }).join("")+'</div>'+
      '</li>';
    }).join("")+'</ol>'+
  '</div></section>';
}

/* ════════════════════════════════════════════════════════════════════
   2026-11-26 모바일 사용성 개편 — 창업 · 폐업의 첫 구간 (SitFlow)
   ════════════════════════════════════════════════════════════════════ */
function sitSteps(key, n){
  return (typeof amProcess === "function" ? amProcess(key) : []).slice(0, n || 3).map(function(s){ return [s.name, s.lead || ""]; });
}
function sitIds(L){ return (L || []).filter(function(x){ return typeof amPickOne === "function" && amPickOne(x); }); }

/* 창업 — 새로 창업 / 기존 매장 인수 + 업종. 고르신 것은 주소(?how= · ?i=)에만 실립니다. */
window.startSitGo = function(){
  var i = $("sit-i") ? $("sit-i").value : "", how = nowQS("how");
  var q = []; if(i) q.push("i=" + encodeURIComponent(i)); if(how) q.push("how=" + encodeURIComponent(how));
  go("/startup" + (q.length ? "?" + q.join("&") : ""), { keepScroll:true, focus:how ? "sit-res" : "sit" });
};
function StartSit(ind){
  var how = nowQS("how");
  var indOk = !!(ind && typeof amIndustry === "function" && amIndustry(ind));
  var indN = indOk ? amIndustryName(ind) : "";
  var iq = indOk ? "?i=" + encodeURIComponent(ind) : "", ia = indOk ? "&i=" + encodeURIComponent(ind) : "";
  return SitFlow({ id:"sit", key:"how", base:"/startup", keep:{ i:indOk ? ind : "" }, side:"start",
    tone:"sec-white", kicker:"창업 시작하기", title:"어떻게 시작하세요?",
    lead:"고르시면 바로 아래에 지금 할 일과 다음 행동이 나옵니다. 업종을 같이 고르시면 그 업종 기준으로 바뀝니다.",
    sel:(how === "new" || how === "take") ? how : "",
    opts:[{ k:"new", b:"새로 창업", d:"빈 자리에 내 매장을 처음부터", ph:"insu-startup", ia:"store" },
          { k:"take", b:"기존 매장 인수", d:"영업 중인 매장을 넘겨받아 시작", ph:"kind-take", ia:"handover" }],
    extra:'<div class="sitf-ind"><label for="sit-i">업종</label>'+
      IndustrySelect("sit-i", indOk ? ind : "", "startSitGo()", "업종을 골라 주세요")+
      (indOk ? '<span class="sitf-ind-on">'+icon("check",14)+' '+esc(indN)+' 기준</span>' : '')+'</div>',
    res:function(k){
      var take = k === "take";
      return {
        title:(indN ? indN + " · " : "") + (take ? "기존 매장 인수 — 지금 할 일" : "새로 창업 — 지금 할 일"),
        lead:take ? "인수는 들어가는 돈보다 넘겨받는 조건(권리금 · 임대차 · 시설)을 먼저 확인하는 일입니다."
                  : "자리 · 예산 · 업종 조건을 먼저 정리하면 업체 견적이 정확해집니다.",
        todo:sitSteps(take ? "acq-in" : "startup", 3),
        pick:{ side:"start", title:"맡길 서비스 고르기",
          ids:sitIds(take ? ["law/lease","transfer/premium","repair/check-up","interior/interior","it/pos","admin/tax-agent"]
                          : (typeof amPickTopIds === "function" ? amPickTopIds("startup", indOk ? ind : "") : [])) },
        main:take ? { href:"/tools/vs" + iq, t:"신규 vs 인수 비용 비교", ic:"calc" }
                  : { href:"/tools/cost" + iq, t:"창업비 계산하기", ic:"calc" },
        more:(take ? [{ href:"/stores" + iq, t:"인수 가능한 매장 보기", ic:"search" },
                      { href:"/providers/law" + iq, t:"계약 · 법률 업체 보기" }]
                   : [{ href:"/providers/interior" + iq, t:"인테리어 업체 보기", ic:"search" },
                      { href:"/providers" + iq, t:"분야별 업체 전체" }])
          .concat([{ href:indOk ? "/startup/" + encodeURIComponent(ind) + (take ? "?how=take" : "") : "#st-ig",
                     t:indOk ? indN + " 준비 순서 전체" : "업종별 준비 순서" }])
      };
    } });
}

/* 폐업 — 매장 전체 양도 / 집기 정리 / 완전 폐업 / 아직 모르겠어요 (주소 ?w= — 밖으로 나간 링크가 이 값을 씁니다) */
function CloseSit(){
  var w = nowQS("w");
  var CQ = "/quote?mode=close&from=closure-sit";
  return SitFlow({ id:"sit", key:"w", base:"/closure", side:"close",
    tone:"sec-white", kicker:"폐업 · 정리 시작하기", title:"지금 어떤 상황이세요?",
    lead:"정리하기 전에 넘길 수 있는 것부터 확인하면 철거비와 원상복구비가 줄어듭니다.",
    sel:["pass","money","fast","lost"].indexOf(w) >= 0 ? w : "",
    /* 2026-11-26 모바일 시안 §5 — 대표 지시 문구 · 차례 (철거가 급해요 → 집기 → 양도 → 모르겠어요).
       ⚠️ key(fast · money · pass · lost)는 그대로입니다 — 밖으로 나간 링크(?w=)가 그 값을 들고 있습니다.
       ⚠️ 차례만 바뀌었고, 각 결과의 '지금 할 일'은 그대로 양도 · 처분 가능성을 먼저 짚습니다. */
    opts:[{ k:"fast", b:"철거가 급해요", d:"전체 철거 · 상가 원상복구를 한 번에", ph:"insu-closure", ia:"demolish" },
          { k:"money", b:"집기만 정리할래요", d:"쓸 만한 장비 · 가구 처분", ph:"as-furniture", ia:"equip" },
          { k:"pass", b:"매장을 넘기고 싶어요", d:"권리금 · 시설째 다음 사장님께", ph:"kind-pass", ia:"handover" },
          { k:"lost", b:"아직 모르겠어요", d:"다섯 가지만 답하면 길을 알려 드려요", ph:"kp-cl-pro-consult", ia:"bulb" }],
    res:function(k){
      if(k === "pass") return { title:"매장을 넘기고 싶어요 — 양도 준비",
        lead:"양도가 되면 철거도 원상복구도 하지 않을 수 있습니다. 넘길 조건부터 정리하세요.",
        todo:sitSteps("acq-out", 3),
        pick:{ side:"close", ids:sitIds(["transfer/store-transfer","asset/kitchen-eq","asset/furniture","tax/close-report"]) },
        main:{ href:"/sell", t:"매장 내놓기 등록", ic:"handover", gate:"sell" }, mainFirst:true,
        more:[{ href:"/tools/premium", t:"권리금 따져 보기", ic:"calc" }, { href:"/transfer?t=out", t:"넘기는 순서 전체" }] };
      if(k === "money") return { title:"집기만 정리할래요 — 품목부터 고르세요",
        lead:"붙박이(떼면 못 쓰는 것)와 떼어 옮길 수 있는 것을 나누면 팔 것과 버릴 것이 갈립니다.",
        todo:sitSteps("asset-out", 3),
        pick:{ side:"close", ids:sitIds(["asset/kitchen-eq","asset/fridge","asset/furniture","waste/biz-waste"]) },
        main:{ href:"/assets?p=pick", t:"처분할 집기 고르기", ic:"equip" },
        more:[{ href:"/sell?t=asset", t:"시설 · 장비 내놓기" }, { href:"/tools/closecost", t:"정리 비용 계산" }] };
      if(k === "fast") return { title:"철거가 급해요 — 전체 철거 · 원상복구를 한 신청에",
        lead:"전체 철거와 상가 원상복구를 바로 아래에서 함께 고르시면 한 번의 신청(접수번호 하나)에 같이 담깁니다.",
        todo:sitSteps("closing", 4).slice(1),
        pick:{ side:"close", title:"맡길 정리 서비스 고르기",
          ids:sitIds(["demolish/full","restore/shop-restore","demolish/partial","demolish/sign","waste/biz-waste","asset/kitchen-eq"]),
          note:"철거와 원상복구를 함께 고르시면 한 신청에 담기고, 업체는 서비스마다 따로 연결해 드립니다." },
        main:{ href:"/tools/closecost", t:"폐업 예상비용 계산", ic:"calc" },
        more:[{ href:"/tools/close", t:"폐업 체크리스트" }, { href:"/providers/demolish", t:"철거 업체 보기" }] };
      return { title:"아직 모르겠어요 — 먼저 다섯 가지만 확인해요",
        lead:"영업 중인지 · 임대차가 남았는지 · 넘길 생각이 있는지 · 쓸 만한 시설이 있는지 · 직원이 있는지로 길이 갈립니다. 적으신 것은 저장하지 않습니다.",
        todo:[["넘길 수 있는지","양도가 되면 철거 · 원상복구가 줄어듭니다"],["남은 계약","임대차 · 렌탈 · 통신 계약을 확인합니다"],["정리 비용","철거 · 원상복구 · 폐기물을 미리 따져 봅니다"]],
        more:[{ href:CQ, t:"상황만 적어 상담 신청" }, { href:"/tools/close", t:"폐업 체크리스트" }],
        /* 기존 진단(CloseAsk)을 그대로 — 고르시면 ?w= 가 바뀌어 이 자리의 결과가 바뀝니다 */
        after:CloseAsk("/closure", true) };
    } });
}

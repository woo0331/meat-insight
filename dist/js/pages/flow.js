

var START_CALC      = ["cost", "vs", "premium", "rent"];
var START_CALC_TONE = { cost:"sv1", vs:"sv2", premium:"t13", rent:"sv3" };

function PageStartup(){
  var ind = nowQS("i");
  var top = amPickTop("startup", ind), rest = amPickRest("startup", ind);

  return StartIntro(ind) + StartKpSvc(ind) + StartKpRoad(ind) + StartKpCalc(ind) + StartKpInd() +
    StartPickBand(top, rest, ind) + PickBasket() +

    PackPickBand("start") +
    StartGuideBand(ind) +

    StartApplyBand() +
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
    return { n:x.name, d:x.lead || "", href:"/startup/" + encodeURIComponent(k), ic:x.icon || "store", go:"준비 순서 보기" }; }).filter(Boolean);
  return KpCards({ id:"st-ig", tone:"sec-white", kicker:"업종별 창업 가이드",
    title:"업종별 창업 준비 과정", lead:"업종마다 준비 순서와 필요한 장비가 다릅니다.", items:L,
    after:'<div class="kp-all">'+FoldAll("st-ind", "전체 업종 "+(window.AM_INDUSTRIES||[]).length+"개 보기", "접기")+
      '<div class="is-fold-all hsg-all-l" id="st-ind">'+IndustryGroupChips("/startup", nowQS("g"))+IndustryGrid("/startup","", nowQS("g"))+'</div></div>',
    note:"업종을 고르시면 그 업종에 흔히 필요한 서비스부터 앞에 놓습니다 — 조회수나 신청 건수 같은 통계가 아니라 저희가 추려 둔 차례입니다." });
}

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

    more:'<div class="kx-more">'+FoldAll("st-road", "자세한 체크리스트 "+n+"걸음 보기", "접기")+
      '<div class="is-fold-all" id="st-road">'+ProcessBand({ key:"startup", bare:true, industry:ind || "" })+'</div></div>' });
}

function StartIntro(ind){
  var indOk = !!(ind && typeof amIndustry === "function" && amIndustry(ind));
  var indN  = indOk ? amIndustryName(ind) : "";

  return HallHero({

    side:"start", photo:"insu-startup",

    kicker:"창업 준비 서비스",
    h1raw:"성공하는 창업,<br><em>"+esc((typeof koWith === "function" ? koWith(amBrand(), "와과") : amBrand()))+" 함께</em><br>시작하세요.",

    leadHtml:'<span data-cta="off">상권 분석부터 인테리어, 설비, 인허가까지 창업에 필요한 서비스와 준비 정보를 확인하세요.</span>'+
             '<span data-cta="on" hidden>상권 분석부터 인테리어, 설비, 인허가까지 창업에 필요한 서비스를 고르고 한 번에 신청하세요.</span>',
    quote: quoteTo({ side:"start", industry:ind || "" }),
    goName:"무료 상담 신청하기",

    second:'<a class="btn btn-lg hh-o" href="/tools/cost'+(indOk ? "?i=" + encodeURIComponent(ind) : "")+'">'+icon("calc",18)+' 창업 비용 계산하기</a>',

    cardTitle:"무엇부터 해 볼까요?", qfirst:true,
    quick:[{ ic:"calc", b:"창업비 계산하기", d:"빠뜨리기 쉬운 비용 항목을 늘어놓고 받은 견적을 더해 봅니다",
             go:(indN ? indN + " 예산 따져 보기" : "예산 미리 따져 보기"),
             href:"/tools/cost" + (indOk ? "?i=" + encodeURIComponent(ind) : "") },
           { ic:"seed", b:"업종별 준비 보기", d:"업종마다 준비 순서 · 필요한 장비가 다릅니다",
             go:(indN ? indN + " 준비 순서 보기" : "업종 고르고 순서 보기"),
             href:(indOk ? "/startup/" + encodeURIComponent(ind) : "#st-ig") }]
  });
}

function StartSignature(ind){
  var L = (window.AM_INDUSTRIES || []).filter(function(x){ return x.key !== "etc"; }).slice(0, 6);
  return '<section class="sec sec-white hsg"><div class="w hsg-in">'+
    '<form class="hsg-calc" onsubmit="return stCalcGo(event)">'+
      '<h2>창업 비용 계산기</h2>'+

      '<p>빠뜨리기 쉬운 창업 비용 항목을 늘어놓고, 받으신 견적을 적으면 합계를 보여 드립니다. 항목은 업종과 관계없이 같고, 고르신 업종은 결과 아래 준비 순서 · 업체 · 가이드를 그 업종으로 이어 드립니다. 적으신 값은 저장하지 않습니다.</p>'+
      '<div class="f-r"><label for="st-calc-i">업종 <small>(모든 업종 선택 가능 · 서비스 추천 순서와 함께 쓰입니다)</small></label>'+IndustrySelect("st-calc-i", ind || "", "stIndSync(this.value)", "업종을 고르지 않음")+'</div>'+
      '<button class="btn btn-b btn-lg" type="submit">'+icon("calc",18)+' 창업비 정리표 열기</button>'+
      '<p class="hsg-tl"><span>다른 계산도구</span>'+
        '<a href="/tools/vs">새로 차리기 vs 인수</a><a href="/tools/premium">권리금 회수</a><a href="/tools/rent">임대료 비율</a></p>'+
    '</form>'+
    '<div class="hsg-ind" id="st-ig">'+

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

window.stIndSync = function(v){
  go("/startup" + (v ? "?i=" + encodeURIComponent(v) : ""), { keepScroll:true });
};
window.stCalcGo = function(e){
  if(e && e.preventDefault) e.preventDefault();
  var v = (document.getElementById("st-calc-i") || {}).value || "";
  go("/tools/cost" + (v ? "?i=" + encodeURIComponent(v) : ""));
  return false;
};

function StartPickBand(top, rest, ind){

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

      '<a class="sec-more" href="/providers'+(ind ? "?i=" + encodeURIComponent(ind) : "")+'">분야별 업체 · 정보 보기'+icon("chev",15)+'</a>'+
    '</div>'+

    '<div class="stB-ind">'+
      '<label class="stB-ind-l" for="st-indsel">서비스 추천 순서 — 업종을 고르시면 그 업종에 '+
        '흔히 필요한 것부터 보여 드립니다</label>'+
      '<div class="stB-ind-r">'+

        IndustrySelect("st-indsel", ind || "", "startIndGo()", "업종을 고르지 않음")+
        '<span class="stB-ind-n">선택하지 않아도 됩니다</span>'+
      '</div>'+
    '</div>'+
    (on && indN
      ? '<p class="stB-why">'+esc(indN)+' 창업에 흔히 필요한 순서로 '+
        '저희가 추려 둔 것입니다. <b>이용 통계가 아닙니다</b> — 필요 없는 '+
        '것은 그냥 끄시고, 빠진 것은 아래 전체 서비스에서 더 고르시면 됩니다.</p>'
      : "")+

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

window.startIndGo = function(){
  var sel = document.getElementById("st-indsel");
  var v   = sel ? sel.value : "";
  go("/startup" + (v ? "?i=" + encodeURIComponent(v) : ""), { keepScroll:true });
};

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

function StartGuideBand(ind){
  return ReadBand({ side:"start", industry:ind || "", limit:4,
                    title:"창업 전에 알아 두면 좋은 것" });
}

function StartApplyBand(){
  var n = (typeof amPickCount === "function") ? amPickCount() : 0;
  return '<section class="sec sec-cream stF"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">STEP 02</p>'+

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

    '<p class="sec-note">'+icon("info",15)+
      ' 접수 뒤 담당자가 내용을 보고 연락드립니다. 회신 시점을 '+
      '약속드리지는 않습니다.</p>'+
  '</div></section>';
}

function PageStartupIndustry(ind){
  var cats = amCatsFor(ind.key, "start");
  var fcat = amFranchiseCat(ind.key);
  return PgHero({
    crumb: Crumb([["창업","/startup"],[ind.name]]),
    kicker:"START · " + ind.name,

    h1raw:esc(ind.name)+" 창업을<br class=\"br-m\"> 준비하고 계시네요.",
    lead:"지금부터 필요한 순서입니다. 걸음마다 꼭 확인할 것과 맡길 곳을 같이 보여 드립니다.",
    cta:'<a class="btn btn-b btn-lg" href="'+esc(quoteTo({industry:ind.key,side:"start"}))+'">'+
        '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/stores?i='+encodeURIComponent(ind.key)+'">'+
        ind.name+' 점포 보기</a>'
  })+

  StartWayBand(ind)+

  StartAskBand(ind)+

  (startWay() === "take"
    ? ProcessBand({ key:"acq-in", kicker:"TAKE OVER PROCESS",
        title:ind.name+" 매장 인수, 무엇부터 하나요?",
        lead:amProcess("acq-in").length+"걸음입니다. 권리금과 시설이 같이 오는지, "+
             "임대차가 승계되는지가 금액을 가릅니다.",
        industry:ind.key, tone:"sec-gray",
        note:"매물에 적힌 평수 · 보증금 · 월세 · 권리금 · 매출은 올리신 "+
             "사장님이 적으신 값이고, 저희가 확인하거나 보증하는 값이 아닙니다." })
    : ProcessBand({ key:"startup", kicker:"STARTUP PROCESS",
        title:ind.name+" 창업, 무엇부터 하나요?",

        lead:amProcess("startup").length+"걸음입니다. 걸음마다 "+ind.name+
             "에 맞는 업체 · 장비 · 글로 바로 넘어갑니다.",
        industry:ind.key, tone:"sec-gray" }))+
  (ind.equip && ind.equip.length ? EquipBand(ind) : "")+
  StepBand(ind)+
  (fcat ? FranchiseHint(fcat, ind) : "")+
  BridgeFor(ind, "start")+
  ReadBand({ side:"start", industry:ind.key,
             title:"창업에서 자주 막히는 것" })+
  StartupHelpBand();
}

function startWay(){ return nowQS("how") === "take" ? "take" : "new"; }
var START_WAYS = [
  { k:"new",  ic:"seed",     n:"새로 창업하기",
    d:"자리를 찾고 공사부터 시작합니다", s:"상권 · 입지부터 영업 시작까지" },
  { k:"take", ic:"handover", n:"기존 매장 인수하기",
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

      var to = (w.k === "new") ? base : (base + "?how=" + w.k);
      return '<a class="swt-c'+(on ? " on" : "")+'" href="'+esc(to)+'"'+
        (on ? ' aria-current="true"' : '')+'>'+
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
  '</div></section>';
}

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

    '<p class="sec-note">'+icon("lock",15)+
      ' 고르신 것은 <b>아무 데도 저장되지 않습니다.</b> 주소에만 실려 '+
      '아래 순서를 맞추고 견적 요청에 그대로 넘어갑니다.</p>'+
    StartAskResult(ind, v)+
  '</div></section>';
}

function StartAskResult(ind, v){
  var key  = (startWay() === "take") ? "acq-in" : "startup";
  var L    = amProcess(key);
  var stg  = window.amStartPick ? amStartPick("AM_START_STAGE", v.st) : null;
  var bud  = window.amStartPick ? amStartPick("AM_START_BUD", v.b) : null;
  var when = window.amStartPick ? amStartPick("AM_START_WHEN", v.when) : null;
  var rn   = v.r ? amRegionName(v.r) : "";
  if(!stg && !bud && !when && !rn) return "";

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

function EquipBand(ind){
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+esc(ind.name)+' 전용</p>'+
      '<h2>이 업종에 필요한 장비</h2>'+

      '<p>업종마다 다릅니다. 새로 사실 수도 있고, 정리하시는 곳에서 '+
        '중고로 인수하실 수도 있습니다.</p>'+
      '<a class="sec-more" href="/assets?i='+encodeURIComponent(ind.key)+'">'+
        '중고 시설 · 장비 보기'+icon("chev",15)+'</a>'+
    '</div>'+
    '<ul class="chip-g">'+ind.equip.map(function(e){
      return '<li><a class="chip" href="/providers/equip?s='+encodeURIComponent(e.key)+
        '&i='+encodeURIComponent(ind.key)+'">'+esc(e.name)+'</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

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

function CloseKpSvc(){
  var L = [
    kxSvc("transfer", "", "매장 양도", "넘기면 철거 · 원상복구가 줄어듭니다", "handover", "insu-transfer"),
    kxSvc("asset", "", "중고 집기 매각", "주방기기 · 냉장고 · 가구 처분", "box", "svc-equip"),
    kxSvc("demolish", "", "철거 · 원상복구", "무엇을 뜯는지부터 · 계약 조건에 맞게", "demolish", "hero-close"),
    kxSvc("tax", "", "폐업 세무", "폐업 신고 · 부가세 · 종합소득세", "tax", "kp-cl-svc-tax")
  ].filter(Boolean);
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
    items:W.map(function(x, i){ return { n:x.org, d:x.what, href:x.url, ic:ic[i % ic.length], ia:"", go:"사이트 열기" }; }),
    note:"지원 대상인지 · 얼마를 받는지는 그 기관이 심사합니다. 저희는 지급을 약속하지 않습니다." });
}

function PageClosure(){

  var path  = nowQS("p") === "all" ? "all" : (nowQS("p") === "pick" ? "pick" : "");
  var sel   = PickGroupBand("closure", "close") + PickBasket("close") +
              PackPickBand("close");

  return ClosureIntro(path) + CloseKpSvc() + CloseKpRoad() + CloseKpCalc() +
    ClosureFlow(path) + ClosureDemoBand() +
    sel+
    ClosureMoreBand()+

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

var CLOSE_CALC      = ["close", "closecost", "premium"];
var CLOSE_CALC_TONE = { close:"sv4", closecost:"sv5", premium:"t13" };

function ClosureIntro(path){

  return HallHero({
    side:"close", photo:"insu-closure",
    kicker:"폐업 · 철거 서비스",
    h1raw:"매장 정리부터 철거까지<br>폐업의 모든 과정을<br><em>"+esc((typeof koWith === "function" ? koWith(amBrand(), "이가") : amBrand()))+" 함께합니다.</em>",
    lead:"복잡하고 부담스러운 폐업 절차, 철거 · 원상복구 · 집기 정리 · 세무까지 순서대로 짚어 드립니다. 바로 철거하기 전에 넘길 수 있는 것부터 확인하세요.",

    quote: "/quote?mode=close&from=closure-hero", ctaForm:"close",
    goName:"무료 상담 신청하기",

    second:'<a class="btn btn-lg hh-o" href="/tools/closecost">'+icon("calc",18)+' 예상 비용 계산하기</a>',
    leadM:"철거 · 원상복구 · 집기 정리 · 세무까지, 넘길 수 있는 것부터 확인하세요.",

    cardTitle:"이런 고민이 있으신가요?",

    quick:[{ ic:"handover", b:"매장을 넘길 수 있는지 보기", d:"넘기면 철거비 · 원상복구비가 줄어듭니다",
             go:"양도 순서 보기", href:"/transfer?t=out" },
           { ic:"clock", b:"철거 일정이 급해요", d:"양도 검토 없이 철거 준비로 바로 갑니다",
             go:"철거 준비 보기", goOn:"집기 처분 + 철거 상담 신청",
             href:"#cl-demo", on:CLOSE_QUICK_URGENT },
           { ic:"box", b:"집기 · 설비 처분", d:"주방기기 · 냉장고 · 가구를 정리합니다",
             go:"시설 · 집기 처분 보기", goOn:"집기 처분 상담 신청",
             href:"/assets", on:CLOSE_QUICK_ASSET }]
  });
}

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

var CLOSE_QUICK_URGENT = "/quote?mode=close&from=closure-urgent&sv=" +
  encodeURIComponent("asset/kitchen-eq,demolish/full");
var CLOSE_QUICK_ASSET  = "/quote?mode=close&from=closure-asset&sv=" +
  encodeURIComponent("asset/kitchen-eq,asset/furniture");

var CLOSE_FLOW = [
  ["handover", "매장 양도 검토",   "넘기면 철거비 · 원상복구비가 줄어듭니다", "/transfer?t=out"],
  ["box",      "집기 · 설비 처분", "주방기기 · 가구 · 비품을 팔 길",        "/assets"],
  ["hammer",   "철거 견적",        "무엇을 뜯는지부터 정리",                "/providers/demolish"],
  ["roller",   "원상복구",         "임대 계약 조건에 맞는 범위",            "/providers/restore"],
  ["doc",      "폐업 신고 · 지원", "신고 순서와 지원사업 찾는 곳",          "/c/process"],
  ["calc",     "세무 정리",        "부가세 · 종합소득세 등 폐업 세무",       "/providers/tax"]
];
function ClosureFlow(path){

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

    '<div class="hfl-job"><b>업체에 맡기면</b><ol>'+
      ["상담 접수", "현장 확인 · 견적", "작업 진행", "완료 · 확인"].map(function(t, i){
        return '<li><span aria-hidden="true">'+(i+1)+'</span>'+esc(t)+'</li>'; }).join("")+
    '</ol><small>기간과 비용은 평수 · 공사 범위 · 건물 조건에 따라 다릅니다.</small></div>'+
    '<div class="hfl-more">'+
      ClosingProcess(null, true, openRoad)+
      '<p class="row-cta hfl-links">'+
        '<a class="btn btn-o" href="/c/process">'+icon("list",16)+' 폐업 신고 순서 · 필요서류</a>'+
        '<a class="btn btn-o" href="/tools/close">'+icon("check",16)+' 폐업 체크리스트</a>'+
        '<a class="btn btn-o" href="#cl-cost" onclick="return hhJump(\'cl-cost\')">'+icon("calc",16)+' 예상 비용 계산</a>'+
        '<a class="btn btn-o" href="#cl-sup" onclick="return hhJump(\'cl-sup\')">'+icon("badge",16)+' 폐업 지원사업 찾는 곳</a>'+
      '</p>'+
      ClosureWantFold(wSel)+
    '</div>'+
  '</div></section>';
}

function ClosureWantFold(sel){
  var wants = (window.AM_CLOSE_WANTS || []);
  if(!wants.length) return "";
  var list = '<ul class="wnt-l">'+ wants.map(function(w){
      var on = (sel && sel.key === w.key);
      return '<li><a class="wnt'+(on?" on":"")+'" href="'+
        esc("/closure?w=" + encodeURIComponent(w.key))+'"'+
        (on ? ' aria-current="true"' : '')+'>'+
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
  return '<div class="hfl-want">'+
    FoldAll("cl-want", "어디서부터 시작할지 모르겠어요", "접기", "", !!sel)+
    '<div class="'+(sel ? "" : "is-fold-all")+'" id="cl-want">'+
      '<p class="hfl-want-p">상황을 고르시면 그에 맞는 순서와 분야를 앞으로 꺼내 드립니다.</p>'+
      list + hit +
    '</div></div>';
}

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
        '<span class="wnt-ic">'+icon(w.icon,20)+'</span>'+
        '<b>'+esc(w.name)+'</b>'+
        '<span class="wnt-l-d">'+esc(w.lead)+'</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';

  if(!sel){

    var all = (window.amCatsFor ? amCatsFor(i, "close") : (window.AM_CLOSE_CATS||[]));

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

  '</div></section>';
}

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

  var o = CLOSE_PROC[w] || CLOSE_PROC.fast;
  var n = amProcess(o.key).length;

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

var CLOSE_ASK = [
  { k:"open",  q:"지금도 영업 중이신가요?" },
  { k:"lease", q:"임대차 계약이 아직 남아 있나요?" },
  { k:"hand",  q:"매장을 넘길 생각이 있으신가요?" },
  { k:"equip", q:"쓸 만한 시설 · 장비가 남아 있나요?" },

  { k:"staff", q:"직원이 있으신가요?" }
];
window.closeAskGo = function(base){
  var on = {};
  CLOSE_ASK.forEach(function(a){
    var e = document.getElementById("ask-" + a.k);
    on[a.k] = !!(e && e.checked);
  });

  var w = on.hand ? "pass" : (on.equip ? "money" : "fast");

  go(base + "?w=" + encodeURIComponent(w) + (on.staff ? "&staff=1" : ""));
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

    '<p class="sec-note">'+icon("lock",15)+

      ' 체크하신 내용은 <b>아무 데도 저장되지 않습니다.</b> 어느 순서를 '+
      '먼저 보여 드릴지 고르는 데에만 씁니다.</p>'+
  (bare ? '</div>' : '</div></section>');
}

function PageClosureIndustry(ind){
  return PgHero({
    crumb: Crumb([["폐업","/closure"],[ind.name]]),
    kicker:"CLOSE · " + ind.name,

    h1raw:esc(ind.name)+" 정리를<br class=\"br-m\"> 준비하고 계시네요.",
    lead:"순서가 있는 일입니다. 지금부터 필요한 차례와 걸음마다 꼭 확인할 것을 보여 드립니다.",
    cta:'<a class="btn btn-b btn-lg" href="'+esc(quoteTo({industry:ind.key,side:"close"}))+'">'+
        '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/assets?i='+encodeURIComponent(ind.key)+'">'+
        '시설 · 집기 내놓기</a>'
  })+

  ClosingProcess(ind)+
  (ind.equip && ind.equip.length ? SellBand(ind) : "")+
  WantBand(ind)+
  BridgeFor(ind, "close")+
  ReadBand({ side:"close", industry:ind.key,
             title:"정리할 때 자주 막히는 것" })+
  ClosureHelpBand();
}

function SellBand(ind){
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+esc(ind.name)+' 정리</p>'+
      '<h2>이 장비들은 버리지 마세요</h2>'+
      '<p>같은 업종을 준비하는 사장님이 찾습니다. 개별로도, 일괄로도, '+
        '시설 전체 인수로도 내놓으실 수 있습니다.</p>'+
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

function StartupHelpBand(){
  return '<section class="sec sec-white"><div class="w help-g">'+

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

    HelpCard("doc","여러 곳 견적을 한 번에","한 번만 적으시면 철거 · 원상복구 · 폐기물 업체에 같이 전달합니다.","#pick","필요한 것 고르기")+
  '</div></section>';
}
function HelpCard(ic, t, p, to, label, attr){
  return '<a class="help" href="'+esc(to)+'"'+(attr || "")+'>'+
    '<span class="help-ic">'+icon(ic,20)+'</span>'+
    '<b>'+esc(t)+'</b><span class="help-p">'+esc(p)+'</span>'+
    '<span class="help-go">'+esc(label)+icon("arrow",15)+'</span></a>';
}

function PageCat(cat){
  var side = amCatSide(cat.key);
  var ind  = nowQS("i");
  var items = amCatItems(cat, ind);
  return PgHero({
    crumb: Crumb([[side === "start" ? "창업" : "폐업", side === "start" ? "/startup" : "/closure"],[cat.name]]),
    kicker:(side === "start" ? "START" : "CLOSE") + " · " + cat.lead,
    h1:cat.name,
    lead:cat.desc
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

  SvcPageBands(cat, items)+

  ReadBand({ cat:cat.key, side:side, industry:ind,
             title:cat.name+"에서 자주 막히는 것" });
}

function PageStage(st){
  var cats = amStageCats(st);
  var ind  = nowQS("i");

  var n = cats.reduce(function(a, c){ return a + amCatItems(c, ind).length; }, 0);
  var side = (st.side === "both") ? "" : st.side;
  return PgHero({
    crumb: Crumb([["사업 단계","/"],[st.name]]),
    kicker:"STEP " + st.no + " · " + st.sub,
    h1:st.name,

    lead:st.lead + " 이 단계에 필요한 분야 " + cats.length +
         (n ? "가지와 세부 서비스 " + n + "가지를 모았습니다." : "가지를 모았습니다."),
    cta:'<a class="btn btn-b btn-lg" href="'+esc(quoteTo({industry:ind, side:side || "start"}))+'">'+
        '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/join">이 분야 업체라면 입점하기</a>'
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<ul class="cat-g">'+
      cats.map(function(c){ return '<li>'+CatCard(c, ind)+'</li>'; }).join("")+

      (st.extra || []).map(function(x){
        return '<li><a class="cat" href="'+esc(x.to)+'">'+
          '<span class="cat-ic">'+icon(x.icon,22)+'</span>'+
          '<b>'+esc(x.name)+'</b>'+
          '<span class="cat-l">'+esc(x.lead)+'</span>'+
          '<span class="cat-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
        '</a></li>'; }).join("")+
    '</ul>'+
  '</div></section>'+

  StageNear(st)+
  ReadBand({ side:side, industry:ind,
             title:st.name+"에서 자주 막히는 것" });
}

function StageNear(st){
  var L = (window.AM_STAGES || []);
  var i = L.indexOf(st);
  if(i < 0) return "";
  var near = [L[i-1], L[i+1]].filter(Boolean);
  if(!near.length) return "";
  return '<section class="sec sec-cream"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">이 앞뒤로는</p>'+
      '<h2>사업은 한 단계에서 끝나지 않습니다</h2></div>'+

    '<ul class="mstg-g mstg-g-near">'+near.map(function(s){
      return '<li>'+StageCard(s)+'</li>'; }).join("")+'</ul>'+
  '</div></section>';
}

function StepBand(ind){
  var steps = (window.AM_START_STEPS || []);
  if(!steps.length) return "";
  var i = ind ? ind.key : "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+

      '<p class="eyebrow">분야로 찾기</p>'+
      '<h2>'+(ind ? esc(ind.name)+' 창업에 필요한 분야' : '창업에 필요한 분야 전부')+'</h2>'+
      '<p>분류를 외우실 필요 없습니다. 지금 하실 단계만 보세요 — '+
        '필요 없는 것은 건너뛰셔도 됩니다.</p>'+
    '</div>'+
    '<ol class="stp-l">'+ steps.map(function(st){
      var cs = (window.amStepCats ? amStepCats(st, i) : []);

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

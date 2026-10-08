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

/* ── /startup — 업종 고르기 ─────────────────────────────────────── */
function PageStartup(){
  return PgHero({
    kicker:"START · 창업",
    h1raw:"어떤 사업을<br class=\"br-m\"> 준비하고 계세요?",
    lead:"업종만 고르시면 그 업종 창업에 실제로 필요한 것만 추려 드립니다. 가입 없이 무료입니다."
  })+
  '<section class="sec sec-white"><div class="w">'+
    IndustryGrid("/startup","")+
  '</div></section>'+
  /* ⚠️ **할 일 먼저, 분야는 그 다음**입니다. 분야 묶음을 먼저 내면
     손님이 "인테리어 · 시공" 이라는 말을 모를 때 첫 화면이 전부 남의
     말이 됩니다 (메인에서 분류 열 개를 걷어낸 것과 같은 까닭입니다).
     준비 과정 열두 걸음 — 2026-10-05 V2 §4.
     ⚠️ `StepBand()` 와 다른 것입니다. 저쪽은 **큰 흐름 넷**이고
     이쪽은 **실제로 할 일 열둘**이라 걸음마다 정보 · 업체 · 도구가
     걸립니다. 둘 다 둡니다 — 큰 그림을 보고 들어와 할 일을 봅니다. */
  ProcessBand({ key:"startup", kicker:"STARTUP PROCESS",
    title:"창업 준비, 무엇부터 하나요?",
    lead:amProcess("startup").length+"걸음입니다. 걸음마다 읽을 것 · 맡길 곳 · 계산할 것을 바로 열어 보실 수 있습니다.",
    note:"업종을 고르시면 걸음마다 그 업종에 맞는 장비 · 업체 · 글로 좁혀집니다." })+
  /* 업종을 아직 안 고르셨어도 **분야**는 같습니다 */
  StepBand(null)+
  StartupHelpBand()+
  JourneyBand({ current:"startup", tone:"sec-white",
    title:"다른 것도 준비하고 계신가요?",
    lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." });
}

/* ── /startup/:industry — 그 업종의 창업 전부 ────────────────────── */
function PageStartupIndustry(ind){
  var cats = amCatsFor(ind.key, "start");
  var fcat = amFranchiseCat(ind.key);       /* 같은 key 면 그 분류로 보냅니다 */
  return PgHero({
    crumb: Crumb([["창업","/startup"],[ind.name]]),
    kicker:"START · " + ind.name,
    /* ⚠️ 2026-10-06 2차 §5 — 상황과 업종을 고르고 도착하는 **맞춤 결과
       화면**입니다. 머리말이 "무엇을 고르셨는지" 를 되읽어 주어야
       손님이 "내 자리에 왔다" 를 압니다. */
    h1raw:esc(ind.name)+" 창업을<br class=\"br-m\"> 준비하고 계시네요.",
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
        industry:ind.key, tone:"sec-gray",
        note:"매물에 적힌 평수 · 보증금 · 월세 · 권리금 · 매출은 올리신 "+
             "사장님이 적으신 값이고, 저희가 확인하거나 보증하는 값이 아닙니다." })
    : ProcessBand({ key:"startup", kicker:"STARTUP PROCESS",
        title:ind.name+" 창업, 무엇부터 하나요?",
        /* ⚠️ 걸음 수를 손으로 적지 마세요 — 열둘이던 때 적어 둔 "열두
           걸음" 이 열넷이 된 뒤에도 그대로 남아 있었습니다. 세는 값입니다. */
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

/* ── 어떻게 시작할 계획이세요? (2026-10-08 §13 STEP 02) ───────────
   ⚠️⚠️ **새 로드맵 데이터를 만들지 않았습니다.** 인수 쪽 여덟 걸음은
   `AM_PROCESS["acq-in"]` 에 **이미 있던 것**이고 `/transfer?t=in` 이
   같은 것을 씁니다 — 여기에 또 적으면 두 곳이 어긋납니다 (§22
   콘텐츠 중복 방지).
   ⚠️ 두 카드의 크기 · 무게가 같아야 합니다. 한쪽을 작게 만들면 그게
   "덜 중요한 것" 이라는 말입니다.
   ⚠️ 카드가 통째로 눌립니다 — 안에 또 링크를 넣지 마세요. */
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
      /* ⚠️ 기본값(새로 창업)은 주소를 깨끗하게 둡니다 — 같은 내용이
         두 주소로 나가면 구글이 둘 다 무시합니다. */
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
    '<ul class="chip-g">'+ind.equip.map(function(e){
      return '<li><a class="chip" href="/providers/equip?s='+encodeURIComponent(e.key)+
        '&i='+encodeURIComponent(ind.key)+'">'+esc(e.name)+'</a></li>';
    }).join("")+'</ul>'+
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
function PageClosure(){
  return PgHero({
    kicker:"CLOSE · 폐업 · 정리",
    /* ⚠️⚠️ **2026-10-08 지시서 §16 의 첫 메시지 그대로입니다.**
       "어떻게 정리하고 싶으세요" 는 이미 정리하기로 정하신 분께 묻는
       말인데, 이 화면이 제일 먼저 할 일은 **넘길 수 있는 것이 있는지**
       를 알려 드리는 것입니다 — 양도가 되면 철거비도 원상복구비도
       안 드는 경우가 있습니다.
       ⚠️ **폐업을 실패로 말하지 않습니다** (§6). "잘 정리하는 것도
       사업입니다" 까지입니다 — 손실 · 실패를 적지 마세요. */
    h1raw:"폐업하기 전에,<br class=\"br-m\"> 넘길 수 있는 것부터 확인하세요.",
    lead:"매장과 시설, 장비를 바로 철거하기 전에 다음 사장님에게 이어질 수 " +
         "있는지 먼저 확인해보세요. 순서와 기한이 있는 일이라 빠뜨리면 돈이 나갑니다."
  })+
  WantBand(null)+
  '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">업종을 고르시면</p>'+
      '<h2>업종마다 정리할 것이 다릅니다</h2>'+
      '<p>헬스장은 운동기구와 락커가, 음식점은 주방과 닥트가 남습니다.</p>'+
    '</div>'+
    IndustryGrid("/closure","")+
  '</div></section>'+
  /* ⚠️⚠️ **2026-10-08 지시서 §15 · §16 · §17 — 고르신 상황마다 순서가
     다릅니다.** 전에는 어느 상황을 고르셔도 **같은 열세 걸음**이
     나왔습니다 — 장비만 파시려는 분께 직원 정리와 폐업 신고부터
     읽히는 꼴이었습니다.
     ⚠️ **새 화면을 만들지 않았습니다** — `AM_PROCESS` 를 바꿔 끼웁니다.
     ⚠️ **폐업을 철거업체 연결 서비스로 만들지 않습니다** (§17 — "폐업을
     선택했다고 무조건 철거부터 안내하지 않는다"). 어느 길이든 양도
     가능성을 먼저 짚습니다. */
  ClosingProcess(null)+
  ClosureHelpBand()+
  JourneyBand({ current:"closing",
    title:"다른 것도 준비하고 계신가요?",
    lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." });
}

/* ── 폐업은 목록이 아니라 **무엇을 원하시는가**부터 (§8) ──────────
   폐업 화면에 들어오자마자 분류 열두 개를 늘어놓으면, 이미 지쳐
   계신 분께 숙제를 하나 더 드리는 것입니다.

   ⚠️ **고르신 것에 없는 분류를 숨기지 마세요.** 추린 것 아래에
   나머지도 냅니다 — 숨기면 그 사장님에게는 그 기능이 없는 것이
   됩니다. `check.js` 가 개수를 셉니다. */
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
    /* 아직 안 고르셨으면 분류 전부를 그대로 냅니다 — 고르는 것이
       의무가 되면 안 됩니다 */
    var all = (window.amCatsFor ? amCatsFor(i, "close") : (window.AM_CLOSE_CATS||[]));
    return pick + '<section class="sec"><div class="w">'+
      '<div class="sec-hd">'+
        '<p class="eyebrow">고르지 않고 보셔도 됩니다</p>'+
        '<h2>정리에 필요한 것 전부</h2>'+
      '</div>'+
      '<div class="cat-g cat-g4">'+
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
      ? '<div class="sec-hd sec-hd-sub">'+
          '<h2 class="pg-h2">나머지도 그대로 있습니다</h2>'+
          '<p>해당 없으면 건너뛰셔도 됩니다.</p>'+
        '</div>'+
        '<div class="cat-g cat-g4">'+
          g.rest.map(function(c){ return CatCard(c, i); }).join("")+
        '</div>'
      : "")+
    '<div class="row-cta"><a class="btn btn-b btn-lg" href="'+
      esc(quoteTo({industry:i, side:"close"}))+'">'+
      '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/tools/close">폐업 체크리스트</a></div>'+
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
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="note-box">'+
      '<b>직원이 계시면 기한부터 보세요.</b>'+
      '<p>해고예고 · 퇴직금 · 4대보험 상실 신고는 날짜가 정해져 있습니다. '+
        '아래 순서를 다 읽기 전에 먼저 확인하실 자리입니다.</p>'+
      '<p class="row-cta">'+
        '<a class="btn btn-b btn-sm" href="/content/pyeeop-jigwon-jeongri">'+
          '정리할 때 직원 — 무엇을 언제'+icon("arrow",15)+'</a>'+
        '<a class="btn btn-o btn-sm" href="/providers/labor">노무 전문가 찾기</a>'+
      '</p>'+
    '</div>'+
  '</div></section>';
}
function ClosingProcess(ind){
  var w = nowQS("w");
  /* ⚠️ "아직 모르겠어요"(lost)는 **진단이 먼저**라 전체 절차를 냅니다 —
     답하신 뒤에 위 셋 중 하나로 갑니다. */
  var o = CLOSE_PROC[w] || CLOSE_PROC.fast;
  var n = amProcess(o.key).length;
  return StaffNote() + ProcessBand({ key:o.key, kicker:o.kicker, tone:"sec-white",
    title:(ind ? ind.name + " — " : "") + o.title,
    lead:n + "걸음입니다. " + o.lead,
    industry: ind ? ind.key : "",
    note:o.note });
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
  go(base + "?w=" + encodeURIComponent(w) + (on.staff ? "&staff=1" : ""));
};
function CloseAsk(base){
  return '<section class="sec sec-white cask"><div class="w">'+
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
  '</div></section>';
}

function PageClosureIndustry(ind){
  return PgHero({
    crumb: Crumb([["폐업","/closure"],[ind.name]]),
    kicker:"CLOSE · " + ind.name,
    /* ⚠️ §5 의 맞춤 결과 머리말. ⚠️⚠️ 폐업을 **실패로 말하지 않습니다**
       — "잘 정리하는 것도 사업입니다" 까지입니다. */
    h1raw:esc(ind.name)+" 정리를<br class=\"br-m\"> 준비하고 계시네요.",
    lead:"순서가 있는 일입니다. 지금부터 필요한 차례와 걸음마다 꼭 확인할 것을 보여 드립니다.",
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
    HelpCard("doc","무엇부터 할지 모르겠다면","견적 요청서를 한 번만 적으시면 조건에 맞는 업체들에 같이 전달합니다.","/quote","견적 요청하기")+
    HelpCard("won","돈이 걱정이라면","창업자금과 정책자금 중 조건에 맞는 것을 모아 둡니다.","/support","지원사업 보기")+
    HelpCard("book","먼저 알아보고 싶다면","창업비용 · 권리금 · 인허가처럼 실제로 막히는 것만 정리했습니다.","/content","정보 보기")+
  '</div></section>';
}
function ClosureHelpBand(){
  return '<section class="sec sec-white"><div class="w help-g">'+
    HelpCard("list","순서를 모르겠다면","폐업 절차와 필요서류, 기한이 있는 것부터 정리했습니다.","/c/process","폐업 절차 보기")+
    HelpCard("badge","지원을 받으실 수 있는지","철거비 지원처럼 조건만 맞으면 신청할 수 있는 것이 있습니다.","/support","폐업지원 보기")+
    HelpCard("doc","여러 곳 견적을 한 번에","한 번만 적으시면 철거 · 원상복구 · 폐기물 업체에 같이 전달합니다.","/quote","견적 요청하기")+
  '</div></section>';
}
function HelpCard(ic, t, p, to, label){
  return '<a class="help" href="'+esc(to)+'">'+
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
      text:"실제 업체와 자료가 확인된 것만 올립니다. 그동안에는 견적 요청으로 "+
           "바로 연결해 드립니다.",
      cta:'<a class="btn btn-b" href="'+esc(quoteTo({cat:cat.key,industry:ind,side:side}))+'">'+
          '견적 요청하기'+icon("arrow",16)+'</a>'+
          '<a class="btn btn-o" href="/join">이 분야 업체라면 입점하기</a>'
    })+
  '</div></section>'+
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

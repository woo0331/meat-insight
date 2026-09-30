/* ════════════════════════════════════════════════════════════════════
   랜딩 (/) — 2026-09-30 지시서

   ⚠️⚠️ **여기는 브랜드 소개 화면입니다** (§23). 실제 서비스 메인이
   아닙니다. 하는 일은 다섯 가지까지입니다 —
     ① 우리가 무엇인지  ② 어떤 문제를 푸는지
     ③ 창업과 폐업을 **둘 다** 푼다는 것  ④ 업체도 모이는 곳이라는 것
     ⑤ 실제 서비스로 들여보내는 것
   그래서 **검색 결과 · 업체 수십 개 · 프랜차이즈 수십 개 · 계산기
   전체 · MY · 복잡한 거르개를 여기 넣지 않습니다.** 그것들은 각자
   주소(`/search` · `/providers` · `/franchise` · `/tools` · `/my`)에
   이미 있고, 헤더 · 푸터 · 폰 아래 네비가 거기로 보냅니다.

   ⚠️ **구간 차례는 §24 입니다.** 늘리고 싶으면 §23 을 먼저 읽으세요 —
   하나 더할 때마다 "이게 뭐 하는 곳인지" 가 그만큼 묻힙니다.

   ⚠️⚠️ **업체 · 브랜드 · 매물 · 후기 · 숫자를 지어내지 않습니다.**
   지금 업체 0곳 · 프랜차이즈 0개 · 매물 0건이고, 떠 있는 정보 카드는
   **지금 상태**("입점 파트너 모집중")를 적습니다. 숫자를 적어 두면
   그 순간 없는 회사를 광고하는 것이고 표시광고법 제3조 위반입니다.
   ════════════════════════════════════════════════════════════════════ */

function PageHome(){
  return Hero()+
         StatBar()+
         IntroBand()+
         SideCards()+
         ProblemBand()+
         BridgeBand()+
         CatBand()+
         JoinBand()+
         FinalBand();
}

/* ── ① HERO (§5 · §6) ─────────────────────────────────────────────
   ⚠️ **밝은 히어로입니다.** 사진 위에 검은 막을 씌우지 마세요 —
   글자 가독성은 **흰 그라디언트**(`.lh-veil`)로 얻습니다.
   ⚠️ 사진이 없으면 겹을 아예 안 냅니다. 없는 사진 위에 흰 막을
   덮으면 화면이 통째로 흰 판이 됩니다.
   ⚠️ 주인공은 **창업 · 폐업 두 낱말**입니다 (`.sh-n`). 여기에 적는
   칸 · 칩 · 숫자를 더하지 마세요 — 하나 더할 때마다 두 낱말이
   그만큼 작아집니다. 누를 곳도 **둘뿐**입니다.
   ⚠️ 왼쪽은 새로 시작하는 자리, 오른쪽은 정리하는 자리입니다.
   폐업 쪽 사진을 **처연하게 쓰지 마세요** (§6) — 실패가 아니라
   정리와 다음 단계입니다. */
function Hero(){
  var veil = (hasPhoto("hero-start") || hasPhoto("hero-close"))
    ? '<span class="lh-veil" aria-hidden="true"></span>' : "";
  return '<section class="lh">'+
    '<span class="lh-ph lh-ph-l">'+photoBox("hero-start","",true)+'</span>'+
    '<span class="lh-ph lh-ph-r">'+photoBox("hero-close","",true)+'</span>'+
    veil+
    '<div class="w lh-in">'+
      /* §21 — 샴페인 골드는 악센트 네 자리뿐이고 여기가 그 하나입니다 */
      '<p class="lh-k">START &amp; CLOSE</p>'+
      '<h1 class="lh-h"><em class="sh-n lh-st">창업</em>부터 '+
        '<em class="sh-n lh-cl">폐업</em>까지.</h1>'+
      '<p class="lh-h2">사장님에게 필요한 모든 것을 한 곳에서.</p>'+
      '<p class="lh-d">좋은 시작을 돕고, 안전한 정리를 지원하는 '+
        '사장님 맞춤 플랫폼입니다.</p>'+
      /* ⚠️ 두 단추는 **같은 크기**입니다 (§5). 한쪽만 키우면 다른
         쪽이 "안 해도 되는 것" 으로 읽힙니다. */
      '<div class="lh-cta">'+
        '<a class="btn btn-st btn-lg" href="/startup">창업 시작하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-cl btn-lg" href="/closure">폐업 시작하기'+icon("arrow",18)+'</a>'+
      '</div>'+
    '</div>'+
  '</section>';
}

/* ── ② 떠 있는 플랫폼 정보 (§7) ──────────────────────────────────
   ⚠️⚠️ **없는 숫자를 적지 마세요.** 지시서도 "실제 데이터가 없는
   숫자는 표시하지 않는다" 고 못박고 있습니다. 값이 없으면 **지금
   상태**를 적습니다 — "모집중" 은 사실이고 "1,200곳" 은 거짓입니다.

   ⚠️ 이 네 칸은 **배열 길이를 그 자리에서 셉니다.** 업체가 등록되면
   숫자가 저절로 나오고, 고쳐 쓸 자리가 없습니다. 손으로 숫자를 적어
   넣을 수 있는 칸을 만들지 마세요.
   ⚠️ 아래 한 줄(`.lst-n`)을 지우지 마세요. "모집중" 네 개만 보면
   무슨 뜻인지 모르고, 0 을 0 이라고 말하는 것이 절대 규칙 1 입니다. */
function StatBar(){
  var pv = (window.AM_PROVIDERS || []).length;
  var fr = (window.AM_FRANCHISES || []).length;
  var mk = (window.AM_STORES || []).length + (window.AM_ASSETS || []).length;
  var ready = !!(window.WOW_BIZ || {}).sosReady;

  var cell = [
    ["users",  "입점 업체",       pv ? pv + "곳" : "입점 파트너 모집중"],
    ["layers", "프랜차이즈 브랜드", fr ? fr + "개" : "브랜드 등록 준비중"],
    ["store",  "매장 · 시설 정보", mk ? mk + "건" : "매물 등록 시작"],
    ["mail",   "견적 · 입점 접수",
      ready ? "지금 접수받습니다" : "접수 준비중"]
  ];
  return '<section class="lst"><div class="w">'+
    '<div class="lst-c rv-stg">'+ cell.map(function(c){
      /* ⚠️ grid 칸에 맨글을 두지 않습니다 — 태그로 감쌉니다. */
      return '<div class="lst-i" data-rv>'+
        '<span class="lst-ic">'+icon(c[0],20)+'</span>'+
        '<span class="lst-k">'+esc(c[1])+'</span>'+
        '<span class="lst-v">'+esc(c[2])+'</span>'+
      '</div>';
    }).join("")+'</div>'+
    ((pv && fr && mk) ? ""
      : '<p class="lst-n">등록된 업체 · 브랜드 · 매물을 지어내지 않습니다. '+
        '지금은 모으는 중이고, 들어오는 대로 이 자리에 실제 숫자가 나옵니다.</p>')+
  '</div></section>';
}

/* ── ③ ONE STOP (§8) ──────────────────────────────────────────────
   ⚠️ 글을 가운데로 몰지 마세요 (§22). 제목은 왼쪽, 설명은 오른쪽
   칸입니다.

   아래 숫자 넉은 **규모감**입니다 — 회원 수 · 거래액이 아니라
   **우리가 다루는 범위**입니다 (그건 지금 0 이고 지어내면 절대 규칙
   1 위반입니다).
   ⚠️ **이 숫자를 손으로 적지 마세요.** 전부 `AM_INDUSTRIES` ·
   `AM_CATS` 를 그 자리에서 세는 것입니다.
   ⚠️ **`n+` 꼴로 쓰지 마세요.** "183+" 는 센 값이 아니라 부풀린
   값입니다. 센 값은 그냥 183 입니다. */
function IntroBand(){
  var ind = (window.AM_INDUSTRIES || []).length;
  var st  = (window.AM_START_CATS || []).length;
  var cl  = (window.AM_CLOSE_CATS || []).length;
  var sub = (window.AM_CATS || []).reduce(function(a, c){
    return a + ((c.items || []).length); }, 0);
  var n = [[ind,"업종"],[st,"창업 분야"],[cl,"폐업 분야"],[sub,"세부 서비스"]];

  return '<section class="lin"><div class="w">'+
    '<div class="lin-g">'+
      '<div data-rv>'+
        '<p class="lin-e">ONE STOP BUSINESS PLATFORM</p>'+
        '<h2 class="lin-h">장사의 시작과 끝,<br class="br-m"> '+
          '생각보다 해야 할 일이 많습니다.</h2>'+
      '</div>'+
      '<p class="lin-p" data-rv>필요한 업체를 <b>찾고, 비교하고, 견적을 받고, '+
        '연결합니다.</b> 인테리어 한 곳, 장비 한 곳, 세무 한 곳을 따로 '+
        '알아보시던 일을 한곳에서 하십니다.</p>'+
    '</div>'+
    /* ⚠️ 데이터가 비면 이 칸을 통째로 뺍니다 (절대 규칙 2).
       "0개 분야" 는 규모감이 아니라 미완성 표시입니다. */
    ((ind && st && cl && sub)
      ? '<div class="scale-b">'+
          '<ul class="lin-n rv-stg">'+ n.map(function(x){
            return '<li data-rv><b class="scale-n">'+x[0]+'</b>'+
              '<span>'+esc(x[1])+'</span></li>';
          }).join("")+'</ul>'+
          /* ⚠️ 이 줄을 지우지 마세요. 숫자만 크게 띄우면 "업체가
             183곳" 으로 읽힙니다. */
          '<p class="lin-nb">이 숫자는 저희가 다루는 <b>분야의 수</b>입니다. '+
            '등록된 업체 수나 거래 실적이 아닙니다.</p>'+
        '</div>'
      : "")+
  '</div></section>';
}

/* ── ④ START / CLOSE 대형 카드 (§9) ──────────────────────────────
   ⚠️ 두 카드는 **같은 크기 · 같은 무게**입니다. 폐업 쪽을 작게
   만들면 "덜 중요한 것" 으로 읽힙니다 (§6).
   ⚠️ **분류 이름을 코드에 적지 마세요.** `AM_START_CATS` ·
   `AM_CLOSE_CATS` 에서 그대로 옵니다 — 분류를 늘리면 여기도 같이
   늘고, 어긋날 자리가 없습니다.
   ⚠️ 여덟까지입니다. 열셋을 다 깔면 카드가 목록이 되고, 목록이 되면
   "골라야 하는 곳" 이 아니라 "읽어야 하는 곳" 이 됩니다. 나머지는
   `/startup` · `/closure` 에 전부 있고 단추가 바로 아래 있습니다. */
var SIDE_TINT = {
  start: ["lt-franchise","lt-interior","lt-equip","lt-pos",
          "lt-tax","lt-mkt","lt-estate","lt-food"],
  close: ["lt-demolish","lt-furniture","lt-clean","lt-estate",
          "lt-tax","lt-food","lt-pos","lt-etc"]
};
function SideCard(o){
  var cats = (o.cats || []).slice(0, 8);
  if(!cats.length) return "";
  var tint = SIDE_TINT[o.side] || [];
  return '<div class="lsc lsc-'+esc(o.cls)+'" data-rv>'+
    '<p class="lsc-k">'+esc(o.k)+'</p>'+
    '<h2 class="lsc-t">'+esc(o.t)+'</h2>'+
    '<p class="lsc-d">'+esc(o.d)+'</p>'+
    '<div class="lsc-g">'+ cats.map(function(c, i){
      return '<a class="lsc-i" href="'+esc(catTo(c))+'">'+
        '<span class="lsc-ic '+esc(tint[i % tint.length] || "lt-etc")+'">'+
          icon(c.icon,20)+'</span>'+
        '<b>'+esc(c.name)+'</b>'+
      '</a>';
    }).join("")+'</div>'+
    '<div class="lsc-m"><a class="btn btn-full" href="'+esc(o.to)+'">'+
      esc(o.go)+icon("arrow",18)+'</a></div>'+
  '</div>';
}
function SideCards(){
  var st = SideCard({
    cls:"st", side:"start", k:"START", t:"창업", to:"/startup",
    d:"새로운 사업을 시작합니다.", go:"창업 전체 보기",
    cats:(window.AM_START_CATS || [])
  });
  var cl = SideCard({
    cls:"cl", side:"close", k:"CLOSE", t:"폐업", to:"/closure",
    d:"사업을 정리합니다.", go:"폐업 전체 보기",
    cats:(window.AM_CLOSE_CATS || [])
  });
  if(!st || !cl) return "";
  return '<section class="ltwo"><div class="w">'+
    '<div class="ltwo-g">'+ st+
      /* 초록에서 주황으로 이어집니다 — 이 플랫폼이 둘 다 한다는 말 */
      '<div class="lflow" aria-hidden="true">'+
        '<span class="lflow-b"></span>'+
        '<span class="lflow-r">'+icon("refresh",34)+'</span>'+
        '<b class="lflow-t">사장님의<br> 모든 여정을<br> 한 곳에서</b>'+
        '<span class="lflow-b"></span>'+
      '</div>'+ cl+
    '</div>'+
  '</div></section>';
}

/* ── ⑤ 문제 제기 (§10) ────────────────────────────────────────────
   시각적으로 제일 센 자리입니다. 손님이 "그래 내가 그랬지" 하고
   멈추는 자리라, 여기서 설명을 늘리지 말고 **그 장면만** 보여 줍니다.
   ⚠️ 사진 자리는 비워 둡니다. "이미지 준비 중" 같은 글을 찍지
   마세요 — 없으면 옅은 면으로 자리만 지킵니다 (절대 규칙 2). */
var PB_ROW = [
  ["store",    "따로 알아보고",  "lt-estate"],
  ["interior", "따로 견적받고",  "lt-interior"],
  ["equip",    "따로 비교하고",  "lt-demolish"],
  ["it",       "따로 계약하고",  "lt-pos"],
  ["admin",    "따로 물어보고",  "lt-tax"],
  ["marketing","또 따로 맡기고", "lt-mkt"]
];
function ProblemBand(){
  var row = PB_ROW.map(function(r){
    var c = window.amCat ? amCat(r[0]) : null;
    return c ? { cat:c, sub:r[1], tint:r[2] } : null;
  }).filter(Boolean);
  if(row.length < 4) return "";

  return '<section class="lpb"><div class="w">'+
    '<h2 class="lpb-h" data-rv>장사 하나 시작하려고<br class="br-m"> '+
      '<em>몇 군데나</em> 알아보셨나요?</h2>'+
    '<div class="lpb-w">'+
      '<div class="lpb-g rv-stg">'+ row.map(function(x){
        var k = "prob-" + x.cat.key;
        /* ⚠️ 사진이 없으면 빈 액자 대신 그 분류의 아이콘입니다.
           "이미지 준비 중" 같은 글은 찍지 않습니다 (절대 규칙 2). */
        return '<div class="lpb-i" data-rv>'+
          '<span class="lpb-f '+esc(x.tint)+'">'+
            (hasPhoto(k) ? photoBox(k,"")
              : '<span class="lpb-ic" aria-hidden="true">'+icon(x.cat.icon,34)+'</span>')+
          '</span>'+
          '<span class="lpb-l"><b>'+esc(x.cat.name)+'</b>'+
            '<span>'+esc(x.sub)+'</span></span>'+
        '</div>';
      }).join("")+'</div>'+
      '<div class="lpb-r" data-rv>'+
        '<span class="lpb-ar" aria-hidden="true">'+icon("arrow",56)+'</span>'+
        '<p class="lpb-n">이제<br> <em>한곳에서.</em></p>'+
        '<p class="lpb-p">한 번만 적으시면 조건이 맞는 곳에 같이 전달합니다. '+
          '시간도, 비용도, 고민도 줄여 드립니다.</p>'+
        '<a class="btn btn-nv" href="/quote">견적 요청하기'+icon("arrow",16)+'</a>'+
      '</div>'+
    '</div>'+
  '</div></section>';
}

/* ── ⑥ 끝은 또 다른 시작 (§11) ───────────────────────────────────
   이 플랫폼의 **핵심 브랜드 장면**입니다. 색이 주황 → 남색 → 초록
   순서로 흐릅니다.
   ⚠️ **매물 목록을 여기 깔지 마세요.** 그 순간 양도양수 사이트가
   됩니다 (§54). 창업 ↔ 폐업 연결은 차별점 중 **하나**이지 이
   플랫폼의 정체성이 아닙니다 — 이어진다는 말까지입니다. */
function BridgeBand(){
  var left  = ["매장","시설","장비","가구","재고"];
  var right = ["점포","인테리어","장비","집기","초기비용"];
  var li = function(t){
    return '<li><span>'+icon("check",14)+'</span><span>'+esc(t)+'</span></li>'; };

  return '<section class="lbr"><div class="w">'+
    '<div class="lbr-hd">'+
      '<h2 class="lbr-h" data-rv>끝은 또 다른 시작이 됩니다.</h2>'+
      '<p class="lbr-p" data-rv>한 사장님의 끝이 다른 사장님의 시작이 됩니다. '+
        '정리하시는 사장님이 내놓은 것을, 같은 업종을 준비하는 사장님이 찾습니다.</p>'+
    '</div>'+
    '<div class="lbr-g">'+
      '<div class="lbr-c lbr-c-cl" data-rv>'+
        '<p class="lbr-k">CLOSE</p>'+
        '<b class="lbr-t">정리하시는 사장님</b>'+
        '<ul class="lbr-l">'+left.map(li).join("")+'</ul>'+
      '</div>'+
      '<span class="lbr-a" aria-hidden="true">'+icon("arrow",26)+'</span>'+
      '<div class="lbr-c lbr-c-nv" data-rv>'+
        '<p class="lbr-k">PLATFORM</p>'+
        '<b class="lbr-t">'+esc(amBrand())+'</b>'+
        '<p class="lbr-d">넘기실 것과 찾으시는 것을 업종 · 지역으로 맞춰 '+
          '이어 드립니다.</p>'+
      '</div>'+
      '<span class="lbr-a" aria-hidden="true">'+icon("arrow",26)+'</span>'+
      '<div class="lbr-c lbr-c-st" data-rv>'+
        '<p class="lbr-k">START</p>'+
        '<b class="lbr-t">시작하시는 사장님</b>'+
        '<ul class="lbr-l">'+right.map(li).join("")+'</ul>'+
      '</div>'+
    '</div>'+
    '<div class="lbr-cta">'+
      '<a class="btn btn-o" href="/stores">점포 · 매장 보기'+icon("arrow",16)+'</a>'+
      '<a class="btn btn-o" href="/assets">시설 · 집기 보기</a>'+
    '</div>'+
  '</div></section>';
}

/* ── ⑦ 업체 분류 (§12 · §13) ─────────────────────────────────────
   ⚠️⚠️ **업체 카드를 여기 나열하지 마세요.** 분류까지입니다 —
   업체를 깔면 그 순간 전화번호부이고 (§54), 지금 0곳이라 지어내게
   됩니다. 카드는 `/providers` 에 있고 거기서 0 이라고 말합니다.
   ⚠️ **이름과 설명을 코드에 적지 마세요.** `amCat()` 에서 옵니다.
   ⚠️ 카드 색을 전부 같게 만들지 마세요 (§26). 한 줄에 나란히 서는
   것끼리는 서로 다른 색입니다. */
var CAT_TINT = [
  ["__fr",      "lt-franchise"],
  ["interior",  "lt-interior"],
  ["demolish",  "lt-demolish"],
  ["equip",     "lt-equip"],
  ["it",        "lt-pos"],
  ["admin",     "lt-tax"],
  ["marketing", "lt-mkt"],
  ["store",     "lt-estate"],
  ["supply",    "lt-food"],
  ["furniture", "lt-furniture"],
  ["clean",     "lt-clean"],
  ["restore",   "lt-etc"]
];
function CatBand(){
  var list = CAT_TINT.map(function(r){
    if(r[0] === "__fr")
      return { to:"/franchise", icon:"layers", name:"프랜차이즈",
               lead:"본사 조건을 놓고 비교", tint:r[1] };
    var c = window.amCat ? amCat(r[0]) : null;
    if(!c) return null;
    return { to:catTo(c), icon:c.icon, name:c.name, lead:c.lead || "", tint:r[1] };
  }).filter(Boolean);
  if(list.length < 6) return "";

  return '<section class="lcat"><div class="w">'+
    '<div class="lcat-g">'+
      '<div class="lcat-t" data-rv>'+
        '<h2 class="lcat-h">사장님에게 필요한 업체도<br class="br-m"> '+
          '이곳에 모입니다.</h2>'+
        '<p class="lcat-p">인테리어 · 철거 · 간판 · 주방설비 · POS · 세무 · '+
          '노무 · 청소 · 마케팅까지. 분야와 지역이 맞는 곳만 찾아 드립니다.</p>'+
        '<div class="lcat-cta">'+
          '<a class="btn btn-o" href="/providers">업체찾기'+icon("arrow",16)+'</a>'+
        '</div>'+
      '</div>'+
      '<div class="lcat-l rv-stg">'+ list.map(function(c){
        return '<a class="lcc '+esc(c.tint)+'" href="'+esc(c.to)+'" data-rv>'+
          '<span class="lcc-ic">'+icon(c.icon,22)+'</span>'+
          '<b>'+esc(c.name)+'</b>'+
          (c.lead ? '<span>'+esc(c.lead)+'</span>' : "")+
        '</a>';
      }).join("")+'</div>'+
    '</div>'+
  '</div></section>';
}

/* ── ⑧ 업체 입점 (§14) ───────────────────────────────────────────
   ⚠️ **"월 n건의 요청" · "등록 업체 n곳" 을 적지 마세요.** 지금 그
   값이 하나도 없습니다. 적을 수 있는 것은 **어떻게 하겠다는 약속**
   까지입니다.
   ⚠️ 짙은 남색을 넓게 쓰는 자리는 푸터뿐이라 여기는 **카드 한
   장**까지입니다 (§2). 구간 배경을 남색으로 칠하지 마세요. */
function JoinBand(){
  var how = [
    ["광고가 아니라 요청입니다",  "지역과 전문 분야가 맞는 요청만 보내 드립니다."],
    ["기본 입점은 무료입니다",    "프로필 · 지역 · 서비스 · 포트폴리오를 직접 관리하십니다."],
    ["광고는 광고라고 표시합니다", "일반 결과는 조건 적합도를 기준으로 냅니다."]
  ];
  return '<section class="ljn"><div class="w">'+
    '<div class="ljn-c" data-rv>'+
      '<div>'+
        '<p class="ljn-k">PARTNER</p>'+
        '<h2 class="ljn-h">고객을 찾고 계신가요?</h2>'+
        '<p class="ljn-p">창업과 폐업을 준비하는 사장님이 직접 찾아옵니다. '+
          '하시는 일과 지역만 등록해 두시면, 필요한 순간에 이어 드립니다.</p>'+
        '<div class="ljn-cta">'+
          '<a class="btn btn-w" href="/join">업체 입점하기'+icon("arrow",16)+'</a>'+
          '<a class="btn btn-gh" href="/franchise">프랜차이즈 등록</a>'+
        '</div>'+
      '</div>'+
      /* ⚠️ grid 칸에 맨글을 두지 않습니다 — 태그로 감쌉니다 */
      '<ul class="ljn-l">'+how.map(function(h){
        return '<li>'+icon("check",18)+
          '<span><b>'+esc(h[0])+'</b><i>'+esc(h[1])+'</i></span></li>';
      }).join("")+'</ul>'+
    '</div>'+
  '</div></section>';
}

/* ── ⑨ 마지막 CTA — 초록 / 주황 반반 (§15) ───────────────────────
   ⚠️ **둘의 크기가 같아야 합니다.** 폐업 쪽을 좁히면 "덜 중요한
   것" 으로 읽힙니다.
   ⚠️ 폐업 쪽 글에서 실패 · 손실을 말하지 않습니다 (§6). "잘 정리하는
   것도 사업입니다" 까지입니다. */
function FinalBand(){
  var side = [
    { cls:"st", k:"START", ph:"cta-start", h:"시작하시나요?",
      p:"지금 더 나은 사업의 시작을 준비하세요.",
      go:"창업 시작하기", to:"/startup" },
    { cls:"cl", k:"CLOSE", ph:"cta-close", h:"정리하시나요?",
      p:"잘 정리하는 것도 사업입니다.",
      go:"폐업 시작하기", to:"/closure" }
  ];
  return '<section class="lfin">'+ side.map(function(d){
    return '<a class="lfin-s lfin-'+esc(d.cls)+'" href="'+esc(d.to)+'">'+
      '<span class="lfin-ph" aria-hidden="true">'+photoBox(d.ph,"")+'</span>'+
      '<span class="lfin-k">'+esc(d.k)+'</span>'+
      '<b class="lfin-h">'+esc(d.h)+'</b>'+
      '<span class="lfin-p">'+esc(d.p)+'</span>'+
      '<span class="lfin-go">'+esc(d.go)+icon("arrow",18)+'</span>'+
    '</a>';
  }).join("")+'</section>';
}



var MAIN_TABS = [
  { k:"pv", name:"업체 찾기",     ic:"users",    to:"/providers", region:true },
  { k:"fr", name:"프랜차이즈",    ic:"store",    to:"/franchise", region:true },
  { k:"st", name:"상가·점포",     ic:"pin",      to:"/stores",    region:true },
  { k:"tr", name:"매장 양도·양수", ic:"handover", to:"/g/transfer" },
  { k:"sp", name:"창업·폐업 지원", ic:"badge",    to:"/support" }
];
window.mainFind = function(e){
  e.preventDefault();
  var q = ((document.getElementById("msrQ")||{}).value || "").trim();
  var r = ((document.getElementById("msrR")||{}).value || "").trim();

  if(q){ go("/search?q=" + encodeURIComponent(q)); return false; }
  var cur = nowQS("t") || "pv";
  var t = MAIN_TABS.filter(function(x){ return x.k === cur; })[0] || MAIN_TABS[0];

  go(t.to + (r && t.region ? "?r=" + encodeURIComponent(r) : ""));
  return false;
};

function StageCard(s){
  var key = "category-" + s.key;
  var ph  = (typeof hasPhoto === "function") && hasPhoto(key);
  return '<a href="'+esc(amStageTo(s))+'" class="stg'+tn(s.tone)+(ph ? " stg-ph" : "")+'">'+
    '<span class="stg-t">'+
      '<span class="stg-h">'+
        '<span class="stg-i">'+icon(s.icon,24)+'</span>'+
        '<b>'+esc(s.name)+'</b>'+
      '</span>'+
      '<em class="stg-c">'+(s.copy || esc(s.lead))+'</em>'+
      '<i class="stg-s">'+esc(s.sub)+'</i>'+
    '</span>'+
    (ph ? '<span class="stg-img">'+photoBox(key)+'</span>' : '')+
    '<span class="stg-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
  '</a>';
}

function MainScopeStrip(){
  var ind = (window.AM_INDUSTRIES || []).length;
  var cat = (window.AM_CATS || []).length;
  var sub = (window.AM_CATS || []).reduce(function(a, c){
    return a + ((c.items || []).length); }, 0);
  if(!ind || !cat || !sub) return "";
  var n = [[ind, "업종"], [cat, "서비스 분야"], [sub, "세부 서비스"]];
  return '<div class="msvc-sc">'+
    '<ul class="msvc-sc-g">'+n.map(function(x){
      return '<li><b>'+x[0]+'</b><i>'+esc(x[1])+'</i></li>'; }).join("")+'</ul>'+

    '<p class="msvc-sc-n">'+icon("info",14)+
      '<span>서비스 <b>분류 기준</b>이며 등록된 업체 수가 아닙니다.</span></p>'+
  '</div>';
}

var MAIN_CALC = ["cost", "bep", "premium", "closecost"];

function PageMain(){

  return HomeHero()+ HomeEnter()+ HomeFit()+ HomeRec()+
         HomeCalc()+ HomeIndGuide()+ HomeGuide()+ HomeCta();
}

var HOME_ENTER = [
  { key:"startup",   no:"01", ia:"bulb", lead:"아이디어부터 오픈까지", ph:"hero-startup" },
  { key:"operation", no:"02", ia:"store", lead:"지금 더 잘되는 매장으로", ph:"hero-ops" },

  { key:"transfer",  no:"03", ia:"handover", lead:"넘기고 받는 모든 것", ph:"kind-pass" },
  { key:"closure",   no:"04", ia:"restore", lead:"마무리도 든든하게", ph:"hero-closure" }
];

var HOME_PASS_SV = ["매장 인수","매장 양도","권리금 정보",
                    "시설 · 장비 인계","계약 · 행정"];

var HOME_WHY = [
  { ia:"supply",   n:"전문 서비스 연결",
    d:"창업 · 운영 · 양도양수 · 폐업에 필요한 분야를 한 줄로 이어 "+
      "두었습니다. 단계마다 무엇이 필요한지부터 보여 드립니다." },
  { ia:"calc",     n:"간편한 견적 신청",
    d:"업종 · 지역 · 조건을 한 번 적어 보내시면 됩니다. 가입도 필요 "+
      "없고 신청은 무료입니다." },

  { ia:"handover", n:"맞춤형 업체 연결",
    d:"적어 주신 분야 · 지역 · 업종으로 그 일을 하는 업체를 찾아 "+
      "전달합니다. 저희는 중개자이고 거래 당사자가 아닙니다." },

  { ia:"shield",   n:"견적 비교 안내",
    d:"받으신 견적을 내 기록에서 나란히 놓고 보실 수 있습니다. 업체는 "+
      "등록된 차례로 내고 광고로 위에 올린 자리가 없습니다." }
];

var HOME_BAN = [
  { n:"매장을 만드는 일", lead:"인테리어 · 시공", ia:"interior", tone:"start",
    d:"도면 · 철거 · 전기 · 간판까지 한 분야에서 보고 비교하실 수 있습니다.",
    to:"/providers/interior", ph:"svc-interior" },
  { n:"매장을 돌아가게 하는 일", lead:"POS · CCTV · 매장시스템", ia:"pos", tone:"ops",
    d:"결제 · 주문 · 보안 · 네트워크를 한 분야에서 보고 비교하실 수 있습니다.",
    to:"/providers/it", ph:"svc-it" }
];

function homeHallItem(hall, name){
  var L = (hall && hall.items) || [], i;
  for(i = 0; i < L.length; i++) if(L[i].n === name) return L[i];
  return null;
}

function HomeHero(){
  var nm = (window.amBrand ? amBrand() : ((window.AM_BRAND || {}).name || ""));
  var with_ = (window.koWith ? koWith(nm, "이가") : nm + "가");

  var ph = (typeof hasPhoto === "function" && hasPhoto("hero-start"))
    ? '<span class="bhero-bg" aria-hidden="true">'+
        photoBox("hero-start", "", true)+'</span>' : "";
  return '<section class="bhero'+(ph ? " on-ph" : "")+'">'+ ph +
    '<div class="w bhero-w">'+
      '<div class="bhero-in">'+
        '<p class="bhero-k">창업의 시작부터 폐업의 마무리까지</p>'+

        '<h1>사장님의 모든 순간, '+esc(with_)+' 함께합니다.</h1>'+
        '<p class="bhero-s">창업 준비, 매장 운영, 매장 양도양수, 폐업 · 정리에 '+
          '필요한 모든 서비스를 한곳에서 찾고, 비교하고, 연결받으세요.</p>'+

        '<form class="bhero-f" role="search" onsubmit="return homeHeroFind(event)">'+
          '<label class="bhero-c"><span class="sr-only">업종</span>'+
            (window.IndustrySelect ? IndustrySelect("hs-i", "", "", "업종 전체")
              : '<select id="hs-i" class="sel"></select>')+'</label>'+
          '<label class="bhero-c"><span class="sr-only">지역</span>'+
            (window.RegionSelect ? RegionSelect("hs-r", "", "", "지역 전체")
              : '<select id="hs-r" class="sel"></select>')+'</label>'+
          '<label class="bhero-c bhero-q"><span class="sr-only">찾으시는 서비스</span>'+
            '<input id="hs-q" type="search" placeholder="어떤 도움이 필요하신가요?"></label>'+
          '<button class="btn btn-ac bhero-sb" type="submit">'+
            icon("search",18)+'<span>검색하기</span></button>'+
        '</form>'+

        homeDirectChips()+
        '<p class="bhero-go">'+
          '<a class="btn btn-cr btn-lg" href="/quote" data-to="/quote">'+
            '무료 상담 신청'+icon("arrow",18)+'</a>'+
        '</p>'+
      '</div>'+
    '</div>'+
  '</section>';
}

window.homeHeroFind = function(e){
  if(e) e.preventDefault();
  var v = function(id){ var el = document.getElementById(id); return el ? el.value.trim() : ""; };
  var q = v("hs-q"), i = v("hs-i"), r = v("hs-r");
  if(q){ go("/search?q=" + encodeURIComponent(q)); return false; }
  var p = [];
  if(i) p.push("i=" + encodeURIComponent(i));
  if(r) p.push("r=" + encodeURIComponent(r));
  go("/providers" + (p.length ? "?" + p.join("&") : ""));
  return false;
};

function homeDirectChips(){
  var C = window.AM_CATS || [];
  var out = HOME_DIRECT.map(function(k){
    var c = null, i;
    for(i = 0; i < C.length; i++) if(C[i].key === k) c = C[i];
    if(!c) return "";
    var to = (typeof catTo === "function") ? catTo(c) : ("/providers/" + c.key);
    return '<li><a class="bhero-chip" href="'+esc(to)+'">'+
      icon(c.icon || "doc", 16)+'<span>'+esc(c.name)+'</span></a></li>';
  }).filter(Boolean).join("");
  return out ? '<ul class="bhero-chips">'+out+'</ul>' : "";
}

function HomeEnter(){
  var H = window.AM_HALLS || [];
  var cards = HOME_ENTER.map(function(x){
    var h = null, i;
    for(i = 0; i < H.length; i++) if(H[i].key === x.key) h = H[i];
    if(!h) return "";
    var no = '<i class="bent-no">'+esc(x.no)+'</i>';

    var ph = hasPhoto(x.ph)
      ? '<span class="bent-ph" aria-hidden="true">'+photoBox(x.ph, "", false,
          "(max-width:768px) 118px, (max-width:999px) 95vw, "+
          "(max-width:1100px) 46vw, 310px")+no+'</span>' : "";

    return '<li class="bent-c ent-'+esc(x.key)+'">'+
      '<a href="'+esc(h.to)+'">'+ ph +
        '<span class="bent-tx">'+
          (ph ? "" : no)+
          '<span class="bent-i" aria-hidden="true">'+iconArt(x.ia, 44)+'</span>'+
          '<b>'+esc(h.name)+'</b>'+
          '<em>'+esc(x.lead)+'</em>'+
          '<span class="bent-go">바로가기'+icon("arrow",16)+'</span>'+
        '</span>'+
      '</a>'+
    '</li>';
  }).join("");
  if(!cards) return "";
  return '<section class="bent">'+
    '<div class="w">'+
      '<div class="sec-hd sec-hd-c">'+
        '<p class="eyebrow">SERVICE</p>'+

        '<h2>네 가지 핵심 서비스</h2>'+
        '<p>창업 준비 · 매장 운영 · 매장 양도양수 · 폐업 정리 — '+
          '단계를 고르시면 그 단계에 필요한 서비스만 모아서 보여 드립니다.</p>'+
      '</div>'+
      '<ul class="bent-g">'+cards+'</ul>'+
    '</div>'+
  '</section>';
}

var HOME_DIRECT = ["interior", "equip", "it", "admin",
                   "staff", "marketing", "demolish", "restore"];

function HomeDirect(){
  var C = window.AM_CATS || [];
  var cards = HOME_DIRECT.map(function(k){
    var c = null, i;
    for(i = 0; i < C.length; i++) if(C[i].key === k) c = C[i];
    if(!c) return "";
    var to = (typeof catTo === "function") ? catTo(c) : ("/providers/" + c.key);

    return '<li><a class="bdir-c'+tn(c.tone)+'" href="'+esc(to)+'">'+
      '<span class="bdir-i">'+
        (hasIconArt(c.key) ? iconArt(c.key, 44) : icon(c.icon, 26))+'</span>'+
      '<b>'+esc(c.name)+'</b>'+
    '</a></li>';
  }).filter(Boolean).join("");
  if(!cards) return "";

  return '<section class="bdir"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<h2>직접 서비스를 찾아보세요.</h2>'+
      '<p>무엇이 필요한지 이미 정해져 있으시면 여기서 바로 가세요.</p>'+
    '</div>'+
    '<ul class="bdir-g">'+cards+'</ul>'+
    '<p class="row-cta row-mid">'+
      '<a class="btn btn-o" href="/providers">전체 서비스 보기'+icon("arrow",16)+'</a>'+
    '</p>'+
    HomePicked()+

    MainScopeStrip()+
  '</div></section>';
}

function HomePicked(){
  if(typeof amPickCount !== "function" || !amPickCount()) return "";
  var L = (typeof amPickList === "function") ? amPickList() : [];
  var n = L.length || amPickCount();
  var nm = L.slice(0, 4).map(function(x){ return x.name; }).filter(Boolean);
  var to = (typeof amPickQuoteTo === "function") ? amPickQuoteTo("start") : "/quote";

  return '<div class="bdir-pk" data-pick-row>'+
    '<p class="bdir-pk-t">'+icon("check",16)+
      ' 고르신 서비스 <b data-pick-n>'+n+'</b>개'+
      (nm.length ? ' <i>'+esc(nm.join(" · "))+(n > nm.length ? " 외 "+(n-nm.length)+"개" : "")+'</i>' : "")+
    '</p>'+
    '<a class="btn btn-ac" data-pick-go="start" href="'+esc(to)+'">'+
      '고른 서비스로 신청하기'+icon("arrow",16)+'</a>'+
  '</div>';
}

function HomePass(){
  var H = window.AM_HALLS || [], h = null, i;
  for(i = 0; i < H.length; i++) if(H[i].key === "transfer") h = H[i];
  if(!h) return "";
  var ph = hasPhoto("kind-pass")
    ? '<a class="bpass-ph" href="'+esc(h.to)+'" aria-label="'+esc(h.name)+'">'+
        photoBox("kind-pass")+'</a>' : "";
  var sv = HOME_PASS_SV.map(function(n){
    var it = homeHallItem(h, n);
    if(!it) return "";
    var to = (typeof amHallTo === "function") ? amHallTo(it) : "";
    if(!to) return "";
    return '<li><a href="'+esc(to)+'">'+iconArt(it.ia, 44)+
      '<span>'+esc(it.n)+'</span></a></li>';
  }).filter(Boolean).join("");
  return '<section class="bpass">'+
    '<div class="w bpass-c">'+ ph +
      '<div class="bpass-tx">'+
        '<p class="bpass-k">'+esc(h.name)+'</p>'+
        '<h2>한 사장님의 마지막이 다른 사장님의 시작이 됩니다.</h2>'+
        '<p>권리금 · 시설 · 임대차를 함께 놓고 봅니다. 넘기시는 분과 '+
          '받으시는 분이 같은 화면을 보십니다.</p>'+
        '<div class="bpass-go">'+
          '<a class="btn btn-ac" href="'+esc(h.to)+'">'+
            esc(h.name)+' 바로가기'+icon("arrow",16)+'</a>'+
          '<a class="btn btn-cr" href="/stores">매장 인수 알아보기</a>'+
        '</div>'+
      '</div>'+
      (sv ? '<ul class="bpass-sv">'+sv+'</ul>' : "")+
    '</div>'+
  '</section>';
}

function HomeWhy(){
  return '<section class="bwhy">'+
    '<div class="w">'+
      '<div class="sec-hd sec-hd-c">'+
        '<p class="eyebrow">WHY</p>'+

        '<h2>이곳에서 찾으시면 되는 까닭</h2>'+
      '</div>'+
      '<div class="bwhy-in">'+
        '<ul class="bwhy-g">'+HOME_WHY.map(function(x){
          return '<li class="bwhy-c">'+
            '<span class="bwhy-i" aria-hidden="true">'+iconArt(x.ia, 46)+'</span>'+
            '<b>'+esc(x.n)+'</b>'+
            '<p>'+esc(x.d)+'</p>'+
          '</li>'; }).join("")+'</ul>'+
        HomeQuoteCard()+
      '</div>'+

    '</div>'+
  '</section>';
}

function HomeQuoteCard(){
  var L = ["업종 · 지역 · 조건을 한 번만 적으시면 됩니다.",
           "가입 없이 신청하실 수 있고 신청은 무료입니다.",
           "업체에 연락처를 전달하기 전에 동의를 다시 받습니다."];
  return '<div class="bqc">'+
    '<p class="bqc-k">FREE ESTIMATE</p>'+
    '<b>무료 견적 신청</b>'+
    '<p>어떤 서비스가 필요하신지 적어 보내시면, 그 분야 업체를 찾아 '+
      '연결해 드립니다.</p>'+
    '<ul class="bqc-l">'+L.map(function(t){
      return '<li>'+icon("check",16)+'<span>'+esc(t)+'</span></li>';
    }).join("")+'</ul>'+
    '<a class="btn btn-ac btn-lg" href="/quote" data-to="/quote">'+
      '무료 견적 신청'+icon("arrow",18)+'</a>'+
    '<p class="bqc-n">'+icon("info",14)+' 업체 회신 시점은 업체가 '+
      '정합니다 — 저희가 보장하지 않습니다.</p>'+
  '</div>';
}

function HomeSteps(){
  var L = window.AM_STEPS || [];
  if(!L.length) return "";
  return '<section class="bstep">'+
    '<div class="w">'+
      '<div class="sec-hd sec-hd-c">'+
        '<p class="eyebrow">HOW IT WORKS</p>'+
        '<h2>이용 방법은 간단합니다.</h2>'+
        '<p>신청은 무료이고 가입이 필요 없습니다.</p>'+
      '</div>'+
      '<ol class="bstep-g">'+L.map(function(x, i){
        return '<li class="bstep-c">'+
          '<span class="bstep-n">'+("0"+(i+1))+'</span>'+
          '<span class="bstep-i" aria-hidden="true">'+icon(x.ic, 24)+'</span>'+
          '<b>'+esc(x.n)+'</b>'+
          '<p>'+esc(x.d)+'</p>'+
        '</li>'; }).join("")+'</ol>'+

      '<p class="bstep-n2">'+icon("info",14)+
        ' 업체 회신 시점은 업체가 정합니다 — 저희가 보장하지 않습니다.</p>'+

      (typeof QuoteStage === "function" ? QuoteStage() : "")+
    '</div>'+
  '</section>';
}

function HomeBanners(){
  var cards = HOME_BAN.map(function(x){
    var ph = hasPhoto(x.ph)
      ? '<span class="bban-ph" aria-hidden="true">'+photoBox(x.ph)+'</span>'
      : '<span class="bban-i" aria-hidden="true">'+iconArt(x.ia, 48)+'</span>';
    return '<li class="bban-c ban-'+esc(x.tone)+'">'+
      '<a href="'+esc(x.to)+'">'+ ph +
        '<span class="bban-tx">'+
          '<i>'+esc(x.lead)+'</i>'+
          '<b>'+esc(x.n)+'</b>'+
          '<em>'+esc(x.d)+'</em>'+
          '<span class="bban-go">자세히 보기'+icon("arrow",16)+'</span>'+
        '</span>'+
      '</a>'+
    '</li>';
  }).join("");
  if(!cards) return "";
  return '<section class="bban"><div class="w">'+
    '<ul class="bban-g">'+cards+'</ul>'+
  '</div></section>';
}

function HomeCalc(){
  var by = {}; (window.AM_TOOLS||[]).forEach(function(t){ by[t.key] = t; });
  var L = MAIN_CALC.map(function(k){ return by[k]; }).filter(Boolean);
  if(!L.length) return "";
  return '<section class="bcal"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">TOOLS</p>'+
      '<h2>사업에 필요한 계산도구를 이용해 보세요.</h2>'+
      '<p>창업 · 운영 · 양도양수 · 폐업에 필요한 비용을 미리 계산해 '+
        '보세요. 적으신 숫자는 이 브라우저에만 남습니다.</p>'+
    '</div>'+
    '<ul class="bcal-g">'+L.map(function(t, i){
      var art = (typeof hasIconArt === "function" && hasIconArt(t.icon));
      return '<li class="bcal-c cal-'+(i+1)+'">'+
        '<a href="/tools/'+esc(t.key)+'">'+
          '<span class="bcal-i ia-t" aria-hidden="true">'+
            (art ? iconArt(t.icon, 46) : icon(t.icon, 28))+'</span>'+
          '<b>'+esc(t.name)+'</b>'+
          (t.out ? '<em>'+esc(t.out)+'</em>' : "")+
          '<span class="bcal-go">계산하기'+icon("arrow",16)+'</span>'+
        '</a>'+
      '</li>'; }).join("")+'</ul>'+

    '<p class="note sec-note">적으신 조건으로 계산한 참고용 값입니다. '+
      '실제 금액은 지역 · 평수 · 업종에 따라 달라집니다.</p>'+
  '</div></section>';
}

function homeReads(n){
  var all = (window.AM_CONTENTS || []).slice();
  if(!all.length) return [];
  var byDate = all.sort(function(a, b){
    return String(b.at || "").localeCompare(String(a.at || ""));
  });
  var L = [], seenCat = {}, seenInd = {};
  byDate.forEach(function(c){
    if(L.length >= n || seenCat[c.cat]) return;
    if(c.industry && seenInd[c.industry]) return;
    seenCat[c.cat] = 1;
    if(c.industry) seenInd[c.industry] = 1;
    L.push(c);
  });
  byDate.forEach(function(c){
    if(L.length >= n || L.indexOf(c) >= 0) return;
    L.push(c);
  });
  return L;
}

function HomeGuide(){

  var f = homeFit();
  var L = (window.homeGuideFor ? homeGuideFor(f.hall, 3) : homeReads(3));
  if(!L.length) return "";
  var all = (window.AM_CONTENTS || []).length;
  return '<section class="bgd"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">GUIDE</p>'+
      '<h2>실제 사례 및 실용 정보</h2>'+

      '<p>공개할 수 있는 거래 사례는 아직 없습니다. 대신 창업 · 운영 · '+
        '양도양수 · 폐업에서 자주 막히는 자리를 정리했습니다 — 지금 '+
        all+'편이고 근거를 댈 수 있는 것만 적습니다.</p>'+
    '</div>'+
    '<ul class="bgd-g">'+L.map(function(c){
      var ct = (typeof amCat === "function") ? (amCat(c.cat) || {}) : {};
      var dt = (c.at && typeof amDate === "function") ? amDate(c.at) : "";

      return '<li class="bgd-c"><a href="/content/'+esc(c.slug)+'">'+
        (ct.name ? '<i class="bgd-k">'+esc(ct.name)+'</i>' : "")+
        '<b>'+esc(c.title)+'</b>'+
        (c.lead ? '<em>'+esc(c.lead)+'</em>' : "")+
        '<span class="bgd-m">'+
          (dt ? '<span>'+esc(dt)+'</span>' : "")+
          '<span>'+icon("arrow",14)+'</span>'+
        '</span>'+
      '</a></li>'; }).join("")+'</ul>'+
    '<p class="bgd-more"><a href="/content">이용 가이드 전체보기'+
      icon("arrow",16)+'</a></p>'+
  '</div></section>';
}

function HomeCta(){
  var nm = (window.amBrand ? amBrand() : ((window.AM_BRAND||{}).name || ""));
  var wa = (window.koWith ? koWith(nm, "와과") : nm + "와");
  return '<section class="bcta"><div class="w bcta-c">'+
    '<p class="eyebrow">FREE ESTIMATE</p>'+
    '<h2>지금, '+esc(wa)+' 함께 시작하세요.</h2>'+
    '<p>업종 · 지역 · 조건을 한 번만 적어 보내시면, 그 분야 업체를 찾아 '+
      '연결해 드립니다. 신청은 무료이고 가입이 필요 없습니다.</p>'+
    '<div class="bcta-go">'+
      '<a class="btn btn-ac btn-lg" href="/quote" data-to="/quote">'+
        '무료 상담 신청'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-cr btn-lg" href="/faq">자주 묻는 질문</a>'+
    '</div>'+

    '<ul class="bcta-tr">'+
      '<li>'+icon("check",16)+'<span>신청과 상담은 무료입니다</span></li>'+
      '<li>'+icon("check",16)+'<span>가입 없이 한 번만 적으시면 됩니다</span></li>'+
      '<li>'+icon("check",16)+'<span>저희는 중개자이고 거래 당사자가 아닙니다</span></li>'+
      '<li>'+icon("check",16)+'<span>업체에 연락처를 전달할 때 다시 동의를 받습니다</span></li>'+
    '</ul>'+
  '</div></section>';
}

var HOME_SIZE = [
  { k:"s",  n:"10평 이하", py:8  },
  { k:"m",  n:"10 ~ 20평", py:15 },
  { k:"l",  n:"20 ~ 40평", py:30 },
  { k:"xl", n:"40평 이상", py:50 }
];

var HOME_SIZE_FIRST = {
  l:  ["interior", "equip"],
  xl: ["interior", "equip", "furniture"]
};

window.homeFit = function(){
  var halls = (window.AM_HALLS || []).map(function(h){ return h.key; });
  var st = nowQS("st");
  return {
    ind:  nowQS("i")  || "",
    reg:  nowQS("r")  || "",
    size: nowQS("sz") || "",
    hall: (halls.indexOf(st) >= 0 ? st : (halls[0] || "startup"))
  };
};
window.homeFitOn = function(f){ return !!(f.ind || f.reg || f.size || nowQS("st")); };

window.homeFitUrl = function(f, extra){
  var q = [];
  if(f.ind)  q.push("i="  + encodeURIComponent(f.ind));
  if(f.reg)  q.push("r="  + encodeURIComponent(f.reg));
  if(f.size) q.push("sz=" + encodeURIComponent(f.size));
  if(f.hall) q.push("st=" + encodeURIComponent(f.hall));
  if(extra)  q.push(extra);

  return "/" + (q.length ? "?" + q.join("&") : "");
};

window.homeFitRank = function(f){
  var pool = (window.amPickHallCats ? amPickHallCats(f.hall) : []);
  var first = (window.amPickTopIds ? amPickTopIds(f.hall, f.ind) : []).slice();
  (HOME_SIZE_FIRST[f.size] || []).slice().reverse().forEach(function(k){
    var i = first.indexOf(k);
    if(i >= 0) first.splice(i, 1);
    first.unshift(k);
  });
  var rank = {};
  first.forEach(function(k, i){ rank[k] = i; });
  return pool.slice().sort(function(a, b){
    var ra = (rank[a.id] === undefined) ? 999 : rank[a.id];
    var rb = (rank[b.id] === undefined) ? 999 : rank[b.id];
    return ra - rb;
  });
};

function HomeFit(){
  var H = window.AM_HALLS || [];
  if(!H.length) return "";
  var f = homeFit();
  var steps = H.map(function(h){
    return '<option value="'+esc(h.key)+'"'+(h.key === f.hall ? " selected" : "")+
      '>'+esc(h.name)+'</option>';
  }).join("");
  var sizes = HOME_SIZE.map(function(s){
    return '<option value="'+esc(s.k)+'"'+(s.k === f.size ? " selected" : "")+
      '>'+esc(s.n)+'</option>';
  }).join("");
  return '<section class="bfit" id="fit"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">FIND</p>'+
      '<h2>내 상황에 맞는 서비스 찾기</h2>'+
      '<p>업종 · 지역 · 매장 규모 · 사업 단계를 고르시면 그 조건에 '+
        '맞는 서비스를 추려 드립니다.</p>'+
    '</div>'+
    '<form class="bfit-f" onsubmit="return homeFitGo(event)">'+
      '<label class="bfit-c"><span>사업 단계</span>'+
        '<select id="fit-st" class="sel">'+steps+'</select></label>'+
      '<label class="bfit-c"><span>업종</span>'+
        (window.IndustrySelect ? IndustrySelect("fit-i", f.ind, "", "업종 전체")
          : '<select id="fit-i" class="sel"></select>')+'</label>'+
      '<label class="bfit-c"><span>지역</span>'+
        (window.RegionSelect ? RegionSelect("fit-r", f.reg, "", "지역 전체")
          : '<select id="fit-r" class="sel"></select>')+'</label>'+
      '<label class="bfit-c"><span>매장 규모</span>'+
        '<select id="fit-sz" class="sel">'+
          '<option value="">규모 전체</option>'+sizes+'</select></label>'+
      '<button class="btn btn-ac btn-lg bfit-go" type="submit">'+
        '맞춤 서비스 찾기'+icon("arrow",18)+'</button>'+
    '</form>'+

    '<p class="note bfit-n">'+icon("info",14)+' 저희가 추려 둔 차례입니다 — '+
      '조회수나 신청 건수 같은 이용 통계가 아닙니다.</p>'+

    HomePicked()+
  '</div></section>';
}

window.homeFitGo = function(e){
  if(e) e.preventDefault();
  var v = function(id){ var el = document.getElementById(id); return el ? el.value : ""; };
  var f = { hall:v("fit-st"), ind:v("fit-i"), reg:v("fit-r"), size:v("fit-sz") };

  go(homeFitUrl(f), { keepScroll:true });
  return false;
};

var HOME_REC_N = 6;

function HomeRec(){
  var f = homeFit(), L = homeFitRank(f).slice(0, HOME_REC_N);
  var hall = (window.amHall ? amHall(f.hall) : null);
  var indName = (window.amIndustryName ? amIndustryName(f.ind) : "");

  if(!L.length) return '<section class="brec"><div class="w">'+
    '<div class="sec-hd sec-hd-c"><h2>추천 서비스</h2>'+
      '<p>고르신 조건에 맞는 서비스를 아직 못 찾았습니다. '+
        '전체 서비스에서 바로 찾아보실 수 있습니다.</p></div>'+
    '<p class="row-cta"><a class="btn btn-o btn-lg" href="/providers">'+
      '전체 서비스 보기'+icon("arrow",16)+'</a></p>'+
  '</div></section>';

  var cards = L.map(function(s){
    var c = (window.amCat ? amCat(s.cat) : null) || {};
    var key = "svc-" + s.cat;
    var ph = (typeof hasPhoto === "function" && hasPhoto(key))

      ? '<span class="brec-ph">'+photoBox(key, "", false,
          "(max-width:600px) 70vw, (max-width:1023px) 42vw, 380px")+'</span>'
      : '<span class="brec-i" aria-hidden="true">'+
          ((typeof hasIconArt === "function" && hasIconArt(s.cat))
            ? iconArt(s.cat, 84) : icon(c.icon || "doc", 52))+'</span>';

    var subs = (window.amAllSubs ? amAllSubs(c) : (c.items || []))
      .slice(0, 3).map(function(x){ return x.name; }).join(" · ");
    var to = (typeof catTo === "function") ? catTo(c) : ("/providers/" + s.cat);
    return '<li class="brec-c">'+ ph +
      '<span class="brec-tx">'+
        '<b>'+esc(s.name)+'</b>'+
        (subs ? '<em>'+esc(subs)+'</em>' : (c.lead ? '<em>'+esc(c.lead)+'</em>' : ""))+
      '</span>'+
      '<span class="brec-go">'+
        '<a class="btn btn-o" href="'+esc(to)+'">상세 보기</a>'+

        '<a class="btn btn-ac" href="'+esc(quoteTo({
            cat:s.cat, industry:f.ind, region:f.reg, side:homeFitSide(f.hall),
            py:homeFitPy(f.size) }))+'" data-to="/quote">상담 신청</a>'+
      '</span>'+
    '</li>';
  }).join("");

  var info = (window.AM_PICK_OFF || []).map(function(k){
    var c = (window.amCat ? amCat(k) : null);
    if(!c) return "";
    var to = (typeof catTo === "function") ? catTo(c) : ("/c/" + k);
    return '<li><a href="'+esc(to)+'">'+icon("doc",14)+esc(c.name)+'</a></li>';
  }).filter(Boolean).join("");

  return '<section class="brec"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">RECOMMEND</p>'+
      '<h2>추천 서비스</h2>'+
      '<p>'+esc((indName ? indName + " · " : "") +
        ((hall && hall.name) || "") )+' 기준으로 추려 드렸습니다. '+
        '모두 지금 바로 상담 신청하실 수 있는 서비스입니다.</p>'+
    '</div>'+
    '<ul class="brec-g">'+cards+'</ul>'+
    '<p class="row-cta row-mid">'+
      '<a class="btn btn-o" href="'+esc(homeFitAllTo())+'">'+
        '이 단계 서비스 전체 보기'+icon("arrow",16)+'</a></p>'+

    (typeof MainScopeStrip === "function" ? MainScopeStrip() : "")+
    (info ? '<div class="brec-info"><b>정보로 보시는 것</b>'+
      '<p class="note">업체가 해 드리는 일이 아니라 읽고 알아보시는 '+
        '자리입니다 — 신청 대상이 아닙니다.</p>'+
      '<ul class="brec-info-g">'+info+'</ul></div>' : "")+
  '</div></section>';
}

window.homeFitSide = function(hall){
  return ({ startup:"start", operation:"ops",
            transfer:"transfer", closure:"close" })[hall] || "start";
};
window.homeFitPy = function(size){
  var s = HOME_SIZE.filter(function(x){ return x.k === size; })[0];
  return s ? s.py : "";
};
window.homeFitAllTo = function(){
  var f = homeFit();
  var h = (window.amHall ? amHall(f.hall) : null);
  return (h && h.to) ? h.to : "/providers";
};

var HOME_PREP = {
  startup:  "startup",
  transfer: "acq-in",
  closure:  "closing"
};

window.homePrepList = function(hall){
  var out = [];
  if(hall === "operation"){
    (window.AM_OPS_CHECK || []).forEach(function(o){
      out.push({ id:"operation:" + o.name, n:o.name, d:o.lead || "", cat:o.cat || "" });
    });
    return out;
  }
  var key = HOME_PREP[hall];
  ((window.AM_PROCESS || {})[key] || []).forEach(function(s){
    out.push({ id:hall + ":" + s.name, n:s.name, d:s.lead || "",
      cat:(s.cat ? (s.cat + (s.sub ? "/" + s.sub : "")) : "") });
  });
  return out;
};

var PRK_KEY = "am.prepck.v1";

function prkGet(){
  try{
    var d = JSON.parse(localStorage.getItem(PRK_KEY) || "null");
    return (d && d.done) ? d.done : [];
  }catch(e){ return []; }
}
function prkSet(keys){
  try{ localStorage.setItem(PRK_KEY, JSON.stringify({ done:keys, at:Date.now() })); }
  catch(e){ return false; }
  return true;
}

window.homePrepToggle = function(id, el){
  var done = prkGet(), i = done.indexOf(id);
  var on = el ? !!el.checked : (i < 0);
  if(on && i < 0) done.push(id);
  if(!on && i >= 0) done.splice(i, 1);

  if(!prkSet(done)){
    if(el) el.checked = !on;
    toast("이 브라우저에 저장할 수 없어서 체크가 남지 않습니다");
    return;
  }
  homePrepPaint();
};

window.homePrepClear = function(){
  var f = homeFit(), L = homePrepList(f.hall);
  var mine = L.map(function(x){ return x.id; });
  var done = prkGet().filter(function(k){ return mine.indexOf(k) < 0; });
  if(done.length === prkGet().length) return;
  if(!confirm("이 단계에서 체크해 두신 것을 지웁니다. 되돌릴 수 없습니다.")) return;
  prkSet(done);
  var box = document.getElementById("prep-l");
  if(box) [].slice.call(box.querySelectorAll("input[type=checkbox]"))
    .forEach(function(e){ e.checked = false; });
  homePrepPaint();
  toast("지웠습니다");
};

window.homePrepPaint = function(){
  var f = homeFit(), L = homePrepList(f.hall), done = prkGet();
  var n = L.filter(function(x){ return done.indexOf(x.id) >= 0; }).length;
  var cnt = document.getElementById("prep-n");
  var bar = document.getElementById("prep-bar");
  if(cnt) cnt.textContent = n + " / " + L.length;
  if(bar) bar.style.width = (L.length ? Math.round(n / L.length * 100) : 0) + "%";
};

function HomeIndGuide(){
  var H = window.AM_HALLS || [];
  var f = homeFit(), L = homePrepList(f.hall);
  if(!H.length || !L.length) return "";
  var done = prkGet();
  var tabs = H.map(function(h){
    var on = (h.key === f.hall);
    return '<a class="chip'+(on ? " on" : "")+'" href="'+
      esc(homeFitUrl({ ind:f.ind, reg:f.reg, size:f.size, hall:h.key }))+
      '" data-keep'+(on ? ' aria-current="true"' : "")+'>'+esc(h.name)+'</a>';
  }).join("");
  var rows = L.map(function(x){
    var on = done.indexOf(x.id) >= 0;
    var s  = x.cat ? (window.amPickOne ? amPickOne(x.cat) : null) : null;
    var to = "";
    if(s){
      var c = (window.amCat ? amCat(s.cat) : null);
      to = c ? ((typeof catTo === "function") ? catTo(c) : "/providers/" + s.cat) : "";
      if(to && s.sub) to += (to.indexOf("?") >= 0 ? "&" : "?") + "s=" + encodeURIComponent(s.sub);
    }
    return '<li class="prep-r">'+
      '<label class="prep-k">'+
        '<input type="checkbox"'+(on ? " checked" : "")+
          ' onchange="homePrepToggle(\''+esc(x.id).replace(/'/g, "&#39;")+'\', this)">'+
        '<span class="prep-t"><b>'+esc(x.n)+'</b>'+
          (x.d ? '<em>'+esc(x.d)+'</em>' : "")+'</span>'+
      '</label>'+
      (to ? '<a class="prep-go" href="'+esc(to)+'">서비스 보기'+icon("arrow",14)+'</a>' : "")+
    '</li>';
  }).join("");
  var nDone = L.filter(function(x){ return done.indexOf(x.id) >= 0; }).length;
  return '<section class="bigd"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">CHECKLIST</p>'+
      '<h2>업종별 준비 가이드</h2>'+
      '<p>지금 단계에서 무엇을 해야 하는지 순서대로 모았습니다. '+
        '체크해 두시면 다음에 오셨을 때 이어서 보실 수 있습니다.</p>'+
    '</div>'+
    '<div class="chip-g chip-g-fil bigd-tab">'+tabs+'</div>'+
    '<div class="prep">'+
      '<div class="prep-hd">'+
        '<b>준비 항목 <i id="prep-n">'+nDone+' / '+L.length+'</i></b>'+
        '<span class="prep-bar"><i id="prep-bar" style="width:'+
          (L.length ? Math.round(nDone / L.length * 100) : 0)+'%"></i></span>'+
      '</div>'+
      '<ul class="prep-l'+(L.length > 8 ? " is-fold-rest" : "")+
        '" id="prep-l">'+rows+'</ul>'+

      (L.length > 8 ? '<p class="prep-fold">'+
        FoldAll("prep-l", "나머지 "+(L.length - 6)+"개 보기", "접기",
                "is-fold-rest")+'</p>' : "")+
      '<div class="prep-go-r">'+
        '<a class="btn btn-ac" href="'+esc(quoteTo({
            industry:f.ind, region:f.reg, side:homeFitSide(f.hall),
            py:homeFitPy(f.size) }))+'" data-to="/quote">이 단계 상담 신청</a>'+
        '<button class="btn btn-o" type="button" onclick="homePrepClear()">전체 해제</button>'+
      '</div>'+

      '<p class="note prep-n2">'+icon("info",14)+' 체크해 두신 것은 '+
        '이 브라우저에만 남고 저희에게 오지 않습니다 — 체크는 신청이 아닙니다.</p>'+
    '</div>'+
  '</div></section>';
}

window.homeGuideFor = function(hall, n){
  var all = (window.AM_CONTENTS || []).slice();
  var set = {};
  (window.amPickHallCats ? amPickHallCats(hall) : []).forEach(function(s){ set[s.id] = 1; });
  (window.AM_PICK_OFF || []).forEach(function(k){ set[k] = 1; });
  var by = function(a, b){ return String(b.at || "").localeCompare(String(a.at || "")); };
  var mine = all.filter(function(c){ return set[c.cat]; }).sort(by);

  var hit = [], seen = {};
  mine.forEach(function(c){
    if(hit.length < n && !seen[c.cat]){ seen[c.cat] = 1; hit.push(c); } });

  mine.forEach(function(c){
    if(hit.length < n && hit.indexOf(c) < 0) hit.push(c); });

  if(hit.length < n)
    all.sort(by).forEach(function(c){
      if(hit.length < n && hit.indexOf(c) < 0) hit.push(c);
    });
  return hit.slice(0, n);
};

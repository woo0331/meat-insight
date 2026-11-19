

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

  return HomeSplitSW()+ HomeFindSW()+ HomeEntrySW()+ HomeStores()+ HomeShortcuts()+
         HomeCalc()+ HomeGuide()+ HomeCta();
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

function homeHeroChecks(){
  var n = (window.AM_CATS || []).length;
  var L = [];
  if(n) L.push("서비스 분야 " + n + "개");
  L.push("지역 · 업종으로 찾기");
  L.push("한 번에 여러 개 신청");
  return '<ul class="bhero-ck">'+L.map(function(t){
    return '<li>'+icon("check",15)+'<span>'+esc(t)+'</span></li>';
  }).join("")+'</ul>';
}

function homeHeroCard(){
  if(!hasPhoto("hero-start")) return "";
  return '<a class="bhero-card" href="/providers">'+
    '<span class="bhero-card-i" aria-hidden="true">'+iconArt("admin", 30)+'</span>'+
    '<b>지금, 필요한 서비스를 바로 찾아보세요.</b>'+
    '<span class="bhero-card-a" aria-hidden="true">'+icon("arrow",16)+'</span>'+
  '</a>';
}

function HomeHero(){
  var nm = (window.amBrand ? amBrand() : ((window.AM_BRAND || {}).name || ""));
  var with_ = (window.koWith ? koWith(nm, "이가") : nm + "가");

  var ph = hasPhoto("hero-start")
    ? '<span class="bhero-ph" aria-hidden="true">'+photoBox("hero-start", "", true)+'</span>' : "";
  return '<section class="bhero">'+
    '<div class="w bhero-w">'+
      '<div class="bhero-in">'+
        '<p class="bhero-k">'+icon("sparkle",14)+'창업부터 폐업까지 사장님의 든든한 파트너</p>'+

        '<h1>사장님의 모든 순간, '+esc(with_)+' 함께합니다.</h1>'+
        '<p class="bhero-s">창업 준비, 매장 운영, 매장 양도양수, 폐업·철거에 '+
          '필요한 모든 서비스를 한곳에서 찾고, 비교하고, 연결받으세요.</p>'+
        '<div class="bhero-go">'+
          '<a class="btn btn-ac btn-lg" href="/quote" data-to="/quote">'+
            '무료 견적 신청'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-o btn-lg" href="/providers">어떤 서비스가 있는지 보기</a>'+
        '</div>'+
        homeHeroChecks()+
      '</div>'+
      ph + homeHeroCard() +
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

function homeDirDesc(c){
  var it = (c.items || []);
  if(it.length) return it.slice(0, 5).map(function(x){ return x.name; })
                         .filter(Boolean).join(", ") + " 등";
  return c.lead || "";
}

function HomeDirect(){
  var C = window.AM_CATS || [];
  var cards = HOME_DIRECT.map(function(k){
    var c = null, i;
    for(i = 0; i < C.length; i++) if(C[i].key === k) c = C[i];
    if(!c) return "";
    var to = (typeof catTo === "function") ? catTo(c) : ("/providers/" + c.key);
    var ds = homeDirDesc(c);

    return '<li><a class="bdir-c'+tn(c.tone)+'" href="'+esc(to)+'">'+
      '<span class="bdir-i" aria-hidden="true">'+
        (hasIconArt(c.key) ? iconArt(c.key, 64) : icon(c.icon, 34))+'</span>'+
      '<span class="bdir-tx">'+
        '<b>'+esc(c.name)+'</b>'+
        (ds ? '<em>'+esc(ds)+'</em>' : "")+
      '</span>'+
      '<span class="bdir-go">관련 서비스 보기'+icon("arrow",15)+'</span>'+
    '</a></li>';
  }).filter(Boolean).join("");
  if(!cards) return "";

  return '<section class="bdir"><div class="w">'+
    '<div class="sec-hd hm-hd">'+
      '<div class="hm-hd-t">'+
        '<h2>직접 서비스를 찾아보세요.</h2>'+
        '<p>무엇이 필요하신지 이미 정해져 있으시면 여기서 바로 가세요.</p>'+
      '</div>'+
      '<a class="btn btn-ac hm-more" href="/providers">전체 서비스 보기'+
        icon("arrow",16)+'</a>'+
    '</div>'+
    '<ul class="bdir-g">'+cards+'</ul>'+
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
    '<p>어떤 서비스가 필요하신지 적어 보내시면, 운영자가 확인하고 '+
      '맞는 업체가 있으면 연결을 도와 드립니다.</p>'+
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
      '<div class="sec-hd hm-hd">'+
        '<div class="hm-hd-t">'+
          '<p class="eyebrow">HOW IT WORKS</p>'+
          '<h2>이용 방법은 간단합니다.</h2>'+
          '<p>신청은 무료이고 가입이 필요 없습니다.</p>'+
        '</div>'+
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
    '<div class="sec-hd hm-hd">'+
      '<div class="hm-hd-t">'+
        '<p class="eyebrow">TOOLS</p>'+
        '<h2>사업에 필요한 계산도구를 이용해 보세요.</h2>'+
        '<p>창업 · 운영 · 양도양수 · 폐업에 필요한 비용을 미리 계산해 '+
          '보세요. 적으신 숫자는 이 브라우저에만 남습니다.</p>'+
      '</div>'+
      '<a class="btn btn-ac hm-more" href="/tools">계산도구 전체 보기'+
        icon("arrow",16)+'</a>'+
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
  var L = homeReads(3);
  if(!L.length) return "";
  var all = (window.AM_CONTENTS || []).length;
  return '<section class="bgd"><div class="w">'+

    '<div class="sec-hd hm-hd">'+
      '<div class="hm-hd-t">'+
        '<p class="eyebrow">GUIDE</p>'+
        '<h2>사장님께 필요한 이용 가이드</h2>'+
        '<p>창업 · 운영 · 양도양수 · 폐업에서 자주 막히는 자리를 '+
          '정리했습니다. 지금 '+all+'편이고 근거를 댈 수 있는 것만 적습니다.</p>'+
      '</div>'+
      '<a class="btn btn-ac hm-more" href="/content">이용 가이드 전체 보기'+
        icon("arrow",16)+'</a>'+
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
  '</div></section>';
}

function HomeCta(){
  var nm = (window.amBrand ? amBrand() : ((window.AM_BRAND||{}).name || ""));
  var wa = (window.koWith ? koWith(nm, "와과") : nm + "와");

  if(!(window.WOW_BIZ && WOW_BIZ.sosReady))
    return '<section class="bcta"><div class="w bcta-c">'+
      '<p class="eyebrow">NOTICE</p>'+
      '<h2>지금은 견적 접수를 받지 않습니다.</h2>'+
      '<p>서비스 안내 · 계산도구 · 체크리스트는 그대로 이용하실 수 있습니다. '+
        '접수가 열리면 이 자리에서 안내드립니다. 재개 일정은 아직 정해지지 않았습니다.</p>'+
      '<div class="bcta-go">'+
        '<a class="btn btn-ac btn-lg" href="/tools">계산도구 보기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-cr btn-lg" href="/faq">자주 묻는 질문</a>'+
      '</div>'+
    '</div></section>';
  return '<section class="bcta"><div class="w bcta-c">'+
    '<p class="eyebrow">FREE ESTIMATE</p>'+
    '<h2>지금, '+esc(wa)+' 함께 시작하세요.</h2>'+
    '<p>업종 · 지역 · 조건을 한 번만 적어 보내시면, 운영자가 확인하고 '+
      '맞는 업체가 있으면 연결을 도와 드립니다. 신청은 무료이고 가입이 필요 없습니다.</p>'+
    '<div class="bcta-go">'+
      '<a class="btn btn-ac btn-lg" href="/quote" data-to="/quote">'+
        '무료 견적 신청'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-cr btn-lg" href="/faq">자주 묻는 질문</a>'+
    '</div>'+
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

function swCat(k){
  var C = window.AM_CATS || [];
  for(var i = 0; i < C.length; i++) if(C[i].key === k) return C[i];
  return null;
}
function swTo(k){
  var c = swCat(k);
  if(!c) return "";
  return (typeof catTo === "function") ? catTo(c) : ("/providers/" + c.key);
}
function swOpen(){ return !!(window.WOW_BIZ && WOW_BIZ.sosReady); }

function swKeys(list){

  var row = function(part){
    return '<ul class="sw-keys">' + part.map(function(x){
      var to = swTo(x[1]);
      return to ? '<li><a href="'+esc(to)+'">'+esc(x[0])+'</a></li>' : "";
    }).join("") + '</ul>';
  };
  return '<div class="sw-kw">' + row(list.slice(0, 3)) + row(list.slice(3)) + '</div>';
}

var SW_START_KEYS = [["상권분석","area"],["인테리어·시공","interior"],["주방기기·설비","equip"],
                     ["POS·키오스크","it"],["마케팅·홍보","marketing"],["창업자금·정책정보","fund"]];
var SW_CLOSE_KEYS = [["폐업 절차 안내","process"],["철거·원상복구","demolish"],["집기·설비 처분","asset"],
                     ["중고매각 연결","stock"],["세무정리","tax"],["폐업지원 정보","support"]];

function HomeSplitHero(){
  var nm = (window.amBrand ? amBrand() : ((window.AM_BRAND || {}).name || ""));
  var ph = function(k){ return hasPhoto(k)
    ? '<span class="sw-hph" aria-hidden="true">'+photoBox(k, "", true, "(max-width:768px) 100vw, 50vw")+'</span>' : ""; };
  return '<section class="bhero sw-hero">'+
    '<h1 class="sr-only">'+esc(nm)+' — 창업부터 폐업까지, 사장님의 모든 가게 이야기</h1>'+
    '<div class="sw-hgrid">'+
      '<div class="sw-hp sw-hp-st">'+ ph("hero-start") +
        '<div class="sw-hin">'+
          '<p class="sw-hk">새로운 시작을 준비하는 사장님이라면!</p>'+
          '<h2>'+icon("store",44)+'<span>창업 준비</span></h2>'+
          swKeys(SW_START_KEYS)+
          '<a class="sw-hbtn sw-hbtn-st" href="/startup"><span>창업 준비 <span class="sw-hbtn-x">서비스 </span>보기</span>'+icon("arrow",18)+'</a>'+
        '</div>'+
      '</div>'+
      '<div class="sw-hp sw-hp-cl">'+ ph("hero-close") +
        '<div class="sw-hin">'+
          '<p class="sw-hk">정리도, 새로운 시작도 체계적으로!</p>'+
          '<h2>'+icon("hammer",44)+'<span>폐업·철거</span></h2>'+
          swKeys(SW_CLOSE_KEYS)+
          '<a class="sw-hbtn sw-hbtn-cl" href="/closure"><span>폐업·철거 <span class="sw-hbtn-x">서비스 </span>보기</span>'+icon("arrow",18)+'</a>'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<form class="sw-find" role="search" action="/search" onsubmit="return swFind(event)">'+
      '<label class="sr-only" for="sw-q">서비스 검색</label>'+
      icon("search",22)+
      '<input id="sw-q" name="q" type="search" autocomplete="off" '+
        'placeholder="지금, 어떤 서비스가 필요하신가요? (예: 인테리어, 철거, 매장 양도)">'+
      '<button class="sw-find-b" type="submit">검색</button>'+
    '</form>'+

    '<nav class="sw-tr" aria-label="매장 양도양수">'+
      '<a class="sw-trb" href="/stores">'+icon("search",20)+'<span><b>매장 찾기</b><i>지역 · 업종 · 보증금 · 월세 · 권리금으로 거르기</i></span>'+icon("arrow",16)+'</a>'+
      '<a class="sw-trb" href="/sell" data-cta="on" data-cta-form="sell" hidden>'+icon("handover",20)+'<span><b>내 매장 넘기기</b><i>매물 등록 신청 — 운영자 검수 뒤 게시</i></span>'+icon("arrow",16)+'</a>'+
      '<a class="sw-trb" href="/transfer?t=out" data-cta="off" data-cta-form="sell">'+icon("handover",20)+'<span><b>내 매장 넘기기</b><i>넘기는 순서와 권리금부터 보기</i></span>'+icon("arrow",16)+'</a>'+
    '</nav>'+
  '</section>';
}
window.swFind = function(e){
  if(e) e.preventDefault();
  var el = document.getElementById("sw-q"), q = el ? el.value.trim() : "";
  go(q ? "/search?q=" + encodeURIComponent(q) : "/search");
  return false;
};

var SW_QUICK = [
  { to:"/transfer",  ic:"handover",  b:"매장 양도양수", s:"전국 매물 찾기 · 등록" },
  { to:"/operation", ic:"gauge",     b:"매장 운영",     s:"운영에 필요한 서비스" },
  { to:"/providers", ic:"users",     b:"제휴업체",       s:"분야별 업체 찾기" },
  { to:"/about",     ic:"book",      b:"이용 가이드",    s:"신청 방법과 진행 절차" }
];
var SW_FLOW = [
  { to:"/startup",   ic:"rocket",   b:"창업 준비",     s:"가게 시작을 위한 준비" },
  { to:"/operation", ic:"store",    b:"매장 운영",     s:"운영 효율화 · 비용 점검" },
  { to:"/transfer",  ic:"handover", b:"매장 양도양수", s:"넘기고 받는 길 안내" },
  { to:"/closure",   ic:"hammer",   b:"폐업·철거",     s:"정리 · 처분 · 세무까지" }
];
function HomeQuick(){
  var en = ((window.AM_BRAND || {}).en || "");
  var q = SW_QUICK.map(function(x){
    return '<li><a class="sw-qc" href="'+esc(x.to)+'">'+
      '<span class="sw-qi" aria-hidden="true">'+icon(x.ic,34)+'</span>'+
      '<span class="sw-qt"><b>'+esc(x.b)+'</b><em>'+esc(x.s)+'</em></span>'+
      '<span class="sw-qgo" aria-hidden="true">'+icon("arrow",16)+'</span></a></li>';
  }).join("");
  var f = SW_FLOW.map(function(x){
    return '<li><a class="sw-fl" href="'+esc(x.to)+'">'+
      '<span class="sw-fi" aria-hidden="true">'+icon(x.ic,36)+'</span>'+
      '<span class="sw-ft"><b>'+esc(x.b)+'</b><em>'+esc(x.s)+'</em></span></a></li>';
  }).join("");
  return '<section class="bent sw-quick"><div class="w">'+
    '<ul class="sw-qg">'+q+'</ul>'+
    '<h2 class="sw-flh">'+(en ? '<i>'+esc(en)+'</i> ' : '')+'하나로, 사장님의 모든 순간을 해결하세요.</h2>'+
    '<ol class="sw-flg">'+f+'</ol>'+
  '</div></section>';
}

function HomeStores(){
  var S = (window.AM_STORES || []).slice().sort(function(a, b){
    return String(b.at || "").localeCompare(String(a.at || ""));
  }).slice(0, 4);
  var right;
  if(S.length){
    right = '<p class="sw-stab"><span>최신 등록</span></p>'+
      '<ul class="sw-sg">' + S.map(function(s){
        var won = function(v){ return (v != null && v !== "") ? (Number(v).toLocaleString("ko-KR") + "만원") : ""; };
        var ind = (typeof amIndustryName === "function") ? amIndustryName(s.industry) : "";
        var reg = [(typeof amRegionName === "function") ? amRegionName(s.region) : "", s.gu || ""].filter(Boolean).join(" ");
        return '<li><a class="sw-sc" href="/s/'+esc(s.id)+'">'+
          (ind ? '<span class="sw-sk">'+esc(ind)+'</span>' : "")+
          (reg ? '<span class="sw-sr">'+esc(reg)+'</span>' : "")+
          '<b>'+esc(s.title || "")+'</b>'+
          (s.premium != null ? '<span class="sw-sp">권리금 <i>'+esc(won(s.premium))+'</i></span>' : "")+
          '<span class="sw-sm">'+[s.deposit != null ? "보증금 "+won(s.deposit) : "", s.rent != null ? "월세 "+won(s.rent) : ""].filter(Boolean).map(esc).join(" · ")+'</span>'+
          '<span class="sw-sn">올리신 사장님이 적으신 값입니다</span>'+
        '</a></li>';
      }).join("") + '</ul>';
  }else{

    var sub = function(L){ return '<span class="sw-pb-l">'+L.map(function(x){
        return '<a href="'+esc(x[0])+'">'+esc(x[1])+icon("chev",13)+'</a>'; }).join("")+'</span>'; };
    right = '<div class="sw-pb-g">'+
        '<div class="sw-pb"><a class="sw-pb-h" href="/stores"><span class="sw-pb-i" aria-hidden="true">'+icon("store",26)+'</span>매장 찾기'+icon("chev",18)+'</a>'+
          sub([["/tools/premium","권리금 계산"],["/content?j=startup&cat=store","인수 계약 가이드"],["/tools/vs","신규 vs 인수"]])+'</div>'+
        '<div class="sw-pb"><a class="sw-pb-h" href="/transfer?t=out"><span class="sw-pb-i" aria-hidden="true">'+icon("handover",26)+'</span>내 매장 넘기기'+icon("chev",18)+'</a>'+
          sub([["/tools/premium","권리금 계산"],["/transfer?t=out","넘기는 순서"],["/content?j=acquisition","양도 준비 가이드"]])+'</div>'+
      '</div>'+
      '<p class="sw-s0-n sw-prep-n">'+icon("info",15)+' 현재 등록된 매물이 없습니다. <a href="/stores">매장 찾기'+icon("chev",13)+'</a></p>'+

      '<a class="sw-s0-go" href="/sell" data-cta="on" data-cta-form="sell" hidden>매장 내놓기 안내'+icon("arrow",15)+'</a>';
  }
  var none = !S.length;
  return '<section class="bpass sw-store"><div class="w sw-sw">'+
    '<div class="sw-sl">'+
      (none ? '' : '<p class="sw-ey">전국 매장 양도양수</p>')+
      (none
        ? '<h2>매장 인수 · 양도 준비</h2>'+
          '<p>매장을 찾거나, 운영 중인 매장을 다음 사장님에게 넘겨보세요.</p>'
        : '<h2>원하는 매장을<br class="br-m"> 지금 바로 찾아보세요.</h2>'+
          '<p>지역 · 업종 · 보증금 · 월세 · 권리금으로 매물을 걸러 보실 수 있습니다.</p>'+
          '<a class="sw-sl-go" href="/stores">매물 전체보기'+icon("arrow",15)+'</a>')+
      (none ? '' : '<span class="sw-pin" aria-hidden="true">'+icon("pin",64)+'</span>')+
    '</div>'+
    '<div class="sw-sr-w">'+right+'</div>'+
  '</div></section>';
}

function HomeTrust(){
  var en = ((window.AM_BRAND || {}).en || "");
  var nTool = (window.AM_TOOLS || []).length;
  var T = [
    { ic:"layers",  b:"창업부터 폐업까지 한곳에", s:"준비 · 운영 · 양도 · 정리 서비스를 단계별로" },
    { ic:"calc",    b:"무료 계산도구"+(nTool ? " "+nTool+"개" : ""), s:"창업비 · 손익분기 · 권리금 · 폐업비용" },
    { ic:"shield",  b:"지어낸 업체 · 매물 없음",  s:"확인된 것만 올리고, 없으면 없다고 말합니다" },
    { ic:"lock",    b:"연락처는 동의 뒤에만",     s:"업체가 정해지면 상호를 알리고 다시 여쭙니다" }
  ];
  return '<section class="bwhy sw-trust"><div class="w"><div class="sw-tb">'+
    '<h2>왜 '+(en ? '<i>'+esc(en)+'</i>' : '인수인계')+'일까요?</h2>'+
    '<ul>'+T.map(function(x){
      return '<li>'+icon(x.ic,30)+'<span><b>'+esc(x.b)+'</b><em>'+esc(x.s)+'</em></span></li>';
    }).join("")+'</ul>'+
  '</div></div></section>';
}

var SW_SHORT = ["interior","equip","it","marketing","staff","admin","asset"];
function HomeShortcuts(){
  var li = SW_SHORT.map(function(k){
    var c = swCat(k); if(!c) return "";
    return '<li><a class="sw-shc" href="'+esc(swTo(k))+'">'+icon(c.icon || "doc",34)+
      '<span>'+esc(c.name)+'</span></a></li>';
  }).filter(Boolean).join("");
  if(!li) return "";
  return '<section class="bdir sw-short"><div class="w">'+
    '<div class="sw-shh"><h2>서비스 바로가기</h2><p>사장님께 필요한 서비스를 한곳에서 빠르게 찾아보세요.</p></div>'+
    '<ul class="sw-shg">'+li+'</ul>'+

    HomePicked()+
  '</div></section>';
}

var HOME_HERO_CHIPS = [
  { to:"/stores",             name:"매장 매물" },
  { to:"/tools/cost",         name:"창업 비용" },
  { to:"/c/area",             name:"상권 · 입지" },
  { to:"/providers/interior", name:"인테리어" },
  { to:"/tools/closecost",    name:"폐업 비용" }
];

var HOME_SPLIT = [
  { k:"st", to:"/startup", ph:"hero-startup", tag:"창업 준비", h:"새로운 시작을 준비하시나요?",
    l:"창업에 필요한 준비를 한번에 확인하세요.", m:"창업에 필요한 준비를 확인하세요.", go:"창업 준비 보기" },
  { k:"cl", to:"/closure", ph:"hero-closure", tag:"폐업·철거", h:"매장 정리를 고민하시나요?",
    l:"폐업부터 철거 · 원상복구까지 필요한 절차를 안내합니다.", m:"폐업부터 철거 · 원상복구까지 안내합니다.", go:"매장 정리 방법 보기" }
];
function HomeSplitSW(){
  return '<section class="bhero sw3"><div class="w">'+
    '<div class="sw3-hd"><h1 class="sw3-h">자영업의 모든 순간을 연결합니다.</h1>'+
      '<p>창업부터 매장 운영, 양도양수, 폐업 · 철거까지 한곳에서 준비하세요.</p></div>'+
    '<ul class="sw3-g">'+HOME_SPLIT.map(function(x){
      return '<li class="sw3-c sw3-'+x.k+'"><a href="'+esc(x.to)+'">'+
        (hasPhoto(x.ph) ? '<span class="sw3-ph" aria-hidden="true">'+photoBox(x.ph, "", true, "(max-width:768px) 100vw, 50vw")+'</span>' : '')+
        '<span class="sw3-tx">'+
          '<span class="sw3-tag">'+esc(x.tag)+'</span>'+

          '<h2>'+esc(x.h).replace(/ (\S+)$/, "<br>$1")+'</h2>'+
          '<span class="sw3-p"><span class="sw3-l">'+esc(x.l)+'</span><span class="sw3-m">'+esc(x.m)+'</span></span>'+
          '<span class="sw3-go">'+esc(x.go)+icon("chev",16)+'</span>'+
        '</span></a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

function HomeFindSW(){
  return '<section class="sw3-find-s"><div class="w">'+
    '<form class="sw-find sw2-find sw3-find" role="search" action="/search" onsubmit="return swFind(event)">'+
      '<span class="sw3-find-i" aria-hidden="true">'+icon("search",20)+'</span>'+
      '<label class="sr-only" for="sw-q">서비스 · 매장 · 가이드 검색</label>'+
      '<input id="sw-q" name="q" type="search" autocomplete="off" placeholder="서비스, 매장, 가이드 검색">'+
      '<button class="sw-find-b sw3-find-b" type="submit">검색</button>'+
    '</form>'+
  '</div></section>';
}

function HomeHeroSW(){
  var nm = (window.amBrand ? amBrand() : ((window.AM_BRAND || {}).name || ""));
  var who = (typeof koWith === "function") ? koWith(nm, "이가") : nm + "가";
  return '<section class="bhero sw2-hero">'+
    (hasPhoto("hero-start")
      ? '<div class="sw2-ph" aria-hidden="true">'+photoBox("hero-start", "", true, "100vw")+'</div>' : '')+
    '<div class="w sw2-in">'+
      '<p class="sw2-k">창업 · 운영 · 양도양수 · 폐업까지</p>'+
      '<h1 class="sw2-h"><span>자영업의 <em>시작과 끝,</em></span> <span>'+esc(who)+' 함께합니다.</span></h1>'+

      '<p class="sw2-s"><span class="sw2-s-l">창업 준비부터 매장 운영의 고민 해결, 매장 양도양수, 폐업 · 철거까지 '+
        '자영업자에게 필요한 서비스를 한곳에서 찾고 비교하세요.</span>'+
        '<span class="sw2-s-m">창업부터 폐업까지 필요한 서비스를 한곳에서 찾고 비교하세요.</span></p>'+
      '<form class="sw-find sw2-find" role="search" action="/search" onsubmit="return swFind(event)">'+
        '<label class="sr-only" for="sw-q">서비스 · 매물 · 정보 검색</label>'+
        '<input id="sw-q" name="q" type="search" autocomplete="off" '+
          'placeholder="서비스 · 매물 · 정보 검색">'+
        '<button class="sw-find-b" type="submit" aria-label="검색">'+icon("search",22)+'</button>'+
      '</form>'+
      '<nav class="sw2-chips" aria-label="바로가기">'+
        '<span class="sw2-chips-k">바로가기</span>'+
        HOME_HERO_CHIPS.map(function(c){
          return '<a href="'+esc(c.to)+'">#'+esc(c.name.replace(/ · /g, "·"))+'</a>';
        }).join("")+
      '</nav>'+
    '</div>'+
  '</section>';
}

var HOME_ENTRY_SW = [
  { k:"startup",  to:"/startup",   no:"01", ic:"rocket",   ph:"hero-startup", b:"창업 준비",     s:["창업비 계산","업종별 준비"] },
  { k:"ops",      to:"/operation", no:"02", ic:"chart",    ph:"hero-ops",     b:"매장 운영",     s:["비용 절감","홍보","시설 관리"] },
  { k:"transfer", to:"/transfer",  no:"03", ic:"store",    ph:"kind-pass",    b:"매장 양도양수", s:["매장 찾기","내 매장 넘기기"] },
  { k:"closure",  to:"/closure",   no:"04", ic:"hammer",   ph:"hero-closure", b:"폐업·철거",     s:["집기 처분","철거","원상복구"] }
];
function HomeEntrySW(){
  return '<section class="bent sw2-ent"><div class="w">'+
    '<h2 class="sr-only">네 가지 핵심 서비스</h2>'+
    '<ul class="sw2-eg">'+
      HOME_ENTRY_SW.map(function(e){
        return '<li class="sw2-ec ent-'+esc(e.k)+'"><a href="'+esc(e.to)+'">'+
          (hasPhoto(e.ph) ? '<span class="sw2-eph" aria-hidden="true">'+
            photoBox(e.ph, "", false, "(max-width:768px) 50vw, 25vw")+'</span>' : '')+
          '<span class="sw2-eno bent-no" aria-hidden="true">'+esc(e.no)+'</span>'+
          '<span class="sw2-ei" aria-hidden="true">'+icon(e.ic,34)+'</span>'+
          '<b class="sw2-eb">'+esc(e.b)+'</b>'+

          '<span class="sw2-es">'+[].concat(e.s).map(function(x){ return '<span class="sw2-es-p">'+esc(x)+'</span>'; }).join(" · ")+'</span>'+
          '<span class="sw2-ego" aria-hidden="true">'+icon("arrow",20)+'</span>'+
        '</a></li>';
      }).join("")+
    '</ul>'+
  '</div></section>';
}

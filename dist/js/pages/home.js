

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

  return PwHero()+ PwDevice()+ PwBiz()+ PwQuick()+
         PwSteps()+ PwTrust()+ PwCta();
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
        '<p class="bhero-s">창업 준비, 매장 운영, 매장 양도양수, 폐업 · 정리에 '+
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
  return '<section class="bcta"><div class="w bcta-c">'+
    '<p class="eyebrow">FREE ESTIMATE</p>'+
    '<h2>지금, '+esc(wa)+' 함께 시작하세요.</h2>'+
    '<p>업종 · 지역 · 조건을 한 번만 적어 보내시면, 그 분야 업체를 찾아 '+
      '연결해 드립니다. 신청은 무료이고 가입이 필요 없습니다.</p>'+
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

function pwTick(){
  return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" '+
    'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" '+
    'stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7"/></svg>';
}
function pwArrow(){
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" '+
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" '+
    'stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
}

var PW_HERO_CHIPS = [
  ["bolt", "직접 매입", "폰웨이가 바로 삽니다"],
  ["bid",  "전국 업체 경쟁입찰", "여러 곳 견적 비교"],
  ["ck",   "검수 완료 중고폰", "상태를 밝히고 팝니다"]
];
var PW_CHIP_IC = {
  bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z"/>',
  bid:  '<path d="m13 4 7 7M9.5 7.5 16.5 14.5M5 21h7M8 18 3.5 13.5l9-9L17 9l-9 9Z"/>',
  ck:   '<path d="M12 3 4 6v6c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>'
};

function PwHero(){
  return '<section class="pwh">'+
    '<div class="pwh-bg" aria-hidden="true">'+
      '<span class="pwh-bg-panel"></span>'+
      '<span class="pwh-bg-glow"></span>'+
    '</div>'+
    '<div class="w pwh-in">'+
      '<div class="pwh-tx">'+

        '<p class="pwh-k">PHONEWAY</p>'+
        '<p class="pwh-k2">중고폰, 더 스마트하게</p>'+

        '<h1><span class="pwh-h1a">지금, 당신의 폰이</span>'+
          '<em>새로운 가치를</em><em>만납니다.</em></h1>'+
        '<p class="pwh-sub">여러 업체의 견적을 비교하고<br>'+
          '가장 좋은 조건으로 거래하세요.</p>'+
        pwHero3()+
      '</div>'+
      '<div class="pwh-art">'+
        photoBox("dev-iphone", "pwh-ph", true,
          "(max-width:899px) 44vw, (max-width:1199px) 34vw, 400px")+
      '</div>'+

      '<div class="pwh-go">'+
        '<a class="btn pwh-b1" href="/sell" data-to="/sell">'+
          icon("mobile",21)+'<b>내 폰 팔기</b>'+ pwArrow() +'</a>'+
        '<a class="btn pwh-b2" href="/shop" data-to="/shop">'+
          icon("cart",21)+'<b>중고폰 구매하기</b>'+ pwArrow() +'</a>'+
      '</div>'+
    '</div>'+
    pwHeroTrust()+
  '</section>';
}

var PW_HERO3 = [
  ["shield", "전문업체", "연결"],
  ["coins",  "견적 비교", "한 번에"],
  ["lock",   "개인정보", "보호"]
];
function pwHero3(){
  return '<ul class="pwh-f3">'+ PW_HERO3.map(function(t){
    return '<li><i>'+ icon(t[0],26) +'</i><b>'+ esc(t[1]) +'</b>'+
      '<span>'+ esc(t[2]) +'</span></li>'; }).join("") +'</ul>';
}

var PW_TRUST4 = [
  ["tag",    "지금 바로",   "견적 비교"],
  ["bolt",   "수거 · 정산", "한 흐름으로"],
  ["shield", "개인정보",    "안전 처리"],
  ["seed",   "지속 가능한", "중고 거래"]
];
function pwHeroTrust(){
  return '<div class="pwh-tr"><ul class="w pwh-tr-g">'+ PW_TRUST4.map(function(t){
    return '<li><i>'+ icon(t[0],26) +'</i>'+
      '<span><b>'+ esc(t[1]) +'</b><span>'+ esc(t[2]) +'</span></span></li>';
  }).join("") +'</ul></div>';
}

function pwHeroArt(){
  return '<svg class="pwh-svg" viewBox="0 0 440 400" aria-hidden="true">'+
    '<defs>'+

      '<linearGradient id="pwa" x1=".1" y1="0" x2=".9" y2="1">'+
        '<stop offset="0" stop-color="#C9BBAE"/><stop offset=".45" stop-color="#4E5560"/>'+
        '<stop offset="1" stop-color="#2E3740"/></linearGradient>'+

      '<linearGradient id="pwsc" x1="0" y1="0" x2=".6" y2="1">'+
        '<stop offset="0" stop-color="#1B242E"/><stop offset="1" stop-color="#0E141B"/></linearGradient>'+

      '<linearGradient id="pwhg" x1="0" y1="0" x2="1" y2="1">'+
        '<stop offset="0" stop-color="#353F4A"/><stop offset="1" stop-color="#1B242E"/></linearGradient>'+
      '<linearGradient id="pwcard" x1="0" y1="0" x2="0" y2="1">'+
        '<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FBEFE4"/></linearGradient>'+
      '<radialGradient id="pwglow" cx=".5" cy=".5" r=".5">'+
        '<stop offset="0" stop-color="#E07A2E" stop-opacity=".55"/>'+
        '<stop offset="1" stop-color="#E07A2E" stop-opacity="0"/></radialGradient>'+
    '</defs>'+

    '<circle cx="224" cy="186" r="172" fill="url(#pwglow)"/>'+
    '<ellipse cx="224" cy="358" rx="150" ry="17" fill="#080D13" opacity=".45"/>'+

    '<g transform="rotate(-11 300 200)" opacity=".92">'+
      '<rect x="258" y="86" width="132" height="226" rx="26" fill="url(#pwa)"/>'+
      '<rect x="266" y="94" width="116" height="210" rx="20" fill="url(#pwhg)"/>'+
      '<rect x="302" y="100" width="36" height="7" rx="3.5" fill="#2F3842"/>'+
      '<rect x="282" y="130" width="84" height="6" rx="3" fill="#3A444F" opacity=".8"/>'+
      '<rect x="282" y="146" width="58" height="6" rx="3" fill="#303A45" opacity=".8"/>'+
      '<rect x="282" y="176" width="84" height="46" rx="8" fill="#242E39" opacity=".75"/>'+
    '</g>'+

    '<g>'+
      '<rect x="128" y="60" width="168" height="282" rx="30" fill="url(#pwa)"/>'+
      '<rect x="137" y="69" width="150" height="264" rx="23" fill="url(#pwsc)"/>'+
      '<rect x="188" y="76" width="48" height="9" rx="4.5" fill="#282F38"/>'+

      '<rect x="152" y="100" width="120" height="58" rx="11" fill="#242E39"/>'+
      '<rect x="162" y="112" width="26" height="34" rx="5" fill="#EDC09A"/>'+
      '<rect x="196" y="116" width="62" height="7" rx="3.5" fill="#F3CDAA"/>'+
      '<rect x="196" y="130" width="40" height="6" rx="3" fill="#9A8B7E"/>'+

      '<rect x="152" y="176" width="120" height="7" rx="3.5" fill="#2E3A47"/>'+
      '<rect x="152" y="176" width="52" height="7" rx="3.5" fill="#F8A066"/>'+
      '<rect x="152" y="196" width="120" height="7" rx="3.5" fill="#2E3A47"/>'+
      '<rect x="152" y="196" width="86" height="7" rx="3.5" fill="#F37021"/>'+
      '<rect x="152" y="216" width="120" height="7" rx="3.5" fill="#2E3A47"/>'+
      '<rect x="152" y="216" width="68" height="7" rx="3.5" fill="#F8A066"/>'+

      '<rect x="152" y="246" width="120" height="30" rx="15" fill="#F37021"/>'+
      '<rect x="182" y="258" width="60" height="7" rx="3.5" fill="#FFE0C4"/>'+

      '<rect x="186" y="314" width="52" height="6" rx="3" fill="#313B46"/>'+
    '</g>'+

    '<g transform="translate(246 236)">'+
      '<rect x="0" y="0" width="150" height="62" rx="14" fill="url(#pwcard)"/>'+
      '<circle cx="31" cy="31" r="17" fill="#E4F6F1"/>'+
      '<path d="M23.5 31.5l5.5 5.5 10.5-11.5" fill="none" stroke="#12806C" '+
        'stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<rect x="58" y="20" width="70" height="8" rx="4" fill="#12806C"/>'+
      '<rect x="58" y="36" width="48" height="7" rx="3.5" fill="#B9BFC7"/>'+
    '</g>'+

    '<g transform="translate(44 108)">'+
      '<rect x="0" y="0" width="104" height="46" rx="13" fill="url(#pwcard)"/>'+
      '<circle cx="26" cy="23" r="14" fill="#18212B"/>'+
      '<path d="M26 14.5l2.9 5.9 6.5 1-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4-4.7-4.6 6.5-1z" fill="#E7B65C"/>'+
      '<rect x="50" y="15" width="40" height="7" rx="3.5" fill="#222B35"/>'+
      '<rect x="50" y="28" width="26" height="6" rx="3" fill="#B2B8C0"/>'+
    '</g>'+

    '<g transform="translate(330 48)">'+
      '<rect x="0" y="0" width="78" height="78" rx="20" fill="url(#pwcard)"/>'+
      '<circle cx="39" cy="33" r="19" fill="none" stroke="#F2E6DA" stroke-width="7"/>'+
      '<path d="M39 14a19 19 0 0 1 14.8 30.9" fill="none" stroke="#16A085" '+
        'stroke-width="7" stroke-linecap="round"/>'+
      '<rect x="22" y="60" width="34" height="7" rx="3.5" fill="#B9BFC7"/>'+
    '</g>'+
  '</svg>';
}

var PW_WAYS = [
  { no:"01", kind:"a", to:"/sell", cta:"바로 판매하기",
    ic:'<rect x="2.5" y="6" width="19" height="13" rx="2.6"/>'+
       '<path d="M2.5 10.5h19M6.5 15h3"/>',

    h:function(){ return (window.amBrand ? amBrand() : "") + " 직접 매입"; },
    lead:"저희가 직접 삽니다. 한 번만 등록하시면 예상 매입가를 바로 "+
         "확인하실 수 있습니다.",
    li:["빠르고 간편한 판매","검수 기준을 미리 공개","최종 금액에 동의한 뒤 정산"],
    note:function(){
      return '⚠️ 등록 화면에 적으신 상태를 기준으로 한 <b>예상 금액</b>입니다. '+
             '기기를 받아 검수한 뒤 최종 금액을 다시 안내드리고, 동의하신 '+
             '뒤에 정산합니다.'; } },
  { no:"02", kind:"b", to:"/bid", cta:"견적 비교 신청하기",
    ic:'<path d="m13 3.5 7.5 7.5M9.5 7 17 14.5M4.5 21h8M7.5 17.5 3 13l9.5-9.5L17 8l-9.5 9.5Z"/>',
    h:function(){ return "전국 업체 경쟁입찰"; },
    lead:"전국의 인증 매입업체가 견적을 냅니다. 가격만이 아니라 거래 "+
         "조건까지 나란히 놓고 고르세요.",
    li:["여러 업체 견적 비교","검수 기준 · 정산 소요일 비교","고르는 것은 사장님입니다"],
    note:function(){
      var n = (window.AM_PROVIDERS || []).length;
      return n ? ('지금 <b>'+ n +'곳</b>이 참여하고 있습니다. 견적은 신청하신 '+
                  '기기의 조건을 보고 업체가 직접 냅니다.')
               : ('⚠️ <b>지금 입점업체를 모집하고 있습니다.</b> 참여 업체가 '+
                  '생기면 이 자리에 실제 견적이 나란히 섭니다 — 없는 업체를 '+
                  '미리 보여 드리지 않습니다.'); } }
];
function PwWays(){
  return '<section class="pww"><div class="w">'+
    '<div class="pw-hd">'+
      '<span class="pw-ey">HOW TO SELL</span>'+
      '<h2>휴대폰을 판매하는 두 가지 방법</h2>'+
      '<p>원하는 방식으로 더 높은 가치를 받아보세요.</p>'+
    '</div>'+
    '<div class="pww-g">'+ PW_WAYS.map(pwWayCard).join("") +'</div>'+
  '</div></section>';
}
function pwWayCard(o){
  return '<article class="pww-c'+ (o.kind==="b" ? " b" : "") +'">'+
    '<span class="pww-no">'+ esc(o.no) +'</span>'+
    '<div class="pww-ic"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" '+
      'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '+
      'stroke-linejoin="round" aria-hidden="true">'+ o.ic +'</svg></div>'+
    '<h3>'+ esc(typeof o.h === "function" ? o.h() : o.h) +'</h3>'+
    '<p class="pww-l">'+ esc(o.lead) +'</p>'+
    '<ul>'+ o.li.map(function(t){
      return '<li>'+ pwTick() + esc(t) +'</li>'; }).join("") +'</ul>'+
    '<a class="btn '+ (o.kind==="b" ? "btn-pw-o" : "btn-pw") +'" href="'+ esc(o.to) +'">'+
      esc(o.cta) +'</a>'+
    '<p class="pww-n">'+ (typeof o.note === "function" ? o.note() : o.note) +'</p>'+
  '</article>';
}

var PW_KINDS = [
  ["/shop?m=iphone",  "아이폰",   "iPhone",
   '<rect x="6" y="2.5" width="12" height="19" rx="2.8"/><path d="M10.5 5.5h3"/>'],
  ["/shop?m=galaxy",  "갤럭시",   "Galaxy",
   '<rect x="5.5" y="2.5" width="13" height="19" rx="3"/><path d="M12 18.5h.01"/>'],
  ["/shop?m=tablet",  "태블릿",   "iPad · Tab",
   '<rect x="3" y="4" width="18" height="16" rx="2.6"/><path d="M12 16.5h.01"/>'],
  ["/shop?m=etc",     "기타 기기", "워치 · 버즈",
   '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>']
];
function PwShop(){
  var P = window.AM_PRODUCTS || [];
  return '<section class="pws"><div class="w">'+
    '<div class="pw-hd-l">'+
      '<div><h2>검증된 중고폰을, 믿고 구매하세요</h2>'+
        '<p>폰웨이가 직접 매입하고 검수한 기기만 판매합니다.</p></div>'+
      '<a class="pw-more" href="/shop">전체 보기 '+ pwArrow() +'</a>'+
    '</div>'+
    '<ul class="pws-g">'+ PW_KINDS.map(function(k){
      return '<li><a class="pws-c" href="'+ esc(k[0]) +'">'+
        '<i><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
          'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
          k[3] +'</svg></i>'+
        '<b>'+ esc(k[1]) +'</b><span>'+ esc(k[2]) +'</span></a></li>';
    }).join("") +'</ul>'+
    (P.length ? "" :
      '<div class="pws-e">'+
        '<b>지금 판매 중인 상품이 0건입니다.</b>'+
        '<p>검수를 마친 기기부터 이 자리에 올라옵니다. 한 대라도 올라오면 사진 · 등급 · '+
          '배터리 상태 · 검수 결과가 그대로 보입니다.<br>'+
          '⚠️ 없는 상품을 미리 만들어 두지 않습니다.</p>'+
      '</div>')+
  '</div></section>';
}

function pwDevLink(c){

  var qs = c.more ? "?mo=1"
         : "?mk="+ encodeURIComponent(c.maker) +"&kd="+ encodeURIComponent(c.kind);
  return '<li><a class="dvc dvc-a" href="/sell'+ qs +'">'+
    '<span class="dvc-ph">'+
      (typeof hasPhoto === "function" && hasPhoto(c.ph)
        ? photoBox(c.ph, "dvc-im")
        : iconArt(c.ia, 96))+
    '</span>'+
    '<span class="dvc-tx">'+
      pwDevLogos(c)+
      '<b class="dvc-nm">'+ esc(c.nm) +'</b>'+
      '<span class="dvc-s">'+ esc(c.sub) +'</span>'+
    '</span>'+
    '<span class="dvc-go" aria-hidden="true">'+ pwArrow() +'</span>'+
  '</a></li>';
}
function PwDevice(){
  var C = window.PW_SELL_CARDS || [];
  if(!C.length) return "";
  return '<section class="pwd"><div class="w pwd-in">'+
    '<div class="pwd-hd">'+
      '<span class="pw-ey">SELL YOUR DEVICE</span>'+
      '<h2>어떤 기기를 판매하시나요?</h2>'+
      '<p>판매할 기기 종류를 선택해 주세요.</p>'+
    '</div>'+
    '<ul class="pwd-g">'+ C.map(pwDevLink).join("") +'</ul>'+
  '</div></section>';
}

var PW_BIZ = [
  { k:"1", nm:"지금 바로<br>내 폰 팔기", to:"/sell", cta:"내 폰 팔기",
    d:"복잡한 절차 없이, 간편하게 최고가 견적을 받아보세요.", ph:"biz-sell", ia:"mobile" },
  { k:"2", nm:"믿을 수 있는<br>중고폰 구매", to:"/shop", cta:"중고폰 보기",
    d:"검수를 마친 중고폰을 합리적인 가격에 만나보세요.", ph:"biz-shop", ia:"bag" },
  { k:"3", nm:"업체 경쟁입찰", to:"/bid", cta:"경쟁입찰 알아보기",
    d:"여러 업체의 견적을 한번에 비교하고 가장 높은 값에 판매하세요.",
    ph:"biz-bid", ia:"chart" },
  { k:"4", nm:"기업 · 수출 거래", to:"/biz", cta:"거래 문의하기",
    d:"대량 매입과 해외 수출을 상담으로 진행합니다.",
    note:"지금은 문의를 받는 단계입니다", ph:"biz-export", ia:"handover" }
];
function PwBiz(){
  return '<section class="pwbz"><div class="w">'+
    '<ul class="pwbz-g">'+ PW_BIZ.map(function(b){
      return '<li><a class="pwbz-c pwbz-v'+ b.k +'" href="'+ esc(b.to) +'">'+
        '<span class="pwbz-tx">'+
          '<b class="pwbz-nm">'+ b.nm +'</b>'+
          '<span class="pwbz-d">'+ esc(b.d) +'</span>'+
          (b.note ? '<span class="pwbz-note">'+ esc(b.note) +'</span>' : '')+
          '<span class="pwbz-go">'+ esc(b.cta) +' '+ pwArrow() +'</span>'+
        '</span>'+
        '<span class="pwbz-ph">'+
          (typeof hasPhoto === "function" && hasPhoto(b.ph)
            ? photoBox(b.ph, "pwbz-im")
            : '<span class="pwbz-ic">'+ iconArt(b.ia, 76) +'</span>')+
        '</span>'+
      '</a></li>';
    }).join("") +'</ul>'+
  '</div></section>';
}

var PW_QUICK = [
  ["/sell",  "mobile",   "내 폰 팔기",     "간편 신청"],
  ["/shop",  "bag",      "중고폰 구매",    "검수된 제품"],
  ["/bid",   "chart",    "경쟁입찰",       "최고가 견적"],
  ["/biz",   "handover", "수출 · 기업거래", "대량 거래"],
  ["/faq",   "chat",     "도움말",         "자주 묻는 질문"]
];
function PwQuick(){
  return '<section class="pwq"><div class="w">'+
    '<div class="pw-hd-l"><div><h2>주요 서비스 바로가기</h2></div>'+
      '<a class="pw-more" href="/guide">이용 안내 '+ pwArrow() +'</a></div>'+
    '<ul class="pwq-g">'+ PW_QUICK.map(function(q){
      return '<li><a class="pwq-c" href="'+ esc(q[0]) +'">'+
        '<i>'+ (typeof iconArt === "function" && hasIconArt(q[1])
                 ? iconArt(q[1], 44)
                 : icon(q[1], 26)) +'</i>'+
        '<b>'+ esc(q[2]) +'</b><span>'+ esc(q[3]) +'</span></a></li>';
    }).join("") +'</ul>'+
  '</div></section>';
}

function PwSteps(){
  return '<section class="pwst"><div class="w">'+
    '<div class="pw-hd"><span class="pw-ey">HOW IT WORKS</span>'+
      '<h2>'+ esc(window.amBrand ? amBrand() : "") +' 이용 방법</h2>'+
      '<p>등록부터 정산까지 다섯 걸음입니다.</p></div>'+
    '<ol class="pwst-g">'+ (window.AM_STEPS||[]).map(function(s,i){
      return '<li class="pwst-c"><span class="pwst-n">'+ (i+1) +'</span>'+
        '<i><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
          'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
          (s.art||'') +'</svg></i>'+
        '<b>'+ esc(s.n) +'</b><p>'+ esc(s.d) +'</p></li>';
    }).join("") +'</ol>'+
  '</div></section>';
}

var PW_TRUST = [
  ["검수 기준을 먼저 공개",
   "외관 · 액정 · 배터리 · 기능을 어떤 기준으로 보는지 등록 전에 읽으실 수 있습니다.",
   '<path d="M9 3.5h6l1 3.5h3.5v13H4.5v-13H8l1-3.5Z"/><path d="m9.5 13 2 2 3.5-4"/>'],
  ["개인정보 삭제 안내",
   "보내시기 전에 해 두셔야 할 것과, 저희가 받은 뒤 처리하는 절차를 그대로 적습니다.",
   '<rect x="5" y="10.5" width="14" height="10" rx="2.4"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'],
  ["진행 상황 확인",
   "접수 · 수거 · 검수 · 정산이 지금 어디까지 왔는지 화면에서 보입니다.",
   '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.2 2"/>'],

  ["분쟁이 생기면",
   "검수 결과에 동의하지 않으시면 반송받으실 수 있습니다. 반송 조건은 보내시기 전에 알려 드립니다.",
   '<path d="M12 3.5 4.5 7v5.5c0 4.3 3.1 7.9 7.5 8.5 4.4-.6 7.5-4.2 7.5-8.5V7L12 3.5Z"/><path d="M12 9v4M12 16h.01"/>']
];
function PwTrust(){
  return '<section class="pwt"><div class="w">'+
    '<div class="pw-hd"><span class="pw-ey">TRUST</span>'+
      '<h2>거래하기 전에 밝혀 둡니다</h2>'+
      '<p>지킬 수 있는 것만 적었습니다.</p></div>'+
    '<ul class="pwt-g">'+ PW_TRUST.map(function(t){
      return '<li class="pwt-c">'+
        '<i><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
          'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
          t[2] +'</svg></i>'+
        '<b>'+ esc(t[0]) +'</b><p>'+ esc(t[1]) +'</p></li>';
    }).join("") +'</ul>'+
    '<p class="pwt-n">⚠️ <b>이 화면에 "무료" · "당일 정산" · "최고가 보장" 을 적지 '+
      '않았습니다.</b> 지킬 수 있는 것만 적는 것이 이 플랫폼의 규칙입니다 — 검수 뒤 '+
      '금액이 바뀔 수 있다는 것, 정산까지 걸리는 시간, 반송 조건을 거래 전에 먼저 '+
      '보여 드립니다.</p>'+
  '</div></section>';
}

function PwCta(){
  return '<section class="pwc"><div class="w pwc-in">'+
    '<div><h2>지금 내 폰은 얼마일까요?</h2>'+
      '<p>기종과 상태만 고르면 예상 금액을 바로 보실 수 있습니다.</p></div>'+
    '<div class="pwc-go">'+
      '<a class="btn btn-pw-w" href="/sell">내 폰 팔기</a>'+
      '<a class="btn btn-pw-gh" href="/guide">이용 안내 보기</a>'+
    '</div>'+
  '</div></section>';
}



window.JourneyPick = function(current, pick){
  return '<ul class="jy-g">'+(window.AM_JOURNEYS||[]).map(function(j){
    var on = (j.key === current);
    var to = pick ? jyPickTo(on ? "" : j.key) : j.to;
    return '<li><a class="jy'+tn(j.tone)+(on?" on":"")+'" href="'+esc(to)+'"'+
      (pick ? ' data-keep' : '')+
      (on ? ' aria-current="'+(pick ? "true" : "page")+'"' : '')+'>'+
      '<span class="jy-i">'+icon(j.icon,24)+'</span>'+
      '<b>'+esc(j.name)+'</b>'+
      '<em class="jy-q">'+esc(j.q)+'</em>'+
      '<i class="jy-s">'+esc(j.sub)+'</i>'+
      '<span class="jy-go" aria-hidden="true">'+
        icon(pick ? (on ? "check" : "plus") : "arrow",16)+'</span>'+
    '</a></li>';
  }).join("")+'</ul>';
};

function jyPickTo(key){
  var q = [], i = nowQS("i");
  if(key) q.push("j=" + encodeURIComponent(key));
  if(i)   q.push("i=" + encodeURIComponent(i));
  return "/" + (q.length ? "?" + q.join("&") : "");
}

window.amJourney = function(key){
  var L = window.AM_JOURNEYS || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

window.amJourneySide = function(key){
  var j = amJourney(key);
  return j && (j.side === "start" || j.side === "close") ? j.side : "";
};

window.JourneyBand = function(o){
  o = o || {};
  return '<section class="sec jyb'+(o.tone ? " "+o.tone : "")+'"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">'+esc(o.kicker || "WHAT DO YOU NEED")+'</p>'+
      '<h2>'+esc(o.title || "지금 무엇을 준비하고 계신가요?")+'</h2>'+
      '<p>'+esc(o.lead || "고르시면 그 다음에 필요한 것만 추려 드립니다.")+'</p>'+
    '</div>'+
    JourneyPick(o.current || "")+
  '</div></section>';
};

function StepLinks(s, ind){
  var out = [], iq = ind ? ("i=" + encodeURIComponent(ind)) : "";
  var cat = s.cat && (typeof amCat === "function") ? amCat(s.cat) : null;

  if(cat){
    var to = catTo(cat), q = [];
    if(s.sub) q.push("s=" + encodeURIComponent(s.sub));
    if(iq) q.push(iq);

    out.push(['<a class="pcs-l pcs-l-b" href="'+esc(to + (q.length ? "?"+q.join("&") : ""))+'">'+
      icon(cat.kind === "provider" ? "users" : "doc", 15)+
      esc(cat.kind === "provider" ? (cat.name + " 업체") : cat.name)+'</a>', 1]);
  }
  if(s.to){
    var c2 = (typeof amCat === "function" && s.cat) ? amCat(s.cat) : null;
    var nm = s.to === "/stores" ? "매장 매물" : s.to === "/assets" ? "시설 · 장비"
           : s.to === "/support" ? "지원사업" : s.to === "/quote" ? "접수하기" : "바로가기";
    if(!c2 || catTo(c2) !== s.to)
      out.push(['<a class="pcs-l" href="'+esc(s.to + (iq ? "?"+iq : ""))+'">'+
        icon("arrow",15)+esc(nm)+'</a>', 2]);
  }
  if(s.to2)
    out.push(['<a class="pcs-l" href="'+esc(s.to2 + (iq ? "?"+iq : ""))+'">'+
      icon("arrow",15)+esc(s.to2n || "바로가기")+'</a>', 2]);
  if(s.read){
    var ct = (typeof amContent === "function") ? amContent(s.read) : null;
    if(ct) out.push(['<a class="pcs-l" href="/content/'+esc(ct.slug)+'">'+
      icon("book",15)+esc(ct.title)+'</a>', 3]);
  }
  if(s.tool){
    var tl = (window.AM_TOOLS||[]).filter(function(t){ return t.key === s.tool; })[0];
    if(tl) out.push(['<a class="pcs-l" href="'+esc(tl.to)+'">'+
      icon("calc",15)+esc(tl.name)+'</a>', 4]);
  }
  return out.map(function(x){ return x[0]; }).join("");
}

window.ProcessBand = function(o){
  o = o || {};
  var steps = amProcess(o.key);
  if(!steps.length) return "";
  var ind = o.industry || "";

  var body = '<ol class="pcs">'+steps.map(function(s, i){
      var no = (i + 1 < 10 ? "0" : "") + (i + 1);
      return '<li class="pcs-i">'+
        '<span class="pcs-n">'+no+'</span>'+
        '<div class="pcs-b">'+
          '<b class="pcs-t">'+esc(s.name)+'</b>'+
          '<p class="pcs-p">'+esc(s.lead)+'</p>'+

          (s.check ? '<p class="pcs-ck">'+icon("check",15)+
             '<i>'+esc(s.check)+'</i></p>' : '')+
          '<div class="pcs-ls">'+StepLinks(s, ind)+'</div>'+
        '</div>'+
      '</li>';
    }).join("")+'</ol>'+
    (o.note ? '<p class="sec-note">'+icon("info",15)+esc(o.note)+'</p>' : '');

  if(o.bare) return body;

  return '<section class="sec'+(o.tone ? " "+o.tone : " sec-ivory")+'"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+esc(o.kicker || "PROCESS")+'</p>'+
      '<h2>'+esc(o.title || "무엇부터 해야 하나요?")+'</h2>'+
      '<p>'+esc(o.lead || "순서대로 짚어 드립니다. 걸음마다 필요한 정보 · 업체 · 도구를 바로 열어 보실 수 있습니다.")+'</p>'+
    '</div>'+
    body+
  '</div></section>';
};

function opsKey(o){ return o.sub || ("c-" + o.cat); }
function opsTo(o, ind){
  var to = o.to, cat = o.cat && (typeof amCat === "function") ? amCat(o.cat) : null;
  if(!to && cat){
    var q = [];
    if(o.sub) q.push("s=" + encodeURIComponent(o.sub));
    if(ind)   q.push("i=" + encodeURIComponent(ind));
    to = catTo(cat) + (q.length ? "?" + q.join("&") : "");
  }
  return to || "";
}
function OpsGrid(ind, cur){
  return '<ul class="ops-g">'+(window.AM_OPS||[]).map(function(o){
    if(!opsTo(o, ind)) return "";
    var k = opsKey(o), on = (k === cur);
    var q = [];
    if(!on) q.push("op=" + encodeURIComponent(k));
    if(ind) q.push("i=" + encodeURIComponent(ind));
    return '<li><a class="ops'+tn(o.tone)+(on?" on":"")+'" data-keep href="/operation'+
      (q.length ? "?" + q.join("&") : "")+'"'+(on ? ' aria-current="true"' : '')+'>'+
      '<span class="ops-i">'+icon(o.icon,22)+'</span>'+
      '<b>'+esc(o.name)+'</b>'+
      '<span class="ops-go" aria-hidden="true">'+icon(on ? "check" : "chev",15)+'</span>'+
    '</a></li>';
  }).join("")+'</ul>';
}

function OpsPick(cur, ind){
  var o = (window.AM_OPS||[]).filter(function(x){ return opsKey(x) === cur; })[0];
  if(!o) return "";
  var cat   = o.cat && window.amCat ? amCat(o.cat) : null;
  var reads = window.amContentsFor ? amContentsFor({ cat:o.cat, limit:3 }) : [];
  var tools = window.amToolsForCat ? amToolsForCat(o.cat) : [];

  var n     = (window.amProvidersInCat && cat) ? amProvidersInCat(o.cat) : 0;
  var to    = opsTo(o, ind);

  var box = function(ic, h, body, foot){
    if(!body) return "";
    return '<div class="opk-c"><p class="opk-h">'+icon(ic,17)+esc(h)+'</p>'+
      body + (foot || "") + '</div>';
  };
  return '<div class="opk">'+
    '<p class="opk-k">'+icon("check",16)+esc(o.name)+'</p>'+
    '<div class="opk-g">'+
      box("book","알아 두면 좋은 것",
        reads.length ? '<ul class="opk-l">'+reads.map(function(c){
          return '<li><a href="/content/'+esc(c.slug)+'">'+esc(c.title)+'</a></li>';
        }).join("")+'</ul>' : "",
        '<a class="opk-go" href="/content'+(o.cat ? "?side=start" : "")+'">정보 더 보기'+icon("arrow",14)+'</a>')+
      box("calc","숫자로 확인하기",
        tools.length ? '<ul class="opk-l">'+tools.map(function(t){
          return '<li><a href="'+esc(t.to)+'">'+esc(t.name)+'</a></li>';
        }).join("")+'</ul>' : "",
        '<a class="opk-go" href="/tools">도구 전부 보기'+icon("arrow",14)+'</a>')+
      box("users","맡길 곳 찾기",
        '<p class="opk-n">'+esc(cat ? cat.name : o.name)+' 분야 등록 업체 <b>'+n+'곳</b></p>'+
        (n ? "" : '<p class="opk-p">아직 모으는 중입니다. 조건을 남겨 두시면 '+
              '업체가 등록되는 대로 연결해 드립니다.</p>'),
        '<a class="opk-go" href="'+esc(to)+'">'+esc(cat ? (cat.name + " 보기") : "바로가기")+
          icon("arrow",14)+'</a>'+
        '<a class="opk-go" href="'+esc(quoteTo({ cat:o.cat, sub:o.sub,
          industry: ind || "" }))+'">견적 요청'+icon("arrow",14)+'</a>')+
    '</div>'+
  '</div>';
}

function opsReads(limit){
  var want = {}, out = [];
  (window.AM_OPS||[]).forEach(function(o){ if(o.cat) want[o.cat] = 1; });
  (window.AM_CONTENTS||[]).forEach(function(c){
    if(c.industry) return;
    if(want[c.cat]) out.push(c);
  });
  return out.slice(0, limit || 6);
}

function OpsvcGrid(limitPerGroup, fold){
  var G = window.AM_OPSVC || [];
  if(!G.length) return "";
  var n = limitPerGroup || 4;

  var SHOW = 2;
  if(!fold) return '<ul class="opsv-g">'+opsvCards(G, n, -1)+'</ul>';
  return '<ul class="opsv-g is-fold" id="opsv-g">'+opsvCards(G, n, SHOW)+'</ul>'+
    (G.length > SHOW && typeof FoldBtn === "function"
      ? '<p class="fld-row">'+FoldBtn("opsv-g",
          "운영 묶음 " + (G.length - SHOW) + "개 더 보기", "접기")+'</p>'
      : "");
}

function opsvCards(G, n, showN){
  return G.map(function(g, gi){
    var items = (typeof amOpsvcItems === "function") ? amOpsvcItems(g.key) : [];
    if(!items.length) return "";
    var head = items[0];
    return '<li class="tn-'+esc(g.tone || "t7")+
      (showN >= 0 && gi >= showN ? " fld-x" : "")+'"><div class="opsv-c">'+
      '<a class="opsv-go" href="'+esc(head.to)+'">'+
        '<span class="opsv-hd">'+
          '<span class="ic-t">'+icon(g.icon, 24)+'</span>'+
          '<em class="opsv-no">'+esc(g.no)+'</em>'+
        '</span>'+
        '<span class="opsv-t"><b>'+esc(g.name)+'</b>'+
          '<i>'+esc(g.desc || g.lead)+'</i></span>'+
      '</a>'+
      '<ul class="opsv-l">'+items.slice(0, n).map(function(o){
        return '<li><a href="'+esc(o.to)+'">'+esc(o.name)+'</a></li>'; }).join("")+
        (items.length > n
          ? '<li class="opsv-more"><a href="'+esc(head.to)+'">+'+
            (items.length - n)+'</a></li>' : "")+
      '</ul>'+
    '</div></li>'; }).join("");
}

function OpsvcForInd(ind){
  if(!ind) return "";
  var L = (typeof amOpsvcFor === "function") ? amOpsvcFor(ind.key, 10) : [];
  if(!L.length) return "";
  return '<section class="sec sec-blue"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+esc(ind.name)+' 운영</p>'+
      '<h2>'+esc(koWith(ind.name, "은는"))+' 이런 것을 자주 찾으십니다</h2>'+
      '<p>업종에 맞춰 차례를 바꿈 것이고, 나머지도 아래에 그대로 있습니다.</p>'+
    '</div>'+
    '<ul class="opsv-pick">'+L.map(function(o){
      return '<li class="tn-'+esc(o.tone)+'"><a href="'+esc(o.to)+'">'+
        '<span class="ic-t">'+icon(o.icon, 20)+'</span>'+
        '<span class="opsv-pt"><b>'+esc(o.name)+'</b>'+
          '<i>'+esc(o.catName)+'</i></span>'+
      '</a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

function OpsIntro(ind){
  return PgHero({
    photo:"hero-ops",
    kicker:"OPERATION · 매장 운영" + (ind ? " · " + ind.name : ""),
    h1raw:"매장 운영,<br class=\"br-m\"> 무엇을 도와드릴까요?",
    lead:"광고 · 홍보, 세금, 직원 채용, 매장 수리까지. "+
         "필요한 서비스를 선택하고 한 번에 신청하세요.",
    cta:'<a class="btn btn-b btn-lg" href="#pick">'+

        '필요한 서비스 고르기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="'+esc(quoteTo({ side:"ops",
           industry:(ind ? ind.key : "") }))+'">무엇이 필요한지 모르겠어요</a>'
  });
}

var OCK_KEY = "am.opsck.v1";
var OCK_OK  = true;

function ockGet(){
  try{
    var raw = localStorage.getItem(OCK_KEY);
    var d = raw ? JSON.parse(raw) : null;
    return (d && d.done) ? d.done : [];
  }catch(e){ OCK_OK = false; return []; }
}
function ockSet(keys){
  try{
    localStorage.setItem(OCK_KEY, JSON.stringify({ done:keys, at:Date.now() }));
  }catch(e){ OCK_OK = false; return false; }

  if(typeof amStateTouch === "function") amStateTouch("checks");
  return true;
}

window.opsCheckToggle = function(key, el){
  var done = ockGet(), i = done.indexOf(key);
  var on = el ? !!el.checked : (i < 0);
  if(on && i < 0) done.push(key);
  if(!on && i >= 0) done.splice(i, 1);

  if(!ockSet(done)){
    if(el) el.checked = !on;
    toast("이 브라우저에 저장할 수 없어서 체크가 남지 않습니다");
  }
  opsCheckPaint();
};

window.opsCheckClear = function(){
  if(!ockGet().length) return;
  if(!confirm("체크해 두신 것을 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  try{ localStorage.removeItem(OCK_KEY); }catch(e){ OCK_OK = false; }

  if(typeof amStateDrop === "function") amStateDrop("checks");
  opsCheckPaint();
  toast("지웠습니다");
};

window.opsCheckPick = function(id){
  if(typeof amPickGet !== "function") return;
  var ids = amPickGet();
  var add = ids.indexOf(id) < 0;
  if(add){ ids.push(id); amPickSet(ids); pickPaint(); }
  var s = amPickOne(id);
  toast(add ? ((s ? amPickLabel(s) : "서비스") + " 를 선택에 담았습니다")
            : "이미 고르신 것입니다");
  var sec = document.getElementById("pick");
  if(sec) sec.scrollIntoView({ behavior:"smooth", block:"start" });
};

window.opsCheckPaint = function(){
  var done = ockGet();
  var all = (window.AM_OPS_CHECK || []).length;
  [].slice.call(document.querySelectorAll("[data-ock]")).forEach(function(el){
    var on = done.indexOf(el.getAttribute("data-ock")) >= 0;
    if(el.checked !== on) el.checked = on;
    var row = el.closest(".ock-r");
    if(row) row.classList.toggle("is-on", on);
  });
  var n = done.filter(function(k){ return !!amOpsCheckOne(k); }).length;
  var t = document.getElementById("ock-n");
  if(t) t.textContent = n + " / " + all;
  var bar = document.getElementById("ock-bar");
  if(bar){
    var pct = all ? Math.round(n / all * 100) : 0;
    bar.style.width = pct + "%";
    bar.parentElement.setAttribute("aria-valuenow", String(pct));
  }
  var x = document.getElementById("ock-x");
  if(x) x.hidden = !n;
  var warn = document.getElementById("ock-warn");
  if(warn) warn.hidden = OCK_OK;
};

function OpsCheckRow(o){
  var id = "ock-" + o.key;
  var go = [];
  if(o.cat)
    go.push('<button class="ock-go" type="button" onclick="opsCheckPick(\''+
      esc(o.cat)+'\')">맡길 곳 고르기'+icon("plus",14)+'</button>');
  if(o.tool)
    go.push('<a class="ock-go" href="/tools/'+esc(o.tool)+'">계산해 보기</a>');
  if(o.read)
    go.push('<a class="ock-go" href="/content/'+esc(o.read)+'">읽어 두기</a>');
  return '<li>'+
    '<label class="ock-r" for="'+esc(id)+'">'+
      '<input type="checkbox" class="pk-ck" id="'+esc(id)+'"'+
        ' data-ock="'+esc(o.key)+'"'+
        ' onchange="opsCheckToggle(\''+esc(o.key)+'\', this)">'+
      '<span class="ock-t"><b>'+esc(o.name)+'</b><i>'+esc(o.lead)+'</i></span>'+
    '</label>'+

    (go.length ? '<p class="ock-gos">'+go.join("")+'</p>' : "")+
  '</li>';
}

function OpsCheckBand(){
  var top = (typeof amOpsCheckTop === "function") ? amOpsCheckTop() : [];
  var rest = (typeof amOpsCheckRest === "function") ? amOpsCheckRest() : [];
  if(!top.length) return "";
  var all = top.length + rest.length;
  return '<section class="sec sec-white opsck"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">운영 체크리스트</p>'+
      '<h2>이번 달, 빠뜨린 것이 없는지 보세요</h2>'+
      '<p>확인한 것을 눌러 두시면 이 브라우저에 남습니다. '+
        '<b>여기는 확인하는 자리이고 신청은 위에서 합니다.</b></p>'+
    '</div>'+
    '<div class="ock-box">'+
      '<p class="ock-sum">'+
        '<b id="ock-n">0 / '+all+'</b><span>확인했습니다</span>'+
        '<span class="ock-track" role="progressbar" aria-label="확인한 항목"'+
          ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">'+
          '<i id="ock-bar"></i></span>'+
        '<button class="btn btn-o btn-sm" type="button" id="ock-x" hidden'+
          ' onclick="opsCheckClear()">체크 지우기</button>'+
      '</p>'+

      '<p class="ock-warn" id="ock-warn" hidden>'+icon("warn",15)+
        ' 이 브라우저는 저장을 막아 두어서 체크가 남지 않습니다 '+
        '(비공개 모드일 수 있습니다).</p>'+
      '<ul class="ock-l">'+top.map(OpsCheckRow).join("")+'</ul>'+
      (rest.length
        ? FoldAll("ock-rest", "전체 보기 ("+rest.length+"개 더)", "접기")+
          '<ul class="ock-l is-fold-all" id="ock-rest">'+
            rest.map(OpsCheckRow).join("")+'</ul>'
        : "")+
    '</div>'+

    '<p class="sec-note">'+icon("info",15)+
      ' 체크해 두신 것은 <b>신청이 아닙니다</b> — 저희 직원에게 '+
      '일로 가지 않습니다. 이 브라우저에 남고, <b>로그인하신 경우</b> '+
      '계정에도 남아 다른 기기에서 이어집니다. '+
      '맡기실 것이 있으면 위에서 고르고 신청해 주세요.</p>'+
  '</div></section>';
}

function OpsGuideBand(){
  var L = opsReads(3);
  if(!L.length) return "";
  return '<section class="sec sec-ivory"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">운영 가이드</p>'+
      '<h2>운영하면서 자주 막히는 것</h2>'+
      '<p>업체를 부르기 전에 읽어 두면 묻는 것이 달라집니다.</p>'+
    '</div>'+
    '<ul class="rd-l">'+L.map(function(c){
      return '<li><a href="/content/'+esc(c.slug)+'">'+

        '<span class="rd-m">'+esc((amCat(c.cat) || {}).name || "")+
          (c.read ? ' · '+esc(String(c.read))+'분' : '')+'</span>'+
        '<b>'+esc(c.title)+'</b>'+
        '<span class="rd-p">'+esc(c.lead)+'</span>'+
        '<span class="rd-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
      '</a></li>'; }).join("")+'</ul>'+
    '<div class="row-cta"><a class="btn btn-o" href="/content">'+
      '정보 전부 보기'+icon("arrow",16)+'</a></div>'+
  '</div></section>';
}

var OPS_CALC = ["bep", "target", "labor", "margin"];
var OPS_CALC_TONE = { bep:"sv3", target:"sv1", labor:"sv4", margin:"sv6" };

function OpsCalcBand(){
  return HallCalcBand({ keys:OPS_CALC, tones:OPS_CALC_TONE, cls:"opsc",
    title:"숫자를 먼저 보고 정하세요" });
}

function PageOperation(){
  var ind = (typeof amIndustry === "function") ? amIndustry(nowQS("i")) : null;

  return OpsIntro(ind) +
    PickGroupBand("operation", "ops") +
    PickBasket("ops") +
    OpsCheckBand() +
    OpsGuideBand() +
    OpsCalcBand() +
    JourneyBand({ current:"operation", tone:"sec-white",
      title:"다른 것도 준비하고 계신가요?",
      lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." }) +
    PickBar("ops");
}

var AQ_CALC      = ["premium", "vs", "rent"];
var AQ_CALC_TONE = { premium:"t13", vs:"sv2", rent:"sv3" };

function AcqIntro(ind, iq){
  return PgHero({

    kicker:"TAKE OVER · 인수 · 양도" + (ind ? " · " + ind.name : ""),
    photo:"kind-pass",
    h1raw: ind
      ? esc(ind.name)+" 인수 · 양도를<br class=\"br-m\"> 보고 계시네요."
      : "한 사장님의 끝이<br class=\"br-m\"> 다른 사장님의 시작이 됩니다.",
    lead: ind
      ? "받으시는 분과 넘기시는 분이 같은 화면을 봅니다. 아래에서 어느 쪽인지 고르시면 그 순서로 보여 드립니다."
      : "있던 가게를 받으면 공사 기간과 초기 비용이 줄고, 넘기면 철거비와 원상복구가 줄어듭니다. 두 분이 같은 화면을 봅니다.",
    cta:'<a class="btn btn-b btn-lg" href="#pick">필요한 서비스 고르기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/stores'+esc(iq)+'">매장 매물 보기</a>'
  });
}

function AcqWhich(t, ind, iq){
  function tab(k, name, lead){
    return '<a class="aq-t'+(t===k?" on":"")+'" href="/transfer?t='+k+
      (ind ? "&i="+encodeURIComponent(ind.key) : "")+'"'+
      (t===k?' aria-current="page"':'')+'>'+
      '<b>'+esc(name)+'</b><em>'+esc(lead)+'</em></a>';
  }
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">어느 쪽이세요?</p>'+
      '<h2>받으시는 분과 넘기시는 분은 순서가 다릅니다</h2>'+
    '</div>'+
    '<div class="aq-tb">'+
      tab("in",  "매장을 인수합니다", "있던 가게를 받습니다")+
      tab("out", "매장을 넘깁니다",   "하던 가게를 넘깁니다")+
    '</div>'+

    '<ul class="aq-m">'+(t === "out" ? [
      ["/sell",          "handover", "내 매장 내놓기",   "평수 · 보증금 · 권리금을 적어 보내시면 됩니다"],
      ["#pick",          "check",    "넘길 때 필요한 것", "시설 인계 · 계약 · 세무를 골라 보세요"],
      ["/tools/premium", "gauge",    "권리금 알아보기",  "몇 달이면 돌아오는지 따져 봅니다"],
      ["/sell?t=asset",  "boxes",    "시설 · 장비만 내놓기", "매장은 두고 장비만 넘기실 때"],
      ["/content?side=close", "book","양도 가이드",      "넘기기 전에 보셔야 하는 것"]
    ] : [
      ["/stores"+iq,     "store",    "매장 인수하기",    "상가 · 점포 · 권리금 매장"],
      ["#pick",          "check",    "인수할 때 필요한 것", "점검 · 임대차 검토 · 승계를 골라 보세요"],
      ["/tools/premium", "gauge",    "권리금 알아보기",  "몇 달이면 돌아오는지 따져 봅니다"],
      ["/tools/vs",      "scale",    "신규 vs 인수 비교", "새로 만드는 것과 받는 것"],
      ["/content?side=close", "book","인수 가이드",      "계약 전에 보셔야 하는 것"]
    ]).map(function(x){
      return '<li><a href="'+esc(x[0])+'">'+
        '<span class="ic-t">'+icon(x[1],22)+'</span>'+
        '<b>'+esc(x[2])+'</b><i>'+esc(x[3])+'</i></a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

function AcqProcess(t, ind){
  var key = (t === "out") ? "acq-out" : "acq-in";
  var n   = ((window.AM_PROCESS || {})[key] || []).length;
  return '<section class="sec sec-gray stD"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">'+(t === "out" ? "넘기는 순서" : "받는 순서")+'</p>'+
      '<h2>'+esc((ind ? ind.name + " — " : "")+
        (t === "out" ? "넘길 때는 이 순서입니다" : "받을 때는 이 순서입니다"))+'</h2>'+
      '<p>'+esc(n + "걸음입니다. " + (t === "out"
        ? "통째로 넘기면 철거와 원상복구를 안 하셔도 되는 경우가 있습니다. 조건부터 정합니다."
        : "권리금과 시설이 같이 오는지, 임대차가 승계되는지가 금액을 가릅니다."))+' '+
        '<b>여기는 읽는 자리이고 신청은 위에서 합니다.</b></p>'+
    '</div>'+
    FoldAll("aq-road", (t === "out" ? "넘기는 순서 " : "받는 순서 ")+n+"걸음 보기", "접기")+
    '<div class="is-fold-all" id="aq-road">'+
      ProcessBand({ key:key, bare:true, industry: ind ? ind.key : "",
        note: t === "out"
          ? "매물 등록 기능은 따로 없습니다. 접수로 적어 보내 주시면 사람이 확인하고 올려 드립니다."
          : "매물에 적힌 평수 · 보증금 · 월세 · 권리금 · 매출은 올리신 사장님이 적으신 값이고, 저희가 확인하거나 보증하는 값이 아닙니다." })+
    '</div>'+
  '</div></section>';
}

function AcqMarket(t, ind, iq){
  var nStore = (typeof amStores === "function") ? amStores({}).length : 0;
  var nAsset = (typeof amAssets === "function") ? amAssets({}).length : 0;

  var out = (t === "out");
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+(out ? "내놓으시려면" : "지금 올라온 것")+'</p>'+
      '<h2>'+(out
        ? "한 번만 적어 보내시면 저희가 올려 드립니다"
        : "매장 매물 "+nStore+"건 · 시설 · 장비 "+nAsset+"건")+'</h2>'+
      '<p>'+(out
        ? "평수 · 보증금 · 월세 · 권리금을 적는 칸이 따로 있습니다. "+
          "올리기 전에 한 번 연락드립니다. 지금 올라온 매물은 "+
          nStore+"건 · 시설 · 장비 "+nAsset+"건입니다."
        : "등록된 차례로 냅니다. 광고로 위에 올린 자리는 없습니다.")+'</p>'+
    '</div>'+
    (out
      ? '<div class="row-cta">'+
          '<a class="btn btn-b" href="/sell">내 매장 내놓기'+icon("arrow",16)+'</a>'+
          '<a class="btn btn-o" href="/sell?t=asset">시설 · 장비만 내놓기</a>'+
        '</div>'
      :
    (nStore || nAsset
      ? '<div class="row-cta"><a class="btn btn-b" href="/stores'+esc(iq)+'">매장 매물 보기'+icon("arrow",16)+'</a>'+
        '<a class="btn btn-o" href="/assets'+esc(iq)+'">시설 · 장비 보기</a></div>'

      : Empty({ icon:"store", title:"아직 올라온 매물이 없습니다",
          text:"올라오는 대로 여기에 나옵니다. 그동안 인수 · 양도에서 자주 막히는 것부터 보셔도 됩니다.",
          reads: (typeof amContentsFor === "function")
            ? amContentsFor({ cat:"transfer", side:"both", limit:3 }) : [],
          cta:'<a class="btn btn-b" href="#pick">인수할 때 필요한 것 고르기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/stores">매물 화면 보기</a>' })))+
  '</div></section>';
}

function PageAcquisition(){
  var t    = (nowQS("t") === "out") ? "out" : "in";
  var ind  = (typeof amIndustry === "function") ? amIndustry(nowQS("i")) : null;
  var iq   = ind ? ("?i=" + encodeURIComponent(ind.key)) : "";

  var sel = PickGroupBand("transfer", "transfer") + PickBasket("transfer");
  var mkt = AcqMarket(t, ind, iq);
  return AcqIntro(ind, iq) +
    AcqWhich(t, ind, iq) +
    (t === "in" ? mkt + sel : sel + mkt) +
    AcqProcess(t, ind) +
    ReadBand({ cat:"transfer", side:"both", limit:3,
               title:"인수 · 양도에서 자주 막히는 것" }) +
    HallCalcBand({ keys:AQ_CALC, tones:AQ_CALC_TONE,
      title:"받기 전 · 넘기기 전에 숫자부터 보세요",
      lead:"권리금이 몇 달이면 돌아오는지, 새로 만드는 것과 받는 것이 얼마나 다른지 따져 보실 수 있습니다. 적으신 값은 저장하지 않습니다." }) +
    JourneyBand({ current:"acquisition", tone:"sec-white",
      title:"다른 것도 준비하고 계신가요?",
      lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." }) +
    PickBar("transfer");
}




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
        (n ? "" : '<p class="opk-p">아직 모으는 중입니다. 업체가 등록되면 '+
              '이 자리에 나옵니다.</p>'),
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

  return HallHero({
    side:"ops", photo:"hero-ops",
    kicker:"매장을 더 잘 운영하는 실전 서비스" + (ind ? " · " + ind.name : ""),
    h1raw:"매장 <em>운영</em>",

    leadHtml:'<span data-cta="off">비용 절감 · 홍보 · 시설 수리 · 인력 · 세무 · 노무 — 고민에 맞는 서비스와 계산도구를 찾아보세요.</span>'+
             '<span data-cta="on" hidden>비용 절감 · 홍보 · 시설 수리 · 인력 · 세무 · 노무 — 필요한 운영 서비스를 찾고 한 번에 신청하세요.</span>',
    quote: quoteTo({ side:"ops", industry:(ind ? ind.key : "") }),
    goName:"운영 상담 신청하기",
    second:'<a class="btn btn-lg hh-o" href="#pick">운영 서비스 고르기'+icon("arrow",18)+'</a>'

  }) + OpsWorry();
}

var OPS_WORRY = [
  ["won",       "비용을 줄이고 싶어요",   [["고정비 계산","/tools/fixed"],["원가율 · 마진","/tools/margin"],["식자재 · 소모품","/providers/supply"],["POS · 매장 시스템","/providers/it"]]],
  ["megaphone", "홍보 · 매출을 늘리고 싶어요", [["온라인 홍보","/providers/marketing"],["리뷰 · 플레이스","/providers/marketing?s=review"],["목표 매출 계산","/tools/target"]]],
  ["tool",      "시설을 고치고 싶어요",   [["설비 수리","/providers/repair"],["정기 점검","/providers/repair?s=check-up"],["청소 · 방역","/providers/clean"]]],
  ["users",     "인력 · 세무 · 노무가 필요해요", [["직원 채용","/providers/staff"],["세무","/providers/admin?s=tax-agent"],["노무","/providers/admin?s=labor-agent"]]]
];
function OpsWorry(){
  return '<section class="sec sec-white hwr"><div class="w">'+
    '<div class="sec-hd"><h2>사장님, <em>이런 고민</em>이 있으신가요?</h2>'+
      '<p>고민에 맞는 화면으로 바로 가실 수 있습니다. 서비스를 여러 개 고르시려면 아래 고르개를 쓰세요.</p></div>'+
    '<ul class="hwr-g">'+OPS_WORRY.map(function(x){
      return '<li><div class="hwr-c"><span class="hwr-i" aria-hidden="true">'+icon(x[0], 30)+'</span>'+
        '<h3>'+esc(x[1])+'</h3><p class="hwr-ch">'+x[2].map(function(c){
          return '<a href="'+esc(c[1])+'">'+esc(c[0])+'</a>'; }).join("")+'</p></div></li>'; }).join("")+'</ul>'+
  '</div></section>';
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
  if(sec) sec.scrollIntoView({ behavior:"auto", block:"start" });
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
    HallSteps({ quote:quoteTo({ side:"ops" }) }) +
    JourneyBand({ current:"operation", tone:"sec-white",
      title:"다른 것도 준비하고 계신가요?",
      lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." }) +
    PickBar("ops");
}

var AQ_CALC      = ["premium", "vs", "rent"];
var AQ_CALC_TONE = { premium:"t13", vs:"sv2", rent:"sv3" };

function AcqIntro(ind, iq, picked){

  var n = (window.AM_STORES || []).length;

  var compact = picked === "in" || picked === "out";
  return HallHero({

    side:"transfer", photo:"",
    art:(compact || typeof wpPassArt !== "function") ? "" : wpPassArt(),
    kicker:(compact ? (picked === "out" ? "내 매장을 넘기고 싶어요" : "매장을 인수하고 싶어요") : "사장님의 새로운 시작을 위한") + (ind ? " · " + ind.name : ""),
    h1raw:"매장 <em>양도양수</em>",
    lead:"매장을 찾는 분(인수)과 넘기려는 분(양도)의 길을 나눠 안내합니다. 매물에 적힌 값은 올리신 사장님이 적으신 값입니다.",
    leadM:"매장을 찾는 분과 넘기려는 분의 길을 나눠 안내합니다.",
    quote: quoteTo({ side:"transfer", cat:"transfer", industry:(ind ? ind.key : "") }),
    goName:"양도 · 양수 상담 신청하기",
    second:'<a class="btn btn-lg hh-o" href="/stores'+esc(iq)+'">매장 매물 보기'+icon("arrow",18)+'</a>',

    cardTitle:"어느 쪽이세요?", qfirst:!compact,
    quick:compact ? [] : [{ ic:"search", b:"매장을 인수하고 싶어요", d:"권리금 · 인수 비용, 인수 계약 가이드, 매물 찾기",
             go:"인수 경로 보기", href:"/transfer?t=in"+(ind ? "&i="+encodeURIComponent(ind.key) : "") },
           { ic:"handover", b:"내 매장을 넘기고 싶어요", d:"넘기는 순서, 준비 자료, 양도 가이드",
             go:"양도 경로 보기", href:"/transfer?t=out"+(ind ? "&i="+encodeURIComponent(ind.key) : "") }]
  });
}

function AcqSearch(ind){
  var rg = function(key){
    var g = (window.AM_STORE_RANGES || []).filter(function(x){ return x.key === key; })[0];
    if(!g) return "";
    return '<div class="f-r"><label for="aq-s-'+key+'">'+esc(g.name)+'</label>'+
      '<select class="sel" id="aq-s-'+key+'"><option value="">전체</option>'+
      g.opts.map(function(o){ return '<option value="'+esc(o.k)+'">'+esc(o.name)+'</option>'; }).join("")+'</select></div>';
  };

  return '<section class="sec sec-white asr" id="aq-find"><div class="w">'+
    '<form class="asr-f" onsubmit="return aqSearchGo(event)" aria-label="매장 매물 찾기">'+
      '<div class="f-r"><label for="aq-s-r">지역</label>'+RegionSelect("aq-s-r", "", "", "전체")+'</div>'+
      '<div class="f-r"><label for="aq-s-i">업종</label>'+IndustrySelect("aq-s-i", ind ? ind.key : "", "", "전체")+'</div>'+
      '<button class="btn asr-pxb" type="button" aria-expanded="false" aria-controls="aq-px" onclick="aqPxToggle(this)">'+
        icon("sliders",16)+'<span>가격 조건</span><em id="aq-px-n" hidden></em>'+icon("chevd",16)+'</button>'+
      '<div class="asr-px is-fold-px" id="aq-px">'+ rg("pm") + rg("dp") + rg("rt") +'</div>'+
      '<button class="btn btn-lg asr-go" type="submit">'+icon("search",18)+' 매물 검색</button>'+
    '</form>'+
  '</div></section>';
}
window.aqPxToggle = function(b){
  var box = document.getElementById("aq-px"); if(!box) return;
  var open = box.classList.toggle("is-fold-px") === false;
  b.setAttribute("aria-expanded", open ? "true" : "false");
};
window.aqPxPaint = function(){
  var n = ["aq-s-pm","aq-s-dp","aq-s-rt"].filter(function(id){
    var e = document.getElementById(id); return e && e.value; }).length;
  var t = document.getElementById("aq-px-n"); if(!t) return;
  t.textContent = n + "개 적용"; t.hidden = !n;
};
document.addEventListener("change", function(e){
  if(e.target && /^aq-s-(pm|dp|rt)$/.test(e.target.id || "")) aqPxPaint();
});
window.aqSearchGo = function(e){
  if(e && e.preventDefault) e.preventDefault();
  var q = [];
  [["r","aq-s-r"],["i","aq-s-i"],["pm","aq-s-pm"],["dp","aq-s-dp"],["rt","aq-s-rt"]].forEach(function(p){
    var v = (document.getElementById(p[1]) || {}).value || "";
    if(v) q.push(p[0] + "=" + encodeURIComponent(v));
  });
  go("/stores" + (q.length ? "?" + q.join("&") : ""));
  return false;
};

function AcqWhich(t, ind, iq){

  function tab(k, name, lead){
    return '<a class="aq-t'+(t===k?" on":"")+'" href="/transfer?t='+k+
      (ind ? "&i="+encodeURIComponent(ind.key) : "")+'"'+
      (t===k?' aria-current="page"':'')+'>'+
      '<b>'+esc(name)+'</b><em>'+esc(lead)+'</em></a>';
  }
  var P = window.AM_PROCESS || {};
  var nIn = (P["acq-in"] || []).length, nOut = (P["acq-out"] || []).length;
  var nStore = (typeof amStores === "function") ? amStores({}).length : 0;
  var jump = function(id){ return ' onclick="return aqJump(\''+id+'\')"'; };
  var L = (t === "out") ? [
      ["#aq-steps",            "handover", "넘기는 순서",        "넘길 때 거치는 "+nOut+"걸음 — 조건 정하기부터 인계까지", "aq-steps"],
      ["#aq-prep",             "doc",      "준비 자료",          "매장 정보 · 임대차 · 매출 자료 · 권리금 · 시설 목록", "aq-prep"],
      ["/content?j=acquisition","book",    "양도 가이드",        "넘기기 전에 보셔야 하는 글"],
      ["/tools/premium",       "gauge",    "권리금 알아보기",    "인수하시는 분이 먼저 하는 계산을 미리 해 봅니다"],
      ["#pick",                "check",    "넘길 때 필요한 것",  "시설 인계 · 계약 · 세무를 골라 보세요"]
    ] : [
      ["/tools/premium",       "gauge",    "권리금 · 인수 비용", "권리금이 몇 달이면 돌아오는지 따져 봅니다"],
      ["/tools/vs",            "scale",    "새로 차리기 vs 인수", "같은 매장을 새로 만들 때와 비용을 비교합니다"],
      ["/content?j=startup&cat=store", "book", "인수 계약 가이드", "상가 계약 · 권리금, 계약 전에 볼 것"],
      ["/stores"+iq,           "store",    "매물 찾기",          nStore ? "지금 올라온 매장 매물 "+nStore+"건" : "현재 등록된 매물이 없습니다"],
      ["#aq-steps",            "doc",      "받는 순서",          "인수할 때 거치는 "+nIn+"걸음", "aq-steps"],
      ["#pick",                "check",    "인수할 때 필요한 것", "점검 · 임대차 검토 · 승계를 골라 보세요"]
    ];
  return '<section class="sec sec-white aq-path" id="aq-path"><div class="w">'+
    '<div class="aq-tb">'+
      tab("in",  "매장을 인수하고 싶어요",  "있던 가게를 받습니다")+
      tab("out", "내 매장을 넘기고 싶어요", "하던 가게를 넘깁니다")+
    '</div>'+
    '<div class="sec-hd aq-ph">'+
      '<p class="eyebrow">'+(t === "out" ? "넘기시는 분" : "받으시는 분")+'</p>'+
      '<h2>'+(t === "out" ? "넘기기 전에 이것부터 보세요" : "인수하기 전에 이것부터 보세요")+'</h2>'+
    '</div>'+
    '<ul class="aq-m">'+L.map(function(x){
      return '<li><a href="'+esc(x[0])+'"'+(x[4] ? jump(x[4]) : "")+'>'+
        '<span class="ic-t">'+icon(x[1],22)+'</span>'+
        '<b>'+esc(x[2])+'</b><i>'+esc(x[3])+'</i></a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

window.aqJump = function(id){
  var sec = document.getElementById(id); if(!sec) return true;
  var road = document.getElementById("aq-road");
  if(id === "aq-steps" && road && road.classList.contains("is-fold-all")){
    var b = document.querySelector('[aria-controls="aq-road"]');
    if(b && typeof foldToggle === "function") foldToggle("aq-road", b, "is-fold-all");
  }
  sec.scrollIntoView({ behavior:"auto", block:"start" });
  return false;
};

function AcqPrep(ind){
  var S = ((window.AM_PROCESS || {})["acq-out"] || []).slice(0, 5);
  if(!S.length) return "";
  return '<section class="sec sec-gray aq-prep" id="aq-prep"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">준비 자료</p>'+
      '<h2>넘기기 전에 챙겨 둘 다섯 가지</h2>'+
      '<p>인수하시는 분이 제일 먼저 묻는 것들입니다. 미리 한 벌로 묶어 두면 이야기가 빨라집니다.</p>'+
    '</div>'+
    '<ol class="aq-pl">'+S.map(function(st, i){
      var c = (st.read && typeof amContent === "function") ? amContent(st.read) : null;
      return '<li><span class="aq-pn">'+(i+1)+'</span><span class="aq-pt"><b>'+esc(st.name)+'</b>'+
        '<em>'+esc(st.lead || "")+'</em>'+
        (c ? '<a href="/content/'+esc(c.slug)+'">'+icon("book",14)+'<span>'+esc(c.title)+'</span></a>' : '')+
        '</span></li>';
    }).join("")+'</ol>'+
    '<p class="aq-sell" data-cta="on" data-cta-form="sell" hidden>'+icon("info",16)+
      '<span>준비가 됐으면 매물 등록 양식에 적어 보내 주세요. 올리기 전에 한 번 연락드립니다.</span>'+
      '<a class="btn btn-b" href="/sell">내 매장 내놓기'+icon("arrow",16)+'</a></p>'+
    '<p class="aq-sell" data-cta="off" data-cta-form="sell">'+icon("info",16)+
      '<span>지금은 매물 등록 접수를 받지 않습니다. 위 자료와 넘기는 순서로 먼저 준비해 두시면, 접수가 열릴 때 바로 내놓으실 수 있습니다.</span>'+
      '<a href="#aq-steps" onclick="return aqJump(\'aq-steps\')">넘기는 순서 보기'+icon("chev",14)+'</a></p>'+
  '</div></section>';
}

function AcqProcess(t, ind){
  var key = (t === "out") ? "acq-out" : "acq-in";
  var n   = ((window.AM_PROCESS || {})[key] || []).length;
  return '<section class="sec sec-gray stD" id="aq-steps"><div class="w">'+
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
          ? "매물을 올리는 일은 사람이 합니다 — 접수가 열려 있을 때 적어 보내 주시면 확인하고 올립니다."
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
        ? ctaPair("sell", "한 번만 적어 보내시면 저희가 올려 드립니다", "지금은 매물 등록 접수를 받지 않습니다")
        : esc("매장 매물 "+nStore+"건 · 시설 · 장비 "+nAsset+"건"))+'</h2>'+
      '<p>'+(out
        ? ctaPair("sell", "평수 · 보증금 · 월세 · 권리금을 적는 칸이 따로 있습니다. "+
            "올리기 전에 한 번 연락드립니다. 지금 올라온 매물은 "+
            nStore+"건 · 시설 · 장비 "+nAsset+"건입니다.",
            "내놓을 때 적는 칸(평수 · 보증금 · 월세 · 권리금)은 매장 내놓기 화면에서 미리 보실 수 있고, "+
            "넘기기 전에 맞출 것은 아래 순서와 양도 가이드에 있습니다. 지금 올라온 매물은 "+
            nStore+"건 · 시설 · 장비 "+nAsset+"건입니다.")
        : "등록된 차례로 냅니다. 광고로 위에 올린 자리는 없습니다.")+'</p>'+
    '</div>'+
    (out
      ? '<div class="row-cta">'+
          '<a class="btn btn-b" href="/sell">내 매장 내놓기'+icon("arrow",16)+'</a>'+
          '<a class="btn btn-o" href="/sell?t=asset">시설 · 장비만 내놓기</a>'+

          '<a class="btn btn-b" href="/content?j=acquisition" data-cta="off" data-cta-form="sell">양도 가이드 보기'+icon("arrow",16)+'</a>'+
          '<a class="btn btn-o" href="/intake" data-cta="off" data-cta-form="sell">접수 안내 보기</a>'+
        '</div>'
      :
    (nStore || nAsset
      ? '<div class="row-cta"><a class="btn btn-b" href="/stores'+esc(iq)+'">매장 매물 보기'+icon("arrow",16)+'</a>'+
        '<a class="btn btn-o" href="/assets'+esc(iq)+'">시설 · 장비 보기</a></div>'

      : '<p class="aq-zero">'+icon("info",16)+'<span>현재 등록된 매물이 없습니다.</span></p>'+
        '<div class="row-cta"><a class="btn btn-b" href="/content?j=startup&cat=store">인수 계약 가이드'+icon("arrow",16)+'</a>'+
        '<a class="btn btn-o" href="/tools/premium">권리금 계산</a></div>'))+
  '</div></section>';
}

function PageAcquisition(){
  var t    = (nowQS("t") === "out") ? "out" : "in";
  var ind  = (typeof amIndustry === "function") ? amIndustry(nowQS("i")) : null;
  var iq   = ind ? ("?i=" + encodeURIComponent(ind.key)) : "";

  var sel = PickGroupBand("transfer", "transfer") + PickBasket("transfer");
  var mkt = AcqMarket(t, ind, iq);

  return AcqIntro(ind, iq, nowQS("t")) +
    AcqWhich(t, ind, iq) +
    (t === "in" ? AcqSearch(ind) + mkt + sel : AcqPrep(ind) + sel + mkt) +
    AcqProcess(t, ind) +
    ReadBand({ cat:"transfer", side:"both", limit:3,
               title:"인수 · 양도에서 자주 막히는 것" }) +
    HallCalcBand({ keys:AQ_CALC, tones:AQ_CALC_TONE,
      title:"받기 전 · 넘기기 전에 숫자부터 보세요",
      lead:"권리금이 몇 달이면 돌아오는지, 새로 만드는 것과 받는 것이 얼마나 다른지 따져 보실 수 있습니다. 적으신 값은 저장하지 않습니다." }) +
    HallSteps({ quote:quoteTo({ side:"transfer", cat:"transfer" }) }) +
    JourneyBand({ current:"acquisition", tone:"sec-white",
      title:"다른 것도 준비하고 계신가요?",
      lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." }) +
    PickBar("transfer");
}


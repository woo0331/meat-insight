

function PageSupport(){
  var side = nowQS("side");
  var list = amSupports(side || null);
  return PgHero({
    kicker:"자금 · 정부지원",
    h1raw:"조건만 맞으면<br class=\"br-m\"> 신청하실 수 있는 것들.",
    lead:"창업자금 · 정책자금 · 폐업지원 · 철거비 지원. 저희가 심사하지 않습니다 — 어디에 무엇이 있는지 모아 드립니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<ul class="chip-g chip-g-fil">'+
      '<li><a class="chip'+(side?"":" on")+'" href="/support">전체</a></li>'+
      '<li><a class="chip'+(side==="start"?" on":"")+'" href="/support?side=start">창업</a></li>'+
      '<li><a class="chip'+(side==="close"?" on":"")+'" href="/support?side=close">폐업</a></li>'+
    '</ul>'+
    (list.length
      ? '<ul class="sp-l">'+list.map(function(s){
          return '<li class="sp">'+
            '<span class="sp-m">'+esc(s.org)+' · 확인 '+esc(s.asOf)+'</span>'+
            '<b>'+esc(s.name)+'</b>'+
            (s.who    ? '<span><em>대상</em>'+esc(s.who)+'</span>' : '')+
            (s.amount ? '<span><em>지원</em>'+esc(s.amount)+'</span>' : '')+
            (s.when   ? '<span><em>기간</em>'+esc(s.when)+'</span>' : '')+
            '<a class="sp-go" href="'+esc(s.link)+'" target="_blank" rel="noopener">'+
              '공고 원문 보기'+icon("arrow",15)+'</a>'+
          '</li>'; }).join("")+'</ul>'
      : Empty({
          icon:"badge",
          title:"확인된 지원사업이 아직 없습니다",
          text:"공고 원문을 확인한 것만 올립니다. 지원사업은 해마다 바뀌고 예산이 소진되면 "+
               "중간에 닫혀서, 틀린 정보는 없는 것보다 나쁩니다. "+
               "그동안에는 소상공인시장진흥공단과 관할 지자체 공고를 직접 확인하세요.",
          reads: amContentsFor({ cat:"fund", side:"start", limit:3 }),
          readTitle:"그동안 보셔도 되는 것",
          cta:'<a class="btn btn-b" href="/startup">창업 준비 계속하기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/closure">폐업 정리 계속하기</a>'
        }))+
  '</div></section>'+
  SupportWhere(side);
}

function SupportWhere(side){
  var list = (window.amSupportWhere ? amSupportWhere(side || null) : []);
  if(!list.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">어디서 찾는가</p>'+
      '<h2>공고는 여기에 올라옵니다</h2>'+
      '<p>지원사업은 해마다 바뀌고 예산이 소진되면 중간에 닫힙니다. '+
        '그래서 사업 이름을 적어 두는 대신 <b>어디를 봐야 하는지</b>를 '+
        '적어 둡니다. 저희가 심사하지 않고, 신청도 각 기관에 직접 하십니다.</p>'+
    '</div>'+
    '<ul class="spw-l rv-stg">'+ list.map(function(x){
      return '<li class="spw" data-rv>'+
        '<b>'+esc(x.org)+'</b>'+
        '<span class="spw-w">'+esc(x.what)+'</span>'+

        '<span class="spw-f"><em>찾는 법</em><i>'+esc(x.find)+'</i></span>'+

        (x.url
          ? '<a class="spw-go" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+
            '기관 홈페이지'+icon("arrow",15)+'</a>'
          : '')+
      '</li>';
    }).join("")+'</ul>'+
    '<p class="note note-box">여기 적힌 것은 <b>기관</b>까지입니다. 개별 공고가 '+
      '아닙니다 — 대상 · 금액 · 기한은 그 기관의 공고에서 직접 확인하셔야 하고, '+
      '신청과 심사도 그쪽에서 합니다. 저희는 어디를 봐야 하는지까지만 '+
      '알려 드립니다.</p>'+
  '</div></section>';
}

function ctUrl(j, cat, q){
  var p = [];
  if(j)   p.push("j="+encodeURIComponent(j));
  if(cat) p.push("cat="+encodeURIComponent(cat));
  if(q)   p.push("q="+encodeURIComponent(q));
  return "/content" + (p.length ? "?"+p.join("&") : "");
}

function ctQOf(c){
  var t = [c.title || "", c.lead || "",
    (window.amCat && amCat(c.cat) ? amCat(c.cat).name : ""),
    (c.industry && window.amIndustryName ? amIndustryName(c.industry) : ""),
    (c.sum || []).join(" ")].join(" ");
  return (t + " " + t.replace(/\s+/g, "")).toLowerCase();
}

window.ctFind = function(q){
  q = String(q || "").trim().toLowerCase().replace(/\s+/g, "");
  var rows = [].slice.call(document.querySelectorAll(".ct-l > li[data-ct-q]"));
  var hit = 0;
  rows.forEach(function(el){
    var on = !q || (el.getAttribute("data-ct-q") || "").indexOf(q) >= 0;
    el.hidden = !on;
    if(on && q) hit++;
  });
  var r = document.getElementById("ct-r");
  if(r){
    r.hidden = !q;
    r.textContent = hit ? (hit + "편 찾았습니다")
      : "찾으시는 말로는 나오지 않습니다 — 위 분류에서 골라 보세요.";
  }
};

function PageContents(){
  var JY = (window.AM_JOURNEYS || []);
  var j  = nowQS("j");

  if(!j){
    var sd = nowQS("side");
    if(sd === "start") j = "startup";
    else if(sd === "close") j = "closing";
  }
  if(j && !JY.some(function(x){ return x.key === j; })) j = "";
  var cat = nowQS("cat");
  var q   = nowQS("q") || "";

  var all = amContents({});
  var jOf = function(c){
    return (typeof amJourneyOfCat === "function") ? amJourneyOfCat(c.cat) : null; };
  var byJ = j ? all.filter(function(c){ return jOf(c) === j; }) : all;

  var cats = (window.AM_CATS||[]).filter(function(k){
    return byJ.some(function(c){ return c.cat === k.key; }); });
  if(cat && !cats.some(function(k){ return k.key === cat; })) cat = "";
  var list = cat ? byJ.filter(function(c){ return c.cat === cat; }) : byJ;

  var nOf = function(k){
    return all.filter(function(c){ return jOf(c) === k; }).length; };
  var cnt = function(k){
    return byJ.filter(function(c){ return c.cat === k; }).length; };

  var card = function(c){
    var jk = jOf(c);
    var jn = "";
    JY.forEach(function(x){ if(x.key === jk) jn = x.name; });
    return '<li data-ct-q="'+esc(ctQOf(c))+'"><a href="/content/'+esc(c.slug)+'">'+
      '<span class="ct-m">'+(jn ? esc(jn) : "")+
        (c.industry?(jn?' · ':'')+esc(amIndustryName(c.industry)):'')+
        (c.read?' · '+esc(String(c.read))+'분':'')+'</span>'+
      '<b>'+esc(c.title)+'</b>'+
      '<span class="ct-p">'+esc(c.lead)+'</span></a></li>';
  };

  return PgHero({
    kicker:"창업 · 폐업 정보",
    h1raw:"실제로 막히는 것만<br class=\"br-m\"> 정리합니다.",
    lead:"창업비용 · 철거비 · 원상복구 범위 · 권리금 · 사업자등록 · 폐업신고처럼, 검색해도 답이 잘 안 나오는 것들입니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+

    '<ul class="chip-g chip-g-fil">'+
      '<li><a class="chip'+(j?"":" on")+'" href="'+esc(ctUrl("",""))+'">'+
        '전체 '+all.length+'</a></li>'+
      JY.map(function(x){
        return '<li><a class="chip'+(j===x.key?" on":"")+'" href="'+
          esc(ctUrl(x.key,""))+'">'+esc(x.name)+' '+nOf(x.key)+'</a></li>';
      }).join("")+
    '</ul>'+

    '<div class="pkf ct-find">'+
      '<label class="pkf-l" for="ct-q">제목이나 낱말로 찾아보세요</label>'+
      '<span class="pkf-w">'+icon("search",18)+
        '<input class="pkf-i" id="ct-q" type="search" autocomplete="off"'+
          ' value="'+esc(q)+'" placeholder="예: 권리금, 원상복구, 폐업신고"'+
          ' oninput="ctFind(this.value)">'+
      '</span>'+
      '<p class="pkf-r" id="ct-r" hidden></p>'+
    '</div>'+

    ((j || cat) && cats.length > 1
      ? '<ul class="chip-g chip-g-fil ct-f2">'+
          '<li><a class="chip chip-2'+(cat?"":" on")+'" href="'+esc(ctUrl(j,""))+'">'+
            '분야 전체</a></li>'+
          cats.map(function(k){
            return '<li><a class="chip chip-2'+(cat===k.key?" on":"")+'" href="'+
              esc(ctUrl(j, k.key))+'">'+esc(k.name)+' '+cnt(k.key)+'</a></li>';
          }).join("")+
        '</ul>'
      : '')+

    (list.length
      ? '<ul class="ct-l">'+list.map(card).join("")+'</ul>'
      : Empty({
          icon:"book",
          title:"글을 준비하고 있습니다",
          text:"근거를 댈 수 있는 것만 씁니다. 금액을 지어내느니 안 쓰는 편이 낫습니다 — "+
               "그 숫자를 보고 돈을 빌리러 가시기 때문입니다.",
          cta:'<a class="btn btn-b" href="/startup">창업 시작하기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/closure">폐업 시작하기</a>'
        }))+
  '</div></section>';
}

function PageContent(c){
  return PgHero({
    crumb: Crumb([["정보","/content"],[c.title]]),
    kicker:(c.side==="close"?"폐업":"창업")+(c.industry?" · "+amIndustryName(c.industry):""),
    h1:c.title, lead:c.lead, tight:true
  })+
  '<section class="sec sec-white"><div class="w read">'+

    ((c.sum||[]).length ? '<div class="rd-sum">'+
      '<p class="rd-sum-h">'+icon("listck",16)+'세 줄 요약</p>'+
      '<ul>'+c.sum.slice(0,3).map(function(t){
        return '<li>'+mark(t)+'</li>'; }).join("")+'</ul>'+
    '</div>' : '')+

    (function(){
      var hs = (c.body||[]).map(function(b, i){ return b.h ? [i, b.h] : null; })
                 .filter(Boolean);
      if(hs.length < 3) return "";
      return '<nav class="rd-toc" aria-label="이 글에서 다루는 것">'+
        '<p class="rd-toc-h">이 글에서 다루는 것</p>'+
        '<ol>'+hs.map(function(x){
          return '<li><a href="#rd-'+x[0]+'">'+esc(x[1])+'</a></li>'; }).join("")+
        '</ol></nav>';
    })()+

    (c.body||[]).map(function(b, bi){
      return (b.h ? '<h2 id="rd-'+bi+'">'+esc(b.h)+'</h2>' : '')+

        (b.p||[]).map(function(t){ return '<p>'+mark(t)+'</p>'; }).join("")+
        ((b.ul||[]).length ? '<ul>'+b.ul.map(function(t){
          return '<li>'+mark(t)+'</li>'; }).join("")+'</ul>' : '');
    }).join("")+

    ((c.check||[]).length ? '<div class="rd-ck">'+
      '<p class="rd-ck-h">'+icon("check",16)+'확인할 것</p>'+
      '<ul>'+c.check.map(function(t){
        return '<li>'+mark(t)+'</li>'; }).join("")+'</ul>'+
    '</div>' : '')+

    ((c.source||[]).length ? '<div class="src"><b>확인하는 곳</b><ul>'+
      c.source.map(function(s){
        return '<li>'+esc(s.name)+' — '+esc(s.where)+'</li>'; }).join("")+
      '</ul></div>' : '')+

    (c.next ? '<div class="row-cta"><a class="btn btn-b btn-lg" href="'+
      esc(c.next.cat && amCat(c.next.cat) ? catTo(amCat(c.next.cat)) : "/quote")+'">'+
      esc(c.next.label||"업체 찾아보기")+icon("arrow",18)+'</a></div>' : '')+
  '</div></section>'+
  ContentNext(c);
}

function ContentNext(c){
  var cat   = c.cat ? amCat(c.cat) : null;
  var tools = (window.amToolsForCat ? amToolsForCat(c.cat) : []);

  var more  = (window.amContentsFor
    ? amContentsFor({ cat:c.cat, side:c.side, industry:c.industry, limit:4 })
    : []).filter(function(x){ return x.slug !== c.slug; }).slice(0, 3);
  if(!cat && !tools.length && !more.length) return "";

  var n = (cat && window.amProvidersInCat) ? amProvidersInCat(cat) : 0;
  var subs = cat ? (window.amCatItems ? amCatItems(cat, c.industry || "") : (cat.items||[])) : [];

  return '<section class="sec sec-white"><div class="w w-narrow">'+
    (cat ? '<div class="cn-b">'+
      '<p class="cn-h">관련 서비스</p>'+
      '<ul class="chip-g">'+subs.slice(0, 8).map(function(i){

        return '<li><a class="chip" href="'+esc(catTo(cat) +
          (cat.kind === "provider" ? "?s=" + encodeURIComponent(i.key) : ""))+'">'+
          esc(i.name)+'</a></li>'; }).join("")+'</ul>'+

      '<p class="cn-n">'+esc(cat.name)+' 분야에 등록된 업체 '+n+'곳'+
        (n ? '' : ' — 없는 업체를 지어내지 않습니다. 견적을 남기시면 조건에 맞는 곳을 찾아 연결해 드립니다.')+'</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b" href="'+esc(catTo(cat))+'">'+
          esc(cat.kind === "provider" ? cat.name + " 업체 보기" : cat.name + " 보기")+icon("arrow",16)+'</a>'+
        '<a class="btn btn-o" href="'+esc(quoteTo({ cat:c.cat, industry:c.industry||"", side:c.side }))+'">'+
          '견적 요청하기</a>'+
      '</div>'+
    '</div>' : '')+
    (tools.length ? '<div class="cn-b">'+
      '<p class="cn-h">관련 계산기</p>'+
      '<ul class="cn-tl">'+tools.map(function(t){
        return '<li><a href="'+esc(t.to)+'">'+icon(t.icon,18)+
          '<b>'+esc(t.name)+'</b><em>'+esc(t.lead)+'</em>'+
          '<span class="cn-go" aria-hidden="true">'+icon("chev",15)+'</span></a></li>';
      }).join("")+'</ul>'+
    '</div>' : '')+
    (more.length ? '<div class="cn-b">'+
      '<p class="cn-h">이어서 보시면</p>'+
      '<ul class="cn-tl">'+more.map(function(x){
        return '<li><a href="/content/'+esc(x.slug)+'">'+icon("book",18)+
          '<b>'+esc(x.title)+'</b><em>'+esc(x.lead)+'</em>'+
          '<span class="cn-go" aria-hidden="true">'+icon("chev",15)+'</span></a></li>';
      }).join("")+'</ul>'+
    '</div>' : '')+
  '</div></section>';
}

function TrustBar(){
  var rows = [
    ["won",   "찾고 비교하는 것은 무료",   "상담료를 받지 않습니다"],
    ["scale", "추천 · 광고는 그렇다고 표시합니다", "일반 결과는 조건 적합도 순입니다"],
    ["shield","중개자이고 거래 당사자가 아닙니다", "계약은 업체와 직접 하십니다"],
    ["map",   "전국 시 · 군 · 구 기준",     "지역이 맞아야 견적이 뜻이 있습니다"]
  ];
  return '<section class="tbar"><div class="w tbar-g">'+
    rows.map(function(r){
      return '<div class="tbar-i">'+icon(r[0],20)+
        '<span><b>'+esc(r[1])+'</b><em>'+esc(r[2])+'</em></span></div>';
    }).join("")+
  '</div></section>';
}

function ScaleBand(){
  var ind = (window.AM_INDUSTRIES || []).length;
  var st  = (window.AM_START_CATS || []).length;
  var cl  = (window.AM_CLOSE_CATS || []).length;
  var sub = (window.AM_CATS || []).reduce(function(a, c){
    return a + ((c.items || []).length); }, 0);

  if(!ind || !st || !cl || !sub) return "";

  var n = [
    [ind, "업종",        "음식점부터 사무 · 전문서비스까지"],
    [st,  "창업 분야",   "점포 · 인테리어 · 장비 · 인허가 · 자금"],
    [cl,  "폐업 분야",   "양도 · 처분 · 철거 · 원상복구 · 세무"],
    [sub, "세부 서비스", "업종을 고르시면 필요한 것만 추려 드립니다"]
  ];
  return '<section class="scale"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">우리가 다루는 범위</p>'+
      '<h2 class="scale-h">가게 하나를 열고 닫는 데<br class="br-m"> '+
        '필요한 것은 <em>생각보다 많습니다.</em></h2>'+
    '</div>'+
    '<ul class="scale-g">'+ n.map(function(x){

      return '<li class="scale-i">'+
        '<b class="scale-n">'+x[0]+'</b>'+
        '<span class="scale-k">'+esc(x[1])+'</span>'+
        '<span class="scale-l">'+esc(x[2])+'</span>'+
      '</li>';
    }).join("")+'</ul>'+

    '<p class="scale-n-b">이 숫자는 저희가 다루는 <b>분야의 수</b>입니다. '+
      '등록된 업체 수나 거래 실적이 아닙니다.</p>'+
  '</div></section>';
}

function HowBand(){
  var step = [
    ["01", "조건을 고릅니다",
     "업종 · 지역 · 필요한 서비스. 가입하지 않으셔도 됩니다.",
     "sliders"],
    ["02", "한 번만 적어 보냅니다",
     "같은 내용을 업체마다 다시 적지 않으셔도 됩니다. "+
     "조건이 맞는 곳에 같이 전달합니다.",
     "mail"],
    ["03", "받으신 제안을 나란히 놓습니다",
     "금액만 보면 틀립니다. 무엇이 포함됐는지가 같아야 비교가 뜻을 "+
     "가집니다 — 그 자리를 만들어 드립니다.",
     "scale"]
  ];
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">어떻게 진행되나</p>'+
      '<h2>업체를 찾아 전화를 돌리는 대신,<br class="br-m"> '+
        '한 번만 적으시면 됩니다.</h2>'+
    '</div>'+
    '<ol class="how-g">'+ step.map(function(x){
      return '<li class="how-i">'+
        '<span class="how-n">'+esc(x[0])+'</span>'+
        '<span class="how-ic">'+icon(x[3],22)+'</span>'+
        '<b class="how-t">'+esc(x[1])+'</b>'+
        '<span class="how-d">'+esc(x[2])+'</span>'+
      '</li>';
    }).join("")+'</ol>'+
    '<div class="row-cta"><a class="btn btn-b btn-lg" href="/quote">'+
      '견적 요청하기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/providers">업체 먼저 둘러보기</a></div>'+
  '</div></section>';
}

function FaqBand(){
  var all = (window.amFaq ? amFaq() : []);
  if(!all.length) return "";

  var f = all.slice(0, 6);
  return '<section class="sec sec-white"><div class="w w-narrow">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">자주 묻는 것</p>'+
      '<h2>먼저 궁금해하시는 것들</h2>'+
    '</div>'+
    '<ul class="faq-l">'+ f.map(function(x, i){

      return '<li class="faq-i">'+
        '<b class="faq-q">'+esc(x.q)+'</b>'+
        '<p class="faq-a">'+esc(x.a)+'</p>'+
      '</li>';
    }).join("")+'</ul>'+
    (all.length > f.length
      ? '<div class="row-cta row-mid"><a class="btn btn-o" href="/faq">'+
        '자주 묻는 것 전부 보기'+icon("arrow",16)+'</a></div>'
      : "")+
  '</div></section>';
}

function PageAbout(){
  var B = window.AM_BRAND || {};
  var yes = [
    "필요한 업체 · 전문가 · 프랜차이즈를 분류와 지역으로 찾아 드립니다.",
    "한 번 적으신 내용을 조건이 맞는 여러 곳에 같이 전달합니다.",
    "정리하시는 사장님의 점포 · 시설 · 집기를 시작하시는 사장님께 이어 드립니다.",
    "창업과 폐업 과정에서 확인해야 할 것을 정리해 드립니다."
  ];
  var no = [
    "저희가 직접 인테리어 · 철거 · 세무 · 마케팅을 하지 않습니다.",
    "광고비를 받고 업체 순서를 바꾸지 않습니다.",
    "등록된 적 없는 업체 · 브랜드 · 매물을 화면에 만들지 않습니다.",
    "확인하지 않은 평점 · 후기 · 실적을 적지 않습니다.",
    "거래 당사자가 아닙니다 — 계약은 업체와 직접 하십니다."
  ];
  return PgHero({
    kicker:"소개",

    h1raw:"저희가 하는 일과<br> 하지 않는 일.",
    lead:B.slogan || "",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w two-list">'+
    '<div><h2>하는 일</h2><ul class="tick-l">'+yes.map(function(t){
      return '<li>'+icon("check",16)+'<span>'+esc(t)+'</span></li>'; }).join("")+'</ul></div>'+
    '<div><h2>하지 않는 일</h2><ul class="tick-l tick-x">'+no.map(function(t){
      return '<li>'+icon("x",16)+'<span>'+esc(t)+'</span></li>'; }).join("")+'</ul></div>'+
  '</div></section>'+
  TrustBar()+
  ScaleBand()+
  HowBand()+
  FaqBand()+
  '<section class="sec sec-note"><div class="w"><p class="note note-box">'+

    esc(koWith(B.name||"","은는"))+' 통신판매중개자이며 입점 업체와 이용자 사이의 거래 당사자가 '+
    '아닙니다 (전자상거래법 제20조 제1항). 상품 · 서비스 · 거래 조건에 대한 책임은 '+
    '각 업체에 있습니다.</p></div></section>';
}

window.faqToggle = function(btn){
  if(!btn) return;
  var p = document.getElementById(btn.getAttribute("aria-controls"));
  if(!p) return;
  var open = p.hidden;
  p.hidden = !open;
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.classList.toggle("is-open", open);
};

function PageFaq(){
  var f = (window.amFaq ? amFaq() : []);
  var sel  = nowQS("c") || "";
  var nOf  = function(k){
    return f.filter(function(x){ return (x.cat || "etc") === k; }).length; };
  var cats = (window.AM_FAQ_CATS || []).filter(function(k){ return nOf(k.key) > 0; });
  if(sel && !cats.some(function(k){ return k.key === sel; })) sel = "";

  if(!f.length) return PgHero({ kicker:"자주 묻는 것", h1:"자주 묻는 것", tight:true })+
    '<section class="sec"><div class="w w-narrow">'+
      Empty({
        icon:"info",
        title:"아직 정리된 문답이 없습니다",
        text:"궁금한 것을 견적 요청에 적어 주시면 답해 드리고, 자주 나오는 것은 "+
             "여기에 정리해 둡니다.",
        cta:'<a class="btn btn-b" href="/quote">견적 요청하기</a>'+
            '<a class="btn btn-o" href="/about">소개 보기</a>'
      })+
    '</div></section>';

  return PgHero({
    crumb: Crumb([["홈","/"],["자주 묻는 것", null]]),
    kicker:"자주 묻는 것",
    h1:"먼저 궁금해하시는 것들",
    lead:"약속드릴 수 없는 것은 약속드리지 않고, 아직 없는 것은 없다고 적었습니다.",
    tight:true
  })+

  '<section class="sec"><div class="w w-narrow">'+
    (cats.length > 1
      ? '<ul class="chip-g chip-g-fil">'+
          '<li><a class="chip'+(sel?"":" on")+'" href="/faq">전체 '+f.length+'</a></li>'+
          cats.map(function(k){
            return '<li><a class="chip'+(sel===k.key?" on":"")+'" href="'+
              esc("/faq?c="+encodeURIComponent(k.key))+'">'+
              esc(k.name)+' '+nOf(k.key)+'</a></li>';
          }).join("")+
        '</ul>'
      : "")+
    '<ul class="faq-l">'+ f.map(function(x, i){
      var id  = "faq-a-" + i;
      var on  = !sel || (x.cat || "etc") === sel;

      return '<li class="faq-i"'+(on ? "" : " hidden")+'>'+
        '<button class="faq-q" type="button" aria-expanded="false"'+
          ' aria-controls="'+esc(id)+'" onclick="faqToggle(this)">'+
          '<span>'+esc(x.q)+'</span>'+
          '<span class="faq-x" aria-hidden="true">'+icon("chevd",18)+'</span>'+
        '</button>'+
        '<p class="faq-a" id="'+esc(id)+'" hidden>'+esc(x.a)+'</p>'+
      '</li>';
    }).join("")+'</ul>'+

    '<p class="note note-mid">여기 없는 것이 궁금하시면 요청에 그대로 적어 주세요.</p>'+
    '<div class="row-cta row-mid">'+
      '<a class="btn btn-b btn-lg" href="/quote">견적 요청하기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/about">소개 보기</a>'+
    '</div>'+
  '</div></section>';
}

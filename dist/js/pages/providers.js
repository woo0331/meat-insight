

function pvCats(){
  return (window.AM_CATS||[]).filter(function(c){ return c.kind === "provider"; });
}

function pvQOf(c){
  var subs = (amCatItems(c, "") || []).map(function(i){ return i.name; }).join(" ");
  return (c.name+" "+(c.lead||"")+" "+(c.kw||"")+" "+subs)
    .toLowerCase().replace(/\s+/g, "");
}

function pvUrl(i, r, j, v){
  var q = [];
  if(i) q.push("i="+encodeURIComponent(i));
  if(r) q.push("r="+encodeURIComponent(r));
  if(j) q.push("j="+encodeURIComponent(j));
  if(v) q.push(v === "f" ? "f=1" : "v=1");
  return "/providers"+(q.length ? "?"+q.join("&") : "");
}

window.pvFind = function(q){
  q = String(q || "").trim().toLowerCase().replace(/\s+/g, "");
  var rows = [].slice.call(document.querySelectorAll("#pv-g > li[data-pv-q]"));
  var hit = 0;
  rows.forEach(function(el){
    var on = !q || (el.getAttribute("data-pv-q") || "").indexOf(q) >= 0;
    el.hidden = !on;
    if(on) hit++;
  });
  var n = document.getElementById("pv-n");
  if(n) n.textContent = hit + "개 분야";
  var r = document.getElementById("pv-r");
  if(r){
    r.hidden = !q;
    r.textContent = hit ? (hit + "개 분야를 찾았습니다")
      : "찾으시는 말로는 나오지 않습니다 — 아래 거르개에서 골라 보세요.";
    r.className = "pkf-r" + (q && !hit ? " is-zero" : "");
  }
};

window.pvGo = function(){
  var i = $("pv-i"), r = $("pv-r2"), j = $("pv-j"), v = $("pv-v");
  go(pvUrl(i && i.value, r && r.value, j && j.value, v && v.value));
};

window.pvSvcGo = function(sel){
  if(!sel || !sel.value) return;
  var i = $("pv-i"), r = $("pv-r2"), v = $("pv-v");
  var q = [];
  if(i && i.value) q.push("i="+encodeURIComponent(i.value));
  if(r && r.value) q.push("r="+encodeURIComponent(r.value));
  if(v && v.value) q.push(v.value === "f" ? "f=1" : "v=1");
  go("/providers/"+sel.value+(q.length ? "?"+q.join("&") : ""));
};

function PageProviders(){
  var ind = nowQS("i"), reg = nowQS("r"), jy = nowQS("j");
  var v   = nowQS("v") === "1" ? "v" : (nowQS("f") === "1" ? "f" : "");
  var JY  = (window.AM_JOURNEYS || []);
  var all = pvCats();

  var jys = JY.filter(function(x){
    return all.some(function(c){ return amJourneyOfCat(c.key) === x.key; });
  });
  if(jy && !jys.some(function(x){ return x.key === jy; })) jy = "";

  var list = jy ? all.filter(function(c){ return amJourneyOfCat(c.key) === jy; }) : all;

  var carry = [];
  if(reg) carry.push("r="+encodeURIComponent(reg));
  if(v)   carry.push(v === "f" ? "f=1" : "v=1");
  var qs = carry.join("&");

  return PgHero({
    kicker:"업체찾기",
    h1raw:"원하는 조건으로<br class=\"br-m\"> 업체를 찾아보세요.",
    lead:"지역과 업종을 고르시면 그 조건이 분야 화면까지 그대로 따라갑니다. "+
         "한 번 적으신 내용으로 여러 곳에 견적을 요청하실 수 있습니다.",
    cta:'<a class="btn btn-b btn-lg" href="'+esc(quoteTo({industry:ind, region:reg}))+'">'+
        '견적부터 요청하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/join">업체 입점하기</a>',
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+

    '<div class="pkf pv-find">'+
      '<label class="pkf-l" for="pv-q">어떤 일을 맡기시나요?</label>'+
      '<span class="pkf-w">'+icon("search",18)+
        '<input class="pkf-i" id="pv-q" type="search" autocomplete="off"'+
          ' placeholder="서비스 검색 (예: 인테리어, 철거, POS)"'+
          ' oninput="pvFind(this.value)">'+
      '</span>'+
      '<p class="pkf-r" id="pv-r" hidden></p>'+
    '</div>'+

    '<div class="fil pv-fil">'+
      '<span class="fil-ic" aria-hidden="true">'+icon("sliders",18)+'</span>'+
      RegionSelect("pv-r2", reg, "pvGo()")+
      IndustrySelect("pv-i", ind, "pvGo()")+
      '<select class="sel" id="pv-s" aria-label="서비스" onchange="pvSvcGo(this)">'+
        '<option value="">서비스 전체</option>'+
        all.map(function(c){
          return '<option value="'+esc(c.key)+'">'+esc(c.name)+'</option>';
        }).join("")+
      '</select>'+
      '<select class="sel" id="pv-j" aria-label="분야" onchange="pvGo()">'+
        '<option value="">분야 전체</option>'+
        jys.map(function(x){
          return '<option value="'+esc(x.key)+'"'+(jy===x.key?" selected":"")+'>'+
            esc(x.name)+'</option>';
        }).join("")+
      '</select>'+

      '<select class="sel" id="pv-v" aria-label="확인 상태" onchange="pvGo()">'+
        '<option value="">확인 상태 전체</option>'+
        '<option value="v"'+(v==="v"?" selected":"")+'>확인된 곳만</option>'+
        '<option value="f"'+(v==="f"?" selected":"")+'>포트폴리오 있는 곳만</option>'+
      '</select>'+
      '<span class="fil-n" id="pv-n">'+list.length+'개 분야</span>'+
    '</div>'+

    '<ul class="cat-g cat-g4 pvc-g" id="pv-g">'+
      list.map(function(c){
        return '<li data-pv-q="'+esc(pvQOf(c))+'">'+CatCard(c, ind, qs)+'</li>';
      }).join("")+
    '</ul>'+

    '<p class="note note-mid">분야는 정해진 차례로 냅니다. '+
      '광고로 위에 올린 자리는 없습니다.</p>'+
  '</div></section>'+
  SampleBand();
}

function SampleBand(){
  var p = amSample("provider");
  if(!p || (window.AM_PROVIDERS||[]).length) return "";
  return '<section class="sec sec-gray"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">SAMPLE</p>'+
      '<h2>업체 카드는 이렇게 보입니다</h2>'+
      '<p>아직 등록된 업체가 없습니다. 지어내지 않고, 대신 '+
        '<b>입점하면 어떻게 나가는지</b>를 예시로 보여 드립니다.</p></div>'+
    '<div class="smp-card">'+ProviderCard(p)+'</div>'+
    '<p class="row-cta">'+
      '<a class="btn btn-b btn-lg" href="/sample">업체 상세 예시 보기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/join">업체로 입점하기</a>'+
    '</p>'+
  '</div></section>';
}

function SvcPageBands(cat, items){
  var d = (typeof amSvcPage === "function") ? amSvcPage(cat.key) : null;
  if(!d) return "";
  var out = "";

  var isPv = (cat.kind === "provider");

  if(d.when && d.when.length){
    out += '<section class="sec sec-ivory"><div class="w">'+
      '<div class="sec-hd"><p class="eyebrow">WHEN</p>'+
        '<h2>'+(isPv ? esc(cat.name)+' 업체를 이런 때 찾으십니다'
                     : '이런 때 보시면 됩니다')+'</h2></div>'+
      '<ul class="svp-when">'+ d.when.map(function(w){
        return '<li>'+icon("check",18)+'<span>'+esc(w)+'</span></li>';
      }).join("")+'</ul>'+
    '</div></section>';
  }

  if(d.flow && d.flow.length){
    out += '<section class="sec sec-white"><div class="w">'+
      '<div class="sec-hd"><p class="eyebrow">HOW</p>'+
        '<h2>어떻게 진행되나요</h2>'+

        (items && items.length
          ? '<p>'+esc(cat.name)+' 안에서 '+items.length+'가지를 '+
            (isPv ? '맡는 업체를 찾으실 수 있습니다.' : '다룹니다.')+'</p>'
          : '')+
      '</div>'+
      '<ol class="svp-flow">'+ d.flow.map(function(s, i){
        return '<li><b class="svp-n">'+(i + 1 < 10 ? "0" : "")+(i + 1)+'</b>'+
          '<b class="svp-fn">'+esc(s.n)+'</b>'+
          '<i class="svp-fd">'+esc(s.d)+'</i></li>';
      }).join("")+'</ol>'+
    '</div></section>';
  }

  if(d.cost && d.cost.length){
    out += '<section class="sec sec-blue"><div class="w">'+
      '<div class="sec-hd"><p class="eyebrow">COST</p>'+
        '<h2>비용은 무엇으로 갈리나요</h2>'+
        '<p>같은 평수라도 아래 조건에 따라 크게 달라집니다. '+
          '그래서 금액을 미리 적어 두지 않고, 조건을 남기시면 업체가 '+
          '그 조건으로 견적을 냅니다.</p></div>'+
      '<ul class="svp-cost">'+ d.cost.map(function(x){
        return '<li><b>'+esc(x.n)+'</b><i>'+esc(x.d)+'</i></li>';
      }).join("")+'</ul>'+
    '</div></section>';
  }

  if(d.faq && d.faq.length){
    out += '<section class="sec sec-white"><div class="w">'+
      '<div class="sec-hd"><p class="eyebrow">FAQ</p>'+
        '<h2>자주 묻는 것</h2></div>'+
      '<ul class="faq-l">'+ d.faq.map(function(x){
        return '<li class="faq-i"><b class="faq-q">'+esc(x.q)+'</b>'+
          '<p class="faq-a">'+esc(x.a)+'</p></li>';
      }).join("")+'</ul>'+
    '</div></section>';
  }
  return out;
}

function PageProviderCat(cat){
  var sub = nowQS("s"), ind = nowQS("i"), reg = nowQS("r");

  var vf = nowQS("v") === "1", fo = nowQS("f") === "1";
  var side = amCatSide(cat.key);
  var items = amCatItems(cat, ind);

  var list = amProviders({ cat:cat.key, sub:sub || null,
                           industry:ind || null, region:reg || null,
                           verified:vf, folio:fo });

  var all  = amProviders({ cat:cat.key, sub:sub || null,
                           industry:ind || null, region:reg || null });

  return PgHero({
    crumb: Crumb([["업체찾기","/providers"],[cat.name]]),
    kicker:(side === "start" ? "START" : "CLOSE") + " · 업체찾기",
    h1:cat.name,
    lead:cat.desc,
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+

    (items.length ? '<ul class="chip-g chip-g-fil">'+
      '<li><a class="chip'+(sub?"":" on")+'" href="'+esc(pcUrl(cat,"",ind,reg))+'">전체</a></li>'+
      items.map(function(i){
        return '<li><a class="chip'+(sub===i.key?" on":"")+'" href="'+
          esc(pcUrl(cat,i.key,ind,reg))+'">'+esc(i.name)+'</a></li>';
      }).join("")+'</ul>' : "")+

    '<div class="fil">'+
      '<span class="fil-ic" aria-hidden="true">'+icon("sliders",18)+'</span>'+
      IndustrySelect("fil-i", ind, "pcGo('"+esc(cat.key)+"')")+
      RegionSelect("fil-r", reg, "pcGo('"+esc(cat.key)+"')")+
      '<input type="hidden" id="fil-s" value="'+esc(sub)+'">'+

      '<label class="fil-ck'+(vf?" on":"")+'">'+
        '<input type="checkbox" id="fil-v"'+(vf?" checked":"")+
        ' onchange="pcGo(\''+esc(cat.key)+'\')">'+
        '<span>확인된 곳만</span></label>'+
      '<label class="fil-ck'+(fo?" on":"")+'">'+
        '<input type="checkbox" id="fil-f"'+(fo?" checked":"")+
        ' onchange="pcGo(\''+esc(cat.key)+'\')">'+
        '<span>포트폴리오 있는 곳만</span></label>'+
      '<span class="fil-n">'+(list.length ? list.length+"곳" : "0곳")+

        ((vf || fo) && all.length > list.length
          ? '<em class="fil-off">거르개로 '+(all.length - list.length)+'곳 숨김</em>' : '')+
      '</span>'+
    '</div>'+

    (list.length

      ? '<div class="pv-g">'+list.slice(0, amShown(list.length)).map(ProviderPickCard).join("")+'</div>'+

        '<p class="note">등록된 차례로 냅니다. 광고로 위에 올린 자리는 없습니다.</p>'+
        MoreBtn(list.length)

      : EmptyGuide({
          icon:cat.icon,
          title:cat.name+" 업체를 찾고 계신가요?",
          text:"좋은 업체를 고르려면 가격보다 먼저 확인해야 할 것이 있습니다.",

          reads: amContentsFor({ cat:cat.key, side:side, industry:ind, limit:4 }),

          note:"이 분야에 등록된 "+amBrand()+" 파트너 업체는 지금 "+
               all.length+"곳입니다. 조건을 남겨 두시면 등록되는 대로 연결해 드립니다.",
          cta:'<a class="btn btn-b" href="'+esc(quoteTo({cat:cat.key,sub:sub,industry:ind,region:reg,side:side}))+'">'+
              '원하는 조건 남기기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/join">'+esc(cat.name)+' 업체라면 입점하기</a>'
        }))+
  '</div></section>'+

  SvcPageBands(cat, items)+

  '<section class="sec"><div class="w band-cta">'+
    '<div><p class="eyebrow">한 번만 적으세요</p>'+
      '<h2>같은 내용을 업체마다 다시 적지 않으셔도 됩니다</h2>'+
      '<p class="lead">업종 · 지역 · 평수 · 예산 · 일정만 적으시면 조건에 맞는 '+
        '곳에 같이 전달하고, 받으신 제안을 한 화면에서 비교하실 수 있습니다.</p></div>'+
    '<a class="btn btn-b btn-lg" href="'+esc(quoteTo({cat:cat.key,sub:sub,industry:ind,region:reg,side:side}))+'">'+
      '견적 요청하기'+icon("arrow",18)+'</a>'+
  '</div></section>'+
  CmpBar()+

  ReadBand({ cat:cat.key, side:side, industry:ind,
             title:"업체를 부르기 전에 알아 두면" });
}

function pcUrl(cat, sub, ind, reg){
  var q = [];
  if(sub) q.push("s="+encodeURIComponent(sub));
  if(ind) q.push("i="+encodeURIComponent(ind));
  if(reg) q.push("r="+encodeURIComponent(reg));

  if(nowQS("v") === "1") q.push("v=1");
  if(nowQS("f") === "1") q.push("f=1");
  return "/providers/"+cat.key+(q.length ? "?"+q.join("&") : "");
}

window.pcGo = function(catKey){
  var i = $("fil-i"), r = $("fil-r"), s = $("fil-s");
  var v = $("fil-v"), f = $("fil-f");
  var q = [];
  if(s && s.value) q.push("s="+encodeURIComponent(s.value));
  if(i && i.value) q.push("i="+encodeURIComponent(i.value));
  if(r && r.value) q.push("r="+encodeURIComponent(r.value));
  if(v && v.checked) q.push("v=1");
  if(f && f.checked) q.push("f=1");
  go("/providers/"+catKey+(q.length ? "?"+q.join("&") : ""));
};

function PageProviderOne(p){
  var s = amProviderStats(p) || {};
  var subs = (p.subs||[]).map(amSubName).filter(Boolean);
  var inds = (p.industries||[]).map(amIndustryName).filter(Boolean);

  var pvQ = quoteTo({
    sub:      (p.subs || [])[0] || "",
    industry: (p.industries || [])[0] || "",
    region:   (p.regions || [])[0] || ""
  });
  return PgHero({
    crumb: Crumb([["업체찾기","/providers"],[p.name]]),
    kicker:(p.regions||[]).map(function(k){ return amRegionName(k); }).join(" · "),
    h1:p.name,
    lead:p.intro || "",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w pv-one">'+

    (amProviderBadges(p).length
      ? '<ul class="pv-vf-l">'+amProviderBadges(p).map(function(bd){
          return '<li><em class="pv-vf">'+icon("check",13)+esc(bd)+'</em></li>'; }).join("")+
        '</ul>'
      : '')+
    '<div class="pv-one-m">'+

      (s.rating != null
        ? '<div class="pv-stat"><span class="pv-stat-v">'+icon("star",18)+
            '<b>'+esc(String(s.rating))+'</b></span>'+
            '<span class="pv-stat-l">후기 '+s.reviews+'건</span></div>'
        : '')+
      (s.jobs ? '<div class="pv-stat"><span class="pv-stat-v"><b>'+s.jobs+'</b></span>'+
            '<span class="pv-stat-l">등록된 작업</span></div>' : '')+
      (p.since ? '<div class="pv-stat"><span class="pv-stat-v"><b>'+esc(String(p.since))+'</b></span>'+
            '<span class="pv-stat-l">시작한 해</span></div>' : '')+
    '</div>'+

    ((p.gu||[]).length ? '<div class="pv-sec"><h2>일하는 지역</h2>'+
      '<ul class="chip-g">'+p.gu.map(function(g){
        return '<li><span class="chip chip-flat">'+esc(g)+'</span></li>'; }).join("")+
      '</ul><p class="note">업체가 적어 준 범위입니다.</p></div>' : '')+

    (subs.length ? '<div class="pv-sec"><h2>이런 일을 합니다</h2>'+
      '<ul class="chip-g">'+subs.map(function(n){
        return '<li><span class="chip chip-flat">'+esc(n)+'</span></li>'; }).join("")+
      '</ul></div>' : '')+

    (inds.length ? '<div class="pv-sec"><h2>전문 업종</h2>'+
      '<ul class="chip-g">'+inds.map(function(n){
        return '<li><span class="chip chip-flat">'+esc(n)+'</span></li>'; }).join("")+
      '</ul></div>' : '')+

    ((p.price||[]).length ? '<div class="pv-sec"><h2>가격</h2>'+
      '<ul class="price-l">'+p.price.map(function(x){
        return '<li><b>'+esc(x.name)+'</b><span>'+
          (x.from ? esc(won(x.from))+'원'+(x.unit?' / '+esc(x.unit):'') : '상담')+'</span>'+
          (x.note ? '<em>'+esc(x.note)+'</em>' : '')+'</li>'; }).join("")+'</ul>'+
      '<p class="note">업체가 등록한 값입니다. 현장 조건에 따라 달라집니다.</p></div>' : '')+

    ((p.portfolio||[]).length ? '<div class="pv-sec"><h2>포트폴리오</h2>'+
      '<div class="pf-g">'+p.portfolio.map(function(f){
        return '<div class="pf">'+
          (f.after ? '<img class="ph" src="'+esc(f.after)+'" alt="'+esc(f.title)+' 완료 사진" loading="lazy" decoding="async">' : '')+
          '<b>'+esc(f.title)+'</b>'+

          '<span>'+esc([amIndustryName(f.industry), amRegionName(f.region), f.year]
            .filter(Boolean).join(" · "))+'</span>'+
        '</div>'; }).join("")+'</div></div>' : '')+

    ((p.as && (p.as.period || p.as.what))
      ? '<div class="pv-sec"><h2>A/S</h2>'+
        '<ul class="pv-as">'+
          (p.as.period ? '<li><b>기간</b><span>'+esc(p.as.period)+'</span></li>' : '')+
          (p.as.what   ? '<li><b>범위</b><span>'+esc(p.as.what)+'</span></li>' : '')+
        '</ul>'+
        '<p class="note">업체가 적어 준 내용입니다. 계약서로 다시 확인하세요.</p></div>'
      : '')+

    ((p.faq||[]).length ? '<div class="pv-sec"><h2>자주 묻는 것</h2>'+
      '<ul class="pv-faq">'+p.faq.map(function(f){
        return '<li><b>'+esc(f.q)+'</b><p>'+esc(f.a)+'</p></li>'; }).join("")+
      '</ul>'+
      '<p class="note">업체가 적어 준 내용입니다.</p></div>' : '')+

    ((p.reviews||[]).length ? ReviewBlock(p) : '')+

    Empty({
      icon:"chat",
      title:"상담과 견적으로 시작하세요",
      text:"연락처를 바로 드리지 않습니다. 필요한 내용을 적어 주시면 그대로 전달하고, "+
           "업체 연락처는 사장님이 동의하신 뒤에만 오갑니다.",

      cta:'<a class="btn btn-b" href="'+esc(pvQ)+'">무료 견적받기'+icon("arrow",16)+'</a>'+
          SaveBtn(p)
    })+
  '</div></section>'+

  '<div class="sticky-cta">'+
    '<a class="btn btn-b" href="'+esc(pvQ)+'">무료 견적받기</a>'+
    '<a class="btn btn-o" href="'+esc(pvQ)+'">상담 요청</a>'+
    SaveBtn(p)+
  '</div>';
}

function SaveBtn(p){
  var on = (typeof amIsSaved === "function") && amIsSaved(p.id);
  return '<button class="btn btn-o btn-ic" type="button"'+
    ' onclick="saveToggle(\''+esc(p.id)+'\')"'+
    ' aria-pressed="'+(on ? "true" : "false")+'">'+
    icon(on ? "check" : "plus", 16)+
    '<span>'+(on ? "저장됨" : "관심 업체")+'</span></button>';
}

function rvWho(r){
  var who = r.by ? amMaskName(r.by) + " 사장님" : "사장님";
  var what = [r.industry ? amIndustryName(r.industry) : "", amSubName(r.sub)]
             .filter(Boolean).join(" · ");
  return esc(who) + (what ? " · " + esc(what) : "");
}

function ReviewBlock(p){
  return '<div class="pv-sec"><h2>후기</h2><ul class="rv-l">'+
    p.reviews.map(function(r){
      var sc = r.score || {};
      return '<li class="rv">'+
        '<div class="rv-t">'+
          '<b>'+icon("star",14)+esc(String(sc.total||"-"))+'</b>'+
          (r.badge && AM_REVIEW_BADGES[r.badge]
            ? '<em class="rv-bd">'+icon("check",12)+esc(AM_REVIEW_BADGES[r.badge])+'</em>' : '')+
          '<span class="rv-at">'+esc(r.at||"")+'</span>'+
        '</div>'+

        '<p class="rv-who">'+ rvWho(r) +'</p>'+
        (r.text ? '<p>'+esc(r.text)+'</p>' : '')+
        '<ul class="rv-ax">'+(window.AM_REVIEW_AXES||[]).filter(function(a){
            return a.key !== "total" && sc[a.key];
          }).map(function(a){
            return '<li>'+esc(a.name)+' <b>'+esc(String(sc[a.key]))+'</b></li>';
          }).join("")+'</ul>'+
      '</li>';
    }).join("")+'</ul>'+
    '<p class="note">플랫폼을 통해 상담 · 계약하신 분의 후기를 먼저 보여 드립니다.</p></div>';
}

var SAMPLE_SLOTS = [
  { t:"가격 정보",  d:"시공 단가 · 기본 공사비 · 추가 비용 기준" },
  { t:"자주 묻는 것", d:"공사 기간 · 계약금 · 자재 변경 같은 업체별 답" },
  { t:"A/S 정책",   d:"보증 기간과 범위, 하자 접수 방법" }
];
function SampleNote(where){
  return '<div class="smp-note smp-'+esc(where)+'">'+icon("info",18)+
    '<span><b>예시 화면입니다. 실제 업체가 아닙니다.</b> '+
    esc(amBrand())+'에 입점하시면 업체 정보가 이런 짜임새로 나갑니다 — '+
    '상호 · 후기 · 평점 · 사진은 전부 업체와 손님이 올린 것만 올라갑니다.</span></div>';
}
function PageSample(){
  var p = amSample("provider");

  if(!p) return PgHero({ kicker:"예시", h1:"예시 화면이 꺼져 있습니다",
    lead:"관리자가 예시 프로필을 꺼 두었습니다.", tight:true })+
    '<section class="sec sec-white"><div class="w">'+
      Empty({ icon:"users", title:"지금은 볼 수 없습니다",
        text:"실제 업체 목록은 업체찾기에서 보실 수 있습니다.",
        cta:[["/providers","업체찾기"]] })+'</div></section>';

  return '<section class="sec sec-gray smp-top"><div class="w">'+
      SampleNote("top")+'</div></section>'+
    PageProviderOne(p)+
    '<section class="sec sec-gray"><div class="w">'+
      '<div class="sec-hd"><p class="eyebrow">PARTNER</p>'+
        '<h2>입점하시면 이 자리가 채워집니다</h2>'+
        '<p>아래는 업체가 직접 적는 칸입니다. 저희가 대신 적지 않습니다.</p></div>'+
      '<ul class="smp-slot">'+SAMPLE_SLOTS.map(function(x){
        return '<li><b>'+esc(x.t)+'</b><i>'+esc(x.d)+'</i>'+
          '<em>입점 업체는 이 자리에 실제 정보가 표시됩니다.</em></li>';
      }).join("")+'</ul>'+
      '<p class="row-cta"><a class="btn btn-b btn-lg" href="/join">업체 입점 알아보기'+
        icon("arrow",18)+'</a></p>'+
    '</div></section>'+
    '<section class="sec sec-white"><div class="w">'+SampleNote("bot")+'</div></section>';
}

function PageJoin(){

  var subs = (window.AM_DEVICE_KINDS || []).map(function(k){
    return { cat:{ key:k.key, name:k.name, items:[] },
             items:(window.AM_MODELS || []).filter(function(m){
               return m.kind === k.key; }) };
  }).filter(function(g){ return g.items.length; });
  var ready = !!(window.WOW_BIZ && WOW_BIZ.sosReady);

  return PgHero({

    kicker:"중고폰 매입업체 · 전문 수리업체",
    h1raw:"기기를 팔려는 분과<br class=\"br-m\"> 바로 이어 드립니다.",
    lead:"상호와 취급 기기만 남겨 주시면, 조건이 맞는 건만 보내 드립니다. 입찰에 참여하시는 데 받는 비용은 없습니다.",

    cta:'<a class="btn btn-b btn-lg" href="#join-form">입점 신청하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="#join-fields">어떤 분야를 찾나요</a>'
  })+
  JoinNow(subs)+

  JoinSix()+
  JoinWhat()+

  JoinShow()+
  JoinWhy()+
  JoinHow()+
  JoinFields(subs)+
  JoinFaq()+
  JoinForm(ready);
}

var JOIN_WHERE = [
  { ic:"gavel",    t:"경쟁입찰",        p:"판매자가 올린 기기에 견적을 내는 자리", to:"/bid" },
  { ic:"compare",  t:"견적 비교 화면",  p:"판매자가 받은 견적을 나란히 놓고 보는 자리" },
  { ic:"mobile",   t:"기기 조건",       p:"기종 · 용량 · 외관 등급 · 상태가 적혀 옵니다", to:"/sell" },
  { ic:"doc",      t:"진행 조회",       p:"고르신 뒤의 수거 · 검수 · 정산 기록", to:"/track" }
];

function JoinSix(){
  var L = (window.AM_JOIN_SIX || []);
  if(!L.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">PARTNER Q&amp;A</p>'+
      '<h2>입점하면 무엇이 달라지나요?</h2>'+
      '<p>업체 사장님이 제일 먼저 묻는 여섯입니다. 지금 사실인 것만 적었습니다.</p>'+
    '</div>'+
    '<ul class="jn6">'+L.map(function(x){
      return '<li>'+
        '<p class="jn6-q">'+
          '<span class="ic-t">'+icon(x.ic,22)+'</span>'+
          '<b>'+esc(x.q)+'</b></p>'+
        '<p class="jn6-a">'+esc(x.a)+'</p>'+
        (x.to ? '<a class="jn6-go" href="'+esc(x.to)+'">'+esc(x.toN||"보기")+
          icon("arrow",15)+'</a>' : '')+
      '</li>'; }).join("")+'</ul>'+
  '</div></section>';
}

function JoinShow(){

  var sp = null;
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">입점하면 어디에 보이나</p>'+
      '<h2>등록 한 번으로 이 자리에 같이 올라갑니다</h2>'+
      '<p>따로 신청하실 것이 없습니다. 하시는 일과 지역이 맞는 자리에 저절로 나갑니다.</p>'+
    '</div>'+
    '<ul class="ops-g">'+JOIN_WHERE.map(function(w){
      var in1 = '<span class="ops-i">'+icon(w.ic,22)+'</span>'+
        '<b>'+esc(w.t)+'</b>';

      return '<li>'+(w.to
        ? '<a class="ops" href="'+esc(w.to)+'">'+in1+
          '<span class="ops-go" aria-hidden="true">'+icon("chev",15)+'</span></a>'
        : '<span class="ops">'+in1+'</span>')+'</li>';
    }).join("")+'</ul>'+
    (sp ? '<div class="jn-ex">'+
      '<p class="jn-ex-h"><b>업체 카드는 이렇게 보입니다</b>'+
        '<em>아래는 예시입니다 — 실제 업체가 아니고, 손님 화면 어디에도 나오지 않습니다.</em></p>'+
      '<div class="jn-ex-b"><span class="jn-ex-tag">예시</span>'+
        ProviderCard(sp)+
      '</div>'+
      '<p class="jn-ex-h"><b>상세 화면에는 이만큼 들어갑니다</b>'+
        '<em>사진 · 전문분야 · 전문업종 · 활동지역 · 가격 · 포트폴리오 · 확인 · 후기 · 상담 시간.</em></p>'+
      '<ul class="jn-ex-l">'+ joinExRows(sp).map(function(r){
        return '<li><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></li>'; }).join("")+'</ul>'+
      '<p class="sec-note">'+icon("info",15)+

        '평점과 후기 수는 값으로 저장하지 않습니다 — 손님이 쓰신 후기에서 계산합니다. '+
        '등록하실 때 적는 칸 자체가 없습니다.</p>'+
    '</div>' : '')+
  '</div></section>';
}

function joinExRows(p){
  var st = amProviderStats(p) || {};
  var rows = [
    ["전문 서비스", (p.subs||[]).map(amSubName).join(" · ")],
    ["전문 업종",   (p.industries||[]).map(amIndustryName).join(" · ")],
    ["활동 지역",   (p.regions||[]).map(amRegionName).concat(p.gu||[]).join(" · ")],
    ["포트폴리오",  (p.portfolio||[]).length + "건 — 공사 내용 · 업종 · 지역 · 연도 · 사진"],

    ["확인",        amProviderVerified(p).join(" · ") || "확인한 것만"],
    ["상담 가능 시간", p.consultHours || ""]
  ];
  if(st.rating != null)
    rows.push(["후기", "평점 " + st.rating + " · " + st.reviews + "건 (후기에서 계산한 값입니다)"]);

  return rows.filter(function(r){ return r[1]; });
}

function JoinNow(subs){
  var n = (window.AM_PROVIDERS || []).length;
  var open = !!(window.WOW_BIZ && WOW_BIZ.sosReady);

  var empty = subs.filter(function(g){
    return window.amProvidersInCat ? amProvidersInCat(g.cat) === 0 : true; }).length;

  return '<section class="sec sec-white"><div class="w">'+
    '<div class="jn-now">'+
      '<div class="jn-now-t">'+
        '<p class="eyebrow">지금 상태</p>'+
        (n
          ? '<h2>지금 <em>'+n+'곳</em>이 등록돼 있습니다.</h2>'+
            '<p class="lead">분야와 지역이 맞는 요청을 나눠 받습니다.</p>'
          : '<h2>아직 <em>아무도</em> 등록하지 않았습니다.</h2>'+
            '<p class="lead">부풀려 말씀드리지 않겠습니다. 지금 등록된 업체는 '+
              '0곳이고, 그래서 지금 들어오시면 그 분야의 <b>첫 번째</b>입니다.</p>')+
      '</div>'+
      '<ul class="jn-now-l">'+

        '<li><b>'+esc(open ? "열려 있습니다" : "아직 열지 않았습니다")+'</b>'+
          '<span>판매자 쪽 판매 신청 접수</span></li>'+
        '<li><b>'+(empty || subs.length)+'개 분야</b>'+
          '<span>'+esc(empty ? "아직 등록된 업체가 없습니다" : "업체를 받고 있습니다")+'</span></li>'+
        '<li><b>비용 없음</b><span>입찰 참여 · 프로필 관리</span></li>'+
      '</ul>'+
    '</div>'+
  '</div></section>';
}

function JoinWhat(){
  var f = (window.AM_JOIN_FIELDS || []);
  if(!f.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">무엇을 받게 되나</p>'+
      '<h2>요청은 이런 칸으로 옵니다</h2>'+
      '<p>사장님이 직접 적어 보내신 내용을 그대로 전달합니다. '+
        '받으실지 말지는 업체가 정하십니다.</p>'+
    '</div>'+
    '<div class="jn-req">'+
      '<ul class="jn-req-l">'+ f.map(function(x){
        return '<li><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>';
      }).join("")+'</ul>'+

      '<p class="jn-req-n">'+icon("lock",16)+
        '<span>성함과 연락처는 <b>여기 들어 있지 않습니다.</b> 업체가 '+
        '정해지면 사장님께 어느 업체인지 알려 드리고, 그때 다시 동의를 '+
        '받은 뒤에 전달합니다 (개인정보보호법 제17조).</span></p>'+
    '</div>'+
  '</div></section>';
}

function JoinWhy(){
  var w = (window.AM_JOIN_WHY || []);
  if(!w.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">약속</p>'+
      '<h2>업체에 이렇게 하겠습니다</h2>'+
      '<p>전부 <a href="/terms">이용약관</a>에 근거가 있는 말입니다. '+
        '약관과 다른 말을 화면에 적지 않습니다.</p>'+
    '</div>'+
    '<ul class="jn-why rv-stg">'+ w.map(function(x){
      return '<li data-rv><span class="jn-why-ic">'+icon(x.icon,22)+'</span>'+
        '<b>'+esc(x.t)+'</b><span class="jn-why-d">'+esc(x.d)+'</span></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

function JoinHow(){
  var st = (window.AM_JOIN_STEPS || []);
  if(!st.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">어떻게 진행되나</p>'+
      '<h2>세 걸음이면 됩니다</h2></div>'+
    '<ol class="how-g">'+ st.map(function(x){
      return '<li class="how-i">'+
        '<span class="how-n">'+esc(x.n)+'</span>'+
        '<b class="how-t">'+esc(x.t)+'</b>'+
        '<span class="how-d">'+esc(x.d)+'</span>'+
      '</li>';
    }).join("")+'</ol>'+
  '</div></section>';
}

function JoinFields(subs){
  if(!subs.length) return "";

  return '<section class="sec sec-white" id="join-fields"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">이런 곳을 찾고 있습니다</p>'+
      '<h2>이런 기기가 들어옵니다</h2>'+
      '<p>여기 없는 기종도 적어 주시면 목록에 넣어 드립니다.</p></div>'+
    '<div class="join-g is-fold-chips" id="jn-fields-g">'+subs.map(function(g){
      var show = g.items.slice(0, 6), more = g.items.length - show.length;
      var n = window.amProvidersInCat ? amProvidersInCat(g.cat) : 0;
      return '<div class="join-cat"><b>'+esc(g.cat.name)+

        '<i class="join-n'+(n ? "" : " join-n0")+'">'+
          esc(n ? n + "곳" : "아직 없음")+'</i></b>'+
        '<ul class="chip-g">'+show.map(function(i){
          return '<li><span class="chip chip-flat">'+esc(i.name)+'</span></li>';
        }).join("")+
        (more > 0 ? '<li><span class="chip chip-flat chip-more">외 '+more+'</span></li>' : '')+
        '</ul></div>';
    }).join("")+'</div>'+

    '<div class="jn-fold-w">'+
      FoldAll("jn-fields-g", "기종마다 어떤 모델인지 보기", "접기", "is-fold-chips")+
    '</div>'+
  '</div></section>';
}

function JoinFaq(){
  var f = (window.amJoinFaq ? amJoinFaq() : []);
  if(!f.length) return "";
  return '<section class="sec"><div class="w w-narrow">'+
    '<div class="sec-hd"><p class="eyebrow">업체가 자주 묻는 것</p>'+
      '<h2>먼저 궁금해하시는 것들</h2></div>'+

    '<ul class="faq-l">'+ f.map(function(x, i){
      var id = "jn-faq-" + i;
      return '<li class="faq-i">'+
        '<button class="faq-q" type="button" aria-expanded="false"'+
          ' aria-controls="'+esc(id)+'" onclick="faqToggle(this)">'+
          '<span>'+esc(x.q)+'</span>'+
          '<span class="faq-x" aria-hidden="true">'+icon("chevd",18)+'</span>'+
        '</button>'+
        '<p class="faq-a" id="'+esc(id)+'" hidden>'+esc(x.a)+'</p>'+
      '</li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

function JoinForm(ready){
  return '<section class="sec sec-white" id="join-form"><div class="w form-wrap">'+
    '<h2 class="pg-h2">입점 신청</h2>'+
    (ready ? "" :

      '<div class="notice-bad"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
        '<p>접수처 설정이 끝나면 바로 열립니다. 그동안에도 '+
        '<a href="/providers">업체찾기</a>와 <a href="/quote">견적 요청</a>은 '+
        '그대로 쓰실 수 있습니다.</p></div>')+
    '<form id="join-f" onsubmit="return joinSend(event)">'+
      Field("jn-name","업체명","",true,"text","organization")+
      Field("jn-ceo","담당자 성함","",true,"text","name")+
      Field("jn-tel","연락처","010-0000-0000",true,"tel","tel")+
      Field("jn-mail","이메일","",false,"email","email")+
      '<div class="f-r"><label for="jn-svc">하시는 일 <b>*</b></label>'+
        '<input id="jn-svc" required placeholder="예: 아이폰 · 갤럭시 매입, 액정 수리"></div>'+
      '<div class="f-r"><label for="jn-reg">서비스 가능 지역 <b>*</b></label>'+
        RegionSelect("jn-reg","")+'</div>'+

      '<div class="f-r"><label for="jn-ind">취급 기기</label>'+
        '<input id="jn-ind" placeholder="예: 아이폰 전 기종, 갤럭시 S 시리즈"></div>'+
      '<div class="f-r"><label for="jn-note">소개 · 경력 · 포트폴리오 주소</label>'+
        '<textarea id="jn-note" rows="5" placeholder="하신 일과 자신 있는 것을 적어 주세요."></textarea></div>'+
      AgreeBox("jn-ag","업체명 · 담당자 성함 · 연락처 · 이메일 · 취급 기기 · 지역",
               "입점 심사와 안내", "입점 종료 후 1년")+
      '<div id="jn-fail"></div>'+
      '<button class="btn btn-b btn-lg btn-full" type="submit"'+(ready?"":" disabled")+'>'+
        '입점 신청하기'+icon("arrow",18)+'</button>'+
    '</form>'+
  '</div></section>';
}

window.Field = function(id, label, ph, req, type, auto){
  return '<div class="f-r"><label for="'+esc(id)+'">'+esc(label)+(req?' <b>*</b>':'')+'</label>'+
    '<input id="'+esc(id)+'" type="'+esc(type||"text")+'"'+(req?" required":"")+
    (auto?' autocomplete="'+esc(auto)+'"':'')+
    (ph?' placeholder="'+esc(ph)+'"':'')+'></div>';
};

window.AgreeBox = function(id, what, why, how){
  return '<div class="agree">'+
    '<label class="agree-l"><input type="checkbox" id="'+esc(id)+'">'+
      '<span>개인정보 수집 · 이용에 동의합니다 <b>*</b></span></label>'+
    '<ul class="agree-u">'+
      '<li><b>수집 항목</b> '+esc(what)+'</li>'+
      '<li><b>이용 목적</b> '+esc(why)+'</li>'+
      '<li><b>보유 기간</b> '+esc(how)+'</li>'+
    '</ul>'+
    '<p class="agree-n">업체에 성함 · 연락처를 전달하는 것은 여기에 '+
      '포함되지 않습니다. 업체가 정해지면 <b>어느 업체인지 알려 드리고 '+
      '그때 다시</b> 동의를 받습니다. '+
      '<a href="/privacy">개인정보처리방침</a></p>'+
  '</div>';
};

function PageCompare(){

  var ids = String(nowQS("ids") || "").split(",")
    .map(function(x){ return x.trim(); }).filter(Boolean).slice(0, AM_CMP_MAX);
  var ps = ids.map(function(id){ return amProvider(id); }).filter(Boolean);

  if(!ps.length) return PgHero({
      crumb: Crumb([["업체찾기","/providers"],["업체 비교"]]),
      kicker:"COMPARE", h1:"업체 비교", tight:true })+
    '<section class="sec sec-white"><div class="w w-narrow">'+
      Empty({ icon:"compare", title:"비교할 업체를 아직 안 고르셨습니다",
        text:"업체찾기에서 카드의 ‘비교’ 를 눌러 두세요. " + AM_CMP_MAX +
             "곳까지 나란히 놓고 보실 수 있습니다.",
        reads: amContentsFor({ cat:"interior", side:"start", limit:3 }),
        readTitle:"업체를 고르기 전에 보시면",
        cta:'<a class="btn btn-b" href="/providers">업체찾기로'+icon("arrow",16)+'</a>'+
            '<a class="btn btn-o" href="'+esc(quoteTo({}))+'">견적부터 요청하기</a>' })+
    '</div></section>';

  var rows = [
    ["활동 지역", function(p){
      return (p.regions||[]).map(amRegionName).filter(Boolean)
        .concat(p.gu||[]).join(" · "); }],
    ["전문 서비스", function(p){ return (p.subs||[]).map(amSubName).join(" · "); }],
    ["전문 업종",   function(p){ return (p.industries||[]).map(amIndustryName).join(" · "); }],
    ["평점",        function(p){ var st = amProviderStats(p)||{};
      return st.rating != null ? st.rating + " (후기 " + st.reviews + "건)" : ""; }],
    ["포트폴리오",  function(p){ var n = (p.portfolio||[]).length;
      return n ? n + "건" : ""; }],

    ["확인",        function(p){ return amProviderVerified(p).join(" · "); }],
    ["가격 정보",   function(p){
      return (p.price||[]).map(function(x){
        return x.name + (x.from ? " " + x.from.toLocaleString() + "만원~" : ""); }).join(" · "); }],

    ["A/S",        function(p){
      return p.as ? [p.as.period, p.as.what].filter(Boolean).join(" · ") : ""; }],

    ["후기",        function(p){ var n = (p.reviews||[]).length;
      return n ? n + "건" : ""; }],
    ["시작한 해",   function(p){ return p.since ? String(p.since) : ""; }],
    ["상담 방법",   function(p){ return p.consultHours ? ("상담 가능 " + p.consultHours) : ""; }],

    ["평균 응답",   function(p){
      return p.responseHours != null ? p.responseHours + "시간 안" : ""; }]
  ].filter(function(r){ return ps.some(function(p){ return r[1](p); }); });

  return PgHero({
    crumb: Crumb([["업체찾기","/providers"],["업체 비교"]]),
    kicker:"COMPARE",
    h1:"업체 " + ps.length + "곳 비교",
    lead:"등록된 값만 나란히 놓습니다. 적지 않은 항목은 줄째 뺐습니다 — 빈 칸을 채워 보여 드리지 않습니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<div class="cmp-wrap"><table class="cmp"><thead><tr><th scope="col">항목</th>'+
      ps.map(function(p){
        return '<th scope="col"><a class="cmp-nm" href="/p/'+esc(p.id)+'">'+esc(p.name)+'</a></th>';
      }).join("")+'</tr></thead><tbody>'+
      rows.map(function(r){
        return '<tr><th scope="row">'+esc(r[0])+'</th>'+
          ps.map(function(p){
            var v = r[1](p);

            return '<td>'+(v ? esc(v) : '<em class="cmp-no">—</em>')+'</td>';
          }).join("")+'</tr>';
      }).join("")+
      '<tr><th scope="row">견적</th>'+ps.map(function(p){
        return '<td><a class="btn btn-b btn-sm" href="'+esc(quoteTo({
          sub:(p.subs||[])[0]||"", industry:(p.industries||[])[0]||"",
          region:(p.regions||[])[0]||"" }))+'">견적 요청</a></td>';
      }).join("")+'</tr>'+
    '</tbody></table></div>'+

    '<p class="sec-note">'+icon("info",15)+
      '적힌 값은 업체가 등록한 것이고, 저희가 확인하거나 보증하는 값이 아닙니다. '+
      '확인 배지는 저희가 서류로 본 항목만 붙습니다.</p>'+
  '</div></section>';
}

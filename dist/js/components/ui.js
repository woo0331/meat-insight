

window.tn = function(tone){ return tone ? (" tn-" + tone) : ""; };

window.PgHero = function(o){
  o = o || {};
  var ph = o.photo && typeof hasPhoto === "function" && hasPhoto(o.photo);
  return '<section class="pgh'+(o.tight?" pgh-tight":"")+(ph?" pgh-im-on":"")+'">'+

    (ph ? '<span class="pgh-im pgh-im-'+esc(o.photo)+'">'+
          photoBox(o.photo, "", true)+'</span>' : '')+
    '<div class="w">'+
    (o.crumb ? '<nav class="crumb" aria-label="현재 위치">'+o.crumb+'</nav>' : '')+
    (o.kicker ? '<p class="eyebrow">'+esc(o.kicker)+'</p>' : '')+
    '<h1 class="pg-h1">'+(o.h1raw || esc(o.h1||""))+'</h1>'+
    (o.lead ? '<p class="pg-lead">'+(o.leadRaw ? o.lead : esc(o.lead))+'</p>' : '')+
    (o.cta ? '<div class="row-cta">'+o.cta+'</div>' : '')+
  '</div></section>';
};

window.Crumb = function(items){
  return items.map(function(it, i){
    var last = (i === items.length - 1);
    return (i ? '<span aria-hidden="true">'+icon("chev",14)+'</span>' : '')+
      (last || !it[1] ? '<b>'+esc(it[0])+'</b>'
                      : '<a href="'+esc(it[1])+'">'+esc(it[0])+'</a>');
  }).join("");
};

window.EmptyGuide = function(o){
  o = o || {};
  var reads = (o.reads || []).filter(Boolean).slice(0, 4);
  return '<div class="emg">'+
    '<div class="emg-h">'+
      '<span class="emg-ic" aria-hidden="true">'+icon(o.icon||"search",26)+'</span>'+
      '<div>'+
        '<b>'+esc(o.title)+'</b>'+
        '<p>'+esc(o.text || "좋은 업체를 고르려면 가격보다 먼저 확인해야 할 것이 있습니다.")+'</p>'+
      '</div>'+
    '</div>'+
    (reads.length ? '<ul class="emg-l">'+reads.map(function(c){
      return '<li><a href="/content/'+esc(c.slug)+'">'+icon("book",16)+
        '<span>'+esc(c.title)+'</span>'+icon("arrow",15)+'</a></li>';
    }).join("")+'</ul>' : '')+
    '<div class="emg-f">'+

      '<p class="emg-n">'+esc(o.note || "")+'</p>'+
      (o.cta ? '<div class="emg-cta">'+o.cta+'</div>' : '')+
    '</div>'+
  '</div>';
};

window.Empty = function(o){
  o = o || {};

  var reads = (o.reads || []).filter(Boolean).slice(0, 3);
  return '<div class="empty'+(o.sm ? " empty-sm" : "")+(reads.length ? " empty-rd" : "")+'">'+
    '<span class="empty-ic" aria-hidden="true">'+icon(o.icon||"search",26)+'</span>'+
    '<b>'+esc(o.title||"아직 등록된 것이 없습니다")+'</b>'+
    (o.text ? '<p>'+esc(o.text)+'</p>' : '')+
    (reads.length
      ? '<div class="empty-rl">'+
          '<p class="empty-rh">'+esc(o.readTitle || "기다리시는 동안 먼저 보셔도 됩니다")+'</p>'+
          '<ul>'+reads.map(function(c){
            return '<li><a href="/content/'+esc(c.slug)+'">'+
              icon("book",15)+'<span>'+esc(c.title)+'</span></a></li>'; }).join("")+
        '</ul></div>'
      : '')+
    (o.cta ? '<div class="row-cta row-mid">'+o.cta+'</div>' : '')+
  '</div>';
};

window.IndustryGroupChips = function(baseTo, g){
  var G = (window.amIndGroups ? window.amIndGroups() : []);
  if(G.length < 2) return "";
  function url(k){ return baseTo + (k ? "?g=" + encodeURIComponent(k) : ""); }
  return '<ul class="chip-g chip-g-fil">'+
    '<li><a class="chip'+(g?"":" on")+'" href="'+esc(url(""))+'">업종 전체</a></li>'+
    G.map(function(x){
      return '<li><a class="chip'+(g===x.key?" on":"")+'" href="'+esc(url(x.key))+'">'+

        esc(x.name)+' '+x.inds.length+'</a></li>';
    }).join("")+'</ul>';
};

window.IndustryGrid = function(baseTo, current, g){
  var list = (window.AM_INDUSTRIES||[]);

  if(g && window.amIndGroups){
    var grp = window.amIndGroups().filter(function(x){ return x.key === g; })[0];
    if(grp) list = grp.inds;
  }
  return '<ul class="ind-g">'+list.map(function(i){
    var on = (i.key === current);
    return '<li><a class="ind'+tn(i.tone)+(on?" on":"")+'" href="'+esc(baseTo+"/"+i.key)+'"'+
      (on?' aria-current="page"':'')+'>'+
      '<span class="ind-ic">'+icon(i.icon,24)+'</span>'+
      '<b>'+esc(i.name)+'</b>'+
      '<span class="ind-l">'+esc(i.lead)+'</span></a></li>';
  }).join("")+'</ul>';
};

window.RegionSelect = function(id, val, onchange, ph, req){
  return '<select class="sel" id="'+esc(id)+'"'+
    (onchange ? ' onchange="'+esc(onchange)+'"' : '')+ (req ? " required" : "")+
    ' aria-label="지역"><option value="">'+esc(ph || "지역 전체")+'</option>'+
    (window.AM_REGIONS||[]).map(function(r){
      return '<option value="'+esc(r.key)+'"'+(r.key===val?" selected":"")+'>'+
        esc(r.name)+'</option>';
    }).join("")+'</select>';
};
window.IndustrySelect = function(id, val, onchange, ph){
  return '<select class="sel" id="'+esc(id)+'"'+
    (onchange ? ' onchange="'+esc(onchange)+'"' : '')+
    ' aria-label="업종"><option value="">'+esc(ph || "업종 전체")+'</option>'+
    (window.AM_INDUSTRIES||[]).map(function(i){
      return '<option value="'+esc(i.key)+'"'+(i.key===val?" selected":"")+'>'+
        esc(i.name)+'</option>';
    }).join("")+'</select>';
};

window.catTo = function(c){
  if(c.to) return c.to;
  return (c.kind === "provider") ? ("/providers/" + c.key) : ("/c/" + c.key);
};
window.CatCard = function(c, industryKey, qs){
  var items = amCatItems(c, industryKey).slice(0, 5);
  var more  = amCatItems(c, industryKey).length - items.length;

  var base = catTo(c), qa = [];
  if(industryKey) qa.push('i='+encodeURIComponent(industryKey));
  if(qs) qa.push(qs);
  var href = base + (qa.length ? (base.indexOf("?") >= 0 ? "&" : "?")+qa.join("&") : "");
  return '<a class="cat'+tn(c.tone)+'" href="'+esc(href)+'" data-rv>'+

    '<span class="cat-ic'+(hasIconArt(c.key) ? " cat-ic-a" : "")+'">'+
      (hasIconArt(c.key) ? iconArt(c.key, 34) : icon(c.icon,22))+'</span>'+
    '<b>'+esc(c.name)+'</b>'+
    '<span class="cat-l">'+esc(c.lead)+'</span>'+
    (items.length ? '<span class="cat-s">'+items.map(function(i){
        return '<em>'+esc(i.name)+'</em>'; }).join("")+
      (more > 0 ? '<em class="cat-s-more">외 '+more+'</em>' : '')+'</span>' : '')+
    '<span class="cat-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
  '</a>';
};

window.ProviderCard = function(p){
  var s = amProviderStats(p) || {};

  var badges = amProviderBadges(p);
  var subs   = (p.subs||[]).map(amSubName).filter(Boolean);
  var inds   = (p.industries||[]).map(amIndustryName).filter(Boolean);
  var regs   = (p.regions||[]).map(amRegionName).filter(Boolean);
  var folio  = (p.portfolio||[]);
  var cover  = p.cover || (folio[0] && folio[0].after) || "";

  var ex = !!p.sample;
  var to = ex ? "/sample" : ("/p/" + encodeURIComponent(p.id));
  var A  = function(cls, label, extra){
    return '<a class="'+cls+'" href="'+esc(to)+'"'+(extra||"")+'>'+label+'</a>';
  };

  var marks = [];
  if((p.price||[]).length)  marks.push(["won","가격 안내 있음"]);
  if(folio.length)          marks.push(["camera","포트폴리오 "+folio.length+"건"]);
  if(p.as && (p.as.period || p.as.what)) marks.push(["shield","A/S 안내 있음"]);

  var ph = cover
    ? '<img class="ph" src="'+esc(cover)+'" alt="'+esc(p.name)+' 작업 사진" loading="lazy" decoding="async">'
    : "";
  return '<div class="pv'+(ex ? " pv-ex" : "")+(ph ? "" : " nph")+'">'+
    (!ph ? ""
      : ex ? '<span class="pv-ph">'+ph+'</span>'
           : A("pv-ph", ph, ' tabindex="-1" aria-hidden="true"'))+
    '<div class="pv-b">'+
      '<p class="pv-t">'+
        (ex ? '<b>'+esc(p.name)+'</b>' : A("pv-nm", '<b>'+esc(p.name)+'</b>'))+
        (ex ? '<em class="pv-smp">SAMPLE</em>' : '')+
        badges.map(function(bd){
          return '<em class="pv-vf">'+icon("check",13)+esc(bd)+'</em>'; }).join("")+
      '</p>'+
      '<p class="pv-m">'+
        esc(regs.join(" · ") || "지역 미등록")+
        (inds.length ? ' · '+esc(inds.join(" · ")) : '')+
      '</p>'+
      (subs.length ? '<p class="pv-sv">'+subs.slice(0,4).map(function(n){
          return '<span>'+esc(n)+'</span>'; }).join("")+
          (subs.length > 4 ? '<em>외 '+(subs.length-4)+'</em>' : '')+'</p>' : '')+
      (s.rating !== null && s.rating !== undefined
        ? '<p class="pv-r">'+icon("star",14)+'<b>'+esc(String(s.rating))+'</b>'+
          '<em>후기 '+s.reviews+'</em>'+(s.jobs ? '<em>작업 '+s.jobs+'</em>' : '')+'</p>'
        : '<p class="pv-r pv-r-none">아직 후기가 없습니다</p>')+
      (p.intro ? '<p class="pv-i">'+esc(p.intro)+'</p>' : '')+
      (marks.length ? '<p class="pv-mk">'+marks.map(function(m){
          return '<span>'+icon(m[0],14)+esc(m[1])+'</span>'; }).join("")+'</p>' : '')+
      '<p class="pv-act">'+
        (ex
          ? '<span class="btn btn-o btn-sm pv-act-x">예시 화면입니다</span>'
          : A("btn btn-b btn-sm", '상세보기')+
            '<a class="btn btn-o btn-sm" href="'+esc(quoteTo({
              sub:(p.subs||[])[0]||"", industry:(p.industries||[])[0]||"",
              region:(p.regions||[])[0]||"" }))+'">견적 요청</a>')+
      '</p>'+
    '</div>'+
  '</div>';
};

window.AM_CMP_MAX = 3;

window.amCmpIds = function(){
  return String(nowQS("cmp") || "").split(",")
    .map(function(x){ return x.trim(); })
    .filter(Boolean).slice(0, AM_CMP_MAX);
};

window.cmpToggle = function(id){
  var ids = amCmpIds(), i = ids.indexOf(id);
  if(i >= 0) ids.splice(i, 1);
  else {

    if(ids.length >= AM_CMP_MAX){
      toast(AM_CMP_MAX + "곳까지 나란히 놓을 수 있습니다. 하나를 빼고 담아 주세요.");

      render();
      return;
    }
    ids.push(id);
  }
  var qs = new URLSearchParams(location.search);
  if(ids.length) qs.set("cmp", ids.join(","));
  else qs.delete("cmp");
  var q = qs.toString();
  go(nowPath() + (q ? "?" + q : ""), { keepScroll:true });
};

window.ProviderPickCard = function(p){
  var ids = amCmpIds(), on = ids.indexOf(p.id) >= 0;
  return '<div class="pv-w'+(on ? " on" : "")+'">'+
    ProviderCard(p)+
    '<label class="pv-ck">'+
      '<input type="checkbox"'+(on ? " checked" : "")+
        ' onchange="cmpToggle(\''+esc(p.id)+'\')"'+
        ' aria-label="'+esc(p.name)+' 비교에 담기">'+
      '<span>비교</span>'+
    '</label>'+
  '</div>';
};

window.CmpBar = function(){
  var ids = amCmpIds();
  if(!ids.length) return "";
  var names = ids.map(function(id){
    var p = amProvider(id); return p ? p.name : null; }).filter(Boolean);
  if(!names.length) return "";
  return '<div class="cmp-bar" role="status"><div class="w cmp-bar-in">'+
    '<span class="cmp-bar-n"><b>'+names.length+'곳</b> 담았습니다</span>'+
    '<span class="cmp-bar-l">'+esc(names.join(" · "))+'</span>'+
    '<a class="btn btn-b" href="/compare?ids='+esc(ids.join(","))+'">'+
      '업체 비교하기'+icon("arrow",16)+'</a>'+
  '</div></div>';
};

window.AM_SAVE_KEY = "am.saved.v1";

window.amSaved = function(){
  var v = amGet(AM_SAVE_KEY, []);
  return Array.isArray(v) ? v : [];
};
window.amIsSaved = function(id){ return amSaved().indexOf(id) >= 0; };
window.saveToggle = function(id){
  var l = amSaved(), i = l.indexOf(id);
  if(i >= 0){ l.splice(i, 1); toast("관심 업체에서 뺐습니다"); }
  else { l.push(id); toast("관심 업체에 담았습니다 — MY 에서 보실 수 있습니다"); }
  amSet(AM_SAVE_KEY, l);
  rerender(true);
};

window.quoteTo = function(o){
  o = o || {};
  var q = [];
  if(o.cat)      q.push("c="+encodeURIComponent(o.cat));
  if(o.sub)      q.push("s="+encodeURIComponent(o.sub));
  if(o.industry) q.push("i="+encodeURIComponent(o.industry));
  if(o.region)   q.push("r="+encodeURIComponent(o.region));
  if(o.side)     q.push("side="+encodeURIComponent(o.side));

  if(o.bud)      q.push("bud="+encodeURIComponent(o.bud));
  if(o.when)     q.push("when="+encodeURIComponent(o.when));

  if(o.py)       q.push("py="+encodeURIComponent(o.py));

  if(o.offers && o.offers.length)
    q.push("o="+encodeURIComponent([].concat(o.offers).join(",")));
  if(o.pack)     q.push("pk="+encodeURIComponent(o.pack));
  return "/quote" + (q.length ? "?" + q.join("&") : "");
};

window.amGet = function(key, dflt){
  try{ var v = localStorage.getItem(key); return v ? JSON.parse(v) : dflt; }
  catch(e){ return dflt; }
};
window.amSet = function(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
};
window.amDel = function(key){ try{ localStorage.removeItem(key); }catch(e){} };

window.ReadBand = function(o){
  o = o || {};
  var list = (window.amContentsFor ? amContentsFor(o) : []);
  if(!list.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">먼저 읽어 두시면</p>'+
      '<h2>'+esc(o.title || "여기서 자주 막히는 것")+'</h2>'+
    '</div>'+
    '<ul class="rd-l">'+list.map(function(c){
      return '<li><a href="/content/'+esc(c.slug)+'">'+
        '<span class="rd-m">'+esc(c.side === "close" ? "폐업" : "창업")+
          (c.read ? ' · '+esc(String(c.read))+'분' : '')+'</span>'+
        '<b>'+esc(c.title)+'</b>'+
        '<span class="rd-p">'+esc(c.lead)+'</span>'+
        '<span class="rd-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
    '<div class="row-cta"><a class="btn btn-o" href="/content">'+
      '창업 · 폐업 정보 전부 보기'+icon("arrow",16)+'</a></div>'+
  '</div></section>';
};

window.AM_PAGE = 24;

window.amShown = function(total){
  var n = parseInt(nowQS("n"), 10);
  if(!(n > 0)) n = AM_PAGE;
  return Math.min(Math.max(n, AM_PAGE), total);
};

function amPageHref(n){
  var qs = (location.search || "").replace(/^\?/, "")
    .split("&").filter(function(kv){ return kv && kv.indexOf("n=") !== 0; });
  qs.push("n=" + n);
  return nowPath() + "?" + qs.join("&");
};

window.MoreBtn = function(total){
  var n = amShown(total);
  if(n >= total) return "";
  var rest = total - n;
  var step = Math.min(AM_PAGE, rest);

  return '<p class="row-cta row-mid"><a class="btn btn-o" rel="nofollow" data-keep href="'+
    esc(amPageHref(n + step))+'">'+step+'건 더 보기'+icon("arrow",16)+
    '<em class="more-n">'+n+' / '+total+'</em></a></p>';
};

window.FitCard = function(c, industryKey){
  var all  = (window.amCatItems ? amCatItems(c, industryKey) : []);
  var some = all.slice(0, 3).map(function(i){ return i.name; });
  return '<a class="fit'+tn(c.tone)+'" href="'+esc(catTo(c))+
    (industryKey ? '?i='+encodeURIComponent(industryKey) : '')+'">'+
    '<span class="fit-ic">'+icon(c.icon,24)+'</span>'+
    '<span class="fit-b">'+

      '<b><span class="fit-nm">'+esc(c.name)+'</span>'+
        (all.length ? '<em class="fit-n">'+all.length+'</em>' : '')+'</b>'+

      (some.length ? '<i>'+esc(some.join(" · "))+
        (all.length > some.length ? ' 외 '+(all.length-some.length) : '')+'</i>'
        : (c.lead ? '<i>'+esc(c.lead)+'</i>' : ''))+
    '</span>'+
  '</a>';
};

window.FoldBtn = function(id, shut, open){
  return '<button class="fld-b" type="button" aria-expanded="false" '+
      'aria-controls="'+esc(id)+'" '+
      'data-shut="'+esc(shut)+'" data-open="'+esc(open || "접기")+'" '+
      'onclick="foldToggle(\''+esc(id)+'\',this)">'+
    '<span>'+esc(shut)+'</span>'+ icon("chevd", 16) +'</button>';
};

window.FoldAll = function(id, shut, open, cls, opened){
  cls = cls || "is-fold-all";

  return '<button class="fld-b fld-all'+(opened ? " is-open" : "")+'" type="button" aria-expanded="'+(opened ? "true" : "false")+'" '+
      'aria-controls="'+esc(id)+'" '+
      'data-shut="'+esc(shut)+'" data-open="'+esc(open || "접기")+'" '+
      'onclick="foldToggle(\''+esc(id)+'\',this,\''+esc(cls)+'\')">'+
    '<span>'+esc(opened ? (open || "접기") : shut)+'</span>'+ icon("chevd", 16) +'</button>';
};

window.foldToggle = function(id, btn, cls){
  cls = cls || "is-fold";
  var el = document.getElementById(id);
  if(!el || !btn) return;
  var shut = el.classList.toggle(cls);
  btn.setAttribute("aria-expanded", shut ? "false" : "true");
  var t = btn.querySelector("span");
  if(t) t.textContent = shut ? (btn.getAttribute("data-shut") || "더 보기")
                             : (btn.getAttribute("data-open") || "접기");
  btn.classList.toggle("is-open", !shut);
};

window.PackBand = function(side, tone){
  var L = (typeof amPackagesFor === "function") ? amPackagesFor(side) : [];
  if(!L.length) return "";
  return '<section class="sec '+esc(tone || "sec-gray")+' pkg"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">ONE REQUEST</p>'+
      '<h2>여러 개가 필요하시면<br class="br-m"> 묶어서 한 번에 신청하세요</h2>'+
      '<p>일정이 서로 물려 있는 것들입니다. 따로 알아보시면 공사가 끝나고도 '+
        '며칠을 더 기다리게 됩니다.</p>'+
    '</div>'+
    '<ul class="pkg-g">'+L.map(PackCard).join("")+'</ul>'+

    '<p class="sec-note">'+icon("info",15)+
      ' 묶어서 신청하셔도 <b>상품마다 업체와 계약은 따로</b>입니다. '+
      '한 번만 적으시면 저희가 서비스마다 나눠서 확인합니다.</p>'+
  '</div></section>';
};

window.PackCard = function(p){
  var items = (typeof amPackageItems === "function") ? amPackageItems(p.key) : [];
  if(!items.length) return "";
  return '<li class="tn-'+esc(p.tone || "t7")+'"><div class="pkg-c" data-pk="'+esc(p.key)+'">'+
    '<div class="pkg-h">'+
      '<span class="ic-t">'+icon(p.icon, 24)+'</span>'+
      '<div class="pkg-ht"><b>'+esc(p.name)+'</b><i>'+esc(p.lead)+'</i></div>'+
    '</div>'+
    '<p class="pkg-d">'+esc(p.desc || "")+'</p>'+

    FoldBtn("pkg-l-"+p.key, "상품 " + items.length + "개 보기", "상품 접기")+
    '<ul class="pkg-l is-fold" id="pkg-l-'+esc(p.key)+'">'+items.map(function(o){
      var id = "pk-"+p.key+"-"+o.id;
      return '<li><label class="pkg-ck" for="'+esc(id)+'">'+
        '<input type="checkbox" id="'+esc(id)+'" checked '+
          'data-pkg="'+esc(p.key)+'" value="'+esc(o.id)+'" '+
          'onchange="packSync(\'' + esc(p.key) + '\')">'+
        '<span class="pkg-nm">'+esc(o.name)+'</span>'+
      '</label></li>'; }).join("")+'</ul>'+
    '<p class="pkg-go">'+
      '<a class="btn btn-b" id="pkg-go-'+esc(p.key)+'" '+
        'href="'+esc(quoteTo({ pack:p.key, offers:items.map(function(o){ return o.id; }),
                               side:(p.side === "both" ? "" : p.side) }))+'">'+

        '<span id="pkg-n-'+esc(p.key)+'">'+items.length+'개 묶어서 상담 신청</span>'+
        icon("arrow",17)+'</a></p>'+
  '</div></li>';
};

window.packSync = function(key){
  var box = document.querySelector('.pkg-c[data-pk="'+key+'"]');
  var go  = document.getElementById("pkg-go-"+key);
  var n   = document.getElementById("pkg-n-"+key);
  if(!box || !go) return;
  var on = [].slice.call(box.querySelectorAll('input[type="checkbox"]'))
    .filter(function(c){ return c.checked; }).map(function(c){ return c.value; });
  var p = (typeof amPackage === "function") ? amPackage(key) : null;
  if(n) n.textContent = on.length + "개 묶어서 상담 신청";
  if(!on.length){
    go.setAttribute("aria-disabled", "true");
    go.removeAttribute("href");
  }else{
    go.removeAttribute("aria-disabled");
    go.setAttribute("href", quoteTo({ pack:key, offers:on,
      side:(p && p.side !== "both") ? p.side : "" }));
  }
};

window.HallCalcBand = function(o){
  o = o || {};
  var by = {}; (window.AM_TOOLS || []).forEach(function(t){ by[t.key] = t; });
  var L = (o.keys || []).map(function(k){ return by[k]; }).filter(Boolean);
  if(!L.length) return "";
  var tones = o.tones || {};
  return '<section class="sec sec-calc'+(o.cls ? " "+esc(o.cls) : "")+'"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">'+esc(o.kicker || "무료 계산도구")+'</p>'+
      '<h2>'+esc(o.title || "숫자를 먼저 보고 정하세요")+'</h2>'+
      '<p>'+esc(o.lead ||
        "가입 없이 바로 쓰실 수 있습니다. 적으신 값은 저장하지 않습니다.")+'</p>'+
    '</div>'+
    '<ul class="mcal-g">'+L.map(function(t){
      var art = (typeof hasIconArt === "function" && hasIconArt(t.icon));
      return '<li class="tn-'+esc(tones[t.key] || "sv1")+'">'+
        '<a href="/tools/'+esc(t.key)+'">'+
        '<span class="mcal-i ia-t" aria-hidden="true">'+
          (art ? iconArt(t.icon, 44) : icon(t.icon, 28))+'</span>'+
        '<b class="mcal-n">'+esc(t.name)+'</b>'+

        ((window.AM_TOOL_IN || {})[t.key] ? '<span class="mcal-io"><span><em>넣는 값</em>'+esc(AM_TOOL_IN[t.key])+'</span>'+
          (t.out ? '<span><em>얻는 결과</em>'+esc(t.out)+'</span>' : '')+'</span>' :
          (t.out ? '<i class="mcal-o">'+esc(t.out)+'</i>' : ''))+
        '<span class="mcal-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
      '</a></li>'; }).join("")+'</ul>'+
    '<div class="row-cta">'+
      '<a class="btn btn-o" href="/tools">계산도구 전부 보기'+icon("arrow",16)+'</a>'+
      '<a class="btn btn-o" href="/faq">자주 묻는 질문</a>'+
    '</div>'+
  '</div></section>';
};

function ctaF(o){ return (o && o.ctaForm) ? ' data-cta-form="'+esc(o.ctaForm)+'"' : ""; }

window.ctaPair = function(form, on, off){
  var f = ' data-cta-form="'+esc(form || "quote")+'"';
  return '<span data-cta="on"'+f+' hidden>'+esc(on)+'</span><span data-cta="off"'+f+'>'+esc(off)+'</span>';
};

window.hhFlowArt = function(a, la, b, lb){
  var ia = function(n){ return (typeof hasIconArt === "function" && hasIconArt(n)) ? iconArt(n, 96) : icon(n, 56); };
  return '<span class="wp-pa">'+
    '<span class="wp-pa-c">'+ia(a)+'<i>'+esc(la)+'</i></span>'+
    '<span class="wp-pa-x">'+icon("arrow",28)+'</span>'+
    '<span class="wp-pa-c">'+ia(b)+'<i>'+esc(lb)+'</i></span>'+
  '</span>';
};

window.hhJump = function(id){
  var sec = document.getElementById(id);
  if(!sec) return true;
  sec.scrollIntoView({ behavior:"auto", block:"start" });
  var h = sec.querySelector("h2"); if(h){ h.setAttribute("tabindex","-1"); try{ h.focus({preventScroll:true}); }catch(e){} }
  return false;
};

window.hhGoJump = function(path, id){
  if(typeof go !== "function") return true;
  go(path);
  setTimeout(function(){ hhJump(id); }, 0);
  return false;
};
window.HallHero = function(o){
  o = o || {};
  var ph = o.photo && typeof hasPhoto === "function" && hasPhoto(o.photo);
  var checks = (o.checks || []).map(function(c){
    return '<li><span class="hh-ci" aria-hidden="true">'+icon(c[0] || "check", 20)+'</span>'+
      '<span>'+esc(c[1])+'</span></li>';
  }).join("");

  var art = !ph && o.art ? o.art : "";
  return '<section class="pgh hh hh-'+esc(o.side || "start")+(ph ? ' hh-im-on' : '')+(art ? ' hh-art-on' : '')+
    (o.qfirst && o.quick && o.quick.length ? ' hh-qfirst' : '')+'">'+
    (ph ? '<span class="hh-ph pgh-im-'+esc(o.photo)+'">'+
          photoBox(o.photo, "", true, "(max-width:900px) 100vw, 62vw")+'</span>' : '')+
    (art ? '<span class="hh-ph hh-art" aria-hidden="true">'+art+'</span>' : '')+
    '<div class="w hh-in">'+
      '<div class="hh-tx">'+
        (o.crumb ? '<nav class="crumb" aria-label="현재 위치">'+o.crumb+'</nav>' : '')+
        (o.kicker ? '<p class="hh-k">'+esc(o.kicker)+'</p>' : '')+
        '<h1 class="pg-h1 hh-h1">'+(o.h1raw || esc(o.h1 || ""))+'</h1>'+

        (o.leadHtml ? '<p class="pg-lead hh-lead">'+o.leadHtml+'</p>' : '')+
        (!o.leadHtml && o.lead ? '<p class="pg-lead hh-lead">'+(o.leadM
          ? '<span class="hh-lead-l">'+esc(o.lead)+'</span><span class="hh-lead-m">'+esc(o.leadM)+'</span>'
          : esc(o.lead))+'</p>' : '')+
        '<div class="row-cta hh-cta">'+
          '<a class="btn btn-lg hh-go" href="/intake" data-cta="off"'+ctaF(o)+'>'+
            '접수 안내 보기'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-lg hh-go" href="'+esc(o.quote || "/quote")+'" data-cta="on"'+ctaF(o)+' hidden>'+
            esc(o.goName || "상담 신청하기")+icon("arrow",18)+'</a>'+
          (o.second ? o.second : '')+
        '</div>'+
      '</div>'+

      (o.quick && o.quick.length
        ? '<div class="hh-card hh-quick"><p class="hh-card-t">'+esc(o.cardTitle || "바로 가기")+'</p>'+
          '<ul class="hh-ql">'+o.quick.map(function(q){
            function a(href, go, attr){

              var jump = href.charAt(0) === "#" ? ' onclick="return hhJump(\''+esc(href.slice(1))+'\')"' : "";
              return '<a class="hh-qa" href="'+esc(href)+'"'+jump+(attr || "")+'>'+
                '<span class="hh-ci" aria-hidden="true">'+icon(q.ic || "arrow", 20)+'</span>'+
                '<span class="hh-qt"><b>'+esc(q.b)+'</b>'+
                  (q.d ? '<small class="hh-qd">'+esc(q.d)+'</small>' : '')+
                  '<i>'+esc(go)+'</i></span>'+icon("chev",16)+'</a>';
            }
            return '<li>'+(q.on
              ? a(q.on, q.goOn || q.go, ' data-cta="on" data-cta-form="'+esc(q.form || "close")+'" hidden')+
                a(q.href, q.go, ' data-cta="off" data-cta-form="'+esc(q.form || "close")+'"')
              : a(q.href, q.go))+'</li>';
          }).join("")+'</ul></div>'
        : (checks ? '<div class="hh-card"><p class="hh-card-t">'+esc(o.cardTitle || "이 화면에서 하실 수 있는 것")+'</p>'+
        '<ul class="hh-cl">'+checks+'</ul></div>' : ''))+
    '</div>'+
  '</section>';
};

window.HallSteps = function(o){
  o = o || {};
  var S = (window.AM_STEPS || []);
  if(!S.length) return "";
  return '<section class="sec sec-white hst"><div class="w hst-in">'+
    '<div class="hst-hd"><h2>'+esc(o.title || "상담 신청은 이렇게 진행됩니다")+'</h2>'+
      '<p>'+ctaPair(o.ctaForm || "quote",
        "서비스를 고르시고 한 번만 적어 보내시면 운영자가 확인합니다. 업체에 연락처를 전하기 전에는 따로 동의를 여쭙니다.",
        "접수가 열리면 이 순서로 진행합니다. 지금은 접수를 받지 않아, 접수 방법은 접수 안내에서 확인하실 수 있습니다.")+'</p></div>'+
    '<ol class="hst-g">'+S.map(function(s, i){
      return '<li><span class="hst-n">'+(i+1)+'</span>'+
        '<span class="hst-i" aria-hidden="true">'+icon(s.ic || "check", 26)+'</span>'+
        '<b>'+esc(s.n || "")+'</b></li>';
    }).join("")+'</ol>'+
    '<div class="hst-go">'+
      '<a class="btn btn-lg hh-go" href="/intake" data-cta="off"'+ctaF(o)+'>접수 안내 보기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-lg hh-go" href="'+esc(o.quote || "/quote")+'" data-cta="on"'+ctaF(o)+' hidden>'+
        esc(o.goName || "상담 신청하기")+icon("arrow",18)+'</a>'+
    '</div>'+
  '</div></section>';
};

function kxPh(key, sz){
  return (key && typeof hasPhoto === "function" && hasPhoto(key))
    ? photoBox(key, "", false, sz || "(max-width:900px) 92vw, 46vw") : "";
}
function kxHd(o){
  return '<div class="kx-hd">'+
    (o.kicker ? '<p class="kx-k">'+esc(o.kicker)+'</p>' : '')+
    '<h2 class="kx-h">'+esc(o.title || "")+'</h2>'+
    (o.lead ? '<p class="kx-lead">'+esc(o.lead)+'</p>' : '')+
  '</div>';
}

window.KxServices = function(o){
  o = o || {};
  var L = (o.items || []).filter(function(x){ return x && x.href; });
  if(!L.length) return "";
  return '<section class="sec '+esc(o.tone || "sec-white")+' kx kx-svc"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="w">'+
    kxHd(o)+
    '<ul class="kx-svc-g">'+L.map(function(x){
      var ph = kxPh(x.ph, "(max-width:600px) 46vw, (max-width:1100px) 30vw, 300px");
      var art = (typeof hasIconArt === "function" && hasIconArt(x.ia)) ? iconArt(x.ia, 64) : icon(x.ic || "grid", 40);
      return '<li><a class="kx-svc-c'+(ph ? ' kx-on' : '')+'" href="'+esc(x.href)+'">'+
        '<span class="kx-svc-ph" aria-hidden="true">'+(ph || '<span class="kx-svc-art">'+art+'</span>')+'</span>'+
        '<span class="kx-svc-tx"><b>'+esc(x.n)+'</b>'+(x.d ? '<small>'+esc(x.d)+'</small>' : '')+
        '<i>자세히 보기'+icon("chev",14)+'</i></span></a></li>';
    }).join("")+'</ul>'+
    (o.note ? '<p class="kx-note">'+esc(o.note)+'</p>' : '')+
  '</div></section>';
};

window.KxProcess = function(o){
  o = o || {};
  var S = o.steps || []; if(!S.length) return "";
  var ph = kxPh(o.photo);
  return '<section class="sec '+esc(o.tone || "sec-ivory")+' kx kx-pro'+(ph ? ' kx-on' : '')+(o.cls ? ' '+esc(o.cls) : '')+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="w kx-split">'+
    (ph ? '<div class="kx-fig" aria-hidden="true">'+ph+'</div>' : '')+
    '<div class="kx-body">'+kxHd(o)+
      '<ol class="kx-pro-l">'+S.map(function(s, i){
        return '<li><span class="kx-n" aria-hidden="true">'+String(i+1).padStart(2,"0")+'</span>'+
          '<span class="kx-pro-tx"><b>'+esc(s[0])+'</b>'+(s[1] ? '<small>'+esc(s[1])+'</small>' : '')+'</span></li>';
      }).join("")+'</ol>'+
      (o.foot ? '<p class="kx-note">'+esc(o.foot)+'</p>' : '')+
      (o.more || '')+
    '</div></div></section>';
};

window.KxCalc = function(o){
  o = o || {};
  var ph = kxPh(o.photo);
  var B = (o.btns || []).filter(function(b){ return b && b.href; });
  return '<section class="sec '+esc(o.tone || "sec-white")+' kx kx-calc'+(ph ? ' kx-on' : '')+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="w kx-split kx-rev">'+
    '<div class="kx-body">'+kxHd(o)+
      (o.list && o.list.length ? '<ul class="kx-ck">'+o.list.map(function(t){
        return '<li><span aria-hidden="true">'+icon("check",18)+'</span><span>'+esc(t)+'</span></li>'; }).join("")+'</ul>' : '')+
      (B.length ? '<div class="row-cta kx-go">'+B.map(function(b, i){
        var jump = b.href.charAt(0) === "#" ? ' onclick="return hhJump(\''+esc(b.href.slice(1))+'\')"' : "";
        return '<a class="btn btn-lg '+(i ? 'btn-o' : 'btn-b')+'" href="'+esc(b.href)+'"'+jump+'>'+(b.ic ? icon(b.ic,18)+' ' : '')+esc(b.t)+'</a>'; }).join("")+'</div>' : '')+
      (o.note ? '<p class="kx-note kx-warn">'+icon("info",16)+'<span>'+esc(o.note)+'</span></p>' : '')+
    '</div>'+
    (ph ? '<div class="kx-fig" aria-hidden="true">'+ph+'</div>' : '')+
  '</div></section>';
};

window.KxCta = function(o){
  o = o || {};
  var ph = kxPh(o.photo, "(max-width:900px) 92vw, 40vw");
  return '<section class="sec '+esc(o.tone || "sec-ivory")+' kx kx-cta"><div class="w">'+
    '<div class="kx-cta-c'+(ph ? ' kx-on' : '')+'">'+
      '<div class="kx-cta-tx">'+
        (o.kicker ? '<p class="kx-k">'+esc(o.kicker)+'</p>' : '')+
        '<h2 class="kx-h">'+esc(o.title || "")+'</h2>'+
        (o.lead ? '<p class="kx-lead">'+esc(o.lead)+'</p>' : '')+
        '<div class="row-cta kx-go">'+
          '<a class="btn btn-lg btn-b" href="/intake" data-cta="off"'+ctaF(o)+'>접수 안내 보기'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-lg btn-b" href="'+esc(o.quote || "/quote")+'" data-cta="on"'+ctaF(o)+' hidden>'+esc(o.goName || "무료 상담 신청하기")+icon("arrow",18)+'</a>'+
          (o.second ? '<a class="btn btn-lg btn-o" href="'+esc(o.second.href)+'">'+esc(o.second.t)+'</a>' : '')+
        '</div>'+
      '</div>'+
      (ph ? '<div class="kx-cta-ph" aria-hidden="true">'+ph+'</div>' : '')+
    '</div></div></section>';
};

window.kxSvc = function(cat, sub, n, d, ia, ph){
  var c = (window.AM_CATS || []).filter(function(x){ return x.key === cat; })[0];
  if(!c) return null;
  if(sub && !(c.items || []).some(function(i){ return i.key === sub; })) return null;
  var base = catTo(c);
  var href = sub ? base + (base.indexOf("?") >= 0 ? "&" : "?") + "s=" + encodeURIComponent(sub) : base;
  return { n:n || c.name, d:d || "", href:href, ia:ia || cat, ph:ph || "" };
};

function kpPh(key, sz){ return (key && typeof hasPhoto === "function" && hasPhoto(key)) ? photoBox(key, "", false, sz || "(max-width:600px) 46vw, 300px") : ""; }
function kpArt(ia, ic){ return '<span class="kp-art">'+((typeof hasIconArt === "function" && hasIconArt(ia)) ? iconArt(ia, 72) : icon(ic || "grid", 44))+'</span>'; }
function kpJump(href){ return href && href.charAt(0) === "#" ? ' onclick="return hhJump(\''+esc(href.slice(1))+'\')"' : ""; }
function kpKicker(t){ return t ? '<p class="kp-k">'+esc(t)+'</p>' : ""; }

window.KpServices = function(o){
  var L = (o.items || []).filter(function(x){ return x && x.href; });
  if(!L.length) return "";
  return '<section class="sec '+esc(o.tone || "sec-white")+' kp kp-svc'+(o.cls ? ' '+esc(o.cls) : '')+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="w kp-svc-in">'+
    '<div class="kp-hd">'+kpKicker(o.kicker || "SERVICE")+'<h2 class="kp-h">'+(o.titleHtml || esc(o.title))+'</h2>'+(o.lead ? '<p class="kp-lead">'+esc(o.lead)+'</p>' : '')+'</div>'+
    '<ul class="kp-svc-g">'+L.map(function(x){
      var ph = kpPh(x.ph);
      return '<li><a class="kp-c" href="'+esc(x.href)+'"'+kpJump(x.href)+'>'+
        '<span class="kp-ph" aria-hidden="true">'+(ph || kpArt(x.ia, x.ic))+'</span>'+
        '<span class="kp-tx"><b>'+esc(x.n)+'</b><small>'+esc(x.d || "")+'</small></span>'+
        '<span class="kp-go" aria-hidden="true">'+icon("arrow",16)+'</span></a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
};

window.KpProcess = function(o){
  var S = o.steps || []; if(!S.length) return "";
  return '<section class="sec '+esc(o.tone || "sec-ivory")+' kp kp-pro'+(o.cls ? ' '+esc(o.cls) : '')+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="w">'+
    '<div class="kp-pro-hd"><div>'+kpKicker(o.kicker || "PROCESS")+'<h2 class="kp-h">'+esc(o.title)+'</h2></div>'+
      (o.lead ? '<p class="kp-lead">'+esc(o.lead)+'</p>' : '')+
      (o.moreHtml ? '<span class="kp-more">'+o.moreHtml+'</span>' : o.more ? '<a class="btn btn-o kp-more" href="'+esc(o.more.href)+'"'+kpJump(o.more.href)+'>'+esc(o.more.t)+icon("chev",15)+'</a>' : '')+
    '</div>'+
    '<ol class="kp-pro-g">'+S.map(function(s, i){
      var ph = kpPh(s.ph), inner =
        '<span class="kp-ph" aria-hidden="true">'+(ph || kpArt(s.ia, s.ic))+'</span>'+
        '<span class="kp-n" aria-hidden="true">'+String(i+1).padStart(2,"0")+'</span>'+
        '<span class="kp-tx"><b>'+esc(s.n)+'</b><small>'+esc(s.d || "")+'</small></span>';
      return '<li>'+(s.href ? '<a class="kp-c" href="'+esc(s.href)+'"'+kpJump(s.href)+'>'+inner+'<span class="kp-go" aria-hidden="true">'+icon("chev",16)+'</span></a>' : '<div class="kp-c">'+inner+'</div>')+'</li>';
    }).join("")+'</ol>'+(o.after || '')+
  '</div></section>';
};

window.KpBanner = function(o){
  var ph = kpPh(o.photo, "(max-width:900px) 100vw, 60vw");
  return '<section class="sec-calc kp kp-ban'+(ph ? ' kp-on' : '')+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'>'+
    (ph ? '<span class="kp-ban-ph" aria-hidden="true">'+ph+'</span>' : '')+
    '<div class="w kp-ban-in"><div class="kp-ban-tx">'+kpKicker(o.kicker)+
      '<h2 class="kp-h">'+(o.titleHtml || esc(o.title))+'</h2>'+
      (o.lead ? '<p class="kp-lead">'+esc(o.lead)+'</p>' : '')+
      '<div class="row-cta kp-ban-go">'+(o.btns || []).map(function(b, i){
        return '<a class="btn btn-lg '+(i ? 'kp-btn-o' : 'kp-btn')+'" href="'+esc(b.href)+'"'+kpJump(b.href)+'>'+(b.ic ? icon(b.ic,18)+' ' : '')+esc(b.t)+icon("chev",16)+'</a>'; }).join("")+'</div>'+
      (o.note ? '<p class="kp-ban-n">'+icon("info",15)+'<span>'+esc(o.note)+'</span></p>' : '')+
    '</div>'+
    (o.card ? '<div class="kp-ban-card"><p>'+esc(o.card.title)+'</p><ul>'+o.card.list.map(function(t){ return '<li>'+icon("check",16)+'<span>'+esc(t)+'</span></li>'; }).join("")+'</ul></div>' : '')+
  '</div></section>';
};

window.KpCards = function(o){
  var L = (o.items || []).filter(function(x){ return x && x.href; });
  if(!L.length) return "";
  return '<section class="sec '+esc(o.tone || "sec-white")+' kp kp-cards'+(o.cls ? ' '+esc(o.cls) : '')+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="w kp-svc-in">'+
    '<div class="kp-hd">'+kpKicker(o.kicker)+'<h2 class="kp-h">'+esc(o.title)+'</h2>'+(o.lead ? '<p class="kp-lead">'+esc(o.lead)+'</p>' : '')+
      (o.more ? '<a class="btn btn-o kp-more" href="'+esc(o.more.href)+'"'+kpJump(o.more.href)+'>'+esc(o.more.t)+icon("chev",15)+'</a>' : '')+'</div>'+
    '<ul class="kp-svc-g'+(L.length === 3 ? ' kp-g3' : '')+'">'+L.map(function(x){
      var ph = kpPh(x.ph), ext = /^https?:/.test(x.href);
      return '<li><a class="kp-c" href="'+esc(x.href)+'"'+(ext ? ' target="_blank" rel="noopener"' : kpJump(x.href))+'>'+
        '<span class="kp-ph" aria-hidden="true">'+(ph || kpArt(x.ia, x.ic))+'</span>'+
        '<span class="kp-tx"><b>'+esc(x.n)+(x.tag ? ' <em class="kp-tag">'+esc(x.tag)+'</em>' : '')+'</b><small>'+esc(x.d || "")+'</small><i>'+esc(x.go || "자세히 보기")+icon("chev",14)+'</i></span></a></li>';
    }).join("")+'</ul>'+(o.after || '')+
    (o.note ? '<p class="kp-note">'+esc(o.note)+'</p>' : '')+
  '</div></section>';
};

window.KpWhy = function(o){
  var ph = kpPh(o.photo, "(max-width:900px) 100vw, 36vw");
  return '<section class="sec sec-ivory kp kp-why'+(ph ? ' kp-on' : '')+'">'+
    (ph ? '<span class="kp-why-ph" aria-hidden="true">'+ph+'</span>' : '')+
    '<div class="kp-why-in"><p class="kp-pill">WHY '+esc(typeof amBrand === "function" ? amBrand() : "")+'?</p>'+
      '<h2 class="kp-h">'+esc(o.title)+'</h2>'+
      '<ul class="kp-why-g">'+(o.items || []).map(function(x){ return '<li><span class="kp-why-i" aria-hidden="true">'+icon(x.ic || "check", 26)+'</span><span><b>'+esc(x.b)+'</b><small>'+esc(x.d)+'</small></span></li>'; }).join("")+'</ul>'+
    '</div></section>';
};

window.KpCta = function(o){
  return '<section class="kp kp-cta"><div class="w kp-cta-in"><div><h2 class="kp-h">'+esc(o.title)+'</h2>'+(o.lead ? '<p class="kp-lead">'+esc(o.lead)+'</p>' : '')+'</div>'+
    '<div class="row-cta kp-cta-go">'+
      (o.second ? '<a class="btn btn-lg kp-btn-o" href="'+esc(o.second.href)+'"'+kpJump(o.second.href)+'>'+esc(o.second.t)+icon("chev",16)+'</a>' : '')+
      '<a class="btn btn-lg kp-btn-w" href="/intake" data-cta="off"'+ctaF(o)+'>'+icon("calendar",18)+' 접수 안내 보기</a>'+
      '<a class="btn btn-lg kp-btn-w" href="'+esc(o.quote || "/quote")+'" data-cta="on"'+ctaF(o)+' hidden>'+icon("calendar",18)+' '+esc(o.goName || "무료 상담신청")+'</a>'+
    '</div></div></section>';
};

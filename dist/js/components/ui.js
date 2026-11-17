

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

window.FoldAll = function(id, shut, open, cls){
  cls = cls || "is-fold-all";
  return '<button class="fld-b fld-all" type="button" aria-expanded="false" '+
      'aria-controls="'+esc(id)+'" '+
      'data-shut="'+esc(shut)+'" data-open="'+esc(open || "접기")+'" '+
      'onclick="foldToggle(\''+esc(id)+'\',this,\''+esc(cls)+'\')">'+
    '<span>'+esc(shut)+'</span>'+ icon("chevd", 16) +'</button>';
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
      '한 번만 적으시면 저희가 나눠서 연결해 드립니다.</p>'+
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
        (t.out ? '<i class="mcal-o">'+esc(t.out)+'</i>' : '')+
        '<span class="mcal-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
      '</a></li>'; }).join("")+'</ul>'+
    '<div class="row-cta">'+
      '<a class="btn btn-o" href="/tools">계산도구 전부 보기'+icon("arrow",16)+'</a>'+
      '<a class="btn btn-o" href="/faq">자주 묻는 질문</a>'+
    '</div>'+
  '</div></section>';
};

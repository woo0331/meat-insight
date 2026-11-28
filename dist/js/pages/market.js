

function PageStores(){
  var ind = nowQS("i"), reg = nowQS("r");
  var pk = nowQS("pk") === "1", kd = nowQS("kd");

  var eq = nowQS("eq") === "1";
  var rng = {};
  (window.AM_STORE_RANGES||[]).forEach(function(g){ rng[g.key] = nowQS(g.key); });
  var base = { industry:ind||null, region:reg||null };
  var f = { industry:ind||null, region:reg||null, parking:pk, kind:kd||null,
            withEquip:eq };
  (window.AM_STORE_RANGES||[]).forEach(function(g){ if(rng[g.key]) f[g.key] = rng[g.key]; });

  var loaded = (typeof amStores === "function") && Array.isArray(window.AM_STORES);
  var list = loaded ? amStores(f) : [];

  var all  = loaded ? amStores(base) : [];
  var total = loaded ? amStores({}).length : 0;
  return PgHero({
    kicker:"점포 · 상가 · 매장 양도",
    h1raw:"매장 매물 찾기",
    lead:"지역 · 업종 · 평수 · 보증금 · 월세 · 권리금 · 영업기간으로 찾습니다. 시설을 그대로 인수할 수 있는 매장만 따로 보실 수도 있습니다.",
    tight:true,
    cta:'<a class="btn btn-o btn-lg" href="/sell">내 매장 내놓기'+icon("arrow",18)+'</a>'
  })+
  '<section class="sec sec-white"><div class="w">'+
    mkHead(list.length, total, loaded, "매물")+

    '<div class="fil fil-wrap"><span class="fil-ic" aria-hidden="true">'+icon("sliders",18)+'</span>'+
      IndustrySelect("fil-i", ind, "mkGo('/stores')")+
      RegionSelect("fil-r", reg, "mkGo('/stores')")+
      '<select class="sel" id="fil-kd" aria-label="거래 방식" onchange="mkGo(\'/stores\')">'+

        '<option value="">거래 전체</option>'+
        '<option value="transfer"'+(kd==="transfer"?" selected":"")+'>매장 양도</option>'+
        '<option value="lease"'+(kd==="lease"?" selected":"")+'>신규 임대</option>'+
      '</select>'+
      (window.AM_STORE_RANGES||[]).map(function(g){
        return mkRangeSel(g, rng[g.key], "/stores"); }).join("")+
      mkCk("eq", "시설 포함", eq, "/stores")+
      mkCk("pk", "주차 가능", pk, "/stores")+
      mkCount(list.length, all.length)+
    '</div>'+
    (list.length
      ? '<div class="mk-g">'+list.slice(0, amShown(list.length)).map(StoreCard).join("")+'</div>'+
        MoreBtn(list.length)

      : MkZero({ path:"/stores", loaded:loaded, total:total, what:"매물", icon:"key",
          note:"매물에 적힌 값은 올리신 사장님이 적으신 값입니다.",
          reads: amContentsFor({ cat:"store", side:"start", industry:ind, limit:3 }),
          readTitle:"자리를 보러 가시기 전에",
          buy:'<a class="btn btn-b" href="'+esc(quoteTo({side:"start",industry:ind,region:reg}))+'">'+
              '찾는 조건 남기기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/content?j=startup&amp;cat=store">인수 계약 가이드</a>'+
              '<a class="btn btn-o" href="/tools/premium">권리금 계산하기</a>',
          sell:"/sell", sellName:"내 매장 내놓기" }))+
  '</div></section>'+
  BridgeNote()+

  ReadBand({ cat:"store", side:"start", industry:ind,
             title:"계약 전에 확인하실 것" });
}

function StoreCard(s){

  var meta = [amIndustryName(s.industry), amRegionName(s.region, s.gu)].filter(Boolean);
  var m = [];
  if(s.pyeong)  m.push(s.pyeong+"평");
  if(s.deposit != null) m.push("보증 "+won(s.deposit)+"만");
  if(s.rent    != null) m.push("월 "+won(s.rent)+"만");
  if(s.premium != null) m.push("권리 "+won(s.premium)+"만");

  var ph = (s.images||[]).length
    ? '<img class="ph" src="'+esc(s.images[0])+'" alt="'+esc(s.title)+'" loading="lazy" decoding="async">'
    : "";
  return '<a class="mk'+(ph ? "" : " nph")+'" href="/s/'+esc(s.id)+'">'+
    (ph ? '<span class="mk-ph">'+ph+'</span>' : '')+
    '<span class="mk-b">'+
      (meta.length || s.withEquip
        ? '<span class="mk-m">'+esc(meta.join(" · "))+
          (s.withEquip ? (meta.length ? ' · ' : '')+'<em>시설 인수 가능</em>' : '')+'</span>'
        : '')+
      '<b>'+esc(s.title)+'</b>'+
      (m.length ? '<span class="mk-p">'+esc(m.join(" · "))+'</span>' : '')+
      '<span class="mk-go">자세히 보기'+icon("arrow",16)+'</span>'+
    '</span></a>';
}

var ASP_LOOK = {
  "kitchen-eq": { ph:"svc-equip",     ia:"kitchen", d:"가스레인지 · 오븐 · 튀김기 · 작업대" },
  "fridge":     { ph:"as-fridge", ic:"snow",                        d:"업소용 냉장고 · 냉동고 · 쇼케이스" },
  "espresso":   { ph:"as-espresso", ic:"cup",                         d:"에스프레소 머신 · 그라인더" },
  "furniture":  { ph:"as-furniture", ia:"sofa",                        d:"테이블 · 의자 · 소파 · 진열장" },
  "pos":        { ph:"kp-op-svc-pos", ia:"pos",     d:"계산대 단말 · 카드 결제기" },
  "kiosk":      { ph:"as-kiosk", ia:"kiosk",                       d:"무인 주문기 · 테이블 주문기" },
  "fitness":    { ph:"as-fitness", ic:"dumbbell",                    d:"러닝머신 · 웨이트 기구" },
  "salon-eq":   { ph:"as-salon-eq", ic:"scissors",                    d:"미용 의자 · 샴푸대 · 드라이어" },
  "biz-eq":     { ph:"as-biz-eq", ia:"equip",                       d:"그 밖의 업소용 기계 · 설비" }
};
function aspItems(){
  var c = (window.AM_CATS || []).filter(function(x){ return x.key === "asset"; })[0];
  return (c && c.items || []).map(function(it){
    var L = ASP_LOOK[it.key] || {};
    return { id:"asset/" + it.key, name:it.name, look:L };
  });
}
function aspFace(L, name){
  if(L.ph && typeof hasPhoto === "function" && hasPhoto(L.ph))

    return photoBox(L.ph, "", false, L.ph.indexOf("as-") === 0 ? "" : "(max-width:600px) 46vw, (max-width:900px) 47vw, (max-width:1100px) 30vw, 420px");
  var art = (L.ia && typeof hasIconArt === "function" && hasIconArt(L.ia))
    ? iconArt(L.ia, 72) : icon(L.ic || "box", 56);
  return '<span class="asp-ic" aria-hidden="true">'+art+'</span>';
}
function AssetPickBand(top){
  var items = aspItems();
  if(!items.length) return "";
  var H = top ? "h1" : "h2";
  var cards = items.map(function(s){
    var id = s.id;
    return '<li><label class="asp-c">'+
      '<input class="asp-x" type="checkbox" data-pick="'+esc(id)+'" '+
        'onchange="pickToggle(\''+esc(id)+'\', this)"'+(amPickHas(id) ? " checked" : "")+'>'+
      '<span class="asp-ph">'+aspFace(s.look, s.name)+'</span>'+
      '<span class="asp-tx"><b class="asp-n">'+esc(s.name)+'</b>'+
        (s.look.d ? '<span class="asp-d">'+esc(s.look.d)+'</span>' : '')+'</span>'+
      '<span class="asp-st" aria-hidden="true">'+
        '<span class="asp-st-off">'+icon("plus",18)+'고르기</span>'+
        '<span class="asp-st-on">'+icon("check",18)+'선택됨</span></span>'+
    '</label></li>';
  }).join("");
  return '<section class="sec sec-ivory asp" id="as-pick"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">폐업 · 집기 처분</p>'+
      '<'+H+'>어떤 집기를 정리하시나요?</'+H+'>'+
      '<p>정리하실 품목을 모두 고르세요. 카드를 누르면 고르고, 다시 누르면 해제됩니다.</p></div>'+

    '<p class="asp-closed" data-cta="off" data-cta-form="close">'+icon("info",18)+
      '<span>지금은 집기 처분 신청을 받지 않습니다. 고르신 품목은 이 기기에 남고, '+
      '접수가 열리면 그대로 신청하실 수 있습니다.</span></p>'+
    '<ul class="asp-g">'+cards+'</ul>'+
    '<p class="asp-note">'+icon("info",14)+' 품목 사진은 고르기 쉽게 붙인 안내 사진이며 실제 매물이 아닙니다. '+
      '실제로 올라온 시설 · 집기는 아래 목록에 사장님이 올리신 사진으로 나옵니다.</p>'+

    '<div class="asp-sum" id="asp-sum" hidden>'+
      '<p class="asp-sum-t">고르신 집기 <b id="asp-n">0</b>개</p>'+
      '<ul class="asp-l" id="asp-list"></ul>'+
      '<p class="asp-oth" id="asp-oth" hidden></p>'+
      '<div class="asp-go">'+
        '<a class="btn btn-b btn-lg" href="/quote?mode=close" data-pick-go="close"><span>견적 신청하기</span>'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-b btn-lg pk-closed" href="/intake" data-pick-closed="close" data-go-form="close">접수 안내 보기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/tools/closecost">폐업 예상비용 계산</a>'+
      '</div>'+
    '</div>'+
  '</div></section>';
}

window.aspPaint = function(){
  var box = document.getElementById("asp-sum");
  if(!box) return;
  var ids = amPickGet();
  var mine = ids.filter(function(id){ return String(id).indexOf("asset/") === 0; });
  var oth = ids.length - mine.length;
  box.hidden = mine.length === 0;
  var n = document.getElementById("asp-n"); if(n) n.textContent = String(mine.length);
  var names = {}; aspItems().forEach(function(s){ names[s.id] = s.name; });
  var list = document.getElementById("asp-list");
  if(list) list.innerHTML = mine.map(function(id){
    var nm = names[id] || ((amPickOne(id) || {}).name || id);
    return '<li><span class="asp-l-n">'+icon("check",16)+esc(nm)+'</span>'+
      '<button type="button" class="asp-l-x" onclick="pickDel(\''+esc(id)+'\')" '+
        'aria-label="'+esc(nm)+' 선택 해제">선택 해제</button></li>';
  }).join("");
  var o = document.getElementById("asp-oth");
  if(o){ o.hidden = !oth;
    o.textContent = oth ? "다른 분야에서 고르신 " + oth + "개도 신청에 함께 담깁니다." : ""; }
};

function PageAssets(){
  var ind = nowQS("i"), reg = nowQS("r"), cat = nowQS("c"), sub = nowQS("s");
  var dl = nowQS("dl"), pr = nowQS("pr");
  var base = { industry:ind||null, region:reg||null, cat:cat||null, sub:sub||null };
  var list = amAssets({ industry:ind||null, region:reg||null, cat:cat||null, sub:sub||null,
                        deal:dl||null, pr:pr||null });
  var all  = amAssets(base);
  var indObj = ind ? amIndustry(ind) : null;

  var pickTop = nowQS("p") === "pick";
  return (pickTop ? AssetPickBand(true) : PgHero({
    kicker:"시설 · 집기 · 재고",
    h1raw:"한 사장님의 끝이<br class=\"br-m\"> <em>다른 사장님의 시작</em>이 됩니다.",
    lead:"정리하시는 사장님이 내놓은 주방장비 · 커피머신 · 가구 · POS · 운동기구 · 미용기기와 남은 재고입니다. 개별로도, 일괄로도, 시설 전체 인수로도 거래하실 수 있습니다.",
    tight:true,

    cta:'<a class="btn btn-b btn-lg" href="#as-list" onclick="return hhJump(\'as-list\')">'+icon("search",18)+' 집기 찾기</a>'+
        '<a class="btn btn-o btn-lg" href="/sell?t=asset" onclick="return hhJump(\'as-pick\')">내 집기 정리하기'+icon("arrow",18)+'</a>'
  }) + AssetPickBand(false))+
  '<section class="sec sec-white" id="as-list"><div class="w">'+
    (pickTop ? '<div class="sec-hd"><p class="eyebrow">시설 · 집기 · 재고</p><h2>올라와 있는 시설 · 집기</h2></div>' : '')+
    mkHead(list.length, amAssets({}).length, true, "시설 · 집기")+
    (indObj && indObj.equip.length ? '<ul class="chip-g chip-g-fil">'+
      '<li><a class="chip'+(sub?"":" on")+'" href="'+esc(mkKeep("/assets",{s:""}))+'">전체</a></li>'+
      indObj.equip.map(function(e){
        return '<li><a class="chip'+(sub===e.key?" on":"")+'" href="'+
          esc(mkKeep("/assets",{s:e.key}))+'">'+esc(e.name)+'</a></li>';
      }).join("")+'</ul>' : "")+
    '<div class="fil fil-wrap"><span class="fil-ic" aria-hidden="true">'+icon("sliders",18)+'</span>'+

      '<input type="hidden" id="fil-c" value="'+esc(cat)+'">'+
      '<input type="hidden" id="fil-s" value="'+esc(sub)+'">'+
      IndustrySelect("fil-i", ind, "mkGo('/assets')")+
      RegionSelect("fil-r", reg, "mkGo('/assets')")+
      '<select class="sel" id="fil-dl" aria-label="거래 단위" onchange="mkGo(\'/assets\')">'+

        '<option value="">거래단위 전체</option>'+
        '<option value="single"'+(dl==="single"?" selected":"")+'>낱개로</option>'+
        '<option value="bulk"'+(dl==="bulk"?" selected":"")+'>묶음으로</option>'+
        '<option value="all"'+(dl==="all"?" selected":"")+'>시설 전체</option>'+
      '</select>'+
      '<select class="sel" id="fil-pr" aria-label="값" onchange="mkGo(\'/assets\')">'+
        '<option value="">값 전체</option>'+
        (window.AM_ASSET_PRICE||[]).map(function(o){
          return '<option value="'+esc(o.k)+'"'+(pr===o.k?" selected":"")+'>'+
            esc(o.name)+'</option>'; }).join("")+
      '</select>'+
      mkCount(list.length, all.length)+
    '</div>'+
    (list.length
      ? '<div class="mk-g">'+list.slice(0, amShown(list.length)).map(AssetCard).join("")+'</div>'+
        MoreBtn(list.length)
      : MkZero({ path:"/assets", keepQ:(pickTop ? "p=pick" : ""),
          loaded:(typeof amAssets === "function") && Array.isArray(window.AM_ASSETS),
          total:(typeof amAssets === "function") ? amAssets({}).length : 0, what:"시설 · 집기", icon:"box",
          reads: amContentsFor({ cat:"asset", side:"close", industry:ind, limit:3 }),
          readTitle:"장비를 사고 넘기기 전에",
          buy:'<a class="btn btn-b" href="'+esc(quoteTo({side:"start",industry:ind,region:reg}))+'">'+
              '찾는 조건 남기기'+icon("arrow",16)+'</a>',
          sell:"/sell?t=asset", sellName:"내 시설 내놓기" }))+
  '</div></section>'+
  BridgeNote()+
  ReadBand({ cat:"asset", side:"close", industry:ind,
             title:"넘기기 전에 알아 두면" });
}

function AssetCard(a){
  var deal = (window.AM_DEAL_KINDS||[]).filter(function(d){ return d.key === a.deal; })[0];
  var meta = [amIndustryName(a.industry), amRegionName(a.region, a.gu)].filter(Boolean);
  var m = [];
  m.push(a.price != null ? won(a.price)+"만원" : "가격 협의");
  if(a.year) m.push(a.year+"년식");
  var ph = (a.images||[]).length
    ? '<img class="ph" src="'+esc(a.images[0])+'" alt="'+esc(a.title)+'" loading="lazy" decoding="async">'
    : "";
  return '<a class="mk'+(ph ? "" : " nph")+'" href="/a/'+esc(a.id)+'">'+
    (ph ? '<span class="mk-ph">'+ph+'</span>' : '')+
    '<span class="mk-b">'+
      (meta.length || deal
        ? '<span class="mk-m">'+esc(meta.join(" · "))+
          (deal ? (meta.length ? ' · ' : '')+'<em>'+esc(deal.name)+'</em>' : '')+'</span>'
        : '')+
      '<b>'+esc(a.title)+'</b>'+
      '<span class="mk-p">'+esc(m.join(" · "))+'</span>'+
      '<span class="mk-go">자세히 보기'+icon("arrow",16)+'</span>'+
    '</span></a>';
}

var MK_KEYS = ["i","r","c","s","py","dp","rt","pm","yr","pk","eq","kd","dl","pr"];

window.mkGo = function(base){
  var q = [];
  MK_KEYS.forEach(function(k){
    var e = $("fil-" + k);
    if(!e) return;
    var v = (e.type === "checkbox") ? (e.checked ? "1" : "") : e.value;
    if(v) q.push(k + "=" + encodeURIComponent(v));
  });
  go(base+(q.length ? "?"+q.join("&") : ""));
};

function mkKeep(base, over){
  var q = [];
  MK_KEYS.forEach(function(k){
    var v = (over && Object.prototype.hasOwnProperty.call(over, k))
      ? over[k] : nowQS(k);
    if(v) q.push(k + "=" + encodeURIComponent(v));
  });
  return base + (q.length ? "?" + q.join("&") : "");
}

function mkRangeSel(g, val, base){
  return '<select class="sel" id="fil-'+esc(g.key)+'" aria-label="'+esc(g.name)+'" '+
    'onchange="mkGo(\''+esc(base)+'\')">'+
    '<option value="">'+esc(g.name)+' 전체</option>'+
    (g.opts||[]).map(function(o){
      return '<option value="'+esc(o.k)+'"'+(val===o.k?" selected":"")+'>'+
        esc(o.name)+'</option>';
    }).join("")+'</select>';
}

function mkCk(id, name, on, base){
  return '<label class="fil-ck'+(on?" on":"")+'">'+
    '<input type="checkbox" id="fil-'+esc(id)+'"'+(on?" checked":"")+
    ' onchange="mkGo(\''+esc(base)+'\')">'+
    '<span>'+esc(name)+'</span></label>';
}

function mkHead(shown, total, loaded, what){
  if(!loaded) return "";
  var t = !total ? "지금 올라온 "+what+" 전체 0건"
    : (shown === total ? what+" "+total+"건" : "조건에 맞는 "+what+" "+shown+"건 · 전체 "+total+"건");
  return '<p class="mk-head" role="status">'+icon("search",16)+'<b>'+esc(t)+'</b></p>';
}
function mkCount(shown, all){
  return '<span class="fil-n">'+shown+'건'+
    (all > shown ? '<em class="fil-off">거르개로 '+(all - shown)+'건 숨김</em>' : '')+
  '</span>';
}

function mkActive(path, extra){
  var R = {}, name = function(arr, k){ var o = (arr||[]).filter(function(x){ return x.k === k; })[0]; return o ? o.name : k; };
  (window.AM_STORE_RANGES||[]).forEach(function(g){ R[g.key] = g; });
  var cats = window.AM_CATS || [];
  var lab = {
    i:  function(v){ return (typeof amIndustryName === "function" && amIndustryName(v)) || v; },
    r:  function(v){ return (typeof amRegionName === "function" && amRegionName(v)) || v; },
    kd: function(v){ return v === "transfer" ? "매장 양도" : v === "lease" ? "신규 임대" : v; },
    eq: function(){ return "시설 포함"; },
    pk: function(){ return "주차 가능"; },
    c:  function(v){ var c = cats.filter(function(x){ return x.key === v; })[0]; return c ? c.name : v; },
    s:  function(v){ return (typeof amEquipName === "function" && amEquipName(v)) || v; },
    dl: function(v){ return { single:"낱개로", bulk:"묶음으로", all:"시설 전체" }[v] || v; },
    pr: function(v){ return name(window.AM_ASSET_PRICE, v); }
  };
  var out = [];
  MK_KEYS.forEach(function(k){
    var v = nowQS(k); if(!v) return;
    var t = R[k] ? R[k].name + " " + name(R[k].opts, v) : (lab[k] ? lab[k](v) : v);
    var o = {}; o[k] = "";
    out.push({ k:k, t:t, href: mkKeep(path, o) + (extra || "") });
  });
  return out;
}
function mkJoinQ(href, extra){ return extra ? href + (href.indexOf("?") > 0 ? "&" : "?") + extra : href; }
window.MkZero = function(o){

  var J = function(pair){ return ftWith(o.what, pair); };
  var on = mkActive(o.path).map(function(a){
    a.href = mkJoinQ(a.href, o.keepQ); return a; });
  if(!o.loaded) return Empty({ icon:"info", title:"매물 정보를 불러오지 못했습니다",
      text:"잠시 뒤 다시 불러와 주세요. 등록된 매물이 없다는 뜻이 아닙니다.",
      cta:'<button class="btn btn-b" type="button" onclick="location.reload()">다시 불러오기'+icon("arrow",16)+'</button>'+
          '<a class="btn btn-o" href="/transfer">양도양수 안내 보기</a>' });
  var chips = on.length
    ? '<div class="mkz-on"><p class="mkz-h">걸어 두신 조건 '+on.length+'개 — 눌러서 하나씩 풀 수 있습니다</p><ul class="chip-g">'+
        on.map(function(a){ return '<li><a class="chip mkz-x" data-keep href="'+esc(a.href)+'" aria-label="'+esc(a.t)+' 조건 풀기">'+
          esc(a.t)+'<span class="mkz-xi" aria-hidden="true">✕</span></a></li>'; }).join("")+'</ul></div>'
    : "";
  var reset = '<a class="btn btn-b" data-keep href="'+esc(mkJoinQ(o.path, o.keepQ))+'">조건 초기화하고 다시 찾기'+icon("arrow",16)+'</a>';
  if(o.total) return '<div class="mkz">'+Empty({ icon:"sliders", title:"선택한 조건에 맞는 "+J("이가")+" 없습니다",
      text:"조건을 바꾸거나 초기화해서 다시 찾아보세요. 지금 올라온 "+J("은는")+" 전체 "+o.total+"건입니다."+
           (o.note ? " "+o.note : ""),
      cta: chips + reset })+'</div>';
  return '<div class="mkz">'+Empty({ icon:o.icon || "key", title:"현재 등록된 "+J("이가")+" 없습니다",
      text:(on.length ? "걸어 두신 조건 때문이 아니라, 지금 올라온 "+J("이가")+" 전체 0건입니다. " : "")+
           "없는 매물을 지어내지 않습니다. 올라오면 이 목록에 나옵니다 (따로 알려 드리는 기능은 아직 없습니다).",
      reads:o.reads, readTitle:o.readTitle,
      cta:(o.buy || "")+

          '<p class="mkz-sell">'+icon("store",16)+'<span>'+
            ctaPair("sell", "매장 · 시설을 내놓으시려면 아래에서 등록을 신청하실 수 있습니다. 넘기기 전에 맞출 것은 양도 준비 안내에 있습니다.",
                            "지금은 매물 등록 접수를 받지 않습니다. 내놓으시려는 분은 접수 안내와 양도 준비 안내를 먼저 보세요.")+'</span></p>'+
          '<a class="btn btn-o" href="'+esc(o.sell)+'">'+esc(o.sellName)+'</a>'+
          '<a class="btn btn-o" href="/intake" data-cta="off" data-cta-form="sell">접수 안내 보기</a>'+
          '<a class="btn btn-o" href="/transfer?t=out">양도 준비 안내 보기</a>' })+'</div>';
};

function BridgeNote(){
  return '<section class="sec sec-note"><div class="w">'+
    '<p class="note note-box">여기 적힌 평수 · 보증금 · 월세 · 권리금 · 매출은 '+
      '<b>올리신 사장님이 적은 값</b>이고, 저희가 확인하거나 보증하는 값이 아닙니다. '+
      '저희는 통신판매중개자이며 거래 당사자가 아닙니다 — 계약 전에 반드시 '+
      '현장과 서류를 직접 확인하세요.</p>'+
  '</div></section>';
}

function mkSpecs(rows){
  var on = rows.filter(function(r){ return r[1] !== null && r[1] !== undefined && r[1] !== ""; });
  if(!on.length) return "";
  return '<ul class="mk-sp">'+on.map(function(r){
    return '<li><span class="mk-sp-l">'+esc(r[0])+'</span>'+
      '<span class="mk-sp-v">'+esc(String(r[1]))+'</span></li>';
  }).join("")+'</ul>';
}

function mkGallery(images, alt){
  var L = (images||[]).filter(Boolean);
  if(!L.length) return "";
  return '<div class="pv-sec"><h2>사진</h2><div class="mk-gal">'+
    L.slice(0, 8).map(function(src){
      return '<img class="ph" src="'+esc(src)+'" alt="'+esc(alt)+'" loading="lazy" decoding="async">';
    }).join("")+'</div>'+
    '<p class="note">올리신 사장님이 올린 사진입니다.</p></div>';
}

function mkRole(){
  return '<div class="note-box"><b>저희는 거래 당사자가 아닙니다</b>'+
    '<p>적힌 값은 올리신 사장님이 적으신 것이고, 저희가 확인하거나 보증하는 값이 '+
    '아닙니다. 계약은 두 사장님이 직접 하시고, 저희는 연결까지만 합니다. '+
    '보러 가시기 전에 등기부 · 임대차계약서 · 관리비 · 원상복구 범위를 '+
    '직접 확인하세요.</p></div>';
}

function PageStoreOne(s){
  var meta = [amIndustryName(s.industry), amRegionName(s.region, s.gu)].filter(Boolean);
  var tags = [];
  if(s.kind === "transfer") tags.push("매장 양도");
  if(s.kind === "lease")    tags.push("임대");
  if(s.withEquip)           tags.push("시설 그대로 인수 가능");
  if(s.fc)                  tags.push("프랜차이즈 매장");

  var mine = (window.AM_ASSETS || []).filter(function(x){
    return x.storeId === s.id; });
  var q = quoteTo({ cat:"store", side:"start", industry:s.industry, region:s.region });
  return PgHero({
    crumb: Crumb([["매장 인수","/stores"],[s.title]]),
    kicker: meta.join(" · "),
    h1: s.title,
    tight:true
  })+
  '<section class="sec sec-white"><div class="w pv-one">'+
    (tags.length ? '<ul class="chip-g">'+tags.map(function(t){
      return '<li><span class="chip chip-flat">'+esc(t)+'</span></li>'; }).join("")+'</ul>' : '')+

    mkSpecs([
      ["면적",      s.pyeong  != null ? s.pyeong + "평" : null],
      ["보증금",    s.deposit != null ? won(s.deposit) + "만원" : null],
      ["월세",      s.rent    != null ? won(s.rent) + "만원" : null],
      ["권리금",    s.premium != null ? won(s.premium) + "만원" : null],
      ["시설 인수비", s.equipCost != null ? won(s.equipCost) + "만원" : null],
      ["운영 기간",  s.since ? s.since + "년부터" : (s.months ? s.months + "개월" : null)],
      ["넘기고 싶은 시점", s.wantAt || null]
    ])+

    (s.sales != null ? '<div class="pv-sec"><h2>매출</h2>'+
      '<p class="mk-sales">월 '+esc(won(s.sales))+'만원</p>'+
      '<p class="note">사장님이 적으신 값입니다. 저희가 확인한 값이 아닙니다 — '+
      '계약 전에 카드 매출 자료 · 부가세 신고서로 직접 확인하세요.</p></div>' : '')+

    (s.text ? '<div class="pv-sec"><h2>사장님 설명</h2>'+
      '<p class="mk-text">'+esc(s.text)+'</p></div>' : '')+

    mkGallery(s.images, s.title + " 매장 사진")+

    (mine.length ? '<div class="pv-sec"><h2>이 가게에서 같이 나온 시설 · 장비</h2>'+
      '<div class="mk-g">'+mine.slice(0, 6).map(AssetCard).join("")+'</div>'+
      (mine.length > 6
        ? '<p class="note">'+esc(mine.length)+'건 가운데 여섯만 냅니다.</p>' : '')+
      '<p class="note">한 가게를 정리하면서 같이 나온 것입니다. 매장과 함께 '+
      '일괄로도 상담하실 수 있습니다.</p></div>' : '')+

    (s.at ? '<p class="note">'+esc(s.at)+'에 올라왔습니다.</p>' : '')+

    mkRole()+

    Empty({
      icon:"chat",
      title:"이 매장을 보고 싶으시면",
      text:"연락처를 바로 드리지 않습니다. 보시려는 날짜와 알고 싶은 것을 적어 주시면 "+
           "올리신 사장님께 그대로 전달하고, 연락처는 두 분이 동의하신 뒤에만 오갑니다.",
      cta:'<a class="btn btn-b" href="'+esc(q)+'">이 매장 문의하기'+icon("arrow",16)+'</a>'
    })+
  '</div></section>'+
  ReadBand({ cat:"store", side:"start", industry:s.industry,
             title:"계약 전에 확인하실 것" })+
  '<div class="sticky-cta">'+
    '<a class="btn btn-b" href="'+esc(q)+'">이 매장 문의하기</a>'+
  '</div>';
}

function PageAssetOne(a){
  var meta = [amIndustryName(a.industry), amRegionName(a.region, a.gu)].filter(Boolean);
  var deal = (window.AM_DEAL_KINDS||[]).filter(function(d){ return d.key === a.deal; })[0];
  var tags = [];
  if(deal) tags.push(deal.name);
  if(a.cat === "stock") tags.push("재고");

  var subName = (typeof amEquipName === "function") ? amEquipName(a.sub) : "";
  if(subName) tags.push(subName);

  var same = a.storeId
    ? (window.AM_ASSETS||[]).filter(function(x){
        return x.storeId === a.storeId && x.id !== a.id; })
    : [];
  var q = quoteTo({ cat:"asset", side:"start", industry:a.industry, region:a.region });
  return PgHero({
    crumb: Crumb([["시설 · 집기","/assets"],[a.title]]),
    kicker: meta.join(" · "),
    h1: a.title,
    tight:true
  })+
  '<section class="sec sec-white"><div class="w pv-one">'+
    (tags.length ? '<ul class="chip-g">'+tags.map(function(t){
      return '<li><span class="chip chip-flat">'+esc(t)+'</span></li>'; }).join("")+'</ul>' : '')+

    mkSpecs([
      ["가격",   a.price != null ? won(a.price) + "만원" + (a.nego ? " (협의 가능)" : "") : "협의"],
      ["제조사", a.brand  || null],
      ["연식",   a.year   ? a.year + "년식" : null],
      ["수량",   a.count  ? a.count + "개" : null],
      ["상태",   a.state  || null]
    ])+

    (a.text ? '<div class="pv-sec"><h2>사장님 설명</h2>'+
      '<p class="mk-text">'+esc(a.text)+'</p></div>' : '')+

    mkGallery(a.images, a.title + " 사진")+

    (same.length ? '<div class="pv-sec"><h2>같은 가게에서 나온 것</h2>'+
      '<div class="mk-g">'+same.slice(0, 6).map(AssetCard).join("")+'</div>'+
      '<p class="note">한 가게를 정리하면서 같이 나온 것입니다. 일괄로도 '+
      '상담하실 수 있습니다.</p></div>' : '')+

    (a.at ? '<p class="note">'+esc(a.at)+'에 올라왔습니다.</p>' : '')+

    mkRole()+

    Empty({
      icon:"chat",
      title:"이 시설을 보고 싶으시면",
      text:"연락처를 바로 드리지 않습니다. 보시려는 날짜와 알고 싶은 것을 적어 주시면 "+
           "올리신 사장님께 그대로 전달하고, 연락처는 두 분이 동의하신 뒤에만 오갑니다.",
      cta:'<a class="btn btn-b" href="'+esc(q)+'">이 시설 문의하기'+icon("arrow",16)+'</a>'
    })+
  '</div></section>'+
  ReadBand({ cat:"asset", side:"close", industry:a.industry,
             title:"넘기기 전에 알아 두면" })+
  '<div class="sticky-cta">'+
    '<a class="btn btn-b" href="'+esc(q)+'">이 시설 문의하기</a>'+
  '</div>';
}

var SELL_TABS = [
  { k:"store", name:"매장 · 점포", lead:"가게를 통째로 넘기거나 임대 놓습니다" },
  { k:"asset", name:"시설 · 장비", lead:"쓰던 장비 · 집기 · 남은 재고를 넘깁니다" }
];

var SELL_PH = { store:"kp-tr-svc-sell", asset:"as-fridge" };
function sellTabs(t){
  return upTabs(t === "store" ? "store" : "asset");
}

window.upTabs = function(k){
  var T = [["store","매장","/sell"],["asset","집기","/sell?t=asset"],["product","상품","/my?v=product"]];
  return '<nav class="up-tab" aria-label="무엇을 올리시나요">'+T.map(function(x){
    var on = x[0] === k;
    return '<a class="up-tc'+(on ? " on" : "")+'" href="'+x[2]+'"'+(on ? ' aria-current="page"' : '')+'>'+x[1]+'</a>'; }).join("")+'</nav>';
};

window.sellProg = function(){
  var f = document.getElementById("sl-f"), out = document.getElementById("sl-prog");
  if(!f || !out) return;

  var req = ["sl-ind", "sl-reg", document.getElementById("sl-item") ? "sl-item" : "sl-kind", "sl-q", "sl-name", "sl-tel"]
    .map(function(id){ return document.getElementById(id); }).filter(Boolean);
  var done = req.filter(function(el){ return String(el.value || "").trim() !== ""; }).length;
  var b = out.querySelector("b"); if(b) b.textContent = done + " / " + req.length;
  var bar = out.querySelector("i"); if(bar) bar.style.width = (req.length ? Math.round(done / req.length * 100) : 0) + "%";
  out.classList.toggle("is-done", done === req.length);
  var t = out.querySelector("em"); if(t) t.textContent = done === req.length ? "필수 항목을 모두 적으셨습니다" : "* 표시 항목을 적어 주세요";
};

var SL_STATE = ["거의 새것", "사용감 조금", "사용감 많음", "고장 · 부품용"];
function PageSellAsset(){
  var ind = nowQS("i"), reg = nowQS("r");
  return PgHero({ kicker:"매물 내놓기", h1raw:"집기 내놓기",
    lead:"사진과 집기 이름, 상태, 가격만 적어 주세요. 운영자가 확인한 뒤 올립니다. 무료입니다.", tight:true })+
  '<section class="sec sec-white"><div class="w form-wrap qf">'+
    sellTabs("asset")+
    '<div class="notice-bad" data-cta="off" data-cta-form="sell"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
      '<p>적으셔도 보내지지 않습니다. 그동안 <a href="/assets">지금 나와 있는 시설 · 집기</a>를 보실 수 있습니다.</p></div>'+
    '<form id="sl-f" onsubmit="return sellSend(event)" data-sl="asset">'+
      PhotoPick("sl", { say:"앞면과 명판(제조사 · 모델이 적힌 스티커)을 찍어 주시면 확인이 빨라집니다. 없어도 등록하실 수 있습니다." })+
      '<div class="f-r"><label for="sl-item">집기 이름 <b>*</b></label>'+
        '<input id="sl-item" required placeholder="예: 4도어 냉장고 / 에스프레소 머신 2그룹"></div>'+
      '<div class="f-2">'+
        '<div class="f-r"><label for="sl-state">상태 <b>*</b></label>'+
          '<select class="sel" id="sl-state"><option value="">골라 주세요</option>'+
            SL_STATE.map(function(x){ return '<option>'+esc(x)+'</option>'; }).join("")+'</select></div>'+
        '<div class="f-r"><label for="sl-price">희망 가격 (만원)</label>'+
          '<input id="sl-price" inputmode="numeric" placeholder="비워 두면 협의"></div>'+
      '</div>'+
      '<div class="f-2">'+
        '<div class="f-r"><label for="sl-reg">거래 지역 <b>*</b></label>'+
          RegionSelect("sl-reg", reg, "", "지역을 골라 주세요")+'</div>'+
        '<div class="f-r"><label for="sl-gu">시 · 군 · 구 <i>(선택)</i></label>'+
          '<input id="sl-gu" autocomplete="address-level2" placeholder="예: 안양시"></div>'+
      '</div>'+
      '<div class="f-2">'+
        '<div class="f-r"><label for="sl-name">이름 <b>*</b></label>'+
          '<input id="sl-name" required autocomplete="name"></div>'+
        '<div class="f-r"><label for="sl-tel">휴대폰 <b>*</b></label>'+
          '<input id="sl-tel" type="tel" required autocomplete="tel" inputmode="tel" placeholder="010-0000-0000"></div>'+
      '</div>'+
      QMore("sl-more",
        '<div class="f-2">'+
          '<div class="f-r"><label for="sl-brand">제조사</label><input id="sl-brand" placeholder="예: 라마르조코"></div>'+
          '<div class="f-r"><label for="sl-model">모델명</label><input id="sl-model" placeholder="명판에 적힌 이름"></div>'+
        '</div>'+
        '<div class="f-2">'+
          '<div class="f-r"><label for="sl-age">사용 기간</label><input id="sl-age" placeholder="예: 3년"></div>'+
          '<div class="f-r"><label for="sl-size">크기</label><input id="sl-size" placeholder="예: 가로 120 · 깊이 80 cm"></div>'+
        '</div>'+
        '<div class="f-2">'+
          '<div class="f-r"><label for="sl-out">반출 조건</label><input id="sl-out" placeholder="예: 직접 가져가셔야 함 / 3층 계단"></div>'+
          '<div class="f-r"><label for="sl-ind">쓰던 업종</label>'+IndustrySelect("sl-ind", ind, "", "골라 주세요")+'</div>'+
        '</div>'+
        '<div class="f-r"><label for="sl-q">더 전하실 것</label>'+
          '<textarea id="sl-q" rows="3" placeholder="보실 수 있는 시간 등"></textarea></div>')+
      AgreeBox("sl-ag","성함 · 연락처 · 업종 · 지역 · 적어 주신 매물 조건과 설명",
               "매물 등록 확인과 문의 전달","등록을 내리신 날로부터 1년")+
      '<p class="note note-mid">이름 · 휴대폰과 번지 주소는 매물에 나가지 않습니다. 지역은 시 · 군 · 구까지만 올립니다.</p>'+
      '<div id="sl-fail"></div>'+
      '<button class="btn btn-b btn-lg btn-full" type="submit" disabled data-gate="sell">'+
        '집기 등록하기'+icon("arrow",18)+'</button>'+
    '</form>'+
  '</div></section>';
}

function PageSell(){
  var t = nowQS("t") === "asset" ? "asset" : "store";
  if(t === "asset") return PageSellAsset();
  var ind = nowQS("i"), reg = nowQS("r");
  var ready = !!(window.WOW_BIZ && WOW_BIZ.sosReady);
  var isStore = t === "store";

  var fields = isStore
    ? '<div class="f-2">'+
        '<div class="f-r"><label for="sl-kind">거래 방식 <b>*</b></label>'+
          '<select class="sel" id="sl-kind">'+

            '<option value="transfer">매장 양도 — 권리금 받고 넘기기</option>'+
            '<option value="lease">임대 — 보증금 · 월세로 내놓기</option>'+
          '</select></div>'+
        '<div class="f-r"><label for="sl-py">평수</label>'+
          '<input id="sl-py" inputmode="numeric" placeholder="예: 18"></div>'+
      '</div>'+
      '<div class="f-2">'+
        '<div class="f-r"><label for="sl-dep">보증금 (만원)</label>'+
          '<input id="sl-dep" inputmode="numeric" placeholder="예: 3000"></div>'+
        '<div class="f-r"><label for="sl-rent">월세 (만원)</label>'+
          '<input id="sl-rent" inputmode="numeric" placeholder="예: 180"></div>'+
      '</div>'+
      '<div class="f-2">'+

        '<div class="f-r"><label for="sl-pm">권리금 (만원)</label>'+
          '<input id="sl-pm" inputmode="numeric" placeholder="무권리면 0을 적어 주세요"></div>'+
        '<div class="f-r"><label for="sl-eqc">시설 인수비 (만원)</label>'+
          '<input id="sl-eqc" inputmode="numeric" placeholder="따로 받으시면 적어 주세요"></div>'+
      '</div>'+
      '<div class="f-2">'+
        '<div class="f-r"><label for="sl-since">문 연 해</label>'+
          '<input id="sl-since" inputmode="numeric" placeholder="예: 2019"></div>'+
        '<div class="f-r"><label for="sl-want">넘기고 싶은 시점</label>'+
          '<input id="sl-want" placeholder="예: 2026년 12월 / 빠를수록"></div>'+
      '</div>'+
      '<div class="f-r"><label class="f-ck" for="sl-eq">'+
        '<input type="checkbox" id="sl-eq"> 시설 · 장비를 그대로 두고 갑니다</label></div>'+

      '<div class="f-r"><label for="sl-sales">월 매출 (만원)</label>'+
        '<input id="sl-sales" inputmode="numeric" placeholder="적어 주시면 그대로 올립니다 (선택)">'+
        '<span class="f-h">저희가 확인하는 값이 아니라서, 화면에 '+
          '&ldquo;사장님이 적으신 값&rdquo; 이라고 밝혀서 올립니다.</span></div>'
    : '<div class="f-2">'+
        '<div class="f-r"><label for="sl-item">무엇을 내놓으시나요 <b>*</b></label>'+
          '<input id="sl-item" required placeholder="예: 에스프레소 머신 2그룹 / 4도어 냉장고"></div>'+
        '<div class="f-r"><label for="sl-deal">거래 단위</label>'+
          '<select class="sel" id="sl-deal">'+
            '<option value="single">낱개로 팔겠습니다</option>'+
            '<option value="bulk">묶음으로 넘기겠습니다</option>'+
            '<option value="all">시설 전체를 한 번에</option>'+
          '</select></div>'+
      '</div>'+
      '<div class="f-2">'+
        '<div class="f-r"><label for="sl-brand">제조사</label>'+
          '<input id="sl-brand" placeholder="예: La Marzocco"></div>'+
        '<div class="f-r"><label for="sl-year">연식</label>'+
          '<input id="sl-year" inputmode="numeric" placeholder="예: 2021"></div>'+
      '</div>'+
      '<div class="f-2">'+
        '<div class="f-r"><label for="sl-cnt">수량</label>'+
          '<input id="sl-cnt" inputmode="numeric" placeholder="예: 1"></div>'+
        '<div class="f-r"><label for="sl-price">희망가 (만원)</label>'+
          '<input id="sl-price" inputmode="numeric" placeholder="협의 가능하시면 비워 두세요"></div>'+
      '</div>'+
      '<div class="f-r"><label for="sl-state">상태</label>'+
        '<input id="sl-state" placeholder="예: 정기 점검 받아 왔습니다 / 한 군데 찍힘"></div>';

  return PgHero({
    kicker:"매물 내놓기",
    h1raw:"내놓으시는 것이<br class=\"br-m\"> 다음 사장님의 시작이 됩니다.",
    lead:"매장 · 시설 · 장비를 내놓을 때 적는 양식입니다. 접수가 열려 있으면 적어 주신 조건 그대로 올리고, 보시려는 분의 문의를 전달합니다. 무료입니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w form-wrap">'+
    sellTabs(t)+

    sellPrep(t)+

    (
      '<div class="notice-bad" data-cta="off" data-cta-form="sell"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
        '<p>접수처 설정이 끝나면 바로 열립니다. 그동안에는 '+
        '<a href="/stores">지금 나와 있는 매장</a>이나 '+
        '<a href="/closure">폐업·철거에 필요한 것</a>을 먼저 '+
        '보실 수 있습니다.</p></div>')+

    '<div class="note-box">'+
      '<b>올리기 전에 한 번 연락드립니다.</b>'+
      '<p>적어 주신 내용은 바로 올라가지 않습니다. 저희가 보고 빠진 것을 '+
      '여쭌 다음에 올립니다. <b>연락처 · 상호 · 번지 주소는 매물에 '+
      '나가지 않습니다</b> — 지역은 시 · 군 · 구까지만 올리고, 보시려는 '+
      '분께 연락처를 전하는 것은 사장님이 그때 다시 동의하셔야 합니다.</p>'+
    '</div>'+

    '<div class="sl-prog" id="sl-prog" role="status" aria-live="polite">'+
      '<span class="sl-prog-t">필수 <b>0 / 6</b> · <em>* 표시 항목을 적어 주세요</em></span>'+
      '<span class="sl-prog-bar" aria-hidden="true"><i></i></span></div>'+
    '<form id="sl-f" onsubmit="return sellSend(event)" oninput="sellProg()" onchange="sellProg()">'+
      '<div class="f-2">'+
        '<div class="f-r"><label for="sl-ind">업종 <b>*</b></label>'+
          IndustrySelect("sl-ind", ind, "", "업종을 골라 주세요")+'</div>'+
        '<div class="f-r"><label for="sl-reg">지역 <b>*</b></label>'+
          RegionSelect("sl-reg", reg, "", "지역을 골라 주세요")+'</div>'+
      '</div>'+
      '<div class="f-r"><label for="sl-gu">시 · 군 · 구 <i>(선택)</i></label>'+
        '<input id="sl-gu" autocomplete="address-level2" placeholder="예: 안양시">'+
        '<span class="f-h">번지까지는 적지 마세요. 화면에는 시 · 군 · 구까지만 나갑니다.</span></div>'+

      fields+

      '<div class="f-r"><label for="sl-q">설명 <b>*</b></label>'+
        '<textarea id="sl-q" rows="6" required '+
          'placeholder="상태와 넘기시는 까닭, 보실 수 있는 시간을 적어 주세요. 양식이 없어도 됩니다."></textarea></div>'+

      '<div class="f-2">'+
        '<div class="f-r"><label for="sl-name">성함 <b>*</b></label>'+
          '<input id="sl-name" required autocomplete="name"></div>'+
        '<div class="f-r"><label for="sl-tel">연락처 <b>*</b></label>'+
          '<input id="sl-tel" type="tel" required autocomplete="tel" '+
            'placeholder="010-0000-0000"></div>'+
      '</div>'+

      '<div class="f-r"><label for="sl-img">사진 링크 <i>(선택)</i></label>'+
        '<input id="sl-img" placeholder="클라우드 공유 링크가 있으면">'+
        '<span class="f-h">사진 파일은 아래 \'사진 추가\' 에서 바로 고르실 수 있습니다.</span></div>'+

      AgreeBox("sl-ag","성함 · 연락처 · 업종 · 지역 · 적어 주신 매물 조건과 설명",
               "매물 등록 확인과 문의 전달","등록을 내리신 날로부터 1년")+
      PhotoPick("sl", { say:"매장 · 홀 · 주방 · 외관이나 장비 앞면 · 명판을 찍어 주시면 검수가 빨라집니다. 없어도 내놓으실 수 있습니다." })+
      '<div id="sl-fail"></div>'+
      '<button class="btn btn-b btn-lg btn-full" type="submit"'+' disabled data-gate="sell"'+'>'+
        (isStore ? "매장 내놓기" : "시설 · 장비 내놓기")+icon("arrow",18)+'</button>'+
      '<p class="note note-mid">내리고 싶으시면 같은 연락처로 말씀해 주세요. '+
        '오래된 매물을 그대로 두지 않습니다 — 올린 날짜를 화면에 같이 냅니다.</p>'+
    '</form>'+
  '</div></section>'+
  ReadBand({ cat:"transfer", side:"close",
             title:"넘기기 전에 알아 두면" });
}

window.sellSend = function(ev){
  ev.preventDefault();
  var $ = function(id){ return document.getElementById(id); };
  if(!$("sl-ag").checked){ toast("개인정보 수집 · 이용 동의가 필요합니다"); return false; }
  var isStore = !$("sl-item");

  var need = isStore
    ? [["sl-ind","업종"],["sl-reg","지역"],["sl-q","설명"],["sl-name","성함"],["sl-tel","연락처"]]

    : [["sl-item","집기 이름"],["sl-state","상태"],["sl-reg","거래 지역"],["sl-name","이름"],["sl-tel","휴대폰"]];
  for(var i=0;i<need.length;i++){
    if(!$(need[i][0]).value.trim()){
      toast(need[i][1]+"을(를) 적어 주세요"); $(need[i][0]).focus(); return false; }
  }
  var v = function(id){ var e = $(id); return e ? e.value.trim() : ""; };
  var tdig = v("sl-tel").replace(/[^0-9]/g, "");
  if(tdig.length < 9 || tdig.length > 11){ toast("휴대폰 번호를 다시 확인해 주세요"); $("sl-tel").focus(); return false; }
  var ind = v("sl-ind"), reg = v("sl-reg");
  var detail = isStore
    ? { "거래 방식": $("sl-kind").value === "lease" ? "임대" : "매장 양도",
        "업종": ind ? amIndustryName(ind) : "", "시군구": v("sl-gu"),
        "평수": v("sl-py"), "보증금": v("sl-dep"), "월세": v("sl-rent"),
        "권리금": v("sl-pm"), "시설 인수비": v("sl-eqc"),
        "시설 포함": $("sl-eq").checked ? "그대로 두고 갑니다" : "",
        "문 연 해": v("sl-since"), "넘기고 싶은 시점": v("sl-want"),
        "월 매출(사장님이 적으신 값)": v("sl-sales"), "사진 주소": v("sl-img") }
    : { "품목": v("sl-item"), "상태": v("sl-state"), "희망가": v("sl-price"),
        "업종": ind ? amIndustryName(ind) : "", "시군구": v("sl-gu"),
        "제조사": v("sl-brand"), "모델명": v("sl-model"), "사용 기간": v("sl-age"),
        "크기": v("sl-size"), "반출 조건": v("sl-out") };

  detail = amDropEmpty(detail);

  var ns = isStore ? "sell-store" : "sell-asset";
  return amSend("sl-fail", {
    kind: "quote",
    form: "sell",
    cat:  isStore ? "transfer" : "asset",
    idem: amIdem(ns),
    name:  v("sl-name"),
    tel:   v("sl-tel"),
    region: reg ? amRegionName(reg) : "",
    service: "", serviceName: isStore ? "매장 내놓기" : "시설 · 장비 내놓기",
    q: v("sl-q") || (isStore ? "" : "집기 내놓기 — " + v("sl-item") + (v("sl-state") ? " (" + v("sl-state") + ")" : "")),
    budget: "",
    detail: detail,
    agree: true
  }, "sellSend", function(){

    amIdemClear(ns);
  });
};

var SELL_PREP = {
  store:["임대차 계약서 — 보증금 · 월세 · 남은 계약 기간을 볼 수 있게",
         "사업자등록증 — 업종 · 문 연 해를 확인합니다",
         "매장 사진 몇 장 — 홀 · 주방 · 외관 (사진 주소로 받습니다)",
         "넘길 시설 · 장비 목록 — 두고 가실 것과 가져가실 것",
         "(선택) 최근 매출 자료 — 적으시면 '사장님이 적으신 값' 으로 밝혀 올립니다"],
  asset:["품목 · 제조사 · 연식 — 명판 사진이 있으면 가장 정확합니다",
         "수량과 상태 — 정상 작동 여부 · 수리 이력",
         "사진 몇 장 — 앞면 · 명판 · 놓인 자리 (사진 주소로 받습니다)",
         "희망가 — 정하지 않으셨으면 비워 두셔도 됩니다",
         "떼어 가는 날 — 철거 · 원상복구 일정과 겹치는지"]
};
function sellPrep(t){
  var L = SELL_PREP[t] || SELL_PREP.store;
  return '<div class="sl-prep"><p class="sl-prep-h">'+icon("listck",18)+'<b>'+(t === "asset" ? "시설 · 장비" : "매장 · 점포")+' — 미리 챙겨 두시면 빠릅니다</b></p>'+
    '<ul>'+L.map(function(x){ return '<li>'+icon("check",14)+'<span>'+esc(x)+'</span></li>'; }).join("")+'</ul></div>';
}

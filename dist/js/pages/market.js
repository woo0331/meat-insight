

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
  var list = amStores(f);

  var all  = amStores(base);
  return PgHero({
    kicker:"점포 · 상가 · 매장 양도",
    h1raw:"자리부터 정합니다.",
    lead:"지역 · 업종 · 평수 · 보증금 · 월세 · 권리금 · 영업기간으로 찾습니다. 시설을 그대로 인수할 수 있는 매장만 따로 보실 수도 있습니다.",
    tight:true,
    cta:'<a class="btn btn-o btn-lg" href="/sell">내 매장 내놓기'+icon("arrow",18)+'</a>'
  })+
  '<section class="sec sec-white"><div class="w">'+

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
      : Empty({
          icon:"key",
          title:"조건에 맞는 매장이 아직 없습니다",
          text:"없는 매물을 지어내지 않습니다. 찾으시는 조건을 남겨 두시면 "+
               "올라오는 대로 알려 드리고, 정리하시는 중이라면 지금 등록하실 수 있습니다.",
          reads: amContentsFor({ cat:"store", side:"start", industry:ind, limit:3 }),
          readTitle:"자리를 보러 가시기 전에",
          cta:'<a class="btn btn-b" href="'+esc(quoteTo({side:"start",industry:ind,region:reg}))+'">'+
              '찾는 조건 남기기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/sell">내 매장 내놓기</a>'
        }))+
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

function PageAssets(){
  var ind = nowQS("i"), reg = nowQS("r"), cat = nowQS("c"), sub = nowQS("s");
  var dl = nowQS("dl"), pr = nowQS("pr");
  var base = { industry:ind||null, region:reg||null, cat:cat||null, sub:sub||null };
  var list = amAssets({ industry:ind||null, region:reg||null, cat:cat||null, sub:sub||null,
                        deal:dl||null, pr:pr||null });
  var all  = amAssets(base);
  var indObj = ind ? amIndustry(ind) : null;
  return PgHero({
    kicker:"시설 · 집기 · 재고",
    h1raw:"한 사장님의 끝이<br class=\"br-m\"> <em>다른 사장님의 시작</em>이 됩니다.",
    lead:"정리하시는 사장님이 내놓은 주방장비 · 커피머신 · 가구 · POS · 운동기구 · 미용기기와 남은 재고입니다. 개별로도, 일괄로도, 시설 전체 인수로도 거래하실 수 있습니다.",
    tight:true,
    cta:'<a class="btn btn-o btn-lg" href="/sell?t=asset">내 시설 내놓기'+icon("arrow",18)+'</a>'
  })+
  '<section class="sec sec-white"><div class="w">'+
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
      : Empty({
          icon:"box",
          title:"조건에 맞는 시설 · 집기가 아직 없습니다",
          text:"없는 매물을 지어내지 않습니다. 정리하시는 중이라면 지금 등록하실 수 있고, "+
               "찾으시는 것이 있으면 조건을 남겨 두시면 올라오는 대로 알려 드립니다.",
          reads: amContentsFor({ cat:"asset", side:"close", industry:ind, limit:3 }),
          readTitle:"장비를 사고 넘기기 전에",
          cta:'<a class="btn btn-b" href="/sell?t=asset">내 시설 내놓기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="'+esc(quoteTo({side:"start",industry:ind,region:reg}))+'">'+
              '찾는 조건 남기기</a>'
        }))+
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

function mkCount(shown, all){
  return '<span class="fil-n">'+shown+'건'+
    (all > shown ? '<em class="fil-off">거르개로 '+(all - shown)+'건 숨김</em>' : '')+
  '</span>';
}

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

function sellTabs(t){
  return '<nav class="chip-g chip-g-fil" aria-label="무엇을 내놓으시나요">'+
    SELL_TABS.map(function(x){
      return '<a class="chip'+(x.k === t ? " on" : "")+'" href="/sell?t='+x.k+'">'+
        esc(x.name)+'</a>'; }).join("")+
  '</nav>';
}

function PageSell(){
  var t = nowQS("t") === "asset" ? "asset" : "store";
  var ind = nowQS("i"), reg = nowQS("r");
  var ready = !!(window.WOW_BIZ && WOW_BIZ.sosReady);
  var isStore = t === "store";

  var fields = isStore
    ? '<div class="f-2">'+
        '<div class="f-r"><label for="sl-kind">거래 방식 <b>*</b></label>'+
          '<select class="sel" id="sl-kind">'+
            '<option value="transfer">매장 양도 — 권리금을 받고 넘깁니다</option>'+
            '<option value="lease">임대 — 보증금 · 월세로 내놓습니다</option>'+
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
    lead:"매장 · 시설 · 장비를 내놓으실 수 있습니다. 적어 주신 조건 그대로 올리고, 보시려는 분의 문의를 전달합니다. 무료입니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w form-wrap">'+
    sellTabs(t)+
    '<p class="note">'+esc(SELL_TABS.filter(function(x){
      return x.k === t; })[0].lead)+'</p>'+

    (ready ? "" :
      '<div class="notice-bad"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
        '<p>접수처 설정이 끝나면 바로 열립니다. 그동안에는 '+
        '<a href="/stores">지금 나와 있는 매장</a>이나 '+
        '<a href="/closure">폐업 · 정리에 필요한 것</a>을 먼저 '+
        '보실 수 있습니다.</p></div>')+

    '<div class="note-box">'+
      '<b>올리기 전에 한 번 연락드립니다.</b>'+
      '<p>적어 주신 내용은 바로 올라가지 않습니다. 저희가 보고 빠진 것을 '+
      '여쭌 다음에 올립니다. <b>연락처 · 상호 · 번지 주소는 매물에 '+
      '나가지 않습니다</b> — 지역은 시 · 군 · 구까지만 올리고, 보시려는 '+
      '분께 연락처를 전하는 것은 사장님이 그때 다시 동의하셔야 합니다.</p>'+
    '</div>'+

    '<form id="sl-f" onsubmit="return sellSend(event)">'+
      '<div class="f-2">'+
        '<div class="f-r"><label for="sl-ind">업종 <b>*</b></label>'+
          IndustrySelect("sl-ind", ind, "", "업종을 골라 주세요")+'</div>'+
        '<div class="f-r"><label for="sl-reg">지역 <b>*</b></label>'+
          RegionSelect("sl-reg", reg, "", "지역을 골라 주세요")+'</div>'+
      '</div>'+
      '<div class="f-r"><label for="sl-gu">시 · 군 · 구</label>'+
        '<input id="sl-gu" autocomplete="address-level2" placeholder="예: 안양시">'+
        '<span class="f-h">번지까지는 적지 마세요. 화면에는 시 · 군 · 구까지만 나갑니다.</span></div>'+

      fields+

      '<div class="f-r"><label for="sl-q">설명 <b>*</b></label>'+
        '<textarea id="sl-q" rows="6" required '+
          'placeholder="상태와 넘기시는 까닭, 보실 수 있는 시간을 적어 주세요. 양식이 없어도 됩니다."></textarea></div>'+
      '<div class="f-r"><label for="sl-img">사진 주소</label>'+
        '<input id="sl-img" placeholder="공유 링크가 있으면 붙여 주세요 (선택)">'+
        '<span class="f-h">파일을 받아 둘 곳이 아직 없어서 주소로 받습니다.</span></div>'+

      '<div class="f-2">'+
        '<div class="f-r"><label for="sl-name">성함 <b>*</b></label>'+
          '<input id="sl-name" required autocomplete="name"></div>'+
        '<div class="f-r"><label for="sl-tel">연락처 <b>*</b></label>'+
          '<input id="sl-tel" type="tel" required autocomplete="tel" '+
            'placeholder="010-0000-0000"></div>'+
      '</div>'+

      AgreeBox("sl-ag","성함 · 연락처 · 업종 · 지역 · 적어 주신 매물 조건과 설명",
               "매물 등록 확인과 문의 전달","등록을 내리신 날로부터 1년")+
      '<div id="sl-fail"></div>'+
      '<button class="btn btn-b btn-lg btn-full" type="submit"'+(ready?"":" disabled")+'>'+
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

  var need = [["sl-ind","업종"],["sl-reg","지역"],
              ["sl-q","설명"],["sl-name","성함"],["sl-tel","연락처"]];
  if(!isStore) need.unshift(["sl-item","무엇을 내놓으시는지"]);
  for(var i=0;i<need.length;i++){
    if(!$(need[i][0]).value.trim()){
      toast(need[i][1]+"을(를) 적어 주세요"); $(need[i][0]).focus(); return false; }
  }
  var v = function(id){ var e = $(id); return e ? e.value.trim() : ""; };
  var ind = v("sl-ind"), reg = v("sl-reg");
  var detail = isStore
    ? { "거래 방식": $("sl-kind").value === "lease" ? "임대" : "매장 양도",
        "업종": ind ? amIndustryName(ind) : "", "시군구": v("sl-gu"),
        "평수": v("sl-py"), "보증금": v("sl-dep"), "월세": v("sl-rent"),
        "권리금": v("sl-pm"), "시설 인수비": v("sl-eqc"),
        "시설 포함": $("sl-eq").checked ? "그대로 두고 갑니다" : "",
        "문 연 해": v("sl-since"), "넘기고 싶은 시점": v("sl-want"),
        "월 매출(사장님이 적으신 값)": v("sl-sales"), "사진 주소": v("sl-img") }
    : { "품목": v("sl-item"),
        "거래 단위": { single:"낱개", bulk:"묶음", all:"시설 전체" }[$("sl-deal").value] || "",
        "업종": ind ? amIndustryName(ind) : "", "시군구": v("sl-gu"),
        "제조사": v("sl-brand"), "연식": v("sl-year"), "수량": v("sl-cnt"),
        "희망가": v("sl-price"), "상태": v("sl-state"), "사진 주소": v("sl-img") };

  detail = amDropEmpty(detail);

  return amSend("sl-fail", {
    kind: "quote",
    name:  v("sl-name"),
    tel:   v("sl-tel"),
    region: reg ? amRegionName(reg) : "",
    service: "", serviceName: isStore ? "매장 내놓기" : "시설 · 장비 내놓기",
    q: v("sl-q"),
    budget: "",
    detail: detail,
    agree: true
  }, "sellSend");
};

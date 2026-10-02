/* ════════════════════════════════════════════════════════════════════
   점포 · 상가 · 매장 양도 (§9 · §23) / 시설 · 집기 · 재고 (§24 · §25)

   **여기가 창업과 폐업이 만나는 자리입니다** (§34).

   ⚠️⚠️ **매물을 지어내지 않습니다.** 가짜 매물은 허위매물이고, 보고
   연락한 사람의 시간을 훔치는 일입니다. 지금 0 건이고 화면은 0 이라고
   말합니다.
   ⚠️ **중고거래 사이트처럼 보이게 만들지 마세요** (§54). 여기 올라오는
   것은 "쓰던 물건" 이 아니라 **사업을 정리하면서 나오는 자산**입니다.
   그래서 업종 · 평수 · 운영기간 · 시설 포함 여부를 같이 답니다.
   ⚠️ **부동산 매물사이트처럼 만들지 마세요** (§54). 지도와 목록이
   주인공이 아니라 **업종과 상황**이 주인공입니다.
   ⚠️ 매출 · 권리금은 **사장님이 적으신 값**입니다. 우리가 보증하지
   않습니다 — 화면에 그렇게 적습니다.
   ════════════════════════════════════════════════════════════════════ */

function PageStores(){
  var ind = nowQS("i"), reg = nowQS("r");
  var list = amStores({ industry:ind||null, region:reg||null });
  return PgHero({
    kicker:"점포 · 상가 · 매장 양도",
    h1raw:"자리부터 정합니다.",
    lead:"지역 · 업종 · 평수 · 보증금 · 월세 · 권리금으로 찾습니다. 시설을 그대로 인수할 수 있는 매장도 함께 봅니다.",
    tight:true,
    cta:'<a class="btn btn-o btn-lg" href="'+esc(quoteTo({side:"close"}))+'">내 매장 내놓기'+icon("arrow",18)+'</a>'
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<div class="fil"><span class="fil-ic" aria-hidden="true">'+icon("sliders",18)+'</span>'+
      IndustrySelect("fil-i", ind, "mkGo('/stores')")+
      RegionSelect("fil-r", reg, "mkGo('/stores')")+
      '<span class="fil-n">'+list.length+'건</span></div>'+
    (list.length
      ? '<div class="mk-g">'+list.slice(0, amShown(list.length)).map(StoreCard).join("")+'</div>'+
        MoreBtn(list.length)
      : Empty({
          icon:"key",
          title:"조건에 맞는 매장이 아직 없습니다",
          text:"없는 매물을 지어내지 않습니다. 찾으시는 조건을 남겨 두시면 "+
               "올라오는 대로 알려 드리고, 정리하시는 중이라면 지금 등록하실 수 있습니다.",
          cta:'<a class="btn btn-b" href="'+esc(quoteTo({side:"start",industry:ind,region:reg}))+'">'+
              '찾는 조건 남기기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/closure">내 매장 내놓기</a>'
        }))+
  '</div></section>'+
  BridgeNote()+
  /* 자리를 보러 오신 분께 계약 전에 확인할 것을 냅니다 —
     이 화면이 `store` 분류의 진짜 주소라 `/c/store` 가 아니라
     여기에 붙습니다 */
  ReadBand({ cat:"store", side:"start", industry:ind,
             title:"계약 전에 확인하실 것" });
}

function StoreCard(s){
  /* ⚠️ **값이 없는 항목은 줄째 뺍니다** (절대 규칙 2). 전에는 업종과
     지역을 " · " 로 그냥 이어서, 지역을 안 적은 매물에 **구분점이
     매달려** "카페 · " 로 나왔습니다 — 매물이 0건이라 아무도 못 봤습니다. */
  var meta = [amIndustryName(s.industry), amRegionName(s.region, s.gu)].filter(Boolean);
  var m = [];
  if(s.pyeong)  m.push(s.pyeong+"평");
  if(s.deposit != null) m.push("보증 "+won(s.deposit)+"만");
  if(s.rent    != null) m.push("월 "+won(s.rent)+"만");
  if(s.premium != null) m.push("권리 "+won(s.premium)+"만");
  return '<a class="mk" href="/s/'+esc(s.id)+'">'+
    '<span class="mk-ph">'+((s.images||[]).length
      ? '<img class="ph" src="'+esc(s.images[0])+'" alt="'+esc(s.title)+'" loading="lazy" decoding="async">'
      : '<span class="ph ph-none" aria-hidden="true"></span>')+'</span>'+
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
  var list = amAssets({ industry:ind||null, region:reg||null, cat:cat||null, sub:sub||null });
  var indObj = ind ? amIndustry(ind) : null;
  return PgHero({
    kicker:"시설 · 집기 · 재고",
    h1raw:"한 사장님의 끝이<br class=\"br-m\"> <em>다른 사장님의 시작</em>이 됩니다.",
    lead:"정리하시는 사장님이 내놓은 주방장비 · 커피머신 · 가구 · POS · 운동기구 · 미용기기와 남은 재고입니다. 개별로도, 일괄로도, 시설 전체 인수로도 거래하실 수 있습니다.",
    tight:true,
    cta:'<a class="btn btn-o btn-lg" href="/closure">내 시설 내놓기'+icon("arrow",18)+'</a>'
  })+
  '<section class="sec sec-white"><div class="w">'+
    (indObj && indObj.equip.length ? '<ul class="chip-g chip-g-fil">'+
      '<li><a class="chip'+(sub?"":" on")+'" href="/assets?i='+encodeURIComponent(ind)+'">전체</a></li>'+
      indObj.equip.map(function(e){
        return '<li><a class="chip'+(sub===e.key?" on":"")+'" href="/assets?i='+
          encodeURIComponent(ind)+'&s='+encodeURIComponent(e.key)+'">'+esc(e.name)+'</a></li>';
      }).join("")+'</ul>' : "")+
    '<div class="fil"><span class="fil-ic" aria-hidden="true">'+icon("sliders",18)+'</span>'+
      IndustrySelect("fil-i", ind, "mkGo('/assets')")+
      RegionSelect("fil-r", reg, "mkGo('/assets')")+
      '<span class="fil-n">'+list.length+'건</span></div>'+
    (list.length
      ? '<div class="mk-g">'+list.slice(0, amShown(list.length)).map(AssetCard).join("")+'</div>'+
        MoreBtn(list.length)
      : Empty({
          icon:"box",
          title:"조건에 맞는 시설 · 집기가 아직 없습니다",
          text:"없는 매물을 지어내지 않습니다. 정리하시는 중이라면 지금 등록하실 수 있고, "+
               "찾으시는 것이 있으면 조건을 남겨 두시면 올라오는 대로 알려 드립니다.",
          cta:'<a class="btn btn-b" href="/closure">내 시설 내놓기'+icon("arrow",16)+'</a>'+
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
  return '<a class="mk" href="/a/'+esc(a.id)+'">'+
    '<span class="mk-ph">'+((a.images||[]).length
      ? '<img class="ph" src="'+esc(a.images[0])+'" alt="'+esc(a.title)+'" loading="lazy" decoding="async">'
      : '<span class="ph ph-none" aria-hidden="true"></span>')+'</span>'+
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

window.mkGo = function(base){
  var i = $("fil-i"), r = $("fil-r"); var q = [];
  if(i && i.value) q.push("i="+encodeURIComponent(i.value));
  if(r && r.value) q.push("r="+encodeURIComponent(r.value));
  go(base+(q.length ? "?"+q.join("&") : ""));
};

/* ⚠️ 중개자라는 사실과, 적힌 값이 누구 것인지를 같이 말합니다 */
function BridgeNote(){
  return '<section class="sec sec-note"><div class="w">'+
    '<p class="note note-box">여기 적힌 평수 · 보증금 · 월세 · 권리금 · 매출은 '+
      '<b>올리신 사장님이 적은 값</b>이고, 저희가 확인하거나 보증하는 값이 아닙니다. '+
      '저희는 통신판매중개자이며 거래 당사자가 아닙니다 — 계약 전에 반드시 '+
      '현장과 서류를 직접 확인하세요.</p>'+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   /s/:id — 점포 상세 · /a/:id — 시설 상세
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **`amStore()` 와 `amAsset()` 은 아무 데서도 안 불리고 있었습니다.**
   한 건을 찾아 오는 함수가 처음부터 있었는데 그걸 쓰는 화면이 없었고,
   카드는 `<div>` 라 **열리지 않았습니다.** 그래서 사장님이 적어 주신
   `text`(설명) · `images`(사진 둘째 장부터) · `sales`(매출) ·
   `equipCost` · `months` · `wantAt` · `fc` · `brand` · `count` ·
   `state` · `nego` · `storeId` 가 **전부 죽은 칸**이었습니다 —
   `gu` 가 그랬던 것과 같은 사고이고, 매물이 0건이라 아무도 못 봤습니다.

   ⚠️ **적는 것은 전부 올리신 사장님이 적은 값**입니다. 평수 · 보증금 ·
   월세 · 권리금 · 매출을 우리가 확인하거나 보증하지 않습니다 — 화면이
   그렇게 밝힙니다 (전자상거래법 제20조 제1항 · 약관 제5조).
   ⚠️⚠️ **연락처 · 상호 · 번지까지의 주소를 내지 않습니다.** 스키마에
   그런 칸이 없는 것이 맞습니다 — 매물을 보고 바로 전화가 가면 중개가
   아니고, 올리신 사장님의 개인정보가 공개되는 것입니다. 연결은 문의를
   받아서 합니다.
   ⚠️ **결정에 쓰는 값이 위로 옵니다** — 조건표가 사진·설명보다 먼저입니다. */

/* 조건표 한 벌 — 값이 없는 칸은 **아예 안 들어갑니다** (절대 규칙 2).
   ⚠️ `0` 은 값입니다 ("권리금 0" 은 "권리금 없음" 이라는 뜻이라 뺄 수
   없습니다). 그래서 `!= null` 로 봅니다. */
function mkSpecs(rows){
  var on = rows.filter(function(r){ return r[1] !== null && r[1] !== undefined && r[1] !== ""; });
  if(!on.length) return "";
  return '<ul class="mk-sp">'+on.map(function(r){
    return '<li><span class="mk-sp-l">'+esc(r[0])+'</span>'+
      '<span class="mk-sp-v">'+esc(String(r[1]))+'</span></li>';
  }).join("")+'</ul>';
}

/* 사진 — 첫 장은 카드에서 봤으니 여기서는 전부 냅니다.
   ⚠️ `object-fit:cover` 를 반드시 줍니다 — `<img class="ph">` 는 기본값이
   `fill` 이라 안 주면 사진이 비율을 무시하고 늘어납니다. CSS 의
   `.mk-gal .ph` 가 들고 있습니다. */
function mkGallery(images, alt){
  var L = (images||[]).filter(Boolean);
  if(!L.length) return "";
  return '<div class="pv-sec"><h2>사진</h2><div class="mk-gal">'+
    L.slice(0, 8).map(function(src){
      return '<img class="ph" src="'+esc(src)+'" alt="'+esc(alt)+'" loading="lazy" decoding="async">';
    }).join("")+'</div>'+
    '<p class="note">올리신 사장님이 올린 사진입니다.</p></div>';
}

/* 중개자 고지 — 전자상거래법 제20조 제1항. 매물 화면마다 같은 말입니다. */
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
  /* ⚠️ 조건을 견적 화면까지 그대로 넘깁니다 — 업체 상세에서 `quoteTo({})`
     로 두어 빈 화면이 떴던 것과 같은 자리입니다. */
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

    /* ⚠️ 결정에 쓰는 값이 맨 위입니다 */
    mkSpecs([
      ["면적",      s.pyeong  != null ? s.pyeong + "평" : null],
      ["보증금",    s.deposit != null ? won(s.deposit) + "만원" : null],
      ["월세",      s.rent    != null ? won(s.rent) + "만원" : null],
      ["권리금",    s.premium != null ? won(s.premium) + "만원" : null],
      ["시설 인수비", s.equipCost != null ? won(s.equipCost) + "만원" : null],
      ["운영 기간",  s.since ? s.since + "년부터" : (s.months ? s.months + "개월" : null)],
      ["넘기고 싶은 시점", s.wantAt || null]
    ])+

    /* ⚠️⚠️ **매출은 확인할 방법이 없습니다.** 숫자만 적어 두면 그 숫자를
       믿고 권리금을 주게 됩니다 — 반드시 누가 적은 값인지 같이 냅니다. */
    (s.sales != null ? '<div class="pv-sec"><h2>매출</h2>'+
      '<p class="mk-sales">월 '+esc(won(s.sales))+'만원</p>'+
      '<p class="note">사장님이 적으신 값입니다. 저희가 확인한 값이 아닙니다 — '+
      '계약 전에 카드 매출 자료 · 부가세 신고서로 직접 확인하세요.</p></div>' : '')+

    (s.text ? '<div class="pv-sec"><h2>사장님 설명</h2>'+
      '<p class="mk-text">'+esc(s.text)+'</p></div>' : '')+

    mkGallery(s.images, s.title + " 매장 사진")+

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
  /* ⚠️ `a.sub` 는 **key** 입니다 (`espresso`). 그대로 찍으면 화면에 영문이
     나옵니다 — 포트폴리오에서 `gyeonggi` 가 나왔던 것과 같습니다. */
  var subName = (typeof amEquipName === "function") ? amEquipName(a.sub) : "";
  if(subName) tags.push(subName);
  /* 같은 가게에서 나온 것 — `storeId` 는 적어 받아 놓고 아무 데서도
     안 읽던 칸입니다. 일괄로 보시려는 분에게는 이게 결정적입니다. */
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

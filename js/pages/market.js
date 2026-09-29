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
      ? '<div class="mk-g">'+list.map(StoreCard).join("")+'</div>'
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
  var m = [];
  if(s.pyeong)  m.push(s.pyeong+"평");
  if(s.deposit != null) m.push("보증 "+won(s.deposit)+"만");
  if(s.rent    != null) m.push("월 "+won(s.rent)+"만");
  if(s.premium != null) m.push("권리 "+won(s.premium)+"만");
  return '<div class="mk">'+
    '<span class="mk-ph">'+((s.images||[]).length
      ? '<img class="ph" src="'+esc(s.images[0])+'" alt="'+esc(s.title)+'" loading="lazy" decoding="async">'
      : '<span class="ph ph-none" aria-hidden="true"></span>')+'</span>'+
    '<div class="mk-b">'+
      '<span class="mk-m">'+esc(amIndustryName(s.industry))+' · '+
        esc(amRegionName(s.region, s.gu))+(s.withEquip?' · <em>시설 인수 가능</em>':'')+'</span>'+
      '<b>'+esc(s.title)+'</b>'+
      '<span class="mk-p">'+esc(m.join(" · "))+'</span>'+
    '</div></div>';
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
      ? '<div class="mk-g">'+list.map(AssetCard).join("")+'</div>'
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
  return '<div class="mk">'+
    '<span class="mk-ph">'+((a.images||[]).length
      ? '<img class="ph" src="'+esc(a.images[0])+'" alt="'+esc(a.title)+'" loading="lazy" decoding="async">'
      : '<span class="ph ph-none" aria-hidden="true"></span>')+'</span>'+
    '<div class="mk-b">'+
      '<span class="mk-m">'+esc(amIndustryName(a.industry))+' · '+
        esc(amRegionName(a.region, a.gu))+(deal?' · <em>'+esc(deal.name)+'</em>':'')+'</span>'+
      '<b>'+esc(a.title)+'</b>'+
      '<span class="mk-p">'+(a.price != null ? esc(won(a.price))+'만원' : '가격 협의')+
        (a.year ? ' · '+esc(String(a.year))+'년식' : '')+'</span>'+
    '</div></div>';
}

window.mkGo = function(base){
  var i = $("fil-i"), r = $("fil-r"); var q = [];
  if(i && i.value) q.push("i="+encodeURIComponent(i.value));
  if(r && r.value) q.push("r="+encodeURIComponent(r.value));
  go(base+(q.length ? "?"+q.join("&") : ""));
};

/* ⚠️ 중개자라는 사실과, 적힌 값이 누구 것인지를 같이 말합니다 */
function BridgeNote(){
  return '<section class="sec"><div class="w">'+
    '<p class="note note-box">여기 적힌 평수 · 보증금 · 월세 · 권리금 · 매출은 '+
      '<b>올리신 사장님이 적은 값</b>이고, 저희가 확인하거나 보증하는 값이 아닙니다. '+
      '저희는 통신판매중개자이며 거래 당사자가 아닙니다 — 계약 전에 반드시 '+
      '현장과 서류를 직접 확인하세요.</p>'+
  '</div></section>';
}

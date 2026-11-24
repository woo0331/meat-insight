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
  var pk = nowQS("pk") === "1", kd = nowQS("kd");
  /* 시설 · 집기를 그대로 인수할 수 있는 매장만 (2026-10-05 V2 §7).
     ⚠️ `amStores()` 는 **적은 매물만** 집습니다 — 안 적은 것을
     "포함" 으로 읽으면 보러 가신 분이 헛걸음합니다. */
  var eq = nowQS("eq") === "1";
  var rng = {};
  (window.AM_STORE_RANGES||[]).forEach(function(g){ rng[g.key] = nowQS(g.key); });
  var base = { industry:ind||null, region:reg||null };
  var f = { industry:ind||null, region:reg||null, parking:pk, kind:kd||null,
            withEquip:eq };
  (window.AM_STORE_RANGES||[]).forEach(function(g){ if(rng[g.key]) f[g.key] = rng[g.key]; });
  /* 2026-11-19 공개 화면 완성도 §3 — 매물 데이터를 못 읽은 것(스크립트 실패)을 "0건" 으로 말하지 않습니다.
     ⚠️ 데이터와 함수가 같은 파일(js/data/market.js)이라, 그 파일이 안 오면 amStores 가 없습니다. */
  var loaded = (typeof amStores === "function") && Array.isArray(window.AM_STORES);
  var list = loaded ? amStores(f) : [];
  /* ⚠️ 지역 · 업종만 건 수 — 구간 거르개가 몇 건을 숨겼는지 밝히려고 */
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
    /* 거르개 — 2026-10-05 V2 §7.
       ⚠️⚠️ **월매출로는 안 거릅니다.** 올리신 사장님이 적은 값이라
       확인할 방법이 없는데 거르개로 만들면 그 숫자가 사실처럼 읽힙니다 —
       화면이 그 값을 낼 때마다 누구 값인지 밝히는 것과 같은 까닭입니다. */
    '<div class="fil fil-wrap"><span class="fil-ic" aria-hidden="true">'+icon("sliders",18)+'</span>'+
      IndustrySelect("fil-i", ind, "mkGo('/stores')")+
      RegionSelect("fil-r", reg, "mkGo('/stores')")+
      '<select class="sel" id="fil-kd" aria-label="거래 방식" onchange="mkGo(\'/stores\')">'+
        /* ⚠️ 딱지를 길게 적으면 **폰에서 잘립니다** — 390px 에서
           "양도 · 임대 전체" 가 "양도 · 임대 전" 으로 나왔습니다.
           옆 칸들과 같은 "<무엇> 전체" 꼴로 맞춥니다. */
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
      /* 2026-11-19 — 전체 0건과 거르개 결과 0건을 가릅니다 (같은 말이면 조건을 바꿔 볼지 말지를 모릅니다).
         ⚠️ 매물 수를 채우지 않습니다 — 0 은 0 입니다. */
      /* 2026-11-19 — 셋을 가릅니다: ① 불러오지 못함 ② 전체 0건 ③ 거르개 결과 0건.
         같은 말이면 조건을 바꿔 볼지, 기다릴지, 새로 불러올지를 모릅니다.
         ⚠️ 매물 수를 채우지 않습니다 — 0 은 0 입니다. */
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
  /* ⚠️ 사진이 없으면 액자를 안 그립니다 (업체 카드와 같은 까닭) */
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

/* ── 어떤 집기를 정리하시나요? (2026-11-24 폐업 → 집기 처분 동선) ─────────
   /closure 의 '집기 · 설비 처분' 이 도착하는 자리입니다 (/assets?p=pick).
   ⚠️⚠️ **새 분류도 새 저장소도 아닙니다.** 품목은 catalog.js 의 asset 분류
   하위 아홉 그대로(서비스 코드 asset/<key>)이고, 고른 것은 전문관과 같은
   바구니(am.pick.v1)에 담깁니다 — 신청 화면 · 관리자 접수함이 이미 그 코드를 읽습니다.
   ⚠️ 이름은 catalog.js 에서 옵니다. 여기 적는 것은 **사진 · 아이콘 · 한 줄 설명**뿐입니다.
   ⚠️⚠️ 사진은 **그 품목이 바로 보이는 것만** 씁니다 (지금 둘 — 주방장비 · POS).
   없으면 빈 액자 대신 아이콘 면이 자리를 지킵니다 (절대 규칙 2).
   ⚠️ 접수가 닫혀 있으면 고르기 **전에** 알리고, 다음 단추는 '접수 안내 보기'와
   실제로 쓸 수 있는 준비 자료입니다. 지역은 여기서 묻지 않습니다 — 실제 신청 화면이 받습니다.
   ⚠️ '매입 업체 찾기' 는 내지 않습니다 — asset 은 매물(listing) 분류라 조회할 업체가 없습니다. */
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
    /* ⚠️ 집기 자리(as-*)는 자기 슬롯의 sizes 를, 다른 화면과 같이 쓰는 둘(svc-equip · kp-op-svc-pos)만 이 칸 크기를 넘깁니다 */
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
    /* ⚠️ 고르기 **전에** 접수 상태를 알립니다 (data-cta 짝 · 닫혀 있을 때만 보임) */
    '<p class="asp-closed" data-cta="off" data-cta-form="close">'+icon("info",18)+
      '<span>지금은 집기 처분 신청을 받지 않습니다. 고르신 품목은 이 기기에 남고, '+
      '접수가 열리면 그대로 신청하실 수 있습니다.</span></p>'+
    '<ul class="asp-g">'+cards+'</ul>'+
    /* 요약 — 고른 집기가 없으면 통째로 숨깁니다 (aspPaint) */
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
/* pickPaint() 가 끝에 부릅니다 — 요약 목록 · 개수 · 해제 단추를 제자리에서 고칩니다 */
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
  /* 2026-11-24 — 폐업의 '집기 · 설비 처분' 은 ?p=pick 으로 옵니다: 품목 고르기가 **맨 위**(h1)이고
     매물 머리는 안 냅니다 (h1 은 화면에 하나). 그냥 /assets 로 오면 머리 바로 아래에 같은 고르기가 섭니다. */
  var pickTop = nowQS("p") === "pick";
  return (pickTop ? AssetPickBand(true) : PgHero({
    kicker:"시설 · 집기 · 재고",
    h1raw:"한 사장님의 끝이<br class=\"br-m\"> <em>다른 사장님의 시작</em>이 됩니다.",
    lead:"정리하시는 사장님이 내놓은 주방장비 · 커피머신 · 가구 · POS · 운동기구 · 미용기기와 남은 재고입니다. 개별로도, 일괄로도, 시설 전체 인수로도 거래하실 수 있습니다.",
    tight:true,
    cta:'<a class="btn btn-o btn-lg" href="/sell?t=asset">내 시설 내놓기'+icon("arrow",18)+'</a>'
  }) + AssetPickBand(false))+
  '<section class="sec sec-white"><div class="w">'+
    (pickTop ? '<div class="sec-hd"><p class="eyebrow">시설 · 집기 · 재고</p><h2>올라와 있는 시설 · 집기</h2></div>' : '')+
    (indObj && indObj.equip.length ? '<ul class="chip-g chip-g-fil">'+
      '<li><a class="chip'+(sub?"":" on")+'" href="'+esc(mkKeep("/assets",{s:""}))+'">전체</a></li>'+
      indObj.equip.map(function(e){
        return '<li><a class="chip'+(sub===e.key?" on":"")+'" href="'+
          esc(mkKeep("/assets",{s:e.key}))+'">'+esc(e.name)+'</a></li>';
      }).join("")+'</ul>' : "")+
    '<div class="fil fil-wrap"><span class="fil-ic" aria-hidden="true">'+icon("sliders",18)+'</span>'+
      /* ⚠️⚠️ 고른 장비 칩(`?s=`)과 종류(`?c=`)를 **숨은 칸으로 들고
         갑니다.** 안 들고 가면 지역을 바꾸는 순간 칩이 조용히 꺼지고,
         손님은 자기가 끈 줄 모르고 결과가 늘어난 것만 봅니다 —
         `/providers/:cat` 에서 하위 분류를 그렇게 지키고 있습니다. */
      '<input type="hidden" id="fil-c" value="'+esc(cat)+'">'+
      '<input type="hidden" id="fil-s" value="'+esc(sub)+'">'+
      IndustrySelect("fil-i", ind, "mkGo('/assets')")+
      RegionSelect("fil-r", reg, "mkGo('/assets')")+
      '<select class="sel" id="fil-dl" aria-label="거래 단위" onchange="mkGo(\'/assets\')">'+
        /* ⚠️ 딱지를 길게 적으면 **360px 에서 잘립니다** — "낱개 · 일괄
           전체" 가 97px 인데 칸이 90px 이었습니다. select 안이라 낱말
           잘림 검사도 가로 스크롤 검사도 안 걸립니다 (재 봐야 압니다).
           옆 칸들과 같은 "<무엇> 전체" 꼴로 맞춥니다. */
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

/* ── 매물 거르개 (2026-10-05 V2 §7) ──────────────────────────────
   ⚠️⚠️ **주소에 전부 실립니다.** 뒤로 가기 · 새로고침 · 링크 공유에
   살아남아야 "이 조건으로 본 것" 을 가족에게 보낼 수 있습니다.
   ⚠️ 칸 이름(`id`)이 곧 주소의 key 입니다 — `mkGo()` 가 한 곳에서
   읽어 모으기 때문에, 칸을 늘려도 거기만 고치면 됩니다. */
/* ⚠️ 구간 거르개 key(`py` · `dp` · `rt` · `pm` · **`yr`**)와 체크칸
   (`pk` · **`eq`**)을 여기 안 적으면, 칩을 누르는 순간 **켜 둔
   거르개가 조용히 꺼집니다** — 손님은 자기가 끈 줄 모르고 결과가
   늘어난 것만 봅니다. */
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

/* 켜 둔 거르개는 그대로 두고 **한 칸만** 바꾼 주소를 만듭니다.
   ⚠️ 칩을 누를 때 나머지가 꺼지면, 손님은 자기가 끈 줄 모르고 결과가
   늘어난 것만 봅니다. 빈 문자열을 주면 그 칸만 끕니다. */
function mkKeep(base, over){
  var q = [];
  MK_KEYS.forEach(function(k){
    var v = (over && Object.prototype.hasOwnProperty.call(over, k))
      ? over[k] : nowQS(k);
    if(v) q.push(k + "=" + encodeURIComponent(v));
  });
  return base + (q.length ? "?" + q.join("&") : "");
}

/* 구간 고르개 하나 — ⚠️ 이름을 손으로 적지 마세요. `market.js` 의
   `AM_STORE_RANGES` 한 곳에서 옵니다. */
function mkRangeSel(g, val, base){
  return '<select class="sel" id="fil-'+esc(g.key)+'" aria-label="'+esc(g.name)+'" '+
    'onchange="mkGo(\''+esc(base)+'\')">'+
    '<option value="">'+esc(g.name)+' 전체</option>'+
    (g.opts||[]).map(function(o){
      return '<option value="'+esc(o.k)+'"'+(val===o.k?" selected":"")+'>'+
        esc(o.name)+'</option>';
    }).join("")+'</select>';
}
/* 체크 한 칸 — ⚠️ `<label>` 로 감싸 글자를 눌러도 켜집니다 (누름 44px) */
function mkCk(id, name, on, base){
  return '<label class="fil-ck'+(on?" on":"")+'">'+
    '<input type="checkbox" id="fil-'+esc(id)+'"'+(on?" checked":"")+
    ' onchange="mkGo(\''+esc(base)+'\')">'+
    '<span>'+esc(name)+'</span></label>';
}
/* 거르개로 몇 건이 빠졌는지 — ⚠️ 안 밝히면 손님은 원래 그만큼인 줄 압니다 */
function mkCount(shown, all){
  return '<span class="fil-n">'+shown+'건'+
    (all > shown ? '<em class="fil-off">거르개로 '+(all - shown)+'건 숨김</em>' : '')+
  '</span>';
}

/* ── 매물 0건 화면 (2026-11-24) — /stores · /assets 가 같이 씁니다 ─────────────
   셋을 가릅니다: ① 불러오지 못함 ② **조건 때문에 0건** ③ **전체가 0건**.
   ② 에서는 걸어 두신 조건을 칩으로 보여 주고 **하나씩 풀거나 한 번에 초기화**합니다
      (조건이 보이지 않으면 무엇을 바꿔야 할지 모릅니다 · 380px 고르개가 아홉 칸입니다).
   ③ 에서는 조건 탓이 아니라는 것을 밝히고, 내놓으려는 분께 **양도 준비 안내**(/transfer?t=out)를
      늘 보입니다 — 매물 등록(sell)이 닫혀 있으면 /sell 단추는 가려지는데 그러면 길이 없습니다.
   ⚠️ 매물 수를 채우지 않습니다 — 0 은 0 입니다 (절대 규칙 1). */
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
  var J = function(pair){ return typeof koWith === "function" ? koWith(o.what, pair) : o.what + pair.charAt(1); };
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
          /* ⚠️ 매물 등록(sell) 접수 상태를 따릅니다 — 닫혀 있으면 등록이 되는 것처럼 말하지 않고
             '접수 안내 보기'(/intake)로 잇습니다. /sell 단추는 열려 있을 때만 보입니다 (ctaTagLinks). */
          '<p class="mkz-sell">'+icon("store",16)+'<span>'+
            ctaPair("sell", "매장 · 시설을 내놓으시려면 아래에서 등록을 신청하실 수 있습니다. 넘기기 전에 맞출 것은 양도 준비 안내에 있습니다.",
                            "지금은 매물 등록 접수를 받지 않습니다. 내놓으시려는 분은 접수 안내와 양도 준비 안내를 먼저 보세요.")+'</span></p>'+
          '<a class="btn btn-o" href="'+esc(o.sell)+'">'+esc(o.sellName)+'</a>'+
          '<a class="btn btn-o" href="/intake" data-cta="off" data-cta-form="sell">접수 안내 보기</a>'+
          '<a class="btn btn-o" href="/transfer?t=out">양도 준비 안내 보기</a>' })+'</div>';
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
  /* ⚠️ 같은 가게에서 나온 시설 · 장비. 장비 상세의 `same` 과 **같은 규칙**
     입니다 — 두 곳에 다르게 적으면 한쪽에만 나오는 매물이 생깁니다. */
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

    /* 이 가게에서 같이 나온 시설 · 장비 — ⚠️⚠️ `storeId` 를 **장비 쪽에서만**
       읽고 있었습니다. 묶는 규칙은 같은데 길이 한 방향뿐이라, 매장을 보고
       계신 분은 "시설도 같이 넘기시나" 를 알 수가 없었습니다 (시설 인수비
       칸만 숫자로 보입니다). `gu` · `amStore()` · `withEquip` 과 같은
       **반쪽만 읽던 칸**입니다.
       ⚠️ 0건이면 구간째 뺍니다 (절대 규칙 2). */
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


/* ══════════════════════════════════════════════════════════════════
   매물 내놓기 (/sell) — **내놓는 길**입니다
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ 전에는 "매장 내놓기" 가 목록 화면(/stores)으로, "내 시설
   내놓기" 가 폐업 가이드(/closure)로 갔습니다 — 셋 다 **막다른 길**
   이었고, 내놓으시려는 사장님이 적을 자리가 일반 견적 폼 하나뿐이라
   평수 · 보증금 · 월세 · 권리금이 전부 줄글로 들어왔습니다.
   여기서 받는 칸은 market.js 의 생김새 그대로입니다 — 받은 그대로
   AM_STORES · AM_ASSETS 에 옮겨 적으면 됩니다.

   ⚠️⚠️ **바로 올라가지 않습니다.** 접수는 저장되지 않고 밖으로
   전달만 됩니다 (api/quote.js). 사람이 확인하고 올립니다 — 화면에도
   그렇게 적혀 있고, "올려 드립니다" 라고 단정하지 않습니다
   (절대 규칙 5).
   ⚠️⚠️ **연락처 · 상호 · 번지 주소는 매물에 안 나갑니다.** 지역은
   시 · 군 · 구까지입니다. 성함과 연락처는 저희가 연락드리려고 받는
   것이고, 보시려는 분께는 두 분이 동의하신 뒤에만 오갑니다
   (개인정보보호법 제17조).
   ⚠️ **첨부 칸을 만들지 마세요** — 파일을 받아 둘 곳이 없습니다.
   사진은 주소로 받습니다 (견적 요청과 같습니다). */
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
            /* ⚠️ 딱지를 길게 적지 마세요 — 320px 에서 칸이 214px 이라
               넘치면 **낱말 가운데서 잘립니다.** `<select>` 안은 낱말
               잘림 검사에도 가로 스크롤 검사에도 안 걸려서, 재는 것은
               전수 점검의 "고르개 딱지가 칸보다 긺" 하나뿐입니다
               (이 저장소가 네 번 겪은 자리). */
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
        /* ⚠️ 0 은 값입니다 — "무권리" 는 0 을 적으신 것이지 안 적으신
           것이 아닙니다 (화면도 그렇게 가릅니다). */
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
      /* ⚠️⚠️ **매출은 확인할 방법이 없는 값**입니다. 받되, 올릴 때
         "사장님이 적으신 값" 이라고 밝혀서 올립니다 — 적는 자리에서도
         미리 말씀드립니다. */
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

    (
      '<div class="notice-bad" data-cta="off" data-cta-form="sell"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
        '<p>접수처 설정이 끝나면 바로 열립니다. 그동안에는 '+
        '<a href="/stores">지금 나와 있는 매장</a>이나 '+
        '<a href="/closure">폐업·철거에 필요한 것</a>을 먼저 '+
        '보실 수 있습니다.</p></div>')+

    /* ⚠️⚠️ **먼저 밝히는 것이 폼 아래가 아니라 위입니다.** */
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
      '<button class="btn btn-b btn-lg btn-full" type="submit"'+' disabled data-gate="sell"'+'>'+
        (isStore ? "매장 내놓기" : "시설 · 장비 내놓기")+icon("arrow",18)+'</button>'+
      '<p class="note note-mid">내리고 싶으시면 같은 연락처로 말씀해 주세요. '+
        '오래된 매물을 그대로 두지 않습니다 — 올린 날짜를 화면에 같이 냅니다.</p>'+
    '</form>'+
  '</div></section>'+
  ReadBand({ cat:"transfer", side:"close",
             title:"넘기기 전에 알아 두면" });
}

/* ⚠️ **화면이 보내는 칸 = api/quote.js 가 읽는 칸.** 어긋나면 조용히
   사라집니다 — node tools/test-api.js 로 같이 확인하세요.
   ⚠️ detail 은 스물까지입니다 (매장이 열둘이라 상한에 닿아 있었습니다). */
window.sellSend = function(ev){
  ev.preventDefault();
  var $ = function(id){ return document.getElementById(id); };
  if(!$("sl-ag").checked){ toast("개인정보 수집 · 이용 동의가 필요합니다"); return false; }
  var isStore = !$("sl-item");
  /* ⚠️⚠️ **업종 · 지역은 반드시 받습니다.** 딱지에 `*` 만 붙여 두고
     안 막으면 둘 다 빈 채로 들어옵니다 — 그 매물은 거르개에서 빠지고
     (checkMarketData 가 빌드를 멈춥니다) 지역 없는 매물은 아무에게도
     안 보입니다. 지역은 매칭의 첫 번째 조건입니다. */
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
  /* 빈 칸은 보내지 않습니다 — 받아 보는 사람이 빈 줄을 세지 않게 */
  /* ⚠️⚠️ 빈 칸을 떨어내는 규칙은 `amDropEmpty()` **한 곳**입니다
     (`js/components/base.js`). 여기 따로 적혀 있던 것을 옮겼습니다 —
     그쪽은 `!detail[k]` 라 **숫자 0 이면 사라집니다.** 지금은 값이
     전부 문자열이라 "0" 이 살아남지만, 숫자를 담는 날 조용히
     깨지는 꼴이었습니다 (권리금 "무권리" 에서 겪은 자리). */
  detail = amDropEmpty(detail);

  /* ⚠️⚠️ **`cat` 과 `idem` 을 같이 보냅니다** (2026-10-26 · 보고서 §2-A).
     전에는 둘 다 안 보내서 **중복 방지가 한 번도 안 걸렸습니다** —
     `api/_intake.js` 의 `intakeDup()` 은
     `sameWhat = (offerId 둘 다 있으면) : (cat 둘 다 있으면) : false`
     라, 둘 다 비면 10분 창 검사에 **한 줄도 안 걸립니다.** 그러면
     신호가 약해 20초에 끊긴 것처럼 보여 다시 누르신 사장님의 매물이
     **두 건** 접수되고 직원이 두 번 전화합니다.
     ⚠️ `cat` 은 `catalog.js` 의 **진짜 분류 key** 입니다 (`kind:"listing"`) —
     매장은 `transfer`(매장 양도) · 시설 장비는 `asset`(시설 · 집기 처분).
     두 탭이 **다른 key** 라야 매장을 내놓고 이어서 장비를 내놓는 것이
     중복으로 안 걸립니다 (다른 상품이면 중복이 아닙니다).
     ⚠️⚠️ `idem` 의 `ns` 가 `/quote` 와 **달라야** 합니다 — 같으면 견적을
     보낸 뒤 매물을 내놓으러 오신 분이 같은 열쇠를 들고 가서, 서버가
     먼저 받은 접수번호를 돌려주고 끝냅니다.
     ⚠️ `detail` 칸 수는 그대로입니다 (매장 13 · 시설 10 · 상한 스물) —
     `cat` 과 `idem` 은 **맨 위 칸**이고 `detail` 안이 아닙니다. */
  var ns = isStore ? "sell-store" : "sell-asset";
  return amSend("sl-fail", {
    kind: "quote",
    form: "sell",   /* W01 — 서버 게이트가 견적과 매물 등록을 따로 엽니다 (api/_gate.js) */
    cat:  isStore ? "transfer" : "asset",
    idem: amIdem(ns),
    name:  v("sl-name"),
    tel:   v("sl-tel"),
    region: reg ? amRegionName(reg) : "",
    service: "", serviceName: isStore ? "매장 내놓기" : "시설 · 장비 내놓기",
    q: v("sl-q"),
    budget: "",
    detail: detail,
    agree: true
  }, "sellSend", function(){
    /* ⚠️⚠️ **성공한 뒤에만** 비웁니다. 실패했을 때 비우면 다시
       누르신 것이 **새 신청**이 되어 두 건이 됩니다 (적으신 것은
       `amSend()` 가 그대로 남겨 둡니다). */
    amIdemClear(ns);
  });
};

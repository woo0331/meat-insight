/* ════════════════════════════════════════════════════════════════════
   ProductCard · ProductGrid · ProductBadge · CategoryCard ·
   TrustBar · B2BBanner · EncyclopediaCard
   ════════════════════════════════════════════════════════════════════ */

var BDG = { "new":["NEW","bdg-new"], best:["BEST","bdg-best"],
            sale:["특가","bdg-sale"], out:["품절","bdg-out"] };

function ProductBadge(k){
  var b=BDG[k]; if(!b) return "";
  return '<span class="bdg '+b[1]+'">'+esc(b[0])+'</span>';
}

/* ⚠️ 부산물은 **당일 수급이라 품절이 잦습니다.** 품절인 줄 모르고
   주문했다가 "없는데요" 소리를 들으면 그 손님은 다시 안 옵니다.
   품절은 (1) 사진을 흐리게 (2) 배지를 달고 (3) **담기를 막습니다.**
   숨기지는 않습니다 — 없어진 줄 알고 딴 데 가는 것보다, 있다는 걸
   알고 다음에 오는 편이 낫습니다. */
window.isSoldOut = function(p){ return !!(p && p.soldOut); };

/* 상품 카드 — 시안 그대로: 사진 / 이름 / 원산지·온도·손질 / 원/kg / 담기 */
/* eager 는 **한 화면의 앞 네 장**까지만 (한 줄이 넷입니다).
   더 늘리면 첫 화면 밖 사진까지 먼저 받아 오히려 느려집니다. */
function ProductCard(p, i){
  var meta=[p.origin, WOW_TEMP[p.temp], WOW_TRIM[p.trim]].filter(Boolean).join(" · ");
  var out = isSoldOut(p);
  var bd = (p.badges||[]).slice();
  if(out) bd = ["out"];          /* 품절이면 NEW·BEST 는 지웁니다 — 못 사는데 부추기면 안 됩니다 */
  return '<article class="pc'+(out?" out":"")+'">'+
    '<a class="pc-img" href="/p/'+esc(p.id)+'" aria-label="'+esc(p.name)+(out?" (품절)":"")+' 상세보기">'+
      imgTag(p.img, p.name, null, i < 4)+
      (bd.length?'<span class="pc-bd">'+bd.map(ProductBadge).join("")+'</span>':'')+
    '</a>'+
    '<div class="pc-b">'+
      '<a class="pc-nm" href="/p/'+esc(p.id)+'">'+esc(p.name)+'</a>'+
      '<div class="pc-mt">'+esc(meta)+'</div>'+
      '<div class="pc-f">'+
        '<div class="pc-pr">'+wowWon(p.price)+'원<em> /kg</em></div>'+
        (out
          ? '<span class="pc-out">품절</span>'
          : '<button class="pc-cart" onclick="addCart(\''+esc(p.id)+'\')" '+
            'aria-label="'+esc(p.name)+' 장바구니에 담기">'+icon("cart",20)+'</button>')+
      '</div>'+
    '</div></article>';
}

/* 그리드 — 비어 있으면 **빈 상자를 두지 않고** 갈 길을 줍니다. */
function ProductGrid(list, opt){
  opt = opt || {};
  if(!list.length){
    return '<div class="empty">'+
      '<div class="empty-t">'+esc(opt.emptyT||"조건에 맞는 상품이 없습니다")+'</div>'+
      '<div class="empty-d">'+esc(opt.emptyD||"조건을 줄이면 더 많은 부산물을 보실 수 있습니다.")+'</div>'+
      '<a class="btn btn-g" href="'+esc(opt.emptyTo||"/products")+'">전체상품 보기</a></div>';
  }
  /* ⚠️ map(ProductCard) 로 넘기면 두 번째 인자로 **번호가 같이** 갑니다.
     그게 여기서는 뜻이 있습니다 (앞 네 장을 먼저 받게). 다만 이 그리드가
     한 화면에 여럿 있으면 아래쪽 것도 "앞 네 장" 이 되므로,
     첫 그리드가 아닐 때는 opt.lazy 로 끕니다. */
  return '<div class="pg'+(opt.cols===3?" pg-3":"")+'">'+
    list.map(function(p,i){ return ProductCard(p, opt.lazy ? 99 : i); }).join("")+'</div>';
}

/* 퀵 카테고리 카드 — 컷아웃 일러스트 + 이름 */
function CategoryCard(c, i){
  return '<a class="qc" href="'+esc(c.to)+'">'+imgTag(c.img, c.name, null, i < 4)+
    '<b>'+esc(c.name)+'</b></a>';
}

/* 신뢰 띠 — 지시서 6번. 아이콘 + 제목 + 짧은 설명. */
var TRUST_HOME = [
  ["shield","도축장 직영","신선한 원물 공급"],
  ["drop",  "철저한 위생관리","안전한 가공"],
  ["box",   "업소용 대량구매","맞춤 상담"],
  ["truck", "전국 신선배송","안전 배송"]
];
function TrustBar(items){
  return '<div class="trust"><div class="w"><div class="trust-g">'+
    (items||TRUST_HOME).map(function(t){
      return '<div class="trust-i"><div class="trust-ic">'+icon(t[0],38)+'</div>'+
        '<b>'+esc(t[1])+'</b><span>'+esc(t[2])+'</span></div>';
    }).join("")+'</div></div></div>';
}

/* 업소용 배너 — 사업자 전용가·대량견적을 나중에 붙일 수 있게
   데이터(제목·본문·버튼)를 인자로 받습니다. */
function B2BBanner(o){
  o = o || {};
  return '<div class="bnr" style="background-image:url(/img/'+esc(o.img||"biz-banner")+'.jpg)">'+
    '<div class="bnr-in">'+
      '<h3>'+(o.title||'<em>업소용</em>으로 찾으시나요?')+'</h3>'+
      '<p>'+esc(o.desc||"식당 · 국밥집 · 곱창전문점 · 식자재업체를 위한 대용량 부산물 공급")+'</p>'+
      '<a class="btn btn-o btn-lg" href="'+esc(o.to||"/b2b")+'">'+
        esc(o.cta||"업소용 상품 보기")+icon("arrow",18)+'</a>'+
    '</div></div>';
}

/* 도감 카드 — 컷아웃 + 이름 */
/* ⚠️ 사진이 **있는 부위만** 사진을 씁니다. 없는 파일명을 적어 넣으면
   404 가 한 번 나고 카드가 빈 상자가 됩니다 — 화면에서는 "아직 안 만든
   사이트" 로 읽힙니다. 사진이 없으면 부위 위치 그림(PartThumb)으로
   대신합니다. 비슷하게 생겼다고 **남의 부위 사진을 돌려 쓰지 마세요.** */
function EncyclopediaCard(e, sp, i){
  return '<a class="qc" href="/enc/'+esc(sp)+'/'+esc(e.slug)+'">'+
    (e.img ? imgTag(e.img, e.name, null, i < 4) : PartThumb(sp, e))+
    '<b>'+esc(e.name)+'</b></a>';
}

/* ══ 배송 안내 ═══════════════════════════════════════════
   ⚠️ 신선식품은 **"몇 시까지 주문하면 언제 받는지"** 가 살지 말지를
   정합니다. 곱창집 사장님은 내일 장사에 쓸 것을 오늘 삽니다.

   적어 둔 것만 보여 줍니다. 마감 시간을 모르면서 "내일 도착" 이라고
   쓸 수는 없습니다 — 지어내는 것과 같습니다. */
function ShipNote(cls){
  var rows = [
    ["truck", "주문 마감", bizVal("shipCutoff")],
    ["box",   "배송",     bizVal("shipNote")],
    ["doc",   "배송 제한", bizVal("shipExclude")]
  ].filter(function(r){ return r[2]; });
  if(!rows.length){
    try{ console.warn("[ABOUTMEAT] 배송 안내가 비어 있습니다 — admin.html 에서 "+
      "shipCutoff(주문 마감) · shipNote(배송) · shipExclude(제한 지역)를 채우세요. "+
      "신선식품은 \"몇 시까지 주문하면 언제 받는지\" 가 구매를 정합니다."); }catch(e){}
    return "";
  }
  return '<div class="ship '+(cls||"")+'">'+rows.map(function(r){
    return '<div class="ship-r">'+icon(r[0],18)+
      '<span>'+esc(r[1])+'</span><b>'+esc(r[2])+'</b></div>';
  }).join("")+'</div>';
}

/* ══ 전화 주문 ═══════════════════════════════════════════
   부산물 B2B 는 전화로 삽니다. 번호를 안 적어 두면 이 버튼은
   **아예 안 나옵니다** — 눌렀는데 안 걸리는 것보다 없는 게 낫습니다. */
function CallButton(cls, label){
  var tel = bizVal("phone");
  if(!tel){
    try{ console.warn("[ABOUTMEAT] 고객센터 번호가 없어 전화 주문 버튼을 못 답니다 — "+
      "admin.html 의 사업자 정보에서 phone 을 채우세요."); }catch(e){}
    return "";
  }
  var hours = bizVal("hours");
  return '<a class="'+(cls||"btn btn-o btn-lg")+'" href="tel:'+esc(telNum(tel))+'">'+
    icon("phone",18)+'<span>'+esc(label||("전화 주문 "+tel))+'</span>'+
    (hours?'<em class="call-h">'+esc(hours)+'</em>':'')+'</a>';
}

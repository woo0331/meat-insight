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

/* 상품 카드 — 시안 그대로: 사진 / 이름 / 원산지·온도·손질 / 원/kg / 담기 */
function ProductCard(p){
  var meta=[p.origin, WOW_TEMP[p.temp], WOW_TRIM[p.trim]].filter(Boolean).join(" · ");
  return '<article class="pc">'+
    '<a class="pc-img" href="#/p/'+esc(p.id)+'" aria-label="'+esc(p.name)+' 상세보기">'+
      imgTag(p.img, p.name)+
      ((p.badges&&p.badges.length)?'<span class="pc-bd">'+p.badges.map(ProductBadge).join("")+'</span>':'')+
    '</a>'+
    '<div class="pc-b">'+
      '<a class="pc-nm" href="#/p/'+esc(p.id)+'">'+esc(p.name)+'</a>'+
      '<div class="pc-mt">'+esc(meta)+'</div>'+
      '<div class="pc-f">'+
        '<div class="pc-pr">'+wowWon(p.price)+'원<em> /kg</em></div>'+
        '<button class="pc-cart" onclick="addCart(\''+esc(p.id)+'\')" '+
          'aria-label="'+esc(p.name)+' 장바구니에 담기">'+icon("cart",20)+'</button>'+
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
      '<a class="btn btn-g" href="'+esc(opt.emptyTo||"#/products")+'">전체상품 보기</a></div>';
  }
  return '<div class="pg'+(opt.cols===3?" pg-3":"")+'">'+list.map(ProductCard).join("")+'</div>';
}

/* 퀵 카테고리 카드 — 컷아웃 일러스트 + 이름 */
function CategoryCard(c){
  return '<a class="qc" href="'+esc(c.to)+'">'+imgTag(c.img, c.name)+'<b>'+esc(c.name)+'</b></a>';
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
  return '<div class="bnr" style="background-image:url(img/'+esc(o.img||"biz-banner")+'.jpg)">'+
    '<div class="bnr-in">'+
      '<h3>'+(o.title||'<em>업소용</em>으로 찾으시나요?')+'</h3>'+
      '<p>'+esc(o.desc||"식당 · 국밥집 · 곱창전문점 · 식자재업체를 위한 대용량 부산물 공급")+'</p>'+
      '<a class="btn btn-o btn-lg" href="'+esc(o.to||"#/b2b")+'">'+
        esc(o.cta||"업소용 상품 보기")+icon("arrow",18)+'</a>'+
    '</div></div>';
}

/* 도감 카드 — 컷아웃 + 이름 */
function EncyclopediaCard(e, sp){
  return '<a class="qc" href="#/enc/'+esc(sp)+'/'+esc(e.slug)+'">'+
    imgTag(e.img, e.name)+'<b>'+esc(e.name)+'</b></a>';
}

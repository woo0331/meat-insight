/* ════════════════════════════════════════════════════════════════════
   06. Product Detail — 작업지시서 14·15·16·17번
   LEFT  : 큰 사진 + 썸네일
   RIGHT : 배지 / 상품명 / 평점 / 가격 / 판매단위 · 가공상태 · 용도
           / 신뢰 아이콘 4 / 수량 / 장바구니 · 바로구매 · 찜
   아래  : 상품정보 · 부위안내 · 손질과정 · 추천요리 · 리뷰 탭
   ════════════════════════════════════════════════════════════════════ */

var DT = { id:null, unit:1, trim:null, use:null, qty:1, tab:"info", img:0 };

function Stars(r){
  var full=Math.round(Number(r)||0);
  var s="";
  for(var i=1;i<=5;i++){
    s+='<span class="st'+(i<=full?" on":"")+'">'+icon("star",15,"currentColor")+'</span>';
  }
  return '<span class="stars" aria-label="평점 '+(Number(r)||0).toFixed(1)+'점">'+s+'</span>';
}

function Gallery(p){
  var d = p.detail || {};
  var imgs = [d.main || p.img].concat(d.thumbs || []);
  return '<div class="gal">'+
    '<div class="gal-main">'+imgTag(imgs[DT.img]||imgs[0], p.name)+'</div>'+
    (imgs.length>1 ? '<div class="gal-th">'+imgs.map(function(g,i){
      return '<button class="gal-t'+(i===DT.img?" on":"")+'" onclick="DT.img='+i+';paintDetail()" '+
        'aria-label="'+esc(p.name)+' 사진 '+(i+1)+'번">'+imgTag(g, "")+'</button>';
    }).join("")+'</div>' : '')+
  '</div>';
}

/* 옵션 줄 — 값이 하나뿐이면 고를 것이 없으니 줄째 뺍니다. */
function OptRow(label, opts, cur, fn){
  if(!opts || opts.length<1) return "";
  return '<div class="opt"><h4>'+esc(label)+'</h4><div class="opt-o">'+
    opts.map(function(o){
      var v=o[0], nm=o[1];
      return '<button class="opt-b'+(String(cur)===String(v)?" on":"")+'" '+
        'onclick="'+fn+'(\''+esc(v)+'\')">'+esc(nm)+'</button>';
    }).join("")+'</div></div>';
}

var DETAIL_TRUST = [
  ["drop",  "신선한 당일가공"],
  ["shield","HACCP 안전시설"],
  ["truck", "전국 신선배송"],
  ["phone", "대량구매 상담"]
];

var DT_TABS = [["info","상품정보"],["part","부위안내"],["trim","손질과정"],
               ["cook","추천요리"],["review","리뷰"]];

function tabBody(p, ent){
  if(DT.tab==="part"){
    if(!ent){
      /* 도감에 아직 안 적은 부위입니다. 빈 탭을 보여주는 대신
         무엇이 없는지 솔직히 말하고 갈 길을 줍니다. */
      return '<div class="empty"><div class="empty-t">이 부위의 안내는 준비 중입니다</div>'+
        '<div class="empty-d">다른 부위는 부산물 도감에서 먼저 보실 수 있습니다.</div>'+
        '<a class="btn btn-g" href="#/enc/'+esc(p.sp)+'">부산물 도감 보기</a></div>';
    }
    return '<h3 class="tb-h">부위안내</h3>'+
      '<div class="part"><div class="part-l">'+
        '<h4>이 부위는 어디인가요?</h4>'+
        '<p>'+esc(ent.desc)+'</p>'+
        PartDiagram(p.sp, ent)+
      '</div>'+
      '<div class="part-r">'+PartPoints(p, ent)+'</div></div>';
  }
  if(DT.tab==="trim"){
    if(!ent || !ent.trim) return emptyTab("손질과정");
    return '<h3 class="tb-h">손질과정</h3><p class="tb-p">'+esc(ent.trim)+'</p>'+
      '<ol class="steps">'+
        ['원물 입고 · 상태 확인','1차 세척 · 이물 제거','부위별 손질 · 규격 정리',
         '중량 계량 · 진공 포장','냉장 보관 · 당일 출고'].map(function(s,i){
          return '<li><b>'+(i+1)+'</b><span>'+esc(s)+'</span></li>'; }).join("")+
      '</ol>';
  }
  if(DT.tab==="cook"){
    var c=(ent&&ent.cook)||p.uses||[];
    if(!c.length) return emptyTab("추천요리");
    return '<h3 class="tb-h">추천요리</h3><div class="chips">'+
      c.map(function(x){ return '<span class="chip chip-st">'+esc(x)+'</span>'; }).join("")+'</div>'+
      '<p class="tb-p">'+esc(p.name)+'은(는) 위 요리에 많이 쓰입니다. 용도에 맞는 손질 상태를 골라 주문하시면 '+
      '받자마자 바로 조리하실 수 있습니다.</p>';
  }
  if(DT.tab==="review"){
    /* ⚠️ 리뷰를 지어내지 않습니다. 없으면 없다고 씁니다. */
    return '<h3 class="tb-h">리뷰</h3>'+
      '<div class="empty"><div class="empty-t">아직 등록된 리뷰가 없습니다</div>'+
      '<div class="empty-d">구매하신 뒤 남겨 주신 리뷰가 이곳에 표시됩니다.</div></div>';
  }
  /* 상품정보 */
  var rows=[["상품명",p.name],["축종",WOW_BREED[p.breed]],["원산지",p.origin],
            ["보관",WOW_TEMP[p.temp]],["손질 상태",WOW_TRIM[p.trim]],
            ["판매단위",(p.units||[]).map(function(u){return u+"kg";}).join(" / ")],
            ["용도",(p.uses||[]).join(", ")]].filter(function(r){ return r[1]; });
  return '<h3 class="tb-h">상품정보</h3>'+
    '<table class="tb-tbl"><tbody>'+rows.map(function(r){
      return '<tr><th>'+esc(r[0])+'</th><td>'+esc(r[1])+'</td></tr>'; }).join("")+'</tbody></table>';
}
function emptyTab(n){
  return '<div class="empty"><div class="empty-t">'+esc(n)+' 안내는 준비 중입니다</div>'+
    '<div class="empty-d">필요하신 내용이 있으시면 대량구매 상담으로 문의해 주세요.</div>'+
    '<a class="btn btn-o" href="#/b2b">문의하기</a></div>';
}

function detailBody(){
  var p = wowProduct(DT.id);
  if(!p){
    return Breadcrumb([["홈","#/"],["상품",""]])+
      '<div class="w"><div class="empty">'+
      '<div class="empty-t">찾으시는 상품이 없습니다</div>'+
      '<div class="empty-d">주소가 바뀌었거나 판매가 끝난 상품일 수 있습니다.</div>'+
      '<a class="btn btn-g" href="#/products">전체상품 보기</a></div></div>';
  }
  var ent = wowEnc(p.sp, p.item);
  var total = p.price * DT.unit * DT.qty;

  return Breadcrumb([["홈","#/"],[wowSpeciesName(p.sp),"#/c/"+p.sp],
                     [wowCatName(p.sp,p.cat)||"","#/c/"+p.sp+"/"+p.cat],[p.name,""]])+
  '<div class="w dt-wrap">'+
    '<div class="dt-cols">'+
      '<div class="dt-l">'+Gallery(p)+'</div>'+
      '<div class="dt-r">'+
        ((p.badges&&p.badges.length)?'<div class="dt-bd">'+p.badges.map(ProductBadge).join("")+
          (p.today?'<span class="bdg bdg-soft">당일가공</span>':'')+'</div>':'')+
        '<h1 class="dt-nm">'+esc(p.name)+'</h1>'+
        '<div class="dt-mt">'+esc([p.origin,WOW_TEMP[p.temp],p.today?"당일가공":null].filter(Boolean).join(" · "))+'</div>'+
        (p.rating ? '<div class="dt-rt">'+Stars(p.rating)+'<b>'+p.rating.toFixed(1)+'</b>'+
          '<span>('+(p.reviews||0)+'개 리뷰)</span></div>' : '')+
        '<div class="dt-pr">'+wowWon(p.price)+'<em>원</em> <span>/ kg</span></div>'+

        OptRow("판매단위",(p.units||[1]).map(function(u){ return [u,u+"kg"]; }), DT.unit, "dtUnit")+
        OptRow("가공상태",(p.trims||[]).map(function(t){ return [t,WOW_TRIM[t]]; }), DT.trim||p.trim, "dtTrim")+
        OptRow("용도",(p.uses||[]).map(function(u){ return [u,u]; }), DT.use, "dtUse")+

        '<div class="dt-trust">'+DETAIL_TRUST.map(function(t){
          return '<div class="dtt"><div class="dtt-ic">'+icon(t[0],22)+'</div><span>'+esc(t[1])+'</span></div>';
        }).join("")+'</div>'+

        '<div class="dt-buy">'+
          '<div class="qty">'+
            '<button onclick="dtQty(-1)" aria-label="수량 줄이기">'+icon("minus",18)+'</button>'+
            '<input id="dt-qty" type="number" min="1" max="999" value="'+DT.qty+'" '+
              'aria-label="수량" onchange="dtQtySet(this.value)">'+
            '<button onclick="dtQty(1)" aria-label="수량 늘리기">'+icon("plus",18)+'</button>'+
          '</div>'+
          '<div class="dt-tot"><span>총 상품금액</span><b>'+wowWon(total)+'원</b></div>'+
        '</div>'+

        '<div class="dt-acts">'+
          '<button class="btn btn-o btn-lg" onclick="addCart(\''+esc(p.id)+'\',DT.qty*DT.unit)">장바구니</button>'+
          '<button class="btn btn-g btn-lg" onclick="buyNow(\''+esc(p.id)+'\')">바로 구매</button>'+
          '<button class="btn btn-o btn-lg dt-wish" onclick="toggleWish(\''+esc(p.id)+'\')" '+
            'aria-label="찜하기">'+icon("heart",20)+'</button>'+
        '</div>'+
      '</div>'+
    '</div>'+

    '<div class="tabs" role="tablist">'+DT_TABS.map(function(t){
      return '<button role="tab" class="tab'+(DT.tab===t[0]?" on":"")+'" '+
        'aria-selected="'+(DT.tab===t[0])+'" onclick="dtTab(\''+t[0]+'\')">'+esc(t[1])+'</button>';
    }).join("")+'</div>'+
    '<div class="tb" role="tabpanel">'+tabBody(p, ent)+'</div>'+
  '</div>'+

  (function(){
    var rel = wowFind({sp:p.sp, cat:p.cat}).filter(function(x){ return x.id!==p.id; }).slice(0,4);
    return rel.length ? '<section class="sec sec-w"><div class="w">'+
      '<div class="sec-hd"><div class="sec-hd-t"><h2>이런 부산물도 있습니다</h2></div></div>'+
      ProductGrid(rel)+'</div></section>' : '';
  })();
}

function paintDetail(){ var h=$("view"); if(h) h.innerHTML=detailBody(); }
function PageDetail(id){
  if(DT.id!==id){ DT={ id:id, unit:1, trim:null, use:null, qty:1, tab:"info", img:0 }; }
  var p=wowProduct(id);
  if(p){ DT.unit = (p.units&&p.units[0]) || 1; DT.trim = DT.trim || p.trim; }
  return detailBody();
}
window.dtUnit = function(v){ DT.unit=+v; paintDetail(); };
window.dtTrim = function(v){ DT.trim=v;  paintDetail(); };
window.dtUse  = function(v){ DT.use=(DT.use===v?null:v); paintDetail(); };
window.dtTab  = function(v){ DT.tab=v;   paintDetail(); };
window.dtQty  = function(d){ DT.qty=Math.max(1,Math.min(999,DT.qty+d)); paintDetail(); };
window.dtQtySet=function(v){ DT.qty=Math.max(1,Math.min(999,parseInt(v,10)||1)); paintDetail(); };

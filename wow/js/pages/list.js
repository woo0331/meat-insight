/* ════════════════════════════════════════════════════════════════════
   02. 전체상품 · 03/04. 소·돼지 카테고리 · 05. 세부 카테고리 · 09. 검색결과
   전부 같은 목록 화면입니다 — 무엇으로 거르느냐만 다릅니다.
   ════════════════════════════════════════════════════════════════════ */

var LS = { q:{}, sort:"rec", per:12, page:1 };

function Breadcrumb(parts){
  return '<nav class="bc" aria-label="현재 위치"><div class="w">'+
    parts.map(function(p,i){
      var last = i===parts.length-1;
      return (i?'<span class="bc-s" aria-hidden="true">'+icon("chev",13)+'</span>':'')+
        (last ? '<b aria-current="page">'+esc(p[0])+'</b>'
              : '<a href="'+esc(p[1])+'">'+esc(p[0])+'</a>');
    }).join("")+'</div></nav>';
}

/* 카테고리 머리 배너 — 시안의 "소 부산물 / 버려지지 않는 가치" */
var CAT_COPY = {
  beef:["소 부산물","버려지지 않는 가치,<br>소의 모든 부분을 소중하게."],
  pork:["돼지 부산물","한 마리에서 나오는<br>가장 정직한 부위들."]
};
function CatHero(sp){
  var c = CAT_COPY[sp]; if(!c) return "";
  return '<section class="cath" style="background-image:url(img/cat-hero-'+esc(sp)+'.jpg)">'+
    '<div class="w"><div class="cath-in"><h1>'+esc(c[0])+'</h1><p>'+c[1]+'</p></div></div></section>';
}

/* 분류 칩 — 실제로 상품이 있는 분류만 보여줍니다.
   눌렀더니 비어 있는 칩은 손님에게 고장으로 읽힙니다. */
function CatChips(sp, cur){
  var cats = WOW_CATS[sp]||[];
  var have = cats.filter(function(c){ return wowFind({sp:sp, cat:c.slug}).length; });
  if(!have.length) return "";
  var mk=function(slug,name){
    return '<a class="chip'+(cur===slug?" on":"")+'" href="#/c/'+esc(sp)+(slug?"/"+esc(slug):"")+'">'+
      esc(name)+'</a>';
  };
  return '<div class="chips">'+mk("","전체")+have.map(function(c){ return mk(c.slug,c.name); }).join("")+'</div>';
}

/* 세부 품목 줄 — 분류를 고른 뒤 한 단계 더 좁힙니다 */
function ItemChips(sp, cat, cur){
  if(!cat) return "";
  var c=(WOW_CATS[sp]||[]).find(function(x){ return x.slug===cat; }); if(!c) return "";
  var have=c.items.filter(function(i){ return wowFind({sp:sp,cat:cat,item:i.slug}).length; });
  if(have.length<2) return "";
  return '<div class="chips chips-sm">'+
    '<a class="chip'+(cur?"":" on")+'" href="#/c/'+esc(sp)+'/'+esc(cat)+'">전체</a>'+
    have.map(function(i){
      return '<a class="chip'+(cur===i.slug?" on":"")+'" href="#/c/'+esc(sp)+'/'+esc(cat)+'/'+esc(i.slug)+'">'+
        esc(i.name)+'</a>';
    }).join("")+'</div>';
}

/* 필터 — 지시서 11번. 접었다 펼 수 있게 두어 모바일에서 목록을 밀지 않습니다. */
function ProductFilter(){
  return '<aside class="flt" id="flt"><div class="flt-hd"><b>필터</b>'+
      '<button class="flt-x" onclick="fltReset()">초기화</button></div>'+
    WOW_FILTERS.map(function(g){
      var picked = LS.q[g.key]||[];
      return '<div class="flt-g"><h4>'+esc(g.name)+'</h4><div class="flt-o">'+
        g.opts.map(function(o){
          var on = picked.indexOf(o[0])>=0;
          return '<label class="flt-c'+(on?" on":"")+'">'+
            '<input type="checkbox" '+(on?"checked":"")+' '+
              'onchange="fltToggle(\''+esc(g.key)+'\',\''+esc(o[0])+'\')">'+
            '<span>'+esc(o[1])+'</span></label>';
        }).join("")+'</div></div>';
    }).join("")+'</aside>';
}

function sortList(list){
  var l=list.slice();
  if(LS.sort==="low")    l.sort(function(a,b){ return a.price-b.price; });
  if(LS.sort==="high")   l.sort(function(a,b){ return b.price-a.price; });
  if(LS.sort==="review") l.sort(function(a,b){ return (b.reviews||0)-(a.reviews||0); });
  if(LS.sort==="new")    l.sort(function(a,b){ return (b.today?1:0)-(a.today?1:0); });
  return l;
}

/* 목록 본문 — 머리(배너·칩)는 라우터가 붙이고 여기는 상품만 그립니다.
   필터를 눌렀을 때 이 부분만 다시 그리면 되므로 화면이 안 튑니다. */
function listBody(){
  var all = wowFind(LS.q);
  var list = sortList(all);
  var shown = list.slice(0, LS.per*LS.page);
  return '<div class="lst-bar">'+
      '<div class="lst-n">전체 <b>'+all.length+'</b>건</div>'+
      '<div class="lst-sel">'+
        '<select aria-label="정렬 기준" onchange="LS.sort=this.value;LS.page=1;paintList()">'+
          WOW_SORTS.map(function(s){
            return '<option value="'+esc(s[0])+'"'+(LS.sort===s[0]?" selected":"")+'>'+esc(s[1])+'</option>';
          }).join("")+'</select>'+
        '<select aria-label="한 번에 보여줄 개수" onchange="LS.per=+this.value;LS.page=1;paintList()">'+
          [12,24,48].map(function(n){
            return '<option value="'+n+'"'+(LS.per===n?" selected":"")+'>'+n+'개씩 보기</option>';
          }).join("")+'</select>'+
        '<button class="btn btn-o btn-sm flt-btn" onclick="fltOpen()">필터</button>'+
      '</div></div>'+
    ProductGrid(shown, {cols:0})+
    /* "48건" 이라 쓰고 12개만 보여주면 세어 본 사람에게는 틀린 숫자입니다.
       나머지로 가는 길을 반드시 붙입니다. */
    (shown.length < list.length ?
      '<div style="text-align:center;margin-top:var(--s8);">'+
        '<button class="btn btn-o btn-lg" onclick="LS.page++;paintList()">'+
          '상품 더 보기 <b style="color:var(--ink2);font-weight:600;">('+shown.length+' / '+list.length+')</b>'+
        '</button></div>' : '');
}

function paintList(){
  var b=$("lst-body"); if(b) b.innerHTML=listBody();
  var f=$("flt"); if(f) f.outerHTML=ProductFilter();
}

function PageList(o){
  o = o || {};
  LS.q = o.q || {}; LS.page = 1;
  var sp = LS.q.sp, cat = LS.q.cat, item = LS.q.item;

  var crumbs=[["홈","#/"]];
  if(sp){
    crumbs.push([wowSpeciesName(sp), "#/c/"+sp]);
    if(cat)  crumbs.push([wowCatName(sp,cat)||"", "#/c/"+sp+"/"+cat]);
    if(item) crumbs.push([wowCatName(sp,cat,item)||"", ""]);
  } else {
    crumbs.push([o.title||"전체상품",""]);
  }

  return Breadcrumb(crumbs)+
    (sp ? CatHero(sp) : '<div class="w"><h1 class="pg-h1">'+esc(o.title||"전체상품")+'</h1></div>')+
    '<div class="w lst-wrap">'+
      (sp ? '<div class="lst-chips">'+CatChips(sp,cat)+ItemChips(sp,cat,item)+'</div>' : '')+
      '<div class="lst-cols">'+
        ProductFilter()+
        '<div class="lst-main" id="lst-body">'+listBody()+'</div>'+
      '</div>'+
    '</div>'+
    /* 카테고리 화면 아래 도감으로 가는 길 (시안의 초록 띠) */
    (sp ? '<section class="sec sec-tight"><div class="w">'+
        '<div class="bnr bnr-plain">'+
          '<div class="bnr-in">'+
            '<h3>'+esc(sp==="pork"?"돼지":"소")+'의 어떤 부위인가요?</h3>'+
            '<p>궁금한 부위를 눌러 보세요. 부위별 특징과 추천 요리를 확인할 수 있습니다.</p>'+
            '<a class="btn btn-o btn-lg" href="#/enc/'+esc(sp)+'">'+
              esc(wowSpeciesName(sp))+' 도감 보기'+icon("arrow",18)+'</a>'+
          '</div>'+
          '<div class="bnr-fig">'+PartDiagram(sp,null)+'</div>'+
        '</div></div></section>' : '');
}

/* 필터 조작 */
window.fltToggle = function(k,v){
  var a = LS.q[k] = (LS.q[k]||[]).slice();
  var i = a.indexOf(v);
  if(i<0) a.push(v); else a.splice(i,1);
  if(!a.length) delete LS.q[k];
  LS.page=1; paintList();
};
window.fltReset = function(){
  ["breed","temp","trim","use","unit"].forEach(function(k){ delete LS.q[k]; });
  LS.page=1; paintList();
};
window.fltOpen = function(){
  var f=$("flt"); if(f) f.classList.toggle("open");
};

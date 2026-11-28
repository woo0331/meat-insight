

function StartTop(ind){
  var ok = !!(ind && typeof amIndustry === "function" && amIndustry(ind));
  var iq = ok ? "?i=" + encodeURIComponent(ind) : "";
  var rows = ["restaurant", "cafe", "hair"].map(function(k){
    var x = typeof amIndustry === "function" ? amIndustry(k) : null; if(!x) return null;
    return { t:x.name, ic:x.icon || "store", ph:(typeof picKey === "function" ? picKey("ind", k) : ""), href:"/startup/" + encodeURIComponent(k),
      d:"창업 절차 · 비용 · 준비할 것" };
  }).filter(Boolean);
  rows.push({ t:"전체 업종 " + (window.AM_INDUSTRIES || []).length + "개에서 찾기", ic:"grid", href:"#st-ig", d:"편의점 · 헬스 · 학원 · 숙박 · 무인매장 …" });
  return CatTop({ side:"start", photo:"insu-startup", ic:"store", h1:"창업 준비",
    sub:"내 가게 창업, 처음부터 차근차근",
    a1:{ href:"/tools/cost" + iq, t:"창업비 계산", ic:"calc" },
    a2:{ href:ok ? "/startup/" + encodeURIComponent(ind) : "#st-ig", t:ok ? amIndustryName(ind) + " 준비" : "업종별 준비", ic:"check" },
    body:ctRows(rows) });
}

function OpsTop(ind){
  var ik = ind && ind.key ? ind.key : "";
  var iq = ik ? "i=" + encodeURIComponent(ik) : "";
  var add = function(u){ return iq ? u + (u.indexOf("?") >= 0 ? "&" : "?") + iq : u; };
  return CatTop({ side:"ops", photo:"insu-operations", ic:"chart", h1:"매장 운영",
    sub:"우리 매장, 더 안정적이고 효율적으로",
    a1:{ href:add("/providers?j=operation"), t:"운영 업체 찾기", ic:"store" },
    a2:{ href:"#ops-check", t:"운영 점검", ic:"check" },
    body:ctRows([
      { t:"POS · 주문", ic:"pos", ph:"kp-op-svc-pos", href:add("/providers/it"), d:"POS · 키오스크 · 카드단말기" },
      { t:"세무 · 노무", ic:"tax", ph:"kp-cl-svc-tax", href:add("/providers/admin"), d:"세금 신고 · 인건비 · 4대보험" },
      { t:"시설 · 장비", ic:"repair", ph:"svc-equip", href:add("/providers/repair"), d:"수리 · 점검 · 유지보수" },
      { t:"운영 서비스 전체 보기", ic:"grid", href:"/operation?p=pick#pick" }
    ]) });
}

function AcqTop(ind){
  var ik = ind && ind.key ? ind.key : "";
  var dp = (window.AM_STORE_RANGES || []).filter(function(g){ return g.key === "dp"; })[0];
  var sel = function(id, lab, html){ return '<div class="cg-f"><label for="'+id+'">'+esc(lab)+'</label>'+html+'</div>'; };
  var cur = nowQS("dp");
  var form = '<form class="cg-ff" action="/stores" onsubmit="return acqTopGo(event)">'+
    '<div class="cg-fg">'+
      sel("cg-r", "지역", RegionSelect("cg-r", nowQS("r") || "", "", "전체"))+
      sel("cg-i", "업종", IndustrySelect("cg-i", ik, "", "전체"))+
      sel("cg-dp", "예산(보증금)", '<select class="sel" id="cg-dp"><option value="">전체</option>'+
        (dp ? dp.opts : []).map(function(o){ return '<option value="'+esc(o.k)+'"'+(cur === o.k ? " selected" : "")+'>'+esc(o.name)+'</option>'; }).join("")+'</select>')+
    '</div>'+
    '<button class="btn cg-fgo" type="submit">'+icon("search",18)+' 이 조건으로 매물 보기</button></form>';
  return CatTop({ side:"transfer", photo:"insu-transfer", ic:"handover", h1:"매장 양도양수",
    sub:"좋은 매장을 잇고, 새로운 기회를 만들어요",
    a1:{ href:"/stores" + (ik ? "?i=" + encodeURIComponent(ik) : ""), t:"매장 찾기", ic:"search" },
    a2:{ href:"/sell", t:"내 매장 내놓기", ic:"store", form:"sell", off:"매장 내놓기 접수 안내" },
    body:form + '<p class="cg-sub"><a href="/tools/premium">'+icon("calc",18)+'<span>권리금 계산 — 보증금 · 월세 · 권리금</span>'+icon("chev",16)+'</a></p>' });
}

window.acqTopGo = function(e){
  if(e && e.preventDefault) e.preventDefault();
  var q = [];
  [["r","cg-r"],["i","cg-i"],["dp","cg-dp"]].forEach(function(p){
    var el = document.getElementById(p[1]); if(el && el.value) q.push(p[0] + "=" + encodeURIComponent(el.value)); });
  go("/stores" + (q.length ? "?" + q.join("&") : ""));
  return false;
};

var CLOSE_TOP_PICK = [
  { id:"demolish/full",       t:"철거",     ic:"demolish", ph:"hero-close", d:"매장 철거 · 잔재 처리" },
  { id:"restore/shop-restore", t:"원상복구", ic:"restore",  ph:"kind-take",  d:"계약 전 상태로 되돌리는 공사" },
  { id:"asset/furniture",     t:"집기 처분", ic:"sofa",     ph:"as-fridge",  d:"냉장고 · 주방기기 · 집기 매입" }
];
function CloseTop(){
  var L = CLOSE_TOP_PICK.filter(function(x){ return typeof amPickOne !== "function" || amPickOne(x.id); });
  return CatTop({ side:"close", photo:"insu-closure", ic:"demolish", h1:"폐업 · 철거",
    sub:"마무리까지 깔끔하고 간편하게",
    a1:{ href:"/quote?mode=close", t:"전체 견적 신청", ic:"doc", form:"close", off:"폐업 견적 접수 안내" },
    a2:{ href:"#cg-close-pick", t:"필요한 작업 고르기", ic:"check" },
    body:'<div class="cg-pk" id="cg-close-pick">'+
      '<p class="cg-pk-h">필요한 작업을 고르면 견적 신청서에 그대로 담깁니다</p>'+ctTiles(L)+
      '<div class="cg-pk-go" data-pick-row hidden>'+
        '<a class="btn btn-ac" data-pick-go="close" href="/quote?mode=close">'+icon("doc",16)+'<span>고른 작업으로 견적 신청 <b data-pick-n>0</b>개</span></a>'+
        '<a class="cg-pk-more" href="/closure?p=pick#pick">다른 작업도 고르기</a></div>'+
      '<p class="cg-pk-more-l"><a href="/closure?p=pick#pick">신고 · 폐기물 · 세무까지 더 고르기'+icon("chev",14)+'</a></p>'+
    '</div>'+
    '<p class="cg-sub"><a href="/tools/closecost">'+icon("calc",18)+'<span>폐업비 계산 — 나가는 돈과 돌아오는 돈을 함께</span>'+icon("chev",16)+'</a></p>' });
}

/* ════════════════════════════════════════════════════════════════════
   시세 화면을 실제 데이터(market_prices)로 교체
   지금까지 시세 탭은 "한우 / 돼지 / 국산 곱창" 3개가 코드에 박혀 있었고,
   표시되는 가격도 코드에 적힌 예시 숫자였습니다. 관리자가 입력한 시세와
   전혀 연결되어 있지 않아, 실제와 다른 숫자가 사실처럼 보였습니다.
   ════════════════════════════════════════════════════════════════════ */

var MK_CATS=[["beef","한우·소"],["pork","돼지"],["byproduct","부산물"],["import","수입육"]];
var MK = { tab:"all" };

function mkCatLabel(k){
  var f=MK_CATS.find(function(c){ return c[0]===k; });
  return f?f[1]:(k||"기타");
}
function mkItemName(m){
  var nm=String(m.item||"").trim();
  if(m.grade && nm.indexOf(m.grade)<0) nm+=" "+m.grade;   /* 등급 중복 표기 방지 */
  return nm;
}
function mkRows(cat){
  var rows=(typeof MARKET!=="undefined" && MARKET.rows) ? MARKET.rows : [];
  if(!cat || cat==="all") return rows;
  return rows.filter(function(m){ return String(m.category||"etc")===cat; });
}
function mkPriceRow(m){
  var c=Number(m.change)||0;
  var arrow=c>0?"▲":(c<0?"▼":"—");
  var cls=c>0?"p-up":(c<0?"p-dn":"");
  var chg=c?(arrow+" "+Math.abs(c).toLocaleString("ko-KR")):"—";
  return '<div class="price-row"><div class="price-item">'+esc(mkItemName(m))+'</div>'+
    '<div style="text-align:right;">'+
      '<div class="price-val">'+Number(m.price).toLocaleString("ko-KR")+
        '<span style="font-size:11px;color:var(--ink4);font-weight:400;"> '+esc(m.unit||"원/kg")+'</span></div>'+
      '<div class="price-chg '+cls+'">'+chg+'</div></div></div>';
}
function mkFoot(rows){
  if(!rows.length) return "";
  var when=rows[0].price_date||"";
  var srcs={}; rows.forEach(function(m){ if(m.source) srcs[m.source]=1; });
  var list=Object.keys(srcs);
  return '<div class="mk-foot">'+(when?esc(String(when))+' 기준':'')+
    (list.length?' · 출처 '+esc(list.join(", ")):'')+'</div>';
}
function mkEmptyPage(){
  return '<div class="gempty" style="margin:18px 14px;">'+
    '<div class="gempty-t">아직 등록된 시세가 없습니다</div>'+
    '<div class="gempty-d">관리자 콘솔에서 시세를 입력하면 이 화면과 홈 상단에 바로 반영됩니다.<br>'+
    '실제로 확인되지 않은 가격은 표시하지 않습니다.</div></div>';
}

window.renderMarket=function(){
  var el=document.getElementById("market-full"); if(!el) return;
  if(typeof SCHEMA!=="undefined" && SCHEMA.market_prices===false){
    el.innerHTML=setupNote("시세","phase3_schema.sql"); return;
  }
  var all=mkRows("all");
  if(!all.length){ el.innerHTML=mkEmptyPage(); return; }

  /* 실제로 데이터가 있는 분류만 탭으로 만듭니다 */
  var have={}; all.forEach(function(m){ have[String(m.category||"etc")]=1; });
  var tabs=[["all","전체"]].concat(MK_CATS.filter(function(c){ return have[c[0]]; }));
  if(have.etc) tabs.push(["etc","기타"]);
  if(tabs.length===2) tabs=[tabs[1]];              /* 분류가 하나뿐이면 '전체'는 군더더기 */
  if(!tabs.some(function(t){ return t[0]===MK.tab; })) MK.tab=tabs[0][0];

  el.innerHTML='<div class="tab-bar" style="padding:0 14px;margin-bottom:0;border-bottom:1px solid var(--bd);" id="mkt-tabs">'+
      tabs.map(function(t){
        return '<div class="tab'+(t[0]===MK.tab?" on":"")+'" onclick="swMkt(this,\''+t[0]+'\')">'+esc(t[1])+'</div>';
      }).join("")+'</div>'+
    '<div id="mkt-table" style="padding:4px 0;"></div>';
  renderPriceWidget("mkt-table", MK.tab);
};

window.swMkt=function(el,cat){
  MK.tab=cat;
  document.querySelectorAll("#mkt-tabs .tab").forEach(function(t){ t.classList.remove("on"); });
  if(el) el.classList.add("on");
  renderPriceWidget("mkt-table", cat);
};

window.renderPriceWidget=function(eid, cat){
  var el=document.getElementById(eid); if(!el) return;
  var rows=mkRows(cat);
  if(!rows.length){
    el.innerHTML=(mkRows("all").length)
      ? '<div class="gempty" style="margin:14px;"><div class="gempty-t">이 분류에 등록된 시세가 없습니다</div></div>'
      : mkEmptyPage();
    return;
  }
  el.innerHTML=rows.map(mkPriceRow).join("")+mkFoot(rows);
  mkHeadLabel(rows);
};

/* 화면 상단 라벨을 실제 출처로 (출처가 없으면 "참고용" 만) */
function mkHeadLabel(rows){
  var lb=document.getElementById("mkt-src-label"); if(!lb) return;
  var srcs={}; (rows||[]).forEach(function(m){ if(m.source) srcs[m.source]=1; });
  var list=Object.keys(srcs);
  lb.textContent = list.length ? (list.join(", ")+" 기준 · 참고용") : "참고용";
}

function patchMarket(){
  if(MK._patched) return; MK._patched=true;

  /* 홈 상단 시세 스트립도 실제 데이터가 없으면 아예 감춥니다.
     "샘플" 딱지를 달더라도 실제 시세처럼 읽히는 숫자는 내보내지 않습니다. */
  if(typeof renderMktStrip==="function"){
    var origStrip=renderMktStrip;
    renderMktStrip=async function(){
      var r=await origStrip.apply(this, arguments);
      var sec=document.getElementById("sec-mkt"), src=document.getElementById("mkt-src");
      if(sec && src && /샘플/.test(src.textContent||"")) sec.hidden=true;
      return r;
    };
  }

  /* 시세 탭에 들어왔을 때 아직 안 불러왔다면 한 번 더 시도 */
  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(p){
      var r=origGo.apply(this, arguments);
      if(p==="market" && typeof MARKET!=="undefined" && !(MARKET.rows||[]).length && typeof loadMarket==="function"){
        loadMarket().then(function(){ window.renderMarket(); });
      }
      return r;
    };
  }
}

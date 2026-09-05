/* ════════════════════════════════════════════════════════════════════
   오래된 요청

   요청은 등록되면 계속 "견적대기" 로 남습니다. 구매자가 오프라인에서 이미
   해결했어도 목록에 그대로 있어서, 업체는 몇 달 전 요청에 견적을 보내고
   연락이 안 되는 일이 반복됩니다.

   자동으로 지우거나 상태를 바꾸지는 않습니다(구매자 데이터입니다).
   대신 지난 기간을 눈에 보이게 하고, 아주 오래된 것은 목록에서 접어둡니다.
   ════════════════════════════════════════════════════════════════════ */

var STL = { showOld:false, map:{}, loaded:false };
G.STL = STL;
var STL_WARN = 30;    /* 이 날짜가 지나면 "오래된 요청" 표시 */
var STL_HIDE = 90;    /* 이 날짜가 지나면 목록에서 기본으로 접음 */

function stlDays(v){
  if(!v) return null;
  var t=new Date(v).getTime();
  if(isNaN(t)) return null;
  return Math.floor((Date.now()-t)/86400000);
}
/* 목록에 쓰이는 REQS 는 created_at·status 를 버린 형태라,
   등록 시각과 상태만 따로 한 번 받아 둡니다. */
async function stlLoad(){
  var r=await selectSafe("purchase_requests", function(q){
    return q.order("created_at",{ascending:false}).limit(300);
  });
  if(r.unavailable || r.error) return;
  var m={};
  (r.data||[]).forEach(function(x){ m[String(x.id)]={ at:x.created_at, status:x.status }; });
  STL.map=m; STL.loaded=true;
}
function stlInfo(idOrRow){
  if(idOrRow && typeof idOrRow==="object"){
    var byId=STL.map[String(idOrRow.id)];
    if(byId) return byId;
    return { at:idOrRow.rawCreatedAt||idOrRow.created_at, status:idOrRow.status };
  }
  return STL.map[String(idOrRow)]||null;
}
/* 아직 진행 중인(견적을 더 받는) 요청만 대상입니다 */
function stlOpen(info){
  return String((info&&info.status)||"견적대기")==="견적대기";
}
function stlAge(r){
  var info=stlInfo(r);
  if(!info || !stlOpen(info)) return null;
  return stlDays(info.at);
}

/* ── 요청 상세 안내 ── */
function stlDetailNote(){
  var body=$("reqd-body"), req=CUR.req;
  if(!body || !req || body.querySelector(".stl-note")) return;
  var d=stlAge({ id:req.id, created_at:req.created_at, status:req.status });
  if(d===null || d<STL_WARN) return;

  var mine = ME.user && req.user_id && String(req.user_id)===String(ME.user.id);
  var el=document.createElement("div");
  el.className="gnote stl-note";
  el.innerHTML = mine
    ? '올린 지 <b>'+d+'일</b> 지났습니다. 아직 필요하시면 그대로 두셔도 되고, '+
      '해결되었다면 아래에서 마감해 주세요. 마감하면 업체에 더 이상 노출되지 않습니다.'
    : '<b>'+d+'일 전</b>에 올라온 요청입니다. 이미 해결되었을 수 있으니 '+
      '견적을 보내기 전에 요청자에게 아직 필요한지 확인해 보세요.';
  var card=body.querySelector(".gcard");
  if(card && card.parentNode) card.parentNode.insertBefore(el, card);
}

/* ── 목록 카드에 경과 표시 ── */
function stlPaintCards(){
  if(typeof REQS==="undefined") return;
  var byId={};
  REQS.forEach(function(r){ byId[String(r.id)]=r; });
  document.querySelectorAll('#rq-list-full [onclick*="gOpenRequest"], #rq-widget [onclick*="gOpenRequest"]').forEach(function(card){
    if(card.querySelector(".stl-tag")) return;
    var m=/gOpenRequest\('([^']+)'\)/.exec(card.getAttribute("onclick")||"");
    if(!m) return;
    var info=stlInfo(m[1]);
    if(!info || !stlOpen(info)) return;
    var d=stlDays(info.at);
    if(d===null || d<STL_WARN) return;
    var top=card.querySelector(".rqc-top,.ritem-top,.rc-top") || card.firstElementChild;
    if(!top) return;
    var s=document.createElement("span");
    s.className="stl-tag";
    s.textContent=d+"일 지남";
    top.appendChild(s);
  });
}

/* ── 아주 오래된 요청은 기본으로 접기 ── */
function stlFilter(list){
  if(STL.showOld) return list;
  return (list||[]).filter(function(r){
    var info=stlInfo(r);
    if(!info || !stlOpen(info)) return true;
    var d=stlDays(info.at);
    return !(d!==null && d>=STL_HIDE);
  });
}
function stlHiddenCount(list){
  return (list||[]).length - stlFilter(list).length;
}
window.gStlToggle=function(){
  STL.showOld=!STL.showOld;
  if(typeof renderReqs==="function") renderReqs();
};
function stlNotice(total, shown){
  var host=$("rq-list-full"); if(!host) return;
  var old=$("stl-more"); if(old && old.parentNode) old.parentNode.removeChild(old);
  var n=total-shown;
  if(!n && !STL.showOld) return;
  var d=document.createElement("div");
  d.id="stl-more"; d.className="stl-more";
  d.innerHTML = STL.showOld
    ? '<span>'+STL_HIDE+'일이 지난 요청도 함께 보고 있습니다.</span>'+
      '<button type="button" onclick="gStlToggle()">최근 것만 보기</button>'
    : '<span>'+STL_HIDE+'일이 지난 요청 '+n+'건은 접어두었습니다.</span>'+
      '<button type="button" onclick="gStlToggle()">모두 보기</button>';
  host.parentNode.insertBefore(d, host.nextSibling);
}

function patchStale(){
  if(STL._patched) return; STL._patched=true;

  /* mapReq 가 created_at 을 버리므로 원본을 하나 붙여둡니다 */
  var origMap=window.mapReq;
  if(typeof origMap==="function"){
    window.mapReq=function(r){
      var o=origMap(r);
      if(o && r) o.rawCreatedAt=r.created_at;
      return o;
    };
  }

  /* 목록에서 아주 오래된 것 접기 */
  var origReqs=window.renderReqs;
  if(typeof origReqs==="function"){
    window.renderReqs=function(){
      if(typeof REQS==="undefined") return origReqs.apply(this, arguments);
      var all=REQS, kept=stlFilter(all);
      var total=all.length, shown=kept.length;
      REQS=kept;
      var out;
      try{ out=origReqs.apply(this, arguments); }
      finally{ REQS=all; }
      try{ stlNotice(total, shown); stlPaintCards(); }catch(e){}
      return out;
    };
  }

  if(typeof renderRequestDetail==="function"){
    var origRRD=renderRequestDetail;
    renderRequestDetail=function(){
      var r=origRRD.apply(this, arguments);
      try{ stlDetailNote(); }catch(e){}
      return r;
    };
  }
  /* 등록 시각·상태를 받아온 뒤 목록을 다시 그립니다 */
  stlLoad().then(function(){
    if(!STL.loaded) return;
    try{
      if(typeof renderReqs==="function") renderReqs();
      if(typeof renderRQWidget==="function") renderRQWidget();
    }catch(e){}
  });
  if(typeof loadFromDB==="function"){
    var origLoad=loadFromDB;
    loadFromDB=async function(){
      var r=await origLoad.apply(this, arguments);
      try{ await stlLoad(); if(typeof renderReqs==="function") renderReqs(); }catch(e){}
      return r;
    };
  }

  /* 홈 위젯도 같은 기준으로 접습니다 (목록과 다르면 혼란스럽습니다) */
  var origWidget=window.renderRQWidget;
  if(typeof origWidget==="function"){
    window.renderRQWidget=function(){
      if(typeof REQS==="undefined") return origWidget.apply(this, arguments);
      var all=REQS;
      REQS=stlFilter(all);
      var r;
      try{ r=origWidget.apply(this, arguments); }
      finally{ REQS=all; }
      try{ stlPaintCards(); }catch(e){}
      return r;
    };
  }
}

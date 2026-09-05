/* ════════════════════════════════════════════════════════════════════
   목록 검색 · 정렬
   요청 목록 / 업체 목록 위에 검색창과 정렬 선택을 붙입니다.
   원본 renderReqs() · renderSups() 는 그대로 두고, 그리기 직전에
   전역 목록을 걸러낸 배열로 잠깐 바꿔치웠다가 되돌립니다.
   ════════════════════════════════════════════════════════════════════ */

var FLT = { reqQ:"", reqSort:"new", supQ:"", supSort:"reco", supVf:false, _t:null };

var FLT_REQ_SORT = [
  ["new",  "최신순"],
  ["due",  "마감 임박순"],
  ["quote","견적 많은순"],
  ["few",  "견적 적은순"]
];
var FLT_SUP_SORT = [
  ["reco", "추천순"],
  ["rate", "평점 높은순"],
  ["lead", "납기 빠른순"],
  ["cat",  "취급 분야 많은순"]
];

function fltNorm(v){ return String(v==null?"":v).toLowerCase().replace(/\s+/g,""); }
function fltTerms(q){
  return String(q||"").trim().toLowerCase().split(/\s+/).filter(Boolean).map(function(t){ return t.replace(/\s+/g,""); });
}
function fltHit(hay, terms){
  for(var i=0;i<terms.length;i++){ if(hay.indexOf(terms[i])<0) return false; }
  return true;
}
function fltReqHay(r){
  return fltNorm([r.title, r.region, r.cat, r.detail, r.meta].join(" "));
}
function fltSupHay(s){
  return fltNorm([s.nm, s.cat, (s.cats||[]).join(" "), s.desc].join(" "));
}

/* "2일" · "당일" · "12시간" → 일(day) 단위 숫자 */
function fltLeadDays(v){
  var s=String(v||"").trim();
  if(!s || s==="—" || s==="-") return 9999;
  if(/당일|즉시|바로/.test(s)) return 0;
  var m=s.match(/(\d+(?:\.\d+)?)/);
  if(!m) return 9999;
  var n=parseFloat(m[1]);
  if(/시간/.test(s)) return n/24;
  if(/주/.test(s)) return n*7;
  if(/개월|달/.test(s)) return n*30;
  return n;
}
function fltTime(d){
  if(!d) return null;
  var t=new Date(d).getTime();
  return isNaN(t)?null:t;
}

/* ── 걸러내기 + 정렬 ── */
function fltReqs(list){
  var terms=fltTerms(FLT.reqQ);
  var out=(list||[]).filter(function(r){ return !terms.length || fltHit(fltReqHay(r), terms); });
  var s=FLT.reqSort;
  if(s==="due"){
    out=out.slice().sort(function(a,b){
      var x=fltTime(a.deadline), y=fltTime(b.deadline);
      if(x==null && y==null) return 0;
      if(x==null) return 1;
      if(y==null) return -1;
      return x-y;
    });
  } else if(s==="quote"){
    out=out.slice().sort(function(a,b){ return (b.qcnt||0)-(a.qcnt||0); });
  } else if(s==="few"){
    out=out.slice().sort(function(a,b){ return (a.qcnt||0)-(b.qcnt||0); });
  }
  /* new = DB 정렬(최신순) 그대로 */
  return out;
}
function fltSups(list){
  var terms=fltTerms(FLT.supQ);
  var out=(list||[]).filter(function(s){
    if(FLT.supVf && !s.vf) return false;
    return !terms.length || fltHit(fltSupHay(s), terms);
  });
  var k=FLT.supSort;
  if(k==="rate")      out=out.slice().sort(function(a,b){ return (b.rt||0)-(a.rt||0); });
  else if(k==="lead") out=out.slice().sort(function(a,b){ return fltLeadDays(a.rs)-fltLeadDays(b.rs); });
  else if(k==="cat")  out=out.slice().sort(function(a,b){ return (b.catcnt||0)-(a.catcnt||0); });
  return out;
}

/* ── 검색바 만들기 ── */
function fltBuild(kind){
  var isReq = (kind==="req");
  var id = isReq ? "flt-req" : "flt-sup";
  var old = document.getElementById(id); if(old) return old;
  var anchor = document.getElementById(isReq ? "rq-filter-chips" : "sup-filter-chips");
  if(!anchor || !anchor.parentNode) return null;

  var opts=(isReq?FLT_REQ_SORT:FLT_SUP_SORT).map(function(o){
    return '<option value="'+o[0]+'">'+o[1]+'</option>';
  }).join("");

  var bar=document.createElement("div");
  bar.id=id; bar.className="gflt";
  bar.innerHTML=
    '<div class="gflt-row">'+
      '<div class="gflt-search">'+
        '<span class="gflt-ico" aria-hidden="true">🔎</span>'+
        '<input class="gflt-in" id="'+id+'-q" type="text" autocomplete="off" spellcheck="false" '+
          'aria-label="'+(isReq?"요청 검색":"업체 검색")+'" placeholder="'+
          (isReq?"품목·지역·내용으로 검색 (예: 삼겹살, 경기)":"업체명·품목·지역으로 검색 (예: 도축, 부산)")+'">'+
        '<button type="button" class="gflt-x" id="'+id+'-x" aria-label="검색어 지우기" hidden>✕</button>'+
      '</div>'+
      '<select class="gflt-sel" id="'+id+'-sort" aria-label="정렬 기준">'+opts+'</select>'+
      (isReq?'':'<label class="gflt-chk"><input type="checkbox" id="flt-sup-vf"><span>인증업체만</span></label>')+
    '</div>'+
    '<div class="gflt-n" id="'+id+'-n"></div>';
  anchor.parentNode.insertBefore(bar, anchor);   /* 분야 칩 위에 놓습니다 */

  var qEl=document.getElementById(id+"-q"),
      xEl=document.getElementById(id+"-x"),
      sEl=document.getElementById(id+"-sort");

  function apply(){
    if(isReq) FLT.reqQ=qEl.value; else FLT.supQ=qEl.value;
    xEl.hidden = !qEl.value;
    fltRender(kind);
  }
  qEl.addEventListener("input", function(){
    clearTimeout(FLT._t);
    FLT._t=setTimeout(apply, 180);
  });
  qEl.addEventListener("keydown", function(e){
    if(e.key==="Enter"){ clearTimeout(FLT._t); apply(); }
    if(e.key==="Escape"){ qEl.value=""; clearTimeout(FLT._t); apply(); }
  });
  xEl.addEventListener("click", function(){ qEl.value=""; qEl.focus(); clearTimeout(FLT._t); apply(); });
  sEl.addEventListener("change", function(){
    if(isReq) FLT.reqSort=sEl.value; else FLT.supSort=sEl.value;
    fltRender(kind);
  });
  var vf=document.getElementById("flt-sup-vf");
  if(vf) vf.addEventListener("change", function(){ FLT.supVf=vf.checked; fltRender("sup"); });

  return bar;
}

function fltRender(kind){
  if(kind==="req"){ if(typeof renderReqs==="function") renderReqs(); }
  else { if(typeof renderSups==="function") renderSups(typeof curSC!=="undefined"?curSC:"all"); }
}

/* ── 결과 수 · 빈 결과 안내 ── */
function fltCount(kind, shown, total){
  var el=document.getElementById((kind==="req"?"flt-req":"flt-sup")+"-n");
  if(!el) return;
  var q=(kind==="req"?FLT.reqQ:FLT.supQ).trim();
  var narrowed = q || (kind==="sup" && FLT.supVf);
  if(!total){ el.textContent=""; return; }
  el.textContent = narrowed
    ? (shown+"건 · 전체 "+total+"건 중")
    : ("전체 "+total+"건");
}
function fltEmpty(kind){
  var el=document.getElementById(kind==="req"?"rq-list-full":"sup-full");
  if(!el) return;
  var q=(kind==="req"?FLT.reqQ:FLT.supQ).trim();
  var what=(kind==="req"?"요청이":"업체가");
  el.innerHTML='<div class="es"><div class="es-t">'+
      (q?('"'+esc(q)+'" 에 맞는 '+what+' 없습니다'):"조건에 맞는 "+what+" 없습니다")+'</div>'+
    '<div class="es-d">검색어를 줄이거나 분야 필터를 전체로 바꿔보세요.</div>'+
    '<button class="es-btn" onclick="gFltReset(\''+kind+'\')">검색 조건 초기화</button></div>';
}
window.gFltReset=function(kind){
  var isReq=(kind==="req"), id=isReq?"flt-req":"flt-sup";
  if(isReq){ FLT.reqQ=""; FLT.reqSort="new"; } else { FLT.supQ=""; FLT.supVf=false; FLT.supSort="reco"; }
  var qEl=document.getElementById(id+"-q"); if(qEl) qEl.value="";
  var sEl=document.getElementById(id+"-sort"); if(sEl) sEl.value=(isReq?"new":"reco");
  var xEl=document.getElementById(id+"-x"); if(xEl) xEl.hidden=true;
  var vf=document.getElementById("flt-sup-vf"); if(vf) vf.checked=false;
  if(isReq){ if(typeof curRC!=="undefined") curRC="all"; }
  else { if(typeof curSC!=="undefined") curSC="all"; }
  fltRender(kind);
};

/* ── 감싸기 ── */
function patchFilters(){
  if(FLT._patched) return; FLT._patched=true;

  var origReqs=window.renderReqs;
  if(typeof origReqs==="function"){
    window.renderReqs=function(){
      fltBuild("req");
      if(typeof REQS==="undefined"){ return origReqs.apply(this, arguments); }
      var all=REQS, kept=fltReqs(all);
      var visibleAll=all.filter(function(r){
        return (typeof matchCat8==="function") ? matchCat8([r.cat], curRC) : true;
      }).length;
      var visibleKept=kept.filter(function(r){
        return (typeof matchCat8==="function") ? matchCat8([r.cat], curRC) : true;
      }).length;
      REQS=kept;
      var out;
      try{ out=origReqs.apply(this, arguments); }
      finally{ REQS=all; }
      fltCount("req", visibleKept, visibleAll);
      if(!visibleKept && visibleAll) fltEmpty("req");
      return out;
    };
  }

  var origSups=window.renderSups;
  if(typeof origSups==="function"){
    window.renderSups=function(cat){
      fltBuild("sup");
      if(typeof SUPS==="undefined"){ return origSups.apply(this, arguments); }
      var all=SUPS, kept=fltSups(all);
      var m=function(s){ return (typeof matchCat8==="function") ? matchCat8(s.cats, cat) : true; };
      var visibleAll=all.filter(m).length, visibleKept=kept.filter(m).length;
      SUPS=kept;
      var out;
      try{ out=origSups.apply(this, arguments); }
      finally{ SUPS=all; }
      fltCount("sup", visibleKept, visibleAll);
      if(!visibleKept && visibleAll) fltEmpty("sup");
      return out;
    };
  }
}

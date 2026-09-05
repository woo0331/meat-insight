
/* ════════════════════════════════════════════════════════════════════
   2026 리디자인 — 히어로 지역선택 / 알림 / 카드 렌더 교체
   기능·데이터·함수는 그대로 두고 마크업만 새 디자인으로 바꿉니다.
   ════════════════════════════════════════════════════════════════════ */

var RGN_KEY="gori.region";
function myRegion(){ try{ return localStorage.getItem(RGN_KEY)||""; }catch(e){ return ""; } }
G.myRegion=myRegion;

function paintRegion(){
  var el=$("gh-region-tx"); if(!el) return;
  el.textContent = myRegion() || "지역 선택";
}
window.gPickRegion=function(){
  var cur=myRegion();
  var box=document.createElement("div");
  box.className="rgn-dim"; box.id="rgn-dim";
  box.innerHTML='<div class="rgn-box" onclick="event.stopPropagation()">'+
    '<div class="rgn-t">주로 활동하는 지역</div>'+
    '<div class="rgn-grid">'+REGIONS.map(function(r){
      return '<button class="rgn-i'+(cur===r?" on":"")+'" onclick="gSetRegion(\''+esc(r)+'\')">'+esc(r)+'</button>';
    }).join("")+'</div>'+
    '<div class="ghint" style="margin-top:14px;">선택한 지역은 요청서와 업체 찾기의 기본값으로 사용됩니다.</div>'+
    '</div>';
  box.onclick=function(){ window.gCloseRegion(); };
  document.body.appendChild(box);
  document.body.style.overflow="hidden";
};
window.gCloseRegion=function(){ var m=$("rgn-dim"); if(m) m.remove(); document.body.style.overflow=""; };
window.gSetRegion=function(r){
  try{ localStorage.setItem(RGN_KEY, r); }catch(e){}
  paintRegion(); window.gCloseRegion();
  toast(r+" 지역으로 설정했습니다.","ok");
};

/* 히어로 알림 버튼 — 기존 알림 패널로 연결 */
window.gHeroBell=function(ev){
  if(ev) ev.stopPropagation();
  if(!ME.user){ if(typeof openModal==="function") openModal("login"); return; }
  if(typeof go==="function") go("my");
  setTimeout(function(){ if(typeof gMyTab==="function") gMyTab("noti"); }, 300);
};
function paintBell(){
  var d=$("gh-bell-dot"); if(!d) return;
  var n=NOTIFS.filter(function(x){ return !x.is_read; }).length + (typeof chatUnread==="function"?chatUnread():0);
  d.hidden = !n;
}

/* 요청서 기본 지역을 사용자 설정값으로 */
function patchRegionDefault(){
  var orig=window.gStep2;
  window.gStep2=function(){
    orig();
    var r=myRegion(), sel=$("w-region");
    if(r && sel && sel.tagName==="SELECT"){
      for(var i=0;i<sel.options.length;i++) if(sel.options[i].text===r){ sel.selectedIndex=i; break; }
    }
  };
}

/* ── 실시간 요청 카드 (신규 디자인) ── */
function isUrgent(r){
  var k=(typeof key8Of==="function")?key8Of(r.cat):null;
  if(k==="labor") return true;
  var d=r.deadline||(r.detail&&(r.detail.work_date||r.detail.deadline));
  if(!d) return false;
  var t=new Date(String(d)+"T00:00:00"), n=new Date(); n.setHours(0,0,0,0);
  var diff=(t-n)/86400000;
  return diff>=0 && diff<=1;
}
/* 금액 단위는 분야마다 다릅니다 (원/kg · 원/회 · 만원/월 · 일당 원).
   REQ_FORMS 의 unit 을 그대로 읽어서, 구인구직 월급을 "일당 320원" 으로
   찍던 문제를 없앱니다. */
/* 카테고리 이름만으로는 구인구직(월급)과 당일알바(일당)를 구분하지 못합니다
   ('채용' 이 인력·알바로 매핑됩니다). 입력된 항목으로 판별합니다. */
function reqFormKey(r, d){
  if(d.employment || d.exp) return "job";
  if(d.pay_type || d.work_date || d.work) return "labor";
  if(typeof key8Of==="function"){ var k=key8Of(r.cat); if(k) return k; }
  return null;
}
function reqPriceBit(r, d){
  var id=null;
  ["price","pay","budget"].forEach(function(k){ if(!id && d[k]) id=k; });
  if(!id) return null;
  var key=reqFormKey(r, d);
  var fields=(typeof REQ_FORMS!=="undefined" && REQ_FORMS[key])?REQ_FORMS[key]:null;
  var unit="원";
  if(fields){
    for(var i=0;i<fields.length;i++){ if(fields[i].id===id){ unit=fields[i].unit||"원"; break; } }
  }
  var label="희망 ";
  if(id==="pay"){
    if(d.pay_type){ label=d.pay_type+" "; unit=(d.pay_type==="시급")?"원/시":"원"; }
    else label="급여 ";
  }
  return label+d[id]+unit;
}
function reqMetaBits(r){
  var d=r.detail||{}, out=[];
  out.push("📍 "+(r.region||"지역 미지정"));
  var price=reqPriceBit(r, d);
  if(price) out.push(price);
  var qty=d.qty||d.volume||d.headcount;
  if(qty) out.push(qty+(d.headcount?"명":(d.volume?"톤":"kg")));
  var when=r.deadline||d.work_date||d.deadline;
  if(when) out.push(fmtDate(when)+"까지");
  return out.slice(0,3);
}
function reqCardHtml(r){
  var urgent=isUrgent(r), n=Number(r.qcnt)||0;
  /* 사람을 구하는 요청(당일알바·구인구직)에는 "견적" 이 아니라 "지원" 입니다.
     구인구직도 사람을 뽑는 것이라 지원으로 표시합니다. */
  var fk=reqFormKey(r, r.detail||{});
  var isLabor=(fk==="labor"||fk==="job");
  return '<article class="rc'+(urgent?" hot":"")+'" onclick="gOpenRequest(\''+esc(r.id)+'\')">'+
    '<div class="rc-top">'+
      '<span class="rc-tag'+(urgent?" rc-tag-hot":"")+'">'+esc(urgent?"급구 · "+cat8Label(r.cat):cat8Label(r.cat))+'</span>'+
      '<span class="rc-ago">'+esc(r.time||"")+'</span>'+
    '</div>'+
    '<h3 class="rc-t">'+esc(r.title)+'</h3>'+
    '<div class="rc-m">'+reqMetaBits(r).map(function(t){ return '<span>'+esc(t)+'</span>'; }).join("")+'</div>'+
    '<div class="rc-bot">'+
      '<span class="rc-qn">'+(isLabor?"지원":"견적")+' <b>'+n+'</b>'+(isLabor?"명":"개")+'</span>'+
      '<button class="rc-cta" onclick="event.stopPropagation();gOpenRequest(\''+esc(r.id)+'\')">'+
        (isLabor?"지원하기":(n?"견적 비교":"견적 보내기"))+'</button>'+
    '</div></article>';
}
function patchReqCards(){
  window.renderRQWidget=function(){
    var el=$("rq-widget"); if(!el) return;
    if(!REQS.length){
      el.innerHTML='<div class="es"><div class="es-t">아직 요청이 없어요</div>'+
        '<div class="es-d">필요한 것을 올리면 조건에 맞는 업체가 견적과 제안을 보냅니다.</div>'+
        '<button class="es-btn" onclick="go(&quot;rw&quot;)">첫 요청 올리기</button></div>';
      return;
    }
    el.innerHTML=REQS.slice(0,8).map(reqCardHtml).join("");
  };
  window.renderReqs=function(){
    var el=$("rq-list-full"); if(!el) return;
    renderReqChips();
    var data=REQS.filter(function(r){ return matchCat8([r.cat],curRC); });
    if(!data.length){
      el.innerHTML='<div class="es"><div class="es-t">'+(curRC&&curRC!=="all"?"이 분야에 등록된 요청이 없어요":"아직 요청이 없어요")+'</div>'+
        '<div class="es-d">필요한 것을 올리면 조건에 맞는 업체가 견적과 제안을 보냅니다.</div>'+
        '<button class="es-btn" onclick="go(&quot;rw&quot;)">요청 올리기</button></div>';
      return;
    }
    el.innerHTML='<div class="rc-list">'+data.map(reqCardHtml).join("")+'</div>';
  };
}

/* ── 업체 카드 (신규 디자인) ── */
function supIconFor(s){
  var k=(s.category_mains&&s.category_mains[0]) ||
        ((s.cats&&s.cats.length&&typeof key8Of==="function")?key8Of(s.cats[0]):null) ||
        ((s.categories&&s.categories.length&&typeof key8Of==="function")?key8Of(s.categories[0]):null);
  var c=(typeof cat8Of==="function"&&k)?cat8Of(k):null;
  return c ? c.ico : '<path d="M3 21V10l6 4V10l6 4V6l6 3v12z"/><path d="M2 21h20"/>';
}
function patchSupCards(){
  window.mkSC=function(s){
    var d=document.createElement("div");
    d.className="sc2";
    d.onclick=function(){ if(typeof curSID!=="undefined") curSID=s.id; go("sp"); };
    var badges="";
    if(s.vf||s.is_verified) badges+='<span class="sc2-bd sc2-bd-blue">인증업체</span>';
    if(s.haccp)             badges+='<span class="sc2-bd sc2-bd-mint">HACCP</span>';
    if(s.livestock_permit)  badges+='<span class="sc2-bd sc2-bd-mint">축산물 허가</span>';
    var items=(s.items&&s.items.length)?s.items.slice(0,2).join(" · ")
             :((s.cats&&s.cats.length)?s.cats.slice(0,2).join(" · ")
             :((s.categories&&s.categories.length)?s.categories.slice(0,2).join(" · "):"취급 품목 미등록"));
    var region=s.region || String(s.cat||"").split(" · ")[0] || "";
    var rating=Number(s.rt!=null?s.rt:s.rating)||0;
    var photo=(s.images&&s.images.length)?s.images[0]:null;
    var rv=Number(s.review_count)||0, deal=Number(s.deal_count)||0;
    var stats=[];
    if(rv) stats.push("후기 "+rv);
    if(deal) stats.push("거래 "+deal+"건");
    d.innerHTML=
      '<div class="sc2-ic"'+(photo?' style="background-image:url('+esc(photo)+');"':'')+'>'+
        (photo?'':'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
        'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+supIconFor(s)+'</svg>')+'</div>'+
      '<div class="sc2-b">'+
        '<div class="sc2-nm">'+esc(s.nm||s.name||"업체")+badges+'</div>'+
        '<div class="sc2-rate">'+
          (rating?'<em>★ '+rating.toFixed(1)+'</em>':'<span style="color:var(--ink4);">신규 업체</span>')+
          (stats.length?'<span>'+esc(stats.join(" · "))+'</span>':'')+
        '</div>'+
        '<div class="sc2-meta">'+esc(items)+(region?' · '+esc(region):'')+'</div>'+
      '</div>'+
      '<svg class="sc2-ch" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';
    return d;
  };
}

/* ── 하단 네비 + 버튼 ── */
function patchFab(){
  var plus=document.querySelector(".bplus"); if(!plus) return;
  plus.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
}

/* ── 섹션 순서 조정: 인력 블록 위로, 프로세스 아래로 ── */
function reorderSections(){
  var home=$("pg-h"); if(!home) return;
  var labor=$("sec-labor");
  var supSec=document.querySelector("#sup-home") ? document.querySelector("#sup-home").closest("div[style*='border-top']") : null;
  var proc=$("proc-grid") ? $("proc-grid").closest("section") : null;
  if(labor && supSec && labor.compareDocumentPosition(supSec) & Node.DOCUMENT_POSITION_PRECEDING){
    supSec.parentNode.insertBefore(labor, supSec);   /* 인력 → 업체 위 */
  }
  if(proc && supSec){
    supSec.parentNode.insertBefore(proc, supSec.nextSibling);  /* 프로세스 → 업체 아래 */
  }
}

/* ── 카테고리 타일에 분야별 컬러 ── */
function patchCatTiles(){
  var orig=window.renderCat8Grid;
  window.renderCat8Grid=function(){
    orig();
    var el=$("cat8-grid"); if(!el) return;
    el.querySelectorAll(".cat8-card").forEach(function(card,i){
      var c=CATS8[i]; if(!c) return;
      var ic=card.querySelector(".cat8-ico");
      if(ic) ic.classList.add("ct-"+c.k);
    });
  };
}

/* ── 히어로 실시간 지표 (실데이터가 있을 때만) ── */
function renderHeroStat(){
  var el=$("gh-stat"); if(!el) return;
  var today0=new Date(); today0.setHours(0,0,0,0);
  var todayReq=REQS.filter(function(r){
    var raw=r.created_at||r.time; return false;
  }).length;
  /* REQS 는 매핑된 형태라 원본 시각이 없어 '전체 요청 수'로 대체 */
  var stats=[];
  if(REQS.length) stats.push({v:REQS.length,u:"건",l:"올라온 요청"});
  if(SUPS.length) stats.push({v:SUPS.length,u:"곳",l:"등록 업체"});
  var withQ=REQS.filter(function(r){ return (Number(r.qcnt)||0)>0; }).length;
  if(withQ) stats.push({v:withQ,u:"건",l:"견적 도착"});
  if(stats.length<2){ el.hidden=true; el.innerHTML=""; return; }
  el.hidden=false;
  el.innerHTML=stats.map(function(s){
    return '<div class="gh-st"><div class="gh-sv">'+s.v+'<small>'+s.u+'</small></div>'+
      '<div class="gh-sl">'+s.l+'</div></div>';
  }).join("");
}

/* ── 오늘 시세 스트립 (market_prices 우선, 없으면 샘플 표기) ── */
async function renderMktStrip(){
  var sec=$("sec-mkt"), row=$("mkt-strip"), src=$("mkt-src");
  if(!sec||!row) return;
  var rows=[], sample=false, when="";
  if(G.MARKET && G.MARKET.rows && G.MARKET.rows.length){
    rows=G.MARKET.rows.slice(0,8).map(function(m){
      var nm=m.item||"";
      if(m.grade && nm.indexOf(m.grade)<0) nm+=" "+m.grade;   /* 등급 중복 표기 방지 */
      return {n:nm,v:Number(m.price),u:m.unit||"원/kg",c:Number(m.change)||0};
    });
    when=(G.MARKET.rows[0].price_date||"");
  } else if(typeof PRICE_DATA!=="undefined"){
    sample=true;
    ["beef","pork","import"].forEach(function(k){
      (PRICE_DATA[k]||[]).forEach(function(x){
        var c=parseInt(String(x.chg||"").replace(/[^0-9]/g,""),10)||0;
        rows.push({n:x.item,v:num(x.price),u:x.unit||"원/kg",c:(x.up?c:-c)});
      });
    });
    rows=rows.slice(0,8);
  }
  if(!rows.length){ sec.hidden=true; return; }
  sec.hidden=false;
  src.innerHTML = sample ? '<span class="sample-tag">샘플</span> 실시세 연동 준비 중'
                         : esc(when)+' 기준';
  row.innerHTML=rows.map(function(r){
    var cls=r.c>0?"up":(r.c<0?"dn":"flat");
    var arrow=r.c>0?"▲":(r.c<0?"▼":"—");
    var pct=(r.v&&r.c)?(" ("+Math.abs(Math.round(r.c/r.v*1000)/10)+"%)"):"";
    return '<div class="mkt-c" onclick="go(&quot;market&quot;)" style="cursor:pointer;">'+
      '<div class="mkt-n">'+esc(r.n)+'</div>'+
      '<div class="mkt-v">'+won(r.v)+'<small>'+esc(r.u)+'</small></div>'+
      '<div class="mkt-d '+cls+'">'+arrow+' '+(r.c?won(Math.abs(r.c)):"보합")+pct+'</div></div>';
  }).join("");
}
G.renderMktStrip=renderMktStrip;

/* ── 홈/내부 구분: 모바일에서 홈만 헤더를 숨깁니다 ── */
function markHome(p){
  document.body.classList.toggle("on-home", (p||"h")==="h");
}
function patchHomeFlag(){
  var orig=window.go;
  window.go=function(p){ orig(p); markHome(p); };
  markHome((document.querySelector(".pg.on")||{}).id==="pg-h"?"h":"x");
}

/* ── 초기화 ── */
function initRedesign(){
  patchReqCards();
  patchSupCards();
  patchCatTiles();
  patchHomeFlag();
  if(typeof patchOnboard==="function") patchOnboard();
  patchRegionDefault();
  patchFab();
  paintRegion();
  reorderSections();
  var origHdr=renderHeaderUser;          /* window 에는 없는 이름입니다 */
  renderHeaderUser=function(){ origHdr(); paintBell(); };
  paintBell();
  if(typeof renderHome==="function") renderHome();
  renderHeroStat();
  renderMktStrip();
  /* DB 로딩이 끝난 뒤에도 한 번 더 */
  setTimeout(function(){ renderHeroStat(); renderMktStrip(); }, 1400);
}
setTimeout(initRedesign, 420);

/* ════════════════════════════════════════════════════════════════════
   업체(공급자) 쪽 두 가지

   1) 업체 등록 화면(#/sj)에 설득 구간
      지금은 설명 한 줄 없이 입력 폼부터 나옵니다. 왜 등록해야 하는지가
      없으니 카톡·문자로 주소를 뿌려도 그대로 나갑니다.
      실제로 올라와 있는 요청을 보여줍니다 — 숫자를 지어내지 않습니다.

   2) 로그인한 업체에게 "내 업체에 맞는 요청" 피드
      지금은 DB 트리거 알림에만 의존합니다. 알림을 못 보면 요청이
      올라온 줄도 모릅니다. 홈과 거래관리에서 바로 보이게 합니다.
   ════════════════════════════════════════════════════════════════════ */

var SH = { reqs:null, sups:null, quoted:null, busy:false, painted:false };
G.SH=SH;

/* 마감된 요청은 견적을 받지 않습니다 */
var SH_OPEN=["견적대기","견적중",""];
function shOpen(r){
  var st=String(r.status||"");
  return SH_OPEN.indexOf(st)>=0 || /대기|모집|접수/.test(st);
}

/* ── 내 업체가 커버하는 분야·지역 ── */
function shCover(sups){
  var mains={}, regions={}, all=false;
  (sups||[]).forEach(function(s){
    (s.category_mains||[]).forEach(function(k){ mains[k]=1; });
    if(!(s.category_mains||[]).length){
      (s.categories||[]).forEach(function(v){
        var k=(typeof key8Of==="function")?key8Of(v):null; if(k) mains[k]=1;
      });
    }
    var rs=(s.regions&&s.regions.length)?s.regions:(s.region?[s.region]:[]);
    rs.forEach(function(r){
      var v=String(r||"").trim(); if(!v) return;
      if(v==="전국"){ all=true; return; }
      regions[v.split(/[\s·]/)[0]]=1;   /* "경기 포천시" → "경기" */
    });
  });
  return { mains:Object.keys(mains), regions:Object.keys(regions), all:all };
}

function shRegionHit(cover, region){
  if(cover.all || !cover.regions.length) return true;
  var r=String(region||"").trim(); if(!r) return true;
  return cover.regions.some(function(c){ return r.indexOf(c)>=0 || c.indexOf(r)>=0; });
}

function shMatch(r, cover){
  if(!shOpen(r)) return false;
  if(ME.user && String(r.user_id||"")===String(ME.user.id)) return false;
  if((SH.quoted||{})[String(r.id)]) return false;
  var main=r.category_main || ((typeof key8Of==="function") ? key8Of(r.category||"") : null);
  if(cover.mains.length && main && cover.mains.indexOf(main)<0) return false;
  return shRegionHit(cover, r.region);
}

/* ── 불러오기 (mapReq 는 category_main·status 를 버려서 원본을 직접 씁니다) ── */
async function shLoad(){
  if(SH.busy) return; SH.busy=true;
  try{
    var rq=await selectSafe("purchase_requests", function(q){
      return q.order("created_at",{ascending:false}).limit(60); });
    SH.reqs=rq.unavailable ? null : (rq.data||[]);

    if(ME.user){
      var sp=await selectSafe("suppliers", function(q){ return q.eq("user_id", ME.user.id); });
      SH.sups=sp.unavailable ? [] : (sp.data||[]);
      var qt=await selectSafe("quotes", function(q){ return q.eq("user_id", ME.user.id); });
      var m={}; (qt.data||[]).forEach(function(x){ if(x.status!=="철회") m[String(x.request_id)]=1; });
      SH.quoted=m;
    } else { SH.sups=[]; SH.quoted={}; }
  }catch(e){ SH.reqs=SH.reqs||null; }
  SH.busy=false;
  try{ shPaintHome(); }catch(e){}
  try{ if((document.querySelector(".pg.on")||{}).id==="pg-sj") sjPitch(); }catch(e){}
}

function shCatName(r){
  var k=r.category_main||((typeof key8Of==="function")?key8Of(r.category||""):null);
  var c=(k && typeof cat8Of==="function")?cat8Of(k):null;
  return c?c.nm:(r.category||"요청");
}
function shReqRow(r, cta){
  return '<div class="ritem" style="margin-bottom:8px;" onclick="gOpenRequest(\''+esc(String(r.id))+'\')">'+
    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">'+
      '<span class="gbadge gb-or">'+esc(shCatName(r))+'</span>'+
      (r.region?'<span class="gbadge gb-gy">'+esc(r.region)+'</span>':'')+
      '<span style="margin-left:auto;font-size:12px;color:var(--ink4);">'+esc(ago(r.created_at))+'</span>'+
    '</div>'+
    '<div class="ritem-t">'+esc(r.title||r.description||shCatName(r)+" 요청")+'</div>'+
    '<div class="ritem-m"><span>견적 '+(Number(r.quote_count)||0)+'건</span>'+
      (r.deadline?'<span>희망일 '+esc(String(r.deadline).slice(0,10))+'</span>':'')+
      (cta?'<span style="margin-left:auto;color:var(--gn);font-weight:700;">'+esc(cta)+' ›</span>':'')+
    '</div></div>';
}

/* ══ 1. 업체 등록 화면의 설득 구간 ══════════════════════════════════ */
function sjPitch(){
  var body=$("ob-body"); if(!body) return;
  if(OB.edit || OB.step!==1){ var g=$("sj-pitch"); if(g) g.remove(); return; }
  if(SH.reqs===null && !SH.busy){ shLoad(); }

  var open=(SH.reqs||[]).filter(shOpen);
  var recent=open.slice(0,4);

  var live = (SH.reqs===null)
    ? '<div class="ghint">요청 현황을 불러오지 못했습니다. 연결이 되면 여기에 표시됩니다.</div>'
    : (open.length
        ? '<div style="font-size:13.5px;color:var(--ink2);font-weight:600;margin-bottom:10px;">'+
            '지금 답을 기다리는 요청 <b style="color:var(--gn);">'+open.length+'건</b></div>'+
          recent.map(function(r){ return shReqRow(r); }).join("")
        : '<div class="gempty" style="padding:22px 16px;">'+
            '<div class="gempty-t">아직 올라온 요청이 없습니다</div>'+
            '<div class="gempty-d">먼저 등록해 두면 첫 요청이 올라올 때 가장 먼저 알림을 받습니다.</div></div>');

  var html=
    '<div id="sj-pitch">'+
      '<div class="gcard" style="border-color:var(--gnb);background:var(--gnl);">'+
        '<div style="font-size:21px;font-weight:800;letter-spacing:-.04em;color:var(--gn-on-tint);line-height:1.35;margin-bottom:8px;">'+
          '요청은 이미 올라오고 있습니다</div>'+
        '<div style="font-size:14px;color:var(--ink2);line-height:1.7;">'+
          '원육·가공·물류·인력·장비·창업까지, 축산 현장에서 필요한 것을 올리는 곳입니다.<br>'+
          '업체로 등록하면 <b>내 분야·내 지역</b> 요청만 골라서 받습니다.</div>'+
      '</div>'+
      '<div class="gcard"><div class="gcard-t">등록하면 이런 일이 생깁니다</div>'+
        '<div class="gsum">'+
          '<div class="gsum-r"><div class="gsum-k">요청 알림</div><div class="gsum-v">고른 분야·지역의 요청이 올라오면 바로 알림이 갑니다</div></div>'+
          '<div class="gsum-r"><div class="gsum-k">견적 발송</div><div class="gsum-v">단가 × 수량으로 견적을 보내면 요청자가 다른 견적과 나란히 비교합니다</div></div>'+
          '<div class="gsum-r"><div class="gsum-k">채팅·거래</div><div class="gsum-v">선택되면 1:1 채팅으로 조건을 맞추고 거래 상태를 함께 봅니다</div></div>'+
          '<div class="gsum-r"><div class="gsum-k">인증 배지</div><div class="gsum-v">사업자·축산물 허가·HACCP 을 등록하면 목록에서 먼저 보입니다</div></div>'+
        '</div>'+
      '</div>'+
      '<div class="gcard"><div class="gcard-t">지금 올라온 요청</div>'+live+'</div>'+
      '<div class="gnote">베타 기간에는 등록도 견적 발송도 무료입니다. '+
        '유료로 바뀌게 되면 미리 공지하고, 그 전에 보낸 견적에는 수수료를 받지 않습니다.</div>'+
      '<div style="font-size:13px;color:var(--ink3);font-weight:600;margin:18px 0 10px;">아래에서 3분이면 등록됩니다</div>'+
    '</div>';

  var old=$("sj-pitch");
  if(old){ old.outerHTML=html; return; }
  body.insertAdjacentHTML("afterbegin", html);
}

/* ══ 2. 홈 — 내 업체에 맞는 요청 ═══════════════════════════════════ */
function shHost(){
  var el=$("sec-supreq");
  if(el) return el;
  var cat=document.querySelector(".sec-cat8"); if(!cat) return null;
  el=document.createElement("section");
  el.className="sec"; el.id="sec-supreq"; el.hidden=true;
  el.innerHTML='<div class="w"><div class="sec-hd2 row">'+
      '<div><h2 class="sec-h2">내 업체에 맞는 요청</h2>'+
      '<p class="sec-d2" id="supreq-sub"></p></div>'+
      '<button class="more-btn" onclick="go(&quot;reqs&quot;)">전체 요청 ›</button></div>'+
    '<div id="supreq-list"></div></div>';
  cat.parentNode.insertBefore(el, cat.nextSibling);
  return el;
}

function shPaintHome(){
  var host=shHost(); if(!host) return;
  var sups=SH.sups||[];
  if(!ME.user || !sups.length){ host.hidden=true; return; }

  var cover=shCover(sups);
  var hits=(SH.reqs||[]).filter(function(r){ return shMatch(r, cover); });
  var list=$("supreq-list"), sub=$("supreq-sub");
  if(!list) return;

  host.hidden=false;
  var names=sups.map(function(s){ return s.name; }).slice(0,2).join(" · ")+
            (sups.length>2?(" 외 "+(sups.length-2)+"곳"):"");
  if(sub) sub.textContent = names + "의 분야·지역에 맞는 요청만 골랐습니다";

  if(!hits.length){
    list.innerHTML='<div class="gempty" style="padding:26px 16px;">'+
      '<div class="gempty-t">지금은 맞는 요청이 없습니다</div>'+
      '<div class="gempty-d">분야나 지역을 넓히면 더 많은 요청을 받을 수 있습니다.</div>'+
      '<button class="gbtn gbtn-w gbtn-sm" style="margin-top:12px;" onclick="gEditSupplier(\''+esc(String(sups[0].id))+'\')">업체 정보 수정</button>'+
      '</div>';
    return;
  }
  list.innerHTML=hits.slice(0,5).map(function(r){ return shReqRow(r,"견적 보내기"); }).join("")+
    (hits.length>5?'<button class="gbtn gbtn-w gbtn-sm" style="width:100%;margin-top:4px;" onclick="go(&quot;reqs&quot;)">맞는 요청 '+hits.length+'건 전체 보기</button>':"");
}

/* 거래관리 → 회원·업체정보 에도 같은 요약을 얹습니다 */
function shPaintMy(){
  if(MY.tab!=="me") return;
  var el=$("my-panel"); if(!el || $("my-supreq")) return;
  var sups=(MY.sups&&MY.sups.length)?MY.sups:(SH.sups||[]);
  if(!sups.length) return;
  var cover=shCover(sups);
  var hits=(SH.reqs||[]).filter(function(r){ return shMatch(r, cover); });
  var d=document.createElement("div");
  d.className="gcard"; d.id="my-supreq";
  d.innerHTML='<div class="gcard-t">내 업체에 맞는 요청 ('+hits.length+')</div>'+
    (hits.length ? hits.slice(0,5).map(function(r){ return shReqRow(r,"견적 보내기"); }).join("")
     : '<div class="ghint">지금은 맞는 요청이 없습니다. 분야·지역을 넓히면 더 받습니다.</div>');
  el.insertBefore(d, el.firstChild);
}

/* ── 연결 ── */
function patchSupHome(){
  if(G._supHome) return; G._supHome=true;

  /* 등록 화면을 그릴 때마다 설득 구간을 다시 얹습니다 */
  if(typeof obRender==="function"){
    var origRender=obRender;
    obRender=function(){
      origRender.apply(this, arguments);
      try{ sjPitch(); }catch(e){}
    };
  }
  /* 거래관리 패널 */
  if(typeof renderMyPanel==="function"){
    var origPanel=renderMyPanel;
    renderMyPanel=function(){
      origPanel.apply(this, arguments);
      try{ shPaintMy(); }catch(e){}
    };
  }
  /* 로그인 상태가 바뀌면 내 업체가 달라지므로 다시 읽습니다.
     loadSession 은 IIFE 안의 지역 함수라 지역 바인딩을 다시 씁니다. */
  if(typeof loadSession==="function"){
    var origSess=loadSession;
    loadSession=async function(){
      var r=await origSess.apply(this, arguments);
      SH.reqs=null; SH.sups=null; SH.quoted=null;
      shLoad();
      return r;
    };
  }

  /* 비로그인 방문자에게는 홈에서 이 목록이 아예 안 보이므로 미리 읽지 않습니다.
     업체 등록 화면에 들어가면 sjPitch() 가 그때 불러옵니다. */
  if(ME.user) shLoad();
}

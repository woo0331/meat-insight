/* ════════════════════════════════════════════════════════════════════
   구인구직 — 등록 경로 통합 · 지원 동선 연결
   문제 1) 요청 마법사로 올린 구인 공고는 purchase_requests 에 저장되는데
           구인구직 페이지는 jobs 테이블만 읽고 있어서, 올린 공고가
           구인구직 페이지에 나타나지 않았습니다.
   문제 2) 공고 카드와 "지원하기" 버튼이 전부 go("rw") — 요청서 작성
           화면으로만 이동해서, 어느 공고에 지원하는지 알 수 없었습니다.
   두 출처를 합쳐서 보여주고, 지원 동선을 각각 실제 목적지로 연결합니다.
   ════════════════════════════════════════════════════════════════════ */

var JB = { rows:[], filter:"all", open:{} };

function jbEmpType(v){
  var s=String(v||"");
  if(/계약/.test(s)) return "contract";
  if(/알바|아르바이트|단기/.test(s)) return "part";
  return "full";
}
function jbFromJob(j){
  return {
    key:"j:"+j.id, src:"job", id:j.id,
    type:(j.kind==="seek"?"seek":jbEmpType(j.employment)), urgent:!!j.is_urgent,
    role:j.job_role||"채용", biz:(j.kind==="seek"?((j.applicant_name||"구직자")+" (구직)"):(j.company||"업체")),
    loc:j.location||"-", pay:j.pay||"협의", emp:j.employment||"정규직",
    when:(typeof relTime==="function"?relTime(j.created_at):""), benefit:j.detail||"",
    contact:j.contact||null, exp:j.experience||null, kind:j.kind||"hire", created_at:j.created_at
  };
}
function jbFromReq(r){
  var d=(r.detail && typeof r.detail==="object") ? r.detail : {};
  var role=Array.isArray(d.role)?d.role.join("·"):(d.role||r.title||"채용");
  var pay=d.pay ? (String(d.pay)+"만원/월") : "협의";
  return {
    key:"r:"+r.id, src:"req", id:r.id, reqId:r.id,
    type:jbEmpType(d.employment), urgent:false,
    role:role, biz:d.company||r.buyer_company||r.buyer_name||"업체",
    loc:d.region||r.region||"전국", pay:pay, emp:d.employment||"정규직",
    when:(typeof relTime==="function"?relTime(r.created_at):""), benefit:d.etc||"",
    contact:null, exp:d.exp||null, kind:"hire",
    headcount:d.headcount||null, created_at:r.created_at, status:r.status
  };
}

async function jbLoad(){
  var rows=[];
  var jr=await selectSafe("jobs", function(q){ return q.order("created_at",{ascending:false}).limit(200); });
  (jr.data||[]).forEach(function(j){ rows.push(jbFromJob(j)); });
  var rr=await selectSafe("purchase_requests", function(q){
    return q.eq("category_main","job").order("created_at",{ascending:false}).limit(200);
  });
  (rr.data||[]).forEach(function(r){
    if(r.status==="완료") return;
    rows.push(jbFromReq(r));
  });
  rows.sort(function(a,b){ return String(b.created_at||"").localeCompare(String(a.created_at||"")); });
  JB.rows=rows;
  return rows;
}

/* ── 지원 동선 ── */
window.gJobApply=function(key){
  var j=JB.rows.find(function(x){ return x.key===key; }); if(!j) return;
  if(j.src==="req" && typeof gOpenRequest==="function"){ gOpenRequest(j.reqId); return; }
  if(j.contact){ location.href="tel:"+String(j.contact).replace(/[^0-9+]/g,""); return; }
  toast("이 공고에는 연락처가 등록되어 있지 않습니다.","err");
};
window.gJobToggle=function(key){
  var j=JB.rows.find(function(x){ return x.key===key; }); if(!j) return;
  if(j.src==="req" && typeof gOpenRequest==="function"){ gOpenRequest(j.reqId); return; }
  JB.open[key]=!JB.open[key];
  renderJobsFull();
};

function jbCard(j){
  var seek=(j.type==="seek");
  var accent=seek?"jca-seek":(j.type==="full"?"jca-full":(j.type==="contract"?"jca-contract":"jca-part"));
  var badge =seek?"jeb-seek":(j.type==="full"?"jeb-full":(j.type==="contract"?"jeb-contract":"jeb-part"));
  var btxt  =seek?"구직":(j.type==="full"?"정규직":(j.type==="contract"?"계약직":"알바"));
  var opened=!!JB.open[j.key];
  var det=[];
  if(j.exp) det.push(["경력", j.exp]);
  if(j.headcount) det.push(["모집 인원", j.headcount+"명"]);
  if(j.benefit) det.push(["근무 조건", j.benefit]);
  if(j.contact) det.push(["연락처", j.contact]);

  return '<div class="job-card" onclick="gJobToggle(\''+esc(j.key)+'\')">'+
    '<div class="job-card-accent '+accent+'"></div>'+
    '<div class="job-card-body">'+
      '<div class="job-card-main">'+
        '<div class="job-card-top">'+
          '<span class="job-emp-badge '+badge+'">'+btxt+'</span>'+
          (j.urgent?'<span class="job-urgent">급구</span>':'')+
          (j.src==="req"?'<span class="job-src">고리 요청</span>':'')+
        '</div>'+
        '<div class="job-role">'+esc(j.role)+'</div>'+
        '<div class="job-meta">'+
          '<span class="job-biz">'+esc(j.biz)+'</span>'+
          '<span class="job-loc">'+esc(j.loc)+'</span>'+
          (j.benefit&&!opened?'<span class="job-benefit">· '+esc(String(j.benefit).slice(0,40))+'</span>':'')+
        '</div>'+
      '</div>'+
      '<div class="job-card-right">'+
        '<div class="job-pay">'+esc(j.pay)+'</div>'+
        '<div class="job-date">'+esc(j.when)+'</div>'+
        '<button class="job-apply-btn" onclick="event.stopPropagation();gJobApply(\''+esc(j.key)+'\')">'+
          (j.src==="req"?"공고 보기":(j.contact?(seek?"전화 연락":"전화 지원"):"연락처 없음"))+'</button>'+
      '</div>'+
    '</div>'+
    (opened&&det.length?'<div class="job-det">'+det.map(function(d){
       return '<div class="job-det-r"><div class="job-det-k">'+esc(d[0])+'</div><div class="job-det-v">'+esc(d[1])+'</div></div>';
     }).join("")+'</div>':'')+
  '</div>';
}

window.renderJobsFull=function(){
  var el=document.getElementById("job-full"); if(!el) return;
  /* 예전 안내 배너는 이 화면 안으로 옮겼으므로 중복 노출을 막습니다 */
  var oldNote=document.getElementById("jobs-split"); if(oldNote && oldNote.parentNode) oldNote.parentNode.removeChild(oldNote);
  var rows=JB.rows;
  var cnt=function(t){ return rows.filter(function(j){ return j.type===t; }).length; };
  var urgent=rows.filter(function(j){ return j.urgent; }).length;

  var data=rows;
  if(JB.filter==="urgent") data=rows.filter(function(j){ return j.urgent; });
  else if(JB.filter!=="all") data=rows.filter(function(j){ return j.type===JB.filter; });

  var seekN=cnt("seek");
  var btns=[["전체","all",""],["🔴 급구","urgent","urgent-btn"],["정규직","full",""],["계약직","contract",""],["알바","part",""]];
  if(seekN) btns.push(["구직 프로필","seek",""]);

  el.innerHTML=
    '<div class="jobs-split2">'+
      '<div><b>정규직·장기 채용입니다.</b> 오늘·내일 바로 필요한 현장 인력은 당일알바에서 찾으세요.</div>'+
      '<div class="grow keep" style="flex:0 0 auto;">'+
        '<button class="gbtn gbtn-w gbtn-sm" onclick="gOpenDaily()">당일알바</button>'+
        '<button class="gbtn gbtn-w gbtn-sm" onclick="go(&quot;wprof&quot;)">구직 프로필 등록</button></div>'+
    '</div>'+
    '<div class="job-stats-bar">'+
      '<div class="jsb-item"><span class="jsb-dot" style="background:var(--gn)"></span>정규직 <span class="jsb-count">'+cnt("full")+'건</span></div>'+
      '<div class="jsb-item"><span class="jsb-dot" style="background:var(--navy)"></span>계약직 <span class="jsb-count">'+cnt("contract")+'건</span></div>'+
      '<div class="jsb-item"><span class="jsb-dot" style="background:#8A9AAA"></span>알바 <span class="jsb-count">'+cnt("part")+'건</span></div>'+
      (seekN?'<div class="jsb-item"><span class="jsb-dot" style="background:var(--blue)"></span>구직 <span class="jsb-count">'+seekN+'건</span></div>':'')+
      (urgent?'<div class="jsb-item" style="margin-left:auto;"><span style="color:var(--red);font-weight:700;">🔴 급구 '+urgent+'건</span></div>':'')+
    '</div>'+
    '<div class="job-filter-bar" style="padding:12px 0 0;">'+
      btns.map(function(b){
        return '<button class="job-filter-btn'+(JB.filter===b[1]?" on":"")+(b[2]?" "+b[2]:"")+
          '" onclick="gJobFilter(\''+b[1]+'\')">'+b[0]+'</button>';
      }).join("")+'</div>'+
    '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;" id="job-list2">'+
      (data.length ? data.map(jbCard).join("")
        : '<div class="gempty"><div class="gempty-t">'+(rows.length?"해당 공고가 없습니다":"등록된 공고가 아직 없습니다")+'</div>'+
          '<div class="gempty-d">사람이 필요하면 공고를 올려보세요. 조건에 맞는 구직자에게 노출됩니다.</div>'+
          '<button class="gbtn gbtn-p gbtn-sm" onclick="goUX(\'prof\')">구인 공고 올리기</button></div>')+
    '</div>';
};
window.gJobFilter=function(v){ JB.filter=v; window.renderJobsFull(); };

function patchJobs(){
  if(JB._patched) return; JB._patched=true;

  /* 구인구직 페이지에 들어올 때마다 두 출처를 다시 합칩니다 */
  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(p){
      var r=origGo.apply(this, arguments);
      if(p==="jobs") jbLoad().then(function(){ window.renderJobsFull(); });
      return r;
    };
  }
  jbLoad().then(function(){
    if((document.querySelector(".pg.on")||{}).id==="pg-jobs") window.renderJobsFull();
  });
}

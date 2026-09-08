/* ════════════════════════════════════════════════════════════════════
   예시 데이터 — 문 열기 전 빈 화면 채우기

   DB 가 비어 있으니 "아직 없습니다" 만 늘어서서 사이트가 휑합니다.
   그렇다고 가짜를 진짜처럼 넣으면 안 됩니다 (예전에 넣어 둔 가짜 기사
   제목을 전부 걷어낸 이유입니다).

   그래서 이렇게 합니다.
     · 진짜 데이터가 하나도 없을 때만 나옵니다. 하나라도 들어오면
       예시는 그 순간 사라집니다.
     · 카드마다 "예시" 배지가 붙고, 화면 위에 안내 띠가 뜹니다.
     · 끄는 버튼이 안내 띠 안에 있습니다. 끈 상태는 기억합니다.
     · DB 에 아무것도 쓰지 않습니다. 화면에만 있습니다.
     · site-info.js 의 GORI_FEATURES.demo 로 통째로 끕니다.

   일부러 뺀 것
     시세 — 돈을 걸고 판단하는 숫자라 예시라도 보여주면 안 됩니다.
     뉴스 — 없는 기사 제목은 그 자체가 허위정보입니다.
     둘 다 지금처럼 빈 상태를 지킵니다.

   업체 이름은 ○○ 로 시작해 실제 상호로 오해할 수 없게 했습니다.
   ════════════════════════════════════════════════════════════════════ */

var DM_KEY="gori.demoOff";

function dmEnabled(){
  var f=(typeof window.GORI_FEATURES==="object" && window.GORI_FEATURES) || {};
  if(f.demo===false) return false;
  try{ if(localStorage.getItem(DM_KEY)==="1") return false; }catch(e){}
  return f.demo===true;
}

/* ── 예시 요청 ── */
var DM_REQS=[
  {cat:"원육 구매", title:"한우 등심 300kg 정기 납품처 찾습니다", region:"경기 성남", q:3, t:"20분 전"},
  {cat:"가공·OEM",  title:"돼지 앞다리 발골·정형 위탁 (주 2톤)",   region:"충북 청주", q:2, t:"1시간 전"},
  {cat:"물류·운송", title:"냉장 5톤 정기배송 — 부산에서 서울",      region:"부산",     q:1, t:"3시간 전"},
  {cat:"인력·알바", title:"발골 기사 2명 (주 5일, 숙소 제공)",       region:"경기 이천", q:0, t:"5시간 전"},
  {cat:"장비·부자재", title:"중고 육절기 매입 문의",                 region:"대구",     q:1, t:"어제"},
  {cat:"HACCP·컨설팅", title:"소규모 작업장 HACCP 인증 컨설팅",      region:"전북 익산", q:2, t:"어제"}
];

/* ── 예시 업체 ── */
var DM_SUPS=[
  {nm:"○○축산 도축장",   region:"경기 포천", cats:["도축","발골","정형"], rt:4.8, vf:true},
  {nm:"○○냉장물류",      region:"경기 화성", cats:["냉장운송","전국운송"], rt:4.6, vf:true},
  {nm:"○○미트 육가공",   region:"충남 천안", cats:["OEM","세절","포장"],  rt:4.7, vf:true},
  {nm:"○○기계",          region:"대구 북구", cats:["육절기","진공기"],     rt:4.4, vf:false},
  {nm:"○○인력",          region:"경기 이천", cats:["발골기사","생산인력"], rt:4.5, vf:false},
  {nm:"○○HACCP 컨설팅",  region:"서울 송파", cats:["HACCP","위생"],        rt:4.9, vf:true}
];

/* ── 예시 구인 ── */
var DM_JOBS=[
  {role:"발골 기사",   company:"○○축산",   loc:"경기 이천", pay:"월 380만원", emp:"정규직"},
  {role:"정형 기사",   company:"○○미트",   loc:"충남 천안", pay:"월 340만원", emp:"정규직"},
  {role:"포장 인력",   company:"○○냉장",   loc:"경기 화성", pay:"일 13만원",  emp:"단기"}
];

function dmMarkAll(){
  /* 그려진 카드마다 "예시" 배지를 답니다 */
  [".rc",".sc2",".job-card",".ritem"].forEach(function(sel){
    [].slice.call(document.querySelectorAll("#pg-h "+sel+", #pg-reqs "+sel+", #pg-suppliers "+sel+", #pg-jobs "+sel))
      .forEach(function(c){
        if(c.querySelector(".dm-tag")) return;
        var b=document.createElement("span");
        b.className="dm-tag"; b.textContent="예시";
        c.insertBefore(b, c.firstChild);
      });
  });
}

/* 목록은 여러 곳에서 다시 그려집니다 (분야 거르기·리디자인 패치 등).
   한 번 붙이고 마는 것으로는 배지가 지워집니다 — 다시 그려질 때마다 답니다.
   배지를 다는 것도 DOM 변경이라, 되먹임을 끊으려고 붙이는 동안은
   관찰을 잠시 멈춥니다. */
var dmObs=null, dmBusy=false;
function dmWatch(){
  if(dmObs || typeof MutationObserver!=="function") return;
  dmObs=new MutationObserver(function(){
    if(dmBusy) return;
    dmBusy=true;
    setTimeout(function(){
      try{ if(dmEnabled()) dmMarkAll(); }catch(e){}
      dmBusy=false;
    }, 60);
  });
  ["rq-widget","rq-list-full","sup-home","sup-full","job-widget","job-list-full"].forEach(function(id){
    var el=$(id); if(el) dmObs.observe(el, {childList:true, subtree:true});
  });
}

function dmBanner(){
  if($("dm-bar")) return;
  var d=document.createElement("div");
  d.id="dm-bar"; d.className="dm-bar"; d.setAttribute("role","status");
  d.innerHTML=
    '<span class="dm-bar-t">지금 보이는 요청·업체는 <b>예시</b>입니다. '+
    '실제 요청이 하나라도 올라오면 자동으로 사라집니다.</span>'+
    '<button class="dm-bar-x" type="button" onclick="gDemoOff()">예시 끄기</button>';
  var host=document.querySelector("#pg-h .gh .gh-w") || document.querySelector("#pg-h .gh");
  if(host) host.insertBefore(d, host.firstChild);
}

window.gDemoOff=function(){
  try{ localStorage.setItem(DM_KEY,"1"); }catch(e){}
  location.reload();
};

function dmFill(){
  if(!dmEnabled()) return;
  if(typeof REQS==="undefined") return;

  /* 연결이 끊겼을 때는 절대 채우지 않습니다.
     "못 불러왔다" 를 말해야 할 자리에 예시를 깔면, 서버가 죽은 것을
     "원래 비어 있다" 로 보이게 만듭니다. 27_offline 이 그 자리를
     쓰도록 비켜 줍니다. */
  if(typeof netDown==="function"){
    try{ if(netDown()) return; }catch(e){}
  }

  var did=false;

  if(!REQS.length && typeof mapReq==="function"){
    REQS=DM_REQS.map(function(r,i){
      return mapReq({ id:"demo-r"+i, title:r.title, region:r.region, category:r.cat,
        quote_count:r.q, created_at:new Date(Date.now()-(i+1)*3600000).toISOString(),
        status:"견적대기" });
    });
    REQS.forEach(function(x,i){ x.time=DM_REQS[i].t; x.meta=(DM_REQS[i].region||"전국")+" / "+DM_REQS[i].t; });
    try{ renderRQWidget(); renderReqs(); }catch(e){}
    did=true;
  }

  if(typeof SUPS!=="undefined" && !SUPS.length && typeof mapSup==="function"){
    SUPS=DM_SUPS.map(function(s,i){
      return mapSup({ id:"demo-s"+i, name:s.nm, region:s.region, categories:s.cats,
        rating:s.rt, is_verified:s.vf, created_at:new Date().toISOString() });
    });
    /* 랭킹·신규업체 위젯(소식·정보 칸)은 일부러 채우지 않습니다.
       거기는 뉴스·매물과 같은 자리라 빈 상태를 지켜야 합니다 —
       예시 업체로 "랭킹 1위" 를 만들어 보여줄 이유가 없습니다. */
    try{
      renderSupHome(typeof curSC!=="undefined"?curSC:"all");
      renderSups(typeof curSC!=="undefined"?curSC:"all");
    }catch(e){}
    did=true;
  }

  if(typeof JOBS!=="undefined" && !JOBS.length && typeof mapJob==="function"){
    JOBS=DM_JOBS.map(function(j,i){
      return mapJob({ id:"demo-j"+i, job_role:j.role, company:j.company, location:j.loc,
        pay:j.pay, employment:j.emp, kind:"hire",
        created_at:new Date(Date.now()-(i+1)*7200000).toISOString() });
    });
    try{ if(typeof renderJobWidget==="function") renderJobWidget();
         if(typeof renderJobsFull==="function") renderJobsFull(); }catch(e){}
    did=true;
  }

  if(did){ dmBanner(); dmMarkAll(); dmWatch(); }
}

function patchDemo(){
  if(G._demo) return; G._demo=true;
  dmFill();
  /* DB 응답이 늦게 올 수 있어 한 번 더 봅니다. 그때 실데이터가 있으면
     위 조건(!REQS.length)에서 걸러져 예시는 들어가지 않습니다. */
  setTimeout(dmFill, 2200);
  /* 화면을 옮겨 다녀도 배지가 유지되게 */
  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(){
      var r=origGo.apply(this, arguments);
      setTimeout(function(){ try{ if(dmEnabled()) dmMarkAll(); }catch(e){} }, 260);
      return r;
    };
  }
}

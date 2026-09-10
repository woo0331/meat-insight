/* ════════════════════════════════════════════════════════════════════
   메인 2026 — 지역 찾기 · 오늘의 축산 브리핑 · 찾아보세요 · 브랜드 선언 ·
                마지막 행동 · 빈 구간 자동 숨김

   전부 새 구간을 "끼워 넣는" 일이라, 이 파일이 통째로 빠져도 예전 홈이
   그대로 나옵니다. 기존 함수는 하나도 지우지 않았습니다.

   ⚠️ 지어내지 않습니다 (CLAUDE.md 3번)
      · 시세는 관리자가 넣은 market_prices 만.
      · 뉴스는 GORI_CONTENT.news 만.
      · "찾아보세요" 카드는 실제 요청이 아니라 **활용 예시**라고 화면에
        적어 둡니다. 요청처럼 보이게 만들면 안 됩니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── 공통 ─────────────────────────────────────────────────────────── */
function mnDemo(){ try{ return typeof dmEnabled==="function" && dmEnabled(); }catch(e){ return false; } }
function mnSec(cls, id, inner){
  var el=document.createElement("section");
  el.className=cls; if(id) el.id=id;
  el.innerHTML='<div class="w">'+inner+'</div>';
  return el;
}
function mnAfter(host, node){ if(host&&host.parentNode) host.parentNode.insertBefore(node, host.nextSibling); }

/* ══ 지역으로 업체 찾기 ═══════════════════════════════════════════════
   suppliers.region / regions 가 이미 있으므로 진짜 필터로 붙입니다.
   업체가 아직 없어도 이 줄은 보여 줍니다 — 목록을 좁히는 길잡이지
   "업체가 이만큼 있다" 는 주장이 아니기 때문입니다. */
var MN_REGIONS=["서울","경기","인천","강원","충북","충남","대전","전북",
                "전남","광주","경북","경남","대구","부산","울산","제주"];
var MN_REG="all";
G.MN_REGIONS=MN_REGIONS;

/* 업체가 그 지역에서 영업하는지 — 소재지(region) 또는 영업지역(regions) */
function mnInRegion(s, r){
  if(!r || r==="all") return true;
  if(s.region && s.region.indexOf(r)>=0) return true;
  var rs=s.regions||[];
  for(var i=0;i<rs.length;i++){
    var v=String(rs[i]||"");
    if(v.indexOf(r)>=0 || v.indexOf("전국")>=0) return true;
  }
  return false;
}

window.gPickSupRegion=function(r){
  MN_REG=(MN_REG===r)?"all":r;
  mnPaintRegionChips();
  if(typeof go==="function") go("suppliers");
  try{ renderSups(typeof curSC!=="undefined"?curSC:"all"); }catch(e){}
  try{ window.scrollTo(0,0); }catch(e){}
};

function mnPaintRegionChips(){
  document.querySelectorAll(".rgx-chip").forEach(function(b){
    b.classList.toggle("on", b.dataset.r===MN_REG);
    b.setAttribute("aria-pressed", b.dataset.r===MN_REG ? "true" : "false");
  });
  var n=$("rgx-now"); if(n) n.textContent = MN_REG==="all" ? "" : MN_REG+" 업체만 보는 중";
}

function mnRegionRow(){
  return '<div class="rgx">'+
    '<div class="rgx-hd"><div class="rgx-t">지역으로 업체 찾기</div>'+
      '<div class="rgx-s" id="rgx-now"></div></div>'+
    '<div class="rgx-row">'+
      '<button class="rgx-chip on" data-r="all" aria-pressed="true" onclick="gPickSupRegion(\'all\')">전국</button>'+
      MN_REGIONS.map(function(r){
        return '<button class="rgx-chip" data-r="'+r+'" aria-pressed="false" '+
          'onclick="gPickSupRegion(\''+r+'\')">'+r+'</button>';
      }).join("")+
    '</div></div>';
}

/* 홈이 아니라 업체 찾기 화면에 답니다.
   홈의 "업종별 바로 찾기" 바로 밑에 시·도 16개를 더 깔면 첫 화면에서
   고를 것이 스물여덟 개가 됩니다 — 고르라는 화면이 아니라 헤매는 화면이
   됩니다. 기능은 그대로, 자리만 옮겼습니다. */
function mnInjectRegion(){
  if($("rgx-sec")) return;
  var host=$("sup-full"); if(!host) return;
  var d=document.createElement("div"); d.id="rgx-sec"; d.innerHTML=mnRegionRow();
  d.querySelector(".rgx").classList.add("rgx-page");
  host.parentNode.insertBefore(d, host);
}

/* 업체 목록에 지역 필터를 물립니다 (원래 함수는 그대로 두고 감쌉니다) */
function mnWrapSups(){
  if(typeof window.renderSups!=="function") return;
  var orig=window.renderSups;
  window.renderSups=function(cat){
    if(MN_REG==="all") return orig.apply(this, arguments);
    var all=SUPS, kept=SUPS.filter(function(s){ return mnInRegion(s, MN_REG); });
    SUPS=kept;
    var r; try{ r=orig.apply(this, arguments); } finally { SUPS=all; }
    var el=$("sup-full");
    if(el && !kept.length){
      el.innerHTML='<div class="es"><div class="es-t">'+esc(MN_REG)+'에 등록된 업체가 아직 없습니다</div>'+
        '<div class="es-d">다른 지역을 고르거나, 요청을 올리면 조건이 맞는 업체가 견적을 보냅니다.</div>'+
        '<button class="es-btn" onclick="gPickSupRegion(\'all\')">전국으로 보기</button></div>';
    }
    return r;
  };
}

/* ══ 히어로 정리 ══════════════════════════════════════════════════
   지역 선택·알림을 헤더로 옮깁니다. 히어로는 기능 대시보드가 아니라
   메시지 하나와 검색창이 있는 자리입니다.

   ⚠️ 버튼을 다시 만들지 않고 통째로 옮깁니다 — id 와 onclick
      (gPickRegion · gHeroBell · gh-region-tx · gh-bell-dot)이 그대로
      따라가야 지역·알림이 계속 동작합니다.
   ⚠️ .hdr-actions 안에 넣으면 renderHeaderUser() 가 지웁니다. 바깥입니다. */
function mnMoveHeroTools(){
  var util=document.querySelector("#pg-h .ph-util"); if(!util) return;
  var right=document.querySelector(".hdr .hdr-right");
  var drawer=document.querySelector("#mobile-menu .mm-row");
  if(!right) return;

  /* 알림은 헤더에 — 새 소식은 어디서나 보여야 합니다 */
  var bell=util.querySelector(".gh-bell");
  if(bell){
    var slot=$("hdr-tools");
    if(!slot){
      slot=document.createElement("div"); slot.id="hdr-tools"; slot.className="hdr-tools";
      right.insertBefore(slot, right.firstChild);
    }
    slot.appendChild(bell);
  }

  /* 지역 선택은 전체메뉴 안으로.
     헤더에 버튼을 하나 더 얹으면 1200px 안에 안 들어가고, 히어로에 두면
     메인 카피·검색과 경쟁합니다. 업체를 지역으로 좁히는 일은 업체 찾기
     화면의 시·도 줄(.rgx)이 맡습니다. 기능은 그대로입니다. */
  var region=util.querySelector(".gh-region");
  if(region && drawer && !drawer.querySelector(".gh-region")){
    var row=document.createElement("div"); row.className="mm-region";
    row.appendChild(region);
    drawer.appendChild(row);
  }
  util.remove();
}

/* ══ 오늘의 축산 브리핑 ══════════════════════════════════════════════
   기존 "오늘 시세" 구간(#sec-mkt)을 그대로 쓰고 제목과 옆칸만 바꿉니다.
   시세는 17_market 이 market_prices 에서 채웁니다 — 여기서 만들지 않습니다. */
function mnBriefIssue(){
  var news=(window.GORI_CONTENT && window.GORI_CONTENT.news) || [];
  if(!news.length) return "";
  return '<div class="brf-side"><div class="brf-side-t">오늘의 주요 이슈</div>'+
    news.slice(0,3).map(function(n){
      var u=n.url?String(n.url):"";
      return '<'+(u?'a':'div')+' class="brf-news"'+(u?' href="'+esc(u)+'" target="_blank" rel="noopener"':'')+'>'+
        '<span class="brf-news-t">'+esc(n.title||"")+'</span>'+
        (n.source||n.date?'<span class="brf-news-m">'+esc([n.source,n.date].filter(Boolean).join(" · "))+'</span>':'')+
        '</'+(u?'a':'div')+'>';
    }).join("")+
    '<button class="brf-more" onclick="go(&quot;news&quot;)">축산 뉴스 전체 보기 ›</button></div>';
}

function mnBrief(){
  var sec=$("sec-mkt"); if(!sec || sec.hidden) return;
  var w=sec.querySelector(".w"); if(!w) return;

  var hd=w.querySelector(".sec-hd2");
  if(hd && !hd.querySelector(".brf-t")){
    var h=hd.querySelector(".sec-h2");
    if(h){ h.classList.add("brf-t"); h.textContent="오늘의 축산 정보"; }
    var d=document.createElement("p"); d.className="sec-d2 brf-d";
    d.textContent="등록된 시세와 업계 소식입니다";
    if(h && h.parentNode) h.parentNode.appendChild(d);
  }

  var strip=$("mkt-strip"); if(!strip) return;

  /* 시세 줄과 이슈 칸을 두 칸으로 담습니다 (이미 담겨 있으면 그대로).
     ⚠️ 뉴스가 없으면 이슈 칸을 만들지 않습니다 — 빈 칸을 두거나 지어낸
        기사 제목을 채우느니 시세만 보여주는 편이 낫습니다. */
  if(!w.querySelector(".brf-grid")){
    var g=document.createElement("div"); g.className="brf-grid";
    var main=document.createElement("div"); main.className="brf-main";
    strip.parentNode.insertBefore(g, strip);
    main.appendChild(strip);
    g.appendChild(main);
    var more=document.createElement("div"); more.className="brf-act";
    more.innerHTML='<button class="gbtn gbtn-w" onclick="go(&quot;market&quot;)">전체 시세 보기 ›</button>';
    main.appendChild(more);
  }
  var grid=w.querySelector(".brf-grid");
  if(grid && !grid.querySelector(".brf-side")){
    var issue=mnBriefIssue();
    if(issue) grid.insertAdjacentHTML("beforeend", issue);
    else grid.classList.add("brf-solo");     /* 한 칸짜리로 폭을 되돌립니다 */
  }
}

/* ══ 지금 고리에서 찾아보세요 ════════════════════════════════════════
   ⚠️ 실제 요청이 아닙니다. 카드마다 "예시" 를 달고 구간 제목에도 적습니다.
      진짜 요청처럼 보이면 그 순간 거짓말이 됩니다. */
var MN_CASES=[
  {t:"한우 발골·가공업체 찾기", f:["경기","HACCP","냉장"],  k:"process", s:"육가공"},
  {t:"냉장·냉동 물류업체 찾기", f:["수도권","냉장/냉동"],   k:"logi",    s:"물류"},
  {t:"정육점 인테리어 업체 찾기", f:["서울/경기","신규창업"], k:"startup", s:"인테리어"},
  {t:"식당용 한우 공급업체 찾기", f:["한우","등심/안심"],    k:"meat",    s:"소고기"}
];

function mnCases(){
  if($("case-sec")) return null;
  var inner=
    '<div class="cse-hd">'+
      '<h2 class="sec-h2">지금 고리에서 찾아보세요</h2>'+
      '<p class="sec-d2">축산업에 필요한 업체와 서비스를 조건에 맞게 찾아보세요. '+
        '아래는 <b>이렇게 찾을 수 있다는 예시</b>입니다 — 올라온 요청이 아닙니다.</p>'+
    '</div>'+
    '<div class="cse-grid">'+
      MN_CASES.map(function(c){
        return '<button class="cse-c" onclick="pickSub(&quot;'+c.k+'&quot;,&quot;'+c.s+'&quot;)">'+
          '<span class="cse-tag">활용 예시</span>'+
          '<span class="cse-t">'+esc(c.t)+'</span>'+
          '<span class="cse-f">'+c.f.map(function(x){ return '<i>'+esc(x)+'</i>'; }).join("")+'</span>'+
          '<span class="cse-go">이 조건으로 찾기<svg width="15" height="15" viewBox="0 0 24 24" fill="none" '+
            'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" '+
            'aria-hidden="true"><path d="M5 12h13"/><path d="M13 6l6 6-6 6"/></svg></span>'+
          '</button>';
      }).join("")+
    '</div>';
  return mnSec("sec cse-sec", "case-sec", inner);
}

/* ══ 브랜드 선언 ════════════════════════════════════════════════════ */
function mnBrand(){
  if($("brand-sec")) return null;
  var el=document.createElement("section");
  el.className="brand-sec"; el.id="brand-sec";
  el.innerHTML='<div class="w"><div class="brd">'+
    '<h2 class="brd-h">원육에서 식탁까지.<br><span>축산업의 모든 비즈니스가 연결되는 곳.</span></h2>'+
    '<p class="brd-d">생산, 도축, 가공, 유통, 물류, 장비, 정육점, 외식업 그리고 사람까지.<br>'+
      '고리는 흩어져 있던 축산업을 하나로 연결합니다.</p>'+
    '<button class="brd-cta" onclick="gOpenAbout&&gOpenAbout()">고리 알아보기'+
      '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '+
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13"/><path d="M13 6l6 6-6 6"/></svg>'+
    '</button></div></div>';
  return el;
}

/* ══ 마지막 행동 (푸터 바로 위) ══════════════════════════════════════
   ⚠️ 두 개까지만. 세 개 이상이면 아무것도 안 누릅니다. */
function mnFinal(){
  if($("final-sec")) return null;
  return mnSec("sec fin-sec", "final-sec",
    '<div class="fin"><div class="fin-b">'+
      '<h2 class="fin-h">축산업에 필요한 것이 있으신가요?</h2>'+
      '<p class="fin-d">고리에서 필요한 업체와 서비스를 찾아보세요.</p></div>'+
      '<div class="fin-act">'+
        '<button class="gbtn gbtn-p" onclick="go(&quot;suppliers&quot;)">업체 찾아보기</button>'+
        '<button class="gbtn gbtn-w" onclick="go(&quot;sj&quot;)">고리에 업체 등록하기</button>'+
      '</div></div>');
}

/* ══ 데이터가 없는 구간은 메인에서 내립니다 ═══════════════════════════
   ⚠️ 화면과 기능을 지우는 게 아닙니다. 메인 노출만 조건부입니다 —
      #/reqs · #/suppliers · #/community 는 그대로 열립니다.
   ⚠️ 예시 데이터(GORI_FEATURES.demo)로 채우는 중에는 건드리지 않습니다.
      그때는 화면에 "예시" 라고 적혀 있습니다. */
function mnCount(sel){ return document.querySelectorAll(sel).length; }

/* 최종 구조(히어로 · 업종 · 오늘의 정보 · 핵심 서비스 · 이용방법 · 신뢰 ·
   인사이트 · 브랜드 · 마지막 행동)에 없는 구간은 메인에서 내립니다.

   ⚠️ 화면과 라우트는 그대로입니다. 메인 노출만 끕니다 —
      한 줄씩 지우면 바로 되돌아옵니다. */
var MN_OFF=[
  ["#pf-stats-sec",  "지표 줄 — 최종 구조에 없음"],
  ["#case-sec",      "찾아보세요 — 최종 구조에 없음"],
  ["#sec-labor",     "사람이 필요할 때 — 핵심 서비스의 구인구직 카드로 갑니다"],
  [".recruit-banner","업체 유치 배너 — 마지막 행동의 \"업체 등록하기\" 와 중복"]
];
/* GORI INSIGHT 안에서 콘텐츠가 아닌 위젯 — 업체 이야기는 등록 업체 구간이
   맡습니다. 카드가 일곱 장 늘어서면 무엇을 읽으라는 건지 알 수 없습니다. */
var MN_OFF_W=["rank-widget","new-sup-widget","job-widget"];
function mnHideExtra(){
  MN_OFF.forEach(function(r){
    var el=document.querySelector("#pg-h "+r[0]) || document.querySelector(r[0]);
    if(el) el.hidden=true;
  });
  MN_OFF_W.forEach(function(id){
    var el=$(id); if(!el) return;
    var card=el.closest(".info-card") || el.parentNode;
    if(card) card.hidden=true;
  });
}

/* ⚠️ 예시 데이터(GORI_FEATURES.demo)가 켜져 있어도 이 판단은 진짜 데이터로
   합니다. 예시로 채운 구간을 메인에 크게 걸어 두면, 손님에게는 "요청이
   활발한 사이트" 로 읽히고 운영자에게는 실제 유입이 안 보입니다.
   예시는 각 화면(#/reqs · #/suppliers) 안에서 계속 보여 줍니다. */
function mnHideEmpty(){
  var rules=[
    /* 실시간 요청 — 한두 건이면 오히려 휑해 보입니다 */
    {host:"#pg-h #rq-widget", need:3, count:function(){ return (typeof REQS!=="undefined"?REQS.length:0); }},
    /* 상단 실시간 띠도 같은 기준 — 요청 두어 건으로 띠를 돌리면 오히려 한산해 보입니다 */
    {host:"#live-slide", box:"#live-bar", need:3,
     count:function(){ return (typeof REQS!=="undefined"?REQS.length:0); }},
    /* 등록 업체 */
    /* 등록 업체 — 감싸는 상자가 <section> 이 아니라 그냥 <div> 라 .sec-sups 를 봅니다 */
    {host:"#pg-h #sup-home", box:".sec-sups", need:1,
     count:function(){ return (typeof SUPS!=="undefined"?SUPS.length:0); }},
    /* "사람이 필요할 때"(#sec-labor)는 데이터가 아니라 진입 카드 두 장이라
       비어 보일 일이 없습니다 — 건드리지 않습니다. */
  ];
  rules.forEach(function(r){
    var el=document.querySelector(r.host); if(!el) return;
    var sec=(r.box && el.closest(r.box)) || el.closest("section") || el.closest(".sec");
    if(!sec) return;
    var n=0; try{ n=r.count(); }catch(e){}
    sec.hidden = n < r.need;
  });
}

/* 지표 줄 — 진짜 값이 두 칸 이상일 때만 (준비 중 칸만 남으면 휑합니다) */
function mnTrimStats(){
  var sec=$("pf-stats-sec"), el=$("pf-stats"); if(!sec||!el) return;
  /* ⚠️ pfRender() 는 다시 그릴 때마다 이 줄을 켭니다. 지표 줄은 최종 구조에
     없으므로 그려낸 직후인 여기서 다시 끕니다 — 타이머로 따로 돌리면
     한 번 켜졌다 꺼지는 깜빡임이 보입니다. */
  for(var i=0;i<MN_OFF.length;i++){
    if(MN_OFF[i][0]==="#pf-stats-sec"){ sec.hidden=true; return; }
  }
  var cells=[].slice.call(el.querySelectorAll(".pstat-c"));
  if(!cells.length) return;
  var wait=cells.filter(function(c){ return !!c.querySelector(".pstat-v.wait"); });
  var real=cells.length-wait.length;
  if(real<2){ sec.hidden=true; return; }
  wait.forEach(function(c){ c.remove(); });          /* "준비 중" 칸은 내립니다 */
  el.style.gridTemplateColumns="repeat("+real+",1fr)";
}

function patchMain(){
  if(G._main) return; G._main=true;

  try{ mnMoveHeroTools(); }catch(e){}
  try{ mnInjectRegion(); }catch(e){}
  try{ mnWrapSups(); }catch(e){}

  /* 구간 순서 (요청하신 흐름)
       히어로 → 업종·지역 → 오늘의 브리핑 → 찾아보세요 → 주요 서비스 →
       신뢰 → INSIGHT → 데이터 구간 → 브랜드 선언 → 마지막 행동 → 푸터

     ⚠️ 마크업을 옮기는 게 아니라 이미 그려진 <section> 을 다시 꽂습니다.
        안에 붙은 id·핸들러가 그대로 따라갑니다. */
  try{
    var mkt=$("sec-mkt");
    var svc=document.querySelector("#pg-h .svc-sec");
    var cse=mnCases();
    /* 브리핑(시세)을 서비스 앞으로 */
    if(mkt && svc && !mkt.hidden) svc.parentNode.insertBefore(mkt, svc);
    /* 이용 방법(4단계)을 핵심 서비스 바로 뒤로 */
    var proc=$("proc-grid"), procSec=proc && proc.closest("section");
    if(svc && procSec) mnAfter(svc, procSec);
    /* 찾아보세요는 메인에서 내렸지만 자리는 지켜 둡니다 (되살릴 때를 위해) */
    if(cse){
      if(svc) svc.parentNode.insertBefore(cse, svc);
      else if(mkt) mnAfter(mkt, cse);
    }
  }catch(e){}

  /* 브랜드 선언과 마지막 행동은 홈의 마지막 두 구간입니다.
     ⚠️ 푸터는 이제 #pg-h 밖(모든 화면 공통)이라 기준으로 쓸 수 없습니다 —
        홈의 맨 끝에 붙입니다. */
  try{
    var home=$("pg-h");
    var fin=mnFinal(), brd=mnBrand();
    if(home && brd) home.appendChild(brd);
    if(home && fin) home.appendChild(fin);
  }catch(e){}

  /* 데이터가 들어오는 시점을 알 수 없어 몇 번 더 확인합니다 */
  function pass(){
    try{ mnHideExtra(); }catch(e){}
    try{ mnBrief(); }catch(e){}
    try{ mnHideEmpty(); }catch(e){}
    try{ mnTrimStats(); }catch(e){}
  }
  pass();
  [800, 2000, 3800].forEach(function(ms){ setTimeout(pass, ms); });
}

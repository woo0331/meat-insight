/* ════════════════════════════════════════════════════════════════════
   프리미엄 메인 — PlatformStats · CategoryShortcut

   마크업은 index.html 에 있고, 여기서는 데이터로 채우는 두 조각만
   맡습니다. 둘 다 기존 함수를 감싸는 방식이라 이 파일이 통째로 빠져도
   사이트는 예전 모습(8칸 카테고리 · 지표 없음)으로 돌아갑니다.

   ⚠️ 숫자는 지어내지 않습니다. (CLAUDE.md 3번)
      · 실제로 들어온 값이 있을 때만 숫자를 씁니다.
      · 아직 없으면 "준비 중" 이라고 적습니다 — 0 도, 1,200+ 도 쓰지 않습니다.
      · 예시 데이터(GORI_FEATURES.demo)로 화면을 채우고 있을 때는
        그 숫자를 지표로 올리지 않습니다. 예시가 실적처럼 보이면 안 됩니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── PlatformStats ────────────────────────────────────────────────── */

function pfDemoOn(){
  try{ return typeof dmEnabled==="function" && dmEnabled(); }catch(e){ return false; }
}

/* 등록 품목 — CATS8 의 소분류가 곧 고리가 다루는 품목·서비스입니다.
   이건 DB 가 아니라 사이트가 실제로 갖고 있는 값이라 그대로 셉니다. */
function pfItemCount(){
  if(typeof CATS8==="undefined") return 0;
  var seen={}, n=0;
  CATS8.forEach(function(c){
    (c.sub||[]).concat(c.legacy||[]).forEach(function(t){
      var k=String(t).trim(); if(!k||seen[k])return; seen[k]=1; n++;
    });
  });
  return n;
}

function pfNum(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,","); }

function pfCell(label, val, unit, delta){
  var body = (val===null || val===undefined)
    ? '<div class="pstat-v wait">준비 중</div>'
    : '<div class="pstat-v">'+esc(pfNum(val))+(unit?'<small>'+esc(unit)+'</small>':'')+'</div>';
  return '<div class="pstat-c"><div class="pstat-l">'+esc(label)+'</div>'+body+
    (delta?'<div class="pstat-d '+delta.k+'">'+esc(delta.t)+'</div>':'')+'</div>';
}

/* 오늘의 시세 — 관리자가 넣은 market_prices 만 씁니다 (17_market 이 채웁니다) */
function pfPriceCell(){
  var rows = (G.MARKET && G.MARKET.rows) || [];
  if(!rows.length) return '<div class="pstat-c"><div class="pstat-l">오늘의 축산 시세</div>'+
    '<div class="pstat-v wait">등록 전</div>'+
    '<div class="pstat-d flat">관리자가 시세를 넣으면 표시됩니다</div></div>';
  var m=rows[0], nm=(m.item||"")+(m.grade && String(m.item||"").indexOf(m.grade)<0 ? " "+m.grade : "");
  var c=Number(m.change)||0;
  var d = c>0 ? {k:"up", t:"▲ "+pfNum(Math.abs(c))}
      : c<0 ? {k:"dn", t:"▼ "+pfNum(Math.abs(c))}
      :       {k:"flat", t:"보합"};
  return '<div class="pstat-c"><div class="pstat-l">'+esc(nm||"오늘의 축산 시세")+'</div>'+
    '<div class="pstat-v">'+esc(pfNum(Number(m.price)||0))+'<small>'+esc(m.unit||"원/kg")+'</small></div>'+
    '<div class="pstat-d '+d.k+'">'+esc(d.t)+'</div></div>';
}

function pfRender(){
  var sec=$("pf-stats-sec"), el=$("pf-stats");
  if(!sec||!el) return;

  /* 연결이 끊겼으면 아무 숫자도 걸지 않습니다 — 0 이 실적으로 읽힙니다 */
  var down=false; try{ down = typeof netDown==="function" && netDown(); }catch(e){}
  if(down){ sec.hidden=true; return; }

  var demo=pfDemoOn();
  var sup = (typeof SUPS!=="undefined" && SUPS.length && !demo) ? SUPS.length : null;
  var job = (typeof JOBS!=="undefined" && JOBS.length && !demo) ? JOBS.length : null;
  var item= pfItemCount();

  sec.hidden=false;
  el.innerHTML =
    pfCell("등록 업체", sup, "곳") +
    pfCell("취급 품목·서비스", item||null, "종") +
    pfCell("채용 정보", job, "건") +
    pfPriceCell() +
    (demo
      ? '<div class="pstat-note">지금 화면에 보이는 요청·업체는 <b>예시</b>입니다. '+
        '실제 등록이 시작되면 이 자리에 진짜 숫자가 올라갑니다.</div>'
      : (sup===null||job===null
         ? '<div class="pstat-note">아직 등록 전인 항목은 숫자를 지어내지 않고 '+
           '"준비 중" 으로 둡니다.</div>'
         : ''));
}

/* ── CategoryShortcut ─────────────────────────────────────────────── */

/* 12개 업종 + 전체보기. 새 화면을 만들지 않고 이미 있는 곳으로만 보냅니다.
     go   : goCat8(k)  — 대분류 랜딩
     pick : pickSub(k,t) — 대분류 안의 소분류 (이미 있는 함수입니다) */
var CS_ITEMS=[
  {nm:"소고기",      k:"meat",    t:"소고기",      i:"meat_beef"},
  {nm:"돼지고기",    k:"meat",    t:"돼지고기",    i:"meat_pork"},
  {nm:"부산물",      k:"meat",    t:"부산물",      i:"meat_offal"},
  {nm:"도축장",      k:"process", t:"도축장",      i:"kill"},
  {nm:"가공업체",    k:"process", t:"육가공",      i:"butcher"},
  {nm:"OEM",         k:"process", t:"OEM",         i:"oem"},
  {nm:"물류",        k:"logi",    t:"물류",        i:"logi"},
  {nm:"포장재",      k:"equip",   t:"포장재",      i:"pack"},
  {nm:"장비",        k:"equip",   t:"장비",        i:"equip"},
  {nm:"HACCP",       k:"haccp",   t:"HACCP",       i:"haccp"},
  {nm:"인테리어",    k:"startup", t:"인테리어",    i:"interior"},
  {nm:"창업·컨설팅", k:"startup", t:"창업·컨설팅", i:"startup"}
];
G.CS_ITEMS=CS_ITEMS;   /* 회귀 테스트가 목적지를 전수로 봅니다 */
/* t 는 반드시 그 분야의 legacy 목록에 있는 말이어야 합니다 — 그래야
   pickSub() 이 곧장 해당 요청서로 보냅니다. 오타가 나면 엉뚱한 분야의
   빈 요청서로 떨어집니다. test/premium-e2e.js 가 12개를 전수로 봅니다. */

/* 업종마다 그림 하나씩.

   ⚠️ CATS8 의 대분류 아이콘을 그대로 쓰면 안 됩니다 — 소고기·돼지고기·
      부산물이 전부 같은 그림이 되고, 도축장·가공업체·OEM 도 같아집니다.
      실제로 그렇게 만들었다가 12칸이 5가지 그림으로 보였습니다. */
var CS_ICO={
  meat_beef:'<path d="M5.2 7.4c0 5.2 3 8.4 6.8 8.4s6.8-3.2 6.8-8.4"/>'+
    '<path d="M5.2 7.4C3.5 7.1 2.6 6 2.6 4.7c1.6 0 2.6.9 2.6 2.7z"/>'+
    '<path d="M18.8 7.4c1.7-.3 2.6-1.4 2.6-2.7-1.6 0-2.6.9-2.6 2.7z"/>'+
    '<path d="M9.4 9.7h.01M14.6 9.7h.01"/><path d="M9.6 13.2c1.5.9 3.3.9 4.8 0"/>',
  meat_pork:'<circle cx="12" cy="12.9" r="6.3"/><ellipse cx="12" cy="14.1" rx="2.7" ry="1.9"/>'+
    '<path d="M11.1 14h.01M12.9 14h.01"/><path d="M9.7 10.2h.01M14.3 10.2h.01"/>'+
    '<path d="M7.6 7.4 6.3 4.6l3 1"/><path d="M16.4 7.4l1.3-2.8-3 1"/>',
  /* 하트로 그렸더니 "찜하기" 로 읽혔습니다 — 내장 덩어리 두 개로 바꿉니다 */
  meat_offal:'<path d="M4.4 9.8C4.4 6.6 7 4.4 10.3 4.4c3.6 0 6.2 2.5 6.2 5.6 0 3.5-2.9 5.6-6.2 5.6'+
    '-3.3 0-5.9-2.2-5.9-5.8z"/><path d="M8 8.3c1.6-.7 3.2-.4 4.4.8"/>'+
    '<path d="M15.2 17.3c0-1.7 1.3-3 2.9-3s2.4 1 2.4 2.4c0 1.7-1.4 2.9-3.1 2.9"/>',
  kill:'<path d="M3.5 4.6h17"/><path d="M9 4.6v4.2a3 3 0 0 0 6 0"/>'+
    '<rect x="8.2" y="12.4" width="7.6" height="7.4" rx="2"/>',
  butcher:'<path d="M3.5 18.6h17"/><path d="M6 18.6v2.4h12v-2.4"/><path d="M7.2 15.4 17 5.6"/>'+
    '<path d="M14.3 4.7c1.8-1.8 4-1.6 5.2-.4s1.4 3.4-.4 5.2L16.7 7z"/>',
  oem:'<path d="M3 21V10l6 4V10l6 4V6l6 3v12z"/><path d="M2 21h20"/>',
  logi:'<path d="M2 6h11v10H2z"/><path d="M13 9h4l3 3v4h-7z"/>'+
    '<circle cx="6.5" cy="18" r="1.5"/><circle cx="17" cy="18" r="1.5"/>',
  pack:'<path d="M3.6 7.6 12 3.7l8.4 3.9v8.8L12 20.3l-8.4-3.9z"/>'+
    '<path d="M3.6 7.6 12 11.5l8.4-3.9"/><path d="M12 11.5v8.8"/><path d="M7.8 5.6l8.4 3.9"/>',
  /* 톱니가 짧아 해님처럼 보였습니다 — 스패너가 오해의 여지가 없습니다 */
  equip:'<path d="M14.6 6.6a3.7 3.7 0 0 1 5-3.4L17 5.8l1.9 1.9 2.6-2.6a3.7 3.7 0 0 1-4.8 5'+
    'L6.9 20.4a2.05 2.05 0 0 1-2.9-2.9z"/><path d="M5.7 18.4h.01"/>',
  haccp:'<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  interior:'<rect x="3.6" y="4.4" width="11.4" height="4.6" rx="1.4"/>'+
    '<path d="M15 6.7h4.4v3.6h-6.6V13"/><rect x="10.4" y="13" width="4.8" height="6.6" rx="1.4"/>',
  startup:'<path d="M9.4 17.2h5.2"/><path d="M10.4 20h3.2"/>'+
    '<path d="M12 3.2a5.6 5.6 0 0 1 3.4 10c-.6.5-1 1.2-1 2H9.6c0-.8-.4-1.5-1-2A5.6 5.6 0 0 1 12 3.2z"/>'
};

function csIcon(k){
  var d=CS_ICO[k] || '<circle cx="12" cy="12" r="8"/>';
  return '<svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+d+'</svg>';
}

function csRender(){
  var el=$("cat8-grid"); if(!el) return;
  var html=CS_ITEMS.map(function(it){
    var act = it.t
      ? 'pickSub(&quot;'+it.k+'&quot;,&quot;'+it.t+'&quot;)'
      : 'goCat8(&quot;'+it.k+'&quot;)';
    return '<button class="cs-item" onclick="'+act+'">'+
      '<span class="cs-ic">'+csIcon(it.i)+'</span>'+
      '<span class="cs-nm">'+esc(it.nm)+'</span></button>';
  }).join("");
  /* go("cat8") 은 curCat8 이 정해져 있지 않으면 홈으로 되튕깁니다 —
     전체보기는 모든 분야가 한 화면에 있는 서비스 선택으로 보냅니다 */
  html += '<button class="cs-item cs-all" onclick="go(&quot;rw&quot;)">'+
    '<span class="cs-ic"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
    'stroke-width="1.7" stroke-linecap="round" aria-hidden="true">'+
    '<circle cx="6" cy="6" r="2.3"/><circle cx="12" cy="6" r="2.3"/><circle cx="18" cy="6" r="2.3"/>'+
    '<circle cx="6" cy="12" r="2.3"/><circle cx="12" cy="12" r="2.3"/><circle cx="18" cy="12" r="2.3"/>'+
    '<circle cx="9" cy="18" r="2.3"/><circle cx="15" cy="18" r="2.3"/></svg></span>'+
    '<span class="cs-nm">전체보기</span></button>';
  el.className="cshort";
  el.innerHTML=html;
}

/* ── 헤더: 회원가입 버튼 ─────────────────────────────────────────────
   renderHeaderUser() 는 로그인 상태가 바뀔 때마다 .hdr-actions 를 통째로
   다시 씁니다. 그래서 "한 번 붙이고 끝" 이 아니라 그릴 때마다 다시 답니다.

   ⚠️ renderHeaderUser 는 IIFE 안의 지역 함수라 window 에 없습니다.
      window.renderHeaderUser = ... 로 감싸면 조용히 아무 일도 안 일어납니다.
      같은 IIFE 안이니 지역 이름을 직접 다시 묶습니다. (CLAUDE.md 참고) */
function hdSignup(){
  var box=document.querySelector(".hdr-actions"); if(!box) return;
  var login=box.querySelector(".ha-login");
  /* 로그인한 뒤에는 .ha-login 이 "거래관리" 로 바뀝니다 */
  if(!login || login.textContent.trim()!=="로그인") return;
  /* 회원가입은 로그인 창 안에 탭으로 있고 전체메뉴에도 있습니다. 헤더에 다섯
     개를 늘어놓으면 무엇을 눌러야 할지 안 보여서, 위계 셋만 남깁니다:
     로그인(글자) · 업체 등록(테두리) · 요청 올리기(딥레드). */
  var old=box.querySelector(".ha-signup");
  if(old && old.parentNode) old.parentNode.removeChild(old);
}

/* ── 구간 페이드 (아주 짧게) ───────────────────────────────────────
   화면 아래에 있는 구간만 대상으로 삼습니다. 첫 화면에 이미 보이는 것을
   숨겼다 켜면 로딩이 늦어 보입니다.

   ⚠️ IntersectionObserver 가 없거나 뭔가 어긋나도 1.2초 뒤에는 전부
      켭니다. 화면이 비어 있는 채로 남는 것이 가장 나쁜 결과입니다.
   ⚠️ 회귀 검사(색 대비·훑기)는 opacity 0 인 요소를 건너뜁니다. 늦어도
      1.2초면 다 켜지므로 검사에 걸리지 않습니다. */
function pfReveal(){
  var reduce=false;
  try{ reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){}
  if(reduce || !window.IntersectionObserver) return;

  var sels=["#pg-h .sec-cat8",".svc-sec","#pg-h .sec-mkt","#pg-h .why"];
  var els=[];
  sels.forEach(function(q){
    var el=document.querySelector(q); if(!el) return;
    var r=el.getBoundingClientRect();
    if(r.top < window.innerHeight - 40) return;      /* 이미 보이는 것은 그대로 */
    el.classList.add("rv"); els.push(el);
  });
  if(!els.length) return;

  var io=new IntersectionObserver(function(rows){
    rows.forEach(function(x){ if(x.isIntersecting){ x.target.classList.add("on"); io.unobserve(x.target); } });
  }, {rootMargin:"0px 0px -8% 0px", threshold:0.02});
  els.forEach(function(el){ io.observe(el); });

  /* 안전망 — 무슨 일이 있어도 다 보이게 */
  setTimeout(function(){
    els.forEach(function(el){ el.classList.add("on"); });
    try{ io.disconnect(); }catch(e){}
  }, 1200);
}

function patchPremium(){
  if(G._premium) return; G._premium=true;
  /* 헤더 버튼 정리 — 기존 함수는 그대로 두고 뒤에서 손봅니다 */
  try{
    if(typeof renderHeaderUser==="function"){
      var origHU=renderHeaderUser;
      renderHeaderUser=function(){
        var r=origHU.apply(this, arguments);
        try{ hdSignup(); }catch(e){}
        return r;
      };
      G.renderHeaderUser=renderHeaderUser;
      renderHeaderUser();
    }else{ hdSignup(); }
  }catch(e){ try{ hdSignup(); }catch(e2){} }


  /* 카테고리 줄 — 원래 함수는 그대로 두고 바깥에서 다시 그립니다 */
  var origCat=window.renderCat8Grid;
  if(typeof origCat==="function"){
    window.renderCat8Grid=function(){
      var r=origCat.apply(this, arguments);
      try{ csRender(); }catch(e){}
      return r;
    };
  }
  try{ if(typeof window.renderCat8Grid==="function") window.renderCat8Grid(); }catch(e){}

  /* 지표 — 데이터가 들어오는 시점을 알 수 없어 몇 번 더 그려 봅니다 */
  try{ pfRender(); }catch(e){}
  try{ pfReveal(); }catch(e){}

  [700, 1800, 3500].forEach(function(ms){
    setTimeout(function(){ try{ pfRender(); }catch(e){} }, ms);
  });
}

/* ════════════════════════════════════════════════════════════════════
   연결 실패 상태

   서버에 못 붙었을 때 화면이 "아직 요청이 없어요" · "등록된 업체가 아직
   없습니다" 로 보였습니다. 처음 온 사람은 플랫폼이 텅 비었다고 생각하고
   그냥 나갑니다. 실제로는 연결이 안 된 것뿐입니다.

   연결이 끊긴 것을 감지해서 빈 목록 대신 "불러오지 못했습니다 · 다시 시도"
   를 보여주고, 상단에 안내 띠를 띄웁니다.
   ════════════════════════════════════════════════════════════════════ */

/* reason — "net" 연결 실패 · "denied" 권한/키 문제(설정) */
var NET = { ok:null, tried:false, retrying:false, reason:"net", warned:false, diagnosed:false, said:{}, rescued:{} };
G.NET = NET;

/* 권한·키 문제는 손님이 "다시 시도" 를 눌러도 영영 안 됩니다.
   무엇을 고쳐야 하는지는 **운영자에게만** 콘솔로 말합니다 (CLAUDE.md). */
/* 어느 단계에서 막혔는지 운영자에게 한 줄로 알려 줍니다.
   "서버에 연결할 수 없습니다" 만 보고는 원인을 좁힐 수 없었습니다 —
   라이브러리가 안 뜬 것인지, 키가 틀린 것인지, RLS 인지 전부 같은 문구였습니다. */
function netDiagnose(){
  if(NET.diagnosed) return; NET.diagnosed=true;
  try{
    if(typeof window.supabase==="undefined" || !window.supabase){
      console.warn("[고리] Supabase 라이브러리가 안 떴습니다. vendor/supabase-js-*.min.js 가 "+
        "제대로 올라갔는지, 주소가 맞는지 확인하세요. 이게 없으면 로그인·요청·견적이 전부 멈춥니다.");
      return;
    }
    if(!client()){
      console.warn("[고리] Supabase 클라이언트를 못 만들었습니다. index.html 의 SU · SK 값을 확인하세요.");
      return;
    }
    console.warn("[고리] 서버에 요청은 갔는데 응답을 못 받았습니다. "+
      "Supabase 프로젝트가 살아 있는지(일시정지 여부), SU 주소가 맞는지 확인하세요. SU = "+
      (typeof SU!=="undefined"?SU:"(모름)"));
  }catch(e){}
}

function netNoteDenied(err){
  NET.reason="denied";
  if(NET.warned) return; NET.warned=true;
  try{
    console.warn("[고리] 서버에는 붙었는데 데이터를 읽을 권한이 없습니다. "+
      "anon 키로 select 가 막혀 있거나 키가 틀렸습니다.\n"+
      " · RLS 를 켰다면 anon 에게 select 를 여는 정책이 있는지 확인하세요 (db/RLS_ON.sql)\n"+
      " · index.html 의 SU · SK 가 지금 쓰는 프로젝트의 값인지 확인하세요\n"+
      " 응답: ", err);
  }catch(e){}
}

/* 손님이 실제로 보는 목록을 채우는 표들. 이것들이 살아 있으면 사이트는
   쓸 수 있는 상태입니다. */
var NET_CORE=["purchase_requests","suppliers","jobs","market_prices"];

/* 화면에 **진짜** 내용이 있는가 — 있으면 "연결 안 됨" 이라고 말하면 안 됩니다.
   ⚠️ 예시 데이터(39_demo.js)는 세지 않습니다. 예시로 채워 놓고 띠를 내리면
      서버가 죽은 것을 "원래 잘 되고 있다" 로 보이게 만듭니다 — 손님에게는
      활발해 보이고 운영자는 장애를 못 봅니다. 예시 행의 id 는 "demo-" 로
      시작합니다. */
function netReal(arr){
  if(!arr || !arr.length) return 0;
  var n=0;
  for(var i=0;i<arr.length;i++){
    var id=arr[i] && arr[i].id;
    if(String(id||"").indexOf("demo-")!==0) n++;
  }
  return n;
}
function netHasData(){
  try{
    return netReal(typeof REQS!=="undefined"?REQS:null)>0 ||
           netReal(typeof SUPS!=="undefined"?SUPS:null)>0 ||
           netReal(typeof JOBS!=="undefined"?JOBS:null)>0;
  }catch(e){ return false; }
}

function netDown(){
  if(navigator && navigator.onLine===false) return true;
  if(!client()) return true;
  /* ⚠️ 예전에는 **아무 조회 하나만** 실패해도 사이트 전체에 띠가 붙었습니다.
     알림·채팅·후기 같은 보조 표 하나가 없거나 막혀 있어도, 요청·업체 목록은
     멀쩡히 보이는데 "서버에 연결할 수 없습니다" 가 떴습니다. 실제로 그랬습니다.
     목록에 내용이 있으면 띠를 띄우지 않습니다. */
  if(netHasData()) return false;
  return NET.ok===false;
}

/* ── 상단 안내 띠 ── */
function netBar(){
  var down=netDown();
  var el=$("net-bar");
  if(!down){ if(el && el.parentNode) el.parentNode.removeChild(el); return; }
  if(el) return;
  el=document.createElement("div");
  el.id="net-bar"; el.className="net-bar"; el.setAttribute("role","status");
  /* 권한·키 문제일 때는 "연결할 수 없습니다" 가 거짓말이고, 다시 시도해도
     영영 안 됩니다 — 버튼을 빼고 기다려 달라고만 합니다. */
  var denied = (NET.reason==="denied" && navigator.onLine!==false);
  if(navigator.onLine!==false && NET.reason!=="denied"){ try{ netDiagnose(); }catch(e){} }
  el.innerHTML='<span>'+
    (navigator.onLine===false
      ? "인터넷이 끊겼습니다. 연결을 확인해주세요."
      : denied
        ? "지금은 목록을 불러올 수 없습니다. 잠시 뒤 다시 확인해 주세요."
        : "서버에 연결할 수 없습니다. 목록이 비어 보일 수 있습니다.")+
    '</span>'+
    (denied?"":'<button type="button" class="net-retry" onclick="gNetRetry()">다시 시도</button>');
  document.body.appendChild(el);
  netPlace(el);
}
/* 하단 네비 높이는 화면 크기에 따라 달라지므로 실제 값을 재서 띄웁니다 */
function netPlace(el){
  el=el||$("net-bar"); if(!el) return;
  var nav=document.querySelector(".bnav");
  var h=0;
  if(nav){
    var r=nav.getBoundingClientRect();
    if(r.height>0 && getComputedStyle(nav).display!=="none") h=r.height;
  }
  el.style.bottom=h?(Math.round(h)+"px"):"0";
}

window.gNetRetry=async function(){
  if(NET.retrying) return;
  NET.retrying=true;
  var btn=document.querySelector(".net-retry");
  if(btn){ btn.disabled=true; btn.textContent="확인 중…"; }
  NET.ok=null;
  try{
    if(typeof loadFromDB==="function") await loadFromDB();
    if(typeof loadMarket==="function") await loadMarket();
    if(typeof loadSession==="function") await loadSession();
  }catch(e){}
  NET.retrying=false;
  if(btn){ btn.disabled=false; btn.textContent="다시 시도"; }
  netBar();
  netPaint();
  if(!netDown()) toast("다시 연결했습니다.","ok");
};

/* ── 빈 목록을 "불러오지 못했습니다" 로 바꿔치기 ── */
function netFail(host, what){
  var el=(typeof host==="string")?$(host):host;
  if(!el) return;
  el.innerHTML='<div class="gempty"><div class="gempty-t">'+esc(what)+'을(를) 불러오지 못했습니다</div>'+
    '<div class="gempty-d">서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.<br>'+
    '계속 안 되면 인터넷 연결을 확인해주세요.</div>'+
    '<button class="gbtn gbtn-p gbtn-sm" onclick="gNetRetry()">다시 시도</button></div>';
}
function netPaint(){
  if(!netDown()) return;
  var pg=(document.querySelector(".pg.on")||{}).id||"";
  if(pg==="pg-reqs"  && !(typeof REQS!=="undefined" && REQS.length)) netFail("rq-list-full","요청 목록");
  if(pg==="pg-suppliers" && !(typeof SUPS!=="undefined" && SUPS.length)) netFail("sup-full","업체 목록");
  if(pg==="pg-jobs"  && !(typeof JB!=="undefined" && JB.rows && JB.rows.length)) netFail("job-full","구인구직 공고");
  if(pg==="pg-h"){
    if(!(typeof REQS!=="undefined" && REQS.length)) netFail("rq-widget","요청");
    if(!(typeof SUPS!=="undefined" && SUPS.length)) netFail("sup-home","업체");
  }
}

function patchOffline(){
  if(NET._patched) return; NET._patched=true;

  /* 조회가 성공했는지 실패했는지 기록합니다 */
  if(typeof selectSafe==="function"){
    var origSel=selectSafe;
    selectSafe=async function(){
      var r=await origSel.apply(this, arguments);
      var tbl=(arguments && arguments[0]) ? String(arguments[0]) : "";
      if(r && r.error && !r.unavailable){
        /* 어느 표에서 무엇이 났는지 남깁니다 — "400" 만 보고는 못 찾습니다 */
        if(!NET.said[tbl]){
          NET.said[tbl]=true;
          try{ console.warn("[고리] '"+tbl+"' 조회가 실패했습니다. 응답: ", r.error); }catch(e){}
        }
        /* 보조 표 하나가 실패했다고 사이트 전체에 띠를 붙이지 않습니다 */
        if(NET_CORE.indexOf(tbl)>=0){
          NET.ok=false;
          if(typeof isDeniedError==="function" && isDeniedError(r.error)) netNoteDenied(r.error);
          else NET.reason="net";
        }
      }
      else if(r && !r.error && NET_CORE.indexOf(tbl)>=0){ NET.ok=true; NET.reason="net"; NET.warned=false; }
      NET.tried=true;
      return r;
    };
  }
  /* ── 못 불러온 목록 구조하기 ────────────────────────────────────────
     index.html 의 loadFromDB 는 세 표를 .order("created_at") 로 가져옵니다.
     오래 전에 만든 표에 그 칸이 없으면 PostgREST 가 **400** 을 돌려주고,
     목록이 통째로 비면서 "서버에 연결할 수 없습니다" 가 뜹니다 —
     서버도 표도 멀쩡한데 말입니다.

     여기서는 원본을 건드리지 않고, 비어 있는 표만 **정렬 없이** 다시
     가져와 채웁니다. 순서만 잃을 뿐 목록은 보입니다. */
  async function netRescue(){
    var c=client(); if(!c) return;
    var jobs=[
      ["purchase_requests", function(){ return typeof REQS!=="undefined"?REQS:null; },
       function(d){ REQS=d.map(mapReq); try{ renderRQWidget(); renderReqs(); }catch(e){} }],
      ["suppliers", function(){ return typeof SUPS!=="undefined"?SUPS:null; },
       function(d){ SUPS=d.map(mapSup);
         try{ renderSupHome(typeof curSC!=="undefined"?curSC:"all"); renderSups(typeof curSC!=="undefined"?curSC:"all"); }catch(e){} }],
      ["jobs", function(){ return typeof JOBS!=="undefined"?JOBS:null; },
       function(d){ JOBS=d.map(mapJob); try{ renderJobWidget(); renderJobsFull(); }catch(e){} }]
    ];
    for(var i=0;i<jobs.length;i++){
      var t=jobs[i][0], cur=jobs[i][1]();
      if(cur===null || cur.length) continue;          /* 이미 채워졌으면 건너뜁니다 */
      if(NET.rescued[t]) continue;
      NET.rescued[t]=true;
      try{
        var r=await c.from(t).select("*");
        if(r.error || !r.data || !r.data.length) continue;
        jobs[i][2](r.data);
        try{ console.warn("[고리] '"+t+"' 을(를) 정렬 없이 다시 불러왔습니다 ("+r.data.length+"건). "+
          "그 표에 created_at 칸이 없어 400 이 났을 수 있습니다."); }catch(e){}
      }catch(e){}
    }
  }
  G.netRescue=netRescue;

  if(typeof loadFromDB==="function"){
    var origLoad=loadFromDB;
    loadFromDB=async function(){
      if(!client()){ NET.ok=false; NET.tried=true; netBar(); netPaint(); return; }
      var r;
      try{ r=await origLoad.apply(this, arguments); }
      catch(e){ NET.ok=false; }
      NET.tried=true;
      try{ await netRescue(); }catch(e){}
      /* 실제로 한 건이라도 받았으면 연결된 것으로 봅니다 */
      if((typeof REQS!=="undefined" && REQS.length) ||
         (typeof SUPS!=="undefined" && SUPS.length) ||
         (typeof JOBS!=="undefined" && JOBS.length)) NET.ok=true;
      netBar(); netPaint();
      return r;
    };
  }

  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(p){
      var r=origGo.apply(this, arguments);
      setTimeout(function(){ try{ netBar(); netPaint(); }catch(e){} }, 120);
      return r;
    };
  }

  window.addEventListener("resize", function(){ netPlace(); });
  window.addEventListener("online", function(){ netBar(); window.gNetRetry(); });
  window.addEventListener("offline", function(){ netBar(); netPaint(); });

  /* 첫 판단은 데이터 로딩이 끝날 때쯤 */
  setTimeout(function(){ try{ netBar(); netPaint(); }catch(e){} }, 2200);
  setTimeout(function(){ try{ netBar(); netPaint(); }catch(e){} }, 5000);
}

/* ════════════════════════════════════════════════════════════════════
   연결 실패 상태

   서버에 못 붙었을 때 화면이 "아직 요청이 없어요" · "등록된 업체가 아직
   없습니다" 로 보였습니다. 처음 온 사람은 플랫폼이 텅 비었다고 생각하고
   그냥 나갑니다. 실제로는 연결이 안 된 것뿐입니다.

   연결이 끊긴 것을 감지해서 빈 목록 대신 "불러오지 못했습니다 · 다시 시도"
   를 보여주고, 상단에 안내 띠를 띄웁니다.
   ════════════════════════════════════════════════════════════════════ */

/* reason — "net" 연결 실패 · "denied" 권한/키 문제(설정) */
var NET = { ok:null, tried:false, retrying:false, reason:"net", warned:false };
G.NET = NET;

/* 권한·키 문제는 손님이 "다시 시도" 를 눌러도 영영 안 됩니다.
   무엇을 고쳐야 하는지는 **운영자에게만** 콘솔로 말합니다 (CLAUDE.md). */
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

function netDown(){
  if(navigator && navigator.onLine===false) return true;
  if(!client()) return true;
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
      if(r && r.error && !r.unavailable){
        NET.ok=false;
        if(typeof isDeniedError==="function" && isDeniedError(r.error)) netNoteDenied(r.error);
        else NET.reason="net";
      }
      else if(r && !r.error){ NET.ok=true; NET.reason="net"; NET.warned=false; }
      NET.tried=true;
      return r;
    };
  }
  if(typeof loadFromDB==="function"){
    var origLoad=loadFromDB;
    loadFromDB=async function(){
      if(!client()){ NET.ok=false; NET.tried=true; netBar(); netPaint(); return; }
      var r;
      try{ r=await origLoad.apply(this, arguments); }
      catch(e){ NET.ok=false; }
      NET.tried=true;
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

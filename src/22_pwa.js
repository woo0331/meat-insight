/* ════════════════════════════════════════════════════════════════════
   홈 화면에 추가 (PWA)
   카카오 알림이 없는 동안, 현장에서 고리를 다시 열게 만드는 가장
   현실적인 통로입니다. 홈 화면 아이콘 → 한 번 눌러 바로 진입.
   서비스 워커는 네트워크 우선이라 배포한 새 파일이 캐시에 막히지 않습니다.
   ════════════════════════════════════════════════════════════════════ */

var PWA = { prompt:null, shown:false };
var PWA_KEY = "gori.a2hs";

function pwaSecure(){
  return location.protocol==="https:" || location.hostname==="localhost" || location.hostname==="127.0.0.1";
}
function pwaStandalone(){
  return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
      || window.navigator.standalone === true;
}
function pwaIOS(){
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
function pwaSnoozed(){
  try{
    var t=parseInt(localStorage.getItem(PWA_KEY)||"0",10);
    return t && (Date.now()-t) < 30*24*3600*1000;     /* 닫으면 30일 동안 안 보임 */
  }catch(e){ return false; }
}
function pwaSnooze(){
  try{ localStorage.setItem(PWA_KEY, String(Date.now())); }catch(e){}
}

function pwaBar(html){
  if($("a2hs")) return;
  var el=document.createElement("div");
  el.id="a2hs"; el.className="a2hs";
  el.innerHTML=html;
  document.body.appendChild(el);
  requestAnimationFrame(function(){ el.classList.add("on"); });
}
window.gA2HSClose=function(){
  pwaSnooze();
  var el=$("a2hs"); if(!el) return;
  el.classList.remove("on");
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 260);
};
window.gA2HSInstall=async function(){
  var p=PWA.prompt;
  if(!p){ window.gA2HSClose(); return; }
  PWA.prompt=null;
  try{
    p.prompt();
    var r=await p.userChoice;
    if(r && r.outcome==="accepted") toast("홈 화면에 추가했습니다.","ok");
  }catch(e){}
  window.gA2HSClose();
};

function pwaShow(){
  if(PWA.shown || pwaStandalone() || pwaSnoozed()) return;
  var onHome=((document.querySelector(".pg.on")||{}).id==="pg-h");
  if(!onHome) return;

  if(PWA.prompt){
    PWA.shown=true;
    pwaBar(
      '<div class="a2hs-ic"><img src="icon-192.png" alt=""></div>'+
      '<div class="a2hs-tx"><b>고리를 홈 화면에 추가하세요</b>'+
      '<span>앱처럼 한 번에 열리고, 새 견적을 놓치지 않습니다.</span></div>'+
      '<div class="a2hs-bt">'+
        '<button class="gbtn gbtn-p gbtn-sm" onclick="gA2HSInstall()">추가하기</button>'+
        '<button class="a2hs-x" onclick="gA2HSClose()" aria-label="닫기">✕</button></div>');
  } else if(pwaIOS()){
    PWA.shown=true;
    pwaBar(
      '<div class="a2hs-ic"><img src="icon-192.png" alt=""></div>'+
      '<div class="a2hs-tx"><b>고리를 홈 화면에 추가하세요</b>'+
      '<span>아래 <b>공유</b> 버튼 → <b>홈 화면에 추가</b>를 누르면 앱처럼 열립니다.</span></div>'+
      '<div class="a2hs-bt"><button class="a2hs-x" onclick="gA2HSClose()" aria-label="닫기">✕</button></div>');
  }
}

function patchPWA(){
  if(PWA._patched) return; PWA._patched=true;
  if(!pwaSecure()) return;                       /* file:// · http 에서는 아무 것도 하지 않습니다 */

  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault();
    PWA.prompt=e;
    setTimeout(pwaShow, 1200);
  });
  window.addEventListener("appinstalled", function(){
    PWA.prompt=null; pwaSnooze();
    var el=$("a2hs"); if(el && el.parentNode) el.parentNode.removeChild(el);
  });

  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("sw.js").catch(function(){ /* 실패해도 사이트는 그대로 동작 */ });
  }

  /* iOS 는 beforeinstallprompt 가 없어서 잠시 뒤 직접 안내합니다 */
  if(pwaIOS()) setTimeout(pwaShow, 20000);
}

/* 문제가 생겼을 때 콘솔에서 gSWOff() 로 서비스 워커를 완전히 해제할 수 있습니다 */
window.gSWOff=function(){
  if(!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function(rs){
    rs.forEach(function(r){ if(r.active) r.active.postMessage("gori-sw-off"); r.unregister(); });
    if(window.caches) caches.keys().then(function(ks){ ks.forEach(function(k){ caches.delete(k); }); });
    alert("서비스 워커를 해제했습니다. 새로고침해 주세요.");
  });
};

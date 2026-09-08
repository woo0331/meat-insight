/* ════════════════════════════════════════════════════════════════════
   로그인 창 — 키보드로 쓸 수 있게

   재 보니 이랬습니다.
     · 창을 열어도 초점이 뒤쪽 버튼에 그대로 남아 있었습니다.
       키보드만 쓰는 사람은 창이 열린 줄도 모르고, Tab 을 눌러도
       창 밖의 것들만 훑습니다.
     · Tab 을 12번 눌렀더니 창 밖으로 나가 버렸습니다 (가둠 없음).
     · 닫은 뒤 초점이 엉뚱한 곳(분야 줄)으로 갔습니다.
     · 화면 낭독기에는 role="button" 으로 읽혔습니다 — 25_a11y 가
       onclick 이 붙은 요소를 전부 버튼으로 표시하는데, 이건 창의
       바깥 어둠막이라 버튼이 아닙니다.

   Escape 로 닫히는 것은 이미 되고 있었습니다 (index.html).

   원본 openModal/closeModal 은 그대로 두고 감쌉니다.
   ════════════════════════════════════════════════════════════════════ */

var MD={ opener:null, trap:null };

function mdBox(){ return document.getElementById("auth-modal"); }
function mdOpen(){ var el=mdBox(); return !!(el && getComputedStyle(el).display!=="none"); }

/* 창 안에서 초점이 갈 수 있는 것들 */
function mdFocusables(){
  var el=mdBox(); if(!el) return [];
  return [].slice.call(el.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )).filter(function(n){
    return !n.disabled && n.offsetParent!==null && getComputedStyle(n).visibility!=="hidden";
  });
}

function mdTrap(e){
  if(e.key!=="Tab" || !mdOpen()) return;
  var f=mdFocusables(); if(!f.length) return;
  var first=f[0], last=f[f.length-1];
  var el=mdBox();
  /* 창 밖에 있으면 안으로 끌고 옵니다 */
  if(!el.contains(document.activeElement)){ e.preventDefault(); first.focus(); return; }
  if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
}

function patchModal(){
  if(G._modal) return; G._modal=true;
  var el=mdBox(); if(!el) return;

  /* 낭독기에 창으로 읽히게. 25_a11y 가 붙인 role="button" 을 바로잡습니다 */
  el.setAttribute("role","dialog");
  el.setAttribute("aria-modal","true");
  el.removeAttribute("tabindex");
  var t=el.querySelector(".modal-logo-nm");
  if(t){
    if(!t.id) t.id="auth-modal-title";
    el.setAttribute("aria-labelledby", t.id);
  }else{
    el.setAttribute("aria-label","로그인 · 회원가입");
  }
  var x=el.querySelector(".modal-x");
  if(x && !x.getAttribute("aria-label")) x.setAttribute("aria-label","닫기");

  var origOpen=window.openModal;
  if(typeof origOpen==="function"){
    window.openModal=function(){
      MD.opener=document.activeElement;          /* 닫을 때 돌아갈 자리 */
      var r=origOpen.apply(this, arguments);
      setTimeout(function(){
        var f=mdFocusables();
        /* 닫기(✕)가 아니라 첫 입력칸으로 보냅니다 — 바로 타이핑할 수 있게 */
        var input=f.filter(function(n){ return n.tagName==="INPUT"; })[0];
        (input||f[0]||mdBox()).focus();
      }, 40);
      if(!MD.trap){
        MD.trap=mdTrap;
        document.addEventListener("keydown", MD.trap, true);
      }
      return r;
    };
  }

  var origClose=window.closeModal;
  if(typeof origClose==="function"){
    window.closeModal=function(){
      var r=origClose.apply(this, arguments);
      var o=MD.opener; MD.opener=null;
      if(o && document.contains(o) && o.offsetParent!==null){
        try{ o.focus(); }catch(e){}
      }
      return r;
    };
  }
}

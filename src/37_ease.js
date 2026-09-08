/* ════════════════════════════════════════════════════════════════════
   글자 크게

   축산업 쪽은 연세 있는 분들이 많이 씁니다. 글씨 크기를 전체적으로 한
   단계 올렸지만, 그래도 작다는 분이 있습니다. 브라우저 확대(Ctrl +)를
   모르는 분이 대부분이라, 화면 안에 버튼으로 둡니다.

   px 로 짜인 사이트라 rem 을 키워도 안 듣습니다. html 에 .txl 을 걸면
   CSS 가 zoom 으로 화면을 통째로 키웁니다 — transform 과 달리 zoom 은
   레이아웃을 다시 흘려 주므로 가로 스크롤이 생기지 않습니다.

   고른 값은 이 기기에 기억해 둡니다. 저장이 막힌 환경(사생활 보호 창
   등)에서도 조용히 넘어가고 기능은 그대로 씁니다.
   ════════════════════════════════════════════════════════════════════ */

var EZ_KEY="gori.textLarge";

function ezOn(){
  try{ return localStorage.getItem(EZ_KEY)==="1"; }catch(e){ return false; }
}
function ezApply(on){
  document.documentElement.classList.toggle("txl", !!on);
  [].slice.call(document.querySelectorAll(".ez-btn")).forEach(function(b){
    b.setAttribute("aria-pressed", on?"true":"false");
    var t=b.querySelector(".ez-l");
    if(t) t.textContent = on ? "글자 작게" : "글자 크게";
  });
}
window.gToggleTextSize=function(){
  var on=!ezOn();
  try{ localStorage.setItem(EZ_KEY, on?"1":"0"); }catch(e){}
  ezApply(on);
  if(typeof toast==="function") toast(on?"글자를 크게 키웠습니다.":"글자 크기를 원래대로 되돌렸습니다.");
};

function ezBtn(cls){
  return '<button class="ez-btn '+(cls||"")+'" type="button" aria-pressed="false" '+
    'onclick="gToggleTextSize()">'+
    '<span class="ez-a" aria-hidden="true">가</span>'+
    '<span class="ez-l">글자 크게</span></button>';
}

function ezCats(){
  /* 데스크톱 — 분야 줄 오른쪽 끝, "⚡ 당일알바" 옆 */
  var el=$("hdr-cats");
  if(!el || el.querySelector(".ez-btn")) return;
  var d=document.createElement("div");
  d.innerHTML=ezBtn("ez-top");
  var b=d.firstChild;
  if(!el.querySelector(".hc-daily")) b.style.marginLeft="auto";
  el.appendChild(b);
  ezApply(ezOn());
}

function ezInject(){
  ezCats();
  /* 분야 줄은 분야를 고를 때마다 다시 그려지므로 그때도 다시 붙입니다 */
  var origCats=window.renderHdrCats;
  if(typeof origCats==="function"){
    window.renderHdrCats=function(){
      var r=origCats.apply(this, arguments);
      try{ ezCats(); }catch(e){}
      return r;
    };
  }
  /* 모바일 — 메뉴 서랍 맨 위 (버튼이 커서 누르기 쉽습니다) */
  var mm=document.querySelector("#mobile-menu .mm-row");
  if(mm && !mm.parentNode.querySelector(".ez-mm")){
    var w=document.createElement("div");
    w.className="ez-mm-wrap";
    w.innerHTML=ezBtn("ez-mm");
    mm.parentNode.insertBefore(w, mm);
  }
}

function patchEase(){
  if(G._ease) return; G._ease=true;
  ezInject();
  ezApply(ezOn());
}

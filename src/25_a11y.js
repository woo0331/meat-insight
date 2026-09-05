/* ════════════════════════════════════════════════════════════════════
   접근성
   확인된 것:
     · onclick 만 달린 <div> 가 홈에만 36개 — 마우스로는 눌리는데
       키보드(Tab·Enter)로는 갈 수도 누를 수도 없었습니다.
       카테고리 타일, 요청·업체 카드, 푸터 링크가 전부 여기 해당합니다.
     · <main> 랜드마크와 본문 바로가기 링크가 없어, 스크린리더로는
       매번 헤더·카테고리 바를 다 지나야 본문에 닿았습니다.
     · 화면을 바꿔도(go) 스크린리더에 아무 것도 알려주지 않았고,
       홈 말고는 h1 이 없었습니다.
     · 포커스 표시가 브라우저 기본 1px 이라 잘 안 보였습니다.
   ════════════════════════════════════════════════════════════════════ */

var AY = { last:"" };

/* ── 본문 바로가기 · 알림 영역 ── */
function ayChrome(){
  if(!$("skip-main")){
    var a=document.createElement("a");
    a.id="skip-main"; a.className="skip-link"; a.href="#main-content";
    a.textContent="본문 바로가기";
    a.addEventListener("click", function(e){
      e.preventDefault();
      var pg=document.querySelector(".pg.on"); if(!pg) return;
      pg.setAttribute("tabindex","-1"); pg.focus();
      pg.scrollIntoView({block:"start"});
    });
    document.body.insertBefore(a, document.body.firstChild);
  }
  if(!$("a11y-live")){
    var l=document.createElement("div");
    l.id="a11y-live"; l.className="sr-only";
    l.setAttribute("aria-live","polite");
    l.setAttribute("aria-atomic","true");
    document.body.appendChild(l);
  }
}

/* ── onclick 만 있는 요소를 키보드로도 쓸 수 있게 ── */
function ayClickable(root){
  var host=root||document;
  var list=host.querySelectorAll("[onclick]");
  for(var i=0;i<list.length;i++){
    var el=list[i];
    if(el.dataset.ayKbd) continue;
    var tag=el.tagName;
    if(tag==="BUTTON"||tag==="A"||tag==="INPUT"||tag==="SELECT"||tag==="TEXTAREA"||tag==="LABEL") continue;
    if(el.closest("button,a[href]")) continue;          /* 이미 눌리는 것 안에 있음 */
    el.dataset.ayKbd="1";
    if(!el.hasAttribute("tabindex")) el.setAttribute("tabindex","0");
    if(!el.hasAttribute("role")) el.setAttribute("role","button");
    el.addEventListener("keydown", function(e){
      if(e.key!=="Enter" && e.key!==" " && e.key!=="Spacebar") return;
      if(e.target!==this) return;                       /* 안쪽 요소에서 온 것은 무시 */
      e.preventDefault();
      this.click();
    });
  }
}

/* ── 화면 전환 알림 · 랜드마크 · 제목 ── */
function ayPage(p){
  var pg=document.querySelector(".pg.on"); if(!pg) return;

  document.querySelectorAll('.pg[role="main"]').forEach(function(e){ e.removeAttribute("role"); });
  pg.setAttribute("role","main");
  pg.id && pg.setAttribute("aria-label", ayName(p));
  if(!$("main-content")) pg.setAttribute("id", pg.id);   /* 기존 id 유지 */

  /* 화면마다 제목이 하나는 있어야 합니다 (디자인상 없으면 숨은 제목) */
  if(!pg.querySelector("h1")){
    var h=pg.querySelector(".ay-h1");
    if(!h){
      h=document.createElement("h1");
      h.className="ay-h1 sr-only";
      pg.insertBefore(h, pg.firstChild);
    }
    h.textContent=ayName(p);
  }

  var nm=ayName(p);
  if(nm && nm!==AY.last){
    AY.last=nm;
    var live=$("a11y-live");
    if(live){ live.textContent=""; setTimeout(function(){ live.textContent=nm+" 화면"; }, 60); }
  }
  ayClickable(pg);
}
function ayName(p){
  if(typeof RT_TITLE!=="undefined" && RT_TITLE[p]) return RT_TITLE[p];
  if(p==="h") return "홈";
  return "고리";
}

function patchA11y(){
  if(AY._patched) return; AY._patched=true;
  ayChrome();

  /* 정렬 선택 등 라벨 없는 입력칸 보완 */
  function ayLabels(){
    var q=$("q-sort"); if(q && !q.getAttribute("aria-label")) q.setAttribute("aria-label","견적 정렬 기준");
    document.querySelectorAll("select,input,textarea").forEach(function(e){
      if(e.type==="hidden") return;
      if(e.getAttribute("aria-label")||e.getAttribute("title")||e.getAttribute("placeholder")) return;
      if(e.id && document.querySelector('label[for="'+(window.CSS&&CSS.escape?CSS.escape(e.id):e.id)+'"]')) return;
      if(e.closest("label")) return;
      var lb=e.previousElementSibling;
      if(lb && /^(LABEL|DIV|SPAN)$/.test(lb.tagName) && lb.textContent.trim()){
        e.setAttribute("aria-label", lb.textContent.trim().replace(/\s*\*\s*$/,""));
      }
    });
  }

  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(p){
      var r=origGo.apply(this, arguments);
      try{ ayPage(p); ayLabels(); }catch(e){}
      return r;
    };
  }

  /* 처음 그려진 화면과, 이후 비동기로 그려지는 카드들까지 */
  ayClickable(document); ayLabels();
  ayPage(((document.querySelector(".pg.on")||{}).id||"pg-h").replace(/^pg-/,""));

  var mo=new MutationObserver(function(muts){
    var need=false;
    muts.forEach(function(m){ if(m.addedNodes && m.addedNodes.length) need=true; });
    if(!need) return;
    clearTimeout(AY._t);
    AY._t=setTimeout(function(){ try{ ayClickable(document); ayLabels(); }catch(e){} }, 200);
  });
  mo.observe(document.body, { childList:true, subtree:true });
}

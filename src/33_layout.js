/* ════════════════════════════════════════════════════════════════════
   넓은 화면 레이아웃 — 모바일 한 줄짜리를 데스크톱에 늘려 놓은 상태였습니다

   요청 상세·업체 상세·거래관리가 전부 한 칸짜리 세로 목록이라,
   1440px 로 열면 가운데 좁은 띠만 쓰고 좌우가 텅 빕니다. 정작 제일 중요한
   견적 비교는 카드 두 장이 좁게 눌려 있고요.

   화면을 다시 만들지 않고, 이미 그려진 조각을 두 칸으로 나눠 담습니다.
   렌더 함수는 그대로 두고 결과만 감쌉니다 — 1100px 미만에서는 감싸기만 하고
   CSS 가 한 줄로 되돌리므로 모바일은 지금과 똑같습니다.

   순서 주의: applyExtras 의 맨 끝에서 부릅니다. 다른 패치들이 상세 화면에
   버튼·안내를 덧붙인 뒤라야 그것들까지 같이 담깁니다.
   ════════════════════════════════════════════════════════════════════ */

/* 이미 담았으면 다시 담지 않습니다 */
function layDone(host){ return !!(host && host.querySelector(":scope > .lay-main")); }

/* host 의 자식들을 side / main 두 칸으로 나눠 담습니다.
   pick(el) 이 "full" 이면 제자리(전체 폭), "side" 면 왼쪽, 그 외는 오른쪽. */
function layWrap(host, pick, sideFirst){
  if(!host || layDone(host)) return;
  var kids=[].slice.call(host.children);
  if(kids.length<2) return;

  var side=document.createElement("div"); side.className="lay-side";
  var main=document.createElement("div"); main.className="lay-main";
  var fulls=[];

  kids.forEach(function(k){
    var slot;
    try{ slot=pick(k); }catch(e){ slot="main"; }
    if(slot==="full"){ fulls.push(k); return; }
    (slot==="side" ? side : main).appendChild(k);
  });
  if(!main.children.length || !side.children.length){
    /* 한쪽이 비면 두 칸으로 나눌 이유가 없습니다 — 원래대로 되돌립니다 */
    [].slice.call(side.children).concat([].slice.call(main.children))
      .forEach(function(n){ host.appendChild(n); });
    return;
  }
  host.classList.add("lay2");
  fulls.forEach(function(f){ f.classList.add("lay-full"); host.appendChild(f); });
  if(sideFirst){ host.appendChild(side); host.appendChild(main); }
  else { host.appendChild(main); host.appendChild(side); }
}

/* ── 요청 상세 — 왼쪽: 요청 요약·통계·내 요청 액션 / 오른쪽: 견적 비교 ── */
function layReq(){
  var host=$("reqd-body"); if(!host) return;
  host.classList.add("lay-req");
  layWrap(host, function(el){
    if(el.classList.contains("gp-hd")) return "full";
    if(el.id==="q-list" || (el.querySelector && el.querySelector("#q-list"))) return "main";
    if(el.querySelector && el.querySelector(".gp-title") && /견적 비교/.test(el.textContent||"")) return "main";
    return "side";
  }, true);
}

/* ── 업체 상세 — 오른쪽에 붙는 행동 버튼 ── */
function laySup(){
  var host=document.querySelector("#sp-body .gp"); if(!host) return;
  host.classList.add("gp-wide","lay-sp");
  /* #sp-body 는 680px 로 묶여 있습니다 — 두 칸으로 담을 때만 풀어 줍니다 */
  var sb=$("sp-body"); if(sb) sb.classList.add("sp-host");
  layWrap(host, function(el){
    if(el.classList.contains("gp-hd")) return "full";
    if(el.classList.contains("sd-cta")) return "side";
    if(el.id==="rp-sup-link") return "side";
    return "main";
  }, false);
}

/* ── 거래관리 — 탭 12개가 두 줄로 접히던 것을 왼쪽 세로 목록으로 ── */
function layMy(){
  var host=$("my-body"); if(!host) return;
  host.classList.add("lay-my");
  layWrap(host, function(el){
    if(el.classList.contains("my-hd")) return "full";
    if(el.classList.contains("my-tabs")) return "side";
    return "main";
  }, true);
}

function patchLayout(){
  if(G._layout) return; G._layout=true;

  if(typeof renderRequestDetail==="function"){
    var origRD=renderRequestDetail;
    renderRequestDetail=function(){
      var r=origRD.apply(this, arguments);
      try{ layReq(); }catch(e){}
      return r;
    };
  }
  /* 견적 목록만 다시 그릴 때는 이미 담겨 있으므로 layWrap 이 알아서 넘어갑니다 */
  if(typeof renderQuotes==="function"){
    var origRQ=renderQuotes;
    renderQuotes=function(){
      var r=origRQ.apply(this, arguments);
      try{ layReq(); }catch(e){}
      return r;
    };
  }
  if(typeof renderSupplierDetail==="function"){
    var origSD=renderSupplierDetail;
    renderSupplierDetail=function(){
      var r=origSD.apply(this, arguments);
      try{ laySup(); }catch(e){}
      return r;
    };
  }
  if(typeof renderMy==="function"){
    var origMy=renderMy;
    renderMy=function(){
      var r=origMy.apply(this, arguments);
      try{ layMy(); }catch(e){}
      return r;
    };
  }
  if(typeof renderMyPanel==="function"){
    var origMP=renderMyPanel;
    renderMyPanel=function(){
      var r=origMP.apply(this, arguments);
      try{ layMy(); }catch(e){}
      return r;
    };
  }
}

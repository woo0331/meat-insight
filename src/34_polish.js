/* ════════════════════════════════════════════════════════════════════
   마감 — 로딩 뼈대 · 내 요청 액션 정리

   두 가지를 손봅니다.

   1) 불러오는 동안 화면이 "불러오는 중…" 한 줄로 비어 있었습니다.
      들어올 내용의 모양을 미리 그려 두면 기다리는 시간이 짧게 느껴지고,
      들어온 순간 화면이 덜컹 뛰지 않습니다.

   2) 내 요청 상세에 "요청 수정" · "요청 삭제" · "이 요청 마감하기" 가
      전부 폭을 꽉 채운 버튼으로 따로따로 쌓여 있어, 정작 봐야 할
      견적보다 눈에 먼저 들어왔습니다. 한 칸에 모아 작게 둡니다.

   순서 주의: applyExtras 에서 patchLayout **앞**에 부릅니다.
   여기서 액션을 한 칸으로 모은 뒤라야 레이아웃이 그 칸째로 담습니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── 로딩 뼈대 ──
   n 장의 카드 모양을 그립니다. 실제 카드와 높이가 비슷해야 의미가
   있으므로 제목 한 줄 + 본문 두 줄로 맞췄습니다. */
function skelCard(){
  return '<div class="gcard skel-card">'+
      '<div class="skel skel-chip"></div>'+
      '<div class="skel skel-h"></div>'+
      '<div class="skel skel-l"></div>'+
      '<div class="skel skel-l s2"></div>'+
    '</div>';
}
function skelPanel(n){
  var out=""; var k=n||3;
  for(var i=0;i<k;i++) out+=skelCard();
  return '<div class="skel-wrap" aria-busy="true" aria-live="polite">'+
    '<span class="sr-only">불러오는 중…</span>'+out+'</div>';
}
G.skelPanel=skelPanel;

/* ── 내 요청 액션 한 칸으로 ── */
var POL_OWN=["요청 수정","요청 삭제","이 요청 마감하기"];
function polIsOwn(t){ return POL_OWN.indexOf(String(t||"").trim())>=0; }

/* 소유자 액션만 들어 있는 줄을 찾아 담습니다.

   두 군데를 훑습니다. 33_layout 이 이미 두 칸으로 담은 뒤라면 버튼 줄은
   .lay-side 안에 들어가 있고, 아직이면 #reqd-body 바로 밑에 있습니다.
   "버튼만 들어 있는 줄" 인지는 직계 자식으로 판단합니다 — 안쪽까지
   훑으면 버튼을 품은 칸(.lay-side) 자체를 통째로 집어 날려 버립니다. */
function polOwnAct(){
  var body=$("reqd-body"); if(!body) return;
  var box=body.querySelector(".own-acts");
  var wraps=[], btns=[];

  function scan(root){
    if(!root) return;
    [].slice.call(root.children).forEach(function(w){
      if(w.classList.contains("own-acts")) return;
      var cs=[].slice.call(w.children);
      if(!cs.length) return;
      var only=true;
      cs.forEach(function(c){
        if(c.tagName!=="BUTTON" || !polIsOwn(c.textContent)) only=false;
      });
      if(!only) return;
      wraps.push(w);
      cs.forEach(function(c){ btns.push(c); });
    });
  }
  scan(body);
  scan(body.querySelector(":scope > .lay-side"));
  scan(body.querySelector(":scope > .lay-main"));
  if(!btns.length) return;

  if(!box){
    box=document.createElement("div");
    box.className="own-acts";
    var t=document.createElement("div");
    t.className="own-acts-t"; t.textContent="내가 올린 요청";
    var r=document.createElement("div"); r.className="own-acts-r";
    box.appendChild(t); box.appendChild(r);
    wraps[0].parentNode.insertBefore(box, wraps[0]);
  }
  var row=box.querySelector(".own-acts-r");

  btns.forEach(function(b){
    b.classList.remove("gbtn-full","gbtn-p");
    b.classList.add("gbtn-w","gbtn-sm");
    if(/삭제|마감/.test(b.textContent)) b.classList.add("gbtn-q");
    row.appendChild(b);
  });
  wraps.forEach(function(w){ if(w.parentNode) w.parentNode.removeChild(w); });

  /* 수정 → 삭제 → 마감 순으로 맞춥니다 (담긴 순서는 렌더 순서라 뒤죽박죽입니다) */
  [].slice.call(row.children)
    .sort(function(a,b){ return POL_OWN.indexOf(a.textContent.trim())-POL_OWN.indexOf(b.textContent.trim()); })
    .forEach(function(b){ row.appendChild(b); });
}

function patchPolish(){
  if(G._polish) return; G._polish=true;

  /* renderQuotes 에는 걸지 않습니다 — edOwnerBar 는 renderRequestDetail
     에서만 붙으므로, 정렬을 바꿀 때마다 다시 훑을 이유가 없습니다. */
  if(typeof renderRequestDetail==="function"){
    var origRD=renderRequestDetail;
    renderRequestDetail=function(){
      var r=origRD.apply(this, arguments);
      try{ polOwnAct(); }catch(e){}
      return r;
    };
  }
}

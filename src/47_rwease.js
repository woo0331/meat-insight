/* ════════════════════════════════════════════════════════════════════
   47_rwease — 요청서 2단계를 덜 복잡하게

   "한우" 를 눌러 들어가면 한 화면에 열다섯 칸이 한꺼번에 쏟아졌습니다.
   원육 기준으로 축종·부위·등급·수량·단가·냉장냉동·납품주기·지역·납품일·
   추가조건 열 개, 거기에 상호명·이름·연락처·비교 우선순위·공개 범위 다섯.
   그런데 **정말 필요한 건 일곱 개**입니다. 나머지 여덟은 안 채워도
   등록됩니다 — 그게 화면에서 안 보이니 전부 채워야 할 것처럼 보입니다.

   그래서 필수만 남기고 선택은 접습니다. 지우지 않고 접는 것이라,
   조건을 자세히 쓰고 싶은 사람은 한 번 눌러 다 펼칠 수 있습니다.

   ⚠️ fieldHtml 은 IIFE 안의 지역 함수라 window 에 없습니다 — 지역 이름을
      직접 다시 묶습니다 (CLAUDE.md).
   ════════════════════════════════════════════════════════════════════ */

var RW={ open:false };

/* ── 칸마다 겉옷을 입혀 필수·선택을 나눕니다 ── */
function rwWrapFieldHtml(){
  if(typeof fieldHtml!=="function" || fieldHtml._rw) return;
  var orig=fieldHtml;
  fieldHtml=function(f){
    var inner=orig.apply(this, arguments);
    /* 선택 칸은 라벨에 "(선택)" 을 적습니다. 별표 유무만으로는 안 보입니다. */
    if(!f.req){
      inner=inner.replace('</label>','<span class="rwf-opt-tag">선택</span></label>');
    }
    return '<div class="rwf '+(f.req?"rwf-req":"rwf-opt")+'" data-f="'+esc(String(f.id))+'">'+inner+'</div>';
  };
  fieldHtml._rw=true;
}

/* 라벨 + 입력칸 (+ 안내줄) 을 한 덩이로 집어 옵니다 */
function rwGrab(id){
  var el=$(id); if(!el) return null;
  var nodes=[];
  var lab=el.previousElementSibling;
  if(lab && lab.classList.contains("glabel")) nodes.push(lab);
  nodes.push(el);
  var nx=el.nextElementSibling;
  if(nx && nx.classList.contains("ghint")) nodes.push(nx);
  return nodes;
}

function rwBox(n){
  var box=document.createElement("div");
  box.className="rw-opt"; box.hidden=true;
  var btn=document.createElement("button");
  btn.type="button"; btn.className="rw-more";
  btn.setAttribute("aria-expanded","false");
  btn.innerHTML='<span class="rw-more-t">조건 더 넣기</span>'+
    '<span class="rw-more-n">선택 '+n+'가지</span>'+
    '<svg class="rw-more-i" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
    'stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  btn.onclick=function(){ rwToggle(btn, box); };
  return { box:box, btn:btn };
}

function rwToggle(btn, box){
  var on=box.hidden;
  box.hidden=!on;
  btn.setAttribute("aria-expanded", on?"true":"false");
  btn.classList.toggle("on", on);
  btn.querySelector(".rw-more-t").textContent = on ? "조건 접기" : "조건 더 넣기";
  RW.open=on;
}

/* ── 2단계를 다시 담습니다 ─────────────────────────────────────────── */
function rwEase(){
  var wrap=$("rw-wizard"); if(!wrap || wrap.querySelector(".rw-more")) return;
  var cards=wrap.querySelectorAll(".gcard");
  if(!cards.length) return;

  /* ① 조건 카드 — 선택 칸을 접습니다 */
  var cond=cards[0];
  var opts=cond.querySelectorAll(".rwf-opt");
  if(opts.length){
    var g=rwBox(opts.length);
    cond.appendChild(g.btn); cond.appendChild(g.box);
    opts.forEach(function(e){ g.box.appendChild(e); });
    if(RW.open) rwToggle(g.btn, g.box);   /* 아까 펼쳐 뒀으면 그대로 */
  }
  /* 필수만 채우면 된다는 걸 먼저 말해 줍니다 */
  var t=cond.querySelector(".gcard-t");
  if(t && !cond.querySelector(".rw-lead")){
    var lead=document.createElement("div");
    lead.className="rw-lead";
    lead.innerHTML='<span class="greq">*</span> 표시만 채우면 등록됩니다. '+
      '나머지는 업체가 견적을 보내면서 물어봅니다.';
    t.parentNode.insertBefore(lead, t.nextSibling);
  }

  /* ② 연락처 카드 — 이름·연락처만 남기고 나머지는 접습니다 */
  var me=cards[1];
  if(me){
    var ids=["w-company","w-priority","w-visibility"], grabbed=[], n=0;
    ids.forEach(function(id){
      var nodes=rwGrab(id); if(!nodes) return;
      grabbed.push(nodes); n++;
    });
    if(n){
      var g2=rwBox(n);
      g2.btn.querySelector(".rw-more-t").textContent="상세 설정";
      g2.btn.dataset.label="상세 설정";
      g2.btn.onclick=function(){
        rwToggle(g2.btn, g2.box);
        g2.btn.querySelector(".rw-more-t").textContent = g2.box.hidden ? "상세 설정" : "상세 설정 접기";
      };
      me.appendChild(g2.btn); me.appendChild(g2.box);
      grabbed.forEach(function(nodes){ nodes.forEach(function(e){ g2.box.appendChild(e); }); });
    }
  }
}

/* ── 히어로에서 넘어온 검색어 ────────────────────────────────────────
   "한우" 로 검색해 들어오면 "부위 / 품목" 칸에 "한우" 가 박혔습니다.
   한우는 부위가 아니라 축종이고, 바로 위 축종 칩에 같은 말이 있어서
   같은 단어가 화면에 두 번 나왔습니다. 칩에 있는 말이면 칩을 켭니다. */
function rwPickChip(q){
  var wrap=$("rw-wizard"); if(!wrap) return false;
  var hit=null;
  wrap.querySelectorAll(".gpick .gpick-i").forEach(function(b){
    if(hit) return;
    if(b.textContent.trim()===q) hit=b;
  });
  if(!hit) return false;
  if(typeof gChip==="function") gChip(hit); else hit.classList.add("on");
  return true;
}

function patchRwEase(){
  if(RW._patched) return; RW._patched=true;
  rwWrapFieldHtml();
  rwWrapStep3();

  if(typeof window.gStep2==="function"){
    var orig2=window.gStep2;
    window.gStep2=function(){
      var r=orig2.apply(this, arguments);
      try{ rwEase(); }catch(e){}
      return r;
    };
  }
  if(typeof window.applyHeroQuery==="function"){
    var origQ=window.applyHeroQuery;
    window.applyHeroQuery=function(){
      try{
        var q=String(window.HERO_Q||"").trim();
        if(q && rwPickChip(q)){ window.HERO_Q=""; return; }
      }catch(e){}
      return origQ.apply(this, arguments);
    };
  }
  /* 뒤로 갔다 돌아와도 접힌 상태로 시작합니다 */
  if(typeof window.gStep1==="function"){
    var orig1=window.gStep1;
    window.gStep1=function(){ RW.open=false; return orig1.apply(this, arguments); };
  }
}
G.patchRwEase=patchRwEase;

/* ── 못 채운 칸으로 데려다 줍니다 ────────────────────────────────────
   "필수 항목을 입력해주세요: 축종, 부위 / 품목, 수량 외 2개" 만 띄우고
   말면, 손님은 그 다섯이 어디 있는지 화면을 훑어 찾아야 합니다.
   화면이 길고 쓰는 분 중에 연세 있는 분이 많습니다.
   안내는 그대로 두고, **첫 빈 칸으로 굴러가 테두리를 칠하고 커서를
   놓아 줍니다.** 값을 채우면 테두리는 스스로 사라집니다.
   gStep3 은 window 에 있어서 바깥에서 감쌀 수 있습니다 — 원래 동작
   (읽기·검사·안내)은 하나도 건드리지 않습니다. */
function rwFirstMissing(){
  if(typeof REQ_FORMS==="undefined" || typeof W==="undefined") return null;
  var fields=REQ_FORMS[W.cat]||REQ_FORMS.meat||[];
  var data=(typeof readFields==="function")?readFields(fields):{};
  for(var i=0;i<fields.length;i++){
    var f=fields[i]; if(!f.req) continue;
    var v=data[f.id];
    var empty=(f.t==="chips") ? !(v && v.length) : !v;
    if(empty) return $("w-"+f.id);
  }
  if(!((($("w-name")||{}).value)||"").trim())  return $("w-name");
  if(!((($("w-phone")||{}).value)||"").trim()) return $("w-phone");
  return null;
}
function rwClearMiss(){
  var w=$("rw-wizard"); if(!w) return;
  [].slice.call(w.querySelectorAll(".rwf-miss")).forEach(function(e){ e.classList.remove("rwf-miss"); });
  /* 연락처 칸은 .rwf 겉옷이 없어 입력칸에 직접 표시합니다 (.gin.err 는 원래 있던 규칙) */
  [].slice.call(w.querySelectorAll(".gin.err")).forEach(function(e){ e.classList.remove("err"); });
}
function rwGotoMissing(){
  rwClearMiss();
  var el=rwFirstMissing(); if(!el) return;
  /* 접힌 칸 안에 있으면 먼저 펼칩니다 — 안 보이는 칸으로 보내면 안 됩니다 */
  var box=el.closest(".rw-opt");
  if(box && box.hidden){
    var btn=box.previousElementSibling;
    if(btn && btn.classList.contains("rw-more")) btn.click();
  }
  /* 조건 칸은 겉옷(.rwf)에 칠하고, 겉옷이 없는 연락처 칸은 입력칸에
     원래 쓰던 .gin.err 로 칠합니다 — 칸 모양이 망가지지 않습니다. */
  var wrap=el.closest(".rwf"), mark=wrap||el;
  if(wrap) wrap.classList.add("rwf-miss");
  else if(el.classList.contains("gin")) el.classList.add("err");
  else mark.classList.add("rwf-miss");
  try{ mark.scrollIntoView({block:"center", behavior:"smooth"}); }catch(e){ mark.scrollIntoView(); }
  var focusable = (el.tagName==="INPUT"||el.tagName==="SELECT"||el.tagName==="TEXTAREA")
    ? el : el.querySelector("input,select,textarea,button");
  if(focusable){ try{ focusable.focus({preventScroll:true}); }catch(e){} }
}
function rwWrapStep3(){
  if(typeof window.gStep3!=="function" || window.gStep3._rw) return;
  var orig=window.gStep3;
  window.gStep3=function(){
    var r=orig.apply(this, arguments);
    try{ if(W && W.step!==3) rwGotoMissing(); else rwClearMiss(); }catch(e){}
    return r;
  };
  window.gStep3._rw=true;
}

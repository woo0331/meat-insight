/* ════════════════════════════════════════════════════════════════════
   사장님 SOS — 지시서 11번. 이 사이트의 핵심 기능입니다.

   흐름: 문제 입력 → 접수 → (사람이 분류) → 해결방법 · 업체 매칭

   ⚠️ **AI 자동분류를 하지 않습니다** (지시서 11번). 초기에는 사람이
   관리자에서 분류합니다. 그러니 화면이 손님에게 "분석했습니다" 같은
   말을 하면 안 됩니다 — 하지 않은 일입니다.

   ⚠️ **"몇 시간 안에 연락드립니다" 를 함부로 적지 마세요.** 지킬 수
   있는 약속만 적습니다. 지금은 "확인한 뒤 연락드립니다" 까지입니다.

   ⚠️ 받는 것은 이름 · 연락처뿐입니다 (지시서 41번: 개인정보 최소수집).
   업종 · 지역은 매칭에 실제로 쓰이므로 받되, 선택입니다.
   ════════════════════════════════════════════════════════════════════ */

var SOS = { sending:false, done:null };

function PageSos(){
  if(SOS.done) return SosDone();

  var q = nowQS("q");                 /* 메인 입력창에서 넘어온 말 */
  var c = nowQS("c");                 /* 빠른 선택에서 넘어온 분류 */
  var picked = c ? wowProblem(c) : null;

  return '<div class="w form-wrap">'+
    '<h1 class="pg-h1">어떤 문제가 있으세요?</h1>'+
    '<p class="pg-lead">상황을 그대로 적어 주시면 됩니다. '+
      '무엇이 필요한 일인지는 저희가 정리하겠습니다.</p>'+

    Notice()+

    '<div id="s-err"></div>'+
    '<form class="form" onsubmit="return sosSend(event)">'+

      '<div class="f-r"><label for="s-q">지금 상황 <b>*</b></label>'+
        '<textarea id="s-q" rows="5" required '+
          'placeholder="예: 40평 고깃집인데 덕트 냄새 민원이 계속 들어옵니다. '+
          '3년 전에 시공했고 그 뒤로 손 안 댔습니다.">'+esc(q)+'</textarea>'+
        '<p class="f-hint">길게 쓰실수록 정확한 답을 드릴 수 있습니다. '+
          '사진이나 견적서가 있으시면 연락 후에 받겠습니다.</p></div>'+

      '<div class="f-r"><label>어떤 쪽 이야기인가요 <em>(선택)</em></label>'+
        '<div class="pick" id="s-cat">'+WOW_PROBLEMS.map(function(p){
          var on = picked && picked.key === p.key;
          return '<button type="button" class="pk'+(on?" on":"")+'" '+
            'data-k="'+esc(p.key)+'" aria-pressed="'+(on?"true":"false")+'" '+
            'onclick="sosPick(this)">'+esc(p.name)+'</button>';
        }).join("")+'</div></div>'+

      '<div class="f-2">'+
        fRow("성함","s-name","text",true,"","name")+
        fRow("연락처","s-tel","tel",true,"010-0000-0000","tel")+
      '</div>'+
      '<div class="f-2">'+
        fRow("업종","s-kind","text",false,"예: 고깃집 / 정육점","organization")+
        regionRow("s-region")+
      '</div>'+

      Consent()+

      '<button class="btn btn-b btn-lg btn-full" type="submit" id="s-go">'+
        '무료로 물어보기</button>'+
      '<p class="f-foot">비용은 들지 않습니다. 원하지 않으시면 업체를 '+
        '연결하지 않습니다.</p>'+
    '</form>'+
  '</div>';
}

/* ⚠️ 접수처가 없으면 **폼 위에서 먼저** 말합니다. 다 적고 누른 뒤에
   알리면 바쁜 사장님의 시간을 버리게 하는 짓입니다. */
function Notice(){
  if(bizVal("sosReady")) return "";
  try{ console.warn("[ABOUTMEAT] SOS 접수처가 아직 없습니다 — Vercel 환경변수에 "+
    "INTAKE_WEBHOOK_URL 하나를 넣거나 RESEND_API_KEY 와 INTAKE_EMAIL_TO 를 "+
    "같이 넣고 다시 배포한 뒤, "+
    "js/data/site.js 의 WOW_BIZ.sosReady 를 켜세요."); }catch(e){}
  var phone = bizVal("phone");
  return '<div class="notice"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
    (phone ? '<span>전화로 말씀해 주시면 바로 도와드리겠습니다.</span>'+
      '<div class="notice-acts">'+CallButton("btn","전화로 문의")+'</div>'
           : '<span>접수 준비가 끝나는 대로 이곳에서 바로 받겠습니다.</span>')+
  '</div>';
}

/* 개인정보 수집·이용 동의 — 무엇을 · 왜 · 얼마나를 동의 자리에서
   같이 보여 줍니다 (개인정보보호법 제15조 제2항). */
function Consent(){
  return '<fieldset class="agree"><legend>개인정보 수집·이용 동의</legend>'+
    '<ul class="ag-why">'+
      '<li><span>수집 항목</span><b>성함, 연락처 (선택: 업종, 지역, 적어 주신 내용)</b></li>'+
      '<li><span>이용 목적</span><b>문의 확인 및 답변, 해결 방향 안내</b></li>'+
      '<li><span>보유 기간</span><b>문의 처리 완료 후 1년</b></li>'+
    '</ul>'+
    '<label class="ag-r"><input type="checkbox" id="s-ag" required>'+
      '<span>위 내용에 동의합니다 <em class="ag-req">(필수)</em></span>'+
      '<a class="ag-v" href="/privacy">방침 보기</a></label>'+
    /* ⚠️ **업체에 연락처를 넘기는 것은 여기 동의에 들어 있지 않습니다.**
       그 순간이 제3자 제공(개인정보보호법 제17조)이고, 누구에게 넘기는지
       정해지기 전에 뭉뚱그려 받는 동의는 제17조 제2항 위반입니다.
       업체가 정해진 뒤에 상호를 알리고 따로 받습니다. */
    '<p class="ag-no">업체에 연락처를 전달하는 것은 여기에 포함되지 않습니다 — '+
      '연결할 업체가 정해지면 어디인지 알려 드리고 그때 따로 여쭙겠습니다.</p>'+
    '<p class="ag-no">동의를 거부하실 수 있으며, 이 경우 이 양식으로는 '+
      '문의를 접수하지 못합니다'+
      (bizVal("phone") ? ' — 전화로는 그대로 문의하실 수 있습니다.' : '.')+'</p>'+
  '</fieldset>';
}

/* 지역 — 시·도는 고르고, 그 아래는 직접. 매칭에 쓰이므로 받습니다.
   ⚠️ 시·군·구를 목록으로 만들지 않는 이유는 js/data/regions.js 머리말에
   적어 두었습니다. */
window.regionRow = function(id){
  return '<div class="f-r"><label for="'+id+'-s">지역 <em>(선택)</em></label>'+
    '<div class="f-reg">'+
      '<select id="'+id+'-s" class="f-sel">'+
        '<option value="">시 · 도</option>'+
        (window.WOW_REGIONS||[]).map(function(r){
          return '<option>'+esc(r)+'</option>'; }).join("")+
      '</select>'+
      '<input id="'+id+'" type="text" placeholder="시 · 군 · 구 (예: 안양)"'+
        ' autocomplete="address-level2">'+
    '</div>'+
    '<p class="f-hint">업체는 다니는 범위가 정해져 있습니다. '+
      '적어 주시면 갈 수 있는 곳에만 요청을 보냅니다.</p></div>';
};
window.regionVal = function(id){
  var sel = $(id+"-s"), inp = $(id);
  return wowRegionText(sel ? sel.value : "", inp ? inp.value : "");
};

/* ── 접수가 실패했을 때 ────────────────────────────────────
   ⚠️ 여태 토스트 한 줄로 끝났습니다. 전화번호도 아직 없어서, 손님은
   길게 적은 글을 들고 **막다른 길**에 섭니다. 다시 적으라고 할 수는
   없습니다.

   그래서 (1) 적으신 것을 화면에 그대로 두고 (2) **복사**해 둘 수 있게
   하고 (3) 다시 시도를 주고 (4) 전화가 있으면 전화를 줍니다.
   화면을 다시 그리지 않습니다 — 다시 그리면 적으신 글이 날아갑니다. */
window.sendFail = function(boxId, retryFn, copyText){
  var box = $(boxId); if(!box) return;
  var tel = bizVal("phone");
  box.innerHTML =
    '<div class="notice notice-bad" role="alert">'+
      '<b>'+icon("alert",20)+'지금 접수하지 못했습니다.</b>'+
      '<span>적어 주신 내용은 <b>그대로 남아 있습니다.</b> 잠시 뒤 다시 '+
        '눌러 보시거나, 아래에서 복사해 두셨다가 보내 주셔도 됩니다.</span>'+
      '<div class="notice-acts">'+
        '<button class="btn btn-b" type="button" onclick="'+esc(retryFn)+'">'+
          icon("refresh",18)+'다시 보내기</button>'+
        '<button class="btn" type="button" onclick="sendCopy(this)"'+
          ' data-t="'+esc(copyText||"")+'">'+icon("doc",18)+'적은 내용 복사</button>'+
        (tel ? CallButton("btn","전화로 문의") : '')+
      '</div>'+
    '</div>';
  try{ box.scrollIntoView({ behavior:"smooth", block:"center" }); }catch(e){}
};
window.sendOk = function(boxId){ var b = $(boxId); if(b) b.innerHTML = ""; };

/* 복사 — ⚠️ navigator.clipboard 는 https 가 아니거나 오래된
   브라우저에서 없습니다. 없으면 옛 방법으로 갑니다. */
window.sendCopy = function(btn){
  var t = btn.getAttribute("data-t") || "";
  var done = function(){ toast("적으신 내용을 복사했습니다."); };
  var fail = function(){ toast("복사하지 못했습니다. 직접 선택해서 복사해 주세요."); };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(done, fail);
    return;
  }
  try{
    var ta = document.createElement("textarea");
    ta.value = t; ta.setAttribute("readonly","");
    ta.style.position = "fixed"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.select();
    var ok = document.execCommand("copy");
    document.body.removeChild(ta);
    ok ? done() : fail();
  }catch(e){ fail(); }
};

function fRow(label,id,type,req,ph,ac){
  return '<div class="f-r"><label for="'+id+'">'+esc(label)+
    (req?' <b>*</b>':' <em>(선택)</em>')+'</label>'+
    '<input id="'+id+'" type="'+type+'"'+(req?" required":"")+
    (ph?' placeholder="'+esc(ph)+'"':'')+
    ' autocomplete="'+esc(ac||"off")+'"></div>';
}

window.sosPick = function(el){
  var on = el.classList.toggle("on");
  el.setAttribute("aria-pressed", on ? "true" : "false");
  /* 하나만 고르게 — 여러 개면 분류하는 사람이 더 헷갈립니다 */
  if(on) els("#s-cat .pk").forEach(function(b){
    if(b !== el){ b.classList.remove("on"); b.setAttribute("aria-pressed","false"); }
  });
};

window.sosSend = function(ev){
  ev.preventDefault();
  if(SOS.sending) return false;

  /* ⚠️ 동의 확인을 지우지 마세요 — 동의 없이 받은 개인정보는
     개인정보보호법 제15조 위반입니다. 서버에서도 한 번 더 막습니다. */
  var ag = $("s-ag");
  if(ag && !ag.checked){
    toast("개인정보 수집·이용에 동의해 주세요.");
    try{ ag.closest(".ag-r").classList.add("ag-miss"); ag.focus({preventScroll:true}); }catch(e){}
    return false;
  }

  var on = els("#s-cat .pk.on")[0];
  var body = {
    kind:"sos",
    q:      val("s-q"),
    cat:    on ? on.getAttribute("data-k") : "",
    name:   val("s-name"),
    tel:    val("s-tel"),
    biz:    val("s-kind"),
    region: regionVal("s-region"),
    agree:  true
  };

  SOS.sending = true;
  sendOk("s-err");
  var btn = $("s-go");
  if(btn){ btn.disabled = true; btn.textContent = "보내는 중…"; }

  fetch("/api/quote", { method:"POST", headers:{ "content-type":"application/json" },
                        body: JSON.stringify(body) })
    .then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(j){
        if(!r.ok) throw new Error((j && j.error) || ("HTTP "+r.status));
        return j;
      });
    })
    .then(function(){
      SOS.sending = false;
      SOS.done = { name:body.name, tel:body.tel };
      render(); window.scrollTo(0,0);
    })
    .catch(function(err){
      SOS.sending = false;
      if(btn){ btn.disabled = false; btn.textContent = "무료로 물어보기"; }
      try{ console.warn("[ABOUTMEAT] SOS 접수 실패 — "+((err && err.message)||err)+
        ". api/quote.js 가 올라가 있는지, Vercel 환경변수(INTAKE_WEBHOOK_URL 또는 "+
        "RESEND_API_KEY·INTAKE_EMAIL_TO)가 설정되어 있는지, 넣은 뒤 다시 배포했는지 "+
        "확인하세요."); }catch(e){}
      /* ⚠️ 토스트는 몇 초 뒤 사라집니다. 길게 적은 글을 들고 계신
         손님에게는 **남아 있는 안내**가 필요합니다. */
      sendFail("s-err", "sosSend({preventDefault:function(){}})", body.q);
      toast("지금 접수하지 못했습니다. 적으신 내용은 그대로 있습니다.");
    });
  return false;
};
function val(id){ var e = $(id); return e ? String(e.value||"").trim() : ""; }

function SosDone(){
  var o = SOS.done;
  return '<div class="w done">'+
    '<div class="done-ic">'+icon("check",32)+'</div>'+
    '<h1>말씀 잘 받았습니다.</h1>'+
    /* ⚠️ 지키지 못할 시간을 적지 않습니다. */
    '<p class="done-p">내용을 확인한 뒤 <b>'+esc(o.tel)+'</b> 으로 연락드리겠습니다.</p>'+
    '<p class="done-n">급하시면 아래로 바로 전화 주셔도 됩니다.</p>'+
    '<div class="row-cta">'+
      CallButton("btn btn-b btn-lg","전화로 문의")+
      '<a class="btn btn-o btn-lg" href="/">홈으로</a>'+
    '</div>'+
  '</div>';
}

/* 전화번호가 없으면 버튼이 안 나옵니다 — 눌렀는데 안 걸리는 것보다
   없는 게 낫습니다. */
window.CallButton = function(cls, label){
  var tel = bizVal("phone");
  if(!tel){
    try{ console.warn("[ABOUTMEAT] 고객센터 전화번호가 비어 있어 전화 버튼을 "+
      "내지 못했습니다 — js/data/site.js 의 WOW_BIZ.phone 을 채우세요."); }catch(e){}
    return "";
  }
  return '<a class="'+esc(cls||"btn")+'" href="tel:'+esc(telNum(tel))+'">'+
    icon("phone",18)+esc(label||tel)+'</a>';
};

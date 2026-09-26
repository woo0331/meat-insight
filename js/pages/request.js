/* ════════════════════════════════════════════════════════════════════
   업체 찾기 (/partners) · 견적 요청 (/request) — 지시서 12·15번

   ⚠️ **업체 목록을 만들지 않습니다** (지시서 3번: 업체 목록 사이트 ·
   전화번호부 · 숨고 복제품 금지). 손님이 할 일은 목록을 훑는 것이
   아니라 **무엇이 필요한지 고르는 것**입니다. 그러면 우리가 조건에
   맞는 곳을 최대 세 곳 찾아 드립니다 (지시서 12번).

   ⚠️ 그래서 /partners 는 "업체 명단" 이 아니라 **"무엇이 필요하세요"**
   화면입니다. 등록된 파트너가 생겨도 이 화면이 명단이 되면 안 됩니다.

   ⚠️ 업체 이름 · 평점 · 시공건수를 지어내지 않습니다 (지시서 43번).
   ════════════════════════════════════════════════════════════════════ */

var REQ = { sending:false, done:null };

/* ── /partners — 무엇이 필요하세요 ────────────────────────── */
function PagePartners(){
  var q = nowQS("g");                       /* 메인에서 묶음을 누르고 왔을 때 */
  var groups = WOW_SERVICE_GROUPS;
  return '<section class="pg-hero"><div class="w pgh">'+
    '<div class="pgh-t">'+
      '<p class="eyebrow">업체 찾기</p>'+
      '<h1 class="pg-h1">업체를 찾아 드립니다.<br class="br-m"> 명단을 드리지 않습니다.</h1>'+
      '<p class="pg-lead">수백 곳을 뒤지실 필요 없습니다. 무엇이 필요하신지만 고르시면 '+
        '지역 · 예산 · 일정에 맞는 곳을 <b>최대 세 곳</b> 찾아 견적을 받아 드립니다.</p>'+
      '<ol class="mini-steps">'+[
        "필요한 것을 고릅니다","조건에 맞는 곳에만 요청이 갑니다","세 곳 견적을 비교합니다"
      ].map(function(t,i){
        return '<li><b>'+("0"+(i+1))+'</b>'+esc(t)+'</li>'; }).join("")+'</ol>'+
    '</div>'+
    '<figure class="pgh-f">'+photoBox("hero-partners")+'</figure>'+
    '</div></section>'+

    '<div class="w svc">'+
      groups.map(function(g){
        return '<section class="svc-g'+(q === g.key ? " on" : "")+'" id="g-'+esc(g.key)+'">'+
          '<div class="svc-g-h">'+
            '<span class="svc-g-ic">'+icon(g.icon||"chev",22)+'</span>'+
            '<h2>'+esc(g.name)+'</h2>'+
            (g.lead ? '<span class="svc-g-l">'+esc(g.lead)+'</span>' : '')+
          '</div>'+
          '<div class="svc-l">'+g.items.map(function(it){
            return '<a class="svc-i" href="/request?s='+encodeURIComponent(it.key)+'">'+
              '<b>'+esc(it.name)+'</b>'+
              (it.line ? '<span>'+esc(it.line)+'</span>' : '')+
              '<span class="svc-i-go">'+icon("chev",16)+'</span></a>';
          }).join("")+'</div>'+
        '</section>';
      }).join("")+

      '<section class="st-cta">'+
        '<h2>여기 없는 것도 됩니다.</h2>'+
        '<p>목록에 없는 일이라도 고기 장사와 관련된 것이면 그대로 적어 주세요. '+
          '무엇이 필요한 일인지부터 같이 정리하겠습니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/sos">그냥 적어서 물어보기'+icon("arrow",18)+'</a>'+
        '</div>'+
      '</section>'+
    '</div>';
}

/* ── /request — 견적 요청서 ───────────────────────────────── */
function PageRequest(){
  if(REQ.done) return ReqDone();

  var sKey = nowQS("s");
  var svc = sKey ? wowService(sKey) : null;
  /* ⚠️ 못 찾은 key 를 화면에 찍지 않습니다 — "beef-supply" 가 손님
     눈에 보이면 안 됩니다. 그냥 고르는 화면을 보여 줍니다. */
  if(sKey && !svc){
    try{ console.warn("[ABOUTMEAT] 알 수 없는 서비스 key: "+sKey); }catch(e){}
  }
  if(!svc) return ReqPick();

  var form = wowReqForm(svc.key);
  return '<div class="w form-wrap">'+
    '<a class="back-l" href="/partners">'+icon("back",18)+'다른 것 고르기</a>'+
    '<h1 class="pg-h1">'+esc(svc.name)+' 견적 요청</h1>'+
    '<p class="pg-lead">'+(svc.line ? esc(svc.line)+' — ' : '')+
      '조건에 맞는 곳을 찾아 견적을 받아 드립니다. 비용은 들지 않습니다.</p>'+

    Notice()+

    '<div id="rq-err"></div>'+
    '<form class="form" onsubmit="return reqSend(event)">'+
      '<input type="hidden" id="rq-svc" value="'+esc(svc.key)+'">'+

      '<div class="f-r"><label for="rq-q">어떤 상황인가요 <b>*</b></label>'+
        '<textarea id="rq-q" rows="5" required placeholder="'+
          esc(reqPlaceholder(svc))+'"></textarea>'+
        '<p class="f-hint">지금 상태와 원하시는 것을 적어 주시면 됩니다. '+
          '길수록 견적이 정확해집니다.</p></div>'+

      /* 서비스마다 다른 칸 (js/data/reqforms.js). 전부 선택입니다. */
      '<div class="f-2">'+form.map(ReqField).join("")+'</div>'+

      '<div class="f-2">'+
        regionRow("rq-region")+
        fRow("예산 (만원)","rq-budget","text",false,"모르시면 비워 두세요","off")+
      '</div>'+

      '<div class="f-2">'+
        fRow("성함","rq-name","text",true,"","name")+
        fRow("연락처","rq-tel","tel",true,"010-0000-0000","tel")+
      '</div>'+

      ReqConsent()+

      '<button class="btn btn-b btn-lg btn-full" type="submit" id="rq-go">'+
        '견적 요청하기</button>'+
      '<p class="f-foot">요청은 조건에 맞는 곳에만 갑니다. '+
        '원하지 않으시면 연결하지 않습니다.</p>'+
    '</form>'+
  '</div>';
}

function reqPlaceholder(svc){
  if(svc.key === "duct")
    return "예: 40평 고깃집인데 덕트 냄새 민원이 계속 들어옵니다. 3년 전에 시공했고 그 뒤로 손 안 댔습니다.";
  if(svc.key === "beef-supply")
    return "예: 삼겹살·목살 위주로 월 400kg 정도 씁니다. 지금 거래처 단가가 계속 올라서 비교해 보고 싶습니다.";
  if(svc.key === "interior")
    return "예: 기존 고깃집 자리를 인수했습니다. 홀은 그대로 쓰고 주방과 화장실만 새로 하고 싶습니다.";
  return "예: 지금 상태와 원하시는 것을 적어 주세요.";
}

function ReqField(f){
  var id = "rq-f-" + f.key;
  if(f.type === "pick")
    return '<div class="f-r"><label for="'+id+'">'+esc(f.label)+' <em>(선택)</em></label>'+
      '<select id="'+id+'" data-k="'+esc(f.key)+'" class="f-sel">'+
        '<option value="">고르지 않음</option>'+
        f.opts.map(function(o){ return '<option>'+esc(o)+'</option>'; }).join("")+
      '</select></div>';
  if(f.type === "num")
    return '<div class="f-r"><label for="'+id+'">'+esc(f.label)+' <em>(선택)</em></label>'+
      '<span class="calc-in"><input id="'+id+'" data-k="'+esc(f.key)+'" type="text"'+
        ' inputmode="numeric" autocomplete="off">'+
        (f.unit ? '<em>'+esc(f.unit)+'</em>' : '')+'</span></div>';
  return '<div class="f-r"><label for="'+id+'">'+esc(f.label)+' <em>(선택)</em></label>'+
    '<input id="'+id+'" data-k="'+esc(f.key)+'" type="text" autocomplete="off"></div>';
}

/* 고르지 않고 들어왔을 때 — 빈 화면 대신 고르는 화면을 줍니다.
   ⚠️ 서른 개를 한 덩어리로 늘어놓으면 눈이 미끄러집니다. 묶음으로
   끊어 주면 "내 것이 어느 쪽인지" 부터 잡힙니다. */
function ReqPick(){
  return '<div class="w form-wrap form-wide">'+
    '<h1 class="pg-h1">어떤 견적이 필요하세요?</h1>'+
    '<p class="pg-lead">고르시면 그 일에 맞는 것만 여쭤봅니다 — 덕트는 화구 수, '+
      '육류는 월 사용량. 여기 없으면 그냥 적어 주셔도 됩니다.</p>'+
    WOW_SERVICE_GROUPS.map(function(g){
      return '<section class="rq-g">'+
        '<h2>'+icon(g.icon||"chev",20)+esc(g.name)+
          (g.lead ? '<em>'+esc(g.lead)+'</em>' : '')+'</h2>'+
        '<div class="pick pick-wrap">'+g.items.map(function(it){
          return '<a class="pk" href="/request?s='+encodeURIComponent(it.key)+'">'+
            esc(it.name)+'</a>';
        }).join("")+'</div>'+
      '</section>';
    }).join("")+
    '<section class="st-cta">'+
      '<h2>여기 없는 것도 됩니다.</h2>'+
      '<p>고기 장사와 관련된 것이면 그대로 적어 주세요. 무엇이 필요한 일인지부터 '+
        '같이 정리하겠습니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/sos">그냥 적어서 물어보기'+icon("arrow",18)+'</a>'+
      '</div>'+
    '</section>'+
  '</div>';
}

/* 동의 — SOS 와 목적이 다릅니다. 여기는 **업체에 전달**이 들어갑니다.
   ⚠️ 목적을 실제와 다르게 적으면 개인정보보호법 제15조 위반입니다. */
function ReqConsent(){
  return '<fieldset class="agree"><legend>개인정보 수집·이용 동의</legend>'+
    '<ul class="ag-why">'+
      '<li><span>수집 항목</span><b>성함, 연락처 (선택: 지역, 예산, 적어 주신 내용)</b></li>'+
      '<li><span>이용 목적</span><b>견적 요청 확인 및 답변, 적합한 업체 검토</b></li>'+
      '<li><span>보유 기간</span><b>요청 처리 완료 후 1년</b></li>'+
    '</ul>'+
    '<label class="ag-r"><input type="checkbox" id="rq-ag" required>'+
      '<span>위 내용에 동의합니다 <em class="ag-req">(필수)</em></span>'+
      '<a class="ag-v" href="/privacy">방침 보기</a></label>'+
    /* ⚠️ 업체에 넘기는 동의는 **여기서 받지 않습니다.** 어느 업체인지
       정해진 뒤에 상호를 알리고 따로 받습니다 (개인정보보호법 제17조
       제2항 — 제공받는 자를 알리고 동의를 받아야 합니다). */
    '<p class="ag-no">업체에 연락처를 전달하는 것은 여기에 포함되지 않습니다 — '+
      '견적을 받아 올 업체가 정해지면 어디인지 알려 드리고 그때 따로 여쭙겠습니다.</p>'+
    '<p class="ag-no">동의를 거부하실 수 있으며, 이 경우 이 양식으로는 견적을 '+
      '요청하지 못합니다'+
      (bizVal("phone") ? ' — 전화로는 그대로 요청하실 수 있습니다.' : '.')+'</p>'+
  '</fieldset>';
}

window.reqSend = function(ev){
  ev.preventDefault();
  if(REQ.sending) return false;

  var ag = $("rq-ag");
  if(ag && !ag.checked){
    toast("개인정보 수집·이용에 동의해 주세요.");
    try{ ag.closest(".ag-r").classList.add("ag-miss"); ag.focus({preventScroll:true}); }catch(e){}
    return false;
  }

  var extra = {};
  els("[data-k]").forEach(function(el){
    var v = String(el.value||"").trim();
    if(v) extra[el.getAttribute("data-k")] = v;
  });

  var svcKey = ($("rq-svc")||{}).value || "";
  var body = {
    kind:"quote",
    service: svcKey,
    serviceName: wowServiceName(svcKey) || "",
    q:      rval("rq-q"),
    region: regionVal("rq-region"),
    budget: rval("rq-budget"),
    name:   rval("rq-name"),
    tel:    rval("rq-tel"),
    detail: extra,
    agree:  true
  };

  REQ.sending = true;
  sendOk("rq-err");
  var btn = $("rq-go");
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
      REQ.sending = false;
      REQ.done = { tel:body.tel, svc:body.serviceName };
      render(); window.scrollTo(0,0);
    })
    .catch(function(err){
      REQ.sending = false;
      if(btn){ btn.disabled = false; btn.textContent = "견적 요청하기"; }
      try{ console.warn("[ABOUTMEAT] 견적 요청 실패 — "+((err && err.message)||err)+
        ". Vercel 환경변수(INTAKE_WEBHOOK_URL 또는 RESEND_API_KEY·INTAKE_EMAIL_TO)를 "+
        "확인하세요. 넣은 뒤에는 다시 배포해야 적용됩니다."); }catch(e){}
      sendFail("rq-err", "reqSend({preventDefault:function(){}})", body.q);
      toast("지금 접수하지 못했습니다. 적으신 내용은 그대로 있습니다.");
    });
  return false;
};
function rval(id){ var e = $(id); return e ? String(e.value||"").trim() : ""; }

function ReqDone(){
  var o = REQ.done;
  return '<div class="w done">'+
    '<div class="done-ic">'+icon("check",32)+'</div>'+
    '<h1>요청 잘 받았습니다.</h1>'+
    /* ⚠️ 지키지 못할 시간을 적지 않습니다. 몇 시간 안에 라고 쓰면
       그 시간이 지나는 순간 우리가 거짓말을 한 것이 됩니다. */
    '<p class="done-p">'+(o.svc ? esc(o.svc)+' ' : '')+
      '내용을 확인한 뒤 <b>'+esc(o.tel)+'</b> 으로 연락드리겠습니다.</p>'+
    '<p class="done-n">조건에 맞는 곳을 찾아 견적을 받아 드립니다. '+
      '원하지 않으시면 업체를 연결하지 않습니다.</p>'+
    '<div class="row-cta">'+
      CallButton("btn btn-b btn-lg","전화로 문의")+
      '<a class="btn btn-o btn-lg" href="/">홈으로</a>'+
    '</div>'+
  '</div>';
}

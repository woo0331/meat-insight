/* ════════════════════════════════════════════════════════════════════
   파트너 안내 (/partner) · 파트너 등록 (/partner/apply) — 지시서 13·14번

   ⚠️ **"월 ○○건 요청" · "평균 계약률 ○○%" 같은 숫자를 적지 마세요.**
   아직 요청도 파트너도 없습니다. 지어낸 숫자로 업체를 불러 놓으면,
   들어와서 아무 요청도 없는 것을 보는 순간 그 업체는 다시 안 옵니다.
   (지시서 43번 · 표시광고법 제3조)

   지금 정직하게 말할 수 있는 것은 **어떻게 굴러가는가** 와
   **무엇을 받지 않는가** 입니다. 그거면 충분합니다.
   ════════════════════════════════════════════════════════════════════ */

var PT = { sending:false, done:false };

function PagePartner(){
  var how = [
    ["요청을 받습니다", "search",
     "지역 · 서비스 · 규모가 맞는 요청만 보내 드립니다. 아무거나 보내지 않습니다."],
    ["견적을 냅니다", "doc",
     "가격 · 일정 · A/S 조건을 적어 보내시면 됩니다. 사장님이 한 화면에서 비교합니다."],
    ["직접 이야기합니다", "phone",
     "고객이 고르면 바로 연결됩니다. 그 다음 일은 두 분이 직접 하십니다."]
  ];
  var no = [
    ["광고비를 받고 위에 올려 드리지 않습니다",
     "돈을 낸 순서로 보여 주면 사장님이 우리를 믿을 이유가 없어집니다."],
    ["한 건에 열 곳씩 뿌리지 않습니다",
     "한 요청에 최대 세 곳까지입니다. 열 곳이 달려들면 견적이 아니라 경매가 됩니다."],
    ["고객 연락처를 먼저 팔지 않습니다",
     "요청 내용을 보고 하시겠다고 하신 뒤에 연결됩니다."]
  ];
  var want = [
    ["고깃집 · 정육점을 해 보셨는가", "일반 상가와 다릅니다. 환기 · 배수 · 냉장이 먼저입니다."],
    ["사업자등록이 되어 있는가",      "등록증을 확인합니다."],
    ["연락이 닿는가",                "요청이 갔는데 하루가 지나도 답이 없으면 다음부터 안 보냅니다."]
  ];

  return '<section class="pg-hero pg-hero-d"><div class="w">'+
      '<p class="eyebrow">파트너 모집</p>'+
      '<h1 class="pg-h1">고깃집 · 정육점을 아는<br class="br-m"> 업체를 찾고 있습니다.</h1>'+
      '<p class="pg-lead">광고비를 받고 위에 올려 드리는 곳이 아닙니다. '+
        '조건이 맞는 요청만 골라서 보내 드립니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-w btn-lg" href="/partner/apply">파트너 등록하기'+icon("arrow",18)+'</a>'+
      '</div>'+
      /* ⚠️ 지금 상태를 먼저 밝힙니다. 이걸 숨기고 등록시키면
         들어와서 아무것도 없는 것을 보는 순간 신뢰를 잃습니다. */
      '<p class="pg-now">'+icon("info",18)+
        '지금은 서비스를 여는 중입니다. 요청 건수나 계약 실적을 아직 말씀드릴 수 없습니다 — '+
        '없는 숫자를 지어내지 않겠습니다. 먼저 등록해 두시면 요청이 열리는 대로 연락드립니다.</p>'+
    '</div></section>'+

    '<div class="w pt-pg">'+
      '<section class="pt-sec"><h2>어떻게 굴러갑니까</h2>'+
        '<ol class="steps">'+how.map(function(x,i){
          return '<li><span class="steps-n">'+("0"+(i+1))+'</span>'+
            '<b>'+icon(x[1],20)+esc(x[0])+'</b><span>'+esc(x[2])+'</span></li>';
        }).join("")+'</ol></section>'+

      '<section class="pt-sec"><h2>하지 않는 것</h2>'+
        '<ul class="pt-no">'+no.map(function(x){
          return '<li>'+icon("x",20)+'<b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>';
        }).join("")+'</ul></section>'+

      '<section class="pt-sec"><h2>확인하는 것</h2>'+
        '<ul class="pt-yes">'+want.map(function(x){
          return '<li>'+icon("badge",20)+'<b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>';
        }).join("")+'</ul>'+
        '<p class="note">확인이 끝난 업체에만 요청을 보냅니다. '+
          '확인 항목은 사장님 화면에도 그대로 보여 드릴 예정입니다.</p></section>'+

      '<section class="pt-sec"><h2>어떤 일들이 들어옵니까</h2>'+
        '<div class="pt-svc">'+WOW_SERVICE_GROUPS.map(function(g){
          return '<div class="pt-svc-g">'+
            '<b>'+icon(g.icon||"chev",18)+esc(g.name)+'</b>'+
            '<span>'+g.items.map(function(it){ return esc(it.name); }).join(" · ")+'</span>'+
          '</div>';
        }).join("")+'</div></section>'+

      '<section class="st-cta">'+
        '<h2>등록에 비용은 들지 않습니다.</h2>'+
        '<p>등록해 두시면 조건에 맞는 요청이 생길 때 연락드립니다. '+
          '받으실지 말지는 그때 정하시면 됩니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/partner/apply">파트너 등록하기'+icon("arrow",18)+'</a>'+
        '</div>'+
      '</section>'+
    '</div>';
}

/* ── 파트너 등록 ──────────────────────────────────────────── */
function PagePartnerApply(){
  if(PT.done) return PtDone();

  return '<div class="w form-wrap">'+
    '<a class="back-l" href="/partner">'+icon("back",18)+'파트너 안내로</a>'+
    '<h1 class="pg-h1">파트너 등록</h1>'+
    '<p class="pg-lead">아래만 적어 주시면 됩니다. 나머지는 확인 전화 때 여쭙겠습니다. '+
      '등록에 비용은 들지 않습니다.</p>'+

    Notice()+

    '<form class="form" onsubmit="return ptSend(event)">'+
      '<div class="f-2">'+
        fRow("업체명","pt-co","text",true,"","organization")+
        fRow("담당자 성함","pt-name","text",true,"","name")+
      '</div>'+
      '<div class="f-2">'+
        fRow("연락처","pt-tel","tel",true,"010-0000-0000","tel")+
        fRow("사업자등록번호","pt-brn","text",false,"000-00-00000","off")+
      '</div>'+

      '<div class="f-r"><label>어떤 일을 하십니까 <b>*</b></label>'+
        '<p class="f-hint">여러 개 고르셔도 됩니다.</p>'+
        '<div class="pick pick-wrap" id="pt-svc">'+WOW_SERVICES.map(function(s){
          return '<button type="button" class="pk" data-k="'+esc(s.key)+'" '+
            'aria-pressed="false" onclick="ptPick(this)">'+esc(s.name)+'</button>';
        }).join("")+'</div></div>'+

      '<div class="f-2">'+
        fRow("주로 일하시는 지역","pt-region","text",false,"예: 경기 남부","address-level2")+
        fRow("고깃집 · 정육점 경험","pt-exp","text",false,"예: 고깃집 덕트 8년","off")+
      '</div>'+

      '<div class="f-r"><label for="pt-note">더 하실 말씀 <em>(선택)</em></label>'+
        '<textarea id="pt-note" rows="4" placeholder="잘하시는 것, 어떤 요청을 '+
          '받고 싶으신지 적어 주세요."></textarea></div>'+

      '<fieldset class="agree"><legend>개인정보 수집·이용 동의</legend>'+
        '<ul class="ag-why">'+
          '<li><span>수집 항목</span><b>업체명, 담당자 성함, 연락처 (선택: 사업자등록번호, 지역, 경력, 적어 주신 내용)</b></li>'+
          '<li><span>이용 목적</span><b>파트너 등록 확인 및 자격 검증, 조건에 맞는 요청 안내</b></li>'+
          '<li><span>보유 기간</span><b>파트너 탈퇴 또는 등록 거절 시까지</b></li>'+
        '</ul>'+
        '<label class="ag-r"><input type="checkbox" id="pt-ag" required>'+
          '<span>위 내용에 동의합니다 <em class="ag-req">(필수)</em></span>'+
          '<a class="ag-v" href="/privacy">방침 보기</a></label>'+
        '<p class="ag-no">동의를 거부하실 수 있으며, 이 경우 이 양식으로는 등록하지 못합니다.</p>'+
      '</fieldset>'+

      '<button class="btn btn-b btn-lg btn-full" type="submit" id="pt-go">'+
        '등록 신청하기</button>'+
      '<p class="f-foot">확인 후 연락드립니다. 등록비·광고비는 없습니다.</p>'+
    '</form>'+
  '</div>';
}

window.ptPick = function(el){
  var on = el.classList.toggle("on");
  el.setAttribute("aria-pressed", on ? "true" : "false");
};

window.ptSend = function(ev){
  ev.preventDefault();
  if(PT.sending) return false;

  var ag = $("pt-ag");
  if(ag && !ag.checked){
    toast("개인정보 수집·이용에 동의해 주세요.");
    try{ ag.closest(".ag-r").classList.add("ag-miss"); ag.focus({preventScroll:true}); }catch(e){}
    return false;
  }
  var svcs = els("#pt-svc .pk.on").map(function(b){ return b.getAttribute("data-k"); });
  if(!svcs.length){
    toast("어떤 일을 하시는지 하나 이상 골라 주세요.");
    try{ $("pt-svc").scrollIntoView({behavior:"smooth", block:"center"}); }catch(e){}
    return false;
  }

  var body = {
    kind:"partner",
    company: rval("pt-co"), name: rval("pt-name"), tel: rval("pt-tel"),
    brn: rval("pt-brn"), region: rval("pt-region"), exp: rval("pt-exp"),
    note: rval("pt-note"),
    services: svcs,
    serviceNames: svcs.map(function(k){ return wowServiceName(k) || k; }),
    agree: true
  };

  PT.sending = true;
  var btn = $("pt-go");
  if(btn){ btn.disabled = true; btn.textContent = "보내는 중…"; }

  fetch("/api/quote", { method:"POST", headers:{ "content-type":"application/json" },
                        body: JSON.stringify(body) })
    .then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(j){
        if(!r.ok) throw new Error((j && j.error) || ("HTTP "+r.status));
        return j;
      });
    })
    .then(function(){ PT.sending = false; PT.done = true; render(); window.scrollTo(0,0); })
    .catch(function(err){
      PT.sending = false;
      if(btn){ btn.disabled = false; btn.textContent = "등록 신청하기"; }
      try{ console.warn("[ABOUTMEAT] 파트너 등록 실패 — "+((err && err.message)||err)); }catch(e){}
      toast("지금 접수하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
    });
  return false;
};

function PtDone(){
  return '<div class="w done">'+
    '<div class="done-ic">'+icon("check",32)+'</div>'+
    '<h1>등록 신청을 받았습니다.</h1>'+
    '<p class="done-p">내용을 확인한 뒤 연락드리겠습니다.</p>'+
    '<p class="done-n">확인이 끝나면 조건에 맞는 요청이 생길 때 알려 드립니다.</p>'+
    '<div class="row-cta">'+
      '<a class="btn btn-o btn-lg" href="/partner">파트너 안내 다시 보기</a>'+
      '<a class="btn btn-o btn-lg" href="/">홈으로</a>'+
    '</div>'+
  '</div>';
}

/* ════════════════════════════════════════════════════════════════════
   소개 (/about)

   ⚠️ 연혁 · 임직원 수 · 거래처 수를 적지 않습니다. 없습니다.
   적을 수 있는 것은 **무엇을 하는 곳이고 무엇을 안 하는 곳인가** 입니다.
   ════════════════════════════════════════════════════════════════════ */
function PageAbout(){
  var flow = [
    ["문제를 적습니다", "chat",  "양식이 없어도 됩니다. 말하듯 적으시면 됩니다."],
    ["무슨 일인지 봅니다", "search", "사람이 직접 읽고 무엇이 필요한 일인지 정리합니다."],
    ["해결방법을 알려 드립니다", "bulb", "업체를 부를 일인지, 직접 하실 일인지부터 나눕니다."],
    ["업체를 찾습니다", "users", "조건에 맞는 곳을 최대 세 곳. 명단을 뿌리지 않습니다."],
    ["견적을 비교합니다", "doc", "가격 · 일정 · A/S 를 한 화면에서."],
    ["그 다음은 직접", "hand", "계약과 시공은 두 분이 하십니다. 우리가 끼지 않습니다."]
  ];
  var nots = [
    "고기를 팔지 않습니다",
    "업체 명단을 뿌리지 않습니다",
    "광고비 순서로 보여 주지 않습니다",
    "없는 숫자를 지어내지 않습니다"
  ];
  return '<section class="pg-hero"><div class="w">'+
      '<p class="eyebrow">ABOUTMEAT</p>'+
      '<h1 class="pg-h1">고기 장사를 하다 막혔을 때<br class="br-m"> 물어보는 곳입니다.</h1>'+
      '<p class="pg-lead">고깃집과 정육점은 일반 음식점과 다릅니다. 환기 · 배수 · 냉장 · '+
        '원가 구조가 전부 다른데, 물어볼 데가 마땅치 않습니다. '+
        '그래서 만들었습니다.</p>'+
    '</div></section>'+

    '<div class="w ab">'+
      '<section class="pt-sec"><h2>하는 일</h2>'+
        '<ol class="ab-flow">'+flow.map(function(x,i){
          return '<li><span class="ab-n">'+("0"+(i+1))+'</span>'+
            '<span class="ab-ic">'+icon(x[1],20)+'</span>'+
            '<b>'+esc(x[0])+'</b><span class="ab-d">'+esc(x[2])+'</span></li>';
        }).join("")+'</ol></section>'+

      '<section class="pt-sec"><h2>안 하는 일</h2>'+
        '<ul class="ab-no">'+nots.map(function(t){
          return '<li>'+icon("x",18)+esc(t)+'</li>'; }).join("")+'</ul>'+
        '<p class="note">마지막 줄이 제일 중요합니다. 업체 수 · 계약 수 · 절감금액 · '+
          '평점 같은 숫자는 실제 데이터가 생기기 전까지 화면에 내지 않습니다.</p>'+
      '</section>'+

      '<section class="st-cta">'+
        '<h2>지금 막힌 것부터 말씀해 주세요.</h2>'+
        '<p>비용은 들지 않고, 가입하지 않으셔도 됩니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/sos">무료로 물어보기'+icon("arrow",18)+'</a>'+
          CallButton("btn btn-o btn-lg","전화로 문의")+
        '</div>'+
      '</section>'+
    '</div>';
}

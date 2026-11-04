/* ════════════════════════════════════════════════════════════════════
   업체 입점 신청 양식 — /join 에서만 돕니다

   ⚠️⚠️ **고르는 항목을 여기 손으로 적지 않습니다.** window.AM_CATS 에서
   그대로 꺼냅니다. 두 곳에 적으면 한쪽만 고쳐서, 화면이 보낸 키를
   아무도 못 읽는 꼴이 됩니다 (업체가 등록은 되는데 **어느 목록에도 안
   뜨는** 고장 — 에러가 안 납니다).

   ⚠️⚠️ **개인정보보호법 제15조 제2항** — 수집 항목 · 이용 목적 ·
   보유 기간을 **동의받는 그 자리에서** 같이 보여 줍니다. 링크로
   빼 두면 "같이 보여 준 것" 이 아닙니다.

   ⚠️⚠️ **접수가 안 되면 양식을 열지 않습니다.** Supabase 설정이 없으면
   다 적고 누른 뒤에 실패합니다 — 그 전에 막습니다 (절대 규칙 5).

   ⚠️ 신청번호는 **DB 가 돌려준 값**을 그대로 보여 줍니다. 화면이
   만들어 찍으면 실제로 저장된 번호와 달라집니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("joinbox");
  if(!box || !window.amAuthAsk) return;

  var KEEP = (window.WOW_BIZ || {}).applyKeep || "";

  function fields(){
    /* ⚠️⚠️ **업체가 고를 수 있는 하위만** 냅니다 (amCatItemsForProvider).
       중고 골프장터처럼 **한 분류 안에 둘이 섞이는** 자리가 있습니다 —
       드라이버 직거래는 회원끼리, 매입 견적 · 위탁판매는 업체입니다.
       분류째로 빼면 업체가 할 수 있는 일을 못 고르게 됩니다. */
    return (window.amCatsForProvider ? window.amCatsForProvider() : []).map(function(c){
      return '<fieldset class="svc"><legend>' + esc(c.name) + '</legend>' +
        window.amCatItemsForProvider(c).map(function(it){
          return '<label class="chk"><input type="checkbox" name="svc" value="' +
            esc(it.key) + '"><span>' + esc(it.name) + '</span></label>';
        }).join("") + '</fieldset>';
    }).join("");
  }

  function form(){
    return '<form id="jf" class="jform">' +
      '<div class="jrow">' +
        '<label for="j-company">상호 <b>*</b></label>' +
        '<input id="j-company" name="company" required maxlength="80" autocomplete="organization">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="j-name">담당자 성함 <b>*</b></label>' +
        '<input id="j-name" name="name" required maxlength="40" autocomplete="name">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="j-tel">연락처 <b>*</b></label>' +
        '<input id="j-tel" name="tel" required inputmode="tel" autocomplete="tel" ' +
        'placeholder="010-0000-0000">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="j-brn">사업자등록번호</label>' +
        '<input id="j-brn" name="brn" inputmode="numeric" placeholder="000-00-00000">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="j-email">이메일</label>' +
        '<input id="j-email" name="email" type="email" autocomplete="email">' +
      '</div>' +
      /* ⚠️⚠️ **자유 입력이 아니라 고르는 칸입니다.** 앞 서비스가 "화면이
         보낸 글 그대로" 저장했다가 경기 · gyeonggi · 경기도 가 섞여
         거르개가 조용히 어긋났습니다 (0016 머리말). 목록은
         js/data/regions.js **한 곳**에서 옵니다.
         ⚠️ select 안의 글자는 낱말 잘림 검사에도 가로 스크롤 검사에도
         안 걸립니다 — tools/test-join.js 가 글자 폭을 따로 잽니다. */
      '<div class="jrow">' +
        '<label for="j-region">영업 지역</label>' +
        '<select id="j-region" name="region">' +
          '<option value="">고르지 않음</option>' +
          (window.AM_REGIONS || []).map(function(r){
            return '<option value="' + esc(r.name) + '">' + esc(r.full) + '</option>';
          }).join("") +
        '</select>' +
      '</div>' +
      /* ⚠️ 사업장 주소 (4차 지시서 §9 의 "업체 가입 정보") — 0045 가
         provider_apply.addr 을 더했습니다. ⚠️ **필수로 만들지 않습니다**:
         주소가 없어도 입점 심사는 됩니다 (연락이 먼저입니다). */
      '<div class="jrow jrow-full">' +
        '<label for="j-addr">사업장 주소</label>' +
        '<input id="j-addr" name="addr" maxlength="200" autocomplete="street-address" ' +
        'placeholder="예: 서울특별시 강남구 테헤란로 1">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label>하시는 일 <b>*</b></label>' +
        '<div class="svcs">' + fields() + '</div>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="j-note">더 하실 말씀</label>' +
        '<textarea id="j-note" name="note" rows="4" maxlength="2000"></textarea>' +
      '</div>' +
      /* ⚠️⚠️ 동의 자리에 셋을 같이 둡니다 (제15조 제2항) */
      '<div class="agree">' +
        '<h3>개인정보 수집 · 이용 동의</h3>' +
        '<dl>' +
          /* ⚠️⚠️ **묻는 칸이 늘면 이 줄도 같이 늘려야 합니다** (제15조
             제2항). 받으면서 안 적으면 위반이고, 안 받으면서 적으면
             거짓입니다 — js/data/legal-privacy.js 의 같은 줄도 함께. */
          '<dt>수집 항목</dt><dd>상호 · 담당자 성함 · 연락처 ' +
            '(적으시면 사업자등록번호 · 이메일 · 영업 지역 · 사업장 주소)</dd>' +
          '<dt>이용 목적</dt><dd>입점 심사와 그 결과를 알려 드리기 위한 연락</dd>' +
          '<dt>보유 기간</dt><dd>' + esc(KEEP) + '</dd>' +
        '</dl>' +
        '<p class="agree-no">동의하지 않으셔도 됩니다. 다만 동의 없이는 ' +
        '연락을 드릴 수 없어 심사가 진행되지 않습니다.</p>' +
        '<label class="chk"><input type="checkbox" id="j-agree" required>' +
        '<span>위 내용에 동의합니다.</span></label>' +
      '</div>' +
      '<button class="btn btn-pri" type="submit">입점 신청하기</button>' +
      '<p id="jmsg" class="lmsg" hidden></p>' +
    '</form>';
  }

  function submit(e){
    e.preventDefault();
    var f = e.target, msg = document.getElementById("jmsg");
    var a = amAuthNow();
    var svc = [].slice.call(f.querySelectorAll('input[name="svc"]:checked'))
                 .map(function(i){ return i.value; });
    if(!svc.length){
      msg.hidden = false; msg.textContent = "하시는 일을 하나 이상 골라 주세요."; return;
    }
    var btn = f.querySelector('button[type="submit"]');
    btn.disabled = true;
    msg.hidden = false; msg.textContent = "보내는 중입니다…";

    fetch(a.conf.url + "/rest/v1/rpc/make_apply", {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json", apikey:a.conf.anonKey },
                             window.amAuthHeaders ? amAuthHeaders() : {}),
      /* ⚠️ 동의 시각은 **누른 그 순간**입니다. 화면을 연 시각이 아닙니다. */
      body: JSON.stringify({ p: {
        company: f.company.value, name: f.name.value, tel: f.tel.value,
        brn: f.brn.value, email: f.email.value, region: f.region.value,
        /* ⚠️ 칸을 만들어 놓고 **안 보내면** 조용히 비워집니다 — 화면에
           칸이 있는데 저장은 안 되는 꼴입니다 (작업 기억: 만들어 놓고
           안 쓰는 칸, 다섯 번 겪었습니다). */
        addr: f.addr.value,
        note: f.note.value, services: svc, agree_at: new Date().toISOString()
      }})
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    }).then(function(no){
      /* ⚠️ "접수됐습니다" 는 **실제로 들어간 뒤에만** 말합니다. */
      box.innerHTML = '<div class="none"><h2>접수됐습니다.</h2>' +
        '<p>신청번호 <b>' + esc(String(no).replace(/^"|"$/g, "")) + '</b> 입니다. ' +
        '확인한 뒤 적어 주신 연락처로 연락드립니다.</p>' +
        '<a class="btn btn-line" href="/guide">이용안내 보기</a></div>';
      box.className = "";
      try{ box.scrollIntoView({ behavior:"smooth", block:"center" }); }catch(_){}
    }).catch(function(err){
      btn.disabled = false;
      msg.textContent = String(err && err.message || "보내지 못했습니다.");
    });
  }

  amAuthAsk().then(function(a){
    /* 설정이 없으면 **양식을 열지 않습니다** — 기본 안내 그대로 둡니다. */
    if(!a.on || !a.conf || !a.conf.url || !a.conf.anonKey){
      try{ console.warn("[join] Supabase 설정이 없어 입점 신청 양식을 열지 않았습니다 — " +
        "Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY 를 넣고 다시 배포하세요."); }catch(e){}
      return;
    }
    if(!KEEP){
      /* ⚠️⚠️ 보유 기간을 못 적으면 제15조 제2항을 못 지킵니다 — 법이
         요구하는 것을 안 보여 주고 동의를 받을 수는 없습니다. */
      try{ console.warn("[join] js/data/site.js 의 applyKeep(보유 기간)이 비어 " +
        "양식을 열지 않았습니다 — 개인정보보호법 제15조 제2항."); }catch(e){}
      return;
    }
    /* ⚠️ 양식을 여는 **그 자리에서** 머리말도 같이 바꿉니다 (지시서 §8).
       화면 위아래가 서로 다른 말을 하지 않게 합니다. */
    var lead = document.getElementById("joinlead");
    if(lead){
      lead.innerHTML = '골프 관련 사업자라면 입점하실 수 있습니다. 입점은 ' +
        '무료입니다. 등록하신 분야와 지역에 맞는 손님 문의가 넘어갑니다.';
    }
    box.className = "jbox";
    box.innerHTML = form();
    document.getElementById("jf").addEventListener("submit", submit);
  });
})();

/* ════════════════════════════════════════════════════════════════════
   고객센터 문의 접수 — /help 에서만 돕니다 (4차 지시서 §11 · DB 는 0045)

   ⚠️⚠️ **왜 이 양식이 생겼나.** 신고 · 분쟁(0040)은 "어느 요청 · 어느
   업체" 를 가리켜야 열립니다. 그냥 묻고 싶은 것을 받을 자리가 한 곳도
   없었고, 사업자 정보 여덟 칸이 비어 있어 전화 · 이메일도 적을 수
   없었습니다 (전자상거래법 제10조 — 없는 연락처를 지어낼 수 없습니다).

   ⚠️⚠️ **접수가 안 되면 양식을 열지 않습니다** (절대 규칙 5).
   Supabase 설정이 없으면 다 적고 누른 뒤에 실패합니다 — 그 전에
   막습니다. 빌드가 찍어 둔 "지금은 받지 못합니다" 가 그대로 남습니다.

   ⚠️⚠️ **개인정보보호법 제15조 제2항** — 수집 항목 · 이용 목적 ·
   보유 기간을 **동의받는 그 자리에서** 같이 보여 줍니다. 링크로 빼
   두면 "같이 보여 준 것" 이 아닙니다.
   ⚠️ 보유 기간은 js/data/site.js 의 inquiryKeep 한 곳에서 옵니다 —
   비어 있으면 양식을 **열지 않습니다** (법이 요구하는 것을 안 보여
   주고 동의를 받을 수는 없습니다).

   ⚠️ 접수번호는 **DB 가 돌려준 값**을 그대로 보여 줍니다. 화면이
   만들어 찍으면 실제로 저장된 번호와 달라집니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("inqbox");
  if(!box || !window.amAuthAsk) return;

  var esc  = window.esc;
  var KEEP = (window.WOW_BIZ || {}).inquiryKeep || "";

  /* 문의 갈래 — ⚠️⚠️⚠️ **`js/data/deal.js` 한 곳에서 옵니다.** 전에는
     이 파일이 넷을 따로 적고 있었고, 운영자의 문의함(`js/admininq.js`)이
     또 한 벌을 적고 있었습니다 — 같은 키를 **세 곳**에 적어 둔 자리이고,
     값은 0045 의 check 와 한 글자도 같아야 합니다 (다르면 DB 가 "문의
     종류를 골라 주세요" 로 거절하고 손님은 골랐는데 왜 안 되는지
     모릅니다). 이제 `tools/check-deal.js` 가 그 한 곳을 0045 와
     맞춰 봅니다.
     ⚠️⚠️ 그래서 `/help` 가 **`js/data/deal.js` 를 실어야** 합니다 —
     안 실으면 아래에서 양식을 **안 엽니다** (`site.js` 를 안 실어서
     양식이 조용히 안 열렸던 그 자리입니다. 조용히 빈 고르는 칸을
     내는 것보다 안 여는 쪽이 낫습니다 — 고를 것이 없는 칸은 눌러도
     아무 일이 안 나는 칸입니다 · 절대 규칙 5).
     ⚠️ `tools/test-help.js` 가 양식을 눌러 보므로, 그 줄을 빠뜨리면
     검사가 멈춥니다. */
  var KINDS = window.AM_INQ_KIND || [];

  function form(signedIn){
    return '<form id="iqf" class="jform">' +
      '<div class="jrow">' +
        '<label for="i-kind">문의 종류 <b>*</b></label>' +
        '<select id="i-kind" name="kind" required>' +
          KINDS.map(function(k){
            return '<option value="' + esc(k.key) + '">' + esc(k.name) + '</option>';
          }).join("") +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="i-name">성함</label>' +
        '<input id="i-name" name="name" maxlength="40" autocomplete="name">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="i-body">문의 내용 <b>*</b></label>' +
        '<textarea id="i-body" name="body" rows="5" required ' +
        'minlength="5" maxlength="2000" ' +
        'placeholder="무엇이 궁금하신지 적어 주세요. 다섯 글자 이상."></textarea>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="i-tel">연락처' + (signedIn ? '' : ' <b>*</b>') + '</label>' +
        '<input id="i-tel" name="tel" inputmode="tel" autocomplete="tel" ' +
        'maxlength="20" placeholder="010-0000-0000">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="i-email">이메일' + (signedIn ? '' : ' <b>*</b>') + '</label>' +
        '<input id="i-email" name="email" type="email" autocomplete="email" ' +
        'maxlength="120">' +
      '</div>' +
      /* ⚠️ 로그인하셨으면 계정으로 답할 수 있어 연락처가 선택입니다 —
         그 사실을 **화면이 말합니다** (별표만 바꾸면 왜인지 모릅니다). */
      '<p class="jrow jrow-full iq-reach">' +
        (signedIn
          ? '로그인하셨으므로 연락처를 안 적으셔도 됩니다 — 계정으로 답해 드립니다.'
          : '답을 보내 드려야 해서 <b>전화번호나 이메일 가운데 하나</b>는 적어 주세요.') +
      '</p>' +
      '<div class="agree">' +
        '<h3>개인정보 수집 · 이용 동의</h3>' +
        /* ⚠️⚠️ 묻는 칸이 늘면 이 줄도 · 개인정보처리방침의 같은 줄도
           **같이** 늘려야 합니다 (받으면서 안 적으면 위반입니다). */
        '<dl>' +
          '<dt>수집 항목</dt><dd>문의 내용 · 문의 종류 ' +
            '(적으시면 성함 · 연락처 · 이메일)</dd>' +
          '<dt>이용 목적</dt><dd>문의에 답해 드리고, 같은 일이 반복되지 ' +
            '않게 처리 기록을 남기기 위하여</dd>' +
          '<dt>보유 기간</dt><dd>' + esc(KEEP) + '</dd>' +
        '</dl>' +
        '<p class="agree-no">동의하지 않으셔도 됩니다. 다만 동의 없이는 ' +
          '답을 보내 드릴 길이 없어 접수가 어렵습니다.</p>' +
        '<label class="chk"><input type="checkbox" id="i-agree" required>' +
          '<span>위 내용에 동의합니다.</span></label>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<button class="btn btn-pt" type="submit">문의 보내기</button>' +
      '</div>' +
      '<p id="imsg" class="lmsg" hidden></p>' +
    '</form>';
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[help] 로그인 · 접수가 설정되지 않아 문의 양식을 " +
        "열지 않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      return;                       /* 빌드가 찍어 둔 닫힌 글 그대로 */
    }
    /* ⚠️ 고를 것이 없으면 양식을 열지 않습니다 (위 머리말) */
    if(!KINDS.length){
      try{ console.warn("[help] js/data/deal.js 를 싣지 않아 문의 갈래가 " +
        "비어 양식을 열지 않았습니다 (pages/help.js 의 js 목록)."); }catch(e){}
      return;
    }
    if(!KEEP){
      /* ⚠️⚠️ 보유 기간을 못 보여 주면 동의를 받을 수 없습니다 (제15조
         제2항). 운영자에게만 말하고 양식은 안 엽니다. */
      try{ console.warn("[help] js/data/site.js 의 inquiryKeep(보유 기간)이 " +
        "비어 양식을 열지 않았습니다 — 개인정보보호법 제15조 제2항."); }catch(e){}
      return;
    }

    box.className = "jbox";
    box.innerHTML = form(!!a.signedIn);

    document.getElementById("iqf").addEventListener("submit", function(e){
      e.preventDefault();
      var f = e.target, msg = document.getElementById("imsg");
      var tel = (f.tel.value || "").trim(), mail = (f.email.value || "").trim();

      /* ⚠️ 문이 막는 것과 **같은 말**로 미리 막습니다 — 보내고 나서
         거절당하면 손님이 왜인지 모릅니다. 문도 그대로 막습니다
         (화면만 믿지 않습니다). */
      if(!a.signedIn && !tel && !mail){
        msg.hidden = false;
        msg.textContent = "답을 보내 드릴 전화번호나 메일 주소를 적어 주세요.";
        return;
      }

      var btn = f.querySelector('button[type="submit"]');
      btn.disabled = true;
      msg.hidden = false; msg.textContent = "보내는 중입니다…";

      fetch(a.conf.url + "/rest/v1/rpc/open_inquiry", {
        method:"POST",
        headers: Object.assign({ "content-type":"application/json", apikey:a.conf.anonKey },
                               window.amAuthHeaders ? window.amAuthHeaders() : {}),
        /* ⚠️ 동의 시각은 **누른 그 순간**입니다 (화면을 연 시각이 아닙니다) */
        body: JSON.stringify({ p: {
          kind: f.kind.value, body: f.body.value,
          name: f.name.value, tel: tel, email: mail,
          agree_at: new Date().toISOString()
        }})
      }).then(function(r){
        return r.text().then(function(t){
          if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                     throw new Error(m); }
          try{ return JSON.parse(t); }catch(_){ return t; }
        });
      }).then(function(no){
        /* ⚠️ "접수됐습니다" 는 **실제로 들어간 뒤에만** 말합니다.
           ⚠️ 번호는 DB 가 돌려준 값 그대로입니다. */
        box.className = "none";
        box.innerHTML = '<h2>문의를 접수했습니다.</h2>' +
          '<p>접수번호 <b>' + esc(String(no).replace(/^"|"$/g, "")) + '</b></p>' +
          '<p>운영자가 확인하고 적어 주신 곳으로 답해 드립니다. ' +
          /* ⚠️ 지킬 수 없는 약속을 하지 않습니다 — 몇 시간 · 며칠을
             적지 않습니다 (절대 규칙 5). */
          '언제까지라고 약속드리지는 않습니다.</p>';
      }).catch(function(err){
        btn.disabled = false;
        /* ⚠️ DB 가 거절한 말을 **그대로** 보여 줍니다 — 우리가 고쳐
           쓰면 까닭이 바뀝니다. */
        msg.textContent = String((err && err.message) || "보내지 못했습니다.");
      });
    });
  }).catch(function(){ /* 못 물어봤으면 닫힌 글 그대로 둡니다 */ });
})();

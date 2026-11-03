/* ════════════════════════════════════════════════════════════════════
   견적 · 매칭 요청 양식 — /match 에서만 돕니다 (2차 지시서 §5)

   ⚠️⚠️ **고르는 항목을 여기 손으로 적지 않습니다.** window.AM_CATS 에서
   그대로 꺼냅니다. 두 곳에 적으면 화면이 보낸 키를 아무도 못 읽는 꼴이
   됩니다 — 업체는 등록돼 있는데 **요청이 아무에게도 안 가는** 고장이고,
   에러가 안 납니다.
   ⚠️ **업체가 고를 수 있는 하위만** 냅니다 (amCatItemsForProvider).
   회원끼리 쓰는 자리(중고 직거래 · 조인 · 커뮤니티)는 매칭 대상이
   아닙니다 — 거기에 요청을 보내면 받을 업체가 없습니다.

   ⚠️⚠️ **제3자 제공 동의를 여기서 받지 않습니다** (개인정보보호법
   제17조 제2항). 받는 것은 수집 · 이용 동의뿐이고, 업체가 정해지는
   순간 상호를 알리고 다시 받습니다. 동의 글에도 그렇게 적습니다.

   ⚠️ **두 번 눌러도 하나입니다** — 화면을 열 때 만든 idem 을 같이
   보냅니다. DB 가 같은 idem 이면 **같은 번호**를 돌려줍니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("matchbox");
  if(!box || !window.amAuthAsk) return;

  var KEEP = (window.WOW_BIZ || {}).applyKeep || "";
  /* ⚠️ 화면을 연 동안 하나 — 다시 열면 새로 만듭니다 */
  var IDEM = (function(){
    try{
      if(window.crypto && crypto.randomUUID) return "m-" + crypto.randomUUID();
    }catch(e){}
    return "m-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
  })();

  function services(){
    return (window.amCatsForProvider ? window.amCatsForProvider() : []).map(function(c){
      return '<fieldset class="svc"><legend>' + esc(c.name) + '</legend>' +
        window.amCatItemsForProvider(c).map(function(it){
          return '<label class="chk"><input type="checkbox" name="svc" value="' +
            esc(it.key) + '" data-cat="' + esc(c.key) + '"><span>' +
            esc(it.name) + '</span></label>';
        }).join("") + '</fieldset>';
    }).join("");
  }

  function form(){
    return '<form id="mf" class="jform">' +
      '<div class="jrow jrow-full">' +
        '<label>원하는 서비스 <b>*</b></label>' +
        '<div class="svcs">' + services() + '</div>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="m-region">지역</label>' +
        '<select id="m-region" name="region">' +
          '<option value="">고르지 않음</option>' +
          (window.AM_REGIONS || []).map(function(r){
            return '<option value="' + esc(r.name) + '">' + esc(r.full) + '</option>';
          }).join("") +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="m-want">희망 일정</label>' +
        '<input id="m-want" name="want_at" maxlength="40" placeholder="예: 이번 달 안에">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="m-bmin">예산 (아래)</label>' +
        '<input id="m-bmin" name="budget_min" inputmode="numeric" placeholder="원">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="m-bmax">예산 (위)</label>' +
        '<input id="m-bmax" name="budget_max" inputmode="numeric" placeholder="원">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="m-body">더 하실 말씀</label>' +
        '<textarea id="m-body" name="body" rows="4" maxlength="2000" ' +
        'placeholder="구력 · 원하시는 조건 · 궁금한 점을 적어 주세요."></textarea>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="m-name">성함 <b>*</b></label>' +
        '<input id="m-name" name="name" required maxlength="40" autocomplete="name">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="m-tel">연락처 <b>*</b></label>' +
        '<input id="m-tel" name="tel" required inputmode="tel" autocomplete="tel" ' +
        'placeholder="010-0000-0000">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="m-email">이메일</label>' +
        '<input id="m-email" name="email" type="email" autocomplete="email">' +
      '</div>' +
      /* ⚠️⚠️ 셋을 같은 자리에 (개인정보보호법 제15조 제2항) */
      '<div class="agree">' +
        '<h3>개인정보 수집 · 이용 동의</h3>' +
        '<dl>' +
          '<dt>수집 항목</dt><dd>성함 · 연락처 · 요청하신 내용 ' +
            '(적으시면 이메일 · 지역 · 예산 · 희망 일정)</dd>' +
          '<dt>이용 목적</dt><dd>요청에 맞는 업체를 찾아 연결하고 진행 상황을 알려 드리기 위하여</dd>' +
          '<dt>보유 기간</dt><dd>' + esc(KEEP) + '</dd>' +
        '</dl>' +
        '<p class="agree-no"><b>업체에 전달하는 동의는 여기서 받지 않습니다.</b> ' +
        '어느 업체에 전달할지 정해지면 그 업체의 상호를 알려 드리고 그때 다시 여쭙니다. ' +
        '동의하지 않으시면 그 업체에는 전달되지 않습니다.</p>' +
        '<label class="chk"><input type="checkbox" id="m-agree" required>' +
        '<span>위 내용에 동의합니다.</span></label>' +
      '</div>' +
      '<button class="btn btn-pt" type="submit">견적 · 매칭 요청하기</button>' +
      '<p id="mmsg" class="lmsg" hidden></p>' +
    '</form>';
  }

  function submit(e){
    e.preventDefault();
    var f = e.target, msg = document.getElementById("mmsg"), a = amAuthNow();
    var picked = [].slice.call(f.querySelectorAll('input[name="svc"]:checked'));
    if(!picked.length){
      msg.hidden = false; msg.textContent = "원하시는 서비스를 하나 이상 골라 주세요."; return;
    }
    /* ⚠️ 분류는 **처음 고르신 것**의 분류입니다 — DB 는 분류 목록을
       모르므로 화면이 적어 보냅니다 (그 목록은 catalog.js 한 곳). */
    var cat = picked[0].getAttribute("data-cat") || "";
    var num = function(v){ v = String(v || "").replace(/[^0-9]/g, ""); return v === "" ? "" : v; };

    var btn = f.querySelector('button[type="submit"]');
    btn.disabled = true;
    msg.hidden = false; msg.textContent = "보내는 중입니다…";

    fetch(a.conf.url + "/rest/v1/rpc/make_request", {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json", apikey:a.conf.anonKey },
                             window.amAuthHeaders ? amAuthHeaders() : {}),
      body: JSON.stringify({ p: {
        name: f.name.value, tel: f.tel.value, email: f.email.value,
        region: f.region.value, want_at: f.want_at.value, body: f.body.value,
        budget_min: num(f.budget_min.value), budget_max: num(f.budget_max.value),
        services: picked.map(function(i){ return i.value; }),
        cat: cat, idem: IDEM,
        /* ⚠️ 동의 시각은 **누른 그 순간**입니다 */
        agree_at: new Date().toISOString()
      }})
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    }).then(function(no){
      var n = String(no).replace(/^"|"$/g, "");
      /* ⚠️⚠️ **지킬 수 없는 약속을 하지 않습니다.** 지금 업체가 0곳이면
         제안이 오지 않습니다 — 그 사실을 그대로 말합니다. */
      var none = !(window.amProviders && window.amProviders().length);
      box.className = "";
      box.innerHTML = '<div class="none"><h2>요청을 받았습니다.</h2>' +
        '<p>요청번호 <b>' + esc(n) + '</b> 입니다. 이 번호와 연락처로 진행 상황을 확인하실 수 있습니다.</p>' +
        (none
          ? '<p><b>다만 아직 입점한 업체가 없어 제안이 바로 오지는 않습니다.</b> ' +
            '업체가 들어오는 대로 적어 주신 조건에 맞춰 연결해 드리겠습니다.</p>'
          : '<p>조건에 맞는 업체에 전달했습니다. 업체가 제안을 보내면 알려 드립니다.</p>') +
        '<a class="btn btn-line" href="/categories">카테고리 둘러보기</a></div>';
      /* ⚠️⚠️ **사진은 접수한 뒤에 올립니다** (2차 지시서 §5-4 · 0011).
         접수 전에 올리게 하면 아무나 올리는 길이 하나 생깁니다 —
         요청번호와 연락처가 맞아야 자리를 받습니다.
         ⚠️ 버킷이 설정되기 전에는 이 칸이 **아예 안 나옵니다**
         (단추도 · "준비 중" 도 없습니다 — 절대 규칙 2 · 5). */
      if(window.amPhotoAfter) window.amPhotoAfter(box.querySelector(".none"), n, f.tel.value);
      try{ box.scrollIntoView({ behavior:"smooth", block:"center" }); }catch(_){}
    }).catch(function(err){
      btn.disabled = false;
      msg.textContent = String(err && err.message || "보내지 못했습니다.");
    });
  }

  amAuthAsk().then(function(a){
    if(!a.on || !a.conf || !a.conf.url || !a.conf.anonKey){
      try{ console.warn("[match] Supabase 설정이 없어 요청 양식을 열지 않았습니다 — " +
        "Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY 를 넣고 다시 배포하세요."); }catch(e){}
      return;
    }
    if(!KEEP){
      try{ console.warn("[match] js/data/site.js 의 applyKeep(보유 기간)이 비어 " +
        "양식을 열지 않았습니다 — 개인정보보호법 제15조 제2항."); }catch(e){}
      return;
    }
    box.className = "jbox";
    box.innerHTML = form();
    document.getElementById("mf").addEventListener("submit", submit);
  });
})();

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

  /* ⚠️⚠️ **업체 화면에서 오셨는가** (0035 · `/match?pv=<id>`).
     ⚠️ 주소의 글자는 **손님이 고칠 수 있는 값**입니다 — 그대로 믿지
     않습니다. 우리가 아는 업체일 때만 씁니다 (DB 도 다시 봅니다).
     ⚠️⚠️ 화면이 보내는 열쇠(`pv`)와 읽는 쪽이 다르면 **아무것도 안
     걸렀는데 통과**합니다 — 지난번 `?m=apple` 과 같은 자리라
     `tools/test-match.js` 가 보내는 꾸러미까지 뜯어 봅니다. */
  var WANT = (function(){
    try{
      var v = new URLSearchParams(location.search).get("pv");
      if(!v) return null;
      return (window.amProvider && window.amProvider(v)) || null;
    }catch(e){ return null; }
  })();
  /* ⚠️⚠️ **분류 화면에서 넘어오신 길** (지시서 §6). /cat/<key> 의
     "이 분류 매칭 요청하기" 가 `?cat=<key>` 로 보냅니다. 그 분류의
     하위를 미리 펼쳐 두고, **더 하실 말씀** 칸의 길잡이도 그 분류의
     것으로 바꿉니다.
     ⚠️ 보내는 열쇠와 읽는 열쇠가 다르면 아무 일도 안 일어나는데
     **에러도 안 납니다** (지난번 ?m=apple 자리입니다) — 그래서
     tools/test-match.js 가 눌러서 봅니다.
     ⚠️ 잠그지 않습니다 — 손님이 다른 분류도 같이 고르실 수 있어야 합니다. */
  var FROMCAT = (function(){
    try{
      var v = new URLSearchParams(location.search).get("cat");
      if(!v) return null;
      return (window.amCat && window.amCat(v)) || null;
    }catch(e){ return null; }
  })();

  /* ⚠️ 화면을 연 동안 하나 — 다시 열면 새로 만듭니다 */
  var IDEM = (function(){
    try{
      if(window.crypto && crypto.randomUUID) return "m-" + crypto.randomUUID();
    }catch(e){}
    return "m-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
  })();

  function services(){
    /* ⚠️ 업체 화면에서 오셨으면 **그 업체가 하는 것**을 미리 골라
       둡니다. ⚠️⚠️ 잠그지는 않습니다 — 손님이 다른 것도 같이 요청하실
       수 있어야 합니다 (고를 수 없는 칸은 고장처럼 보입니다). */
    var pre = WANT && window.amProviderSubs ? window.amProviderSubs(WANT) : [];
    var cats = (window.amCatsForProvider ? window.amCatsForProvider() : []).slice();
    /* ⚠️⚠️ 분류 화면에서 오셨으면 **그 분류를 맨 앞으로** 올립니다
       (지시서 §1 — 세 번 안에 닿게). 하위를 미리 골라 두지는
       **않습니다** — 무엇을 원하시는지는 손님이 고르십니다. 미리 다
       골라 두면 안 원하시는 것까지 업체에 넘어갑니다.
       ⚠️ 빼지 않고 **차례만** 바꿉니다 — 다른 분류도 같이 고르실 수
       있어야 합니다. */
    if(FROMCAT){
      cats.sort(function(a, b){
        return (b.key === FROMCAT.key ? 1 : 0) - (a.key === FROMCAT.key ? 1 : 0);
      });
    }
    return cats.map(function(c){
      var first = FROMCAT && c.key === FROMCAT.key;
      return '<fieldset class="svc' + (first ? " svc-on" : "") + '"><legend>' +
        esc(c.name) + (first ? ' <span class="svc-tag">여기서 오셨습니다</span>' : "") +
        '</legend>' +
        window.amCatItemsForProvider(c).map(function(it){
          return '<label class="chk"><input type="checkbox" name="svc" value="' +
            esc(it.key) + '" data-cat="' + esc(c.key) + '"' +
            (pre.indexOf(it.key) >= 0 ? " checked" : "") + '><span>' +
            esc(it.name) + '</span></label>';
        }).join("") + '</fieldset>';
    }).join("");
  }

  /* ⚠️⚠️⚠️ **"이 업체로 바로 간다" 고 말하지 않습니다.** 배정은 운영자가
     하고, 넘기는 순간 상호를 알리고 동의를 다시 받습니다 (제17조 제2항). */
  function wantNote(){
    if(!WANT) return "";
    return '<div class="jrow jrow-full"><div class="want">' +
      '<b>' + esc(WANT.name) + '</b> 을(를) 보고 오셨습니다.' +
      '<p>운영자가 조건을 확인한 뒤 이 업체에 전달합니다. ' +
      '전달하기 전에 <b>다시 여쭙습니다</b> — ' +
      '바로 이 업체로 간다는 약속은 아닙니다.</p></div></div>';
  }

  /* ⚠️⚠️⚠️ **분류마다 필수가 다릅니다** (지시서 §3). 판단은
     `amAskReq()` **한 곳**이고, 분류 화면이 별표를 찍는 자리와 **같은
     줄**을 읽습니다 — 두 곳에 적으면 "필수라고 적어 놓고 안 받는" 꼴이
     됩니다.
     ⚠️ `?cat=` 없이 들어오셨으면 **아무것도 더 안 걸립니다** (어느
     분류인지 모르는데 필수를 걸면 손님이 양식을 못 보냅니다).
     ⚠️⚠️ 이것은 **화면의 규칙이고 DB 가 막는 것이 아닙니다** —
     `make_request` 는 분류마다 다른 규칙을 모릅니다 (알게 하려면 키
     예순둘을 SQL 에 박아야 합니다). 못 막는 것을 막는다고 적지
     않습니다. */
  function reqOf(){
    return (FROMCAT && window.amAskReq) ? window.amAskReq(FROMCAT) : {};
  }
  /* 별표 — ⚠️ 필수일 때만 찍습니다 (아무 데나 찍으면 뜻이 없습니다) */
  function star(on){ return on ? ' <b>*</b>' : ''; }

  function form(){
    var R = reqOf();
    return '<form id="mf" class="jform">' +
      wantNote() +
      '<div class="jrow jrow-full">' +
        '<label>원하는 서비스 <b>*</b></label>' +
        '<div class="svcs">' + services() + '</div>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="m-region">지역' + star(R.region) + '</label>' +
        '<select id="m-region" name="region"' + (R.region ? ' required' : '') + '>' +
          '<option value="">' + (R.region ? '고르세요' : '고르지 않음') + '</option>' +
          (window.AM_REGIONS || []).map(function(r){
            return '<option value="' + esc(r.name) + '">' + esc(r.full) + '</option>';
          }).join("") +
        '</select>' +
        /* ⚠️ 왜 필요한지 **그 자리에서** 말합니다 — 까닭 없이 별표만
           찍으면 손님은 귀찮은 칸으로만 읽습니다. */
        (R.region ? '<span class="jhint">맞는 지역의 업체를 찾아야 하므로 ' +
                    '꼭 골라 주셔야 합니다.</span>' : '') +
      '</div>' +
      '<div class="jrow">' +
        '<label for="m-want">희망 일정' + star(R.want) + '</label>' +
        '<input id="m-want" name="want_at" maxlength="40" ' +
        (R.want ? 'required ' : '') + 'placeholder="예: 이번 달 안에">' +
        (R.want ? '<span class="jhint">날짜가 없으면 업체가 견적을 낼 수 ' +
                  '없습니다. 대략이라도 적어 주세요.</span>' : '') +
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
        '<label for="m-body">' + (R.body ? '요청 내용' : '더 하실 말씀') +
          star(R.body) + '</label>' +
        /* ⚠️⚠️ **길잡이가 분류마다 바뀝니다** (지시서 §6). 분류 화면이
           "이것을 여쭙습니다" 라고 적어 놓고 이 칸이 같은 말을 안 하면
           적어 놓고 **안 여쭙는** 꼴입니다. 말은 AM_ASK 한 곳에서
           옵니다 (js/data/catalog.js). */
        /* ⚠️ 필수일 때는 **다섯 글자 이상**을 받습니다 — required 만
           걸면 빈칸 하나로도 지나갑니다. */
        '<textarea id="m-body" name="body" rows="4" maxlength="2000" ' +
        (R.body ? 'required minlength="5" ' : '') +
        'placeholder="' + esc(
          (FROMCAT && window.amAskBody && window.amAskBody(FROMCAT)) ||
          "구력 · 원하시는 조건 · 궁금한 점을 적어 주세요."
        ) + '"></textarea>' +
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
        /* ⚠️ 바라시는 업체 — **배정이 아니라 바람**입니다 (0035).
           DB 가 읽는 이름과 글자까지 같아야 합니다 (wantProvider). */
        wantProvider: WANT ? WANT.id : null,
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

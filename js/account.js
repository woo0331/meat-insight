/* ════════════════════════════════════════════════════════════════════
   로그인 · 내 정보 · 관리자 — 화면 쪽

   ⚠️⚠️ **로그인이 설정되기 전에는 단추를 내지 않습니다.** /api/session
   이 auth:false 면 "준비 중" 자리만 두고 **누를 것은 하나도** 안
   그립니다 (절대 규칙 5 — 눌러도 아무 일이 안 나는 단추 금지).

   ⚠️⚠️ **역할(role)과 능력(hats)을 한 칸에 담지 않습니다.**
     role  권한 — 플랫폼이 정합니다. 화면에서 못 바꿉니다.
     hats  능력 — 판매자 · 프로는 본인이 켭니다. 사업자는 승인으로만.
   섞으면 "프로로 등록" 이 권한을 올리는 길처럼 보이게 됩니다.

   ⚠️ 여기서 쓰는 말은 **한 곳**에 둡니다 (HAT_NAME). 화면마다 따로
   적으면 한쪽만 고쳐서 조용히 어긋납니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var HAT_NAME = {
    seller: { t:"개인 판매자", d:"중고 골프장터에 내 물건을 올립니다.", own:true },
    pro:    { t:"골프 프로",   d:"레슨 상품과 일정을 올립니다.",        own:true },
    biz:    { t:"사업자 회원", d:"업체 정보와 손님 문의를 관리합니다.",  own:false }
  };
  var ROLE_NAME = { customer:"일반 회원", provider:"업체", staff:"운영자", admin:"관리자" };

  function el(id){ return document.getElementById(id); }
  function say(node, html){ if(node){ node.hidden = false; node.innerHTML = html; } }

  /* 로그인이 꺼져 있을 때 — 손님에게는 "아직" 까지만.
     ⚠️ 무엇을 설정해야 하는지는 운영자에게만 말합니다 (절대 규칙 3). */
  function offNote(what){
    try{ console.warn("[account] 로그인이 설정되지 않았습니다 — Vercel 의 " +
      "SUPABASE_URL · SUPABASE_ANON_KEY 를 넣고 다시 배포하세요."); }catch(e){}
    /* ⚠️⚠️ 조사를 글자로 박지 않습니다. "내 정보은" · "관리자은" 으로
       나갔습니다 — 받침에 따라 갈립니다 (js/data/korean.js 의 koWith). */
    return "<h2>" + esc(window.koWith(what, "은는")) + " 아직 열지 않았습니다.</h2>" +
      "<p>문을 열기 전이라 로그인을 받지 않습니다. 준비가 끝나기 전에는 " +
      "양식을 열지 않습니다 — 다 적으신 뒤에 실패하는 일이 없도록.</p>" +
      '<a class="btn btn-line" href="/categories">카테고리 둘러보기</a>';
  }

  /* Supabase 문(RPC) 부르기 — ⚠️ 공개 키만 씁니다. service key 는
     화면에 내려오지 않습니다 (api/_auth.js 머리말). */
  function rpc(name, args){
    var a = window.amAuthNow ? amAuthNow() : null;
    if(!a || !a.conf) return Promise.reject(new Error("설정 없음"));
    return fetch(a.conf.url + "/rest/v1/rpc/" + name, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey: a.conf.anonKey }, amAuthHeaders()),
      body: JSON.stringify(args || {})
    }).then(function(r){
      if(!r.ok) return r.text().then(function(t){ throw new Error(t || ("HTTP " + r.status)); });
      return r.json();
    });
  }

  /* ── 소셜 로그인 단추 셋 ───────────────────────────────────────
     ⚠️⚠️ 모양도 · 색도 · 마크도 **js/data/social.js 한 곳**에서 옵니다
     — 여기서 또 정하면 한쪽만 고치는 날 두 곳이 다른 단추를 냅니다.

     ⚠️⚠️⚠️ **셋을 늘 그립니다 — 켜진 것만 그리던 것을 2026-11-10 에
     뒤집었습니다.** 처음에는 안 켜진 공급자를 **아예 안 그렸습니다**
     (눌러도 아무 일이 안 나는 단추를 만들지 않는다 · 절대 규칙 5).
     그런데 운영에서 셋 다 안 켜져 있으니 손님에게도 · 사장님에게도
     **화면이 통째로 비어** 보였고, "만들었다는 것이 어디 있나" 를
     알 길이 없었습니다. 지금은 셋을 늘 그리되 **안 켜진 것은 눌리지
     않게**(`disabled`) 두고 **그 자리에서 준비 중이라고 말합니다** —
     절대 규칙 5 가 막는 것은 "눌렀는데 **말없이** 아무 일도 안 나는"
     칸이지, 제 상태를 밝히고 서 있는 칸이 아닙니다.
     ⚠️ `disabled` 라 브라우저가 눌림을 아예 안 보냅니다 — 오류가 날
     자리가 없습니다.
     ⚠️ 모르는 키는 **건너뜁니다** (빈 단추를 지어내지 않습니다).
     ⚠️ 하나도 못 그리면 **빈 글자**를 돌려줍니다 — 부르는 쪽이 그때
     머리말만 남는 상자를 안 엽니다. */
  function ssoHtml(on){
    var ready = {}, rows = "", n = 0, off = 0;
    (on || []).forEach(function(k){ ready[k] = true; });
    (window.AM_SOCIAL || []).forEach(function(s){
      if(!s || !s.key) return;
      n++;
      var ok = !!ready[s.key];
      if(!ok) off++;
      rows += '<button type="button" class="sso-b' + (ok ? "" : " sso-off") +
        '" data-sso="' + esc(s.key) + '" data-on="' + (ok ? "1" : "0") + '"' +
        (ok ? "" : ' disabled aria-disabled="true"') +
        ' style="background:' + esc(s.bg) + ';color:' + esc(s.fg) +
        ';border-color:' + esc(s.line) + '">' +
        s.mark + '<span class="sso-t">' + esc(s.name) + '</span>' +
        (ok ? "" : '<span class="sso-badge">준비 중</span>') + '</button>';
    });
    if(!n) return "";
    /* ⚠️⚠️ 무엇을 설정해야 하는지는 **손님에게 안 적습니다**(절대 규칙 3) —
       운영자에게는 아래 paintLogin 이 console.warn 으로 말합니다. */
    return '<h2 class="sso-h">간편 로그인</h2>' + rows +
      (off ? '<p class="sso-note">「준비 중」 으로 보이는 것은 아직 연결 전입니다. ' +
             '아래 메일 링크로는 지금 바로 들어오실 수 있습니다.</p>' : "");
  }

  /* ⚠️⚠️ 눌림은 **감싼 자리 한 곳**에서 받습니다 — 단추마다 달면
     공급자가 늘어나는 날 빠뜨리는 자리가 생깁니다.
     ⚠️ 떠나는 사이에 두 번 눌리면 상태가 두 번 만들어집니다 — 눌린
     **그 단추만** 잠급니다. 못 떠나면 **다시 풀어** 둡니다(잠긴 채로
     두면 눌러도 아무 일이 안 나는 칸이 됩니다 · 절대 규칙 5). */
  var SSO_BOUND = false;
  function onSso(e){
    var t = e.target, b = null;
    while(t && t !== document){
      if(t.getAttribute && t.getAttribute("data-sso")){ b = t; break; }
      t = t.parentNode;
    }
    if(!b) return;
    e.preventDefault();
    /* ⚠️⚠️ 아직 연결 전인 단추는 **아무 데도 안 보냅니다.** `disabled` 라
       브라우저가 눌림을 보내지도 않지만, 거품으로 올라오는 길이 하나라도
       있으면 그때 Supabase 가 "Unsupported provider" 로 거절합니다 —
       여기서 끊어 **오류가 날 자리를 없앱니다.** */
    if(b.getAttribute("data-on") !== "1") return;
    b.disabled = true;
    if(!(window.amAuthGo && window.amAuthGo(b.getAttribute("data-sso"))))
      b.disabled = false;
  }

  /* ── /login ──────────────────────────────────────────────────── */
  function paintLogin(a){
    var box = el("loginbox"); if(!box) return;
    if(!a.on) return say(box, offNote("로그인"));
    /* ⚠️ 보시던 자리를 달고 오셨으면 그리로 돌려 보냅니다.
       ⚠️⚠️ 값은 window.amNextPath() 가 **걸러서** 줍니다 — 남이 적어 준
       바깥 주소로 튕겨 나가지 않습니다 (열린 전달). */
    var next = window.amNextPath();
    if(a.signedIn){
      /* 이미 들어와 계시면 **바로** 보시던 자리로 — 한 번 더 누르게
         하지 않습니다 (지시서 §3-3 "로그인 후 원래 페이지로 복귀"). */
      if(next){
        try{ window.location.replace(next); return; }catch(e){}
      }
      return say(box,
        "<h2>이미 로그인하셨습니다.</h2>" +
        "<p>" + esc(a.name || "회원") + "님 — " + esc(ROLE_NAME[a.role] || a.role) + "</p>" +
        '<a class="btn btn-pri" href="/my">내 정보로 가기</a>');
    }
    say(box,
      /* ⚠️⚠️⚠️ 소셜 단추를 **여기서 미리 그리지 않습니다** — 어느 것이
         실제로 켜져 있는지는 Supabase 만 알고 그 답은 조금 뒤에 옵니다.
         미리 그리면 안 켜진 단추가 한 번 보였다 사라집니다. 자리만
         두고 `hidden` 으로 내보냅니다.
         ⚠️ 그래서 빌드가 찍은 HTML 에는 이 자리가 **빈 채로** 있습니다 —
         `check-screens` 가 이 상자를 영원히 못 보는 까닭이고, 재는
         자리는 `test-desk` 입니다. */
      '<div id="ssobox" class="sso" hidden></div>' +
      '<div id="ssoor" class="sso-or" hidden><span>또는</span></div>' +
      "<h2>메일로 받은 링크로도 들어오실 수 있습니다.</h2>" +
      "<p>비밀번호를 받지 않습니다. 적으신 주소로 한 번 쓰는 링크를 보내 드립니다." +
      /* ⚠️ 어디로 돌아오는지 **미리 말합니다** — 메일을 열고 한참 뒤에
         눌러도 어디로 가는지 알고 계시게 합니다. */
      (next ? " 링크를 누르시면 <b>보시던 화면(" + esc(next) + ")</b>으로 돌아옵니다." : "") +
      "</p>" +
      '<form id="lf" class="lform"><label class="sr" for="le">이메일</label>' +
      '<input id="le" type="email" name="email" required autocomplete="email" ' +
      'placeholder="메일 주소"><button class="btn btn-pri" type="submit">링크 받기</button>' +
      '</form><p id="lmsg" class="lmsg" hidden></p>');

    /* ⚠️⚠️⚠️ **무엇이 켜졌는지는 Supabase 에게 물어봅니다**
       (`amAuthProviders()`) — 목록을 화면에 박아 두면 켜시는 날 두 곳이
       어긋나고, 안 켠 것이 **눌릴 수 있는 단추**로 그려집니다. 켜시면
       코드를 안 고쳐도 그날 저절로 눌립니다.
       ⚠️ 못 읽었거나 0건이면 셋 다 **「준비 중」** 으로 섭니다 — 눌리지
       않고(`disabled`) 그 자리에서 연결 전이라고 말합니다. 메일 링크는
       그때도 그대로 열립니다. */
    if(window.amAuthProviders) window.amAuthProviders().then(function(list){
      var sb = el("ssobox"), so = el("ssoor"), h = ssoHtml(list);
      /* ⚠️ 무엇이 안 켜졌는지는 **운영자에게만** 말합니다 (절대 규칙 3) */
      try{
        var offK = (window.AM_SOCIAL || []).map(function(s){ return s.key; })
          .filter(function(k){ return (list || []).indexOf(k) < 0; });
        if(offK.length) console.warn("[account] 아직 연결 전인 소셜 로그인: " +
          offK.join(" · ") + " — Supabase → Authentication → Providers 에서 " +
          "켜시면 코드를 안 고쳐도 바로 켜집니다.");
      }catch(e){}
      if(!sb || !h) return;
      sb.innerHTML = h;
      sb.hidden = false;
      if(so) so.hidden = false;
      if(!SSO_BOUND){ SSO_BOUND = true; sb.addEventListener("click", onSso); }
    }).catch(function(){});

    el("lf").addEventListener("submit", function(e){
      e.preventDefault();
      var m = el("lmsg"), v = (el("le").value || "").trim();
      if(!v) return;
      m.hidden = false; m.textContent = "보내는 중입니다…";
      /* ⚠️⚠️ "보냈습니다" 는 **실제로 보낸 뒤에만** 말합니다. */
      amAuthSend(v).then(function(r){
        m.textContent = r && r.ok
          ? "보냈습니다. 메일함에서 링크를 눌러 주세요."
          : "보내지 못했습니다. 주소를 다시 보시거나 잠시 뒤에 해 보세요.";
      }).catch(function(){
        m.textContent = "보내지 못했습니다. 잠시 뒤에 해 보세요.";
      });
    });
  }

  /* ── /my ─────────────────────────────────────────────────────── */
  function hatRow(key, on, busy){
    var h = HAT_NAME[key];
    return '<div class="hat' + (on ? " hat-on" : "") + '">' +
      '<div><h3>' + esc(h.t) + (on ? " · 켜짐" : "") + '</h3>' +
      '<p>' + esc(h.d) + '</p></div>' +
      (h.own
        ? '<button class="btn btn-sm ' + (on ? "btn-line" : "btn-pri") + '" ' +
          'data-hat="' + esc(key) + '" data-on="' + (on ? "1" : "0") + '"' +
          (busy ? " disabled" : "") + '>' + (on ? "끄기" : "켜기") + '</button>'
        /* ⚠️ 사업자는 본인이 못 켭니다 — 단추를 아예 안 그립니다 */
        : '<span class="hat-note">' + (on ? "승인되었습니다" : "입점 신청이 승인되면 켜집니다") + '</span>') +
    '</div>';
  }

  function paintMy(a){
    var box = el("mybox"); if(!box) return;
    if(!a.on)       return say(box, offNote("내 정보"));
    if(!a.signedIn) return say(box,
      "<h2>로그인하시면 내 정보가 보입니다.</h2>" +
      "<p>메일로 받은 링크 한 번이면 됩니다. 로그인하시면 <b>이 화면으로 바로</b> 돌아옵니다.</p>" +
      '<a class="btn btn-pri" href="' + esc(window.amLoginUrl()) + '">로그인하기</a>');

    var hats = a.hats || [];
    box.hidden = false;
    box.className = "mybox";
    box.innerHTML =
      '<div class="mycard"><h2>' + esc(a.name || "회원") + '님</h2>' +
      '<p class="myrole">권한 — ' + esc(ROLE_NAME[a.role] || a.role) + '</p>' +
      '<p class="myhint">권한은 플랫폼이 정합니다. 아래 <b>하는 일</b>은 직접 켜고 끄실 수 있습니다.</p>' +
      /* ⚠️⚠️ **업체 회원에게만** 작업실 길을 냅니다. 모두에게 내면
         누르는 사람 대부분이 "업체만 볼 수 있습니다" 를 보게 됩니다 —
         눌러도 아무 일이 안 나는 단추와 같은 것입니다 (절대 규칙 5).
         ⚠️ 역할이 provider 라도 업체가 안 이어져 있으면 안 냅니다. */
      (a.role === "provider" && a.provider
        ? '<a class="btn btn-pri mycard-b" href="/desk">업체 작업실로 가기</a>'
        : "") +
      '</div>' +
      '<div class="hats">' + Object.keys(HAT_NAME).map(function(k){
        return hatRow(k, hats.indexOf(k) >= 0, false);
      }).join("") + '</div>' +
      '<p id="mymsg" class="lmsg" hidden></p>';

    box.addEventListener("click", function(e){
      var b = e.target.closest ? e.target.closest("button[data-hat]") : null;
      if(!b) return;
      var key = b.getAttribute("data-hat"), on = b.getAttribute("data-on") === "1";
      var m = el("mymsg");
      b.disabled = true; m.hidden = false; m.textContent = "바꾸는 중입니다…";
      rpc(on ? "drop_my_hat" : "add_my_hat", { p_hat: key })
        .then(function(){ return amAuthAsk(true); })
        .then(function(a2){ m.hidden = true; paintMy(a2); })
        .catch(function(err){
          b.disabled = false;
          /* ⚠️ DB 가 돌려준 말을 그대로 보여 줍니다 — 자물쇠마다 다른
             말로 거절하게 해 두었습니다 (0025). 손님이 무엇이 막혔는지
             알 수 있어야 합니다. */
          var why = String(err && err.message || "");
          try{ why = JSON.parse(why).message || why; }catch(_){}
          m.textContent = why || "바꾸지 못했습니다.";
        });
    });
  }

  /* ── /admin ──────────────────────────────────────────────────── */
  function paintAdmin(a){
    var box = el("adminbox"); if(!box) return;
    if(!a.on)       return say(box, offNote("관리자"));
    if(!a.signedIn) return say(box,
      "<h2>로그인이 필요합니다.</h2>" +
      '<a class="btn btn-pri" href="' + esc(window.amLoginUrl()) + '">로그인하기</a>');
    if(a.role !== "admin" && a.role !== "staff")
      /* ⚠️ 왜 안 되는지 자세히 적지 않습니다 — 권한 구조를 알려 주는
         글이 됩니다. 손님에게는 여기까지. */
      return say(box, "<h2>이 화면은 운영자만 볼 수 있습니다.</h2>" +
        '<a class="btn btn-line" href="/">홈으로</a>');

    box.hidden = false; box.className = "adminbox";
    box.innerHTML = '<p class="lmsg">세는 중입니다…</p>';

    /* ⚠️⚠️ 세는 것은 **DB 가** 합니다. 화면이 목록을 받아 길이를 세면
       RLS 가 가린 줄까지 "없는 것" 으로 읽습니다. */
    var cnt = a.conf;
    function count(tbl){
      return fetch(cnt.url + "/rest/v1/" + tbl + "?select=id", {
        headers: Object.assign({ apikey: cnt.anonKey, prefer:"count=exact",
                                 range:"0-0" }, amAuthHeaders())
      }).then(function(r){
        var cr = r.headers.get("content-range") || "";
        var n = cr.split("/")[1];
        return n === "*" || n == null ? null : Number(n);
      }).catch(function(){ return null; });
    }
    var want = [["회원","account"],["입점 신청","provider_apply"],
                ["상담 신청","request"],["배정","assignment"],["계약","deal"],
                ["광고 집행","ad_run"],["멤버십 요금제","membership_plan"]];
    /* ⚠️⚠️ **업체는 PostgREST 로 세지 않습니다.** 운영자에게는 검사용
       업체도 보이므로(0030 의 정책), 그냥 세면 **검사용이 섞인 값**을
       "업체 수" 로 찍습니다 — 그 화면부터 이미 틀린 숫자이고, 2차
       지시서 §8 이 갈라 놓으라고 한 자리입니다. 세는 규칙은 DB 의
       `provider_counts()` 한 곳에 있습니다. */
    Promise.all([rpc("provider_counts").catch(function(){ return null; })]
      .concat(want.map(function(w){ return count(w[1]); }))).then(function(all){
      var pc = all[0], ns = all.slice(1);
      /* ⚠️ 검사용이 0곳이면 그 칸을 **아예 안 냅니다** — 0 을 늘 보여
         주면 운영자가 그 줄을 안 읽게 됩니다. */
      var pvCells =
        '<div class="cnt"><dt>업체</dt><dd>' +
        (pc && typeof pc.real === "number" ? won(pc.real) + "곳" : "못 읽음") +
        '</dd></div>' +
        (pc && pc.test
          ? '<div class="cnt cnt-t"><dt>그중 검사용</dt><dd>' +
            won(pc.test) + '곳</dd></div>'
          : "");
      /* ⚠️⚠️ **esc() 를 이 문장 안에 둡니다.** 다른 함수로 빼면
         tools/check-safe.js 가 "innerHTML 에 esc() 없이 변수를 넣는
         줄" 로 잡습니다 — 그 검사가 맞습니다. 손님 · 운영자 글이 지나는
         자리는 esc() 가 **보이는 데** 있어야 합니다. */
      box.innerHTML = '<div class="cnts">' + pvCells + want.map(function(w, i){
        var n = ns[i];
        /* ⚠️ 못 읽은 것과 0건은 **다릅니다.** 0 으로 보이면 멀쩡한 줄이
           사라진 것처럼 읽힙니다 (0 을 기다리는 자리에 || 금지). */
        return '<div class="cnt"><dt>' + esc(w[0]) + '</dt><dd>' +
          (n === null ? "못 읽음" : won(n) + "건") + '</dd></div>';
      }).join("") + '</div>' +
      '<p class="myhint">수수료 · 광고 · 멤버십 요금은 모두 감사 기록에 남습니다. ' +
      '지금은 정해진 요금제가 없어 요금제 수가 0 입니다 — 지어낸 값이 아닙니다.</p>' +
      '<div id="applies"></div>';
      applies(a);
    });
  }

  /* ── 입점 신청 목록 (지시서 7번) ───────────────────────────────
     ⚠️⚠️ **성함 · 연락처가 나오는 화면입니다.** 운영자만 봅니다 (RLS 가
     막고, 여기서도 역할을 다시 봅니다). 화면에 찍기 전에 esc() 를
     반드시 거칩니다 — 신청자가 적은 글입니다 (절대 규칙 4).
     ⚠️ 상태를 바꾸는 것은 DB 문(set_apply_state)뿐입니다. 화면이 표를
     직접 고치지 않습니다. */
  var APPLY_STATE = { "new":"새 신청", called:"통화함", done:"등록 완료", drop:"진행 안 함" };

  function applies(a){
    var box = el("applies"); if(!box) return;
    fetch(a.conf.url + "/rest/v1/provider_apply?select=id,no,company,name,tel,region," +
          "services,state,created_at&order=created_at.desc&limit=50", {
      headers: Object.assign({ apikey: a.conf.anonKey }, amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json() : null; }).then(function(rows){
      if(rows === null){
        box.innerHTML = '<p class="lmsg">입점 신청을 읽지 못했습니다.</p>';
        return;
      }
      if(!rows.length){
        /* ⚠️ 0건은 고장이 아닙니다 — 0 이라고 말합니다 */
        box.innerHTML = '<h2 class="adm-h">입점 신청</h2>' +
          '<p class="myhint">아직 들어온 신청이 없습니다.</p>';
        return;
      }
      box.innerHTML = '<h2 class="adm-h">입점 신청 ' + won(rows.length) + '건</h2>' +
        '<div class="apl">' + rows.map(function(x){
          var subs = (x.services || []).map(function(k){
            var f = window.amSub ? amSub(k) : null;
            /* ⚠️ 모르는 키는 키 그대로 보여 줍니다 — 조용히 빠지면
               화면과 DB 가 어긋난 것을 아무도 모릅니다. */
            return f ? f.item.name : k;
          }).join(" · ");
          return '<div class="apl-r" data-id="' + esc(x.id) + '">' +
            '<div class="apl-m"><b>' + esc(x.company) + '</b>' +
            '<span class="apl-no">' + esc(x.no) + '</span>' +
            '<span class="apl-st apl-' + esc(x.state) + '">' +
            esc(APPLY_STATE[x.state] || x.state) + '</span></div>' +
            '<p class="apl-d">' + esc(x.name) + ' · ' + esc(x.tel) +
            (x.region ? ' · ' + esc(x.region) : '') + '</p>' +
            (subs ? '<p class="apl-s">' + esc(subs) + '</p>' : '') +
            '<div class="apl-b">' +
              '<button class="btn btn-sm btn-line" data-to="called">통화함</button>' +
              '<button class="btn btn-sm btn-line" data-to="drop">진행 안 함</button>' +
            '</div></div>';
        }).join("") + '</div>' +
        '<p class="myhint">등록 완료로 두려면 업체를 먼저 만들고 계정을 이어야 합니다 — ' +
        'db/README.md 의 차례대로 SQL 로 하십니다. 화면에서 업체를 만들 수 없습니다.</p>' +
        '<p id="aplmsg" class="lmsg" hidden></p>';

      box.addEventListener("click", function(e){
        var b = e.target.closest ? e.target.closest("button[data-to]") : null;
        if(!b) return;
        var row = b.closest(".apl-r"), to = b.getAttribute("data-to");
        var why = prompt(to === "drop" ? "진행하지 않는 까닭을 적어 주세요 (감사 기록에 남습니다)"
                                       : "통화 결과를 적어 주세요 (안 적으셔도 됩니다)");
        /* ⚠️ 취소를 누르면 null 입니다 — 빈 글자와 다릅니다. */
        if(to === "drop" && !(why && why.trim())) return;
        if(why === null && to === "drop") return;
        var m = el("aplmsg"); m.hidden = false; m.textContent = "바꾸는 중입니다…";
        rpc("set_apply_state", { p_apply: row.getAttribute("data-id"), p_to: to,
                                 p_why: why || null })
          .then(function(){ m.hidden = true; applies(a); })
          .catch(function(err){
            var w = String(err && err.message || "");
            try{ w = JSON.parse(w).message || w; }catch(_){}
            m.textContent = w || "바꾸지 못했습니다.";
          });
      });
    }).catch(function(){
      box.innerHTML = '<p class="lmsg">입점 신청을 읽지 못했습니다.</p>';
    });
  }

  /* ⚠️⚠️ **머리말 자리는 여기서 안 그립니다.** 모든 화면에 실리는
     `js/hdauth.js` 한 곳에서 그립니다 — 두 곳에 적으면 한쪽만 고쳐서
     조용히 달라지고, 이 파일이 실린 화면에서는 칸이 **둘**이 됩니다. */

  if(!window.amAuthAsk) return;
  amAuthAsk().then(function(a){
    paintLogin(a); paintMy(a); paintAdmin(a);
  });
})();

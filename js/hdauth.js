/* ════════════════════════════════════════════════════════════════════
   머리말의 **로그인 자리** — 모든 화면에 실립니다 (UX 검수 §8)

   ⚠️⚠️⚠️ **전에는 `/login` 과 `/my` 가 아무 데서도 안 이어져
   있었습니다.** 매칭 요청을 넣은 손님이 받은 견적을 보러 갈 길이
   **주소를 직접 치는 것뿐**이었습니다 — 화면도 문도 멀쩡한데 손님이
   거기까지 갈 수가 없었습니다 ("만들어 놓고 안 쓰는 칸" 의 화면 판).
   그리는 함수는 `js/account.js` 안에 이미 있었는데, 그 파일이
   /login · /my · /admin **세 장에만** 실려 있었습니다.

   ⚠️⚠️ **그래서 이 파일 하나로 뺐습니다.** 머리말 모양을 두 곳에
   적으면 한쪽만 고쳐서 조용히 달라집니다 — 그리는 곳은 여기 하나이고,
   `account.js` 는 제 화면(상자)만 그립니다.

   ⚠️⚠️ **로그인이 설정되기 전에는 아무것도 안 그립니다** (`auth:false`).
   눌러도 아무 일이 안 나는 단추를 만들지 않습니다 (절대 규칙 5) —
   문 여는 날 환경변수가 들어가면 **저절로** 나타납니다.

   ⚠️ 역할마다 **갈 곳이 다릅니다** (§8) — 손님은 내 정보, 업체는 작업실,
   운영자는 관리자. 한 칸만 냅니다 (폰에서 둘을 내면 메뉴를 밀어냅니다).
   그 화면들끼리는 서로 가는 길이 안에 있습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  if(!window.amAuthAsk) return;

  /* 역할 → 갈 곳 · 이름 — ⚠️ **한 곳**입니다 */
  var GO = {
    provider: { href:"/desk",  name:"업체 작업실" },
    staff:    { href:"/admin", name:"관리자" },
    admin:    { href:"/admin", name:"관리자" }
  };

  amAuthAsk().then(function(a){
    var slot = document.querySelector(".hd-r");
    /* ⚠️ 꺼져 있으면 한 글자도 안 그립니다 */
    if(!slot || !a || !a.on) return;
    /* ⚠️ 두 번 그리지 않습니다 (스크립트가 두 번 실리는 날) */
    if(slot.querySelector(".hd-auth")) return;

    var go = a.signedIn ? (GO[a.role] || { href:"/my", name:"내 정보" }) : null;
    var wrap = document.createElement("span");
    wrap.className = "hd-auth";
    wrap.innerHTML = go
      ? '<a class="hd-lk" href="' + go.href + '">' + window.icon("user", 20) +
        '<span class="lbl">' + window.esc(a.name || go.name) + '</span></a>'
      /* ⚠️ 보시던 자리를 달고 갑니다 — 로그인한 뒤 거기로 돌아옵니다.
         주소는 window.amLoginUrl() 한 함수에서만 짓습니다. */
      : '<a class="hd-lk" href="' + window.esc(window.amLoginUrl()) + '">' +
        window.icon("user", 20) +
        /* ⚠️⚠️⚠️ **'로그인 · 회원가입' 한 칸입니다.** 최종 디자인 지시서
           1번은 머리말에 로그인 · 회원가입 **둘**을 적어 두었지만, 이
           저장소에는 **따로 가입하는 자리가 없습니다** — /login 이
           "가입과 로그인이 같습니다. 처음 들어오시면 그대로 회원이
           됩니다" 라고 적고 있고, 메일로 보낸 주소를 누르면 그대로
           계정이 생깁니다. 없는 화면으로 보내는 '회원가입' 단추를
           따로 내면 그건 눌러도 **같은 자리로 가는** 칸입니다
           (절대 규칙 5). 하는 일을 그대로 적습니다. */
        '<span class="lbl">로그인 · 회원가입</span></a>';
    slot.insertBefore(wrap, slot.firstChild);
    welcome(a);
  });

  /* ⚠️⚠️ **첫 가입 뒤 닉네임** (2026-11-15) — 방금 들어오셨고(amAuthTakeHash 가 남긴 표)
     사이트 닉네임을 아직 안 정하셨으면 /my 의 닉네임 자리로 **한 번** 모십니다.
     보시던 화면은 `back` 으로 달고 가서 정한 뒤 돌아가실 수 있게 합니다.
     ⚠️ 못 읽으면 아무 데도 안 보냅니다(보시던 화면 그대로). 표는 **읽기 전에** 지웁니다 —
     두 번 모시지 않습니다. */
  function welcome(a){
    var fresh = false;
    try{ fresh = sessionStorage.getItem("am.fresh") === "1"; }catch(e){}
    if(!fresh) return;
    /* ⚠️ 표는 **답을 받은 뒤** 지웁니다 — 로그인 화면이 보시던 자리로 곧장 넘기는(replace)
       사이에 이 물음이 끊기면, 다음 화면에서 한 번 더 묻게 둡니다. */
    function done(){ try{ sessionStorage.removeItem("am.fresh"); }catch(e){} }
    if(!a.signedIn || !a.conf || !a.conf.url) return done();
    fetch(a.conf.url + "/rest/v1/account?select=nick&limit=1", {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : null; }).then(function(rows){
      done();
      if(!rows || !rows.length || rows[0].nick) return;
      var here = window.location.pathname + window.location.search;
      var back = (window.amSafeNext && window.amSafeNext(here)) || "";
      if(window.location.pathname === "/my" && /[?&]welcome=1/.test(window.location.search)) return;
      window.location.replace("/my?welcome=1" +
        (back && back !== "/my" && back.indexOf("/login") !== 0 ? "&back=" + encodeURIComponent(back) : "") +
        "#nickbox");
    }).catch(done);
  }
})();

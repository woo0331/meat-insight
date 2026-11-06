/* ════════════════════════════════════════════════════════════════════
   공개 닉네임 — /my 에서만 돕니다 (DB 는 0059)

   ⚠️⚠️ **무엇인가.** 게시판(0047 · 0059)에 글 · 댓글을 올리면 글쓴이
   자리에 나가는 이름입니다. 안 정하시면 **성함을 가려서** 냅니다.

   ⚠️⚠️⚠️ **가리는 규칙을 여기 또 적지 않습니다.** 공개 보기
   (`v_cq_public` · `v_ca_public`)가 가립니다 — 화면이 같은 규칙을 한 번
   더 적으면 한쪽만 고치는 날 두 곳이 다른 말을 합니다(0052 에서 동료
   성함을 화면에서 가리려다 멈춘 그 자리). 그래서 "가려서 냅니다" 까지만
   말하고 **별이 몇 개인지는 짓지 않습니다.**

   ⚠️⚠️ **비우는 것도 값입니다** — 비우면 가린 성함으로 돌아갑니다.
   그래서 지우는 단추는 "눌러도 아무 일이 안 나는 칸" 이 아닙니다.
   ⚠️ 정한 적이 없으면 지우는 단추를 **안 냅니다**.

   ⚠️⚠️ **닉네임은 공개됩니다** — 그 사실을 **적는 그 자리에서** 말합니다
   (개인정보보호법 제15조 제2항). 본이름 · 연락처를 닉네임에 적지 말라고
   도 같이 말합니다 (적으면 누구나 보는 자리에 나갑니다).

   ⚠️ 로그인 전에는 **한 글자도 안 그립니다.**
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("nickbox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null, NICK = "", READ = false;

  function get(path){
    return fetch(A.conf.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey:A.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; });
  }
  function call(fn, p){
    return fetch(A.conf.url + "/rest/v1/rpc/" + fn, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json", apikey:A.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {}),
      body: JSON.stringify({ p: p })
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    });
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    /* ⚠️ 못 읽은 것과 "안 정하셨다" 는 다릅니다 — 못 읽었으면 다시
       읽는 길을 냅니다 (막다른 길로 두지 않습니다 · 절대 규칙 2). */
    if(!READ){
      box.innerHTML = '<h2 class="adm-h">' + icon("user", 19) + '공개 닉네임</h2>' +
        '<p class="lmsg">읽지 못했습니다. ' +
        '<button type="button" class="btn btn-sm btn-line" data-nkagain="1">' +
        '다시 읽기</button></p>';
      return;
    }
    box.innerHTML = '<h2 class="adm-h">' + icon("user", 19) + '공개 닉네임</h2>' +
      '<p class="myhint">커뮤니티 게시판에 글 · 댓글을 올리시면 ' +
      '글쓴이 자리에 이 이름이 나갑니다. ' +
      (NICK
        ? '지금은 <b>' + esc(NICK) + '</b>로 나갑니다.'
        : '아직 정하지 않으셨습니다 — 그동안은 <b>성함을 가려서</b> 냅니다.') +
      '</p>' +
      '<form id="nkf" class="jform">' +
        '<div class="jrow">' +
          '<label for="nk">닉네임</label>' +
          '<input id="nk" name="nick" maxlength="16" value="' + esc(NICK) + '" ' +
          'placeholder="두 글자부터 열여섯 글자까지">' +
        '</div>' +
        '<div class="jrow jrow-full"><p class="agree-no">' +
          '⚠️ 이 이름은 <b>누구나 봅니다.</b> 본이름 · 전화번호 · 아이디를 ' +
          '적지 마세요. 이미 쓰고 있는 이름과 운영자로 보일 수 있는 이름' +
          '(운영자 · 관리자 · 골프올인원 …)은 쓸 수 없습니다. ' +
          '부적절한 닉네임은 운영자가 지울 수 있고, 그때는 다시 ' +
          '성함을 가려서 냅니다.' +
        '</p></div>' +
        '<div class="jrow jrow-full">' +
          '<button type="submit" class="btn btn-pt">이 이름으로 하기</button>' +
          /* ⚠️ 정한 적이 없으면 지우는 단추를 안 냅니다 */
          (NICK
            ? '<button type="button" class="btn btn-line" data-nkclear="1">' +
              '닉네임 지우기</button>'
            : '') +
        '</div>' +
        '<p class="nk-m lmsg" hidden></p>' +
      '</form>';
  }

  function say(t){
    var m = box.querySelector(".nk-m");
    if(m){ m.hidden = false; m.textContent = t; }
  }

  function load(){
    /* ⚠️ RLS 가 **제 줄만** 내줍니다 (0001 의 account_self) — 조건을
       적지 않아도 남의 줄은 안 옵니다. */
    return get("account?select=nick&limit=1").then(function(rows){
      if(!rows || !Array.isArray(rows) || !rows.length){ READ = false; return paint(); }
      READ = true;
      NICK = String(rows[0].nick || "");
      paint();
    });
  }

  box.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest || !A) return;
    if(t.closest("button[data-nkagain]")) return void load();
    var c = t.closest("button[data-nkclear]");
    if(!c) return;
    c.disabled = true;
    say("지우는 중입니다…");
    /* ⚠️ 비우는 것도 같은 문입니다 — 빈 글자를 보내면 null 로 둡니다 */
    call("set_my_nick", { nick: "" })
      .then(load)
      .catch(function(err){ c.disabled = false; say(String(err.message || err)); });
  });

  box.addEventListener("submit", function(e){
    var f = e.target.closest ? e.target.closest("form#nkf") : null;
    if(!f || !A) return;
    e.preventDefault();
    var bt = f.querySelector('button[type="submit"]');
    if(bt) bt.disabled = true;
    say("저장하는 중입니다…");
    call("set_my_nick", { nick: f.nick.value })
      .then(load)
      /* ⚠️ DB 가 거절한 **그 말**을 그대로 보여 줍니다 — 자물쇠마다
         다른 말이라 어느 쪽이 막았는지 손님이 알 수 있습니다. */
      .catch(function(err){
        if(bt) bt.disabled = false;
        say(String(err.message || err));
      });
  });

  window.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.signedIn) return;   /* 로그인 전에는 안 그립니다 */
    A = a;
    return load();
  }).catch(function(){});
})();

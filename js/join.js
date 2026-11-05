/* ════════════════════════════════════════════════════════════════════
   골프 조인 — /cat/matchup 에서만 돕니다 (DB 는 0046)

   ⚠️⚠️⚠️ **왜 이 화면이 생겼나.** `/cat/matchup` 은 막다른 길이었습니다 —
   메인에서 "골프 조인" 을 누르면 "아직 열린 조인이 없습니다" 만 보고
   끝이었습니다. 단추도 없고 다른 데로 가는 길도 없었습니다. 열 분류
   가운데 **셋**이 그랬습니다 (조인 · 인력 · 커뮤니티).

   ⚠️⚠️ **목록은 브라우저가 그립니다** — 빌드가 못 찍습니다. 조인은
   회원이 아무 때나 열고 닫는 자리라, 빌드 때 찍으면 배포할 때마다만
   바뀝니다. 그래서 **설명은 빌드가**(크롤러 · 자바스크립트 꺼진 분이
   읽을 몫), **목록은 브라우저가** 그립니다.
   ⚠️ 그 설명 글을 지우면 봇에게는 **빈 화면**이 됩니다.

   ⚠️⚠️ **접수가 안 되면 양식을 열지 않습니다** (절대 규칙 5).
   Supabase 설정이 없으면 다 적고 누른 뒤에 실패합니다 — 그 전에
   막습니다. 빌드가 찍어 둔 글이 그대로 남습니다.

   ⚠️⚠️⚠️ **연락처는 여기서 한 번도 안 보입니다.** 목록이 읽는
   `v_join_open` 에는 연락처 칸이 **아예 없습니다**. 수락된 뒤 서로
   **따로 동의**해야 오가고, 그 자리는 `/my` 입니다 (0046 · 제17조).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var list = document.getElementById("joinlist");
  if(!list || !window.amAuthAsk) return;

  var esc  = window.esc;
  var KEEP = (window.WOW_BIZ || {}).joinKeep || "";
  var REG  = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });

  function rgName(k){ return REG[k] || k; }

  /* 날짜 — ⚠️ 한글 조사를 글자로 박지 않습니다 (받침에 따라 갈립니다) */
  function dayText(iso){
    var d = new Date(iso + "T00:00:00");
    if(isNaN(d.getTime())) return iso;
    var w = ["일","월","화","수","목","금","토"][d.getDay()];
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일 (" + w + ")";
  }

  function card(r){
    var left = Number(r.left_n);
    return '<li class="jnc">' +
      '<div class="jnc-h">' +
        '<h3>' + esc(r.title) + '</h3>' +
        '<span class="jnc-n">' + (left > 0 ? esc(String(left)) + '자리 남음' : '마감') + '</span>' +
      '</div>' +
      '<p class="jnc-m">' + esc(dayText(r.play_at)) + ' · ' + esc(rgName(r.region)) +
        (r.tee ? ' · ' + esc(r.tee) : '') +
        (r.budget != null ? ' · 1인 ' + esc(Number(r.budget).toLocaleString()) + '원' : '') +
      '</p>' +
      /* ⚠️⚠️ 골프장이 적혀 있어도 **부킹이 잡혔다는 뜻이 아닙니다**
         (지시서 §2.A — 부킹 보장 금지). 그 사실을 같이 적습니다. */
      (r.course
        ? '<p class="jnc-c">' + esc(r.course) +
          (r.booked ? '' : ' <span class="jnc-w">부킹은 아직입니다</span>') + '</p>'
        : '') +
      '<p class="jnc-b">' + esc(r.body) + '</p>' +
      '<button type="button" class="btn btn-pt jnc-go" data-id="' + esc(r.id) + '"' +
        (left > 0 ? '' : ' disabled') + '>' +
        (left > 0 ? '참가 신청하기' : '자리가 찼습니다') + '</button>' +
    '</li>';
  }

  function openForm(){
    var rg = (window.AM_REGIONS || []).map(function(r){
      return '<option value="' + esc(r.key) + '">' + esc(r.name) + '</option>';
    }).join("");
    return '<form id="jnf" class="jform">' +
      '<div class="jrow jrow-full">' +
        '<label for="j-title">제목 <b>*</b></label>' +
        '<input id="j-title" name="title" required minlength="2" maxlength="60" ' +
        'placeholder="보기: 주말 아침 라운딩 같이 치실 분">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="j-date">라운딩 날짜 <b>*</b></label>' +
        '<input id="j-date" name="play_at" type="date" required>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="j-rg">지역 <b>*</b></label>' +
        '<select id="j-rg" name="region" required>' +
          '<option value="">고르세요</option>' + rg +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="j-need">더 필요한 인원 <b>*</b></label>' +
        '<select id="j-need" name="need" required>' +
          '<option value="1">1명</option><option value="2">2명</option>' +
          '<option value="3">3명</option>' +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="j-tee">희망 티타임</label>' +
        '<input id="j-tee" name="tee" maxlength="30" placeholder="보기: 아침 · 오전">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="j-course">골프장</label>' +
        '<input id="j-course" name="course" maxlength="60" ' +
        'placeholder="정해졌으면 적어 주세요">' +
        /* ⚠️ 지어낸 약속을 하지 않습니다 — 우리가 부킹을 잡아 주지 않습니다 */
        '<span class="jhint">골프올인원이 부킹을 잡아 드리지는 않습니다.</span>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="j-budget">1인 예상 비용</label>' +
        '<input id="j-budget" name="budget" type="number" min="0" max="10000000" ' +
        'step="1000" inputmode="numeric" placeholder="원">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="j-body">설명 <b>*</b></label>' +
        '<textarea id="j-body" name="body" rows="4" required minlength="5" ' +
        'maxlength="1000" placeholder="구력 · 분위기 · 교통 등 알려 주실 것을 적어 주세요."></textarea>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="j-contact">연락처 <b>*</b></label>' +
        '<input id="j-contact" name="contact" required maxlength="100" ' +
        'autocomplete="tel" placeholder="전화번호 또는 메신저 아이디">' +
        /* ⚠️⚠️⚠️ 제17조 — 언제 누구에게 가는지를 **적는 그 자리에서** 말합니다 */
        '<span class="jhint">⚠️ 목록에는 <b>안 나옵니다.</b> ' +
        '참가를 수락하신 뒤 <b>다시 한 번 고르셔야</b> 그분에게만 보입니다.</span>' +
      '</div>' +
      consentBox() +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">조인 열기</button>' +
        '<p id="jmsg" class="jmsg" hidden></p>' +
      '</div>' +
    '</form>';
  }

  /* ⚠️⚠️ 개인정보보호법 제15조 제2항 — 수집 항목 · 이용 목적 · 보유
     기간을 **동의받는 그 자리에서** 같이 보여 줍니다. 링크로 빼 두면
     "같이 보여 준 것" 이 아닙니다. */
  function consentBox(){
    return '<div class="jrow jrow-full jconsent">' +
      /* ⚠️⚠️ **id 를 달지 않습니다.** 이 상자는 여는 양식과 신청
         양식에 **둘 다** 들어가므로, id 를 달면 두 양식이 같이 열려
         있을 때 **같은 id 가 둘**이 됩니다 (화면 읽는 기계가 어느
         칸인지 못 가립니다). 이름표는 `<label>` 이 **감싸서** 붙습니다 —
         id 가 없어도 됩니다. */
      '<label class="jchk"><input type="checkbox" required> ' +
      '<span>아래 내용으로 개인정보 수집 · 이용에 동의합니다 <b>*</b></span></label>' +
      '<ul class="jterms">' +
        '<li><b>수집 항목</b> 연락처, 적어 주신 글</li>' +
        '<li><b>이용 목적</b> 조인 자리를 알리고 참가자와 잇기</li>' +
        '<li><b>보유 기간</b> ' + esc(KEEP) + '</li>' +
        '<li><b>제공</b> 연락처는 <b>수락 뒤 따로 고르셨을 때만</b> ' +
          '그 상대 한 분에게 보입니다. 언제든 다시 닫으실 수 있습니다.</li>' +
      '</ul>' +
      '<p class="jhint">동의하지 않으셔도 다른 기능은 그대로 쓰실 수 있습니다.</p>' +
    '</div>';
  }

  function applyForm(id, title){
    return '<form id="jaf" class="jform" data-id="' + esc(id) + '">' +
      '<p class="jafh">참가 신청 — <b>' + esc(title) + '</b></p>' +
      '<div class="jrow jrow-full">' +
        '<label for="a-msg">남기실 말</label>' +
        '<textarea id="a-msg" name="msg" rows="3" maxlength="300" ' +
        'placeholder="구력 · 가능한 시간 등을 적어 주세요."></textarea>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="a-contact">연락처 <b>*</b></label>' +
        '<input id="a-contact" name="contact" required maxlength="100" ' +
        'autocomplete="tel" placeholder="전화번호 또는 메신저 아이디">' +
        '<span class="jhint">⚠️ 여신 분에게 <b>바로 가지 않습니다.</b> ' +
        '수락된 뒤 <b>다시 한 번 고르셔야</b> 보입니다.</span>' +
      '</div>' +
      consentBox() +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">신청 보내기</button>' +
        '<button type="button" class="btn jaf-x">그만두기</button>' +
        '<p id="jmsg2" class="jmsg" hidden></p>' +
      '</div>' +
    '</form>';
  }

  /* ── DB 에 보내기 — ⚠️ 거절한 말을 그대로 보여 줍니다 ───────────── */
  function call(a, fn, p){
    return fetch(a.conf.url + "/rest/v1/rpc/" + fn, {
      method: "POST",
      headers: Object.assign({ "content-type":"application/json", apikey:a.conf.anonKey },
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

  function load(a){
    return fetch(a.conf.url + "/rest/v1/v_join_open" +
      "?select=id,title,body,region,play_at,course,booked,tee,need,budget,left_n" +
      "&order=play_at.asc&limit=50", {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : []; });
  }

  function paint(a, rows){
    if(!rows.length){
      /* ⚠️ 0건이어도 **막다른 길로 두지 않습니다** (절대 규칙 2) —
         지금 실제로 할 수 있는 것을 같이 냅니다. */
      list.innerHTML = '<div class="none">' +
        '<h3>아직 열린 조인이 없습니다.</h3>' +
        '<p>첫 조인을 열어 보세요. 날짜와 지역만 정하시면 됩니다.</p>' +
      '</div>';
      return;
    }
    list.innerHTML = '<ul class="jnl">' + rows.map(card).join("") + '</ul>';
    Array.prototype.forEach.call(list.querySelectorAll(".jnc-go"), function(b){
      b.addEventListener("click", function(){
        if(!a.signedIn){ window.location.href = window.amLoginUrl
          ? window.amLoginUrl(window.location.pathname) : "/login"; return; }
        var li = b.closest(".jnc");
        var old = li.querySelector("#jaf");
        if(old){ old.remove(); return; }
        li.insertAdjacentHTML("beforeend",
          applyForm(b.getAttribute("data-id"), li.querySelector("h3").textContent));
        li.querySelector(".jaf-x").addEventListener("click", function(){
          li.querySelector("#jaf").remove();
        });
        li.querySelector("#jaf").addEventListener("submit", function(e){
          e.preventDefault();
          var f = e.target, msg = li.querySelector("#jmsg2");
          var btn = f.querySelector('button[type="submit"]');
          btn.disabled = true;
          msg.hidden = false; msg.textContent = "보내는 중입니다…";
          call(a, "apply_joinroom", {
            room_id: f.getAttribute("data-id"),
            msg: f.msg.value, contact: f.contact.value,
            /* ⚠️ 동의 시각은 **누른 그 순간**입니다 (연 시각이 아닙니다) */
            agree_at: new Date().toISOString()
          }).then(function(){
            li.innerHTML = '<div class="none">' +
              '<h3>신청을 보냈습니다.</h3>' +
              /* ⚠️⚠️ 문장 한가운데 링크를 박지 않습니다 (높이 16px) —
                 문단 끝에 **단추**로 냅니다. */
              '<p>여신 분이 보고 수락하시면 연락처를 주고받으실 수 있습니다. ' +
              /* ⚠️ 지킬 수 없는 약속을 하지 않습니다 */
              '언제까지라고 약속드리지는 않습니다.</p>' +
              '<a class="btn btn-pt" href="/my">내 정보에서 보기</a></div>';
          }).catch(function(err){
            btn.disabled = false;
            msg.textContent = String((err && err.message) || "보내지 못했습니다.");
          });
        });
      });
    });
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[join] 로그인 · 접수가 설정되지 않아 조인을 열지 " +
        "않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      return;                       /* 빌드가 찍어 둔 글 그대로 */
    }
    if(!KEEP){
      /* ⚠️⚠️ 보유 기간을 못 보여 주면 동의를 받을 수 없습니다 (제15조
         제2항). 운영자에게만 말하고 양식은 안 엽니다. */
      try{ console.warn("[join] js/data/site.js 의 joinKeep(보유 기간)이 " +
        "비어 조인 양식을 열지 않았습니다 — 개인정보보호법 제15조 제2항."); }catch(e){}
      return;
    }

    load(a).then(function(rows){ paint(a, rows); });

    var box = document.getElementById("joinbox");
    if(!box) return;
    box.className = "jbox";
    box.innerHTML = a.signedIn
      ? '<h3 class="jbox-h">조인 열기</h3>' + openForm()
      : '<div class="none"><h3>조인을 열려면 로그인하셔야 합니다.</h3>' +
        '<p>여신 분과 신청하신 분을 잇는 자리라, 누가 여셨는지 알아야 합니다.</p>' +
        '<a class="btn btn-pt" href="' +
          (window.amLoginUrl ? esc(window.amLoginUrl(window.location.pathname)) : "/login") +
        '">로그인하기</a></div>';
    if(!a.signedIn) return;

    /* 오늘보다 이전은 못 고르게 — 문도 막지만 화면이 먼저 말해 줍니다 */
    var d = document.getElementById("j-date");
    if(d) d.min = new Date().toISOString().slice(0, 10);

    document.getElementById("jnf").addEventListener("submit", function(e){
      e.preventDefault();
      var f = e.target, msg = document.getElementById("jmsg");
      var btn = f.querySelector('button[type="submit"]');
      btn.disabled = true;
      msg.hidden = false; msg.textContent = "여는 중입니다…";
      call(a, "open_joinroom", {
        title: f.title.value, body: f.body.value, region: f.region.value,
        play_at: f.play_at.value, need: f.need.value, tee: f.tee.value,
        course: f.course.value, budget: f.budget.value, contact: f.contact.value,
        agree_at: new Date().toISOString()
      }).then(function(){
        box.className = "none";
        box.innerHTML = '<h3>조인을 열었습니다.</h3>' +
          '<p>목록에 바로 보입니다. 신청이 들어오면 내 정보에서 ' +
          '수락하실 수 있습니다.</p>' +
          '<a class="btn btn-pt" href="/my">내 정보에서 보기</a>';
        load(a).then(function(rows){ paint(a, rows); });
      }).catch(function(err){
        btn.disabled = false;
        msg.textContent = String((err && err.message) || "열지 못했습니다.");
      });
    });
  }).catch(function(){ /* 못 물어봤으면 빌드가 찍은 글 그대로 */ });
})();

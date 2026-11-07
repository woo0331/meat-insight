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
      /* ⚠️⚠️ 전에는 **부킹이 아직일 때만** 적었습니다 — 거르개가 생긴
         뒤로는 "부킹이 잡힌 자리만" 을 눌러도 무엇이 걸러졌는지 화면에
         아무 표가 없어서, 눌러도 아무 일이 안 난 것처럼 보입니다.
         ⚠️ 골프장 이름이 비어 있어도 `booked` 는 켜질 수 있으므로 그
         줄을 **따로** 냅니다 (한 줄에 묶으면 조용히 안 보입니다). */
      (r.course
        ? '<p class="jnc-c">' + esc(r.course) +
          (r.booked ? '' : ' <span class="jnc-w">부킹은 아직입니다</span>') + '</p>'
        : (r.booked ? '' : '<p class="jnc-c"><span class="jnc-w">' +
             '부킹은 아직입니다</span></p>')) +
      (r.booked
        ? '<p class="jnc-c"><span class="jnc-ok">티타임이 잡혀 있습니다</span></p>'
        : '') +
      '<p class="jnc-b">' + esc(r.body) + '</p>' +
      '<button type="button" class="btn btn-pt jnc-go" data-id="' + esc(r.id) + '"' +
        (left > 0 ? '' : ' disabled') + '>' +
        (left > 0 ? '참가 신청하기' : '자리가 찼습니다') + '</button>' +
    '</li>';
  }

  /* 거르개를 그리고 · 바뀌면 다시 읽습니다 — ⚠️ 그리는 자리는 한 곳
     입니다 (조건을 지우는 단추도 이것을 다시 부릅니다). */
  function mountBar(){
    var old = document.getElementById("jnfilbox");
    if(!old){
      old = document.createElement("div");
      old.id = "jnfilbox";
      list.parentNode.insertBefore(old, list);
    }
    old.innerHTML = filterBar();
  }
  function bindBar(a){
    var box = document.getElementById("jnfilbox");
    if(!box) return;
    box.addEventListener("change", function(e){
      var t = e.target;
      if(!t || !t.id) return;
      if(t.id === "jf-rg")      F.rg = t.value;
      else if(t.id === "jf-wh") F.wh = whenOf(t.value).key;
      else if(t.id === "jf-bk") F.bk = !!t.checked;
      else return;
      writeUrl();
      reload(a);
    });
  }
  function reload(a){
    return load(a).then(function(rows){ paint(a, rows); });
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
        '<button type="button" class="btn btn-line jaf-x">그만두기</button>' +
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

  /* ════════════════════════════════════════════════════════════════
     거르개 — 지역 · 날짜 · **부킹이 잡힌 자리만** (2026-11-06)

     ⚠️⚠️⚠️ **전에는 거르개가 한 개도 없었습니다.** `v_join_open` 이
     `region` · `play_at` · `booked` 를 처음부터 내주고 있었는데, 목록은
     그것을 **보여 주기만** 했습니다 — 서울 사는 분이 제주 조인까지
     쉰 줄을 밀어 내려가야 했습니다.

     ⚠️⚠️ **`booked` 가 켜진 자리가 "티타임이 이미 잡힌 자리"** 입니다
     (여신 분이 부킹을 잡아 두고 사람만 구하는 꼴). 그 거르개 하나가
     경쟁 서비스의 "티타임 양도" 에 해당합니다 — **새 표도 새 칸도
     필요 없습니다.** 단, 우리가 돈을 받거나 자리를 보장하지는 않으므로
     "양도" 라고 적지 않고 **있는 사실만** 적습니다 (절대 규칙 5).

     ⚠️⚠️ **거르는 것은 서버입니다** — 쉰 줄만 받아 와서 화면에서 걸러
     내면, 서울 조인이 쉰 줄 밖에 있을 때 **0건으로 보입니다**(에러 없이).
     그래서 조건을 질의로 보냅니다.

     ⚠️⚠️⚠️ **날짜는 `toISOString()` 으로 짓지 않습니다.** 그 함수는
     UTC 를 내놓아서, 한국에서 아침 9시 전에는 **어제 날짜**가 됩니다 —
     "오늘 · 내일" 이 하루씩 밀립니다. `play_at` 은 여신 분이 **제 달력
     에서** 고른 날이므로 **그 자리의 날짜**로 셉니다.
     ════════════════════════════════════════════════════════════════ */
  var F = { rg:"", wh:"", bk:false };
  /* ⚠️ 0058 — 로그인한 분에게만 "조건 저장" 길을 냅니다. 로그인 전에
     그리면 눌러서 로그인 화면으로 갔다가 돌아와도 **저장된 것이 없는**
     꼴이 됩니다 (절대 규칙 5). */
  var SIGNED = false;

  /* 그 자리의 날짜를 YYYY-MM-DD 로 — ⚠️ 위 머리말 (UTC 로 짓지 않습니다) */
  function ymd(d){
    var m = d.getMonth() + 1, x = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m +
           "-" + (x < 10 ? "0" : "") + x;
  }
  function plusDays(n){
    var d = new Date();
    d.setDate(d.getDate() + n);
    return ymd(d);
  }

  /* 날짜 갈래 — ⚠️ 말과 날짜 수를 **한 곳**에 둡니다 (두 곳에 적으면
     고르개 글과 걸러지는 범위가 조용히 달라집니다) */
  var WHEN = [
    { key:"",    name:"모든 날짜",   days:null },
    { key:"d1",  name:"오늘 · 내일", days:1  },
    { key:"d7",  name:"이번 주 안",  days:7  },
    { key:"d14", name:"2주 안",      days:14 }
  ];
  function whenOf(k){
    for(var i = 0; i < WHEN.length; i++) if(WHEN[i].key === k) return WHEN[i];
    return WHEN[0];
  }

  /* 주소에서 읽습니다 — ⚠️ 주소를 복사해 보내도 같은 화면이어야 합니다 */
  function readUrl(){
    try{
      var u = new URLSearchParams(location.search);
      F.rg = (u.get("rg") || "").trim();
      F.wh = whenOf((u.get("when") || "").trim()).key;
      F.bk = u.get("bk") === "1";
    }catch(e){}
  }
  function writeUrl(){
    try{
      var qs = [];
      if(F.rg) qs.push("rg=" + encodeURIComponent(F.rg));
      if(F.wh) qs.push("when=" + encodeURIComponent(F.wh));
      if(F.bk) qs.push("bk=1");
      history.replaceState(null, "",
        location.pathname + (qs.length ? "?" + qs.join("&") : ""));
    }catch(e){}
  }

  /* ⚠️ 고르개 · 체크박스로 냅니다 — 목록 자체가 자바스크립트로만
     그려지는 자리라 링크로 만들어도 봇에게는 보일 것이 없습니다
     (`/search` 의 거르개를 링크로 둔 까닭과 다른 자리입니다). */
  function filterBar(){
    var rg = (window.AM_REGIONS || []).map(function(r){
      return '<option value="' + esc(r.key) + '"' +
        (F.rg === r.key ? " selected" : "") + '>' + esc(r.name) + '</option>';
    }).join("");
    return '<form class="jform jnf-f" id="jnfil">' +
      '<div class="jrow"><label for="jf-rg">지역</label>' +
        '<select id="jf-rg"><option value="">전국</option>' + rg + '</select></div>' +
      '<div class="jrow"><label for="jf-wh">날짜</label>' +
        '<select id="jf-wh">' + WHEN.map(function(w){
          return '<option value="' + esc(w.key) + '"' +
            (F.wh === w.key ? " selected" : "") + '>' + esc(w.name) + '</option>';
        }).join("") + '</select></div>' +
      '<div class="jrow jrow-full">' +
        '<label class="chk"><input type="checkbox" id="jf-bk"' +
          (F.bk ? " checked" : "") + '><span>부킹이 잡힌 자리만</span></label>' +
        /* ⚠️ 하지 않는 일을 적지 않습니다 — 우리가 티타임을 파는 것도,
           자리를 보장하는 것도 아닙니다. 여신 분이 적은 사실뿐입니다. */
        '<p class="jhint">여신 분이 티타임을 이미 잡아 두고 사람만 ' +
        '구하는 자리입니다. 골프올인원이 예약을 잡아 드리는 것은 아닙니다.</p>' +
      '</div>' +
    '</form>' +
    /* ⚠️⚠️ 0058 — 글과 주소는 `js/data/deal.js` 의 amWatchLink() 한
       곳입니다 (분류 화면 셋이 같은 말을 해야 합니다). */
    (SIGNED && window.amWatchLink ? window.amWatchLink("join") : "") +
    '<p class="jnf-n" id="jfnow" hidden></p>';
  }

  function load(a){
    var qs = ["select=id,title,body,region,play_at,course,booked,tee,need,budget,left_n",
              "order=play_at.asc", "limit=50"];
    if(F.rg) qs.push("region=eq." + encodeURIComponent(F.rg));
    if(F.bk) qs.push("booked=is.true");
    var w = whenOf(F.wh);
    /* ⚠️ 보기가 이미 지난 날짜를 빼므로 아래쪽만 겁니다 (`play_at >= 오늘`) */
    if(w.days !== null) qs.push("play_at=lte." + plusDays(w.days));
    return fetch(a.conf.url + "/rest/v1/v_join_open?" + qs.join("&"), {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : []; });
  }

  /* 지금 걸린 조건을 말로 — ⚠️ 켜진 것이 없으면 빈 글자입니다 */
  function nowBits(){
    var b = [];
    if(F.rg) b.push(rgName(F.rg));
    if(F.wh) b.push(whenOf(F.wh).name);
    if(F.bk) b.push("부킹이 잡힌 자리");
    return b;
  }

  function paint(a, rows){
    /* 센 수를 적습니다 — ⚠️ 갯수를 글자로 박지 않고 **세어서** 냅니다 */
    var nl = document.getElementById("jfnow");
    if(nl){
      var b = nowBits();
      nl.hidden = false;
      nl.textContent = (b.length ? b.join(" · ") + " — " : "") +
        "열린 자리 " + rows.length + "곳";
    }
    if(!rows.length){
      /* ⚠️⚠️ **"아직 아무도 안 열었다" 와 "조건에 맞는 것이 없다" 는
         다른 말입니다.** 같은 말로 적으면 손님이 조건을 지워 볼 생각을
         못 합니다 (`/search` 의 0건 자리에서 적어 둔 그 줄입니다).
         ⚠️ 0건이어도 **막다른 길로 두지 않습니다** (절대 규칙 2). */
      list.innerHTML = nowBits().length
        ? '<div class="none">' +
          '<h3>조건에 맞는 조인이 없습니다.</h3>' +
          '<p>조건을 넓혀 보시거나, 원하시는 날짜로 직접 열어 보세요.</p>' +
          '<div class="none-b">' +
            '<button type="button" class="btn btn-line" id="jf-all">조건 지우기</button>' +
          '</div></div>'
        : '<div class="none">' +
          '<h3>아직 열린 조인이 없습니다.</h3>' +
          '<p>첫 조인을 열어 보세요. 날짜와 지역만 정하시면 됩니다.</p>' +
        '</div>';
      var allb = document.getElementById("jf-all");
      if(allb) allb.addEventListener("click", function(){
        F.rg = ""; F.wh = ""; F.bk = false;
        writeUrl(); mountBar(); reload(a);
      });
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
      /* ⚠️ 빌드가 찍어 둔 "아직 없는 것입니다" 를 그대로 두면
         0건이라고 말하는 것입니다 — 열지 않았다고 적습니다. */
      window.amShut("joinlist");
      return;                       /* 빌드가 찍어 둔 글 그대로 */
    }
    if(!KEEP){
      /* ⚠️⚠️ 보유 기간을 못 보여 주면 동의를 받을 수 없습니다 (제15조
         제2항). 운영자에게만 말하고 양식은 안 엽니다. */
      try{ console.warn("[join] js/data/site.js 의 joinKeep(보유 기간)이 " +
        "비어 조인 양식을 열지 않았습니다 — 개인정보보호법 제15조 제2항."); }catch(e){}
      return;
    }

    /* 거르개를 목록 **앞에** 끼웁니다 — ⚠️ 목록도 브라우저가 그리므로
       빌드가 찍을 자리가 아닙니다 (위 머리말). */
    SIGNED = !!a.signedIn;
    readUrl();
    mountBar();
    bindBar(a);
    reload(a);

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

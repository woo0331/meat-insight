/* ════════════════════════════════════════════════════════════════════
   골프 커뮤니티 — /cat/community 에서만 돕니다 (DB 는 0047 · §2.C)

   ⚠️⚠️ **목록은 브라우저가 그립니다** — 빌드가 못 찍습니다. 글은 아무
   때나 올라오므로 빌드 때 찍으면 배포할 때만 바뀝니다. 그래서
   **설명은 빌드가**(크롤러 · 자바스크립트 꺼진 분이 읽을 몫),
   **글 목록은 브라우저가** 그립니다.
   ⚠️ 그 설명 글을 지우면 봇에게는 **빈 화면**이 됩니다.

   ⚠️⚠️⚠️ **글쓴이 이름은 가려서 옵니다** (`who` — 김** 꼴). 공개
   보기에 `by_user` 가 아예 없어서, 화면이 임자를 알 길이 없습니다.
   그게 맞습니다 — 글은 공개지만 글쓴이는 공개가 아닙니다.
   ⚠️ 그래서 "내 글 고치기 · 내리기" 는 여기가 아니라 `/my` 입니다.

   ⚠️ 첫 버전에는 **인기글 · 좋아요 · 랭킹 · 포인트 · 쪽지 · AI 답변 ·
   평점이 없습니다** (§2.C). 글이 쌓인 뒤에 뜻이 생기는 것들이고, 지금
   만들면 0건짜리 랭킹이 화면에 남습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var list = document.getElementById("cqlist");
  if(!list || !window.amAuthAsk) return;

  var esc  = window.esc;
  var CATS = {};
  (window.AM_CATS || []).forEach(function(c){ CATS[c.key] = c.name; });

  function when(iso){
    var d = new Date(iso);
    if(isNaN(d.getTime())) return "";
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일";
  }

  function get(a, path){
    return fetch(a.conf.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : []; });
  }
  function call(a, fn, p){
    return fetch(a.conf.url + "/rest/v1/rpc/" + fn, {
      method:"POST",
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

  function qCard(q){
    return '<li class="cqc" data-id="' + esc(q.id) + '">' +
      '<div class="cqc-h">' +
        '<h3>' + esc(q.title) + '</h3>' +
        '<span class="cqc-n">답변 ' + esc(String(q.answer_n)) + '</span>' +
      '</div>' +
      '<p class="cqc-m">' + esc(CATS[q.cat] || q.cat) + ' · ' +
        esc(q.who) + ' · ' + esc(when(q.created_at)) + '</p>' +
      '<p class="cqc-b">' + esc(q.body) + '</p>' +
      '<div class="cqc-act">' +
        '<button type="button" class="btn cqc-open">답변 보기</button>' +
      '</div>' +
      '<div class="cqc-a" hidden></div>' +
    '</li>';
  }

  function aList(rows){
    if(!rows.length) return '<p class="cqc-z">아직 답변이 없습니다.</p>';
    return '<ul class="cal">' + rows.map(function(c){
      return '<li>' +
        '<p class="cal-m">' + esc(c.who) +
          (c.by_asker ? ' <span class="cal-w">글쓴이</span>' : '') +
          ' · ' + esc(when(c.created_at)) + '</p>' +
        '<p class="cal-b">' + esc(c.body) + '</p>' +
      '</li>';
    }).join("") + '</ul>';
  }

  function aForm(qid){
    return '<form class="jform caf" data-q="' + esc(qid) + '">' +
      '<div class="jrow jrow-full">' +
        '<label>답변 <b>*</b></label>' +
        '<textarea name="body" rows="3" required minlength="5" maxlength="4000" ' +
        'placeholder="아시는 것을 적어 주세요. 다섯 글자 이상."></textarea>' +
        /* ⚠️ 연락처를 적지 말라고 **적는 그 자리에서** 말합니다 (§2.C) */
        '<span class="jhint">⚠️ 전화번호 · 아이디 같은 연락처는 적지 마세요. ' +
        '이 글은 <b>누구나 봅니다.</b></span>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">답변 달기</button>' +
        '<p class="jmsg cafm" hidden></p>' +
      '</div>' +
    '</form>';
  }

  function askForm(){
    var opt = (window.AM_CATS || []).map(function(c){
      return '<option value="' + esc(c.key) + '">' + esc(c.name) + '</option>';
    }).join("");
    return '<form id="cqf" class="jform">' +
      '<div class="jrow">' +
        '<label for="c-cat">질문 분류 <b>*</b></label>' +
        '<select id="c-cat" name="cat" required>' +
          '<option value="">고르세요</option>' + opt +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="c-title">제목 <b>*</b></label>' +
        '<input id="c-title" name="title" required minlength="2" maxlength="80" ' +
        'placeholder="보기: 드라이버 슬라이스 고치는 법">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="c-body">내용 <b>*</b></label>' +
        '<textarea id="c-body" name="body" rows="5" required minlength="5" ' +
        'maxlength="4000" placeholder="무엇이 궁금하신지 적어 주세요."></textarea>' +
        '<span class="jhint">⚠️ 전화번호 · 아이디 같은 연락처는 적지 마세요. ' +
        '이 글은 <b>누구나 봅니다.</b> ' +
        '올리신 글은 내 정보 화면에서 고치거나 내리실 수 있습니다.</span>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">질문 올리기</button>' +
        '<p id="cqmsg" class="jmsg" hidden></p>' +
      '</div>' +
    '</form>';
  }

  function paint(a, rows){
    if(!rows.length){
      /* ⚠️ 0건이어도 막다른 길로 두지 않습니다 (절대 규칙 2) */
      list.innerHTML = '<div class="none">' +
        '<h3>아직 올라온 질문이 없습니다.</h3>' +
        '<p>첫 질문을 올려 보세요. 분류와 제목만 정하시면 됩니다.</p></div>';
      return;
    }
    list.innerHTML = '<ul class="cql">' + rows.map(qCard).join("") + '</ul>';

    Array.prototype.forEach.call(list.querySelectorAll(".cqc-open"), function(b){
      b.addEventListener("click", function(){
        var li = b.closest(".cqc"), box = li.querySelector(".cqc-a");
        if(!box.hidden){ box.hidden = true; b.textContent = "답변 보기"; return; }
        box.hidden = false; b.textContent = "답변 접기";
        box.innerHTML = '<p class="cqc-z">불러오는 중입니다…</p>';
        get(a, "v_ca_public?select=id,who,body,created_at,by_asker" +
               "&q_id=eq." + encodeURIComponent(li.getAttribute("data-id")) +
               "&order=created_at.asc&limit=100").then(function(rows2){
          box.innerHTML = aList(rows2) +
            (a.signedIn ? aForm(li.getAttribute("data-id"))
                        : '<p class="cqc-z">답변은 로그인하신 뒤에 다실 수 있습니다. ' +
                          '<a href="' + (window.amLoginUrl
                            ? esc(window.amLoginUrl(window.location.pathname)) : "/login") +
                          '">로그인하기</a></p>');
          var f = box.querySelector(".caf");
          if(!f) return;
          f.addEventListener("submit", function(e){
            e.preventDefault();
            var msg = f.querySelector(".cafm");
            var sb = f.querySelector('button[type="submit"]');
            sb.disabled = true;
            msg.hidden = false; msg.textContent = "보내는 중입니다…";
            call(a, "answer_cq", { q_id: f.getAttribute("data-q"), body: f.body.value })
              .then(function(){ load(a); })
              .catch(function(err){
                sb.disabled = false;
                /* ⚠️ DB 가 거절한 말을 **그대로** 보여 줍니다 */
                msg.textContent = String((err && err.message) || "달지 못했습니다.");
              });
          });
        });
      });
    });
  }

  function load(a){
    return get(a, "v_cq_public?select=id,cat,title,body,who,created_at,answer_n" +
                  "&order=created_at.desc&limit=50")
      .then(function(rows){ paint(a, rows); });
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[community] 로그인 · 접수가 설정되지 않아 커뮤니티를 " +
        "열지 않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      return;                       /* 빌드가 찍어 둔 글 그대로 */
    }
    load(a);

    var box = document.getElementById("cqbox");
    if(!box) return;
    box.className = "jbox";
    box.innerHTML = a.signedIn
      ? '<h3 class="jbox-h">질문 올리기</h3>' + askForm()
      : '<div class="none"><h3>질문을 올리려면 로그인하셔야 합니다.</h3>' +
        '<p>올리신 글을 나중에 고치거나 내리시려면 누가 올렸는지 알아야 합니다.</p>' +
        '<a class="btn btn-pt" href="' +
          (window.amLoginUrl ? esc(window.amLoginUrl(window.location.pathname)) : "/login") +
        '">로그인하기</a></div>';
    if(!a.signedIn) return;

    document.getElementById("cqf").addEventListener("submit", function(e){
      e.preventDefault();
      var f = e.target, msg = document.getElementById("cqmsg");
      var btn = f.querySelector('button[type="submit"]');
      btn.disabled = true;
      msg.hidden = false; msg.textContent = "올리는 중입니다…";
      call(a, "ask_cq", { cat: f.cat.value, title: f.title.value, body: f.body.value })
        .then(function(){
          box.className = "none";
          box.innerHTML = '<h3>질문을 올렸습니다.</h3>' +
            '<p>목록에 바로 보입니다.</p>' +
            '<a class="btn btn-pt" href="/my">내 정보에서 고치기</a>';
          load(a);
        })
        .catch(function(err){
          btn.disabled = false;
          msg.textContent = String((err && err.message) || "올리지 못했습니다.");
        });
    });
  }).catch(function(){ /* 못 물어봤으면 빌드가 찍은 글 그대로 */ });
})();

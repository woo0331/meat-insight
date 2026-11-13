/* ════════════════════════════════════════════════════════════════════
   내가 쓴 글 — /my 에서만 돕니다 (DB 는 0047 · §2.C)

   ⚠️⚠️⚠️ **왜 목록 화면이 아니라 여기인가.** 공개 보기(`v_cq_public`)
   에는 `by_user` 칸이 **아예 없습니다** — 글은 공개지만 글쓴이는
   공개가 아니기 때문입니다 (후기 0037 과 같은 자리). 그래서 목록
   화면은 "이 글이 내 것인지" 를 알 길이 없고, 고치기 · 내리기는
   **내 글만 보이는 여기**에서만 할 수 있습니다.

   ⚠️⚠️ **지우지 않고 내립니다.** 내린 글도 줄로 남습니다 — 지우면
   "그런 말 한 적 없다" 가 되고, 신고가 들어왔을 때 댈 것이 없습니다.
   ⚠️ 운영자가 **가린** 글은 글쓴이도 못 고칩니다 (고쳐서 가린 뜻을
   지울 수 없습니다). 가린 까닭은 보여 드립니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("mycq");
  if(!box || !window.amAuthAsk) return;

  var esc  = window.esc;
  /* ⚠️⚠️⚠️ **`cq.cat` 은 게시판 키입니다 — 분류 키가 아닙니다.**
     2026-11-06 까지 이 줄이 `AM_CATS`(분류 열)에서 이름을 찾고 있어서,
     `cm-open`(자유게시판) 같은 게시판 키는 하나도 못 찾고 **키 그대로**
     찍혔습니다(그때는 못 찾으면 키를 그대로 내는 뒷가지가 있었습니다).
     ⚠️ 2026-11-12 에 그 뒷가지를 **`amKeyName()`** 으로 바꿨습니다 —
     못 찾으면 중립 문구를 내고 매핑 누락은 운영 기록으로 갑니다. 글쓰기 양식이
     분류 키를 넣고 있던 그 고장의 거울상이고, 양식을 고친 날 이 줄을
     같이 고치지 않으면 여기만 조용히 영문 키를 냅니다.
     ⚠️ 끌어오는 자리는 `js/community.js` 의 `boards()` 와 같습니다 —
     게시판 목록을 글자로 박지 않습니다. */
  var CATS = {};
  (function(){
    var c = window.amCat ? window.amCat("community") : null;
    (window.amCatItems ? window.amCatItems(c) : []).forEach(function(b){
      CATS[b.key] = b.name;
    });
  })();

  var ST = { live:"보이는 중", dropped:"내렸습니다", hidden:"운영자가 가렸습니다" };

  function when(iso){
    var d = new Date(iso);
    if(isNaN(d.getTime())) return "";
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일";
  }


  /* ⚠️⚠️⚠️ **정상 0건과 조회 실패를 가립니다** — 전에는
     `r.ok ? r.json() : []` 로 적어, 거절당한 것도 보기가 없는 것도
     **번 배열**이 되어 화면이 「아직 ~이 없습니다」를 찍었습니다
     (절대 규칙 1 — 0 은 세어 본 값입니다). 지금은 **던집니다.**
     ⚠️⚠️ 다시 묻는 것은 **`OPTCOL` 에 적어 둔 확인된 새 칸**이
     없다고 400 이 말할 때만이고, 보기 부재(404) · 권한(403) · 인증은
     덮지 않습니다. */
  var OPTCOL = [];
  var MISS = [];

  function get(a, path){
    return window.amPathSoft(path, OPTCOL, function(p){
      return fetch(a.conf.url + "/rest/v1/" + p, {
        headers: Object.assign({ apikey:a.conf.anonKey },
                               window.amAuthHeaders ? window.amAuthHeaders() : {})
      });
    }).then(function(x){
      if(x.miss && x.miss.length) x.miss.forEach(function(c){
        if(MISS.indexOf(c) < 0) MISS.push(c); });
      return x.rows;
    });
  }

  /* 조회 실패를 새 상자에 적습니다 — ⚠️ 손님에게는 **안내와 다시
     시도**까지이고 까닭은 개발 기록에만 적습니다 (절대 규칙 3). */
  function failBox(a, e, again){
    window.amFailLog("mycq", e);
    var b = document.getElementById("mycq");
    if(!b) return;
    b.hidden = false;
    b.innerHTML = window.amFailHtml("내 글");
    var t = b.querySelector("[data-amretry]");
    if(t) t.addEventListener("click", function(){ again(a); });
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

  function row(kind, o){
    var live = o.state === "live";
    return '<li class="mq-i" data-kind="' + kind + '" data-id="' + esc(o.id) + '">' +
      '<p class="mq-t">' +
        (kind === "q" ? '<b>' + esc(o.title) + '</b> · ' + esc(window.amKeyName(CATS, o.cat, "게시판"))
                      : '<b>답변</b>') +
        ' · ' + esc(when(o.created_at)) +
        ' · <span class="mq-s">' + esc(window.amKeyName(ST, o.state, "상태")) + '</span>' +
      '</p>' +
      '<p class="mq-b">' + esc(o.body) + '</p>' +
      /* ⚠️ 가린 까닭을 보여 드립니다 — 까닭 없이 가릴 수 없게 해 두었고,
         그 까닭을 숨기면 글쓴이는 무엇이 문제였는지 알 수 없습니다. */
      (o.state === "hidden" && o.hidden_why
        ? '<p class="mq-w">가린 까닭 — ' + esc(o.hidden_why) + '</p>' : '') +
      (live
        ? '<div class="mq-act">' +
            '<button type="button" class="btn btn-line mq-edit">고치기</button>' +
            '<button type="button" class="btn btn-line mq-drop">내리기</button>' +
          '</div>'
        : '') +
    '</li>';
  }

  function paint(a, qs, as_){
    var html = '<h2 class="mj-h">내가 쓴 글</h2>' +
      '<h3 class="mj-sh">내 질문</h3>' +
      (qs.length ? '<ul class="mq-l">' + qs.map(function(q){ return row("q", q); }).join("") + '</ul>'
                 : '<p class="mj-z">아직 올리신 질문이 없습니다.</p>' +
                   '<a class="btn btn-pt mj-go" href="/cat/community">커뮤니티에서 올리기</a>') +
      '<h3 class="mj-sh">내 답변</h3>' +
      (as_.length ? '<ul class="mq-l">' + as_.map(function(c){ return row("a", c); }).join("") + '</ul>'
                  : '<p class="mj-z">아직 다신 답변이 없습니다.</p>') +
      '<p class="jnote">⚠️ 내리신 글은 목록에서 빠지지만 <b>기록은 남습니다</b> — ' +
      '지우면 신고가 들어왔을 때 서로 댈 것이 없어집니다.</p>' +
      '<p id="mqmsg" class="jmsg" hidden></p>';

    box.className = "mj";
    box.hidden = false;
    box.innerHTML = html;

    function msgOf(){ return document.getElementById("mqmsg"); }

    Array.prototype.forEach.call(box.querySelectorAll(".mq-drop"), function(b){
      b.addEventListener("click", function(){
        var li = b.closest(".mq-i");
        /* ⚠️ 되돌릴 수 없는 일이라 한 번 여쭙습니다 */
        if(!window.confirm("이 글을 내릴까요? 목록에서 빠집니다.")) return;
        var msg = msgOf();
        b.disabled = true;
        msg.hidden = false; msg.textContent = "내리는 중입니다…";
        call(a, li.getAttribute("data-kind") === "q" ? "move_cq" : "move_ca",
             { id: li.getAttribute("data-id"), state:"dropped" })
          .then(function(){ reload(a); })
          .catch(function(err){
            b.disabled = false;
            msg.textContent = String((err && err.message) || "내리지 못했습니다.");
          });
      });
    });

    Array.prototype.forEach.call(box.querySelectorAll(".mq-edit"), function(b){
      b.addEventListener("click", function(){
        var li = b.closest(".mq-i");
        var open = li.querySelector(".mq-ef");
        if(open){ open.remove(); return; }
        var isQ = li.getAttribute("data-kind") === "q";
        var src = (isQ ? qs : as_).filter(function(x){
          return x.id === li.getAttribute("data-id"); })[0];
        if(!src) return;
        li.insertAdjacentHTML("beforeend",
          '<form class="jform mq-ef">' +
            (isQ ? '<div class="jrow jrow-full"><label>제목 <b>*</b></label>' +
                   '<input name="title" required minlength="2" maxlength="80" value="' +
                   esc(src.title) + '"></div>' : '') +
            '<div class="jrow jrow-full"><label>내용 <b>*</b></label>' +
            '<textarea name="body" rows="4" required minlength="5" maxlength="4000">' +
            esc(src.body) + '</textarea></div>' +
            (isQ ? '<p class="jhint jrow-full">분류는 여기서 못 바꿉니다 — ' +
                   '바꾸면 달린 답변이 전혀 다른 자리로 옮겨 갑니다.</p>' : '') +
            '<div class="jrow jrow-full">' +
            '<button type="submit" class="btn btn-pt">고친 내용 저장</button></div>' +
          '</form>');
        var f = li.querySelector(".mq-ef");
        f.addEventListener("submit", function(e){
          e.preventDefault();
          var msg = msgOf();
          var sb = f.querySelector('button[type="submit"]');
          sb.disabled = true;
          msg.hidden = false; msg.textContent = "저장하는 중입니다…";
          var p = isQ ? { id: li.getAttribute("data-id"), title: f.title.value,
                          body: f.body.value }
                      : { id: li.getAttribute("data-id"), body: f.body.value };
          call(a, isQ ? "edit_cq" : "edit_ca", p)
            .then(function(){ reload(a); })
            .catch(function(err){
              sb.disabled = false;
              msg.textContent = String((err && err.message) || "저장하지 못했습니다.");
            });
        });
      });
    });
  }

  /* ⚠️⚠️ 조회 실패는 **한 곳에서** 받습니다 — 부르는 자리마다
     적으면 한쪽을 빠뜨리는 날 그 자리만 「0건」으로 보이거나 상자가
     「불러오는 중」에서 조용히 멈춥니다. */
  function reload(a){
    return draw(a).catch(function(e){ failBox(a, e, reload); });
  }

  function draw(a){
    return Promise.all([
      /* ⚠️ 고치는 양식이 읽을 칸을 **다 가져옵니다** — 빠뜨리면 양식이
         빈 칸으로 열리고 저장하는 순간 그 값이 지워집니다. */
      get(a, "cq?select=id,cat,title,body,state,hidden_why,created_at" +
             "&order=created_at.desc&limit=100"),
      get(a, "ca?select=id,q_id,body,state,hidden_why,created_at" +
             "&order=created_at.desc&limit=100")
    ]).then(function(r){ paint(a, r[0] || [], r[1] || []); });
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.signedIn) return;   /* 로그인 전에는 안 그립니다 */
    reload(a).catch(function(){ /* 못 읽었으면 숨긴 채로 둡니다 */ });
  }).catch(function(){});
})();

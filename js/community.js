/* ════════════════════════════════════════════════════════════════════
   골프 커뮤니티 게시판 — /cat/community 에서만 돕니다 (DB 는 0047 · 0059)

   ⚠️⚠️ **목록은 브라우저가 그립니다** — 빌드가 못 찍습니다. 글은 아무
   때나 올라오므로 빌드 때 찍으면 배포할 때만 바뀝니다. 그래서
   **설명은 빌드가**(크롤러 · 자바스크립트 꺼진 분이 읽을 몫),
   **글 목록은 브라우저가** 그립니다.
   ⚠️ 그 설명 글을 지우면 봇에게는 **빈 화면**이 됩니다.

   ⚠️⚠️⚠️ **읽기는 누구나 · 쓰기는 로그인한 분만** 입니다. 공개 보기
   (`v_cq_public` · `v_ca_public` · `v_cq_photo_public`)가 `anon` 에게도
   열려 있어 가입 안 하신 분도 글과 댓글을 봅니다. 글 · 댓글을 올리는
   문은 전부 `authenticated` 에게만 있습니다.

   ⚠️⚠️⚠️ **게시판 일곱은 `catalog.js` 에서 끌어옵니다** (커뮤니티 하위).
   2026-11-06 까지 글쓰기 양식의 분류 고르개가 **`AM_CATS`(전체 분류
   열)** 을 내고 있어서, `자유게시판`(`cm-open`)을 **고를 수가 없었습니다** —
   `cq.cat` 은 하위 키를 담는 칸인데 거기에 `lesson` · `booking` 같은
   분류 키가 들어가고 있었습니다. 표의 check 가 `btrim(cat) <> ''` 뿐이라
   DB 도 안 막고, `check-deal` 은 enum 만 보므로 아무도 못 잡았습니다.
   ⚠️ 그래서 지금은 **고르개와 게시판 거르개가 같은 함수**(`boards()`)를
   읽습니다 — 두 곳에 적으면 한쪽만 고치는 날 또 어긋납니다.

   ⚠️⚠️ **글쓴이 이름은 가려서 옵니다.** 닉네임을 정하신 분은 닉네임,
   안 정하신 분은 성함을 가려서(`김**`) 옵니다 — 공개 보기가 가립니다.
   화면은 **받은 글자를 그대로** 씁니다 (가리는 규칙이 두 곳이 되지 않게).
   ⚠️ 공개 보기에 `by_user` 는 **아예 없습니다.** 대신 `mine`(내 글인가)
   만 옵니다 — 상세 화면이 글쓴이에게만 고치기 · 내리기를 내는 데 그것으로
   충분하고, 임자가 누구인지는 끝까지 안 나갑니다.

   ⚠️⚠️ **"조회" 가 아니라 "회원 조회" 입니다** (0059). 비로그인 조회는
   IP 를 안 받아 셀 수가 없습니다 — 그냥 "조회" 라고 적으면 실제보다
   작은 수를 전체인 것처럼 내는 것이고 그건 지어낸 숫자입니다.

   ⚠️ 첫 버전에는 **대댓글 · 좋아요 · 랭킹 · 인기글 · 포인트 · 쪽지 ·
   AI 답변 · 평점이 없습니다** (§2.C · 지시서 §5). 글이 쌓인 뒤에 뜻이
   생기는 것들이고, 지금 만들면 0건짜리 랭킹이 화면에 남습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var list = document.getElementById("cqlist");
  /* ⚠️ 사진 주소를 짓는 데 씁니다 — 버킷이 꺼져 있으면 `amPubUrl()` 이
     **빈 글자**를 돌려주므로 썸네일이 줄째 빠집니다(주소를 지어내지
     않습니다 · 0068 이 매물 카드에서 세운 규칙). */
  var CONF = null;
  if(!list || !window.amAuthAsk) return;

  var esc = window.esc;
  var PER = 20;                     /* 한 쪽에 스무 줄 */
  var A = null;
  /* ⚠️ `q` 는 보고 있는 글, `q2` 는 **찾는 글자**입니다 — 짧은 이름을
     두 뜻으로 쓰면 한쪽을 고치는 날 다른 쪽이 조용히 바뀝니다. */
  var S = { s:"", q:"", q2:"", p:0 };
  /* ⚠️ 사진 버킷이 켜졌는지 — 서버만 압니다(`/api/upload`). 꺼져 있으면
     사진 칸을 **아예 안 냅니다**. */
  var CQPH = false;

  /* ⚠️⚠️ 게시판 일곱 — **한 곳**에서만 끌어옵니다 (위 머리말) */
  function boards(){
    var c = window.amCat ? window.amCat("community") : null;
    return (window.amCatItems ? window.amCatItems(c) : []);
  }
  /* ⚠️⚠️ **모르는 키를 그 글자 그대로 내지 않습니다** — 손님에게
     `cm-xxx` 는 아무 뜻도 없는 글자입니다. 중립 문구를 내고 매핑
     누락은 운영 기록으로 갑니다(`amKeyName()` 한 곳 · 2026-11-12). */
  function bname(k){ return window.amKeyName(boards(), k, "게시판"); }

  function when(iso){
    var d = new Date(iso);
    if(isNaN(d.getTime())) return "";
    return d.getFullYear() + "." + (d.getMonth() + 1) + "." + d.getDate();
  }
  function num(n){
    var v = Number(n);
    return isFinite(v) ? (window.won ? window.won(v) : String(v)) : "0";
  }

  /* ── 주소 ───────────────────────────────────────────────────────
     ⚠️⚠️ **거르개를 단추로만 만들지 않습니다** — 자바스크립트가 꺼진
     분 · 봇에게는 눌러도 아무 일이 안 나는 칸이 됩니다 (절대 규칙 5).
     링크로 만들고 눌림을 가로채 `pushState` 로 주소만 바꿉니다 — 그래야
     주소를 복사해 보내도 같은 화면이고 뒤로 가기도 됩니다. */
  function url(o){
    var s = (o && "s" in o) ? o.s : S.s;
    var q = (o && "q" in o) ? o.q : S.q;
    var p = (o && "p" in o) ? o.p : S.p;
    var qs = [];
    if(s) qs.push("s=" + encodeURIComponent(s));
    if(q) qs.push("q=" + encodeURIComponent(q));
    /* ⚠️ 찾는 글자도 **주소에 담습니다** — 복사해 보내도 같은 화면이고
       뒤로 가기도 됩니다 */
    var q2 = (o && "q2" in o) ? o.q2 : S.q2;
    if(q2) qs.push("f=" + encodeURIComponent(q2));
    if(p > 0) qs.push("p=" + String(p + 1));
    return "/cat/community" + (qs.length ? "?" + qs.join("&") : "");
  }
  function readUrl(){
    var u = new URLSearchParams(window.location.search);
    var s = (u.get("s") || "").trim();
    /* ⚠️⚠️⚠️ **쉼표로 여럿 들어옵니다** (2026-11-09 · 머리말 하위 메뉴).
       전에는 **한 키만** 받아들이고 모르는 값은 버렸는데, 쉼표가 통째로
       "모르는 값" 이 되어 「골프 정보 · 후기」를 누르면 **모아보기**가
       떴습니다 — 가는 길을 내 놓고 **받는 쪽을 안 고친** 자리이고,
       이 저장소가 그 거울상(받는 쪽은 있는데 길이 없던 자리)을 두 번
       겪었습니다. `test-desk` 가 질의를 뜯어 보고 잡았습니다.
       ⚠️ 모르는 키는 **버립니다** — 지어내지 않습니다. 전부 모르면
       모아보기입니다. */
    if(s === "boards"){ S.s = "boards"; }
    else if(s === "all"){ S.s = "all"; }
    else {
      var known = s.split(",").map(function(x){ return x.trim(); })
        .filter(function(k){
          return k && boards().some(function(b){ return b.key === k; }); });
      S.s = known.join(",");
    }
    S.q = (u.get("q") || "").trim();
    S.q2 = (u.get("f") || "").trim().slice(0, 40);
    var p = parseInt(u.get("p") || "1", 10);
    S.p = (isFinite(p) && p > 1) ? (p - 1) : 0;
  }
  function go(o, push){
    if(o && "s" in o) S.s = o.s;
    if(o && "q" in o) S.q = o.q;
    if(o && "q2" in o) S.q2 = o.q2;
    S.p = (o && "p" in o) ? o.p : 0;
    if(push !== false){
      try{ window.history.pushState({}, "", url({})); }catch(e){}
    }
    draw();
  }

  /* ── DB ─────────────────────────────────────────────────────────
     ⚠️ 몇 줄인지는 `content-range` 가 알려 줍니다 — 그 머리글이 없으면
     **쪽 수를 지어내지 않고** 다음 쪽이 있는지만 봅니다. */
  /* ⚠️⚠️ 운영 DB 에 아직 없을 수 있는 **새 선택 칸** — 0075 가
     더한 `thumb` 하나입니다. 여기 적은 이름만 다시 묻기의 대상이고,
     보기 부재(404) · 권한(403) · 인증은 덮지 않습니다. */
  var OPTCOL = ["thumb"];
  var MISS = [];

  /* `select=` 에서 그 칸만 끩니다 — ⚠️ 주소가 글자 하나라
     `amDropCols`(배열용) 대슴 여기서 끩습니다. */
  function dropSel(path, col){
    return path.replace(/([?&]select=)([^&]*)/, function(all, pre, sel){
      var keep = sel.split(",").filter(function(c){ return c.trim() !== col; });
      return pre + keep.join(",");
    });
  }

  /* ⚠️⚠️ 한 번만 다시 묻습니다 — 두 번째도 안 되면 그대로
     조회 실패입니다(끝없이 묻지 않습니다). */
  function get(path, count){
    return once(path, count).then(function(r){
      if(!r.failed || r.status !== 400) return r;
      var c = window.amMissCol ? window.amMissCol(r.why || "") : "";
      if(!c || OPTCOL.indexOf(c) < 0) return r;
      var p2 = dropSel(path, c);
      if(p2 === path) return r;
      if(MISS.indexOf(c) < 0) MISS.push(c);
      try{ console.warn("[community] 운영 DB 에 아직 없는 칸을 빼고 다시 " +
        "물었습니다 — " + c); }catch(_){}
      return once(p2, count);
    });
  }

  function once(path, count){
    var h = Object.assign({ apikey:A.conf.anonKey },
                          window.amAuthHeaders ? window.amAuthHeaders() : {});
    if(count) h.Prefer = "count=exact";
    return fetch(A.conf.url + "/rest/v1/" + path, { headers:h })
      .then(function(r){
        /* ⚠️⚠️ **본문은 한 번만 읽을 수 있습니다** — 처음에 `r.json()` 을
           두 번 불러 두 번째가 터졌습니다. 머리글을 먼저 읽고 본문은
           한 번만 읽습니다. */
        var cr = r.headers.get("content-range") || "";
        var tail = cr.indexOf("/") >= 0 ? cr.split("/")[1] : "";
        /* ⚠️ 몇 줄인지 모를 때는 **null** 입니다 — 0 으로 두면 "0건" 과
           "모름" 이 섞여 쪽 수를 지어내게 됩니다. */
        var tot = (tail && tail !== "*" && isFinite(Number(tail))) ? Number(tail) : null;
        /* ⚠️⚠️⚠️ **못 읽은 것과 0건은 다릅니다.** 전에는 여기서
           실패를 전부 삼켜 `{rows:[]}` 로 돌려주었고, 그래서 그물이
           끊기거나 질의가 거절되면 화면이 **「아직 작성된 글이
           없습니다 · 첫 이야기를 남겨보세요」** 를 적었습니다 — 세어
           본 것처럼 말하는 것이라 절대 규칙 1 입니다(그리고 손님은
           고칠 길이 없습니다). 지금은 `failed` 를 같이 내고 부르는
           쪽이 **갈라서** 적습니다. */
        /* ⚠️ 까닭은 **부르는 자리가 가리는 대** 쓸 것이고, 여기서
           새는 것은 `status` · `why` 둘입니다 — 손님 화면에는 한 글자도
           안 나가고(절대 규칙 3) 다시 묻는 한 곳에서만 봅니다. */
        if(!r.ok) return r.text().then(function(t){
          var o = {}; try{ o = JSON.parse(t) || {}; }catch(_){}
          return { rows:[], total:null, failed:true,
                   status:r.status, why:(o.message || t || "") };
        }, function(){ return { rows:[], total:null, failed:true,
                                status:r.status, why:"" }; });
        return r.json().then(function(rows){
          return { rows: Array.isArray(rows) ? rows : [], total: tot };
        }, function(){ return { rows:[], total:null, failed:true }; });
      })
      .catch(function(){ return { rows:[], total:null, failed:true }; });
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

  function loginUrl(){
    /* ⚠️ 로그인한 뒤 **원래 보시던 자리로** 돌아옵니다 — 주소에 게시판과
       글이 실려 있으므로 그대로 넘깁니다. */
    var here = window.location.pathname + window.location.search;
    return window.amLoginUrl ? window.amLoginUrl(here) : "/login";
  }
  function needLogin(what){
    return '<div class="none">' +
      '<h3>' + esc(what) + '려면 로그인하셔야 합니다.</h3>' +
      '<p>올리신 글을 나중에 고치거나 내리시려면 누가 올렸는지 알아야 합니다. ' +
      '가입 안 하셔도 <b>글과 댓글은 그대로 보실 수 있습니다.</b></p>' +
      '<a class="btn btn-pt" href="' + esc(loginUrl()) + '">로그인하기</a>' +
    '</div>';
  }

  /* ── 게시판 줄 ──────────────────────────────────────────────────── */
  /* 고른 게시판 — ⚠️ **쉼표를 가르는 자리는 여기 하나**입니다.
     목록 질의와 칩이 같은 줄을 읽어야 합니다 (두 곳에 적으면 칩은 켜져
     있는데 목록은 안 걸러 주는 날이 옵니다). "" 는 모아보기 · "all" 은
     전체 글이라 **좁히지 않습니다**. */
  function boardKeys(){
    if(!S.s || S.s === "all" || S.s === "boards") return [];
    return String(S.s).split(",").map(function(x){ return x.trim(); })
      .filter(function(x){ return x; });
  }

  /* ⚠️⚠️⚠️ **게시판 메뉴는 `#cqlist` 밖에 섭니다**(확정 시안 ⑩ —
     PC 에서 왼쪽 기둥). 빌드가 `#cqbd` 에 **링크로** 찍어 두고(자바스크립트가
     꺼져도 · 크롤러에게도 보입니다) 화면은 **켜진 칸만** 갈아 끼웁니다.
     ⚠️⚠️ 그래서 **눌림을 받는 자리도 같이 옮겼습니다** — 전에는 `bind()` 가
     `#cqlist` 안에서만 `[data-bd]` 를 집었습니다. 메뉴만 밖으로 빼고 그대로
     두었으면 **탭이 조용히 안 눌립니다**(에러 0줄). 지금은 `.cqw` 한 곳에서
     거품으로 올라오는 눌림을 **한 번만** 묶습니다(`bindNav()`) — 다시 그릴
     때마다 묶으면 한 번 눌렀는데 호출이 여러 번 돕니다. */
  /* ⚠️⚠️⚠️ **시안 ⑩ 의 대표 탭입니다 — 게시판 열둘은 하나도 안
     없어졌습니다.** 탭은 **묶어 보여 주는 길**이고, 열둘 전부와 그
     `?s=<키>` 주소는 그대로 살아 있으며 「전체 게시판」이 그 입구입니다.
     줄이면 그 키로 **이미 올라온 글이 갈 자리가 없어집니다**(0059).
     ⚠️ 어느 탭에도 안 든 넷(골프 정보 · 대회 · 이벤트 · 동호회 · 여성
     골퍼)은 시안의 탭에 없는 자리라 억지로 끼우지 않았습니다 — 끼우면
     그 탭의 이름이 거짓이 됩니다. 「전체 게시판」에서 들어갑니다.
     ⚠️ 묶음은 `js/data/catalog.js` 의 `AM_CQ_TABS` **한 곳**입니다. */
  function bar(){
    var picked = boardKeys();
    var now = (S.s !== "boards" && window.amCqTabOf) ? window.amCqTabOf(picked) : null;
    var tab = function(name, to, on){
      return '<a class="chip cqtab' + (on ? " chip-on" : "") + '" href="' +
        esc(url({ s:to, q:"", p:0 })) + '" data-bd="' + esc(to) + '">' +
        esc(name) + '</a>';
    };
    var tabs = (window.amCqTabs ? window.amCqTabs() : []).map(function(t){
      return tab(t.name, (t.boards || []).join(","), !!now && now.key === t.key);
    }).join("");
    return '<div class="sf-c cqb-c">' + tabs +
      tab("전체 게시판", "boards", S.s === "boards") + '</div>';
  }

  /* 시안 ⑩ 의 「최신글 / 질문」 — ⚠️⚠️ **둘은 다른 축입니다.**
     목록은 늘 **올린 날짜 최신순**이라 「최신글」이 곧 기본이고,
     「질문」은 **질문 게시판으로 좁히는** 칸입니다(지시가 그렇게
     갈라 적었습니다). 그래서 「질문」을 누르면 위의 대표 탭도
     「질문 · 답변」으로 같이 켜집니다 — 같은 것을 가리키니까요.
     ⚠️ 좁히는 게시판 키는 `AM_CQ_ASK` **한 곳**입니다. */
  function askKey(){ return window.AM_CQ_ASK || "cm-ask"; }
  function sortRow(){
    var k = boardKeys();
    var onQ = (k.length === 1 && k[0] === askKey());
    var back = onQ ? "" : (S.s === "boards" ? "boards" : S.s);
    return '<div class="sf-c cqsort">' +
      '<a class="chip' + (onQ ? "" : " chip-on") + '" href="' +
        esc(url({ s:back, q:"", p:0 })) + '" data-bd="' + esc(back) + '">최신글</a>' +
      '<a class="chip' + (onQ ? " chip-on" : "") + '" href="' +
        esc(url({ s:askKey(), q:"", p:0 })) + '" data-bd="' + esc(askKey()) +
        '">질문</a>' +
      '<span class="cqsort-n">' +
        esc(onQ ? "질문 게시판 글만 봅니다." : "올린 날짜 최신순입니다.") +
      '</span></div>';
  }

  /* 메뉴를 제 자리에 다시 그립니다 — 켜진 칸만 바뀝니다.
     ⚠️ 그 자리가 없으면(옛 빌드) 조용히 넘어갑니다 — 빌드가 찍은
     메뉴가 그대로 서 있습니다. */
  function paintBd(){
    var el = document.getElementById("cqbd");
    if(el) el.innerHTML = bar();
  }
  var NAVBOUND = false;
  function bindNav(){
    if(NAVBOUND) return;
    var w = document.querySelector(".cqw");
    if(!w) return;
    w.addEventListener("click", function(e){
      var a = e.target && e.target.closest ? e.target.closest("a[data-bd]") : null;
      if(!a || !w.contains(a)) return;
      e.preventDefault();
      go({ s:a.getAttribute("data-bd"), q:"", p:0 });
    });
    NAVBOUND = true;
  }

  /* ── 목록 ──────────────────────────────────────────────────────── */
  /* ⚠️⚠️ 시안 ⑩ 의 줄 — 왼쪽에 게시판 딱지 · 제목 · 글쓴이,
     오른쪽에 **작은 사진**입니다.
     ⚠️ 사진이 없거나 버킷이 꺼져 있으면 **그 자리를 아예 안 냅니다** —
     빈 액자를 두면 "사진이 안 뜬다" 로 보이고, 남의 사진이나 분류
     사진을 깔면 그 글의 사진인 것처럼 보입니다(절대 규칙 1 · 0068). */
  function thumbOf(q){
    if(!(Number(q.photo_n) > 0) || !q.thumb) return "";
    var u = window.amPubUrl ? window.amPubUrl(CONF, q.thumb) : "";
    if(!u) return "";
    /* ⚠️ alt 는 **빈 글자**입니다 — 바로 옆에 제목이 있어 읽어 주면
       같은 말을 두 번 듣습니다(꾸밈 그림). */
    return '<a class="cqr-ph" href="' + esc(url({ q:q.id, p:S.p })) +
      '" data-qid="' + esc(q.id) + '" tabindex="-1" aria-hidden="true">' +
      '<img src="' + esc(u) + '" alt="" loading="lazy" decoding="async">' +
    '</a>';
  }
  function row(q){
    return '<li class="cqr">' +
      '<div class="cqr-in">' +
        '<p class="cqr-top">' +
          '<span class="cqr-bd">' + esc(bname(q.cat)) + '</span>' +
          (Number(q.photo_n) > 0
            ? '<span class="cqr-pn">사진 ' + esc(num(q.photo_n)) + '</span>' : '') +
        '</p>' +
        '<a class="cqr-t" href="' + esc(url({ q:q.id, p:S.p })) +
          '" data-qid="' + esc(q.id) + '">' + esc(q.title) + '</a>' +
        '<p class="cqr-m">' +
          '<span>' + esc(q.who) + '</span>' +
          '<span>' + esc(when(q.created_at)) + '</span>' +
          '<span>댓글 ' + esc(num(q.answer_n)) + '</span>' +
          /* ⚠️ "조회" 가 아니라 **회원 조회** 입니다 (위 머리말) */
          '<span>회원 조회 ' + esc(num(q.view_n)) + '</span>' +
        '</p>' +
      '</div>' +
      thumbOf(q) +
    '</li>';
  }
  function pager(total, got){
    /* ⚠️⚠️ **쪽 수를 지어내지 않습니다** — 몇 줄인지 알 때만 "N쪽 가운데
       M쪽" 을 적고, 모르면 이전 · 다음만 냅니다. */
    var last = (total === null) ? null : Math.max(0, Math.ceil(total / PER) - 1);
    var hasNext = (last === null) ? (got >= PER) : (S.p < last);
    if(S.p === 0 && !hasNext) return "";
    return '<div class="cqp">' +
      (S.p > 0
        ? '<a class="btn btn-sm btn-line" href="' + esc(url({ p:S.p - 1 })) +
          '" data-pg="' + String(S.p - 1) + '">이전</a>'
        : '') +
      '<span class="cqp-n">' +
        (last === null ? String(S.p + 1) + "쪽"
                       : String(S.p + 1) + " / " + String(last + 1) + "쪽") +
      '</span>' +
      (hasNext
        ? '<a class="btn btn-sm btn-line" href="' + esc(url({ p:S.p + 1 })) +
          '" data-pg="' + String(S.p + 1) + '">다음</a>'
        : '') +
    '</div>';
  }
  /* ⚠️⚠️ **묶은 자리는 그 자리에서 말합니다** — 「라운드 후기」가 어느
     게시판을 모아 보는지 안 적으면 손님은 제가 무엇을 보고 있는지
     모르고, 글을 올릴 때 **어느 게시판에 올라가는지도** 모릅니다. */
  function head(){
    var keys = boardKeys();
    var tab  = (S.s !== "boards" && window.amCqTabOf) ? window.amCqTabOf(keys) : null;
    var names = (tab && window.amCqTabBoardNames) ? window.amCqTabBoardNames(tab) : [];
    /* ⚠️⚠️⚠️ **대표 탭에 없는 묶음으로도 들어옵니다** — 머리말의
       「골프 정보 · 후기」가 게시판 **넷**을 한 번에 보냅니다(2026-11-09).
       그때 어느 탭도 안 켜지므로, 무엇으로 좁혔는지는 **제목과 이 줄이
       말해야** 합니다. 안 적으면 손님은 걸린 조건을 알 길이 없습니다
       (검사가 잡았습니다 — 탭으로 바꾸면서 생긴 자리입니다). */
    var keyNames = keys.map(bname).filter(Boolean);
    var title = (S.s === "boards") ? "전체 게시판"
              : (tab ? tab.name
                     : (keys.length > 1 ? "게시판 " + keys.length + "곳"
                        : (keys.length ? keyNames[0] : "전체글")));
    var note = "";
    if(S.s === "boards"){
      note = '<p class="cqh-m">게시판 ' + esc(String(boards().length)) +
             '곳을 모두 보여 드립니다. 게시판 이름을 누르면 그 글만 봅니다.</p>';
    }else if(names.length > 1){
      note = '<p class="cqh-m">' + esc(names.join(" · ")) +
             ' 게시판을 모아 봅니다.</p>';
    }else if(!tab && keyNames.length > 1){
      note = '<p class="cqh-m">' + esc(keyNames.join(" · ")) +
             ' 게시판을 모아 봅니다.</p>';
    }
    return '<h2 class="cqh-t">' + esc(title) + '</h2>' + note;
  }
  /* ⚠️⚠️⚠️ **조회 실패는 0건이 아닙니다.** 그물이 끊기거나 질의가
     거절되면 받은 줄은 0줄이지만, 그것을 「아직 작성된 글이 없습니다」로
     적으면 **세어 본 것처럼** 말하는 것입니다(절대 규칙 1). 더 나쁜 것은
     「첫 이야기 작성」으로 보내는 것입니다 — 글이 있는데도 안 보이는
     분께 글을 또 쓰라고 하는 꼴입니다.
     ⚠️ 그래서 **다른 상자 · 다른 말 · 다시 시도 단추**입니다.
     ⚠️ 설정 이름(SUPABASE…)은 손님 화면에 한 글자도 안 적습니다
     (절대 규칙 3 — 그건 `console.warn` 몫입니다). */
  function failBox(what){
    return '<div class="none cqfail">' +
      '<p class="cqnone-i">' + window.icon("info") + '</p>' +
      '<h3>지금 ' + esc(what) + '을 불러오지 못했습니다</h3>' +
      '<p>글이 없다는 뜻이 <b>아닙니다.</b> 잠시 뒤에 다시 눌러 주세요. ' +
      '계속 같으면 고객센터로 알려 주세요.</p>' +
      '<p class="cqfail-b">' +
        '<button type="button" class="btn btn-pt cq-retry">다시 시도</button>' +
        '<a class="btn btn-bad" href="/help">고객센터</a>' +
      '</p>' +
    '</div>';
  }
  function zero(){
    /* ⚠️⚠️ 0건은 고장이 아닙니다 — 그리고 **막다른 길로 두지 않습니다**
       (절대 규칙 2). 지시서 §3 의 문구를 그대로 씁니다. */
    return '<div class="none cqnone">' +
      '<p class="cqnone-i">' + window.icon("chat") + '</p>' +
      '<h3>아직 작성된 글이 없습니다</h3>' +
      '<p>첫 번째로 골프 이야기를 남겨보세요. ' +
      esc((S.s && S.s !== "all") ? bname(S.s) : "커뮤니티") + '에 올라온 글이 ' +
      '<b>0건</b>이고, 지어낸 글을 채우지 않습니다.</p>' +
      '<button type="button" class="btn btn-pt cq-new">첫 이야기 작성</button>' +
    '</div>';
  }

  /* ⚠️⚠️ **검색은 서버가 합니다** (지시서 C). 한 쪽(20건)만 받아 화면에서
     거르면, 찾으시는 글이 그 20건 밖에 있을 때 **0건으로 보입니다**
     (조인 · 중고 거르개에서 적어 둔 그 자리).
     ⚠️ 제목으로만 찾습니다 — 본문까지 긁으면 느리고, 무엇으로 찾았는지도
     흐려집니다. 그 사실을 **칸 옆에서** 말합니다.
     ⚠️⚠️ 글자를 그대로 질의에 넣지 않습니다 — `*` · `,` · `)` 는
     PostgREST 가 뜻으로 읽습니다. 빼고 보냅니다. */
  function qSafe(t){
    return String(t || "").replace(/[*,()%]/g, " ").trim().slice(0, 40);
  }
  function searchBox(){
    /* ⚠️⚠️ 시안 ⑩ 의 한 줄 — 찾는 칸이 넓게 깔리고 **오른쪽 끝에
       글쓰기**입니다. 폰에서는 글쓰기가 아래로 내려갑니다(CSS).
       ⚠️ 돋보기는 칸 **안쪽 왼쪽**이고 글자가 그 위에 겹치지 않게
       `padding-left` 를 줍니다 (레슨 찾는 칸에서 겪은 특정도 자리). */
    return '<div class="cqtb">' +
      '<form class="cqs" id="cqs">' +
        '<label for="cq-q" class="sr-only">글 제목으로 찾기</label>' +
        '<span class="cqs-i" aria-hidden="true">' + window.icon("search") + '</span>' +
        '<input id="cq-q" name="q" type="search" maxlength="40" ' +
        'placeholder="커뮤니티 글 검색 (예: 아이언, 퍼팅, 라운드)" value="' +
        esc(S.q2 || "") + '">' +
        '<button type="submit" class="btn btn-line btn-sm">찾기</button>' +
        (S.q2
          ? '<button type="button" class="btn btn-bad btn-sm cqs-x">조건 지우기</button>'
          : '') +
      '</form>' +
      '<button type="button" class="btn btn-pt cq-new cqtb-new">' +
        window.icon("chat") + '글쓰기</button>' +
    '</div>';
  }

  function paintList(){
    list.innerHTML = head() + sortRow() + searchBox() +
      '<p class="cqz">불러오는 중입니다…</p>';
    var qs = ["select=id,cat,title,who,named,created_at,answer_n,view_n," +
              /* ⚠️ 0075 가 더한 칸 — 첫 사진 한 장입니다. 안 받으면
                 글 스무 줄마다 사진을 따로 물어보게 됩니다(0068). */
              "photo_n,thumb",
              "order=created_at.desc",
              "limit=" + String(PER), "offset=" + String(S.p * PER)];
    /* ⚠️⚠️ **쉼표로 여럿 받습니다** (2026-11-09 · 머리말 하위 메뉴).
       「골프 정보 · 후기」는 게시판 **넷**(골프 정보 · 골프장 후기 ·
       레슨 후기 · 장비 후기)이라, 하나만 좁히면 메뉴가 "후기" 를 말해
       놓고 후기를 안 냅니다. `js/search.js` 가 `sub` 에 하는 것과 **같은
       규칙**입니다.
       ⚠️ 거르는 것은 **서버**입니다 — 스무 줄만 받아 화면에서 거르면
       그 스무 줄 밖의 글이 영영 안 나옵니다. */
    var bds = boardKeys();
    if(bds.length === 1) qs.push("cat=eq." + encodeURIComponent(bds[0]));
    else if(bds.length)  qs.push("cat=in.(" + bds.map(encodeURIComponent).join(",") + ")");
    /* ⚠️ 찾는 글자가 있으면 **서버에서** 좁힙니다 (ilike) */
    var qw = qSafe(S.q2);
    if(qw) qs.push("title=ilike.*" + encodeURIComponent(qw) + "*");
    return get("v_cq_public?" + qs.join("&"), true).then(function(r){
      /* ⚠️⚠️ **못 읽은 것을 0건으로 읽지 않습니다** — 갈라서 적습니다. */
      if(r.failed){
        list.innerHTML = head() + sortRow() + searchBox() + failBox("글목록");
        bind();
        return;
      }
      var rows = r.rows;
      /* ⚠️⚠️ 0건을 **두 가지로 갈라** 말합니다 — 아직 아무도 안 썼다와
         찾으시는 글자에 맞는 것이 없다는 다른 말입니다 (조인에서 적어
         둔 그 자리). 섞으면 "글이 없다" 고 잘못 읽힙니다. */
      var none = qw
        ? '<div class="none"><h3>찾으시는 글이 없습니다.</h3>' +
          '<p><b>' + esc(qw) + '</b> 가 제목에 든 글이 0건입니다. ' +
          '다른 낱말로 찾아보시거나 조건을 지워 보세요.</p></div>'
        : zero();
      list.innerHTML = head() + sortRow() + searchBox() +
        (rows.length ? '<ul class="cql">' + rows.map(row).join("") + '</ul>' : none) +
        (rows.length ? pager(r.total, rows.length) : "");
      bind();
    });
  }

  /* ── 게시판 모아보기 (첫 화면) ──────────────────────────────────
     ⚠️⚠️ 게시판마다 **최신 셋**을 모아 보여 줍니다 — 게시판이 열둘이라
     목록 하나만 내면 어느 게시판이 살아 있는지 알 길이 없습니다.
     ⚠️⚠️⚠️ **0건인 게시판을 숨기지 않습니다.** 숨기면 그 게시판에 첫
     글을 남길 길이 사라지고(막다른 길 · 절대 규칙 2), 숨은 게시판이
     글쓰기 고르개에는 나와서 두 화면이 다른 말을 합니다.
     ⚠️ 글 수는 `content-range` 가 알려 줄 때만 적습니다 — 모르면 안
     적습니다(지어내지 않습니다). */
  function bdRow(q){
    return '<li>' +
      '<a class="cqg-t" href="' + esc(url({ s:q.cat, q:q.id, p:0 })) +
        '" data-qid="' + esc(q.id) + '">' + esc(q.title) + '</a>' +
      '<span class="cqg-w">' + esc(q.who) + '</span>' +
      '<span class="cqg-d">' + esc(when(q.created_at)) + '</span>' +
    '</li>';
  }
  function bdBox(x){
    return '<section class="cqg-b">' +
      '<h3 class="cqg-h">' +
        '<a href="' + esc(url({ s:x.b.key, q:"", p:0 })) + '" data-bd="' +
          esc(x.b.key) + '">' + esc(x.b.name) + '</a>' +
        (x.total === null ? "" :
          '<span class="cqg-n">' + esc(num(x.total)) + '</span>') +
        '<a class="cqg-more" href="' + esc(url({ s:x.b.key, q:"", p:0 })) +
          '" data-bd="' + esc(x.b.key) + '">더 보기</a>' +
      '</h3>' +
      (x.failed
        /* ⚠️⚠️ **못 읽은 칸에 「아직 글이 없습니다」를 적으면 거짓말입니다** */
        ? '<p class="cqz cqz-fail">지금 불러오지 못했습니다 — 글이 없다는 ' +
          '뜻이 아닙니다. ' +
          '<button type="button" class="btn btn-sm btn-line cq-retry">다시 시도</button></p>'
      : x.rows.length
        ? '<ul class="cqg-l">' + x.rows.map(bdRow).join("") + '</ul>'
        /* ⚠️ 0건은 고장이 아닙니다 — 그리고 첫 글을 남길 길을 같이 냅니다 */
        : '<p class="cqz">아직 글이 없습니다. ' +
          '<button type="button" class="btn btn-sm btn-line cq-new" ' +
          'data-bdnew="' + esc(x.b.key) + '">첫 글 작성하기</button></p>') +
    '</section>';
  }
  function paintHome(){
    list.innerHTML = head() +
      '<p class="cqz">불러오는 중입니다…</p>';
    var bs = boards();
    return Promise.all(bs.map(function(b){
      return get("v_cq_public?select=id,cat,title,who,created_at" +
                 "&cat=eq." + encodeURIComponent(b.key) +
                 "&order=created_at.desc&limit=3", true)
        .then(function(r){
          return { b:b, rows:r.rows, total:r.total, failed:!!r.failed };
        });
    })).then(function(all){
      /* ⚠️⚠️ 게시판이 **전부** 실패했으면 그물이 끊긴 것입니다 —
         상자 열두에 「0건」을 줄줄이 적지 않고 한 번만 말합니다.
         일부만 실패했으면 **그 게시판 칸에만** 적습니다(`bdBox`). */
      if(all.length && all.every(function(x){ return x.failed; })){
        list.innerHTML = head() + searchBox() + failBox("게시판");
        bind();
        return;
      }
      list.innerHTML = head() + searchBox() +
        '<div class="cqg">' + all.map(bdBox).join("") + '</div>';
      bind();
    });
  }

  /* ── 상세 ──────────────────────────────────────────────────────── */
  /* ── 글에 붙은 사진 (0059) ──────────────────────────────────────
     ⚠️⚠️ 주소는 **서버가 짓습니다**(`/api/upload?cqq=`) — 브라우저는
     버킷 이름을 모르고, 알게 하면 그것이 화면에 박힙니다.
     ⚠️ 버킷이 꺼져 있으면 서버가 빈 배열을 돌려줍니다 — 그러면 이
     구간이 **줄째 빠집니다**(절대 규칙 2). */
  function cqPhotos(q){
    return fetch("/api/upload?cqq=" + encodeURIComponent(q), {
      headers:{ accept:"application/json" }
    }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ return (j && Array.isArray(j.photos)) ? j.photos : []; })
      .catch(function(){ return []; });
  }
  function photos(rows, mine){
    if(!rows.length) return "";
    return '<ul class="cqd-ph">' + rows.map(function(f){
      return '<li data-fid="' + esc(f.id) + '">' +
        '<img src="' + esc(f.url) + '" alt="' +
        esc(f.caption || "글에 붙은 사진") + '" loading="lazy" decoding="async">' +
        (f.caption ? '<p class="cqd-cap">' + esc(f.caption) + '</p>' : '') +
        /* ⚠️ 빼는 단추는 **글쓴이에게만** 냅니다 (문도 남을 거절합니다) */
        (mine ? '<button type="button" class="btn btn-sm btn-bad cq-ph-x">' +
                '이 사진 빼기</button>' : '') +
      '</li>';
    }).join("") + '</ul>';
  }
  /* ⚠️⚠️ **버킷이 꺼져 있으면 칸을 아예 안 냅니다** — 그리면 눌러도
     아무 일이 안 나는 칸입니다(0051 에서 적어 둔 그 자리).
     ⚠️ 사진은 **글을 올린 뒤에** 붙입니다 — 경로에 글 id 가 들어가므로
     (`cq/<글>/photo/…`) 글이 먼저 있어야 합니다. 화면이 그 사실을 적습니다. */
  function phBox(q){
    if(!CQPH || !q.mine) return "";
    var n = Number(q.photo_n) || 0;
    return '<div class="cqd-up">' +
      '<p class="cqd-h">사진 붙이기</p>' +
      '<p class="jhint">다섯 장까지 · 한 장에 8MB 까지 · JPG · PNG · WEBP' +
      (n > 0 ? ' · 지금 ' + esc(String(n)) + '장' : '') + '</p>' +
      (n >= 5
        ? '<p class="cqz">다섯 장이 다 찼습니다. 먼저 한 장을 빼 주세요.</p>'
        /* ⚠️ `image/*` 라야 폰에서 **카메라 · 갤러리**가 같이 나옵니다 —
           진짜 사진인지는 `js/imgprep.js` 가 첫 바이트로 봅니다. */
        : '<input type="file" class="cq-ph-f" accept="image/*">' +
          '<button type="button" class="btn btn-sm btn-pt cq-ph-go">올리기</button>') +
      '<p class="jmsg cq-ph-m" hidden></p>' +
    '</div>';
  }
  function comments(rows){
    if(!rows.length) return '<p class="cqz">아직 댓글이 없습니다.</p>';
    return '<ul class="cal">' + rows.map(function(c){
      return '<li data-cid="' + esc(c.id) + '">' +
        '<p class="cal-m">' + esc(c.who) +
          (c.by_asker ? ' <span class="cal-w">글쓴이</span>' : '') +
          ' · ' + esc(when(c.created_at)) + '</p>' +
        '<p class="cal-b">' + esc(c.body) + '</p>' +
        /* ⚠️ 본인 댓글에만 냅니다 — 보기가 `mine` 으로 알려 줍니다 */
        (c.mine
          ? '<div class="cal-act">' +
              '<button type="button" class="btn btn-sm btn-line ca-edit">고치기</button>' +
              '<button type="button" class="btn btn-sm btn-bad ca-drop">내리기</button>' +
            '</div>'
          : '') +
      '</li>';
    }).join("") + '</ul>';
  }

  function paintOne(){
    list.innerHTML = '<p class="cqz">불러오는 중입니다…</p>';
    var one = "v_cq_public?select=id,cat,title,body,who,named,created_at,updated_at," +
              "answer_n,view_n,photo_n,mine,guest&id=eq." + encodeURIComponent(S.q) + "&limit=1";
    return Promise.all([
      get(one),
      get("v_ca_public?select=id,who,named,body,created_at,by_asker,mine" +
          "&q_id=eq." + encodeURIComponent(S.q) + "&order=created_at.asc&limit=200"),
      cqPhotos(S.q)
    ]).then(function(r){
      /* ⚠️⚠️ 못 읽은 것을 **「그 글을 찾을 수 없습니다」로 읽지 않습니다** —
         그쪽은 「내려갔거나 운영자가 가린 글」이라고 **단정**합니다. */
      if(r[0].failed){
        list.innerHTML = failBox("글");
        bind();
        return;
      }
      var q = (r[0].rows || [])[0];
      if(!q){
        /* ⚠️ 없는 글 · 내려간 글 — 막다른 길로 두지 않습니다 */
        list.innerHTML = '<div class="none">' +
          '<h3>그 글을 찾을 수 없습니다.</h3>' +
          '<p>내려갔거나 운영자가 가린 글일 수 있습니다.</p>' +
          '<a class="btn btn-pt" href="' + esc(url({ q:"", p:0 })) +
          '" data-back="1">목록으로</a></div>';
        bind();
        return;
      }
      list.innerHTML =
        '<article class="cqd">' +
          '<h2 class="cqd-t">' + esc(q.title) + '</h2>' +
          '<p class="cqd-m">' +
            '<span class="cqr-bd">' + esc(bname(q.cat)) + '</span>' +
            '<span>' + esc(q.who) + '</span>' +
            '<span>' + esc(when(q.created_at)) + '</span>' +
            /* ⚠️⚠️ **고친 날은 고쳤을 때만 냅니다** (지시서 C 의 "수정일") —
               `updated_at` 은 만들 때도 `now()` 라 안 고친 글도 값이
               있습니다. 그대로 찍으면 모든 글에 "고친 날" 이 붙어 **안
               고친 글을 고쳤다고** 말하게 됩니다 (절대 규칙 5 · 2). */
            (q.updated_at && q.updated_at !== q.created_at
              ? '<span>고친 날 ' + esc(when(q.updated_at)) + '</span>' : "") +
            '<span>댓글 ' + esc(num(q.answer_n)) + '</span>' +
            '<span>회원 조회 ' + esc(num(q.view_n)) + '</span>' +
          '</p>' +
          '<div class="cqd-b">' + esc(q.body) + '</div>' +
          photos(r[2] || [], q.mine) + phBox(q) +
          '<div class="cqd-act">' +
            '<a class="btn btn-line" href="' + esc(url({ q:"", p:0 })) +
              '" data-back="1">목록으로</a>' +
            /* ⚠️⚠️ 고치기 · 내리기는 **본인에게만** 냅니다. 그려 두면
               눌러도 DB 가 거절하는 칸입니다 (절대 규칙 5). */
            (q.mine
              ? '<a class="btn btn-line" href="/my">내 정보에서 고치기</a>'
              : "") +
            (A && A.signedIn
              ? '<button type="button" class="btn btn-bad cq-rep">이 글 신고</button>'
              : "") +
          '</div>' +
          /* ⚠️⚠️ **비회원 글이면** 비밀번호로 고치고 내리는 자리를 냅니다
             (0063). 회원 글에는 안 냅니다 — 그려 두면 눌러도 DB 가
             거절하는 칸입니다 (절대 규칙 5). */
          (q.guest ? guestBox(q) : "") +
        '</article>' +
        '<section class="cqc-a">' +
          '<h3 class="cqd-h">댓글 ' + esc(num(q.answer_n)) + '</h3>' +
          comments(r[1].rows || []) +
          (A && A.signedIn ? aForm() : '<p class="cqz">댓글은 로그인하신 뒤에 ' +
            '다실 수 있습니다. <a class="btn btn-sm btn-line" href="' +
            esc(loginUrl()) + '">로그인하기</a></p>') +
        '</section>';
      bind();
      if(q.guest) bindGuest(q);
      /* ⚠️ 회원 조회를 **한 번** 셉니다 — 비로그인은 문이 조용히 0 을
         돌려줍니다(글은 보이는 것이 맞습니다). 제 글도 안 셉니다. */
      if(A && A.signedIn) call("view_cq", { question:S.q }).catch(function(){});
    });
  }


  /* ════════════════════════════════════════════════════════════════
     비회원 글 — 비밀번호로 고치기 · 내리기 (0063 · 지시서 C)

     ⚠️⚠️⚠️ **비밀번호는 여기서 맞춰 보지 않습니다.** 보내기만 하고,
     맞는지는 **문 안에서만** 압니다 (지시서: "프론트에서만 비밀번호
     확인하는 방식 금지"). 화면은 해시를 받을 길이 아예 없습니다.
     ⚠️ 거절하는 **그 말**을 그대로 보여 줍니다 — 우리가 지어서 적으면
     DB 가 왜 막았는지 알 수 없습니다.
     ⚠️⚠️ **내리는 것은 되돌릴 수 없습니다** — 한 번 여쭙습니다.
     ════════════════════════════════════════════════════════════════ */
  function guestBox(q){
    return '<div class="cqg" id="cqg">' +
      '<p class="jhint">이 글은 <b>로그인 없이</b> 올라온 글입니다. ' +
      '올리실 때 적어 두신 <b>글 비밀번호</b>로 고치거나 내리실 수 있습니다.</p>' +
      '<div class="cqg-go">' +
        '<button type="button" class="btn btn-line btn-sm cqg-e">고치기</button> ' +
        '<button type="button" class="btn btn-bad btn-sm cqg-d">내리기</button>' +
      '</div>' +
      /* ⚠️⚠️ **비밀번호를 잊으신 분이 설 자리**입니다 (지시서 C 의
         "관리자 문의 절차 마련"). 여기가 실제로 막히는 자리이므로
         글쓰기 화면뿐 아니라 **여기에도** 길을 냅니다 — 안 내면
         비밀번호를 잊은 분은 그 자리에서 막다른 길입니다 (절대 규칙 2).
         ⚠️ 운영자가 대신 고쳐 드리지는 않습니다 — **가릴 수만** 있습니다
         (`move_cq`). 할 수 없는 일을 할 수 있다고 적지 않습니다
         (절대 규칙 5). */
      '<p class="jhint cqg-lost">비밀번호를 잊으셨나요? 운영자가 ' +
      '<b>글을 가려 드릴 수는</b> 있습니다 (고쳐 드리지는 못합니다).</p>' +
      '<a class="btn btn-sm btn-line cqg-help" href="/help">고객센터에 알리기</a>' +
      '<div class="cqg-bx"></div>' +
    '</div>';
  }

  function guestForm(q, mode){
    var isEdit = (mode === "edit");
    return '<form class="jform cqg-f">' +
      (isEdit
        ? '<div class="jrow">' +
            '<label for="g-title">제목 <b>*</b></label>' +
            '<input id="g-title" name="title" required minlength="2" maxlength="80" ' +
            'value="' + esc(q.title) + '">' +
          '</div>' +
          '<div class="jrow jrow-full">' +
            '<label for="g-body">내용 <b>*</b></label>' +
            '<textarea id="g-body" name="body" rows="6" required minlength="5" ' +
            'maxlength="4000">' + esc(q.body) + '</textarea>' +
            /* ⚠️ 게시판 · 닉네임은 **못 고칩니다** — 그 사실을 그 자리에서
               말합니다. 칸을 내 두고 안 바뀌면 눌러도 소용없는 칸입니다. */
            '<span class="jhint">⚠️ 게시판과 닉네임은 바꿀 수 없습니다 — ' +
            '바꾸면 읽으시던 분이 다른 글을 보게 됩니다.</span>' +
          '</div>'
        : '<div class="jrow jrow-full">' +
            '<p class="jhint">⚠️ <b>내린 글은 되돌릴 수 없습니다.</b> ' +
            '목록과 검색에서 바로 빠집니다.</p>' +
          '</div>') +
      '<div class="jrow">' +
        '<label for="g-pw">글 비밀번호 <b>*</b></label>' +
        '<input id="g-pw" name="pw" type="password" required minlength="4" ' +
        'maxlength="64" autocomplete="current-password">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn ' + (isEdit ? "btn-pt" : "btn-bad") + '">' +
          (isEdit ? "고친 내용 저장" : "이 글 내리기") + '</button> ' +
        '<button type="button" class="btn btn-line cqg-x">그만두기</button>' +
        '<p class="jmsg cqg-m" hidden></p>' +
      '</div>' +
    '</form>';
  }

  function bindGuest(q){
    var wrap = document.getElementById("cqg");
    if(!wrap) return;
    var bx = wrap.querySelector(".cqg-bx");
    function open(mode){
      bx.innerHTML = guestForm(q, mode);
      var f = bx.querySelector(".cqg-f");
      var x = bx.querySelector(".cqg-x");
      if(x) x.addEventListener("click", function(){ bx.innerHTML = ""; });
      if(!f) return;
      f.addEventListener("submit", function(e){
        e.preventDefault();
        var msg = f.querySelector(".cqg-m");
        var btn = f.querySelector('button[type="submit"]');
        btn.disabled = true;
        msg.hidden = false; msg.textContent = "보내는 중입니다…";
        var door = (mode === "edit") ? "edit_cq_guest" : "drop_cq_guest";
        var pack = { id:q.id, pw:f.pw.value };
        if(mode === "edit"){ pack.title = f.title.value; pack.body = f.body.value; }
        /* ⚠️⚠️⚠️ **0065 — 이 문 둘만 예외를 안 씁니다.** 비밀번호가
           틀리면 그 시도를 **한 줄 적어야** 하는데, `raise exception`
           은 그 함수가 한 일을 **통째로 되돌립니다** — 적은 줄까지
           같이 사라져서 반복 시도를 셀 수가 없습니다. 그래서 비밀번호
           갈래만 **글자로 돌려주고** 여기서 말을 고릅니다.
           ⚠️ 나머지 거절(없는 글 · 이미 내려간 글 · 길이)은 **그대로
           예외**라 아래 `catch` 가 받습니다. */
        call(door, pack).then(function(r){
          var code = String(r === null || r === undefined ? "" : r);
          if(code === "bad_pw"){
            btn.disabled = false;
            msg.textContent = "비밀번호가 맞지 않습니다.";
            return;
          }
          if(code === "blocked"){
            btn.disabled = false;
            msg.textContent = "비밀번호를 여러 번 틀리셨습니다. " +
              "잠시 뒤에 다시 해 주세요.";
            return;
          }
          if(mode === "edit"){ go({ q:q.id }); return; }
          /* ⚠️ 내린 뒤에는 그 글이 **없습니다** — 목록으로 돌려보냅니다 */
          go({ q:"", p:S.p });
        }).catch(function(err){
          btn.disabled = false;
          /* ⚠️⚠️ DB 가 거절한 **그 말** 그대로 (이미 내려간 글입니다 …) */
          msg.textContent = String((err && err.message) || "보내지 못했습니다.");
        });
      });
    }
    var be = wrap.querySelector(".cqg-e");
    var bd = wrap.querySelector(".cqg-d");
    if(be) be.addEventListener("click", function(){ open("edit"); });
    if(bd) bd.addEventListener("click", function(){ open("drop"); });
  }

  function aForm(){
    return '<form class="jform caf">' +
      '<div class="jrow jrow-full">' +
        '<label for="ca-body">댓글 <b>*</b></label>' +
        '<textarea id="ca-body" name="body" rows="3" required minlength="5" ' +
        'maxlength="4000" placeholder="다섯 글자 이상 적어 주세요."></textarea>' +
        /* ⚠️ 연락처를 적지 말라고 **적는 그 자리에서** 말합니다 */
        '<span class="jhint">⚠️ 전화번호 · 아이디 같은 연락처는 적지 마세요. ' +
        '이 글은 <b>누구나 봅니다.</b></span>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">댓글 달기</button>' +
        '<p class="jmsg cafm" hidden></p>' +
      '</div>' +
    '</form>';
  }

  /* ── 글쓰기 양식 ────────────────────────────────────────────────── */
  function askForm(pick){
    var GUEST = !(A && A.signedIn);
    /* ⚠️⚠️ 고르개는 **게시판 일곱**입니다 (위 머리말 — 전에는 분류 열을
       내서 자유게시판을 고를 수가 없었습니다).
       ⚠️ 지시서는 분류를 **선택**으로 적었지만 `ask_cq`(0047)가 필수로
       막습니다 — 못 막는 것을 막는다고 적지 않고, 막는 것을 선택이라고도
       적지 않습니다. 그래서 보고 있는 게시판을 **미리 골라** 둡니다. */
    /* ⚠️ 보고 있는 게시판(또는 누르신 게시판)을 미리 골라 둡니다.
       "전체 글"(all)은 게시판이 아니므로 **안 고릅니다**. */
    var on = pick || (S.s === "all" ? "" : S.s);
    var opt = boards().map(function(b){
      return '<option value="' + esc(b.key) + '"' +
        (on === b.key ? " selected" : "") + '>' + esc(b.name) + '</option>';
    }).join("");
    /* ⚠️⚠️⚠️ **비회원도 씁니다** (0063 · 지시서 C). 로그인한 분은 닉네임이
       계정에 있고 주인이 계정이지만, 비회원 글은 **주인을 가리는 것이
       글 비밀번호 하나뿐**입니다. 그래서 그 자리에서 —
         · 비밀번호를 **왜** 받는지 적고
         · **잊으면 직접 고치거나 내릴 수 없다**는 것을 미리 말하고
         · 그때 어디로 가면 되는지(고객센터)까지 냅니다
       ⚠️ 말없이 비밀번호만 받으면, 잊으신 분은 막다른 길에 섭니다
       (절대 규칙 2). */
    var gf = GUEST
      ? '<div class="jrow">' +
          '<label for="c-nick">닉네임 <b>*</b></label>' +
          '<input id="c-nick" name="nick" required minlength="2" maxlength="16" ' +
          'placeholder="보기: 주말골퍼">' +
          '<span class="jhint">글에 <b>이 이름이 공개</b>됩니다. ' +
          '본명 · 연락처를 넣지 마세요.</span>' +
        '</div>' +
        '<div class="jrow">' +
          '<label for="c-pw">글 비밀번호 <b>*</b></label>' +
          '<input id="c-pw" name="pw" type="password" required minlength="4" ' +
          'maxlength="64" autocomplete="new-password" placeholder="4자 이상">' +
          '<span class="jhint">나중에 <b>고치거나 내릴 때</b> 쓰십니다. ' +
          '⚠️ 잊으시면 <b>직접 고치거나 내릴 수 없습니다</b> — ' +
          '그때는 고객센터로 알려 주세요.</span>' +
          /* ⚠️⚠️ **가는 길을 같이 냅니다** (지시서 C 의 "관리자 문의
             절차 마련"). 글로만 "고객센터로" 라고 적어 두면 어디로
             가야 하는지 알 길이 없어 막다른 길입니다 (절대 규칙 2).
             ⚠️ 문장 한가운데가 아니라 **문단 끝에 단추로** 둡니다
             (문장 속 링크는 높이가 16px 라 손가락으로 못 누릅니다). */
          '<a class="btn btn-sm btn-line cqg-help" href="/help">고객센터</a>' +
        '</div>' +
        /* ⚠️⚠️ **허니팟** — 사람에게는 안 보이고 자동 프로그램만 채웁니다.
           채워져 있으면 문이 거절합니다. `hidden` 이 아니라 화면 밖으로
           보냅니다(`hidden` 이면 채우는 쪽도 건너뜁니다). */
        '<div class="sr-only" aria-hidden="true">' +
          '<label for="c-site">website</label>' +
          '<input id="c-site" name="website" tabindex="-1" autocomplete="off">' +
        '</div>'
      : '';
    return '<form id="cqf" class="jform">' + gf +
      '<div class="jrow">' +
        '<label for="c-cat">게시판 <b>*</b></label>' +
        '<select id="c-cat" name="cat" required>' +
          '<option value="">고르세요</option>' + opt +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="c-title">제목 <b>*</b></label>' +
        '<input id="c-title" name="title" required minlength="2" maxlength="80" ' +
        'placeholder="보기: 주말 라운딩 다녀왔습니다">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="c-body">내용 <b>*</b></label>' +
        '<textarea id="c-body" name="body" rows="6" required minlength="5" ' +
        'maxlength="4000" placeholder="하시고 싶은 이야기를 적어 주세요."></textarea>' +
        /* ⚠️⚠️⚠️ **고치는 길이 둘로 갈립니다** — 회원 글은 `/my` 에
           있지만 **비회원 글은 거기 없습니다**(계정에 안 묶입니다).
           한 가지로 적어 두었다가 비회원에게 "내 정보에서 고치세요" 라고
           말할 뻔했습니다 — 가 보면 그 글이 없는 **막다른 길**이고,
           하지 않는 일을 한다고 적는 것입니다(절대 규칙 5 · 2). */
        '<span class="jhint">⚠️ 전화번호 · 아이디 같은 연락처는 적지 마세요. ' +
        '이 글은 <b>누구나 봅니다.</b> ' + (GUEST
          ? '올리신 글은 <b>그 글을 열고 비밀번호</b>를 넣어 고치거나 ' +
            '내리실 수 있습니다. ' +
            /* ⚠️⚠️ **DB 가 막는 것을 그 자리에서 미리 말합니다** (0065).
               안 적으면 손님은 다 적고 나서야 거절당합니다 — 그때
               적으신 글이 날아갑니다.
               ⚠️ "스팸을 막습니다" 라고 적지 않습니다 — 링크 하나짜리
               광고는 이 줄이 못 막습니다 (절대 규칙 5). 막는 것만
               그대로 적습니다. */
            '⚠️ 링크는 <b>둘까지</b> 넣으실 수 있습니다.'
          : '올리신 글은 내 정보 화면에서 고치거나 내리실 수 있습니다.') +
        '</span>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">글 올리기</button>' +
        '<p id="cqmsg" class="jmsg" hidden></p>' +
      '</div>' +
    '</form>';
  }

  function openWrite(pick){
    var box = document.getElementById("cqbox");
    if(!box) return;
    box.className = "jbox";
    /* ⚠️⚠️ 비회원이 누르면 **로그인 안내**를 내고, 로그인한 뒤 원래 보시던
       자리(게시판 · 쪽)로 돌아옵니다 (지시서 §2). */
    /* ⚠️⚠️⚠️ **로그인 안내를 더 내지 않습니다** (0063 · 지시서 C) —
       비회원도 닉네임 · 비밀번호로 올립니다. 전에는 여기서 로그인으로
       돌려보냈는데, 그러면 "로그인 없이 글쓰기" 가 **눌러도 아무 일이
       안 나는 단추**가 됩니다 (절대 규칙 5). */
    var GUEST = !(A && A.signedIn);
    box.innerHTML = '<h3 class="jbox-h">글쓰기</h3>' +
      (GUEST
        ? '<p class="jhint cq-gh">로그인 없이 올리실 수 있습니다. ' +
          '회원으로 올리시면 <b>내 정보</b>에서 비밀번호 없이 고치고 내리실 ' +
          '수 있습니다. <a class="cq-lg" href="' + esc(loginUrl()) + '">로그인하기</a></p>'
        : '') +
      askForm(pick);
    try{ box.scrollIntoView({ block:"start" }); }catch(e){ }
    var f = document.getElementById("cqf");
    if(!f) return;
    f.addEventListener("submit", function(e){
      e.preventDefault();
      var msg = document.getElementById("cqmsg");
      var btn = f.querySelector('button[type="submit"]');
      btn.disabled = true;
      msg.hidden = false; msg.textContent = "올리는 중입니다…";
      /* ⚠️⚠️ **문이 둘입니다** — 회원은 `ask_cq`, 비회원은 `ask_cq_guest`.
         비회원 쪽은 닉네임 · 비밀번호 · 허니팟을 같이 보냅니다.
         ⚠️ 비밀번호는 **보내기만** 합니다 — 맞춰 보는 일은 문 안에서만
         일어나고, 화면은 해시를 받을 길이 없습니다. */
      var door = GUEST ? "ask_cq_guest" : "ask_cq";
      var pack = { cat:f.cat.value, title:f.title.value, body:f.body.value };
      if(GUEST){
        pack.nick = f.nick.value;
        pack.pw = f.pw.value;
        pack.website = f.website ? f.website.value : "";
      }
      call(door, pack)
        .then(function(id){
          box.className = "none";
          /* ⚠️⚠️ **비회원을 `/my` 로 보내지 않습니다** — 거기에는 그 글이
             없습니다(계정에 안 묶입니다). 막다른 길로 두지 않고, 고치는
             길이 **글 안에 있다**고 그 자리에서 말합니다(절대 규칙 2). */
          /* ⚠️ 글자를 **먼저 짓고** 그다음 찍습니다 — `innerHTML` 줄에
             잇는 자리(+)가 있으면 `check-safe` 가 따라갈 함수를 찾는데,
             여기는 전부 저장소가 적은 글자라 따라갈 것이 없습니다. */
          var done = '<h3>글을 올렸습니다.</h3>' + (GUEST
            ? '<p>목록에 바로 보입니다. 고치거나 내리시려면 그 글을 열고 ' +
              '<b>적어 두신 비밀번호</b>를 넣으시면 됩니다.</p>'
            : '<p>목록에 바로 보입니다.</p>' +
              '<a class="btn btn-pt" href="/my">내 정보에서 고치기</a>');
          /* ⚠️ 잇는 자리(+)를 이 줄에 두지 않습니다 — 저장소가 적은
             글자뿐이라 `check-safe` 가 따라갈 함수가 없습니다. */
          box.innerHTML = done;
          /* ⚠️ 올린 글이 있는 게시판으로 옮겨 **그 글을 바로** 엽니다 */
          var nid = (typeof id === "string") ? id.replace(/"/g, "") : "";
          go({ s:f.cat.value, q:nid, p:0 });
        })
        .catch(function(err){
          btn.disabled = false;
          /* ⚠️ DB 가 거절한 **그 말**을 그대로 보여 줍니다 */
          msg.textContent = String((err && err.message) || "올리지 못했습니다.");
        });
    });
  }

  /* ── 눌림 ──────────────────────────────────────────────────────── */
  function bind(){
    Array.prototype.forEach.call(list.querySelectorAll("[data-qid]"), function(ln){
      ln.addEventListener("click", function(e){
        e.preventDefault(); go({ q:ln.getAttribute("data-qid") });
      });
    });
    Array.prototype.forEach.call(list.querySelectorAll("[data-pg]"), function(ln){
      ln.addEventListener("click", function(e){
        e.preventDefault(); go({ p:Number(ln.getAttribute("data-pg")) });
      });
    });
    Array.prototype.forEach.call(list.querySelectorAll("[data-back]"), function(ln){
      ln.addEventListener("click", function(e){
        e.preventDefault(); go({ q:"", p:S.p });
      });
    });
    /* ⚠️⚠️ 다시 시도 — 조회가 실패했을 때만 서는 단추입니다. 없으면
       손님은 **화면을 통째로 다시 여는 길밖에** 없습니다(막다른 길 ·
       절대 규칙 2). `draw()` 를 다시 부르므로 보고 있던 게시판 · 쪽 ·
       찾는 말이 그대로 살아 있습니다(주소에서 읽습니다). */
    Array.prototype.forEach.call(list.querySelectorAll(".cq-retry"), function(bt){
      bt.addEventListener("click", function(){
        bt.disabled = true;
        draw();
      });
    });
    /* 찾기 — ⚠️ 보고 있던 게시판은 그대로 두고 **쪽만 처음으로** */
    var sf = list.querySelector("#cqs");
    if(sf) sf.addEventListener("submit", function(e){
      e.preventDefault(); go({ q:"", q2:sf.q.value, p:0 });
    });
    var sx = list.querySelector(".cqs-x");
    if(sx) sx.addEventListener("click", function(){ go({ q:"", q2:"", p:0 }); });
    Array.prototype.forEach.call(list.querySelectorAll(".cq-new"), function(b){
      /* ⚠️ 모아보기의 0건 단추는 **그 게시판**으로 열어 둡니다 — 안 그러면
         "첫 글 작성하기" 를 눌렀는데 고르개가 비어서 다시 고르게 됩니다. */
      b.addEventListener("click", function(){
        openWrite(b.getAttribute("data-bdnew") || "");
      });
    });

    var rep = list.querySelector(".cq-rep");
    if(rep) rep.addEventListener("click", function(){
      var why = window.prompt("무엇이 문제인지 적어 주세요 (운영자만 봅니다)");
      if(!(why && why.trim())) return;
      rep.disabled = true;
      call("open_report", { kind:"abuse", question:S.q, body:why.trim() })
        .then(function(){ rep.textContent = "신고했습니다"; })
        .catch(function(err){
          rep.disabled = false;
          window.alert(String((err && err.message) || "신고하지 못했습니다."));
        });
    });

    var f = list.querySelector(".caf");
    if(f) f.addEventListener("submit", function(e){
      e.preventDefault();
      var msg = f.querySelector(".cafm");
      var sb = f.querySelector('button[type="submit"]');
      sb.disabled = true;
      msg.hidden = false; msg.textContent = "보내는 중입니다…";
      call("answer_cq", { q_id:S.q, body:f.body.value })
        .then(function(){ draw(); })
        .catch(function(err){
          sb.disabled = false;
          msg.textContent = String((err && err.message) || "달지 못했습니다.");
        });
    });

    /* ── 사진 붙이기 · 빼기 (0059) ─────────────────────────────────── */
    var pin = list.querySelector(".cq-ph-f");
    var pgo = list.querySelector(".cq-ph-go");
    if(pgo && pin) pgo.addEventListener("click", function(){
      var msg = list.querySelector(".cq-ph-m");
      var say = function(t){ if(msg){ msg.hidden = false; msg.textContent = t; } };
      var f = pin.files && pin.files[0];
      if(!f){ say("올리실 사진을 골라 주세요."); return; }
      /* ⚠️ 32MB — **고르실 수 있는 크기**이고 담기는 크기(8MB)와 다릅니다.
         아래에서 다시 그려 줄이므로 폰 사진이 그대로 막히지 않습니다. */
      if(f.size > 33554432){
        say("사진이 너무 큽니다 — 32MB 까지 고르실 수 있습니다."); return;
      }
      if(!window.amImgPrep){ say("사진을 준비하지 못했습니다."); return; }
      pgo.disabled = true;
      say("올리는 중입니다…");
      /* ⚠️⚠️⚠️ **올리기 전에 `js/imgprep.js` 를 지나갑니다** — 게시판 글
         사진도 **공개 버킷**으로 갑니다(주소만 알면 누구나 엽니다). 폰으로
         찍은 사진의 EXIF 에는 찍은 자리의 위도 · 경도가 들어 있어서, 그냥
         올리면 글쓴이의 집 좌표가 그대로 공개됩니다. 파일이 우리 서버를
         안 지나가므로 떼는 자리는 **브라우저뿐**이고, 못 떼면 **안
         올립니다**(원본을 그냥 올리면 그 한 장만 조용히 샙니다).
         ⚠️ 그래서 보내는 `mime` · `bytes` 는 **다시 그린 것**의 값입니다. */
      window.amImgPrep(f).then(function(pz){
        if(pz.bytes > 8388608) throw new Error("줄여도 8MB 를 넘습니다.");
        return fetch("/api/upload", {
          method:"POST",
          headers: Object.assign({ "content-type":"application/json" },
                                 window.amAuthHeaders ? window.amAuthHeaders() : {}),
          /* ⚠️⚠️ `cq:true` 로 **게시판 쪽 길**임을 말합니다. 버킷은 서버가
             DB 가 돌려준 **경로**로 고릅니다 (여기서 고르면 거기가 구멍입니다). */
          body: JSON.stringify({ cq:true, question:S.q,
                                 mime:pz.mime, bytes:pz.bytes })
        }).then(function(r){
          return r.json().then(function(j){ return { ok:r.ok, j:j }; });
        }).then(function(x){
          if(!x.ok || !x.j || !x.j.url)
            throw new Error((x.j && x.j.error) || "지금 올리지 못했습니다");
          /* ⚠️⚠️ **여기서 "올렸습니다" 라고 하지 않습니다** — 자리를 받은
             것이고 파일은 아직 안 갔습니다 (0051 에서 적어 둔 그 자리). */
          return fetch(x.j.url, { method:"PUT",
            headers:{ "content-type":pz.mime }, body:pz.blob });
        });
      }).then(function(r){
        if(!r || !r.ok) throw new Error("올리지 못했습니다");
        draw();
      }).catch(function(e){
        pgo.disabled = false;
        say(String((e && e.message) || "올리지 못했습니다."));
      });
    });

    Array.prototype.forEach.call(list.querySelectorAll(".cq-ph-x"), function(b){
      b.addEventListener("click", function(){
        /* ⚠️ 되돌릴 수 없는 일이라 한 번 여쭙습니다 */
        if(!window.confirm("이 사진을 뺍니다. 되돌릴 수 없습니다.")) return;
        b.disabled = true;
        call("drop_cq_photo", { id:b.closest("li").getAttribute("data-fid") })
          .then(function(){ draw(); })
          .catch(function(err){
            b.disabled = false;
            window.alert(String((err && err.message) || "빼지 못했습니다."));
          });
      });
    });

    Array.prototype.forEach.call(list.querySelectorAll(".ca-edit"), function(b){
      b.addEventListener("click", function(){
        var li = b.closest("li");
        var now = (li.querySelector(".cal-b") || {}).textContent || "";
        var next = window.prompt("댓글을 고칩니다", now);
        if(next === null) return;
        if(!next.trim()){ window.alert("내용을 적어 주세요."); return; }
        b.disabled = true;
        call("edit_ca", { id:li.getAttribute("data-cid"), body:next.trim() })
          .then(function(){ draw(); })
          .catch(function(err){
            b.disabled = false;
            window.alert(String((err && err.message) || "고치지 못했습니다."));
          });
      });
    });
    Array.prototype.forEach.call(list.querySelectorAll(".ca-drop"), function(b){
      b.addEventListener("click", function(){
        /* ⚠️ 되돌릴 수 없는 일이라 한 번 여쭙습니다 */
        if(!window.confirm("이 댓글을 내립니다. 되돌릴 수 없습니다.")) return;
        b.disabled = true;
        call("move_ca", { id:b.closest("li").getAttribute("data-cid"), to:"dropped" })
          .then(function(){ draw(); })
          .catch(function(err){
            b.disabled = false;
            window.alert(String((err && err.message) || "내리지 못했습니다."));
          });
      });
    });
  }

  function draw(){
    paintBd();
    bindNav();
    return (S.q ? paintOne()
            : (S.s === "boards" ? paintHome() : paintList())).catch(function(){
      /* ⚠️ 못 읽었으면 **0건이라고 말하지 않습니다** */
      list.innerHTML =
        '<p class="cqz">지금 불러오지 못했습니다. 잠시 뒤에 다시 열어 주세요.</p>';
    });
  }

  window.addEventListener("popstate", function(){ readUrl(); draw(); });

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[community] 로그인 · 접수가 설정되지 않아 게시판을 " +
        "열지 않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      /* ⚠️ 빌드가 찍어 둔 "아직 없는 것입니다" 를 그대로 두면
         0건이라고 말하는 것입니다 — 열지 않았다고 적습니다. */
      window.amShut("cqlist");
      return;                       /* 빌드가 찍어 둔 글 그대로 */
    }
    A = a;
    CONF = a.conf;
    readUrl();
    /* ⚠️⚠️ **버킷이 켜졌는지는 서버만 압니다** — 브라우저에 버킷 이름을
       내려보내지 않습니다. 못 물어봤으면 꺼진 것으로 두고(사진 칸을 안
       냅니다) 나머지는 그대로 그립니다 — 사진 때문에 게시판이 안 열리면
       안 됩니다. */
    fetch("/api/upload", { headers:{ accept:"application/json" } })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ CQPH = !!(j && j.cqPhoto); })
      .catch(function(){ CQPH = false; })
      .then(function(){ draw(); });
  }).catch(function(){ /* 못 물어봤으면 빌드가 찍은 글 그대로 */ });
})();

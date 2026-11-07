/* ════════════════════════════════════════════════════════════════════
   업체찾기 — /search 에서만 돕니다 (검색 · 거르개 · 비교)

   ⚠️⚠️ **열쇠는 셋입니다: q · cat · rg.** 머리말의 검색창이 name="q" 로
   보내고, 거르개 링크는 `?cat=` · `?rg=` 로 보냅니다. 여기서 읽는 것도
   같은 셋입니다 — 한쪽만 바꾸면 **아무것도 안 걸렀는데 화면은 열립니다**
   (앞 서비스의 ?m=apple / mk 사고). `tools/test-search.js` 가 눌러 봅니다.

   ⚠️⚠️⚠️ **카드를 여기서 그리지 않습니다.** `js/card.js` 의 `amCard()`
   한 함수를 부릅니다 — 빌드가 찍은 HTML 과 여기서 다시 그린 HTML 이
   달라지면, 손님이 거르개를 누르는 순간 카드가 조용히 달라지고 크롤러가
   읽는 글과도 어긋납니다.

   ⚠️ **새로고침하지 않습니다** (지시서). 거르개는 링크지만 눌림을
   가로채서 `history.pushState` 로 주소만 바꿉니다 — 그래서 주소를
   복사해 보내도 같은 화면이고 **뒤로 가기도 됩니다**.

   ⚠️⚠️ 업체 자료는 `window.AM_PROVIDERS` 입니다 — DB 에서 나온 것이고
   (`tools/pull-providers.js`), 거기에는 **승인 · 공개된 업체만** 들어
   있습니다 (`v_provider_card` 가 `listed = true and is_test = false and
   state = 'approved'` 로 좁힙니다). 화면이 또 좁히지 않습니다 —
   두 곳에서 좁히면 한쪽을 고치는 날 조용히 어긋납니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("sres");
  if(!box) return;
  if(location.pathname.indexOf("/search") !== 0) return;

  var esc  = window.esc;
  var all  = window.amProviders ? window.amProviders() : [];
  var CMP  = {};                 /* 비교로 고른 업체 — id: true */
  var CMAX = 3;                  /* ⚠️ 셋까지. 넷이면 폰에서 글자가 2px 됩니다 */

  /* ── 지금 조건 ──────────────────────────────────────────────────── */
  function now(){
    var u = new URLSearchParams(location.search);
    return { q:   (u.get("q")   || "").trim(),
             cat: (u.get("cat") || "").trim(),
             rg:  (u.get("rg")  || "").trim(),
             /* ⚠️ 하위분류 — 분류 화면의 하위 목록이 여기로 보냅니다
                (`amSubUrl`). 열쇠 이름이 보내는 쪽과 **글자까지** 같아야
                합니다 — `?m=apple` 을 보내고 `mk` 를 읽어 거르개가
                아무것도 안 걸렀는데 링크 검사도 흐름 검사도 통과한
                적이 있습니다. 눌러 봐야 압니다. */
             sub: (u.get("sub") || "").trim() };
  }
  /* ⚠️ 주소를 **한 함수**에서 짓습니다 (pages/search.js 의 furl 과 같은
     꼴입니다 — 꼴이 어긋나면 눌렀을 때와 새로 열었을 때가 달라집니다). */
  function url(s){
    var qs = [];
    if(s.q)   qs.push("q=" + encodeURIComponent(s.q));
    if(s.cat) qs.push("cat=" + encodeURIComponent(s.cat));
    if(s.sub) qs.push("sub=" + encodeURIComponent(s.sub));
    if(s.rg)  qs.push("rg=" + encodeURIComponent(s.rg));
    return "/search" + (qs.length ? "?" + qs.join("&") : "");
  }

  /* ── 거르기 — ⚠️ 규칙은 이 함수 하나입니다 ──────────────────────── */
  function hay(p){
    return (p.name + " " +
            (p.intro || "") + " " +
            (window.amProviderRegions(p) || []).join(" ") + " " +
            (window.amProviderBrands(p) || []).join(" ") + " " +
            window.amProviderSubs(p).map(function(k){
              var f = window.amSub(k);
              return f ? (f.item.name + " " + f.cat.name) : "";
            }).join(" ")).toLowerCase();
  }
  function pick(s){
    var words = s.q ? s.q.toLowerCase().split(/\s+/).filter(Boolean) : [];
    return all.filter(function(p){
      if(s.cat){
        var cs = window.amProviderCats(p).map(function(c){ return c.key; });
        if(cs.indexOf(s.cat) < 0) return false;
      }
      /* ⚠️⚠️ 하위분류도 **키**로 견줍니다 (`provider.subs` 가 키를
         글자로 들고 있습니다). 이름으로 견주면 하위 이름을 다듬는 날
         조용히 아무것도 안 걸립니다. */
      if(s.sub){
        if(window.amProviderSubs(p).indexOf(s.sub) < 0) return false;
      }
      /* ⚠️ 지역은 **키**로 견줍니다. 이름("서울")으로 견주면 regions.js
         를 고치는 날 조용히 아무것도 안 걸립니다. */
      if(s.rg){
        var rs = (p.regions && p.regions.length) ? p.regions : [];
        if(rs.indexOf(s.rg) < 0) return false;
      }
      if(words.length){
        var t = hay(p);
        /* ⚠️ 친 낱말이 **하나라도** 맞으면 냅니다 (전부 맞아야 하면
           "서울 피팅" 이 0건이 됩니다 — 손님은 좁히려고 친 것이
           아닙니다). */
        if(!words.some(function(w){ return t.indexOf(w) >= 0; })) return false;
      }
      return true;
    });
  }

  /* ── 0건 · 0곳 ──────────────────────────────────────────────────── */
  function noneBox(s){
    /* ⚠️⚠️ **"업체가 0곳" 과 "조건에 맞는 업체가 0건" 은 다른 말입니다.**
       같은 말로 적으면 손님이 조건을 지워 볼 생각을 못 합니다. */
    if(!all.length)
      return '<div class="none">' +
        '<h3>아직 등록된 업체가 없습니다.</h3>' +
        '<p>문을 열기 전이라 보여 드릴 업체가 없습니다. ' +
        '없는 업체를 지어내 보여 드리지 않습니다.</p>' +
        '<div class="none-b">' +
          '<a class="btn btn-pt" href="/match">매칭 요청 남기기</a>' +
        '</div>' + nowOpen() + '</div>';
    var what = [];
    if(s.q)   what.push('"' + esc(s.q) + '"');
    if(s.cat) what.push(esc(catName(s.cat)));
    if(s.sub) what.push(esc(subName(s.sub)));
    if(s.rg)  what.push(esc(rgName(s.rg)));
    return '<div class="none">' +
      '<h3>' + (what.length ? what.join(" · ") + " — " : "") +
        '조건에 맞는 업체가 없습니다.</h3>' +
      '<p>조건을 넓혀 보시거나, 원하시는 조건으로 매칭 요청을 남겨 주세요. ' +
      '운영자가 조건에 맞는 업체를 찾아 연결합니다.</p>' +
      '<div class="none-b">' +
        '<a class="btn btn-pt" href="/match">매칭 요청 남기기</a>' +
        /* ⚠️⚠️ **`data-sf="cat"` 를 달면 안 됩니다** — 아래 다시
           그리기가 "분류 전체" 칸으로 알고 주소를 다시 지어서, 조건을
           지우는 링크가 조용히 `?rg=...` 로 바뀝니다 (실제로 겪었습니다).
           가로채기만 받는 **다른 이름**을 씁니다. */
        '<a class="btn btn-line" href="/search" data-sf="all">조건 지우기</a>' +
      '</div>' + nowOpen() + '</div>';
  }

  /* ⚠️⚠️⚠️ **업체를 기다리는 동안 할 수 있는 것** (지시서 §7).
     ⚠️ **줄은 `amOpenNow()` 한 곳에서 옵니다** — 이 상자를 빌드
     (`pages/search.js` 의 `nowOpen`)와 브라우저가 **둘 다** 그립니다.
     글을 두 벌로 적으면 거르개를 누르는 순간 안내가 조용히 달라지고,
     그려진 화면만 보는 검사는 **영원히 통과**합니다. */
  function nowOpen(){
    var L = (window.amOpenNow ? window.amOpenNow() : []);
    if(!L.length) return "";        /* ⚠️ 0건이면 줄째 빠집니다 */
    return '<p class="none-or">업체를 기다리지 않고 지금 하실 수 있는 것</p>' +
      '<div class="none-b">' + L.map(function(x){
        return '<a class="btn btn-line" href="' + esc(x.href) + '">' +
          window.icon(x.icon, 18) + esc(x.label) + '</a>';
      }).join("") + '</div>';
  }
  function catName(k){
    var c = window.amCat ? window.amCat(k) : null;
    return (c && c.name) ? c.name : k;
  }
  function rgName(k){
    var r = window.amRegion ? window.amRegion(k) : null;
    return (r && r.name) ? r.name : k;
  }
  /* ⚠️ 모르는 하위 키면 **키를 그대로** 냅니다 — 이름을 지어내지
     않습니다 (손님이 주소를 손으로 고쳐 올 수 있습니다). */
  function subName(k){
    var f = window.amSub ? window.amSub(k) : null;
    return (f && f.item && f.item.name) ? f.item.name : k;
  }

  /* ── 비교 — ⚠️⚠️ **고른 업체만** 들어갑니다 (가짜 비교 금지) ────── */
  function cmpList(){
    return all.filter(function(p){ return CMP[p.id]; });
  }
  function cmpRow(label, vals){
    return '<tr><th scope="row">' + esc(label) + '</th>' +
      vals.map(function(v){
        /* ⚠️ 없는 값에 "(미기재)" 를 안 찍습니다 — 줄 모양을 지키려고
           긴 줄표 하나만 둡니다 (화면 읽는 기계에는 "없음" 으로). */
        return v ? '<td>' + v + '</td>'
                 : '<td><span aria-hidden="true">—</span>' +
                   '<span class="sr">없음</span></td>';
      }).join("") + '</tr>';
  }
  function paintCmp(){
    var wrap = document.getElementById("scmp");
    if(!wrap) return;
    var L = cmpList();
    if(L.length < 2){
      /* ⚠️ 하나만 고른 것은 비교가 아닙니다 — 빈 표를 그리지 않습니다 */
      wrap.hidden = true; wrap.innerHTML = "";
      return;
    }
    var low = L.map(function(p){ return window.amPriceLow(p); });
    wrap.hidden = false;
    wrap.innerHTML =
      '<div class="cmp-h"><h3>고른 업체 ' + L.length + '곳 비교</h3>' +
        '<button type="button" class="btn btn-sm btn-line" data-cmp="off">비교 지우기</button>' +
      '</div>' +
      '<div class="cmp-s"><table class="cmp-t">' +
        '<thead><tr><th scope="col"><span class="sr">항목</span></th>' +
          L.map(function(p){
            return '<th scope="col"><a href="' + esc(window.amProviderUrl(p)) + '">' +
              esc(p.name) + '</a></th>';
          }).join("") + '</tr></thead><tbody>' +
        cmpRow("지역", L.map(function(p){
          return esc(window.amProviderRegions(p).join(" · "));
        })) +
        cmpRow("하는 일", L.map(function(p){
          return esc(window.amProviderCats(p).map(function(c){ return c.name; }).join(" · "));
        })) +
        /* ⚠️⚠️ 가격은 **업체가 등록한 것만**입니다. 없으면 빈 칸이고,
           "상담 후 견적" 같은 말을 우리가 지어 넣지 않습니다. */
        cmpRow("등록된 가격", low.map(function(x){
          return x ? '<b>' + esc(window.amPriceText(x)) + '</b>' +
                     (x.label ? ' <span class="cmp-sm">' + esc(x.label) + '</span>' : '')
                   : "";
        })) +
        cmpRow("확인된 것", L.map(function(p){
          return esc(window.amProviderVerified(p).join(" · "));
        })) +
        cmpRow("후기", L.map(function(p){
          var r = window.amRating ? window.amRating(p.id) : null;
          return r ? esc(r.avg.toFixed(1) + " (" + r.n + "건)") : "";
        })) +
        /* 상담 방식 (0044) — ⚠️ 업체가 고른 것만, 없으면 빈 칸입니다 */
        cmpRow("상담 방식", L.map(function(p){
          return esc((window.amContactWays ? window.amContactWays(p) : []).join(" · "));
        })) +
        cmpRow("상담 시간", L.map(function(p){ return esc(p.consult_hours || ""); })) +
        cmpRow("개업", L.map(function(p){
          return p.since ? esc(String(p.since) + "년") : "";
        })) +
        cmpRow("", L.map(function(p){
          return '<a class="btn btn-sm btn-pt" href="/match?pv=' +
            encodeURIComponent(p.id) + '">상담 요청</a>';
        })) +
      '</tbody></table></div>';
  }

  /* ── 다시 그리기 ────────────────────────────────────────────────── */
  function paint(){
    var s = now();
    var L = pick(s);
    box.innerHTML = L.length
      ? window.amCardGrid(L, { thumb:true, actions:true, compare:true })
      : noneBox(s);

    /* ⚠️⚠️ **골프장 구간도 같이 다시 그립니다** — 안 그리면 거르개를
       눌러도 골프장 목록만 처음 것 그대로 남아 "서울" 을 골랐는데
       제주 골프장이 보입니다 (에러는 안 납니다).
       ⚠️ 카드는 `amCourseGrid()` **한 함수**이고 빌드가 부르는 것과
       같습니다 — 두 벌로 적으면 거르개를 누르는 순간 조용히 달라집니다. */
    var cbox = document.getElementById("csres");
    if(cbox && window.amCoursePick){
      var CL = window.amCoursePick(s);
      /* ⚠️ 0건일 때는 **빌드가 찍어 둔 안내를 그대로 둡니다** — 여기서
         다시 적으면 같은 말을 두 곳에 적는 것이 됩니다. */
      if(CL.length) cbox.innerHTML = window.amCourseGrid(CL);
      var ch = document.getElementById("csresh");
      if(ch) ch.textContent = CL.length
        ? ("골프장 · 연습장 " + window.won(CL.length) + "곳")
        : "골프장 · 연습장";
    }

    /* 머리 숫자 · 지금 조건 */
    var h = document.getElementById("sresh");
    if(h) h.textContent = L.length ? ("업체 " + window.won(L.length) + "곳") : "업체";
    var nowline = document.getElementById("sfnow");
    if(nowline){
      var bits = [];
      if(s.cat) bits.push(catName(s.cat));
      /* ⚠️ 하위분류로 좁혀 오신 분에게 **무엇으로 좁혔는지** 말합니다 —
         칸 색만으로는 폰에서 안 보입니다 (하위는 칸이 아예 없습니다). */
      if(s.sub) bits.push(subName(s.sub));
      if(s.rg)  bits.push(rgName(s.rg));
      if(s.q)   bits.push('"' + s.q + '"');
      /* ⚠️ 업체가 한 곳도 없으면 이 줄을 **감춥니다** — 바로 아래 빈 자리
         상자가 같은 말을 합니다 (빌드 쪽 pages/search.js 와 같은 규칙). */
      nowline.hidden = !all.length;
      nowline.textContent = !all.length
        ? ""
        : bits.length
          ? (bits.join(" · ") + " — 업체 " + window.won(L.length) + "곳")
          : ("승인된 업체 " + window.won(all.length) + "곳을 전부 보고 있습니다.");
    }
    /* 눌린 칸 — ⚠️ 색만 바꾸지 않고 aria-pressed 도 같이 바꿉니다
       (화면 읽는 기계에는 색이 안 보입니다). */
    Array.prototype.forEach.call(document.querySelectorAll("a[data-sf]"), function(a){
      var k = a.getAttribute("data-sf"), v = a.getAttribute("data-v") || "";
      /* ⚠️ 조건을 지우는 링크(all)는 주소를 다시 짓지 않습니다 */
      if(k !== "cat" && k !== "rg") return;
      var on = (k === "cat" ? s.cat : s.rg) === v;
      a.classList.toggle("chip-on", on);
      a.setAttribute("aria-pressed", on ? "true" : "false");
      /* ⚠️⚠️ 링크의 주소도 **지금 조건을 지킵니다** — 분류를 고른 뒤
         지역을 누르면 분류가 조용히 풀리면 안 됩니다. */
      var next = { q:s.q, cat:s.cat, rg:s.rg, sub:s.sub };
      next[k] = (on ? "" : v);
      /* ⚠️⚠️⚠️ **분류를 바꾸면 하위를 같이 풉니다.** 안 풀면 "골프 레슨
         의 하위" 를 들고 "골프 여행" 으로 옮겨 가서 **영원히 0건**이
         됩니다 — 에러도 없고, 손님은 그 분류에 업체가 없는 줄 압니다.
         ⚠️ 같은 분류를 다시 누른 것(끄는 것)도 하위를 풉니다. */
      if(k === "cat" && next.cat !== s.cat) next.sub = "";
      a.setAttribute("href", url(next));
    });
    /* 지역 광고 — ⚠️⚠️ **지금 고른 지역으로** 다시 채웁니다. 그리는
       코드는 `js/adslot.js` 한 곳이고 여기서는 열쇠만 넘깁니다 (업체
       카드를 빌드와 브라우저 둘이 그리다 겪은 자리 — 두 벌로 적으면
       거르개를 누르는 순간 조용히 달라집니다).
       ⚠️ 지역을 안 고르셨으면 빈 열쇠가 가고, 그러면 걸리는 광고가
       없어 자리가 **감춰진 채** 남습니다 (빈 액자를 두지 않습니다). */
    if(window.amAdFill)
      window.amAdFill(document.querySelector('[data-adslot="region"]'), s.rg);

    /* 비교 체크는 다시 그린 뒤에 되살립니다 */
    Array.prototype.forEach.call(box.querySelectorAll(".cmp-x"), function(x){
      x.checked = !!CMP[x.value];
    });
    paintCmp();
  }

  /* ── 누르기 ─────────────────────────────────────────────────────── */
  document.addEventListener("click", function(e){
    var a = e.target.closest ? e.target.closest("a[data-sf]") : null;
    if(a){
      /* ⚠️ 새 창 · 가운데 단추는 가로채지 않습니다 (손님이 일부러
         새 창으로 여는 길을 막으면 안 됩니다). */
      if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      history.pushState(null, "", a.getAttribute("href"));
      paint();
      return;
    }
    var off = e.target.closest ? e.target.closest("button[data-cmp='off']") : null;
    if(off){ CMP = {}; paint(); return; }
  });

  box.addEventListener("change", function(e){
    var x = e.target;
    if(!x || !x.classList || !x.classList.contains("cmp-x")) return;
    if(x.checked){
      /* ⚠️ 넷째부터는 **막고 까닭을 말합니다** — 조용히 안 켜지면
         손님은 고장으로 읽습니다. */
      if(cmpList().length >= CMAX){
        x.checked = false;
        var m = document.getElementById("sfnow");
        if(m) m.textContent = "비교는 " + CMAX + "곳까지입니다. 하나를 빼고 고르세요.";
        return;
      }
      CMP[x.value] = true;
    }else{
      delete CMP[x.value];
    }
    paintCmp();
  });

  /* 머리말 검색창 — ⚠️ 보낼 때 **새로고침하지 않습니다** */
  var form = document.querySelector("form.sch");
  var input = document.getElementById("q");
  if(input) input.value = now().q;
  if(form) form.addEventListener("submit", function(e){
    e.preventDefault();
    var s = now();
    s.q = (input && input.value || "").trim();
    history.pushState(null, "", url(s));
    paint();
  });

  /* 뒤로 가기 · 앞으로 가기 */
  window.addEventListener("popstate", function(){
    var s = now();
    if(input) input.value = s.q;
    paint();
  });

  /* ⚠️⚠️ 첫 그림은 **빌드가 찍은 것**입니다. 조건이 없으면 다시 그리지
     않습니다 — 똑같은 것을 다시 그리면 그 순간 화면이 한 번 깜빡이고,
     자료가 어긋났을 때 그 사실이 숨습니다. */
  var s0 = now();
  /* ⚠️⚠️⚠️ **열쇠를 하나 더하면 여기도 같이 고쳐야 합니다.** `sub` 를
     더하면서 이 줄을 빼먹어, `?sub=` 만 들고 들어오면 **다시 그리지
     않아 아무것도 안 걸렸습니다** — 빌드가 찍어 둔 전체 목록이 그대로
     보였고, 에러는 한 줄도 없었습니다. 검사가 눌러 보고 잡았습니다.
     ⚠️ 그래서 조건을 **세어** 봅니다 (열쇠를 손으로 나열하지 않습니다) —
     `now()` 가 내놓는 값 가운데 비지 않은 것이 하나라도 있으면 그립니다.
     열쇠가 또 늘어도 이 줄은 그대로 돕니다. */
  if(Object.keys(s0).some(function(k){ return !!s0[k]; })) paint();
  else {
    /* 거르개 눌림 표시만 맞춰 둡니다 */
    Array.prototype.forEach.call(document.querySelectorAll("a[data-sf]"), function(a){
      var k = a.getAttribute("data-sf"), v = a.getAttribute("data-v") || "";
      var on = v === "";
      a.classList.toggle("chip-on", on);
      a.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }
})();

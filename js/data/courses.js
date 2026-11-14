/* ════════════════════════════════════════════════════════════════════
   전국 골프장 · 연습장 — 화면이 읽는 자리 (DB 는 0066)

   ⚠️⚠️⚠️ **참은 DB 한 곳입니다.** `tools/pull-courses.js` 가
   `js/data/courses.generated.js` 로 찍고 빌드가 그것을 읽습니다 —
   **손으로 고치지 마세요.** 손으로 적으면 그 줄은 출처가 없는 시설이고,
   출처 없는 시설은 **지어낸 것과 구별되지 않습니다** (절대 규칙 1).

   ⚠️⚠️ **주소는 `amCourseUrl()` 한 함수**에서만 짓습니다. 두 곳에서
   지으면 한쪽만 고치는 날 링크 예순 곳이 404 로 갑니다 (`/c/` → `/cat/`
   에서 겪은 자리).

   ⚠️ **slug 는 바뀔 수 있는 값**입니다 (운영자가 고칩니다). 그래서 다른
   표는 전부 `id`(uuid)를 가리키고, 주소만 slug 를 씁니다.

   ⚠️ 폐업(`closed`)도 **냅니다** — 손님이 "여기 문 닫았나" 를 확인할 수
   있어야 합니다. 다만 화면이 그 사실을 **그 자리에서** 말합니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var W = window;

  W.amCourses = function(){
    var L = W.AM_COURSES;
    return Array.isArray(L) ? L : [];
  };
  /* 지금 영업 중인 것만 — ⚠️ 0건이면 **0건이라고 말합니다** */
  W.amCoursesOpen = function(kind){
    return W.amCourses().filter(function(c){
      return c.state === "open" && (!kind || c.kind === kind);
    });
  };
  W.amCourse = function(slug){
    var L = W.amCourses();
    for(var i = 0; i < L.length; i++) if(L[i].slug === slug) return L[i];
    return null;
  };
  W.amCourseUrl = function(c){
    return "/course/" + encodeURIComponent(c && c.slug ? c.slug : "");
  };
  /* 지역별 수 — ⚠️ **세어서** 냅니다 (칸에 저장하지 않습니다) */
  W.amCourseCount = function(kind){
    var out = {};
    W.amCoursesOpen(kind).forEach(function(c){
      out[c.region] = (out[c.region] || 0) + 1;
    });
    return out;
  };
  /* 검색 — ⚠️ 업체찾기와 **같은 꼴**로 돌려줍니다 (한 목록에 섞어 냅니다) */
  W.amCourseFind = function(q){
    var s = String(q || "").replace(/\s+/g, "").toLowerCase();
    if(!s) return [];
    return W.amCoursesOpen().filter(function(c){
      var hay = (String(c.name) + String(c.region) + String(c.gu || "") +
                 String(c.addr || "")).replace(/\s+/g, "").toLowerCase();
      return hay.indexOf(s) >= 0;
    });
  };

  /* ── 카드를 그리는 자리 — ⚠️⚠️⚠️ **한 함수뿐입니다** ──────────────
     빌드(크롤러가 읽는 HTML)와 브라우저(거른 뒤 다시 그리는 HTML)가
     **같은 함수**를 부릅니다. 두 벌로 적으면 손님이 거르개를 누르는
     순간 카드가 조용히 달라지고, 그려진 화면만 보는 검사는 영원히
     통과합니다 (업체 카드를 `js/card.js` 한 곳에 모은 그 까닭).
     ⚠️ 손님이 적은 글이 아니라 공공 자료이지만 **그래도 esc()** 를
     지납니다 — 자료가 어디서 오든 화면에 날것으로 넣지 않습니다. */
  W.amCourseGrid = function(list){
    var esc = W.esc;
    if(!list || !list.length) return "";
    return '<ul class="csg">' + list.map(function(c){
      var reg = (function(){
        var L = W.AM_REGIONS || [];
        for(var i = 0; i < L.length; i++) if(L[i].key === c.region) return L[i].name;
        return c.region;
      })();
      var bits = [W.amCourseKind(c.kind)];
      if(c.holes) bits.push(String(c.holes) + "홀");
      if(c.biz_kind) bits.push(String(c.biz_kind));
      return '<li class="csg-i"><a href="' + esc(W.amCourseUrl(c)) + '">' +
        '<span class="csg-n">' + esc(c.name) + '</span>' +
        '<span class="csg-w">' + esc([reg, c.gu].filter(Boolean).join(" ")) + '</span>' +
        '<span class="csg-m">' + bits.map(function(b){
          return '<span>' + esc(b) + '</span>';
        }).join("") + '</span>' +
      '</a></li>';
    }).join("") + '</ul>';
  };

  /* 거르개 — ⚠️ 골프장에는 **분류 · 하위가 없습니다.** 글자와 지역만
     걸립니다. 분류를 고르셨으면 부킹 · 연습장일 때만 냅니다 (레슨을
     고른 분에게 골프장 목록을 내밀면 자리가 어긋납니다). */
  W.amCoursePick = function(s){
    s = s || {};
    if(s.cat && s.cat !== "booking" && s.cat !== "range") return [];
    var L = s.q ? W.amCourseFind(s.q) : W.amCoursesOpen();
    /* ⚠️ 지역은 **쉼표로 여럿**을 받습니다(메인의 「경기 · 인천」 · 「충청」 칸).
       보내는 쪽(`pages/home.js` 의 `RG`)과 **같이** 고치세요. */
    if(s.rg){
      var want = String(s.rg).split(",").map(function(x){ return x.trim(); })
                   .filter(Boolean);
      L = L.filter(function(c){ return want.indexOf(c.region) >= 0; });
    }
    if(s.cat === "range")   L = L.filter(function(c){ return c.kind === "range"; });
    if(s.cat === "booking") L = L.filter(function(c){ return c.kind === "golf"; });
    return L;
  };


  /* ── 사진이 있는 골프장 카드 (2026-11-13) ────────────────────────
     ⚠️⚠️⚠️ **`amCourseGrid` 와 다른 자리입니다.** 저쪽은 `/search` 가
     업체 목록 아래에 내는 **글자 줄 목록**이고, 이쪽은 `/cat/booking` 의
     「골프장 정보」 탭이 내는 **사진 카드**입니다. 한 함수로 묶으면 한쪽을
     고치는 날 다른 화면이 같이 바뀝니다 (`.lsc*` 를 구합니다 글이 빌려
     쓰다 0068 에서 이름을 갈라야 했던 그 자리).
     ⚠️⚠️ **빌드와 브라우저가 같은 함수를 부릅니다** — 두 벌로 적으면
     손님이 거르개를 누르는 순간 카드가 조용히 달라지고, 그려진 화면만
     보는 검사는 영원히 통과합니다.
     ⚠️ 공공 자료이지만 **그래도 esc()** 를 지납니다. */

  /* 사진 — ⚠️⚠️⚠️ **없으면 아이콘 타일입니다.** 남의 사진이나 분류
     사진을 깔면 그 골프장인 것처럼 보입니다 (표시 · 광고의 공정화에
     관한 법률 제3조 · 매물 카드 · 업체 카드와 같은 규칙).
     ⚠️ 주소를 짓는 자리는 `tools/pull-courses.js` 하나이고 화면은
     `photo_url` 만 봅니다 — 버킷이 없으면 그 칸이 **아예 없습니다**. */
  W.amCoursePhoto = function(c){
    var esc = W.esc, u = String((c && c.photo_url) || "");
    if(!u) return '<span class="csc-ph" aria-hidden="true">' +
                  W.icon("flag", 28) + '</span>';
    return '<span class="csc-ph csc-ph-img">' +
      '<img src="' + esc(u) + '" alt="' + esc(String(c.name || "") + " 사진") +
      '" loading="lazy" decoding="async"></span>';
  };

  W.amCourseCard = function(c){
    var esc = W.esc;
    if(!c) return "";
    var url  = W.amCourseUrl(c);
    var reg  = W.amRegion ? W.amRegion(c.region) : null;
    var where = [reg && reg.name ? reg.name : "", c.gu || ""]
                  .filter(Boolean).join(" ");
    /* ⚠️ 지역 키를 못 찾으면 **날것으로 안 찍습니다**(지시 6번) */
    if(!where) where = W.amKeyName ? W.amKeyName({}, c.region, "지역") : "";
    /* 홀 수 · 유형 — ⚠️ **없으면 줄째 뺍니다**(「미기재」를 안 찍습니다) */
    var bits = [];
    if(c.holes)    bits.push(String(c.holes) + "홀");
    if(c.biz_kind) bits.push(String(c.biz_kind));
    var closed = (c.state === "closed");
    return '<article class="csc' + (closed ? " csc-off" : "") + '">' +
      W.amCoursePhoto(c) +
      '<div class="csc-b">' +
        (closed ? '<span class="csc-dead">폐업</span>' : "") +
        '<h3 class="csc-n">' + esc(c.name) + '</h3>' +
        (where ? '<p class="csc-w">' + W.icon("pin", 14) + esc(where) + '</p>' : "") +
        (bits.length
          ? '<p class="csc-m">' + bits.map(function(b){
              return '<span>' + esc(b) + '</span>';
            }).join("") + '</p>'
          : "") +
        /* ⚠️⚠️ **주소 · 전화는 공공 자료 그대로**입니다 — 우리가 확인한
           값이 아니므로 「확인됨」 같은 말을 붙이지 않습니다. */
        (c.addr_road || c.addr
          ? '<p class="csc-ad">' + esc(String(c.addr_road || c.addr)) + '</p>' : "") +
        '<p class="csc-go">' +
          /* ⚠️⚠️ **상세 단추의 ::after 가 카드를 덮습니다** — 카드를
             <a> 로 감싸면 공식 홈페이지 링크가 **링크 안의 링크**가
             됩니다(레슨 카드에서 세운 규칙). */
          '<a class="btn btn-sm btn-pt csc-go-a" href="' + esc(url) + '">상세 정보</a>' +
          /* ⚠️⚠️⚠️ **공식 홈페이지는 바깥 주소**라 새 창 + rel 넷입니다.
             ⚠️ `https://` 로 시작하는 것만 냅니다 — `javascript:` 가
             섞여 들어오면 그 자리가 구멍입니다(0064 의 클릭 주소와 같은
             규칙). 꼴이 아니면 **그 단추를 아예 안 냅니다.** */
          (/^https?:\/\//i.test(String(c.site_url || ""))
            /* ⚠️⚠️ **`.btn-bad` 를 쓰지 않습니다** — 그 변형은 빨간
               테두리 · 빨간 글자라(`--bad` #B91C1C) 「내리기」 · 「신고」
               자리의 색입니다. 공식 홈페이지는 위험한 일이 아닌데 찍어
               보니 **경고 단추로 읽혔습니다**(2026-11-13 · 눈으로 잡은
               자리). 조용한 둘째 단추는 `.btn-line`(딥그린 테두리)입니다. */
            ? '<a class="btn btn-sm btn-line csc-site" href="' + esc(c.site_url) +
              '" target="_blank" rel="nofollow noopener noreferrer">공식 홈페이지</a>'
            : "") +
        '</p>' +
      '</div>' +
    '</article>';
  };

  W.amCourseCards = function(list){
    if(!list || !list.length) return "";
    return '<ul class="csc-l">' + list.map(function(c){
      return '<li>' + W.amCourseCard(c) + '</li>';
    }).join("") + '</ul>';
  };

  /* 지역 칩 — ⚠️⚠️ **세어서** 냅니다 (칸에 저장하지 않습니다).
     ⚠️ 0곳인 지역은 **안 냅니다** — 눌러도 0건인 칸이 됩니다(절대 규칙 5). */
  W.amCourseRegions = function(kind){
    var n = {}, out = [];
    W.amCourseList(kind).forEach(function(c){
      n[c.region] = (n[c.region] || 0) + 1;
    });
    (W.AM_REGIONS || []).forEach(function(r){
      if(n[r.key]) out.push({ key:r.key, name:r.name, n:n[r.key] });
    });
    return out;
  };

  /* 지역 칩 줄 — ⚠️⚠️⚠️ **빌드와 브라우저가 같은 함수를 부릅니다.**
     처음에는 `pages/category.js` 에만 두었는데, 그러면 칩이 **빌드가 찍은
     그대로** 굳어 브라우저가 손댈 수가 없습니다 — 검사가 런타임 씨앗으로
     골프장을 넣었더니 `{"keys":[],"want":["seoul",...]}` 로 **칩이 0개**
     였습니다(카드를 `js/card.js` 한 곳에 모은 그 까닭과 같습니다).
     ⚠️ 칩은 **링크**입니다 — 단추로만 만들면 자바스크립트가 꺼진 분 ·
     크롤러에게 눌러도 아무 일이 안 나는 칸이 됩니다(절대 규칙 5). */
  W.amCourseChipRow = function(base, kind, now){
    var esc = W.esc;
    var R = W.amCourseRegions(kind);
    if(!R.length) return "";
    var cur = String(now || "");
    function one(k, name, n){
      var p = "tab=course" + (k ? "&rg=" + encodeURIComponent(k) : "");
      var on = (k === cur);
      return '<a class="chip' + (on ? " on" : "") + '" data-csrg="' + esc(k) +
        '" href="' + esc(base + "?" + p) + '"' +
        (on ? ' aria-current="true"' : "") + '>' + esc(name) +
        (n ? ' <b>' + esc(String(n)) + '</b>' : "") + '</a>';
    }
    return '<nav class="chips chips-csrg" aria-label="지역으로 추리기">' +
      one("", "전체", 0) +
      R.map(function(r){ return one(r.key, r.name, r.n); }).join("") +
      '</nav>';
  };

  /* 그 화면이 내는 목록 — ⚠️⚠️ **폐업도 냅니다**(손님이 "여기 문
     닫았나" 를 확인할 수 있어야 합니다 · 0066). 다만 **맨 뒤로** 보내고
     카드가 그 자리에서 「폐업」이라고 말합니다. 가려진 것(hidden)은
     공개 보기가 애초에 안 냅니다. */
  W.amCourseList = function(kind){
    return W.amCourses().filter(function(c){
      return (c.state === "open" || c.state === "closed") &&
             (!kind || c.kind === kind);
    }).sort(function(a, b){
      if((a.state === "closed") !== (b.state === "closed"))
        return a.state === "closed" ? 1 : -1;
      return String(a.name).localeCompare(String(b.name), "ko");
    });
  };

  /* 거르기 — ⚠️⚠️⚠️ **이 목록은 화면이 통째로 들고 있습니다**(빌드가
     전부 찍습니다). 그래서 화면에서 걸러도 받아 온 줄 밖으로 새는 것이
     없습니다 — 서버에서 거르는 `/cat/used` · `/cat/booking` 과 다른
     까닭이 여기 있습니다(거기는 LIMIT 이 있습니다).
     ⚠️ 이름은 **띄어쓰기를 지우고** 봅니다 (「남서울 CC」 · 「남서울CC」). */
  W.amCoursePickCards = function(s, kind){
    s = s || {};
    var L = W.amCourseList(kind);
    /* ⚠️ 지역은 **쉼표로 여럿**을 받습니다(메인의 「경기 · 인천」 · 「충청」 칸).
       보내는 쪽(`pages/home.js` 의 `RG`)과 **같이** 고치세요. */
    if(s.rg){
      var want = String(s.rg).split(",").map(function(x){ return x.trim(); })
                   .filter(Boolean);
      L = L.filter(function(c){ return want.indexOf(c.region) >= 0; });
    }
    var q = String(s.q || "").replace(/\s+/g, "").toLowerCase();
    if(q) L = L.filter(function(c){
      var hay = (String(c.name) + String(c.gu || "") +
                 String(c.addr || "") + String(c.addr_road || ""))
                  .replace(/\s+/g, "").toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    return L;
  };

  /* 갈래 말 — ⚠️ 한 곳 */
  W.AM_COURSE_KIND = { golf:"골프장", range:"연습장" };
  /* ⚠️⚠️ **못 찾은 키를 그대로 찍지 않습니다**(지시 6번) — 전에는
     `String(k)` 라 시설 종류 키가 손님 화면에 날것으로 나갔습니다. */
  W.amCourseKind = function(k){
    return W.amKeyName ? W.amKeyName(W.AM_COURSE_KIND, k, "시설 종류") : "";
  };
})();

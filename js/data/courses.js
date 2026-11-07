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
    if(s.rg) L = L.filter(function(c){ return c.region === s.rg; });
    if(s.cat === "range")   L = L.filter(function(c){ return c.kind === "range"; });
    if(s.cat === "booking") L = L.filter(function(c){ return c.kind === "golf"; });
    return L;
  };

  /* 갈래 말 — ⚠️ 한 곳 */
  W.AM_COURSE_KIND = { golf:"골프장", range:"연습장" };
  W.amCourseKind = function(k){ return W.AM_COURSE_KIND[k] || String(k || ""); };
})();

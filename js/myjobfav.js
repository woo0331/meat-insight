/* ════════════════════════════════════════════════════════════════════
   저장한 공고 — /my 에서만 돕니다 (DB 는 0078)

   ⚠️⚠️⚠️ **누가 무엇을 저장했는지는 제 것만 보입니다.** 올리신 분에게도 ·
   운영자에게도 안 냅니다 — 그건 행동 기록이고, 0059 가 글 조회 기록을
   운영자도 못 읽게 둔 그 까닭과 같습니다. 읽는 길은 보기 `v_job_fav`
   하나이고 그 보기가 `auth.uid()` 로 좁힙니다.

   ⚠️⚠️ **저장 수를 어디에도 안 적습니다** — 세어 낼 수야 있지만 그 수는
   "인기" 로 읽히고 우리가 그것을 검증할 길이 없습니다. `v_job_open` 에
   `fav_n` 칸이 **아예 없습니다** (0069 가 중고 찜에서 세운 규칙).

   ⚠️⚠️ **마감된 공고도 남깁니다.** `v_job_open` 을 그대로 썼으면 저장해
   두신 공고가 마감되는 순간 목록에서 **조용히 사라졌습니다** — "마감"
   이라고 보여 드리는 것이 맞습니다. 그래서 보기가 `state` 를 그대로
   냅니다 (0069 의 `v_listing_fav` 와 같은 꼴).

   ⚠️ `js/myfav.js`(중고 관심상품)와 **이름을 갈라** 둡니다 — 거기는
   사진이 있는 격자, 여기는 글자 줄입니다. 짧은 이름을 두 곳에 쓰면
   한쪽을 고치는 날 둘이 같이 바뀝니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("jobfavbox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  var REG = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });
  (window.AM_TRIP_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });
  /* ⚠️⚠️ 한 번에 받아 오는 줄 수 — **한 곳**입니다. 0078 이 저장을
     200개까지 받으므로 그 수와 같습니다(더 작게 두면 "다 저장했는데
     안 보인다" 가 됩니다). */
  var LIMIT = 200;



  /* ⚠️⚠️⚠️ **정상 0건과 조회 실패를 가립니다** — 전에는
     `r.ok ? r.json() : []` 로 적어, 거절당한 것도 보기가 없는 것도
     **번 배열**이 되어 화면이 「아직 ~이 없습니다」를 찍었습니다
     (절대 규칙 1 — 0 은 세어 본 값입니다). 지금은 **던집니다.**
     ⚠️⚠️ 다시 묻는 것은 **`OPTCOL` 에 적어 둔 확인된 새 칸**이
     없다고 400 이 말할 때만이고, 보기 부재(404) · 권한(403) · 인증은
     덮지 않습니다. */
  var OPTCOL = ["role", "emp_type"];
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
    window.amFailLog("jobfavbox", e);
    var b = document.getElementById("jobfavbox");
    if(!b) return;
    b.hidden = false;
    b.innerHTML = window.amFailHtml("저장한 공고");
    var t = b.querySelector("[data-amretry]");
    if(t) t.addEventListener("click", function(){ again(a); });
  }
  function call(a, fn, p){
    return fetch(a.conf.url + "/rest/v1/rpc/" + fn, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {}),
      body: JSON.stringify({ p:p })
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    });
  }

  /* ⚠️⚠️⚠️ **모르는 키를 그 글자 그대로 내지 않습니다** — `jr-caddy` 가
     공고 상세에 그대로 찍힌 그 자리입니다. 중립 문구를 내고 매핑 누락은
     운영 기록으로 보냅니다(`amKeyName()` 한 곳). */
  function nameOf(L, k, kind){ return window.amKeyName(L, k, kind); }
  function kinds(){ return window.AM_JOB_KIND || []; }

  /* 한 줄 — ⚠️ 공고 상세로 갑니다 (마감된 것도 열립니다 — 공개 보기가
     마감 공고도 내므로 그 자리에서 마감이라고 말합니다). */
  function row(r){
    /* ⚠️ `open` 이면 딱지를 **안 냅니다** — 「받는 중」을 모든 줄에
       붙이면 그것만 보입니다. */
    var st = (r.state && r.state !== "open")
      ? '<span class="mjf-st">마감</span>' : "";
    return '<li class="mjf-i">' +
      '<a class="mjf-a" href="/cat/career?v=' + encodeURIComponent(r.id) + '">' +
        '<span class="mjf-t">' + esc(r.title) + st + '</span>' +
        '<span class="mjf-m">' + esc(bits(r)) + '</span>' +
      '</a>' +
      '<button type="button" class="btn btn-sm btn-bad mjf-off" data-id="' +
        esc(r.id) + '">저장 해제</button>' +
    '</li>';
  }
  /* 갈래 · 직무 · 지역 · 급여 — ⚠️ 비는 것은 **줄에서 빠집니다**
     (절대 규칙 2 — "(미기재)" 를 찍지 않습니다).
     ⚠️⚠️ 금액을 적는 자리는 `amJobPay()` **한 곳**입니다 — 여기서 따로
     이어 붙이면 「급여 · 조건 일 12만원」과 「월 300만원부터 · 일
     12만원」이 나란히 찍힙니다(2026-11-12 에 공고 상세에서 겪은 자리). */
  function bits(r){
    var b = [nameOf(kinds(), r.kind, "갈래"),
             nameOf(window.AM_JOB_ROLE, r.role, "직무"),
             window.amKeyName(REG, r.region, "지역")];
    var pay = window.amJobPay ? window.amJobPay(r) : null;
    if(pay) b.push(pay);
    return b.filter(Boolean).join(" · ");
  }

  /* ⚠️⚠️ **고르는 것과 찍는 것을 갈라 둡니다** — 삼항으로 두 글 덩이 중
     하나를 골라 `innerHTML` 에 넣으면 `check-safe` 가 "esc() 없이 변수를
     넣는 줄" 로 잡습니다. 그 검사가 맞습니다. */
  function noneHtml(){
    return '<h2 class="mj-h">저장한 공고</h2>' +
      /* ⚠️ 0건을 **막다른 길로 두지 않습니다** — 길을 같이 냅니다 */
      '<p class="mj-z">아직 저장해 두신 공고가 없습니다. ' +
      '골프 인력 · 비즈니스에서 마음에 드는 공고의 「저장」을 누르시면 ' +
      '여기 모입니다.</p>' +
      '<a class="btn btn-pt mj-go" href="/cat/career">공고 보러 가기</a>';
  }
  function listHtml(rows){
    return '<h2 class="mj-h">저장한 공고</h2>' +
      /* ⚠️⚠️ **한도에 닿으면 "N건 이상"** 입니다 — 받아 온 줄 수를
         전체인 것처럼 적으면 세어 본 값이 아닙니다 (절대 규칙 1). */
      '<p class="mj-c">' + rows.length +
        (rows.length >= LIMIT ? "건 이상" : "건") + '</p>' +
      '<ul class="mjf-l">' + rows.map(row).join("") + '</ul>';
  }

  function paint(a, rows){
    box.className = rows.length ? "jbox" : "none";
    box.innerHTML = rows.length ? listHtml(rows) : noneHtml();
    box.hidden = false;
    Array.prototype.forEach.call(box.querySelectorAll(".mjf-off"), function(b){
      b.addEventListener("click", function(){
        b.disabled = true;
        call(a, "fav_jobpost", { id: b.getAttribute("data-id"), on:false })
          .then(function(){ return reload(a); })
          .catch(function(err){
            b.disabled = false;
            /* ⚠️ 거절한 말을 **그대로** 보여 줍니다 (지어내지 않습니다) */
            try{ window.alert(String((err && err.message) || "빼지 못했습니다.")); }catch(_){}
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
    /* ⚠️⚠️ **`fav_at` 차례**로 냅니다 — 공고를 올린 차례로 두면 오래된
       공고를 방금 저장하셔도 맨 아래에 있습니다. */
    return get(a, "v_job_fav?select=id,title,kind,sub,region,role,emp_type," +
                  "pay,pay_type,pay_min,state,fav_at&order=fav_at.desc&limit=" + LIMIT)
      .then(function(rows){ paint(a, rows || []); });
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.signedIn) return;   /* 로그인 전에는 안 그립니다 */
    /* ⚠️ 못 읽었으면 **그대로 둡니다** — 0건이라고 적지 않습니다
       (못 읽은 것과 0건은 다릅니다 · 절대 규칙 1). */
    reload(a).catch(function(){});
  }).catch(function(){});
})();

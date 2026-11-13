/* ════════════════════════════════════════════════════════════════════
   업체 카드 — ⚠️⚠️⚠️ **그리는 곳이 둘입니다: 빌드와 브라우저.**

   빌드가 찍은 HTML 과 브라우저가 거르고 다시 그린 HTML 이 **다르면**
   손님이 거르개를 누르는 순간 카드가 조용히 달라집니다 (크롤러가 읽는
   글과도 달라집니다 — 앞 서비스에서 열세 번 어긋났습니다). 그래서
   카드를 **이 파일 한 곳**에만 적고,
     · `pages/_card.js` (빌드)  — 이것을 부르는 얇은 껍데기입니다
     · `/search` 의 `js/search.js` (브라우저) — 같은 함수를 부릅니다
   둘이 같은 함수를 씁니다.

   ⚠️ 업체가 적은 글은 전부 `esc()` 를 거칩니다 (절대 규칙 4).
   ⚠️ 값이 없는 줄은 **줄째 뺍니다** — "(미기재)" 를 안 찍습니다.
   ⚠️⚠️ **사진 칸에 남의 사진을 깔지 않습니다.** 그 자리에 아무 골프장
   사진을 깔면 **그 업체의 시설인 것처럼** 보입니다 — 표시광고법
   제3조입니다.
   ⚠️⚠️⚠️ 그래서 거기 나오는 것은 **그 업체가 스스로 올린 사진**뿐입니다
   (0051 · `amProviderPhotos`). 0장이면 분류 **아이콘 타일**로 돌아갑니다
   — 사진이 아니라는 것이 보입니다. 둘 사이에 다른 것은 안 넣습니다.
   ⚠️⚠️ 가격은 **업체가 등록한 것만** 냅니다 (`p.prices`). 없으면 줄째
   빠지고, "상담 후 견적" 같은 말도 **우리가 지어낸 약속이라** 안
   적습니다 — 화면은 있는 것만 말합니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var esc = function(s){ return window.esc(s); };
  var ico = function(n, s){ return window.icon(n, s); };

  /* 업체가 등록한 가격 가운데 **가장 싼 것** — 0건이면 null 입니다.
     ⚠️⚠️ 값으로 저장하지 않습니다. 등록된 줄에서 **셉니다**
     (절대 규칙 1 — 저장하면 누군가 그 칸에 숫자를 적어 넣습니다). */
  window.amPriceLow = function(p){
    var L = (p && Array.isArray(p.prices)) ? p.prices : [];
    var ok = L.filter(function(x){
      return x && Number.isFinite(Number(x.amount)) && Number(x.amount) >= 0;
    });
    if(!ok.length) return null;
    var low = ok[0];
    ok.forEach(function(x){ if(Number(x.amount) < Number(low.amount)) low = x; });
    return { amount: Number(low.amount), label: low.label || null,
             unit: low.unit || null, n: ok.length };
  };
  /* 가격 한 줄 — ⚠️ 단위를 **같이** 적습니다. 숫자만 적으면 90만원이
     한 번인지 한 달인지 알 수 없고, 그건 손님이 오해하는 자리입니다. */
  window.amPriceText = function(x){
    if(!x) return "";
    return window.won(x.amount) + "원" + (x.unit ? " / " + x.unit : "");
  };

  window.amCard = function(p, opt){
    opt = opt || {};
    var regs  = window.amProviderRegions(p);
    var cats  = window.amProviderCats(p);
    var scale = window.amProviderScale(p);
    var ok    = window.amProviderVerified(p);
    var meta  = [];
    if(regs.length)  meta.push(regs.join(" · "));
    if(scale)        meta.push(scale);
    /* ⚠️⚠️ 0074 — 연습장 시설 속성 · 이용 시간. **업체가 적은 것만** 냅니다.
       안 적은 업체는 이 줄이 **아예 없습니다**(「정보 없음」을 안 찍습니다 ·
       절대 규칙 2). 연습장이 아닌 업체는 그 칸이 비어 있으므로 저절로
       빠집니다 — 분류로 가르지 않습니다.
       ⚠️ 모르는 키는 `amRangeOptsOf()` 가 **그대로** 냅니다(이름을
       지어내지 않습니다). */
    var ropts = window.amRangeOptsOf ? window.amRangeOptsOf(p) : [];
    if(ropts.length) meta.push(ropts.join(" · "));
    if(p.open_hours) meta.push(String(p.open_hours));
    /* ⚠️⚠️ **센 값입니다** — 후기 줄에서 amRating() 이 셉니다. 0건이면
       null 이고, 그때는 **이 줄째 빠집니다** (절대 규칙 1 · 2).
       ⚠️ 카드에 "후기 0건" 을 찍으면 새로 입점한 업체가 전부 나쁜 업체로
       보입니다 — 그건 우리가 만든 평가입니다. */
    var rate = window.amRating ? window.amRating(p.id) : null;
    var low  = window.amPriceLow(p);
    var url  = window.amProviderUrl(p);

    /* ⚠️⚠️⚠️ **태그를 바꾸지 마세요.** 지금 쓰는 태그(`h3` · `p` ·
       `ul`)에 css/app.css 의 `.pv-*` 규칙이 걸려 있고, 메인 · 분류
       화면도 같은 함수를 부릅니다 — 여기서 span 으로 바꾸면 그 두
       화면의 여백이 조용히 달라집니다 (에러는 안 납니다). */
    var inner =
      '<div class="pv-h"><h3>' + esc(p.name) + '</h3>' +
        (ok.length ? '<span class="pv-ok">' + ico("check", 15) + '확인됨</span>' : '') +
      '</div>' +
      (rate
        ? '<p class="pv-r">' +
            '<span class="stars" aria-hidden="true">' + window.amStarGlyphs(rate.round) + '</span>' +
            '<b>' + esc(rate.avg.toFixed(1)) + '</b>' +
            '<span>후기 ' + esc(String(rate.n)) + '건</span>' +
            '<span class="sr">' + esc(window.amStarLabel(rate.round)) + '</span>' +
          '</p>'
        : '') +
      (meta.length ? '<p class="pv-m">' + esc(meta.join(" · ")) + '</p>' : '') +
      /* ⚠️ 가격은 **업체가 등록한 것만** — 없으면 이 줄이 아예 없습니다 */
      (low
        ? '<p class="pv-p">' +
            (low.label ? '<span class="pv-pl">' + esc(low.label) + '</span>' : '') +
            '<b>' + esc(window.amPriceText(low)) + '</b>' +
            (low.n > 1 ? '<span class="pv-pn">그 밖 ' + esc(String(low.n - 1)) + '가지</span>' : '') +
          '</p>'
        : '') +
      (p.intro ? '<p class="pv-i">' + esc(String(p.intro).slice(0, 90)) + '</p>' : '') +
      (cats.length
        ? '<ul class="pv-c">' + cats.slice(0, 3).map(function(c){
            return '<li>' + esc(c.name) + '</li>';
          }).join("") + '</ul>'
        : '');

    /* 아이콘 타일을 내는 자리에서는 글을 한 겹 더 쌉니다 (가로로 놓습니다).
       ⚠️ 타일이 없을 때는 **한 겹도 더 싸지 않습니다** — 메인 · 분류
       화면의 카드가 지금과 똑같아야 합니다. */
    if(opt.thumb){
      /* ⚠️⚠️ **그 업체가 올린 사진이 있으면 그것을 냅니다** (0051).
         ⚠️ `alt` 에 상호를 적습니다 — "사진" 이라고만 적으면 소리로
         듣는 분께는 어느 업체인지 알 수 없습니다.
         ⚠️ 첫 화면 아래라 lazy 를 답니다 (히어로만 미리 받습니다).
         ⚠️ 0장이면 아이콘 타일로 **그대로** 돌아갑니다. */
      var shots = window.amProviderPhotos ? window.amProviderPhotos(p) : [];
      inner = '<span class="pv-th' + (shots.length ? ' pv-th-ph' : '') +
                '"' + (shots.length ? '' : ' aria-hidden="true"') + '>' +
                (shots.length
                  ? '<img src="' + esc(shots[0].url) + '" alt="' +
                    esc(p.name + ' 시설 사진') + '" loading="lazy" ' +
                    'decoding="async">'
                  : ico((cats[0] && cats[0].icon) || "store", 30)) + '</span>' +
              '<div class="pv-b">' + inner + '</div>';
    }

    /* ⚠️⚠️ 카드 전체가 링크면 그 안에 **단추를 넣을 수 없습니다**
       (링크 안의 단추는 브라우저마다 다르게 굽니다 · 키보드로도
       못 넘어갑니다). 단추를 내는 자리에서는 카드를 묶음으로 바꾸고
       **상호를 링크**로 만듭니다. */
    if(!opt.actions)
      return '<a class="pv" href="' + esc(url) + '">' + inner + '</a>';

    return '<div class="pv pv-act" data-pv="' + esc(p.id) + '">' +
      '<a class="pv-go" href="' + esc(url) + '">' + inner + '</a>' +
      '<div class="pv-btn">' +
        /* ⚠️ "상담 요청" 은 **실제로 되는 것**입니다 — /match 가 그
           업체를 받습니다 (`?pv=`). 눌러도 아무 일이 안 나는 단추가
           아닙니다 (절대 규칙 5). */
        '<a class="btn btn-sm btn-pt" href="/match?pv=' + encodeURIComponent(p.id) +
          '">상담 요청</a>' +
        '<a class="btn btn-sm btn-line" href="' + esc(url) + '">자세히 보기</a>' +
        (opt.compare
          ? '<label class="pv-cmp"><input type="checkbox" class="cmp-x" value="' +
            esc(p.id) + '"><span>비교</span></label>'
          : '') +
      '</div>' +
    '</div>';
  };


  /* ── 레슨 프로 카드 (2026-11-10 · 레슨 지시서 §6) ────────────────
     ⚠️⚠️ **`amCard` 와 모양이 다릅니다** — 거기는 가로 썸네일 + 글,
     여기는 **1:1 정사각 사진이 위**입니다(시안). 그렇다고 `amCard` 를
     고치면 메인 · 업체찾기 · 다른 분류 화면이 **같이** 바뀝니다. 그래서
     이름을 갈라 두되 **같은 파일 한 곳**에 둡니다 — 빌드와 브라우저가
     둘 다 이것을 부릅니다(`.lg` 가 로고이면서 약관이었던 그 자리를
     피하려고 클래스도 `.lsn*` 로 갈랐습니다).

     ⚠️⚠️⚠️ **시안에 있는데 안 그리는 것 둘** —
       · **찜 하트** — 프로를 찜하는 표가 아직 없습니다. 그리면 눌러도
         아무 일이 안 나는 단추입니다(절대 규칙 5 · 0068 에서 그림만
         그려 놓고 만들기 전에 뺀 그 자리).
       · **연습장 이름** — 담는 칸이 없습니다(`provider` 에 레슨 장소가
         없습니다). 지역만 적고, 장소 칸은 프로 직접 등록(§8)에서
         더합니다.
     ⚠️ 평점 · 후기 수는 **센 값**입니다(`amRating`) — 0건이면 그 줄이
     **줄째 빠집니다**. "후기 0건" 을 찍으면 새로 들어온 프로가 전부
     나쁜 프로로 보이고, 그건 우리가 만든 평가입니다(절대 규칙 1 · 2). */
  window.amLessonCard = function(p){
    var ok   = window.amProviderVerified(p);
    var rate = window.amRating ? window.amRating(p.id) : null;
    /* ⚠️⚠️ **레슨 값만** 봅니다 — `amPriceLow()` 는 분류를 안
       가려서, 연습장을 같이 하시는 분의 카드에 타석 요금이
       「1회 레슨 가격」 인 것처럼 찍힙니다(검사가 잡았습니다). */
    var low  = window.amLessonLow ? window.amLessonLow(p) : window.amPriceLow(p);
    var url  = window.amProviderUrl(p);
    var shots = window.amProviderPhotos ? window.amProviderPhotos(p) : [];
    /* 지역 — ⚠️ 시·군·구까지 적어 주셨으면 같이 냅니다(시안이 그렇습니다).
       ⚠️ 비면 그 줄이 **줄째 빠집니다**. */
    var regs = window.amProviderRegions(p);
    var gu   = (p && Array.isArray(p.gu)) ? p.gu.filter(Boolean) : [];
    var where = regs.concat(gu.slice(0, 1)).join(" ");
    /* 전문 레슨 분야 — ⚠️ **레슨 하위만** 냅니다. 그 프로가 다른 분류도
       하시면 그 하위까지 칩으로 내면 레슨 화면에서 엉뚱한 말이 됩니다. */
    var subs = (window.amProviderSubs ? window.amProviderSubs(p) : [])
      .map(function(k){ return window.amSub ? window.amSub(k) : null; })
      .filter(function(s){ return s && s.cat && s.cat.key === "lesson" &&
                                  s.item && s.item.name; });

    /* ⚠️⚠️⚠️ **카드 전체를 `<a>` 로 감싸지 않습니다** — 확정 시안 ④ 는
       카드 안에 「프로필 보기」 단추가 있습니다. 감싸면 링크 안에 링크가
       들어가 어느 쪽이 눌리는지 브라우저마다 다릅니다(0069 에서 찜 단추로
       겪은 그 자리). 대신 그 단추가 **카드 전체**로 넓어집니다
       (`.lsn-go::after` 가 카드를 덮습니다) — 링크는 여전히 하나이고,
       누르는 자리는 카드 전체입니다. */
    return '<article class="lsn-c">' +
      '<span class="lsn-ph' + (shots.length ? " lsn-ph-on" : "") + '"' +
        (shots.length ? "" : ' aria-hidden="true"') + '>' +
        (shots.length
          ? '<img src="' + esc(shots[0].url) + '" alt="' +
            esc(p.name + " 사진") + '" loading="lazy" decoding="async">'
          : ico("swing", 30)) +
      '</span>' +
      '<span class="lsn-b">' +
        '<span class="lsn-n">' + esc(p.name) +
          (ok.length ? '<i class="lsn-ok">' + ico("check", 14) +
            '<span class="sr">확인된 자격이 있습니다</span></i>' : "") +
        '</span>' +
        (where ? '<span class="lsn-loc">' + ico("pin", 14) + esc(where) + '</span>' : "") +
        (rate
          ? '<span class="lsn-r">' +
              '<span class="stars" aria-hidden="true">' +
                window.amStarGlyphs(rate.round) + '</span>' +
              '<b>' + esc(rate.avg.toFixed(1)) + '</b>' +
              '<span>(' + esc(String(rate.n)) + ')</span>' +
              '<span class="sr">' + esc(window.amStarLabel(rate.round)) + '</span>' +
            '</span>'
          : "") +
        (subs.length
          ? '<span class="lsn-s">' + subs.slice(0, 3).map(function(s){
              return '<i>' + esc(s.item.name) + '</i>';
            }).join("") + '</span>'
          : "") +
        /* ⚠️⚠️ 값은 **프로가 등록한 것만** 냅니다. 0건이면 "가격 문의" 도
           안 적습니다 — 그건 우리가 지어낸 약속입니다(절대 규칙 5).
           대신 **등록 전이라는 사실**을 적습니다. */
        (low
          ? '<span class="lsn-p">' + esc(window.amPriceText(low)) +
            (low.n > 1 ? '<i>부터</i>' : "") + '</span>'
          : '<span class="lsn-p lsn-p0">등록된 레슨 가격이 아직 없습니다</span>') +
        '<a class="btn btn-pri lsn-go" href="' + esc(url) + '">프로필 보기</a>' +
      '</span>' +
    '</article>';
  };

  window.amLessonGrid = function(list){
    return '<div class="lsn-g">' + (list || []).map(function(p){
      return window.amLessonCard(p);
    }).join("") + '</div>';
  };


  /* ── 연습장 카드 (확정 시안 ⑤) ──────────────────────────────────
     ⚠️⚠️ **`amCard` · `amLessonCard` 와 또 모양이 다릅니다** — 시안 ⑤ 는
     **가로 카드**이고 오른쪽 끝에 단추가 **둘**입니다(시설 정보 · 예약
     문의). `amCard` 를 고치면 메인 · 업체찾기 · 다른 분류가 같이 바뀌므로
     이름을 갈라 두되 **같은 파일 한 곳**에 둡니다 — 빌드와 브라우저가
     둘 다 이것을 부릅니다.
     ⚠️⚠️⚠️ **카드 전체를 `<a>` 로 감싸지 않습니다.** 안에 단추가 둘이라
     감싸면 어느 쪽이 눌리는지 브라우저마다 다릅니다(0069 에서 찜 단추를
     링크 바깥으로 뺀 그 자리). 이름만 링크이고 단추는 따로 섭니다.
     ⚠️⚠️ **시안의 「예약 문의 가능」은 상태 딱지로 읽힙니다 — 우리에게
     그 상태가 없습니다.** 예약을 받는지 안 받는지를 담는 칸이 없고,
     있다고 적으면 지어낸 약속입니다(절대 규칙 5). 그래서 **단추**로
     두고 글자도 「예약 문의」입니다 — 누르면 그 업체로 요청이 갑니다.
     ⚠️ 가격 · 시설 칩 · 지역은 **업체가 적은 것만** 냅니다. 비면 그
     줄이 줄째 빠집니다(「정보 없음」을 안 찍습니다 · 절대 규칙 2). */
  window.amRangeCard = function(p){
    var ok    = window.amProviderVerified(p);
    /* ⚠️⚠️ **연습장 값만** 봅니다 — `amPriceLow()` 는 분류를 안 가려서,
       레슨도 하시는 연습장 카드에 레슨 회차권 값이 「1회 60분」인 것처럼
       찍힙니다(2026-11-10 에 레슨 화면에서 겪은 그 자리). */
    var low   = window.amRangeLow ? window.amRangeLow(p) : null;
    /* ⚠️⚠️ **센 값입니다** — 후기 줄에서 `amRating()` 이 셉니다.
       0건이면 null 이고 그때는 **이 줄째 빠집니다**(절대 규칙 1 · 2) —
       「후기 0건」을 찍으면 새로 입점한 곳이 전부 나쁜 곳으로 보입니다. */
    var rate  = window.amRating ? window.amRating(p.id) : null;
    var url   = window.amProviderUrl(p);
    var shots = window.amProviderPhotos ? window.amProviderPhotos(p) : [];
    var regs  = window.amProviderRegions(p);
    var gu    = (p && Array.isArray(p.gu)) ? p.gu.filter(Boolean) : [];
    var where = regs.concat(gu.slice(0, 1)).join(" ");
    var opts  = window.amRangeOptsOf ? window.amRangeOptsOf(p) : [];

    return '<li class="rng-c">' +
      '<a class="rng-ph' + (shots.length ? " rng-ph-on" : "") + '" href="' +
        esc(url) + '" tabindex="-1" aria-hidden="true">' +
        (shots.length
          ? '<img src="' + esc(shots[0].url) + '" alt="" ' +
            'loading="lazy" decoding="async">'
          : ico("flag", 26)) +
      '</a>' +
      '<div class="rng-b">' +
        '<h3 class="rng-n"><a href="' + esc(url) + '">' + esc(p.name) + '</a>' +
          (ok.length ? '<i class="rng-ok">' + ico("check", 14) +
            '<span class="sr">확인된 자격이 있습니다</span></i>' : "") +
        '</h3>' +
        (where ? '<p class="rng-loc">' + ico("pin", 14) + esc(where) + '</p>' : "") +
        (rate
          ? '<p class="rng-r">' +
              '<span class="stars" aria-hidden="true">' +
                window.amStarGlyphs(rate.round) + '</span>' +
              '<b>' + esc(rate.avg.toFixed(1)) + '</b>' +
              '<span>후기 ' + esc(String(rate.n)) + '건</span>' +
              '<span class="sr">' + esc(window.amStarLabel(rate.round)) + '</span>' +
            '</p>'
          : "") +
        /* ⚠️ 「1회 60분」 은 시안의 글자인데 **시간을 담는 칸이 없습니다** —
           업체가 등록한 값의 이름(`label`)을 그대로 냅니다(지어내지
           않습니다). 값이 0건이면 **등록 전이라는 사실**을 적습니다. */
        (low
          ? '<p class="rng-p">' + ico("coin", 14) +
            (low.label ? '<span class="rng-pl">' + esc(low.label) + '</span>' : "") +
            '<b>' + esc(window.amPriceText(low)) + '</b>' +
            (low.n > 1 ? '<i>부터</i>' : "") + '</p>'
          : '<p class="rng-p rng-p0">등록된 이용 가격이 아직 없습니다</p>') +
        (opts.length
          ? '<p class="rng-s">' + opts.map(function(n){
              return '<i>' + esc(n) + '</i>';
            }).join("") + '</p>'
          : "") +
      '</div>' +
      '<p class="rng-act">' +
        '<a class="btn btn-line btn-sm" href="' + esc(url) + '">시설 정보</a>' +
        '<a class="btn btn-pri btn-sm" href="/match?cat=range&amp;pv=' +
          esc(encodeURIComponent(p.id)) + '">예약 문의</a>' +
      '</p>' +
    '</li>';
  };

  window.amRangeGrid = function(list){
    return '<ul class="rng-g">' + (list || []).map(function(p){
      return window.amRangeCard(p);
    }).join("") + '</ul>';
  };

  /* ════════════════════════════════════════════════════════════════
     피팅 · 수리 카드 (확정 시안 ⑦)
     ⚠️ 가격 · 하위 칩 · 지역 · 이용 방식은 **업체가 적은 것만** 냅니다.
       비면 그 줄이 줄째 빠집니다 (절대 규칙 2 — 자리표시자를 안 찍습니다).
     ⚠️⚠️ 시안의 「부품비 별도 · 최종 견적 상담」을 **안 적습니다** —
       우리가 모르는 거래 조건이고 업체마다 다릅니다(0076 머리말).
       대신 **등록된 값이라는 사실**만 적습니다.
     ════════════════════════════════════════════════════════════════ */
  window.amFitCard = function(p){
    var ok    = window.amProviderVerified(p);
    var low   = window.amFitLow ? window.amFitLow(p) : null;
    /* ⚠️⚠️ **센 값입니다** — 0건이면 null 이고 이 줄이 줄째 빠집니다.
       ⚠️ 시안에는 별이 없지만 **차례에 「후기 평점순」이 있습니다** —
       골라도 무엇으로 줄 세웠는지 카드에 안 보이면 손님은 그 칸이
       일을 하는지 알 길이 없습니다. */
    var rate  = window.amRating ? window.amRating(p.id) : null;
    var url   = window.amProviderUrl(p);
    var shots = window.amProviderPhotos ? window.amProviderPhotos(p) : [];
    var regs  = window.amProviderRegions(p);
    var gu    = (p && Array.isArray(p.gu)) ? p.gu.filter(Boolean) : [];
    var where = regs.concat(gu.slice(0, 1)).join(" ");
    var ways  = window.amFitWaysOf ? window.amFitWaysOf(p) : [];
    /* 그 업체가 하는 **피팅 하위**만 — 다른 분류의 하위를 섞으면
       「골프 조인」이 피팅 칩으로 찍힙니다 */
    var cat   = window.amCat ? window.amCat("fitting") : null;
    var items = (cat && window.amCatItems) ? window.amCatItems(cat) : [];
    var subs  = (p && Array.isArray(p.subs)) ? p.subs : [];
    var mine  = items.filter(function(i){ return subs.indexOf(i.key) >= 0; });

    return '<li class="fit-c">' +
      '<a class="fit-ph' + (shots.length ? " fit-ph-on" : "") + '" href="' +
        esc(url) + '" tabindex="-1" aria-hidden="true">' +
        (shots.length
          ? '<img src="' + esc(shots[0].url) + '" alt="" ' +
            'loading="lazy" decoding="async">'
          : ico("clubs", 26)) +
      '</a>' +
      '<div class="fit-b">' +
        '<h3 class="fit-n"><a href="' + esc(url) + '">' + esc(p.name) + '</a>' +
          (ok.length ? '<i class="fit-ok">' + ico("check", 14) +
            '<span class="sr">확인된 자격이 있습니다</span></i>' : "") +
        '</h3>' +
        (where ? '<p class="fit-loc">' + ico("pin", 14) + esc(where) + '</p>' : "") +
        (rate
          ? '<p class="fit-r">' +
              '<span class="stars" aria-hidden="true">' +
                window.amStarGlyphs(rate.round) + '</span>' +
              '<b>' + esc(rate.avg.toFixed(1)) + '</b>' +
              '<span>후기 ' + esc(String(rate.n)) + '건</span>' +
              '<span class="sr">' + esc(window.amStarLabel(rate.round)) + '</span>' +
            '</p>'
          : "") +
        (mine.length
          ? '<p class="fit-s">' + mine.map(function(i){
              return '<i>' + esc(i.name) + '</i>';
            }).join("") + '</p>'
          : "") +
        (low
          ? '<p class="fit-p">' + ico("coin", 14) +
            (low.label ? '<span class="fit-pl">' + esc(low.label) + '</span>' : "") +
            '<b>' + esc(window.amPriceText(low)) + '</b>' +
            (low.n > 1 ? '<i>부터</i>' : "") + '</p>' +
            '<p class="fit-pn">업체가 등록한 가격입니다 · 최종 금액은 상담에서 정해집니다</p>'
          : '<p class="fit-p fit-p0">등록된 공임이 아직 없습니다</p>') +
        (ways.length
          ? '<p class="fit-w">' + ways.map(function(n){
              return '<i>' + esc(n) + '</i>';
            }).join("") + '</p>'
          : "") +
        /* ⚠️⚠️⚠️ 0079 — **업체가 적은 글자 그대로** 냅니다(부품비 포함
           여부 등). 안 적으신 업체는 이 줄이 **줄째 빠집니다** —
           「부품비 별도」 를 저희가 지어 적으면 그 순간 업체가 하지
           않은 약속이 손님 화면에 나갑니다(절대 규칙 1 · 2). */
        (p.fit_terms
          ? '<p class="fit-t">' + ico("info", 14) + esc(p.fit_terms) + '</p>'
          : "") +
      '</div>' +
      '<p class="fit-act">' +
        '<a class="btn btn-line btn-sm" href="' + esc(url) + '">업체 상세</a>' +
        '<a class="btn btn-pri btn-sm" href="/match?cat=fitting&amp;pv=' +
          esc(encodeURIComponent(p.id)) + '">상담 요청</a>' +
      '</p>' +
    '</li>';
  };

  window.amFitGrid = function(list){
    return '<ul class="fit-g">' + (list || []).map(function(p){
      return window.amFitCard(p);
    }).join("") + '</ul>';
  };


  /* ── 골프용품 마켓 상품 카드 (확정 시안 ⑥ · 2026-11-13) ──────────
     ⚠️⚠️⚠️ **빌드와 브라우저가 같은 함수를 부릅니다** — 두 벌로 적으면
       거르개를 누르는 순간 카드가 조용히 달라지고, 그려진 화면만 보는
       검사는 영원히 통과합니다(`amCard` 에서 세운 규칙).
     ⚠️⚠️ **사진을 안 깝니다** — `provider_price` 에 사진 칸이 없습니다.
       분류 사진이나 남의 사진을 깔면 그 상품인 것처럼 보입니다
       (절대 규칙 1 · 업체 카드가 0장일 때 아이콘 타일로 돌아가는 그
       규칙). 시안의 상품 사진 여덟 장은 예시 데이터입니다.
     ⚠️ 「상품 상세」는 `/pro/<업체>` 입니다 — 상품마다 주소를 따로 내면
       같은 내용이 두 주소로 나갑니다. */
  window.amMkCard = function(it){
    var e = window.esc, I = window.icon;
    var sub = window.amSub ? window.amSub("market", it.sub) : null;
    var subName = (sub && sub.item && sub.item.name) || "";
    var url = window.amProviderUrl
      ? window.amProviderUrl({ id: it.pid }) : ("/pro/" + it.pid);
    return '<li class="mkc">' +
      '<span class="mkc-ph" aria-hidden="true">' + I("bag", 30) + '</span>' +
      '<div class="mkc-b">' +
        (subName ? '<p class="mkc-s">' + e(subName) + '</p>' : "") +
        '<h3 class="mkc-n">' + e(it.label) + '</h3>' +
        '<p class="mkc-st">' + I("store", 14) + e(it.store) + '</p>' +
        '<p class="mkc-p"><b>' + e(window.won(it.amount)) + '원</b>' +
          (it.unit ? '<i>/ ' + e(it.unit) + '</i>' : "") + '</p>' +
        /* ⚠️ 비고(「부품비 별도」 같은 줄)는 **업체가 적은 값**입니다 —
           비면 줄째 빠집니다(우리가 지어 적지 않습니다). */
        (it.note ? '<p class="mkc-note">' + e(it.note) + '</p>' : "") +
      '</div>' +
      '<p class="mkc-act">' +
        '<a class="btn btn-line btn-sm" href="' + e(url) + '">상품 상세</a>' +
      '</p>' +
    '</li>';
  };

  window.amMkGrid = function(list){
    return '<ul class="mkg">' + (list || []).map(function(it){
      return window.amMkCard(it);
    }).join("") + '</ul>';
  };

  window.amCardGrid = function(list, opt){
    return '<div class="pvs">' + (list || []).map(function(p){
      return window.amCard(p, opt);
    }).join("") + '</div>';
  };
})();

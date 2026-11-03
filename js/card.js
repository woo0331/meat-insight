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
   ⚠️⚠️ **사진 칸에 남의 사진을 깔지 않습니다.** 업체가 올린 사진을
   담는 자리가 아직 없어서(업체용 사진 버킷이 없습니다), 그 자리에
   골프장 사진을 깔면 **그 업체의 시설인 것처럼** 보입니다 — 표시광고법
   제3조입니다. 그래서 분류 **아이콘 타일**을 냅니다 (사진이 아니라는
   것이 보입니다).
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
    if(opt.thumb)
      inner = '<span class="pv-th" aria-hidden="true">' +
                ico((cats[0] && cats[0].icon) || "store", 30) + '</span>' +
              '<div class="pv-b">' + inner + '</div>';

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

  window.amCardGrid = function(list, opt){
    return '<div class="pvs">' + (list || []).map(function(p){
      return window.amCard(p, opt);
    }).join("") + '</div>';
  };
})();

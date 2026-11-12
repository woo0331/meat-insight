/* ════════════════════════════════════════════════════════════════════
   업체 하나 — /pro/<id>

   ⚠️⚠️ **업체가 적은 글은 전부 esc() 를 거칩니다** (절대 규칙 4).
   소개 · 브랜드 · 상담 시간은 업체가 직접 적는 칸입니다.

   ⚠️⚠️ **평점은 저장된 값이 아니라 센 값입니다.** 후기 줄에서
   amRating() 한 함수로 셉니다 (js/data/review.js · 절대 규칙 1).
   ⚠️⚠️ **0건이면 숫자를 안 찍습니다** — amRating() 이 null 을 돌려주고
   화면이 그것을 보고 갈라집니다. "평점 0.0" 을 찍으면 나쁜 업체로
   읽힙니다.
   ⚠️⚠️ 구조화 데이터에 **aggregateRating 을 안 넣습니다.** 후기가
   생겨도 넣지 않습니다 — 우리가 별점을 검증할 길이 없고, 적발되면
   리치 결과가 통째로 막힙니다 (작업 기억의 그 줄).

   ⚠️ **연락처를 화면에 두지 않습니다.** 업체 연락처는 상담이 연결될 때
   건네집니다 — 여기 두면 중개를 건너뛴 거래가 되고, 그 거래에는
   저희가 아무 책임도 못 집니다.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

exports.build = function(p){
  var cats  = W.amProviderCats(p);
  var subs  = W.amProviderSubs(p);
  var regs  = W.amProviderRegions(p);
  var scale = W.amProviderScale(p);
  var brands = W.amProviderBrands(p);
  var ok    = W.amProviderVerified(p);
  /* ⚠️ 센 값입니다 — 0건이면 **null** 입니다 */
  var rate  = W.amRating(p.id);
  var revs  = W.amReviewsOf(p.id);

  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    (cats.length
      ? '<a href="' + esc(W.amCatUrl(cats[0])) + '">' + esc(cats[0].name) + '</a>' + icon("arrow",14)
      : '<a href="/search">업체찾기</a>' + icon("arrow",14)) +
    '<span aria-current="page">' + esc(p.name) + '</span></nav>' +
    '<h1>' + esc(p.name) + '</h1>' +
    (p.intro ? '<p class="pghd-l">' + esc(p.intro) + '</p>' : '') +
    /* ⚠️⚠️ 0건이면 **이 줄째 빠집니다** (절대 규칙 2) — "평점 없음" 을
       머리말에 찍으면 그게 나쁜 평가로 읽힙니다. 아래 후기 자리에서
       사람 말로 말합니다.
       ⚠️ 별 글자는 소리로 들으면 뜻이 없어 aria-hidden 을 달고, 같은
       뜻을 .sr 로 한 번 적습니다. */
    (rate
      ? '<p class="pghd-rate">' +
          '<span class="stars" aria-hidden="true">' + W.amStarGlyphs(rate.round) + '</span>' +
          '<b>' + esc(rate.avg.toFixed(1)) + '</b>' +
          '<span class="pghd-rn">후기 ' + esc(String(rate.n)) + '건</span>' +
          '<span class="sr">' + esc(W.amStarLabel(rate.round)) + '</span>' +
        '</p>'
      : '') +
    (ok.length
      ? '<ul class="chips" style="margin-top:14px">' + ok.map(function(t){
          return '<li><span class="chip chip-ok">' + icon("check",16) + esc(t) + '</span></li>';
        }).join("") + '</ul>'
      : '') +
  '</div></section>';

  /* ⚠️ 값이 없는 줄은 **줄째 뺍니다** — "(미기재)" 를 찍지 않습니다 */
  var rows = [];
  if(cats.length)   rows.push(["하는 일", cats.map(function(c){ return c.name; }).join(" · ")]);
  if(regs.length)   rows.push(["영업 지역", regs.join(" · ")]);
  if(scale)         rows.push(["거래 규모", scale]);
  if(brands.length) rows.push(["취급 브랜드", brands.join(" · ")]);
  if(p.since)       rows.push(["시작한 해", String(p.since) + "년"]);
  if(p.consult_hours) rows.push(["상담 가능 시간", p.consult_hours]);
  /* 상담 방식 (0044) — ⚠️ 업체가 고른 것만. 0건이면 **줄째 빠집니다**
     ("미정" 을 찍지 않습니다 · 절대 규칙 2). */
  var ways = W.amContactWays ? W.amContactWays(p) : [];
  if(ways.length)     rows.push(["상담 방식", ways.join(" · ")]);
  /* 피팅 이용 방식 (0076) · 거래 조건 (0079) — ⚠️⚠️⚠️ **업체가 적은
     값만** 냅니다. 「부품비 별도」 같은 말을 저희가 지어 적으면 그
     순간 **업체가 하지 않은 약속**이 손님 화면에 나갑니다(절대 규칙
     1 · 5). 안 적으신 업체는 그 줄이 **줄째 빠집니다**.
     ⚠️ 카드(`js/card.js` 의 `.fit-t`)와 **같은 값**을 냅니다 — 두 곳이
     다른 말을 하면 카드를 보고 들어온 분이 상세에서 다른 조건을
     읽습니다. */
  var fw = W.amFitWaysOf ? W.amFitWaysOf(p) : [];
  if(fw.length)       rows.push(["클럽 받는 방식", fw.join(" · ")]);
  if(p.fit_terms)     rows.push(["거래 조건", p.fit_terms]);

  if(rows.length){
    body += '<section class="sec"><div class="wrap">' +
      '<div class="sec-hd"><h2>업체 정보</h2></div>' +
      '<div class="doc-t"><table><tbody>' + rows.map(function(r){
        return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>';
      }).join("") + '</tbody></table></div></div></section>';
  }

  /* ── 업체가 올린 시설 사진 (0051) ────────────────────────────────
     ⚠️⚠️⚠️ **그 업체가 스스로 올린 것만** 냅니다. 아무 골프장 사진을
     깔면 그 업체의 시설인 것처럼 보이고, 그건 표시광고법 제3조입니다.
     ⚠️ 0장이면 이 구간이 **아예 없습니다** (빈 액자를 두지 않습니다).
     ⚠️⚠️ **증빙서류는 여기 한 장도 안 옵니다** — 공개 보기
     (`v_provider_photo_public`)에 그 줄이 없습니다 (0051).
     ⚠️ `alt` 에 상호를 적습니다 — "사진" 이라고만 적으면 소리로 듣는
     분께는 어느 업체인지 알 수 없습니다. */
  var shots = W.amProviderPhotos ? W.amProviderPhotos(p) : [];
  if(shots.length){
    body += '<section class="sec"><div class="wrap">' +
      '<div class="sec-hd"><h2>업체가 올린 사진 ' + W.won(shots.length) + '장</h2>' +
      '<p>업체가 직접 올린 시설 사진입니다. 골프올인원이 찍거나 고른 ' +
      '사진이 아닙니다.</p></div>' +
      '<ul class="pvsh">' + shots.map(function(x){
        return '<li>' +
          '<img src="' + esc(x.url) + '" alt="' + esc(p.name + ' 시설 사진') +
            '" loading="lazy" decoding="async">' +
          (x.caption ? '<p>' + esc(x.caption) + '</p>' : '') +
        '</li>';
      }).join("") + '</ul></div></section>';
  }

  /* ── 등록된 가격 (0042) ───────────────────────────────────────────
     ⚠️⚠️ **업체가 스스로 등록한 것만** 냅니다. 0건이면 이 구간이
     **아예 없습니다** — "상담 후 견적" 같은 말을 우리가 지어 넣지
     않습니다 (절대 규칙 1 · 5). 그 대신 아래 상담 단추가 늘 있습니다.
     ⚠️ 단위를 **금액 옆에** 적습니다 — 한 번 값인지 한 달 값인지가
     빠지면 그게 손님이 오해하는 자리입니다.
     ⚠️ 싼 순서로 둡니다 (pull 이 amount 로 줄 세워 가져옵니다) —
     우리가 고른 차례가 아니라 숫자 차례입니다. */
  var prices = Array.isArray(p.prices) ? p.prices : [];
  if(prices.length){
    body += '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>등록된 가격 ' + W.won(prices.length) + '가지</h2>' +
      '<p>업체가 직접 등록한 금액입니다. 조건에 따라 달라질 수 있어 ' +
      '상담에서 확정합니다 — 골프올인원은 거래 당사자가 아닙니다.</p></div>' +
      '<div class="doc-t"><table><thead><tr>' +
        '<th scope="col">무엇</th><th scope="col">서비스</th>' +
        '<th scope="col">금액</th></tr></thead><tbody>' +
      prices.map(function(x){
        var f = W.amSub(x.sub);
        return '<tr><th scope="row">' + esc(x.label) +
          (x.note ? '<i class="fe-d">' + esc(x.note) + '</i>' : '') + '</th>' +
          '<td>' + esc(f ? (f.cat.name + " · " + f.item.name) : x.sub) + '</td>' +
          '<td class="pr-amt"><b>' + esc(W.won(x.amount)) + '원</b>' +
            ' / ' + esc(x.unit) + '</td></tr>';
      }).join("") + '</tbody></table></div></div></section>';
  }

  if(subs.length){
    body += '<section class="sec' + (prices.length ? '' : ' sec-alt') + '"><div class="wrap">' +
      '<div class="sec-hd"><h2>이 업체가 다루는 것</h2></div>' +
      '<ul class="chips">' + subs.map(function(k){
        var f = W.amSub(k);
        return '<li><span class="chip">' + esc(f.item.name) + '</span></li>';
      }).join("") + '</ul></div></section>';
  }

  /* ── 후기 (0037) ──────────────────────────────────────────────────
     ⚠️⚠️ **손님이 쓴 글입니다 — 전부 esc() 를 거칩니다** (절대 규칙 4).
     ⚠️⚠️ 0건이면 **지어내지 않고 0 이라고 말합니다**, 그리고 막다른
     길로 두지 않습니다 — 누가 쓸 수 있는지와 지금 할 수 있는 것을
     같이 냅니다 (절대 규칙 2).
     ⚠️ 평점 순으로 줄 세우지 않습니다 (amReviewsOf 가 새것부터
     돌려줍니다) — 좋은 말만 위로 올리면 그게 플랫폼의 편집입니다. */
  body += '<section class="sec' + (subs.length ? '' : ' sec-alt') + '">' +
    '<div class="wrap"><div class="sec-hd">' +
    '<h2>후기' + (rate ? ' ' + esc(String(rate.n)) + '건' : '') + '</h2>' +
    (rate
      ? '<p>' + esc("실제로 이 업체의 견적을 고르시거나 만나신 분만 쓰실 수 있습니다. " +
                    "평균 " + rate.avg.toFixed(1) + "점입니다.") + '</p>'
      : '<p>아직 후기가 없습니다.</p>') +
    '</div>';

  if(revs.length){
    body += '<ul class="rvs">' + revs.map(function(v){
      return '<li class="rv">' +
        '<div class="rv-h">' +
          '<span class="stars" aria-hidden="true">' + W.amStarGlyphs(v.rating) + '</span>' +
          '<span class="sr">' + esc(W.amStarLabel(v.rating)) + '</span>' +
          /* ⚠️ 작성자는 **마스킹된 값**만 옵니다 (0037 의 보기) */
          '<b class="rv-w">' + esc(v.who || "회원") + '</b>' +
          '<span class="rv-d">' + esc(W.amDay(v.created_at)) +
          (v.edited ? " · 고침" : "") + '</span>' +
        '</div>' +
        '<p class="rv-b">' + esc(v.body) + '</p>' +
        /* 업체의 답변 — ⚠️ 업체가 적은 글이므로 이것도 esc() 입니다 */
        (v.reply
          ? '<div class="rv-r"><b>' + esc(p.name) + ' 답변</b>' +
            (v.reply_at ? '<span class="rv-d">' + esc(W.amDay(v.reply_at)) + '</span>' : '') +
            '<p>' + esc(v.reply) + '</p></div>'
          : '') +
      '</li>';
    }).join("") + '</ul>';
  }else{
    /* ⚠️⚠️ **눌러도 아무 일이 안 나는 단추를 만들지 않습니다** — 후기를
       쓰는 자리는 /my 의 내 요청 안입니다 (조건이 맞을 때만 열립니다).
       그래서 여기서는 그 길을 **말로** 알리고, 지금 실제로 되는 것을
       단추로 냅니다. */
    body += '<div class="none none-sm">' +
      '<p>후기는 <b>이 업체의 견적을 고르시거나 만나신 뒤</b> ' +
      '<b>내 정보 → 내 요청</b>에서 쓰실 수 있습니다. ' +
      '그래서 겪지 않은 분이 쓴 글은 여기에 올라오지 않습니다.</p>' +
      '<a class="btn btn-line" href="/match?pv=' + encodeURIComponent(p.id) + '">' +
        icon("match", 18) + '이 업체로 요청하기</a>' +
      '</div>';
  }
  body += '</div></section>';

  /* ⚠️⚠️ 전자상거래법 제20조 — 푸터에도 있지만 **거래가 일어나는 화면**
     에서 한 번 더 분명히 합니다. */
  /* ⚠️⚠️⚠️ **"이 업체에 바로 간다" 고 말하지 않습니다.** 배정은 운영자가
     하고, 넘기는 순간 **상호를 알리고 제3자 제공 동의를 다시** 받습니다
     (개인정보보호법 제17조 제2항). 손님이 여기서 적어 주시는 것은
     **바람**이고, 화면도 그렇게 적습니다 — 지키지 못할 약속을 하면
     그 순간 거짓말입니다 (절대 규칙 5).
     ⚠️ 주소에 `pv` 를 실어 보냅니다 — `/match` 가 그것을 읽어 이 업체가
     하는 것을 미리 골라 두고, 운영자 화면에 "이 업체를 보고 왔습니다"
     로 보입니다 (0035). */
  body += '<section class="sec"><div class="wrap"><div class="none">' +
    '<h2>이 업체로 상담을 요청하실 수 있습니다.</h2>' +
    '<p>요청하시면 <b>운영자가 조건을 확인한 뒤</b> 이 업체에 전달합니다. ' +
    '전달하기 전에 <b>어느 업체인지 알려 드리고 연락처 전달 동의를 다시</b> ' +
    '여쭙습니다 — 동의하지 않으시면 전달되지 않습니다.</p>' +
    '<p class="none-sub">바로 이 업체로 간다는 약속은 아닙니다. ' +
    '조건이 맞지 않으면 다른 업체를 함께 알려 드립니다.</p>' +
    '<a class="btn btn-pt" href="/match?pv=' + encodeURIComponent(p.id) + '">' +
      icon("match",18) + '이 업체로 요청하기</a>' +
    (cats.length
      ? '<a class="btn btn-line" href="' + esc(W.amCatUrl(cats[0])) + '">' +
        icon("arrow",18) + esc(cats[0].name) + ' 다른 업체 보기</a>'
      : '<a class="btn btn-line" href="/categories">' + icon("arrow",18) + '카테고리 둘러보기</a>') +
    '</div></div></section>';

  /* ══ 사업자 정보 (0057) ══════════════════════════════════════════
     ⚠️⚠️⚠️ **전자상거래법 제20조 제2항 · 시행령 제25조** — 중개자는
     입점업체가 사업자일 때 그 **상호 · 대표자 성명 · 주소 · 전화번호 ·
     전자우편주소 · 사업자등록번호**를 손님이 볼 수 있게 해야 합니다.
     공정위가 2026 년에 당근마켓에 시정명령과 과태료를 부과한 조항이
     바로 이것입니다.
     ⚠️ 2026-11-06 까지 이 화면은 `사업자등록 확인` **배지만** 냈습니다 —
     번호도 · 대표자도 · 주소도 없었습니다. 자료는 입점 신청
     (`provider_apply`)에 일부 있었지만 그 표는 **운영자만** 읽습니다.
     ⚠️⚠️ 값을 **지어내지 않습니다** (절대 규칙 1). 비면 그 줄이 빠지고,
     다 비면 구간 대신 **고객센터로 가는 길**을 냅니다 (절대 규칙 2) —
     "확인 중입니다" 같은 지키지 못할 말을 하지 않습니다.
     ⚠️ 무엇이 비었는지는 손님에게 적지 않고 `console.warn` 으로
     운영자에게만 말합니다 (절대 규칙 3).
     ⚠️ 상호는 **제목이 이미 그것**이라 줄로 또 내지 않습니다. */
  var ident = W.amProviderIdent(p);
  body += '<section class="sec"><div class="wrap">' +
    '<div class="sec-hd"><h2>사업자 정보</h2></div>' +
    (ident.length
      ? '<dl class="pvid">' + ident.map(function(f){
          return '<dt>' + esc(f.name) + '</dt><dd>' + esc(f.value) + '</dd>';
        }).join("") + '</dl>' +
        '<p class="pvid-s">이 업체가 등록한 사업자 정보입니다. ' +
        '거래 조건과 이행에 관한 책임은 이 업체에 있습니다.</p>'
      : '<p class="pvid-s">이 업체의 사업자 정보가 <b>아직 등록되지 ' +
        '않았습니다.</b> 거래하시기 전에 확인이 필요하시면 고객센터로 ' +
        '문의해 주세요.</p>' +
        '<p><a class="btn btn-line btn-sm" href="/help">' + icon("chat",18) +
        '고객센터에 문의하기</a></p>') +
    '</div></section>';
  if(!ident.length){
    /* ⚠️ 한글을 이스케이프로 적지 않습니다 (낱말이 조용히 망가집니다) */
    console.warn("  ⚠️ " + p.id + " — 사업자 신원정보가 한 칸도 없습니다 " +
      "(전자상거래법 제20조 제2항) — /admin 업체 심사에서 적어 주세요.");
  }

  /* ══ 개인인가 사업자인가 — 전자상거래법 제20조의4 ③   (0071) ══════
     ⚠️⚠️⚠️ **구분해 표시해야 합니다.** `/join` 이 「사업자등록 없어도
     신청하실 수 있습니다」 로 문을 열었으므로 손님 화면에 개인 프로와
     사업자가 섞입니다. 그때 법이 구분해 표시하라고 합니다.
     ⚠️⚠️ **모르면 그 줄을 줄째 뺍니다**(`kind` 가 null) — 「미확인」 같은
     말도 안 찍습니다(그것도 우리가 만든 평가입니다 · 절대 규칙 1 · 2).
     ⚠️ 켜는 자리는 `/admin` 의 `set_provider_kind`(**관리자만**)이고,
     `brn` 이 비었다고 '개인' 으로 읽지 않습니다. */
  var pkind = W.amPvKind ? W.amPvKind(p) : null;

  /* ══ 레슨 장소 · 레슨 목적 (0071) ═══════════════════════════════
     ⚠️ 비면 **줄째 빠집니다** — 「미정」 을 지어 적지 않습니다.
     ⚠️ 레슨 목적 이름을 푸는 자리는 `amLessonGoalsOf()` 한 곳이고,
     모르는 키는 **그 글자를 그대로** 냅니다(이름을 지어내지 않습니다). */
  var pgoals = W.amLessonGoalsOf ? W.amLessonGoalsOf(p) : [];
  var pplace = (p.place_name || "").trim();
  if(pkind || pplace || pgoals.length){
    body += '<section class="sec"><div class="wrap">' +
      '<div class="sec-hd"><h2>이 프로 · 업체에 대해</h2></div>' +
      '<dl class="pvid">' +
        (pkind
          ? '<dt>구분</dt><dd><b>' + esc(pkind.name) + '</b>' +
            (pkind.note ? ' <span class="pvid-s">' + esc(pkind.note) + '</span>' : '') +
            '</dd>'
          : '') +
        (pplace ? '<dt>레슨 · 연습 장소</dt><dd>' + esc(pplace) + '</dd>' : '') +
        (pgoals.length
          ? '<dt>이런 분을 가르칩니다</dt><dd>' +
            pgoals.map(function(g){ return esc(g); }).join(" · ") + '</dd>'
          : '') +
      '</dl>' +
      /* ⚠️⚠️ 개인이면 **분쟁 때 무엇을 하는지**를 그 자리에서 말합니다
         (제20조의4 ②) — 받아 두기만 하고 언제 누구에게 내는지 안 적으면
         정작 분쟁이 났을 때 근거가 없습니다(약관 제10조에 같은 말이
         있습니다). 사업자는 위의 「사업자 정보」가 그 자리입니다. */
      (pkind && pkind.key === "person"
        ? '<p class="pvid-s">사업자등록이 없는 <b>개인</b>입니다. ' +
          '저희는 거래 당사자가 아니며, 분쟁이 생기면 분쟁조정기구 · 법원 · ' +
          '(이분이 동의한) 소비자의 요청에 따라 확인한 신원정보와 거래내역을 ' +
          '제공합니다.</p>'
        : '') +
      '</div></section>';
  }

  body += '<section class="sec"><div class="wrap"><ul class="notes">' +
    '<li>골프올인원은 <b>통신판매중개자</b>이며 이 업체와의 거래 당사자가 아닙니다. ' +
    '거래 조건과 이행에 관한 책임은 이 업체에 있습니다.</li>' +
    '<li>업체에 성함과 연락처를 전달할 때에는 <b>어느 업체인지 알려 드리고 그때 다시</b> 동의를 받습니다.</li>' +
    '</ul></div></section>';

  if(cats.length){
    body += '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>같은 분류의 다른 업체</h2></div>' +
      '<ul class="chips">' + cats.map(function(c){
        return '<li><a class="chip chip-go" href="' + esc(W.amCatUrl(c)) + '">' +
          icon(c.icon, 18) + esc(c.name) + ' 전체 보기</a></li>';
      }).join("") + '</ul></div></section>';
  }

  return {
    route: W.amProviderUrl(p),
    title: p.name,
    crumbs: (cats.length ? [[cats[0].name, W.amCatUrl(cats[0])]] : [])
              .concat([[p.name, W.amProviderUrl(p)]]),
    desc: p.name + " — " +
          (cats.length ? cats.map(function(c){ return c.name; }).join(" · ") + ". " : "") +
          (regs.length ? "영업 지역 " + regs.join(" · ") + ". " : "") +
          (p.intro ? String(p.intro).slice(0, 80) : "골프올인원 입점업체입니다."),
    body: body
  };
};

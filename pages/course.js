/* ════════════════════════════════════════════════════════════════════
   골프장 · 연습장 하나 — /course/<slug>   (DB 는 0066)

   ⚠️⚠️⚠️ **공공 자료에 있는 것만 적습니다.** 홀 수 · 주소 · 전화는 출처가
   준 값이고, **없으면 그 줄이 통째로 빠집니다** (절대 규칙 2). 그린피 ·
   남은 티타임 · 회원권 시세는 **여기 없습니다** — 그 값은 제휴 피드가
   있어야 하고, 공개 자료로 아는 척하면 손님이 그 값을 믿고 전화합니다.

   ⚠️⚠️⚠️ **"예약 가능" · "공식 제휴" 를 적지 않습니다** (지시서 작업 4).
   우리가 이 골프장과 맺은 것이 아무것도 없습니다. 올라온 티타임이 있으면
   **그 자리를 올린 업체**를 보여 주고, 없으면 없다고 말합니다.

   ⚠️⚠️ **출처와 기준일을 같이 냅니다.** 어디서 온 값인지 없으면 "우리가
   적은 것" 과 구별되지 않습니다.

   ⚠️ 좌표가 있을 때만 지도로 가는 길을 냅니다 — 좌표가 없는데 이름으로
   지도를 열면 **엉뚱한 곳**이 나옵니다 (지시서: 좌표 불명은 임의 표시 금지).
   ⚠️ 폐업한 곳도 화면을 냅니다 — 다만 **맨 위에서 그 사실을 말합니다.**
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;

/* 출처 한 줄 — ⚠️⚠️ **출처 이름 · 기준일 · 수집일 · 이용 조건을 그 자리에서**
   적습니다(열쇠를 날것으로 찍지 않습니다). 운영 상태는 출처가 「운영 중
   목록」 이라는 것뿐이라 **그 뒤의 변동은 모른다**고 같이 말합니다.
   ⚠️ 틀린 곳을 알려 주시는 길은 이미 있는 고객센터 문의입니다(새 양식을
   만들지 않습니다). */
function srcLine(c){
  var S = (W.AM_COURSE_SRC || {})[c.source_id] || null;
  var parts = [];
  if(S && S.as_of) parts.push("자료 기준일 " + S.as_of);
  else if(c.as_of) parts.push("자료 기준일 " + c.as_of);
  if(S && S.got)   parts.push("수집일 " + S.got);
  if(S && S.license) parts.push("이용 조건 " + S.license.replace(/\s*\(.*$/, ""));
  /* ⚠️ `.cs-src` 는 flex 라 글 조각이 각각 칸이 됩니다 — 글을 **한 덩이
     (span)** 로 감쌉니다(안 감싸면 굵은 글씨가 따로 세로 칸이 됩니다). */
  return '<p class="cs-src">' + icon("info", 16) + '<span>' +
      '공공 자료에서 가져온 정보입니다' +
      /* ⚠️ 출처 안내에 없는 출처(손으로 확인한 묶음 등)는 그 이름을 그대로 —
         출처를 빼면 「어디서 왔는지 모르는 시설」 이 됩니다 */
      (S ? ' — 출처 ' + esc(S.name) : (c.source_id ? ' (출처 ' + esc(c.source_id) + ')' : '')) +
      (parts.length ? ' · ' + esc(parts.join(" · ")) : '') +
      '. <b>저희가 직접 확인한 값이 아닙니다.</b>' +
      (c.state === "open"
        ? ' 출처의 목록에 운영 중으로 올라 있던 곳이며, 그 뒤의 휴업 · 폐업 · 이름 변경은 확인하지 않았습니다.'
        : '') + '</span></p>' +
    /* ⚠️ 원본 자료 링크는 **문장 밖 단추로** 둡니다(문장 한가운데 링크는
       높이가 16px 라 손가락에 안 닿습니다). */
    '<p class="cs-fix">' +
      (S && S.page ? '<a class="btn btn-sm btn-line" href="' + esc(S.page) +
        '" target="_blank" rel="nofollow noopener noreferrer">' + icon("info", 16) + '원본 자료 보기</a>' : '') +
      '<a class="btn btn-sm btn-line" href="/help">' + icon("arrow", 16) +
      '정보가 틀렸다면 알려 주세요</a></p>';
}

exports.build = function(c){
  var kindName = W.amCourseKind(c.kind);
  var regName  = (function(){
    var L = W.AM_REGIONS || [];
    for(var i = 0; i < L.length; i++) if(L[i].key === c.region) return L[i].name;
    return c.region;
  })();
  var where = [regName, c.gu].filter(Boolean).join(" ");

  /* 한 줄씩 — ⚠️ 값이 없으면 **줄째 뺍니다** */
  var facts = [];
  if(c.holes)     facts.push(["홀 수",   String(c.holes) + "홀"]);
  if(c.biz_kind)  facts.push(["구분",     c.biz_kind]);
  /* ⚠️ 출처마다 주소 칸의 뜻이 다릅니다 — 인허가 자료는 지번 · 도로명을
     갈라 주지만 문체부 현황의 「소재지」 는 둘이 섞여 있습니다. 둘 다 있을
     때만 갈라 적고, 하나뿐이면 그냥 「주소」 입니다(지번이 아닌 것을
     지번이라고 적지 않습니다). */
  if(c.addr_road && c.addr){
    facts.push(["도로명 주소", c.addr_road]);
    facts.push(["지번 주소",   c.addr]);
  }else if(c.addr_road || c.addr){
    facts.push(["주소", c.addr_road || c.addr]);
  }
  if(c.tel)       facts.push(["전화",     c.tel]);

  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    '<a href="/search#courses">골프장 찾기</a>' + icon("arrow",14) +
    '<span aria-current="page">' + esc(c.name) + '</span></nav>' +
    '<h1>' + esc(c.name) + '</h1>' +
    '<p class="pghd-l">' + esc(where) + ' · ' + esc(kindName) + '</p>' +
    /* ⚠️⚠️ **사진은 있을 때만** (0081) — 없으면 줄째 뺍니다. 남의 사진이나
       분류 사진을 깔면 그 골프장인 것처럼 보입니다(표시 · 광고의 공정화에
       관한 법률 제3조 · 목록 카드와 같은 규칙).
       ⚠️ 주소를 짓는 자리는 `tools/pull-courses.js` 하나이고 화면은
       `photo_url` 만 봅니다 — 버킷이 꺼져 있으면 그 칸이 아예 없습니다. */
    (c.photo_url
      ? '<p class="cs-ph"><img src="' + esc(c.photo_url) + '" alt="' +
        esc(c.name + " 사진") + '" loading="lazy" decoding="async"></p>'
      : '') +
    /* ⚠️⚠️ 폐업은 **맨 위에서** 말합니다 — 아래에 묻어 두면 손님이
       전화를 겁니다 */
    (c.state === "closed"
      ? '<p class="cs-closed">' + icon("info", 18) +
        '<b>공공 자료에 <u>폐업</u>으로 적혀 있습니다.</b> ' +
        '저희가 다시 확인한 것은 아닙니다 — 방문 전에 꼭 전화로 확인해 주세요.</p>'
      : '') +
  '</div></section>';

  /* ⚠️⚠️ **홈페이지 · 지도만 있어도 이 구간이 서야** 합니다 — 처음에
     `facts.length` 로만 가렸더니, 홀 수 · 주소를 모르는데 홈페이지는 아는
     골프장에서 **그 단추가 통째로 사라졌습니다**(0건이 아니라 안 그린
     것입니다). */
  var hasSite = /^https?:\/\//i.test(String(c.site_url || ""));
  if(facts.length || hasSite || (c.lat && c.lng)){
    body += '<section class="sec"><div class="wrap">' +
      '<div class="sec-hd"><h2>시설 정보</h2></div>' +
      (facts.length
        ? '<dl class="cs-facts">' + facts.map(function(f){
            return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>';
          }).join("") + '</dl>'
        : '') +
      /* ⚠️⚠️ **출처를 그 자리에서** 적습니다 */
      srcLine(c) +
      /* 좌표가 있을 때만 — ⚠️ 없으면 줄째 뺍니다 */
      /* ⚠️⚠️⚠️ **공식 홈페이지는 바깥 주소**입니다 — `https://` 로
         시작하는 것만 내고(`javascript:` 가 섞이면 거기가 구멍입니다 ·
         0064 의 클릭 주소와 같은 규칙), 새 창 + `rel` 넷으로 엽니다.
         ⚠️ 목록 카드에는 2026-11-13 부터 있었는데 **이 상세 화면에만
         빠져** 있었습니다 — 카드에서 들어오신 분이 그 자리에서 다시
         찾을 수가 없었습니다(「만들어 놓고 안 쓰는 칸」의 작은 판). */
      (hasSite
        ? '<p class="cs-site"><a class="btn btn-line" target="_blank" ' +
          'rel="nofollow noopener noreferrer" href="' + esc(c.site_url) + '">' +
          icon("info", 18) + '공식 홈페이지</a></p>'
        : '') +
      (c.lat && c.lng
        ? '<p class="cs-map"><a class="btn btn-line" target="_blank" ' +
          'rel="noopener noreferrer" href="https://map.kakao.com/link/map/' +
          esc(c.name) + ',' + esc(String(c.lat)) + ',' + esc(String(c.lng)) + '">' +
          icon("pin", 18) + '지도에서 보기</a></p>'
        : '') +
    '</div></section>';
  }

  /* ⚠️⚠️⚠️ **올라온 티타임은 브라우저가 그립니다** — 날마다 바뀌므로
     빌드가 찍으면 배포할 때만 바뀝니다. 0건이면 `js/booking.js` 가
     그 상자를 치웁니다 (빈 띠를 안 남깁니다). */
  body += '<section class="sec sec-alt"><div class="wrap">' +
    '<div class="sec-hd"><h2>이 골프장에 올라온 자리</h2>' +
    '<p>저희에 입점한 업체가 올린 티타임만 보여 드립니다. ' +
    '골프장이 직접 올린 것이 아니고, <b>저희가 예약을 보장하지 않습니다.</b></p></div>' +
    '<div id="csTee" data-course="' + esc(c.slug) + '" hidden></div>' +
    '<p class="cs-none">아직 이 골프장으로 올라온 자리가 없습니다. ' +
    '원하시는 날짜로 요청을 남기시면 업체가 찾아 드립니다.</p>' +
    '<p><a class="btn btn-pri" href="/match?cat=booking">' + icon("arrow",18) +
      '부킹 요청 남기기</a></p>' +
  '</div></section>';

  return {
    route: W.amCourseUrl(c),
    /* ⚠️ 같은 이름의 다른 곳(같은 브랜드의 다른 지점)이 있으면 제목에
       지역을 붙입니다 — 안 붙이면 두 화면의 제목이 같아 검색에서 둘 다
       흐려지고, 빌드가 「제목이 겹칩니다」 로 멈춥니다. */
    title: (W.AM_COURSES || []).some(function(o){ return o.slug !== c.slug && o.name === c.name; })
      ? c.name + " (" + where + ")" : c.name,
    crumbs: [["골프장 찾기", "/search#courses"], [c.name, W.amCourseUrl(c)]],
    desc: c.name + " — " + where + " " + kindName +
          (c.holes ? " · " + c.holes + "홀" : "") +
          ". 공공 자료 기준 시설 정보와, 저희에 올라온 티타임을 함께 봅니다.",
    body: body,
    js: ["/js/data/site.js", "/js/data/regions.js", "/js/data/deal.js",
         "/js/data/courses.generated.js", "/js/data/courses.js",
         "/js/coursetee.js"]
  };
};

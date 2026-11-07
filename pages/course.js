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
  if(c.addr_road) facts.push(["도로명 주소", c.addr_road]);
  if(c.addr)      facts.push(["지번 주소",   c.addr]);
  if(c.tel)       facts.push(["전화",     c.tel]);

  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    '<a href="/search#courses">골프장 찾기</a>' + icon("arrow",14) +
    '<span aria-current="page">' + esc(c.name) + '</span></nav>' +
    '<h1>' + esc(c.name) + '</h1>' +
    '<p class="pghd-l">' + esc(where) + ' · ' + esc(kindName) + '</p>' +
    /* ⚠️⚠️ 폐업은 **맨 위에서** 말합니다 — 아래에 묻어 두면 손님이
       전화를 겁니다 */
    (c.state === "closed"
      ? '<p class="cs-closed">' + icon("info", 18) +
        '<b>공공 자료에 <u>폐업</u>으로 적혀 있습니다.</b> ' +
        '저희가 다시 확인한 것은 아닙니다 — 방문 전에 꼭 전화로 확인해 주세요.</p>'
      : '') +
  '</div></section>';

  if(facts.length){
    body += '<section class="sec"><div class="wrap">' +
      '<div class="sec-hd"><h2>시설 정보</h2></div>' +
      '<dl class="cs-facts">' + facts.map(function(f){
        return '<div><dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd></div>';
      }).join("") + '</dl>' +
      /* ⚠️⚠️ **출처를 그 자리에서** 적습니다 */
      '<p class="cs-src">' + icon("info", 16) +
        '공공 자료에서 가져온 정보입니다' +
        (c.source_id ? ' (출처 ' + esc(c.source_id) + ')' : '') +
        (c.as_of ? ' · 자료 기준일 ' + esc(c.as_of) : '') +
        '. <b>저희가 직접 확인한 값이 아닙니다.</b></p>' +
      /* 좌표가 있을 때만 — ⚠️ 없으면 줄째 뺍니다 */
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
    title: c.name,
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

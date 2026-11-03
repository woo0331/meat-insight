/* ════════════════════════════════════════════════════════════════════
   업체 하나 — /pro/<id>

   ⚠️⚠️ **업체가 적은 글은 전부 esc() 를 거칩니다** (절대 규칙 4).
   소개 · 브랜드 · 상담 시간은 업체가 직접 적는 칸입니다.

   ⚠️⚠️ **평점 · 후기 수를 찍지 않습니다.** 후기가 0건이라 계산할 것이
   없고, 숫자를 만들어 두면 누군가 그 칸에 4.9 를 적어 넣습니다
   (절대 규칙 1). 구조화 데이터에도 aggregateRating 을 안 넣습니다 —
   적발되면 리치 결과가 통째로 막힙니다.

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

  var body = '<section class="pghd"><div class="wrap">' +
    '<nav class="crumb" aria-label="현재 위치"><a href="/">홈</a>' + icon("arrow",14) +
    (cats.length
      ? '<a href="' + esc(W.amCatUrl(cats[0])) + '">' + esc(cats[0].name) + '</a>' + icon("arrow",14)
      : '<a href="/search">업체찾기</a>' + icon("arrow",14)) +
    '<span aria-current="page">' + esc(p.name) + '</span></nav>' +
    '<h1>' + esc(p.name) + '</h1>' +
    (p.intro ? '<p class="pghd-l">' + esc(p.intro) + '</p>' : '') +
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

  if(rows.length){
    body += '<section class="sec"><div class="wrap">' +
      '<div class="sec-hd"><h2>업체 정보</h2></div>' +
      '<div class="doc-t"><table><tbody>' + rows.map(function(r){
        return '<tr><th scope="row">' + esc(r[0]) + '</th><td>' + esc(r[1]) + '</td></tr>';
      }).join("") + '</tbody></table></div></div></section>';
  }

  if(subs.length){
    body += '<section class="sec sec-alt"><div class="wrap">' +
      '<div class="sec-hd"><h2>이 업체가 다루는 것</h2></div>' +
      '<ul class="chips">' + subs.map(function(k){
        var f = W.amSub(k);
        return '<li><span class="chip">' + esc(f.item.name) + '</span></li>';
      }).join("") + '</ul></div></section>';
  }

  /* ⚠️⚠️ 전자상거래법 제20조 — 푸터에도 있지만 **거래가 일어나는 화면**
     에서 한 번 더 분명히 합니다. */
  /* ⚠️⚠️ **상담 연결이 아직 없습니다.** 단추를 미리 두면 눌러도 아무
     일이 안 납니다 (절대 규칙 5). 그렇다고 아무 말도 안 하면 손님이
     "어떻게 연락하지" 하고 막다른 길에 섭니다 (절대 규칙 2).
     그래서 **없다고 말하고** 지금 되는 것(다른 업체 · 분류)을 같이 냅니다.
     ⚠️ 상담 연결을 세우는 날 이 안내를 **단추로 바꾸세요** — 그때
     tools/test-providers.js 의 "상담 길" 검사도 같이 고칩니다. */
  body += '<section class="sec"><div class="wrap"><div class="none">' +
    '<h2>아직 상담 연결을 받지 못합니다.</h2>' +
    '<p>업체에 바로 이어 드리는 자리를 준비하고 있습니다. ' +
    '준비가 끝나기 전에는 신청 단추를 열지 않습니다 — 다 적으신 뒤에 ' +
    '실패하는 일이 없도록.</p>' +
    (cats.length
      ? '<a class="btn btn-line" href="' + esc(W.amCatUrl(cats[0])) + '">' +
        icon("arrow",18) + esc(cats[0].name) + ' 다른 업체 보기</a>'
      : '<a class="btn btn-line" href="/categories">' + icon("arrow",18) + '카테고리 둘러보기</a>') +
    '</div></div></section>';

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

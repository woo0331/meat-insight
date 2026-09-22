/* ════════════════════════════════════════════════════════════════════
   01. Main Home — 작업지시서 5·6·7·12·13·20번
   구간 순서: 히어로 → 신뢰띠 → 퀵 카테고리 → 오늘 들어온 부산물
              → 업소용 배너 → ABOUTMEAT의 약속
   ════════════════════════════════════════════════════════════════════ */
function PageHome(){
  var today = wowFind({today:true}).slice(0,4);

  return (
  /* ── 히어로 (지시서 5번) ─────────────────────────────── */
  '<section class="hero">'+
    '<div class="hero-ph" style="background-image:url(img/hero.jpg)"></div>'+
    '<div class="w hero-in">'+
      '<h1>부산물을<br>가장 잘 아는 마켓.</h1>'+
      '<p>도축부터 시작되는 신선한 축산 부산물.<br>'+
         '필요한 상태와 규격으로 만나보세요.</p>'+
      '<div class="hero-btns">'+
        '<a class="btn btn-g btn-lg" href="#/c/beef">소 부산물 보기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="#/c/pork">돼지 부산물 보기'+icon("arrow",18)+'</a>'+
      '</div>'+
    '</div></section>'+

  /* ── 신뢰 띠 (지시서 6번) ────────────────────────────── */
  TrustBar()+

  /* ── 퀵 카테고리 (지시서 7번) ────────────────────────── */
  '<section class="sec sec-i sec-c"><div class="w">'+
    '<div class="sec-hd"><div class="sec-hd-t"><h2>어떤 부산물을 찾으세요?</h2></div></div>'+
    '<div class="qg">'+WOW_QUICK.map(CategoryCard).join("")+'</div>'+
  '</div></section>'+

  /* ── 오늘 들어온 부산물 (지시서 12번) ─────────────────
     진짜 오늘 입고된 것이 없으면 **구간째 내립니다.** 빈 칸에
     제목만 남겨 두면 그 자체가 미완성으로 읽힙니다. */
  (today.length ?
  '<section class="sec sec-w"><div class="w">'+
    '<div class="sec-hd"><div class="sec-hd-t"><h2>오늘 들어온 부산물</h2>'+
      '<p>당일 작업한 원물을 냉장 상태로 보냅니다</p></div>'+
      '<a class="sec-more" href="#/products?today=1">전체보기'+icon("chev",16)+'</a></div>'+
    ProductGrid(today)+
  '</div></section>' : '')+

  /* ── 업소용 (지시서 13번) ────────────────────────────── */
  '<section class="sec sec-i"><div class="w">'+B2BBanner()+'</div></section>'+

  /* ── ABOUTMEAT의 약속 (지시서 20번) ──────────────────── */
  '<section class="sec sec-tight sec-w sec-c"><div class="w">'+
    '<div class="sec-hd"><div class="sec-hd-t"><h2>ABOUTMEAT의 약속</h2></div></div>'+
    '<div class="qg pr-g">'+[
      ["award","신선한 원물","도축 직후 빠른 유통"],
      ["doc",  "투명한 이력","믿을 수 있는 원료"],
      ["shield","안전한 가공","위생적인 손질 공정"],
      ["phone","전문가의 상담","업종별 맞춤 제안"]
    ].map(function(t){
      return '<div class="prm"><div class="prm-ic">'+icon(t[0],30)+'</div>'+
        '<b>'+esc(t[1])+'</b><span>'+esc(t[2])+'</span></div>';
    }).join("")+'</div>'+
  '</div></section>'+

  /* ── 브랜드 (지시서 20번) ────────────────────────────── */
  '<section class="bnr bnr-flat" style="background-image:url(img/brand.jpg)">'+
    '<div class="w"><div class="bnr-in" style="padding-left:0;padding-right:0;">'+
      '<h3>모든 한 점까지,<br>가치 있게.</h3>'+
      '<p>축산 현장을 이해하는 부산물 전문업체로서,<br>'+
         '버려지던 부위에 제 값을 찾아 드립니다.</p>'+
      '<a class="btn btn-o btn-lg" href="#/about">브랜드 스토리 보기'+icon("arrow",18)+'</a>'+
    '</div></div></section>'
  );
}

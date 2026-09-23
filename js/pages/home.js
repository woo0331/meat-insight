/* ════════════════════════════════════════════════════════════════════
   01. Main Home — 작업지시서 5·6·7·12·13·20번
   구간 순서: 히어로 → 신뢰띠 → 퀵 카테고리 → 오늘 들어온 부산물
              → 업소용 배너 → ABOUTMEAT의 약속
   ════════════════════════════════════════════════════════════════════ */
/* 홈에 낼 도감 여덟 — **상품이 있는 부위를 먼저** 냅니다.
   도감을 보다가 "그래서 살 수 있나" 로 이어져야 합니다. 모자라면
   나머지를 채우되, 소와 돼지가 섞이도록 번갈아 담습니다. */
function encPick(){
  var out = [], rest = [];
  WOW_SPECIES.forEach(function(s){
    (WOW_ENC[s.slug]||[]).forEach(function(e){
      (((e.rel||[]).map(wowProduct).filter(Boolean).length) ? out : rest).push({sp:s.slug, e:e});
    });
  });
  /* 소·돼지를 번갈아 — 한 축종으로만 여덟 칸이 차면 반쪽만 보입니다 */
  function weave(a){
    var beef=a.filter(function(x){return x.sp==="beef";}),
        pork=a.filter(function(x){return x.sp==="pork";}), r=[];
    while(beef.length||pork.length){ if(beef.length) r.push(beef.shift()); if(pork.length) r.push(pork.shift()); }
    return r;
  }
  return weave(out).concat(weave(rest)).slice(0,8);
}

function PageHome(){
  var today = wowFind({today:true}).slice(0,4);

  return (
  /* ── 히어로 (지시서 5번) ─────────────────────────────── */
  '<section class="hero">'+
    '<div class="hero-ph" style="background-image:url(/img/hero.jpg)"></div>'+
    '<div class="w hero-in">'+
      '<h1>부산물을<br>가장 잘 아는 마켓.</h1>'+
      '<p>도축부터 시작되는 신선한 축산 부산물.<br>'+
         '필요한 상태와 규격으로 만나보세요.</p>'+
      '<div class="hero-btns">'+
        '<a class="btn btn-g btn-lg" href="/c/beef">소 부산물 보기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/c/pork">돼지 부산물 보기'+icon("arrow",18)+'</a>'+
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
      '<a class="sec-more" href="/products/today">전체보기'+icon("chev",16)+'</a></div>'+
    ProductGrid(today, {lazy:true})+
  '</div></section>' : '')+

  /* ── 부산물 도감 (지시서 18번) ───────────────────────────
     ⚠️ 도감 48개가 홈에서 **푸터 링크 하나**로만 이어져 있었습니다.
     부산물은 "이게 뭔지" 부터 모르고 들어오는 손님이 많습니다 —
     소머리와 수구레와 도가니를 구분 못 하면 고를 수가 없습니다.
     이 사이트가 다른 정육 쇼핑몰과 다른 점이 바로 이 도감입니다.
     홈에서 한 번은 보여 줘야 합니다. */
  '<section class="sec sec-i"><div class="w">'+
    '<div class="sec-hd"><div class="sec-hd-t"><h2>이 부위는 어디인가요?</h2>'+
      '<p>특징 · 식감 · 손질방법 · 추천요리를 부위마다 정리했습니다</p></div>'+
      '<a class="sec-more" href="/enc">부산물 도감'+icon("chev",16)+'</a></div>'+
    '<div class="qg">'+encPick().map(function(x){
      return EncyclopediaCard(x.e, x.sp); }).join("")+'</div>'+
  '</div></section>'+

  /* ── 업소용 (지시서 13번) ────────────────────────────── */
  '<section class="sec sec-w"><div class="w">'+B2BBanner()+'</div></section>'+

  /* ── ABOUTMEAT의 약속 (지시서 20번) ──────────────────── */
  /* ⚠️ 흰 구간 둘이 붙으면 경계가 사라져 한 덩어리로 읽힙니다.
     아이보리와 흰색을 번갈아 칠합니다:
     퀵(아이보리) → 오늘(흰) → 도감(아이보리) → 업소용(흰) → 약속(아이보리) */
  '<section class="sec sec-tight sec-i sec-c"><div class="w">'+
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
  '<section class="bnr bnr-flat" style="background-image:url(/img/brand.jpg)">'+
    '<div class="w"><div class="bnr-in" style="padding-left:0;padding-right:0;">'+
      '<h3>모든 한 점까지,<br>가치 있게.</h3>'+
      '<p>축산 현장을 이해하는 부산물 전문업체로서,<br>'+
         '버려지던 부위에 제 값을 찾아 드립니다.</p>'+
      '<a class="btn btn-o btn-lg" href="/about">브랜드 스토리 보기'+icon("arrow",18)+'</a>'+
    '</div></div></section>'
  );
}

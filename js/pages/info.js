/* ════════════════════════════════════════════════════════════════════
   지원사업 (§20 · §33) · 정보 (§45) · 소개

   ⚠️⚠️ **지원사업을 지어내지 않습니다.** 기한과 대상과 금액이 틀리면
   사장님이 기회를 놓치거나 헛걸음합니다. 원문 링크(`link`)가 없는
   항목은 `amSupports()` 가 아예 안 돌려줍니다.
   ⚠️ **"받을 수 있습니다" 라고 하지 마세요.** 심사는 우리가 하는 것이
   아닙니다 — "대상에 해당하면 신청할 수 있습니다" 까지입니다.
   ⚠️ **블로그를 만들지 마세요** (§45 · §54). 검색 수요가 있고 실제로
   그 과정에서 막히는 것만 씁니다.
   ════════════════════════════════════════════════════════════════════ */

function PageSupport(){
  var side = nowQS("side");
  var list = amSupports(side || null);
  return PgHero({
    kicker:"자금 · 정부지원",
    h1raw:"조건만 맞으면<br class=\"br-m\"> 신청하실 수 있는 것들.",
    lead:"창업자금 · 정책자금 · 폐업지원 · 철거비 지원. 저희가 심사하지 않습니다 — 어디에 무엇이 있는지 모아 드립니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<ul class="chip-g chip-g-fil">'+
      '<li><a class="chip'+(side?"":" on")+'" href="/support">전체</a></li>'+
      '<li><a class="chip'+(side==="start"?" on":"")+'" href="/support?side=start">창업</a></li>'+
      '<li><a class="chip'+(side==="close"?" on":"")+'" href="/support?side=close">폐업</a></li>'+
    '</ul>'+
    (list.length
      ? '<ul class="sp-l">'+list.map(function(s){
          return '<li class="sp">'+
            '<span class="sp-m">'+esc(s.org)+' · 확인 '+esc(s.asOf)+'</span>'+
            '<b>'+esc(s.name)+'</b>'+
            (s.who    ? '<span><em>대상</em>'+esc(s.who)+'</span>' : '')+
            (s.amount ? '<span><em>지원</em>'+esc(s.amount)+'</span>' : '')+
            (s.when   ? '<span><em>기간</em>'+esc(s.when)+'</span>' : '')+
            '<a class="sp-go" href="'+esc(s.link)+'" target="_blank" rel="noopener">'+
              '공고 원문 보기'+icon("arrow",15)+'</a>'+
          '</li>'; }).join("")+'</ul>'
      : Empty({
          icon:"badge",
          title:"확인된 지원사업이 아직 없습니다",
          text:"공고 원문을 확인한 것만 올립니다. 지원사업은 해마다 바뀌고 예산이 소진되면 "+
               "중간에 닫혀서, 틀린 정보는 없는 것보다 나쁩니다. "+
               "그동안에는 소상공인시장진흥공단과 관할 지자체 공고를 직접 확인하세요.",
          cta:'<a class="btn btn-b" href="/startup">창업 준비 계속하기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/closure">폐업 정리 계속하기</a>'
        }))+
  '</div></section>';
}

function PageContents(){
  var list = amContents({});
  return PgHero({
    kicker:"창업 · 폐업 정보",
    h1raw:"실제로 막히는 것만<br class=\"br-m\"> 정리합니다.",
    lead:"창업비용 · 철거비 · 원상복구 범위 · 권리금 · 사업자등록 · 폐업신고처럼, 검색해도 답이 잘 안 나오는 것들입니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+
    (list.length
      ? '<ul class="ct-l">'+list.map(function(c){
          return '<li><a href="/content/'+esc(c.slug)+'">'+
            '<span class="ct-m">'+esc(c.side==="close"?"폐업":"창업")+
              (c.industry?' · '+esc(amIndustryName(c.industry)):'')+
              (c.read?' · '+esc(String(c.read))+'분':'')+'</span>'+
            '<b>'+esc(c.title)+'</b>'+
            '<span class="ct-p">'+esc(c.lead)+'</span></a></li>';
        }).join("")+'</ul>'
      : Empty({
          icon:"book",
          title:"글을 준비하고 있습니다",
          text:"근거를 댈 수 있는 것만 씁니다. 금액을 지어내느니 안 쓰는 편이 낫습니다 — "+
               "그 숫자를 보고 돈을 빌리러 가시기 때문입니다.",
          cta:'<a class="btn btn-b" href="/startup">창업 시작하기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/closure">폐업 시작하기</a>'
        }))+
  '</div></section>';
}

function PageContent(c){
  return PgHero({
    crumb: Crumb([["정보","/content"],[c.title]]),
    kicker:(c.side==="close"?"폐업":"창업")+(c.industry?" · "+amIndustryName(c.industry):""),
    h1:c.title, lead:c.lead, tight:true
  })+
  '<section class="sec sec-white"><div class="w read">'+
    (c.body||[]).map(function(b){
      return (b.h ? '<h2>'+esc(b.h)+'</h2>' : '')+
        /* ⚠️ 본문은 `mark()` 입니다 — `esc()` 를 먼저 통과시킨 뒤
           `**굵게**` 만 되살립니다. `esc()` 만 쓰면 별표가 글자로
           찍히고, 순서를 바꾸면 남이 넣은 태그가 돕니다. */
        (b.p||[]).map(function(t){ return '<p>'+mark(t)+'</p>'; }).join("")+
        ((b.ul||[]).length ? '<ul>'+b.ul.map(function(t){
          return '<li>'+mark(t)+'</li>'; }).join("")+'</ul>' : '');
    }).join("")+
    /* ⚠️ 법령과 제도는 바뀝니다. **어디서 확인하는지**를 같이 답니다. */
    ((c.source||[]).length ? '<div class="src"><b>확인하는 곳</b><ul>'+
      c.source.map(function(s){
        return '<li>'+esc(s.name)+' — '+esc(s.where)+'</li>'; }).join("")+
      '</ul></div>' : '')+
    /* 글 끝은 항상 지금 할 수 있는 일로 맺습니다 */
    /* ⚠️ `/providers/<분류>` 를 무조건 만들면 **죽은 주소**가 됩니다.
       업체를 찾는 분류(kind:"provider")만 그 주소를 가지고, 점포 ·
       매물 · 정보 성격의 분류는 각자 제 화면이 따로 있습니다.
       `catTo()` 가 그 갈림을 아는 유일한 함수입니다 — 실제로
       `/providers/store` 가 빈 화면으로 나갔습니다. */
    (c.next ? '<div class="row-cta"><a class="btn btn-b btn-lg" href="'+
      esc(c.next.cat && amCat(c.next.cat) ? catTo(amCat(c.next.cat)) : "/quote")+'">'+
      esc(c.next.label||"업체 찾아보기")+icon("arrow",18)+'</a></div>' : '')+
  '</div></section>';
}

function PageAbout(){
  var B = window.AM_BRAND || {};
  var yes = [
    "필요한 업체 · 전문가 · 프랜차이즈를 분류와 지역으로 찾아 드립니다.",
    "한 번 적으신 내용을 조건이 맞는 여러 곳에 같이 전달합니다.",
    "정리하시는 사장님의 점포 · 시설 · 집기를 시작하시는 사장님께 이어 드립니다.",
    "창업과 폐업 과정에서 확인해야 할 것을 정리해 드립니다."
  ];
  var no = [
    "저희가 직접 인테리어 · 철거 · 세무 · 마케팅을 하지 않습니다.",
    "광고비를 받고 업체 순서를 바꾸지 않습니다.",
    "등록된 적 없는 업체 · 브랜드 · 매물을 화면에 만들지 않습니다.",
    "확인하지 않은 평점 · 후기 · 실적을 적지 않습니다.",
    "거래 당사자가 아닙니다 — 계약은 업체와 직접 하십니다."
  ];
  return PgHero({
    kicker:"소개",
    h1raw:"창업에 필요한 모든 것.<br> 폐업에 필요한 모든 것.",
    lead:B.slogan || "",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w two-list">'+
    '<div><h2>하는 일</h2><ul class="tick-l">'+yes.map(function(t){
      return '<li>'+icon("check",16)+'<span>'+esc(t)+'</span></li>'; }).join("")+'</ul></div>'+
    '<div><h2>하지 않는 일</h2><ul class="tick-l tick-x">'+no.map(function(t){
      return '<li>'+icon("x",16)+'<span>'+esc(t)+'</span></li>'; }).join("")+'</ul></div>'+
  '</div></section>'+
  '<section class="sec"><div class="w"><p class="note note-box">'+
    esc(B.name||"")+'은 통신판매중개자이며 입점 업체와 이용자 사이의 거래 당사자가 '+
    '아닙니다 (전자상거래법 제20조 제1항). 상품 · 서비스 · 거래 조건에 대한 책임은 '+
    '각 업체에 있습니다.</p></div></section>';
}

/* ════════════════════════════════════════════════════════════════════
   자주 묻는 것 (/faq)

   ⚠️ 메인(FaqBand)과 **같은 파일**(`js/data/faq.js`)을 읽습니다.
   ⚠️ **구조화 데이터(FAQPage)는 이 화면에만 답니다.** 메인에는 여섯만
   발췌로 내는데, 발췌에 FAQPage 를 달면 화면에 없는 질문이 구조화
   데이터로 나가거나 같은 FAQ 가 두 주소로 중복됩니다.
   ════════════════════════════════════════════════════════════════════ */
function PageFaq(){
  var f = (window.amFaq ? amFaq() : []);
  /* ⚠️ 비어도 **빈 화면으로 두지 않습니다** (절대 규칙 2). */
  if(!f.length) return PgHero({ kicker:"자주 묻는 것", h1:"자주 묻는 것", tight:true })+
    '<section class="sec"><div class="w w-narrow">'+
      Empty({
        icon:"info",
        title:"아직 정리된 문답이 없습니다",
        text:"궁금한 것을 견적 요청에 적어 주시면 답해 드리고, 자주 나오는 것은 "+
             "여기에 정리해 둡니다.",
        cta:'<a class="btn btn-b" href="/quote">견적 요청하기</a>'+
            '<a class="btn btn-o" href="/about">소개 보기</a>'
      })+
    '</div></section>';

  return PgHero({
    crumb: Crumb([["홈","/"],["자주 묻는 것", null]]),
    kicker:"자주 묻는 것",
    h1:"먼저 궁금해하시는 것들",
    lead:"약속드릴 수 없는 것은 약속드리지 않고, 아직 없는 것은 없다고 적었습니다.",
    tight:true
  })+
  '<section class="sec"><div class="w w-narrow">'+
    '<ul class="faq-l">'+ f.map(function(x){
      return '<li class="faq-i">'+
        '<b class="faq-q">'+esc(x.q)+'</b>'+
        '<p class="faq-a">'+esc(x.a)+'</p>'+
      '</li>';
    }).join("")+'</ul>'+
    /* ⚠️ 막다른 길로 두지 않습니다 — 여기까지 읽으신 분께 지금
       실제로 되는 것을 냅니다. */
    '<p class="note note-mid">여기 없는 것이 궁금하시면 요청에 그대로 적어 주세요.</p>'+
    '<div class="row-cta row-mid">'+
      '<a class="btn btn-b btn-lg" href="/quote">견적 요청하기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/about">소개 보기</a>'+
    '</div>'+
  '</div></section>';
}

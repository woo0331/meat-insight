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
  '</div></section>'+
  SupportWhere(side);
}

/* ── 어디서 찾는가 ───────────────────────────────────────────────
   ⚠️ **공고를 지어내지 않는 대신, 어디를 봐야 하는지는 냅니다.**
   공고는 해마다 바뀌지만 기관은 잘 안 바뀝니다. 이게 사장님이 실제로
   필요한 첫걸음이고, 지어내지 않고 낼 수 있는 것입니다.
   ⚠️ **개별 사업 이름을 여기 적지 마세요** — 이름은 해마다 바뀝니다.
   ⚠️ 링크는 `checked` 를 켠 것만 나갑니다 (js/data/support.js). */
function SupportWhere(side){
  var list = (window.amSupportWhere ? amSupportWhere(side || null) : []);
  if(!list.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">어디서 찾는가</p>'+
      '<h2>공고는 여기에 올라옵니다</h2>'+
      '<p>지원사업은 해마다 바뀌고 예산이 소진되면 중간에 닫힙니다. '+
        '그래서 사업 이름을 적어 두는 대신 <b>어디를 봐야 하는지</b>를 '+
        '적어 둡니다. 저희가 심사하지 않고, 신청도 각 기관에 직접 하십니다.</p>'+
    '</div>'+
    '<ul class="spw-l rv-stg">'+ list.map(function(x){
      return '<li class="spw" data-rv>'+
        '<b>'+esc(x.org)+'</b>'+
        '<span class="spw-w">'+esc(x.what)+'</span>'+
        /* ⚠️ `em` 을 `display:block` 으로 만들어 줄을 나누면 "문장 속
           block" 으로 걸립니다 — 이 저장소에서 이미 한 번 겪은 길입니다.
           칸을 둘로 나누고 **글도 태그로 감쌉니다.** */
        '<span class="spw-f"><em>찾는 법</em><i>'+esc(x.find)+'</i></span>'+
        /* ⚠️ 눌러 보고 켠 것만 링크가 됩니다. 죽은 링크는 없는 것보다
           나쁩니다 — "이 사이트도 관리 안 하는구나" 로 읽힙니다. */
        (x.url
          ? '<a class="spw-go" href="'+esc(x.url)+'" target="_blank" rel="noopener">'+
            '기관 홈페이지'+icon("arrow",15)+'</a>'
          : '')+
      '</li>';
    }).join("")+'</ul>'+
    '<p class="note note-box">여기 적힌 것은 <b>기관</b>까지입니다. 개별 공고가 '+
      '아닙니다 — 대상 · 금액 · 기한은 그 기관의 공고에서 직접 확인하셔야 하고, '+
      '신청과 심사도 그쪽에서 합니다. 저희는 어디를 봐야 하는지까지만 '+
      '알려 드립니다.</p>'+
  '</div></section>';
}

/* ── 글 목록 (/content) ────────────────────────────────────────
   ⚠️ **한 줄로 쭉 내려가면 아무도 안 읽습니다.** 글이 서른 편을
   넘으면서 목록이 화면 다섯 개 높이가 됐습니다. 그래서 쪽(창업/폐업)과
   분류 칩으로 거릅니다.

   ⚠️ **분류 머리말로 묶어 보았다가 물렀습니다.** 분류 25개에 글 35편
   이라 묶음마다 한두 편뿐이고, 머리말이 차지하는 높이가 줄어드는
   높이보다 컸습니다 (7,794px → 7,412px). 지금은 칩이 그 일을 합니다.

   ⚠️ 거르개는 `/support` · `/providers` 와 **같은 `?side=` · 같은
   `.chip-g-fil`** 을 씁니다 — 화면마다 다른 거르개를 만들면 같은
   사이트로 안 읽힙니다.

   ⚠️ **없는 칸은 안 냅니다.** 글이 없는 분류는 칩이 아예 안 나옵니다
   (절대 규칙 2). 개수는 전부 그 자리에서 **세는 값**이라 손으로 적을
   자리가 없습니다. */
function ctUrl(side, cat){
  var q = [];
  if(side) q.push("side="+encodeURIComponent(side));
  if(cat)  q.push("cat="+encodeURIComponent(cat));
  return "/content" + (q.length ? "?"+q.join("&") : "");
}

function PageContents(){
  var side = nowQS("side"); if(side !== "start" && side !== "close") side = "";
  var cat  = nowQS("cat");

  var all = amContents({});
  /* 쪽으로 먼저 거릅니다. "both" 인 글은 양쪽에 다 나옵니다 */
  var bySide = all.filter(function(c){
    return !side || c.side === side || c.side === "both"; });
  /* 그 쪽에서 글이 있는 분류만 칩으로 냅니다 */
  var cats = (window.AM_CATS||[]).filter(function(k){
    return bySide.some(function(c){ return c.cat === k.key; }); });
  if(cat && !cats.some(function(k){ return k.key === cat; })) cat = "";
  var list = cat ? bySide.filter(function(c){ return c.cat === cat; }) : bySide;

  var nStart = all.filter(function(c){ return c.side !== "close"; }).length;
  var nClose = all.filter(function(c){ return c.side !== "start"; }).length;
  var cnt = function(k){
    return bySide.filter(function(c){ return c.cat === k; }).length; };

  var card = function(c){
    return '<li><a href="/content/'+esc(c.slug)+'">'+
      '<span class="ct-m">'+esc(c.side==="close"?"폐업":c.side==="both"?"창업 · 폐업":"창업")+
        (c.industry?' · '+esc(amIndustryName(c.industry)):'')+
        (c.read?' · '+esc(String(c.read))+'분':'')+'</span>'+
      '<b>'+esc(c.title)+'</b>'+
      '<span class="ct-p">'+esc(c.lead)+'</span></a></li>';
  };

  return PgHero({
    kicker:"창업 · 폐업 정보",
    h1raw:"실제로 막히는 것만<br class=\"br-m\"> 정리합니다.",
    lead:"창업비용 · 철거비 · 원상복구 범위 · 권리금 · 사업자등록 · 폐업신고처럼, 검색해도 답이 잘 안 나오는 것들입니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<ul class="chip-g chip-g-fil">'+
      '<li><a class="chip'+(side?"":" on")+'" href="'+esc(ctUrl("",""))+'">'+
        '전체 '+all.length+'</a></li>'+
      '<li><a class="chip'+(side==="start"?" on":"")+'" href="'+esc(ctUrl("start",""))+'">'+
        '창업 '+nStart+'</a></li>'+
      '<li><a class="chip'+(side==="close"?" on":"")+'" href="'+esc(ctUrl("close",""))+'">'+
        '폐업 '+nClose+'</a></li>'+
    '</ul>'+
    /* ⚠️ **분야 칩은 쪽을 고른 뒤에만 냅니다.** 25개를 다 깔면 폰에서
       화면 하나를 통째로 먹고 글이 한 편도 안 보입니다 (실제로 그랬습니다).
       이 사이트가 원래 하는 일이 "창업이냐 폐업이냐" 를 먼저 묻는
       것이라 차례도 그쪽이 맞습니다. */
    ((side || cat) && cats.length > 1
      ? '<ul class="chip-g chip-g-fil ct-f2">'+
          '<li><a class="chip chip-2'+(cat?"":" on")+'" href="'+esc(ctUrl(side,""))+'">'+
            '분야 전체</a></li>'+
          cats.map(function(k){
            return '<li><a class="chip chip-2'+(cat===k.key?" on":"")+'" href="'+
              esc(ctUrl(side, k.key))+'">'+esc(k.name)+' '+cnt(k.key)+'</a></li>';
          }).join("")+
        '</ul>'
      : '')+
    (list.length
      ? '<ul class="ct-l">'+list.map(card).join("")+'</ul>'
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


/* ════════════════════════════════════════════════════════════════════
   플랫폼 소개 (/about) 에 붙는 구간 넷

   ⚠️ **이 넷은 원래 메인에 있었습니다.** 2026-09-30 지시서 §23 이
   "랜딩과 실제 서비스 메인을 분리한다" 고 정해서 여기로 옮겼습니다 —
   지운 것이 아닙니다. 랜딩(§24 차례)에 다시 끌어오지 마세요.

   ⚠️ **`check.js` 가 이 넷을 `/about` 에서 봅니다.** 여기서 빼면
   "규모감 숫자가 센 값이다" · "진행이 세 걸음" · "화면과 구조화
   데이터가 같다" 검사가 같이 무너집니다.
   ════════════════════════════════════════════════════════════════════ */
function TrustBar(){
  var rows = [
    ["won",   "찾고 비교하는 것은 무료",   "상담료를 받지 않습니다"],
    ["scale", "추천 · 광고는 그렇다고 표시합니다", "일반 결과는 조건 적합도 순입니다"],
    ["shield","중개자이고 거래 당사자가 아닙니다", "계약은 업체와 직접 하십니다"],
    ["map",   "전국 시 · 군 · 구 기준",     "지역이 맞아야 견적이 뜻이 있습니다"]
  ];
  return '<section class="tbar"><div class="w tbar-g">'+
    rows.map(function(r){
      return '<div class="tbar-i">'+icon(r[0],20)+
        '<span><b>'+esc(r[1])+'</b><em>'+esc(r[2])+'</em></span></div>';
    }).join("")+
  '</div></section>';
}

function ScaleBand(){
  var ind = (window.AM_INDUSTRIES || []).length;
  var st  = (window.AM_START_CATS || []).length;
  var cl  = (window.AM_CLOSE_CATS || []).length;
  var sub = (window.AM_CATS || []).reduce(function(a, c){
    return a + ((c.items || []).length); }, 0);

  /* ⚠️ 데이터가 비면 이 구간을 통째로 뺍니다 (절대 규칙 2).
     "0개 분야" 는 규모감이 아니라 미완성 표시입니다. */
  if(!ind || !st || !cl || !sub) return "";

  var n = [
    [ind, "업종",        "음식점부터 사무 · 전문서비스까지"],
    [st,  "창업 분야",   "점포 · 인테리어 · 장비 · 인허가 · 자금"],
    [cl,  "폐업 분야",   "양도 · 처분 · 철거 · 원상복구 · 세무"],
    [sub, "세부 서비스", "업종을 고르시면 필요한 것만 추려 드립니다"]
  ];
  return '<section class="scale"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">우리가 다루는 범위</p>'+
      '<h2 class="scale-h">가게 하나를 열고 닫는 데<br class="br-m"> '+
        '필요한 것은 <em>생각보다 많습니다.</em></h2>'+
    '</div>'+
    '<ul class="scale-g">'+ n.map(function(x){
      /* ⚠️ grid 칸에 맨글을 두지 않습니다 — 태그로 감쌉니다. */
      return '<li class="scale-i">'+
        '<b class="scale-n">'+x[0]+'</b>'+
        '<span class="scale-k">'+esc(x[1])+'</span>'+
        '<span class="scale-l">'+esc(x[2])+'</span>'+
      '</li>';
    }).join("")+'</ul>'+
    /* ⚠️ 이 줄을 지우지 마세요. 숫자만 크게 띄우면 "업체가 183곳" 으로
       읽힙니다. 무엇을 센 값인지 밝혀야 합니다. */
    '<p class="scale-n-b">이 숫자는 저희가 다루는 <b>분야의 수</b>입니다. '+
      '등록된 업체 수나 거래 실적이 아닙니다.</p>'+
  '</div></section>';
}

function HowBand(){
  var step = [
    ["01", "조건을 고릅니다",
     "업종 · 지역 · 필요한 서비스. 가입하지 않으셔도 됩니다.",
     "sliders"],
    ["02", "한 번만 적어 보냅니다",
     "같은 내용을 업체마다 다시 적지 않으셔도 됩니다. "+
     "조건이 맞는 곳에 같이 전달합니다.",
     "mail"],
    ["03", "받으신 제안을 나란히 놓습니다",
     "금액만 보면 틀립니다. 무엇이 포함됐는지가 같아야 비교가 뜻을 "+
     "가집니다 — 그 자리를 만들어 드립니다.",
     "scale"]
  ];
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">어떻게 진행되나</p>'+
      '<h2>업체를 찾아 전화를 돌리는 대신,<br class="br-m"> '+
        '한 번만 적으시면 됩니다.</h2>'+
    '</div>'+
    '<ol class="how-g">'+ step.map(function(x){
      return '<li class="how-i">'+
        '<span class="how-n">'+esc(x[0])+'</span>'+
        '<span class="how-ic">'+icon(x[3],22)+'</span>'+
        '<b class="how-t">'+esc(x[1])+'</b>'+
        '<span class="how-d">'+esc(x[2])+'</span>'+
      '</li>';
    }).join("")+'</ol>'+
    '<div class="row-cta"><a class="btn btn-b btn-lg" href="/quote">'+
      '견적 요청하기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/providers">업체 먼저 둘러보기</a></div>'+
  '</div></section>';
}

function FaqBand(){
  var all = (window.amFaq ? amFaq() : []);
  if(!all.length) return "";
  /* ⚠️ 메인에는 **여섯까지**입니다. 열을 다 펴 두었더니 이 구간 하나가
     2,162px 이 되어 메인에서 제일 긴 구간이 됐습니다. 나머지는 /faq
     에서 봅니다 — 숨기는 것이 아니라 옮기는 것이고, 단추가 바로
     아래 있습니다. */
  var f = all.slice(0, 6);
  return '<section class="sec sec-white"><div class="w w-narrow">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">자주 묻는 것</p>'+
      '<h2>먼저 궁금해하시는 것들</h2>'+
    '</div>'+
    '<ul class="faq-l">'+ f.map(function(x, i){
      /* ⚠️ `<details>` 를 쓰지 않은 이유는 접힌 글을 검색엔진이
         낮춰 볼 수 있어서입니다. 여기서는 처음부터 펴 둡니다 —
         답이 짧아서 접을 이유도 없습니다. */
      return '<li class="faq-i">'+
        '<b class="faq-q">'+esc(x.q)+'</b>'+
        '<p class="faq-a">'+esc(x.a)+'</p>'+
      '</li>';
    }).join("")+'</ul>'+
    (all.length > f.length
      ? '<div class="row-cta row-mid"><a class="btn btn-o" href="/faq">'+
        '자주 묻는 것 전부 보기'+icon("arrow",16)+'</a></div>'
      : "")+
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
    /* ⚠️ 2026-10-01 — 여기가 메인 히어로와 **같은 문장**이 됐습니다.
       랜딩을 없애면서 메인 제목이 "창업부터 폐업까지." 에서
       "창업에 필요한 모든 것. 폐업에 필요한 모든 것." 으로 바뀌었는데,
       이 화면이 그 문장을 쓰고 있었습니다 — 두 화면이 같은 말을 외치면
       `/about` 이 무엇을 하는 화면인지가 묻힙니다. 이 화면이 답하는
       것은 **무엇을 하고 무엇을 하지 않는가**입니다 (바로 아래 두 목록). */
    h1raw:"저희가 하는 일과<br> 하지 않는 일.",
    lead:B.slogan || "",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w two-list">'+
    '<div><h2>하는 일</h2><ul class="tick-l">'+yes.map(function(t){
      return '<li>'+icon("check",16)+'<span>'+esc(t)+'</span></li>'; }).join("")+'</ul></div>'+
    '<div><h2>하지 않는 일</h2><ul class="tick-l tick-x">'+no.map(function(t){
      return '<li>'+icon("x",16)+'<span>'+esc(t)+'</span></li>'; }).join("")+'</ul></div>'+
  '</div></section>'+
  TrustBar()+
  ScaleBand()+
  HowBand()+
  FaqBand()+
  '<section class="sec sec-note"><div class="w"><p class="note note-box">'+
    /* ⚠️⚠️ **브랜드 이름 뒤의 조사를 손으로 적지 마세요.** "ABOUTMEAT은"
       으로 박아 두었다가 이름이 "인수인계" 가 되자 **"인수인계은"** 이
       됐습니다 — 법으로 알려야 하는 중개자 고지(전자상거래법 제20조
       제1항) 바로 그 문장입니다. `korean.js` 의 `koWith()` 가 받침을
       보고 고릅니다. */
    esc(koWith(B.name||"","은는"))+' 통신판매중개자이며 입점 업체와 이용자 사이의 거래 당사자가 '+
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

/* ════════════════════════════════════════════════════════════════════
   메인 화면 — 지시서 3번 "메인페이지 구성" · 첨부 시안

   ⚠️⚠️ **여기 적는 글이 곧 구글에 나가는 글입니다.** build.js 가 이
   글자를 그대로 index.html 에 넣습니다 — 화면과 크롤러 본문이 어긋날
   길이 없습니다. 그래서 **지킬 수 없는 말을 적으면 그대로 거짓말이
   됩니다** (절대 규칙 5).

   ⚠️⚠️ **지금 입점업체는 0곳입니다.** 업체 카드를 만들어 채우면 그
   순간 없는 회사를 광고하는 것이고 표시 · 광고의 공정화에 관한 법률
   제3조 위반입니다. 0 이면 화면이 **0 이라고 말합니다** — 다만
   막다른 길로 두지 않고 지금 실제로 되는 것을 같이 냅니다.
   ════════════════════════════════════════════════════════════════════ */
var W = global.window, esc = W.esc, icon = W.icon;
var card = require("./_card.js");

/* ⚠️⚠️ **네 영역은 js/data/catalog.js 의 AM_ZONES 한 곳에서 옵니다**
   (2차 지시서 §4). 이름도 분류도 여기 다시 적지 않습니다 — 두 곳에
   적으면 한쪽만 고쳐서 조용히 달라집니다. */

/* ⚠️⚠️ 시안의 "다양한 혜택 — 특가 · 프로모션 · 이벤트 지속 제공" 은
   **지금 지킬 수 없는 약속**이라 뺐습니다 (쿠폰도 이벤트도 0건입니다).
   "검증된 업체" 도 심사가 돌기 전에는 쓸 수 없어서, 실제로 하게 될
   일(사업자등록 확인)로 바꿔 적었습니다. 나머지 둘은 시안 그대로입니다. */
var WHY = [
  { icon:"shield", t:"사업자 확인",
    d:"사업자등록을 확인한 업체만 등록합니다." },
  { icon:"bolt",   t:"한눈에 비교",
    d:"지역 · 가격 · 조건을 같은 기준으로 나란히 봅니다." },
  { icon:"cal",    t:"간편한 상담",
    d:"상담 신청부터 업체 연결까지 한곳에서." },
  { icon:"info",   t:"있는 그대로",
    d:"업체가 없는 분류는 없다고 말합니다. 숫자를 지어내지 않습니다." }
];

/* 2차 지시서 §5 의 고객 이용 과정을 넷으로 줄여 적었습니다 (시안의
   "이용 방법" 과 같은 차례입니다). ⚠️ 여기 적은 것은 **실제로 그렇게
   돌아야 합니다** — 아직 안 되는 단계는 /match 화면이 그 자리에서
   "준비 중" 이라고 말합니다. */
var STEPS = [
  { n:"01", t:"서비스 선택",      d:"필요한 골프 서비스를 고릅니다. 여러 개 고르셔도 됩니다." },
  { n:"02", t:"조건 입력",        d:"지역 · 예산 · 일정 등 간단한 요청을 적습니다." },
  { n:"03", t:"업체 제안 비교",    d:"여러 업체의 제안을 나란히 놓고 확인합니다." },
  { n:"04", t:"상담 · 예약 · 거래", d:"마음에 드는 업체와 바로 진행합니다." }
];

/* 시안 가운데의 매칭 띠 — ⚠️ 여기 적는 셋은 **매칭이 실제로 하는 일**
   입니다. 지키지 못할 말을 적으면 그대로 거짓말이 됩니다. */
var MATCH_WHY = [
  "원하는 조건만 입력하면",
  "여러 업체가 제안하고",
  "비교 후 선택할 수 있어요"
];

function hero(){
  var B = W.AM_BRAND;
  return '<section class="hero"><div class="wrap hero-in">' +
    '<p class="hero-kick">' + esc(B.en) + '</p>' +
    '<h1>골프의 모든 것,<br><b>' + esc(B.name) + '</b></h1>' +
    '<p class="hero-sub">' + esc(B.desc) + '</p>' +
    /* ⚠️⚠️ **두 단추는 서로 다른 일을 합니다** (2차 지시서 §3-B).
       업체 직접 찾기 = 손님이 고르고 비교 · 매칭 요청 = 업체가 제안.
       같은 곳으로 보내면 지시서가 못 박은 것을 어깁니다. */
    '<div class="hero-cta">' +
      '<a class="btn btn-pt" href="/search">' + icon("search",20) + '업체 직접 찾기</a>' +
      '<a class="btn btn-ghost" href="/match">' + icon("match",20) +
        '한 번에 견적 · 매칭 요청하기</a>' +
    '</div>' +
  '</div></section>';
}

function cats(){
  return '<section class="cats" aria-labelledby="cats-h"><div class="wrap">' +
    '<h2 id="cats-h" class="sr">서비스 분류</h2>' +
    '<div class="cats-in"><div class="cat-grid">' +
    W.AM_CATS.map(function(c){
      return '<a class="cat" href="' + esc(W.amCatUrl(c)) + '">' +
        icon(c.icon, 34) +
        '<span class="cat-n">' + esc(c.name) + '</span>' +
        '<span class="cat-l">' + esc(c.lead) + '</span>' +
      '</a>';
    }).join("") +
    '</div></div></div></section>';
}

function feats(){
  return '<section class="sec"><div class="wrap">' +
    '<div class="sec-hd"><h2>무엇을 하시려고 오셨나요</h2>' +
    '<p>골프에 필요한 일을 네 가지로 묶었습니다. 하려는 일을 고르면 그 안의 분류로 이어집니다.</p></div>' +
    '<div class="feat">' + (W.AM_ZONES || []).map(function(z, i){
      var cs = W.amZoneCats(z);
      if(!cs.length) return "";   /* ⚠️ 빈 영역은 안 그립니다 */
      return '<a class="feat-c feat-' + (i+1) + '" href="' + esc(W.amCatUrl(cs[0])) + '">' +
        '<h3>' + esc(z.name) + '</h3>' +
        '<p>' + esc(cs.map(function(c){ return c.name; }).join(" · ")) + '</p>' +
        '<p class="feat-l">' + esc(z.lead) + '</p>' +
        '<span class="go">' + icon("arrow",20) + '</span></a>';
    }).join("") + '</div>' +
  '</div></section>';
}

function why(){
  return '<section class="sec sec-alt"><div class="wrap">' +
    '<div class="why">' +
      /* ⚠️ 조사를 글자로 박지 않습니다 — 이름이 바뀌면 "골프파크이" 가
         됩니다. 받침에 따라 갈리는 일은 koWith() 한 곳에서 합니다. */
      '<p class="why-t">' + esc(W.koWith(W.AM_BRAND.name, "이가")) + '<br>일하는 방식</p>' +
      WHY.map(function(w){
        return '<div class="why-i">' + icon(w.icon, 24) +
          '<div><h3>' + esc(w.t) + '</h3><p>' + esc(w.d) + '</p></div></div>';
      }).join("") +
    '</div>' +
  '</div></section>';
}

/* ⚠️⚠️ 입점업체 0곳 — 카드를 지어내지 않습니다. 대신 지금 실제로
   되는 것(입점 신청 · 분류 둘러보기)을 같이 냅니다. */
function providers(){
  var list = W.amProviders();
  if(list.length){
    /* ⚠️ 최근 여섯 곳만 — 메인이 목록 화면이 되면 분류 화면이 할 일이
       없어집니다. 전부 보는 길은 분류 · 업체찾기입니다.
       ⚠️ 평점 · 후기 수는 값으로 들고 있지 않습니다 (절대 규칙 1). */
    return '<section class="sec"><div class="wrap">' +
      '<div class="sec-hd"><h2>입점업체</h2>' +
      '<p>지금 ' + W.won(list.length) + '곳이 등록되어 있습니다.</p></div>' +
      card.grid(list.slice(0, 6)) +
      '<p style="margin-top:18px"><a class="btn btn-line" href="/categories">' +
      icon("arrow",18) + '분류에서 더 보기</a></p>' +
    '</div></section>';
  }
  return '<section class="sec"><div class="wrap">' +
    '<div class="sec-hd"><h2>신규 입점업체</h2></div>' +
    '<div class="none">' +
      '<h2>아직 입점한 업체가 없습니다.</h2>' +
      '<p>문을 열기 전이라 보여 드릴 업체가 없습니다. 없는 업체를 지어내 보여 드리지 않습니다.</p>' +
      '<a class="btn btn-pri" href="/join">' + icon("store",20) + '첫 번째로 입점하기</a>' +
    '</div>' +
  '</div></section>';
}

function steps(){
  return '<section class="sec sec-alt"><div class="wrap">' +
    '<div class="sec-hd"><h2>이용 방법</h2></div>' +
    '<div class="feat">' + STEPS.map(function(s){
      return '<div class="feat-c" style="background-image:linear-gradient(150deg,#1B5E3A,#0C2A1B)">' +
        '<p class="step-n">' + esc(s.n) + '</p>' +
        '<h3 style="margin-top:10px">' + esc(s.t) + '</h3><p>' + esc(s.d) + '</p></div>';
    }).join("") + '</div>' +
  '</div></section>';
}

/* ⚠️ 히어로의 두 번째 단추와 **같은 곳**으로 갑니다 (/match).
   두 곳에 서로 다른 주소를 적으면 한쪽만 고쳐서 어긋납니다. */
function matchBand(){
  return '<section class="sec"><div class="wrap"><div class="mband">' +
    '<div class="mband-t">' +
      '<h2>한 번에 견적 · 매칭 요청하기</h2>' +
      '<ul class="mband-l">' + MATCH_WHY.map(function(t){
        return '<li>' + icon("check", 18) + esc(t) + '</li>';
      }).join("") + '</ul>' +
      '<a class="btn btn-pt" href="/match">지금 매칭 요청하기' + icon("arrow",18) + '</a>' +
    '</div>' +
    '<div class="mband-s">' + icon("match", 72) + '</div>' +
  '</div></div></section>';
}

function joinBand(){
  return '<section class="sec"><div class="wrap"><div class="join">' +
    icon("store", 34) +
    '<div class="join-t"><h3>골프 관련 사업자라면 지금 바로 입점하세요</h3>' +
    '<p>입점은 무료입니다. 사업자 정보와 하시는 일을 등록하시면 그 일을 찾는 손님에게 이어집니다.</p></div>' +
    '<a class="btn btn-pri" href="/join">업체 입점하기' + icon("arrow",18) + '</a>' +
  '</div></div></section>';
}

/* ⚠️ 광고 · 스폰서 구간은 **집행 중인 광고가 0건이라 그리지 않습니다.**
   빈 광고 액자를 두면 미완성 사이트로 읽힙니다 (절대 규칙 2).
   광고가 들어오면 여기서 그리고, 그때 **"광고" 라고 반드시 표시**합니다
   (표시 · 광고의 공정화에 관한 법률). */

exports.build = function(){
  return {
    route: "/",
    title: W.AM_BRAND.slogan,
    desc: W.AM_BRAND.desc + " 레슨 · 중고 골프장터 · 부킹 · 조인 · 연습장 · 용품 · 피팅 · 여행까지 " +
          "골프 업체를 한곳에서 찾고 비교합니다.",
    body: hero() + cats() + feats() + matchBand() + why() + providers() + steps() + joinBand()
  };
};

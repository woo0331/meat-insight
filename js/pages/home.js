/* ════════════════════════════════════════════════════════════════════
   랜딩 (/) — 2026-09-30 랜딩 지시서 + 시안

   ⚠️⚠️ **시안이 기준입니다.** 이 화면은 제가 새로 디자인한 것이
   아니라 사장님이 주신 시안을 웹으로 옮긴 것입니다. 구간 차례 · 색 ·
   글 · 카드 짜임새를 임의로 바꾸지 마세요 — 바꾸실 일이 생기면
   시안을 먼저 고치고 여기를 맞추는 순서입니다.

   구간 다섯입니다 (시안 위에서 아래로) —
     ① 히어로            좌우 사진 · 가운데 글 · CTA **하나**
     ② ONE STOP          머리글 + START/CLOSE 큰 카드 둘
     ③ 연결              폐업 자산 → ABOUTMEAT → 새로운 시작
     ④ 브랜드 메시지      전면 사진
     ⑤ 마지막 CTA        초록 / 주황 반반

   ⚠️ **여기 없는 것을 끌어오지 마세요** (지시서 §20) — 검색 결과 ·
   업체 목록 · 프랜차이즈 목록 · 매물 목록 · 계산기 · 견적 상세 ·
   회원 기능. 전부 `/home` 과 각자 주소에 있습니다.

   ⚠️ **업체 입점 구간은 시안에 없어서 뺐습니다.** 지운 것이 아니라
   `/home` 과 헤더 버튼과 `/join` 에 그대로 있습니다.

   ⚠️⚠️ **업체 · 브랜드 · 매물 · 후기 · 숫자를 지어내지 않습니다.**
   지금 업체 0곳 · 프랜차이즈 0개 · 매물 0건입니다. 이 화면에는
   실적 숫자가 한 곳도 없습니다 — 시안에도 없습니다.

   ⚠️ **사진이 이 디자인의 절반입니다** (§16). 지금 0장이라 빈 액자로
   자리만 지키고 있습니다. `img/` 에 파일을 넣고 `js/data/photos.js` 의
   `WOW_PHOTOS` 에 한 줄씩 적으면 **이 파일은 안 고쳐도** 채워집니다.
   ════════════════════════════════════════════════════════════════════ */

function PageHome(){
  return Hero()+
         OneStopBand()+
         FlowBand()+
         BrandScene()+
         FinalBand();
}

/* ── ① 히어로 ─────────────────────────────────────────────────────
   시안: 좌우로 매장 사진이 깔리고 **가운데가 밝게 트인 자리**에 글.
   ⚠️ 사진 위에 검은 막을 씌우지 마세요 — 가독성은 **흰 그라디언트**
   (`.lh-veil`)로 얻습니다. 밝고 따뜻해야 합니다.
   ⚠️ 사진이 없으면 겹을 아예 안 냅니다. 없는 사진 위에 흰 막을
   덮으면 화면이 통째로 흰 판이 됩니다.
   ⚠️ **누를 곳은 하나뿐입니다** (§3). 시안에 버튼이 하나입니다 —
   여기에 두 번째 버튼이나 적는 칸을 더하지 마세요. */
function Hero(){
  var veil = (hasPhoto("hero-start") || hasPhoto("hero-close"))
    ? '<span class="lh-veil" aria-hidden="true"></span>' : "";
  return '<section class="lh">'+
    '<span class="lh-ph lh-ph-l">'+photoBox("hero-start","",true)+'</span>'+
    '<span class="lh-ph lh-ph-r">'+photoBox("hero-close","",true)+'</span>'+
    veil+
    /* 손글씨 감성 문구 (§4) — 폰에서는 숨깁니다 */
    '<p class="lh-hw lh-hw-l" aria-hidden="true"><i>새로운 시작,</i>'+
      '<i>더 나은 가능성</i></p>'+
    '<p class="lh-hw lh-hw-r" aria-hidden="true"><i>잘 정리하는 것도</i>'+
      '<i>새로운 시작입니다</i></p>'+
    '<div class="w lh-in">'+
      /* ⚠️ h1 은 화면에 하나입니다. 강조는 그 안의 <em> 입니다 */
      '<h1 class="lh-h">창업부터 <em class="lh-cl">폐업</em>까지.</h1>'+
      '<p class="lh-h2">사장님의 시작과 끝을<br class="br-m"> 연결합니다.</p>'+
      '<p class="lh-d">좋은 시작을 돕고,<br class="br-m"> '+
        '안전한 정리를 지원하는<br class="br-m"> '+
        '사장님 맞춤 플랫폼, '+esc(amBrandKo())+'입니다.</p>'+
      '<p class="lh-cta"><a class="btn btn-nv btn-lg" href="/home">'+
        '플랫폼 시작하기'+icon("arrow",18)+'</a></p>'+
    '</div>'+
    /* 아래로 더 있다는 표시 — 시안의 SCROLL DOWN */
    '<p class="lh-sc" aria-hidden="true"><span class="lh-sc-m"></span>'+
      '<i>SCROLL DOWN</i></p>'+
  '</section>';
}

/* ── ② ONE STOP + START / CLOSE 큰 카드 둘 ────────────────────────
   시안: 아이보리 바탕 한 구간 안에 머리글과 큰 카드 둘이 같이 있습니다.
   ⚠️ **두 카드의 크기와 비율이 같아야 합니다** (§7). 폐업 쪽을 좁히면
   그게 "덜 중요한 것" 이라는 말이 됩니다.

   ⚠️ 미니카드 여덟씩은 **시안에 적힌 묶음**입니다. 우리 분류 스물다섯
   개를 손님이 쓰는 말로 묶은 것이라, 링크는 전부 **실제 있는 화면**
   으로 갑니다. 새 주소를 만들지 않았습니다.
   ⚠️ 여기서 빠진 분류는 **잘라 낸 것이 아닙니다** — "기타 서비스" 와
   카드 오른쪽 위 화살표가 `/startup` · `/closure` 로 보내고, 거기
   에는 스물다섯 개가 전부 있습니다. */
/* ⚠️⚠️ **아이콘을 여기 손으로 적지 마세요.** `cat` 에 분류 key 를 적으면
   `catalog.js` 에서 가져옵니다 (§29). 손으로 적어 두었더니 랜딩과
   `/home` 이 서로 다른 아이콘을 쓰게 됐습니다 — 한 사이트에서 같은
   것이 화면마다 다르게 보였습니다. 실제로 이랬습니다:

     프랜차이즈 = 전구    `bulb` 는 /home 에서 **창업 아이템**입니다
     재고 처리 = 장바구니  재고가 아니라 쇼핑으로 읽힙니다
     인테리어 · 철거 = 둘 다 망치   한 화면에 같은 아이콘, 다른 뜻
     세무 · 노무 = 방패(창업) / 문서(폐업)   같은 것인데 서로 다름

   ⚠️ 분류가 없는 카드(프랜차이즈 · 기타)만 `ic` 를 직접 적습니다. */
var LSTART = [
  { n:"프랜차이즈",  ic:"store",  to:"/franchise",           t:"franchise" },
  { n:"점포 · 상권", cat:"area",  to:"/c/area",              t:"estate" },
  { n:"인테리어",    cat:"interior", to:"/providers/interior", t:"interior" },
  { n:"장비 · 가구", cat:"furniture", to:"/providers/furniture", t:"furniture" },
  { n:"POS · IT",   cat:"it",    to:"/providers/it",        t:"pos" },
  /* 딱지는 "세무 · 노무" 인데 가는 곳은 행정 · 전문가입니다. 아이콘은
     **딱지를 따릅니다** — 손님이 보는 말이 그쪽이라서요. */
  { n:"세무 · 노무", cat:"tax",   to:"/providers/admin",     t:"tax" },
  { n:"마케팅",      cat:"marketing", to:"/providers/marketing", t:"mkt" },
  { n:"기타 서비스", ic:"grid",   to:"/startup",             t:"etc" }
];
var LCLOSE = [
  { n:"매장 양도",      cat:"transfer", to:"/stores",          t:"estate" },
  { n:"시설 · 집기 처분", cat:"asset",  to:"/assets",          t:"equip" },
  { n:"재고 처리",      cat:"stock",    to:"/assets",          t:"food" },
  { n:"철거 · 원상복구", cat:"demolish", to:"/providers/demolish", t:"demolish" },
  { n:"세무 · 노무",    cat:"tax",      to:"/providers/tax",   t:"tax" },
  { n:"폐업 지원",      cat:"support",  to:"/support",         t:"pos" },
  { n:"법률 · 행정",    cat:"law",      to:"/providers/law",   t:"etc" },
  { n:"청소 · 방역",    cat:"clean",    to:"/providers/clean", t:"clean" }
];
/* 분류에서 아이콘을 가져옵니다 — 분류 쪽을 고치면 랜딩도 같이 따라옵니다.
   ⚠️ 없는 key 를 적으면 조용히 빈 아이콘이 되므로 `check.js` 가 봅니다. */
function lIcon(o){
  if(o.cat){
    var c = (window.AM_CATS||[]).filter(function(x){ return x.key === o.cat; })[0];
    if(c && c.icon) return c.icon;
  }
  return o.ic || "";
}

function sideCard(o){
  return '<div class="lsd lsd-'+o.side+'">'+
    '<div class="lsd-t">'+
      '<p class="lsd-b">'+esc(o.badge)+'</p>'+
      '<div class="lsd-h"><b>'+esc(o.title)+'</b><i>'+esc(o.lead)+'</i></div>'+
      '<a class="lsd-go" href="'+esc(o.to)+'" aria-label="'+esc(o.title)+' 전체 보기">'+
        icon("arrow",20)+'</a>'+
    '</div>'+
    '<ul class="lsd-g">'+o.items.map(function(x){
      return '<li><a href="'+esc(x.to)+'">'+
        '<span class="lsd-i lt-'+esc(x.t)+'">'+icon(lIcon(x),22)+'</span>'+
        '<i>'+esc(x.n)+'</i></a></li>'; }).join("")+'</ul>'+
  '</div>';
}

function OneStopBand(){
  return '<section class="sec lin"><div class="w">'+
    '<p class="lin-k">ONE STOP BUSINESS PLATFORM</p>'+
    '<div class="lin-hd">'+
      '<h2>시작할 때도, 정리할 때도<br class="br-m"> 혼자 알아볼 필요 없습니다.</h2>'+
      '<p>점포부터 인테리어, 장비, 세무, 마케팅까지.<br class="br-m"> '+
        '매장 양도부터 철거, 원상복구, 세무 정리까지.<br class="br-m"> '+
        '사장님에게 필요한 모든 과정을 한 곳에서 쉽고 빠르게 해결할 수 있습니다.</p>'+
    '</div>'+
    '<div class="ltwo">'+
      sideCard({ side:"st", badge:"START", title:"창업",
                 lead:"새로운 사업을 시작합니다.", to:"/startup", items:LSTART })+
      sideCard({ side:"cl", badge:"CLOSE", title:"폐업",
                 lead:"사업을 정리합니다.", to:"/closure", items:LCLOSE })+
    '</div>'+
  '</div></section>';
}

/* ── ③ 연결 — 한 사장님의 끝이 다른 사장님의 시작이 됩니다 ─────────
   시안에서 제일 공들인 구간입니다. 아이콘 도식으로 줄이지 마세요 (§9) —
   **실제 사람 · 실제 매장 · 실제 장비 사진**으로 이야기가 한눈에
   보여야 합니다.
   ⚠️ 흐름은 **주황(정리) → 남색(우리) → 초록(시작)** 입니다 (§8).
   ⚠️ 폰에서는 세로로 세웁니다 (§23) — 정리하는 사장님 ↓ 자산 ↓
   ABOUTMEAT ↓ 새로운 시작. */
var LASSETS = [
  { k:"asset-store",     n:"매장" },
  { k:"asset-facility",  n:"시설" },
  { k:"asset-equip",     n:"장비" },
  { k:"asset-furniture", n:"가구" },
  { k:"asset-fixture",   n:"집기" },
  { k:"asset-stock",     n:"재고" }
];

/* 이어받는 쪽에서 실제로 달라지는 것 — ⚠️ 왼쪽 자산 여섯을 그대로
   다시 적지 않습니다. 같은 말을 두 번 하면 화살표가 무슨 뜻인지
   흐려집니다. **그것이 다음 사장님에게 무엇인지**를 적습니다. */
var LGAINS = [
  { n:"자리",      d:"상권을 처음부터 다시 찾지 않아도 됩니다" },
  { n:"시설 · 장비", d:"쓸 수 있는 것은 새로 사지 않아도 됩니다" },
  { n:"여는 날",    d:"공사 기간이 줄어 문을 빨리 엽니다" }
];

function FlowBand(){
  /* ⚠️ **빈 회색 상자를 깔지 않습니다** (§16 — "임의의 컬러 박스로
     대체하지 않는다"). 사진이 없는 자리는 액자째 뺍니다.
     ⚠️ 그런데 액자만 빼면 **글자 한 줄만 남아 기둥이 텅 빕니다.**
     그래서 사진이 없을 때는 자산 카드가 곧 "정리하는 쪽" 이고,
     오른쪽은 이어받는 쪽 카드가 자리를 지킵니다 — 사진이 들어오면
     그 위로 액자가 붙습니다. */
  var pCl = hasPhoto("flow-close");
  var pSt = hasPhoto("flow-start");
  var pOw = hasPhoto("flow-start-owner");

  /* ── 정리하는 쪽 ── */
  var left = '<div class="lbr-side lbr-side-cl">'+
    '<p class="lbr-hw">정리하는 사장님</p>'+
    (pCl ? '<figure class="lbr-p lbr-p-cl">'+photoBox("flow-close")+'</figure>' : '')+
    '<div class="lbr-as">'+
      '<p class="lbr-as-t">폐업하는 사장님의 자산</p>'+
      '<ul class="lbr-as-g">'+LASSETS.map(function(a){
        return '<li>'+(hasPhoto(a.k) ? photoBox(a.k) : '')+
          '<i>'+esc(a.n)+'</i></li>'; }).join("")+'</ul>'+
    '</div>'+
  '</div>';

  /* ── 이어받는 쪽 ── */
  var right = '<div class="lbr-side lbr-side-st">'+
    '<p class="lbr-hw lbr-hw-st">창업하는 사장님</p>'+
    (pSt ? '<figure class="lbr-p lbr-p-st">'+photoBox("flow-start")+'</figure>' : '')+
    (pOw ? '<figure class="lbr-p lbr-p-ow">'+photoBox("flow-start-owner")+'</figure>' : '')+
    '<div class="lbr-gn">'+
      '<p class="lbr-gn-t">새로운 시작에서 달라지는 것</p>'+
      '<ul class="lbr-gn-g">'+LGAINS.map(function(g){
        return '<li><b>'+esc(g.n)+'</b><i>'+esc(g.d)+'</i></li>'; }).join("")+'</ul>'+
    '</div>'+
  '</div>';

  return '<section class="sec lbr"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<h2>한 사장님의 끝이<br class="br-m"> 다른 사장님의 시작이 됩니다.</h2>'+
      '<p>사용하던 매장이, 다음 사장님에게는 새로운 시작이 될 수 있습니다.<br class="br-m"> '+
        esc(amBrandKo())+'가 그 연결을 만들어갑니다.</p>'+
    '</div>'+
    '<div class="lbr-g">'+
      left+
      /* 가운데 — 우리. 주황(정리)이 들어오고 초록(시작)이 나갑니다 */
      '<div class="lbr-mid">'+
        '<span class="lbr-arw lbr-arw-in" aria-hidden="true"></span>'+
        '<div class="lbr-logo">'+
          '<span class="lbr-logo-i">'+icon("home",26)+'</span>'+
          '<b>'+esc(amBrand())+'</b>'+
          '<i>'+esc((window.AM_BRAND||{}).sub||"")+'</i>'+
        '</div>'+
        '<span class="lbr-arw lbr-arw-out" aria-hidden="true"></span>'+
      '</div>'+
      right+
    '</div>'+
  '</div></section>';
}

/* ── ④ 브랜드 메시지 — 전면 사진 ──────────────────────────────────
   ⚠️ 글이 **가운데 밝은 자리**에 앉습니다. 사진이 없으면 겹을 안 내고
   옅은 하늘빛 바탕으로 갑니다 — 없는 사진 위에 흰 막을 덮으면 흰
   판이 됩니다. */
function BrandScene(){
  var has = hasPhoto("brand-scene");
  return '<section class="lsc'+(has?" lsc-ph":"")+'">'+
    '<span class="lsc-bg">'+photoBox("brand-scene","",false)+'</span>'+
    (has ? '<span class="lsc-veil" aria-hidden="true"></span>' : '')+
    '<div class="w lsc-in">'+
      '<h2>사람은 바뀌어도,<br class="br-m"> 가게는 계속됩니다.</h2>'+
      '<p>누군가의 끝이, 또 다른 누군가의 시작이 되는<br class="br-m"> '+
        '선순환의 장을 만들어갑니다.</p>'+
    '</div>'+
  '</section>';
}

/* ── ⑤ 마지막 CTA — 초록 / 주황 반반 ──────────────────────────────
   ⚠️ **반반입니다.** 한쪽을 넓히면 그게 "덜 중요한 것" 이라는 말입니다.
   ⚠️ 흰 글자가 얹히므로 바탕은 짙은 쪽(`--start-deep` · `--close-deep`)
   을 씁니다. 옅은 초록에 흰 글자를 얹으면 안 읽힙니다. */
function finalHalf(o){
  return '<div class="lfin-c lfin-'+o.side+'">'+
    '<span class="lfin-ph">'+photoBox(o.photo)+'</span>'+
    '<div class="lfin-in">'+
      '<p class="lfin-k">'+esc(o.badge)+'</p>'+
      '<h2>'+esc(o.title)+'</h2>'+
      '<p class="lfin-d">'+esc(o.d1)+'<br class="br-m"> '+esc(o.d2)+'</p>'+
      '<a class="btn btn-w" href="'+esc(o.to)+'">'+esc(o.cta)+icon("arrow",18)+'</a>'+
    '</div>'+
  '</div>';
}

function FinalBand(){
  return '<section class="lfin">'+
    finalHalf({ side:"st", badge:"START", title:"시작하시나요?",
      d1:"지금, 더 큰 가능성이 열립니다.",
      d2:"창업에 필요한 모든 것이 준비되어 있습니다.",
      cta:"창업으로 들어가기", to:"/startup", photo:"cta-start" })+
    finalHalf({ side:"cl", badge:"CLOSE", title:"정리하시나요?",
      d1:"잘 정리하는 것도 다음을 위한 준비입니다.",
      d2:"폐업에 필요한 모든 것이 준비되어 있습니다.",
      cta:"폐업으로 들어가기", to:"/closure", photo:"cta-close" })+
  '</section>';
}

/* ════════════════════════════════════════════════════════════════════
   서비스 허브 (/home) — 랜딩의 "플랫폼 시작하기" 가 도착하는 곳

   ⚠️ **랜딩과 역할이 다릅니다.** 랜딩(`/`)은 우리가 무엇인지 3초 안에
   알리는 화면이고, 여기는 **기능이 다 모인 화면**입니다. 지시서 §20
   이 랜딩에서 빼라고 한 것들(업체 · 프랜차이즈 · 매물 · 계산기 ·
   MY · 업체 입점)이 전부 여기 있습니다.

   ⚠️ **여기에도 숫자를 지어내지 않습니다.** 칸마다 붙는 개수는 전부
   배열을 그 자리에서 세는 값이라 손으로 적을 자리가 없습니다.
   ════════════════════════════════════════════════════════════════════ */
/* ══════════════════════════════════════════════════════════════════
   서비스 메인 (/home) — 2026-09-30 메인 개편 지시서

   ⚠️⚠️ **랜딩(/)과 역할이 다릅니다** (지시서 §3). 랜딩은 브랜드 소개,
   여기는 **실제로 쓰는 화면**입니다. 그래서 긴 브랜드 설명 대신 바로
   행동으로 보냅니다 — 검색 · 업종 고르기 · 서비스 고르기.

   구간 차례는 지시서 §2 입니다. `check.js` 가 이 차례를 셉니다.
     ① 히어로  ② START/CLOSE  ③ 업종  ④ 핵심 서비스  ⑤ 업체
     ⑥ 프랜차이즈  ⑦ 매장 인수  ⑧ 가격 데이터  ⑨ 끝과 시작
     ⑩ 사장님 도구  ⑪ 후기  ⑫ 업체 입점

   ⚠️⚠️ **없는 것은 없다고 말합니다** (절대 규칙 1 · 지시서 §17 · §21 ·
   §25). 업체 0곳 · 브랜드 0개 · 매물 0건 · 견적 데이터 0건 · 후기 0건
   이고, 카드를 지어내지 않고 `Empty()` 로 **지금 실제로 되는 것**을
   같이 냅니다.

   ⚠️ 아이콘은 `icon()` 하나만 씁니다 — 24 viewBox · 선 1.8 · round.
   섞어 쓰면 한 화면에서 아이콘이 따로 놉니다 (§6 · §29).
   ══════════════════════════════════════════════════════════════════ */

/* ── ① 히어로 (§3 · §4) ────────────────────────────────────────────
   ⚠️ 전체를 짙은 남색으로 만들지 마세요 — 아이보리 바탕에 남색 제목,
   창업은 초록 · 폐업은 주황입니다. 첫 화면에서 색 체계가 바로 읽혀야
   합니다. */
var HUB_SUGGEST = ["카페 인테리어", "음식점 철거", "프랜차이즈",
                   "매장 양도", "POS", "세무사"];

function HubHero(){
  return '<section class="hh">'+
    '<div class="w hh-in">'+
      '<p class="hh-k">BUSINESS START &amp; CLOSE PLATFORM</p>'+
      '<h1 class="hh-h"><em class="hh-st">창업</em>에 필요한 모든 것.<br class="br-m"> '+
        '<em class="hh-cl">폐업</em>에 필요한 모든 것.</h1>'+
      '<p class="hh-d">점포부터 인테리어, 장비, 세무, 마케팅까지.<br class="br-m"> '+
        '매장 양도부터 시설 처분, 철거, 원상복구까지.</p>'+
      '<p class="hh-cta">'+
        '<a class="btn btn-st btn-lg" href="/startup">창업 시작하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-cl btn-lg" href="/closure">폐업 시작하기'+icon("arrow",18)+'</a>'+
      '</p>'+
      /* 통합 검색 — ⚠️ 폼입니다. 엔터로도 가야 합니다 */
      '<form class="hh-s" onsubmit="return hubSearch(event)" role="search">'+
        '<span class="hh-s-i" aria-hidden="true">'+icon("search",20)+'</span>'+
        '<input type="search" name="q" id="hubQ" autocomplete="off" '+
          'aria-label="통합 검색" '+
          'placeholder="인테리어, 철거, 프랜차이즈, POS, 세무사를 검색해 보세요">'+
        '<button class="btn btn-nv" type="submit">검색</button>'+
      '</form>'+
      '<p class="hh-sg"><i>많이 찾는 것</i>'+HUB_SUGGEST.map(function(q){
        return '<a href="/search?q='+encodeURIComponent(q)+'">'+esc(q)+'</a>'; }).join("")+'</p>'+
    '</div>'+
  '</section>';
}
window.hubSearch = function(e){
  e.preventDefault();
  var v = (document.getElementById("hubQ") || {}).value || "";
  v = v.trim();
  if(!v){ toast("찾으실 것을 적어 주세요"); return false; }
  go("/search?q=" + encodeURIComponent(v));
  return false;
};

/* ── ② START / CLOSE (§5) ─────────────────────────────────────────
   ⚠️ **13개 · 12개를 여기서 다 펼치지 않습니다** — 대표 여섯씩입니다.
   ⚠️ 여섯은 손으로 고른 것이 아니라 `AM_START_CATS` · `AM_CLOSE_CATS`
   의 **앞에서 여섯**입니다. 분류를 늘리면 따라옵니다.
   ⚠️ 나머지는 잘라 낸 것이 아니라 "전체 서비스 보기" 가 데려갑니다. */
function HubSide(o){
  var all = o.cats || [];
  if(!all.length) return "";      /* 데이터가 비면 카드째 뺍니다 */
  var six = all.slice(0, 6);
  return '<div class="hs hs-'+o.cls+'">'+
    '<p class="hs-k">'+esc(o.kicker)+'</p>'+
    '<h3 class="hs-h">'+esc(o.title)+'</h3>'+
    '<p class="hs-d">'+esc(o.lead)+'</p>'+
    '<ul class="hs-g">'+six.map(function(c){
      return '<li><a href="'+esc(amCatTo(c))+'">'+
        '<span class="ic-t">'+icon(c.icon,26)+'</span>'+
        '<b>'+esc(c.name)+'</b></a></li>'; }).join("")+'</ul>'+
    '<p class="hs-more"><a href="'+esc(o.to)+'">'+esc(o.title)+
      ' 전체 서비스 보기'+icon("arrow",16)+'</a>'+
      '<i>'+all.length+'개 분야</i></p>'+
  '</div>';
}
/* 분류마다 진짜 화면이 다릅니다 — `to` 가 있으면 그쪽, 업체를 찾는
   분류는 `/providers/:cat`, 나머지는 `/c/:cat` 입니다 (§46). */
function amCatTo(c){
  if(c.to) return c.to;
  return (c.kind === "provider" ? "/providers/" : "/c/") + c.key;
}
function HubTwo(){
  var st = HubSide({ cls:"st", to:"/startup", kicker:"START", title:"창업",
    lead:"새로 시작하는 데 필요한 것을 한곳에서.",
    cats:(window.AM_START_CATS||[]) });
  var cl = HubSide({ cls:"cl", to:"/closure", kicker:"CLOSE", title:"폐업",
    lead:"잘 정리하는 것도 사업입니다.",
    cats:(window.AM_CLOSE_CATS||[]) });
  if(!st || !cl) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="hs-two">'+st+cl+'</div>'+
  '</div></section>';
}

/* ── ③ 업종 고르기 (§10 · §11 · §12 · §14) ────────────────────────
   ⚠️ 업종 카드는 장식이 아닙니다 — 누르면 그 업종 창업 화면으로 가고,
   거기서 그 업종에 맞는 분류 · 장비 · 글이 나옵니다.
   ⚠️ 카드 전체를 업종 색으로 칠하지 마세요 (§12). 색은 아이콘 타일에만. */
function HubIndustry(){
  var L = (window.AM_INDUSTRIES||[]);
  if(!L.length) return "";
  /* ⚠️ 앞 구간(START/CLOSE)이 흰색이라 여기는 옅은 회색입니다. 둘 다
     흰색으로 두었더니 **두 구간이 한 구간으로 읽혔습니다** (§31).
     검사가 이웃한 두 구간의 바탕색을 봅니다. */
  return '<section class="sec sec-gray"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">BUSINESS CATEGORY</p>'+
      '<h2>어떤 사업을 준비하세요?</h2>'+
      '<p>업종을 고르시면 필요한 서비스와 업체를 바로 보여 드립니다.</p></div>'+
    '<ul class="hi-g">'+L.map(function(i){
      return '<li class="tn-'+esc(i.tone||"t7")+'">'+
        '<a href="/startup/'+esc(i.key)+'">'+
          '<span class="ic-t">'+icon(i.icon,26)+'</span>'+
          '<b>'+esc(i.name)+'</b></a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* ── ④ 핵심 서비스 (§15 · §16) ────────────────────────────────────
   ⚠️ 색은 **의미**입니다 (§27) — 초록 창업 · 주황 정리 · 파랑 정보/IT ·
   보라 세무 · 분홍 마케팅 · 금색 프랜차이즈 · 청록 매장.
   ⚠️ 옅은 바탕 + 아이콘과 화살표에만 악센트입니다 (§16). */
var HUB_SVC = [
  { k:"interior", ic:"roller",    t:"인테리어 · 시공", d:"설계 · 전기 · 배관 · 가스", c:"st" },
  { k:"demolish", ic:"hammer",    t:"철거 · 원상복구", d:"철거 · 원상복구 · 폐기물", c:"cl" },
  { k:"fr",       ic:"store",     t:"프랜차이즈",      d:"정보공개서에 있는 값만",     c:"gd" },
  { k:"it",       ic:"monitor",   t:"POS · IT",        d:"POS · 키오스크 · CCTV",     c:"bl" },
  { k:"tax",      ic:"calc",      t:"세무 · 노무",      d:"세무사 · 노무사 · 4대보험",  c:"pu" },
  { k:"transfer", ic:"pin",       t:"매장 양도 · 인수", d:"자리를 넘기고, 이어받고",   c:"tl" },
  { k:"equip",    ic:"tool",      t:"시설 · 장비",      d:"주방 · 냉동 · 간판 · 가구",  c:"sl" },
  { k:"marketing",ic:"megaphone", t:"마케팅 · 디자인",  d:"네이밍 · 로고 · SNS",       c:"pk" }
];
function HubServices(){
  var cats = (window.AM_CATS||[]);
  var byKey = {}; cats.forEach(function(c){ byKey[c.key] = c; });
  var items = HUB_SVC.map(function(s){
    if(s.k === "fr") return { s:s, to:"/franchise" };
    if(s.k === "transfer") return { s:s, to:"/stores" };
    var c = byKey[s.k];
    return c ? { s:s, to:amCatTo(c) } : null;
  }).filter(Boolean);
  if(!items.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">MOST REQUESTED</p>'+
      '<h2>지금 무엇이 필요하세요?</h2>'+
      '<p>많이 찾으시는 것부터 모았습니다.</p></div>'+
    '<ul class="hv-g">'+items.map(function(x){
      return '<li class="hv-'+x.s.c+'"><a href="'+esc(x.to)+'">'+
        '<span class="ic-t">'+icon(x.s.ic,27)+'</span>'+
        '<span class="hv-t"><b>'+esc(x.s.t)+'</b><i>'+esc(x.s.d)+'</i></span>'+
        '<span class="hv-go" aria-hidden="true">'+icon("arrow",18)+'</span>'+
      '</a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* ── 구간 한 벌 — 데이터가 있으면 카드, 없으면 Empty ──────────────
   ⚠️⚠️ **카드를 지어내지 마세요** (절대 규칙 1 · §17 · §21 · §25).
   업체 0곳인데 여섯 장을 채워 두면 그 순간 없는 회사를 광고하는
   것이고 표시광고법 제3조 위반입니다. 0 이면 0 이라고 말하고,
   대신 **지금 실제로 되는 것**을 같이 냅니다. */
function HubBand(o){
  return '<section class="sec '+esc(o.bg||"")+'"><div class="w">'+
    '<div class="sec-hd'+(o.mid?" sec-hd-c":"")+'">'+
      (o.kicker ? '<p class="eyebrow">'+esc(o.kicker)+'</p>' : '')+
      '<h2>'+o.h+'</h2>'+
      (o.lead ? '<p>'+esc(o.lead)+'</p>' : '')+'</div>'+
    o.body+
  '</div></section>';
}

/* ── ⑤ 사장님들이 찾는 업체 (§17 · §18) ───────────────────────────── */
function HubProviders(){
  var n = (window.AM_PROVIDERS||[]).length;
  var body = n
    ? '<ul class="pv-g">'+(window.AM_PROVIDERS||[]).slice(0,6).map(function(p){
        return ProviderCard(p); }).join("")+'</ul>'+
      '<p class="row-cta row-mid"><a class="btn btn-nv" href="/providers">'+
        '업체 전체 보기'+icon("arrow",18)+'</a></p>'
    : Empty({ icon:"users", title:"아직 등록된 업체가 없습니다",
        text:"업체를 지어내지 않습니다. 지금은 모으는 중이고, 등록되는 대로 "+
             "분야 · 지역으로 찾으실 수 있습니다. 먼저 조건을 남겨 두시면 "+
             "업체가 들어올 때 그 조건으로 전달합니다.",
        cta:'<a class="btn btn-nv" href="/quote">조건 남기고 견적 요청'+icon("arrow",18)+'</a>'+
            '<a class="btn btn-o" href="/join">업체로 입점하기</a>' });
  return HubBand({ bg:"sec-ivory", kicker:"PARTNERS", h:"사장님들이 찾는 업체",
    lead:"업종과 지역에 맞는 전문업체를 비교해 보세요.", body:body });
}

/* ── ⑥ 프랜차이즈 (§19) ───────────────────────────────────────────
   ⚠️ 창업비는 **정보공개서에 있는 값**이어야 합니다 (가맹사업법).
   `source` 와 `asOf` 가 없는 금액은 화면에 안 나옵니다. */
function HubFranchise(){
  var n = (window.AM_FRANCHISES||[]).length;
  var body = n
    ? '<ul class="fr-g">'+(window.AM_FRANCHISES||[]).slice(0,6).map(function(f){
        return FranchiseCard(f); }).join("")+'</ul>'+
      '<p class="row-cta row-mid"><a class="btn btn-nv" href="/franchise">'+
        '브랜드 전체 보기'+icon("arrow",18)+'</a></p>'
    : Empty({ icon:"store", title:"아직 등록된 브랜드가 없습니다",
        text:"창업비는 정보공개서에 적힌 값만 올립니다. 근거 없는 금액을 "+
             "보시고 수천만 원을 빌리러 가시면 안 되기 때문입니다. "+
             "확인한 브랜드부터 하나씩 올립니다.",
        cta:'<a class="btn btn-nv" href="/startup">창업 준비부터 보기'+icon("arrow",18)+'</a>' });
  return HubBand({ bg:"sec-white", kicker:"FRANCHISE",
    h:"어떤 장사를 시작할지 고민이라면",
    lead:"예산과 조건에 맞는 프랜차이즈를 찾아보세요.", body:body });
}

/* ── ⑦ 바로 시작할 수 있는 매장 (§20) ─────────────────────────────
   ⚠️ 평수 · 보증금 · 월세 · 권리금은 **올리신 사장님이 적은 값**이고
   우리가 확인하거나 보증하는 값이 아닙니다 — 카드가 그렇게 밝힙니다. */
function HubStores(){
  var L = (window.AM_STORES||[]);
  var body = L.length
    ? '<ul class="mk-g">'+L.slice(0,6).map(function(s){ return StoreCard(s); }).join("")+'</ul>'+
      '<p class="row-cta row-mid"><a class="btn btn-nv" href="/stores">'+
        '매장 전체 보기'+icon("arrow",18)+'</a></p>'
    : Empty({ icon:"pin", title:"아직 올라온 매장이 없습니다",
        text:"허위매물을 만들지 않습니다. 보고 연락하신 시간을 훔치는 일이라서요. "+
             "정리하시는 사장님이 올리시면 그대로 보입니다.",
        cta:'<a class="btn btn-st" href="/stores">매장 내놓기'+icon("arrow",18)+'</a>'+
            '<a class="btn btn-o" href="/closure">폐업 준비부터 보기</a>' });
  return HubBand({ bg:"sec-start", kicker:"TAKE OVER",
    h:"새로 만들지 않아도 됩니다",
    lead:"이미 준비된 매장에서 더 빨리 시작하실 수 있습니다.", body:body });
}

/* ── ⑧ 가격 · 견적 데이터 (§21) ───────────────────────────────────
   ⚠️⚠️ **평균가를 지어내지 마세요.** 견적이 0건이라 숫자가 없습니다.
   "얼마쯤" 을 적어 두면 사장님이 그 숫자로 협상하러 갑니다. 대신
   **무엇이 금액을 가르는가**를 냅니다 — 그건 근거를 댈 수 있습니다. */
function HubPrice(){
  var L = (typeof amQuoteStats === "function") ? amQuoteStats() : [];
  var body = L.length
    ? '<ul class="hp-g">'+L.map(function(q){
        return '<li><b>'+esc(q.name)+'</b><em>'+esc(q.range)+'</em>'+
          '<i>'+esc(q.asOf)+' 확인 · 견적 '+q.n+'건</i></li>'; }).join("")+'</ul>'
    : Empty({ icon:"chart", title:"가격 데이터를 모으는 중입니다",
        text:"평균가를 지어내지 않습니다. 사장님이 그 숫자를 들고 협상하러 "+
             "가시기 때문입니다. 실제 견적이 쌓이면 범위와 확인한 날짜를 "+
             "같이 냅니다. 그때까지는 무엇이 금액을 가르는지를 글로 적어 두었습니다.",
        cta:'<a class="btn btn-nv" href="/content">무엇이 금액을 가르나'+icon("arrow",18)+'</a>'+
            '<a class="btn btn-o" href="/tools/cost">창업비 직접 재 보기</a>' });
  return HubBand({ bg:"sec-blue", kicker:"PRICE",
    h:"다른 사장님들은 얼마에 하셨을까?", body:body });
}

/* ── ⑨ 한 사장님의 끝이 다른 사장님의 시작 (§22) ──────────────────
   ⚠️ 다른 구간보다 크게 냅니다. 이 플랫폼의 차별점이라서입니다.
   ⚠️ 폐업 쪽을 처연하게 쓰지 마세요 — 실패가 아니라 다음 단계입니다. */
var HUB_FLOW_CL = [
  { ic:"store", n:"매장" }, { ic:"tool", n:"시설" }, { ic:"sofa", n:"장비 · 가구" },
  { ic:"boxes", n:"재고" }
];
var HUB_FLOW_ST = [
  { ic:"pin",   n:"매장 인수", d:"상권을 처음부터 다시 찾지 않아도 됩니다" },
  { ic:"tool",  n:"시설 활용", d:"쓸 수 있는 것은 새로 사지 않아도 됩니다" },
  { ic:"clock", n:"빠른 오픈", d:"공사 기간이 줄어 문을 빨리 엽니다" }
];
function HubBridge(){
  return '<section class="sec hbr"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">START &amp; CLOSE</p>'+
      '<h2>한 사장님의 끝이<br class="br-m"> 다른 사장님의 시작이 됩니다.</h2>'+
      '<p>쓰던 매장과 시설이, 다음 사장님에게는 새로운 시작이 될 수 있습니다.</p>'+
    '</div>'+
    '<div class="hbr-g">'+
      '<div class="hbr-c hbr-cl">'+
        '<p class="hbr-k">정리하는 사장님</p>'+
        (hasPhoto("flow-close") ? '<figure class="hbr-p">'+photoBox("flow-close")+'</figure>' : '')+
        '<ul class="hbr-l">'+HUB_FLOW_CL.map(function(x){
          return '<li><span class="ic-t">'+icon(x.ic,24)+'</span><b>'+esc(x.n)+'</b></li>';
        }).join("")+'</ul>'+
      '</div>'+
      '<div class="hbr-m">'+
        '<span class="hbr-arw hbr-arw-in" aria-hidden="true"></span>'+
        '<div class="hbr-logo">'+
          '<span class="hbr-logo-i">'+icon("home",26)+'</span>'+
          '<b>'+esc(amBrand())+'</b>'+
          '<i>조건 · 지역 · 업종으로 잇습니다</i>'+
        '</div>'+
        '<span class="hbr-arw hbr-arw-out" aria-hidden="true"></span>'+
      '</div>'+
      '<div class="hbr-c hbr-st">'+
        '<p class="hbr-k hbr-k-st">창업하는 사장님</p>'+
        (hasPhoto("flow-start") ? '<figure class="hbr-p">'+photoBox("flow-start")+'</figure>' : '')+
        '<ul class="hbr-l hbr-l-st">'+HUB_FLOW_ST.map(function(x){
          return '<li><span class="ic-t">'+icon(x.ic,24)+'</span>'+
            '<span class="hbr-tx"><b>'+esc(x.n)+'</b><i>'+esc(x.d)+'</i></span></li>';
        }).join("")+'</ul>'+
      '</div>'+
    '</div>'+
  '</div></section>';
}

/* ── ⑩ 사장님 도구 (§23 · §24) ────────────────────────────────────
   ⚠️ 도구 목록은 `AM_TOOLS` 하나입니다 — 여기에 손으로 적지 마세요.
   아이콘과 악센트만 여기서 붙입니다. */
var HUB_TOOL_IC = {
  cost: { ic:"wallet",  c:"st" }, bep:   { ic:"chart",   c:"bl" },
  labor:{ ic:"users",   c:"pu" }, fixed: { ic:"receipt", c:"tl" },
  vs:   { ic:"compare", c:"gd" }, close: { ic:"listck",  c:"cl" }
};
function HubTools(){
  var L = (window.AM_TOOLS||[]);
  if(!L.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">TOOLS</p>'+
      '<h2>사장님 도구</h2>'+
      '<p>창업과 운영, 정리에 필요한 숫자를 직접 재 보세요. '+
        '적으신 숫자는 이 브라우저에만 남습니다.</p></div>'+
    '<ul class="ht-g">'+L.map(function(t){
      var m = HUB_TOOL_IC[t.key] || { ic:"gauge", c:"bl" };
      return '<li class="hv-'+m.c+'"><a href="/tools/'+esc(t.key)+'">'+
        '<span class="ic-t">'+icon(m.ic,26)+'</span>'+
        '<b>'+esc(t.name)+'</b><i>'+esc(t.lead)+'</i></a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* ── ⑪ 후기 (§25) ─────────────────────────────────────────────────
   ⚠️⚠️ **후기를 지어내지 마세요.** 평점도 후기 수도 값으로 들고 있지
   않습니다 — `amProviderStats()` 가 실제 후기 배열에서 계산합니다. */
function HubReviews(){
  /* ⚠️ 전역 후기 배열은 없습니다 — 후기는 **업체 안**에 들어 있고
     (`p.reviews`), 평점도 거기서 계산합니다. 여기서도 그대로 모읍니다.
     숫자로 들고 있지 않으니 손으로 적어 넣을 자리가 없습니다. */
  var rv = [];
  (window.AM_PROVIDERS||[]).forEach(function(p){
    (p.reviews||[]).forEach(function(r){
      rv.push({ r:r, p:p }); });
  });
  rv.sort(function(a,b){ return String(b.r.at||"").localeCompare(String(a.r.at||"")); });
  var body = rv.length
    ? '<ul class="hr-g">'+rv.slice(0,3).map(function(x){
        return '<li><span class="hr-q">'+icon("chat",20)+'</span>'+
          '<p>'+esc(x.r.text||"")+'</p>'+
          '<i>'+esc(x.p.name||"")+(x.r.at ? ' · '+esc(x.r.at) : '')+'</i></li>';
      }).join("")+'</ul>'
    : Empty({ icon:"star", title:"첫 이용후기가 곧 올라옵니다",
        text:"후기를 지어내지 않습니다. 실제로 연결된 사장님이 쓰신 것만 "+
             "올리고, 평점은 그 후기에서 계산합니다 — 손으로 적는 자리가 없습니다.",
        cta:'<a class="btn btn-nv" href="/quote">견적 요청하기'+icon("arrow",18)+'</a>' });
  return HubBand({ bg:"sec-ivory", kicker:"REVIEWS",
    h:"실제 사장님들의 경험", mid:true, body:body });
}

/* ── ⑫ 업체 입점 (§26 · §37) ──────────────────────────────────────
   ⚠️ 여기 하나만 어두운 면입니다. 푸터와 붙어 있지 않게 위에 밝은
   구간(후기)이 옵니다 (§31 — 어두운 구간 연속 금지).
   ⚠️ **성과를 지어내지 마세요.** "월 n건" 은 지금 0 입니다. 낼 수 있는
   것은 지금 사실인 것과 지키겠다는 약속까지입니다. */
function HubJoin(){
  var cats = (window.AM_CATS||[]).filter(function(c){ return c.kind === "provider"; });
  return '<section class="sec hjn"><div class="w">'+
    '<div class="hjn-c">'+
      '<div class="hjn-t">'+
        '<p class="hjn-k">PARTNER</p>'+
        '<h2>사장님을 찾는 업체인가요?</h2>'+
        '<p>실제로 창업 · 폐업을 준비하시는 분들을 만나 보세요. '+
          '기본 입점은 무료이고, 지금은 초기 파트너를 모집하고 있습니다.</p>'+
        (cats.length ? '<ul class="hjn-l">'+cats.slice(0,10).map(function(c){
          return '<li>'+icon(c.icon,18)+esc(c.name)+'</li>'; }).join("")+'</ul>' : '')+
      '</div>'+
      '<p class="hjn-go"><a class="btn btn-w" href="/join">'+
        '무료로 입점하기'+icon("arrow",18)+'</a></p>'+
    '</div>'+
  '</div></section>';
}

function PageHub(){
  return HubHero()+ HubTwo()+ HubIndustry()+ HubServices()+
         HubProviders()+ HubFranchise()+ HubStores()+ HubPrice()+
         HubBridge()+ HubTools()+ HubReviews()+ HubJoin();
}

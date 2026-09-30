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
var LSTART = [
  { n:"프랜차이즈",  ic:"bulb",      to:"/franchise",        t:"franchise" },
  { n:"점포 · 상권", ic:"map",       to:"/c/area",           t:"estate" },
  { n:"인테리어",    ic:"hammer",    to:"/providers/interior", t:"interior" },
  { n:"장비 · 가구", ic:"sofa",      to:"/providers/furniture", t:"furniture" },
  { n:"POS · IT",   ic:"monitor",   to:"/providers/it",      t:"pos" },
  { n:"세무 · 노무", ic:"shield",    to:"/providers/admin",   t:"tax" },
  { n:"마케팅",      ic:"megaphone", to:"/providers/marketing", t:"mkt" },
  { n:"기타 서비스", ic:"layers",    to:"/startup",           t:"etc" }
];
var LCLOSE = [
  { n:"매장 양도",      ic:"key",     to:"/stores",             t:"estate" },
  { n:"시설 · 집기 처분", ic:"box",   to:"/assets",             t:"equip" },
  { n:"재고 처리",      ic:"cart",    to:"/assets",            t:"food" },
  { n:"철거 · 원상복구", ic:"hammer", to:"/providers/demolish", t:"demolish" },
  { n:"세무 · 노무",    ic:"doc",     to:"/providers/tax",      t:"tax" },
  { n:"폐업 지원",      ic:"badge",   to:"/support",            t:"pos" },
  { n:"법률 · 행정",    ic:"scale",   to:"/providers/law",      t:"etc" },
  { n:"청소 · 방역",    ic:"broom",   to:"/providers/clean",    t:"clean" }
];

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
        '<span class="lsd-i lt-'+esc(x.t)+'">'+icon(x.ic,22)+'</span>'+
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
var HUB = [
  { to:"/providers", ic:"users",  t:"업체찾기",
    d:"분야와 지역으로 찾고, 한 번에 견적을 받습니다.", n:function(){
      return (window.AM_PROVIDERS||[]).length; }, unit:"곳" },
  { to:"/franchise", ic:"store",  t:"프랜차이즈",
    d:"정보공개서에 있는 값만 보여 드립니다.", n:function(){
      return (window.AM_FRANCHISES||[]).length; }, unit:"개" },
  { to:"/stores",    ic:"key",    t:"점포 · 매장 양도",
    d:"자리를 찾거나, 쓰던 가게를 넘깁니다.", n:function(){
      return (window.AM_STORES||[]).length; }, unit:"건" },
  { to:"/assets",    ic:"box",    t:"시설 · 집기 · 재고",
    d:"쓰던 장비를 넘기고, 중고로 갖춥니다.", n:function(){
      return (window.AM_ASSETS||[]).length; }, unit:"건" },
  { to:"/support",   ic:"badge",  t:"자금 · 정부지원",
    d:"어디를 봐야 하는지부터 모아 두었습니다." },
  { to:"/content",   ic:"book",   t:"창업 · 폐업 정보",
    d:"검색해도 답이 잘 안 나오는 것만 씁니다.", n:function(){
      return (window.AM_CONTENTS||[]).length; }, unit:"편" },
  { to:"/tools",     ic:"gauge",  t:"사장님 도구",
    d:"창업비 · 고정비 · 손익분기를 직접 재 봅니다." },
  { to:"/my",        ic:"user",   t:"내 기록",
    d:"적어 두신 조건과 받은 제안을 이 기기에 모읍니다." }
];

function PageHub(){
  return PgHero({
    kicker:"서비스",
    h1raw:"무엇부터 하시겠습니까?",
    lead:"창업이든 정리든, 필요한 것을 한곳에서 찾고 비교하고 견적받으실 수 있습니다.",
    tight:true
  })+
  /* 두 갈래 — 이 플랫폼이 하는 일은 결국 이 둘입니다 */
  '<section class="sec sec-white"><div class="w">'+
    '<div class="hb-two">'+
      '<a class="hb-b hb-b-st" href="/startup">'+
        '<span class="hb-b-k">START</span>'+
        '<b>창업</b>'+
        '<i>새로운 사업을 시작합니다.</i>'+
        '<span class="hb-b-go">'+icon("arrow",20)+'</span></a>'+
      '<a class="hb-b hb-b-cl" href="/closure">'+
        '<span class="hb-b-k">CLOSE</span>'+
        '<b>폐업</b>'+
        '<i>사업을 정리합니다.</i>'+
        '<span class="hb-b-go">'+icon("arrow",20)+'</span></a>'+
    '</div>'+
  '</div></section>'+
  /* 나머지 기능 — ⚠️ 개수는 전부 세는 값입니다 */
  '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">모아 보기</p>'+
      '<h2>이런 것도 여기 있습니다</h2></div>'+
    '<ul class="hb-g">'+HUB.map(function(h){
      var n = h.n ? h.n() : null;
      return '<li><a href="'+esc(h.to)+'">'+
        '<span class="hb-i">'+icon(h.ic,22)+'</span>'+
        '<span class="hb-t"><b>'+esc(h.t)+'</b>'+
          (n === null ? '' : '<em>'+n+esc(h.unit)+'</em>')+'</span>'+
        '<i>'+esc(h.d)+'</i></a></li>'; }).join("")+'</ul>'+
  '</div></section>'+
  /* 업체 입점 — ⚠️ 랜딩에서 뺐으므로 **여기가 본자리**입니다 */
  '<section class="sec sec-white"><div class="w">'+
    '<div class="hb-jn">'+
      '<div class="hb-jn-t">'+
        '<p class="hb-jn-k">PARTNER</p>'+
        '<h2>이 분야 업체시라면</h2>'+
        '<p>지금 등록된 업체는 '+(window.AM_PROVIDERS||[]).length+'곳입니다. '+
          '숨기지 않고 그대로 적습니다 — 그래서 지금 들어오시면 첫 번째입니다.</p>'+
      '</div>'+
      '<a class="btn btn-w" href="/join">업체 입점하기'+icon("arrow",18)+'</a>'+
    '</div>'+
  '</div></section>';
}

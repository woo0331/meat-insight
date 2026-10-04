/* ════════════════════════════════════════════════════════════════════
   메인(`/`) — 접속하는 순간 **바로 쓰는 화면**입니다

   > **2026-10-01 사장님 지시 — "랜딩페이지 완전 제거."**
   > 전에는 `/` 가 브랜드 소개 랜딩이고 "플랫폼 시작하기" 를 눌러야
   > `/home` 서비스 메인으로 갔습니다. 그 중간 화면을 **없앴습니다.**
   > 주소를 치면 곧바로 이 화면입니다.

   ⚠️⚠️ **중간 소개 화면(Intro · Splash · Gateway)을 다시 만들지
   마세요.** 로고를 누르거나 `/` 로 오면 **언제나 이 화면**입니다.
   `/home` 은 `vercel.json` 이 308 로 `/` 에 보냅니다 — 옛 주소를
   눌러도 안 깨지라고 남겨 둔 것이지 화면이 아닙니다.

   ⚠️ **랜딩을 지우면서 좋은 것은 가져왔습니다** (지시서 §2) —
   강한 히어로 · START 초록 / CLOSE 주황 · "한 사장님의 끝이 다른
   사장님의 시작" · 큰 글씨 · 넉넉한 여백. 지운 것은 **화면 하나**이지
   그 안의 생각이 아닙니다.

   구간 차례 (지시서 §21 · §24) — `check.js` 가 이 차례를 셉니다.

     ① 히어로        .mh     크림   — 검색 · START/CLOSE · 오른쪽 비주얼
     ② 범위 숫자     .mst    크림   — 히어로에 붙는 얇은 띠
     ③ START/CLOSE   .ms-two 흰색
     ④ 업종 열넷     .mi-g   옅은 회색
     ⑤ 핵심 서비스   .mv-g   흰색
     ⑥ 업체          PARTNERS  아이보리
     ⑦ 프랜차이즈    FRANCHISE 흰색
     ⑧ 매장 인수     TAKE OVER 민트
     ⑨ 가격          PRICE     하늘
     ⑩ 창업↔폐업     .mbr    크림
     ⑪ 사장님 도구   .mt-g   흰색
     ⑫ 후기          REVIEWS 아이보리
     ⑬ 업체 입점     .mjn    흰 구간 위 남색 카드

   ⚠️⚠️ **업체 · 브랜드 · 매물 · 가격 · 후기가 전부 0 입니다.** 카드를
   지어내지 않고 `Empty()` 로 **지금 실제로 되는 것**을 같이 냅니다
   (절대 규칙 1). 열세 구간 중 다섯이 지금 빈 상태인데 **그게 맞습니다.**

   ⚠️ **"준비중 · 모집중" 을 첫 화면에 올리지 마세요** (지시서 §12).
   처음 오신 분이 "아직 준비 중인 플랫폼" 으로 읽습니다. 0 을 말하는
   자리는 각 구간 안(`Empty()`)과 맨 아래 입점 구간입니다.

   ⚠️ 아이콘은 `icon()` 하나만 씁니다 — 24 viewBox · 선 1.8 · round.
   섞어 쓰면 한 화면에서 아이콘이 따로 놉니다 (§27).
   ════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════
   ① 히어로 (지시서 §4 ~ §10)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **어두운 전면 배경을 쓰지 마세요.** 바탕은 크림
   (`--bg-cream` #FCFAF6)입니다. 임팩트는 어둡게 해서 내는 것이
   아니라 **큰 글씨 · 큰 검색창 · 초록/주황 악센트 · 넓은 여백**으로
   냅니다 (§25). 어두운 면이 15% 를 넘으면 전수 점검이 잡습니다.

   ⚠️ **데스크톱에서 글만 가운데 두지 않습니다** (§9). 왼쪽은 글과
   행동(검색 · START/CLOSE), 오른쪽은 비주얼입니다 — 55:45.

   ⚠️ 폰 차례는 §30 입니다 — 제목 → 설명 → 검색 → START/CLOSE →
   비주얼. DOM 이 그 차례라 좁아지면 저절로 그렇게 쌓입니다.
   **오른쪽 비주얼을 DOM 앞으로 옮기지 마세요.** */

/* ══════════════════════════════════════════════════════════════════
   ① HERO — 창업 / 폐업 두 판 (2026-10-04 개편 지시서 §3 ~ §8)
   ══════════════════════════════════════════════════════════════════
   화면 너비를 쓰는 대형 비주얼 둘이고, 가운데가 **대각선**으로
   갈립니다 (§8 — 수직선만 넣지 않습니다).

   ⚠️⚠️ **사진이 0장입니다.** 레퍼런스는 사진이 주인공인 화면인데
   저희에게는 아직 한 장도 없습니다. 그래서 —
     · 사진이 있으면 → 사진 + gradient overlay (왼쪽 warm · 오른쪽 cool)
     · 사진이 0장이면 → **밝은 톤 면**으로 자리를 지킵니다
   "이미지 준비 중" 같은 자리표시자는 찍지 않습니다 (절대 규칙 2).
   ⚠️⚠️ 사진이 들어오면 **어두운 막이 생깁니다** — 그때 어두운 면 15%
   를 반드시 다시 재세요. 지금은 사진이 없어 잴 수가 없습니다.

   ⚠️⚠️ **두 판의 크기 · 무게가 같아야 합니다** (§3 — 50:50).
   폐업 쪽을 좁히거나 가볍게 만들면 그게 "덜 중요한 것" 이라는 말입니다.
   ⚠️ **폐업을 부정적으로 쓰지 마세요** (§7) — 끝이 아니라 다음 시작. */
function MainHeroPane(o){
  var ph = hasPhoto(o.photo);
  return '<article class="hp2 hp2-'+o.cls+(ph ? "" : " hp2-noph")+'">'+
    (ph ? '<figure class="hp2-ph">'+photoBox(o.photo,"",true)+'</figure>' : '')+
    '<div class="hp2-b">'+
      '<p class="hp2-k">'+esc(o.kicker)+'</p>'+
      '<h2 class="hp2-h">'+esc(o.title)+
        '<em class="hp2-dot" aria-hidden="true"></em></h2>'+
      '<p class="hp2-d">'+o.lead+'</p>'+
      '<p class="hp2-go"><a class="btn btn-lg '+esc(o.btn)+'" href="'+esc(o.to)+'">'+
        esc(o.cta)+icon("arrow",18)+'</a></p>'+
    '</div>'+
  '</article>';
}
function MainHero(){
  return '<section class="mh"><div class="mh-two">'+
    /* ⚠️ 단추 색이 다른 것은 **바탕이 달라서**입니다 — 짙은 남색 위에는
       흰 단추, 밝은 샌드 위에는 짙은 주황 단추라야 글자가 읽힙니다
       (AA 4.5). 크기 · 글씨 · 자리는 둘이 똑같습니다. */
    MainHeroPane({ cls:"st", photo:"hero-start", to:"/startup", btn:"btn-w",
      kicker:"좋은 시작, 든든한 파트너와 함께", title:"창업",
      lead:'사업을 시작하는 데<br> 필요한 모든 것', cta:"창업 서비스 찾기" })+
    MainHeroPane({ cls:"cl", photo:"hero-close", to:"/closure", btn:"btn-cd",
      kicker:"끝까지 책임지는, 새로운 시작을 위해", title:"폐업",
      lead:'사업을 정리하는 데<br> 필요한 모든 것', cta:"폐업 서비스 찾기" })+
  '</div>'+ MainSearch() +'</section>';
}

/* ══════════════════════════════════════════════════════════════════
   ② 떠 있는 검색 패널 (§9 ~ §12)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **장식용 검색창을 만들지 마세요** (§11). 전부 실제로
   동작합니다 — 탭이 **어디서 찾을지**, 지역이 `?r=`, 검색어가 `?q=`.

     검색어가 있으면  →  /search?q=…   (글 · 업체 · 공고를 다 훑습니다)
     검색어가 없으면  →  탭의 화면 (지역을 받는 곳이면 ?r= 를 달아서)

   ⚠️ **"인기 검색어" 라고 쓰지 마세요** (§12 자신이 적어 둔 경고).
   검색 기록을 모으지 않아서 무엇이 인기인지 **우리는 모릅니다** —
   지금 딱지는 **추천 검색어**입니다. 실제 데이터가 쌓이면 바꾸세요. */
/* ⚠️⚠️ `region` 은 **그 화면이 실제로 `?r=` 를 읽는가**입니다 —
   받지 않는 곳에 붙이면 조용히 버려지고, 고르신 분은 걸린 줄 압니다.
   읽는 곳을 직접 찾아 확인했습니다 (`nowQS("r")`) —
   `/providers` · `/franchise` · `/stores` · `/assets` 넷은 읽고,
   `/support` 는 **전국 공고**라 지역 거르개가 없습니다. */
/* ⚠️⚠️ **2026-10-04 구조 개편 §10** — `시설·집기` 가 독립 탭이었는데
   그건 **분류 하나**이지 손님이 "어디서 찾을지" 를 고르는 단위가
   아닙니다. 그 자리를 **매장 양도·양수**가 받았습니다 (브랜드 이름과
   가장 직접 닿는 서비스입니다 — §14).
   ⚠️ `/assets` **주소는 그대로 살아 있습니다.** 탭에서 뺀 것은 UI 노출
   구조뿐이고, 매장 양도·양수 단계 화면과 `/assets` 카드가 그리로
   보냅니다 (§10 "route 자체를 삭제하지 않는다"). */
var MAIN_TABS = [
  { k:"pv", name:"업체 찾기",     ic:"users",    to:"/providers", region:true },
  { k:"fr", name:"프랜차이즈",    ic:"store",    to:"/franchise", region:true },
  { k:"st", name:"상가·점포",     ic:"pin",      to:"/stores",    region:true },
  { k:"tr", name:"매장 양도·양수", ic:"handover", to:"/g/transfer" },
  { k:"sp", name:"창업·폐업 지원", ic:"badge",    to:"/support" }
];
/* ⚠️ 추천 검색어 — **전부 실제로 결과가 나오는 주소**입니다 (가짜 링크
   금지). 분야가 있는 것은 그 분야 화면으로 바로 보냅니다. */
/* ⚠️ 2026-10-04 §12 — **일곱으로 줄였습니다.** 열 개는 칩 줄이
   패널 아래를 한 줄 더 먹고, 그만큼 "무엇부터 누를까" 가 흐려집니다. */
var MAIN_CHIPS = [
  { q:"인테리어",      to:"/providers/interior" },
  { q:"주방설비",      to:"/providers/equip" },
  { q:"상가 임대",     to:"/stores" },
  { q:"세무",          to:"/providers/admin" },
  { q:"POS",           to:"/providers/it" },
  { q:"매장 양도",     to:"/g/transfer" },
  { q:"철거 · 원상복구", to:"/providers/demolish" }
];
function MainSearch(){
  var cur = nowQS("t") || "pv";
  if(!MAIN_TABS.some(function(t){ return t.k === cur; })) cur = "pv";
  var tab = MAIN_TABS.filter(function(t){ return t.k === cur; })[0];
  var regions = (window.AM_REGIONS || []);
  return '<div class="msr"><div class="w"><div class="msr-in">'+
    '<div class="msr-tb">'+MAIN_TABS.map(function(t){
      return '<a class="msr-t'+(t.k===cur?" on":"")+'" href="/?t='+esc(t.k)+'" data-keep'+
        (t.k===cur ? ' aria-current="true"' : '')+'>'+
        icon(t.ic,18)+'<b>'+esc(t.name)+'</b></a>'; }).join("")+'</div>'+
    '<form class="msr-f" role="search" onsubmit="return mainFind(event)">'+
      /* ⚠️⚠️ 지역을 **안 받는 화면(지원정보)에서는 아예 안 냅니다.**
         내 놓고 버리면 고르신 분은 걸린 줄 아는데 실제로는 전국이
         나옵니다 — 하지 않은 일을 했다고 말하는 것입니다 (절대 규칙 5). */
      (tab.region ?
      '<label class="msr-rg">'+
        '<span class="msr-rg-i" aria-hidden="true">'+icon("pin",18)+'</span>'+
        '<select id="msrR" aria-label="지역 선택">'+
          '<option value="">지역 선택</option>'+
          regions.map(function(r){
            return '<option value="'+esc(r.key)+'">'+esc(r.name)+'</option>'; }).join("")+
        '</select>'+
      '</label>' : "")+
      '<span class="msr-q">'+
        '<span class="msr-q-i" aria-hidden="true">'+icon("search",20)+'</span>'+
        '<input type="search" id="msrQ" name="q" autocomplete="off" '+
          'aria-label="업체 · 서비스 검색" placeholder="어떤 업체나 서비스를 찾고 계신가요?">'+
      '</span>'+
      '<button class="btn btn-pt" type="submit">'+icon("search",18)+'검색하기</button>'+
    '</form>'+
    '<p class="msr-ch"><b>추천 검색어</b>'+MAIN_CHIPS.map(function(c){
      return '<a href="'+esc(c.to)+'">'+esc(c.q)+'</a>'; }).join("")+'</p>'+
  '</div></div></div>';
}
window.mainFind = function(e){
  e.preventDefault();
  var q = ((document.getElementById("msrQ")||{}).value || "").trim();
  var r = ((document.getElementById("msrR")||{}).value || "").trim();
  /* 적으신 말이 있으면 통합검색이 제일 많이 훑습니다 (글 · 업체 · 공고) */
  if(q){ go("/search?q=" + encodeURIComponent(q)); return false; }
  var cur = nowQS("t") || "pv";
  var t = MAIN_TABS.filter(function(x){ return x.k === cur; })[0] || MAIN_TABS[0];
  /* 지역은 **받는 화면에만** 붙입니다 — 안 받는 곳에 붙이면 조용히 버려집니다 */
  go(t.to + (r && t.region ? "?r=" + encodeURIComponent(r) : ""));
  return false;
};

/* ══════════════════════════════════════════════════════════════════
   ③ 사업 단계 여섯 (2026-10-04 카테고리 구조 개편 §3 ~ §9)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **전에는 분류 아이콘 열 개를 한 줄로 늘어놓았습니다.** 그걸
   그만둔 까닭은 §0 입니다 — 손님이 "인테리어·시공" 이라는 말을
   모르면 열 칸이 전부 남의 말이고, 앞으로 분류가 늘수록 그 줄은
   **업체 목록 사이트**처럼 보입니다.

   지금은 사장님의 **생애주기 여섯**이고, 왼쪽에서 오른쪽으로 읽으면
   그대로 사업의 흐름입니다 —

       창업 → 자리 → 구축 → 운영 → 인수인계 → 정리

   ⚠️ 여섯은 `js/data/lifecycle.js` **한 곳**에서 옵니다. 이름 ·
   하위 설명 · 아이콘 · 주소를 여기 적지 마세요.
   ⚠️ 카드가 통째로 눌립니다 (§5). 안에 또 링크를 넣지 마세요 —
   `<a>` 안의 `<a>` 는 브라우저가 쪼개 버립니다. */
function MainStage(){
  var L = (window.AM_STAGES || []);
  if(!L.length) return "";
  return '<nav class="mstg" aria-label="사업 단계로 찾기"><div class="w">'+
    '<div class="sec-hd sec-hd-row"><div>'+
      '<h2>어느 단계에 계신가요?</h2>'+
      /* ⚠️ 지시서 §18 의 메시지입니다. 히어로 글과 겹치지 않게
         **한 줄만** 씁니다 — 둘 다 넣으면 화면이 복잡해집니다. */
      '<p>장사의 시작부터 운영, 인수인계와 정리까지.</p></div>'+
    '</div>'+
    '<ul class="mstg-g">'+L.map(function(s){
      return '<li><a href="'+esc(amStageTo(s))+'" class="stg'+tn(s.tone)+'">'+
        '<span class="stg-i">'+icon(s.icon,26)+'</span>'+
        '<span class="stg-b">'+
          '<em class="stg-no">'+esc(s.no)+'</em>'+
          '<b>'+esc(s.name)+'</b>'+
          '<i>'+esc(s.sub)+'</i>'+
        '</span>'+
        '<span class="stg-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
      '</a></li>'; }).join("")+'</ul>'+
  '</div></nav>';
}
/* ══════════════════════════════════════════════════════════════════
   ② 브랜드 가치 (지시서 §7)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **지시서가 직접 금지한 두 문구가 있습니다.**
     · "검증된 업체만"  — 검증 기능이 없습니다
     · "실제 후기 확인" — 후기가 0건입니다
   둘 다 지금 사실이 아니고, 적는 순간 표시광고법 제3조이자 절대
   규칙 5 입니다. 넷 전부 **지금 실제로 되는 것**만 적었습니다. */
var MAIN_VALUE = [
  { ic:"users",   t:"업종별 전문업체",  d:"내 업종에 맞는 업체를 찾으세요." },
  { ic:"doc",     t:"간편한 견적 요청",  d:"한 번의 요청으로 필요한 업체를 비교하세요." },
  { ic:"handover",t:"창업부터 폐업까지", d:"사업의 시작과 정리를 함께합니다." },
  { ic:"compare", t:"한곳에서 비교",    d:"여러 서비스를 한곳에서 찾아보세요." }
];
function MainValue(){
  return '<section class="sec sec-white mval"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow mval-k">대한민국 사장님의 시작과 끝</p>'+
      /* 화면에 **딱 하나뿐인 h1** 입니다 (지시서 §7 의 Headline) */
      '<h1 class="mval-h"><em class="mh-st">창업</em>에 필요한 모든 것. '+
        '<em class="mh-cl">폐업</em>에 필요한 모든 것.</h1>'+
      '<p>사업의 시작부터 정리까지, 사장님에게 필요한 업체와 서비스를 한 곳에서.</p>'+
    '</div>'+
    '<ul class="mval-g">'+MAIN_VALUE.map(function(v){
      return '<li><span class="mval-i">'+icon(v.ic,24)+'</span>'+
        '<span class="mval-t"><b>'+esc(v.t)+'</b><i>'+esc(v.d)+'</i></span></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   ② 범위 숫자 (지시서 §11)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **회원 수 · 거래액 · 업체 수를 넣지 마세요.** 지금 0 이고,
   적으면 표시광고법 제3조 위반입니다. 여기 내는 것은 **우리가 실제로
   다루는 범위**이고, 전부 `AM_INDUSTRIES` · `AM_CATS` 를 **그 자리에서
   세는 값**입니다 — 분류를 하나 늘리면 숫자도 같이 늡니다.

   ⚠️ **"이 숫자는 분야의 수입니다" 줄을 지우지 마세요.** 숫자만 크게
   띄우면 "업체가 183곳" 으로 읽힙니다. 폰에서 숨기지도 마세요.
   ⚠️ `n+` 꼴로 쓰지 마세요 — 센 값은 그냥 183 입니다. */
function MainScale(){
  var ind = (window.AM_INDUSTRIES||[]).length;
  var cat = (window.AM_CATS||[]).length;
  var sub = (window.AM_CATS||[]).reduce(function(n,c){
    return n + ((c.items||[]).length); }, 0);
  if(!ind || !cat || !sub) return "";   /* 데이터가 비면 띠째 뺍니다 */
  /* ⚠️ 시안(AFTER)의 짜임새 — 큰 숫자 + 영문 머리말 + 한글 이름.
     ⚠️ 영문은 **장식**입니다. 한글 이름을 지우지 마세요 — 손님이
     40~60대 사장님입니다. */
  var rows = [
    { n:ind, k:"BUSINESS TYPES",    u:"업종" },
    { n:cat, k:"SPECIALIZED FIELDS", u:"분야" },
    { n:sub, k:"SERVICES",          u:"서비스" }
  ];
  /* ⚠️⚠️ **전에는 히어로 안에 붙은 띠였습니다.** 따로 떼면 바탕이 둘 다
     크림이라 "이웃한 두 구간이 붙어 보임" 이 ΔE 0.00 으로 잡혔었습니다 —
     그래서 이번에는 **흰 구간**으로 떼어 냅니다 (크림 ↔ 흰 ΔE 2.53).
     지시서 §3 이 숫자를 독립 Section 으로 두라고 합니다.
     ⚠️ 숫자를 키우되 **"분야의 수" 줄은 그대로** 둡니다 (§9) — 숫자만
     크게 띄우면 "업체가 183곳" 으로 읽힙니다. */
  return '<section class="sec sec-white mnum"><div class="w">'+
    '<div class="mst-box">'+
      '<ul class="mst-g">'+rows.map(function(r){
        return '<li><b>'+r.n+'</b>'+
          '<span class="mst-k">'+esc(r.k)+'</span>'+
          '<i>'+esc(r.u)+'</i></li>'; }).join("")+'</ul>'+
      /* ⚠️⚠️ **이 줄을 지우지 마세요.** 숫자만 크게 띄우면 "업체가
         183곳" 으로 읽힙니다. 시안도 ⓘ 로 같은 자리에 두었습니다 —
         폰에서도 숨기지 않습니다. */
      '<p class="mst-n">'+icon("info",16)+
        '<span>서비스 <b>분류 기준</b>이며 등록된 업체 수가 아닙니다.</span></p>'+
    '</div>'+
  '</div></section>';
}

/* ⚠️⚠️ **여기 있던 "START / CLOSE 큰 카드"(`.ms-two`)를 지웠습니다**
   (2026-10-03 리뉴얼 지시서 §3). 히어로가 바로 그 두 장이 됐기
   때문입니다 — 같은 것을 한 화면에서 두 번 내면 §21("메인에서 모든
   기능을 볼 필요는 없다")에 어긋나고, 스크롤만 한 화면 더 깁니다.

   ⚠️ CLAUDE.md 가 "`.ms-two` 를 지우지 마세요" 라고 적어 둔 까닭은
   **두 가지 길이 같이 있어야 한다**는 것이었습니다 — 찾는 것을 이미
   아는 분은 START/CLOSE 로 바로, 업종만 아는 분은 업종 → 서비스로.
   그 길은 **없어지지 않았습니다.** 히어로의 두 카드와 각 카드의
   빠른 진입 여섯이 그대로 그 길입니다.

   ⚠️⚠️ **`MAIN_START6` · `MAIN_CLOSE6` · `mainSix()` 를 여기에 다시
   선언하지 마세요.** 위 히어로가 같은 이름으로 들고 있어서, 아래에
   또 적으면 **나중 것이 이깁니다** — 에러도 안 나고 화면도 멀쩡한데
   히어로의 여섯만 조용히 바뀝니다. 실제로 지울 때 그 상태였습니다. */

/* ══════════════════════════════════════════════════════════════════
   ④ 업종 고르기 (지시서 §17 ~ §19)
   ══════════════════════════════════════════════════════════════════
   ⚠️ 업종 카드는 장식이 아닙니다 — 누르면 그 업종 창업 화면으로 가고,
   거기서 그 업종에 맞는 분류 · 장비 · 글이 나옵니다.
   ⚠️ **카드 전체를 업종 색으로 칠하지 마세요.** 카드는 흰색이고 색은
   아이콘 타일에만 들어갑니다 (§19). 색은 `industries.js` 의 `tone`
   한 줄이라 여기서 손으로 적을 자리가 없습니다.
   ⚠️ 바탕이 옅은 회색인 이유 — 앞 구간(START/CLOSE)이 흰색입니다.
   둘 다 흰색이면 **두 구간이 한 구간으로 읽힙니다.** */
function MainIndustry(){
  var L = (window.AM_INDUSTRIES||[]);
  if(!L.length) return "";
  var cur  = nowQS("i");
  var side = (nowQS("side") === "close") ? "close" : "start";
  /* 고른 업종은 주소(`?i=`)에 실립니다 — 뒤로 가기 · 새로고침 · 링크
     공유에 살아남고, canonical 은 `nowPath()` 라 질의문자가 빠져서
     같은 내용이 두 주소로 나가지 않습니다. */
  var to = function(k){
    var q = [];
    if(k) q.push("i=" + encodeURIComponent(k));
    if(side === "close") q.push("side=close");
    return "/" + (q.length ? "?" + q.join("&") : "");
  };
  return '<section class="sec sec-gray"><div class="w">'+
    '<div class="sec-hd sec-hd-row"><div>'+
      '<h2>어떤 사업을 준비하고 계세요?</h2>'+
      '<p>업종을 선택하면 필요한 서비스와 업체를 보여드립니다.</p></div>'+
      '<a class="sec-hd-all" href="/startup">전체 업종보기'+icon("arrow",16)+'</a>'+
    '</div>'+
    '<ul class="mi-g">'+L.map(function(x){
      var on = (x.key === cur);
      /* ⚠️ `data-keep` — 업종을 고르면 바로 아래 구간이 바뀌는데, 맨
         위로 올라가 버리면 **무엇이 바뀌었는지 못 봅니다.** */
      return '<li class="tn-'+esc(x.tone||"t7")+(on?" on":"")+'">'+
        '<a href="'+esc(to(on ? "" : x.key))+'" data-keep'+
          (on ? ' aria-current="true"' : '')+'>'+
          '<span class="ic-t">'+icon(x.icon,26)+'</span>'+
          '<b>'+esc(x.name)+'</b>'+
          /* ⚠️⚠️ **설명을 붙이지 마세요** (2026-10-03 리뉴얼 지시서 §8 —
             "각 업종은 Icon, 업종명 만 보여준다"). 하루 전에는 여기에
             `lead`("헤어샵 · 바버샵 · 두피관리")를 내고 있었는데,
             리뉴얼로 이 줄의 **역할이 바뀌었습니다** — 고르는 카드가
             아니라 **거르개**이고, 고른 결과는 바로 아래 구간이
             냅니다 (§9). 거르개 열넷에 설명이 붙으면 한 줄로 안
             깔리고 그 아래 결과가 화면 밖으로 밀려납니다.
             ⚠️ `lead` 는 안 죽었습니다 — `/startup` 의 `.ind-l` 과
             업종 화면 머리말이 그대로 씁니다. */

          (on ? '<span class="mi-x" aria-hidden="true">'+icon("check",14)+'</span>' : '')+
        '</a></li>'; }).join("")+'</ul>'+
    (cur ? '<p class="row-cta row-mid"><a class="btn btn-o" href="'+esc(to(""))+'" data-keep>'+
      '업종 선택 해제</a></p>' : '')+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   ⑤ 고른 업종에 필요한 **모든 것** (지시서 §13 ~ §18)
   ══════════════════════════════════════════════════════════════════
   이번 작업의 핵심입니다. "카페를 하고 싶은데 뭐가 필요한지 모르겠다"
   는 분이 **업종 하나만 고르면** 필요한 것이 차례대로 펼쳐지는 자리.

   ⚠️⚠️ **업종별 목록을 코드에 적지 마세요** (§14). "카페면 커피머신 ·
   원두 · POS" 를 손으로 적으면 업종이 늘 때마다 거기를 고쳐야 하고,
   `catalog.js` 와 어긋나면 **그 분류가 조용히 빠집니다.** 차례는
   `amCatsFor(업종, 쪽)` 가, 하위 항목은 `amCatItems(분류, 업종)` 가
   정합니다 — 이 저장소에서 업종이 갈리는 곳은 그 둘뿐입니다.
   ⚠️ 업종을 안 고르셔도 **비지 않습니다** — 그 쪽 분류 전부가 나옵니다.
   ⚠️ 토글은 기존 START/CLOSE 구조 그대로입니다 (§17). 새 개념이
   아니라 **보는 각도**만 바꾸는 것입니다. */
function MainFit(){
  var side = (nowQS("side") === "close") ? "close" : "start";
  var key  = nowQS("i");
  var ind  = key && window.amIndustry ? amIndustry(key) : null;
  if(key && !ind) key = "";          /* 없는 업종 key 는 없는 셈 칩니다 */
  var cats = (window.amCatsFor ? amCatsFor(key || null, side) : []);
  if(!cats.length) return "";

  var tab = function(sd, label){
    var q = [];
    if(key) q.push("i=" + encodeURIComponent(key));
    if(sd === "close") q.push("side=close");
    return '<a class="mfit-t'+(side===sd?" on":"")+'" href="/'+
      (q.length ? "?" + q.join("&") : "")+'" data-keep'+
      (side===sd ? ' aria-current="true"' : '')+'>'+esc(label)+'</a>';
  };
  var who = ind ? ind.name : "";
  var h2  = who
    ? esc(who) + (side==="close" ? " 정리에" : " 창업에") + " 필요한 모든 것"
    : (side==="close" ? "사업을 정리할 때 필요한 모든 것" : "창업할 때 필요한 모든 것");

  return '<section class="sec sec-white"><div class="w">'+
    /* ⚠️ 머리말에 업종 이름을 또 적지 않습니다 — 바로 아래 h2 가 이미
       "카페 · 디저트 창업에 필요한 모든 것" 입니다. 여기는 **지금 어느
       쪽을 보고 있는지**를 냅니다. */
    '<div class="sec-hd sec-hd-row"><div>'+
      '<p class="eyebrow">'+
        (side==="close" ? "CLOSE · 사업 정리" : "START · 창업 준비")+'</p>'+
      '<h2>'+h2+'</h2>'+
      '<p>'+(who
        ? '이 업종에서 자주 쓰이는 차례로 냅니다.'
        : '업종을 고르시면 그 업종의 차례로 다시 정렬됩니다.')+'</p></div>'+
      /* 시안의 "전체보기 >" — 분야를 끝까지 보는 진짜 화면으로 보냅니다 */
      '<a class="sec-hd-all" href="'+(side==="close" ? "/closure" : "/startup")+
        (key ? "/"+esc(key) : "")+'">전체보기'+icon("arrow",16)+'</a>'+
    '</div>'+
    '<div class="mfit-tb" role="tablist" aria-label="창업 · 정리">'+
      tab("start","창업 준비")+tab("close","사업 정리")+'</div>'+
    /* ⚠️⚠️ **큰 카드(`CatCard`)를 쓰지 않습니다.** 시안(AFTER)의 이
       자리는 작은 카드가 한눈에 깔리는 짜임새이고, 큰 카드로 열셋을
       내면 1440px 에서 **1,801px**(화면 두 개)이 됩니다 — 재 봤습니다.
       분류 화면(`/c/:cat`)은 큰 카드 그대로입니다.
       ⚠️ 시안의 "23개 · 18개" 는 **업체 수**인데 지금 0곳이라 그대로
       쓰면 지어낸 숫자입니다 (절대 규칙 1). 대신 **하위 서비스 이름
       셋**을 냅니다 — 세는 값이고, 카페면 "커피머신 · 그라인더 ·
       제빙기" 로 그 업종 것이 바로 보입니다. */
    '<ul class="fit-g">'+cats.map(function(c){
      return '<li>'+FitCard(c, key || "")+'</li>'; }).join("")+'</ul>'+
    '<p class="note note-mid">'+cats.length+'개 분야 전부입니다. '+
      '숫자는 분야 안의 <b>세부 서비스 수</b>이고 등록된 업체 수가 아닙니다.</p>'+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   ⑥ 큰 카드 셋 — 프랜차이즈 · 점포 · 인테리어 (지시서 §10 · §11)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **제목에 "검증된 · 추천" 을 적지 마세요.** 지시서 §10 이
   "실제 브랜드 데이터가 쌓인 후" 에만 "추천 프랜차이즈" 를 쓰라고
   적었습니다. 지금 브랜드가 0개라 **검토할 프랜차이즈 브랜드**
   입니다 — 세는 값을 보고 저절로 바뀝니다. 손으로 고치지 마세요.

   ⚠️ 사진은 카드마다 **다른 자리**입니다 (`feat-*`). 0장이면 액자째
   빠지고 카드가 글 중심 짜임새로 갑니다 — "이미지 준비 중" 같은
   자리표시자를 찍지 않습니다 (§11 · 절대 규칙 2).
   ⚠️ 카드 글자는 전부 HTML 입니다. **사진 안에 글자를 합성하지
   마세요** (§6 · §11). */
function MainFeature(){
  var nFr = (window.AM_FRANCHISES||[]).length;
  var L = [
    { k:"franchise", ic:"store", ph:"feat-franchise", kicker:"FRANCHISE", to:"/franchise",
      h: nFr ? "추천 프랜차이즈<br> 브랜드" : "검토할 프랜차이즈<br> 브랜드",
      d:"창업비 · 가맹비는 정보공개서에 적힌 값만 올립니다.",
      cta:"프랜차이즈 보기" },
    { k:"store", ic:"pin", ph:"feat-store", kicker:"STORE", to:"/stores",
      h:"좋은 점포가<br> 좋은 시작을 만듭니다.",
      d:"전국의 상가, 점포, 권리금 매장까지<br class="+'"br-m"'+"> 원하는 조건의 매장을 찾아보세요.",
      cta:"점포/매장 찾기" },
    { k:"interior", ic:"roller", ph:"feat-interior", kicker:"INTERIOR", to:"/providers/interior",
      h:"공간이<br> 장사의 시작입니다.",
      d:"업종별 맞춤 인테리어 업체를<br class="+'"br-m"'+"> 비교하고 견적을 받아보세요.",
      cta:"인테리어 업체 보기" }
  ];
  return '<section class="sec sec-white mfeat"><div class="w">'+
    '<div class="mfeat-g">'+L.map(function(x){
      var ph = hasPhoto(x.ph);
      return '<a class="mfeat-c mfeat-'+esc(x.k)+(ph ? "" : " mfeat-noph")+
        '" href="'+esc(x.to)+'">'+
        (ph ? '<figure class="mfeat-ph">'+photoBox(x.ph,"",true)+'</figure>'
            /* ⚠️ 사진이 0장일 때만 — "이미지 준비 중" 을 찍는 대신
               분류 아이콘을 아주 옅게 깔아 카드가 비지 않게 합니다 */
            : '<span class="mfeat-ic" aria-hidden="true">'+icon(x.ic,150)+'</span>')+
        '<span class="mfeat-b">'+
          '<em class="mfeat-k">'+esc(x.kicker)+'</em>'+
          '<b class="mfeat-h">'+x.h+'</b>'+
          '<i class="mfeat-d">'+x.d+'</i>'+
          '<span class="mfeat-go">'+esc(x.cta)+icon("arrow",16)+'</span>'+
        '</span>'+
      '</a>'; }).join("")+'</div>'+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   ⑦ 주요 서비스 여덟 (지시서 §12 · §13)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **"지금 많이 찾는 서비스" 라고 쓰지 마세요** (지시서 §12).
   이용 데이터를 모으지 않아서 무엇을 많이 찾는지 **우리는 모릅니다** —
   적는 순간 절대 규칙 5 입니다. 지금 낼 수 있는 말은 **"사장님에게
   필요한 서비스"** 까지입니다. 실제 데이터가 쌓이면 그때 바꾸세요.

   ⚠️ 이름 · 아이콘 · 링크는 전부 `catalog.js` 에서 옵니다 — 여기에
   적는 것은 **어느 분류를 앞에 낼지**와 한 줄 설명뿐입니다.
   ⚠️ 설명을 길게 넣지 마세요 (§13 — "너무 많은 Text를 넣지 않는다"). */
var MAIN_SVC = [
  { k:"interior",  d:"공간의 가치를 높이는 전문 시공업체" },
  { k:"equip",     d:"업종별 필수 장비를 한곳에서" },
  { k:"furniture", d:"업소용 가구부터 맞춤 제작까지" },
  { k:"it",        d:"스마트한 매장 운영의 시작" },
  { k:"admin",     d:"사업자등록부터 각종 인허가까지" },
  { k:"marketing", d:"브랜드를 성장시키는 전문가들" },
  { k:"demolish",  d:"안전하고 빠른 철거 · 원상복구" },
  { k:"transfer",  d:"좋은 매장을 다음 사장님에게" }
];
function MainServices(){
  var by = {}; (window.AM_CATS||[]).forEach(function(c){ by[c.key] = c; });
  var items = MAIN_SVC.map(function(x){
    var c = by[x.k];
    return c ? { c:c, d:x.d, ph:"svc-"+x.k } : null;
  }).filter(Boolean);
  if(!items.length) return "";
  return '<section class="sec sec-gray msvc"><div class="w">'+
    '<div class="sec-hd sec-hd-row"><div>'+
      '<h2>사장님에게 필요한 서비스</h2>'+
      '<p>가장 많이 쓰이는 분야부터 모았습니다.</p></div>'+
      '<a class="sec-hd-all" href="/providers">전체 서비스 보기'+icon("arrow",16)+'</a>'+
    '</div>'+
    '<ul class="msvc-g">'+items.map(function(x){
      var ph = hasPhoto(x.ph);
      /* ⚠️ 색은 `catalog.js` 의 `tone` 한 줄입니다 — 여기에 손으로
         적지 마세요. 사진이 들어오면 사진이 그 자리를 덮습니다. */
      return '<li class="tn-'+esc(x.c.tone||"t7")+'"><a href="'+esc(catTo(x.c))+'">'+
        '<span class="msvc-ph'+(ph ? "" : " msvc-ph-n")+'">'+
          (ph ? photoBox(x.ph,"",true) : icon(x.c.icon,44))+'</span>'+
        '<b>'+esc(x.c.name)+'</b><i>'+esc(x.d)+'</i></a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* ── 구간 한 벌 — 데이터가 있으면 카드, 없으면 Empty ──────────────
   ⚠️⚠️ **카드를 지어내지 마세요** (절대 규칙 1). 업체 0곳인데 여섯
   장을 채워 두면 그 순간 없는 회사를 광고하는 것이고 표시광고법
   제3조 위반입니다. 0 이면 0 이라고 말하고, 대신 **지금 실제로 되는
   것**을 같이 냅니다. */
function MainBand(o){
  return '<section class="sec '+esc(o.bg||"")+'"><div class="w">'+
    '<div class="sec-hd'+(o.mid?" sec-hd-c":"")+'">'+
      (o.kicker ? '<p class="eyebrow">'+esc(o.kicker)+'</p>' : '')+
      '<h2>'+o.h+'</h2>'+
      (o.lead ? '<p>'+esc(o.lead)+'</p>' : '')+'</div>'+
    o.body+
  '</div></section>';
}

/* ── ⑥ 사장님들이 찾는 업체 ─────────────────────────────────────── */
function MainProviders(){
  var n = (window.AM_PROVIDERS||[]).length;
  var body = n
    ? '<div class="pv-g">'+(window.AM_PROVIDERS||[]).slice(0,6).map(function(p){
        return ProviderCard(p); }).join("")+'</div>'+
        /* ⚠️⚠️ **차례를 밝힙니다** — 약관 제6조 제4항이 "광고 순서의
           기준을 밝힌다" 고 적어 두었고, `join.js` 의 약속도 "추천 ·
           상단노출 같은 광고 상품이 생기면 광고라고 표시한다" 입니다.
           지금은 그런 상품이 없어서 등록된 차례 그대로입니다 — 업체가
           늘어난 뒤에도 이 줄과 실제가 같아야 합니다.
           ⚠️ `featured` · `추천` 칸을 만들지 마세요. 만드는 순간 이
           줄이 거짓이 되고, 표시 없는 상단노출은 표시광고법 문제입니다. */
        '<p class="note note-mid">등록된 차례로 냅니다. 광고로 위에 올린 자리는 없습니다.</p>'+
      '<p class="row-cta row-mid"><a class="btn btn-nv" href="/providers">'+
        '업체 전체 보기'+icon("arrow",18)+'</a></p>'
    : Empty({ sm:true, icon:"users", title:"아직 등록된 업체가 없습니다",
        text:"업체를 지어내지 않습니다. 지금은 모으는 중이고, 등록되는 대로 "+
             "분야 · 지역으로 찾으실 수 있습니다. 먼저 조건을 남겨 두시면 "+
             "업체가 들어올 때 그 조건으로 전달합니다.",
        cta:'<a class="btn btn-nv" href="/quote">조건 남기고 견적 요청'+icon("arrow",18)+'</a>'+
            '<a class="btn btn-o" href="/join">업체로 입점하기</a>' });
  return MainBand({ bg:"sec-ivory", kicker:"PARTNERS", h:"사장님들이 찾는 업체",
    lead:"업종과 지역에 맞는 전문업체를 비교해 보세요.", body:body });
}

/* ── ⑦ 프랜차이즈 ─────────────────────────────────────────────────
   ⚠️ 창업비는 **정보공개서에 있는 값**이어야 합니다 (가맹사업법).
   `source` 와 `asOf` 가 없는 금액은 화면에 안 나옵니다. */
function MainFranchise(){
  var n = (window.AM_FRANCHISES||[]).length;
  var body = n
    ? '<div class="fr-g">'+(window.AM_FRANCHISES||[]).slice(0,6).map(function(f){
        return FranchiseCard(f); }).join("")+'</div>'+
      '<p class="row-cta row-mid"><a class="btn btn-nv" href="/franchise">'+
        '브랜드 전체 보기'+icon("arrow",18)+'</a></p>'
    : Empty({ sm:true, icon:"store", title:"아직 등록된 브랜드가 없습니다",
        text:"창업비는 정보공개서에 적힌 값만 올립니다. 근거 없는 금액을 "+
             "보시고 수천만 원을 빌리러 가시면 안 되기 때문입니다. "+
             "확인한 브랜드부터 하나씩 올립니다.",
        cta:'<a class="btn btn-nv" href="/startup">창업 준비부터 보기'+icon("arrow",18)+'</a>' });
  return MainBand({ bg:"sec-white", kicker:"FRANCHISE",
    h:"어떤 장사를 시작할지 고민이라면",
    lead:"예산과 조건에 맞는 프랜차이즈를 찾아보세요.", body:body });
}

/* ── ⑧ 바로 시작할 수 있는 매장 ───────────────────────────────────
   ⚠️ 평수 · 보증금 · 월세 · 권리금은 **올리신 사장님이 적은 값**이고
   우리가 확인하거나 보증하는 값이 아닙니다 — 카드가 그렇게 밝힙니다. */
function MainStores(){
  var L = (window.AM_STORES||[]);
  var body = L.length
    ? '<div class="mk-g">'+L.slice(0,6).map(function(s){ return StoreCard(s); }).join("")+'</div>'+
      '<p class="row-cta row-mid"><a class="btn btn-nv" href="/stores">'+
        '매장 전체 보기'+icon("arrow",18)+'</a></p>'
    : Empty({ sm:true, icon:"pin", title:"아직 올라온 매장이 없습니다",
        text:"허위매물을 만들지 않습니다. 보고 연락하신 시간을 훔치는 일이라서요. "+
             "정리하시는 사장님이 올리시면 그대로 보입니다.",
        cta:'<a class="btn btn-st" href="/stores">매장 내놓기'+icon("arrow",18)+'</a>'+
            '<a class="btn btn-o" href="/closure">폐업 준비부터 보기</a>' });
  return MainBand({ bg:"sec-start", kicker:"TAKE OVER",
    h:"새로 만들지 않아도 됩니다",
    lead:"이미 준비된 매장에서 더 빨리 시작하실 수 있습니다.", body:body });
}

/* ── ⑨ 가격 · 견적 데이터 ─────────────────────────────────────────
   ⚠️⚠️ **평균가를 지어내지 마세요.** 견적이 0건이라 숫자가 없습니다.
   "얼마쯤" 을 적어 두면 사장님이 그 숫자로 협상하러 갑니다. 대신
   **무엇이 금액을 가르는가**를 냅니다 — 그건 근거를 댈 수 있습니다. */
function MainPrice(){
  var L = (typeof amQuoteStats === "function") ? amQuoteStats() : [];
  var body = L.length
    ? '<ul class="hp-g">'+L.map(function(q){
        return '<li><b>'+esc(q.name)+'</b><em>'+esc(q.range)+'</em>'+
          '<i>'+esc(q.asOf)+' 확인 · 견적 '+q.n+'건</i></li>'; }).join("")+'</ul>'
    : Empty({ sm:true, icon:"chart", title:"가격 데이터를 모으는 중입니다",
        text:"평균가를 지어내지 않습니다. 사장님이 그 숫자를 들고 협상하러 "+
             "가시기 때문입니다. 실제 견적이 쌓이면 범위와 확인한 날짜를 "+
             "같이 냅니다. 그때까지는 무엇이 금액을 가르는지를 글로 적어 두었습니다.",
        cta:'<a class="btn btn-nv" href="/content">무엇이 금액을 가르나'+icon("arrow",18)+'</a>'+
            '<a class="btn btn-o" href="/tools/cost">창업비 직접 재 보기</a>' });
  return MainBand({ bg:"sec-blue", kicker:"PRICE",
    h:"다른 사장님들은 얼마에 하셨을까?", body:body });
}

/* ══════════════════════════════════════════════════════════════════
   ⑩ 한 사장님의 끝이 다른 사장님의 시작 (지시서 §22 · §23)
   ══════════════════════════════════════════════════════════════════
   ⚠️ 히어로 다음으로 **기억에 남아야 하는 구간**입니다. 다른 구간보다
   크게 냅니다 — 이 플랫폼의 차별점이라서입니다.
   ⚠️ **주황 → 남색 → 초록**의 흐름이 한눈에 보여야 합니다.
   ⚠️⚠️ **폐업 쪽을 처연하게 쓰지 마세요.** 실패가 아니라 정리와 다음
   단계입니다 — 손실 · 실패라는 낱말을 쓰지 않습니다.
   ⚠️ 오른쪽에 왼쪽 자산을 그대로 다시 적지 마세요. 적는 것은 **그것이
   다음 사장님에게 무엇인지**입니다. */
var MAIN_FLOW_CL = [
  { ic:"store", n:"매장" }, { ic:"tool", n:"시설" },
  { ic:"sofa",  n:"장비 · 가구" }, { ic:"boxes", n:"재고" }
];
var MAIN_FLOW_ST = [
  { ic:"pin",   n:"매장 인수", d:"상권을 처음부터 다시 찾지 않아도 됩니다" },
  { ic:"tool",  n:"시설 활용", d:"쓸 수 있는 것은 새로 사지 않아도 됩니다" },
  { ic:"clock", n:"빠른 오픈", d:"공사 기간이 줄어 문을 빨리 엽니다" },
  { ic:"wallet",n:"비용 절감", d:"처음부터 만드는 것보다 덜 듭니다" }
];
function MainBridge(){
  return '<section class="sec mbr"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">START &amp; CLOSE</p>'+
      '<h2>한 사장님의 끝이<br class="br-m"> 다른 사장님의 시작이 됩니다.</h2>'+
      '<p>버리는 것은 줄이고, 다음 사장님의 시작으로.</p>'+
    '</div>'+
    '<div class="mbr-g">'+
      '<div class="mbr-c mbr-cl">'+
        '<p class="mbr-k">정리하는 사장님</p>'+
        (hasPhoto("flow-close") ? '<figure class="mbr-p">'+photoBox("flow-close")+'</figure>' : '')+
        '<ul class="mbr-l">'+MAIN_FLOW_CL.map(function(x){
          return '<li><span class="ic-t">'+icon(x.ic,24)+'</span><b>'+esc(x.n)+'</b></li>';
        }).join("")+'</ul>'+
      '</div>'+
      '<div class="mbr-m">'+
        '<span class="mbr-arw mbr-arw-in" aria-hidden="true"></span>'+
        '<div class="mbr-logo">'+
          '<span class="mbr-logo-i">'+icon("home",26)+'</span>'+
          '<b>'+esc(amBrand())+'</b>'+
          /* 시안 §31 — 짧고 한눈에. 길게 설명하지 않습니다. */
          '<i>버리는 것을 줄이고<br> 다음 사장님의 시작으로</i>'+
        '</div>'+
        '<span class="mbr-arw mbr-arw-out" aria-hidden="true"></span>'+
      '</div>'+
      '<div class="mbr-c mbr-st">'+
        '<p class="mbr-k mbr-k-st">창업하는 사장님</p>'+
        (hasPhoto("flow-start") ? '<figure class="mbr-p">'+photoBox("flow-start")+'</figure>' : '')+
        '<ul class="mbr-l mbr-l-st">'+MAIN_FLOW_ST.map(function(x){
          return '<li><span class="ic-t">'+icon(x.ic,24)+'</span>'+
            '<span class="mbr-tx"><b>'+esc(x.n)+'</b><i>'+esc(x.d)+'</i></span></li>';
        }).join("")+'</ul>'+
      '</div>'+
    '</div>'+
    '<p class="row-cta row-mid">'+
      '<a class="btn btn-st" href="/stores">매장 인수하기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-cl" href="/assets">시설 · 집기 보기'+icon("arrow",18)+'</a></p>'+
  '</div></section>';
}

/* ── ⑪ 사장님 도구 ────────────────────────────────────────────────
   ⚠️ 도구 목록은 `AM_TOOLS` 하나입니다 — 여기에 손으로 적지 마세요.
   아이콘과 악센트만 여기서 붙입니다. */
var MAIN_TOOL_IC = {
  cost: { ic:"wallet",  c:"st" }, bep:   { ic:"chart",   c:"bl" },
  labor:{ ic:"users",   c:"pu" }, fixed: { ic:"receipt", c:"tl" },
  vs:   { ic:"compare", c:"gd" }, close: { ic:"listck",  c:"cl" }
};
function MainTools(){
  var L = (window.AM_TOOLS||[]);
  if(!L.length) return "";
  /* ⚠️ 바탕이 아이보리인 까닭 — 바로 아래 입점 구간이 흰색입니다.
     둘 다 흰색이면 "이웃한 두 구간이 붙어 보임" 으로 ΔE 0.00 이
     잡힙니다 (리뉴얼로 사이에 있던 후기 구간이 빠지면서 실제로
     그랬습니다). ⚠️ 아이보리로 뒀더니 이번에는 **위**의 연결 구간
     (크림)과 ΔE 2.34 였습니다 — 위아래를 같이 보세요. 하늘 틴트는
     크림과도 흰색과도 뚜렷이 다릅니다. */
  return '<section class="sec sec-blue"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">TOOLS</p>'+
      '<h2>사장님 도구</h2>'+
      '<p>창업과 운영, 정리에 필요한 숫자를 직접 재 보세요. '+
        '적으신 숫자는 이 브라우저에만 남습니다.</p></div>'+
    '<ul class="mt-g">'+L.map(function(t){
      var m = MAIN_TOOL_IC[t.key] || { ic:"gauge", c:"bl" };
      return '<li class="hv-'+m.c+'"><a href="/tools/'+esc(t.key)+'">'+
        '<span class="ic-t">'+icon(m.ic,26)+'</span>'+
        '<b>'+esc(t.name)+'</b><i>'+esc(t.lead)+'</i></a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* ── ⑫ 후기 ───────────────────────────────────────────────────────
   ⚠️⚠️ **후기를 지어내지 마세요.** 평점도 후기 수도 값으로 들고 있지
   않습니다 — 후기는 **업체 안**(`p.reviews`)에 들어 있고 평점도 거기서
   계산합니다. 손으로 적어 넣을 자리가 없습니다. */
function MainReviews(){
  var rv = [];
  (window.AM_PROVIDERS||[]).forEach(function(p){
    (p.reviews||[]).forEach(function(r){ rv.push({ r:r, p:p }); });
  });
  rv.sort(function(a,b){ return String(b.r.at||"").localeCompare(String(a.r.at||"")); });
  var body = rv.length
    ? '<ul class="hr-g">'+rv.slice(0,3).map(function(x){
        return '<li><span class="hr-q">'+icon("chat",20)+'</span>'+
          '<p>'+esc(x.r.text||"")+'</p>'+
          '<i>'+esc(x.p.name||"")+(x.r.at ? ' · '+esc(x.r.at) : '')+'</i></li>';
      }).join("")+'</ul>'
    : Empty({ sm:true, icon:"star", title:"첫 이용후기가 곧 올라옵니다",
        text:"후기를 지어내지 않습니다. 실제로 연결된 사장님이 쓰신 것만 "+
             "올리고, 평점은 그 후기에서 계산합니다 — 손으로 적는 자리가 없습니다.",
        cta:'<a class="btn btn-nv" href="/quote">견적 요청하기'+icon("arrow",18)+'</a>' });
  return MainBand({ bg:"sec-ivory", kicker:"REVIEWS",
    h:"실제 사장님들의 경험", mid:true, body:body });
}

/* ── ⑬ 업체 입점 ──────────────────────────────────────────────────
   ⚠️ **이 화면에서 어두운 면은 여기 한 장뿐입니다.** 푸터와 붙지 않게
   위에 밝은 구간(후기)이 옵니다.
   ⚠️ **성과를 지어내지 마세요.** "월 n건" 은 지금 0 입니다. 낼 수 있는
   것은 지금 사실인 것과 지키겠다는 약속까지입니다.
   ⚠️ 지시서 §12 — 첫 화면에 있던 "모집중 · 준비중" 은 여기로 모읍니다. */
function MainJoin(){
  var cats = (window.AM_CATS||[]).filter(function(c){ return c.kind === "provider"; });
  return '<section class="sec mjn"><div class="w">'+
    '<div class="mjn-c">'+
      '<div class="mjn-t">'+
        '<p class="mjn-k">PARTNER</p>'+
        '<h2>사장님을 찾는 업체인가요?</h2>'+
        '<p>실제로 창업 · 폐업을 준비하시는 분들을 만나 보세요. '+
          '기본 입점은 무료이고, 지금은 초기 파트너를 모집하고 있습니다.</p>'+
        (cats.length ? '<ul class="mjn-l">'+cats.slice(0,10).map(function(c){
          return '<li>'+icon(c.icon,18)+esc(c.name)+'</li>'; }).join("")+'</ul>' : '')+
      '</div>'+
      '<p class="mjn-go"><a class="btn btn-w" href="/join">'+
        '무료로 입점하기'+icon("arrow",18)+'</a></p>'+
    '</div>'+
  '</div></section>';
}

/* ⚠️ **구간을 더하거나 차례를 바꾸시려면 지시서를 먼저 고치세요.**
   `check.js` 의 "메인 구간 차례가 지시서와 같다" 가 **구간 열셋**을
   셉니다 — 분야 바로가기 열은 `<nav>` 라 그 셈에 안 들어가고, "히어로
   에서 바로 찾고 바로 갈라진다" 가 열 칸으로 봅니다. */
function PageMain(){
  /* ⚠️⚠️ **차례는 2026-10-04 히어로 개편 지시서**입니다 (그 아래는
     2026-10-03 리뉴얼 지시서를 그대로 둡니다 — "히어로 아래의 기존
     섹션은 삭제하지 않는다") —
       ① 히어로 창업/폐업 두 판 + 떠 있는 검색 패널 (10-04 §3~§12)
       ② 사업 단계 여섯            (10-04 구조 개편 §3~§9)
       ③ 브랜드 가치 넷            (§7)
       ④ 범위 숫자                 (§20 이 금지한 "회원 수" 가 아니라
                                    세는 값입니다 — 아래 설명)
       ⑤ 업종 고르기               (§8)
       ⑥ 고른 업종에 필요한 것      (§9)
       ⑦ 큰 카드 셋                (§10 · §11)
       ⑧ 주요 서비스 여덟          (§12 · §13)
       ⑨ 업체 · ⑩ 프랜차이즈 · ⑪ 매장   (§14 ~ §16)
       ⑫ 창업 ↔ 폐업 (§17) · ⑬ 도구 (§18) · ⑭ 업체 입점 (§19)

     ⚠️⚠️ **지시서 §20 이 금지한 것은 "32,581+ 회원 · 8,219+ 업체 ·
     125,430+ 견적 · 96% 만족도" 입니다.** 그건 실적이고 지금 전부
     0 이라 적는 순간 표시광고법 제3조입니다 — **넣지 않았습니다.**
     ③ 의 숫자는 **업종 14 · 분야 25 · 서비스 183** 으로, 우리가
     실제로 다루는 **범위**이고 `AM_INDUSTRIES` · `AM_CATS` 를 그
     자리에서 세는 값입니다. 구간 안에 "서비스 분류 기준이며 등록된
     업체 수가 아닙니다" 를 ⓘ 로 같이 냅니다.

     ⚠️ **빠진 것 셋과 그 까닭** (§21 "메인에서 모든 기능을 볼 필요는
     없다") — 전부 함수는 남겨 두었습니다. 되돌리실 일이 생기면
     아래 한 줄입니다.
       · `MainTwo()`     히어로가 바로 그 두 장이 됐습니다 (§3)
       · `MainPrice()`   견적 0건이라 늘 Empty 이고 지시서에 없습니다
       · `MainReviews()` 후기 0건. §7 이 "실제 후기 확인" 을 지금
                         핵심 가치로 쓰지 말라고 적었습니다 */
  return MainHero()+ MainStage()+ MainValue()+ MainScale()+
         MainIndustry()+ MainFit()+ MainFeature()+ MainServices()+
         MainProviders()+ MainFranchise()+ MainStores()+
         MainBridge()+ MainTools()+ MainJoin();
}

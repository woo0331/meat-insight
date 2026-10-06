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
/* ⚠️⚠️ **2026-10-06 V2 확정 지시서 §3** — 첫 화면에서 3~5초 안에
   STOREWAY 가 무엇인지 읽혀야 합니다. 그때까지 히어로는 **창업 / 폐업
   두 판**뿐이라 "창업이냐 폐업이냐" 까지만 말하고 있었는데, 이 서비스는
   그 사이의 **운영 · 인수 · 양도**까지 잇는 곳입니다 (§2).
   ⚠️ 두 판을 **지우지 않았습니다** (§0-1 · §0-8) — 그 위에 한 문장을
   얹고, 두 판은 그대로 창업 · 폐업으로 갈라 주는 자리로 둡니다.
   ⚠️⚠️ **h1 이 여기로 올라왔습니다.** 화면마다 h1 은 **딱 하나**라
   아래 가치 구간은 h2 가 됩니다 — 첫 제목이 곧 h1 이라야 읽어 주는
   프로그램과 검색엔진에도 차례가 맞습니다. */
function MainHeroTop(){
  return '<div class="mh-top"><div class="w">'+
    /* ⚠️ 2026-10-06 2차 §2 가 적은 네 줄 그대로입니다. 첫 방문자가
       **무엇부터 해야 할지**를 마지막 줄이 말합니다 — 그 줄을
       지우면 아래 상황 카드가 왜 있는지 안 읽힙니다.
       ⚠️ `<br class="br-m">` 뒤에는 **띄어쓰기를 하나** 둡니다 —
       좁아지면 이 줄바꿈이 사라지는데, 없으면 앞뒤 낱말이 붙습니다. */
    '<h1 class="mh-h1">사장님의 시작부터 마지막까지</h1>'+
    '<p class="mh-lead">창업 · 운영 · 인수 · 양도 · 폐업에<br class="br-m"> '+
      '필요한 모든 것.</p>'+
    '<p class="mh-sub">상가, 인테리어, 장비, 세무, 마케팅부터<br class="br-m"> '+
      '매장 양도, 시설 처분, 철거와 원상복구까지.<br> '+
      '<b>내 상황만 고르시면 필요한 순서대로 보여 드립니다.</b></p>'+
    /* ⚠️ 둘 다 **실제로 있는 화면**입니다 (가짜 링크는 절대 규칙 5).
       "내 상황에 맞게 시작하기" 는 바로 아래 여정 넷으로 내려갑니다 —
       새 화면을 만들지 않고 이미 있는 구간을 가리킵니다. */
    '<p class="mh-cta">'+
      /* ⚠️ 행동색은 파랑 · 남색입니다. POINT RED 는 **검색 CTA 한
         자리**뿐이라 여기 쓰지 않습니다 (10-04 §4). */
      '<a class="btn btn-b btn-lg" href="#journey">내 상황에 맞게 시작하기'+
        icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/providers">업체 찾아보기</a>'+
    '</p>'+
  '</div></div>';
}
function MainHero(){
  return '<section class="mh">'+ MainHeroTop() +'<div class="mh-two">'+
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
/* ⚠️⚠️ **열 개 전부 검색해 보고 결과가 나오는 것만 둡니다.** 2026-10-04
   에 재 보니 `주방설비` · `상가임대` · `매장양도` · `철거·원상복구` 가
   **0건**이었습니다 — 손님이 띄어쓰기를 안 하는데 분류 이름은 띄어 두었고
   ("상가 임대" · "매장 양도"), `시설 · 장비` 는 "주방설비" 라는 글자를
   아예 안 들고 있었습니다. 추천해 놓고 쳐 보면 0건인 상태였습니다.
   `amScore()` 의 띄어쓰기 무시 한 겹과 `catalog.js` 의 `kw` 로 고쳤고,
   지금은 열 개 다 1건 이상입니다. ⚠️ 칩을 더하실 때도 **쳐 보세요.**
   ⚠️ 칩은 **검색이 아니라 그 화면으로** 바로 보냅니다 — 답이 있는
   자리로 바로 가는 쪽이 낫습니다. */
var MAIN_CHIPS = [
  { q:"인테리어",       to:"/providers/interior" },
  { q:"주방설비",       to:"/providers/equip" },
  { q:"상가임대",       to:"/stores" },
  { q:"세무",           to:"/providers/admin" },
  { q:"POS",            to:"/providers/it" },
  { q:"매장양도",       to:"/g/transfer" },
  { q:"철거 · 원상복구", to:"/providers/demolish" },
  { q:"간판",           to:"/providers/interior?s=sign" },
  { q:"청소",           to:"/providers/clean" },
  { q:"마케팅",         to:"/providers/marketing" }
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
          'aria-label="업체 · 서비스 검색" '+
          /* ⚠️ 보기를 같이 적습니다 — 업체 이름을 모르셔도 **서비스
             이름**으로 찾을 수 있다는 것이 여기서 읽혀야 합니다 (§3).
             ⚠️ 적어 둔 넷은 전부 **실제로 결과가 나오는 말**입니다. */
          'placeholder="어떤 업체나 서비스를 찾고 계신가요? (예: 인테리어, 주방설비, 세무, 상가임대 등)">'+
      '</span>'+
      '<button class="btn btn-pt" type="submit">'+icon("search",18)+'검색하기</button>'+
    '</form>'+
    /* ⚠️⚠️ **"인기" 도 "추천" 도 쓰지 않습니다** (2026-10-06 마무리
       지시서 §3). 검색 기록을 모으지 않아 무엇이 인기인지 모르고,
       "추천" 은 우리가 고른 차례라는 말이라 기준을 밝혀야 합니다.
       이 칩은 **그 화면으로 바로 가는 길**이라 "바로가기" 입니다. */
    '<p class="msr-ch"><b>바로가기</b>'+MAIN_CHIPS.map(function(c){
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
      /* ⚠️⚠️ **바로 위 여정 넷과 같은 질문을 또 하지 마세요.**
         "지금 무엇을 준비하고 계신가요?" 다음에 "어느 단계에
         계신가요?" 가 오면 손님은 **같은 것을 두 번 묻는다**고
         읽습니다 (찍어 보고 알았습니다). 여정은 **고르는 입구**이고
         여기는 그 안의 **사업 흐름**이라, 머리말로 그걸 말합니다. */
      '<h2>사업 단계별 서비스</h2>'+
      '<p>시작 → 자리 → 구축 → 운영 → 인수인계 → 정리. '+
        '단계마다 필요한 분야를 모아 두었습니다.</p></div>'+
    '</div>'+
    '<ul class="mstg-g">'+L.map(function(s){ return '<li>'+StageCard(s)+'</li>'; }).join("")+'</ul>'+
  '</div></nav>';
}

/* 단계 카드 한 장 — 메인과 단계 화면(앞뒤 두 장)이 같이 씁니다.
   ⚠️⚠️ **사진이 없으면 아래 띠를 아예 안 그립니다** (절대 규칙 2).
   빈 액자를 반쯤 깔아 두면 카드 여섯이 전부 "준비 중" 으로 읽힙니다 —
   사진이 들어오면 **이 파일을 한 줄도 안 고치고** 띠가 생깁니다.
   ⚠️ 사진 키는 `lifecycle.js` 가 아니라 **자리 이름 규칙**입니다
   (`category-<단계키>`). `photos.js` 의 자리 목록과 짝이 맞아야 하고,
   한 글자만 틀려도 조용히 안 나옵니다 — 빌드가 막습니다. */
function StageCard(s){
  var key = "category-" + s.key;
  var ph  = (typeof hasPhoto === "function") && hasPhoto(key);
  return '<a href="'+esc(amStageTo(s))+'" class="stg'+tn(s.tone)+(ph ? " stg-ph" : "")+'">'+
    '<span class="stg-t">'+
      '<span class="stg-h">'+
        '<span class="stg-i">'+icon(s.icon,24)+'</span>'+
        '<b>'+esc(s.name)+'</b>'+
      '</span>'+
      '<em class="stg-c">'+(s.copy || esc(s.lead))+'</em>'+
      '<i class="stg-s">'+esc(s.sub)+'</i>'+
    '</span>'+
    (ph ? '<span class="stg-img">'+photoBox(key)+'</span>' : '')+
    '<span class="stg-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
  '</a>';
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
/* ⚠️⚠️ **구간 껍데기는 아래 `MainStory()` 가 씁니다** (2026-10-06
   마무리 지시서 §1 — 브랜드 스토리가 메인의 마지막 구간입니다).
   여기는 **안쪽만** 돌려줍니다. `MainValue()` 는 되돌리실 때를 위해
   남겨 두었습니다 — `PageMain()` 에 한 줄 넣으시면 그대로 돕니다. */
function mainValueIn(){
  return '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow mval-k">대한민국 사장님의 시작과 끝</p>'+
      /* ⚠️ 2026-10-06 에 **h1 이 히어로로 올라갔습니다** — 화면마다
         h1 은 딱 하나라 여기는 h2 입니다. 글은 그대로 둡니다. */
      '<h2 class="mval-h"><em class="mh-st">창업</em>에 필요한 모든 것. '+
        '<em class="mh-cl">폐업</em>에 필요한 모든 것.</h2>'+
      '<p>사업의 시작부터 정리까지, 사장님에게 필요한 업체와 서비스를 한 곳에서.</p>'+
    '</div>'+
    '<ul class="mval-g">'+MAIN_VALUE.map(function(v){
      return '<li><span class="mval-i">'+icon(v.ic,24)+'</span>'+
        '<span class="mval-t"><b>'+esc(v.t)+'</b><i>'+esc(v.d)+'</i></span></li>';
    }).join("")+'</ul>';
}
function MainValue(){
  return '<section class="sec sec-white mval"><div class="w">'+
    mainValueIn()+'</div></section>';
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
function mainScaleIn(){
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
  /* ⚠️⚠️ **자리가 세 번 바뀌었습니다** — 히어로 안의 띠 → 흰 구간
     하나(`.mnum`) → **브랜드 스토리 안의 띠**(2026-10-06 마무리 지시서
     §1 의 차례에 독립 구간이 없습니다). 히어로에 돌려놓지 마세요 —
     떠 있는 검색 패널이 음수 margin 으로 히어로 아래에 걸쳐 있어서,
     그 뒤에 띠를 붙이면 패널이 띠 위에 올라앉습니다.
     ⚠️ 숫자를 키우되 **"분야의 수" 줄은 그대로** 둡니다 (§9) — 숫자만
     크게 띄우면 "업체가 183곳" 으로 읽힙니다.
     ⚠️ `check.js` 가 **히어로 안에 있지 않은지**도 같이 봅니다. */
  return '<div class="mst-box">'+
      '<ul class="mst-g">'+rows.map(function(r){
        return '<li><b>'+r.n+'</b>'+
          '<span class="mst-k">'+esc(r.k)+'</span>'+
          '<i>'+esc(r.u)+'</i></li>'; }).join("")+'</ul>'+
      /* ⚠️⚠️ **이 줄을 지우지 마세요.** 숫자만 크게 띄우면 "업체가
         183곳" 으로 읽힙니다. 시안도 ⓘ 로 같은 자리에 두었습니다 —
         폰에서도 숨기지 않습니다. */
      '<p class="mst-n">'+icon("info",16)+
        '<span>서비스 <b>분류 기준</b>이며 등록된 업체 수가 아닙니다.</span></p>'+
    '</div>';
}
function MainScale(){
  var inner = mainScaleIn();
  return inner ? '<section class="sec sec-white mnum"><div class="w">'+
    inner+'</div></section>' : "";
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
/* ⚠️ **쪽(창업/폐업)은 두 군데에서 옵니다** — 고른 상황(`?j=`)이
   있으면 거기서, 없으면 예전처럼 `?side=` 에서. 둘을 따로 들고
   다니면 상황은 "폐업" 인데 아래는 창업 분류가 나오는 일이 생깁니다. */
function mainSide(){
  var j = (typeof amJourneySide === "function") ? amJourneySide(nowQS("j")) : "";
  if(j) return j;
  return (nowQS("side") === "close") ? "close" : "start";
}
/* 메인의 주소 한 곳 — 상황 · 업종 · 쪽을 **같이** 싣습니다.
   ⚠️ 하나라도 빠뜨리면 손님은 자기가 고른 것이 꺼진 줄 모르고
   결과만 달라진 것을 봅니다 (거르개에서 겪은 자리입니다). */
function mainTo(o){
  o = o || {};
  var j = ("j" in o) ? o.j : nowQS("j");
  var i = ("i" in o) ? o.i : nowQS("i");
  var side = ("side" in o) ? o.side : nowQS("side");
  var q = [];
  if(j) q.push("j=" + encodeURIComponent(j));
  if(i) q.push("i=" + encodeURIComponent(i));
  /* 상황이 쪽을 정하면 `?side=` 는 싣지 않습니다 (두 값이 싸웁니다) */
  if(side === "close" && !(typeof amJourneySide === "function" && amJourneySide(j)))
    q.push("side=close");
  return "/" + (q.length ? "?" + q.join("&") : "");
}

/* ── ④ 어떤 업종인가요 (2026-10-06 2차 §4) ─────────────────────────
   ⚠️ 상황을 고른 **다음**에 묻는 자리입니다. 머리말이 §4 그대로
   "어떤 업종인가요?" 이고, 고른 결과는 바로 아래 맞춤 시작 CTA 가
   받습니다. ⚠️ 업종 열넷은 `industries.js` 한 곳입니다. */
function MainIndustry(){
  var L = (window.AM_INDUSTRIES||[]);
  if(!L.length) return "";
  var cur  = nowQS("i");
  var jy   = (typeof amJourney === "function") ? amJourney(nowQS("j")) : null;
  /* 고른 업종은 주소(`?i=`)에 실립니다 — 뒤로 가기 · 새로고침 · 링크
     공유에 살아남고, canonical 은 `nowPath()` 라 질의문자가 빠져서
     같은 내용이 두 주소로 나가지 않습니다. */
  var to = function(k){ return mainTo({ i:k }); };
  return '<section class="sec sec-gray" id="industry"><div class="w">'+
    '<div class="sec-hd sec-hd-row"><div>'+
      '<h2>어떤 업종인가요?</h2>'+
      /* ⚠️⚠️ **조사를 손으로 적지 마세요.** "창업 준비" 는 받침이 없어
         "를", "매장 운영" 은 받침이 있어 "을" 입니다 — `koWith()` 가
         고릅니다. 이 저장소에서 손으로 적어 둔 조사가 다섯 번
         터졌고, 한 번은 모든 화면의 푸터였습니다. */
      '<p>'+esc(jy ? (koWith(jy.name, "을를") + " 고르셨습니다. 업종까지 고르시면 "+
                      "필요한 순서를 바로 보여 드립니다.")
                   : "업종을 고르시면 필요한 서비스와 업체를 보여 드립니다.")+'</p></div>'+
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
   ④-2 맞춤 시작 CTA (2026-10-06 2차 §4 · §5)
   ══════════════════════════════════════════════════════════════════
   상황과 업종을 고르면 **"음식점 창업을 준비하고 계시네요"** 를
   되읽어 주고, 그 조합의 맞춤 결과 화면으로 보냅니다.

   ⚠️⚠️ **새 화면을 만들지 않았습니다** (§1 — 중복 개발 금지).
   `/startup/음식점` · `/closure/음식점` · `/operation?i=` ·
   `/transfer?i=` 가 이미 그 맞춤 결과 화면이고, 2차 §5 에 맞춰
   머리말과 걸음마다 "꼭 확인할 것" 을 더했습니다.

   ⚠️ **덜 고르셨어도 비지 않습니다** — 무엇이 남았는지 말해 주고
   그 자리로 올려 보냅니다. 빈 칸으로 두면 손님은 고장으로 읽습니다.
   ⚠️ 걸음 미리보기는 **세 개**입니다. 전부 펼치면 아래 구간이
   화면 밖으로 밀려나고, 그러면 메인이 결과 화면이 되어 버립니다
   (§18 — "메인은 발견과 이동, 상세페이지는 깊은 정보"). */
function mainPlanTo(jy, ind){
  if(!jy) return "";
  var iq = ind ? ("?i=" + encodeURIComponent(ind.key)) : "";
  if(jy.key === "startup") return ind ? "/startup/" + encodeURIComponent(ind.key) : "/startup";
  if(jy.key === "closing") return ind ? "/closure/" + encodeURIComponent(ind.key) : "/closure";
  return jy.to + iq;          /* 운영 · 인수양도는 `?i=` 로 좁힙니다 */
}
/* 그 조합에서 보여 줄 걸음 — ⚠️ 상황 하나가 걸음 묶음 하나입니다.
   인수 · 양도는 받는 쪽(acq-in)을 기본으로 냅니다 (양도 쪽은 그
   화면의 탭에서 고릅니다). */
function mainPlanKey(jy){
  return jy.key === "startup" ? "startup"
       : jy.key === "closing" ? "closing"
       : jy.key === "acquisition" ? "acq-in" : "";
}
/* ⚠️ 구간 껍데기는 아래 `MainRoadmap()` 가 씁니다 — 맞춤 준비 순서와
   "필요한 모든 것" 은 **한 구간**입니다 (마무리 지시서 §1 의 04).
   따로 두면 메인 구간이 하나 늘어 차례가 어긋납니다. */
function mainStartIn(){
  var jy  = (typeof amJourney === "function") ? amJourney(nowQS("j")) : null;
  var ind = (nowQS("i") && window.amIndustry) ? amIndustry(nowQS("i")) : null;

  /* 아직 고르는 중 — 무엇이 남았는지 말하고 그 자리로 보냅니다 */
  if(!jy || !ind){
    var miss = !jy ? "상황" : "업종";
    var to   = !jy ? "#journey" : "#industry";
    return '<div class="mst2 mst2-wait">'+
        '<p class="mst2-k">'+icon("info",16)+'맞춤 준비 순서</p>'+
        /* ⚠️ "상황까지" 는 어색합니다 — 첫 걸음이라 "까지" 가 받을
           앞말이 없습니다. 고르신 것이 있을 때만 "까지" 입니다. */
        '<p class="mst2-h">'+esc(jy ? "업종까지 고르시면" : "상황을 고르시면")+
          ' 필요한 순서를 바로 보여 드립니다.</p>'+
        '<p class="mst2-p">'+
          esc(jy ? (koWith(jy.name,"을를") + " 고르셨습니다. 업종 하나만 더 고르시면 됩니다.")
                 : "위에서 지금 상황을 하나 고르시면 시작합니다.")+'</p>'+
        '<p class="mst2-cta"><a class="btn btn-b btn-lg" href="'+esc(to)+'">'+
          esc(miss)+' 고르기'+icon("arrow",18)+'</a></p>'+
    '</div>';
  }

  /* 둘 다 고르셨습니다 — 맞춤 결과로 */
  var steps = amProcess(mainPlanKey(jy)).slice(0, 3);
  var to    = mainPlanTo(jy, ind);
  return '<div class="mst2">'+
      '<p class="mst2-k">'+icon("check",16)+esc(ind.name)+' · '+esc(jy.name)+'</p>'+
      /* ⚠️ 또 조사입니다 — `창업` · `운영` · `폐업` 은 받침이 있어
         "을", `인수 · 양도` 는 받침이 없어 "를" 입니다. */
      '<p class="mst2-h">'+esc(ind.name)+' '+
        esc(koWith(jy.short, "을를"))+' 준비하고 계시네요.</p>'+
      '<p class="mst2-p">지금부터 필요한 순서를 정리해 두었습니다. '+
        '걸음마다 꼭 확인할 것 · 읽을 것 · 맡길 곳이 같이 있습니다.</p>'+
      (steps.length ? '<ol class="mst2-s">'+steps.map(function(st, i){
        return '<li><b>'+((i+1<10?"0":"")+(i+1))+'</b><i>'+esc(st.name)+'</i></li>';
      }).join("")+'<li class="mst2-more">…</li></ol>' : '')+
      '<p class="mst2-cta">'+
        '<a class="btn btn-b btn-lg" href="'+esc(to)+'">'+
          esc(ind.name)+' '+esc(jy.short)+' 순서 보기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="'+esc(quoteTo({ industry:ind.key,
          side: jy.side === "close" ? "close" : jy.side === "start" ? "start" : "" }))+'">'+
          '필요한 것 견적 요청</a>'+
      '</p>'+
    '</div>';
}
function MainStart(){
  return '<section class="sec sec-white mstart"><div class="w">'+
    mainStartIn()+'</div></section>';
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
/* ⚠️ 여기도 **안쪽만** 돌려줍니다 — 위 `mainStartIn()` 과 한 구간
   (`.mroad`)에 같이 들어갑니다. `MainFit()` 은 되돌리실 때를 위해
   남겨 두었습니다. */
function mainFitIn(){
  /* ⚠️ 쪽은 `mainSide()` 한 곳에서 옵니다 — 고른 상황이 있으면
     거기서 나옵니다. 여기서 `?side=` 를 따로 읽으면 상황은 폐업인데
     분류는 창업 것이 나옵니다. */
  var side = mainSide();
  var jySide = (typeof amJourneySide === "function") ? amJourneySide(nowQS("j")) : "";
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

  /* ⚠️ 머리말에 업종 이름을 또 적지 않습니다 — 바로 아래 h2 가 이미
     "카페 · 디저트 창업에 필요한 모든 것" 입니다. 여기는 **지금 어느
     쪽을 보고 있는지**를 냅니다.
     ⚠️⚠️ **`return` 뒤에 줄을 바꾸지 마세요.** 주석을 `return` 과 값
     사이에 끼워 넣었더니 자바스크립트가 거기에 세미콜론을 넣어
     `return;` 이 됐습니다 — 에러도 안 나고, 이 함수만 `undefined` 를
     돌려줘서 메인에서 **분야 격자와 토글이 통째로 사라졌습니다.**
     화면에는 "상황 고르기undefined" 가 찍혔습니다. */
  return '<div class="sec-hd sec-hd-row"><div>'+
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
    /* ⚠️⚠️ **상황(`?j=`)이 쪽을 정하면 이 토글을 안 냅니다.** 둘 다
       내면 토글을 눌러도 아무 일이 안 납니다 — 상황이 이기기
       때문입니다. 손님은 고장으로 읽고, 그 다음부터 아무것도 안
       누릅니다. 위의 상황 카드가 바로 이 토글입니다. */
    (jySide ? "" :
      '<div class="mfit-tb" role="tablist" aria-label="창업 · 정리">'+
        tab("start","창업 준비")+tab("close","사업 정리")+'</div>')+
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
      '숫자는 분야 안의 <b>세부 서비스 수</b>이고 등록된 업체 수가 아닙니다.</p>';
}
function MainFit(){
  var inner = mainFitIn();
  return inner ? '<section class="sec sec-white"><div class="w">'+
    inner+'</div></section>' : "";
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 04 — 맞춤 로드맵 (2026-10-06 마무리 지시서 §1)
   ══════════════════════════════════════════════════════════════════
   02 에서 고른 **상황**(`?j=`)과 03 에서 고른 **업종**(`?i=`)이 그대로
   여기로 들어옵니다. 위는 "지금부터 할 순서", 아래는 "그 쪽에 필요한
   분야 전부" 입니다 — 둘은 같은 질문의 답이라 **한 구간**입니다.

   ⚠️⚠️ **다시 두 구간으로 쪼개지 마세요.** 지시서 §1 의 차례가
   열넷(화면 열셋 + 푸터)이고 `check.js` 가 그 수를 셉니다.
   ⚠️ 걸음과 분야를 여기 손으로 적지 마세요 — 순서는 `AM_PROCESS`,
   분야 차례는 `amCatsFor()`, 하위는 `amCatItems()` 가 정합니다. */
function MainRoadmap(){
  var a = mainStartIn(), b = mainFitIn();
  if(!a && !b) return "";
  return '<section class="sec sec-white mroad" id="roadmap"><div class="w">'+
    a+(a && b ? '<div class="mroad-hr"></div>' : "")+b+
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
      /* ⚠️ 2026-10-06 §3 — 브랜드가 쌓여도 "추천" 이라고 쓰지 않습니다.
         무엇을 근거로 추천하는지 밝힐 수 없으면 그건 광고입니다. */
      h: "검토할 프랜차이즈<br> 브랜드",
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
/* ⚠️⚠️ **2026-10-06 마무리 지시서 §4 가 적은 열둘**입니다. 그중
   `노무` 는 독립 분류가 아니라 `admin` 의 하위(`labor-agent`)라 한
   장으로 묶었습니다 — 없는 분류 key 를 적으면 그 카드가 **조용히
   빠집니다** (에러도 안 나고 화면도 멀쩡합니다).
   ⚠️ 이름 · 아이콘 · 링크는 전부 `catalog.js` 에서 옵니다. 여기 적는
   것은 **어느 분류를 앞에 낼지**와 한 줄 설명뿐입니다. */
var MAIN_SVC = [
  { k:"store",     d:"상가 · 점포 매물을 조건으로 찾습니다" },
  { k:"area",      d:"상권 · 유동인구 · 경쟁점을 먼저 봅니다" },
  { k:"interior",  d:"공간의 가치를 높이는 전문 시공업체" },
  { k:"equip",     d:"업종별 필수 장비를 한곳에서" },
  { k:"it",        d:"POS · 키오스크 · CCTV · 인터넷" },
  { k:"admin",     d:"사업자등록 · 인허가 · 세무 · 노무" },
  { k:"staff",     d:"직원 채용과 교육, 인력 아웃소싱" },
  { k:"marketing", d:"브랜드를 성장시키는 전문가들" },
  { k:"transfer",  d:"좋은 매장을 다음 사장님에게" },
  { k:"asset",     d:"중고 시설 · 장비를 그대로 이어서" },
  { k:"demolish",  d:"안전하고 빠른 철거 · 폐기물 처리" },
  { k:"restore",   d:"계약서가 정한 범위까지 원상복구" }
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
      /* ⚠️⚠️ **"많이 찾는 · 인기 · 추천 · BEST · TOP" 을 쓰지 마세요**
         (2026-10-06 마무리 지시서 §2 · §3). 검색량 · 클릭 · 저장 ·
         견적 요청을 **하나도 모으지 않습니다** — 재 본 적 없는 것을
         적으면 표시·광고의 공정화에 관한 법률 제3조입니다.
         ⚠️ "가장 많이 쓰이는" 도 같은 말이라 같이 물렀습니다.
         ⚠️⚠️ 이용 데이터가 쌓이면 **이 구간을 고치지 말고 따로
         만드세요** (§3) — 조회 · 클릭 · 저장 · 견적 요청 수를 세는
         "많이 찾는 서비스" 는 별도 구간입니다. */
      '<h2>사업에 필요한 서비스</h2>'+
      '<p>창업부터 운영, 인수 · 양도, 폐업까지 필요한 서비스를 '+
        '한곳에서 찾아보세요.</p></div>'+
      /* ⚠️ 숫자는 **세는 값**입니다 (§4 — "숫자를 임의 하드코딩하지
         않는다"). 분류를 늘리면 저절로 따라옵니다. */
      '<a class="sec-hd-all" href="/providers">'+
        ((window.AM_CATS||[]).reduce(function(n,c){
          return n + ((c.items||[]).length); }, 0) || "")+
        '개 전체 서비스 보기'+icon("arrow",16)+'</a>'+
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

/* ── ② 지금 무엇을 준비하고 계신가요 (2026-10-05 V2 §2 · §24) ─────
   ⚠️⚠️ 이 구간이 V2 지시서의 **입구**입니다. 손님이 사이트 구조를
   공부하지 않고 **자기 입으로 하는 말** 하나를 고르면, 그 다음이
   전부 그 쪽으로 좁혀집니다.
   ⚠️ 생김새는 `JourneyPick()` **한 곳**입니다 (`js/pages/journey.js`) —
   메인과 여정 네 화면이 같이 씁니다. 두 곳에 적으면 서로 달라집니다. */
/* ⚠️⚠️ **2026-10-06 2차 §3** — 이 구간이 사이트의 입구입니다. 전에는
   카드를 누르면 바로 다른 화면으로 갔는데, 그러면 §4 가 말하는
   "선택 후 바로 업종을 묻는다" 를 할 자리가 없어집니다. 지금은
   **메인에 머물면서** 상황 → 업종 → 맞춤 시작으로 이어집니다.
   ⚠️ 여정 네 화면으로 가는 길은 그대로 있습니다 — 맞춤 시작 CTA 와
   헤더 메뉴가 그리로 보냅니다 (길을 지우지 않았습니다). */
function MainJourney(){
  /* ⚠️ `id` 는 히어로의 "내 상황에 맞게 시작하기" 가 내려오는 자리입니다 —
     지우면 그 단추가 아무 데도 안 갑니다 (가짜 링크는 절대 규칙 5). */
  var j = nowQS("j");
  /* ⚠️⚠️ **톤 클래스를 반드시 답니다.** 전에는 `.mjy` 가 CSS 로만
     회색이고 클래스로는 아무 말도 안 해서, `paintTones()` 가 이 구간을
     "warm" 으로 읽고 **바로 아래 회색 구간과 겹치는 것을 못 밀었습니다**
     (ΔE 0.00 — 전수 점검이 잡았습니다). 클래스가 실제 색과 달라지면
     그 뒤 구간 전부의 리듬이 어긋납니다. */
  return '<section class="sec sec-gray mjy" id="journey"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">WHERE ARE YOU NOW</p>'+
      '<h2>지금 어떤 상황이신가요?</h2>'+
      '<p>하나만 고르시면 그 다음부터는 그 상황에 필요한 것만 보여 드립니다.</p>'+
    '</div>'+
    JourneyPick(j, true)+
  '</div></section>';
}

/* ── 사장님 정보센터 (2026-10-06 V2 확정 지시서 §21-8 · §17) ──────
   ⚠️⚠️ **글을 써 놓고 목록에만 두면 없는 것과 같습니다.** 메인에서
   정보센터로 가는 길이 푸터 한 줄뿐이었습니다 — 손님이 업체를 부르기
   전에 "무엇을 확인해야 하나" 를 보는 자리가 이 사이트의 값어치인데,
   첫 화면에 그 입구가 없었습니다.
   ⚠️ 네 칸은 **여정 넷과 같은 축**입니다 (§17 이 적은 4대 카테고리) —
   새 분류를 만들지 않고 `?side=` 거르개로 보냅니다.
   ⚠️⚠️ **숫자는 세는 값입니다.** 손으로 적지 마세요 — 글을 한 편
   더 쓰면 저절로 늘어납니다. 0 이면 그 칸이 숫자 없이 나갑니다. */
/* ⚠️⚠️ **숫자를 네 칸에 다 붙이지 마세요.** 처음에 글 편수를 붙였다가
   `운영` 과 `창업` 이 둘 다 34편으로 나왔습니다 — 글에 달린 쪽은
   `start` · `close` 둘뿐이라 네 칸으로 나눌 수가 없습니다. 같은 수가
   두 번 찍히면 세는 값이 아니라 **지어낸 수**로 읽힙니다. 지금은
   **그 칸에서 다루는 말**을 냅니다 (§17 의 네 묶음 그대로). */
/* ══════════════════════════════════════════════════════════════════
   정보센터 (2026-10-06 2차 §13)
   ══════════════════════════════════════════════════════════════════
   > "단순 제목 리스트가 아니라 콘텐츠 카드로 보여준다."

   탭 넷은 **여정 넷과 같은 축**입니다 — 새 분류를 만들지 않고
   `amJourneyOfCat()` 이 분류 → 단계 → 여정으로 타고 올라갑니다.

   ⚠️⚠️ **숫자는 전부 세는 값입니다.** 전에 네 칸에 글 편수를 붙였다가
   창업과 운영이 **둘 다 34편**으로 나온 적이 있습니다 (그때는 글의
   `side` 로 나눴습니다 — 창업/폐업 둘뿐이라 넷으로 갈 수가 없습니다).
   같은 수가 두 번 찍히면 세는 값이 아니라 **지어낸 수**로 읽힙니다.
   ⚠️ **읽는 시간은 글에 적힌 값**(`read`)입니다. 없으면 그 줄이
   안 나옵니다 — 글자 수로 어림해 적으면 지어낸 수입니다.
   ⚠️⚠️ **키워드 셋은 글의 실제 구간 제목**(`body[].h`)입니다.
   "준비서류 · 신고순서 · 주의사항" 처럼 그럴듯한 말을 지어 붙이면
   화면에 없는 것을 약속하는 것입니다 (절대 규칙 5). */
function MainContent(){
  var all = (window.AM_CONTENTS || []);
  if(!all.length) return "";          /* 글이 없으면 구간째 뺍니다 */
  var J  = (window.AM_JOURNEYS || []);
  var cur = nowQS("ic") || (J[0] && J[0].key) || "";
  if(!amContentsByJourney(cur).length){
    /* 고른 탭에 글이 없으면 **있는 탭**으로 보냅니다 — 빈 칸을
       보여 주는 것보다 낫습니다 (절대 규칙 2). */
    for(var i = 0; i < J.length; i++)
      if(amContentsByJourney(J[i].key).length){ cur = J[i].key; break; }
  }
  var list = amContentsByJourney(cur, 4);
  if(!list.length) return "";
  var to = function(k){
    var q = [];
    if(nowQS("j")) q.push("j=" + encodeURIComponent(nowQS("j")));
    if(nowQS("i")) q.push("i=" + encodeURIComponent(nowQS("i")));
    q.push("ic=" + encodeURIComponent(k));
    return "/?" + q.join("&") + "#info";
  };
  return '<section class="sec sec-white minfo" id="info"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">GUIDE</p>'+
      '<h2>사장님이 알아두면 돈과 시간을 아낄 수 있는 정보</h2>'+
      /* ⚠️ `all.length` 는 **세는 값**입니다. 손으로 적지 마세요. */
      '<p>지금 '+all.length+'편. 근거를 댈 수 있는 것만 적습니다.</p>'+
      '<a class="sec-more" href="/content">전체 정보 보기'+icon("arrow",16)+'</a>'+
    '</div>'+
    /* 탭 넷 — ⚠️ `data-keep` 이 없으면 맨 위로 올라가서 무엇이
       바뀌었는지 못 봅니다. */
    '<div class="info-tb" role="tablist" aria-label="정보 분야">'+
      J.map(function(x){
        var n = amContentsByJourney(x.key).length;
        if(!n) return "";           /* 글이 없는 탭은 안 냅니다 */
        var on = (x.key === cur);
        return '<a class="info-t'+(on?" on":"")+'" href="'+esc(to(x.key))+'" data-keep'+
          (on ? ' aria-current="true"' : '')+'>'+esc(x.name)+
          '<em>'+n+'</em></a>';
      }).join("")+
    '</div>'+
    '<ul class="info-cg">'+list.map(function(c){
      /* 글이 실제로 다루는 것 — 구간 제목 셋입니다 (지어내지 않습니다) */
      var keys = (c.body || []).map(function(b){ return b.h; })
                   .filter(Boolean).slice(0, 3);
      return '<li><a href="/content/'+esc(c.slug)+'">'+
        '<span class="info-c-m">'+
          /* ⚠️ `amCatName()` 은 없는 함수입니다 — 분류는 `amCat()` 으로
             찾고 이름을 꺼냅니다. 없는 분류면 빈 칸입니다. */
          esc((amCat(c.cat) || {}).name || "")+
          (c.read ? '<em>예상 읽기 '+esc(String(c.read))+'분</em>' : '')+
        '</span>'+
        '<b>'+esc(c.title)+'</b>'+
        (keys.length ? '<span class="info-c-k">'+esc(keys.join(" · "))+'</span>' : '')+
        '<span class="info-c-go">자세히 보기'+icon("arrow",15)+'</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

/* ── 폐업 가이드 (§21-10) ─────────────────────────────────────────
   ⚠️⚠️ **폐업을 실패로 말하지 않습니다** (§6) — "잘 정리하는 것도
   사업입니다" 까지입니다. 빨강도 쓰지 않습니다 (주황 계열).
   ⚠️ 걸음 수는 `AM_PROCESS.closing` 을 **그 자리에서 세는 값**입니다. */
function MainClosing(){
  var steps = ((window.AM_PROCESS||{}).closing || []);
  if(!steps.length) return "";
  return '<section class="sec mcls"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">CLOSE</p>'+
      '<h2>폐업도 순서가 있습니다</h2>'+
      '<p>놓치면 손해가 되는 절차를 처음부터 끝까지 짚어 드립니다. '+
        '기한이 있는 것이 여럿입니다.</p></div>'+
    '<ol class="cls-g">'+steps.slice(0,6).map(function(st, i){
      return '<li><b>'+("0"+(i+1)).slice(-2)+'</b><span>'+esc(st.name)+'</span></li>';
    }).join("")+'<li class="cls-more"><span>그 밖에 '+(steps.length-6)+'걸음</span></li></ol>'+
    '<p class="row-cta">'+
      '<a class="btn btn-cd btn-lg" href="/closure">폐업 준비 시작하기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/tools/close">폐업 체크리스트</a>'+
    '</p>'+
  '</div></section>';
}

/* ── ⑬ 이용방법 다섯 걸음 (V2 §25) ───────────────────────────────
   ⚠️ **처음 오신 분이 설명 없이 쓰게 하는 것**이 목적입니다.
   ⚠️ **지킬 수 없는 약속을 적지 마세요** (절대 규칙 5) — 회신 시점은
   업체가 정하는 것이라 "몇 시간 안에" 를 적지 않습니다. */
/* ⚠️ 2026-10-06 마무리 지시서 §6 의 **여섯**입니다. **설명을 길게
   넣지 마세요** — 걸음마다 한 줄까지입니다. 길어지면 절차로 읽히고,
   절차로 읽히면 귀찮아 보입니다.
   ⚠️ `/about` · `/join` 의 **진행 셋**(`.how-*`)과 다른 것입니다 —
   그 셋은 견적 받는 차례이고 여기는 사이트 쓰는 차례입니다. */
var MAIN_HOW = [
  { ic:"target",   t:"현재 상황 선택",        p:"창업 · 운영 · 인수 · 양도 · 폐업 가운데 하나." },
  { ic:"grid",     t:"업종 선택",             p:"고르시면 그 업종에 필요한 것만 남습니다." },
  { ic:"book",     t:"필요한 정보 확인",      p:"무엇을 해야 하는지 순서대로." },
  { ic:"calc",     t:"비용 계산",             p:"도구에 직접 적어 숫자로 봅니다." },
  { ic:"search",   t:"서비스 · 업체 탐색",    p:"분야와 지역으로 추립니다." },
  { ic:"handover", t:"상담 · 견적 또는 인수인계", p:"한 번만 적으시면 같이 전달합니다." }
];
function MainHow(){
  return '<section class="sec mhow"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">HOW IT WORKS</p>'+
      /* ⚠️ 이름은 `brand.js` 에서 옵니다 — 손으로 적지 마세요.
         ⚠️ 조사는 `koWith()` 가 고릅니다. 걸음 수는 세는 값입니다. */
      '<h2>'+esc(koWith(amBrand(),"은는"))+' 이렇게 사용하세요.</h2>'+
      '<p>가입 없이, '+MAIN_HOW.length+'걸음입니다.</p>'+
    '</div>'+
    /* ⚠️⚠️ `.how-*` 는 `/about` · `/join` 의 **진행 셋**이 이미 씁니다 —
       그 이름으로 적었다가 두 화면을 통째로 깨뜨렸습니다. `.hiw-*` 입니다. */
    '<ol class="hiw-g">'+MAIN_HOW.map(function(h, i){
      return '<li class="hiw"><span class="hiw-n">STEP '+(i+1)+'</span>'+
        '<span class="hiw-i">'+icon(h.ic,22)+'</span>'+
        '<b>'+esc(h.t)+'</b><em>'+esc(h.p)+'</em></li>';
    }).join("")+'</ol>'+
    '<p class="sec-note">'+icon("info",15)+
      '업체 회신 시점은 업체가 정합니다 — 저희가 보장하지 않습니다.</p>'+
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
  /* ⚠️⚠️ **바탕이 아이보리가 아니라 옅은 회색입니다.** 마무리 지시서
     §1 의 차례에서 바로 위가 **연결 구간(크림)** 인데, 크림 ↔ 아이보리2
     는 ΔE **2.34** 로 기준(2.5) 아래라 **두 구간이 한 구간으로
     읽힙니다** (이 저장소가 이미 겪은 쌍입니다). 크림 ↔ 회색은 3.55 ·
     회색 ↔ 민트(아래 매장 구간)는 4 이상입니다 — 위아래를 같이 보고
     고른 값입니다. ⚠️ `paintTones()` 는 이 쌍을 **못 밉니다**: 크림은
     "warm" · 아이보리는 "ivory" 로 **묶음이 달라서** 겹치는 것으로
     세지 않습니다. 바꾸시려면 ΔE 를 직접 재 보세요. */
  return MainBand({ bg:"sec-gray", kicker:"PARTNERS", h:"사장님들이 찾는 업체",
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
/* ── SECTION 10 — 매장 · 시설 · 장비 (2026-10-06 마무리 지시서 §5) ──
   > "사업을 정리하면서 남는 매장과 시설, 장비와 집기가 새로운 사장님의
   >  시작에 다시 활용될 수 있습니다."

   ⚠️⚠️ **매물이 0건이어도 큰 EMPTY 를 만들지 않습니다** (§5 · §12).
   "아직 올라온 매장이 없습니다" 를 화면 하나만큼 깔면 손님은 기능
   하나가 아니라 **사이트 전체를 미완성**으로 읽습니다.
   그렇다고 **있는 척하지도 않습니다** — 차례는 이렇습니다.
     유용한 정보 → 체크리스트 → 지금 준비 상태(작게) → 다음 행동
   ⚠️⚠️ **체크리스트를 손으로 적지 마세요.** `AM_PROCESS["acq-in"]` 이
   이미 그 목록입니다 (권리금 · 매출 확인 · 현장 확인 · 임대차 승계가
   전부 들어 있고, 걸음마다 **실제로 있는** 글 · 업체 · 계산기가
   걸려 있습니다). 여기 또 적으면 두 곳이 어긋납니다.
   ⚠️⚠️ **매물이 들어오면 코드를 한 줄도 안 고치고** 카드로 바뀝니다 —
   아래 `L.length` 하나가 가릅니다 (§5 "자동으로 전환될 수 있는 구조"). */
var MAIN_ASSET_KIND = [
  { ic:"store", n:"매장",  d:"영업 중인 매장의 인수 · 양도", to:"/stores" },
  { ic:"tool",  n:"시설",  d:"기존 인테리어와 시설 활용",    to:"/assets" },
  /* ⚠️⚠️ **`fridge` 라는 아이콘은 없습니다.** `icon()` 은 모르는
     이름에 빈 문자열을 돌려줘서, 이 타일이 **덩그러니 비어** 있었습니다
     — 에러도 안 나고 전수 점검도 통과했습니다 (찍어 보고 알았습니다).
     이제 "아이콘 자리가 비었음" 이 전 화면에서 봅니다. */
  { ic:"snow",  n:"장비",  d:"주방기기 · 냉장 · 냉동 · POS",  to:"/assets?s=kitchen-eq" },
  { ic:"sofa",  n:"집기",  d:"테이블 · 의자 · 사업용 집기",   to:"/assets?s=furniture" }
];
function MainStores(){
  var L  = (window.AM_STORES||[]);
  var nA = (window.AM_ASSETS||[]).length;
  var kinds = '<ul class="mk-kind">'+MAIN_ASSET_KIND.map(function(k){
    return '<li><a href="'+esc(k.to)+'">'+
      '<span class="ic-t">'+icon(k.ic,24)+'</span>'+
      '<b>'+esc(k.n)+'</b><i>'+esc(k.d)+'</i></a></li>'; }).join("")+'</ul>';
  var body = L.length
    ? kinds+
      '<div class="mk-g">'+L.slice(0,6).map(function(s2){ return StoreCard(s2); }).join("")+'</div>'+
      '<p class="row-cta row-mid"><a class="btn btn-nv" href="/stores">'+
        '매장 전체 보기'+icon("arrow",18)+'</a></p>'
    : kinds+ MainTakeoverGuide(nA);
  /* ⚠️⚠️ **중립입니다** — 넘기시는 분과 받으시는 분이 같은 구간을
     봅니다. 한쪽 색으로 칠하면 다른 쪽에게 "여긴 내 자리가 아니네" 가
     됩니다 (`/stores` · `/assets` 를 중립으로 둔 것과 같은 까닭). */
  return MainBand({ bg:"sec-start", kicker:"TAKE OVER",
    h:"사업의 자산도<br class=\"br-m\"> 다음 사장님에게 이어질 수 있습니다.",
    lead:"사업을 정리하면서 남는 매장과 시설, 장비와 집기가 "+
         "새로운 사장님의 시작에 다시 활용될 수 있습니다.", body:body });
}
/* 매물이 아직 없을 때 — **유용한 정보**가 그 자리를 채웁니다 (§5 · §12) */
function MainTakeoverGuide(nAssets){
  var steps = ((window.AM_PROCESS||{})["acq-in"] || []).slice(0, 5);
  if(!steps.length) return "";
  return '<div class="mk-pre">'+
    '<h3 class="mk-pre-h">매장 인수를 알아보고 계신가요?</h3>'+
    '<p class="mk-pre-p">매장을 인수하기 전 확인해야 할 정보부터 '+
      '살펴보세요.</p>'+
    '<ol class="mk-pre-l">'+steps.map(function(st, i){
      return '<li><span class="mk-pre-n">'+("0"+(i+1)).slice(-2)+'</span>'+
        '<span class="mk-pre-t"><b>'+esc(st.name)+'</b>'+
          '<i>'+esc(st.lead)+'</i>'+
          '<span class="mk-pre-ls">'+StepLinks(st, "")+'</span></span></li>';
    }).join("")+'</ol>'+
    /* ⚠️ **0 을 숨기지 않습니다** — 다만 작게, 맨 아래에 둡니다 (§5).
       ⚠️ 숫자는 세는 값입니다. 자산이 들어와 있으면 그렇게 말합니다. */
    '<p class="mk-pre-n2">'+icon("info",15)+
      (nAssets
        ? '인수 가능한 매장 정보를 준비하고 있습니다. 시설 · 장비는 '+
          nAssets+'건 올라와 있습니다.'
        : '인수 가능한 매장 정보를 준비하고 있습니다.')+'</p>'+
    '<p class="row-cta row-mid">'+
      '<a class="btn btn-nv" href="/transfer">인수 · 양도 알아보기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o" href="/stores">매장 내놓기</a></p>'+
  '</div>';
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
    /* ⚠️⚠️ **2026-10-06 2차 §16** — 전에는 아래에 단추 둘이 나란히
       있어서, 넘기시는 분과 받으시는 분이 **어느 단추가 자기 것인지**
       를 읽어야 했습니다. 지금은 각 칸 안에 그 칸 사람의 단추가
       있습니다 (아래 줄은 그대로 둡니다 — 긴 화면에서 위 칸까지
       올라가지 않아도 되는 자리입니다).
       ⚠️ 한쪽을 크게 하거나 색을 세게 하지 마세요. 두 사람의 무게가
       같아야 합니다 — 이 구간이 하는 말이 바로 그것입니다. */
    '<p class="row-cta row-mid">'+
      '<a class="btn btn-cl" href="'+esc(quoteTo({cat:"transfer"}))+'">'+
        '내 매장 양도 준비하기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-st" href="/stores">인수 가능한 매장 보기'+icon("arrow",18)+'</a></p>'+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   창업 분야 · 운영 서비스 · 폐업 분야 (2026-10-06 2차 §18)
   ══════════════════════════════════════════════════════════════════
   §18 의 차례가 메인 아래쪽에 이 셋을 둡니다. **위쪽 맞춤 흐름을
   건너뛴 분**이 분야 이름으로 바로 들어가는 길입니다.

   ⚠️⚠️ **카드가 아니라 칩입니다.** 분류 스물다섯을 카드로 깔면
   1440px 에서 화면 두 개가 되고, 그 순간 메인이 전화번호부가 됩니다
   (§7 · §18 — "메인에서 모든 것을 자세히 설명하지 않는다").
   ⚠️ 이름 · 아이콘 · 주소가 전부 `catalog.js` · `journey.js` 에서
   옵니다. 화면에 적지 마세요.
   ⚠️ 비면 구간째 빠집니다 (절대 규칙 2 — "준비 중" 을 찍지 않습니다). */
function ChipBand(o){
  if(!o.items.length) return "";
  /* ⚠️ `cls` 는 **검사가 구간 차례를 세는 표시**입니다 (`check.js` 의
     "메인 구간 차례가 지시서와 같다"). 빼면 그 구간이 "?" 로 읽혀
     차례 검사가 실패합니다. */
  return '<section class="sec '+esc(o.bg||"sec-white")+' '+esc(o.cls||"")+'"><div class="w">'+
    '<div class="sec-hd sec-hd-row"><div>'+
      '<h2>'+esc(o.h)+'</h2>'+
      '<p>'+esc(o.lead)+'</p></div>'+
      (o.all ? '<a class="sec-hd-all" href="'+esc(o.all[0])+'">'+esc(o.all[1])+
        icon("arrow",16)+'</a>' : '')+
    '</div>'+
    '<ul class="cat-chips">'+o.items.map(function(x){
      return '<li><a href="'+esc(x.to)+'">'+icon(x.ic,17)+esc(x.n)+'</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}
/* 한 쪽(창업 · 폐업)의 분류 전부 — ⚠️ `amCatsFor(null, side)` 가
   그 쪽 분류를 **빠짐없이** 돌려줍니다 (차례에서 빠진 것도 뒤에
   붙여 줍니다 — 잘라 내면 그 기능이 아예 없는 것이 됩니다). */
function sideChips(side){
  var iq = nowQS("i") ? ("?i=" + encodeURIComponent(nowQS("i"))) : "";
  return (window.amCatsFor ? amCatsFor(null, side) : []).map(function(c){
    return { n:c.name, ic:c.icon, to:catTo(c) + iq };
  });
}
function MainStartCats(){
  var L = sideChips("start");
  return ChipBand({ bg:"sec-white", cls:"mscat", items:L, all:["/startup","창업 전체 보기"],
    h:"창업에 필요한 분야 " + L.length,
    lead:"무엇을 찾아야 하는지 이미 아시면 여기서 바로 들어가세요." });
}
function MainCloseCats(){
  var L = sideChips("close");
  return ChipBand({ bg:"sec-close", cls:"mccat", items:L, all:["/closure","폐업 전체 보기"],
    h:"폐업 · 정리에 필요한 분야 " + L.length,
    lead:"기한이 있는 것이 여럿입니다. 순서가 곧 돈입니다." });
}
/* 운영 서비스 — ⚠️ `AM_OPS` 한 곳입니다 (§6 이 적은 운영 과제).
   창업도 폐업도 아니라 중립(파랑)으로 둡니다. */
function MainOps(){
  var iq = nowQS("i") ? ("&i=" + encodeURIComponent(nowQS("i"))) : "";
  var L = (window.AM_OPS||[]).map(function(o){
    var cat = o.cat && window.amCat ? amCat(o.cat) : null;
    var to  = o.to;
    if(!to && cat) to = catTo(cat) + (o.sub ? "?s=" + encodeURIComponent(o.sub) + iq
                                            : (iq ? "?" + iq.slice(1) : ""));
    return to ? { n:o.name, ic:o.icon, to:to } : null;
  }).filter(Boolean);
  return ChipBand({ bg:"sec-gray", cls:"mops", items:L, all:["/operation","운영 전체 보기"],
    h:"운영하면서 필요한 것 " + L.length,
    lead:"문을 연 뒤에 생기는 일입니다. 막히는 자리마다 맡길 곳이 있습니다." });
}

/* ══════════════════════════════════════════════════════════════════
   브랜드 철학 (2026-10-06 2차 §17)
   ══════════════════════════════════════════════════════════════════
   ⚠️ **장문의 회사소개가 아닙니다.** 이름을 기억시키는 자리입니다 —
   §17 이 직접 그렇게 적었습니다. 길어지면 아무도 안 읽습니다.
   ⚠️ 이름은 `brand.js` 한 곳에서 옵니다. 조사는 `koWith()` 입니다. */
/* ⚠️ 안쪽만 돌려줍니다 — 브랜드 스토리 구간(`MainStory()`) 안입니다.
   `MainWhy()` 는 되돌리실 때를 위해 남겨 두었습니다. */
function mainWhyIn(){
  var nm = amBrand();
  return '<div class="mwhy-c">'+
      '<p class="eyebrow">WHY</p>'+
      /* ⚠️ 여기는 조사를 **안 붙입니다.** "…인가요" 는 받침이 있든
         없든 꼴이 같습니다 ("책인가요" · "나무인가요") — `koWith()`
         를 넣었다가 "인수인계가인가요?" 가 됐습니다. */
      '<h2>왜 '+esc(nm)+'인가요?</h2>'+
      '<p class="mwhy-p">사업은 시작하는 사람만 있는 것이 아닙니다.</p>'+
      '<ul class="mwhy-l">'+
        '<li>누군가는 <b>시작</b>하고,</li>'+
        '<li>누군가는 <b>운영</b>하고,</li>'+
        '<li>누군가는 다음 사람에게 <b>넘기고</b>,</li>'+
        '<li>누군가는 <b>정리</b>합니다.</li>'+
      '</ul>'+
      '<p class="mwhy-e">'+esc(koWith(nm,"은는"))+' 그 모든 순간을 잇습니다.</p>'+
    '</div>';
}
function MainWhy(){
  return '<section class="sec sec-ivory mwhy"><div class="w">'+
    mainWhyIn()+'</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 13 — 브랜드 스토리 (2026-10-06 마무리 지시서 §1)
   ══════════════════════════════════════════════════════════════════
   메인의 **마지막 구간**입니다. 세 덩이가 한 구간에 들어갑니다 —
     ① 이 사이트가 하는 일 한 문장 + 가치 넷   (`mainValueIn()`)
     ② 우리가 다루는 **범위** 숫자 셋          (`mainScaleIn()`)
     ③ 왜 이 이름인가                          (`mainWhyIn()`)

   ⚠️⚠️ **②는 실적이 아니라 범위입니다.** 회원 수 · 거래액 · 만족도는
   지금 전부 0 이고 적으면 표시 · 광고의 공정화에 관한 법률 제3조입니다.
   숫자 셋은 `AM_INDUSTRIES` · `AM_CATS` 를 그 자리에서 세는 값이고,
   "분류 기준이며 등록된 업체 수가 아닙니다" 줄을 **지우지 마세요.**
   ⚠️ 셋을 다시 세 구간으로 떼지 마세요 — 지시서 §1 의 차례가
   열넷(화면 열셋 + 푸터)입니다. */
function MainStory(){
  return '<section class="sec sec-ivory mval"><div class="w">'+
    mainValueIn()+ mainScaleIn()+ mainWhyIn()+
  '</div></section>';
}

/* ── ⑪ 사장님 도구 ────────────────────────────────────────────────
   ⚠️⚠️ **아이콘을 여기에 손으로 적지 마세요.** 도구마다 `icon` 이
   `tools.js` 에 **이미 적혀 있는데**, 여기에 key → 아이콘 표를 따로
   두고 있었습니다. 도구가 여섯에서 열셋이 되자 표에 없는 **일곱이
   전부 같은 기본 아이콘(`gauge`)** 으로 나왔습니다 — 폰에서는 한 줄에
   하나씩이라 같은 그림이 일곱 번 이어졌습니다. 에러도 안 나고 검사도
   통과했습니다 (랜딩 미니카드 아이콘을 손으로 적었던 것과 **같은
   사고**입니다). 이제 `t.icon` 을 그대로 씁니다.
   ⚠️ 색만 여기서 붙입니다 — **묶음**(`AM_TOOL_GROUPS`)을 따릅니다.
   색은 뜻입니다 (§27): 초록 시작 · 파랑 계산 · 청록 남는 돈 ·
   주황 정리. 도구를 더해도 묶음만 맞으면 저절로 따라옵니다. */
var MAIN_TOOL_TONE = {
  "시작하기 전":"st", "얼마를 팔아야 하나":"bl",
  "얼마가 남나":"tl", "정리할 때":"cl"
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
      var tone = MAIN_TOOL_TONE[t.grp] || "bl";
      return '<li class="hv-'+tone+'"><a href="/tools/'+esc(t.key)+'">'+
        '<span class="ic-t">'+icon(t.icon,26)+'</span>'+
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
/* ── SECTION 12 — 파트너 입점 (2026-10-06 마무리 지시서 §7) ───────
   ⚠️ 소비자 영역과 **시각적으로 구분**합니다 — 이 저장소에서 어두운
   면을 쓸 수 있는 자리가 둘뿐이고 그중 하나가 이 카드(`.mjn-c`)입니다.
   ⚠️⚠️ **지어낸 신뢰를 만들지 마세요** (§7) — 리뷰 · 평점 · 거래수 ·
   프로젝트수 · 고객수 · 인증 · 추천 · 순위. 아래 예시 카드는 그래서
   **구조만** 보여 줍니다 (업체명 · 한 줄 소개 · 전문 서비스 · 전문
   업종 · 서비스 지역 · 포트폴리오 건수까지). 배지와 평점이 붙은 전체
   미리보기는 **업체 사장님께 보여 드리는 `/sample`** 에 있습니다.
   ⚠️⚠️ **"SAMPLE · 입점 화면 예시" 가 제일 먼저 읽혀야 합니다** —
   지어낸 업체가 실제 업체로 읽히면 표시·광고의 공정화에 관한 법률
   제3조입니다. 카드 자체는 **누를 수 없습니다.** */
function mainSampleCard(){
  if(window.AM_SAMPLE_ON === false) return "";
  if((window.AM_PROVIDERS||[]).length) return "";   /* 업체가 들어오면 사라집니다 */
  var p = (typeof amSample === "function") ? amSample("provider") : null;
  if(!p) return "";
  var subs = (p.subs||[]).map(function(k){
    return (typeof amSubName === "function") ? amSubName(k) : k; }).filter(Boolean);
  var inds = (p.industries||[]).map(function(k){
    var i = (typeof amIndustry === "function") ? amIndustry(k) : null;
    return i ? i.name : ""; }).filter(Boolean);
  var regs = (p.regions||[]).map(function(k){
    return (typeof amRegionName === "function") ? amRegionName(k) : ""; }).filter(Boolean);
  var row = function(k, v){
    return v ? '<li><b>'+esc(k)+'</b><span>'+esc(v)+'</span></li>' : ""; };
  return '<div class="mjn-smp">'+
    '<p class="mjn-smp-k">'+icon("info",14)+'SAMPLE · 입점 화면 예시</p>'+
    '<div class="mjn-smp-c">'+
      '<b class="mjn-smp-n">'+esc(p.name)+'</b>'+
      '<p class="mjn-smp-i">'+esc(p.intro)+'</p>'+
      '<ul class="mjn-smp-l">'+
        row("전문 서비스", subs.join(" · "))+
        row("전문 업종",   inds.join(" · "))+
        row("서비스 지역", regs.concat(p.gu||[]).join(" · "))+
        row("포트폴리오",  (p.portfolio||[]).length ? (p.portfolio||[]).length+"건" : "")+
      '</ul>'+
    '</div>'+
    /* ⚠️ 평점 · 후기 · 거래수를 여기 붙이지 마세요 (§7). */
    '<p class="mjn-smp-n2">실제 업체가 아닙니다. 등록하시면 이런 짜임새로 '+
      '나갑니다 — 전체 미리보기는 업체 상세 예시에서 보실 수 있습니다.</p>'+
  '</div>';
}
function MainJoin(){
  var cats = (window.AM_CATS||[]).filter(function(c){ return c.kind === "provider"; });
  return '<section class="sec mjn"><div class="w">'+
    '<div class="mjn-c">'+
      '<div class="mjn-t">'+
        '<p class="mjn-k">PARTNER</p>'+
        '<h2>사장님 고객을 만나고 계신가요?</h2>'+
        /* ⚠️ 이름이 "파트너" 를 꾸미는 자리라 조사가 붙지 않습니다 —
           koWith 를 쓰면 "인수인계가 파트너로" 가 됩니다. */
        '<p>인테리어, 세무, 노무, 철거, 설비, POS, 마케팅 등 '+
          '사업자를 대상으로 서비스를 제공한다면 '+
          esc(amBrand())+' 파트너로 함께할 수 있습니다.</p>'+
        (cats.length ? '<ul class="mjn-l">'+cats.slice(0,10).map(function(c){
          return '<li>'+icon(c.icon,18)+esc(c.name)+'</li>'; }).join("")+'</ul>' : '')+
      '</div>'+
      '<p class="mjn-go"><a class="btn btn-w" href="/join">'+
        '파트너 입점 알아보기'+icon("arrow",18)+'</a></p>'+
    '</div>'+
    mainSampleCard()+
  '</div></section>';
}

/* ⚠️ **구간을 더하거나 차례를 바꾸시려면 지시서를 먼저 고치세요.**
   `check.js` 의 "메인 구간 차례가 지시서와 같다" 가 **구간 열셋**을
   셉니다 — 사업 단계 열은 `<nav>` 라 그 셈에 안 들어가고, "히어로
   에서 바로 찾고 바로 갈라진다" 가 그 열을 따로 봅니다. */
function PageMain(){
  /* ⚠️⚠️ **2026-10-06 "재설계 — 계속 진행 및 최종 마무리 지시서" §1 의
     차례**입니다. **열넷**이고 마지막 Footer 는 `#view` 밖
     (`chrome.js`)이라 여기서는 **열셋**입니다.

       01 HERO                .mh      머리 띠 + 두 판 + 떠 있는 검색 패널
       02 지금 어떤 상황       .mjy     상황 넷 — 고르개 (`?j=`)
       03 어떤 업종            .mi-g    업종 열넷 — 거르개 (`?i=`)
       04 맞춤 로드맵          .mroad   ★ 02 + 03 의 결과 (순서 + 분야)
       05 핵심 서비스 탐색     .msvc    대표 서비스 열둘
       06 사장님 도구          .mt-g    계산기 열셋
       07 사장님 정보센터      .minfo   글 예순 편
       08 인수 ↔ 인계          .mbr     한 사장님의 끝이 다른 분의 시작
       09 업체 찾기            PARTNERS
       10 매장 · 시설 · 장비    TAKE OVER
       11 이용방법             .mhow
       12 파트너 입점          .mjn     + 입점 화면 예시 카드
       13 브랜드 스토리        .mval    가치 넷 + 범위 숫자 + 왜 이 이름인가
       14 Footer               ← `#view` 밖 (`chrome.js`)

     ⚠️⚠️ **사업 단계 여섯(`MainStage()`)은 `<section>` 이 아니라
     `<nav>` 입니다** — 링크 목록이라 그게 맞고, 그래서 위 열셋 셈에
     **들어가지 않습니다.** 지우면 `/g/:stage` **여섯 화면 중 다섯이
     사이트 안에서 갈 길을 잃습니다** (검색 패널 탭이 `/g/transfer`
     하나만 가리킵니다) — 색인은 되어 있는데 아무 데서도 안 걸리는
     화면이 됩니다. 04 가 "내 상황의 순서" 라면 이 열은 "사업 전체의
     흐름" 이라 바로 뒤가 제자리입니다.

     ⚠️⚠️ **지시서 §1 — "특별한 이유가 없다면 DELETE 하지 않는다."**
     차례를 열넷으로 맞추면서 메인에서 내려온 것은 **구간 일곱**이고,
     함수는 **그대로 두었습니다** (되돌리실 일이 생기면 아래 한
     줄입니다). 전부 갈 곳이 남아 있는지 하나씩 확인했습니다 —

       · `MainValue()` `MainScale()` `MainWhy()`
                          → 셋 다 **13 브랜드 스토리 안으로 들어갔습니다**
                            (`MainStory()`). 내용은 한 글자도 안 뺐습니다.
       · `MainFeature()`  → 큰 카드 셋(프랜차이즈 · 점포 · 인테리어)이
                            가리키던 곳은 05 서비스 열둘(인테리어) ·
                            10 매장 구간 · 푸터 프랜차이즈가 받습니다
       · `MainFranchise()`→ `/franchise` 는 **검색 패널 탭** · 푸터
                            서비스 칸 · 04 로드맵 첫 걸음이 보냅니다
       · `MainStartCats()` `MainCloseCats()`
                          → 04 로드맵 아래가 **그 쪽 분야 전부**를
                            냅니다 (토글로 창업 ↔ 정리). 거기에
                            "전체보기" 로 `/startup` · `/closure` 도
                            같이 있습니다
       · `MainOps()`      → 운영 과제 열여섯은 `/operation` 이 그대로
                            들고 있고, 02 상황 카드가 그리로 보냅니다
       · `MainClosing()`  → 폐업 순서는 04 로드맵이 **상황별로** 냅니다
                            (`?j=closing`). 히어로 오른쪽 판도 `/closure`
                            입니다
       · `MainPrice()` `MainReviews()` `MainTwo()`
                          → 전부터 안 쓰는 셋입니다 (견적 0건 · 후기
                            0건 · 히어로가 그 두 장이 됐습니다)

     ⚠️ 위를 메인에 **다시 끼워 넣지 마세요.** 지시서가 "메인에서 모든
     기능을 볼 필요는 없다" 고 적었습니다 — 구간이 늘수록 "그래서
     여기서 뭘 하지" 가 묻힙니다. 늘리시려면 지시서를 먼저 고치고
     `check.js` 의 `want` 를 같이 고치세요.

     ⚠️⚠️ **가짜 신뢰 숫자를 넣지 마세요.** 회원 수 · 거래건수 ·
     만족도 · 평점 · 시공건수는 지금 전부 0 이고, 적는 순간 표시 ·
     광고의 공정화에 관한 법률 제3조입니다. 13 의 숫자(업종 14 ·
     분야 25 · 서비스 183)는 실적이 아니라 **우리가 다루는 범위**이고
     데이터를 그 자리에서 세는 값입니다 — 구간 안에 "등록된 업체 수가
     아닙니다" 를 ⓘ 로 같이 냅니다. 그 줄을 지우지 마세요. */
  return MainHero()+
         MainJourney()+ MainIndustry()+ MainRoadmap()+ MainStage()+
         MainServices()+ MainTools()+ MainContent()+ MainBridge()+
         MainProviders()+ MainStores()+ MainHow()+ MainJoin()+
         MainStory();
}


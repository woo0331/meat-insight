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
/* ══════════════════════════════════════════════════════════════════
   ① HERO — 두 사장님의 사진 + 창업 / 폐업 선택 카드 둘
   ══════════════════════════════════════════════════════════════════
   **2026-10-08 "최종 디자인 통합 및 기능 완성 작업지시서" §5 · §6.**

   ⚠️⚠️ **사진이 이 화면의 주인공입니다.** 2026-10-07 전면개편을 통째로
   무른 까닭이 **이것 하나**였습니다 — 그때 히어로는 사진 두 장을 옅은
   배경으로 깔고 그 위에 흰 카드를 얹는 꼴이라, 사장님이 보시기에
   "이미지가 들어간" 화면이 아니었습니다. 그래서 여기서는 사진을
   **띠로 꽉 채우고**(`.mh-ph`) 글은 그 **가운데 밝은 자리**에 둡니다.
   ⚠️ 막(`::after`)을 짙게 하지 마세요 — 글자가 읽히는 선까지만입니다.

   ⚠️⚠️ **사진 안에 글자를 합성하지 마세요** (지시서 §2-1 — "이미지
   자체를 배경으로 넣어 웹페이지처럼 보이게 하는 방식은 금지").
   제목 · 서브 · 배지 · 단추가 전부 HTML 이고 번역도 선택도 됩니다.

   ⚠️ 사진이 0장이면 띠째 빠지고 크림 바탕이 자리를 지킵니다 —
   "이미지 준비 중" 을 찍지 않습니다 (절대 규칙 2). */
/* ⚠️⚠️ **2026-10-11 최종 디자인 지시서 §3** — 사진이 **오른쪽 한 장**
   입니다 (전에는 좌우 두 장). 왼쪽은 흰색 반투명 그라데이션이고 글이
   거기 섭니다.
   ⚠️ 사진이 없으면 띠를 **아예 안 그립니다** — 옅은 빈 액자를 깔면
   그게 "준비 중" 으로 읽힙니다 (절대 규칙 2).
   ⚠️ 남은 한 장(`hero-close`)은 06 상담 구간이 받습니다 — 자리를
   잃은 사진이 없게 하려고 같이 옮겼습니다. */
function MainHeroPhotos(){
  if(!hasPhoto("hero-start")) return "";
  return '<div class="mh-ph" aria-hidden="true">'+
    '<span class="mh-ph-r">'+photoBox("hero-start","",true)+'</span>'+
  '</div>';
}

/* ⚠️⚠️ **창업은 블루 · 폐업은 오렌지입니다** (지시서 §24 · §6 · §12).
   2026-09-30 지시서가 창업을 **초록**으로 못박아 두었던 자리인데,
   2026-10-08 지시서가 메인 브랜드 컬러를 블루로 두고 창업을 거기에
   맞췄습니다 — 시안에서도 창업 카드 · 창업 버튼 · 로고가 전부 한
   파랑입니다. ⚠️ **폐업은 그대로 주황이고, 빨강으로 넘기지 마세요** —
   빨강은 "폐업은 나쁜 것" 이라는 말이 됩니다 (이 저장소가 여러 곳에
   못박아 둔 것입니다). `check.js` 가 폐업 쪽 색의 초록 성분을 봅니다.

   ⚠️ **두 카드의 크기 · 무게가 같습니다.** 폐업 쪽을 좁히거나 흐리게
   만들면 그게 "덜 중요한 것" 이라는 말입니다.
   ⚠️ 사진 자리는 `side-start` · `side-close` 입니다 — 비어 있으면
   아이콘이 자리를 지키고, 넣으시면 **코드를 한 줄도 안 고치고**
   사진이 들어옵니다 (`js/data/photos.js` 에 한 줄). */
var MAIN_PICK = [
  { cls:"st", photo:"side-start", to:"/startup", ic:"seed",
    badge:"새로운 시작", t1:"창업", t2:"준비하고 있어요",
    checks:["업종별 맞춤 준비순서", "필요한 업체와 정보", "실제 사례와 가이드"],
    cta:"창업 시작하기" },
  { cls:"cl", photo:"side-close", to:"/closure", ic:"box",
    badge:"마무리와 새로운 연결", t1:"폐업 · 정리", t2:"준비하고 있어요",
    checks:["매장 양도 · 시설 정리", "폐업 절차와 세무 정리", "철거 · 원상복구까지"],
    cta:"폐업 · 정리 시작하기" }
];
/* ⚠️⚠️ **카드 전체가 눌립니다** (지시서 §6). 그래서 안에 또 `<a>` 를
   넣지 마세요 — `<a>` 안의 `<a>` 는 브라우저가 쪼개 버립니다. 아래
   "창업 시작하기 →" 는 **표시**이지 따로 누르는 단추가 아닙니다. */
function MainPickCard(o){
  var ph = hasPhoto(o.photo);
  return '<a class="hpk hpk-'+esc(o.cls)+'" href="'+esc(o.to)+'">'+
    '<span class="hpk-b">'+
      /* ⚠️ 배지 옆에 **색 원판 아이콘**을 둡니다 — 글만 있는 카드는
         둘이 한 덯어리로 읽힙니다. ⚠️ 아이콘은 `MAIN_PICK` 의 `ic` 한 줄이고
         원판 색은 `--pk` 가 정합니다 — 화면에 색을 적지 마세요. */
      '<span class="hpk-top">'+
        '<span class="hpk-ic" aria-hidden="true">'+icon(o.ic, 26)+'</span>'+
        '<b class="hpk-bd">'+esc(o.badge)+'</b>'+
      '</span>'+
      /* ⚠️ 두 줄을 **각자 태그로** 감쌉니다 — 맨글과 태그를 섞으면
         grid 에서 칸이 갈리고, block 으로 피하면 "문장 속 block" 으로
         걸립니다 (이 저장소에서 네 번 만든 버그). */
      '<b class="hpk-h"><i class="hpk-h1">'+esc(o.t1)+'</i>'+
        '<i class="hpk-h2">'+esc(o.t2)+'</i></b>'+
      /* ⚠️ 체크 셋은 **그 화면이 실제로 하는 일**입니다 (시안).
         지어낸 성과 · 숫자가 아니라 /startup · /closure 가 지금 내고
         있는 것이라, 하나씩 눌러서 맞는지 확인했습니다. */
      '<span class="hpk-ck">'+(o.checks||[]).map(function(c){
        return '<i>'+icon("check",15)+esc(c)+'</i>'; }).join("")+'</span>'+
      '<span class="hpk-go">'+esc(o.cta)+
        '<em aria-hidden="true">'+icon("arrow",17)+'</em></span>'+
    '</span>'+
    /* ⚠️⚠️ **사진이 없으면 액자째 안 그립니다** (절대 규칙 2). 옅은
       틴트 상자를 깔아 두면 카드 둘이 "준비 중" 으로 읽힙니다 —
       단계 카드 여섯에서 이미 걷어낸 자리입니다. 사진을
       `side-start` · `side-close` 에 넣으시면 **코드를 한 줄도 안
       고치고** 시안처럼 액자가 생깁니다. */
    (ph ? '<span class="hpk-ph" aria-hidden="true">'+photoBox(o.photo)+'</span>' : "")+
  '</a>';
}

function MainHero(){
  return '<section class="mh">'+
    MainHeroPhotos()+
    '<div class="mh-in"><div class="w"><div class="mh-tx">'+
      /* ⚠️ 화면마다 h1 은 **딱 하나**입니다. 아래 구간들은 전부 h2 입니다. */
      /* ⚠️⚠️ **2026-10-11 지시서 §3 의 카피 그대로**입니다 — 다만
         브랜드 이름은 `brand.js` 한 곳에서 옵니다. 지시서가 적은
         "스토어웨이" 는 **주소**이고, 손님에게 보이는 이름은 하나
         입니다 (2026-10-06 §2 · 2026-10-08 §4).
         ⚠️ 조사를 손으로 적지 마세요 — 받침 있는 이름으로 바뀌면
         "인수인계이" 가 됩니다. `koWith()` 가 고릅니다. */
      '<h1 class="mh-h1">사장님의 <em class="mh-pt">모든 순간</em>,'+
        '<br class="br-m"> '+esc(koWith(amBrand(), "이가"))+' 함께합니다.</h1>'+
      /* ⚠️ `<br class="br-m">` 뒤에는 **띄어쓰기를 하나** 둡니다 —
         좁아지면 이 줄바꿈이 사라지는데, 없으면 앞뒤 낱말이 붙습니다. */
      '<p class="mh-lead">매장 창업, 운영, 양도양수, 폐업에 필요한'+
        '<br class="br-m"> 모든 서비스를 한곳에서 쉽고 빠르게.</p>'+
      /* ⚠️⚠️ **장식용 검색창을 만들지 마세요** (§3 "검색어 입력 시 실제
         서비스 목록과 연결한다"). 이 칸은 헤더 통합검색과 **같은
         `mainFind()`** 를 부릅니다 — 적으신 말이 있으면 `/search?q=`,
         없으면 업체찾기로 갑니다. */
      '<form class="mh-find" onsubmit="return mainFind(event)" role="search">'+
        '<span class="mh-find-i" aria-hidden="true">'+icon("search",20)+'</span>'+
        '<input id="msrQ" type="search" autocomplete="off" '+
          'aria-label="업종 · 서비스 검색" '+
          'placeholder="업종이나 서비스를 적어 보세요 — 카페 창업, 철거, POS">'+
        '<button class="btn btn-b" type="submit">검색'+icon("arrow",17)+'</button>'+
      '</form>'+
      MainHeroChips()+
    '</div></div></div>'+
  '</section>';
}

/* ⚠️⚠️ **"인기 검색어" 라고 쓰지 마세요.** 지시서 §3 이 그 이름으로
   적었지만 저희는 **검색 기록을 하나도 모으지 않아서** 무엇이 인기인지
   모릅니다 (2026-10-06 마무리 지시서 §3 이 직접 금지한 말이고
   `check.js` 가 그 낱말을 찾습니다). 딱지는 **바로가기**입니다.
   ⚠️⚠️ **여덟 전부 쳐 보고 결과가 나오는 것을 확인했습니다.** 손님은
   띄어쓰기를 안 하는데 분류 이름은 띄어 두어서, 전에 추천 네 개가
   **전부 0건**이던 자리입니다 — 칩을 더하실 때는 반드시 쳐 보세요. */
/* ⚠️⚠️ **쳐 보고 셋을 바꿨습니다.** 지시서 §3 의 여덟 가운데
   `인력채용` 은 **0건**, `양도양수` 는 1건, `세무 · 회계` 는 1건
   이었습니다 — 손님이 그 말을 치면 빈 화면을 봅니다. 뜻이 같고
   결과가 나오는 말로 바꿨고, 괄호 안이 재 본 건수입니다. */
var MAIN_CHIP8 = ["인테리어",   /* 11 */ "상권분석",  /*  3 */
                  "매장 양도",  /* 27 */ "권리금",    /* 15 */
                  "철거",       /* 24 */ "세무",      /* 21 */
                  "마케팅",     /*  4 */ "직원 채용"  /* 14 */];
function MainHeroChips(){
  return '<ul class="mh-chip">'+
    '<li class="mh-chip-k">바로가기</li>'+
    MAIN_CHIP8.map(function(q){
      return '<li><a class="chip" href="/search?q='+encodeURIComponent(q)+'">'+
        esc(q)+'</a></li>';
    }).join("")+'</ul>';
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
var MAIN_SVC8 = ["store", "interior", "equip", "it",
                 "admin", "marketing", "demolish", "clean"];
/* ⚠️⚠️ **컬러 아이콘은 분류 key 로 고릅니다** (2026-10-09 지시서 §3).
   `iconArt()` 에 같은 이름이 있으면 그것을, 없으면 `icon()` 의 선형
   아이콘이 자리를 지킵니다 — 비는 칸이 생기지 않습니다 (절대 규칙 2).
   ⚠️ 여기에 아이콘 이름을 **따로 적지 마세요.** 분류 key 와 같은
   이름으로 그려 두었습니다 (손으로 적은 표가 어긋났던 자리가 이
   저장소에 둘 있습니다 — 랜딩 미니카드 · 도구 아이콘). */
/* ── 우리가 다루는 범위 ────────────────────────────
   ⚠️⚠️ **실적이 아니라 범위입니다.** 회원 수 · 거래액 · 만족도는
   지금 0 이고 지어내면 절대 규칙 1 위반입니다. 여기 세 숫자는
   `AM_INDUSTRIES` · `AM_CATS` 를 **그 자리에서 세는 값**이라
   분류를 늘리면 저절로 따라옵니다 — 손으로 고쳐 쓸 자리가 없습니다.
   ⚠️⚠️ **"업체 수가 아니다" 줄을 지우지 마세요.** 숫자만 크게 띄우면
   "업체가 183곳" 으로 읽힙니다 (2026-10-03 지시서 §20).
   ⚠️ **`n+` 꼴로 쓰지 마세요** — 부풀린 값입니다. 센 값은 그냥 183 입니다.
   ⚠️ 데이터가 비면 **줄째 빠집니다** (절대 규칙 2). */
function MainScopeStrip(){
  var ind = (window.AM_INDUSTRIES || []).length;
  var cat = (window.AM_CATS || []).length;
  var sub = (window.AM_CATS || []).reduce(function(a, c){
    return a + ((c.items || []).length); }, 0);
  if(!ind || !cat || !sub) return "";
  var n = [[ind, "업종"], [cat, "서비스 분야"], [sub, "세부 서비스"]];
  return '<div class="msvc-sc">'+
    '<ul class="msvc-sc-g">'+n.map(function(x){
      return '<li><b>'+x[0]+'</b><i>'+esc(x[1])+'</i></li>'; }).join("")+'</ul>'+
    '<p class="msvc-sc-n">'+icon("info",14)+
      ' 서비스 <b>분류 기준</b>이며 등록된 업체 수가 아닙니다.</p>'+
  '</div>';
}

/* ══════════════════════════════════════════════════════════════════
   02 전문관 넷 + 서비스 탐색 (2026-10-11 UI/UX 지시서 §2 · §4 · §5)
   ══════════════════════════════════════════════════════════════════
   > §2 — "창업 준비(블루) · 매장 운영(민트) · 매장 양도양수(퍼플) ·
   >  폐업 · 정리(오렌지) 넷을 밝고 세련된 카드형으로. PC 4열."
   > §5 — "전문관 선택 시 해당 서비스 메뉴 표시 · 대표 서비스 우선 ·
   >  전체보기에서 모든 서비스 · 기존 상세페이지와 연결."

   ⚠️⚠️ **카드를 누르면 화면을 떠나지 않습니다.** 고른 전문관이
   주소(?h=)에 실리고 아래 격자만 바뀝니다 — 뒤로 가기 · 새로고침 ·
   링크 공유에 살아남습니다. 그 전문관 화면으로 아주 가는 길은
   **전체보기** 단추입니다 (§5 의 두 가지는 다른 일입니다).
   ⚠️ 카드와 격자는 data-keep 입니다 — 맨 위로 올라가 버리면 무엇이
   바뀌었는지 못 봅니다.

   ⚠️⚠️ **카드 전체가 눌립니다 — 안에 또 a 태그를 넣지 마세요.**
   오른쪽의 화살표는 **표시**이지 따로 누르는 단추가 아닙니다.

   ⚠️ 서비스 이름 · 주소 · 색은 전부 halls.js → catalog.js 에서
   옵니다. **화면에 적지 마세요** — 분류가 늘면 어긋납니다. */
/* 전문관 카드에 깔 사진 — 사장님이 주신 넷을 뜻이 맞는 전문관에
   붙였습니다. ⚠️ 사진이 없으면 그라디언트만 섭니다 (빈 액자를 깔지
   않습니다 · 절대 규칙 2). */
/* ⚠️ 뜻이 맞아야 합니다 — 처음에 폐업 카드에 **CCTV** 사진을
   붙였다가 찍어 보고 고쳤습니다 (CCTV 는 IT · 보안이지 폐업이
   아닙니다). 지금은 도면 → 창업 · POS/CCTV → 운영 · 주방장비 →
   양도양수 · 청소용품 → 폐업 정리입니다. */
var HALL_PH = { startup:"svc-interior", operation:"svc-it",
                transfer:"svc-equip",  closure:"svc-clean" };

function MainHalls(){
  var L = (window.AM_HALLS || []);
  if(!L.length) return "";
  var cur = amHall(nowQS("h"));

  var cards = '<ul class="mhall-g">'+L.map(function(h){
    var on = (h.key === cur.key);
    return '<li><a class="mhall-c hall-'+esc(h.tone)+(on?" is-on":"")+'"'+
      ' href="/?h='+esc(h.key)+'" data-keep aria-current="'+(on?"true":"false")+'">'+
      /* ⚠️ 사진이 있으면 카드 **바탕**으로 깔립니다 (글은 그 위 HTML).
         사장님이 주신 넷이 267~324px 정사각이라 900px 이상 가로를
         요구하는 다른 자리에는 늘리지 않고는 못 넣습니다 — 카드가
         288×168 이라 여기가 제일 덜 늘리는 자리입니다. */
      (HALL_PH[h.key] && hasPhoto(HALL_PH[h.key])
        ? '<span class="mhall-bg" aria-hidden="true">'+photoBox(HALL_PH[h.key])+'</span>'
        : '')+
      '<span class="mhall-i" aria-hidden="true">'+icon(h.ic, 30)+'</span>'+
      '<b>'+esc(h.name)+'</b>'+
      '<i>'+esc(h.lead)+'</i>'+
      '<em class="mhall-a" aria-hidden="true">'+icon("arrow",18)+'</em>'+
    '</a></li>'; }).join("")+'</ul>';

  var tiles = '<ul class="hsv-g">'+(cur.items||[]).map(function(it){
    var c    = it.cat ? amCat(it.cat) : null;
    var tone = it.tone || (c && c.tone) || "t7";
    /* ⚠️⚠️ **하위를 집어서 가리키는 칸에 분류의 하위 셋을 내면 안
       됩니다.** `인허가 · 행정`(admin/permit) 아래에 "세무사, 노무사,
       행정사" 가 찍혀서 그 칸이 무엇인지 **거짓으로** 읽혔습니다 —
       찍어 보고 알았습니다. 하위를 가리키는 칸은 **어느 분류에
       속하는지**를 내는 것이 맞습니다.
       ⚠️ 하위가 업종에서 오는 분류(시설 · 장비)는 셀 것이 0 이라
       데이터에 처음부터 있던 lead 를 냅니다 (절대 규칙 2 — 빈 줄을
       두면 "이 분야는 준비가 덜 됐나" 로 읽힙니다). */
    var sub;
    if(!c)          sub = "";
    else if(it.sub) sub = c.name;
    else {
      var subs = (c.items||[]).slice(0,3).map(function(x){ return x.name; });
      sub = subs.length ? subs.join(", ") : (c.lead || "");
    }
    return '<li class="tn-'+esc(tone)+'">'+
      '<a class="hsv" href="'+esc(amHallTo(it))+'">'+
        '<span class="ia-t hsv-i" aria-hidden="true">'+
          (hasIconArt(it.ia) ? iconArt(it.ia, 30) : icon("grid",26))+'</span>'+
        '<b>'+esc(it.n)+'</b>'+
        (sub ? '<i>'+esc(sub)+'</i>' : '')+
      '</a></li>'; }).join("")+'</ul>';

  return '<section class="sec sec-gray mhall"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">SERVICE</p>'+
      /* ⚠️⚠️ "많이 찾는 · 인기 · 추천 · BEST · TOP" 을 쓰지 마세요 —
         이용 데이터를 하나도 모으지 않습니다 (마무리 지시서 §3). */
      /* ⚠️ 2026-10-11 최종 디자인 지시서 §4 의 문구입니다. */
      '<h2>사업 단계에 맞는 서비스를 선택하세요</h2>'+
      '<p>지금 어떤 단계에 계신가요? 필요한 서비스를 바로 '+
        '찾아보세요.</p></div>'+
    /* ⚠️⚠️ **범위 숫자 띠를 여기서 빼지 마세요.** MainServices() 가
       메인에서 내려오면서 이 띠가 갈 곳을 잃습니다 — 그 안의
       "서비스 분류 기준이며 등록된 업체 수가 아닙니다" ⓘ 줄은
       지우면 안 되는 것이고 check.js 의 "규모감" 검사가 찾습니다. */
    MainScopeStrip()+
    cards+
    '<div class="hsv-box" data-keep>'+
      '<div class="hsv-hd">'+
        /* ⚠️ "에" 는 받침과 무관합니다 — koWith 를 쓰지 않습니다. */
        /* ⚠️⚠️ 지시서 §5 는 "전문 업체와 연결됩니다" 라고 적었는데
           **업체가 0곳**이라 확정으로 적으면 지킬 수 없는 약속입니다
           (절대 규칙 1 · 5). 지금 사실인 데까지만 적고, 구간 아래
           줄이 "요청을 받아 찾아 드리는 단계" 라고 그대로 말합니다. */
        '<h3><b class="hall-'+esc(cur.tone)+'">'+esc(cur.name)+'</b>'+
          ' 단계에 필요한 대표 서비스입니다.</h3>'+
        '<a class="btn btn-o hsv-all" href="'+esc(cur.to)+'">'+
          '전체보기'+icon("arrow",16)+'</a>'+
      '</div>'+
      tiles+
    '</div>'+
  '</div></section>';
}

function MainServices(){
  var items = MAIN_SVC8.map(function(k){ return amCat(k); }).filter(Boolean);
  if(!items.length) return "";
  return '<section class="sec sec-gray msvc"><div class="w">'+
    '<div class="sec-hd sec-hd-row"><div>'+
      /* ⚠️⚠️ **"많이 찾는 · 인기 · 추천 · BEST · TOP" 을 쓰지 마세요**
         (2026-10-06 마무리 지시서 §2 · §3). 검색량 · 클릭 · 저장 ·
         견적 요청을 하나도 모으지 않습니다 — 재 본 적 없는 것을
         적으면 표시 · 광고의 공정화에 관한 법률 제3조입니다.
         ⚠️⚠️ 시안의 "183개 서비스와 **검증된 업체**" 도 안 씁니다 —
         검증 기능이 없습니다. */
      '<h2>사장님에게 필요한<br class="br-m"> 모든 서비스를 한 곳에서</h2>'+
      '<p>창업, 운영, 인수 · 양도, 폐업까지. 필요한 서비스와 정보를 '+
        esc(amBrand())+'에서 확인하세요.</p></div>'+
      '<a class="btn btn-o sec-hd-all" href="/providers">'+
        '전체 서비스 보기'+icon("arrow",16)+'</a>'+
    '</div>'+
    MainScopeStrip()+
    '<ul class="msvc-g">'+items.map(function(c, ix){
      var ph = hasPhoto("svc-" + c.key);
      /* ⚠️⚠️ **시각적 위계** (2026-10-09 사장님 지시 4) — 여덟이
         똑같은 크기로 깔려 있으면 무엇부터 볼지가 묻힙니다. 앞 둘은
         넓게 가고 하위 서비스를 칩으로 펼칩니다.
         ⚠️ 여덟 전부 같은 링크 · 같은 CTA 를 들고 있습니다 — 크기만
         다릅니다. 줄이거나 빼지 않았습니다 (검사가 여덟을 셉니다). */
      var big = ix < 2;
      /* 작은 줄은 **그 분류가 실제로 들고 있는 하위 서비스**에서
         셋을 가져옵니다. 손으로 적으면 하위가 늘 때 어긋납니다.
         ⚠️⚠️ 하위가 **업종에서 오는 분류**(시설 · 장비)는 여기서 셀
         것이 0 이라 이름만 덧그러니 남습니다 — 그때는 데이터에
         처음부터 있던 `lead` 를 냅니다 (절대 규칙 2). */
      var subs = (c.items || []).slice(0, 3).map(function(i2){ return i2.name; });
      var sub  = subs.length ? subs.join(", ") : (c.lead || "");
      /* 큰 카드에만 붙는 칩 줄 — **하위 서비스 이름 그대로**입니다
         (`c.items`). 손으로 적지 마세요 — 하위가 늘면 어긋납니다. */
      var chips = big ? (c.items || []).slice(0, 4).map(function(it){
        return '<i>'+esc(it.name)+'</i>'; }).join("") : "";
      return '<li class="tn-'+esc(c.tone || "t7")+(big?" msvc-big":"")+'">'+
        '<div class="msvc-c'+(ph?" msvc-ph-on":"")+'">'+
        /* ⚠️⚠️ **2026-10-11 사장님 지시 — "저 네모 칸 안에 투명하게 다
           채워져있게".** 전에는 사진이 76px 원판 **안**에 들어가서
           동전만 했습니다. 지금은 **카드 전체를 옅게 채우는 바탕**이고
           글 · 아이콘 · CTA 가 그 위에 섭니다.
           ⚠️ 그래서 원판은 **여덟 장 다 컬러 아이콘**입니다 — 넷만
           사진이면 한 줄에 두 가지 생김새가 섞입니다.
           ⚠️⚠️ **글이 읽히는 선을 넘지 마세요.** 투명도는
           `css/pages.css` 의 `--svc-ph-a` 한 곳이고, 올리면 13px
           설명글이 사진 위에서 묻힙니다 (AA 4.5). 바꾸시면 **찍어서
           글자 밑 픽셀을 재 보세요** — 검사는 사진 위 대비를 못 잽니다.
           ⚠️ 장식이라 `aria-hidden` 입니다. 뜻은 아이콘과 글이 냅니다. */
        (ph ? '<span class="msvc-bg" aria-hidden="true">'+
              photoBox("svc-" + c.key, "", true)+'</span>' : '')+
        '<a class="msvc-go" href="'+esc(catTo(c))+'">'+
          '<span class="ia-t">'+
            (hasIconArt(c.key) ? iconArt(c.key, big ? 60 : 46) : icon(c.icon, 40))+
          '</span>'+
          '<span class="msvc-tx"><b>'+esc(c.name)+'</b><i>'+esc(sub)+'</i>'+
            (chips ? '<span class="msvc-chips">'+chips+'</span>' : "")+'</span>'+
        '</a>'+
        /* ⚠️⚠️ **실제로 도는 CTA 입니다** (지시서 §5). `/quote?c=` 는
           그 분류의 서비스별 질문까지 띄우는 진짜 화면이고, 가짜
           링크를 만들면 절대 규칙 5 입니다. */
        /* ⚠️ `amCatSide()` 는 **key** 를 받습니다. 객체를 넘기면 아무 데도
           안 맞아서 전부 `close` 로 떨어집니다 — 인테리어 상담을 눌렀는데
           폐업 폼이 뜨는 꼴이었고, `tools/test-flows.js` 가 잡았습니다. */
        '<a class="msvc-q" href="'+esc(quoteTo({ cat:c.key, side:amCatSide(c.key) }))+'">'+
          icon("chat",15)+'상담 · 견적 요청</a>'+
      '</div></li>'; }).join("")+'</ul>'+
    /* ⚠️ 제휴사가 0곳이라 "신청 가능" 이라고 적을 수 있는 서비스가
       아직 없습니다 (지시서 §5 "실제 신청 가능한 서비스와 준비 중인
       서비스를 구분"). 0 을 숨기지 않고 그대로 적습니다. */
    '<p class="sec-note">'+icon("info",15)+
      ' 지금은 <b>요청을 받아 업체를 찾아 드리는 단계</b>입니다. '+
      '바로 신청 · 결제되는 상품은 아직 없습니다.</p>'+
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

/* ⚠️⚠️ **2026-10-11 사장님 지시 — 이미지 중심으로 다시 짰습니다.**
   > "이미지 중심의 고급스러운 디자인으로 변경 · 매장 인수하기 / 내 매장
   >  양도하기 / 시설 · 장비 거래 · 고품질 이미지 · 마우스를 올리면
   >  자연스럽게 확대 · PC 3열 · 모바일 반응형"

   ⚠️⚠️ **사진은 아직 없습니다 — 그래서 아무 사진도 깔지 않았습니다.**
   같은 지시서가 *"외부 참고 이미지를 무단 사용하지 말고 상업적 사용
   권한이 확보된 이미지만 적용"* 이라고 적었고, 시안에 박힌 사진은
   직접 찍은 것도 · 상업적 이용이 되는 무료 사진도 · 유료 스톡도
   아닙니다 (이 저장소가 2026-10-06 에 단계 카드 여섯에서 같은 까닭으로
   임시 그림을 걷어낸 자리입니다).

   ⚠️ **자리는 만들어 두었습니다** — `photos.js` 의 `kind-take` ·
   `kind-pass` · `kind-asset` 셋입니다. 권한이 확인된 파일을 `img/` 에
   넣고 그 세 줄만 적으면 **코드를 한 줄도 안 고치고** 시안 그대로
   됩니다 (비율 · 크기 · 용량을 셋이 같게 못박아 두었습니다 — 지시서
   §5 "색감 · 크기 · 비율을 통일").

   ⚠️⚠️ 그때까지는 **빈 회색 액자를 깔지 않습니다** (절대 규칙 2) —
   브랜드 면(남색 → 청록)에 분류 아이콘을 크게 얹습니다. 셋이 같은
   비율 · 같은 짜임새라 사진이 들어와도 자리가 안 흔들립니다.
   ⚠️ 가는 곳 셋은 **전부 실제로 있는 화면**입니다 (지시서 §9 —
   "실제 기능이 없는 메뉴는 작동하는 것처럼 표시하지 않습니다"). */
var MAIN_ASSET_KIND = [
  { ic:"pin",      tone:"t5",  ph:"kind-take",  n:"매장 인수하기",
    d:"인수 가능한 매장을 찾아보세요.", to:"/stores" },
  { ic:"handover", tone:"t13", ph:"kind-pass",  n:"내 매장 양도하기",
    d:"내 매장을 등록하고 새로운 사장님을 만나보세요.", to:"/sell" },
  { ic:"boxes",    tone:"t12", ph:"kind-asset", n:"시설 · 장비 거래",
    d:"중고 시설과 장비를 구매하거나 판매할 수 있습니다.", to:"/assets" }
];
function MainStores(){
  var L  = (window.AM_STORES||[]);
  var nA = (window.AM_ASSETS||[]).length;
  /* ⚠️⚠️ **카드 전체가 눌립니다** — 안에 또 `<a>` 를 넣지 마세요.
     오른쪽 아래 화살표는 **표시**이지 따로 누르는 단추가 아닙니다
     (`<a>` 안의 `<a>` 는 브라우저가 쪼갭니다 · 검사가 봅니다).
     ⚠️ 사진이 들어오면 `photoBox()` 가 `<picture>` 로 냅니다 —
     `object-fit:cover` 는 CSS 에 있습니다 (안 주면 비율을 무시하고
     늘어납니다 · `check.js` 가 규칙 자체를 봅니다). */
  var kinds = '<ul class="mk-kind">'+MAIN_ASSET_KIND.map(function(k){
    var has = (typeof hasPhoto === "function") && hasPhoto(k.ph);
    return '<li class="tn-'+esc(k.tone)+'">'+
      '<a class="mk-k" href="'+esc(k.to)+'">'+
        '<span class="mk-k-ph'+(has ? "" : " mk-k-ph-n")+'">'+
          (has ? photoBox(k.ph)
               : '<span class="mk-k-ic" aria-hidden="true">'+icon(k.ic,56)+'</span>')+
        '</span>'+
        '<span class="mk-k-b">'+
          '<span class="mk-k-chip" aria-hidden="true">'+icon(k.ic,22)+'</span>'+
          '<span class="mk-k-t"><b>'+esc(k.n)+'</b><i>'+esc(k.d)+'</i></span>'+
          '<em class="mk-k-a" aria-hidden="true">'+icon("arrow",18)+'</em>'+
        '</span>'+
      '</a></li>'; }).join("")+'</ul>';
  var body = L.length
    ? kinds+
      '<div class="mk-g">'+L.slice(0,3).map(function(s2){ return StoreCard(s2); }).join("")+'</div>'+
      '<p class="row-cta row-mid"><a class="btn btn-nv" href="/stores">'+
        '매장 인수 · 양도 보러가기'+icon("arrow",18)+'</a></p>'
    /* ⚠️⚠️ **2026-10-11 간소화 지시서 §2-C — "이미지 카드 3개만
       유지한다."** 매물이 0건일 때 깔던 인수 체크리스트 판
       (MainTakeoverGuide · 1434px 중 800px)을 메인에서 내렸습니다.
       ⚠️ **지운 것이 아닙니다** — 그 체크리스트는 AM_PROCESS["acq-in"]
       이고 `/transfer?t=in` 이 여덟 걸음을 통째로 들고 있습니다
       (흐름 검사가 눌러 봅니다). 함수도 그대로 있습니다. */
    : kinds;
  /* ⚠️⚠️ **매물이 0건이면 머리말도 바뀝니다** (2026-10-08 §10 · §26 ·
     절대 규칙 1). 시안의 머리말은 **"지금 이런 매장이 새로운 사장님을
     기다리고 있어요"** 인데, 매물이 0건인 상태에서 그 문장을 걸면
     그 자체가 사실과 다릅니다 — 보고 들어오신 분께 아무것도 없습니다.
     ⚠️⚠️ **가짜 매물 석 장으로 그 문장을 참으로 만들지 마세요.**
     그게 허위매물이고 표시 · 광고의 공정화에 관한 법률 제3조입니다.
     ⚠️ 매물이 한 건이라도 올라오면 **코드를 한 줄도 안 고치고**
     시안의 머리말과 카드로 바뀝니다 (`L.length` 하나가 가릅니다).

     ⚠️⚠️ **중립입니다** — 넘기시는 분과 받으시는 분이 같은 구간을
     봅니다. 한쪽 색으로 칠하면 다른 쪽에게 "여긴 내 자리가 아니네" 가
     됩니다 (`/stores` · `/assets` 를 중립으로 둔 것과 같은 까닭). */
  return MainBand({ bg:"sec-start", kicker:"TAKE OVER",
    h: L.length
       ? "지금 이런 매장이<br class=\"br-m\"> 새로운 사장님을 기다리고 있어요"
       : "사업의 자산도<br class=\"br-m\"> 다음 사장님에게 이어질 수 있습니다.",
    lead:"정리하는 사장님의 매장과 시설, 장비가 "+
         "새로운 사장님의 시작이 될 수 있습니다.", body:body });
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
      '<a class="btn btn-o" href="/sell">매장 내놓기</a></p>'+
  '</div>';
}

var MAIN_FLOW_CL = ["transfer", "asset", "stock", "labor", "contract"];
var MAIN_FLOW_ST = [
  { ic:"pin",    n:"매장 인수",      to:"/stores",
    d:"상권을 처음부터 다시 찾지 않아도 됩니다" },
  { ic:"tool",   n:"기존 시설 활용",  to:"/assets",
    d:"쓸 수 있는 것은 새로 사지 않아도 됩니다" },
  { ic:"boxes",  n:"중고 장비 구매",  to:"/assets",
    d:"같은 장비를 새것 값에 사지 않아도 됩니다" },
  { ic:"wallet", n:"초기비용 절감",   to:"/tools/vs",
    d:"신규와 인수를 나란히 놓고 따져 보세요" },
  { ic:"clock",  n:"빠른 창업 준비",  to:"/transfer?t=in",
    d:"공사 기간이 줄어 문을 빨리 엽니다" }
];
function MainBridge(){
  var cls = MAIN_FLOW_CL.map(function(k){ return amCat(k); }).filter(Boolean);
  return '<section class="sec sec-white mbr"><div class="w">'+
    '<div class="sec-hd mbr-hd">'+
      /* ⚠️ 머리말을 영문에서 우리말로 바꿨습니다 (시안). 손님에게
         먼저 보이는 글은 우리말 하나입니다. */
      '<p class="eyebrow">'+esc(amBrand())+'가 만드는 새로운 연결</p>'+
      '<h2>한 사장님의 끝이<br class="br-m"> 다른 사장님의 시작이 됩니다.</h2>'+
      /* ⚠️ `<br class="br-m">` 뒤에 띄어쓰기를 하나 둡니다 — 좁아지면
         이 줄바꿈이 사라지는데, 없으면 앞뒤 낱말이 그대로 붙습니다. */
      '<p>'+esc(amBrand())+'는 정리하는 사장님과 시작하는 사장님을 이어'+
        '<br class="br-m"> 사장님의 다음을 함께하는 플랫폼입니다.</p>'+
    '</div>'+
    '<div class="mbr-g">'+
      '<div class="mbr-c mbr-cl">'+
        '<p class="mbr-k">정리하는 사장님</p>'+
        (hasPhoto("flow-close") ? '<figure class="mbr-p">'+photoBox("flow-close")+'</figure>' : '')+
        '<ul class="mbr-l">'+cls.map(function(c){
          return '<li><a href="'+esc(catTo(c))+'">'+
            '<span class="ic-t">'+icon(c.icon,24)+'</span>'+
            '<b>'+esc(c.name)+'</b></a></li>';
        }).join("")+'</ul>'+
      '</div>'+
      '<div class="mbr-m">'+
        '<span class="mbr-arw mbr-arw-in" aria-hidden="true"></span>'+
        '<div class="mbr-logo">'+
          '<span class="mbr-logo-i">'+icon("home",26)+'</span>'+
          '<b>'+esc(amBrand())+'</b>'+
          '<i>버리는 것을 줄이고<br> 다음 사장님의 시작으로</i>'+
        '</div>'+
        '<span class="mbr-arw mbr-arw-out" aria-hidden="true"></span>'+
      '</div>'+
      '<div class="mbr-c mbr-st">'+
        '<p class="mbr-k mbr-k-st">시작하는 사장님</p>'+
        (hasPhoto("flow-start") ? '<figure class="mbr-p">'+photoBox("flow-start")+'</figure>' : '')+
        '<ul class="mbr-l mbr-l-st">'+MAIN_FLOW_ST.map(function(x){
          return '<li><a href="'+esc(x.to)+'">'+
            '<span class="ic-t">'+icon(x.ic,24)+'</span>'+
            '<span class="mbr-tx"><b>'+esc(x.n)+'</b><i>'+esc(x.d)+'</i></span></a></li>';
        }).join("")+'</ul>'+
      '</div>'+
    '</div>'+
    /* ⚠️ 한쪽을 크게 하거나 색을 세게 하지 마세요 — 두 사람의 무게가
       같아야 합니다. 이 구간이 하는 말이 바로 그것입니다. */
    /* ⚠️⚠️ **아래 단추 두 개를 뺐습니다** (2026-10-11 사장님 지시 10 —
       "다른 서비스 영역과 중복되는 부분이 없는지 확인합니다").
       `내 매장 양도 준비하기`(/sell) · `인수 가능한 매장 보기`(/stores)는
       **바로 위 구간의 사진 카드 두 장이 하는 말 그대로**였습니다 —
       재 보니 한 화면 반 안에서 같은 두 주소로 가는 단추가 **넷**이었고
       (사진 카드 둘 · 안내 상자 둘 · 여기 둘) 무엇부터 눌러야 할지가
       묻혔습니다.
       ⚠️⚠️ **길이 사라진 것이 아닙니다** — 메인에서 `/stores` 는 여덟
       곳, `/sell` 은 다섯 곳에서 걸립니다 (재 봤습니다). 이 구간은
       **말을 하는 자리**이고, 누르는 자리는 바로 위입니다.
       ⚠️ 되살리시려면 이 주석 자리에 그 `<p class="row-cta">` 한 줄을
       되돌리면 됩니다. */
  '</div></section>';
}

var MAIN_TOOL_TONE = {
  "시작하기 전":"st", "얼마를 팔아야 하나":"bl",
  "얼마가 남나":"tl", "정리할 때":"cl"
};
/* ⚠️⚠️ **2026-10-11 지시서 §6 이 적은 넷 그대로**입니다 —
   창업비 · 손익분기점 · 권리금 · 폐업비용. 전에는 셋째가 `rent`
   (임대료 비율)였습니다.
   ⚠️ 없는 key 를 적으면 그 카드가 **조용히 빠집니다** (`filter`).
   도구 주소는 `AM_TOOLS` 에서 옵니다 — 손으로 적지 마세요. */
var MAIN_CALC = ["cost", "bep", "premium", "closecost"];
/* ⚠️⚠️ **2026-10-11 지시서 §6** — 가로 카드 넷입니다. 카드마다
   컬러 아이콘 · 이름 · 한 줄 · **오른쪽 아래 이동 단추**.
   ⚠️ 아이콘은 `tools.js` 의 `icon` 한 줄입니다 — 여기에 key → 아이콘
   표를 따로 두었다가 도구가 늘자 **일곱이 전부 같은 그림**으로 나온
   적이 있습니다. 컬러 아이콘이 없는 이름은 선 아이콘이 자리를
   지킵니다 (빈 칸이 생기지 않습니다).
   ⚠️ 작은 줄은 `tools.js` 의 **`out`**(그 계산기가 내놓는 것)입니다.
   ⚠️⚠️ **카드 전체가 눌립니다** — 안의 "계산하기" 는 표시이지 따로
   누르는 단추가 아닙니다 (`<a>` 안의 `<a>` 는 브라우저가 쪼갭니다). */
function mainCalcIn(){
  var by = {}; (window.AM_TOOLS||[]).forEach(function(t){ by[t.key] = t; });
  var L = MAIN_CALC.map(function(k){ return by[k]; }).filter(Boolean);
  if(!L.length) return "";
  return '<ul class="mcal-g">'+L.map(function(t){
    var tone = MAIN_TOOL_TONE[t.grp] || "bl";
    var art  = (typeof hasIconArt === "function" && hasIconArt(t.icon));
    return '<li class="hv-'+tone+'"><a href="/tools/'+esc(t.key)+'">'+
      '<span class="mcal-i ia-t" aria-hidden="true">'+
        (art ? iconArt(t.icon, 44) : icon(t.icon, 28))+'</span>'+
      '<b class="mcal-n">'+esc(t.name)+'</b>'+
      (t.out ? '<i class="mcal-o">'+esc(t.out)+'</i>' : '')+
      '<span class="mcal-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
    '</a></li>'; }).join("")+'</ul>';
}
function mainReadIn(){
  var all = (window.AM_CONTENTS || []);
  if(!all.length) return "";
  /* ⚠️⚠️ **"최신 정보" 라고 적었으면 실제로 최신이어야 합니다.**
     전에는 데이터 차례 앞 셋을 냈는데, 그러면 글을 새로 써도 화면이
     안 바뀌고 딱지만 "최신" 이었습니다 — 하지 않은 일을 했다고 말하는
     쪽입니다 (절대 규칙 5). 올린 날(`at`)로 정렬합니다.
     ⚠️ "인기" 가 아닙니다 — 조회 · 클릭을 하나도 모으지 않습니다
     (마무리 지시서 §3). 정렬 기준은 **날짜 하나**입니다. */
  var byDate = all.slice().sort(function(a, b){
    return String(b.at || "").localeCompare(String(a.at || ""));
  });
  /* ⚠️ **날짜가 같을 때만** 분류가 안 겹치게 고릅니다. 기준은 그대로
     날짜 하나이고(인기 · 조회가 아닙니다), 같은 날 올린 글 가운데
     무엇을 앞에 둘지는 어차피 정해진 것이 없습니다 — 그 자리에서
     세 편이 전부 같은 분류로 나오면 "이 사이트는 카페 얘기만 하나"
     로 읽힙니다. 세 편을 못 채우면 겹쳐서라도 채웁니다. */
  /* ⚠️ 분류만 보면 모자랍니다 — 같은 날 쓴 글이 **전부 카페 것**이라
     분류는 셋인데 업종이 하나였습니다 (찍어 보고 알았습니다). 업종도
     안 겹치게 봅니다. 업종이 안 붙은 글은 서로 안 겹치는 것으로 셉니다. */
  var L = [], seenCat = {}, seenInd = {};
  byDate.forEach(function(c){
    if(L.length >= 3 || seenCat[c.cat]) return;
    if(c.industry && seenInd[c.industry]) return;
    seenCat[c.cat] = 1;
    if(c.industry) seenInd[c.industry] = 1;
    L.push(c);
  });
  byDate.forEach(function(c){
    if(L.length >= 3 || L.indexOf(c) >= 0) return;
    L.push(c);
  });
  return '<div class="mti-c mti-read">'+
    '<div class="mti-hd">'+
      '<div class="mti-top">'+
        '<h2><span class="mti-n" aria-hidden="true">05</span>사장님을 위한 최신 정보</h2>'+
        '<a class="btn btn-o mti-all" href="/content">정보센터 더보기'+
          icon("arrow",16)+'</a>'+
      '</div>'+
      '<p>창업, 운영, 폐업에 꼭 필요한 정보와 가이드를 확인해보세요. '+
        '지금 '+all.length+'편이고 근거를 댈 수 있는 것만 적습니다.</p>'+
    '</div>'+
    /* ⚠️ 시안의 글 카드에는 썸네일이 있는데 **글마다 사진 자리를
       만들지 않았습니다** — 쓸 수 있는 사진이 없고, 아무 사진이나
       깔면 업종이 드러나 다른 업종 사장님께 "여긴 내 자리가 아니네"
       가 됩니다. 빈 액자도 깔지 않습니다 (절대 규칙 2). */
    '<ul class="mti-rg">'+L.map(function(c){
      /* ⚠️ 딱지 색은 그 글이 **어느 쪽 글인가**입니다 (창업 블루 ·
         폐업 오렌지 · 양쪽은 중립). 글마다 `side` 가 데이터에 있어서
         여기 적을 것이 없습니다. */
      var sd = (c.side === "start" || c.side === "close") ? c.side : "both";
      return '<li class="mti-r-'+sd+'"><a href="/content/'+esc(c.slug)+'">'+
        /* ⚠️⚠️ **날짜는 지어낸 값이 아니라 `content.js` 의 `at`
           입니다** — 글을 올린 날입니다. 시안의 "2024. 12. 10" 은
           디자인 예시이고, 없는 날짜를 찍으면 그게 거짓입니다
           (지시서 §23). 값이 없는 글은 **날짜 칸째 뺍니다**
           (자리표시자를 찍지 않습니다 — 절대 규칙 2). */
        /* 분류 딱지 → 제목 → 날짜 (시안) */
        '<span class="mti-r-m">'+esc((amCat(c.cat) || {}).name || "")+'</span>'+
        '<b>'+esc(c.title)+'</b>'+
        /* ⚠️⚠️ **날짜는 `content.js` 의 `at`** 입니다 — 시안의
           "2024. 12. 10" 은 디자인 예시이고 없는 날짜를 찍으면 그게
           거짓입니다. 값이 없는 글은 **칸째 뺍니다** (절대 규칙 2).
           ⚠️ "n일 전" 같은 상대 표기를 쓰지 마세요 — 캐시된 화면에서
           틀린 날부터 거짓말이 됩니다. */
        (c.at ? '<em class="mti-r-d">'+esc(amDate(c.at))+'</em>' : '')+
        '</a></li>'; }).join("")+'</ul>'+
  '</div>';
}
/* ⚠️⚠️ **2026-10-11 지시서 §1 — 04 는 계산도구만입니다.**
   전에는 "계산도구 + 최신 정보" 두 칸이었는데, 지시서의 메인 차례에
   최신 정보 구간이 없습니다. `mainReadIn()` 은 **지우지 않고 안
   부릅니다** — 함수를 파일 사이로 옮기다 이 저장소에서 다섯 번
   함수를 통째로 삼켰습니다 (되살리시려면 여기 한 줄입니다).
   ⚠️ `/content` 로 가는 길은 푸터 `서비스` 칸과, 160개 화면의 글
   잇기 구간(`ReadBand`)과 헤더 검색이 그대로 받습니다 — 재서
   확인했습니다. */
function MainToolsInfo(){
  var a = mainCalcIn();
  if(!a) return "";            /* 계산기가 없으면 구간째 뺍니다 */
  return '<section class="sec sec-blue mti"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">TOOLS</p>'+
      '<h2>사장님의 사업에 필요한 계산도구</h2>'+
      '<p>창업 · 운영 · 양도양수 · 폐업에 필요한 비용을 미리 계산해 '+
        '보세요. 적으신 숫자는 이 브라우저에만 남습니다.</p>'+
    '</div>'+
    a+
    /* ⚠️ 계산 결과는 **참고용 추정치**입니다 (§6). 이 줄을 지우지
       마세요 — 사장님이 그 숫자를 보고 돈을 빌리러 가십니다. */
    '<p class="note sec-note">적으신 조건으로 계산한 참고용 값입니다. '+
      '실제 금액은 지역 · 평수 · 업종에 따라 달라집니다.</p>'+
    '<p class="mcal-all"><a class="btn btn-o" href="/tools">'+
      '계산도구 전체보기'+icon("arrow",16)+'</a></p>'+
  '</div></section>';
}

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
/* ══════════════════════════════════════════════════════════════════
   ⑥ 파트너 입점 (2026-10-08 지시서 §11)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **실제 운영정책과 일치하는 혜택만 적습니다** (§11). 시안의
   "사장님에게 직접 연결" 같은 말은 **고객을 반드시 연결해 준다**는
   약속으로 읽히는데, 지금 요청이 0건이라 지킬 수 없습니다 (§11 이
   직접 금지합니다 · 절대 규칙 5).
   ⚠️⚠️ **그래서 세 칸을 `js/data/join.js` 의 `AM_JOIN_WHY` 에서
   가져옵니다.** 거기 넷은 전부 **약관에 근거가 있는 약속**입니다
   (제6조 제4항 · 제6조 제2항 · 제17조). 여기에 따로 적으면 화면에서
   하는 말과 약관 · `/join` 이 서로 달라지고, 그때부터 채무입니다.
   ⚠️ **"월 n건의 요청" · "n곳이 함께합니다" 를 적지 마세요** — 지금
   0 이고, 업체는 등록하고 나서 바로 압니다.

   ⚠️ 어두운 카드(`.mjn-c`)는 이 저장소에서 **어두운 배경을 쓸 수 있는
   한 자리**입니다 (BRIGHT PREMIUM). 다른 구간에 쓰지 마세요. */
function MainJoin(){
  /* ⚠️⚠️ 혜택 셋을 **차례로 자르지 않습니다.** 약속 넷 가운데 어느
     셋을 낼지는 `join.js` 의 `main` 번호가 정합니다 — 여기서 인덱스로
     집으면 약속을 한 줄 더 쓰는 날 조용히 다른 것이 나옵니다. */
  var why  = (window.AM_JOIN_WHY || []).filter(function(x){ return x.main; })
                .sort(function(a, b){ return a.main - b.main; });
  if(!why.length) why = (window.AM_JOIN_WHY || []).slice(0, 3);
  return '<section class="sec mjn"><div class="w">'+
    '<div class="mjn-c">'+
      '<div class="mjn-t">'+
        '<p class="mjn-k">PARTNER</p>'+
        /* ⚠️ 이름이 "파트너" 를 꾸미는 자리라 조사가 붙지 않습니다 —
           `koWith()` 를 쓰면 "인수인계가 파트너가" 가 됩니다. */
        '<h2>'+esc(amBrand())+' 파트너가 되어주세요.</h2>'+
        '<p>창업과 폐업을 준비하는 사장님들에게 전문 서비스를 소개할 '+
          '파트너 업체를 모집합니다.</p>'+
        /* ⚠️ 입점 분야 칩 줄은 뺐습니다 (시안). 분야는 `/join` 이
           **세는 값과 함께** 내고 있고, 어두운 카드에 스물다섯을
           깔면 혜택 셋이 묻힙니다. 줄만 뺀 것이고 `/join` 의 분야
           구간은 그대로입니다. */
      '</div>'+
      (why.length ? '<ul class="mjn-why">'+why.map(function(x){
        return '<li><span class="mjn-why-i">'+icon(x.icon,22)+'</span>'+
          '<span class="mjn-why-t"><b>'+esc(x.t)+'</b>'+
          (x.s ? '<i>'+esc(x.s)+'</i>' : '')+'</span></li>'; }).join("")+'</ul>' : '')+
      /* ⚠️ 단추는 **파랑**입니다 (시안). 짙은 남색 위에 흰 글자라
         대비를 재서 AA 를 넘기는지 확인했습니다. */
      '<p class="mjn-go"><a class="btn btn-b btn-lg" href="/join">'+
        '파트너 입점하기'+icon("arrow",18)+'</a></p>'+
    '</div>'+
    mainSampleCard()+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   ⑦ 마지막 CTA (2026-10-08 지시서 §12)
   ══════════════════════════════════════════════════════════════════
   히어로와 **같은 행동**을 한 번 더, 더 간결하게 냅니다 — 여기까지
   내려오신 분은 이미 다 보셨고 남은 것은 "그래서 어디로" 하나입니다.
   ⚠️ 창업은 블루 · 폐업은 오렌지 (§12). 두 단추의 크기 · 글씨 ·
   자리가 같아야 합니다 — 한쪽을 작게 하면 "덜 중요한 것" 이 됩니다.
   ⚠️ 셋째 줄 셋은 **실제로 되는 것**만입니다 (가짜 링크는 절대 규칙 5). */
/* ⚠️ 셋 다 실제로 있는 화면입니다. "체크리스트 → /startup" 은 바로
   위 창업 단추와 **같은 데**라서 `/content`(글 예순 편)로 바꿨습니다 —
   같은 구간 안에서 같은 주소로 가는 길을 둘 두지 않습니다 (§5). */
var MAIN_LAST_HELP = [
  { ic:"users", n:"업체 찾기",   d:"분야 · 지역으로 추립니다",   to:"/providers" },
  { ic:"book",  n:"정보 · 가이드", d:"막히는 자리마다 읽을 것",   to:"/content" },
  { ic:"calc",  n:"계산도구",    d:"비용을 직접 재 보세요",      to:"/tools" }
];
/* ══════════════════════════════════════════════════════════════════
   05 서비스 이용 절차 (2026-10-11 지시서 §7)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **클래스를 `.how-*` 도 `.hiw-*` 도 쓰지 마세요.** 둘 다 이미
   `/about` 의 "진행 셋" 과 `/join` 의 "이용방법" 이 쓰고 있어서,
   겹치면 **두 화면이 통째로 깨집니다** (이 저장소에서 `.lg` 로고 ↔
   약관, `.how-g` 로 두 번 겪었습니다). 지금 것은 `.mstp-*` 입니다.

   ⚠️⚠️ **지금 실제로 되는 것만 적습니다** (§7 "실제로 제공하지 않는
   검증 · 보증 · 비교 기능을 확정적으로 안내하지 않는다").
     · 업체가 0곳이라 "바로 연결됩니다" 가 아니라 **찾아 드립니다**
     · 검증 기능이 없으므로 "검증된 업체" 를 쓰지 않습니다
     · 받은 제안 비교는 `/quote` 에 실제로 있는 화면입니다
   ⚠️ `/about` 의 진행은 **셋**이고 그대로 둡니다 — 거기는 "귀찮아
   보이지 않게" 셋으로 줄여 둔 자리이고 검사가 개수를 셉니다. */
/* ⚠️⚠️ **절차 넷은 `js/data/steps.js` 한 곳입니다.** 전에 여기
   var 로 적었는데 `build-pages.js` 는 `js/pages/*` 를 읽지 않아서
   **크롤러 본문에서만 구간이 조용히 빠졌습니다.** */
function MainSteps(){
  return '<section class="sec sec-white mstp"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">HOW IT WORKS</p>'+
      '<h2>'+esc(amBrand())+'는 이렇게 진행됩니다</h2>'+
      '<p>간단한 신청으로 분야에 맞는 업체를 찾아 드립니다.</p>'+
    '</div>'+
    '<ol class="mstp-g">'+(window.AM_STEPS||[]).map(function(x, i){
      return '<li><span class="mstp-i" aria-hidden="true">'+icon(x.ic,24)+'</span>'+
        '<b class="mstp-n">'+(i+1 < 10 ? "0" : "")+(i+1)+'</b>'+
        '<b class="mstp-t">'+esc(x.n)+'</b>'+
        '<i class="mstp-d">'+esc(x.d)+'</i></li>'; }).join("")+'</ol>'+
    /* ⚠️ 업체가 0곳인 것을 숨기지 않습니다 (절대 규칙 1). */
    '<p class="note sec-note">지금은 요청을 받아 업체를 찾아 드리는 '+
      '단계입니다. 저희는 중개자이고 거래 당사자가 아닙니다.</p>'+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   06 무료 견적 · 상담 신청 (2026-10-11 지시서 §8)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **메인에서 `/quote` 로 가는 길은 여기 하나**입니다.
   ⚠️⚠️ **"상담 문의하기" 단추를 만들지 않았습니다.** 지시서 §8 이
   "실제 운영 중인 문의 채널 또는 상담 페이지와 연결한다 · 동일한
   신청 폼을 불필요하게 중복 생성하지 않는다" 고 적었는데, 지금
   전화도 채팅도 없고 같은 폼을 하나 더 만드는 것은 §8 이 직접
   금지한 것입니다. 둘째 단추는 **실제로 답이 있는 `/faq`** 입니다
   (§0-8 "실제 기능이 없는 버튼을 만들지 않는다").
   ⚠️ 상담 채널(번호 · 카카오 채널)을 여시면 그때 바꿔 답니다. */
function MainLast(){
  /* ⚠️⚠️ **`hero-close`(정리 현장)를 여기 넣지 마세요.** 뜯긴 벽과
     폐자재가 "어떤 서비스가 필요하신가요?" 라는 권유 자리에 들어가면
     그 구간이 통째로 폐업으로 읽힙니다 — 넣어서 찍어 보고 뺐습니다.
     이 자리는 **밝은 매장에서 상담하는 장면**이고, 그런 사진이 들어올
     때까지 비어 있습니다 (빈 액자를 깔지 않습니다 · 절대 규칙 2). */
  var ph = hasPhoto("cta-consult");
  return '<section class="sec sec-ivory mlast"><div class="w">'+
    '<div class="mlast-in'+(ph ? " mlast-ph" : "")+'">'+
      '<div class="mlast-t">'+
        '<h2>어떤 서비스가 필요하신가요?</h2>'+
        '<p>지금 바로 신청하시면 필요한 서비스를 찾으실 수 있도록'+
          '<br class="br-m"> 도와드립니다. 한 번만 적어 보내시면 '+
          '분야에 맞는 업체를 찾아 연결해 드립니다.</p>'+
        '<p class="mlast-go">'+
          '<a class="btn btn-nv btn-lg" href="/quote">'+
            '무료 견적 신청'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-o btn-lg" href="/faq">자주 묻는 질문</a>'+
        '</p>'+
        /* ⚠️ 시안에는 이 줄이 없지만 **지우지 않았습니다** — 셋 다
           실제로 되는 화면이고, 단추 둘이 주인공이 되도록 얇은 한
           줄로 내립니다. */
        '<ul class="mlast-h">'+MAIN_LAST_HELP.map(function(x){
          return '<li><a href="'+esc(x.to)+'">'+icon(x.ic,18)+
            '<b>'+esc(x.n)+'</b></a></li>'; }).join("")+'</ul>'+
      '</div>'+
      /* ⚠️⚠️ **사진이 없으면 액자째 안 그립니다** (절대 규칙 2) —
         옅은 빈 상자를 깔면 그게 "준비 중" 으로 읽힙니다.
         ⚠️ `object-fit:cover` 를 빼지 마세요 (검사가 규칙을 봅니다). */
      (ph ? '<div class="mlast-im">'+photoBox("cta-consult","",true)+'</div>' : '')+
    '</div>'+
  '</div></section>';
}

/* ⚠️ **구간을 더하거나 차례를 바꾸시려면 지시서를 먼저 고치세요.**
   `check.js` 의 "메인 구간 차례가 지시서와 같다" 가 **구간 열셋**을
   셉니다 — 사업 단계 열은 `<nav>` 라 그 셈에 안 들어가고, "히어로
   에서 바로 찾고 바로 갈라진다" 가 그 열을 따로 봅니다. */

/* ══════════════════════════════════════════════════════════════════
   07 업종별 맞춤 서비스 (§3-3 7 · §7)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **업종을 고르면 아래가 실제로 바뀝니다** — 고르기만 하는 UI 를
   만들지 않습니다 (2026-10-03 §9 가 직접 금지한 자리입니다).
   고르신 업종은 `/startup/:업종` 으로 갑니다. */
function MainIndustryBand(){
  var L = (window.AM_INDUSTRIES || []);
  if(!L.length) return "";
  return '<section class="sec sec-white mind"><div class="w">'+
    '<div class="sec-hd sec-hd-row"><div>'+
      '<p class="eyebrow">BY INDUSTRY</p>'+
      '<h2>업종마다 필요한 것이 다릅니다</h2>'+
      '<p>업종을 고르시면 그 업종의 준비 순서 · 장비 · 거래처 · 업체로 '+
        '좁혀 드립니다.</p></div>'+
      '<a class="btn btn-o sec-hd-all" href="/startup">'+
        '업종 전체 보기'+icon("arrow",16)+'</a>'+
    '</div>'+
    IndustryGrid("/startup", "")+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   10 운영 중인 사장님 추천 서비스 (§3-3 10 · §5)
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **"추천" 이라고 쓰지 마세요** — 이용 데이터를 모으지 않습니다
   (마무리 지시서 §3 의 금지 표현). 머리말은 **운영 중이시라면** 입니다.
   ⚠️ 여섯 묶음은 `/operation` 과 **같은 데이터**를 봅니다 — 두 곳에
   적으면 어긋납니다. */
function MainOpsvc(){
  if(!(window.AM_OPSVC || []).length) return "";
  return '<section class="sec sec-ivory mopsv"><div class="w">'+
    '<div class="sec-hd sec-hd-row"><div>'+
      '<p class="eyebrow">OPERATION</p>'+
      '<h2>이미 운영 중이시라면</h2>'+
      '<p>문을 열고 나서 생기는 일도 한곳에서 맡길 곳을 찾습니다. '+
        '식자재 · 수리 · 솔루션 · 마케팅까지 여섯 갈래입니다.</p></div>'+
      '<a class="btn btn-o sec-hd-all" href="/operation">'+
        '운영 서비스 보기'+icon("arrow",16)+'</a>'+
    '</div>'+
    OpsvcGrid(3, true)+
  '</div></section>';
}

function PageMain(){
  /* ⚠️⚠️ **2026-10-08 "최종 디자인 통합 및 기능 완성 작업지시서" §3 의
     차례**입니다 — 아홉이고 HEADER · FOOTER 는 `#view` 밖
     (`chrome.js`)이라 여기서는 **일곱**입니다.

       01 HERO                .mh     사진 띠 + 창업 / 폐업 선택 카드 둘
       02 브랜드 연결          .mbr    정리하는 사장님 → 인수인계 → 시작하는 사장님
       03 핵심 서비스 여덟      .msvc   + 전체 서비스 보기
       04 계산도구 + 최신 정보  .mti    한 구간 두 칸
       05 매장 · 시설 · 장비    TAKE OVER  매물 0건이면 안내 + 실제 CTA
       06 파트너 입점          .mjn    + 입점 화면 예시 카드
       07 마지막 CTA          .mlast  창업 / 폐업 한 번 더

     ⚠️⚠️ **지시서 §2-2 · §30-3 — "기존 기능을 임의로 삭제하지
     않는다."** 메인에서 내려온 구간이 여섯인데 **함수는 하나도 안
     지웠습니다** (되돌리실 일이 생기면 아래 한 줄입니다). 내려온
     것마다 **갈 곳이 남아 있는지 하나씩 확인했습니다** —

       · `MainJourney()`   상황 넷   → 헤더 `창업` · `폐업`, 07 마지막
                                      CTA, 푸터 "사업 단계" 칸
       · `MainIndustry()`  업종 열넷 → `/startup` · `/closure` 첫 화면이
                                      그대로 업종 고르개입니다 (§13 STEP 01)
       · `MainRoadmap()`   맞춤 순서 → `/startup/:업종` · `/closure` 가
                                      그 화면입니다 (§13 STEP 03 · §16)
       · `MainStage()`     단계 여섯 → ⚠️ **푸터 "사업 단계" 칸을 여섯으로
                                      바꿔 두었습니다.** 안 바꾸면 `/g/:stage`
                                      여섯 중 다섯이 사이트 안에서 갈 길을
                                      잃습니다 (색인은 되어 있는데 아무
                                      데서도 안 걸리는 화면이 됩니다)
       · `MainSearch()`    검색 패널 → 헤더 통합검색이 **모든 화면**에서
                                      받습니다. 탭 다섯이 가리키던 곳
                                      (`/providers` · `/franchise` · `/stores` ·
                                      `/g/transfer` · `/support`)은 03 서비스 ·
                                      05 매장 구간 · 푸터에 전부 있습니다
       · `MainHow()` `MainStory()` `MainProviders()` `MainTools()`
         `MainContent()`             → 04 가 도구와 글을 같이 내고,
                                      업체는 03 여덟 장이 분야별로 보냅니다.
                                      `/about` 이 가치 · 범위 숫자 · 진행을
                                      그대로 들고 있습니다

     ⚠️ **다시 끼워 넣지 마세요.** 지시서 §30-1 · §30-2 가 "다시 비우지도
     말고, 모든 업종과 서비스를 한꺼번에 나열하지도 말라" 고 적었습니다.
     늘리시려면 **지시서를 먼저 고치고** `check.js` 의 `want` 를 같이
     고치세요 (거기가 구간 차례를 셉니다).

     ⚠️⚠️ **가짜 신뢰 숫자를 넣지 마세요** (§26 · 절대 규칙 1). 시안의
     예시 매물 석 장 · `2024. 12. 10` 같은 날짜 · 회원 수 · 평점은 전부
     **디자인 참고용**입니다. 매물이 0건이면 05 는 머리말까지 바꿔
     사실대로 말하고, 글 카드에는 없는 작성일 대신 분류와 예상 읽기
     시간(둘 다 실제 값)을 냅니다. */
  /* ⚠️⚠️ **2026-10-09 최종 통합 리뉴얼 §3-3 의 열두 구간**입니다.
     HEADER · FOOTER 는 `#view` 밖(`chrome.js`)이라 여기서는 **열하나**입니다.

       §3-3 1  상단 내비게이션   → chrome.js (#view 밖)
       §3-3 2  창업 · 폐업 HERO    → 01 .mh
       §3-3 3  통합 검색          → 01 안의 .mh-find (헤더 검색과 **같은** mainFind)
       §3-3 4  주요 서비스 상품    → 02 .msvc
       §3-3 5  창업 · 운영 · 폐업 탐색 → ⚠️⚠️ **2026-10-11 사장님 지시로
                                   내렸습니다** ("지금 어느 자리에
                                   계신가요?" 구간). 함수는
                                   `home-retired.js` 에 그대로 있고,
                                   그 구간이 가리키던 **주소 열셋이
                                   전부 메인 안에서도 걸리는 것을 하나씩
                                   세어 확인했습니다** (제일 적은 것이
                                   1곳 · 제일 많은 것이 10곳) — 헤더 ·
                                   02 서비스 여덟 · 06 매장 구간 ·
                                   08 운영 묶음 · 푸터가 받습니다
       §3-3 6  패키지            → 03 .pkg  ⚠️ "인기" 라고 쓰지 않습니다
       §3-3 7  업종별 맞춤 서비스  → 04 .mind
       §3-3 8  계산기 · 정보       → 05 .mti
       §3-3 9  매장 인수 · 양도    → 06 TAKE OVER
       —        인수 ↔ 인계 (보존)  → 07 .mbr   §12 "기존 콘텐츠를 지우지 않는다"
       §3-3 10 운영 중인 사장님     → 08 .mopsv
       §3-3 11 파트너 제휴        → 09 .mjn
       —        마지막 CTA (보존)   → 10 .mlast
       §3-3 12 푸터              → chrome.js (#view 밖)

     ⚠️⚠️ **차례를 바꾸시려면 지시서를 먼저 고치고** `check.js` 의
     "메인 구간 차례가 지시서와 같다" 가 세는 `want` 를 **같이** 고치세요.
     ⚠️⚠️ **빈 화면으로 만들지 마세요** (§12). 여기서 내려온 구간은
     함수를 하나도 안 지웠고, 갈 곳이 남아 있는지 하나씩 확인했습니다. */
  /* ⚠️⚠️ **2026-10-11 UI/UX 지시서 §6 — `MainServices()` 를 더 이상
     부르지 않습니다.** 전문관 넷(`MainHalls`)이 같은 일을 더 넓게
     합니다 (분류 여덟 → 네 갈래 × 대표 서비스 39). 둘을 같이 두면 한
     화면에서 서비스 목록을 두 번 내는 꼴이고 메인이 그만큼 길어집니다.
     ⚠️ **함수는 안 지웠습니다** — 되돌리시려면 아래 한 줄입니다.
     ⚠️⚠️ 사진 넷(`svc-interior` · `svc-equip` · `svc-it` · `svc-clean`)이
     그 구간에서만 쓰였습니다. `photos.js` 와 파일은 그대로라 되살리면
     바로 다시 붙습니다. */
  /* ⚠️⚠️ **2026-10-11 "전체 사이트 간소화 및 중복 제거 작업지시서"
     §2 — 메인은 A~F 다섯 구간 + 푸터입니다.**

       A 히어로               .mh     핵심 메시지 + 통합검색 + 대표 단추
       B 전문관 · 서비스 탐색   .mhall  넷 + 고른 전문관의 대표 서비스
       C 매장 · 시설 장비 거래  TAKE OVER  이미지 카드 **셋만**
       D 무료 사업 도구        .mti    계산기 넷 + 최신 정보
       E 전문가 연결 · 상담     .mlast  견적 · 상담 신청 **하나로**
       F 푸터                  .ft     `#view` 밖 (chrome.js)

     ⚠️⚠️ **열에서 다섯으로 줄인 것은 "기능" 이 아니라 "복잡성"
     입니다** (지시서 머리말). 함수는 **하나도 안 지웠습니다** —
     아래 한 줄이면 돌아옵니다. 내려온 다섯마다 갈 곳이 남아 있는지
     **재서** 확인했습니다 —

       · PackBand()       패키지     → /quote 가 E 의 주 단추입니다.
                                       패키지는 신청 화면 안에서
                                       묶어 고르실 수 있습니다 (§3)
       · MainIndustryBand() 업종 열넷 → /startup · /closure **첫 화면이
                                       그대로 업종 고르개**입니다.
                                       전문관 바로 아래 또 고르개를
                                       두면 "같은 선택 영역의 반복"
                                       입니다 (§5)
       · MainBridge()     인수↔인계  → C 와 **네 주소가 겹쳤습니다**
                                       (/stores · /assets · /transfer ·
                                       /tools/vs). §5 "다른 섹션과
                                       기능이 동일한 카드"
       · MainOpsvc()      운영 묶음   → B 의 **매장 운영 전문관**이
                                       그대로 받습니다 (겹친 주소
                                       /providers/it · marketing)
       · MainJoin()       파트너 입점 → §2-F "파트너 모집은 별도
                                       페이지로 연결". 헤더 [업체 입점]
                                       과 푸터가 이미 받습니다

     ⚠️ 늘리시려면 **지시서를 먼저 고치고** `check.js` 의 `want` 를
     같이 고치세요 (거기가 구간 차례를 셉니다). */
  /* ⚠️⚠️ **2026-10-11 최종 디자인 지시서 §1 의 차례**입니다 —
     01 히어로 · 02 전문관 넷 · 03 세부 서비스(02 와 한 구간) ·
     04 계산도구 · 05 이용 절차 · 06 견적 · 상담 · 07 푸터(#view 밖).
     ⚠️ `MainStores()`(매장 · 시설장비 전용 대형 이미지 구간)는
     §1 · §11 이 **메인에서 빼라고 직접 적은** 것입니다 — 함수는
     그대로 두었고(되살리시려면 여기 한 줄), 그 구간이 가리키던
     `/stores` · `/sell` · `/assets` 는 **매장 양도양수 전문관**이
     그대로 들고 있습니다 (재서 확인했습니다).
     ⚠️ 차례를 바꾸시려면 지시서를 먼저 고치고 `check.js` 의 `want`
     를 **같이** 고치세요. */
  return MainHero()+ MainHalls()+ MainToolsInfo()+ MainSteps()+ MainLast();
}


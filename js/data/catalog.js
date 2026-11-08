/* ════════════════════════════════════════════════════════════════════
   서비스 분류 — 골프올인원이 중개하는 일 (열 가지 · 하위 예순둘)

   ⚠️⚠️ **2026-11-03 2차 지시서 §3 으로 교체했습니다.** 1차 때 제가
   지은 하위 쉰아홉을 지시서가 준 예순둘로 바꿨습니다. 바꿀 수 있었던
   까닭은 **저장된 골프 키가 0건**이었기 때문입니다 —
     · 운영 DB 에는 0001~0007 만 돌아가 있어 `make_apply`(0027)가
       아예 없습니다 = 입점 신청 줄이 생길 길이 없었습니다
     · 저장소의 업체도 0곳이었습니다
   ⚠️⚠️ **신청이 한 건이라도 들어오면 그때부터는 못 바꿉니다.**
   `request_item.service_id` 와 `provider.subs` 가 이 키를 **글자로**
   저장합니다. 바꾸면 지난 기록의 뜻이 조용히 달라집니다.

   ⚠️⚠️ **키를 지난 두 사업의 키 여든다섯과 한 글자도 겹치지 않게**
   지었습니다 (창업 · 폐업 26 · 중고폰 60). 하위마다 두 글자 머리를
   붙여(ls- us- bk- jo- rg- mk- ft- tr- cr- cm-) 겹칠 길을 막았습니다.
   `tools/check-keys.js` 가 빌드에서 멈춥니다.

   ⚠️⚠️ **이 분류가 쓰이는 자리는 다섯입니다.**
     ① 메인의 분류 카드 열 장
     ② 메인의 **네 영역**(AM_ZONES) — 열 분류를 묶어 보여 줍니다
     ③ 분류별 상세 화면 /cat/<key>
     ④ 입점 신청 — 업체가 **하는 일**을 고르는 칸 (pv 가 true 인 하위만)
     ⑤ 관리자 배정 — 항목마다 그 하위를 하는 업체를 고릅니다
        (provider.subs 가 **하위 키**를 들고 있습니다)

   칸
     key      주소 · 저장 · 배정에 쓰는 값 — **바꾸지 마세요**
     name     화면에 나가는 이름
     lead     카드 아래 한 줄
     icon     icon() 의 이름 — **없는 이름을 적으면 빈 칸이 됩니다**
     kind     이 분류의 **화면 짜임새**
                provider  업체와 손님을 잇습니다
                trade     회원끼리 사고팝니다
                match     회원끼리 모입니다
                board     글을 올리고 읽습니다
     provider 업체가 **입점해 등록하는** 분류인가 (입점 양식에 나옵니다)
     items    하위 — [{key,name,pv}] · pv 를 안 적으면 provider 를 따릅니다
              ⚠️ pv:false 는 **회원끼리만** 쓰는 하위입니다 (업체가 고를 수 없습니다)
     kw       검색 전용 다른 말 — 손님은 분류 이름을 모르고 하려는 일을 칩니다
   ════════════════════════════════════════════════════════════════════ */

window.AM_CATS = [

  { key:"booking", name:"골프장 부킹", icon:"flag", kind:"provider", provider:true,
    lead:"전국 골프장 예약",
    kw:"부킹 예약 티타임 라운딩 골프장 그린피 주말부킹 잔여타임 특가 야간",
    items:[
      { key:"bk-find",  name:"골프장 검색" },
      { key:"bk-time",  name:"티타임 정보" },
      { key:"bk-agent", name:"부킹업체 연결" },
      { key:"bk-deal",  name:"특가 부킹" },
      { key:"bk-night", name:"9홀 · 야간 라운딩" }
    ]},

  { key:"matchup", name:"골프 조인", icon:"people", kind:"match", provider:false,
    lead:"함께 라운딩 · 모임",
    kw:"조인 동반자 라운딩 같이 모임 동호회 번개 조인방 인원구함 스크린조인",
    items:[
      { key:"jo-one",     name:"1인 조인" },
      { key:"jo-two",     name:"2인 조인" },
      { key:"jo-screen",  name:"스크린 조인" },
      { key:"jo-regular", name:"정기 모임" },
      { key:"jo-club",    name:"동호회 모집" }
    ]},

  { key:"used", name:"중고 골프장터", icon:"cart", kind:"trade", provider:true,
    lead:"중고매매 · 매입견적",
    kw:"중고 중고채 중고클럽 팔기 삽니다 직거래 처분 되팔기 매입 위탁판매",
    items:[
      { key:"us-driver",   name:"드라이버",          pv:false },
      { key:"us-wood",     name:"우드 · 유틸리티",    pv:false },
      { key:"us-iron",     name:"아이언",            pv:false },
      { key:"us-wedge",    name:"웨지 · 퍼터",        pv:false },
      { key:"us-shaft",    name:"샤프트",            pv:false },
      { key:"us-bag",      name:"골프백",            pv:false },
      { key:"us-gear",     name:"기타 중고용품",      pv:false },
      { key:"us-buyquote", name:"중고채 매입 견적",   pv:true  },
      { key:"us-consign",  name:"위탁판매 연결",      pv:true  }
    ]},

  { key:"lesson", name:"골프 레슨", icon:"swing", kind:"provider", provider:true,
    lead:"프로매칭 · 레슨예약",
    kw:"레슨 프로 강습 배우기 골프배우기 입문 초보 원포인트 스윙교정 레슨비",
    items:[
      { key:"ls-solo",   name:"개인 레슨" },
      { key:"ls-group",  name:"그룹 레슨" },
      { key:"ls-field",  name:"필드 레슨" },
      { key:"ls-point",  name:"원포인트 레슨" },
      { key:"ls-junior", name:"주니어 레슨" },
      { key:"ls-online", name:"온라인 레슨" }
    ]},

  /* ⚠️ 중고 골프장터는 **둘이 섞입니다** — 회원끼리의 직거래와, 업체가
     하는 매입 견적 · 위탁판매입니다. 그래서 kind 는 trade 이고
     업체가 고를 수 있는 하위는 pv:true 인 둘뿐입니다. */
  { key:"range", name:"골프 연습장", icon:"balls", kind:"provider", provider:true,
    lead:"실내 · 실외 · 스크린",
    kw:"연습장 실내연습장 실외연습장 스크린골프 타석 숏게임 퍼팅 이용권 체험권",
    items:[
      { key:"rg-in",    name:"실내 연습장" },
      { key:"rg-out",   name:"실외 연습장" },
      { key:"rg-sim",   name:"스크린골프" },
      { key:"rg-short", name:"숏게임 연습장" },
      { key:"rg-pass",  name:"이용권 · 체험권" }
    ]},

  { key:"market", name:"골프용품 마켓", icon:"bag", kind:"provider", provider:true,
    lead:"신품 · 중고 · 브랜드",
    kw:"용품 신품 골프채 골프공 골프의류 골프화 장갑 액세서리 연습용품 할인",
    items:[
      { key:"mk-club",  name:"골프채" },
      { key:"mk-ball",  name:"골프공" },
      { key:"mk-bag",   name:"골프백" },
      { key:"mk-shoe",  name:"골프화" },
      { key:"mk-wear",  name:"의류" },
      { key:"mk-acc",   name:"골프 액세서리" },
      { key:"mk-train", name:"연습용품" },
    /* ⚠️⚠️⚠️ **시안의 「렌탈존」이 갈 자리**입니다 (2026-11-08). 대여를
       담는 분류도 하위도 없어서 머리말 메뉴가 **갈 데가 없었습니다**.
       하위 키는 **더하기만** 합니다(이미 올라온 글이 키를 글자로 들고
       있습니다) — 지금은 그 키로 저장된 것이 0건이라 더해도 안전합니다.
       ⚠️ 업체가 0곳이라 당장은 빈 목록입니다. 다른 하위와 **같은 상태**
       이고, 지어낸 업체를 넣지 않습니다(절대 규칙 1). */
    { key:"mk-rent", name:"렌탈 · 대여" }
    ]},

  { key:"fitting", name:"피팅 · 수리", icon:"clubs", kind:"provider", provider:true,
    lead:"클럽피팅 · 수리 · 리샤프트",
    kw:"피팅 클럽피팅 드라이버피팅 아이언피팅 리샤프트 샤프트교체 그립교체 수리 로프트 라이각",
    items:[
      { key:"ft-driver", name:"드라이버 피팅" },
      { key:"ft-iron",   name:"아이언 피팅" },
      { key:"ft-shaft",  name:"샤프트 교체" },
      { key:"ft-grip",   name:"그립 교체" },
      { key:"ft-mend",   name:"클럽 수리" },
      { key:"ft-angle",  name:"로프트 · 라이 조정" }
    ]},

  { key:"travel", name:"골프 여행", icon:"plane", kind:"provider", provider:true,
    lead:"국내 · 해외 골프투어",
    kw:"골프여행 골프투어 해외골프 동남아 일본골프 패키지 골프텔 캠프 전지훈련 견적비교",
    items:[
      { key:"tr-home",  name:"국내 골프 여행" },
      { key:"tr-away",  name:"해외 골프 여행" },
      { key:"tr-tel",   name:"골프텔" },
      { key:"tr-pack",  name:"골프 패키지" },
      { key:"tr-camp",  name:"골프 캠프" },
      { key:"tr-quote", name:"여행사 견적 비교" }
    ]},

  { key:"career", name:"골프 인력 · 비즈니스", icon:"case", kind:"board", provider:true,
    lead:"구인 · 구직 · 제휴",
    kw:"구인 구직 채용 알바 캐디 프로채용 제휴 B2B 도매 양도양수 매장양도",
    items:[
      { key:"cr-coach", name:"골프 프로 구인 · 구직" },
      { key:"cr-caddy", name:"캐디 구인" },
      { key:"cr-hire",  name:"골프장 · 연습장 채용" },
      { key:"cr-tieup", name:"골프업체 제휴" },
      { key:"cr-b2b",   name:"골프장비 · 시설 B2B" },
      { key:"cr-hand",  name:"연습장 양도양수" }
    ]},

  { key:"community", name:"골프 커뮤니티", icon:"chat", kind:"board", provider:false,
    lead:"질문 · 후기 · 정보공유",
    kw:"커뮤니티 게시판 질문 후기 리뷰 정보 공유 자유게시판 골프장후기 레슨후기 장비후기",
    items:[
      /* ⚠️⚠️⚠️ **게시판은 여기 한 줄을 더하면 늘어납니다** (2026-11-06).
         목록 거르개 · 글쓰기 고르개 · `/my` 의 내 글 · 커뮤니티 첫
         화면의 묶음이 **전부 이 줄을 읽습니다**(`amCatItems`) — 화면에
         이름을 글자로 박은 자리가 한 곳도 없습니다.
         ⚠️⚠️ **키는 새로 더하기만 합니다.** 이미 올라온 글이 `cq.cat` 에
         키를 **글자로** 들고 있어서, 키를 바꾸면 그 글들이 없는 게시판에
         묶입니다 (작업 기억 — "분류 키를 바꿀 수 있는 때는 데이터가
         0건일 때뿐입니다").
         ⚠️⚠️⚠️ **사고파는 글을 받는 게시판은 만들지 않습니다** — 회원권
         매매 · 쿠폰 양도 같은 것은 **중고 직거래(0056)** 로 갑니다. 거기만
         값을 반드시 받고(지어낸 "협의" 가 안 생깁니다), 연락처를 양쪽이
         따로 열고 닫으며(제17조 제2항), 분쟁 때 낼 것이 남습니다. 글
         게시판으로 받으면 그 자물쇠를 전부 지나갑니다(제20조의4). */
      { key:"cm-open",   name:"자유게시판" },
      { key:"cm-ask",    name:"골프 질문" },
      { key:"cm-course", name:"골프장 후기" },
      { key:"cm-lesson", name:"레슨 후기" },
      { key:"cm-gear",   name:"장비 후기" },
      { key:"cm-screen", name:"스크린골프" },
      { key:"cm-swing",  name:"스윙 · 연습" },
      { key:"cm-begin",  name:"초보 입문" },
      { key:"cm-tip",    name:"골프 정보" },
      { key:"cm-event",  name:"대회 · 이벤트" },
      { key:"cm-club",   name:"동호회" },
      { key:"cm-women",  name:"여성 골퍼" }
    ]}
];

/* ════════════════════════════════════════════════════════════════════
   네 영역 — 2차 지시서 §4

   열 분류를 **그대로 두고** 메인 가운데에 크게 묶어 보여 줍니다.
   ⚠️⚠️ **분류를 여기 다시 적지 않습니다** — 키만 가리킵니다. 이름을
   두 곳에 적으면 한쪽만 고쳐서 조용히 달라집니다.
   ⚠️ 어느 분류도 **빠지거나 두 번 들어가면 안 됩니다** — build.js 가
   빌드에서 셉니다.
   ════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════
   분류마다 **다르게 여쭙는 것** (4차 지시서 §6)

   ⚠️⚠️⚠️ **여기 적은 것은 전부 실제로 받는 칸입니다.** 지어낸 약속이
   아닙니다 (절대 규칙 5). 뒤의 열쇠가 **어느 칸으로 들어가는지**입니다 —
     svc     매칭 요청 양식의 하위 분류 체크 (request_item)
     region  지역 고르개 (request.region)
     want    희망 일정 (request.want_at)
     budget  예산 아래 · 위 (request.budget_min · budget_max)
     body    더 하실 말씀 (request.body · 2000자) — ⚠️ 그 칸의 길잡이 글이
             분류마다 **이 줄에서** 바뀝니다 (js/matchform.js). 길잡이를
             안 바꾸면 "여쭙는다" 고 적어 놓고 **안 여쭙는** 꼴입니다.

   ⚠️⚠️ **없는 분류는 비워 둡니다.** 조인 · 인력 · 커뮤니티는 회원끼리
   쓰는 자리이고 그 기능이 아직 없습니다 — 요청 양식으로 보내면 눌러도
   아무 데도 안 닿습니다. 지시서가 적어 준 항목이라도 **받을 자리가
   없으면 적지 않습니다.**
   ⚠️ 지시서가 "실제 예약 조건" 을 적었지만 우리가 예약을 잡아 드리는
   장치가 없습니다 — "원하시는 티타임 · 인원" 까지만 받고, 예약은 업체와
   직접 하십니다 (§6 "예약 가능 ... 문구를 표시하지 않는다").
   ════════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════════
   분류마다 **다르게 여쭙는 것** — 셋째 칸이 `true` 면 **필수**입니다

   줄 꼴은 [보여 줄 말, 어느 칸으로 받나, 필수인가] 입니다.
   셋째를 안 적으면 **선택**입니다 (전에는 셋째 칸이 아예 없었습니다).

   ⚠️⚠️⚠️ **왜 필수를 가르는가.** 전에는 분류 화면이 "지역 · 날짜를
   여쭙습니다" 라고 적어 놓고 양식에서는 **전부 선택**이었습니다. 그래서
   ① 부킹 요청에 **날짜가 없어도** 들어왔습니다 — 업체가 견적을 낼 수가
   없습니다 ② 지역이 빈 요청이 들어왔는데, `js/assign.js` 는 **분류 + 지역**
   으로 후보를 고릅니다 — 지역이 비면 맞는 업체를 고를 수가 없고 운영자는
   손님에게 다시 물어야 합니다. 적어 놓고 안 받은 것입니다.

   ⚠️⚠️ **예산은 어느 분류에서도 필수가 아닙니다.** 손님이 모르는 것이
   정상이고, 강요하면 **지어내서 적습니다** — 그 숫자로 업체가 견적을
   내면 서로 틀린 값을 보고 이야기하게 됩니다.

   ⚠️⚠️⚠️ **이것은 화면의 규칙이고 DB 가 막는 것이 아닙니다.**
   `make_request`(0041)는 분류마다 다른 규칙을 모릅니다 — 알게 하려면
   하위분류 키 예순둘을 SQL 에 박아야 하고, 그러면 분류가 느는 날 화면과
   DB 가 조용히 어긋납니다 (작업 기억 — 같은 규칙을 두 곳에 적는 자리).
   그래서 **못 막는 것을 막는다고 적지 않습니다**: 주소로 직접 부르면
   빈 값도 들어갑니다. 재려는 뜻은 "손님이 양식에서 빠뜨리지 않게" 입니다.

   ⚠️ 받을 자리가 없는 분류(조인 · 인력 · 커뮤니티)는 **비워 둡니다** —
   그러면 그 구간이 화면에서 줄째 빠집니다. 그 셋은 제 양식이 따로
   있습니다 (0046 · 0047 · 0048).
   ════════════════════════════════════════════════════════════════════ */
window.AM_ASK = {
  lesson: [
    ["레슨 유형",                    "svc",    true],
    /* ⚠️ 배정이 지역으로 후보를 고릅니다 (js/assign.js) */
    ["지역",                         "region", true],
    ["희망 일정",                    "want"],
    ["수업료",                       "budget"],
    ["배우고 싶은 것 · 강사 조건",     "body",   true]
  ],
  booking: [
    ["어떤 부킹인지",                "svc",    true],
    ["지역",                         "region", true],
    /* ⚠️ 날짜 없는 부킹 요청은 업체가 견적을 낼 수 없습니다 */
    ["원하시는 날짜",                "want",   true],
    ["예산",                         "budget"],
    ["희망 티타임 · 인원",            "body",   true]
  ],
  range: [
    ["실내 · 실외 · 스크린",          "svc",    true],
    ["지역",                         "region", true],
    ["이용료",                       "budget"],
    /* ⚠️ 연습장은 "가까운 곳" 이면 되는 분이 많아 선택으로 둡니다 */
    ["원하시는 시설 · 이용 시간대",    "body"]
  ],
  market: [
    ["상품 종류",                    "svc",    true],
    /* ⚠️ 택배로 받는 분이 많아 지역은 선택입니다 */
    ["지역",                         "region"],
    ["예산",                         "budget"],
    ["브랜드 · 모델 · 새것인지 중고인지", "body", true]
  ],
  fitting: [
    ["서비스 종류",                  "svc",    true],
    /* ⚠️ 택배 피팅 · 택배 수리가 있어 지역은 선택입니다 */
    ["지역",                         "region"],
    ["예상 비용",                    "budget"],
    ["클럽 · 증상 · 방문인지 택배인지", "body",  true]
  ],
  travel: [
    ["여행 종류",                    "svc",    true],
    ["출발 지역",                    "region", true],
    ["희망 일정",                    "want",   true],
    ["예산",                         "budget"],
    ["목적지 · 인원 · 포함되었으면 하는 것", "body", true]
  ],
  used: [
    ["매입 견적인지 위탁판매인지",     "svc",    true],
    /* ⚠️ 택배 매입이 있어 지역은 선택입니다 */
    ["지역",                         "region"],
    ["희망 가격",                    "budget"],
    ["브랜드 · 모델 · 부위 · 상태",    "body",   true]
  ]
};

/* 그 분류로 요청할 수 있는가 — ⚠️ 판단은 **여기 한 곳**입니다.
   화면도 양식도 이 함수를 부릅니다 (두 곳에 적으면 조용히 어긋납니다). */
window.amAskOf = function(c){
  var k = (c && c.key) || c;
  var a = window.AM_ASK[k];
  return (a && a.length) ? a : null;
};

/* 그 분류에서 **필수**인 칸만 — ⚠️ 판단은 **여기 한 곳**입니다.
   분류 화면이 별표를 찍는 자리와 양식이 required 를 거는 자리가 같은
   줄을 읽습니다. 두 곳에 적으면 "필수라고 적어 놓고 안 받는" 꼴이
   됩니다 (`tools/test-match.js` 가 맞춰 봅니다).
   ⚠️ 모르는 분류면 **빈 것**을 돌려줍니다 — 모르는 것을 필수로 걸면
   손님이 양식을 못 보냅니다. */
window.amAskReq = function(c){
  var a = window.amAskOf(c), out = {};
  if(!a) return out;
  a.forEach(function(x){ if(x[2]) out[x[1]] = true; });
  return out;
};

/* 그 분류의 **더 하실 말씀** 칸에 띄울 길잡이 — body 로 받는 것들입니다 */
window.amAskBody = function(c){
  var a = window.amAskOf(c);
  if(!a) return "";
  var t = a.filter(function(x){ return x[1] === "body"; })
           .map(function(x){ return x[0]; });
  return t.length ? ("예: " + t.join(" · ")) : "";
};

window.AM_ZONES = [
  { key:"learn", name:"골프 배우기", icon:"swing",
    lead:"실력 향상을 위한 모든 것",
    cats:["lesson", "range", "fitting"] },
  { key:"trade", name:"골프 사고팔기", icon:"cart",
    lead:"믿고 거래하는 골프 마켓",
    cats:["used", "market"] },
  { key:"play",  name:"골프 즐기기", icon:"flag",
    lead:"라운딩부터 골프투어까지",
    cats:["booking", "matchup", "travel"] },
  { key:"biz",   name:"골프 비즈니스 · 소통", icon:"case",
    lead:"골프업계의 새로운 기회",
    cats:["career", "community"] }
];

/* ── 꺼내 쓰는 자리 — 규칙은 **한 함수**에 두고 모두가 그것을 부릅니다 ── */

/* ⚠️⚠️ **분류 주소는 여기서만 짓습니다.** 한 번 build.js 에서만 /cat/ 으로
   바꾸고 링크는 /c/ 로 남겨 둔 적이 있습니다 — 화면 열두 장의 링크
   예순다섯 곳이 전부 410 으로 갈 뻔했습니다.
   ⚠️ c 한 글자는 못 씁니다 — vercel.json 이 /c/:p* 를 410 으로 보냅니다. */
window.amCatUrl = function(c){
  var key = (typeof c === "string") ? c : (c && c.key);
  return key ? "/cat/" + key : "/categories";
};

/* 분류 하나 — 없는 키면 null (지어내지 않습니다) */
window.amCat = function(key){
  var L = window.AM_CATS || [];
  for(var i=0;i<L.length;i++) if(L[i].key === key) return L[i];
  return null;
};

/* 분류의 하위 — 없으면 빈 배열 */
window.amCatItems = function(c){
  if(typeof c === "string") c = window.amCat(c);
  return (c && Array.isArray(c.items)) ? c.items : [];
};

/* 업체가 **고를 수 있는** 하위만 — 입점 양식이 이것을 씁니다.
   ⚠️ pv 를 안 적은 하위는 분류의 provider 를 따릅니다. */
window.amCatItemsForProvider = function(c){
  if(typeof c === "string") c = window.amCat(c);
  if(!c) return [];
  return window.amCatItems(c).filter(function(it){
    return (it.pv === undefined) ? !!c.provider : !!it.pv;
  });
};

/* 업체가 입점하는 분류만 — 입점 안내 · 입점 양식이 이것을 씁니다.
   ⚠️ 고를 수 있는 하위가 **하나도 없는** 분류는 뺍니다 (빈 칸이 됩니다). */
window.amCatsForProvider = function(){
  return (window.AM_CATS || []).filter(function(c){
    return c.provider && window.amCatItemsForProvider(c).length > 0;
  });
};

/* 하위 키 하나로 분류와 하위를 되찾습니다 — 배정 · 저장된 신청을 읽을 때 */
window.amSub = function(subKey){
  var L = window.AM_CATS || [];
  for(var i=0;i<L.length;i++){
    var it = window.amCatItems(L[i]);
    for(var j=0;j<it.length;j++) if(it[j].key === subKey)
      return { cat:L[i], item:it[j] };
  }
  return null;
};

/* ⚠️⚠️⚠️ **하위분류로 업체를 좁혀 가는 주소 — 여기서만 짓습니다.**
   하위 예순둘은 분류 화면에 **글로만** 있어서 거기까지 가는 길이
   없었습니다 ("화면이 있다" 와 "거기까지 가는 길이 있다" 는 다릅니다 —
   `/login` · `/my` 에서 겪은 자리). 지금은 업체찾기의 `sub` 로 갑니다.
   ⚠️ 주소를 두 곳에 지으면 한쪽만 고쳐서 링크가 조용히 엉뚱한 데로
   갑니다 (`amCatUrl` 로 겪었습니다) — 빌드도 브라우저도 이 함수를
   부릅니다.
   ⚠️ 하위 키가 없으면 분류만으로 좁힙니다 (지어내지 않습니다). */
/* 그 하위가 **업체가 하는 일**인가 — `amSubUrl()` 이 갈래를 가를 때
   씁니다. ⚠️ `pv` 를 안 적은 하위는 그 분류가 업체를 받는지로 갈립니다
   (`amCatItemsForProvider` 와 **같은 규칙**이어야 합니다). */
function amSubIsPv(catKey, subKey){
  var L = window.amCatItemsForProvider(catKey) || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === subKey) return true;
  return false;
}
/* 그 하위를 **누를 수 있는가** — 누르면 실제로 좁혀지는 자리가 있을
   때만 링크로 냅니다 (절대 규칙 5 — 눌러도 아무 일이 안 나는 칸을 미리
   만들지 않습니다).
   ⚠️⚠️ 조인 다섯은 **글로 둡니다** — `joinroom` 에 하위 칸이 없어 좁힐
   자료가 **정말로** 없습니다. 링크로 내면 영원히 0건인 자리로 보내는
   것이고, 그건 눌러도 아무 일이 안 나는 칸과 같습니다.
   ⚠️ 인력 · 게시판 · 중고의 하위는 제 목록이 `?s=` 를 읽습니다
   (`js/career.js` · `js/community.js` · `js/listing.js`).
   ⚠️ 그 밖은 **업체가 하는 하위**만 — 업체찾기가 `sub` 로 좁힙니다. */
window.amSubGoes = function(catKey, subKey){
  var c = (typeof catKey === "string") ? catKey : (catKey && catKey.key);
  if(c === "career" || c === "community" || c === "used") return true;
  return amSubIsPv(c, subKey);
};
window.amSubUrl = function(catKey, subKey){
  var c = (typeof catKey === "string") ? catKey : (catKey && catKey.key);
  /* ⚠️⚠️⚠️ **인력 · 비즈니스의 하위는 업체 목록이 아닙니다.** "골프 프로
     구인 · 구직" 을 업체찾기로 보내면 그 화면은 **영원히 0건**이고, 그건
     눌러도 아무 일이 안 나는 칸과 같습니다 (절대 규칙 5). 그 하위는
     제 글 목록으로 보냅니다 (`/cat/career` 의 `js/career.js` 가 `s=` 를
     읽어 좁힙니다).
     ⚠️ 갈래를 가르는 판단을 화면마다 적지 않습니다 — 여기 한 곳입니다. */
  if(c === "career")
    return "/cat/career" + (subKey ? "?s=" + encodeURIComponent(subKey) : "");
  /* ⚠️⚠️⚠️ **게시판 열둘과 중고 물건 종류 일곱도 같은 자리입니다**
     (2026-11-08). 그 열아홉은 `<span>` 으로 그려져 **한 번도 안 눌렸는데**,
     받는 쪽은 진작 있었습니다 — `js/community.js` 와 `js/listing.js` 가
     둘 다 `?s=` 를 읽습니다. **받는 쪽은 있는데 가는 길이 없던** 자리이고,
     0067 에서 인력 `?rg=` · 구합니다 `?s=` 로 겪은 그 자리의 거울상입니다.
     ⚠️ 중고는 **하위마다 갈립니다** — 업체가 하는 둘(`pv:true` · 매입
     견적 · 위탁판매)은 업체찾기로, 나머지 일곱(회원끼리 쓰는 물건 종류)은
     매물 목록으로 갑니다. 그 판단을 화면에 적으면 두 곳이 됩니다. */
  if(c === "community")
    return "/cat/community" + (subKey ? "?s=" + encodeURIComponent(subKey) : "");
  if(c === "used" && subKey && !amSubIsPv("used", subKey))
    return "/cat/used?s=" + encodeURIComponent(subKey);
  var qs = [];
  if(c)      qs.push("cat=" + encodeURIComponent(c));
  if(subKey) qs.push("sub=" + encodeURIComponent(subKey));
  return "/search" + (qs.length ? "?" + qs.join("&") : "");
};

/* ⚠️⚠️⚠️ **`amSubFinds()` 를 여기서 지웠습니다** (2026-11-08).
   그 함수는 "하위를 누르면 업체가 걸러지나 글이 걸러지나" 를 한 낱말로
   내어 「…에서 다루는 것」 구간의 안내문에 쓰였습니다. 그 구간을 걷어
   내면서 **부르는 자리가 0곳**이 되었고, 그러면 그건 기능이 아니라
   남은 글입니다 (`check-doors` 가 SQL 의 문에 대고 세는 그 규칙과
   같습니다 — 0이면 없는 것입니다).
   ⚠️ 지금 그 판단을 하는 자리는 둘입니다 — 어디로 가는지는 `amSubUrl()`,
   눌리는지는 `amSubGoes()`. 칩 위의 길잡이 한 줄은 분류마다 다른 말이라
   `pages/category.js` 의 `KIND` 에 있습니다 (한 낱말로는 중고를 못
   적습니다 — 거기는 하위마다 가는 곳이 갈립니다). */

/* ⚠️⚠️⚠️ **업체가 0곳이어도 지금 되는 것** — 절대 규칙 2 의 "0 인
   자리에는 지금 실제로 되는 것을 같이 냅니다" 를 **한 곳**에서 냅니다.
   업체가 0곳인 동안에도 **회원끼리 되는 것**이 셋 있습니다 (0046 ·
   0047 · 0048) — 조인 · 커뮤니티 · 구인 · 구직. 전에는 0곳 화면이
   "매칭 요청" 과 "입점하기" 둘만 내서, 업체를 기다리는 동안 손님이
   할 수 있는 것이 **없는 것처럼** 보였습니다.
   ⚠️⚠️ **두 곳(빌드 · 브라우저)이 같은 0곳 상자를 그립니다** —
   `pages/search.js` 와 `js/search.js`. 글을 두 벌로 적으면 손님이
   거르개를 누르는 순간 안내가 조용히 달라집니다 (업체 카드에서 겪은
   자리). 그래서 **줄은 여기 하나**입니다.
   ⚠️ 이름 · 주소를 여기 글자로 박지 않습니다 — `AM_CATS` 에서 끌어
   옵니다 (분류 이름을 다듬는 날 두 곳이 어긋나지 않게).
   ⚠️ 그 분류가 없어지면 그 줄도 **저절로 빠집니다** (지어내지 않습니다). */
window.amOpenNow = function(){
  var out = [];
  /* ⚠️ 2026-11-06 — **중고 직거래가 넷째입니다** (0056). 전에는 셋이었고,
     그때 중고장터는 "업체를 기다리는 자리" 였습니다 (매물을 올릴 길이
     없었습니다). 이제 업체가 0곳이어도 회원끼리 사고파실 수 있습니다. */
  [["matchup", "조인 열기"],
   ["used", "중고 매물 올리기"],
   /* ⚠️ 0059 — **"질문 올리기" 가 아니라 "글 올리기"** 입니다. 게시판이
      열둘이고 그 가운데 질문은 하나뿐이라, 질문만 받는 자리처럼 적으면
      하는 일을 좁혀 적는 것이 됩니다 (2026-11-05 에 분류 화면이 "여는
      기능은 아직 없습니다" 라고 적고 있던 그 자리의 작은 판입니다). */
   ["community", "게시판에 글 올리기"],
   ["career", "구인 · 구직 올리기"],
   /* ⚠️ 0061 — **다섯째입니다.** 업체가 0곳이어도 "이런 걸 찾고 있어요"
      를 올려 두실 수 있고, 업체가 들어오는 날 그 글이 그대로 보입니다.
      ⚠️ 보내는 곳은 레슨입니다 — 다섯 분류 가운데 손님이 가장 먼저
      찾는 자리이고, 거기서 다른 분류로 가는 길이 화면에 있습니다
      (묶음을 눌렀는데 분류 하나로 보내면 나머지는 어디 갔는지 알 수
      없다는 그 줄과 같은 결입니다). */
   ["lesson", "구합니다 글 올리기"]].forEach(function(x){
    var c = window.amCat(x[0]);
    if(c) out.push({ href: window.amCatUrl(c), label: x[1], icon: c.icon });
  });
  return out;
};

/* ── 구합니다 (0061) 가 서는 분류 ──────────────────────────────────
   ⚠️⚠️ **한 곳입니다.** 분류 화면(빌드) · 목록(브라우저) · `/my` · 검사가
   전부 이 함수를 읽습니다. 글자로 박으면 분류가 바뀌는 날 두 곳이
   어긋나고, 그때 화면은 보내는데 DB 가 거절합니다.

   ⚠️⚠️⚠️ **부킹은 뺍니다.** 거기는 업체가 티타임을 올리는 자리(0060)가
   이미 있어서, 같은 화면에 "자리 올림" 과 "자리 구함" 이 둘 다 서면
   손님이 어느 쪽을 눌러야 할지 모릅니다. 부킹에서 자리를 찾으시는
   길은 ① 티타임 목록 ② 60일 밖이면 사전 상담 둘입니다.
   ⚠️ 빼는 분류를 여기 **한 줄**로 두는 까닭은, 다음에 누가 "왜 부킹만
   없지" 하고 되살릴 때 **까닭이 바로 옆에** 있게 하려는 것입니다. */
window.AM_WANT_OFF = ["booking"];
window.amWantCats = function(){
  var off = window.AM_WANT_OFF || [];
  return (window.amCatsOf ? window.amCatsOf("provider") : []).filter(
    function(c){ return off.indexOf(c.key) < 0; });
};
window.amWantOn = function(c){
  if(typeof c === "string") c = window.amCat(c);
  if(!c) return false;
  return (window.amWantCats() || []).some(function(x){ return x.key === c.key; });
};

/* 화면 짜임새로 고르기 — ⚠️ kind 를 화면마다 다시 적지 마세요. */
window.amCatsOf = function(kind){
  return (window.AM_CATS || []).filter(function(c){ return c.kind === kind; });
};
window.amCatIsProvider = function(c){
  if(typeof c === "string") c = window.amCat(c);
  return !!(c && c.kind === "provider");
};

/* 네 영역 — 영역 하나가 가리키는 분류들 */
window.amZoneCats = function(z){
  if(typeof z === "string")
    z = (window.AM_ZONES || []).filter(function(x){ return x.key === z; })[0];
  if(!z) return [];
  return (z.cats || []).map(function(k){ return window.amCat(k); })
                       .filter(Boolean);
};

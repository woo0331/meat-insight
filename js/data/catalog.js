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
      { key:"mk-train", name:"연습용품" }
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
      { key:"cm-open",   name:"자유게시판" },
      { key:"cm-ask",    name:"골프 질문" },
      { key:"cm-course", name:"골프장 후기" },
      { key:"cm-lesson", name:"레슨 후기" },
      { key:"cm-gear",   name:"장비 후기" },
      { key:"cm-tip",    name:"골프 정보" },
      { key:"cm-club",   name:"동호회" }
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

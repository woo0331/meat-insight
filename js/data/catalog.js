/* ════════════════════════════════════════════════════════════════════
   ServiceCategory · ServiceSubcategory (§7~20 창업 · §21~33 폐업)

   **이 파일이 플랫폼의 뼈대입니다.** 화면 · 검색 · 업체 입점 · 견적
   요청 · 크롤러 본문 · 주소가 전부 여기서 나옵니다.

   | 칸 | 무엇 |
   |---|---|
   | `key`  | **주소에 들어갑니다** (`/c/interior`). 한 번 정하면 바꾸지 마세요 |
   | `kind` | `provider` 업체를 찾는 곳 · `listing` 매물을 보고 등록하는 곳 · `info` 정보 |
   | `items`| 하위 분류. 이것이 **업체 입점의 단위**입니다 (§39) |

   ⚠️ **하위 분류를 코드에 박지 마세요** (§54). 화면은 이 배열만
   읽습니다. 관리자에서 추가·삭제·정렬하게 하려고 데이터로 둔 것입니다.
   ⚠️ `equip`(시설·장비)의 하위는 **여기 없습니다.** 업종마다 다르기
   때문에 `industries.js` 의 `equip` 에서 옵니다 (§12).
   ⚠️ **업체 명단을 만들지 마세요.** 이 화면들은 "무엇이 필요한지"
   고르는 자리이고, 업체는 조건이 정해진 뒤에 나옵니다 (§54).
   ⚠️ 새 분류를 넣으면 `industries.js` 의 `startup`/`closure` 차례에도
   넣으세요. 안 넣으면 그 업종에서 **조용히 안 보입니다** —
   `node build-pages.js` 가 어긋난 key 를 잡습니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── START · 창업에 필요한 모든 것 ──────────────────────────────── */
window.AM_START_CATS = [
  { key:"item", name:"창업 아이템", icon:"bulb", tone:"t1", kind:"info",
    lead:"무엇으로 시작할지부터",
    desc:"프랜차이즈로 할지 내 브랜드로 할지, 얼마로 시작할 수 있는지부터 정합니다.",
    items:[
      { key:"franchise",   name:"프랜차이즈", to:"/franchise" },
      { key:"independent", name:"개인창업" },
      { key:"by-industry", name:"업종별 창업정보" },
      { key:"small-cap",   name:"소자본 창업" },
      { key:"unmanned",    name:"무인창업" },
      { key:"solo",        name:"1인창업" },
      { key:"new-brand",   name:"신규 브랜드" },
      { key:"takeover",    name:"기존 매장 인수", to:"/stores" }
    ]},

  { key:"store", name:"점포 · 상가", icon:"pin", tone:"t2", kind:"listing",
    lead:"자리를 정합니다",
    desc:"지역 · 업종 · 평수 · 보증금 · 월세 · 권리금으로 찾습니다.",
    to:"/stores",
    items:[
      { key:"shop",        name:"상가" },
      { key:"store-space", name:"점포" },
      { key:"running",     name:"기존 영업장" },
      { key:"premium",     name:"권리금 매장" },
      { key:"no-premium",  name:"무권리 매장" },
      { key:"with-equip",  name:"시설 인수 가능 매장" }
    ]},

  { key:"area", name:"상권 · 입지", icon:"map", tone:"t5", kind:"info",
    lead:"그 자리가 맞는 자리인가",
    desc:"자리를 정하기 전에 확인할 것과, 봐 줄 수 있는 전문가를 찾습니다.",
    items:[
      { key:"trade-area",  name:"상권분석" },
      { key:"foot-traffic",name:"유동인구" },
      { key:"households",  name:"배후세대" },
      { key:"competitors", name:"주변 경쟁업체" },
      { key:"region",      name:"지역분석" },
      { key:"sales-data",  name:"매출 관련 데이터" },
      { key:"site-consult",name:"입지 상담", kind:"provider" }
    ]},

  { key:"interior", name:"인테리어 · 시공", icon:"roller", tone:"t4", kind:"provider",
    lead:"가게를 만듭니다",
    desc:"지역 · 업종 · 평수 · 예산으로 업체를 비교하고 견적을 받습니다.",
    items:[
      { key:"interior", name:"인테리어" }, { key:"design",  name:"설계" },
      { key:"electric", name:"전기" },     { key:"plumbing",name:"배관" },
      { key:"gas",      name:"가스" },     { key:"fire",    name:"소방" },
      { key:"hvac",     name:"냉난방" },   { key:"duct",    name:"닥트 · 후드" },
      { key:"floor",    name:"바닥" },     { key:"paint",   name:"도장" },
      { key:"sign",     name:"간판" },     { key:"awning",  name:"어닝" },
      { key:"metal",    name:"철물" }
    ]},

  { key:"equip", name:"시설 · 장비", icon:"tool", tone:"t7", kind:"provider",
    lead:"업종마다 다릅니다",
    desc:"고르신 업종에 필요한 장비만 보여 드립니다.",
    byIndustry:true,      /* ⚠️ 하위 분류가 업종에서 옵니다 (§12) */
    /* ⚠️ `kw` 는 **검색에만** 쓰는 다른 말입니다 — 화면에는 안 나옵니다.
       이 분류는 이름이 "시설 · 장비" 인데 손님은 **"주방설비"** 라고
       칩니다. 하위가 업종에서 와서(`byIndustry`) 분류 자신이 들고 있는
       글자가 거의 없고, 그래서 "주방설비" 가 **0건**이었습니다.
       ⚠️ 없는 서비스를 적는 칸이 아닙니다 — **같은 것을 가리키는 다른
       말**만 적습니다 (절대 규칙 1). */
    kw:"주방설비 주방기기 설비 기기 집기설비",
    items:[] },

  { key:"furniture", name:"가구 · 집기", icon:"sofa", tone:"t3", kind:"provider",
    lead:"앉을 것과 놓을 것",
    desc:"업소용 가구와 맞춤 제작을 하는 곳을 찾습니다.",
    items:[
      { key:"table",   name:"테이블" }, { key:"chair",   name:"의자" },
      { key:"shelf",   name:"선반" },   { key:"storage", name:"수납" },
      { key:"counter", name:"카운터" }, { key:"biz-furn",name:"업소용 가구" },
      { key:"custom",  name:"맞춤가구" }
    ]},

  { key:"it", name:"IT · 매장시스템", icon:"monitor", tone:"t1", kind:"provider",
    lead:"주문받고 결제하고 지키는 것",
    desc:"POS · 키오스크 · CCTV · 통신까지 한 번에 비교합니다.",
    items:[
      { key:"pos",       name:"POS" },        { key:"kiosk",   name:"키오스크" },
      { key:"table-order",name:"테이블오더" }, { key:"cctv",    name:"CCTV" },
      { key:"internet",  name:"인터넷" },      { key:"phone",   name:"전화" },
      { key:"wifi",      name:"와이파이" },    { key:"booking", name:"예약시스템" },
      { key:"waiting",   name:"웨이팅" },      { key:"payment", name:"결제단말기" },
      { key:"e-menu",    name:"전자메뉴판" },  { key:"security",name:"보안" }
    ]},

  { key:"supply", name:"운영 공급업체", icon:"pkgck", tone:"t2", kind:"provider",
    lead:"매일 들어오는 것",
    desc:"거래처를 새로 뚫거나 바꾸실 때 조건을 비교합니다.",
    items:[
      { key:"ingredient",name:"식자재" },   { key:"beverage", name:"음료" },
      { key:"liquor",    name:"주류" },     { key:"material", name:"원재료" },
      { key:"packaging", name:"포장재" },   { key:"consumable",name:"소모품" },
      { key:"uniform",   name:"유니폼" },   { key:"hygiene",  name:"위생용품" },
      { key:"cleaning-sup",name:"청소용품" }
    ]},

  { key:"admin", name:"행정 · 전문가", icon:"briefcase", tone:"t7", kind:"provider",
    lead:"서류와 자격",
    desc:"지역 · 전문분야 · 상담 가능 여부로 전문가를 찾습니다.",
    items:[
      { key:"tax-agent", name:"세무사" },     { key:"labor-agent",name:"노무사" },
      { key:"admin-agent",name:"행정사" },    { key:"legal",     name:"법무 · 법률" },
      { key:"insurance", name:"보험" },       { key:"biz-reg",   name:"사업자등록" },
      { key:"permit",    name:"인허가" },     { key:"hygiene-edu",name:"위생교육" },
      { key:"certify",   name:"인증" }
    ]},

  { key:"staff", name:"인력", icon:"users", tone:"t5", kind:"provider",
    lead:"같이 일할 사람",
    desc:"채용을 대신하지 않습니다 — 채용을 도와줄 곳을 연결합니다.",
    items:[
      { key:"fulltime", name:"정직원" },     { key:"parttime", name:"아르바이트" },
      { key:"pro-staff",name:"업종별 전문인력" },
      { key:"headhunt", name:"헤드헌팅" },   { key:"training", name:"교육" },
      { key:"outsource",name:"외주" }
    ]},

  { key:"marketing", name:"마케팅 · 디자인", icon:"megaphone", tone:"t8", kind:"provider",
    lead:"알리는 일",
    desc:"브랜딩부터 오픈 마케팅까지 맡길 곳을 비교합니다.",
    items:[
      { key:"naming",   name:"브랜드 네이밍" }, { key:"logo",     name:"로고" },
      { key:"bici",     name:"BI · CI" },       { key:"menu-design",name:"메뉴판" },
      { key:"package",  name:"패키지" },        { key:"photo",    name:"사진" },
      { key:"video",    name:"영상" },          { key:"sns",      name:"SNS" },
      { key:"blog",     name:"블로그" },        { key:"place",    name:"플레이스 관리" },
      { key:"ad-agency",name:"광고대행" },      { key:"influencer",name:"인플루언서" },
      { key:"flyer",    name:"전단지" },        { key:"outdoor",  name:"옥외광고" },
      { key:"open-mkt", name:"오픈 마케팅" }
    ]},

  { key:"clean", name:"청소 · 방역 · 유지관리", icon:"sparkle", tone:"t2", kind:"provider",
    lead:"열기 전과 연 다음",
    desc:"입주청소부터 정기 관리까지 맡길 곳을 찾습니다.",
    items:[
      { key:"move-in",  name:"입주청소" },   { key:"kitchen-clean",name:"주방청소" },
      { key:"aircon",   name:"에어컨청소" }, { key:"disinfect",name:"방역" },
      { key:"pest",     name:"해충방제" },   { key:"regular",  name:"정기청소" },
      { key:"facility", name:"시설관리" }
    ]},

  { key:"fund", name:"자금 · 정부지원", icon:"wallet", tone:"t5", kind:"info",
    lead:"돈이 드는 일이니까",
    desc:"창업자금과 정책자금 정보를 모아 둡니다.",
    to:"/support",
    items:[
      { key:"startup-fund",name:"창업자금 정보" }, { key:"policy-fund",name:"정책자금" },
      { key:"gov-program", name:"정부지원사업" }, { key:"guarantee",  name:"보증제도" },
      { key:"finance",     name:"금융 제휴" },    { key:"insure",     name:"보험" },
      { key:"payment-svc", name:"결제" }
    ]}
];

/* ── CLOSE · 폐업에 필요한 모든 것 ──────────────────────────────── */
window.AM_CLOSE_CATS = [
  { key:"process", name:"폐업 절차", icon:"listck", tone:"t7", kind:"info",
    lead:"무엇부터 해야 하는지",
    desc:"순서 · 필요서류 · 예상되는 비용 · 기한을 정리합니다.",
    items:[
      { key:"checklist", name:"폐업 체크리스트" }, { key:"steps",   name:"폐업 절차" },
      { key:"documents", name:"필요서류" },        { key:"cost",    name:"예상비용" },
      { key:"schedule",  name:"일정관리" },        { key:"expert",  name:"관련 전문가" }
    ]},

  { key:"transfer", name:"매장 양도", icon:"handover", tone:"t1", kind:"listing",
    lead:"가게를 통째로 넘기기",
    desc:"점포 · 권리금 · 시설을 포함해 넘기실 수 있습니다.",
    to:"/stores",
    items:[
      { key:"store-transfer",name:"점포 양도" },   { key:"premium",  name:"권리금" },
      { key:"equip-transfer",name:"시설 양도" },   { key:"find-buyer",name:"인수자 찾기" },
      { key:"fc-transfer",   name:"프랜차이즈 매장 양도" }
    ]},

  { key:"asset", name:"시설 · 집기 처분", icon:"sofa", tone:"t3", kind:"listing",
    lead:"쓰던 장비와 집기",
    desc:"개별 판매 · 일괄 판매 · 시설 전체 인수까지 됩니다.",
    to:"/assets",
    items:[
      { key:"kitchen-eq",name:"주방장비" },  { key:"fridge",  name:"냉장 · 냉동" },
      { key:"espresso",  name:"커피머신" },  { key:"furniture",name:"가구" },
      { key:"pos",       name:"POS" },       { key:"kiosk",   name:"키오스크" },
      { key:"fitness",   name:"운동기구" },  { key:"salon-eq",name:"미용기기" },
      { key:"biz-eq",    name:"업소용 장비" }
    ]},

  { key:"stock", name:"재고 처분", icon:"boxes", tone:"t2", kind:"listing",
    lead:"남은 것",
    desc:"식자재 · 상품 · 포장재 · 소모품을 업종별로 내놓습니다.",
    to:"/assets",
    items:[
      { key:"ingredient",name:"식자재" },  { key:"goods",    name:"상품" },
      { key:"packaging", name:"포장재" },  { key:"consumable",name:"소모품" },
      { key:"material",  name:"원재료" },  { key:"etc-stock",name:"기타 재고" }
    ]},

  { key:"demolish", name:"철거", icon:"hammer", tone:"t4", kind:"provider",
    lead:"뜯어내는 일",
    desc:"지역 · 평수 · 업종 · 사진을 올리면 여러 곳에서 견적이 옵니다.",
    items:[
      { key:"full",     name:"전체철거" },  { key:"partial", name:"부분철거" },
      { key:"kitchen",  name:"주방철거" },  { key:"sign",    name:"간판철거" },
      { key:"facility", name:"시설철거" },  { key:"waste",   name:"폐기물" }
    ]},

  { key:"restore", name:"원상복구", icon:"roller", tone:"t5", kind:"provider",
    lead:"임대차가 끝나기 전에",
    desc:"어디까지 복구해야 하는지부터 확인하고 견적을 받습니다.",
    items:[
      { key:"shop-restore",name:"상가 원상복구" }, { key:"electric",name:"전기" },
      { key:"plumbing",    name:"배관" },          { key:"gas",     name:"가스" },
      { key:"floor",       name:"바닥" },          { key:"wall",    name:"벽" },
      { key:"ceiling",     name:"천장" },          { key:"sign",    name:"간판" }
    ]},

  { key:"waste", name:"폐기물 · 수거", icon:"trash", tone:"t7", kind:"provider",
    lead:"내보내는 일",
    desc:"허가가 필요한 일입니다 — 자격을 확인한 곳으로 연결합니다.",
    items:[
      { key:"biz-waste", name:"사업장 폐기물" }, { key:"bulky",   name:"대형폐기물" },
      { key:"furniture", name:"가구" },          { key:"electronics",name:"전자제품" },
      { key:"biz-eq",    name:"업소용 장비" },   { key:"recycle", name:"재활용품" }
    ]},

  { key:"tax", name:"폐업 세무 · 행정", icon:"calc", tone:"t7", kind:"provider",
    lead:"신고하고 정리하는 일",
    desc:"기한을 놓치면 가산세가 붙습니다. 전문가와 확인하세요.",
    items:[
      { key:"close-report",name:"폐업신고" },     { key:"vat",     name:"부가세" },
      { key:"income-tax",  name:"종합소득세" },   { key:"biz-reg", name:"사업자등록 정리" },
      { key:"permit",      name:"인허가 정리" },  { key:"consult", name:"전문가 상담" }
    ]},

  { key:"labor", name:"직원 · 노무", icon:"users", tone:"t5", kind:"provider",
    lead:"같이 일하던 사람",
    desc:"퇴직금과 4대보험 정리는 순서가 있습니다.",
    items:[
      { key:"resign",   name:"직원 퇴직" },   { key:"severance",name:"퇴직금" },
      { key:"insurance4",name:"4대보험" },    { key:"contract-end",name:"근로계약 종료" },
      { key:"consult",  name:"노무상담" }
    ]},

  { key:"contract", name:"계약 해지", icon:"filex", tone:"t4", kind:"provider",
    lead:"묶여 있는 것들",
    desc:"약정 기간이 남아 있으면 위약금이 생깁니다. 먼저 확인하세요.",
    items:[
      { key:"internet", name:"인터넷" }, { key:"phone",   name:"전화" },
      { key:"pos",      name:"POS" },    { key:"kiosk",   name:"키오스크" },
      { key:"rental",   name:"렌탈" },   { key:"water",   name:"정수기" },
      { key:"cctv",     name:"CCTV" },   { key:"security",name:"보안" },
      { key:"insurance",name:"보험" }
    ]},

  { key:"law", name:"법률 · 채무", icon:"scale", tone:"t6", kind:"provider",
    lead:"다툼이 생겼을 때",
    desc:"저희가 대리하지 않습니다 — 자격 있는 전문가를 연결합니다.",
    items:[
      { key:"lease",    name:"임대차" },   { key:"receivable",name:"미수금" },
      { key:"debt",     name:"채권 · 채무" }, { key:"dispute", name:"계약분쟁" },
      { key:"consult",  name:"법률상담" }
    ]},

  { key:"support", name:"폐업지원", icon:"coins", tone:"t2", kind:"info",
    lead:"받을 수 있는 것",
    desc:"철거비 지원처럼 조건만 맞으면 받는 것이 있습니다.",
    to:"/support",
    items:[
      { key:"gov-close", name:"정부 폐업지원" }, { key:"demolish-fund",name:"철거비 지원" },
      { key:"rehire",    name:"재취업" },        { key:"restart",  name:"재창업" },
      { key:"policy",    name:"정책지원" },      { key:"program",  name:"지원사업" }
    ]}
];

/* ── 찾아 쓰는 함수 ──────────────────────────────────────────────── */
window.AM_CATS = (window.AM_START_CATS || []).concat(window.AM_CLOSE_CATS || []);

/* 하위 분류 key → 이름. ⚠️ 전에는 `/p/:id` 화면 안에 박혀 있어서,
   다른 자리(후기 · 검색)에서 쓰려면 같은 반복문을 또 적어야 했습니다. */
window.amSubName = function(key){
  if(!key) return "";
  var cats = window.AM_CATS || [];
  for(var i = 0; i < cats.length; i++){
    var items = cats[i].items || [];
    for(var j = 0; j < items.length; j++)
      if(items[j].key === key) return items[j].name;
  }
  return key;
};

window.amCat = function(key){
  var r = AM_CATS.filter(function(c){ return c.key === key; });
  return r.length ? r[0] : null;
};
window.amCatSide = function(key){
  return (window.AM_START_CATS||[]).some(function(c){ return c.key === key; }) ? "start" : "close";
};
/* 업종을 알면 장비 하위 분류가 그 업종 것으로 바뀝니다 (§12) */
window.amCatItems = function(cat, industryKey){
  if(!cat) return [];
  if(cat.byIndustry){
    var ind = (typeof amIndustry === "function") ? amIndustry(industryKey) : null;
    return (ind && ind.equip) ? ind.equip : [];
  }
  return cat.items || [];
};
/* 업종이 정한 차례대로 카테고리를 돌려줍니다 (§41) */
window.amCatsFor = function(industryKey, side){
  var ind = (typeof amIndustry === "function") ? amIndustry(industryKey) : null;
  var all = (side === "close") ? (window.AM_CLOSE_CATS||[]) : (window.AM_START_CATS||[]);
  if(!ind) return all;
  var order = (side === "close") ? (ind.closure||[]) : (ind.startup||[]);
  if(!order.length) return all;
  var picked = order.map(function(k){
    return all.filter(function(c){ return c.key === k; })[0];
  }).filter(Boolean);
  /* 차례에 안 적힌 것도 빠뜨리지 않고 뒤에 붙입니다 —
     ⚠️ 여기서 잘라 내면 그 업종 사장님에게는 그 기능이 없는 것이 됩니다 */
  all.forEach(function(c){ if(picked.indexOf(c) < 0) picked.push(c); });
  return picked;
};
/* 하위 분류 하나 찾기 — 업체 입점 · 업체 목록의 단위입니다 */
window.amSub = function(catKey, subKey, industryKey){
  var c = amCat(catKey); if(!c) return null;
  var r = amCatItems(c, industryKey).filter(function(i){ return i.key === subKey; });
  return r.length ? r[0] : null;
};

/* ════════════════════════════════════════════════════════════════════
   창업을 **과정**으로 보여 줍니다 (§7)

   분류를 열세 개 늘어놓으면 손님이 그걸 공부해야 합니다. 사장님이
   알고 싶은 것은 **"내가 지금 어디까지 왔고 다음에 뭘 해야 하는가"**
   입니다.

   ⚠️ **단계는 업종과 무관하게 같습니다.** 자리를 찾고 → 만들고 →
   채우고 → 영업 준비하고 → 손님을 받는 것은 카페든 미용실이든
   같습니다. 업종이 갈리는 것은 **각 단계 안의 하위 서비스**입니다
   (카페 3단계에 커피머신, 미용 3단계에 샴푸대).

   ⚠️⚠️ **모든 분류가 어느 한 단계에는 들어가야 합니다.** 빠뜨리면
   그 분류가 창업 화면에서 **조용히 사라집니다** — 에러도 안 나고
   화면도 멀쩡합니다. `check.js` 가 개수를 맞춰 봅니다.
   ════════════════════════════════════════════════════════════════════ */
window.AM_START_STEPS = [
  { n:"01", key:"place", name:"자리 찾기", icon:"map",
    lead:"무엇을 할지 정하고, 돈을 마련하고, 자리를 고릅니다",
    cats:["item","fund","store","area"] },
  { n:"02", key:"build", name:"가게 만들기", icon:"hammer",
    lead:"공사가 제일 오래 걸리고 제일 많이 듭니다",
    cats:["interior"] },
  { n:"03", key:"fill",  name:"채우기", icon:"box",
    lead:"업종에 따라 여기가 제일 많이 갈립니다",
    cats:["equip","furniture","supply"] },
  { n:"04", key:"ready", name:"영업 준비", icon:"doc",
    lead:"서류와 시스템. 빠뜨리면 문을 못 엽니다",
    cats:["it","admin","staff"] },
  { n:"05", key:"open",  name:"손님 받기", icon:"megaphone",
    lead:"열고 나서가 진짜 시작입니다",
    cats:["marketing","clean"] }
];

/* 그 업종의 그 단계에 들어가는 분류.
   ⚠️ 업종 차례(`amCatsFor`)를 **단계 안에서** 지킵니다 — 업종이 먼저
   꼽은 분류가 그 단계에서도 앞에 옵니다. */
window.amStepCats = function(step, industryKey){
  var order = (window.amCatsFor ? amCatsFor(industryKey, "start") : (window.AM_START_CATS||[]));
  var want = {};
  (step.cats || []).forEach(function(k){ want[k] = 1; });
  return order.filter(function(c){ return want[c.key]; });
};

/* ════════════════════════════════════════════════════════════════════
   폐업은 목록이 아니라 **무엇을 원하시는가**부터 묻습니다 (§8)

   폐업 화면에 들어오자마자 분류 열두 개를 늘어놓으면, 이미 지쳐
   계신 분께 숙제를 하나 더 드리는 것입니다. 원하는 결과를 고르시면
   그에 맞는 절차만 추려 드립니다.

   ⚠️ **고르신 것에 없는 분류를 숨기지 마세요.** 추려 낸 것 아래에
   나머지도 냅니다 — 숨기면 그 사장님에게는 그 기능이 없는 것이
   됩니다. `check.js` 가 봅니다.
   ════════════════════════════════════════════════════════════════════ */
/* ⚠️⚠️ **2026-10-07 최종 전면개편 지시서 §34 의 네 가지**입니다.
   전에는 "통째로 넘기고 싶어요 · 돈을 남기고 싶어요 · 빨리 정리하고
   싶어요 · 모르겠어요" 였는데, 그건 **바람**을 묻는 것이라 로드맵으로
   이어지지 않았습니다. 지금은 **상황**을 묻고 상황마다 로드맵이
   하나씩 붙습니다 (`proc`).

   ⚠️⚠️ **차례를 바꾸지 마세요.** 양도 → 시설·장비 → 완전폐업 순서가
   §38 입니다 — 폐업을 철거로 시작하지 않습니다.
   ⚠️ `proc` 이 비어 있는 것(`unsure`)은 **짧은 진단**으로 갑니다 (§39).
   ⚠️ `cats` 는 아래 분야 묶음을 추릴 때 씁니다 — 잘라 내지 않고
   **앞으로 당겨** 냅니다. */
window.AM_CLOSE_WANTS = [
  { key:"transfer", name:"매장 전체를 넘기고 싶어요", icon:"key",
    proc:"close-transfer",
    lead:"양도가 되면 철거비도 안 들고 권리금을 회수할 기회가 생깁니다",
    cats:["transfer","contract","tax","labor","law"] },
  { key:"assets", name:"시설 · 장비를 정리하고 싶어요", icon:"boxes",
    proc:"close-assets",
    lead:"버리는 것보다 넘기는 쪽이 낫습니다. 시설 · 집기 · 재고까지",
    cats:["asset","stock","transfer","waste","demolish"] },
  { key:"full", name:"완전히 폐업하려고 해요", icon:"box",
    proc:"close-full",
    lead:"순서와 기한이 있는 일이라 빠뜨리면 돈이 나갑니다",
    cats:["process","tax","labor","contract","restore","demolish","waste"] },
  { key:"unsure", name:"아직 어떻게 해야 할지 모르겠어요", icon:"info",
    proc:"",
    lead:"다섯 가지만 여쭤 보고 사장님 상황에 맞는 순서를 찾아 드립니다",
    cats:["process","tax","labor","contract","restore"] }
];

/* ── 짧은 진단 (§39) ─────────────────────────────────────────────
   ⚠️ **질문을 너무 많이 만들지 않습니다** (§39 이 직접 적었습니다).
   다섯입니다. 답은 주소에 실립니다 (`?d=ynyny`) — 뒤로 가기 ·
   새로고침 · 링크 공유에 살아남고, 아무것도 저장하지 않습니다. */
window.AM_CLOSE_ASK = [
  { key:"open",  q:"지금도 영업하고 계신가요?",
    y:"영업 중",        n:"이미 닫았습니다" },
  { key:"lease", q:"임대차 계약이 남아 있나요?",
    y:"남아 있습니다",  n:"끝났거나 곧 끝납니다" },
  { key:"pass",  q:"매장을 넘길 생각이 있으신가요?",
    y:"있습니다",      n:"없습니다" },
  { key:"asset", q:"시설 · 장비가 남아 있나요?",
    y:"남아 있습니다",  n:"없습니다" },
  { key:"staff", q:"직원이 있으신가요?",
    y:"있습니다",      n:"없습니다" }
];

/* 답을 보고 어느 순서가 맞는지 고릅니다.
   ⚠️ 판정이 아니라 **차례 고르기**입니다 — 고르지 않은 길도 아래에
   그대로 두어, 사장님이 다른 쪽을 보실 수 있어야 합니다. */
window.amCloseAdvice = function(ans){
  var a = ans || {};
  if(a.pass === "y" && a.lease === "y")
    return { key:"transfer",
      why:"임대차 계약이 남아 있고 넘기실 뜻이 있으시니, 매장 전체 양도부터 " +
           "보시는 것이 낫습니다. 양도가 되면 철거비와 원상복구가 줄어듭니다." };
  if(a.pass !== "y" && a.asset === "y" && a.lease !== "y")
    return { key:"assets",
      why:"계약이 얼마 남지 않았고 넘기실 뜻이 없으시니, 남은 시설 · 장비를 " +
           "먼저 정리하는 쪽이 낫습니다. 버리기 전에 나갈 것부터 고릅니다." };
  return { key:"full",
    why:"정리하실 것이 여럿입니다. 양도 가능성부터 보고 시설 · 재고 · 행정을 " +
         "거쳐 마지막에 철거 · 원상복구로 갑니다 — 이 차례를 지키시면 " +
         "돌려받을 수 있는 것을 버리지 않습니다." };
};

window.amCloseWant = function(key){
  var r = (window.AM_CLOSE_WANTS||[]).filter(function(w){ return w.key === key; });
  return r.length ? r[0] : null;
};

/* 고르신 것에 맞는 분류를 **앞에**, 나머지는 뒤에.
   ⚠️ 잘라 내지 않습니다 — 숨기면 그 기능이 없는 것이 됩니다. */
window.amCloseCatsFor = function(wantKey, industryKey){
  var all = (window.amCatsFor ? amCatsFor(industryKey, "close") : (window.AM_CLOSE_CATS||[]));
  var w = amCloseWant(wantKey);
  if(!w) return { hit:all, rest:[] };
  var want = {};
  w.cats.forEach(function(k){ want[k] = 1; });
  return {
    hit:  all.filter(function(c){ return want[c.key]; }),
    rest: all.filter(function(c){ return !want[c.key]; })
  };
};

/* 업체가 "내가 하는 일" 을 찾을 때 쓰는 목록.
   ⚠️ `byIndustry` 분류(시설 · 장비)는 하위가 **업종에서** 옵니다.
   업종을 안 고른 화면(`/join`)에서는 비어 있어서, 제목만 남고 칸이
   텅 비었습니다 — 절대 규칙 2 위반입니다. 그래서 여기서는 **모든
   업종의 장비를 합쳐서** 돌려줍니다. 주방설비 업체도 미용기기
   업체도 자기 분야를 찾을 수 있어야 입점합니다.
   ⚠️ 같은 이름이 여러 업종에 있습니다(냉장 · 냉동). 한 번만 냅니다. */
window.amAllSubs = function(cat){
  if(!cat) return [];
  if(!cat.byIndustry) return (cat.items || []).slice();
  var seen = {}, out = [];
  (window.AM_INDUSTRIES || []).forEach(function(i){
    (i.equip || []).forEach(function(e){
      if(seen[e.name]) return;
      seen[e.name] = 1; out.push(e);
    });
  });
  return out;
};

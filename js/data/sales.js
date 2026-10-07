/* ════════════════════════════════════════════════════════════════════
   영업 카테고리 · 영업 상태 — 직원이 보는 말로 묶은 틀
   (2026-10-07 "원페이지 영업·입점 어드민" 지시서 §5 · §6 · §12 · §16)

   ⚠️⚠️ **새 서비스 DB 가 아닙니다.** `catalog.js` 의 분류 25 · 하위 183 을
   **묶어 보는 틀**입니다. 업체(`subs`) · 매물(`sub`) · 글(`cat`) · 업종
   (`startup`/`closure`)이 전부 `catalog.js` 의 key 를 쓰기 때문에, 여기서
   이름이나 key 를 새로 만들면 **등록된 모든 데이터가 조용히 어긋납니다.**
   `lifecycle.js`(사업 단계 여섯) · `journey.js`(여정 넷)와 같은 성격입니다.

   ⚠️⚠️ **분류 25 가 빠짐없이 한 곳씩 들어갑니다.** 01~13 이 자기 것을
   적고, **14 기타는 남은 것을 그 자리에서 셉니다**(`etc:true`) — 손으로
   적어 두면 분류를 늘릴 때마다 조용히 빠집니다. `checkSales()` 가 빌드를
   멈춥니다 (빠진 것 · 겹치는 것 · 없는 key).

   ⚠️ `find` 는 **검색할 말**입니다 (네이버 · 지도에 쳐 볼 낱말). 서비스
   목록이 아닙니다 — 지시서 §5 가 적은 "공인중개 · 음식점 인테리어" 처럼
   우리 DB 에 분류로는 없지만 직원이 찾아야 하는 말이 섞여 있습니다.
   화면에 나가는 **서비스 이름은 전부 `catalog.js` 에서 가져옵니다.**

   ⚠️ `prio` 는 **사람이 정한 영업 순서**입니다. 이용 데이터가 아닙니다 —
   조회수 · 클릭 · 요청 수를 하나도 모으지 않으므로 "많이 찾는 분야" 를
   적을 수 없습니다 (마무리 지시서 §3).
   ════════════════════════════════════════════════════════════════════ */

window.AM_SALES_GROUPS = [
  { key:"estate", no:"01", name:"점포 · 부동산", prio:2,
    cats:["store", "area", "transfer"],
    find:["상가 전문 공인중개", "점포 임대 중개", "상권분석", "권리금 중개"] },

  { key:"interior", no:"02", name:"인테리어 · 시공", prio:1,
    cats:["interior"],
    find:["상업 인테리어", "음식점 인테리어", "카페 인테리어", "미용실 인테리어",
          "사무실 인테리어", "전기공사", "설비", "간판"] },

  { key:"demolish", no:"03", name:"철거 · 원상복구", prio:1,
    cats:["demolish", "restore"],
    find:["매장 철거", "부분 철거", "원상복구", "집기 철거", "폐기물 처리"] },

  { key:"equip", no:"04", name:"시설 · 장비", prio:1,
    cats:["equip", "furniture"],
    find:["주방설비", "냉장 냉동장비", "업소용 장비", "중고 주방기기",
          "업소용 가구", "음향 영상"] },

  { key:"it", no:"05", name:"POS · IT · 보안", prio:1,
    cats:["it"],
    find:["POS 대리점", "키오스크", "테이블오더", "CCTV 설치", "매장 인터넷"] },

  { key:"tax", no:"06", name:"세무 · 회계", prio:2,
    cats:["tax"],
    /* ⚠️ 세무사는 `admin` 분류의 **하위**(tax-agent)입니다. 분류를 쪼개지
       않고 하위만 가리킵니다 — 분류를 두 묶음에 넣으면 검사가 멈춥니다. */
    subs:[["admin", "tax-agent"], ["admin", "biz-reg"]],
    find:["세무사 사무실", "기장 대행", "부가세 신고", "폐업 세무"] },

  { key:"labor", no:"07", name:"노무 · 인사", prio:3,
    cats:["labor", "staff"],
    subs:[["admin", "labor-agent"]],
    find:["노무사 사무실", "급여 대행", "4대보험 업무대행"] },

  { key:"marketing", no:"08", name:"마케팅 · 디자인", prio:2,
    cats:["marketing"],
    find:["매장 마케팅 대행", "플레이스 관리", "블로그 대행", "메뉴판 디자인",
          "매장 촬영", "브랜딩"] },

  { key:"clean", no:"09", name:"청소 · 방역 · 관리", prio:2,
    cats:["clean"],
    find:["입주청소", "매장 정기청소", "주방 후드청소", "방역", "해충방제"] },

  { key:"supply", no:"10", name:"식자재 · 운영공급", prio:3,
    cats:["supply"],
    find:["식자재 납품", "육류 납품", "음료 총판", "포장용기", "유니폼"] },

  { key:"legal", no:"11", name:"행정 · 법률 · 전문가", prio:3,
    cats:["admin", "law", "contract"],
    find:["행정사 사무소", "인허가 대행", "법무사", "임대차 분쟁 변호사"] },

  { key:"fund", no:"12", name:"금융 · 보험 · 지원", prio:3,
    cats:["fund"],
    find:["사업자 보험", "정책자금 컨설팅", "정부지원사업 컨설팅"] },

  { key:"closing", no:"13", name:"폐업 · 정리", prio:1,
    cats:["process", "asset", "stock", "waste", "support"],
    find:["폐업 대행", "중고 주방기기 매입", "시설 매입", "재고 처분",
          "사업장 폐기물"] },

  /* ⚠️⚠️ 남은 분류를 **그 자리에서** 가져갑니다. 손으로 적지 마세요. */
  { key:"etc", no:"14", name:"기타", prio:3, etc:true, cats:[],
    find:["프랜차이즈 본사", "창업 컨설팅"] }
];

/* 01~13 이 안 가져간 분류 — 14 기타의 몫입니다 (세는 값) */
window.amSalesEtcCats = function(){
  var taken = {};
  (window.AM_SALES_GROUPS || []).forEach(function(g){
    if(!g.etc) (g.cats || []).forEach(function(k){ taken[k] = 1; });
  });
  return (window.AM_CATS || [])
    .filter(function(c){ return !taken[c.key]; })
    .map(function(c){ return c.key; });
};

/* 묶음 하나가 실제로 들고 있는 분류 key */
window.amSalesCats = function(g){
  if(!g) return [];
  return g.etc ? amSalesEtcCats() : (g.cats || []).slice();
};

window.amSalesGroup = function(key){
  var L = window.AM_SALES_GROUPS || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

window.amSalesGroupName = function(key){
  var g = amSalesGroup(key);
  return g ? g.name : "";
};

/* 분류 key → 어느 영업 묶음인가 (거꾸로 타고 올라갑니다) */
window.amSalesGroupOfCat = function(catKey){
  var L = window.AM_SALES_GROUPS || [], i;
  for(i = 0; i < L.length; i++)
    if(!L[i].etc && (L[i].cats || []).indexOf(catKey) >= 0) return L[i];
  for(i = 0; i < L.length; i++)
    if(L[i].etc && amSalesEtcCats().indexOf(catKey) >= 0) return L[i];
  return null;
};

/* 그 묶음에서 실제로 다루는 **서비스 이름** — 전부 catalog.js 에서 옵니다.
   ⚠️ 여기에 이름을 손으로 적지 마세요. 분류를 고치면 저절로 따라옵니다. */
window.amSalesServiceNames = function(g, limit){
  var out = [], seen = {};
  function push(s){ if(s && !seen[s]){ seen[s] = 1; out.push(s); } }

  amSalesCats(g).forEach(function(k){
    var c = window.amCat ? amCat(k) : null;
    if(!c) return;
    push(c.name);
    (c.items || []).forEach(function(it){ push(it.name); });
  });
  (g.subs || []).forEach(function(p){
    var c = window.amCat ? amCat(p[0]) : null;
    if(!c) return;
    (c.items || []).forEach(function(it){ if(it.key === p[1]) push(it.name); });
  });

  return limit ? out.slice(0, limit) : out;
};

/* 그 묶음에 지금 등록된 업체가 몇 곳인가 — ⚠️ 세는 값입니다.
   (저희 사이트의 `AM_PROVIDERS` 쪽입니다. 영업 DB 와 다른 것입니다.) */
window.amSalesProviderN = function(g){
  var n = 0;
  amSalesCats(g).forEach(function(k){
    var c = window.amCat ? amCat(k) : null;
    if(c && window.amProvidersInCat) n += amProvidersInCat(c);
  });
  return n;
};

/* 초대 글 · 전화 멘트가 쓸 **대표 분류** — 그 묶음에서 업체를 받는
   분류(kind:"provider") 중 첫 번째입니다. 없으면 빈 문자열.
   ⚠️ 업체를 안 받는 분류(info · listing)로 초대 글을 만들면 "그 분야에
   몇 곳" 이 셀 수 없는 수가 됩니다. */
window.amSalesMainCat = function(g){
  var ks = amSalesCats(g), i, c;
  for(i = 0; i < ks.length; i++){
    c = window.amCat ? amCat(ks[i]) : null;
    if(c && c.kind === "provider") return c.key;
  }
  for(i = 0; i < (g && g.subs || []).length; i++){
    c = window.amCat ? amCat(g.subs[i][0]) : null;
    if(c && c.kind === "provider") return c.key;
  }
  return "";
};

/* ── 영업 상태 (지시서 §9 · §12 · §19) ──────────────────────────
   ⚠️ key 를 바꾸면 **직원 브라우저에 쌓인 기록이 조용히 어긋납니다.**
   이름만 바꾸세요. `tone` 은 상태 배지 색이고 그 외에는 색을 쓰지
   않습니다 (§33 — 색은 상태 표시에만). */
window.AM_SALES_ST = [
  { key:"new",    name:"연락전",   tone:"gray" },
  { key:"recall", name:"재연락",   tone:"warn" },
  { key:"warm",   name:"관심",     tone:"fire" },
  { key:"sent",   name:"입점제안", tone:"blue",  join:true },
  { key:"doc",    name:"자료대기", tone:"blue",  join:true },
  { key:"review", name:"검토필요", tone:"warn",  join:true },
  { key:"done",   name:"입점완료", tone:"ok",    join:true },
  { key:"no",     name:"관심없음", tone:"off" },
  { key:"bad",    name:"번호오류", tone:"off" }
];

window.amSalesStName = function(key){
  var L = window.AM_SALES_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i].name;
  return key || "";
};
window.amSalesStTone = function(key){
  var L = window.AM_SALES_ST, i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i].tone;
  return "gray";
};

/* 통화 결과 다섯 (§12) — 직원이 누르는 것은 이 다섯뿐입니다 */
window.AM_SALES_RESULT = [
  { key:"warm",   name:"관심있음",  ic:"fire",     st:"warm" },
  { key:"recall", name:"다시 연락", ic:"clock",    st:"recall" },
  { key:"miss",   name:"부재중",    ic:"phone",    st:"recall" },
  { key:"no",     name:"관심없음",  ic:"x",        st:"no" },
  { key:"bad",    name:"번호오류",  ic:"alert",    st:"bad" }
];

/* 거절 사유 (§16) — 고르는 것이고 **안 골라도 됩니다** */
window.AM_SALES_WHY = [
  "필요 없음", "기존 광고 충분", "플랫폼 설명 후 거절",
  "비용 관련", "나중에 검토", "기타"
];

/* 재연락 날짜 버튼 (§14) — 날짜 직접 선택은 화면에서 따로 받습니다 */
window.AM_SALES_WHEN = [
  { key:"1",  name:"내일",    d:1 },
  { key:"3",  name:"3일 후",  d:3 },
  { key:"7",  name:"1주 후",  d:7 }
];

/* 입점 신청에서 업체가 채우는 칸 (§20 · §21) — 자료완성도를 셉니다.
   ⚠️⚠️ **사업자 확인 서류를 이 화면에 올리는 기능은 만들지 않았습니다.**
   받아 줄 백엔드가 없어서, 올리는 칸을 만들면 그 순간 저장되지 않는
   가짜 화면입니다 (절대 규칙 5). 서류는 메일로 받고 사람이 확인한 뒤
   `providers.js` 의 `verified` 를 켭니다. */
window.AM_SALES_DOC = [
  { key:"basic",  name:"기본정보 (업체명 · 지역)" },
  { key:"tel",    name:"연락처 · 담당자" },
  { key:"svc",    name:"전문 서비스 · 가능 지역" },
  { key:"intro",  name:"회사소개" },
  { key:"logo",   name:"로고 · 대표사진" },
  { key:"folio",  name:"포트폴리오" },
  { key:"verify", name:"사업자 확인자료" }
];

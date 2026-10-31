/* ════════════════════════════════════════════════════════════════════
   영업 카테고리 · 영업 상태 — 직원이 보는 말로 묶은 틀
   (2026-10-07 "원페이지 영업·입점 어드민" 지시서 §5 · §6 · §12 · §16)

   ⚠️⚠️ **2026-10-31 — 중고폰 축으로 다시 짰습니다** (PHONEWAY 전환 §5).
   전에는 창업 · 폐업 분류 스물다섯을 묶고 있었습니다. 그 분류가
   없어진 뒤에도 그대로 남아서 —
     · `amSalesServiceNames()` 가 `amCat()` 에서 **아무것도 못 찾고**,
       영업 작업대의 "저희가 이 분야에서 다루는 서비스" 줄(`.sl-svc`)이
       **열네 묶음 전부에서 통째로 안 그려졌습니다.**
     · `amSalesMainCat()` 도 빈 문자열을 돌려줘서, 초대 글이 "이 분야에
       지금 몇 곳" 을 셀 수가 없었습니다.
   에러도 안 나고 빌드도 통과했습니다 — `tools/test-admin.js` 가
   `.sl-svc` 를 30초 기다리다 터져서 알았습니다.
   ⚠️ 옛 열넷은 `git show d1810ed:js/data/sales.js` 에 있습니다.

   ⚠️⚠️ **새 서비스 DB 가 아닙니다.** `catalog.js` 의 분류 열 · 하위 쉰을
   **묶어 보는 틀**입니다. 업체(`subs`) · 글(`cat`) · 신청 항목
   (`request_item.service_id`)이 전부 `catalog.js` 의 key 를 쓰기 때문에,
   여기서 이름이나 key 를 새로 만들면 **등록된 모든 데이터가 조용히
   어긋납니다.** `deal.js`(쪽 아홉)와 같은 성격입니다.

   ⚠️⚠️ **분류 열이 빠짐없이 한 곳씩 들어갑니다.** 01~09 가 자기 것을
   적고, **10 기타는 남은 것을 그 자리에서 셉니다**(`etc:true`) — 손으로
   적어 두면 분류를 늘릴 때마다 조용히 빠집니다. `checkSales()` 가 빌드를
   멈춥니다 (빠진 것 · 겹치는 것 · 없는 key).

   ⚠️ `find` 는 **검색할 말**입니다 (네이버 · 지도에 쳐 볼 낱말). 서비스
   목록이 아닙니다 — 우리 분류에는 없지만 직원이 찾아야 하는 말
   ("사설 수리점" · "단말기 벌크")이 섞여 있습니다.
   화면에 나가는 **서비스 이름은 전부 `catalog.js` 에서 가져옵니다.**

   ⚠️ `prio` 는 **사람이 정한 영업 순서**입니다. 이용 데이터가 아닙니다 —
   조회수 · 클릭 · 요청 수를 하나도 모으지 않으므로 "많이 찾는 분야" 를
   적을 수 없습니다 (마무리 지시서 §3).

   ⚠️⚠️ **업체를 지어내지 않습니다.** 여기 적힌 것은 **어떤 회사에
   전화를 걸까** 이지 "이런 업체가 있습니다" 가 아닙니다 (절대 규칙 1).
   ════════════════════════════════════════════════════════════════════ */

window.AM_SALES_GROUPS = [
  { key:"buyin", no:"01", name:"중고폰 매입점", prio:1,
    cats:["buyin"],
    find:["중고폰 매입", "휴대폰 매입", "폰 매입 전문", "중고 아이폰 매입",
          "갤럭시 매입", "태블릿 매입"] },

  { key:"broken", no:"02", name:"고장 · 파손폰 매입", prio:1,
    cats:["broken"],
    find:["액정파손 폰 매입", "고장폰 매입", "침수폰 매입", "부품용 폰 매입",
          "배터리 불량 폰 매입"] },

  { key:"fix", no:"03", name:"수리 · 리퍼", prio:1,
    cats:["fix"],
    find:["휴대폰 수리", "아이폰 수리", "액정 교체", "배터리 교체",
          "사설 수리점", "메인보드 수리"] },

  { key:"inspect", no:"04", name:"검수 · 데이터 삭제", prio:1,
    cats:["inspect"],
    find:["휴대폰 데이터 삭제", "단말기 검수", "IMEI 조회",
          "리퍼 검수", "통신사 잠금 해제"] },

  { key:"wholesale", no:"05", name:"도매 · 경매", prio:1,
    cats:["wholesale"],
    find:["중고폰 도매", "휴대폰 도매상", "중고폰 경매", "단말기 벌크",
          "부품용 로트"] },

  { key:"corp", no:"06", name:"기업 · 법인 매입", prio:2,
    cats:["corp"],
    find:["법인 휴대폰 매입", "기업 단말기 처분", "업무용 기기 반납",
          "렌탈 단말기 회수", "자산 평가"] },

  { key:"export", no:"07", name:"해외 수출 · 바이어", prio:2,
    cats:["export"],
    find:["중고폰 수출", "휴대폰 바이어", "수출 통관 대행",
          "컨테이너 수출", "해외 도매"] },

  { key:"shop", no:"08", name:"중고폰 판매점", prio:2,
    cats:["shop"],
    find:["중고폰 판매점", "리퍼폰 판매", "중고 휴대폰 매장",
          "자급제 중고폰"] },

  { key:"logi", no:"09", name:"수거 · 배송 · 부자재", prio:3,
    cats:["pickup", "access"],
    find:["택배 수거 대행", "퀵 수거", "방문 수거",
          "휴대폰 케이스 도매", "충전기 도매", "강화유리 도매"] },

  /* ⚠️⚠️ 남은 분류를 **그 자리에서** 가져갑니다. 손으로 적지 마세요. */
  { key:"etc", no:"10", name:"기타", prio:3, etc:true, cats:[],
    find:["통신기기 유통", "휴대폰 액세서리 총판"] }
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

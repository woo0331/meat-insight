/* ════════════════════════════════════════════════════════════════════
   전문관 넷 — 창업 준비 · 매장 운영 · 매장 양도양수 · 폐업 · 정리
   (2026-10-11 "STOREWAY 서비스 UI/UX 전면 개선 작업지시서" §2 · §4)

   ⚠️⚠️ **새 분류를 만든 것이 아닙니다.** `lifecycle.js`(단계 여섯) ·
   `journey.js`(여정 넷) · `sales.js`(영업 카테고리 열넷) ·
   `indgroups.js`(업종군 아홉) · `opsvc.js`(운영 묶음 여섯)와 **같은
   성격**이고, `catalog.js` 의 분류 26 · 하위 206 을 **가리키기만**
   합니다. key · 이름 · 주소를 한 글자도 안 바꿨습니다 —
   업체(`subs`) · 매물(`sub`) · 글(`cat`) · 업종(`startup`/`closure`)이
   전부 그 key 를 쓰기 때문에, 여기서 새로 만들면 **등록된 모든
   데이터가 조용히 어긋납니다.**

   ⚠️ 지시서 §4 — "실제 서비스가 부족한 경우 억지로 12개를 채우지
   않는다." 그래서 전문관마다 개수가 다릅니다 (12 · 11 · 7 · 9).
   채우려고 없는 서비스를 적으면 그게 가짜 링크입니다 (절대 규칙 5).
     · 매장 운영의 **물류 · 배송** — 그런 분류도 하위도 없습니다.
       `supply` 의 `delivery-box` 는 **배달용기**이지 배송이 아닙니다.
     · 매장 양도양수의 **매물 탐색** — `매장 인수하기`와 **같은 주소**
       (`/stores`)입니다. 한 전문관에 같은 데로 가는 칸을 둘 두면
       손님은 둘이 다른 것인 줄 압니다 (§5 중복 방지).

   ⚠️⚠️ **`to` 를 손으로 적는 것은 도구 · 매물처럼 분류로 못 가는
   자리뿐입니다.** 나머지는 `cat`(+`sub`)만 적고 주소는 `catTo()` 가
   만듭니다 — 이 저장소가 `amCatTo`/`catTo` 를 두 벌로 두었다가 겪은
   자리입니다.

   ⚠️ `ia` 는 `iconArt()`(컬러) 키입니다. **한 전문관 안에서 겹치면
   빌드가 멈춥니다** — 열두 칸에 같은 그림이 둘이면 무엇이 무엇인지
   흐려집니다. 전문관이 다르면 같은 아이콘을 써도 됩니다 (카드 색과
   머리말이 달라 뜻이 갈립니다).

   ⚠️ 노출 순서를 바꾸시려면 **이 파일의 차례**를 바꾸세요.
   `/admin` 관리자 설정 10번 칸이 눌러서 순서를 바꾸고 **붙여 넣을
   줄**을 만들어 줍니다 (매물 등록 줄 · 업체 등록 줄과 같은 방식) —
   화면에서 저장하지 않습니다. 저장할 서버가 없는데 저장되는 척하면
   그게 절대 규칙 5 입니다.
   ════════════════════════════════════════════════════════════════════ */
window.AM_HALLS = [
  { key:"startup", name:"창업 준비", lead:"새로운 시작을 위한 모든 서비스",
    tone:"start", to:"/startup", ic:"seed",
    items:[
      { n:"창업 아이템",   ia:"bulb",      cat:"item" },
      { n:"상권 · 입지",   ia:"mappin",    cat:"area" },
      { n:"창업 자금",     ia:"money",     cat:"fund" },
      { n:"인허가 · 행정", ia:"permit",    cat:"admin", sub:"permit" },
      { n:"인테리어 · 시공",ia:"interior",  cat:"interior" },
      { n:"주방 · 설비",   ia:"kitchen",   cat:"equip" },
      { n:"직원 채용",     ia:"staff",     cat:"staff" },
      { n:"창업비 계산",   ia:"calc",      to:"/tools/cost", tone:"t6" },
      { n:"상가 · 매물",   ia:"store",     cat:"store" },
      { n:"보험 · 안전",   ia:"shield",    cat:"admin", sub:"insurance" },
      { n:"POS · 결제",   ia:"pos",       cat:"it",    sub:"pos" },
      { n:"오픈 마케팅",   ia:"marketing", cat:"marketing", sub:"open-mkt" }
    ] },

  { key:"operation", name:"매장 운영", lead:"지금 더 잘되는 매장 관리 서비스",
    tone:"ops", to:"/operation", ic:"store",
    items:[
      { n:"식자재 · 원재료",ia:"supply",    cat:"supply", sub:"ingredient" },
      { n:"POS · 결제",   ia:"pos",       cat:"it",     sub:"pos" },
      { n:"마케팅 · 홍보", ia:"marketing", cat:"marketing" },
      { n:"세무 · 회계",   ia:"tax",       cat:"admin",  sub:"tax-agent" },
      { n:"인사 · 노무",   ia:"staff",     cat:"admin",  sub:"labor-agent" },
      { n:"수리 · 보수",   ia:"repair",    cat:"repair" },
      { n:"매출 관리",     ia:"chart",     cat:"it",     sub:"sales-mgmt" },
      { n:"보험",         ia:"shield",    cat:"admin",  sub:"insurance" },
      { n:"리모델링",      ia:"interior",  cat:"interior" },
      { n:"위생 관리",     ia:"clean",     cat:"clean" },
      { n:"정책 자금",     ia:"money",     cat:"fund" }
    ] },

  { key:"transfer", name:"매장 양도양수", lead:"매장 인수 · 양도부터 권리금까지",
    tone:"pass", to:"/transfer", ic:"handover",
    items:[
      { n:"매장 인수하기",  ia:"store",    to:"/stores",  tone:"t5" },
      { n:"내 매장 양도하기",ia:"handover", to:"/sell",    tone:"t13" },
      { n:"권리금 계산",    ia:"calc",     to:"/tools/premium", tone:"t6" },
      { n:"계약 · 절차",    ia:"contract", cat:"admin", sub:"legal" },
      { n:"시설 · 장비 거래",ia:"equip",    to:"/assets",  tone:"t12" },
      { n:"인수 점검",      ia:"permit",   to:"/transfer?t=in", tone:"t4" },
      { n:"전문가 상담",    ia:"admin",    cat:"admin" }
    ] },

  { key:"closure", name:"폐업 · 정리", lead:"깔끔한 마무리를 위한 정리 서비스",
    tone:"close", to:"/closure", ic:"boxes",
    items:[
      { n:"폐업 신고",     ia:"permit",   cat:"tax",  sub:"close-report" },
      { n:"철거",         ia:"demolish", cat:"demolish" },
      { n:"원상복구",      ia:"restore",  cat:"restore" },
      { n:"재고 처분",     ia:"supply",   to:"/assets?c=stock", tone:"t2" },
      { n:"장비 매각",     ia:"equip",    to:"/assets?c=asset", tone:"t12" },
      { n:"지원금 안내",   ia:"money",    cat:"support" },
      { n:"임대차 정리",   ia:"contract", cat:"law",  sub:"lease" },
      { n:"폐업비 계산",   ia:"calc",     to:"/tools/closecost", tone:"t6" },
      { n:"세무 정리",     ia:"tax",      cat:"tax" }
    ] }
];

/* 전문관 하나를 key 로 찾습니다. 없으면 첫 번째(창업 준비)입니다 —
   주소에 엉뚱한 `?h=` 가 실려 와도 빈 화면이 되지 않습니다. */
window.amHall = function(key){
  var L = window.AM_HALLS || [];
  for(var i=0;i<L.length;i++) if(L[i].key === key) return L[i];
  return L[0];
};

/* 칸 하나가 실제로 가는 곳.
   ⚠️ `to` 가 있으면 그대로, 없으면 `catTo()` 가 만듭니다 — 주소 규칙을
   두 곳에 적지 않습니다. */
window.amHallTo = function(it){
  if(it.to) return it.to;
  var c = (window.AM_CATS||[]).filter(function(x){ return x.key === it.cat; })[0];
  if(!c) return "";
  var base = (typeof catTo === "function")
    ? catTo(c)
    : (c.to ? c.to : ((c.kind === "provider") ? "/providers/"+c.key : "/c/"+c.key));
  return it.sub ? (base + (base.indexOf("?") < 0 ? "?" : "&") + "s=" + it.sub) : base;
};

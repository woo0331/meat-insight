/* ════════════════════════════════════════════════════════════════════
   수익상품 (Offer) — 지시서 §5

   ⚠️⚠️ **새 분류를 만든 것이 아닙니다.** `catalog.js` 의 분류 25 · 하위
   183 을 그대로 가리키고, 그 위에 **장사에 필요한 칸**만 얹습니다 —
   수익모델 · 정산 기준 · 노출 상태 · 제휴 업체. `lifecycle.js`(단계
   여섯) · `journey.js`(여정 넷) · `sales.js`(영업 카테고리 열넷)와
   **같은 성격**입니다.

   ⚠️⚠️ **새 주소를 만들지 않았습니다** (§22 · 콘텐츠 중복 방지).
   `/offer/:id` 를 만들면 `/providers/:cat` · `/c/:cat` 과 **같은 내용이
   두 주소로** 나가고 구글이 둘 다 무시합니다. 상품은 **그 분류의 진짜
   화면**(`to`)으로 보냅니다.

   ── §5 가 요구한 관리 항목과 이 파일의 칸 ─────────────────
   상품명과 설명            name · lead
   연결 업종                industries (빈 배열 = 전업종)
   서비스 지역              regions    (빈 배열 = 전국)
   신청 유형                apply
   연결 가능한 업체          ⚠️ **적는 칸이 아닙니다** — `cat`·`sub` 로
                            amProviderInCat() 가 **셉니다** (평점을 값으로
                            저장하지 않는 것과 같은 까닭)
   상담 필요 여부            consult
   예상 비용 안내 방식       costWay
   수익모델 유형             fee   (js/data/fee.js 의 AM_FEE_TYPE key)
   정산 기준                feeNote
   노출 상태                status

   ⚠️⚠️ **`lead` 에 별표(굵게)를 쓰지 마세요.** 이 칸은 `mark()` 를
   거치지 않고 `esc()` 만 지나가서 **별표가 글자로 찍힙니다** — 메인
   카드에 실제로 `**무엇을 뜯는가**` 가 그대로 나왔습니다 (찍어 보고
   알았습니다. 이 저장소가 글 머리말 · 구간 제목에서 이미 겪은 자리).
   아이콘                  icon  ⚠️ **상품마다 달라야 합니다** — 메인
                            여덟이 같은 그림을 두 번 쓰면 무엇이
                            무엇인지 흐려집니다 (check.js 가 봅니다).
                            이름은 `icon()` 이 아는 것만 (base.js) —
                            모르는 이름은 **빈 문자열**이라 자리가
                            덩그러니 빕니다 (전수 점검이 잡습니다).

   ⚠️⚠️ **§5 가 직접 적은 규칙** — "실제 제휴사가 확보되지 않은 상품은
   신청 가능 상품처럼 오인시키지 말고 '서비스 준비 중' 또는 일반 정보
   페이지로 처리한다."

   그래서 지금 **열 상품 전부 `status:"info"`** 입니다. 업체가 0곳이고
   제휴 계약이 하나도 없으니 그것이 사실입니다. ⚠️ "서비스 준비 중"
   딱지를 찍는 대신 **그 분야의 진짜 화면**으로 보냅니다 — 절대 규칙 2
   ("자리표시자를 찍지 말고 줄째 뺀다")가 그쪽이 낫다고 말합니다.

   ⚠️⚠️ **`status:"live"` 는 업체가 등록된 뒤에만** 켜집니다.
   `build-pages.js` 의 `checkOffers()` 가 **업체 0곳인데 live 인 상품이
   있으면 빌드를 멈춥니다** — 손으로 지키는 규칙이 아닙니다.
   ════════════════════════════════════════════════════════════════════ */

/* 신청 유형 (§5) — 손님이 무엇을 신청하는 것인가 */
window.AM_OFFER_APPLY = [
  { key:"quote",   name:"견적 비교",   lead:"조건을 적으시면 여러 곳에서 견적이 옵니다" },
  { key:"install", name:"설치 · 개통", lead:"일정을 정해 설치 · 개통까지" },
  { key:"rental",  name:"렌탈 계약",   lead:"월 단위 계약으로 들여놓는 것" },
  { key:"dispose", name:"처분 · 매각", lead:"쓰던 것을 넘기거나 파는 것" }
];

/* 예상 비용을 어떻게 안내하는가 (§5)
   ⚠️⚠️ **금액을 적는 칸이 없습니다.** 지역 · 평수 · 업종에 따라 몇 배로
   갈리고, 적어 두면 사장님이 그 숫자를 보고 돈을 빌리러 갑니다
   (프랜차이즈 창업비와 같은 까닭 — 가맹사업법). 적는 것은
   **무엇이 금액을 가르는가**와 **어디서 확인하나**까지입니다. */
window.AM_OFFER_COST = [
  { key:"quote",  name:"업체 견적으로",     lead:"조건이 달라 금액을 미리 적지 않습니다" },
  { key:"tool",   name:"계산기로 가늠",     lead:"사장님 조건을 넣어 직접 계산하십니다" },
  { key:"public", name:"공시 자료로",       lead:"공개된 자료에 적힌 값만 냅니다" }
];

window.AM_OFFER_STATUS = [
  { key:"info", name:"정보만",      lead:"⚠️ 제휴사가 없어 신청을 받지 않습니다 (§5)" },
  { key:"live", name:"신청 받는 중", lead:"실제로 신청과 배정이 됩니다" },
  { key:"off",  name:"내림",        lead:"화면에 안 냅니다" }
];

/* ── 초기 핵심 상품 열 (§5 의 목록 그대로) ────────────────────
   ⚠️ `cat` 은 catalog.js 의 분류 key · `sub` 은 그 분류의 하위 key 입니다.
   ⚠️ `to` 는 **이미 있는 화면**입니다 — 새 주소를 만들지 않습니다.
   ⚠️ `fee` 는 fee.js 의 AM_FEE_TYPE key 이고 **지금은 계획**입니다.
      실제 요율은 업체마다 `fee_policy` 에 적습니다 (§9). */
window.AM_OFFERS = [
  { id:"store-internet", icon:"globe", name:"매장 인터넷", cat:"it", sub:"internet",
    lead:"개통일을 맞추는 것이 전부입니다. 공사 일정과 함께 잡으세요.",
    apply:"install", consult:true, costWay:"quote",
    fee:"close", feeNote:"개통 확인 후 건당 정액", status:"info",
    to:"/providers/it" },

  { id:"pos-card", icon:"receipt", name:"POS · 카드단말기", cat:"it", sub:"pos",
    lead:"카드 수수료와 단말기 비용은 다른 이야기입니다. 둘을 갈라서 보세요.",
    apply:"install", consult:true, costWay:"quote",
    fee:"close", feeNote:"설치 확인 후 건당 정액", status:"info",
    to:"/providers/it" },

  { id:"cctv-security", icon:"camera", name:"CCTV · 보안", cat:"it", sub:"cctv",
    lead:"대수와 저장 기간이 값을 가릅니다. 녹화 보관은 법에 걸리는 부분이 있습니다.",
    apply:"install", consult:true, costWay:"quote",
    fee:"close", feeNote:"설치 확인 후 건당 정액", status:"info",
    to:"/providers/it" },

  { id:"water-ice-rental", icon:"snow", name:"정수기 · 제빙기 렌탈", cat:"equip",
    lead:"사는 것과 빌리는 것의 차액은 계약 기간에서 갈립니다.",
    apply:"rental", consult:true, costWay:"quote",
    fee:"sub", feeNote:"계약 회차마다 정액", status:"info",
    to:"/providers/equip" },

  { id:"kiosk-order", icon:"monitor", name:"키오스크 · 테이블오더", cat:"it", sub:"kiosk",
    lead:"인건비를 줄이려는 것이라면 먼저 계산해 보세요.",
    apply:"install", consult:true, costWay:"tool",
    fee:"close", feeNote:"설치 확인 후 건당 정액", status:"info",
    to:"/providers/it" },

  { id:"interior-sign", icon:"roller", name:"인테리어 · 간판", cat:"interior", sub:"interior",
    lead:"평수보다 무엇을 뜯는가가 금액을 가릅니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"rate", feeNote:"계약금액의 일정 비율", status:"info",
    to:"/providers/interior" },

  { id:"kitchen-equip", icon:"knife", name:"주방 · 업소용 장비", cat:"equip",
    lead:"새것과 중고의 차이는 값이 아니라 수리와 부품입니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"rate", feeNote:"계약금액의 일정 비율", status:"info",
    to:"/providers/equip" },

  { id:"demolish-restore", icon:"hammer", name:"철거 · 원상복구", cat:"demolish", sub:"full",
    lead:"원상복구 범위는 계약서에 적힌 대로입니다. 먼저 그것부터 확인하세요.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"rate", feeNote:"계약금액의 일정 비율", status:"info",
    to:"/providers/demolish" },

  { id:"clean-disinfect", icon:"broom", name:"청소 · 방역", cat:"clean", sub:"move-in",
    lead:"문 열기 전 한 번과 정기로 받는 것은 다른 계약입니다.",
    apply:"quote", consult:false, costWay:"quote",
    fee:"lead", feeNote:"유효 문의 확인 후 건당 정액", status:"info",
    to:"/providers/clean" },

  { id:"used-equip", icon:"boxes", name:"중고 시설 · 장비", cat:"asset",
    lead:"정리하시는 사장님의 것이 시작하시는 사장님에게 갑니다.",
    apply:"dispose", consult:false, costWay:"quote",
    fee:"margin", feeNote:"판매가와 매입가의 차액", status:"info",
    to:"/assets" }
];

/* ── 읽기 ─────────────────────────────────────────────────── */
window.amOffer = function(id){
  var L = window.AM_OFFERS || [], i;
  for(i = 0; i < L.length; i++) if(L[i].id === id) return L[i];
  return null;
};

/* 화면에 낼 상품 — ⚠️ `off` 는 안 냅니다 */
window.amOffers = function(o){
  o = o || {};
  return (window.AM_OFFERS || []).filter(function(x){
    if(x.status === "off") return false;
    if(o.status && x.status !== o.status) return false;
    if(o.cat && x.cat !== o.cat) return false;
    if(o.industry && (x.industries || []).length &&
       (x.industries || []).indexOf(o.industry) < 0) return false;
    return true;
  });
};

/* 이 분류에 걸린 상품 */
window.amOffersForCat = function(cat){
  return (window.AM_OFFERS || []).filter(function(x){
    return x.status !== "off" && x.cat === cat;
  });
};

/* ⚠️⚠️ **신청을 받을 수 있는 상태인가** (§5)
   업체가 없으면 신청을 받아도 배정할 곳이 없습니다 — 받아 두고 못
   하는 것이 "하지 않은 일을 했다고 말하는 것" 입니다 (절대 규칙 5).
   ⚠️ 그래서 `status` 하나만 보지 않고 **업체 수도 같이** 봅니다. */
window.amOfferOpen = function(x){
  if(!x || x.status !== "live") return false;
  var n = (typeof window.amProvidersInCat === "function")
            ? window.amProvidersInCat(x.cat) : 0;
  return n > 0;
};

/* 상품이 live 가 되려면 아직 무엇이 남았나 — ⚠️ 운영자용입니다
   (손님 화면에 찍지 마세요 · 절대 규칙 3) */
window.amOfferTodo = function(x){
  var L = [];
  if(!x) return L;
  var n = (typeof window.amProvidersInCat === "function")
            ? window.amProvidersInCat(x.cat) : 0;
  if(!n) L.push("이 분야에 등록된 업체가 없습니다");
  if(!x.fee) L.push("수익모델을 정해야 합니다");
  if(!x.feeNote) L.push("정산 기준을 적어야 합니다");
  if(x.status !== "live") L.push("노출 상태가 '신청 받는 중' 이 아닙니다");
  return L;
};

window.amOfferApplyName = function(k){
  var L = window.AM_OFFER_APPLY || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
  return "";
};

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
  { key:"sell",  name:"내 폰 팔기",   lead:"기기를 적으시면 매입 · 입찰로 이어집니다" },
  { key:"quote", name:"견적 비교",    lead:"조건을 적으시면 여러 곳에서 견적이 옵니다" },
  { key:"buy",   name:"중고폰 구매",  lead:"검수를 마친 기기를 고르시는 것" },
  { key:"bulk",  name:"대량 · 수출 상담", lead:"대수가 많아 사람이 먼저 상담하는 것" }
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

/* ── 중고폰 수익상품 열일곱 ────────────────────────────────────
   ⚠️⚠️ **2026-11-01 — 창업 · 폐업 상품 스물일곱을 여기서 갈았습니다.**
   그때까지 이 파일은 `it` · `equip` · `interior` 처럼 **없어진 분류**를
   가리키고 있어서, `/admin` 수익상품 칸이 "매장 인터넷 · POS · CCTV ·
   정수기 렌탈" 을 내고 분류 이름 자리에 **`it` · `equip` 날것**을
   찍었습니다 (`amCat()` 이 못 찾아서 — 포트폴리오가 `gyeonggi` 를
   찍었던 그 자리). 손님 화면에는 안 나가고 `/admin` 하나가 읽습니다.

   ⚠️⚠️ **열일곱이 분류 열을 빠짐없이 덮습니다** — buyin 4 · broken 2 ·
   fix 2 · shop 1 · wholesale 2 · corp 2 · export 1 · inspect 1 ·
   pickup 1 · access 1. 분류를 늘리시면 여기도 한 줄 더하세요
   (`checkOffers()` 가 덮지 못한 분류를 세어 알려 줍니다).

   ⚠️⚠️ **`id` · `name` 쌍이 `0012` 의 insert 와 글자까지 같아야 합니다** —
   `checkOfferSql()` 이 양쪽으로 맞춰 보고 **빌드를 멈춥니다**. 한쪽만
   고치면 `fee_policy.offer_id` 로 요율을 걸 수 없고, `request.offer_id`
   로 보내는 날 **접수 저장이 FK 로 통째로 실패**합니다.

   ⚠️⚠️ **금액 칸을 만들지 마세요** (`price` · `from` · `cost` ·
   `amount`). 하나라도 있으면 빌드가 멈춥니다 — 매입 기준가가 0건이고,
   적는 순간 사장님이 그 숫자를 보고 오십니다 (절대 규칙 1).

   ⚠️ `status` 는 **전부 `info`** 입니다 — 매입업체가 0곳인데 `live` 로
   두면 "신청 가능" 으로 읽힙니다 (절대 규칙 5).
   ──────────────────────────────────────────────────────── */
window.AM_OFFERS = [
  /* ── 매입 (buyin) — 폰웨이가 직접 삽니다 ───────────────── */
  { id:"ph-buyin", icon:"mobile", name:"스마트폰 직접 매입", cat:"buyin", sub:"ph-buy",
    lead:"등급과 용량이 값을 가릅니다. 기준가가 없으면 예상 금액을 내지 않습니다.",
    apply:"sell", consult:false, costWay:"quote",
    fee:"margin", feeNote:"재판매가에서 매입가와 검수 원가를 뺀 차액", status:"info",
    to:"/sell" },

  { id:"tab-buyin", icon:"laptop", name:"태블릿 · 워치 · 이어폰 매입", cat:"buyin", sub:"tab-buy",
    lead:"스마트폰보다 기종이 적어 등급표가 단순합니다.",
    apply:"sell", consult:false, costWay:"quote",
    fee:"margin", feeNote:"재판매가에서 매입가와 검수 원가를 뺀 차액", status:"info",
    to:"/sell" },

  { id:"self-buyin", icon:"box", name:"자급제 · 공기계 매입", cat:"buyin", sub:"self-buy",
    lead:"약정이 없는 기기라 명의와 잠금만 확인하면 됩니다.",
    apply:"sell", consult:false, costWay:"quote",
    fee:"margin", feeNote:"재판매가에서 매입가와 검수 원가를 뺀 차액", status:"info",
    to:"/sell" },

  { id:"bid-match", icon:"gavel", name:"매입업체 경쟁입찰 중개", cat:"buyin",
    lead:"저희가 사는 것이 아니라 제휴 매입업체가 입찰합니다 — 중개입니다.",
    apply:"quote", consult:false, costWay:"quote",
    fee:"rate", feeNote:"낙찰가의 일정 비율 · 업체 수금 확인 후", status:"info",
    to:"/bid" },

  /* ── 고장 · 파손 (broken) ──────────────────────────────── */
  { id:"broken-buyin", icon:"alert", name:"고장 · 파손폰 매입", cat:"broken",
    lead:"켜지지 않아도 값이 붙습니다. 무엇이 고장인지만 적으시면 됩니다.",
    apply:"sell", consult:false, costWay:"quote",
    fee:"margin", feeNote:"수리 · 부품 회수 뒤 재판매 차액", status:"info",
    to:"/sell" },

  { id:"part-lot", icon:"boxes", name:"부품용 단말기 매입", cat:"broken", sub:"part-bad",
    lead:"살릴 수 없는 기기도 모듈 단위로는 거래됩니다.",
    apply:"sell", consult:false, costWay:"quote",
    fee:"margin", feeNote:"부품 판매가에서 매입가를 뺀 차액", status:"info",
    to:"/sell" },

  /* ── 수리 (fix) — 중개입니다 ───────────────────────────── */
  { id:"fix-match", icon:"tool", name:"수리 업체 연결", cat:"fix",
    lead:"기종과 증상으로 갈립니다. 부품을 구할 수 있는지가 먼저입니다.",
    apply:"quote", consult:false, costWay:"quote",
    fee:"close", feeNote:"수리 완료 확인 후 건당 정액", status:"info",
    to:"/repair" },

  { id:"fix-data", icon:"filex", name:"데이터 복구 연결", cat:"fix", sub:"data",
    lead:"침수 · 액정 고장과 다른 일입니다. 복구율을 약속하지 않습니다.",
    apply:"quote", consult:true, costWay:"quote",
    fee:"close", feeNote:"복구 완료 확인 후 건당 정액", status:"info",
    to:"/repair" },

  /* ── 판매 (shop) — 폰웨이가 직접 팝니다 ────────────────── */
  { id:"shop-sale", icon:"store", name:"검수 중고폰 판매", cat:"shop",
    lead:"검수를 마친 기기만 올립니다. 등급과 배터리 상태를 같이 냅니다.",
    apply:"buy", consult:false, costWay:"quote",
    fee:"margin", feeNote:"판매가에서 매입가와 검수 원가를 뺀 차액", status:"info",
    to:"/shop" },

  /* ── 도매 · 경매 (wholesale) ───────────────────────────── */
  { id:"lot-whole", icon:"layers", name:"등급별 벌크 도매", cat:"wholesale", sub:"bulk",
    lead:"대수와 등급 구성으로 값이 갈립니다. 한 대씩 보는 거래가 아닙니다.",
    apply:"bulk", consult:true, costWay:"quote",
    fee:"margin", feeNote:"도매가에서 매입가를 뺀 차액", status:"info",
    to:"/biz" },

  { id:"auction-fee", icon:"gavel", name:"B2B 경매 중개", cat:"wholesale", sub:"auction",
    lead:"참여 업체끼리 값을 냅니다 — 저희는 자리를 열고 중개합니다.",
    apply:"bulk", consult:true, costWay:"quote",
    fee:"rate", feeNote:"낙찰가의 일정 비율 · 업체 수금 확인 후", status:"info",
    to:"/biz" },

  /* ── 기업 · 법인 (corp) ────────────────────────────────── */
  { id:"corp-buyin", icon:"building", name:"기업 · 법인 대량 매입", cat:"corp", sub:"office",
    lead:"자산 목록과 반출 절차가 먼저입니다. 대수가 많으면 사람이 갑니다.",
    apply:"bulk", consult:true, costWay:"quote",
    fee:"margin", feeNote:"재판매가에서 매입가와 회수 원가를 뺀 차액", status:"info",
    to:"/biz?t=corp" },

  { id:"wipe-cert", icon:"shield", name:"데이터 완전 삭제 증명", cat:"corp", sub:"wipe-cert",
    lead:"업무용 단말기는 삭제를 증명해야 반출이 끝납니다.",
    apply:"bulk", consult:true, costWay:"quote",
    fee:"close", feeNote:"증명서 발급 건당 정액", status:"info",
    to:"/biz?t=corp" },

  /* ── 수출 (export) ─────────────────────────────────────── */
  { id:"export-buyer", icon:"globe", name:"해외 바이어 연결", cat:"export", sub:"buyer",
    lead:"나라마다 받는 등급과 기종이 다릅니다. 통관이 따라옵니다.",
    apply:"bulk", consult:true, costWay:"quote",
    fee:"rate", feeNote:"수출 대금의 일정 비율 · 수금 확인 후", status:"info",
    to:"/biz?t=export" },

  /* ── 검수 (inspect) ────────────────────────────────────── */
  { id:"inspect-fee", icon:"scan", name:"검수 · 등급 판정", cat:"inspect", sub:"grade",
    lead:"외관과 기능을 갈라서 봅니다. 등급은 사람이 정하고 기준을 밝힙니다.",
    apply:"quote", consult:false, costWay:"quote",
    fee:"close", feeNote:"검수 완료 건당 정액", status:"info",
    to:"/quote?c=inspect" },

  /* ── 수거 (pickup) ─────────────────────────────────────── */
  { id:"pickup-post", icon:"truck", name:"택배 · 방문 수거", cat:"pickup", sub:"post",
    lead:"포장이 반입니다. 깨진 액정은 따로 싸야 더 깨지지 않습니다.",
    apply:"sell", consult:false, costWay:"quote",
    fee:"close", feeNote:"수거 완료 건당 정액", status:"info",
    to:"/sell" },

  /* ── 액세서리 (access) ─────────────────────────────────── */
  { id:"access-sale", icon:"plug", name:"액세서리 · 부자재", cat:"access",
    lead:"기기와 같이 나가는 것들입니다. 케이스 · 충전기 · 포장재.",
    apply:"buy", consult:false, costWay:"quote",
    fee:"margin", feeNote:"판매가에서 매입가를 뺀 차액", status:"info",
    to:"/shop" }
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

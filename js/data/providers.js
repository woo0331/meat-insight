/* ════════════════════════════════════════════════════════════════════
   Provider · ProviderService · Portfolio · Review (§36 · §37 · §40)

   ⚠️⚠️ **업체를 한 곳도 지어내지 않습니다.** 지금 `AM_PROVIDERS` 는
   비어 있고, 그게 사실입니다. 카드 여섯 장을 만들어 채워 두면 그
   순간 **없는 회사를 광고**하는 것이고 표시·광고의 공정화에 관한
   법률 제3조 위반입니다. 화면은 비면 비었다고 말합니다 — 대신
   **입점 안내**와 **견적 요청**을 내놓습니다 (그 둘은 업체가 0곳
   이어도 실제로 돌아갑니다).

   ⚠️ **평점과 후기 수와 누적 작업 수를 값으로 저장하지 마세요.**
   `amProviderStats()` 가 **실제 후기 배열에서 계산**합니다. 숫자로
   들고 있으면 누군가 그 칸에 손으로 4.9 를 적어 넣을 수 있습니다.
   후기가 없으면 평점 자리는 아예 안 나옵니다.

   ── Provider 한 건의 생김새 ─────────────────────────────────────
   {
     id:"", name:"", logo:"", cover:"",
     regions:["gyeonggi"],          지역 key (regions.js)
     gu:["안양시","군포시"],          서비스 가능 시/군/구
     industries:["cafe"],           전문 업종 key (industries.js)
     subs:["interior","design"],    전문 서비스 = 하위 분류 key (catalog.js)
     intro:"", since:2015, staff:0,
     price:[ {name:"카페 인테리어", from:0, unit:"평당", note:""} ],
     portfolio:[ {title:"", industry:"", region:"", year:2026,
                  before:"", after:"", images:[] } ],
     reviews:[ {at:"2026-09-01", by:"", industry:"", sub:"",
                score:{ total:0, price:0, speed:0, pro:0, schedule:0, again:0 },
                text:"", images:[],
                badge:"consult|contract|deal|pay"   ← 인증 배지 (§40)
              } ],
     verified:{ biz:false, license:false, insurance:false },
     responseHours:null,            응답까지 걸린 시간 — **재어 본 값만**
     consultHours:"평일 09:00~18:00"
   }
   ⚠️ `badge` 는 **플랫폼이 확인한 것만** 붙입니다. 상담 기록이 없는데
   "상담 인증" 을 붙이면 그게 지어낸 신뢰입니다.
   ════════════════════════════════════════════════════════════════════ */

window.AM_PROVIDERS = [];

/* 인증 배지 이름 — 후기 신뢰도의 근거입니다 (§40) */
window.AM_REVIEW_BADGES = {
  consult:  "상담 인증",
  contract: "계약 인증",
  deal:     "거래 인증",
  pay:      "결제 인증"
};
/* 후기 평가 항목 (§40) */
window.AM_REVIEW_AXES = [
  { key:"total",    name:"전체 만족도" },
  { key:"price",    name:"가격 만족도" },
  { key:"speed",    name:"응답속도" },
  { key:"pro",      name:"전문성" },
  { key:"schedule", name:"일정 준수" },
  { key:"again",    name:"재이용 의향" }
];

window.amProvider = function(id){
  var r = (window.AM_PROVIDERS||[]).filter(function(p){ return p.id === id; });
  return r.length ? r[0] : null;
};

/* ⚠️ **평점은 계산합니다.** 후기가 없으면 `null` 을 돌려주고, 화면은
   그 자리를 통째로 뺍니다 — "평점 0.0" 은 평점이 아닙니다. */
window.amProviderStats = function(p){
  if(!p) return null;
  var rv = p.reviews || [];
  var pf = p.portfolio || [];
  var s = { reviews: rv.length, jobs: pf.length, rating: null };
  if(rv.length){
    var sum = rv.reduce(function(a, r){ return a + ((r.score||{}).total || 0); }, 0);
    s.rating = Math.round((sum / rv.length) * 10) / 10;
  }
  return s;
};

/* ⚠️⚠️ **업체가 이 분류의 일을 하는가** — 하위 분류 key 로 봅니다.
   `subs` 에 적는 것은 **하위 분류**(`catalog.js` 의 `items[].key`)이지
   분류 key 가 아닙니다.

   ⚠️ 비어 있으면 **아무 분류에도 안 걸립니다.** 지역 · 업종은 안 적으면
   "전국 · 전업종" 으로 읽는 게 말이 되지만, 하시는 일을 안 적은 것을
   "전부 다 합니다" 로 읽으면 인테리어 업체가 세무 화면에 앉습니다.
   비어 있는 채로 등록되는 것은 `build-pages.js` 가 막습니다.

   ⚠️ 이 규칙은 **여기 한 곳**입니다. `join.js` 의 `amProvidersInCat()`
   도 이것을 부릅니다 — 두 곳에 적으면 한쪽만 고치게 됩니다. */
/* ⚠️⚠️ **플랫폼이 확인한 것**만 배지로 냅니다 (§40).
   전에는 `ProviderCard` 안에 적혀 있었고 **첫 배지 하나만** 찍었습니다 —
   사업자 확인이 켜져 있으면 보험 가입은 영영 안 보입니다. 게다가
   **상세 화면(`/p/:id`)에는 아예 없었습니다** — 손님이 업체를 고르는
   자리가 거기인데 목록에만 보였습니다.

   ⚠️ 상태색(`--ok` 초록)이 아니라 **골드**입니다. 초록은 "좋다/나쁘다"
   를 말하는 색인데, 확인은 판정이 아니라 **확인했다는 표시**입니다. */
/* ── 확인 배지 (2026-10-05 V2 §20) ───────────────────────────────
   > "사업자 인증 · 대표자 인증 · 전화 인증 · 주소 확인 · 자격증 확인 ·
   >  포트폴리오 확인 · 보험 확인 · STOREWAY 인증"

   ⚠️⚠️ **플랫폼이 실제로 확인한 것만** 켭니다. 업체가 "확인했다" 고
   말했다고 켜면 그건 지어낸 신뢰입니다 — 손님은 이 배지를 보고
   수천만 원짜리 계약을 합니다.
   ⚠️ **포트폴리오 확인은 `verified` 에 두지 않습니다** — 포트폴리오가
   실제로 **몇 건 올라와 있는가**는 배열을 세면 나옵니다. 값으로 들고
   있으면 포트폴리오가 0건인데 "확인" 이 켜져 있을 수 있습니다
   (평점을 값으로 저장하지 않는 것과 같은 까닭입니다).
   ⚠️ 이름은 **"확인"** 까지입니다. "인증" 은 저희가 자격을 준다는 말로
   읽히는데, 저희가 하는 일은 **서류를 봤다**는 표시입니다.
   ⚠️ 차례를 바꾸지 마세요 — 손님이 제일 먼저 보는 것이 사업자입니다. */
window.AM_VERIFY = [
  { key:"biz",       name:"사업자 확인",  what:"사업자등록증" },
  { key:"owner",     name:"대표자 확인",  what:"대표자 신원" },
  { key:"phone",     name:"전화 확인",    what:"연락 가능한 번호" },
  { key:"addr",      name:"주소 확인",    what:"사업장 소재지" },
  { key:"license",   name:"면허 확인",    what:"업종에 필요한 면허 · 자격" },
  { key:"insurance", name:"보험 가입",    what:"영업배상책임보험 등" }
];

/* **우리가 서류로 확인한 것**만 — 거르개가 보는 것이 이쪽입니다 */
window.amProviderVerified = function(p){
  var v = (p && p.verified) || {};
  /* ⚠️ 목록을 손으로 또 적지 마세요 — 위 한 곳에서 옵니다 */
  return (window.AM_VERIFY || []).filter(function(x){ return v[x.key]; })
    .map(function(x){ return x.name; });
};

window.amProviderBadges = function(p){
  var out = window.amProviderVerified(p);
  /* ⚠️⚠️ 포트폴리오는 **센 값**이지 확인이 아닙니다. 처음에 "포트폴리오
     확인" 으로 적었다가 "확인된 곳만" 거르개에 같이 걸렸습니다 —
     사진을 올린 것과 저희가 서류를 본 것은 다른 일인데 한 낱말이
     두 뜻으로 쓰인 것입니다. 건수를 그대로 냅니다. */
  var n = ((p && p.portfolio) || []).length;
  if(n) out.push("포트폴리오 " + n + "건");
  return out;
};

/* ⚠️ 후기를 쓰신 분의 이름은 **가려서** 냅니다. 그대로 올리면 그 자체가
   개인정보이고, 가게 상호와 붙으면 누구인지 특정됩니다.
   "김사장" → "김○○" · "이훈" → "이○" 입니다. */
window.amMaskName = function(n){
  n = String(n || "").trim();
  if(!n) return "";
  if(n.length === 1) return n;
  return n.charAt(0) + new Array(n.length).join("○");
};

window.amProviderInCat = function(p, cat){
  var keys = ((cat && cat.items) || []).map(function(i){ return i.key; });
  if(!keys.length) return false;
  return (p.subs || []).some(function(s){ return keys.indexOf(s) >= 0; });
};

/* 조건으로 거르기 — 분류 · 지역 · 업종 · 서비스 (§35)
   ⚠️⚠️ **`cat` 을 빼먹지 마세요.** `/providers/:cat` 이 분류를 안 넘기고
   있어서, 하위 분류를 고르기 전에는 **등록된 모든 업체가 모든 분야
   화면에** 나왔습니다 — 철거를 찾는 손님에게 인테리어 업체가 보이고,
   그 업체에 철거 요청이 갑니다. 업체가 0곳이라 아무도 못 봤고,
   **첫 업체를 등록하는 날** 터질 버그였습니다. */
window.amProviders = function(f){
  f = f || {};
  var cat = f.cat ? (window.amCat ? amCat(f.cat) : null) : null;
  return (window.AM_PROVIDERS||[]).filter(function(p){
    if(f.cat      && !window.amProviderInCat(p, cat)) return false;
    if(f.sub      && (p.subs||[]).indexOf(f.sub) < 0) return false;
    if(f.industry && (p.industries||[]).length &&
       (p.industries||[]).indexOf(f.industry) < 0) return false;
    if(f.region   && (p.regions||[]).length &&
       (p.regions||[]).indexOf(f.region) < 0) return false;
    /* ── 2026-10-05 V2 §11 의 거르개 ──────────────────────────────
       ⚠️⚠️ **재 본 적 없는 값으로는 안 거릅니다.** 지시서가 적은
       "평점 · 응답속도" 는 각각 후기 0건 · 재는 장치 없음이라,
       거르개로 만들면 그 순간 아무도 안 걸리거나 지어낸 순서가 됩니다.
       여기 있는 둘은 **우리가 실제로 들고 있는 사실**입니다. */
    if(f.verified && !window.amProviderVerified(p).length) return false;
    if(f.folio    && !((p.portfolio||[]).length)) return false;
    return true;
  });
};

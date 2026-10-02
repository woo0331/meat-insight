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
    return true;
  });
};

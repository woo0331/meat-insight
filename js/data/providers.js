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

/* 조건으로 거르기 — 지역 · 업종 · 서비스 (§35) */
window.amProviders = function(f){
  f = f || {};
  return (window.AM_PROVIDERS||[]).filter(function(p){
    if(f.sub      && (p.subs||[]).indexOf(f.sub) < 0) return false;
    if(f.industry && (p.industries||[]).length &&
       (p.industries||[]).indexOf(f.industry) < 0) return false;
    if(f.region   && (p.regions||[]).length &&
       (p.regions||[]).indexOf(f.region) < 0) return false;
    return true;
  });
};

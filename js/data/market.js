/* ════════════════════════════════════════════════════════════════════
   BusinessStore · BusinessAsset (§9 · §23 · §24 · §25 · §34)

   **여기가 창업과 폐업이 만나는 자리입니다** (§34).
   정리하시는 사장님이 올린 점포 · 시설 · 집기 · 재고를, 같은 업종을
   준비하는 사장님이 찾습니다.

       한 사장님의 끝이 다른 사장님의 시작이 됩니다.

   ⚠️ **매물을 지어내지 않습니다.** 지금 둘 다 비어 있습니다. 가짜
   매물은 부동산 허위매물과 같은 것이고, 보고 연락한 사람의 시간을
   훔치는 일입니다.
   ⚠️ **중고거래 사이트처럼 보이게 만들지 마세요** (§54). 여기 올라오는
   것은 "쓰던 물건" 이 아니라 **사업을 정리하면서 나오는 자산**입니다.
   그래서 업종 · 평수 · 운영기간 · 시설 포함 여부를 같이 답니다.
   ⚠️ **플랫폼이 거래 당사자가 아닙니다.** 전자상거래법 제20조 제1항 —
   중개자라는 사실을 미리 알려야 합니다. 화면과 약관 제5조가 같은 말을
   합니다.

   ── BusinessStore (점포 · 상가 · 매장 양도) ──────────────────────
   {
     id:"", kind:"transfer|lease",     양도 / 임대
     industry:"cafe", region:"gyeonggi", gu:"안양시",
     pyeong:0,
     deposit:null, rent:null, premium:null, equipCost:null,   단위 만원
     sales:null,                        매출 — **본인이 적은 값만**
     since:null, months:null,           운영기간
     wantAt:"", withEquip:false,
     title:"", text:"", images:[],
     fc:false,                          프랜차이즈 매장인가
     at:""                              올린 날
   }
   ⚠️ `sales`(매출)는 **확인할 방법이 없습니다.** 화면에 낼 때는 반드시
   "사장님이 적으신 값" 이라고 같이 적습니다. 우리가 보증하는 값이
   아닙니다.

   ── BusinessAsset (시설 · 집기 · 재고) ──────────────────────────
   {
     id:"", cat:"asset|stock", sub:"espresso",
     industry:"cafe", region:"gyeonggi", gu:"안양시",
     title:"", brand:"", year:null, count:1,
     price:null, nego:true,
     deal:"single|bulk|all",            개별 / 일괄 / 시설 전체 인수
     state:"", text:"", images:[],
     storeId:"",                        같은 가게에서 나온 것 묶기
     at:""
   }
   ════════════════════════════════════════════════════════════════════ */

window.AM_STORES = [];
window.AM_ASSETS = [];

window.AM_DEAL_KINDS = [
  { key:"single", name:"개별 판매" },
  { key:"bulk",   name:"일괄 판매" },
  { key:"all",    name:"시설 전체 인수" }
];

window.amStore = function(id){
  var r = (window.AM_STORES||[]).filter(function(s){ return s.id === id; });
  return r.length ? r[0] : null;
};
window.amAsset = function(id){
  var r = (window.AM_ASSETS||[]).filter(function(a){ return a.id === id; });
  return r.length ? r[0] : null;
};

/* ── 매물 거르개의 칸 (2026-10-05 V2 §7) ─────────────────────────
   > "지역 · 업종 · 면적 · 보증금 · 월세 · 권리금 · 월매출 · 영업기간 ·
   >  주차 · 시설 포함 여부"

   ⚠️⚠️ **구간(버킷)으로 거릅니다.** 숫자 두 칸(최소~최대)을 받으면
   폰에서 칸이 넷으로 늘고, 손님은 "보증금 얼마부터 얼마까지" 를 먼저
   정해야 합니다 — 고르는 쪽이 훨씬 빠릅니다.
   ⚠️ 윗값(`max`)이 없는 마지막 칸은 **그 위 전부**입니다.
   ⚠️⚠️ **월매출로는 안 거릅니다.** 올리신 사장님이 적은 값이라 확인할
   방법이 없는데, 거르개로 만들면 "매출 2천 이상" 이 사실인 것처럼
   읽힙니다 (화면이 그 값을 낼 때마다 누구 값인지 밝히는 것과 같은
   까닭입니다). 보시는 것까지는 되고 거르지는 않습니다.
   ⚠️ 이름 · 구간을 바꾸면 주소(`?py=` 등)에 실린 옛 링크가 **조용히
   안 맞습니다** — 없는 key 는 거르개를 그냥 안 겁니다. */
window.AM_STORE_RANGES = [
  { key:"py", name:"면적", unit:"평", field:"pyeong", opts:[
    { k:"a", name:"10평 이하",   max:10 },
    { k:"b", name:"10~20평",    min:10, max:20 },
    { k:"c", name:"20~30평",    min:20, max:30 },
    { k:"d", name:"30~50평",    min:30, max:50 },
    { k:"e", name:"50평 이상",   min:50 }
  ]},
  { key:"dp", name:"보증금", unit:"만원", field:"deposit", opts:[
    { k:"a", name:"1천만원 이하",  max:1000 },
    { k:"b", name:"1천~3천만원",   min:1000, max:3000 },
    { k:"c", name:"3천~5천만원",   min:3000, max:5000 },
    { k:"d", name:"5천만원~1억",   min:5000, max:10000 },
    { k:"e", name:"1억 이상",      min:10000 }
  ]},
  { key:"rt", name:"월세", unit:"만원", field:"rent", opts:[
    { k:"a", name:"100만원 이하",  max:100 },
    { k:"b", name:"100~200만원",   min:100, max:200 },
    { k:"c", name:"200~300만원",   min:200, max:300 },
    { k:"d", name:"300~500만원",   min:300, max:500 },
    { k:"e", name:"500만원 이상",   min:500 }
  ]},
  { key:"pm", name:"권리금", unit:"만원", field:"premium", opts:[
    /* ⚠️ "없음" 은 **0 을 적은 것**입니다. 안 적은 것과 다릅니다 —
       `!= null` 로 봐야 "권리금 0" 인 매물이 살아남습니다. */
    { k:"z", name:"무권리",        max:0 },
    /* ⚠️⚠️ **아래를 0 으로 막아 둡니다.** 안 막으면 권리금 0 인 매물이
       "무권리" 와 "1천만원 이하" **두 칸에 다 걸립니다** — 보증금
       3,000 이 두 칸에 걸렸던 것과 같은 자리이고, 여기는 윗값만 있는
       칸이 둘이라 그렇습니다. 0 은 **무권리 한 칸**입니다. */
    { k:"a", name:"1천만원 이하",  min:0, max:1000 },
    { k:"b", name:"1천~3천만원",   min:1000, max:3000 },
    { k:"c", name:"3천~5천만원",   min:3000, max:5000 },
    { k:"d", name:"5천만원 이상",   min:5000 }
  ]}
];

/* 그 구간에 드는가 — ⚠️ 값을 **안 적은 매물은 걸러 냅니다.** 조건을
   건 손님에게 "모르는 것" 을 섞어 보내면 헛걸음이 됩니다. */
/* ⚠️⚠️ **아래는 열고 위는 닫습니다** (min < n ≤ max).
   처음에 둘 다 닫아 두었더니 보증금 3,000만원짜리가 "1천~3천" 과
   "3천~5천" **두 칸에 다 걸렸습니다** — 손님이 3천~5천을 골랐는데
   3,000짜리가 나오면 거르개를 믿을 수 없게 됩니다.
   이 방향이라야 딱지도 맞습니다 — "1천만원 이하" 는 1,000 을 담고,
   "1천~3천만원" 은 1,000 을 안 담습니다.
   ⚠️ "무권리" 는 `max:0` 이라 **0 을 적은 것**만 걸립니다. 안 적은
   매물은 `val == null` 로 빠집니다 — 모르는 것을 "없음" 으로 내보내면
   보러 가신 분이 헛걸음합니다. */
window.amInRange = function(val, opt){
  if(val == null || !opt) return false;
  var n = Number(val);
  if(!isFinite(n)) return false;
  if(opt.min != null && n <= opt.min) return false;
  if(opt.max != null && n >  opt.max) return false;
  return true;
};
window.amStoreRange = function(key, k){
  var g = (window.AM_STORE_RANGES||[]).filter(function(x){ return x.key === key; })[0];
  if(!g) return null;
  var o = (g.opts||[]).filter(function(x){ return x.k === k; })[0];
  return o ? { group:g, opt:o } : null;
};

window.amStores = function(f){
  f = f || {};
  return (window.AM_STORES||[]).filter(function(s){
    if(f.industry && s.industry !== f.industry) return false;
    if(f.region   && s.region   !== f.region)   return false;
    if(f.withEquip && !s.withEquip) return false;
    /* ⚠️ 주차는 **적은 매물만** 걸립니다 — 안 적은 것을 "있음" 으로
       읽으면 보러 가신 분이 헛걸음합니다 */
    if(f.parking  && !s.parking) return false;
    if(f.kind     && s.kind !== f.kind) return false;
    /* 구간 거르개 — 주소에 실린 `py` · `dp` · `rt` · `pm` */
    var ok = true;
    (window.AM_STORE_RANGES||[]).forEach(function(g){
      if(!ok) return;
      var pick = f[g.key];
      if(!pick) return;
      var r = window.amStoreRange(g.key, pick);
      if(!r) return;                       /* 없는 key 는 안 겁니다 */
      if(!window.amInRange(s[g.field], r.opt)) ok = false;
    });
    return ok;
  });
};
/* 시설 · 집기의 값 구간 (V2 §7) — ⚠️ 단위는 만원입니다 */
window.AM_ASSET_PRICE = [
  { k:"a", name:"50만원 이하",   max:50 },
  { k:"b", name:"50~150만원",   min:50,  max:150 },
  { k:"c", name:"150~300만원",  min:150, max:300 },
  { k:"d", name:"300~500만원",  min:300, max:500 },
  { k:"e", name:"500만원 이상",  min:500 }
];

window.amAssets = function(f){
  f = f || {};
  return (window.AM_ASSETS||[]).filter(function(a){
    if(f.industry && a.industry !== f.industry) return false;
    if(f.region   && a.region   !== f.region)   return false;
    if(f.cat      && a.cat      !== f.cat)      return false;
    if(f.sub      && a.sub      !== f.sub)      return false;
    if(f.deal     && a.deal     !== f.deal)     return false;
    /* 값 구간 — ⚠️ 안 적은 매물은 걸러 냅니다 */
    if(f.pr){
      var o = (window.AM_ASSET_PRICE||[]).filter(function(x){ return x.k === f.pr; })[0];
      if(o && !window.amInRange(a.price, o)) return false;
    }
    return true;
  });
};

/* 창업 준비 중인 분에게 맞는 것이 있는가 (§34) —
   같은 업종 · 같은 지역이 먼저입니다. 없으면 빈 배열이고, 화면은
   그때 이 구간을 통째로 뺍니다. */
window.amMatchForStartup = function(industryKey, regionKey){
  return {
    stores: amStores({ industry:industryKey, region:regionKey }),
    assets: amAssets({ industry:industryKey, region:regionKey })
  };
};

/* ── 실제 견적 가격대 (메인 §21) ──────────────────────────────────
   ⚠️⚠️ **평균가를 지어내지 마세요.** 사장님이 그 숫자를 들고 업체와
   협상하러 가십니다. 틀리면 깎이거나 계약이 깨집니다.

   한 건의 생김새 —
     { key:"interior-cafe", name:"카페 인테리어 (10평)",
       range:"1,200만 ~ 2,600만원",   실제 견적의 범위 (평균이 아닙니다)
       n:37,                          그 범위를 낸 견적 건수
       asOf:"2026-09-30" }            **확인한 날**

   ⚠️ `range` · `n` · `asOf` 가 다 있는 것만 화면에 냅니다. 하나라도
   없으면 근거를 못 대는 숫자입니다.
   ⚠️ `n` 이 적으면 범위가 아니라 우연입니다. 열 건 아래는 올리지 마세요.
   ⚠️ 지금 **비어 있는 것이 맞습니다.** 견적이 0건입니다. */
window.AM_QUOTE_STATS = [];
window.amQuoteStats = function(){
  return (window.AM_QUOTE_STATS||[]).filter(function(q){
    return q && q.range && q.asOf && (q.n || 0) >= 10;
  });
};

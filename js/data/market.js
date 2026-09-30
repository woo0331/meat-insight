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

window.amStores = function(f){
  f = f || {};
  return (window.AM_STORES||[]).filter(function(s){
    if(f.industry && s.industry !== f.industry) return false;
    if(f.region   && s.region   !== f.region)   return false;
    if(f.withEquip && !s.withEquip) return false;
    return true;
  });
};
window.amAssets = function(f){
  f = f || {};
  return (window.AM_ASSETS||[]).filter(function(a){
    if(f.industry && a.industry !== f.industry) return false;
    if(f.region   && a.region   !== f.region)   return false;
    if(f.cat      && a.cat      !== f.cat)      return false;
    if(f.sub      && a.sub      !== f.sub)      return false;
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

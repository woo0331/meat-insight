/* ════════════════════════════════════════════════════════════════════
   Franchise · FranchiseCategory (§8)

   ⚠️⚠️ **브랜드를 한 곳도 지어내지 않습니다.** 프랜차이즈 창업비는
   사장님이 그 숫자를 보고 수천만 원을 빌리러 가는 값입니다. 근거 없이
   적으면 안 되고, 가맹사업법상 **정보공개서에 있는 값**이어야 합니다.
   지금 `AM_FRANCHISES` 는 비어 있습니다 — 본사가 입점해서 직접 등록한
   값만 올라갑니다.

   ⚠️ **금액은 반드시 출처와 기준일을 같이 답니다.** `source` 가 없는
   금액은 화면에 안 나옵니다. 정보공개서는 매년 바뀝니다.

   ── Franchise 한 건의 생김새 ───────────────────────────────────
   {
     slug:"", name:"", cat:"food", logo:"", cover:"",
     intro:"", features:["",""],
     cost:{ total:0, join:0, edu:0, deposit:0, interior:0,
            equip:0, etc:0, unit:"만원",
            pyeong:0,                    권장 평수
            source:"정보공개서", asOf:"2026-01-01" },
     stores:null,                        가맹점 수 — **본사 등록값만**
     support:["",""],                    본사 지원
     regions:["gyeonggi"],               모집지역
     disclosure:{ has:false, no:"", at:"" },   정보공개서 등록번호 · 등록일
     consult:true
   }
   ⚠️ `stores`(가맹점 수)를 0 으로 두지 마세요. **모르면 `null`** 입니다
   — 0 은 "한 곳도 없다" 는 뜻이고 그것도 숫자입니다.
   ════════════════════════════════════════════════════════════════════ */

window.AM_FRANCHISE_CATS = [
  { key:"food",     name:"외식",        icon:"utensils", tone:"t1" },
  { key:"cafe",     name:"카페 · 디저트", icon:"cup",     tone:"t2" },
  { key:"bar",      name:"주점",        icon:"glass",    tone:"t8" },
  { key:"retail",   name:"소매",        icon:"cart",     tone:"t5" },
  { key:"service",  name:"서비스",      icon:"hand",     tone:"t7" },
  { key:"academy",  name:"교육",        icon:"book",     tone:"t7" },
  { key:"beauty",   name:"뷰티",        icon:"sparkle",  tone:"t8" },
  { key:"gym",      name:"헬스",        icon:"dumbbell", tone:"t5" },
  { key:"pet",      name:"반려동물",     icon:"paw",      tone:"t4" },
  { key:"unmanned", name:"무인",        icon:"robot",    tone:"t5" },
  { key:"stay",     name:"숙박",        icon:"bed",      tone:"t7" },
  { key:"etc",      name:"기타",        icon:"plus",     tone:"t3" }
];

window.AM_FRANCHISES = [];

window.amFranchiseCat = function(key){
  var r = AM_FRANCHISE_CATS.filter(function(c){ return c.key === key; });
  return r.length ? r[0] : null;
};
window.amFranchise = function(slug){
  var r = (window.AM_FRANCHISES||[]).filter(function(f){ return f.slug === slug; });
  return r.length ? r[0] : null;
};
window.amFranchises = function(f){
  f = f || {};
  return (window.AM_FRANCHISES||[]).filter(function(x){
    if(f.cat    && x.cat !== f.cat) return false;
    if(f.region && (x.regions||[]).length &&
       (x.regions||[]).indexOf(f.region) < 0) return false;
    return true;
  });
};

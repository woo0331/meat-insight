/* ════════════════════════════════════════════════════════════════════
   상품 데이터 — 화면과 분리 (지시서 10·24번)

   ⚠️ 지금 값은 **시안에 적힌 임시 데이터**입니다. 실제 판매가가
   아닙니다. 실제 데이터로 바꿀 때는 이 파일만 갈아 끼우면 되고,
   화면 코드는 한 줄도 안 건드립니다.

   price  : 원/kg
   trim   : raw(원물) / wash(1차 세척) / full(완전 손질)
   temp   : chill(냉장) / frozen(냉동)
   badges : new / best / sale — 화면 배지
   ════════════════════════════════════════════════════════════════════ */

window.WOW_TRIM  = { raw:"원물", wash:"1차 세척", full:"완전 손질",
                     clean:"세척", cut:"세절", boil:"삶음" };
window.WOW_TEMP  = { chill:"냉장", frozen:"냉동" };
window.WOW_BREED = { hanwoo:"한우", yukwoo:"육우", impbeef:"수입소",
                     handon:"한돈", imppork:"수입돈" };

/* ⚠️ **평점(rating)·후기 수(reviews)를 지어내지 마세요.**
   시안을 만들 때 넣어 둔 4.9 (128개 리뷰) 같은 값이 그대로 올라가
   있었습니다. 화면 위쪽은 "★★★★★ 4.9 (128개 리뷰)" 인데 아래 리뷰
   탭은 "아직 등록된 리뷰가 없습니다" 라고 말하는, 한 화면 안에서
   서로 어긋나는 상태였습니다.

   더 나쁜 것은 **구글로 나간다는 점**입니다. ldFor() 가 후기 수가
   0보다 크면 Product 스키마에 aggregateRating 을 넣습니다 — 한 건도
   판 적 없는 가게의 검색 결과에 별 넷 반이 뜹니다. 구글은 이것을
   정책 위반으로 보고, 국내법으로도 표시·광고의 공정화에 관한 법률
   제3조(거짓·과장 광고)에 걸립니다.

   실제 후기를 받기 시작하면 그때 `rating` · `reviews` 를 넣으세요.
   그 전에는 **줄이 아예 없어야** 합니다 (0 도 적지 마세요 — 0 은
   "후기가 0건" 이라고 단정하는 숫자입니다). */
window.WOW_PRODUCTS = [
  /* ── 소 · 위·장류 ─────────────────────────────────────── */
  { id:"b-gopchang", sp:"beef", cat:"gut", item:"gopchang",
    name:"한우 소곱창", breed:"hanwoo", origin:"국내산 한우",
    price:17900, temp:"chill", trim:"full", img:"p-gopchang",
    badges:["best","new"], today:true,
    units:[1,5,10], trims:["raw","wash","full"], uses:["구이","전골","국밥","업소용"],
    detail:{ main:"detail-gopchang", thumbs:["detail-thumb1","detail-thumb2","detail-thumb3","detail-thumb4"] } },

  { id:"b-daechang", sp:"beef", cat:"gut", item:"daechang",
    name:"한우 대창", breed:"hanwoo", origin:"국내산 한우",
    price:14900, temp:"chill", trim:"full", img:"p-daechang",
    badges:["new"], today:true,
    units:[1,5,10], trims:["raw","wash","full"], uses:["구이","전골","업소용"] },

  { id:"b-makchang", sp:"beef", cat:"gut", item:"makchang",
    name:"한우 막창", breed:"hanwoo", origin:"국내산 한우",
    price:13900, temp:"chill", trim:"full", img:"p-makchang",
    badges:[],
    units:[1,5,10], trims:["raw","wash","full"], uses:["구이","업소용"] },

  { id:"b-yang", sp:"beef", cat:"gut", item:"yang",
    name:"한우 양", breed:"hanwoo", origin:"국내산 한우",
    price:9900, temp:"chill", trim:"full", img:"p-yang",
    badges:[],
    units:[1,5,10], trims:["raw","clean","full"], uses:["탕","전골","업소용"] },

  { id:"b-beolzip", sp:"beef", cat:"gut", item:"beolzip",
    name:"벌집양", breed:"hanwoo", origin:"국내산 한우",
    price:8900, temp:"chill", trim:"full", img:"p-beolzip",
    badges:[],
    units:[1,5,10], trims:["raw","clean","full"], uses:["탕","전골"] },

  { id:"b-cheonyeop", sp:"beef", cat:"gut", item:"cheonyeop",
    name:"천엽", breed:"hanwoo", origin:"국내산 한우",
    price:6900, temp:"chill", trim:"full", img:"p-cheonyeop",
    badges:["new"], today:true,
    units:[1,5,10], trims:["raw","clean","full"], uses:["회","전골"] },

  /* ── 소 · 장기류 ──────────────────────────────────────── */
  { id:"b-yeomtong", sp:"beef", cat:"organ", item:"yeomtong",
    name:"염통 (심장)", breed:"hanwoo", origin:"국내산 한우",
    price:4900, temp:"chill", trim:"full", img:"p-yeomtong",
    badges:[],
    units:[1,5,10], trims:["raw","clean","full"], uses:["구이","꼬치","업소용"] },

  { id:"b-gan", sp:"beef", cat:"organ", item:"gan",
    name:"간 (소간)", breed:"hanwoo", origin:"국내산 한우",
    price:3900, temp:"chill", trim:"full", img:"p-gan",
    badges:[],
    units:[1,5,10], trims:["raw","clean"], uses:["회","볶음"] },

  { id:"b-heopa", sp:"beef", cat:"organ", item:"heopa",
    name:"허파", breed:"hanwoo", origin:"국내산 한우",
    price:2900, temp:"chill", trim:"full", img:"p-heopa",
    badges:[],
    units:[1,5,10], trims:["raw","boil"], uses:["순대","전골"] },

  { id:"b-jira", sp:"beef", cat:"organ", item:"jira",
    name:"지라 (비장)", breed:"hanwoo", origin:"국내산 한우",
    price:2900, temp:"chill", trim:"full", img:"p-jira",
    /* soldOut: 당일 수급에 따라 관리자에서 켜고 끕니다 */
    soldOut:true,
    badges:[],
    units:[1,5,10], trims:["raw","clean"], uses:["전골","탕"] },

  { id:"b-kongpat", sp:"beef", cat:"organ", item:"kongpat",
    name:"콩팥", breed:"hanwoo", origin:"국내산 한우",
    price:3900, temp:"chill", trim:"full", img:"p-kongpat",
    badges:[],
    units:[1,5,10], trims:["raw","clean"], uses:["구이","전골"] },

  /* ── 소 · 머리·특수부위 ───────────────────────────────── */
  { id:"b-useol", sp:"beef", cat:"head", item:"useol",
    name:"우설 (소혀)", breed:"hanwoo", origin:"국내산 한우",
    price:12900, temp:"chill", trim:"full", img:"p-useol",
    badges:["best"],
    units:[1,5,10], trims:["raw","clean","boil"], uses:["구이","편육","업소용"] },

  /* ── 돼지 ─────────────────────────────────────────────── */
  { id:"p-makchang", sp:"pork", cat:"gut", item:"makchang",
    name:"한돈 막창", breed:"handon", origin:"국내산 한돈",
    price:8900, temp:"chill", trim:"clean", img:"t-makchang",
    badges:["new"], today:true,
    units:[1,5,10], trims:["raw","clean","full"], uses:["구이","업소용"] },

  { id:"p-sochang", sp:"pork", cat:"gut", item:"sochang",
    name:"한돈 소창", breed:"handon", origin:"국내산 한돈",
    price:7900, temp:"chill", trim:"full", img:"t-daechang",
    badges:[],
    units:[1,5,10], trims:["raw","clean","full"], uses:["순대","전골","업소용"] },

  { id:"p-osori", sp:"pork", cat:"gut", item:"osori",
    name:"오소리감투", breed:"handon", origin:"국내산 한돈",
    price:9900, temp:"chill", trim:"full", img:"t-gopchang",
    badges:["best"],
    units:[1,5,10], trims:["raw","clean","boil"], uses:["편육","전골","업소용"] },

  { id:"p-gan", sp:"pork", cat:"organ", item:"gan",
    name:"한돈 간", breed:"handon", origin:"국내산 한돈",
    price:2900, temp:"chill", trim:"clean", img:"p-gan",
    badges:[],
    units:[1,5,10], trims:["raw","clean"], uses:["순대","볶음"] }
];

/* ── 조회 도우미 — 화면은 이것만 부릅니다 ──────────────── */
window.wowProduct = function(id){
  return WOW_PRODUCTS.find(function(p){ return p.id===id; }) || null;
};
window.wowFind = function(q){
  q = q || {};
  var hit = WOW_PRODUCTS.filter(function(p){
    if(q.sp    && p.sp   !== q.sp)   return false;
    if(q.cat   && p.cat  !== q.cat)  return false;
    if(q.item  && p.item !== q.item) return false;
    if(q.today && !p.today)          return false;
    if(q.badge && (p.badges||[]).indexOf(q.badge)<0) return false;
    if(q.breed && q.breed.length && q.breed.indexOf(p.breed)<0) return false;
    if(q.temp  && q.temp.length  && q.temp.indexOf(p.temp)<0)   return false;
    if(q.trim  && q.trim.length  && q.trim.indexOf(p.trim)<0)   return false;
    if(q.use   && q.use.length   && !q.use.some(function(u){ return (p.uses||[]).indexOf(u)>=0; })) return false;
    if(q.text && !wowMatch(p, q.text)) return false;
    return true;
  });

  /* 검색일 때는 **가까운 것부터** 내놓습니다.
     "곱창" 을 넣으면 한우 소곱창이 먼저여야지, 도감 추천요리에
     "곱창전골" 이 적힌 양·벌집양이 먼저 나오면 안 됩니다.
     (정렬을 따로 고르면 목록 화면이 그 순서로 다시 세웁니다) */
  if(q.text) hit.sort(function(a,b){ return wowScore(b,q.text) - wowScore(a,q.text); });
  return hit;
};

/* 점수: 이름에 들면 가장 높고, 분류까지면 중간, 설명에만 있으면 낮습니다 */
window.wowScore = function(p, text){
  var words = String(text||"").trim().split(/\s+/).filter(Boolean).map(wowNorm)
              .filter(function(w){ return w.length; });
  if(!words.length) return 0;
  var nm = wowNorm(p.name), core = hayCore(p);
  var sc = 0;
  words.forEach(function(w){
    if(nm.indexOf(w) === 0) sc += 6;          /* 이름이 그 말로 시작 */
    else if(nm.indexOf(w) > 0) sc += 4;       /* 이름 안에 있음 */
    else if(core.indexOf(w) >= 0) sc += 2;    /* 분류·축종까지 */
    else sc += 1;                             /* 설명에만 */
  });
  return sc;
};
/* ── 검색 ────────────────────────────────────────────────
   ⚠️ 상품명만 뒤지면 안 됩니다. 손님은 "소곱창" · "탕거리" · "국밥" ·
   "위장류" 처럼 **우리가 붙인 분류 이름**으로도 찾습니다. 실제로
   "곱창" 을 넣으면 한 건만 나왔습니다 — 대창·막창은 같은 위·장류인데
   이름에 "곱창" 이 없어서 빠졌습니다.

   찾는 곳: 상품명 · 원산지 · 용도 · 축종 · 보관 · 손질 상태 ·
            축종 구분(소/돼지) · 분류명 · 세부 품목명 · 도감 설명

   ⚠️ 띄어쓰기와 **가운뎃점·괄호·빗금**을 지웁니다. 우리 분류 이름이
   "위·장류" · "뼈·탕거리" · "간 (소간)" 이라, 손님이 "위장류" · "탕거리" ·
   "소간" 이라고 치면 그냥은 안 잡힙니다. */
function wowNorm(s){
  return String(s==null?"":s).toLowerCase().replace(/[\s·・/()\[\]{},.\-–—_]/g,"");
}

/* 찾는 곳을 둘로 나눕니다.

   ⚠️ 한 글자 검색이 문제였습니다. "소" 를 넣으면 도감 설명의
   "고**소**함" 이 걸려 **돼지 상품까지 나왔습니다.** 한글은 한 글자가
   다른 낱말 안에 너무 자주 들어갑니다.
   → 한 글자일 때는 **이름·분류처럼 짧고 정확한 것만** 봅니다. */
function hayCore(p){
  if(p.__hayC) return p.__hayC;
  var bits = [p.name, WOW_BREED[p.breed]];
  try{
    bits.push(wowSpeciesName(p.sp), wowCatName(p.sp, p.cat));
    if(p.item) bits.push(wowCatName(p.sp, p.cat, p.item));
  }catch(e){}
  p.__hayC = wowNorm(bits.filter(Boolean).join(" "));
  return p.__hayC;
}
function hayFull(p){
  if(p.__hayF) return p.__hayF;
  var bits = [hayCore(p), p.origin, p.id, WOW_TEMP[p.temp], WOW_TRIM[p.trim]]
             .concat(p.uses||[])
             .concat((p.trims||[]).map(function(t){ return WOW_TRIM[t]; }));
  try{
    var e = (typeof wowEnc==="function") ? wowEnc(p.sp, p.item) : null;
    if(e){ bits.push(e.name, e.feat, e.texture); bits = bits.concat(e.cook||[]); }
  }catch(err){}
  p.__hayF = wowNorm(bits.filter(Boolean).join(" "));
  return p.__hayF;
}
window.wowHaystack = hayFull;

/* 여러 낱말을 넣으면 **전부** 들어 있는 것만 찾습니다
   ("한우 막창" → 한우이면서 막창) */
window.wowMatch = function(p, text){
  var words = String(text||"").trim().split(/\s+/).filter(Boolean).map(wowNorm)
              .filter(function(w){ return w.length; });
  if(!words.length) return true;
  return words.every(function(w){
    return (w.length<=1 ? hayCore(p) : hayFull(p)).indexOf(w) >= 0;
  });
};

/* 가격은 원/kg 입니다. 천 단위 구분만 하고 **반올림하지 않습니다** —
   사업자가 단가를 그대로 계산에 씁니다. */
window.wowWon = function(n){ return Number(n||0).toLocaleString("ko-KR"); };

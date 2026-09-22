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

window.WOW_PRODUCTS = [
  /* ── 소 · 위·장류 ─────────────────────────────────────── */
  { id:"b-gopchang", sp:"beef", cat:"gut", item:"gopchang",
    name:"한우 소곱창", breed:"hanwoo", origin:"국내산 한우",
    price:17900, temp:"chill", trim:"full", img:"p-gopchang",
    badges:["best","new"], today:true, rating:4.9, reviews:128,
    units:[1,5,10], trims:["raw","wash","full"], uses:["구이","전골","국밥","업소용"],
    detail:{ main:"detail-gopchang", thumbs:["detail-thumb1","detail-thumb2","detail-thumb3","detail-thumb4"] } },

  { id:"b-daechang", sp:"beef", cat:"gut", item:"daechang",
    name:"한우 대창", breed:"hanwoo", origin:"국내산 한우",
    price:14900, temp:"chill", trim:"full", img:"p-daechang",
    badges:["new"], today:true, rating:4.8, reviews:64,
    units:[1,5,10], trims:["raw","wash","full"], uses:["구이","전골","업소용"] },

  { id:"b-makchang", sp:"beef", cat:"gut", item:"makchang",
    name:"한우 막창", breed:"hanwoo", origin:"국내산 한우",
    price:13900, temp:"chill", trim:"full", img:"p-makchang",
    badges:[], rating:4.7, reviews:41,
    units:[1,5,10], trims:["raw","wash","full"], uses:["구이","업소용"] },

  { id:"b-yang", sp:"beef", cat:"gut", item:"yang",
    name:"한우 양", breed:"hanwoo", origin:"국내산 한우",
    price:9900, temp:"chill", trim:"full", img:"p-yang",
    badges:[], rating:4.6, reviews:33,
    units:[1,5,10], trims:["raw","clean","full"], uses:["탕","전골","업소용"] },

  { id:"b-beolzip", sp:"beef", cat:"gut", item:"beolzip",
    name:"벌집양", breed:"hanwoo", origin:"국내산 한우",
    price:8900, temp:"chill", trim:"full", img:"p-beolzip",
    badges:[], rating:4.7, reviews:28,
    units:[1,5,10], trims:["raw","clean","full"], uses:["탕","전골"] },

  { id:"b-cheonyeop", sp:"beef", cat:"gut", item:"cheonyeop",
    name:"천엽", breed:"hanwoo", origin:"국내산 한우",
    price:6900, temp:"chill", trim:"full", img:"p-cheonyeop",
    badges:["new"], today:true, rating:4.5, reviews:19,
    units:[1,5,10], trims:["raw","clean","full"], uses:["회","전골"] },

  /* ── 소 · 장기류 ──────────────────────────────────────── */
  { id:"b-yeomtong", sp:"beef", cat:"organ", item:"yeomtong",
    name:"염통 (심장)", breed:"hanwoo", origin:"국내산 한우",
    price:4900, temp:"chill", trim:"full", img:"p-yeomtong",
    badges:[], rating:4.6, reviews:22,
    units:[1,5,10], trims:["raw","clean","full"], uses:["구이","꼬치","업소용"] },

  { id:"b-gan", sp:"beef", cat:"organ", item:"gan",
    name:"간 (소간)", breed:"hanwoo", origin:"국내산 한우",
    price:3900, temp:"chill", trim:"full", img:"p-gan",
    badges:[], rating:4.4, reviews:17,
    units:[1,5,10], trims:["raw","clean"], uses:["회","볶음"] },

  { id:"b-heopa", sp:"beef", cat:"organ", item:"heopa",
    name:"허파", breed:"hanwoo", origin:"국내산 한우",
    price:2900, temp:"chill", trim:"full", img:"p-heopa",
    badges:[], rating:4.3, reviews:11,
    units:[1,5,10], trims:["raw","boil"], uses:["순대","전골"] },

  { id:"b-jira", sp:"beef", cat:"organ", item:"jira",
    name:"지라 (비장)", breed:"hanwoo", origin:"국내산 한우",
    price:2900, temp:"chill", trim:"full", img:"p-jira",
    badges:[], rating:4.2, reviews:8,
    units:[1,5,10], trims:["raw","clean"], uses:["전골","탕"] },

  { id:"b-kongpat", sp:"beef", cat:"organ", item:"kongpat",
    name:"콩팥", breed:"hanwoo", origin:"국내산 한우",
    price:3900, temp:"chill", trim:"full", img:"p-kongpat",
    badges:[], rating:4.3, reviews:9,
    units:[1,5,10], trims:["raw","clean"], uses:["구이","전골"] },

  /* ── 소 · 머리·특수부위 ───────────────────────────────── */
  { id:"b-useol", sp:"beef", cat:"head", item:"useol",
    name:"우설 (소혀)", breed:"hanwoo", origin:"국내산 한우",
    price:12900, temp:"chill", trim:"full", img:"p-useol",
    badges:["best"], rating:4.8, reviews:52,
    units:[1,5,10], trims:["raw","clean","boil"], uses:["구이","편육","업소용"] },

  /* ── 돼지 ─────────────────────────────────────────────── */
  { id:"p-makchang", sp:"pork", cat:"gut", item:"makchang",
    name:"한돈 막창", breed:"handon", origin:"국내산 한돈",
    price:8900, temp:"chill", trim:"clean", img:"t-makchang",
    badges:["new"], today:true, rating:4.7, reviews:38,
    units:[1,5,10], trims:["raw","clean","full"], uses:["구이","업소용"] },

  { id:"p-sochang", sp:"pork", cat:"gut", item:"sochang",
    name:"한돈 소창", breed:"handon", origin:"국내산 한돈",
    price:7900, temp:"chill", trim:"full", img:"t-daechang",
    badges:[], rating:4.5, reviews:14,
    units:[1,5,10], trims:["raw","clean","full"], uses:["순대","전골","업소용"] },

  { id:"p-osori", sp:"pork", cat:"gut", item:"osori",
    name:"오소리감투", breed:"handon", origin:"국내산 한돈",
    price:9900, temp:"chill", trim:"full", img:"t-gopchang",
    badges:["best"], rating:4.8, reviews:46,
    units:[1,5,10], trims:["raw","clean","boil"], uses:["편육","전골","업소용"] },

  { id:"p-gan", sp:"pork", cat:"organ", item:"gan",
    name:"한돈 간", breed:"handon", origin:"국내산 한돈",
    price:2900, temp:"chill", trim:"clean", img:"p-gan",
    badges:[], rating:4.2, reviews:7,
    units:[1,5,10], trims:["raw","clean"], uses:["순대","볶음"] }
];

/* ── 조회 도우미 — 화면은 이것만 부릅니다 ──────────────── */
window.wowProduct = function(id){
  return WOW_PRODUCTS.find(function(p){ return p.id===id; }) || null;
};
window.wowFind = function(q){
  q = q || {};
  return WOW_PRODUCTS.filter(function(p){
    if(q.sp    && p.sp   !== q.sp)   return false;
    if(q.cat   && p.cat  !== q.cat)  return false;
    if(q.item  && p.item !== q.item) return false;
    if(q.today && !p.today)          return false;
    if(q.breed && q.breed.length && q.breed.indexOf(p.breed)<0) return false;
    if(q.temp  && q.temp.length  && q.temp.indexOf(p.temp)<0)   return false;
    if(q.trim  && q.trim.length  && q.trim.indexOf(p.trim)<0)   return false;
    if(q.use   && q.use.length   && !q.use.some(function(u){ return (p.uses||[]).indexOf(u)>=0; })) return false;
    if(q.text){
      var t=(p.name+" "+p.origin+" "+(p.uses||[]).join(" ")).toLowerCase();
      if(t.indexOf(String(q.text).toLowerCase())<0) return false;
    }
    return true;
  });
};
/* 가격은 원/kg 입니다. 천 단위 구분만 하고 **반올림하지 않습니다** —
   사업자가 단가를 그대로 계산에 씁니다. */
window.wowWon = function(n){ return Number(n||0).toLocaleString("ko-KR"); };

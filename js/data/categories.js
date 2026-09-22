/* ════════════════════════════════════════════════════════════════════
   부산물 분류 — 작업지시서 8번(소)·9번(돼지) 그대로

   ⚠️ 이 파일은 **화면이 아니라 데이터**입니다. 카테고리를 늘리거나
   이름을 바꿀 때 여기만 고치면 헤더 GNB·퀵 카테고리·목록 필터·도감이
   전부 따라옵니다. 화면 코드에 "곱창" 같은 말을 직접 적지 마세요.

   slug 는 주소(/c/beef/gut/gopchang)와 이미지 파일명에 쓰이므로
   **한 번 정하면 바꾸지 않습니다.** 바꾸면 손님이 저장해 둔 링크가
   죽고, 검색엔진이 물고 있던 주소가 404 가 됩니다.
   ════════════════════════════════════════════════════════════════════ */

window.WOW_SPECIES = [
  { slug:"beef", name:"소 부산물", short:"소",   accentBg:"#123D32" },
  { slug:"pork", name:"돼지 부산물", short:"돼지", accentBg:"#2A5A4C" }
];

/* 소 부산물 — 지시서 8번 */
window.WOW_CAT_BEEF = [
  { slug:"gut",    name:"위·장류",      items:[
      {slug:"gopchang",  name:"곱창"},
      {slug:"daechang",  name:"대창"},
      {slug:"makchang",  name:"막창"},
      {slug:"yang",      name:"양"},
      {slug:"beolzip",   name:"벌집양"},
      {slug:"cheonyeop", name:"천엽"}
  ]},
  { slug:"organ",  name:"장기류",       items:[
      {slug:"gan",     name:"간"},
      {slug:"yeomtong",name:"염통"},
      {slug:"heopa",   name:"허파"},
      {slug:"jira",    name:"지라"},
      {slug:"kongpat", name:"콩팥"}
  ]},
  { slug:"head",   name:"머리·특수부위", items:[
      {slug:"someori",  name:"소머리"},
      {slug:"meorigogi",name:"머리고기"},
      {slug:"useol",    name:"우설"},
      {slug:"bolsal",   name:"볼살"},
      {slug:"sugure",   name:"수구레"},
      {slug:"seuji",    name:"스지"}
  ]},
  { slug:"bone",   name:"뼈·탕거리",     items:[
      {slug:"ujok",    name:"우족"},
      {slug:"sokkori", name:"소꼬리"},
      {slug:"sagol",   name:"사골"},
      {slug:"japppyeo",name:"잡뼈"},
      {slug:"dogani",  name:"도가니"}
  ]},
  { slug:"etc",    name:"기타",          items:[
      {slug:"seonji", name:"선지"},
      {slug:"jibang", name:"지방"},
      {slug:"etc",    name:"기타 부산물"}
  ]}
];

/* 돼지 부산물 — 지시서 9번 */
window.WOW_CAT_PORK = [
  { slug:"gut",    name:"위·장류",      items:[
      {slug:"sochang",  name:"소창"},
      {slug:"daechang", name:"대창"},
      {slug:"makchang", name:"막창"},
      {slug:"osori",    name:"오소리감투"},
      {slug:"wi",       name:"돼지 위"}
  ]},
  { slug:"organ",  name:"장기류",       items:[
      {slug:"gan",     name:"간"},
      {slug:"yeomtong",name:"염통"},
      {slug:"heopa",   name:"허파"},
      {slug:"jira",    name:"지라"},
      {slug:"kongpat", name:"콩팥"}
  ]},
  { slug:"head",   name:"머리·특수부위", items:[
      {slug:"dwaejimeori",name:"돼지머리"},
      {slug:"meorigogi",  name:"머리고기"},
      {slug:"bolsal",     name:"볼살"},
      {slug:"gwi",        name:"귀"},
      {slug:"hyeo",       name:"혀"}
  ]},
  { slug:"jokbone",name:"족·뼈",        items:[
      {slug:"apjok",   name:"앞족"},
      {slug:"dwitjok", name:"뒷족"},
      {slug:"minijok", name:"미니족"},
      {slug:"deungppyeo",name:"등뼈"},
      {slug:"japppyeo",name:"잡뼈"}
  ]},
  { slug:"etc",    name:"기타",          items:[
      {slug:"donpi",  name:"돈피"},
      {slug:"seonji", name:"선지"},
      {slug:"jibang", name:"지방"},
      {slug:"kkori",  name:"꼬리"},
      {slug:"etc",    name:"기타 부산물"}
  ]}
];

window.WOW_CATS = { beef: WOW_CAT_BEEF, pork: WOW_CAT_PORK };

/* 홈 "어떤 부산물을 찾으세요?" 여덟 장 — 지시서 7번.
   순서가 화면 순서입니다. to 는 눌렀을 때 갈 주소입니다. */
/* ⚠️ img 는 img/<이름>.jpg 의 <이름>입니다. 파일명과 글자까지 같아야
   합니다 — 어긋나면 카드가 통째로 빈 상자가 되는데, 화면에서는
   "아직 안 만든 사이트" 로 읽힙니다. 이름을 바꾸면 img/ 도 같이 보세요. */
window.WOW_QUICK = [
  { slug:"beef",       name:"소 부산물",      to:"/c/beef",             img:"q-beef" },
  { slug:"pork",       name:"돼지 부산물",    to:"/c/pork",             img:"q-pork" },
  { slug:"gopchang",   name:"곱창·대창",      to:"/c/beef/gut",         img:"q-gopchang" },
  { slug:"makchang",   name:"막창",           to:"/c/beef/gut/makchang",img:"q-makchang" },
  { slug:"yang",       name:"양·천엽",        to:"/c/beef/gut/yang",    img:"q-yang" },
  { slug:"head",       name:"머리·특수부위",  to:"/c/beef/head",        img:"q-organ" },
  { slug:"organ",      name:"장기류",         to:"/c/beef/organ",       img:"e-yeomtong" },
  { slug:"bone",       name:"뼈·탕거리",      to:"/c/beef/bone",        img:"q-bone" }
];

/* 헤더 GNB — 지시서 4번. 일곱 개가 전부입니다. */
window.WOW_GNB = [
  { name:"전체상품",    to:"/products" },
  { name:"소 부산물",   to:"/c/beef",   mega:"beef" },
  { name:"돼지 부산물", to:"/c/pork",   mega:"pork" },
  { name:"업소용",      to:"/b2b" },
  { name:"손질상품",    to:"/products/trim" },
  { name:"오늘입고",    to:"/products/today" },
  { name:"특가",        to:"/products/sale", hot:true }
];

/* slug 로 이름을 되찾는 도우미 — 화면 어디서나 씁니다.
   못 찾으면 **slug 를 그대로 찍지 말고** null 을 돌려줍니다.
   "gopchang" 같은 영문 slug 가 손님 화면에 보이면 안 됩니다. */
window.wowCatName = function(species, catSlug, itemSlug){
  var list = WOW_CATS[species]; if(!list) return null;
  var cat = list.find(function(c){ return c.slug===catSlug; });
  if(!cat) return null;
  if(!itemSlug) return cat.name;
  var it = cat.items.find(function(i){ return i.slug===itemSlug; });
  return it ? it.name : null;
};
window.wowSpeciesName = function(s){
  var f = WOW_SPECIES.find(function(x){ return x.slug===s; });
  return f ? f.name : null;
};
/* "소" · "돼지" — 제목에 붙일 짧은 이름입니다.
   ⚠️ 소와 돼지에 같은 이름의 부위가 여럿 있습니다 (간·염통·허파·
   콩팥·막창·잡뼈·선지·지방…). 제목에 축종을 안 붙이면 검색 결과에
   "간 · ABOUTMEAT" 가 두 줄 나란히 떠서 어느 쪽인지 알 수 없습니다. */
window.wowSpeciesShort = function(s){
  var f = WOW_SPECIES.find(function(x){ return x.slug===s; });
  return f ? f.short : null;
};
/* 부위 이름 앞에 축종을 붙입니다. 이미 붙어 있으면 그대로 둡니다 —
   "소 소머리" · "돼지 돼지머리" 가 되면 안 됩니다. */
window.wowPartTitle = function(sp, name){
  var sh = wowSpeciesShort(sp);
  if(!sh || !name) return name || null;
  return String(name).indexOf(sh)===0 ? name : sh+" "+name;
};

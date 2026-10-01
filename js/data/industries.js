/* ════════════════════════════════════════════════════════════════════
   Industry — 업종 (§6 · §12 · §41)

   **이 파일이 플랫폼의 개인화를 혼자 담당합니다.** 카페 창업자와
   미용실 창업자에게 서로 다른 것이 보이는 이유가 여기 있습니다.

   | 칸 | 무엇 |
   |---|---|
   | `equip`   | 이 업종에만 있는 **장비** (§12) |
   | `startup` | 창업 때 앞에 세울 카테고리 차례 (§41) |
   | `closure` | 폐업 때 앞에 세울 카테고리 차례 (§41) |
   | `stock`   | 이 업종의 **재고** 가 무엇인지 (§25) |

   ⚠️ **업종을 코드에 박지 마세요** (§54). 화면은 이 배열만 읽습니다.
   관리자에서 추가·삭제·정렬할 수 있게 하려고 데이터로 둔 것입니다.
   ⚠️ `startup` · `closure` 에 적는 key 는 `catalog.js` 의 카테고리
   key 입니다. 없는 key 를 적으면 **조용히 빠집니다** — 새 업종을
   넣을 때 `node build-pages.js` 가 어긋난 key 를 잡습니다.
   ⚠️ **없는 업종을 지어내지 마세요.** "기타" 를 두는 이유는 여기
   없는 업종으로 오신 분을 빈손으로 돌려보내지 않기 위해서입니다.
   ════════════════════════════════════════════════════════════════════ */

window.AM_INDUSTRIES = [
  { key:"restaurant", name:"음식점", icon:"utensils", tone:"t9",
    lead:"한식 · 중식 · 일식 · 양식 · 분식 · 고깃집",
    equip:[
      { key:"kitchen-eq", name:"주방기기" },
      { key:"fridge",     name:"냉장 · 냉동" },
      { key:"cook-eq",    name:"조리기기" },
      { key:"hood",       name:"후드 · 닥트" },
      { key:"food-eq",    name:"업종 전용 장비" }
    ],
    stock:["식자재","주류","포장재","소모품"],
    startup:["item","store","area","interior","equip","furniture","it","supply","admin","staff","marketing","clean","fund"],
    closure:["transfer","asset","stock","demolish","restore","waste","tax","labor","contract","law","support"] },

  { key:"cafe", name:"카페 · 디저트", icon:"cup", tone:"t10",
    lead:"카페 · 베이커리 · 디저트 · 브런치",
    equip:[
      { key:"espresso", name:"커피머신" },
      { key:"grinder",  name:"그라인더" },
      { key:"ice",      name:"제빙기" },
      { key:"showcase", name:"쇼케이스" },
      { key:"fridge",   name:"냉장 · 냉동" },
      { key:"bake-eq",  name:"제빵 · 제과 장비" }
    ],
    stock:["원두","부재료","포장재","소모품"],
    startup:["item","store","area","interior","equip","furniture","it","supply","admin","marketing","clean","fund"],
    closure:["transfer","asset","stock","demolish","restore","waste","tax","labor","contract","support"] },

  { key:"bar", name:"주점 · 바", icon:"glass", tone:"t6",
    lead:"호프 · 이자카야 · 와인바 · 칵테일바",
    equip:[
      { key:"kitchen-eq", name:"주방기기" },
      { key:"fridge",     name:"냉장 · 냉동" },
      { key:"beer",       name:"생맥주 · 주류 설비" },
      { key:"sound",      name:"음향 · 조명" }
    ],
    stock:["주류","식자재","포장재"],
    startup:["item","store","area","interior","equip","furniture","it","supply","admin","staff","marketing","clean","fund"],
    closure:["transfer","asset","stock","demolish","restore","waste","tax","labor","contract","support"] },

  { key:"hair", name:"미용 · 헤어", icon:"scissors", tone:"t8",
    lead:"헤어샵 · 바버샵 · 두피관리",
    equip:[
      { key:"salon-chair", name:"미용의자" },
      { key:"shampoo",     name:"샴푸대" },
      { key:"salon-eq",    name:"미용기기" },
      { key:"sterilize",   name:"소독 · 위생장비" }
    ],
    stock:["헤어제품","소모품","판매상품"],
    startup:["item","store","area","interior","equip","furniture","it","admin","staff","marketing","clean","fund"],
    closure:["transfer","asset","stock","demolish","restore","tax","labor","contract","support"] },

  { key:"beauty", name:"네일 · 뷰티", icon:"sparkle", tone:"t3",
    lead:"네일 · 속눈썹 · 왁싱 · 피부관리",
    equip:[
      { key:"beauty-bed", name:"관리 베드 · 의자" },
      { key:"nail-eq",    name:"네일 장비" },
      { key:"skin-eq",    name:"피부 관리기기" },
      { key:"sterilize",  name:"소독 · 위생장비" }
    ],
    stock:["시술 재료","소모품","판매상품"],
    startup:["item","store","area","interior","equip","furniture","it","admin","marketing","clean","fund"],
    closure:["transfer","asset","stock","demolish","restore","tax","labor","contract","support"] },

  { key:"gym", name:"헬스 · PT", icon:"dumbbell", tone:"t1",
    lead:"헬스장 · PT샵 · 필라테스 · 요가",
    equip:[
      { key:"fitness",  name:"운동기구" },
      { key:"locker",   name:"락커 · 탈의실" },
      { key:"shower",   name:"샤워시설" },
      { key:"sound",    name:"음향 · 영상" }
    ],
    stock:["보충제","운동용품","판매상품"],
    startup:["item","store","area","interior","equip","furniture","it","admin","staff","marketing","clean","fund"],
    closure:["transfer","asset","demolish","restore","waste","tax","labor","contract","support"] },

  { key:"academy", name:"학원 · 교육", icon:"grad", tone:"t11",
    lead:"교습소 · 공부방 · 예체능 · 직업교육",
    equip:[
      { key:"desk",     name:"책상 · 의자" },
      { key:"board",    name:"전자칠판 · 칠판" },
      { key:"av",       name:"음향 · 영상" },
      { key:"pc",       name:"PC · 태블릿" }
    ],
    stock:["교재","학습자재","소모품"],
    startup:["item","store","area","interior","equip","furniture","it","admin","staff","marketing","clean","fund"],
    closure:["transfer","asset","demolish","restore","tax","labor","contract","support"] },

  { key:"pet", name:"반려동물", icon:"paw", tone:"t2",
    lead:"펫샵 · 미용 · 호텔 · 유치원 · 동물병원",
    equip:[
      { key:"pet-groom", name:"미용장비" },
      { key:"cage",      name:"케이지 · 사육장" },
      { key:"pet-hotel", name:"호텔 시설" },
      { key:"sterilize", name:"소독 · 위생장비" }
    ],
    stock:["사료","용품","판매상품"],
    startup:["item","store","area","interior","equip","furniture","it","supply","admin","marketing","clean","fund"],
    closure:["transfer","asset","stock","demolish","restore","tax","labor","contract","support"] },

  { key:"retail", name:"소매 · 편의점", icon:"bag", tone:"t12",
    lead:"편의점 · 마트 · 전문소매 · 잡화",
    equip:[
      { key:"showcase",  name:"쇼케이스 · 진열냉장" },
      { key:"shelf",     name:"진열대 · 선반" },
      { key:"fridge",    name:"냉장 · 냉동" },
      { key:"counter",   name:"카운터" }
    ],
    stock:["상품 재고","포장재","소모품"],
    startup:["item","store","area","interior","equip","furniture","it","supply","admin","staff","marketing","clean","fund"],
    closure:["transfer","asset","stock","demolish","restore","tax","labor","contract","support"] },

  { key:"unmanned", name:"무인매장", icon:"scan", tone:"t5",
    lead:"무인카페 · 무인점포 · 스터디카페 · 셀프세탁",
    equip:[
      { key:"vending",  name:"자동판매 · 무인기기" },
      { key:"kiosk-eq", name:"키오스크 · 결제" },
      { key:"cctv-eq",  name:"CCTV · 보안" },
      { key:"door",     name:"출입 · 잠금장치" }
    ],
    stock:["상품 재고","소모품"],
    startup:["item","store","area","interior","equip","it","admin","marketing","clean","fund"],
    closure:["transfer","asset","stock","demolish","restore","tax","contract","support"] },

  { key:"stay", name:"숙박", icon:"bed", tone:"t7",
    lead:"모텔 · 펜션 · 게스트하우스 · 공유숙박",
    equip:[
      { key:"bed-eq",   name:"침구 · 침대" },
      { key:"laundry",  name:"세탁 · 건조" },
      { key:"hvac",     name:"냉난방 · 급탕" },
      { key:"door",     name:"출입 · 잠금장치" }
    ],
    stock:["어메니티","침구","소모품"],
    startup:["item","store","area","interior","equip","furniture","it","admin","staff","marketing","clean","fund"],
    closure:["transfer","asset","stock","demolish","restore","waste","tax","labor","contract","support"] },

  { key:"office", name:"사무 · 전문서비스", icon:"briefcase", tone:"t13",
    lead:"사무실 · 상담소 · 공유오피스 · 전문직",
    equip:[
      { key:"desk",   name:"사무가구" },
      { key:"pc",     name:"PC · 네트워크" },
      { key:"print",  name:"복합기 · 출력" },
      { key:"meeting",name:"회의 · 화상장비" }
    ],
    stock:["사무용품","소모품"],
    startup:["item","store","area","interior","furniture","it","admin","staff","marketing","clean","fund"],
    closure:["transfer","asset","demolish","restore","tax","labor","contract","support"] },

  { key:"online", name:"온라인 · 판매", icon:"laptop", tone:"t14",
    lead:"온라인몰 · 스마트스토어 · 라이브 · 도소매",
    equip:[
      { key:"studio",  name:"촬영 · 스튜디오" },
      { key:"pack-eq", name:"포장 · 물류장비" },
      { key:"shelf",   name:"보관 · 선반" },
      { key:"pc",      name:"PC · 네트워크" }
    ],
    stock:["상품 재고","포장재","소모품"],
    startup:["item","interior","equip","it","supply","admin","marketing","fund"],
    closure:["asset","stock","tax","contract","support"] },

  { key:"etc", name:"기타", icon:"grid", tone:"t4",
    lead:"여기 없는 업종도 그대로 적어 주시면 됩니다",
    equip:[],
    stock:["사업장 재고"],
    startup:["item","store","area","interior","equip","furniture","it","supply","admin","staff","marketing","clean","fund"],
    closure:["transfer","asset","stock","demolish","restore","waste","tax","labor","contract","law","support"] }
];

window.amIndustry = function(key){
  var r = (window.AM_INDUSTRIES||[]).filter(function(x){ return x.key === key; });
  return r.length ? r[0] : null;
};
window.amIndustryName = function(key){
  var i = amIndustry(key); return i ? i.name : "";
};

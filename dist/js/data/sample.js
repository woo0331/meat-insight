

window.AM_SAMPLE_ON = true;

window.AM_SAMPLES = {

  provider: {
    id:"sample-provider", sample:true,
    name:"예시 인테리어",
    regions:["gyeonggi"],
    gu:["안양시","군포시","의왕시"],
    industries:["cafe","restaurant"],
    subs:["interior","design","electric","sign"],
    intro:"예시로 만든 프로필입니다. 실제 업체가 아닙니다 — 등록하시면 이런 짜임새로 나갑니다.",
    since:2015, staff:6,
    consultHours:"평일 09:00~18:00",

    verified:{ biz:true, owner:true, phone:true, license:true },
    portfolio:[
      { title:"18평 카페 — 카운터와 전기 증설", industry:"cafe",
        region:"gyeonggi", year:2026, images:[] },
      { title:"26평 음식점 — 주방 덕트와 배수", industry:"restaurant",
        region:"gyeonggi", year:2025, images:[] },
      { title:"12평 테이크아웃 — 간판과 외부", industry:"cafe",
        region:"gyeonggi", year:2025, images:[] }
    ],

    price:[
      { name:"예시 — 카페 인테리어", from:0, unit:"", note:"예시입니다. 실제 금액이 아닙니다 — 현장을 보고 업체가 적습니다." },
      { name:"예시 — 전기 증설",     from:0, unit:"", note:"예시입니다. 실제 금액이 아닙니다." }
    ],

    as:{ period:"예시 — 준공 후 n개월",
         what:"예시 — 시공 하자에 한함 (사용 중 파손은 제외)" },

    faq:[
      { q:"예시 — 상담은 어떻게 하나요?",
        a:"예시 답입니다. 실제 업체가 적는 자리입니다 — 저희가 대신 적지 않습니다." },
      { q:"예시 — 견적은 언제 나오나요?",
        a:"예시 답입니다. 회신 시점은 업체가 정하고 저희가 보장하지 않습니다." }
    ],

    reviews:[
      { at:"2026-09-12", by:"김사장", industry:"cafe", sub:"interior",
        score:{ total:5, price:4, speed:5, pro:5, schedule:5, again:5 },
        text:"예시 후기입니다. 실제 후기가 아닙니다 — 손님이 쓰신 글만 올라갑니다.",
        badge:"contract" },
      { at:"2026-08-30", by:"이사장", industry:"restaurant", sub:"electric",
        score:{ total:5, price:4, speed:4, pro:5, schedule:4, again:5 },
        text:"예시 후기입니다. 실제 후기가 아닙니다.",
        badge:"deal" },
      { at:"2026-07-21", by:"박사장", industry:"cafe", sub:"sign",
        score:{ total:4, price:4, speed:5, pro:4, schedule:5, again:4 },
        text:"예시 후기입니다. 실제 후기가 아닙니다.",
        badge:"consult" }
    ]
  }
};

window.amSample = function(key){
  if(!window.AM_SAMPLE_ON) return null;
  return (window.AM_SAMPLES || {})[key] || null;
};

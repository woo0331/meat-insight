/* ════════════════════════════════════════════════════════════════════
   파트너 카테고리 — 지시서 25번

   이 목록이 곧 **매칭의 단위**입니다. 손님이 SOS 로 적은 문제는
   관리자가 여기 있는 서비스 하나로 분류하고, 그 서비스를 하는 파트너
   중에서 **최대 세 곳**을 고릅니다 (지시서 12번).

   ⚠️ **업체를 많이 보여주는 것이 목적이 아닙니다.** 조건에 맞는 좋은
   업체 세 곳을 고르는 것이 목적입니다. 이 파일이 길어질수록 그 일이
   어려워지므로, 새 서비스를 늘릴 때는 기존 것에 흡수할 자리를 먼저
   찾으세요.

   ⚠️ `req` 는 그 서비스의 **요청서 schema 이름**입니다 (지시서 15번).
   서비스마다 물어볼 것이 다릅니다 — 덕트는 화구 수를 묻고, 육류 공급은
   월 사용량을 묻습니다. 없으면 공통 요청서로 받습니다.
   ════════════════════════════════════════════════════════════════════ */

window.WOW_SERVICE_GROUPS = [
  { key:"meat", name:"육류 · 식자재", lead:"매일 들어오는 것",
    items:[
      { key:"beef-supply", name:"육류 공급", req:"meat",
        line:"한우·한돈·수입육 직납" },
      { key:"food",        name:"식자재",   req:null, line:"부재료·소스·야채" },
      { key:"pack",        name:"포장재",   req:null, line:"용기·진공팩·배달포장" },
      { key:"drink",       name:"주류",     req:null, line:"주류 거래처" }
    ]},

  { key:"space", name:"공간 · 시설", lead:"한 번 하면 오래 가는 것",
    items:[
      { key:"interior", name:"인테리어",   req:"interior", line:"신규·리뉴얼·부분시공" },
      { key:"duct",     name:"덕트 · 환기", req:"duct",     line:"배기·냄새·민원" },
      { key:"kitchen",  name:"주방설비",   req:null, line:"후드·급배수·가스" },
      { key:"cold",     name:"냉장 · 냉동", req:null, line:"워크인·쇼케이스·숙성고" },
      { key:"elec",     name:"전기",       req:null, line:"증설·배선" },
      { key:"gas",      name:"가스",       req:null, line:"배관·검사" },
      { key:"sign",     name:"간판",       req:null, line:"외부·내부 사인" }
    ]},

  { key:"equip", name:"장비", lead:"정육 작업에 쓰는 것",
    items:[
      { key:"slicer",   name:"육절기",     req:null, line:"" },
      { key:"bonesaw",  name:"골절기",     req:null, line:"" },
      { key:"vacuum",   name:"진공기",     req:null, line:"" },
      { key:"showcase", name:"쇼케이스",   req:null, line:"" },
      { key:"aging",    name:"숙성고",     req:null, line:"" },
      { key:"scale",    name:"저울",       req:null, line:"" },
      { key:"equip-etc",name:"기타 정육장비", req:null, line:"" }
    ]},

  { key:"ops", name:"운영", lead:"매달 나가는 것",
    items:[
      { key:"pos",     name:"POS",      req:null, line:"" },
      { key:"kiosk",   name:"키오스크",  req:null, line:"" },
      { key:"cctv",    name:"CCTV",     req:null, line:"" },
      { key:"net",     name:"인터넷",    req:null, line:"" },
      { key:"pest",    name:"방역",      req:null, line:"" },
      { key:"clean",   name:"청소",      req:null, line:"" },
      { key:"tax",     name:"세무",      req:null, line:"" },
      { key:"labor",   name:"노무",      req:null, line:"" }
    ]},

  { key:"grow", name:"성장", lead:"더 팔기 위한 것",
    items:[
      { key:"marketing", name:"마케팅",     req:null, line:"" },
      { key:"photo",     name:"사진 · 영상", req:null, line:"" },
      { key:"design",    name:"디자인",     req:null, line:"" },
      { key:"online",    name:"온라인판매", req:null, line:"" },
      { key:"oem",       name:"OEM · PB",   req:null, line:"" }
    ]},

  { key:"pro", name:"전문 서비스", lead:"자격이 필요한 것",
    items:[
      { key:"haccp",   name:"HACCP",  req:null, line:"" },
      { key:"hygiene", name:"위생",   req:null, line:"" },
      { key:"consult", name:"컨설팅", req:null, line:"" },
      { key:"logi",    name:"물류",   req:null, line:"" }
    ]}
];

/* 화면 여러 곳에서 "서비스 하나" 를 이름으로 찾습니다 */
window.WOW_SERVICES = WOW_SERVICE_GROUPS.reduce(function(all, g){
  return all.concat(g.items.map(function(it){
    return { group:g.key, groupName:g.name, key:it.key, name:it.name,
             line:it.line, req:it.req };
  }));
}, []);

window.wowService = function(key){
  return WOW_SERVICES.filter(function(s){ return s.key === key; })[0] || null;
};
/* ⚠️ 못 찾으면 **영문 key 를 그대로 찍지 말고** null 을 돌려줍니다.
   "beef-supply" 가 손님 화면에 보이면 안 됩니다. */
window.wowServiceName = function(key){
  var s = wowService(key); return s ? s.name : null;
};

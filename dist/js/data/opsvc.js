

window.AM_OPSVC = [
  { key:"food", no:"A", name:"식자재 · 원재료", icon:"pkgck", tone:"t9",
    lead:"매일 들어오는 것",
    desc:"거래처를 새로 뚫거나 단가를 비교하실 때. 품목마다 거래처가 다릅니다.",
    items:[
      { cat:"supply", sub:"ingredient" },  { cat:"supply", sub:"meat" },
      { cat:"supply", sub:"seafood" },     { cat:"supply", sub:"produce" },
      { cat:"supply", sub:"beverage" },    { cat:"supply", sub:"coffee-bean" },
      { cat:"supply", sub:"bakery" },      { cat:"supply", sub:"liquor" },
      { cat:"supply", sub:"material" }
    ]},

  { key:"consum", no:"B", name:"소모품 · 포장재", icon:"boxes", tone:"t4",
    lead:"떨어지면 장사가 멈추는 것",
    desc:"배달용기 · 포장재 · 위생용품처럼 반복해서 사시는 것들입니다.",
    items:[
      { cat:"supply", sub:"delivery-box" }, { cat:"supply", sub:"packaging" },
      { cat:"supply", sub:"disposable" },   { cat:"supply", sub:"hygiene" },
      { cat:"supply", sub:"cleaning-sup" }, { cat:"supply", sub:"consumable" },
      { cat:"supply", sub:"uniform" },      { cat:"supply", sub:"office-sup" }
    ]},

  { key:"fix", no:"C", name:"장비 · 시설 유지보수", icon:"tool", tone:"t12",
    lead:"멈췄을 때 부르는 곳",
    desc:"장비가 멈추면 그날 장사가 안 됩니다. 지역 · 품목으로 찾습니다.",
    items:[
      { cat:"repair", sub:"fridge-fix" },  { cat:"repair", sub:"coffee-fix" },
      { cat:"repair", sub:"ice-fix" },     { cat:"repair", sub:"aircon-fix" },
      { cat:"repair", sub:"kitchen-fix" }, { cat:"repair", sub:"elec-fix" },
      { cat:"repair", sub:"it-fix" }
    ]},

  { key:"system", no:"D", name:"매장 운영 솔루션", icon:"monitor", tone:"t1",
    lead:"사람 손을 덜어 주는 것",
    desc:"POS · 키오스크 · 예약 · 재고 · 급여까지 매장 안에서 도는 프로그램입니다.",
    items:[
      { cat:"it", sub:"pos" },        { cat:"it", sub:"kiosk" },
      { cat:"it", sub:"table-order" },{ cat:"it", sub:"booking" },
      { cat:"it", sub:"waiting" },    { cat:"it", sub:"inventory" },
      { cat:"it", sub:"sales-mgmt" }, { cat:"it", sub:"hr-pay" },
      { cat:"it", sub:"acct-sw" }
    ]},

  { key:"grow", no:"E", name:"마케팅 · 매출 증대", icon:"megaphone", tone:"t8",
    lead:"손님을 더 오게 하는 것",
    desc:"플레이스 · SNS · 광고 · 리뷰까지. 문 열고 나서 계속 드는 돈입니다.",
    items:[
      { cat:"marketing", sub:"place" },   { cat:"marketing", sub:"sns" },
      { cat:"marketing", sub:"ad-agency" },{ cat:"marketing", sub:"blog" },
      { cat:"marketing", sub:"review" },  { cat:"marketing", sub:"crm" },
      { cat:"marketing", sub:"menu-design" }, { cat:"marketing", sub:"photo" },
      { cat:"marketing", sub:"video" }
    ]},

  { key:"care", no:"F", name:"운영 관리", icon:"shield", tone:"t5",
    lead:"정기로 돌아가는 것",
    desc:"청소 · 방역 · 점검 · 세무 · 노무처럼 주기를 두고 맡기시는 일입니다.",
    items:[
      { cat:"clean",  sub:"regular" },   { cat:"clean",  sub:"disinfect" },
      { cat:"clean",  sub:"pest" },      { cat:"clean",  sub:"facility" },
      { cat:"it",     sub:"security" },  { cat:"repair", sub:"check-up" },
      { cat:"repair", sub:"rental-care" },
      { cat:"admin",  sub:"insurance" }, { cat:"admin",  sub:"tax-agent" },
      { cat:"admin",  sub:"labor-agent" }
    ]}
];

window.AM_OPSVC_BY_IND = {
  cafe: [
    { cat:"supply", sub:"coffee-bean" }, { cat:"supply", sub:"beverage" },
    { cat:"supply", sub:"bakery" },      { cat:"supply", sub:"disposable" },
    { cat:"supply", sub:"packaging" },   { cat:"repair", sub:"coffee-fix" },
    { cat:"repair", sub:"ice-fix" },     { cat:"it",     sub:"pos" },
    { cat:"marketing", sub:"place" }
  ],
  restaurant: [
    { cat:"supply", sub:"ingredient" },  { cat:"supply", sub:"meat" },
    { cat:"supply", sub:"seafood" },     { cat:"supply", sub:"produce" },
    { cat:"supply", sub:"delivery-box" },{ cat:"repair", sub:"kitchen-fix" },
    { cat:"repair", sub:"fridge-fix" },  { cat:"clean",  sub:"disinfect" },
    { cat:"clean",  sub:"pest" },        { cat:"it",     sub:"table-order" }
  ],
  bar: [
    { cat:"supply", sub:"liquor" },      { cat:"supply", sub:"ingredient" },
    { cat:"repair", sub:"fridge-fix" },  { cat:"repair", sub:"ice-fix" },
    { cat:"it",     sub:"pos" },         { cat:"clean",  sub:"regular" }
  ],
  hair: [
    { cat:"supply", sub:"material" },    { cat:"supply", sub:"consumable" },
    { cat:"it",     sub:"booking" },     { cat:"marketing", sub:"crm" },
    { cat:"marketing", sub:"place" },    { cat:"marketing", sub:"review" },
    { cat:"repair", sub:"elec-fix" }
  ],
  beauty: [
    { cat:"supply", sub:"material" },    { cat:"supply", sub:"hygiene" },
    { cat:"it",     sub:"booking" },     { cat:"marketing", sub:"sns" },
    { cat:"marketing", sub:"review" },   { cat:"clean",  sub:"disinfect" }
  ],
  gym: [
    { cat:"repair", sub:"check-up" },    { cat:"repair", sub:"aircon-fix" },
    { cat:"marketing", sub:"crm" },         { cat:"it",     sub:"hr-pay" },
    { cat:"marketing", sub:"place" },    { cat:"clean",  sub:"regular" }
  ],
  academy: [
    { cat:"it",     sub:"booking" },     { cat:"it",     sub:"hr-pay" },
    { cat:"it",     sub:"acct-sw" },     { cat:"marketing", sub:"blog" },
    { cat:"marketing", sub:"place" },    { cat:"clean",  sub:"regular" }
  ],
  retail: [
    { cat:"supply", sub:"packaging" },   { cat:"supply", sub:"consumable" },
    { cat:"it",     sub:"pos" },         { cat:"it",     sub:"inventory" },
    { cat:"repair", sub:"fridge-fix" },  { cat:"marketing", sub:"place" }
  ],
  unmanned: [
    { cat:"it",     sub:"kiosk" },       { cat:"it",     sub:"cctv" },
    { cat:"it",     sub:"inventory" },   { cat:"repair", sub:"it-fix" },
    { cat:"repair", sub:"rental-care" }, { cat:"clean",  sub:"regular" }
  ],
  pet: [
    { cat:"supply", sub:"consumable" },  { cat:"supply", sub:"hygiene" },
    { cat:"it",     sub:"booking" },     { cat:"clean",  sub:"disinfect" },
    { cat:"marketing", sub:"place" },    { cat:"marketing", sub:"review" }
  ],
  stay: [
    { cat:"supply", sub:"hygiene" },     { cat:"supply", sub:"consumable" },
    { cat:"clean",  sub:"regular" },     { cat:"it",     sub:"booking" },
    { cat:"repair", sub:"aircon-fix" },  { cat:"marketing", sub:"place" }
  ],
  office: [
    { cat:"supply", sub:"office-sup" },  { cat:"it",     sub:"acct-sw" },
    { cat:"it",     sub:"hr-pay" },      { cat:"admin",  sub:"tax-agent" },
    { cat:"admin",  sub:"labor-agent" }, { cat:"clean",  sub:"regular" }
  ],
  online: [
    { cat:"supply", sub:"packaging" },   { cat:"supply", sub:"delivery-box" },
    { cat:"it",     sub:"inventory" },   { cat:"it",     sub:"sales-mgmt" },
    { cat:"marketing", sub:"ad-agency" },{ cat:"marketing", sub:"crm" }
  ]

};

window.amOpsvcOne = function(it){
  if(!it || !it.cat) return null;
  var c = (window.amCat ? window.amCat(it.cat) : null);
  if(!c) return null;
  var sub = null, L = c.items || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === it.sub){ sub = L[i]; break; }
  if(!sub) return null;

  var base = (c.kind === "provider") ? "/providers/" + c.key
           : (c.to ? c.to : "/c/" + c.key);
  var to = (c.kind === "provider") ? base + "?s=" + encodeURIComponent(sub.key) : base;
  return { cat:c, sub:sub, name:sub.name, catName:c.name,
           tone:c.tone || "t7", icon:c.icon, to:to };
};

window.amOpsvcFor = function(ind, limit){
  var pri = (window.AM_OPSVC_BY_IND || {})[ind] || [];
  var seen = {}, out = [], i, one, k;
  for(i = 0; i < pri.length; i++){
    one = window.amOpsvcOne(pri[i]);
    if(!one) continue;
    k = one.cat.key + "/" + one.sub.key;
    if(seen[k]) continue;
    seen[k] = 1; out.push(one);
  }
  (window.AM_OPSVC || []).forEach(function(g){
    (g.items || []).forEach(function(it){
      var o = window.amOpsvcOne(it); if(!o) return;
      var kk = o.cat.key + "/" + o.sub.key;
      if(seen[kk]) return;
      seen[kk] = 1; out.push(o);
    });
  });
  return limit ? out.slice(0, limit) : out;
};

window.amOpsvcItems = function(groupKey){
  var g = null, L = window.AM_OPSVC || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === groupKey){ g = L[i]; break; }
  if(!g) return [];
  return (g.items || []).map(window.amOpsvcOne).filter(Boolean);
};

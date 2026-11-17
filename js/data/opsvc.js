/* ════════════════════════════════════════════════════════════════════
   운영 서비스관 — 2026-10-09 최종 통합 지시서 §5

   ⚠️⚠️ **새 분류를 만든 것이 아닙니다.** `catalog.js` 의 분류와 하위를
   **묶어 보는 틀**이고, `lifecycle.js`(단계 여섯) · `journey.js`(여정
   넷) · `sales.js`(영업 카테고리 열넷) · `indgroups.js`(업종 대분류
   아홉)와 **같은 성격**입니다 — key 를 한 글자도 안 건드렸습니다.

   ⚠️ 딱 하나 **없던 것**이 있어 분류를 하나 늘렸습니다 —
   `repair`(수리 · 유지보수). 냉장고가 멈춰서 오늘 고쳐야 하는
   사장님이 들어올 자리가 사이트에 한 곳도 없었습니다 (`equip` 은
   사는 것, `clean` 은 청소, `contract` 는 해지입니다).

   ── §5-2 의 여섯 묶음 ────────────────────────────────────────
     A 식자재 · 원재료      supply
     B 소모품 · 포장재       supply
     C 장비 · 시설 유지보수  repair   ← 새 분류
     D 매장 운영 솔루션      it
     E 마케팅 · 매출 증대    marketing
     F 운영 관리            clean · admin · it · repair

   ⚠️⚠️ **새 주소를 만들지 않았습니다** (콘텐츠 중복 방지). 묶음을
   누르면 **그 분류의 진짜 화면**(`/providers/:cat` · `/c/:cat`)으로
   갑니다 — `/opsvc/:group` 을 만들면 같은 내용이 두 주소로 나가고
   구글이 둘 다 무시합니다.

   ⚠️⚠️ **"지금 주문할 수 있습니다" 라고 하지 않습니다** (§5-3 ·
   절대 규칙 1 · 5). 제휴 공급사가 0곳이라 지금 할 수 있는 것은
   **요청을 받아 업체를 찾아 드리는 것**까지입니다. 직접 재고를
   매입하거나 물류를 만들지 않습니다 (§5-3 이 직접 그렇게 적었습니다).
   ════════════════════════════════════════════════════════════════════ */

/* ⚠️ `tone` 은 분류색 토큰(`--tn*`)입니다 — 여섯이 서로 달라야 합니다.
   ⚠️ `icon` 은 `icon()` 이 아는 이름만 (js/components/base.js).
      모르는 이름은 **빈 문자열**이라 타일이 덩그러니 빕니다. */
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

/* ══════════════════════════════════════════════════════════════════
   §5-4 — 업종마다 **먼저 보이는 것**이 다릅니다
   ══════════════════════════════════════════════════════════════════
   > "모든 업종에 동일한 상품을 노출하지 않는다."

   ⚠️⚠️ **여기 적는 것은 차례일 뿐 잘라 내는 것이 아닙니다.**
   `amOpsvcFor()` 가 적힌 것을 앞으로 올리고 **나머지는 뒤에 그대로
   붙입니다** — 잘라 내면 그 업종 사장님에게는 그 기능이 **아예 없는
   것**이 됩니다 (`amCatsFor()` 와 같은 규칙입니다).

   ⚠️ 업종 key 는 `industries.js` 의 것입니다. 없는 key 를 적으면
   `build-pages.js` 의 `checkOpsvc()` 가 **빌드를 멈춥니다.**
   ⚠️ 하위 key 도 실제로 있는 것이라야 합니다 — 같은 검사가 봅니다. */
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
  /* ⚠️ `etc`(기타)는 **일부러 비워 두었습니다** — 받는 그릇이라
     거기에 차례를 적으면 어느 사장님에게도 안 맞습니다
     (업종별 글을 `기타`에 안 쓰는 것과 같은 까닭). 비우면
     `amOpsvcFor()` 가 기본 차례(A → F)를 그대로 냅니다. */
};

/* ── 하위 하나를 이름 · 주소까지 풀어 줍니다 ─────────────────────
   ⚠️ 이름을 여기 적지 마세요 — `catalog.js` 에서 가져옵니다.
   ⚠️ 없는 key 면 **null** 을 돌려줍니다 (화면이 그 칸을 뺍니다). */
window.amOpsvcOne = function(it){
  if(!it || !it.cat) return null;
  var c = (window.amCat ? window.amCat(it.cat) : null);
  if(!c) return null;
  var sub = null, L = c.items || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === it.sub){ sub = L[i]; break; }
  if(!sub) return null;
  /* ⚠️ 가는 곳은 **이미 있는 화면**입니다. 업체를 받는 분류는
     업체찾기로, 나머지는 분류 화면으로 — `catTo()` 와 같은 규칙을
     쓰되 하위를 `?s=` 로 좁혀 줍니다. */
  var base = (c.kind === "provider") ? "/providers/" + c.key
           : (c.to ? c.to : "/c/" + c.key);
  var to = (c.kind === "provider") ? base + "?s=" + encodeURIComponent(sub.key) : base;
  return { cat:c, sub:sub, name:sub.name, catName:c.name,
           tone:c.tone || "t7", icon:c.icon, to:to };
};

/* ── 업종에 맞춰 차례를 바꿉니다 (§5-4) ──────────────────────────
   ⚠️⚠️ **잘라 내지 않습니다.** 적힌 것이 앞, 나머지가 뒤입니다. */
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

/* 묶음 하나가 실제로 들고 있는 하위 (없는 key 는 빠집니다) */
window.amOpsvcItems = function(groupKey){
  var g = null, L = window.AM_OPSVC || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === groupKey){ g = L[i]; break; }
  if(!g) return [];
  return (g.items || []).map(window.amOpsvcOne).filter(Boolean);
};

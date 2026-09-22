/* ════════════════════════════════════════════════════════════════════
   주문 — 결제수단 · 금액 · 주문번호

   ⚠️ **금액을 화면에서 받지 않고 여기서 다시 셉니다.** 화면에 찍힌
   값을 그대로 보내면 개발자도구로 고쳐 1원짜리 주문을 만들 수 있습니다.
   서버(api/order.js)에서도 **한 번 더** 세어 대조합니다 — 브라우저에서
   도는 코드는 무엇이든 손님이 고칠 수 있다고 보고 만듭니다.

   ⚠️ 받을 수 없는 결제수단은 화면에 **아예 안 보입니다.** 골랐는데
   안 되는 것이 제일 나쁩니다 (품절·전화번호와 같은 규칙입니다).
   ════════════════════════════════════════════════════════════════════ */

window.WOW_PAY = [
  { key:"bank", name:"무통장입금", desc:"주문 뒤 아래 계좌로 입금해 주세요",
    /* 셋 다 있어야 합니다. 계좌를 모르는 채로 "입금해 주세요" 라고
       하면 손님이 돈을 못 보냅니다. */
    ready:function(){ return !!(bizVal("bankName") && bizVal("bankAccount") && bizVal("bankHolder")); },
    why:"입금 계좌(은행·계좌번호·예금주)가 비어 있습니다 — "+
        "admin.html 의 사업자 정보 탭에서 채우고 site.js 를 내보내세요." },

  { key:"card", name:"카드결제", desc:"국내 모든 카드",
    /* PG 사와 계약하고 clientKey 를 넣기 전에는 카드결제를 내놓지
       않습니다. "카드결제" 를 띄워 놓고 다음 화면에서 못 하면
       그 손님은 돌아오지 않습니다. */
    ready:function(){ return !!(window.WOW_PG && WOW_PG.clientKey && window.wowPayCard); },
    why:"카드결제는 PG 연동이 필요합니다 — CLAUDE.md 의 \"결제를 붙일 때\" 를 보세요." }
];

/* 지금 실제로 받을 수 있는 결제수단만. 못 받는 것은 왜 못 받는지
   **콘솔로만** 알립니다 (손님 화면에 운영자 할 일을 적지 않습니다). */
window.wowPayReady = function(){
  return WOW_PAY.filter(function(m){
    var ok = false;
    try{ ok = m.ready(); }catch(e){ ok = false; }
    if(!ok){ try{ console.warn("[ABOUTMEAT] 결제수단 \""+m.name+"\" 을 못 씁니다 — "+m.why); }catch(e){} }
    return ok;
  });
};

/* 금액 — 화면·서버가 **같은 셈법**을 씁니다.
   ⚠️ 배송비를 여기에 박지 마세요. WOW_BIZ 에서 읽습니다. */
window.wowTotals = function(cart){
  var items = (cart||[]).map(function(c){
    var p = wowProduct(c.id); if(!p) return null;
    var kg = Math.max(0, Number(c.kg)||0);
    if(!kg) return null;
    return { id:p.id, name:p.name, price:p.price, kg:kg, sum:p.price*kg };
  }).filter(Boolean);
  var goods    = items.reduce(function(a,x){ return a + x.sum; }, 0);
  var freeOver = Number(WOW_BIZ.shipFreeOver) || 0;
  var fee      = Number(WOW_BIZ.shipFee) || 0;
  var ship = (!goods || (freeOver && goods >= freeOver)) ? 0 : fee;
  return { items:items, goods:goods, ship:ship, total:goods+ship, freeOver:freeOver };
};

/* 주문번호 — 날짜 + 임의 네 자리.
   전화로 불러 줄 수 있게 짧게 둡니다 ("이공이육공구이이 다시 사칠삼일"). */
window.wowOrderNo = function(){
  var d = new Date(), p = function(n){ return ("0"+n).slice(-2); };
  var r = ("000"+Math.floor(Math.random()*10000)).slice(-4);
  return ""+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+"-"+r;
};

/* ════════════════════════════════════════════════════════════════════
   이 브라우저에서 넣은 주문

   서버도 DB 도 없어서 "내 주문" 을 서버에 물어볼 수 없습니다. 다만
   **이 브라우저에서 넣은 것**은 실제로 알 수 있습니다 — 찜과 같은
   이치입니다 (로그인과 무관하게 이 기기에 저장되므로 아는 것).

   무통장입금은 계좌와 금액을 **나중에 다시 봐야 합니다.** 완료 화면을
   새로고침했더니 사라지면 손님은 얼마를 어디로 보낼지 모르게 됩니다.

   ⚠️ **이름·연락처·주소는 저장하지 않습니다.** 공용 PC·가게 공용
   태블릿에서 다음 사람이 그대로 봅니다. 다시 보여 줄 값어치가 있는
   것(주문번호·날짜·금액·결제수단·품목)만 남깁니다.
   ⚠️ 이것은 "주문 내역" 이 아닙니다. 다른 기기에서 넣은 주문은 여기
   없습니다 — 화면에 **"이 브라우저에서"** 라고 적어야 합니다.
   ════════════════════════════════════════════════════════════════════ */
var WOW_ORD_KEY = "wow.orders", WOW_ORD_MAX = 20;

window.wowOrders = function(){
  try{ return JSON.parse(localStorage.getItem(WOW_ORD_KEY)||"[]") || []; }
  catch(e){ return []; }
};
window.wowOrderSave = function(o){
  var list = wowOrders();
  list.unshift({
    no:o.no, at:o.at || new Date().toISOString(), pay:o.pay, total:o.total,
    items:(o.items||[]).map(function(x){ return { name:x.name, kg:x.kg }; })
  });
  try{ localStorage.setItem(WOW_ORD_KEY, JSON.stringify(list.slice(0, WOW_ORD_MAX))); }catch(e){}
};
window.wowOrderFind = function(no){
  return wowOrders().filter(function(o){ return o.no === String(no); })[0] || null;
};
/* 2026-09-23 처럼 — toLocaleDateString 은 기기 설정에 따라 모양이
   제각각이라 직접 만듭니다 */
window.wowOrderDate = function(iso){
  var d = new Date(iso); if(isNaN(d)) return "";
  var p = function(n){ return ("0"+n).slice(-2); };
  return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());
};

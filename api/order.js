/* ════════════════════════════════════════════════════════════════════
   주문 접수 (Vercel Serverless Function)   POST /api/order

   ── 켜는 방법 ──────────────────────────────────────────
   Vercel → 프로젝트 → Settings → Environment Variables 에서
   **둘 중 하나**를 넣으면 주문이 실제로 전달되기 시작합니다.

   (가) 어디로든 보내기 — 가장 간단합니다
        ORDER_WEBHOOK_URL = https://…   (주문 JSON 을 그대로 POST 합니다)
        Zapier · Make · 구글 앱스스크립트 · 슬랙 워크플로 · 직접 만든
        주소 아무거나 됩니다. 슬랙이면 그대로 채널에 뜹니다.

   (나) 이메일로 받기
        RESEND_API_KEY  = re_…
        ORDER_EMAIL_TO  = 주문받을주소@example.com
        ORDER_EMAIL_FROM= onboarding@resend.dev  (도메인 인증 전 기본값)

   둘 다 안 넣으면 **503 을 돌려줍니다.** 일부러 그렇게 했습니다 —
   받을 곳이 없는데 "접수되었습니다" 라고 하면 손님은 기다리고
   주문은 사라집니다. 화면도 그때는 "지금 접수하지 못했습니다" 라고
   말하고 전화 버튼을 내놓습니다.

   ⚠️ **금액을 손님이 보낸 값으로 믿지 않습니다.** 브라우저에서 도는
   코드는 무엇이든 고칠 수 있으므로, 여기서 상품 id 와 kg 만 받아
   가격표(api/_data.json)로 **다시 셉니다.** 그 파일은
   `node build-pages.js` 가 js/data/*.js 에서 만들어 둡니다 — 값을
   두 군데에 적지 않기 위해서입니다.

   ⚠️ **여기에 주문을 저장하지 않습니다.** 서버도 DB 도 없습니다.
   보내지 못하면 실패로 돌려주고, 화면이 손님에게 전화로 안내합니다.
   성공했다고만 하고 흘려 버리는 것보다 낫습니다.
   ════════════════════════════════════════════════════════════════════ */

const DATA = require("./_data.json");

const MAX_ITEMS = 50;      /* 한 주문에 담을 수 있는 품목 수 */
const MAX_KG    = 9999;    /* 한 품목 최대 수량 */

function bad(res, code, msg){
  res.status(code).json({ error: msg });
}
function clean(s, max){
  return String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max || 200);
}

/* 화면(js/data/order.js 의 wowTotals)과 **같은 셈법**입니다.
   한쪽만 고치면 손님이 본 금액과 받는 금액이 달라집니다. */
function totals(items){
  const out = [];
  let goods = 0;
  for(const it of items){
    const p = DATA.products[String(it && it.id)];
    if(!p) return { error: "없는 상품이 들어 있습니다" };
    if(p.soldOut) return { error: p.name + " 은(는) 품절입니다" };
    const kg = Number(it.kg);
    if(!isFinite(kg) || kg <= 0 || kg > MAX_KG) return { error: p.name + " 의 수량이 올바르지 않습니다" };
    const sum = p.price * kg;
    goods += sum;
    out.push({ id:String(it.id), name:p.name, price:p.price, kg:kg, sum:sum });
  }
  const freeOver = Number(DATA.ship.freeOver) || 0;
  const fee      = Number(DATA.ship.fee) || 0;
  const ship = (!goods || (freeOver && goods >= freeOver)) ? 0 : fee;
  return { items: out, goods: goods, ship: ship, total: goods + ship };
}

function won(n){ return Number(n||0).toLocaleString("ko-KR"); }

function asText(o, t){
  const L = [];
  L.push("주문번호  " + o.no);
  L.push("결제수단  " + (o.pay === "bank" ? "무통장입금" : o.pay === "card" ? "카드결제" : o.pay));
  L.push("");
  L.push("주문자    " + o.buyer.name + "  " + o.buyer.tel + (o.buyer.email ? "  " + o.buyer.email : ""));
  L.push("받는 분   " + o.recv.name + "  " + o.recv.tel);
  L.push("주소      " + o.recv.addr);
  if(o.recv.memo) L.push("요청사항  " + o.recv.memo);
  L.push("");
  for(const x of t.items) L.push("  " + x.name + "  " + x.kg + "kg × " + won(x.price) + "원 = " + won(x.sum) + "원");
  L.push("");
  L.push("상품금액  " + won(t.goods) + "원");
  L.push("배송비    " + (t.ship ? won(t.ship) + "원" : "무료"));
  L.push("합계      " + won(t.total) + "원");
  return L.join("\n");
}

/* 주문을 밖으로 내보냅니다. 하나라도 성공하면 접수된 것으로 봅니다. */
async function deliver(payload, text){
  const hook = process.env.ORDER_WEBHOOK_URL;
  const key  = process.env.RESEND_API_KEY;
  const to   = process.env.ORDER_EMAIL_TO;
  if(!hook && !(key && to)) return { ok:false, why:"nowhere" };

  const errs = [];
  if(hook){
    try{
      const r = await fetch(hook, {
        method:"POST",
        headers:{ "content-type":"application/json" },
        /* 슬랙 · 구글챗처럼 text 만 읽는 곳도 있어서 같이 넣습니다 */
        body: JSON.stringify(Object.assign({ text: text }, payload))
      });
      if(r.ok) return { ok:true };
      errs.push("webhook " + r.status);
    }catch(e){ errs.push("webhook " + (e && e.message)); }
  }
  if(key && to){
    try{
      const r = await fetch("https://api.resend.com/emails", {
        method:"POST",
        headers:{ "content-type":"application/json", authorization:"Bearer " + key },
        body: JSON.stringify({
          from: process.env.ORDER_EMAIL_FROM || "onboarding@resend.dev",
          to: to.split(",").map(s => s.trim()).filter(Boolean),
          subject: "[주문] " + payload.no + " · " + payload.buyer.name + " · " + won(payload.total) + "원",
          text: text
        })
      });
      if(r.ok) return { ok:true };
      errs.push("resend " + r.status + " " + (await r.text().catch(()=> "")).slice(0,200));
    }catch(e){ errs.push("resend " + (e && e.message)); }
  }
  return { ok:false, why: errs.join(" / ") || "unknown" };
}

module.exports = async function handler(req, res){
  if(req.method !== "POST"){
    res.setHeader("Allow", "POST");
    return bad(res, 405, "POST 로 보내 주세요");
  }

  let b = req.body;
  if(typeof b === "string"){ try{ b = JSON.parse(b); }catch(e){ b = null; } }
  if(!b || typeof b !== "object") return bad(res, 400, "주문 내용을 읽지 못했습니다");

  const items = Array.isArray(b.items) ? b.items.slice(0, MAX_ITEMS) : [];
  if(!items.length) return bad(res, 400, "주문할 상품이 없습니다");

  const t = totals(items);
  if(t.error) return bad(res, 400, t.error);

  const buyer = b.buyer || {}, recv = b.recv || {};
  const order = {
    no:   clean(b.no, 32) || (Date.now() + ""),
    pay:  (b.pay === "card" ? "card" : "bank"),
    buyer:{ name:clean(buyer.name, 40), tel:clean(buyer.tel, 30), email:clean(buyer.email, 120) },
    recv: { name:clean(recv.name, 40) || clean(buyer.name, 40),
            tel: clean(recv.tel, 30)  || clean(buyer.tel, 30),
            addr:clean(recv.addr, 300), memo:clean(recv.memo, 300) },
    items:t.items, goods:t.goods, ship:t.ship, total:t.total,
    at:   new Date().toISOString()
  };

  if(!order.buyer.name || !order.buyer.tel) return bad(res, 400, "주문하시는 분의 이름과 연락처를 적어 주세요");
  if(!order.recv.addr) return bad(res, 400, "받으실 주소를 적어 주세요");

  const sent = await deliver(order, asText(order, t));
  if(!sent.ok){
    /* 운영자에게 할 말은 로그로. 손님에게는 화면이 "지금 접수하지
       못했습니다" 까지만 말하고 전화 버튼을 내놓습니다. */
    console.error("[ABOUTMEAT] 주문을 전달하지 못했습니다 (" + sent.why + "). " +
      (sent.why === "nowhere"
        ? "Vercel 환경변수에 ORDER_WEBHOOK_URL 또는 RESEND_API_KEY·ORDER_EMAIL_TO 를 넣으세요."
        : "받는 쪽 주소와 키를 확인하세요."));
    return bad(res, 503, "지금 주문을 접수하지 못했습니다");
  }

  res.status(200).json({ no: order.no, total: order.total });
};

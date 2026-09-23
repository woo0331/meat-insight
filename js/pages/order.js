/* ════════════════════════════════════════════════════════════════════
   주문서 · 주문 완료

   흐름: 장바구니 → /order (주문서) → 접수 → /order/done (완료)

   ⚠️ **전자상거래법상 구매 전에 반드시 보여 줘야 하는 것**이 있습니다 —
   청약철회가 제한된다는 사실(신선식품), 반송비 부담자, 하자·오배송은
   그대로 철회된다는 것. "구매조건 확인" 동의를 따로 받는 이유입니다.
   이 동의를 빼면 나중에 청약철회 제한을 주장할 수 없습니다
   (이용약관 제15조와 문구가 어긋나지 않게 같이 고치세요).

   ⚠️ 받을 수 있는 결제수단이 하나도 없으면 **폼을 아예 내지 않습니다.**
   다 적고 눌렀더니 안 되는 것이 제일 나쁩니다 (견적 문의와 같은 규칙).
   ════════════════════════════════════════════════════════════════════ */

var OD = { pay:null, sending:false, done:null };

function PageOrder(){
  var t = wowTotals(CART);
  var crumbs = Breadcrumb([["홈","/"],["장바구니","/cart"],["주문서",""]]);

  if(!t.items.length){
    return crumbs+'<div class="w"><div class="empty">'+
      '<div class="empty-t">주문할 상품이 없습니다</div>'+
      '<div class="empty-d">장바구니에 담으신 뒤 주문해 주세요.</div>'+
      '<a class="btn btn-g btn-lg" href="/products">전체상품 보기</a></div></div>';
  }

  var pays = wowPayReady();
  if(!pays.length) return crumbs+odClosed(t);
  if(!OD.pay || !pays.some(function(m){ return m.key===OD.pay; })) OD.pay = pays[0].key;

  return crumbs+
  '<div class="w od"><h1 class="pg-h1">주문서</h1>'+
    '<form id="od-form" onsubmit="return submitOrder(event)">'+
    '<div class="od-cols"><div class="od-l">'+

      '<section class="od-s"><h2>주문 상품</h2>'+
        t.items.map(function(x){
          var p = wowProduct(x.id);
          return '<div class="od-i">'+
            '<div class="od-i-img">'+imgTag(p.img, p.name)+'</div>'+
            '<div class="od-i-b"><b>'+esc(p.name)+'</b>'+
              '<span>'+esc([p.origin, WOW_TEMP[p.temp], WOW_TRIM[p.trim]].filter(Boolean).join(" · "))+'</span>'+
              '<span>'+x.kg+'kg × '+wowWon(x.price)+'원/kg</span></div>'+
            '<div class="od-i-p">'+wowWon(x.sum)+'원</div></div>';
        }).join("")+
      '</section>'+

      '<section class="od-s"><h2>주문하시는 분</h2>'+
        '<div class="od-g2">'+
          ofld("이름","o-name","text",true,"","name")+
          ofld("연락처","o-tel","tel",true,"010-0000-0000","tel")+
        '</div>'+
        ofld("이메일","o-email","email",false,"주문 확인 메일을 받으실 주소","email")+
      '</section>'+

      '<section class="od-s"><h2>받는 곳</h2>'+
        '<label class="od-same"><input type="checkbox" id="o-same" checked onchange="odSame(this)">'+
          '<span>주문하시는 분과 같습니다</span></label>'+
        '<div id="o-recv" hidden>'+
          '<div class="od-g2">'+
            ofld("받는 분","o-rname","text",false,"")+
            ofld("연락처","o-rtel","tel",false,"010-0000-0000")+
          '</div>'+
        '</div>'+
        ofld("주소","o-addr","text",true,"도로명 주소와 상세 주소를 함께 적어 주세요","street-address")+
        '<div class="f-r"><label for="o-memo">배송 요청사항</label>'+
          '<textarea id="o-memo" rows="2" placeholder="예: 부재 시 경비실에 맡겨 주세요"></textarea></div>'+
        ShipNote("ship-order")+
      '</section>'+

      '<section class="od-s"><h2>결제수단</h2>'+ odPay(pays) +'</section>'+

    '</div>'+

    '<aside class="od-r"><div class="od-sum">'+
      '<h2>결제 금액</h2>'+
      '<div class="cs-r"><span>상품금액</span><b>'+wowWon(t.goods)+'원</b></div>'+
      '<div class="cs-r"><span>배송비</span><b>'+(t.ship?wowWon(t.ship)+'원':'무료')+'</b></div>'+
      '<div class="cs-t"><span>총 결제금액</span><b>'+wowWon(t.total)+'원</b></div>'+

      /* ── 구매 전 고지 (전자상거래법 제17조 제2항) ───────── */
      '<fieldset class="agree od-agree"><legend>구매조건 확인</legend>'+
        '<ul class="od-why">'+
          '<li>축산 부산물은 <b>냉장·냉동 신선식품</b>입니다. 포장을 개봉해 냉장이 '+
            '해제되거나, 요청에 따라 추가 가공한 경우에는 <b>청약철회가 제한</b>됩니다.</li>'+
          '<li>상품에 하자가 있거나 주문과 다른 것이 왔을 때는 <b>그대로 교환·환불</b>됩니다.</li>'+
          '<li>단순 변심으로 반품하실 때는 <b>반송비를 부담</b>하셔야 합니다.</li>'+
        '</ul>'+
        '<label class="ag-r"><input type="checkbox" id="o-agree" required>'+
          '<span>위 내용을 확인했습니다 <em class="ag-req">(필수)</em></span>'+
          '<a class="ag-v" href="/terms">약관 보기</a></label>'+
      '</fieldset>'+

      /* ── 개인정보 수집·이용 (제15조 제2항) ──────────────── */
      '<fieldset class="agree od-agree"><legend>개인정보 수집·이용 동의</legend>'+
        '<ul class="ag-why">'+
          '<li><span>수집 항목</span><b>주문자 성명·연락처 (선택: 이메일), 받는 분 성명·연락처·주소</b></li>'+
          '<li><span>이용 목적</span><b>주문 처리 · 배송 · 문의 응대</b></li>'+
          '<li><span>보유 기간</span><b>공급 완료 및 정산 완료 시까지 (관계 법령에 따른 보관 기간 제외)</b></li>'+
        '</ul>'+
        '<label class="ag-r"><input type="checkbox" id="o-priv" required>'+
          '<span>위 내용에 동의합니다 <em class="ag-req">(필수)</em></span>'+
          '<a class="ag-v" href="/privacy">방침 보기</a></label>'+
        '<p class="ag-no">동의를 거부하실 수 있으며, 이 경우 주문이 접수되지 않습니다'+
          (bizVal("phone") ? ' — 전화로는 그대로 주문하실 수 있습니다.' : '.')+'</p>'+
      '</fieldset>'+

      '<button class="btn btn-g btn-lg btn-full" type="submit" id="o-go">'+
        wowWon(t.total)+'원 주문하기</button>'+
      CallButton("btn btn-full cart-call", "전화로 주문하기")+
    '</div></aside>'+
    '</div></form>'+
  '</div>';
}

/* 받을 수 있는 결제수단이 없을 때 — 폼 대신 갈 길을 냅니다 */
function odClosed(t){
  var phone = bizVal("phone");
  return '<div class="w od"><h1 class="pg-h1">주문서</h1>'+
    '<div class="notice"><b>지금은 이곳에서 주문을 받지 못합니다.</b>'+
      (phone ? '<span>전화로 주문하시면 바로 도와드립니다. '+
        '담으신 '+t.items.length+'개 상품(총 '+wowWon(t.total)+'원)을 말씀해 주세요.</span>'
             : '<span>결제 준비가 끝나는 대로 이곳에서 바로 주문하실 수 있습니다.</span>')+
      '<div class="notice-acts">'+
        CallButton("btn", "전화로 주문")+
        '<a class="btn" href="/b2b/quote">대량견적 문의</a>'+
        '<a class="btn" href="/cart">장바구니로</a>'+
      '</div></div>'+
    '<div class="od-list">'+t.items.map(function(x){
      var p = wowProduct(x.id);
      return '<div class="od-i"><div class="od-i-img">'+imgTag(p.img, p.name)+'</div>'+
        '<div class="od-i-b"><b>'+esc(p.name)+'</b>'+
        '<span>'+x.kg+'kg × '+wowWon(x.price)+'원/kg</span></div>'+
        '<div class="od-i-p">'+wowWon(x.sum)+'원</div></div>'; }).join("")+
    '</div></div>';
}

function ofld(label,id,type,req,ph,ac){
  return '<div class="f-r"><label for="'+id+'">'+esc(label)+(req?' <b>*</b>':'')+'</label>'+
    '<input id="'+id+'" type="'+type+'"'+(req?" required":"")+
    (ph?' placeholder="'+esc(ph)+'"':'')+
    ' autocomplete="'+esc(ac||"off")+'"></div>';
}

function odPay(pays){
  return '<div class="od-pays">'+pays.map(function(m){
      return '<label class="od-pay'+(OD.pay===m.key?" on":"")+'">'+
        '<input type="radio" name="pay" value="'+esc(m.key)+'"'+(OD.pay===m.key?" checked":"")+
          ' onchange="odPayPick(\''+esc(m.key)+'\')">'+
        '<span><b>'+esc(m.name)+'</b><em>'+esc(m.desc)+'</em></span></label>';
    }).join("")+'</div>'+
    (OD.pay==="bank" ? odBank(null) : '')+
    (OD.pay==="card" ? '<p class="ag-no">다음 화면에서 카드 정보를 넣으시게 됩니다.</p>' : '');
}

/* 입금 계좌. sum 이 있으면 금액까지 같이 적습니다 (완료 화면)

   ⚠️ **계좌가 비면 "예금주" 라벨만 남습니다.** 자리표시자를 찍지 않는다는
   규칙이 여기에도 걸립니다. 주문할 때는 계좌가 있어야 무통장입금이
   나오므로 빈 일이 없지만, **주문한 뒤에 계좌를 바꾸거나 지우면**
   손님이 나중에 다시 연 완료 화면이 그렇게 됩니다.
   그때는 계좌 줄을 통째로 빼고 어디에 물어볼지를 냅니다. */
function odBank(sum){
  var bank = bizVal("bankName"), acct = bizVal("bankAccount"), who = bizVal("bankHolder");
  var have = bank && acct && who;
  if(!have){
    try{ console.warn("[ABOUTMEAT] 입금 계좌가 비어 있어 완료 화면에 계좌를 내지 못했습니다 — "+
      "admin.html 의 사업자 정보 탭에서 bankName · bankAccount · bankHolder 를 채우세요."); }catch(e){}
  }
  return '<div class="od-bank'+(sum!=null?" od-bank-big":"")+'">'+
    '<b>'+(have ? (sum!=null?'아래 계좌로 입금해 주세요':'입금 계좌')
                : '입금 계좌를 확인해 주세요')+'</b>'+
    (have ? '<div class="od-acct">'+esc(bank)+' '+esc(acct)+
              ' <span>예금주 '+esc(who)+'</span></div>' : '')+
    (sum!=null ? '<div class="od-amt">'+wowWon(sum)+'원</div>' : '')+
    (have ? '<p>주문 뒤 <b>2일 안에</b> 입금해 주세요. 입금이 확인되면 작업에 들어갑니다.</p>'
          : '<p>입금하실 계좌는 '+(bizVal("phone") ? '아래 번호로 문의해 주세요.' : '주문하실 때 안내해 드린 계좌를 확인해 주세요.')+'</p>'+
            CallButton("btn","계좌 문의"))+
  '</div>';
}

window.odSame = function(el){ var r=$("o-recv"); if(r) r.hidden = el.checked; };
window.odPayPick = function(k){ OD.pay=k; RT.keepScroll=true; render(); };

/* ── 접수 ───────────────────────────────────────────────── */
window.submitOrder = function(ev){
  ev.preventDefault();
  if(OD.sending) return false;

  /* ⚠️ 동의 확인을 지우지 마세요. 결제를 붙일 때도 이 줄이 남아
     있어야 합니다 — 구매조건 고지 없이 받은 주문은 청약철회 제한을
     주장할 수 없고, 동의 없이 받은 개인정보는 제15조 위반입니다. */
  if(!odChecked("o-agree", "구매 조건을 확인해 주셔야 주문하실 수 있습니다.")) return false;
  if(!odChecked("o-priv",  "개인정보 수집·이용에 동의해 주세요.")) return false;

  /* ⚠️ 금액은 **화면에서 읽지 않고 다시 셉니다.** 서버에서도 한 번 더 셉니다. */
  var t = wowTotals(CART);
  if(!t.items.length){ toast("주문할 상품이 없습니다."); return false; }

  var same = $("o-same").checked;
  var order = {
    no: wowOrderNo(), pay: OD.pay,
    buyer:{ name:odVal("o-name"), tel:odVal("o-tel"), email:odVal("o-email") },
    recv: { name: same?odVal("o-name"):odVal("o-rname"),
            tel:  same?odVal("o-tel") :odVal("o-rtel"),
            addr: odVal("o-addr"), memo: odVal("o-memo") },
    items: t.items.map(function(x){ return { id:x.id, kg:x.kg }; }),
    at: new Date().toISOString()
  };

  OD.sending = true;
  var btn = $("o-go");
  if(btn){ btn.disabled = true; btn.textContent = "접수하는 중…"; }

  sendOrder(order).then(function(res){
    var done = { no:(res && res.no) || order.no, pay:order.pay, buyer:order.buyer,
                 total:(res && res.total!=null) ? res.total : t.total };
    OD.done = done;
    /* ⚠️ **이 브라우저에** 남깁니다. 무통장입금은 계좌와 금액을 나중에
       다시 봐야 하는데, 완료 화면은 새로고침하면 사라집니다.
       이름·연락처·주소는 넣지 않습니다 (js/data/order.js 의 설명). */
    wowOrderSave({ no:done.no, at:order.at, pay:done.pay, total:done.total, items:t.items });
    CART.length = 0; save(); paintCartN();
    go("/order/done?no="+encodeURIComponent(done.no));
  }).catch(function(err){
    OD.sending = false;
    if(btn){ btn.disabled=false; btn.textContent = wowWon(t.total)+"원 주문하기"; }
    /* ⚠️ 손님에게 운영자 할 일을 말하지 않습니다 — 콘솔로 갑니다. */
    try{ console.warn("[ABOUTMEAT] 주문 접수 실패 — "+((err && err.message) || err)+
      ". api/order.js 가 올라가 있는지, ORDER_WEBHOOK_URL 또는 "+
      "RESEND_API_KEY·ORDER_EMAIL_TO 가 설정되어 있는지 확인하세요."); }catch(e){}
    toast(bizVal("phone")
      ? "지금 주문을 접수하지 못했습니다. 잠시 뒤 다시 하시거나 전화로 주문해 주세요."
      : "지금 주문을 접수하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
  });
  return false;
};

function odChecked(id, msg){
  var el = $(id);
  if(el && !el.checked){
    toast(msg);
    try{ el.closest(".ag-r").classList.add("ag-miss");
         el.focus({preventScroll:true});
         el.closest("fieldset").scrollIntoView({behavior:"smooth", block:"center"}); }catch(e){}
    return false;
  }
  return true;
}
function odVal(id){ var e=$(id); return e ? String(e.value||"").trim() : ""; }

function sendOrder(order){
  return fetch("/api/order", {
    method:"POST", headers:{ "content-type":"application/json" },
    body: JSON.stringify(order)
  }).then(function(r){
    return r.json().catch(function(){ return {}; }).then(function(j){
      if(!r.ok) throw new Error((j && j.error) || ("HTTP "+r.status));
      return j;
    });
  });
}

/* ── 주문 완료 ──────────────────────────────────────────── */
function PageOrderDone(){
  /* 새로고침해도 보이게 — 주소의 ?no= 로 이 브라우저에 남긴 기록을
     찾습니다. 방금 넣은 주문(OD.done)에는 입금자명까지 있습니다. */
  var no = nowQS("no");
  var kept = no ? wowOrderFind(no) : null;
  var fresh = (OD.done && (!no || OD.done.no === no)) ? OD.done : null;
  var o = fresh || (kept ? { no:kept.no, pay:kept.pay, total:kept.total, buyer:{} } : null);

  if(!o){
    return '<div class="w"><div class="empty">'+
      '<div class="empty-t">주문 내역을 여기서는 확인할 수 없습니다</div>'+
      '<div class="empty-d">다른 기기나 다른 브라우저에서 넣으신 주문은 이곳에 없습니다. '+
        '접수된 주문은 등록하신 연락처로 안내해 드립니다.</div>'+
      '<div class="empty-acts"><a class="btn btn-g" href="/products">전체상품 보기</a>'+
        CallButton("btn","전화로 문의")+'</div></div></div>';
  }
  return '<div class="w od-done">'+
    '<div class="od-done-ic">'+icon("check",34)+'</div>'+
    '<h1>주문이 접수되었습니다</h1>'+
    '<p class="od-no-t">주문번호 <b>'+esc(o.no)+'</b></p>'+
    (o.pay==="bank" ? odBank(o.total)
      : '<div class="od-bank od-bank-big"><b>결제가 완료되었습니다</b>'+
        '<div class="od-amt">'+wowWon(o.total)+'원</div></div>')+
    (o.pay==="bank" && o.buyer.name
      ? '<p class="od-done-n">입금자명을 <b>'+esc(o.buyer.name)+'</b> 으로 해 주시면 확인이 빠릅니다.</p>' : '')+
    (o.buyer.tel ? '<p class="od-done-n">주문 내역과 배송 안내는 <b>'+esc(o.buyer.tel)+'</b> 으로 알려 드립니다.'+
      (o.buyer.email ? ' 확인 메일도 함께 보내 드립니다.' : '')+'</p>' : '')+
    (bizVal("shipNote") ? '<p class="od-done-n">'+esc(bizVal("shipNote"))+'</p>' : '')+
    (kept && kept.items && kept.items.length
      ? '<div class="od-list od-done-list">'+kept.items.map(function(x){
          return '<div class="od-i"><div class="od-i-b"><b>'+esc(x.name)+'</b></div>'+
            '<div class="od-i-p">'+x.kg+'kg</div></div>'; }).join("")+'</div>' : '')+
    /* ⚠️ 취소하는 길이 없으면 손님은 입금해 놓고 전화로 찾아다닙니다.
       화면에서 취소를 받을 수 없으니(서버도 DB 도 없습니다) **어디로
       연락하면 되는지**를 적습니다. 번호가 없으면 그 줄을 뺍니다. */
    (bizVal("phone")
      ? '<p class="od-done-n">주문을 <b>취소·변경</b>하시려면 '+
        (o.pay==="bank" ? '입금 전에 ' : '')+'아래 번호로 연락해 주세요.</p>'
      : '')+
    '<p class="od-done-n od-keep">이 화면은 <b>이 브라우저</b>에 남겨 두었습니다. '+
      '마이페이지에서 다시 보실 수 있습니다.</p>'+
    '<div class="empty-acts">'+
      '<a class="btn btn-g btn-lg" href="/products">계속 둘러보기</a>'+
      CallButton("btn btn-lg","문의하기")+
    '</div></div>';
}


/* ════════════════════════════════════════════════════════════════════
   PHASE 3 — 기존 화면 연결
   ════════════════════════════════════════════════════════════════════ */

/* 신규 페이지 */
var P3_PAGES=["chats","chat","prefs","verify","order","instant"];
function injectPages3(){
  var nav=document.querySelector(".bnav");
  P3_PAGES.forEach(function(id){
    if($("pg-"+id)) return;
    var d=document.createElement("div");
    d.className="pg"; d.id="pg-"+id;
    d.style.cssText="padding-top:var(--top-pad);padding-bottom:56px;";
    d.innerHTML='<div class="gp'+(id==="chat"?" gp-chat":"")+'" id="'+id+'-body"></div>';
    if(nav) document.body.insertBefore(d, nav); else document.body.appendChild(d);
  });
  if(typeof PGS!=="undefined") P3_PAGES.forEach(function(id){ if(PGS.indexOf(id)<0) PGS.push(id); });
  if(typeof TM!=="undefined"){ TM.chats="my"; TM.chat="my"; TM.prefs="my"; TM.verify="my"; TM.order="my"; TM.instant="reqs"; }
}

/* ── 견적 카드에 채팅·시세 비교·신뢰지표 추가 ── */
function patchQuoteCards(){
  var origRender=window.renderQuotes;
  /* renderQuotes 는 내부 함수라 직접 못 바꾸므로, 요청 상세 렌더 후 DOM 을 보강합니다 */
  var origOpen=window.gOpenRequest;
  window.gOpenRequest=async function(id){
    await origOpen(id);
    enhanceQuotes();
  };
  var origSort=window.gSortQuotes;
  window.gSortQuotes=function(){ origSort(); setTimeout(enhanceQuotes,0); };
}
function enhanceQuotes(){
  var wrap=$("q-list"); if(!wrap || !CUR.req) return;
  var ref=marketFor(CUR.req);
  var cards=wrap.querySelectorAll(".qc");
  var qs=(CUR.quotes||[]);
  cards.forEach(function(card){
    var nm=(card.querySelector(".qc-nm")||{}).textContent||"";
    var q=qs.find(function(x){ return (x.supplier_name||"")===nm.trim(); });
    if(!q || card.querySelector(".qc-x")) return;
    var s=CUR.supMap[String(q.supplier_id)]||null;

    /* 신뢰 지표 */
    var rt=respText(s);
    if(rt){
      var spec=card.querySelector(".qc-spec");
      if(spec){ var d=document.createElement("div"); d.className="qc-sr qc-x";
        d.innerHTML='<span class="qc-sk">응답률</span><span class="qc-sv">'+esc(rt)+'</span>'; spec.appendChild(d); }
    }
    /* 시세 대비 */
    var up=num(q.unit_price)!=null?num(q.unit_price):null;
    if(up!=null && ref){
      var diff=marketDiff(up, ref);
      if(diff){
        var cls=diff.pct<0?"gb-ok":(diff.pct>0?"gb-rd":"gb-gy");
        var txt=(diff.pct>0?"+":"")+diff.pct+"% (시세 "+won(Number(ref.price))+esc(ref.unit||"")+")";
        var price=card.querySelector(".qc-price");
        if(price){ var m=document.createElement("div"); m.className="qc-x";
          m.style.cssText="margin-top:4px;"; m.innerHTML='<span class="gbadge '+cls+'">시세 대비 '+txt+'</span>';
          price.parentNode.insertBefore(m, price.nextSibling); }
      }
    }
    /* 채팅 버튼 */
    var act=card.querySelector(".qc-act");
    if(act && !act.querySelector(".qc-chat")){
      var b=document.createElement("button");
      b.className="gbtn gbtn-w gbtn-sm qc-chat qc-x";
      b.textContent="채팅";
      b.onclick=function(ev){
        ev.stopPropagation();
        window.gStartChat({ requestId:CUR.req.id, quoteId:q.id, supplierId:q.supplier_id,
          supplierUserId:q.user_id, supplierName:q.supplier_name,
          buyerUserId:CUR.req.user_id, buyerName:CUR.req.buyer_name,
          firstMessage:"'"+(CUR.req.title||CUR.req.category)+"' 건으로 대화를 시작했습니다." });
      };
      act.insertBefore(b, act.firstChild);
    }
  });
}

/* ── 견적 폼에 단가 × 수량 구조화 입력 추가 ── */
function patchQuoteForm(){
  var orig=window.gOpenQuoteForm;
  window.gOpenQuoteForm=function(){
    orig();
    var priceLabel=document.querySelector('#quote-body .gcard-t');
    var unitSel=$("q-unit"); if(!unitSel) return;
    var box=unitSel.closest(".gcard"); if(!box || $("q-unitprice")) return;
    var ref=marketFor(CUR.req);
    var block=document.createElement("div");
    block.innerHTML=
      '<div class="grow keep">'+
        '<div><label class="glabel">단가</label><input class="gin" id="q-unitprice" inputmode="numeric" placeholder="'+(ref?won(Number(ref.price)):"65,000")+'" oninput="gNumFmt(this);gCalcTotal()"></div>'+
        '<div><label class="glabel">수량</label><input class="gin" id="q-qty" inputmode="numeric" placeholder="300" oninput="gCalcTotal()"></div>'+
        '<div><label class="glabel">단위</label><select class="gin" id="q-qtyunit" onchange="gCalcTotal()"><option>kg</option><option>두</option><option>톤</option><option>회</option><option>건</option></select></div>'+
      '</div>'+
      (ref?'<div class="ghint">참고 시세: '+esc(ref.item)+' '+won(Number(ref.price))+esc(ref.unit||"")+' ('+esc(String(ref.price_date||""))+')</div>':'')+
      '<div class="ghint" id="q-calc" style="margin-top:8px;"></div>';
    box.insertBefore(block, unitSel.closest("div").parentNode);
    window.gCalcTotal();
  };
  var origSubmit=window.gSubmitQuote;
  window.gSubmitQuote=async function(){
    /* 구조화 값이 있으면 총액을 자동으로 채웁니다 */
    var up=num((($("q-unitprice")||{}).value)||""), qty=num((($("q-qty")||{}).value)||"");
    if(up!=null && qty!=null && $("q-price") && !num($("q-price").value)){
      $("q-price").value=Math.round(up*qty).toLocaleString("ko-KR");
    }
    G._quoteExtra={ unit_price:up, qty:qty, qty_unit:(($("q-qtyunit")||{}).value)||null,
      total_amount:(up!=null&&qty!=null)?Math.round(up*qty):num((($("q-price")||{}).value)||""),
      market_ref: (function(){ var r=marketFor(CUR.req); return r?Number(r.price):null; })() };
    await origSubmit();
  };
}
window.gCalcTotal=function(){
  var up=num((($("q-unitprice")||{}).value)||""), qty=num((($("q-qty")||{}).value)||"");
  var el=$("q-calc"); if(!el) return;
  if(up==null||qty==null){ el.textContent=""; return; }
  var total=Math.round(up*qty);
  el.innerHTML='총액 <b style="color:var(--gn);">'+won(total)+'원</b> = '+won(up)+' × '+won(qty);
  var p=$("q-price"); if(p) p.value=total.toLocaleString("ko-KR");
};

/* insertSafe 로 견적을 넣을 때 구조화 필드를 함께 저장 */
function patchQuoteInsert(){
  var orig=G.insertSafe;
  G.insertSafe=async function(table, payload){
    if(table==="quotes" && G._quoteExtra){
      payload=Object.assign({}, payload, G._quoteExtra);
      G._quoteExtra=null;
    }
    return orig(table, payload);
  };
  insertSafe=G.insertSafe;
}

/* ── 요청 등록 후 매칭 알림 + 바로견적 추천 ── */
function patchSubmitRequest(){
  var orig=window.gSubmitRequest;
  window.gSubmitRequest=async function(){
    var before=(await selectSafe("purchase_requests", function(q){ return q.order("created_at",{ascending:false}).limit(1); })).data||[];
    await orig();
    var after=(await selectSafe("purchase_requests", function(q){ return q.order("created_at",{ascending:false}).limit(1); })).data||[];
    var req=after[0];
    if(!req || (before[0] && String(before[0].id)===String(req.id))) return;
    var n=await fanoutRequest(req);
    if(n) toast("조건에 맞는 업체 "+n+"곳에 요청이 전달되었습니다.","ok");
    var picks=await instantMatches(req, 6);
    if(picks.length) showInstant(req, picks, n);
  };
}
function showInstant(req, picks, notified){
  if(typeof go==="function") go("instant");
  var body=$("instant-body"); if(!body) return;
  body.innerHTML=
    '<div class="gp-hd"><div><div class="gp-title">요청이 등록되었습니다</div>'+
      '<div class="gp-sub">'+esc(req.title||req.category)+(notified?(' · 업체 '+notified+'곳에 알림 발송'):'')+'</div></div></div>'+
    '<div class="gcard" style="background:var(--gnl);border-color:var(--gnb);">'+
      '<div style="font-size:15px;font-weight:800;color:var(--ink);margin-bottom:6px;">바로견적 — 조건이 맞는 업체</div>'+
      '<div style="font-size:13px;color:var(--ink3);line-height:1.6;">아래 업체에 먼저 요청이 전달되었습니다. 급하시면 바로 채팅으로 문의하세요.</div></div>'+
    '<div class="rlist">'+picks.map(function(s){
      return '<div class="ritem">'+
        '<div class="ritem-top">'+trustBadges(s)+(s.instant_quote?'<span class="gbadge gb-bl">바로견적</span>':'')+
          '<span style="font-size:12px;color:var(--ink4);margin-left:auto;">'+esc(respText(s)||"")+'</span></div>'+
        '<div class="ritem-t">'+esc(s.name)+'</div>'+
        '<div class="ritem-m"><span>📍 '+esc(s.region||"")+'</span>'+
          (s.rating?'<span class="qstar">★ '+Number(s.rating).toFixed(1)+'</span>':'<span>신규</span>')+
          '<span>거래 '+(s.deal_count||0)+'건</span></div>'+
        (s.instant_note?'<div style="font-size:12.5px;color:var(--ink3);margin-top:8px;">'+esc(s.instant_note)+'</div>':'')+
        '<div class="ritem-f"><button class="gbtn gbtn-w gbtn-sm" onclick="curSID=\''+esc(s.id)+'\';go(&quot;sp&quot;)">업체 보기</button>'+
        '<button class="gbtn gbtn-p gbtn-sm" onclick="gStartChat({requestId:\''+esc(req.id)+'\',supplierId:\''+esc(s.id)+'\',supplierUserId:'+(s.user_id?"'"+esc(s.user_id)+"'":"null")+',supplierName:\''+esc(s.name)+'\',buyerUserId:'+(req.user_id?"'"+esc(req.user_id)+"'":"null")+',buyerName:\''+esc(req.buyer_name||"")+'\',firstMessage:\'요청 건으로 문의드립니다.\'})">바로 문의</button></div>'+
        '</div>';
    }).join("")+'</div>'+
    '<div class="grow keep" style="margin-top:16px;">'+
      '<button class="gbtn gbtn-w" onclick="go(&quot;my&quot;)">거래관리로</button>'+
      '<button class="gbtn gbtn-p" onclick="gOpenRequest(\''+esc(req.id)+'\')">내 요청 보기</button></div>';
  window.scrollTo(0,0);
}

/* ── 견적 선택 시 거래 생성 ── */
function patchSelectQuote(){
  var orig=window.gSelectQuote;
  window.gSelectQuote=async function(id){
    var q=(CUR.quotes||[]).find(function(x){ return String(x.id)===String(id); });
    await orig(id);
    if(q && CUR.req) {
      var o=await createOrder(CUR.req, q);
      if(o) toast("거래가 시작되었습니다. 거래관리에서 진행 상태를 관리하세요.","ok");
    }
  };
}

/* ── 업체 상세에 채팅·신뢰지표 ── */
function patchSupplierDetail(){
  var orig=window.renderSP;
  window.renderSP=async function(id){
    await orig(id);
    var s=SD.sup; if(!s) return;
    var cta=document.querySelector("#sp-body .sd-cta");
    if(cta && !cta.querySelector(".sd-chat")){
      var b=document.createElement("button");
      b.className="gbtn gbtn-w sd-chat"; b.style.flex="1"; b.textContent="채팅 문의";
      b.onclick=function(){ window.gStartChat({ requestId:"", supplierId:s.id, supplierUserId:s.user_id,
        supplierName:s.name, buyerUserId:ME.user?ME.user.id:null, buyerName:ME.name,
        firstMessage:s.name+"에 문의드립니다." }); };
      cta.insertBefore(b, cta.children[1]||null);
    }
    var certs=document.querySelector("#sp-body .sd-certs");
    if(certs && !certs.querySelector(".sd-permit")){
      var d=document.createElement("div");
      d.className="sd-cert sd-permit"+(s.livestock_permit?"":" off");
      d.textContent=(s.livestock_permit?"✓":"·")+" 축산물 영업허가";
      certs.appendChild(d);
    }
    var rt=respText(s);
    if(rt){
      var stats=document.querySelector("#sp-body .sd-stats");
      if(stats && stats.children.length<5){
        var e=document.createElement("div"); e.className="sd-si";
        e.innerHTML='<div class="sd-sv">'+esc((s.response_rate!=null?s.response_rate+"%":"—"))+'</div><div class="sd-sl">응답률</div>';
        stats.appendChild(e);
      }
    }
  };
}

/* ── 거래관리 탭 확장: 채팅 · 거래 · 알림설정 · 인증 ── */
function patchMyTabs(){
  if(typeof MY_TABS==="undefined") return;
  var extra=[["chat","채팅"],["order","거래 진행"]];
  extra.forEach(function(t,i){ if(!MY_TABS.some(function(x){ return x[0]===t[0]; })) MY_TABS.splice(5+i,0,t); });
  var origPanel=renderMyPanel;
  renderMyPanel=function(){
    var t=MY.tab, el=$("my-panel");
    if(t==="chat"){
      if(!el) return;
      el.innerHTML = SCHEMA.chat_rooms===false ? setupNote("채팅","phase3_schema.sql")
        : (CHAT.rooms.length ? '<div class="rlist">'+CHAT.rooms.map(function(r){
            var iAmBuyer=String(r.buyer_user_id||"")===String(ME.user.id);
            return '<div class="ritem" onclick="gOpenChat(\''+r.id+'\')">'+
              '<div class="ritem-top"><span class="gbadge '+(iAmBuyer?"gb-or":"gb-bl")+'">'+(iAmBuyer?"내 요청":"받은 요청")+'</span>'+
              (r._unread?'<span class="gbadge gb-rd">'+r._unread+'</span>':'')+
              '<span style="font-size:12px;color:var(--ink4);margin-left:auto;">'+ago(r.last_at)+'</span></div>'+
              '<div class="ritem-t">'+esc(iAmBuyer?(r.supplier_name||"업체"):(r.buyer_name||"요청자"))+'</div>'+
              '<div class="ritem-m"><span>'+esc(truncate(r.last_message||"",44))+'</span></div></div>';
          }).join("")+'</div>'
          : empty("아직 대화가 없습니다","견적을 받으면 업체와 바로 대화할 수 있습니다.",
                  '<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;reqs&quot;)">실시간 요청 보기</button>'));
      return;
    }
    if(t==="order"){
      if(!el) return;
      el.innerHTML = SCHEMA.orders===false ? setupNote("거래 관리","phase3_schema.sql")
        : (MY.orders && MY.orders.length ? '<div class="rlist">'+MY.orders.map(function(o){
            return '<div class="ritem" onclick="gOpenOrder(\''+o.id+'\')">'+
              '<div class="ritem-top"><span class="gbadge '+(o.status==="완료"?"gb-ok":(o.status==="취소"?"gb-gy":"gb-bl"))+'">'+esc(o.status)+'</span>'+
                '<span style="font-size:12px;color:var(--ink4);margin-left:auto;">'+ago(o.created_at)+'</span></div>'+
              '<div class="ritem-t">'+esc(o.title||"")+'</div>'+
              '<div class="ritem-m"><span>'+esc(o.supplier_name||"")+'</span><span>'+won(num(o.amount))+'원</span></div>'+
              '<div class="ritem-f"><span style="font-size:13px;color:var(--ink3);">진행 상태 관리</span>'+
              '<span style="font-size:13px;font-weight:700;color:var(--gn);">열기 ›</span></div></div>';
          }).join("")+'</div>'
          : empty("진행 중인 거래가 없습니다","견적을 선택하면 거래가 시작됩니다."));
      return;
    }
    origPanel();
    /* 회원정보 탭에 알림설정·인증 진입 추가 */
    if(t==="me" && el && !$("my-p3")){
      var d=document.createElement("div");
      d.className="gcard"; d.id="my-p3";
      d.innerHTML='<div class="gcard-t">업체 운영</div>'+
        '<div class="grow keep"><button class="gbtn gbtn-w gbtn-sm" onclick="gOpenPrefs()">요청 알림 설정</button>'+
        '<button class="gbtn gbtn-w gbtn-sm" onclick="gOpenVerify()">업체 인증</button>'+
        '<button class="gbtn gbtn-w gbtn-sm" onclick="gOpenChatList()">채팅 전체보기</button></div>'+
        '<div class="ghint" style="margin-top:10px;">관심 분야·지역을 설정하면 조건에 맞는 요청이 올라올 때 알림을 받습니다.</div>';
      el.appendChild(d);
    }
  };
  window.renderMyPanel=renderMyPanel;

  /* 거래·채팅 데이터도 함께 로딩 */
  var origLoad=loadMy;
  loadMy=async function(){
    await origLoad();
    var uid=ME.user.id;
    MY.orders=(await selectSafe("orders", function(q){ return q.order("created_at",{ascending:false}).limit(100); })).data||[];
    MY.orders=MY.orders.filter(function(o){
      return String(o.buyer_user_id||"")===String(uid) || MY.sups.some(function(s){ return String(s.id)===String(o.supplier_id); });
    });
    await loadRooms();
    await loadMarket();
  };
  window.loadMy=loadMy;
}

/* ── 헤더·하단 네비에 채팅 진입 ── */
function patchNav3(){
  /* renderHeaderUser 는 이 파일 스코프의 함수 선언입니다.
     window.renderHeaderUser 를 감싸면 아무 효과가 없어서 직접 바꿉니다. */
  var origHdr=renderHeaderUser;
  renderHeaderUser=function(){
    origHdr();
    if(!ME.user) return;
    var box=document.querySelector(".hdr-user"); if(!box || box.querySelector(".hu-chat")) return;
    var unread=chatUnread();
    var b=document.createElement("button");
    b.className="hu-bell hu-chat";
    b.setAttribute("aria-label","채팅");
    b.innerHTML='<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/></svg>'+
      (unread?'<span class="hu-dot">'+(unread>9?"9+":unread)+'</span>':'');
    b.onclick=function(ev){ ev.stopPropagation(); window.gOpenChatList(); };
    box.insertBefore(b, box.firstChild);
  };
}

/* ── 알림 링크(chat:) 처리 ── */
function patchNotifLink(){
  var orig=window.gOpenNotif;
  window.gOpenNotif=async function(id){
    var n=NOTIFS.find(function(x){ return String(x.id)===String(id); });
    if(n && n.link && n.link.indexOf("chat:")===0){
      if(!n.is_read){ n.is_read=true; await updateSafe("notifications",{is_read:true},"id",id); renderHeaderUser(); }
      var p=$("notif-panel"); if(p) p.classList.remove("on");
      window.gOpenChat(n.link.slice(5)); return;
    }
    await orig(id);
  };
}

/* ── 초기화 ── */
async function init3(){
  injectPages3();
  patchQuoteCards();
  patchQuoteForm();
  patchQuoteInsert();
  patchSubmitRequest();
  patchSelectQuote();
  patchSupplierDetail();
  patchMyTabs();
  patchNav3();
  patchNotifLink();

  var c=client(); if(!c){ P3_TABLES.forEach(function(t){ SCHEMA[t]=false; }); return; }
  await Promise.all(P3_TABLES.map(async function(t){
    try{ var r=await c.from(t).select("id").limit(1); SCHEMA[t]=!(r.error&&isMissingTable(r.error)); }
    catch(e){ SCHEMA[t]=false; }
  }));
  await loadMarket();
  if(ME.user){ await loadRooms(); renderHeaderUser(); }
}
setTimeout(init3, 300);

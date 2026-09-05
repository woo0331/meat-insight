
/* ════════════════════════════════════════════════════════════════════
   요청 상세 · 견적 비교 · 견적 제출
   가격 + 업체 인증 / 지역 / 납기 / 평점 / 거래실적 / 배송조건 / 추가 제안
   ════════════════════════════════════════════════════════════════════ */

var CUR = { req:null, quotes:[], supMap:{} };
G.CUR = CUR;

function supOf(id){ return CUR.supMap[String(id)] || null; }

async function fetchSupplierMap(){
  var r=await selectSafe("suppliers", function(q){ return q.limit(500); });
  var m={}; (r.data||[]).forEach(function(s){ m[String(s.id)]=s; });
  CUR.supMap=m; return m;
}

window.gOpenRequest=async function(id){
  if(typeof go==="function") go("reqd");
  var body=$("reqd-body"); if(!body) return;
  body.innerHTML='<div style="padding:50px 0;text-align:center;color:var(--ink4);font-size:14px;">불러오는 중…</div>';
  var c=client();
  if(!c){ body.innerHTML='<div class="gempty"><div class="gempty-t">서버에 연결할 수 없습니다</div></div>'; return; }
  var rr=await c.from("purchase_requests").select("*").eq("id", id).limit(1);
  var req=(rr.data&&rr.data[0])||null;
  if(!req){ body.innerHTML='<div class="gempty"><div class="gempty-t">요청을 찾을 수 없습니다</div><button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;reqs&quot;)">요청 목록으로</button></div>'; return; }
  CUR.req=req;
  await fetchSupplierMap();
  var q=await selectSafe("quotes", function(qq){ return qq.eq("request_id", String(id)).order("created_at",{ascending:false}); });
  CUR.quotes = q.unavailable ? null : (q.data||[]);
  renderRequestDetail();
};

function detailRows(req){
  var d=req.detail;
  if(d && typeof d==="object"){
    var key=req.category_main||(typeof key8Of==="function"?key8Of(req.category):null);
    var fields=REQ_FORMS[key]||[];
    var seen={}, rows=[];
    fields.forEach(function(f){
      var v=d[f.id]; if(v==null||v===""||(Array.isArray(v)&&!v.length)) return;
      seen[f.id]=1;
      rows.push([f.l, (Array.isArray(v)?v.join(", "):v)+(f.unit?" "+f.unit:"")]);
    });
    Object.keys(d).forEach(function(k){
      if(seen[k]) return; var v=d[k]; if(v==null||v===""||(Array.isArray(v)&&!v.length)) return;
      rows.push([k, Array.isArray(v)?v.join(", "):String(v)]);
    });
    if(rows.length) return rows;
  }
  var out=[];
  if(req.description) out.push(["요청 내용", req.description]);
  if(req.budget_text) out.push(["희망 금액", req.budget_text]);
  return out;
}

function renderRequestDetail(){
  var req=CUR.req, body=$("reqd-body"); if(!req||!body) return;
  var qs=CUR.quotes;
  var label=(typeof cat8Label==="function")?cat8Label(req.category):(req.category||"요청");
  var mine = ME.user && req.user_id && String(req.user_id)===String(ME.user.id);
  var rows=detailRows(req);
  var prices=(qs||[]).map(function(q){ return num(q.price); }).filter(function(v){ return v!=null; });
  var lo=prices.length?Math.min.apply(null,prices):null, hi=prices.length?Math.max.apply(null,prices):null;
  var avg=prices.length?Math.round(prices.reduce(function(a,b){return a+b;},0)/prices.length):null;

  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;reqs&quot;)">← 요청 목록</button></div>'+
    '<div class="gcard">'+
      '<div class="ritem-top"><span class="gbadge gb-or">'+esc(label)+'</span>'+
        (req.subcategory?'<span class="gbadge gb-gy">'+esc(req.subcategory)+'</span>':'')+
        '<span class="gbadge '+(req.status==="완료"?"gb-ok":(req.status==="진행중"?"gb-bl":"gb-gy"))+'">'+esc(req.status||"견적대기")+'</span>'+
        '<span style="font-size:12px;color:var(--ink4);margin-left:auto;">'+ago(req.created_at)+'</span></div>'+
      '<div style="font-size:21px;font-weight:800;color:var(--ink);margin:6px 0 10px;letter-spacing:-.4px;">'+esc(req.title||req.description||label+" 요청")+'</div>'+
      '<div class="ritem-m"><span>📍 '+esc(req.region||"전국")+'</span>'+
        (req.deadline?'<span>🗓 희망일 '+fmtDate(req.deadline)+' ('+dday(req.deadline)+')</span>':'')+
        (req.request_number?'<span>'+esc(req.request_number)+'</span>':'')+'</div>'+
      (rows.length?'<div class="gsum" style="margin-top:14px;">'+rows.map(function(r){
        return '<div class="gsum-r"><div class="gsum-k">'+esc(r[0])+'</div><div class="gsum-v">'+esc(r[1])+'</div></div>';
      }).join("")+'</div>':'')+
      (req.priority?'<div class="ghint" style="margin-top:10px;">비교 우선순위: '+esc(req.priority)+'</div>':'')+
    '</div>'+

    (qs===null ? setupNote("견적") :
      '<div class="qbar">'+
        '<div class="qbar-i"><div class="qbar-v">'+qs.length+'</div><div class="qbar-l">받은 견적</div></div>'+
        '<div class="qbar-i"><div class="qbar-v">'+(lo!=null?won(lo):"—")+'</div><div class="qbar-l">최저</div></div>'+
        '<div class="qbar-i"><div class="qbar-v">'+(avg!=null?won(avg):"—")+'</div><div class="qbar-l">평균</div></div>'+
        '<div class="qbar-i"><div class="qbar-v">'+(hi!=null?won(hi):"—")+'</div><div class="qbar-l">최고</div></div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:20px 0 12px;flex-wrap:wrap;">'+
        '<div class="gp-title">견적 비교</div>'+
        '<div style="display:flex;gap:7px;align-items:center;">'+
          '<select class="gin" style="width:auto;padding:8px 11px;font-size:13px;" id="q-sort" onchange="gSortQuotes()">'+
            '<option value="price">가격 낮은순</option><option value="rating">평점 높은순</option>'+
            '<option value="lead">납기 빠른순</option><option value="deal">거래실적 많은순</option><option value="new">최신순</option>'+
          '</select>'+
          '<button class="gbtn gbtn-p gbtn-sm" onclick="gOpenQuoteForm()">견적 보내기</button>'+
        '</div>'+
      '</div>'+
      '<div id="q-list"></div>'
    )+
    (mine&&req.status!=="완료"?'<div style="margin-top:18px;"><button class="gbtn gbtn-w gbtn-full" onclick="gCloseRequest()">이 요청 마감하기</button></div>':'');

  if(qs) { $("q-sort").value="price"; renderQuotes(); }
  window.scrollTo(0,0);
}

function leadMinutes(t){
  var s=String(t||""); var n=parseFloat(s.replace(/[^0-9.]/g,""));
  if(isNaN(n)) return 1e9;
  if(/일/.test(s)) return n*1440; if(/시간/.test(s)) return n*60;
  if(/주/.test(s)) return n*10080; if(/분/.test(s)) return n;
  return n*60;
}
window.gSortQuotes=function(){ renderQuotes(); };

function renderQuotes(){
  var el=$("q-list"); if(!el) return;
  var qs=(CUR.quotes||[]).slice();
  if(!qs.length){
    el.innerHTML='<div class="gempty"><div class="gempty-t">아직 도착한 견적이 없습니다</div>'+
      '<div class="gempty-d">조건에 맞는 업체가 확인하면 견적을 보냅니다.<br>업체라면 지금 바로 견적을 보낼 수 있습니다.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="gOpenQuoteForm()">견적 보내기</button></div>';
    return;
  }
  var mode=(($("q-sort")||{}).value)||"price";
  function meta(q){ var s=supOf(q.supplier_id)||{}; return {
    rating:Number(s.rating)||0, deal:Number(s.deal_count)||0,
    verified:!!s.is_verified, haccp:!!s.haccp, brn:!!s.brn_verified,
    region:q.region||s.region||"", sup:s }; }
  qs.sort(function(a,b){
    var ma=meta(a), mb=meta(b);
    if(mode==="price"){ var pa=num(a.price), pb=num(b.price); if(pa==null) return 1; if(pb==null) return -1; return pa-pb; }
    if(mode==="rating") return mb.rating-ma.rating;
    if(mode==="deal")   return mb.deal-ma.deal;
    if(mode==="lead")   return leadMinutes(a.lead_time)-leadMinutes(b.lead_time);
    return new Date(b.created_at)-new Date(a.created_at);
  });
  var prices=qs.map(function(q){ return num(q.price); }).filter(function(v){ return v!=null; });
  var lo=prices.length?Math.min.apply(null,prices):null;
  var mine = ME.user && CUR.req && CUR.req.user_id && String(CUR.req.user_id)===String(ME.user.id);
  var hasSelected = qs.some(function(q){ return q.status==="선택됨"; });

  el.innerHTML='<div class="qcmp">'+qs.map(function(q){
    var m=meta(q), s=m.sup, isLow=(num(q.price)!=null && num(q.price)===lo);
    var sel=q.status==="선택됨";
    /* 인증 배지 — 고리인증 / 사업자 / HACCP / 축산물 영업허가 */
    var certHtml = (typeof trustBadges==="function") ? trustBadges(s) : "";
    var certs = certHtml ? [certHtml] : [];
    return '<div class="qc'+(sel?" sel":(isLow?" best":""))+'">'+
      (sel?'<span class="gbadge gb-ok qc-tag">✓ 선택한 견적</span>'
          :(isLow?'<span class="gbadge gb-or qc-tag">최저가</span>'
                 :'<span class="gbadge gb-gy qc-tag ghost">·</span>'))+
      '<div class="qc-nm">'+esc(q.supplier_name||"업체")+'</div>'+
      (certs.length?'<div class="qc-certs">'+certs.join("")+'</div>':'')+
      '<div class="qc-price">'+(num(q.price)!=null?won(num(q.price)):"협의")+
        '<small>'+esc(q.price_unit||"총액")+'</small></div>'+
      '<div class="qc-spec">'+
        '<div class="qc-sr"><span class="qc-sk">납기</span><span class="qc-sv">'+esc(q.lead_time||"협의")+'</span></div>'+
        '<div class="qc-sr"><span class="qc-sk">지역</span><span class="qc-sv">'+esc(m.region||"—")+'</span></div>'+
        '<div class="qc-sr"><span class="qc-sk">배송 조건</span><span class="qc-sv">'+esc(q.delivery||"협의")+'</span></div>'+
        '<div class="qc-sr"><span class="qc-sk">평점</span><span class="qc-sv">'+(m.rating?('<span class="qstar">★ '+m.rating.toFixed(1)+'</span>'):"신규")+'</span></div>'+
        '<div class="qc-sr"><span class="qc-sk">거래실적</span><span class="qc-sv">'+(m.deal?m.deal+"건":"—")+'</span></div>'+
        (q.valid_until?'<div class="qc-sr"><span class="qc-sk">유효기간</span><span class="qc-sv">'+fmtDate(q.valid_until)+'</span></div>':'')+
      '</div>'+
      (q.conditions?'<div class="qc-note">'+esc(q.conditions)+'</div>':'')+
      '<div class="qc-act">'+
        (q.supplier_id?'<button class="gbtn gbtn-w gbtn-sm" onclick="curSID=\''+esc(q.supplier_id)+'\';go(&quot;sp&quot;)">업체 보기</button>':'')+
        (mine && !hasSelected ? '<button class="gbtn gbtn-p gbtn-sm" onclick="gSelectQuote(\''+q.id+'\')">이 견적 선택</button>'
          : (sel ? '<button class="gbtn gbtn-p gbtn-sm" onclick="gCompleteDeal(\''+q.id+'\')">거래 완료 처리</button>'
                 : '<button class="gbtn gbtn-w gbtn-sm" onclick="gContactQuote(\''+q.id+'\')">연락처 보기</button>'))+
      '</div></div>';
  }).join("")+'</div>'+
  (!mine?'<div class="ghint" style="margin-top:12px;">본인이 등록한 요청에 로그인하면 견적을 선택하고 거래를 진행할 수 있습니다.</div>':'');
}

window.gContactQuote=function(id){
  var q=(CUR.quotes||[]).find(function(x){ return String(x.id)===String(id); });
  if(!q) return;
  toast(q.contact ? (q.supplier_name+" · "+q.contact) : "연락처가 등록되지 않은 견적입니다.");
};

window.gSelectQuote=async function(id){
  if(!confirm("이 견적을 선택하시겠습니까?\n선택하면 다른 업체에는 미선택으로 표시됩니다.")) return;
  var q=(CUR.quotes||[]).find(function(x){ return String(x.id)===String(id); }); if(!q) return;
  await updateSafe("quotes",{status:"선택됨"},"id",id);
  var others=(CUR.quotes||[]).filter(function(x){ return String(x.id)!==String(id); });
  for(var i=0;i<others.length;i++){ await updateSafe("quotes",{status:"미선택"},"id",others[i].id); }
  await updateSafe("purchase_requests",{status:"진행중", selected_quote_id:String(id)},"id",CUR.req.id);
  if(q.user_id) pushNotif(q.user_id,"selected","견적이 선택되었습니다","'"+(CUR.req.title||"요청")+"' 건의 견적이 선택되었습니다.","req:"+CUR.req.id);
  toast("견적을 선택했습니다. 거래를 진행하세요.","ok");
  window.gOpenRequest(CUR.req.id);
};

window.gCompleteDeal=async function(quoteId){
  if(!confirm("거래를 완료 처리할까요?\n완료 후 업체에 후기를 남길 수 있습니다.")) return;
  await updateSafe("purchase_requests",{status:"완료", closed_at:new Date().toISOString()},"id",CUR.req.id);
  var q=(CUR.quotes||[]).find(function(x){ return String(x.id)===String(quoteId); });
  if(q && q.supplier_id){
    var s=supOf(q.supplier_id);
    if(s) await updateSafe("suppliers",{deal_count:(Number(s.deal_count)||0)+1},"id",q.supplier_id);
  }
  toast("거래를 완료했습니다. 후기를 남겨주세요.","ok");
  if(q) window.gOpenReview("supplier", q.supplier_id||"", q.supplier_name||"", CUR.req.id);
};

window.gCloseRequest=async function(){
  if(!confirm("이 요청을 마감할까요? 더 이상 견적을 받지 않습니다.")) return;
  await updateSafe("purchase_requests",{status:"마감", closed_at:new Date().toISOString()},"id",CUR.req.id);
  toast("요청을 마감했습니다.","ok");
  window.gOpenRequest(CUR.req.id);
};

/* ── 견적 보내기 ── */
window.gOpenQuoteForm=function(){
  if(SCHEMA.quotes===false){ toast("견적 기능을 쓰려면 db/phase2_schema.sql 을 먼저 실행해주세요.","err"); return; }
  if(typeof go==="function") go("quote");
  var req=CUR.req, body=$("quote-body"); if(!body) return;
  var sups=Object.keys(CUR.supMap).map(function(k){ return CUR.supMap[k]; });
  var mySups = ME.user ? sups.filter(function(s){ return String(s.user_id||"")===String(ME.user.id); }) : [];
  var opts = (mySups.length?mySups:sups).slice(0,200);
  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="gOpenRequest(\''+esc(req?req.id:"")+'\')">← 요청으로</button>'+
      '<div><div class="gp-title">견적 보내기</div><div class="gp-sub">'+esc(req?(req.title||req.category):"")+'</div></div></div>'+
    '<div class="gcard"><div class="gcard-t">우리 업체</div>'+
      '<label class="glabel">업체 선택</label>'+
      '<select class="gin" id="q-sup" onchange="gQuoteSupChange()">'+
        '<option value="">직접 입력</option>'+
        opts.map(function(s){ return '<option value="'+esc(s.id)+'">'+esc(s.name)+(s.region?" · "+esc(s.region):"")+'</option>'; }).join("")+
      '</select>'+
      '<div class="grow keep">'+
        '<div><label class="glabel">업체명 <span class="greq">*</span></label><input class="gin" id="q-name" placeholder="○○축산"></div>'+
        '<div><label class="glabel">연락처 <span class="greq">*</span></label><input class="gin" id="q-contact" placeholder="010-0000-0000"></div>'+
      '</div>'+
      '<label class="glabel">지역</label><input class="gin" id="q-region" placeholder="경기 안성시">'+
    '</div>'+
    '<div class="gcard"><div class="gcard-t">견적 내용</div>'+
      '<div class="grow keep">'+
        '<div><label class="glabel">금액 <span class="greq">*</span></label><input class="gin" id="q-price" inputmode="numeric" placeholder="4,500,000" oninput="gNumFmt(this)"></div>'+
        '<div><label class="glabel">단위</label><select class="gin" id="q-unit"><option>총액</option><option>원/kg</option><option>원/두</option><option>원/회</option><option>일당</option><option>월</option></select></div>'+
      '</div>'+
      '<div class="grow keep">'+
        '<div><label class="glabel">납기</label><input class="gin" id="q-lead" placeholder="3일 이내 / 당일 / 협의"></div>'+
        '<div><label class="glabel">견적 유효기간</label><input class="gin" id="q-valid" type="date"></div>'+
      '</div>'+
      '<label class="glabel">배송 조건</label><input class="gin" id="q-delivery" placeholder="냉장 차량 무료 배송 / 착불 / 방문 수령">'+
      '<label class="glabel">추가 제안</label><textarea class="gin" id="q-cond" placeholder="정기 계약 시 단가 인하, 샘플 제공, 결제 조건 등 강점을 적어주세요"></textarea>'+
      '<div class="gmsg" id="q-msg"></div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="gOpenRequest(\''+esc(req?req.id:"")+'\')">취소</button>'+
    '<button class="gbtn gbtn-p" id="q-submit" onclick="gSubmitQuote()">견적 보내기</button></div>';
  window.scrollTo(0,0);
};
window.gQuoteSupChange=function(){
  var id=($("q-sup")||{}).value, s=id?supOf(id):null;
  if(!s) return;
  if($("q-name")) $("q-name").value=s.name||"";
  if($("q-contact")) $("q-contact").value=s.contact||"";
  if($("q-region")) $("q-region").value=s.region||"";
  if($("q-lead") && !$("q-lead").value) $("q-lead").value=s.lead_time||"";
};
window.gSubmitQuote=async function(){
  var name=(($("q-name")||{}).value||"").trim(), contact=(($("q-contact")||{}).value||"").trim();
  var price=num(($("q-price")||{}).value);
  if(!name||!contact){ setMsg("q-msg","업체명과 연락처는 필수입니다.","err"); return; }
  if(price==null){ setMsg("q-msg","견적 금액을 입력해주세요.","err"); return; }
  var btn=$("q-submit"); if(btn){ btn.disabled=true; btn.textContent="전송 중…"; }
  var payload={
    request_id:String(CUR.req.id),
    supplier_id:(($("q-sup")||{}).value)||null,
    supplier_name:name,
    user_id: ME.user?ME.user.id:null,
    price:price,
    price_unit:(($("q-unit")||{}).value)||"총액",
    lead_time:(($("q-lead")||{}).value||"").trim()||null,
    delivery:(($("q-delivery")||{}).value||"").trim()||null,
    conditions:(($("q-cond")||{}).value||"").trim()||null,
    region:(($("q-region")||{}).value||"").trim()||null,
    contact:contact,
    valid_until:(($("q-valid")||{}).value)||null,
    status:"대기"
  };
  var r=await insertSafe("quotes", payload);
  if(btn){ btn.disabled=false; btn.textContent="견적 보내기"; }
  if(r.error){
    setMsg("q-msg", r.missingTable ? "견적 테이블이 아직 없습니다. db/phase2_schema.sql 을 실행해주세요." : ("전송 실패: "+(r.error.message||"")), "err");
    return;
  }
  var cnt=(Number(CUR.req.quote_count)||0)+1;
  await updateSafe("purchase_requests",{quote_count:cnt},"id",CUR.req.id);
  if(CUR.req.user_id) pushNotif(CUR.req.user_id,"quote","새 견적이 도착했습니다",name+" 업체가 견적을 보냈습니다.","req:"+CUR.req.id);
  toast("견적을 보냈습니다.","ok");
  window.gOpenRequest(CUR.req.id);
};

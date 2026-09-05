
/* ════════════════════════════════════════════════════════════════════
   인증 센터 · 거래(주문) 관리 · 구조화 견적
   축산 B2B 전용: 사업자등록 / HACCP / 축산물 영업허가
   ════════════════════════════════════════════════════════════════════ */

var VERIF_KINDS=[
  {k:"brn",              nm:"사업자등록",   d:"사업자등록번호 10자리", ph:"000-00-00000", need:true},
  {k:"livestock_permit", nm:"축산물 영업허가", d:"축산물위생관리법상 영업허가번호", ph:"허가번호"},
  {k:"haccp",            nm:"HACCP 인증",   d:"HACCP 인증번호", ph:"인증번호"}
];

/* 사업자등록번호 검증 (국세청 체크섬) */
function validBRN(v){
  var n=String(v||"").replace(/[^0-9]/g,"");
  if(n.length!==10) return false;
  if(/^(\d)\1{9}$/.test(n)) return false;      /* 000-00-00000 같은 값 차단 */
  var key=[1,3,7,1,3,7,1,3,5], sum=0;
  for(var i=0;i<9;i++) sum += parseInt(n[i],10)*key[i];
  sum += Math.floor((parseInt(n[8],10)*5)/10);
  return ((10-(sum%10))%10) === parseInt(n[9],10);
}
G.validBRN=validBRN;
function fmtBRN(v){
  var n=String(v||"").replace(/[^0-9]/g,"").slice(0,10);
  if(n.length>5) return n.slice(0,3)+"-"+n.slice(3,5)+"-"+n.slice(5);
  if(n.length>3) return n.slice(0,3)+"-"+n.slice(3);
  return n;
}
window.gBRNFmt=function(el){ el.value=fmtBRN(el.value); };

window.gOpenVerify=async function(supplierId){
  if(typeof go==="function") go("verify");
  var body=$("verify-body"); if(!body) return;
  if(!ME.user){
    body.innerHTML='<div class="gempty"><div class="gempty-t">로그인이 필요합니다</div>'+
      '<div class="gempty-d">인증은 업체 계정에 연결되어 관리됩니다.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="openModal(\'login\')">로그인</button></div>'; return;
  }
  var mine=(await selectSafe("suppliers", function(q){ return q.eq("user_id",ME.user.id); })).data||[];
  if(!mine.length){
    body.innerHTML='<div class="gp-hd"><div class="gp-title">업체 인증</div></div>'+
      '<div class="gempty"><div class="gempty-t">등록된 업체가 없습니다</div>'+
      '<div class="gempty-d">업체를 등록한 뒤 인증을 진행하세요. 인증 업체는 요청자에게 먼저 노출됩니다.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;sj&quot;)">업체 등록하기</button></div>'; return;
  }
  var sup=mine.find(function(s){ return String(s.id)===String(supplierId); })||mine[0];
  var vs=(await selectSafe("verifications", function(q){ return q.eq("target_id",String(sup.id)).order("created_at",{ascending:false}); })).data||[];
  function latest(kind){ return vs.find(function(v){ return v.kind===kind; })||null; }

  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;my&quot;)">← 거래관리</button>'+
      '<div><div class="gp-title">업체 인증</div><div class="gp-sub">'+esc(sup.name)+' — 인증할수록 요청자에게 먼저 노출됩니다</div></div></div>'+
    (mine.length>1?'<div class="gcard"><label class="glabel">업체 선택</label><select class="gin" onchange="gOpenVerify(this.value)">'+
      mine.map(function(s){ return '<option value="'+esc(s.id)+'"'+(String(s.id)===String(sup.id)?" selected":"")+'>'+esc(s.name)+'</option>'; }).join("")+'</select></div>':'')+
    VERIF_KINDS.map(function(k){
      var v=latest(k.k);
      var done=(k.k==="brn"?sup.brn_verified:(k.k==="haccp"?sup.haccp:sup.livestock_permit));
      var st = done ? '<span class="gbadge gb-ok">승인</span>'
             : (v ? '<span class="gbadge gb-or">'+esc(v.status||"심사중")+'</span>' : '<span class="gbadge gb-gy">미인증</span>');
      return '<div class="gcard"><div class="gcard-t" style="display:flex;align-items:center;gap:8px;">'+esc(k.nm)+
          (k.need?'<span class="gbadge gb-rd">필수</span>':'')+'<span style="margin-left:auto;">'+st+'</span></div>'+
        '<div class="ghint" style="margin:-6px 0 12px;">'+esc(k.d)+'</div>'+
        (done ? '<div class="gsum"><div class="gsum-r"><div class="gsum-k">번호</div><div class="gsum-v">'+esc((v&&v.number)||sup.brn||"등록됨")+'</div></div></div>'
        : '<label class="glabel">번호</label>'+
          '<input class="gin" id="vf-'+k.k+'" placeholder="'+esc(k.ph)+'"'+
            (k.k==="brn"?' inputmode="numeric" oninput="gBRNFmt(this)" value="'+esc(sup.brn||"")+'"':'')+'>'+
          '<label class="glabel">상호 · 대표자</label>'+
          '<input class="gin" id="vh-'+k.k+'" placeholder="'+esc(sup.name)+' · 홍길동" value="'+esc(sup.rep_name?sup.name+" · "+sup.rep_name:"")+'">'+
          '<div class="grow keep" style="margin-top:14px;">'+
          '<button class="gbtn gbtn-p" onclick="gSubmitVerify(\''+esc(sup.id)+'\',\''+k.k+'\')">인증 신청</button></div>')+
        '</div>';
    }).join("")+
    '<div class="gcard"><div class="gcard-t">인증하면 달라지는 것</div>'+
      '<div class="gsum">'+
        '<div class="gsum-r"><div class="gsum-k">노출</div><div class="gsum-v">인증 업체 필터·바로견적 추천에 포함됩니다</div></div>'+
        '<div class="gsum-r"><div class="gsum-k">견적</div><div class="gsum-v">견적 카드에 인증 배지가 함께 표시됩니다</div></div>'+
        '<div class="gsum-r"><div class="gsum-k">요청</div><div class="gsum-v">"인증 업체에만 공개" 요청을 받을 수 있습니다</div></div>'+
      '</div></div>'+
    '<div class="gmsg" id="vf-msg"></div>';
  window.scrollTo(0,0);
};

window.gSubmitVerify=async function(supId, kind){
  var numEl=$("vf-"+kind), num2=numEl?String(numEl.value||"").trim():"";
  if(!num2){ setMsg("vf-msg","번호를 입력해주세요.","err"); return; }
  if(kind==="brn" && !validBRN(num2)){ setMsg("vf-msg","사업자등록번호 형식이 올바르지 않습니다. 10자리를 확인해주세요.","err"); return; }
  var r=await insertSafe("verifications",{
    target_type:"supplier", target_id:String(supId), user_id:ME.user?ME.user.id:null,
    kind:kind, number:num2, holder:(($("vh-"+kind)||{}).value||"").trim()||null, status:"심사중"
  });
  if(r.error){ setMsg("vf-msg", r.missingTable?"db/phase3_schema.sql 을 먼저 실행해주세요.":("신청 실패: "+(r.error.message||"")),"err"); return; }
  if(kind==="brn") await updateSafe("suppliers",{brn:num2},"id",supId);
  toast("인증을 신청했습니다. 검토 후 배지가 표시됩니다.","ok");
  window.gOpenVerify(supId);
};

/* ════════════════════════════════════════════════════════════════════
   거래(주문) 관리 — 견적 선택 이후의 진행 상태
   ════════════════════════════════════════════════════════════════════ */
var ORDER_FLOW=["거래확정","준비중","배송중","완료"];

window.gOpenOrder=async function(orderId){
  if(typeof go==="function") go("order");
  var body=$("order-body"); if(!body) return;
  var c=client(); if(!c) return;
  var r=await c.from("orders").select("*").eq("id",orderId).limit(1);
  var o=(r.data&&r.data[0])||null;
  if(!o){ body.innerHTML='<div class="gempty"><div class="gempty-t">거래를 찾을 수 없습니다</div></div>'; return; }
  var idx=ORDER_FLOW.indexOf(o.status); if(idx<0) idx=0;
  var tl=Array.isArray(o.timeline)?o.timeline:[];
  var mine = ME.user && (String(o.buyer_user_id||"")===String(ME.user.id));

  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;my&quot;)">← 거래관리</button>'+
      '<div><div class="gp-title">거래 진행</div><div class="gp-sub">'+esc(o.title||"")+'</div></div></div>'+
    '<div class="gcard">'+
      '<div class="ord-flow">'+ORDER_FLOW.map(function(s,i){
        return '<div class="ord-step'+(i<idx?" done":(i===idx?" on":""))+'">'+
          '<div class="ord-dot">'+(i<idx?"✓":(i+1))+'</div><div class="ord-lb">'+s+'</div></div>';
      }).join("")+'</div>'+
      '<div class="gsum" style="margin-top:18px;">'+
        '<div class="gsum-r"><div class="gsum-k">업체</div><div class="gsum-v">'+esc(o.supplier_name||"")+'</div></div>'+
        '<div class="gsum-r"><div class="gsum-k">금액</div><div class="gsum-v">'+won(num(o.amount))+'원</div></div>'+
        '<div class="gsum-r"><div class="gsum-k">요청자</div><div class="gsum-v">'+esc(o.buyer_name||"")+(o.buyer_phone?" · "+esc(o.buyer_phone):"")+'</div></div>'+
        '<div class="gsum-r"><div class="gsum-k">상태</div><div class="gsum-v">'+esc(o.status)+'</div></div>'+
      '</div>'+
    '</div>'+
    (tl.length?'<div class="gcard"><div class="gcard-t">진행 기록</div>'+tl.slice().reverse().map(function(t){
        return '<div class="rv"><div class="rv-top"><div class="rv-a">'+esc(t.status||"")+'</div>'+
          '<div class="rv-d">'+ago(t.at)+'</div></div>'+(t.memo?'<div class="rv-c">'+esc(t.memo)+'</div>':'')+'</div>';
      }).join("")+'</div>':'')+
    (o.status!=="완료"&&o.status!=="취소" ?
      '<div class="gcard"><div class="gcard-t">상태 변경</div>'+
        '<label class="glabel">메모</label><input class="gin" id="ord-memo" placeholder="출고 완료, 차량 배차됨 등 (선택)">'+
        '<div class="grow keep" style="margin-top:14px;">'+
          (idx<ORDER_FLOW.length-1?'<button class="gbtn gbtn-p" onclick="gAdvanceOrder(\''+o.id+'\')">'+ORDER_FLOW[idx+1]+'(으)로 변경</button>':'')+
          '<button class="gbtn gbtn-w" onclick="gCancelOrder(\''+o.id+'\')">거래 취소</button>'+
        '</div><div class="gmsg" id="ord-msg"></div></div>' : '')+
    (o.status==="완료"&&mine ? '<button class="gbtn gbtn-p gbtn-full" onclick="gOpenReview(\'supplier\',\''+esc(o.supplier_id||"")+'\',\''+esc(o.supplier_name||"")+'\',\''+esc(o.request_id||"")+'\')">후기 남기기</button>' : '')+
    (o.request_id?'<button class="gbtn gbtn-w gbtn-full" style="margin-top:8px;" onclick="gOpenRequest(\''+esc(o.request_id)+'\')">연결된 요청 보기</button>':'');
  window.scrollTo(0,0);
};

window.gAdvanceOrder=async function(orderId){
  var c=client(); if(!c) return;
  var r=await c.from("orders").select("*").eq("id",orderId).limit(1);
  var o=(r.data&&r.data[0])||null; if(!o) return;
  var idx=ORDER_FLOW.indexOf(o.status); if(idx<0) idx=0;
  var next=ORDER_FLOW[Math.min(idx+1, ORDER_FLOW.length-1)];
  var tl=Array.isArray(o.timeline)?o.timeline.slice():[];
  tl.push({ status:next, at:new Date().toISOString(), memo:(($("ord-memo")||{}).value||"").trim()||null });
  var patch={ status:next, timeline:tl };
  if(next==="완료") patch.completed_at=new Date().toISOString();
  var u=await updateSafe("orders",patch,"id",orderId);
  if(u.error){ setMsg("ord-msg","변경 실패: "+(u.error.message||""),"err"); return; }
  if(next==="완료"){
    await updateSafe("purchase_requests",{status:"완료", closed_at:new Date().toISOString()},"id",o.request_id);
    if(o.supplier_id){
      var s=(await selectSafe("suppliers", function(q){ return q.eq("id",o.supplier_id).limit(1); })).data||[];
      if(s[0]) await updateSafe("suppliers",{deal_count:(Number(s[0].deal_count)||0)+1},"id",o.supplier_id);
    }
  }
  toast(next+"(으)로 변경했습니다.","ok");
  window.gOpenOrder(orderId);
};
window.gCancelOrder=async function(orderId){
  if(!confirm("이 거래를 취소할까요?")) return;
  await updateSafe("orders",{status:"취소"},"id",orderId);
  toast("거래를 취소했습니다.");
  window.gOpenOrder(orderId);
};

/* 견적 선택 시 거래 생성 */
async function createOrder(req, q){
  if(SCHEMA.orders===false) return null;
  var r=await insertSafe("orders",{
    request_id:String(req.id), quote_id:String(q.id),
    buyer_user_id:req.user_id||null, buyer_name:req.buyer_name||"", buyer_phone:req.buyer_phone||"",
    supplier_id:q.supplier_id?String(q.supplier_id):null, supplier_name:q.supplier_name||"",
    amount:num(q.total_amount)!=null?num(q.total_amount):num(q.price),
    title:req.title||req.description||req.category,
    status:"거래확정",
    timeline:[{status:"거래확정", at:new Date().toISOString(), memo:"견적이 선택되었습니다"}]
  });
  return (r.data&&r.data[0])||null;
}
G.createOrder=createOrder;

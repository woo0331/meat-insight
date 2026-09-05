/* ════════════════════════════════════════════════════════════════════
   요청 수정 · 삭제 · 견적 철회
   지금까지는 한 번 올린 요청은 "마감"만 가능했고, 업체가 보낸 견적은
   되돌릴 방법이 없었습니다.
   ════════════════════════════════════════════════════════════════════ */

var ED = { req:null, key:null, fields:[] };
var P4_PAGES=["reqedit"];

function injectPages4(){
  var nav=document.querySelector(".bnav");
  P4_PAGES.forEach(function(id){
    if($("pg-"+id)) return;
    var d=document.createElement("div");
    d.className="pg"; d.id="pg-"+id;
    d.style.cssText="padding-top:var(--top-pad);padding-bottom:56px;";
    d.innerHTML='<div class="gp" id="'+id+'-body"></div>';
    if(nav) document.body.insertBefore(d, nav); else document.body.appendChild(d);
  });
  if(typeof PGS!=="undefined") P4_PAGES.forEach(function(id){ if(PGS.indexOf(id)<0) PGS.push(id); });
  if(typeof TM!=="undefined"){ TM.reqedit="reqs"; }
}

/* ── 수정 폼 전용 입력칸 (마법사의 w-* 와 id 가 겹치지 않도록 e-* 를 씁니다) ── */
var ED_MULTI = ["work","need","service","role","item"];
function edFieldHtml(f){
  var id="e-"+f.id, req=f.req?' <span class="greq">*</span>':'';
  var h='<label class="glabel">'+esc(f.l)+req+'</label>';
  if(f.t==="select") h+='<select class="gin" id="'+id+'">'+f.opts.map(function(o){ return '<option>'+esc(o)+'</option>'; }).join("")+'</select>';
  else if(f.t==="chips") h+='<div class="gpick" id="'+id+'" data-multi="'+(ED_MULTI.indexOf(f.id)>=0?"1":"0")+'">'+f.opts.map(function(o){
      return '<button type="button" class="gpick-i" onclick="gEChip(this)">'+esc(o)+'</button>'; }).join("")+'</div>';
  else if(f.t==="textarea") h+='<textarea class="gin" id="'+id+'" placeholder="'+esc(f.ph||"")+'"></textarea>';
  else if(f.t==="money"||f.t==="number") h+='<div style="position:relative;"><input class="gin" id="'+id+'" inputmode="numeric" placeholder="'+esc(f.ph||"")+'"'+
      (f.t==="money"?' oninput="gNumFmt(this)"':'')+'>'+
      (f.unit?'<span style="position:absolute;right:13px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--ink4);font-weight:600;">'+esc(f.unit)+'</span>':'')+'</div>';
  else h+='<input class="gin" id="'+id+'" type="'+(f.t==="date"?"date":(f.t==="time"?"time":"text"))+'" placeholder="'+esc(f.ph||"")+'">';
  return h;
}
window.gEChip=function(el){
  var wrap=el.parentNode;
  if(wrap.getAttribute("data-multi")!=="1") wrap.querySelectorAll(".gpick-i").forEach(function(b){ if(b!==el) b.classList.remove("on"); });
  el.classList.toggle("on");
};
function edRestore(fields, data){
  fields.forEach(function(f){
    var v=data[f.id]; var el=$("e-"+f.id); if(!el) return;
    if(f.t==="chips"){
      var arr=Array.isArray(v)?v:(v?[v]:[]);
      el.querySelectorAll(".gpick-i").forEach(function(b){ b.classList.toggle("on", arr.indexOf(b.textContent.trim())>=0); });
    } else if(v!=null) el.value=v;
  });
}
function edRead(fields){
  var out={};
  fields.forEach(function(f){
    var el=$("e-"+f.id); if(!el) return;
    if(f.t==="chips"){
      var v=[]; el.querySelectorAll(".gpick-i.on").forEach(function(b){ v.push(b.textContent.trim()); });
      out[f.id]=v;
    } else out[f.id]=String(el.value||"").trim();
  });
  return out;
}

/* ── 수정 가능 여부 ── */
function edCanEdit(req){
  var st=String(req.status||"견적대기");
  return st==="견적대기" || st==="마감";
}
function edIsMine(req){
  return !!(ME.user && req && req.user_id && String(req.user_id)===String(ME.user.id));
}

/* ── 요청 수정 화면 ── */
window.gEditRequest=async function(id){
  var req=(CUR.req && String(CUR.req.id)===String(id)) ? CUR.req : null;
  if(!req){
    var c=client(); if(!c){ toast("서버에 연결할 수 없습니다.","err"); return; }
    var rr=await c.from("purchase_requests").select("*").eq("id", id).limit(1);
    req=(rr.data&&rr.data[0])||null;
  }
  if(!req){ toast("요청을 찾을 수 없습니다.","err"); return; }
  if(!edIsMine(req)){ toast("본인이 등록한 요청만 수정할 수 있습니다.","err"); return; }
  if(!edCanEdit(req)){ toast("거래가 진행 중이거나 완료된 요청은 수정할 수 없습니다.","err"); return; }

  var key=req.category_main || (typeof key8Of==="function" ? key8Of(req.category) : null);
  var fields=(typeof REQ_FORMS!=="undefined" && REQ_FORMS[key]) ? REQ_FORMS[key] : [];
  ED.req=req; ED.key=key; ED.fields=fields;

  if(typeof go==="function") go("reqedit");
  var body=$("reqedit-body"); if(!body) return;
  var label=(typeof cat8Label==="function")?cat8Label(req.category):(req.category||"요청");
  var qn=(CUR.quotes||[]).filter(function(q){ return q.status!=="철회"; }).length;

  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="gOpenRequest(\''+esc(req.id)+'\')">← 요청으로</button>'+
      '<div><div class="gp-title">요청 수정</div><div class="gp-sub">'+esc(label)+' · '+esc(req.request_number||"")+'</div></div></div>'+
    (qn ? '<div class="gnote">이미 견적 '+qn+'건이 도착했습니다. 조건을 바꾸면 견적을 보낸 업체에 변경 사실이 알림으로 전달됩니다.</div>' : '')+
    '<div class="gcard"><div class="gcard-t">제목</div>'+
      '<input class="gin" id="re-title" placeholder="비워두면 입력 내용으로 자동 생성됩니다">'+
      '<div class="ghint">목록과 알림에 이 제목이 표시됩니다.</div></div>'+
    (fields.length
      ? '<div class="gcard"><div class="gcard-t">요청 조건</div>'+fields.map(edFieldHtml).join("")+'</div>'
      : '<div class="gcard"><div class="gcard-t">요청 내용</div>'+
        '<textarea class="gin" id="re-desc" placeholder="필요한 조건을 자세히 적어주세요"></textarea></div>')+
    '<div class="gmsg" id="re-msg"></div>'+
    '<div class="grow keep" style="margin-top:14px;">'+
      '<button class="gbtn gbtn-w" onclick="gOpenRequest(\''+esc(req.id)+'\')">취소</button>'+
      '<button class="gbtn gbtn-p" id="re-save" onclick="gSaveRequestEdit()">수정 내용 저장</button></div>';

  var t=$("re-title"); if(t) t.value=req.title||"";
  if(fields.length){
    var d=Object.assign({}, (req.detail && typeof req.detail==="object") ? req.detail : {});
    /* 상세 JSON 에 없고 컬럼에만 있는 값도 채워줍니다 (안 그러면 저장 때 지워집니다) */
    if(!d.deadline && req.deadline) d.deadline=String(req.deadline).slice(0,10);
    if(!d.region && req.region) d.region=req.region;
    edRestore(fields, d);
  } else {
    var de=$("re-desc"); if(de) de.value=req.description||"";
  }
  window.scrollTo(0,0);
};

window.gSaveRequestEdit=async function(){
  var req=ED.req; if(!req) return;
  var fields=ED.fields, patch;

  if(fields.length){
    var d=edRead(fields);
    var miss=fields.filter(function(f){
      if(!f.req) return false;
      var v=d[f.id];
      return Array.isArray(v) ? !v.length : !v;
    });
    if(miss.length){
      setMsg("re-msg","필수 항목을 입력해주세요 — "+miss.map(function(f){ return f.l; }).join(", "),"err");
      return;
    }
    /* buildTitle / buildSummary 는 W 를 읽으므로 잠깐 빌려 씁니다 */
    var prevW=W;
    W = { step:3, cat:ED.key, sub:req.subcategory||null, data:d, contact:prevW.contact };
    var autoTitle=buildTitle(), summary=buildSummary();
    W = G.W = prevW;
    patch={
      title: (($("re-title")||{}).value||"").trim() || autoTitle,
      region: d.region || d.to || d.from || req.region || "전국",
      budget_text: d.price || d.budget || d.pay || null,
      description: summary,
      detail: d,
      deadline: d.deadline || d.work_date || null
    };
  } else {
    patch={
      title: (($("re-title")||{}).value||"").trim() || req.title,
      description: (($("re-desc")||{}).value||"").trim() || req.description
    };
  }

  var btn=$("re-save"); if(btn){ btn.disabled=true; btn.textContent="저장 중…"; }
  var r=await updateSafe("purchase_requests", patch, "id", req.id);
  if(btn){ btn.disabled=false; btn.textContent="수정 내용 저장"; }
  if(r.error){
    setMsg("re-msg","저장에 실패했습니다: "+(r.error.message||"알 수 없는 오류"),"err");
    return;
  }
  /* 이미 견적을 보낸 업체에 알림 */
  var seen={};
  (CUR.quotes||[]).forEach(function(q){
    if(q.status==="철회" || !q.user_id || seen[q.user_id]) return;
    seen[q.user_id]=1;
    pushNotif(q.user_id,"quote","요청 조건이 수정되었습니다",
      (patch.title||"요청")+" 의 조건이 바뀌었습니다. 견적을 다시 확인해주세요.","req:"+req.id);
  });
  toast("요청을 수정했습니다.","ok");
  if(typeof loadFromDB==="function") loadFromDB();
  window.gOpenRequest(req.id);
};

/* ── 요청 삭제 (견적이 하나도 없을 때만) ── */
window.gDeleteRequest=async function(id){
  var req=(CUR.req && String(CUR.req.id)===String(id)) ? CUR.req : null;
  if(!req){ toast("요청 정보를 불러오지 못했습니다.","err"); return; }
  if(!edIsMine(req)){ toast("본인이 등록한 요청만 삭제할 수 있습니다.","err"); return; }
  var qn=(CUR.quotes||[]).filter(function(q){ return q.status!=="철회"; }).length;
  if(qn){ toast("견적이 도착한 요청은 삭제할 수 없습니다. 대신 마감해주세요.","err"); return; }
  if(!confirm("이 요청을 삭제할까요? 되돌릴 수 없습니다.")) return;
  var c=client(); if(!c){ toast("서버에 연결할 수 없습니다.","err"); return; }
  var res=await c.from("purchase_requests").delete().eq("id", req.id);
  if(res.error){ toast("삭제에 실패했습니다: "+(res.error.message||""),"err"); return; }
  toast("요청을 삭제했습니다.","ok");
  if(typeof loadFromDB==="function") loadFromDB();
  if(typeof go==="function") go("reqs");
};

/* ── 요청 상세에 수정·삭제 버튼 붙이기 ── */
function edOwnerBar(){
  var body=$("reqd-body"), req=CUR.req;
  if(!body || !req || body.querySelector(".ed-own")) return;
  if(!edIsMine(req) || !edCanEdit(req)) return;
  var qn=(CUR.quotes||[]).filter(function(q){ return q.status!=="철회"; }).length;

  var closeWrap=null;
  body.querySelectorAll("button").forEach(function(b){
    if(/마감하기/.test(b.textContent)) closeWrap=b.parentNode;
  });
  var wrap=document.createElement("div");
  wrap.className="ed-own grow keep";
  wrap.style.cssText="margin-top:18px;";
  wrap.innerHTML='<button class="gbtn gbtn-w" onclick="gEditRequest(\''+esc(req.id)+'\')">요청 수정</button>'+
    (qn===0 ? '<button class="gbtn gbtn-w" onclick="gDeleteRequest(\''+esc(req.id)+'\')">요청 삭제</button>' : '');
  if(closeWrap && closeWrap.parentNode) closeWrap.parentNode.insertBefore(wrap, closeWrap);
  else body.appendChild(wrap);
}

/* ── 견적 철회 ── */
window.gWithdrawQuote=async function(qid){
  var q=null;
  [(MY&&MY.quotesOut)||[], (MY&&MY.quotesIn)||[], CUR.quotes||[]].forEach(function(list){
    if(q) return;
    q=list.find(function(x){ return String(x.id)===String(qid); })||null;
  });
  if(!q){ toast("견적 정보를 찾을 수 없습니다.","err"); return; }
  if(!ME.user || String(q.user_id||"")!==String(ME.user.id)){ toast("본인이 보낸 견적만 철회할 수 있습니다.","err"); return; }
  if(q.status==="선택됨"){ toast("이미 선택된 견적은 철회할 수 없습니다. 요청자와 먼저 상의해주세요.","err"); return; }
  if(q.status==="철회"){ toast("이미 철회한 견적입니다.","err"); return; }
  if(!confirm("이 견적을 철회할까요? 요청자에게 더 이상 보이지 않습니다.")) return;

  var r=await updateSafe("quotes",{status:"철회"},"id",q.id);
  if(r.error){ toast("철회에 실패했습니다: "+(r.error.message||""),"err"); return; }
  q.status="철회";

  /* 요청의 견적 수 되돌리기 */
  var c=client();
  if(c && q.request_id){
    try{
      var rr=await c.from("purchase_requests").select("*").eq("id", q.request_id).limit(1);
      var req=(rr.data&&rr.data[0])||null;
      if(req){
        var n=Math.max(0,(Number(req.quote_count)||0)-1);
        await updateSafe("purchase_requests",{quote_count:n},"id",req.id);
        if(req.user_id) pushNotif(req.user_id,"quote","견적이 철회되었습니다",
          (q.supplier_name||"업체")+" 업체가 견적을 철회했습니다.","req:"+req.id);
      }
    }catch(e){}
  }
  toast("견적을 철회했습니다.","ok");
  if(typeof loadFromDB==="function") loadFromDB();
  if(typeof window.gOpenMy==="function") window.gOpenMy();
};

/* ── 감싸기 ── */
function patchEdit(){
  if(ED._patched) return; ED._patched=true;
  injectPages4();

  /* 철회한 견적은 비교 목록에서 제외 */
  if(typeof renderRequestDetail==="function"){
    var origRRD=renderRequestDetail;
    renderRequestDetail=function(){
      if(CUR.quotes) CUR.quotes=CUR.quotes.filter(function(q){ return q.status!=="철회"; });
      var r=origRRD.apply(this, arguments);
      try{ edOwnerBar(); }catch(e){}
      return r;
    };
  }

  /* 보낸 견적 행에 철회 버튼 */
  if(typeof quoteRow==="function"){
    var origQR=quoteRow;
    quoteRow=function(q, showReq){
      var h=origQR.apply(this, arguments);
      var mine = ME.user && String(q.user_id||"")===String(ME.user.id);
      if(!mine || q.status==="선택됨" || q.status==="철회") return h;
      var btn='<div class="ritem-f" style="margin-top:10px;">'+
        '<button class="gbtn gbtn-w gbtn-sm" onclick="event.stopPropagation();gWithdrawQuote(\''+esc(q.id)+'\')">견적 철회</button></div>';
      return h.replace(/<\/div>$/, btn+'</div>');
    };
  }
}

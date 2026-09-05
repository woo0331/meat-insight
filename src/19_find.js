/* ════════════════════════════════════════════════════════════════════
   비로그인 요청 조회 — 이름 + 전화번호로 내 요청 찾기
   요청은 로그인 없이 올릴 수 있는데, 올리고 나면 다시 찾아볼 방법이
   없었습니다. 견적이 도착해도 확인할 화면이 없어 흐름이 끊깁니다.
   ════════════════════════════════════════════════════════════════════ */

var FD = { name:"", phone:"", rows:null, busy:false };
var FD_KEY = "gori.guest";
var P5_PAGES=["findreq"];

function injectPages5(){
  var nav=document.querySelector(".bnav");
  P5_PAGES.forEach(function(id){
    if($("pg-"+id)) return;
    var d=document.createElement("div");
    d.className="pg"; d.id="pg-"+id;
    d.style.cssText="padding-top:var(--top-pad);padding-bottom:56px;";
    d.innerHTML='<div class="gp" id="'+id+'-body"></div>';
    if(nav) document.body.insertBefore(d, nav); else document.body.appendChild(d);
  });
  if(typeof PGS!=="undefined") P5_PAGES.forEach(function(id){ if(PGS.indexOf(id)<0) PGS.push(id); });
  if(typeof TM!=="undefined"){ TM.findreq="my"; }
}

/* 저장된 번호 (이 브라우저에만 남습니다) */
function fdLoad(){
  try{
    var raw=localStorage.getItem(FD_KEY); if(!raw) return null;
    var o=JSON.parse(raw);
    return (o && o.phone) ? o : null;
  }catch(e){ return null; }
}
function fdSave(name, phone){
  try{ localStorage.setItem(FD_KEY, JSON.stringify({name:name, phone:phone})); }catch(e){}
}
function fdClear(){ try{ localStorage.removeItem(FD_KEY); }catch(e){} }

/* 저장 형식이 제각각이라 흔한 표기를 모두 만들어 조회합니다 */
function fdVariants(v){
  var d=String(v||"").replace(/[^0-9]/g,"");
  if(d.length<9) return [];
  var out={};
  out[d]=1;
  if(d.length===11){
    out[d.slice(0,3)+"-"+d.slice(3,7)+"-"+d.slice(7)]=1;
    out[d.slice(0,3)+" "+d.slice(3,7)+" "+d.slice(7)]=1;
    out[d.slice(0,3)+"."+d.slice(3,7)+"."+d.slice(7)]=1;
  } else if(d.length===10){
    out[d.slice(0,3)+"-"+d.slice(3,6)+"-"+d.slice(6)]=1;
    out[d.slice(0,3)+" "+d.slice(3,6)+" "+d.slice(6)]=1;
    out[d.slice(0,2)+"-"+d.slice(2,6)+"-"+d.slice(6)]=1;
  }
  return Object.keys(out);
}
/* 저장·표시는 항상 하이픈 형식으로 통일합니다 */
function fdPretty(v){
  var d=String(v||"").replace(/[^0-9]/g,"");
  if(d.length===11) return d.slice(0,3)+"-"+d.slice(3,7)+"-"+d.slice(7);
  if(d.length===10) return d.slice(0,3)+"-"+d.slice(3,6)+"-"+d.slice(6);
  return String(v||"");
}
window.gPhoneFmt=function(el){
  var d=String(el.value||"").replace(/[^0-9]/g,"").slice(0,11);
  if(d.length>7) el.value=d.slice(0,3)+"-"+d.slice(3,d.length===10?6:7)+"-"+d.slice(d.length===10?6:7);
  else if(d.length>3) el.value=d.slice(0,3)+"-"+d.slice(3);
  else el.value=d;
};

window.gOpenFindReq=function(){
  if(typeof go==="function") go("findreq");
  var saved=fdLoad();
  if(saved){ FD.name=saved.name||""; FD.phone=saved.phone||""; }
  fdRender();
  if(FD.phone && FD.rows===null) window.gFindMyReqs();
};

function fdRender(){
  var body=$("findreq-body"); if(!body) return;
  var rows=FD.rows;
  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;my&quot;)">← 거래관리</button>'+
      '<div><div class="gp-title">내 요청 찾기</div>'+
      '<div class="gp-sub">로그인 없이 올린 요청은 등록할 때 적은 이름과 전화번호로 찾을 수 있습니다</div></div></div>'+
    '<div class="gcard">'+
      '<label class="glabel">이름 <span class="greq">*</span></label>'+
      '<input class="gin" id="fd-name" placeholder="요청서에 적은 이름" value="'+esc(FD.name)+'">'+
      '<label class="glabel">전화번호 <span class="greq">*</span></label>'+
      '<input class="gin" id="fd-phone" inputmode="numeric" placeholder="010-0000-0000" '+
        'oninput="gPhoneFmt(this)" onkeydown="if(event.key===\'Enter\')gFindMyReqs()" value="'+esc(FD.phone)+'">'+
      '<div class="ghint">요청 등록 화면에서 입력한 것과 같아야 찾을 수 있습니다.</div>'+
      '<div class="grow keep" style="margin-top:14px;">'+
        '<button class="gbtn gbtn-p" id="fd-btn" onclick="gFindMyReqs()">내 요청 찾기</button>'+
        (fdLoad()?'<button class="gbtn gbtn-w" onclick="gForgetGuest()">저장된 번호 지우기</button>':'')+
      '</div>'+
      '<div class="gmsg" id="fd-msg"></div></div>'+
    (rows===null ? '' :
      (rows.length
        ? '<div class="gp-title" style="margin:20px 0 10px;">찾은 요청 '+rows.length+'건</div>'+
          '<div class="rlist">'+rows.map(fdRow).join("")+'</div>'+
          '<div class="ghint" style="margin-top:12px;">회원가입하면 견적 도착 알림을 받고, 여러 기기에서 같은 내역을 볼 수 있습니다. '+
          '<a href="javascript:void(0)" onclick="openModal(\'signup\')" style="color:var(--gn);font-weight:700;">회원가입</a></div>'
        : '<div class="gempty"><div class="gempty-t">해당하는 요청이 없습니다</div>'+
          '<div class="gempty-d">요청서에 적은 이름과 전화번호가 정확한지 확인해주세요.</div>'+
          '<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;rw&quot;)">새 요청 올리기</button></div>'));
}

function fdRow(r){
  var label=(typeof cat8Label==="function")?cat8Label(r.category):(r.category||"요청");
  var st=r.status||"견적대기";
  var qn=Number(r.quote_count)||0;
  return '<div class="ritem" onclick="gOpenRequest(\''+esc(r.id)+'\')">'+
    '<div class="ritem-top"><span class="gbadge gb-or">'+esc(label)+'</span>'+
      '<span class="gbadge '+(st==="완료"?"gb-ok":(st==="진행중"?"gb-bl":"gb-gy"))+'">'+esc(st)+'</span>'+
      '<span style="font-size:12px;color:var(--ink4);margin-left:auto;">'+ago(r.created_at)+'</span></div>'+
    '<div class="ritem-t">'+esc(r.title||r.description||label+" 요청")+'</div>'+
    '<div class="ritem-m"><span>📍 '+esc(r.region||"전국")+'</span>'+
      '<span>'+(qn?('견적 '+qn+'건 도착'):'견적 대기 중')+'</span>'+
      (r.request_number?'<span>'+esc(r.request_number)+'</span>':'')+'</div></div>';
}

window.gFindMyReqs=async function(){
  if(FD.busy) return;
  var nameEl=$("fd-name"), phEl=$("fd-phone");
  var name=nameEl?String(nameEl.value||"").trim():FD.name;
  var phone=phEl?String(phEl.value||"").trim():FD.phone;
  if(!name){ setMsg("fd-msg","이름을 입력해주세요.","err"); return; }
  var vs=fdVariants(phone);
  if(!vs.length){ setMsg("fd-msg","전화번호를 정확히 입력해주세요.","err"); return; }

  FD.name=name; FD.phone=phone; FD.busy=true;
  var btn=$("fd-btn"); if(btn){ btn.disabled=true; btn.textContent="찾는 중…"; }
  setMsg("fd-msg","","");

  var r=await selectSafe("purchase_requests", function(q){
    return q.eq("buyer_name", name).in("buyer_phone", vs).order("created_at",{ascending:false}).limit(50);
  });
  FD.busy=false;
  if(btn){ btn.disabled=false; btn.textContent="내 요청 찾기"; }
  if(r.error){ setMsg("fd-msg","조회에 실패했습니다: "+(r.error.message||""),"err"); return; }

  FD.rows=r.data||[];
  if(FD.rows.length){ FD.phone=fdPretty(phone); fdSave(name, FD.phone); }
  fdRender();
};

window.gForgetGuest=function(){
  fdClear(); FD.name=""; FD.phone=""; FD.rows=null;
  fdRender();
  toast("이 기기에 저장된 번호를 지웠습니다.","ok");
};

/* ── 로그인 안 한 거래관리 화면에 진입점 추가 ── */
function fdMyEntry(){
  var body=$("my-body"); if(!body || ME.user || body.querySelector(".fd-entry")) return;
  var saved=fdLoad();
  var box=document.createElement("div");
  box.className="gcard fd-entry";
  box.style.cssText="margin-top:16px;";
  box.innerHTML='<div class="gcard-t">로그인 없이 올린 요청 찾기</div>'+
    '<div class="ghint" style="margin:-6px 0 12px;">요청서에 적은 이름과 전화번호로 견적 도착 여부를 확인할 수 있습니다.'+
      (saved?' 이 기기에 <b>'+esc(saved.phone)+'</b> 이 저장되어 있습니다.':'')+'</div>'+
    '<button class="gbtn gbtn-p" onclick="gOpenFindReq()">'+(saved?"내 요청 바로 보기":"이름·전화번호로 찾기")+'</button>';
  body.appendChild(box);
}

function patchFind(){
  if(FD._patched) return; FD._patched=true;
  injectPages5();

  /* 로그인 없이 요청을 올리면 이름·번호를 이 기기에 기억해 둡니다 */
  var origSubmit=window.gSubmitRequest;
  if(typeof origSubmit==="function"){
    window.gSubmitRequest=async function(){
      var c=(typeof W!=="undefined" && W.contact) ? {name:W.contact.name, phone:W.contact.phone} : {};
      var r=await origSubmit.apply(this, arguments);
      try{ if(!ME.user && c.name && c.phone) fdSave(c.name, fdPretty(c.phone)); }catch(e){}
      return r;
    };
  }

  var origMy=window.gOpenMy;
  if(typeof origMy==="function"){
    window.gOpenMy=async function(){
      var r=await origMy.apply(this, arguments);
      try{ fdMyEntry(); }catch(e){}
      return r;
    };
  }
}

/* ════════════════════════════════════════════════════════════════════
   업체 정보 수정
   등록(온보딩 4단계)은 있는데 등록하고 나면 고칠 방법이 없었습니다.
   연락처가 바뀌거나 취급 품목이 늘어도 손댈 수가 없어 실사용에서 막힙니다.

   새 화면을 만들지 않고 온보딩 폼(OB)을 그대로 재사용합니다.
   OB.edit 에 업체 id 가 들어 있으면 저장이 insert 대신 update 로 갑니다.
   ════════════════════════════════════════════════════════════════════ */

/* 저장된 행 → 온보딩 폼이 쓰는 모양으로 */
function seToForm(s){
  return {
    name:s.name||"", rep_name:s.rep_name||"", contact:s.contact||"",
    region:s.region||(REGIONS&&REGIONS[0])||"", address:s.address||"",
    category_mains:(s.category_mains||[]).slice(),
    categories:(s.categories||[]).slice(),
    items:(s.items||[]).slice(), services:(s.services||[]).slice(),
    min_qty:s.min_qty||"", lead_time:s.lead_time||"",
    brn:s.brn||"", permit_no:s.permit_no||"", haccp_no:s.haccp_no||"",
    intro:s.intro||s.description||"", instant_note:s.instant_note||""
  };
}

/* 내가 이 업체의 주인인가 */
function seMine(s){
  if(!s) return false;
  if(!ME.user) return false;
  if(s.user_id && String(s.user_id)===String(ME.user.id)) return true;
  return (MY.sups||[]).some(function(x){ return String(x.id)===String(s.id); });
}

window.gEditSupplier=async function(id){
  if(!id) return;
  var s=null;
  if(SD.sup && String(SD.sup.id)===String(id)) s=SD.sup;
  if(!s) s=(MY.sups||[]).find(function(x){ return String(x.id)===String(id); });
  if(!s){
    var r=await selectSafe("suppliers", function(q){ return q.eq("id", id).limit(1); });
    s=(r.data||[])[0]||null;
  }
  if(!s){ toast("업체 정보를 불러올 수 없습니다.","err"); return; }

  OB.edit=String(id);
  OB.step=1;
  OB.data=seToForm(s);
  OB.photos=(s.images||[]).filter(Boolean).map(function(u){ return { url:u, busy:false }; });

  var host=$("pg-sj");
  if(host) host.innerHTML="";           /* 헤더를 다시 그리게 비워둡니다 */
  if(typeof go==="function") go("sj");
  setTimeout(seRender, 30);
};

/* 등록 / 수정에 따라 화면 문구를 맞춥니다.
   obHost() 는 껍데기가 이미 있으면 다시 그리지 않아서, 수정 뒤 등록으로
   돌아오면 제목이 "업체 정보 수정" 인 채로 남습니다. 그래서 매번 맞춰줍니다. */
function seChrome(edit){
  var t=document.querySelector("#pg-sj .gp-title");
  var sub=document.querySelector("#pg-sj .gp-sub");
  var btn=$("ob-submit");
  if(t)   t.textContent   = edit ? "업체 정보 수정" : "업체 등록";
  if(sub) sub.textContent = edit ? "바꾼 내용은 저장하는 즉시 업체 상세에 반영됩니다"
                                 : "등록하면 조건에 맞는 요청이 올라올 때 바로 알림을 받습니다";
  if(btn) btn.textContent = edit ? "수정 저장" : "업체 등록 완료";
  if(edit) seFixRegion();
}

/* 저장된 지역이 "경기 포천시" 처럼 목록에 없는 값일 수 있습니다.
   목록에 없으면 그 값을 그대로 항목으로 넣어 둡니다 — 저장할 때 잃지 않도록. */
function seFixRegion(){
  var sel=$("ob-region"); if(!sel) return;
  var want=OB.data && OB.data.region; if(!want) return;
  var has=Array.prototype.some.call(sel.options, function(o){ return o.value===want; });
  if(!has){
    var op=document.createElement("option");
    op.value=want; op.textContent=want;
    sel.insertBefore(op, sel.firstChild);
  }
  sel.value=want;
}

function seRender(){
  obRender();
  seChrome(!!OB.edit);
}

/* 단계 이동·페이지 진입 때도 문구를 유지합니다 */
function seArmSteps(){
  var origNext=window.gObNext;
  if(typeof origNext==="function"){
    window.gObNext=function(){
      var r=origNext.apply(this, arguments);
      setTimeout(function(){ seChrome(!!OB.edit); }, 0);
      return r;
    };
  }
  var origBack=window.gObBack;
  if(typeof origBack==="function"){
    window.gObBack=function(){
      if(OB.edit && OB.step===1) OB.edit=null;   /* 수정을 취소하고 나감 */
      var r=origBack.apply(this, arguments);
      setTimeout(function(){ seChrome(!!OB.edit); }, 0);
      return r;
    };
  }
  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(p){
      var r=origGo.apply(this, arguments);
      if(p==="sj") setTimeout(function(){ seChrome(!!OB.edit); }, 0);
      return r;
    };
  }
}

/* ── 저장 ── */
function seArmSubmit(){
  var orig=window.gObSubmit;
  if(typeof orig!=="function") return;
  window.gObSubmit=async function(){
    if(!OB.edit) return orig.apply(this, arguments);

    var v=function(id){ var e=$(id); return e?String(e.value||"").trim():""; };
    var instant=(document.querySelector("#ob-instant .gpick-i.on")||{}).textContent==="참여";
    Object.assign(OB.data,{ intro:v("ob-intro")||null, instant_note:v("ob-note")||null });

    var btn=$("ob-submit");
    if(btn){ btn.disabled=true; btn.textContent="저장 중…"; }

    var d=OB.data, id=OB.edit;
    var patch={
      name:d.name, rep_name:d.rep_name, contact:d.contact, region:d.region, address:d.address,
      categories:d.categories||[], category_mains:d.category_mains||[],
      items:d.items||[], services:d.services||[],
      min_qty:d.min_qty||null, lead_time:d.lead_time||null,
      description:d.intro, intro:d.intro,
      images:OB.photos.map(function(p){ return p.url; }).filter(Boolean),
      regions:[d.region], instant_quote:instant, instant_note:d.instant_note
    };
    /* 인증 번호는 심사 대상이라 여기서 바꾸지 않습니다 (인증 화면에서 다시 신청) */
    var r=await updateSafe("suppliers", patch, "id", id);
    if(r.error){
      if(btn){ btn.disabled=false; btn.textContent="수정 저장"; }
      setMsg("ob-msg4","저장 실패: "+((r.error&&r.error.message)||""),"err");
      return;
    }
    /* 알림 설정도 같이 맞춰 둡니다 (없으면 조용히 넘어갑니다) */
    await updateSafe("supplier_prefs",
      { category_mains:d.category_mains||[], regions:[d.region] }, "supplier_id", id);

    OB.edit=null;
    if(typeof loadFromDB==="function") loadFromDB();
    seDone(id, d.name);
  };
}

function seDone(id, name){
  var el=obHost(); if(!el) return;
  el.innerHTML=
    '<div class="gcard" style="text-align:center;padding:34px 22px;">'+
      '<div class="ob-ok">✓</div>'+
      '<div style="font-size:20px;font-weight:700;letter-spacing:-.03em;margin-bottom:8px;">'+esc(name||"업체")+' 정보를 저장했습니다</div>'+
      '<div style="font-size:13.5px;color:var(--ink3);line-height:1.65;">'+
        '업체 상세와 검색 결과에 바로 반영됩니다.</div>'+
    '</div>'+
    '<div class="grow keep">'+
      '<button class="gbtn gbtn-w" onclick="go(&quot;my&quot;)">거래관리</button>'+
      '<button class="gbtn gbtn-p" onclick="curSID=\''+esc(id)+'\';go(&quot;sp&quot;)">내 업체 보기</button>'+
    '</div>';
  OB.step=1; OB.data={}; OB.photos=[];
  window.scrollTo(0,0);
}

/* ── 진입점 1. 업체 상세 (내 업체일 때만) ──
   renderSupplierDetail 은 IIFE 안의 지역 함수라 window 로는 감쌀 수 없습니다. */
function seArmDetail(){
  if(typeof renderSupplierDetail!=="function") return;
  var orig=renderSupplierDetail;
  renderSupplierDetail=function(){
    orig.apply(this, arguments);
    try{
      var s=SD.sup; if(!s || !seMine(s)) return;
      var cta=document.querySelector("#sp-body .sd-cta"); if(!cta) return;
      if(cta.querySelector(".se-edit")) return;
      cta.innerHTML='<button class="gbtn gbtn-w se-edit" style="flex:1;" onclick="gEditSupplier(\''+esc(s.id)+'\')">정보 수정</button>'+
        '<button class="gbtn gbtn-w" style="flex:1;" onclick="gOpenVerify(\''+esc(s.id)+'\')">인증 관리</button>'+
        '<button class="gbtn gbtn-p" style="flex:1;" onclick="gOpenPrefs(\''+esc(s.id)+'\')">알림 설정</button>';
    }catch(e){}
  };
}

/* ── 진입점 2. 거래관리 → 회원·업체정보 → 내 업체 ── */
function seArmMy(){
  if(typeof renderMyPanel!=="function") return;
  var orig=renderMyPanel;
  renderMyPanel=function(){
    orig.apply(this, arguments);
    try{
      if(MY.tab!=="me") return;
      var el=$("my-panel")||document.querySelector("#pg-my .gp"); if(!el) return;
      var rows=el.querySelectorAll(".ritem");
      (MY.sups||[]).forEach(function(s,i){
        var row=rows[i]; if(!row || row.querySelector(".se-edit-sm")) return;
        var b=document.createElement("button");
        b.className="gbtn gbtn-w gbtn-sm se-edit-sm";
        b.style.cssText="margin-top:8px;";
        b.textContent="정보 수정";
        b.setAttribute("onclick","event.stopPropagation();gEditSupplier('"+String(s.id)+"')");
        row.appendChild(b);
      });
    }catch(e){}
  };
}

function patchSupEdit(){
  if(G._supEdit) return; G._supEdit=true;
  seArmSubmit();
  seArmSteps();
  seArmDetail();
  seArmMy();
}

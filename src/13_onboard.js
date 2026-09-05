
/* ════════════════════════════════════════════════════════════════════
   업체 온보딩 — 4단계 통합
   기존에는 등록 / 인증 / 관심분야 / 바로견적이 네 화면에 흩어져 있었습니다.
   한 흐름으로 묶어 이탈을 줄입니다. (원본 pg-sj 폼은 index.html 에 그대로 남아 있습니다)
   ════════════════════════════════════════════════════════════════════ */

var BUCKET="supplier-photos";
var OB={ step:1, id:null, data:{}, photos:[], uploading:0 };
G.OB=OB;

var OB_STEPS=["기본 정보","취급 분야","인증 서류","사진·알림"];

function obBar(n){
  return '<div class="gstep">'+OB_STEPS.map(function(l,i){
    var s=i+1, cls=s<n?"done":(s===n?"on":"");
    return '<div class="gstep-i '+cls+'"><div class="gstep-n">'+(s<n?"✓":s)+'</div><div class="gstep-l">'+l+'</div></div>';
  }).join("")+'</div>';
}
function obHost(){
  var host=$("pg-sj"); if(!host) return null;
  if(!host.querySelector(".ob-wrap")){
    host.innerHTML='<div class="gp ob-wrap">'+
      '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="gObBack()">← 뒤로</button>'+
      '<div><div class="gp-title">업체 등록</div>'+
      '<div class="gp-sub">등록하면 조건에 맞는 요청이 올라올 때 바로 알림을 받습니다</div></div></div>'+
      '<div id="ob-body"></div></div>';
  }
  return $("ob-body");
}
window.gObBack=function(){
  if(OB.step>1){ OB.step--; obRender(); return; }
  if(typeof go==="function") go("h");
};

/* ── STEP 1 기본 정보 ── */
function obStep1(){
  var d=OB.data;
  return obBar(1)+
    '<div class="gcard"><div class="gcard-t">업체 기본 정보</div>'+
      '<label class="glabel">업체명 <span class="greq">*</span></label>'+
      '<input class="gin" id="ob-name" placeholder="○○축산 / ○○도축장" value="'+esc(d.name||"")+'">'+
      '<div class="grow keep">'+
        '<div><label class="glabel">대표자명</label><input class="gin" id="ob-rep" placeholder="홍길동" value="'+esc(d.rep_name||"")+'"></div>'+
        '<div><label class="glabel">연락처 <span class="greq">*</span></label><input class="gin" id="ob-tel" placeholder="010-0000-0000" value="'+esc(d.contact||"")+'"></div>'+
      '</div>'+
      '<label class="glabel">영업 지역 <span class="greq">*</span></label>'+
      '<select class="gin" id="ob-region">'+REGIONS.map(function(r){
        return '<option'+(d.region===r?" selected":"")+'>'+esc(r)+'</option>'; }).join("")+'</select>'+
      '<label class="glabel">주소</label>'+
      '<input class="gin" id="ob-addr" placeholder="경기 안성시 ○○로 12 (선택)" value="'+esc(d.address||"")+'">'+
      '<div class="ghint">주소는 업체 상세에만 표시되며, 요청 매칭에는 위 영업 지역을 사용합니다.</div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="go(&quot;h&quot;)">취소</button>'+
    '<button class="gbtn gbtn-p" onclick="gObNext(1)">다음 →</button></div>';
}

/* ── STEP 2 취급 분야 ── */
function obStep2(){
  var d=OB.data, mains=d.category_mains||[];
  return obBar(2)+
    '<div class="gcard"><div class="gcard-t">어떤 분야를 하시나요? <span class="greq">*</span></div>'+
      '<div class="gpick" id="ob-cats">'+CATS8.map(function(c){
        return '<button type="button" class="gpick-i'+(mains.indexOf(c.k)>=0?" on":"")+'" data-k="'+c.k+
          '" onclick="this.classList.toggle(\'on\')">'+esc(c.nm)+'</button>'; }).join("")+'</div>'+
      '<div class="ghint">선택한 분야의 요청이 올라오면 알림을 받습니다. 여러 개 고를 수 있습니다.</div>'+
      '<label class="glabel">취급 품목</label>'+
      '<input class="gin" id="ob-items" placeholder="한우 지육, 한돈 삼겹, 곱창 (쉼표로 구분)" value="'+esc((d.items||[]).join(", "))+'">'+
      '<label class="glabel">제공 서비스</label>'+
      '<input class="gin" id="ob-svc" placeholder="도축, 발골, 정형, 냉장배송 (쉼표로 구분)" value="'+esc((d.services||[]).join(", "))+'">'+
      '<div class="grow keep">'+
        '<div><label class="glabel">최소 주문·작업량</label><input class="gin" id="ob-minq" placeholder="50kg~ / 1두~" value="'+esc(d.min_qty||"")+'"></div>'+
        '<div><label class="glabel">평균 납기</label><input class="gin" id="ob-lead" placeholder="당일 / 2일 / 협의" value="'+esc(d.lead_time||"")+'"></div>'+
      '</div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="gObBack()">← 이전</button>'+
    '<button class="gbtn gbtn-p" onclick="gObNext(2)">다음 →</button></div>';
}

/* ── STEP 3 인증 ── */
function obStep3(){
  var d=OB.data;
  return obBar(3)+
    '<div class="gcard"><div class="gcard-t">인증 서류</div>'+
      '<div class="ghint" style="margin:-6px 0 14px;">번호를 입력하면 인증 심사가 함께 신청됩니다. '+
      '승인되면 업체 프로필과 견적 카드에 배지가 표시되고, 인증 업체 전용 요청도 받을 수 있습니다.</div>'+
      '<label class="glabel">사업자등록번호</label>'+
      '<input class="gin" id="ob-brn" inputmode="numeric" placeholder="000-00-00000" oninput="gBRNFmt(this)" value="'+esc(d.brn||"")+'">'+
      '<div class="ghint" id="ob-brn-hint"></div>'+
      '<label class="glabel">축산물 영업허가번호</label>'+
      '<input class="gin" id="ob-permit" placeholder="허가번호 (선택)" value="'+esc(d.permit_no||"")+'">'+
      '<label class="glabel">HACCP 인증번호</label>'+
      '<input class="gin" id="ob-haccp" placeholder="인증번호 (선택)" value="'+esc(d.haccp_no||"")+'">'+
      '<div class="gmsg" id="ob-msg3"></div>'+
    '</div>'+
    '<div class="gcard" style="background:var(--gnl);border-color:var(--gnb);">'+
      '<div style="font-size:13.5px;color:var(--ink2);line-height:1.65;">'+
      '<b>지금 없어도 됩니다.</b> 건너뛰고 등록한 뒤 「거래관리 → 업체 인증」에서 언제든 신청할 수 있습니다.</div></div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="gObBack()">← 이전</button>'+
    '<button class="gbtn gbtn-p" onclick="gObNext(3)">다음 →</button></div>';
}

/* ── STEP 4 사진 · 소개 · 알림 ── */
function obStep4(){
  var d=OB.data;
  return obBar(4)+
    '<div class="gcard"><div class="gcard-t">회사 사진</div>'+
      '<div class="ghint" style="margin:-6px 0 12px;">작업장·설비·제품 사진이 있으면 견적 선택률이 크게 올라갑니다. 최대 6장.</div>'+
      '<div class="ph-grid" id="ob-photos"></div>'+
      '<input type="file" id="ob-file" accept="image/*" multiple hidden onchange="gObPickPhotos(this)">'+
      '<div class="gmsg" id="ob-msg-ph"></div>'+
    '</div>'+
    '<div class="gcard"><div class="gcard-t">업체 소개</div>'+
      '<textarea class="gin" id="ob-intro" placeholder="주력 품목, 설비, 거래 조건, 강점을 적어주세요">'+esc(d.intro||"")+'</textarea>'+
    '</div>'+
    '<div class="gcard"><div class="gcard-t">요청 알림</div>'+
      '<label class="glabel">바로견적 참여</label>'+
      '<div class="gpick" id="ob-instant">'+
        '<button type="button" class="gpick-i on" onclick="gPickOne(this)">참여</button>'+
        '<button type="button" class="gpick-i" onclick="gPickOne(this)">미참여</button></div>'+
      '<div class="ghint">참여하면 요청자가 요청을 올린 직후 추천 업체로 먼저 노출됩니다.</div>'+
      '<label class="glabel">기본 조건 한 줄</label>'+
      '<input class="gin" id="ob-note" placeholder="한우 지육 당일 출고 · 경기 무료배송" value="'+esc(d.instant_note||"")+'">'+
      '<div class="gmsg" id="ob-msg4"></div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="gObBack()">← 이전</button>'+
    '<button class="gbtn gbtn-p" id="ob-submit" onclick="gObSubmit()">업체 등록 완료</button></div>';
}

function obRender(){
  var el=obHost(); if(!el) return;
  el.innerHTML=[obStep1,obStep2,obStep3,obStep4][OB.step-1]();
  if(OB.step===4) obPaintPhotos();
  window.scrollTo(0,0);
}

/* ── 단계 이동 + 검증 ── */
window.gObNext=function(from){
  var v=function(id){ var e=$(id); return e?String(e.value||"").trim():""; };
  if(from===1){
    var nm=v("ob-name"), tel=v("ob-tel");
    if(!nm||!tel){ toast("업체명과 연락처는 필수입니다.","err"); return; }
    Object.assign(OB.data,{ name:nm, rep_name:v("ob-rep")||null, contact:tel,
      region:v("ob-region"), address:v("ob-addr")||null });
  }
  if(from===2){
    var cats=[]; document.querySelectorAll("#ob-cats .gpick-i.on").forEach(function(b){ cats.push(b.getAttribute("data-k")); });
    if(!cats.length){ toast("취급 분야를 하나 이상 선택해주세요.","err"); return; }
    var split=function(s){ return s.split(",").map(function(x){return x.trim();}).filter(Boolean); };
    Object.assign(OB.data,{ category_mains:cats,
      categories:cats.map(function(k){ var c=cat8Of(k); return c?primaryLegacy(c):k; }),
      items:split(v("ob-items")), services:split(v("ob-svc")),
      min_qty:v("ob-minq")||null, lead_time:v("ob-lead")||null });
  }
  if(from===3){
    var brn=v("ob-brn");
    if(brn && !validBRN(brn)){ setMsg("ob-msg3","사업자등록번호 10자리를 다시 확인해주세요.","err"); return; }
    Object.assign(OB.data,{ brn:brn||null, permit_no:v("ob-permit")||null, haccp_no:v("ob-haccp")||null });
  }
  OB.step=from+1; obRender();
};

/* ── 사진 ── */
function obPaintPhotos(){
  var el=$("ob-photos"); if(!el) return;
  var cells=OB.photos.map(function(p,i){
    return '<div class="ph-c"'+(p.url?' style="background-image:url('+esc(p.url)+');"':'')+'>'+
      (p.busy?'<span class="ph-busy">올리는 중…</span>':'')+
      '<button class="ph-x" onclick="gObRmPhoto('+i+')" aria-label="삭제">✕</button></div>';
  }).join("");
  var add = OB.photos.length<6
    ? '<button class="ph-add" onclick="document.getElementById(\'ob-file\').click()">'+
      '<span style="font-size:24px;line-height:1;">+</span><span>사진 추가</span></button>' : "";
  el.innerHTML=cells+add;
}
window.gObRmPhoto=function(i){ OB.photos.splice(i,1); obPaintPhotos(); };

/* 휴대폰 사진은 용량이 커서 업로드 전에 줄입니다 */
function shrink(file, maxPx, quality){
  return new Promise(function(res){
    var img=new Image(), url=URL.createObjectURL(file);
    img.onload=function(){
      var w=img.width, h=img.height, m=Math.max(w,h);
      if(m>maxPx){ var r=maxPx/m; w=Math.round(w*r); h=Math.round(h*r); }
      var cv=document.createElement("canvas"); cv.width=w; cv.height=h;
      cv.getContext("2d").drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      cv.toBlob(function(b){ res(b||file); }, "image/jpeg", quality||0.82);
    };
    img.onerror=function(){ URL.revokeObjectURL(url); res(file); };
    img.src=url;
  });
}

window.gObPickPhotos=async function(input){
  var files=Array.prototype.slice.call(input.files||[]);
  input.value="";
  if(!files.length) return;
  if(!ME.user){ setMsg("ob-msg-ph","사진 업로드는 로그인이 필요합니다. 사진 없이 등록한 뒤 나중에 추가할 수 있습니다.","err"); return; }
  var c=client(); if(!c||!c.storage){ setMsg("ob-msg-ph","저장소에 연결할 수 없습니다.","err"); return; }
  var room=6-OB.photos.length;
  files=files.slice(0,room);
  for(var i=0;i<files.length;i++){
    var f=files[i];
    if(!/^image\//.test(f.type)){ continue; }
    var slot={ busy:true, url:null }; OB.photos.push(slot); obPaintPhotos();
    try{
      var blob=await shrink(f, 1600, 0.82);
      var path=(ME.user.id)+"/"+Date.now()+"-"+Math.random().toString(36).slice(2,8)+".jpg";
      var up=await c.storage.from(BUCKET).upload(path, blob, { contentType:"image/jpeg", upsert:false });
      if(up.error) throw up.error;
      var pub=c.storage.from(BUCKET).getPublicUrl(path);
      slot.url=(pub&&pub.data&&pub.data.publicUrl)||null;
      slot.path=path; slot.busy=false;
      if(!slot.url) throw new Error("URL 생성 실패");
      clearMsg("ob-msg-ph");
    }catch(e){
      OB.photos.splice(OB.photos.indexOf(slot),1);
      var m=String((e&&e.message)||e);
      setMsg("ob-msg-ph", /not found|bucket/i.test(m)
        ? "사진 저장소가 아직 없습니다. db/phase5_storage.sql 을 실행하거나 Supabase → Storage 에서 supplier-photos 버킷을 만들어주세요. (사진 없이 등록해도 됩니다)"
        : "업로드 실패: "+m, "err");
    }
    obPaintPhotos();
  }
};

/* ── 저장 ── */
window.gObSubmit=async function(){
  var v=function(id){ var e=$(id); return e?String(e.value||"").trim():""; };
  var instant=(document.querySelector("#ob-instant .gpick-i.on")||{}).textContent==="참여";
  Object.assign(OB.data,{ intro:v("ob-intro")||null, instant_note:v("ob-note")||null });

  var btn=$("ob-submit"); if(btn){ btn.disabled=true; btn.textContent="등록 중…"; }
  var d=OB.data;
  var payload={
    name:d.name, rep_name:d.rep_name, contact:d.contact, region:d.region, address:d.address,
    categories:d.categories||[], category_mains:d.category_mains||[],
    items:d.items||[], services:d.services||[],
    min_qty:d.min_qty, lead_time:d.lead_time,
    description:d.intro, intro:d.intro,
    brn:d.brn, rating:0, is_verified:false,
    images:OB.photos.map(function(p){ return p.url; }).filter(Boolean),
    regions:[d.region], instant_quote:instant, instant_note:d.instant_note,
    notify_on:true, user_id: ME.user?ME.user.id:null
  };
  var r=await insertSafe("suppliers", payload);
  if(r.error){
    if(btn){ btn.disabled=false; btn.textContent="업체 등록 완료"; }
    setMsg("ob-msg4","등록 실패: "+(r.error.message||""),"err"); return;
  }
  var sup=(r.data&&r.data[0])||null;
  var supId=sup?String(sup.id):null;
  OB.id=supId;

  /* 인증 신청 자동 접수 */
  var reqs=[];
  if(d.brn)        reqs.push({kind:"brn",              number:d.brn});
  if(d.permit_no)  reqs.push({kind:"livestock_permit", number:d.permit_no});
  if(d.haccp_no)   reqs.push({kind:"haccp",            number:d.haccp_no});
  var vOk=0;
  for(var i=0;i<reqs.length && supId;i++){
    var vr=await insertSafe("verifications",{
      target_type:"supplier", target_id:supId, user_id:ME.user?ME.user.id:null,
      kind:reqs[i].kind, number:reqs[i].number,
      holder:(d.name+(d.rep_name?" · "+d.rep_name:"")), status:"심사중" });
    if(!vr.error) vOk++;
  }
  /* 알림 설정 저장 */
  if(supId){
    await insertSafe("supplier_prefs",{ supplier_id:supId, user_id:ME.user?ME.user.id:null,
      category_mains:d.category_mains||[], regions:[d.region], notify_on:true });
  }
  if(typeof loadFromDB==="function") loadFromDB();
  obDone(vOk, reqs.length, payload.images.length);
};

function obDone(vOk, vTotal, photos){
  var el=obHost(); if(!el) return;
  var d=OB.data;
  el.innerHTML=
    '<div class="gcard" style="text-align:center;padding:34px 22px;">'+
      '<div class="ob-ok">✓</div>'+
      '<div style="font-size:20px;font-weight:700;letter-spacing:-.03em;margin-bottom:8px;">'+esc(d.name)+' 등록 완료</div>'+
      '<div style="font-size:13.5px;color:var(--ink3);line-height:1.65;">'+
        '선택하신 분야의 요청이 올라오면 알림을 받습니다.<br>'+
        (vTotal? (vOk?('인증 '+vOk+'건은 심사 중입니다. 승인되면 배지가 표시됩니다.'):'인증 신청은 나중에 다시 시도해주세요.') : '인증을 등록하면 요청자에게 먼저 노출됩니다.')+
      '</div>'+
    '</div>'+
    '<div class="gcard"><div class="gcard-t">다음에 하면 좋은 것</div>'+
      '<div class="gsum">'+
        (photos? '' : '<div class="gsum-r"><div class="gsum-k">사진</div><div class="gsum-v">작업장 사진을 올리면 견적 선택률이 올라갑니다</div></div>')+
        (vTotal? '' : '<div class="gsum-r"><div class="gsum-k">인증</div><div class="gsum-v">사업자·HACCP·축산물 허가를 등록하세요</div></div>')+
        '<div class="gsum-r"><div class="gsum-k">알림 설정</div><div class="gsum-v">지역·최소 거래 규모를 조정할 수 있습니다</div></div>'+
      '</div>'+
      '<div class="grow keep" style="margin-top:14px;">'+
        '<button class="gbtn gbtn-w gbtn-sm" onclick="gOpenVerify('+(OB.id?"'"+esc(OB.id)+"'":"")+')">업체 인증</button>'+
        '<button class="gbtn gbtn-w gbtn-sm" onclick="gOpenPrefs('+(OB.id?"'"+esc(OB.id)+"'":"")+')">알림 설정</button>'+
      '</div></div>'+
    '<div class="grow keep">'+
      '<button class="gbtn gbtn-w" onclick="go(&quot;reqs&quot;)">실시간 요청 보기</button>'+
      (OB.id?'<button class="gbtn gbtn-p" onclick="curSID=\''+esc(OB.id)+'\';go(&quot;sp&quot;)">내 업체 보기</button>':'')+
    '</div>';
  OB={ step:1, id:OB.id, data:{}, photos:[], uploading:0 }; G.OB=OB;
  window.scrollTo(0,0);
}

/* ── 기존 진입점 연결 ── */
function patchOnboard(){
  var orig=window.go;
  window.go=function(p){
    orig(p);
    if(p==="sj"){ OB.step=1; obRender(); }
  };
}

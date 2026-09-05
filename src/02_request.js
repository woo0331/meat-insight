
/* ════════════════════════════════════════════════════════════════════
   요청 등록 — 3단계
   STEP1 무엇이 필요한지 선택 → STEP2 필요 조건 입력 → STEP3 확인 후 등록
   카테고리에 따라 STEP2 입력 항목이 달라집니다.
   ════════════════════════════════════════════════════════════════════ */

var F = {
  sel:  function(id,l,opts,req){ return {id:id,l:l,t:"select",opts:opts,req:!!req}; },
  txt:  function(id,l,ph,req){ return {id:id,l:l,t:"text",ph:ph,req:!!req}; },
  n:    function(id,l,ph,unit,req){ return {id:id,l:l,t:"number",ph:ph,unit:unit,req:!!req}; },
  money:function(id,l,ph,unit){ return {id:id,l:l,t:"money",ph:ph,unit:unit}; },
  date: function(id,l,req){ return {id:id,l:l,t:"date",req:!!req}; },
  time: function(id,l){ return {id:id,l:l,t:"time"}; },
  chips:function(id,l,opts,req){ return {id:id,l:l,t:"chips",opts:opts,req:!!req}; },
  area: function(id,l,ph){ return {id:id,l:l,t:"textarea",ph:ph}; }
};
var REGIONS=["서울","경기","인천","강원","충북","충남·대전·세종","전북","전남·광주","경북·대구","경남·부산·울산","제주","전국"];
var TEMP=["냉장","냉동","상온","상관없음"];

/* 8개 대분류별 STEP2 입력 항목 */
var REQ_FORMS = {
  meat: [
    F.chips("species","축종",["한우","육우","한돈","수입 소","수입 돼지","오리·닭","기타"],true),
    F.txt("part","부위 / 품목","등심, 삼겹살, 곱창, 지육 …",true),
    F.sel("grade","등급",["상관없음","1++","1+","1등급","2등급","등외","수입 등급"]),
    F.n("qty","수량","100","kg",true),
    F.money("price","희망 단가","65,000","원/kg"),
    F.chips("temp","냉장 / 냉동",TEMP,true),
    F.sel("cycle","납품 주기",["일회성","주 1회","주 2~3회","월 정기","협의"]),
    F.sel("region","희망 지역",REGIONS,true),
    F.date("deadline","희망 납품일"),
    F.area("etc","추가 조건","원산지, 포장 형태, 도축일자, 인증 요구사항 등")
  ],
  process: [
    F.chips("work","작업 종류",["발골","정형","세절","포장","OEM 생산","도축","출하"],true),
    F.chips("species","축종",["한우","육우","한돈","수입육","기타"]),
    F.txt("item","품목 / 제품","한우 지육, 육포, 소시지, 양념육 …",true),
    F.n("qty","물량","500","kg 또는 두",true),
    F.sel("haccp","HACCP 필요 여부",["상관없음","선호","필수"]),
    F.sel("recipe","레시피 보유",["해당 없음","보유","미보유(개발 요청)"]),
    F.sel("region","작업 희망 지역",REGIONS,true),
    F.date("deadline","희망 완료일"),
    F.area("etc","추가 조건","가공 방식, 포장 규격, 라벨, 납기 조건 등")
  ],
  logi: [
    F.chips("temp","운송 유형",["냉장","냉동","지육 운송","상온"],true),
    F.txt("from","출발지","경기 안성시",true),
    F.txt("to","도착지","서울 마포구",true),
    F.n("volume","물량","5","톤 또는 파레트",true),
    F.sel("cycle","운송 주기",["단건","주 1회","주 2~3회","매일","월 정기"],true),
    F.date("deadline","희망 운송일"),
    F.money("budget","희망 운임","300,000","원/회"),
    F.area("etc","추가 조건","온도 조건, 상하차 방식, 차량 규격 등")
  ],
  labor: [
    F.chips("work","필요 업무",["발골","정형","세절","포장","생산 보조","상하차","청소·위생","기타"],true),
    F.date("work_date","작업 날짜",true),
    F.time("start","시작 시간"),
    F.time("end","종료 시간"),
    F.n("headcount","필요 인원","2","명",true),
    F.money("pay","일당 / 시급","150,000","원"),
    F.sel("pay_type","급여 형태",["일당","시급"],true),
    F.sel("region","근무 지역",REGIONS,true),
    F.txt("address","상세 주소","경기 안성시 ○○로 (선택)"),
    F.sel("exp","필요 경력",["무관","6개월 이상","1년 이상","3년 이상","5년 이상"],true),
    F.area("etc","추가 조건","식사 제공, 복장, 준비물, 교통편 등")
  ],
  job: [
    F.chips("role","모집 직무",["정육사","발골사","정형사","세절기사","생산직","포장직","배송직","영업직","사무직","점장","기타"],true),
    F.sel("employment","고용 형태",["정규직","계약직","아르바이트"],true),
    F.sel("exp","요구 경력",["신입 가능","1년 이상","3년 이상","5년 이상","10년 이상"],true),
    F.money("pay","급여","300","만원/월"),
    F.n("headcount","모집 인원","1","명"),
    F.sel("region","근무 지역",REGIONS,true),
    F.txt("company","업체명","○○정육공장",true),
    F.area("etc","근무 조건","4대보험, 숙소, 식사, 근무시간, 우대사항 등")
  ],
  equip: [
    F.chips("item","품목",["육절기","골절기","슬라이서","진공포장기","냉장·냉동설비","쇼케이스","포장재","소모품","기타"],true),
    F.txt("spec","상세 사양 / 모델","용량, 규격, 희망 모델명 등"),
    F.chips("condition","신품 / 중고",["신품","중고","상관없음"],true),
    F.n("qty","수량","1","대 또는 세트",true),
    F.money("budget","예산","3,000,000","원"),
    F.sel("region","설치·배송 지역",REGIONS,true),
    F.date("deadline","희망 납품일"),
    F.area("etc","추가 조건","설치·A/S, 전압, 반입 조건 등")
  ],
  startup: [
    F.chips("biz","업종",["정육점","고깃집","정육식당","육가공 공장","무인 정육","기타"],true),
    F.chips("need","필요한 것",["창업 컨설팅","인테리어","설비","간판","상권 분석","전체"],true),
    F.n("area","면적","30","평"),
    F.money("budget","예산","50,000,000","원"),
    F.sel("region","지역",REGIONS,true),
    F.date("deadline","희망 오픈일"),
    F.area("etc","추가 조건","현재 진행 상황, 점포 유무, 원하는 콘셉트 등")
  ],
  haccp: [
    F.chips("service","필요 서비스",["HACCP 인증","위생 점검","세무·기장","노무 관리","경영 컨설팅","마케팅"],true),
    F.txt("biz","사업장 업종","육가공 공장, 정육점, 도축장 …",true),
    F.sel("scale","사업장 규모",["1~5인","6~20인","21~50인","51인 이상"]),
    F.sel("stage","진행 단계",["처음 알아보는 중","준비 중","심사 예정","갱신·유지"]),
    F.sel("region","지역",REGIONS,true),
    F.date("deadline","희망 완료일"),
    F.money("budget","예산","3,000,000","원"),
    F.area("etc","추가 조건","현재 상태, 요청 사항 등")
  ]
};

var W = { step:1, cat:null, sub:null, data:{}, contact:{} };
G.W = W;

function catList(){ return (typeof CATS8!=="undefined") ? CATS8 : []; }
function catOfKey(k){ return (typeof cat8Of==="function") ? cat8Of(k) : null; }

function stepBar(n){
  var labels=["무엇이 필요한지","필요 조건 입력","확인 후 등록"];
  return '<div class="gstep">'+labels.map(function(l,i){
    var s=i+1, cls = s<n ? "done" : (s===n ? "on" : "");
    return '<div class="gstep-i '+cls+'"><div class="gstep-n">'+(s<n?"✓":s)+'</div><div class="gstep-l">STEP'+s+'. '+l+'</div></div>';
  }).join("")+'</div>';
}

/* ── STEP 1 ── */
function step1(){
  W.step=1;
  var body=$("rw-wizard"); if(!body) return;
  body.innerHTML = stepBar(1)+
    '<div class="gcard"><div class="gcard-t">어떤 분야가 필요하세요?</div>'+
      '<div class="gcat-grid">'+catList().map(function(c){
        return '<button class="gcat-c'+(W.cat===c.k?" on":"")+'" onclick="gPickCat(\''+c.k+'\')">'+
          '<div class="gcat-ic">'+(typeof cat8Icon==="function"?cat8Icon(c,22):"")+'</div>'+
          '<div class="gcat-n">'+esc(c.nm)+'</div></button>';
      }).join("")+'</div>'+
      '<div id="rw-subs"></div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="go(&quot;h&quot;)">취소</button>'+
    '<button class="gbtn gbtn-p" id="rw-next1" onclick="gStep2()" disabled>다음 단계 →</button></div>';
  if(W.cat) renderSubs();
}
window.gPickCat=function(k){
  W.cat=k; W.sub=null; W.data={};
  document.querySelectorAll(".gcat-c").forEach(function(el,i){ el.classList.toggle("on", catList()[i] && catList()[i].k===k); });
  renderSubs();
  var b=$("rw-next1"); if(b) b.disabled=false;
};
function renderSubs(){
  var c=catOfKey(W.cat), box=$("rw-subs"); if(!c||!box) return;
  box.innerHTML='<div class="glabel" style="margin-top:18px;">구체적으로 무엇인가요? <span style="font-weight:600;color:var(--ink4);">(선택)</span></div>'+
    '<div class="gpick">'+c.sub.map(function(s){
      return '<button class="gpick-i'+(W.sub===s?" on":"")+'" onclick="gPickSub2(\''+esc(s)+'\')">'+esc(s)+'</button>';
    }).join("")+'</div>';
}
window.gPickSub2=function(s){
  W.sub = (W.sub===s) ? null : s;
  renderSubs();
};

/* ── STEP 2 ── */
window.gStep2=function(){
  if(!W.cat){ toast("분야를 선택해주세요.","err"); return; }
  W.step=2;
  var c=catOfKey(W.cat), fields=REQ_FORMS[W.cat]||REQ_FORMS.meat;
  var body=$("rw-wizard"); if(!body) return;
  body.innerHTML = stepBar(2)+
    '<div class="gcard"><div class="gcard-t">'+esc(c?c.nm:"")+(W.sub?" · "+esc(W.sub):"")+' — 필요 조건</div>'+
      fields.map(fieldHtml).join("")+
    '</div>'+
    '<div class="gcard"><div class="gcard-t">연락처</div>'+
      '<label class="glabel">상호명</label><input class="gin" id="w-company" placeholder="업체명 (선택)" value="'+esc(W.contact.company||"")+'">'+
      '<div class="grow keep">'+
        '<div><label class="glabel">이름 <span class="greq">*</span></label><input class="gin" id="w-name" placeholder="홍길동" value="'+esc(W.contact.name||ME.name||"")+'"></div>'+
        '<div><label class="glabel">연락처 <span class="greq">*</span></label><input class="gin" id="w-phone" placeholder="010-0000-0000" value="'+esc(W.contact.phone||"")+'"></div>'+
      '</div>'+
      '<label class="glabel">비교 우선순위</label>'+
      '<div class="gpick" id="w-priority">'+["가격","품질","납기","인증","거래실적"].map(function(p,i){
        return '<button class="gpick-i'+(i<3?" on":"")+'" onclick="this.classList.toggle(\'on\')">'+p+'</button>';
      }).join("")+'</div>'+
      '<label class="glabel">공개 범위</label>'+
      '<select class="gin" id="w-visibility"><option value="all">전체 업체에 공개</option><option value="cert">인증 업체에만 공개</option><option value="private">비공개 매칭</option></select>'+
      '<div class="ghint">공개 범위가 넓을수록 더 많은 견적을 받을 수 있습니다.</div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="gStep1()">← 이전</button>'+
    '<button class="gbtn gbtn-p" onclick="gStep3()">다음 단계 →</button></div>';
  restoreFields(fields);
  window.scrollTo(0,0);
};
window.gStep1=function(){ step1(); window.scrollTo(0,0); };

function fieldHtml(f){
  var id="w-"+f.id, req=f.req?' <span class="greq">*</span>':'';
  var h='<label class="glabel">'+esc(f.l)+req+'</label>';
  if(f.t==="select") h+='<select class="gin" id="'+id+'">'+f.opts.map(function(o){ return '<option>'+esc(o)+'</option>'; }).join("")+'</select>';
  else if(f.t==="chips") h+='<div class="gpick" id="'+id+'" data-field="'+f.id+'">'+f.opts.map(function(o){
      return '<button type="button" class="gpick-i" onclick="gChip(this)">'+esc(o)+'</button>'; }).join("")+'</div>';
  else if(f.t==="textarea") h+='<textarea class="gin" id="'+id+'" placeholder="'+esc(f.ph||"")+'"></textarea>';
  else if(f.t==="money") h+='<div style="position:relative;"><input class="gin" id="'+id+'" inputmode="numeric" placeholder="'+esc(f.ph||"")+'" oninput="gNumFmt(this)">'+
      (f.unit?'<span style="position:absolute;right:13px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--ink4);font-weight:600;">'+esc(f.unit)+'</span>':'')+'</div>';
  else if(f.t==="number") h+='<div style="position:relative;"><input class="gin" id="'+id+'" inputmode="numeric" placeholder="'+esc(f.ph||"")+'">'+
      (f.unit?'<span style="position:absolute;right:13px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--ink4);font-weight:600;">'+esc(f.unit)+'</span>':'')+'</div>';
  else h+='<input class="gin" id="'+id+'" type="'+(f.t==="date"?"date":(f.t==="time"?"time":"text"))+'" placeholder="'+esc(f.ph||"")+'">';
  return h;
}
window.gChip=function(el){
  var wrap=el.parentNode, multi=wrap.id==="w-work"||wrap.id==="w-need"||wrap.id==="w-service"||wrap.id==="w-role"||wrap.id==="w-item";
  if(!multi) wrap.querySelectorAll(".gpick-i").forEach(function(b){ if(b!==el) b.classList.remove("on"); });
  el.classList.toggle("on");
};
window.gNumFmt=function(el){
  var raw=el.value.replace(/[^0-9]/g,"");
  el.value = raw ? parseInt(raw,10).toLocaleString("ko-KR") : "";
};
function readFields(fields){
  var out={};
  fields.forEach(function(f){
    var el=$("w-"+f.id); if(!el) return;
    if(f.t==="chips"){
      var v=[]; el.querySelectorAll(".gpick-i.on").forEach(function(b){ v.push(b.textContent.trim()); });
      out[f.id]=v;
    } else out[f.id]=String(el.value||"").trim();
  });
  return out;
}
function restoreFields(fields){
  fields.forEach(function(f){
    var v=W.data[f.id]; if(v==null) return;
    var el=$("w-"+f.id); if(!el) return;
    if(f.t==="chips"){ el.querySelectorAll(".gpick-i").forEach(function(b){ b.classList.toggle("on", (v||[]).indexOf(b.textContent.trim())>=0); }); }
    else el.value=v;
  });
}

/* ── STEP 3 (확인) ── */
window.gStep3=function(){
  var fields=REQ_FORMS[W.cat]||REQ_FORMS.meat;
  W.data=readFields(fields);
  W.contact={ company:($("w-company")||{}).value||"", name:(($("w-name")||{}).value||"").trim(), phone:(($("w-phone")||{}).value||"").trim() };
  var pr=[]; document.querySelectorAll("#w-priority .gpick-i.on").forEach(function(b){ pr.push(b.textContent.trim()); });
  W.priority=pr.join(","); W.visibility=(($("w-visibility")||{}).value)||"all";

  var miss=[];
  fields.forEach(function(f){
    if(!f.req) return;
    var v=W.data[f.id];
    if(f.t==="chips"){ if(!v||!v.length) miss.push(f.l); }
    else if(!v) miss.push(f.l);
  });
  if(!W.contact.name) miss.push("이름");
  if(!W.contact.phone) miss.push("연락처");
  if(miss.length){ toast("필수 항목을 입력해주세요: "+miss.slice(0,3).join(", ")+(miss.length>3?" 외 "+(miss.length-3)+"개":""),"err"); return; }

  W.step=3;
  var c=catOfKey(W.cat);
  var rows=fields.map(function(f){
    var v=W.data[f.id]; if(!v||(Array.isArray(v)&&!v.length)) return "";
    var txt=Array.isArray(v)?v.join(", "):v;
    if(f.unit) txt+=" "+f.unit;
    return '<div class="gsum-r"><div class="gsum-k">'+esc(f.l)+'</div><div class="gsum-v">'+esc(txt)+'</div></div>';
  }).join("");

  $("rw-wizard").innerHTML = stepBar(3)+
    '<div class="gcard"><div class="gcard-t">이대로 등록할까요?</div>'+
      '<div class="gsum">'+
        '<div class="gsum-r"><div class="gsum-k">분야</div><div class="gsum-v">'+esc(c?c.nm:"")+(W.sub?" · "+esc(W.sub):"")+'</div></div>'+
        rows+
        '<div class="gsum-r"><div class="gsum-k">연락처</div><div class="gsum-v">'+esc(W.contact.name)+' · '+esc(W.contact.phone)+(W.contact.company?" · "+esc(W.contact.company):"")+'</div></div>'+
        (W.priority?'<div class="gsum-r"><div class="gsum-k">비교 우선순위</div><div class="gsum-v">'+esc(W.priority)+'</div></div>':'')+
        '<div class="gsum-r"><div class="gsum-k">공개 범위</div><div class="gsum-v">'+({all:"전체 업체에 공개",cert:"인증 업체에만 공개",private:"비공개 매칭"}[W.visibility])+'</div></div>'+
      '</div>'+
      '<div class="ghint" style="margin-top:12px;">등록하면 조건에 맞는 업체에 알림이 전달되고, 견적이 도착하면 한 화면에서 비교할 수 있습니다.</div>'+
      '<div class="gmsg" id="rw-submit-msg"></div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="gStep2()">← 수정하기</button>'+
    '<button class="gbtn gbtn-p" id="rw-submit" onclick="gSubmitRequest()">요청 등록하기</button></div>';
  window.scrollTo(0,0);
};

function buildTitle(){
  var c=catOfKey(W.cat), d=W.data;
  var parts=[];
  if(d.part) parts.push(d.part);
  else if(d.item) parts.push(Array.isArray(d.item)?d.item.join("·"):d.item);
  else if(d.work) parts.push(Array.isArray(d.work)?d.work.join("·"):d.work);
  else if(d.service) parts.push(Array.isArray(d.service)?d.service.join("·"):d.service);
  else if(d.role) parts.push(Array.isArray(d.role)?d.role.join("·"):d.role);
  else if(d.biz) parts.push(Array.isArray(d.biz)?d.biz.join("·"):d.biz);
  if(d.qty) parts.push(d.qty+"kg");
  else if(d.volume) parts.push(d.volume+"톤");
  else if(d.headcount) parts.push(d.headcount+"명");
  if(!parts.length) parts.push(c?c.nm:"요청");
  return parts.join(" ") + " " + (W.cat==="job"?"채용":(W.cat==="labor"?"인력 요청":"요청"));
}
function buildSummary(){
  var fields=REQ_FORMS[W.cat]||[];
  return fields.map(function(f){
    var v=W.data[f.id]; if(!v||(Array.isArray(v)&&!v.length)) return null;
    return f.l+": "+(Array.isArray(v)?v.join(", "):v)+(f.unit?f.unit:"");
  }).filter(Boolean).join(" / ");
}

window.gSubmitRequest=async function(){
  var btn=$("rw-submit"); if(btn){ btn.disabled=true; btn.textContent="등록 중…"; }
  var c=catOfKey(W.cat);
  var legacy = (typeof primaryLegacy==="function" && c) ? primaryLegacy(c) : (c?c.nm:"기타");
  var d=W.data;
  var payload = {
    request_number: "REQ-"+Date.now(),
    category: legacy,
    category_main: W.cat,
    subcategory: W.sub||null,
    title: buildTitle(),
    status: "견적대기",
    quote_count: 0,
    buyer_name: W.contact.name,
    buyer_phone: W.contact.phone,
    buyer_company: W.contact.company||null,
    region: d.region || d.to || d.from || "전국",
    budget_text: d.price || d.budget || d.pay || null,
    description: buildSummary(),
    detail: d,
    deadline: d.deadline || d.work_date || null,
    priority: W.priority || null,
    visibility: W.visibility || "all",
    user_id: ME.user ? ME.user.id : null
  };
  var r = await insertSafe("purchase_requests", payload);
  if(btn){ btn.disabled=false; btn.textContent="요청 등록하기"; }
  if(r.error){
    setMsg("rw-submit-msg", "등록에 실패했습니다: "+(r.error.message||"알 수 없는 오류"), "err");
    return;
  }
  var newId = (r.data && r.data[0]) ? r.data[0].id : null;
  var note = r.dropped && r.dropped.length
    ? " (일부 상세 항목은 DB 확장 전이라 요약으로 저장되었습니다)" : "";
  toast("요청이 등록되었습니다"+note, "ok");
  W = G.W = { step:1, cat:null, sub:null, data:{}, contact:W.contact };
  if(typeof loadFromDB==="function") loadFromDB();
  if(newId) window.gOpenRequest(newId);
  else if(typeof go==="function") go("reqs");
};

/* 기존 initRW / goReq / goUX 를 3단계 마법사로 교체 (원본 함수는 index.html 에 그대로 남아 있습니다) */
window.initRW=function(){
  var host=$("pg-rw"); if(!host) return;
  var inner=host.querySelector(".gp-wizard");
  if(!inner){
    host.innerHTML='<div class="gp gp-wizard">'+
      '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="gWizBack()">← 뒤로</button>'+
      '<div><div class="gp-title">요청 등록</div><div class="gp-sub">필요한 것을 올리면 업체가 견적·제안을 보냅니다</div></div></div>'+
      '<div id="rw-wizard"></div></div>';
  }
  step1();
};
window.gWizBack=function(){
  if(W.step===3) return window.gStep2();
  if(W.step===2) return window.gStep1();
  if(typeof go==="function") go("h");
};
/* 히어로 검색어를 3단계 폼의 알맞은 칸으로 옮겨 담습니다
   (index.html 의 구버전은 rw-f-cond 를 찾으므로 여기서 교체) */
window.applyHeroQuery=function(){
  if(!HERO_Q) return;
  var q=HERO_Q; HERO_Q="";
  var order=["w-part","w-item","w-spec","w-biz","w-etc"];
  for(var i=0;i<order.length;i++){
    var el=$(order[i]);
    /* 칩(div) 이 아니라 실제 입력칸에만 넣습니다 */
    if(el && (el.tagName==="INPUT"||el.tagName==="TEXTAREA") && !String(el.value||"").trim()){ el.value=q; return; }
  }
  var etc=$("w-etc");
  if(etc) etc.value=(etc.value?etc.value+" / ":"")+q;
};

window.goReq=function(cat){
  var key=(typeof key8Of==="function") ? key8Of(cat) : null;
  W.cat = key || "meat";
  W.sub = null; W.data={};
  if(typeof go==="function") go("rw");
  setTimeout(function(){ window.gStep2(); window.applyHeroQuery(); }, 60);
};
window.goUX=function(){
  W.cat="job"; W.sub=null; W.data={};
  if(typeof go==="function") go("rw");
  setTimeout(function(){ window.gStep2(); window.applyHeroQuery(); }, 60);
};
window.pickSub=function(k,sub){
  W.cat=k||"meat"; W.sub=sub||null; W.data={};
  if(typeof go==="function") go("rw");
  setTimeout(function(){ window.gStep2(); }, 60);
};

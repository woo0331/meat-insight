/* ════════════════════════════════════════════════════════════════════
   46_restore — 새로고침·뒤로가기로 들어와도 빈 화면이 나오지 않게

   상세·폼 화면은 gOpenX() 안에서 go() 를 부른 다음 본문을 그립니다.
   그래서 주소창에 #/chats 를 직접 치거나 뒤로가기로 돌아오면
   go() 만 불리고 본문은 빈 칸으로 남습니다 (라우터가 go() 만 부릅니다).

   여기서는 go() 를 바깥에서 감싸, 화면이 켜졌는데 본문이 비어 있으면
   ① 인자가 필요 없는 화면은 원래 여는 함수를 다시 부르고
   ② 상세 id 가 있어야 하는 화면은 돌아갈 길이 있는 빈 상태를 그립니다.
   기존 함수는 하나도 건드리지 않습니다.
   ════════════════════════════════════════════════════════════════════ */

var RS={ busy:false, timer:null };

/* 화면 이름 — 빠져 있던 다섯 곳 (문서 제목·스크린리더 안내가 "고리" 로만 나왔습니다) */
try{
  if(typeof RT_TITLE!=="undefined"){
    if(!RT_TITLE.sj)      RT_TITLE.sj="업체 등록";
    if(!RT_TITLE.guide)   RT_TITLE.guide="이용 가이드";
    if(!RT_TITLE.report)  RT_TITLE.report="신고하기";
    if(!RT_TITLE.contact) RT_TITLE.contact="문의하기";
    if(!RT_TITLE.about)   RT_TITLE.about="고리 소개";
  }
}catch(e){}

/* ① 인자 없이 다시 열 수 있는 화면 */
var RS_OPEN={
  chats:   function(){ return window.gOpenChatList; },
  findreq: function(){ return window.gOpenFindReq; },
  prefs:   function(){ return window.gOpenPrefs; },
  verify:  function(){ return window.gOpenVerify; },
  djnew:   function(){ return window.gOpenDJNew; },
  wprof:   function(){ return window.gOpenWProf; }
};

/* ② id 가 있어야 열리는 화면 — 제목 · 설명 · 돌아갈 곳 · 버튼 글자 */
var RS_LOST={
  sp:      ["업체를 찾을 수 없습니다","주소가 잘못되었거나 삭제된 업체일 수 있습니다.","suppliers","업체 목록으로"],
  reqd:    ["요청을 찾을 수 없습니다","주소가 잘못되었거나 이미 마감된 요청일 수 있습니다.","reqs","요청 목록으로"],
  quote:   ["견적을 보낼 요청이 없습니다","요청 목록에서 요청을 고른 뒤 견적을 보내주세요.","reqs","요청 목록으로"],
  review:  ["후기를 남길 거래가 없습니다","거래관리에서 완료된 거래를 고르면 후기를 쓸 수 있습니다.","my","거래관리로"],
  order:   ["거래를 찾을 수 없습니다","이미 끝났거나 삭제된 거래일 수 있습니다.","my","거래관리로"],
  reqedit: ["수정할 요청이 없습니다","거래관리의 내 요청에서 고칠 요청을 골라주세요.","my","거래관리로"],
  chat:    ["대화를 찾을 수 없습니다","이미 끝났거나 삭제된 대화일 수 있습니다.","chats","대화 목록으로"],
  instant: ["바로 연결할 요청이 없습니다","요청을 올리면 조건에 맞는 업체를 곧바로 찾아드립니다.","rw","요청 올리기"],
  report:  ["신고할 대상이 없습니다","신고는 업체·요청 화면의 신고 버튼에서 시작합니다.","h","홈으로"]
};

function rsBody(p){ return $(p+"-body"); }

function rsEmpty(p){
  var b=rsBody(p); if(!b) return false;
  return !b.children.length && !(b.textContent||"").trim();
}

function rsPaintLost(p){
  var b=rsBody(p), d=RS_LOST[p]; if(!b||!d) return;
  /* 뼈대를 걷어내고 그립니다 */
  b.innerHTML='<div class="gempty"><div class="gempty-t">'+esc(d[0])+'</div>'+
    '<div class="gempty-d">'+esc(d[1])+'</div>'+
    '<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;'+d[2]+'&quot;)">'+esc(d[3])+'</button></div>';
}

/* 화면이 켜진 뒤 잠깐 기다렸다 확인합니다 — 원래 여는 함수가
   비동기로 본문을 채우는 중일 수 있어서, 성급히 덮어쓰면 안 됩니다.
   기다리는 동안은 빈 칸 대신 뼈대를 깔아 둡니다 (흰 화면이 제일 나쁩니다).
   뼈대는 "아직 비어 있다" 는 표시이기도 해서, 시간이 지난 뒤 그대로면
   아무도 안 그렸다는 뜻입니다. */
var RS_SKEL="rs-skel";
function rsStillMine(p){
  var b=rsBody(p); if(!b) return false;
  return rsEmpty(p) || (b.children.length===1 && b.firstElementChild.classList.contains(RS_SKEL));
}
function rsCheck(p){
  if(RS.busy) return;
  if(!RS_OPEN[p] && !RS_LOST[p]) return;
  if(!rsEmpty(p)) return;
  var b=rsBody(p);
  if(b && typeof skelPanel==="function"){
    b.innerHTML='<div class="'+RS_SKEL+'">'+skelPanel(2)+'</div>';
  }
  clearTimeout(RS.timer);
  RS.timer=setTimeout(function(){
    var el=$("pg-"+p);
    if(!el || el.hidden || !rsStillMine(p)) return;  /* 그 사이 채워졌거나 다른 화면 */
    var get=RS_OPEN[p], fn=get&&get();
    if(typeof fn==="function"){
      var bd=rsBody(p); if(bd) bd.innerHTML="";
      RS.busy=true;
      try{ fn(); }catch(e){}
      setTimeout(function(){
        RS.busy=false;
        if(rsStillMine(p) && RS_LOST[p]) rsPaintLost(p);
      }, 900);
      return;
    }
    rsPaintLost(p);
  }, 260);
}

/* ── 구직 프로필 등록 — 구인구직의 "구직 프로필 등록" 이 가리키던 화면 ──
   지금까지 이 버튼은 빈 화면으로 갔습니다. jobs 테이블은 이미 kind="seek"
   행을 읽고 있으므로(jbFromJob), 같은 칸에 쓰기만 더합니다. 스키마는
   그대로입니다 — insertSafe 가 없는 칸은 알아서 빼고 다시 시도합니다. */
var WP_ROLES=["발골","정형","세절","포장","도축","품질관리","생산관리","배송·물류","영업","사무·경리","기타"];
var WP_EMP=["정규직","계약직","알바·단기","무관"];

window.gOpenWProf=function(){
  if(typeof go==="function") go("wprof");
  var body=$("wprof-body"); if(!body) return;
  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;jobs&quot;)">← 구인구직</button>'+
      '<div><div class="gp-title">구직 프로필 등록</div>'+
      '<div class="gp-sub">등록하면 구인구직 목록의 <b>구직</b> 칸에 올라가고, 사람을 찾는 업체가 바로 연락합니다</div></div></div>'+
    '<div class="gcard"><div class="gcard-t">할 수 있는 일</div>'+
      '<label class="glabel">직무 <span class="greq">*</span></label>'+
      '<div class="gpick" id="wp-role">'+WP_ROLES.map(function(r){
        return '<button type="button" class="gpick-i" onclick="gChip(this)">'+r+'</button>'; }).join("")+'</div>'+
      '<div class="grow keep">'+
        '<div><label class="glabel">희망 고용형태</label>'+
          '<select class="gin" id="wp-emp">'+WP_EMP.map(function(e){ return '<option>'+e+'</option>'; }).join("")+'</select></div>'+
        '<div><label class="glabel">경력</label>'+
          '<select class="gin" id="wp-exp"><option>신입</option><option>1년 이상</option><option>3년 이상</option>'+
          '<option>5년 이상</option><option>10년 이상</option></select></div>'+
      '</div>'+
      '<label class="glabel">희망 급여</label>'+
      '<input class="gin" id="wp-pay" placeholder="월 300만원 · 일당 15만원 · 협의 가능">'+
    '</div>'+
    '<div class="gcard"><div class="gcard-t">내 정보</div>'+
      '<div class="grow keep">'+
        '<div><label class="glabel">이름 <span class="greq">*</span></label>'+
          '<input class="gin" id="wp-name" placeholder="홍길동" value="'+esc(ME.name||"")+'"></div>'+
        '<div><label class="glabel">연락처 <span class="greq">*</span></label>'+
          '<input class="gin" id="wp-contact" inputmode="numeric" placeholder="010-0000-0000" oninput="gPhoneFmt(this)"></div>'+
      '</div>'+
      '<label class="glabel">희망 근무지 <span class="greq">*</span></label>'+
      '<select class="gin" id="wp-region">'+REGIONS.map(function(r){ return '<option>'+r+'</option>'; }).join("")+'</select>'+
      '<label class="glabel">소개</label>'+
      '<textarea class="gin" id="wp-detail" placeholder="해온 일, 다룰 수 있는 부위·장비, 가능한 요일과 시간 등"></textarea>'+
      '<div class="ghint">연락처는 구인구직 목록에서 업체에게 보입니다. 공개를 원하지 않으면 등록하지 마세요.</div>'+
      '<div class="gmsg" id="wp-msg"></div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="go(&quot;jobs&quot;)">취소</button>'+
    '<button class="gbtn gbtn-p" id="wp-submit" onclick="gSubmitWProf()">구직 프로필 등록</button></div>';
  window.scrollTo(0,0);
};

window.gSubmitWProf=async function(){
  var roles=[];
  document.querySelectorAll("#wp-role .gpick-i.on").forEach(function(b){ roles.push(b.textContent.trim()); });
  var v=function(id){ return (($(id)||{}).value||"").trim(); };
  if(!roles.length || !v("wp-name") || !v("wp-contact")){
    setMsg("wp-msg","직무·이름·연락처는 필수입니다.","err"); return; }
  var btn=$("wp-submit"); if(btn){ btn.disabled=true; btn.textContent="등록 중…"; }
  var r=await insertSafe("jobs",{
    kind:"seek",
    user_id: ME.user?ME.user.id:null,
    applicant_name:v("wp-name"), contact:v("wp-contact"),
    job_role:roles.join("·"), employment:v("wp-emp")||"무관",
    experience:v("wp-exp")||"신입", pay:v("wp-pay")||"협의",
    location:v("wp-region"), region:v("wp-region"),
    detail:v("wp-detail")||null, is_urgent:false
  });
  if(btn){ btn.disabled=false; btn.textContent="구직 프로필 등록"; }
  if(r.error){
    setMsg("wp-msg", r.missingTable ? "구인구직 기능이 아직 켜져 있지 않습니다. 운영자에게 알려주세요."
                                    : ("등록 실패: "+(r.error.message||"")), "err");
    return;
  }
  toast("구직 프로필을 등록했습니다.","ok");
  go("jobs");
};

/* ── 푸터가 화면 위로 올라간 것 ─────────────────────────────────────
   푸터를 홈 안에서 꺼내 .bnav 앞에 두었습니다 (모든 화면에 있어야 하니까).
   그런데 01_core 의 injectPages() 도 새 화면을 .bnav 앞에 끼워 넣습니다 —
   그래서 나중에 만들어진 여섯 화면(요청 상세·견적·당일알바·일감 등록·
   후기·구직 프로필)이 푸터 뒤에 놓였고, 그 화면들만 푸터가 맨 위에
   찍혔습니다. 푸터를 .bnav 바로 앞으로 한 번 옮겨 놓으면 끝납니다. */
function rsFooterLast(){
  var ft=document.querySelector(".footer"); if(!ft) return;
  var nav=document.querySelector(".bnav");
  var parent=ft.parentNode; if(!parent) return;
  if(nav && nav.parentNode===parent){ if(ft.nextElementSibling!==nav) parent.insertBefore(ft, nav); }
  else if(parent.lastElementChild!==ft) parent.appendChild(ft);
}

function patchRestore(){
  if(RS._patched) return; RS._patched=true;
  try{ rsFooterLast(); }catch(e){}
  if(typeof window.go!=="function") return;
  var orig=window.go;
  window.go=function(p){
    var r=orig.apply(this, arguments);
    try{ rsCheck(p); }catch(e){}
    return r;
  };
  /* 구직 프로필은 구인구직에서 들어오는 화면입니다 — 하단 네비도 구인구직이 켜져야
     합니다 (01_core 의 injectPages 는 "my" 로 두고 있었습니다). */
  try{ if(typeof TM!=="undefined") TM.wprof="jobs"; }catch(e){}
}
G.patchRestore=patchRestore;

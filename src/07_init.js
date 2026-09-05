
/* ════════════════════════════════════════════════════════════════════
   기존 화면과의 연결 · 초기화
   ════════════════════════════════════════════════════════════════════ */

/* 요청 목록/카드 클릭 → 요청 상세(견적 비교)로 연결 */
function patchRequestCards(){
  if(typeof renderRQWidget!=="function") return;
  var orig=window.renderRQWidget;
  window.renderRQWidget=function(){
    orig();
    var el=$("rq-widget"); if(!el || typeof REQS==="undefined") return;
    el.querySelectorAll(".rqc").forEach(function(card,i){
      var r=REQS[i]; if(!r) return;
      card.setAttribute("onclick","gOpenRequest('"+String(r.id)+"')");
      var cta=card.querySelector(".rqc-cta"); if(cta) cta.textContent="견적 비교 ›";
    });
  };
  var origReqs=window.renderReqs;
  window.renderReqs=function(){
    origReqs();
    var el=$("rq-list-full"); if(!el || typeof REQS==="undefined") return;
    var data=REQS.filter(function(r){ return (typeof matchCat8==="function") ? matchCat8([r.cat],curRC) : true; });
    el.querySelectorAll(".rqc").forEach(function(card,i){
      var r=data[i]; if(!r) return;
      card.style.cursor="pointer";
      card.setAttribute("onclick","gOpenRequest('"+String(r.id)+"')");
      var cta=card.querySelector(".rqc-cta"); if(cta) cta.textContent="견적 비교 ›";
    });
  };
}

/* 업체 카드의 "견적 요청" 버튼 → 해당 분야 요청서로 */
function patchSupplierCards(){
  if(typeof mkSC!=="function") return;
  var orig=window.mkSC;
  window.mkSC=function(s){
    var d=orig(s);
    var btns=d.querySelectorAll(".sc-btn");
    if(btns[0]) btns[0].setAttribute("onclick","event.stopPropagation();curSID='"+String(s.id)+"';gRequestToSupplier('"+String(s.id)+"')");
    return d;
  };
}

/* 홈에 "당일알바 · 구인구직" 진입 블록 추가 (프로세스 섹션 뒤) */
function injectLaborSection(){
  if($("sec-labor")) return;
  var proc=$("proc-grid"); if(!proc) return;
  var sec=proc.closest("section"); if(!sec) return;
  var el=document.createElement("section");
  el.className="sec sec-alt"; el.id="sec-labor";
  el.innerHTML='<div class="w">'+
    '<div class="sec-hd2 row"><div><h2 class="sec-h2">사람이 필요할 때</h2>'+
      '<p class="sec-d2">오늘 당장 필요한 현장 인력과, 함께 오래 갈 정규직을 나눠서 찾습니다</p></div></div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" id="labor-cards">'+
      '<div class="gcard" style="margin:0;cursor:pointer;" onclick="gOpenDaily()">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'+
          '<span class="gbadge gb-or">실시간 매칭</span><span class="gbadge gb-gy">단기</span></div>'+
        '<div style="font-size:17px;font-weight:800;color:var(--ink);margin-bottom:6px;">당일알바</div>'+
        '<div style="font-size:13px;color:var(--ink3);line-height:1.6;">발골·정형·포장·상하차 등 오늘·내일 바로 일할 인력을 찾습니다. '+
          '지원자의 경력·가능업무·평점·작업횟수를 보고 선택하세요.</div>'+
        '<div style="margin-top:14px;font-size:13.5px;font-weight:700;color:var(--gn);">일감 보기 · 등록하기 ›</div></div>'+
      '<div class="gcard" style="margin:0;cursor:pointer;" onclick="go(&quot;jobs&quot;)">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'+
          '<span class="gbadge gb-bl">채용</span><span class="gbadge gb-gy">장기</span></div>'+
        '<div style="font-size:17px;font-weight:800;color:var(--ink);margin-bottom:6px;">구인구직</div>'+
        '<div style="font-size:13px;color:var(--ink3);line-height:1.6;">정규직·생산직·영업직·사무직·배송직·경력직 채용. '+
          '공고를 올리거나 구직 프로필을 등록하세요.</div>'+
        '<div style="margin-top:14px;font-size:13.5px;font-weight:700;color:var(--gn);">공고 보기 · 등록하기 ›</div></div>'+
    '</div></div>';
  sec.parentNode.insertBefore(el, sec.nextSibling);
}

/* 구인구직 페이지 상단에 당일알바 분리 안내 */
function patchJobsPage(){
  if(typeof renderJobsFull!=="function") return;
  var orig=window.renderJobsFull;
  window.renderJobsFull=function(){
    orig();
    var host=$("pg-jobs"); if(!host || $("jobs-split")) return;
    if(host.querySelector(".jobs-split2")) return;   /* 새 화면이 같은 안내를 이미 담고 있습니다 */
    var wrap=host.querySelector(".job-page-wrap") || host.firstElementChild;
    if(!wrap) return;
    var box=document.createElement("div");
    box.id="jobs-split";
    box.style.cssText="display:flex;gap:8px;align-items:center;justify-content:space-between;background:var(--gnl);border:1px solid var(--gnb);border-radius:12px;padding:13px 16px;margin-bottom:16px;flex-wrap:wrap;";
    box.innerHTML='<div style="font-size:13.5px;color:var(--gn2);font-weight:600;">'+
      '<b>여기는 정규직·장기 채용입니다.</b> 오늘·내일 바로 필요한 현장 인력은 당일알바에서 찾으세요.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="gOpenDaily()">당일알바 보기</button>';
    wrap.insertBefore(box, wrap.firstChild);
  };
}

/* 회원가입에 회원 유형 추가 */
function patchSignup(){
  var box=$("auth-signup"); if(!box || $("s-role")) return;
  var pw=$("s-pw"); if(!pw) return;
  var wrap=document.createElement("div");
  wrap.style.cssText="margin-top:10px;";
  wrap.innerHTML='<label class="glabel" style="margin:0 0 6px;">회원 유형</label>'+
    '<div class="gpick" id="s-role">'+
      '<button type="button" class="gpick-i on" onclick="gPickRole(this,\'buyer\')">구매·의뢰</button>'+
      '<button type="button" class="gpick-i" onclick="gPickRole(this,\'supplier\')">업체·공급</button>'+
      '<button type="button" class="gpick-i" onclick="gPickRole(this,\'worker\')">인력·구직</button>'+
    '</div>';
  pw.parentNode.insertBefore(wrap, pw.nextSibling);
  G._role="buyer";
}
window.gPickRole=function(el,role){
  G._role=role;
  el.parentNode.querySelectorAll(".gpick-i").forEach(function(b){ b.classList.toggle("on", b===el); });
};

/* 가입 시 회원 유형 저장 */
function patchAuth(){
  var origSignup=window.doSignup;
  if(typeof origSignup!=="function") return;
  window.doSignup=async function(){
    var name=(($("s-name")||{}).value||"").trim(), email=(($("s-email")||{}).value||"").trim(), pw=(($("s-pw")||{}).value||"");
    if(!name||!email||!pw){ showAM("signup-msg","이름, 이메일, 비밀번호는 필수입니다.",false); return; }
    if(pw.length<8){ showAM("signup-msg","비밀번호는 8자 이상이어야 합니다.",false); return; }
    var c=client(); if(!c){ showAM("signup-msg","서버에 연결할 수 없습니다.",false); return; }
    try{
      var r=await c.auth.signUp({ email:email, password:pw, options:{ data:{ name:name, role:G._role||"buyer" } } });
      if(r.error) throw r.error;
      showAM("signup-msg","가입 완료! 이메일을 확인해주세요.",true);
      if(r.data && r.data.user) setUser(r.data.user);
    }catch(e){ showAM("signup-msg", e.message, false); }
  };
  var origLogin=window.doLogin;
  if(typeof origLogin==="function"){
    window.doLogin=async function(){
      await origLogin();
      await loadSession();
      if(ME.user && typeof closeModal==="function") closeModal();
    };
  }
}

/* go() 확장 — 신규 페이지 렌더 연결 */
function patchGo(){
  var orig=window.go;
  if(typeof orig!=="function") return;
  window.go=function(p){
    orig(p);
    if(p==="my") window.gOpenMy();
    else if(p==="daily") window.gOpenDaily();   /* 재진입 가드는 gOpenDaily 내부 */
    var mm=$("mobile-menu"); if(mm) mm.classList.remove("on");
  };
}

/* 하단 네비 '+' → 3단계 요청서 */
function patchBottomNav(){
  var plus=document.querySelector(".bplus");
  if(plus) plus.setAttribute("onclick","go(\"rw\")");
  var nav=document.querySelector(".bnav"); if(!nav) return;
  var jobsBtn=$("bn-my");
  if(jobsBtn && !$("bn-daily-hint")) { /* 구조는 유지 (홈/요청/+/업체/내활동) */ }
}

/* 헤더 카테고리 바에 '당일알바' 바로가기 */
function patchHeaderCats(){
  if(typeof renderHdrCats!=="function") return;
  var orig=window.renderHdrCats;
  window.renderHdrCats=function(){
    orig();
    var el=$("hdr-cats"); if(!el || el.querySelector(".hc-daily")) return;
    var b=document.createElement("button");
    b.className="hc-item hc-daily";
    b.style.cssText="margin-left:auto;color:var(--gn);font-weight:700;";
    b.textContent="⚡ 당일알바";
    b.onclick=function(){ window.gOpenDaily(); };
    el.appendChild(b);
  };
}

/* ── 초기화 ── */
async function init(){
  injectPages();
  patchGo();
  patchRequestCards();
  patchSupplierCards();
  patchJobsPage();
  patchHeaderCats();
  patchBottomNav();
  patchSignup();
  patchAuth();
  injectLaborSection();
  if(typeof renderHdrCats==="function") renderHdrCats();

  await probeSchema();
  await loadSession();
  await loadFavs();

  /* 홈 하단에 DB 준비 안내 (신규 테이블이 하나도 없을 때만) */
  var ready=NEW_TABLES.filter(function(t){ return SCHEMA[t]; }).length;
  if(client() && ready===0){
    var host=$("sec-labor");
    if(host && !$("db-note")){
      var n=document.createElement("div");
      n.id="db-note"; n.className="w"; n.style.cssText="padding-top:18px;";
      n.innerHTML=setupNote("견적 비교·당일알바·후기");
      host.querySelector(".w").appendChild(n.firstChild);
    }
  }
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init);
else init();

/* 확장 기능은 다른 래퍼(리디자인 포함)가 모두 얹힌 뒤에 감쌉니다.
   각 patch* 함수에 재실행 가드가 있어 두 번 불려도 안전합니다. */
function applyExtras(){
  try{ patchFilters(); }catch(e){}
  try{ patchEdit(); }catch(e){}
  try{ patchMarket(); }catch(e){}
  try{ patchJobs(); }catch(e){}
  try{ patchFind(); }catch(e){}
  try{ patchLive(); }catch(e){}
  try{ patchGuard(); }catch(e){}
  try{ patchPWA(); }catch(e){}
  try{ patchNotif(); }catch(e){}
  try{ patchContent(); }catch(e){}
  try{ patchA11y(); }catch(e){}
  try{ patchKakao(); }catch(e){}
  try{ patchOffline(); }catch(e){}
  try{ patchStale(); }catch(e){}
  try{ patchRouter(); armRouter(); }catch(e){}
}
/* 리디자인 패치(420ms) 뒤에 얹혀야 하므로 그보다 늦게 실행합니다.
   init() 안에서 부르면 안 됩니다 — DOMContentLoaded 가 리디자인보다
   먼저 올 수 있어 감싸는 순서가 뒤집힙니다. */
setTimeout(applyExtras, 520);

})();

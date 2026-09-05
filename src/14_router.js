/* ════════════════════════════════════════════════════════════════════
   URL 라우팅 — 뒤로가기 · 링크 공유 · 새로고침 복원
   화면마다 #/경로 를 부여합니다. 기존 go()/gOpen*() 는 그대로 두고
   바깥에서 감싸기만 하므로, 이 블록이 통째로 빠져도 사이트는 동작합니다.
   ════════════════════════════════════════════════════════════════════ */

var RT = {
  armed:false,      /* 초기 라우팅이 끝나기 전에는 히스토리를 건드리지 않음 */
  applying:0,       /* >0 : 주소 → 화면 반영 중 (되밀어넣기 방지) */
  pending:null,     /* {p:"reqd", id:"..."} — go() 직전에 상세 id 를 넘겨줌 */
  last:""           /* 마지막으로 우리가 만든/읽은 해시 */
};

/* 상세 화면 ↔ URL 조각 */
var RT_DETAIL = { reqd:"req", sp:"sup", chat:"chat", order:"order" };
var RT_SEG2PG = { req:"reqd", sup:"sp", chat:"chat", order:"order" };

/* 새로고침·공유 링크로 곧바로 열어도 되는 화면 */
var RT_RESTORE = ["h","reqs","suppliers","jobs","my","market","news","community",
                  "cat8","cat-trade","cat-prod","cat-ops","cat-biz",
                  "rw","daily","chats","instant","findreq"];

/* 화면 이름 (문서 제목 · 히스토리 목록에 보임) */
var RT_TITLE = {
  h:"", reqs:"견적 요청", rw:"요청서 작성", suppliers:"업체 찾기", sp:"업체 프로필",
  jobs:"구인구직", daily:"당일알바", djnew:"당일알바 등록", wprof:"인력 프로필",
  my:"내 활동", market:"시세", news:"뉴스", community:"커뮤니티",
  reqd:"견적 비교", quote:"견적 보내기", review:"후기 작성", reqedit:"요청 수정", findreq:"내 요청 찾기",
  chats:"대화", chat:"대화", order:"거래 진행", prefs:"매칭 설정", verify:"사업자 인증",
  instant:"즉시 매칭", cat8:"전체 카테고리",
  "cat-trade":"원육·유통", "cat-prod":"가공·생산", "cat-ops":"운영·인력", "cat-biz":"창업·경영"
};
var RT_BASE = "고리 — 대한민국 축산업 통합 플랫폼";

/* ── 화면 → 경로 ── */
function rtPathOf(p){
  if(!p || p==="h") return "/";
  var seg=RT_DETAIL[p];
  if(seg){
    var id=null;
    if(RT.pending && RT.pending.p===p) id=RT.pending.id;
    else if(p==="sp" && typeof curSID!=="undefined" && curSID) id=curSID;
    else if(p==="reqd" && CUR && CUR.req) id=CUR.req.id;
    else if(p==="chat" && typeof CHAT!=="undefined" && CHAT.cur) id=CHAT.cur.id;
    if(!id) return null;              /* id 를 모르면 히스토리에 남기지 않음 */
    return "/"+seg+"/"+encodeURIComponent(String(id));
  }
  return "/"+p;
}

function rtSetTitle(p){
  var t=RT_TITLE[p];
  try{ document.title = t ? (t+" · 고리") : RT_BASE; }catch(e){}
}

/* ── 화면 이동 → 주소 기록 ── */
function rtPush(p){
  rtSetTitle(p);
  if(!RT.armed || RT.applying>0) return;
  var path=rtPathOf(p); if(path===null) return;
  var h="#"+path;
  if((location.hash||"")===h) { RT.last=h; return; }
  RT.last=h;
  try{ history.pushState(null, "", h); }
  catch(e){ try{ location.hash=path; }catch(e2){} }
}

/* ── 조건이 만족될 때까지 기다렸다 실행 (데이터 로딩 대기) ── */
function rtWhen(test, fn, ms){
  var t0=Date.now(), lim=ms||7000;
  (function loop(){
    var ok=false; try{ ok=!!test(); }catch(e){}
    if(ok || Date.now()-t0>lim){ fn(); return; }
    setTimeout(loop, 120);
  })();
}

/* ── 주소 → 화면 반영 ── */
function rtApply(hash, initial){
  var path=String(hash||"").replace(/^#/,"").replace(/^\//,"");
  var parts=path?path.split("/"):[];
  var a=""; try{ a=decodeURIComponent(parts[0]||""); }catch(e){ a=parts[0]||""; }
  var id=""; try{ id=decodeURIComponent(parts[1]||""); }catch(e){ id=parts[1]||""; }

  RT.applying++;
  var release=function(){ setTimeout(function(){ if(RT.applying>0) RT.applying--; },0); };

  try{
    if(!a){ if(typeof go==="function") go("h"); release(); return; }

    var dpg=RT_SEG2PG[a];
    if(dpg && id){
      if(dpg==="reqd" && typeof gOpenRequest==="function"){ gOpenRequest(id); }
      else if(dpg==="sp"){
        rtWhen(function(){ return typeof SUPS!=="undefined" && SUPS.length; }, function(){
          RT.applying++;
          try{ window.curSID=id; if(typeof go==="function") go("sp"); }catch(e){}
          release();
        });
      }
      else if(dpg==="chat" && typeof gOpenChat==="function"){ gOpenChat(id); }
      else if(dpg==="order" && typeof gOpenOrder==="function"){ gOpenOrder(id); }
      else if(typeof go==="function"){ go("h"); }
      release(); return;
    }

    var known = (typeof PGS!=="undefined" && PGS.indexOf(a)>=0);
    var ok = known && (!initial || RT_RESTORE.indexOf(a)>=0);
    if(typeof go==="function") go(ok ? a : "h");
  }catch(e){ try{ if(typeof go==="function") go("h"); }catch(e2){} }
  release();
}

function rtOnPop(){
  var h=location.hash||"";
  if(h===RT.last) return;
  RT.last=h;
  rtApply(h, false);
}


/* ── 상세 화면에 "링크 복사" 버튼 붙이기 ── */
function rtAddShare(pageId){
  var pg=document.getElementById("pg-"+pageId); if(!pg) return;
  var back=pg.querySelector(".back-btn"); if(!back) return;
  var row=back.parentNode; if(!row || row.querySelector(".gshare-b")) return;
  row.style.display="flex"; row.style.alignItems="center";
  row.style.justifyContent="space-between"; row.style.gap="8px";
  var b=document.createElement("button");
  b.type="button"; b.className="gbtn gbtn-w gbtn-sm gshare-b";
  b.textContent="🔗 링크 복사";
  b.onclick=function(ev){ window.gShareLink(ev); };
  row.appendChild(b);
}

/* ── 감싸기 ── */
function patchRouter(){
  if(RT._patched) return; RT._patched=true;

  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(p){
      var r=origGo.apply(this, arguments);
      try{ rtPush(p); }catch(e){}
      return r;
    };
  }

  /* 상세 화면은 go() 이전에 id 를 알려줘야 주소에 담깁니다 */
  ["gOpenRequest","gOpenChat","gOpenOrder"].forEach(function(fn){
    var orig=window[fn]; if(typeof orig!=="function") return;
    var pg={gOpenRequest:"reqd", gOpenChat:"chat", gOpenOrder:"order"}[fn];
    window[fn]=function(id){
      RT.pending={p:pg, id:id};
      var out;
      try{ out=orig.apply(this, arguments); }
      finally{ RT.pending=null; }
      if(pg==="reqd" && out && typeof out.then==="function"){
        out.then(function(){ try{ rtAddShare("reqd"); }catch(e){} });
      }
      return out;
    };
  });

  /* 업체 상세는 비동기 렌더라 최종 그리기 함수를 감쌉니다 */
  if(typeof renderSupplierDetail==="function"){
    var origRSD=renderSupplierDetail;
    renderSupplierDetail=function(){
      var r=origRSD.apply(this, arguments);
      try{ rtAddShare("sp"); }catch(e){}
      return r;
    };
  }
  if(typeof renderRequestDetail==="function"){
    var origRRD=renderRequestDetail;
    renderRequestDetail=function(){
      var r=origRRD.apply(this, arguments);
      try{ rtAddShare("reqd"); }catch(e){}
      return r;
    };
  }

  /* 알림 클릭이 location.hash 를 직접 건드리면 라우터와 충돌합니다.
     링크 종류에 맞는 화면을 직접 열도록 바꿉니다. */
  window.gOpenNotif=async function(id){
    var list=(typeof NOTIFS!=="undefined")?NOTIFS:[];
    var n=list.find(function(x){ return String(x.id)===String(id); });
    if(!n) return;
    if(!n.is_read){
      n.is_read=true;
      try{ await updateSafe("notifications",{is_read:true},"id",id); }catch(e){}
      if(typeof renderHeaderUser==="function") renderHeaderUser();
    }
    var p=$("notif-panel"); if(p) p.classList.remove("on");
    var link=String(n.link||""), i=link.indexOf(":");
    if(i<0) return;
    var kind=link.slice(0,i), key=link.slice(i+1);
    if(kind==="req" && typeof gOpenRequest==="function") gOpenRequest(key);
    else if(kind==="chat" && typeof gOpenChat==="function") gOpenChat(key);
    else if(kind==="order" && typeof gOpenOrder==="function") gOpenOrder(key);
    else if(kind==="sup"){ window.curSID=key; if(typeof go==="function") go("sp"); }
    else if(typeof go==="function" && typeof PGS!=="undefined" && PGS.indexOf(kind)>=0) go(kind);
  };

  window.addEventListener("popstate", rtOnPop);
  window.addEventListener("hashchange", rtOnPop);
}

/* 초기 진입 — 공유 링크로 들어왔으면 그 화면을 복원 */
function armRouter(){
  RT.armed=true;
  RT.last=location.hash||"";
  if(RT.last && RT.last!=="#" && RT.last!=="#/") rtApply(RT.last, true);
  else rtSetTitle("h");
}

/* ── 현재 화면 링크 복사 ── */
window.gShareLink=function(ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  var url=location.href;
  var done=function(){ if(typeof toast==="function") toast("링크를 복사했습니다"); else alert("링크를 복사했습니다\n\n"+url); };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(done, function(){ window.prompt("링크 복사 (Ctrl+C)", url); });
  } else {
    var ta=document.createElement("textarea");
    ta.value=url; ta.style.cssText="position:fixed;top:-999px;opacity:0;";
    document.body.appendChild(ta); ta.select();
    var ok=false; try{ ok=document.execCommand("copy"); }catch(e){}
    document.body.removeChild(ta);
    if(ok) done(); else window.prompt("링크 복사 (Ctrl+C)", url);
  }
};

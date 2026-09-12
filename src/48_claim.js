/* ════════════════════════════════════════════════════════════════════
   48_claim — 운영자가 대신 등록해 둔 업체를 사장님 계정에 연결

   사이트의 진짜 병목은 디자인이 아니라 **등록된 업체가 0곳**인 것입니다.
   그런데 도축장 사장님께 "사이트 가서 가입하세요" 하면 열에 아홉은
   안 합니다. 그래서 운영자가 전화로 영업해 명함을 받아 관리자 화면에서
   대신 넣고(admin.html), 초대 문자를 보냅니다.

     https://aboutmeat.co.kr/#/claim/<열쇠>

   이 화면이 그 링크를 받습니다. 사장님은 자기 업체 정보가 이미 들어 있는
   것을 보고, 로그인 한 번으로 가져갑니다.

   ⚠️ 연결은 **DB 함수**(gori_claim_supplier)가 합니다. 브라우저에서
      suppliers 를 직접 update 하게 두면 anon 키로 아무 업체나 가져갈 수
      있습니다. 함수는 열쇠가 맞고 아직 주인이 없을 때 그 한 줄만 바꿉니다.
      (db/phase9_invite.sql)
   ════════════════════════════════════════════════════════════════════ */

var CL={ token:"", sup:null, busy:false, patched:false };

function clInjectPage(){
  if($("pg-claim")) return;
  var nav=document.querySelector(".bnav");
  var d=document.createElement("div");
  d.className="pg"; d.id="pg-claim";
  d.style.cssText="padding-top:var(--top-pad);padding-bottom:56px;";
  d.innerHTML='<div class="gp" id="claim-body"></div>';
  if(nav) document.body.insertBefore(d, nav); else document.body.appendChild(d);
  if(typeof PGS!=="undefined" && PGS.indexOf("claim")<0) PGS.push("claim");
  if(typeof TM!=="undefined") TM.claim="my";
  try{ if(typeof RT_TITLE!=="undefined") RT_TITLE.claim="업체 연결"; }catch(e){}
  /* ⚠️ 46_restore 의 rsClearHash() 는 "열 수 없는 주소" 를 #/ 로 되돌립니다.
     claim 을 RT_SEG2PG 에 알려 주지 않으면 **초대 링크를 새로고침하는
     순간 주소가 날아갑니다** — 사장님은 홈만 보게 되고, 문자로 받은
     링크는 다시 눌러도 소용없습니다. 실제로 그렇게 지워졌습니다.
     id(열쇠)가 있는 상세 주소로 등록해 두면 rsStaleHash 가 통과시킵니다.
     rtApply 는 아래에서 가로채므로 원래 라우터는 이걸 볼 일이 없습니다. */
  try{ if(typeof RT_SEG2PG!=="undefined" && !RT_SEG2PG.claim) RT_SEG2PG.claim="claim"; }catch(e){}
  /* ⚠️ go("claim") 은 rtPush() 를 부르고, rtPush 는 RT_DETAIL 에 없는 화면을
     "/claim" 으로 적습니다 — **열쇠가 주소에서 떨어져 나갑니다.**
     그 다음 rsClearHash 가 id 없는 주소를 보고 #/ 로 지웁니다.
     RT_DETAIL 에 넣고 gOpenClaim 에서 RT.pending 을 채우면
     "/claim/<열쇠>" 로 제대로 적힙니다 (gOpenRequest 가 쓰는 방식 그대로). */
  try{ if(typeof RT_DETAIL!=="undefined" && !RT_DETAIL.claim) RT_DETAIL.claim="claim"; }catch(e){}
  /* 푸터가 이 화면 위로 올라가지 않게 (46_restore 의 rsFooterLast 와 같은 이유) */
  try{ if(typeof rsFooterLast==="function") rsFooterLast(); }catch(e){}
}

function clTokenOf(hash){
  var path=String(hash||"").replace(/^#/,"").replace(/^\//,"");
  var p=path.split("/");
  if(p[0]!=="claim" || !p[1]) return "";
  var t=""; try{ t=decodeURIComponent(p[1]); }catch(e){ t=p[1]; }
  return /^[A-Za-z0-9_-]{16,128}$/.test(t) ? t : "";
}

function clPaint(state, extra){
  var b=$("claim-body"); if(!b) return;
  var s=CL.sup;

  if(state==="loading"){ b.innerHTML=(typeof skelPanel==="function")?skelPanel(2):""; return; }

  if(state==="bad"){
    b.innerHTML='<div class="gempty"><div class="gempty-t">초대 링크가 올바르지 않습니다</div>'+
      '<div class="gempty-d">링크가 잘렸거나, 이미 연결된 업체일 수 있습니다.<br>'+
      '문자로 받은 주소를 전체 복사해서 다시 열어 보세요.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;sj&quot;)">직접 업체 등록하기</button></div>';
    return;
  }

  if(state==="done"){
    b.innerHTML='<div class="gcard" style="text-align:center;padding:30px 20px;">'+
      '<div class="cl-ok">연결되었습니다</div>'+
      '<div class="cl-sub">이제 <b>'+esc((s&&s.name)||"업체")+'</b> 로 견적 요청을 받습니다.</div>'+
      '<div class="cl-next">조건에 맞는 요청이 올라오면 알려 드립니다. '+
        '취급 품목과 지역을 채워 두시면 더 정확하게 받습니다.</div>'+
      '<div class="grow keep" style="justify-content:center;margin-top:18px;">'+
        '<button class="gbtn gbtn-p" onclick="go(&quot;findreq&quot;)">나에게 맞는 요청 보기</button>'+
        '<button class="gbtn gbtn-w" onclick="go(&quot;my&quot;)">내 업체 정보 채우기</button>'+
      '</div></div>';
    return;
  }

  /* state === "ready" — 업체를 찾았고, 가져가기만 하면 됩니다 */
  var me=(typeof ME!=="undefined" && ME.user);
  var rows=[];
  if(s.region)  rows.push(["지역", s.region]);
  if(s.contact) rows.push(["연락처", s.contact]);
  var cats=(s.categories&&s.categories.length)?s.categories.join(", "):"";
  if(cats) rows.push(["취급", cats]);

  /* ⚠️ 누를 것을 아래에 두지 마라. 처음에는 설득(가져가면 무엇이 되나요)을
     먼저 놓고 버튼을 맨 밑에 뒀는데, 390px 에서 **버튼이 하단 네비 밑으로
     들어가** 그 자리를 누르면 네비가 받았습니다(elementFromPoint 가 bni-t).
     스크롤하면 나오지만, 처음 열었을 때 눌러야 할 것이 안 보이면 안 됩니다.
     지금은 정보 → 버튼 → 설득 순서입니다. */
  var action = me
    ? '<button class="gbtn gbtn-p gbtn-full" id="cl-go" onclick="gClaimNow()">내 계정으로 가져가기</button>'
    : '<div class="cl-login">'+
        '<div class="cl-login-t">먼저 로그인해 주세요</div>'+
        '<div class="cl-login-d">계정이 있어야 요청 알림을 받고 견적을 보낼 수 있습니다. '+
          '로그인하면 이 업체가 바로 연결됩니다.</div>'+
        '<div class="grow keep">'+
          '<button class="gbtn gbtn-p" onclick="openModal(\'login\')">로그인</button>'+
          '<button class="gbtn gbtn-w" onclick="openModal(\'signup\')">회원가입</button>'+
        '</div></div>';

  b.innerHTML=
    '<div class="gp-hd"><div>'+
      '<div class="gp-title">'+esc(s.name||"업체")+' 사장님</div>'+
      '<div class="gp-sub">고리에 업체를 등록해 두었습니다. 확인하고 내 계정으로 가져가세요.</div>'+
    '</div></div>'+
    '<div class="gcard">'+
      '<div class="gcard-t">등록된 정보</div>'+
      '<div class="gsum">'+rows.map(function(r){
        return '<div class="gsum-r"><div class="gsum-k">'+esc(r[0])+'</div>'+
               '<div class="gsum-v">'+esc(r[1])+'</div></div>'; }).join("")+'</div>'+
      '<div class="cl-note">틀린 곳이 있어도 괜찮습니다 — 연결한 뒤 직접 고치실 수 있습니다.</div>'+
    '</div>'+
    '<div class="gmsg" id="cl-msg" style="display:none"></div>'+
    action+
    '<div class="gcard">'+
      '<div class="gcard-t">가져가면 무엇이 되나요</div>'+
      '<ul class="cl-ul">'+
        '<li>조건에 맞는 <b>견적 요청이 올라오면 알림</b>을 받습니다</li>'+
        '<li>요청에 <b>견적을 보내고</b> 요청자와 바로 연락합니다</li>'+
        '<li>업체 정보·취급 품목·사진을 직접 고칩니다</li>'+
      '</ul>'+
      '<div class="cl-note">등록비도, 수수료도 없습니다.</div>'+
    '</div>'+
    (extra||"");
}

function clSetMsg(t, kind){
  var m=$("cl-msg"); if(!m) return;
  m.textContent=t; m.className="gmsg "+(kind||"err"); m.style.display="";
}

/* 열쇠로 업체를 찾아 보여 줍니다 (아직 가져가지 않습니다) */
window.gOpenClaim=async function(token){
  clInjectPage();
  CL.token=token||CL.token;
  /* 주소에 열쇠가 같이 적히도록 — 14_router 가 상세 화면에 쓰는 길입니다 */
  var had=null;
  try{ if(typeof RT!=="undefined"){ had=RT.pending; RT.pending={p:"claim", id:CL.token}; } }catch(e){}
  try{ if(typeof go==="function") go("claim"); }
  finally{ try{ if(typeof RT!=="undefined") RT.pending=had; }catch(e){} }
  if(!CL.token){ clPaint("bad"); return; }
  clPaint("loading");

  var c=(typeof client==="function")?client():null;
  if(!c){ clPaint("bad"); return; }
  try{
    var r=await c.from("suppliers")
      .select("id,name,region,contact,categories,user_id")
      .eq("claim_token", CL.token).limit(1);
    if(r.error || !r.data || !r.data.length){
      /* 이미 가져간 뒤라면 열쇠가 지워져 있습니다 — 그것도 "올바르지 않음" 으로 */
      clPaint("bad");
      if(r.error) try{ console.warn("[고리] 초대 확인 실패:", r.error.message); }catch(e){}
      return;
    }
    CL.sup=r.data[0];
    if(CL.sup.user_id){ clPaint("bad"); return; }   /* 주인이 이미 있음 */
    clPaint("ready");
  }catch(e){ clPaint("bad"); }
};

/* 실제로 가져가기 — DB 함수가 열쇠를 확인하고 그 한 줄만 바꿉니다 */
window.gClaimNow=async function(){
  if(CL.busy) return;
  var c=(typeof client==="function")?client():null;
  if(!c){ clSetMsg("지금은 연결할 수 없습니다. 잠시 뒤 다시 시도해 주세요."); return; }
  if(typeof ME==="undefined" || !ME.user){ clSetMsg("먼저 로그인해 주세요."); return; }

  CL.busy=true;
  var btn=$("cl-go"); if(btn){ btn.disabled=true; btn.textContent="연결 중…"; }
  try{
    var r=await c.rpc("gori_claim_supplier", { token: CL.token });
    if(r.error){
      var m=String(r.error.message||"");
      /* 운영자에게 할 말과 손님에게 할 말을 가릅니다 (CLAUDE.md) */
      if(/function .* does not exist|PGRST202/i.test(m)){
        clSetMsg("아직 이 링크로는 연결할 수 없습니다. 운영자에게 알려 주세요.");
        try{ console.warn("[고리] db/phase9_invite.sql 의 gori_claim_supplier 가 없습니다 — 실행이 필요합니다."); }catch(e){}
      } else if(/이미 연결|없는 초대/.test(m)){
        clSetMsg("이미 연결되었거나 만료된 초대입니다.");
      } else {
        clSetMsg("연결하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
        try{ console.warn("[고리] 업체 연결 실패:", m); }catch(e){}
      }
      return;
    }
    if(Array.isArray(r.data) && r.data.length) CL.sup=r.data[0];
    CL.token="";
    try{ if(typeof RT!=="undefined") RT.last=""; history.replaceState(null,"", location.href.split("#")[0]+"#/claim/done"); }catch(e){}
    clPaint("done");
    if(typeof toast==="function") toast("업체가 연결되었습니다.","ok");
    /* 업체 목록·내 활동이 새 주인을 바로 반영하도록 */
    try{ if(typeof loadSession==="function") loadSession(); }catch(e){}
  } finally {
    CL.busy=false;
    var b2=$("cl-go"); if(b2){ b2.disabled=false; b2.textContent="내 계정으로 가져가기"; }
  }
};

function patchClaim(){
  if(CL.patched) return; CL.patched=true;
  clInjectPage();

  /* ── 주소로 들어오는 길 ────────────────────────────────────────
     14_router 의 rtApply 는 RT_SEG2PG 에 있는 상세 화면만 압니다.
     claim 은 거기 없어서 홈으로 튕깁니다. rtApply 는 IIFE 안의 지역
     함수라 window 에 없으므로 **지역 이름을 직접 다시 묶습니다**
     (window.rtApply = ... 로 감싸면 조용히 아무 일도 안 일어납니다). */
  if(typeof rtApply==="function" && !rtApply._cl){
    var orig=rtApply;
    rtApply=function(hash, initial){
      var t=clTokenOf(hash);
      if(t){ try{ window.gOpenClaim(t); }catch(e){} return; }
      if(/^#?\/?claim\/done$/.test(String(hash||""))){ return; }   /* 연결 직후 */
      return orig.apply(this, arguments);
    };
    rtApply._cl=true;
  }

  /* 로그인/가입을 마치면 이 화면을 다시 그립니다 — 그래야 "로그인해
     주세요" 가 "가져가기" 로 바뀝니다. 원래 함수는 그대로 부릅니다. */
  ["doLogin","doSignup"].forEach(function(fn){
    var o=window[fn];
    if(typeof o!=="function" || o._cl) return;
    var w=async function(){
      var r=await o.apply(this, arguments);
      try{
        var on=$("pg-claim");
        if(on && !on.hidden && CL.token && typeof ME!=="undefined" && ME.user) clPaint("ready");
      }catch(e){}
      return r;
    };
    w._cl=true; window[fn]=w;
  });

  /* 새로고침·첫 진입 — armRouter 보다 먼저 불릴 수 있어 여기서도 한 번 봅니다 */
  var t0=clTokenOf(location.hash);
  if(t0) setTimeout(function(){ try{ window.gOpenClaim(t0); }catch(e){} }, 40);
}
G.patchClaim=patchClaim;

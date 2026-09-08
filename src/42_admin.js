/* ════════════════════════════════════════════════════════════════════
   "관리자 페이지" 버튼

   두 가지가 잘못돼 있었습니다.

   1) 모든 방문자에게 보였습니다. 축산업 하시는 분이 자기 화면에서
      "관리자 페이지" 버튼을 보면 눌러 봅니다. 눌러도 막히지만,
      있어서는 안 될 자리입니다.

   2) 가리키는 곳이 meat_insight_admin.html — 고리 이전 사이트의
      관리자 화면이었습니다. 지금 없는 표 9개만 다루고, 로그인 확인이
      전혀 없는데 수정·삭제를 8곳에서 했습니다.

   admins 표에 등록된 사람에게만 보여 주고, 지금 쓰는 관리 홈으로
   보냅니다. admins 표가 없거나(phase4 미실행) 못 읽어도 조용히
   숨긴 채로 둡니다 — 안 보이는 쪽이 안전한 기본값입니다.
   ════════════════════════════════════════════════════════════════════ */

function admFindBtn(){
  var found=null;
  [].slice.call(document.querySelectorAll("button")).forEach(function(b){
    if(found) return;
    if(b.textContent.trim()==="관리자 페이지") found=b;
  });
  return found;
}

async function admIsAdmin(){
  if(!ME.user) return false;
  var c=client(); if(!c) return false;
  try{
    var r=await c.from("admins").select("email").eq("email", ME.user.email||"").limit(1);
    if(r.error) return false;                 /* 표가 없거나 RLS 로 막힘 → 숨김 */
    return !!(r.data && r.data.length);
  }catch(e){ return false; }
}

async function admPaint(){
  var b=admFindBtn(); if(!b) return;
  b.setAttribute("onclick", "location.href='dashboard.html'");
  b.hidden=true;                              /* 확인 전에는 숨깁니다 */
  if(await admIsAdmin()) b.hidden=false;
}

function patchAdmin(){
  if(G._adm) return; G._adm=true;
  admPaint();
  /* 로그인·화면 이동 뒤에도 다시 확인합니다 */
  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(){
      var r=origGo.apply(this, arguments);
      setTimeout(function(){ try{ admPaint(); }catch(e){} }, 300);
      return r;
    };
  }
}

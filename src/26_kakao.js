/* ════════════════════════════════════════════════════════════════════
   카카오 로그인 (Supabase OAuth)

   지금까지 "카카오로 로그인" 버튼은 alert("준비 중입니다") 만 띄웠습니다.
   Supabase 의 Kakao 공급자를 쓰면 사이트에 카카오 키를 넣지 않아도 됩니다.
   키는 Supabase 대시보드에만 넣고, 여기서는 로그인 요청만 보냅니다.

   운영자가 해야 할 일 (README 참고)
     1) 카카오 개발자센터에서 앱을 만들고 REST API 키·시크릿 발급
     2) 카카오 앱의 Redirect URI 에 아래 주소 등록
        https://<프로젝트>.supabase.co/auth/v1/callback
     3) Supabase → Authentication → Providers → Kakao 를 켜고 키 입력
     4) Supabase → Authentication → URL Configuration 에
        https://aboutmeat.co.kr 을 Site URL 로 등록

   설정 전에는 카카오 서버가 오류를 돌려주므로, 그 경우 무엇을 해야 하는지
   화면에 그대로 알려줍니다. (예전처럼 "준비 중" 만 뜨지 않습니다)
   ════════════════════════════════════════════════════════════════════ */

var KK = {};

function kkRedirect(){
  /* 로그인 후 보고 있던 화면으로 돌아옵니다 */
  var base=location.origin+location.pathname;
  var h=location.hash||"";
  if(h==="#"||h==="#/") h="";
  return base+h;
}

window.authKakao=async function(){
  var c=client();
  if(!c || !c.auth || typeof c.auth.signInWithOAuth!=="function"){
    toast("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.","err");
    return;
  }
  var msgId = ($("auth-signup") && $("auth-signup").style.display!=="none") ? "signup-msg" : "login-msg";
  setMsg(msgId,"카카오로 이동 중…","");
  try{
    var r=await c.auth.signInWithOAuth({
      provider:"kakao",
      options:{ redirectTo:kkRedirect() }
    });
    if(r && r.error) throw r.error;
    /* 성공하면 카카오 로그인 화면으로 이동합니다 (아래 코드는 실행되지 않습니다) */
  }catch(e){
    var m=String((e&&e.message)||"");
    if(/provider is not enabled|Unsupported provider|not enabled/i.test(m)){
      setMsg(msgId,"카카오 로그인이 아직 켜져 있지 않습니다. 이메일로 로그인해주세요.","err");
    }else{
      setMsg(msgId,"카카오 로그인에 실패했습니다: "+(m||"알 수 없는 오류"),"err");
    }
  }
};

/* 카카오에서 돌아왔을 때 — 오류 파라미터가 붙어 오면 그대로 알려줍니다 */
async function kkHandleReturn(){
  var q=new URLSearchParams(location.search);
  var hp=new URLSearchParams(String(location.hash||"").replace(/^#\/?/,""));
  var err=q.get("error")||hp.get("error");
  var desc=q.get("error_description")||hp.get("error_description")||"";
  if(err){
    var d=decodeURIComponent(desc).replace(/\+/g," ");
    if(/provider is not enabled|Unsupported provider/i.test(d)){
      toast("카카오 로그인이 아직 켜져 있지 않습니다. 이메일로 로그인해주세요.","err");
    }else{
      toast("카카오 로그인이 취소되었거나 실패했습니다."+(d?" ("+d+")":""),"err");
    }
    try{ history.replaceState(null,"",location.pathname); }catch(e){}
    return;
  }
  /* 로그인 성공 후 프로필 이름 채우기 */
  var c=client(); if(!c||!c.auth) return;
  try{
    var s=await c.auth.getSession();
    var u=s&&s.data&&s.data.session?s.data.session.user:null;
    if(!u) return;
    var meta=u.user_metadata||{};
    if(!meta.name){
      var nm=meta.full_name||meta.preferred_username||meta.user_name||
             (meta.kakao_account&&meta.kakao_account.profile&&meta.kakao_account.profile.nickname)||"";
      if(nm && typeof c.auth.updateUser==="function"){
        try{ await c.auth.updateUser({ data:{ name:nm } }); }catch(e){}
      }
    }
  }catch(e){}
}

function patchKakao(){
  if(KK._patched) return; KK._patched=true;

  /* 로그인 상태가 바뀌면 화면을 갱신합니다 (카카오에서 돌아온 직후 포함) */
  var c=client();
  if(c && c.auth && typeof c.auth.onAuthStateChange==="function"){
    try{
      c.auth.onAuthStateChange(function(evt){
        if(evt==="SIGNED_IN"||evt==="SIGNED_OUT"||evt==="TOKEN_REFRESHED"){
          if(typeof loadSession==="function") loadSession();
          if(evt==="SIGNED_IN" && typeof closeModal==="function") closeModal();
        }
      });
    }catch(e){}
  }
  kkHandleReturn();
}

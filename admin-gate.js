/* ════════════════════════════════════════════════════════════════════
   관리 화면 접근 제한 (admin-gate.js)

   dashboard / suppliers / purchase_request / jobs 는 "관리" 화면인데
   로그인 절차가 전혀 없었습니다. 주소만 알면 누구나 열 수 있었고,
   업체·요청·구인공고를 삭제하는 버튼까지 그대로 눌렀습니다.

   이 파일을 <head> 에서 supabase CDN 다음 줄에 한 줄 넣으면,
   admin.html 과 같은 기준(Supabase 로그인 + admins 표 등록)으로
   막힙니다.

   ※ 이것은 화면 차단입니다. 데이터 자체를 지키려면 반드시
     db/phase4_admin.sql 의 5번 블록(기존 테이블 RLS)을 켜세요.
     그 전에는 익명 키로 API 를 직접 호출하는 것을 막을 수 없습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var URL_="https://igignylgzjphtnyxhhsd.supabase.co";
  var KEY_="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnaWdueWxnempwaHRueXhoaHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MDUyMDAsImV4cCI6MjA4OTA4MTIwMH0.3u5gCw1dnG1YSmrzhN3PGVOMoQ1LBtGw0ToNhSeL42A";

  /* 1) 인증 전에는 화면을 통째로 가립니다 (데이터가 스쳐 보이지 않도록) */
  var st=document.createElement("style");
  st.textContent=
    "html.ag-lock>body>*:not(#ag-gate){display:none!important}"+
    "html.ag-lock{overflow:hidden}"+
    "#ag-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;"+
      "justify-content:center;padding:20px;background:#12161B;"+
      "font-family:'Pretendard Variable',Pretendard,'Noto Sans KR',system-ui,sans-serif}"+
    "#ag-gate .b{background:#fff;border-radius:18px;padding:30px 26px;width:100%;max-width:380px;"+
      "box-shadow:0 20px 50px rgba(0,0,0,.35)}"+
    "#ag-gate h1{font-size:19px;font-weight:800;margin:0 0 5px;color:#14181C;letter-spacing:-.5px}"+
    "#ag-gate p{font-size:13px;color:#6E7480;margin:0 0 20px;line-height:1.6}"+
    "#ag-gate label{display:block;font-size:12.5px;font-weight:700;color:#3A4149;margin:0 0 6px}"+
    "#ag-gate input{width:100%;height:44px;padding:0 13px;border:1.5px solid #EAE8E4;border-radius:11px;"+
      "font-size:15px;font-family:inherit;outline:none;margin-bottom:12px;box-sizing:border-box}"+
    "#ag-gate input:focus{border-color:#D91F3A}"+
    "#ag-gate button{width:100%;height:46px;border:none;border-radius:11px;background:#D91F3A;color:#fff;"+
      "font-size:15px;font-weight:800;font-family:inherit;cursor:pointer}"+
    "#ag-gate button:disabled{background:#D9D6D0;color:#71767F;cursor:not-allowed}"+
    "#ag-gate .m{font-size:12.5px;margin-top:11px;min-height:17px;line-height:1.6}"+
    "#ag-gate .m.e{color:#B3261E;font-weight:700}"+
    "#ag-gate .f{margin-top:16px;font-size:12px;color:#71767F;text-align:center}"+
    "#ag-gate .f a{color:#6E7480;font-weight:700;text-decoration:none}";
  (document.head||document.documentElement).appendChild(st);
  document.documentElement.classList.add("ag-lock");

  function build(){
    if(document.getElementById("ag-gate")) return;
    var g=document.createElement("div");
    g.id="ag-gate";
    g.innerHTML=
      '<div class="b"><h1>고리 관리 화면</h1>'+
      '<p>등록된 관리자 계정만 접근할 수 있습니다.</p>'+
      '<label for="ag-e">이메일</label><input id="ag-e" type="email" autocomplete="username">'+
      '<label for="ag-p">비밀번호</label><input id="ag-p" type="password" autocomplete="current-password">'+
      '<button id="ag-b" type="button">로그인</button>'+
      '<div class="m" id="ag-m"></div>'+
      '<div class="f"><a href="index.html">← 고리 홈으로</a></div></div>';
    document.body.appendChild(g);
    var b=document.getElementById("ag-b");
    b.addEventListener("click", login);
    document.getElementById("ag-p").addEventListener("keydown", function(e){ if(e.key==="Enter") login(); });
  }

  function msg(t, err){
    var m=document.getElementById("ag-m"); if(!m) return;
    m.textContent=t||""; m.className="m"+(err?" e":"");
  }

  var sb=null;
  function client(){
    if(sb) return sb;
    if(!(window.supabase && window.supabase.createClient)) return null;
    sb=window.supabase.createClient(URL_, KEY_);
    return sb;
  }

  async function isAdmin(user){
    var c=client(); if(!c || !user) return false;
    try{
      var r=await c.from("admins").select("email").eq("email", user.email).limit(1);
      if(r.error){
        if(/schema cache|does not exist|PGRST205/i.test(r.error.message||"")){
          msg("admins 표가 없습니다. db/phase4_admin.sql 을 먼저 실행하세요.", true);
        }
        return false;
      }
      return !!(r.data && r.data.length);
    }catch(e){ return false; }
  }

  function unlock(){
    document.documentElement.classList.remove("ag-lock");
    var g=document.getElementById("ag-gate");
    if(g && g.parentNode) g.parentNode.removeChild(g);
    window.dispatchEvent(new Event("gori-admin-ready"));
  }

  async function login(){
    var c=client();
    if(!c){ msg("서버에 연결할 수 없습니다. 새로고침 후 다시 시도해 주세요.", true); return; }
    var e=(document.getElementById("ag-e").value||"").trim();
    var p=document.getElementById("ag-p").value||"";
    if(!e || !p){ msg("이메일과 비밀번호를 입력해 주세요.", true); return; }
    var b=document.getElementById("ag-b");
    b.disabled=true; b.textContent="확인 중…"; msg("");
    try{
      var r=await c.auth.signInWithPassword({ email:e, password:p });
      if(r.error){ msg("로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요.", true); return; }
      var u=r.data && r.data.user;
      if(await isAdmin(u)) unlock();
      else msg("관리자로 등록된 계정이 아닙니다.", true);
    }catch(err){
      msg("로그인 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.", true);
    }finally{
      b.disabled=false; b.textContent="로그인";
    }
  }

  async function boot(){
    build();
    var c=client(); if(!c) return;
    try{
      var s=await c.auth.getSession();
      var u=s && s.data && s.data.session ? s.data.session.user : null;
      if(u && await isAdmin(u)) unlock();
    }catch(e){}
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();

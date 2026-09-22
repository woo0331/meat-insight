/* ════════════════════════════════════════════════════════════════════
   관리자 잠금

   ⚠️ **이것은 진짜 자물쇠가 아닙니다.** 정적 사이트라 확인이 전부
   브라우저에서 일어납니다. 소스를 보거나 이 파일을 지우면 그냥 열립니다.
   여기서 막아 주는 것은 **주소를 우연히 아는 사람이 그냥 들어오는 것**
   까지입니다. 진짜로 막으려면 서버 쪽에서 막아야 합니다 —
   Vercel 의 Deployment Protection 을 /admin.html 에 거세요.

   ⚠️ 그래서 **비밀번호를 평문으로 적지 않았습니다.** 이 저장소는
   공개라, 평문을 적으면 그 비밀번호가 GitHub 에 그대로 올라갑니다.
   소금(salt)을 붙여 SHA-256 으로 해시한 값만 둡니다. 해시라고 안전해
   지는 것은 아니지만, 적어도 **비밀번호 글자 자체가 인터넷에 올라가지는
   않습니다** — 같은 비밀번호를 다른 곳에도 쓰신다면 이 차이가 큽니다.

   비밀번호를 바꾸려면:
     node -e "const c=require('crypto');console.log(
       c.createHash('sha256').update('aboutmeat-admin-v1:'+'새비밀번호').digest('hex'))"
   그 값을 아래 PASS_HASH 에 넣으세요.
   ════════════════════════════════════════════════════════════════════ */

var SALT = "aboutmeat-admin-v1:";
var PASS_HASH = "7e80cbdd0bc54e69d34601f3c8679b13f3dd47f479113186f6e891a3019ad0e9";
var SKEY = "wow.admin.open";

/* SHA-256 — crypto.subtle 은 https 에서만 됩니다. 파일을 그냥 열어
   확인할 때(file://)도 돌아야 하므로 직접 구현해 둡니다. */
function sha256(str){
  function rr(n,x){ return (x>>>n)|(x<<(32-n)); }
  var K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];

  /* UTF-8 바이트로 — 한글 비밀번호도 되어야 합니다 */
  var b=[], i, c;
  var u = unescape(encodeURIComponent(str));
  for(i=0;i<u.length;i++) b.push(u.charCodeAt(i)&0xff);
  var len=b.length*8;
  b.push(0x80);
  while(b.length%64!==56) b.push(0);
  for(i=7;i>=0;i--) b.push((i<4 ? (len>>>(i*8)) : 0)&0xff);

  var w=new Array(64);
  for(i=0;i<b.length;i+=64){
    var j;
    for(j=0;j<16;j++) w[j]=(b[i+j*4]<<24)|(b[i+j*4+1]<<16)|(b[i+j*4+2]<<8)|b[i+j*4+3];
    for(j=16;j<64;j++){
      var s0=rr(7,w[j-15])^rr(18,w[j-15])^(w[j-15]>>>3);
      var s1=rr(17,w[j-2])^rr(19,w[j-2])^(w[j-2]>>>10);
      w[j]=(w[j-16]+s0+w[j-7]+s1)|0;
    }
    var a=H[0],bb=H[1],cc=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(j=0;j<64;j++){
      var S1=rr(6,e)^rr(11,e)^rr(25,e), ch=(e&f)^(~e&g);
      var t1=(h+S1+ch+K[j]+w[j])|0;
      var S0=rr(2,a)^rr(13,a)^rr(22,a), mj=(a&bb)^(a&cc)^(bb&cc);
      var t2=(S0+mj)|0;
      h=g; g=f; f=e; e=(d+t1)|0; d=cc; cc=bb; bb=a; a=(t1+t2)|0;
    }
    H[0]=(H[0]+a)|0; H[1]=(H[1]+bb)|0; H[2]=(H[2]+cc)|0; H[3]=(H[3]+d)|0;
    H[4]=(H[4]+e)|0; H[5]=(H[5]+f)|0; H[6]=(H[6]+g)|0; H[7]=(H[7]+h)|0;
  }
  return H.map(function(x){ return ("00000000"+(x>>>0).toString(16)).slice(-8); }).join("");
}

function gateOpen(){
  /* sessionStorage 라 창을 닫으면 다시 묻습니다.
     localStorage 로 하면 공용 PC 에서 영영 열린 채로 남습니다. */
  try{ return sessionStorage.getItem(SKEY)==="1"; }catch(e){ return false; }
}

var GT = { tries:0 };
function gateSubmit(ev){
  ev.preventDefault();
  var el = document.getElementById("gt-pw");
  var msg = document.getElementById("gt-msg");
  var val = el ? el.value : "";
  /* 틀릴수록 느리게 — 창을 열어 두고 기계로 넣어 보는 것을 늦춥니다.
     (진짜 방어는 아닙니다. 위 주석을 보세요) */
  var wait = Math.min(2000, GT.tries * 400);
  var btn = document.getElementById("gt-go");
  if(btn) btn.disabled = true;

  setTimeout(function(){
    if(btn) btn.disabled = false;
    if(sha256(SALT + val) === PASS_HASH){
      try{ sessionStorage.setItem(SKEY,"1"); }catch(e){}
      var g=document.getElementById("gate"); if(g) g.remove();
      document.body.classList.remove("locked");
      if(typeof bootAdmin==="function") bootAdmin();
    }else{
      GT.tries++;
      if(msg) msg.textContent = "비밀번호가 맞지 않습니다.";
      if(el){ el.value=""; el.focus(); }
    }
  }, wait);
  return false;
}

function gatePaint(){
  if(gateOpen()){ if(typeof bootAdmin==="function") bootAdmin(); return; }
  document.body.classList.add("locked");
  var d=document.createElement("div");
  d.id="gate"; d.className="gate";
  /* ⚠️ 비밀번호 칸은 반드시 <form> 안에 둡니다. 폼이 없으면 크롬이
     문서 전체를 로그인 폼으로 보고 화면의 첫 글자칸에 저장된 아이디를
     밀어 넣습니다. 덤으로 엔터로도 들어갑니다. */
  d.innerHTML =
    '<form class="gate-box" onsubmit="return gateSubmit(event)">'+
      '<b>ABOUTMEAT</b><span>상품 관리</span>'+
      '<label for="gt-pw">비밀번호</label>'+
      '<input id="gt-pw" type="password" autocomplete="current-password" '+
        'autofocus required aria-describedby="gt-msg">'+
      '<button id="gt-go" class="btn btn-g btn-full" type="submit">들어가기</button>'+
      '<p id="gt-msg" role="alert"></p>'+
      '<a href="index.html">← 사이트로 돌아가기</a>'+
    '</form>';
  document.body.appendChild(d);
  var i=document.getElementById("gt-pw"); if(i) i.focus();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", gatePaint);
else gatePaint();

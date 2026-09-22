/* ════════════════════════════════════════════════════════════════════
   라우터 + 장바구니/찜 + 앱 시작

   주소 규칙 (전부 새로고침·공유 링크로 열립니다 — 화면을 새로 만들면
   반드시 여기 ROUTES 에 넣으세요. 안 넣으면 해시로는 열리는데
   새로고침하면 홈으로 튕깁니다):

     #/                       홈
     #/products               전체상품 (?today=1 ?trim=full ?sale=1 ?use=…)
     #/c/<sp>                 소·돼지 카테고리
     #/c/<sp>/<cat>           분류
     #/c/<sp>/<cat>/<item>    세부 품목
     #/p/<id>                 상품 상세
     #/enc                    부산물 도감
     #/enc/<sp>               도감 (소/돼지)
     #/enc/<sp>/<slug>        부위 상세
     #/b2b   #/b2b/quote      업소용 · 대량견적
     #/search?q=…             검색결과
     #/cart #/login #/signup #/my #/about #/terms #/privacy
   ════════════════════════════════════════════════════════════════════ */

var CART = [], WISH = [];
try{ CART = JSON.parse(localStorage.getItem("wow.cart")||"[]")||[]; }catch(e){ CART=[]; }
try{ WISH = JSON.parse(localStorage.getItem("wow.wish")||"[]")||[]; }catch(e){ WISH=[]; }
function save(){
  /* 시크릿 창·저장소 차단에서는 던집니다. 던져도 화면은 멀쩡해야 합니다. */
  try{ localStorage.setItem("wow.cart", JSON.stringify(CART));
       localStorage.setItem("wow.wish", JSON.stringify(WISH)); }catch(e){}
}

window.addCart = function(id, kg){
  var p=wowProduct(id); if(!p) return;
  kg = kg || (p.units&&p.units[0]) || 1;
  var f=CART.find(function(c){ return c.id===id; });
  if(f) f.kg += kg; else CART.push({id:id, kg:kg});
  save(); paintCartN();
  toast(p.name+" "+kg+"kg 을 장바구니에 담았습니다.");
};
window.delCart = function(i){ CART.splice(i,1); save(); paintCartN(); route(); };
/* 장바구니에서 수량을 바꿉니다. 빼고 다시 담게 하면 손님이 상품을
   다시 찾아 들어가야 합니다 — 실제로 그렇게 되어 있었습니다.
   kg 단위라 1kg 미만으로는 못 내리고, 0 이 되면 줄을 지웁니다. */
window.setCartKg = function(i, kg){
  var c = CART[i]; if(!c) return;
  kg = Math.round(Number(kg)*10)/10;
  if(!isFinite(kg) || kg < 1){ delCart(i); return; }
  c.kg = Math.min(kg, 9999);
  save(); route();
};
window.bumpCart = function(i, d){
  var c = CART[i]; if(!c) return;
  setCartKg(i, (Number(c.kg)||0) + d);
};
window.buyNow  = function(id){ addCart(id, DT.qty*DT.unit); go("#/cart"); };
window.checkout= function(){
  try{ console.warn("[ABOUTMEAT] 결제 연동이 아직 없습니다 — PG 사 연동 후 checkout() 을 바꾸세요."); }catch(e){}
  toast("지금은 이곳에서 결제하지 못합니다. 대량구매는 견적 문의를 이용해 주세요.");
};
window.toggleWish = function(id){
  var i=WISH.indexOf(id);
  if(i<0){ WISH.push(id); toast("찜한 상품에 담았습니다."); }
  else   { WISH.splice(i,1); toast("찜을 해제했습니다."); }
  save();
};
function paintCartN(){
  var n=$("cart-n"); if(!n) return;
  var c=CART.length;
  n.textContent=c; n.hidden = !c;
}

/* 알림 — 확인 버튼 없는 짧은 띠. 손님 작업을 막지 않습니다. */
var TT=null;
window.toast = function(msg){
  var t=$("toast");
  if(!t){ t=document.createElement("div"); t.id="toast"; t.className="toast"; document.body.appendChild(t); }
  t.textContent=msg; t.classList.add("on");
  clearTimeout(TT); TT=setTimeout(function(){ t.classList.remove("on"); }, 2600);
};

/* 로그인 상태. 인증을 붙이기 전까지는 늘 false 입니다.
   ⚠️ 여기를 true 로 바꾸기 전에 doLogin() 에 실제 인증을 붙이세요.
   "로그인한 척" 하면 마이페이지가 남의 주문을 보여주는 것처럼
   읽힙니다 — 없는 사실을 적는 것과 같습니다. */
window.isLoggedIn = function(){ return !!window.WOW_USER; };

window.go = function(h){ location.hash = h; };
window.doSearch = function(id){
  var i=$(id); if(!i) return false;
  var q=String(i.value||"").trim();
  go(q ? "#/search?q="+encodeURIComponent(q) : "#/products");
  return false;
};
window.doLogin = function(ev){
  ev.preventDefault();
  try{ console.warn("[ABOUTMEAT] 로그인 연동이 아직 없습니다 — doLogin() 에 인증을 붙이세요."); }catch(e){}
  toast("지금은 로그인을 받지 못합니다. 곧 열어 드리겠습니다.");
  return false;
};
window.doSignup = function(ev){
  ev.preventDefault();
  /* 필수 동의를 안 받고 가입시키면 안 됩니다. 인증을 붙인 뒤에도
     이 확인은 그대로 두세요 (개인정보보호법 제22조). */
  var missing = els(".agree .ag-r input[data-req]").filter(function(c){ return !c.checked; });
  if(missing.length){
    toast("필수 항목에 동의해 주셔야 가입하실 수 있습니다.");
    var first = missing[0];
    try{
      first.closest(".ag-r").classList.add("ag-miss");
      first.focus({ preventScroll:true });
      first.closest(".agree").scrollIntoView({ behavior:"smooth", block:"center" });
    }catch(e){}
    return false;
  }
  try{ console.warn("[ABOUTMEAT] 회원가입 연동이 아직 없습니다 — doSignup() 에 인증을 붙이세요. "+
    "동의 확인은 이미 들어 있으니 지우지 마세요."); }catch(e){}
  toast("지금은 가입을 받지 못합니다. 곧 열어 드리겠습니다.");
  return false;
};

/* 주소 → 화면. 모르는 주소는 홈으로 보내되 **주소도 같이 되돌립니다** —
   안 그러면 새로고침해도 영영 안 열리는 주소를 손님이 공유하게 됩니다. */
function parseQS(h){
  var i=h.indexOf("?"); if(i<0) return {};
  var o={};
  h.slice(i+1).split("&").forEach(function(kv){
    var a=kv.split("="); if(!a[0]) return;
    o[decodeURIComponent(a[0])] = decodeURIComponent((a[1]||"").replace(/\+/g," "));
  });
  return o;
}
var TITLES = {
  "/":"소·돼지 부산물 전문 온라인몰", "/products":"전체상품", "/cart":"장바구니",
  "/login":"로그인", "/signup":"회원가입", "/my":"마이페이지", "/b2b":"업소용 · 대량구매",
  "/enc":"부산물 도감", "/about":"브랜드 스토리", "/search":"검색결과",
  "/terms":"이용약관", "/privacy":"개인정보처리방침"
};

function render(){
  var raw = location.hash || "#/";
  var path = raw.replace(/^#/,"").split("?")[0] || "/";
  var qs   = parseQS(raw);
  var seg  = path.split("/").filter(Boolean);
  var html, title = TITLES[path] || "";

  if(path==="/" )                         html = PageHome();
  else if(seg[0]==="products"){
    var q = {};
    if(qs.today) q.today = true;
    if(qs.trim)  q.trim  = [qs.trim];
    if(qs.use)   q.use   = [qs.use];
    html = PageList({ q:q, title: qs.today ? "오늘 들어온 부산물"
                        : qs.trim ? "손질상품" : qs.sale ? "특가" : "전체상품" });
    title = qs.today?"오늘입고":(qs.trim?"손질상품":(qs.sale?"특가":"전체상품"));
  }
  else if(seg[0]==="c" && seg[1]){
    if(!WOW_CATS[seg[1]]) return bad();
    html = PageList({ q:{ sp:seg[1], cat:seg[2]||null, item:seg[3]||null } });
    title = [wowSpeciesName(seg[1]), seg[2]&&wowCatName(seg[1],seg[2]),
             seg[3]&&wowCatName(seg[1],seg[2],seg[3])].filter(Boolean).join(" · ");
  }
  else if(seg[0]==="p" && seg[1]){
    var p=wowProduct(seg[1]);
    html = PageDetail(seg[1]); title = p ? p.name : "상품";
  }
  else if(seg[0]==="enc"){ html = PageEnc(seg[1], seg[2]);
    title = seg[2] ? ((wowEnc(seg[1],seg[2])||{}).name||"부산물 도감") : "부산물 도감"; }
  else if(seg[0]==="b2b"){ html = seg[1]==="quote" ? PageQuote() : PageB2B();
    title = seg[1]==="quote" ? "대량견적 문의" : "업소용 · 대량구매"; }
  else if(path==="/search"){
    html = PageList({ q:{ text: qs.q||"" }, title: qs.q ? '"'+qs.q+'" 검색결과' : "검색" });
    title = "검색결과";
  }
  else if(path==="/cart")    html = PageCart();
  else if(path==="/login")   html = PageLogin();
  else if(path==="/signup")  html = PageSignup();
  else if(path==="/my")      html = PageMy();
  else if(path==="/about")   html = PageAbout();
  else if(path==="/terms")   html = PageTerms();
  else if(path==="/privacy") html = PagePrivacy();
  else return bad();

  $("view").innerHTML = html;
  document.title = (title ? title+" · " : "") + "ABOUTMEAT 축산 부산물 전문마켓";
  paintGnb(); paintMnav(); paintBiz(); paintCartN();
  window.scrollTo(0,0);

  function bad(){
    /* 히스토리를 늘리지 않고 주소를 정리합니다 */
    history.replaceState(null,"","#/");
    render();
  }
}
window.route = render;

function boot(){
  document.body.insertAdjacentHTML("afterbegin",
    Header()+'<main id="view"></main>'+Footer()+MobileNav());
  window.addEventListener("hashchange", render);
  render();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

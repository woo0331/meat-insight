/* ════════════════════════════════════════════════════════════════════
   라우터 + 장바구니/찜 + 앱 시작

   주소 규칙 (전부 새로고침·공유 링크로 열립니다 — 화면을 새로 만들면
   반드시 여기 ROUTES 에 넣으세요. 안 넣으면 해시로는 열리는데
   새로고침하면 홈으로 튕깁니다):

     /                        홈
     /products                전체상품
     /products/today          오늘입고     /products/trim  손질상품
     /products/sale           특가
     /c/<sp>                  소·돼지 카테고리
     /c/<sp>/<cat>            분류
     /c/<sp>/<cat>/<item>     세부 품목
     /p/<id>                  상품 상세
     /enc                     부산물 도감
     /enc/<sp>                도감 (소/돼지)
     /enc/<sp>/<slug>         부위 상세
     /b2b   /b2b/quote        업소용 · 대량견적
     /search?q=…              검색결과 (noindex — 무한히 생깁니다)
     /cart /login /signup /my /about /terms /privacy
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
  /* 화면에서 이미 막지만 여기서도 막습니다. 담기는 길이 여러 군데라
     (카드·상세·바로구매) 한 곳만 막으면 샙니다. */
  if(typeof isSoldOut==="function" && isSoldOut(p)){
    toast(p.name+josa(p.name,"은는")+" 지금 품절입니다.");
    return;
  }
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
window.buyNow  = function(id){ addCart(id, DT.qty*DT.unit); go("/cart"); };
/* 장바구니 → 주문서. 받을 수 있는 결제수단이 있는지는 **주문서가**
   판단합니다 (없으면 폼 대신 전화 안내를 냅니다) — 여기서 한 번,
   거기서 한 번 따로 따지면 둘이 어긋납니다. */
window.checkout = function(){ go("/order"); };
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

/* 화면에 적는 모양과 tel: 에 넣는 모양이 다릅니다 */
window.telNum = function(s){ return String(s||"").replace(/[^0-9+]/g,""); };

/* 화면 옮기기. 주소를 실제로 바꾸고(pushState) 다시 그립니다.
   ⚠️ location.href 를 쓰면 페이지가 통째로 새로 뜹니다 — 장바구니가
   다시 읽히고 화면이 깜빡입니다. */
window.go = function(url, opt){
  opt = opt || {};
  if(!url) return;
  if(/^https?:|^tel:|^mailto:/.test(url)){ location.href = url; return; }
  if(url.charAt(0)!=="/") url = "/"+url.replace(/^#\/?/,"");
  if(url === location.pathname + location.search){ return; }   /* 같은 곳이면 아무것도 안 함 */
  RT.keepScroll = !!opt.keepScroll;
  history[opt.replace ? "replaceState" : "pushState"](null, "", url);
  render();
};

/* 사이트 안의 링크는 가로채서 새로고침 없이 넘깁니다.
   ⚠️ 새 탭(ctrl/cmd/가운데 클릭)·다운로드·외부 링크·target 이 있는 것은
   건드리지 않습니다. 가로채면 "새 탭으로 열기" 가 안 먹습니다. */
document.addEventListener("click", function(e){
  if(e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  var a = e.target.closest && e.target.closest("a[href]");
  if(!a) return;
  var href = a.getAttribute("href");
  if(!href || href.charAt(0)!=="/") return;                 /* 사이트 안의 절대 경로만 */
  if(a.target || a.hasAttribute("download") || a.getAttribute("rel")==="external") return;
  if(/^\/(admin|api)\b/.test(href)) return;                 /* 관리자·API 는 진짜로 이동 */
  e.preventDefault();
  go(href);
});

/* 뒤로·앞으로 */
window.addEventListener("popstate", function(){ render(); });
window.doSearch = function(id){
  var i=$(id); if(!i) return false;
  var q=String(i.value||"").trim();
  go(q ? "/search?q="+encodeURIComponent(q) : "/products");
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
/* ════════════════════════════════════════════════════════════════════
   라우터 — 진짜 주소를 씁니다 (#/c/beef 가 아니라 /c/beef)

   ⚠️ 예전에는 해시(#/...)를 썼습니다. 화면은 잘 돌았지만 **검색엔진에
   안 잡혔습니다.** 해시 뒤는 서버로 전송되지 않아서, 크롤러 눈에는
   상품이 몇 개든 주소가 "/" 하나뿐입니다. 부산물 전문몰인데
   "한우곱창 판매" 로 검색해서 들어올 길이 없었습니다.

   지금은 History API 로 진짜 경로를 씁니다.
     · 주소마다 실제 HTML 파일이 있습니다 (build-pages.js 가 만듭니다)
       → 크롤러가 JS 를 안 돌려도 제목·설명·상품정보를 읽습니다
     · 파일이 없는 주소(새로 넣은 상품)는 vercel.json 의 rewrite 가
       index.html 로 보내 줍니다 → 화면은 정상, 메타만 기본값
     · 아예 없는 주소는 404.html 이 뜹니다 (진짜 404 — 검색엔진에
       "없는 페이지" 라고 정확히 알려 줍니다)
   ════════════════════════════════════════════════════════════════════ */

function parseQS(search){
  var o={}, q=String(search||"").replace(/^\?/,"");
  if(!q) return o;
  q.split("&").forEach(function(kv){
    var a=kv.split("="); if(!a[0]) return;
    try{ o[decodeURIComponent(a[0])] = decodeURIComponent((a[1]||"").replace(/\+/g," ")); }
    catch(e){ o[a[0]] = a[1]||""; }
  });
  return o;
}

/* 주소 한 곳에서만 읽습니다. 끝의 / 는 없는 것으로 봅니다
   (/c/beef 와 /c/beef/ 가 다른 페이지가 되면 검색엔진이 중복으로 봅니다) */
function here(){
  var path = location.pathname.replace(/\/index\.html$/,"/").replace(/(.)\/+$/,"$1") || "/";
  return { path:path, qs:parseQS(location.search), seg:path.split("/").filter(Boolean) };
}

/* 제목과 설명 — 검색 결과에 그대로 나옵니다.
   ⚠️ 설명을 비워 두면 구글이 본문에서 아무 문장이나 가져다 씁니다.
   주소마다 직접 적습니다. */
var META = {
  "/":         ["소·돼지 부산물 전문 온라인몰",
                "도축장에서 시작되는 신선한 축산 부산물. 곱창·대창·막창·양·천엽·장기류·머리·족·뼈까지 필요한 손질 상태와 규격으로 공급합니다."],
  "/products": ["전체상품", "소·돼지 부산물 전 품목. 축종·손질 상태·용도로 골라 보세요."],
  "/cart":     ["장바구니", "담으신 부산물을 확인하고 주문하세요."],
  "/order":    ["주문서", "받으실 곳과 결제수단을 확인하고 주문을 마칩니다."],
  "/order/done":["주문 완료", "주문이 접수되었습니다."],
  "/login":    ["로그인", "ABOUTMEAT 로그인"],
  "/signup":   ["회원가입", "ABOUTMEAT 회원가입. 사업자회원은 전용가와 대량구매 상담을 이용하실 수 있습니다."],
  "/my":       ["마이페이지", "주문 내역과 찜한 상품을 확인하세요."],
  "/b2b":      ["업소용 · 대량구매",
                "식당·국밥집·곱창전문점·식자재업체를 위한 대용량 부산물 공급. 사업자 전용가와 정기 납품 상담."],
  "/b2b/quote":["대량견적 문의", "필요하신 품목과 수량을 남겨 주시면 담당자가 맞춤 견적을 드립니다."],
  "/enc":      ["부산물 도감", "알면 더 맛있는 축산 부산물 이야기. 부위별 특징·식감·손질방법·추천요리를 정리했습니다."],
  "/about":    ["브랜드 스토리", "축산 현장을 이해하는 부산물 전문업체. 모든 한 점까지, 가치 있게."],
  "/search":   ["검색결과", "찾으시는 부산물을 검색해 보세요."],
  "/terms":    ["이용약관", "ABOUTMEAT 이용약관"],
  "/privacy":  ["개인정보처리방침", "ABOUTMEAT 개인정보처리방침"]
};

/* 검색엔진에 올리면 안 되는 주소.
   장바구니·로그인·마이페이지는 사람마다 내용이 다르고, 검색에서
   들어와도 쓸모가 없습니다. 검색 결과 주소는 무한히 생깁니다. */
var NOINDEX = ["/cart","/order","/order/done","/login","/signup","/my","/search"];

/* 주소 → 무엇을 그릴지. 화면과 메타를 같이 돌려줍니다.
   build-pages.js 도 이 함수를 써서 메타를 뽑으므로, 여기만 고치면
   화면과 정적 파일이 같이 따라옵니다. */
window.routeInfo = function(path, qs){
  qs = qs || {};
  var seg = path.split("/").filter(Boolean);
  var m = META[path];
  var r = { title: m?m[0]:"", desc: m?m[1]:"", canon: path, ok: true,
            noindex: NOINDEX.indexOf(path) >= 0 };

  if(path==="/") { r.view="home"; return r; }
  if(seg[0]==="products"){
    var kind = seg[1]||"";
    if(kind && ["today","trim","sale"].indexOf(kind)<0) { r.ok=false; return r; }
    r.view="list"; r.kind=kind;
    r.title = kind==="today"?"오늘 들어온 부산물" : kind==="trim"?"손질상품" : kind==="sale"?"특가" : "전체상품";
    r.desc  = kind==="today"?"오늘 작업한 원물을 냉장 상태로 보내 드립니다."
            : kind==="trim" ?"바로 조리할 수 있게 완전 손질한 부산물입니다."
            : kind==="sale" ?"지금 특가로 준비한 부산물입니다."
            : META["/products"][1];
    return r;
  }
  if(seg[0]==="c" && seg[1]){
    if(!WOW_CATS[seg[1]]) { r.ok=false; return r; }
    var spN = wowSpeciesName(seg[1]);
    var catN = seg[2] ? wowCatName(seg[1],seg[2]) : null;
    var itN  = seg[3] ? wowCatName(seg[1],seg[2],seg[3]) : null;
    if((seg[2] && !catN) || (seg[3] && !itN)) { r.ok=false; return r; }
    r.view="cat"; r.sp=seg[1]; r.cat=seg[2]||null; r.item=seg[3]||null;
    r.title = [spN, catN, itN].filter(Boolean).join(" · ");
    /* ⚠️ 설명에 **축종을 붙입니다.** 소와 돼지에 같은 이름의 분류·부위가
       여럿이라(위·장류 · 장기류 · 막창 · 간 …) 안 붙이면 주소가 다른
       화면 여덟 개가 **똑같은 설명**을 달고 나갑니다. 구글 서치콘솔이
       "중복된 설명" 으로 표시하고, 검색 결과 두 줄이 같은 말을 합니다.
       제목에는 이미 붙어 있었습니다 — 설명만 빠져 있었습니다. */
    var label = itN ? wowPartTitle(seg[1], itN)
              : catN ? wowPartTitle(seg[1], catN)
              : spN;
    r.desc  = label+" 판매. "+
      (itN ? label+josa(label,"을를")+" 원물·1차 세척·완전 손질 중 필요한 상태로 보내 드립니다."
           : "신선한 "+label+josa(label,"을를")+" 필요한 규격으로 공급합니다.");
    return r;
  }
  if(seg[0]==="p" && seg[1]){
    var pr = wowProduct(seg[1]);
    r.view="detail"; r.id=seg[1];
    if(!pr){ r.title="상품"; r.desc="찾으시는 상품이 없습니다."; r.noindex=true; return r; }
    r.product = pr;
    r.title = pr.name;
    r.desc  = [pr.origin, WOW_TEMP[pr.temp], WOW_TRIM[pr.trim]].filter(Boolean).join(" · ")+
              " · "+wowWon(pr.price)+"원/kg. "+
              ((pr.uses||[]).length ? (pr.uses.join("·")+"에 쓰는 ") : "")+pr.name+" 판매.";
    return r;
  }
  if(seg[0]==="enc"){
    if(seg[1] && !WOW_ENC[seg[1]]) { r.ok=false; return r; }
    r.view="enc"; r.sp=seg[1]||null; r.slug=seg[2]||null;
    if(seg[2]){
      var e = wowEnc(seg[1], seg[2]);
      if(!e){ r.ok=false; return r; }
      r.ent = e;
      /* ⚠️ 축종을 붙입니다. 소·돼지에 같은 이름의 부위가 여럿이라
         (간·염통·허파·콩팥·막창·잡뼈·선지·지방…) 그냥 두면 검색
         결과에 똑같은 제목이 두 줄 뜹니다. */
      r.title = wowPartTitle(seg[1], e.name); r.desc = e.desc;
    }else if(seg[1]){
      r.title = wowSpeciesName(seg[1])+" 도감";
      r.desc  = wowSpeciesName(seg[1])+" 부위별 특징·식감·손질방법·추천요리를 정리했습니다.";
    }
    return r;
  }
  if(seg[0]==="order"){
    if(seg[1] && seg[1]!=="done") { r.ok=false; return r; }
    r.view = seg[1]==="done" ? "orderDone" : "order"; return r;
  }
  if(seg[0]==="b2b"){
    if(seg[1] && seg[1]!=="quote") { r.ok=false; return r; }
    r.view = seg[1]==="quote" ? "quote" : "b2b"; return r;
  }
  if(path==="/search"){
    r.view="search"; r.q=qs.q||"";
    if(r.q){ r.title='"'+r.q+'" 검색결과'; r.canon="/search"; }
    return r;
  }
  if(m){ r.view = path.slice(1); return r; }
  r.ok=false; return r;
};

/* 메타 태그를 실제로 갈아 끼웁니다 (화면을 옮길 때마다) */
function paintMeta(r){
  var site = "ABOUTMEAT 축산 부산물 전문마켓";
  document.title = (r.title ? r.title+" · " : "") + site;
  setMeta("name","description", r.desc || META["/"][1]);
  setMeta("property","og:title", (r.title?r.title+" · ":"")+site);
  setMeta("property","og:description", r.desc || META["/"][1]);
  setMeta("property","og:url", ORIGIN + (r.canon||"/"));
  setMeta("name","robots", r.noindex ? "noindex, follow" : "index, follow");
  var c = document.querySelector('link[rel="canonical"]');
  if(!c){ c=document.createElement("link"); c.rel="canonical"; document.head.appendChild(c); }
  c.href = ORIGIN + (r.canon||"/");
  paintLd(r);
}
var ORIGIN = "https://aboutmeat.co.kr";
function setMeta(attr, key, val){
  var el = document.head.querySelector("meta["+attr+'="'+key+'"]');
  if(!el){ el=document.createElement("meta"); el.setAttribute(attr,key); document.head.appendChild(el); }
  el.setAttribute("content", val||"");
}

/* 구조화 데이터 — 구글 쇼핑 검색에 가격·재고가 같이 나옵니다.
   ⚠️ 화면에 없는 값을 적으면 안 됩니다. 후기 수가 0이면 aggregateRating
   을 넣지 않습니다 — 없는 별점을 검색 결과에 띄우는 셈입니다. */
function paintLd(r){
  var old = document.getElementById("ld"); if(old) old.remove();
  /* 한 화면에 여러 개를 냅니다 — 상품 + 빵부스러기 + 목록.
     JSON-LD 는 맨 바깥이 배열이어도 됩니다. */
  var data = [].concat(
    (window.ldFor ? ldFor(r) : null) || [],
    (window.ldCrumbs ? ldCrumbs(r, location.pathname) : null) || [],
    ((window.ldList && (r.view==="cat"||r.view==="list"))
      ? ldList(wowFind(r.view==="cat" ? {sp:r.sp,cat:r.cat,item:r.item} : listQuery(r.kind))) : null) || []
  );
  if(!data.length) return;
  if(data.length===1) data = data[0];
  var s = document.createElement("script");
  s.type="application/ld+json"; s.id="ld";
  s.textContent = JSON.stringify(data);
  document.head.appendChild(s);
}
window.ldFor = function(r){
  if(r.view==="detail" && r.product){
    var p = r.product;
    var o = {
      "@context":"https://schema.org", "@type":"Product",
      name:p.name,
      image: ORIGIN+"/img/"+p.img+(/^[qe]-/.test(p.img)?".png":".jpg"),
      description: r.desc,
      sku: p.id,
      category: [wowSpeciesName(p.sp), wowCatName(p.sp,p.cat)].filter(Boolean).join(" > "),
      offers:{ "@type":"Offer", url:ORIGIN+"/p/"+p.id,
        priceCurrency:"KRW", price:String(p.price),
        availability: isSoldOut(p) ? "https://schema.org/OutOfStock"
                                   : "https://schema.org/InStock",
        itemCondition:"https://schema.org/NewCondition" }
    };
    if(p.breed && WOW_BREED[p.breed]) o.brand = { "@type":"Brand", name:WOW_BREED[p.breed] };
    if(Number(p.reviews) > 0 && Number(p.rating) > 0){
      o.aggregateRating = { "@type":"AggregateRating",
        ratingValue:String(p.rating), reviewCount:String(p.reviews) };
    }
    return o;
  }
  if(r.view==="home"){
    return [
      { "@context":"https://schema.org", "@type":"OnlineStore",
        name:"ABOUTMEAT", url:ORIGIN,
        description: META["/"][1],
        image: ORIGIN+"/og.jpg" },
      /* 검색창 — 구글 결과에 사이트 안 검색칸이 붙습니다.
         ⚠️ /search 가 실제로 도는 주소라서 적는 것입니다. 없는 기능을
         적으면 눌러 들어온 손님이 빈 화면을 봅니다. */
      { "@context":"https://schema.org", "@type":"WebSite",
        name:"ABOUTMEAT", url:ORIGIN+"/",
        potentialAction:{ "@type":"SearchAction",
          target:{ "@type":"EntryPoint", urlTemplate:ORIGIN+"/search?q={search_term_string}" },
          "query-input":"required name=search_term_string" } }
    ];
  }
  return null;
};

/* 화면의 breadcrumb 을 **그대로** 구조화 데이터로도 냅니다.
   구글 검색 결과의 주소 줄이 "aboutmeat.co.kr › 소 부산물 › 위·장류"
   처럼 나옵니다.

   ⚠️ 화면에 보이는 것과 **같아야** 합니다. 여기만 늘리면 검색 결과와
   실제 화면이 다른 말을 하게 됩니다. */
window.ldCrumbs = function(r, route){
  /* 홈에서는 빵부스러기가 없습니다 — "홈 › 홈" 이 됩니다.
     검색에 안 올릴 화면(NOINDEX)도 뺍니다. */
  if(r.view==="home" || r.noindex) return null;
  var t = [["홈","/"]];
  if(r.view==="detail" && r.product){
    var p = r.product;
    t.push([wowSpeciesName(p.sp), "/c/"+p.sp]);
    if(wowCatName(p.sp,p.cat)) t.push([wowCatName(p.sp,p.cat), "/c/"+p.sp+"/"+p.cat]);
    t.push([p.name, "/p/"+p.id]);
  } else if(r.view==="cat" && r.sp){
    t.push([wowSpeciesName(r.sp), "/c/"+r.sp]);
    if(r.cat && wowCatName(r.sp,r.cat)) t.push([wowCatName(r.sp,r.cat), "/c/"+r.sp+"/"+r.cat]);
    if(r.item && wowCatName(r.sp,r.cat,r.item))
      t.push([wowCatName(r.sp,r.cat,r.item), "/c/"+r.sp+"/"+r.cat+"/"+r.item]);
  } else if(r.view==="enc"){
    t.push(["부산물 도감","/enc"]);
    if(r.sp) t.push([wowSpeciesName(r.sp)+" 도감", "/enc/"+r.sp]);
    if(r.slug && r.ent) t.push([r.ent.name, "/enc/"+r.sp+"/"+r.slug]);
  } else if(r.title){
    t.push([r.title, route]);
  }
  if(t.length < 2) return null;
  return { "@context":"https://schema.org", "@type":"BreadcrumbList",
    itemListElement: t.map(function(x,i){
      return { "@type":"ListItem", position:i+1, name:x[0], item:ORIGIN+x[1] };
    }) };
};

/* 목록 화면에 실린 상품들 — 화면에 보이는 순서 그대로입니다. */
window.ldList = function(list){
  if(!list || !list.length) return null;
  return { "@context":"https://schema.org", "@type":"ItemList",
    numberOfItems: list.length,
    itemListElement: list.slice(0,30).map(function(p,i){
      return { "@type":"ListItem", position:i+1, name:p.name, url:ORIGIN+"/p/"+p.id };
    }) };
};

/* "전체상품 / 오늘입고 / 손질상품 / 특가" 가 무엇으로 걸러지는지.
   ⚠️ 한 곳에만 둡니다 — 화면과 build-pages.js 가 같은 셈법을 써야
   정적 파일의 내용과 실제 화면이 어긋나지 않습니다. */
window.listQuery = function(kind){
  if(kind==="today") return { today:true };
  if(kind==="trim")  return { trim:["full"] };
  if(kind==="sale")  return { badge:"sale" };
  return {};
};

function render(){
  var h = here();
  var r = routeInfo(h.path, h.qs);
  if(!r.ok) return notFound(h.path);

  var html;
  switch(r.view){
    case "home":    html = PageHome(); break;
    case "list":    html = PageList({ q: listQuery(r.kind), title: r.title }); break;
    case "cat":     html = PageList({ q:{ sp:r.sp, cat:r.cat, item:r.item } }); break;
    case "detail":  html = PageDetail(r.id); break;
    case "enc":     html = PageEnc(r.sp, r.slug); break;
    case "b2b":     html = PageB2B(); break;
    case "quote":   html = PageQuote(); break;
    case "search":  html = PageList({ q:{ text:r.q }, title: r.q?'"'+r.q+'" 검색결과':"검색" }); break;
    case "cart":    html = PageCart(); break;
    case "order":   html = PageOrder(); break;
    case "orderDone": html = PageOrderDone(); break;
    case "login":   html = PageLogin(); break;
    case "signup":  html = PageSignup(); break;
    case "my":      html = PageMy(); break;
    case "about":   html = PageAbout(); break;
    case "terms":   html = PageTerms(); break;
    case "privacy": html = PagePrivacy(); break;
    default:        return notFound(h.path);
  }

  $("view").innerHTML = html;
  paintMeta(r);
  paintGnb(); paintMnav(); paintBiz(); paintCartN();
  if(!RT.keepScroll) window.scrollTo(0,0);
  RT.keepScroll = false;
}

/* 없는 주소 — 서버가 404.html 을 주므로 여기까지 오는 일은 드뭅니다
   (주소를 직접 고쳐 넣거나, 상품이 지워진 링크를 눌렀을 때). */
function notFound(path){
  $("view").innerHTML =
    '<div class="w"><div class="empty">'+
      '<div class="empty-t">찾으시는 페이지가 없습니다</div>'+
      '<div class="empty-d">주소가 바뀌었거나 판매가 끝난 상품일 수 있습니다.</div>'+
      '<a class="btn btn-g btn-lg" href="/products">전체상품 보기</a></div></div>';
  document.title = "찾을 수 없습니다 · ABOUTMEAT 축산 부산물 전문마켓";
  setMeta("name","robots","noindex, follow");
  paintGnb(); paintMnav(); paintBiz(); paintCartN();
  window.scrollTo(0,0);
}

var RT = { keepScroll:false };
window.route = render;

function boot(){
  document.body.insertAdjacentHTML("afterbegin",
    Header()+'<main id="view"></main>'+Footer()+MobileNav());
  render();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

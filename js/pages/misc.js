/* ════════════════════════════════════════════════════════════════════
   07. 부산물 도감 · 08. B2B · 10. 장바구니 · 11. 로그인/회원가입
   12. 마이페이지 · 브랜드 소개
   ════════════════════════════════════════════════════════════════════ */

/* ── 07. 부산물 도감 (지시서 18번) ──────────────────────── */
var EN = { sp:"beef", cat:"" };

function PageEnc(sp, slug){
  EN.sp = sp || EN.sp || "beef";
  if(slug) return encDetail(EN.sp, slug);

  return Breadcrumb([["홈","#/"],["부산물 도감",""]])+
  '<section class="ench" style="background-image:url(img/enc-hero.jpg)">'+
    '<div class="w"><div class="ench-in">'+
      '<h1>부산물 도감</h1><p>알면 더 맛있는 축산 부산물 이야기.</p>'+
    '</div></div></section>'+
  '<div class="w enc-wrap">'+
    '<div class="enc-tabs">'+WOW_SPECIES.map(function(s){
      return '<a class="enc-tab'+(EN.sp===s.slug?" on":"")+'" href="#/enc/'+esc(s.slug)+'">'+
        esc(s.name)+'</a>'; }).join("")+'</div>'+
    '<div class="enc-cols" id="enc-body">'+encBody()+'</div>'+
  '</div>';
}

function encBody(){
  var all = WOW_ENC[EN.sp] || [];
  var cats = (WOW_CATS[EN.sp]||[]).filter(function(c){
    return all.some(function(e){ return e.cat===c.slug; });
  });
  var list = EN.cat ? all.filter(function(e){ return e.cat===EN.cat; }) : all;
  return '<aside class="enc-side"><ul>'+
      '<li><button class="'+(EN.cat?"":"on")+'" onclick="encCat(\'\')">전체보기</button></li>'+
      cats.map(function(c){
        return '<li><button class="'+(EN.cat===c.slug?"on":"")+'" '+
          'onclick="encCat(\''+esc(c.slug)+'\')">'+esc(c.name)+'</button></li>'; }).join("")+
    '</ul></aside>'+
    '<div class="enc-main">'+
      (list.length ? '<div class="qg">'+list.map(function(e){ return EncyclopediaCard(e, EN.sp); }).join("")+'</div>'
        : '<div class="empty"><div class="empty-t">이 분류의 도감은 준비 중입니다</div>'+
          '<div class="empty-d">다른 분류를 먼저 보실 수 있습니다.</div></div>')+
    '</div>';
}
window.encCat = function(c){ EN.cat=c; var b=$("enc-body"); if(b) b.innerHTML=encBody(); };

function encDetail(sp, slug){
  var e = wowEnc(sp, slug);
  if(!e) return Breadcrumb([["홈","#/"],["부산물 도감","#/enc"],["",""]])+
    '<div class="w"><div class="empty"><div class="empty-t">찾으시는 부위가 없습니다</div>'+
    '<a class="btn btn-g" href="#/enc/'+esc(sp)+'">도감으로 돌아가기</a></div></div>';

  var rel = (e.rel||[]).map(wowProduct).filter(Boolean);
  return Breadcrumb([["홈","#/"],["부산물 도감","#/enc"],[wowSpeciesName(sp),"#/enc/"+sp],[e.name,""]])+
  '<div class="w enc-d">'+
    '<div class="enc-d-top">'+
      '<div class="enc-d-img">'+imgTag(e.img, e.name)+'</div>'+
      '<div class="enc-d-txt">'+
        '<h1>'+esc(e.name)+'</h1>'+
        '<p class="lead">'+esc(e.desc)+'</p>'+
        '<dl class="enc-dl">'+
          [["특징",e.feat],["식감",e.texture],["손질방법",e.trim],
           ["추천요리",(e.cook||[]).join(", ")]]
            .filter(function(r){ return r[1]; })
            .map(function(r){ return '<dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd>'; }).join("")+
        '</dl>'+
      '</div>'+
    '</div>'+
    '<div class="enc-d-dia"><h3>이 부위는 어디인가요?</h3>'+PartDiagram(sp, e)+'</div>'+
  '</div>'+
  /* 관련상품은 **실제로 있는 것만** — 없으면 구간째 뺍니다 */
  (rel.length ? '<section class="sec sec-w"><div class="w">'+
    '<div class="sec-hd"><div class="sec-hd-t"><h2>'+esc(e.name)+' 상품</h2></div></div>'+
    ProductGrid(rel)+'</div></section>' : '');
}

/* ── 08. B2B (지시서 19번) ──────────────────────────────── */
function PageB2B(){
  var biz = wowFind({use:["업소용"]}).slice(0,8);
  return '<section class="hero hero-b2b">'+
    '<div class="hero-ph" style="background-image:url(img/b2b-hero.jpg)"></div>'+
    '<div class="w hero-in">'+
      '<h1>사업자를 위한<br>대량구매 솔루션</h1>'+
      '<p>식당 · 국밥집 · 곱창전문점 · 식자재업체 · 가공업체를 위한<br>전문 부산물 공급</p>'+
      '<div class="hero-btns">'+
        '<a class="btn btn-g btn-lg" href="#/signup?biz=1">사업자 회원가입'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="#/b2b/quote">대량견적 문의'+icon("arrow",18)+'</a>'+
      '</div></div></section>'+
  '<section class="sec sec-i"><div class="w"><div class="qg">'+[
      ["tag",  "사업자 전용 가격","더 합리적인 단가"],
      ["doc",  "대량 주문 견적","맞춤 견적 상담"],
      ["truck","정기 납품 서비스","안정적인 공급"],
      ["phone","전문 상담 지원","업종별 맞춤 제안"]
    ].map(function(t){
      return '<div class="prm"><div class="prm-ic">'+icon(t[0],30)+'</div>'+
        '<b>'+esc(t[1])+'</b><span>'+esc(t[2])+'</span></div>'; }).join("")+
  '</div></div></section>'+
  (biz.length ? '<section class="sec sec-w"><div class="w">'+
    '<div class="sec-hd"><div class="sec-hd-t"><h2>업소용 추천 부산물</h2>'+
      '<p>대용량 규격으로 공급 가능한 품목입니다</p></div>'+
      '<a class="sec-more" href="#/products?use=업소용">전체보기'+icon("chev",16)+'</a></div>'+
    ProductGrid(biz)+'</div></section>' : '')+
  '<section class="sec sec-i"><div class="w">'+B2BBanner({
      img:"b2b-hero", title:"필요한 규격이 따로 있으신가요?",
      desc:"수량 · 손질 상태 · 납품 주기를 알려 주시면 담당자가 맞춤 견적을 드립니다.",
      cta:"대량견적 문의하기", to:"#/b2b/quote" })+'</div></section>';
}

/* 대량견적 문의 폼 — 접수처가 아직 없으면 **손님에게는 "아직 이곳에서
   받지 못합니다" 까지만** 말하고, 무엇을 설정해야 하는지는 콘솔로. */
function PageQuote(){
  return Breadcrumb([["홈","#/"],["업소용","#/b2b"],["대량견적 문의",""]])+
  '<div class="w form-wrap"><h1 class="pg-h1">대량견적 문의</h1>'+
    '<p class="pg-lead">필요하신 품목과 수량을 남겨 주시면 담당자가 확인 후 연락드립니다.</p>'+
    '<form class="form" onsubmit="return submitQuote(event)">'+
      fRow("업체명","q-co","text",true,"예: 대성국밥")+
      fRow("담당자","q-nm","text",true,"")+
      fRow("연락처","q-tel","tel",true,"010-0000-0000")+
      fRow("이메일","q-em","email",false,"")+
      '<div class="f-r"><label for="q-it">필요 품목 <b>*</b></label>'+
        '<textarea id="q-it" rows="4" required placeholder="예: 한우 곱창 완전손질 20kg / 주 2회"></textarea></div>'+
      '<button class="btn btn-g btn-lg btn-full" type="submit">문의 보내기</button>'+
    '</form></div>';
}
function fRow(label,id,type,req,ph){
  return '<div class="f-r"><label for="'+id+'">'+esc(label)+(req?' <b>*</b>':'')+'</label>'+
    '<input id="'+id+'" type="'+type+'"'+(req?" required":"")+
    (ph?' placeholder="'+esc(ph)+'"':'')+' autocomplete="off"></div>';
}
window.submitQuote = function(ev){
  ev.preventDefault();
  try{ console.warn("[ABOUTMEAT] 견적 문의 접수처가 아직 연결되지 않았습니다 — "+
    "js/data/site.js 의 WOW_BIZ.quoteTo(이메일 또는 API)를 설정하세요."); }catch(e){}
  toast("지금은 이곳에서 접수하지 못합니다. 고객센터로 연락해 주세요.");
  return false;
};

/* ── 10. 장바구니 ───────────────────────────────────────── */
function PageCart(){
  var rows = CART.map(function(c){
    var p=wowProduct(c.id); return p?{p:p,kg:c.kg}:null;
  }).filter(Boolean);
  var total = rows.reduce(function(a,r){ return a + r.p.price*r.kg; }, 0);

  return Breadcrumb([["홈","#/"],["장바구니",""]])+
  '<div class="w cart-wrap"><h1 class="pg-h1">장바구니</h1>'+
    (rows.length ?
      '<div class="cart-cols"><div class="cart-l">'+rows.map(function(r,i){
        return '<div class="cr">'+
          '<a class="cr-i" href="#/p/'+esc(r.p.id)+'">'+imgTag(r.p.img,r.p.name)+'</a>'+
          '<div class="cr-b"><a class="cr-n" href="#/p/'+esc(r.p.id)+'">'+esc(r.p.name)+'</a>'+
            '<div class="cr-m">'+esc([r.p.origin,WOW_TEMP[r.p.temp],WOW_TRIM[r.p.trim]].filter(Boolean).join(" · "))+'</div>'+
            '<div class="cr-q">'+r.kg+'kg × '+wowWon(r.p.price)+'원/kg</div></div>'+
          '<div class="cr-r"><b>'+wowWon(r.p.price*r.kg)+'원</b>'+
            '<button class="cr-x" onclick="delCart('+i+')" aria-label="빼기">'+icon("x",18)+'</button></div>'+
        '</div>'; }).join("")+'</div>'+
      '<aside class="cart-s"><h3>결제 예정 금액</h3>'+
        '<div class="cs-r"><span>상품금액</span><b>'+wowWon(total)+'원</b></div>'+
        '<div class="cs-r"><span>배송비</span><b>'+(total>=100000?"무료":"3,000원")+'</b></div>'+
        '<div class="cs-t"><span>합계</span><b>'+wowWon(total+(total>=100000?0:3000))+'원</b></div>'+
        '<button class="btn btn-g btn-lg btn-full" onclick="checkout()">주문하기</button>'+
        '<p class="cs-n">10만원 이상 구매 시 배송비가 무료입니다.</p>'+
      '</aside></div>'
      :
      '<div class="empty"><div class="empty-t">장바구니가 비어 있습니다</div>'+
      '<div class="empty-d">필요하신 부산물을 담아 보세요.</div>'+
      '<a class="btn btn-g btn-lg" href="#/products">전체상품 보기</a></div>')+
  '</div>';
}

/* ── 11. 로그인 / 회원가입 ──────────────────────────────
   ⚠️ 비밀번호칸은 반드시 <form> 안에 둡니다. 폼이 없으면 크롬이
   문서 전체를 로그인 폼으로 보고 화면의 첫 글자칸(= 헤더 검색창)에
   저장된 아이디를 밀어 넣습니다. */
function PageLogin(){
  return '<div class="w auth"><h1 class="pg-h1">로그인</h1>'+
    '<form class="form" id="l-form" onsubmit="return doLogin(event)">'+
      '<div class="f-r"><label for="l-id">아이디 (이메일)</label>'+
        '<input id="l-id" type="email" autocomplete="username" required></div>'+
      '<div class="f-r"><label for="l-pw">비밀번호</label>'+
        '<input id="l-pw" type="password" autocomplete="current-password" required></div>'+
      '<button class="btn btn-g btn-lg btn-full" type="submit">로그인</button>'+
    '</form>'+
    '<p class="auth-n">아직 회원이 아니신가요? <a href="#/signup">회원가입</a></p></div>';
}
function PageSignup(){
  var biz = /biz=1/.test(location.hash);
  return '<div class="w auth"><h1 class="pg-h1">'+(biz?"사업자 회원가입":"회원가입")+'</h1>'+
    '<form class="form" id="s-form" onsubmit="return doSignup(event)">'+
      '<div class="f-r"><label for="s-id">아이디 (이메일) <b>*</b></label>'+
        '<input id="s-id" type="email" autocomplete="username" required></div>'+
      '<div class="f-r"><label for="s-pw">비밀번호 <b>*</b></label>'+
        '<input id="s-pw" type="password" autocomplete="new-password" required minlength="8"></div>'+
      '<div class="f-r"><label for="s-nm">이름 <b>*</b></label>'+
        '<input id="s-nm" type="text" autocomplete="name" required></div>'+
      '<div class="f-r"><label for="s-tel">연락처 <b>*</b></label>'+
        '<input id="s-tel" type="tel" autocomplete="tel" required placeholder="010-0000-0000"></div>'+
      (biz ? '<div class="f-r"><label for="s-brn">사업자등록번호 <b>*</b></label>'+
        '<input id="s-brn" type="text" required placeholder="000-00-00000"></div>'+
        '<div class="f-r"><label for="s-co">상호 <b>*</b></label>'+
        '<input id="s-co" type="text" required></div>' : '')+
      '<button class="btn btn-g btn-lg btn-full" type="submit">가입하기</button>'+
    '</form>'+
    (biz?'':'<p class="auth-n">사업장에서 쓰실 계정인가요? <a href="#/signup?biz=1">사업자 회원가입</a></p>')+
  '</div>';
}

/* ── 12. 마이페이지 ─────────────────────────────────────── */
var MY_TABS=[["order","주문내역"],["wish","찜한 상품"],["quote","견적 문의"],["info","회원정보"]];
function PageMy(){
  var t=(/t=(\w+)/.exec(location.hash)||[])[1]||"order";
  return '<div class="w my"><h1 class="pg-h1">마이페이지</h1>'+
    '<div class="tabs">'+MY_TABS.map(function(x){
      return '<a class="tab'+(t===x[0]?" on":"")+'" href="#/my?t='+x[0]+'">'+esc(x[1])+'</a>'; }).join("")+'</div>'+
    '<div class="tb">'+myBody(t)+'</div></div>';
}
function myBody(t){
  if(t==="wish"){
    var w = WISH.map(wowProduct).filter(Boolean);
    return w.length ? ProductGrid(w)
      : emptyBox("찜한 상품이 없습니다","마음에 드는 부산물을 찜해 두시면 이곳에 모입니다.","#/products","전체상품 보기");
  }
  if(t==="quote") return emptyBox("문의하신 견적이 없습니다","업소용 대량견적을 문의하시면 진행 상황이 이곳에 표시됩니다.","#/b2b/quote","대량견적 문의");
  if(t==="info")  return emptyBox("로그인이 필요합니다","회원정보는 로그인 후 확인하실 수 있습니다.","#/login","로그인");
  return emptyBox("주문 내역이 없습니다","주문하시면 배송 상황을 이곳에서 확인하실 수 있습니다.","#/products","전체상품 보기");
}
function emptyBox(t,d,to,cta){
  return '<div class="empty"><div class="empty-t">'+esc(t)+'</div>'+
    '<div class="empty-d">'+esc(d)+'</div>'+
    '<a class="btn btn-g" href="'+esc(to)+'">'+esc(cta)+'</a></div>';
}

/* ── 브랜드 소개 ────────────────────────────────────────── */
function PageAbout(){
  return '<section class="hero">'+
    '<div class="hero-ph" style="background-image:url(img/brand.jpg)"></div>'+
    '<div class="w hero-in"><h1>모든 한 점까지,<br>가치 있게.</h1>'+
    '<p>축산 현장을 이해하는 부산물 전문업체.<br>버려지던 부위에 제 값을 찾아 드립니다.</p></div></section>'+
  '<section class="sec sec-w"><div class="w about-b">'+
    '<h2>도축에서 식탁까지, 한 흐름으로</h2>'+
    '<p>부산물은 원물 상태와 손질 정도에 따라 쓰임이 완전히 달라집니다. '+
    'ABOUTMEAT 은 도축장에서 나온 원물을 당일 작업해, 필요한 손질 상태와 규격으로 나눠 보냅니다. '+
    '정육점·국밥집·곱창전문점처럼 부위를 아는 분들이 그대로 쓰실 수 있도록 하는 것이 기준입니다.</p>'+
    '<h2>같은 부위라도 쓰임이 다릅니다</h2>'+
    /* ⚠️ 문장 한가운데 링크를 박으면 높이가 16px 이라 손가락으로 누르기
       어렵습니다. 문단 끝에 제대로 된 버튼으로 내놓습니다. */
    '<p>구이에 쓸 곱창과 전골에 쓸 곱창은 손질이 다릅니다. 그래서 상품마다 '+
    '원물 · 1차 세척 · 완전 손질을 나눠 두었고, 부위별 특징과 손질 방법을 '+
    '부산물 도감에 정리했습니다.</p>'+
    '<p style="margin-top:var(--s5);"><a class="btn btn-o" href="#/enc">'+
      '부산물 도감 보기'+icon("arrow",18)+'</a></p>'+
  '</div></section>'+TrustBar();
}

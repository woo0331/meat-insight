/* ════════════════════════════════════════════════════════════════════
   07. 부산물 도감 · 08. B2B · 10. 장바구니 · 11. 로그인/회원가입
   12. 마이페이지 · 브랜드 소개
   ════════════════════════════════════════════════════════════════════ */

/* ── 07. 부산물 도감 (지시서 18번) ──────────────────────── */
var EN = { sp:"beef", cat:"" };

function PageEnc(sp, slug){
  EN.sp = sp || EN.sp || "beef";
  if(slug) return encDetail(EN.sp, slug);

  return Breadcrumb([["홈","/"],["부산물 도감",""]])+
  '<section class="ench" style="background-image:url(/img/enc-hero.jpg)">'+
    '<div class="w"><div class="ench-in">'+
      '<h1>부산물 도감</h1><p>알면 더 맛있는 축산 부산물 이야기.</p>'+
    '</div></div></section>'+
  '<div class="w enc-wrap">'+
    '<div class="enc-tabs">'+WOW_SPECIES.map(function(s){
      return '<a class="enc-tab'+(EN.sp===s.slug?" on":"")+'" href="/enc/'+esc(s.slug)+'">'+
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
  if(!e) return Breadcrumb([["홈","/"],["부산물 도감","/enc"],["",""]])+
    '<div class="w"><div class="empty"><div class="empty-t">찾으시는 부위가 없습니다</div>'+
    '<a class="btn btn-g" href="/enc/'+esc(sp)+'">도감으로 돌아가기</a></div></div>';

  var rel = (e.rel||[]).map(wowProduct).filter(Boolean);
  /* ⚠️ 사진 칸은 **사진이 있을 때만** 냅니다. 빈 네모를 남겨 두면
     "사진을 못 불러왔다" 로 읽힙니다 — 자리표시자를 찍지 않는다는
     규칙이 여기에도 걸립니다. 어디 부위인지는 아래 그림이 말합니다. */
  return Breadcrumb([["홈","/"],["부산물 도감","/enc"],[wowSpeciesName(sp),"/enc/"+sp],[e.name,""]])+
  '<div class="w enc-d">'+
    '<div class="enc-d-top'+(e.img?"":" enc-d-solo")+'">'+
      (e.img ? '<div class="enc-d-img">'+imgTag(e.img, e.name)+'</div>' : '')+
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
  /* 관련상품은 **실제로 있는 것만** 내놓습니다. 다만 없다고 화면을
     그냥 끝내면 손님이 갈 곳이 없습니다 — 48개 부위 중 상당수가 아직
     상품이 없으므로, 없을 때는 **없다고 말하고 갈 곳을 줍니다.**
     "상품이 없습니다" 는 우리가 실제로 아는 사실이라 적어도 됩니다
     (모르는 것을 없다고 적지 않는다는 규칙과 어긋나지 않습니다). */
  (rel.length ? '<section class="sec sec-w"><div class="w">'+
    '<div class="sec-hd"><div class="sec-hd-t"><h2>'+esc(e.name)+' 상품</h2></div></div>'+
    ProductGrid(rel)+'</div></section>'
   : '<section class="sec sec-w"><div class="w"><div class="empty">'+
      '<div class="empty-t">'+esc(e.name)+esc(josa(e.name,"은는"))+' 아직 등록된 상품이 없습니다</div>'+
      '<div class="empty-d">필요한 수량과 규격을 알려 주시면 확인해 드립니다.</div>'+
      '<div class="empty-acts">'+
        /* ⚠️ 그 분류에 **상품이 실제로 있을 때만** 분류로 보냅니다.
           없으면 눌렀을 때 빈 목록이 나옵니다 — 손님에게는 고장입니다. */
        (function(){
          var hasCat = wowFind({sp:sp, cat:e.cat}).length;
          var to = hasCat ? "/c/"+sp+"/"+e.cat : "/c/"+sp;
          var nm = (hasCat && wowCatName(sp, e.cat)) || wowSpeciesName(sp);
          return '<a class="btn btn-g" href="'+esc(to)+'">'+esc(nm)+' 보기</a>';
        })()+
        '<a class="btn" href="/b2b/quote">대량견적 문의</a>'+
        CallButton("btn", "전화로 문의")+
      '</div></div></div></section>')+
  /* 같은 분류의 다른 부위 — 막다른 길을 만들지 않습니다.
     크롤러도 여기를 타고 다음 부위로 갑니다. */
  (function(){
    var sib = (WOW_ENC[sp]||[]).filter(function(x){
      return x.cat===e.cat && x.slug!==e.slug; }).slice(0,8);
    if(!sib.length) return "";
    return '<section class="sec sec-i"><div class="w">'+
      '<div class="sec-hd"><div class="sec-hd-t"><h2>'+
        esc(wowCatName(sp, e.cat) || "같은 분류")+'의 다른 부위</h2></div>'+
        '<a class="sec-more" href="/enc/'+esc(sp)+'">도감 전체보기'+icon("chev",16)+'</a></div>'+
      '<div class="qg">'+sib.map(function(x){ return EncyclopediaCard(x, sp); }).join("")+
    '</div></div></section>';
  })();
}

/* ── 08. B2B (지시서 19번) ──────────────────────────────── */
function PageB2B(){
  var biz = wowFind({use:["업소용"]}).slice(0,8);
  return '<section class="hero hero-b2b">'+
    '<div class="hero-ph" style="background-image:url(/img/b2b-hero.jpg)"></div>'+
    '<div class="w hero-in">'+
      '<h1>사업자를 위한<br>대량구매 솔루션</h1>'+
      '<p>식당 · 국밥집 · 곱창전문점 · 식자재업체 · 가공업체를 위한<br>전문 부산물 공급</p>'+
      '<div class="hero-btns">'+
        '<a class="btn btn-g btn-lg" href="/signup?biz=1">사업자 회원가입'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/b2b/quote">대량견적 문의'+icon("arrow",18)+'</a>'+
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
      '<a class="sec-more" href="/products">전체보기'+icon("chev",16)+'</a></div>'+
    ProductGrid(biz)+'</div></section>' : '')+
  '<section class="sec sec-i"><div class="w">'+B2BBanner({
      img:"b2b-hero", title:"필요한 규격이 따로 있으신가요?",
      desc:"수량 · 손질 상태 · 납품 주기를 알려 주시면 담당자가 맞춤 견적을 드립니다.",
      cta:"대량견적 문의하기", to:"/b2b/quote" })+'</div></section>';
}

/* 대량견적 문의 폼 — 접수처가 아직 없으면 **손님에게는 "아직 이곳에서
   받지 못합니다" 까지만** 말하고, 무엇을 설정해야 하는지는 콘솔로.

   ⚠️ 그 말을 **폼 아래가 아니라 위에** 둡니다. 예전에는 다 적고 누른
   뒤에야 "여기서는 접수가 안 된다" 고 알렸습니다 — 바쁜 사장님의
   시간을 버리게 하는 짓입니다.

   ⚠️ 이 폼은 **개인정보를 받습니다** (업체명·담당자·연락처·이메일).
   개인정보보호법 제15조·제22조상 수집·이용 동의를 받아야 하고,
   무엇을 · 왜 · 얼마나 보관하는지를 **동의를 받는 자리에서** 알려야
   합니다. 항목을 바꾸면 legal-privacy.js 제2조·제3조도 같이 고치세요. */
function PageQuote(){
  var to    = bizVal("quoteTo");
  var phone = bizVal("phone");
  var email = bizVal("email");
  if(!to){
    try{ console.warn("[ABOUTMEAT] 견적 문의 접수처가 아직 없습니다 — "+
      "js/data/site.js 의 WOW_BIZ.quoteTo(이메일 또는 API)를 설정하세요. "+
      "그때까지 손님에게는 폼 위에 \"이 양식으로는 접수하지 못한다\" 고 먼저 알립니다."); }catch(e){}
  }

  return Breadcrumb([["홈","/"],["업소용","/b2b"],["대량견적 문의",""]])+
  '<div class="w form-wrap"><h1 class="pg-h1">대량견적 문의</h1>'+
    '<p class="pg-lead">필요하신 품목과 수량을 남겨 주시면 담당자가 확인 후 연락드립니다.</p>'+
    (to ? '' :
      '<div class="notice"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
        ((phone||email) ? '<span>아래 연락처로 문의해 주시면 바로 확인해 드립니다.</span>' : '')+
        ((phone||email) ? '<div class="notice-acts">'+
          CallButton("btn", "전화로 문의")+
          (email ? '<a class="btn" href="mailto:'+esc(email)+'">'+esc(email)+'</a>' : '')+
        '</div>' : '')+
      '</div>')+
    '<form class="form" onsubmit="return submitQuote(event)">'+
      fRow("업체명","q-co","text",true,"예: 대성국밥")+
      fRow("담당자","q-nm","text",true,"")+
      fRow("연락처","q-tel","tel",true,"010-0000-0000")+
      fRow("이메일","q-em","email",false,"")+
      '<div class="f-r"><label for="q-it">필요 품목 <b>*</b></label>'+
        '<textarea id="q-it" rows="4" required placeholder="예: 한우 곱창 완전손질 20kg / 주 2회"></textarea></div>'+
      /* 개인정보 수집·이용 동의 — 무엇을·왜·얼마나를 같이 적습니다 */
      '<fieldset class="agree"><legend>개인정보 수집·이용 동의</legend>'+
        '<ul class="ag-why">'+
          '<li><span>수집 항목</span><b>업체명, 담당자명, 연락처 (선택: 이메일), 필요 품목 및 수량</b></li>'+
          '<li><span>이용 목적</span><b>견적 산출 및 상담 회신</b></li>'+
          '<li><span>보유 기간</span><b>문의 처리 완료 후 1년</b></li>'+
        '</ul>'+
        '<label class="ag-r"><input type="checkbox" id="q-ag" required>'+
          '<span>위 내용에 동의합니다 <em class="ag-req">(필수)</em></span>'+
          '<a class="ag-v" href="/privacy">방침 보기</a></label>'+
        '<p class="ag-no">동의를 거부하실 수 있으며, 이 경우 이 양식으로는 문의를 접수하지 못합니다'+
          (phone ? ' — 전화로는 그대로 문의하실 수 있습니다.' : '.')+'</p>'+
      '</fieldset>'+
      '<button class="btn btn-g btn-lg btn-full" type="submit">문의 보내기</button>'+
    '</form></div>';
}
function fRow(label,id,type,req,ph){
  return '<div class="f-r"><label for="'+id+'">'+esc(label)+(req?' <b>*</b>':'')+'</label>'+
    '<input id="'+id+'" type="'+type+'"'+(req?" required":"")+
    (ph?' placeholder="'+esc(ph)+'"':'')+' autocomplete="off"></div>';
}
var QS_SENDING = false;
window.submitQuote = function(ev){
  ev.preventDefault();
  if(QS_SENDING) return false;

  /* ⚠️ 동의 확인을 지우지 마세요 — 동의 없이 받은 개인정보는
     개인정보보호법 제15조 위반입니다. 서버(api/quote.js)에서도 한 번
     더 막습니다. 화면만 믿으면 그 주소로 직접 보내는 것을 못 막습니다. */
  var ag = $("q-ag");
  if(ag && !ag.checked){
    toast("개인정보 수집·이용에 동의해 주세요.");
    try{ ag.closest(".ag-r").classList.add("ag-miss"); ag.focus({preventScroll:true}); }catch(e){}
    return false;
  }

  var body = { co:qv("q-co"), name:qv("q-nm"), tel:qv("q-tel"),
               email:qv("q-em"), items:qv("q-it"), agree:true };
  var btn = els("#view button[type=submit]")[0];
  QS_SENDING = true;
  if(btn){ btn.disabled = true; btn.textContent = "보내는 중…"; }

  fetch("/api/quote", { method:"POST", headers:{ "content-type":"application/json" },
                        body: JSON.stringify(body) })
    .then(function(r){ return r.json().catch(function(){ return {}; })
      .then(function(j){ if(!r.ok) throw new Error((j && j.error) || ("HTTP "+r.status)); return j; }); })
    .then(function(){
      QS_SENDING = false;
      $("view").innerHTML = Breadcrumb([["홈","/"],["업소용","/b2b"],["대량견적 문의",""]])+
        '<div class="w form-wrap"><div class="empty">'+
        '<div class="empty-t">문의가 접수되었습니다</div>'+
        '<div class="empty-d">담당자가 확인한 뒤 '+esc(body.tel)+' 으로 연락드리겠습니다.</div>'+
        '<div class="empty-acts"><a class="btn btn-g" href="/products">전체상품 보기</a>'+
          CallButton("btn","전화로 문의")+'</div></div></div>';
      window.scrollTo(0,0);
    })
    .catch(function(err){
      QS_SENDING = false;
      if(btn){ btn.disabled=false; btn.textContent = "문의 보내기"; }
      /* ⚠️ 손님에게 운영자 할 일을 말하지 않습니다 — 콘솔로 갑니다. */
      try{ console.warn("[ABOUTMEAT] 견적 문의를 접수하지 못했습니다 — "+((err && err.message)||err)+
        ". api/quote.js 가 올라가 있는지, Vercel 환경변수(QUOTE_WEBHOOK_URL / ORDER_WEBHOOK_URL "+
        "또는 RESEND_API_KEY·QUOTE_EMAIL_TO)가 설정되어 있는지 확인하세요."); }catch(e){}
      toast(bizVal("phone") ? "지금 문의를 접수하지 못했습니다. 전화로 문의해 주세요."
                            : "지금 문의를 접수하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
    });
  return false;
};
function qv(id){ var e=$(id); return e ? String(e.value||"").trim() : ""; }

/* ── 10. 장바구니 ───────────────────────────────────────── */
function PageCart(){
  var rows = CART.map(function(c){
    var p=wowProduct(c.id); return p?{p:p,kg:c.kg}:null;
  }).filter(Boolean);
  var goods = rows.reduce(function(a,r){ return a + r.p.price*r.kg; }, 0);

  /* ⚠️ 배송비를 화면에 박아 두지 마세요. 관리자에서 바꿀 수 있는 값인데
     여기에 100000·3000 이 박혀 있으면, 기준을 바꿔도 장바구니만 옛날
     숫자를 말합니다. WOW_BIZ 에서 읽습니다. */
  var freeOver = Number(WOW_BIZ.shipFreeOver) || 0;
  var fee      = Number(WOW_BIZ.shipFee) || 0;
  var ship = (freeOver && goods >= freeOver) ? 0 : fee;

  return Breadcrumb([["홈","/"],["장바구니",""]])+
  '<div class="w cart-wrap"><h1 class="pg-h1">장바구니</h1>'+
    (rows.length ?
      '<div class="cart-cols"><div class="cart-l">'+
        rows.map(function(r,i){
          return '<div class="cr">'+
            '<a class="cr-i" href="/p/'+esc(r.p.id)+'">'+imgTag(r.p.img,r.p.name)+'</a>'+
            '<div class="cr-b"><a class="cr-n" href="/p/'+esc(r.p.id)+'">'+esc(r.p.name)+'</a>'+
              '<div class="cr-m">'+esc([r.p.origin,WOW_TEMP[r.p.temp],WOW_TRIM[r.p.trim]].filter(Boolean).join(" · "))+'</div>'+
              '<div class="cr-q">'+
                '<div class="cr-qty">'+
                  '<button onclick="bumpCart('+i+',-1)" aria-label="'+esc(r.p.name)+' 수량 줄이기">'+icon("minus",16)+'</button>'+
                  '<input type="number" min="1" max="9999" step="1" value="'+r.kg+'" '+
                    'aria-label="'+esc(r.p.name)+' 수량(kg)" onchange="setCartKg('+i+',this.value)">'+
                  '<span class="cr-u">kg</span>'+
                  '<button onclick="bumpCart('+i+',1)" aria-label="'+esc(r.p.name)+' 수량 늘리기">'+icon("plus",16)+'</button>'+
                '</div>'+
                '<span class="cr-unit">× '+wowWon(r.p.price)+'원/kg</span>'+
              '</div></div>'+
            '<div class="cr-r"><b>'+wowWon(r.p.price*r.kg)+'원</b>'+
              '<button class="cr-x" onclick="delCart('+i+')" aria-label="빼기">'+icon("x",18)+'</button></div>'+
          '</div>'; }).join("")+
        ShipNote("ship-cart")+
      '</div>'+
      '<aside class="cart-s"><h3>결제 예정 금액</h3>'+
        '<div class="cs-r"><span>상품금액</span><b>'+wowWon(goods)+'원</b></div>'+
        '<div class="cs-r"><span>배송비</span><b>'+(ship?wowWon(ship)+'원':'무료')+'</b></div>'+
        '<div class="cs-t"><span>합계</span><b>'+wowWon(goods+ship)+'원</b></div>'+
        /* ⚠️ 받을 수 있는 결제수단이 없으면 "주문하기" 를 내놓지 않습니다.
           눌러서 주문서까지 갔다가 "못 받는다" 는 말을 듣게 하지 마세요 —
           주문서도 같은 판단을 하지만, 장바구니에서 미리 말해 주는 편이
           손님의 걸음을 아낍니다. */
        ((typeof wowPayReady==="function" && wowPayReady().length)
          ? '<button class="btn btn-g btn-lg btn-full" onclick="checkout()">주문하기</button>'
          : '<p class="cs-n cart-closed">지금은 이곳에서 주문을 받지 못합니다.'+
            (bizVal("phone") ? ' 전화로 주문해 주세요.' : '')+'</p>')+
        CallButton("btn btn-o btn-full cart-call", "전화로 주문하기")+
        /* 얼마를 더 담으면 무료가 되는지 — 우리가 **실제로 아는 숫자**라
           적어도 됩니다. 사장님은 3,000원 아끼려고 한 팩을 더 담습니다. */
        (freeOver ? '<p class="cs-n">'+(
          goods>0 && goods<freeOver
            ? wowWon(freeOver-goods)+'원만 더 담으면 배송비가 무료입니다.'
            : wowWon(freeOver)+'원 이상 구매 시 배송비가 무료입니다.')+'</p>' : '')+
      '</aside></div>'
      :
      '<div class="empty"><div class="empty-t">장바구니가 비어 있습니다</div>'+
      '<div class="empty-d">필요하신 부산물을 담아 보세요.</div>'+
      '<a class="btn btn-g btn-lg" href="/products">전체상품 보기</a></div>')+
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
    '<p class="auth-n">아직 회원이 아니신가요? <a href="/signup">회원가입</a></p></div>';
}
function PageSignup(){
  /* ⚠️ 해시가 아니라 **?biz=1** 입니다. 해시를 읽던 탓에 B2B 화면의
     "사업자 회원가입" 버튼이 그냥 회원가입으로 갔습니다. */
  var biz = nowQS("biz")==="1";
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
      /* ⚠️ 동의 없이 가입을 받으면 안 됩니다. 이용약관은 약관규제법상
         명시·설명 의무가 있고, 개인정보 수집·이용은 개인정보보호법
         제22조에 따라 **동의를 받아야** 합니다. 무엇에 동의하는지
         읽을 수 있어야 하므로 문서로 가는 길을 같이 둡니다.
         필수와 선택은 반드시 나눠 받습니다 — 광고 수신까지 묶어
         필수로 받으면 그 동의는 무효입니다. */
      '<fieldset class="agree"><legend>약관 동의</legend>'+
        '<label class="ag-r ag-all"><input type="checkbox" id="ag-all" onchange="agAll(this)">'+
          '<span><b>전체 동의</b></span></label>'+
        agRow("ag-t", "이용약관 동의", "/terms", true)+
        agRow("ag-p", "개인정보 수집·이용 동의", "/privacy", true)+
        agRow("ag-m", "광고성 정보 수신 동의", null, false)+
      '</fieldset>'+
      '<button class="btn btn-g btn-lg btn-full" type="submit">가입하기</button>'+
    '</form>'+
    (biz?'':'<p class="auth-n">사업장에서 쓰실 계정인가요? <a href="/signup?biz=1">사업자 회원가입</a></p>')+
  '</div>';
}

/* 동의 한 줄. 필수/선택을 글자로 적습니다 — 별표만으로는 손님이
   무엇을 빼도 되는지 구분하지 못합니다. */
function agRow(id, label, to, req){
  return '<label class="ag-r"><input type="checkbox" id="'+id+'"'+(req?' data-req="1"':'')+
      ' onchange="agSync()">'+
    '<span>'+esc(label)+' <em class="'+(req?"ag-req":"ag-opt")+'">('+(req?"필수":"선택")+')</em></span>'+
    (to ? '<a class="ag-v" href="'+esc(to)+'">보기</a>' : '')+
  '</label>';
}
window.agAll = function(el){
  els(".agree .ag-r:not(.ag-all) input").forEach(function(c){ c.checked = el.checked; });
};
window.agSync = function(){
  var all = els(".agree .ag-r:not(.ag-all) input"), a = $("ag-all");
  if(a) a.checked = all.length>0 && all.every(function(c){ return c.checked; });
};

/* ── 12. 마이페이지 ─────────────────────────────────────── */
var MY_TABS=[["order","주문내역"],["wish","찜한 상품"],["quote","견적 문의"],["info","회원정보"]];
function PageMy(){
  /* ⚠️ 해시가 아니라 **?t=wish** 입니다. 해시를 읽던 탓에 모바일 아래
     네비의 "찜" 을 눌러도 주문내역이 나왔습니다 — 로그인 없이 볼 수
     있는 유일한 칸이 바로 찜인데 그리로 못 갔습니다. */
  var t = nowQS("t") || "order";
  if(!MY_TABS.some(function(x){ return x[0]===t; })) t = "order";
  return '<div class="w my"><h1 class="pg-h1">마이페이지</h1>'+
    '<div class="tabs">'+MY_TABS.map(function(x){
      return '<a class="tab'+(t===x[0]?" on":"")+'" href="/my?t='+x[0]+'">'+esc(x[1])+'</a>'; }).join("")+'</div>'+
    '<div class="tb">'+myBody(t)+'</div></div>';
}
/* ⚠️ **로그인하지 않은 손님에게 "주문 내역이 없습니다" 라고 하면
   안 됩니다.** 우리는 그 사람이 누구인지 모르므로 주문이 있는지
   없는지도 모릅니다. 모르는 것을 "없다" 고 적는 것은 지어내는 것과
   같습니다 (절대 규칙 1번). 찜한 상품만 예외입니다 — 로그인과
   무관하게 이 브라우저에 저장되므로 실제로 알 수 있습니다. */
function myBody(t){
  if(t==="wish"){
    var w = WISH.map(wowProduct).filter(Boolean);
    return w.length ? ProductGrid(w)
      : emptyBox("찜한 상품이 없습니다","마음에 드는 부산물을 찜해 두시면 이곳에 모입니다.","/products","전체상품 보기");
  }
  /* 주문도 찜과 같습니다 — **이 브라우저에서 넣은 것**은 실제로 압니다.
     무통장입금은 계좌와 금액을 나중에 다시 봐야 해서 값어치가 큽니다.
     ⚠️ 다만 이것은 "주문 내역" 이 아닙니다. 다른 기기에서 넣은 주문은
     여기 없으므로 **"이 브라우저에서"** 라고 반드시 적습니다. */
  if(t==="order"){
    var mine = (typeof wowOrders==="function") ? wowOrders() : [];
    if(mine.length) return myOrders(mine);
  }
  if(!isLoggedIn()){
    var what = t==="quote" ? "문의하신 견적" : (t==="info" ? "회원정보" : "주문 내역");
    return emptyBox("로그인이 필요합니다", what+josa(what,"은는")+" 로그인 후 확인하실 수 있습니다.","/login","로그인");
  }
  if(t==="quote") return emptyBox("문의하신 견적이 없습니다","업소용 대량견적을 문의하시면 진행 상황이 이곳에 표시됩니다.","/b2b/quote","대량견적 문의");
  if(t==="info")  return emptyBox("회원정보를 불러올 수 없습니다","잠시 후 다시 시도해 주세요.","/","홈으로");
  return emptyBox("주문 내역이 없습니다","주문하시면 배송 상황을 이곳에서 확인하실 수 있습니다.","/products","전체상품 보기");
}
function myOrders(list){
  /* 최근 것이 위로. 넣은 순서를 믿지 않고 날짜로 세웁니다 */
  list = list.slice().sort(function(a,b){ return String(b.at||"").localeCompare(String(a.at||"")); });
  return '<p class="my-note">이 브라우저에서 넣으신 주문입니다. '+
      '다른 기기에서 넣으신 주문은 로그인 뒤에 보실 수 있습니다.</p>'+
    '<div class="my-ords">'+list.map(function(o){
      return '<div class="my-ord">'+
        '<div class="my-ord-h"><b>'+esc(o.no)+'</b>'+
          '<span>'+esc(wowOrderDate(o.at))+'</span></div>'+
        '<div class="my-ord-i">'+(o.items||[]).map(function(x){
          return esc(x.name)+' '+esc(String(x.kg))+'kg'; }).join(" · ")+'</div>'+
        '<div class="my-ord-f"><span>'+esc(o.pay==="bank"?"무통장입금":"카드결제")+'</span>'+
          '<b>'+wowWon(o.total)+'원</b></div>'+
        '<a class="btn btn-sm" href="/order/done?no='+encodeURIComponent(o.no)+'">자세히 보기</a>'+
      '</div>'; }).join("")+'</div>';
}

function emptyBox(t,d,to,cta){
  return '<div class="empty"><div class="empty-t">'+esc(t)+'</div>'+
    '<div class="empty-d">'+esc(d)+'</div>'+
    '<a class="btn btn-g" href="'+esc(to)+'">'+esc(cta)+'</a></div>';
}

/* ── 브랜드 소개 ────────────────────────────────────────── */
function PageAbout(){
  return '<section class="hero">'+
    '<div class="hero-ph" style="background-image:url(/img/brand.jpg)"></div>'+
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
    '<p style="margin-top:var(--s5);"><a class="btn btn-o" href="/enc">'+
      '부산물 도감 보기'+icon("arrow",18)+'</a></p>'+
  '</div></section>'+TrustBar();
}

/* ════════════════════════════════════════════════════════════════════
   Header · SearchBar · GNB · Footer · MobileNavigation
   화면이 바뀌어도 한 번만 그리고, 현재 위치 표시만 갱신합니다.
   ════════════════════════════════════════════════════════════════════ */

function Header(){
  return '<header class="hd">'+
    '<div class="w hd-top">'+
      '<a class="hd-logo" href="/" aria-label="ABOUTMEAT 홈">'+
        '<b>ABOUTMEAT</b><span>축산 부산물 전문마켓</span></a>'+
      SearchBar()+
      '<div class="hd-acts">'+
        '<div class="hd-links">'+
          '<a href="/login">로그인</a>'+
          '<a href="/signup">회원가입</a>'+
          '<a href="/my">마이페이지</a>'+
        '</div>'+
        '<button class="hd-ic" onclick="go(\'/my\')" aria-label="마이페이지">'+icon("user")+'</button>'+
        '<button class="hd-ic" onclick="go(\'/cart\')" aria-label="장바구니">'+icon("cart")+
          '<span class="cnt" id="cart-n" hidden>0</span></button>'+
      '</div>'+
    '</div>'+
    '<nav class="gnb" aria-label="주요 메뉴"><div class="w gnb-in" id="gnb"></div></nav>'+
  '</header>';
}

/* 검색칸은 <form> 안에 둡니다. 폼이 없으면 크롬이 문서 전체를 로그인
   폼으로 보고 **화면에 보이는 첫 글자칸에 저장된 아이디를 넣습니다.**
   검색창에 남의 아이디가 저절로 박히는 사고가 그렇게 납니다. */
function SearchBar(id){
  id = id || "q-hd";
  return '<form class="hd-search" role="search" onsubmit="return doSearch(\''+id+'\')">'+
    '<input id="'+id+'" type="search" name="q" autocomplete="off" '+
      'aria-label="상품 검색" placeholder="찾으시는 부산물을 검색해 보세요">'+
    '<button type="submit" aria-label="검색">'+icon("search",20)+'</button></form>';
}

/* ⚠️ **location.hash 를 읽지 마세요.** 주소를 진짜 경로로 바꾼 뒤에도
   해시를 읽던 곳이 네 군데 남아 있었습니다. 해시는 늘 빈 문자열이라
   조용히 틀린 답("/")을 돌려줍니다 — 에러가 안 나서 안 드러납니다.
   실제로 헤더 메뉴가 어느 화면에서도 안 켜졌고, 모바일 아래 네비는
   늘 "홈" 이 켜져 있었고, "찜" 을 눌러도 주문내역이 나왔습니다. */
window.nowPath = function(){
  return location.pathname.replace(/\/index\.html$/,"/").replace(/(.)\/+$/,"$1") || "/";
};
/* 주소의 ?a=b 에서 값 하나 — parseQS 는 app.js 에 있고 app.js 가 늦게
   실행되므로, 화면을 그리는 쪽에서는 이걸 씁니다. */
window.nowQS = function(k){
  var m = new RegExp("[?&]"+k+"=([^&#]*)").exec(location.search);
  return m ? decodeURIComponent(m[1]) : "";
};

function paintGnb(){
  var g=$("gnb"); if(!g) return;
  var here=nowPath();
  /* ⚠️ **누르면 빈 목록이 나오는 칸을 메뉴에 두지 않습니다.**
     "특가" 는 특가 상품이 하나도 없을 때도 빨갛게 떠 있었습니다.
     제일 눈에 띄는 자리에 있는 링크가 빈 화면으로 가면 손님은 사이트가
     고장 난 것으로 읽습니다. 분류 칩·필터에는 이미 있던 규칙인데
     헤더 메뉴만 빠져 있었습니다. */
  g.innerHTML = WOW_GNB.filter(gnbAlive).map(function(m){
    var on = here===m.to || (m.to!=="/products" && here.indexOf(m.to)===0);
    return '<a href="'+esc(m.to)+'" class="'+(m.hot?"hot ":"")+(on?"on":"")+'">'+esc(m.name)+'</a>';
  }).join("");
}

/* /products/<kind> 는 해당 상품이 있을 때만 — 나머지는 늘 내용이 있습니다.
   ⚠️ build-pages.js 도 같은 셈을 합니다 (없으면 HTML 을 안 만듭니다).
   둘이 어긋나면 메뉴에는 있는데 검색엔진용 파일은 없는 주소가 생깁니다. */
function gnbAlive(m){
  var k = /^\/products\/(.+)$/.exec(m.to || "");
  if(!k) return true;
  return wowFind(listQuery(k[1])).length > 0;
}

function Footer(){
  return '<footer class="ft"><div class="w">'+
    '<div class="ft-g">'+
      '<div><b class="ft-lg">ABOUTMEAT</b>'+
        '<p style="margin:0;line-height:1.8;">소·돼지 부산물 전문 온라인몰<br>'+
        '도축장에서 시작되는 신선한 원물을<br>필요한 상태와 규격으로 공급합니다.</p></div>'+
      '<div class="ft-col"><h4>상품</h4>'+
        '<a href="/c/beef">소 부산물</a><a href="/c/pork">돼지 부산물</a>'+
        /* 헤더와 같은 셈 — 상품이 없으면 그 줄을 뺍니다 */
        [{name:"손질상품",to:"/products/trim"},{name:"오늘입고",to:"/products/today"}]
          .filter(gnbAlive).map(function(m){
            return '<a href="'+esc(m.to)+'">'+esc(m.name)+'</a>'; }).join("")+'</div>'+
      '<div class="ft-col"><h4>알아보기</h4>'+
        '<a href="/enc">부산물 도감</a><a href="/b2b">업소용·대량구매</a>'+
        '<a href="/about">브랜드 스토리</a></div>'+
      '<div class="ft-col"><h4>고객지원</h4>'+
        '<a href="/my">주문 조회</a><a href="/b2b">대량견적 문의</a>'+
        '<a href="/terms">이용약관</a><a href="/privacy">개인정보처리방침</a></div>'+
    '</div>'+
    '<div class="ft-biz" id="ft-biz"></div>'+
  '</div></footer>';
}

/* 사업자 정보 — **값이 없는 항목은 자리표시자를 찍지 않고 그 줄을 뺍니다.**
   "(미기재)" 가 보이면 그 순간 미완성 사이트로 읽힙니다.
   무엇이 비었는지는 운영자만 보도록 콘솔에 남깁니다. */
function paintBiz(){
  var host=$("ft-biz"); if(!host) return;
  var B = window.WOW_BIZ || {};
  var rows=[["상호",B.company],["대표",B.ceo],["사업자등록번호",B.brn],
            ["통신판매업 신고",B.mailOrder],["주소",B.address],
            ["고객센터",B.phone],["이메일",B.email]];
  var have=rows.filter(function(r){ return r[1] && String(r[1]).trim(); });
  var miss=rows.filter(function(r){ return !(r[1] && String(r[1]).trim()); }).map(function(r){return r[0];});
  if(miss.length){
    try{ console.warn("[ABOUTMEAT] 푸터 사업자 정보가 비어 있습니다 — js/data/site.js 의 WOW_BIZ 를 채우세요: "+
      miss.join(", ")+" (전자상거래법 제10조 표시 의무는 사이트 전체에 걸립니다)"); }catch(e){}
  }
  host.innerHTML = have.map(function(r){
    return '<span>'+esc(r[0])+' '+esc(r[1])+'</span>';
  }).join("") + '<div style="margin-top:8px;">© ABOUTMEAT. All rights reserved.</div>';
}

function MobileNav(){
  var m=[["/","홈","home"],["/products","카테고리","grid"],["/search","검색","search"],
         ["/my?t=wish","찜","heart"],["/my","마이","user"]];
  return '<nav class="mnav" aria-label="모바일 메뉴"><div class="mnav-in">'+
    m.map(function(x){
      return '<a href="'+x[0]+'" data-m="'+esc(x[0])+'">'+icon(x[2],21)+'<span>'+esc(x[1])+'</span></a>';
    }).join("")+'</div></nav>';
}
function paintMnav(){
  /* 아래 네비 다섯 칸 중 **지금 화면이 어느 칸에 속하는지**를 정합니다.
     상품·분류·도감은 전부 "카테고리" 칸으로 묶습니다 — 손님이 곱창
     상세를 보는 중에 아무 칸도 안 켜져 있으면 길을 잃습니다. */
  var p = nowPath(), cur = "";
  if(p==="/") cur="/";
  else if(p==="/search") cur="/search";
  else if(p==="/my") cur = (nowQS("t")==="wish") ? "/my?t=wish" : "/my";
  else if(/^\/(products|c|p|enc)(\/|$)/.test(p)) cur="/products";
  els(".mnav a").forEach(function(a){
    a.classList.toggle("on", a.getAttribute("data-m")===cur);
  });
}

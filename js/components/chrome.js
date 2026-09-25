/* ════════════════════════════════════════════════════════════════════
   헤더 · 푸터 · 모바일 아래 네비 — 지시서 29번

   ⚠️ **헤더를 늘리지 마세요.** 지시서가 정한 다섯 + 우측 셋이 전부입니다.
   메뉴가 늘어나는 순간 손님은 "무엇을 하는 곳인지" 대신 "어디를 눌러야
   하는지" 를 고민하게 됩니다 (지시서 42번: 한 화면에 너무 많은 선택지를
   주지 않는다).

   ⚠️ 구인구직·시세는 **메인 내비게이션에서 뺍니다** (지시서 26·27번).
   지우는 것이 아니라 우선순위를 내리는 것입니다.
   ════════════════════════════════════════════════════════════════════ */

window.WOW_GNB = [
  { name:"창업",         to:"/start" },
  { name:"사업진단",     to:"/check" },
  { name:"업체찾기",     to:"/partners" },
  { name:"견적요청",     to:"/request" },
  { name:"사장님 연구소", to:"/lab" }
];

/* 모바일 아래 네비 — 가운데 SOS 를 크게 (지시서 29번) */
var MNAV = [
  { to:"/",        name:"홈",   icon:"home" },
  { to:"/request", name:"견적", icon:"doc"  },
  { to:"/sos",     name:"SOS",  icon:"alert", big:true },
  { to:"/partners",name:"업체", icon:"search" },
  { to:"/my",      name:"MY",   icon:"user" }
];

function Header(){
  return '<header class="hd">'+
    '<div class="w hd-in">'+
      '<a class="lg" href="/" aria-label="ABOUTMEAT 홈">'+
        '<b>ABOUTMEAT</b><span>고기 사업자 문제해결</span></a>'+
      '<nav class="gnb" id="gnb" aria-label="주요 메뉴"></nav>'+
      '<div class="hd-r">'+
        '<a class="hd-txt" href="/login">로그인</a>'+
        '<a class="hd-txt" href="/partner/apply">파트너 등록</a>'+
        /* Primary CTA — 지시서 29번. 이 버튼 하나가 헤더에서 제일
           눈에 띄어야 합니다. */
        '<a class="btn btn-b hd-cta" href="/sos">무료 상담</a>'+
      '</div>'+
      '<a class="hd-m" href="/sos" aria-label="무료 상담">'+icon("chat",20)+'</a>'+
    '</div>'+
  '</header>';
}

function paintGnb(){
  var g = $("gnb"); if(!g) return;
  var here = nowPath();
  g.innerHTML = WOW_GNB.map(function(m){
    var on = here === m.to || (m.to !== "/" && here.indexOf(m.to) === 0);
    return '<a href="'+esc(m.to)+'"'+(on?' class="on" aria-current="page"':'')+'>'+
      esc(m.name)+'</a>';
  }).join("");
}

function MobileNav(){
  return '<nav class="mnav" aria-label="모바일 메뉴"><div class="mnav-in">'+
    MNAV.map(function(m){
      return '<a href="'+esc(m.to)+'" data-m="'+esc(m.to)+'"'+(m.big?' class="big"':'')+'>'+
        icon(m.icon, m.big?24:21)+'<span>'+esc(m.name)+'</span></a>';
    }).join("")+'</div></nav>';
}

function paintMnav(){
  /* 지금 화면이 다섯 칸 중 어디에 속하는지. 상세 화면에서 아무 칸도
     안 켜져 있으면 손님이 길을 잃습니다. */
  var p = nowPath(), cur = "";
  if(p === "/") cur = "/";
  else if(/^\/sos/.test(p))      cur = "/sos";
  else if(/^\/request|^\/quotes/.test(p)) cur = "/request";
  else if(/^\/partners?/.test(p)) cur = "/partners";
  else if(/^\/my/.test(p))        cur = "/my";
  els(".mnav a").forEach(function(a){
    a.classList.toggle("on", a.getAttribute("data-m") === cur);
  });
}

/* ── 푸터 ──────────────────────────────────────────────────
   ⚠️ 사업자 정보는 **값이 있는 줄만** 보여 줍니다. "(미기재)" 를 찍으면
   그 순간 미완성 사이트로 읽힙니다. 무엇이 비었는지는 console.warn 으로
   — 운영자만 봅니다. */
function Footer(){
  return '<footer class="ft"><div class="w">'+
    '<div class="ft-g">'+
      '<div class="ft-b">'+
        '<b class="ft-lg">ABOUTMEAT</b>'+
        '<p>고기 장사에 필요한 건<br>우리가 알아보고, 비교하고, 연결해드립니다.</p>'+
        '<a class="btn btn-o" href="/sos">무료로 물어보기'+icon("arrow",18)+'</a>'+
      '</div>'+
      '<div class="ft-col"><h4>시작하기</h4>'+
        '<a href="/sos">사장님 SOS</a><a href="/check">무료 사업진단</a>'+
        '<a href="/start">창업 준비</a><a href="/request">견적 요청</a></div>'+
      '<div class="ft-col"><h4>알아보기</h4>'+
        '<a href="/partners">업체 찾기</a><a href="/lab">사장님 연구소</a>'+
        '<a href="/about">ABOUTMEAT 소개</a></div>'+
      '<div class="ft-col"><h4>파트너</h4>'+
        '<a href="/partner/apply">파트너 등록</a><a href="/partner">파트너 안내</a></div>'+
      '<div class="ft-col"><h4>고객지원</h4>'+
        '<a href="/my">내 요청 보기</a>'+
        '<a href="/terms">이용약관</a><a href="/privacy">개인정보처리방침</a></div>'+
    '</div>'+
    '<div class="ft-biz" id="ft-biz"></div>'+
  '</div></footer>';
}

function paintBiz(){
  var host = $("ft-biz"); if(!host) return;
  var B = window.WOW_BIZ || {};
  var rows = [["상호",B.company],["대표",B.ceo],["사업자등록번호",B.brn],
              ["통신판매업 신고",B.mailOrder],["주소",B.address],
              ["고객센터",B.phone],["이메일",B.email]];
  var have = rows.filter(function(r){ return r[1] && String(r[1]).trim(); });
  var miss = rows.filter(function(r){ return !(r[1] && String(r[1]).trim()); })
                 .map(function(r){ return r[0]; });
  if(miss.length){
    try{ console.warn("[ABOUTMEAT] 푸터 사업자 정보가 비어 있습니다 — "+
      "js/data/site.js 의 WOW_BIZ 를 채우세요: "+miss.join(", ")+
      " (전자상거래법 제10조 표시 의무는 사이트 전체에 걸립니다)"); }catch(e){}
  }
  host.innerHTML = have.map(function(r){
      return '<span>'+esc(r[0])+' '+esc(r[1])+'</span>';
    }).join("")+
    '<div class="ft-cp">© ABOUTMEAT. All rights reserved.</div>';
}

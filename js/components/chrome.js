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
  /* ⚠️ 제일 앞이 **고민 해결**입니다. 손님이 처음 하는 일은 업체
     검색이 아니라 "내가 지금 무엇 때문에 들어왔는가" 를 고르는 것이고
     (지시서 3번), 그 답이 여기 있습니다. 업체찾기를 앞에 두면 그
     순간 전화번호부의 차림새가 됩니다. */
  { name:"고민 해결",    to:"/problems" },
  { name:"창업하기",     to:"/start" },
  { name:"사업진단",     to:"/check" },
  { name:"전문업체",     to:"/partners" },
  { name:"견적비교",     to:"/quotes" },
  { name:"사장님 연구소", to:"/lab" },
  { name:"파트너스",     to:"/partner" }
];
/* ⚠️ **계산기(/tools)를 헤더에서 뺐습니다.** 여덟 개가 되면 손님이
   "무엇을 하는 곳인가" 대신 "어디를 눌러야 하나" 를 고민합니다
   (지시서 42번). 대신 메인에 계산기 구간이 통째로 있고, 푸터에도
   다섯 가지가 전부 있습니다. */

/* 모바일 아래 네비 — 가운데 SOS 를 크게 (지시서 29번) */
var MNAV = [
  { to:"/",        name:"홈",   icon:"home" },
  { to:"/start",   name:"창업", icon:"seed" },
  { to:"/sos",     name:"SOS",  icon:"alert", big:true },
  { to:"/quotes",  name:"견적", icon:"scale" },
  { to:"/my",      name:"MY",   icon:"user" }
];

function Header(){
  return '<header class="hd">'+
    '<div class="w hd-in">'+
      '<a class="lg" href="/" aria-label="ABOUTMEAT 홈">'+
        '<b>ABOUTMEAT</b><span>고기 사업자 문제해결</span></a>'+
      '<nav class="gnb" id="gnb" aria-label="주요 메뉴"></nav>'+
      '<div class="hd-r">'+
        '<a class="hd-ic" href="/search" aria-label="검색">'+icon("search",20)+'</a>'+
        '<a class="hd-txt" href="/login">로그인</a>'+
        /* Primary CTA — 지시서 29번. 이 버튼 하나가 헤더에서 제일
           눈에 띄어야 합니다. */
        '<a class="btn btn-b hd-cta" href="/sos">무료로 물어보기</a>'+
      '</div>'+
      '<span class="hd-m-wrap">'+
        '<a class="hd-m" href="/search" aria-label="검색">'+icon("search",20)+'</a>'+
        '<a class="hd-m" href="/sos" aria-label="무료 상담">'+icon("chat",20)+'</a>'+
      '</span>'+
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

/* ── 넓은 화면에서 따라다니는 단추 ─────────────────────────
   ⚠️ 손님은 아래로 내려가다가 "물어봐야겠다" 고 마음먹습니다. 그때
   헤더는 이미 화면 밖입니다 — 다시 맨 위로 올라가게 하지 않습니다.

   ⚠️ **좁은 화면에는 내지 않습니다.** 아래 네비(.mnav)가 같은 일을
   하고 있어서, 둘이 겹치면 화면 아래가 단추로 막힙니다.
   ⚠️ 첫 화면에서는 숨깁니다. 히어로에 이미 큰 입력창이 있는데 그 위에
   단추를 또 띄우면 가립니다 — 조금 내려간 뒤에 나타납니다(app.js). */
function FloatCta(){
  return '<a class="fab" id="fab" href="/sos">'+
    icon("chat",20)+'<b>무료로 물어보기</b></a>';
}

function MobileNav(){
  return '<nav class="mnav" aria-label="모바일 메뉴"><div class="mnav-in">'+
    MNAV.map(function(m){
      /* ⚠️ SOS 는 **주소를 그대로 둡니다.** JS 가 안 돌거나 새 탭으로
         여실 때도 /sos 로 가야 합니다. 좁은 화면에서만 가로채서
         바닥 시트를 엽니다 (지시서 §24). */
      var sos = (m.to === "/sos");
      return '<a href="'+esc(m.to)+'" data-m="'+esc(m.to)+'"'+
        (m.big?' class="big"':'')+
        (sos?' onclick="return sosSheetOpen(event)"':'')+'>'+
        icon(m.icon, m.big?24:21)+'<span>'+esc(m.name)+'</span></a>';
    }).join("")+'</div></nav>'+ SosSheet();
}

/* ── 모바일 SOS 바닥 시트 (§24) ──────────────────────────────
   ⚠️ **첨부 칸을 만들지 않았습니다.** 지금은 파일을 받아 둘 곳이
   없어서, 고르게 해 놓고 조용히 버리면 그게 거짓말입니다
   (절대 규칙 5). 대신 사진·견적서는 연락 후에 받는다고 적습니다 —
   SOS 화면이 하는 말과 같습니다.
   ⚠️ 여기서 **접수하지 않습니다.** 적으신 말을 들고 /sos 로 넘어갑니다.
   동의 · 연락처 · 접수 가능 여부 안내가 전부 거기 있고, 그걸 시트에
   또 만들면 두 군데가 어긋납니다. */
function SosSheet(){
  var chips = (window.WOW_ASK_CHIPS || []);
  return '<div class="sheet" id="sos-sheet" hidden>'+
    '<div class="sheet-bg" onclick="sosSheetClose()"></div>'+
    '<div class="sheet-p" role="dialog" aria-modal="true" aria-labelledby="sheet-h">'+
      '<span class="sheet-grip" aria-hidden="true"></span>'+
      '<div class="sheet-hd">'+
        '<h2 id="sheet-h">무슨 일이 있으세요?</h2>'+
        '<button class="sheet-x" type="button" onclick="sosSheetClose()"'+
          ' aria-label="닫기">'+icon("x",20)+'</button>'+
      '</div>'+
      '<label class="sr" for="sheet-q">지금 상황</label>'+
      '<textarea id="sheet-q" rows="3" enterkeyhint="go"'+
        ' placeholder="예: 40평 고깃집인데 덕트 냄새 민원이 계속 들어옵니다."'+
        ' onkeydown="sosSheetKey(event)"></textarea>'+
      (chips.length ? '<ul class="sheet-c">'+chips.map(function(c,i){
        return '<li><button type="button" onclick="sosSheetFill('+i+')">'+
          esc(c.tag)+'</button></li>'; }).join("")+'</ul>' : '')+
      '<button class="btn btn-b btn-lg sheet-go" type="button" onclick="sosSheetGo()">'+
        '해결방법 찾기'+icon("arrow",18)+'</button>'+
      '<p class="sheet-n">사진이나 견적서가 있으시면 연락드린 뒤에 받겠습니다. '+
        '여기서는 접수되지 않습니다 — 다음 화면에서 확인하고 보내시면 됩니다.</p>'+
    '</div>'+
  '</div>';
}

var SHEET_BACK = null;
window.sosSheetOpen = function(ev){
  /* 넓은 화면이나 새 탭·가운데 클릭은 그냥 /sos 로 갑니다 */
  if(window.innerWidth > 860) return true;
  if(ev && (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button === 1)) return true;
  var el = $("sos-sheet"); if(!el) return true;
  if(ev) ev.preventDefault();
  SHEET_BACK = document.activeElement;
  el.hidden = false;
  document.body.classList.add("sheet-on");
  requestAnimationFrame(function(){
    el.classList.add("on");
    var t = $("sheet-q"); if(t) t.focus();
  });
  return false;
};
window.sosSheetClose = function(){
  var el = $("sos-sheet"); if(!el || el.hidden) return;
  el.classList.remove("on");
  document.body.classList.remove("sheet-on");
  /* ⚠️ 닫자마자 hidden 을 걸면 닫히는 모션이 안 보입니다 */
  setTimeout(function(){ el.hidden = true; }, 200);
  if(SHEET_BACK && SHEET_BACK.focus) SHEET_BACK.focus();
  SHEET_BACK = null;
};
window.sosSheetFill = function(i){
  var c = (window.WOW_ASK_CHIPS||[])[i], t = $("sheet-q");
  if(!c || !t) return;
  t.value = c.ask; t.focus();
  try{ t.setSelectionRange(t.value.length, t.value.length); }catch(e){}
};
window.sosSheetKey = function(ev){
  if(ev.key === "Enter" && !ev.shiftKey){ ev.preventDefault(); sosSheetGo(); }
};
window.sosSheetGo = function(){
  var t = $("sheet-q"), v = t ? String(t.value||"").trim() : "";
  sosSheetClose();
  go("/sos" + (v ? "?q=" + encodeURIComponent(v) : ""));
};

function paintMnav(){
  /* 지금 화면이 다섯 칸 중 어디에 속하는지. 상세 화면에서 아무 칸도
     안 켜져 있으면 손님이 길을 잃습니다. */
  var p = nowPath(), cur = "";
  if(p === "/") cur = "/";
  else if(/^\/sos/.test(p))      cur = "/sos";
  else if(/^\/start/.test(p))    cur = "/start";
  /* ⚠️ 업체 찾기 · 파트너도 **견적 칸**을 켭니다. 아래 네비가 다섯
     칸이라 업체 칸이 따로 없는데, 아무 칸도 안 켜져 있으면 손님이
     길을 잃습니다. 업체를 고르는 일은 결국 견적으로 이어집니다. */
  else if(/^\/request|^\/quotes|^\/partners?/.test(p)) cur = "/quotes";
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
        '<a href="/sos">사장님 SOS</a><a href="/problems">고민별 해결방법</a>'+
        '<a href="/check">무료 사업진단</a>'+
        '<a href="/start">창업 준비</a><a href="/start/cost">창업비 정리표</a>'+
        '<a href="/tools/yield">수율 원가 계산</a><a href="/tools/bep">손익분기 계산</a>'+
        '<a href="/tools/labor">인건비율 계산</a>'+
        '<a href="/request">견적 요청</a></div>'+
      '<div class="ft-col"><h4>알아보기</h4>'+
        '<a href="/partners">업체 찾기</a><a href="/quotes">견적 비교</a>'+
        '<a href="/lab">사장님 연구소</a><a href="/about">ABOUTMEAT 소개</a></div>'+
      '<div class="ft-col"><h4>파트너</h4>'+
        '<a href="/partner/apply">파트너 등록</a><a href="/partner">파트너 안내</a></div>'+
      '<div class="ft-col"><h4>고객지원</h4>'+
        '<a href="/my">MY BUSINESS</a>'+
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

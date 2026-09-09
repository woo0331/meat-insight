/* ════════════════════════════════════════════════════════════════════
   왜 고리인가 · 회사 소개

   사이트를 처음 열었을 때 "여기가 뭘 해주는 곳인지" 가 안 보였습니다.
   그 답(사업자 인증 · 조건 매칭 · 견적 비교 · 수수료 없음)이 있긴 했는데
   푸터 바로 위, 화면 맨 밑에 있었습니다 — 거기까지 내려가는 사람은
   없습니다. 그래서 카테고리 바로 아래로 끌어올리고, 따로 소개 페이지를
   만들었습니다.

   ⚠️ 여기 쓰는 문장은 전부 지금 만들어져 있는 기능만 말합니다.
   설립 연도 · 팀 규모 · 누적 거래액 · 제휴사 · 수상 같은 것은 확인할
   방법이 없으므로 한 줄도 쓰지 않습니다. 사업자 정보는 site-info.js 의
   GORI_BIZ 에서 그대로 가져옵니다 (비어 있으면 "(미기재)").
   ════════════════════════════════════════════════════════════════════ */

/* ── TrustSection ─────────────────────────────────────────────────
   예전에는 "왜 고리를 쓰나요" 띠가 홈 위쪽(분야 바로 아래)에 있었고,
   푸터 위에 거의 같은 말을 하는 신뢰 지표 줄이 또 있었습니다. 둘을 하나로
   합쳐 페이지 중간(실시간 요청 뒤)에 둡니다.

   위쪽은 사람이 "찾아보러" 온 자리입니다 — 설득은 한 번 둘러본 뒤에
   와야 합니다. 첫 화면부터 설득 문단이 600px 깔려 있으면 오히려
   광고처럼 읽힙니다.

   네 가지는 전부 실제로 만들어져 있는 것만 적습니다.
   (인증 = 10_trust, 조건 매칭 = 08_match, 견적 비교 = 03_quote) */
var AB_WHY=[
  { k:"vf", t:"사업자 인증",
    d:"사업자등록번호를 국세청 체크섬으로 검증하고, 확인된 업체에만 배지를 답니다." },
  { k:"hc", t:"HACCP 확인",
    d:"축산물 영업허가와 HACCP 번호를 받아 관리자가 확인합니다. 확인 전이면 \"심사중\" 으로 둡니다." },
  { k:"call", t:"조건 매칭",
    d:"요청을 한 번 올리면 분야와 지역이 맞는 업체에 알림이 갑니다." },
  { k:"cmp", t:"견적 비교",
    d:"단가·총액·납기·평점·거래실적을 한 화면에 세워 놓고 고릅니다." }
];

var AB_FLOW_OLD=["아는 업체에 한 곳씩 전화","단가는 물어봐야 알고","처음 거래하는 곳은 확인할 길이 없음"];
var AB_FLOW_NEW=["요청 한 번 등록","견적이 모여서 도착","나란히 비교하고 선택"];

function abIco(k){
  var s='<svg class="du" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
        'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  if(k==="call") return s+'<g class="du-f"><circle cx="5.6" cy="12" r="2.6"/></g>'+
    '<g class="du-s"><circle cx="5.6" cy="12" r="2.6"/><circle cx="18.4" cy="6.4" r="2.6"/>'+
    '<circle cx="18.4" cy="17.6" r="2.6"/><path d="M8 10.8l7.9-3.4M8 13.2l7.9 3.4"/></g></svg>';
  if(k==="cmp")  return s+'<g class="du-f"><rect x="3.5" y="10" width="5" height="10" rx="1.4"/></g>'+
    '<g class="du-s"><rect x="3.5" y="10" width="5" height="10" rx="1.4"/><rect x="10" y="6" width="5" height="14" rx="1.4"/>'+
    '<rect x="16.5" y="13" width="4" height="7" rx="1.4"/></g></svg>';
  if(k==="hc")   return s+'<g class="du-f"><circle cx="12" cy="12" r="8.6"/></g>'+
    '<g class="du-s"><circle cx="12" cy="12" r="8.6"/><path d="M8.2 12.3l2.6 2.6 5-5.4"/></g></svg>';
  return s+'<g class="du-f"><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/></g>'+
    '<g class="du-s"><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></g></svg>';
}

function abWhyCard(w){
  return '<div class="why-c">'+
    '<div class="why-ico">'+abIco(w.k)+'</div>'+
    '<div class="why-t">'+esc(w.t)+'</div>'+
    '<div class="why-d">'+esc(w.d)+'</div></div>';
}

/* 실시간 요청 구간을 찾습니다 (없으면 분야 줄 뒤 — 예전 자리로 물러섭니다) */
function abTrustAnchor(){
  var w=document.querySelector("#pg-h #rq-widget");
  if(w){ var sec=w.closest("section"); if(sec) return sec; }
  return document.querySelector("#pg-h .svc-sec") || document.querySelector("#pg-h .sec-cat8");
}

function abInjectWhy(){
  if($("why-band")) return;
  var host=abTrustAnchor(); if(!host) return;
  var sec=document.createElement("section");
  sec.className="sec why"; sec.id="why-band";
  sec.innerHTML=
    '<div class="w">'+
      '<div class="why-hd">'+
        '<div class="why-eye">TRUST</div>'+
        '<h2 class="sec-h2">믿고 연결할 수 있도록</h2>'+
        '<p class="why-lead">처음 거래하는 업체가 어떤 곳인지 확인할 방법이 없어서 '+
          '결국 아는 곳에만 전화하게 됩니다. 그 확인을 고리가 대신합니다. '+
          '요청 등록과 견적 비교에는 수수료가 없습니다.</p>'+
      '</div>'+
      '<div class="why-flow">'+
        '<div class="why-side why-old"><div class="why-side-t">지금까지</div><ul>'+
          AB_FLOW_OLD.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join("")+'</ul></div>'+
        '<div class="why-arw" aria-hidden="true">'+
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" '+
          'stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13"/><path d="M13 6l6 6-6 6"/></svg></div>'+
        '<div class="why-side why-new"><div class="why-side-t">고리에서는</div><ul>'+
          AB_FLOW_NEW.map(function(x){ return '<li>'+esc(x)+'</li>'; }).join("")+'</ul></div>'+
      '</div>'+
      '<div class="why-grid">'+AB_WHY.map(abWhyCard).join("")+'</div>'+
      '<div class="why-act">'+
        '<button class="gbtn gbtn-p" onclick="go(&quot;rw&quot;)">무료로 요청 올리기</button>'+
        '<button class="gbtn gbtn-w" onclick="gOpenAbout()">고리는 어떤 곳인가요 ›</button>'+
      '</div>'+
    '</div>';
  host.parentNode.insertBefore(sec, host.nextSibling);
}

/* ════════════════════════════════════════════════════════════════════
   소개 페이지 (#/about)
   ════════════════════════════════════════════════════════════════════ */

var AB_DO=[
  ["요청을 받아 옮깁니다","분야·지역·수량 같은 조건을 보고, 그 조건을 다루는 업체에게 요청을 전달합니다."],
  ["견적을 한 자리에 모읍니다","업체가 보낸 단가·수량·납기·조건을 총액으로 계산해 나란히 세워 둡니다."],
  ["업체 정보를 확인해 표시합니다","사업자등록번호는 국세청 체크섬으로 형식을 검증하고, 축산물 영업허가·HACCP 번호는 관리자가 확인한 뒤 배지를 답니다."],
  ["거래가 끝날 때까지 같이 봅니다","1:1 대화, 거래확정 → 준비중 → 배송중 → 완료 상태, 그리고 후기와 평점이 남습니다."]
];

var AB_DONT=[
  ["대금을 받아 두지 않습니다","고리는 통신판매의 당사자가 아닙니다. 결제와 정산은 요청자와 업체가 직접 합니다. 안심결제(고리페이)는 아직 만들어지지 않았고, 준비되면 그때 안내드립니다."],
  ["품질과 이행을 보증하지 않습니다","인증 배지는 \"번호를 확인했다\" 는 뜻이지 거래를 보증한다는 뜻이 아닙니다. 조건은 직접 확인하고 계약하세요."],
  ["없는 숫자를 만들지 않습니다","시세는 관리자가 입력한 값만, 뉴스는 실제 기사만 보여 줍니다. 데이터가 없으면 빈 화면으로 둡니다."]
];

var AB_VOW=[
  ["확인한 것만 배지로 답니다","확인 전에는 \"심사중\" 으로 두고, 배지가 없다고 해서 문제가 있는 업체라는 뜻으로 쓰지 않습니다."],
  ["안 만든 기능을 광고하지 않습니다","준비 중인 것은 \"준비 중\" 이라고 적어 둡니다."],
  ["요금이 생기면 먼저 알립니다","유료로 바뀌면 미리 공지하고, 그 전에 진행된 건에는 수수료를 받지 않습니다."],
  ["연락처는 견적을 보낸 업체에게만 보입니다","수집 항목과 보관 기간은 개인정보처리방침에 적어 두었습니다."]
];

function abPair(a){
  return '<div class="ab-it"><div class="ab-it-t">'+esc(a[0])+'</div><div class="ab-it-d">'+esc(a[1])+'</div></div>';
}

function abBizRows(){
  var B=window.GORI_BIZ||{};
  function v(x){ return (x&&String(x).trim()) ? esc(String(x).trim()) : '<span class="biz-none">(미기재)</span>'; }
  var rows=[["서비스명",B.service||"고리"],["상호",B.company],["대표자",B.ceo],
            ["사업자등록번호",B.brn],["통신판매업 신고",B.mailOrder],["주소",B.address],
            ["고객센터",B.phone],["이메일",B.email],["개인정보 보호책임자",B.privacyOfficer]];
  return '<dl class="ab-biz">'+rows.map(function(r){
    return '<div class="ab-biz-r"><dt>'+esc(r[0])+'</dt><dd>'+v(r[1])+'</dd></div>';
  }).join("")+'</dl>';
}

function abRender(){
  var el=$("about-body"); if(!el) return;
  el.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;h&quot;)">← 홈</button>'+
      '<div><div class="gp-title">고리 소개</div>'+
      '<div class="gp-sub">어떤 곳이고, 무엇을 하고, 무엇을 하지 않는지 적어 두었습니다</div></div></div>'+

    '<div class="ab-hero">'+
      '<div class="ab-h1">축산에 필요한 연결을<br>한 곳에서 끝내려고 만들었습니다</div>'+
      '<p class="ab-lead">원육·가공·물류·인력·장비·창업·HACCP까지, 축산업에서 사람을 찾고 물건을 구하는 일은 '+
        '아직도 대부분 아는 사람에게 거는 전화로 이루어집니다. 고리는 그 전화를 <b>요청 한 건</b>으로 바꾸고, '+
        '돌아오는 대답을 <b>비교할 수 있는 견적</b>으로 정리합니다.</p>'+
    '</div>'+

    '<div class="gcard ab-sec"><div class="gcard-t">왜 만들었나</div>'+
      '<p class="ab-p">거래처를 새로 뚫으려면 어디에 물어봐야 하는지부터 막힙니다. 어렵게 연락이 닿아도 '+
        '단가는 통화를 해봐야 알고, 여러 곳을 비교하려면 같은 이야기를 몇 번씩 반복해야 합니다. '+
        '반대로 업체 쪽은 일감이 어디서 나오는지 알 방법이 없어 소개에만 기댑니다.</p>'+
      '<p class="ab-p">양쪽 모두 상대가 있는데 서로를 못 찾는 상황입니다. 필요한 것은 새로운 유통망이 아니라, '+
        '조건을 적어 두면 맞는 쪽에 닿게 해주는 <b>연결 고리</b> 하나였습니다.</p>'+
    '</div>'+

    '<div class="gcard ab-sec"><div class="gcard-t">고리가 하는 일</div>'+
      AB_DO.map(abPair).join("")+
    '</div>'+

    '<div class="gcard ab-sec ab-warn"><div class="gcard-t">고리가 하지 않는 일</div>'+
      '<p class="ab-p ab-p-sm">헷갈리면 손해로 이어지는 부분이라 먼저 적어 둡니다.</p>'+
      AB_DONT.map(abPair).join("")+
    '</div>'+

    '<div class="gcard ab-sec"><div class="gcard-t">지키려는 것</div>'+
      AB_VOW.map(abPair).join("")+
    '</div>'+

    '<div class="gcard ab-sec"><div class="gcard-t">사업자 정보</div>'+
      abBizRows()+
      '<div class="ab-note">고리는 축산업 관련 거래를 중개하는 플랫폼입니다. 거래의 조건·품질·이행에 대한 '+
        '책임은 거래 당사자에게 있으며, 고리는 통신판매의 당사자가 아닙니다.</div>'+
    '</div>'+

    '<div class="grow keep" style="margin:4px 0 8px;">'+
      '<button class="gbtn gbtn-p" onclick="go(&quot;rw&quot;)">요청 올리기</button>'+
      '<button class="gbtn gbtn-w" onclick="go(&quot;sj&quot;)">업체로 참여하기</button>'+
    '</div>'+
    '<div class="grow keep">'+
      '<button class="gbtn gbtn-w" onclick="gOpenGuide()">이용 가이드</button>'+
      '<button class="gbtn gbtn-w" onclick="gOpenContact()">문의하기</button>'+
      '<button class="gbtn gbtn-w" onclick="location.href=\'terms.html\'">이용약관</button>'+
    '</div>';
  window.scrollTo(0,0);
}

window.gOpenAbout=function(){ if(typeof go==="function") go("about"); abRender(); };

function abInjectPage(){
  if($("pg-about")) return;
  var nav=document.querySelector(".bnav");
  var d=document.createElement("div");
  d.className="pg"; d.id="pg-about";
  d.style.cssText="padding-top:var(--top-pad);padding-bottom:56px;";
  d.innerHTML='<div class="gp" id="about-body"></div>';
  if(nav) document.body.insertBefore(d, nav); else document.body.appendChild(d);
  if(typeof PGS!=="undefined" && PGS.indexOf("about")<0) PGS.push("about");
  if(typeof TM!=="undefined") TM.about="h";
  /* 공유·새로고침으로 곧바로 열리게 합니다 (가이드도 같이) */
  try{
    if(typeof RT_RESTORE!=="undefined"){
      if(RT_RESTORE.indexOf("about")<0) RT_RESTORE.push("about");
      if(RT_RESTORE.indexOf("guide")<0) RT_RESTORE.push("guide");
    }
    if(typeof RT_TITLE!=="undefined"){ RT_TITLE.about="고리 소개"; RT_TITLE.guide="이용 가이드"; }
  }catch(e){}
}

/* 푸터 "고리" 칸 맨 앞에 소개를 답니다 (index.html 은 건드리지 않습니다) */
function abInjectFooterLink(){
  var uls=document.querySelectorAll(".footer .ft-ul");
  for(var i=0;i<uls.length;i++){
    var ul=uls[i];
    if(ul.querySelector(".ab-ft")) return;
    var hasGuide=false, li=ul.children;
    for(var j=0;j<li.length;j++) if(/이용 가이드/.test(li[j].textContent||"")) hasGuide=true;
    if(!hasGuide) continue;
    var n=document.createElement("li");
    n.className="ab-ft"; n.textContent="고리 소개";
    n.setAttribute("onclick","gOpenAbout()");
    ul.insertBefore(n, ul.firstChild);
    return;
  }
}

/* 모바일 서랍에도 답니다 (데스크톱 상단은 이미 7칸이라 넣지 않습니다 —
   좁은 화면에서 줄이 넘칩니다. 대신 홈 띠와 푸터에서 들어갑니다) */
function abInjectMenuLink(){
  var row=document.querySelector("#mobile-menu .mm-row"); if(!row) return;
  if(row.querySelector(".ab-mm")) return;
  var a=document.createElement("a");
  a.className="ab-mm"; a.textContent="고리 소개";
  a.setAttribute("onclick","mmGo('about')");
  row.appendChild(a);
}

function patchAbout(){
  if(G._about) return; G._about=true;
  abInjectPage();
  abInjectWhy();
  abInjectFooterLink();
  abInjectMenuLink();
  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(p){
      var r=origGo.apply(this, arguments);
      if(p==="about") abRender();
      return r;
    };
  }
}

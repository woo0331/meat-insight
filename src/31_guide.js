/* ════════════════════════════════════════════════════════════════════
   이용 가이드 · 자주 묻는 질문

   홈의 "고리 이용 프로세스" 는 7단계 이름만 늘어놓을 뿐이라, 처음 온
   사람이 "그래서 내가 뭘 하면 되나" 를 알 수 없었습니다. 요청하는 쪽과
   업체 쪽의 할 일을 나눠서 적고, 실제로 자주 나올 질문에 답합니다.

   여기 적는 내용은 전부 지금 만들어져 있는 기능만 말합니다.
   (결제·정산은 고리를 거치지 않습니다 — GORI_FEATURES.pay 가 꺼져 있습니다)
   ════════════════════════════════════════════════════════════════════ */

var GU = { tab:"buyer" };
G.GU=GU;

var GU_BUYER=[
  { n:"1", t:"필요한 것을 올립니다",
    d:"분야를 고르고 3단계만 채우면 됩니다. 원육이면 축종·부위·수량·냉장/냉동, 물류면 구간과 물량처럼 분야마다 물어보는 항목이 다릅니다.",
    m:"로그인 없이도 올릴 수 있습니다. 이름과 연락처만 남기면 됩니다." },
  { n:"2", t:"조건이 맞는 업체에 전달됩니다",
    d:"고른 분야와 지역이 맞는 업체에게 알림이 갑니다. 요청을 올린 직후에는 조건이 맞는 업체를 바로 추천해 드립니다.",
    m:"업체를 직접 찾아 다닐 필요가 없습니다." },
  { n:"3", t:"견적을 나란히 비교합니다",
    d:"단가 × 수량으로 계산된 총액, 시세 대비 ±%, 인증 배지, 지역, 납기, 평점, 거래실적, 응답률을 한 화면에서 봅니다.",
    m:"가격 낮은순·납기 빠른순 등 5가지로 정렬할 수 있습니다." },
  { n:"4", t:"고르고, 거래하고, 후기를 남깁니다",
    d:"고른 업체와 1:1 채팅으로 조건을 맞춥니다. 거래확정 → 준비중 → 배송중 → 완료까지 상태를 같이 보고, 끝나면 평점과 후기를 남깁니다.",
    m:"후기가 쌓이면 다음 사람이 업체를 고르기 쉬워집니다." }
];

var GU_SUP=[
  { n:"1", t:"업체를 등록합니다",
    d:"업체명·연락처·영업 지역, 취급 분야와 품목, 작업장 사진까지 4단계입니다. 사업자등록번호·축산물 영업허가·HACCP 번호를 넣으면 인증 심사가 같이 접수됩니다.",
    m:"3분이면 끝납니다. 지금은 등록비가 없습니다." },
  { n:"2", t:"내 분야 요청만 받습니다",
    d:"고른 분야와 지역의 요청이 올라오면 알림이 갑니다. 홈에서도 \"내 업체에 맞는 요청\" 으로 모아서 보여 드립니다.",
    m:"관심 없는 분야의 요청은 오지 않습니다." },
  { n:"3", t:"견적을 보냅니다",
    d:"단가와 수량, 납기, 조건을 적으면 총액이 자동으로 계산됩니다. 보낸 뒤에도 선택되기 전이라면 철회할 수 있습니다.",
    m:"같은 요청에 견적은 한 번만 보낼 수 있습니다." },
  { n:"4", t:"선택되면 거래로 이어집니다",
    d:"요청자가 고르면 1:1 채팅이 열립니다. 거래 상태를 함께 갱신하고, 완료되면 후기와 평점이 업체 프로필에 쌓입니다.",
    m:"인증 배지와 후기가 다음 요청에서 유리하게 작용합니다." }
];

var GU_FAQ=[
  { q:"돈이 드나요?",
    a:"베타 기간에는 요청 등록도, 업체 등록도, 견적 발송도 모두 무료입니다. 유료로 바뀌게 되면 미리 공지하고, 그 전에 진행된 건에는 수수료를 받지 않습니다." },
  { q:"대금은 고리를 거쳐서 오가나요?",
    a:"아닙니다. 고리는 요청과 업체를 연결하는 곳이고, 대금은 요청자와 업체가 직접 주고받습니다. 안전결제(고리페이)는 아직 만들어지지 않았습니다 — 준비되면 안내드립니다." },
  { q:"로그인 없이 요청할 수 있나요?",
    a:"됩니다. 이름과 연락처만 남기면 요청이 올라갑니다. 나중에 거래관리 → 내 요청 찾기 에서 이름과 전화번호로 다시 조회할 수 있고, 같은 기기에서는 번호를 기억해 두었다가 바로 보여 드립니다." },
  { q:"견적이 하나도 안 오면 어떻게 하나요?",
    a:"수량이나 지역 조건을 넓혀서 요청을 수정해 보세요. 요청 상세에서 바로 고칠 수 있습니다. 시간이 오래 지난 요청은 목록에서 \"오래된 요청\" 으로 표시되고, 업체에게도 그렇게 보입니다." },
  { q:"올린 요청을 지울 수 있나요?",
    a:"견적이 아직 하나도 없으면 삭제할 수 있습니다. 견적이 도착한 뒤에는 삭제 대신 마감을 눌러 주세요 — 견적을 보낸 업체가 있는데 기록이 사라지면 곤란하기 때문입니다." },
  { q:"인증 배지는 무엇을 확인한 건가요?",
    a:"사업자등록번호는 국세청 체크섬으로 형식을 검증하고, 축산물 영업허가와 HACCP 은 번호를 받아 관리자가 확인합니다. 확인 전에는 \"심사중\" 으로 표시되며, 배지가 없다고 해서 문제가 있는 업체라는 뜻은 아닙니다." },
  { q:"시세는 어디서 온 숫자인가요?",
    a:"관리자가 입력한 값만 보여 줍니다. 데이터가 없으면 빈 화면으로 두고, 임의로 만들어 내지 않습니다. 참고용이며 실제 거래가는 견적으로 확인하세요." },
  { q:"당일알바와 구인구직은 뭐가 다른가요?",
    a:"당일알바는 오늘·내일 바로 필요한 현장 인력이고, 구인구직은 정규직·계약직처럼 오래 함께 갈 사람을 찾는 곳입니다. 지원자를 경력·평점·작업 횟수로 골라 확정합니다." },
  { q:"개인정보는 어떻게 다루나요?",
    a:"수집 항목과 보관 기간은 개인정보처리방침에 적어 두었습니다. 요청에 남긴 연락처는 견적을 보낸 업체에게만 보입니다." }
];

function guCard(s){
  return '<div class="gu-step">'+
    '<div class="gu-n">'+s.n+'</div>'+
    '<div class="gu-b"><div class="gu-t">'+esc(s.t)+'</div>'+
      '<div class="gu-d">'+esc(s.d)+'</div>'+
      '<div class="gu-m">'+esc(s.m)+'</div></div></div>';
}

function guRender(){
  var el=$("guide-body"); if(!el) return;
  var buyer=GU.tab==="buyer";
  var steps=(buyer?GU_BUYER:GU_SUP).map(guCard).join("");
  el.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;h&quot;)">← 홈</button>'+
      '<div><div class="gp-title">이용 가이드</div>'+
      '<div class="gp-sub">요청을 올리는 쪽과 견적을 보내는 쪽이 각각 무엇을 하는지 정리했습니다</div></div></div>'+

    '<div class="gu-tabs">'+
      '<button class="gu-tab'+(buyer?" on":"")+'" onclick="gGuideTab(\'buyer\')">요청하는 분</button>'+
      '<button class="gu-tab'+(buyer?"":" on")+'" onclick="gGuideTab(\'sup\')">업체로 참여하는 분</button>'+
    '</div>'+

    '<div class="gu-steps">'+steps+'</div>'+

    '<div class="grow keep" style="margin:4px 0 8px;">'+
      (buyer
        ? '<button class="gbtn gbtn-w" onclick="go(&quot;reqs&quot;)">올라온 요청 보기</button>'+
          '<button class="gbtn gbtn-p" onclick="go(&quot;rw&quot;)">요청 올리기</button>'
        : '<button class="gbtn gbtn-w" onclick="go(&quot;reqs&quot;)">올라온 요청 보기</button>'+
          '<button class="gbtn gbtn-p" onclick="go(&quot;sj&quot;)">업체 등록하기</button>')+
    '</div>'+

    '<div class="gcard"><div class="gcard-t">자주 묻는 질문</div>'+
      GU_FAQ.map(function(f,i){
        return '<details class="gu-faq"'+(i===0?" open":"")+'>'+
          '<summary>'+esc(f.q)+'</summary>'+
          '<p>'+esc(f.a)+'</p></details>';
      }).join("")+
    '</div>'+

    '<div class="gnote">더 궁금한 점은 아래 고객센터로 문의해 주세요. '+
      '이용약관과 개인정보처리방침은 화면 맨 아래에서 언제든 볼 수 있습니다.</div>'+
    '<div class="grow keep">'+
      '<button class="gbtn gbtn-p" onclick="gOpenContact()">문의하기</button>'+
      '<button class="gbtn gbtn-w" onclick="location.href=\'terms.html\'">이용약관</button>'+
      '<button class="gbtn gbtn-w" onclick="location.href=\'privacy.html\'">개인정보처리방침</button>'+
    '</div>';
  window.scrollTo(0,0);
}

window.gGuideTab=function(t){ GU.tab=t; guRender(); };
window.gOpenGuide=function(t){ if(t) GU.tab=t; if(typeof go==="function") go("guide"); guRender(); };

function guInjectPage(){
  if($("pg-guide")) return;
  var nav=document.querySelector(".bnav");
  var d=document.createElement("div");
  d.className="pg"; d.id="pg-guide";
  d.style.cssText="padding-top:var(--top-pad);padding-bottom:56px;";
  d.innerHTML='<div class="gp" id="guide-body"></div>';
  if(nav) document.body.insertBefore(d, nav); else document.body.appendChild(d);
  if(typeof PGS!=="undefined" && PGS.indexOf("guide")<0) PGS.push("guide");
  if(typeof TM!=="undefined") TM.guide="h";
}

/* 홈 프로세스 섹션에서 가이드로 들어갈 수 있게 합니다 */
function guInjectHomeLink(){
  var sec=document.querySelector("#proc-grid"); if(!sec) return;
  var hd=sec.parentNode.querySelector(".sec-hd2"); if(!hd || hd.querySelector(".gu-more")) return;
  hd.classList.add("row");
  var b=document.createElement("button");
  b.className="more-btn gu-more";
  b.textContent="이용 가이드 ›";
  b.setAttribute("onclick","gOpenGuide()");
  hd.appendChild(b);
}

function patchGuide(){
  if(G._guide) return; G._guide=true;
  guInjectPage();
  guInjectHomeLink();
  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(p){
      var r=origGo.apply(this, arguments);
      if(p==="guide") guRender();
      return r;
    };
  }
}

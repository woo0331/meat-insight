/* ════════════════════════════════════════════════════════════════════
   업체 입점 (/join) — 중고폰 매입업체 · 수리업체를 모으는 화면
   ⚠️⚠️ **2026-10-31 — `js/pages/providers.js` 에서 옮겨 왔습니다.**
   사장님 지시("인수인계 자료를 다 지워 · 중고폰 쪽은 살려두고")로
   창업 · 폐업 화면 일곱 파일을 지웠는데, 이 화면과 **동의 상자**는
   중고폰 쪽이 그대로 씁니다 — `/bid` 의 "매입업체로 참여하기" 가
   여기로 오고, `AgreeBox()` 는 `/sell` · `/repair` · `/quote` 의
   접수 동의입니다. 지우면 그 넷이 같이 죽습니다.
   ⚠️ 옛 자리를 꺼내 보시려면 `git show 6d85a17:js/pages/providers.js`.
   ════════════════════════════════════════════════════════════════════ */
function PageJoin(){
  /* ⚠️⚠️ **2026-10-29 PHONEWAY — 취급 기기로 바꿨습니다.**
     전에는 `catalog.js` 의 창업 · 폐업 분류 25(인테리어 · 철거 · 세무 ·
     노무 …)를 "입점 분야" 로 깔고 있었습니다 — 중고폰 매입업체가
     `/bid` 에서 넘어와 보면 **자기 일이 하나도 없는 목록**입니다.
     매입업체가 알아야 하는 것은 "어떤 기기가 들어오나" 까지입니다.
     ⚠️ `devices.js` 한 곳에서 옵니다 — 여기 손으로 적지 마세요.
     ⚠️ 셈(`amProvidersInCat`)은 `subs`(하위 분류 key)로 맞춰 보는
     규칙이라 기기 묶음에는 안 걸립니다. 그래서 **0 곳으로 읽히고**,
     지금 업체가 0곳이라 그게 사실입니다 — 등록이 시작되면 그때
     기기별로 세는 규칙을 따로 만들어야 합니다. */
  var subs = (window.AM_DEVICE_KINDS || []).map(function(k){
    return { cat:{ key:k.key, name:k.name, items:[] },
             items:(window.AM_MODELS || []).filter(function(m){
               return m.kind === k.key; }) };
  }).filter(function(g){ return g.items.length; });
  var ready = !!(window.WOW_BIZ && WOW_BIZ.sosReady);

  return PgHero({
    /* ⚠️⚠️ 2026-10-29 PHONEWAY — 받는 분이 **중고폰 매입업체**로 바뀌었습니다.
       전에는 창업 · 폐업 업체(인테리어 · 철거 · 세무)에게 하는 말이었는데,
       `/bid` 의 "매입업체로 참여하기" 가 여기로 보냅니다 — 누른 분은
       자기 일이 아닌 글을 보셨습니다.
       ⚠️ "무료" 를 적지 마세요 (PHONEWAY 지시서 §5 가 직접 금지).
       ⚠️ 글은 `js/data/join.js` 한 곳이고 여기는 히어로 석 줄뿐입니다. */
    kicker:"중고폰 매입업체 · 전문 수리업체",
    h1raw:"기기를 팔려는 분과<br class=\"br-m\"> 바로 이어 드립니다.",
    lead:"상호와 취급 기기만 남겨 주시면, 조건이 맞는 건만 보내 드립니다. 입찰에 참여하시는 데 받는 비용은 없습니다.",
    /* ⚠️⚠️ **이 화면은 영업 작업대의 종착점입니다.** 직원이 전화로
       설득해서 보낸 링크가 여기인데, 재 보니 폰에서 적는 칸까지가
       **3,721px(4.1화면)** 였습니다 — 거기서 닫히면 그 통화가
       버려집니다. 내려가지 않고도 바로 갈 수 있게 둡니다.
       ⚠️ 아래 글을 하나도 안 지웠습니다 — 길을 하나 더한 것입니다. */
    cta:'<a class="btn btn-b btn-lg" href="#join-form">입점 신청하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="#join-fields">어떤 분야를 찾나요</a>'
  })+
  JoinNow(subs)+
  /* ⚠️ §19 — 업체 사장님이 제일 먼저 묻는 여섯입니다. 입점 설득
     화면의 **맨 앞**이라야 합니다: 이 여섯에 답이 없으면 아래를
     안 읽습니다. 글은 `join.js` 의 `AM_JOIN_SIX` 한 곳입니다. */
  JoinSix()+
  JoinWhat()+
  /* ⚠️⚠️ V2 지시서 §26 이 "별도 파트너 페이지" 를 적었는데, 이 화면이
     이미 그 화면입니다 — 또 만들면 **같은 내용이 두 주소로** 나가고
     구글이 둘 다 무시합니다. 없던 것(§26 의 "입점하면 어디에
     노출되는지 · 업체 카드 예시 · 업체 상세페이지 예시")만 여기에
     더했습니다. `/partners` 는 vercel 이 308 로 여기 보냅니다. */
  JoinShow()+
  JoinWhy()+
  JoinHow()+
  JoinFields(subs)+
  JoinFaq()+
  JoinForm(ready);
}

/* ── 입점하면 어디에 보이나 + 이렇게 보입니다 (V2 §26 · §19) ──────
   ⚠️⚠️ **여기 쓰는 프로필은 `AM_SAMPLES` 이고 `AM_PROVIDERS` 가
   아닙니다.** 업체찾기 · 검색 · 메인 · sitemap 어디에도 안 나옵니다 —
   지어낸 업체를 손님 동선에 섞으면 표시광고법 제3조입니다.
   ⚠️ 카드마다 **예시 딱지**를 붙이고 구간 아래에 한 줄을 더 적습니다.
   ⚠️ 노출 자리는 전부 **실제로 있는 화면**입니다. 없는 자리를 적으면
   업체에게 하는 거짓말이고, 등록하고 나면 바로 압니다. */
/* ⚠️⚠️ **2026-10-29 PHONEWAY — 노출 자리가 통째로 바뀝니다.**
   중고폰 매입업체는 `/providers`(창업 · 폐업 업체찾기)에 **안 나옵니다** —
   거기는 인테리어 · 철거 · 세무를 찾는 화면입니다. 그대로 두면 등록하신
   업체가 거기서 자기를 찾다가 못 찾습니다 (업체에게 하는 거짓말).
   매입업체가 실제로 보이는 자리는 **판매자가 견적을 고르는 화면**입니다. */
var JOIN_WHERE = [
  { ic:"gavel",    t:"경쟁입찰",        p:"판매자가 올린 기기에 견적을 내는 자리", to:"/bid" },
  { ic:"compare",  t:"견적 비교 화면",  p:"판매자가 받은 견적을 나란히 놓고 보는 자리" },
  { ic:"mobile",   t:"기기 조건",       p:"기종 · 용량 · 외관 등급 · 상태가 적혀 옵니다", to:"/sell" },
  { ic:"doc",      t:"진행 조회",       p:"고르신 뒤의 수거 · 검수 · 정산 기록", to:"/track" }
];
/* ── 업체가 제일 먼저 묻는 여섯 (2026-10-06 2차 §19) ───────────────
   ⚠️⚠️ **성과를 지어내지 마세요.** "월 n건" · "n곳 입점" 은 지금 0 이고
   적으면 표시광고법 제3조입니다. 답은 전부 지금 사실인 것까지입니다.
   ⚠️ 링크 여섯은 전부 **실제로 있는 화면**입니다 — 이 화면은 영업
   자료로 그대로 나갑니다 (§19). */
function JoinSix(){
  var L = (window.AM_JOIN_SIX || []);
  if(!L.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">PARTNER Q&amp;A</p>'+
      '<h2>입점하면 무엇이 달라지나요?</h2>'+
      '<p>업체 사장님이 제일 먼저 묻는 여섯입니다. 지금 사실인 것만 적었습니다.</p>'+
    '</div>'+
    '<ul class="jn6">'+L.map(function(x){
      return '<li>'+
        '<p class="jn6-q">'+
          '<span class="ic-t">'+icon(x.ic,22)+'</span>'+
          '<b>'+esc(x.q)+'</b></p>'+
        '<p class="jn6-a">'+esc(x.a)+'</p>'+
        (x.to ? '<a class="jn6-go" href="'+esc(x.to)+'">'+esc(x.toN||"보기")+
          icon("arrow",15)+'</a>' : '')+
      '</li>'; }).join("")+'</ul>'+
  '</div></section>';
}

function JoinShow(){
  /* ⚠️⚠️ **2026-10-29 PHONEWAY — 예시 카드를 안 냅니다.**
     `AM_SAMPLES` 는 창업 · 폐업 예시 업체(가나다 인테리어)이고,
     중고폰 매입업체에게 그걸 "이렇게 보입니다" 로 내면 **자기 일이
     아닌 화면**을 보여 드리는 것입니다. 맞는 것이 없으면 구간째
     뺍니다 (절대 규칙 2) — "준비 중" 도 안 찍습니다.
     ⚠️ `AM_SAMPLES` 와 `/sample` 화면은 **지우지 않았습니다** —
     창업 · 폐업 157개를 어떻게 할지(0단계 ①) 정해지면 같이 갑니다.
     ⚠️ 매입업체용 예시가 생기면 이 한 줄만 되돌리면 됩니다. */
  var sp = null;
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">입점하면 어디에 보이나</p>'+
      '<h2>등록 한 번으로 이 자리에 같이 올라갑니다</h2>'+
      '<p>따로 신청하실 것이 없습니다. 하시는 일과 지역이 맞는 자리에 저절로 나갑니다.</p>'+
    '</div>'+
    '<ul class="ops-g">'+JOIN_WHERE.map(function(w){
      var in1 = '<span class="ops-i">'+icon(w.ic,22)+'</span>'+
        '<b>'+esc(w.t)+'</b>';
      /* ⚠️ 아직 화면이 없는 자리는 **링크를 걸지 않습니다** (가짜 링크 금지) */
      return '<li>'+(w.to
        ? '<a class="ops" href="'+esc(w.to)+'">'+in1+
          '<span class="ops-go" aria-hidden="true">'+icon("chev",15)+'</span></a>'
        : '<span class="ops">'+in1+'</span>')+'</li>';
    }).join("")+'</ul>'+
    (sp ? '<div class="jn-ex">'+
      '<p class="jn-ex-h"><b>업체 카드는 이렇게 보입니다</b>'+
        '<em>아래는 예시입니다 — 실제 업체가 아니고, 손님 화면 어디에도 나오지 않습니다.</em></p>'+
      '<div class="jn-ex-b"><span class="jn-ex-tag">예시</span>'+
        ProviderCard(sp)+
      '</div>'+
      '<p class="jn-ex-h"><b>상세 화면에는 이만큼 들어갑니다</b>'+
        '<em>사진 · 전문분야 · 취급기기 · 활동지역 · 가격 · 포트폴리오 · 확인 · 후기 · 상담 시간.</em></p>'+
      '<ul class="jn-ex-l">'+ joinExRows(sp).map(function(r){
        return '<li><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></li>'; }).join("")+'</ul>'+
      '<p class="sec-note">'+icon("info",15)+
        /* ⚠️ 여기는 `mark()` 를 안 거치는 자리라 별표가 **글자로** 찍힙니다 */
        '평점과 후기 수는 값으로 저장하지 않습니다 — 손님이 쓰신 후기에서 계산합니다. '+
        '등록하실 때 적는 칸 자체가 없습니다.</p>'+
    '</div>' : '')+
  '</div></section>';
}
/* 상세에 실제로 들어가는 칸 — ⚠️ **예시 프로필의 값에서 셉니다.**
   손으로 적으면 화면이 바뀔 때 여기만 옛말이 됩니다. */
function joinExRows(p){
  var st = amProviderStats(p) || {};
  var rows = [
    ["전문 서비스", (p.subs||[]).map(amSubName).join(" · ")],
    ["취급 기기",   (p.industries||[]).map(amKindName).join(" · ")],
    ["활동 지역",   (p.regions||[]).map(amRegionName).concat(p.gu||[]).join(" · ")],
    ["포트폴리오",  (p.portfolio||[]).length + "건 — 거래 내용 · 기기 · 지역 · 연도 · 사진"],
    /* ⚠️ 바로 위가 포트폴리오 줄이라 여기는 **서류로 확인한 것**만
       냅니다 — `amProviderBadges()` 를 쓰면 "포트폴리오 3건" 이 두 줄에
       나옵니다. ⚠️ 딱지는 "인증" 이 아니라 **"확인"** 입니다 (저희가
       자격을 주는 것이 아니라 서류를 봤다는 표시입니다). */
    ["확인",        amProviderVerified(p).join(" · ") || "확인한 것만"],
    ["상담 가능 시간", p.consultHours || ""]
  ];
  if(st.rating != null)
    rows.push(["후기", "평점 " + st.rating + " · " + st.reviews + "건 (후기에서 계산한 값입니다)"]);
  /* ⚠️ 값이 없는 줄은 **아예 뺍니다** — "(미기재)" 를 찍지 않습니다 */
  return rows.filter(function(r){ return r[1]; });
}

/* ── ① 지금 상태 — ⚠️ 0 을 그대로 말합니다 ───────────────────────
   이 단계에서 제일 센 말은 "아직 아무도 없습니다" 입니다. 부풀리면
   등록한 업체가 곧 알아채고, 그때 잃는 것이 훨씬 큽니다. */
function JoinNow(subs){
  var n = (window.AM_PROVIDERS || []).length;
  var open = !!(window.WOW_BIZ && WOW_BIZ.sosReady);
  /* 아직 아무도 없는 분야 — 세는 값입니다 */
  var empty = subs.filter(function(g){
    return window.amProvidersInCat ? amProvidersInCat(g.cat) === 0 : true; }).length;

  return '<section class="sec sec-white"><div class="w">'+
    '<div class="jn-now">'+
      '<div class="jn-now-t">'+
        '<p class="eyebrow">지금 상태</p>'+
        (n
          ? '<h2>지금 <em>'+n+'곳</em>이 등록돼 있습니다.</h2>'+
            '<p class="lead">분야와 지역이 맞는 요청을 나눠 받습니다.</p>'
          : '<h2>아직 <em>아무도</em> 등록하지 않았습니다.</h2>'+
            '<p class="lead">부풀려 말씀드리지 않겠습니다. 지금 등록된 업체는 '+
              '0곳이고, 그래서 지금 들어오시면 그 분야의 <b>첫 번째</b>입니다.</p>')+
      '</div>'+
      '<ul class="jn-now-l">'+
        /* ⚠️ "준비 중" 이라고 하지 않습니다 — 언제 되는지 약속하는 말로
           읽힙니다 (절대 규칙 5). 지금 사실만 적습니다. */
        /* ⚠️ 2026-10-29 PHONEWAY — 세 칸의 말을 중고폰 쪽으로 옮겼습니다.
           ⚠️⚠️ "무료" 는 지시서 §5 가 직접 금지한 말이라 뺐습니다. */
        '<li><b>'+esc(open ? "열려 있습니다" : "아직 열지 않았습니다")+'</b>'+
          '<span>판매자 쪽 판매 신청 접수</span></li>'+
        '<li><b>'+(empty || subs.length)+'개 분야</b>'+
          '<span>'+esc(empty ? "아직 등록된 업체가 없습니다" : "업체를 받고 있습니다")+'</span></li>'+
        '<li><b>비용 없음</b><span>입찰 참여 · 프로필 관리</span></li>'+
      '</ul>'+
    '</div>'+
  '</div></section>';
}

/* ── ② 무엇을 받게 되나 ──────────────────────────────────────────
   업체가 제일 먼저 묻는 것입니다 — "그래서 뭐가 오는데?"
   ⚠️ **지어낸 손님을 만들지 마세요.** 이건 특정 요청이 아니라
   **견적 요청 화면이 받는 칸의 목록**입니다.
   ⚠️ **성함 · 연락처를 여기 넣지 마세요** (제17조). */
function JoinWhat(){
  var f = (window.AM_JOIN_FIELDS || []);
  if(!f.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">무엇을 받게 되나</p>'+
      '<h2>요청은 이런 칸으로 옵니다</h2>'+
      '<p>사장님이 직접 적어 보내신 내용을 그대로 전달합니다. '+
        '받으실지 말지는 업체가 정하십니다.</p>'+
    '</div>'+
    '<div class="jn-req">'+
      '<ul class="jn-req-l">'+ f.map(function(x){
        return '<li><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>';
      }).join("")+'</ul>'+
      /* ⚠️ 이 줄을 지우지 마세요. 없으면 업체가 "등록하면 연락처가
         바로 오는구나" 로 잘못 압니다. */
      '<p class="jn-req-n">'+icon("lock",16)+
        '<span>성함과 연락처는 <b>여기 들어 있지 않습니다.</b> 업체가 '+
        '정해지면 사장님께 어느 업체인지 알려 드리고, 그때 다시 동의를 '+
        '받은 뒤에 전달합니다 (개인정보보호법 제17조).</span></p>'+
    '</div>'+
  '</div></section>';
}

/* ── ③ 왜 여기인가 — 약속 넷 ─────────────────────────────────── */
function JoinWhy(){
  var w = (window.AM_JOIN_WHY || []);
  if(!w.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">약속</p>'+
      '<h2>업체에 이렇게 하겠습니다</h2>'+
      '<p>전부 <a href="/terms">이용약관</a>에 근거가 있는 말입니다. '+
        '약관과 다른 말을 화면에 적지 않습니다.</p>'+
    '</div>'+
    '<ul class="jn-why rv-stg">'+ w.map(function(x){
      return '<li data-rv><span class="jn-why-ic">'+icon(x.icon,22)+'</span>'+
        '<b>'+esc(x.t)+'</b><span class="jn-why-d">'+esc(x.d)+'</span></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

/* ── ④ 어떻게 진행되나 — 셋 ─────────────────────────────────── */
function JoinHow(){
  var st = (window.AM_JOIN_STEPS || []);
  if(!st.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">어떻게 진행되나</p>'+
      '<h2>세 걸음이면 됩니다</h2></div>'+
    '<ol class="how-g">'+ st.map(function(x){
      return '<li class="how-i">'+
        '<span class="how-n">'+esc(x.n)+'</span>'+
        '<b class="how-t">'+esc(x.t)+'</b>'+
        '<span class="how-d">'+esc(x.d)+'</span>'+
      '</li>';
    }).join("")+'</ol>'+
  '</div></section>';
}

/* ── ⑤ 입점 분야 ─────────────────────────────────────────────────
   ⚠️ **123개를 다 늘어놓지 마세요.** 이 화면이 하는 일은 업체를
   설득해 등록시키는 것인데, 칩 벽이 2,000px 이면 신청 폼이 한참
   아래로 밀립니다. 분야마다 여섯까지만 보이고 나머지는 개수로
   냅니다 — 어느 분야든 자기 일이 여기 있다는 것만 알면 됩니다. */
function JoinFields(subs){
  if(!subs.length) return "";
  /* ⚠️⚠️ **접어 둡니다** (2026-10-24). 칩이 128개여서 폰에서
     이 구간 하나가 **3,177px(3.5화면)** 였습니다 — 그만큼 신청
     폼이 아래로 밀립니다. ⚠️ **지우는 것이 아닙니다** — DOM 에
     그대로 있어서 크롤러 본문도 검색도 한 글자 안 바뀝니다.
     ⚠️ 분야 **이름과 지금 몇 곳인지**는 접힌 채로도 보입니다 —
     업체 사장님이 알아야 하는 것은 "내 일이 여기 있나" 까지입니다. */
  return '<section class="sec sec-white" id="join-fields"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">이런 곳을 찾고 있습니다</p>'+
      '<h2>이런 기기가 들어옵니다</h2>'+
      '<p>여기 없는 기종도 적어 주시면 목록에 넣어 드립니다.</p></div>'+
    '<div class="join-g is-fold-chips" id="jn-fields-g">'+subs.map(function(g){
      var show = g.items.slice(0, 6), more = g.items.length - show.length;
      var n = window.amProvidersInCat ? amProvidersInCat(g.cat) : 0;
      return '<div class="join-cat"><b>'+esc(g.cat.name)+
        /* ⚠️ 0 이면 0 이라고 말합니다. 등록되면 저절로 숫자가 됩니다. */
        '<i class="join-n'+(n ? "" : " join-n0")+'">'+
          esc(n ? n + "곳" : "아직 없음")+'</i></b>'+
        '<ul class="chip-g">'+show.map(function(i){
          return '<li><span class="chip chip-flat">'+esc(i.name)+'</span></li>';
        }).join("")+
        (more > 0 ? '<li><span class="chip chip-flat chip-more">외 '+more+'</span></li>' : '')+
        '</ul></div>';
    }).join("")+'</div>'+
    /* ⚠️⚠️ **단추는 하나입니다.** 분야마다 달았더니 열일곱 개가
       제 높이를 먹어 줄어든 만큼을 되돌려 받았습니다 (재 보고 고쳤습니다).
       ⚠️ 접혀도 **분야 이름과 지금 몇 곳인지**는 그대로 보입니다 —
       업체 사장님이 알아야 하는 것은 "내 일이 여기 있나" 까지입니다. */
    '<div class="jn-fold-w">'+
      FoldAll("jn-fields-g", "기종마다 어떤 모델인지 보기", "접기", "is-fold-chips")+
    '</div>'+
  '</div></section>';
}

/* ── ⑥ 업체가 자주 묻는 것 ──────────────────────────────────────
   ⚠️ **FAQPage 구조화 데이터를 달지 마세요.** `/faq` 가 손님용 FAQ 로
   이미 달고 있어서, 여기에 또 달면 같은 유형이 두 주소로 나갑니다. */
function JoinFaq(){
  var f = (window.amJoinFaq ? amJoinFaq() : []);
  if(!f.length) return "";
  return '<section class="sec"><div class="w w-narrow">'+
    '<div class="sec-hd"><p class="eyebrow">업체가 자주 묻는 것</p>'+
      '<h2>먼저 궁금해하시는 것들</h2></div>'+
    /* ⚠️ 아코디언 — `/faq` 와 **같은 `faqToggle`** 을 그대로
       씁니다 (글을 두 벌로 만들면 한쪽만 고치게 됩니다).
       ⚠️⚠️ **질문과 답을 DOM 에서 뺀 것이 아닙니다** — 접기만 합니다.
       ⚠️ 여기에 FAQPage 구조화 데이터를 달지 마세요 (위 주석). */
    '<ul class="faq-l">'+ f.map(function(x, i){
      var id = "jn-faq-" + i;
      return '<li class="faq-i">'+
        '<button class="faq-q" type="button" aria-expanded="false"'+
          ' aria-controls="'+esc(id)+'" onclick="faqToggle(this)">'+
          '<span>'+esc(x.q)+'</span>'+
          '<span class="faq-x" aria-hidden="true">'+icon("chevd",18)+'</span>'+
        '</button>'+
        '<p class="faq-a" id="'+esc(id)+'" hidden>'+esc(x.a)+'</p>'+
      '</li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

/* ── ⑦ 신청 폼 ─────────────────────────────────────────────────── */
function JoinForm(ready){
  return '<section class="sec sec-white" id="join-form"><div class="w form-wrap">'+
    '<h2 class="pg-h2">입점 신청</h2>'+
    (ready ? "" :
      /* ⚠️ **"접수하지 못한다" 는 말을 폼 위에 둡니다.** 다 적고 누른
         뒤에 알리면 바쁜 사장님의 시간을 버리게 하는 짓입니다. */
      '<div class="notice-bad"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
        '<p>접수처 설정이 끝나면 바로 열립니다. 그동안에도 '+
        '<a href="/bid">경쟁입찰</a>과 <a href="/guide">이용 안내</a>는 '+
        '그대로 보실 수 있습니다.</p></div>')+
    '<form id="join-f" onsubmit="return joinSend(event)">'+
      Field("jn-name","업체명","",true,"text","organization")+
      Field("jn-ceo","담당자 성함","",true,"text","name")+
      Field("jn-tel","연락처","010-0000-0000",true,"tel","tel")+
      Field("jn-mail","이메일","",false,"email","email")+
      '<div class="f-r"><label for="jn-svc">하시는 일 <b>*</b></label>'+
        '<input id="jn-svc" required placeholder="예: 아이폰 · 갤럭시 매입, 액정 수리"></div>'+
      '<div class="f-r"><label for="jn-reg">서비스 가능 지역 <b>*</b></label>'+
        RegionSelect("jn-reg","")+'</div>'+
      /* ⚠️ 전에는 업종 고르개(음식점 · 카페 …)였습니다 — 매입업체에게는
         남의 말입니다. 취급 기기를 글로 받습니다. */
      '<div class="f-r"><label for="jn-ind">취급 기기</label>'+
        '<input id="jn-ind" placeholder="예: 아이폰 전 기종, 갤럭시 S 시리즈"></div>'+
      '<div class="f-r"><label for="jn-note">소개 · 경력 · 포트폴리오 주소</label>'+
        '<textarea id="jn-note" rows="5" placeholder="하신 일과 자신 있는 것을 적어 주세요."></textarea></div>'+
      AgreeBox("jn-ag","업체명 · 담당자 성함 · 연락처 · 이메일 · 취급 기기 · 지역",
               "입점 심사와 안내", "입점 종료 후 1년")+
      '<div id="jn-fail"></div>'+
      '<button class="btn btn-b btn-lg btn-full" type="submit"'+(ready?"":" disabled")+'>'+
        '입점 신청하기'+icon("arrow",18)+'</button>'+
    '</form>'+
  '</div></section>';
}

/* 폼 한 줄
   ⚠️ **`autocomplete` 을 꼭 주세요.** 손님이 40~60대 사장님이고 거의 폰
   입니다 — 성함 · 연락처를 매번 손으로 치게 하면 거기서 그만두십니다.
   표준 값을 주면 브라우저가 저장해 둔 것을 한 번에 채워 줍니다.
   ⚠️ 표준에 없는 말을 적으면 **아무 효과가 없습니다** (그냥 무시됩니다) —
   name · tel · email · organization · address-level2 를 씁니다. */
window.Field = function(id, label, ph, req, type, auto){
  return '<div class="f-r"><label for="'+esc(id)+'">'+esc(label)+(req?' <b>*</b>':'')+'</label>'+
    '<input id="'+esc(id)+'" type="'+esc(type||"text")+'"'+(req?" required":"")+
    (auto?' autocomplete="'+esc(auto)+'"':'')+
    (ph?' placeholder="'+esc(ph)+'"':'')+'></div>';
};

/* 동의 상자 — ⚠️ **수집 항목 · 이용 목적 · 보유 기간을 동의를 받는
   자리에서 같이** 보여 줍니다 (개인정보보호법 제15조 제2항).
   방침 링크만 두고 넘어가지 않습니다.
   ⚠️ **업체에 연락처를 넘기는 것은 여기 포함되지 않습니다** (제17조).
   이 문장을 지우지 마세요. */
window.AgreeBox = function(id, what, why, how){
  return '<div class="agree">'+
    '<label class="agree-l"><input type="checkbox" id="'+esc(id)+'">'+
      '<span>개인정보 수집 · 이용에 동의합니다 <b>*</b></span></label>'+
    '<ul class="agree-u">'+
      '<li><b>수집 항목</b> '+esc(what)+'</li>'+
      '<li><b>이용 목적</b> '+esc(why)+'</li>'+
      '<li><b>보유 기간</b> '+esc(how)+'</li>'+
    '</ul>'+
    '<p class="agree-n">업체에 성함 · 연락처를 전달하는 것은 여기에 '+
      '포함되지 않습니다. 업체가 정해지면 <b>어느 업체인지 알려 드리고 '+
      '그때 다시</b> 동의를 받습니다. '+
      '<a href="/privacy">개인정보처리방침</a></p>'+
  '</div>';
};

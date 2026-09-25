/* ════════════════════════════════════════════════════════════════════
   메인 — 지시서 7·33번

   손님이 5초 안에 알아야 하는 것 (지시서 45번):
   "여기는 고깃집이나 정육점 사장이 사업하면서 필요한 걸 물어보고
    해결받는 곳이구나."
   그리고 10초 안에 창업 / 사업진단 / 문제 물어보기 중 하나를 시작할 수
   있어야 합니다.

   ⚠️ **첫 화면에 업체나 카테고리를 나열하지 않습니다** (지시서 3번).
   손님이 먼저 하는 것은 업체 검색이 아니라 "내가 지금 무엇 때문에
   들어왔는가" 를 고르는 것입니다.

   ⚠️ **지시서 33번의 구간 07·08·09(실제 요청 현황 · 사장님 스토리 ·
   연구소)는 실제 데이터가 생길 때까지 화면에 내지 않습니다.**
   업체 수 · 계약 수 · 절감금액 · 성공사례를 지어내면 지시서 43번
   위반이고, 표시·광고의 공정화에 관한 법률 제3조에도 걸립니다.
   데이터가 들어오면 그때 저절로 나타나게 조건만 걸어 둡니다.
   ════════════════════════════════════════════════════════════════════ */

function PageHome(){
  return Hero()+
         Situations()+
         CheckBand()+
         StartBand()+
         QuickProblems()+
         MatchBand()+
         LiveBand()+        /* 실제 요청 현황 — 데이터 있을 때만 */
         StoryBand()+       /* 사장님 스토리 — 실제 사례 있을 때만 */
         LabBand()+         /* 사장님 연구소 — 글 있을 때만 */
         PartnerBand()+
         FinalCTA();
}

/* ── 01 HERO ─────────────────────────────────────────────── */
function Hero(){
  return '<section class="hero">'+
    '<div class="w hero-in">'+
      '<p class="hero-kicker">ABOUTMEAT</p>'+
      '<h1 class="hero-h">고기 장사,<br>뭐가 고민이세요?</h1>'+
      '<p class="hero-p">창업부터 운영 · 원가 · 시설 · 매출 · 확장 · 정리까지<br>'+
        '상황만 말씀해주세요. 해결방법부터 적합한 업체 비교까지 도와드립니다.</p>'+

      /* 중앙 대형 입력창 — 이 화면에서 제일 큰 것이어야 합니다 */
      '<form class="ask" onsubmit="return askGo(event)">'+
        '<label class="sr" for="ask">어떤 문제가 있으신가요</label>'+
        '<textarea id="ask" rows="2" enterkeyhint="go"'+
          ' placeholder="'+esc(WOW_ASK_SAMPLES[0])+'"'+
          ' oninput="askGrow(this)" onkeydown="askKey(event)"></textarea>'+
        '<button class="btn btn-b btn-lg ask-go" type="submit">'+
          '문제 해결하기'+icon("arrow",18)+'</button>'+
      '</form>'+

      '<div class="hero-subs">'+
        '<a class="btn btn-o" href="/check">무료 사업진단</a>'+
        '<a class="btn btn-o" href="/start">창업 준비하기</a>'+
      '</div>'+
    '</div>'+
  '</section>';
}

/* 입력창 예시가 돌아갑니다 — 빈 칸만 보여 주면 사장님은 안 씁니다.
   ⚠️ 손님이 한 글자라도 적으면 멈춥니다. 쓰는 중에 글자가 바뀌면
   깜짝 놀랍니다. */
var ASK_I = 0, ASK_T = null;
function askRotate(){
  clearInterval(ASK_T);
  ASK_T = setInterval(function(){
    var el = $("ask");
    if(!el || el.value || document.activeElement === el) return;
    ASK_I = (ASK_I + 1) % WOW_ASK_SAMPLES.length;
    el.setAttribute("placeholder", WOW_ASK_SAMPLES[ASK_I]);
  }, 3200);
}
window.askGrow = function(el){
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 200) + "px";
};
/* Enter 로 보내고 Shift+Enter 로 줄바꿈 — 폰에서 "이동" 키가 먹습니다 */
window.askKey = function(ev){
  if(ev.key === "Enter" && !ev.shiftKey){ ev.preventDefault(); askGo(ev); }
};
window.askGo = function(ev){
  ev.preventDefault();
  var el = $("ask"), v = el ? String(el.value||"").trim() : "";
  /* 비어 있으면 SOS 화면으로 그냥 보냅니다 — "입력하세요" 라고 혼내지
     않습니다. 거기서 빠른 선택으로 시작할 수 있습니다. */
  go("/sos" + (v ? "?q=" + encodeURIComponent(v) : ""));
  return false;
};

/* ── 02 지금 어떤 상황이세요? ────────────────────────────── */
function Situations(){
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><h2>지금 어떤 상황이세요?</h2>'+
      '<p>하나만 고르시면 거기서부터 같이 봅니다.</p></div>'+
    '<div class="sit-g">'+WOW_SITUATIONS.map(function(s){
      return '<a class="sit" href="'+esc(s.to)+
        (s.ask ? '?q='+encodeURIComponent(s.ask) : '')+'">'+
        '<span class="sit-ic">'+icon(s.icon,24)+'</span>'+
        '<b>'+esc(s.name)+'</b>'+
        '<span class="sit-l">'+esc(s.line)+'</span>'+
        '<span class="sit-d">'+esc(s.desc)+'</span>'+
        '<span class="sit-go">'+icon("arrow",18)+'</span></a>';
    }).join("")+'</div>'+
  '</div></section>';
}

/* ── 03 무료 사업진단 (지시서 8번) ───────────────────────── */
function CheckBand(){
  return '<section class="sec sec-warm"><div class="w band">'+
    '<div class="band-t">'+
      '<p class="eyebrow">무료 사업진단</p>'+
      '<h2>사장님, 지금 제대로 남기고 계신가요?</h2>'+
      '<p class="lead">매출만 높다고 잘되는 가게는 아닙니다. 육류원가 · 인건비 · '+
        '고정비 · 시설 · 마케팅 상태를 8가지 항목으로 간단하게 확인해보세요.</p>'+
      '<a class="btn btn-b btn-lg" href="/check">무료로 진단하기'+icon("arrow",18)+'</a>'+
      '<p class="note">3분이면 끝납니다. 가입하지 않으셔도 됩니다.</p>'+
    '</div>'+
    /* 결과가 어떻게 생겼는지 미리 보여 줍니다.
       ⚠️ 이건 **예시 화면**이라고 글자로 적습니다 — 남의 실제 진단
       결과처럼 읽히면 안 됩니다. */
    '<figure class="band-f">'+
      '<div class="scorecard" aria-hidden="true">'+
        '<div class="sc-hd"><span>사업 건강점수</span><b>78<em>/100</em></b></div>'+
        '<ul class="sc-l">'+
          '<li><span>육류원가</span><b class="st st-bad">점검 필요</b></li>'+
          '<li><span>인건비</span><b class="st st-warn">확인 필요</b></li>'+
          '<li><span>시설</span><b class="st st-ok">양호</b></li>'+
          '<li><span>마케팅</span><b class="st st-warn">개선 가능</b></li>'+
        '</ul>'+
      '</div>'+
      '<figcaption>결과 화면 예시입니다.</figcaption>'+
    '</figure>'+
  '</div></section>';
}

/* ── 04 창업 프로젝트 (지시서 9번) ───────────────────────── */
function StartBand(){
  var items = (window.WOW_STARTUP_STEPS || []).slice(0, 20);
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">창업 프로젝트</p>'+
      '<h2>고깃집 하나 차리는데<br class="br-m">알아볼 게 너무 많으니까.</h2>'+
      '<p>상권부터 오픈준비까지 '+(items.length||20)+'가지를 순서대로 정리해 드립니다.</p></div>'+
    (items.length ? '<ul class="chips chips-lg">'+items.map(function(s){
        return '<li>'+esc(s.name)+'</li>'; }).join("")+'</ul>' : '')+
    '<div class="row-cta">'+
      '<a class="btn btn-b btn-lg" href="/start/cost">내 창업비 알아보기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/start">창업 프로젝트 시작하기</a>'+
    '</div>'+
  '</div></section>';
}

/* ── 05 문제별 빠른 해결 (지시서 11번) ───────────────────── */
function QuickProblems(){
  return '<section class="sec sec-warm"><div class="w">'+
    '<div class="sec-hd"><h2>이런 것들을 물어보십니다</h2>'+
      '<p>고르시면 그 이야기부터 시작합니다. 여기 없는 것도 그냥 적어 주세요.</p></div>'+
    '<div class="prob-g">'+WOW_PROBLEMS.map(function(p){
      return '<a class="prob" href="'+esc(p.to || ("/sos?c="+encodeURIComponent(p.key)))+'">'+
        '<b>'+esc(p.name)+'</b>'+(p.hint ? '<span>'+esc(p.hint)+'</span>' : '')+'</a>';
    }).join("")+'</div>'+
  '</div></section>';
}

/* ── 06 전문업체 3곳 매칭 (지시서 12번) ──────────────────── */
function MatchBand(){
  var steps = [
    ["상황을 적습니다",   "문제나 필요한 것을 그대로 적어 주시면 됩니다."],
    ["우리가 알아봅니다", "무엇이 필요한 일인지 정리하고 조건을 잡습니다."],
    ["세 곳을 찾습니다",  "지역 · 경험 · 예산 · 일정에 맞는 곳만 고릅니다."],
    ["비교하고 고릅니다", "가격 · 일정 · A/S 를 한 화면에서 비교하세요."]
  ];
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">업체 매칭</p>'+
      '<h2>수백 곳을 뒤지지 마세요.<br class="br-m">맞는 곳 세 군데만 보시면 됩니다.</h2>'+
      '<p>업체를 많이 보여드리는 게 목적이 아닙니다. '+
        '사장님 조건에 맞는 곳을 찾아 드리는 게 목적입니다.</p></div>'+
    '<ol class="steps">'+steps.map(function(s,i){
      return '<li><span class="steps-n">'+(i+1)+'</span>'+
        '<b>'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></li>';
    }).join("")+'</ol>'+
  '</div></section>';
}

/* ── 07 실제 요청/해결 현황 ──────────────────────────────
   ⚠️ **실제 데이터가 없으면 이 구간은 아예 나오지 않습니다.**
   "이번 주 요청 128건" 같은 숫자를 지어내면 지시서 43번 위반입니다.
   나중에 WOW_LIVE 에 실제 값이 들어오면 저절로 나타납니다. */
function LiveBand(){
  var live = window.WOW_LIVE;
  if(!live || !live.length) return "";
  return '<section class="sec sec-warm"><div class="w">'+
    '<div class="sec-hd"><h2>지금 들어온 요청</h2></div>'+
    '<div class="live-g">'+live.slice(0,6).map(function(r){
      return '<div class="live"><b>'+esc(r.title)+'</b>'+
        '<span>'+esc([r.region, r.service].filter(Boolean).join(" · "))+'</span></div>';
    }).join("")+'</div>'+
  '</div></section>';
}

/* ── 08 사장님 스토리 (지시서 23번) ──────────────────────
   ⚠️ 실제 사례가 확보되기 전에는 가짜 사례를 표시하지 않습니다. */
function StoryBand(){
  var st = window.WOW_STORIES;
  if(!st || !st.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">사장님 스토리</p>'+
      '<h2>먼저 해보신 분들</h2>'+
      '<a class="sec-more" href="/stories">전체보기'+icon("chev",16)+'</a></div>'+
    '<div class="card-g">'+st.slice(0,3).map(StoryCard).join("")+'</div>'+
  '</div></section>';
}

/* ── 09 사장님 연구소 (지시서 21번) ──────────────────────
   ⚠️ 글이 하나도 없으면 안 나옵니다. 빈 구간을 두면 "만들다 만 사이트"
   로 읽힙니다. */
function LabBand(){
  var posts = window.WOW_POSTS;
  if(!posts || !posts.length) return "";
  return '<section class="sec sec-warm"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">사장님 연구소</p>'+
      '<h2>알고 하면 덜 씁니다</h2>'+
      '<a class="sec-more" href="/lab">전체보기'+icon("chev",16)+'</a></div>'+
    '<div class="card-g">'+posts.slice(0,3).map(PostCard).join("")+'</div>'+
  '</div></section>';
}

/* ── 10 파트너 모집 ──────────────────────────────────────── */
function PartnerBand(){
  return '<section class="sec"><div class="w band band-flip">'+
    '<div class="band-t">'+
      '<p class="eyebrow">파트너 모집</p>'+
      '<h2>고깃집 · 정육점을 아는<br class="br-m">업체를 찾고 있습니다.</h2>'+
      '<p class="lead">광고비를 받고 위에 올려 드리는 곳이 아닙니다. '+
        '조건이 맞는 요청만 골라서 보내 드립니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/partner/apply">파트너 등록하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/partner">어떻게 되나요?</a>'+
      '</div>'+
    '</div>'+
    '<figure class="band-f">'+
      '<ul class="pt-l">'+[
        ["요청을 받습니다",   "조건에 맞는 것만 갑니다. 아무거나 안 보냅니다."],
        ["견적을 냅니다",     "가격 · 일정 · A/S 를 적어 보내시면 됩니다."],
        ["직접 이야기합니다", "고객이 고르면 바로 연결됩니다."]
      ].map(function(x){
        return '<li>'+icon("check",18)+'<b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>';
      }).join("")+'</ul>'+
    '</figure>'+
  '</div></section>';
}

/* ── 11 최종 CTA ─────────────────────────────────────────── */
function FinalCTA(){
  return '<section class="final"><div class="w">'+
    '<h2>사장님은 장사만 하세요.</h2>'+
    '<p>복잡한 건 ABOUTMEAT이 알아보겠습니다.</p>'+
    '<a class="btn btn-w btn-lg" href="/sos">무료로 물어보기'+icon("arrow",18)+'</a>'+
  '</div></section>';
}

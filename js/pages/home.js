/* ════════════════════════════════════════════════════════════════════
   메인 — 지시서 7·33번

   손님이 5초 안에 알아야 하는 것 (지시서 45번):
   "여기는 고깃집이나 정육점 사장이 사업하면서 필요한 걸 물어보고
    해결받는 곳이구나."
   그리고 10초 안에 창업 / 사업진단 / 문제 물어보기 중 하나를 시작할 수
   있어야 합니다.

   ⚠️ **첫 화면에 업체나 카테고리를 나열하지 않습니다** (지시서 3번).
   손님이 먼저 하는 것은 업체 검색이 아니라 "내가 지금 무엇 때문에
   들어왔는가" 를 고르는 것입니다. 그래서 히어로에서 제일 큰 것이
   **입력창**이고, 서비스 카테고리(06)는 화면 한참 아래에 옵니다.

   ⚠️ **구간 09·10·11(실제 요청 현황 · 사장님 스토리 · 연구소)은 실제
   데이터가 생길 때까지 화면에 내지 않습니다.** 업체 수 · 계약 수 ·
   절감금액 · 평점 · 성공사례를 지어내면 지시서 43번 위반이고,
   표시·광고의 공정화에 관한 법률 제3조에도 걸립니다. 데이터가 들어오면
   저절로 나타나게 조건만 걸어 둡니다.

   ⚠️ 사진이 들어갈 자리는 `photoBox()` · `photoBg()` 가 잡습니다
   (js/data/photos.js). 지금은 한 장도 없어서 **빈 액자**로 둡니다 —
   "이미지 준비 중" 같은 자리표시자를 찍지 않습니다.
   ════════════════════════════════════════════════════════════════════ */

function PageHome(){
  /* ⚠️ **상황 고르기를 히어로 바로 밑에 둡니다.** 손님이 제일 먼저
     하는 일은 업체 검색이 아니라 "내가 지금 무엇 때문에 들어왔는가" 를
     고르는 것입니다 (지시서 3번). 입력창에 길게 적기 부담스러운 분은
     여기서 시작합니다 — 그러니 스크롤을 한참 내려야 나오면 안 됩니다.
     ⚠️ 여기에 **업체나 서비스 카테고리를 올리지 마세요.** 그건 전화
     번호부가 됩니다. 올라와도 되는 것은 **손님의 상황**까지입니다. */
  /* ⚠️ **순서가 곧 손님이 하실 순서입니다.**
       상황 고르기 → 고민 고르기 → 어떤 곳인가 → 지금 해 볼 것(진단·
       계산기·창업) → 그다음에 비로소 업체·견적 이야기.
     고민을 아래로 내려 두었더니 상황 카드와 고민 카드 사이에 진단 ·
     계산기 · 창업 · 매칭이 통째로 끼어 있었습니다. 둘은 **같은 질문의
     굵기만 다른 것**이라 붙어 있어야 합니다.
     ⚠️ 업체 카테고리(CatBand)를 위로 올리지 마세요. 첫 화면 가까이에
     업체 목록 차림새가 오면 그 순간 전화번호부입니다 (지시서 3번). */
  return Hero()+
         MobileQuick()+     /* 폰에서만 — 무엇을 할 수 있는 곳인지 한 화면에 */
         SceneCopy()+       /* 장면 하나 — 이 사이트가 무엇을 바꾸는가 */
         Situations()+      /* 굵게 — 다섯 상황 */
         WorryBand()+       /* 가늘게 — 열둘 중 여섯 고민 */
         CheckBand()+
         ToolBand()+        /* 지금 바로 해 볼 수 있는 것 — 우리를 쓸 이유 */
         StartBand()+
         MatchBand()+
         CatBand()+
         DiffBand()+        /* 직접 알아보실 때와 무엇이 다른가 */
         LiveBand()+        /* 실제 요청 현황 — 데이터 있을 때만 */
         StoryBand()+       /* 사장님 스토리 — 실제 사례 있을 때만 */
         LabBand()+         /* 사장님 연구소 — 글 있을 때만 */
         FaqBand()+
         PartnerBand()+
         FinalCTA();
}

/* ── 폰 전용: 빠른 메뉴 ──────────────────────
   폰으로 들어오시면 히어로 다음이 곧장 긴 구간입니다. "여기서 무엇을
   할 수 있는가" 를 알려면 스무 화면을 내려야 했습니다.

   ⚠️ **여기 있는 여덟은 전부 넓은 화면의 메뉴 · 푸터에 이미 있는
   것입니다.** 폰에만 있는 기능을 만든 것이 아니라, 폰에서 **찾기
   어려웠던 것을 앞으로 꺼낸** 것입니다.
   ⚠️ **없는 화면을 넣지 마세요.** 여덟 개 주소가 전부 실제로 열립니다
   (`check.js` 가 링크를 전부 눌러 봅니다).
   ⚠️ 넓은 화면에서는 안 나옵니다 — 거기서는 헤더 메뉴가 같은 일을
   하고, 첫 화면 가까이에 칸을 늘어놓으면 전화번호부가 됩니다. */
function MobileQuick(){
  var items = [
    ["/start",    "seed",  "창업 준비"],
    ["/check",    "gauge", "무료 진단"],
    ["/problems", "bulb",  "고민 해결"],
    ["/partners", "store", "업체 찾기"],
    ["/request",  "doc",   "견적 요청"],
    ["/quotes",   "scale", "견적 비교"],
    ["/tools",    "chart", "계산기"],
    ["/my",       "user",  "내 기록"]
  ];
  return '<section class="mq" aria-label="바로 가기">'+
    '<div class="w"><ul class="mq-g">'+items.map(function(it, i){
      return '<li><a class="mq-i '+tnClass("t"+(i+1))+'" href="'+esc(it[0])+'">'+
        '<span class="mq-ic">'+icon(it[1],22)+'</span>'+
        '<span>'+esc(it[2])+'</span></a></li>';
    }).join("")+'</ul></div></section>';
}

/* ── 폰에서만 접히는 칸 ────────────────────────
   ⚠️ **링크와 기능은 절대 접지 않습니다.** 접는 것은 **설명과 도구
   본체**까지이고, 한 번 누르면 그대로 나옵니다. 폰에서만 안 보이는
   링크를 만들면 그 기능은 폰 손님에게 없는 것과 같습니다.
   ⚠️ `<details>` 를 쓰지 않았습니다. 넓은 화면에서 항상 펼쳐 두려면
   `open` 을 켜 둬야 하는데, 그러면 폰에서도 펼쳐집니다. 여는 것은
   클래스 하나로 합니다 — 넓은 화면에서는 단추가 아예 안 나옵니다. */
function MFold(label, inner){
  return '<div class="m-fold">'+
    '<button type="button" class="m-fold-b" onclick="mFold(this)" aria-expanded="false">'+
      '<span>'+esc(label)+'</span>'+icon("chevd",18)+'</button>'+
    '<div class="m-fold-c">'+inner+'</div>'+
  '</div>';
}
window.mFold = function(btn){
  var box = btn.parentNode; if(!box) return;
  var on = box.classList.toggle("on");
  btn.setAttribute("aria-expanded", on ? "true" : "false");
};

/* ── 01.5 장면 하나 — 히어로와 카드 사이 ───────────────────────
   ⚠️ **히어로 다음에 곧장 카드 그리드를 붙이지 않습니다.** 첫 화면에서
   카드가 바로 이어지면 "또 목록" 으로 읽히고, 이 사이트가 **무엇을
   바꾸는 곳인가**를 말할 자리가 없어집니다. 여기는 광고 영상의 한
   장면처럼 **글자 하나로만** 채웁니다 — 카드도 아이콘도 두지 않습니다.

   ⚠️ **숫자를 적지 마세요** (절대 규칙 1). 이 구간의 힘은 크기와
   여백에서 나옵니다. 실적 숫자를 얹으면 지어낸 값이 되고 장면도 같이
   무너집니다.
   ⚠️ **제목(h1)은 히어로에 하나뿐입니다** — 여기는 `h2` 입니다.
   ⚠️ 아래 두 줄은 스크롤해야 드러납니다(`data-rv`). 물음이 먼저 서고
   답이 뒤에 와야 장면이 됩니다 — 한꺼번에 나오면 그냥 문단입니다.
   ⚠️ `--rvd` 는 인라인이라 `build-pages.js` 의 CSS 변수 검사가 못
   봅니다. CSS 쪽은 반드시 `var(--rvd, 0s)` 로 적습니다. */
function SceneCopy(){
  return '<section class="scene" aria-labelledby="scene-h">'+
    '<span class="scene-glow" aria-hidden="true"></span>'+
    '<div class="w scene-in">'+
      '<h2 class="scene-q" id="scene-h">고기 장사하면서,<br class="br-m"> '+
        '아직도 다 직접 알아보세요?</h2>'+
      '<p class="scene-a" data-rv>이제 <em>한 곳</em>에 물어보세요.</p>'+
      '<p class="scene-bm" data-rv style="--rvd:.14s">ABOUTMEAT</p>'+
    '</div></section>';
}

/* ── 02.5 지금 바로 해 보실 수 있는 것 ───────────────────────
   ⚠️ **이 구간이 "왜 여기를 써야 하는가" 에 답합니다.**
   업체를 연결해 주겠다는 말은 누구나 합니다. 다른 점은 **연결되기
   전에 이미 쓸모가 있다**는 것입니다 — 가입도 상담도 없이, 지금
   이 자리에서 숫자가 나오고 정리가 됩니다.

   ⚠️ 여기 적는 것은 전부 **실제로 되는 것**이어야 합니다. 아직 안
   만든 것을 적어 두면 눌렀을 때 준비 중 화면이 나옵니다. */
function ToolBand(){
  /* ⚠️ **여섯 개가 전부 실제로 되는 것입니다.** 안 만든 것을 "준비중"
     으로 채워 넣지 않았습니다 — 칸을 채우려고 없는 기능을 적으면 그게
     지어낸 화면입니다 (절대 규칙 1·2).
     ⚠️ 새 계산기를 만들면 `TOOL_LIST`(js/pages/tools.js) 한 곳만
     고치세요. 여기는 그걸 그대로 읽습니다.
     ⚠️ 카드에 **무엇을 적으면 무엇이 나오는지**를 작은 화면으로
     보여 줍니다 (§22). 아이콘 하나로는 "계산기가 여섯 개 있다" 까지만
     전해지고, 그 여섯이 내 일과 무슨 상관인지는 안 전해집니다.
     ⚠️ **나오는 값 자리에 숫자를 찍지 마세요.** 적으신 것이 없으니
     `—` 입니다. 그럴듯한 값을 넣으면 그게 지어낸 숫자입니다. */
  var tools = (window.TOOL_LIST || []);
  if(!tools.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">가입 없이, 지금</p>'+
      '<h2>장사, 감으로 하지 마세요.</h2>'+
      '<p>상담을 신청하셔야 뭔가 알려 드리는 곳이 아닙니다. '+
        '아래 여섯은 지금 이 자리에서 바로 되고, 결과는 이 브라우저에 남습니다.</p>'+
      '<a class="sec-more" href="/tools">도구 전부 보기'+icon("chev",16)+'</a></div>'+
    '<div class="tool-g tool-g6 rv-stg">'+tools.map(function(t, i){
      return '<a data-rv class="tool '+tnClass("t"+((i % 8) + 1))+'" href="'+esc(t.to)+'">'+
        '<span class="tool-t"><span class="tool-ic">'+icon(t.icon,24)+'</span>'+
          '<em>'+esc(t.time)+'</em></span>'+
        '<b>'+esc(t.name)+'</b>'+
        '<span class="tool-l">'+esc(t.line)+'</span>'+
        ToolMini(t)+
        '<span class="tool-go"><em>해 보기</em>'+icon("arrow",18)+'</span></a>';
    }).join("")+'</div>'+
  '</div></section>';
}

/* 카드 안의 작은 계산기 — **적는 칸과 나오는 칸**을 그대로 보여 줍니다.
   ⚠️ 값이 없는 도구는 이 칸을 통째로 뺍니다 (절대 규칙 2). 빈 상자를
   두느니 없는 편이 낫습니다. */
function ToolMini(t){
  if(!t.ask || !t.ask.length || !t.out) return "";
  return '<span class="tool-mini" aria-hidden="true">'+
    t.ask.map(function(a){
      return '<span class="tm-r"><i>'+esc(a[0])+'</i><u>'+esc(a[1])+'</u></span>';
    }).join("")+
    '<span class="tm-o"><i>'+esc(t.out)+'</i><b>—</b></span>'+
  '</span>';
}


/* ── 06.5 직접 알아보실 때와 무엇이 다른가 ──────────────────
   ⚠️ **다른 회사를 깎아내리지 않습니다.** 표시·광고의 공정화에 관한
   법률 제3조는 부당하게 비교하는 표시도 금지합니다. 그래서 견주는
   대상은 경쟁사가 아니라 **"사장님이 직접 알아보실 때"** 입니다 —
   그건 사실이고, 실제로 손님이 겪는 일입니다.

   ⚠️ 여기 적는 것은 전부 **우리가 실제로 하는 방식**이어야 합니다.
   지키지 못할 것을 적으면 그 순간 거짓말이 됩니다. */
function DiffBand(){
  var rows = [
    ["업체 찾기",
     "검색하고 전화를 돌려야 합니다. 누가 고깃집을 해 봤는지 알 방법이 없습니다.",
     "고깃집 · 정육점 경험을 확인한 곳에만 요청을 보냅니다. <b>최대 세 곳</b>입니다."],
    ["견적 받기",
     "업체마다 양식이 달라 나란히 놓고 볼 수가 없습니다.",
     "같은 조건으로 요청을 보내고, 받은 견적을 <b>한 화면에서 비교</b>하십니다."],
    ["무엇을 물어볼지",
     "뭘 물어야 하는지 모르는 채로 계약하게 됩니다. 추가금은 그 다음에 옵니다.",
     "서비스마다 <b>물어볼 것</b>을 미리 드립니다. 덕트는 화구 수, 육류는 월 사용량."],
    ["소개 순서",
     "광고비를 낸 곳이 위에 올라옵니다.",
     "<b>광고비를 받고 순서를 바꾸지 않습니다.</b> 조건이 맞는 곳만 보냅니다."],
    ["비용",
     "시간이 듭니다. 잘못 고르면 다시 공사합니다.",
     "물어보시는 것과 업체를 찾아 드리는 것은 <b>무료</b>입니다."]
  ];
  return '<section class="sec sec-tone"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">WHY ABOUTMEAT</p>'+
      '<h2>20번 알아볼 일을<br class="br-m"> <em>한 곳에서.</em></h2>'+
      '<p>업체를 많이 아는 것이 아니라, <b>무엇을 물어봐야 하는지를 아는 것</b>이 '+
        '다른 점입니다.</p></div>'+
    /* ⚠️ 왼쪽은 **지금 사장님이 실제로 하시는 일**이고 오른쪽은
       우리가 하는 일입니다. 여기에 "몇 시간 절약" 같은 숫자를 적지
       마세요 — 재어 본 적이 없습니다 (절대 규칙 1). */
    /* 폰에서는 접습니다 — 링크가 아니라 **설명**입니다. 한 번 누르면
       그대로 나오고, 넓은 화면에서는 늘 펼쳐져 있습니다. */
    MFold('직접 알아보실 때와 뭐가 다른가요', '<div class="wflow">'+
      '<div class="wflow-c wflow-a">'+
        '<b>지금은 이렇게 하십니다</b>'+
        /* ⚠️ 이 일곱 줄은 **흩어져 있다가 제자리로 모입니다**
           (§27). 스크롤해서 보일 때 붙는 `data-rv` 로만 움직이고,
           `prefers-reduced-motion` 이면 처음부터 제자리입니다.
           ⚠️ `--rvd` 는 인라인이 아니라 CSS 의 `:nth-child` 가
           정합니다 — 인라인 변수는 `build-pages.js` 의 CSS 변수
           검사가 못 봅니다. */
        '<ul>'+["네이버 검색","전화 돌리기","업체 찾아 보기","견적서 받기",
                "카톡으로 주고받기","엑셀에 옮겨 적기","다시 검색"].map(function(t){
          return '<li data-rv>'+esc(t)+'</li>'; }).join("")+'</ul>'+
      '</div>'+
      '<div class="wflow-x" aria-hidden="true">'+icon("arrow",26)+'</div>'+
      '<div class="wflow-c wflow-b">'+
        '<b>ABOUTMEAT 에서는</b>'+
        '<ul>'+["상황 입력","확인할 것 · 물어볼 것","전문업체 비교",
                "견적 한 화면에서 관리","해결"].map(function(t){
          return '<li>'+icon("check",15)+'<span>'+esc(t)+'</span></li>'; }).join("")+'</ul>'+
      '</div>'+
    '</div>'+
    '<div class="diff">'+
      '<div class="diff-h"><span></span>'+
        '<span class="diff-a">직접 알아보실 때</span>'+
        '<span class="diff-b">ABOUTMEAT</span></div>'+
      rows.map(function(r){
        /* ⚠️ 글을 <span> 으로 **반드시 감쌉니다.** 이 칸이 grid 라,
           안 감싸면 글 안의 <b> 가 딴 칸으로 튀어 "최대 세 곳" 과
           "입니다." 가 다른 줄에 앉습니다. 실제로 그랬습니다. */
        return '<div class="diff-r">'+
          '<b class="diff-k">'+esc(r[0])+'</b>'+
          '<span class="diff-a"><i aria-hidden="true">'+icon("x",16)+'</i>'+
            '<span>'+r[1]+'</span></span>'+
          '<span class="diff-b"><i aria-hidden="true">'+icon("check",16)+'</i>'+
            '<span>'+r[2]+'</span></span>'+
        '</div>';
      }).join("")+
    '</div>'+
    '<p class="note diff-n">여기 적은 것은 전부 저희가 실제로 하는 방식입니다. '+
      '지키지 못하는 일이 생기면 이 줄부터 고치겠습니다.</p>')+
    /* ⚠️ 장면의 마지막 한 줄 (§28). **여기에 숫자를 붙이지
       마세요** — "n곳 비교" · "n시간 절약" 은 재어 본 적이 없습니다. */
    '<p class="why-end" data-rv>검색하지 말고, <em>ABOUTMEAT</em>에 '+
      '물어보세요.</p>'+
  '</div></section>';
}

/* ── 01 HERO ───────────────────────────────────────────────
   어두운 바탕 위 왼쪽 정렬. 제일 큰 것은 **입력창**입니다.
   ⚠️ 어두운 면은 버건디가 아니라 차콜(--dark)입니다. 여기까지 브랜드
   색으로 칠하면 화면 절반이 버건디가 되어 정육점 간판이 됩니다. */
/* ── 01 히어로 — 사이트 전체에서 가장 중요 (지시서 §6~14) ────
   왼쪽 글, 오른쪽 **사진 × 제품 화면**. 높이는 첫 화면을 꽉 채웁니다.

   ⚠️ 오른쪽은 사진 한 장이 아닙니다. 사진 위에 우리 화면이 떠 있고,
   들어오자마자 **한 번** 움직여서 이 서비스가 무엇을 하는지 보여 줍니다.
   ⚠️ 그 흉내에 쓰는 글은 **예시**입니다. 그래서 카드에 "예시 화면"
   배지를 답니다 (절대 규칙 1 · 지시서 §53). 체크 목록은 지어낸 것이
   아니라 `WOW_STARTUP_STEPS` 의 실제 창업 단계에서 꺼냅니다.
   ⚠️ "AI 가 분석합니다" 라고 쓰지 마세요 — 자동분류를 하지 않습니다
   (절대 규칙 5). 우리가 하는 일은 **꺼내서 정리하는 것**입니다. */
function Hero(){
  return '<section class="hero hero-red">'+
    '<span class="hero-glow hg-1" aria-hidden="true"></span>'+
    '<span class="hero-glow hg-2" aria-hidden="true"></span>'+
    '<div class="w-wide hero-grid">'+
    '<div class="hero-in">'+
      '<p class="hero-kicker">고기 사업자를 위한 비즈니스 플랫폼</p>'+
      '<h1 class="hero-h">고기 장사,<br>뭐가 <em>고민</em>이세요?</h1>'+
      '<p class="hero-p">창업부터 운영 · 원가 · 시설 · 거래처 · 성장까지.<br class="br-m"> '+
        '고기 사업에 필요한 일을 한곳에서 해결하세요.</p>'+

      /* ⚠️ 이 칸은 검색창이 아니라 **이 사이트의 대표 UI** 입니다.
         작게 만들지 마세요 — 첫 화면에서 제일 큰 것이어야 합니다. */
      '<form class="ask" onsubmit="return askGo(event)">'+
        '<label class="sr" for="ask">지금 고민을 적어 주세요</label>'+
        '<textarea id="ask" rows="1" enterkeyhint="go"'+
          ' placeholder="지금 고민을 편하게 말씀해주세요."'+
          ' oninput="askGrow(this)" onkeydown="askKey(event)"></textarea>'+
        '<button class="ask-go" type="submit" aria-label="고민 적고 시작하기">'+
          '<b class="ask-go-t" aria-hidden="true">물어보기</b>'+icon("arrow",24)+'</button>'+
      '</form>'+
      '<p class="ask-eg" id="ask-eg" aria-hidden="true"></p>'+

      '<ul class="ask-chips">'+(window.WOW_ASK_CHIPS||[]).map(function(c,i){
        return '<li><button type="button" onclick="askFill('+i+')">'+
          esc(c.tag)+'</button></li>'; }).join("")+'</ul>'+
    '</div>'+

    '<div class="hero-ui">'+ HeroStage() +'</div>'+
    '</div>'+
  '</section>';
}

/* ── 히어로 오른쪽: 사진 × 제품 화면 (§11~13) ────────────────
   ⚠️ 여기 숫자·업체·후기를 지어내지 마세요. 흉내 화면에 찍히는 글은
   **예시라고 적힌 상황 한 줄**과 **실제 창업 단계 이름**뿐입니다. */
function HeroStage(){
  var steps = (window.WOW_STARTUP_STEPS || []);
  var want  = ["shop", "interior", "duct", "cold", "beef"];
  var pick  = want.map(function(k){
    return steps.filter(function(s){ return s.key === k; })[0]; }).filter(Boolean);
  if(pick.length < 4) pick = steps.slice(0, 5);

  return '<div class="hstage">'+
    (hasPhoto("hero")
      ? '<span class="hstage-ph" aria-hidden="true">'+photoBox("hero", null, true)+'</span>' : '')+

    /* ① 고민 한 줄 */
    '<div class="hcard hcard-q">'+
      '<span class="hcard-m"><em>사장님의 고민</em>'+
        '<i class="hcard-eg">예시 화면</i></span>'+
      '<b>“수원에서 45평 돼지고기집을<br> 준비하고 있어요.”</b>'+
    '</div>'+

    /* ② 우리가 꺼내 드리는 것 — 실제 창업 단계 이름입니다 */
    '<div class="hcard hcard-a">'+
      '<span class="hcard-t">'+
        '<span class="hcard-dot" aria-hidden="true"><i></i><i></i><i></i></span>'+
        '<b>필요한 준비를 꺼냅니다</b></span>'+
      '<ul class="hcard-l">'+pick.slice(0,5).map(function(st,i){
        return '<li style="--d:'+(1.1 + i*0.22)+'s">'+icon("check",15)+
          '<span>'+esc(st.name)+'</span></li>';
      }).join("")+'</ul>'+
      '<a class="hcard-go" href="/start">창업 계획 확인하기'+icon("arrow",16)+'</a>'+
    '</div>'+
  '</div>';
}

/* 적는 칸 **아래**에서 예시가 돌아갑니다 (지시서 §9).
   ⚠️ 예전에는 placeholder 를 갈아 끼웠습니다. 그러면 "무엇을 적는
   칸인가" 가 3초마다 바뀌어서, 정작 칸의 이름이 없어집니다. 칸에는
   한 문장을 고정으로 두고, 예시는 따로 흐르게 합니다.
   ⚠️ 손님이 한 글자라도 적거나 칸에 들어가면 **멈춥니다.** 쓰는 중에
   밑에서 글자가 움직이면 신경이 쓰입니다.
   ⚠️ 읽어 주는 프로그램에는 안 읽힙니다(`aria-hidden`) — 3초마다
   바뀌는 글을 읽어 주면 방해만 됩니다. */
var ASK_I = 0, ASK_T = null;
function askRotate(){
  clearInterval(ASK_T);
  var put = function(){
    var eg = $("ask-eg"), el = $("ask");
    if(!eg) return;
    if(el && (el.value || document.activeElement === el)){ eg.textContent = ""; return; }
    eg.textContent = "예: " + WOW_ASK_SAMPLES[ASK_I];
    eg.classList.remove("on");
    /* 다음 그림틀에서 클래스를 다시 붙여야 전환이 다시 돕니다 */
    requestAnimationFrame(function(){ eg.classList.add("on"); });
  };
  put();
  ASK_T = setInterval(function(){
    var el = $("ask");
    if(el && (el.value || document.activeElement === el)) return;
    ASK_I = (ASK_I + 1) % WOW_ASK_SAMPLES.length;
    put();
  }, 3400);
}
window.askGrow = function(el){
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 180) + "px";
};
/* Enter 로 보내고 Shift+Enter 로 줄바꿈 — 폰에서 "이동" 키가 먹습니다 */
window.askKey = function(ev){
  if(ev.key === "Enter" && !ev.shiftKey){ ev.preventDefault(); askGo(ev); }
};
/* 짧은 단추 — 바로 보내지 않고 **입력창에 채웁니다.** 사장님 사정은
   저 한 줄과 다르기 마련이라, 고칠 기회를 드리는 편이 낫습니다. */
window.askFill = function(i){
  var c = (window.WOW_ASK_CHIPS||[])[i], el = $("ask");
  if(!c || !el) return;
  clearInterval(ASK_T);
  el.value = c.ask; askGrow(el); el.focus();
  try{ el.setSelectionRange(el.value.length, el.value.length); }catch(e){}
};
window.askGo = function(ev){
  ev.preventDefault();
  var el = $("ask"), v = el ? String(el.value||"").trim() : "";
  /* 비어 있으면 SOS 화면으로 그냥 보냅니다 — "입력하세요" 라고 혼내지
     않습니다. 거기서 빠른 선택으로 시작할 수 있습니다. */
  go("/sos" + (v ? "?q=" + encodeURIComponent(v) : ""));
  return false;
};



/* ── 03 지금 어떤 상황이세요? (지시서 5번) ──────────────────
   ⚠️ 사진이 있으면 사진 카드, 없으면 **글 카드**입니다. 빈 액자 다섯
   장을 화면 위쪽에 늘어놓으면 "사진 못 넣은 사이트" 로 읽힙니다
   (js/data/photos.js 의 hasPhoto). */
function Situations(){
  /* ⚠️ **다섯을 똑같이 늘어놓으면 고르는 게 아니라 훑게 됩니다.**
     칸마다 크기·짜임새·색이 다릅니다 (§16 벤토) —
       창업 준비  큰 칸 + 사진 (가로짜임)
       운영 중    중간 칸 + 사진 (가로짜임)
       문제 발생  **넓은 빨강 칸** — 지금 당장 급한 분이 먼저 담을 곳
       사업 확장  사진이 주인공인 칸 (세로짜임)
       사업 정리  한 줄짜리 얇은 칸
     ⚠️ 크기와 짜임새만 다르고 **내용은 다섯이 같습니다.** 큰 칸에만
     있는 정보를 만들지 마세요 — 좁은 화면에서는 다섯이 같은 모양이
     되고, 그때 그 정보가 통째로 사라집니다.
     ⚠️ **DOM 순서와 보이는 순서가 같아야 합니다.** 격자 자리를 손으로
     정할 때 순서를 뒤섞으면 키보드로 넘기는 분과 읽어 주는 프로그램이
     화면과 다른 차례로 듣습니다.
     ⚠️ 이모지를 쓰지 않습니다 (지시서 §6). 아이콘은 선으로만. */
  var CELL = ["sb-a","sb-b","sb-c","sb-d","sb-e"];
  /* 면 색 — 나란히 선 칸끼리 같은 색이 되지 않게 합니다 */
  var TINT = ["sit-v1","sit-v2","","sit-v3","sit-v4"];
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">상황 고르기</p>'+
      '<h2>지금 어떤 상황이세요?</h2>'+
      '<p>사장님의 상황에 맞는 해결방법부터 찾아드립니다.</p></div>'+
    '<div class="sit-g rv-stg">'+WOW_SITUATIONS.map(function(s, i){
      /* 빨강 칸과 한 줄 칸에는 사진을 깔지 않습니다 — 색 위에 그림을
         또 얹으면 흐릿한 덩어리가 됩니다 (히어로에서 겪었습니다) */
      var noPh = (i === 2 || i === 4);
      var ph = !noPh && hasPhoto("sit-"+s.key);
      return '<a data-rv class="sit '+tnClass(s.tone)+(ph?'':' sit-flat')+
        (i < 2 ? ' sit-lg' : '')+(i === 2 ? ' sit-dark' : '')+' '+CELL[i]+' '+TINT[i]+
        '" href="'+esc(s.to)+
        (s.ask ? '?q='+encodeURIComponent(s.ask) : '')+'">'+
        (ph ? '<span class="sit-ph">'+photoBox("sit-"+s.key)+
              '<span class="sit-ic">'+icon(s.icon,22)+'</span></span>' : '')+
        '<span class="sit-b">'+
          (ph ? '' : '<span class="sit-ic">'+icon(s.icon,22)+'</span>')+
          '<b>'+esc(s.name)+'</b>'+
          (s.tag ? '<span class="sit-tag">'+esc(s.tag)+'</span>' : '')+
          '<span class="sit-l">'+esc(s.line)+'</span>'+
          '<span class="sit-d">'+esc(s.desc)+'</span>'+
          '<span class="sit-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
        '</span></a>';
    }).join("")+'</div>'+
  '</div></section>';
}


/* ── 04 무료 사업진단 (지시서 8번) ─────────────────────────
   ⚠️ 여기 보이는 숫자는 **손님이 방금 적은 숫자로 계산한 것**입니다.
   가짜 점수판(78/100)을 보여 주다가 실제 진단처럼 읽히느니, 사장님
   본인의 원가율을 그 자리에서 계산해 드리는 편이 정직하고 쓸모도
   있습니다. 나누기 한 번이라 틀릴 일이 없습니다.

   ⚠️ **"몇 %면 좋다/나쁘다" 고 단정하지 않습니다.** 업종·부위·지역에
   따라 다르고, 우리에게 그 기준을 뒷받침할 데이터가 없습니다.
   그래서 상태색(--ok/--warn/--bad)도 쓰지 않습니다. */
function CheckBand(){
  /* ⚠️ **이 구간은 설명이 아니라 제품 화면입니다** (§18~21).
     왼쪽은 말 한 줄과 버튼까지, 오른쪽 큰 칸은 실제로 돌아가는
     계기판입니다 — "이런 걸 해 드립니다" 라고 쓰는 것보다 **지금
     자리에서 숫자가 나오는 것**이 훨씬 빠릅니다.
     ⚠️ **미리 찍힌 숫자를 두지 마세요.** 아무것도 안 적으셨으면 세
     칸은 `—` 입니다. 예시값을 채워 두면 그게 지어낸 숫자이고,
     사장님이 그대로 두고 넘어가면 우리가 지어낸 것이 됩니다.
     ⚠️ 여기는 **흉내 화면이 아닙니다.** 실제로 계산하는 칸이라
     "예시 화면" 배지를 달지 않습니다 — 달면 진짜를 가짜라고 하는
     것이 됩니다. 배지는 히어로의 흉내 화면에만 있습니다. */
  return '<section class="sec sec-white"><div class="w scan">'+
    '<div class="scan-t">'+
      '<p class="eyebrow">무료 사업진단</p>'+
      '<h2>사장님,<br class="br-m"> 진짜 얼마 남으세요?</h2>'+
      '<p class="lead">매출이 높아도 비용이 새고 있으면 실제로 남는 돈은 '+
        '달라집니다. 네 칸만 적으시면 지금 비율이 바로 나옵니다.</p>'+
      '<a class="btn btn-b btn-lg" href="/check">'+
        '무료 사업진단 시작하기'+icon("arrow",18)+'</a>'+
      '<p class="note">회원가입 없이 3분이면 됩니다. 여덟 가지를 고르시면 '+
        '무엇이 비어 있는지 정리해 드립니다.</p>'+
    '</div>'+

    /* 폰에서는 이 판을 접어 둡니다 — 읽는 구간이 아니라 **도구**라
       한 번 누르고 쓰시면 되고, 펼친 채로 두면 구간 하나가 화면 두
       개를 먹습니다. 넓은 화면에서는 늘 펼쳐져 있습니다. */
    MFold('내 가게 숫자 넣어보기', '<div class="ckb-c scan-ui">'+
      '<div class="scan-bar"><b>내 가게 숫자</b>'+
        '<span>이 브라우저에서만 계산합니다</span></div>'+

      /* ① 적는 줄 — ⚠️ **묻고 안 쓰는 칸을 만들지 마세요.** 네 칸은
         전부 아래 비율에 실제로 쓰입니다. */
      '<div class="scan-in">'+
      [["cc-sales","월 매출","예: 7,000"],
       ["cc-meat","그중 육류 매입비","예: 2,400"],
       ["cc-labor","인건비 (월 합계)","예: 1,300"],
       ["cc-rent","임대료 (월)","예: 450"]].map(function(f){
        return '<div class="calc-f">'+
          '<label for="'+f[0]+'">'+esc(f[1])+'</label>'+
          '<span class="calc-in"><input id="'+f[0]+'" type="text" inputmode="numeric"'+
            ' placeholder="'+esc(f[2])+'" oninput="costCalc()" autocomplete="off">'+
            '<em>만원</em></span></div>';
      }).join("")+
      '</div>'+

      /* ② 나눈 결과 — 크게. ⚠️ **"몇 %면 좋다" 고 단정하지
         않습니다.** 업종·평수·부위 구성마다 달라서 그 기준을 뒷받침할
         데이터가 우리에게 없습니다. 상태색도 여기에는 쓰지 않습니다. */
      '<div id="cc-out" class="scan-out">'+CostRows(null,null,null)+'</div>'+
      '<p class="note scan-n">좋다 나쁘다를 매기지 않습니다. 업종 · 평수 · '+
        '부위 구성마다 기준이 달라서, 그 기준값이 우리에게 없기 때문입니다. '+
        '적으신 숫자는 이 브라우저 밖으로 나가지 않습니다.</p>'+

      /* ③ 이 브라우저에 남아 있는 진단 결과 */
      '<div class="ckb-r scan-r" id="ckb-r">'+CheckScore()+'</div>'+
    '</div>')+
  '</div></section>';
}

/* 적으신 숫자를 나눈 세 비율.
   ⚠️ **안 적으신 칸은 `—` 입니다.** 0 으로 치거나 평균값으로 메우면
   그 순간 지어낸 숫자가 됩니다 (절대 규칙 1). */
function CostRows(meatPct, laborPct, rentPct){
  var rows = [
    ["육류 원가율", meatPct,  "월 매출과 육류 매입비를 적으시면 나옵니다"],
    ["인건비율",    laborPct, "월 매출과 인건비를 적으시면 나옵니다"],
    ["임대료 비율", rentPct,  "월 매출과 임대료를 적으시면 나옵니다"]
  ];
  return '<ul class="ccr">'+rows.map(function(r){
    var on = (r[1] !== null && isFinite(r[1]));
    return '<li class="ccr-i'+(on?' on':'')+'">'+
      '<span class="ccr-k">'+esc(r[0])+'</span>'+
      '<span class="ccr-v">'+(on ? esc(r[1].toFixed(1))+'<em>%</em>' : '—')+'</span>'+
      (on ? '<span class="ccr-bar"><i style="width:'+
              Math.max(2, Math.min(100, r[1])).toFixed(1)+'%"></i></span>'
          : '<span class="ccr-h">'+esc(r[2])+'</span>')+
    '</li>';
  }).join("")+'</ul>';
}


/* 이 브라우저에 진단 결과가 있으면 그것을, 없으면 무엇을 하는 곳인지 */
function CheckScore(){
  var last = (typeof chkLast === "function") ? chkLast() : null;
  if(!last){
    return '<h3>우리 가게 진단 결과</h3>'+
      '<div class="ring ring-empty">'+HomeRing(null)+'</div>'+
      '<p class="ckb-r-p">아직 진단을 안 하셨습니다. 여덟 가지를 고르시면 '+
        '<b>무엇을 파악하고 계시고 무엇이 비어 있는지</b>가 여기 남습니다.</p>'+
      '<a class="btn btn-o btn-full" href="/check">진단 시작하기'+icon("arrow",16)+'</a>';
  }
  var band = wowCheckBand(last.score);
  var weak = (last.weak || []).map(function(k){
    var it = WOW_CHECK.filter(function(x){ return x.key === k; })[0];
    return it ? it.name : null; }).filter(Boolean);
  var strong = WOW_CHECK.filter(function(it){
    return (last.weak || []).indexOf(it.key) < 0; }).map(function(it){ return it.name; });
  return '<h3>우리 가게 진단 결과</h3>'+
    '<div class="ring ring-'+esc(band.tone)+'">'+HomeRing(last.score)+'</div>'+
    '<ul class="ckb-r-l">'+
      strong.slice(0,3).map(function(n){
        return '<li><i class="dot dot-ok"></i>'+esc(n)+'</li>'; }).join("")+
      weak.slice(0,3).map(function(n){
        return '<li><i class="dot dot-bad"></i>'+esc(n)+'</li>'; }).join("")+
    '</ul>'+
    '<p class="ckb-r-p">'+esc(band.line || "")+'</p>'+
    '<a class="btn btn-b btn-full" href="/check">결과 다시 보기'+icon("arrow",16)+'</a>';
}

/* 점수 고리 — 진단 결과 화면과 같은 모양입니다.
   ⚠️ 이름이 `ScoreRing` 이었는데 **js/pages/check.js 에 같은 이름이
   이미 있었습니다.** 그 파일이 나중에 로드되어 이쪽을 덮어썼고, 메인이
   통째로 안 그려졌습니다(TypeError). 전역 함수는 파일이 달라도 이름이
   하나뿐입니다 — 메인 전용 함수는 `Home*` 을 붙입니다. */
function HomeRing(score){
  var R = 52, C = 2 * Math.PI * R;
  var p = (score == null) ? 0 : Math.max(0, Math.min(100, score));
  return '<svg viewBox="0 0 128 128" aria-hidden="true">'+
      '<circle class="ring-t" cx="64" cy="64" r="'+R+'"/>'+
      '<circle class="ring-v" cx="64" cy="64" r="'+R+'"'+
        ' stroke-dasharray="'+C.toFixed(1)+'"'+
        ' stroke-dashoffset="'+(C*(1-p/100)).toFixed(1)+'"/>'+
    '</svg>'+
    '<div class="ring-n">'+
      (score == null ? '<b>—</b><em>아직 없음</em>'
                     : '<b>'+score+'</b><em>/ 100</em>')+
    '</div>';
}



/* 쉼표가 섞여 들어와도 읽습니다 — 사장님은 "7,000" 이라고 칩니다 */
function calcNum(id){
  var el = $(id); if(!el) return 0;
  var n = parseFloat(String(el.value||"").replace(/[^0-9.]/g,""));
  return isFinite(n) ? n : 0;
}
window.costCalc = function(){
  var out = $("cc-out"); if(!out) return;
  var sales = calcNum("cc-sales");
  var pct = function(v){ return (sales > 0 && v > 0) ? (v / sales * 100) : null; };
  /* ⚠️ 매입이 매출보다 커도 그대로 보여 줍니다 — 실제로 그런 달이
     있고, 그게 바로 알려야 할 값입니다. 우리가 깎지 않습니다. */
  out.innerHTML = CostRows(pct(calcNum("cc-meat")),
                           pct(calcNum("cc-labor")),
                           pct(calcNum("cc-rent")));
};





/* ── 05 창업 프로젝트 (지시서 9번) ─────────────────────────
   20단계를 다 늘어놓으면 숨이 막히므로, **다섯 마디**로 묶어 보여 주고
   전체는 /start 에서 봅니다.
   ⚠️ 예전에는 차콜 띠였습니다. 화면 한가운데에 어두운 덩어리가 있으면
   그 위아래가 다 눌려 보여서, 옅은 브랜드색 띠(.sec-tone)로 바꿨습니다.
   어두운 면은 **맨 끝 CTA 한 군데**만 남깁니다. */
/* ── 창업 프로젝트 (§10) ─────────────────────────────────────
   ⚠️ **대시보드처럼 보이되, 숫자는 전부 사장님 것입니다.**
   시안에는 "수원 · 45평 · 돼지고기 전문점 · 진행률 37%" 가 미리
   찍혀 있었습니다. 넣지 않았습니다 — 아무것도 안 하신 분에게 보여
   주면 그게 지어낸 화면입니다 (절대 규칙 1).
   아직 시작 전이면 **0 / 20 그대로** 보여 주고, 체크를 하신 분에게는
   이 브라우저에 남아 있는 **본인 진행 상태**를 그대로 냅니다. */
function StartBand(){
  var steps  = (window.WOW_STARTUP_STEPS || []);
  var phases = (window.WOW_STARTUP_PHASES || []);
  var done   = (typeof stLoad === "function") ? stLoad() : {};
  var got    = steps.filter(function(s){ return done[s.key]; }).length;
  var pct    = steps.length ? Math.round(got / steps.length * 100) : 0;

  return '<section class="sec sec-white"><div class="w stb">'+
    '<div class="stb-t">'+
      '<p class="eyebrow">창업 프로젝트</p>'+
      '<h2>고깃집 하나 차리는 데<br class="br-m"> 알아볼 게 너무 많으니까.</h2>'+
      '<p class="lead">상권부터 오픈까지 <b>'+(steps.length||20)+'가지</b>를 순서대로 '+
        '정리해 드립니다. 지금 어디쯤인지, 다음에 뭘 해야 하는지가 한 화면에 '+
        '보입니다. 체크한 것은 이 브라우저에 남습니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/start">'+
          (got ? '이어서 하기' : '내 창업 프로젝트 시작하기')+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/start/cost">창업비 정리표</a>'+
      '</div>'+
    '</div>'+

    /* 오른쪽 — 진행 상태판 */
    '<div class="stb-d">'+
      '<div class="stb-h">'+
        '<span class="stb-h-t"><b>고깃집 창업 프로젝트</b>'+
          '<span>'+(got ? esc(got)+' / '+esc(steps.length)+'단계 하셨습니다'
                        : '아직 시작 전입니다') +'</span></span>'+
        '<span class="stb-pct'+(got?'':' off')+'">'+esc(pct)+'<em>%</em></span>'+
      '</div>'+
      '<span class="stb-bar"><i style="width:'+Math.max(pct,1)+'%"></i></span>'+
      '<ul class="stb-l">'+phases.map(function(ph){
        var mine = ph.steps.map(function(k){
          return steps.filter(function(s){ return s.key === k; })[0]; }).filter(Boolean);
        var n = mine.filter(function(s){ return done[s.key]; }).length;
        var state = !n ? "off" : (n === mine.length ? "on" : "half");
        return '<li class="stb-r stb-'+state+'">'+
          '<span class="stb-ic">'+icon(state === "on" ? "check"
            : (state === "half" ? "clock" : "chevd"), 16)+'</span>'+
          '<span class="stb-b"><b>'+esc(ph.name)+'</b>'+
            '<span>'+mine.map(function(s){ return esc(s.name); }).join(" · ")+'</span></span>'+
          '<span class="stb-n">'+esc(n)+'/'+esc(mine.length)+'</span></li>';
      }).join("")+'</ul>'+
      '<p class="note stb-note">'+(got
        ? '이 브라우저에 남아 있는 사장님 진행 상태입니다.'
        : '체크를 시작하시면 여기가 채워집니다. 미리 찍어 둔 숫자가 아닙니다.')+'</p>'+
    '</div>'+
  '</div></section>';
}


/* ── 06 전문업체 3곳 매칭 (지시서 12번) ─────────────────────
   ⚠️ 여기에 **업체 카드를 놓지 마세요.** 등록된 파트너가 아직 없고,
   이름·평점을 지어내면 지시서 43번 위반입니다. 실제 파트너가 생기면
   그때 붙입니다 — 지금은 "어떻게 되는지" 만 설명합니다. */
function MatchBand(){
  var steps = [
    ["상황 입력", "edit",
     "문제나 필요한 것을 그대로 적어 주시면 됩니다. 양식이 없어도 됩니다."],
    ["조건 확인", "search",
     "무엇이 필요한 일인지 정리하고 지역 · 예산 · 일정 조건을 잡습니다."],
    ["전문업체 비교", "scale",
     "조건에 맞는 곳에만 요청이 갑니다. 가격 · 일정 · A/S 를 한 화면에서."]
  ];
  /* ⚠️ **화면을 가득 채우는 딥 버건디 구간은 여기 하나뿐입니다.**
     브랜드색을 넓게 쓰는 자리가 둘이 되면 그때부터 정육점 간판입니다.
     ⚠️ **업체 수 · 계약 수를 적지 마세요** (절대 규칙 1). 등록된
     파트너가 0 곳입니다. 여기서 셀 수 있는 것은 **차례**뿐입니다.
     ⚠️ 01 → 02 → 03 은 순위가 아니라 **하시는 차례**입니다. */
  return '<section class="mband">'+
    '<span class="mband-glow" aria-hidden="true"></span>'+
    '<div class="w mband-in">'+
      '<p class="mband-k">업체 매칭</p>'+
      '<h2>업체 찾느라<br class="br-m"> 전화 돌리지 마세요.</h2>'+
      '<p class="mband-p">필요한 조건만 알려주시면 고기 사업 경험이 있는 '+
        '전문업체를 비교해 드립니다.</p>'+
      '<ol class="mstep h-sc">'+steps.map(function(st,i){
        return '<li>'+
          (i ? '<span class="mstep-ar" aria-hidden="true">'+icon("arrow",20)+'</span>' : '')+
          '<span class="mstep-n">STEP '+("0"+(i+1))+'</span>'+
          '<span class="mstep-ic">'+icon(st[1],22)+'</span>'+
          '<b>'+esc(st[0])+'</b>'+
          '<span class="mstep-d">'+esc(st[2])+'</span>'+
        '</li>';
      }).join("")+'</ol>'+
      '<div class="mband-cta">'+
        '<a class="btn btn-w btn-lg" href="/request">무료 견적받기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-gh btn-lg" href="/partners">어떤 업체가 필요한지 고르기</a>'+
      '</div>'+
    '</div>'+
  '</section>';
}


/* ── 07 고기 장사에 필요한 모든 것 (지시서 25번) ────────────
   ⚠️ **첫 화면이 아니라 여기**입니다 (지시서 3번). 들어오자마자
   카테고리를 늘어놓으면 전화번호부가 됩니다. 손님이 "내 상황" 을
   먼저 고른 다음에 보여 주는 지도입니다. */
/* ── 서비스 분류 여섯 (§13) ──────────────────────────────────
   ⚠️ **업체 이름을 여기에 만들지 마세요.** 이 화면은 "무엇이 필요한지"
   를 고르는 자리이지 업체 명단이 아닙니다 — 명단이 되는 순간 지시서
   3번이 금지한 전화번호부입니다.
   ⚠️ 하위 서비스는 `js/data/services.js` 에서 그대로 옵니다. 여기에
   손으로 적어 두면 데이터가 늘 때마다 어긋납니다. */
function CatBand(){
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">서비스 분류</p>'+
      '<h2>잘하는 업체, 직접 찾지 마세요.</h2>'+
      '<p>고기부터 덕트 · 장비 · 세무까지. 어디에 물어야 할지 모를 때 '+
        '여기서 시작하시면 됩니다.</p>'+
      '<a class="sec-more" href="/partners">전문업체 찾기'+icon("chev",16)+'</a></div>'+
    '<div class="cat-g cat-g6 rv-stg h-sc">'+WOW_SERVICE_GROUPS.map(function(g){
      var ph = hasPhoto("cat-"+g.key);
      var items = g.items.slice(0, 5);
      return '<div data-rv class="catc '+tnClass(g.tone)+'">'+
        (ph ? '<a class="catc-ph" href="/partners?g='+encodeURIComponent(g.key)+'"'+
              ' aria-label="'+esc(g.name)+' 업체 찾기">'+photoBox("cat-"+g.key)+'</a>' : '')+
        '<div class="catc-b">'+
          '<a class="catc-t" href="/partners?g='+encodeURIComponent(g.key)+'">'+
            '<span class="catc-ic">'+icon(g.icon||"chev",22)+'</span>'+
            '<span class="catc-n"><b>'+esc(g.name)+'</b>'+
              '<span>'+esc(g.lead||"")+'</span></span>'+
            '<span class="catc-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
          '</a>'+
          '<ul class="catc-l">'+items.map(function(it){
            return '<li><a href="/request?s='+encodeURIComponent(it.key)+'">'+
              esc(it.name)+'</a></li>'; }).join("")+
            (g.items.length > items.length
              ? '<li class="catc-more">외 '+(g.items.length - items.length)+'가지</li>' : '')+
          '</ul>'+
        '</div></div>';
    }).join("")+'</div>'+
  '</div></section>';
}


/* ── 고민 목록 (§7) ──────────────────────────────────────────
   ⚠️ **"실시간 인기" · "많이 묻는" 이라고 쓰지 않습니다.** 접수를
   저장하는 곳이 없어서 몇 번 물어보셨는지를 셀 방법이 자체가 없습니다
   (절대 규칙 1). 조회수도 같은 이유로 안 찍습니다.
   ⚠️ 01~06 번호는 **순위가 아니라 차례**입니다. 목록을 훑기 쉽게
   하려고 붙인 것이고, 화면에도 "순위" 라는 말이 없습니다.
   ⚠️ 줄에 적히는 질문은 가이드의 `ask0` — **사장님이 실제로 쓰시는
   말투**로 적어 둔 것입니다. 지어낸 문장이 아닙니다. */
function WorryBand(){
  var six = (window.WOW_GUIDES||[]).slice(0, 6);
  if(!six.length) return "";
  return '<section class="sec sec-tone"><div class="w wrk">'+
    '<div class="wrk-t">'+
      '<p class="eyebrow">고민 해결</p>'+
      '<h2>업체를 부르기 전에<br class="br-m"> 확인할 것</h2>'+
      '<p class="lead">고민을 고르시면 <b>지금 직접 보실 것</b>과 '+
        '<b>업체에 물어보실 것</b>을 먼저 알려 드립니다. 여기 없는 것도 '+
        '그냥 적어 주세요.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-o" href="/problems">고민별 해결방법 전부 보기'+
          icon("arrow",18)+'</a>'+
      '</div>'+
    '</div>'+
    '<ol class="wrk-l">'+six.map(function(g,i){
      return '<li><a href="/problem/'+encodeURIComponent(g.key)+'">'+
        '<span class="wrk-n">'+("0"+(i+1))+'</span>'+
        '<span class="wrk-b"><b>'+esc(g.ask0)+'</b>'+
          '<span>'+esc(g.h1)+'</span></span>'+
        '<span class="wrk-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
      '</a></li>';
    }).join("")+'</ol>'+
  '</div></section>';
}


/* ── 09 실제 요청/해결 현황 ────────────────────────────────
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

/* ── 10 사장님 스토리 (지시서 23번) ────────────────────────
   ⚠️ 실제 사례가 확보되기 전에는 가짜 사례를 표시하지 않습니다.
   "총 창업비 1억 1,800만원 · 준비기간 103일" 같은 숫자는 그 사장님이
   실제로 알려 주신 것이 아니면 적을 수 없습니다. */
function StoryBand(){
  var st = window.WOW_STORIES;
  if(!st || !st.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">사장님 스토리</p>'+
      '<h2>다른 사장님들은 이렇게 시작했습니다</h2>'+
      '<a class="sec-more" href="/stories">전체보기'+icon("chev",16)+'</a></div>'+
    '<div class="card-g">'+st.slice(0,3).map(StoryCard).join("")+'</div>'+
  '</div></section>';
}

/* ── 11 사장님 연구소 (지시서 21번) ────────────────────────
   ⚠️ 글이 하나도 없으면 안 나옵니다. 빈 구간을 두면 "만들다 만 사이트"
   로 읽힙니다. */
/* ── 사장님 연구소 (§16) — 에디토리얼 ────────────────────────
   ⚠️ 블로그 그리드처럼 같은 카드 넷을 늘어놓지 않습니다. 한 편을
   크게 내고 나머지는 줄로 둡니다 — 무엇부터 읽어야 할지가 보입니다.
   ⚠️ 글이 없으면 **구간째 안 나옵니다** (절대 규칙 2). */
function LabBand(){
  var posts = window.WOW_POSTS;
  if(!posts || !posts.length) return "";
  var want = ["meat-cost-rate", "duct-smell-complaint", "startup-cost-missing",
              "open-permits", "labor-cost"];
  var pick = want.map(function(sl){ return wowPost(sl); }).filter(Boolean);
  posts.forEach(function(p){ if(pick.length < 5 && pick.indexOf(p) < 0) pick.push(p); });

  var lead = pick[0], rest = pick.slice(1, 5);
  var lc = (typeof wowPostCat === "function") ? wowPostCat(lead.cat) : null;

  return '<section class="sec sec-warm"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">사장님 연구소</p>'+
      '<h2>알고 하면 덜 씁니다</h2>'+
      '<p>고기 장사를 하면서 실제로 막히는 것들을 정리했습니다. '+
        '읽고 나서 <b>바로 할 수 있는 것</b>까지 적었습니다.</p>'+
      '<a class="sec-more" href="/lab">글 '+posts.length+'편 전부 보기'+icon("chev",16)+'</a></div>'+
    '<div class="edi">'+
      '<a class="edi-f '+tnClass(lc && lc.tone)+'" href="/lab/'+esc(lead.slug)+'">'+
        '<span class="edi-f-ph">'+photoBox(postThumb(lead))+'</span>'+
        '<span class="edi-f-b">'+
          '<span class="edi-m"><em>'+esc(wowPostCatName(lead.cat)||"")+'</em>'+
            '<span>'+(lead.read ? esc(lead.read)+'분이면 읽습니다' : '')+'</span></span>'+
          '<b>'+esc(lead.title)+'</b>'+
          '<span class="edi-l">'+esc(lead.lead)+'</span>'+
          '<span class="edi-go">읽어 보기'+icon("arrow",16)+'</span>'+
        '</span></a>'+
      '<ul class="edi-l-list h-sc">'+rest.map(function(p, i){
        var c = (typeof wowPostCat === "function") ? wowPostCat(p.cat) : null;
        return '<li><a class="'+tnClass(c && c.tone)+'" href="/lab/'+esc(p.slug)+'">'+
          '<span class="edi-n">'+("0"+(i+2))+'</span>'+
          '<span class="edi-b"><b>'+esc(p.title)+'</b>'+
            '<span>'+esc(wowPostCatName(p.cat)||"")+
              (p.read ? ' · '+esc(p.read)+'분' : '')+'</span></span>'+
          '<span class="edi-arw" aria-hidden="true">'+icon("arrow",16)+'</span>'+
        '</a></li>';
      }).join("")+'</ul>'+
    '</div>'+
  '</div></section>';
}


/* ── 11.5 자주 묻는 것 ─────────────────────────────────────
   ⚠️ **"평균 ○일 안에" · "○곳이 이용" 같은 숫자를 넣지 마세요.**
   여기 적는 것은 전부 지금 지킬 수 있는 말이어야 합니다. 답을 모르는
   질문은 넣지 말고, 넣었으면 모른다고 적으세요. */
function FaqBand(){
  var qs = window.WOW_FAQ || [];
  if(!qs.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">자주 묻는 것</p>'+
      '<h2>물어보기 전에 궁금하신 것</h2></div>'+
    '<div class="faq">'+qs.map(function(q, i){
      /* <details> 는 JS 없이도 열립니다 — 스크립트가 늦게 떠도 읽힙니다 */
      return '<details class="faq-i"'+(i === 0 ? ' open' : '')+'>'+
        '<summary><span class="faq-ic">'+icon(q.icon || "info",18)+'</span>'+
          '<b>'+esc(q.q)+'</b>'+
          '<span class="faq-x" aria-hidden="true">'+icon("chevd",18)+'</span></summary>'+
        '<p>'+esc(q.a)+'</p></details>';
    }).join("")+'</div>'+
  '</div></section>';
}

/* ── 12 파트너 모집 ──────────────────────────────────────────
   ⚠️ 사진이 없으면 **빈 액자를 세우지 않고** 한 칸으로 둡니다. */
function PartnerBand(){
  var ph = hasPhoto("partner");
  var how = [
    ["광고 노출이 아닙니다", "돈을 낸 곳이 위에 올라가지 않습니다."],
    ["실제 요청만 갑니다",   "지역 · 서비스 · 규모가 맞는 것만 보냅니다."],
    ["직접 이야기합니다",    "고객이 고르면 바로 연결됩니다."]
  ];
  return '<section class="sec sec-tint"><div class="w'+(ph?' band band-flip':' pt-one')+'">'+
    '<div class="band-t">'+
      '<p class="eyebrow">파트너 모집</p>'+
      '<h2>새로운 고객을<br class="br-m"> 찾고 계신가요?</h2>'+
      /* ⚠️ 여기에 **"월 n건의 요청" · "등록 업체 n곳"** 을 적지 마세요.
         지금 그 값이 하나도 없습니다 (절대 규칙 1). 적을 수 있는 것은
         **우리가 어떻게 하겠다는 약속**까지입니다. */
      '<p class="lead">ABOUTMEAT 에는 지금 서비스를 필요로 하는 '+
        '<b>고깃집 · 정육점 사업자</b>가 찾아옵니다. 광고비를 받고 위에 '+
        '올려 드리는 곳이 아니라, 조건이 맞는 요청만 골라서 보내 드립니다.</p>'+
      '<ul class="pt-l'+(ph?'':' pt-l-row')+'">'+how.map(function(x){
        return '<li>'+icon("check",18)+'<b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>';
      }).join("")+'</ul>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/partner/apply">파트너 무료 등록'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/partner">어떻게 되나요?</a>'+
      '</div>'+
    '</div>'+
    (ph ? '<figure class="band-f">'+photoBox("partner","ph-tall")+'</figure>' : '')+
  '</div></section>';
}

/* ── 13 최종 CTA ───────────────────────────────────────────── */
function FinalCTA(){
  return '<section class="final">'+
    photoBg("final")+
    '<div class="hero-sh"></div>'+
    '<div class="w final-in">'+
      '<h2>사장님은<br class="br-m"> 장사만 하세요.</h2>'+
      '<p>창업부터 운영까지, 복잡한 일은 ABOUTMEAT이 함께 해결하겠습니다.</p>'+
      '<div class="row-cta row-mid">'+
        '<a class="btn btn-w btn-lg" href="/sos">지금 고민 무료로 물어보기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-gh btn-lg" href="/check">무료 사업진단</a>'+
      '</div>'+
    '</div>'+
  '</section>';
}


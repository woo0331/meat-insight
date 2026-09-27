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
     고치세요. 여기는 그걸 그대로 읽습니다. */
  var tools = (window.TOOL_LIST || []);
  if(!tools.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">가입 없이, 지금</p>'+
      '<h2>연결해 드리기 전에<br class="br-m"> 먼저 쓸모가 있어야 한다고 봅니다.</h2>'+
      '<p>상담을 신청하셔야 뭔가 알려 드리는 곳이 아닙니다. '+
        '아래 여섯은 지금 이 자리에서 바로 되고, 결과는 이 브라우저에 남습니다.</p>'+
      '<a class="sec-more" href="/tools">도구 전부 보기'+icon("chev",16)+'</a></div>'+
    '<div class="tool-g tool-g6">'+tools.map(function(t, i){
      return '<a class="tool '+tnClass("t"+((i % 8) + 1))+'" href="'+esc(t.to)+'">'+
        '<span class="tool-t"><span class="tool-ic">'+icon(t.icon,24)+'</span>'+
          '<em>'+esc(t.time)+'</em></span>'+
        '<b>'+esc(t.name)+'</b>'+
        '<span class="tool-l">'+esc(t.line)+'</span>'+
        '<span class="tool-go"><em>해 보기</em>'+icon("arrow",18)+'</span></a>';
    }).join("")+'</div>'+
  '</div></section>';
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
    '<div class="wflow">'+
      '<div class="wflow-c wflow-a">'+
        '<b>지금은 이렇게 하십니다</b>'+
        '<ul>'+["네이버 검색","전화 돌리기","업체 찾아 보기","견적서 받기",
                "카톡으로 주고받기","엑셀에 옮겨 적기","다시 검색"].map(function(t){
          return '<li>'+esc(t)+'</li>'; }).join("")+'</ul>'+
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
      '지키지 못하는 일이 생기면 이 줄부터 고치겠습니다.</p>'+
  '</div></section>';
}

/* ── 01 HERO ───────────────────────────────────────────────
   어두운 바탕 위 왼쪽 정렬. 제일 큰 것은 **입력창**입니다.
   ⚠️ 어두운 면은 버건디가 아니라 차콜(--dark)입니다. 여기까지 브랜드
   색으로 칠하면 화면 절반이 버건디가 되어 정육점 간판이 됩니다. */
/* ── 01 히어로 ───────────────────────────────────────────────
   ⚠️ **밝은 두 칸입니다.** 왼쪽 글 · 오른쪽 우리 화면.
   ⚠️ 오른쪽에 두는 것은 사진 한 장이 아니라 **사진 위에 겹친 우리
   제품 화면**입니다. 이 사이트가 전화번호부와 다른 이유는 "업체를
   대 준다" 가 아니라 "업체를 부르기 전에 무엇부터 가려야 하는지 안다"
   인데, 그건 말로는 증명이 안 됩니다.
   ⚠️ 여기에 **꾸민 숫자를 넣지 마세요.** 겹쳐 놓은 화면의 글은 전부
   `js/data/guides.js` 의 실제 문장입니다 (절대 규칙 1). */
function Hero(){
  return '<section class="hero hero-lt2">'+
    '<span class="hero-blob hb-1" aria-hidden="true"></span>'+
    '<span class="hero-blob hb-2" aria-hidden="true"></span>'+
    '<div class="w hero-grid">'+
    '<div class="hero-in">'+
      '<p class="hero-kicker">고기 사업자를 위한 비즈니스 플랫폼</p>'+
      '<h1 class="hero-h">고기 장사,<br>뭐가 <em>고민</em>이세요?</h1>'+
      '<p class="hero-p">창업부터 운영 · 원가 · 시설 · 거래처 · 성장까지.<br class="br-m"> '+
        '필요한 해결책과 전문업체를 한곳에서 찾아보세요.</p>'+

      '<form class="ask" onsubmit="return askGo(event)">'+
        '<label class="sr" for="ask">어떤 문제가 있으신가요</label>'+
        '<span class="ask-ic" aria-hidden="true">'+icon("search",20)+'</span>'+
        '<textarea id="ask" rows="1" enterkeyhint="go"'+
          ' placeholder="'+esc(WOW_ASK_SAMPLES[0])+'"'+
          ' oninput="askGrow(this)" onkeydown="askKey(event)"></textarea>'+
        '<button class="ask-go" type="submit" aria-label="문제 적고 시작하기">'+
          '<b class="ask-go-t" aria-hidden="true">물어보기</b>'+icon("arrow",22)+'</button>'+
      '</form>'+

      '<ul class="ask-chips">'+(window.WOW_ASK_CHIPS||[]).map(function(c,i){
        return '<li><button type="button" onclick="askFill('+i+')">'+
          esc(c.tag)+'</button></li>'; }).join("")+'</ul>'+
    '</div>'+

    '<div class="hero-ui">'+ HeroStage() +'</div>'+
    '</div>'+
  '</section>'+ TrustBar();
}

/* ── 히어로 오른쪽: 사진 위에 겹친 우리 화면 ────────────────
   ⚠️ 사진은 아직 **그림(SVG)** 입니다. 실제 고깃집 · 정육 작업 사진이
   생기면 `js/data/photos.js` 의 경로만 바꾸면 그대로 사진이 됩니다 —
   짜임새는 이미 사진을 전제로 짜 두었습니다.
   ⚠️ 겹친 카드의 글은 전부 `wowGuide("cost")` 에서 그대로 옵니다. */
function HeroStage(){
  var g = (window.wowGuide ? wowGuide("cost") : null);
  var ph = hasPhoto("hero");
  if(!g) return ph ? '<div class="hstage"><span class="hstage-ph">'+
    photoBox("hero")+'</span></div>' : "";

  /* 무엇 때문인지 가르는 세 가지 — 가이드의 `causes` 제목 그대로 */
  var rows = (g.causes||[]).slice(0,3).map(function(c,i){
    return '<span class="hsf-i"><i aria-hidden="true">'+(i+1)+'</i>'+
      '<em>'+esc(c.t)+'</em></span>';
  }).join("");

  return '<div class="hstage">'+
    (ph ? '<span class="hstage-ph" aria-hidden="true">'+photoBox("hero")+'</span>' : '')+
    /* 위에 겹치는 카드 — 고민 → 가릴 것 → 해결방법 */
    '<a class="hsf" href="/problem/'+encodeURIComponent(g.key)+'">'+
      '<span class="hsf-q">'+
        '<b>사장님의 고민</b>'+
        '<em>“'+esc(g.ask0)+'”</em>'+
      '</span>'+
      '<span class="hsf-arw" aria-hidden="true">'+icon("chevd",18)+'</span>'+
      '<span class="hsf-b">'+
        '<b>먼저 무엇 때문인지 가릅니다</b>'+
        '<span class="hsf-l">'+rows+'</span>'+
      '</span>'+
      '<span class="hsf-go">해결방법 보기'+icon("arrow",16)+'</span>'+
    '</a>'+
  '</div>';
}

/* ── 히어로 아래 신뢰 줄 ─────────────────────────────────────
   ⚠️ 시안에는 여기에 "3,200+ 사장님 · 만족도 98%" 가 있었습니다.
   **넣지 않았습니다.** 그 값이 하나도 없고, 없는 숫자를 적는 것은
   절대 규칙 1 위반이자 표시광고법 제3조(거짓·과장 광고)입니다.
   ⚠️ 여기 적힌 넷은 전부 **지금 지킬 수 있는 말**입니다. 시간을
   약속하는 말("24시간 응답")도 넣지 마세요 — 약관 제8조가 회신 시점을
   보장하지 않는다고 적고 있습니다. */
function TrustBar(){
  var rows = [
    ["won",   "상담료 없음",   "물어보시는 것도 업체를 찾아 드리는 것도 무료입니다"],
    ["scale", "조건 비교",     "받은 견적을 포함 범위까지 같이 놓고 견줍니다"],
    ["knife", "고기 사업 전문", "고깃집 · 정육점에서 실제로 나오는 고민만 다룹니다"],
    ["badge", "전문업체 연결",  "조건이 맞는 곳만, 목록을 뿌리지 않고 골라서 보냅니다"]
  ];
  return '<section class="tbar"><div class="w tbar-in">'+rows.map(function(r){
    return '<div class="tbar-i"><span class="tbar-ic">'+icon(r[0],20)+'</span>'+
      '<span class="tbar-t"><b>'+esc(r[1])+'</b><span>'+esc(r[2])+'</span></span></div>';
  }).join("")+'</div></section>';
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
     앞의 둘은 크게(가로짜임), 가운데 "문제 발생" 은 **어두운 강조
     카드**로 냅니다 — 지금 당장 급한 분이 제일 먼저 눈에 담아야 할
     칸이기 때문입니다.
     ⚠️ 크기와 색만 다르고 **내용은 다섯이 같습니다.** 큰 칸에만 있는
     정보를 만들지 마세요 — 좁은 화면에서는 다섯이 같은 모양이 됩니다.
     ⚠️ 이모지를 쓰지 않습니다 (지시서 §6). 아이콘은 선으로만. */
  var TINT = ["sit-v1","sit-v2","sit-dark","sit-v3","sit-v4"];
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">상황 고르기</p>'+
      '<h2>지금 어떤 상황이세요?</h2>'+
      '<p>사장님의 상황에 맞는 해결방법부터 찾아드립니다.</p></div>'+
    '<div class="sit-g">'+WOW_SITUATIONS.map(function(s, i){
      var dark = (i === 2);
      /* 어두운 강조 카드에는 사진을 깔지 않습니다 — 그림 위에 어두운
         겹을 또 얹으면 흐릿한 덩어리가 됩니다 (히어로에서 겪었습니다) */
      var ph = !dark && hasPhoto("sit-"+s.key);
      return '<a class="sit '+tnClass(s.tone)+(ph?'':' sit-flat')+
        (i < 2 ? ' sit-lg' : '')+' '+TINT[i]+'" href="'+esc(s.to)+
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
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">무료 사업진단</p>'+
      '<h2>사장님, 지금 장사<br class="br-m"> 제대로 남기고 계신가요?</h2>'+
      '<p>매출이 높아도 비용이 새고 있다면 실제로 남는 돈은 달라집니다. '+
        '네 칸만 적으시면 지금 비율이 바로 나옵니다.</p></div>'+
    '<div class="ckb">'+
    /* ① 왼쪽 — 사장님 숫자를 적는 칸
       ⚠️ **묻고 안 쓰는 칸을 만들지 마세요.** 네 칸은 전부 오른쪽
       비율에 실제로 쓰입니다. 직원 수만 묻고 아무것도 계산하지 않으면
       사장님 시간을 버리게 하는 짓입니다. */
    '<div class="ckb-c">'+
      '<h3>내 가게 간단 입력</h3>'+
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
      '<p class="note">적으신 숫자는 이 브라우저 밖으로 나가지 않습니다.</p>'+
    '</div>'+

    /* ② 가운데 — 적으신 것을 나눈 결과.
       ⚠️ **"몇 %면 좋다" 고 단정하지 않습니다.** 업종·평수·부위 구성
       마다 달라서 그 기준을 뒷받침할 데이터가 우리에게 없습니다.
       그래서 상태색(--ok/--warn/--bad)도 여기에는 쓰지 않습니다. */
    '<div class="ckb-c ckb-num">'+
      '<h3>지금 우리 가게 비율</h3>'+
      '<div id="cc-out">'+CostRows(null,null,null)+'</div>'+
      '<p class="note">좋다 나쁘다를 매기지 않습니다. 업종 · 평수 · 부위 '+
        '구성마다 기준이 달라서, 그 기준값이 우리에게 없기 때문입니다.</p>'+
    '</div>'+

    /* ③ 오른쪽 — 진단 결과.
       ⚠️ 아무것도 안 하신 분에게 점수를 미리 찍어 두지 마세요. 그게
       지어낸 숫자이고, "양호/개선가능" 은 우리에게 없는 기준값이
       있어야 하는 판정입니다 (절대 규칙 1). */
    '<div class="ckb-r" id="ckb-r">'+CheckScore()+'</div>'+
    '</div>'+

    '<a class="btn btn-b btn-lg ckb-cta" href="/check">'+
      '무료 사업진단 시작하기'+icon("arrow",18)+'</a>'+
    '<p class="note ckb-cta-n">회원가입 없이 3분이면 됩니다. '+
      '여덟 가지를 고르시면 무엇이 비어 있는지 정리해 드립니다.</p>'+
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
  return '<section class="mband">'+
    '<div class="w mband-in">'+
    '<div class="mband-t">'+
      '<p class="mband-k">업체 매칭</p>'+
      '<h2>업체 찾느라<br class="br-m"> 전화 돌리지 마세요.</h2>'+
      '<p class="mband-p">필요한 조건만 알려주시면 '+
        '고기 사업 경험이 있는 전문업체를 비교해드립니다.</p>'+
      '<div class="mband-cta">'+
        '<a class="btn btn-w btn-lg" href="/request">무료 견적받기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-gh btn-lg" href="/partners">어떤 업체가 필요한지 고르기</a>'+
      '</div>'+
    '</div>'+
    '<ol class="mstep">'+steps.map(function(st,i){
      return '<li><span class="mstep-n">STEP '+("0"+(i+1))+'</span>'+
        '<span class="mstep-ic">'+icon(st[1],20)+'</span>'+
        '<b>'+esc(st[0])+'</b><span class="mstep-d">'+esc(st[2])+'</span></li>';
    }).join("")+'</ol>'+
  '</div></section>';
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
      '<h2>고기 장사에 필요한 모든 것</h2>'+
      '<p>고기부터 덕트 · 장비 · 세무까지. 어디에 물어야 할지 모를 때 '+
        '여기서 시작하시면 됩니다.</p>'+
      '<a class="sec-more" href="/partners">전문업체 찾기'+icon("chev",16)+'</a></div>'+
    '<div class="cat-g cat-g6">'+WOW_SERVICE_GROUPS.map(function(g){
      var ph = hasPhoto("cat-"+g.key);
      var items = g.items.slice(0, 5);
      return '<div class="catc '+tnClass(g.tone)+'">'+
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
      '<ul class="edi-l-list">'+rest.map(function(p, i){
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


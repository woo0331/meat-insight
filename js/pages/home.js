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
  return Hero()+
         Situations()+
         HowRow()+
         ToolBand()+        /* 지금 바로 해 볼 수 있는 것 — 우리를 쓸 이유 */
         CheckBand()+
         BrandBand()+     /* 시안의 빨간 띠 — 버건디를 면으로 쓰는 유일한 자리 */
         StartBand()+
         MatchBand()+
         DiffBand()+        /* 직접 알아보실 때와 무엇이 다른가 */
         CatBand()+
         WorryBand()+
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
  var tools = [
    { to:"/check", icon:"gauge", tag:"3분",
      name:"무료 사업진단",
      line:"8가지로 <b>지금 무엇을 모르고 계신지</b>를 정리해 드립니다. "+
           "매출과 육류 매입비를 적으시면 원가율도 그 자리에서 계산됩니다.",
      cta:"진단해 보기" },
    { to:"/tools/yield", icon:"knife", tag:"1분",
      name:"수율 원가 계산",
      line:"매입 단가는 <b>원육</b> 기준인데 파는 것은 <b>손질 후 정육</b>입니다. "+
           "손질 전후 무게만 적으시면 실제 1kg 원가와 1인분 원가가 나옵니다.",
      cta:"계산해 보기" },
    { to:"/tools/bep", icon:"target", tag:"2분",
      name:"손익분기 계산",
      line:"고정비와 매출 대비 비율을 적으시면 <b>한 달에 얼마를 팔아야 본전인지</b>, "+
           "하루로 나누면 얼마인지가 나옵니다.",
      cta:"계산해 보기" }
  ];
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">가입 없이, 지금</p>'+
      '<h2>연결해 드리기 전에<br class="br-m"> 먼저 쓸모가 있어야 한다고 봅니다.</h2>'+
      '<p>상담을 신청하셔야 뭔가 알려 드리는 곳이 아닙니다. '+
        '아래 셋은 지금 이 자리에서 바로 되고, 결과는 이 브라우저에 남습니다.</p></div>'+
    '<div class="tool-g">'+tools.map(function(t){
      return '<a class="tool" href="'+esc(t.to)+'">'+
        '<span class="tool-t"><span class="tool-ic">'+icon(t.icon,24)+'</span>'+
          '<em>'+esc(t.tag)+'</em></span>'+
        '<b>'+esc(t.name)+'</b>'+
        '<span class="tool-l">'+t.line+'</span>'+
        '<span class="tool-go">'+esc(t.cta)+icon("arrow",18)+'</span></a>';
    }).join("")+'</div>'+
    /* ⚠️ 나머지 둘(창업비 정리표 · 견적 비교)도 실제로 되는 것입니다.
       카드를 다섯 개로 늘리면 첫 화면이 늘어져서, 문 하나로 모읍니다. */
    '<p class="tool-more">창업비 정리표와 견적 비교까지 다섯 가지가 있습니다.'+
      '<a class="btn btn-o" href="/tools">도구 전부 보기'+icon("arrow",18)+'</a></p>'+
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
  return '<section class="sec sec-warm"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">무엇이 다른가</p>'+
      '<h2>혼자 알아보시면<br class="br-m"> 여기서 시간이 갑니다.</h2>'+
      '<p>업체를 많이 아는 것이 아니라, <b>무엇을 물어봐야 하는지를 아는 것</b>이 '+
        '다른 점입니다.</p></div>'+
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
function Hero(){
  return '<section class="hero hero-dk">'+
    photoBg("hero-wide")+'<div class="hero-sh"></div>'+
    '<div class="w hero-grid">'+
    '<div class="hero-in">'+
      '<p class="hero-kicker">사장님은 장사만 하세요.</p>'+
      '<h1 class="hero-h">고기 장사,<br>뭐가 <em>고민</em>이세요?</h1>'+
      '<p class="hero-p">창업 · 원가 · 시설 · 매출 · 확장 · 정리까지.<br class="br-m"> '+
        '상황만 적어 주시면 해결방법부터 맞는 업체까지 찾아 드립니다.</p>'+

      '<form class="ask" onsubmit="return askGo(event)">'+
        '<label class="sr" for="ask">어떤 문제가 있으신가요</label>'+
        '<span class="ask-ic" aria-hidden="true">'+icon("search",20)+'</span>'+
        '<textarea id="ask" rows="1" enterkeyhint="go"'+
          ' placeholder="'+esc(WOW_ASK_SAMPLES[0])+'"'+
          ' oninput="askGrow(this)" onkeydown="askKey(event)"></textarea>'+
        /* 좁은 화면에서는 단추가 한 줄을 다 차지합니다. 동그란 화살표만
           있으면 무엇을 하는 단추인지 모르니 그때만 글자를 보여 줍니다. */
        '<button class="ask-go" type="submit" aria-label="문제 적고 시작하기">'+
          '<b class="ask-go-t" aria-hidden="true">물어보기</b>'+icon("arrow",22)+'</button>'+
      '</form>'+

      /* 짧은 단추 — 입력창을 대신하는 게 아니라 **채워 주는** 것입니다 */
      '<ul class="ask-chips">'+(window.WOW_ASK_CHIPS||[]).map(function(c,i){
        return '<li><button type="button" onclick="askFill('+i+')">'+
          esc(c.tag)+'</button></li>'; }).join("")+'</ul>'+

      /* ── 히어로 아래 네 칸 ──────────────────────────────
         ⚠️ 시안에는 여기에 "3,200+ 사장님 · 1,500+ 검증된 업체 ·
         만족도 98% · 24시간 응답" 이 있었습니다. **넣지 않았습니다.**
         지금 그 값이 하나도 없고, 없는 숫자를 적는 것은 지시서 43번
         위반이자 표시광고법 제3조(거짓·과장 광고)에 걸립니다.
         ⚠️ 대신 **지금 지킬 수 있는 약속**을 같은 자리에 같은 모양으로
         둡니다. 실제 값이 생기면 이 네 칸의 내용만 바꾸면 됩니다.
         ⚠️ "24시간 응답" 처럼 **시간을 약속하는 말도 넣지 마세요** —
         약관 제8조가 회신 시점을 보장하지 않는다고 적고 있습니다. */
      '<ul class="hero-facts">'+
        [["상담료","받지 않습니다"],
         ["회원가입","하지 않으셔도 됩니다"],
         ["업체","조건 맞는 곳만 최대 3곳"],
         ["견적","나란히 놓고 비교"]].map(function(x){
          return '<li><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>';
        }).join("")+'</ul>'+
    '</div>'+
    /* ⚠️ 시안의 오른쪽 떠 있는 카드입니다. 바탕이 어두워졌으므로
       그림 카드가 아니라 **흰 카드**가 와야 눈에 들어옵니다. */
    '<aside class="hero-card">'+
      '<a href="/check">'+
        '<span class="hc-ic">'+icon("gauge",22)+'</span>'+
        '<span class="hc-t"><em>지금, 무료로</em><b>사업진단 받아보세요</b></span>'+
        '<span class="hc-p">육류원가·인건비·고정비까지 여덟 가지로, '+
          '지금 무엇을 모르고 계신지 정리해 드립니다.</span>'+
        '<span class="hc-go">3분이면 끝납니다'+icon("arrow",16)+'</span>'+
      '</a>'+
    '</aside>'+
    '<div class="hero-art">'+
      '<span aria-hidden="true">'+photoBox("hero")+'</span>'+
      /* 그림 가장자리에 붙는 작은 알약 셋 — 꾸밈이자 **바로 가는 길**입니다.
         ⚠️ 여기에 실적·금액·후기를 적지 마세요. 값이 없습니다. 적을 수
         있는 것은 **우리가 실제로 견적을 받아 드리는 일**까지입니다. */
      '<ul class="hero-tags">'+
        [["duct","fire","덕트 · 환기"],
         ["cold","snow","냉장 · 냉동"],
         ["beef-supply","truck","육류 공급"]].map(function(t,i){
          return '<li class="ht-'+(i+1)+'">'+
            '<a href="/request?s='+encodeURIComponent(t[0])+'">'+
              icon(t[1],17)+'<span>'+esc(t[2])+'</span></a></li>';
        }).join("")+'</ul>'+
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

/* ── 02 어떻게 되는 곳인가 ─────────────────────────────────
   ⚠️ 여기에 **숫자를 넣지 마세요.** "3,200+ 사장님" · "1,500+ 업체" ·
   "만족도 98%" 는 지금 이 서비스에 실제 값이 없습니다. 없는 숫자를
   적으면 지시서 43번 위반이고 표시광고법 제3조(거짓·과장 광고)에도
   걸립니다. 그래서 이 줄은 **숫자가 아니라 약속**만 적습니다 —
   전부 지금 지킬 수 있는 말들입니다. */
function HowRow(){
  var rows = [
    ["won",   "물어보는 건 무료",     "상담료를 받지 않습니다."],
    ["user",  "가입하지 않아도 됩니다", "연락받을 곳만 적어 주시면 됩니다."],
    ["shield","맞는 곳 세 군데만",     "목록을 뿌리지 않고 골라서 보여 드립니다."]
  ];
  return '<section class="how"><div class="w how-in">'+rows.map(function(r){
    return '<div class="how-i"><span class="how-ic">'+icon(r[0],22)+'</span>'+
      '<b>'+esc(r[1])+'</b><span>'+esc(r[2])+'</span></div>';
  }).join("")+'</div></section>';
}

/* ── 03 지금 어떤 상황이세요? (지시서 5번) ──────────────────
   ⚠️ 사진이 있으면 사진 카드, 없으면 **글 카드**입니다. 빈 액자 다섯
   장을 화면 위쪽에 늘어놓으면 "사진 못 넣은 사이트" 로 읽힙니다
   (js/data/photos.js 의 hasPhoto). */
function Situations(){
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><h2>지금 어떤 상황이세요?</h2>'+
      '<p>사장님의 상황에 맞는 해결방법부터 찾아드립니다.</p></div>'+
    '<div class="sit-g">'+WOW_SITUATIONS.map(function(s){
      var ph = hasPhoto("sit-"+s.key);
      return '<a class="sit'+(ph?'':' sit-flat')+'" href="'+esc(s.to)+
        (s.ask ? '?q='+encodeURIComponent(s.ask) : '')+'">'+
        (ph ? '<span class="sit-ph">'+photoBox("sit-"+s.key)+
              '<span class="sit-ic">'+icon(s.icon,22)+'</span></span>' : '')+
        '<span class="sit-b">'+
          (ph ? '' : '<span class="sit-ic">'+icon(s.icon,22)+'</span>')+
          '<b>'+esc(s.name)+'</b>'+
          (s.tag ? '<span class="sit-tag">'+esc(s.tag)+'</span>' : '')+
          '<span class="sit-l">'+esc(s.line)+'</span>'+
          '<span class="sit-d">'+esc(s.desc)+'</span>'+
          /* 시안의 동그란 화살표. ⚠️ 카드 전체가 이미 링크라 이건
             **버튼이 아니라 표시**입니다 — 안에 또 링크를 넣지 마세요. */
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
  return '<section class="sec sec-warm"><div class="w ckb">'+
    /* ① 왼쪽 — 왜 해야 하는가 */
    '<div class="ckb-t">'+
      '<p class="eyebrow">무료 사업진단</p>'+
      '<h2>사장님, 지금 장사<br class="br-m"> 제대로 남기고 계신가요?</h2>'+
      '<p class="lead">매출이 높아도 비용이 새고 있다면 실제로 남는 돈은 '+
        '달라집니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/check">무료로 사업진단 하기'+icon("arrow",18)+'</a>'+
      '</div>'+
      '<p class="note">회원가입 없이 3분이면 됩니다.</p>'+
    '</div>'+

    /* ② 가운데 — 두 칸만 적으면 원가율이 나옵니다.
       ⚠️ 시안에는 "직원 수" 칸도 있었지만 뺐습니다. 직원 수만으로는
       **아무것도 계산할 수 없습니다** — 묻고 안 쓰면 사장님 시간을
       버리게 하는 짓입니다. 인건비는 진단 8항목에서 묻습니다. */
    '<div class="ckb-c">'+
      '<h3>내 가게 간단 입력</h3>'+
      '<div class="calc-f">'+
        '<label for="cc-sales">월 매출</label>'+
        '<span class="calc-in"><input id="cc-sales" type="text" inputmode="numeric"'+
          ' placeholder="7,000" oninput="costCalc()" autocomplete="off">'+
          '<em>만원</em></span>'+
      '</div>'+
      '<div class="calc-f">'+
        '<label for="cc-meat">그중 육류 매입비</label>'+
        '<span class="calc-in"><input id="cc-meat" type="text" inputmode="numeric"'+
          ' placeholder="2,400" oninput="costCalc()" autocomplete="off">'+
          '<em>만원</em></span>'+
      '</div>'+
      '<div class="calc-out" id="cc-out">'+CostGauge(null)+'</div>'+
    '</div>'+

    /* ③ 오른쪽 — 진단 결과.
       ⚠️ 시안에는 "78 / 100 · 양호 · 개선가능" 이 미리 찍혀 있었습니다.
       **넣지 않았습니다.** 아무것도 안 하신 분에게 점수를 보여 주면 그게
       지어낸 숫자이고, "양호/개선가능" 은 업종·평수별 기준값이 있어야
       하는 판정인데 우리에게 그 기준이 없습니다 (절대 규칙 1).
       대신 **진단을 마치신 분에게는 본인 점수를 그대로** 보여 줍니다 —
       이 브라우저에 남아 있는 값이라 지어낼 여지가 없습니다. */
    '<div class="ckb-r" id="ckb-r">'+CheckScore()+'</div>'+
  '</div></section>';
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

/* 동그란 눈금. pct 가 null 이면 빈 눈금과 안내만 보여 줍니다. */
function CostGauge(pct){
  var R = 52, C = 2 * Math.PI * R;
  var p = (pct == null) ? 0 : Math.max(0, Math.min(100, pct));
  var off = C * (1 - p / 100);
  return '<svg class="gauge" viewBox="0 0 128 128" aria-hidden="true">'+
      '<circle class="gauge-t" cx="64" cy="64" r="'+R+'"/>'+
      '<circle class="gauge-v" cx="64" cy="64" r="'+R+'"'+
        ' stroke-dasharray="'+C.toFixed(1)+'"'+
        ' stroke-dashoffset="'+off.toFixed(1)+'"/>'+
    '</svg>'+
    '<div class="gauge-n">'+
      (pct == null
        ? '<b class="gauge-none">—</b><span>두 칸을 적어 주세요</span>'
        : '<b>'+pct.toFixed(1)+'<em>%</em></b><span>육류원가율</span>')+
    '</div>'+
    '<p class="gauge-p">'+
      (pct == null
        ? '적으신 숫자는 이 브라우저 밖으로 나가지 않습니다.'
        : '이 숫자가 높은지 낮은지는 업종 · 부위 · 지역에 따라 다릅니다. '+
          '인건비 · 고정비까지 8가지로 같이 보시려면 무료 사업진단을 해 보세요.')+
    '</p>';
}

/* 쉼표가 섞여 들어와도 읽습니다 — 사장님은 "7,000" 이라고 칩니다 */
function calcNum(id){
  var el = $(id); if(!el) return 0;
  var n = parseFloat(String(el.value||"").replace(/[^0-9.]/g,""));
  return isFinite(n) ? n : 0;
}
window.costCalc = function(){
  var out = $("cc-out"); if(!out) return;
  var sales = calcNum("cc-sales"), meat = calcNum("cc-meat");
  /* 매출이 0 이면 나눌 수 없습니다. 매입이 매출보다 커도 그대로
     보여 줍니다 — 실제로 그런 달이 있고, 그게 바로 알려야 할 값입니다. */
  out.innerHTML = (sales > 0 && meat > 0) ? CostGauge(meat / sales * 100)
                                          : CostGauge(null);
};

/* ── 04.5 브랜드 띠 (시안의 빨간 줄) ───────────────────────
   ⚠️ 네 칸에 **지킬 수 있는 말만** 적습니다. 시안에 있던 "실제 사장님
   후기" 는 후기가 한 건도 없어서 뺐습니다 — 없는 것을 있다고 적으면
   표시광고법 제3조(거짓·과장 광고)입니다. 후기가 쌓이면 그때 넣습니다. */
function BrandBand(){
  return '<section class="bband">'+
    /* 시안의 왼쪽 고기 사진. ⚠️ 사진이 없으면 **빈 액자를 두지 않고**
       그 칸을 아예 빼고 글이 왼쪽 끝부터 시작합니다 (절대 규칙 2). */
    (hasPhoto("band-meat")
      ? '<div class="bband-ph" aria-hidden="true">'+photoBox("band-meat")+'</div>' : '')+
    '<div class="w bband-in'+(hasPhoto("band-meat")?' bband-ph-on':'')+'">'+
    '<h2>좋은 고기, 좋은 사장님,<br class="br-m"> 더 좋은 매장을 만듭니다.</h2>'+
    '<ul class="bband-l">'+
      [["badge","조건 맞는 곳만"],
       ["won","상담·견적 무료"],
       ["scale","견적은 나란히"],
       ["seed","창업부터 정리까지"]].map(function(x){
        return '<li>'+icon(x[0],26)+'<b>'+esc(x[1])+'</b></li>'; }).join("")+
    '</ul>'+
  '</div></section>';
}

/* ── 05 창업 프로젝트 (지시서 9번) ─────────────────────────
   20단계를 다 늘어놓으면 숨이 막히므로, **다섯 마디**로 묶어 보여 주고
   전체는 /start 에서 봅니다.
   ⚠️ 예전에는 차콜 띠였습니다. 화면 한가운데에 어두운 덩어리가 있으면
   그 위아래가 다 눌려 보여서, 옅은 브랜드색 띠(.sec-tone)로 바꿨습니다.
   어두운 면은 **맨 끝 CTA 한 군데**만 남깁니다. */
function StartBand(){
  var phases = [
    ["상권 · 점포", "어디서 몇 평으로 할지"],
    ["설계 · 계획", "메뉴 · 객단가 · 손익"],
    ["시공",        "인테리어 · 덕트 · 주방"],
    ["장비 · 거래처","냉장 · 정육장비 · 육류"],
    ["오픈",        "인허가 · 세무 · 마케팅"]
  ];
  var steps = (window.WOW_STARTUP_STEPS || []);
  return '<section class="sec-tone"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">창업 프로젝트</p>'+
      '<h2>고깃집 하나 차리는 데<br class="br-m"> 알아볼 게 너무 많으니까.</h2>'+
      '<p>상권부터 오픈까지 <b>'+(steps.length||20)+'가지</b>를 순서대로 정리해 드립니다. '+
        '지금 어디쯤인지, 다음에 뭘 해야 하는지가 한 화면에 보입니다.</p></div>'+

    '<ol class="flow">'+phases.map(function(p,i){
      return '<li><span class="flow-n">'+(i+1)+'</span>'+
        '<b>'+esc(p[0])+'</b><span class="flow-d">'+esc(p[1])+'</span></li>';
    }).join("")+'</ol>'+

    (steps.length ? '<ul class="chips chips-lg">'+steps.map(function(s){
        return '<li>'+icon(s.icon||"check",16)+esc(s.name)+'</li>'; }).join("")+'</ul>' : '')+

    '<div class="row-cta">'+
      '<a class="btn btn-b btn-lg" href="/start/cost">내 창업비 알아보기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/start">창업 프로젝트 시작하기</a>'+
    '</div>'+
  '</div></section>';
}

/* ── 06 전문업체 3곳 매칭 (지시서 12번) ─────────────────────
   ⚠️ 여기에 **업체 카드를 놓지 마세요.** 등록된 파트너가 아직 없고,
   이름·평점을 지어내면 지시서 43번 위반입니다. 실제 파트너가 생기면
   그때 붙입니다 — 지금은 "어떻게 되는지" 만 설명합니다. */
function MatchBand(){
  var steps = [
    ["상황을 적습니다",   "edit",
     "문제나 필요한 것을 그대로 적어 주시면 됩니다. 양식이 없어도 됩니다."],
    ["우리가 알아봅니다", "search",
     "무엇이 필요한 일인지 정리하고, 지역 · 예산 · 일정 조건을 잡습니다."],
    ["세 곳만 비교합니다", "scale",
     "조건에 맞는 곳에만 요청이 갑니다. 가격 · 일정 · A/S 를 한 화면에서 보세요."]
  ];
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">업체 매칭</p>'+
      '<h2>업체 찾느라<br class="br-m"> 전화 돌리지 마세요.</h2>'+
      '<p>업체를 많이 보여 드리는 게 목적이 아닙니다. '+
        '사장님 조건에 맞는 곳을 찾아 드리는 게 목적입니다.</p></div>'+
    '<ol class="steps">'+steps.map(function(s,i){
      return '<li><span class="steps-n">'+("0"+(i+1))+'</span>'+
        '<b>'+icon(s[1],20)+esc(s[0])+'</b><span>'+esc(s[2])+'</span></li>';
    }).join("")+'</ol>'+
    '<div class="row-cta row-mid">'+
      '<a class="btn btn-b btn-lg" href="/sos">지금 물어보기'+icon("arrow",18)+'</a>'+
    '</div>'+
  '</div></section>';
}

/* ── 07 고기 장사에 필요한 모든 것 (지시서 25번) ────────────
   ⚠️ **첫 화면이 아니라 여기**입니다 (지시서 3번). 들어오자마자
   카테고리를 늘어놓으면 전화번호부가 됩니다. 손님이 "내 상황" 을
   먼저 고른 다음에 보여 주는 지도입니다. */
function CatBand(){
  var ic = { meat:"truck", space:"store", equip:"tool",
             ops:"clock", grow:"up", pro:"shield" };
  return '<section class="sec sec-tint"><div class="w">'+
    '<div class="sec-hd"><h2>고기 장사에 필요한 모든 것</h2>'+
      '<p>고기부터 덕트 · 장비 · 세무까지. 어디에 물어야 할지 모를 때 '+
        '여기서 시작하시면 됩니다.</p>'+
      '<a class="sec-more" href="/partners">업체 찾기'+icon("chev",16)+'</a></div>'+
    '<div class="cat-g">'+WOW_SERVICE_GROUPS.map(function(g){
      var ph = hasPhoto("cat-"+g.key);
      return '<a class="cat'+(ph?'':' cat-flat')+'" href="/partners?g='+
        encodeURIComponent(g.key)+'">'+
        (ph ? '<span class="cat-ph">'+photoBox("cat-"+g.key)+'</span>' : '')+
        /* ⚠️ 시안처럼 **한 줄에 여섯**을 놓으려면 카드가 낮아야 합니다.
           안에 들어 있던 칩 목록(다섯 개 + "외 n가지")을 빼고 **한 줄
           글**로 줄였습니다 — 칩이 두 줄이 되는 순간 카드가 두 배로
           높아져서 한 줄에 여섯이 안 들어갑니다. */
        '<span class="cat-b">'+
          '<span class="cat-t">'+
            '<span class="cat-ic">'+icon(g.icon||ic[g.key]||"chev",20)+'</span>'+
            '<b>'+esc(g.name)+'</b>'+
          '</span>'+
          '<span class="cat-sub">'+
            esc(g.items.slice(0,3).map(function(it){ return it.name; }).join(" · "))+
          '</span>'+
        '</span></a>';
    }).join("")+'</div>'+
  '</div></section>';
}

/* ── 08 요즘 어떤 고민이 있으세요? (지시서 11번) ──────────
   사진이 있으면 왼쪽에 세우고, 없으면 **글이 화면 전체를 씁니다.** */
function WorryBand(){
  /* ⚠️ 열두 개를 다 펼치면 고르는 게 아니라 **훑게** 됩니다. 시안대로
     여섯 개만 내고 나머지는 SOS 화면에서 봅니다 — 거기서는 적는 것이
     주인공이라 열두 개가 다 있어도 괜찮습니다.
     ⚠️ 왼쪽에 세워 두던 세로 그림은 뺐습니다. 칸을 반으로 줄여서
     고민 여섯 개가 두 줄로 눌려 있었습니다. */
  var six = WOW_PROBLEMS.slice(0, 6);
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><h2>요즘 어떤 고민이 있으세요?</h2>'+
      '<p>고르시면 그 이야기부터 시작합니다. 여기 없는 것도 그냥 적어 주세요.</p>'+
      '<a class="sec-more" href="/sos">더 많은 고민 보기'+icon("chev",16)+'</a></div>'+
    '<div class="prob-g prob-g-w">'+six.map(function(p){
      return '<a class="prob" href="'+esc(p.to || ("/sos?c="+encodeURIComponent(p.key)))+'">'+
        '<span class="prob-ic">'+icon(p.icon||"chat",20)+'</span>'+
        '<span class="prob-b"><b>'+esc(p.name)+'</b>'+
          (p.hint ? '<span>'+esc(p.hint)+'</span>' : '')+'</span>'+
        '<span class="prob-go">'+icon("chev",16)+'</span></a>';
    }).join("")+'</div>'+
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
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">사장님 스토리</p>'+
      '<h2>다른 사장님들은 이렇게 시작했습니다</h2>'+
      '<a class="sec-more" href="/stories">전체보기'+icon("chev",16)+'</a></div>'+
    '<div class="card-g">'+st.slice(0,3).map(StoryCard).join("")+'</div>'+
  '</div></section>';
}

/* ── 11 사장님 연구소 (지시서 21번) ────────────────────────
   ⚠️ 글이 하나도 없으면 안 나옵니다. 빈 구간을 두면 "만들다 만 사이트"
   로 읽힙니다. */
function LabBand(){
  var posts = window.WOW_POSTS;
  if(!posts || !posts.length) return "";
  /* ⚠️ 앞에서 세 편을 그냥 자르면 같은 분류만 나옵니다. 처음 오신
     분이 제일 많이 막히는 셋을 골라 두고, 없으면 앞에서 채웁니다. */
  var want = ["meat-cost-rate", "duct-smell-complaint", "startup-cost-missing"];
  var pick = want.map(function(sl){ return wowPost(sl); }).filter(Boolean);
  posts.forEach(function(p){
    if(pick.length < 3 && pick.indexOf(p) < 0) pick.push(p);
  });

  /* ⚠️ 시안은 여기가 "다른 사장님들은 이렇게 시작했습니다" (사례 3장)
     + 오른쪽 파트너 카드였습니다. **사례가 한 건도 없습니다** — 지어낸
     창업비·기간을 적을 수 없으니(지시서 43번), 같은 **틀**에 지금 있는
     진짜 내용(연구소 글 세 편)을 놓습니다. 실제 사례가 생기면
     WOW_STORIES 가 채워지고 StoryBand 가 이 자리 위에 나타납니다. */
  return '<section class="sec sec-warm"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">사장님 연구소</p>'+
      '<h2>알고 하면 덜 씁니다</h2>'+
      '<p>고기 장사를 하면서 실제로 막히는 것들을 정리했습니다. '+
        '읽고 나서 <b>바로 할 수 있는 것</b>까지 적었습니다.</p>'+
      '<a class="sec-more" href="/lab">글 '+posts.length+'편 전부 보기'+icon("chev",16)+'</a></div>'+
    '<div class="lab-split">'+
      '<div class="lab-g">'+pick.slice(0,3).map(PostCard).join("")+'</div>'+
      /* 시안 오른쪽의 어두운 파트너 카드 */
      '<aside class="pt-card">'+
        '<b>고기 사업자를<br> 고객으로 만나고 계신가요?</b>'+
        '<span>광고만 하지 말고, 실제 도움이 필요한 사장님을 만나세요.</span>'+
        '<a class="btn btn-w" href="/partner/apply">파트너로 등록하기'+icon("arrow",16)+'</a>'+
        '<ul class="pt-card-l">'+
          (window.WOW_SERVICE_GROUPS||[]).slice(0,6).map(function(g){
            return '<li>'+esc(g.name)+'</li>'; }).join("")+
        '</ul>'+
      '</aside>'+
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
  return '<section class="sec sec-tint"><div class="w">'+
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
    ["요청을 받습니다",   "조건에 맞는 것만 갑니다. 아무거나 안 보냅니다."],
    ["견적을 냅니다",     "가격 · 일정 · A/S 를 적어 보내시면 됩니다."],
    ["직접 이야기합니다", "고객이 고르면 바로 연결됩니다."]
  ];
  return '<section class="sec sec-warm"><div class="w'+(ph?' band band-flip':' pt-one')+'">'+
    '<div class="band-t">'+
      '<p class="eyebrow">파트너 모집</p>'+
      '<h2>고깃집 · 정육점을 아는<br class="br-m"> 업체를 찾고 있습니다.</h2>'+
      '<p class="lead">광고비를 받고 위에 올려 드리는 곳이 아닙니다. '+
        '조건이 맞는 요청만 골라서 보내 드립니다.</p>'+
      '<ul class="pt-l'+(ph?'':' pt-l-row')+'">'+how.map(function(x){
        return '<li>'+icon("check",18)+'<b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>';
      }).join("")+'</ul>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/partner/apply">파트너 등록하기'+icon("arrow",18)+'</a>'+
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
      '<h2>사장님은 장사만 하세요.</h2>'+
      '<p>복잡한 건 ABOUTMEAT이 알아보겠습니다.</p>'+
      '<div class="row-cta row-mid">'+
        '<a class="btn btn-w btn-lg" href="/sos">무료로 물어보기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-gh btn-lg" href="/check">무료 사업진단</a>'+
      '</div>'+
    '</div>'+
  '</section>';
}

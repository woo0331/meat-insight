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
  return Hero()+
         HowRow()+
         Situations()+
         CheckBand()+
         StartBand()+
         MatchBand()+
         CatBand()+
         WorryBand()+
         LiveBand()+        /* 실제 요청 현황 — 데이터 있을 때만 */
         StoryBand()+       /* 사장님 스토리 — 실제 사례 있을 때만 */
         LabBand()+         /* 사장님 연구소 — 글 있을 때만 */
         PartnerBand()+
         FinalCTA();
}

/* ── 01 HERO ───────────────────────────────────────────────
   어두운 바탕 위 왼쪽 정렬. 제일 큰 것은 **입력창**입니다.
   ⚠️ 어두운 면은 버건디가 아니라 차콜(--dark)입니다. 여기까지 브랜드
   색으로 칠하면 화면 절반이 버건디가 되어 정육점 간판이 됩니다. */
function Hero(){
  return '<section class="hero">'+
    photoBg("hero")+
    '<div class="hero-sh"></div>'+
    '<div class="w hero-in">'+
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
    return '<div class="how-i">'+icon(r[0],22)+
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
      '<p>하나만 고르시면 거기서부터 같이 봅니다.</p></div>'+
    '<div class="sit-g">'+WOW_SITUATIONS.map(function(s){
      var ph = hasPhoto("sit-"+s.key);
      return '<a class="sit'+(ph?'':' sit-flat')+'" href="'+esc(s.to)+
        (s.ask ? '?q='+encodeURIComponent(s.ask) : '')+'">'+
        (ph ? '<span class="sit-ph">'+photoBox("sit-"+s.key)+
              '<span class="sit-ic">'+icon(s.icon,22)+'</span></span>' : '')+
        '<span class="sit-b">'+
          (ph ? '' : '<span class="sit-ic">'+icon(s.icon,22)+'</span>')+
          '<b>'+esc(s.name)+'</b>'+
          '<span class="sit-l">'+esc(s.line)+'</span>'+
          '<span class="sit-d">'+esc(s.desc)+'</span>'+
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
  return '<section class="sec sec-warm"><div class="w band">'+
    '<div class="band-t">'+
      '<p class="eyebrow">무료 사업진단</p>'+
      '<h2>사장님, 지금 제대로<br class="br-m"> 남기고 계신가요?</h2>'+
      '<p class="lead">매출이 높다고 남는 건 아닙니다. 두 칸만 적어 보세요. '+
        '지금 육류원가가 매출의 몇 퍼센트인지 바로 보여 드립니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/check">8가지로 제대로 진단하기'+icon("arrow",18)+'</a>'+
      '</div>'+
      '<p class="note">3분이면 끝납니다. 가입하지 않으셔도 됩니다.</p>'+
    '</div>'+

    '<div class="band-f">'+
      '<div class="calc">'+
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
    '</div>'+
  '</div></section>';
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

/* ── 05 창업 프로젝트 (지시서 9번) ─────────────────────────
   어두운 띠. 20단계를 다 늘어놓으면 숨이 막히므로, **다섯 마디**로
   묶어 보여 주고 전체는 /start 에서 봅니다. */
function StartBand(){
  var phases = [
    ["상권 · 점포", "어디서 몇 평으로 할지"],
    ["설계 · 계획", "메뉴 · 객단가 · 손익"],
    ["시공",        "인테리어 · 덕트 · 주방"],
    ["장비 · 거래처","냉장 · 정육장비 · 육류"],
    ["오픈",        "인허가 · 세무 · 마케팅"]
  ];
  var steps = (window.WOW_STARTUP_STEPS || []);
  return '<section class="dark"><div class="w">'+
    '<div class="sec-hd sec-hd-d"><p class="eyebrow">창업 프로젝트</p>'+
      '<h2>고깃집 하나 차리는 데<br class="br-m"> 알아볼 게 너무 많으니까.</h2>'+
      '<p>상권부터 오픈까지 '+(steps.length||20)+'가지를 순서대로 정리해 드립니다. '+
        '지금 어디쯤인지, 다음에 뭘 해야 하는지가 한 화면에 보입니다.</p></div>'+

    '<ol class="flow">'+phases.map(function(p,i){
      return '<li><span class="flow-n">'+(i+1)+'</span>'+
        '<b>'+esc(p[0])+'</b><span class="flow-d">'+esc(p[1])+'</span></li>';
    }).join("")+'</ol>'+

    (steps.length ? '<ul class="chips chips-d">'+steps.map(function(s){
        return '<li>'+esc(s.name)+'</li>'; }).join("")+'</ul>' : '')+

    '<div class="row-cta">'+
      '<a class="btn btn-w btn-lg" href="/start/cost">내 창업비 알아보기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-gh btn-lg" href="/start">창업 프로젝트 시작하기</a>'+
    '</div>'+
  '</div></section>';
}

/* ── 06 전문업체 3곳 매칭 (지시서 12번) ─────────────────────
   ⚠️ 여기에 **업체 카드를 놓지 마세요.** 등록된 파트너가 아직 없고,
   이름·평점을 지어내면 지시서 43번 위반입니다. 실제 파트너가 생기면
   그때 붙입니다 — 지금은 "어떻게 되는지" 만 설명합니다. */
function MatchBand(){
  var steps = [
    ["상황을 적습니다",   "문제나 필요한 것을 그대로 적어 주시면 됩니다. 양식이 없어도 됩니다."],
    ["우리가 알아봅니다", "무엇이 필요한 일인지 정리하고, 지역 · 예산 · 일정 조건을 잡습니다."],
    ["세 곳만 비교합니다", "조건에 맞는 곳에만 요청이 갑니다. 가격 · 일정 · A/S 를 한 화면에서 보세요."]
  ];
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">업체 매칭</p>'+
      '<h2>업체 찾느라<br class="br-m"> 전화 돌리지 마세요.</h2>'+
      '<p>업체를 많이 보여 드리는 게 목적이 아닙니다. '+
        '사장님 조건에 맞는 곳을 찾아 드리는 게 목적입니다.</p></div>'+
    '<ol class="steps">'+steps.map(function(s,i){
      return '<li><span class="steps-n">'+("0"+(i+1))+'</span>'+
        '<b>'+esc(s[0])+'</b><span>'+esc(s[1])+'</span></li>';
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
  return '<section class="sec sec-warm"><div class="w">'+
    '<div class="sec-hd"><h2>고기 장사에 필요한 모든 것</h2>'+
      '<p>고기부터 덕트 · 장비 · 세무까지. 어디에 물어야 할지 모를 때 '+
        '여기서 시작하시면 됩니다.</p>'+
      '<a class="sec-more" href="/partners">업체 찾기'+icon("chev",16)+'</a></div>'+
    '<div class="cat-g">'+WOW_SERVICE_GROUPS.map(function(g){
      var ph = hasPhoto("cat-"+g.key);
      return '<a class="cat'+(ph?'':' cat-flat')+'" href="/partners?g='+
        encodeURIComponent(g.key)+'">'+
        (ph ? '<span class="cat-ph">'+photoBox("cat-"+g.key)+'</span>' : '')+
        '<span class="cat-b">'+
          '<span class="cat-t">'+icon(ic[g.key]||"chev",20)+'<b>'+esc(g.name)+'</b></span>'+
          (g.lead ? '<span class="cat-l">'+esc(g.lead)+'</span>' : '')+
          '<span class="cat-i">'+g.items.slice(0,5).map(function(it){
            return esc(it.name); }).join(" · ")+
            (g.items.length > 5 ? ' 외 '+(g.items.length-5)+'가지' : '')+'</span>'+
        '</span></a>';
    }).join("")+'</div>'+
  '</div></section>';
}

/* ── 08 요즘 어떤 고민이 있으세요? (지시서 11번) ──────────
   사진이 있으면 왼쪽에 세우고, 없으면 **글이 화면 전체를 씁니다.** */
function WorryBand(){
  var ph = hasPhoto("worry");
  return '<section class="sec"><div class="w'+(ph?' worry':'')+'">'+
    (ph ? '<figure class="worry-f">'+photoBox("worry","ph-tall")+'</figure>' : '')+
    '<div class="worry-t">'+
      '<div class="sec-hd"><h2>요즘 어떤 고민이 있으세요?</h2>'+
        '<p>고르시면 그 이야기부터 시작합니다. 여기 없는 것도 그냥 적어 주세요.</p></div>'+
      '<div class="prob-g'+(ph?'':' prob-g-w')+'">'+WOW_PROBLEMS.map(function(p){
        return '<a class="prob" href="'+esc(p.to || ("/sos?c="+encodeURIComponent(p.key)))+'">'+
          '<span class="prob-b"><b>'+esc(p.name)+'</b>'+
            (p.hint ? '<span>'+esc(p.hint)+'</span>' : '')+'</span>'+
          '<span class="prob-go">'+icon("chev",16)+'</span></a>';
      }).join("")+'</div>'+
    '</div>'+
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
  return '<section class="sec sec-warm"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">사장님 연구소</p>'+
      '<h2>알고 하면 덜 씁니다</h2>'+
      '<a class="sec-more" href="/lab">전체보기'+icon("chev",16)+'</a></div>'+
    '<div class="card-g">'+posts.slice(0,3).map(PostCard).join("")+'</div>'+
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

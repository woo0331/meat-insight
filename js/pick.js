/* ════════════════════════════════════════════════════════════════════
   선택한 서비스 — 2026-10-17 "창업 준비 전문관" 지시서 §3 · §4-1

   > §3 — "고객은 한 번에 여러 서비스를 선택할 수 있어야 한다 ·
   >  카테고리를 이동해도 선택 유지 · 새로고침 후에도 임시 선택 내역
   >  복구 · 선택한 서비스 개수 표시."

   쇼핑몰 장바구니와 비슷하지만 **사는 것이 아니라 견적을 요청하는
   것**입니다. 그래서 이름이 "선택한 서비스" 이고, 어디에도 "담기" ·
   "주문" 이라고 적지 않습니다 (§3-3).

   ⚠️⚠️ **담는 것은 서비스 id 뿐입니다.** 성함 · 연락처 · 적으신 글은
   한 글자도 안 담습니다 — 가게 컴퓨터는 여러 사람이 쓰고, §4-1 이
   "개인정보와 민감한 신청 정보는 보안 위험을 고려하여 브라우저에
   무분별하게 저장하지 않는다" 고 적었습니다. 관심 업체(`am.saved.v1`)를
   업체 id 하나만 담는 것과 같은 규칙입니다.

   ⚠️⚠️ **고르는 것이 신청이 아닙니다.** 고르기만 하고 닫으면 저희에게
   아무것도 오지 않습니다 — 화면이 그렇게 적고 있고, 그 줄을 지우면
   손님이 신청한 줄 알고 기다리십니다 (절대 규칙 5).

   ⚠️ **색만으로 선택 상태를 표시하지 않습니다** (§3-1 · §14). 실제
   `<input type="checkbox">` 라서 ① 체크 표시 ② 테두리 ③ 배경이 같이
   바뀌고, 읽어 주는 프로그램도 눌림 여부를 읽습니다.

   ⚠️⚠️ **고를 때 화면을 다시 그리지 않습니다.** 다시 그리면 방금
   보던 자리를 잃고, 적던 칸이 비워집니다 — 이 저장소가 "더 보기" 와
   패키지 체크에서 겪은 자리입니다. DOM 을 바로 고칩니다.
   ════════════════════════════════════════════════════════════════════ */

var PKEY = "am.pick.v1";

/* ── 읽기 · 쓰기 ─────────────────────────────────────────────────── */

/* 고르신 서비스 id 들 — ⚠️⚠️ **없는 id 는 걸러 냅니다.** 분류 이름이
   바뀌거나 전문관에서 칸이 빠지면 옛 id 가 남는데, 그대로 두면 신청
   화면에 **빈 줄**이 생기고 접수에는 없는 서비스가 실립니다. */
window.amPickGet = function(){
  var raw = amGet(PKEY, null);
  var ids = (raw && raw.ids) ? raw.ids : (Array.isArray(raw) ? raw : []);
  var seen = {}, out = [];
  ids.forEach(function(id){
    if(seen[id]) return;                     /* §3-2 중복 선택 방지 */
    if(!amPickOne(id)) return;               /* 없어진 서비스 */
    seen[id] = 1; out.push(id);
  });
  return out;
};

/* ⚠️ 저장한 시각을 같이 둡니다 — §4-3 "마지막 저장 시각" 과 §4-1
   "브라우저 저장 정보의 유지 범위" 를 화면에 적는 데 씁니다. */
window.amPickSet = function(ids){
  if(!ids || !ids.length) amDel(PKEY);
  else amSet(PKEY, { ids:ids, at:Date.now() });
  /* ⚠️ 로그인하고 들어와 계시면 계정에도 남깁니다 (§6-2). 꺼져 있으면
     `amStateTouch()` 가 **아무 일도 안 합니다** — 이 줄 하나로 두 쪽이
     갈립니다. ⚠️⚠️ 비우는 것(`[]`)도 올립니다: 안 올리면 다른 기기에서
     지운 것이 **다음에 열 때 되살아납니다.** */
  if(typeof amStateTouch === "function") amStateTouch("pick");
  return ids || [];
};

window.amPickAt = function(){
  var raw = amGet(PKEY, null);
  return (raw && raw.at) ? raw.at : 0;
};

window.amPickHas   = function(id){ return amPickGet().indexOf(id) >= 0; };
window.amPickCount = function(){ return amPickGet().length; };

/* 고르신 것을 **서비스 한 벌로** 돌려줍니다 (이름 · 아이콘 · 추가 질문) */
window.amPickList = function(){
  return amPickGet().map(amPickOne).filter(Boolean);
};

/* ── 누르면 ──────────────────────────────────────────────────────── */

/* ⚠️ 체크칸의 `onchange` 가 부릅니다 — `el.checked` 를 **그대로
   따릅니다.** 여기서 뒤집으면 키보드로 두 번 눌렀을 때 어긋납니다. */
window.pickToggle = function(id, el){
  var ids = amPickGet(), i = ids.indexOf(id);
  var on = el ? !!el.checked : (i < 0);
  if(on && i < 0) ids.push(id);
  if(!on && i >= 0) ids.splice(i, 1);
  amPickSet(ids);
  pickPaint();
};

/* 바구니에서 빼기 (§3-2 · §9-4 "선택한 서비스는 항상 확인 가능") */
window.pickDel = function(id){
  var ids = amPickGet(), i = ids.indexOf(id);
  if(i >= 0){ ids.splice(i, 1); amPickSet(ids); }
  pickPaint();
};

/* 전부 해제 — ⚠️ 되돌릴 수 없으니 한 번 물어봅니다 */
window.pickClear = function(){
  if(amPickCount() && !confirm("고르신 서비스를 전부 해제합니다. 되돌릴 수 없습니다."))
    return;
  amPickSet([]);
  pickPaint();
  toast("선택을 전부 해제했습니다");
};

/* ── 화면을 제자리에서 고칩니다 ───────────────────────────────────
   ⚠️⚠️ 바꾸는 것은 **넷**입니다 — ① 카드의 체크와 모양 ② 개수 ·
   목록(바구니) ③ 폰 하단 띠 ④ 신청 단추의 주소. 하나라도 빠뜨리면
   "고른 것과 넘어가는 것이 다릅니다" 가 되고, 그게 제일 나쁩니다
   (패키지에서 같은 규칙으로 겪은 자리). */
window.pickPaint = function(){
  var ids = amPickGet(), n = ids.length;

  /* ① 카드 — 화면에 있는 모든 체크칸을 저장된 값에 맞춥니다.
     전체 보기를 펼쳤다 접어도, 뒤로 와도 같게 섭니다. */
  [].slice.call(document.querySelectorAll("[data-pick]")).forEach(function(el){
    var on = ids.indexOf(el.getAttribute("data-pick")) >= 0;
    if(el.checked !== on) el.checked = on;
    var card = el.closest(".pk-c");
    if(card) card.classList.toggle("is-on", on);
  });

  /* ①b 뭆음 여듯의 "n개 선택" 닱지 (§5-2 — 색만으로
     표시하지 않습니다). ⚠️ 뭆음을 안 펼치시고도 거기서
     몇 개를 골랐는지가 보여야 합니다 — 안 보이면 펼칠 까닭이
     없어집니다. */
  [].slice.call(document.querySelectorAll("[data-pick-g]")).forEach(function(el){
    var want = (el.getAttribute("data-pick-g") || "").split(",");
    var k = 0;
    want.forEach(function(id){ if(id && ids.indexOf(id) >= 0) k++; });
    el.hidden = !k;
    var t = el.querySelector("i");
    if(t) t.textContent = k + "개 선택";
  });

  /* ② 개수 — 여러 자리에 같은 수가 나옵니다 (바구니 · 머리말 · 단추) */
  [].slice.call(document.querySelectorAll("[data-pick-n]")).forEach(function(el){
    el.textContent = String(n);
  });

  /* 바구니 목록 · 빈 상태 */
  var box = document.getElementById("pk-list");
  if(box) box.innerHTML = pickRows();
  var zero = document.getElementById("pk-zero");
  if(zero) zero.hidden = n > 0;
  var some = document.getElementById("pk-some");
  if(some) some.hidden = n === 0;
  /* §5 — 0개면 비활성 단추 · 1개 이상이면 실제 링크. ⚠️ 넷을 **같이**
     뒤집습니다 (링크 · 비활성 단추 · 전부 해제 · 까닭) — 하나만
     빠뜨리면 "못 누르는 단추 옆에 누를 수 있는 단추" 가 섭니다. */
  ["pk-go-on", "pk-go-clr"].forEach(function(id){
    var e = document.getElementById(id);
    if(e) e.hidden = n === 0;
  });
  ["pk-go-off", "pk-go-why"].forEach(function(id){
    var e = document.getElementById(id);
    if(e) e.hidden = n > 0;
  });

  /* ③ ④ 폰 하단 띠 · 단추 */
  var bar = document.getElementById("pk-bar");
  if(bar){
    bar.hidden = n === 0;
    var go = document.getElementById("pk-bar-go");
    if(go){
      go.setAttribute("href", amPickQuoteTo(go.getAttribute("data-side")));
      /* §9-2 — 단추 문구에 **실제 동작과 개수**를 적습니다.
         "진행하기" 가 아니라 "선택한 4개 서비스 견적 신청하기". */
      var t = go.querySelector("span");
      if(t) t.textContent = "선택한 " + n + "개 서비스 견적 신청하기";
    }
  }
  /* ⚠️⚠️ **띠가 없는 화면에서도 부릅니다.** `if(bar)` 안에 두었더니,
     고르신 뒤에 띠가 없는 화면(`/about` 등)으로 가면 `--pk-bar-h` 가
     **77px 로 남아** 모든 화면 아래에 빈 자리가 생겼습니다 — 에러도
     안 나고 가로 스크롤도 안 나서 **재 보고** 알았습니다.
     `pickPad()` 는 띠가 없으면 0 을 넣습니다. */
  pickPad();
  /* 본문 안의 신청 단추들도 같이 */
  /* ⚠️ 쪽은 `data-pick-go` 의 **값**으로 옵니다
     (`data-pick-go="ops"`). 빈 값이면 `start` 입니다. */
  [].slice.call(document.querySelectorAll("[data-pick-go]")).forEach(function(a){
    a.setAttribute("href", amPickQuoteTo(a.getAttribute("data-pick-go")));
    var t = a.querySelector("span");
    if(t) t.textContent = n ? ("선택한 " + n + "개 서비스 견적 신청하기")
                            : "견적 신청하기";
  });
};

/* ⚠️⚠️ **고정 띠가 본문을 가리지 않게** 그만큼 아래를 비웁니다
   (§3-3 이 "고정 버튼이 본문이나 개인정보 동의 영역을 가리지 않도록
   한다" 고 직접 적었습니다). 재서 넣지 않으면 마지막 단추나 동의
   체크칸이 띠 밑으로 들어가 **누를 수가 없습니다.** */
function pickPad(){
  var bar = document.getElementById("pk-bar");
  var h = (bar && !bar.hidden) ? bar.getBoundingClientRect().height : 0;
  document.documentElement.style.setProperty("--pk-bar-h", Math.round(h) + "px");
}

/* 고르신 것을 신청 화면으로 — ⚠️ 주소에 실어야 **뒤로 가기 ·
   새로고침 · 링크 공유**에 살아남습니다 (관심 업체 `?cmp=` 와 같은
   생각입니다). 저장된 것과 주소를 둘 다 두는 까닭은, 링크로 받은
   분에게는 저장된 것이 없기 때문입니다. */
window.amPickQuoteTo = function(side){
  var ids = amPickGet();
  /* ⚠⚠ **쪽(side)을 넘기세요.** 전에 "start" 로 박혀 있었는데,
     2026-10-18 로 **운영 중인 사장님**도 같은 고르개를 쓰게 되면서
     그분들이 신청 화면에서 "창업 — 시작하려고 합니다" 를 고른 채로
     접수되는 꼴이었습니다. DB 는 처음부터 `ops` 를 받습니다
     (`db/migrations/0001_init.sql` — start | ops | transfer | close).
     ⚠️ 기본값은 `start` 그대로입니다 — 창업 쪽은 한 글자도 안 바뀝니다. */
  var q = ["side=" + encodeURIComponent(side || "start")];
  if(ids.length) q.push("sv=" + encodeURIComponent(ids.join(",")));
  return "/quote?" + q.join("&");
};

/* ── 조각들 ──────────────────────────────────────────────────────── */

/* 고르는 카드 하나 (§3-1).
   ⚠️⚠️ **`<label>` 이 통째로 눌립니다** — 안에 또 링크를 넣지 마세요.
   `<a>` 안의 `<a>` 를 브라우저가 쪼개는 것과 같은 자리입니다. 자세히
   보실 링크는 카드 **밖**(아래 작은 줄)에 둡니다.
   ⚠️ 쉬운 이름이 먼저이고 원래 이름이 작은 줄입니다 (§9-3) — 원래
   이름을 버리면 업체 · 관리자 · 검색이 쓰는 말과 끊깁니다. */
window.PickCard = function(s){
  var on = amPickHas(s.id);
  var id = "pk-" + s.id.replace(/[^a-z0-9]/gi, "-");
  var art = (typeof hasIconArt === "function" && s.ia && hasIconArt(s.ia))
    ? iconArt(s.ia, 48) : icon(s.icon || "check", 26);
  /* ⚠️ `data-pick-q` 는 §4-5 검색이 보는 글입니다 — 쉬운 이름 · 원래
     이름 · 분류 이름을 **띄어쓰기를 지운 채** 같이 넣습니다 (손님은
     "에어컨수리" 처럼 붙여 치십니다). */
  return '<li class="tn-'+esc(s.tone)+'" data-pick-q="'+esc(pickQOf(s))+'">'+
    '<label class="pk-c'+(on ? " is-on" : "")+'" for="'+esc(id)+'">'+
      /* ⚠️⚠️ **체크칸을 숨기지 마세요.** 브라우저가 그려 주는 체크
         표시가 ① 눌림을 글자 아닌 **모양**으로 보여 주고 ② 키보드
         포커스 테두리를 공짜로 주고 ③ 읽어 주는 프로그램이 눌림
         여부를 읽습니다 (§3-1 · §14). 숨겨 놓고 흉내내면 셋을 전부
         다시 만들어야 하고, 이 저장소는 그런 자리에서 포커스 테두리를
         잃은 적이 있습니다. */
      '<input type="checkbox" id="'+esc(id)+'" class="pk-ck"'+
        ' data-pick="'+esc(s.id)+'"'+(on ? " checked" : "")+
        ' onchange="pickToggle(\''+esc(s.id)+'\', this)">'+
      '<span class="pk-i ia-t">'+art+'</span>'+
      /* ⚠️⚠️ **하위는 어느 분야 것인지를 같이 냅니다.** "가구" ·
         "폐업신고" 처럼 이름만 있으면 어느 분야인지 안 보이고,
         바구니에서 섞이면 더 그렇습니다 — `PickSubRow()` 가 겹치는
         이름에만 묶음을 붙이는 것과 같은 까닭입니다. 찍어 보고
         알았습니다 (빠른 선택 여섯이 전부 이름 한 낱말이었습니다). */
      '<span class="pk-t">'+
        '<b>'+esc(amPickLabel(s))+'</b>'+
        (s.easy && s.easy !== s.name ? '<i>'+esc(s.name)+'</i>'
          : (s.sub && s.desc ? '<i>'+esc(s.desc)+'</i>' : ""))+
      '</span>'+
    '</label>'+
  '</li>';
};

/* 바구니 줄들 */
function pickRows(){
  var L = amPickList();
  if(!L.length) return "";
  return L.map(function(s){
    return '<li><span class="pk-r-n">'+esc(amPickLabel(s))+'</span>'+
      '<button class="pk-r-x" type="button" onclick="pickDel(\''+esc(s.id)+'\')" '+
        'aria-label="'+esc(amPickLabel(s))+' 선택 해제">'+icon("x",15)+'</button></li>';
  }).join("");
}

/* ⚠️⚠️ **폰 하단 띠는 `#view` 안에 둡니다.** 밖(`chrome.js`)에 두면
   화면마다 따라다니는데, 신청 화면(`/quote`)에서는 **동의 영역을
   가리는 것**이 되고 거기서는 이미 신청 중이라 쓸모가 없습니다
   (§3-3). 그래서 부르는 화면만 냅니다. */
window.PickBar = function(side){
  var n = amPickCount();
  return '<div class="pk-bar" id="pk-bar"'+(n ? "" : " hidden")+'>'+
    '<p class="pk-bar-t">선택한 서비스 <b data-pick-n>'+n+'</b>개</p>'+
    '<a class="btn btn-b" id="pk-bar-go" data-side="'+esc(side || "start")+'"'+
      ' href="'+esc(amPickQuoteTo(side))+'">'+
      '<span>선택한 '+n+'개 서비스 견적 신청하기</span>'+icon("arrow",17)+'</a>'+
  '</div>';
};

/* ── C. 선택한 서비스 확인 (§2-C) ────────────────────────────────
   > "고객이 선택한 서비스 개수와 목록을 보여준다. 선택한 서비스를
   >  쉽게 해제할 수 있어야 한다."

   ⚠️⚠️ **0개일 때도 구간을 냅니다.** 보통 이 저장소는 값이 없으면
   줄째 빼는데(절대 규칙 2), 여기는 **"무엇을 해야 하는지 알려 주는
   자리"** 라 비어 있는 것 자체가 안내입니다 — 빼 버리면 위에서
   체크를 눌러도 어디에 쌓이는지가 안 보입니다.
   ⚠️ 자리표시자를 찍는 것과 다릅니다 — 가짜 카드를 깔지 않고
   "위에서 고르시면 여기 쌓입니다" 라고 사실대로 적습니다.

   ⚠️⚠️ **"고르기만 하면 접수되지 않습니다" 를 지우지 마세요** —
   절대 규칙 5 입니다. */
window.PickBasket = function(side){
  var n = amPickCount();
  return '<section class="sec sec-white pkb"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">선택한 서비스</p>'+
      '<h2>고르신 서비스 <b data-pick-n>'+n+'</b>개</h2>'+
      '<p>필요한 것을 모두 고르셨으면 아래에서 한 번에 신청하세요. '+
        '서비스마다 업체는 따로 연결해 드립니다.</p>'+
    '</div>'+
    '<div class="pkb-box">'+
      '<p class="pkb-zero" id="pk-zero"'+(n ? " hidden" : "")+'>'+
        icon("info",16)+' 아직 고르신 서비스가 없습니다. '+
        '위에서 필요한 것을 눌러 주세요 — 여러 개를 함께 고르실 수 있습니다.</p>'+
      '<div id="pk-some"'+(n ? "" : " hidden")+'>'+
        '<ul class="pkb-l" id="pk-list">'+pickRows()+'</ul>'+
      '</div>'+
      /* §5 — 0개면 **비활성 단추와 까닭**입니다 (숨기지 않습니다).
         ⚠️⚠️ 숨겨 두었더니 신청이라는 걸음이 **있는지조차** 안
         보였습니다. 지금은 단추가 자리를 지키고 왜 아직 못 누르는지를
         그 자리에서 말합니다 — 그러면 위로 올라가 고르십니다.
         ⚠️ 태그를 JS 로 바꿔 끼우지 않습니다 (`<a>` ↔ `<button>`).
         둘을 같이 내고 `hidden` 으로 가릅니다 — 바꿔 끼우면 포커스와
         `aria-describedby` 가 끊깁니다. */
      '<div class="pkb-go">'+
        '<a class="btn btn-b btn-lg" id="pk-go-on"'+(n ? "" : " hidden")+
          ' data-pick-go="'+esc(side || "start")+'"'+
          ' href="'+esc(amPickQuoteTo(side))+'">'+
          '<span>선택한 '+n+'개 서비스 견적 신청하기</span>'+icon("arrow",18)+'</a>'+
        '<button class="btn btn-b btn-lg" id="pk-go-off" type="button" disabled'+
          (n ? " hidden" : "")+' aria-describedby="pk-go-why">'+
          '<span>서비스를 먼저 골라 주세요</span>'+'</button>'+
        '<button class="btn btn-o" type="button" id="pk-go-clr"'+(n ? "" : " hidden")+
          ' onclick="pickClear()">전부 해제</button>'+
      '</div>'+
      /* ⚠️⚠️ **문장 한가운데 링크를 박지 마세요.** 처음에 "바로 상담을
         신청" 을 문장 속 링크로 두었더니 높이가 **19px** 이라 누름
         40px 에 걸렸습니다 (전수 점검이 잡았습니다) — CLAUDE.md 가
         "문단 끝에 버튼으로 내놓으세요" 라고 적어 둔 그 자리입니다.
         ⚠️ 그래서 0개일 때 단추가 둘입니다 — 못 누르는 쪽(먼저
         고르세요)과 **누를 수 있는 쪽**(모르시면 바로 상담). 그게
         지금 손님 앞에 실제로 있는 두 갈래입니다. */
      '<div class="pkb-why" id="pk-go-why"'+(n ? " hidden" : "")+'>'+
        '<p>위에서 필요한 것을 하나라도 고르시면 신청하실 수 있습니다. '+
          '<b>무엇이 필요한지 모르시겠으면</b> 고르지 않고 바로 '+
          '상담을 신청하셔도 됩니다.</p>'+
        '<a class="btn btn-o" href="'+esc(amPickQuoteTo(side))+'">'+
          '고르지 않고 바로 상담 신청하기</a>'+
      '</div>'+
    '</div>'+
    /* §3-3 · 절대 규칙 5 — 고르는 것과 신청하는 것을 갈라서 말합니다 */
    '<p class="sec-note">'+icon("info",15)+
      ' 고르기만 하면 저희에게 아무것도 오지 않습니다. '+
      '<b>아래 신청하기를 누르셔야</b> 접수됩니다. '+
      /* ⚠️⚠️ **"이 브라우저에만" 이라고 적지 마세요.** 2026-10-18 로
         로그인하신 분은 **계정에도** 남습니다 (§6-2) — 그대로 두면
         그 줄이 그분께 거짓이 됩니다 (체크리스트 안내와 같은 자리). */
      '선택한 내용은 이 브라우저에 남고, <b>로그인하신 경우</b> '+
      '계정에도 남아 다른 기기에서 이어집니다.</p>'+
  '</div></section>';
};

/* ── 묶음으로 한 번에 고르기 (§11 "추천 서비스") ───────────────────
   > §11 — "추천 서비스: 기존 선택과 관련 있는 추가 서비스를 제안하는
   >  영역." / "각 영역의 역할을 명확하게 분리한다."

   ⚠️⚠️ **`PackBand()` 를 그대로 쓰지 않는 까닭** — 그쪽은 카드마다
   **제 신청 단추**가 있어서, 이 화면에 두면 "신청" 단추가 둘이 됩니다.
   이번 지시서가 없애려는 것이 바로 그 헷갈림입니다 (§0 "무엇을
   눌러야 하는지 즉시 알 수 있어야 한다"). 여기서는 **고르개에 담기만**
   하고, 신청은 아래 한 자리에서 합니다.
   ⚠️ `PackBand()` 와 `packages.js` 는 **한 글자도 안 건드렸습니다** —
   `/closure` · `/transfer` 가 전과 똑같이 씁니다 (§15).

   ⚠️⚠️ **상품이 분류로 모입니다.** 패키지의 상품 다섯이 분류로는 둘일
   수 있습니다 (인터넷 · POS · CCTV · 키오스크가 전부 `it`). 잃는 것이
   없는 까닭은, 신청 화면의 `it` 질문이 **"필요한 것"** 체크로 그 넷을
   그대로 묻기 때문입니다 — 고르는 단계만 줄어듭니다. */
window.PackPickBand = function(side){
  var L = (typeof amPackagesFor === "function") ? amPackagesFor(side) : [];
  L = L.filter(function(p){ return packPickCats(p.key).length; });
  if(!L.length) return "";
  return '<section class="sec sec-gray pkp"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">함께 하시는 것들</p>'+
      '<h2>이런 것들은 보통 같이 하십니다</h2>'+
      '<p>일정이 서로 물려 있어 따로 알아보시면 공사가 끝나고도 '+
        '며칠을 더 기다리게 됩니다. 누르시면 <b>위 선택에 같이 담깁니다.</b></p>'+
    '</div>'+
    '<ul class="pkp-g">'+L.map(PackPickCard).join("")+'</ul>'+
  '</div></section>';
};

/* 패키지 하나가 담게 될 **분류**들 — ⚠️ 상품 id 가 아니라 분류입니다 */
function packPickCats(key){
  var seen = {}, out = [];
  ((typeof amPackageItems === "function") ? amPackageItems(key) : [])
    .forEach(function(o){
      if(!o.cat || seen[o.cat]) return;
      if(!amPickOne(o.cat)) return;        /* 없어진 분류는 거릅니다 */
      seen[o.cat] = 1; out.push(o.cat);
    });
  return out;
}

window.PackPickCard = function(p){
  var cats = packPickCats(p.key);
  var names = cats.map(function(k){ return amPickLabel(amPickOne(k)); });
  return '<li class="tn-'+esc(p.tone || "t7")+'"><div class="pkp-c">'+
    '<span class="ic-t">'+icon(p.icon, 24)+'</span>'+
    '<b class="pkp-n">'+esc(p.name)+'</b>'+
    '<p class="pkp-d">'+esc(p.desc || p.lead || "")+'</p>'+
    '<p class="pkp-l">'+esc(names.join(" · "))+'</p>'+
    '<button class="btn btn-o" type="button" onclick="pickAddPack(\''+esc(p.key)+'\')">'+
      esc(cats.length)+'개 한 번에 고르기'+icon("plus",16)+'</button>'+
  '</div></li>';
};

/* ⚠️ 이미 고르신 것은 **그대로 둡니다** — 다시 눌러도 늘어나지
   않습니다 (§3-2 중복 선택 방지). 몇 개가 더해졌는지 말해 드립니다. */
window.pickAddPack = function(key){
  var ids = amPickGet(), add = 0;
  packPickCats(key).forEach(function(k){
    if(ids.indexOf(k) < 0){ ids.push(k); add++; }
  });
  amPickSet(ids);
  pickPaint();
  toast(add ? (add + "개를 선택에 담았습니다") : "이미 전부 고르신 것입니다");
};

/* ════════════════════════════════════════════════════════════════════
   대표 묶음 + 세부 펼침 — 2026-10-18 "매장 운영 전문관 2차" §4-4

   > §4-4 — "대표 서비스 카드를 누르면 해당 분야의 세부 서비스가
   >  펼쳐지도록 한다 · 세부 서비스를 선택하면 신청 목록에 추가한다 ·
   >  **대표 카테고리 선택과 실제 서비스 선택을 혼동하지 않도록 한다.**"

   ⚠️⚠️ **대표 카드 자신은 체크칸이 아닙니다.** 머리는 **펼치는
   단추**이고, 담기는 것은 펼친 안의 체크칸뿐입니다 — 머리에도 체크를
   달면 "광고·홍보" 와 "플레이스" 가 둘 다 담겨서, 손님은 하나를
   골랐다고 생각하는데 접수에는 둘이 실립니다. 그게 §4-4 가 말한
   그 혼동입니다.
   ⚠️ 분야 전체로 받고 싶으신 분은 펼친 **맨 아래 칸**("어떤 것이
   필요한지 모르겠어요")을 고르십니다 — 지시서 §4-4 의 예시 목록이
   그 칸으로 끝나는 까닭입니다.

   ⚠️⚠️ **펼친 상태를 저장하지 않습니다.** 고르신 것은 저장되고(그래서
   다시 와도 체크가 그대로입니다), 펼침은 화면의 일입니다 — 고르신
   것이 있는 묶음은 **처음부터 펼쳐서** 냅니다.
   ⚠️ 펼치지 않은 묶음의 체크칸도 **DOM 에 그대로 있습니다** (`hidden`
   으로 가립니다). 그래서 `pickPaint()` 가 접힌 것까지 맞춰 주고,
   §4-5 검색도 안을 들여다볼 수 있습니다. 그리지 않으면 검색이
   "에어컨" 을 영영 못 찾습니다.
   ════════════════════════════════════════════════════════════════════ */

/* 검색이 보는 글 — ⚠️ **띄어쓰기를 지웁니다.** 손님은 "에어컨수리"
   처럼 붙여 치시는데, 저희 이름은 "에어컨 수리" 로 띄어 있습니다
   (메인 추천 검색어가 전부 0건이던 그 자리입니다). */
function pickQOf(s){
  var t = [s.easy || "", s.name || "", s.desc || ""];
  /* ⚠️⚠️ **분류 카드는 검색 전용 다른 말(`kw`)과 하위 이름까지
     같이 넣습니다.** 2026-10-20 에 재 보니 창업 고르개에서
     "간판" · "세금" · "포스" 가 전부 **0건**이었습니다 — 거기는
     고르는 단위가 분류 열넷이라 그 낱말이 이름에 없었습니다.
     손님은 분류 이름("인테리어 · 시공")을 모르고 **하려는 일**
     ("간판")을 칩니다. `kw` 는 `catalog.js` 가 이미 들고 있던
     칸이고(포스기 · 간판제작 …), 하위 이름은 그 분류가 실제로
     다루는 것입니다 — **지어낸 말이 아닙니다.**
     ⚠️ 하위 카드는 더 내려갈 것이 없어 건너뜁니다. */
  if(!s.sub){
    var c = (typeof amCat === "function") ? amCat(s.cat) : null;
    if(c && c.kw) t.push(c.kw);
    if(typeof amPickSubs === "function")
      amPickSubs(s.id).forEach(function(x){ t.push(x.easy || ""); t.push(x.name || ""); });
  }
  var j = t.join(" ");
  return (j + " " + j.replace(/\s+/g, "")).toLowerCase();
}

/* 세부 한 줄 — ⚠️ `<label>` 이 통째로 눌립니다 (높이는 `min-height`
   로 48px). 안에 링크를 넣지 마세요. */
/* ⚠️⚠️ **읽어 주는 프로그램에는 이름이 저마다 달라야 합니다.**
   눈으로 보면 어느 카드 안인지 보이지만, 체크칸을 하나씩 훑으면
   카드가 안 읽힙니다 — 2026-10-18 전체 점검에서 **두 가지**가
   걸렸습니다.

   | 무엇 | 어디 |
   |---|---|
   | "어떤 것이 필요한지 모르겠어요" 가 묶음마다 **같은 이름** | 네 전문관 전부 |
   | `가구` · `POS` · `키오스크` · `업소용 장비` 가 **묶음마다 다른 뜻** | 폐업 · 양도양수 |

   뒤엣것은 같은 하위 이름이 **파는 것 · 버리는 것 · 해지하는 것 ·
   승계하는 것**으로 갈리는 자리입니다 (`asset/pos` · `contract/pos` ·
   `it/pos`) — 분류가 다르니 가는 업체도 다릅니다. 겹치는 이름에만
   묶음 이름을 앞에 붙입니다. ⚠️ **보이는 글은 그대로입니다** (전부
   붙이면 읽어 주는 글만 길어집니다). */
function pickDupLabels(G){
  var n = {}, dup = {};
  (G || []).forEach(function(g){
    (g.subs || []).forEach(function(s){
      var k = amPickLabel(s);
      n[k] = (n[k] || 0) + 1;
      if(n[k] > 1) dup[k] = 1;
    });
  });
  return dup;
}

function PickSubRow(s, note, g, dup){
  var on = amPickHas(s.id);
  var id = "pks-" + s.id.replace(/[^a-z0-9]/gi, "-");
  /* 읽어 주는 이름 — 겹치는 것과 "모르겠어요" 에만 묶음 이름을 답니다 */
  var aria = "";
  if(g){
    if(note) aria = g.name + " — " + note;
    else if(dup && dup[amPickLabel(s)]) aria = g.name + " — " + amPickLabel(s);
  }
  /* ⚠️⚠️ **찾는 글이 둘입니다.** 처음에 묶음 이름을 세부 글에 **섞어**
     두었더니 "에어컨" 하나에 수리 아홉 · 청소 일곱이 **전부** 걸렸습니다
     (묶음 설명에 "에어컨" 이 들어 있어서입니다) — 찾는 것이 아니라 묶음을
     통째로 펴 주는 꼴입니다. 반대로 안 섞으면 "세금" 이 **0건** 입니다
     (묶음은 "세금 · 회계" 인데 세부는 "세무사 · 회계 프로그램").
     그래서 **두 번 봅니다** — 세부 글로 먼저 찾고, 하나도 없을 때만
     묶음 글로 찾습니다 (`pickFind()`). 둘 다 재 보고 정했습니다. */
  return '<li data-pick-q="'+esc(pickQOf(s))+'"'+
    (g ? ' data-pick-gq="'+esc(pickQOf({ easy:g.name, name:g.lead }))+'"' : "")+'>'+
    '<label class="pks-r'+(note ? " pks-any" : "")+(on ? " is-on" : "")+
      '" for="'+esc(id)+'">'+
      '<input type="checkbox" id="'+esc(id)+'" class="pk-ck"'+
        ' data-pick="'+esc(s.id)+'"'+(on ? " checked" : "")+
        (aria ? ' aria-label="'+esc(aria)+'"' : "")+
        ' onchange="pickToggle(\''+esc(s.id)+'\', this)">'+
      '<span class="pks-n"><b>'+esc(note || amPickLabel(s))+'</b>'+
        (note ? '<i>상담하면서 정하겠습니다</i>'
              : (s.easy && s.easy !== s.name ? '<i>'+esc(s.name)+'</i>' : ""))+
      '</span>'+
    '</label></li>';
}

/* ⚠️ `G.map(PickGroupCard)` 가 **세 번째 인자로 목록 전체**를 줍니다 —
   그래서 겹치는 이름을 여기서 셀 수 있습니다 (묶음 밖에서 따로 넘기면
   부르는 자리가 둘이 되고 한쪽만 고치게 됩니다). */
window.PickGroupCard = function(g, i, all){
  var pid = "opg-p-" + g.key;
  var dup = pickDupLabels(all || [g]);
  /* 고르신 것이 있으면 **처음부터 펼칩니다** */
  var open = g.ids.some(amPickHas);
  var art = (typeof hasIconArt === "function" && g.ia && hasIconArt(g.ia))
    ? iconArt(g.ia, 52) : icon("check", 26);
  var subs = g.subs.map(function(s){ return PickSubRow(s, "", g, dup); }).join("");
  return '<li class="tn-'+esc(g.tone)+'"><div class="opg-c">'+
    '<button class="opg-h'+(open ? " is-open" : "")+'" type="button"'+
      ' aria-expanded="'+(open ? "true" : "false")+'" aria-controls="'+esc(pid)+'"'+
      ' onclick="pickGroupToggle(\''+esc(g.key)+'\', this)">'+
      '<span class="opg-i ia-t">'+art+'</span>'+
      '<span class="opg-t"><b>'+esc(g.name)+'</b><i>'+esc(g.lead)+'</i></span>'+
      /* §5-2 — 색만으로 표시하지 않습니다. 몇 개 골랐는지 글로 냅니다. */
      '<span class="opg-n" data-pick-g="'+esc(g.ids.join(","))+'" hidden><i></i></span>'+
      '<span class="opg-x" aria-hidden="true">'+icon("chevd",18)+'</span>'+
    '</button>'+
    '<div class="opg-p" id="'+esc(pid)+'"'+(open ? "" : " hidden")+'>'+
      '<ul class="opg-l">'+subs+
        PickSubRow(g.any, "어떤 것이 필요한지 모르겠어요", g, dup)+'</ul>'+
      /* §4-4 "자세히 보기" — ⚠️ 머리 단추 **밖**입니다 (단추 안의
         링크는 브라우저가 쪼갭니다). */
      '<p class="opg-go"><a href="'+esc(g.any.to)+'">'+
        esc(g.name)+' 자세히 보기'+icon("arrow",15)+'</a></p>'+
    '</div>'+
  '</div></li>';
};

/* ⚠️ 다시 그리지 않습니다 — 고르신 체크가 되돌아가고 보던 자리를
   잃습니다 (`foldToggle()` 과 같은 규칙). */
window.pickGroupToggle = function(key, btn){
  var p = document.getElementById("opg-p-" + key);
  if(!p || !btn) return;
  var open = p.hidden;
  p.hidden = !open;
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.classList.toggle("is-open", open);
};

/* ── §4-5 찾기 ────────────────────────────────────────────────────
   > §4-5 — "검색 또는 간단한 필터를 제공한다 · **복잡한 다중 필터는
   >  만들지 않는다.**"

   그래서 적는 칸 **하나**입니다. 분야 · 지역 · 가격 거르개를 만들지
   않았습니다 — 어르신이 세 칸을 고르고 나서야 결과를 보는 화면이
   됩니다.

   ⚠️⚠️ **대표 묶음 안과 전체 목록을 같이 뒤집니다.** 둘을 따로 두면
   "에어컨" 을 쳤을 때 전체 목록에는 `수리 · 유지보수` 만 나오고
   정작 "에어컨 수리" 는 접힌 묶음 안에 숨어 있습니다. */
window.pickFind = function(q){
  q = String(q || "").trim().toLowerCase().replace(/\s+/g, "");
  var rows = [].slice.call(document.querySelectorAll("#pkb-find [data-pick-q]"));
  /* ① 세부 글로 먼저 셉니다 */
  var hit = 0;
  rows.forEach(function(el){
    if(q && (el.getAttribute("data-pick-q") || "").indexOf(q) >= 0) hit++;
  });
  /* ② 하나도 없을 때만 묶음 글로 (바로 위 PickSubRow 주석) */
  var useG = !!q && !hit;
  rows.forEach(function(el){
    var t = useG ? (el.getAttribute("data-pick-gq") || "")
                 : (el.getAttribute("data-pick-q") || "");
    var on = !q || t.indexOf(q) >= 0;
    el.hidden = !on;
    if(on && q && useG) hit++;
  });

  /* 묶음은 **맞는 것이 있으면 펼칩니다.** 비우면 원래대로 —
     고르신 것이 있는 묶음만 열려 있습니다. */
  [].slice.call(document.querySelectorAll(".opg-c")).forEach(function(c){
    var p = c.querySelector(".opg-p"), b = c.querySelector(".opg-h");
    if(!p || !b) return;
    var any = [].slice.call(p.querySelectorAll("[data-pick-q]"))
      .some(function(el){ return !el.hidden; });
    var picked = [].slice.call(p.querySelectorAll("[data-pick]"))
      .some(function(el){ return el.checked; });
    var open = q ? any : picked;
    p.hidden = !open;
    b.setAttribute("aria-expanded", open ? "true" : "false");
    b.classList.toggle("is-open", open);
    /* 맞는 것이 하나도 없는 묶음은 **칸째 숨깁니다** — 머리만 남겨
       두면 "여기 있나" 하고 눌러 보게 됩니다 */
    var li = c.parentElement;
    if(li) li.hidden = !!q && !any;
  });

  /* 전체 목록(접힘)은 맞는 것이 있으면 **열어 둡니다** — 안 열면
     검색이 찾았다고만 하고 아무것도 안 보입니다.
     ⚠️⚠️ **id 를 박지 않습니다.** 전문관마다 접힌 목록의 id 가 다르고
     (`pkb-rest` · `st-rest`), 하나만 적어 두면 **다른 전문관에서는
     검색이 찾았다고만 하고 아무것도 안 열립니다** — 에러도 안 나고
     화면도 멀쩡합니다. 안에 있는 것을 전부 엽니다. */
  if(q) [].slice.call(document.querySelectorAll("#pkb-find .is-fold-all[id]"))
    .forEach(function(el){ pickFoldOpen(el.id); });

  var r = document.getElementById("pkb-r");
  if(r){
    r.hidden = !q;
    r.textContent = hit ? (hit + "개 찾았습니다")
      : "찾으시는 말로는 나오지 않습니다 — 아래 전체 목록에서 골라 보세요.";
    r.classList.toggle("is-zero", !hit);
  }
};

/* 접힌 칸을 열어 둡니다 (단추 글자 · aria 까지) */
function pickFoldOpen(id){
  var el = document.getElementById(id);
  if(!el || !el.classList.contains("is-fold-all")) return;
  var btn = document.querySelector('[aria-controls="' + id + '"]');
  if(btn) foldToggle(id, btn, "is-fold-all");
  else el.classList.remove("is-fold-all");
}

/* ── B. 필요한 서비스 선택 (§2-B · §4) ───────────────────────────
   ⚠️⚠️ **이 화면에서 서비스를 고르는 자리는 여기 하나입니다** (§2 —
   "서비스를 실제로 선택하는 영역은 페이지에서 하나만 운영한다").
   전에 `/operation` 은 운영 서비스관 여섯 · 업종별 차례 · 운영 과제
   스물넷 · 패키지가 **같은 분류를 네 군데서** 내고 있었고, 그중
   **어느 것도 고를 수 없었습니다** (전부 링크였습니다). */
window.PickGroupBand = function(hallKey, side){
  var G = (typeof amPickGroups === "function") ? amPickGroups(hallKey) : [];
  if(!G.length) return "";
  /* 전체 목록 — 묶음이 이미 가리키는 분류는 뺍니다 (§4-5 "나머지") */
  var inG = {};
  G.forEach(function(g){
    g.ids.forEach(function(id){ inG[amPickSplit(id).cat] = 1; });
  });
  var rest = ((typeof amPickHallCats === "function") ? amPickHallCats(hallKey) : [])
    .filter(function(s){ return !inG[s.id]; });
  /* ⚠️⚠️ **빠른 선택은 묶음에서 빼지 않습니다.** 빼면 "분야별로 보기"
     가 그 분야의 전부가 아니게 됩니다. 같은 칸이 두 자리에 보여도
     `pickPaint()` 가 화면의 **모든 `[data-pick]`** 을 맞추기 때문에
     둘이 같이 켜지고, 바구니에는 한 번만 들어갑니다
     (`amPickGet()` 이 중복을 걸러 냅니다). 눌러서 확인했습니다. */
  var quick = (typeof amPickQuick === "function") ? amPickQuick(hallKey) : [];

  return '<section class="sec sec-ivory pkb-sel" id="pick"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">필요한 서비스 선택</p>'+
      '<h2>무엇이 필요하신가요?</h2>'+
      '<p>칸을 누르면 아래에 쌓입니다. <b>여러 개를 함께</b> 고르실 수 있고, '+
        '한 번만 적어 보내시면 서비스마다 업체를 찾아 드립니다.</p>'+
    '</div>'+

    '<div id="pkb-find">'+
      /* §4-5 — 적는 칸 하나 */
      '<div class="pkf">'+
        '<label class="pkf-l" for="pkf-q">찾으시는 것을 적어 보세요</label>'+
        '<span class="pkf-w">'+icon("search",18)+
          '<input class="pkf-i" id="pkf-q" type="search" autocomplete="off"'+
            ' placeholder="예: 에어컨, 세금, 포스, 전단지"'+
            ' oninput="pickFind(this.value)">'+
        '</span>'+
        '<p class="pkf-r" id="pkb-r" hidden></p>'+
      '</div>'+

      /* ── 빠른 선택 여섯 (PART 2-2 A · 5-3 · 6-2-B) ───────────
         ⚠️⚠️ **재 보니 첫 화면에 고를 수 있는 칸이 0개였습니다** —
         묶음이 전부 접힌 채 서서, 운영은 그 아래 **운영 체크리스트**
         칸이 먼저 보이고 폐업 · 양도양수는 보이는 칸이 하나도
         없었습니다. 필요한 것을 이미 아시는 분이 **묶음을 먼저
         펼쳐야** 고를 수 있는 꼴이었습니다.
         ⚠️ 없으면 줄째 뺍니다 (절대 규칙 2 — 빈 머리말을 찍지
         않습니다). */
      (quick.length
        ? '<div class="pkq">'+
            '<p class="pkq-l">필요한 것이 정해져 있으시면 여기서 '+
              '바로 고르세요</p>'+
            '<ul class="pk-g pk-g-q">'+quick.map(PickCard).join("")+'</ul>'+
            '<p class="pkq-n">여기 없는 것은 아래 분야별 목록에 '+
              '전부 있습니다.</p>'+
          '</div>'
        : "")+

      '<ul class="opg-g">'+G.map(PickGroupCard).join("")+'</ul>'+

      (rest.length
        ? '<div class="pkb-rest-w">'+
            FoldAll("pkb-rest", "이 밖의 서비스도 보기 ("+rest.length+"개)", "접기")+
            '<ul class="pk-g pk-g2 is-fold-all" id="pkb-rest">'+
              rest.map(PickCard).join("")+'</ul>'+
          '</div>'
        : "")+
    '</div>'+
  '</div></section>';
};

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
  if(!ids || !ids.length){ amDel(PKEY); return []; }
  amSet(PKEY, { ids:ids, at:Date.now() });
  return ids;
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

  /* ③ ④ 폰 하단 띠 · 단추 */
  var bar = document.getElementById("pk-bar");
  if(bar){
    bar.hidden = n === 0;
    var go = document.getElementById("pk-bar-go");
    if(go){
      go.setAttribute("href", amPickQuoteTo());
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
  [].slice.call(document.querySelectorAll("[data-pick-go]")).forEach(function(a){
    a.setAttribute("href", amPickQuoteTo());
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
window.amPickQuoteTo = function(){
  var ids = amPickGet();
  var q = ["side=start"];
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
  return '<li class="tn-'+esc(s.tone)+'">'+
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
      '<span class="pk-t">'+
        '<b>'+esc(amPickLabel(s))+'</b>'+
        (s.easy && s.easy !== s.name ? '<i>'+esc(s.name)+'</i>' : "")+
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
window.PickBar = function(){
  var n = amPickCount();
  return '<div class="pk-bar" id="pk-bar"'+(n ? "" : " hidden")+'>'+
    '<p class="pk-bar-t">선택한 서비스 <b data-pick-n>'+n+'</b>개</p>'+
    '<a class="btn btn-b" id="pk-bar-go" href="'+esc(amPickQuoteTo())+'">'+
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
window.PickBasket = function(){
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
        '<div class="pkb-go">'+
          '<a class="btn btn-b btn-lg" data-pick-go href="'+esc(amPickQuoteTo())+'">'+
            '<span>선택한 '+n+'개 서비스 견적 신청하기</span>'+icon("arrow",18)+'</a>'+
          '<button class="btn btn-o" type="button" onclick="pickClear()">전부 해제</button>'+
        '</div>'+
      '</div>'+
    '</div>'+
    /* §3-3 · 절대 규칙 5 — 고르는 것과 신청하는 것을 갈라서 말합니다 */
    '<p class="sec-note">'+icon("info",15)+
      ' 고르기만 하면 저희에게 아무것도 오지 않습니다. '+
      '<b>아래 신청하기를 누르셔야</b> 접수됩니다. '+
      '선택한 내용은 이 브라우저에만 남고 서버로 보내지 않습니다.</p>'+
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

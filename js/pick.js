/* ════════════════════════════════════════════════════════════════════
   고르신 서비스 — **저장만 남았습니다** (2026-10-31)

   ⚠️⚠️ **고르는 화면을 전부 지웠습니다.** 사장님 지시("그냥 인수인계
   자료를 다 지워 · 중고폰 쪽은 살려두고")로 전문관 넷이 내려가면서
   `[data-pick]` 체크칸이 **사이트에 한 곳도 없습니다.** 지운 덩이 —

     amPickAt · PickCard · pickRows · PickAside · PickBar · PickBasket
     PackPickBand · packPickCats · PackPickCard · pickAddPack
     pickQOf · pickDupLabels · PickSubRow · PickGroupCard
     pickGroupToggle · pickFind · pickFoldOpen · PickGroupBand

   ⚠️⚠️ **저장 층은 남겼습니다** — `/quote` 가 아직 읽고 비웁니다
   (STEP 01 "고르신 서비스"), `js/state.js` 가 회원 계정에 올려 둔 것을
   내려받습니다. **앞서 쓰시던 분의 브라우저와 계정에는 값이 그대로
   남아 있습니다** — 저장 층을 지우면 그것을 읽을 길도 지울 길도
   없어집니다 (`am.saved.v1` 을 남겨 둔 것과 같은 까닭입니다).

   ⚠️⚠️ **담는 것은 서비스 id 뿐입니다.** 성함 · 연락처 · 적으신 글은
   한 글자도 안 담습니다 — 가게 컴퓨터는 여러 사람이 씁니다.
   ⚠️⚠️ **고르는 것이 신청이 아닙니다.** 고르기만 하고 닫으면 저희에게
   아무것도 오지 않습니다 (절대 규칙 5).
   ⚠️ 꺼내 보시려면 `git show 6d85a17:js/pick.js`.
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
   ⚠️⚠️ **2026-10-31 — 그릴 것이 거의 없어졌습니다.** 고르는 카드 ·
   바구니 · 오른쪽 패널 · 폰 하단 띠가 전부 내려가서, 전에 넷을 맞추던
   백 줄 가운데 **지금 실제로 닿는 것만** 남겼습니다.
   ⚠️ 덩이를 지우지 않고 **줄인** 까닭 — `/quote` 가 보낸 뒤에
   (`quoteAfterSend`) 이것을 부르고 `js/state.js` 가 계정에서 내려받은
   뒤 이것을 부릅니다. 없으면 그 자리에서 던집니다.
   ⚠️⚠️ 고르는 화면을 되살리시면 `git show 6d85a17:js/pick.js` 의
   것으로 되돌리세요 — 바꾸던 것은 **넷**이었습니다 (카드의 체크 ·
   개수 · 바구니 목록 · 신청 단추의 주소). 하나라도 빠뜨리면 "고른
   것과 넘어가는 것이 다릅니다" 가 되고 그게 제일 나쁩니다. */
window.pickPaint = function(){
  var ids = amPickGet(), n = ids.length;

  /* 체크칸 — 지금 화면에 하나도 없지만, 되살리는 날 이 줄이
     먼저 돕니다 (저장된 값과 화면을 맞추는 유일한 자리). */
  [].slice.call(document.querySelectorAll("[data-pick]")).forEach(function(el){
    var on = ids.indexOf(el.getAttribute("data-pick")) >= 0;
    if(el.checked !== on) el.checked = on;
  });

  /* 개수 — 여러 자리에 같은 수가 나옵니다 */
  [].slice.call(document.querySelectorAll("[data-pick-n]")).forEach(function(el){
    el.textContent = String(n);
  });

  /* ⚠️⚠️ 0개면 **줄째 가립니다** — 개수만 0 으로 고치면 "고르신
     서비스 0개" 와 죽은 신청 단추가 그대로 섭니다 (절대 규칙 2).
     붙이는 쪽은 `display:none` 이 걸리는 꼴이라야 합니다 — flex ·
     grid 인 칸은 작성자 CSS 가 브라우저 기본 `[hidden]` 을 이깁니다. */
  [].slice.call(document.querySelectorAll("[data-pick-row]")).forEach(function(el){
    el.hidden = n === 0;
  });

  /* ⚠️⚠️ **띠가 없는 화면에서도 부릅니다.** `if(bar)` 안에 두었더니
     고르신 뒤 띠가 없는 화면으로 가면 `--pk-bar-h` 가 **77px 로 남아**
     모든 화면 아래에 빈 자리가 생겼습니다 — 에러도 안 나고 가로
     스크롤도 안 나서 **재 보고** 알았습니다. */
  pickPad();

  /* 본문 안의 신청 단추 — ⚠️ 쪽은 `data-pick-go` 의 **값**으로
     옵니다 (`data-pick-go="shop"`). */
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

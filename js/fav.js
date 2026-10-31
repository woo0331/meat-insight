/* ════════════════════════════════════════════════════════════════════
   찜한 중고폰 (2026-10-31 최종 확정 디자인 §2 · §6)

   시안이 **두 자리**에 하트를 그려 두었습니다 — 헤더 오른쪽과
   상품 카드 오른쪽 위. 그 둘이 같은 값을 봅니다.

   ⚠️⚠️ **담는 것은 상품 id 뿐입니다.** 성함 · 연락처 · 적으신 글은
   한 글자도 안 담습니다 — 가게 컴퓨터는 여러 사람이 씁니다
   (`am.pick.v1` 과 같은 규칙).
   ⚠️⚠️ **찜은 예약도 구매도 아닙니다.** 담아 두기만 하면 저희에게
   아무것도 오지 않습니다 — `/my` 의 찜 칸이 그 줄을 적습니다
   (절대 규칙 5).
   ⚠️⚠️ **없어진 상품은 걸러 냅니다.** 지금은 예시 여섯이 들어 있고,
   실제 재고가 올라오면 예시가 통째로 사라집니다 — 안 걸러 내면
   눌러서 **없는 상품 화면**으로 갑니다 (`amPickGet()` 이 없는 서비스를
   걸러 내는 것과 같은 자리입니다).

   ⚠️ 서버로 보내지 않습니다. 이 브라우저 안에만 있습니다.
   ════════════════════════════════════════════════════════════════════ */

var FAVKEY = "am.fav.v1";

/* ⚠️ `amShopOne()` 이 없는 id 에 null 을 돌려줍니다 — 그 한 곳으로만
   걸러서, 목록 화면과 **같은 규칙**을 씁니다 (두 곳에 적으면 찜에만
   나오는 상품이 생깁니다). */
window.amFavIds = function(){
  var raw = (typeof amGet === "function") ? amGet(FAVKEY, null) : null;
  var ids = Array.isArray(raw) ? raw : ((raw && raw.ids) || []);
  var seen = {}, out = [];
  ids.forEach(function(id){
    if(typeof id !== "string" || seen[id]) return;
    if(typeof window.amShopOne === "function" && !window.amShopOne(id)) return;
    seen[id] = 1; out.push(id);
  });
  return out;
};
window.amFavHas = function(id){ return amFavIds().indexOf(id) >= 0; };
window.amFavN   = function(){ return amFavIds().length; };

/* ⚠️ 저장이 막힌 브라우저(사파리 비공개)에서는 `amSet()` 이 조용히
   실패합니다 — 그때 하트만 켜 두면 **담겼다고 거짓말**하는 것이라,
   다시 읽어서 실제로 담겼을 때만 칠합니다. */
window.amFavToggle = function(id){
  if(!id) return;
  var ids = amFavIds(), i = ids.indexOf(id);
  if(i >= 0) ids.splice(i, 1); else ids.unshift(id);
  if(typeof amSet === "function") amSet(FAVKEY, ids);
  amFavPaint();
  if(typeof toast === "function"){
    var on = amFavHas(id);
    toast(on ? "찜에 담았습니다 — 내 기록에서 보실 수 있습니다."
             : "찜에서 뺐습니다.");
  }
};
window.amFavClear = function(){
  if(!window.confirm("찜한 중고폰을 모두 지울까요? 되돌릴 수 없습니다.")) return;
  if(typeof amDel === "function") amDel(FAVKEY);
  amFavPaint();
  if(typeof go === "function") go("/my", { keepScroll:true });
};

/* 화면에 있는 하트를 **전부** 맞춥니다 — 헤더의 수와 카드의 하트가
   한 번에 갑니다. ⚠️ 하나라도 빠뜨리면 담긴 것과 보이는 것이
   달라집니다 (`pickPaint()` 로 겪은 자리). */
window.amFavPaint = function(){
  var n = amFavN();
  [].forEach.call(document.querySelectorAll("[data-fav]"), function(b){
    var on = amFavHas(b.getAttribute("data-fav"));
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on ? "true" : "false");
    b.setAttribute("aria-label", (on ? "찜 빼기" : "찜하기"));
    if(typeof icon === "function") b.innerHTML = icon(on ? "heartf" : "heart", 19);
  });
  [].forEach.call(document.querySelectorAll("[data-fav-n]"), function(e){
    e.textContent = n ? String(n) : "";
    if(n) e.removeAttribute("hidden"); else e.setAttribute("hidden", "");
  });
};

/* 카드 오른쪽 위에 올리는 하트 — ⚠️ **카드가 `<a>` 라서 `<button>` 을
   그 안에 넣으면 안 됩니다** (브라우저가 쪼갭니다). 카드 **밖**에
   두고 CSS 로 겹칩니다. */
window.FavBtn = function(id){
  return '<button class="favb" type="button" data-fav="'+ esc(id) +'" '+
    'aria-pressed="false" aria-label="찜하기" '+
    'onclick="amFavToggle(\''+ esc(id) +'\')">'+ icon("heart", 19) +'</button>';
};

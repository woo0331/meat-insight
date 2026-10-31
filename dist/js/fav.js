

var FAVKEY = "am.fav.v1";

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

window.FavBtn = function(id){
  return '<button class="favb" type="button" data-fav="'+ esc(id) +'" '+
    'aria-pressed="false" aria-label="찜하기" '+
    'onclick="amFavToggle(\''+ esc(id) +'\')">'+ icon("heart", 19) +'</button>';
};

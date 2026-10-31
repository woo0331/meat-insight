

var PKEY = "am.pick.v1";

window.amPickGet = function(){
  var raw = amGet(PKEY, null);
  var ids = (raw && raw.ids) ? raw.ids : (Array.isArray(raw) ? raw : []);
  var seen = {}, out = [];
  ids.forEach(function(id){
    if(seen[id]) return;
    if(!amPickOne(id)) return;
    seen[id] = 1; out.push(id);
  });
  return out;
};

window.amPickSet = function(ids){
  if(!ids || !ids.length) amDel(PKEY);
  else amSet(PKEY, { ids:ids, at:Date.now() });

  if(typeof amStateTouch === "function") amStateTouch("pick");
  return ids || [];
};

window.amPickHas   = function(id){ return amPickGet().indexOf(id) >= 0; };
window.amPickCount = function(){ return amPickGet().length; };

window.amPickList = function(){
  return amPickGet().map(amPickOne).filter(Boolean);
};

window.pickToggle = function(id, el){
  var ids = amPickGet(), i = ids.indexOf(id);
  var on = el ? !!el.checked : (i < 0);
  if(on && i < 0) ids.push(id);
  if(!on && i >= 0) ids.splice(i, 1);
  amPickSet(ids);
  pickPaint();
};

window.pickDel = function(id){
  var ids = amPickGet(), i = ids.indexOf(id);
  if(i >= 0){ ids.splice(i, 1); amPickSet(ids); }
  pickPaint();
};

window.pickClear = function(){
  if(amPickCount() && !confirm("고르신 서비스를 전부 해제합니다. 되돌릴 수 없습니다."))
    return;
  amPickSet([]);
  pickPaint();
  toast("선택을 전부 해제했습니다");
};

window.pickPaint = function(){
  var ids = amPickGet(), n = ids.length;

  [].slice.call(document.querySelectorAll("[data-pick]")).forEach(function(el){
    var on = ids.indexOf(el.getAttribute("data-pick")) >= 0;
    if(el.checked !== on) el.checked = on;
    var card = el.closest ? el.closest(".pk-c") : null;
    if(card) card.classList.toggle("is-on", on);
  });

  [].slice.call(document.querySelectorAll("[data-pick-n]")).forEach(function(el){
    el.textContent = String(n);
  });

  [].slice.call(document.querySelectorAll("[data-pick-row]")).forEach(function(el){
    el.hidden = n === 0;
  });

  pickPad();

  [].slice.call(document.querySelectorAll("[data-pick-go]")).forEach(function(a){
    a.setAttribute("href", amPickQuoteTo(a.getAttribute("data-pick-go")));
    var t = a.querySelector("span");
    if(t) t.textContent = n ? ("선택한 " + n + "개 서비스 견적 신청하기")
                            : "견적 신청하기";
  });
};

function pickPad(){
  var bar = document.getElementById("pk-bar");
  var h = (bar && !bar.hidden) ? bar.getBoundingClientRect().height : 0;
  document.documentElement.style.setProperty("--pk-bar-h", Math.round(h) + "px");
}

window.amPickQuoteTo = function(side){
  var ids = amPickGet();

  var q = ["side=" + encodeURIComponent(side || "start")];
  if(ids.length) q.push("sv=" + encodeURIComponent(ids.join(",")));
  return "/quote?" + q.join("&");
};


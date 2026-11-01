

var AD_NAV = [

  { k:"sales",  name:"영업 작업대", of:["#sl"], grp:"day" },
  { k:"intake", name:"접수 · 배정", of:[".rq-s-rq"], grp:"day" },
  { k:"deal",   name:"계약 · 정산",
    of:[".rq-s-mn", ".rq-s-fee", ".rq-s-set"], grp:"day" },
  { k:"pv",     name:"업체",
    of:[".rq-s-ap", ".rq-s-pv"], grp:"day" },
  { k:"stock",  name:"직접 매입 재고", of:[".rq-s-dv"], grp:"day" },

  { k:"health", name:"접수 상태",
    of:[".ad-s-1", ".ad-s-2"], grp:"boss" },
  { k:"sort",   name:"접수 정리",
    of:[".ad-sub", ".ad-s-3", ".ad-s-4", ".ad-s-5", ".ad-no"], grp:"boss" },
  { k:"invite", name:"업체 초대 글", of:[".ad-s-6"], grp:"boss" },
  { k:"offer",  name:"수익상품", of:[".ad-s-7"], grp:"boss" },

  { k:"pvnew",  name:"제휴업체 줄 만들기", of:[".ad-s-8"], grp:"boss" }
];

var AD_NAV_KEY = "am.admin.tab.v1";

var AD_NAV_OFF = false;

var AD_NAV_AT = AD_NAV[0].k;

function adNavLoad(){
  try{
    var v = localStorage.getItem(AD_NAV_KEY);
    for(var i = 0; i < AD_NAV.length; i++) if(AD_NAV[i].k === v) return v;
  }catch(e){}
  return AD_NAV[0].k;
}
function adNavSave(k){ try{ localStorage.setItem(AD_NAV_KEY, k); }catch(e){} }

function adNavHas(it){
  for(var i = 0; i < it.of.length; i++)
    if(document.querySelector(".ad-main " + it.of[i])) return true;
  return false;
}
function adNavLive(){
  var out = [];
  for(var i = 0; i < AD_NAV.length; i++)
    if(adNavHas(AD_NAV[i])) out.push(AD_NAV[i]);
  return out;
}

function adNavPaint(){
  var main = document.querySelector(".ad-main");
  var nav  = document.getElementById("ad-nav");
  if(!main || !nav) return;

  if(AD_NAV_OFF){
    nav.innerHTML = ""; main.removeAttribute("data-tab");
    var off = main.querySelectorAll(".ad-off");
    for(var z = 0; z < off.length; z++) off[z].classList.remove("ad-off");
    return;
  }

  var live = adNavLive();

  if(!live.length){ nav.innerHTML = ""; main.removeAttribute("data-tab"); return; }

  var ok = false;
  for(var i = 0; i < live.length; i++) if(live[i].k === AD_NAV_AT) ok = true;
  if(!ok) AD_NAV_AT = live[0].k;

  var h = "", lastGrp = "";
  for(var j = 0; j < live.length; j++){
    var it = live[j];
    if(lastGrp && it.grp !== lastGrp)
      h += '<span class="ad-nav-sep" aria-hidden="true"></span>';
    lastGrp = it.grp;
    h += '<button type="button" class="ad-nav-b' +
      (it.k === AD_NAV_AT ? " is-on" : "") + '"' +
      ' aria-pressed="' + (it.k === AD_NAV_AT ? "true" : "false") + '"' +
      ' onclick="adNavGo(\'' + it.k + '\')">' + esc(it.name) + '</button>';
  }
  nav.innerHTML = h;
  main.setAttribute("data-tab", AD_NAV_AT);

  var on = {};
  for(var m = 0; m < live.length; m++) if(live[m].k === AD_NAV_AT)
    for(var n = 0; n < live[m].of.length; n++) on[live[m].of[n]] = 1;

  var all = {};
  for(var p = 0; p < AD_NAV.length; p++)
    for(var q = 0; q < AD_NAV[p].of.length; q++) all[AD_NAV[p].of[q]] = 1;

  for(var sel in all){
    var es = main.querySelectorAll(sel);
    for(var r = 0; r < es.length; r++)
      es[r].classList.toggle("ad-off", !on[sel]);
  }
}
window.adNavPaint = adNavPaint;

function adNavGo(k){
  for(var i = 0; i < AD_NAV.length; i++) if(AD_NAV[i].k === k){
    AD_NAV_AT = k; adNavSave(k); adNavPaint();
    try{ window.scrollTo(0, 0); }catch(e){}
    return true;
  }
  return false;
}
window.adNavGo = adNavGo;

function adNavFor(sel){
  if(!sel) return false;
  for(var i = 0; i < AD_NAV.length; i++)
    for(var j = 0; j < AD_NAV[i].of.length; j++){
      var o = AD_NAV[i].of[j];

      if(sel === o || sel.indexOf(o) === 0 || sel.indexOf(o + " ") >= 0 ||
         sel.indexOf(" " + o) >= 0)
        return adNavGo(AD_NAV[i].k);
    }

  if(sel.indexOf("#rq") === 0) return adNavGo("intake");
  if(sel.indexOf("#ad") === 0) return adNavGo("sort");
  if(sel.indexOf("#sl") === 0) return adNavGo("sales");
  return false;
}
window.adNavFor = adNavFor;

function adNavCheck(){
  var main = document.querySelector(".ad-main");
  if(!main) return [];
  var known = {};
  for(var i = 0; i < AD_NAV.length; i++)
    for(var j = 0; j < AD_NAV[i].of.length; j++){
      var es = main.querySelectorAll(AD_NAV[i].of[j]);
      for(var k = 0; k < es.length; k++) known[es[k].className] = 1;
    }
  var lost = [];
  var secs = main.querySelectorAll("#rq > section, #sl > section, #ad > section");
  for(var m = 0; m < secs.length; m++){
    var hit = false;
    for(var n = 0; n < AD_NAV.length; n++)
      for(var p = 0; p < AD_NAV[n].of.length; p++)
        if(secs[m].matches(AD_NAV[n].of[p]) ||
           (AD_NAV[n].of[p].charAt(0) === "#" &&
            secs[m].parentNode === document.querySelector(AD_NAV[n].of[p]))) hit = true;
    if(!hit) lost.push((secs[m].className || secs[m].id || "?") + " — " +
      ((secs[m].querySelector("h2") || {}).textContent || "").trim().slice(0, 20));
  }
  return lost;
}
window.adNavCheck = adNavCheck;

function adNavOff(){ AD_NAV_OFF = true; adNavPaint(); }
window.adNavOff = adNavOff;

(function(){
  ["rqDraw", "slDraw"].forEach(function(n){
    var f = window[n];
    if(typeof f !== "function") return;
    window[n] = function(){
      var out = f.apply(this, arguments);
      try{ adNavPaint(); }catch(e){ console.warn("[adnav]", e); }
      return out;
    };
  });
})();

(function(){
  function go(){
    AD_NAV_AT = adNavLoad();
    adNavPaint();

    var n = 0;
    var t = setInterval(function(){
      adNavPaint();
      if(++n > 20) clearInterval(t);
    }, 300);
  }
  if(document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", go);
  else go();
})();

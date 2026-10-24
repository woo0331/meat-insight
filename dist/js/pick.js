

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

window.amPickAt = function(){
  var raw = amGet(PKEY, null);
  return (raw && raw.at) ? raw.at : 0;
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
    var card = el.closest(".pk-c");
    if(card) card.classList.toggle("is-on", on);
  });

  [].slice.call(document.querySelectorAll("[data-pick-g]")).forEach(function(el){
    var want = (el.getAttribute("data-pick-g") || "").split(",");
    var k = 0;
    want.forEach(function(id){ if(id && ids.indexOf(id) >= 0) k++; });
    el.hidden = !k;
    var t = el.querySelector("i");
    if(t) t.textContent = k + "개 선택";
  });

  [].slice.call(document.querySelectorAll("[data-pick-n]")).forEach(function(el){
    el.textContent = String(n);
  });

  var box = document.getElementById("pk-list");
  if(box) box.innerHTML = pickRows();
  var zero = document.getElementById("pk-zero");
  if(zero) zero.hidden = n > 0;
  var some = document.getElementById("pk-some");
  if(some) some.hidden = n === 0;

  ["pk-go-on", "pk-go-clr"].forEach(function(id){
    var e = document.getElementById(id);
    if(e) e.hidden = n === 0;
  });
  ["pk-go-off", "pk-go-why"].forEach(function(id){
    var e = document.getElementById(id);
    if(e) e.hidden = n > 0;
  });

  var ab = document.getElementById("pka-list");
  if(ab) ab.innerHTML = pickRows();
  var az = document.getElementById("pka-zero");
  if(az) az.hidden = n > 0;
  ["pka-go", "pka-clr"].forEach(function(id){
    var e = document.getElementById(id);
    if(e) e.hidden = n === 0;
  });

  var bar = document.getElementById("pk-bar");
  if(bar) bar.hidden = n === 0;
  ["pk-bar-go", "pka-go"].forEach(function(id){
    var go = document.getElementById(id);
    if(!go) return;
    go.setAttribute("href", amPickQuoteTo(go.getAttribute("data-side")));

    var t = go.querySelector("span");
    if(t) t.textContent = "선택한 " + n + "개 서비스 견적 신청하기";
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

window.PickCard = function(s){
  var on = amPickHas(s.id);
  var id = "pk-" + s.id.replace(/[^a-z0-9]/gi, "-");
  var art = (typeof hasIconArt === "function" && s.ia && hasIconArt(s.ia))
    ? iconArt(s.ia, 48) : icon(s.icon || "check", 26);

  return '<li class="tn-'+esc(s.tone)+'" data-pick-q="'+esc(pickQOf(s))+'">'+
    '<label class="pk-c'+(on ? " is-on" : "")+'" for="'+esc(id)+'">'+

      '<input type="checkbox" id="'+esc(id)+'" class="pk-ck"'+
        ' data-pick="'+esc(s.id)+'"'+(on ? " checked" : "")+
        ' onchange="pickToggle(\''+esc(s.id)+'\', this)">'+
      '<span class="pk-i ia-t">'+art+'</span>'+

      '<span class="pk-t">'+
        '<b>'+esc(amPickLabel(s))+'</b>'+
        (s.easy && s.easy !== s.name ? '<i>'+esc(s.name)+'</i>'
          : (s.sub && s.desc ? '<i>'+esc(s.desc)+'</i>' : ""))+
      '</span>'+
    '</label>'+
  '</li>';
};

function pickRows(){
  var L = amPickList();
  if(!L.length) return "";
  return L.map(function(s){
    return '<li><span class="pk-r-n">'+esc(amPickLabel(s))+'</span>'+
      '<button class="pk-r-x" type="button" onclick="pickDel(\''+esc(s.id)+'\')" '+
        'aria-label="'+esc(amPickLabel(s))+' 선택 해제">'+icon("x",15)+'</button></li>';
  }).join("");
}

window.PickAside = function(side){
  var n = amPickCount();
  return '<aside class="pks-side" aria-label="선택한 서비스">'+
    '<div class="pks-box">'+
      '<p class="pks-t">선택한 서비스 <b data-pick-n>'+n+'</b>개</p>'+
      '<p class="pks-zero" id="pka-zero"'+(n ? " hidden" : "")+'>'+
        '왼쪽에서 필요한 것을 누르시면 여기에 쌓입니다.</p>'+
      '<ul class="pks-l" id="pka-list">'+pickRows()+'</ul>'+

      '<a class="btn btn-b" id="pka-go"'+(n ? "" : " hidden")+
        ' data-side="'+esc(side || "start")+'"'+
        ' href="'+esc(amPickQuoteTo(side))+'">'+
        '<span>선택한 '+n+'개 서비스 견적 신청하기</span>'+icon("arrow",16)+'</a>'+
      '<button class="btn btn-o pks-clr" type="button" id="pka-clr"'+
        (n ? "" : " hidden")+' onclick="pickClear()">전부 해제</button>'+
    '</div>'+
  '</aside>';
};

window.PickBar = function(side){
  var n = amPickCount();
  return '<div class="pk-bar" id="pk-bar"'+(n ? "" : " hidden")+'>'+
    '<p class="pk-bar-t">선택한 서비스 <b data-pick-n>'+n+'</b>개</p>'+
    '<a class="btn btn-b" id="pk-bar-go" data-side="'+esc(side || "start")+'"'+
      ' href="'+esc(amPickQuoteTo(side))+'">'+
      '<span>선택한 '+n+'개 서비스 견적 신청하기</span>'+icon("arrow",17)+'</a>'+
  '</div>';
};

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

      '<div class="pkb-why" id="pk-go-why"'+(n ? " hidden" : "")+'>'+
        '<p>위에서 필요한 것을 하나라도 고르시면 신청하실 수 있습니다. '+
          '<b>무엇이 필요한지 모르시겠으면</b> 고르지 않고 바로 '+
          '상담을 신청하셔도 됩니다.</p>'+
        '<a class="btn btn-o" href="'+esc(amPickQuoteTo(side))+'">'+
          '고르지 않고 바로 상담 신청하기</a>'+
      '</div>'+
    '</div>'+

    '<p class="sec-note">'+icon("info",15)+
      ' 고르기만 하면 저희에게 아무것도 오지 않습니다. '+
      '<b>아래 신청하기를 누르셔야</b> 접수됩니다. '+

      '선택한 내용은 이 브라우저에 남고, <b>로그인하신 경우</b> '+
      '계정에도 남아 다른 기기에서 이어집니다.</p>'+
  '</div></section>';
};

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

function packPickCats(key){
  var seen = {}, out = [];
  ((typeof amPackageItems === "function") ? amPackageItems(key) : [])
    .forEach(function(o){
      if(!o.cat || seen[o.cat]) return;
      if(!amPickOne(o.cat)) return;
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

window.pickAddPack = function(key){
  var ids = amPickGet(), add = 0;
  packPickCats(key).forEach(function(k){
    if(ids.indexOf(k) < 0){ ids.push(k); add++; }
  });
  amPickSet(ids);
  pickPaint();
  toast(add ? (add + "개를 선택에 담았습니다") : "이미 전부 고르신 것입니다");
};

function pickQOf(s){
  var t = [s.easy || "", s.name || "", s.desc || ""];

  if(!s.sub){
    var c = (typeof amCat === "function") ? amCat(s.cat) : null;
    if(c && c.kw) t.push(c.kw);
    if(typeof amPickSubs === "function")
      amPickSubs(s.id).forEach(function(x){ t.push(x.easy || ""); t.push(x.name || ""); });
  }
  var j = t.join(" ");
  return (j + " " + j.replace(/\s+/g, "")).toLowerCase();
}

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

  var aria = "";
  if(g){
    if(note) aria = g.name + " — " + note;
    else if(dup && dup[amPickLabel(s)]) aria = g.name + " — " + amPickLabel(s);
  }

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

window.PickGroupCard = function(g, i, all){
  var pid = "opg-p-" + g.key;
  var dup = pickDupLabels(all || [g]);

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

      '<span class="opg-n" data-pick-g="'+esc(g.ids.join(","))+'" hidden><i></i></span>'+
      '<span class="opg-x" aria-hidden="true">'+icon("chevd",18)+'</span>'+
    '</button>'+
    '<div class="opg-p" id="'+esc(pid)+'"'+(open ? "" : " hidden")+'>'+
      '<ul class="opg-l">'+subs+
        PickSubRow(g.any, "어떤 것이 필요한지 모르겠어요", g, dup)+'</ul>'+

      '<p class="opg-go"><a href="'+esc(g.any.to)+'">'+
        esc(g.name)+' 자세히 보기'+icon("arrow",15)+'</a></p>'+
    '</div>'+
  '</div></li>';
};

window.pickGroupToggle = function(key, btn){
  var p = document.getElementById("opg-p-" + key);
  if(!p || !btn) return;
  var open = p.hidden;
  p.hidden = !open;
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.classList.toggle("is-open", open);
};

window.pickFind = function(q){
  q = String(q || "").trim().toLowerCase().replace(/\s+/g, "");
  var rows = [].slice.call(document.querySelectorAll("#pkb-find [data-pick-q]"));

  var hit = 0;
  rows.forEach(function(el){
    if(q && (el.getAttribute("data-pick-q") || "").indexOf(q) >= 0) hit++;
  });

  var useG = !!q && !hit;
  rows.forEach(function(el){
    var t = useG ? (el.getAttribute("data-pick-gq") || "")
                 : (el.getAttribute("data-pick-q") || "");
    var on = !q || t.indexOf(q) >= 0;
    el.hidden = !on;
    if(on && q && useG) hit++;
  });

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

    var li = c.parentElement;
    if(li) li.hidden = !!q && !any;
  });

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

function pickFoldOpen(id){
  var el = document.getElementById(id);
  if(!el || !el.classList.contains("is-fold-all")) return;
  var btn = document.querySelector('[aria-controls="' + id + '"]');
  if(btn) foldToggle(id, btn, "is-fold-all");
  else el.classList.remove("is-fold-all");
}

window.PickGroupBand = function(hallKey, side){
  var G = (typeof amPickGroups === "function") ? amPickGroups(hallKey) : [];
  if(!G.length) return "";

  var inG = {};
  G.forEach(function(g){
    g.ids.forEach(function(id){ inG[amPickSplit(id).cat] = 1; });
  });
  var rest = ((typeof amPickHallCats === "function") ? amPickHallCats(hallKey) : [])
    .filter(function(s){ return !inG[s.id]; });

  var quick = (typeof amPickQuick === "function") ? amPickQuick(hallKey) : [];

  return '<section class="sec sec-ivory pkb-sel" id="pick"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">필요한 서비스 선택</p>'+
      '<h2>무엇이 필요하신가요?</h2>'+
      '<p>칸을 누르면 아래에 쌓입니다. <b>여러 개를 함께</b> 고르실 수 있고, '+
        '한 번만 적어 보내시면 서비스마다 업체를 찾아 드립니다.</p>'+
    '</div>'+

    '<div class="pks-g"><div class="pks-main">'+
    '<div id="pkb-find">'+

      '<div class="pkf">'+
        '<label class="pkf-l" for="pkf-q">찾으시는 것을 적어 보세요</label>'+
        '<span class="pkf-w">'+icon("search",18)+
          '<input class="pkf-i" id="pkf-q" type="search" autocomplete="off"'+
            ' placeholder="예: 에어컨, 세금, 포스, 전단지"'+
            ' oninput="pickFind(this.value)">'+
        '</span>'+
        '<p class="pkf-r" id="pkb-r" hidden></p>'+
      '</div>'+

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
    '</div>'+PickAside(side)+'</div>'+
  '</div></section>';
};

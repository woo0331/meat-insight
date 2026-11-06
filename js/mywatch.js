/* ════════════════════════════════════════════════════════════════════
   저장한 조건 — /my 에서만 돕니다 (DB 는 0058)

   ⚠️⚠️ **무엇인가.** "서울 · 50만원 이하 아이언" 처럼 조건을 저장해
   두면, 맞는 글이 올라올 때 **내부 알림**(0050)이 한 장 꽂힙니다.
   지금까지는 손님이 직접 들어와 거르개를 눌러야 알 수 있었습니다.

   ⚠️⚠️⚠️ **밖으로 안 보냅니다.** 문자 · 카톡 · 메일을 붙이면 ①
   정보통신망법 제50조 ② 발송사가 수탁자가 되어 방침에 적어야 함
   (제26조) ③ 환경변수가 늘고 비면 조용히 안 보내짐, 셋이 같이
   움직입니다. 알림 종이 한 장까지입니다.

   ⚠️⚠️ **고를 수 있는 칸은 갈래마다 다릅니다** — `js/data/deal.js` 의
   `AM_WATCH` 가 정합니다. 0058 의 문이 못 걸릴 조건을 **거절**하므로
   (조인에 하위분류 · 중고 아닌데 택배 · 인력에 금액), 화면이 그 칸을
   내면 **눌러도 거절되는 칸**이 됩니다 (절대 규칙 5). 규칙을 두 곳에
   적지 않으려고 화면이 그 표를 읽습니다.

   ⚠️⚠️ **보유 기간이 비면 양식을 안 엽니다** (제15조 제2항 — 법이
   요구하는 것을 안 보여 주고 동의를 받을 수는 없습니다). `/help` 가
   `site.js` 를 안 실어서 문의 양식이 조용히 안 열렸던 그 자리입니다.

   ⚠️ 로그인 전에는 **한 글자도 안 그립니다.**
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("wchbox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  var KEEP = (window.WOW_BIZ && window.WOW_BIZ.watchKeep) || "";
  var ROWS = [];
  var A = null;

  var REG = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });
  function rgName(k){ return REG[k] || k; }
  function subName(k){
    var f = window.amSub ? window.amSub(k) : null;
    /* ⚠️ 모르는 키는 **키 그대로** 냅니다 (지어내지 않습니다) */
    return (f && f.item && f.item.name) ? f.item.name : String(k || "");
  }
  /* ⚠️ 하위 목록은 **catalog.js 에서 끌어옵니다** — 화면에 글자로 박으면
     분류가 바뀌는 날 그 칸만 조용히 틀립니다.
     ⚠️⚠️ 중고는 `pv:false` 인 일곱만입니다 (업체가 하는 매입 견적 ·
     위탁판매는 매물이 아니라 업체를 찾는 자리입니다 · 0056). */
  function subsOf(kind){
    if(kind === "listing"){
      var c = window.amCat ? window.amCat("used") : null;
      return (window.amCatItems ? window.amCatItems(c) : []).filter(function(it){
        return it.pv === false;
      });
    }
    if(kind === "job"){
      var j = window.amCat ? window.amCat("career") : null;
      return (window.amCatItems ? window.amCatItems(j) : []);
    }
    return [];
  }

  function get(a, path){
    return fetch(a.conf.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : []; });
  }
  function call(a, fn, p){
    return fetch(a.conf.url + "/rest/v1/rpc/" + fn, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json", apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {}),
      body: JSON.stringify({ p: p })
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    });
  }

  /* 저장된 한 줄을 **사람 말**로 적습니다
     ⚠️ 비어 있는 조건은 줄에 안 적습니다 (안 가린다는 뜻입니다) —
     `(전체)` 를 찍으면 고르지 않은 것과 고른 것이 같아 보입니다.
     ⚠️⚠️ 금액 **0 은 "무료로 나눔"** 입니다 — `||` 로 쓰면 0 이 사라집니다. */
  function words(r){
    var out = [];
    if(r.region) out.push(rgName(r.region));
    if(r.sub) out.push(subName(r.sub));
    if(r.max_price !== null && r.max_price !== undefined){
      out.push(Number(r.max_price) === 0
        ? "무료로 나눔만"
        : (window.won ? window.won(r.max_price) : r.max_price) + "원 이하");
    }
    if(r.ship) out.push("택배 되는 것만");
    if(r.booked) out.push("부킹이 잡힌 자리만");
    return out.length ? out.join(" · ") : "조건 없이 전부";
  }

  function list(){
    if(!ROWS.length){
      /* ⚠️ 0건은 고장이 아닙니다 — 그리고 **막다른 길로 두지 않습니다**
         (아래 양식이 바로 그 길입니다 · 절대 규칙 2). */
      return '<p class="myhint">저장해 두신 조건이 없습니다. ' +
             '아래에서 지역 · 종류를 골라 두시면, 맞는 글이 올라올 때 ' +
             '<b>알림</b>으로 알려 드립니다.</p>';
    }
    return '<ul class="wch-l">' + ROWS.map(function(r){
      return '<li><b>' + esc(window.amWatchName(r.kind)) + '</b>' +
        '<p class="wch-w">' + esc(words(r)) + '</p>' +
        '<div class="dk-b">' +
          '<a class="btn btn-sm btn-line" href="' +
            esc((window.amWatch(r.kind) || {}).where || "/") + '">보러 가기</a>' +
          '<button class="btn btn-sm btn-ghost" data-wdrop="' + esc(r.id) + '">' +
            '이 조건 지우기</button>' +
        '</div></li>';
    }).join("") + '</ul>';
  }

  /* 양식 — ⚠️ 갈래를 바꾸면 **낼 칸이 달라집니다** */
  function form(pick){
    var k = pick || (window.AM_WATCH[0] && window.AM_WATCH[0].key);
    var f = window.amWatch(k) || {};
    var kinds = window.AM_WATCH.map(function(x){
      return '<option value="' + esc(x.key) + '"' +
        (x.key === k ? " selected" : "") + '>' + esc(x.name) + '</option>';
    }).join("");
    var regs = (window.AM_REGIONS || []).map(function(r){
      return '<option value="' + esc(r.key) + '">' + esc(r.name) + '</option>';
    }).join("");
    var sb = subsOf(k).map(function(i){
      return '<option value="' + esc(i.key) + '">' + esc(i.name) + '</option>';
    }).join("");
    return '<form id="wchf" class="jform">' +
      '<div class="jrow">' +
        '<label for="w-kind">어느 자리</label>' +
        '<select id="w-kind" name="kind">' + kinds + '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="w-rg">지역</label>' +
        '<select id="w-rg" name="region"><option value="">전체</option>' +
          regs + '</select>' +
      '</div>' +
      (f.sub
        ? '<div class="jrow">' +
            '<label for="w-sub">종류</label>' +
            '<select id="w-sub" name="sub"><option value="">전체</option>' +
            sb + '</select>' +
          '</div>'
        : '') +
      (f.price
        ? '<div class="jrow">' +
            '<label for="w-mp">금액 (이 금액 이하)</label>' +
            '<input id="w-mp" name="maxPrice" inputmode="numeric" maxlength="9" ' +
            'placeholder="비워 두시면 가리지 않습니다">' +
            /* ⚠️ 0 의 뜻을 적어 둡니다 — 중고의 0 은 무료로 나눔입니다 */
            '<p class="agree-no">0 을 적으시면 <b>무료로 나눔</b>만 알려 드립니다.</p>' +
          '</div>'
        : '') +
      (f.ship
        ? '<div class="jrow jrow-full"><label class="chk">' +
            '<input type="checkbox" name="ship"><span>택배 되는 것만</span>' +
          '</label></div>'
        : '') +
      (f.booked
        ? '<div class="jrow jrow-full"><label class="chk">' +
            '<input type="checkbox" name="booked"><span>부킹이 잡힌 자리만</span>' +
          '</label></div>'
        : '') +
      /* ⚠️⚠️ 무엇을 · 왜 · 얼마나 두는지를 **동의받는 그 자리에서**
         보여 줍니다 (제15조 제2항). 그래서 보유 기간이 비면 양식을
         아예 안 엽니다 (위의 KEEP 검사). */
      '<div class="jrow jrow-full"><p class="agree-no">' +
        '저장하는 것은 <b>지역 · 종류 · 금액 · 택배 여부 · 부킹 여부</b>뿐입니다 ' +
        '— 연락처는 받지 않습니다. 맞는 글이 올라올 때 ' +
        '<b>이 사이트 안의 알림</b>으로만 알려 드리며, 문자 · 카카오톡 · 메일을 ' +
        '보내지 않습니다. 보유 기간은 <b>' + esc(KEEP) + '</b>입니다.' +
      '</p></div>' +
      '<button class="btn btn-pt" type="submit">이 조건으로 알림 받기</button>' +
      '<p class="wch-m lmsg" hidden></p>' +
      '</form>';
  }

  function paint(pick){
    box.hidden = false; box.className = "deskbox";
    /* ⚠️⚠️ 보유 기간이 비면 **양식을 안 엽니다.** 운영자에게 할 말은
       손님 화면에 적지 않고 console 로 말합니다 (절대 규칙 3). */
    if(!KEEP){
      console.warn("  ⚠️ js/data/site.js 의 watchKeep 이 비어 조건 저장 양식을 " +
                   "열지 않았습니다 (개인정보보호법 제15조 제2항).");
      box.innerHTML = '<h2 class="adm-h">저장한 조건</h2>' + list() +
        '<p class="myhint">조건을 새로 저장하는 것은 지금 열려 있지 않습니다.</p>';
      return;
    }
    box.innerHTML = '<h2 class="adm-h">저장한 조건</h2>' +
      '<p class="myhint">조건을 저장해 두시면 맞는 글이 올라올 때 ' +
      '<b>알림</b>으로 알려 드립니다. 갈래마다 열 개까지 저장하실 수 있습니다.</p>' +
      list() + form(pick);
  }

  function reload(a){
    return get(a, "watch?select=id,kind,sub,region,max_price,ship,booked," +
                  "created_at&order=created_at.desc&limit=50")
      .then(function(rows){ ROWS = rows || []; paint(); });
  }

  box.addEventListener("change", function(e){
    /* 갈래를 바꾸면 낼 칸이 달라집니다 — 다시 그립니다 */
    if(e.target && e.target.id === "w-kind") paint(e.target.value);
  });

  box.addEventListener("click", function(e){
    var d = e.target.closest ? e.target.closest("button[data-wdrop]") : null;
    if(!d || !A) return;
    d.disabled = true;
    call(A, "drop_watch", { id: d.getAttribute("data-wdrop") })
      .then(function(){ return reload(A); })
      .catch(function(err){
        d.disabled = false;
        var m = box.querySelector(".wch-m");
        if(m){ m.hidden = false; m.textContent = String(err.message || err); }
      });
  });

  box.addEventListener("submit", function(e){
    var f = e.target.closest ? e.target.closest("form#wchf") : null;
    if(!f || !A) return;
    e.preventDefault();
    var m = f.querySelector(".wch-m");
    var val = function(n){
      var el = f.querySelector('[name="' + n + '"]');
      return el ? (el.value || "").trim() : "";
    };
    var on = function(n){
      var el = f.querySelector('[name="' + n + '"]');
      return !!(el && el.checked);
    };
    var k = val("kind");
    var p = { kind: k, region: val("region") };
    /* ⚠️⚠️ **고를 수 없는 칸은 꾸러미에 안 넣습니다** — 넣으면 0058 의
       문이 거절합니다 (조인에 하위분류 · 중고 아닌데 택배). */
    var rule = window.amWatch(k) || {};
    if(rule.sub && val("sub")) p.sub = val("sub");
    /* ⚠️⚠️ 금액은 **빈 글자와 0 을 가릅니다** — `||` 를 쓰면 0 이
       사라지고, 0 은 "무료로 나눔" 이라 뜻이 다릅니다. */
    if(rule.price && val("maxPrice") !== "") p.maxPrice = val("maxPrice");
    if(rule.ship && on("ship")) p.ship = true;
    if(rule.booked && on("booked")) p.booked = true;

    var bt = f.querySelector('button[type="submit"]');
    if(bt) bt.disabled = true;
    call(A, "save_watch", p)
      .then(function(){ return reload(A); })
      .catch(function(err){
        if(bt) bt.disabled = false;
        if(m){ m.hidden = false; m.textContent = String(err.message || err); }
      });
  });

  window.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.signedIn) return;   /* 로그인 전에는 안 그립니다 */
    A = a;
    /* ⚠️ 분류 화면의 "이 조건 저장" 단추가 `?w=` 로 보내 줍니다 —
       그 갈래로 양식을 열어 둡니다 (안 그러면 손님이 다시 고릅니다). */
    var q = new URLSearchParams(location.search);
    var pick = q.get("w") || "";
    if(pick && !window.amWatch(pick)) pick = "";   /* 모르는 값은 버립니다 */
    reload(a).then(function(){ if(pick) paint(pick); })
      .catch(function(){ /* 못 읽었으면 숨긴 채로 둡니다 */ });
  }).catch(function(){});
})();

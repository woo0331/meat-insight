/* ════════════════════════════════════════════════════════════════════
   여정 넷 — 창업 준비 · 매장 운영 · 인수 · 양도 · 폐업 · 정리
   (2026-10-05 V2 지시서 §1 · §2 · §4 · §6 · §7 · §8 · §31)

   > "사용자가 사이트 구조를 **공부해야 하는** 플랫폼이 아니라,
   >  '내가 지금 무엇을 하려는지' 를 선택하면 필요한 서비스가
   >  **자동으로 좁혀지는** 플랫폼"

   ⚠️ 여기서 나열하는 것은 전부 **이미 있는 분류 · 글 · 도구 · 주소**
   입니다. 없는 것을 적으면 가짜 링크이고 절대 규칙 5 입니다 —
   `build-pages.js` 의 `checkProcess()` 가 빌드를 멈춥니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── 지금 무엇을 준비하고 계신가요 (§2) ──────────────────────────
   ⚠️ 메인과 여정 네 화면이 **같이** 씁니다. 두 곳에 적으면 서로
   달라집니다 — `StageCard()` 를 한 곳에 둔 것과 같은 까닭입니다.
   ⚠️ 카드가 **통째로** 눌립니다. 안에 또 링크를 넣지 마세요. */
/* ⚠️⚠️ **고르개 모드**(2026-10-06 2차 §3 · §4) — 메인에서는 카드를
   눌러도 **화면을 떠나지 않습니다.** 상황을 고르면 주소에 `?j=` 가
   실리고, 바로 아래 업종 구간과 맞춤 CTA 가 그 쪽으로 바뀝니다.
   §4 가 "선택 결과를 유지한다 · URL query 또는 state 를 사용한다" 고
   적은 자리입니다.
   ⚠️ 여정 네 화면에서는 그대로 **링크**입니다 — 거기서는 이미 고른
   뒤이고, 다른 여정으로 건너가는 자리입니다.
   ⚠️ `data-keep` 이 없으면 맨 위로 올라가서 **무엇이 바뀌었는지 못
   봅니다** (업종 거르개와 같은 까닭). */
window.JourneyPick = function(current, pick){
  return '<ul class="jy-g">'+(window.AM_JOURNEYS||[]).map(function(j){
    var on = (j.key === current);
    var to = pick ? jyPickTo(on ? "" : j.key) : j.to;
    return '<li><a class="jy'+tn(j.tone)+(on?" on":"")+'" href="'+esc(to)+'"'+
      (pick ? ' data-keep' : '')+
      (on ? ' aria-current="'+(pick ? "true" : "page")+'"' : '')+'>'+
      '<span class="jy-i">'+icon(j.icon,24)+'</span>'+
      '<b>'+esc(j.name)+'</b>'+
      '<em class="jy-q">'+esc(j.q)+'</em>'+
      '<i class="jy-s">'+esc(j.sub)+'</i>'+
      '<span class="jy-go" aria-hidden="true">'+
        icon(pick ? (on ? "check" : "plus") : "arrow",16)+'</span>'+
    '</a></li>';
  }).join("")+'</ul>';
};

/* 메인에서 상황을 고를 때의 주소 — 업종(`?i=`)은 **지키고** 상황만
   바꿉니다. ⚠️ 상황을 바꾸면 쪽(`?side=`)은 상황에서 다시 나오므로
   주소에서 뺍니다 (둘이 어긋나면 아래 구간이 서로 다른 말을 합니다). */
function jyPickTo(key){
  var q = [], i = nowQS("i");
  if(key) q.push("j=" + encodeURIComponent(key));
  if(i)   q.push("i=" + encodeURIComponent(i));
  return "/" + (q.length ? "?" + q.join("&") : "");
}

/* 고른 상황 — 메인의 여러 구간이 같이 읽습니다.
   ⚠️ 없는 key 는 **안 고른 것**으로 칩니다 (주소를 손으로 고쳐도
   화면이 깨지지 않아야 합니다). */
window.amJourney = function(key){
  var L = window.AM_JOURNEYS || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

/* 상황에서 쪽(창업/폐업)이 나옵니다 — `?side=` 를 따로 들고 다니지
   않습니다. ⚠️ 운영 · 인수양도는 **중립**이라 한쪽으로 물들이지
   않습니다 (`/stores` · `/assets` 와 같은 까닭입니다). */
window.amJourneySide = function(key){
  var j = amJourney(key);
  return j && (j.side === "start" || j.side === "close") ? j.side : "";
};

/* 여정 고르개를 머리말과 같이 내는 구간 */
window.JourneyBand = function(o){
  o = o || {};
  return '<section class="sec jyb'+(o.tone ? " "+o.tone : "")+'"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">'+esc(o.kicker || "WHAT DO YOU NEED")+'</p>'+
      '<h2>'+esc(o.title || "지금 무엇을 준비하고 계신가요?")+'</h2>'+
      '<p>'+esc(o.lead || "고르시면 그 다음에 필요한 것만 추려 드립니다.")+'</p>'+
    '</div>'+
    JourneyPick(o.current || "")+
  '</div></section>';
};

/* ── 걸음 하나 ───────────────────────────────────────────────────
   ⚠️ 카드가 통째로 눌리는 것이 아니라 **안에 링크가 여럿**입니다 —
   같은 걸음에서 정보를 읽을 수도, 업체를 찾을 수도, 도구를 쓸 수도
   있어야 합니다. `<a>` 안의 `<a>` 를 만들지 않으려고 카드 자체는
   링크가 아닙니다. */
function StepLinks(s, ind){
  var out = [], iq = ind ? ("i=" + encodeURIComponent(ind)) : "";
  var cat = s.cat && (typeof amCat === "function") ? amCat(s.cat) : null;

  if(cat){
    var to = catTo(cat), q = [];
    if(s.sub) q.push("s=" + encodeURIComponent(s.sub));
    if(iq) q.push(iq);
    /* 업체를 찾는 분류면 "업체 찾기", 아니면 분류 이름 그대로 */
    out.push(['<a class="pcs-l pcs-l-b" href="'+esc(to + (q.length ? "?"+q.join("&") : ""))+'">'+
      icon(cat.kind === "provider" ? "users" : "doc", 15)+
      esc(cat.kind === "provider" ? (cat.name + " 업체") : cat.name)+'</a>', 1]);
  }
  if(s.to){
    var c2 = (typeof amCat === "function" && s.cat) ? amCat(s.cat) : null;
    var nm = s.to === "/stores" ? "매장 매물" : s.to === "/assets" ? "시설 · 장비"
           : s.to === "/support" ? "지원사업" : s.to === "/quote" ? "접수하기" : "바로가기";
    if(!c2 || catTo(c2) !== s.to)
      out.push(['<a class="pcs-l" href="'+esc(s.to + (iq ? "?"+iq : ""))+'">'+
        icon("arrow",15)+esc(nm)+'</a>', 2]);
  }
  if(s.to2)
    out.push(['<a class="pcs-l" href="'+esc(s.to2 + (iq ? "?"+iq : ""))+'">'+
      icon("arrow",15)+esc(s.to2n || "바로가기")+'</a>', 2]);
  if(s.read){
    var ct = (typeof amContent === "function") ? amContent(s.read) : null;
    if(ct) out.push(['<a class="pcs-l" href="/content/'+esc(ct.slug)+'">'+
      icon("book",15)+esc(ct.title)+'</a>', 3]);
  }
  if(s.tool){
    var tl = (window.AM_TOOLS||[]).filter(function(t){ return t.key === s.tool; })[0];
    if(tl) out.push(['<a class="pcs-l" href="'+esc(tl.to)+'">'+
      icon("calc",15)+esc(tl.name)+'</a>', 4]);
  }
  return out.map(function(x){ return x[0]; }).join("");
}

/* ── 준비 과정 (§4) ──────────────────────────────────────────────
   ⚠️ 업종을 고르셨으면 **그 업종으로** 넘깁니다 (`?i=`) — 걸음마다
   업체 · 장비 · 글이 그 업종 것으로 좁혀집니다. */
window.ProcessBand = function(o){
  o = o || {};
  var steps = amProcess(o.key);
  if(!steps.length) return "";
  var ind = o.industry || "";
  /* ⚠️⚠️ 2026-10-09 지시서 §6 — **창업 로드맵은 블루 계열 · 폐업
     로드맵은 오렌지 계열**입니다. `sec-ivory` 가 `.side-start` 안에서는
     라이트 블루, `.side-close` 안에서는 라이트 오렌지로 칠해집니다
     (`css/pages.css` 의 `--bg-ivory2` 한 줄) — 구간마다 바탕을 손으로
     적지 않습니다.
     ⚠️ `tone` 을 넘긴 쪽은 그대로 둡니다 — 같은 화면에 로드맵이 둘
     이상 설 때 이웃이 겹치지 않게 하려고 넘기는 값입니다. */
  /* ⚠️ `bare:true` 는 **구간 껍데기 없이 걸음만** 돌려줍니다
     (2026-10-17 창업 준비 §2-D — 접어 두는 자리에 씁니다).
     ⚠️⚠️ `<section>` 안에 `<section>` 을 넣으면 위아래 여백이 두 겹이
     되고 바탕이 한 번 더 깔려 구간이 둘로 읽힙니다 — 그래서 껍데기를
     빼는 쪽입니다. 부르는 쪽이 제 머리말을 답니다. */
  var body = '<ol class="pcs">'+steps.map(function(s, i){
      var no = (i + 1 < 10 ? "0" : "") + (i + 1);
      return '<li class="pcs-i">'+
        '<span class="pcs-n">'+no+'</span>'+
        '<div class="pcs-b">'+
          '<b class="pcs-t">'+esc(s.name)+'</b>'+
          '<p class="pcs-p">'+esc(s.lead)+'</p>'+
          /* ⚠️ 꼭 확인할 것 (2026-10-06 2차 §5) — 걸음마다 **무엇을
             해야 하는가**(lead) 다음에 **무엇을 확인해야 하는가**가
             옵니다. 손님이 실제로 손해를 보는 자리가 거의 전부
             여기입니다.
             ⚠️⚠️ **금액 · 기한 숫자를 적지 마세요.** 업종 · 지역 ·
             법 개정에 따라 갈리고, 적어 두면 틀린 날부터 거짓말이
             됩니다 — "무엇을 어디에 확인하는가" 까지입니다.
             ⚠️ `mark()` 를 안 거치는 칸이라 `**굵게**` 를 쓰면
             별표가 글자로 찍힙니다 (이 저장소에서 13건 겪었습니다). */
          (s.check ? '<p class="pcs-ck">'+icon("check",15)+
             '<i>'+esc(s.check)+'</i></p>' : '')+
          '<div class="pcs-ls">'+StepLinks(s, ind)+'</div>'+
        '</div>'+
      '</li>';
    }).join("")+'</ol>'+
    (o.note ? '<p class="sec-note">'+icon("info",15)+esc(o.note)+'</p>' : '');

  if(o.bare) return body;

  return '<section class="sec'+(o.tone ? " "+o.tone : " sec-ivory")+'"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+esc(o.kicker || "PROCESS")+'</p>'+
      '<h2>'+esc(o.title || "무엇부터 해야 하나요?")+'</h2>'+
      '<p>'+esc(o.lead || "순서대로 짚어 드립니다. 걸음마다 필요한 정보 · 업체 · 도구를 바로 열어 보실 수 있습니다.")+'</p>'+
    '</div>'+
    body+
  '</div></section>';
};

/* ── 운영 중에 막히는 자리 (§6) ───────────────────────────────────
   ⚠️⚠️ **2026-10-06 2차 §6** — 전에는 과제를 누르면 바로 그 분야
   화면으로 갔습니다. §6 은 "문제를 선택하면 관련 **정보 · 도구 ·
   업체** 3개를 같이 보여준다" 고 적었습니다. 지금은 `?op=` 가 실리고
   바로 아래 한 판이 그 셋을 같이 냅니다 — 분야 화면으로 가는 길도
   그 판 안에 그대로 있습니다 (길을 지우지 않았습니다).
   ⚠️ `data-keep` 이 없으면 맨 위로 올라가서 무엇이 열렸는지 못 봅니다. */
function opsKey(o){ return o.sub || ("c-" + o.cat); }
function opsTo(o, ind){
  var to = o.to, cat = o.cat && (typeof amCat === "function") ? amCat(o.cat) : null;
  if(!to && cat){
    var q = [];
    if(o.sub) q.push("s=" + encodeURIComponent(o.sub));
    if(ind)   q.push("i=" + encodeURIComponent(ind));
    to = catTo(cat) + (q.length ? "?" + q.join("&") : "");
  }
  return to || "";
}
function OpsGrid(ind, cur){
  return '<ul class="ops-g">'+(window.AM_OPS||[]).map(function(o){
    if(!opsTo(o, ind)) return "";
    var k = opsKey(o), on = (k === cur);
    var q = [];
    if(!on) q.push("op=" + encodeURIComponent(k));
    if(ind) q.push("i=" + encodeURIComponent(ind));
    return '<li><a class="ops'+tn(o.tone)+(on?" on":"")+'" data-keep href="/operation'+
      (q.length ? "?" + q.join("&") : "")+'"'+(on ? ' aria-current="true"' : '')+'>'+
      '<span class="ops-i">'+icon(o.icon,22)+'</span>'+
      '<b>'+esc(o.name)+'</b>'+
      '<span class="ops-go" aria-hidden="true">'+icon(on ? "check" : "chev",15)+'</span>'+
    '</a></li>';
  }).join("")+'</ul>';
}

/* 고른 과제 하나 — 정보 · 도구 · 업체 셋을 같이 냅니다 (§6).
   ⚠️⚠️ **업체 수는 세는 값입니다** (`amProvidersInCat`). 지금 0곳이라
   0 이라고 적힙니다 — 숨기지 않습니다 (절대 규칙 1 · 2).
   ⚠️ 셋 중 비는 칸은 **줄째 뺍니다.** "준비 중" 을 찍지 않습니다. */
function OpsPick(cur, ind){
  var o = (window.AM_OPS||[]).filter(function(x){ return opsKey(x) === cur; })[0];
  if(!o) return "";
  var cat   = o.cat && window.amCat ? amCat(o.cat) : null;
  var reads = window.amContentsFor ? amContentsFor({ cat:o.cat, limit:3 }) : [];
  var tools = window.amToolsForCat ? amToolsForCat(o.cat) : [];
  /* ⚠️ `amProvidersInCat()` 는 **수를 돌려줍니다** (배열이 아닙니다).
     `.length` 를 붙였다가 화면에 "undefined곳" 이 찍혔습니다 —
     자리표시자를 찍지 않는다는 절대 규칙 2 를 제가 어긴 자리입니다. */
  var n     = (window.amProvidersInCat && cat) ? amProvidersInCat(o.cat) : 0;
  var to    = opsTo(o, ind);

  var box = function(ic, h, body, foot){
    if(!body) return "";
    return '<div class="opk-c"><p class="opk-h">'+icon(ic,17)+esc(h)+'</p>'+
      body + (foot || "") + '</div>';
  };
  return '<div class="opk">'+
    '<p class="opk-k">'+icon("check",16)+esc(o.name)+'</p>'+
    '<div class="opk-g">'+
      box("book","알아 두면 좋은 것",
        reads.length ? '<ul class="opk-l">'+reads.map(function(c){
          return '<li><a href="/content/'+esc(c.slug)+'">'+esc(c.title)+'</a></li>';
        }).join("")+'</ul>' : "",
        '<a class="opk-go" href="/content'+(o.cat ? "?side=start" : "")+'">정보 더 보기'+icon("arrow",14)+'</a>')+
      box("calc","숫자로 확인하기",
        tools.length ? '<ul class="opk-l">'+tools.map(function(t){
          return '<li><a href="'+esc(t.to)+'">'+esc(t.name)+'</a></li>';
        }).join("")+'</ul>' : "",
        '<a class="opk-go" href="/tools">도구 전부 보기'+icon("arrow",14)+'</a>')+
      box("users","맡길 곳 찾기",
        '<p class="opk-n">'+esc(cat ? cat.name : o.name)+' 분야 등록 업체 <b>'+n+'곳</b></p>'+
        (n ? "" : '<p class="opk-p">아직 모으는 중입니다. 업체가 등록되면 '+
              '이 자리에 나옵니다.</p>'),
        '<a class="opk-go" href="'+esc(to)+'">'+esc(cat ? (cat.name + " 보기") : "바로가기")+
          icon("arrow",14)+'</a>'+
        '<a class="opk-go" href="'+esc(quoteTo({ cat:o.cat, sub:o.sub,
          industry: ind || "" }))+'">견적 요청'+icon("arrow",14)+'</a>')+
    '</div>'+
  '</div>';
}

/* 운영 쪽 글 — ⚠️ 운영은 창업 · 폐업 어느 쪽도 아니라 `side` 로는
   못 거릅니다. 운영 과제가 가리키는 **분류**로 모읍니다. */
function opsReads(limit){
  var want = {}, out = [];
  (window.AM_OPS||[]).forEach(function(o){ if(o.cat) want[o.cat] = 1; });
  (window.AM_CONTENTS||[]).forEach(function(c){
    if(c.industry) return;                 /* 업종 글은 업종 화면에서만 */
    if(want[c.cat]) out.push(c);
  });
  return out.slice(0, limit || 6);
}

/* ── /operation — 매장 운영 ─────────────────────────────────────── */
/* ═════════════════════════════════════════════════════════════════
   운영 서비스관 — 2026-10-09 최종 통합 지시서 §5
   ═════════════════════════════════════════════════════════════════
   ⚠️⚠️ **운영에 대형 HERO 를 따로 만들지 마세요** (§2-1 이 직접
   적었습니다). 메인의 주인공은 창업과 폐업 둘이고, 운영을 거기에
   같은 크기로 두면 브랜드 구조가 흐려집니다. 이 구간은 `/operation`
   안과 메인의 **한 구간**에만 섭니다.
   ⚠️⚠️ **주문 버튼을 만들지 마세요** (§5-3). 제휴 공급사가 0곳이라
   지금 할 수 있는 것은 **요청을 받아 업체를 찾아 드리는 것**까지입니다 —
   "주문하기" 를 만드는 순간 안 한 일을 했다고 말하는 화면입니다. */

/* 묶음 여섯 — 카드마다 하위 서비스를 칩으로 펼칩니다.
   ⚠️ 칩은 **진짜 화면으로 갑니다** (`/providers/:cat?s=`) — 가짜 링크를
   만들면 절대 규칙 5 입니다. */
function OpsvcGrid(limitPerGroup, fold){
  var G = window.AM_OPSVC || [];
  if(!G.length) return "";
  var n = limitPerGroup || 4;
  /* ⚠️⚠️ **폰에서는 앞 둘만 펼쳐 둡니다** (2026-10-11 사장님 지시).
     묶음 여섯이 390px 에서 2,092px 였습니다 — 지우는 것이 아니라
     **한 번 더 누르면** 그대로 나옵니다 (§12). 넓은 화면은 그대로
     여섯이 다 보입니다 (`@media (max-width:900px)` 안에서만 접힙니다).
     ⚠️ §5-4 로 **업종 것이 앞에** 와 있어서, 접혀도 그 사장님께
     맞는 묶음이 먼저 보입니다.

     ⚠️⚠️ **`/operation` 에서는 접지 않습니다** — 그 화면은 이 여섯이
     **본문**입니다. 지나가는 구간(메인)에서만 접고, 그 여섯을 보러
     들어오신 자리에서 접으면 **자기 본문을 단추 뒤에 숨기는** 것이
     됩니다. 그래서 접는 것은 부르는 쪽이 정합니다(`fold`). */
  var SHOW = 2;
  if(!fold) return '<ul class="opsv-g">'+opsvCards(G, n, -1)+'</ul>';
  return '<ul class="opsv-g is-fold" id="opsv-g">'+opsvCards(G, n, SHOW)+'</ul>'+
    (G.length > SHOW && typeof FoldBtn === "function"
      ? '<p class="fld-row">'+FoldBtn("opsv-g",
          "운영 묶음 " + (G.length - SHOW) + "개 더 보기", "접기")+'</p>'
      : "");
}
/* ⚠️ 카드 생김새는 **여기 한 곳**입니다 — 두 곳에 적으면 메인과
   `/operation` 이 서로 달라집니다 (이 저장소가 랜딩 미니카드 아이콘 ·
   도구 아이콘 표로 두 번 겪은 자리입니다). */
function opsvCards(G, n, showN){
  return G.map(function(g, gi){
    var items = (typeof amOpsvcItems === "function") ? amOpsvcItems(g.key) : [];
    if(!items.length) return "";
    var head = items[0];
    return '<li class="tn-'+esc(g.tone || "t7")+
      (showN >= 0 && gi >= showN ? " fld-x" : "")+'"><div class="opsv-c">'+
      '<a class="opsv-go" href="'+esc(head.to)+'">'+
        '<span class="opsv-hd">'+
          '<span class="ic-t">'+icon(g.icon, 24)+'</span>'+
          '<em class="opsv-no">'+esc(g.no)+'</em>'+
        '</span>'+
        '<span class="opsv-t"><b>'+esc(g.name)+'</b>'+
          '<i>'+esc(g.desc || g.lead)+'</i></span>'+
      '</a>'+
      '<ul class="opsv-l">'+items.slice(0, n).map(function(o){
        return '<li><a href="'+esc(o.to)+'">'+esc(o.name)+'</a></li>'; }).join("")+
        (items.length > n
          ? '<li class="opsv-more"><a href="'+esc(head.to)+'">+'+
            (items.length - n)+'</a></li>' : "")+
      '</ul>'+
    '</div></li>'; }).join("");
}

/* §5-4 — 업종을 고르셨으면 **그 업종 것이 먼저** 나옵니다.
   ⚠️⚠️ 잘라 내는 것이 아니라 **차례를 바꾸는 것**입니다 — 잔 것은
   아래 묶음 여섯에 그대로 있습니다 (`amCatsFor()` 와 같은 규칙).
   ⚠️ 업종을 안 고르셨으면 **구간째 빠집니다** (절대 규칙 2). */
function OpsvcForInd(ind){
  if(!ind) return "";
  var L = (typeof amOpsvcFor === "function") ? amOpsvcFor(ind.key, 10) : [];
  if(!L.length) return "";
  return '<section class="sec sec-blue"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+esc(ind.name)+' 운영</p>'+
      '<h2>'+esc(koWith(ind.name, "은는"))+' 이런 것을 자주 찾으십니다</h2>'+
      '<p>업종에 맞춰 차례를 바꿈 것이고, 나머지도 아래에 그대로 있습니다.</p>'+
    '</div>'+
    '<ul class="opsv-pick">'+L.map(function(o){
      return '<li class="tn-'+esc(o.tone)+'"><a href="'+esc(o.to)+'">'+
        '<span class="ic-t">'+icon(o.icon, 20)+'</span>'+
        '<span class="opsv-pt"><b>'+esc(o.name)+'</b>'+
          '<i>'+esc(o.catName)+'</i></span>'+
      '</a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* ════════════════════════════════════════════════════════════════════
   /operation — 2026-10-18 "매장 운영 전문관 2차" §2 일곱 영역

   > §2 — "서비스를 실제로 선택하는 영역은 **페이지에서 하나만**
   >  운영한다."

   ⚠️⚠️ **전에는 고르는 자리가 없었습니다.** 운영 서비스관 여섯 ·
   업종별 차례 · 운영 과제 스물넷 · 패키지가 **같은 분류를 네 군데서**
   냈는데 전부 **링크**였습니다 — `[data-pick]` 이 0개였습니다
   (`docs/OPERATION_HALL_AUDIT.md` 에 재서 적었습니다). 그래서
   §1 의 "복수 선택이 실제로 동작하는지 확인" 은 고칠 것이 아니라
   **만들 것**이었습니다.

   ⚠️⚠️ **내려온 구간의 함수를 지우지 않았습니다** (§0-6 · §0-8).
   `OpsvcGrid` · `OpsvcForInd` · `OpsGrid` · `OpsPick` · `PackBand` ·
   `IndustryGrid` 가 그대로 있고 **부르지만 않습니다** — 되돌리실 일이
   생기면 `PageOperation()` 한 줄입니다.
   ⚠️ 내려온 것마다 **갈 곳이 남아 있는지** 하나씩 재서 확인했습니다 —
   여섯 묶음과 과제 스물넷이 가리키던 분류는 **대표 여덟 + 전체 서비스
   보기**가 빠짐없이 받습니다 (`checkPickGroup()` 이 빌드마다 셉니다).
   패키지는 `/quote` 와 `/closure` · `/transfer` 가, 업종 고르개는
   `/startup` · `/closure` 첫 화면이 그대로 들고 있습니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── A. 소개 (§3) ─────────────────────────────────────────────────
   ⚠️ 단추 둘 다 **실제로 갑니다** — 하나는 바로 아래 고르개로,
   하나는 신청 화면으로. §3 이 적은 글자 그대로입니다.
   ⚠️⚠️ 두 번째는 **빈손으로 가도 되는 길**입니다. 무엇이 필요한지
   모르시는 분께 "먼저 고르고 오세요" 라고 하면 거기서 닫습니다. */
function OpsIntro(ind){
  /* 2026-11-18 카테고리 리뉴얼 — 전문관 머리 + "이런 고민" 넷(OpsWorry). */
  return HallHero({
    side:"ops", photo:"hero-ops",
    kicker:"매장을 더 잘 운영하는 실전 서비스" + (ind ? " · " + ind.name : ""),
    h1raw:"매장 <em>운영</em>",
    /* 2026-11-19 — 접수 상태를 따르는 설명 (닫혀 있으면 "신청" 을 약속하지 않습니다). */
    leadHtml:'<span data-cta="off">비용 절감 · 홍보 · 시설 수리 · 인력 · 세무 · 노무 — 고민에 맞는 서비스와 계산도구를 찾아보세요.</span>'+
             '<span data-cta="on" hidden>비용 절감 · 홍보 · 시설 수리 · 인력 · 세무 · 노무 — 필요한 운영 서비스를 찾고 한 번에 신청하세요.</span>',
    quote: quoteTo({ side:"ops", industry:(ind ? ind.key : "") }),
    goName:"운영 상담 신청하기",
    second:'<a class="btn btn-lg hh-o" href="#pick">운영 서비스 고르기'+icon("arrow",18)+'</a>'
    /* 2026-11-19 — "이 화면에서 하실 수 있는 것" 넷(체크 카드)은 바로 아래 고민 카드 넷과 같은 말이라
       뺐습니다. 고민 카드가 머리 바로 다음 구간입니다. */
  }) + OpsWorry();
}

/* 운영 — 시안의 "사장님, 이런 고민이 있으신가요?" 넷.
   ⚠️ 칩마다 **실제로 있는 화면**으로 갑니다 — 분야 화면 · 계산도구 · 고르개.
   ⚠️ 시안의 "매출 상승 전략 제안 · 컨설팅" 은 저희가 하는 일이 아니라 쓰지 않습니다
   (중개자입니다 — 업체를 찾아 드리는 것까지). */
/* 2026-11-19 — 사용자의 **문제**를 기준으로 넷 (비용 절감 · 홍보 · 시설 수리 · 인력 · 세무 · 노무).
   ⚠️ POS · IT(/providers/it — 결제단말 · 재고 · 매출 · 근태급여 프로그램)는 인력 칸에서
      **비용 절감** 칸으로 옮겼습니다 — 매장 시스템은 사람 문제가 아니라 운영비 문제입니다.
   ⚠️ 노무는 실제 경로(/providers/admin?s=labor-agent · 노무사)가 있어 제목을 그대로 둡니다. */
var OPS_WORRY = [
  ["won",       "비용을 줄이고 싶어요",   [["고정비 계산","/tools/fixed"],["원가율 · 마진","/tools/margin"],["식자재 · 소모품","/providers/supply"],["POS · 매장 시스템","/providers/it"]]],
  ["megaphone", "홍보 · 매출을 늘리고 싶어요", [["온라인 홍보","/providers/marketing"],["리뷰 · 플레이스","/providers/marketing?s=review"],["목표 매출 계산","/tools/target"]]],
  ["tool",      "시설을 고치고 싶어요",   [["설비 수리","/providers/repair"],["정기 점검","/providers/repair?s=check-up"],["청소 · 방역","/providers/clean"]]],
  ["users",     "인력 · 세무 · 노무가 필요해요", [["직원 채용","/providers/staff"],["세무","/providers/admin?s=tax-agent"],["노무","/providers/admin?s=labor-agent"]]]
];
function OpsWorry(){
  return '<section class="sec sec-white hwr"><div class="w">'+
    '<div class="sec-hd"><h2>사장님, <em>이런 고민</em>이 있으신가요?</h2>'+
      '<p>고민에 맞는 화면으로 바로 가실 수 있습니다. 서비스를 여러 개 고르시려면 아래 고르개를 쓰세요.</p></div>'+
    '<ul class="hwr-g">'+OPS_WORRY.map(function(x){
      return '<li><div class="hwr-c"><span class="hwr-i" aria-hidden="true">'+icon(x[0], 30)+'</span>'+
        '<h3>'+esc(x[1])+'</h3><p class="hwr-ch">'+x[2].map(function(c){
          return '<a href="'+esc(c[1])+'">'+esc(c[0])+'</a>'; }).join("")+'</p></div></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* ── D. 운영 체크리스트 (§9) ──────────────────────────────────────
   > §9 — "완료 체크 · 해제 · 진행률 표시 · 회원별 저장 ·
   >  **체크리스트 완료와 견적 신청은 서로 다른 기능으로 유지한다.**"

   ⚠️⚠️ **회원별 저장은 못 했습니다** — 로그인이 `auth:false` 라
   그 길이 없습니다. 지금은 **이 브라우저**에 남고, 화면이 그렇게
   적습니다 (절대 규칙 5 · 있는 척하지 않습니다).
   ⚠️⚠️ **저장이 막힌 브라우저에서는 성공했다고 말하지 않습니다**
   (§15 "저장 실패 시 성공 메시지 금지"). 사파리 비공개 모드에서
   `localStorage` 가 던지는데, `amSet()` 은 그것을 **삼킵니다** —
   그래서 여기서 직접 try/catch 하고 붉은 줄로 알립니다 (영업
   작업대의 `SL_OK` 와 같은 방식입니다). */
var OCK_KEY = "am.opsck.v1";
var OCK_OK  = true;

function ockGet(){
  try{
    var raw = localStorage.getItem(OCK_KEY);
    var d = raw ? JSON.parse(raw) : null;
    return (d && d.done) ? d.done : [];
  }catch(e){ OCK_OK = false; return []; }
}
function ockSet(keys){
  try{
    localStorage.setItem(OCK_KEY, JSON.stringify({ done:keys, at:Date.now() }));
  }catch(e){ OCK_OK = false; return false; }
  /* §9 — 로그인하고 들어와 계시면 **계정에도** 남깁니다. 로그인이
     꺼져 있으면 `amStateTouch()` 가 아무 일도 안 합니다
     (js/state.js 머리말). ⚠️ 브라우저에 적는 것이 **먼저**입니다 —
     서버 왕복이 실패해도 체크는 남아야 합니다. */
  if(typeof amStateTouch === "function") amStateTouch("checks");
  return true;
}

window.opsCheckToggle = function(key, el){
  var done = ockGet(), i = done.indexOf(key);
  var on = el ? !!el.checked : (i < 0);
  if(on && i < 0) done.push(key);
  if(!on && i >= 0) done.splice(i, 1);
  /* ⚠️ 저장이 안 되면 **체크를 되돌립니다.** 그냥 두면 화면에는
     켜져 있는데 다시 오면 꺼져 있어서, 손님은 저장된 줄 압니다. */
  if(!ockSet(done)){
    if(el) el.checked = !on;
    toast("이 브라우저에 저장할 수 없어서 체크가 남지 않습니다");
  }
  opsCheckPaint();
};

window.opsCheckClear = function(){
  if(!ockGet().length) return;
  if(!confirm("체크해 두신 것을 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  try{ localStorage.removeItem(OCK_KEY); }catch(e){ OCK_OK = false; }
  /* ⚠️⚠️ **계정 쪽도 같이 지웁니다** — 한쪽만 지우면 다음에 열 때
     서버 것이 내려와 지운 체크가 되살아납니다.
     ⚠️ 체크만 비웁니다 — 통째로 지우면 적어 두신 조건과 고르신
     서비스까지 계정에서 날아갑니다. */
  if(typeof amStateDrop === "function") amStateDrop("checks");
  opsCheckPaint();
  toast("지웠습니다");
};

/* ⚠️ 체크리스트에서 바로 고르개로 — **실제로 담고** 그 자리로
   올려 드립니다. "맡길 곳" 이라고만 적어 두고 아무 일도 안 하면
   그게 §30-7 입니다. */
window.opsCheckPick = function(id){
  if(typeof amPickGet !== "function") return;
  var ids = amPickGet();
  var add = ids.indexOf(id) < 0;
  if(add){ ids.push(id); amPickSet(ids); pickPaint(); }
  var s = amPickOne(id);
  toast(add ? ((s ? amPickLabel(s) : "서비스") + " 를 선택에 담았습니다")
            : "이미 고르신 것입니다");
  var sec = document.getElementById("pick");
  if(sec) sec.scrollIntoView({ behavior:"auto", block:"start" });
};

/* ⚠️ 다시 그리지 않습니다 — DOM 을 바로 고칩니다 */
window.opsCheckPaint = function(){
  var done = ockGet();
  var all = (window.AM_OPS_CHECK || []).length;
  [].slice.call(document.querySelectorAll("[data-ock]")).forEach(function(el){
    var on = done.indexOf(el.getAttribute("data-ock")) >= 0;
    if(el.checked !== on) el.checked = on;
    var row = el.closest(".ock-r");
    if(row) row.classList.toggle("is-on", on);
  });
  var n = done.filter(function(k){ return !!amOpsCheckOne(k); }).length;
  var t = document.getElementById("ock-n");
  if(t) t.textContent = n + " / " + all;
  var bar = document.getElementById("ock-bar");
  if(bar){
    var pct = all ? Math.round(n / all * 100) : 0;
    bar.style.width = pct + "%";
    bar.parentElement.setAttribute("aria-valuenow", String(pct));
  }
  var x = document.getElementById("ock-x");
  if(x) x.hidden = !n;
  var warn = document.getElementById("ock-warn");
  if(warn) warn.hidden = OCK_OK;
};

function OpsCheckRow(o){
  var id = "ock-" + o.key;
  var go = [];
  if(o.cat)
    go.push('<button class="ock-go" type="button" onclick="opsCheckPick(\''+
      esc(o.cat)+'\')">맡길 곳 고르기'+icon("plus",14)+'</button>');
  if(o.tool)
    go.push('<a class="ock-go" href="/tools/'+esc(o.tool)+'">계산해 보기</a>');
  if(o.read)
    go.push('<a class="ock-go" href="/content/'+esc(o.read)+'">읽어 두기</a>');
  return '<li>'+
    '<label class="ock-r" for="'+esc(id)+'">'+
      '<input type="checkbox" class="pk-ck" id="'+esc(id)+'"'+
        ' data-ock="'+esc(o.key)+'"'+
        ' onchange="opsCheckToggle(\''+esc(o.key)+'\', this)">'+
      '<span class="ock-t"><b>'+esc(o.name)+'</b><i>'+esc(o.lead)+'</i></span>'+
    '</label>'+
    /* ⚠️ 단추들은 `<label>` **밖**입니다 — 안에 두면 누를 때마다
       체크가 같이 켜집니다 (`<a>` 안의 `<a>` 와 같은 자리). */
    (go.length ? '<p class="ock-gos">'+go.join("")+'</p>' : "")+
  '</li>';
}

function OpsCheckBand(){
  var top = (typeof amOpsCheckTop === "function") ? amOpsCheckTop() : [];
  var rest = (typeof amOpsCheckRest === "function") ? amOpsCheckRest() : [];
  if(!top.length) return "";
  var all = top.length + rest.length;
  return '<section class="sec sec-white opsck"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">운영 체크리스트</p>'+
      '<h2>이번 달, 빠뜨린 것이 없는지 보세요</h2>'+
      '<p>확인한 것을 눌러 두시면 이 브라우저에 남습니다. '+
        '<b>여기는 확인하는 자리이고 신청은 위에서 합니다.</b></p>'+
    '</div>'+
    '<div class="ock-box">'+
      '<p class="ock-sum">'+
        '<b id="ock-n">0 / '+all+'</b><span>확인했습니다</span>'+
        '<span class="ock-track" role="progressbar" aria-label="확인한 항목"'+
          ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">'+
          '<i id="ock-bar"></i></span>'+
        '<button class="btn btn-o btn-sm" type="button" id="ock-x" hidden'+
          ' onclick="opsCheckClear()">체크 지우기</button>'+
      '</p>'+
      /* §15 — 저장이 막힌 브라우저에서 "저장했습니다" 라고 하지 않습니다 */
      '<p class="ock-warn" id="ock-warn" hidden>'+icon("warn",15)+
        ' 이 브라우저는 저장을 막아 두어서 체크가 남지 않습니다 '+
        '(비공개 모드일 수 있습니다).</p>'+
      '<ul class="ock-l">'+top.map(OpsCheckRow).join("")+'</ul>'+
      (rest.length
        ? FoldAll("ock-rest", "전체 보기 ("+rest.length+"개 더)", "접기")+
          '<ul class="ock-l is-fold-all" id="ock-rest">'+
            rest.map(OpsCheckRow).join("")+'</ul>'
        : "")+
    '</div>'+
    /* 절대 규칙 5 — 체크는 신청이 아닙니다.
       ⚠️⚠️ **"이 브라우저에만" 이라고 적지 마세요.** 2026-10-18 로
       로그인하신 분은 계정에도 남습니다 (§9) — 그대로 두면 그 줄이
       그분께 거짓이 됩니다. 반대로 "저희에게 안 옵니다" 는 저장되는
       순간 말이 흐려지니, 지켜야 하는 뜻 그대로 **"신청이 아닙니다"**
       로 적습니다. */
    '<p class="sec-note">'+icon("info",15)+
      ' 체크해 두신 것은 <b>신청이 아닙니다</b> — 저희 직원에게 '+
      '일로 가지 않습니다. 이 브라우저에 남고, <b>로그인하신 경우</b> '+
      '계정에도 남아 다른 기기에서 이어집니다. '+
      '맡기실 것이 있으면 위에서 고르고 신청해 주세요.</p>'+
  '</div></section>';
}

/* ── E. 가이드 (§10) ──────────────────────────────────────────────
   > §10 — "가이드는 3개 정도만 노출하고 전체 보기로 연결한다 ·
   >  **가상의 게시글이나 허위 조회수를 만들지 않는다.**"

   ⚠️⚠️ **조회수 · 인기 · 추천을 적지 않습니다.** 조회도 클릭도 하나도
   모으지 않아서 무엇이 많이 읽혔는지 **우리는 모릅니다**. 내는 것은
   분류 · 읽는 시간(둘 다 실제 값)까지입니다.
   ⚠️ 글을 고르는 규칙은 `opsReads()` **한 곳**입니다 — 운영 과제가
   가리키는 분류의 글입니다 (`ReadBand` 의 쪽 기준보다 이쪽이 운영
   화면에 맞습니다. 두 곳에 적으면 어긋납니다).
   ⚠️ 맞는 글이 없으면 **구간째 빠집니다** (절대 규칙 2). */
function OpsGuideBand(){
  var L = opsReads(3);
  if(!L.length) return "";
  return '<section class="sec sec-ivory"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">운영 가이드</p>'+
      '<h2>운영하면서 자주 막히는 것</h2>'+
      '<p>업체를 부르기 전에 읽어 두면 묻는 것이 달라집니다.</p>'+
    '</div>'+
    '<ul class="rd-l">'+L.map(function(c){
      return '<li><a href="/content/'+esc(c.slug)+'">'+
        /* ⚠⚠ `amCatName()` 은 **없는 함수**입니다 (이 저장소에 그렇게
           적어 둔 경고가 있고 저는 거기 그대로 빠졌습니다) — 분류는
           `amCat()` 으로 찾습니다. */
        '<span class="rd-m">'+esc((amCat(c.cat) || {}).name || "")+
          (c.read ? ' · '+esc(String(c.read))+'분' : '')+'</span>'+
        '<b>'+esc(c.title)+'</b>'+
        '<span class="rd-p">'+esc(c.lead)+'</span>'+
        '<span class="rd-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
      '</a></li>'; }).join("")+'</ul>'+
    '<div class="row-cta"><a class="btn btn-o" href="/content">'+
      '정보 전부 보기'+icon("arrow",16)+'</a></div>'+
  '</div></section>';
}

/* ── F. 계산도구 (§11) ────────────────────────────────────────────
   > §11 — "운영 중 가장 자주 쓰이는 계산도구를 우선 배치한다 ·
   >  **없는 계산도구를 클릭 가능한 가짜 카드로 표시하지 않는다.**"

   ⚠️⚠️ 넷은 **실제로 있는 도구**입니다 (`/tools/bep` · `/tools/target` ·
   `/tools/labor` · `/tools/margin`). 없는 key 를 적으면 그 카드가
   조용히 빠지고, `checkOpsCheck()` · `checkProcess()` 와 같은 방식으로
   빌드가 막습니다.
   ⚠️ §11 의 "매출 · 순이익" 은 **목표 매출 계산**(`target`)입니다 —
   따로 만들지 않았습니다 (서로 뒤집은 값은 한 도구입니다). */
var OPS_CALC = ["bep", "target", "labor", "margin"];
var OPS_CALC_TONE = { bep:"sv3", target:"sv1", labor:"sv4", margin:"sv6" };

/* ⚠️⚠️ **공통 조각이 `HallCalcBand()` 로 올라갔습니다**
   (`js/components/ui.js`). 2026-10-18 전체 점검 지시서 §3 이 네
   전문관에 **같은 공통 레이아웃 여덟**을 요구해서, 계산도구 구간을
   전문관마다 베껴 쓰지 않고 한 곳에서 만듭니다 — 베껴 두면 한쪽만
   고치게 되고, 이 저장소가 `amCatTo`/`catTo` · 랜딩 아이콘 표로
   겪은 자리입니다.
   ⚠️ 여기 남는 것은 **운영이 어느 계산기를 내는가**뿐입니다. */
function OpsCalcBand(){
  return HallCalcBand({ keys:OPS_CALC, tones:OPS_CALC_TONE, cls:"opsc",
    title:"숫자를 먼저 보고 정하세요" });
}

function PageOperation(){
  var ind = (typeof amIndustry === "function") ? amIndustry(nowQS("i")) : null;
  /* §2 일곱 영역 — ① 소개 ② 필요한 서비스 선택 ③ 선택 확인 + 통합
     견적 신청 ④ 체크리스트 ⑤ 가이드 ⑥ 계산도구 · 도움 ⑦ 다른 전문관.
     ⚠️⚠️ ③ 이 **신청 단추를 들고 있는 유일한 자리**입니다 — §1 이
     적은 "신청 버튼 위치가 명확하지 않다" 가 그 자리를 셋으로 두었던
     까닭입니다 (둘은 조건을 안 들고 가는 `quoteTo({})` 였습니다). */
  return OpsIntro(ind) +
    PickGroupBand("operation", "ops") +
    PickBasket("ops") +
    OpsCheckBand() +
    OpsGuideBand() +
    OpsCalcBand() +
    HallSteps({ quote:quoteTo({ side:"ops" }) }) +
    JourneyBand({ current:"operation", tone:"sec-white",
      title:"다른 것도 준비하고 계신가요?",
      lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." }) +
    PickBar("ops");
}

/* ── /transfer — 인수 · 양도 ──────────────────────────────────
   ⚠️⚠️ **한쪽으로 물들이지 않습니다.** 넘기시는 분과 받으시는 분이
   같은 화면을 봅니다 (`/stores` · `/assets` 와 같은 까닭입니다).

   ⚠️⚠️ **2026-10-18 전체 점검 §3 — 공통 프레임이 됐습니다.** 재 보니
   이 화면에는 **고르는 체크칸이 0개**였고, 신청으로 가는 단추가
   `aq-m` 메뉴 안의 `quoteTo({cat:"transfer"})` 와 빈 매물 자리의
   접수 단추 **둘**이었는데 둘 다 **고르신 것을 들고 가지 못했습니다**
   (고를 자리가 없었으니까요). 지금은 ① 고르는 자리 ② 선택 확인
   ③ 신청 단추가 셋 다 **한 자리씩**입니다.

   ⚠️ **매물 탐색과 인수 / 양도 탭은 그대로 둡니다** — §3 이 "매장
   양도양수처럼 성격이 다른 전문관은 매물 탐색과 거래 절차를 고려하여
   필요한 구조를 별도로 유지할 수 있다" 고 적었습니다. 받으시는 분과
   넘기시는 분은 **순서가 다르고**, 그 둘을 한 줄로 묶으면 어느 쪽
   순서인지가 묻힙니다.

   ⚠️⚠️ §13 — **공인중개업무로 읽히게 만들지 마세요.** 저희가 하는
   일은 조건을 받아 업체 · 다음 사장님을 **찾아 드리는 것**까지이고,
   매물에 적힌 값은 올리신 사장님이 적으신 값입니다 (`mkRole()` ·
   약관 제5조 · 전자상거래법 제20조 제1항). */
var AQ_CALC      = ["premium", "vs", "rent"];
var AQ_CALC_TONE = { premium:"t13", vs:"sv2", rent:"sv3" };

/* A. 소개 — ⚠️⚠️ 주 단추가 **고르러 가는 자리**입니다. 전에는
   `/stores`(매물 목록)였는데 매물이 0건이라 주 단추를 누르면 빈
   화면이 먼저 나왔습니다 — 매물 보기는 보조로 내리고, 매물이
   올라오면 그 자리가 다시 주인공이 되도록 구간은 그대로 둡니다. */
function AcqIntro(ind, iq, picked){
  /* 2026-11-18 카테고리 리뉴얼 — 전문관 머리 + 매물 찾기 띠(AcqSearch).
     ⚠️⚠️ 시안의 "등록된 매물 3,842건 · 상담 12,736건 · 거래 완료 2,418건" 은
     지어낸 숫자라 쓰지 않습니다 — 확인 카드에는 **센 값**(지금 매물 n건)만 냅니다. */
  var n = (window.AM_STORES || []).length;
  /* 2026-11-20 — 경로를 고르고 들어오시면(주소에 t=in · t=out) 머리를 줄입니다: 사진 띠와 고르는 카드를 빼고
     바로 아래 경로 탭 · 그 경로의 정보가 첫 화면에 오게 합니다 (고르는 일은 그 탭이 그대로 합니다). */
  var compact = picked === "in" || picked === "out";
  return HallHero({
    /* 2026-11-20 — 출처가 확인되지 않은 kind-pass 사진 대신 메인과 같은 자체 일러스트
       (넘기는 매장 → 받는 사장님 · wpPassArt). 경로를 고른 화면은 머리를 줄이므로 판을 안 냅니다. */
    side:"transfer", photo:"",
    art:(compact || typeof wpPassArt !== "function") ? "" : wpPassArt(),
    kicker:(compact ? (picked === "out" ? "내 매장을 넘기고 싶어요" : "매장을 인수하고 싶어요") : "사장님의 새로운 시작을 위한") + (ind ? " · " + ind.name : ""),
    h1raw:"매장 <em>양도양수</em>",
    lead:"매장을 찾는 분(인수)과 넘기려는 분(양도)의 길을 나눠 안내합니다. 매물에 적힌 값은 올리신 사장님이 적으신 값입니다.",
    leadM:"매장을 찾는 분과 넘기려는 분의 길을 나눠 안내합니다.",
    quote: quoteTo({ side:"transfer", cat:"transfer", industry:(ind ? ind.key : "") }),
    goName:"양도 · 양수 상담 신청하기",
    second:'<a class="btn btn-lg hh-o" href="/stores'+esc(iq)+'">매장 매물 보기'+icon("arrow",18)+'</a>',
    /* 2026-11-19 — 두 경로를 첫 화면에. ⚠️ "올라온 매물 n건 (센 값)" 줄은 뺐습니다 — 건수는
       아래 매물 구간이 사실대로 냅니다. ⚠️ '내 매장 넘기기' 는 매물 등록(sell) 접수가 닫혀 있으면
       기존 양도 안내(/transfer?t=out)로 갑니다 — data-cta 짝이라 열리면 /sell 입니다. */
    /* 2026-11-20 /transfer 개선 1차 — 첫 화면 카드가 곧 **두 경로 고르기**입니다.
       누르면 같은 화면이 t=in / t=out 으로 열리고 그 경로의 정보가 바로 아래 먼저 섭니다.
       ⚠️ 매물 등록(sell) 접수는 여기서 열지 않습니다 — 넘기는 경로 안에서 접수 상태를 따라 갈립니다. */
    cardTitle:"어느 쪽이세요?", qfirst:!compact,
    quick:compact ? [] : [{ ic:"search", b:"매장을 인수하고 싶어요", d:"권리금 · 인수 비용, 인수 계약 가이드, 매물 찾기",
             go:"인수 경로 보기", href:"/transfer?t=in"+(ind ? "&i="+encodeURIComponent(ind.key) : "") },
           { ic:"handover", b:"내 매장을 넘기고 싶어요", d:"넘기는 순서, 준비 자료, 양도 가이드",
             go:"양도 경로 보기", href:"/transfer?t=out"+(ind ? "&i="+encodeURIComponent(ind.key) : "") }]
  });
}

/* 양도양수 — 시안의 매물 검색 띠. ⚠️ /stores 가 실제로 읽는 거르개만 싣습니다
   (지역 r · 업종 i · 권리금 pm · 보증금 dp · 월세 rt — market.js MK_KEYS).
   ⚠️ 시안의 키워드 칸 · 지도 보기는 /stores 가 읽지 않거나 기능이 없어 넣지 않았습니다. */
function AcqSearch(ind){
  var rg = function(key){
    var g = (window.AM_STORE_RANGES || []).filter(function(x){ return x.key === key; })[0];
    if(!g) return "";
    return '<div class="f-r"><label for="aq-s-'+key+'">'+esc(g.name)+'</label>'+
      '<select class="sel" id="aq-s-'+key+'"><option value="">전체</option>'+
      g.opts.map(function(o){ return '<option value="'+esc(o.k)+'">'+esc(o.name)+'</option>'; }).join("")+'</select></div>';
  };
  /* 2026-11-19 — 폰에서는 지역 · 업종을 먼저 내고 권리금 · 보증금 · 월세는 '가격 조건' 안에 접어 둡니다.
     ⚠️ 접어도 고르신 조건이 있으면 단추에 "n개 적용" 이 남습니다 (aqPxPaint).
     ⚠️ PC 는 다섯 칸이 늘 펼쳐져 있습니다 (단추가 안 보이고 접기도 안 걸립니다 — 900px 아래 규칙만).
     ⚠️ 보내는 값 · 키는 그대로입니다 — /stores 의 r · i · pm · dp · rt (market.js MK_KEYS). */
  return '<section class="sec sec-white asr" id="aq-find"><div class="w">'+
    '<form class="asr-f" onsubmit="return aqSearchGo(event)" aria-label="매장 매물 찾기">'+
      '<div class="f-r"><label for="aq-s-r">지역</label>'+RegionSelect("aq-s-r", "", "", "전체")+'</div>'+
      '<div class="f-r"><label for="aq-s-i">업종</label>'+IndustrySelect("aq-s-i", ind ? ind.key : "", "", "전체")+'</div>'+
      '<button class="btn asr-pxb" type="button" aria-expanded="false" aria-controls="aq-px" onclick="aqPxToggle(this)">'+
        icon("sliders",16)+'<span>가격 조건</span><em id="aq-px-n" hidden></em>'+icon("chevd",16)+'</button>'+
      '<div class="asr-px is-fold-px" id="aq-px">'+ rg("pm") + rg("dp") + rg("rt") +'</div>'+
      '<button class="btn btn-lg asr-go" type="submit">'+icon("search",18)+' 매물 검색</button>'+
    '</form>'+
  '</div></section>';
}
window.aqPxToggle = function(b){
  var box = document.getElementById("aq-px"); if(!box) return;
  var open = box.classList.toggle("is-fold-px") === false;
  b.setAttribute("aria-expanded", open ? "true" : "false");
};
window.aqPxPaint = function(){
  var n = ["aq-s-pm","aq-s-dp","aq-s-rt"].filter(function(id){
    var e = document.getElementById(id); return e && e.value; }).length;
  var t = document.getElementById("aq-px-n"); if(!t) return;
  t.textContent = n + "개 적용"; t.hidden = !n;
};
document.addEventListener("change", function(e){
  if(e.target && /^aq-s-(pm|dp|rt)$/.test(e.target.id || "")) aqPxPaint();
});
window.aqSearchGo = function(e){
  if(e && e.preventDefault) e.preventDefault();
  var q = [];
  [["r","aq-s-r"],["i","aq-s-i"],["pm","aq-s-pm"],["dp","aq-s-dp"],["rt","aq-s-rt"]].forEach(function(p){
    var v = (document.getElementById(p[1]) || {}).value || "";
    if(v) q.push(p[0] + "=" + encodeURIComponent(v));
  });
  go("/stores" + (q.length ? "?" + q.join("&") : ""));
  return false;
};

/* B. 어느 쪽이세요 — 탭 + 메뉴 다섯 (그대로) */
function AcqWhich(t, ind, iq){
  /* 2026-11-20 /transfer 개선 1차 — 두 경로 탭 + **고른 경로에 맞는 것부터**.
     인수: 권리금 · 인수 비용 → 인수 계약 가이드 → 매물 찾기 (+ 받는 순서 · 필요한 것 고르기)
     양도: 넘기는 순서 → 준비 자료 → 양도 가이드 (+ 권리금 · 필요한 것 고르기)
     ⚠️ 전부 **실제로 있는 화면 · 글 · 계산기**입니다 (tools/urls.json · content.js · AM_PROCESS).
     ⚠️ 탭 둘(.aq-tb .aq-t)과 메뉴(.aq-m)는 check.js · test-flows 가 이름으로 봅니다. */
  function tab(k, name, lead){
    return '<a class="aq-t'+(t===k?" on":"")+'" href="/transfer?t='+k+
      (ind ? "&i="+encodeURIComponent(ind.key) : "")+'"'+
      (t===k?' aria-current="page"':'')+'>'+
      '<b>'+esc(name)+'</b><em>'+esc(lead)+'</em></a>';
  }
  var P = window.AM_PROCESS || {};
  var nIn = (P["acq-in"] || []).length, nOut = (P["acq-out"] || []).length;
  var nStore = (typeof amStores === "function") ? amStores({}).length : 0;
  var jump = function(id){ return ' onclick="return aqJump(\''+id+'\')"'; };
  var L = (t === "out") ? [
      ["#aq-steps",            "handover", "넘기는 순서",        "넘길 때 거치는 "+nOut+"걸음 — 조건 정하기부터 인계까지", "aq-steps"],
      ["#aq-prep",             "doc",      "준비 자료",          "매장 정보 · 임대차 · 매출 자료 · 권리금 · 시설 목록", "aq-prep"],
      ["/content?j=acquisition","book",    "양도 가이드",        "넘기기 전에 보셔야 하는 글"],
      ["/tools/premium",       "gauge",    "권리금 알아보기",    "인수하시는 분이 먼저 하는 계산을 미리 해 봅니다"],
      ["#pick",                "check",    "넘길 때 필요한 것",  "시설 인계 · 계약 · 세무를 골라 보세요"]
    ] : [
      ["/tools/premium",       "gauge",    "권리금 · 인수 비용", "권리금이 몇 달이면 돌아오는지 따져 봅니다"],
      ["/tools/vs",            "scale",    "새로 차리기 vs 인수", "같은 매장을 새로 만들 때와 비용을 비교합니다"],
      ["/content?j=startup&cat=store", "book", "인수 계약 가이드", "상가 계약 · 권리금, 계약 전에 볼 것"],
      ["/stores"+iq,           "store",    "매물 찾기",          nStore ? "지금 올라온 매장 매물 "+nStore+"건" : "현재 등록된 매물이 없습니다"],
      ["#aq-steps",            "doc",      "받는 순서",          "인수할 때 거치는 "+nIn+"걸음", "aq-steps"],
      ["#pick",                "check",    "인수할 때 필요한 것", "점검 · 임대차 검토 · 승계를 골라 보세요"]
    ];
  return '<section class="sec sec-white aq-path" id="aq-path"><div class="w">'+
    '<div class="aq-tb">'+
      tab("in",  "매장을 인수하고 싶어요",  "있던 가게를 받습니다")+
      tab("out", "내 매장을 넘기고 싶어요", "하던 가게를 넘깁니다")+
    '</div>'+
    '<div class="sec-hd aq-ph">'+
      '<p class="eyebrow">'+(t === "out" ? "넘기시는 분" : "받으시는 분")+'</p>'+
      '<h2>'+(t === "out" ? "넘기기 전에 이것부터 보세요" : "인수하기 전에 이것부터 보세요")+'</h2>'+
    '</div>'+
    '<ul class="aq-m">'+L.map(function(x){
      return '<li><a href="'+esc(x[0])+'"'+(x[4] ? jump(x[4]) : "")+'>'+
        '<span class="ic-t">'+icon(x[1],22)+'</span>'+
        '<b>'+esc(x[2])+'</b><i>'+esc(x[3])+'</i></a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}
/* 같은 화면 안의 자리로 — 접혀 있으면 펴고 그 자리로 갑니다.
   ⚠️ 주소에 # 을 남기지 않습니다 (popstate 로 화면이 다시 그려지면 편 것이 도로 접힙니다). */
window.aqJump = function(id){
  var sec = document.getElementById(id); if(!sec) return true;
  var road = document.getElementById("aq-road");
  if(id === "aq-steps" && road && road.classList.contains("is-fold-all")){
    var b = document.querySelector('[aria-controls="aq-road"]');
    if(b && typeof foldToggle === "function") foldToggle("aq-road", b, "is-fold-all");
  }
  sec.scrollIntoView({ behavior:"auto", block:"start" });
  return false;
};

/* 양도 — 준비 자료. 넘기는 순서(acq-out)의 **앞 다섯 걸음**이 곧 챙길 자료입니다.
   ⚠️ 글을 새로 쓰지 않았습니다 — 걸음의 이름 · 한 줄 · 이어지는 글(read)을 그대로 씁니다.
   ⚠️ 매물 등록 접수가 닫혀 있으면 "지금은 받지 않는다" 와 함께 **준비를 이어 가는 길**을 냅니다. */
function AcqPrep(ind){
  var S = ((window.AM_PROCESS || {})["acq-out"] || []).slice(0, 5);
  if(!S.length) return "";
  return '<section class="sec sec-gray aq-prep" id="aq-prep"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">준비 자료</p>'+
      '<h2>넘기기 전에 챙겨 둘 다섯 가지</h2>'+
      '<p>인수하시는 분이 제일 먼저 묻는 것들입니다. 미리 한 벌로 묶어 두면 이야기가 빨라집니다.</p>'+
    '</div>'+
    '<ol class="aq-pl">'+S.map(function(st, i){
      var c = (st.read && typeof amContent === "function") ? amContent(st.read) : null;
      return '<li><span class="aq-pn">'+(i+1)+'</span><span class="aq-pt"><b>'+esc(st.name)+'</b>'+
        '<em>'+esc(st.lead || "")+'</em>'+
        (c ? '<a href="/content/'+esc(c.slug)+'">'+icon("book",14)+'<span>'+esc(c.title)+'</span></a>' : '')+
        '</span></li>';
    }).join("")+'</ol>'+
    '<p class="aq-sell" data-cta="on" data-cta-form="sell" hidden>'+icon("info",16)+
      '<span>준비가 됐으면 매물 등록 양식에 적어 보내 주세요. 올리기 전에 한 번 연락드립니다.</span>'+
      '<a class="btn btn-b" href="/sell">내 매장 내놓기'+icon("arrow",16)+'</a></p>'+
    '<p class="aq-sell" data-cta="off" data-cta-form="sell">'+icon("info",16)+
      '<span>지금은 매물 등록 접수를 받지 않습니다. 위 자료와 넘기는 순서로 먼저 준비해 두시면, 접수가 열릴 때 바로 내놓으실 수 있습니다.</span>'+
      '<a href="#aq-steps" onclick="return aqJump(\'aq-steps\')">넘기는 순서 보기'+icon("chev",14)+'</a></p>'+
  '</div></section>';
}

/* E. 거래 절차 — ⚠️⚠️ **접어 둡니다.** 열 걸음(받는 쪽) · 일곱
   걸음(넘기는 쪽)이 펼쳐진 채로 있으면 390px 에서 그 구간 하나가
   화면 서넛이고, 그만큼 **위의 고르는 자리와 아래 매물이 멀어집니다.**
   ⚠️ 접힌 것도 DOM 에 그대로 있어서 크롤러 · 링크 검사 · 색인이 한
   글자도 안 바뀝니다 (폐업 로드맵과 같은 방식). */
function AcqProcess(t, ind){
  var key = (t === "out") ? "acq-out" : "acq-in";
  var n   = ((window.AM_PROCESS || {})[key] || []).length;
  return '<section class="sec sec-gray stD" id="aq-steps"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">'+(t === "out" ? "넘기는 순서" : "받는 순서")+'</p>'+
      '<h2>'+esc((ind ? ind.name + " — " : "")+
        (t === "out" ? "넘길 때는 이 순서입니다" : "받을 때는 이 순서입니다"))+'</h2>'+
      '<p>'+esc(n + "걸음입니다. " + (t === "out"
        ? "통째로 넘기면 철거와 원상복구를 안 하셔도 되는 경우가 있습니다. 조건부터 정합니다."
        : "권리금과 시설이 같이 오는지, 임대차가 승계되는지가 금액을 가릅니다."))+' '+
        '<b>여기는 읽는 자리이고 신청은 위에서 합니다.</b></p>'+
    '</div>'+
    FoldAll("aq-road", (t === "out" ? "넘기는 순서 " : "받는 순서 ")+n+"걸음 보기", "접기")+
    '<div class="is-fold-all" id="aq-road">'+
      ProcessBand({ key:key, bare:true, industry: ind ? ind.key : "",
        note: t === "out"
          ? "매물을 올리는 일은 사람이 합니다 — 접수가 열려 있을 때 적어 보내 주시면 확인하고 올립니다."
          : "매물에 적힌 평수 · 보증금 · 월세 · 권리금 · 매출은 올리신 사장님이 적으신 값이고, 저희가 확인하거나 보증하는 값이 아닙니다." })+
    '</div>'+
  '</div></section>';
}

/* F. 지금 올라온 것 — ⚠️ 0건이면 **0 이라고 말합니다** (절대 규칙 1).
   한 건이라도 올라오면 코드를 한 줄도 안 고치고 단추가 섭니다. */
function AcqMarket(t, ind, iq){
  var nStore = (typeof amStores === "function") ? amStores({}).length : 0;
  var nAsset = (typeof amAssets === "function") ? amAssets({}).length : 0;
  /* ⚠️⚠️ **넘기시는 분께는 "올라온 매물" 이 할 일이 아닙니다** —
     내놓으시는 자리(`/sell`)가 할 일입니다 (PART 7-2 양도인 ·
     "매장 기본 정보"). 머리말과 단추만 갈리고 **건수는 둘 다 사실
     그대로**입니다 (절대 규칙 1 — 0건이면 0건이라고 적습니다). */
  var out = (t === "out");
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+(out ? "내놓으시려면" : "지금 올라온 것")+'</p>'+
      /* 2026-11-19 — 매물 등록(sell) 양식이 닫혀 있으면 "올려 드립니다" 를 약속하지 않습니다. */
      '<h2>'+(out
        ? ctaPair("sell", "한 번만 적어 보내시면 저희가 올려 드립니다", "지금은 매물 등록 접수를 받지 않습니다")
        : esc("매장 매물 "+nStore+"건 · 시설 · 장비 "+nAsset+"건"))+'</h2>'+
      '<p>'+(out
        ? ctaPair("sell", "평수 · 보증금 · 월세 · 권리금을 적는 칸이 따로 있습니다. "+
            "올리기 전에 한 번 연락드립니다. 지금 올라온 매물은 "+
            nStore+"건 · 시설 · 장비 "+nAsset+"건입니다.",
            "내놓을 때 적는 칸(평수 · 보증금 · 월세 · 권리금)은 매장 내놓기 화면에서 미리 보실 수 있고, "+
            "넘기기 전에 맞출 것은 아래 순서와 양도 가이드에 있습니다. 지금 올라온 매물은 "+
            nStore+"건 · 시설 · 장비 "+nAsset+"건입니다.")
        : "등록된 차례로 냅니다. 광고로 위에 올린 자리는 없습니다.")+'</p>'+
    '</div>'+
    (out
      ? '<div class="row-cta">'+
          '<a class="btn btn-b" href="/sell">내 매장 내놓기'+icon("arrow",16)+'</a>'+
          '<a class="btn btn-o" href="/sell?t=asset">시설 · 장비만 내놓기</a>'+
          /* 2026-11-19 — 매물 등록이 닫히면 위 둘이 가려집니다(ctaTagLinks · sell). 그때 할 수 있는 것. */
          '<a class="btn btn-b" href="/content?j=acquisition" data-cta="off" data-cta-form="sell">양도 가이드 보기'+icon("arrow",16)+'</a>'+
          '<a class="btn btn-o" href="/intake" data-cta="off" data-cta-form="sell">접수 안내 보기</a>'+
        '</div>'
      :
    (nStore || nAsset
      ? '<div class="row-cta"><a class="btn btn-b" href="/stores'+esc(iq)+'">매장 매물 보기'+icon("arrow",16)+'</a>'+
        '<a class="btn btn-o" href="/assets'+esc(iq)+'">시설 · 장비 보기</a></div>'
      /* ⚠️⚠️ 빈 자리의 단추를 **고르는 자리**로 보냅니다. 전에는 여기서
         바로 접수로 가서, 이 화면에 신청 단추가 셋이 되고 그중 둘이
         고르신 것을 안 들고 갔습니다. */
      /* 2026-11-19 — 전체가 0건일 때의 말입니다 (거르개 결과 0건은 /stores 가 따로 말합니다).
         ⚠️ 빈 자리에는 지금 실제로 쓸 수 있는 길 — 인수 가이드 글(reads) · 권리금 · 신규vs인수 계산기. */
      /* 2026-11-20 — 0건은 짧게 한 줄 + 바로 쓸 수 있는 둘(인수 계약 가이드 · 권리금 계산).
         ⚠️ 매물은 서버 조회가 아니라 빌드된 데이터(AM_STORES)라 "조회 실패" 상태가 따로 없습니다. */
      : '<p class="aq-zero">'+icon("info",16)+'<span>현재 등록된 매물이 없습니다.</span></p>'+
        '<div class="row-cta"><a class="btn btn-b" href="/content?j=startup&cat=store">인수 계약 가이드'+icon("arrow",16)+'</a>'+
        '<a class="btn btn-o" href="/tools/premium">권리금 계산</a></div>'))+
  '</div></section>';
}

function PageAcquisition(){
  var t    = (nowQS("t") === "out") ? "out" : "in";
  var ind  = (typeof amIndustry === "function") ? amIndustry(nowQS("i")) : null;
  var iq   = ind ? ("?i=" + encodeURIComponent(ind.key)) : "";

  /* §3 공통 여덟 — ① 소개 ② 서비스 선택 ③ 선택 확인 ④ 통합 견적
     신청(③ 안) ⑤ 체크리스트(= 거래 절차) ⑥ 가이드 ⑦ 계산도구
     ⑧ 다른 전문관. 여기에 이 전문관만의 **탭 · 메뉴 · 매물 탐색**이
     더 붙습니다 (§3 이 허용한 자리).
     ⚠️⚠️ **`side` 는 `transfer` 입니다.** DB 가 처음부터 받는 값인데
     (0001 — start | ops | transfer | close) 신청 화면에 그 선택지가
     없어서, 양도양수로 들어온 분이 **"창업"** 으로 접수됐습니다 —
     `ops` 하나를 고치고도 같은 자리에 그대로 남아 있었습니다. */
  /* ⚠️⚠️ **차례가 경로를 따릅니다** (PART 7-3). 받으시는 분은
     **매장을 먼저 보시고** 고르시고(PART 7-2 양수인 — "매장 탐색" 이
     첫 항목), 넘기시는 분은 **넘길 때 필요한 것을 먼저 고르시고**
     내놓으십니다. 지우거나 더한 구간은 없습니다 — 차례만 바뀝니다. */
  var sel = PickGroupBand("transfer", "transfer") + PickBasket("transfer");
  var mkt = AcqMarket(t, ind, iq);
  /* 2026-11-20 — 머리 바로 아래가 **고른 경로의 정보**입니다 (AcqWhich).
     인수: 경로 → 매물 찾기(AcqSearch) → 매물 → 고르기 · 양도: 경로 → 준비 자료 → 고르기 → 매물 등록 */
  return AcqIntro(ind, iq, nowQS("t")) +
    AcqWhich(t, ind, iq) +
    (t === "in" ? AcqSearch(ind) + mkt + sel : AcqPrep(ind) + sel + mkt) +
    AcqProcess(t, ind) +
    ReadBand({ cat:"transfer", side:"both", limit:3,
               title:"인수 · 양도에서 자주 막히는 것" }) +
    HallCalcBand({ keys:AQ_CALC, tones:AQ_CALC_TONE,
      title:"받기 전 · 넘기기 전에 숫자부터 보세요",
      lead:"권리금이 몇 달이면 돌아오는지, 새로 만드는 것과 받는 것이 얼마나 다른지 따져 보실 수 있습니다. 적으신 값은 저장하지 않습니다." }) +
    HallSteps({ quote:quoteTo({ side:"transfer", cat:"transfer" }) }) +
    JourneyBand({ current:"acquisition", tone:"sec-white",
      title:"다른 것도 준비하고 계신가요?",
      lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." }) +
    PickBar("transfer");
}


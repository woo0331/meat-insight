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
  return '<section class="sec'+(o.tone ? " "+o.tone : " sec-white")+'"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+esc(o.kicker || "PROCESS")+'</p>'+
      '<h2>'+esc(o.title || "무엇부터 해야 하나요?")+'</h2>'+
      '<p>'+esc(o.lead || "순서대로 짚어 드립니다. 걸음마다 필요한 정보 · 업체 · 도구를 바로 열어 보실 수 있습니다.")+'</p>'+
    '</div>'+
    '<ol class="pcs">'+steps.map(function(s, i){
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
    (o.note ? '<p class="sec-note">'+icon("info",15)+esc(o.note)+'</p>' : '')+
  '</div></section>';
};

/* ── 운영 중에 막히는 자리 (§6) ─────────────────────────────────── */
function OpsGrid(ind){
  var iq = ind ? ("i=" + encodeURIComponent(ind)) : "";
  return '<ul class="ops-g">'+(window.AM_OPS||[]).map(function(o){
    var to = o.to, cat = o.cat && (typeof amCat === "function") ? amCat(o.cat) : null;
    if(!to && cat){
      var q = [];
      if(o.sub) q.push("s=" + encodeURIComponent(o.sub));
      if(iq) q.push(iq);
      to = catTo(cat) + (q.length ? "?" + q.join("&") : "");
    }
    if(!to) return "";
    return '<li><a class="ops'+tn(o.tone)+'" href="'+esc(to)+'">'+
      '<span class="ops-i">'+icon(o.icon,22)+'</span>'+
      '<b>'+esc(o.name)+'</b>'+
      '<span class="ops-go" aria-hidden="true">'+icon("chev",15)+'</span>'+
    '</a></li>';
  }).join("")+'</ul>';
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
function PageOperation(){
  var ind  = (typeof amIndustry === "function") ? amIndustry(nowQS("i")) : null;
  var reads = opsReads(6);
  return PgHero({
    kicker:"OPERATION · 매장 운영",
    h1raw:"운영하면서 필요한 것,<br class=\"br-m\"> 여기서 찾으세요.",
    lead:"세무 · 노무 · 인력 · POS · 식자재 · 청소 · 마케팅까지. 문을 연 뒤에 생기는 일도 한곳에서 맡길 곳을 찾습니다.",
    cta:'<a class="btn btn-b btn-lg" href="'+esc(quoteTo({}))+'">'+
        '필요한 것 견적 요청'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/tools">매출 · 원가 계산해 보기</a>'
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">무엇이 필요하세요?</p>'+
      '<h2>지금 막히는 자리를 고르세요</h2>'+
      '<p>고르시면 그 분야 업체와 정보로 바로 넘어갑니다.</p>'+
    '</div>'+
    OpsGrid(ind ? ind.key : "")+
  '</div></section>'+
  '<section class="sec sec-gray"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">업종을 고르시면</p>'+
      '<h2>업종마다 쓰는 것이 다릅니다</h2>'+
      '<p>고르시면 장비 · 거래처 · 업체가 그 업종 것으로 좁혀집니다.</p>'+
    '</div>'+
    IndustryGrid("/startup","")+
  '</div></section>'+
  (reads.length ? '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">먼저 읽어 두시면</p>'+
      '<h2>운영하면서 자주 막히는 것</h2>'+
    '</div>'+
    '<ul class="rd-l">'+reads.map(function(c){
      return '<li><a href="/content/'+esc(c.slug)+'">'+
        '<span class="rd-m">'+esc(c.side === "close" ? "폐업" : "창업")+
          (c.read ? ' · '+esc(String(c.read))+'분' : '')+'</span>'+
        '<b>'+esc(c.title)+'</b>'+
        '<span class="rd-p">'+esc(c.lead)+'</span>'+
        '<span class="rd-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
    '<div class="row-cta"><a class="btn btn-o" href="/content">정보 전부 보기'+icon("arrow",16)+'</a></div>'+
  '</div></section>' : "")+
  JourneyBand({ current:"operation", tone:"sec-white",
    title:"다른 것도 준비하고 계신가요?",
    lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." });
}

/* ── /transfer — 인수 · 양도 ──────────────────────────────────
   ⚠️⚠️ **한쪽으로 물들이지 않습니다.** 넘기시는 분과 받으시는 분이
   같은 화면을 봅니다 (`/stores` · `/assets` 와 같은 까닭입니다). */
function PageAcquisition(){
  var t    = (nowQS("t") === "out") ? "out" : "in";
  var ind  = (typeof amIndustry === "function") ? amIndustry(nowQS("i")) : null;
  var iq   = ind ? ("?i=" + encodeURIComponent(ind.key)) : "";
  var nStore = (typeof amStores === "function") ? amStores({}).length : 0;
  var nAsset = (typeof amAssets === "function") ? amAssets({}).length : 0;

  function tab(k, name, lead){
    return '<a class="aq-t'+(t===k?" on":"")+'" href="/transfer?t='+k+
      (ind ? "&i="+encodeURIComponent(ind.key) : "")+'"'+
      (t===k?' aria-current="page"':'')+'>'+
      '<b>'+esc(name)+'</b><em>'+esc(lead)+'</em></a>';
  }

  return PgHero({
    kicker:"TAKE OVER · 인수 · 양도",
    h1raw:"한 사장님의 끝이<br class=\"br-m\"> 다른 사장님의 시작이 됩니다.",
    lead:"있던 가게를 받으면 공사 기간과 초기 비용이 줄고, 넘기면 철거비와 원상복구가 줄어듭니다. 두 분이 같은 화면을 봅니다.",
    cta:'<a class="btn btn-b btn-lg" href="/stores'+esc(iq)+'">매장 매물 보기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/assets'+esc(iq)+'">시설 · 장비 보기</a>'
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">어느 쪽이세요?</p>'+
      '<h2>받으시는 분과 넘기시는 분은 순서가 다릅니다</h2>'+
    '</div>'+
    '<div class="aq-tb">'+
      tab("in",  "매장을 인수합니다", "있던 가게를 받습니다")+
      tab("out", "매장을 넘깁니다",   "하던 가게를 넘깁니다")+
    '</div>'+
    /* ⚠️ 2026-10-06 V2 확정 지시서 §8 의 다섯 메뉴입니다. 전부 **실제로
       있는 화면**이고(가짜 링크는 절대 규칙 5), 매물이 0건이어도
       가이드 · 체크리스트 · 계산기는 **오늘 바로 돌아갑니다** —
       그래서 매물이 없어도 화면이 비어 보이지 않습니다. */
    '<ul class="aq-m">'+[
      ["/stores"+iq,     "store",    "매장 인수하기",   "상가 · 점포 · 권리금 매장"],
      [quoteTo({cat:"transfer"}), "handover", "내 매장 양도하기", "조건을 적어 보내시면 올려 드립니다"],
      ["/tools/premium", "gauge",    "권리금 알아보기", "몇 달이면 돌아오는지 따져 봅니다"],
      ["/content?side=close", "book","인수 · 양도 가이드", "계약 전에 보셔야 하는 것"],
      ["/tools/vs",      "scale",    "신규 vs 인수 비교", "새로 만드는 것과 받는 것"]
    ].map(function(x){
      return '<li><a href="'+esc(x[0])+'">'+
        '<span class="ic-t">'+icon(x[1],22)+'</span>'+
        '<b>'+esc(x[2])+'</b><i>'+esc(x[3])+'</i></a></li>';
    }).join("")+'</ul>'+
  '</div></section>'+
  ProcessBand({ key: t === "out" ? "acq-out" : "acq-in",
    kicker: t === "out" ? "넘기는 순서" : "받는 순서",
    title:  t === "out" ? "넘길 때는 이 순서입니다" : "받을 때는 이 순서입니다",
    lead:   t === "out"
      ? "통째로 넘기면 철거와 원상복구를 안 하셔도 되는 경우가 있습니다. 조건부터 정합니다."
      : "권리금과 시설이 같이 오는지, 임대차가 승계되는지가 금액을 가릅니다.",
    industry: ind ? ind.key : "", tone:"sec-gray",
    note: t === "out"
      ? "매물 등록 기능은 따로 없습니다. 접수로 적어 보내 주시면 사람이 확인하고 올려 드립니다."
      : "매물에 적힌 평수 · 보증금 · 월세 · 권리금 · 매출은 올리신 사장님이 적으신 값이고, 저희가 확인하거나 보증하는 값이 아닙니다." })+
  '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">지금 올라온 것</p>'+
      '<h2>매장 매물 '+nStore+'건 · 시설 · 장비 '+nAsset+'건</h2>'+
      '<p>등록된 차례로 냅니다. 광고로 위에 올린 자리는 없습니다.</p>'+
    '</div>'+
    (nStore || nAsset
      ? '<div class="row-cta"><a class="btn btn-b" href="/stores'+esc(iq)+'">매장 매물 보기'+icon("arrow",16)+'</a>'+
        '<a class="btn btn-o" href="/assets'+esc(iq)+'">시설 · 장비 보기</a></div>'
      : Empty({ icon:"store", title:"아직 올라온 매물이 없습니다",
          text:"올라오는 대로 여기에 나옵니다. 그동안 인수 · 양도에서 자주 막히는 것부터 보셔도 됩니다.",
          reads: (typeof amContentsFor === "function")
            ? amContentsFor({ cat:"transfer", side:"both", limit:3 }) : [],
          cta:'<a class="btn btn-b" href="'+esc(quoteTo({cat:"transfer"}))+'">'+
              '넘길 매장 접수하기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/stores">매물 화면 보기</a>' }))+
  '</div></section>'+
  ReadBand({ cat:"transfer", side:"both", limit:3,
             title:"인수 · 양도에서 자주 막히는 것" })+
  JourneyBand({ current:"acquisition", tone:"sec-white",
    title:"다른 것도 준비하고 계신가요?",
    lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." });
}

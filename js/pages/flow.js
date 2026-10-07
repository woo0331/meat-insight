/* ════════════════════════════════════════════════════════════════════
   창업 · 폐업 플로우 (§6 · §7 · §12 · §21 · §41)

   **이 파일이 Q2 · Q3 에 답합니다** —
   카페 창업자와 미용실 창업자에게 서로 다른 것이 보이고,
   음식점 폐업자와 헬스장 폐업자에게 서로 다른 것이 보입니다.

   갈라 주는 것은 두 곳입니다.
   ① `amCatsFor(업종, side)` — 분류의 **차례**가 업종마다 다릅니다
   ② `amCatItems(분류, 업종)` — 시설·장비의 **하위 분류**가 업종에서 옵니다

   ⚠️ **차례에서 빠진 분류를 잘라 내지 마세요.** `amCatsFor()` 가 뒤에
   붙여 줍니다 — 잘라 내면 그 업종 사장님에게는 그 기능이 아예 없는
   것이 됩니다.
   ⚠️ **업체를 여기서 나열하지 마세요.** 여기는 "무엇이 필요한지" 를
   고르는 자리이고, 업체는 분류를 고른 다음에 나옵니다 (§54).
   ════════════════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════════════
   창업 — 질문 → 선택 → 맞춤 로드맵 (2026-10-07 §22 ~ §32)
   ══════════════════════════════════════════════════════════════════
   > "창업페이지부터는 정보가 많아져도 된다. 하지만 처음부터 모든
   >  정보를 보여주지는 않는다. 항상 질문 → 선택 → 맞춤 결과." (§23)

       STEP 01  어떤 업종을 준비하고 계세요?        /startup
       STEP 02  어떻게 시작할 계획이세요?           /startup/:업종
       STEP 03  맞춤 로드맵 (열셋)                  ?m=new | ?m=take
       걸음 상세                                    ?step=5

   ⚠️⚠️ **인수가 여기서 등장합니다** (§4). "기존 매장 인수" 는 창업
   안의 선택지이지 메인의 첫 선택지가 아닙니다 — 그게 브랜드 이름의
   뜻이고, 메인 첫 선택지는 창업 / 폐업·정리 둘뿐입니다 (§3).
   ⚠️ **고르신 것은 주소에 실립니다** (`?m=` · `?step=` · `?i=`) —
   뒤로 가기 · 새로고침 · 링크 공유에 살아남습니다. */
var START_MODES = [
  { key:"new",  proc:"startup-new",  icon:"seed",     tone:"t1",
    name:"새로 창업하기",
    lead:"새로운 공간에서 처음부터 준비." },
  { key:"take", proc:"startup-take", icon:"handover", tone:"t3",
    name:"기존 매장 인수하기",
    lead:"기존 영업매장 또는 시설을 인수하여 시작." }
];
function startMode(){
  var m = nowQS("m");
  var r = START_MODES.filter(function(x){ return x.key === m; });
  return r.length ? r[0] : null;
}
/* 지금 보고 있는 걸음 — 1부터 셉니다. 없는 번호면 0 입니다. */
function stepNo(n){
  var v = parseInt(nowQS("step"), 10);
  return (v >= 1 && v <= n) ? v : 0;
}

/* STEP 02 — 어떻게 시작할 계획이세요? (§25) */
function ModePick(ind){
  var base = ind ? ("/startup/" + ind.key) : "/startup";
  var cur  = startMode();
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">STEP 02</p>'+
      '<h2>'+(ind ? esc(ind.name)+'을 어떻게 시작할 계획이세요?'
                  : '어떻게 시작할 계획이세요?')+'</h2>'+
      '<p>고르시면 그 길에 맞는 준비 순서만 보여 드립니다.</p>'+
    '</div>'+
    '<ul class="pick-g">'+START_MODES.map(function(m){
      var on = (cur && cur.key === m.key);
      return '<li><a class="pick'+tn(m.tone)+(on ? " on" : "")+'" href="'+
        esc(base + "?m=" + m.key)+'"'+(on ? ' aria-current="true"' : '')+'>'+
        '<span class="pick-ic">'+icon(m.icon,26)+'</span>'+
        '<b>'+esc(m.name)+'</b>'+
        '<span class="pick-l">'+esc(m.lead)+'</span>'+
        '<span class="pick-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
      '</a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* STEP 03 — 맞춤 로드맵, 그리고 걸음 하나 (§26 · §28 · §31) */
function StartRoad(mode, ind){
  var steps = amProcess(mode.proc);
  var cur   = stepNo(steps.length);
  var base  = ind ? ("/startup/" + ind.key) : "/startup";
  var keep  = "m=" + mode.key;
  var what  = mode.key === "new" ? "신규창업" : "기존매장 인수";
  var who   = ind ? (ind.name + " ") : "";
  var road  = ProcessBand({
    key:mode.proc, kicker:"ROADMAP · " + what, tone:"sec-gray",
    title:who + (mode.key === "new" ? "창업, 이 순서로 준비하세요"
                                    : "매장 인수, 이 순서로 준비하세요"),
    lead:steps.length + "걸음입니다. 걸음을 누르시면 그 걸음에 필요한 " +
         "정보 · 체크리스트 · 계산기 · 업체만 모아서 보여 드립니다.",
    industry:ind ? ind.key : "", base:base, keep:keep, cur:cur ? cur - 1 : -1,
    note:ind ? "" : "업종을 고르시면 걸음마다 그 업종에 맞는 장비 · 업체 · 글로 좁혀집니다."
  });
  if(!cur) return road;
  /* 걸음을 고르셨으면 **상세가 먼저**입니다 — 그 걸음에 필요한 것만
     보여 주는 것이 §28 이고, 전체 순서는 그 아래에 그대로 둡니다. */
  return StepDetail({ key:mode.proc, cur:cur - 1, industry:ind ? ind.key : "",
                      base:base, keep:keep, what:what }) + road;
}

/* ── /startup — STEP 01 업종 (§24) ──────────────────────────────── */
function PageStartup(){
  var mode = startMode();
  return PgHero({
    kicker:"창업",
    h1raw:"어떤 업종을<br class=\"br-m\"> 준비하고 계세요?",
    lead:"업종을 선택하면 필요한 준비순서와 서비스만 골라서 보여드릴게요. " +
         "가입 없이 무료입니다."
  })+
  '<section class="sec sec-white" id="industry"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">STEP 01</p>'+
      '<h2>업종을 골라 주세요</h2>'+
      '<p>고르시면 그 업종 창업에 실제로 필요한 것만 추려 드립니다.</p>'+
    '</div>'+
    IndustryGrid("/startup", "")+
  '</div></section>'+
  /* ⚠️ 업종을 안 고르셔도 길이 막히지 않습니다 — 방법만 고르셔도
     순서는 같습니다 (업종은 걸음 안의 장비 · 업체를 좁힐 뿐입니다). */
  ModePick(null)+
  (mode ? StartRoad(mode, null) : "")+
  StartupHelpBand()+
  JourneyBand({ current:"startup", tone:"sec-white",
    title:"다른 것도 준비하고 계신가요?",
    lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." });
}

/* ── /startup/:industry — STEP 02 · 03 ──────────────────────────── */
function PageStartupIndustry(ind){
  var mode = startMode();
  var fcat = amFranchiseCat(ind.key);       /* 같은 key 면 그 분류로 보냅니다 */
  return PgHero({
    crumb: Crumb([["창업","/startup"],[ind.name]]),
    kicker:"창업 · " + ind.name,
    h1raw:esc(ind.name)+" 창업을<br class=\"br-m\"> 준비하고 계시네요.",
    lead:mode
      ? "지금부터 필요한 순서입니다. 걸음마다 꼭 확인할 것과 맡길 곳을 같이 보여 드립니다."
      : "먼저 한 가지만 더 골라 주세요. 새로 만드는 것과 받는 것은 준비 순서가 다릅니다.",
    /* ⚠️ 고른 업종이 **견적 요청까지 따라갑니다** — 여기서 끊으면
       손님이 조건을 처음부터 다시 적습니다 (`check.js` 가 봅니다). */
    cta:'<a class="btn btn-o btn-lg" href="'+esc(quoteTo({industry:ind.key,side:"start"}))+'">'+
        '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/stores?i='+encodeURIComponent(ind.key)+'">'+
        esc(ind.name)+' 점포 보기</a>'
  })+
  ModePick(ind)+
  (mode ? StartRoad(mode, ind) : "")+
  (ind.equip && ind.equip.length ? EquipBand(ind) : "")+
  StepBand(ind)+
  (fcat ? FranchiseHint(fcat, ind) : "")+
  BridgeFor(ind, "start")+
  ReadBand({ side:"start", industry:ind.key,
             title:"창업에서 자주 막히는 것" })+
  StartupHelpBand();
}

/* 업종 전용 장비 (§12) */
function EquipBand(ind){
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+esc(ind.name)+' 전용</p>'+
      '<h2>이 업종에 필요한 장비</h2>'+
      /* ⚠️ 문장 한가운데 링크를 박지 않습니다 — 21px 이라 누르기
         어렵습니다. 문단 끝에 버튼으로 내놓습니다. */
      '<p>업종마다 다릅니다. 새로 사실 수도 있고, 정리하시는 곳에서 '+
        '중고로 인수하실 수도 있습니다.</p>'+
      '<a class="sec-more" href="/assets?i='+encodeURIComponent(ind.key)+'">'+
        '중고 시설 · 장비 보기'+icon("chev",15)+'</a>'+
    '</div>'+
    '<ul class="chip-g">'+ind.equip.map(function(e){
      return '<li><a class="chip" href="/providers/equip?s='+encodeURIComponent(e.key)+
        '&i='+encodeURIComponent(ind.key)+'">'+esc(e.name)+'</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

/* 프랜차이즈로 가는 길 — 같은 업종 분류가 있을 때만 */
function FranchiseHint(fcat, ind){
  return '<section class="sec"><div class="w band-cta">'+
    '<div><p class="eyebrow">프랜차이즈로 시작한다면</p>'+
      '<h2>'+esc(fcat.name)+' 프랜차이즈 비교</h2>'+
      '<p class="lead">창업비 · 가맹비 · 권장 평수 · 모집지역을 나란히 놓고 보십시오. '+
        '본사가 직접 등록한 값만 올라갑니다.</p></div>'+
    '<a class="btn btn-b btn-lg" href="/franchise/'+esc(fcat.key)+'">'+
      esc(fcat.name)+' 브랜드 보기'+icon("arrow",18)+'</a>'+
  '</div></section>';
}

/* ══════════════════════════════════════════════════════════════════
   폐업 · 정리 — 상황 → 맞춤 로드맵 (2026-10-07 §33 ~ §40)
   ══════════════════════════════════════════════════════════════════
   > "폐업하기 전에, 넘길 수 있는 것부터 확인하세요." (§33)
   > **이것이 인수인계의 핵심 차별점입니다.**

   ⚠️⚠️ **폐업을 철거로 시작하지 않습니다** (§38). 네 상황 카드의
   차례도, 로드맵 안의 차례도 **양도 가능성 → 시설 · 장비 → 재고 →
   행정 → 마지막에 철거 · 원상복구**입니다. 바꾸지 마세요.
   ⚠️⚠️ **폐업을 실패로 말하지 않습니다** (§46). 손실 · 실패라는
   낱말을 쓰지 않고, 색도 빨강이 아니라 주황입니다.
   ⚠️ 고르신 상황은 주소(`?s=`)에, 진단 답은 `?d=` 에 실립니다 —
   아무것도 저장하지 않습니다. */
function closeSit(){
  var k = nowQS("s");
  return (window.amCloseWant ? amCloseWant(k) : null);
}
/* 진단 답 — `?d=ynyny` 한 글자씩. 아직 안 고른 자리는 `-` 입니다. */
function closeAns(){
  var raw = String(nowQS("d") || ""), out = {};
  (window.AM_CLOSE_ASK || []).forEach(function(q, i){
    var c = raw.charAt(i);
    if(c === "y" || c === "n") out[q.key] = c;
  });
  return out;
}
function closeAnsStr(i, v){
  var ask = (window.AM_CLOSE_ASK || []), raw = String(nowQS("d") || "");
  var arr = ask.map(function(q, j){
    var c = raw.charAt(j); return (c === "y" || c === "n") ? c : "-"; });
  arr[i] = v;
  return arr.join("");
}

/* STEP 01 — 현재 어떤 상황이신가요? (§34) */
function SitPick(ind){
  var wants = (window.AM_CLOSE_WANTS || []);
  if(!wants.length) return "";
  var base = ind ? ("/closure/" + ind.key) : "/closure";
  var cur  = closeSit();
  return '<section class="sec sec-white" id="sit"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">STEP 01</p>'+
      '<h2>현재 어떤 상황이신가요?</h2>'+
      '<p>고르시면 그 상황에 맞는 순서만 보여 드립니다. '+
        '나머지도 아래에 그대로 있습니다.</p>'+
    '</div>'+
    '<ul class="pick-g pick-g4">'+wants.map(function(w){
      var on = (cur && cur.key === w.key);
      return '<li><a class="pick'+(on ? " on" : "")+'" href="'+
        esc(base + "?s=" + encodeURIComponent(w.key))+'"'+
        (on ? ' aria-current="true"' : '')+'>'+
        '<span class="pick-ic">'+icon(w.icon,24)+'</span>'+
        '<b>'+esc(w.name)+'</b>'+
        '<span class="pick-l">'+esc(w.lead)+'</span>'+
        '<span class="pick-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
      '</a></li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* 짧은 진단 (§39) — ⚠️ 아무것도 저장하지 않습니다 */
function CloseAsk(ind){
  var ask = (window.AM_CLOSE_ASK || []);
  if(!ask.length) return "";
  var base = ind ? ("/closure/" + ind.key) : "/closure";
  var ans  = closeAns();
  var done = ask.every(function(q){ return ans[q.key]; });
  var adv  = done ? amCloseAdvice(ans) : null;
  var pick = adv ? amCloseWant(adv.key) : null;

  var body = '<ol class="ask-l">'+ask.map(function(q, i){
    return '<li class="ask">'+
      '<p class="ask-q"><span class="ask-n">'+(i+1)+'</span>'+esc(q.q)+'</p>'+
      '<p class="ask-a">'+[["y", q.y],["n", q.n]].map(function(o){
        var on = (ans[q.key] === o[0]);
        return '<a class="ask-b'+(on ? " on" : "")+'" href="'+
          esc(base + "?s=unsure&d=" + closeAnsStr(i, o[0]) + "#ask")+'" data-keep>'+
          esc(o[1])+'</a>'; }).join("")+'</p>'+
    '</li>'; }).join("")+'</ol>';

  var out = '<section class="sec sec-gray" id="ask"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">짧은 진단</p>'+
      '<h2>다섯 가지만 여쭤 보겠습니다</h2>'+
      '<p>고르신 답은 주소에만 남고 저장하지 않습니다. '+
        '언제든 다시 고르셔도 됩니다.</p>'+
    '</div>'+ body +
    (adv && pick
      ? '<div class="ask-r">'+
          '<p class="eyebrow">사장님 상황에서는</p>'+
          '<h3>'+esc(pick.name.replace(/[.?]$/, ""))+'</h3>'+
          '<p>'+esc(adv.why)+'</p>'+
          '<p class="row-cta row-left">'+
            '<a class="btn btn-cl" href="'+esc(base + "?s=" + pick.key)+'">'+
              '이 순서로 보기'+icon("arrow",16)+'</a></p>'+
        '</div>'
      : '<p class="sec-note">'+icon("info",15)+
        '다섯 가지에 전부 답해 주시면 맞는 순서를 찾아 드립니다.</p>')+
  '</div></section>';
  return out;
}

/* 고르신 상황의 로드맵 + 걸음 상세 */
function CloseRoad(sit, ind){
  if(!sit.proc) return CloseAsk(ind);
  var steps = amProcess(sit.proc);
  if(!steps.length) return "";
  var cur  = stepNo(steps.length);
  var base = ind ? ("/closure/" + ind.key) : "/closure";
  var keep = "s=" + sit.key;
  var who  = ind ? (ind.name + " ") : "";
  var road = ProcessBand({
    key:sit.proc, kicker:"ROADMAP · " + sit.name.replace(/[.?]$/, ""),
    tone:"sec-gray",
    title:who + (sit.key === "transfer" ? "매장을 넘기려면 이 순서로 준비하세요"
            : sit.key === "assets" ? "시설 · 장비는 이 순서로 정리하세요"
            : "정리, 이 순서로 하세요"),
    lead:steps.length + "걸음입니다. 걸음을 누르시면 그 걸음에 필요한 " +
         "정보 · 체크리스트 · 계산기 · 업체만 모아서 보여 드립니다.",
    industry:ind ? ind.key : "", base:base, keep:keep, cur:cur ? cur - 1 : -1,
    /* ⚠️ 이 줄을 지우지 마세요 — 폐업을 철거로 시작하지 않는 것이
       이 플랫폼의 핵심 차별점입니다 (§33 · §38). */
    note:sit.key === "full"
      ? "철거는 맨 뒤입니다. 넘길 수 있는 것과 팔 수 있는 것을 먼저 고르면 나가는 돈이 줄어듭니다."
      : ""
  });
  if(!cur) return road;
  return StepDetail({ key:sit.proc, cur:cur - 1, industry:ind ? ind.key : "",
                      base:base, keep:keep,
                      what:sit.name.replace(/[.?]$/, "") }) + road;
}

/* ── /closure — STEP 01 상황 (§33 · §34) ────────────────────────── */
function PageClosure(){
  var sit = closeSit();
  return PgHero({
    kicker:"폐업 · 정리",
    h1raw:"폐업하기 전에,<br class=\"br-m\"> 넘길 수 있는 것부터 확인하세요.",
    lead:"매장과 시설, 장비를 바로 철거하기 전에 다음 사장님에게 이어질 수 " +
         "있는지 먼저 확인해보세요."
  })+
  SitPick(null)+
  (sit ? CloseRoad(sit, null) : "")+
  '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">업종을 고르시면</p>'+
      '<h2>업종마다 정리할 것이 다릅니다</h2>'+
      '<p>헬스장은 운동기구와 락커가, 음식점은 주방과 닥트가 남습니다.</p>'+
    '</div>'+
    IndustryGrid("/closure","")+
  '</div></section>'+
  WantBand(null)+
  ClosureHelpBand()+
  JourneyBand({ current:"closing", tone:"sec-white",
    title:"다른 것도 준비하고 계신가요?",
    lead:"창업 · 운영 · 인수 · 양도 · 폐업 — 어느 자리든 이어서 보실 수 있습니다." });
}

/* ── 고르신 상황에 맞는 **분야** (§44 — 183개를 한꺼번에 고르게
   하지 않습니다) ───────────────────────────────────────────────
   ⚠️ **고르신 것에 없는 분류를 숨기지 마세요.** 추린 것 아래에
   나머지도 냅니다 — 숨기면 그 사장님에게는 그 기능이 없는 것이
   됩니다. `check.js` 가 개수를 셉니다. */
function WantBand(ind){
  var i   = ind ? ind.key : "";
  var sel = closeSit();
  if(!sel){
    var all = (window.amCatsFor ? amCatsFor(i, "close") : (window.AM_CLOSE_CATS||[]));
    if(!all.length) return "";
    return '<section class="sec sec-white"><div class="w">'+
      '<div class="sec-hd">'+
        '<p class="eyebrow">고르지 않고 보셔도 됩니다</p>'+
        '<h2>정리에 필요한 것 전부</h2>'+
      '</div>'+
      '<div class="cat-g cat-g4">'+
        all.map(function(c){ return CatCard(c, i); }).join("")+
      '</div>'+
    '</div></section>';
  }
  var g = amCloseCatsFor(sel.key, i);
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">고르신 상황에 맞춰</p>'+
      '<h2>'+esc(sel.name.replace(/[.?]$/, ""))+' — 이 분야들입니다</h2>'+
      '<p>'+esc(sel.lead)+'</p>'+
    '</div>'+
    '<div class="cat-g cat-g4">'+
      g.hit.map(function(c){ return CatCard(c, i); }).join("")+
    '</div>'+
    (g.rest.length
      ? '<div class="sec-hd sec-hd-sub">'+
          '<h2 class="pg-h2">나머지도 그대로 있습니다</h2>'+
          '<p>해당 없으면 건너뛰셔도 됩니다.</p>'+
        '</div>'+
        '<div class="cat-g cat-g4">'+
          g.rest.map(function(c){ return CatCard(c, i); }).join("")+
        '</div>'
      : "")+
    '<div class="row-cta"><a class="btn btn-cl btn-lg" href="'+
      esc(quoteTo({industry:i, side:"close"}))+'">'+
      '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/tools/close">폐업 체크리스트</a></div>'+
  '</div></section>';
}

/* ── /closure/:industry ─────────────────────────────────────────── */
function PageClosureIndustry(ind){
  var sit = closeSit();
  return PgHero({
    crumb: Crumb([["폐업 · 정리","/closure"],[ind.name]]),
    kicker:"폐업 · 정리 · " + ind.name,
    /* ⚠️⚠️ 폐업을 **실패로 말하지 않습니다** — "잘 정리하는 것도
       사업입니다" 까지입니다. */
    h1raw:esc(ind.name)+" 정리를<br class=\"br-m\"> 준비하고 계시네요.",
    lead:sit
      ? "순서가 있는 일입니다. 걸음마다 꼭 확인할 것과 맡길 곳을 같이 보여 드립니다."
      : "먼저 지금 상황만 골라 주세요. 넘기는 것과 정리하는 것은 순서가 다릅니다.",
    cta:'<a class="btn btn-o btn-lg" href="'+esc(quoteTo({industry:ind.key,side:"close"}))+'">'+
        '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/assets?i='+encodeURIComponent(ind.key)+'">'+
        '시설 · 집기 내놓기</a>'
  })+
  SitPick(ind)+
  (sit ? CloseRoad(sit, ind) : "")+
  (ind.equip && ind.equip.length ? SellBand(ind) : "")+
  WantBand(ind)+
  BridgeFor(ind, "close")+
  ReadBand({ side:"close", industry:ind.key,
             title:"정리할 때 자주 막히는 것" })+
  ClosureHelpBand();
}

/* 업종 장비를 **파는 쪽**에서 본 것 (§24) */
function SellBand(ind){
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">'+esc(ind.name)+' 정리</p>'+
      '<h2>이 장비들은 버리지 마세요</h2>'+
      '<p>같은 업종을 준비하는 사장님이 찾습니다. 개별로도, 일괄로도, '+
        '시설 전체 인수로도 내놓으실 수 있습니다.</p>'+
    '</div>'+
    '<ul class="chip-g">'+ind.equip.map(function(e){
      return '<li><a class="chip" href="/assets?i='+encodeURIComponent(ind.key)+
        '&s='+encodeURIComponent(e.key)+'">'+esc(e.name)+'</a></li>';
    }).join("")+
    (ind.stock||[]).map(function(s){
      return '<li><a class="chip chip-2" href="/assets?i='+encodeURIComponent(ind.key)+
        '&c=stock">'+esc(s)+'</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

/* ── 창업 ↔ 폐업 이어 주기 (§34) ────────────────────────────────
   ⚠️ **없으면 구간째 뺍니다.** 빈 목록을 두면 "여긴 아무것도 없네" 가
   되고, 지어낸 매물로 채우면 그게 허위매물입니다. */
function BridgeFor(ind, side){
  var m = amMatchForStartup(ind.key, "");
  var n = m.stores.length + m.assets.length;
  if(side === "start"){
    if(!n) return "";
    return '<section class="sec"><div class="w band-cta band-cta-b">'+
      '<div><p class="eyebrow">창업 ↔ 폐업</p>'+
        '<h2>정리하시는 '+esc(ind.name)+'에서 나온 것</h2>'+
        '<p class="lead">지금 '+n+'건이 올라와 있습니다. 새로 사는 것보다 싸고, '+
          '시설을 그대로 인수하면 공사 기간이 줄어듭니다.</p></div>'+
      '<a class="btn btn-b btn-lg" href="/assets?i='+encodeURIComponent(ind.key)+'">'+
        '보러 가기'+icon("arrow",18)+'</a>'+
    '</div></section>';
  }
  return '<section class="sec"><div class="w band-cta band-cta-b">'+
    '<div><p class="eyebrow">창업 ↔ 폐업</p>'+
      '<h2>한 사장님의 끝이 다른 사장님의 시작이 됩니다</h2>'+
      '<p class="lead">점포 · 시설 · 집기 · 재고를 올려 두시면 같은 업종을 '+
        '준비하는 사장님에게 보입니다. 등록은 무료입니다.</p></div>'+
    '<a class="btn btn-b btn-lg" href="/assets?i='+encodeURIComponent(ind.key)+'">'+
      '내놓기'+icon("arrow",18)+'</a>'+
  '</div></section>';
}

/* 막다른 길을 두지 않습니다 — 어디서 막히든 다음 한 걸음을 줍니다 */
function StartupHelpBand(){
  return '<section class="sec sec-white"><div class="w help-g">'+
    HelpCard("doc","무엇부터 할지 모르겠다면","견적 요청서를 한 번만 적으시면 조건에 맞는 업체들에 같이 전달합니다.","/quote","견적 요청하기")+
    HelpCard("won","돈이 걱정이라면","창업자금과 정책자금 중 조건에 맞는 것을 모아 둡니다.","/support","지원사업 보기")+
    HelpCard("book","먼저 알아보고 싶다면","창업비용 · 권리금 · 인허가처럼 실제로 막히는 것만 정리했습니다.","/content","정보 보기")+
  '</div></section>';
}
function ClosureHelpBand(){
  return '<section class="sec sec-white"><div class="w help-g">'+
    HelpCard("list","순서를 모르겠다면","폐업 절차와 필요서류, 기한이 있는 것부터 정리했습니다.","/c/process","폐업 절차 보기")+
    HelpCard("badge","지원을 받으실 수 있는지","철거비 지원처럼 조건만 맞으면 신청할 수 있는 것이 있습니다.","/support","폐업지원 보기")+
    HelpCard("doc","여러 곳 견적을 한 번에","한 번만 적으시면 철거 · 원상복구 · 폐기물 업체에 같이 전달합니다.","/quote","견적 요청하기")+
  '</div></section>';
}
function HelpCard(ic, t, p, to, label){
  return '<a class="help" href="'+esc(to)+'">'+
    '<span class="help-ic">'+icon(ic,20)+'</span>'+
    '<b>'+esc(t)+'</b><span class="help-p">'+esc(p)+'</span>'+
    '<span class="help-go">'+esc(label)+icon("arrow",15)+'</span></a>';
}

/* ── /c/:cat — 정보 · 매물 성격의 분류 ──────────────────────────── */
function PageCat(cat){
  var side = amCatSide(cat.key);
  var ind  = nowQS("i");
  var items = amCatItems(cat, ind);
  return PgHero({
    crumb: Crumb([[side === "start" ? "창업" : "폐업", side === "start" ? "/startup" : "/closure"],[cat.name]]),
    kicker:(side === "start" ? "START" : "CLOSE") + " · " + cat.lead,
    h1:cat.name,
    lead:cat.desc
  })+
  '<section class="sec sec-white"><div class="w">'+
    (items.length
      ? '<ul class="chip-g">'+items.map(function(i){
          var to = i.to || (cat.to || "");
          return '<li>'+(to
            ? '<a class="chip" href="'+esc(to)+'">'+esc(i.name)+'</a>'
            : '<span class="chip chip-flat">'+esc(i.name)+'</span>')+'</li>';
        }).join("")+'</ul>'
      : "")+
    Empty({
      icon:cat.icon,
      title:"아직 여기에 올라온 것이 없습니다",
      text:"실제 업체와 자료가 확인된 것만 올립니다. 그동안에는 견적 요청으로 "+
           "바로 연결해 드립니다.",
      cta:'<a class="btn btn-b" href="'+esc(quoteTo({cat:cat.key,industry:ind,side:side}))+'">'+
          '견적 요청하기'+icon("arrow",16)+'</a>'+
          '<a class="btn btn-o" href="/join">이 분야 업체라면 입점하기</a>'
    })+
  '</div></section>'+
  /* 여기서 막히신 분께 그 자리에서 답을 냅니다 — 맞는 글이 없으면
     구간째 빠집니다 */
  ReadBand({ cat:cat.key, side:side, industry:ind,
             title:cat.name+"에서 자주 막히는 것" });
}


/* ── /g/:stage — 사업 단계 하나 (2026-10-04 구조 개편) ───────────────
   메인의 여섯 카드가 도착하는 자리입니다. **메인은 단순하게, 내부는
   전문적으로** (§15) — 여기서 그 단계의 분류를 전부 펼칩니다.

   ⚠️⚠️ **분류를 새로 만들지 않습니다.** `catalog.js` 의 분류를
   `lifecycle.js` 가 묶어 둔 차례대로 그릴 뿐이고, 카드를 누르면
   원래 있던 분류 화면(`/providers/:cat` · `/c/:cat` · `/stores` ·
   `/assets` · `/support`)으로 갑니다 — 새 빈 화면을 만들지 않습니다.
   ⚠️ 업체를 여기서 나열하지 마세요. 여기는 "무엇이 필요한지" 를
   고르는 자리입니다 (§54). */
function PageStage(st){
  var cats = amStageCats(st);
  var ind  = nowQS("i");
  /* 단계가 들고 있는 하위 서비스를 **세어서** 냅니다 — 손으로 적지
     않습니다 (분류를 늘리면 저절로 따라옵니다). */
  var n = cats.reduce(function(a, c){ return a + amCatItems(c, ind).length; }, 0);
  var side = (st.side === "both") ? "" : st.side;
  return PgHero({
    crumb: Crumb([["사업 단계","/"],[st.name]]),
    kicker:"STEP " + st.no + " · " + st.sub,
    h1:st.name,
    /* ⚠️ 단계 이름 뒤에 조사를 붙이지 마세요 — 이름에 가운뎃점이
       들어 있어 "폐업 · 정리 에" 가 됩니다 (분류 화면에서 "원상복구
       에서" 로 한 번 겪은 자리입니다). "이 단계" 로 받습니다.
       ⚠️ 숫자는 **세는 값**입니다. 분류를 늘리면 저절로 따라옵니다. */
    lead:st.lead + " 이 단계에 필요한 분야 " + cats.length +
         (n ? "가지와 세부 서비스 " + n + "가지를 모았습니다." : "가지를 모았습니다."),
    cta:'<a class="btn btn-b btn-lg" href="'+esc(quoteTo({industry:ind, side:side || "start"}))+'">'+
        '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/join">이 분야 업체라면 입점하기</a>'
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<ul class="cat-g">'+
      cats.map(function(c){ return '<li>'+CatCard(c, ind)+'</li>'; }).join("")+
      /* 분류가 아닌 화면(프랜차이즈)은 직접 적은 한 장까지입니다 */
      (st.extra || []).map(function(x){
        return '<li><a class="cat" href="'+esc(x.to)+'">'+
          '<span class="cat-ic">'+icon(x.icon,22)+'</span>'+
          '<b>'+esc(x.name)+'</b>'+
          '<span class="cat-l">'+esc(x.lead)+'</span>'+
          '<span class="cat-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
        '</a></li>'; }).join("")+
    '</ul>'+
  '</div></section>'+
  /* 이웃한 단계로 바로 넘어갈 수 있게 — 사업은 한 단계에서 끝나지
     않습니다. ⚠️ 여섯을 다 내지 않고 **앞뒤 하나씩**만 냅니다. */
  StageNear(st)+
  ReadBand({ side:side, industry:ind,
             title:st.name+"에서 자주 막히는 것" });
}

/* 앞뒤 단계 — 차례가 곧 사업의 흐름이라, 끝에서는 한쪽만 나옵니다 */
function StageNear(st){
  var L = (window.AM_STAGES || []);
  var i = L.indexOf(st);
  if(i < 0) return "";
  var near = [L[i-1], L[i+1]].filter(Boolean);
  if(!near.length) return "";
  return '<section class="sec sec-cream"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">이 앞뒤로는</p>'+
      '<h2>사업은 한 단계에서 끝나지 않습니다</h2></div>'+
    /* ⚠️ 카드 생김새는 `StageCard()` **한 곳**입니다 (home.js) —
       여기에 또 적으면 메인과 단계 화면이 서로 달라집니다. */
    '<ul class="mstg-g mstg-g-near">'+near.map(function(s){
      return '<li>'+StageCard(s)+'</li>'; }).join("")+'</ul>'+
  '</div></section>';
}

/* ── 창업을 과정으로 (§7) ────────────────────────────────────────
   분류 열세 개를 늘어놓으면 손님이 그걸 공부해야 합니다. 사장님이
   알고 싶은 것은 **"지금 어디까지 왔고 다음에 뭘 해야 하는가"**
   입니다.

   ⚠️ **단계는 업종과 무관하게 같습니다.** 갈리는 것은 단계 **안**의
   하위 서비스입니다 — 카페 3단계에 커피머신, 미용 3단계에 샴푸대.
   ⚠️ **어느 단계에도 안 든 분류가 없어야 합니다.** 빠지면 그 분류가
   조용히 사라집니다 — `check.js` 가 개수를 맞춰 봅니다. */
function StepBand(ind){
  var steps = (window.AM_START_STEPS || []);
  if(!steps.length) return "";
  var i = ind ? ind.key : "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      /* ⚠️⚠️ **바로 위 `ProcessBand()` 와 같은 말을 하지 마세요.**
         저쪽은 "무엇부터 하나요"(할 일 열둘)이고 여기는 "어느 분야가
         있나요"(분야 열셋을 네 묶음으로)입니다. 둘 다 "순서" 라고
         적었더니 **같은 구간을 두 번 낸 것**으로 읽혔습니다 —
         찍어 보고 알았습니다. */
      '<p class="eyebrow">분야로 찾기</p>'+
      '<h2>'+(ind ? esc(ind.name)+' 창업에 필요한 분야' : '창업에 필요한 분야 전부')+'</h2>'+
      '<p>분류를 외우실 필요 없습니다. 지금 하실 단계만 보세요 — '+
        '필요 없는 것은 건너뛰셔도 됩니다.</p>'+
    '</div>'+
    '<ol class="stp-l">'+ steps.map(function(st){
      var cs = (window.amStepCats ? amStepCats(st, i) : []);
      /* ⚠️ 분류가 하나도 없는 단계는 통째로 뺍니다 (절대 규칙 2) */
      if(!cs.length) return "";
      return '<li class="stp">'+
        '<div class="stp-h">'+
          '<span class="stp-n">STEP '+esc(st.n)+'</span>'+
          '<b class="stp-t">'+esc(st.name)+'</b>'+
          '<span class="stp-d">'+esc(st.lead)+'</span>'+
        '</div>'+
        '<div class="stp-c">'+ cs.map(function(c){
          var items = (window.amCatItems ? amCatItems(c, i) : []).slice(0, 5);
          return '<a class="stp-i'+tn(c.tone)+'" href="'+esc(catTo(c))+
            (i ? '?i='+encodeURIComponent(i) : '')+'">'+
            '<span class="stp-i-ic">'+icon(c.icon,20)+'</span>'+
            '<b>'+esc(c.name)+'</b>'+
            (items.length ? '<span class="stp-i-s">'+
              items.map(function(x){ return esc(x.name); }).join(" · ")+'</span>' : '')+
            '<span class="stp-i-go" aria-hidden="true">'+icon("arrow",15)+'</span>'+
          '</a>';
        }).join("")+'</div>'+
      '</li>';
    }).join("")+'</ol>'+
  '</div></section>';
}

/* ── /services — 전체 서비스 (2026-10-07 §19 · §58) ─────────────────
   메인 §04 의 "전체 서비스 보기" 가 도착하는 자리입니다.

   ⚠️⚠️ **새 분류를 만들지 않았습니다.** `lifecycle.js` 의 사업 단계
   여섯과 `catalog.js` 의 분류 스물다섯을 그대로 펼칠 뿐이고, 카드를
   누르면 원래 있던 분류 화면으로 갑니다. 메인에서 뺀 "사업 단계별
   서비스" 와 "183개 서비스 나열" 이 **여기로 옮겨 온 것**입니다
   (§58 — REMOVE FROM HOME 은 삭제가 아닙니다).
   ⚠️ 숫자는 전부 **그 자리에서 세는 값**입니다. 분류를 늘리면 저절로
   따라옵니다 — 손으로 적지 마세요. */
function PageServices(){
  var stages = (window.AM_STAGES || []);
  var ind = nowQS("i");
  var nCat = (window.AM_CATS || []).length;
  var nSub = (window.AM_CATS || []).reduce(function(a, c){
    return a + amCatItems(c, ind).length; }, 0);
  return PgHero({
    kicker:"ALL SERVICES",
    h1raw:"사장님에게 필요한<br class=\"br-m\"> 서비스 전부",
    lead:"창업 준비부터 폐업 · 정리까지 사업 단계 "+stages.length+"가지, 분야 "+
         nCat+"가지, 세부 서비스 "+nSub+"가지입니다. "+
         "지금 하실 단계만 보셔도 됩니다."
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">사업의 흐름대로</p>'+
      '<h2>어느 단계에 계신가요?</h2>'+
      '<p>왼쪽에서 오른쪽으로 읽으면 그대로 사업의 흐름입니다.</p>'+
    '</div>'+
    '<ul class="mstg-g">'+stages.map(function(s){
      return '<li>'+StageCard(s)+'</li>'; }).join("")+'</ul>'+
  '</div></section>'+
  /* 단계마다 그 안의 분야를 전부 폅니다 — 잘라 내지 않습니다 */
  stages.map(function(st, i){
    var cats = amStageCats(st);
    if(!cats.length) return "";
    return '<section class="sec'+(i % 2 ? " sec-gray" : "")+'"><div class="w">'+
      '<div class="sec-hd sec-hd-row"><div>'+
        '<p class="eyebrow">STEP '+esc(st.no)+'</p>'+
        '<h2>'+esc(st.name)+'</h2>'+
        '<p>'+esc(st.lead)+'</p></div>'+
        '<a class="sec-hd-all" href="/g/'+esc(st.key)+'">이 단계 자세히'+
          icon("arrow",16)+'</a>'+
      '</div>'+
      '<div class="cat-g cat-g4">'+
        cats.map(function(c){ return CatCard(c, ind); }).join("")+
      '</div>'+
    '</div></section>';
  }).join("")+
  '<section class="sec sec-start"><div class="w band-cta">'+
    '<div><p class="eyebrow">어디서부터 할지 모르겠다면</p>'+
      '<h2>지금 상황부터 골라 보세요</h2>'+
      '<p class="lead">창업인지 정리인지만 고르시면 필요한 순서부터 '+
        '안내해 드립니다.</p></div>'+
    '<a class="btn btn-st btn-lg" href="/startup">창업 준비하기'+icon("arrow",18)+'</a>'+
    '<a class="btn btn-cl btn-lg" href="/closure">폐업·정리 준비하기'+icon("arrow",18)+'</a>'+
  '</div></section>';
}

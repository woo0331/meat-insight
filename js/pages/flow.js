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

/* ── /startup — 업종 고르기 ─────────────────────────────────────── */
function PageStartup(){
  return PgHero({
    kicker:"START · 창업",
    h1raw:"어떤 사업을<br class=\"br-m\"> 준비하고 계세요?",
    lead:"업종만 고르시면 그 업종 창업에 실제로 필요한 것만 추려 드립니다. 가입 없이 무료입니다."
  })+
  '<section class="sec sec-white"><div class="w">'+
    IndustryGrid("/startup","")+
  '</div></section>'+
  /* 업종을 아직 안 고르셨어도 **순서**는 같습니다 */
  StepBand(null)+
  StartupHelpBand();
}

/* ── /startup/:industry — 그 업종의 창업 전부 ────────────────────── */
function PageStartupIndustry(ind){
  var cats = amCatsFor(ind.key, "start");
  var fcat = amFranchiseCat(ind.key);       /* 같은 key 면 그 분류로 보냅니다 */
  return PgHero({
    crumb: Crumb([["창업","/startup"],[ind.name]]),
    kicker:"START · " + ind.name,
    h1raw:esc(ind.name)+" 창업,<br class=\"br-m\"> 필요한 건 이만큼입니다.",
    lead:ind.lead,
    cta:'<a class="btn btn-b btn-lg" href="'+esc(quoteTo({industry:ind.key,side:"start"}))+'">'+
        '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/stores?i='+encodeURIComponent(ind.key)+'">'+
        ind.name+' 점포 보기</a>'
  })+
  /* 장비를 제일 앞에 한 번 보여 줍니다 — 업종이 갈리는 것이 여기라
     "이 사이트가 내 업종을 안다" 가 여기서 읽힙니다 (§12) */
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

/* ── /closure — 정리 방법 고르기 (§21) ──────────────────────────── */
function PageClosure(){
  return PgHero({
    kicker:"CLOSE · 폐업",
    h1raw:"사업을 어떻게<br class=\"br-m\"> 정리하고 싶으세요?",
    lead:"통째로 넘기실 수도 있고, 시설만 파실 수도 있습니다. 순서와 기한이 있는 일이라 " +
         "빠뜨리면 돈이 나갑니다."
  })+
  WantBand(null)+
  '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">업종을 고르시면</p>'+
      '<h2>업종마다 정리할 것이 다릅니다</h2>'+
      '<p>헬스장은 운동기구와 락커가, 음식점은 주방과 닥트가 남습니다.</p>'+
    '</div>'+
    IndustryGrid("/closure","")+
  '</div></section>'+
  ClosureHelpBand();
}

/* ── 폐업은 목록이 아니라 **무엇을 원하시는가**부터 (§8) ──────────
   폐업 화면에 들어오자마자 분류 열두 개를 늘어놓으면, 이미 지쳐
   계신 분께 숙제를 하나 더 드리는 것입니다.

   ⚠️ **고르신 것에 없는 분류를 숨기지 마세요.** 추린 것 아래에
   나머지도 냅니다 — 숨기면 그 사장님에게는 그 기능이 없는 것이
   됩니다. `check.js` 가 개수를 셉니다. */
function WantBand(ind){
  var wants = (window.AM_CLOSE_WANTS || []);
  if(!wants.length) return "";
  var i    = ind ? ind.key : "";
  var base = ind ? ("/closure/" + ind.key) : "/closure";
  var now  = nowQS("w");
  var sel  = (window.amCloseWant ? amCloseWant(now) : null);

  var pick = '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">먼저 한 가지만</p>'+
      '<h2>어떻게 정리하고 싶으세요?</h2>'+
      '<p>고르시면 그에 맞는 절차만 앞으로 꺼내 드립니다. '+
        '나머지도 아래에 그대로 있습니다.</p>'+
    '</div>'+
    '<ul class="wnt-l">'+ wants.map(function(w){
      var on = (sel && sel.key === w.key);
      return '<li><a class="wnt'+(on?" on":"")+'" href="'+
        esc(base + "?w=" + encodeURIComponent(w.key))+'"'+
        (on ? ' aria-current="true"' : '')+'>'+
        '<span class="wnt-ic">'+icon(w.icon,20)+'</span>'+
        '<b>'+esc(w.name)+'</b>'+
        '<span class="wnt-l-d">'+esc(w.lead)+'</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';

  if(!sel){
    /* 아직 안 고르셨으면 분류 전부를 그대로 냅니다 — 고르는 것이
       의무가 되면 안 됩니다 */
    var all = (window.amCatsFor ? amCatsFor(i, "close") : (window.AM_CLOSE_CATS||[]));
    return pick + '<section class="sec"><div class="w">'+
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
  return pick +
  '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">고르신 것에 맞춰</p>'+
      '<h2>'+esc(sel.name.replace(/[.?]$/, ""))+' — 이것부터입니다</h2>'+
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
    '<div class="row-cta"><a class="btn btn-b btn-lg" href="'+
      esc(quoteTo({industry:i, side:"close"}))+'">'+
      '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/tools/close">폐업 체크리스트</a></div>'+
  '</div></section>';
}

/* ── /closure/:industry ─────────────────────────────────────────── */
function PageClosureIndustry(ind){
  return PgHero({
    crumb: Crumb([["폐업","/closure"],[ind.name]]),
    kicker:"CLOSE · " + ind.name,
    h1raw:esc(ind.name)+" 정리,<br class=\"br-m\"> 빠뜨리면 돈이 나갑니다.",
    lead:"순서가 있는 일입니다. 계약 해지와 폐업신고에는 기한이 있고, 원상복구 범위는 " +
         "계약서를 먼저 확인하셔야 합니다.",
    cta:'<a class="btn btn-b btn-lg" href="'+esc(quoteTo({industry:ind.key,side:"close"}))+'">'+
        '한 번에 견적 요청'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/assets?i='+encodeURIComponent(ind.key)+'">'+
        '시설 · 집기 내놓기</a>'
  })+
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
      '<p class="eyebrow">창업 준비 순서대로</p>'+
      '<h2>'+(ind ? esc(ind.name)+' 창업, 이 순서로 하시면 됩니다' : '창업은 이 순서로 하시면 됩니다')+'</h2>'+
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

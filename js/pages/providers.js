/* ════════════════════════════════════════════════════════════════════
   업체찾기 · 업체 상세 · 업체 입점 (§35 · §36 · §37 · §39 · §40)

   흐름은 §55 가 정한 그대로입니다.
       상황 → 업종 → 필요한 것 → 업체 → 비교 → 견적/상담

   ⚠️⚠️ **업체가 0 곳일 때 카드를 지어내지 마세요.** 지금 0 곳이고,
   화면은 0 이라고 말합니다. 대신 **그 상태에서도 실제로 되는 것**을
   냅니다 — 견적 요청(사람이 받아서 처리)과 업체 입점.
   ⚠️ **평점 · 후기 수 · 작업 수는 계산한 값만** 찍습니다
   (`amProviderStats`). 후기가 없으면 그 자리가 아예 없습니다.
   ⚠️ **전화번호 목록을 만들지 마세요** (§54). 업체 카드는 비교를 위한
   것이고, 연락은 견적·상담을 통해서 이어집니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── /providers — 분류 고르기 ───────────────────────────────────── */
function PageProviders(){
  var pcats = AM_CATS.filter(function(c){ return c.kind === "provider"; });
  var st = pcats.filter(function(c){ return amCatSide(c.key) === "start"; });
  var cl = pcats.filter(function(c){ return amCatSide(c.key) === "close"; });
  return PgHero({
    kicker:"업체찾기",
    h1raw:"어떤 일을 맡기시나요?",
    lead:"분류를 고르시면 지역과 업종에 맞는 업체를 비교하실 수 있습니다. " +
         "한 번 적으신 내용으로 여러 곳에 견적을 요청하실 수 있습니다.",
    cta:'<a class="btn btn-b btn-lg" href="/quote">견적부터 요청하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="/join">업체 입점하기</a>'
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">START</p><h2>창업에 필요한 업체</h2></div>'+
    '<div class="cat-g cat-g4">'+st.map(function(c){ return CatCard(c,""); }).join("")+'</div>'+
  '</div></section>'+
  '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">CLOSE</p><h2>폐업에 필요한 업체</h2></div>'+
    '<div class="cat-g cat-g4">'+cl.map(function(c){ return CatCard(c,""); }).join("")+'</div>'+
  '</div></section>';
}

/* ── /providers/:cat — 그 분류의 업체 ───────────────────────────── */
function PageProviderCat(cat){
  var sub = nowQS("s"), ind = nowQS("i"), reg = nowQS("r");
  var side = amCatSide(cat.key);
  var items = amCatItems(cat, ind);
  var list = amProviders({ sub:sub || null, industry:ind || null, region:reg || null });

  return PgHero({
    crumb: Crumb([["업체찾기","/providers"],[cat.name]]),
    kicker:(side === "start" ? "START" : "CLOSE") + " · 업체찾기",
    h1:cat.name,
    lead:cat.desc,
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+

    /* 하위 분류 — 이것이 업체 입점의 단위입니다 (§39) */
    (items.length ? '<ul class="chip-g chip-g-fil">'+
      '<li><a class="chip'+(sub?"":" on")+'" href="'+esc(pcUrl(cat,"",ind,reg))+'">전체</a></li>'+
      items.map(function(i){
        return '<li><a class="chip'+(sub===i.key?" on":"")+'" href="'+
          esc(pcUrl(cat,i.key,ind,reg))+'">'+esc(i.name)+'</a></li>';
      }).join("")+'</ul>' : "")+

    /* 거르개 — 지역과 업종 (§35 · §44) */
    '<div class="fil">'+
      '<span class="fil-ic" aria-hidden="true">'+icon("sliders",18)+'</span>'+
      IndustrySelect("fil-i", ind, "pcGo('"+esc(cat.key)+"')")+
      RegionSelect("fil-r", reg, "pcGo('"+esc(cat.key)+"')")+
      '<input type="hidden" id="fil-s" value="'+esc(sub)+'">'+
      '<span class="fil-n">'+(list.length ? list.length+"곳" : "0곳")+'</span>'+
    '</div>'+

    (list.length
      ? '<div class="pv-g">'+list.map(ProviderCard).join("")+'</div>'
      : Empty({
          icon:cat.icon,
          title:"조건에 맞는 업체가 아직 없습니다",
          text:"없는 업체를 지어내지 않습니다. 대신 견적 요청을 남기시면 "+
               "저희가 조건에 맞는 곳을 찾아 연결해 드립니다.",
          cta:'<a class="btn btn-b" href="'+esc(quoteTo({cat:cat.key,sub:sub,industry:ind,region:reg,side:side}))+'">'+
              '견적 요청하기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/join">'+esc(cat.name)+' 업체라면 입점하기</a>'
        }))+
  '</div></section>'+

  '<section class="sec"><div class="w band-cta">'+
    '<div><p class="eyebrow">한 번만 적으세요</p>'+
      '<h2>같은 내용을 업체마다 다시 적지 않으셔도 됩니다</h2>'+
      '<p class="lead">업종 · 지역 · 평수 · 예산 · 일정만 적으시면 조건에 맞는 '+
        '곳에 같이 전달하고, 받으신 제안을 한 화면에서 비교하실 수 있습니다.</p></div>'+
    '<a class="btn btn-b btn-lg" href="'+esc(quoteTo({cat:cat.key,sub:sub,industry:ind,region:reg,side:side}))+'">'+
      '견적 요청하기'+icon("arrow",18)+'</a>'+
  '</div></section>'+
  /* 업체를 부르기 전에 알아 두면 견적이 정확해지는 것들.
     ⚠️ 맞는 글이 없으면 구간째 빠집니다 (절대 규칙 2). */
  ReadBand({ cat:cat.key, side:side, industry:ind,
             title:"업체를 부르기 전에 알아 두면" });
}

function pcUrl(cat, sub, ind, reg){
  var q = [];
  if(sub) q.push("s="+encodeURIComponent(sub));
  if(ind) q.push("i="+encodeURIComponent(ind));
  if(reg) q.push("r="+encodeURIComponent(reg));
  return "/providers/"+cat.key+(q.length ? "?"+q.join("&") : "");
}
/* 거르개를 바꾸면 주소가 바뀝니다 — 주소가 화면을 정합니다.
   ⚠️ 상태를 변수에만 들고 있으면 새로고침·뒤로가기에서 사라집니다. */
window.pcGo = function(catKey){
  var i = $("fil-i"), r = $("fil-r"), s = $("fil-s");
  var q = [];
  if(s && s.value) q.push("s="+encodeURIComponent(s.value));
  if(i && i.value) q.push("i="+encodeURIComponent(i.value));
  if(r && r.value) q.push("r="+encodeURIComponent(r.value));
  go("/providers/"+catKey+(q.length ? "?"+q.join("&") : ""));
};

/* ── /p/:id — 업체 상세 (§37) ──────────────────────────────────── */
function PageProviderOne(p){
  var s = amProviderStats(p) || {};
  var subs = (p.subs||[]).map(function(k){
    for(var i=0;i<AM_CATS.length;i++){
      var hit = (AM_CATS[i].items||[]).filter(function(x){ return x.key === k; })[0];
      if(hit) return hit.name;
    }
    return k;
  });
  return PgHero({
    crumb: Crumb([["업체찾기","/providers"],[p.name]]),
    kicker:(p.regions||[]).map(function(k){ return amRegionName(k); }).join(" · "),
    h1:p.name,
    lead:p.intro || "",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w pv-one">'+
    '<div class="pv-one-m">'+
      /* ⚠️ 후기가 없으면 평점 줄을 통째로 뺍니다 */
      (s.rating != null
        ? '<div class="pv-stat"><span class="pv-stat-v">'+icon("star",18)+
            '<b>'+esc(String(s.rating))+'</b></span>'+
            '<span class="pv-stat-l">후기 '+s.reviews+'건</span></div>'
        : '')+
      (s.jobs ? '<div class="pv-stat"><span class="pv-stat-v"><b>'+s.jobs+'</b></span>'+
            '<span class="pv-stat-l">등록된 작업</span></div>' : '')+
      (p.since ? '<div class="pv-stat"><span class="pv-stat-v"><b>'+esc(String(p.since))+'</b></span>'+
            '<span class="pv-stat-l">시작한 해</span></div>' : '')+
    '</div>'+

    (subs.length ? '<div class="pv-sec"><h2>전문 서비스</h2>'+
      '<ul class="chip-g">'+subs.map(function(n){
        return '<li><span class="chip chip-flat">'+esc(n)+'</span></li>'; }).join("")+
      '</ul></div>' : '')+

    ((p.price||[]).length ? '<div class="pv-sec"><h2>가격</h2>'+
      '<ul class="price-l">'+p.price.map(function(x){
        return '<li><b>'+esc(x.name)+'</b><span>'+
          (x.from ? esc(won(x.from))+'원'+(x.unit?' / '+esc(x.unit):'') : '상담')+'</span>'+
          (x.note ? '<em>'+esc(x.note)+'</em>' : '')+'</li>'; }).join("")+'</ul>'+
      '<p class="note">업체가 등록한 값입니다. 현장 조건에 따라 달라집니다.</p></div>' : '')+

    ((p.portfolio||[]).length ? '<div class="pv-sec"><h2>포트폴리오</h2>'+
      '<div class="pf-g">'+p.portfolio.map(function(f){
        return '<div class="pf">'+
          (f.after ? '<img class="ph" src="'+esc(f.after)+'" alt="'+esc(f.title)+' 완료 사진" loading="lazy" decoding="async">' : '')+
          '<b>'+esc(f.title)+'</b>'+
          '<span>'+esc([amIndustryName(f.industry), f.region, f.year].filter(Boolean).join(" · "))+'</span>'+
        '</div>'; }).join("")+'</div></div>' : '')+

    ((p.reviews||[]).length ? ReviewBlock(p) : '')+

    Empty({
      icon:"chat",
      title:"상담과 견적으로 시작하세요",
      text:"연락처를 바로 드리지 않습니다. 필요한 내용을 적어 주시면 그대로 전달하고, "+
           "업체 연락처는 사장님이 동의하신 뒤에만 오갑니다.",
      cta:'<a class="btn btn-b" href="'+esc(quoteTo({}))+'">무료 견적받기'+icon("arrow",16)+'</a>'
    })+
  '</div></section>'+

  /* 폰에서 늘 붙어 있는 CTA (§37) */
  '<div class="sticky-cta">'+
    '<a class="btn btn-b" href="'+esc(quoteTo({}))+'">무료 견적받기</a>'+
    '<a class="btn btn-o" href="'+esc(quoteTo({}))+'">상담 요청</a>'+
  '</div>';
}

function ReviewBlock(p){
  return '<div class="pv-sec"><h2>후기</h2><ul class="rv-l">'+
    p.reviews.map(function(r){
      var sc = r.score || {};
      return '<li class="rv">'+
        '<div class="rv-t">'+
          '<b>'+icon("star",14)+esc(String(sc.total||"-"))+'</b>'+
          (r.badge && AM_REVIEW_BADGES[r.badge]
            ? '<em class="rv-bd">'+icon("check",12)+esc(AM_REVIEW_BADGES[r.badge])+'</em>' : '')+
          '<span class="rv-at">'+esc(r.at||"")+'</span>'+
        '</div>'+
        (r.text ? '<p>'+esc(r.text)+'</p>' : '')+
        '<ul class="rv-ax">'+(window.AM_REVIEW_AXES||[]).filter(function(a){
            return a.key !== "total" && sc[a.key];
          }).map(function(a){
            return '<li>'+esc(a.name)+' <b>'+esc(String(sc[a.key]))+'</b></li>';
          }).join("")+'</ul>'+
      '</li>';
    }).join("")+'</ul>'+
    '<p class="note">플랫폼을 통해 상담 · 계약하신 분의 후기를 먼저 보여 드립니다.</p></div>';
}

/* ── /join — 업체 입점 (§39) ───────────────────────────────────── */
function PageJoin(){
  var subs = [];
  AM_CATS.forEach(function(c){
    if(c.kind !== "provider") return;
    /* ⚠️ `amAllSubs()` 입니다. `c.items` 를 그대로 쓰면 업종에서
       값을 받는 분류(시설 · 장비)가 여기서 **텅 빕니다** — 제목만
       남고 칸이 비어서 미완성으로 읽힙니다 (절대 규칙 2). */
    var it = (window.amAllSubs ? amAllSubs(c) : (c.items||[]));
    if(!it.length) return;          /* 그래도 비면 줄째 뺍니다 */
    subs.push({ cat:c, items:it });
  });
  var ready = !!(window.WOW_BIZ && WOW_BIZ.sosReady);

  return PgHero({
    kicker:"업체 · 전문가 · 프랜차이즈 본사",
    h1raw:"창업과 폐업을 준비하는<br class=\"br-m\"> 사장님이 직접 찾아옵니다.",
    lead:"하시는 일과 지역만 등록해 두시면, 조건이 맞는 요청만 보내 드립니다. 기본 입점은 무료입니다."
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">이런 곳을 찾고 있습니다</p>'+
      '<h2>입점 분야</h2>'+
      '<p>여기 없는 분야도 적어 주시면 분류를 만들어 드립니다.</p></div>'+
    /* ⚠️ **123개를 다 늘어놓지 마세요.** 이 화면이 하는 일은 업체를
       설득해 등록시키는 것인데, 칩 벽이 2,000px 이면 신청 폼이
       한참 아래로 밀립니다. 분야마다 여섯까지만 보이고 나머지는
       개수로 냅니다 — 어느 분야든 자기 일이 여기 있다는 것만
       알면 됩니다. 정확한 내용은 아래 "하시는 일" 에 적으십니다. */
    '<div class="join-g">'+subs.map(function(g){
      var show = g.items.slice(0, 6), more = g.items.length - show.length;
      return '<div class="join-cat"><b>'+esc(g.cat.name)+'</b>'+
        '<ul class="chip-g">'+show.map(function(i){
          return '<li><span class="chip chip-flat">'+esc(i.name)+'</span></li>';
        }).join("")+
        (more > 0 ? '<li><span class="chip chip-flat chip-more">외 '+more+'</span></li>' : '')+
        '</ul></div>';
    }).join("")+'</div>'+
  '</div></section>'+

  '<section class="sec"><div class="w form-wrap">'+
    '<h2 class="pg-h2">입점 신청</h2>'+
    (ready ? "" :
      /* ⚠️ **"접수하지 못한다" 는 말을 폼 위에 둡니다.** 다 적고 누른
         뒤에 알리면 바쁜 사장님의 시간을 버리게 하는 짓입니다. */
      '<div class="notice-bad"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
        '<p>접수처 설정이 끝나면 바로 열립니다. 그동안에도 '+
        '<a href="/providers">업체찾기</a>와 <a href="/quote">견적 요청</a>은 '+
        '그대로 쓰실 수 있습니다.</p></div>')+
    '<form id="join-f" onsubmit="return joinSend(event)">'+
      Field("jn-name","업체명","",true)+
      Field("jn-ceo","담당자 성함","",true)+
      Field("jn-tel","연락처","010-0000-0000",true,"tel")+
      Field("jn-mail","이메일","",false,"email")+
      '<div class="f-r"><label for="jn-svc">하시는 일 <b>*</b></label>'+
        '<input id="jn-svc" required placeholder="예: 카페 인테리어, 주방 철거"></div>'+
      '<div class="f-r"><label for="jn-reg">서비스 가능 지역 <b>*</b></label>'+
        RegionSelect("jn-reg","")+'</div>'+
      '<div class="f-r"><label for="jn-ind">전문 업종</label>'+
        IndustrySelect("jn-ind","")+'</div>'+
      '<div class="f-r"><label for="jn-note">소개 · 경력 · 포트폴리오 주소</label>'+
        '<textarea id="jn-note" rows="5" placeholder="하신 일과 자신 있는 것을 적어 주세요."></textarea></div>'+
      AgreeBox("jn-ag","업체명 · 담당자 성함 · 연락처 · 이메일 · 하시는 일 · 지역",
               "입점 심사와 안내", "입점 종료 후 1년")+
      '<div id="jn-fail"></div>'+
      '<button class="btn btn-b btn-lg btn-full" type="submit"'+(ready?"":" disabled")+'>'+
        '입점 신청하기'+icon("arrow",18)+'</button>'+
    '</form>'+
  '</div></section>';
}

/* 폼 한 줄 */
window.Field = function(id, label, ph, req, type){
  return '<div class="f-r"><label for="'+esc(id)+'">'+esc(label)+(req?' <b>*</b>':'')+'</label>'+
    '<input id="'+esc(id)+'" type="'+esc(type||"text")+'"'+(req?" required":"")+
    (ph?' placeholder="'+esc(ph)+'"':'')+'></div>';
};

/* 동의 상자 — ⚠️ **수집 항목 · 이용 목적 · 보유 기간을 동의를 받는
   자리에서 같이** 보여 줍니다 (개인정보보호법 제15조 제2항).
   방침 링크만 두고 넘어가지 않습니다.
   ⚠️ **업체에 연락처를 넘기는 것은 여기 포함되지 않습니다** (제17조).
   이 문장을 지우지 마세요. */
window.AgreeBox = function(id, what, why, how){
  return '<div class="agree">'+
    '<label class="agree-l"><input type="checkbox" id="'+esc(id)+'">'+
      '<span>개인정보 수집 · 이용에 동의합니다 <b>*</b></span></label>'+
    '<ul class="agree-u">'+
      '<li><b>수집 항목</b> '+esc(what)+'</li>'+
      '<li><b>이용 목적</b> '+esc(why)+'</li>'+
      '<li><b>보유 기간</b> '+esc(how)+'</li>'+
    '</ul>'+
    '<p class="agree-n">업체에 성함 · 연락처를 전달하는 것은 여기에 '+
      '포함되지 않습니다. 업체가 정해지면 <b>어느 업체인지 알려 드리고 '+
      '그때 다시</b> 동의를 받습니다. '+
      '<a href="/privacy">개인정보처리방침</a></p>'+
  '</div>';
};

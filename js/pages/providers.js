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
  /* ⚠️⚠️ `cat` 을 꼭 넘깁니다 — 안 넘기면 모든 업체가 모든 분야에 나옵니다. */
  var list = amProviders({ cat:cat.key, sub:sub || null,
                           industry:ind || null, region:reg || null });

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
  var subs = (p.subs||[]).map(amSubName);
  /* ⚠️⚠️ **조건을 그대로 넘깁니다.** 전에 여기만 `quoteTo({})` 라,
     업체 상세에서 "무료 견적받기" 를 누르면 **빈 견적 화면**이 떴습니다 —
     분야 화면(`/providers/:cat`)에서는 분류 · 업종 · 지역이 다 따라가는데
     정작 업체를 보고 마음을 정한 자리에서 처음부터 다시 적게 했습니다.
     ⚠️ 업체를 지정해 보내는 것이 **아닙니다** — 업체에 연락처를 넘기는
     것은 상호를 알리고 따로 동의받습니다 (개인정보보호법 제17조).
     여기서 넘기는 것은 **사장님이 다시 안 적어도 되게** 하는 조건뿐입니다. */
  var pvQ = quoteTo({
    sub:      (p.subs || [])[0] || "",
    industry: (p.industries || [])[0] || "",
    region:   (p.regions || [])[0] || ""
  });
  return PgHero({
    crumb: Crumb([["업체찾기","/providers"],[p.name]]),
    kicker:(p.regions||[]).map(function(k){ return amRegionName(k); }).join(" · "),
    h1:p.name,
    lead:p.intro || "",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w pv-one">'+
    /* ⚠️⚠️ **확인한 것은 결정하는 자리에 있어야 합니다.** 전에는 목록
       카드에만 있고 상세에는 없었습니다 — 손님이 업체를 고르는 화면이
       여기입니다. 확인 안 한 항목은 안 적습니다 (없는 신뢰를 만들지
       않습니다). */
    (amProviderBadges(p).length
      ? '<ul class="pv-vf-l">'+amProviderBadges(p).map(function(bd){
          return '<li><em class="pv-vf">'+icon("check",13)+esc(bd)+'</em></li>'; }).join("")+
        '</ul>'
      : '')+
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

    /* ⚠️ **시·군·구는 적어 받아 놓고 안 쓰고 있었습니다.** 경기도는
       넓어서 "경기" 만 보면 안양 업체인지 포천 업체인지 모릅니다 —
       안 맞는 곳에 견적이 가면 손님도 업체도 헛걸음합니다. 업체가
       적어 준 범위를 그대로 냅니다 (우리가 확인한 값이 아닙니다). */
    ((p.gu||[]).length ? '<div class="pv-sec"><h2>일하는 지역</h2>'+
      '<ul class="chip-g">'+p.gu.map(function(g){
        return '<li><span class="chip chip-flat">'+esc(g)+'</span></li>'; }).join("")+
      '</ul><p class="note">업체가 적어 준 범위입니다.</p></div>' : '')+

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
          /* ⚠️ `f.region` 은 **key**(`gyeonggi`)입니다 — 그대로 찍으면
             화면에 영문 key 가 나옵니다. 실제로 그랬습니다. */
          '<span>'+esc([amIndustryName(f.industry), amRegionName(f.region), f.year]
            .filter(Boolean).join(" · "))+'</span>'+
        '</div>'; }).join("")+'</div></div>' : '')+

    ((p.reviews||[]).length ? ReviewBlock(p) : '')+

    Empty({
      icon:"chat",
      title:"상담과 견적으로 시작하세요",
      text:"연락처를 바로 드리지 않습니다. 필요한 내용을 적어 주시면 그대로 전달하고, "+
           "업체 연락처는 사장님이 동의하신 뒤에만 오갑니다.",
      cta:'<a class="btn btn-b" href="'+esc(pvQ)+'">무료 견적받기'+icon("arrow",16)+'</a>'
    })+
  '</div></section>'+

  /* 폰에서 늘 붙어 있는 CTA (§37) */
  '<div class="sticky-cta">'+
    '<a class="btn btn-b" href="'+esc(pvQ)+'">무료 견적받기</a>'+
    '<a class="btn btn-o" href="'+esc(pvQ)+'">상담 요청</a>'+
  '</div>';
}

function rvWho(r){
  var who = r.by ? amMaskName(r.by) + " 사장님" : "사장님";
  var what = [r.industry ? amIndustryName(r.industry) : "", amSubName(r.sub)]
             .filter(Boolean).join(" · ");
  return esc(who) + (what ? " · " + esc(what) : "");
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
        /* ⚠️ **누가 · 무슨 일로** 쓴 후기인지가 빠져 있었습니다.
           카페 사장님에게는 "카페 · 인테리어 후기" 라야 자기 이야기로
           읽힙니다. 이름은 `amMaskName()` 으로 가립니다 — 그대로 올리면
           상호와 붙어서 누구인지 특정됩니다. */
        '<p class="rv-who">'+ rvWho(r) +'</p>'+
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
/* ════════════════════════════════════════════════════════════════════
   업체 입점 (/join) — **설득하는 화면입니다**

   이 화면이 하는 일은 하나입니다 — 업체 사장님이 **등록 버튼을
   누르게 하는 것.** 업체가 모이지 않으면 이 플랫폼은 아무것도
   아닙니다.

   ⚠️⚠️ **성과를 지어내지 마세요.** "월 n건의 요청" · "n곳이 함께합니다"
   는 지금 0 이고, 적으면 표시광고법 제3조 위반입니다. 여기서 낼 수
   있는 것은 **지금 사실인 것**과 **우리가 지키겠다는 약속**까지입니다.
   글은 `js/data/join.js` 한 곳에 있습니다.

   ⚠️ **0 을 숨기지 않습니다.** 오히려 그대로 말하는 것이 이 단계에서
   제일 센 말입니다 — "이 분야에 아직 아무도 없습니다." 등록되면 그
   자리에 실제 숫자가 나오고, 고쳐 쓸 자리가 없습니다.
   ════════════════════════════════════════════════════════════════════ */
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
  JoinNow(subs)+
  JoinWhat()+
  JoinWhy()+
  JoinHow()+
  JoinFields(subs)+
  JoinFaq()+
  JoinForm(ready);
}

/* ── ① 지금 상태 — ⚠️ 0 을 그대로 말합니다 ───────────────────────
   이 단계에서 제일 센 말은 "아직 아무도 없습니다" 입니다. 부풀리면
   등록한 업체가 곧 알아채고, 그때 잃는 것이 훨씬 큽니다. */
function JoinNow(subs){
  var n = (window.AM_PROVIDERS || []).length;
  var open = !!(window.WOW_BIZ && WOW_BIZ.sosReady);
  /* 아직 아무도 없는 분야 — 세는 값입니다 */
  var empty = subs.filter(function(g){
    return window.amProvidersInCat ? amProvidersInCat(g.cat) === 0 : true; }).length;

  return '<section class="sec sec-white"><div class="w">'+
    '<div class="jn-now">'+
      '<div class="jn-now-t">'+
        '<p class="eyebrow">지금 상태</p>'+
        (n
          ? '<h2>지금 <em>'+n+'곳</em>이 등록돼 있습니다.</h2>'+
            '<p class="lead">분야와 지역이 맞는 요청을 나눠 받습니다.</p>'
          : '<h2>아직 <em>아무도</em> 등록하지 않았습니다.</h2>'+
            '<p class="lead">부풀려 말씀드리지 않겠습니다. 지금 등록된 업체는 '+
              '0곳이고, 그래서 지금 들어오시면 그 분야의 <b>첫 번째</b>입니다.</p>')+
      '</div>'+
      '<ul class="jn-now-l">'+
        /* ⚠️ "준비 중" 이라고 하지 않습니다 — 언제 되는지 약속하는 말로
           읽힙니다 (절대 규칙 5). 지금 사실만 적습니다. */
        '<li><b>'+esc(open ? "열려 있습니다" : "아직 열지 않았습니다")+'</b>'+
          '<span>사장님 쪽 견적 요청 접수</span></li>'+
        '<li><b>'+(empty || subs.length)+'개 분야</b>'+
          '<span>'+esc(empty ? "아직 등록된 업체가 없습니다" : "업체를 받고 있습니다")+'</span></li>'+
        '<li><b>무료</b><span>기본 입점 · 프로필 관리</span></li>'+
      '</ul>'+
    '</div>'+
  '</div></section>';
}

/* ── ② 무엇을 받게 되나 ──────────────────────────────────────────
   업체가 제일 먼저 묻는 것입니다 — "그래서 뭐가 오는데?"
   ⚠️ **지어낸 손님을 만들지 마세요.** 이건 특정 요청이 아니라
   **견적 요청 화면이 받는 칸의 목록**입니다.
   ⚠️ **성함 · 연락처를 여기 넣지 마세요** (제17조). */
function JoinWhat(){
  var f = (window.AM_JOIN_FIELDS || []);
  if(!f.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">무엇을 받게 되나</p>'+
      '<h2>요청은 이런 칸으로 옵니다</h2>'+
      '<p>사장님이 직접 적어 보내신 내용을 그대로 전달합니다. '+
        '받으실지 말지는 업체가 정하십니다.</p>'+
    '</div>'+
    '<div class="jn-req">'+
      '<ul class="jn-req-l">'+ f.map(function(x){
        return '<li><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>';
      }).join("")+'</ul>'+
      /* ⚠️ 이 줄을 지우지 마세요. 없으면 업체가 "등록하면 연락처가
         바로 오는구나" 로 잘못 압니다. */
      '<p class="jn-req-n">'+icon("lock",16)+
        '<span>성함과 연락처는 <b>여기 들어 있지 않습니다.</b> 업체가 '+
        '정해지면 사장님께 어느 업체인지 알려 드리고, 그때 다시 동의를 '+
        '받은 뒤에 전달합니다 (개인정보보호법 제17조).</span></p>'+
    '</div>'+
  '</div></section>';
}

/* ── ③ 왜 여기인가 — 약속 넷 ─────────────────────────────────── */
function JoinWhy(){
  var w = (window.AM_JOIN_WHY || []);
  if(!w.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">약속</p>'+
      '<h2>업체에 이렇게 하겠습니다</h2>'+
      '<p>전부 <a href="/terms">이용약관</a>에 근거가 있는 말입니다. '+
        '약관과 다른 말을 화면에 적지 않습니다.</p>'+
    '</div>'+
    '<ul class="jn-why rv-stg">'+ w.map(function(x){
      return '<li data-rv><span class="jn-why-ic">'+icon(x.icon,22)+'</span>'+
        '<b>'+esc(x.t)+'</b><span class="jn-why-d">'+esc(x.d)+'</span></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

/* ── ④ 어떻게 진행되나 — 셋 ─────────────────────────────────── */
function JoinHow(){
  var st = (window.AM_JOIN_STEPS || []);
  if(!st.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">어떻게 진행되나</p>'+
      '<h2>세 걸음이면 됩니다</h2></div>'+
    '<ol class="how-g">'+ st.map(function(x){
      return '<li class="how-i">'+
        '<span class="how-n">'+esc(x.n)+'</span>'+
        '<b class="how-t">'+esc(x.t)+'</b>'+
        '<span class="how-d">'+esc(x.d)+'</span>'+
      '</li>';
    }).join("")+'</ol>'+
  '</div></section>';
}

/* ── ⑤ 입점 분야 ─────────────────────────────────────────────────
   ⚠️ **123개를 다 늘어놓지 마세요.** 이 화면이 하는 일은 업체를
   설득해 등록시키는 것인데, 칩 벽이 2,000px 이면 신청 폼이 한참
   아래로 밀립니다. 분야마다 여섯까지만 보이고 나머지는 개수로
   냅니다 — 어느 분야든 자기 일이 여기 있다는 것만 알면 됩니다. */
function JoinFields(subs){
  if(!subs.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">이런 곳을 찾고 있습니다</p>'+
      '<h2>입점 분야</h2>'+
      '<p>여기 없는 분야도 적어 주시면 분류를 만들어 드립니다.</p></div>'+
    '<div class="join-g">'+subs.map(function(g){
      var show = g.items.slice(0, 6), more = g.items.length - show.length;
      var n = window.amProvidersInCat ? amProvidersInCat(g.cat) : 0;
      return '<div class="join-cat"><b>'+esc(g.cat.name)+
        /* ⚠️ 0 이면 0 이라고 말합니다. 등록되면 저절로 숫자가 됩니다. */
        '<i class="join-n'+(n ? "" : " join-n0")+'">'+
          esc(n ? n + "곳" : "아직 없음")+'</i></b>'+
        '<ul class="chip-g">'+show.map(function(i){
          return '<li><span class="chip chip-flat">'+esc(i.name)+'</span></li>';
        }).join("")+
        (more > 0 ? '<li><span class="chip chip-flat chip-more">외 '+more+'</span></li>' : '')+
        '</ul></div>';
    }).join("")+'</div>'+
  '</div></section>';
}

/* ── ⑥ 업체가 자주 묻는 것 ──────────────────────────────────────
   ⚠️ **FAQPage 구조화 데이터를 달지 마세요.** `/faq` 가 손님용 FAQ 로
   이미 달고 있어서, 여기에 또 달면 같은 유형이 두 주소로 나갑니다. */
function JoinFaq(){
  var f = (window.amJoinFaq ? amJoinFaq() : []);
  if(!f.length) return "";
  return '<section class="sec"><div class="w w-narrow">'+
    '<div class="sec-hd"><p class="eyebrow">업체가 자주 묻는 것</p>'+
      '<h2>먼저 궁금해하시는 것들</h2></div>'+
    '<ul class="faq-l">'+ f.map(function(x){
      return '<li class="faq-i"><b class="faq-q">'+esc(x.q)+'</b>'+
        '<p class="faq-a">'+esc(x.a)+'</p></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

/* ── ⑦ 신청 폼 ─────────────────────────────────────────────────── */
function JoinForm(ready){
  return '<section class="sec sec-white"><div class="w form-wrap">'+
    '<h2 class="pg-h2">입점 신청</h2>'+
    (ready ? "" :
      /* ⚠️ **"접수하지 못한다" 는 말을 폼 위에 둡니다.** 다 적고 누른
         뒤에 알리면 바쁜 사장님의 시간을 버리게 하는 짓입니다. */
      '<div class="notice-bad"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
        '<p>접수처 설정이 끝나면 바로 열립니다. 그동안에도 '+
        '<a href="/providers">업체찾기</a>와 <a href="/quote">견적 요청</a>은 '+
        '그대로 쓰실 수 있습니다.</p></div>')+
    '<form id="join-f" onsubmit="return joinSend(event)">'+
      Field("jn-name","업체명","",true,"text","organization")+
      Field("jn-ceo","담당자 성함","",true,"text","name")+
      Field("jn-tel","연락처","010-0000-0000",true,"tel","tel")+
      Field("jn-mail","이메일","",false,"email","email")+
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

/* 폼 한 줄
   ⚠️ **`autocomplete` 을 꼭 주세요.** 손님이 40~60대 사장님이고 거의 폰
   입니다 — 성함 · 연락처를 매번 손으로 치게 하면 거기서 그만두십니다.
   표준 값을 주면 브라우저가 저장해 둔 것을 한 번에 채워 줍니다.
   ⚠️ 표준에 없는 말을 적으면 **아무 효과가 없습니다** (그냥 무시됩니다) —
   name · tel · email · organization · address-level2 를 씁니다. */
window.Field = function(id, label, ph, req, type, auto){
  return '<div class="f-r"><label for="'+esc(id)+'">'+esc(label)+(req?' <b>*</b>':'')+'</label>'+
    '<input id="'+esc(id)+'" type="'+esc(type||"text")+'"'+(req?" required":"")+
    (auto?' autocomplete="'+esc(auto)+'"':'')+
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

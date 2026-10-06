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
  '</div></section>'+
  SampleBand();
}

/* ⚠️⚠️ **업체가 0곳일 때만 냅니다** (2026-10-06 V2 확정 지시서 §13).
   등록이 시작되면 이 구간은 **저절로 사라집니다** — 실제 업체 옆에
   예시 카드가 서 있으면 어느 쪽이 진짜인지 흐려집니다.
   ⚠️ 카드는 **눌리지 않습니다.** 자세히 보실 분은 아래 단추로 예시
   화면(`/sample`, 색인 제외)으로 갑니다 — 지어낸 업체가 손님 동선에
   섞이지 않게 **한 걸음 떨어뜨려** 둡니다 (절대 규칙 1).
   ⚠️⚠️ 평점 · 시공 건수 · 후기 수를 **적는 칸이 없습니다.** 카드의
   평점은 예시 후기 셋에서 계산한 값이고, "시공 300건" 같은 실적은
   어디에도 안 적습니다 (§13 이 직접 금지). */
function SampleBand(){
  var p = amSample("provider");
  if(!p || (window.AM_PROVIDERS||[]).length) return "";
  return '<section class="sec sec-gray"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">SAMPLE</p>'+
      '<h2>업체 카드는 이렇게 보입니다</h2>'+
      '<p>아직 등록된 업체가 없습니다. 지어내지 않고, 대신 '+
        '<b>입점하면 어떻게 나가는지</b>를 예시로 보여 드립니다.</p></div>'+
    '<div class="smp-card">'+ProviderCard(p)+'</div>'+
    '<p class="row-cta">'+
      '<a class="btn btn-b btn-lg" href="/sample">업체 상세 예시 보기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/join">업체로 입점하기</a>'+
    '</p>'+
  '</div></section>';
}

/* ── /providers/:cat — 그 분류의 업체 ───────────────────────────── */
function PageProviderCat(cat){
  var sub = nowQS("s"), ind = nowQS("i"), reg = nowQS("r");
  /* 2026-10-05 V2 §11 — 우리가 **실제로 들고 있는 사실**로만 거릅니다 */
  var vf = nowQS("v") === "1", fo = nowQS("f") === "1";
  var side = amCatSide(cat.key);
  var items = amCatItems(cat, ind);
  /* ⚠️⚠️ `cat` 을 꼭 넘깁니다 — 안 넘기면 모든 업체가 모든 분야에 나옵니다. */
  var list = amProviders({ cat:cat.key, sub:sub || null,
                           industry:ind || null, region:reg || null,
                           verified:vf, folio:fo });
  /* 거르개를 켜면 몇 곳이 빠지는지 — ⚠️ **센 값**입니다 */
  var all  = amProviders({ cat:cat.key, sub:sub || null,
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
      /* ⚠️⚠️ **재 본 적 없는 값으로는 안 거릅니다.** 지시서 §11 의
         "평점 · 응답속도 · 가격대" 는 각각 후기 0건 · 재는 장치 없음 ·
         업체마다 단위가 달라서, 거르개로 만들면 아무도 안 걸리거나
         지어낸 순서가 됩니다. 아래 둘은 우리가 **서류로 확인한 사실**과
         **세는 값**입니다.
         ⚠️ 체크칸은 `<label>` 로 감싸서 글자를 눌러도 켜집니다 (누름 44px). */
      '<label class="fil-ck'+(vf?" on":"")+'">'+
        '<input type="checkbox" id="fil-v"'+(vf?" checked":"")+
        ' onchange="pcGo(\''+esc(cat.key)+'\')">'+
        '<span>확인된 곳만</span></label>'+
      '<label class="fil-ck'+(fo?" on":"")+'">'+
        '<input type="checkbox" id="fil-f"'+(fo?" checked":"")+
        ' onchange="pcGo(\''+esc(cat.key)+'\')">'+
        '<span>포트폴리오 있는 곳만</span></label>'+
      '<span class="fil-n">'+(list.length ? list.length+"곳" : "0곳")+
        /* ⚠️ 거르개 때문에 빠진 곳이 몇인지 **밝힙니다** — 안 밝히면
           손님은 그 분야에 업체가 원래 그만큼인 줄 압니다 */
        ((vf || fo) && all.length > list.length
          ? '<em class="fil-off">거르개로 '+(all.length - list.length)+'곳 숨김</em>' : '')+
      '</span>'+
    '</div>'+

    (list.length
      /* ⚠️ 24장씩 — 1000곳이 등록되는 날 카드 1000장을 한 번에
         그리지 않습니다 (`MoreBtn()` 한 곳에서 셉니다). */
      /* ⚠️ 목록에서는 **비교에 담을 수 있는** 카드를 냅니다 (V2 §14) */
      ? '<div class="pv-g">'+list.slice(0, amShown(list.length)).map(ProviderPickCard).join("")+'</div>'+
        /* ⚠️ 차례의 기준을 밝힙니다 (약관 제6조 제4항) */
        '<p class="note">등록된 차례로 냅니다. 광고로 위에 올린 자리는 없습니다.</p>'+
        MoreBtn(list.length)
      /* ⚠️⚠️ **2026-10-06 2차 §8** — "없습니다" 를 주인공에서 내렸습니다.
         주인공은 **지금 바로 도움이 되는 것**이고, 0 은 아래 줄에서
         세는 값으로 그대로 말합니다 (숨기지 않습니다). */
      : EmptyGuide({
          icon:cat.icon,
          title:cat.name+" 업체를 찾고 계신가요?",
          text:"좋은 업체를 고르려면 가격보다 먼저 확인해야 할 것이 있습니다.",
          /* ⚠️ 실제로 있는 글만입니다. 제목을 지어내면 가짜 링크입니다. */
          reads: amContentsFor({ cat:cat.key, side:side, industry:ind, limit:4 }),
          /* ⚠️ `EmptyGuide()` 가 `esc()` 를 겁니다 — 여기서 또 걸면
             두 번 이스케이프되어 화면에 `&amp;` 가 찍힙니다. */
          note:"이 분야에 등록된 "+amBrand()+" 파트너 업체는 지금 "+
               all.length+"곳입니다. 조건을 남겨 두시면 등록되는 대로 연결해 드립니다.",
          cta:'<a class="btn btn-b" href="'+esc(quoteTo({cat:cat.key,sub:sub,industry:ind,region:reg,side:side}))+'">'+
              '원하는 조건 남기기'+icon("arrow",16)+'</a>'+
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
  CmpBar()+
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
  /* ⚠️ 하위 분류를 바꿔도 켜 둔 거르개는 **그대로 둡니다** — 꺼지면
     손님은 자기가 끈 줄 모르고 결과가 늘어난 것만 봅니다. */
  if(nowQS("v") === "1") q.push("v=1");
  if(nowQS("f") === "1") q.push("f=1");
  return "/providers/"+cat.key+(q.length ? "?"+q.join("&") : "");
}
/* 거르개를 바꾸면 주소가 바뀝니다 — 주소가 화면을 정합니다.
   ⚠️ 상태를 변수에만 들고 있으면 새로고침·뒤로가기에서 사라집니다. */
window.pcGo = function(catKey){
  var i = $("fil-i"), r = $("fil-r"), s = $("fil-s");
  var v = $("fil-v"), f = $("fil-f");
  var q = [];
  if(s && s.value) q.push("s="+encodeURIComponent(s.value));
  if(i && i.value) q.push("i="+encodeURIComponent(i.value));
  if(r && r.value) q.push("r="+encodeURIComponent(r.value));
  if(v && v.checked) q.push("v=1");
  if(f && f.checked) q.push("f=1");
  go("/providers/"+catKey+(q.length ? "?"+q.join("&") : ""));
};

/* ── /p/:id — 업체 상세 (§37) ──────────────────────────────────── */
function PageProviderOne(p){
  var s = amProviderStats(p) || {};
  var subs = (p.subs||[]).map(amSubName).filter(Boolean);
  var inds = (p.industries||[]).map(amIndustryName).filter(Boolean);
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

    (subs.length ? '<div class="pv-sec"><h2>이런 일을 합니다</h2>'+
      '<ul class="chip-g">'+subs.map(function(n){
        return '<li><span class="chip chip-flat">'+esc(n)+'</span></li>'; }).join("")+
      '</ul></div>' : '')+

    /* ⚠️⚠️ **전문 업종도 적어 받아 놓고 안 쓰고 있었습니다** — `gu` 가
       그랬던 것과 같은 자리입니다 (2026-10-06 2차 §11 이 "전문 업종"
       을 따로 적었습니다). 카페 전문 업체인지 음식점 전문인지가
       손님에게는 지역만큼 중요합니다. */
    (inds.length ? '<div class="pv-sec"><h2>전문 업종</h2>'+
      '<ul class="chip-g">'+inds.map(function(n){
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

    /* ── A/S (2026-10-06 2차 §10 · §11) ──────────────────────────
       ⚠️⚠️ **업체가 적은 값입니다.** 우리가 확인한 것이 아니라서
       아래 한 줄로 그렇게 밝힙니다 — 확인 배지(`verified`)와 섞이면
       "플랫폼이 A/S 를 보증한다" 로 읽히고, 그 순간 지키지 못할
       약속이 됩니다 (절대 규칙 5). 비면 구간째 빠집니다. */
    ((p.as && (p.as.period || p.as.what))
      ? '<div class="pv-sec"><h2>A/S</h2>'+
        '<ul class="pv-as">'+
          (p.as.period ? '<li><b>기간</b><span>'+esc(p.as.period)+'</span></li>' : '')+
          (p.as.what   ? '<li><b>범위</b><span>'+esc(p.as.what)+'</span></li>' : '')+
        '</ul>'+
        '<p class="note">업체가 적어 준 내용입니다. 계약서로 다시 확인하세요.</p></div>'
      : '')+

    /* ── 업체 FAQ (§11) — ⚠️ `**굵게**` 를 쓰지 마세요. `esc()` 만
       거치는 칸이라 별표가 글자로 찍힙니다 (13건 겪은 자리).
       ⚠️⚠️ 여기에 FAQPage 구조화 데이터를 달지 마세요 — `/faq` 가
       이미 달고 있어서 같은 유형이 두 주소로 나갑니다. */
    ((p.faq||[]).length ? '<div class="pv-sec"><h2>자주 묻는 것</h2>'+
      '<ul class="pv-faq">'+p.faq.map(function(f){
        return '<li><b>'+esc(f.q)+'</b><p>'+esc(f.a)+'</p></li>'; }).join("")+
      '</ul>'+
      '<p class="note">업체가 적어 준 내용입니다.</p></div>' : '')+

    ((p.reviews||[]).length ? ReviewBlock(p) : '')+

    Empty({
      icon:"chat",
      title:"상담과 견적으로 시작하세요",
      text:"연락처를 바로 드리지 않습니다. 필요한 내용을 적어 주시면 그대로 전달하고, "+
           "업체 연락처는 사장님이 동의하신 뒤에만 오갑니다.",
      /* ⚠️⚠️ **아래 붙는 CTA 는 폰에서만 보입니다** (`.sticky-cta`) —
         저장 단추를 거기에만 두었더니 넓은 화면에서는 **저장할 방법이
         아예 없었습니다.** 찍어 보고 알았습니다. 여기에도 같이 둡니다. */
      cta:'<a class="btn btn-b" href="'+esc(pvQ)+'">무료 견적받기'+icon("arrow",16)+'</a>'+
          SaveBtn(p)
    })+
  '</div></section>'+

  /* 폰에서 늘 붙어 있는 CTA (§37)
     ⚠️ 2026-10-05 V2 §13 이 CTA 넷(무료 상담 · 견적 요청 · 전화 문의 ·
     관심 업체 저장)을 적었습니다. **전화 문의는 안 넣었습니다** —
     업체 전화번호를 화면에 깔면 그건 전화번호부이고(§54), 중개를
     거치지 않아 제3자 제공 동의 절차도 건너뜁니다. 저장은 넣었습니다. */
  '<div class="sticky-cta">'+
    '<a class="btn btn-b" href="'+esc(pvQ)+'">무료 견적받기</a>'+
    '<a class="btn btn-o" href="'+esc(pvQ)+'">상담 요청</a>'+
    SaveBtn(p)+
  '</div>';
}

/* 관심 업체 단추 — ⚠️ **한 곳에서만 만듭니다.** 두 자리(본문 끝 ·
   폰 고정 CTA)가 같이 쓰는데 따로 적으면 서로 달라집니다. */
function SaveBtn(p){
  var on = (typeof amIsSaved === "function") && amIsSaved(p.id);
  return '<button class="btn btn-o btn-ic" type="button"'+
    ' onclick="saveToggle(\''+esc(p.id)+'\')"'+
    ' aria-pressed="'+(on ? "true" : "false")+'">'+
    icon(on ? "check" : "plus", 16)+
    '<span>'+(on ? "저장됨" : "관심 업체")+'</span></button>';
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

/* ══════════════════════════════════════════════════════════════════
   /sample — 업체 상세 **예시** 화면 (2026-10-06 V2 확정 지시서 §14)
   ══════════════════════════════════════════════════════════════════
   > "업체 영업을 시작하기 전에 반드시 필요한 화면이다 …
   >  'STOREWAY에 입점하면 이렇게 노출됩니다' 라고 바로 보여 줄 수
   >  있는 수준이어야 한다."

   ⚠️⚠️ **색인에서 뺍니다** (`NOINDEX` · sitemap 제외). 지어낸 업체
   화면이 구글에 나가면 손님이 검색으로 들어와 전화를 겁니다 — 그
   순간 표시·광고의 공정화에 관한 법률 제3조이고, 보고 연락한 사람의
   시간을 훔치는 일입니다 (절대 규칙 1). 이 화면은 **업체 사장님께
   보여 드리는 자리**이지 손님 동선이 아닙니다.
   ⚠️ 그래서 **맨 위와 맨 아래 두 곳**에 예시라고 적습니다 — 중간부터
   보시는 분이 없게.
   ⚠️⚠️ **없는 값을 지어내지 않습니다** (§14 "데이터가 없는 항목은
   가짜 정보를 채우지 않는다"). 가격 · FAQ · A/S 는 **업체가 적는
   칸**이라 여기서는 "입점 업체는 이 자리에 실제 정보가 표시됩니다"
   까지만 냅니다. 평점은 아래 예시 후기 셋에서 **계산**합니다.
   ⚠️ 생김새는 `PageProviderOne()` **그대로**입니다 — 두 벌로 만들면
   실제 업체 화면을 고쳐도 영업용 화면만 옛날이 됩니다. */
var SAMPLE_SLOTS = [
  { t:"가격 정보",  d:"시공 단가 · 기본 공사비 · 추가 비용 기준" },
  { t:"자주 묻는 것", d:"공사 기간 · 계약금 · 자재 변경 같은 업체별 답" },
  { t:"A/S 정책",   d:"보증 기간과 범위, 하자 접수 방법" }
];
function SampleNote(where){
  return '<div class="smp-note smp-'+esc(where)+'">'+icon("info",18)+
    '<span><b>예시 화면입니다. 실제 업체가 아닙니다.</b> '+
    esc(amBrand())+'에 입점하시면 업체 정보가 이런 짜임새로 나갑니다 — '+
    '상호 · 후기 · 평점 · 사진은 전부 업체와 손님이 올린 것만 올라갑니다.</span></div>';
}
function PageSample(){
  var p = amSample("provider");
  /* ⚠️ 스위치가 꺼져 있으면 **화면째** 없습니다 (절대 규칙 2) */
  if(!p) return PgHero({ kicker:"예시", h1:"예시 화면이 꺼져 있습니다",
    lead:"관리자가 예시 프로필을 꺼 두었습니다.", tight:true })+
    '<section class="sec sec-white"><div class="w">'+
      Empty({ icon:"users", title:"지금은 볼 수 없습니다",
        text:"실제 업체 목록은 업체찾기에서 보실 수 있습니다.",
        cta:[["/providers","업체찾기"]] })+'</div></section>';
  /* ⚠️ 바탕을 **회색**으로 둡니다 — 바로 아래 히어로가 흰색이라
     흰색으로 두면 "이웃한 두 구간이 붙어 보임" 이 ΔE 0.00 으로
     잡힙니다 (실제로 그렇게 잡혔습니다). */
  return '<section class="sec sec-gray smp-top"><div class="w">'+
      SampleNote("top")+'</div></section>'+
    PageProviderOne(p)+
    '<section class="sec sec-gray"><div class="w">'+
      '<div class="sec-hd"><p class="eyebrow">PARTNER</p>'+
        '<h2>입점하시면 이 자리가 채워집니다</h2>'+
        '<p>아래는 업체가 직접 적는 칸입니다. 저희가 대신 적지 않습니다.</p></div>'+
      '<ul class="smp-slot">'+SAMPLE_SLOTS.map(function(x){
        return '<li><b>'+esc(x.t)+'</b><i>'+esc(x.d)+'</i>'+
          '<em>입점 업체는 이 자리에 실제 정보가 표시됩니다.</em></li>';
      }).join("")+'</ul>'+
      '<p class="row-cta"><a class="btn btn-b btn-lg" href="/join">업체 입점 알아보기'+
        icon("arrow",18)+'</a></p>'+
    '</div></section>'+
    '<section class="sec sec-white"><div class="w">'+SampleNote("bot")+'</div></section>';
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
  /* ⚠️⚠️ V2 지시서 §26 이 "별도 파트너 페이지" 를 적었는데, 이 화면이
     이미 그 화면입니다 — 또 만들면 **같은 내용이 두 주소로** 나가고
     구글이 둘 다 무시합니다. 없던 것(§26 의 "입점하면 어디에
     노출되는지 · 업체 카드 예시 · 업체 상세페이지 예시")만 여기에
     더했습니다. `/partners` 는 vercel 이 308 로 여기 보냅니다. */
  JoinShow()+
  JoinWhy()+
  JoinHow()+
  JoinFields(subs)+
  JoinFaq()+
  JoinForm(ready);
}

/* ── 입점하면 어디에 보이나 + 이렇게 보입니다 (V2 §26 · §19) ──────
   ⚠️⚠️ **여기 쓰는 프로필은 `AM_SAMPLES` 이고 `AM_PROVIDERS` 가
   아닙니다.** 업체찾기 · 검색 · 메인 · sitemap 어디에도 안 나옵니다 —
   지어낸 업체를 손님 동선에 섞으면 표시광고법 제3조입니다.
   ⚠️ 카드마다 **예시 딱지**를 붙이고 구간 아래에 한 줄을 더 적습니다.
   ⚠️ 노출 자리는 전부 **실제로 있는 화면**입니다. 없는 자리를 적으면
   업체에게 하는 거짓말이고, 등록하고 나면 바로 압니다. */
var JOIN_WHERE = [
  { ic:"search",   t:"업체찾기",        p:"분야 · 지역 · 업종 · 하위 서비스로 좁혀 찾는 화면", to:"/providers" },
  { ic:"grid",     t:"분야 화면",       p:"인테리어 · 철거 · 세무처럼 분야마다 있는 화면", to:"/providers/interior" },
  { ic:"compare",  t:"업체 비교",       p:"손님이 두세 곳을 나란히 놓고 보는 화면" },
  { ic:"home",     t:"메인 업체 구간",  p:"첫 화면에서 등록된 차례로", to:"/" },
  { ic:"layers",   t:"사업 단계 화면",  p:"그 단계에 필요한 분야로 들어온 손님에게", to:"/g/build" },
  { ic:"doc",      t:"견적 요청",       p:"분야 · 지역이 맞는 요청을 나눠 받습니다", to:"/quote" }
];
function JoinShow(){
  var sp = (typeof amSample === "function") ? amSample("provider") : null;
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">입점하면 어디에 보이나</p>'+
      '<h2>등록 한 번으로 이 자리에 같이 올라갑니다</h2>'+
      '<p>따로 신청하실 것이 없습니다. 하시는 일과 지역이 맞는 자리에 저절로 나갑니다.</p>'+
    '</div>'+
    '<ul class="ops-g">'+JOIN_WHERE.map(function(w){
      var in1 = '<span class="ops-i">'+icon(w.ic,22)+'</span>'+
        '<b>'+esc(w.t)+'</b>';
      /* ⚠️ 아직 화면이 없는 자리는 **링크를 걸지 않습니다** (가짜 링크 금지) */
      return '<li>'+(w.to
        ? '<a class="ops" href="'+esc(w.to)+'">'+in1+
          '<span class="ops-go" aria-hidden="true">'+icon("chev",15)+'</span></a>'
        : '<span class="ops">'+in1+'</span>')+'</li>';
    }).join("")+'</ul>'+
    (sp ? '<div class="jn-ex">'+
      '<p class="jn-ex-h"><b>업체 카드는 이렇게 보입니다</b>'+
        '<em>아래는 예시입니다 — 실제 업체가 아니고, 손님 화면 어디에도 나오지 않습니다.</em></p>'+
      '<div class="jn-ex-b"><span class="jn-ex-tag">예시</span>'+
        ProviderCard(sp)+
      '</div>'+
      '<p class="jn-ex-h"><b>상세 화면에는 이만큼 들어갑니다</b>'+
        '<em>사진 · 전문분야 · 전문업종 · 활동지역 · 가격 · 포트폴리오 · 확인 · 후기 · 상담 시간.</em></p>'+
      '<ul class="jn-ex-l">'+ joinExRows(sp).map(function(r){
        return '<li><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></li>'; }).join("")+'</ul>'+
      '<p class="sec-note">'+icon("info",15)+
        /* ⚠️ 여기는 `mark()` 를 안 거치는 자리라 별표가 **글자로** 찍힙니다 */
        '평점과 후기 수는 값으로 저장하지 않습니다 — 손님이 쓰신 후기에서 계산합니다. '+
        '등록하실 때 적는 칸 자체가 없습니다.</p>'+
    '</div>' : '')+
  '</div></section>';
}
/* 상세에 실제로 들어가는 칸 — ⚠️ **예시 프로필의 값에서 셉니다.**
   손으로 적으면 화면이 바뀔 때 여기만 옛말이 됩니다. */
function joinExRows(p){
  var st = amProviderStats(p) || {};
  var rows = [
    ["전문 서비스", (p.subs||[]).map(amSubName).join(" · ")],
    ["전문 업종",   (p.industries||[]).map(amIndustryName).join(" · ")],
    ["활동 지역",   (p.regions||[]).map(amRegionName).concat(p.gu||[]).join(" · ")],
    ["포트폴리오",  (p.portfolio||[]).length + "건 — 공사 내용 · 업종 · 지역 · 연도 · 사진"],
    /* ⚠️ 바로 위가 포트폴리오 줄이라 여기는 **서류로 확인한 것**만
       냅니다 — `amProviderBadges()` 를 쓰면 "포트폴리오 3건" 이 두 줄에
       나옵니다. ⚠️ 딱지는 "인증" 이 아니라 **"확인"** 입니다 (저희가
       자격을 주는 것이 아니라 서류를 봤다는 표시입니다). */
    ["확인",        amProviderVerified(p).join(" · ") || "확인한 것만"],
    ["상담 가능 시간", p.consultHours || ""]
  ];
  if(st.rating != null)
    rows.push(["후기", "평점 " + st.rating + " · " + st.reviews + "건 (후기에서 계산한 값입니다)"]);
  /* ⚠️ 값이 없는 줄은 **아예 뺍니다** — "(미기재)" 를 찍지 않습니다 */
  return rows.filter(function(r){ return r[1]; });
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


/* ── /compare — 업체 비교 (2026-10-05 V2 §14) ────────────────────
   > "업체 / 지역 / 전문분야 / 전문업종 / 가격정보 / 평점 / 후기 /
   >  포트폴리오 / 인증 / A/S / 응답속도"

   ⚠️⚠️ **없는 칸은 줄째 뺍니다** (절대 규칙 2). 세 곳 다 안 적은
   항목을 빈 칸으로 늘어놓으면, 비교표가 "미기재" 로 가득 찹니다.
   ⚠️⚠️ **응답속도는 재어 본 값만** 냅니다 (`responseHours`). 지금은
   재는 장치가 없어서 비어 있고, 그래서 그 줄이 **안 나옵니다** —
   "빠름" 같은 말을 적으면 하지 않은 일을 했다고 말하는 것입니다
   (절대 규칙 5).
   ⚠️ 평점 · 후기 수는 **후기 배열에서 계산**합니다 (`amProviderStats`). */
function PageCompare(){
  /* ⚠️ 목록에서 담은 것은 `?cmp=` 이고, 이 화면으로 넘어올 때
     `CmpBar()` 가 `?ids=` 로 바꿔 싣습니다. 두 이름이 다른 까닭은
     목록에서는 **거르개와 같이 실리는 값**이고 여기서는 **이 화면의
     전부**이기 때문입니다. 바꾸시려면 `CmpBar()` 도 같이 고치세요. */
  var ids = String(nowQS("ids") || "").split(",")
    .map(function(x){ return x.trim(); }).filter(Boolean).slice(0, AM_CMP_MAX);
  var ps = ids.map(function(id){ return amProvider(id); }).filter(Boolean);

  if(!ps.length) return PgHero({
      crumb: Crumb([["업체찾기","/providers"],["업체 비교"]]),
      kicker:"COMPARE", h1:"업체 비교", tight:true })+
    '<section class="sec sec-white"><div class="w w-narrow">'+
      Empty({ icon:"compare", title:"비교할 업체를 아직 안 고르셨습니다",
        text:"업체찾기에서 카드의 ‘비교’ 를 눌러 두세요. " + AM_CMP_MAX +
             "곳까지 나란히 놓고 보실 수 있습니다.",
        reads: amContentsFor({ cat:"interior", side:"start", limit:3 }),
        readTitle:"업체를 고르기 전에 보시면",
        cta:'<a class="btn btn-b" href="/providers">업체찾기로'+icon("arrow",16)+'</a>'+
            '<a class="btn btn-o" href="'+esc(quoteTo({}))+'">견적부터 요청하기</a>' })+
    '</div></section>';

  /* 줄 — [딱지, 업체마다 값을 내는 함수]. 세 곳 다 비면 줄째 뺍니다. */
  var rows = [
    ["활동 지역", function(p){
      return (p.regions||[]).map(amRegionName).filter(Boolean)
        .concat(p.gu||[]).join(" · "); }],
    ["전문 서비스", function(p){ return (p.subs||[]).map(amSubName).join(" · "); }],
    ["전문 업종",   function(p){ return (p.industries||[]).map(amIndustryName).join(" · "); }],
    ["평점",        function(p){ var st = amProviderStats(p)||{};
      return st.rating != null ? st.rating + " (후기 " + st.reviews + "건)" : ""; }],
    ["포트폴리오",  function(p){ var n = (p.portfolio||[]).length;
      return n ? n + "건" : ""; }],
    /* ⚠️ 위에 포트폴리오 줄이 따로 있어 **서류로 확인한 것**만 냅니다 */
    ["확인",        function(p){ return amProviderVerified(p).join(" · "); }],
    ["가격 정보",   function(p){
      return (p.price||[]).map(function(x){
        return x.name + (x.from ? " " + x.from.toLocaleString() + "만원~" : ""); }).join(" · "); }],
    /* A/S (2026-10-06 2차 §12) — ⚠️ 업체가 적은 값입니다. 아래 고지가
       "저희가 확인하거나 보증하는 값이 아닙니다" 를 이미 말합니다. */
    ["A/S",        function(p){
      return p.as ? [p.as.period, p.as.what].filter(Boolean).join(" · ") : ""; }],
    /* 후기 — ⚠️ **세는 값**입니다. 평점 줄과 따로 두는 까닭은, 평점은
       없고 후기만 있는 경우가 없기 때문이 아니라 §12 가 둘을 나눠
       적었기 때문입니다. 0건이면 줄째 빠집니다. */
    ["후기",        function(p){ var n = (p.reviews||[]).length;
      return n ? n + "건" : ""; }],
    ["시작한 해",   function(p){ return p.since ? String(p.since) : ""; }],
    ["상담 방법",   function(p){ return p.consultHours ? ("상담 가능 " + p.consultHours) : ""; }],
    /* ⚠️ 재어 본 값이 없으면 이 줄은 안 나옵니다 */
    ["평균 응답",   function(p){
      return p.responseHours != null ? p.responseHours + "시간 안" : ""; }]
  ].filter(function(r){ return ps.some(function(p){ return r[1](p); }); });

  return PgHero({
    crumb: Crumb([["업체찾기","/providers"],["업체 비교"]]),
    kicker:"COMPARE",
    h1:"업체 " + ps.length + "곳 비교",
    lead:"등록된 값만 나란히 놓습니다. 적지 않은 항목은 줄째 뺐습니다 — 빈 칸을 채워 보여 드리지 않습니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<div class="cmp-wrap"><table class="cmp"><thead><tr><th scope="col">항목</th>'+
      ps.map(function(p){
        return '<th scope="col"><a class="cmp-nm" href="/p/'+esc(p.id)+'">'+esc(p.name)+'</a></th>';
      }).join("")+'</tr></thead><tbody>'+
      rows.map(function(r){
        return '<tr><th scope="row">'+esc(r[0])+'</th>'+
          ps.map(function(p){
            var v = r[1](p);
            /* ⚠️ 한 곳만 안 적었을 때는 "—" 입니다 — 지어내지 않습니다 */
            return '<td>'+(v ? esc(v) : '<em class="cmp-no">—</em>')+'</td>';
          }).join("")+'</tr>';
      }).join("")+
      '<tr><th scope="row">견적</th>'+ps.map(function(p){
        return '<td><a class="btn btn-b btn-sm" href="'+esc(quoteTo({
          sub:(p.subs||[])[0]||"", industry:(p.industries||[])[0]||"",
          region:(p.regions||[])[0]||"" }))+'">견적 요청</a></td>';
      }).join("")+'</tr>'+
    '</tbody></table></div>'+
    /* ⚠️ 중개자 고지 — 전자상거래법 제20조 제1항 */
    '<p class="sec-note">'+icon("info",15)+
      '적힌 값은 업체가 등록한 것이고, 저희가 확인하거나 보증하는 값이 아닙니다. '+
      '확인 배지는 저희가 서류로 본 항목만 붙습니다.</p>'+
  '</div></section>';
}

/* ════════════════════════════════════════════════════════════════════
   화면들이 같이 쓰는 조각

   ⚠️ **한 화면에서만 쓰는 것은 여기 넣지 마세요.** 여기가 커지면
   화면마다 생김새가 달라지는 것을 막으려고 만든 파일이 오히려 뒤엉킵니다.
   ⚠️ 손님이 적은 글은 **반드시 `esc()`** 를 통과시킵니다. 안 쓰면 거기
   넣은 `<img onerror=…>` 가 남의 브라우저에서 돕니다.
   ════════════════════════════════════════════════════════════════════ */

/* 분류색 — 아이콘 타일 · 배지 · 작은 칩에만 씁니다 */
window.tn = function(tone){ return tone ? (" tn-" + tone) : ""; };

/* ── 화면 머리 ────────────────────────────────────────────────────
   ⚠️ **모든 화면이 같은 머리를 씁니다.** 화면마다 다른 디자인 언어를
   쓰지 않습니다 (§54). */
/* ⚠️⚠️ **사진은 글 뒤에 깔지 않습니다** (§6 · §26). 1024px 위에서는
   오른쪽 42% 판이고 그 아래에서는 글 밑의 띠라, 어느 폭에서도 글자가
   사진 위에 앉지 않습니다 — 제목 · 설명 · 단추는 전부 HTML 입니다.
   ⚠️ 사진이 없으면 **액자째 안 그립니다** (절대 규칙 2). "이미지 준비
   중" 을 찍지 않습니다. */
window.PgHero = function(o){
  o = o || {};
  var ph = o.photo && typeof hasPhoto === "function" && hasPhoto(o.photo);
  return '<section class="pgh'+(o.tight?" pgh-tight":"")+(ph?" pgh-im-on":"")+(o.cls ? " "+esc(o.cls) : "")+'">'+
    /* ⚠️ 자리 이름을 클래스로 같이 냅니다 — 어느 쪽을 남길지(`--ph-pos`)가
       사진마다 다릅니다 (`css/pages.css`). */
    (ph ? '<span class="pgh-im pgh-im-'+esc(o.photo)+'">'+
          photoBox(o.photo, "", true)+'</span>' : '')+
    '<div class="w">'+
    (o.crumb ? '<nav class="crumb" aria-label="현재 위치">'+o.crumb+'</nav>' : '')+
    (o.kicker ? '<p class="eyebrow">'+esc(o.kicker)+'</p>' : '')+
    '<h1 class="pg-h1">'+(o.h1raw || esc(o.h1||""))+'</h1>'+
    (o.lead ? '<p class="pg-lead">'+(o.leadRaw ? o.lead : esc(o.lead))+'</p>' : '')+
    (o.cta ? '<div class="row-cta">'+o.cta+'</div>' : '')+
  '</div></section>';
};

window.Crumb = function(items){
  return items.map(function(it, i){
    var last = (i === items.length - 1);
    return (i ? '<span aria-hidden="true">'+icon("chev",14)+'</span>' : '')+
      (last || !it[1] ? '<b>'+esc(it[0])+'</b>'
                      : '<a href="'+esc(it[1])+'">'+esc(it[0])+'</a>');
  }).join("");
};

/* ── 아직 아무것도 없을 때 ───────────────────────────────────────
   ⚠️⚠️ **이 자리를 지어낸 카드로 채우지 마세요.** 업체 · 브랜드 ·
   매물이 0 이면 0 이라고 말합니다. 채워 넣으면 그 순간 없는 회사를
   광고하는 것이고, 보고 연락한 사람의 시간을 훔치는 일입니다.
   ⚠️ 대신 **막다른 길로 두지 않습니다.** 지금 실제로 되는 것(견적
   요청 · 입점 · 등록)을 같이 냅니다. */
/* ── 업체가 0곳인 자리 (2026-10-06 2차 §8) ─────────────────────────
   ⚠️⚠️ **"아직 등록된 업체가 없습니다" 가 화면의 주인공이 되면 안
   됩니다.** 손님은 기능 하나가 아니라 **사이트 전체를 미완성**으로
   읽고 그대로 나갑니다. 그래서 주인공을 바꿉니다 —

     전 ─ "조건에 맞는 업체가 아직 없습니다"
     후 ─ "인테리어 업체를 찾고 계신가요?
           좋은 업체를 고르려면 가격보다 먼저 확인할 것이 있습니다."

   ⚠️⚠️ **0 을 숨기는 것이 아닙니다** (절대 규칙 1 · 2). 아래 줄이
   "지금 n곳" 을 **세는 값**으로 그대로 말합니다. 숨기면 그 순간
   없는 회사를 광고하는 쪽으로 한 걸음 가는 것입니다.
   ⚠️⚠️ 단추 넷은 **실제로 있는 글**만입니다 (`amContentsFor()`가
   고릅니다). 지시서가 적은 "업체 선정 체크리스트 · 견적서 보는 법"
   같은 제목을 **지어내서 달면 가짜 링크**입니다 (절대 규칙 5) —
   있는 글의 진짜 제목을 그대로 냅니다. 없으면 그 줄이 빠집니다. */
window.EmptyGuide = function(o){
  o = o || {};
  var reads = (o.reads || []).filter(Boolean).slice(0, 4);
  return '<div class="emg">'+
    '<div class="emg-h">'+
      '<span class="emg-ic" aria-hidden="true">'+icon(o.icon||"search",26)+'</span>'+
      '<div>'+
        '<b>'+esc(o.title)+'</b>'+
        '<p>'+esc(o.text || "좋은 업체를 고르려면 가격보다 먼저 확인해야 할 것이 있습니다.")+'</p>'+
      '</div>'+
    '</div>'+
    (reads.length ? '<ul class="emg-l">'+reads.map(function(c){
      return '<li><a href="/content/'+esc(c.slug)+'">'+icon("book",16)+
        '<span>'+esc(c.title)+'</span>'+icon("arrow",15)+'</a></li>';
    }).join("")+'</ul>' : '')+
    '<div class="emg-f">'+
      /* ⚠️ 세는 값입니다. 손으로 적지 마세요 — 등록이 시작되면
         저절로 숫자가 되고 고쳐 쓸 자리가 없습니다. */
      '<p class="emg-n">'+esc(o.note || "")+'</p>'+
      (o.cta ? '<div class="emg-cta">'+o.cta+'</div>' : '')+
    '</div>'+
  '</div>';
};

window.Empty = function(o){
  o = o || {};
  /* ⚠️ `sm` — 메인처럼 **빈 구간이 여럿 이어지는 자리**에서는 Empty 를
     작게 냅니다 (2026-10-03 지시서 §28). 큰 Empty 카드 다섯 장이
     이어지면 "데이터가 없는 플랫폼" 이 화면 길이로도 읽힙니다.
     데이터가 들어오면 그 구간은 저절로 카드 높이로 커집니다. */
  /* ⚠️⚠️ **빈 칸 자체가 콘텐츠가 되어야 합니다** (2026-10-05 V2 §18).
     "등록된 업체가 없습니다" 가 화면마다 크게 반복되면, 손님은 기능
     하나가 아니라 **사이트 전체를 미완성**으로 읽습니다. 그래서
     기다리는 동안 **지금 실제로 도움이 되는 글**을 같이 냅니다.
     ⚠️ 글은 `amContentsFor()` 가 고른 **실제로 있는 글**만입니다 —
     없으면 그 줄은 아예 안 나옵니다 (절대 규칙 2). */
  var reads = (o.reads || []).filter(Boolean).slice(0, 3);
  return '<div class="empty'+(o.sm ? " empty-sm" : "")+(reads.length ? " empty-rd" : "")+'">'+
    '<span class="empty-ic" aria-hidden="true">'+icon(o.icon||"search",26)+'</span>'+
    '<b>'+esc(o.title||"아직 등록된 것이 없습니다")+'</b>'+
    (o.text ? '<p>'+esc(o.text)+'</p>' : '')+
    (reads.length
      ? '<div class="empty-rl">'+
          '<p class="empty-rh">'+esc(o.readTitle || "기다리시는 동안 먼저 보셔도 됩니다")+'</p>'+
          '<ul>'+reads.map(function(c){
            return '<li><a href="/content/'+esc(c.slug)+'">'+
              icon("book",15)+'<span>'+esc(c.title)+'</span></a></li>'; }).join("")+
        '</ul></div>'
      : '')+
    (o.cta ? '<div class="row-cta row-mid">'+o.cta+'</div>' : '')+
  '</div>';
};

/* ── 업종 고르기 ─────────────────────────────────────────────────
   §6 · §41 — 업종이 정해지면 그 뒤가 전부 달라집니다. */
/* ⚠️⚠️ **대분류 아홉으로 거를 수 있습니다** (2026-10-09 지시서 PART 3 —
   대분류 → 중분류 → 세부). 짜임새는 `/support` · `/content` ·
   `/providers` 가 쓰는 **같은 `.chip-g-fil`** 입니다 — 화면마다 다른
   거르개를 만들면 같은 사이트로 안 읽힙니다.

   ⚠️ 고른 것은 **주소(`?g=`)에 실립니다** — 뒤로 가기 · 새로고침 ·
   링크 공유에 살아남습니다 (이 저장소의 거르개 전부가 그렇습니다).
   ⚠️ 업종이 하나도 없는 대분류는 `amIndGroups()` 가 **줄째 뺍니다.**
   ⚠️ 칩이 아홉이라 폰에서 두 줄이 됩니다 — 열로 늘리지 마세요. */
window.IndustryGroupChips = function(baseTo, g){
  var G = (window.amIndGroups ? window.amIndGroups() : []);
  if(G.length < 2) return "";
  function url(k){ return baseTo + (k ? "?g=" + encodeURIComponent(k) : ""); }
  return '<ul class="chip-g chip-g-fil">'+
    '<li><a class="chip'+(g?"":" on")+'" href="'+esc(url(""))+'">업종 전체</a></li>'+
    G.map(function(x){
      return '<li><a class="chip'+(g===x.key?" on":"")+'" href="'+esc(url(x.key))+'">'+
        /* ⚠️ 개수는 **세는 값**입니다. `/content` 의 분야 칩과 **같은
           꼴**(이름 + 숫자)로 맞춥니다 — 태그로 감싸면 거기와 달라
           보이고, 이 저장소는 칩 짜임새를 한 벌로 둡니다. */
        esc(x.name)+' '+x.inds.length+'</a></li>';
    }).join("")+'</ul>';
};

window.IndustryGrid = function(baseTo, current, g){
  var list = (window.AM_INDUSTRIES||[]);
  /* 고른 대분류가 있으면 그 안의 업종만. ⚠️ 없는 key 가 오면 **전부**를
     냅니다 — 밖에서 퍼진 옛 링크가 빈 화면이 되지 않게 (거르개 규칙). */
  if(g && window.amIndGroups){
    var grp = window.amIndGroups().filter(function(x){ return x.key === g; })[0];
    if(grp) list = grp.inds;
  }
  return '<ul class="ind-g">'+list.map(function(i){
    var on = (i.key === current);
    return '<li><a class="ind'+tn(i.tone)+(on?" on":"")+'" href="'+esc(baseTo+"/"+i.key)+'"'+
      (on?' aria-current="page"':'')+'>'+
      /* 2026-11-26 — 전체 업종 목록에도 업종 공통 사진 (AM_PIC_IND · 없으면 월넛 면 · 빈 액자 없음) */
      '<span class="ind-ph" aria-hidden="true">'+(typeof picBox === "function" ? picBox(picKey("ind", i.key), i.icon, "(max-width:640px) 46vw, (max-width:1100px) 30vw, 300px") : "")+'</span>'+
      '<span class="ind-ic">'+icon(i.icon,24)+'</span>'+
      '<b>'+esc(i.name)+'</b>'+
      '<span class="ind-l">'+esc(i.lead)+'</span></a></li>';
  }).join("")+'</ul>';
};

/* ── 지역 고르개 ─────────────────────────────────────────────────
   ⚠️ 지역은 매칭의 첫 번째 조건입니다. 인테리어 업체를 전국에서
   찾는 사람은 없습니다 (§44). */
/* ⚠️ `ph` 는 **폼에서 쓰는 첫 줄**입니다. 거르개에서는 "지역 전체" 가
   맞지만 내놓기 · 견적 요청 같은 **적는 화면**에서는 "전체" 가 고른
   것처럼 읽힙니다 — 기본값을 그대로 두어 거르개 화면은 안 바뀝니다. */
/* ⚠️ 다섯째 칸 `req` — 딱지에 `*` 를 붙였으면 **브라우저도
   막게** 합니다. 전에는 `/quote` 의 지역만 JS 가 막아서, 나머지
   넷은 브라우저가 먼저 잡는데 지역만 한 걸음 늦었습니다.
   ⚠️ 거르개 화면은 그대로입니다 — 기본값이 `false` 라 안 넣으면
   아무 것도 안 바뀝니다. */
window.RegionSelect = function(id, val, onchange, ph, req){
  return '<select class="sel" id="'+esc(id)+'"'+
    (onchange ? ' onchange="'+esc(onchange)+'"' : '')+ (req ? " required" : "")+
    ' aria-label="지역"><option value="">'+esc(ph || "지역 전체")+'</option>'+
    (window.AM_REGIONS||[]).map(function(r){
      return '<option value="'+esc(r.key)+'"'+(r.key===val?" selected":"")+'>'+
        esc(r.name)+'</option>';
    }).join("")+'</select>';
};
window.IndustrySelect = function(id, val, onchange, ph){
  return '<select class="sel" id="'+esc(id)+'"'+
    (onchange ? ' onchange="'+esc(onchange)+'"' : '')+
    ' aria-label="업종"><option value="">'+esc(ph || "업종 전체")+'</option>'+
    (window.AM_INDUSTRIES||[]).map(function(i){
      return '<option value="'+esc(i.key)+'"'+(i.key===val?" selected":"")+'>'+
        esc(i.name)+'</option>';
    }).join("")+'</select>';
};

/* ── 분류 카드 ───────────────────────────────────────────────────
   창업 13 · 폐업 12 분류를 같은 생김새로 냅니다. */
window.catTo = function(c){
  if(c.to) return c.to;
  return (c.kind === "provider") ? ("/providers/" + c.key) : ("/c/" + c.key);
};
window.CatCard = function(c, industryKey, qs){
  var items = amCatItems(c, industryKey).slice(0, 5);
  var more  = amCatItems(c, industryKey).length - items.length;
  /* ⚠️⚠️ **고르신 거르개를 링크에 그대로 싣습니다** (2026-10-20 시안 6).
     안 실으면 업체 찾기에서 지역 · 업종을 고르고 분야로 들어간 순간
     그 둘이 조용히 풀립니다 — 손님은 자기가 푼 줄 모르고 결과가
     늘어난 것만 봅니다 (매물 거르개에서 겪은 자리).
     ⚠️ `catTo()` 가 이미 질의문자를 들고 오는 분류가 있어서
     (`/assets?c=stock`) 물음표인지 앰퍼샌드인지를 보고 붙입니다. */
  var base = catTo(c), qa = [];
  if(industryKey) qa.push('i='+encodeURIComponent(industryKey));
  if(qs) qa.push(qs);
  var href = base + (qa.length ? (base.indexOf("?") >= 0 ? "&" : "?")+qa.join("&") : "");
  /* 2026-11-25 디자인 개편 §5 · §7 — 분야 카드 맨 위 대표 사진 (AM_PIC_CAT · 없으면 같은 높이의 월넛 면) */
  return '<a class="cat cat-pc'+tn(c.tone)+'" href="'+esc(href)+'" data-rv>'+
    '<span class="cat-ph" aria-hidden="true">'+picBox(picKey("cat", c.key), c.icon || "grid", "(max-width:640px) 92vw, (max-width:1100px) 46vw, 300px")+'</span>'+
    /* ⚠️ 2026-10-09 지시서 §3 · §7 — 분야 카드도 **컬러 아이콘**입니다.
       `iconArt()` 에 같은 key 가 있으면 그것을, 없으면 선형 아이콘이
       자리를 지킵니다 (빈 칸이 생기지 않습니다 · 절대 규칙 2). */
    '<span class="cat-ic'+(hasIconArt(c.key) ? " cat-ic-a" : "")+'">'+
      (hasIconArt(c.key) ? iconArt(c.key, 34) : icon(c.icon,22))+'</span>'+
    '<b>'+esc(c.name)+'</b>'+
    '<span class="cat-l">'+esc(c.lead)+'</span>'+
    (items.length ? '<span class="cat-s">'+items.map(function(i){
        return '<em>'+esc(i.name)+'</em>'; }).join("")+
      (more > 0 ? '<em class="cat-s-more">외 '+more+'</em>' : '')+'</span>' : '')+
    '<span class="cat-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
  '</a>';
};

/* ── 업체 카드 (§36) ─────────────────────────────────────────────
   ⚠️⚠️ **평점 · 후기 수 · 누적 작업 수는 계산한 값만 찍습니다.**
   `amProviderStats()` 가 실제 후기·포트폴리오 배열에서 셉니다. 후기가
   없으면 그 자리는 **아예 안 나옵니다** — "평점 0.0" 은 평점이 아니고,
   별 다섯 개를 회색으로 그려 두는 것도 지어낸 신뢰입니다. */
/* ── 업체 목록 카드 (2026-10-06 2차 §10) ───────────────────────────
   업체가 등록되면 **한눈에 보여야 하는 것**을 §10 이 적었습니다 —
   업체명 · 인증 표시 · 한 줄 소개 · 전문업종 · 전문서비스 · 지역 ·
   대표 포트폴리오 · 가격정보 유무 · 인증 유무 · A/S 유무 · 단추 셋.

   ⚠️⚠️ **카드가 통째로 `<a>` 이면 안 됩니다.** 단추가 셋이라
   `<a>` 안의 `<a>` 가 되고, 브라우저가 그걸 쪼갭니다. 그래서 카드는
   `<div>` 이고 **사진 · 이름 · 단추가 각자 링크**입니다.
   ⚠️ 전에는 카드 한 장이 통째로 링크였습니다 — 그때 주석이 "여기에
   또 `<a>` 를 넣을 수 없습니다" 라고 적고 있었는데, §10 이 단추 셋을
   요구해서 **짜임새를 바꾼 것**입니다. 지우지 마세요.

   ⚠️⚠️ **평점 · 후기 수 · 작업 수는 계산값입니다** (`amProviderStats`).
   후기가 없으면 평점 자리가 아예 안 나옵니다 — "평점 0.0" 도 별
   다섯 개 회색도 지어낸 신뢰입니다 (절대 규칙 1).
   ⚠️ 가격 · A/S 는 **있다/없다만** 말합니다. 업체가 적은 값이라
   우리가 확인한 사실이 아니고, 금액을 카드에 찍으면 비교할 수 없는
   숫자가 나란히 섭니다. */
window.ProviderCard = function(p){
  var s = amProviderStats(p) || {};
  /* ⚠️ 규칙은 `providers.js` 의 `amProviderBadges()` 한 곳입니다. */
  var badges = amProviderBadges(p);
  var subs   = (p.subs||[]).map(amSubName).filter(Boolean);
  var inds   = (p.industries||[]).map(amIndustryName).filter(Boolean);
  var regs   = (p.regions||[]).map(amRegionName).filter(Boolean);
  var folio  = (p.portfolio||[]);
  var cover  = p.cover || (folio[0] && folio[0].after) || "";

  /* ⚠️⚠️ **예시 프로필은 링크가 아닙니다.** `/p/sample-provider` 라는
     화면을 만들면 지어낸 업체 페이지가 생기고 sitemap · 구글까지
     나갑니다 (절대 규칙 1). `/join` 의 "이렇게 보입니다" 구간에서만
     쓰는 그림이라, 누를 수 없는 칸으로 냅니다. 예시 상세는 따로
     `/sample` 하나이고 NOINDEX 입니다. */
  var ex = !!p.sample;
  var to = ex ? "/sample" : ("/p/" + encodeURIComponent(p.id));
  var A  = function(cls, label, extra){
    return '<a class="'+cls+'" href="'+esc(to)+'"'+(extra||"")+'>'+label+'</a>';
  };
  /* 있다/없다 표시 — ⚠️ 없는 것은 **줄째 뺍니다** (절대 규칙 2) */
  var marks = [];
  if((p.price||[]).length)  marks.push(["won","가격 안내 있음"]);
  if(folio.length)          marks.push(["camera","포트폴리오 "+folio.length+"건"]);
  if(p.as && (p.as.period || p.as.what)) marks.push(["shield","A/S 안내 있음"]);

  /* ⚠️⚠️ **사진이 없으면 액자를 아예 안 그립니다** (단계 카드와 같은
     까닭). 전에는 빈 액자를 옅은 면으로 깔아 두었는데, 액자가 카드
     높이의 **40%** 라 등록 초기처럼 **모두가 사진이 없을 때** 목록이
     회색 덩어리 줄로 보입니다 — "이 업체들 준비가 덜 됐나" 로 읽히고,
     그건 절대 규칙 2 가 막는 자리입니다. 사진이 들어오면 **코드를 한
     줄도 안 고치고** 액자가 생깁니다. */
  var ph = cover
    ? '<img class="ph" src="'+esc(cover)+'" alt="'+esc(p.name)+' 작업 사진" loading="lazy" decoding="async">'
    : "";
  return '<div class="pv'+(ex ? " pv-ex" : "")+(ph ? "" : " nph")+'">'+
    (!ph ? ""
      : ex ? '<span class="pv-ph">'+ph+'</span>'
           : A("pv-ph", ph, ' tabindex="-1" aria-hidden="true"'))+
    '<div class="pv-b">'+
      '<p class="pv-t">'+
        (ex ? '<b>'+esc(p.name)+'</b>' : A("pv-nm", '<b>'+esc(p.name)+'</b>'))+
        (ex ? '<em class="pv-smp">SAMPLE</em>' : '')+
        badges.map(function(bd){
          return '<em class="pv-vf">'+icon("check",13)+esc(bd)+'</em>'; }).join("")+
      '</p>'+
      /* 2026-11-26 모바일 시안 §6 — 실제 업체 카드는 **가능한 작업 → 활동 지역** 이 먼저입니다 (업종은 그 뒤) */
      (subs.length ? '<p class="pv-sv"><small class="pv-lb">가능한 작업</small>'+subs.slice(0,4).map(function(n){
          return '<span>'+esc(n)+'</span>'; }).join("")+
          (subs.length > 4 ? '<em>외 '+(subs.length-4)+'</em>' : '')+'</p>' : '')+
      '<p class="pv-m"><small class="pv-lb">활동 지역</small>'+
        esc(regs.join(" · ") || "지역 미등록")+
        (inds.length ? ' · '+esc(inds.join(" · ")) : '')+
      '</p>'+
      (s.rating !== null && s.rating !== undefined
        ? '<p class="pv-r">'+icon("star",14)+'<b>'+esc(String(s.rating))+'</b>'+
          '<em>후기 '+s.reviews+'</em>'+(s.jobs ? '<em>작업 '+s.jobs+'</em>' : '')+'</p>'
        : '<p class="pv-r pv-r-none">아직 후기가 없습니다</p>')+
      (p.intro ? '<p class="pv-i">'+esc(p.intro)+'</p>' : '')+
      (marks.length ? '<p class="pv-mk">'+marks.map(function(m){
          return '<span>'+icon(m[0],14)+esc(m[1])+'</span>'; }).join("")+'</p>' : '')+
      '<p class="pv-act">'+
        (ex
          ? '<span class="btn btn-o btn-sm pv-act-x">예시 화면입니다</span>'
          : A("btn btn-b btn-sm", '상세보기')+
            '<a class="btn btn-o btn-sm" href="'+esc(quoteTo({
              sub:(p.subs||[])[0]||"", industry:(p.industries||[])[0]||"",
              region:(p.regions||[])[0]||"" }))+'">견적 요청</a>')+
      '</p>'+
    '</div>'+
  '</div>';
};

/* ── 업체 비교 담기 (2026-10-06 2차 §12 · V2 §14) ───────────────────
   ⚠️⚠️ **이 셋이 아무 데도 없었습니다.** `ProviderPickCard()` 와
   `CmpBar()` 가 `amCmpIds()` 를, `PageCompare()` 가 `AM_CMP_MAX` 를,
   체크칸이 `cmpToggle()` 을 부르고 있었는데 **정의가 없었습니다.**

   업체가 0곳이라 `ProviderPickCard()` 가 **한 번도 안 돌아서** 아무도
   못 봤습니다 — 첫 업체를 등록하는 날 `/providers/:cat` 이
   `amCmpIds is not defined` 로 **통째로 죽을** 자리였습니다. 검사용
   업체를 하나 끼워 넣고 그려 보다가 찾았습니다 (CLAUDE.md 가 적어 둔
   "데이터가 0 이면 그 기능은 아무 검사도 안 받습니다" 그대로입니다).

   ⚠️ 담은 것은 **주소(`?cmp=`)에 싣습니다.** localStorage 에 두면
   링크로 보낼 수가 없고, 뒤로 가기 · 새로고침에 살아남지도 않습니다.
   ⚠️ 성함 · 연락처는 담지 않습니다 — **업체 id 하나**뿐입니다. */
window.AM_CMP_MAX = 3;

window.amCmpIds = function(){
  return String(nowQS("cmp") || "").split(",")
    .map(function(x){ return x.trim(); })
    .filter(Boolean).slice(0, AM_CMP_MAX);
};

/* 담기 · 빼기 — ⚠️ **스크롤을 지킵니다.** 맨 위로 올라가면 방금 보던
   카드를 잃고, 그러면 두 번째를 안 담습니다.
   ⚠️ 켜 둔 거르개(`?i=` · `?r=` · `?s=` …)를 **전부 그대로 싣습니다** —
   하나라도 빠지면 손님은 자기가 끈 줄 모르고 결과만 달라진 것을 봅니다. */
window.cmpToggle = function(id){
  var ids = amCmpIds(), i = ids.indexOf(id);
  if(i >= 0) ids.splice(i, 1);
  else {
    /* ⚠️ 넘치면 **조용히 버리지 않습니다** — 몇 곳까지인지 말합니다 */
    if(ids.length >= AM_CMP_MAX){
      toast(AM_CMP_MAX + "곳까지 나란히 놓을 수 있습니다. 하나를 빼고 담아 주세요.");
      /* 체크칸이 이미 켜졌으므로 되돌려 둡니다 */
      render();
      return;
    }
    ids.push(id);
  }
  var qs = new URLSearchParams(location.search);
  if(ids.length) qs.set("cmp", ids.join(","));
  else qs.delete("cmp");
  var q = qs.toString();
  go(nowPath() + (q ? "?" + q : ""), { keepScroll:true });
};

window.ProviderPickCard = function(p){
  var ids = amCmpIds(), on = ids.indexOf(p.id) >= 0;
  return '<div class="pv-w'+(on ? " on" : "")+'">'+
    ProviderCard(p)+
    '<label class="pv-ck">'+
      '<input type="checkbox"'+(on ? " checked" : "")+
        ' onchange="cmpToggle(\''+esc(p.id)+'\')"'+
        ' aria-label="'+esc(p.name)+' 비교에 담기">'+
      '<span>비교</span>'+
    '</label>'+
  '</div>';
};

/* 고른 것이 있을 때 아래에 붙는 띠 — ⚠️ 없으면 **아무것도 안 그립니다** */
window.CmpBar = function(){
  var ids = amCmpIds();
  if(!ids.length) return "";
  var names = ids.map(function(id){
    var p = amProvider(id); return p ? p.name : null; }).filter(Boolean);
  if(!names.length) return "";
  return '<div class="cmp-bar" role="status"><div class="w cmp-bar-in">'+
    '<span class="cmp-bar-n"><b>'+names.length+'곳</b> 담았습니다</span>'+
    '<span class="cmp-bar-l">'+esc(names.join(" · "))+'</span>'+
    '<a class="btn btn-b" href="/compare?ids='+esc(ids.join(","))+'">'+
      '업체 비교하기'+icon("arrow",16)+'</a>'+
  '</div></div>';
};

/* ── 관심 업체 저장 (2026-10-05 V2 §13) ─────────────────────────
   > "관심 업체 저장" — 업체 상세의 CTA 넷 가운데 하나입니다.

   ⚠️⚠️ **`/my` 의 설명이 이미 "저장한 업체" 를 약속하고 있었습니다** —
   기능이 없는 채로요. 하지 않은 일을 했다고 말한 것이라(절대 규칙 5)
   약속한 쪽을 만들었습니다.
   ⚠️ 담는 것은 **업체 id 하나**뿐입니다. 성함 · 연락처는 안 담습니다 —
   가게 컴퓨터는 여러 사람이 씁니다.
   ⚠️ 서버로 보내지 않습니다. */
window.AM_SAVE_KEY = "am.saved.v1";

window.amSaved = function(){
  var v = amGet(AM_SAVE_KEY, []);
  return Array.isArray(v) ? v : [];
};
window.amIsSaved = function(id){ return amSaved().indexOf(id) >= 0; };
window.saveToggle = function(id){
  var l = amSaved(), i = l.indexOf(id);
  if(i >= 0){ l.splice(i, 1); toast("관심 업체에서 뺐습니다"); }
  else { l.push(id); toast("관심 업체에 담았습니다 — MY 에서 보실 수 있습니다"); }
  amSet(AM_SAVE_KEY, l);
  rerender(true);
};

/* 견적 요청으로 넘기는 단추 — 조건을 주소에 실어 보냅니다.
   ⚠️ 끊기면 손님은 같은 것을 두 번 적게 되고 거기서 닫습니다. */
window.quoteTo = function(o){
  o = o || {};
  var q = [];
  if(o.cat)      q.push("c="+encodeURIComponent(o.cat));
  if(o.sub)      q.push("s="+encodeURIComponent(o.sub));
  if(o.industry) q.push("i="+encodeURIComponent(o.industry));
  if(o.region)   q.push("r="+encodeURIComponent(o.region));
  if(o.side)     q.push("side="+encodeURIComponent(o.side));
  /* ⚠️ 2026-10-09 PART 4 — 창업 진단에서 고르신 예산 · 일정을 그대로
     들고 갑니다. 받는 쪽(`/quote`)이 **실제로 읽어서 칸에 적습니다** —
     안 읽으면 끊긴 것이고, 손님은 같은 것을 두 번 적게 됩니다. */
  if(o.bud)      q.push("bud="+encodeURIComponent(o.bud));
  if(o.when)     q.push("when="+encodeURIComponent(o.when));
  /* ⚠️⚠️ 2026-10-26 §2-03 — 메인의 "내 상황에 맞는 서비스 찾기" 에서
     고르신 **매장 규모**입니다. 받는 쪽(`/quote`)이 **실제로 읽어
     평수 칸에 적습니다** — 안 읽으면 그 고르개가 "받아 놓고 안 읽는
     칸" 이 됩니다 (이 저장소가 `gu` · `withEquip` 으로 겪은 자리).
     ⚠️ 자유 입력 칸이라 **고치실 수 있게** 미리 적어만 둡니다. */
  if(o.py)       q.push("py="+encodeURIComponent(o.py));
  /* ⚠️⚠️ 2026-10-09 §4-4 — **복수 상품을 한 번에** 신청하실 때
     고르신 상품 id 를 주소에 실습니다. 주소에 실어야 뒤로 가기 ·
     새로고침 · 링크 공유에 살아남습니다 (관심 업체 비교 `?cmp=` 와 같은
     생각입니다).
     ⚠️⚠️ **패키지 하나가 계약 하나가 아닙니다** — 상품마다 업체 배정 ·
     계약 · 수수료가 따로 관리됩니다 (§4-4 가 직접 적은 규칙입니다).
     화면이 그렇게 적고 있고, 접수도 상품 목록을 그대로 실어 보냅니다. */
  if(o.offers && o.offers.length)
    q.push("o="+encodeURIComponent([].concat(o.offers).join(",")));
  if(o.pack)     q.push("pk="+encodeURIComponent(o.pack));
  return "/quote" + (q.length ? "?" + q.join("&") : "");
};

/* ── 이 브라우저에 남는 것 ───────────────────────────────────────
   ⚠️ localStorage 는 사파리 비공개 모드 등에서 **던집니다.** 감싸지
   않으면 화면이 통째로 안 그려집니다.
   ⚠️ **성함 · 연락처를 담지 않습니다.** 가게 컴퓨터는 여러 사람이 씁니다. */
window.amGet = function(key, dflt){
  try{ var v = localStorage.getItem(key); return v ? JSON.parse(v) : dflt; }
  catch(e){ return dflt; }
};
window.amSet = function(key, val){
  try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
};
window.amDel = function(key){ try{ localStorage.removeItem(key); }catch(e){} };

/* ── 읽을 것 — 지금 이 자리에서 필요한 글 ────────────────────────
   ⚠️ 글을 써 놓고 **흐름에 안 이으면 없는 것과 같습니다.** 실제로
   여덟 편을 쓰고 `/content` 와 검색에만 두었다가 이 구간을
   만들었습니다 — 손님은 목록을 뒤지지 않고, 막힌 그 자리에서
   답을 찾습니다.

   ⚠️ **맞는 글이 없으면 구간째 뺍니다** (절대 규칙 2). "준비 중"
   을 찍지 않습니다.
   ⚠️ **억지로 붙이지 마세요.** 엉뚱한 데로 보내면 다음부터 안
   누릅니다 — `amContentsFor()` 가 분류가 맞는 것을 먼저 냅니다. */
window.ReadBand = function(o){
  o = o || {};
  var list = (window.amContentsFor ? amContentsFor(o) : []);
  if(!list.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">먼저 읽어 두시면</p>'+
      '<h2>'+esc(o.title || "여기서 자주 막히는 것")+'</h2>'+
    '</div>'+
    '<ul class="rd-l">'+list.map(function(c){
      return '<li><a href="/content/'+esc(c.slug)+'">'+
        '<span class="rd-m">'+esc(c.side === "close" ? "폐업" : "창업")+
          (c.read ? ' · '+esc(String(c.read))+'분' : '')+'</span>'+
        '<b>'+esc(c.title)+'</b>'+
        '<span class="rd-p">'+esc(c.lead)+'</span>'+
        '<span class="rd-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
    '<div class="row-cta"><a class="btn btn-o" href="/content">'+
      '창업 · 폐업 정보 전부 보기'+icon("arrow",16)+'</a></div>'+
  '</div></section>';
};

/* ── 목록을 한 번에 다 그리지 않습니다 ───────────────────────────────
   ⚠️⚠️ **등록이 0건이라 아무도 몰랐습니다.** `/providers/:cat` ·
   `/stores` · `/assets` · `/franchise/:cat` 이 전부 목록을 **통째로**
   그립니다. 매물이 1000건이 되는 날 카드 1000장이 한 번에 DOM 에
   들어가고, 폰에서는 그대로 멈춥니다 — 사진도 1000장입니다
   (`loading="lazy"` 가 받아 주는 것은 내려받기까지이고, 요소 1000개를
   그리는 것은 그대로입니다).

   24장씩 내고 "더 보기" 로 늘립니다.

   ⚠️ 늘린 상태는 **주소(`?n=`)에 실어서** 뒤로 가기 · 새로고침 ·
   링크 공유에 살아남습니다. 화면을 다시 그려도 그대로입니다.
   ⚠️ canonical 은 `nowPath()` 라 질의문자가 빠집니다 — 같은 내용이
   `?n=48` 로 또 나가서 구글이 둘 다 무시하는 일은 없습니다.
   ⚠️ **숫자를 손으로 적지 마세요.** "n건 중 m건" 은 전부 센 값입니다. */
window.AM_PAGE = 24;

window.amShown = function(total){
  var n = parseInt(nowQS("n"), 10);
  if(!(n > 0)) n = AM_PAGE;
  return Math.min(Math.max(n, AM_PAGE), total);
};

/* 지금 주소에서 `n` 만 갈아 끼운 주소 */
function amPageHref(n){
  var qs = (location.search || "").replace(/^\?/, "")
    .split("&").filter(function(kv){ return kv && kv.indexOf("n=") !== 0; });
  qs.push("n=" + n);
  return nowPath() + "?" + qs.join("&");
};

window.MoreBtn = function(total){
  var n = amShown(total);
  if(n >= total) return "";
  var rest = total - n;
  var step = Math.min(AM_PAGE, rest);
  /* ⚠️ `rel="nofollow"` — 크롤러가 `?n=` 변형을 따라다닐 까닭이 없습니다.
     canonical 이 이미 막아 주지만 긁는 횟수까지 줄입니다. */
  return '<p class="row-cta row-mid"><a class="btn btn-o" rel="nofollow" data-keep href="'+
    esc(amPageHref(n + step))+'">'+step+'건 더 보기'+icon("arrow",16)+
    '<em class="more-n">'+n+' / '+total+'</em></a></p>';
};

/* ── 작은 분야 카드 — 메인의 "필요한 모든 것" 전용 ────────────────
   ⚠️⚠️ **`CatCard()` 와 갈라 둔 까닭.** 분류 화면은 분야 하나를 자세히
   보여 주는 자리라 큰 카드가 맞지만, 메인은 **열셋을 한눈에** 깔아야
   합니다 — 큰 카드로 내면 1440px 에서 1,801px(화면 두 개)이 됐습니다.

   ⚠️⚠️ **시안의 "23개 · 18개" 를 그대로 쓰면 안 됩니다.** 그건 업체
   수이고 지금 0곳이라 지어낸 숫자가 됩니다 (절대 규칙 1). 여기 적는
   것은 **하위 서비스 이름 셋 + 센 값**이라 손으로 고칠 자리가 없고,
   카페를 고르면 "커피머신 · 그라인더 · 제빙기" 로 그 업종 것이
   바로 보입니다. */
window.FitCard = function(c, industryKey){
  var all  = (window.amCatItems ? amCatItems(c, industryKey) : []);
  var some = all.slice(0, 3).map(function(i){ return i.name; });
  return '<a class="fit'+tn(c.tone)+'" href="'+esc(catTo(c))+
    (industryKey ? '?i='+encodeURIComponent(industryKey) : '')+'">'+
    '<span class="fit-ic">'+icon(c.icon,24)+'</span>'+
    '<span class="fit-b">'+
      /* ⚠️ 이름과 센 값을 **각자 태그**에 담습니다 — 한 칸에 맨글과
         태그를 섞으면 grid 에서 깨지고, 검사도 "창업 아이템8" 을 읽게
         됩니다 (실제로 그렇게 짰다가 고쳤습니다). */
      '<b><span class="fit-nm">'+esc(c.name)+'</span>'+
        (all.length ? '<em class="fit-n">'+all.length+'</em>' : '')+'</b>'+
      /* ⚠️⚠️ **빈 카드로 두지 마세요.** `시설 · 장비` 는 하위가
         **업종에서 오는 분류**(`byIndustry`)라, 업종을 안 고르시면
         셀 것이 0 입니다 — 열셋 중 한 장만 이름만 덩그러니 남아
         "이 분야는 준비가 덜 됐나" 로 읽혔습니다 (찍어 보고 알았습니다).
         그 자리에 `lead`("업종마다 다릅니다")를 냅니다 — 데이터에
         **처음부터 적혀 있던 칸**이고, 업종을 고르시면 그 업종의
         장비 이름으로 바뀝니다 (§9). 지어낸 숫자를 채우지 않습니다. */
      (some.length ? '<i>'+esc(some.join(" · "))+
        (all.length > some.length ? ' 외 '+(all.length-some.length) : '')+'</i>'
        : (c.lead ? '<i>'+esc(c.lead)+'</i>' : ''))+
    '</span>'+
  '</a>';
};

/* ════════════════════════════════════════════════════════════════════
   폰에서만 **접어 두기** (2026-10-11 사장님 지시 — "폰에서 접어두는거")

   메인이 390px 에서 18,546px(20.6화면)이었습니다. 재 보니 여백 ·
   머리말 · 줄 사이를 **전부 반으로 줄여도 1.8화면**뿐이고 82%가 카드
   내용이라, 짧아지려면 **카드를 덜 내는** 길밖에 없었습니다.

   ⚠️⚠️ **지우는 것이 아닙니다.** 한 번 더 누르면 그대로 나옵니다 —
   §12("기존 콘텐츠를 지워 빈 페이지처럼 만들지 않는다")와 §30-2 를
   지키면서 첫 화면에서 차지하는 자리만 줄입니다.
   ⚠️ **넓은 화면은 한 픽셀도 안 바뀝니다** — 1440px 은 11,366px 이라
   접을 까닭이 없습니다. CSS 의 `@media (max-width:900px)` 안에서만
   접히고, 단추도 거기서만 보입니다.
   ⚠️⚠️ **접힌 자리에 "준비 중" 을 찍지 않습니다** (절대 규칙 2) —
   단추가 **몇 개가 있는지 세어서** 말합니다.
   ⚠️ 접힌 것은 `display:none` 이라 읽어 주는 프로그램도 같이 건너
   뜁니다 — `aria-expanded` 로 펼칠 수 있다는 것을 알립니다.
   ⚠️⚠️ **크롤러 본문과는 상관이 없습니다** (`build-pages.js` 가 따로
   씁니다) — 접어도 검색엔진이 보는 것은 그대로입니다.
   ════════════════════════════════════════════════════════════════════ */

/* 접는 단추. `id` 는 접히는 칸의 id 입니다.
   ⚠️ 누르는 것은 40px 이상이라야 합니다 — `min-height` 로 잡습니다
   (`padding` 만으로 만들면 짧은 이름에서 다시 낮아집니다). */
window.FoldBtn = function(id, shut, open){
  return '<button class="fld-b" type="button" aria-expanded="false" '+
      'aria-controls="'+esc(id)+'" '+
      'data-shut="'+esc(shut)+'" data-open="'+esc(open || "접기")+'" '+
      'onclick="foldToggle(\''+esc(id)+'\',this)">'+
    '<span>'+esc(shut)+'</span>'+ icon("chevd", 16) +'</button>';
};

/* ⚠️⚠️ **모든 폭에서 접히는 쪽** (2026-10-17 창업 준비 §2-B · §2-D).
   위 `FoldBtn` 은 **폰에서만** 접습니다 — 넓은 화면에서는 단추가
   `display:none` 이라 접어 두면 **펼칠 방법이 아예 없습니다.**
   §2-B 의 "전체 서비스 보기" 와 §2-D 의 "원하는 경우에만 펼쳐보게" 는
   폭과 상관없이 접혀야 해서 갈라 두었습니다.
   ⚠️ 접는 클래스가 `is-fold-all` 로 **다릅니다** — 같은 이름을 쓰면
   폰에서 두 규칙이 겹쳐 패키지 · 푸터까지 같이 움직입니다. */
/* ⚠️⚠️ 네째 칸(`cls`)은 **접을 때 붙일 클래스**입니다. 기본값
   `is-fold-all` 은 `display:none` 이라 **그 칸을 통째로** 감춥니다 —
   안에 있는 일부만 감추려면 제 클래스를 넘기세요.
   그걸 모르고 `/join` 의 분야 격자에 기본값을 썼다가 **구간이
   통째로 사라졌습니다** (재 보고 알았습니다). */
window.FoldAll = function(id, shut, open, cls, opened){
  cls = cls || "is-fold-all";
  /* 2026-11-19 — opened 면 처음부터 펼친 단추입니다 (주소로 고르신 상황 등).
     ⚠️ 그때는 짝이 되는 목록에도 접는 클래스를 **안** 붙여야 합니다 (부르는 쪽 몫). */
  return '<button class="fld-b fld-all'+(opened ? " is-open" : "")+'" type="button" aria-expanded="'+(opened ? "true" : "false")+'" '+
      'aria-controls="'+esc(id)+'" '+
      'data-shut="'+esc(shut)+'" data-open="'+esc(open || "접기")+'" '+
      'onclick="foldToggle(\''+esc(id)+'\',this,\''+esc(cls)+'\')">'+
    '<span>'+esc(opened ? (open || "접기") : shut)+'</span>'+ icon("chevd", 16) +'</button>';
};

/* ⚠️ 다시 그리지 않습니다 — DOM 을 바로 건드립니다. 여기서 화면을
   다시 그리면 **방금 보던 자리를 잃고**(이 저장소가 "더 보기" 에서
   `data-keep` 으로 겪은 자리), 패키지의 체크 상태까지 되돌아갑니다. */
window.foldToggle = function(id, btn, cls){
  cls = cls || "is-fold";
  var el = document.getElementById(id);
  if(!el || !btn) return;
  var shut = el.classList.toggle(cls);      /* true = 다시 접힘 */
  btn.setAttribute("aria-expanded", shut ? "false" : "true");
  var t = btn.querySelector("span");
  if(t) t.textContent = shut ? (btn.getAttribute("data-shut") || "더 보기")
                             : (btn.getAttribute("data-open") || "접기");
  btn.classList.toggle("is-open", !shut);
};

/* ══════════════════════════════════════════════════════════════════
   패키지 구간 — 2026-10-09 최종 통합 지시서 §4-4 · §6-4
   ══════════════════════════════════════════════════════════════════
   ⚠️⚠️ **"인기 패키지" 라고 쓰지 마세요.** 신청 데이터를 하나도 모으지
   않아 무엇이 많이 나가는지 **우리는 모릅니다** (마무리 지시서 §3).
   머리말은 **묶어서 신청하기** 입니다.

   ⚠️⚠️ **패키지 하나가 계약 하나가 아닙니다.** 상품마다 업체가 다르고
   계약도 수수료도 따로입니다 — 구간 아래 한 줄이 그 말을 하고 있고,
   지우면 지키지 못할 약속이 됩니다 (절대 규칙 5 · §4-4).

   ⚠️ 금액을 적지 않습니다. 묶음 할인도 없습니다 — 제휴사가 0곳이라
   깎아 드릴 수 있는 주체가 없습니다. */
window.PackBand = function(side, tone){
  var L = (typeof amPackagesFor === "function") ? amPackagesFor(side) : [];
  if(!L.length) return "";
  return '<section class="sec '+esc(tone || "sec-gray")+' pkg"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">ONE REQUEST</p>'+
      '<h2>여러 개가 필요하시면<br class="br-m"> 묶어서 한 번에 신청하세요</h2>'+
      '<p>일정이 서로 물려 있는 것들입니다. 따로 알아보시면 공사가 끝나고도 '+
        '며칠을 더 기다리게 됩니다.</p>'+
    '</div>'+
    '<ul class="pkg-g">'+L.map(PackCard).join("")+'</ul>'+
    /* ⚠️⚠️ 이 줄을 지우지 마세요 — §4-4 가 직접 정한 규칙입니다 */
    '<p class="sec-note">'+icon("info",15)+
      ' 묶어서 신청하셔도 <b>상품마다 업체와 계약은 따로</b>입니다. '+
      '한 번만 적으시면 저희가 서비스마다 나눠서 확인합니다.</p>'+
  '</div></section>';
};

/* ⚠️⚠️ **카드가 `<div>` 입니다** — 안에 체크칸과 링크가 같이 들어갑니다.
   `<a>` 안의 `<a>` 는 브라우저가 쪼갭니다. */
window.PackCard = function(p){
  var items = (typeof amPackageItems === "function") ? amPackageItems(p.key) : [];
  if(!items.length) return "";
  return '<li class="tn-'+esc(p.tone || "t7")+'"><div class="pkg-c" data-pk="'+esc(p.key)+'">'+
    '<div class="pkg-h">'+
      '<span class="ic-t">'+icon(p.icon, 24)+'</span>'+
      '<div class="pkg-ht"><b>'+esc(p.name)+'</b><i>'+esc(p.lead)+'</i></div>'+
    '</div>'+
    '<p class="pkg-d">'+esc(p.desc || "")+'</p>'+
    /* ⚠️ 체크칸은 **상품마다 하나**입니다. 기본은 전부 켜 두고 빼실 수
       있게 합니다 — 묶음으로 보러 오신 분께 다시 다 고르게 하면
       거기서 닫힙니다. */
    /* ⚠️⚠️ **폰에서는 상품 목록을 접습니다** (사장님 지시). 패키지 넷이
       390px 에서 2,661px 였고 그 대부분이 이 체크 칸이었습니다 —
       고르는 것(패키지 넷)과 누르는 것(상담 신청)은 **접지 않습니다.**
       ⚠️ 단추의 숫자는 **그 자리에서 센 값**입니다. */
    FoldBtn("pkg-l-"+p.key, "상품 " + items.length + "개 보기", "상품 접기")+
    '<ul class="pkg-l is-fold" id="pkg-l-'+esc(p.key)+'">'+items.map(function(o){
      var id = "pk-"+p.key+"-"+o.id;
      return '<li><label class="pkg-ck" for="'+esc(id)+'">'+
        '<input type="checkbox" id="'+esc(id)+'" checked '+
          'data-pkg="'+esc(p.key)+'" value="'+esc(o.id)+'" '+
          'onchange="packSync(\'' + esc(p.key) + '\')">'+
        '<span class="pkg-nm">'+esc(o.name)+'</span>'+
      '</label></li>'; }).join("")+'</ul>'+
    '<p class="pkg-go">'+
      '<a class="btn btn-b" id="pkg-go-'+esc(p.key)+'" '+
        'href="'+esc(quoteTo({ pack:p.key, offers:items.map(function(o){ return o.id; }),
                               side:(p.side === "both" ? "" : p.side) }))+'">'+
        /* ⚠️⚠️ 단추가 `display:inline-flex` · `gap` 이라 **맨글도 flex 칸**이
           됩니다 — 숫자만 `<span>` 으로 두었더니 "6 개" 로 벌어졌습니다
           (찍어 보고 알았습니다). 딱지 전체를 한 칸에 둡니다. */
        '<span id="pkg-n-'+esc(p.key)+'">'+items.length+'개 묶어서 상담 신청</span>'+
        icon("arrow",17)+'</a></p>'+
  '</div></li>';
};

/* 체크를 바꾸면 **신청 링크가 바로 따라갑니다** — 눌렀을 때 고르신 것과
   다른 것이 넘어가면 그게 제일 나쁩니다.
   ⚠️ 하나도 안 고르시면 단추를 잠급니다 (빈 신청을 받지 않습니다). */
window.packSync = function(key){
  var box = document.querySelector('.pkg-c[data-pk="'+key+'"]');
  var go  = document.getElementById("pkg-go-"+key);
  var n   = document.getElementById("pkg-n-"+key);
  if(!box || !go) return;
  var on = [].slice.call(box.querySelectorAll('input[type="checkbox"]'))
    .filter(function(c){ return c.checked; }).map(function(c){ return c.value; });
  var p = (typeof amPackage === "function") ? amPackage(key) : null;
  if(n) n.textContent = on.length + "개 묶어서 상담 신청";
  if(!on.length){
    go.setAttribute("aria-disabled", "true");
    go.removeAttribute("href");
  }else{
    go.removeAttribute("aria-disabled");
    go.setAttribute("href", quoteTo({ pack:key, offers:on,
      side:(p && p.side !== "both") ? p.side : "" }));
  }
};

/* ════════════════════════════════════════════════════════════════════
   전문관 공통 — 계산도구 구간  (2026-10-18 전체 점검 지시서 §3)

   > §3 — "공통 레이아웃 … ⑦ 관련 계산도구 … 공통 전문관 레이아웃
   >  컴포넌트를 활용한다."

   ⚠️⚠️ **전문관마다 베껴 쓰지 마세요.** 네 전문관이 같은 생김새를
   써야 하는데 네 곳에 적어 두면 한쪽만 고치게 됩니다 — 이 저장소가
   `amCatTo`/`catTo` · 랜딩 아이콘 표 · 메인 도구 아이콘 표로 **세 번**
   겪은 자리입니다. 전문관이 넘기는 것은 **어느 계산기를 낼지**와
   머리말까지입니다.

   ⚠️ 없는 도구 key 는 **조용히 빠집니다** (절대 규칙 2) — 도구를
   내려놓으면 그 칸만 없어지고 구간은 그대로 섭니다. 하나도 못 찾으면
   구간째 빠집니다 (빈 머리말을 찍지 않습니다).
   ⚠️ `tones` 를 안 주면 넷이 **같은 색**입니다. 전문관마다 도구가
   달라서 색을 데이터에 둘 수가 없습니다 (도구 하나가 묶음 둘에 걸칩니다).
   ════════════════════════════════════════════════════════════════════ */
window.HallCalcBand = function(o){
  o = o || {};
  var by = {}; (window.AM_TOOLS || []).forEach(function(t){ by[t.key] = t; });
  var L = (o.keys || []).map(function(k){ return by[k]; }).filter(Boolean);
  if(!L.length) return "";
  var tones = o.tones || {};
  return '<section class="sec sec-calc'+(o.cls ? " "+esc(o.cls) : "")+'"><div class="w">'+
    '<div class="sec-hd sec-hd-c">'+
      '<p class="eyebrow">'+esc(o.kicker || "무료 계산도구")+'</p>'+
      '<h2>'+esc(o.title || "숫자를 먼저 보고 정하세요")+'</h2>'+
      '<p>'+esc(o.lead ||
        "가입 없이 바로 쓰실 수 있습니다. 적으신 값은 저장하지 않습니다.")+'</p>'+
    '</div>'+
    '<ul class="mcal-g">'+L.map(function(t){
      var art = (typeof hasIconArt === "function" && hasIconArt(t.icon));
      return '<li class="tn-'+esc(tones[t.key] || "sv1")+'">'+
        '<a href="/tools/'+esc(t.key)+'">'+
        '<span class="mcal-i ia-t" aria-hidden="true">'+
          (art ? iconArt(t.icon, 44) : icon(t.icon, 28))+'</span>'+
        '<b class="mcal-n">'+esc(t.name)+'</b>'+
        /* 2026-11-25 — '넣는 값 → 얻는 결과' 를 한눈에 (AM_TOOL_IN · out) */
        ((window.AM_TOOL_IN || {})[t.key] ? '<span class="mcal-io"><span><em>넣는 값</em>'+esc(AM_TOOL_IN[t.key])+'</span>'+
          (t.out ? '<span><em>얻는 결과</em>'+esc(t.out)+'</span>' : '')+'</span>' :
          (t.out ? '<i class="mcal-o">'+esc(t.out)+'</i>' : ''))+
        '<span class="mcal-go" aria-hidden="true">'+icon("arrow",16)+'</span>'+
      '</a></li>'; }).join("")+'</ul>'+
    '<div class="row-cta">'+
      '<a class="btn btn-o" href="/tools">계산도구 전부 보기'+icon("arrow",16)+'</a>'+
      '<a class="btn btn-o" href="/faq">자주 묻는 질문</a>'+
    '</div>'+
  '</div></section>';
};

/* ════════════════════════════════════════════════════════════════════
   HallHero — 네 전문관(창업 준비 · 매장 운영 · 매장 양도양수 · 폐업·철거)의 머리
   (2026-11-18 카테고리 리뉴얼 시안)

   짙은 남색 판 + 오른쪽 사진 + 큰 제목(강조 낱말 하나) + 단추 둘 + 흰 확인 카드.
   ⚠️⚠️ class 에 pgh 를 그대로 둡니다 — 전수 점검 "전문관 공통 여덟" ① 이 그것을 봅니다.
   ⚠️⚠️ 주 단추는 **견적 접수 상태를 따릅니다** — 헤더 CTA 와 같은 서버 게이트
      (amQuoteOpen · data-cta). 닫혀 있으면 "접수 안내" 로 가고, 열렸을 때만 신청으로 갑니다.
   ⚠️⚠️ 확인 카드에는 **이 화면이 지금 실제로 하는 것**만 적습니다 — 시안의
      "검증된 전문 업체" · "매출 상승 전략 제안" 같은 말은 근거가 없어 쓰지 않습니다.
   ⚠️ 짙은 판은 이 머리 한 자리뿐입니다. 어두운 면 검사는 .hh 를 따로 재고
      (높이 상한), 그 아래 본문은 그대로 15% 한도로 봅니다 (check.js).
   ⚠️ 사진은 받아 둔 넉 장(hero-startup · hero-ops · kind-pass · hero-closure)뿐이고,
      없으면 판만 섭니다 (빈 액자를 깔지 않습니다).
   ════════════════════════════════════════════════════════════════════ */
/* 2026-11-18 — 그 단추가 어느 접수 양식을 따르는가 (없으면 견적 quote) */
function ctaF(o){ return (o && o.ctaForm) ? ' data-cta-form="'+esc(o.ctaForm)+'"' : ""; }
/* 2026-11-19 공개 화면 완성도 §2 — 접수가 열렸을 때 / 닫혔을 때 **글 한 쌍** (data-cta 짝).
   ⚠️ 열린 쪽은 처음에 가려 둡니다 — 상태를 아직 못 읽었거나 읽기에 실패하면 닫힌 글이
   남습니다 (hdCtaPaint 가 양식마다 따로 풉니다). on · off 는 esc 를 거칩니다. */
window.ctaPair = function(form, on, off){
  var f = ' data-cta-form="'+esc(form || "quote")+'"';
  return '<span data-cta="on"'+f+' hidden>'+esc(on)+'</span><span data-cta="off"'+f+'>'+esc(off)+'</span>';
};
/* 2026-11-20 — 전문관 머리의 자체 일러스트 (A → B). 메인 양도양수 배너(wpPassArt)와 같은 꼴 · 같은 클래스.
   ⚠️ iconArt 로 직접 그린 그림만 씁니다 (외부 자산 없음). 그림이 없으면 선 아이콘으로 받습니다. */
window.hhFlowArt = function(a, la, b, lb){
  var ia = function(n){ return (typeof hasIconArt === "function" && hasIconArt(n)) ? iconArt(n, 96) : icon(n, 56); };
  return '<span class="wp-pa">'+
    '<span class="wp-pa-c">'+ia(a)+'<i>'+esc(la)+'</i></span>'+
    '<span class="wp-pa-x">'+icon("arrow",28)+'</span>'+
    '<span class="wp-pa-c">'+ia(b)+'<i>'+esc(lb)+'</i></span>'+
  '</span>';
};
/* 같은 화면 안의 구역으로 — 접힌 칸이면 펼치고 그 자리로 옮깁니다 */
window.hhJump = function(id){
  var sec = document.getElementById(id);
  if(!sec) return true;
  sec.scrollIntoView({ behavior:"auto", block:"start" });
  var h = sec.querySelector("h2"); if(h){ h.setAttribute("tabindex","-1"); try{ h.focus({preventScroll:true}); }catch(e){} }
  return false;
};
/* 2026-11-25 — 다른 화면의 자리로 (라우터는 # 을 안 봅니다 · location.hash 를 읽지 않는 규칙).
   그 화면으로 넘긴 뒤 그린 다음 틀에 그 자리로 내립니다. */
window.hhGoJump = function(path, id){
  if(typeof go !== "function") return true;
  go(path);
  setTimeout(function(){ hhJump(id); }, 0);
  return false;
};
window.HallHero = function(o){
  o = o || {};
  var ph = o.photo && typeof hasPhoto === "function" && hasPhoto(o.photo);
  var checks = (o.checks || []).map(function(c){
    return '<li><span class="hh-ci" aria-hidden="true">'+icon(c[0] || "check", 20)+'</span>'+
      '<span>'+esc(c[1])+'</span></li>';
  }).join("");
  /* 2026-11-19 — qfirst: 폰에서 바로 가기 카드를 단추 줄보다 **먼저** 둡니다 (그 화면의 첫 행동이 그 카드일 때).
     leadM: 폰에서만 내는 짧은 설명 (PC 설명은 그대로). */
  /* 2026-11-20 — art: 사진 대신 자체 일러스트(HTML) 판. 사진이 있으면 사진이 먼저입니다.
     ⚠️ 외부 그림이 아니라 iconArt 로 직접 그린 것만 넘기세요 (양도양수 — wpPassArt). */
  var art = !ph && o.art ? o.art : "";
  return '<section class="pgh hh hh-'+esc(o.side || "start")+(ph ? ' hh-im-on' : '')+(art ? ' hh-art-on' : '')+
    (o.qfirst && o.quick && o.quick.length ? ' hh-qfirst' : '')+(o.sit ? ' hh-sit' : '')+'">'+
    (ph ? '<span class="hh-ph pgh-im-'+esc(o.photo)+'">'+
          photoBox(o.photo, "", true, "(max-width:900px) 100vw, 62vw")+'</span>' : '')+
    (art ? '<span class="hh-ph hh-art" aria-hidden="true">'+art+'</span>' : '')+
    '<div class="w hh-in">'+
      '<div class="hh-tx">'+
        (o.crumb ? '<nav class="crumb" aria-label="현재 위치">'+o.crumb+'</nav>' : '')+
        (o.kicker ? '<p class="hh-k">'+esc(o.kicker)+'</p>' : '')+
        '<h1 class="pg-h1 hh-h1">'+(o.h1raw || esc(o.h1 || ""))+'</h1>'+
        /* leadHtml — 이미 만든 HTML (접수 상태에 따라 갈리는 data-cta 짝 글 등). 손님 글을 넣지 마세요. */
        (o.leadHtml ? '<p class="pg-lead hh-lead">'+o.leadHtml+'</p>' : '')+
        (!o.leadHtml && o.lead ? '<p class="pg-lead hh-lead">'+(o.leadM
          ? '<span class="hh-lead-l">'+esc(o.lead)+'</span><span class="hh-lead-m">'+esc(o.leadM)+'</span>'
          : esc(o.lead))+'</p>' : '')+
        '<div class="row-cta hh-cta">'+
          '<a class="btn btn-lg hh-go" href="/intake" data-cta="off"'+ctaF(o)+'>'+
            '접수 안내 보기'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-lg hh-go" href="'+esc(o.quote || "/quote")+'" data-cta="on"'+ctaF(o)+' hidden>'+
            esc(o.goName || "상담 신청하기")+icon("arrow",18)+'</a>'+
          (o.second ? o.second : '')+
        '</div>'+
      '</div>'+
      /* 2026-11-19 — quick 이 있으면 체크 카드 대신 **바로 가는 카드**입니다 (폐업 · 철거).
         ⚠️ 칸마다 실제로 있는 화면이고, 접수가 걸린 칸은 data-cta 짝(on 은 hidden)입니다.
         ⚠️ 폰에서도 접지 않습니다 — 첫 행동 단추 **아래**에 섭니다 (단추를 밀지 않습니다). */
      (o.quick && o.quick.length
        ? '<div class="hh-card hh-quick"><p class="hh-card-t">'+esc(o.cardTitle || "바로 가기")+'</p>'+
          '<ul class="hh-ql">'+o.quick.map(function(q){
            function a(href, go, attr){
              /* 2026-11-20 — 같은 화면 안의 구역(#id)으로 가는 칸은 라우터를 거치지 않고 그 자리로 갑니다
                 (# 주소는 popstate 로 화면을 다시 그립니다 — aqJump 와 같은 까닭). */
              var jump = href.charAt(0) === "#" ? ' onclick="return hhJump(\''+esc(href.slice(1))+'\')"' : "";
              return '<a class="hh-qa" href="'+esc(href)+'"'+jump+(attr || "")+'>'+
                '<span class="hh-ci" aria-hidden="true">'+icon(q.ic || "arrow", 20)+'</span>'+
                '<span class="hh-qt"><b>'+esc(q.b)+'</b>'+
                  (q.d ? '<small class="hh-qd">'+esc(q.d)+'</small>' : '')+
                  '<i>'+esc(go)+'</i></span>'+icon("chev",16)+'</a>';
            }
            return '<li>'+(q.on
              ? a(q.on, q.goOn || q.go, ' data-cta="on" data-cta-form="'+esc(q.form || "close")+'" hidden')+
                a(q.href, q.go, ' data-cta="off" data-cta-form="'+esc(q.form || "close")+'"')
              : a(q.href, q.go))+'</li>';
          }).join("")+'</ul></div>'
        : (checks ? '<div class="hh-card"><p class="hh-card-t">'+esc(o.cardTitle || "이 화면에서 하실 수 있는 것")+'</p>'+
        '<ul class="hh-cl">'+checks+'</ul></div>' : ''))+
    '</div>'+
  '</section>';
};

/* 상담 신청 진행 — 네 전문관 공통 (시안의 "상담 신청 진행 절차").
   ⚠️ 걸음은 js/data/steps.js 의 AM_STEPS 한 곳입니다 (메인 · 크롤러 본문과 같은 말).
   ⚠️ 끝 단추는 HallHero 와 같은 data-cta 짝 — 닫혀 있으면 접수 안내. */
window.HallSteps = function(o){
  o = o || {};
  var S = (window.AM_STEPS || []);
  if(!S.length) return "";
  return '<section class="sec sec-white hst"><div class="w hst-in">'+
    '<div class="hst-hd"><h2>'+esc(o.title || "상담 신청은 이렇게 진행됩니다")+'</h2>'+
      '<p>'+ctaPair(o.ctaForm || "quote",
        "서비스를 고르시고 한 번만 적어 보내시면 운영자가 확인합니다. 업체에 연락처를 전하기 전에는 따로 동의를 여쭙니다.",
        "접수가 열리면 이 순서로 진행합니다. 지금은 접수를 받지 않아, 접수 방법은 접수 안내에서 확인하실 수 있습니다.")+'</p></div>'+
    '<ol class="hst-g">'+S.map(function(s, i){
      return '<li><span class="hst-n">'+(i+1)+'</span>'+
        '<span class="hst-i" aria-hidden="true">'+icon(s.ic || "check", 26)+'</span>'+
        '<b>'+esc(s.n || "")+'</b></li>';
    }).join("")+'</ol>'+
    '<div class="hst-go">'+
      '<a class="btn btn-lg hh-go" href="/intake" data-cta="off"'+ctaF(o)+'>접수 안내 보기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-lg hh-go" href="'+esc(o.quote || "/quote")+'" data-cta="on"'+ctaF(o)+' hidden>'+
        esc(o.goName || "상담 신청하기")+icon("arrow",18)+'</a>'+
    '</div>'+
  '</div></section>';
};

/* ══ 2026-11-23 4개 카테고리 시안 — 본문 공통 조각 (Kx*) ═════════════════════
   시안 01~04 의 본문은 넷 다 같은 뼈대입니다 — ① 핵심 서비스 카드 ② 진행 과정(사진 옆)
   ③ 예상 비용 계산(사진 옆) ④ 사진 CTA. 전문관마다 베껴 쓰지 않고 여기 한 벌을 씁니다.
   ⚠️⚠️ 새 구간을 **더한 것**입니다 — 고르개 · 바구니 · 체크리스트 · 가이드 · 매물 · 계산도구는
      그대로 있습니다 (기존 기능 보존 · 검사가 그 구간들을 봅니다).
   ⚠️⚠️ 사진은 권리가 확인된 것만 (photos.js 의 insu-* · home-* · svc-*). 없으면 **액자째 안 그리고**
      글이 주인공인 짜임새로 섭니다 (절대 규칙 2 — 빈 액자 · "준비 중" 을 깔지 않습니다).
   ⚠️ 클래스는 kx-* 입니다 (.how-* · .hiw-* · .pkg-* 처럼 다른 화면과 겹치지 않게). */
function kxPh(key, sz){
  return (key && typeof hasPhoto === "function" && hasPhoto(key))
    ? photoBox(key, "", false, sz || "(max-width:900px) 92vw, 46vw") : "";
}
function kxHd(o){
  return '<div class="kx-hd">'+
    (o.kicker ? '<p class="kx-k">'+esc(o.kicker)+'</p>' : '')+
    '<h2 class="kx-h">'+esc(o.title || "")+'</h2>'+
    (o.lead ? '<p class="kx-lead">'+esc(o.lead)+'</p>' : '')+
  '</div>';
}
/* ① 핵심 서비스 — 큰 카드. 사진이 있으면 사진, 없으면 **큰** 컬러 아이콘(64px) 판.
   ⚠️ 카드 전체가 하나의 a 입니다 — 안에 또 a 를 넣지 마세요.
   ⚠️ 이름 · 주소는 부르는 쪽이 catalog.js 에서 가져옵니다 (손으로 적지 않습니다). */
window.KxServices = function(o){
  o = o || {};
  var L = (o.items || []).filter(function(x){ return x && x.href; });
  if(!L.length) return "";
  return '<section class="sec '+esc(o.tone || "sec-white")+' kx kx-svc"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="w">'+
    kxHd(o)+
    '<ul class="kx-svc-g">'+L.map(function(x){
      var ph = kxPh(x.ph, "(max-width:600px) 46vw, (max-width:1100px) 30vw, 300px");
      var art = (typeof hasIconArt === "function" && hasIconArt(x.ia)) ? iconArt(x.ia, 64) : icon(x.ic || "grid", 40);
      return '<li><a class="kx-svc-c'+(ph ? ' kx-on' : '')+'" href="'+esc(x.href)+'">'+
        '<span class="kx-svc-ph" aria-hidden="true">'+(ph || '<span class="kx-svc-art">'+art+'</span>')+'</span>'+
        '<span class="kx-svc-tx"><b>'+esc(x.n)+'</b>'+(x.d ? '<small>'+esc(x.d)+'</small>' : '')+
        '<i>자세히 보기'+icon("chev",14)+'</i></span></a></li>';
    }).join("")+'</ul>'+
    (o.note ? '<p class="kx-note">'+esc(o.note)+'</p>' : '')+
  '</div></section>';
};
/* ② 진행 과정 — 사진 한 장 옆에 번호 걸음. ⚠️ 걸음은 **지킬 수 있는 일**만 (기간 · 보장을 적지 않습니다). */
window.KxProcess = function(o){
  o = o || {};
  var S = o.steps || []; if(!S.length) return "";
  var ph = kxPh(o.photo);
  return '<section class="sec '+esc(o.tone || "sec-ivory")+' kx kx-pro'+(ph ? ' kx-on' : '')+(o.cls ? ' '+esc(o.cls) : '')+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="w kx-split">'+
    (ph ? '<div class="kx-fig" aria-hidden="true">'+ph+'</div>' : '')+
    '<div class="kx-body">'+kxHd(o)+
      '<ol class="kx-pro-l">'+S.map(function(s, i){
        return '<li><span class="kx-n" aria-hidden="true">'+String(i+1).padStart(2,"0")+'</span>'+
          '<span class="kx-pro-tx"><b>'+esc(s[0])+'</b>'+(s[1] ? '<small>'+esc(s[1])+'</small>' : '')+'</span></li>';
      }).join("")+'</ol>'+
      (o.foot ? '<p class="kx-note">'+esc(o.foot)+'</p>' : '')+
      (o.more || '')+   /* 2026-11-23 — 자세한 순서(접힘) · 관련 링크를 대표 절차 한 곳에 붙입니다 */
    '</div></div></section>';
};
/* ③ 예상 비용 · 진단 — 실제 계산도구로 보냅니다. ⚠️⚠️ **금액을 적지 않습니다** (시안의 예시 금액 금지) —
   무엇을 따져 보는지와 '참고값 · 실제 견적과 다름' 을 적고, 숫자는 도구가 그 자리에서 냅니다. */
window.KxCalc = function(o){
  o = o || {};
  var ph = kxPh(o.photo);
  var B = (o.btns || []).filter(function(b){ return b && b.href; });
  return '<section class="sec '+esc(o.tone || "sec-white")+' kx kx-calc'+(ph ? ' kx-on' : '')+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="w kx-split kx-rev">'+
    '<div class="kx-body">'+kxHd(o)+
      (o.list && o.list.length ? '<ul class="kx-ck">'+o.list.map(function(t){
        return '<li><span aria-hidden="true">'+icon("check",18)+'</span><span>'+esc(t)+'</span></li>'; }).join("")+'</ul>' : '')+
      (B.length ? '<div class="row-cta kx-go">'+B.map(function(b, i){
        var jump = b.href.charAt(0) === "#" ? ' onclick="return hhJump(\''+esc(b.href.slice(1))+'\')"' : "";
        return '<a class="btn btn-lg '+(i ? 'btn-o' : 'btn-b')+'" href="'+esc(b.href)+'"'+jump+'>'+(b.ic ? icon(b.ic,18)+' ' : '')+esc(b.t)+'</a>'; }).join("")+'</div>' : '')+
      (o.note ? '<p class="kx-note kx-warn">'+icon("info",16)+'<span>'+esc(o.note)+'</span></p>' : '')+
    '</div>'+
    (ph ? '<div class="kx-fig" aria-hidden="true">'+ph+'</div>' : '')+
  '</div></section>';
};
/* ④ 사진 CTA — 주 단추는 **접수 상태를 따릅니다** (HallHero 와 같은 data-cta 짝).
   닫혀 있으면 '접수 안내 보기', 열리면 상담 신청. ⚠️ 시안의 전화번호(1661-XXXX)는 없는 번호라 넣지 않습니다. */
window.KxCta = function(o){
  o = o || {};
  var ph = kxPh(o.photo, "(max-width:900px) 92vw, 40vw");
  return '<section class="sec '+esc(o.tone || "sec-ivory")+' kx kx-cta"><div class="w">'+
    '<div class="kx-cta-c'+(ph ? ' kx-on' : '')+'">'+
      '<div class="kx-cta-tx">'+
        (o.kicker ? '<p class="kx-k">'+esc(o.kicker)+'</p>' : '')+
        '<h2 class="kx-h">'+esc(o.title || "")+'</h2>'+
        (o.lead ? '<p class="kx-lead">'+esc(o.lead)+'</p>' : '')+
        '<div class="row-cta kx-go">'+
          '<a class="btn btn-lg btn-b" href="/intake" data-cta="off"'+ctaF(o)+'>접수 안내 보기'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-lg btn-b" href="'+esc(o.quote || "/quote")+'" data-cta="on"'+ctaF(o)+' hidden>'+esc(o.goName || "무료 상담 신청하기")+icon("arrow",18)+'</a>'+
          (o.second ? '<a class="btn btn-lg btn-o" href="'+esc(o.second.href)+'">'+esc(o.second.t)+'</a>' : '')+
        '</div>'+
      '</div>'+
      (ph ? '<div class="kx-cta-ph" aria-hidden="true">'+ph+'</div>' : '')+
    '</div></div></section>';
};
/* 카드 한 장 — 분류(+하위) key 로 주소를 만듭니다. ⚠️ 없는 key 면 null (카드가 조용히 빠지고 가짜 링크를 안 만듭니다) */
window.kxSvc = function(cat, sub, n, d, ia, ph){
  var c = (window.AM_CATS || []).filter(function(x){ return x.key === cat; })[0];
  if(!c) return null;
  if(sub && !(c.items || []).some(function(i){ return i.key === sub; })) return null;
  var base = catTo(c);
  var href = sub ? base + (base.indexOf("?") >= 0 ? "&" : "?") + "s=" + encodeURIComponent(sub) : base;
  return { n:n || c.name, d:d || "", href:href, ia:ia || cat, ph:ph || "" };
};

/* ══ 2026-11-23 사진형 시안(창업 · 운영 · 양도양수 · 폐업) — 본문 공통 조각 (Kp*) ═════════════════
   흐름: 큰 대표 사진(HallHero) → 사진형 핵심 서비스 4 → 사진형 진행 절차 4 → 사진 배너 + 실제 도구
        → (페이지별 사진 카드 구간) → 기존 고르기 · 신청 → 왜 인수인계 → 하단 상담 띠.
   ⚠️⚠️ 사진은 권리 확인된 것만(photos.js 의 insu-* · home-* · hero-start/close · svc-*). 없는 장면은
      **큰 컬러 아이콘 판**으로 같은 자리 · 같은 크기를 지킵니다 (빈 액자 · "준비 중" 금지).
   ⚠️ 시안의 카페는 연출 예시 — 문구는 업종을 특정하지 않습니다. 보장 · 실적 문구 없음.
   ⚠️ 카드 전체가 하나의 a 입니다 — 안에 또 a 를 넣지 마세요. 클래스는 kp-* 입니다. */
function kpPh(key, sz){ return (key && typeof hasPhoto === "function" && hasPhoto(key)) ? photoBox(key, "", false, sz || "(max-width:600px) 46vw, 300px") : ""; }
function kpArt(ia, ic){ return '<span class="kp-art">'+((typeof hasIconArt === "function" && hasIconArt(ia)) ? iconArt(ia, 72) : icon(ic || "grid", 44))+'</span>'; }
function kpJump(href){ return href && href.charAt(0) === "#" ? ' onclick="return hhJump(\''+esc(href.slice(1))+'\')"' : ""; }
function kpKicker(t){ return t ? '<p class="kp-k">'+esc(t)+'</p>' : ""; }
/* ① 사진형 핵심 서비스 — 왼쪽 머리말 + 오른쪽 카드 넷 */
window.KpServices = function(o){
  var L = (o.items || []).filter(function(x){ return x && x.href; });
  if(!L.length) return "";
  return '<section class="sec '+esc(o.tone || "sec-white")+' kp kp-svc'+(o.cls ? ' '+esc(o.cls) : '')+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="w kp-svc-in">'+
    '<div class="kp-hd">'+kpKicker(o.kicker || "SERVICE")+'<h2 class="kp-h">'+(o.titleHtml || esc(o.title))+'</h2>'+(o.lead ? '<p class="kp-lead">'+esc(o.lead)+'</p>' : '')+'</div>'+
    '<ul class="kp-svc-g">'+L.map(function(x){
      var ph = kpPh(x.ph);
      return '<li><a class="kp-c" href="'+esc(x.href)+'"'+kpJump(x.href)+'>'+
        '<span class="kp-ph" aria-hidden="true">'+(ph || kpArt(x.ia, x.ic))+'</span>'+
        '<span class="kp-tx"><b>'+esc(x.n)+'</b><small>'+esc(x.d || "")+'</small></span>'+
        '<span class="kp-go" aria-hidden="true">'+icon("arrow",16)+'</span></a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
};
/* ② 사진형 진행 절차 — 번호 배지가 사진 아래 끝에 걸칩니다 */
window.KpProcess = function(o){
  var S = o.steps || []; if(!S.length) return "";
  return '<section class="sec '+esc(o.tone || "sec-ivory")+' kp kp-pro'+(o.cls ? ' '+esc(o.cls) : '')+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="w">'+
    '<div class="kp-pro-hd"><div>'+kpKicker(o.kicker || "PROCESS")+'<h2 class="kp-h">'+esc(o.title)+'</h2></div>'+
      (o.lead ? '<p class="kp-lead">'+esc(o.lead)+'</p>' : '')+
      (o.moreHtml ? '<span class="kp-more">'+o.moreHtml+'</span>' : o.more ? '<a class="btn btn-o kp-more" href="'+esc(o.more.href)+'"'+kpJump(o.more.href)+'>'+esc(o.more.t)+icon("chev",15)+'</a>' : '')+
    '</div>'+
    '<ol class="kp-pro-g">'+S.map(function(s, i){
      var ph = kpPh(s.ph), inner =
        '<span class="kp-ph" aria-hidden="true">'+(ph || kpArt(s.ia, s.ic))+'</span>'+
        '<span class="kp-n" aria-hidden="true">'+String(i+1).padStart(2,"0")+'</span>'+
        '<span class="kp-tx"><b>'+esc(s.n)+'</b><small>'+esc(s.d || "")+'</small></span>';
      return '<li>'+(s.href ? '<a class="kp-c" href="'+esc(s.href)+'"'+kpJump(s.href)+'>'+inner+'<span class="kp-go" aria-hidden="true">'+icon("chev",16)+'</span></a>' : '<div class="kp-c">'+inner+'</div>')+'</li>';
    }).join("")+'</ol>'+(o.after || '')+
  '</div></section>';
};
/* ③ 사진 배너 + 실제 도구 — 짙은 브라운 면 · 오른쪽 사진. ⚠️ 금액을 적지 않습니다(도구가 그 자리에서 셈) */
window.KpBanner = function(o){
  var ph = kpPh(o.photo, "(max-width:900px) 100vw, 60vw");
  return '<section class="sec-calc kp kp-ban'+(ph ? ' kp-on' : '')+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'>'+
    (ph ? '<span class="kp-ban-ph" aria-hidden="true">'+ph+'</span>' : '')+
    '<div class="w kp-ban-in"><div class="kp-ban-tx">'+kpKicker(o.kicker)+
      '<h2 class="kp-h">'+(o.titleHtml || esc(o.title))+'</h2>'+
      (o.lead ? '<p class="kp-lead">'+esc(o.lead)+'</p>' : '')+
      '<div class="row-cta kp-ban-go">'+(o.btns || []).map(function(b, i){
        return '<a class="btn btn-lg '+(i ? 'kp-btn-o' : 'kp-btn')+'" href="'+esc(b.href)+'"'+kpJump(b.href)+'>'+(b.ic ? icon(b.ic,18)+' ' : '')+esc(b.t)+icon("chev",16)+'</a>'; }).join("")+'</div>'+
      (o.note ? '<p class="kp-ban-n">'+icon("info",15)+'<span>'+esc(o.note)+'</span></p>' : '')+
    '</div>'+
    (o.card ? '<div class="kp-ban-card"><p>'+esc(o.card.title)+'</p><ul>'+o.card.list.map(function(t){ return '<li>'+icon("check",16)+'<span>'+esc(t)+'</span></li>'; }).join("")+'</ul></div>' : '')+
  '</div></section>';
};
/* ④ 페이지별 사진 카드 구간 (업종별 안내 · 분야별 운영 안내 · 지원사업 찾는 곳) */
window.KpCards = function(o){
  var L = (o.items || []).filter(function(x){ return x && x.href; });
  if(!L.length) return "";
  return '<section class="sec '+esc(o.tone || "sec-white")+' kp kp-cards'+(o.cls ? ' '+esc(o.cls) : '')+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="w kp-svc-in">'+
    '<div class="kp-hd">'+kpKicker(o.kicker)+'<h2 class="kp-h">'+esc(o.title)+'</h2>'+(o.lead ? '<p class="kp-lead">'+esc(o.lead)+'</p>' : '')+
      (o.more ? '<a class="btn btn-o kp-more" href="'+esc(o.more.href)+'"'+kpJump(o.more.href)+'>'+esc(o.more.t)+icon("chev",15)+'</a>' : '')+'</div>'+
    '<ul class="kp-svc-g'+(L.length === 3 ? ' kp-g3' : '')+'">'+L.map(function(x){
      var ph = kpPh(x.ph), ext = /^https?:/.test(x.href);
      return '<li><a class="kp-c" href="'+esc(x.href)+'"'+(ext ? ' target="_blank" rel="noopener"' : kpJump(x.href))+'>'+
        '<span class="kp-ph" aria-hidden="true">'+(ph || kpArt(x.ia, x.ic))+'</span>'+
        '<span class="kp-tx"><b>'+esc(x.n)+(x.tag ? ' <em class="kp-tag">'+esc(x.tag)+'</em>' : '')+'</b><small>'+esc(x.d || "")+'</small><i>'+esc(x.go || "자세히 보기")+icon("chev",14)+'</i></span></a></li>';
    }).join("")+'</ul>'+(o.after || '')+
    (o.note ? '<p class="kp-note">'+esc(o.note)+'</p>' : '')+
  '</div></section>';
};
/* ⑤ 왜 인수인계 — 사진 왼쪽 · 셋. ⚠️ "검증된" · 실적 숫자를 쓰지 않습니다 */
window.KpWhy = function(o){
  var ph = kpPh(o.photo, "(max-width:900px) 100vw, 36vw");
  return '<section class="sec sec-ivory kp kp-why'+(ph ? ' kp-on' : '')+'">'+
    (ph ? '<span class="kp-why-ph" aria-hidden="true">'+ph+'</span>' : '')+
    '<div class="kp-why-in"><p class="kp-pill">WHY '+esc(typeof amBrand === "function" ? amBrand() : "")+'?</p>'+
      '<h2 class="kp-h">'+esc(o.title)+'</h2>'+
      '<ul class="kp-why-g">'+(o.items || []).map(function(x){ return '<li><span class="kp-why-i" aria-hidden="true">'+icon(x.ic || "check", 26)+'</span><span><b>'+esc(x.b)+'</b><small>'+esc(x.d)+'</small></span></li>'; }).join("")+'</ul>'+
    '</div></section>';
};
/* ⑥ 하단 상담 띠 — 주 단추는 접수 상태를 따릅니다(data-cta 짝). ⚠️ 없는 전화번호를 적지 않습니다 */
window.KpCta = function(o){
  return '<section class="kp kp-cta"><div class="w kp-cta-in"><div><h2 class="kp-h">'+esc(o.title)+'</h2>'+(o.lead ? '<p class="kp-lead">'+esc(o.lead)+'</p>' : '')+'</div>'+
    '<div class="row-cta kp-cta-go">'+
      (o.second ? '<a class="btn btn-lg kp-btn-o" href="'+esc(o.second.href)+'"'+kpJump(o.second.href)+'>'+esc(o.second.t)+icon("chev",16)+'</a>' : '')+
      '<a class="btn btn-lg kp-btn-w" href="/intake" data-cta="off"'+ctaF(o)+'>'+icon("calendar",18)+' 접수 안내 보기</a>'+
      '<a class="btn btn-lg kp-btn-w" href="'+esc(o.quote || "/quote")+'" data-cta="on"'+ctaF(o)+' hidden>'+icon("calendar",18)+' '+esc(o.goName || "무료 상담신청")+'</a>'+
    '</div></div></section>';
};

/* ════════════════════════════════════════════════════════════════════
   2026-11-26 모바일 사용성 개편 — 내 상황 선택 → 결과 확인 → 다음 행동
   네 카테고리(창업 · 운영 · 양도양수 · 폐업)가 같이 쓰는 첫 구간입니다.

   ⚠️⚠️ **고른 상황은 주소(?키=값)에만 싣습니다.** 뒤로 가기 · 새로고침 ·
   링크 공유에 살아남고, 그 밖에는 아무 데도 남지 않습니다.
   ⚠️⚠️ **고른 서비스는 기존 바구니(am.pick.v1) 그대로입니다** — 새 저장소를
   만들지 않았습니다. 체크 · 개수 · 신청 링크는 pickPaint() 가 맞춥니다.
   ⚠️ 신청 단추는 기존 게이트(data-cta 짝 · data-pick-go/data-go-form)를 씁니다 —
   접수가 닫혀 있으면 접수 안내가 섭니다.
   ⚠️ 상황 카드는 링크라서 키보드 · 읽어 주는 프로그램에 그대로 읽히고,
   고른 카드는 aria-current 와 체크 표시 · 테두리로 함께 표시합니다 (색만이 아닙니다).

   o = { id, key, base, keep:{qs}, tone, kicker, title, lead, opts:[{k,b,d,ph,ia,ic}],
         sel, extra, hint, res:function(k) → { title, lead, todo:[], main:{href,t,ic,gate},
         more:[{href,t}], pick:{ids,side,title,note}, after } }
   ════════════════════════════════════════════════════════════════════ */
function sitQs(o, k){
  var q = [];
  var keep = o.keep || {};
  Object.keys(keep).forEach(function(n){ if(keep[n]) q.push(n + "=" + encodeURIComponent(keep[n])); });
  if(k) q.push(o.key + "=" + encodeURIComponent(k));
  return o.base + (q.length ? "?" + q.join("&") : "");
}
window.sitQs = sitQs;
function SitPickCard(s){
  /* PickCard 와 같은 칸이되 id 앞머리가 다릅니다 — 같은 화면 아래의 '여러 서비스 함께 고르기' 와
     겹치면 label for 가 먼저 나온 칸만 가리킵니다 (st-ind 로 겪은 자리). */
  return PickCard(s).replace(/(id|for)="pk-/g, '$1="sp-');
}
window.SitPickCard = SitPickCard;
window.SitFlow = function(o){
  o = o || {};
  var id = o.id || "sit", sel = o.sel || "";
  var hit = (o.opts || []).filter(function(x){ return x.k === sel; })[0];
  var R = hit && typeof o.res === "function" ? o.res(sel) : null;
  var cards = (o.opts || []).map(function(x){
    var on = hit && x.k === hit.k;
    var ph = x.ph && typeof hasPhoto === "function" && hasPhoto(x.ph)
      ? photoBox(x.ph, "", false, "(max-width:700px) 46vw, 280px") : "";
    return '<li><a class="sitf-o'+(on ? " is-on" : "")+'" href="'+esc(sitQs(o, x.k))+'" data-keep data-focus="'+esc(id)+'-res"'+
      (on ? ' aria-current="true"' : '')+'>'+
      '<span class="sitf-ph" aria-hidden="true">'+(ph || ((typeof hasIconArt === "function" && x.ia && hasIconArt(x.ia)) ? iconArt(x.ia, 56) : icon(x.ic || "grid", 34)))+'</span>'+
      '<span class="sitf-t"><b>'+esc(x.b)+'</b>'+(x.d ? '<small>'+esc(x.d)+'</small>' : '')+'</span>'+
      '<span class="sitf-ck" aria-hidden="true">'+icon(on ? "check" : "chev", 16)+'</span>'+
    '</a></li>';
  }).join("");
  return '<section class="sec '+esc(o.tone || "sec-white")+' sitf" id="'+esc(id)+'"><div class="w">'+
    '<ol class="sitf-st" aria-label="진행 순서">'+
      '<li class="'+(hit ? "is-done" : "is-now")+'"><i>1</i>내 상황</li>'+
      '<li class="'+(hit ? "is-now" : "")+'"><i>2</i>결과 확인</li>'+
      '<li><i>3</i>다음 행동</li></ol>'+
    '<div class="sitf-hd">'+(o.kicker ? '<p class="eyebrow">'+esc(o.kicker)+'</p>' : '')+
      '<h2>'+esc(o.title || "지금 어떤 상황이세요?")+'</h2>'+
      (o.lead ? '<p>'+esc(o.lead)+'</p>' : '')+'</div>'+
    '<ul class="sitf-g sitf-g'+(o.opts || []).length+'">'+cards+'</ul>'+
    (o.extra || '')+
    (R ? SitResult(o, id, hit, R)
       : '<p class="sitf-hint">'+icon("info",15)+' '+esc(o.hint || "고르시면 바로 아래에 지금 할 일과 다음 행동이 나옵니다.")+'</p>')+
  '</div></section>';
};
function SitResult(o, id, hit, R){
  var todo = (R.todo || []).map(function(t, i){
    return '<li><i>'+(i + 1)+'</i><span>'+(typeof t === "string" ? esc(t) : '<b>'+esc(t[0])+'</b> '+esc(t[1] || ""))+'</span></li>';
  }).join("");
  var pk = R.pick && R.pick.ids ? R.pick.ids.map(function(x){ return amPickOne(x); }).filter(Boolean) : [];
  var side = (R.pick && R.pick.side) || o.side || "start";
  var main = R.main;
  function mainBtn(){
    if(!main) return "";
    var inner = (main.ic ? icon(main.ic, 18) + " " : "") + esc(main.t) + icon("arrow", 18);
    if(main.gate)       /* 접수가 걸린 단추 — 닫혀 있으면 접수 안내 */
      return '<a class="btn btn-b btn-lg sitf-main" href="'+esc(main.href)+'" data-cta="on" data-cta-form="'+esc(main.gate)+'" hidden>'+inner+'</a>'+
             /* 닫혀 있으면 접수 안내 — ⚠️ 바로 위 고르기 요약이 이미 '접수 안내 보기' 를 내면 두 번 내지 않습니다 */
             (pk.length ? '' : '<a class="btn btn-b btn-lg sitf-main" href="/intake" data-cta="off" data-cta-form="'+esc(main.gate)+'">접수 안내 보기'+icon("arrow",18)+'</a>');
    return '<a class="btn btn-b btn-lg sitf-main" href="'+esc(main.href)+'"'+(main.js ? ' onclick="'+esc(main.js)+'"' : '')+'>'+inner+'</a>';
  }
  var NEXT = (main || (R.more && R.more.length)
      ? '<p class="sitf-sub">다음 행동</p><div class="sitf-next">'+mainBtn()+
          (R.more || []).map(function(m){
            return '<a class="btn btn-o sitf-2" href="'+esc(m.href)+'">'+(m.ic ? icon(m.ic,16) + " " : "")+esc(m.t)+'</a>';
          }).join("")+'</div>'
      : '');
  var n = amPickCount();
  return '<div class="sitf-res" id="'+esc(id)+'-res" tabindex="-1" aria-live="polite">'+
    '<div class="sitf-rh"><p class="sitf-k">'+icon("check",14)+' 고르신 상황 · '+esc(hit.b)+'</p>'+
      '<a class="sitf-re" href="'+esc(sitQs(o, ""))+'" data-keep data-focus="'+esc(id)+'">다시 고르기</a></div>'+
    '<h3>'+esc(R.title)+'</h3>'+(R.lead ? '<p class="sitf-rl">'+esc(R.lead)+'</p>' : '')+
    (todo ? '<p class="sitf-sub">지금 할 일</p><ol class="sitf-do">'+todo+'</ol>' : '')+
    (R.first || '')+
    (R.mainFirst ? NEXT : '')+
    (pk.length
      ? '<div class="sitf-pkw"><p class="sitf-sub">'+esc(R.pick.title || "맡길 서비스 고르기")+' <small>여러 개 고르실 수 있습니다</small></p>'+
          '<ul class="sitf-pk pk-g">'+pk.map(SitPickCard).join("")+'</ul>'+
          '<div class="sitf-sum">'+
            '<p class="sitf-sum-t"><span>고르신 서비스 <b data-pick-n>'+n+'</b>개</span>'+
              '<button class="sitf-clr" type="button" data-pick-row'+(n ? "" : " hidden")+' onclick="pickClear()">전부 해제</button></p>'+
            '<ul class="sitf-rows pkb-l" data-pick-rows>'+(typeof pickRows === "function" ? pickRows() : "")+'</ul>'+
            '<a class="btn btn-b btn-lg sitf-main" data-pick-go="'+esc(side)+'" data-go-form="'+esc(amPickGoForm(side))+'" href="'+esc(amPickQuoteTo(side))+'">'+
              '<span>'+(n ? "선택한 " + n + "개 서비스 견적 신청하기" : "견적 신청하기")+'</span>'+icon("arrow",18)+'</a>'+
            '<a class="btn btn-b btn-lg sitf-main pk-closed" href="/intake" data-pick-closed="'+esc(side)+'" data-go-form="'+esc(amPickGoForm(side))+'">접수 안내 보기'+icon("arrow",18)+'</a>'+
            (R.pick.note ? '<p class="sitf-note">'+esc(R.pick.note)+'</p>' : '')+
            '<p class="sitf-note">고르기만 하면 접수되지 않습니다. 신청하기를 누르셔야 접수됩니다. 고르신 것은 이 브라우저에 남습니다.</p>'+
          '</div></div>'
      : '')+
    (R.mainFirst ? '' : NEXT)+
    (R.after || '')+
  '</div>';
}
window.SitResult = SitResult;

/* 목록 위 한 줄 — 고른 조건 · 결과 수 · 초기화 (업체 · 매물 · 집기 공통)
   ⚠️ 상태가 셋입니다 — ① 전체 등록 0건 ② 조건 때문에 0건 ③ 목록을 못 읽음.
   셋을 한 문구로 덮으면 손님이 무엇을 해야 하는지(기다리기 · 조건 바꾸기 · 새로고침)를 모릅니다. */
window.ListHead = function(o){
  o = o || {};
  var chips = (o.conds || []).filter(function(c){ return c && c[0]; }).map(function(c){
    return '<li><span>'+esc(c[0])+'</span>'+(c[1] ? '<a href="'+esc(c[1])+'" data-keep aria-label="'+esc(c[0])+' 조건 빼기">'+icon("x",13)+'</a>' : '')+'</li>';
  }).join("");
  return '<div class="lsh" id="'+esc(o.id || "lsh")+'">'+
    '<p class="lsh-n"><b>'+(o.fail ? "—" : o.n)+'</b>'+esc(o.unit || "건")+
      (o.fail ? " · 목록을 불러오지 못함" : (o.total === 0 ? " · 아직 등록된 곳이 없습니다" : (chips ? " · 고른 조건에 맞는 결과" : " · 전체")))+'</p>'+
    (chips ? '<ul class="lsh-c">'+chips+'</ul><a class="lsh-x" href="'+esc(o.reset)+'" data-keep>조건 초기화</a>' : '')+
  '</div>';
};
window.ListState = function(o){
  /* o = { fail, total, n, what, reset, zeroAll:html } */
  if(o.fail) return '<div class="lst lst-fail" role="alert">'+icon("info",18)+
    '<p><b>목록을 불러오지 못했습니다.</b> 잠시 뒤 새로고침해 주세요. 아래 안내와 신청은 그대로 쓰실 수 있습니다.</p>'+
    '<a class="btn btn-o" href="'+esc(location.pathname + location.search)+'" onclick="location.reload();return false">새로고침</a></div>';
  if(o.n) return "";
  if(!o.total) return o.zeroAll || "";
  return '<div class="lst lst-cond">'+icon("sliders",18)+
    '<p><b>고르신 조건에 맞는 '+esc(o.what || "결과")+'가 없습니다.</b> 전체에는 '+o.total+'건이 있습니다. 조건을 바꾸거나 초기화해 보세요.</p>'+
    '<a class="btn btn-b" href="'+esc(o.reset)+'" data-keep>조건 초기화</a></div>';
};

/* ══ 2026-11-28 카테고리 네 화면의 머리 (대표 시안 02_카테고리) ══════════════
   차례 — 사진 띠 → 제목 + 큰 아이콘 → 한 줄 → **주요 행동 둘** → 개별 서비스 · 도구 줄.
   그 아래 원래 있던 안내(절차 · 체크리스트 · 가이드 · 고르기)는 **그대로** 이어집니다.
   ⚠️⚠️ 버튼은 전부 실제 화면입니다 — 없는 기능을 가리키지 마세요.
   ⚠️ 접수 양식으로 가는 버튼은 form 을 주면 열림/닫힘 짝(data-cta)으로 냅니다 —
      닫혀 있으면 같은 자리에 '접수 안내' 가 섭니다 (2026-11-18 양식마다 따로).
   ⚠️ h1 은 화면마다 하나 — 이 머리가 그 h1 입니다 (원래 머리는 이 화면들에서 안 부릅니다). */
function ctBtn(b, cls){
  if(!b) return "";
  var inner = '<span class="cg-bi" aria-hidden="true">'+icon(b.ic || "arrow", 20)+'</span><span class="cg-bt">'+esc(b.t)+'</span>'+icon("chev", 16);
  if(b.form){
    return '<a class="'+cls+'" data-cta="on" data-cta-form="'+esc(b.form)+'" href="'+esc(b.href)+'" hidden>'+inner+'</a>'+
      '<a class="'+cls+'" data-cta="off" data-cta-form="'+esc(b.form)+'" href="/intake">'+
        '<span class="cg-bi" aria-hidden="true">'+icon("info", 20)+'</span><span class="cg-bt">'+esc(b.off || "접수 안내 보기")+'</span>'+icon("chev", 16)+'</a>';
  }
  return '<a class="'+cls+'" href="'+esc(b.href)+'"'+(b.id ? ' id="'+esc(b.id)+'"' : '')+'>'+inner+'</a>';
}
/* 줄 하나 — 사진(있으면) 또는 아이콘 + 이름 + 화살표. 카드 전체가 링크 하나 */
function ctRow(r){
  var ph = r.ph && typeof hasPhoto === "function" && hasPhoto(r.ph);
  var art = (typeof hasIconArt === "function" && hasIconArt(r.ic)) ? iconArt(r.ic, 34) : icon(r.ic || "store", 26);
  return '<li><a class="cg-r'+(ph ? ' cg-r-ph' : '')+'" href="'+esc(r.href)+'">'+
    (ph ? '<span class="cg-rp" aria-hidden="true">'+photoBox(r.ph, "", false, "128px")+'</span>'
        : '<span class="cg-ri" aria-hidden="true">'+art+'</span>')+
    '<span class="cg-rt"><b>'+esc(r.t)+'</b>'+(r.d ? '<i>'+esc(r.d)+'</i>' : '')+'</span>'+
    icon("chev", 18)+'</a></li>';
}
/* 고르는 칸 — 서비스 고르기 바구니(am.pick.v1)에 그대로 담깁니다 (같은 id 의 칸은 화면 어디서든 같이 켜집니다) */
function ctTile(t){
  var art = (typeof hasIconArt === "function" && hasIconArt(t.ic)) ? iconArt(t.ic, 44) : icon(t.ic || "check", 30);
  var on = typeof amPickHas === "function" && amPickHas(t.id);
  var fid = "ctt-" + String(t.id).replace(/[^a-z0-9]/gi, "-");
  return '<li><label class="cg-t" for="'+fid+'">'+
    '<input type="checkbox" class="pk-ck cg-tc" id="'+fid+'" data-pick="'+esc(t.id)+'"'+(on ? ' checked' : '')+
      ' onchange="pickToggle(\''+esc(t.id)+'\', this)">'+
    '<span class="cg-ti" aria-hidden="true">'+art+'</span><b>'+esc(t.t)+'</b>'+
    '<i class="cg-tk"><span class="cg-tk-off">견적에 담기</span><span class="cg-tk-on">담음</span></i></label></li>';
}
window.CatTop = function(o){
  o = o || {};
  var ph = o.photo && typeof hasPhoto === "function" && hasPhoto(o.photo);
  var big = (typeof hasIconArt === "function" && hasIconArt(o.ic)) ? iconArt(o.ic, 56) : icon(o.ic || "store", 40);
  return '<section class="ctop ctop-'+esc(o.side || "start")+'"'+(o.id ? ' id="'+esc(o.id)+'"' : '')+'><div class="ctop-g'+(ph ? ' ctop-g-ph' : '')+'">'+
    (ph ? '<div class="ctop-ph" aria-hidden="true">'+photoBox(o.photo, "", true, "(max-width:900px) 100vw, 640px")+'</div>' : '')+
    '<div class="w ctop-in">'+
      '<div class="ctop-hd"><div><h1>'+esc(o.h1)+'</h1><p class="ctop-s">'+esc(o.sub || "")+'</p></div>'+
        '<span class="ctop-ia" aria-hidden="true">'+big+'</span></div>'+
      '<div class="ctop-go">'+ctBtn(o.a1, "cg-b cg-b1")+ctBtn(o.a2, "cg-b cg-b2")+'</div>'+
      (o.body || '')+
    '</div></div></section>';
};
window.ctRows = function(L){ return '<ul class="cg-l">'+L.map(ctRow).join("")+'</ul>'; };
window.ctTiles = function(L){ return '<ul class="cg-tg">'+L.map(ctTile).join("")+'</ul>'; };

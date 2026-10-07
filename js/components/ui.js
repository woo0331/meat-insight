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
window.PgHero = function(o){
  o = o || {};
  return '<section class="pgh'+(o.tight?" pgh-tight":"")+'"><div class="w">'+
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
window.IndustryGrid = function(baseTo, current){
  return '<ul class="ind-g">'+(window.AM_INDUSTRIES||[]).map(function(i){
    var on = (i.key === current);
    return '<li><a class="ind'+tn(i.tone)+(on?" on":"")+'" href="'+esc(baseTo+"/"+i.key)+'"'+
      (on?' aria-current="page"':'')+'>'+
      '<span class="ind-ic">'+icon(i.icon,24)+'</span>'+
      '<b>'+esc(i.name)+'</b>'+
      '<span class="ind-l">'+esc(i.lead)+'</span></a></li>';
  }).join("")+'</ul>';
};

/* ── 지역 고르개 ─────────────────────────────────────────────────
   ⚠️ 지역은 매칭의 첫 번째 조건입니다. 인테리어 업체를 전국에서
   찾는 사람은 없습니다 (§44). */
window.RegionSelect = function(id, val, onchange){
  return '<select class="sel" id="'+esc(id)+'"'+
    (onchange ? ' onchange="'+esc(onchange)+'"' : '')+
    ' aria-label="지역"><option value="">지역 전체</option>'+
    (window.AM_REGIONS||[]).map(function(r){
      return '<option value="'+esc(r.key)+'"'+(r.key===val?" selected":"")+'>'+
        esc(r.name)+'</option>';
    }).join("")+'</select>';
};
window.IndustrySelect = function(id, val, onchange){
  return '<select class="sel" id="'+esc(id)+'"'+
    (onchange ? ' onchange="'+esc(onchange)+'"' : '')+
    ' aria-label="업종"><option value="">업종 전체</option>'+
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
window.CatCard = function(c, industryKey){
  var items = amCatItems(c, industryKey).slice(0, 5);
  var more  = amCatItems(c, industryKey).length - items.length;
  return '<a class="cat'+tn(c.tone)+'" href="'+esc(catTo(c))+
    (industryKey ? '?i='+encodeURIComponent(industryKey) : '')+'" data-rv>'+
    '<span class="cat-ic">'+icon(c.icon,22)+'</span>'+
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
      '<p class="pv-m">'+
        esc(regs.join(" · ") || "지역 미등록")+
        (inds.length ? ' · '+esc(inds.join(" · ")) : '')+
      '</p>'+
      (subs.length ? '<p class="pv-sv">'+subs.slice(0,4).map(function(n){
          return '<span>'+esc(n)+'</span>'; }).join("")+
          (subs.length > 4 ? '<em>외 '+(subs.length-4)+'</em>' : '')+'</p>' : '')+
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

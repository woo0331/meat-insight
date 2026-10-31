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
  return '<section class="pgh'+(o.tight?" pgh-tight":"")+(ph?" pgh-im-on":"")+'">'+
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

/* ── 전에 쓰시던 "관심 업체" 기록의 열쇠 ─────────────────────────
   ⚠️⚠️ **2026-10-31 — 담는 기능은 지웠습니다** (인수인계 업체 저장).
   이 열쇠만 남겨 둔 까닭은 하나 — **앞서 쓰시던 분의 브라우저에는
   값이 그대로 남아 있습니다.** `/my` 의 "내 기록 전부 지우기" 가
   이것으로 그 값을 지웁니다. 지우면 지울 길이 없어집니다.
   ⚠️ `amSaved()` · `amIsSaved()` · `saveToggle()` 은 같이 지웠습니다 —
   꺼내 보시려면 `git show 6d85a17:js/components/ui.js`. */
window.AM_SAVE_KEY = "am.saved.v1";

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
window.FoldAll = function(id, shut, open, cls){
  cls = cls || "is-fold-all";
  return '<button class="fld-b fld-all" type="button" aria-expanded="false" '+
      'aria-controls="'+esc(id)+'" '+
      'data-shut="'+esc(shut)+'" data-open="'+esc(open || "접기")+'" '+
      'onclick="foldToggle(\''+esc(id)+'\',this,\''+esc(cls)+'\')">'+
    '<span>'+esc(shut)+'</span>'+ icon("chevd", 16) +'</button>';
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


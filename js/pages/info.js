/* ════════════════════════════════════════════════════════════════════
   지원사업 (§20 · §33) · 정보 (§45) · 소개

   ⚠️⚠️ **지원사업을 지어내지 않습니다.** 기한과 대상과 금액이 틀리면
   사장님이 기회를 놓치거나 헛걸음합니다. 원문 링크(`link`)가 없는
   항목은 `amSupports()` 가 아예 안 돌려줍니다.
   ⚠️ **"받을 수 있습니다" 라고 하지 마세요.** 심사는 우리가 하는 것이
   아닙니다 — "대상에 해당하면 신청할 수 있습니다" 까지입니다.
   ⚠️ **블로그를 만들지 마세요** (§45 · §54). 검색 수요가 있고 실제로
   그 과정에서 막히는 것만 씁니다.
   ════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════
   자주 묻는 것 (/faq)

   ⚠️⚠️ **2026-10-31 — 이 파일에서 창업 · 폐업 화면 여섯을 지웠습니다.**
   사장님 지시("인수인계 자료를 다 지워 · 중고폰 쪽은 살려두고")입니다 —
   `PageSupport`(지원사업) · `SupportWhere` · `PageContents`(글 목록) ·
   `PageContent`(글 하나) · `ContentNext` · `PageAbout`(소개)과
   `TrustBar` · `ScaleBand` · `HowBand` · `FaqBand` · `ctUrl` ·
   `ctQOf` · `ctFind` 가 거기 있었습니다.
   ⚠️ 그 주소 넷(`/support` · `/content` · `/content/:슬러그` · `/about`)은
   `vercel.json` 이 **308 로 `/` 에** 보냅니다 — 색인은 안 깨집니다.
   ⚠️ 꺼내 보시려면 `git show 6d85a17:js/pages/info.js`.
   ════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════
   자주 묻는 것 (/faq)

   ⚠️ 메인(FaqBand)과 **같은 파일**(`js/data/faq.js`)을 읽습니다.
   ⚠️ **구조화 데이터(FAQPage)는 이 화면에만 답니다.** 메인에는 여섯만
   발췌로 내는데, 발췌에 FAQPage 를 달면 화면에 없는 질문이 구조화
   데이터로 나가거나 같은 FAQ 가 두 주소로 중복됩니다.
   ════════════════════════════════════════════════════════════════════ */
/* ⚠️ 다시 그리지 않습니다 — 펼친 것이 닫히고 보던 자리를 잃습니다
   (`pickGroupToggle()` 과 같은 규칙). DOM 을 바로 고칩니다.
   ⚠️⚠️ **`aria-expanded` 를 같이 뒤집습니다** — 색과 화살표만
   바꾸면 읽어 주는 프로그램에는 늘 접힌 것으로 들립니다. */
window.faqToggle = function(btn){
  if(!btn) return;
  var p = document.getElementById(btn.getAttribute("aria-controls"));
  if(!p) return;
  var open = p.hidden;
  p.hidden = !open;
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  btn.classList.toggle("is-open", open);
};

function PageFaq(){
  var f = (window.amFaq ? amFaq() : []);
  var sel  = nowQS("c") || "";
  var nOf  = function(k){
    return f.filter(function(x){ return (x.cat || "etc") === k; }).length; };
  var cats = (window.AM_FAQ_CATS || []).filter(function(k){ return nOf(k.key) > 0; });
  if(sel && !cats.some(function(k){ return k.key === sel; })) sel = "";
  /* ⚠️ 비어도 **빈 화면으로 두지 않습니다** (절대 규칙 2). */
  if(!f.length) return PgHero({ kicker:"자주 묻는 것", h1:"자주 묻는 것", tight:true })+
    '<section class="sec"><div class="w w-narrow">'+
      Empty({
        icon:"info",
        title:"아직 정리된 문답이 없습니다",
        text:"궁금한 것을 견적 요청에 적어 주시면 답해 드리고, 자주 나오는 것은 "+
             "여기에 정리해 둡니다.",
        /* ⚠️ 2026-10-31 — 전에는 `/quote`(견적 요청) · `/about`(소개)
           이었습니다. 뒤엣것은 창업 · 폐업 소개라 지금 308 로 `/` 에
           갑니다 — 지금 실제로 열리는 곳으로 보냅니다. */
        cta:'<a class="btn btn-b" href="/sell">내 폰 팔기</a>'+
            '<a class="btn btn-o" href="/guide">이용 안내</a>'
      })+
    '</div></section>';

  return PgHero({
    crumb: Crumb([["홈","/"],["자주 묻는 것", null]]),
    kicker:"자주 묻는 것",
    h1:"먼저 궁금해하시는 것들",
    lead:"약속드릴 수 없는 것은 약속드리지 않고, 아직 없는 것은 없다고 적었습니다.",
    tight:true
  })+
  /* ── 카테고리 + 아코디언 (2026-10-20 지시서 PART 11) ───────────
     ⚠️⚠️ **질문과 답을 DOM 에서 빼지 않습니다.** 접기만 합니다 —
     이 화면은 **FAQPage 구조화 데이터**와 짝이고, 구글은 구조화
     데이터가 화면 내용과 같아야 한다고 못 박아 두었습니다. 빼면
     "화면에 없는 질문" 이 되어 리치 결과가 통째로 막힙니다
     (`check.js` 가 하나씩 맞춰 봅니다).
     ⚠️⚠️ **카테고리는 `?c=` 로 거릅니다** — 거르면 그 질문들만
     남는데, 그래도 **고르지 않은 것이 기본**이라 전부 보입니다.
     ⚠️ 비어 있는 카테고리는 칩을 아예 안 냅니다 (절대 규칙 2). */
  '<section class="sec"><div class="w w-narrow">'+
    (cats.length > 1
      ? '<ul class="chip-g chip-g-fil">'+
          '<li><a class="chip'+(sel?"":" on")+'" href="/faq">전체 '+f.length+'</a></li>'+
          cats.map(function(k){
            return '<li><a class="chip'+(sel===k.key?" on":"")+'" href="'+
              esc("/faq?c="+encodeURIComponent(k.key))+'">'+
              esc(k.name)+' '+nOf(k.key)+'</a></li>';
          }).join("")+
        '</ul>'
      : "")+
    '<ul class="faq-l">'+ f.map(function(x, i){
      var id  = "faq-a-" + i;
      var on  = !sel || (x.cat || "etc") === sel;
      /* ⚠️ 거르개로 가린 것도 **DOM 에 그대로** 둡니다 (위 주석) */
      return '<li class="faq-i"'+(on ? "" : " hidden")+'>'+
        '<button class="faq-q" type="button" aria-expanded="false"'+
          ' aria-controls="'+esc(id)+'" onclick="faqToggle(this)">'+
          '<span>'+esc(x.q)+'</span>'+
          '<span class="faq-x" aria-hidden="true">'+icon("chevd",18)+'</span>'+
        '</button>'+
        '<p class="faq-a" id="'+esc(id)+'" hidden>'+esc(x.a)+'</p>'+
      '</li>';
    }).join("")+'</ul>'+
    /* ⚠️ 막다른 길로 두지 않습니다 — 여기까지 읽으신 분께 지금
       실제로 되는 것을 냅니다. */
    '<p class="note note-mid">여기 없는 것이 궁금하시면 요청에 그대로 적어 주세요.</p>'+
    '<div class="row-cta row-mid">'+
      /* ⚠️ 2026-10-31 — 위 ⚠️ 와 같은 까닭입니다 */
      '<a class="btn btn-b btn-lg" href="/sell">내 폰 팔기'+icon("arrow",18)+'</a>'+
      '<a class="btn btn-o btn-lg" href="/guide">이용 안내</a>'+
    '</div>'+
  '</div></section>';
}

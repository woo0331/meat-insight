/* ════════════════════════════════════════════════════════════════════
   메인(`/`) — 접속하는 순간 **바로 쓰는 화면**입니다

   ⚠️⚠️ **중간 소개 화면(Intro · Splash · Gateway)을 만들지 마세요.**
   로고를 누르거나 `/` 로 오면 **언제나 이 화면**입니다. `/home` 은
   `vercel.json` 이 308 로 `/` 에 보냅니다 — 옛 주소를 눌러도 안
   깨지라고 남겨 둔 것이지 화면이 아닙니다.

   ⚠️⚠️ **2026-10-31 — 이 파일에서 인수인계(창업 · 폐업) 구간을 전부
   지웠습니다** (사장님 지시 — "그냥 인수인계 자료를 다 지워 · 중고폰
   쪽은 살려두고"). 지운 덩이 —

     MAIN_TABS · mainFind · StageCard · MainScopeStrip · MAIN_CALC
     HOME_ENTER · HOME_PASS_SV · HOME_WHY · HOME_BAN · homeHallItem
     homeHeroChecks · homeHeroCard · HomeHero · homeHeroFind
     homeDirectChips · HomeEnter · HOME_DIRECT · homeDirDesc
     HomeDirect · HomePicked · HomePass · HomeWhy · HomeQuoteCard
     HomeSteps · HomeBanners · HomeCalc · homeReads · HomeGuide
     HomeCta · HOME_SIZE · HOME_SIZE_FIRST · homeFit · homeFitOn
     homeFitUrl · homeFitRank · HomeFit · homeFitGo · HOME_REC_N
     HomeRec · homeFitSide · homeFitPy · homeFitAllTo · HOME_PREP
     homePrepList · PRK_KEY · prkGet · prkSet · homePrepToggle
     homePrepClear · homePrepPaint · HomeIndGuide · homeGuideFor

   ⚠️ 그 덩이들이 보내던 주소(`/startup` · `/operation` · `/transfer` ·
   `/closure` · `/providers/*` · `/tools/*` · `/content*`)는 전부 308 로
   `/` 에 갑니다 — 남겨 두면 **안 열리는 주소로 보내는 단추**만
   늘어납니다.
   ⚠️ 꺼내 보시려면 `git show 6d85a17:js/pages/home.js`. 그날
   `js/app.js` 의 라우터와 `vercel.json` 의 redirect 도 같이 되돌리세요.
   ⚠️⚠️ **헤더 통합검색은 이 파일을 안 씁니다** — `js/components/chrome.js`
   의 `hdSearch()` 입니다 (167개 화면 전부). 전에 여기 있던
   `mainFind()` 는 메인 전용이었고 부르는 자리가 없어졌습니다.
   ════════════════════════════════════════════════════════════════════ */

/* ⚠️⚠️ **지금 차례는 아래 return 한 줄입니다** (2026-10-30 "PC · 모바일
   전면 리뉴얼" §3 — 아홉 구간, 소식이 0건이면 여덟).

     01 .pwh    히어로 — 사진 + h1 + 단추 둘 + 신뢰 넷
     02 .pwsv   핵심 서비스 여섯
     03 .pwbr   브랜드 여섯
     04 .pwpd   지금 보실 수 있는 중고폰
     05 .pwbz   안내 배너 셋
     06 .pwnw   소식과 혜택   ⚠️ 0건이면 **구간째 빠집니다**
     07 .pwst   이용 방법 다섯 (js/data/steps.js)
     08 .pwt    거래 전 고지
     09 .pwc    마지막 CTA
     —  .hd · .ft · .mnav 는 `#view` 밖 (chrome.js)

   ⚠️⚠️ **차례를 바꾸시려면 `check.js` 의 차례 검사와 `build-pages.js`
   의 크롤러 본문을 같이 고치세요.** 화면만 고치면 크롤러에게 다른
   차례가 나가고 그게 구글에 나가는 거짓말입니다 (이 저장소가 열두
   번 겪은 자리). 그 검사는 기대 목록을 **`AM_PW_NEWS` 에서** 만듭니다 —
   아홉을 손으로 적어 두면 첫 소식을 올리는 날 멀쩡한 화면이 걸립니다.

   ⚠️⚠️ **내려온 PHONEWAY 구간 다섯은 지우지 않았습니다** — `PwWays`
   (판매 두 방법) · `PwShop`(중고폰 갈래) · `PwDevice`(기기 선택 넷) ·
   `PwBiz`(옛 사업 배너 넷) · `PwQuick`(바로가기 다섯). 되살리시려면
   이 return 한 줄이고, 그날 `check.js` · `tools/prove-checks.js` ·
   **`tools/test-flows.js`** 를 같이 뒤집으세요 (뒤엣것은 `click` 이라
   없는 요소에서 조용히 넘어가지 않고 **터지고 뒤 블록이 통째로 안
   돕니다**).
   ⚠️⚠️ **`PwBiz` 와 `PwBanners` 가 둘 다 `.pwbz-c` 를 씁니다** —
   되살리시면 한 화면에 그 클래스가 두 벌이 되어 검사가 엉뚱한 카드를
   집습니다. 그날 `PwBiz` 쪽 클래스를 갈라 두세요.

   ⚠️⚠️ **시안의 가짜 데이터를 하나도 넣지 않았습니다** (절대 규칙 1) —
   업체명 · 광고주 · 연락처 · 실적 · 후기 · 평점 · 거래 건수. 지금
   매입업체 0곳 · 재고 0건 · 광고주 0곳이고 화면이 그대로 말합니다.
   ⚠️⚠️ **"검증된 업체" 를 적지 마세요** — 검증 기능이 없습니다
   (표시 · 광고의 공정화에 관한 법률 제3조).
   ⚠️ `index.html` 의 html 태그에 `ivh` 가 있어서 **첫 그림부터** 이
   바탕이고, 하위 화면에서는 빌드가 떼어 냅니다 (`shell()`). */
function PageMain(){
  return PwHero()+ PwServices()+ PwMarket()+
         PwBanners()+ PwNews()+ PwSteps()+ PwTrust()+ PwCta();
}

function pwTick(){
  return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" '+
    'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" '+
    'stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7"/></svg>';
}
function pwArrow(){
  return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" '+
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" '+
    'stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
}

/* ─── 01 히어로 ───────────────────────────────────────────────────
   ⚠️ 사진이 아니라 **직접 그린 SVG** 입니다. 권한이 확인된 제품
   촬영본이 없고, 받아 오는 것은 이미지 지시서 §4 가 막습니다 —
   실제 촬영본을 주시면 이 자리에 그대로 들어갑니다. */
var PW_HERO_CHIPS = [
  ["bolt", "직접 매입", "폰웨이가 바로 삽니다"],
  ["bid",  "전국 업체 경쟁입찰", "여러 곳 견적 비교"],
  ["ck",   "검수 완료 중고폰", "상태를 밝히고 팝니다"]
];
var PW_CHIP_IC = {
  bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z"/>',
  bid:  '<path d="m13 4 7 7M9.5 7.5 16.5 14.5M5 21h7M8 18 3.5 13.5l9-9L17 9l-9 9Z"/>',
  ck:   '<path d="M12 3 4 6v6c0 4.5 3.2 8.3 8 9 4.8-.7 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>'
};
/* ─── 01 메인 히어로 (2026-10-29 시안 §3-B) ──────────────────────
   ⚠️⚠️ **시안의 제품 사진을 잘라서 쓰지 않았습니다** (§3-B 가 직접
   "첨부 이미지에서 제품 부분만 잘라서 사용하는 방식은 지양한다").
   권한이 확인된 고해상도 파일이 없어서, 지금은 **여기서 그린 SVG**
   입니다 — 자리(`pw-hero` · `pw-hero-m`)를 열어 두었고 파일을
   넣으시면 코드를 한 줄도 안 고치고 사진으로 바뀝니다.

   ⚠️ 손글씨 줄은 **HTML 글자**입니다. 사진 안에 합성하면 폭마다
   대비가 달라지고 읽어 주는 프로그램이 못 읽습니다. */
/* ════════════════════════════════════════════════════════════════
   01 메인 히어로 — 2026-10-30 "모바일 메인페이지 프리미엄 디자인"

   ⚠️⚠️ **제품 사진은 사장님이 주신 정식 자산입니다** (`dev-iphone`).
   §4 가 "실제 제품 촬영 느낌의 스마트폰 2대 · 자연스럽게 겹쳐진 구성"
   을 적었는데, 10-30 에 받은 투명 PNG 가 **바로 그 구도**입니다 —
   뒷면 한 대 · 앞면 한 대가 겹쳐 서고 금속 · 유리 반사가 들어 있습니다.
   ⚠️ 새 사진 자리를 만들지 않고 **같은 자리를 다시 부릅니다** —
   자리를 둘로 쪼개면 `checkPhotos()` 의 "두 자리에 같은 파일" 에
   걸리고, 바이트가 같은 파일이 하나 더 생깁니다. 히어로는 칸이
   달라서 `photoBox()` 의 **넷째 인자**로 제 `sizes` 를 넘깁니다.

   ⚠️⚠️ **시안의 배경(오렌지 가죽 상자 · 리본)을 재현하지 않았습니다.**
   그것은 에르메스의 고유한 포장이고 §12 가 "에르메스 브랜드 로고,
   상표, 고유 패턴을 폰웨이 브랜드에 직접 사용 금지" 라고 직접
   적었습니다. 대신 **같은 분위기**(웜 아이보리 빛 · 오렌지 면 ·
   밝은 석재 받침 · 부드러운 그림자)를 **전부 CSS 로** 만듭니다 —
   그림 한 장을 배경으로 까는 것도 §12 금지입니다.

   ⚠️⚠️ **평면 일러스트(`pwHeroArt`)를 더 이상 안 부릅니다** (§12).
   함수는 지우지 않았습니다 — 되살리시려면 아래 `.pwh-art` 안의
   `photoBox(...)` 를 `pwHeroArt()` 로 바꾸는 한 줄입니다.         */
/* ══════════════════════════════════════════════════════════════
   01 메인 히어로 — 2026-10-30 "PC · 모바일 전면 리뉴얼" §2-2 · §3-2

   ⚠️⚠️ **거래 건수 · 고객 만족도 · 제휴업체 수 · 전국 매장 수 띠를
   넣지 않았습니다.** 시안이 `120,000+ · 4.9/5.0 · 1,200+ · 50+` 을
   적었지만 §0-8 이 "임의의 거래 건수, 후기, 고객 만족도, 제휴업체 수,
   매장 수를 생성하지 않는다" 를 직접 금지하고, §2-2 가 "실제 수치가
   없다면 해당 영역을 제거하고 히어로 여백을 자연스럽게 재조정한다"
   고 적었습니다. 지금 전부 **0** 입니다 — 그 자리는 숫자가 아니라
   **우리가 지킬 수 있는 말 넷**(`pwHeroTrust`)이 받습니다.

   ⚠️⚠️ **슬라이더 `1/3` 표시를 안 냅니다.** 슬라이드가 하나뿐인데
   셋인 척하면 그게 §2-2 가 막은 "가짜 페이지 표시" 입니다. 배너가
   실제로 둘 이상이 되는 날 그때 붙이세요.

   ⚠️ 오렌지 리본 곡선은 **전부 CSS** 입니다 (`.pwh-rb`) — 시안을
   배경 그림으로 까는 것은 §0-5 가 금지합니다.
   ⚠️ 제품 사진은 사장님이 주신 정식 자산(`dev-iphone`)입니다.
   ⚠️⚠️ 사진 안에 글자를 합성하지 않습니다 — 시안 오른쪽의 손글씨가
   그것입니다. 폭마다 대비가 달라지고 읽어 주는 프로그램이 못 읽습니다.
   ══════════════════════════════════════════════════════════════ */
function PwHero(){
  var nm = (window.amBrand ? amBrand() : "");
  /* ⚠️⚠️ **조사를 손으로 적지 마세요.** 이름이 받침 있는 것으로
     바뀌면 "폰웨이과" 가 됩니다 — 이 저장소가 푸터의 중개자 고지에서
     "인수인계은" 으로 겪은 자리입니다. */
  var wa = (typeof josa === "function") ? josa(nm, "와과") : "와";
  return '<section class="pwh">'+
    pwHeroQuick()+
    '<div class="pwh-bg" aria-hidden="true">'+
      '<span class="pwh-rb"></span>'+
      '<span class="pwh-rb2"></span>'+
      '<span class="pwh-glow"></span>'+
    '</div>'+
    '<div class="w pwh-in">'+
      '<div class="pwh-tx">'+
        /* ⚠️ 영문 브랜드는 **장식 머리말**입니다. 손님에게 보이는
           이름은 `AM_BRAND.name` 하나이고, 여기 글자는 자간을 벌린
           라벨이라 이름을 대신하지 않습니다. */
        '<p class="pwh-k">PHONEWAY</p>'+
        /* ⚠️⚠️ 화면마다 h1 은 **딱 하나**입니다. 히어로를 내리시면
           아래 구간 머리말을 h1 으로 올려야 합니다. */
        '<h1><span class="pwh-h1a">중고폰의 새로운 기준</span>'+
          '<em><b>'+ esc(nm) + esc(wa) +'</b> 더 가깝게</em></h1>'+
        '<p class="pwh-sub">팔기부터 구매, 수리, 도매, 수출까지'+
          '<br class="br-m"> 중고폰의 모든 것을 한 곳에서</p>'+
        '<div class="pwh-go">'+
          '<a class="btn pwh-b1" href="/sell" data-to="/sell">'+
            '<b>내 폰 팔기</b>'+ pwArrow() +'</a>'+
          '<a class="btn pwh-b2" href="/shop" data-to="/shop">'+
            '<b>중고폰 구매하기</b>'+ pwArrow() +'</a>'+
        '</div>'+
        pwHeroLinks()+
      '</div>'+
      /* ⚠️⚠️ **기기 둘을 겹쳐 냅니다** (시안 §3 — 여러 제조사의
         스마트폰이 겹쳐 있는 대형 이미지). 시안은 다섯 대인데 지금
         **권한이 확인된 촬영본이 넷**이고(사장님이 주신 투명 PNG),
         그중 휴대폰은 둘입니다 — 태블릿 · 워치를 섞으면 "스마트폰이
         겹친 그림" 이 아니라 잡다한 기기 모음이 됩니다. 넉 장을 더
         받으시면 여기 한 줄씩입니다 (§13 보고 대상).
         ⚠️ 뒤에 서는 갤럭시는 **장식**이라 `aria-hidden` 이고, 폰에서는
         접습니다 (둘을 겹치면 390px 에서 한 덩어리로 뭉갭니다). */
      '<div class="pwh-art">'+
        '<span class="pwh-ph2" aria-hidden="true">'+
          photoBox("dev-galaxy", "pwh-ph", false,
            "(max-width:1199px) 24vw, 300px")+'</span>'+
        photoBox("dev-iphone", "pwh-ph", true,
          "(max-width:767px) 42vw, (max-width:1199px) 36vw, 420px")+
      '</div>'+
    '</div>'+
    pwHeroTrust()+
  '</section>';
}

/* ─── 폰에서만 — 빠른 메뉴 다섯 (2026-10-31 시안 §9) ────────────
   시안의 모바일이 검색 바로 아래에 다섯 칸을 두었습니다. PC 시안에는
   없어서 **767px 아래에서만** 보이고, 넓은 화면에서는 바로 아래
   `핵심 서비스 여섯`이 같은 일을 합니다.

   ⚠️⚠️ **새 구간을 만들지 않았습니다** — 히어로(`.pwh`) **안**입니다.
   `#view > section` 을 세는 검사가 여럿이고, 폰에서만 보이는 구간을
   하나 늘리면 넓은 화면에서 **보이지 않는 구간**이 차례에 끼어
   들어갑니다.
   ⚠️⚠️ **목록을 손으로 적지 않았습니다** — `PW_SVC6` 의 앞 다섯이
   시안의 다섯과 같습니다. 여기 또 적으면 서비스를 하나 고칠 때
   한쪽만 바뀝니다 (이 저장소가 아이콘 표로 겪은 자리). */
function pwHeroQuick(){
  var L = (window.PW_SVC6 || []).slice(0, 5);
  if(!L.length) return "";
  return '<div class="pwmq"><ul class="w pwmq-g">'+ L.map(function(q){
    return '<li><a class="pwmq-c" href="'+ esc(q.to) +'">'+
      '<i>'+ iconArt(q.ia, 34) +'</i><span>'+ esc(q.sm || q.nm) +'</span></a></li>';
  }).join("") +'</ul></div>';
}

/* ─── 히어로 아래 바로가기 셋 (2026-10-31 시안 §3) ───────────────
   시안이 단추 둘 **아래**에 얇은 줄로 셋을 적어 두었습니다 —
   내 폰 시세 확인 · 경쟁견적 받아보기 · 수리 견적 문의.

   ⚠️⚠️ **`내 폰 시세 확인` 의 이름을 바꿨습니다.** 매입 기준가가
   **0건**이라(`amBuyReady()` 가 거짓) 지금 이 사이트는 어느
   화면에서도 예상 시세 금액을 내지 않습니다 — 그 이름을 그대로
   걸면 눌러 오신 분이 **금액을 찾다가 못 찾습니다** (절대 규칙 5).
   기준가를 넣으시면 그날 이 한 줄과 사이드바 한 줄을 같이
   되돌리시면 됩니다 (§13 보고 대상).
   ⚠️ 셋 다 **실제로 열리고 실제로 무언가를 받는 화면**입니다. */
var PW_HERO_LINKS = [
  ["/sell",   "tag",   "내 폰 견적 확인"],
  ["/bid",    "gavel", "경쟁견적 받아보기"],
  ["/repair", "tool",  "수리 견적 문의"]
];
function pwHeroLinks(){
  return '<ul class="pwh-lk">'+ PW_HERO_LINKS.map(function(l){
    return '<li><a href="'+ esc(l[0]) +'" data-to="'+ esc(l[0]) +'">'+
      '<i aria-hidden="true">'+ icon(l[1], 17) +'</i>'+ esc(l[2]) +'</a></li>';
  }).join("") +'</ul>';
}

/* §5 핵심 서비스 안내 아이콘 셋 (히어로 안 · 세로 구분선)
   ⚠️⚠️ **"신뢰할 수 있는" 을 그대로 쓰지 않았습니다.** 업체를
   확인하는 절차가 아직 없고 등록된 업체가 0곳입니다 — 이 저장소가
   "검증된 업체만" 을 금지 문구로 못박아 둔 자리와 같습니다
   (표시 · 광고의 공정화에 관한 법률 제3조). §5 자신도 "실제 서비스에
   구현되지 않은 기능이나 검증되지 않은 보장은 표현하지 않는다" 고
   적었습니다. 확인 절차가 생기면 그때 한 줄 바꾸시면 됩니다.     */
/* ⚠️⚠️ **네 글자 안쪽이라야 합니다.** 글 칸이 57% 라 390px 에서 한
   칸이 **62px** 이고, 시안처럼 "신뢰할 수 있는"(7자)을 한 줄에 넣으려면
   **9px 글씨**가 됩니다 — 이 저장소는 12px 미만 금지입니다 (손님이
   40~60대). 뜻은 그대로 두고 글자 수를 줄였습니다 (찍어 보고 정했습니다). */
var PW_HERO3 = [
  ["shield", "전문업체", "연결"],
  ["coins",  "견적 비교", "한 번에"],
  ["lock",   "개인정보", "보호"]
];
function pwHero3(){
  return '<ul class="pwh-f3">'+ PW_HERO3.map(function(t){
    return '<li><i>'+ icon(t[0],26) +'</i><b>'+ esc(t[1]) +'</b>'+
      '<span>'+ esc(t[2]) +'</span></li>'; }).join("") +'</ul>';
}

/* §7 하단 서비스 장점 — 크림색 둥근 박스 · 넷 · 사이에 얇은 구분선
   ⚠️⚠️ **"빠른 매입 · 입금" 에서 "빠른" 을 뺐습니다.** 걸리는 날수를
   재 본 적이 없고 제휴업체가 0곳입니다 — 적는 순간 지킬 수 없는
   약속이 됩니다 (절대 규칙 5 · "무료 · 당일 정산 · 최고가 보장" 을
   안 쓰기로 한 자리). §7 자신이 "실제로 제공하지 않는 기능은 출시
   전까지 적절한 안내 문구로 대체합니다" 라고 적었습니다.
   ⚠️ 아이콘 모양은 시안 그대로입니다 (값표 · 번개 · 방패 · 잎) —
   바꾼 것은 **약속하는 글**뿐입니다.
   ⚠️⚠️ 넷이 서로 다른 아이콘이라야 합니다 — 전수 점검이 셉니다.  */
/* ⚠️⚠️ **글이 짧아야 합니다.** 390px 에서 네 칸이면 한 칸이 **78px**
   이고, "환경을 생각하는" 은 거기서 **세 줄**로 쪼개집니다 (찍어
   보고 알았습니다). 뜻은 그대로 두고 글자 수만 줄였습니다. */
var PW_TRUST4 = [
  ["tag",    "지금 바로",   "견적 비교"],
  ["bolt",   "수거 · 정산", "한 흐름으로"],
  ["shield", "개인정보",    "안전 처리"],
  ["seed",   "지속 가능한", "중고 거래"]
];
function pwHeroTrust(){
  return '<div class="pwh-tr"><ul class="w pwh-tr-g">'+ PW_TRUST4.map(function(t){
    return '<li><i>'+ icon(t[0],26) +'</i>'+
      '<span><b>'+ esc(t[1]) +'</b><span>'+ esc(t[2]) +'</span></span></li>';
  }).join("") +'</ul></div>';
}

/* ⚠️ 크기는 전부 CSS 가 정합니다 — 인라인 `style="max-width"` 를 쓰면
   미디어쿼리를 이겨서 **폰에서 안 줄어듭니다** (시안에서 겪었습니다:
   844px 화면을 850px 짜리 그림이 통째로 먹었습니다). */
/* 히어로 일러스트 — ⚠️⚠️ **여기서 그린 SVG 입니다.** 받아 오는 것은
   이미지 지시서 §4 가 금지하고(권한이 확인된 것만), 3D 렌더도 이미지
   생성 도구도 이 환경에 없습니다. `iconArt()` 서른여섯 장과 같은
   방식입니다 — 외부에서 받아 온 것이 한 장도 없습니다.

   ⚠️⚠️ **글자를 그려 넣지 않았습니다.** 금액 · 등급 글자를 그리면
   ① 읽어 주는 프로그램이 못 읽고 ② 지어낸 숫자가 됩니다 (절대 규칙 1).
   막대와 표시로만 그려서, 보기에는 "검수를 마친 기기와 값" 인데
   **구체적인 숫자를 주장하지 않습니다.**

   ⚠️ 전에는 폰 세 장이 겹쳐 누운 그림이었습니다 — 기기는 보이는데
   **거래**가 안 보여서, 중고폰 통합 거래 플랫폼으로 안 읽혔습니다.
   지금은 ① 가운데 기기 ② 검수 완료 카드 ③ 등급 · 배터리 칩 ④ 값
   비교 막대 넷으로, 한 장면에 **기기 · 검수 · 값**이 같이 섭니다.
   ⚠️ 390px 에서 찍어 보고 정했습니다 — 작은 요소를 더 넣으면
   그 폭에서 뭉갭니다.                                              */
function pwHeroArt(){
  return '<svg class="pwh-svg" viewBox="0 0 440 400" aria-hidden="true">'+
    '<defs>'+
      /* 기기 테두리 — 티타늄 느낌 */
      '<linearGradient id="pwa" x1=".1" y1="0" x2=".9" y2="1">'+
        '<stop offset="0" stop-color="#C9BBAE"/><stop offset=".45" stop-color="#4E5560"/>'+
        '<stop offset="1" stop-color="#2E3740"/></linearGradient>'+
      /* 화면 */
      '<linearGradient id="pwsc" x1="0" y1="0" x2=".6" y2="1">'+
        '<stop offset="0" stop-color="#1B242E"/><stop offset="1" stop-color="#0E141B"/></linearGradient>'+
      /* 뒤에 선 기기 */
      '<linearGradient id="pwhg" x1="0" y1="0" x2="1" y2="1">'+
        '<stop offset="0" stop-color="#353F4A"/><stop offset="1" stop-color="#1B242E"/></linearGradient>'+
      '<linearGradient id="pwcard" x1="0" y1="0" x2="0" y2="1">'+
        '<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#FBEFE4"/></linearGradient>'+
      '<radialGradient id="pwglow" cx=".5" cy=".5" r=".5">'+
        '<stop offset="0" stop-color="#E07A2E" stop-opacity=".55"/>'+
        '<stop offset="1" stop-color="#E07A2E" stop-opacity="0"/></radialGradient>'+
    '</defs>'+
    /* 바탕 빛 · 그림자 */
    '<circle cx="224" cy="186" r="172" fill="url(#pwglow)"/>'+
    '<ellipse cx="224" cy="358" rx="150" ry="17" fill="#080D13" opacity=".45"/>'+
    /* ① 뒤에 비껴 선 기기 — 거래라서 한 대가 아닙니다 */
    '<g transform="rotate(-11 300 200)" opacity=".92">'+
      '<rect x="258" y="86" width="132" height="226" rx="26" fill="url(#pwa)"/>'+
      '<rect x="266" y="94" width="116" height="210" rx="20" fill="url(#pwhg)"/>'+
      '<rect x="302" y="100" width="36" height="7" rx="3.5" fill="#2F3842"/>'+
      '<rect x="282" y="130" width="84" height="6" rx="3" fill="#3A444F" opacity=".8"/>'+
      '<rect x="282" y="146" width="58" height="6" rx="3" fill="#303A45" opacity=".8"/>'+
      '<rect x="282" y="176" width="84" height="46" rx="8" fill="#242E39" opacity=".75"/>'+
    '</g>'+
    /* ② 가운데 기기 — 주인공 */
    '<g>'+
      '<rect x="128" y="60" width="168" height="282" rx="30" fill="url(#pwa)"/>'+
      '<rect x="137" y="69" width="150" height="264" rx="23" fill="url(#pwsc)"/>'+
      '<rect x="188" y="76" width="48" height="9" rx="4.5" fill="#282F38"/>'+
      /* 화면 안 — 기기 카드 한 장 */
      '<rect x="152" y="100" width="120" height="58" rx="11" fill="#242E39"/>'+
      '<rect x="162" y="112" width="26" height="34" rx="5" fill="#EDC09A"/>'+
      '<rect x="196" y="116" width="62" height="7" rx="3.5" fill="#F3CDAA"/>'+
      '<rect x="196" y="130" width="40" height="6" rx="3" fill="#9A8B7E"/>'+
      /* 값 비교 막대 셋 — ⚠️ 숫자를 적지 않습니다 */
      '<rect x="152" y="176" width="120" height="7" rx="3.5" fill="#2E3A47"/>'+
      '<rect x="152" y="176" width="52" height="7" rx="3.5" fill="#F8A066"/>'+
      '<rect x="152" y="196" width="120" height="7" rx="3.5" fill="#2E3A47"/>'+
      '<rect x="152" y="196" width="86" height="7" rx="3.5" fill="#F37021"/>'+
      '<rect x="152" y="216" width="120" height="7" rx="3.5" fill="#2E3A47"/>'+
      '<rect x="152" y="216" width="68" height="7" rx="3.5" fill="#F8A066"/>'+
      /* 정산 단추 */
      '<rect x="152" y="246" width="120" height="30" rx="15" fill="#F37021"/>'+
      '<rect x="182" y="258" width="60" height="7" rx="3.5" fill="#FFE0C4"/>'+
      /* 홈 표시 */
      '<rect x="186" y="314" width="52" height="6" rx="3" fill="#313B46"/>'+
    '</g>'+
    /* ③ 검수 완료 카드 — 떠 있습니다 */
    '<g transform="translate(246 236)">'+
      '<rect x="0" y="0" width="150" height="62" rx="14" fill="url(#pwcard)"/>'+
      '<circle cx="31" cy="31" r="17" fill="#E4F6F1"/>'+
      '<path d="M23.5 31.5l5.5 5.5 10.5-11.5" fill="none" stroke="#12806C" '+
        'stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'+
      '<rect x="58" y="20" width="70" height="8" rx="4" fill="#12806C"/>'+
      '<rect x="58" y="36" width="48" height="7" rx="3.5" fill="#B9BFC7"/>'+
    '</g>'+
    /* ④ 등급 칩 — 왼쪽 위 */
    '<g transform="translate(44 108)">'+
      '<rect x="0" y="0" width="104" height="46" rx="13" fill="url(#pwcard)"/>'+
      '<circle cx="26" cy="23" r="14" fill="#18212B"/>'+
      '<path d="M26 14.5l2.9 5.9 6.5 1-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4-4.7-4.6 6.5-1z" fill="#E7B65C"/>'+
      '<rect x="50" y="15" width="40" height="7" rx="3.5" fill="#222B35"/>'+
      '<rect x="50" y="28" width="26" height="6" rx="3" fill="#B2B8C0"/>'+
    '</g>'+
    /* ⑤ 배터리 게이지 칩 — 오른쪽 위 */
    '<g transform="translate(330 48)">'+
      '<rect x="0" y="0" width="78" height="78" rx="20" fill="url(#pwcard)"/>'+
      '<circle cx="39" cy="33" r="19" fill="none" stroke="#F2E6DA" stroke-width="7"/>'+
      '<path d="M39 14a19 19 0 0 1 14.8 30.9" fill="none" stroke="#16A085" '+
        'stroke-width="7" stroke-linecap="round"/>'+
      '<rect x="22" y="60" width="34" height="7" rx="3.5" fill="#B9BFC7"/>'+
    '</g>'+
  '</svg>';
}

/* ─── 02 판매하는 두 가지 방법 ────────────────────────────────────
   ⚠️⚠️ 두 카드의 **꼬리 한 줄을 지우지 마세요.**
   ① 직접 매입은 등록하신 상태를 기준으로 한 **예상 금액**이고 검수
      뒤에 달라질 수 있습니다 — 중고폰 분쟁의 1번 원인입니다.
   ② 경쟁입찰은 **지금 참여 업체가 0곳**입니다. 없는 업체를 미리
      보여 드리지 않습니다 (절대 규칙 1).
   ⚠️ ②의 숫자는 **그 자리에서 세는 값**이라 업체를 등록하시면 저절로
      바뀝니다 — 손으로 "모집 중" 을 적어 두면 등록 뒤에도 남습니다. */
/* ⚠️⚠️ **두 방법은 `PW_WAYS` 한 곳입니다.** 전에 `PwWays()` 안에
   손으로 두 번 적어 두었는데, 그러면 `check.js` 가 번호를 **자기도
   손으로 적어** 견주게 됩니다 — 카드를 늘릴 때 한쪽만 바뀌고 그 검사가
   조용히 어긋납니다 (이 저장소가 흐름 검사 개수 · 감사 기록 갯수로
   두 번 겪은 자리).
   ⚠️ `note` 는 **함수**입니다 — 업체 수를 그릴 때마다 세기 때문에,
   등록하시면 코드를 한 줄도 안 고치고 바뀝니다. 값으로 두면 "모집 중"
   이 등록 뒤에도 남습니다. */
var PW_WAYS = [
  { no:"01", kind:"a", to:"/sell", cta:"바로 판매하기",
    ic:'<rect x="2.5" y="6" width="19" height="13" rx="2.6"/>'+
       '<path d="M2.5 10.5h19M6.5 15h3"/>',
    /* ⚠️ 영문 브랜드를 화면 이름처럼 쓰지 않습니다 — 손님에게 먼저
       보이는 이름은 하나입니다 (`amBrand()` 가 읽습니다). */
    h:function(){ return (window.amBrand ? amBrand() : "") + " 직접 매입"; },
    lead:"저희가 직접 삽니다. 한 번만 등록하시면 예상 매입가를 바로 "+
         "확인하실 수 있습니다.",
    li:["빠르고 간편한 판매","검수 기준을 미리 공개","최종 금액에 동의한 뒤 정산"],
    note:function(){
      return '⚠️ 등록 화면에 적으신 상태를 기준으로 한 <b>예상 금액</b>입니다. '+
             '기기를 받아 검수한 뒤 최종 금액을 다시 안내드리고, 동의하신 '+
             '뒤에 정산합니다.'; } },
  { no:"02", kind:"b", to:"/bid", cta:"견적 비교 신청하기",
    ic:'<path d="m13 3.5 7.5 7.5M9.5 7 17 14.5M4.5 21h8M7.5 17.5 3 13l9.5-9.5L17 8l-9.5 9.5Z"/>',
    h:function(){ return "전국 업체 경쟁입찰"; },
    lead:"전국의 인증 매입업체가 견적을 냅니다. 가격만이 아니라 거래 "+
         "조건까지 나란히 놓고 고르세요.",
    li:["여러 업체 견적 비교","검수 기준 · 정산 소요일 비교","고르는 것은 사장님입니다"],
    note:function(){
      var n = (window.AM_PROVIDERS || []).length;
      return n ? ('지금 <b>'+ n +'곳</b>이 참여하고 있습니다. 견적은 신청하신 '+
                  '기기의 조건을 보고 업체가 직접 냅니다.')
               : ('⚠️ <b>지금 입점업체를 모집하고 있습니다.</b> 참여 업체가 '+
                  '생기면 이 자리에 실제 견적이 나란히 섭니다 — 없는 업체를 '+
                  '미리 보여 드리지 않습니다.'); } }
];
function PwWays(){
  return '<section class="pww"><div class="w">'+
    '<div class="pw-hd">'+
      '<span class="pw-ey">HOW TO SELL</span>'+
      '<h2>휴대폰을 판매하는 두 가지 방법</h2>'+
      '<p>원하는 방식으로 더 높은 가치를 받아보세요.</p>'+
    '</div>'+
    '<div class="pww-g">'+ PW_WAYS.map(pwWayCard).join("") +'</div>'+
  '</div></section>';
}
function pwWayCard(o){
  return '<article class="pww-c'+ (o.kind==="b" ? " b" : "") +'">'+
    '<span class="pww-no">'+ esc(o.no) +'</span>'+
    '<div class="pww-ic"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" '+
      'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '+
      'stroke-linejoin="round" aria-hidden="true">'+ o.ic +'</svg></div>'+
    '<h3>'+ esc(typeof o.h === "function" ? o.h() : o.h) +'</h3>'+
    '<p class="pww-l">'+ esc(o.lead) +'</p>'+
    '<ul>'+ o.li.map(function(t){
      return '<li>'+ pwTick() + esc(t) +'</li>'; }).join("") +'</ul>'+
    '<a class="btn '+ (o.kind==="b" ? "btn-pw-o" : "btn-pw") +'" href="'+ esc(o.to) +'">'+
      esc(o.cta) +'</a>'+
    '<p class="pww-n">'+ (typeof o.note === "function" ? o.note() : o.note) +'</p>'+
  '</article>';
}

/* ─── 03 인증 중고폰 ──────────────────────────────────────────────
   ⚠️⚠️ **상품이 0건이면 카드를 안 냅니다.** 지어낸 상품은 허위입니다 —
   한 대라도 올라오면 코드를 한 줄도 안 고치고 카드가 섭니다. */
var PW_KINDS = [
  ["/shop?m=iphone",  "아이폰",   "iPhone",
   '<rect x="6" y="2.5" width="12" height="19" rx="2.8"/><path d="M10.5 5.5h3"/>'],
  ["/shop?m=galaxy",  "갤럭시",   "Galaxy",
   '<rect x="5.5" y="2.5" width="13" height="19" rx="3"/><path d="M12 18.5h.01"/>'],
  ["/shop?m=tablet",  "태블릿",   "iPad · Tab",
   '<rect x="3" y="4" width="18" height="16" rx="2.6"/><path d="M12 16.5h.01"/>'],
  ["/shop?m=etc",     "기타 기기", "워치 · 버즈",
   '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/>']
];
function PwShop(){
  var P = window.AM_PRODUCTS || [];
  return '<section class="pws"><div class="w">'+
    '<div class="pw-hd-l">'+
      '<div><h2>검증된 중고폰을, 믿고 구매하세요</h2>'+
        '<p>폰웨이가 직접 매입하고 검수한 기기만 판매합니다.</p></div>'+
      '<a class="pw-more" href="/shop">전체 보기 '+ pwArrow() +'</a>'+
    '</div>'+
    '<ul class="pws-g">'+ PW_KINDS.map(function(k){
      return '<li><a class="pws-c" href="'+ esc(k[0]) +'">'+
        '<i><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
          'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
          k[3] +'</svg></i>'+
        '<b>'+ esc(k[1]) +'</b><span>'+ esc(k[2]) +'</span></a></li>';
    }).join("") +'</ul>'+
    (P.length ? "" :
      '<div class="pws-e">'+
        '<b>지금 판매 중인 상품이 0건입니다.</b>'+
        '<p>검수를 마친 기기부터 이 자리에 올라옵니다. 한 대라도 올라오면 사진 · 등급 · '+
          '배터리 상태 · 검수 결과가 그대로 보입니다.<br>'+
          '⚠️ 없는 상품을 미리 만들어 두지 않습니다.</p>'+
      '</div>')+
  '</div></section>';
}

/* ─── 02 기기 선택 (2026-10-29 시안 §3-D) ────────────────────────
   ⚠️⚠️ **`/sell` 의 카드 넷과 같은 데이터입니다** (`PW_SELL_CARDS`).
   여기서 따로 적으면 기기를 하나 늘릴 때 한쪽만 바뀝니다 — 이
   저장소가 `amCatTo`/`catTo` · 랜딩 아이콘 · 도구 아이콘 표로 세 번
   겪은 자리입니다. 다른 것은 **링크냐 단추냐** 하나뿐입니다 (여기는
   메인이라 `/sell` 로 보내고, 거기서는 그 자리에서 고릅니다).

   ⚠️⚠️ **제조사 로고를 그리지 않았습니다.** 애플 마크 · 삼성
   워드마크는 남의 등록상표이고 사장님이 "AI 가 임의로 재현한
   부정확한 로고는 쓰지 말 것" 이라고 직접 적으셨습니다 — 권한을
   확인한 SVG 가 생기면 `AM_MAKER_LOGO` 에 주소 한 줄입니다. */
function pwDevLink(c){
  /* ⚠️⚠️ **`/sell` 이 읽는 열쇠는 `mk` · `kd` · `mo` 입니다** (phone.js 의
     `pwSellState()`). 여기서 `maker` · `kind` · `more` 로 보내고 있어서,
     카드를 누르면 `/sell` 이 열리기는 하는데 **아무것도 안 고른 채**였습니다
     (2026-10-30 눌러 보고 알았습니다 — 링크 검사는 주소가 열리는지만 봅니다). */
  var qs = c.more ? "?mo=1"
         : "?mk="+ encodeURIComponent(c.maker) +"&kd="+ encodeURIComponent(c.kind);
  return '<li><a class="dvc dvc-a" href="/sell'+ qs +'">'+
    '<span class="dvc-ph">'+
      (typeof hasPhoto === "function" && hasPhoto(c.ph)
        ? photoBox(c.ph, "dvc-im")
        : iconArt(c.ia, 96))+
    '</span>'+
    '<span class="dvc-tx">'+
      pwDevLogos(c)+
      '<b class="dvc-nm">'+ esc(c.nm) +'</b>'+
      '<span class="dvc-s">'+ esc(c.sub) +'</span>'+
    '</span>'+
    '<span class="dvc-go" aria-hidden="true">'+ pwArrow() +'</span>'+
  '</a></li>';
}
function PwDevice(){
  var C = window.PW_SELL_CARDS || [];
  if(!C.length) return "";
  return '<section class="pwd"><div class="w pwd-in">'+
    '<div class="pwd-hd">'+
      '<span class="pw-ey">SELL YOUR DEVICE</span>'+
      '<h2>어떤 기기를 판매하시나요?</h2>'+
      '<p>판매할 기기 종류를 선택해 주세요.</p>'+
    '</div>'+
    '<ul class="pwd-g">'+ C.map(pwDevLink).join("") +'</ul>'+
  '</div></section>';
}

/* ─── 03 주요 사업 배너 넷 (시안 §3-E) ───────────────────────────
   ⚠️⚠️ **넷 다 실제로 열리는 화면입니다** (§7 — "존재하지 않는
   페이지로 이동하거나 작동하지 않는 버튼을 만들지 않는다").
   ⚠️⚠️ **기업 · 수출은 거래 절차가 아직 없습니다** — §3-E 가 적은
   대로 **문의 접수형**이고, 카드에 그 준비 상태를 그대로 적습니다
   (절대 규칙 5). 지어낸 거래량 · 수출국 · 실적을 쓰지 않습니다. */
var PW_BIZ = [
  { k:"1", nm:"지금 바로<br>내 폰 팔기", to:"/sell", cta:"내 폰 팔기",
    d:"복잡한 절차 없이, 간편하게 최고가 견적을 받아보세요.", ph:"biz-sell", ia:"mobile" },
  { k:"2", nm:"믿을 수 있는<br>중고폰 구매", to:"/shop", cta:"중고폰 보기",
    d:"검수를 마친 중고폰을 합리적인 가격에 만나보세요.", ph:"biz-shop", ia:"bag" },
  { k:"3", nm:"업체 경쟁입찰", to:"/bid", cta:"경쟁입찰 알아보기",
    d:"여러 업체의 견적을 한번에 비교하고 가장 높은 값에 판매하세요.",
    ph:"biz-bid", ia:"chart" },
  { k:"4", nm:"기업 · 수출 거래", to:"/biz", cta:"거래 문의하기",
    d:"대량 매입과 해외 수출을 상담으로 진행합니다.",
    note:"지금은 문의를 받는 단계입니다", ph:"biz-export", ia:"handover" }
];
function PwBiz(){
  return '<section class="pwbz"><div class="w">'+
    '<ul class="pwbz-g">'+ PW_BIZ.map(function(b){
      return '<li><a class="pwbz-c pwbz-v'+ b.k +'" href="'+ esc(b.to) +'">'+
        '<span class="pwbz-tx">'+
          '<b class="pwbz-nm">'+ b.nm +'</b>'+
          '<span class="pwbz-d">'+ esc(b.d) +'</span>'+
          (b.note ? '<span class="pwbz-note">'+ esc(b.note) +'</span>' : '')+
          '<span class="pwbz-go">'+ esc(b.cta) +' '+ pwArrow() +'</span>'+
        '</span>'+
        '<span class="pwbz-ph">'+
          (typeof hasPhoto === "function" && hasPhoto(b.ph)
            ? photoBox(b.ph, "pwbz-im")
            : '<span class="pwbz-ic">'+ iconArt(b.ia, 76) +'</span>')+
        '</span>'+
      '</a></li>';
    }).join("") +'</ul>'+
  '</div></section>';
}

/* ─── 04 주요 서비스 바로가기 다섯 (시안 §3-F) ──────────────────
   ⚠️ 다섯 전부 **지금 열리는 화면**입니다.
   ⚠️⚠️ 시안은 다섯째를 `고객센터` 라고 적었는데 **그 이름을 쓰지
   않습니다** (2026-10-30 사장님이 정하셨습니다). 전화도 채팅도 없고
   사업자 전화번호 칸조차 비어 있어서, 그 이름으로 오신 분이 번호를
   찾다가 못 찾습니다 — 가는 곳도 거기 있는 것도 자주 묻는 질문입니다. */
var PW_QUICK = [
  ["/sell",  "mobile",   "내 폰 팔기",     "간편 신청"],
  ["/shop",  "bag",      "중고폰 구매",    "검수된 제품"],
  ["/bid",   "chart",    "경쟁입찰",       "최고가 견적"],
  ["/biz",   "handover", "수출 · 기업거래", "대량 거래"],
  ["/faq",   "chat",     "도움말",         "자주 묻는 질문"]
];
function PwQuick(){
  return '<section class="pwq"><div class="w">'+
    '<div class="pw-hd-l"><div><h2>주요 서비스 바로가기</h2></div>'+
      '<a class="pw-more" href="/guide">이용 안내 '+ pwArrow() +'</a></div>'+
    '<ul class="pwq-g">'+ PW_QUICK.map(function(q){
      return '<li><a class="pwq-c" href="'+ esc(q[0]) +'">'+
        '<i>'+ (typeof iconArt === "function" && hasIconArt(q[1])
                 ? iconArt(q[1], 44)
                 : icon(q[1], 26)) +'</i>'+
        '<b>'+ esc(q[2]) +'</b><span>'+ esc(q[3]) +'</span></a></li>';
    }).join("") +'</ul>'+
  '</div></section>';
}

/* ─── 04 이용 방법 다섯 ───────────────────────────────────────────
   ⚠️ ⑤ 의 "동의하신 뒤에 보냅니다" 를 지우지 마세요 — 검수 뒤 금액이
   달라질 수 있다는 것을 거래 전에 밝히는 자리입니다. */
/* ⚠️⚠️ **걸음 다섯은 `js/data/steps.js` 한 곳입니다.** 전에 여기
   `var PW_STEPS` 로 적어 두었는데, `build-pages.js` 는 `js/pages/*` 를
   **읽지 않습니다** — 크롤러 본문에서 그 값이 `undefined` 라 구간이
   에러 없이 조용히 빠집니다. `/guide` 의 판매 절차도 같은 값을
   읽습니다 (한 곳을 고치면 셋이 같이 따라옵니다). */
function PwSteps(){
  return '<section class="pwst"><div class="w">'+
    '<div class="pw-hd"><span class="pw-ey">HOW IT WORKS</span>'+
      '<h2>'+ esc(window.amBrand ? amBrand() : "") +' 이용 방법</h2>'+
      '<p>등록부터 정산까지 다섯 걸음입니다.</p></div>'+
    '<ol class="pwst-g">'+ (window.AM_STEPS||[]).map(function(s,i){
      return '<li class="pwst-c"><span class="pwst-n">'+ (i+1) +'</span>'+
        '<i><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
          'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
          (s.art||'') +'</svg></i>'+
        '<b>'+ esc(s.n) +'</b><p>'+ esc(s.d) +'</p></li>';
    }).join("") +'</ol>'+
  '</div></section>';
}

/* ─── 05 거래 전 고지 ─────────────────────────────────────────────
   ⚠️⚠️ **맨 아래 한 줄을 지우지 마세요.** "무료 · 당일 정산 · 최고가
   보장" 을 안 적는 것이 이 플랫폼의 규칙이고, 지시서 §5 도 직접
   금지했습니다 (절대 규칙 5). */
var PW_TRUST = [
  ["검수 기준을 먼저 공개",
   "외관 · 액정 · 배터리 · 기능을 어떤 기준으로 보는지 등록 전에 읽으실 수 있습니다.",
   '<path d="M9 3.5h6l1 3.5h3.5v13H4.5v-13H8l1-3.5Z"/><path d="m9.5 13 2 2 3.5-4"/>'],
  ["개인정보 삭제 안내",
   "보내시기 전에 해 두셔야 할 것과, 저희가 받은 뒤 처리하는 절차를 그대로 적습니다.",
   '<rect x="5" y="10.5" width="14" height="10" rx="2.4"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>'],
  ["진행 상황 확인",
   "접수 · 수거 · 검수 · 정산이 지금 어디까지 왔는지 화면에서 보입니다.",
   '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.2 2"/>'],
  /* ⚠️⚠️ 전에 "처리 절차를 고객센터에 적어 둡니다" 였습니다 — **둘 다
     거짓이었습니다.** 고객센터라는 창구가 없고(전화번호 칸조차 비어
     있습니다), 반송 조건을 적어 둔 화면도 없습니다 (FAQ · 약관 ·
     이용안내를 훑어 0건). 없는 곳을 가리키면 거기를 찾아다니십니다.
     ⚠️ 반송 조건을 실제로 적은 화면이 생기면 그때 이 줄에서 그리로
     보내세요 — 그 전까지는 "알려 드립니다" 까지입니다 (절대 규칙 5). */
  ["분쟁이 생기면",
   "검수 결과에 동의하지 않으시면 반송받으실 수 있습니다. 반송 조건은 보내시기 전에 알려 드립니다.",
   '<path d="M12 3.5 4.5 7v5.5c0 4.3 3.1 7.9 7.5 8.5 4.4-.6 7.5-4.2 7.5-8.5V7L12 3.5Z"/><path d="M12 9v4M12 16h.01"/>']
];
function PwTrust(){
  return '<section class="pwt"><div class="w">'+
    '<div class="pw-hd"><span class="pw-ey">TRUST</span>'+
      '<h2>거래하기 전에 밝혀 둡니다</h2>'+
      '<p>지킬 수 있는 것만 적었습니다.</p></div>'+
    '<ul class="pwt-g">'+ PW_TRUST.map(function(t){
      return '<li class="pwt-c">'+
        '<i><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" '+
          'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+
          t[2] +'</svg></i>'+
        '<b>'+ esc(t[0]) +'</b><p>'+ esc(t[1]) +'</p></li>';
    }).join("") +'</ul>'+
    '<p class="pwt-n">⚠️ <b>이 화면에 "무료" · "당일 정산" · "최고가 보장" 을 적지 '+
      '않았습니다.</b> 지킬 수 있는 것만 적는 것이 이 플랫폼의 규칙입니다 — 검수 뒤 '+
      '금액이 바뀔 수 있다는 것, 정산까지 걸리는 시간, 반송 조건을 거래 전에 먼저 '+
      '보여 드립니다.</p>'+
  '</div></section>';
}

/* ─── 06 하단 CTA ────────────────────────────────────────────────── */
function PwCta(){
  return '<section class="pwc"><div class="w pwc-in">'+
    '<div><h2>지금 내 폰은 얼마일까요?</h2>'+
      '<p>기종과 상태만 고르면 예상 금액을 바로 보실 수 있습니다.</p></div>'+
    '<div class="pwc-go">'+
      '<a class="btn btn-pw-w" href="/sell">내 폰 팔기</a>'+
      '<a class="btn btn-pw-gh" href="/guide">이용 안내 보기</a>'+
    '</div>'+
  '</div></section>';
}


/* ══════════════════════════════════════════════════════════════════
   2026-10-30 "메인페이지 PC · 모바일 전면 리뉴얼 최종 작업지시서"
   §2 · §3 — 시안의 차례 그대로

     01 히어로              .pwh    사진 + h1 + 단추 둘
     02 핵심 서비스 여섯      .pwsv   §2-3
     03 브랜드 여섯          .pwbr   §2-4  ⚠️ 정확히 여섯만
     04 지금 보실 수 있는 중고폰 .pwpd  §2-5  필터 + 카드
     05 안내 배너 셋          .pwbz   §2-6  딥 브라운
     06 소식과 혜택          .pwnw   §2-7  ⚠️ 게시물 0건이면 구간째 빠집니다
     07 이용 방법 다섯        .pwst   (보존 · §0-3)
     08 거래 전 고지          .pwt    (보존 · 전자상거래법 제20조 제1항)
     09 마지막 CTA           .pwc    (보존)

   ⚠️⚠️ **내려온 둘을 지우지 않았습니다** (§0-3) —
     · PwDevice()  기기 선택 넷 → `/sell` **첫 화면이 그대로 그
       카드**입니다 (`pwDevCard()` 를 같이 씁니다). 사장님이 주신
       제품 사진 넉 장도 거기서 그대로 보입니다.
     · PwQuick()   바로가기 다섯 → 02 핵심 서비스 **여섯**이 받습니다
       (다섯이 가리키던 주소가 전부 그 여섯 안에 있습니다).
   되살리시려면 `PageMain()` 한 줄입니다.
   ══════════════════════════════════════════════════════════════════ */

/* ─── 02 핵심 서비스 여섯 (§2-3) ─────────────────────────────────
   ⚠️⚠️ **여섯 전부 지금 열리고 지금 무언가를 받는 화면**입니다.
   §0-6 "모든 버튼과 카드는 실제 사이트의 해당 기능에 연결한다" ·
   §0-7 "기능이 미구현된 메뉴는 가짜 화면으로 연결하지 않는다".
   ⚠️ 아이콘은 여섯이 서로 달라야 합니다 — 전수 점검이 셉니다.    */
/* ⚠️ 위 목록은 js/data/shop.js 로 옮겨 놓았습니다 — 크롤러 본문이
   js/data 만 읽어서, 여기 두면 그 구간이 **에러 없이 조용히** 빠졌습니다. */
function PwServices(){
  return '<section class="pwsv"><div class="w">'+
    /* ⚠️⚠️ **머리말을 빼지 마세요.** 없으면 제목 차례가 h1 → h2
       에서 한 칸 비고, 크롤러 본문에도 이 구간이 제 이름으로
       안 나갑니다 — 읽어 주는 프로그램을 쓰는 분은 제목으로 화면의
       뼈대를 잡습니다 (재서 알았습니다). */
    '<div class="pw-hd"><h2>무엇을 도와드릴까요?</h2>'+
      '<p>중고폰을 팔고 · 사고 · 고치고 · 도매로 넘기는 길을 한곳에 모았습니다.</p></div>'+
    '<ul class="pwsv-g">'+ window.PW_SVC6.map(function(s){
      /* ⚠️ 카드 **전체**가 하나의 a 입니다. 오른쪽 아래 원형 화살표는
         **표시**이지 따로 누르는 단추가 아닙니다 — a 안에 a 를
         넣으면 브라우저가 쪼갭니다. */
      /* ⚠️⚠️ 2026-10-31 §3 — 사진이 있으면 사진, 없으면 컬러 아이콘입니다.
         빈 액자를 깔지 않습니다 (절대 규칙 2). 사진 자리 이름은
         `ph` 한 줄이고 규격은 `WOW_PHOTO_SLOTS` 가 들고 있습니다. */
      var ph = s.ph && typeof hasPhoto === "function" && hasPhoto(s.ph);
      return '<li><a class="pwsv-c'+ (ph ? " has-ph" : "") +'" href="'+ esc(s.to) +'">'+
        '<i class="pwsv-i">'+ (ph ? photoBox(s.ph, "pwsv-ph") : iconArt(s.ia, 88)) +'</i>'+
        '<b>'+ esc(s.nm) +'</b>'+
        '<span class="pwsv-d">'+ [].concat(s.d).map(esc).join("<br>") +'</span>'+
        '<span class="pwsv-go" aria-hidden="true">'+ pwArrow() +'</span>'+
      '</a></li>';
    }).join("") +'</ul>'+
  '</div></section>';
}

/* ─── 03 브랜드 여섯 (§2-4) ──────────────────────────────────────
   ⚠️⚠️ **정확히 여섯입니다** — 목록은 `js/data/shop.js` 의
   `AM_SHOP_BRANDS` 한 곳이고, 거기 머리말에 "왜 제조사 DB 를 안
   건드렸는지" 와 "로고가 둘뿐인 까닭" 을 적어 두었습니다.

   ⚠️⚠️ **로고가 없으면 로고 칸 자체를 안 그립니다** (빈 액자 금지 ·
   절대 규칙 2). 영문 이름이 그 자리를 지킵니다 — §2-4 도 "영문
   이름으로 구성한다" 고 적었습니다.
   ⚠️ 가진 로고 둘은 **흰 글자 · 투명 바탕**이라(어두운 카드용) 흰
   카드에 그대로 얹으면 **안 보입니다.** CSS 한 줄로 검은 쪽을
   냅니다 — 단색 실루엣의 흑백 판이고, 다시 그린 것이 아닙니다.

   ⚠️⚠️ **가짜 상품을 만들지 않습니다.** 취급 모델이 0종인 브랜드는
   눌러 가신 `/shop` 이 0건이라고 사실대로 말합니다 (§2-4). 그래서
   건수를 **세어서** 카드에 같이 냅니다 — 0 이면 0 이라고 적습니다. */
function PwBrands(){
  var B = window.AM_SHOP_BRANDS || [], LG = window.AM_MAKER_LOGO || {};
  if(!B.length) return "";
  return '<div class="pwbr">'+
    '<div class="pw-hd-l"><div><h2>다양한 브랜드의 기기를 만나보세요</h2></div>'+
      '<a class="pw-more" href="/shop">전체 보기 '+ pwArrow() +'</a></div>'+
    '<ul class="pwbr-g">'+ B.map(function(b){
      /* ⚠️ 둘째 인자 true — **예시를 뺀 실제 재고**만 셉니다 */
      var n = (typeof amShopBrandN === "function") ? amShopBrandN(b.key, true) : 0;
      return '<li><a class="pwbr-c" href="/shop?m='+ esc(b.key) +'">'+
        (LG[b.key]
          ? '<span class="pwbr-lg"><img src="'+ esc(LG[b.key]) +'" alt="" '+
            'width="92" height="26" loading="lazy" decoding="async"></span>'
          : '')+
        '<b>'+ esc(b.en) +'</b>'+
        /* ⚠️⚠️ **"준비 중" 을 적지 마세요.** 0 일 때 그 말을 넣었다가
           전수 점검의 "준비 중 자리표시자" 에 걸렸습니다 — 이 저장소가
           프랜차이즈 분류 열두 칸에서 겪은 그 자리입니다. 낼 것은
           **세는 값**이고, 0 이면 0 이라고 적습니다 (절대 규칙 1 ·
           2 — 0 을 숨기지 않고 자리표시자도 안 찍습니다). 기기가
           올라오면 코드를 한 줄도 안 고치고 숫자가 됩니다. */
        '<span class="pwbr-n">'+ n +'대</span>'+
      '</a></li>';
    }).join("") +'</ul>'+
    /* ⚠️ 그 숫자가 **무엇을 센 값인지** 그 자리에서 밝힙니다 — 안
       밝히면 "곧 생기나 보다" 로 읽히고, 그건 약속입니다 (절대 규칙 5).
       ⚠️⚠️ 시안에는 이 줄이 없습니다. **빼지 않았습니다** — 빼면
       브랜드 로고 여섯이 "여섯 브랜드의 기기가 있습니다" 로 읽히고,
       지금 실제 재고는 0건입니다 (§11 · 절대 규칙 1). 재고가 올라오면
       숫자가 저절로 바뀌고 이 줄은 그대로 맞는 말로 남습니다. */
    '<p class="pwbr-n0">⚠️ 대수는 <b>지금 올라와 있는 기기를 센 값</b>입니다. '+
      '0대는 아직 올라온 기기가 없다는 뜻이고, '+
      '없는 기기를 미리 보여 드리지 않습니다.</p>'+
  '</div>';
}

/* ─── 04 지금 보실 수 있는 중고폰 (§2-5) ────────────────────────
   ⚠️⚠️ **"지금 인기 있는" 이라고 쓰지 않습니다.** 조회 · 클릭 · 구매를
   하나도 모으지 않아서 **무엇이 인기인지 우리는 모릅니다** — 시안이
   그 이름을 적었지만, 적는 순간 없는 데이터를 있는 것처럼 말하는
   것이고 이 저장소가 "지금 많이 찾는 서비스" · "인기 검색어" 로
   못박아 둔 자리입니다 (§0-8 · 절대 규칙 5). 차례는 **등록된 차례**
   이고 화면이 그렇게 적습니다.

   ⚠️⚠️ **인기 · 추천 딱지를 붙이지 않습니다.** 시안의 빨간 `인기` ·
   `추천` 배지가 그것입니다.

   ⚠️ 거르개는 **브랜드**입니다. 고른 것은 주소(`?b=`)에 실리고,
   ⚠️⚠️ **맨 위로 튀지 않습니다** — `data-keep` 이 그 표시입니다
   (`js/app.js` 의 click 가로채기가 봅니다). 목록을 좁히는 것인데
   맨 위로 올라가면 방금 보던 자리를 잃습니다.                     */
var PW_PD_N = 5;   /* ⚠️ PC 한 줄에 다섯 (§2-5). 두 곳에 적지 마세요 */
function PwProducts(){
  var B  = window.AM_SHOP_BRANDS || [];
  var pick = nowQS("b");
  /* ⚠️⚠️ **예시를 안 섞습니다** (§2-5 "실제 재고 데이터 기준" ·
     §0-8). /shop 은 딱지와 함께 예시를 내는 자리지만, 메인은
     손님이 제일 먼저 보는 화면이라 거기 지어낸 값이 서면
     그때부터 없는 재고를 광고하는 것입니다 (절대 규칙 1). */
  var all = (typeof amShopList === "function") ? amShopList({ real:true }) : [];
  var L   = pick ? all.filter(function(p){
      var md = (typeof amModel === "function") ? amModel(p.model) : null;
      return md && md.maker === pick;
    }) : all;

  var chips = '<a class="chip'+ (pick ? "" : " on") +'" href="/" data-keep>전체</a>'+
    B.map(function(b){
      return '<a class="chip'+ (pick === b.key ? " on" : "") +'" '+
        'href="/?b='+ esc(b.key) +'" data-keep>'+ esc(b.name) +'</a>';
    }).join("");

  var body;
  if(!L.length){
    /* ⚠️ 0건이면 **0건이라고 말하고** 지금 되는 것을 같이 냅니다
       (막다른 길로 두지 않습니다 · 절대 규칙 2). */
    body = '<div class="pwpd-0"><b>'+
      (pick ? '아직 이 브랜드의 기기가 없습니다.' : '아직 올라온 기기가 없습니다.')+
      '</b><p>검수를 마친 기기부터 이 자리에 올라옵니다. '+
      '먼저 파실 기기가 있으시면 견적부터 받아 보세요.</p>'+
      '<div class="row-cta"><a class="btn btn-pw" href="/sell">내 폰 팔기</a>'+
      '<a class="btn btn-pw-o" href="/shop">중고폰 전체 보기</a></div></div>';
  } else {
    body = '<ul class="pwpd-g">'+ L.slice(0, PW_PD_N).map(pwPdCard).join("") +'</ul>';
  }

  return '<div class="pwpd">'+
    '<div class="pw-hd-l"><div><h2>지금 보실 수 있는 중고폰</h2>'+
      '<p>등록된 차례로 냅니다 — 조회수나 판매량 같은 이용 통계가 아닙니다.</p></div>'+
      '<a class="pw-more" href="/shop">전체 보기 '+ pwArrow() +'</a></div>'+
    '<div class="chip-g chip-g-fil pwpd-fil">'+ chips +'</div>'+
    body+
  '</div>';
}

/* 상품 카드 한 장 — ⚠️ `/shop` 과 **같은 규칙**이라야 합니다.
   ⚠️⚠️ **사진이 없으면 다른 기종 사진으로 때우지 않습니다** (§4 —
   "없는 사진을 다른 기종의 사진으로 대체하여 실제 판매 상품처럼
   표시하지 않는다"). 그 자리는 기기 종류 아이콘이 지킵니다. */
function pwPdCard(p){
  var md  = (typeof amModel === "function") ? amModel(p.model) : null;
  var smp = String(p.id || "").indexOf("sample-") === 0;
  var ph  = (p.images && p.images[0]) || "";
  /* ⚠️⚠️ **하트는 `a` 밖입니다** — `a` 안의 `button` 은 브라우저가
     쪼갭니다. CSS 로 카드 오른쪽 위에 겹칩니다 (`js/fav.js`). */
  return '<li class="pwpd-li">'+
    (typeof FavBtn === "function" ? FavBtn(p.id) : "")+
    '<a class="pwpd-c" href="/d/'+ esc(p.id) +'">'+
    '<span class="pwpd-ph">'+
      (ph ? '<img class="ph" src="'+ esc(ph) +'" alt="" loading="lazy" decoding="async">'
          /* ⚠️⚠️ `shopIcon()` 은 **이름을** 돌려줍니다 (HTML 이 아닙니다) —
             그대로 찍었더니 카드에 **`dev-iphone` 이 글자로** 나왔습니다
             (포트폴리오가 `gyeonggi` 를 그대로 찍은 그 자리). 찍어 보고 알았습니다. */
          : iconArt((typeof shopIcon === "function" ? shopIcon(md) : "mobile"), 58))+
      (smp ? '<span class="pwpd-smp-b">예시</span>' : '')+
    '</span>'+
    '<b class="pwpd-nm">'+ esc(md ? md.name : p.model) +'</b>'+
    '<span class="pwpd-sp">'+
      esc([(p.cap ? (p.cap >= 1024 ? (p.cap/1024)+"TB" : p.cap+"GB") : ""),
           p.color || ""].filter(Boolean).join(" · "))+'</span>'+
    '<span class="pwpd-pr">'+ esc(Number(p.price||0).toLocaleString()) +'원</span>'+
    '<span class="pwpd-bd">'+
      '<i>'+ esc(p.grade) +'등급</i>'+
      (p.batt ? '<i>배터리 '+ esc(p.batt) +'%</i>' : '')+
    '</span>'+
  '</a></li>';
}


/* ─── 03+04 브랜드 · 중고폰 · 오른쪽 사이드바 (2026-10-31 시안 §7) ──
   시안이 브랜드 줄과 상품 줄 **오른쪽에 세로 사이드바**를 두었습니다 —
   내 폰 시세 폼 · 수리 서비스 배너 · 매장 찾기 배너.

   ⚠️⚠️ **브랜드와 상품을 한 구간으로 합쳤습니다.** 사이드바가 두
   줄에 걸쳐 서려면 둘이 **같은 칸** 안에 있어야 합니다. `#view >
   section` 을 세는 검사가 여럿이라 `.pwbr` · `.pwpd` 를 구간에서
   내리고 `.pwmk` 하나로 묶었습니다 — **규칙은 한 줄도 안
   바꿨습니다**(차례 · h1 · 지어낸 수). `check.js` 의 `order` 가
   재는 자리만 같이 옮겼습니다.
   ⚠️ `.pwbr-g` · `.pwpd-g` · `.pwpd-fil` · `.pwpd-0` 은 그대로입니다 —
   검사가 그 이름으로 셉니다.
   ⚠️ 1100px 아래에서는 사이드바가 **상품 아래로** 내려갑니다
   (시안의 모바일에 사이드바가 없고, 좁은 폭에서 옆에 두면 상품 칸이
   180px 이 됩니다 — 재 보고 정했습니다). */
function PwMarket(){
  return '<section class="pwmk"><div class="w pwmk-in">'+
    '<div class="pwmk-main">'+ PwBrands() + PwProducts() +'</div>'+
    PwSide()+
  '</div></section>';
}

/* ─── 오른쪽 사이드바 ────────────────────────────────────────────
   ⚠️⚠️ **머리말이 시안과 다릅니다** — 시안은 "내 폰 시세 바로
   확인하기 / 예상 시세 확인" 인데, 매입 기준가가 **0건**이라
   (`amBuyReady()`) 이 사이트는 어느 화면에서도 예상 금액을 내지
   않습니다. 그 글을 그대로 걸면 다 고르고 누르셨을 때 **금액이
   없습니다** — §11 이 금지한 허위 기능이고 절대 규칙 5 입니다.
   하는 일(기기를 골라 신청으로 잇기)과 칸 넷은 시안 그대로이고,
   **약속하는 글만** 사실에 맞췄습니다. 기준가를 넣으시면 그날
   머리말 · 단추 두 줄을 시안 글로 되돌리시면 됩니다.

   ⚠️⚠️ **둘째 배너가 `매장 찾기` 가 아닙니다** — 오프라인 매장이
   0곳입니다 (§11 · §0-8 이 "매장 수를 생성하지 않는다"). 대신 실제로
   도는 `판매 진행 조회` 를 둡니다. 매장이 생기는 날 여기 한 줄입니다.
   ⚠️ 셋 다 실제로 열리는 화면입니다 (§11).                      */
function PwSide(){
  var MK = (window.AM_MAKERS || []), GR = (window.AM_GRADES || []);
  var opt = function(v, t){ return '<option value="'+ esc(v) +'">'+ esc(t) +'</option>'; };
  return '<aside class="pwsd" aria-label="내 폰 견적 바로 받기">'+
    '<div class="pwsd-q">'+
      '<b class="pwsd-h">내 폰 견적 바로 받기</b>'+
      '<p class="pwsd-l">기기를 고르시면 신청 화면이 그대로 이어집니다.</p>'+
      /* ⚠️ 폼입니다 — 엔터로도 가야 합니다. */
      '<form class="pwsd-f" onsubmit="return pwSdGo(event)">'+
        '<select class="sel" id="sdMk" aria-label="제조사 선택" onchange="pwSdMk()">'+
          opt("", "제조사 선택")+
          MK.map(function(m){ return opt(m.key, m.name); }).join("")+
        '</select>'+
        '<select class="sel" id="sdMd" aria-label="모델 선택" onchange="pwSdMd()" disabled>'+
          opt("", "모델 선택")+'</select>'+
        '<select class="sel" id="sdCp" aria-label="저장용량 선택" disabled>'+
          opt("", "저장용량 선택")+'</select>'+
        '<select class="sel" id="sdGr" aria-label="기기 상태 선택">'+
          opt("", "기기 상태 선택")+
          GR.map(function(g){ return opt(g.key, g.name); }).join("")+
        '</select>'+
        '<button class="btn btn-pw pwsd-go" type="submit">견적 받으러 가기'+
          pwArrow() +'</button>'+
      '</form>'+
      /* ⚠️⚠️ 이 줄을 지우지 마세요 — 고르고 누르면 **금액이 아니라
         신청 화면**이 나온다는 것을 누르기 전에 밝히는 자리입니다. */
      '<p class="pwsd-n">매입 기준가를 아직 공개하지 않아 이 자리에서 '+
        '금액을 내지 않습니다. 고르신 기기로 <b>신청 화면</b>이 열리고, '+
        '전국 매입업체 견적을 받아 보실 수 있습니다.</p>'+
    '</div>'+
    '<a class="pwsd-b pwsd-b1" href="/repair">'+
      '<i aria-hidden="true">'+ iconArt("repair", 40) +'</i>'+
      '<b>수리 서비스</b>'+
      '<span>정확한 진단, 합리적인 비용</span>'+
      '<em>수리 견적 바로가기'+ pwArrow() +'</em></a>'+
    '<a class="pwsd-b pwsd-b2" href="/track">'+
      '<i aria-hidden="true">'+ iconArt("chart", 40) +'</i>'+
      '<b>판매 진행 조회</b>'+
      '<span>접수번호로 지금 어디까지 왔는지 보실 수 있습니다</span>'+
      '<em>진행 상황 보기'+ pwArrow() +'</em></a>'+
  '</aside>';
}

/* 제조사를 고르면 **그 제조사의 모델**로 다시 채웁니다.
   ⚠️⚠️ 화면을 다시 그리지 않습니다 — 고르개 셋만 바꿔 끼웁니다.
   다시 그리면 방금 고르신 것이 날아가고 스크롤이 맨 위로 갑니다. */
function pwSdFill(sel, list, ph, dis){
  var e = document.getElementById(sel);
  if(!e) return;
  e.innerHTML = '<option value="">'+ esc(ph) +'</option>'+ list.map(function(o){
    return '<option value="'+ esc(o[0]) +'">'+ esc(o[1]) +'</option>'; }).join("");
  e.disabled = !!dis;
  e.value = "";
}
window.pwSdMk = function(){
  var mk = (document.getElementById("sdMk") || {}).value || "";
  /* ⚠️ 스마트폰만이 아닙니다 — 태블릿 · 워치도 삽니다. `amModelsOf()`
     한 곳으로 가져와 `/sell` 과 같은 목록을 씁니다. */
  var L = mk && typeof amModelsOf === "function" ? amModelsOf(mk, "") : [];
  pwSdFill("sdMd", L.map(function(m){ return [m.key, m.name]; }),
           mk ? "모델 선택" : "먼저 제조사를 골라 주세요", !mk);
  pwSdFill("sdCp", [], "저장용량 선택", true);
};
window.pwSdMd = function(){
  var k  = (document.getElementById("sdMd") || {}).value || "";
  var md = (k && typeof amModel === "function") ? amModel(k) : null;
  var caps = (md && md.caps) ? md.caps : [];
  pwSdFill("sdCp", caps.map(function(c){
    return [String(c), c >= 1024 ? (c/1024)+"TB" : c+"GB"]; }),
    caps.length ? "저장용량 선택" : "저장용량 선택", !caps.length);
};
/* ⚠️⚠️ **고르신 것을 그대로 `/sell` 에 실어 보냅니다.** 안 실으면
   같은 것을 두 번 고르시게 되고, 거기서 닫힙니다 (이 저장소가
   업체 상세의 `quoteTo({})` 로 겪은 자리).
   ⚠️ 아무것도 안 고르셔도 막지 않습니다 — `/sell` 첫 걸음이 바로
   기기 고르는 화면입니다 (고르는 자리를 두 번 만들지 않습니다). */
window.pwSdGo = function(ev){
  if(ev && ev.preventDefault) ev.preventDefault();
  var v = function(id){ return (document.getElementById(id) || {}).value || ""; };
  var q = [];
  if(v("sdMk")) q.push("mk=" + encodeURIComponent(v("sdMk")));
  if(v("sdMd")) q.push("md=" + encodeURIComponent(v("sdMd")));
  if(v("sdCp")) q.push("cap=" + encodeURIComponent(v("sdCp")));
  if(v("sdGr")) q.push("gr=" + encodeURIComponent(v("sdGr")));
  go("/sell" + (q.length ? "?" + q.join("&") : ""));
  return false;
};

/* ─── 05 안내 배너 셋 (§2-6) ─────────────────────────────────────
   ⚠️⚠️ **딥 브라운입니다** — 이 저장소에서 어두운 면을 쓸 수 있는
   자리이고, 지시서 §2-6 이 "딥 브라운 배경의 가로 배너 3개" 로
   직접 정했습니다. 어두운 면이 늘면 BRIGHT PREMIUM 15% 한도에
   닿으니 **폭마다 재세요**.
   ⚠️ 셋 다 실제로 열리는 화면입니다. 광고가 아니라 **우리 서비스**라
   "추천 · 인기 · 광고" 딱지를 붙이지 않습니다 (광고주 0곳).        */
/* ⚠️ 위 목록도 js/data/shop.js 입니다 (같은 까닭). */
function PwBanners(){
  return '<section class="pwbz"><div class="w">'+
    '<div class="pw-hd"><h2>먼저 보시면 좋은 것</h2>'+
      '<p>거래 전에 한 번 읽어 두시면 선택이 쉬워집니다.</p></div>'+
    '<ul class="pwbz-g">'+ window.PW_BAN3.map(function(b, i){
      return '<li><a class="pwbz-c pwbz-v'+ (i+1) +'" href="'+ esc(b.to) +'">'+
        '<span class="pwbz-ph"><span class="pwbz-ic">'+ iconArt(b.ia, 56) +'</span></span>'+
        '<span class="pwbz-tx">'+
          '<b class="pwbz-nm">'+ esc(b.nm) +'</b>'+
          '<span class="pwbz-d">'+ esc(b.d) +'</span>'+
          '<span class="pwbz-go">'+ esc(b.cta) +' '+ pwArrow() +'</span>'+
        '</span>'+
      '</a></li>';
    }).join("") +'</ul>'+
  '</div></section>';
}

/* ─── 06 소식과 혜택 (§2-7) ──────────────────────────────────────
   ⚠️⚠️ **게시물이 0건이면 구간째 빠집니다.** 시안의 넉 장과 날짜는
   디자인 예시이고, 적는 순간 없는 소식을 지어내는 것입니다
   (§0-8 · 절대 규칙 1). 한 줄이라도 적으시면 **코드를 한 줄도 안
   고치고** 섭니다 — `js/data/shop.js` 의 `AM_PW_NEWS` 입니다.
   ⚠️ 날짜는 **데이터의 실제 날짜**이고 `amDate()` 가 꼴을 맞춥니다.
   "n일 전" 같은 상대 표기를 쓰지 마세요.                           */
function PwNews(){
  var L = (window.AM_PW_NEWS || []).slice()
    .sort(function(a,b){ return String(b.at||"").localeCompare(String(a.at||"")); })
    .slice(0, 4);
  if(!L.length) return "";
  return '<section class="pwnw"><div class="w">'+
    '<div class="pw-hd-l"><div><h2>'+ esc(window.amBrand ? amBrand() : "") +
      ' 소식과 혜택</h2></div>'+
      '<a class="pw-more" href="/guide">전체 보기 '+ pwArrow() +'</a></div>'+
    '<ul class="pwnw-g">'+ L.map(function(n){
      var d = (typeof amDate === "function") ? amDate(n.at) : "";
      return '<li><a class="pwnw-c" href="'+ esc(n.to || "/guide") +'">'+
        '<span class="pwnw-ph">'+
          (n.ph && typeof hasPhoto === "function" && hasPhoto(n.ph)
            ? photoBox(n.ph, "pwnw-im")
            : '<span class="pwnw-ic">'+ iconArt("mobile", 44) +'</span>')+
        '</span>'+
        '<b>'+ esc(n.title) +'</b>'+
        (n.lead ? '<span class="pwnw-d">'+ esc(n.lead) +'</span>' : '')+
        (d ? '<time datetime="'+ esc(n.at) +'">'+ esc(d) +'</time>' : '')+
      '</a></li>';
    }).join("") +'</ul>'+
  '</div></section>';
}

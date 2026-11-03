#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   화면을 찍는 자리 — 한 소스에서 **화면과 크롤러 본문을 같이** 냅니다

   ⚠️⚠️ **왜 이렇게 만드는가.** 앞 서비스에서 화면과 크롤러 본문이
   **열세 번** 어긋났습니다. 그려진 화면만 보는 검사는 **영원히
   통과**하고, 어긋난 글이 그대로 구글에 나갑니다. 여기서는 본문을
   **한 번만** 짓고 그 글자가 그대로 index.html 에 들어가므로, 둘이
   어긋날 **길이 없습니다.**

   ⚠️⚠️ 네이버 · 빙 · LLM 봇은 자바스크립트를 안 돌립니다. 본문은
   <noscript> 안도 display:none 도 아닌 **진짜 본문 자리**에 있어야
   합니다. 그래서 이 파일이 HTML 을 통째로 찍습니다.

   ⚠️ 자산 주소에 내용 값을 붙입니다 (/css/app.css?v=<sha1 앞 8>).
   이름이 안 바뀌면 손님 브라우저가 **옛 파일을 계속 씁니다** —
   "배포했는데 안 바뀐다" 는 말을 들으면 여기부터 보세요.

   돌리기   node build.js
   ════════════════════════════════════════════════════════════════════ */
var fs = require("fs"), path = require("path"), crypto = require("crypto");

/* ⚠️⚠️ **영업을 시작하는 날 이 값을 true 로 바꾸세요.**
   false 이면 모든 화면에 noindex 가 붙습니다 — 안 걷으면 새 화면이
   검색에 **조용히, 에러 없이** 안 올라갑니다. 빌드가 매번 알립니다. */
var SITE_LIVE = false;

/* ── 데이터 읽기 — 브라우저와 같은 파일을 그대로 씁니다 ────────── */
global.window = {};
["js/components/base.js","js/data/brand.js","js/data/site.js","js/data/catalog.js"]
  .forEach(function(f){ require("./" + f); });
var W = global.window, esc = W.esc, icon = W.icon;

function ver(file){
  try{
    return "?v=" + crypto.createHash("sha1")
      .update(fs.readFileSync(file)).digest("hex").slice(0,8);
  }catch(e){ return ""; }
}

/* ════════════════════════════════════════════════════════════════════
   머리말 · 푸터 — **모든 화면이 이 둘을 부릅니다** (두 곳에 적지 않습니다)
   ════════════════════════════════════════════════════════════════════ */
var NAV = [
  { href:"/categories", name:"카테고리 전체보기", icon:"down" },
  { href:"/search",     name:"업체찾기" },
  { href:"/guide",      name:"이용안내" },
  { href:"/notice",     name:"고객센터" }
];

function header(){
  var B = W.AM_BRAND, cut = B.enCut;
  return '<header class="hd"><div class="wrap hd-in">' +
    '<a class="lg" href="/" aria-label="' + esc(B.name) + ' 홈">' +
      '<span class="lg-mk" style="color:var(--lime-on-dark)">' + icon("flag", 38) + '</span>' +
      '<span class="lg-tx">' +
        '<span class="lg-en">' + esc(B.en.slice(0,cut)) + '<b>' + esc(B.en.slice(cut)) + '</b></span>' +
        '<span class="lg-ko">' + esc(B.name) + '</span>' +
      '</span>' +
    '</a>' +
    '<nav class="gnb" aria-label="주요 메뉴">' +
      NAV.map(function(n){
        return '<a href="' + esc(n.href) + '">' + esc(n.name) +
               (n.icon ? icon(n.icon, 18) : "") + '</a>';
      }).join("") +
    '</nav>' +
    '<form class="sch" role="search" action="/search" method="get">' +
      '<label class="sr" for="q">골프 서비스 · 업체 검색</label>' +
      '<input id="q" name="q" type="search" placeholder="원하는 골프 서비스, 업체를 검색해보세요.">' +
      '<button type="submit" aria-label="검색">' + icon("search", 22) + '</button>' +
    '</form>' +
    '<div class="hd-r">' +
      '<a class="gnb-a" href="/login" style="display:inline-flex;align-items:center;gap:6px;' +
        'min-height:44px;padding:8px 12px;border-radius:8px;font-size:15px;font-weight:600">' +
        icon("user", 20) + '<span class="lbl">로그인</span></a>' +
      '<a class="btn btn-pri btn-sm" href="/join">' + icon("store", 18) + '업체 입점하기</a>' +
    '</div>' +
  '</div></header>';
}

/* ⚠️⚠️ 전자상거래법 제20조 제1항 — **중개한다는 사실을 미리 알립니다.**
   고지하지 않으면 제20조의2 로 통신판매업자와 **연대책임**입니다.
   그래서 약관이 아니라 **모든 화면의 푸터**에 둡니다. */
var MIDDLE_NOTICE =
  "{이름}은 통신판매중개자이며 통신판매의 당사자가 아닙니다. " +
  "상품 · 서비스의 거래 정보 및 거래에 관한 책임은 각 판매자(입점업체)에게 있습니다.";

/* 사업자 정보 — ⚠️ **빈 칸은 줄째 뺍니다.** 지어내지 않습니다 (제10조). */
function bizRows(){
  var rows = [
    ["상호", "company"], ["대표자", "ceo"], ["사업자등록번호", "brn"],
    ["통신판매업 신고번호", "mailOrder"], ["주소", "address"],
    ["전화", "phone"], ["이메일", "email"], ["개인정보 보호책임자", "privacyOfficer"]
  ].filter(function(r){ return W.bizVal(r[1]); });
  if(!rows.length){
    console.warn("  ⚠️ 사업자 정보 여덟 칸이 비어 있습니다 — 영업 시작 전에 " +
                 "js/data/site.js 를 채우세요 (전자상거래법 제10조).");
    return "";
  }
  return '<div class="ft-biz"><dl>' + rows.map(function(r){
    return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(W.bizVal(r[1])) + '</dd>';
  }).join("") + '</dl></div>';
}

function footer(){
  var B = W.AM_BRAND;
  var cols = [
    ["서비스", W.amCatsOf("provider").slice(0,5).map(function(c){
        return ["/c/" + c.key, c.name]; })],
    ["이용 안내", [["/guide","이용안내"], ["/notice","고객센터"], ["/join","업체 입점하기"]]],
    ["약관 · 방침", [["/terms","이용약관"], ["/privacy","개인정보처리방침"]]]
  ];
  return '<footer class="ft"><div class="wrap">' +
    '<div class="ft-top">' +
      '<div><div class="lg-en" style="color:#fff;font-size:18px">' + esc(B.en) + '</div>' +
      '<p style="margin-top:8px;font-size:14px">' + esc(B.sub) + '</p></div>' +
      '<nav class="ft-nav" aria-label="푸터 메뉴">' + cols.map(function(c){
        return '<div><h4>' + esc(c[0]) + '</h4><ul>' + c[1].map(function(l){
          return '<li><a href="' + esc(l[0]) + '">' + esc(l[1]) + '</a></li>';
        }).join("") + '</ul></div>';
      }).join("") + '</nav>' +
    '</div>' +
    bizRows() +
    '<p class="ft-mid">' + esc(MIDDLE_NOTICE.replace("{이름}", B.name)) + '</p>' +
    '<p class="ft-cr">&copy; ' + new Date().getFullYear() + ' ' + esc(B.name) + '</p>' +
  '</div></footer>';
}

/* ════════════════════════════════════════════════════════════════════
   화면 한 장 — 머리 · 본문 · 꼬리
   ════════════════════════════════════════════════════════════════════ */
function page(o){
  var B = W.AM_BRAND, site = W.bizVal("site") || "";
  var title = W.amTitle(o.title, o.route);
  var canon = site + (o.route === "/" ? "/" : o.route);
  var ld = {
    "@context":"https://schema.org", "@type":"WebSite",
    name: B.name, alternateName: B.en, url: site + "/",
    description: o.desc,
    potentialAction: { "@type":"SearchAction",
      target: { "@type":"EntryPoint", urlTemplate: site + "/search?q={search_term_string}" },
      "query-input":"required name=search_term_string" }
  };
  /* ⚠️ 구조화 데이터에 **없는 별점(aggregateRating)을 넣지 마세요** —
     적발되면 리치 결과가 통째로 막힙니다. 후기가 쌓이면 그때 실제
     배열에서 계산해 넣습니다. */
  return '<!doctype html>\n<html lang="ko">\n<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    /* ⚠️⚠️ 안드로이드 크롬 · 삼성 인터넷의 자동 다크 모드를 막습니다.
       CSS 에도 같은 선언이 있습니다 — **둘 다** 있어야 합니다. */
    '<meta name="color-scheme" content="only light">\n' +
    '<title>' + esc(title) + '</title>\n' +
    '<meta name="description" content="' + esc(o.desc) + '">\n' +
    (SITE_LIVE ? '' : '<meta name="robots" content="noindex,nofollow">\n') +
    '<link rel="canonical" href="' + esc(canon) + '">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:site_name" content="' + esc(B.name) + '">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n' +
    '<meta property="og:description" content="' + esc(o.desc) + '">\n' +
    '<meta property="og:url" content="' + esc(canon) + '">\n' +
    '<link rel="stylesheet" href="/css/tokens.css' + ver("css/tokens.css") + '">\n' +
    '<link rel="stylesheet" href="/css/app.css' + ver("css/app.css") + '">\n' +
    '<script type="application/ld+json">' + JSON.stringify(ld) + '</script>\n' +
    '</head>\n<body>\n' +
    '<a class="skip" href="#main">본문 바로가기</a>\n' +
    header() + '\n<main id="main">\n' + o.body + '\n</main>\n' + footer() + '\n' +
    '</body>\n</html>\n';
}

module.exports = { page: page, header: header, footer: footer, ver: ver,
                   W: W, SITE_LIVE: SITE_LIVE };

if(require.main === module){
  var home = require("./pages/home.js");
  var out = page(home.build());
  fs.writeFileSync("index.html", out);
  console.log("index.html  " + out.length.toLocaleString("ko-KR") + " 글자");
  if(!SITE_LIVE)
    console.warn("  ⚠️⚠️ SITE_LIVE 가 false 입니다 — 모든 화면에 noindex 가 붙습니다. " +
                 "영업을 시작하는 날 build.js 에서 true 로 바꾸세요.");
}

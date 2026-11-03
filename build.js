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
["js/components/base.js","js/data/korean.js","js/data/brand.js",
 "js/data/site.js","js/data/catalog.js","js/data/regions.js",
 "js/data/providers.generated.js","js/data/providers.js",
 "js/data/legal-terms.js","js/data/legal-privacy.js"]
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
/* 2차 지시서 §3-A 의 차례 그대로입니다. ⚠️ 여기 늘리면 폰에서 가로로
   밀리는지 전수 점검이 봅니다 (메뉴가 가로 스크롤로 접힙니다). */
var NAV = [
  { href:"/categories", name:"카테고리",      icon:"down" },
  { href:"/search",     name:"업체찾기" },
  { href:"/match",      name:"매칭 요청" },
  { href:"/guide",      name:"이용안내" },
  { href:"/help",       name:"고객센터" }
];

function header(){
  var B = W.AM_BRAND, cut = B.enCut;
  return '<header class="hd"><div class="wrap hd-in">' +
    '<a class="lg" href="/" aria-label="' + esc(B.name) + ' 홈">' +
      '<span class="lg-mk" style="color:var(--pt-on-dark)">' + icon("flag", 38) + '</span>' +
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
    /* ⚠️⚠️ **로그인 · 회원가입 단추를 아직 안 냅니다.** 지시서 3번의
       머리말 목록에는 있지만, 회원 기능이 돌기 전에 내면 눌러도 아무
       일이 안 나는 단추가 됩니다 (절대 규칙 5). 5단계에서 회원 · 업체
       등록을 세울 때 같이 켭니다 — 자리는 .hd-r 그대로입니다. */
    '<div class="hd-r">' +
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
    /* ⚠️ 화면마다 한 번씩 찍으면 빌드 기록이 같은 말로 덮입니다 — 한 번만 */
    if(!bizRows.warned){
      bizRows.warned = true;
      console.warn("  ⚠️ 사업자 정보 여덟 칸이 비어 있습니다 — 영업 시작 전에 " +
                   "js/data/site.js 를 채우세요 (전자상거래법 제10조).");
    }
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
        return [W.amCatUrl(c), c.name]; })],
    ["이용 안내", [["/guide","이용안내"], ["/help","고객센터"], ["/join","업체 입점하기"]]],
    ["약관 · 방침", [["/terms","이용약관"], ["/privacy","개인정보처리방침"]]]
  ];
  return '<footer class="ft"><div class="wrap">' +
    '<div class="ft-top">' +
      '<div><div class="lg-en" style="color:#fff;font-size:18px">' + esc(B.en) + '</div>' +
      '<p style="margin-top:8px;font-size:14px">' + esc(B.sub) + '</p></div>' +
      '<nav class="ft-nav" aria-label="푸터 메뉴">' + cols.map(function(c){
        /* ⚠️ h4 였다가 접근성 점검에 걸렸습니다 — 본문이 h2 까지만 쓰는데
           푸터가 h4 로 뛰면 낭독기가 "빠진 단계" 로 읽습니다. */
        return '<div><h2 class="ft-h">' + esc(c[0]) + '</h2><ul>' + c[1].map(function(l){
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
  /* ── 구조화 데이터 ────────────────────────────────────────
     ⚠️⚠️ **없는 별점(aggregateRating)을 넣지 마세요.** 적발되면 리치
     결과가 **통째로** 막힙니다. 후기가 쌓이면 그때 실제 배열에서
     계산해 넣습니다 — 값으로 들고 있지 않습니다.
     ⚠️ 사업자 정보가 없으면 Organization 을 **안 냅니다.** 빈 칸을
     넣으면 검색엔진에 틀린 정보를 알리는 것이 됩니다. */
  var ld = [{
    "@context":"https://schema.org", "@type":"WebSite",
    name: B.name, alternateName: B.en, url: site + "/",
    description: o.desc,
    inLanguage: "ko-KR",
    potentialAction: { "@type":"SearchAction",
      target: { "@type":"EntryPoint", urlTemplate: site + "/search?q={search_term_string}" },
      "query-input":"required name=search_term_string" }
  }];

  var org = { "@context":"https://schema.org", "@type":"Organization",
              name: B.name, alternateName: B.en, url: site + "/" };
  var oFields = 0;
  if(W.bizVal("company")){ org.legalName = W.bizVal("company"); oFields++; }
  if(W.bizVal("phone")){   org.telephone = W.bizVal("phone");   oFields++; }
  if(W.bizVal("email")){   org.email     = W.bizVal("email");   oFields++; }
  if(W.bizVal("address")){ org.address   = { "@type":"PostalAddress",
                                             streetAddress: W.bizVal("address"),
                                             addressCountry:"KR" }; oFields++; }
  if(oFields) ld.push(org);

  /* 빵부스러기 — 화면이 그린 길과 **같은 길**이어야 합니다 */
  if(Array.isArray(o.crumbs) && o.crumbs.length){
    ld.push({ "@context":"https://schema.org", "@type":"BreadcrumbList",
      itemListElement: [["홈","/"]].concat(o.crumbs).map(function(c, i){
        return { "@type":"ListItem", position: i + 1, name: c[0],
                 item: site + (c[1] === "/" ? "/" : c[1]) };
      }) });
  }
  if(o.ld) ld.push(o.ld);
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
    /* ⚠️ 개인 화면(/my · /admin)은 **영업을 시작해도** 색인하지 않습니다.
       SITE_LIVE 와 따로 둡니다 — 한 칸으로 묶으면 문 여는 날 같이
       열립니다. */
    ((SITE_LIVE && !o.noindex) ? '' : '<meta name="robots" content="noindex,nofollow">\n') +
    '<link rel="canonical" href="' + esc(canon) + '">\n' +
    '<meta property="og:type" content="website">\n' +
    '<meta property="og:site_name" content="' + esc(B.name) + '">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n' +
    '<meta property="og:description" content="' + esc(o.desc) + '">\n' +
    '<meta property="og:url" content="' + esc(canon) + '">\n' +
    '<link rel="stylesheet" href="/css/tokens.css' + ver("css/tokens.css") + '">\n' +
    '<link rel="stylesheet" href="/css/app.css' + ver("css/app.css") + '">\n' +
    (W.bizVal("naverVerify")
      ? '<meta name="naver-site-verification" content="' + esc(W.bizVal("naverVerify")) + '">\n' : '') +
    (W.bizVal("googleVerify")
      ? '<meta name="google-site-verification" content="' + esc(W.bizVal("googleVerify")) + '">\n' : '') +
    ld.map(function(x){
      return '<script type="application/ld+json">' + JSON.stringify(x) + '</script>\n';
    }).join("") +
    '</head>\n<body>\n' +
    '<a class="skip" href="#main">본문 바로가기</a>\n' +
    header() + '\n<main id="main">\n' + o.body + '\n</main>\n' + footer() + '\n' +
    /* ⚠️ 자바스크립트는 **덧대는 것**입니다. 본문은 이미 위에 다 있습니다 —
       스크립트가 안 돌아도 화면이 비지 않습니다. */
    (o.js ? ['/js/components/base.js','/js/data/brand.js','/js/data/catalog.js']
              .concat(Array.isArray(o.js) ? o.js : [o.js])
              .map(function(f){ return '<script src="' + f + ver(f.replace(/^\//,"")) + '"></script>\n'; })
              .join("") : '') +
    '</body>\n</html>\n';
}

module.exports = { page: page, header: header, footer: footer, ver: ver,
                   W: W, SITE_LIVE: SITE_LIVE };

if(require.main === module){
  var routeGuard = require("./tools/check-routes.js");

  /* ⚠️⚠️ **화면의 상태 말과 DB 의 상태 키가 같은가** — 한쪽만 고치면
     에러 없이 조용히 어긋납니다 (손님 화면에 `fee_wait` 가 영문 그대로
     찍히거나, 단추는 보이고 DB 가 거절합니다). 찍기 **전에** 멈춥니다. */
  var dealGuard = require("./tools/check-deal.js").run();
  if(dealGuard.bad.length){
    dealGuard.bad.forEach(function(m){ console.error("❌ " + m); });
    process.exit(1);
  }
  var cat  = require("./pages/category.js");
  var home = require("./pages/home.js");
  var list = require("./pages/categories.js");
  var flat = ["guide", "help", "join", "search", "match", "login", "my", "admin",
               "desk", "terms", "privacy"].map(function(n){
    return require("./pages/" + n + ".js").build();
  });

  /* ⚠️⚠️ **업체가 쓰는 하위 키가 진짜인지 먼저 봅니다.** 분류 키를
     적었거나 오타가 나면 그 업체만 **조용히 아무 데도 안 뜹니다** —
     에러도 404 도 안 납니다 (0016 머리말이 적어 둔 자리).
     ⚠️ 자료는 DB 에서 나오므로, 여기서 멈추면 DB 를 고쳐야 합니다. */
  var provs = W.amProviders();
  var subBad = [];
  provs.forEach(function(p){
    (Array.isArray(p.subs) ? p.subs : []).forEach(function(k){
      if(!W.amSub(k)) subBad.push(p.id + " 의 subs 에 '" + k + "' — 그런 하위가 없습니다");
    });
    if(!(Array.isArray(p.subs) && p.subs.length))
      subBad.push(p.id + " 에 subs 가 비었습니다 — 아무 분류에도 안 뜹니다");
  });
  if(subBad.length){
    subBad.forEach(function(m){ console.error("❌ " + m); });
    process.exit(1);
  }

  /* ⚠️⚠️ **네 영역이 열 분류를 빠짐없이 한 번씩 덮는가** (2차 지시서 §4).
     빠지면 그 분류는 메인에서 길이 하나 줄고, 겹치면 같은 분류가 두 번
     나옵니다 — 둘 다 에러 없이 조용합니다. */
  var zSeen = {}, zBad = [];
  (W.AM_ZONES || []).forEach(function(z){
    (z.cats || []).forEach(function(k){
      if(!W.amCat(k)) zBad.push(z.key + " 영역이 가리키는 '" + k + "' 분류가 없습니다");
      else if(zSeen[k]) zBad.push("'" + k + "' 분류가 영역 둘에 들어 있습니다");
      else zSeen[k] = 1;
    });
  });
  (W.AM_CATS || []).forEach(function(c){
    if(!zSeen[c.key]) zBad.push("'" + c.key + "' 분류가 **어느 영역에도** 없습니다");
  });
  if(zBad.length){ zBad.forEach(function(m){ console.error("❌ " + m); }); process.exit(1); }

  var prov = require("./pages/provider.js");
  var built = [home.build(), list.build()]
    .concat(W.AM_CATS.map(function(c){ return cat.build(c); }))
    .concat(flat)
    .concat(provs.map(function(p){ return prov.build(p); }));

  /* ⚠️⚠️ 찍기 전에 **주소가 vercel.json 에 잡아먹히는지** 먼저 봅니다.
     걸리면 저장소에는 파일이 멀쩡한데 손님에게는 410 이 나갑니다 —
     로컬에서는 영원히 안 보이는 고장입니다. */
  var eaten = built.map(function(b){
    return { r: b.route, hit: routeGuard.swallows(b.route) };
  }).filter(function(x){ return x.hit; });
  if(eaten.length){
    eaten.forEach(function(x){
      console.error("❌ " + x.r + " 은 vercel.json 의 '" + x.hit.s + "' 에 걸려 " +
                    x.hit.d + " 로 갑니다");
    });
    process.exit(1);
  }

  var wrote = {};
  built.forEach(function(b){
    var file = b.route === "/" ? "index.html"
             : b.route.replace(/^\//, "") + "/index.html";
    wrote[file] = 1;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, page(b));
  });

  /* ⚠️⚠️⚠️ **찍지 않은 HTML 이 저장소에 남아 있나.**
     2026-11-03 에 `tools/test-providers.js` 가 검사용 씨앗으로 찍은
     **없는 업체의 화면 두 장**(`/pro/green-pt` · `/pro/xss-test`)이
     커밋에 그대로 들어가 있었습니다. 검사는 자료 파일(`providers.
     generated.js`)만 사본으로 되돌리고 **찍힌 HTML 은 안 지웠습니다.**
     사이트맵에도 routes.json 에도 없어서 링크 검사 · 주소 검사가
     전부 초록이었는데, Vercel 은 **저장소의 파일을 그대로 섬깁니다** —
     올렸으면 `/pro/green-pt` 가 **없는 회사를 광고**하고 있었을
     것입니다 (절대 규칙 1 · 표시광고법 제3조).
     ⚠️ 그래서 빌드가 **제가 안 찍은 index.html 을 지웁니다.** 지운 것을
     말하고 지나갑니다 — 조용히 지우면 손으로 둔 화면이 사라진 것을
     아무도 모릅니다. ⚠️ 이 자리는 빌드의 출력 폴더입니다. 손으로 쓴
     화면을 두시려면 `build.js` 가 찍게 하세요. */
  var SKIPDIR = ["node_modules", ".git", "db", "tools", "js", "css", "pages",
                 "api", "img", ".github", ".vercel"];
  var orphan = [];
  (function sweep(dir){
    fs.readdirSync(dir).forEach(function(f){
      var full = path.join(dir, f);
      var rel = path.relative(".", full);
      if(dir === "." && SKIPDIR.indexOf(f) >= 0) return;
      if(f.charAt(0) === "." && dir === ".") return;
      var st = fs.statSync(full);
      if(st.isDirectory()) return sweep(full);
      if(f !== "index.html") return;
      if(!wrote[rel]) orphan.push(rel);
    });
  })(".");
  orphan.forEach(function(f){
    fs.unlinkSync(f);
    /* 빈 폴더까지 치웁니다 — 남겨 두면 다음 빌드가 또 돌 때 조용합니다 */
    var d = path.dirname(f);
    while(d !== "." && fs.existsSync(d) && fs.readdirSync(d).length === 0){
      fs.rmdirSync(d); d = path.dirname(d);
    }
    console.warn("  ⚠️ 찍지 않은 화면을 지웠습니다 — /" +
                 f.replace(/\/index\.html$/, "").replace(/^index\.html$/, ""));
  });

  /* 같은 제목이 둘이면 검색엔진이 둘 다 흘립니다 — 빌드에서 멈춥니다 */
  var seen = {}, dup = [];
  built.forEach(function(b){
    var t = W.amTitle(b.title, b.route);
    if(seen[t]) dup.push(t + "  (" + seen[t] + " · " + b.route + ")");
    seen[t] = b.route;
  });
  if(dup.length){ dup.forEach(function(d){ console.error("❌ 제목이 겹칩니다: " + d); }); process.exit(1); }

  /* 찍은 주소를 적어 둡니다 — 전수 점검이 인자 없이 돌 때 이것을 읽습니다.
     ⚠️ 주소가 **사라지는** 것도 여기서 보입니다 (전 목록과 견주세요). */
  /* ⚠️ 한 파일에 둡니다 — 두 곳에 적으면 한쪽만 고쳐서 어긋납니다.
     unlinked 는 **일부러 아무 데서도 안 거는** 화면입니다 (로그인 자리는
     자바스크립트가 넣고, 관리자는 메뉴에 두지 않습니다). */
  fs.writeFileSync("tools/routes.json", JSON.stringify({
    routes:   built.map(function(b){ return b.route; }),
    unlinked: built.filter(function(b){ return b.unlinked; })
                   .map(function(b){ return b.route; })
  }, null, 2) + "\n");

  /* ── 사이트맵 · robots (지시서 9번) ──────────────────────────
     ⚠️⚠️ **주소 목록은 여기 한 곳에서 나옵니다.** 손으로 적은 사이트맵은
     화면을 지우거나 늘린 날 조용히 어긋납니다 — 검색엔진이 없는 주소를
     긁고, 새 주소는 영영 모릅니다.
     ⚠️ 개인 화면(noindex)은 **빼고** 적습니다. 사이트맵에 넣고 noindex 를
     거는 것은 "오라고 해 놓고 보지 말라" 는 말이라 둘 다 손해입니다.
     ⚠️⚠️ SITE_LIVE 가 false 면 robots 가 **전부 막습니다.** 문 열기 전에
     긁히면 "준비 중" 화면이 검색 결과에 박힙니다. */
  var site = W.bizVal("site") || "";
  var pub  = built.filter(function(b){ return !b.noindex; });
  var day  = new Date().toISOString().slice(0, 10);

  fs.writeFileSync("sitemap.xml",
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    pub.map(function(b){
      return "  <url><loc>" + site + (b.route === "/" ? "/" : b.route) + "</loc>" +
             "<lastmod>" + day + "</lastmod>" +
             "<changefreq>" + (b.route === "/" ? "daily" : "weekly") + "</changefreq>" +
             "<priority>" + (b.route === "/" ? "1.0" : "0.7") + "</priority></url>";
    }).join("\n") + "\n</urlset>\n");

  fs.writeFileSync("robots.txt", SITE_LIVE
    ? ("User-agent: *\n" +
       "Allow: /\n" +
       /* 개인 화면은 긁지 않게 — 사이트맵에도 없습니다 */
       built.filter(function(b){ return b.noindex; })
            .map(function(b){ return "Disallow: " + b.route + "\n"; }).join("") +
       "\nSitemap: " + site + "/sitemap.xml\n")
    : ("# 아직 문을 열기 전입니다 — 전부 막습니다.\n" +
       "# 영업을 시작하는 날 build.js 의 SITE_LIVE 를 true 로 바꾸면\n" +
       "# 이 파일이 Allow 로 다시 찍힙니다.\n" +
       "User-agent: *\n" +
       "Disallow: /\n"));

  console.log("사이트맵 " + pub.length + "개 주소 · robots " +
              (SITE_LIVE ? "열림" : "전부 막음"));
  console.log("업체 " + provs.length + "곳 (" + (W.AM_PROVIDERS_AT || "?") + ")" +
              (provs.length ? "" : " — 0곳이라 화면이 0곳이라고 말합니다"));

  console.log("화면 " + built.length + "장 찍었습니다 — " +
              built.map(function(b){ return b.route; }).join(" "));
  if(!SITE_LIVE)
    console.warn("  ⚠️⚠️ SITE_LIVE 가 false 입니다 — 모든 화면에 noindex 가 붙습니다. " +
                 "영업을 시작하는 날 build.js 에서 true 로 바꾸세요.");
}

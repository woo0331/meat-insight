/* ════════════════════════════════════════════════════════════════════
   전수 점검 — 창업 · 폐업 플랫폼

   실행:  node check.js

   26개 화면 × 데스크톱·태블릿·모바일 세 폭에서
     1. JS 에러 · 못 불러온 파일
     2. 가로 스크롤
     3. 12px 미만 글씨 (연세 있는 사장님이 폰으로 읽습니다)
     4. 40px 미만으로 누르는 것
     5. 낱말 가운데가 잘리는 곳
     6. 손님 화면에 남은 개발자 말 · undefined · NaN
     7. 링크가 실제로 열리는지 (죽은 주소가 없는지)
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
/* ⚠️ file:// 로는 못 돕니다. 주소가 경로 방식(/c/beef)이라 진짜 서버가
   있어야 합니다. Vercel 을 흉내 내는 작은 서버를 띄웁니다 —
   정적 파일 우선, 없으면 rewrite, 그것도 아니면 404. */
const http = require("http"), fsx = require("fs"), px = require("path");
/* build-pages.js 가 만든 HTML 이 없는 **주소 안의 주소**만 여기 둡니다
   (vercel.json 의 rewrites 와 같은 구실). 나머지는 전부 진짜 파일입니다. */
const RW = [/^\/partners\/[^/]+$/, /^\/lab\/[^/]+$/];
/* ⚠️ `.svg` 를 빠뜨리면 그림이 application/octet-stream 으로 나가서
   브라우저가 **그리지 않고 alt 글자만** 보여 줍니다. 화면은 멀쩡해
   보이는데 사진 자리가 전부 글자가 됩니다 — 실제로 그렇게 봤습니다. */
const MT = { ".html":"text/html;charset=utf-8", ".js":"text/javascript;charset=utf-8",
  ".css":"text/css;charset=utf-8", ".json":"application/json", ".jpg":"image/jpeg",
  ".png":"image/png", ".svg":"image/svg+xml", ".ico":"image/x-icon",
  ".xml":"application/xml", ".txt":"text/plain;charset=utf-8" };
const PORT = 8123;
const server = http.createServer((rq,rs)=>{
  const u = decodeURIComponent(rq.url.split("?")[0]);
  const send = (f,code)=>{ try{
    rs.writeHead(code||200,{"content-type":MT[px.extname(f)]||"application/octet-stream"});
    rs.end(fsx.readFileSync(f)); }catch(e){ rs.writeHead(500); rs.end(); } };
  let f = px.join(__dirname, u);
  if(fsx.existsSync(f) && fsx.statSync(f).isDirectory()) f = px.join(f,"index.html");
  if(fsx.existsSync(f) && fsx.statSync(f).isFile()) return send(f);
  if(RW.some(r=>r.test(u))) return send(px.join(__dirname,"index.html"));
  return send(px.join(__dirname,"404.html"), 404);
});
const ROOT = "http://127.0.0.1:" + PORT;

const PAGES = [
  ["/",                  "메인 — 두 선택"],
  ["/startup",           "창업 진입 (업종 고르기)"],
  /* 업종 열넷을 다 넣으면 검사가 한참 길어집니다. **짜임새가 서로 다른
     것**을 고릅니다 — 장비가 제일 많은 것(cafe), 재고가 도는 것
     (restaurant), 장비가 없는 것(etc), 폐업 쪽이 특이한 것(gym). */
  ["/startup/cafe",      "카페 창업"],
  ["/startup/restaurant","음식점 창업"],
  ["/startup/etc",       "기타 업종 창업 (장비 없음)"],
  ["/closure",           "폐업 진입 (정리 방법)"],
  ["/closure/restaurant","음식점 폐업"],
  ["/closure/gym",       "헬스장 폐업"],
  ["/providers",         "업체찾기"],
  ["/providers/interior","인테리어 · 시공 업체"],
  ["/providers/demolish","철거 업체"],
  ["/providers/it",      "IT · 매장시스템 업체"],
  ["/providers/admin",   "행정 · 전문가"],
  ["/providers/interior?s=duct&i=cafe&r=gyeonggi", "업체 (하위분류 · 업종 · 지역 고른 채)"],
  ["/c/area",            "상권 · 입지"],
  ["/c/process",         "폐업 절차"],
  ["/c/item",            "창업 아이템"],
  ["/franchise",         "프랜차이즈"],
  ["/franchise/cafe",    "카페 프랜차이즈"],
  ["/stores",            "점포 · 상가"],
  ["/stores?i=cafe",     "점포 (업종 고른 채)"],
  ["/assets",            "시설 · 집기"],
  ["/assets?i=gym",      "시설 (업종 고른 채)"],
  ["/support",           "자금 · 정부지원"],
  ["/content",           "창업 · 폐업 정보"],
  ["/quote",             "견적 요청"],
  ["/quote?c=interior&i=cafe&r=gyeonggi&side=start", "견적 요청 (조건 실려 옴)"],
  ["/join",              "업체 입점하기"],
  ["/my",                "MY"],
  ["/search",            "검색 (처음)"],
  ["/search?q=%EC%B9%B4%ED%8E%98%20%EC%9D%B8%ED%85%8C%EB%A6%AC%EC%96%B4", "검색 결과 (카페 인테리어)"],
  ["/search?q=zzz",      "검색 (못 찾음)"],
  ["/tools",             "사장님 도구"],
  ["/tools/cost",        "도구 — 창업비"],
  ["/tools/fixed",       "도구 — 월 고정비"],
  ["/tools/bep",         "도구 — 손익분기"],
  ["/tools/labor",       "도구 — 인건비율"],
  ["/tools/vs",          "도구 — 신규 vs 인수"],
  ["/tools/close",       "도구 — 폐업 체크리스트"],
  ["/faq",               "자주 묻는 것"],
  /* ⚠️ 글을 만들었으면 여기 넣으세요. 예전 저장소에서 연구소 글 열두
     편이 한동안 전수 점검에 **아예 안 들어가** 있었습니다 — 제목 검사를
     일부러 깨 봤는데 안 걸려서 알았습니다. */
  ["/content/sabeopja-deungrok",   "정보 — 사업자등록"],
  ["/content/inheoga-jongryu",     "정보 — 인허가 종류"],
  ["/content/sangga-gyeyak-check", "정보 — 상가 계약"],
  ["/content/gwolligeum-bohostory","정보 — 권리금"],
  ["/content/cheot-jigwon",        "정보 — 첫 직원"],
  ["/content/pyeeop-sunseo",       "정보 — 폐업 순서"],
  ["/content/wonsang-bokgu-beomwi","정보 — 원상복구"],
  ["/content/pyeeop-jigwon-jeongri","정보 — 폐업 직원"],
  ["/about",             "소개"],
  ["/terms",             "이용약관"],
  ["/privacy",           "개인정보처리방침"],
  ["/nope",              "없는 주소"]
];
const VIEWS = [[1440,900,"데스크톱"],[1024,820,"태블릿"],[390,844,"모바일"]];

/* 손님 화면에 있으면 안 되는 말 */
/* ⚠️ 조사를 괄호로 때운 자리(은(는) · 을(를))도 여기서 걸립니다.
   화면에도 보이지만, 더 나쁜 것은 **구글 검색 결과 줄**에 그대로
   나간다는 점입니다 — 카테고리 17개가 실제로 그랬습니다. */
/* ⚠️ "지시서 12번" 이 파트너 안내 화면에 그대로 나간 적이 있습니다.
   운영자끼리 쓰는 말(지시서 · 스펙 · MVP · 어드민 · TODO)은 손님 화면에
   있으면 안 됩니다 (절대 규칙 3). */
const BAD = /undefined|NaN|\[object |null년|console\.|localStorage|TODO|FIXME|placeholder|지시서|스펙 ?\d|어드민|[은는이가을를와과](\([은는이가을를와과]\))/i;

const AUDIT = `(() => {
  const W = window.innerWidth, out = { small:[], tap:[], wrap:[], bad:[], glue:[], mix:[], h1:[], dim:[] };
  /* ⚠️ **흰 글자가 흰 바탕에 앉는 일이 실제로 있었습니다.** 창업 다섯
     마디(.flow)는 어두운 구간에만 있던 것이라 글자색 기본이 흰색이고,
     밝은 쪽은 .sec-tone 안에서만 되돌려 놓았습니다. 그 구간을 순백으로
     옮기자 제목과 설명이 **통째로 안 보였습니다** — 에러도 안 나고
     가로 스크롤도 안 나고 이 검사들도 전부 통과했습니다.
     그래서 글자색과 실제 바탕색의 **밝기 차이**를 직접 잽니다.
     ⚠️ 1.6 은 "거의 안 보인다" 는 선입니다. 낮은 대비를 전부 잡으려는
     게 아닙니다 — 그건 디자인 판단이고 여기서 할 일이 아닙니다. */
  /* [r,g,b,a] 로 돌려줍니다 — 반투명을 **불투명으로 착각하면** 안 됩니다.
     .mstep 의 rgba(255,255,255,.07) 을 흰색으로 읽어 딥 버건디 위의 흰
     글자 12개가 오탐으로 걸렸습니다. */
  const rgb = v => {
    const m = (v||"").match(/[0-9.]+/g); if(!m) return null;
    const a = m.length > 3 ? parseFloat(m[3]) : 1;
    if(a === 0) return null;
    return [+m[0], +m[1], +m[2], a];
  };
  const lum = c => {
    const f = x => { x /= 255; return x <= .03928 ? x/12.92 : Math.pow((x+.055)/1.055, 2.4); };
    return .2126*f(c[0]) + .7152*f(c[1]) + .0722*f(c[2]);
  };
  /* ⚠️ **그라디언트·사진 위는 재지 않습니다.** computed style 의
     backgroundColor 는 그라디언트일 때 투명으로 나옵니다 — 그대로
     위로 올라가면 "흰 바탕" 으로 잘못 읽어서, 딥 버건디 구간의 흰
     글자 16개가 전부 오탐으로 걸렸습니다. 색을 모르면 **건너뜁니다.**
     바탕이 단색인 곳만 봅니다 — 흰 글자가 흰 바탕에 앉는 사고는
     대부분 단색 구간에서 납니다. */
  const bgOf = e => {
    const layers = [];   /* 위에서 아래로 쌓인 반투명 면들 */
    let n = e;
    while(n && n !== document.documentElement){
      const cs = getComputedStyle(n);
      if(cs.backgroundImage && cs.backgroundImage !== "none") return null;
      const c = rgb(cs.backgroundColor);
      if(c){
        if(c[3] >= .999){
          /* 불투명한 면을 만났습니다 — 위에 쌓인 것들을 여기에 얹습니다 */
          let out = [c[0], c[1], c[2]];
          for(let i = layers.length - 1; i >= 0; i--){
            const l = layers[i];
            out = [l[0]*l[3] + out[0]*(1-l[3]),
                   l[1]*l[3] + out[1]*(1-l[3]),
                   l[2]*l[3] + out[2]*(1-l[3])];
          }
          return out;
        }
        layers.push(c);
      }
      n = n.parentElement;
    }
    return null;   /* 끝까지 불투명한 면이 없으면 모르는 것으로 둡니다 */
  };
  const vis = e => {
    const c = getComputedStyle(e);
    if (c.display==="none" || c.visibility==="hidden" || +c.opacity===0) return false;
    const r = e.getBoundingClientRect();
    return r.width>0 && r.height>0;
  };
  document.querySelectorAll("body *").forEach(e => {
    if (!vis(e)) return;
    const c = getComputedStyle(e), r = e.getBoundingClientRect();
    const leaf = !e.children.length && (e.textContent||"").trim();

    /* 3. 12px 미만 */
    if (leaf) {
      const f = parseFloat(c.fontSize);
      if (f < 12) out.small.push(e.className+"|"+f+"px|"+(e.textContent||"").trim().slice(0,14));
      /* 3-2. 글자가 바탕에 묻히는가 */
      const fg = rgb(c.color);
      const bg = fg ? bgOf(e) : null;
      if (fg && bg) {
        const a = lum(fg), b2 = lum(bg);
        const ratio = (Math.max(a,b2) + .05) / (Math.min(a,b2) + .05);
        if (ratio < 1.6)
          out.dim.push(e.className+"|"+ratio.toFixed(2)+"|"+(e.textContent||"").trim().slice(0,14));
      }
    }
    /* 4. 누르는 것 40px — <button> 만이 아니라 onclick 을 단 것도 전부.
       ⚠️ 체크박스는 **자기 자신이 아니라 감싼 라벨이 누르는 자리**입니다.
       20px 짜리 체크박스가 44px 라벨 안에 있으면 손가락이 닿는 크기는
       44px 입니다. 체크박스를 40px 로 키우는 것은 오히려 이상합니다 —
       그래서 라벨이 있으면 라벨을 재고, 없을 때만 자기 크기를 봅니다. */
    if (e.matches("button, a[href], [onclick], [role=button], select, input[type=checkbox]")
        && c.position!=="absolute") {
      let box = r;
      if (e.matches("input[type=checkbox]")) {
        const lb = e.closest("label");
        if (lb) box = lb.getBoundingClientRect();
      }
      const h = Math.round(box.height);
      if (h > 0 && h < 40 && e.offsetParent !== null)
        out.tap.push(e.tagName+"."+String(e.className).split(" ")[0]+"|"+h+"px|"+(e.textContent||"").trim().slice(0,12));
    }
    /* 6. 손님 화면에 남은 개발자 말 */
    if (leaf && ${BAD.source ? "/"+BAD.source+"/i" : "/$^/"}.test(e.textContent))
      out.bad.push((e.textContent||"").trim().slice(0,40));
  });
  /* 5. 낱말 가운데 잘림 — 낱말 수보다 줄 수가 많으면 쪼개진 것입니다 */
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())) {
    const t = (n.nodeValue||"").trim(); if (!t) continue;
    const el = n.parentElement; if (!el || !vis(el)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const rects = [...r.getClientRects()]; if (rects.length < 2) continue;
    /* ⚠️ 가운뎃점·빗금·쉼표도 **낱말 경계**입니다.
       "육절기·골절기·진공기" 가 "육절기·골절기· / 진공기" 로 줄이
       바뀌는 것은 낱말이 쪼개진 게 아닙니다. 띄어쓰기만 세면 이런
       것이 전부 걸려서, 정작 잡아야 할 "고소 / 함" 이 묻힙니다. */
    const toks = t.split(/[\\s·・\\/,]+/).filter(Boolean);
    const lefts = rects.map(x=>x.left);
    /* "줄 중간에서 시작" 이면 줄이 하나 더 늘 수 있어 한 줄 봐줍니다.
       ⚠️ 다만 **가운데·오른쪽 정렬에서는 이 판단을 쓰면 안 됩니다.**
       가운데 정렬은 줄마다 왼쪽 끝이 달라서, 둘째 줄이 조금만 길어도
       "중간에서 시작했다" 로 잘못 읽습니다. 실제로 1440px 에서 쪼개진
       낱말을 그렇게 놓쳤습니다 (390px 에서만 잡혔습니다). */
    const ta = getComputedStyle(el).textAlign;
    const mid = (ta === "left" || ta === "start") &&
                lefts[0] > Math.min(...lefts) + 1;
    if (rects.length <= toks.length + (mid?1:0)) continue;
    out.wrap.push(t.slice(0,30)+" ("+toks.length+"낱말 "+rects.length+"줄)");
  }
  /* 7-2. grid 칸에서 **글이 딴 칸으로 튀는가**
     ⚠️ 이 버그를 세 번 만들었습니다. display:grid 인 칸에 글을 그냥
     넣고 그 안에 <b> 를 쓰면 <b> 가 딴 칸이 됩니다. 칸 수를 넘으면
     다음 줄로 넘어가서 "최대 세 곳" 과 "입니다." 가 다른 줄에 앉고,
     칸이 좁으면 글자가 한 자씩 세로로 쪼개집니다. 에러도 안 나고
     JS 도 멀쩡해서 다른 검사에 안 걸립니다.

     ⚠️ "아이콘 + 글" 은 정상입니다 (칸 두 개에 항목 두 개). 문제는
     **항목 수가 칸 수를 넘는데 그중에 맨글이 섞여 있을 때**입니다.
     고치는 법은 하나 — 글 전체를 <span> 하나로 감싸세요.
     일부러 그렇게 둔 곳에는 class 에 'g-mix' 를 다세요. */
  document.querySelectorAll("body *").forEach(el => {
    if (!vis(el)) return;
    const c = getComputedStyle(el);
    if (c.display !== "grid" && c.display !== "inline-grid") return;
    if (String(el.className).indexOf("g-mix") >= 0) return;
    const tpl = c.gridTemplateColumns;
    /* ⚠️ 여기서 정규식을 쓰지 마세요. 이 검사는 **템플릿 문자열 안**에
       들어 있어서 백슬래시-s 가 그냥 s 로 바뀝니다 — 두 번 당했습니다.
       계산된 값은 항상 공백으로 나뉘므로 문자열 split 이면 됩니다. */
    const tracks = (!tpl || tpl === "none")
      ? 1 : tpl.trim().split(" ").filter(Boolean).length;
    let text = 0, items = 0;
    el.childNodes.forEach(n => {
      if (n.nodeType === 3 && n.nodeValue.trim()) { text++; items++; }
      else if (n.nodeType === 1) {
        const cs = getComputedStyle(n);
        if (cs.position !== "absolute" && cs.position !== "fixed" && cs.display !== "none") items++;
      }
    });
    if (text > 0 && items > tracks)
      out.mix.push(String(el.className || el.tagName).split(" ")[0] +
        "|칸"+tracks+"에 항목"+items+"|" + (el.textContent||"").trim().slice(0,20));
  });

  /* 7-3. 문장 **한가운데**에 덩어리(block/flex/grid)가 끼어 있는가
     ⚠️ CSS 선택자를 넓게 쓰다가 네 번 겪었습니다. ".notice-bad b" 처럼
     자식 기호 없이 쓰면 제목용 <b> 뿐 아니라 **문장 안의 <b> 까지** 덩어리가
     되어 그 낱말만 딴 줄에 앉습니다. "적어 주신 내용은 / 그대로 남아
     있습니다. / 잠시 뒤 …" 처럼요.
     ⚠️ 고치는 법은 자식 기호 하나입니다. 일부러 그런 곳은 class 에 'g-mix'. */
  document.querySelectorAll("b, strong, em, i, span, a, code").forEach(el => {
    if (!vis(el)) return;
    if (String(el.className).indexOf("g-mix") >= 0) return;
    const d = getComputedStyle(el).display;
    if (d !== "block" && d !== "flex" && d !== "grid") return;
    const par = el.parentElement; if (!par) return;
    if (String(par.className).indexOf("g-mix") >= 0) return;
    const pd = getComputedStyle(par).display;
    if (pd === "grid" || pd === "inline-grid" || pd === "flex" || pd === "inline-flex") return;
    let text = 0;
    par.childNodes.forEach(n => { if (n.nodeType === 3 && n.nodeValue.trim()) text++; });
    if (text > 0)
      out.mix.push(el.tagName.toLowerCase()+"."+String(el.className||par.className||"").split(" ")[0]+
        "|문장 속 "+d+"|"+(el.textContent||"").trim().slice(0,18));
  });

  /* 8. br.br-m 이 좁은 화면에서 사라질 때 앞뒤 낱말이 붙는가
     ⚠️ 이건 **가로 스크롤도 에러도 안 나고 화면도 멀쩡합니다.** 글자만
     "차리는 데알아볼 게" 로 붙습니다. 실제로 그렇게 나갔습니다.
     띄어쓰기는 br 뒤에 둡니다 — 줄바꿈 다음 공백은 넓은 화면에서
     브라우저가 지우므로 표가 안 납니다. */
  document.querySelectorAll("br.br-m").forEach(br => {
    if (getComputedStyle(br).display !== "none") return;
    const pv = br.previousSibling, nx = br.nextSibling;
    const a = (pv && pv.nodeType === 3) ? pv.nodeValue : "";
    const z = (nx && nx.nodeType === 3) ? nx.nodeValue : "";
    if (/\\s$/.test(a) || /^\\s/.test(z)) return;
    out.glue.push(a.trim().slice(-8) + "↔" + z.trim().slice(0,8));
  });
  /* 9. 화면마다 제목(h1)이 **딱 하나** 있는가
     ⚠️ 없으면 읽어 주는 프로그램 사용자가 "여기가 어디인지" 를 못
     잡고, 구글도 화면의 주제를 못 잡습니다. 여러 개면 무엇이 주제인지
     알 수 없습니다. 화면을 새로 만들 때 제일 자주 빠뜨립니다. */
  {
    /* ⚠️ 404.html 은 라우터 밖에서 혼자 뜨는 화면이라 #view 가 없습니다.
       그래서 #view 가 없으면 main 에서 셉니다 — 안 그러면 "제목이
       없다" 는 오탐이 납니다. */
    const root = document.getElementById("view") || document.querySelector("main") || document.body;
    const h1 = [...root.querySelectorAll("h1")].filter(vis);
    if (h1.length !== 1)
      out.h1.push(h1.length === 0 ? "제목(h1)이 없습니다" : "제목(h1)이 "+h1.length+"개입니다");
  }
  out.over = document.documentElement.scrollWidth > W + 1;
  out.links = [...document.querySelectorAll('a[href^="/"]')].map(a=>a.getAttribute("href"));
  return out;
})()`;

(async () => {
  await new Promise(r=>server.listen(PORT,r));
  const b = await chromium.launch();

  // 폰에서 접어 두는 칸(`.m-fold-c`)과 스크롤하면 드러나는 구간
  // (`[data-rv]`)은 처음에 안 보입니다. 검사의
  // `vis()` 가 그걸 "안 보이는 것" 으로 보고 건너뛰면 글씨 크기 · 누름 크기 ·
  // 낱말 잘림 검사가 **조용히 헐거워집니다.** 그래서 모든 context 에서
  // 처음부터 드러난 상태로 둡니다 (없애는 게 아니라 끝난 상태로 고정).
  const newCtx = b.newContext.bind(b);
  b.newContext = async (o) => {
    const c = await newCtx(o);
    await c.addInitScript(() => {
      const on = () => {
        const s = document.createElement("style");
        s.textContent = "[data-rv]{opacity:1 !important;transform:none !important;transition:none !important}"
          + ".m-fold-c{display:block !important}";
        (document.head || document.documentElement).appendChild(s);
      };
      if (document.readyState === "loading")
        document.addEventListener("DOMContentLoaded", on, { once:true });
      else on();
    });
    return c;
  };
  let fail = 0;
  const seenLinks = new Set();

  for (const [w,h,vn] of VIEWS) {
    const ctx = await b.newContext({ viewport:{width:w,height:h} });
    const p = await ctx.newPage();
    const errs = [], miss = [];
    p.on("pageerror", e => errs.push(e.message));
    p.on("requestfailed", r => {
      const u = r.url();
      if (!/pretendard|cdn\.jsdelivr/.test(u)) miss.push(u.split("/").pop());
    });

    const bad = { small:[], tap:[], wrap:[], bad:[], glue:[], mix:[], h1:[], dim:[], over:[] };
    for (const [hash, name] of PAGES) {
      await p.goto(ROOT + hash, { waitUntil:"load" });
      await p.waitForTimeout(280);
      const a = await p.evaluate(AUDIT);
      a.links.forEach(l => seenLinks.add(l));
      if (a.over) bad.over.push(name);
      ["small","tap","wrap","bad","glue","mix","h1","dim"].forEach(k =>
        a[k].forEach(x => bad[k].push(name+" › "+x)));
    }

    const uniq = a => [...new Set(a)];
    const rows = [
      ["JS 에러",            errs],
      ["못 불러온 파일",      uniq(miss)],
      ["가로 스크롤",        bad.over],
      ["12px 미만 글씨",     uniq(bad.small)],
      ["글자가 바탕에 묻힘",  uniq(bad.dim)],
      ["40px 미만 누름",     uniq(bad.tap)],
      ["낱말 가운데 잘림",   uniq(bad.wrap)],
      ["줄바꿈 사라져 낱말 붙음", uniq(bad.glue)],
      ["grid 칸에 글과 태그가 섞임", uniq(bad.mix)],
      ["화면 제목(h1)", uniq(bad.h1)],
      ["개발자 말 노출",     uniq(bad.bad)]
    ];
    console.log("\n── " + vn + " (" + w + "px)");
    rows.forEach(([n,v]) => {
      if (v.length) { fail++; console.log("  ❌ "+n+" "+v.length+"건: "+v.slice(0,4).join(" / ")); }
      else console.log("  ✅ "+n);
    });
    await ctx.close();
  }

  /* 7. 링크가 실제로 열리는지 — 죽은 주소는 손님에게 고장입니다 */
  const ctx = await b.newContext({ viewport:{width:1280,height:900} });
  const p = await ctx.newPage();
  const dead = [];
  for (const l of [...seenLinks]) {
    await p.goto(ROOT + l, { waitUntil:"load" });
    await p.waitForTimeout(220);
    const st = await p.evaluate(() => ({
      empty: ((document.getElementById("view")||{textContent:""}).textContent||"").trim().length < 30
    }));
    if (st.empty) dead.push(l+" (빈 화면)");
  }
  console.log("\n── 링크 " + seenLinks.size + "개");
  if (dead.length) { fail++; console.log("  ❌ 안 열리는 주소 "+dead.length+"건: "+dead.slice(0,6).join(" / ")); }
  else console.log("  ✅ 전부 열림");

  /* 8. 주소가 화면에 실제로 반영되는가
     ⚠️ 해시를 읽던 자리가 남으면 **에러 없이 조용히 틀린 답**을 냅니다.
     화면은 그려지니 위의 검사들은 다 통과합니다 — 그래서 따로 봅니다. */
  const NAV = [
    ["/startup",   "헤더 메뉴 켜짐",
      () => !!document.querySelector('#gnb a.on[data-to="/startup"]')],
    ["/closure",   "헤더 메뉴 켜짐",
      () => !!document.querySelector('#gnb a.on[data-to="/closure"]')],
    ["/startup/cafe", "속화면에서도 부모 메뉴가 켜짐",
      () => !!document.querySelector('#gnb a.on[data-to="/startup"]')],
    ["/providers", "아래 네비 켜짐",
      () => !!document.querySelector('.mnav a.on[data-to="/providers"]')],
    ["/stores",    "아래 네비는 제일 가까운 칸",
      () => !!document.querySelector('.mnav a.on[data-to="/providers"]')],
    ["/",          "아래 네비 홈",
      () => !!document.querySelector('.mnav a.on[data-to="/"]')],
    ["/closure/gym", "아래 네비 폐업",
      () => !!document.querySelector('.mnav a.on[data-to="/closure"]')],
    /* 주소에 실린 조건이 화면에 그대로 반영되는가 — 끊기면 손님은
       같은 것을 두 번 적게 되고 거기서 닫습니다. */
    ["/quote?c=interior&s=duct&i=cafe&r=gyeonggi&side=start",
      "견적 요청에 조건이 채워짐",
      () => document.getElementById("q-what").value.indexOf("닥트") >= 0
         && document.getElementById("q-ind").value === "cafe"
         && document.getElementById("q-reg").value === "gyeonggi"
         && document.getElementById("q-side").value === "start"],
    ["/providers/interior?s=duct", "고른 하위 분류 칩이 켜짐",
      () => !!document.querySelector('.chip.on')],
    ["/assets?i=gym", "업종을 고르면 그 업종 장비 칩이 나옴",
      () => document.getElementById("fil-i").value === "gym"
         && document.body.textContent.indexOf("운동기구") >= 0],
    ["/startup/cafe", "업종별 장비가 그 업종 것으로 바뀜",
      () => document.body.textContent.indexOf("커피머신") >= 0
         && document.body.textContent.indexOf("미용의자") < 0],
    ["/startup/hair", "다른 업종이면 다른 장비가 나옴",
      () => document.body.textContent.indexOf("미용의자") >= 0
         && document.body.textContent.indexOf("커피머신") < 0],
    ["/closure/gym", "폐업도 업종마다 다름",
      () => document.body.textContent.indexOf("운동기구") >= 0],
    ["/startup/nope-없는업종", "없는 업종은 404 로",
      () => document.body.textContent.indexOf("찾으시는 페이지가 없습니다") >= 0]
  ];
  const navBad = [];
  const np = await (await b.newContext({ viewport:{width:390,height:900} })).newPage();
  for (const [url, what, fn] of NAV) {
    await np.goto(ROOT + url, { waitUntil:"load" });
    await np.waitForTimeout(220);
    let ok = false;
    try { ok = await np.evaluate("("+fn.toString()+")()"); } catch(e){ ok = false; }
    if (!ok) navBad.push(url+" › "+what);
  }
  console.log("\n── 주소가 화면에 반영되는가 " + NAV.length + "개");
  if (navBad.length) { fail++; console.log("  ❌ "+navBad.length+"건: "+navBad.join(" / ")); }
  else console.log("  ✅ 전부 맞음");

  /* ── 흐름 검사 ─────────────────────────────────────────────
     화면 하나하나가 그려지는 것과, **눌렀을 때 다음 화면으로 값이
     넘어가는 것**은 다릅니다. 끊기면 손님은 같은 것을 두 번 적게
     되고 거기서 닫습니다.

     ⚠️ 이 검사들은 **백틱 문자열**로 브라우저에 건네집니다. 백슬래시-s
     를 쓰면 그냥 s 가 됩니다 — 정규식이 필요하면 백슬래시를 두 번
     쓰거나 문자열 split 으로 피하세요. 주석 안에 백틱도 금지입니다. */
  const flowBad = [];
  const fp = await (await b.newContext({ viewport:{width:1280,height:900} })).newPage();
  const f = async (name, url, body) => {
    await fp.goto(ROOT + url, { waitUntil:"load" });
    await fp.waitForTimeout(240);
    let ok;
    try{ ok = await fp.evaluate("(async()=>{ " + body + " })()"); }
    catch(e){ ok = "에러 " + e.message; }
    if (ok !== true) flowBad.push(name + (typeof ok === "string" ? " (" + ok + ")" : ""));
  };

  /* ① 지어낸 것이 화면에 없는가 — 이 플랫폼에서 제일 중요한 검사입니다.
     업체 · 브랜드 · 매물이 0 인데 카드가 그려져 있으면 그건 없는 회사를
     광고하는 것이고 표시광고법 제3조 위반입니다. */
  await f("업체가 0곳이면 업체 카드를 만들지 않는다", "/providers/interior", `
    const n = document.querySelectorAll(".pv").length;
    if(n > 0 && (window.AM_PROVIDERS||[]).length === 0)
      return "등록 0곳인데 업체 카드가 " + n + "장 있습니다";
    return true;`);
  await f("브랜드가 0개면 브랜드 카드를 만들지 않는다", "/franchise/cafe", `
    const n = document.querySelectorAll(".fr").length;
    if(n > 0 && (window.AM_FRANCHISES||[]).length === 0)
      return "등록 0개인데 브랜드 카드가 " + n + "장 있습니다";
    return true;`);
  await f("매물이 0건이면 매물 카드를 만들지 않는다", "/stores", `
    const n = document.querySelectorAll(".mk").length;
    if(n > 0 && (window.AM_STORES||[]).length === 0)
      return "등록 0건인데 매물 카드가 " + n + "장 있습니다";
    return true;`);
  await f("평점은 후기에서 계산한다 (값으로 저장하지 않는다)", "/providers", `
    const bad = (window.AM_PROVIDERS||[]).filter(function(p){
      return p.rating !== undefined || p.reviewCount !== undefined; });
    if(bad.length) return "Provider 에 평점/후기수가 값으로 박혀 있습니다";
    const s = window.amProviderStats({ reviews:[], portfolio:[] });
    if(s.rating !== null) return "후기가 없는데 평점이 null 이 아닙니다";
    const s2 = window.amProviderStats({ reviews:[{score:{total:4}},{score:{total:5}}] });
    if(s2.rating !== 4.5) return "후기 평균이 틀립니다 (" + s2.rating + ")";
    return true;`);
  await f("지어낸 실적 숫자가 메인에 없다", "/", `
    const t = document.getElementById("view").textContent;
    const bad = [];
    if(/[0-9][0-9,]*\\s*\\+\\s*(곳|개|명|건)/.test(t)) bad.push("n+ 꼴");
    if(t.indexOf("만족도") >= 0) bad.push("만족도");
    if(t.indexOf("누적") >= 0) bad.push("누적");
    if(/평점\\s*[0-9]/.test(t)) bad.push("평점");
    if(/(등록\\s*업체|입점\\s*업체|누적\\s*거래)\\s*[0-9]/.test(t)) bad.push("업체 수");
    return bad.length ? bad.join(" · ") + " 가 있습니다" : true;`);

  /* ② 업종에 따라 실제로 다른 것이 보이는가 (§59 Q2 · Q3) */
  await f("카페와 미용실은 서로 다른 장비가 보인다", "/startup/cafe", `
    const t = document.getElementById("view").textContent;
    if(t.indexOf("커피머신") < 0) return "카페인데 커피머신이 없습니다";
    if(t.indexOf("샴푸대") >= 0)  return "카페인데 미용 장비가 보입니다";
    return true;`);
  await f("음식점과 헬스장은 서로 다른 것을 정리한다", "/closure/gym", `
    const t = document.getElementById("view").textContent;
    if(t.indexOf("운동기구") < 0) return "헬스장인데 운동기구가 없습니다";
    if(t.indexOf("주방기기") >= 0) return "헬스장인데 주방기기가 보입니다";
    return true;`);
  await f("업종 차례에서 빠진 분류도 잘라 내지 않는다", "/startup/online", `
    const all = (window.AM_START_CATS||[]).length;
    const got = window.amCatsFor("online","start").length;
    if(got !== all) return "분류 " + all + "개 중 " + got + "개만 나옵니다";
    return true;`);

  /* ③ 조건이 다음 화면으로 넘어가는가 */
  await f("분류 → 견적 요청으로 조건이 넘어간다", "/providers/interior?i=cafe&r=gyeonggi", `
    const a = document.querySelector('a[href^="/quote"]');
    if(!a) return "견적 요청으로 가는 링크가 없습니다";
    const h = a.getAttribute("href");
    if(h.indexOf("i=cafe") < 0 || h.indexOf("r=gyeonggi") < 0)
      return "고른 조건이 주소에 안 실립니다 (" + h + ")";
    return true;`);
  await f("업종 화면 → 견적 요청에 업종이 실린다", "/startup/hair", `
    const a = document.querySelector('a[href^="/quote"]');
    if(!a) return "견적 요청 링크가 없습니다";
    return a.getAttribute("href").indexOf("i=hair") >= 0 ? true
         : "업종이 안 실립니다 (" + a.getAttribute("href") + ")";`);
  await f("거르개를 바꾸면 주소가 바뀐다", "/providers/interior", `
    document.getElementById("fil-r").value = "seoul";
    window.pcGo("interior");
    await new Promise(r => setTimeout(r, 200));
    return location.search.indexOf("r=seoul") >= 0 ? true
         : "주소에 안 실렸습니다 (" + location.search + ")";`);

  /* ④ 접수 — ⚠️ 동의 없이 받은 개인정보는 개인정보보호법 제15조
     위반입니다. 화면에서 한 번, 서버(api/quote.js)에서 한 번 막습니다. */
  await f("견적: 동의 없이는 보내지 않는다", "/quote", `
    let sent = false;
    const o = window.fetch; window.fetch = function(){ sent = true; return o.apply(this, arguments); };
    document.getElementById("q-what").value = "카페 인테리어";
    document.getElementById("q-q").value = "30평 신규 오픈입니다";
    document.getElementById("q-name").value = "홍길동";
    document.getElementById("q-tel").value = "010-1234-5678";
    document.getElementById("q-ag").checked = false;
    try{ window.quoteSend({ preventDefault:function(){} }); }catch(e){}
    await new Promise(r => setTimeout(r, 120));
    window.fetch = o;
    return sent ? "동의 없이 보냈습니다" : true;`);
  await f("견적: 동의하면 적은 칸이 빠짐없이 나간다", "/quote", `
    let body = null;
    const o = window.fetch;
    window.fetch = function(u, i){ try{ body = JSON.parse(i.body); }catch(e){}
      return Promise.resolve({ ok:true, json:function(){ return Promise.resolve({}); } }); };
    document.getElementById("q-what").value = "카페 인테리어";
    document.getElementById("q-q").value = "30평 신규 오픈입니다";
    document.getElementById("q-name").value = "홍길동";
    document.getElementById("q-tel").value = "010-1234-5678";
    document.getElementById("q-ind").value = "cafe";
    document.getElementById("q-reg").value = "gyeonggi";
    document.getElementById("q-py").value = "30";
    document.getElementById("q-ag").checked = true;
    try{ window.quoteSend({ preventDefault:function(){} }); }catch(e){}
    await new Promise(r => setTimeout(r, 200));
    window.fetch = o;
    if(!body) return "보내지 않았습니다";
    if(body.agree !== true) return "동의 표시가 안 실렸습니다";
    if(!body.serviceName || !body.q || !body.name || !body.tel) return "필수 칸이 빠졌습니다";
    if(!body.detail || body.detail["업종"] !== "카페 · 디저트") return "업종이 안 실렸습니다";
    if(body.detail["평수"] !== "30") return "평수가 안 실렸습니다";
    return true;`);
  await f("입점: 업체명이 없으면 안 보낸다", "/join", `
    let sent = false;
    const o = window.fetch; window.fetch = function(){ sent = true; return o.apply(this, arguments); };
    document.getElementById("jn-ag").checked = true;
    try{ window.joinSend({ preventDefault:function(){} }); }catch(e){}
    await new Promise(r => setTimeout(r, 120));
    window.fetch = o;
    return sent ? "업체명 없이 보냈습니다" : true;`);
  /* ⚠️ 업체에 연락처를 넘기는 것은 이 동의에 포함되지 않습니다
     (개인정보보호법 제17조). 이 문장을 지우면 안 됩니다. */
  await f("동의 상자에 제3자 제공이 빠져 있다고 적혀 있다", "/quote", `
    const t = document.querySelector(".agree").textContent;
    if(t.indexOf("수집 항목") < 0) return "수집 항목이 없습니다";
    if(t.indexOf("이용 목적") < 0) return "이용 목적이 없습니다";
    if(t.indexOf("보유 기간") < 0) return "보유 기간이 없습니다";
    if(t.indexOf("포함되지 않습니다") < 0) return "업체 전달이 빠져 있다는 말이 없습니다";
    return true;`);

  /* ⑤ MY — ⚠️ 성함 · 연락처를 이 브라우저에 담지 않습니다 */
  await f("MY: 고른 것이 남는다", "/my", `
    try{ localStorage.clear(); }catch(e){}
    document.getElementById("my-side").value = "start";
    document.getElementById("my-ind").value = "cafe";
    document.getElementById("my-reg").value = "gyeonggi";
    document.getElementById("my-py").value = "30";
    window.myPut();
    await new Promise(r => setTimeout(r, 200));
    const p = JSON.parse(localStorage.getItem("am.profile.v1") || "{}");
    if(p.industry !== "cafe" || p.side !== "start") return "안 남았습니다";
    if(document.getElementById("view").textContent.indexOf("카페") < 0)
      return "화면에 안 비칩니다";
    return true;`);
  await f("MY: 성함 · 연락처를 담지 않는다", "/quote", `
    let dump = "";
    try{ for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i); dump += k + "=" + localStorage.getItem(k) + " "; } }
    catch(e){ return true; }
    if(dump.indexOf("홍길동") >= 0) return "성함이 남았습니다";
    if(dump.replace(/[^0-9]/g,"").indexOf("01012345678") >= 0) return "연락처가 남았습니다";
    return true;`);
  await f("견적 비교: 적은 것이 남고 지워진다", "/quote", `
    try{ localStorage.clear(); }catch(e){}
    window.qcAdd();
    await new Promise(r => setTimeout(r, 200));
    window.qcSet(0, "company", "가나건설");
    window.qcSet(0, "price", "3000");
    const a = JSON.parse(localStorage.getItem("am.quotes.v1") || "[]");
    if(!a.length || a[0].company !== "가나건설") return "안 남았습니다";
    window.qcDel(0);
    await new Promise(r => setTimeout(r, 200));
    const b2 = JSON.parse(localStorage.getItem("am.quotes.v1") || "[]");
    return b2.length === 0 ? true : "안 지워졌습니다";`);

  /* ⑥ 검색 — ⚠️ 새 데이터를 만들면 색인에도 넣으세요 */
  await f("검색이 분류 · 하위분류 · 업종을 같이 찾는다", "/search", `
    const r1 = window.amSearch("인테리어");
    if(!r1.total) return "인테리어를 못 찾습니다";
    const r2 = window.amSearch("철거");
    if(!r2.total) return "철거를 못 찾습니다";
    const r3 = window.amSearch("카페");
    if(!r3.total) return "카페를 못 찾습니다";
    const r4 = window.amSearch("폐업신고");
    if(!r4.total) return "폐업신고를 못 찾습니다";
    return true;`);
  await f("검색: 가는 곳이 같은 줄은 하나만 낸다", "/search", `
    const r = window.amSearch("카페");
    const seen = {}; let dup = 0;
    r.groups.forEach(function(g){ g.rows.forEach(function(x){
      if(seen[x.to]) dup++; seen[x.to] = 1; }); });
    return dup ? dup + "개가 같은 곳으로 갑니다" : true;`);
  await f("검색: 못 찾으면 물어보는 길을 준다", "/search?q=zzzqqq", `
    const a = document.querySelector('#view a[href^="/quote"]');
    return a ? true : "막다른 길입니다";`);

  /* ⑦ 문서 — 중개자 지위는 전자상거래법 제20조 제1항입니다 */
  await f("푸터에 중개자 지위가 적혀 있다", "/", `
    const t = document.querySelector(".ft-role").textContent;
    if(t.indexOf("통신판매중개자") < 0) return "중개자라는 말이 없습니다";
    if(t.indexOf("당사자가 아닙니다") < 0) return "거래 당사자가 아니라는 말이 없습니다";
    return true;`);
  await f("약관에 고기 플랫폼 문구가 남아 있지 않다", "/terms", `
    const t = document.getElementById("view").textContent;
    const bad = ["고깃집","정육점","축산","육류 공급"].filter(function(w){ return t.indexOf(w) >= 0; });
    return bad.length ? bad.join(" · ") + " 가 남아 있습니다" : true;`);
  await f("매물 화면이 적힌 값의 출처를 밝힌다", "/stores", `
    const t = document.getElementById("view").textContent;
    if(t.indexOf("올리신 사장님이 적은 값") < 0) return "누가 적은 값인지 안 밝힙니다";
    if(t.indexOf("거래 당사자가 아닙니다") < 0) return "중개자 지위가 없습니다";
    return true;`);

  /* ⑧ 메인 Split Hero — 첫 화면의 주인공은 **두 낱말**입니다 (§2)
     ⚠️ 이건 "보기 좋은가" 를 재는 검사가 아닙니다. 나중에 여기에
     설명 · 검색창 · 숫자를 하나씩 더하다 보면 두 낱말이 조용히
     작아지는데, 그걸 막는 것이 목적입니다. */
  await f("히어로의 주인공이 창업 · 폐업 두 낱말이다", "/", `
    const n = [].slice.call(document.querySelectorAll(".shero .sh-n"));
    if(n.length !== 2) return "큰 낱말이 " + n.length + "개입니다";
    const t = n.map(function(e){ return e.textContent.trim(); });
    if(t[0] !== "창업" || t[1] !== "폐업") return t.join(" · ") + " 입니다";
    const px = parseFloat(getComputedStyle(n[0]).fontSize);
    if(px < 56) return "글씨가 " + Math.round(px) + "px 입니다 (56px 이상)";
    const h = document.querySelector(".shero").getBoundingClientRect().height;
    if(h < innerHeight * 0.6) return "히어로가 " + Math.round(h) + "px 입니다";
    return true;`);
  await f("히어로에 지어낸 숫자 · 잔 요소를 더하지 않았다", "/", `
    const s = document.querySelector(".shero");
    const t = s.textContent;
    const pat = [[/\\d[\\d,]*\\s*\\+/, "n+ 꼴"], [/만족도/, "만족도"], [/누적/, "누적"],
                 [/업체\\s*\\d/, "업체 수"], [/\\d+\\s*만\\s*명/, "회원 수"]];
    for(const q of pat){ if(q[0].test(t)) return q[1] + " 가 있습니다"; }
    if(s.querySelectorAll("input,select,textarea").length)
      return "적는 칸이 생겼습니다 — 히어로에서 고르는 것은 둘뿐입니다";
    const a = s.querySelectorAll("a");
    if(a.length !== 2) return "누를 곳이 " + a.length + "개입니다 (창업 · 폐업 둘)";
    return true;`);
  await f("창업과 폐업을 색으로 가르지 않는다", "/", `
    const v = [".sh-start .sh-v", ".sh-close .sh-v"].map(function(q){
      const e = document.querySelector(q.split(" ")[0] + " .sh-v");
      return e ? getComputedStyle(e).backgroundImage + getComputedStyle(e).backgroundColor : ""; });
    for(const bg of v){
      const m = bg.match(/rgba?\\((\\d+), ?(\\d+), ?(\\d+)/g) || [];
      for(const c of m){
        const p = c.match(/(\\d+), ?(\\d+), ?(\\d+)/);
        const r = +p[1], g = +p[2], b2 = +p[3];
        if(r > 150 && g < 90 && b2 < 90) return "빨강이 있습니다 " + c;
        if(g > 150 && r < 90 && b2 < 120) return "초록이 있습니다 " + c;
      }
    }
    return true;`);

  /* ⑨ 규모감 숫자 — **센 값**이어야 합니다
     ⚠️ 여기가 이 플랫폼에서 숫자를 크게 띄우는 유일한 자리라, 나중에
     "183 을 300 으로 고쳐 두면 커 보이겠다" 가 제일 쉽게 벌어지는
     곳입니다. 화면의 숫자를 데이터에서 다시 세어 맞춰 봅니다. */
  await f("규모감 숫자가 손으로 쓴 값이 아니라 센 값이다", "/", `
    const n = [].slice.call(document.querySelectorAll(".scale-n"))
      .map(function(e){ return parseInt(e.textContent.trim(), 10); });
    if(n.length !== 4) return "숫자 칸이 " + n.length + "개입니다";
    const want = [
      (window.AM_INDUSTRIES || []).length,
      (window.AM_START_CATS || []).length,
      (window.AM_CLOSE_CATS || []).length,
      (window.AM_CATS || []).reduce(function(a, c){
        return a + ((c.items || []).length); }, 0)
    ];
    for(let i = 0; i < 4; i++)
      if(n[i] !== want[i])
        return i + "번째가 화면 " + n[i] + " · 실제 " + want[i] + " 입니다";
    return true;`);
  await f("규모감 숫자가 무엇을 센 값인지 밝힌다", "/", `
    const s = document.querySelector(".scale");
    if(!s) return "구간이 없습니다";
    const t = s.textContent;
    if(t.indexOf("분야의 수") < 0) return "무엇을 센 값인지 안 밝힙니다";
    if(t.indexOf("등록된 업체 수나 거래 실적이 아닙니다") < 0)
      return "업체 수 · 실적이 아니라는 말이 없습니다";
    if(/[0-9][0-9,]*\\s*\\+/.test(t)) return "n+ 꼴이 있습니다 — 센 값은 그냥 센 값입니다";
    return true;`);

  /* ⑩ 자주 묻는 것 · 진행 방법
     ⚠️ 구글은 구조화 데이터가 **화면 내용과 같아야 한다**고 못 박아
     두었습니다. 어긋난 것이 적발되면 리치 결과가 통째로 막힙니다 —
     예전 부산물몰에서 실제로 그랬습니다. */
  await f("FAQ 화면과 구조화 데이터가 같은 것을 말한다", "/faq", `
    const q = [].slice.call(document.querySelectorAll(".faq-q"))
      .map(function(e){ return e.textContent.trim(); });
    if(!q.length) return "화면에 문답이 없습니다";
    const ld = [].slice.call(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(function(e){ try{ return JSON.parse(e.textContent); }catch(err){ return {}; } })
      .filter(function(x){ return x["@type"] === "FAQPage"; })[0];
    if(!ld) return "FAQPage 구조화 데이터가 없습니다";
    const lq = (ld.mainEntity || []).map(function(x){ return x.name; });
    if(lq.length !== q.length)
      return "화면 " + q.length + "개 · 구조화 데이터 " + lq.length + "개";
    for(let i = 0; i < q.length; i++)
      if(lq.indexOf(q[i]) < 0) return "화면에만 있는 질문: " + q[i];
    return true;`);
  await f("FAQ 에 지킬 수 없는 약속이 없다", "/faq", `
    const t = document.getElementById("view").textContent;
    const bad = [];
    if(/[0-9]+\\s*시간\\s*(안|이내)/.test(t))  bad.push("몇 시간 안에");
    if(/[0-9]+\\s*일\\s*(안|이내)/.test(t))    bad.push("며칠 안에");
    if(/당일\\s*(연락|회신|견적)/.test(t))     bad.push("당일 연락");
    if(/보장(합니다|해\\s*드립니다)/.test(t))  bad.push("보장합니다");
    if(/최저가|무조건/.test(t))                bad.push("최저가 · 무조건");
    return bad.length ? bad.join(" · ") + " 가 있습니다" : true;`);
  await f("진행 방법이 세 걸음을 넘지 않는다", "/", `
    const n = document.querySelectorAll(".how-i").length;
    if(!n) return "진행 방법 구간이 없습니다";
    if(n > 3) return n + "걸음입니다 — 넷이 되면 절차로 읽힙니다";
    const t = document.querySelector(".how-g").textContent;
    if(/[0-9]+\\s*시간\\s*(안|이내)/.test(t)) return "몇 시간 안에 가 있습니다";
    return true;`);

  /* ⑪ 정보 글 — 근거를 댈 수 있는 것만 씁니다 (§45)
     ⚠️ 여기가 지어낸 금액이 제일 쉽게 새어 나오는 자리입니다. "철거비
     평당 5만원" 을 적으면 사장님이 그 숫자로 예산을 잡고 업체와
     싸웁니다. */
  await f("정보 글에 지어낸 금액 · 비율이 없다", "/content", `
    const bad = [];
    for(const c of (window.AM_CONTENTS || [])){
      const t = (c.body || []).map(function(b){
        return [b.h || ""].concat(b.p || [], b.ul || []).join(" "); }).join(" ") +
        " " + (c.lead || "");
      if(/[0-9][0-9,]*\\s*(만원|억원|천원)/.test(t))
        bad.push(c.slug + " 금액");
      /* 법정 기간(30일 · 1년 · 15시간)은 지어낸 값이 아닙니다.
         퍼센트는 우리가 댈 근거가 없으므로 전부 잡습니다. */
      if(/[0-9]+\\s*%/.test(t)) bad.push(c.slug + " 비율");
      if(/평당|평 ?당/.test(t) && /[0-9]/.test(t)) bad.push(c.slug + " 평단가");
    }
    return bad.length ? bad.join(" · ") : true;`);
  await f("정보 글이 어디서 확인하는지 같이 적는다", "/content", `
    const bad = [];
    for(const c of (window.AM_CONTENTS || [])){
      const src = c.source || [];
      if(!src.length){ bad.push(c.slug + " 확인처 없음"); continue; }
      for(const s of src)
        if(!s.where) bad.push(c.slug + " → " + s.name + " 의 확인처가 빔");
    }
    return bad.length ? bad.join(" · ") : true;`);
  await f("정보 글 화면에 별표가 글자로 남지 않는다", "/content/wonsang-bokgu-beomwi", `
    const t = document.querySelector(".read").textContent;
    if(t.indexOf("**") >= 0) return "별표가 글자로 찍혔습니다";
    if(!document.querySelector(".read b")) return "굵게가 하나도 안 살았습니다";
    /* 작성 표시는 주석에만 둡니다 — 손님 화면에 나가면 안 됩니다 */
    if(/⚠️|TODO|지시서/.test(t)) return "작성 표시가 남았습니다";
    return true;`);

  /* ⑫ 글이 흐름에 이어져 있는가
     ⚠️ 글을 써 놓고 목록에만 두면 **없는 것과 같습니다.** 손님은
     목록을 뒤지지 않고, 막힌 그 자리에서 답을 찾습니다. 실제로
     여덟 편을 쓰고 `/content` 와 검색에만 두었습니다. */
  await f("막히는 자리에서 그 자리 글이 보인다", "/providers/restore", `
    const b = document.querySelector(".rd-l");
    if(!b) return "읽을 것 구간이 없습니다";
    const t = [].slice.call(b.querySelectorAll("b")).map(function(e){
      return e.textContent.trim(); });
    if(!t.length) return "글이 하나도 없습니다";
    /* 분류가 맞는 글이 **맨 앞**이어야 합니다 — 원상복구 화면에
       사업자등록 글이 위에 오면 엉뚱한 데로 보내는 것입니다 */
    if(t[0].indexOf("원상복구") < 0) return "맨 앞이 '" + t[0] + "' 입니다";
    const a = b.querySelector("a");
    if(!/^\\/content\\//.test(a.getAttribute("href"))) return "글로 안 갑니다";
    return true;`);
  await f("맞는 글이 없으면 구간을 아예 안 낸다", "/providers/marketing", `
    /* ⚠️ 이 화면에 마케팅 글은 없습니다. 그래도 창업 글이 나오는 것은
       맞습니다 — 없는데 "준비 중" 을 찍는 것만 아니면 됩니다. */
    const b = document.querySelector(".rd-l");
    const t = document.getElementById("view").textContent;
    if(/준비 ?중입니다|곧 공개|coming/i.test(t)) return "자리표시자가 있습니다";
    if(b && !b.querySelector("a")) return "빈 구간이 나왔습니다";
    return true;`);

  /* ⑬ 창업 = 과정 (§7) · 폐업 = 무엇을 원하시는가 (§8)
     ⚠️ 둘 다 **분류를 잘라 내면** 그 기능이 그 손님에게는 없는 것이
     됩니다. 개수를 세는 것이 이 검사의 전부입니다. */
  await f("창업 단계에 분류가 하나도 안 빠진다", "/startup/cafe", `
    const cards = document.querySelectorAll(".stp-i").length;
    const all = (window.AM_START_CATS || []).length;
    if(!cards) return "단계 구간이 없습니다";
    if(cards !== all) return "화면 " + cards + "개 · 분류 " + all + "개";
    const steps = [].slice.call(document.querySelectorAll(".stp-n"))
      .map(function(e){ return e.textContent.trim(); });
    if(steps.length < 3) return "단계가 " + steps.length + "개입니다";
    if(steps[0].indexOf("01") < 0) return "첫 단계가 01 이 아닙니다";
    return true;`);
  await f("창업 단계 안에서도 업종이 갈린다", "/startup/cafe", `
    /* 카페 3단계(채우기)에 커피머신이 보여야 업종을 안다는 뜻입니다 */
    const t = document.querySelector(".stp-l").textContent;
    if(t.indexOf("커피머신") < 0) return "카페인데 커피머신이 없습니다";
    return true;`);
  await f("폐업: 무엇을 원하는지 먼저 묻는다", "/closure", `
    const w = document.querySelectorAll(".wnt").length;
    if(w < 3) return "고를 것이 " + w + "개입니다";
    const a = document.querySelector(".wnt");
    if(!/\\?w=/.test(a.getAttribute("href"))) return "고르면 주소에 안 실립니다";
    return true;`);
  await f("폐업: 고른 것에 없는 분류도 안 숨긴다", "/closure/cafe?w=fast", `
    const on = document.querySelector(".wnt.on");
    if(!on) return "고른 것이 표시가 안 됩니다";
    const shown = document.querySelectorAll(".cat").length;
    const all = (window.amCatsFor ? amCatsFor("cafe", "close") : []).length;
    if(shown !== all) return "화면 " + shown + "개 · 전체 " + all + "개 — 잘라 냈습니다";
    return true;`);

  console.log("\n── 흐름 " + 39 + "개 (지어낸 것 없음 5 · 업종 개인화 3 · 조건 전달 3 · " +
              "접수 4 · MY 3 · 검색 3 · 문서 3 · 메인 히어로 3 · 규모감 2 · FAQ · 진행 3 · " +
              "정보 글 3 · 글 잇기 2 · 창업 과정 · 폐업 선택 4)");
  if (flowBad.length) { fail++; console.log("  ❌ " + flowBad.length + "건: " + flowBad.join(" / ")); }
  else console.log("  ✅ 전부 맞음");

  const hdFrom = flowBad.length;

  /* ── 헤더 ────────────────────────────────────────────────
     ⚠️ 둘 다 **맨 위에서는 멀쩡해 보입니다.** 화면을 내린 채로 찍어
     보고서야 알았습니다 —
      · `position:sticky` 만 적어 두고 감싸개(`#chrome-t`)의 높이가
        헤더와 같으면 sticky 가 붙어 있을 범위가 없어 그냥 올라갑니다.
      · 반투명 헤더는 밑으로 지나가는 글자가 메뉴와 겹쳐 읽힙니다.
     에러도 가로 스크롤도 안 나서 다른 검사는 전부 통과합니다. */
  await f("헤더가 화면을 내려도 붙어 있다", "/", `
    window.scrollTo(0, 900);
    await new Promise(r => setTimeout(r, 250));
    const h = document.querySelector(".hd");
    if(!h) return "헤더가 없습니다";
    const top = Math.round(h.getBoundingClientRect().top);
    window.scrollTo(0, 0);
    return top === 0 || "내렸더니 헤더가 top:" + top + " 로 올라갔습니다";`);
  await f("헤더가 불투명해서 밑의 글자가 안 비친다", "/", `
    const cs = getComputedStyle(document.querySelector(".hd"));
    const m = cs.backgroundColor.split("(")[1] || "";
    const parts = m.split(")")[0].split(",");
    const a = parts.length > 3 ? parseFloat(parts[3]) : 1;
    return a >= 0.99 || "헤더 배경이 반투명합니다 (" + cs.backgroundColor + ")";`);

  /* ⚠️ **카드가 구간 바탕과 같은 색이면 카드가 아닙니다.** 이 저장소는
     카드를 그림자가 아니라 **면**으로 구분합니다 — 흰 구간에서는 옅은
     회색, 회색·색 구간에서는 흰색. 그 목록이 CSS 에 손으로 적혀 있어서
     새 카드를 만들고 빠뜨리면 조용히 사라집니다. 진단 카드(.ckb-c)가
     실제로 그랬습니다. 에러도 안 나고 다른 검사도 전부 통과합니다. */
  await f("카드가 구간 바탕과 같은 색이 아니다", "/", `
    const sel = ".cat,.ind,.pv,.fr,.fc,.mk,.help,.sp,.empty";
    const bad = [];
    [...document.querySelectorAll(sel)].forEach(el => {
      let sec = el.closest("section"); if(!sec) return;
      const cb = getComputedStyle(el).backgroundColor;
      let sb = getComputedStyle(sec).backgroundColor;
      /* 구간이 투명이면 그 위(body)의 색이 실제 바탕입니다 */
      if(sb === "rgba(0, 0, 0, 0)") sb = getComputedStyle(document.body).backgroundColor;
      if(cb === sb) bad.push((el.className || "?").split(" ")[0]);
    });
    return bad.length ? [...new Set(bad)].join(" ") + " 가 구간 바탕과 같은 색입니다" : true;`);

  console.log("\n── 헤더 · 카드 면 3개");
  const hdBad = flowBad.slice(hdFrom);
  if (hdBad.length) { fail++; console.log("  ❌ "+hdBad.length+"건: "+hdBad.join(" / ")); }
  else console.log("  ✅ 붙어 있고 · 불투명하고 · 카드가 구분됩니다");
  await fp.close();

  /* ── 머리말 · 크롤러 본문 (§46) ─────────────────────────────
     ⚠️ **렌더된 DOM 을 보는 검사로는 이 종류를 영영 못 잡습니다.**
     화면을 그리고 나면 `paintMeta()` 가 canonical 을 제 주소로 고쳐
     놓기 때문입니다. 크롤러가 읽는 것은 **고쳐지기 전의 파일**이라,
     여기서는 파일을 그대로 받아서 셉니다. */
  const headBad = [];
  {
    const strip = t => t.replace(/<script[\s\S]*?<\/script>/g,"")
                        .replace(/<style[\s\S]*?<\/style>/g,"")
                        .replace(/<!--[\s\S]*?-->/g,"")
                        .replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
    for (const [url, name] of PAGES) {
      if (url === "/nope") continue;
      /* ⚠️ `noindex` 화면(MY · 검색 · 견적 요청)은 검색에 올리지 않으므로
         크롤러 본문을 요구하지 않습니다. 요구하면 오탐만 쌓입니다. */
      const path = url.split("?")[0];
      if (["/my","/search","/quote"].indexOf(path) >= 0) continue;
      const res = await fetch(ROOT + path).catch(() => null);
      if (!res || !res.ok) { headBad.push(name + ": 파일이 없습니다"); continue; }
      const html = await res.text();

      const can = (html.match(/<link rel="canonical"/g) || []).length;
      if (can !== 1) headBad.push(name + ": canonical 이 " + can + "개");

      const og = /<meta property="og:image" content="https?:\/\//.test(html);
      if (!og) headBad.push(name + ": og:image 가 주소 전체가 아닙니다");

      const ti = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "";
      if (!ti.trim()) headBad.push(name + ": 제목이 비었습니다");
      const de = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
      if (de.trim().length < 30) headBad.push(name + ": 설명이 너무 짧습니다");

      /* ⚠️ 한글은 같은 내용이라도 글자 수가 훨씬 적습니다. 영어 기준으로
         잡았다가 멀쩡한 화면이 전부 걸린 적이 있습니다. */
      const main = (html.match(/<main id="view">([\s\S]*?)<\/main>/) || [])[1] || "";
      const len = strip(main).length;
      if (len < 150) headBad.push(name + ": 크롤러가 읽을 본문이 " + len + "자뿐입니다");

      /* 지어낸 실적이 크롤러 본문에만 들어가면 그게 구글에 나가는 거짓말입니다 */
      const body = strip(main);
      if (/[0-9][0-9,]*\s*\+\s*(곳|개|명|건)/.test(body) || body.indexOf("만족도") >= 0)
        headBad.push(name + ": 크롤러 본문에 지어낸 실적 숫자가 있습니다");
    }
  }
  console.log("\n── 머리말 · 크롤러 본문 " + (PAGES.length - 1) + "개 화면");
  if (headBad.length) { fail++; console.log("  ❌ " + headBad.length + "건: " + headBad.slice(0,8).join(" / ")); }
  else console.log("  ✅ canonical 하나 · og:image 전체주소 · 제목/설명 · 본문 충분");

  /* 10. 알림(토스트)이 보이고 들리는가
     ⚠️ 담기·품절·동의 누락 안내가 **전부 토스트**입니다. 아래 네비에
     가리거나 읽어 주는 프로그램이 못 읽으면, 손님은 담겼는지 아닌지를
     알 방법이 없습니다. 둘 다 화면은 멀쩡해 보여서 위 검사들은 통과합니다. */
  const tstBad = [];
  for (const w of [390, 1440]) {
    const tp = await (await b.newContext({ viewport:{width:w,height:844} })).newPage();
    await tp.goto(ROOT + "/quote", { waitUntil:"load" });
    await tp.waitForTimeout(250);
    await tp.evaluate(() => toast("테스트 알림입니다"));
    await tp.waitForTimeout(200);
    const r = await tp.evaluate(() => {
      const t = document.getElementById("toast");
      if (!t) return { none:true };
      const tr = t.getBoundingClientRect();
      const n = document.querySelector(".mnav");
      const on = n && getComputedStyle(n).display !== "none";
      const nr = on ? n.getBoundingClientRect() : null;
      return {
        over: nr ? Math.max(0, Math.round(tr.bottom - nr.top)) : 0,
        offscreen: Math.round(tr.bottom) > Math.round(innerHeight),
        live: t.getAttribute("aria-live"), role: t.getAttribute("role"),
        shown: getComputedStyle(t).opacity !== "0"
      };
    });
    if (r.none)        tstBad.push(w+"px: 토스트가 안 뜸");
    else {
      if (!r.shown)    tstBad.push(w+"px: 토스트가 안 보임");
      if (r.over > 0)  tstBad.push(w+"px: 아래 네비에 "+r.over+"px 가림");
      if (r.offscreen) tstBad.push(w+"px: 화면 밖으로 나감");
      if (r.role !== "status" || r.live !== "polite")
                       tstBad.push(w+"px: 읽어 주는 프로그램이 못 읽음 (role/aria-live 없음)");
    }
    await tp.close();
  }
  console.log("\n── 알림이 보이고 들리는가");
  if (tstBad.length) { fail++; console.log("  ❌ "+tstBad.length+"건: "+tstBad.join(" / ")); }
  else console.log("  ✅ 두 폭 다 맞음");

  await b.close();
  server.close();
  console.log(fail ? "\n❌ "+fail+"개 항목 실패" : "\n✅ 전체 통과");
  process.exit(fail ? 1 : 0);
})().catch(err => {
  /* ⚠️ 도중에 터지면 **검사를 안 한 것**입니다 — 통과가 아닙니다.
     브라우저가 도중에 닫히면(메모리 부족·강제 종료) Node 가 스택을
     그대로 토해 내는데, 그 화면만 보면 무엇이 잘못됐는지 모릅니다.
     여기서 받아서 사람 말로 적고 **1 로 끝냅니다.**

     ⚠️ `node check.js | tail` 처럼 파이프로 넘기면 끝 숫자가 tail 의
     것이 됩니다. 실패해도 0 으로 읽힙니다 — 파이프 없이 돌리거나
     `; echo EXIT=${PIPESTATUS[0]}` 을 붙이세요. */
  const m = (err && err.message) ? err.message : String(err);
  console.error("\n❌ 검사를 끝내지 못했습니다 — " + m);
  if (m.indexOf("closed") >= 0)
    console.error("   브라우저가 도중에 닫혔습니다. 대개 메모리가 모자란 것입니다 —" +
                  " 다시 돌려 보시고, 계속 그러면 VIEWS 를 줄여서 나눠 돌리세요.");
  process.exit(1);
});

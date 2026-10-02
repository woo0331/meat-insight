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
  /* ⚠️⚠️ **2026-10-01 — `/home` 을 뺐습니다.** 랜딩을 없애면서 그
     화면이 `/` 가 됐고, 옛 주소는 vercel 이 308 로 보냅니다.
     ⚠️ 전에 여기 빠져 있었습니다. 랜딩 CTA 가 도착하는 화면인데도
     PAGES 에 없어서 아무 검사도 안 받고 있었고, 크롤러 본문이 95자로
     나가는 것도 못 잡았습니다. 화면을 만들면 여기 넣으세요. */
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
  ["/content/interior-gyeyak-check","정보 — 인테리어 계약"],
  ["/content/jangbi-sae-junggo-lease","정보 — 장비 새것 중고 리스"],
  ["/content/pos-kiosk-gyeyak",    "정보 — POS 계약"],
  ["/content/jeongchaek-jageum-bojeung","정보 — 정책자금과 보증"],
  ["/content/pyeeop-bugase-gihan", "정보 — 폐업 세무 기한"],
  ["/content/cheolgeo-gyeonjeok-gareuneun-geot","정보 — 철거 견적"],
  ["/content/maejang-yangdo-gyeyak","정보 — 매장 양도"],
  ["/content/gyeyak-haeji-modu",   "정보 — 계약 해지"],
  ["/content/cafe-yeongeop-singo", "정보 — 카페 영업신고"],
  ["/content/eumsikjeom-yeongeop-singo", "정보 — 음식점 영업신고"],
  ["/content/miyong-yeongeop-singo", "정보 — 미용실 신고"],
  ["/content/gym-singo-daesang", "정보 — 헬스장 신고"],
  ["/content/gym-pyeeop-hoewongwon", "정보 — 헬스장 회원권"],
  ["/content/hagwon-pyeeop-gyoseupbi", "정보 — 학원 교습비"],
  ["/content/eumsikjeom-wonsang-bokgu", "정보 — 음식점 원상복구"],
  ["/content/muin-maejang-jeongri", "정보 — 무인매장 정리"],
  ["/content/franchise-vs-dokrip", "정보 — 프랜차이즈냐 개인창업이냐"],
  ["/content/sanggwon-boneun-sunseo", "정보 — 상권 보는 순서"],
  ["/content/gagu-jipgi-sagi-jeone", "정보 — 가구 · 집기"],
  ["/content/georaecheo-cheot-gyeyak", "정보 — 거래처 첫 계약"],
  ["/content/gwanggo-munggu-gyusik", "정보 — 광고 문구 규제"],
  ["/content/cheongso-bangyeok-euimu", "정보 — 청소 · 방역 의무"],
  ["/content/jangbi-nomgil-ttae-nae-geot", "정보 — 장비 넘기기"],
  ["/content/pyeeop-jaego-bugase", "정보 — 폐업 재고와 부가세"],
  ["/content/pyegimul-jeungmyeong", "정보 — 폐기물 증명"],
  ["/content/datum-saenggyeoss-eul-ttae", "정보 — 다툼이 생겼을 때"],
  ["/content/pyeeop-hal-ttae-batneun-geot", "정보 — 폐업 지원 어디를 보나"],
  /* 카페 · 음식점 (2026-10-01) — 업종이 붙은 글입니다 */
  ["/content/cafe-interior-seolbi",    "정보 — 카페 인테리어"],
  ["/content/cafe-jangbi-golgi",       "정보 — 카페 장비"],
  ["/content/cafe-wonsang-bokgu",      "정보 — 카페 원상복구"],
  ["/content/eumsikjeom-jubang-gongsa","정보 — 음식점 주방 공사"],
  ["/content/eumsikjeom-bogeonjeung",  "정보 — 음식점 보건증 · 위생교육"],
  ["/content/eumsikjeom-yangdo-seunggye", "정보 — 음식점 양도와 승계"],
  /* 전 업종 (2026-10-01) — 열세 업종이 창업 · 폐업 둘 다 갖췄습니다.
     ⚠️ **다 넣습니다.** 글마다 틀이 같아 보여도, PAGES 에 없으면 그
     화면은 아무 검사도 안 받습니다 — `/home` 에서 그래서 크롤러 본문이
     95자로 나가는 것을 몇 주 놓쳤습니다. */
  ["/content/jujeom-eopjong-gubun",     "정보 — 주점 업종 구분"],
  ["/content/jujeom-jeongri-juryu",     "정보 — 주점 정리와 주류"],
  ["/content/miyongsil-gongsa-seolbi",  "정보 — 미용실 공사"],
  ["/content/miyongsil-wonsang-bokgu",  "정보 — 미용실 원상복구"],
  ["/content/neil-byuti-singo",         "정보 — 네일 · 뷰티 신고"],
  ["/content/neil-byuti-jeongri",       "정보 — 네일 · 뷰티 정리"],
  ["/content/helseu-gigu-hajung",       "정보 — 헬스장 기구"],
  ["/content/hagwon-gyoseupso-gubun",   "정보 — 학원과 교습소"],
  ["/content/banryeodongmul-yeongeop-deungrok", "정보 — 반려동물 영업"],
  ["/content/banryeodongmul-jeongri",   "정보 — 반려동물 정리"],
  ["/content/somae-damebae-juryu",      "정보 — 소매 담배 · 주류"],
  ["/content/somae-jaego-banpum",       "정보 — 소매 재고 반품"],
  ["/content/muin-maejang-singo",       "정보 — 무인매장 신고"],
  ["/content/sukbak-eopjong-sobang",    "정보 — 숙박 업종과 소방"],
  ["/content/sukbak-jeongri-yeyak",     "정보 — 숙박 정리와 예약"],
  ["/content/samusil-gyeyak-yongdo",    "정보 — 사무실 계약"],
  ["/content/samusil-jeongri-bojeunggeum", "정보 — 사무실 보증금"],
  ["/content/onlain-tongsinpanmae-singo", "정보 — 통신판매업 신고"],
  ["/content/onlain-jeongri-juhun",     "정보 — 온라인 판매 정리"],
  ["/about",             "소개"],
  ["/terms",             "이용약관"],
  ["/privacy",           "개인정보처리방침"],
  ["/nope",              "없는 주소"]
];
/* ⚠️ **360px 을 같이 봅니다.** 폰은 390px 만 있는 것이 아닙니다 —
   갤럭시 계열이 360px 이고, 새 헤더가 거기서만 370px 로 넘쳐
   가로 스크롤이 났습니다. 390 만 재던 동안 통과하고 있었습니다. */
const VIEWS = [[1440,900,"데스크톱"],[1024,820,"태블릿"],
               [390,844,"모바일"],[360,800,"좁은 폰"]];

/* 손님 화면에 있으면 안 되는 말 */
/* ⚠️ 조사를 괄호로 때운 자리(은(는) · 을(를))도 여기서 걸립니다.
   화면에도 보이지만, 더 나쁜 것은 **구글 검색 결과 줄**에 그대로
   나간다는 점입니다 — 카테고리 17개가 실제로 그랬습니다. */
/* ⚠️ "지시서 12번" 이 파트너 안내 화면에 그대로 나간 적이 있습니다.
   운영자끼리 쓰는 말(지시서 · 스펙 · MVP · 어드민 · TODO)은 손님 화면에
   있으면 안 됩니다 (절대 규칙 3). */
const BAD = /undefined|NaN|\[object |null년|console\.|localStorage|TODO|FIXME|placeholder|지시서|스펙 ?\d|어드민|[은는이가을를와과](\([은는이가을를와과]\))/i;

const AUDIT = `(() => {
  const W = window.innerWidth, out = { small:[], tap:[], wrap:[], bad:[], glue:[], mix:[], h1:[], dim:[], eye:[], star:[], dark:[], tone:[], ph:[] };
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
  /* ⚠️ **구간 머리말(.eyebrow)이 회색으로 죽는 일이 실제로 있었습니다.**
     ⚠️ 이 글은 백틱 문자열(AUDIT) 안입니다 — 주석에 백틱을 쓰면
     문자열이 거기서 끝납니다. 세 번째입니다.
     .sec-hd p (0,1,1)가 .eyebrow (0,1,0)를 이겨서 사이트 전체에서
     회색이었는데, 에러도 안 나고 다른 검사도 전부 통과했습니다 —
     찍어 보고서야 알았습니다. 머리말은 **강조색**이어야 합니다.
     흐린 글자색(--ink2 · --ink3)으로 끝나면 여기서 걸립니다. */
  document.querySelectorAll(".eyebrow").forEach(e => {
    if (!vis(e)) return;
    /* ⚠️ 여기는 백틱 문자열 안입니다 — 정규식에 한 겹 역슬래시를 쓰면
       (/\\s/ 처럼 두 겹으로 안 쓰면) 그냥 s 로 먹혀서 **아무것도 안
       지웁니다.** 아예 역슬래시를 쓰지 않습니다. */
    const c = (getComputedStyle(e).color || "").split(" ").join("");
    const dead = ["rgb(82,96,109)", "rgb(123,135,148)", "rgb(16,42,67)"];
    if (dead.indexOf(c) >= 0)
      out.eye.push((e.className || "") + "|" + (e.textContent || "").trim().slice(0, 12));
  });

  document.querySelectorAll("body *").forEach(e => {
    if (!vis(e)) return;
    const c = getComputedStyle(e), r = e.getBoundingClientRect();
    const leaf = !e.children.length && (e.textContent||"").trim();

    /* 3-0. 굵게 표시가 글자로 새어 나왔는가
       ⚠️ 데이터에 마크다운 별표를 쓰고 esc() 로 내보내면 **이렇게**
       그대로 찍힙니다. /content 에서 한 번 겪어서 거기만 보고 있었는데,
       /support 에서 또 났습니다 — 이제 모든 화면에서 봅니다.

       ⚠️⚠️ **잎사귀만 보면 안 됩니다.** 자식 태그가 하나라도 있으면
       건너뛰고 있어서, 약관·방침의 조문(p 안에 번호 span 이 있습니다)에
       남아 있던 별표를 **통째로 놓쳤습니다.** 이제 그 칸이 **직접
       들고 있는 글자**만 봅니다 — 부모까지 중복으로 잡히지도 않습니다. */
    const ownTxt = [].slice.call(e.childNodes)
      .filter(n => n.nodeType === 3).map(n => n.nodeValue).join("");
    if (ownTxt.indexOf("**") >= 0)
      out.star.push((e.className || e.tagName) + "|" + ownTxt.trim().slice(0, 24));

    /* 3. 12px 미만 */
    if (leaf) {
      const f = parseFloat(c.fontSize);
      if (f < 12) out.small.push(e.className+"|"+f+"px|"+(e.textContent||"").trim().slice(0,14));
      /* 3-2. 글자가 바탕에 묻히는가 — **WCAG AA**
         ⚠️⚠️ **기준이 1.6 이었습니다.** 그건 "완전히 사라졌나" 를 보는
         값이지 읽힘이 아닙니다. 그 바람에 13px 설명글이 대비 3.4 로
         **사이트 전체 40군데 넘게** 앉아 있는 것을 아무도 못 봤습니다 —
         손님이 40~60대 사장님인 플랫폼에서 제일 나쁜 종류입니다.
         제일 많이 눌리는 두 단추(창업 · 폐업)도 흰 글자 3.0 이었습니다.

         AA 는 **보통 글자 4.5 · 큰 글자 3.0** 이고, 큰 글자는
         24px 이상이거나 18.66px 이상이면서 굵은 것입니다 (17px 굵은
         글씨는 **큰 글자가 아닙니다** — 거기서 걸렸습니다).
         ⚠️ 반투명 글자(opacity · rgba)는 뒤가 섞여서 제대로 못 잽니다 —
         건너뜁니다. 그건 눈으로 보셔야 합니다. */
      const fg = rgb(c.color);
      const bg = fg ? bgOf(e) : null;
      if (fg && bg && +c.opacity >= 0.95 && (fg[3] === undefined || fg[3] >= 0.95)) {
        const a = lum(fg), b2 = lum(bg);
        const ratio = (Math.max(a,b2) + .05) / (Math.min(a,b2) + .05);
        const px = parseFloat(c.fontSize), wt = parseInt(c.fontWeight) || 400;
        const big = px >= 24 || (px >= 18.66 && wt >= 700);
        const need = big ? 3.0 : 4.5;
        if (ratio < need)
          out.dim.push(e.className+"|"+ratio.toFixed(2)+"<"+need+"|"+
            Math.round(px)+"px/"+wt+"|"+(e.textContent||"").trim().slice(0,14));
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

  /* ⚠️⚠️ **어두운 면을 화면마다 잽니다** (2026-10-01 §1 — 밝은 면 80% 이상).
     전에는 랜딩 한 곳에서, 그것도 #view 안만 쟀습니다. 푸터는 #view 밖이라
     빠져 있었는데 높이가 547px 이라, 짧은 화면에서는 그 하나가 화면의
     절반이었습니다 — /search 43.9% · /tools 30.7% · /my 27.6%. 랜딩과
     /home 은 길어서 14% · 6% 로 통과했고, **78개 화면을 아무도 안
     보고 있었습니다.**
     그래서 여기서는 **푸터를 포함한 문서 전체**를 잽니다. */
  {
    const dk = e => {
      const c = rgb(getComputedStyle(e).backgroundColor);
      if(!c || c[3] < 0.9) return false;
      return lum(c) < 0.09;
    };
    let area = 0; const seen = [], big = [];
    document.querySelectorAll("body *").forEach(e => {
      const cs = getComputedStyle(e);
      if(cs.display === "none" || cs.visibility === "hidden") return;
      if(cs.position === "fixed") return;   /* 헤더·아래 네비는 겹침입니다 */
      if(!dk(e)) return;
      for(const q of seen) if(q.contains(e)) return;
      seen.push(e);
      const r = e.getBoundingClientRect();
      area += r.width * r.height;
      big.push([r.width * r.height,
        (e.className || e.tagName).toString().split(" ")[0]]);
    });
    const total = W * document.documentElement.scrollHeight;
    const pct = total ? area / total * 100 : 0;
    /* ⚠️ **넓은 것부터** 적습니다. DOM 차례대로 적었더니 건너뛰기 링크와
       로고 타일이 먼저 나와서, 정작 범인인 푸터가 안 보였습니다. */
    if(pct > 15)
      out.dark.push(pct.toFixed(1) + "% — " + big.sort((x,y) => y[0] - x[0])
        .slice(0,3).map(x => x[1]).join(" · "));
  }

  /* ⚠️⚠️ **이웃한 두 구간이 붙어 보이는지도 화면마다 봅니다.**
     이 검사도 /home 한 곳에서만 돌고 있었습니다 — 어두운 면 검사와
     똑같은 구멍입니다 (푸터 사고). 구간을 쓰는 화면은 /home 만이
     아닙니다.
     사람 눈 기준 색차(ΔE)로 봅니다 — 채널차로 재면 민트와 하늘이
     7 차이인데 ΔE 5.95 로 뚜렷이 다르고, 아이보리와 웜 화이트는
     채널차 6 인데 ΔE 1.74 로 하나로 읽힙니다. 기준은 2.5 입니다. */
  {
    const lab = c => {
      const r = [c[0], c[1], c[2]].map(v => { v /= 255;
        return v <= .04045 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); });
      const X = (r[0]*.4124 + r[1]*.3576 + r[2]*.1805) / .95047;
      const Y = (r[0]*.2126 + r[1]*.7152 + r[2]*.0722);
      const Z = (r[0]*.0193 + r[1]*.1192 + r[2]*.9505) / 1.08883;
      const g = t => t > .008856 ? Math.cbrt(t) : 7.787*t + 16/116;
      return [116*g(Y) - 16, 500*(g(X) - g(Y)), 200*(g(Y) - g(Z))];
    };
    const dE = (a, b) => { const A = lab(a), B = lab(b);
      return Math.sqrt(Math.pow(A[0]-B[0],2) + Math.pow(A[1]-B[1],2)
                     + Math.pow(A[2]-B[2],2)); };
    /* ⚠️⚠️ **바탕을 안 준 구간은 건너뛰면 안 됩니다.** 그런 구간은
       body 의 웜 화이트가 그대로 비치므로, 둘이 나란히 오면 **똑같은
       색 두 개**입니다. 처음에 투명이라고 건너뛰었다가 업종 화면의
       "sec → sec" 두 쌍을 통째로 놓쳤습니다.
       그래서 투명이면 **위로 올라가 실제로 보이는 색**을 찾습니다.
       ⚠️ 그라디언트(backgroundImage)를 준 구간은 색 하나로 줄일 수
       없어서 그때만 건너뜁니다. */
    const eff = e => {
      let n = e;
      while(n){
        const cs = getComputedStyle(n);
        if(cs.backgroundImage && cs.backgroundImage !== "none") return null;
        const c = rgb(cs.backgroundColor);
        if(c && c[3] >= 0.9) return c;
        n = n.parentElement;
      }
      return null;
    };
    /* ⚠️ **눈에 보이는 구분선이 있으면 같은 색이어도 갈립니다.**
       속화면 머리(.pgh)는 흰 바탕에 1px 선을 깔아 아래 흰 구간과
       나누는 **의도된 짜임새**입니다 — 선을 안 보면 26개 화면이
       오탐으로 걸립니다. */
    const line = (e, side) => {
      if(!e) return false;
      const cs = getComputedStyle(e);
      if(parseFloat(cs["border" + side + "Width"]) < 1) return false;
      if(cs["border" + side + "Style"] === "none") return false;
      const c = rgb(cs["border" + side + "Color"]);
      return !!(c && c[3] >= 0.3);
    };
    const sec = [].slice.call(document.querySelectorAll("#view > section"));
    let prev = null, prevName = "", prevEl = null;
    for(const e of sec){
      const c = eff(e);
      const name = (e.className || "").toString().split(" ")
        .filter(x => x && x !== "sec")[0] || e.tagName.toLowerCase();
      if(!c){ prev = null; prevEl = null; continue; }
      if(prev && dE(prev, c) < 2.5
         && !line(prevEl, "Bottom") && !line(e, "Top"))
        out.tone.push(prevName + " ↔ " + name + " ΔE " + dE(prev, c).toFixed(2));
      prev = c; prevName = name; prevEl = e;
    }
    /* ⚠️⚠️ **마지막 구간과 푸터도 비교합니다.** 푸터를 밝게 바꾸면서
       웜 아이보리로 두었더니 아이보리 구간과 ΔE 0.88 이라 푸터가
       본문에 녹아 버렸습니다 — 구간끼리만 보면 통과합니다.
       ⚠️ 이 주석에 백틱을 쓰지 마세요. 문자열이 거기서 끝납니다
       (여섯 번째 escape 사고 — 방금 또 했습니다). */
    const ft = document.querySelector("footer.ft");
    if(prev && ft){
      const c = eff(ft);
      if(c && dE(prev, c) < 2.5
         && !line(prevEl, "Bottom") && !line(ft, "Top"))
        out.tone.push(prevName + " ↔ 푸터 ΔE " + dE(prev, c).toFixed(2));
    }
  }

  /* ⚠️⚠️ **"준비 중" 을 찍지 않습니다** (절대 규칙 2 · 5).
     값이 0 이면 0 이라고 말하고, 없으면 줄째 뺍니다. "준비 중" 은
     ① 미완성 사이트로 읽히고 ② 언제 된다는 약속으로 읽힙니다.
     실제로 프랜차이즈 분류 **열두 칸 전부**가 "준비 중" 이었습니다 —
     세는 값(0개 브랜드)을 내야 할 자리였습니다.
     ⚠️ 문장 속의 "창업 준비 중인 분" 은 정상입니다. 그래서 **칸
     하나가 통째로 그 말인 것**만 봅니다. */
  {
    const PH = ["준비 중", "준비중", "준비 중입니다", "준비중입니다",
                "coming soon", "Coming Soon", "TBD", "미정"];
    document.querySelectorAll("#view *").forEach(e => {
      if(e.children.length) return;                 /* 잎사귀만 */
      const t = (e.textContent || "").trim();
      if(PH.indexOf(t) >= 0)
        out.ph.push((e.className || e.tagName).toString().split(" ")[0] + " › " + t);
    });
  }

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

    const bad = { small:[], tap:[], wrap:[], bad:[], glue:[], mix:[], h1:[], dim:[], eye:[], star:[], dark:[], tone:[], ph:[], over:[] };
    for (const [hash, name] of PAGES) {
      await p.goto(ROOT + hash, { waitUntil:"load" });
      await p.waitForTimeout(280);
      const a = await p.evaluate(AUDIT);
      a.links.forEach(l => seenLinks.add(l));
      if (a.over) bad.over.push(name);
      /* ⚠️ 여기가 **손으로 적은 목록**이었습니다. 검사를 하나 새로
         넣고 여기에 안 넣으면 그 검사는 **영원히 통과합니다** — 실제로
         "구간 머리말" 검사를 그렇게 만들었다가, 일부러 망가뜨려 보고서야
         알았습니다. 이제 `bad` 의 키에서 그대로 가져옵니다. */
      Object.keys(bad).filter(k => k !== "over").forEach(k =>
        (a[k] || []).forEach(x => bad[k].push(name+" › "+x)));
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
      ["개발자 말 노출",     uniq(bad.bad)],
      ["구간 머리말이 회색으로 죽음", uniq(bad.eye)],
      ["별표(**)가 글자로 남음", uniq(bad.star)],
      ["어두운 면이 15% 넘음",   uniq(bad.dark)],
      ["이웃한 두 구간이 붙어 보임", uniq(bad.tone)],
      ["\"준비 중\" 자리표시자", uniq(bad.ph)]
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
  /* ⚠️ 개수를 **손으로 적지 마세요.** 이 저장소에서 손으로 적은 목록
     때문에 새 검사가 영원히 안 돌아간 적이 있습니다. 실제로 54 라고
     적혀 있는 동안 검사는 59개였습니다 — 세어서 내놓습니다. */
  let flowN = 0;
  const fp = await (await b.newContext({ viewport:{width:1280,height:900} })).newPage();
  const f = async (name, url, body) => {
    flowN++;
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
  /* ⚠️⚠️ **업체가 0곳이라 업체 관련 검사가 전부 "없다" 만 보고 있었습니다.**
     그래서 `/providers/:cat` 이 분류를 안 넘기는 것을 아무도 못 봤습니다 —
     하위 분류를 고르기 전에는 **등록된 모든 업체가 모든 분야 화면에**
     나왔습니다. 철거를 찾는 손님에게 인테리어 업체가 보이고, 그 업체에
     철거 요청이 갑니다. 첫 업체를 등록하는 날 터질 버그였습니다.

     검사가 **업체를 하나 끼워 넣고** 봅니다 — 저장소의 데이터는 그대로
     0곳이고, 지어낸 업체는 이 검사 안에서만 삽니다. */
  await f("업체는 자기 분야에만 나온다", "/providers/interior", `
    window.AM_PROVIDERS.push({
      id:"zz-check", name:"검사용 업체", regions:["gyeonggi"],
      industries:["cafe"], subs:["interior"], intro:"검사 안에서만 삽니다."
    });
    const inCat  = window.amProviders({ cat:"interior" }).length;
    const offCat = window.amProviders({ cat:"demolish" }).length;
    const offInd = window.amProviders({ cat:"interior", industry:"gym" }).length;
    const offReg = window.amProviders({ cat:"interior", region:"seoul" }).length;
    window.AM_PROVIDERS = window.AM_PROVIDERS.filter(function(p){ return p.id !== "zz-check"; });
    let why = true;
    if(!inCat)      why = "자기 분야(인테리어)에서 안 보입니다";
    else if(offCat) why = "남의 분야(철거)에 " + offCat + "곳 나옵니다 — 분류를 안 넘기고 있습니다";
    else if(offInd) why = "전문 업종이 아닌데 업종 거르개에 걸립니다";
    else if(offReg) why = "서비스 지역이 아닌데 지역 거르개에 걸립니다";
    return why;`);
  /* 같은 규칙을 두 곳에 적으면 한쪽만 고치게 됩니다 (amCatTo 로 겪었습니다). */
  await f("입점 배지와 업체찾기가 같은 규칙으로 센다", "/join", `
    window.AM_PROVIDERS.push({
      id:"zz-check", name:"검사용 업체", regions:["gyeonggi"],
      industries:["cafe"], subs:["interior"], intro:"검사 안에서만 삽니다."
    });
    const a  = window.amProvidersInCat(window.amCat("interior"));
    const b  = window.amProviders({ cat:"interior" }).length;
    const dz = window.amProvidersInCat(window.amCat("demolish"));
    window.AM_PROVIDERS = window.AM_PROVIDERS.filter(function(p){ return p.id !== "zz-check"; });
    let why = true;
    if(a !== b)  why = "입점 배지 " + a + "곳 · 업체찾기 " + b + "곳 — 규칙이 갈렸습니다";
    else if(dz)  why = "철거 배지가 " + dz + "곳이라고 합니다";
    return why;`);
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
    /* ⚠️ 새 랜딩(시안)에는 실적 숫자가 **한 곳도 없습니다.** 그래서
       낱말로 막지 않고 "n곳 · n개 · n건" 꼴이 하나라도 있으면 잡습니다.
       업체가 실제로 등록되어도 랜딩에는 숫자가 안 나오는 것이 맞고,
       세는 값이 필요한 화면은 /home 입니다. */
    const t = document.getElementById("view").textContent;
    const bad = [];
    const pat = [[/[0-9][0-9,]*\\s*\\+\\s*(곳|개|명|건)/, "n+ 꼴"],
                 [/[0-9][0-9,]*\\s*(곳|개사|명)/, "실적 숫자"],
                 [/만족도/, "만족도"], [/누적/, "누적"],
                 [/평점\\s*[0-9]/, "평점"], [/[0-9]+\\s*만\\s*명/, "회원 수"]];
    for(const q of pat){ if(q[0].test(t)) bad.push(q[1]); }
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
  /* 하는 일과 적어 둔 말이 **같아야** 합니다 (절대 규칙 5). 전에 폼 아래에
     "보내고 나면 이 브라우저에 요청 내용이 남아" 라고 적혀 있었는데
     amSend() 는 보낸 뒤 아무것도 저장하지 않았습니다 — 그 말을 믿고 탭을
     닫으시면 적으신 것이 없어집니다. 둘 중 **어느 쪽을 고쳐도** 통과하도록,
     말과 행동이 어긋날 때만 걸립니다. */
  await f("견적: 요청을 저장한다는 말과 실제가 같다", "/quote", `
    try{ localStorage.removeItem("am.quotes.v1"); }catch(e){}
    const noteEl = document.querySelector("#q-f .note-mid");
    const note = noteEl ? (noteEl.textContent || "") : "";
    const claims = note.indexOf("보내고 나면") >= 0 || note.indexOf("요청 내용이 남") >= 0;
    const real = window.fetch;
    let sent = false;
    window.fetch = function(){
      sent = true;
      return Promise.resolve({ ok:true, json: function(){ return Promise.resolve({ ok:true }); } });
    };
    document.getElementById("q-what").value = "카페 인테리어";
    document.getElementById("q-q").value    = "25평입니다";
    document.getElementById("q-name").value = "홍길동";
    document.getElementById("q-tel").value  = "010-1234-5678";
    document.getElementById("q-ag").checked = true;
    window.quoteSend({ preventDefault: function(){} });
    await new Promise(r => setTimeout(r, 350));
    window.fetch = real;
    if(!sent) return "보내지지 않아서 이 검사가 아무것도 안 보고 있습니다";
    const saved = localStorage.getItem("am.quotes.v1");
    const saves = !!saved && saved !== "[]";
    if(claims && !saves) return "저장한다고 적어 두고 저장하지 않습니다: " + note.slice(0, 40);
    if(saves && !claims) return "적어 두지 않은 저장을 합니다: " + saved.slice(0, 60);
    return true;`);

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
  await f("검색이 글 본문까지 찾는다", "/search", `
    /* ⚠️⚠️ 전에는 글을 **제목과 머리말로만** 색인했습니다. 손님은 글
       제목을 치지 않습니다 — "배달" · "간이과세" · "보건증" 이라고
       칩니다. 그 낱말이 본문에는 다 있는데 검색은 0건을 냈습니다.
       사이트가 답을 들고 있으면서 못 찾아 주는 것이 제일 나쁩니다.
       여기 적는 낱말은 전부 **본문에만** 있는 것입니다 — 제목이나
       머리말로 돌아가면 바로 0 이 됩니다. */
    const only = ["배달", "간이과세", "보건증"];
    const info = function(r){
      const g = (r.groups || []).filter(function(x){ return x.name === "정보"; })[0];
      return g ? g.rows.length : 0;
    };
    for(const w of only){
      const r = window.amSearch(w);
      if(!info(r)) return "'" + w + "' 가 글에서 안 나옵니다 (본문 색인이 빠졌습니다)";
    }
    /* ⚠️ 낱말을 더 많이 맞힌 글이 먼저여야 합니다. "주류 면허" 를 치면
       '면허' 하나만 맞은 미용실 글이 1등이었습니다 — 흔한 낱말 하나가
       드문 낱말을 묻어 버립니다. */
    const two = window.amSearch("주류 면허");
    const g2 = (two.groups || []).filter(function(x){ return x.name === "정보"; })[0];
    if(!g2 || !g2.rows.length) return "'주류 면허' 가 글에서 안 나옵니다";
    if(g2.rows[0].name.indexOf("주점") < 0)
      return "'주류 면허' 맨 앞이 '" + g2.rows[0].name + "' 입니다 (주점 글이어야 합니다)";
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
  await f("히어로 제목이 창업 · 폐업 두 낱말을 주인공으로 둔다", "/", `
    const h = document.querySelector(".mh .mh-h");
    if(!h) return "히어로 제목이 없습니다";
    const t = h.textContent.replace(/\\s+/g, "");
    if(t !== "창업에필요한모든것.폐업에필요한모든것.")
      return "제목이 " + h.textContent.trim() + "입니다";
    if(!h.querySelector(".mh-st")) return "창업 강조가 없습니다";
    if(!h.querySelector(".mh-cl")) return "폐업 강조가 없습니다";
    const px = parseFloat(getComputedStyle(h).fontSize);
    if(innerWidth > 1200 && px < 56)
      return "글씨가 " + Math.round(px) + "px 입니다 (§26 — 64~76px)";
    /* §4 — 데스크톱 첫 화면 680~760px.
       ⚠️ 재는 것은 **첫 화면까지**입니다 — 범위 숫자 띠(.mst)는 히어로와
       같은 구간 안이지만 첫 화면 아래에 붙는 것이라 빼고 잽니다.
       구간 전체를 재면 띠 높이까지 더해져 늘 "너무 길다" 가 됩니다. */
    if(innerWidth > 1200){
      const sec = document.querySelector(".mh");
      const bar = document.querySelector(".mh .mst");
      const top = sec.getBoundingClientRect().top;
      const hh = bar ? bar.getBoundingClientRect().top - top
                     : sec.getBoundingClientRect().height;
      if(hh < 660) return "첫 화면이 " + Math.round(hh) + "px 입니다 (680~760px)";
      if(hh > 800) return "첫 화면이 " + Math.round(hh) + "px 입니다 — 너무 깁니다 (680~760px)";
    }
    return true;`);
  await f("히어로에서 바로 찾고 바로 갈라진다", "/", `
    /* ⚠️⚠️ **규칙이 뒤집혔습니다** (2026-10-01 §1 · §6 · §8). 전에는
       "히어로에 누를 곳이 하나뿐" 이었습니다 — 랜딩이라 "플랫폼
       시작하기" 하나로 메인에 보내는 것이 전부였기 때문입니다.
       그 중간 화면을 없앴으니, 이제 히어로가 **실제로 쓰는 자리**입니다.
       검색창 · 추천 검색어 · START/CLOSE 두 갈래가 다 있어야 합니다. */
    const s2 = document.querySelector(".mh");
    if(!s2) return "히어로가 없습니다";
    const q = s2.querySelector('input[type="search"]');
    if(!q) return "히어로에 검색창이 없습니다 (§6 — 핵심 UI 입니다)";
    const rq = q.getBoundingClientRect();
    if(rq.height < 44)
      return "검색창이 " + Math.round(rq.height) + "px 입니다 (대형이어야 합니다)";
    const chips = s2.querySelectorAll(".mh-sg a");
    if(chips.length < 4) return "추천 검색어가 " + chips.length + "개입니다";
    for(const c of chips){
      const href = c.getAttribute("href") || "";
      /* ⚠️ §7 — 가짜 링크 금지 */
      if(!href || href === "#") return "추천 검색어에 가짜 링크가 있습니다";
      const rc = c.getBoundingClientRect();
      if(rc.height < 44)
        return "추천 검색어 칩이 " + Math.round(rc.height) + "px 입니다 (44px 기준)";
    }
    const st = s2.querySelector('.mh-cta a[href="/startup"]');
    const cl = s2.querySelector('.mh-cta a[href="/closure"]');
    if(!st || !cl) return "START / CLOSE 두 갈래가 히어로에 없습니다";
    /* ⚠️ §8 — 두 단추의 크기가 같아야 합니다. 한쪽을 작게 만들면
       그게 "덜 중요한 것" 이라는 말입니다. */
    const ra = st.getBoundingClientRect(), rb = cl.getBoundingClientRect();
    if(Math.abs(ra.width - rb.width) > 2)
      return "두 단추 폭이 " + Math.round(ra.width) + " · " + Math.round(rb.width) + "입니다";
    return true;`);
  /* ⚠️⚠️ **2026-09-30 지시로 규칙이 뒤집혔습니다.** 전에는 "창업과
     폐업을 색으로 가르지 않는다" 였습니다 — 빨강/초록으로 나누면
     "폐업은 나쁜 것" 이 되기 때문입니다. 지시서가 그 걱정을 짚고
     (§6 "폐업하는 사람을 실패자처럼 표현하지 않는다") **주황**으로
     정했습니다. 그래서 지금 지키는 것은 —
       · 창업 쪽은 초록 · 폐업 쪽은 주황
       · 폐업 쪽이 **빨강으로 흘러가지 않는 것** (그 순간 옛 걱정이
         그대로 돌아옵니다)
     입니다. `--close` 를 붉은 쪽으로 옮기면 여기서 걸립니다. */
  await f("창업은 초록 · 폐업은 주황이고 빨강이 아니다", "/", `
    const col = function(q, prop){
      const e = document.querySelector(q);
      if(!e) return null;
      const m = getComputedStyle(e)[prop || "color"].match(/(\\d+), ?(\\d+), ?(\\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : null;
    };
    /* 시안 §3 — "창업부터" 는 Deep Navy, "폐업" 은 Orange */
    const hd = col(".mh-h"), cl = col(".mh-cl");
    if(!hd || !cl) return "히어로 제목 색을 못 읽습니다";
    if(!(hd[2] > hd[0] + 30)) return "제목이 남색이 아닙니다 rgb(" + hd.join(",") + ")";
    if(!(cl[0] > cl[1] + 40 && cl[1] > cl[2]))
      return "폐업이 주황이 아닙니다 rgb(" + cl.join(",") + ")";
    /* ⚠️ 주황과 빨강의 경계 — 초록 성분이 확 내려가면 빨강입니다.
       빨강으로 가면 "폐업은 나쁜 것" 이라는 옛 걱정이 그대로 돌아옵니다. */
    if(cl[1] < 55) return "폐업이 빨강으로 넘어갔습니다 rgb(" + cl.join(",") + ")";
    /* 히어로의 "창업" 도 초록이어야 합니다 */
    const st = col(".mh-st");
    if(!st) return "히어로 창업 강조 색을 못 읽습니다";
    if(!(st[1] > st[0] + 30 && st[1] > st[2] + 20))
      return "창업이 초록이 아닙니다 rgb(" + st.join(",") + ")";
    /* 큰 카드 둘도 같은 규칙입니다 — 머리말 글자색으로 봅니다 */
    const bs = col(".ms-st .ms-k");
    const bc = col(".ms-cl .ms-k");
    if(!bs || !bc) return "START · CLOSE 머리말을 못 찾습니다";
    if(!(bs[1] > bs[0] + 30)) return "START 머리말이 초록이 아닙니다";
    if(!(bc[0] > bc[1] + 40 && bc[1] >= 45)) return "CLOSE 머리말이 주황이 아닙니다";
    /* 두 큰 카드의 바탕도 각각 민트 · 피치 쪽이어야 합니다 */
    const ca = col(".ms-st", "backgroundColor"), cb = col(".ms-cl", "backgroundColor");
    if(!ca || !cb) return "큰 카드 바탕을 못 읽습니다";
    if(!(ca[1] >= ca[0] && ca[1] >= ca[2]))
      return "창업 카드가 초록으로 안 기울었습니다 rgb(" + ca.join(",") + ")";
    if(!(cb[0] >= cb[1] && cb[1] >= cb[2]))
      return "폐업 카드가 주황으로 안 기울었습니다 rgb(" + cb.join(",") + ")";
    /* ⚠️ 폐업 쪽이 빨강으로 흘러가면 "폐업은 나쁜 것" 이 됩니다 (§6) */
    if(cb[1] < 215) return "폐업 카드가 붉은 쪽으로 갔습니다 rgb(" + cb.join(",") + ")";
    return true;`);

  /* ⑨ 규모감 숫자 — **센 값**이어야 합니다
     ⚠️ 여기가 이 플랫폼에서 숫자를 크게 띄우는 유일한 자리라, 나중에
     "183 을 300 으로 고쳐 두면 커 보이겠다" 가 제일 쉽게 벌어지는
     곳입니다. 화면의 숫자를 데이터에서 다시 세어 맞춰 봅니다. */
  await f("규모감 숫자가 손으로 쓴 값이 아니라 센 값이다", "/about", `
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
        return i + "번째가 화면 " + n[i] + " · 실제 " + want[i] + "입니다";
    return true;`);
  await f("규모감 숫자가 무엇을 센 값인지 밝힌다", "/about", `
    /* ⚠️ 2026-10-01 — 랜딩(.scale-b)이 없어져서 /about 의 .scale 뿐입니다.
       ⚠️ 이 글은 백틱 문자열 안이라 **주석에 백틱을 쓰면** 문자열이
       거기서 끝나고 검사가 통째로 멈춥니다. 또 그랬습니다. */
    const s = document.querySelector(".scale-b, .scale");
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
  /* ⚠️ 2026-09-30 §23 으로 **랜딩에서 /about 으로 옮겼습니다.**
     랜딩은 브랜드 소개 화면이고, 진행 방법 · 범위 · FAQ 는 서비스
     설명이라 소개 화면이 갖습니다. 지운 것이 아닙니다. */
  await f("진행 방법이 세 걸음을 넘지 않는다", "/about", `
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
  /* ⚠️ 글 하나도 **그 글이 어느 쪽 것인지**를 따라야 합니다. 창업
     화면에서 초록 카드를 눌러 들어갔는데 글이 파랑이면 같은 사이트로
     안 읽힙니다. 색을 하나하나 보지 않고 side- 클래스만 봅니다 —
     색은 pages.css 의 변수 하나가 한꺼번에 바꿉니다. */
  await f("폐업 글은 주황 쪽 · 창업 글은 초록 쪽으로 물든다",
          "/content/gym-pyeeop-hoewongwon", `
    const v = document.getElementById("view");
    if(!v.classList.contains("side-close"))
      return "폐업 글인데 " + (v.className || "(없음)") + "입니다";
    /* 실제로 색이 바뀌었는지까지 봅니다 — 클래스만 붙고 규칙이 없으면
       아무 일도 안 일어납니다 */
    const blue = getComputedStyle(v).getPropertyValue("--blue").trim();
    const base = getComputedStyle(document.documentElement)
      .getPropertyValue("--blue").trim();
    if(!blue || blue === base) return "--blue 가 그대로입니다 (" + blue + ")";
    return true;`);
  /* ⚠️ 업종 화면(`/startup/:industry`)은 amContentsFor 에 **분류를 안
     넘깁니다.** 업종만 보고도 위로 올려야 하는데, 안 그러면 카페 창업
     화면 맨 앞에 사업자등록 글이 앉습니다 — 실제로 그랬습니다. */
  await f("업종 화면에는 그 업종 글이 맨 앞에 온다", "/startup/cafe", `
    const b = document.querySelector(".rd-l");
    if(!b) return "읽을 것 구간이 없습니다";
    const t = [].slice.call(b.querySelectorAll("b")).map(function(e){
      return e.textContent.trim(); });
    if(!t.length) return "글이 하나도 없습니다";
    if(t[0].indexOf("카페") < 0) return "맨 앞이 '" + t[0] + "' 입니다";
    /* 다른 업종 글이 섞이면 그 업종 사장님을 엉뚱한 데로 보냅니다 */
    const other = t.filter(function(x){
      return /미용실|헬스장|학원|무인매장|음식점/.test(x); });
    if(other.length) return "다른 업종 글이 섞였습니다: " + other.join(" / ");
    return true;`);
  /* ⚠️ 거르개 숫자를 손으로 적으면 글을 더할 때마다 어긋납니다. 화면의
     세 칸을 **데이터에서 다시 세어** 맞춰 봅니다 (절대 규칙 1). */
  await f("글 목록 거르개 숫자가 센 값이다", "/content", `
    const chips = [].slice.call(document.querySelectorAll(".chip-g-fil .chip"));
    if(chips.length < 3) return "거르개가 없습니다";
    const all = window.AM_CONTENTS || [];
    const want = [all.length,
      all.filter(function(c){ return c.side !== "close"; }).length,
      all.filter(function(c){ return c.side !== "start"; }).length];
    for(let i = 0; i < 3; i++){
      const got = parseInt((chips[i].textContent.match(/[0-9]+/) || [-1])[0], 10);
      if(got !== want[i])
        return chips[i].textContent.trim() + " · 실제 " + want[i] + "입니다";
    }
    /* 눌러서 실제로 걸러지는가 */
    const n = document.querySelectorAll(".ct-l > li").length;
    if(n !== all.length) return "전체인데 " + n + "편만 나옵니다";
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

  /* ⑭ 샴페인 골드는 **악센트로만** (§21)
     ⚠️ 이 저장소에서 금빛을 넓게 썼다가 통째로 걷어낸 적이 있습니다 —
     고급스러움이 아니라 꾸민 티였습니다. 면으로 번지는 것을 막습니다. */
  await f("골드를 면으로 쓰지 않는다", "/", `
    const isGold = function(bg){
      const m = String(bg).match(/rgba?\\((\\d+), ?(\\d+), ?(\\d+)(?:, ?([0-9.]+))?/);
      if(!m) return false;
      const r = +m[1], g = +m[2], b = +m[3], a = m[4] === undefined ? 1 : +m[4];
      if(a < 0.2) return false;             /* 아주 옅은 선은 봐줍니다 */
      return r > 140 && g > 110 && b < 160 && (r - b) > 45 && (g - b) > 20;
    };
    const bad = [];
    document.querySelectorAll("#view *").forEach(function(e){
      const rc = e.getBoundingClientRect();
      if(rc.width * rc.height < 20000) return;   /* 작은 배지는 괜찮습니다 */
      if(isGold(getComputedStyle(e).backgroundColor))
        bad.push((e.className || e.tagName).toString().slice(0, 24));
    });
    return bad.length ? "면으로 쓴 곳: " + bad.slice(0, 3).join(" · ") : true;`);
  await f("골드가 버튼 · 링크의 행동색을 빼앗지 않는다", "/quote", `
    /* ⚠️ 행동색은 **하나**여야 손님이 "누를 것" 을 배웁니다.
       버튼이 금색이 되면 그 규칙이 깨집니다. */
    const b1 = document.querySelector(".btn-b");
    if(!b1) return "기본 버튼이 없습니다";
    const bg = getComputedStyle(b1).backgroundColor;
    const m = bg.match(/rgba?\\((\\d+), ?(\\d+), ?(\\d+)/);
    if(!m) return "버튼 바탕을 못 읽습니다";
    const r = +m[1], b = +m[3];
    if(r > b) return "기본 버튼이 파랑이 아닙니다 — " + bg;
    return true;`);
  /* ⚠️ 검색은 **히어로의 대형 검색창**(§6)과 헤더 아이콘 둘입니다.
     히어로 쪽은 위의 "히어로에서 바로 찾고 바로 갈라진다" 가 봅니다. */
  await f("어느 화면에서나 검색으로 가는 길이 있다", "/", `
    const a = document.querySelector('.hd a[href="/search"]');
    if(!a) return "헤더에 검색으로 가는 링크가 없습니다";
    const r = a.getBoundingClientRect();
    if(r.width < 40 || r.height < 40)
      return "검색 아이콘이 " + Math.round(r.width) + "x" + Math.round(r.height) + "입니다";
    return true;`);
  await f("추천 검색어가 실제로 결과를 낸다", "/search", `
    /* ⚠️ 눌렀는데 "결과 없음" 이 나오면 검색이 고장난 것처럼 보입니다 */
    const tips = [].slice.call(document.querySelectorAll(".sr-hint .chip"));
    if(!tips.length) return "추천 검색어가 없습니다";
    for(const a of tips){
      const q = decodeURIComponent((a.getAttribute("href").split("q=")[1] || ""));
      if(!q) return "추천어에 q 가 없습니다";
      if(!window.amSearch || !(amSearch(q) || {}).total)
        return "'" + q + "' 는 결과가 안 나옵니다";
    }
    return true;`);

  /* ⑮ MY 와 도구가 이어지는가
     ⚠️ "전부 지웁니다" 라고 해 놓고 남기면 그게 거짓말입니다. 가게
     컴퓨터는 여러 사람이 쓰므로 남의 눈에 그대로 들어갑니다. */
  await f("계산기가 말이 안 되는 숫자를 내지 않는다", "/tools/bep", `
    /* ⚠️⚠️ 변동비 합이 **100% 를 넘는 것**은 막고 있었는데, 99.99% 는
       안 막고 있었습니다. 공헌이익률이 0.01% 라 나눈 값이 85조원으로
       나왔고, 배지는 반올림해서 "공헌이익률 0%" 라고 적었습니다 —
       0 으로 나눈 값이 유한할 수 없으니 화면이 스스로 모순된 말을 한
       셈입니다. 사장님은 그 숫자를 들고 은행에 가십니다.
       ⚠️ 1% 아래에서는 비율을 0.1 만 다르게 적어도 답이 몇 배로
       흔들립니다 — 그건 정보가 아니라 잘못된 확신입니다. */
    const set = function(id, x){
      const e = document.getElementById(id);
      if(!e) return false;
      e.value = String(x);
      e.dispatchEvent(new Event("input", { bubbles:true }));
      return true;
    };
    if(!set("bepIn-rent", 500)) return "고정비 칸을 못 찾습니다";
    if(!set("bepIn-mat", 99.99)) return "비율 칸을 못 찾습니다";
    await new Promise(function(r){ setTimeout(r, 120); });
    const box = document.querySelector(".tl-res");
    if(!box) return "결과 칸이 없습니다";
    const t = box.innerText || "";
    if(/NaN|Infinity/.test(t)) return "결과에 NaN · Infinity 가 있습니다";
    /* 공헌이익률 0% 라고 적어 놓고 숫자를 내면 안 됩니다 */
    if(/공헌이익률 0%/.test(t)) return "공헌이익률 0% 인데 숫자를 냅니다";
    /* 억 단위를 넘는 자리수(쉼표 네 덩이 이상)는 현실에 없는 값입니다 */
    if(/[0-9]{1,3}(,[0-9]{3}){3,}/.test(t))
      return "현실에 없는 자릿수가 나옵니다 — " + t.split("\\n")[1];
    /* 숫자 대신 왜 안 나오는지가 적혀 있어야 합니다 */
    if(t.indexOf("99%") < 0 && t.indexOf("비율 칸") < 0)
      return "숫자를 안 내는 까닭이 안 적혀 있습니다";
    /* ⚠️ 정상 범위에서는 **나와야** 합니다 — 너무 넓게 막으면 그것도 고장입니다 */
    set("bepIn-mat", 50);
    await new Promise(function(r){ setTimeout(r, 120); });
    const t2 = (document.querySelector(".tl-res") || {}).innerText || "";
    if(t2.indexOf("공헌이익률 50%") < 0) return "정상 조건에서 결과가 안 나옵니다";
    return true;`);
  await f("MY: 전부 지우기가 도구 숫자까지 지운다", "/tools/bep", `
    window.bepIn("rent", "1000");
    window.laborIn && window.laborIn("sales", "5000");
    await new Promise(r => setTimeout(r, 150));
    let before = 0;
    try{ for(let i = 0; i < localStorage.length; i++)
      if(/^am\\.tool\\./.test(localStorage.key(i))) before++; }catch(e){ return true; }
    if(!before) return "도구가 저장을 안 합니다";
    /* myClear() 는 확인을 물어보므로 여기서는 지우는 부분만 따라 합니다 */
    (window.AM_TOOLS || []).forEach(function(t){ amDel("am.tool." + t.key); });
    let after = 0;
    for(let i = 0; i < localStorage.length; i++)
      if(/^am\\.tool\\./.test(localStorage.key(i))) after++;
    return after === 0 ? true : after + "개가 남았습니다";`);
  await f("MY: 도구에 적은 것이 보이되 값은 안 찍힌다", "/tools/labor", `
    window.laborIn("sales", "5000");
    window.laborIn("wage", "1200");
    await new Promise(r => setTimeout(r, 150));
    /* location.href 를 쓰지 마세요 — 화면을 통째로 새로고침해서
       실행 문맥이 날아가고 검사가 "에러" 로 끝납니다. SPA 라우터
       go() 로 넘기면 같은 문맥에서 이어집니다.
       주의: 이 글은 백틱 문자열 안이라 주석에 백틱을 쓰면 문자열이
       거기서 끝나고 SyntaxError 가 납니다. */
    window.go("/my");
    await new Promise(r => setTimeout(r, 500));
    const t = document.getElementById("view").textContent;
    if(t.indexOf("인건비율") < 0) return "MY 에 안 보입니다";
    /* ⚠️ 매출 · 인건비는 남이 보면 안 되는 숫자입니다 */
    if(/5,?000|1,?200/.test(t)) return "적은 값이 MY 에 그대로 찍힙니다";
    return true;`);

  /* ⑯ 메인이 **바로 쓰는 화면**인가 (2026-10-01 지시서 §1 · §29)
     ⚠️⚠️ **규칙이 통째로 뒤집혔습니다.** 여기 있던 검사 둘은
     "랜딩에 서비스 메인 기능을 끌어오지 않았다" 와 "랜딩 구간 차례가
     시안과 같다" 였습니다 — 그 랜딩을 **없앴습니다.** 이제 반대로,
     중간 소개 화면이 다시 생기지 않는지를 봅니다. */
  await f("메인(/)이 중간 소개 화면이 아니다", "/", `
    const v = document.getElementById("view");
    /* 랜딩 시절의 표시가 하나라도 살아 있으면 되돌아간 것입니다 */
    for(const q of [".lh", ".lin", ".lbr", ".lsc", ".lfin"])
      if(v.querySelector(q)) return "랜딩 구간(" + q + ")이 되살아났습니다";
    /* 실제로 쓰는 것들이 메인에 있어야 합니다 (⚠️ 이 주석에 백틱을
       쓰면 문자열이 거기서 끝납니다 — 여섯 번째입니다) */
    const need = [['input[type="search"]', "검색창"], [".mi-g", "업종 고르기"],
                  [".mv-g", "핵심 서비스"], [".ms-two", "START / CLOSE"]];
    for(const q of need)
      if(!v.querySelector(q[0])) return q[1] + " 가 메인에 없습니다";
    /* ⚠️ 게이트웨이로 보내는 길이 남아 있으면 안 됩니다 (§29) */
    const gate = [].slice.call(document.querySelectorAll('a[href="/home"]'));
    if(gate.length)
      return "아직 /home 으로 보내는 링크가 " + gate.length + "개 있습니다";
    return true;`);
  await f("어두운 면이 화면의 15% 를 넘지 않는다", "/", `
    /* ⚠️ §2 — 남색은 12~15% 까지이고, 짙은 색 **전면 배경**은 푸터
       뿐입니다. 본문에서 어두운 면은 업체 입점 카드(§14)와 창업↔폐업
       장면의 가운데 칸(§11)까지입니다.
       ⚠️ 낱개를 세지 않고 **넓이를 재는** 이유는, 카드 한 장이
       늘어나는 것보다 "구간 하나를 통째로 어둡게" 가 실제 위험이기
       때문입니다. 어두운 테마로 되돌아가는 것을 여기서 막습니다.
       푸터는 #view 밖이라 세지 않습니다. */
    const lum = function(c){
      const g = function(x){ x /= 255;
        return x <= .03928 ? x/12.92 : Math.pow((x+.055)/1.055, 2.4); };
      return .2126*g(c[0]) + .7152*g(c[1]) + .0722*g(c[2]);
    };
    const isDark = function(e){
      const m = getComputedStyle(e).backgroundColor
        .match(/(\\d+), ?(\\d+), ?(\\d+)(?:, ?([0-9.]+))?/);
      if(!m) return false;
      if(m[4] !== undefined && +m[4] < 0.9) return false;
      return lum([+m[1], +m[2], +m[3]]) < 0.09;
    };
    const view = document.getElementById("view");
    let area = 0;
    const seen = [];
    document.querySelectorAll("#view *").forEach(function(e){
      if(!isDark(e)) return;
      /* 어두운 칸 안의 어두운 칸은 두 번 세지 않습니다 */
      for(const p2 of seen) if(p2.contains(e)) return;
      seen.push(e);
      const r = e.getBoundingClientRect();
      area += r.width * r.height;
    });
    const total = view.clientWidth * view.scrollHeight;
    if(!total) return "본문 크기를 못 읽습니다";
    const pct = area / total * 100;
    if(pct > 15)
      return "어두운 면이 " + pct.toFixed(1) + "% 입니다 (15% 까지) — " +
        seen.map(function(e){ return (e.className || e.tagName).toString().split(" ")[0]; })
            .slice(0, 4).join(" · ");
    return true;`);
  /* ⚠️⚠️ **여기 있던 "마지막 CTA" 검사를 지웠습니다** (2026-10-01).
     그 구간은 랜딩의 다섯째 구간이었고 랜딩과 함께 없어졌습니다.
     지켜 주던 것(초록/주황이 같은 크기 · 어둡지 않음)은 히어로의
     두 단추와 큰 카드 둘이 이어받았습니다 — 위의 "히어로에서 바로
     찾고 바로 갈라진다" 와 "큰 카드 둘의 크기가 같다" 입니다. */
  await f("연결 구간 두 딱지가 같은 높이에 앉는다", "/", `
    /* 실제로 보이던 결함은 두 딱지("정리하는 사장님" / "창업하는 사장님")가
       49px 어긋난 것이었습니다 (§22 · §23 — 한쪽이 가벼우면 화살표가 한
       방향으로만 읽힙니다). 전수 점검은 통과했고 찍어 보고 알았습니다.
       ⚠️ **카드 높이까지 같기를 바라지 마세요** — 한 번 그렇게 맞췄다가
       사진이 한쪽에만 들어오자 반대쪽 타일이 세로 2:1 로 늘어났습니다. */
    const a = document.querySelector(".mbr-cl");
    const b = document.querySelector(".mbr-st");
    if(!a || !b) return "연결 구간 두 기둥 중 하나가 없습니다";
    /* 900px 아래에서는 세로로 쌓입니다 — 나란히 놓인 때만 봅니다 */
    if(innerWidth <= 900) return true;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    if(Math.abs(ra.width - rb.width) > 2)
      return "좌우 폭이 " + Math.round(ra.width) + " · " + Math.round(rb.width) + "입니다";
    const ka = a.querySelector(".mbr-k"), kb = b.querySelector(".mbr-k");
    if(!ka || !kb) return "딱지 둘 중 하나가 없습니다";
    const ta = ka.getBoundingClientRect().top, tb = kb.getBoundingClientRect().top;
    if(Math.abs(ta - tb) > 2)
      return "두 딱지가 " + Math.round(Math.abs(ta - tb)) + "px 어긋났습니다";
    return true;`);
  await f("사진 자리가 비율을 무시하고 늘어나지 않는다", "/", `
    /* ⚠️⚠️ photoBox() 는 <img class="ph"> 라 기본값이 object-fit:fill
       입니다. 안 주면 사진이 **비율을 무시하고 늘어납니다.** 연결 구간
       두 곳이 실제로 빠져 있었는데 **사진이 0장이라 아무도 몰랐습니다.**
       그래서 사진이 없을 때도 규칙이 걸려 있는지만 봅니다. */
    const want = [".mh-ph .ph", ".ms-ph .ph", ".mbr-p .ph"];
    const bad = [];
    for(const q of want){
      let ok = false;
      for(const sh of document.styleSheets){
        let rules; try { rules = sh.cssRules; } catch(e){ continue; }
        if(!rules) continue;
        for(const r of rules){
          if(r.selectorText === q && /cover/.test(r.style.objectFit || "")) ok = true;
        }
      }
      if(!ok) bad.push(q);
    }
    return bad.length ? bad.join(" · ") + " 에 object-fit:cover 가 없습니다" : true;`);
  await f("큰 카드 둘의 분야 수가 센 값이다", "/", `
    /* ⚠️ 분야 수를 손으로 적으면 분류를 늘렸을 때 그 자리만 옛 숫자로
       남습니다 — 데이터에서 다시 세어 맞춰 봅니다.
       ⚠️ 대표로 보여 주는 여섯도 **실제 분류 이름**이어야 합니다. */
    const pair = [
      [".ms-st", (window.AM_START_CATS || []), "창업"],
      [".ms-cl", (window.AM_CLOSE_CATS || []), "폐업"]
    ];
    for(const p of pair){
      const card = document.querySelector(p[0]);
      if(!card) return p[2] + " 카드가 없습니다";
      const el = card.querySelector(".ms-more i");
      if(!el) return p[2] + " 카드에 분야 수가 없습니다";
      const got = parseInt(el.textContent.replace(/[^0-9]/g, ""), 10);
      if(got !== p[1].length)
        return p[2] + " 카드가 " + got + "개라는데 실제 " + p[1].length + "개입니다";
      const names = p[1].map(function(c){ return c.name; });
      const shown = [].slice.call(card.querySelectorAll(".ms-g b"))
        .map(function(e){ return e.textContent.trim(); });
      if(shown.length !== 6)
        return p[2] + " 카드가 " + shown.length + "개입니다 (§14 · §15 — 여섯입니다)";
      /* ⚠️ 이름을 손으로 적으면 분류 이름을 고쳤을 때 여기만 옛 이름이
         남습니다. 분류 key 로 적고 catalog.js 에서 가져오는지 봅니다.
         ⚠️ 분류가 없는 카드(프랜차이즈)는 하나까지 봐줍니다. */
      let off = 0;
      for(const t of shown) if(names.indexOf(t) < 0) off++;
      if(off > 1)
        return p[2] + " 카드에 실제 분류가 아닌 이름이 " + off + "개입니다";
    }
    return true;`);
  await f("큰 카드 둘의 크기가 같다", "/", `
    /* 폐업 쪽을 좁히거나 가볍게 만들면 그게 "덜 중요한 것" 이라는
       말입니다 (§6 · §15). 나란히 놓인 때만 봅니다. */
    const a = document.querySelector(".ms-st"), b = document.querySelector(".ms-cl");
    if(!a || !b) return "두 갈래 카드 중 하나가 없습니다";
    if(innerWidth <= 900) return true;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    if(Math.abs(ra.width - rb.width) > 2 || Math.abs(ra.height - rb.height) > 2)
      return "창업 " + Math.round(ra.width) + "×" + Math.round(ra.height) +
        " · 폐업 " + Math.round(rb.width) + "×" + Math.round(rb.height) + "입니다";
    return true;`);
  await f("큰 카드 여섯의 아이콘이 분류 것과 같다", "/", `
    /* ⚠️⚠️ 손으로 적어 두었더니 두 화면이 **서로 다른 아이콘**을 쓰고
       있었습니다 — 프랜차이즈가 전구, 재고 처리가 장바구니, 인테리어와
       철거가 둘 다 망치였습니다. 한 사이트에서 같은 것이 화면마다
       다르게 보이면 안 됩니다 (§27). 이제 catalog.js 에서 가져오므로,
       그것이 실제로 먹는지 봅니다.
       (⚠️ 이 주석에 백틱을 쓰면 문자열이 거기서 끝납니다 — 여섯 번째입니다) */
    const cards = [].slice.call(document.querySelectorAll(".ms-g a"));
    if(!cards.length) return "큰 카드 안에 항목이 없습니다";
    /* 아이콘이 비어 있으면 key 를 잘못 적은 것입니다 — 조용히 빈 칸이 됩니다 */
    for(const a of cards){
      const sv = a.querySelector("svg");
      if(!sv || !sv.innerHTML.trim())
        return "'" + (a.textContent||"").trim().slice(0,12) + "' 항목에 아이콘이 없습니다";
    }
    /* 같은 카드 안에서 같은 아이콘이 두 번 나오면 뜻이 흐려집니다 */
    for(const box of [".ms-st", ".ms-cl"]){
      const g = document.querySelector(box);
      if(!g) continue;
      const seen = [];
      for(const sv of g.querySelectorAll(".ms-g svg")){
        const d = sv.innerHTML.trim();
        if(seen.indexOf(d) >= 0)
          return box + " 안에 같은 아이콘이 두 번 나옵니다";
        seen.push(d);
      }
    }
    return true;`);
  await f("업종 열넷이 저마다 다른 색을 쓴다", "/", `
    /* ⚠️ 지시서 §19 — "사이트에 컬러가 살아있어야 한다." 전에는 분류색이
       여덟뿐이라 업종 열넷에서 t7 이 넷 · t8 · t2 · t5 · t1 이 둘씩
       겹쳤습니다. 색이 겹치면 업종이 구분되지 않습니다.
       ⚠️ 색은 industries.js 의 tone 한 줄입니다 — 화면에 손으로 적지 마세요. */
    const tiles = [].slice.call(document.querySelectorAll(".mi-g .ic-t"));
    if(tiles.length !== (window.AM_INDUSTRIES || []).length)
      return "업종 타일이 " + tiles.length + "개입니다";
    const seen = {}, dup = [];
    for(const t of tiles){
      const c = getComputedStyle(t).backgroundColor;
      if(seen[c]) dup.push(c); else seen[c] = 1;
    }
    if(dup.length) return "겹치는 아이콘 바탕이 " + dup.length + "개 있습니다 — " + dup[0];
    return true;`);
  await f("메인 구간 차례가 지시서와 같다", "/", `
    /* 지시서 §2 의 차례입니다. 늘리거나 섞기 전에 거기를 먼저 고치세요.
       ⚠️ 구간이 .sec 를 같이 답니다 — 첫 낱말만 보면 전부 "sec" 으로
       읽혀 이 검사가 아무것도 안 잡습니다. 우리 표시를 찾습니다. */
    const want = ["mh","ms-two","mi-g","mv-g","pv","fr","mk","hp","mbr","mt-g","hr","mjn"];
    const S = [].slice.call(document.querySelectorAll("#view > section"));
    if(S.length !== 12) return "구간이 " + S.length + "개입니다 (열둘이어야 합니다)";
    /* ⚠️ 범위 숫자 띠(.mst)는 히어로와 **같은 구간 안**입니다 — 떼어
       놓으면 바탕이 둘 다 크림이라 "붙어 보임" 으로 잡힙니다. */
    if(!document.querySelector(".mh .mst")) return "범위 숫자 띠가 히어로 안에 없습니다";
    const got = S.map(function(e, i){
      const mark = ["mh","mbr","mjn"];
      for(const m of mark) if(e.classList.contains(m)) return m;
      /* 안쪽 표시로 무슨 구간인지 가립니다 */
      if(e.querySelector(".ms-two")) return "ms-two";
      if(e.querySelector(".mi-g"))   return "mi-g";
      if(e.querySelector(".mv-g"))   return "mv-g";
      if(e.querySelector(".mt-g"))   return "mt-g";
      const hd = (e.querySelector(".eyebrow") || {}).textContent || "";
      if(hd.indexOf("PARTNERS") >= 0)  return "pv";
      if(hd.indexOf("FRANCHISE") >= 0) return "fr";
      if(hd.indexOf("TAKE OVER") >= 0) return "mk";
      if(hd.indexOf("PRICE") >= 0)     return "hp";
      if(hd.indexOf("REVIEWS") >= 0)   return "hr";
      return "?" + i;
    });
    if(got.join(",") !== want.join(","))
      return "차례가 " + got.join(" → ") + "입니다";
    return true;`);
  await f("이웃한 두 구간이 붙어 보이지 않는다", "/", `
    /* ⚠️⚠️ 이 저장소에서 **두 번** 당했습니다 — 아이보리와 웜 화이트를
       나란히 두어 한 구간으로 읽혔습니다. "완전히 같은 색" 만 보면
       통과하고, **채널차**로 봐도 빗나갑니다.

       채널차로 재면 민트와 하늘이 7 차이라 "붙어 보인다" 고 잡히는데,
       실제로는 치우친 쪽이 달라서(민트는 초록 · 하늘은 파랑) 사람 눈에
       뚜렷이 다릅니다. 반대로 아이보리와 웜 화이트는 둘 다 따뜻해서
       채널차가 6 이어도 하나로 읽힙니다.

       그래서 **사람 눈 기준 색차(ΔE)** 로 봅니다. 재 본 값 —
         아이보리 vs 웜 화이트  1.74   한 구간으로 읽힘 (겪은 것)
         크림 vs 흰색          2.73   살짝 다름 (지시서 §21 의 리듬)
         흰색 vs 회색          3.12   다름
         민트 vs 하늘          5.95   뚜렷이 다름
       2.3 이 겨우 구별되는 차이라, 기준을 **2.5** 로 둡니다. */
    const lab = function(c){
      const r = [c[0], c[1], c[2]].map(function(v){ v /= 255;
        return v <= .04045 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); });
      const X = (r[0]*.4124 + r[1]*.3576 + r[2]*.1805) / .95047;
      const Y = (r[0]*.2126 + r[1]*.7152 + r[2]*.0722);
      const Z = (r[0]*.0193 + r[1]*.1192 + r[2]*.9505) / 1.08883;
      const f2 = function(t){ return t > .008856 ? Math.cbrt(t) : 7.787*t + 16/116; };
      return [116*f2(Y) - 16, 500*(f2(X) - f2(Y)), 200*(f2(Y) - f2(Z))];
    };
    const dE = function(a, b){
      const A = lab(a), B = lab(b);
      return Math.sqrt(Math.pow(A[0]-B[0],2) + Math.pow(A[1]-B[1],2) + Math.pow(A[2]-B[2],2));
    };
    const S = [].slice.call(document.querySelectorAll("#view > section"));
    const rgb = function(e){
      const m = getComputedStyle(e).backgroundColor.match(/(\\d+), ?(\\d+), ?(\\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : null;
    };
    let prev = null, prevName = "";
    for(const e of S){
      const c = rgb(e);
      const name = (e.className || "").toString().split(" ")
        .filter(function(x){ return x && x !== "sec"; })[0] || e.tagName;
      if(prev && c){
        const d = dE(prev, c);
        if(d < 2.5)
          return prevName + " 와 " + name + " 사이 색차가 ΔE " +
            d.toFixed(2) + " 뿐입니다 (2.5 아래면 한 구간으로 읽힙니다)";
      }
      prev = c; prevName = name;
    }
    return true;`);

  /* ⑰ 업체 입점 (/join) — 공급 쪽이 이 플랫폼의 목숨입니다
     ⚠️ 여기가 **성과를 지어내고 싶어지는 자리**입니다. 업체를
     설득해야 하는 화면이라 "월 n건의 요청" 을 적고 싶어집니다.
     지금 0 이고, 적으면 표시광고법 제3조 위반입니다. */
  await f("입점 화면이 업체 0곳을 0 이라고 말한다", "/join", `
    const t = document.getElementById("view").textContent;
    const n = (window.AM_PROVIDERS || []).length;
    if(n === 0){
      if(t.indexOf("0곳") < 0 && t.indexOf("아직") < 0)
        return "업체가 0곳인데 화면이 그렇게 말하지 않습니다";
      /* 분야마다 붙는 배지도 0 이면 0 이라고 해야 합니다 */
      const badge = [].slice.call(document.querySelectorAll(".join-n"));
      if(!badge.length) return "분야마다 지금 몇 곳인지 안 냅니다";
      for(const b of badge)
        if(/[0-9]/.test(b.textContent) && b.textContent.indexOf("0곳") < 0)
          return "등록 0곳인데 분야 배지에 숫자가 있습니다 — " + b.textContent.trim();
      return true;
    }
    /* 업체가 생기면 **센 값**과 맞아야 합니다 */
    const cats = (window.AM_CATS || []).filter(function(c){ return c.kind === "provider"; });
    for(const c of cats){
      const want = window.amProvidersInCat(c);
      const el = [].slice.call(document.querySelectorAll(".join-cat")).filter(function(e){
        return (e.querySelector("b") || {}).textContent &&
               e.querySelector("b").textContent.indexOf(c.name) === 0; })[0];
      if(!el) continue;
      const got = (el.querySelector(".join-n") || {}).textContent || "";
      const num = parseInt((got.match(/[0-9]+/) || [0])[0], 10);
      if(want !== num) return c.name + " 가 화면 " + got.trim() + " · 실제 " + want + "입니다";
    }
    return true;`);
  await f("입점 화면에 지킬 수 없는 약속이 없다", "/join", `
    /* ⚠️ 요청 건수 · 회신 시점 · 1위는 우리가 정할 수 있는 것이
       아닙니다. 약관 제6조 · 제8조와 어긋나면 그때부터 채무입니다. */
    const t = document.getElementById("view").textContent;
    const bad = [];
    const pat = [[/월\\s*[0-9]/, "월 n건"], [/[0-9]\\s*건의?\\s*요청/, "n건의 요청"],
                 [/보장/, "보장"], [/최저가/, "최저가"], [/[0-9]\\s*시간\\s*(안|내)/, "n시간 안에"],
                 [/당일\\s*(연락|배정)/, "당일 연락"], [/1\\s*위/, "1위"],
                 [/무조건/, "무조건"]];
    for(const q of pat) if(q[0].test(t)) bad.push(q[1]);
    return bad.length ? bad.join(" · ") + " 가 있습니다" : true;`);
  await f("입점 화면이 연락처는 나중에 간다고 밝힌다", "/join", `
    /* ⚠️ 업체가 "등록하면 연락처가 바로 오는구나" 로 잘못 알면,
       실제로 안 왔을 때 그게 거짓말이 됩니다. 그리고 미리 뭉뚱그려
       받는 동의는 개인정보보호법 제17조 제2항 위반입니다. */
    const box = document.querySelector(".jn-req");
    if(!box) return "요청이 어떻게 오는지 안 보여 줍니다";
    const t = box.textContent;
    if(t.indexOf("제17조") < 0) return "제17조 근거가 없습니다";
    if(t.indexOf("들어 있지 않습니다") < 0)
      return "연락처가 안 온다는 말이 없습니다";
    /* 전달되는 칸 목록에 성함 · 연락처가 섞여 있으면 안 됩니다 */
    const fields = [].slice.call(box.querySelectorAll(".jn-req-l > li > b"))
      .map(function(e){ return e.textContent.trim(); });
    if(!fields.length) return "전달되는 칸 목록이 없습니다";
    for(const x of fields)
      if(/성함|이름|연락처|전화|휴대폰/.test(x))
        return "전달되는 칸에 " + x + " 가 있습니다";
    return true;`);

  /* ⚠️ 어느 묶음이 몇 개인지는 **적지 않습니다.** 두 번 어긋났습니다 —
     검사를 더하면서 숫자를 같이 안 고치니 "흐름 52개" 라고 적힌 채
     실제로는 56개를 돌고 있었습니다. 총 개수는 위에서 세고, 여기는
     **무엇을 보는지**만 적습니다. */
  console.log("\n── 흐름 " + flowN + "개 (지어낸 것 없음 · 업종 개인화 · 조건 전달 · " +
              "접수 · MY · 검색 · 문서 · 히어로 · 규모감 · FAQ · 진행 · " +
              "정보 글 · 글 잇기 · 창업 과정 · 폐업 선택 · 골드 · 검색 진입 · " +
              "MY 도구 · 랜딩 · 업체 입점)");
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
  /* ⚠️ 2026-09-30 §4 가 `rgba(255,255,255,.96)` + `blur(12px)` 을
     못박았습니다. 전에 반투명 헤더로 글자가 겹쳐 읽힌 적이 있어
     완전 불투명을 요구하던 검사인데, .96 은 사실상 불투명하고
     `backdrop-filter` 가 뒤를 흐려 줍니다. 그래서 **.94 미만**과
     **blur 없음**을 막습니다 — 여기를 더 투명하게 두지 마세요. */
  await f("헤더가 거의 불투명해서 밑의 글자가 안 비친다", "/", `
    const cs = getComputedStyle(document.querySelector(".hd"));
    const m = cs.backgroundColor.split("(")[1] || "";
    const parts = m.split(")")[0].split(",");
    const a = parts.length > 3 ? parseFloat(parts[3]) : 1;
    if(a < 0.94) return "헤더 배경이 반투명합니다 (" + cs.backgroundColor + ")";
    if(a < 0.999 && (cs.backdropFilter || cs.webkitBackdropFilter || "").indexOf("blur") < 0)
      return "반투명인데 blur 가 없습니다 — 밑의 글자가 그대로 비칩니다";
    return true;`);

  /* ⚠️ **카드가 구간 바탕과 같은 색이면 카드가 아닙니다.** 이 저장소는
     카드를 그림자가 아니라 **면**으로 구분합니다 — 흰 구간에서는 옅은
     회색, 회색·색 구간에서는 흰색. 그 목록이 CSS 에 손으로 적혀 있어서
     새 카드를 만들고 빠뜨리면 조용히 사라집니다. 진단 카드(.ckb-c)가
     실제로 그랬습니다. 에러도 안 나고 다른 검사도 전부 통과합니다. */
  await f("카드가 구간 바탕과 같은 색이 아니다", "/", `
    /* ⚠️ 새 카드를 만들면 여기 넣으세요 — 빠뜨리면 구간 바탕과 같은
       색이 되어도 조용히 통과합니다.
       ⚠️ lsc-i 는 넣지 않습니다. 그 카드가 앉는 면은 구간이 아니라
       **그라디언트 큰 카드**라서, 구간 배경과 비교하면 거짓으로
       걸립니다. */
    const sel = ".cat,.ind,.pv,.fr,.fc,.mk,.help,.sp,.empty," +
                ".ms-g a,.mi-g a,.mv-g a,.mt-g a,.mh-fc > li,.hb-g a,.hb-b";
    const bad = [];
    /* ⚠️⚠️ **비교 대상은 구간이 아니라 "실제로 뒤에 보이는 면"입니다.**
       구간(section)과 바로 비교했더니, 민트 큰 카드 **안에** 든 흰
       타일이 "흰 구간 위의 흰 카드" 로 잡혔습니다 — 눈으로는 멀쩡합니다.
       위로 올라가면서 투명이 아닌 첫 조상을 찾습니다. */
    const backdrop = function(el){
      let e = el.parentElement;
      while(e){
        const c = getComputedStyle(e).backgroundColor;
        if(c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") return c;
        e = e.parentElement;
      }
      return getComputedStyle(document.body).backgroundColor;
    };
    [...document.querySelectorAll(sel)].forEach(el => {
      if(!el.closest("section")) return;
      const cs = getComputedStyle(el);
      const cb = cs.backgroundColor;
      const sb = backdrop(el);
      /* ⚠️ **보이는 테두리가 있으면 카드로 읽힙니다.** 흰 카드를 흰
         구간 위에 두어도 1px 선이 있으면 가장자리가 보입니다 — 이걸
         안 봐 주면 멀쩡한 카드가 전부 걸려서, 결국 선택자에서 빼게
         되고 그러면 **진짜 사고는 조용히 지나갑니다.** */
      const bw = parseFloat(cs.borderTopWidth) || 0;
      const line = bw >= 1 && cs.borderTopStyle !== "none" &&
        cs.borderTopColor !== "rgba(0, 0, 0, 0)" && cs.borderTopColor !== cb;
      if(cb === sb && !line) bad.push((el.className || "?").split(" ")[0]);
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
  if(err && err.stack) console.error(err.stack);
  if (m.indexOf("closed") >= 0)
    console.error("   브라우저가 도중에 닫혔습니다. 대개 메모리가 모자란 것입니다 —" +
                  " 다시 돌려 보시고, 계속 그러면 VIEWS 를 줄여서 나눠 돌리세요.");
  process.exit(1);
});

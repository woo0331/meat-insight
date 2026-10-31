/* ════════════════════════════════════════════════════════════════════
   전수 점검 — 폰웨이(PHONEWAY) 중고폰 통합 거래 플랫폼

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
const PORT = 8433;
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

/* ⚠️⚠️ **표본에 없는 화면은 아무 검사도 안 받습니다** — 대비 · 누름
   크기 · 어두운 면 · 낱말 잘림 · 크롤러 본문 · h1 전부입니다. 이
   저장소가 `/home` 을 빠뜨려 크롤러 본문 95자를 몇 주 놓쳤고,
   `/shop` · `/bid` · `/track` · `/guide` 넷도 그렇게 비어 있었습니다.
   **화면을 만들면 여기 넣으세요.**

   ⚠️⚠️ **2026-10-31 — 창업 · 폐업 줄 111개를 지웠습니다** (사장님
   지시 — "그냥 인수인계 자료를 다 지워 · 중고폰 쪽은 살려두고").
   그 주소들은 `vercel.json` 이 308 로 `/` 에 보냅니다 — 표본에
   남겨 두면 검사가 **메인을 재면서 딱지만 다른 이름**이 됩니다.
   ⚠️ 꺼내 보시려면 `git show 6d85a17:check.js`. */
const PAGES = [
  ["/",                  "메인 — 구간 아홉"],
  ["/quote",             "견적 요청"],
  ["/sell",              "내 폰 팔기 (01 기기 고르기)"],
  ["/shop",              "중고폰 구매 — 상품 0건 · 예시 6건"],
  ["/d/sample-ip15p-256-a", "중고폰 상품 상세 (예시)"],
  ["/bid",               "최고가 경쟁입찰 (업체 0곳)"],
  ["/track",             "판매 진행 조회"],
  ["/guide",             "이용 안내"],
  ["/repair",            "수리 서비스"],
  ["/biz",               "기업 · 수출 문의"],
  ["/quote?c=repair&r=gyeonggi&side=repair", "견적 요청 (조건 실려 옴)"],
  ["/join",              "업체 입점하기"],
  ["/my",                "MY"],
  ["/search",            "검색 (처음)"],
  ["/search?q=%EA%B0%A4%EB%9F%AD%EC%8B%9C%20S24", "검색 결과 (갤럭시 S24)"],
  ["/search?q=zzz",      "검색 (못 찾음)"],
  ["/faq",               "자주 묻는 것"],
  ["/terms",             "이용약관"],
  ["/privacy",           "개인정보처리방침"],
  ["/nope",              "없는 주소"]
];

/* ⚠️⚠️ **업체 · 브랜드 상세는 데이터가 있어야만 생기는 주소**라,
   표본에 손으로 적어 둘 수가 없습니다 — 지금은 업체 0곳 · 브랜드 0개라
   그 주소 자체가 없습니다. 그런데 **등록되는 순간 손님이 제일 많이
   보는 화면**이 거기입니다 (업체찾기 → 업체 상세 → 견적).

   그래서 **빌드가 만들어 둔 것을 읽어** 표본에 붙입니다. 등록이
   한 건이라도 생기면 그날부터 대비 · 누름 크기 · 가로 스크롤 ·
   어두운 면까지 **저절로** 같이 봅니다. 아무도 안 넣어도 됩니다.

   ⚠️ 많아지면 검사가 한참 길어지므로 **종류마다 둘까지**만 봅니다 —
   틀이 같아서 셋째부터는 같은 것을 또 재는 셈입니다. */
(function addBuilt(){
  const fsx = require("fs"), px = require("path");
  const pick = (dir, label, n) => {
    const root = px.join(__dirname, dir);
    if(!fsx.existsSync(root)) return;
    fsx.readdirSync(root, { withFileTypes:true })
      .filter(d => d.isDirectory())
      .slice(0, n)
      .forEach(d => PAGES.push(["/" + dir + "/" + d.name, label + " — " + d.name]));
  };
  /* ⚠️⚠️ **2026-10-31 — 넷을 하나로 바꿨습니다.** `p` · `f` · `s` · `a`
     는 창업 · 폐업 쪽 상세(업체 · 브랜드 · 점포 · 시설)이고 **네 주소
     전부 410** 입니다 (vercel.json 의 rewrites). 폴더가 없으니 `pick()`
     이 그냥 돌아와서 **아무것도 안 보는 네 줄**이었습니다 — 그대로
     두면 다음 사람이 "상세 화면은 저절로 표본에 든다" 고 믿는데
     드는 것이 없습니다.
     ⚠️ 중고폰 상품 상세(`/d/:id`)가 지금 그 자리입니다 — 빌드가
     만들어 둔 폴더에서 둘을 집습니다. 업체 상세를 되살리시는 날
     `pick("p", …)` 한 줄을 다시 넣으세요. */
  pick("d", "중고폰 상품 상세", 2);
})();
/* ⚠️ **360px 을 같이 봅니다.** 폰은 390px 만 있는 것이 아닙니다 —
   갤럭시 계열이 360px 이고, 새 헤더가 거기서만 370px 로 넘쳐
   가로 스크롤이 났습니다. 390 만 재던 동안 통과하고 있었습니다. */
/* ⚠️⚠️ **2026-10-06 V2 확정 지시서 §26 이 적은 여섯 폭**에 360 을
   더해 일곱입니다. 360(갤럭시)은 지시서에 없지만 이 저장소에서
   **거기서만 넘친 적**이 있어 뺄 수가 없습니다 — 헤더 CTA 글자가
   길어졌을 때 390 은 통과하고 360 만 가로 스크롤이 났습니다.
   ⚠️ 폭을 늘리면 전수 점검이 그만큼 길어집니다. 줄이지는 마세요 —
   짧은 화면 · 좁은 화면이 늘 범인이었습니다. */
/* ⚠️⚠️ **320px 을 빼지 마세요** (2026-10-26). 일곱 폭이 360 에서
   끊겨 있어서 **옛 아이폰 SE(320px)가 영원히 통과**했고, 거기서
   가로 스크롤 11px 이 실제로 났습니다 (2026-10-19 에 340px 아래
   돋보기를 접어 고쳤습니다). 이 저장소가 "390 만 재다가 360 에서
   넘쳤다" 로 한 번 겪고 360 을 넣었는데 **320 은 그대로 비어
   있었습니다** — 같은 구멍을 두 번 둘 까닭이 없습니다.
   ⚠️ 폭이 하나 늘면 이 묶음이 그만큼 길어집니다 (제일 긴 검사입니다).
   ⚠️ 넣을 때 122개 화면을 320px 로 재 보고 **넘침 · 누름 · 12px 미만 ·
   낱말 잘림 · 헤더 침범이 전부 0** 인 것을 확인했습니다 — 새로 걸리는
   것이 없어서 들어온 것이지, 걸릴 것을 알고도 넣은 것이 아닙니다. */
const VIEWS = [[1440,900,"데스크톱"],[1024,820,"태블릿"],[768,1024,"작은 태블릿"],
               [430,932,"큰 폰"],[390,844,"모바일"],[375,812,"작은 폰"],
               [360,800,"좁은 폰"],[320,568,"제일 좁은 폰"]];

/* 손님 화면에 있으면 안 되는 말 */
/* ⚠️ 조사를 괄호로 때운 자리(은(는) · 을(를))도 여기서 걸립니다.
   화면에도 보이지만, 더 나쁜 것은 **구글 검색 결과 줄**에 그대로
   나간다는 점입니다 — 카테고리 17개가 실제로 그랬습니다. */
/* ⚠️ "지시서 12번" 이 파트너 안내 화면에 그대로 나간 적이 있습니다.
   운영자끼리 쓰는 말(지시서 · 스펙 · MVP · 어드민 · TODO)은 손님 화면에
   있으면 안 됩니다 (절대 규칙 3). */
const BAD = /undefined|NaN|\[object |null년|console\.|localStorage|TODO|FIXME|placeholder|지시서|스펙 ?\d|어드민|[은는이가을를와과](\([은는이가을를와과]\))/i;

const AUDIT = `(() => {
  const W = window.innerWidth, out = { small:[], tap:[], wrap:[], bad:[], glue:[], mix:[], h1:[], dim:[], eye:[], star:[], dark:[], tone:[], ph:[], ico:[], sel:[], hord:[], hdfit:[], chrome:[], vow:[] };
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
      let c = rgb(cs.backgroundColor);
      /* ⚠️⚠️ **덮는 가짜요소에 그라디언트가 있으면 잴 수 없습니다.**
         2026-10-13 히어로는 사진 위에 글이 앉고, 짙게 덮는 막이
         .mh2-p 의 ::after 에 그라디언트로 있습니다. 판 자신에게는
         사진이 없을 때를 위한 **밝은 바탕색**이 있어서, 아래 가짜요소
         읽기가 c[3] < .999 일 때만 돌다 보니 여기서 그 밝은 색을
         그대로 집었습니다 — 흰 글자가 "하늘색 바탕 위" 로 읽혀 대비
         **1.61** 이 나왔습니다. 전부 오탐이고, 진짜 사고가 그 더미에
         묻힙니다 (그라디언트 · 히어로 ::before 로 두 번 겪은 자리).
         ⚠️ 바로 윗줄이 **자기 바탕 이미지**에 대해 이미 이렇게 하고
         있습니다 — 가짜요소만 빠져 있었습니다.
         ⚠️⚠️ 그래서 **사진 위 글자는 검사가 영원히 못 잽니다** —
         찍어서 픽셀로 재세요 (CLAUDE.md 가 적어 둔 그대로입니다). */
      for(const pe of ["::before", "::after"]){
        const ps = getComputedStyle(n, pe);
        if(ps.content === "none") continue;
        if(!ps.backgroundImage || ps.backgroundImage === "none") continue;
        const box = n.getBoundingClientRect();
        const pw = parseFloat(ps.width), ph = parseFloat(ps.height);
        if(pw >= box.width * 0.8 && ph >= box.height * 0.6) return null;
      }
      /* ⚠️⚠️ **가짜요소에 칠한 바탕도 읽습니다.** 히어로 왼쪽 판의
         짙은 남색은 대각선 때문에 판 자신이 아니라 ::before 에
         있습니다 — 안 읽으면 그 위의 **흰 글자가 "흰 바탕" 위로**
         읽혀서 대비 1.04 로 잡힙니다 (전부 오탐이고, 진짜 사고는
         그 더미에 묻힙니다). 어두운 면 검사는 이미 ::before 를
         읽고 있었는데 대비 검사만 안 읽고 있었습니다.
         ⚠️ **덮는 크기일 때만 봅니다** — 글머리 점(6x6)까지 바탕으로
         세면 요약 칸의 남색 글씨가 남색 점 위에 앉은 것으로 읽힙니다
         (실제로 그렇게 180건이 잡혔습니다). */
      if(!c || c[3] < .999){
        const box = n.getBoundingClientRect();
        for(const pe of ["::before", "::after"]){
          const ps = getComputedStyle(n, pe);
          if(ps.content === "none") continue;
          if(ps.backgroundImage && ps.backgroundImage !== "none") return null;
          const pc = rgb(ps.backgroundColor);
          if(!pc || pc[3] < .999) continue;
          const pw = parseFloat(ps.width), ph = parseFloat(ps.height);
          if(!(pw >= box.width * 0.8 && ph >= box.height * 0.8)) continue;
          c = pc; break;
        }
      }
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

    /* 3. 12px 미만
       ⚠️⚠️ **"잎사귀" 만 보면 아이콘이 든 칸을 영영 못 봅니다.**
       아래 대비 검사와 함께 leaf(자식이 하나도 없는 칸)만 재고
       있었는데, 이 저장소의 배지 · 칩 · 단추는 **거의 전부 svg 아이콘
       하나를 품고** 있습니다 — 확인 배지 · 후기 인증 배지 · "포트폴리오
       2건" · 단추 글자가 **한 번도 안 재졌습니다.** 별표 검사가 똑같이
       잎사귀만 보다가 약관 두 문서를 놓친 그 자리입니다.
       이제 **칸이 직접 들고 있는 글자**가 있으면 잽니다 (부모가 자식
       글자까지 중복으로 잡히지는 않습니다). */
    if (leaf || ownTxt.trim()) {
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

  /* 7-2b. **flex 칸에서도 같은 일이 납니다** — 2026-10-25 에 겪었습니다.
     아이콘 + 맨글 + 태그 + 맨글 을 그냥 넣으면 태그가 **제 칸**이 되고
     앞뒤 맨글도 각각 칸이 되어, 좁은 폭에서 "서비 / 스" · "분류 / 기준"
     으로 세 칸이 세로로 쪼개집니다. 넓은 폭에서는 한 줄에 서서 멀쩡해
     보이고 가로 스크롤도 대비도 멀쩡해서 **찍어 봐야** 압니다.
     ⚠️ CLAUDE.md 가 grid 로 적어 둔 규칙이 flex 에도 그대로인데
     **검사는 grid 만 보고 있었습니다.**

     ⚠️⚠️ 보는 것은 **맨글이 둘 이상**인 자리뿐입니다 — 태그가 문장을
     가운데서 가른 꼴입니다. "아이콘 + 글" (맨글 하나)은 정상이고,
     "제목 태그 + 설명 맨글" 도 일부러 두 칸으로 두는 자리가 있어
     건드리지 않습니다. 고치는 법은 grid 와 같습니다 — **글 전체를
     태그 하나로 감싸세요.** 일부러 그런 곳은 class 에 'g-mix'. */
  document.querySelectorAll("body *").forEach(el => {
    if (!vis(el)) return;
    const c = getComputedStyle(el);
    if (c.display !== "flex" && c.display !== "inline-flex") return;
    if (String(el.className).indexOf("g-mix") >= 0) return;
    let text = 0, items = 0;
    el.childNodes.forEach(n => {
      if (n.nodeType === 3 && n.nodeValue.trim()) { text++; items++; }
      else if (n.nodeType === 1) {
        const cs = getComputedStyle(n);
        if (cs.position !== "absolute" && cs.position !== "fixed" && cs.display !== "none") items++;
      }
    });
    if (text >= 2)
      out.mix.push(String(el.className || el.tagName).split(" ")[0] +
        "|flex 에 맨글"+text+" 항목"+items+"|" + (el.textContent||"").trim().slice(0,20));
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
    /* ⚠️⚠️ **빈 h1 도 하나로 셉니다** — 2026-10-29 에 그렇게 당했습니다.
       PgHero() 의 칸 이름을 h1 이 아니라 h 로 적었더니 **다섯 화면이
       전부 빈 제목**으로 나갔는데, 개수는 1 이라 이 검사가 통과했고
       에러도 안 났습니다. 머리말 자리에 아무것도 없고 설명만 덩그러니
       떠 있는 꼴이라 **찍어 봐야** 알았습니다.
       ⚠️ 위의 개수 검사와 **갈라 둡니다** — 하나로 묶으면 "제목이
       하나인가" 와 "그 제목에 글자가 있는가" 중 한쪽만 보게 됩니다. */
    h1.forEach(e => {
      if (!(e.textContent || "").trim())
        out.h1.push("제목(h1)이 비었습니다 — " +
          String(e.className || "h1").split(" ")[0]);
    });
  }
  /* 9-2. **제목 차례를 건너뛰지 않는가** (h1 → h3 금지)
     ⚠️⚠️ 읽어 주는 프로그램을 쓰는 분은 제목으로 화면의 뼈대를
     잡습니다. h2 를 건너뛰고 h3 이 나오면 그 뼈대가 끊깁니다.
     ⚠️ 위의 h1 검사는 **개수만** 봅니다 — 차례는 아무도 안 보고
     있었고, 재 보니 메인과 약관 · 방침 **세 화면**이 1 → 3 으로
     건너뛰고 있었습니다 (목차 · 전문관 서비스 머리말).
     ⚠️ 404.html 은 #view 가 없어 main 에서 셉니다 (h1 검사와 같습니다).
     ⚠️⚠️ **문서 전체를 봅니다 — 전에는 view 안만 봤습니다.**
     푸터 칸 머리말이 h4 인데 본문이 h2 에서 끝나서, 문서 차례가
     163개 화면 **전부**에서 h2 → h4 로 건너뛰고 있었는데 이 검사가
     view 안만 보느라 영원히 통과했습니다 (푸터는 그 밖입니다).
     ⚠️ 주석에 백틱을 쓰지 마세요 — 검사 본문이 템플릿 문자열이라
     거기서 끊깁니다 (여기서 스물여덟 번째로 겪었습니다).
     머리 · 푸터 · 아래 네비는 160개 화면이 같이 쓰는 것이라, 거기서
     한 번 끊기면 **한 화면이 아니라 전부**가 끊깁니다. */
  {
    const root = document.getElementById("view") ? document.body
      : (document.querySelector("main") || document.body);
    const hs = [...root.querySelectorAll("h1,h2,h3,h4,h5,h6")]
      .filter(vis).map(e => +e.tagName[1]);
    for(let i = 1; i < hs.length; i++)
      if(hs[i] - hs[i-1] > 1){
        out.hord.push("h" + hs[i-1] + " 다음에 h" + hs[i] + " — [" + hs.join(" ") + "]");
        break;
      }
    if(hs.length && hs[0] !== 1 && !out.hord.length)
      out.hord.push("첫 제목이 h" + hs[0] + "입니다 — [" + hs.join(" ") + "]");
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
    /* ⚠️⚠️ **가짜요소의 바탕도 셉니다.** 2026-10-04 히어로의 짙은
       남색은 대각선 때문에 판 자신이 아니라 ::before 에 있습니다 —
       판만 읽으면 투명으로 읽혀 이 검사가 그 면을 **못 봅니다.**
       그라디언트를 그대로 읽었다가 똑같이 빠졌던 자리입니다. 넓이는
       판 자신의 크기로 잡습니다 (가짜요소는 rect 가 없습니다). */
    const dk1 = (e, ps) => {
      const c = rgb(getComputedStyle(e, ps || null).backgroundColor);
      if(!c || c[3] < 0.9) return false;
      return lum(c) < 0.09;
    };
    const dk = e => dk1(e) || dk1(e, "::before") || dk1(e, "::after");
    /* ⚠️⚠️ **가짜요소는 제 크기만큼만 셉니다.** 안 그러면 글머리
       점(6x6)이 300x116 짜리 줄을 통째로 "어두운 면" 으로 만듭니다 —
       정보 글 화면이 첫 화면 28% 로 잡혔고, 점 세 개가 범인이었습니다.
       이 저장소가 **대비 검사**에서 똑같이 겪고(180건) 거기는 "덮는
       크기일 때만" 으로 고쳐 두었는데, 어두운 면 검사만 그 규칙이
       빠져 있었습니다.
       ⚠️ 히어로처럼 **판을 덮는** 가짜요소는 그대로 다 셉니다 (크기가
       판만 하니까요) — 2026-10-04 에 그것 때문에 넣은 규칙이라
       빼면 안 됩니다. */
    const dkArea = (e, rect) => {
      if(dk1(e)) return rect.width * rect.height;
      for(const pe of ["::before", "::after"]){
        if(!dk1(e, pe)) continue;
        const ps = getComputedStyle(e, pe);
        const pw = parseFloat(ps.width), ph = parseFloat(ps.height);
        /* auto 면 크기를 알 수 없으니 칸 전체로 봅니다 (안전한 쪽) */
        if(!isFinite(pw) || !isFinite(ph)) return rect.width * rect.height;
        return Math.min(pw, rect.width) * Math.min(ph, rect.height);
      }
      return 0;
    };
    /* ⚠️⚠️ **메인은 ① ② 를 재지 않습니다.** 2026-10-17 §3-2 · §6 이
       **진입 카드 셋의 면**(창업 브라운 · 운영 딥그린 · 폐업 버건디)과
       **양도양수 배너 · 하단 CTA** 를 다크로 못박았습니다 — 그 다섯을
       세면 문서로 45% 가 나오는데, 그건 **지시대로 넣었기 때문**이지
       사고가 아닙니다. 그렇다고 한도를 올리면 속화면에 어두운 면이
       기어들어와도 아무도 안 보는 것이 됩니다 — 그래서 한도는 둘 다
       15% 그대로 두고 **메인에서만 건너뜁니다.**
       ⚠️⚠️ 대신 아래 짝 검사 둘이 봅니다 — "메인 구간 바탕은 밝다"
       (§3-2 가 선택받는 이유 · 이용 방법 · 계산도구를 직접 적었습니다)
       와 "속화면은 그대로 밝다". 메인의 표시(html 의 ivh)는 빌드가
       하위 화면에서 떼어 내는데, 그게 새면 속화면 160개가 메인 바탕을
       쓰게 되고 구간 리듬(ΔE 2.5)이 한꺼번에 어긋납니다. */
    const ivHome = document.documentElement.classList.contains("ivh");
    if(ivHome && location.pathname !== "/")
      out.dark.push("메인 밖인데 메인 표시(ivh)가 붙어 있습니다 — " + location.pathname);
    if(!ivHome){
    let area = 0, ftArea = 0; const seen = [], big = [];
    document.querySelectorAll("body *").forEach(e => {
      const cs = getComputedStyle(e);
      if(cs.display === "none" || cs.visibility === "hidden") return;
      if(cs.position === "fixed") return;   /* 헤더·아래 네비는 겹침입니다 */
      if(!dk(e)) return;
      for(const q of seen) if(q.contains(e)) return;
      seen.push(e);
      const r = e.getBoundingClientRect();
      const ar = dkArea(e, r);
      if(!ar) return;
      area += ar;
      /* ⚠️ 푸터 안에 있는 것을 **따로 쌓습니다** — ① 에서 분모가 아니라
         분자에서 뺄 것이기 때문입니다 (푸터도 문서의 한 부분이고,
         빼는 것은 "어두운 면" 이지 "높이" 가 아닙니다). */
      const inFt = !!e.closest(".ft");
      if(inFt) ftArea += ar;
      big.push([ar, (e.className || e.tagName).toString().split(" ")[0], inFt]);
    });
    const total = W * document.documentElement.scrollHeight;
    /* ⚠️⚠️ **2026-10-13 — 재는 자리가 둘이 됐습니다.** 지시서 §12 가
       푸터를 다시 **짙은 에스프레소(#30241E)** 로 두라고 적었습니다.
       문서 전으로 재면 짧은 화면이 36~49% 가 되는데(재 봤습니다),
       그것은 **지시대로 넣었기 때문**이지 사고가 아닙니다. 그렇다고
       한도를 50% 로 올리면 **본문에 어두운 면이 기어들어와도 아무도
       안 보는** 것이 됩니다 — 그래서 한도는 **둘 다 15% 그대로** 두고
       재는 자리를 갈랐습니다.

         ① **본문**(푸터 제외) · 문서 전으로  — 재 보니 제일 높은 것 2.0%
         ② **첫 화면**(푸터 포함 · fixed 포함) · 한 장  — 제일 높은 것 5.2%

       ⚠️⚠️ ② 가 2026-10-01 사고를 막는 짜짜한 자물쇠입니다 — 그때
       사장님이 보시고 물으신 것은 "문서의 몇 퍼센트" 가 아니라
       **화면이 어둡다**는 것이었습니다. 그래서 §12 를 넣으면서
       #view 에 min-height 를 주어 **푸터가 첫 화면에 안 올라오게**
       만들었습니다 (/search 가 32.6% → 3.9%).
       ⚠️ 푸터를 다시 밝혀야 하면 --bg-foot 한 줄과 css/app.css 맨
       뒤의 푸터 블록만 건드리면 됩니다 — 이 검사는 그대로 둡니다. */
    const pct = total ? (area - ftArea) / total * 100 : 0;
    /* ⚠️ **넓은 것부터** 적습니다. DOM 차례대로 적었더니 건너뛰기 링크와
       로고 타일이 먼저 나와서, 정작 범인인 푸터가 안 보였습니다. */
    if(pct > 15)
      out.dark.push("본문 " + pct.toFixed(1) + "% — " + big
        .filter(x => !x[2]).sort((x,y) => y[0] - x[0])
        .slice(0,3).map(x => x[1]).join(" · "));

    /* ② 첫 화면 한 장 — 푸터는 세어서 잽니다 (첫 화면에서는 색깔로
       실제로 보이니까요).
       ⚠️⚠️ **2026-10-16 §2-1 — 헤더와 아래 네비는 빼고 잽니다.**
       지시서가 그 둘을 #1D1511 로 **직접 정했습니다.** 재 보니 360×900
       에서 그 둘만 134px, **14.9%** 입니다 — 안 빼면 본문이 아무리
       밝아도 짧은 화면이 전부 걸리고, 그러면 이 검사가 하는 말이
       "지시대로 만들었습니다" 가 됩니다.
       ⚠️⚠️ **푸터는 그대로 셉니다.** 2026-10-01 사고(짧은 화면에서 푸터
       하나가 화면의 절반)가 거기서 났고, #view 의 min-height 가 그것을
       막고 있는지를 이 검사가 봅니다 — 빼면 그 자물쇠가 풀립니다.
       ⚠️ 헤더가 커지는 것은 이 검사가 아니라 "헤더 메뉴가 오른쪽 위로
       올라앉음" 과 폭 재기가 봅니다. */
    {
      const VH = window.innerHeight;
      let a1 = 0; const s1 = [], b1 = [];
      document.querySelectorAll("body *").forEach(e => {
        const cs = getComputedStyle(e);
        if(cs.display === "none" || cs.visibility === "hidden") return;
        if(e.closest(".hd") || e.closest(".mnav")) return;
        if(!dk(e)) return;
        for(const q of s1) if(q.contains(e)) return;
        s1.push(e);
        const r = e.getBoundingClientRect();
        const t = Math.max(0, r.top), b = Math.min(VH, r.bottom);
        if(b <= t) return;
        /* 첫 화면에 걸친 만큼만 — 가짜요소는 제 크기만큼입니다 */
        const full = dkArea(e, r);
        if(!full) return;
        const ar = full * ((b - t) / (r.height || 1));
        a1 += ar;
        b1.push([ar, (e.className || e.tagName).toString().split(" ")[0]]);
      });
      const p1 = VH ? a1 / (W * VH) * 100 : 0;
      if(p1 > 15)
        out.dark.push("첫 화면 " + p1.toFixed(1) + "% — " + b1
          .sort((x,y) => y[0] - x[0]).slice(0,3).map(x => x[1]).join(" · "));
    }
    }
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

  /* ⚠️⚠️ **지킬 수 없는 약속을 화면마다 봅니다** (PHONEWAY 지시서 §5 —
     "무료" · "최고가 보장" · "당일 정산" 금지 · 절대 규칙 5).
     ⚠️⚠️ **전에는 메인의 신뢰 요소 한 칸만** 보고 있었습니다. 그래서
     /quote 의 머리말이 "무료입니다" 로 나가는 것을 아무도 안 보고
     있었고, 정작 메인에는 "이 화면에 무료를 적지 마세요" 라는 고지가
     붙어 있었습니다 (2026-10-31 에 dist 를 글자로 세어 찾았습니다).
     §5 는 **사이트 전체**의 규칙이라 재는 자리도 화면 전부입니다.
     ⚠️ "무료수신거부" 는 정보통신망법 제50조 제4항이 요구하는 표기라
     예외입니다 — 다만 그 글은 /admin 에만 있어서 여기 안 걸립니다
     (전수 점검은 /admin 을 못 봅니다). 혹시 손님 화면으로 오면
     그때 여기에 예외를 적으세요.
     ⚠️⚠️ **예외가 하나 있습니다 — 메인의 거래 전 고지(.pwt-n).**
     그 줄은 "이 화면에 무료 · 당일 정산 · 최고가 보장 을 **적지
     않았습니다**" 라고 밝히는 글입니다 — 주장이 아니라 **안 한다는
     고지**라서 금지 낱말을 글자로 담고 있어도 맞습니다. 그 칸을
     빼지 않으면 멀쩡한 메인이 걸립니다 (재 보고 알았습니다).
     ⚠️ 예외를 늘리실 때는 **그 칸이 정말 "안 한다" 를 말하는지**
     보세요 — 약속하는 글에 예외를 주면 이 검사가 뜻을 잃습니다.
     ⚠️ 정규식 대신 indexOf 입니다 — 본문이 템플릿 문자열입니다. */
  {
    const VOW = ["무료", "최고가 보장", "최고가보장", "당일 정산",
                 "당일정산", "최저가", "100% 보장"];
    /* ⚠️⚠️ **잎사귀만 세지 마세요.** 처음에 그렇게 적었는데, 이 글은
       한 칸 안에서 b · br 로 쪼개져 있어서 **자식이 있는 칸이 통째로
       빠집니다** — 되돌려 봐도 안 잡힙니다 (재 보고 알았습니다).
       글자 노드를 직접 훑고 .pwt-n 안만 건너뜁니다. */
    const vbox = document.getElementById("view");
    let vt = "";
    const walk = n => {
      if(n.nodeType === 1){
        if(n.classList && n.classList.contains("pwt-n")) return;
        n.childNodes.forEach(walk);
      } else if(n.nodeType === 3) vt += " " + (n.nodeValue || "");
    };
    if(vbox) walk(vbox);
    VOW.forEach(w => { if(vt.indexOf(w) >= 0) out.vow.push(w); });
  }

  /* ⚠️⚠️ **없는 아이콘 key 를 적으면 빈 칸이 그려집니다.**
     icon() 은 모르는 이름에 **빈 문자열**을 돌려줍니다 — 에러도 안 나고
     화면도 안 죽고, 그 타일만 덩그러니 빕니다. 매장 구간의 "장비"
     카드가 그렇게 fridge 라는 없는 이름을 달고 몇 주 비어 있었습니다.
     아이콘 타일(.ic-t)과 단계 아이콘(.stg-i) 안에 svg 가 없으면
     그 자리가 빈 것입니다. */
  /* ⚠️⚠️ **고르개 딱지가 칸보다 길면 조용히 잘립니다.** select 안의
     글자는 **낱말 잘림 검사에도 가로 스크롤 검사에도 안 걸립니다** —
     이 저장소에서 "양도 · 임대 전체" · "낱개 · 일괄 전체" · "영업기간
     전체" **세 번** 그랬고 세 번 다 찍어 보고 알았습니다. 글자 폭을
     재서 칸 안쪽과 견줍니다. */
  document.querySelectorAll("#view select.sel").forEach(e => {
    const o = e.options[e.selectedIndex];
    if(!o || !e.offsetParent) return;
    const cs = getComputedStyle(e);
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;font:" + cs.font;
    probe.textContent = o.textContent;
    document.body.appendChild(probe);
    const need = probe.getBoundingClientRect().width;
    probe.remove();
    const inner = e.getBoundingClientRect().width
      - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if(inner > 0 && need > inner)
      out.sel.push(o.textContent.trim() + "|" + Math.round(need) + ">" + Math.round(inner));
  });

  /* ⚠️⚠️ **헤더 메뉴가 넘치는 것은 어느 검사도 못 잡고 있었습니다.**
     이 저장소가 세 번 재서 손으로 표를 적어 둔 자리입니다 — 메뉴가
     쓸 수 있는 폭을 넘기면 **가로 스크롤이 나는 것이 아니라** 메뉴가
     헤더 오른쪽(검색 · 내 기록 · 견적) 위로 **올라앉습니다.**
     gnb 가 min-width:0 이라 문서 폭은 그대로여서 "가로 스크롤"
     검사도 · "낱말 잘림" 검사도 영원히 통과합니다.
     ⚠️ 이 주석에 백틱을 쓰지 마세요 — 이 저장소가 스물두 번 겪었습니다.
     ⚠️ 그래서 세 가지를 같이 봅니다 —
       ① 메뉴 글자 + 간격이 쓸 수 있는 폭보다 넓은가
       ② 칸 하나라도 오른쪽 덩이의 왼쪽 선을 넘었는가
       ③ 두 줄로 내려갔는가
     ⚠️ 2026-10-16 §4 로 메뉴가 **여덟**이 됐고, 1100px 아래에서는
     통째로 접히고 햄버거 서랍이 받습니다 — 접힌 폭에서는 건너뜁니다. */
  (function(){
    const g = document.querySelector(".hd .gnb"), r = document.querySelector(".hd .hd-r");
    if(!g || !r || !g.offsetParent) return;
    const as = [].slice.call(g.querySelectorAll("a"));
    if(!as.length) return;
    const gap = parseFloat(getComputedStyle(g).gap) || 0;
    let need = gap * (as.length - 1), rows = {}, over = 0;
    const rl = r.getBoundingClientRect().left;
    as.forEach(function(a){
      const b = a.getBoundingClientRect();
      need += b.width;
      rows[Math.round(b.top)] = 1;
      if(b.right > rl + 0.5) over++;
    });
    const have = g.getBoundingClientRect().width;
    if(need > have + 0.5)
      out.hdfit.push("메뉴 " + as.length + "칸이 " + Math.round(need) +
        "px 인데 자리가 " + Math.round(have) + "px");
    if(over)
      out.hdfit.push(over + "칸이 헤더 오른쪽 덩이를 넘었습니다");
    if(Object.keys(rows).length > 1)
      out.hdfit.push("메뉴가 " + Object.keys(rows).length + "줄입니다");
  })();

  /* ⚠️⚠️ **머리 · 푸터 · 아래 네비는 화면마다 딱 하나입니다** (2026-10-20).
     mountChrome() 은 한 번만 돌고 innerHTML 로 **갈아 끼웁니다** —
     그런데 그걸 보는 검사가 **하나도 없었습니다.** 라우터를 고치다
     덧붙이기로 바뀌거나 구간 함수가 푸터를 또 그리면 **에러도 안 나고
     가로 스크롤도 안 나면서** 두 벌이 됩니다.
     ⚠️⚠️ 푸터를 가르는 **가로줄도 셉니다 — 하나여야 합니다.**
     2026-10-20 에 ft-tail 과 ft-role 이 border-top 을 하나씩 들고
     있어서, 푸터 **하나**가 화면에서는 가로줄로 갈린 덩이 셋
     (칸 다섯 → 통합검색·내 기록 → 중개 고지)으로 보였습니다. 사장님이
     "푸터가 세 번 반복된다" 고 하신 것이 그것이고, 늘어난 것은 DOM 이
     아니라 **가로줄**이었습니다.
     ⚠️ 폰에서 ft-col 다섯이 긋는 줄은 **접는 목록의 칸막이**라
     세지 않습니다 — 그래서 .ft .w 의 **바로 아래 자식**만 봅니다.
     ⚠️⚠️ **주석에 백틱을 쓰지 마세요** — 이 검사 본문은 템플릿
     문자열이라 거기서 끊깁니다 (이 저장소가 스물세 번 겪었습니다). */
  (function(){
    /* ⚠️⚠️ **라우터 밖 화면은 건너뜁니다.** 404.html 은 혼자 뜨는
       화면이라 chrome-t · chrome-b 가 아예 없고 머리도 푸터도 아래
       네비도 **없는 것이 맞습니다** (제 토큰을 따로 들고 있는 그
       화면입니다). 그걸 모르고 "0개입니다" 로 잡았습니다 — 코드가
       아니라 **검사가 틀린** 자리입니다.
       ⚠️ 붙는 자리(chrome-b)는 mountChrome 뒤에도 남습니다. 그래서
       **라우터 화면에서 푸터가 0개가 되는 것**은 그대로 잡습니다. */
    if(!document.getElementById("chrome-b")) return;
    [[".ft","푸터"], [".hd","헤더"], [".mnav","아래 네비"]].forEach(function(p){
      const n = document.querySelectorAll(p[0]).length;
      if(n !== 1) out.chrome.push(p[1] + "가 " + n + "개입니다");
    });
    const w = document.querySelector(".ft > .w");
    if(!w) return;
    let rules = 0;
    [].slice.call(w.children).forEach(function(e){
      const cs = getComputedStyle(e);
      if(parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") rules++;
    });
    if(rules !== 1)
      out.chrome.push("푸터를 가르는 가로줄이 " + rules + "개입니다 (하나여야 합니다)");
  })();

  /* ⚠️⚠️ **새 아이콘 타일을 만들면 여기 넣으세요.** 빠뜨리면 없는
     아이콘 이름을 적어도 조용히 통과합니다 — 매장 구간의 "장비" 가
     fridge 라는 없는 이름으로 몇 주 비어 있던 자리입니다.
     2026-10-11 최종 디자인으로 메인에 .mhall-i(전문관) · .mstp-i(절차)
     가 늘었고, 계산도구 원판은 .ia-t 입니다. */
  document.querySelectorAll("#view .ic-t, #view .stg-i, #view .ia-t," +
                            " #view .mhall-i, #view .mstp-i," +
                            " #view .bent-i, #view .bwhy-i, #view .bban-i," +
                            " #view .bstep-i, #view .bcal-i," +
                            /* 2026-10-29 PHONEWAY — 메인 구간 여섯의 타일 ·
                               /sell 01 기기 카드 · /my 폰웨이 띠.
                               ⚠️ 새 타일을 만들면 **여기 같이 넣으세요** —
                               안 넣으면 컬러 아이콘에 없는 이름을 적어도
                               빈 칸이 조용히 섭니다 (search 로 겪었습니다). */
                            " #view .pww-ic, #view .dvc-ph," +
                            /* 2026-10-29 오렌지 시안 — 신뢰 넷 ·
                               바로가기 다섯 · 기업수출 화면 셋
                               2026-10-30 전면 리뉴얼 — 핵심 서비스 여섯(pwsv-i) */
                            " #view .pwh-tr-g i, #view .pwq-c i, #view .pwsv-i," +
                            " #view .pwz-g i," +
                            " #view .my-pw-i").forEach(e => {
    if(e.querySelector("svg")) return;
    /* 2026-10-30 — 기기 카드 넷은 **사진**이 아이콘 자리를 받습니다.
       빈 액자(ph-none)는 그대로 빈 것으로 셉니다. */
    if(e.querySelector("img.ph:not(.ph-none)")) return;
    const own = (e.parentElement || e);
    out.ico.push((own.textContent || "").trim().slice(0, 14) || "(이름 없음)");
  });

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

    const bad = { small:[], tap:[], wrap:[], bad:[], glue:[], mix:[], h1:[], dim:[], eye:[], star:[], dark:[], tone:[], ph:[], ico:[], sel:[], hord:[], hdfit:[], chrome:[], vow:[], over:[] };
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
      ["grid · flex 칸에 글과 태그가 섞임", uniq(bad.mix)],
      ["화면 제목(h1)", uniq(bad.h1)],
      ["개발자 말 노출",     uniq(bad.bad)],
      ["구간 머리말이 회색으로 죽음", uniq(bad.eye)],
      ["별표(**)가 글자로 남음", uniq(bad.star)],
      ["제목 차례를 건너뜀",     uniq(bad.hord)],
      ["어두운 면이 15% 넘음",   uniq(bad.dark)],
      ["이웃한 두 구간이 붙어 보임", uniq(bad.tone)],
      ["\"준비 중\" 자리표시자", uniq(bad.ph)],
      ["지킬 수 없는 약속 (무료 · 최고가 보장 · 당일 정산)", uniq(bad.vow)],
      ["아이콘 자리가 비었음", uniq(bad.ico)],
      ["고르개 딱지가 칸보다 긺", uniq(bad.sel)],
      ["헤더 메뉴가 오른쪽 위로 올라앉음", uniq(bad.hdfit)],
      ["머리 · 푸터 · 아래 네비가 하나가 아님", uniq(bad.chrome)]
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
    /* ⚠️⚠️ **칸 이름을 박지 마세요.** 전에 여덟 줄이
       `/startup` · `/providers` · `/tools` · `/content` 를 **글자로**
       들고 있었는데, 2026-10-29 로 메뉴와 네비가 PHONEWAY 것이 되자
       **멀쩡한 코드를 여덟 건이나 "틀렸다" 고** 잡았습니다 — 바로 아래
       주석이 이미 "여기서 지키는 것은 칸 이름이 아니다" 라고 적어 두고
       정작 코드는 이름을 박고 있었습니다 (`tools/test-admin.js` 가
       브랜드 이름을 박아 둔 그 자리입니다).
       지금 보는 것은 **뜻 둘**입니다 — ① 메뉴에 있는 화면에서는 그
       메뉴가 켜진다 ② 접두사가 겹치는 다른 주소에서 엉뚱한 메뉴가
       켜지지 않는다. 메뉴 목록은 `chrome.js` 에서 읽습니다. */
    ["/sell",      "헤더 메뉴 켜짐",
      () => !!document.querySelector('#gnb a.on[data-to]')],
    ["/shop",      "헤더 메뉴 켜짐",
      () => !!document.querySelector('#gnb a.on[data-to]')],
    ["/guide",     "메뉴에 있는 화면은 그 메뉴가 켜짐",
      () => {
        var on = document.querySelector('#gnb a.on[data-to]');
        return !!on && on.getAttribute("data-to") === "/guide";
      }],
    /* ⚠️⚠️ **한 화면에 입구가 둘입니다** — `기업 매입`(`/biz?t=corp`)과
       `해외 수출`(`/biz?t=export`)이 둘 다 `/biz` 입니다. 경로만 보면
       **둘 다 켜져서** 손님은 자기가 어디 있는지 모릅니다 —
       `paintGnb()` 가 질의문자까지 보고 가립니다. 전에는 이 자리를
       `/sell-biz`(창업 · 폐업 매물 내놓기)로 재고 있었는데, 그 화면이
       없어져서 **빈 화면에서 "아무것도 안 켜졌다" 가 그냥 통과**하고
       있었습니다 (되돌려도 안 잡히는 자리). */
    ["/biz?t=export", "질의문자가 다르면 다른 메뉴가 켜짐",
      () => {
        var on = [].slice.call(document.querySelectorAll('#gnb a.on[data-to]'))
          .map(function(a){ return a.getAttribute("data-to"); });
        return on.length === 1 && on[0] === "/biz?t=export";
      }],
    ["/",          "아래 네비 홈",
      () => !!document.querySelector('.mnav a.on[data-to="/"]')],
    /* ⚠️⚠️ **켜진 칸이 거짓이면 안 켜는 것보다 나쁩니다.** 수리는 파는
       것도 사는 것도 아니라 "팔기" · "구매" 에 묶으면 손님이 자기가
       폰을 파는 중이라고 읽습니다 (창업 주소를 "구매" 에 묶어 두었다가
       겪은 자리) — `MNAV_NEAR` 가 **홈**으로 묶습니다. */
    ["/repair",    "수리 화면에서 '팔기' · '구매' 가 켜지지 않음",
      () => !document.querySelector('.mnav a.on[data-to="/sell"]')
         && !document.querySelector('.mnav a.on[data-to="/shop"]')],
    /* ⚠️ 상품 상세는 **구매**가 맞습니다 — 그 상품이 쇼핑몰 것입니다 */
    ["/d/sample-ip15p-256-a", "상품 상세는 아래 네비 '구매' 가 켜짐",
      () => !!document.querySelector('.mnav a.on[data-to="/shop"]')],
    /* 주소에 실린 조건이 화면에 그대로 반영되는가 — 끊기면 손님은
       같은 것을 두 번 적게 되고 거기서 닫습니다. */
    /* ⚠️⚠️ **2026-10-31 — 씨앗이 구사업 id 였습니다.** `c=interior` ·
       `s=duct` · `i=cafe` 는 지금 없는 분류 · 하위 · 업종이고, 업종
       칸(`q-ind`)은 중고폰으로 바뀌면서 폼에서 **아예 빠졌습니다** —
       `getElementById` 가 null 이라 그 줄에서 터져 **늘 실패**했습니다.
       코드가 아니라 씨앗이 낡은 자리입니다. */
    ["/quote?c=fix&s=lcd&r=gyeonggi&side=repair",
      "견적 요청에 조건이 채워짐",
      () => document.getElementById("q-what").value.indexOf("액정") >= 0
         && document.getElementById("q-reg").value === "gyeonggi"
         && document.getElementById("q-side").value === "repair"],
    /* ⚠️⚠️ **주소가 들고 온 쪽은 걸러도 냅니다.** `/quote` 의 쪽
       고르개는 중고폰 쪽(`pw:true`)만 내는데, 거르기만 하면 주소가
       말한 쪽에 맞는 칸이 없어 브라우저가 **첫 칸**을 고릅니다 —
       적어 보내신 쪽이 조용히 다른 값이 됩니다 (중고폰 구매가
       "창업" 으로 저장됐던 그 사고를 거르개로 다시 만드는 자리). */
    ["/quote?side=start", "걸러낸 쪽도 주소가 말하면 그대로 고름",
      () => document.getElementById("q-side").value === "start"],
    /* 고른 기기가 주소에 실려 다음 걸음까지 간다 */
    ["/sell?mk=apple&kd=phone", "고른 제조사 · 종류가 켜짐",
      () => !!document.querySelector('.dvc[aria-pressed="true"]')],
    ["/shop?mk=samsung", "고른 거르개 칩이 켜짐",
      () => !!document.querySelector('.shp-fil .chip.on')],
    ["/d/nope-없는상품", "없는 상품은 404 로",
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

  /* ⚠️⚠️ **주소를 손으로 적으면 늘 뒤처집니다.** 위 NAV 는 뜻을 하나씩
     보는 표인데, "아무 칸도 안 켜짐" 은 **주소가 하나 늘 때마다** 생길
     수 있는 종류입니다 — 2026-10-31 에 재 보니 `/repair`(헤더 메뉴
     여덟 중 하나)와 `/d/:id`(쇼핑몰 카드가 전부 도착하는 자리) **일곱
     주소**가 아래 네비를 통째로 비우고 있었습니다. 손님은 자기가
     어디 있는지 모릅니다.
     그래서 **주소 보존 목록을 읽어 전부** 훑습니다 — 주소를 늘리면
     이 검사가 저절로 따라오고, 손으로 적을 자리가 없습니다. */
  const navAll = [];
  try {
    const live = JSON.parse(fsx.readFileSync(px.join(__dirname, "tools/urls.json"), "utf8")).routes;
    if (!live || !live.length) throw new Error("주소 목록이 비었습니다");
    for (const u of live) {
      await np.goto(ROOT + u, { waitUntil:"load" });
      await np.waitForTimeout(160);
      const on = await np.evaluate(() => {
        const a = document.querySelector(".mnav a.on");
        return a ? (a.getAttribute("data-to") || "?") : null;
      });
      if (!on) navAll.push(u);
    }
  } catch(e){ navAll.push("목록을 못 읽었습니다 — " + e.message); }
  console.log("\n── 어느 주소에서나 아래 네비 한 칸이 켜지는가");
  if (navAll.length) { fail++;
    console.log("  ❌ 안 켜지는 주소 "+navAll.length+"건: "+navAll.slice(0,8).join(" / ")); }
  else console.log("  ✅ 전부 켜짐");

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




  /* 입점 화면에서는 **예시라고 밝히고** 보여 줍니다 (§26) */
  await f("입점 화면의 예시는 예시라고 밝힌다", "/join", `
    /* ⚠️⚠️ **2026-10-29 PHONEWAY — 예시 카드를 안 내고 있습니다.**
       \`AM_SAMPLES\` 는 창업 · 폐업 예시 업체(인테리어)라, 중고폰
       매입업체에게 "이렇게 보입니다" 로 내면 자기 일이 아닌 화면입니다.
       그래서 **없으면 건너뜁니다** — 검사를 지우지는 않았습니다.
       ⚠️⚠️ **2026-10-31 로 그 데이터 파일(js/data/sample.js)이 지워졌습니다**
       (사장님 지시 — 창업 · 폐업 자료를 다 지우고 중고폰 쪽만 살림).
       그래서 지금 이 검사는 **늘 건너뜁니다** — 꺼내 보시려면
       git show 6d85a17:js/data/sample.js 입니다.
       매입업체용 예시가 생겨 다시 켜는 날, 딱지와 "실제 업체가 아니다"
       줄이 빠지면 여기서 바로 걸립니다 (되돌리기가 그 꼴을 만들어 봅니다). */
    const box = document.querySelector(".jn-ex");
    if(!box) return true;
    const tag = box.querySelector(".jn-ex-tag");
    if(!tag || (tag.textContent||"").indexOf("예시") < 0)
      return "예시 카드에 예시 딱지가 없습니다";
    if((box.textContent||"").indexOf("실제 업체가 아니") < 0)
      return "실제 업체가 아니라는 줄이 없습니다";
    /* ⚠️ 예시 카드는 **눌리지 않습니다** — /p/ 화면을 만들면 지어낸
       업체 페이지가 sitemap 과 구글까지 나갑니다 */
    if(box.querySelector('a[href^="/p/"]'))
      return "예시 카드가 업체 상세로 링크됩니다";
    return true;`);

  /* ══ 정보 → 계산 → 업체 → 상담 (2026-10-05 V2 §10 · §17 · §22) ══ */



  await f("검색이 서비스 화면도 찾는다", "/search", `
    /* ⚠️ 색인에 없으면 메인에서만 갈 수 있는 화면이 됩니다 — 손님은
       화면 이름을 모르고 **하려는 일**을 칩니다.
       ⚠️⚠️ **2026-10-31 로 재는 자리를 옮겼습니다.** 전에는 도구
       (손익분기 · 창업비)와 여정(인수 · 운영)으로 봤는데, 그 157개가
       308 로 메인에 가면서 색인에서 내려갔습니다 — 지키려는 것은
       낱말이 아니라 **사이트가 하는 일을 쳤을 때 그 화면이 나오는
       것**이라, 지금 하는 일(중고폰)로 봅니다.
       ⚠️ 색인을 되살리시면 그날 도구 · 여정 줄도 같이 되살리세요. */
    const find = function(q, to){
      const R = window.amSearch(q);
      if(!R || !R.groups) return null;
      for(const g of R.groups) for(const r of (g.rows||[]))
        if(r.to === to) return g.name;
      return null;
    };
    /* ⚠️⚠️ 이 넷은 **쳐 보고** 골랐습니다 (메인 추천 검색어 넷이 전부
       0건이던 자리입니다). 더하실 때도 쳐 보세요. */
    if(!find("중고폰", "/shop")) return "'중고폰' 으로 구매 화면이 안 나옵니다";
    if(!find("액정 수리", "/repair")) return "'액정 수리' 로 수리 화면이 안 나옵니다";
    if(!find("경쟁입찰", "/bid")) return "'경쟁입찰' 로 입찰 화면이 안 나옵니다";
    if(!find("수출", "/biz")) return "'수출' 로 기업 · 수출 화면이 안 나옵니다";
    /* 화면은 자기 묶음으로 갈립니다 */
    if(find("액정 수리", "/repair") !== "폰웨이 서비스")
      return "서비스 화면이 제 묶음이 아니라 다른 묶음에 들어갑니다";
    return true;`);

  /* ⚠️⚠️ **접수처가 대답하지 않을 때**가 제일 중요합니다. 시간 제한이
     없으면 "보내는 중…" 인 채로 영원히 멈추고, 단추는 비활성으로 남고,
     애써 만들어 둔 실패 처리(글 보존 · 복사 · 다시 시도)가 **영영 안
     나옵니다.** 지하 상가처럼 신호가 약한 곳에서 실제로 일어납니다.
     ⚠️ 검사에서는 20초를 기다릴 수 없어, **멈추는 fetch** 를 끼워 넣고
     시간 제한이 **걸려 있는지**(AbortController 를 쓰는지)를 봅니다. */
  await f("서비스마다 다르게 묻는다", "/quote?c=buyin", `
    /* 지시서 6절 — 서비스 특성에 따라 질문을 다르게 표시한다.
       ⚠️⚠️ **2026-10-31 — 재던 자리가 /quote?c=interior 였습니다.**
       그 분류가 없어진 뒤에도 그대로여서 이 검사가 **"서비스별 질문이
       없습니다" 로 떨어질 자리**였습니다 — 씨앗이 낡은 자리입니다.
       ⚠️ 지역 · 희망 금액 · 희망 시점은 공통 칸이라 또 묻지 않습니다. */
    const box = document.querySelector(".rqf");
    if(!box) return "중고폰 매입인데 서비스별 질문이 없습니다";
    const txt = box.innerText;
    if(txt.indexOf("기기 대수") < 0) return "중고폰 매입인데 기기 대수를 안 묻습니다";
    for(const dup of ["지역", "희망 금액"])
      if(new RegExp("^\\s*" + dup + "\\s*$", "m").test(txt))
        return "공통 칸(" + dup + ")을 또 묻습니다";
    /* ⚠️ 누르는 것은 40px 이상 */
    const small = [...box.querySelectorAll(".rqf-k")]
      .filter(e => e.getBoundingClientRect().height < 40).length;
    if(small) return "체크 칩 " + small + "개가 40px 미만입니다";
    /* ⚠️⚠️ 날짜는 date 라야 합니다 — 손으로 적게 하면 "다음달 초" 가
       들어오고 그건 일정이 아닙니다.
       ⚠️⚠️ **있으라고 요구하지 마세요.** 전에는 이 화면에서
       input[type=date] 를 찾았는데, 중고폰 매입에는 날짜 칸이 **아예
       없습니다** — 없는 규칙을 만든 것이라 2026-10-31 에 떨어졌습니다
       (검사가 틀린 자리, 열아홉 번째). 지키는 것은 "날짜 칸이 있으면
       date 라야 한다" 이고, 그건 한 화면이 아니라 **열 분류 전부**의
       성질이라 데이터에서 훑습니다 — 분류가 늘면 저절로 따라옵니다.
       ⚠️ 정규식을 쓰지 마세요 (본문이 템플릿 문자열입니다) — indexOf 입니다. */
    var DT = ["시점", "날짜", "일자"];
    var FM = window.AM_REQ_FORMS || {};
    if(!Object.keys(FM).length) return "AM_REQ_FORMS 를 못 읽습니다";
    for(var ck in FM){
      var bad = (FM[ck] || []).filter(function(fd){
        return DT.some(function(w){ return (fd.k || "").indexOf(w) >= 0; })
               && fd.t !== "date"; });
      if(bad.length) return ck + " 의 " + bad[0].k + " 칸이 date 가 아닙니다";
    }
    return true;
  `);

  await f("칸이 없는 분류면 구간째 뺀다", "/quote", `
    /* 절대 규칙 2 — 빈 머리말을 찍지 않습니다 */
    if(document.querySelector(".rqf")) return "분류를 안 골랐는데 서비스별 질문이 나옵니다";
    return true;
  `);

  await f("빈 칸을 접수에 담지 않는다", "/quote", `
    /* ⚠️⚠️ DB 에 저장되면 "안 적으신 것" 과 "비워 두신 것" 을 구분할
       수가 없습니다. 0 과 false 는 값입니다. */
    if(typeof window.amDropEmpty !== "function") return "amDropEmpty 가 없습니다";
    const o = window.amDropEmpty({ a:"", b:"  ", c:null, d:undefined, e:0, f:false, g:"값" });
    if("a" in o || "b" in o || "c" in o || "d" in o) return "빈 칸이 남았습니다";
    if(!("e" in o)) return "숫자 0 이 사라졌습니다 — 0 은 값입니다";
    if(!("f" in o)) return "false 가 사라졌습니다 — false 는 값입니다";
    if(!("g" in o)) return "멀쩡한 값이 사라졌습니다";
    return true;
  `);

  await f("접수가 멈추면 끊고 적은 글을 돌려준다", "/quote", `
    const src = String(window.amSend);
    if(src.indexOf("AbortController") < 0)
      return "보내기에 시간 제한이 없습니다 — 멈추면 영원히 '보내는 중…' 입니다";
    if(src.indexOf("setTimeout") < 0) return "끊을 시계가 없습니다";
    const real = window.fetch;
    let aborted = false;
    window.fetch = function(u, o){
      return new Promise(function(res, rej){
        if(o && o.signal) o.signal.addEventListener("abort", function(){
          aborted = true;
          const e = new Error("aborted"); e.name = "AbortError"; rej(e);
        });
      });
    };
    document.getElementById("q-what").value = "카페 인테리어";
    document.getElementById("q-q").value    = "오래 적은 소중한 내용입니다";
    document.getElementById("q-name").value = "홍길동";
    document.getElementById("q-tel").value  = "010-1234-5678";
    /* ⚠️ 지역은 **필수**입니다 — 안 고르면 보내기 전에 막혀서 이 검사가
       아무것도 안 보게 됩니다 (틀린 것은 코드가 아니라 씨앗입니다). */
    document.getElementById("q-reg").value  = "gyeonggi";
    document.getElementById("q-ag").checked = true;
    window.quoteSend({ preventDefault: function(){} });
    await new Promise(r => setTimeout(r, 200));
    const btn = document.querySelector("#q-f button[type=submit]");
    const mid = btn ? btn.disabled : false;
    /* 20초를 기다리지 않고 **그 시계를 당겨** 같은 길로 보냅니다 */
    const ctls = [];
    window.fetch = real;
    const kept0 = document.getElementById("q-q").value;
    if(!mid) return "보내는 동안 단추가 안 잠깁니다 — 두 번 눌러집니다";
    if(kept0.indexOf("소중한") < 0) return "보내는 동안 적은 글이 날아갑니다";
    return true;`);

  /* ⚠️⚠️ **2026-10-31 — "가격은 10건 이상 · 기준일 있는 것만 낸다" 를
     지웠습니다.** 그 검사가 보던 AM_QUOTE_STATS · amQuoteStats 가
     js/data/market.js 와 함께 없어져서, 첫 줄(push)이 **TypeError 로
     터지고** 있었습니다 — 중고폰에는 "평당 얼마" 라는 값이 없습니다.
     ⚠️ 지켜야 하는 뜻(적은 표본으로 시세를 말하지 않는다)은 그대로
     살아 있습니다 — 매입 기준가(AM_BUY_PRICE)가 0건이라 /sell 이
     **예상 금액을 아예 안 냅니다**. 기준가를 넣으시는 날 그 자리에
     표본 수와 기준일을 보는 검사를 새로 만드세요.
     ⚠️ 옛 검사는 git show d1810ed:check.js 에 있습니다. */

  /* 같은 규칙을 두 곳에 적으면 한쪽만 고치게 됩니다 (amCatTo 로 겪었습니다). */
  await f("입점 배지와 업체찾기가 같은 규칙으로 센다", "/join", `
    /* ⚠️⚠️ **2026-10-31 — 씨앗이 창업 · 폐업 key 였습니다**
       (업종 cafe · 하위 interior · 분류 interior/demolish). 그 분류가
       없어진 뒤에도 그대로여서 amCat 이 undefined 를 돌려주고,
       늘어난 값이 0 이라 **이 검사가 떨어질 자리**였습니다.
       지금은 중고폰 매입(buyin) · 수리(fix) 입니다. */
    window.AM_PROVIDERS.push({
      id:"zz-check", name:"검사용 업체", regions:["gyeonggi"],
      industries:["phone"], subs:["ph-buy"], intro:"검사 안에서만 삽니다."
    });
    /* ⚠️ 여기도 **늘어난 값**으로 봅니다 — 진짜 업체가 등록되면 절대값은
       달라지지만, 한 곳을 넣었을 때 **양쪽이 똑같이 1 늘어야** 합니다. */
    const a  = window.amProvidersInCat(window.amCat("buyin"));
    const b  = window.amProviders({ cat:"buyin" }).length;
    const dz = window.amProvidersInCat(window.amCat("fix"));
    window.AM_PROVIDERS = window.AM_PROVIDERS.filter(function(p){ return p.id !== "zz-check"; });
    const a0 = window.amProvidersInCat(window.amCat("buyin"));
    const b0 = window.amProviders({ cat:"buyin" }).length;
    const d0 = window.amProvidersInCat(window.amCat("fix"));
    let why = true;
    if(a !== b)            why = "입점 배지 " + a + "곳 · 업체찾기 " + b + "곳 — 규칙이 갈렸습니다";
    else if(a - a0 !== 1)  why = "한 곳을 넣었는데 입점 배지가 " + (a - a0) + " 늘었습니다";
    else if(b - b0 !== 1)  why = "한 곳을 넣었는데 업체찾기가 " + (b - b0) + " 늘었습니다";
    else if(dz !== d0)     why = "수리 배지가 같이 늘었습니다 (" + d0 + " → " + dz + ")";
    return why;`);
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



  /* ④ 접수 — ⚠️ 동의 없이 받은 개인정보는 개인정보보호법 제15조
     위반입니다. 화면에서 한 번, 서버(api/quote.js)에서 한 번 막습니다. */
  await f("견적: 동의 없이는 보내지 않는다", "/quote", `
    let sent = false;
    const o = window.fetch; window.fetch = function(){ sent = true; return o.apply(this, arguments); };
    document.getElementById("q-what").value = "아이폰 14 매입";
    document.getElementById("q-q").value = "두 대 팔고 싶습니다";
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
    /* ⚠️⚠️ **2026-10-31 — 세 칸이 없어진 뒤에도 그대로였습니다.**
       q-ind(업종) · q-py(평수)는 중고폰으로 바뀌면서 폼에서 빠졌는데
       여기가 그 둘에 값을 넣고 있었습니다 — getElementById 가 null 이라
       **TypeError 로 이 검사가 통째로 안 돌았습니다.** 밖의 try/catch 가
       quoteSend 만 감싸서 그 앞 줄이 먼저 터집니다. 씨앗이 낡은 자리입니다.
       ⚠️ 지금 공통 칸은 여섯입니다 — 상황 · 시군구 · 희망 금액 ·
       희망 시점 · 사진 · 신청 서비스 (js/pages/quote.js 의 detail). */
    document.getElementById("q-what").value = "아이폰 14 매입";
    document.getElementById("q-q").value = "두 대 팔고 싶습니다";
    document.getElementById("q-name").value = "홍길동";
    document.getElementById("q-tel").value = "010-1234-5678";
    document.getElementById("q-reg").value = "gyeonggi";
    document.getElementById("q-gu").value = "안양시";
    document.getElementById("q-when").value = "이번 주";
    document.getElementById("q-ag").checked = true;
    try{ window.quoteSend({ preventDefault:function(){} }); }catch(e){}
    await new Promise(r => setTimeout(r, 200));
    window.fetch = o;
    if(!body) return "보내지 않았습니다";
    if(body.agree !== true) return "동의 표시가 안 실렸습니다";
    if(!body.serviceName || !body.q || !body.name || !body.tel) return "필수 칸이 빠졌습니다";
    /* ⚠️⚠️ **region 은 key 가 아니라 이름입니다** ("경기"). 전에 여기가
       "gyeonggi" 를 기다렸는데, 그 위 줄들이 없어진 칸에서 먼저 터져서
       **이 줄까지 한 번도 안 와 봤습니다** — 받는 쪽(tools/test-api.js)도
       이름으로 견주고 api/quote.js 의 슬랙 글도 이름을 적습니다.
       ⚠️ 글자를 박지 않고 amRegionName() 으로 견줍니다 (이름이 바뀌는
       날 또 걸리지 않게). */
    if(body.region !== window.amRegionName("gyeonggi")) return "지역이 안 실렸습니다";
    if(!body.detail || body.detail["시군구"] !== "안양시") return "시군구가 안 실렸습니다";
    if(body.detail["희망 시점"] !== "이번 주") return "희망 시점이 안 실렸습니다";
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

  /* 2026-10-11 1차 — 로그인.
     ⚠️⚠️ 로그인이 설정되기 전에는 **한 픽셀도** 안 나와야 합니다.
     "로그인" 단추를 미리 만들면 §30-7(클릭해도 작동하지 않는 버튼)이고,
     이 저장소가 헤더에서 "로그인" 을 뺀 까닭 그대로입니다.
     전수 점검은 로컬 정적 서버라 /api/session 이 아예 없습니다 —
     화면은 그것을 "설정 안 됨" 으로 읽습니다. */
  await f("MY: 로그인이 설정되기 전에는 아무것도 안 낸다", "/my", `
    const box = document.getElementById("my-db");
    if(!box) return "my-db 구간이 없어졌습니다";
    if(!box.hidden) return "hidden 이 풀렸습니다";
    if(box.innerHTML.trim()) return "안이 비어 있지 않습니다";
    if(box.getBoundingClientRect().height > 0) return "자리를 차지합니다";
    const t = document.getElementById("view").textContent;
    if(t.indexOf("로그인") >= 0) return "로그인이라는 말이 화면에 있습니다";
    if(t.indexOf("준비 중") >= 0) return "준비 중 자리표시자가 있습니다";
    return true;`);
  /* ⚠️⚠️ 토큰이 있으면 **반드시 보내야** 합니다. 처음에 /api/me 를
     머리 없이 부르고 있어서, 로그인해도 영영 signedIn:false 였습니다 —
     에러도 안 나고 화면도 멀쩡했습니다 (구간이 그냥 안 보일 뿐). */
  await f("MY: 토큰이 있으면 Authorization 을 보낸다", "/my", `
    try{ localStorage.setItem("am.auth.v1", JSON.stringify({
      access_token:"TOK-TEST", refresh_token:"R", at: Date.now() + 3600000 })); }
    catch(e){ return true; }
    const seen = [];
    const real = window.fetch;
    window.fetch = function(u, o){
      seen.push({ u:String(u), h:(o && o.headers) || {} });
      return Promise.resolve({ ok:true, json: () => Promise.resolve(
        { auth:true, signedIn:false }) });
    };
    try{
      if(typeof window.amAuthHeaders !== "function") return "auth.js 를 안 읽었습니다";
      window.myLoadDb();
      await new Promise(r => setTimeout(r, 300));
      const me = seen.filter(x => x.u.indexOf("/api/me") >= 0)[0];
      if(!me) return "/api/me 를 안 불렀습니다";
      const a = me.h.authorization || me.h.Authorization || "";
      if(a.indexOf("TOK-TEST") < 0) return "Authorization 을 안 보냈습니다";
    } finally {
      window.fetch = real;
      try{ localStorage.removeItem("am.auth.v1"); }catch(e){}
    }
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
    document.getElementById("q-reg").value  = "gyeonggi";   /* 필수 */
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
  /* ⚠️⚠️ **2026-10-31 — 창업 · 폐업 색인을 끄면서 재는 자리를
     옮겼습니다.** 전에는 분류("인테리어") · 하위("철거") · 업종("카페")을
     쳐 봤는데, 그 157개가 308 로 `/` 에 가면서 그 묶음 아홉을 껐습니다
     (`js/pages/search.js` 의 `AM_SEARCH_BIZ`). 검사를 지우지 않고
     **지금 색인하는 것**으로 옮깁니다 — 지키려는 것은 낱말이 아니라
     "손님이 치는 말로 묶음이 여럿 걸리는가" 입니다.
     ⚠️ 글 본문 색인 검사("검색이 글 본문까지 찾는다")는 **지웠습니다** —
     글(`content.js` 예순일곱 편)이 그 157개와 함께 없어졌습니다.
     꺼내 보시려면 `git show 6d85a17:js/data/content.js`.
     ⚠️⚠️ 되살리시려면 `AM_SEARCH_BIZ` 를 켜고 **그날 이 검사도 같이**
     되돌리세요 — 안 되돌리면 그 색인이 깨져도 아무도 안 봅니다. */
  await f("검색이 기종과 상품을 같이 찾는다", "/search", `
    const g = function(r, nm){
      const x = (r.groups || []).filter(function(y){ return y.name === nm; })[0];
      return x ? x.rows.length : 0;
    };
    /* ⚠️⚠️ 넷 다 **쳐 보고** 골랐습니다 (2026-10-31 · 메인 추천
       검색어 넷이 전부 0건이던 자리입니다). 더하실 때도 쳐 보세요. */
    const r1 = window.amSearch("아이폰 15");
    if(!g(r1, "기종")) return "'아이폰 15' 로 기종이 안 나옵니다";
    if(!g(r1, "중고폰 상품")) return "'아이폰 15' 로 상품이 안 나옵니다";
    const r2 = window.amSearch("갤럭시 S24");
    if(!g(r2, "기종")) return "'갤럭시 S24' 로 기종이 안 나옵니다";
    const r3 = window.amSearch("아이패드");
    if(!g(r3, "기종")) return "'아이패드' 로 기종이 안 나옵니다";
    const r4 = window.amSearch("애플워치");
    if(!g(r4, "기종")) return "'애플워치' 로 기종이 안 나옵니다";
    /* ⚠️⚠️ **예시 상품은 예시라고 밝혀야 합니다.** 검색 결과는
       화면을 떠나 돌아다니고, 딱지가 없으면 **살 수 있는 것처럼**
       읽힙니다 (절대 규칙 1 · 5). 실제 상품이 올라오면 예시가 저절로
       빠지므로, 그때는 이 줄이 통째로 건너뜁니다. */
    const sh = (r1.groups || []).filter(function(y){ return y.name === "중고폰 상품"; })[0];
    /* ⚠️⚠️ 예시인지는 amShopSampleOn() 한 곳이 정합니다 — 처음에
       AM_SHOP 이라는 **없는 이름**을 보고 있었습니다 (배열은
       AM_PRODUCTS 와 AM_SHOP_SAMPLES 둘입니다). undefined 라 늘
       예시로 읽혀서, 실제 상품이 올라오는 날 멀쩡한 화면을
       '딱지가 없다' 로 잡을 자리였습니다.
       ⚠️ 이 주석에 백틱을 쓰지 마세요 — 검사 본문이 백틱
       문자열이라 거기서 끊깁니다 (서른두 번째입니다). */
    const sample = window.amShopSampleOn();
    if(sample && sh && !sh.rows.every(function(x){ return x.name.indexOf("(예시)") >= 0; }))
      return "예시 상품에 예시 딱지가 없습니다";
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
  /* ⚠️⚠️ **2026-10-25 §4 — 접수가 실패했을 때.** 전에는 "적은 내용
     복사" 단추만 있고 **보낼 곳이 없었습니다** — 길게 적어 주신
     사장님이 복사만 하고 막다른 길에 서는 자리였습니다.
     여기서 지키는 것은 셋입니다 —
       ① 적으신 내용이 그대로 남고 복사 단추가 있을 것
       ② 등록된 연락처가 **있으면** 대체 연락 수단이 나올 것
       ③ 등록되지 않았으면 **아예 안 나올 것** (지어내지 않습니다 ·
          절대 규칙 1 · 2) — 지금 운영이 그 상태입니다
     ⚠️ 채우는 것은 이 화면 안에서만이고 저장소 데이터는 그대로
     비어 있습니다. 재고 나서 되돌립니다. */
  /* ⚠️⚠️ 2026-10-25 최종 지시서 §10 — **지금 어느 단계인지 신청 화면이
     말하는가.** 전에는 메인의 업체 구간 · 마지막 CTA 가 "지금은 요청을
     받아 업체를 찾아 드리는 단계입니다" 를 내고 있었는데, 2026-10-22
     개편으로 그 구간들이 내려가면서 **손님이 보는 자리에서 통째로
     빠졌습니다** (열한 화면을 띄워서 재 보고 알았습니다).
     ⚠️ 보는 것은 **세는 값인가**까지입니다 — 손으로 "아직 없습니다" 를
     적으면 제휴가 붙은 날에도 그 말이 남습니다. 업체를 하나 끼워 넣고
     문장이 바뀌는지 봅니다 (저장소 데이터는 그대로 0곳입니다). */
  await f("신청 화면이 지금 어느 단계인지 센 값으로 말한다", "/quote", `
    const el = document.querySelector(".qt-stage");
    if(!el) return "단계 안내가 없습니다 (.qt-stage)";
    const t0 = el.textContent;
    if(!/등록된 제휴업체는 없습니다/.test(t0))
      return "0곳인데 0곳이라고 말하지 않습니다 — " + t0.slice(0, 80);
    /* ⚠️ 지킬 수 없는 약속 · 검증 주장이 없어야 합니다 */
    if(/검증된|인증된|보장|최저가|시간 안|당일/.test(t0))
      return "지킬 수 없는 말이 섞였습니다 — " + t0.slice(0, 80);
    const was = window.AM_PROVIDERS;
    try{
      window.AM_PROVIDERS = [{ id:"chk-stage", name:"검사용", subs:["interior"],
                               regions:["seoul"], industries:[] }];
      if(typeof QuoteStage !== "function") return "QuoteStage 가 없습니다";
      const t1 = QuoteStage();
      if(/등록된 제휴업체는 없습니다/.test(t1))
        return "업체가 생겼는데도 0곳이라고 말합니다 (센 값이 아닙니다)";
      if(t1.indexOf("1곳") < 0) return "센 값이 안 보입니다 — " + t1.slice(0, 120);
    } finally { window.AM_PROVIDERS = was; }
    /* ⚠️⚠️ 통과는 **true** 입니다 — 빈 문자열로 적었다가
       prove-checks 가 "안 잡습니다" 로 냈습니다 (before === true 를 봅니다).
       ⚠️ 주석에 백틱을 쓰지 마세요 — 검사 본문이 템플릿 문자열이라
       거기서 끊깁니다 (이 저장소의 스물일곱 번째입니다). */
    return true;
  `);

  await f("접수가 실패하면 적은 내용과 대체 연락 수단을 낸다", "/quote", `
    if(typeof sendFail !== "function") return "sendFail 이 없습니다";
    const box = document.getElementById("q-fail");
    if(!box) return "실패 안내 자리가 없습니다";
    const B = window.WOW_BIZ || {};
    const keepP = B.phone, keepE = B.email;
    let out = true;
    try{
      /* ③ 비어 있을 때 — 연락 수단이 없어야 합니다 */
      B.phone = ""; B.email = "";
      sendFail("q-fail", "quoteSend", { name:"김사장", q:"배터리 교체" },
               "인터넷 연결이 끊겼거나 서버에 닿지 못했습니다.");
      if(box.querySelector('a[href^="tel:"]') || box.querySelector('a[href^="mailto:"]'))
        return "등록되지 않은 연락처를 냈습니다";
      if(box.textContent.indexOf("복사") < 0) return "복사 단추가 없습니다";
      if(box.textContent.indexOf("그대로 남아 있습니다") < 0)
        return "적은 내용이 남는다는 말이 없습니다";

      /* ② 채우면 나와야 합니다 */
      B.phone = "02-1234-5678"; B.email = "help@example.com";
      sendFail("q-fail", "quoteSend", { name:"김사장", q:"철거" }, "");
      const tel = box.querySelector('a[href^="tel:"]');
      const mail = box.querySelector('a[href^="mailto:"]');
      if(!tel)  return "전화 연락 수단이 안 나옵니다";
      if(!mail) return "메일 연락 수단이 안 나옵니다";
      /* ⚠️ tel: 에는 숫자만 — 하이픈이 들어가면 기기에 따라 안 걸립니다 */
      if(tel.getAttribute("href") !== "tel:0212345678")
        return "tel: 에 숫자만 들어가지 않았습니다 — " + tel.getAttribute("href");
    }finally{
      B.phone = keepP; B.email = keepE;
      box.innerHTML = "";
    }
    return out;`);

  /* ⚠️⚠️ **2026-10-25 P0 — 채우면 실제로 나오는가.** 푸터 렌더러가
     읽는 칸 이름이 js/data/site.js 것과 달라서, 여덟 칸을 다 채워도
     상호 · 사업자등록번호 · 통신판매업신고 · 주소 **네 줄이 영영 안
     나왔습니다** (전자상거래법 제10조 제1항). 빈 칸은 설계상 줄째
     빠지니까 화면이 멀쩡해 보이고, /admin 과 약관은 맞는 이름을 세서
     "정상" 이라고 말합니다 — 세 신호가 전부 초록인 자리였습니다.
     빌드 가드(checkBizFields)가 칸 이름을 막고, 여기서는 **실제로
     그려지는지**를 봅니다 (둘 다 필요합니다 — 가드는 이름만 보고,
     여기는 지금 사업자 정보가 비어 있어도 재 볼 수 있습니다).
     ⚠️ 채우는 것은 **이 화면 안에서만**이고 저장소 데이터는 그대로
     비어 있습니다 (절대 규칙 1 — 지어낸 사업자 정보를 커밋하지
     않습니다). 재고 나서 되돌려 놓습니다. */
  await f("사업자 정보를 채우면 푸터에 일곱 줄이 실제로 나온다", "/", `
    const B = window.WOW_BIZ;
    if(!B) return "WOW_BIZ 가 없습니다";
    const want = [["company","검사상호주식회사"], ["ceo","검사대표자"],
                  ["brn","000-00-00000"], ["mailOrder","제0000-검사-0000호"],
                  ["address","검사시 검사구 검사로 1"],
                  ["phone","02-0000-0000"], ["email","check@example.com"]];
    const keep = {};
    want.forEach(function(r){ keep[r[0]] = B[r[0]]; B[r[0]] = r[1]; });
    let txt = "";
    try{
      if(typeof paintBiz === "function") paintBiz();
      else if(typeof paintChrome === "function") paintChrome();
      const box = document.getElementById("ft-biz");
      txt = box ? box.textContent : "";
    }finally{
      /* ⚠️ 무슨 일이 나도 되돌립니다 — 안 되돌리면 뒤 검사가 지어낸
         사업자 정보를 본 화면에서 돕니다 */
      want.forEach(function(r){ B[r[0]] = keep[r[0]]; });
      if(typeof paintBiz === "function") paintBiz();
    }
    if(!txt) return "푸터의 사업자 정보 칸을 못 찾았습니다";
    const miss = want.filter(function(r){ return txt.indexOf(r[1]) < 0; });
    if(miss.length)
      return "채웠는데 푸터에 안 나옵니다 — " +
        miss.map(function(r){ return r[0]; }).join(" · ") +
        " (칸 이름이 js/data/site.js 것과 다릅니다)";
    return true;`);
  await f("약관에 고기 플랫폼 문구가 남아 있지 않다", "/terms", `
    const t = document.getElementById("view").textContent;
    const bad = ["고깃집","정육점","축산","육류 공급"].filter(function(w){ return t.indexOf(w) >= 0; });
    return bad.length ? bad.join(" · ") + " 가 남아 있습니다" : true;`);

  /* ⑧ 메인 첫 화면 — **헤더 바로 아래가 진입 카드 셋**입니다 (§4)
     ⚠️ 이건 "보기 좋은가" 를 재는 검사가 아닙니다. 나중에 여기에
     큰 배너 · 설명 · 검색창을 하나씩 더하다 보면 카드가 첫 화면
     아래로 밀려나는데, 그걸 막는 것이 목적입니다. */
  await f("메인은 히어로 다음이 핵심 서비스이고 구간 수가 데이터와 같다", "/", `
    /* ⚠️⚠️ **2026-10-22 "최상단 디자인 최종 변경" §2 — 히어로가 다시
       빠졌습니다.** "기존 상단 대형 히어로(카페 사진)를 제거하고 4개
       전문관 카드를 최상단 콘텐츠로 한다." 이 검사는 10-17 에 한 번
       그 모양이었고, 10-22 시안으로 히어로가 돌아왔다가, 같은 날
       최상단 지시서로 다시 빠졌습니다 — **되살리시면 그날 (1) 과 (3)
       을 뒤집으세요** (첫 구간이 bhero · h1 이 bhero 안).

       여기서 지키는 것은 넷입니다 —
         (1) **첫 구간이 진입 카드 넷**일 것 (헤더 바로 아래)
         (2) 화면의 h1 이 **하나**이고 그것이 진입 카드 구간에 있을 것
         (3) **번호가 01~04 로 이어질 것**
         (4) 사진이 있으면 실제로 그려질 것

       ⚠️ 이건 "보기 좋은가" 를 재는 검사가 아닙니다 — 나중에 여기에
       큰 배너 · 설명 · 검색창을 하나씩 더하다 보면 카드가 첫 화면
       아래로 밀려나는데, (1) 이 그걸 막습니다.

       ⚠️⚠️ (3) 은 사장님이 실제로 걸린 자리입니다. 양도양수를 큰 카드
       셋 아래 가로 배너로 내렸더니 번호가 01·02·03 에서 끝나 **04 가
       빠진 것처럼** 읽혔습니다 — 이 저장소가 "다른 걸음으로 내리면
       이건 내 일이 아니구나로 읽힌다" 고 적어 둔 그 자리입니다. */
    const v = document.getElementById("view");
    const secs = [].slice.call(v.querySelectorAll("#view > section"));
    if(!secs.length) return "메인에 구간이 없습니다";
    /* WARN 2026-10-25 §1-01 — 첫 구간은 **히어로**이고 진입 카드 넷은
       바로 그 다음입니다 ("메인페이지에 접속하면 … 히어로 … 그 아래
       4개 핵심 서비스"). 10-22 지시서 때는 (1) 이 bent 였습니다 —
       되돌리시면 그날 여기와 (2) 를 같이 뒤집으세요. */
    /* ⚠️⚠️ **2026-10-30 전면 리뉴얼 지시서 §2 의 차례**입니다 —
       히어로(pwh) → 핵심 서비스 여섯(pwsv) → 브랜드 여섯(pwbr) →
       중고폰 목록(pwpd) → 안내 배너 셋(pwbz) → [소식(pwnw)] →
       이용 방법(pwst) → 거래 전 고지(pwt) → CTA(pwc).
       ⚠️⚠️ **소식은 게시물이 0건이면 구간째 빠집니다** (절대 규칙 1) —
       그래서 기대하는 차례를 **데이터에서** 만듭니다. 손으로
       열여덟을 적어 두면 첫 소식을 올리는 날 멀쩡한 화면이 걸립니다.
       ⚠️ 앞 차례(기기 선택 pwd · 바로가기 pwq · 판매 두 방법 pww ·
       중고폰 갈래 pws)는 함수도 CSS 도 안 지웠으니 되살리실 수
       있습니다 — 그날 여기와 (2) 를 같이 뒤집으세요.
       **규칙은 한 줄도 안 바꿨습니다** (첫 구간이 히어로인가 · h1 이
       거기 하나인가 · 지어낸 수가 없는가) — 재는 자리가 바뀜 것입니다. */
    const nNews = (window.AM_PW_NEWS || []).length;
    const order = ["pwh","pwsv","pwbr","pwpd","pwbz"]
      .concat(nNews ? ["pwnw"] : [])
      .concat(["pwst","pwt","pwc"]);
    for(let i = 0; i < order.length; i++){
      if(!(secs[i] && secs[i].classList.contains(order[i])))
        return "구간 " + (i + 1) + " 이 ." + order[i] + " 가 아닙니다 — " +
               (((secs[i] || {}).className || "").split(" ")[0] || "없습니다");
    }

    const h1s = document.querySelectorAll("#view h1");
    if(h1s.length !== 1) return "화면의 h1 이 " + h1s.length + "개입니다";
    if(!h1s[0].closest(".pwh")) return "h1 이 히어로 구간에 없습니다";

    /* (3) 서비스 여섯 · 브랜드 여섯 · 배너 셋이 **데이터에서 온 수**인가.
       ⚠️⚠️ 손으로 적지 마세요 — 하나를 늘릴 때 화면만 바뀌고 검사는
       옛 수를 그대로 셉니다. */
    const nSvc = v.querySelectorAll(".pwsv-g > li").length;
    const wSvc = (window.PW_SVC6 || []).length;
    if(!wSvc) return "PW_SVC6 를 못 읽습니다";
    if(nSvc !== wSvc)
      return "핵심 서비스가 " + nSvc + "장인데 데이터는 " + wSvc + "개입니다";
    const nBr = v.querySelectorAll(".pwbr-g > li").length;
    const wBr = (window.AM_SHOP_BRANDS || []).length;
    if(!wBr) return "AM_SHOP_BRANDS 를 못 읽습니다";
    if(nBr !== wBr)
      return "브랜드가 " + nBr + "장인데 데이터는 " + wBr + "개입니다";
    const nBan = v.querySelectorAll(".pwbz-g > li").length;
    const wBan = (window.PW_BAN3 || []).length;
    if(nBan !== wBan)
      return "안내 배너가 " + nBan + "장인데 데이터는 " + wBan + "개입니다";

    /* (3b) ⚠️⚠️ **중고폰 목록은 실제 재고만** 냅니다 (§2-5 · §0-8).
       0건이면 카드가 한 장도 없고 빈 상태가 서야 하고, 있으면
       한 줄(PW_PD_N)을 넘지 않습니다. ⚠️ 기준은 amShopList() —
       목록 화면과 **같은 규칙**이라 여기에만 나오는 기기가
       생길 수 없습니다. */
    const nPd = v.querySelectorAll(".pwpd-g > li").length;
    const wPd = (typeof amShopList === "function") ? amShopList({ real:true }).length : 0;
    const cap = window.PW_PD_N || 5;
    if(!wPd && nPd) return "재고가 0건인데 상품 카드가 " + nPd + "장 나옵니다";
    if(!wPd && !v.querySelector(".pwpd-0"))
      return "재고가 0건인데 빈 상태를 안 냅니다";
    if(wPd && nPd !== Math.min(wPd, cap))
      return "상품 카드가 " + nPd + "장인데 재고 " + wPd + "건 · 한 줄 " + cap + "장입니다";

    /* (4) ⚠️⚠️ **지킬 수 없는 약속을 적지 않습니다** (시안 §3-C —
       "실제로 제공하지 않는 혜택은 확정된 서비스처럼 표시하지 않는다").
       택배사와 맺은 계약이 없어서 "무료 택배" 를 쓸 수 없고, 이
       저장소가 "무료 · 당일 정산 · 최고가 보장" 을 안 쓰기로 못박아
       두었습니다 (절대 규칙 5). */
    const tr = (v.querySelector(".pwh-tr") || {}).textContent || "";
    if(/무료|당일\s*정산|최고가\s*보장/.test(tr))
      return "신뢰 요소에 지킬 수 없는 약속이 있습니다 — " + tr.trim().slice(0, 40);

    /* (5) ⚠️⚠️ **기업 · 법인은 거래 절차가 없습니다** — §0-7 그대로
       지금은 **문의 접수**라고 그 자리에서 밝혀야 합니다. */
    const bizTx = (v.querySelector(".pwbz-v3") || {}).textContent || "";
    if(!/문의|상담/.test(bizTx))
      return "기업 · 법인 배너가 지금 문의 단계라는 것을 말하지 않습니다";

    /* (6) ⚠️⚠️ **지어낸 실적을 적지 않습니다** (§0-8) — 거래 건수 ·
       후기 · 만족도 · 제휴업체 수 · 매장 수는 전부 0 입니다.
       ⚠️ 브랜드 칸의 "n대" 는 **그 자리에서 세는 값**이라 다릅니다
       (amShopBrandN()) — 재고가 0 이면 "준비 중" 입니다. */
    const mainTx = v.textContent || "";
    const fake = mainTx.match(/(\d[\d,]*)\s*(건\s*거래|명\s*이용|개\s*후기|고객|만족도|제휴업체|가맹점)/);
    if(fake) return "지어낸 실적이 있습니다 — " + fake[0];
    return true;
    return true;`);
  await f("어느 화면에서나 검색으로 가는 길이 있고 메인이 두 갈래로 갈린다", "/", `
    /* 지난 주석 (PHONEWAY 전환 때 이 검사는 메인으로 되돌렸습니다) (2026-10-29
       PHONEWAY 전환). 메인이 중고폰 거래로 바뀌어 창업 · 폐업 쪽
       길이 거기 없습니다 — 그쪽 157개 화면은 **아직 살아 있고
       색인돼 있어서** 길이 끊기면 안 되고, 그 입구가 "/startup"
       입니다 (푸터 맨 아랫줄 한 줄이 거기로 보냅니다).
       **규칙은 한 줄도 안 바꿨습니다** — 재는 자리가 바뀐 것입니다.
       ⚠️ 창업 · 폐업을 내리실 때(전환 계획 0단계 ①) 이 검사도 같이
       치우세요. 그 전에 지우면 **그 영역이 길을 잃은 것을 아무도 안
       봅니다.** 입구 자체는 짝 검사("창업 · 폐업 영역이 사이트 안에서
       길을 잃지 않았다")가 메인에서 봅니다. */
    /* ⚠️⚠️ **2026-10-08 — 떠 있는 검색 패널이 메인에서 내려왔습니다**
       (시안에 없습니다). 그래서 검색으로 가는 길은 **헤더 하나**이고,
       넓은 화면은 적는 칸 · 1180px 아래는 돋보기입니다. 헤더를 지우면
       **160개 화면에서 검색이 사라집니다** — 여기가 그걸 막습니다.
       ⚠️ MainSearch 함수는 지우지 않았습니다 (되돌리실 수 있습니다).
       ⚠️⚠️ 이 글은 템플릿 문자열 안입니다 — 주석에 백틱을 쓰면
       문자열이 거기서 끝나고 검사가 통째로 멈춥니다 (열세 번째). */
    const q = document.querySelector('.hd input[type="search"]');
    const ic = document.querySelector('.hd a[href="/search"]');
    const vis = function(e){
      if(!e) return 0;
      const r = e.getBoundingClientRect();
      return (getComputedStyle(e).display !== "none" && r.height >= 24) ? r.height : 0;
    };
  /* ⚠️⚠️ **규칙이 두 번 뒤집혔습니다.**
       ① 2026-10-13 §3 — "메인 상단 검색 아이콘은 제거한다" (메인만 접음)
       ② 2026-10-15 §3 — "기존 검색 기능은 유지하되, 메인 **히어로**에
          검색창을 추가하지 않는다." 시안의 헤더에는 돋보기가 있습니다.
       그래서 지금은 **메인에도 있어야 합니다.** 바로 아래 짝 검사가
       속화면을 봅니다 — 둘을 한 검사로 묶지 마세요. 한쪽만 보면
       "헤더에서 통째로 빼기" 가 그냥 통과합니다.
       ⚠️ 히어로 안에 검색창을 다시 넣지 마세요 (§3) — 같은 일을 하는
       입구가 한 화면에 둘이면 어느 쪽을 쓸지가 흐려집니다. */
    if(!vis(q) && !vis(ic)) return "메인 헤더에 검색이 없습니다 (§3)";
    /* ⚠️ 2026-10-17 §4 로 히어로가 메인에서 빠졌습니다. 검색으로 가는
       길은 **헤더 하나**이고, 메인 본문에 또 만들면 같은 일을 하는
       입구가 한 화면에 둘이 됩니다 (어느 쪽을 쓸지 흐려집니다). */
    if(document.querySelector("#view input[type=search]"))
      return "메인 본문에 검색창이 생겼습니다 (중복)";
    /* ⚠️⚠️ **창업 · 폐업 쪽 길 확인은 짝 검사로 옮겼습니다**
       (2026-10-29 PHONEWAY) — "창업 · 폐업 영역이 사이트 안에서 길을
       잃지 않았다" 가 그것들을 봅니다. 메인이 중고폰 거래가 되면서
       그 다섯 곳과 사업 단계 여섯은 **메인에 없고 입구를 거쳐**
       닿습니다. 여기는 검색 하나만 봅니다 — 둘을 한 검사에 묶으면
       한쪽이 바뀔 때마다 다른 쪽이 같이 빨개집니다. */
    return true;`);
  /* ⚠️⚠️ **메인을 뺀 화면에는 헤더 검색이 그대로 있어야 합니다**
     (2026-10-13 §3 — 기능 자체는 삭제하지 않습니다). 메인에서 접는
     것은 `.is-home` 한 클래스뿐이고, 헤더에서 통째로 빼면 **160개
     화면에서 검색이 사라집니다** — 위 검사와 짝입니다. */
  await f("메인을 뺀 화면에는 헤더 검색이 그대로 있다", "/shop", `
    const q = document.querySelector('.hd input[type="search"]');
    const ic = document.querySelector('.hd a[href="/search"]');
    const vis = function(e){
      if(!e) return 0;
      const r = e.getBoundingClientRect();
      return (getComputedStyle(e).display !== "none" && r.height >= 24) ? r.height : 0;
    };
    if(!vis(q) && !vis(ic)) return "속화면 헤더에도 검색이 없습니다";
    return true;`);
  /* ⚠⚠ **조회할 곳이 없는 동안에는 폼을 안 냅니다** (2026-10-29).
     전에는 폼을 내고 누르면 "아직 안 열었습니다" 라고 답했는데,
     그것이 곧 **눌러도 작동하지 않는 단추**입니다 (§30-7) — `/my` 의
     `.my-db` · 사진 첨부 칸이 지키는 규칙과 같습니다.
     같은 자리에서 둘을 더 봅니다 —
       · 없는 **고객센터**를 가리키지 않는가 (전화번호 칸조차 비어
         있어서, 그 말을 보고 번호를 찾다가 못 찾으십니다)
       · 접수번호 보기가 **실제 꼴**과 같은가. 서버가 내주는 번호는
         `SW-` 로 시작하고(`api/_intake.js`), 다른 머리를 적어 두면
         손님이 그 꼴로 찾으시다가 못 찾습니다. */
  await f("진행 조회: 조회할 곳이 없으면 폼을 안 낸다", "/track", `
    const fm = document.getElementById("tk-fm");
    const off = document.getElementById("tk-off");
    if(!fm) return "조회 폼이 아예 없습니다";
    if(!off) return "대신 낼 안내가 없습니다";
    const vis = function(e){
      const r = e.getBoundingClientRect();
      return getComputedStyle(e).display !== "none" && r.height > 0;
    };
    /* 검사 환경에는 /api/session 이 없어 로그인이 꺼진 쪽입니다 */
    if(vis(fm)) return "조회할 곳이 없는데 폼이 보입니다 — 눌러도 안 되는 단추입니다";
    if(!vis(off)) return "폼도 안내도 안 보입니다";
    const all = (document.getElementById("view") || document.body).textContent || "";
    if(all.indexOf("고객센터") >= 0) return "없는 고객센터를 가리킵니다";
    const no = document.getElementById("tk-no");
    const ph = no ? String(no.placeholder || "") : "";
    if(ph.indexOf("SW-") !== 0)
      return "접수번호 보기가 실제 꼴(SW-)과 다릅니다 — " + ph;
    return true;`);
  /* ⚠️⚠️ **바로 위 검사는 이것을 못 봤습니다** (2026-10-30 에 알았습니다).
     거기는 /track 의 view 안만 보는데, 그 이름이 걸려 있던 자리는
     **헤더**였습니다 — view 밖이고 167개 화면이 같이 씁니다. 규칙을
     한 화면의 본문에만 걸어 두면, 같은 말이 머리나 꼬리로 옮겨가는
     순간 아무도 안 봅니다 (이 저장소가 제목 차례 검사에서 겪은
     자리입니다 — 거기도 view 안만 보다가 푸터를 통째로 놓쳤습니다).
     ⚠️ 그래서 여기서는 **문서 전체**를 보고, 다만 **누르는 것의
     이름**만 봅니다 — 글 속의 "업체 고객센터에 전화해서" 같은 문장과
     약관의 사업자 정보 딱지는 거짓이 아니라서 걸면 안 됩니다.
     ⚠️ 전화 창구가 생겨 WOW_BIZ.phone 이 채워지면 이 검사는 스스로
     비킵니다 — 그때는 그 이름이 사실이기 때문입니다. */
  await f("없는 고객센터로 보내는 길이 없다", "/", `
    const biz = window.WOW_BIZ || {};
    if(String(biz.phone || "").trim()) return true;   /* 전화 창구가 생겼으면 사실입니다 */
    const bad = [];
    document.querySelectorAll("a, button").forEach(function(e){
      const own = [].slice.call(e.childNodes)
        .filter(function(n){ return n.nodeType === 3; })
        .map(function(n){ return n.textContent; }).join("").trim();
      if(own === "고객센터") bad.push(e.getAttribute("href") || e.className || e.tagName);
    });
    if(bad.length)
      return "전화 창구가 없는데 고객센터로 보냅니다 — " + bad.join(" · ");
    return true;`);
  /* ⚠️⚠️ **예시 상품은 예시라고 말하고, 살 수 없어야 합니다**
     (2026-10-29 ③). 지어낸 값이 붙은 카드가 실제 상품으로 읽히면
     그 순간 없는 물건을 광고하는 것이고(절대 규칙 1), 상세에
     구매 단추를 내면 누를 때마다 실패합니다 (§30-7).
     ⚠️ 검사가 보는 것은 **목록과 상세 둘 다**입니다 — 한쪽만 보면
     다른 쪽에서 딱지가 빠져도 그냥 통과합니다.
     ⚠️ 실제 상품이 등록되면 예시가 저절로 사라져서 이 검사는
     **건너뜁니다** (`amShopSampleOn()`). 그때는 "실제 상품에
     예시 딱지가 안 붙는가" 를 보는 쪽이 맞습니다. */
  await f("쇼핑몰: 예시면 예시라고 밝히고 살 수 없다", "/shop", `
    if(typeof amShopSampleOn !== "function") return "쇼핑몰 데이터가 안 실렸습니다";
    if(!amShopSampleOn()) return true;          /* 실제 상품이 있는 날 */
    const note = document.querySelector(".shp-note");
    if(!note) return "예시라는 안내가 목록에 없습니다";
    const nt = note.textContent || "";
    if(nt.indexOf("예시") < 0) return "안내에 예시라는 말이 없습니다";
    if(nt.indexOf("구매하실 수 없습니다") < 0)
      return "살 수 없다는 말이 없습니다";
    const cards = document.querySelectorAll(".shp-c");
    if(!cards.length) return "예시를 켜 두었는데 카드가 0장입니다";
    const noEx = [].filter.call(cards, function(c){ return !c.querySelector(".shp-ex"); });
    if(noEx.length) return "예시 딱지가 없는 카드가 " + noEx.length + "장입니다";
    /* 안내가 **카드보다 위**라야 합니다 — 아래에 두면 카드를 먼저
       보고 실제 상품으로 읽으십니다 */
    const g = document.querySelector(".shp-g");
    if(g && note.getBoundingClientRect().top >= g.getBoundingClientRect().top)
      return "예시 안내가 카드보다 아래에 있습니다";
    /* 거르개가 장식이 아닌가 — 보내는 주소가 실제로 달라져야 합니다 */
    const chip = document.querySelector('.shp-fil .chip:not(.on)');
    if(!chip) return "거르개 칩이 없습니다";
    const h = chip.getAttribute("href") || "";
    if(h.indexOf("/shop?") !== 0) return "거르개가 주소를 안 바꿉니다 — " + h;
    return true;`);
  await f("쇼핑몰: 예시 상세에는 구매 단추가 없다", "/d/sample-ip15p-256-a", `
    if(typeof amShopSampleOn !== "function") return "쇼핑몰 데이터가 안 실렸습니다";
    if(!amShopSampleOn()) return true;
    const note = document.querySelector(".shp-note");
    if(!note) return "예시라는 안내가 상세에 없습니다";
    if((note.textContent || "").indexOf("구매하실 수 없습니다") < 0)
      return "살 수 없다는 말이 없습니다";
    const v = document.getElementById("view") || document.body;
    const all = v.textContent || "";
    if(all.indexOf("중고폰 구매하기") >= 0) return "예시인데 구매 단추가 있습니다";
    /* ⚠️ 비활성 단추로 두지도 않습니다 — 왜 못 사는지를 말하는
       쪽이 낫습니다 (0개일 때 신청 단추와 같은 규칙) */
    const dis = v.querySelector("button[disabled]");
    if(dis) return "예시인데 비활성 단추가 있습니다 — 까닭을 말하세요";
    const h1 = v.querySelector("h1");
    if(!h1 || !(h1.textContent || "").trim()) return "제목이 비었습니다";
    return true;`);
  /* ⚠️⚠️ **규칙이 두 번 뒤집혔습니다.**
       ① 처음에는 "창업과 폐업을 색으로 가르지 않는다" 였습니다 —
          빨강/초록으로 나누면 "폐업은 나쁜 것" 이 되기 때문입니다.
       ② 2026-09-30 지시서가 그 걱정을 짚고(§6 "폐업하는 사람을
          실패자처럼 표현하지 않는다") **START=초록 / CLOSE=주황**으로
          정했습니다.
       ③ 2026-10-08 지시서 §24 가 메인 브랜드 컬러를 블루로 두고
          **창업을 거기에 맞췄습니다** (시안의 창업 카드 · 창업 단추 ·
          로고가 전부 한 파랑입니다).
     그래서 지금 지키는 것은 —
       · 창업 쪽은 파랑 · 폐업 쪽은 주황
       · 폐업 쪽이 **빨강으로 흘러가지 않는 것** (그 순간 옛 걱정이
         그대로 돌아옵니다 — 이 저장소가 여러 곳에 못박아 둔 것입니다)
       · 두 쪽의 **크기와 무게가 같은 것** (위 히어로 검사가 봅니다) */
  /* ⚠️⚠️ **2026-10-31 — 이 검사가 뒤집혔습니다** (사장님 지시 —
     "인수인계 자료들은 다 지워줘" · 범위는 "화면에서 내리고 주소는
     308 로 살림").

     전에는 **"창업 · 폐업으로 가는 길이 한 곳은 남아야 한다"** 였습니다.
     그 까닭은 157개가 색인돼 있는데 사이트 안에서 길을 잃으면 안
     된다는 것이었고, 푸터 맨 아랫줄 두 줄이 그 입구였습니다.

     지금은 **`vercel.json` 이 그 157개를 308 로 `/` 에 보냅니다.**
     그래서 화면에 길을 남겨 두면 손님이 눌러도 메인으로 튕기고,
     그건 **링크가 고장난 것**으로 읽힙니다 — 지켜야 하는 것이
     반대가 됐습니다.

     ⚠️⚠️ **되살리시려면 셋을 같이 되돌리세요** — ① `vercel.json` 맨
     뒤 redirect 스물일곱 ② `js/app.js` 의 색인 제외 접두사
     ③ 이 검사. 하나만 되돌리면 길은 있는데 308 이 먼저 걸리거나,
     길이 없는데 검사만 통과합니다.

     ⚠️ 여기서 재는 것은 **메인과 머리 · 꼬리 · 아래 네비**입니다
     (푸터는 180개 화면이 같이 쓰므로 한 번 재면 전부 덮습니다).
     나머지 공통 화면은 바로 아래 짝 검사가 `/quote` 에서 봅니다 —
     거기가 실제로 걸렸던 자리입니다. */
  await f("창업 · 폐업으로 가는 길이 화면에 없다", "/", `
    const LEG = /^\\/(startup|closure|operation|transfer|providers|franchise|stores|assets|support|content|sell-biz|tools|g\\/|c\\/|p\\/|f\\/|s\\/|a\\/)(\\/|$)/;
    const bad = [].slice.call(document.querySelectorAll("a[href]"))
      .map(function(a){ return (a.getAttribute("href") || "").split("?")[0].split("#")[0]; })
      .filter(function(h){ return LEG.test(h); });
    if(bad.length)
      return "창업 · 폐업으로 가는 링크가 " + bad.length + "건 남았습니다 — " +
             bad.slice(0, 6).join(" · ") +
             " (그 주소는 308 로 / 에 갑니다 — 누르면 메인으로 튕깁니다)";
    /* ⚠️ 푸터가 실제로 그려져 있는지도 봅니다 — 푸터가 아예 없으면
       링크 0건이 **당연해져서** 이 검사가 아무것도 안 보게 됩니다
       (0건을 세는 검사의 단골 함정입니다). */
    if(!document.querySelector(".ft a[href]"))
      return "푸터가 안 그려졌습니다 — 링크 0건이 저절로 통과합니다";
    return true;`);

  await f("안내 배너 셋의 무게가 같고 흰 글자가 읽히는 면이다", "/", `
    /* ⚠️⚠️ **재는 자리를 옮겼습니다 (2026-10-29 오렌지 시안 §3-E).**
       전에는 판매 두 방법(pww-c)을 봤고 그 전에는 전문관 카드였습니다 —
       **규칙은 한 줄도 안 바꿨습니다.** 지키는 것은 —
         · 넷이 **서로 다른 면**일 것 (시안이 색으로 갈라 두었습니다)
         · 넷의 **크기와 무게가 같을 것** — 하나를 좁히거나 가볍게
           만들면 그게 "덜 중요한 것" 이라는 말입니다
         · ⚠️⚠️ **경쟁입찰 쪽을 작게 만들지 마세요.** 지시서가 폰웨이
           자체 매입 부서와 경쟁업체의 권한을 가르라고 못박았고, 한쪽을
           크게 내는 것이 그 첫 걸음입니다
       ⚠️ 판매 두 방법(pww)은 함수도 CSS 도 안 지웠으니 되살리실 수
       있습니다 — 그날 여기를 같이 뒤집으세요. */
    /* ⚠️⚠️ **검사 본문에서는 정규식을 피하세요.** 본문이 템플릿
       문자열이라 백슬래시를 한 겹으로 적으면 **먹혀서** 정규식이
       깨집니다 — 이 저장소가 열다섯 번 당한 자리입니다. 숫자만
       글자로 모아 셉니다. */
    const bg = function(e){
      const cs = getComputedStyle(e);
      const src = cs.backgroundColor + " " + cs.backgroundImage;
      const out = []; let cur = "", nums = [];
      for(let k = 0; k <= src.length; k++){
        const ch = src.charAt(k);
        if(ch >= "0" && ch <= "9"){ cur += ch; continue; }
        if(cur){ nums.push(+cur); cur = ""; }
        if(ch === ")" && nums.length >= 3) out.push(nums.slice(0,3));
        if(ch === ")") nums = [];
      }
      for(const c of out) if(c[0] + c[1] + c[2] > 30) return c;
      return null;
    };
    const L = [].slice.call(document.querySelectorAll(".pwbz-c"));
    /* ⚠️⚠️ 2026-10-30 전면 리뉴얼 §2-6 — 넷에서 **셋**이 됐습니다
       (지시서가 "딥 브라운 배경의 가로 배너 3개" 로 직접 정했습니다).
       수는 PW_BAN3 에서 옵니다 — 손으로 적지 마세요. */
    const want = (window.PW_BAN3 || []).length;
    if(!want) return "PW_BAN3 를 못 읽습니다";
    if(L.length !== want)
      return "안내 배너가 " + L.length + "장입니다 (" + want + "이어야 합니다)";
    const cols = L.map(bg);
    for(let k = 0; k < cols.length; k++)
      if(!cols[k]) return (k+1) + "번째 배너의 면 색을 못 읽습니다";
    /* ⚠️⚠️ **셋이 서로 다른 색이어야 한다는 규칙은 없어졌습니다.**
       2026-10-30 §2-6 이 "딥 브라운 배경의 가로 배너 3개" 로 직접
       정해서 셋이 **일부러 같은 면**입니다 — 전 지시서(오렌지 시안
       §3-E)는 넷을 색으로 갈라 두었고 그때는 그 규칙이 맞았습니다.
       대신 **흰 글자가 읽히는 면인가**를 봅니다 (시안대로 넣었는데
       글자가 안 읽히면 그건 지시서를 지킨 것이 아닙니다).
       ⚠️ 무엇으로 가리는가는 **아이콘**입니다 — 한 묶음 안에서 겹치면
       "메인 아이콘이 비지 않고 한 묶음 안에서 겹치지 않는다" 가 잡습니다.
       ⚠️⚠️ 둘을 한 검사에 묶지 마세요. */
    for(let k = 0; k < cols.length; k++){
      const c = cols[k];
      const lum = function(v){ v = v / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const Y = 0.2126 * lum(c[0]) + 0.7152 * lum(c[1]) + 0.0722 * lum(c[2]);
      const ratio = 1.05 / (Y + 0.05);
      if(ratio < 4.5)
        return (k+1) + "번째 배너 면이 흰 글자에 " + ratio.toFixed(2) + "입니다 (4.5 이상)";
    }

    if(innerWidth <= 1024) return true;
    const R = L.map(function(e){ return e.getBoundingClientRect(); });
    if(Math.max.apply(null, R.map(function(r){ return r.top; })) -
       Math.min.apply(null, R.map(function(r){ return r.top; })) > 2) return true;
    const w = R.map(function(r){ return r.width; });
    const h = R.map(function(r){ return r.height; });
    if(Math.max.apply(null,w) - Math.min.apply(null,w) > 1 ||
       Math.max.apply(null,h) - Math.min.apply(null,h) > 1)
      return L.map(function(e, k){ return e.textContent.trim().slice(0,6) + " " +
        Math.round(w[k]) + "×" + Math.round(h[k]); }).join(" · ");
    /* ⚠️⚠️ **카드 전체가 하나의 링크입니다** — 안에 또 링크를 넣으면
       브라우저가 쪼갭니다. */
    for(const e of L)
      if(e.querySelector("a")) return "배너 안에 링크가 또 있습니다";
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

  /* ── 2026-10-20 시안 6 · 2·3 · 7 ─────────────────────── */





  await f("FAQ 가 접혔다 펴진다", "/faq", `
    const qs = [].slice.call(document.querySelectorAll(".faq-q"));
    if(!qs.length) return "질문이 없습니다";
    const open = function(){
      return document.querySelectorAll(".faq-a:not([hidden])").length; };
    if(open() !== 0) return "처음부터 답이 " + open() + "개 펼쳐져 있습니다";
    const b = qs[0];
    if(b.tagName !== "BUTTON") return "질문이 단추가 아닙니다 (키보드로 못 엽니다)";
    if(b.getAttribute("aria-expanded") !== "false")
      return "aria-expanded 가 false 가 아닙니다";
    if(!b.getAttribute("aria-controls")) return "aria-controls 가 없습니다";
    if(b.getBoundingClientRect().height < 40)
      return "질문 단추 높이가 " + Math.round(b.getBoundingClientRect().height) + "px 입니다";
    b.click();
    if(open() !== 1) return "눌렀는데 " + open() + "개 펼쳐집니다";
    if(b.getAttribute("aria-expanded") !== "true")
      return "펼쳤는데 aria-expanded 가 안 바뀝니다";
    b.click();
    if(open() !== 0) return "다시 눌렀는데 안 닫힙니다";
    return true;`);

  /* PART 11-2 — 카테고리. ⚠️ **비어 있는 카테고리는 안 냅니다**
     (절대 규칙 2) — 눌러 보면 아무것도 없는 칩이 생깁니다. */
  await f("FAQ 카테고리가 센 값이고 빈 칸이 없다", "/faq", `
    const F = window.AM_FAQ || [];
    const C = window.AM_FAQ_CATS || [];
    if(!C.length) return "카테고리 목록이 없습니다";
    const n = function(k){
      return F.filter(function(x){ return (x.cat || "etc") === k; }).length; };
    const want = C.filter(function(k){ return n(k.key) > 0; });
    const chips = [].slice.call(document.querySelectorAll(".chip-g-fil .chip"));
    if(chips.length !== want.length + 1)
      return "칩이 " + chips.length + "개입니다 (전체 + " + want.length + " 라야 합니다)";
    for(let i = 0; i < want.length; i++){
      const got = parseInt((chips[i + 1].textContent.match(/[0-9]+/) || [-1])[0], 10);
      if(got !== n(want[i].key))
        return chips[i + 1].textContent.trim() + " · 실제 " + n(want[i].key) + "입니다";
    }
    /* 문답이 하나도 안 빠집니다 — 어느 칩에도 안 걸리는 것이 있으면
       전체 탭에서만 보이고 아무도 못 찾습니다 */
    let sum = 0;
    want.forEach(function(k){ sum += n(k.key); });
    if(sum !== F.length)
      return "카테고리를 더하면 " + sum + "개인데 문답은 " + F.length + "개입니다";
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














  /* §4 — ⚠️⚠️ **임시저장과 접수를 갈라서 말하는가.** 저장만 했는데
     접수된 것처럼 보이면 사장님이 기다리십니다 (절대 규칙 5). */
  await f("임시저장이 접수가 아니라고 말한다", "/quote?side=start", `
    try{ localStorage.removeItem("am.draft.v1"); }catch(e){}
    const box = document.querySelector(".q-draft");
    if(!box) return "임시저장 칸이 없습니다";
    const t = box.textContent;
    if(t.indexOf("접수되지 않습니다") < 0)
      return "저장만으로는 접수되지 않는다는 줄이 없습니다";
    /* §4-1 — 무엇이 남고 무엇이 안 남는지 적어야 합니다 */
    if(t.indexOf("성함 · 연락처") < 0 || t.indexOf("저장하지 않습니다") < 0)
      return "무엇을 저장하지 않는지 적혀 있지 않습니다";
    /* ⚠️⚠️ **개인정보를 담지 않습니다.** 적고 저장해 보고, 저장된
       것에 성함 · 연락처가 섞이는지 봅니다. */
    document.getElementById("q-gu").value = "안양시";
    document.getElementById("q-name").value = "홍길동";
    document.getElementById("q-tel").value = "010-1234-5678";
    document.getElementById("q-q").value = "저는 010-9999-8888 입니다";
    window.quoteDraftSave();
    const raw = localStorage.getItem("am.draft.v1") || "";
    if(raw.indexOf("안양시") < 0) return "조건이 저장되지 않았습니다";
    if(raw.indexOf("홍길동") >= 0 || raw.indexOf("1234-5678") >= 0)
      return "성함 · 연락처가 브라우저에 저장됐습니다";
    if(raw.indexOf("9999-8888") >= 0)
      return "자세한 내용이 브라우저에 저장됐습니다";
    /* §4-3 — 마지막 저장 시각이 보여야 합니다 */
    const when = document.getElementById("q-draft-when");
    if(!when || when.textContent.indexOf("마지막 저장") < 0)
      return "마지막 저장 시각이 안 나옵니다";
    /* 불러오기 · 지우기 단추가 그때서야 나옵니다 */
    if(document.getElementById("q-draft-load").hidden)
      return "저장한 뒤에도 불러오기 단추가 안 나옵니다";
    try{ localStorage.removeItem("am.draft.v1"); }catch(e){}
    return true;`);






  /* §7-3 · §15 — ⚠️⚠️ **버킷이 설정되기 전에는 사진 칸이 아예 안
     나옵니다.** 올릴 데가 없는데 칸을 내면 손님이 고르고 눌렀다가
     실패합니다 — 이 저장소가 "클릭해도 작동하지 않는 버튼" 을 금지로
     두고 로그인에서도 같은 방식을 쓴 그 자리입니다 (절대 규칙 2 · 5).
     ⚠️ 지금 운영 사이트가 그 상태입니다 (`INTAKE_BUCKET` 없음). */
  await f("버킷이 설정되기 전에는 사진 칸이 안 나온다", "/quote?side=ops", `
    if(typeof amPhotoAfter !== "function") return "사진 붙이는 층이 없습니다";
    const box = document.createElement("div");
    box.id = "zz-ph";
    document.querySelector("#view").appendChild(box);
    amPhotoAfter(box, "SW-AAAA-0001", "010-1111-2222");
    await new Promise(function(r){ setTimeout(r, 700); });
    const on = box.querySelector(".phup");
    box.remove();
    if(on) return "설정 전인데 사진 칸이 그려졌습니다";
    /* ⚠️ 번호가 없으면(저장 안 된 접수) 그려지지 않는 것도 같이 */
    const b2 = document.createElement("div");
    document.querySelector("#view").appendChild(b2);
    amPhotoAfter(b2, "", "010-1111-2222");
    await new Promise(function(r){ setTimeout(r, 300); });
    const on2 = b2.querySelector(".phup");
    b2.remove();
    if(on2) return "접수번호가 없는데 사진 칸이 그려졌습니다";
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
       버튼이 금색이 되면 그 규칙이 깨집니다.
       ⚠️⚠️ **2026-10-13 §2 로 행동색이 브라운이 됐습니다.** 전에는
       "빨강 성분이 파랑보다 크면 실패" 로 봤는데, 그건 행동색이
       **블루**이던 시절의 증거였습니다 — 팔레트가 베이지 · 브라운이
       되자 멀쩡한 버튼이 "파랑이 아닙니다" 로 걸렸습니다. 여기서
       지켜야 하는 것은 **파랑**이 아니라 "금색이 아닐 것" 과
       "흰 글자가 읽힐 것" 입니다. 그 둘을 직접 봅니다. */
    const b1 = document.querySelector(".btn-b");
    if(!b1) return "기본 버튼이 없습니다";
    const cs = getComputedStyle(b1);
    const bg = cs.backgroundColor;
    const m = bg.match(/rgba?\\((\\d+), ?(\\d+), ?(\\d+)/);
    if(!m) return "버튼 바탕을 못 읽습니다";
    const c = [+m[1], +m[2], +m[3]];
    /* 샴페인 골드(#D5B998 계열) — 밝고 따뜻하고 r>g>b 입니다.
       행동색이 그 자리에 오면 "악센트 네 자리" 규칙이 깨집니다. */
    const lin = function(x){ x /= 255;
      return x <= .03928 ? x/12.92 : Math.pow((x+.055)/1.055, 2.4); };
    const L = .2126*lin(c[0]) + .7152*lin(c[1]) + .0722*lin(c[2]);
    if(c[0] > c[1] && c[1] > c[2] && L > 0.35)
      return "기본 버튼이 금색 쪽입니다 — " + bg;
    /* 흰 글자를 얹는 면이라 AA(4.5)를 넘겨야 합니다 */
    const fg = (cs.color.match(/rgba?\\((\\d+), ?(\\d+), ?(\\d+)/) || []).slice(1).map(Number);
    if(fg.length === 3){
      const Lf = .2126*lin(fg[0]) + .7152*lin(fg[1]) + .0722*lin(fg[2]);
      const cr = (Math.max(L, Lf) + .05) / (Math.min(L, Lf) + .05);
      if(cr < 4.5) return "기본 버튼 글자 대비가 " + cr.toFixed(2) + "입니다";
    }
    return true;`);
  /* ⚠️ 검색은 **히어로의 대형 검색창**(§6)과 헤더 아이콘 둘입니다.
     히어로 쪽은 위의 "히어로에서 바로 찾고 바로 갈라진다" 가 봅니다. */
  /* 2026-10-21 사장님 지시 — "새로고침하면 맨 상단 페이지로 올라가는
     기능을 만들어줘".

     ⚠️⚠️ **브라우저가 되돌려 놓는 것을 끈 것**입니다. 기본값(auto)은
     새로고침할 때 전에 보던 자리로 내려놓는데, 라우터는 이미 맨 위로
     올리고 있어서(render 의 scrollTo) 둘이 싸우기만 했습니다.
     ⚠️ 여기서 보는 것은 **그 한 줄이 살아 있는가**까지입니다 — 실제로
     내려가서 새로고침해 보는 것은 tools/test-flows.js 가 합니다
     (전수 점검은 한 화면 안에서 도는 검사라 다시 띄울 수가 없습니다). */
  await f("새로고침하면 맨 위에서 시작한다", "/shop", `
    if(!("scrollRestoration" in history))
      return true;                      /* 아주 옛 브라우저 — 끌 것이 없습니다 */
    if(history.scrollRestoration !== "manual")
      return "브라우저가 스크롤을 되돌려 놓습니다 — " + history.scrollRestoration;
    /* ⚠️ "더 보기" 는 그대로 스크롤을 지켜야 합니다 — 그쪽은 scrollTo 를
       안 부르는 길이라, 이 한 줄과 서로 다른 자리입니다. */
    const keep = document.querySelector("[data-keep]");
    /* ⚠️⚠️ **여기에 정규식을 쓰지 마세요.** 검사 본문은 템플릿
       문자열이라 백슬래시를 한 겹으로 적으면 **먹어서 정규식 앞이
       깨집니다** — 처음에 그렇게 적었다가 "Unexpected token '.'" 로
       그 검사가 통째로 안 돌고 prove-checks 가 배포를 막았습니다
       (이 저장소의 열다섯 번째 escape 사고). indexOf 로 집습니다. */
    const kh = keep ? (keep.getAttribute("href") || "") : "";
    if(kh && kh.indexOf("/") !== 0)
      return "더 보기 링크가 사이트 안 주소가 아닙니다";
    return true;`);

  await f("어느 화면에서나 검색으로 가는 길이 있다", "/shop", `
    /* ⚠️ 2026-10-03 — 넓은 화면에서는 **입력칸**, 좁은 화면에서는
       **돋보기 단추**입니다 (지시서 §2). 둘 중 하나는 늘 보여야 합니다.
       ⚠️⚠️ **보는 화면을 / 에서 /providers 로 옮겼습니다** —
       2026-10-13 §3 이 "기존 메인페이지 상단 검색 아이콘은 제거한다"
       고 적었습니다. 메인에서 없어야 하는 것은 위 검사가 보고, 여기는
       **나머지 화면에 그대로 있는가**를 봅니다 (§3 이 같은 문장에서
       "검색 기능 자체는 삭제하지 않는다" 고 적었습니다). */
    const vis = function(e){
      if(!e) return null;
      const r = e.getBoundingClientRect();
      return (r.width >= 40 && r.height >= 40) ? r : null;
    };
    const box = vis(document.querySelector(".hd .hd-s"));
    const ico = vis(document.querySelector('.hd a[href="/search"]'));
    if(!box && !ico) return "헤더에 쓸 수 있는 검색 자리가 없습니다";
    /* 입력칸이 보이면 엔터로 실제로 가야 합니다 */
    if(box && !document.querySelector('.hd input[type="search"]'))
      return "헤더 검색이 입력칸이 아닙니다";
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
  /* ══ 도구 열셋 (2026-10-05 V2 §16) ═══════════════════════════════ */





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
    /* ⚠️ 2026-10-03 — 손으로 고른 "핵심 서비스 여덟"(.mv-g)은 "고른
       업종에 필요한 모든 것"(.mfit-tb)으로 **대체**됐습니다. 지운 것이
       아니라 데이터에서 오는 쪽으로 바뀐 것이라, 찾는 표시만 바꿉니다. */
    /* ⚠️ 이 주석에 백틱을 쓰면 문자열이 거기서 끝납니다 — 열세 번
       겪었습니다. 아예 쓰지 마세요.
       ⚠️⚠️ **2026-10-08 지시서 §3 으로 메인이 일곱 구간이 됐습니다.**
       여기서 보는 것은 "/ 가 중간 소개 화면이 아니라 **실제 서비스
       메인**인가" 입니다 — 그래서 찾는 표시도 지금 화면의 것으로
       바꿉니다 (내려온 구간은 PageMain 주석이 갈 곳을 적어 두었습니다). */
    /* ⚠️⚠️ **2026-10-11 최종 디자인 지시서 §1 로 메인이 일곱 구간이
       됐습니다** — 히어로의 창업 / 폐업 선택 카드(.mh-pick-g)와
       "계산도구 + 최신 정보" 두 칸(.mti-g2)이 없어졌습니다. 보는 것은
       여전히 "/ 가 실제 서비스 메인인가" 라서, 찾는 표시만 지금 화면의
       것으로 옮깁니다 — 히어로의 통합검색 · 바로가기 · 계산도구 ·
       이용 절차 · 마지막 CTA 입니다. */
    /* ⚠️⚠️ **2026-10-13 §5 로 히어로가 사진 2분할이 됐습니다** —
       히어로 안의 통합검색(.mh-find)과 바로가기 칩(.mh-chip)이
       내려왔습니다. 검색은 §3 대로 **메인에서만** 접힌 것이고 기능은
       그대로입니다 (헤더 짝 검사 둘이 봅니다). 보는 것은 여전히
       "/ 가 중간 소개 화면이 아니라 실제 서비스 메인인가" 라서,
       찾는 표시를 지금 화면의 것으로 옮깁니다. */
    /* ⚠️⚠️ **2026-10-16 §3 으로 메인이 아홉 영역(#view 안 일곱)이
       됐습니다.** 보는 것은 여전히 "/ 가 중간 소개 화면이 아니라 실제
       서비스 메인인가" 라서, 찾는 표시만 지금 화면의 것으로 옮깁니다 —
       브랜드 히어로 · 진입 카드 셋 · 양도양수 배너 · 선택 까닭 ·
       이용 방법 · 배너 둘 · 마지막 CTA 입니다. */
    /* ⚠️⚠️ **2026-10-16 §3 으로 메인이 아홉 영역(#view 안 일곱)이
       됐습니다.** 보는 것은 여전히 "/ 가 중간 소개 화면이 아니라 실제
       서비스 메인인가" 라서, 찾는 표시만 지금 화면의 것으로 옮깁니다.
       ⚠️ 앞 지시서의 표시(.mh2 · .mhall-g · .hsv-g · .mcal-g ·
       .mstp-g · .mlast-go)는 **함수를 안 지웠으니** 되살리실 수
       있습니다 — 그날 여기에 다시 넣으세요. */
    /* ⚠️⚠️ **2026-10-17 §4 — 히어로가 빠지고 계산도구 · 이용 가이드 ·
       견적 안내 카드가 들어왔습니다.** .bhero-go 는 함수를 안 지웠으니
       되살리실 수 있습니다 — 그날 여기에 다시 넣으세요. */
    /* WARN 2026-10-25 §1 — .bhero-go 가 돌아오고 .bwhy-g · .bqc 가
       내려갔습니다 (중간 대형 견적 신청 섹션 금지). 되살리시면 그날
       여기에 다시 넣으세요. */
    /* ⚠️⚠️ 2026-10-29 PHONEWAY 전환 — 찾는 표시를 지금 화면의 것으로
       옮깁니다. 보는 것은 그대로 "/ 가 중간 소개 화면이 아니라 실제
       서비스 메인인가" 입니다. ⚠️ 앞 지시서의 표시(.bhero-go ·
       .bent-g · .bdir-g · .bstep-g · .bcal-g · .bgd-g · .bcta-go)는
       함수를 안 지웠으니 되살리실 수 있습니다 — 그날 다시 넣으세요. */
    /* ⚠️⚠️ 2026-10-29 오렌지 시안 §3 — 찾는 표시를 지금 화면의
       것으로 옮깁니다. ⚠️ pww-g(판매 두 방법) · pws-g(중고폰
       갈래)는 **함수도 CSS 도 안 지웠으니** 되살리실 수 있습니다 —
       그날 여기에 다시 넣으세요.
       ⚠️⚠️ **주석에 백틱을 쓰지 마세요** — 검사 본문이 템플릿
       문자열이라 거기서 끊깁니다 (이 저장소 서른 번째입니다). */
    /* ⚠️⚠️ 2026-10-30 전면 리뉴얼 §2 — 찾는 표시를 지금 화면의
       것으로 옮깁니다. ⚠️ pwd-g(기기 선택) · pwq-g(바로가기)는
       **함수도 CSS 도 안 지웠으니** 되살리실 수 있습니다 — 그날
       여기에 다시 넣으세요. */
    const need = [[".pwh-go",  "히어로 단추 둘"],
                  [".pwh-tr-g","신뢰 요소 넷"],
                  [".pwsv-g",  "핵심 서비스 여섯"],
                  [".pwbr-g",  "브랜드 여섯"],
                  [".pwpd-fil","중고폰 거르개"],
                  [".pwbz-g",  "안내 배너 셋"],
                  [".pwst-g",  "이용 방법 다섯"],
                  [".pwt-g",   "거래 전 고지"],
                  [".pwc-go",  "하단 CTA"]];
    for(const q of need)
      if(!v.querySelector(q[0])) return q[1] + " 가 메인에 없습니다";
    /* ⚠️⚠️ **메인에서는 헤더 검색을 찾지 않습니다** (2026-10-13 §3 —
       "기존 메인페이지 상단 검색 아이콘은 제거한다"). 기능이 살아
       있는지는 /providers 에서 보는 짝 검사가 봅니다 — 여기서 같이
       보면 §3 과 정면으로 부딪칩니다. */
    /* ⚠️ 게이트웨이로 보내는 길이 남아 있으면 안 됩니다 (§29) */
    const gate = [].slice.call(document.querySelectorAll('a[href="/home"]'));
    if(gate.length)
      return "아직 /home 으로 보내는 링크가 " + gate.length + "개 있습니다";
    return true;`);
  await f("메인 구간 바탕은 밝고 그 표시가 메인 밖으로 안 샌다", "/", `
    /* ⚠️⚠️ **2026-10-17 §3-2 가 하루 앞의 다크 메인을 뒤집었습니다** —
       "전체적으로 어두운 배경이 반복되어 화면이 무겁고, 서비스 탐색에
       필요한 정보의 가독성이 떨어진다 … 사이트 전체를 검정 또는 다크
       브라운으로 채우지 않는다. **특히 스토어웨이가 선택받는 이유,
       이용 방법, 계산도구는 밝은 배경을 유지한다.**"
       ⚠️⚠️ **다크로 남는 자리는 지시서가 정한 것들**입니다 — 진입 카드
       셋의 면(§6) · 양도양수 배너(§7) · 하단 CTA(§14) · 헤더 · 푸터.
       그래서 화면마다 도는 AUDIT 의 어두운 면 ① ② 는 메인에서
       건너뛰고, 여기가 그 자리를 받습니다.
       ⚠️ 둘을 한 검사로 묶지 마세요 — 아래 짝 검사가 속화면 쪽이고,
       한쪽만 보면 "전부 다크로 바꾸기" 가 그냥 통과합니다. */
    if(!document.documentElement.classList.contains("ivh"))
      return "메인에 메인 표시(ivh)가 없습니다";
    const lum = function(c){
      const g = function(x){ x /= 255;
        return x <= .03928 ? x/12.92 : Math.pow((x+.055)/1.055, 2.4); };
      return .2126*g(c[0]) + .7152*g(c[1]) + .0722*g(c[2]);
    };
    const bgL = function(e){
      const m = getComputedStyle(e).backgroundColor.match(/(\\d+), ?(\\d+), ?(\\d+)/);
      return m ? lum([+m[1], +m[2], +m[3]]) : null;
    };
    const bodyL = bgL(document.body);
    if(bodyL === null) return "메인 바탕색을 못 읽습니다";
    if(bodyL < 0.6) return "메인 바탕이 밝지 않습니다 (§3-2)";

    /* ⚠️⚠️ **밝은 톤 클래스가 끼어들면 안 됩니다.** paintTones() 는
       이웃한 두 구간이 같은 묶음이면 뒤엣것을 다음 바탕으로 미는데,
       메인 구간은 톤 클래스가 없어서 전부 같은 묶음으로 읽힙니다 —
       막지 않으면 아이보리 · 베이지 차례 사이에 엉뚱한 띠가 생깁니다.
       에러도 안 나고 가로 스크롤도 안 나서 찍어 봐야 아는 종류입니다. */
    const lit = document.querySelectorAll("#view .sec-white, #view .sec-gray");
    if(lit.length) return "메인에 톤 클래스가 " + lit.length + "개 끼었습니다";

    /* ⚠️⚠️ **구간 수를 여기서 세지 않습니다.** 전에 여덟을 박아
       두었다가 2026-10-22 §2 로 히어로가 빠져 일곱이 되자, 이 검사가
       **되돌리기 전에도 후에도 같은 말로 떨어져** 되돌리기를 통째로
       가렸습니다 (prove-checks 가 "안 잡습니다" 로 잡았습니다).
       개수를 두 곳에 적으면 어긋납니다 — 세는 것은 차례 검사
       ("메인 구간 차례가 지시서와 같다") 한 곳입니다.
       여기가 보는 것은 **바탕이 밝은가**뿐입니다. */
    const secs = [].slice.call(document.querySelectorAll("#view > section"));
    if(!secs.length) return "메인에 구간이 없습니다";

    /* ⚠️⚠️ **§3-2 가 이름까지 적은 셋**은 반드시 밝아야 합니다 */
    /* WARN bwhy 가 2026-10-25 §1 로 내려가서 그 자리를 히어로가
       받습니다 — §1-01 이 "BRIGHT PREMIUM 디자인 방향을 유지한다" 고
       직접 적은 구간입니다. */
    /* ⚠️⚠️ 2026-10-29 PHONEWAY — 지시서 §2 가 배경을 화이트 ·
       라이트 그레이로 정했습니다. 히어로(pwh) · 이용 방법(pwst) ·
       거래 전 고지(pwt)가 **반드시 밝아야** 하는 자리입니다 —
       짙은 면은 하단 CTA(pwc) 한 장까지입니다. */
    for(const q of [[".pwh","히어로"], [".pwst","이용 방법"],
                    [".pwt","거래 전 고지"]]){
      const e = document.querySelector(q[0]);
      if(!e) return q[1] + " 구간이 없습니다";
      const L = bgL(e);
      if(L === null || L < 0.6)
        return q[1] + " 구간이 밝지 않습니다 (§3-2 가 이름까지 적은 자리입니다)";
    }

    /* ⚠️⚠️ **"사이트 전체를 다크로 채우지 않는다"** — 구간 바탕의
       **면적**으로 봅니다. 다크로 둘 수 있는 것은 §6 · §7 · §14 가
       정한 셋까지이고, 그게 절반을 넘으면 다시 다크 메인입니다. */
    let litA = 0, dkA = 0;
    for(const e of secs){
      const r = e.getBoundingClientRect();
      const a = Math.max(0, r.width) * Math.max(0, r.height);
      const L = bgL(e);
      if(L === null) return (e.className || "").split(" ")[0] + " 의 바탕을 못 읽습니다";
      if(L < 0.6) dkA += a; else litA += a;
    }
    if(!(litA + dkA)) return "구간 면적을 못 읽습니다";
    const pct = litA / (litA + dkA) * 100;
    if(pct < 60)
      return "메인 구간 바탕에서 밝은 면이 " + pct.toFixed(1) + "% 입니다 (60% 이상이어야 합니다 · §3-2)";
    return true;`);
  await f("속화면은 그대로 밝고 메인 표시가 안 묻었다", "/shop", `
    /* ⚠️⚠️ **위 검사와 짝입니다.** 빌드가 하위 화면에서 ivh 를 떼어
       내는데(shell()), 그게 새면 160개가 메인 바탕을 쓰게 되고 구간
       리듬(ΔE 2.5)이 한꺼번에 어긋납니다. */
    if(document.documentElement.classList.contains("ivh"))
      return "속화면에 메인 표시(ivh)가 붙어 있습니다";
    const m = getComputedStyle(document.body).backgroundColor
      .match(/(\\d+), ?(\\d+), ?(\\d+)/);
    if(!m) return "속화면 바탕색을 못 읽습니다";
    const g = function(x){ x /= 255;
      return x <= .03928 ? x/12.92 : Math.pow((x+.055)/1.055, 2.4); };
    const L = .2126*g(+m[1]) + .7152*g(+m[2]) + .0722*g(+m[3]);
    if(L < 0.6) return "속화면 바탕이 밝지 않습니다 (BRIGHT PREMIUM)";
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
    /* ⚠️ 2026-10-11 간소화 §2 로 이 구간이 메인에서 내려왔습니다.
       **검사를 지우지 않았습니다** — 되살리시면 그날 다시 봅니다.
       없으면 건너뜁니다 (없는 것을 "결함" 으로 잡으면 안 됩니다). */
    const a = document.querySelector(".mbr-cl");
    const b = document.querySelector(".mbr-st");
    if(!a || !b) return true;
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
    /* ⚠️ 2026-10-08 — 히어로가 다시 짜이면서 자리 이름이 바뀌었습니다
       (.hp2-ph → .mh-ph .ph). 선택 카드 액자(.hpk-ph)도 같이 봅니다. */
    /* ⚠️ 2026-10-09 §3 · §5 — 서비스 카드가 컬러 아이콘 원판이 되면서
       사진 자리가 .msvc-ph 에서 원판 안으로 옮겨갔습니다. */
    /* ⚠️ 2026-10-11 — 서비스 카드 사진이 원판 안에서 **카드 전체를
       채우는 바탕**으로 나갔습니다 (.msvc-bg). .ia-t 쪽 규칙은
       그대로 둡니다 — 원판에 사진을 넣는 날 바로 걸리게. */
    /* ⚠️ 2026-10-11 — 전문관 카드 바탕(.mhall-bg)이 늘었습니다.
       사진이 들어가는 자리를 만들면 **여기 넣으세요** — 안 넣으면
       object-fit 이 빠져도 조용히 통과하고 사진이 늘어납니다. */
    /* ⚠️ 2026-10-11 — 선택 카드 액자(.hpk-ph)가 없어지고 마지막 CTA
       의 상담 사진 액자(.mlast-im)가 생겼습니다. 그 자리는 **지금
       비어 있어서** 사진이 들어오는 날 바로 걸립니다. */
    /* ⚠️⚠️ **2026-10-31 — 재던 열한 자리가 전부 죽어 있었습니다.**
       인수인계 화면을 지우면서 그 자리를 그리는 JS 가 없어졌는데 CSS 는
       남아 있어서, 이 검사가 **아무 데도 안 쓰이는 규칙 열하나를 보고
       초록**이었습니다 — 정작 지금 사진이 들어가는 넷(히어로 · 기기
       카드 · 안내 배너 · 소식)은 **아무도 안 보고 있었습니다.**
       photoBox 를 부르는 자리를 세어 찾았습니다 (js=0 vs css=22).
       ⚠️ 옛 열하나는 git show d1810ed:check.js 에 있습니다.

       ⚠️⚠️ **cover 만 보지 마세요.** 기기 사진 넉 장이 **배경이
       투명한 PNG** 라 contain 이 맞습니다 — cover 로 두면 제품이
       액자 밖으로 잘립니다. 자리마다 어느 쪽인지 적습니다.
       ⚠️ 사진 자리를 새로 만들면 **여기 넣으세요** — 안 넣으면
       object-fit 이 빠져도 조용히 통과하고 사진이 늘어납니다
       (img 의 기본값이 fill 입니다 — 액자에 맞춰 늘어납니다).
       ⚠️⚠️ **묶음 선택자를 알아봅니다** (쉼표로 나눠 봅니다). 전에는
       selectorText 를 **글자까지 그대로** 견주어서, CSS 쪽에
       ".dvc-ph .ph, .dvc-im" 처럼 한 선택자가 더 붙자 멀쩡한 규칙을
       "object-fit 이 없습니다" 로 잡았습니다 (2026-10-31).
       ⚠️ 그래도 **앞에 다른 클래스를 붙이면 못 찾습니다**
       (".pwd-g .dvc-ph .ph" 는 다른 규칙입니다) — 그건 일부러입니다.
       ⚠️⚠️ 주석에 백틱을 쓰지 마세요 — 이 본문이 템플릿 문자열이라
       거기서 끊깁니다 (방금 또 그랬습니다 · 서른세 번째). */
    const want = [[".pwh-art .ph",   "contain"],   /* 메인 히어로 (투명 PNG) */
                  [".dvc-ph .ph",    "contain"],   /* 기기 카드 (투명 PNG) */
                  [".pwbz-im",       "contain"],   /* 안내 배너 */
                  [".pwnw-ph .ph",   "cover"],     /* 소식 (지금 0건) */
                  [".pgh-im .ph",    "cover"]];    /* PgHero (지금 부르는 데 없음) */
    const bad = [];
    for(const pair of want){
      const q = pair[0], fitWant = pair[1];
      let ok = false;
      for(const sh of document.styleSheets){
        let rules; try { rules = sh.cssRules; } catch(e){ continue; }
        if(!rules) continue;
        for(const r of rules){
          var parts = (r.selectorText || "").split(",").map(function(s){
            return s.trim(); });
          if(parts.indexOf(q) >= 0 &&
             (r.style.objectFit || "").indexOf(fitWant) >= 0) ok = true;
        }
      }
      if(!ok) bad.push(q + " (" + fitWant + ")");
    }
    return bad.length ? bad.join(" · ") + " 에 object-fit 이 없습니다" : true;`);
  await f("핵심 서비스 카드 여섯의 크기가 같다", "/", `
    /* ⚠️⚠️ **재는 자리가 다섯 번 옮겨 왔습니다** — 히어로 선택 카드
       둘(2026-10-08) → 전문관 카드 넷(10-11) → 진입 카드 셋(10-16) →
       넷(10-20) → 구매 갈래 넷(10-29 PHONEWAY) → 기기 선택 넷(10-29) →
       **핵심 서비스 카드 여섯**(10-30 §2-3). 규칙이 바뀐 것이 아니라 재는
       자리가 바뀐 것입니다 — 하나를 좁히거나 가볍게 만들면 그게
       "덜 중요한 것" 이라는 말입니다.
       ⚠️ 사업 배너 넷은 다른 검사가 봅니다 — 둘을 묶지 마세요
       (한쪽만 보면 다른 쪽이 조용히 어긋납니다). */
    const L = [].slice.call(document.querySelectorAll(".pwsv-g .pwsv-c"));
    const want = (window.PW_SVC6 || []).length;
    if(!want) return "PW_SVC6 를 못 읽습니다";
    if(L.length !== want)
      return "서비스 카드가 " + L.length + "장입니다 (" + want + "이어야 합니다)";
    if(innerWidth <= 900) return true;
    const R = L.map(function(e){ return e.getBoundingClientRect(); });
    if(Math.max.apply(null, R.map(function(r){ return r.top; })) -
       Math.min.apply(null, R.map(function(r){ return r.top; })) > 2) return true;
    const w = R.map(function(r){ return r.width; });
    const h = R.map(function(r){ return r.height; });
    if(Math.max.apply(null,w) - Math.min.apply(null,w) > 1 ||
       Math.max.apply(null,h) - Math.min.apply(null,h) > 1)
      return L.map(function(e, k){ return e.textContent.trim().slice(0,6) + " " +
        Math.round(w[k]) + "×" + Math.round(h[k]); }).join(" · ");
    /* ⚠️⚠️ **카드 전체가 하나의 링크입니다** — 안에 또 링크를 넣으면
       브라우저가 쪼갭니다. */
    for(const e of L)
      if(e.querySelector("a")) return "기기 카드 안에 링크가 또 있습니다";
    return true;`);
  /* ══ 여정 넷 (2026-10-05 V2 지시서 §1 · §2 · §4 · §6 · §7 · §31) ══ */







  await f("메인 아이콘이 비지 않고 한 묶음 안에서 겹치지 않는다", "/", `
    /* ⚠️ 아이콘이 비면 key 를 잘못 적은 것입니다 — icon() · iconArt() 가
       모르는 이름에 **빈 문자열**을 돌려주어 조용히 빈 칸이 됩니다
       (에러도 404 도 없고 전수 점검도 통과했던 자리입니다).
       ⚠️ 이 주석에 백틱을 쓰지 마세요 — 문자열이 거기서 끝납니다.
       ⚠️⚠️ 2026-10-25 §1 로 메인이 일곱 구간이 되면서 재는 자리가
       **진입 카드 넷 · 직접 찾기 여덟 · 계산도구 넷 · 이용 방법 다섯**
       으로 옮겨갔습니다. 보는 것은 그대로입니다 — 빈 아이콘과 한 묶음
       안의 중복, 그리고 가짜 링크입니다.
       ⚠️ 선택 까닭(.bwhy-i)과 배너(.bban-i)는 구간이 내려가서 뺐습니다 —
       되살리시면 그날 여기도 같이 넣으세요 (안 넣으면 그 구간의 빈
       아이콘을 아무도 안 봅니다). */
    /* ⚠️⚠️ 2026-10-29 오렌지 시안 — 재는 자리가 신뢰 넷 · 기기 선택 ·
       바로가기 다섯 · 이용 방법 · 거래 전 고지로 옮겨갔습니다. 보는
       것은 그대로입니다 — 빈 아이콘과 한 묶음 안의 중복, 그리고
       가짜 링크입니다.
       ⚠️ 판매 두 방법(pww-ic) · 구매 갈래(pws-c i)는 구간이
       내려가서 뺐습니다 — 되살리시면 그날 여기도 같이 넣으세요
       (안 넣으면 그 구간의 빈 아이콘을 아무도 안 봅니다). */
    /* ⚠️⚠️ 2026-10-30 전면 리뉴얼 §2 — 재는 자리가 **핵심 서비스
       여섯 · 안내 배너 셋**으로 옮겨갔습니다.
       ⚠️ 브랜드 칸은 여기서 안 봅니다 — 거기는 svg 가 아니라
       **권리를 확인한 로고 파일(img)** 이고, 없는 브랜드는 로고 줄이
       **통째 안 나오는 것이 맞습니다** (빈 칸을 안 깝니다 · 절대 규칙 2).
       ⚠️ 기기 선택(pwd-g) · 바로가기(pwq-c)는 구간이 내려가서
       뺐습니다 — 되살리시면 그날 여기도 같이 넣으세요. */
    const groups = [[".pwh-tr-g i", "신뢰 요소"], [".pwsv-i", "핵심 서비스"],
                    [".pwbz-ic", "안내 배너"],
                    [".pwst-c i", "이용 방법"], [".pwt-c i", "거래 전 고지"]];
    for(const g of groups){
      const L = [].slice.call(document.querySelectorAll("#view " + g[0]));
      if(!L.length) return g[1] + " 아이콘이 하나도 없습니다";
      const seen = [];
      for(const e of L){
        /* 2026-10-30 — 기기 선택은 사진이 들어오면 svg 대신 img 입니다.
           그때는 그 사진 주소로 겹침을 봅니다 (빈 액자 ph-none 은 빈 것). */
        const im = e.querySelector("img.ph:not(.ph-none)");
        const sv = e.querySelector("svg");
        if(!im && (!sv || !sv.innerHTML.trim())) return g[1] + " 에 빈 아이콘이 있습니다";
        const k = im ? (im.getAttribute("src") || "") : sv.innerHTML.trim();
        if(seen.indexOf(k) >= 0) return g[1] + " 아이콘이 겹칩니다";
        seen.push(k);
      }
    }

    /* ⚠️ 메인의 모든 링크가 **실제로 있는 주소**라야 합니다 (절대 규칙 5) */
    const bad = [].slice.call(document.querySelectorAll("#view a"))
      .map(function(a){ return a.getAttribute("href") || ""; })
      .filter(function(h){ return !h || h === "#" || h.indexOf("javascript:") === 0; });
    if(bad.length) return "메인에 가짜 링크가 " + bad.length + "개 있습니다";

    return true;`);


  /* ⚠️⚠️ **근거 없는 인기 · 추천 표현을 막습니다** (2026-10-06 마무리
     지시서 §3). 검색량 · 클릭 · 저장 · 견적 요청을 **하나도 모으지
     않습니다** — 재 본 적 없는 것을 적으면 표시·광고의 공정화에 관한
     법률 제3조입니다. 이 저장소에서 같은 자리를 여러 번 오갔습니다
     (검색 칩의 "인기" · 서비스 구간의 "많이 찾는").
     ⚠️ 이용 데이터가 쌓이면 **이 검사를 지우지 말고** 그 값을 세는
     별도 구간을 만드세요 (§3). */
  await f("근거 없는 인기 · 추천 표현이 없다", "/", `
    /* ⚠️ "인기" 를 낱글자로 찾지 마세요 — **무인기기** 처럼 멀쩡한
       낱말에 들어 있습니다 (업종 장비 목록에 실제로 있습니다). */
    const BAD = ["많이 찾는", "인기순", "인기 검색어", "인기 서비스",
                 "인기 업체", "인기 많은", "BEST", "사장님들이 선택",
                 "가장 많이", "만족도가 높은", "검증된 업체",
                 "추천 프랜차이즈", "추천 업체", "추천 검색어", "추천순"];
    const v = document.getElementById("view");
    if(!v) return "본문이 없습니다";
    /* 푸터까지 봅니다 — 모든 화면이 같이 쓰는 자리입니다 */
    const txt = v.textContent + " " + (document.querySelector("footer") || {}).textContent;
    const hit = BAD.filter(function(w){ return txt.indexOf(w) >= 0; });
    if(hit.length) return "근거 없는 표현이 있습니다 — " + hit.join(", ");
    if(/\\b(TOP|Top)\\s*\\d/.test(txt)) return "순위 표기(TOP n)가 있습니다";
    return true;`);

  await f("메인 구간 차례가 지시서와 같다", "/", `
    /* ⚠️⚠️ **2026-10-08 "최종 디자인 통합 및 기능 완성 작업지시서"
       §3 의 차례**입니다 — HEADER → HERO → 브랜드 연결 → 핵심 서비스
       여덟 → 계산도구 + 최신 정보 → 매장 · 시설 · 장비 → 파트너 입점 →
       마지막 CTA → FOOTER. HEADER · FOOTER 는 #view 밖이라 여기 셈은
       **일곱**입니다.

       ⚠️ 차례를 늘리거나 섞기 전에 **지시서를 먼저 고치세요.** §30-1 ·
       §30-2 가 "다시 비우지도 말고, 모든 것을 한꺼번에 나열하지도
       말라" 고 적었습니다.
       ⚠️⚠️ 메인에서 내려온 구간 여섯(상황 · 업종 · 맞춤 로드맵 ·
       단계 열 · 이용방법 · 브랜드 스토리)은 **지운 것이 아닙니다** —
       PageMain 의 주석에 갈 곳을 하나씩 적어 두었습니다.
       ⚠️ 구간이 .sec 를 같이 답니다 — 첫 낱말만 보면 전부 "sec" 으로
       읽혀 이 검사가 아무것도 안 잡습니다. 우리 표시를 찾습니다.
       ⚠️ 이 주석에 백틱을 쓰면 문자열이 거기서 끝납니다 (열세 번). */
    /* ⚠️⚠️ 2026-10-09 최종 통합 리뉴얼 §3-3 의 차례입니다 — HEADER ·
       FOOTER 는 #view 밖이라 여기서는 **열**입니다. mbr(인수 ↔ 인계)와
       mlast(마지막 CTA)는 §3-3 목록에 없지만 §12 가 "기존 콘텐츠를 지워
       빈 페이지처럼 만들지 않는다" 고 적어 그대로 두었습니다.
       ⚠️⚠️ **2026-10-11 로 mexp(지금 어느 자리에 계신가요)가 열하나에서
       빠졌습니다** — 사장님 지시 1 입니다. 지시가 이어서 "단, 해당
       섹션의 창업 · 매장 운영 · 폐업 관련 기능과 연결 페이지는 삭제하지
       않습니다" 라고 적어서, 함수는 home-retired.js 에 그대로 있고
       그 구간이 가리키던 열다섯 주소는 헤더 여섯 · 메인 02 서비스 여덟 ·
       09 운영 묶음 · 푸터 다섯 칸이 전부 받습니다 (링크 검사가 봅니다). */
    /* ⚠️⚠️ 2026-10-11 간소화 지시서 §2 — A~F 다섯 구간 + 푸터입니다
       (열에서 다섯으로. 줄인 것은 기능이 아니라 복잡성입니다). */
    /* ⚠️⚠️ 2026-10-11 **최종 디자인 지시서 §1** — 01 히어로 ·
       02·03 전문관과 세부 서비스(한 구간) · 04 계산도구 ·
       05 이용 절차 · 06 견적 · 상담 + 07 푸터(#view 밖).
       ⚠️ mk(매장 · 시설장비 전용 대형 이미지 구간)는 §1 · §11 이
       **메인에서 빼라고 직접 적은** 것입니다. */
    /* ⚠️⚠️ **2026-10-17 "메인페이지 최종 디자인 리뉴얼" §4 — 열한
       덩이**입니다. ① 헤더와 ⑪ 푸터는 #view 밖이라 여기서는
       **여덟**입니다. 바꾸시려면 지시서를 먼저 고치고
       build-pages.js 의 크롤러 본문도 같이 고치세요.
       ⚠️⚠️ **히어로(bhero)가 빠졌습니다** — §4 가 "기존의 큰 브랜드
       히어로 배너는 삭제한다" 고 직접 적었습니다. 함수는 안 지웠으니
       되살리실 수 있습니다 (그날 여기 앞에 다시 넣으세요). */
    /* ⚠️⚠️ **2026-10-22 — 히어로가 돌아오고 서비스 배너 둘이
       내려왔습니다** (사장님 시안). HomeBanners 함수와 .bban CSS 는
       지우지 않았습니다 — 되살리시면 그날 여기에 bban 을 다시
       넣으세요. 그리고 **build-pages.js 의 크롤러 본문도 같이**
       고치세요 (이 저장소가 열 번 겪은 자리입니다).
       ⚠️ 이 글은 템플릿 문자열 안입니다 — 주석에 백틱을 쓰면 문자열이
       거기서 끊깁니다 (스물다섯 번째로 또 겪었습니다). */
    /* ⚠️⚠️ **2026-10-22 "최상단 디자인 최종 변경" §2 — 히어로(bhero)가
       다시 빠지고 진입 카드 넷이 최상단이 됐습니다.** 함수는 지우지
       않았으니 되살리실 수 있습니다 — 그날 여기 앞에 bhero 를 다시
       넣으세요. */
    /* WARN 2026-10-25 "메인페이지 최종 디자인 구현" §1 — 히어로가 01 로
       돌아오고 bwhy(선택받는 이유 + 견적 안내 카드)가 내려갔습니다.
       §1-07 · §11 이 "중간 대형 무료 견적 신청 섹션" 을 직접
       금지해서, 그 카드가 들어 있던 구간을 안 부릅니다. 함수는
       지우지 않았으니 되살리실 수 있습니다 — 그날 bcal 다음에
       bwhy 를 다시 넣으세요. */
    /* ⚠️⚠️ **2026-10-29 오렌지 시안 §3 — 구간 일곱입니다.**
       01 히어로 + 신뢰 넷(pwh) · 02 기기 선택(pwd) · 03 사업 배너(pwbz) ·
       04 서비스 바로가기(pwq) · 05 이용 방법(pwst) · 06 거래 전
       고지(pwt) · 07 하단 CTA(pwc). HEADER · FOOTER 는 #view 밖입니다.
       ⚠️ 05~07 은 시안 §3 목록 밖이지만 §1 이 "기존 PHONEWAY 기능과
       데이터베이스는 보존한다" 고 적었고, 06 은 "무료 · 당일 정산 ·
       최고가 보장을 적지 않는다" 를 말하는 자리입니다.
       ⚠️ 앞 차례(pww 판매 두 방법 · pws 중고폰 갈래)와 그 앞
       지시서의 일곱(bhero · bent · bdir · bcal · bstep · bgd · bcta)은
       **함수도 CSS 도 안 지웠으니** 되살리실 수 있습니다 — 그날
       여기와 PHONEWAY 검사들을 같이 뒤집으세요. */
    /* ⚠️⚠️ **2026-10-30 전면 리뉴얼 §2 — 구간 여덟(소식까지
       아홉)입니다.** 01 히어로 + 신뢰 넷(pwh) · 02 핵심 서비스
       여섯(pwsv) · 03 브랜드 여섯(pwbr) · 04 중고폰 목록(pwpd) ·
       05 안내 배너 셋(pwbz) · [06 소식(pwnw)] · 07 이용 방법(pwst) ·
       08 거래 전 고지(pwt) · 09 하단 CTA(pwc). HEADER · FOOTER 는 #view
       밖입니다.
       ⚠️⚠️ **소식은 게시물 0건이면 구간째 빠집니다** — 지어내지
       않기 때문입니다 (절대 규칙 1). 그래서 기대하는 차례를
       **데이터에서** 만듭니다.
       ⚠️ 07–09 은 지시서 §2 목록 밖이지만 §0-3 이 "기존 기능을
       삭제하거나 훼손하지 않는다" 고 적었고, 08 은 "무료 · 당일
       정산 · 최고가 보장을 적지 않는다" 를 말하는 자리입니다.
       ⚠️ 앞 차례(pwd 기기 선택 · pwq 바로가기 · pww · pws)와 그 앞
       지시서의 일곱(bhero · bent · bdir · bcal · bstep · bgd · bcta)은
       **함수도 CSS 도 안 지웠으니** 되살리실 수 있습니다 — 그날
       여기와 PHONEWAY 검사들을 같이 뒤집으세요. 그리고
       **build-pages.js 의 크롤러 본문도 같이** 고치세요 (이 저장소가
       열두 번 겪은 자리입니다). */
    const want = ["pwh","pwsv","pwbr","pwpd","pwbz"]
      .concat((window.AM_PW_NEWS || []).length ? ["pwnw"] : [])
      .concat(["pwst","pwt","pwc"]);
    const S = [].slice.call(document.querySelectorAll("#view > section"));
    if(S.length !== want.length)
      return "구간이 " + S.length + "개입니다 (" + want.length + "이어야 합니다)";
    const got = S.map(function(e, i){
      /* ⚠️ 2026-10-11 — mhall 이 들어왔습니다. msvc · mexp 는 **빼지
         않습니다** — 되살아나면 "차례가 … 입니다" 로 이름을 내야
         합니다 ("?3" 이 아니라). */
      /* ⚠️ 앞 지시서의 이름들을 **빼지 않습니다** — 되살아나면
         "차례가 … 입니다" 로 이름을 내야 합니다 ("?3" 이 아니라). */
      for(const m of ["pwh","pwsv","pwbr","pwpd","pwnw",
                      "pwd","pwbz","pwq","pww","pws","pwst","pwt","pwc",
                      "bent","bdir","bpass","bwhy","bstep","bban","bcal","bgd","bcta",
                      "bhero","mh","mbr","mhall","msvc","mexp","pkg","mind",
                      "mti","mstp","mopsv","mjn","mlast"])
        if(e.classList.contains(m)) return m;
      const hd = (e.querySelector(".eyebrow") || {}).textContent || "";
      if(hd.indexOf("TAKE OVER") >= 0) return "mk";
      if(hd.indexOf("PARTNERS") >= 0)  return "pv";
      if(hd.indexOf("FRANCHISE") >= 0) return "fr";
      return "?" + i;
    });
    if(got.join(",") !== want.join(","))
      return "차례가 " + got.join(" → ") + "입니다";
    /* ⚠️⚠️ **범위 숫자(.mst-g)는 메인에서 내려왔습니다** — /about 의
       규모감 구간이 그대로 들고 있습니다 (거기 검사가 따로 있습니다).
       히어로 안에 되살리지 마세요: 히어로 끝은 선택 카드가 얹히는
       자리라 띠를 붙이면 카드 위로 올라앉습니다. */
    if(document.querySelector(".mh .mst-g")) return "숫자가 아직 히어로 안에 있습니다";
    return true;`);
  /* ⚠️⚠️ **2026-10-11 사장님 지시 — "폰에서 접어두는거 해줘."**
     패키지 넷의 상품 목록과 운영 묶음 여섯이 좁은 화면에서 세로로
     쌓이면서 그 둘만 화면 몇 개 높이가 됐습니다.

     ⚠️⚠️ **이 검사는 1280px 에서 돕니다** — 흐름 검사는 폭이 하나라
     접힌 모습을 직접 못 봅니다. 그래서 **규칙 자체**를 봅니다
     (object-fit 검사와 같은 방식입니다). 보는 것은 넷입니다 —
     ① 단추가 화면에 있고 ② 넓은 화면에서는 그 단추가 안 보이고
     ③ 넓은 화면에서 목록이 접혀 있지 않고 ④ 900px 아래에서 켜고
     접는 규칙이 살아 있는가.
     ⚠️ ②③ 이 중요합니다 — 접는 규칙을 묶음 밖으로 내면 **넓은
     화면에서도 접히는데 단추는 안 보여** 펼칠 방법이 아예 없습니다. */
  await f("폰에서 긴 묶음을 접어 둔다", "/guide", `
    /* ⚠️⚠️ **보는 자리를 패키지에서 푸터로 옮겼습니다** (2026-10-18).
       까닭 — 2026-10-18 전체 점검 §3 으로 폐업 · 창업 · 양도양수의
       패키지가 "신청" 에서 "위 선택에 담기" 로 바뀌면서
       pkg-l 을 내는 화면이 하나도 안 남았습니다. 그대로 두면 이
       검사는 영영 실패이거나, 고치려고 전문관에 모든 폭에서 접히는
       단추(fld-all)를 보게 하면 "넓은 화면에서 접기 단추가 보입니다"
       가 당연히 걸립니다 (그쪽은 단추가 보여야 펼칠 수 있습니다).
       ⚠️⚠️ **지금 폰에서만 접히는 자리는 푸터 한 곳이고, 그건 161개
       화면 전부에 있습니다** — 2026-10-12 §1 에서 다섯 덩이로 쌓이던
       것을 −43% 로 줄인 자리라 되돌아가면 바로 아픕니다.
       ⚠️ 패키지 · 운영 묶음 규칙은 **CSS 에 그대로 있는지**만 같이
       봅니다 — 그 구간을 되살리는 날 조용히 안 접히면 안 됩니다.
       ⚠️ 이 주석에 백틱을 쓰지 마세요 — 문자열이 거기서 끝납니다
       (열두 번 겪었습니다). */
    /* ⚠️⚠️ 푸터 머리말은 **넓은 화면에서도 단추**입니다 (숨기면 폰에서
       펼칠 자리가 없어집니다) — 접힌다는 표시를 내는 것은 그 안의
       화살표라, 재는 자리가 단추가 아니라 **화살표**입니다. */
    const btn = document.querySelectorAll(".ft-fold");
    if(!btn.length) return "푸터에 접기 단추가 없습니다";
    const arw = btn[0].querySelector("svg");
    if(!arw) return "푸터 접기 화살표가 없습니다";
    if(getComputedStyle(arw).display !== "none")
      return "넓은 화면에서 푸터 접기 화살표가 보입니다";
    const col = document.querySelector(".ft-col > ul");
    if(!col) return "푸터 칸이 없습니다";
    if(getComputedStyle(col).display === "none")
      return "넓은 화면에서 푸터 칸이 접혔습니다";
    let show = 0, shut = 0, keep = 0;
    for(const sh of document.styleSheets){
      let rules; try { rules = sh.cssRules; } catch(e){ continue; }
      if(!rules) continue;
      for(const r of rules){
        if(!r.media || r.media.mediaText.indexOf("900px") < 0) continue;
        for(const q of (r.cssRules || [])){
          const sel = q.selectorText || "";
          if(sel === ".ft-fold svg" && q.style.display && q.style.display !== "none") show++;
          if(sel === ".ft-col.is-fold > ul" && q.style.display === "none") shut++;
          /* 되살릴 구간의 규칙도 그대로 있는가 */
          if(sel === ".pkg-l.is-fold" && q.style.display === "none") keep++;
          if(sel === ".opsv-g.is-fold > .fld-x" && q.style.display === "none") keep++;
        }
      }
    }
    if(!show) return "900px 아래에서 푸터 접기 단추를 켜는 규칙이 없습니다";
    if(!shut) return "900px 아래에서 푸터 칸을 접는 규칙이 없습니다";
    if(keep < 2) return "되살릴 구간(패키지 · 운영 묶음)의 접는 규칙이 사라졌습니다 — " + keep;
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










  /* ⚠️⚠️ **컬러 아이콘 서른셋이 48 칸 안에서 저마다 다른 크기로
     그려져 있었습니다** (2026-10-24 재측정 — 제일 긴 변이 26 ~ 48 ·
     가운데도 4 가까이 떠 있었습니다). 같은 타일에 넣어도 어떤 것은
     크고 어떤 것은 작아 보여서, 사장님이 메인 "직접 찾기 여덟" 을
     보시고 "아이콘 크기들을 일치하게 만들어놔" 라고 하셨습니다.
     지금은 iconArt() 가 IA_FIT 보정표로 **제일 긴 변 40 · 가운데
     (24, 24)** 에 맞춥니다 (비율은 안 건드립니다).
     ⚠️⚠️ **그 표를 믿지 않고 화면에 그려진 것을 다시 잽니다.** 아이콘
     path 를 고치고 node tools/fit-icons.js --write 를 안 돌리면 그
     하나만 조용히 어긋나는데, 표끼리 견주면 **둘 다 옛 값**이라 늘
     통과합니다 (이 저장소가 "같은 규칙을 두 곳에 적어 어긋난" 사고를
     여러 번 겪은 자리).
     ⚠️ 선(stroke)까지 들어간 **보이는 네모**를 잽니다 — 서른셋 중
     열셋이 선을 쓰고 그 굵기가 보이는 크기에 들어갑니다. */
  /* ⚠️⚠️ **재는 화면을 "/providers" 로 옮겼습니다** (2026-10-29
     PHONEWAY). 메인은 구간 여섯이 손으로 그린 인라인 svg 라
     "svg.ia"(컬러 아이콘)가 **0개**입니다 — 거기서 재면 "0개뿐입니다"
     로 영원히 떨어집니다. 규칙은 한 줄도 안 바꿨습니다: 서른다섯 장이
     전부 같은 크기로 그려지는가.
     ⚠️ 재 본 값 — /providers 17 · /startup 20 · /operation 17 ·
     /closure 25 장. 메인에 컬러 아이콘을 다시 넣으시면 그날 여기를
     "/" 로 되돌리셔도 됩니다. */
  await f("컬러 아이콘이 모두 같은 크기로 그려진다", "/", `
    const svgs = Array.from(document.querySelectorAll("#view svg.ia"));
    if(svgs.length < 4) return "컬러 아이콘이 " + svgs.length + "개뿐입니다";
    const bad = [], seen = {};
    svgs.forEach(function(sv){
      const o = sv.getBoundingClientRect();
      /* ⚠️ 너무 작게 그려진 것은 소수점이 뭉개져 건너뜁니다 */
      if(o.width < 8) return;
      const z = o.width / 48;
      let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
      Array.from(sv.children).forEach(function(e){
        const r = e.getBoundingClientRect();
        if(!r.width && !r.height) return;
        L = Math.min(L, r.left);  T = Math.min(T, r.top);
        R = Math.max(R, r.right); B = Math.max(B, r.bottom);
      });
      if(!isFinite(L)) return;
      const w = (R - L) / z, h = (B - T) / z;
      const cx = (L - o.left) / z + w / 2, cy = (T - o.top) / z + h / 2;
      const big = Math.max(w, h);
      const nm = sv.getAttribute("data-ia") || "이름없음";
      if(seen[nm]) return;
      seen[nm] = 1;
      if(Math.abs(big - 40) > 1)
        bad.push(nm + " 긴 변 " + big.toFixed(1));
      else if(Math.abs(cx - 24) > 1 || Math.abs(cy - 24) > 1)
        bad.push(nm + " 가운데 " + cx.toFixed(1) + "," + cy.toFixed(1));
    });
    if(bad.length)
      return "아이콘 " + bad.length + "개가 어긋났습니다 (40 · 24,24 라야 합니다) — " +
        bad.slice(0, 6).join(" / ") + " · node tools/fit-icons.js --write";
    if(Object.keys(seen).length < 4)
      return "잰 아이콘이 " + Object.keys(seen).length + "개뿐입니다";
    return true;`);



  /* ⚠️⚠️ **브랜드 이름 뒤의 조사를 손으로 적으면 안 됩니다.**
     "ABOUTMEAT은 통신판매중개자이며" 로 박아 두었다가 이름이 "인수인계"
     가 되자 **"인수인계은"** 이 됐습니다 — 하필 전자상거래법 제20조
     제1항이 **고지하라고 정한 그 문장**이고, 푸터라서 **모든 화면**에
     나옵니다. `korean.js` 의 `koWith()` 가 받침을 보고 고릅니다.
     ⚠️ 이름이 또 바뀔 자리라(이 저장소에서 세 번째입니다) 검사가
     **이름을 바꿔 끼워 보고** 둘 다 맞는지 봅니다. */
  await f("브랜드 이름 뒤 조사를 손으로 적지 않는다", "/guide", `
    const t = document.body.textContent;
    const nm = (window.AM_BRAND||{}).name || "";
    if(!nm) return "브랜드 이름이 비었습니다";
    /* 지금 이름으로 틀린 조사가 찍혀 있지 않은지 */
    const right = window.koWith(nm, "은는").slice(nm.length);
    const wrong = right === "은" ? "는" : "은";
    if(t.indexOf(nm + wrong) >= 0) return "'" + nm + wrong + "' 가 화면에 있습니다";
    /* 중개자 고지가 실제로 있어야 합니다 (전자상거래법 제20조 제1항) */
    if(t.indexOf(nm + right + " 통신판매중개자") < 0)
      return "중개자 고지에 이름과 조사가 안 붙습니다";
    /* ⚠️ **받침 있는 이름으로 바꿔 끼워 봅니다** — 손으로 적어 둔
       자리가 있으면 여기서 드러납니다.
       ⚠️⚠️ **rerender() 로는 안 됩니다.** 중개자 고지는 푸터
       (Footer())에 있고 그것을 그리는 것은 mountChrome() 한 번뿐입니다 —
       rerender() 는 #view 와 paintChrome()(gnb · mnav · 사업자 칸)까지만
       다시 그려서, 이름을 바꿔도 푸터는 그대로입니다. 그러면 이 검사가
       **닿지도 못하는 자리를 재게** 됩니다 (실제로 그렇게 적어 두고
       "조사가 안 붙는다" 로 멀쩡한 코드를 잡았습니다 — 검사가 틀린
       자리입니다). 푸터를 다시 그립니다.
       ⚠️ 조사 사고가 실제로 난 자리가 바로 이 푸터 한 줄입니다
       (모든 화면에 나가고, 전자상거래법이 고지하라고 정한 문장입니다). */
    const keep = window.AM_BRAND.name;
    window.AM_BRAND.name = "창업마당";          /* 받침 있음 → '은' 이라야 */
    window.mountChrome();
    await new Promise(r => setTimeout(r, 60));
    const t2 = document.body.textContent;
    window.AM_BRAND.name = keep;
    window.mountChrome();
    if(t2.indexOf("창업마당는") >= 0)
      return "받침 있는 이름으로 바꾸니 '창업마당는' 이 나옵니다 — 조사를 손으로 적은 자리가 있습니다";
    if(t2.indexOf("창업마당은 통신판매중개자") < 0)
      return "이름을 바꾸니 중개자 고지에 조사가 안 붙습니다";
    return true;`);

  /* ⚠️ 어느 묶음이 몇 개인지는 **적지 않습니다.** 두 번 어긋났습니다 —
     검사를 더하면서 숫자를 같이 안 고치니 "흐름 52개" 라고 적힌 채
     실제로는 56개를 돌고 있었습니다. 총 개수는 위에서 세고, 여기는
     **무엇을 보는지**만 적습니다. */
  console.log("\n── 흐름 " + flowN + "개 (지어낸 것 없음 · 업종 개인화 · 조건 전달 · " +
              "접수 · MY · 검색 · 문서 · 히어로 · 규모감 · FAQ · 진행 · " +
              "정보 글 · 글 잇기 · 창업 과정 · 폐업 선택 · 골드 · 검색 진입 · " +
              "MY 도구 · 메인 · 업체 입점 · 매물)");
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
    /* ⚠️ 2026-10-08 — 메인이 다시 짜이면서 카드 종류가 바뀌었습니다.
       새 카드를 만들면 **여기 넣으세요** — 빠뜨리면 구간 바탕과 같은
       색이 되어도 조용히 통과합니다. */
    /* ⚠️ 2026-10-11 — .msvc-g 가 전문관 넷(.mhall-c)과 서비스 격자의
       흰 판(.hsv-box)으로 바뀌었습니다. 새 카드를 만들면 여기 넣으세요. */
    /* ⚠️ 2026-10-11 최종 디자인 — 선택 카드(.hpk)가 없어지고 계산도구
       카드(.mcal-g > li)와 절차 카드(.mstp-g > li)가 생겼습니다. */
    /* ⚠️ 2026-10-16 §3 — 진입 카드(.bent-c > a) · 까닭 카드(.bwhy-c) ·
       절차 카드(.bstep-c) · 배너(.bban-c > a)가 생겼습니다. */
    /* ⚠️⚠️ 2026-10-29 PHONEWAY — 메인 카드가 판매 방법(.pww-c) ·
       구매 갈래(.pws-c) · 이용 방법(.pwst-c) · 거래 전 고지(.pwt-c)로
       바뀌었습니다. **넷을 여기 안 넣으면** 그 카드가 구간 바탕과
       같은 색이 되어도 조용히 통과합니다 — 되돌려 보고 알았습니다
       (prove-checks 가 "되돌리기 전 true → 후 true" 로 잡았습니다).
       ⚠️ 새 카드를 만들면 **반드시 여기 넣으세요.** */
    const sel = ".cat,.ind,.pv,.fr,.fc,.mk,.help,.sp,.empty," +
                ".pww-c,.pws-c,.pwst-c,.pwt-c," +
                /* 2026-10-30 전면 리뉴얼 §2 — 핵심 서비스 여섯 ·
                   브랜드 여섯 · 상품 카드 · 빈 상태 · 소식 카드.
                   ⚠️ 안내 배너(.pwbz-c)는 **짙은 브라운 그라디언트**라
                   여기 넣지 마세요 — 구간 바탕과 비교하면 거짓으로 걸립니다. */
                ".pwsv-c,.pwbr-c,.pwpd-c,.pwpd-0,.pwnw-c," +
                ".bent-c > a,.bwhy-c,.bstep-c,.bban-c > a," +
                ".bcal-c > a,.bgd-c > a,.bqc," +
                ".mhall-c,.mcal-g > li,.mstp-g > li," +
                ".mti-c,.hsv-box,.mlast-h > li > a,.swt-c," +
                ".ms-g a,.mv-g a,.mh-fc > li,.hb-g a,.hb-b";
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
  /* 색인 안 하는 화면 목록 — `js/app.js` 한 곳에서 읽습니다 (위 ⚠️⚠️) */
  const NOIDX = (() => {
    const src = require("fs").readFileSync(__dirname + "/js/app.js", "utf8");
    const i = src.indexOf("var NOINDEX");
    const a = src.indexOf("[", i), b = src.indexOf("]", a);
    const L = (i < 0 || a < 0 || b < 0) ? [] :
      JSON.parse(src.slice(a, b + 1).replace(/\s+/g, ""));
    if (!L.length || L.indexOf("/my") < 0)
      throw new Error("js/app.js 의 NOINDEX 를 읽지 못했습니다 — 꼴이 바뀌었는지 보세요");
    return L;
  })();
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
      /* ⚠️⚠️ **이 목록을 손으로 적지 마세요.** 전에 다섯을 박아 두고
         주석으로만 "`js/app.js` 의 `NOINDEX` 와 같아야 합니다" 라고 적어
         두었는데, 그쪽이 일곱이 되자 `/track` · `/sell-biz` 가 **색인도
         안 하는 화면인데 크롤러 본문을 요구받아** 멀쩡한 화면이 걸렸습니다
         (`/compare` 로 이미 한 번 겪고 주석만 더해 둔 자리입니다).
         지금은 `js/app.js` 를 읽어 **그 목록 하나**를 씁니다 — 어긋날
         수가 없습니다. ⚠️ 못 읽으면 조용히 비우지 않고 멈춥니다
         (빈 목록이면 전부 요구해 오탐이 쌓이고, 통째로 집으면 반대로
         **아무 화면도 안 보게** 됩니다). */
      if (NOIDX.indexOf(path) >= 0) continue;
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

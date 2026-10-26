/* ══════════════════════════════════════════════════════════════════
   손님이 받는데 **아무도 안 부르는 덩이**를 셉니다 (2026-10-19)
   ══════════════════════════════════════════════════════════════════
   메인이 지시서마다 다시 짜이면서 내려온 구간의 함수가 화면 파일에
   그대로 남고, 그게 167개 화면 전부에 실립니다. 2026-10-11 에 서른일곱,
   2026-10-19 에 서른넷을 그렇게 찾았습니다.

   node tools/check-dead.js                 모든 화면 파일
   node tools/check-dead.js js/pages/home.js  한 파일만

   ⚠️⚠️ **이 도구는 "지워라" 가 아니라 "재 봐라" 입니다.** 내려보낼 때는
   `js/pages/home-retired.js` 처럼 **옮기고** index.html 에서 빼세요 —
   지우면 되살릴 수가 없습니다 (여러 지시서가 삭제를 금지했습니다).

   ⚠️⚠️ 세는 코드가 **두 번 거짓말을 했습니다** —
     ① `index.html` 의 스크립트만 훑어서 `PageMain`(라우터가 js/app.js
        에서 부릅니다)과 `StageCard`(js/pages/flow.js)가 "안 쓰임" 으로
        나왔습니다. 그대로 믿었으면 메인이 통째로 안 그려집니다.
     ② 주석과 문자열을 안 걷어내면 **반대로** 죽은 덩이가 전부
        "쓰임" 으로 나옵니다 — 이 저장소는 주석에 함수 이름을 잔뜩
        적습니다.
   그래서 js 폴더 전부 + build-pages.js + check.js + tools 까지 훑고,
   **주석과 문자열을 걷어낸 사본**에서 셉니다.
   ══════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");

/* 주석과 문자열을 공백으로 바꿉니다 (줄 수는 안 맞아도 됩니다 — 세기만 합니다) */
function strip(s){
  let o = "", i = 0, n = s.length;
  while(i < n){
    const c = s[i], d = s[i + 1];
    if(c === "/" && d === "/"){ while(i < n && s[i] !== "\n") i++; continue; }
    if(c === "/" && d === "*"){ i += 2; while(i < n && !(s[i] === "*" && s[i + 1] === "/")) i++; i += 2; continue; }
    if(c === '"' || c === "'" || c === "`"){
      const q = c; o += " "; i++;
      while(i < n && s[i] !== q){ if(s[i] === "\\") i++; i++; }
      i++; continue;
    }
    o += c; i++;
  }
  return o;
}

const ALL = [];
(function walk(d){
  for(const f of fs.readdirSync(d, { withFileTypes:true })){
    const p = path.join(d, f.name);
    if(f.isDirectory()){ if(f.name !== "node_modules") walk(p); }
    else if(f.name.endsWith(".js")) ALL.push(p);
  }
})("js");
for(const f of ["build-pages.js", "check.js"]) if(fs.existsSync(f)) ALL.push(f);
if(fs.existsSync("tools"))
  for(const f of fs.readdirSync("tools")) if(f.endsWith(".js")) ALL.push("tools/" + f);

const BODY = {};
for(const p of ALL) BODY[p] = strip(fs.readFileSync(p, "utf8"));

/* 손님이 받는 파일 — index.html 에 적힌 것만 */
const SHIP = new Set();
if(fs.existsSync("index.html")){
  const h = fs.readFileSync("index.html", "utf8");
  let m, re = /<script[^>]*src="\/([^"?]+)/g;
  /* ⚠️ index.html 은 **배포본**(dist/)을 가리킵니다 — 주석을 눈
     사본입니다. 여기서 보는 것은 **소스** 이라 머리를 뗵니다. */
  while((m = re.exec(h))) SHIP.add(m[1].replace(/^dist\//, ""));
}

/* ── 재서 "그냥 두기로" 한 자리 ──────────────────────────────────
   ⚠️⚠️ 여기에 적는 것은 **재 본 값과 까닭**입니다. 귀찮아서 적지
   마세요 — 적는 순간 그 덩이는 아무도 다시 안 봅니다. */
const KNOWN = {
  "js/pages/journey.js": {
    names: ["OpsGrid", "OpsPick", "OpsvcForInd"],
    why: "2026-10-18 운영 개편으로 PageOperation() 이 안 부릅니다. "
       + "재 보니 3.8KB(약 1KB gzip)뿐이라, 파일을 가르는 값이 더 "
       + "큽니다 — 이 저장소는 함수를 파일 사이로 옮기다 다섯 번 "
       + "통째로 삼켰습니다. 되살리기는 PageOperation() 한 줄입니다."
  },
  "js/pages/home.js": {
    names: ["HomePass", "HomeBanners", "HomeWhy",
            "HomeFit", "HomeRec", "HomeIndGuide", "homeDirectChips"],
    why: "2026-10-20 시안 1 로 양도양수가 가로 배너에서 진입 카드 "
       + "넷째 장이 되면서 PageMain() 이 안 부릅니다. 재 보니 32줄 · "
       + "1.4KB 뿐이고, 그 배너가 들고 있던 길 일곱은 전부 카드 안의 "
       + "대표 서비스 다섯과 푸터가 받습니다 (재서 확인했습니다). "
       + "되살리기는 PageMain() 에 HomePass()+ 한 줄입니다.\n"
       + "HomeBanners — 2026-10-22 시안으로 서비스 배너 둘이 메인에서 "
       + "내려왔습니다. 재 보니 HOME_BAN 8줄 + 함수 22줄 = 1,281바이트 "
       + "(gzip 686바이트)이고 .bban CSS 스물두 줄이 같이 있습니다. "
       + "그 배너가 가리킨 둘(/providers/interior · /providers/it)은 "
       + "전문관 카드의 대표 서비스에서 그대로 걸립니다 (재서 확인 — "
       + "메인 #view 안에 각각 1곳). ⚠️ 그 배너만 쓰던 사진 자리 "
       + "svc-interior · svc-it 은 **파일이 있는데 지금 안 나옵니다** "
       + "(photos.js 의 where 에 적어 두었습니다). 되살리기는 "
       + "PageMain() 에 HomeBanners()+ 한 줄 · check.js 의 want 에 "
       + "bban · build-pages.js 의 크롤러 본문 세 줄입니다.\n"
       + "⚠️⚠️ HomeWhy · HomeFit · HomeRec · HomeIndGuide · "
       + "homeDirectChips — 2026-10-26 에 사장님이 메인을 전면 리뉴얼 "
       + "직전 디자인(구간 일곱)으로 되돌리라고 하셔서 PageMain() 이 "
       + "안 부릅니다. ⚠️ 지시서가 신규 기능을 임의로 지우지 말라고 "
       + "적어서 함수 · CSS · 데이터를 한 줄도 안 지웠습니다 — "
       + "맞춤 서비스 찾기(HomeFit) · 추천 서비스(HomeRec) · 업종별 "
       + "체크리스트(HomeIndGuide)는 그 자리에 그대로 있고 메인에만 "
       + "안 나옵니다. 되살리기는 PageMain() 의 return 한 줄 + "
       + "check.js 의 want · need · build-pages.js 의 크롤러 본문 + "
       + "css/pages.css 맨 뒤 블록 둘(전면 리뉴얼 · 찍어 보고 고친 것) "
       + "입니다 — git show 2831322 로 꺼냅니다."
  },
  "js/pages/tools.js": {
    names: ["tlRel"],
    why: "2026-10-20 PART 9-2 로 같은 자리를 tlRelPick() 이 받습니다 "
       + "(보내기만 하던 것 → 그 자리에서 고르기). 24줄 · 1.1KB 이고 "
       + "같은 rel 데이터를 읽습니다 — 되살리기는 tlNext() 와 "
       + "PageToolVs() 두 줄입니다."
  }
};

const targets = process.argv.length > 2
  ? process.argv.slice(2)
  : ALL.filter(p => p.startsWith("js/") && SHIP.has(p));

let bad = 0;
for(const T of targets){
  if(!BODY[T]){ console.log("?? " + T + " — 그런 파일이 없습니다"); bad++; continue; }
  const defs = [];
  BODY[T].split("\n").forEach(function(ln){
    const m = /^function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(ln) || /^var\s+([A-Za-z_$][\w$]*)\s*=/.exec(ln);
    if(m) defs.push(m[1]);
  });
  const dead = [];
  for(const nm of defs){
    const re = new RegExp("\\b" + nm.replace(/\$/g, "\\$") + "\\b", "g");
    let used = 0;
    for(const p of ALL){
      const hits = (BODY[p].match(re) || []).length;
      /* 자기 파일에서는 선언 줄 하나를 뺍니다 */
      used += (p === T ? Math.max(0, hits - 1) : hits);
    }
    if(!used) dead.push(nm);
  }
  const k = KNOWN[T];
  const left = k ? dead.filter(n => k.names.indexOf(n) < 0) : dead;
  const kept = k ? dead.filter(n => k.names.indexOf(n) >= 0) : [];
  const mark = left.length ? "⚠️" : "✅";
  console.log(mark + " " + T + " — 최상위 " + defs.length + "개 · 아무 데서도 안 쓰임 " + dead.length + "개"
    + (left.length ? "\n     ⚠️ " + left.join(" · ") : "")
    + (kept.length ? "\n     (재서 그냥 둔 것 — " + kept.join(" · ") + ")" : ""));
  if(left.length) bad++;
}
if(bad){
  console.log("\n⚠️ 안 쓰는 덩이가 있습니다 — 지우지 말고 `*-retired.js` 로 옮기고");
  console.log("   index.html 에서 빼세요. 되살리기 두 줄을 그 파일 맨 위에 적습니다.");
  console.log("   옮긴 뒤 `node build-pages.js` 의 checkRetired() 가 살아 있는 쪽에서");
  console.log("   부르는 데가 없는지 봅니다.");
}

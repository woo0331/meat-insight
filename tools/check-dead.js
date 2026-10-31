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

/* ⚠️⚠️ **화면 속 onclick= 은 문자열이라 strip() 이 지웁니다.**
   이 저장소는 단추를 거의 전부 onclick="fn()" 로 답니다 — 그걸 안
   보면 **멀쩡히 돌고 있는 함수가 "안 쓰임" 으로** 나옵니다
   (2026-10-31 에 pwSellGo 가 실제로 그랬습니다). 그대로 믿고
   -retired.js 로 옮기면 /sell 의 칩 · 고르개 전부가 죽는데, 속성
   안이라 빌드도 전수 점검도 안 잡습니다 — **눌러 봐야** 압니다.
   그래서 **거는 자리의 속 글만** 따로 떠서 뒤에 붙입니다.
   ⚠️ 재 보니 이 저장소의 거는 자리 208곳이 전부 on…=" 꼴이라,
   여는 겹따옴표 다음부터 **다음 겹따옴표까지**가 그 속 글입니다
   (안쪽은 홑따옴표와 이어 붙이기뿐입니다). 다른 꼴을 쓰시면
   여기도 같이 고치세요. */
function handlers(s){
  const out = [];
  const re = /\bon[a-z]+\s*=\s*"/g;
  let m;
  while((m = re.exec(s))){
    const a = m.index + m[0].length;
    const b = s.indexOf('"', a);
    if(b < 0) continue;
    out.push(s.slice(a, b));
  }
  return out.join("\n");
}

const BODY = {};
for(const p of ALL){
  const raw = fs.readFileSync(p, "utf8");
  BODY[p] = strip(raw) + "\n" + handlers(raw);
}

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
  /* ⚠️⚠️ **2026-10-31 — 옛 두 줄을 걷어냈습니다.**
     js/pages/journey.js 는 **파일째 없어졌고**(인수인계 삭제),
     js/pages/home.js 의 일곱(HomePass · HomeBanners · HomeWhy ·
     HomeFit · HomeRec · HomeIndGuide · homeDirectChips)은 **덩이가
     지워져서** 이제 셀 것이 없습니다 — 그대로 두면 아무것도 안
     맞히는 줄이 둘 남고, 그러면 다음 사람이 "여기 적힌 것은 재 본
     것" 이라고 믿게 됩니다. 꺼내 보시려면
     git show 6d85a17:tools/check-dead.js 입니다. */
  "js/pages/home.js": {
    names: ["PW_HERO_CHIPS", "PW_CHIP_IC", "pwHero3", "pwHeroArt",
            "PwWays", "PwShop", "PwDevice", "PwBiz", "PwQuick"],
    why: "2026-10-29 · 10-30 두 지시서로 PHONEWAY 메인이 네 번 다시 "
       + "짜이면서 PageMain() 이 아홉을 안 부릅니다 — 히어로 쪽 넷"
       + "(PW_HERO_CHIPS · PW_CHIP_IC · pwHero3 · pwHeroArt)은 사장님이 "
       + "주신 투명 PNG 가 그 자리를 받았고, 구간 쪽 다섯(PwWays 판매 "
       + "두 방법 · PwShop 중고폰 갈래 · PwDevice 기기 선택 · PwBiz 옛 "
       + "사업 배너 넷 · PwQuick 바로가기 다섯)은 핵심 서비스 여섯 · "
       + "브랜드 여섯 · 안내 배너 셋이 받았습니다.\n"
       + "재 본 값 — 아홉 합쳐 291줄 · 18,958바이트(gzip 약 6,937).\n"
       + "⚠️ 그런데 **옮기지 않고 그냥 둡니다.** 이 아홉은 사장님 시안이 "
       + "올 때마다 들고 나는 자리이고(히어로만 2026-10-17 · 10-22 아침 · "
       + "10-22 저녁 · 10-25 로 네 번 뒤집혔습니다), 되살리기는 PageMain() "
       + "한 줄입니다 — 파일 사이로 옮기면 그 한 줄이 두 줄이 되고(그 "
       + "파일을 index.html 에 먼저 넣어야 합니다), 이 저장소는 함수를 "
       + "파일 사이로 옮기다 **일곱 번** 통째로 삼켰습니다.\n"
       + "⚠️⚠️ js/pages/home-retired.js 는 **없습니다** — 거기 있던 것이 "
       + "전부 인수인계 것이어서 같이 지웠습니다. 다시 만드시려면 "
       + "build-pages.js 의 checkRetired() 가 그 파일을 보고 있는 것을 "
       + "먼저 확인하세요(살아 있는 쪽에서 부르면 빌드가 멈춥니다).\n"
       + "⚠️ PW_HERO3 · PW_BIZ · PW_QUICK · PW_SELL_CARDS 는 이 아홉 "
       + "안에서만 불려서 여기 목록에 안 나옵니다 — 셈이 한 겹만 "
       + "봅니다. 아홉을 되살리시면 그것들도 같이 삽니다."
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

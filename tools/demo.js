/* ════════════════════════════════════════════════════════════════════
   시연 환경을 세웁니다 — `node tools/demo.js [포트]`

   ⚠️⚠️⚠️ **저장소를 한 글자도 안 건드립니다.** 2026-11-09 에 검사가
   돌며 심어 둔 씨앗이 커밋에 박혀 **없는 회사의 업체 화면**이 공개
   저장소로 올라간 사고가 있었습니다. 그래서 여기서는 `tar` 로 **사본**
   을 떠서 거기에만 씨앗을 심고 빌드합니다(`tools/shot-spec.js` 와 같은
   방식). 작업 폴더 · HEAD · 가지가 그대로입니다.

   ⚠️⚠️ **운영 DB 에 넣는 길이 없습니다.** 예시 자료는 `tools/demo/`
   안의 자바스크립트이고, 시연 서버가 **메모리에만** 들고 있습니다
   (`db/seed/*.sql` 과 다릅니다 — 그쪽은 사장님이 붙여 넣는 SQL 입니다).

   ⚠️ **한 번에 지우는 법** — `tools/demo.js` 와 `tools/demo/` 폴더를
   지우면 끝입니다. 화면 · 마이그레이션 · 검사에 섞인 줄이 없습니다.
   ════════════════════════════════════════════════════════════════════ */
var fs = require("fs"), path = require("path"), os = require("os"), cp = require("child_process");

var ROOT = path.join(__dirname, "..");
var MARK = "AM_DEMO_CHILD";
var PORT = Number(process.argv[2]) || Number(process.env.AM_DEMO_PORT) || 4180;
var OUT = process.env.AM_DEMO_DIR || "";

/* ── ① 사본을 뜹니다 (아이 프로세스로 다시 들어옵니다) ──────────── */
if(!process.env[MARK]){
  var dst = OUT || fs.mkdtempSync(path.join(os.tmpdir(), "golfdemo-"));
  fs.mkdirSync(dst, { recursive:true });
  console.log("저장소를 복사합니다 (원본은 건드리지 않습니다)");
  console.log("  → " + dst);
  var cmd = "cd " + JSON.stringify(ROOT) + " && tar -cf - " +
            "--exclude=./.git --exclude=./node_modules . | " +
            "( cd " + JSON.stringify(dst) + " && tar -xf - )";
  var r = cp.spawnSync("sh", ["-c", cmd], { stdio:"inherit" });
  if(r.status !== 0){ console.error("❌ 복사하지 못했습니다"); process.exit(1); }
  var e = Object.assign({}, process.env);
  e[MARK] = "1";
  e.AM_DEMO_PORT = String(PORT);
  var q = cp.spawnSync(process.execPath,
    [path.join(dst, "tools", "demo.js")].concat(process.argv.slice(2)),
    { stdio:"inherit", cwd:dst, env:e });
  process.exit(q.status === null ? 1 : q.status);
}

/* ══ 여기부터는 사본 안입니다 ═══════════════════════════════════════ */
var DATA = require("./demo/data.js");
var ROWS = require("./demo/rows.js");
var CHECK = require("./demo/check.js");
var SRV = require("./demo/server.js");

/* ── ② 예시 자료가 DB 가 받는 값인가 ────────────────────────────── */
var bad = CHECK.run();
if(bad.length){
  console.error("❌ 예시 자료가 DB 가 받는 값이 아닙니다 (" + bad.length + "건)");
  bad.forEach(function(x){ console.error("   · " + x); });
  process.exit(1);
}
console.log("✅ 예시 자료 검사 — 키 · 이름 · 번호 0건 실패");

/* ── ③ 예시 사진 ─────────────────────────────────────────────────
   ⚠️⚠️ **새 사진을 받아 오지 않습니다.** 저장소에 이미 있는 분류
   사진(`img/mock/`)뿐입니다 — 2026-11-04 에 상표를 확인하고 가린
   그 파일들입니다. 자리를 달리해 잘라 변화만 줍니다.
   ⚠️ ImageMagick 이 없으면 **원본을 그대로** 씁니다(깨진 그림을 내지
   않습니다 · 변화만 줄어듭니다). */
var IMG = path.join(os.tmpdir(), "golfdemo-img-" + process.pid);
fs.mkdirSync(IMG, { recursive:true });

var SRC = {
  lesson:"cat-lesson", range:"cat-range", fitting:"cat-fitting",
  market:"cat-market", booking:"cat-booking", travel:"cat-travel",
  used:"cat-used", community:"cat-community", matchup:"cat-matchup"
};
/* 중고는 장비 사진 셋을 돌려 씁니다 — 한 장만 쓰면 열여섯 칸이
   전부 같은 그림입니다 */
var USED_SRC = ["cat-used", "cat-market", "cat-fitting"];

function hasMagick(){
  try{ cp.execSync("command -v convert", { stdio:"ignore" }); return true; }
  catch(e){ return false; }
}
var MAGICK = hasMagick();

function keysNeeded(){
  var want = {};
  function eat(v){
    if(typeof v === "string"){
      var m = v.match(/\/demo-img\/([a-z]+-\d+)\.jpg/);
      if(m) want[m[1]] = 1;
      /* ⚠️⚠️ **경로 꼴을 박지 않습니다** — 처음엔 `/photo/` 가
         들어간 주소만 찾아서, 0081 의 `course/<uuid>/<이름>.jpg` 가
         **통째로 빠졌고** 부킹 카드 다섯 장이 깨진 그림으로
         찍혔습니다(찍어 보고 알았습니다). 끝의 이름만 봅니다. */
      var m2 = v.match(/\/([a-z]+-\d+)\.jpg$/);
      if(m2) want[m2[1]] = 1;
      var m3 = v.match(/^([a-z]+-\d+)$/);
      if(m3) want[m3[1]] = 1;
      return;
    }
    if(Array.isArray(v)) return v.forEach(eat);
    if(v && typeof v === "object") Object.keys(v).forEach(function(k){ eat(v[k]); });
  }
  /* ⚠️⚠️⚠️ **골프장 마스터도 훑습니다** (2026-11-13) — 안 훑었더니
     `booking-1`~`booking-9` · `range-1` 이 **한 장도 안 만들어져** 골프장
     카드 아홉 장이 **깨진 그림**으로 떴습니다(찍어 보고 알았습니다 ·
     0081 의 `course/<uuid>` 경로를 빠뜨렸던 그 자리의 되풀이).
     ⚠️ 자료 묶음을 더하는 날 **여기도 같이** — 빠지면 에러 없이
     빈 네모만 보입니다. */
  eat(DATA.PROVIDERS); eat(DATA.COURSES); eat(ROWS);
  return Object.keys(want);
}

function makePhotos(){
  var keys = keysNeeded();
  var made = 0, copied = 0;
  keys.forEach(function(k, idx){
    var pre = k.replace(/-\d+$/, "");
    var n = Number(k.split("-").pop());
    var base = pre === "used" ? USED_SRC[n % USED_SRC.length] : (SRC[pre] || "cat-booking");
    var src = path.join(ROOT2, "img", "mock", base + ".jpg");
    if(!fs.existsSync(src)) src = path.join(ROOT2, "img", "mock", "cat-booking.jpg");
    var dst = path.join(IMG, k + ".jpg");
    if(!MAGICK){ fs.copyFileSync(src, dst); copied++; return; }
    /* 자리를 달리해 자릅니다 — 같은 그림이 칸마다 반복되지 않게 */
    var z = [100, 84, 72, 92, 78][n % 5];
    var gx = ["center","north","northwest","northeast","south","southwest",
              "southeast","west","east"][(n + idx) % 9];
    try{
      cp.execFileSync("convert", [src,
        "-gravity", gx, "-crop", z + "%x" + z + "%+0+0", "+repage",
        "-resize", "1000x1000^", "-gravity", "center",
        "-extent", "1000x1000", "-quality", "82", dst], { stdio:"ignore" });
      made++;
    }catch(e){ fs.copyFileSync(src, dst); copied++; }
  });
  console.log("예시 사진 " + keys.length + "장 — 잘라 만든 것 " + made +
              " · 원본 그대로 " + copied +
              (MAGICK ? "" : " (ImageMagick 이 없어 원본을 씁니다)"));
}

/* ── ④ 씨앗을 심고 빌드합니다 (사본에만) ────────────────────────── */
var ROOT2 = __dirname.replace(/\/tools$/, "");
function plant(){
  fs.writeFileSync(path.join(ROOT2, "js", "data", "providers.generated.js"),
    "/* 시연용 예시 자료 — tools/demo.js 가 **사본에만** 써 둔 것입니다. */\n" +
    'window.AM_PROVIDERS_AT = "시연용 예시 자료";\n' +
    "window.AM_PROVIDERS = " + JSON.stringify(DATA.PROVIDERS, null, 2) + ";\n");
  fs.writeFileSync(path.join(ROOT2, "js", "data", "reviews.generated.js"),
    "/* 시연용 예시 자료 — tools/demo.js 가 **사본에만** 써 둔 것입니다. */\n" +
    'window.AM_REVIEWS_AT = "시연용 예시 자료";\n' +
    "window.AM_REVIEWS = " + JSON.stringify(DATA.REVIEWS, null, 2) + ";\n");
  /* ⚠️⚠️ 「골프장 정보」 탭(2026-11-13)은 **DB 를 안 부르고** 이 파일만
     읽습니다 — 안 심으면 그 탭이 「아직 등록된 골프장이 없습니다」로
     남고, 시연을 보시는 분은 **안 만든 것**으로 읽습니다. */
  fs.writeFileSync(path.join(ROOT2, "js", "data", "courses.generated.js"),
    "/* 시연용 예시 자료 — tools/demo.js 가 **사본에만** 써 둔 것입니다. */\n" +
    'window.AM_COURSES_AT = "시연용 예시 자료";\n' +
    "window.AM_COURSES = " + JSON.stringify(DATA.COURSES, null, 2) + ";\n");
}

(async function(){
  plant();
  makePhotos();
  var b = cp.spawnSync(process.execPath, [path.join(ROOT2, "build.js")],
                       { cwd:ROOT2, encoding:"utf8" });
  if(b.status !== 0){
    console.error("❌ 빌드하지 못했습니다\n" + (b.stdout || "") + (b.stderr || ""));
    process.exit(1);
  }
  console.log("화면을 찍었습니다 (사본)");

  var s = await SRV.serve({ root:ROOT2, imgDir:IMG, rows:ROWS, port:PORT });
  console.log("");
  console.log("────────────────────────────────────────────");
  console.log(" 시연 주소 — http://127.0.0.1:" + s.port);
  console.log(" ⚠️ 이 기계 안에서만 열립니다 (밖에서는 접속할 수 없습니다)");
  console.log(" ⚠️ 예약 · 문의 · 신청은 403 으로 막혀 실제로 접수되지 않습니다");
  console.log("────────────────────────────────────────────");
})();

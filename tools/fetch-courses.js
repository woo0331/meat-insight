/* ════════════════════════════════════════════════════════════════════
   공식 출처에서 **실제로 내려받습니다** — 골프장 · 연습장
   (데이터 수집 지시서 작업 1 · 2026-11-07)

   ⚠️⚠️⚠️ **우회하지 않습니다.** 로그인 · 승인 · 쿼터 · robots · 약관으로
   막히면 그 자리에서 멈추고 **까닭을 그대로** data/staging/blocked_sources.csv
   에 적습니다. 막힌 것을 "받은 것" 으로 적는 순간 그 뒤의 모든 숫자가
   거짓이 됩니다 (절대 규칙 1 · 5).

   ⚠️⚠️ **받을 주소는 data/sources.json 한 곳**입니다. 여기 없는 주소는
   한 글자도 안 받습니다 — 지시서가 "공식 원본 CSV/API 만" 이라고 적었고,
   도구가 주소를 지어내면 그 규칙이 장식이 됩니다.

   ⚠️ 원본은 **고치지 않습니다**. data/raw/<출처>/<받은시각>/ 에 그대로 두고
   SHA256 · HTTP 상태 · 원본 주소 · 파일 이름 · 받은 시각 · 라이선스 ·
   자료 기준일을 manifest 에 적습니다.

   돌리는 법
     node tools/fetch-courses.js            받습니다
     node tools/fetch-courses.js --dry-run  주소만 찍고 아무것도 안 받습니다
     node tools/fetch-courses.js --only=<id> 그 출처 하나만

   ⚠️ 이미 오늘 받은 출처는 건너뜁니다 (중단한 뒤 다시 돌려도 됩니다).
   ════════════════════════════════════════════════════════════════════ */
"use strict";
const fs    = require("fs");
const path  = require("path");
const https = require("https");
const crypto= require("crypto");
const { URL } = require("url");

const ROOT    = path.join(__dirname, "..");
const SRC     = path.join(ROOT, "data", "sources.json");
const RAW     = path.join(ROOT, "data", "raw");
const STAGE   = path.join(ROOT, "data", "staging");
const MANIFEST= path.join(STAGE, "source_manifest.csv");
const BLOCKED = path.join(STAGE, "blocked_sources.csv");

const ARG     = process.argv.slice(2);
const DRY     = ARG.indexOf("--dry-run") >= 0;
const ONLY    = (ARG.find(function(a){ return a.indexOf("--only=") === 0; }) || "").slice(7);

/* ⚠️ 쏟아붓지 않습니다 — 한 출처마다 한 번에 하나, 사이에 쉼을 둡니다.
   공공 포털은 요청이 몰리면 막습니다 (그러면 받는 것 자체가 안 됩니다). */
const GAP_MS   = 1200;
const TRIES    = 5;              /* 2 · 4 · 8 · 16초 */
const TIMEOUT  = 25000;

function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
function ymd(d){ return d.toISOString().slice(0, 10); }
function stamp(d){ return d.toISOString().replace(/[:.]/g, "-"); }

/* CSV 한 칸 — ⚠️ 따옴표 · 쉼표 · 줄바꿈이 섞여도 깨지지 않게 */
function csv(v){
  var s = (v === null || v === undefined) ? "" : String(v);
  return '"' + s.replace(/"/g, '""') + '"';
}
function appendCsv(file, head, row){
  if(!fs.existsSync(file)) fs.writeFileSync(file, head.join(",") + "\n", "utf8");
  fs.appendFileSync(file, row.map(csv).join(",") + "\n", "utf8");
}

/* 한 번 받아 봅니다 — ⚠️ 돌려주는 것은 **일어난 일 그대로**입니다
   (성공이면 body, 아니면 왜 안 됐는지). 꾸미지 않습니다.

   ⚠️⚠️⚠️ **node 의 https 를 직접 쓰지 않습니다.** 이 세션의 바깥 길은
   HTTPS 프록시를 지나는데 node 는 그 환경변수를 안 봅니다 — 그래서 처음
   돌렸을 때 "getaddrinfo ENOTFOUND" 가 찍혔고, 그건 **진짜 까닭이 아니라
   제 도구가 프록시를 안 탄 것**이었습니다. 막힌 까닭을 틀리게 적으면
   그 기록이 거짓이 되므로 curl 로 보냅니다 (프록시가 미리 설정돼 있습니다).
   ⚠️ TLS 검증을 끄지 않습니다 · 프록시를 비우지 않습니다. */
function get(url){
  return new Promise(function(done){
    var os = require("os");
    var tmp = fs.mkdtempSync(path.join(os.tmpdir(), "fetch-"));
    var bodyF = path.join(tmp, "body");
    var headF = path.join(tmp, "head");
    var cp = require("child_process").spawn("curl", [
      "-sS", "-L", "--max-redirs", "5",
      "--max-time", String(Math.round(TIMEOUT / 1000)),
      "-D", headF, "-o", bodyF,
      "-w", "%{http_code}",
      "-A", "golf-allinone-data-collector/1.0 (+https://www.storeway.co.kr)",
      "-H", "accept: */*",
      url
    ]);
    var out = "", err = "";
    cp.stdout.on("data", function(d){ out += d; });
    cp.stderr.on("data", function(d){ err += d; });
    cp.on("close", function(){
      var code = parseInt(String(out).trim(), 10) || 0;
      var body = fs.existsSync(bodyF) ? fs.readFileSync(bodyF) : Buffer.alloc(0);
      var head = fs.existsSync(headF) ? fs.readFileSync(headF, "utf8") : "";
      try{ fs.rmSync(tmp, { recursive:true, force:true }); }catch(e){}
      function hdr(n){
        var m = new RegExp("^" + n + ": *(.*)$", "im").exec(head);
        return m ? m[1].trim() : "";
      }
      var why = "";
      if(code === 0){
        /* curl 이 아예 못 붙은 경우 — 프록시 거절이면 그 말이 여기 있습니다 */
        why = String(err).replace(/\s+/g, " ").trim().slice(0, 200) || "연결하지 못했습니다";
      }else if(code < 200 || code >= 300){
        why = "HTTP " + code;
      }
      done({
        ok: code >= 200 && code < 300,
        code: code,
        type: hdr("content-type"),
        disp: hdr("content-disposition"),
        body: body,
        why: why
      });
    });
    cp.on("error", function(e){
      done({ ok:false, code:0, why:"curl 을 실행하지 못했습니다 — " + String(e && e.message || e) });
    });
  });
}

/* 재시도 — ⚠️ **4xx 는 다시 안 겁니다.** 거절은 기다린다고 바뀌지
   않습니다 (막힌 것을 막혔다고 적는 것이 이 도구의 일입니다).
   네트워크 오류와 5xx 만 지수 백오프로 다시 겁니다. */
async function fetchWithBackoff(url){
  var last = null;
  for(var i = 0; i < TRIES; i++){
    var r = await get(url);
    last = r;
    if(r.ok) return r;
    if(r.code >= 400 && r.code < 500) return r;
    if(i < TRIES - 1) await sleep(Math.pow(2, i + 1) * 1000);
  }
  return last;
}

/* content-disposition 에서 파일 이름 — ⚠️ 경로 조각(/ · ..)은 버립니다 */
function nameFrom(disp, url, type){
  var m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disp || "");
  var n = m ? decodeURIComponent(m[1]) : "";
  if(!n){
    try{ n = path.basename(new URL(url).pathname) || ""; }catch(e){ n = ""; }
  }
  n = n.replace(/[\\/]/g, "_").replace(/^\.+/, "");
  if(!n) n = "download";
  if(!/\.[A-Za-z0-9]{1,5}$/.test(n)){
    n += /json/i.test(type) ? ".json" : (/csv/i.test(type) ? ".csv" : ".bin");
  }
  return n;
}

/* 받은 것이 **자료인가 로그인 화면인가** — ⚠️ 포털은 막을 때도 200 을
   줍니다. 200 을 받았다고 자료를 받은 것이 아닙니다. */
function looksLikeData(type, buf){
  var head = buf.slice(0, 2048).toString("utf8");
  if(/json/i.test(type)) return { ok:true, why:"" };
  if(/csv|excel|sheet|octet-stream|zip/i.test(type)) return { ok:true, why:"" };
  if(/html/i.test(type)){
    if(/로그인|login|인증|자동등록방지|captcha/i.test(head)){
      return { ok:false, why:"HTML 로그인 · 인증 화면이 돌아왔습니다 (자료가 아닙니다)" };
    }
    return { ok:false, why:"HTML 이 돌아왔습니다 — 내려받기 주소가 아니라 안내 화면입니다" };
  }
  return { ok:true, why:"" };
}

async function one(s){
  var now = new Date();
  var day = ymd(now);
  var dir = path.join(RAW, s.id, stamp(now));
  var got = 0, skipped = 0;

  /* 오늘 이미 받았으면 건너뜁니다 (다시 돌려도 됩니다) */
  var mine = fs.existsSync(path.join(RAW, s.id)) ? fs.readdirSync(path.join(RAW, s.id)) : [];
  if(mine.some(function(d){ return d.slice(0, 10) === day; })){
    console.log("  · " + s.id + " — 오늘 이미 받았습니다 (건너뜁니다)");
    return { got:0, skipped:1 };
  }

  var urls = [];
  if(s.meta) urls.push({ what:"meta", url:s.meta });
  if(s.page) urls.push({ what:"page", url:s.page });

  for(var i = 0; i < urls.length; i++){
    var u = urls[i];
    if(DRY){ console.log("  (dry-run) " + s.id + " " + u.what + " ← " + u.url); continue; }
    var r = await fetchWithBackoff(u.url);
    await sleep(GAP_MS);

    if(!r.ok){
      appendCsv(BLOCKED,
        ["source_id","name","what","url","http_status","reason","tried_at"],
        [s.id, s.name, u.what, u.url, r.code, r.why, now.toISOString()]);
      console.log("  ❌ " + s.id + " " + u.what + " — " + r.why);
      continue;
    }
    var look = looksLikeData(r.type, r.body);
    if(!look.ok){
      appendCsv(BLOCKED,
        ["source_id","name","what","url","http_status","reason","tried_at"],
        [s.id, s.name, u.what, u.url, r.code, look.why, now.toISOString()]);
      console.log("  ⚠️ " + s.id + " " + u.what + " — " + look.why);
      continue;
    }

    fs.mkdirSync(dir, { recursive:true });
    var fname = nameFrom(r.disp, u.url, r.type);
    var full  = path.join(dir, fname);
    fs.writeFileSync(full, r.body);
    var sha = crypto.createHash("sha256").update(r.body).digest("hex");
    appendCsv(MANIFEST,
      ["source_id","name","kind","scope","what","url","http_status","content_type",
       "file","bytes","sha256","retrieved_at","license","data_as_of"],
      [s.id, s.name, s.kind, s.scope, u.what, u.url, r.code, r.type,
       path.relative(ROOT, full), r.body.length, sha, now.toISOString(),
       s.license, ""]);
    console.log("  ✅ " + s.id + " " + u.what + " — " + r.body.length + " bytes · " + fname);
    got++;
  }
  return { got:got, skipped:skipped };
}

(async function(){
  var cfg = JSON.parse(fs.readFileSync(SRC, "utf8"));
  fs.mkdirSync(STAGE, { recursive:true });
  fs.mkdirSync(RAW,   { recursive:true });

  var list = cfg.sources.filter(function(s){ return s.use; });
  if(ONLY) list = list.filter(function(s){ return s.id === ONLY; });

  console.log("── 공식 출처에서 받습니다" + (DRY ? "  (dry-run — 아무것도 안 받습니다)" : ""));
  console.log("   받을 출처 " + list.length + "개 · 꺼 둔 출처 " +
              cfg.sources.filter(function(s){ return !s.use; }).length + "개");

  /* 꺼 둔 출처도 **까닭과 함께** 남깁니다 — 왜 안 받았는지가 없으면
     다음 차수가 "빠뜨렸다" 고 읽고 몰래 받습니다. */
  cfg.sources.filter(function(s){ return !s.use; }).forEach(function(s){
    if(DRY) return;
    appendCsv(BLOCKED,
      ["source_id","name","what","url","http_status","reason","tried_at"],
      [s.id, s.name, "off", s.page, "", "받지 않음 — " + (s.why_off || s.license),
       new Date().toISOString()]);
  });

  var got = 0;
  for(var i = 0; i < list.length; i++){
    var r = await one(list[i]);
    got += r.got;
  }

  console.log("");
  console.log("── 받은 파일 " + got + "개");
  if(!DRY){
    console.log("   기록: " + path.relative(ROOT, MANIFEST));
    console.log("   막힌 것: " + path.relative(ROOT, BLOCKED));
  }
  /* ⚠️ 0건이어도 **성공으로 끝냅니다** — 막힌 것을 기록하는 것이
     이 도구의 일이고, 그것 자체는 고장이 아닙니다. 다만 아래 한 줄을
     반드시 찍어서 "받았다" 로 읽히지 않게 합니다. */
  if(got === 0) console.log("   ⚠️ **한 건도 못 받았습니다** — blocked_sources.csv 를 보세요.");
})();

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
function get(url, opt){
  opt = opt || {};
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
      "-H", "accept: */*"
    ].concat(opt.form !== undefined ? ["-X", "POST", "--data", opt.form] : []).concat([url]));
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
async function fetchWithBackoff(url, opt){
  var last = null;
  for(var i = 0; i < TRIES; i++){
    var r = await get(url, opt);
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
  /* ⚠️ 포털의 메타 JSON 은 **text/html 머리글로** 옵니다 — 머리글만 보면
     멀쩡한 자료를 "안내 화면" 으로 버립니다(2026-11-15 에 그렇게 여섯
     출처를 전부 버렸습니다). 몸통이 JSON 으로 읽히면 자료입니다. */
  if(/^\s*[\[{]/.test(head)){
    try{ JSON.parse(buf.toString("utf8")); return { ok:true, why:"", json:true }; }catch(e){}
  }
  if(/csv|excel|sheet|octet-stream|zip/i.test(type)) return { ok:true, why:"" };
  if(/html/i.test(type)){
    if(/로그인|login|인증|자동등록방지|captcha/i.test(head)){
      return { ok:false, why:"HTML 로그인 · 인증 화면이 돌아왔습니다 (자료가 아닙니다)" };
    }
    return { ok:false, why:"HTML 이 돌아왔습니다 — 내려받기 주소가 아니라 안내 화면입니다" };
  }
  return { ok:true, why:"" };
}

/* ── 공공데이터 포털 파일데이터 — 포털이 **누구에게나** 내주는 내려받기 길 ──
   (2026-11-15) 안내 화면(fileData.do)의 「다운로드」 단추가 하는 일을 그대로
   따라갑니다: ① 그 화면에서 자료 번호를 읽고 ② selectFileDataDownload.do
   로 첨부 번호를 받고 ③ check-limit.json 으로 **자동등록방지(캡차)를
   요구하는지** 묻고 ④ fileDownload.do 로 받습니다.
   ⚠️⚠️⚠️ **③에서 캡차를 요구하면 그 자리에서 멈춥니다** — 사람이 풀라고
   둔 자물쇠를 기계가 넘으면 우회입니다. 로그인 · 활용신청이 필요한
   자료(오픈 API)는 이 길을 타지 않습니다(sources.json 의 portal 칸이
   "datagokr-file" 인 출처만). */
function block(s, what, url, code, why, now){
  appendCsv(BLOCKED,
    ["source_id","name","what","url","http_status","reason","tried_at"],
    [s.id, s.name, what, url, code, why, now.toISOString()]);
  console.log("  ❌ " + s.id + " " + what + " — " + why);
}
function metaInfo(buf){
  try{
    var j = JSON.parse(buf.toString("utf8"));
    var alt = String(j.alternateName || "");
    var m = /_(\d{4})(\d{2})(\d{2})$/.exec(alt);
    return {
      license: (j.license && j.license.name) || "",
      modified: String(j.dateModified || ""),
      as_of: m ? (m[1] + "-" + m[2] + "-" + m[3]) : ""
    };
  }catch(e){ return { license:"", modified:"", as_of:"" }; }
}
/* zip 이면 풉니다 — ⚠️ 자료 CSV 는 그 폴더 바로 아래, 데이터 사전 ·
   코드북 같은 **곁 파일은 docs/ 아래**로(정제 도구가 곁 파일을 자료로
   읽지 않게). 글자판이 EUC-KR 이면 UTF-8 로 옮겨 적고 그 사실을 말합니다.
   ⚠️ 경로 조각(.. · /)은 버립니다. */
function unzipTo(zipFile, dir){
  var py = [
    "import zipfile,sys,os",
    "z=zipfile.ZipFile(sys.argv[1]); d=sys.argv[2]; out=[]",
    "for i in z.infolist():",
    "  if i.is_dir() or not i.file_size: continue",
    "  n=i.filename",
    "  if not (i.flag_bits & 0x800):",
    "    try: n=n.encode('cp437').decode('cp949')",
    "    except Exception: pass",
    "  base=os.path.basename(n).replace('..','_')",
    "  if base.lower()=='desktop.ini': continue",
    "  side=('표준산출물' in n) or not base.lower().endswith('.csv')",
    "  t=os.path.join(d,'docs') if side else d",
    "  os.makedirs(t,exist_ok=True)",
    "  b=z.read(i); enc='utf-8'",
    "  if base.lower().endswith('.csv'):",
    "    try: b.decode('utf-8-sig')",
    "    except UnicodeDecodeError: b=b.decode('cp949').encode('utf-8'); enc='cp949->utf-8'",
    "  open(os.path.join(t,base),'wb').write(b)",
    "  out.append(('docs/' if side else '')+base+'\\t'+enc)",
    "print('\\n'.join(out))"
  ].join("\n");
  var r = require("child_process").spawnSync("python3", ["-I", "-c", py, zipFile, dir], { encoding:"utf8" });
  if(r.status !== 0) throw new Error("zip 을 풀지 못했습니다 — " + String(r.stderr).slice(0, 200));
  return String(r.stdout).trim().split("\n").filter(Boolean);
}
async function portalFile(s, dir, now, meta){
  var BASE = "https://www.data.go.kr";
  var pg = await fetchWithBackoff(s.page);
  await sleep(GAP_MS);
  if(!pg.ok){ block(s, "page", s.page, pg.code, pg.why, now); return 0; }
  var html = pg.body.toString("utf8");
  var m = /fn_fileDataDown\('(\d+)',\s*'([^']+)',\s*'([^']*)',\s*'(\d+)'/.exec(html);
  if(!m){
    /* 원본이 포털이 아니라 **다른 기관 사이트에 연계**된 자료입니다
       (「바로가기」 단추 — fn_fileDataGoLink). 그 사이트는 따로 봐야 하고
       이용 조건도 다를 수 있어 여기서 따라가지 않습니다. */
    var why = /fn_fileDataGoLink\(/.test(html)
      ? "원본이 다른 기관 사이트에 연계돼 있습니다(바로가기) — 그 사이트의 이용 조건을 따로 확인해야 해 따라가지 않습니다"
      : "안내 화면에서 내려받기 단추를 못 찾았습니다 (화면이 바뀌었을 수 있습니다)";
    block(s, "page", s.page, pg.code, why, now); return 0;
  }

  var form = "publicDataDetailPk=" + encodeURIComponent(m[2]) + "&publicDataPk=" + m[1] +
             "&atchFileId=" + encodeURIComponent(m[3]) + "&fileDetailSn=" + m[4] + "&publicDataTyCode=PR0051";
  var u1 = BASE + "/tcs/dss/selectFileDataDownload.do";
  var a = await fetchWithBackoff(u1, { form:form });
  await sleep(GAP_MS);
  var j = null; try{ j = JSON.parse(a.body.toString("utf8")); }catch(e){}
  if(!a.ok || !j || j.status !== true || !j.atchFileId){
    block(s, "file", u1, a.code, "첨부 번호를 못 받았습니다 — " + (j && j.error ? j.error : (a.why || "응답을 못 읽음")), now); return 0;
  }
  var dataNm = (j.dataSetFileDetailInfo && j.dataSetFileDetailInfo.dataNm) || "";

  var u2 = BASE + "/cmm/cmm/check-limit.json";
  var c = await fetchWithBackoff(u2, { form:"atchFileId=" + encodeURIComponent(j.atchFileId) + "&fileDetailSn=" + j.fileDetailSn });
  await sleep(GAP_MS);
  var cj = null; try{ cj = JSON.parse(c.body.toString("utf8")); }catch(e){}
  if(c.code === 403 || !cj || cj.needCaptcha !== false){
    block(s, "file", u2, c.code, "자동등록방지(캡차)를 요구하거나 답을 못 읽었습니다 — 우회하지 않고 멈춥니다", now); return 0;
  }

  var u3 = BASE + "/cmm/cmm/fileDownload.do?atchFileId=" + encodeURIComponent(j.atchFileId) +
           "&fileDetailSn=" + j.fileDetailSn + "&dataNm=" + encodeURI(dataNm);
  var f = await fetchWithBackoff(u3);
  await sleep(GAP_MS);
  if(!f.ok){ block(s, "file", u3, f.code, f.why, now); return 0; }
  var look = looksLikeData(f.type, f.body);
  if(!look.ok){ block(s, "file", u3, f.code, look.why, now); return 0; }

  fs.mkdirSync(dir, { recursive:true });
  var fname = nameFrom(f.disp, u3, f.type);
  var full  = path.join(dir, fname);
  fs.writeFileSync(full, f.body);
  var sha = crypto.createHash("sha256").update(f.body).digest("hex");
  appendCsv(MANIFEST,
    ["source_id","name","kind","scope","what","url","http_status","content_type",
     "file","bytes","sha256","retrieved_at","license","data_as_of"],
    [s.id, s.name, s.kind, s.scope, "file", u3, f.code, f.type,
     path.relative(ROOT, full), f.body.length, sha, now.toISOString(),
     meta.license || s.license, meta.as_of]);
  console.log("  ✅ " + s.id + " file — " + f.body.length + " bytes · " + fname +
              (meta.as_of ? " · 기준일 " + meta.as_of : "") + (meta.license ? " · " + meta.license : ""));
  /* ⚠️ 원본은 고치지 않습니다 — EUC-KR CSV 면 원본을 original/ 로 옮겨 두고
     그 자리에 UTF-8 로 옮겨 적은 사본을 둡니다(정제 도구는 UTF-8 만 읽습니다).
     manifest 의 sha256 은 **원본**의 값입니다. */
  if(/\.csv$/i.test(fname)){
    var utf8ok = true;
    try{ new (require("util").TextDecoder)("utf-8", { fatal:true }).decode(f.body); }catch(e){ utf8ok = false; }
    if(!utf8ok){
      fs.mkdirSync(path.join(dir, "original"), { recursive:true });
      fs.renameSync(full, path.join(dir, "original", fname));
      var conv = require("child_process").spawnSync("python3", ["-I", "-c",
        "import sys;open(sys.argv[2],'wb').write(open(sys.argv[1],'rb').read().decode('cp949').encode('utf-8'))",
        path.join(dir, "original", fname), full], { encoding:"utf8" });
      if(conv.status !== 0) throw new Error("EUC-KR 을 옮겨 적지 못했습니다 — " + String(conv.stderr).slice(0, 200));
      console.log("     EUC-KR → UTF-8 사본 (원본은 original/ 에 그대로)");
    }
  }
  if(f.body.slice(0, 2).toString("latin1") === "PK"){
    unzipTo(full, dir).forEach(function(x){ console.log("     풀어 둠: " + x); });
  }
  return 1;
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

  /* ⚠️ 포털 파일데이터는 안내 화면을 자료로 저장하지 않습니다 —
     메타만 받아 두고 실제 파일은 portalFile() 이 받습니다. */
  if(s.portal === "datagokr-file") urls = urls.filter(function(u){ return u.what === "meta"; });
  var meta = { license:"", modified:"", as_of:"" };

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
    if(u.what === "meta") meta = metaInfo(r.body);
    console.log("  ✅ " + s.id + " " + u.what + " — " + r.body.length + " bytes · " + fname);
    got++;
  }
  if(s.portal === "datagokr-file" && !DRY) got += await portalFile(s, dir, now, meta);
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

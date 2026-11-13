/* ════════════════════════════════════════════════════════════════════
   시연 서버 — 정적 화면 + **가짜 PostgREST**

   ⚠️⚠️⚠️ **운영 DB 에 한 번도 닿지 않습니다.** `/api/session` 이
   돌려주는 `conf.url` 이 **이 서버 자신**이라, 화면이 평소처럼 부르는
   `conf.url + "/rest/v1/…"` 가 전부 여기로 옵니다. 그래서 화면 코드를
   한 줄도 안 고치고도 예시 자료가 그려집니다.
   ⚠️ 같은 출처라 `vercel.json` 의 CSP(`connect-src 'self'` ·
   `img-src 'self'`)도 그대로 지킵니다 — 운영과 **같은 헤더**를
   보냅니다(`tools/_serve.js` 가 그래야 한다고 적어 둔 그 자리).

   ⚠️⚠️ **쓰는 길은 전부 막습니다.** `POST /rest/v1/rpc/*` 는 403 과
   「시연 환경입니다 — 실제로 접수되지 않습니다」를 돌려줍니다. 예약 ·
   문의 · 신청 · 알림이 **한 건도 나가지 않습니다**.

   ⚠️ 모든 HTML 에 「시연용 · 예시 데이터」 띠를 끼웁니다 — 저장소의
   화면 파일은 한 글자도 안 고칩니다(이 서버를 끄면 띠도 사라집니다).
   ════════════════════════════════════════════════════════════════════ */
var fs = require("fs"), path = require("path"), http = require("http");

var TYPE = {
  ".html":"text/html;charset=utf-8", ".css":"text/css;charset=utf-8",
  ".js":"text/javascript;charset=utf-8", ".json":"application/json;charset=utf-8",
  ".svg":"image/svg+xml", ".png":"image/png", ".ico":"image/x-icon",
  ".xml":"application/xml;charset=utf-8", ".txt":"text/plain;charset=utf-8",
  ".jpg":"image/jpeg", ".jpeg":"image/jpeg",
  ".webp":"image/webp", ".avif":"image/avif"
};

/* ── PostgREST 흉내 ───────────────────────────────────────────────
   ⚠️⚠️ **거르는 일을 서버가 합니다** — 화면이 보낸 질의를 실제로
   풀어야 거르개 · 찾기 · 정렬 · 쪽이 **진짜로** 도는지 보실 수
   있습니다(줄 수만 돌려주면 거르개를 떼어도 똑같아 보입니다). */
function pairs(qs){
  var out = [];
  String(qs || "").split("&").forEach(function(p){
    if(!p) return;
    var i = p.indexOf("=");
    var k = i < 0 ? p : p.slice(0, i);
    var v = i < 0 ? "" : p.slice(i + 1);
    try{ k = decodeURIComponent(k.replace(/\+/g, " ")); }catch(e){}
    try{ v = decodeURIComponent(v.replace(/\+/g, " ")); }catch(e){}
    out.push([k, v]);
  });
  return out;
}

/* `in.(a,b)` · `(a.ilike.*x*,b.ilike.*x*)` 의 괄호 안을 **맨 바깥
   쉼표**로만 가릅니다 */
function splitTop(s){
  var out = [], depth = 0, cur = "";
  for(var i = 0; i < s.length; i++){
    var c = s[i];
    if(c === "(") depth++;
    if(c === ")") depth--;
    if(c === "," && depth === 0){ out.push(cur); cur = ""; continue; }
    cur += c;
  }
  if(cur !== "") out.push(cur);
  return out;
}

function unq(v){
  v = String(v).trim();
  if((v[0] === '"' && v[v.length - 1] === '"') ||
     (v[0] === "'" && v[v.length - 1] === "'")) v = v.slice(1, -1);
  return v;
}

function num(v){
  if(v === null || v === undefined || v === "") return null;
  var n = Number(v);
  return isNaN(n) ? null : n;
}

/* 한 칸에 한 조건 — `op.operand` */
function test(row, col, expr){
  var i = expr.indexOf(".");
  var op = i < 0 ? expr : expr.slice(0, i);
  var arg = i < 0 ? "" : expr.slice(i + 1);
  var v = row[col];

  if(op === "not"){ return !test(row, col, arg); }
  if(op === "is"){
    if(arg === "null") return v === null || v === undefined;
    if(arg === "true") return v === true;
    if(arg === "false") return v === false;
    return false;
  }
  if(op === "in"){
    var list = splitTop(arg.replace(/^\(|\)$/g, "")).map(unq);
    return list.indexOf(String(v)) >= 0;
  }
  if(op === "ilike" || op === "like"){
    if(v === null || v === undefined) return false;
    var re = arg.split("*").map(function(x){
      return x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }).join(".*");
    return new RegExp("^" + re + "$", op === "ilike" ? "i" : "").test(String(v));
  }
  if(op === "cs" || op === "ov"){
    var want = splitTop(arg.replace(/^\{|\}$/g, "")).map(unq);
    var have = Array.isArray(v) ? v.map(String) : [];
    return op === "cs"
      ? want.every(function(x){ return have.indexOf(x) >= 0; })
      : want.some(function(x){ return have.indexOf(x) >= 0; });
  }

  /* 견주는 연산 — ⚠️ null 과 견주면 **빠집니다**(SQL 과 같습니다).
     저장소가 「값을 안 올리신 자리는 그 조건으로 좁히면 빠집니다」를
     화면마다 적어 둔 그 동작입니다. */
  if(v === null || v === undefined) return false;
  var a = unq(arg), x = v, y = a;
  var nx = num(x), ny = num(y);
  if(nx !== null && ny !== null){ x = nx; y = ny; }
  else { x = String(x); y = String(y); }
  if(op === "eq")  return x === y;
  if(op === "neq") return x !== y;
  if(op === "gt")  return x >   y;
  if(op === "gte") return x >=  y;
  if(op === "lt")  return x <   y;
  if(op === "lte") return x <=  y;
  return true;
}

var RESERVED = { select:1, order:1, limit:1, offset:1, or:1, and:1 };

function query(rows, qs){
  var ps = pairs(qs);
  var out = rows.slice();

  ps.forEach(function(p){
    var k = p[0], v = p[1];
    if(RESERVED[k]) return;
    out = out.filter(function(r){ return test(r, k, v); });
  });

  /* `or=(a.ilike.*x*,b.ilike.*x*)` */
  ps.filter(function(p){ return p[0] === "or"; }).forEach(function(p){
    var parts = splitTop(String(p[1]).replace(/^\(|\)$/g, ""));
    out = out.filter(function(r){
      return parts.some(function(one){
        var i = one.indexOf(".");
        return test(r, one.slice(0, i), one.slice(i + 1));
      });
    });
  });

  /* 정렬 — ⚠️ Postgres 처럼 asc 는 **null 이 뒤**, desc 는 **null 이 앞** */
  var ord = (ps.filter(function(p){ return p[0] === "order"; })[0] || [])[1];
  if(ord){
    var keys = splitTop(ord).map(function(one){
      var bits = one.split(".");
      return { col: bits[0], desc: bits.indexOf("desc") >= 0 };
    });
    out.sort(function(a, b){
      for(var i = 0; i < keys.length; i++){
        var c = keys[i].col, d = keys[i].desc ? -1 : 1;
        var x = a[c], y = b[c];
        var xn = (x === null || x === undefined), yn = (y === null || y === undefined);
        if(xn && yn) continue;
        if(xn) return keys[i].desc ? -1 : 1;
        if(yn) return keys[i].desc ? 1 : -1;
        if(x === y) continue;
        return (x > y ? 1 : -1) * d;
      }
      return 0;
    });
  }

  var total = out.length;
  var off = Number((ps.filter(function(p){ return p[0] === "offset"; })[0] || [])[1] || 0);
  var lim = (ps.filter(function(p){ return p[0] === "limit"; })[0] || [])[1];
  out = out.slice(off, lim ? off + Number(lim) : undefined);

  /* 고르는 칸 */
  var sel = (ps.filter(function(p){ return p[0] === "select"; })[0] || [])[1];
  if(sel && sel !== "*"){
    var cols = splitTop(sel).map(function(c){ return c.trim(); });
    out = out.map(function(r){
      var o = {};
      cols.forEach(function(c){ o[c] = (c in r) ? r[c] : null; });
      return o;
    });
  }
  return { rows: out, total: total, from: off };
}

/* 날짜 × 지역 현황표 — ⚠️⚠️ **목록 보기 위에서 셉니다.** 따로 세면
   반드시 어긋납니다(0060 이 집계 보기를 목록 보기 위에 세운 그 까닭). */
function counts(src, kind){
  var m = {}, out = [];
  src.forEach(function(r){
    if(kind && r.kind !== kind) return;
    var k = r.region + "|" + r.play_at;
    if(!m[k]){ m[k] = { region:r.region, play_at:r.play_at, n:0 }; out.push(m[k]); }
    m[k].n++;
  });
  if(kind) out.forEach(function(r){ r.kind = kind; });
  return out;
}

/* ── 띠 ──────────────────────────────────────────────────────────── */
var FLAG =
  '<div class="dmflag" role="note">' +
    '<strong>시연용 · 예시 데이터</strong>' +
    '<span>실재하는 업체 · 프로 · 매물 · 예약이 아닙니다. ' +
    '모든 이름은 「(예시)」로 시작하고, 예약 · 문의 · 신청은 ' +
    '실제로 접수되지 않습니다.</span>' +
  '</div>';
var FLAG_CSS =
  '<style id="dmflag-css">' +
  ':root{--dmflag-h:34px}' +
  '.dmflag{position:fixed;inset:0 0 auto 0;z-index:400;' +
    'background:#7A2E2E;color:#fff;font-size:13px;line-height:1.3;' +
    'display:flex;gap:8px;align-items:center;justify-content:center;' +
    'padding:7px 14px;text-align:center;flex-wrap:wrap}' +
  '.dmflag strong{background:#fff;color:#7A2E2E;border-radius:4px;' +
    'padding:1px 7px;font-weight:700;white-space:nowrap}' +
  '.dmflag span{opacity:.95}' +
  'body{padding-top:var(--dmflag-h)}' +
  '.hd{top:var(--dmflag-h) !important}' +
  '@media(max-width:700px){:root{--dmflag-h:52px}.dmflag{font-size:12px}}' +
  '</style>';

function inject(html){
  var i = html.indexOf("<body");
  if(i < 0) return html;
  var j = html.indexOf(">", i);
  if(j < 0) return html;
  var head = html.indexOf("</head>");
  if(head >= 0) html = html.slice(0, head) + FLAG_CSS + html.slice(head);
  i = html.indexOf("<body"); j = html.indexOf(">", i);
  return html.slice(0, j + 1) + FLAG + html.slice(j + 1);
}

/* ── 서버 ─────────────────────────────────────────────────────────
   root   : 빌드한 화면이 있는 폴더 (저장소 **사본**)
   imgDir : 예시 사진 폴더
   rows   : 가짜 PostgREST 자료 */
function serve(opt){
  var ROOT = opt.root, IMG = opt.imgDir, ROWS = opt.rows;
  var vj = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"));
  var RULES = (vj.headers || []).map(function(h){
    var re;
    try{ re = new RegExp("^" + h.source + "$"); }
    catch(e){ re = { test:function(){ return false; } }; }
    return { re:re, list:h.headers || [] };
  });
  function headers(res, p){
    RULES.forEach(function(r){
      if(r.re.test(p)) r.list.forEach(function(h){ res.setHeader(h.key, h.value); });
    });
  }
  function json(res, code, obj, extra){
    res.setHeader("content-type", "application/json;charset=utf-8");
    res.setHeader("cache-control", "no-store");
    if(extra) Object.keys(extra).forEach(function(k){ res.setHeader(k, extra[k]); });
    res.writeHead(code);
    res.end(JSON.stringify(obj));
  }

  var srv = http.createServer(function(q, res){
    var full = q.url || "/";
    var qi = full.indexOf("?");
    var p = qi < 0 ? full : full.slice(0, qi);
    var qs = qi < 0 ? "" : full.slice(qi + 1);
    try{ p = decodeURIComponent(p); }catch(e){}
    var origin = "http://" + (q.headers.host || ("127.0.0.1:" + opt.port));

    /* ── 로그인 설정 — 이 서버 자신을 가리킵니다 ───────────────── */
    if(p === "/api/session"){
      return json(res, 200, { auth:true, signedIn:false,
        conf:{ url:origin, anonKey:"demo-anon-key-not-a-secret",
               pubBucket:"demo" } });
    }
    /* ⚠️ 소셜 공급자는 **하나도 안 켭니다** — 시연에서 누르면 밖으로
       나가는 자리입니다. 화면이 「준비 중」으로 세웁니다. */
    if(p === "/auth/v1/settings") return json(res, 200, { external:{} });

    /* ── 사진 올리는 자리의 준비 상태 · 붙은 사진 ────────────────── */
    if(p === "/api/upload"){
      var ps = pairs(qs);
      function one(k){
        var f = ps.filter(function(x){ return x[0] === k; })[0];
        return f ? f[1] : "";
      }
      var cqq = one("cqq"), lstq = one("lstq");
      if(cqq){
        return json(res, 200, { ok:true, photos:
          ROWS.v_cq_photo_public.filter(function(f){ return f.q_id === cqq; })
            .map(function(f){
              return { id:f.id, caption:f.caption || "",
                       url:origin + "/storage/v1/object/public/demo/" + f.path };
            }) });
      }
      if(lstq){
        return json(res, 200, { ok:true, photos:
          ROWS.v_listing_photo_public.filter(function(f){ return f.listing_id === lstq; })
            .map(function(f, i){
              return { id:"ph-" + i, caption:f.caption || "", ord:f.ord,
                       url:origin + "/storage/v1/object/public/demo/" + f.path };
            }) });
      }
      return json(res, 200, { ok:true, up:true,
        pvPhoto:true, pvDoc:true, cqPhoto:true, adImage:true,
        lstPhoto:true, tripPhoto:true });
    }

    /* ── 공개 버킷 사진 ─────────────────────────────────────────── */
    if(p.indexOf("/storage/v1/object/public/") === 0){
      var name = p.split("/").pop();
      var f = path.join(IMG, name);
      if(!fs.existsSync(f)){ res.writeHead(404); return res.end("no photo"); }
      res.setHeader("content-type", TYPE[path.extname(f)] || "image/jpeg");
      res.setHeader("cache-control", "no-store");
      res.writeHead(200);
      return res.end(fs.readFileSync(f));
    }
    if(p.indexOf("/demo-img/") === 0){
      var f2 = path.join(IMG, p.slice("/demo-img/".length));
      if(!fs.existsSync(f2)){ res.writeHead(404); return res.end("no photo"); }
      res.setHeader("content-type", TYPE[path.extname(f2)] || "image/jpeg");
      res.writeHead(200);
      return res.end(fs.readFileSync(f2));
    }

    /* ── 가짜 PostgREST ──────────────────────────────────────────── */
    if(p.indexOf("/rest/v1/") === 0){
      var what = p.slice("/rest/v1/".length);

      /* ⚠️⚠️⚠️ **쓰는 길은 전부 막습니다** — 시연에서 실제 예약 ·
         문의 · 신청 · 알림이 한 건도 나가지 않게 합니다. */
      if(q.method !== "GET" || what.indexOf("rpc/") === 0){
        return json(res, 403, {
          message:"시연 환경입니다 — 실제로 접수되지 않습니다. " +
                  "운영에서는 이 자리에서 접수됩니다.",
          code:"DEMO_READ_ONLY" });
      }

      var tbl = what;
      var src;
      if(tbl === "v_teetime_count") src = counts(ROWS.v_teetime_open, "booking");
      else if(tbl === "v_join_count") src = counts(ROWS.v_join_open, null);
      else src = ROWS[tbl];

      if(!src){
        /* ⚠️ 모르는 표는 **빈 줄**로 돌려줍니다 — 500 을 내면 화면이
           「못 읽었습니다」로 갈려서 0건과 섞입니다. */
        return json(res, 200, [], { "content-range":"*/0" });
      }
      var r2 = query(src, qs);
      var last = r2.from + r2.rows.length - 1;
      return json(res, 200, r2.rows, {
        "content-range": (r2.rows.length
          ? (r2.from + "-" + last) : "*") + "/" + r2.total });
    }

    /* ── 그 밖에는 빌드한 화면 ───────────────────────────────────── */
    var f3 = path.join(ROOT, p === "/" ? "index.html" : p);
    if(!fs.existsSync(f3) && fs.existsSync(f3 + ".html")) f3 = f3 + ".html";
    if(fs.existsSync(f3) && fs.statSync(f3).isDirectory())
      f3 = path.join(f3, "index.html");
    headers(res, p);
    if(!fs.existsSync(f3) || fs.statSync(f3).isDirectory()){
      var nf = path.join(ROOT, "404.html");
      res.setHeader("content-type", "text/html;charset=utf-8");
      res.writeHead(404);
      return res.end(fs.existsSync(nf)
        ? inject(fs.readFileSync(nf, "utf8")) : "404");
    }
    var ext = path.extname(f3);
    res.setHeader("content-type", TYPE[ext] || "application/octet-stream");
    res.writeHead(200);
    if(ext === ".html") return res.end(inject(fs.readFileSync(f3, "utf8")));
    res.end(fs.readFileSync(f3));
  });

  return new Promise(function(done){
    srv.listen(opt.port || 0, function(){
      done({ srv:srv, port:srv.address().port });
    });
  });
}

module.exports = { serve: serve, query: query, counts: counts, inject: inject };

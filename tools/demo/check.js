/* ════════════════════════════════════════════════════════════════════
   예시 자료가 **DB 가 받는 값인가** — 시연 서버가 켜질 때 먼저 봅니다.

   ⚠️⚠️⚠️ 이 저장소는 「가짜 자료가 DB 가 안 받는 값이었습니다」를
   **일곱 번** 밟았습니다(조인의 `ok` · 문의의 `kind:"service"` ·
   게시판의 `cm-review` · 중고의 `us-putter` · 마켓의 `ls-solo` ·
   여행의 `price` · 인력의 `jr-*`). 화면은 모르는 키를 **그대로 내는
   것이 맞으므로**, 틀린 자료를 넣으면 **멀쩡한 화면이 고장으로
   보입니다.** 그래서 눈으로 맞추지 않고 **세어서** 봅니다.
   ⚠️ 키 묶음은 `js/data/*.js` 와 **마이그레이션의 check** 에서 읽습니다
   — 여기에 글자로 적으면 키가 느는 날 두 곳이 어긋납니다.
   ════════════════════════════════════════════════════════════════════ */
var fs = require("fs"), path = require("path");
var ROOT = path.join(__dirname, "..", "..");

/* 저장소의 화면 자료를 빌려 돌립니다 — ⚠️ `window` 는 **그대로
   돌려놓습니다**(check-deal 이 `global.window` 를 덮어 빌드를 통째로
   깨뜨린 그 자리). */
function withWindow(fn){
  var had = Object.prototype.hasOwnProperty.call(global, "window");
  var old = global.window;
  global.window = global;
  try{ return fn(global); }
  finally{ if(had) global.window = old; else delete global.window; }
}

/* 마이그레이션에서 `check (<칸> in ('a','b'))` 를 읽습니다.
   ⚠️ **마지막 것이 이깁니다** — 0069 가 `alter table … add constraint`
   로 다시 걸었기 때문입니다(check-deal 이 밟은 그 자리). */
function checkIn(col){
  var dir = path.join(ROOT, "db", "migrations");
  var out = null;
  fs.readdirSync(dir).sort().forEach(function(f){
    var s = fs.readFileSync(path.join(dir, f), "utf8");
    /* 줄 주석을 떼고 봅니다 — 주석 속 글자를 참으로 읽은 자리가 셋입니다 */
    s = s.split("\n").map(function(l){
      var i = l.indexOf("--");
      return i < 0 ? l : l.slice(0, i);
    }).join("\n");
    var re = new RegExp(col + "\\s+in\\s*\\(([^)]*)\\)", "gi");
    var m;
    while((m = re.exec(s))){
      var vals = m[1].split(",").map(function(x){
        return x.trim().replace(/^'|'$/g, "");
      }).filter(Boolean);
      if(vals.length) out = vals;
    }
  });
  return out;
}

function run(){
  var bad = [];
  var rows = require("./rows.js");
  var demo = require("./data.js");

  withWindow(function(W){
    require(path.join(ROOT, "js/data/catalog.js"));
    require(path.join(ROOT, "js/data/regions.js"));
    require(path.join(ROOT, "js/data/deal.js"));
    require(path.join(ROOT, "js/data/lesson.js"));
    require(path.join(ROOT, "js/data/providers.js"));
    require(path.join(ROOT, "js/data/trip.js"));

    function set(arr, k){
      var o = {};
      if(!arr) return o;
      if(!Array.isArray(arr)) return arr;   /* 이미 { key: 이름 } 꼴 */
      arr.forEach(function(x){ o[k ? x[k] : x] = 1; });
      return o;
    }
    function need(where, val, ok, what){
      if(val === null || val === undefined || val === "") return;
      if(!ok[val]) bad.push(where + " " + what + "=" + val);
    }

    var REG = set(W.AM_REGIONS, "key");
    (W.AM_TRIP_REGIONS || []).forEach(function(r){ REG[r.key] = 1; });
    var SUB = {};
    (W.AM_CATS || []).forEach(function(c){
      W.amCatItems(c).forEach(function(s){ SUB[s.key] = 1; });
    });

    /* ① 업체 · 프로 */
    demo.PROVIDERS.forEach(function(p){
      (p.subs || []).forEach(function(k){ need(p.id, k, SUB, "sub"); });
      (p.regions || []).forEach(function(k){ need(p.id, k, REG, "region"); });
      (p.prices || []).forEach(function(x){ need(p.id, x.sub, SUB, "price.sub"); });
      (p.lesson_goals || []).forEach(function(k){
        need(p.id, k, set(W.AM_LESSON_GOAL, "key"), "goal"); });
      (p.range_opts || []).forEach(function(k){
        need(p.id, k, set(W.AM_RANGE_OPT, "key"), "range_opt"); });
      (p.fit_ways || []).forEach(function(k){
        need(p.id, k, set(W.AM_FIT_WAY, "key"), "fit_way"); });
      need(p.id, p.scale, W.AM_SCALE || {}, "scale");
      need(p.id, p.kind, set(W.AM_PV_KIND, "key"), "kind");
      (p.photos || []).forEach(function(x){
        if(!x || !x.url) bad.push(p.id + " photo.url 이 없습니다");
      });
    });

    /* ② 티타임 */
    var TEEK = checkIn("kind") ? set(checkIn("kind")) : set(W.AM_TEE_KIND, "key");
    rows.v_teetime_open.forEach(function(r){
      need(r.id, r.kind, set(W.AM_TEE_KIND, "key"), "tee.kind");
      need(r.id, r.region, REG, "tee.region");
      if(!r.provider_name) bad.push(r.id + " tee.provider_name 이 비었습니다");
      /* ⚠️⚠️ 0081 의 `course_photo_ck` 와 **같은 꼴**이어야 합니다 —
         비어 있는 것은 괜찮습니다(아이콘 타일로 돌아갑니다). */
      if(r.photo && !/^course\/[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,80}$/.test(r.photo))
        bad.push(r.id + " tee.photo 꼴이 0081 의 check 와 다릅니다 — " + r.photo);
    });

    /* ②-2 골프장 마스터 (2026-11-13)
       ⚠️⚠️⚠️ **이름이 티타임의 `course` 와 맞아야** 합니다 — 「골프장
       정보」 탭과 「예약 가능한 티타임」 탭이 같은 골프장을 말해야
       하기 때문입니다. 안 맞으면 시연을 보시는 분이 "이 골프장은 왜
       자리가 없지" 로 읽습니다.
       ⚠️⚠️ **좌표는 한 줄도 없어야** 합니다 (0066 — 확인 전에는 비웁니다).
       ⚠️ 폐업 · 연습장이 **섞여 있어야** 합니다 — 그 자리가 화면에
       어떻게 보이는지도 보셔야 합니다(다 채우면 그 갈래를 못 봅니다). */
    var CS = demo.COURSES || [];
    if(!CS.length) bad.push("골프장 마스터가 0곳입니다 (골프장 정보 탭이 빕니다)");
    var csName = {};
    CS.forEach(function(c){
      need(c.id, c.kind, { golf:1, range:1 }, "course.kind");
      need(c.id, c.region, REG, "course.region");
      need(c.id, c.state, { open:1, closed:1 }, "course.state");
      if(String(c.name || "").indexOf("(예시)") !== 0)
        bad.push(c.id + " 골프장 이름에 (예시) 가 없습니다");
      if(!c.slug) bad.push(c.id + " slug 가 없습니다 (주소가 안 생깁니다)");
      if(c.lat || c.lng)
        bad.push(c.id + " 좌표가 들어 있습니다 — 0066 은 확인 전에는 비웁니다");
      if(c.site_url && !/^https?:\/\//.test(String(c.site_url)))
        bad.push(c.id + " site_url 이 http(s) 로 시작하지 않습니다");
      if(!String(c.addr || c.addr_road || "").trim())
        bad.push(c.id + " 주소가 없습니다");
      csName[String(c.name)] = 1;
    });
    if(!CS.some(function(c){ return c.state === "closed"; }))
      bad.push("폐업한 골프장이 한 곳도 없습니다 (그 자리를 못 보십니다)");
    if(!CS.some(function(c){ return c.kind === "range"; }))
      bad.push("연습장이 한 곳도 없습니다 (부킹 탭에서 빠지는지 못 보십니다)");
    if(!CS.some(function(c){ return !c.photo_url; }))
      bad.push("사진 없는 골프장이 한 곳도 없습니다 (아이콘 타일을 못 보십니다)");
    /* ⚠️⚠️ 티타임의 골프장이 마스터에 **있는지** — 코스 이름이 붙은 줄
       (「… 신코스」)은 앞부분이 맞으면 됩니다(0066 의 트리거도 이름이
       정확히 같을 때만 잇고, 못 찾으면 null 입니다). */
    rows.v_teetime_open.forEach(function(r){
      var nm = String(r.course || "");
      if(!nm) return;
      var hit = Object.keys(csName).some(function(k){ return nm.indexOf(k) === 0; });
      if(!hit) bad.push("tee " + r.id + " 골프장이 마스터에 없습니다 — " + nm);
    });

    /* ③ 조인 */
    rows.v_join_open.forEach(function(r){
      need(r.id, r.region, REG, "join.region");
      need(r.id, r.level, set(W.AM_JOIN_LEVEL, "key"), "join.level");
    });

    /* ④ 중고 */
    var LST_ST = set(W.AM_LST_ST, "key");
    rows.v_listing_open.forEach(function(r){
      need(r.id, r.sub, SUB, "lst.sub");
      need(r.id, r.region, REG, "lst.region");
      need(r.id, r.cond, set(W.AM_LST_COND, "key"), "lst.cond");
      need(r.id, r.flex, set(W.AM_LST_FLEX, "key"), "lst.flex");
      need(r.id, r.hand, set(W.AM_LST_HAND, "key"), "lst.hand");
      need(r.id, r.state, LST_ST, "lst.state");
      if(r.brand && (W.AM_LST_BRAND || []).indexOf(r.brand) < 0)
        bad.push(r.id + " lst.brand=" + r.brand);
      if(r.price === null || r.price === undefined)
        bad.push(r.id + " lst.price 가 비었습니다 (0056 은 반드시 받습니다)");
      /* ⚠️ 연락처를 **한 글자도 안 넣습니다** — 지어낸 번호를 넣으면
         엉뚱한 분께 전화가 갑니다(그 칸은 공개 보기에 아예 없습니다). */
      if(r.contact) bad.push(r.id + " lst.contact 가 들어 있습니다");
    });

    /* ⑤ 여행 */
    /* ⚠️⚠️⚠️ **`dest` 는 글자가 아니라 키입니다** — DB 는 자유
       글자를 받지만 화면은 `AM_TRIP_REGIONS` · `AM_REGIONS` 에서
       이름을 찾습니다. 처음에 「일본 후쿠오카」로 적었다가 카드마다
       **「목적지 미확인」**이 찍혔습니다(화면은 맞고 자료가 틀렸습니다 ·
       이 저장소가 여덟 번 밟은 그 자리). `depart_kind` 도 같습니다. */
    var DEST = {};
    (W.AM_TRIP_REGIONS || []).forEach(function(r){ DEST[r.key] = 1; });
    (W.AM_REGIONS || []).forEach(function(r){ DEST[r.key] = 1; });
    rows.v_trip_open.forEach(function(r){
      need(r.id, r.scope, { home:1, abroad:1 }, "trip.scope");
      if(!r.dest) bad.push(r.id + " trip.dest 가 비었습니다");
      need(r.id, r.dest, DEST, "trip.dest");
      need(r.id, r.depart_kind, set(W.AM_TRIP_DEPART, "key"), "trip.depart_kind");
    });

    /* ⑥ 인력 */
    rows.v_job_open.forEach(function(r){
      need(r.id, r.kind, set(W.AM_JOB_KIND, "key"), "job.kind");
      need(r.id, r.sub, SUB, "job.sub");
      need(r.id, r.region, REG, "job.region");
      need(r.id, r.role, set(W.AM_JOB_ROLE, "key"), "job.role");
      need(r.id, r.emp_type, set(W.AM_JOB_EMP, "key"), "job.emp_type");
      need(r.id, r.pay_type, set(W.AM_JOB_PAY, "key"), "job.pay_type");
    });

    /* ⑦ 게시판 */
    rows.v_cq_public.forEach(function(r){
      need(r.id, r.cat, SUB, "cq.cat");
    });

    /* ⑧ 구합니다 */
    var WCAT = set(W.amWantCats ? W.amWantCats() : [], "key");
    rows.v_wanted_open.forEach(function(r){
      need(r.id, r.cat, WCAT, "want.cat");
      need(r.id, r.sub, SUB, "want.sub");
      need(r.id, r.region, REG, "want.region");
    });

    /* ⑨ 「(예시)」가 빠진 상호 · 제목이 없는가 — 실재 업체로 읽히면
       표시 · 광고의 공정화에 관한 법률 제3조입니다. */
    demo.PROVIDERS.forEach(function(p){
      if(p.name.indexOf("(예시)") !== 0) bad.push(p.id + " 상호에 (예시) 가 없습니다");
    });
    ["v_listing_open", "v_trip_open", "v_job_open", "v_cq_public",
     "v_wanted_open"].forEach(function(t){
      rows[t].forEach(function(r){
        if(String(r.title || "").indexOf("(예시)") < 0)
          bad.push(t + " " + r.id + " 제목에 (예시) 가 없습니다");
      });
    });
    rows.v_teetime_open.forEach(function(r){
      if(String(r.course || "").indexOf("(예시)") < 0)
        bad.push("tee " + r.id + " 골프장 이름에 (예시) 가 없습니다");
    });
    rows.v_join_open.forEach(function(r){
      if(String(r.course || "").indexOf("(예시)") < 0)
        bad.push("join " + r.id + " 골프장 이름에 (예시) 가 없습니다");
    });

    /* ⑩ 전화번호 꼴이 섞이지 않았는가 (지어낸 번호는 엉뚱한 분께
       전화가 갑니다) */
    /* ⚠️⚠️ **uuid 를 전화번호로 읽지 않습니다** — 첫 판이
       `000-4000-8000`(제가 지은 id) 을 잡았습니다. 값마다 돌면서
       **uuid 꼴인 값은 건너뜁니다**(검사가 멀송한 것을 고장이라고
       한 자리를 또 밟을 뻔했습니다). */
    var TEL_RE = /0\d{1,2}-\d{3,4}-\d{4}/;
    var UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    (function walk(v, where){
      if(typeof v === "string"){
        /* ⚠️ uuid 는 **문자열 안에 끼어 있기도** 합니다
           (`lst/<uuid>/photo/...`) — 떼어 내고 봅니다. */
        var m = v.replace(UUID_RE, "").match(TEL_RE);
        if(m) bad.push(where + " 에 전화번호 꼴이 들어 있습니다 — " + m[0]);
        return;
      }
      if(Array.isArray(v)){ v.forEach(function(x, i){ walk(x, where + "[" + i + "]"); }); return; }
      if(v && typeof v === "object"){
        Object.keys(v).forEach(function(k){ walk(v[k], where + "." + k); });
      }
    })({ providers: demo.PROVIDERS, rows: rows }, "예시자료");
  });

  return bad;
}

module.exports = { run: run };

if(require.main === module){
  var bad = run();
  if(bad.length){
    console.error("❌ 예시 자료가 DB 가 받는 값이 아닙니다 (" + bad.length + "건)");
    bad.forEach(function(x){ console.error("   · " + x); });
    process.exit(1);
  }
  console.log("✅ 예시 자료의 키 · 이름 · 번호를 전부 맞춰 봤습니다 — 0건 실패");
}

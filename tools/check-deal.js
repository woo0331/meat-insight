#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   화면의 상태 말과 **DB 의 상태 키**가 같은가

   ⚠️⚠️ **같은 규칙을 두 곳에 적은 자리입니다.** 상태 키는 DB 의
   `deal_state` enum 과 `quote.state` 의 check 에 있고, 사람 말은
   `js/data/deal.js` 에 있습니다. 한쪽만 고치면 **에러 없이 조용히**
   어긋납니다 —
     · DB 에만 있으면 화면이 그 상태를 **키 그대로** 찍습니다
       (`fee_wait` 가 손님 화면에 나갑니다)
     · 화면에만 있으면 DB 가 **거절**합니다. 단추는 멀쩡히 보입니다.

   ⚠️ 보는 것은 **키**뿐입니다. 한글 이름은 안 봅니다 — 그건 말이고,
   디자인 · 문구가 바뀌는 날 멀쩡한 저장소를 실패로 잡습니다 (작업
   기억의 "그날의 색 · 이름 · 개수를 박지 마세요").

   ⚠️⚠️ **잰 것이 0개면 실패입니다.** 정규식이 안 맞아 아무것도 못
   읽었는데 "다른 것 없음" 으로 초록이 되는 자리입니다 — 주소 검사가
   실제로 그렇게 아무것도 안 재고 통과했습니다.

   돌리기   node tools/check-deal.js        (build.js 가 같이 부릅니다)
   ⚠️ 되돌려 보기   node tools/check-deal.js --prove
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");

/* ⚠️⚠️ 문자열 안의 정규식은 쓰지 않습니다 — 이 파일은 본문이 코드라
   괜찮지만, 되도록 indexOf 로 자릅니다 (백슬래시 두 겹 사고를 네 번
   겪은 자리입니다). */
function readAll(keepComments){
  const dir = path.join(ROOT, "db", "migrations");
  const L = fs.readdirSync(dir)
    .filter(f => /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f))
    .sort()
    .map(f => fs.readFileSync(path.join(dir, f), "utf8"));
  /* ⚠️ `keepComments` 는 **되돌려 보기만** 씁니다 — 주석을 안 떼면
     무엇이 깨지는지 보여 주려고 둔 갈래입니다. */
  return (keepComments ? L : L.map(stripSqlComments)).join("\n");
}

/* ⚠️⚠️⚠️ **`--` 줄 주석을 떼고 셉니다** (2026-11-06). 안 떼면 주석 속
   닫는 괄호를 enum 의 끝으로 읽습니다 — 0026 의
     'cat_top',     -- 분류 화면 맨 위 (cat_key 가 어느 분류인지 말합니다)
   에서 그 `)` 가 먼저 잡혀 **그 뒤의 `region` 을 못 봤습니다.** 그래서
   "화면에 region 이 있는데 DB 에 없습니다" 로 **멀쩡한 코드를 실패로**
   잡았습니다 (`check-doors` 가 거절 문구 안의 이름을 부르는 자리로 세던
   것과 같은 꼴입니다 — 작업 기억의 "검사가 멀쩡한 것을 고장이라고 한
   자리").
   ⚠️ 홑따옴표 안은 **안 건드립니다** — enum 값과 check 값이 거기 있습니다
   (따옴표 안의 `--` 는 이 저장소에 없습니다). */
function stripSqlComments(sql){
  const out = [];
  sql.split("\n").forEach(function(line){
    let q = false, cut = -1;
    for(let i = 0; i < line.length; i++){
      const ch = line[i];
      if(ch === "'"){ q = !q; continue; }
      if(!q && ch === "-" && line[i + 1] === "-"){ cut = i; break; }
    }
    out.push(cut < 0 ? line : line.slice(0, cut));
  });
  return out.join("\n");
}

/* ── DB 쪽 ──────────────────────────────────────────────────────── */
/* `create type deal_state as enum ( 'new', 'check', … )` 안의 홑따옴표
   낱말만 꺼냅니다. ⚠️ 주석(--)이 섞여 있어서 괄호 안을 통째로 읽고
   따옴표만 봅니다. */
function enumKeys(sql, name){
  /* ⚠️⚠️ **빈칸 수를 박아 두지 않습니다.** 0001 이 `create type fee_vat
     ␣␣as enum` 처럼 칸을 맞춰 적어 두어서, 한 칸으로 찾으면 **아무것도
     못 읽고** "검사가 틀렸습니다" 로 떨어집니다 (실제로 그렇게
     떨어졌습니다 — 값이 아니라 검사가 틀린 자리입니다). */
  const at = sql.indexOf("create type " + name + " ");
  if(at < 0) return null;
  const en = sql.indexOf("as enum", at);
  if(en < 0) return null;
  const open = sql.indexOf("(", en);
  const close = sql.indexOf(")", open);
  if(open < 0 || close < 0) return null;
  const out = quoted(sql.slice(open + 1, close));
  /* ⚠️⚠️⚠️ **`alter type … add value` 로 늘어난 값도 같이 셉니다**
     (2026-11-06). 이 줄이 없어서 0015 가 더한 `mrr_rate` · `retain` ·
     `kept` 셋을 **아무도 못 보고 있었습니다** — DB 에는 있는데 화면에
     말이 없으니 그 갈래를 쓰는 날 영문 키가 그대로 찍히는데, 검사는
     영원히 초록이었습니다. 0015 의 머리말은 "앞의 create type 과 뒤의
     alter type 을 **합쳐서** 맞춰 본다" 고 적어 두었는데, 도구를 다시
     쓰면서 그 합치는 줄이 빠졌습니다 (주석이 코드와 다른 자리의 또
     한 판입니다).
     ⚠️ `if not exists` 가 붙어 있어도 값은 그대로 늘어납니다. */
  let i = 0;
  const head = "alter type " + name + " ";
  for(;;){
    const at2 = sql.indexOf(head, i);
    if(at2 < 0) break;
    const nl = sql.indexOf("\n", at2);
    const line = sql.slice(at2, nl < 0 ? sql.length : nl);
    const av = line.indexOf("add value");
    if(av >= 0){
      /* ⚠️⚠️ `after 'sub'` 의 따옴표도 그 줄에 있습니다 — 그건 **자리**
         이지 새 값이 아닙니다. 지금은 `after` 가 가리키는 값이 늘 앞에
         있어서 섞어도 답이 같지만, **답이 같은 것과 맞는 것은 다릅니다**
         (식을 바꿔도 답이 같아 아무것도 안 잡는 자리입니다). 그래서
         `add value` 뒤 · `after` 앞만 봅니다. */
      const afr = line.indexOf(" after ", av);
      const seg = line.slice(av, afr < 0 ? line.length : afr);
      quoted(seg).forEach(function(v){ if(out.indexOf(v) < 0) out.push(v); });
    }
    i = at2 + head.length;
  }
  return out;
}
/* `state text not null default 'open' check (state in ('open',…))` */
/* ⚠️⚠️ **같은 칸 이름이 여러 표에 있습니다.** `state` 는 quote 에도
   appointment 에도 있습니다 — 그냥 처음 것을 읽으면 **늘 quote 것**만
   보고 appointment 쪽은 아무것도 안 잽니다 (검사는 초록인데 잰 것이
   없는, 이 저장소가 여러 번 겪은 꼴입니다).
   ⚠️ 그래서 **몇 번째**가 아니라 **어느 표**인지로 찾습니다 — 번째로
   세면 표를 하나 끼워 넣는 날 조용히 어긋납니다. */
function checkKeys(sql, col, table){
  let from = 0;
  if(table){
    from = sql.indexOf("create table if not exists " + table + " (");
    if(from < 0) from = sql.indexOf("create table " + table + " (");
    if(from < 0) return null;
  }
  const at = sql.indexOf("check (" + col + " in (", from);
  if(at < 0) return null;
  const open = sql.indexOf("(", at + 7);
  const close = sql.indexOf(")", open);
  if(open < 0 || close < 0) return null;
  return quoted(sql.slice(open + 1, close));
}
function quoted(s){
  const out = [];
  let i = 0;
  while(i < s.length){
    const a = s.indexOf("'", i);
    if(a < 0) break;
    const b = s.indexOf("'", a + 1);
    if(b < 0) break;
    const w = s.slice(a + 1, b).trim();
    if(w) out.push(w);
    i = b + 1;
  }
  return out;
}

/* ── 화면 쪽 ────────────────────────────────────────────────────── */
/* ⚠️ 파일을 **실제로 돌려서** 읽습니다. 정규식으로 긁으면 주석에 적힌
   키까지 집습니다 (그게 바로 "검사가 틀렸습니다" 자리입니다). */
function screenKeys(file){
  const W = {};
  /* won() 을 부르는 자리가 있어서 흉내를 냅니다 — 없으면 터집니다 */
  W.won = n => String(n);
  /* ⚠️⚠️ **빌드의 window 를 덮어쓰지 않습니다.** build.js 가 자기
     window 에 esc · icon 을 담아 두고 화면을 찍는데, 여기서 그 자리를
     갈아 치우면 **빌드가 통째로 터집니다** (`icon is not a function`).
     실제로 그렇게 터졌습니다 — 검사가 멀쩡한 빌드를 깨뜨린 자리입니다.
     빌려 쓰고 **그대로 돌려놓습니다.** */
  const had = Object.prototype.hasOwnProperty.call(global, "window");
  const was = global.window;
  global.window = W;
  try{
    delete require.cache[require.resolve(path.join(ROOT, file))];
    require(path.join(ROOT, file));
  }finally{
    if(had) global.window = was; else delete global.window;
  }
  return W;
}

function run(opt){
  const bad = [];
  let measured = 0;
  const sql = (opt && opt.sql) || readAll();
  const W = screenKeys("js/data/deal.js");

  const want = [
    ["상담 상태 (deal_state)",  enumKeys(sql, "deal_state"),       W.AM_DEAL_ST],
    ["견적 상태 (quote.state)", checkKeys(sql, "state", "quote"),  W.AM_QUOTE_ST],
    ["부가세 (fee_vat)",        enumKeys(sql, "fee_vat"),          W.AM_VAT],
    /* ⚠️ 0034 의 appointment — 만나는 방법과 일정 상태도 같은 함정입니다
       (DB 에만 있으면 영문 키가 찍히고, 화면에만 있으면 DB 가 거절). */
    ["만나는 방법 (appointment.kind)",
     checkKeys(sql, "kind", "appointment"),  W.AM_APPT_KIND],
    ["일정 상태 (appointment.state)",
     checkKeys(sql, "state", "appointment"), W.AM_APPT_ST],
    /* 수수료 — ⚠️ 셋 다 enum 입니다 (0001). 한쪽만 늘리면 업체 화면에
       영문 키가 찍히거나, 화면이 내는 값을 DB 가 거절합니다. */
    ["수수료 종류 (fee_type)",   enumKeys(sql, "fee_type"),  W.AM_FEE_TYPE],
    ["확정 시점 (fee_when)",     enumKeys(sql, "fee_when"),  W.AM_FEE_WHEN],
    ["지급 주기 (fee_cycle)",    enumKeys(sql, "fee_cycle"), W.AM_FEE_CYCLE],
    /* ⚠️ 0045 의 고객센터 문의 — 갈래와 상태가 **둘 다** check 입니다.
       ⚠️⚠️ 이 말은 **두 화면**이 씁니다 (운영자의 문의함 · 손님의
       "내가 보낸 문의"). 그래서 어긋나면 한쪽에만 영문 키가 찍혀
       **다른 쪽만 보는 눈에는 멀쩡해 보입니다.** */
    ["문의 갈래 (inquiry.kind)",
     checkKeys(sql, "kind", "inquiry"),  W.AM_INQ_KIND],
    ["문의 상태 (inquiry.state)",
     checkKeys(sql, "state", "inquiry"), W.AM_INQ_ST],
    /* ⚠️⚠️⚠️ 0026 의 광고 — **이 둘을 아무도 안 보고 있었습니다**
       (2026-11-06). `js/adminbiz.js` 가 상태 다섯(`draft` · `live` ·
       `paused` · `done` · `void`)을 들고 있었는데 enum 은 넷(`draft` ·
       `live` · `done` · `stopped`)입니다 — 그래서 `paused` · `void`
       단추는 **누르면 DB 가 거절**했고, 정작 **멈추는 값(`stopped`)은
       단추가 없어서** 집행 중인 광고를 멈출 길이 없었습니다.
       ⚠️ 자리(`ad_place`)는 더 조용합니다 — 어긋나면 운영자가 고른
       자리와 손님 화면이 찾는 자리가 달라져 **광고가 에러 없이 그냥
       안 보입니다**(돈을 받고 안 띄우는 꼴입니다). */
    ["광고 자리 (ad_place)",   enumKeys(sql, "ad_place"), W.AM_AD_PLACE],
    ["광고 상태 (ad_state)",   enumKeys(sql, "ad_state"), W.AM_AD_STATE]
  ];

  want.forEach(function(w){
    const label = w[0], db = w[1], scr = w[2];
    if(!db || !db.length){
      bad.push(label + " — **DB 쪽을 한 글자도 못 읽었습니다.** 검사가 틀렸습니다 " +
               "(마이그레이션의 꼴이 바뀌었는지 보세요).");
      return;
    }
    if(!Array.isArray(scr) || !scr.length){
      bad.push(label + " — js/data/deal.js 쪽 목록이 비었습니다.");
      return;
    }
    const s = scr.map(function(x){ return x.key; });
    measured += db.length;
    db.forEach(function(k){
      if(s.indexOf(k) < 0)
        bad.push(label + " — DB 에 '" + k + "' 가 있는데 화면에 그 말이 없습니다 " +
                 "(손님 화면에 '" + k + "' 가 영문 그대로 찍힙니다).");
    });
    s.forEach(function(k){
      if(db.indexOf(k) < 0)
        bad.push(label + " — 화면에 '" + k + "' 가 있는데 DB 에 그 값이 없습니다 " +
                 "(단추는 보이고 DB 가 거절합니다).");
    });
  });

  /* ⚠️⚠️ 잰 것이 0개면 실패입니다 */
  if(measured === 0) bad.push("아무것도 재지 못했습니다 — 검사가 그 파일을 보기는 했는지 세어 보세요.");
  return { bad: bad, measured: measured };
}

module.exports = { run: run };

if(require.main === module){
  if(process.argv.indexOf("--prove") >= 0){
    /* ⚠️⚠️ **일부러 되돌려서 실제로 잡히는지 봅니다.** 통과만 하고
       아무것도 안 잡는 검사를 여러 번 만들었습니다. */
    const clean = run();
    console.log("\n── 지금 상태");
    console.log(clean.bad.length ? "  ❌ " + clean.bad.join("\n  ❌ ")
                                 : "  ✅ 같습니다 (" + clean.measured + "개를 재 봤습니다)");
    let fail = clean.bad.length ? 1 : 0;

    console.log("\n── 되돌려 보기 ① DB 에 상태 하나를 더하면");
    const sql1 = readAll().replace("'new', 'check', 'assigned'",
                                   "'new', 'check', 'assigned', 'ghost'");
    const r1 = run({ sql: sql1 });
    const got1 = r1.bad.some(function(m){ return m.indexOf("ghost") >= 0; });
    console.log(got1 ? "  ✅ 잡았습니다 — " + r1.bad.filter(m => m.indexOf("ghost") >= 0)[0]
                     : "  ❌ **못 잡았습니다** (검사가 아무것도 안 하고 있습니다)");
    if(!got1) fail = 1;

    console.log("\n── 되돌려 보기 ② DB 에서 상태 하나를 빼면");
    const sql2 = readAll().replace("'nego', 'signed', 'done'", "'signed', 'done'");
    const r2 = run({ sql: sql2 });
    const got2 = r2.bad.some(function(m){ return m.indexOf("nego") >= 0; });
    console.log(got2 ? "  ✅ 잡았습니다 — " + r2.bad.filter(m => m.indexOf("nego") >= 0)[0]
                     : "  ❌ **못 잡았습니다**");
    if(!got2) fail = 1;

    /* ⚠️⚠️⚠️ **이 줄이 없어서 셋을 못 보고 있었습니다** (0015 의
       mrr_rate · retain · kept). `create type` 만 읽으면 뒤에서
       `alter type … add value` 로 늘어난 값은 영원히 안 보입니다 —
       DB 에는 있는데 화면에 말이 없으니 그 갈래를 쓰는 날 영문 키가
       찍히고, 검사는 초록입니다. */
    console.log("\n── 되돌려 보기 ④ alter type 으로 늘어난 값을 빼면");
    const sql4 = readAll().replace(
      "alter type fee_type add value if not exists 'mrr_rate' after 'sub';", "");
    const r4 = run({ sql: sql4 });
    const got4 = r4.bad.some(function(m){ return m.indexOf("mrr_rate") >= 0; });
    console.log(got4 ? "  ✅ 잡았습니다 — " + r4.bad.filter(m => m.indexOf("mrr_rate") >= 0)[0]
                     : "  ❌ **못 잡았습니다** (alter type 을 안 세고 있습니다)");
    if(!got4) fail = 1;

    /* ⚠️⚠️⚠️ **주석을 떼지 않으면 멀쩡한 코드를 실패로 잡습니다.**
       0026 의 `'cat_top',  -- … (cat_key 가 어느 분류인지 말합니다)` 에서
       그 닫는 괄호가 enum 의 끝으로 읽혀 **그 뒤의 `region` 을 못
       봅니다.** 실제로 그렇게 떨어졌고, 코드가 아니라 검사가 틀린
       자리였습니다. 그 함정이 아직 살아 있는지 여기서 봅니다. */
    console.log("\n── 되돌려 보기 ⑤ 주석을 떼지 않으면 (주석 속 괄호 함정)");
    const r5 = run({ sql: readAll(true) });
    const got5 = r5.bad.some(function(m){ return m.indexOf("region") >= 0; });
    console.log(got5
      ? "  ✅ 함정이 그대로 있습니다 — 주석을 떼는 줄이 일을 하고 있습니다"
      : "  ❌ **주석을 떼는 줄이 필요 없어졌습니다** (0026 이 바뀌었는지 보세요)");
    if(!got5) fail = 1;

    console.log("\n── 되돌려 보기 ⑥ 광고 상태 하나를 DB 에서 빼면");
    const sql6 = readAll().replace("'draft', 'live', 'done', 'stopped'",
                                   "'draft', 'live', 'done'");
    const r6 = run({ sql: sql6 });
    const got6 = r6.bad.some(function(m){ return m.indexOf("stopped") >= 0; });
    console.log(got6 ? "  ✅ 잡았습니다 — " + r6.bad.filter(m => m.indexOf("stopped") >= 0)[0]
                     : "  ❌ **못 잡았습니다** (광고 상태를 안 세고 있습니다)");
    if(!got6) fail = 1;

    console.log("\n── 되돌려 보기 ③ DB 쪽을 아예 못 읽으면 (검사가 틀린 경우)");
    const r3 = run({ sql: "-- 아무것도 없습니다" });
    const got3 = r3.measured === 0 && r3.bad.length > 0;
    console.log(got3 ? "  ✅ 0개를 재고 **실패**합니다 (초록으로 지나가지 않습니다)"
                     : "  ❌ **0개를 재고 통과했습니다** — 문에서 통과로 보입니다");
    if(!got3) fail = 1;
    process.exit(fail);
  }
  const r = run();
  if(r.bad.length){
    r.bad.forEach(function(m){ console.error("❌ " + m); });
    process.exit(1);
  }
  console.log("상태 말이 DB 와 같습니다 — " + r.measured + "개");
}

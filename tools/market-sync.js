#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   축평원 시세를 받아 market_prices 에 넣습니다.

   화면 쪽은 하나도 안 바꿉니다 — 17_market.js 와 홈 "오늘의 축산 정보" 는
   이미 market_prices 를 읽고 있으므로, 표에 행이 들어가면 그대로 나옵니다.

     node tools/market-sync.js --probe          받은 응답을 그대로 보여줌 (안 씀)
     node tools/market-sync.js --dry            정리된 행만 보여줌 (안 씀)
     node tools/market-sync.js --file=x.json    네트워크 대신 파일에서 (시험용)
     node tools/market-sync.js                  실제로 넣음

   환경변수
     SUPABASE_URL          https://xxxx.supabase.co
     SUPABASE_SERVICE_KEY  service_role 키 — ⚠️ 저장소에 넣지 마세요.
                           GitHub Secrets 에만 둡니다. RLS 를 지나치므로
                           이 키가 새면 데이터를 통째로 지울 수 있습니다.
     KAPE_KEY / EKAPE_KEY  공공데이터포털 · 축산유통정보 키
     MARKET_SOURCE         kape(기본) | ekape

   ⚠️ 숫자를 지어내지 않습니다 (CLAUDE.md 3번).
      응답을 못 읽으면 0건으로 끝내고 **실패**로 알립니다. 비슷한 값을
      만들어 채우지 않습니다. 어제 값을 오늘 값으로 복사하지도 않습니다.
   ════════════════════════════════════════════════════════════════════ */

"use strict";
const fs = require("fs");
const { SOURCES, pickRows, mapRow } = require("./market-sources.js");

const ARGS = process.argv.slice(2);
const has  = f => ARGS.some(a => a === "--" + f);
const val  = f => { const a = ARGS.find(x => x.startsWith("--" + f + "=")); return a ? a.slice(f.length + 3) : null; };

const PROBE = has("probe"), DRY = has("dry"), FILE = val("file");
const SRC_KEY = process.env.MARKET_SOURCE || "kape";
const SRC = SOURCES[SRC_KEY];

function die(msg, code){ console.error("✗ " + msg); process.exit(code == null ? 1 : code); }
function today(){
  /* 축평원은 한국 기준으로 하루가 바뀝니다 */
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

async function getRaw(ymd){
  if (FILE) return fs.readFileSync(FILE, "utf8");
  if (!SRC) die("모르는 출처입니다: " + SRC_KEY + " (kape · ekape 중 하나)");
  const key = process.env[SRC.needsKey];
  if (!key) die(SRC.needsKey + " 가 없습니다. 공공데이터포털에서 키를 발급받아 넣어 주세요.");
  const url = SRC.url(key, ymd);
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const text = await res.text();
  if (!res.ok) die("HTTP " + res.status + "\n" + text.slice(0, 600));
  return text;
}

/* ── Supabase ─────────────────────────────────────────────────────── */
function sbCfg(){
  const url = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  if (!url || !key) die("SUPABASE_URL · SUPABASE_SERVICE_KEY 가 필요합니다.");
  return { url, key };
}
async function rest(path, opts){
  const { url, key } = sbCfg();
  const r = await fetch(url + "/rest/v1/" + path, Object.assign({}, opts, {
    headers: Object.assign({
      apikey: key, Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    }, (opts && opts.headers) || {}),
  }));
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch(e){}
  if (!r.ok) die("Supabase HTTP " + r.status + " — " + t.slice(0, 400));
  return j;
}

/* 전일 대비를 계산합니다. 어제 값이 없으면 change 는 비워 둡니다 —
   0 으로 채우면 "변동 없음" 이라는 없는 사실을 말하게 됩니다. */
async function withChange(rows, ymd){
  let prev = [];
  try {
    prev = await rest("market_prices?select=item,grade,price,price_date"
      + "&price_date=lt." + ymd + "&order=price_date.desc&limit=1000") || [];
  } catch(e){ prev = []; }
  const seen = new Map();                       /* 같은 품목은 가장 최근 것만 */
  for (const p of prev){
    const k = (p.item || "") + "|" + (p.grade || "");
    if (!seen.has(k)) seen.set(k, Number(p.price));
  }
  return rows.map(r => {
    const k = (r.item || "") + "|" + (r.grade || "");
    const before = seen.get(k);
    return Object.assign({}, r, {
      change: (before != null && Number.isFinite(before)) ? Math.round((r.price - before) * 100) / 100 : null,
    });
  });
}

(async function main(){
  const ymd = val("date") || today();
  const raw = await getRaw(ymd);

  if (PROBE){
    console.log("── 받은 응답 (앞 4000자) ──\n" + raw.slice(0, 4000));
    console.log("\n이 모양에 맞게 tools/market-sources.js 의 pickRows · mapRow 만 고치면 됩니다.");
    return;
  }

  let json;
  try { json = JSON.parse(raw); }
  catch(e){ die("JSON 이 아닙니다. XML 을 주는 엔드포인트일 수 있습니다.\n--probe 로 확인해 주세요.\n" + raw.slice(0, 400)); }

  const list = pickRows(json);
  if (!list) die("응답에서 목록을 못 찾았습니다. --probe 로 모양을 보고 pickRows 를 맞춰 주세요.");

  const name = (SRC && SRC.name) || "축산물품질평가원";
  const rows = list.map(r => mapRow(r, name)).filter(Boolean)
                   .map(r => Object.assign(r, { price_date: r.price_date || ymd }));

  if (!rows.length){
    die("읽어낸 시세가 0건입니다. 칸 이름이 다를 수 있습니다 — --probe 로 확인해 주세요.\n"
      + "받은 줄 수: " + list.length);
  }

  const withChg = DRY ? rows.map(r => Object.assign({}, r, { change: null })) : await withChange(rows, ymd);

  if (DRY){
    console.log("── 정리된 " + withChg.length + "건 (앞 20건) ──");
    console.table(withChg.slice(0, 20));
    console.log("실제로 넣으려면 --dry 를 빼고 다시 돌리세요.");
    return;
  }

  /* 같은 날 같은 출처를 두 번 넣지 않습니다. 표에 unique 제약이 없어서
     upsert 를 못 쓰므로, 그 날짜·출처만 지우고 새로 넣습니다.
     (스키마는 건드리지 않습니다 — CLAUDE.md 2번) */
  await rest("market_prices?price_date=eq." + encodeURIComponent(ymd)
           + "&source=eq." + encodeURIComponent(name), { method: "DELETE" });
  await rest("market_prices", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(withChg),
  });

  console.log("✓ " + ymd + " · " + name + " · " + withChg.length + "건 넣었습니다.");
})().catch(e => die(e && e.stack ? e.stack : String(e)));

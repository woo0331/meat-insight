#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   **뒤 번호가 앞 번호를 덮는 자리**가 적힌 대로인가 — tools/check-chains.js

     node tools/check-chains.js
     node tools/check-chains.js --prove    일부러 깨뜨려 봅니다

   ⚠️⚠️⚠️ **왜 이 검사가 있는가**
   ───────────────────────────────────────────────────────────────────
   같은 함수 · 보기 · 정책을 뒤 번호가 `create or replace` 로 덮으면,
   **앞 번호 파일을 다시 붙여 넣는 순간 조용히 내려갑니다.** 에러가
   한 줄도 안 납니다 — 자물쇠가 풀리거나 막음이 사라진 채로 돕니다.

   그래서 작업 기억(CLAUDE.md)에 "지금 그런 짝" 목록을 적어 두었는데,
   **그 목록이 썩었습니다** (2026-11-05 에 세어 보니 넷이 틀리고 하나가
   중복이었습니다) —
     · make_request 를 0029→0035 로 적어 두었는데 실제는 0041 까지
     · assignment_assignable 가 0012 부터인데 0018 부터로 적힘
     · is_my_item · save_provider_contact · photo_provider 정책 ·
       request_assigned 정책이 **아예 빠짐**
     · save_provider_self 가 두 줄 (한 줄은 옛 범위)

   ⚠️ 목록이 썩으면 **없는 안전을 있다고 읽습니다.** 그래서 사람이
   세지 않고 도구가 셉니다.

   ⚠️⚠️ 이 검사가 보는 것은 **DB 가 맞는가**가 아니라 **적어 둔 것과
   실제가 같은가**입니다. 체인이 늘어나는 것은 잘못이 아닙니다 —
   늘어났는데 **안 적는 것**이 잘못입니다.
   ════════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const MIG  = path.join(ROOT, "db", "migrations");
const MEM  = path.join(ROOT, "CLAUDE.md");

/* 목록이 적힌 구간 — 이 두 글자 사이만 봅니다 */
const HEAD = "지금 그런 짝:";
const TAIL = "세어 보는 법";

let bad = 0;
function ok(cond, msg, got){
  if(cond) return;
  bad++;
  console.log("  ❌ " + msg + (got === undefined ? "" : "\n       " + got));
}

/* ── ① 마이그레이션에서 실제 체인을 셉니다 ──────────────────────
   ⚠️ 함수 · 보기 · 정책 **셋 다** 봅니다. 함수만 보다가 보기와
   정책을 놓치면, 바로 그 둘이 목록에서 빠져 있던 자리입니다. */
function actual(){
  const files = fs.readdirSync(MIG).filter(function(f){ return /^\d{4}.*\.sql$/.test(f); }).sort();
  const hit = {};                       /* 이름 → 번호 배열 */
  function note(kind, name, num){
    const k = kind + "\u0000" + name;
    if(!hit[k]) hit[k] = [];
    if(hit[k].indexOf(num) < 0) hit[k].push(num);
  }
  files.forEach(function(f){
    const num = f.slice(0, 4);
    const sql = fs.readFileSync(path.join(MIG, f), "utf8").toLowerCase();
    let m;
    const fn = /create\s+or\s+replace\s+function\s+([a-z_0-9]+)/g;
    while((m = fn.exec(sql))) note("함수", m[1], num);
    const vw = /create\s+(?:or\s+replace\s+)?view\s+([a-z_0-9]+)/g;
    while((m = vw.exec(sql))) note("보기", m[1], num);
    const pl = /create\s+policy\s+([a-z_0-9]+)/g;
    while((m = pl.exec(sql))) note("정책", m[1], num);
  });
  const out = {};
  Object.keys(hit).forEach(function(k){
    if(hit[k].length >= 2) out[k] = hit[k].sort();
  });
  return out;
}

/* ── ② 작업 기억에 적힌 목록을 읽습니다 ─────────────────────────
   꼴: `이름`(0029→0035→**0041**) · `이름` 보기(…) · `이름` 정책(…)
   ⚠️ 굵게 표시(별표 둘)와 화살표를 떼고 번호만 뽑습니다. */
function documented(){
  const md = fs.readFileSync(MEM, "utf8");
  const a = md.indexOf(HEAD);
  if(a < 0) return null;
  const b = md.indexOf(TAIL, a);
  if(b < 0) return null;
  const blk = md.slice(a + HEAD.length, b);
  const out = {};
  const re = /`([a-z_0-9]+)`\s*(보기|정책)?\s*\(([0-9→*\s]+)\)/g;
  let m;
  while((m = re.exec(blk))){
    const kind = m[2] || "함수";
    const nums = (m[3].match(/\d{4}/g) || []).sort();
    const k = kind + "\u0000" + m[1];
    /* ⚠️ 같은 이름이 두 줄에 적혀 있으면 **그 자체가 잘못**입니다
       (한 줄은 반드시 옛 범위입니다 — 실제로 그랬습니다). */
    if(out[k]){
      bad++;
      console.log("  ❌ 목록에 " + kind + " " + m[1] + " 가 **두 번** 적혀 있습니다 — " +
                  "한 줄은 옛 범위입니다. 한 줄로 합치세요.");
    }
    out[k] = nums;
  }
  return out;
}

console.log("── 뒤 번호가 앞 번호를 덮는 짝");

const A = actual();
const D = documented();

ok(D !== null, "CLAUDE.md 에서 목록 구간을 못 찾았습니다 (" + HEAD + " … " + TAIL + ")");
if(D === null){ process.exit(1); }

const aKeys = Object.keys(A), dKeys = Object.keys(D);

/* ⚠️ "잴 것이 없으면 0 으로 끝나는 검사" 를 만들지 않습니다 */
ok(aKeys.length > 0, "마이그레이션에서 체인을 하나도 못 셌습니다 — 도구가 파일을 보기는 했습니까?");

function show(k){ return k.split("\u0000")[0] + " " + k.split("\u0000")[1]; }

aKeys.forEach(function(k){
  if(!D[k]){
    ok(false, show(k) + " 가 **목록에 없습니다**",
       "실제: " + A[k].join(" → ") + "   ← CLAUDE.md 의 '지금 그런 짝' 에 더하세요");
    return;
  }
  ok(A[k].join(",") === D[k].join(","),
     show(k) + " 의 번호가 다릅니다",
     "실제 " + A[k].join(" → ") + "   ·   적힌 것 " + D[k].join(" → "));
});

dKeys.forEach(function(k){
  if(!A[k])
    ok(false, show(k) + " 는 **이제 체인이 아닙니다** (덮는 번호가 하나뿐)",
       "적힌 것: " + D[k].join(" → ") + "   ← 목록에서 그 줄을 지우세요");
});

/* ── ③ 되돌려 보기 — 일부러 깨뜨려 실제로 잡히는지 ──────────────
   ⚠️ 통과만 하고 아무것도 안 잡는 검사를 여러 번 만들었습니다. */
if(process.argv.indexOf("--prove") >= 0){
  console.log("\n── 되돌려 보기");
  const md = fs.readFileSync(MEM, "utf8");
  const probes = [
    ["한 줄을 지우면 잡는다",
     function(s){ return s.replace(/`make_request`\([^)]*\)\s*·\s*/, ""); }],
    ["번호를 하나 빼면 잡는다",
     function(s){ return s.replace("`provider_guard`(0001→0021→0024→**0030**)",
                                   "`provider_guard`(0001→0021→**0030**)"); }],
    ["없는 이름을 넣으면 잡는다",
     function(s){ return s.replace(HEAD, HEAD + " `no_such_fn`(0001→0002) ·"); }]
  ];
  let miss = 0;
  probes.forEach(function(p){
    const before = bad;
    const saved = fs.readFileSync(MEM, "utf8");
    try{
      fs.writeFileSync(MEM, p[1](md));
      bad = 0;
      const A2 = actual(), D2 = documented();
      if(D2){
        Object.keys(A2).forEach(function(k){
          if(!D2[k] || A2[k].join(",") !== D2[k].join(",")) bad++;
        });
        Object.keys(D2).forEach(function(k){ if(!A2[k]) bad++; });
      }
      const caught = bad > 0;
      console.log("  " + (caught ? "O" : "❌") + " " + p[0]);
      if(!caught) miss++;
    }finally{
      fs.writeFileSync(MEM, saved);     /* ⚠️ 반드시 되돌립니다 */
      bad = before;
    }
  });
  if(miss) bad += miss;
}

console.log("\n체인 " + aKeys.length + "개를 셌습니다 · 어긋난 것 " + bad + "건");
process.exit(bad ? 1 : 0);

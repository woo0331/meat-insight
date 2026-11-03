#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   **문을 부르는 자리가 있나** — 만들어 놓고 안 쓰는 칸을 잡습니다

   ⚠️⚠️⚠️ **작업 기억에서 가장 큰 판이 이것입니다.** `approve_provider`
   를 0007 에 쓰고 0012 · 0018 로 **두 번 고쳤는데**, `js/` 와 `pages/`
   를 훑으니 부르는 자리가 **0곳**이었습니다 — 업체를 승인하려면
   사장님이 SQL 편집기를 열어야 했습니다. 문은 멀쩡하고 검사도 전부
   초록이라 **아무도 몰랐습니다.** 사람이 손으로 grep 해서 겨우 찾았고,
   그러니 다음에 또 납니다. 그래서 **도구가 셉니다.**

   ⚠️⚠️ **무엇이 "문" 인가.** `grant execute ... to anon/authenticated`
   를 받은 함수 가운데, **다른 SQL 이 부르지 않는** 것입니다. 안쪽
   도움함수(`my_role` · `is_my_item` 같은)는 정책과 다른 함수가 부르니
   SQL 안에 참조가 있고, **문은 화면만 부릅니다.** 그래서 SQL 참조가
   0인 함수는 화면에서 불려야 하고, 그것도 0이면 **없는 기능**입니다.

   ⚠️ 주석은 지웁니다 — 작업 기억이 문 이름을 잔뜩 적어 두었고, 그것을
   참조로 세면 이 검사는 **아무것도 안 잡습니다.**

   ⚠️⚠️ **잰 것이 0개면 실패입니다** (작업 기억의 그 줄 — 인자가 없어서
   "잴 것이 없다" 고 0 으로 끝나는 검사를 만들지 마세요).

   돌리기   node tools/check-doors.js
            node tools/check-doors.js --prove    일부러 깨뜨려 봅니다
   ════════════════════════════════════════════════════════════════════ */
const fs   = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

let bad = 0;
function ok(name, cond, got){
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0, 300) : "")); }
}

/* 주석을 지웁니다 — 줄 주석만 씁니다 (SQL 파일에 블록 주석은 없습니다) */
function noComments(sql){
  return sql.split("\n").map(function(l){
    const i = l.indexOf("--");
    return i < 0 ? l : l.slice(0, i);
  }).join("\n");
}

/* ── ⚠️⚠️ 적어 둔 것 (아직 부르는 화면이 없는 문) ──────────────────
   ⚠️⚠️⚠️ **갯수를 박지 않습니다 — 목록을 적습니다.** 작업 기억의 그
   줄입니다 ("전을 재고 늘어난 값만 보세요"). 여기 적힌 것은 **이미
   알고 있는 빈 자리**이고, 이 검사가 잡는 것은 **새로 생긴** 빈
   자리입니다. 그래야 다음 차수가 문을 하나 더 만들고 화면을 안 만든
   날 바로 걸립니다.

   ⚠️⚠️ **목록이 썩는 것도 잡습니다.** 여기 적힌 이름에 화면이 생겼거나
   그 문이 없어졌으면 **이 검사가 떨어집니다** — 줄을 지우라고 말합니다.
   안 그러면 이 목록이 "옛날에 그랬다" 는 글이 되고, 아무 뜻이 없습니다.

   ⚠️ 까닭을 같이 적습니다. "왜 화면이 없는가" 가 없으면 다음 차수는
   그것이 할 일인지 지울 것인지 알 수 없습니다. */
const KNOWN = {
  /* 앞 서비스(중고폰) 전용 — 골프올인원에서는 쓰지 않습니다.
     ⚠️ 지우는 것도 **새 번호**에 적습니다 (돌린 파일을 고치지 않습니다).
     지금 지우지 않는 까닭: 앞 서비스의 자료가 그 표에 그대로 남아
     있고(손님 기록입니다), 문을 지우면 그 자료를 볼 길이 없어집니다. */
  add_device_check:       "앞 서비스(중고폰) 전용 — 0020 기기 점검",
  add_device_cost:        "앞 서비스(중고폰) 전용 — 0020 기기 비용",
  make_device:            "앞 서비스(중고폰) 전용 — 0020 기기 등록",
  move_device:            "앞 서비스(중고폰) 전용 — 0020 기기 상태",
  set_provider_inhouse:   "앞 서비스 전용 — 0021 자체 매입 표시",
  archive_legacy_side:    "앞 서비스 자료를 치우는 문 — 0022 (운영자가 SQL 로 한 번 씁니다)",
  restore_legacy_request: "앞 서비스 자료를 되살리는 문 — 0022 (되돌리기용)",
  save_user_state:        "앞 서비스 화면이 쓰던 임시 저장 — 0010",
  clear_user_state:       "앞 서비스 화면이 쓰던 임시 저장 — 0010",

  /* 할 일 — 화면이 생기는 날 이 줄을 지웁니다 */
  save_provider_contact:  "할 일 — 업체 연락처 · 알림 설정 화면이 아직 없습니다 (/desk)",
  drop_photo:             "할 일 — 올린 사진을 **지우는** 단추가 아직 없습니다 (/my)",
  move_item_state:        "할 일 — 요청을 **항목별로** 옮기는 화면이 없습니다 (지금은 요청 단위)",
  build_settlement:       "장치 없음 — 청구 · 입금을 담을 표가 없습니다 (작업 기억의 '아직 안 한 것')",
  hold_settlement:        "장치 없음 — 같은 자리 (정산 보류)",
  clawback_fee:           "장치 없음 — 같은 자리 (수수료 환수)",
  /* ⚠️ 계정을 업체에 잇는 길은 0043(초대 코드)이 맡습니다 — 아래 넷은
     그것과 **다른 것**입니다 (한 사람이 여러 업체를 맡는 경우 · 능력
     딱지 · 요청 담당자). 화면이 아직 없습니다. */
  grant_hat:              "할 일 — 0025 의 **능력 딱지**(seller · pro · biz)를 주는 화면이 없습니다",
  has_hat:                "할 일 — 같은 자리 (그 딱지를 확인하는 함수)",
  linked_providers:       "할 일 — 한 사람이 **여러 업체**를 맡는 경우 (0018) — 화면이 없습니다",
  set_owner:              "할 일 — 요청의 **담당 직원**을 지정하는 문(0012) — /admin 에 그 칸이 없습니다"
};

const MDIR = path.join(ROOT, "db/migrations");
const migs = fs.readdirSync(MDIR).filter(function(f){
  return /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f);
}).sort();
const SQL = migs.map(function(f){
  return { f: f, s: noComments(fs.readFileSync(path.join(MDIR, f), "utf8")) };
});
const ALL = SQL.map(function(x){ return x.s; }).join("\n");

/* ── 문을 모읍니다 ─────────────────────────────────────────────── */
/* grant execute on function <이름>(...) to ... anon|authenticated */
const names = {};
ALL.split("\n").forEach(function(l){
  const low = l.toLowerCase();
  if(low.indexOf("grant execute on function") < 0) return;
  if(low.indexOf("anon") < 0 && low.indexOf("authenticated") < 0) return;
  const m = l.match(/grant\s+execute\s+on\s+function\s+([a-z0-9_]+)\s*\(/i);
  if(m) names[m[1]] = true;
});
const doors = Object.keys(names).sort();
/* ⚠️⚠️ 잰 것이 0개면 실패입니다 — 정규식이 안 맞으면 조용히 초록입니다 */
ok("마이그레이션에서 함수를 찾았다 (0개면 이 검사가 고장입니다)",
   doors.length >= 10, doors.length + "개");

/* ── 화면 쪽 ───────────────────────────────────────────────────── */
function files(dir, out){
  out = out || [];
  if(!fs.existsSync(dir)) return out;
  fs.readdirSync(dir).forEach(function(f){
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if(st.isDirectory()) files(p, out);
    else if(/\.js$/.test(f)) out.push(p);
  });
  return out;
}
const UI = ["js", "pages", "api"].reduce(function(a, d){
  return a.concat(files(path.join(ROOT, d)));
}, []).map(function(p){
  return { f: path.relative(ROOT, p), s: fs.readFileSync(p, "utf8") };
});
ok("화면 · 서버 파일을 찾았다 (0개면 이 검사가 고장입니다)",
   UI.length >= 10, UI.length + "개");

/* ── 셉니다 ────────────────────────────────────────────────────── */
/* SQL 안에서 부르는 자리 — 정의 · 권한 줄은 뺍니다 */
function sqlCalls(name){
  let n = 0;
  SQL.forEach(function(x){
    x.s.split("\n").forEach(function(l){
      const low = l.toLowerCase().trim();
      if(/^(create or replace function|create function|grant |revoke |drop function|alter function|comment on function)/.test(low)) return;
      if(low.indexOf(name + "(") >= 0 || low.indexOf(name + " (") >= 0) n++;
    });
  });
  return n;
}
function uiCalls(name){
  const hit = [];
  UI.forEach(function(x){ if(x.s.indexOf(name) >= 0) hit.push(x.f); });
  return hit;
}

function audit(list){
  const orphans = [];
  list.forEach(function(d){
    if(sqlCalls(d) > 0) return;              /* 안쪽 도움함수입니다 */
    if(uiCalls(d).length > 0) return;        /* 부르는 화면이 있습니다 */
    orphans.push(d);
  });
  return orphans;
}

console.log("\n── 문마다 부르는 자리를 셉니다");
const orphans = audit(doors);
/* ⚠️ 떨어질 때 **어느 문인지** 말합니다 — 이름이 없으면 사람이 또
   손으로 grep 해야 하고, 그러면 도구가 있으나 마나입니다. */
/* ⚠️ 한 줄에 하나씩 찍습니다 — 한 줄에 몰아 적으면 잘려서 **어느
   문인지 안 보입니다** (그러면 사람이 또 손으로 grep 합니다). */
const fresh = orphans.filter(function(d){ return !KNOWN[d]; });
fresh.forEach(function(d){
  console.log("     ⚠️ " + d + " — 부르는 자리가 0곳입니다 (없는 기능입니다)");
});
ok("**새로** 생긴 빈 문이 0개다 (문을 만들고 화면을 안 만든 자리)",
   fresh.length === 0, fresh.join(" · "));

/* ⚠️⚠️ 적어 둔 목록이 **썩지 않게** — 화면이 생겼거나 문이 없어진
   줄은 지우라고 말합니다. 안 그러면 이 목록은 아무 뜻이 없습니다. */
const stale = Object.keys(KNOWN).filter(function(d){
  return orphans.indexOf(d) < 0;
});
stale.forEach(function(d){
  const gone = doors.indexOf(d) < 0;
  console.log("     ⚠️ " + d + " — " + (gone
    ? "그런 문이 이제 없습니다"
    : "부르는 자리가 생겼습니다 (" + uiCalls(d).join(" · ") + ")") +
    " → tools/check-doors.js 의 KNOWN 에서 그 줄을 지우세요");
});
ok("적어 둔 목록이 지금과 맞다 (끝난 줄이 남아 있지 않다)",
   stale.length === 0, stale.join(" · "));

/* 아직 화면이 없는 문 — 적어 둔 것만 남습니다 (할 일 목록입니다) */
console.log("  · 아직 부르는 화면이 없는 문 " + orphans.length + "개 (적어 둔 것):");
orphans.forEach(function(d){
  console.log("      " + d + " — " + KNOWN[d]);
});

/* 참고로 몇 곳에서 부르는지 적습니다 — 늘어난 값만 보면 됩니다 */
const screens = doors.filter(function(d){ return uiCalls(d).length > 0; });
console.log("  · 화면이 부르는 문 " + screens.length + "개 · " +
            "SQL 안쪽 함수 " + (doors.length - screens.length) + "개");

/* ── ⚠️ 되돌려 보기 ───────────────────────────────────────────────
   ⚠️⚠️ **검사를 넣으면 일부러 되돌려서 실제로 잡히는지 보세요.**
   통과만 하고 아무것도 안 잡는 검사를 여러 번 만들었습니다. */
if(process.argv.indexOf("--prove") >= 0){
  console.log("\n── ⚠️ 일부러 깨뜨려 봅니다");
  /* 아무 데도 없는 이름을 문으로 넣으면 **잡혀야** 합니다 */
  const fake = "never_called_door_zzz";
  ok("아무도 안 부르는 문을 넣으면 잡는다",
     audit([fake]).length === 1, JSON.stringify(audit([fake])));
  /* ⚠️ 적어 둔 것은 **새로 생긴 것으로 안 잡혀야** 합니다 */
  const k0 = Object.keys(KNOWN)[0];
  ok("적어 둔 빈 문은 새 것으로 안 잡는다",
     audit([k0]).length === 1 && !!KNOWN[k0], k0);
  /* 화면이 부르는 문은 **안 잡혀야** 합니다 (너무 넓게 막는 것도 고장) */
  ok("화면이 부르는 문은 안 잡는다",
     screens.length > 0 && audit(screens.slice(0, 5)).length === 0,
     JSON.stringify(audit(screens.slice(0, 5))));
  /* SQL 안쪽 함수도 **안 잡혀야** 합니다 */
  const inner = doors.filter(function(d){ return sqlCalls(d) > 0; });
  ok("SQL 안쪽 함수도 안 잡는다",
     inner.length > 0 && audit(inner).length === 0, JSON.stringify(audit(inner)));
}

console.log("\n" + (bad ? bad + "건 실패" : "전부 통과"));
process.exit(bad ? 1 : 0);

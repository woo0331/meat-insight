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
  /* ⚠️⚠️⚠️ **여행 상품(0073) — 문은 섰고 화면이 아직 없습니다.**
     2026-11-12. 확정 시안 ⑧ 의 상품 등록 · 수정 · 심사 화면이 다음
     차수입니다. 이 저장소의 규칙("DB 칸만 만들고 완료하지 않습니다")을
     지키려면 **그 화면이 서기 전에는 0073 을 운영 DB 에 올리지
     마세요** — 올리면 아무도 못 쓰는 문 아홉이 운영에 섭니다.
     ⚠️ 화면을 만드는 날 **이 아홉 줄을 같이 빼는 것까지가 일입니다** —
     안 빼면 이 검사가 「목록이 썩었습니다」로 멈춥니다. */
  open_trip:          "여행 상품 등록 — 0073 · 화면은 다음 차수 (확정 시안 ⑧)",
  edit_trip:          "여행 상품 수정 — 0073 · 화면은 다음 차수",
  close_trip:         "여행 상품 판매 중지 — 0073 · 화면은 다음 차수",
  reopen_trip:        "여행 상품 되돌리기 — 0073 · 화면은 다음 차수",
  move_trip:          "여행 상품 가리기(운영자) — 0073 · 화면은 다음 차수",
  review_trip_draft:  "여행 상품 수정본 심사(운영자) — 0073 · 화면은 다음 차수",
  claim_trip_photo:   "여행 상품 사진 붙이기 — 0073 · 화면은 다음 차수",
  drop_trip_photo:    "여행 상품 사진 빼기 — 0073 · 화면은 다음 차수",
  order_trip_photo:   "여행 상품 사진 차례 — 0073 · 화면은 다음 차수",
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
  move_item_state:        "할 일 — 요청을 **항목별로** 옮기는 화면이 없습니다 (지금은 요청 단위)",
  /* ⚠️⚠️⚠️ 2026-11-06 — 셋을 여기서 뺐습니다. 설명도 **틀려** 있었습니다:
     "청구 · 입금을 담을 표가 없습니다" 라고 적혀 있었지만 `settlement`
     표는 **0001 부터 있고** 0013 이 unique 인덱스까지 걸어 두었습니다.
     없던 것은 표가 아니라 **화면**이었습니다 (`js/adminfee.js`).
     ⚠️ 작업 기억의 "아직 안 한 것" 줄도 같은 오해를 담고 있었습니다 —
     그 줄이 말하는 것은 광고 · 멤버십(`ad` · `mship`)의 입금입니다.
     ⚠️ 0009 의 항목 단위 배정 — 지금 배정은 **요청 단위**입니다
     (`js/assign.js` 가 `move_state` 를 부릅니다). `move_item_state` 와
     같은 자리이고, 항목 단위 화면을 만드는 날 둘을 같이 씁니다.
     ⚠️⚠️ 이 줄이 2026-11-06 까지 **이 목록에 아예 없었습니다** — 이름이
     0009 의 거절 문구("배정은 assign_item() 으로 하세요") 안에 들어
     있어서 검사가 "다른 SQL 이 부른다" 로 세고 넘겼습니다. */
  assign_item:            "할 일 — 요청을 **항목별로** 업체에 배정하는 화면이 없습니다 (지금은 요청 단위 · move_item_state 와 같은 자리)",
  /* ⚠️⚠️ **아래 셋은 서로 다른 일입니다 — 한 기능이 아닙니다.**
     2026-11-05 에 세어 보니 이 줄의 설명 둘이 틀려 있었고, 작업 기억도
     그것을 "한 업체에 담당자 여럿 (0025 의 모자) · 문 넷" 으로 뭉쳐
     적어 두었습니다. 그 말을 믿고 화면을 짜면 **엉뚱한 것**을 만듭니다.
     ⚠️ 계정을 업체에 잇는 길은 0043(초대 코드) · 끊는 길은
     0052(`drop_provider_staff`)가 맡습니다 — 아래 셋과 다릅니다. */
  /* ⚠️ 2026-11-06 — `grant_hat` 을 여기서 뺐습니다 (화면은
     `js/adminhat.js`). 떼는 문은 그날 0054 가 냈습니다(`revoke_hat`) —
     0025 는 **붙이는 길만** 내고 떼는 길은 본인만 쓸 수 있어서, 잘못
     붙인 딱지를 사장님이 SQL 편집기에서 직접 지우셔야 했습니다.
     ⚠️⚠️ `has_hat` 은 **화면이 쓸 일이 없습니다** — 딱지로 갈리는 자리를
     화면이 직접 재면 규칙이 두 곳이 됩니다. 쓰는 쪽은 SQL(정책 · 문)
     이고 지금은 그 조건을 거는 자리가 0곳입니다. "화면이 없다" 가
     아니라 **"화면이 부를 함수가 아니다"** 라고 적습니다 — 설명이
     틀리면 다음 차수가 없는 화면을 만듭니다(0052 에서 겪은 자리). */
  has_hat:                "화면이 부를 함수가 아닙니다 — 딱지로 갈리는 자리는 SQL(정책 · 문) 안에서 봅니다. 지금은 그 조건을 거는 자리가 0곳입니다",
  /* ⚠️⚠️ 전에 "한 사람이 **여러 업체**를 맡는 경우" 라고 적어 두었는데
     **반대**입니다. 이 함수는 **계정이 이어진 업체 id 목록**을 냅니다
     (운영자 화면이 "이 업체는 계정이 안 이어졌습니다" 를 보여 주려고
     0018 이 만든 것입니다). 한 사람이 여러 업체를 맡는 것은 지금
     **DB 가 못 합니다** — `account.provider_id` 가 한 칸입니다.
     ⚠️ 0052 의 `/admin` 화면은 담당자 0명인 업체를 **업체 목록에서
     직접** 세므로 이 함수를 안 씁니다 (상호까지 같이 내야 합니다). */
  linked_providers:       "할 일 — 계정이 이어진 **업체 id 목록**(0018) · 0052 의 화면은 업체 목록에서 직접 세어 이 함수를 안 씁니다"
  /* ⚠️ 2026-11-06 — `set_owner` 를 여기서 뺐습니다 (`js/assign.js` 의
     배정 줄에 담당 고르개가 섰습니다). */
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
/* 홑따옴표로 감싼 글(거절 문구 · 설명)을 지웁니다 — 거기 적힌 이름은
   **부르는 것이 아니라 말하는 것**입니다.
   ⚠️ `--` 주석도 같이 지웁니다 (0013 머리말이 함수 이름을 설명으로
   적어 둔 자리가 있습니다). */
function stripText(line){
  const cut = line.indexOf("--");
  let l = cut >= 0 ? line.slice(0, cut) : line;
  let out = "", inq = false;
  for(let i = 0; i < l.length; i++){
    const c = l[i];
    if(c === "'"){ inq = !inq; continue; }
    if(!inq) out += c;
  }
  return out;
}
function sqlCalls(name){
  let n = 0;
  SQL.forEach(function(x){
    x.s.split("\n").forEach(function(l){
      const low = l.toLowerCase().trim();
      if(/^(create or replace function|create function|grant |revoke |drop function|alter function|comment on function)/.test(low)) return;
      /* ⚠️⚠️⚠️ **거절 문구 안의 이름은 부르는 자리가 아닙니다** (2026-11-06).
         0004 · 0007 · 0009 가 "수수료는 confirm_fee() · mark_paid() 로만
         갑니다" 라고 **에러 메시지**에 적어 두었는데, 이 검사가 그 줄을
         "다른 SQL 이 부른다" 로 세어 **둘을 안쪽 도움함수로** 넘겼습니다.
         그래서 화면이 한 곳도 없는 문 둘이 이 목록에 **영원히 안 떴습니다**
         — 돈을 확정하고 입금을 적는 길이 막혀 있는 줄 아무도 몰랐습니다.
         ⚠️ 홑따옴표 안(문자열 · 주석의 설명)을 지우고 봅니다. */
      const code = stripText(low);
      if(code.indexOf(name + "(") >= 0 || code.indexOf(name + " (") >= 0) n++;
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

  /* ⚠️⚠️⚠️ **거절 문구 안의 이름을 "부른다" 로 세면 안 됩니다** —
     그 한 줄 때문에 `confirm_fee` · `mark_paid` · `assign_item` 셋이
     2026-11-06 까지 이 목록에 **한 번도 안 떴습니다**(돈을 확정하고
     입금을 적는 길이 막혀 있는 줄 아무도 몰랐습니다). 미끼를 둘
     넣습니다 — 문자열 안 · `--` 주석 안. */
  const saved = SQL.slice();
  SQL.push({ f:"__prove.sql",
    s:"raise exception '이것은 " + fake + "() 로만 갑니다';\n" +
      "-- 그리고 " + fake + "() 를 주석에서도 말합니다\n" });
  ok("⚠️⚠️ **거절 문구 · 주석 안의 이름**은 부르는 자리로 안 센다",
     sqlCalls(fake) === 0 && audit([fake]).length === 1,
     "sqlCalls=" + sqlCalls(fake));
  /* ⚠️ 그런데 **진짜 부르는 줄**은 그대로 세어야 합니다 (너무 넓게
     막는 것도 고장입니다) */
  SQL.push({ f:"__prove2.sql", s:"  perform " + fake + "(1);\n" });
  ok("  진짜 부르는 줄은 **그대로 센다**", sqlCalls(fake) === 1,
     "sqlCalls=" + sqlCalls(fake));
  SQL.length = 0;
  saved.forEach(function(x){ SQL.push(x); });
}

console.log("\n" + (bad ? bad + "건 실패" : "전부 통과"));
process.exit(bad ? 1 : 0);

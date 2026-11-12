#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   db/audit.sql 을 **마이그레이션에서 만들어** 둡니다

   ⚠️⚠️⚠️ **`select max(n) from schema_version` 하나로 「다 올라갔다」고
   읽으면 안 됩니다.** 그 표는 마이그레이션 **파일이 스스로 적는** 줄이라,
   파일이 중간에서 멈췄어도(한 문장이 거절당했어도) 그 앞의 insert 는
   이미 들어가 있을 수 있고, 손으로 번호만 넣어 둔 DB 도 똑같이 보입니다.
   그래서 **실제로 있는가**를 묻습니다 — 표 · 칸 · 함수 · 권한.

   ⚠️⚠️ **목록을 손으로 적지 않습니다.** 적어 두면 반드시 썩습니다
   (`db/README.md` 가 0001~0023 에서 멈춰 있던 그 자리 · `db/verify.sql`
   의 기대값이 0023 판으로 남아 멀쩡한 DB 를 ❌ 로 읽던 그 자리).
   여기서는 `db/migrations/*.sql` 을 읽어 그때그때 만듭니다.

   돌리는 법:  node tools/make-audit.js
   ⚠️ 빌드가 `db/apply-from-0008.sql` 을 만들 때 같이 돕니다.
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "db", "migrations");

/* ⚠️ 주석과 홑따옴표 안은 떼고 읽습니다 — 거절 문구 안의 함수 이름을
   「문」으로 세던 `check-doors` 의 그 자리입니다. */
function strip(sql){
  let out = "", i = 0, st = "code";
  while(i < sql.length){
    const c = sql[i], d = sql[i + 1];
    if(st === "code"){
      if(c === "-" && d === "-"){ st = "line"; i += 2; out += "  "; continue; }
      if(c === "/" && d === "*"){ st = "blk";  i += 2; out += "  "; continue; }
      if(c === "'"){ st = "str"; i++; out += " "; continue; }
      if(c === "$" && sql.slice(i, i + 2) === "$$"){ st = "dol"; i += 2; out += "  "; continue; }
      out += c; i++; continue;
    }
    if(st === "line"){ if(c === "\n"){ st = "code"; out += c; } else out += " "; i++; continue; }
    if(st === "blk"){ if(c === "*" && d === "/"){ st = "code"; i += 2; out += "  "; continue; }
                      out += (c === "\n" ? c : " "); i++; continue; }
    if(st === "str"){ if(c === "'"){ st = "code"; } out += " "; i++; continue; }
    /* $$ … $$ — 문 몸통은 통째로 건너뜁니다 */
    if(sql.slice(i, i + 2) === "$$"){ st = "code"; i += 2; out += "  "; continue; }
    out += (c === "\n" ? c : " "); i++;
  }
  return out;
}

const files = fs.readdirSync(DIR)
  .filter(f => /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f)).sort();
if(files.length === 0){
  console.error("❌ 마이그레이션을 한 개도 못 읽었습니다 — 잴 것이 0개입니다.");
  process.exit(1);
}

const tables = new Set(), views = new Set(), doors = new Set();
let last = 0;
files.forEach(function(f){
  last = Math.max(last, Number(f.slice(0, 4)));
  const sql = strip(fs.readFileSync(path.join(DIR, f), "utf8"));
  let m;
  const reT = /create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z_][a-z0-9_]*)/gi;
  while((m = reT.exec(sql))) tables.add(m[1]);
  const reV = /create\s+(?:or\s+replace\s+)?view\s+([a-z_][a-z0-9_]*)/gi;
  while((m = reV.exec(sql))) views.add(m[1]);
  /* 문 = anon · authenticated 에게 EXECUTE 를 준 함수 */
  const reD = /grant\s+execute\s+on\s+function\s+([a-z_][a-z0-9_]*)\s*\(/gi;
  while((m = reD.exec(sql))) doors.add(m[1]);
  /* 지운 것은 빼 둡니다 — 없는 것을 「빠졌다」고 하면 안 됩니다 */
  const reDV = /drop\s+view\s+(?:if\s+exists\s+)?([a-z_][a-z0-9_]*)\s*;/gi;
  void reDV;
});

/* ⚠️ `drop table` 로 지운 표 · 보기는 빼 둡니다 (0024 가 앞 서비스 것을
   지웠습니다) — 안 빼면 멀쩡한 DB 를 ❌ 로 읽습니다. */
files.forEach(function(f){
  const sql = strip(fs.readFileSync(path.join(DIR, f), "utf8"));
  let m;
  const reX = /drop\s+table\s+(?:if\s+exists\s+)?([a-z_][a-z0-9_]*)/gi;
  while((m = reX.exec(sql))) tables.delete(m[1]);
});
/* 보기는 `drop view … ; create view …` 가 흔한 꼴이라 지운 것으로 안 셉니다 —
   마지막에 `create view` 가 있으면 있는 것입니다. */

const lit = a => Array.from(a).sort().map(x => "('" + x + "')").join(",\n    ");

const out = `-- ════════════════════════════════════════════════════════════════════
-- db/audit.sql — **운영 DB 가 정말 올라갔는지** 대조합니다
--
-- ⚠️⚠️⚠️ **빌드가 만드는 파일입니다 — 손으로 고치지 마세요.**
--   (node tools/make-audit.js · 마이그레이션 ${files.length}개에서 읽었습니다)
--
-- ⚠️⚠️ **\`select max(n) from schema_version\` 하나로 판정하지 않습니다.**
--   그 표는 마이그레이션 파일이 **스스로 적는** 줄입니다 — 중간에서
--   멈췄어도 앞쪽 insert 는 들어가 있고, 손으로 번호만 넣어 둔 DB 도
--   똑같이 보입니다. 아래 ②~⑤ 가 **실제로 있는가**를 묻습니다.
--
-- 쓰는 법: Supabase → SQL Editor 에 통째로 붙여 넣고 Run.
--   ❌ 가 한 줄도 없어야 올라간 것입니다.
-- ════════════════════════════════════════════════════════════════════

-- ① 판 번호와 **빠진 번호** ─────────────────────────────────────────
select '① 판 번호' as 항목,
       coalesce(max(n), 0)::text as 값,
       case when coalesce(max(n), 0) >= ${last} then '✅' else '❌ ${last} 보다 낮습니다' end as 결과
  from schema_version;

select '① 빠진 번호' as 항목,
       coalesce(string_agg(g::text, ', ' order by g), '(없음)') as 값,
       case when count(*) = 0 then '✅' else '❌ 그 번호를 따로 돌리세요' end as 결과
  from generate_series(1, ${last}) g
 where not exists (select 1 from schema_version v where v.n = g);

-- ② 표가 다 있나 ─────────────────────────────────────────────────
with want(t) as (values
    ${lit(tables)}
)
select '② 빠진 표' as 항목,
       coalesce(string_agg(w.t, ', ' order by w.t), '(없음)') as 값,
       case when count(*) = 0 then '✅' else '❌' end as 결과
  from want w
 where not exists (
   select 1 from information_schema.tables i
    where i.table_schema = 'public' and i.table_name = w.t);

-- ③ 보기가 다 있나 ───────────────────────────────────────────────
with want(v) as (values
    ${lit(views)}
)
select '③ 빠진 보기' as 항목,
       coalesce(string_agg(w.v, ', ' order by w.v), '(없음)') as 값,
       case when count(*) = 0 then '✅' else '❌' end as 결과
  from want w
 where not exists (
   select 1 from pg_views p where p.schemaname = 'public' and p.viewname = w.v);

-- ④ 문(손님 · 업체가 부르는 함수)이 다 있나 ───────────────────────
with want(f) as (values
    ${lit(doors)}
)
select '④ 빠진 문' as 항목,
       coalesce(string_agg(w.f, ', ' order by w.f), '(없음)') as 값,
       case when count(*) = 0 then '✅' else '❌' end as 결과
  from want w
 where not exists (
   select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = w.f);

select '④ 문을 부를 권한' as 항목,
       count(*)::text as 값,
       case when count(*) = 0 then '✅' else '❌ 그 문은 화면이 못 부릅니다' end as 결과
  from (values
    ${lit(doors)}
  ) w(f)
 where exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
                where n.nspname = 'public' and p.proname = w.f)
   and not exists (
     select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = w.f
       and (has_function_privilege('anon', p.oid, 'EXECUTE')
         or has_function_privilege('authenticated', p.oid, 'EXECUTE')));

-- ⑤ 표가 **비로그인에게 열려 있지 않은가** ────────────────────────
-- ⚠️⚠️⚠️ RLS 는 **줄은 막아도 칸은 못 막습니다.** 공개로 읽는 길은
--   보기뿐이어야 합니다 (0064 에서 광고 단가 · 운영자 메모가 표째
--   읽히던 자리).
select '⑤ anon 에게 열린 표' as 항목,
       coalesce(string_agg(c.relname, ', ' order by c.relname), '(없음)') as 값,
       case when count(*) = 0 then '✅' else '❌ 보기로만 내보내세요' end as 결과
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
   and has_table_privilege('anon', c.oid, 'SELECT');
`;

const to = path.join(ROOT, "db", "audit.sql");
fs.writeFileSync(to, out);
console.log("db/audit.sql 을 만들었습니다 — 표 " + tables.size +
            " · 보기 " + views.size + " · 문 " + doors.size +
            " (마이그레이션 " + files.length + "개 · 마지막 " + last + ")");

/* 운영 순서 리허설 — 0081 상태의 DB 에 0082 → 0083 을 차례로 올리고 되돌립니다 (2026-11-16)
   ════════════════════════════════════════════════════════════════════
   ⚠️⚠️⚠️ **단계 사이에도 지금 서비스가 돌아야 합니다.** 다른 검사는 모든
   마이그레이션을 다 올린 DB 를 재므로 「0082 만 올라간 운영」 · 「0083 을
   되돌린 운영」을 영원히 못 봅니다. 여기서는 **따로 만든 DB(stagetest)** 에
   지금 운영과 같은 0001~0081 을 올리고, 옛 흐름(스위치가 꺼진 화면이 부르는 질의)이
   단계마다 그대로 되는지 봅니다.
   ⚠️ 되돌리기 SQL 은 **마이그레이션 파일의 주석에서 꺼내** 돌립니다 — 문서와
   검사가 다른 글을 들고 있으면 사장님이 붙여 넣는 글만 틀린 채 남습니다. */
const fs = require("fs"), path = require("path"), os = require("os");
module.exports = function(T){
  const { ok, psql, psqlFile, denied, allowed } = T;
  const DB = "stagetest";
  const ROOT = path.join(__dirname, "..", "..");
  console.log("\n════ 운영 순서 리허설 (0081 → 0082 → 0083 → 되돌리기) ════");

  psql("create database " + DB, "postgres");
  psqlFile("db/test/00_stub_auth.sql", DB);
  const migs = fs.readdirSync(path.join(ROOT, "db/migrations"))
    .filter(f => /^\d{4}_.*\.sql$/.test(f) && !/_down\.sql$/.test(f)).sort();
  const upto = n => migs.filter(f => parseInt(f.slice(0, 4), 10) <= n);
  upto(81).forEach(f => psqlFile("db/migrations/" + f, DB));
  ok("지금 운영과 같은 0081 상태를 만들었다", psql("select max(n) from schema_version", DB) === "81");

  const P = (s) => psql(s, DB), D = (s) => denied(s, DB), A = (s) => allowed(s, DB);
  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const back = "reset role; select become(null);";
  const last = s => String(s).split("\n").pop().trim();
  const why  = r => r.why || "";
  const U = e => P("insert into auth.users (email) values ('" + e + "@x.test') returning id");
  const CUS = U("st-cus"), STF = U("st-stf"), PA = U("st-pa");
  P("insert into provider (id, name, listed, state, is_test, subs, regions) values " +
    "('st-a','리허설레슨', true, 'approved', false, '{ls-solo}', '{seoul}')");
  P("insert into account (id, role, name, provider_id) values " +
    "('" + CUS + "','customer','손님', null),('" + STF + "','staff','직원', null)," +
    "('" + PA + "','provider','업체', 'st-a') on conflict (id) do update set role = excluded.role, " +
    "provider_id = excluded.provider_id");
  P("update provider set assignable = true where id = 'st-a'");

  /* 옛 흐름 — 스위치가 꺼진 화면이 부르는 문 그대로 */
  let telN = 0;
  function oldFlow(tag){
    const no = last(P(as(CUS) + "select make_request(jsonb_build_object('name','손님','tel','010-6000-" +
      String(1000 + (++telN)) + "','region','seoul','cat','lesson','services', jsonb_build_array('ls-solo')," +
      "'agree_at', now()::text));" + back));
    const rid = P("select id from request where no = '" + no + "'");
    const steps = [
      as(STF) + "select move_state('" + rid + "','check','{}'::jsonb);" + back,
      as(STF) + "select move_state('" + rid + "','assigned', jsonb_build_object('providerId','st-a','agree3rd','true','agree3rdHow','전화'));" + back,
      as(PA) + "select answer_assignment('" + rid + "', true);" + back,
      as(PA) + "select move_state('" + rid + "','consult','{}'::jsonb);" + back,
      as(PA) + "select submit_quote('" + rid + "', '{\"amount\":300000,\"scope\":\"8회\"}'::jsonb);" + back,
      as(CUS) + "select choose_quote('" + rid + "','st-a');" + back
    ];
    for(const s of steps){
      const r = A(s);
      if(!r.yes){ ok(tag + " — 옛 흐름(요청 → 배정 → 수락 → 견적 → 고르기)이 끝까지 간다", false, why(r)); return rid; }
    }
    ok(tag + " — 옛 흐름(요청 → 배정 → 수락 → 견적 → 고르기)이 끝까지 간다",
       P("select state from quote where request_id = '" + rid + "'") === "chosen");
    return rid;
  }
  /* 꺼진 화면의 질의 — 업체 작업실 · 운영자 배정이 표에서 연락처를 묻습니다 */
  function oldScreens(tag, rid, want){
    const a = A(as(PA) + "select tel from request where id = '" + rid + "';" + back);
    const b = A(as(STF) + "select name, tel, email from request where id = '" + rid + "';" + back);
    ok(tag + " — 꺼진 화면의 연락처 질의가 " + (want ? "된다" : "거절된다"),
       want ? (a.yes && b.yes) : (!a.yes && !b.yes), why(a) + " | " + why(b));
  }

  const chk = (tag) => {
    const r = (() => { try{ psqlFile("db/compare-check.sql", DB); return true; }catch(e){ return String(e.stderr || e).split("\n")[0]; } })();
    ok(tag + " — 단계 확인 SQL(db/compare-check.sql)이 돈다", r === true, r);
  };
  chk("0081");
  const R0 = oldFlow("0081");
  oldScreens("0081", R0, true);

  /* ── ① 0082 ─────────────────────────────────────────────────── */
  console.log("\n── ① 0082 (더하기만)");
  /* ⚠️⚠️ 가장 나쁜 경우 — 운영의 Supabase 기본 권한(anon 에게 함수 실행 · 표 전부)을
     그대로 둔 채 pre-apply 를 **건너뛰고** 올렸다고 칩니다. 그래도 비교 함수가
     비로그인에게 안 열려야 합니다(0082 가 스스로 거둡니다). */
  P("alter default privileges in schema public grant execute on functions to anon, authenticated");
  P("alter default privileges in schema public grant all on tables to anon, authenticated");
  psqlFile("db/migrations/" + upto(82).pop(), DB);
  ok("0082 가 올라갔다", P("select max(n) from schema_version") === "82");
  chk("0082");
  ok("  비로그인이 실행할 수 있는 비교 함수가 0개다",
     P("select count(*) from pg_proc p where p.proname in ('make_compare_request','assign_more','answer_compare','submit_compare_quote','pick_quote','compare_cat_ok','compare_bag_ok','compare_door_guard','compare_state_guard','compare_deal_guard') and has_function_privilege('anon', p.oid, 'execute')") === "0");
  oldScreens("0082", R0, true);
  /* ⚠️⚠️ 2026-11-17 — 화면은 이제 스위치와 상관없이 **보기로 먼저** 연락처를 읽습니다.
     0082 뒤부터 그 보기가 직원 · 수락한 업체에게 맞게 내주는지 — 그래야 0083 을
     비교견적보다 **먼저** 올려도 작업실 · 배정이 안 깨집니다. */
  ok("0082 — 바뀐 화면의 질의(보기)로 직원 · 수락한 업체가 연락처를 읽는다",
     last(P(as(STF) + "select count(*) from v_request_contact where id = '" + R0 + "';" + back)) === "1" &&
     last(P(as(PA) + "select count(*) from v_request_contact where id = '" + R0 + "';" + back)) === "1");
  oldFlow("0082");
  const again = (() => { try{ psqlFile("db/migrations/" + upto(82).pop(), DB); return true; }catch(e){ return false; } })();
  ok("0082 를 두 번 붙여 넣어도 끝까지 간다", again);
  const cno = last(P(as(CUS) + "select make_compare_request(jsonb_build_object('name','손님','tel','010-6000-9001'," +
    "'region','seoul','cat','lesson','services', jsonb_build_array('ls-solo'),'agree_at', now()::text));" + back));
  const CR = P("select id from request where no = '" + cno + "'");
  const g = D(as(STF) + "select assign_more(jsonb_build_object('request','" + CR + "','provider','st-a'));" + back);
  ok("0082 만으로는 비교 배정을 서버가 막는다 (0083 전)", g.no && /0083/.test(why(g)), why(g));

  /* ── ② 0083 ─────────────────────────────────────────────────── */
  console.log("\n── ② 0083 (연락처 칸 잠금 — 스위치 켠 화면이 나간 뒤)");
  psqlFile("db/migrations/" + upto(83).pop(), DB);
  oldScreens("0083", R0, false);
  chk("0083");
  P("alter default privileges in schema public revoke execute on functions from anon, authenticated");
  P("alter default privileges in schema public revoke all on tables from anon, authenticated");
  ok("0083 — 켠 화면의 질의(보기)로는 직원 · 수락한 업체 · 본인이 읽는다",
     last(P(as(STF) + "select count(*) from v_request_contact where id = '" + R0 + "';" + back)) === "1" &&
     last(P(as(PA) + "select count(*) from v_request_contact where id = '" + R0 + "';" + back)) === "1" &&
     last(P(as(CUS) + "select count(*) from v_request_contact where id = '" + R0 + "';" + back)) === "1");
  ok("0083 — 이제 비교 배정이 된다",
     A(as(STF) + "select assign_more(jsonb_build_object('request','" + CR + "','provider','st-a'));" + back).yes);
  ok("  연락처를 안 넘긴 배정의 업체는 보기로도 0줄",
     last(P(as(PA) + "select count(*) from v_request_contact where id = '" + CR + "';" + back)) === "0");

  /* ── ③ 되돌리기 — 주석의 글 그대로 ─────────────────────────────── */
  function rollbackOf(n){
    const f = path.join(ROOT, "db/migrations", upto(n).pop());
    const t = fs.readFileSync(f, "utf8");
    const tail = t.slice(t.lastIndexOf("되돌리기"));
    const lines = tail.split("\n").filter(l => /^-- /.test(l)).map(l => l.slice(3));
    const i = lines.findIndex(l => l.trim() === "begin;");
    const j = lines.findIndex(l => l.trim() === "commit;");
    const sql = lines.slice(i, j + 1).join("\n");
    const tmp = path.join(os.tmpdir(), "rb-" + n + "-" + process.pid + ".sql");
    fs.writeFileSync(tmp, sql);
    return tmp;
  }
  console.log("\n── ③ 되돌리기 (마이그레이션 주석의 글 그대로)");
  const r83 = (() => { try{ psqlFile(rollbackOf(83), DB); return true; }catch(e){ return String(e.stderr || e).split("\n")[0]; } })();
  ok("0083 되돌리기가 돈다", r83 === true, r83);
  oldScreens("0083 되돌린 뒤", R0, true);
  const r82 = (() => { try{ psqlFile(rollbackOf(82), DB); return true; }catch(e){ return String(e.stderr || e).split("\n")[0]; } })();
  ok("0082 되돌리기가 돈다 (비교 요청 · blind 배정이 남아 있어도)", r82 === true, r82);
  ok("  비교 문이 내려갔다",
     P("select count(*) from pg_proc where proname in ('make_compare_request','assign_more','pick_quote')") === "0");
  ok("  ⚠️ 칸은 남는다 (그 줄의 조건이 사라지지 않게)",
     P("select count(*) from request where compare") === "1");
  oldFlow("0082 되돌린 뒤");
  oldScreens("0082 되돌린 뒤", R0, true);
  const re = (() => { try{
    psqlFile("db/migrations/" + upto(82).pop(), DB); psqlFile("db/migrations/" + upto(83).pop(), DB); return true;
  }catch(e){ return String(e.stderr || e).split("\n")[0]; } })();
  ok("되돌린 뒤 0082 · 0083 을 다시 올려도 끝까지 간다", re === true, re);
  const dup = D(as(STF) + "select assign_more(jsonb_build_object('request','" + CR +
       "','provider','st-a'));" + back);
  ok("  다시 올린 뒤 비교 문이 살아 있다 (남아 있던 배정을 알아본다)",
     dup.no && /이미 배정/.test(why(dup)), why(dup));
  psql("drop database " + DB + " with (force)", "postgres");
};

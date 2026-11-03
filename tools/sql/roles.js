/* ════════════════════════════════════════════════════════════════════
   0024 · 0025 를 **눌러 봅니다** — 중고폰 걷어내기 · 여러 역할

   ⚠️⚠️ **자물쇠가 겹치면 검사를 속입니다.** 하나를 빼 봐도 다른 것이
   먼저 막아서 **엉뚱한 까닭으로 통과**합니다. 그래서 GRANT 와 RLS 를
   **따로** 눌러 보고, 거절하는 **말까지** 맞춰 봅니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, psqlFile, denied, allowed } = T;

  /* ── 씨앗 ─────────────────────────────────────────────────────── */
  const A = psql("insert into auth.users (email) values ('a@x.test') returning id");
  const B = psql("insert into auth.users (email) values ('b@x.test') returning id");
  const M = psql("insert into auth.users (email) values ('m@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + A + "','customer','가가'), ('" + B + "','customer','나나'), " +
       "('" + M + "','admin','관리자') on conflict (id) do update set role = excluded.role");

  /* 그 사람으로 접속한 셈 + authenticated 로 갈아입기 */
  const as = u => "select become('" + u + "'); set role authenticated; ";
  /* ⚠️ 앞에 세미콜론을 꼭 둡니다 — 없으면 앞 문장에 글자가 그대로
     이어 붙어 "textreset" 같은 엉뚱한 에러가 납니다. */
  const back = "; reset role; ";

  console.log("\n── 0024 중고폰 찌꺼기가 실제로 걷혔는가");
  ok("기기 재고 표 넷이 없다",
     psql("select count(*)::text from pg_tables where schemaname='public' " +
          "and tablename in ('device','device_check','device_cost','device_move')") === "0");
  ok("기기 손익 보기(v_device_pl)가 없다",
     psql("select count(*)::text from pg_views where schemaname='public' and viewname='v_device_pl'") === "0");
  ok("기기 종류 둘이 없다",
     psql("select count(*)::text from pg_type where typname in ('device_state','device_cost_kind')") === "0");
  ok("provider.inhouse 칸이 없다",
     psql("select count(*)::text from information_schema.columns " +
          "where table_name='provider' and column_name='inhouse'") === "0");
  ok("중고폰 수익상품 열일곱 줄이 없다",
     psql("select count(*)::text from offer where id in " +
          "('ph-buyin','fix-match','shop-sale','corp-buyin','export-buyer')") === "0");

  /* ⚠️ 지우면 안 되는 것 — 업종과 무관한 자물쇠입니다 */
  ok("역할 자물쇠 account_role_guard() 는 남아 있다",
     psql("select count(*)::text from pg_proc where proname='account_role_guard'") === "1");
  ok("업체 자물쇠 provider_guard() 는 남아 있다",
     psql("select count(*)::text from pg_proc where proname='provider_guard'") === "1");
  ok("provider_guard() 가 이제 inhouse 를 안 본다",
     psql("select (prosrc like '%inhouse%')::text from pg_proc where proname='provider_guard'") === "false");

  /* ⚠️⚠️ **앞 번호를 다시 붙여 넣으면 뒤 번호가 조용히 내려갑니다.**
     create or replace 는 에러를 안 냅니다. 실제로 그렇게 되는지 여기서
     보여 주고, 다시 올리면 돌아오는지도 봅니다. */
  psqlFile("db/migrations/0021_inhouse.sql");
  ok("0021 을 다시 붙여 넣으면 provider_guard() 가 0021 판으로 내려간다",
     psql("select (prosrc like '%inhouse%')::text from pg_proc where proname='provider_guard'") === "true");
  psqlFile("db/migrations/0024_golf_reset.sql");
  ok("0024 를 다시 올리면 되돌아온다",
     psql("select (prosrc like '%inhouse%')::text from pg_proc where proname='provider_guard'") === "false");

  console.log("\n── 0025 한 계정이 여러 역할 (지시서 6번)");
  ok("⚠️ member_hat 에 admin 이 없다 (화면에서 관리자를 만들 수 없습니다)",
     psql("select count(*)::text from pg_enum e join pg_type t on t.oid=e.enumtypid " +
          "where t.typname='member_hat' and e.enumlabel='admin'") === "0");
  ok("member_hat 은 seller · pro · biz 셋뿐이다",
     psql("select string_agg(e.enumlabel, ',' order by e.enumsortorder) from pg_enum e " +
          "join pg_type t on t.oid=e.enumtypid where t.typname='member_hat'") === "seller,pro,biz");

  ok("처음에는 아무 역할도 없다",
     psql(as(A) + "select my_hats()::text" + back) === "{}");

  ok("판매자를 스스로 켤 수 있다",
     psql(as(A) + "select add_my_hat('seller','중고채 팔려고')::text" + back) === "{seller}");
  ok("두 번 켜도 하나다",
     psql(as(A) + "select add_my_hat('seller')::text" + back) === "{seller}");
  ok("프로도 같이 켜진다 (한 계정에 여러 역할)",
     psql(as(A) + "select add_my_hat('pro')::text" + back) === "{seller,pro}");
  ok("has_hat() 이 맞게 답한다",
     psql(as(A) + "select has_hat('pro')::text" + back) === "true");
  ok("안 켠 역할은 false",
     psql(as(A) + "select has_hat('biz')::text" + back) === "false");

  /* ⚠️ 거절하는 **말까지** 맞춰 봅니다 — 다른 자물쇠가 먼저 막아서
     엉뚱한 까닭으로 통과하는 것을 가려냅니다. */
  let d = denied(as(A) + "select add_my_hat('biz')" + back);
  ok("사업자 회원을 스스로 못 켠다", d.no && /스스로 켤 수 없습니다/.test(d.why), d.why);
  d = denied(as(A) + "select drop_my_hat('biz')" + back);
  ok("사업자 회원을 스스로 못 뗀다 (다른 말로 거절)",
     d.no && /스스로 뗄 수 없습니다/.test(d.why), d.why);

  psql("select become(null)");
  d = denied("set role authenticated; select add_my_hat('seller')" + back);
  ok("로그인 안 하면 막힌다 (또 다른 말)", d.no && /로그인이 필요합니다/.test(d.why), d.why);

  ok("남의 역할은 안 보인다 (RLS)",
     psql(as(B) + "select count(*)::text from account_hat" + back) === "0");
  ok("내 역할은 보인다 (RLS)",
     psql(as(A) + "select count(*)::text from account_hat" + back) === "2");

  console.log("\n── 자물쇠를 **하나씩** 빼서 어느 것이 막는지 가립니다");
  /* ① 지금은 GRANT 가 막습니다 */
  d = denied(as(B) + "insert into account_hat (account_id, hat) values ('" + B + "','biz')" + back);
  ok("① 직접 넣기가 막힌다 — GRANT 가 먼저",
     d.no && /permission denied/i.test(d.why), d.why);
  /* ② GRANT 를 잠깐 열고 RLS 가 **따로** 막는지 봅니다 */
  psql("grant insert on account_hat to authenticated");
  d = denied(as(B) + "insert into account_hat (account_id, hat) values ('" + B + "','biz')" + back);
  ok("② GRANT 를 열어도 RLS 가 막는다 — 다른 말로 거절",
     d.no && /row-level security|정책|policy/i.test(d.why), d.why);
  psql("revoke insert on account_hat from authenticated");
  d = denied(as(B) + "insert into account_hat (account_id, hat) values ('" + B + "','biz')" + back);
  ok("③ 다시 닫으면 또 GRANT 가 막는다",
     d.no && /permission denied/i.test(d.why), d.why);

  console.log("\n── 사업자 회원은 운영자만 붙입니다");
  d = denied(as(B) + "select grant_hat('" + B + "','biz','내가 붙이겠다')" + back);
  ok("일반 회원은 못 붙인다", d.no && /운영자만/.test(d.why), d.why);
  d = denied(as(M) + "select grant_hat('" + B + "','biz','')" + back);
  ok("까닭 없이 붙이면 막힌다 (다른 말)", d.no && /까닭을 적어야/.test(d.why), d.why);
  d = denied(as(M) + "select grant_hat('00000000-0000-0000-0000-000000000000','biz','없는 사람')" + back);
  ok("없는 회원에게는 못 붙인다 (또 다른 말)", d.no && /그런 회원이 없습니다/.test(d.why), d.why);

  const r = allowed(as(M) + "select grant_hat('" + B + "','biz','입점 신청 승인')::text" + back);
  ok("운영자는 붙인다", r.yes && r.out === "{biz}", r.yes ? r.out : r.why);
  ok("감사 기록이 남는다",
     psql("select count(*)::text from audit_log where obj='account_hat' and obj_id='" + B + "'") === "1");
  ok("감사 기록에 까닭이 그대로 적힌다",
     psql("select why from audit_log where obj='account_hat' and obj_id='" + B + "'") === "입점 신청 승인");

  /* ⚠️ **너무 넓게 막는 것도 고장입니다.** 정상 조건이 제대로 되는지
     같이 봅니다 — 위에서 add_my_hat · grant_hat 둘 다 되는 것을 봤습니다. */
  ok("운영자가 붙인 뒤에도 본인은 그 역할을 뗄 수 없다",
     denied(as(B) + "select drop_my_hat('biz')" + back).no);
  ok("본인이 켠 역할은 본인이 뗀다 (정상 길이 막히지 않았다)",
     psql(as(A) + "select drop_my_hat('pro')::text" + back) === "{seller}");

  console.log("\n── 0028 업체 계정에 사업자 모자가 저절로 따라오는가");
  psql("insert into provider (id, name, listed) values ('gp-hat','모자테스트 골프샵', true) " +
       "on conflict (id) do nothing");
  const P = psql("insert into auth.users (email) values ('pv@x.test') returning id");
  psql("insert into account (id, role, name) values ('" + P + "','customer','업체사장') " +
       "on conflict (id) do update set role = excluded.role");
  ok("아직은 모자가 없다",
     psql("select count(*)::text from account_hat where account_id='" + P + "'") === "0");

  psql("update account set role='provider', provider_id='gp-hat' where id='" + P + "'");
  ok("업체로 이으면 biz 가 **저절로** 붙는다",
     psql("select count(*)::text from account_hat where account_id='" + P +
          "' and hat='biz'") === "1");
  ok("저절로 붙은 것도 감사 기록에 남는다",
     psql("select count(*)::text from audit_log where obj='account_hat' " +
          "and obj_id='" + P + "' and why like '%자동으로 붙음%'") === "1");

  /* ⚠️ 두 번 눌러도 기록이 쌓이지 않아야 합니다 */
  psql("update account set provider_id='gp-hat' where id='" + P + "'");
  ok("같은 값으로 다시 저장해도 기록이 안 쌓인다",
     psql("select count(*)::text from audit_log where obj='account_hat' " +
          "and obj_id='" + P + "' and why like '%자동으로 붙음%'") === "1");

  psql("update account set role='customer', provider_id=null where id='" + P + "'");
  ok("업체 계정을 풀면 biz 가 **저절로** 떨어진다",
     psql("select count(*)::text from account_hat where account_id='" + P +
          "' and hat='biz'") === "0");
  ok("떨어진 것도 감사 기록에 남는다",
     psql("select count(*)::text from audit_log where obj='account_hat' " +
          "and obj_id='" + P + "' and why like '%자동으로 떨어짐%'") === "1");

  /* ⚠️ 너무 넓게 막지 않았는가 — 본인이 켠 seller 는 그대로 있어야 합니다 */
  psql("select become('" + P + "'); set role authenticated; " +
       "select add_my_hat('seller','중고채')" + back);
  psql("update account set role='provider', provider_id='gp-hat' where id='" + P + "'");
  ok("자동으로 붙고 떨어져도 본인이 켠 모자는 건드리지 않는다",
     psql("select string_agg(hat::text, ',' order by hat) from account_hat " +
          "where account_id='" + P + "'") === "seller,biz");
};

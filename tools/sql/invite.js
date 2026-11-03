/* ════════════════════════════════════════════════════════════════════
   업체 담당자 **초대**를 눌러 봅니다 (0043 · 4차 지시서 §2-1 · §6-D)

   ⚠️⚠️⚠️ **역할을 올리는 길입니다 — 가장 조심해야 하는 자리입니다.**
   0018 이 이 연결을 일부러 화면 없이 두었던 까닭이 "화면에서 역할을
   올릴 수 있으면 그게 가장 큰 구멍" 이어서입니다. 그래서 자물쇠를
   **하나씩 따로** 눌러 봅니다 — 겹쳐 재면 하나가 내려가도 다른 것이
   먼저 막아서 **엉뚱한 까닭으로 통과**합니다.

   ⚠️⚠️ **코드는 가진 사람이 쓰는 열쇠**라 — 한 번만 · 기한 · 거둠 ·
   새 코드를 내면 옛 코드가 죽는지까지 봅니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0043 담당자 초대 — 씨앗");
  const ADM = psql("insert into auth.users (email) values ('iv-adm@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('iv-cus@x.test') returning id");
  const CU2 = psql("insert into auth.users (email) values ('iv-cu2@x.test') returning id");
  const PRO = psql("insert into auth.users (email) values ('iv-pro@x.test') returning id");

  psql("insert into provider (id, name, listed, is_test, subs, state) values " +
       "('iv-a','[검사용] 초대 업체', true, true, '{ls-solo}', 'approved')," +
       "('iv-b','[검사용] 다른 업체', true, true, '{ls-solo}', 'approved') " +
       "on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + ADM + "','admin','초대 관리자', null)," +
       "('" + CUS + "','customer','초대받을 사람', null)," +
       "('" + CU2 + "','customer','다른 손님', null)," +
       "('" + PRO + "','provider','남의 업체 사람','iv-b') " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");

  const as = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const mk = (u, o) => as(u) + "select make_provider_invite('" +
    JSON.stringify(o).replace(/'/g, "''") + "'::jsonb)";
  const use = (u, code) => as(u) + "select redeem_provider_invite(" +
    "jsonb_build_object('code','" + code + "'))";

  console.log("\n── 누가 코드를 낼 수 있나");
  const byAnon = denied(anon + "select make_provider_invite('{\"provider\":\"iv-a\"}'::jsonb)");
  ok("비로그인은 못 낸다", byAnon.no, byAnon.why);
  const byCus = denied(mk(CUS, { provider:"iv-a" }));
  ok("손님은 못 낸다", byCus.no, byCus.why);
  const byPro = denied(mk(PRO, { provider:"iv-a" }));
  ok("⚠️ 업체도 못 낸다 (제 담당자를 스스로 늘릴 수 없습니다)", byPro.no, byPro.why);
  const noPv = denied(mk(ADM, {}));
  ok("어느 업체인지 안 적으면 막힌다", noPv.no, noPv.why);
  const ghost = denied(mk(ADM, { provider:"없는업체" }));
  ok("없는 업체면 막힌다", ghost.no, ghost.why);

  console.log("\n── 코드를 냅니다");
  const CODE = psql(mk(ADM, { provider:"iv-a" }));
  /* ⚠️ 헷갈리는 글자(0 · O · 1 · I · L)를 안 씁니다 — 전화로 불러 줍니다 */
  ok("코드가 열 글자다", /^[2-9A-HJ-NP-Z]{10}$/.test(CODE), CODE);
  ok("⚠️ 헷갈리는 글자(0 · O · 1 · I · L)가 없다",
     !/[01OIL]/.test(CODE), CODE);
  ok("기한이 생긴다 (기본 14일)",
     psql("select (expires_at > now() + interval '13 days')::text " +
          "from provider_invite where code='" + CODE + "'") === "true");
  /* ⚠️⚠️ 감사 기록에 **코드를 적지 않습니다** — 기록이 곧 열쇠가 됩니다 */
  ok("⚠️ 감사 기록에 **코드가 안 실린다**",
     psql("select count(*)::text from audit_log where obj='provider_invite' " +
          "and coalesce(data::text,'') like '%" + CODE + "%'") === "0");

  console.log("\n── ⚠️⚠️ 아무도 표를 직접 못 읽습니다 (코드는 열쇠입니다)");
  const readAnon = denied(anon + "select count(*) from provider_invite");
  ok("anon 은 표를 못 읽는다 (GRANT)", readAnon.no, readAnon.why);
  const readCus = denied(as(CUS) + "select count(*) from provider_invite");
  ok("로그인한 손님도 표를 못 읽는다 (GRANT)", readCus.no, readCus.why);
  const readPro = denied(as(PRO) + "select count(*) from provider_invite");
  ok("업체도 표를 못 읽는다", readPro.no, readPro.why);
  /* 운영자가 보는 길은 보기 하나입니다 — ⚠️ 보기는 RLS 를 지나지
     않으므로 그 where 절(`my_role()`)이 자물쇠입니다. */
  ok("운영자는 **보기**로 본다",
     Number(psql(as(ADM) + "select count(*)::text from v_provider_invite_admin " +
                 "where code='" + CODE + "'")) === 1);
  ok("⚠️ 손님은 그 보기에서 **0줄**을 받는다 (보기의 where 가 자물쇠입니다)",
     psql(as(CUS) + "select count(*)::text from v_provider_invite_admin") === "0");
  ok("  업체도 0줄이다",
     psql(as(PRO) + "select count(*)::text from v_provider_invite_admin") === "0");

  console.log("\n── 누가 코드를 쓸 수 있나 — ⚠️ 자물쇠를 **하나씩**");
  const anonUse = denied(anon + "select redeem_provider_invite(" +
    "jsonb_build_object('code','" + CODE + "'))");
  ok("비로그인은 못 쓴다", anonUse.no, anonUse.why);
  /* ⚠️⚠️ **운영자는 업체가 될 수 없습니다** (0021 §10) */
  const admUse = denied(use(ADM, CODE));
  ok("⚠️ 운영자 계정은 못 쓴다 (§10 — 내는 쪽과 보는 쪽)", admUse.no, admUse.why);
  ok("  그 거절이 **같은 계정일 수 없다**고 말한다",
     admUse.no && admUse.why.indexOf("같은 계정") >= 0, admUse.why);
  /* ⚠️ 이미 다른 업체에 이어진 계정 */
  const proUse = denied(use(PRO, CODE));
  ok("⚠️ 이미 다른 업체의 담당자는 못 쓴다", proUse.no, proUse.why);
  ok("  그 거절이 **다른 말**이다 (어느 자물쇠인지 알아야 합니다)",
     proUse.no && proUse.why !== admUse.why, proUse.why);
  /* ⚠️ 없는 코드와 끝난 코드는 **같은 말**로 거절합니다 (찍어 보는
     사람에게 "있긴 있다" 를 알려 주지 않습니다) */
  const ghostCode = denied(use(CUS, "ZZZZZZZZZZ"));
  ok("없는 코드는 막힌다", ghostCode.no, ghostCode.why);

  console.log("\n── 씁니다 — 계정이 그 업체에 이어집니다");
  const got = allowed(use(CUS, CODE));
  ok("초대받은 사람이 코드를 쓴다", got.yes, got.why);
  ok("  업체 이름을 돌려준다 (어디에 이어졌는지 말해 줍니다)",
     got.out.indexOf("초대 업체") >= 0, got.out);
  ok("⚠️ 역할이 **업체**가 된다",
     psql("select role::text from account where id='" + CUS + "'") === "provider");
  ok("⚠️ 그 업체에 이어진다",
     psql("select provider_id from account where id='" + CUS + "'") === "iv-a");
  ok("  쓴 사람과 때가 남는다",
     psql("select (used_at is not null)::text || '/' || (used_by = '" + CUS +
          "')::text from provider_invite where code='" + CODE + "'") === "true/true");
  ok("  감사 기록이 남는다",
     Number(psql("select count(*)::text from audit_log where obj='account' " +
                 "and to_state='provider'")) >= 1);
  /* ⚠️⚠️ **한 번만** 씁니다 */
  const again = denied(use(CU2, CODE));
  ok("⚠️ 같은 코드를 두 번 못 쓴다", again.no, again.why);
  ok("  그 거절이 **이미 쓰였다**고 말한다",
     again.no && again.why.indexOf("이미 쓰인") >= 0, again.why);
  const self = denied(use(CUS, CODE));
  ok("이미 그 업체 담당자면 **다른 말로** 거절한다", self.no, self.why);

  console.log("\n── ⚠️ 새 코드를 내면 **옛 코드가 죽습니다**");
  const C1 = psql(mk(ADM, { provider:"iv-b" }));
  const C2 = psql(mk(ADM, { provider:"iv-b" }));
  ok("두 코드가 다르다", C1 !== C2, C1 + " / " + C2);
  ok("⚠️ 옛 코드가 **거두어진다** (살아 있는 열쇠는 하나뿐입니다)",
     psql("select (void_at is not null)::text from provider_invite where code='" +
          C1 + "'") === "true");
  const dead = denied(use(CU2, C1));
  ok("  거둔 코드는 못 쓴다", dead.no, dead.why);

  console.log("\n── 기한 · 거두기");
  /* ⚠️ 기한을 **지나게 해서** 눌러 봅니다 (적어만 두면 안 잽니다) */
  psql("update provider_invite set expires_at = now() - interval '1 hour' " +
       "where code='" + C2 + "'");
  const old = denied(use(CU2, C2));
  ok("기한이 지난 코드는 못 쓴다", old.no, old.why);
  ok("  그 거절이 **기한**이라고 말한다",
     old.no && old.why.indexOf("기한") >= 0, old.why);

  const C3 = psql(mk(ADM, { provider:"iv-b" }));
  const voidNoWhy = denied(as(ADM) + "select void_provider_invite(" +
    "jsonb_build_object('code','" + C3 + "'))");
  ok("까닭 없이는 못 거둔다", voidNoWhy.no, voidNoWhy.why);
  const voidByCus = denied(as(CU2) + "select void_provider_invite(" +
    "jsonb_build_object('code','" + C3 + "','why','손님이 거둬 봅니다'))");
  ok("손님은 못 거둔다", voidByCus.no, voidByCus.why);
  ok("운영자가 거둔다",
     allowed(as(ADM) + "select void_provider_invite(jsonb_build_object('code','" +
             C3 + "','why','잘못 냈습니다'))").yes);
  const useVoid = denied(use(CU2, C3));
  ok("  거둔 코드는 못 쓴다", useVoid.no, useVoid.why);

  console.log("\n── ⚠️ 정지된 업체에는 담당자를 새로 안 들입니다");
  psql(as(ADM) + "select set_provider_state(jsonb_build_object('id','iv-b'," +
       "'to','suspended','why','검사'))");
  const sus = denied(mk(ADM, { provider:"iv-b" }));
  ok("정지된 업체에는 코드를 못 낸다", sus.no, sus.why);
  ok("  그 거절이 **정지를 먼저 풀라**고 말한다",
     sus.no && sus.why.indexOf("정지") >= 0, sus.why);
  psql(as(ADM) + "select set_provider_state(jsonb_build_object('id','iv-b','to','approved'))");
  ok("  정지를 풀면 다시 낼 수 있다 (너무 넓게 막는 것도 고장입니다)",
     allowed(mk(ADM, { provider:"iv-b" })).yes);
};

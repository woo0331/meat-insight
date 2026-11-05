/* ════════════════════════════════════════════════════════════════════
   업체 담당자 명단 · 내보내기 — 눌러 봅니다 (0052)

   ⚠️⚠️ **여기서 재는 것 둘** —
     ① 명단이 **누구에게 무엇까지** 보이는가 (이름을 가리는 자리)
     ② 내보내는 문이 **운영자만** 열고, **마지막 담당자**를 막는가

   ⚠️⚠️ 자물쇠를 **따로** 눌러 봅니다. 보기의 `where` 절과 이름을
   가리는 `case` 는 **다른 자물쇠**입니다 — 줄이 보이는가와 그 줄에
   본이름이 담겼는가를 갈라서 셉니다. 하나만 보고 "막혔다" 고 읽으면
   나머지가 장식인지 알 수 없습니다.

   ⚠️ 재는 것은 늘 **문**입니다 (`drop_provider_staff`). 표에 바로
   `update account set provider_id = null` 을 하면 자물쇠를 통째로
   지나가고, 그 초록은 아무 뜻이 없습니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0052 업체 담당자 명단 — 씨앗");
  /* ⚠️⚠️ **다른 검사와 id 가 부딪히면 조용히 물려받습니다** — 0051 에서
     `pp-a` 가 `tools/sql/price.js` 와 겹쳐 뒤 검사가 엉뚱하게 떨어졌고,
     까닭을 찾는 데 한참 걸렸습니다. 앞머리를 `pvs-` 로 가르고, **이미
     있으면 그 자리에서 큰 소리로** 멈춥니다. */
  const taken = psql("select coalesce(string_agg(id, ','), '') from provider " +
    "where id in ('pvs-a','pvs-b','pvs-n')");
  ok("⚠️⚠️ 쓸 업체 id 가 **비어 있다** (다른 검사와 안 부딪힙니다)",
     taken === "", "이미 있습니다 — " + taken);

  const P1  = psql("insert into auth.users (email) values ('pvs-p1@x.test') returning id");
  const P2  = psql("insert into auth.users (email) values ('pvs-p2@x.test') returning id");
  const P3  = psql("insert into auth.users (email) values ('pvs-p3@x.test') returning id");
  const SOLO= psql("insert into auth.users (email) values ('pvs-solo@x.test') returning id");
  const OTH = psql("insert into auth.users (email) values ('pvs-oth@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('pvs-cus@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('pvs-adm@x.test') returning id");

  /* ⚠️⚠️ **`assignable` 을 나중에 못 켭니다** — 0018 의 트리거가 "업체
     계정이 이어져 있지 않습니다" 로 막고, 켜는 문(`approve_provider`)도
     같은 것을 봅니다. 그래서 **담당자를 먼저 심고** 그 뒤에 문으로
     켭니다 (상태를 억지로 바꾸지 않고 차례를 지킵니다).
     ⚠️ `pvs-n` 은 배정 가능을 **끈 채** 둡니다 — 마지막 담당자를 떼는
     것이 그때는 되어야 합니다 (막는 까닭이 없어집니다). */
  psql("insert into provider (id, name, listed, state, is_test) values " +
       "('pvs-a','담당자셋인골프장', true, 'approved', false)," +
       "('pvs-b','다른골프장', true, 'approved', false)," +
       "('pvs-n','배정안받는골프장', true, 'approved', false) " +
       "on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + P1   + "','provider','김일담','pvs-a')," +
       "('" + P2   + "','provider','이이담','pvs-a')," +
       "('" + P3   + "','provider','박삼담','pvs-a')," +
       "('" + SOLO + "','provider','최혼자','pvs-b')," +
       "('" + OTH  + "','provider','정다른','pvs-n')," +
       "('" + CUS  + "','customer','손님', null)," +
       "('" + ADM  + "','admin','담당 관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");

  /* ⚠️⚠️ **갯수를 박지 않습니다.** 이 DB 에는 앞 검사들이 만든 업체
     담당자가 스물 몇 명 있습니다 — 전체를 세면 검사가 늘 때마다
     멀쩡한 보기가 실패로 잡힙니다. 운영자 쪽을 셀 때는 **제 씨앗으로
     좁혀서** 셉니다. */
  const MINE = "where provider_id in ('pvs-a','pvs-b','pvs-n')";
  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const J    = o => JSON.stringify(o).replace(/'/g, "''");
  const kick = (who, args) => as(who) + "select drop_provider_staff('" +
    J(args) + "'::jsonb)";

  /* ⚠️ 배정 가능을 **문으로** 켭니다 (표를 직접 고치면 0018 의 트리거와
     칸 GRANT 가 막습니다 — 둘 다 맞는 동작입니다). */
  const on = allowed(as(ADM) + "select approve_provider('pvs-a', null, null, " +
    "'검사', true)");
  ok("씨앗 — 담당자가 있으니 배정 가능이 **켜진다** (0018 의 차례)",
     on.yes, on.why);
  const on2 = allowed(as(ADM) + "select approve_provider('pvs-b', null, null, " +
    "'검사', true)");
  ok("  혼자인 업체도 켜진다 (담당자 한 명이면 이어진 것입니다)", on2.yes, on2.why);

  // ── ① 명단이 보이는가 — 줄 ────────────────────────────────────
  console.log("\n── ① 명단 — **줄이 누구에게 보이는가** (보기의 where 절)");
  ok("그 업체 담당자는 **제 업체 명단 셋**을 본다",
     psql(as(P1) + "select count(*) from v_provider_staff") === "3",
     psql(as(P1) + "select count(*) from v_provider_staff"));
  ok("⚠️ 그 명단에 **다른 업체 사람은 한 줄도** 없다",
     psql(as(P1) + "select count(*) from v_provider_staff " +
          "where provider_id <> 'pvs-a'") === "0");
  ok("다른 업체 담당자는 **제 업체만** 본다 (한 줄)",
     psql(as(SOLO) + "select count(*) from v_provider_staff") === "1");
  /* ⚠️⚠️ **NULL 이 자물쇠를 여는 자리인가** — 일반 회원은
     `my_provider()` 가 NULL 입니다. `a.provider_id = NULL` 은 NULL 이고
     `where` 는 NULL 을 참으로 치지 않으므로 0줄이어야 합니다.
     0034 에서 `not(NULL or …)` 가 자물쇠를 통째로 열었던 그 자리라,
     **눌러 보고** 셉니다 (읽고 결론 내지 않습니다). */
  ok("⚠️⚠️ 일반 회원에게는 **한 줄도** 안 보인다 (NULL 이 여는 자리가 아닙니다)",
     psql(as(CUS) + "select count(*) from v_provider_staff") === "0");
  /* ⚠️⚠️ **anon 은 0줄이 아니라 질의가 통째로 거절됩니다** — 보기에
     GRANT 를 `authenticated` 에게만 줬기 때문입니다. 처음에 0줄로
     재다가 `permission denied for view` 를 받았는데, 그건 **맞는
     동작이고 틀린 것은 검사**였습니다 (0050 의 칸 GRANT 에서 밟은
     그 자리입니다). 거절은 0줄보다 **센 자물쇠**이므로 그렇게 셉니다. */
  const na = denied(anon + "select count(*) from v_provider_staff");
  ok("⚠️ 로그인 안 한 사람은 **질의 자체가 거절**된다 (0줄보다 센 자물쇠입니다)",
     na.no && /permission denied/.test(na.why), na.why);
  /* ⚠️⚠️ **갯수를 박았다가 또 떨어졌습니다.** "운영자는 전부 본다" 를
     `count(*) = 5` 로 재 두었는데, 앞 검사들(0042 · 0043 · 0051 …)이
     만든 업체 담당자가 **스물여섯 명** 더 있어서 31 이 나왔습니다 —
     멀쩡한 보기를 실패로 잡은 것입니다. 재려는 뜻은 "운영자는 **남의
     업체 것까지** 보는가" 이므로, **제 씨앗으로 좁혀서** 셋을 세고
     **그 밖에도 보이는지**를 따로 봅니다 (전체 갯수를 박지 않습니다). */
  ok("운영자는 **제 업체가 아닌 것까지** 본다 (씨앗 셋 + 혼자 + 다른)",
     psql(as(ADM) + "select count(*) from v_provider_staff " + MINE) === "5",
     psql(as(ADM) + "select count(*) from v_provider_staff " + MINE));
  ok("  ⚠️ 그 밖의 업체 담당자도 보인다 (0이면 좁히는 자물쇠가 남아 있습니다)",
     Number(psql(as(ADM) + "select count(*) from v_provider_staff " +
       "where provider_id not in ('pvs-a','pvs-b','pvs-n')")) > 0);

  // ── ② 이름을 가리는가 — 같은 줄의 **다른** 자물쇠 ──────────────
  console.log("\n── ② 이름 — **그 줄에 본이름이 담겼는가** (가리는 case)");
  ok("⚠️⚠️ 동료 이름은 **가려서** 나온다 (김** · 이** · 박**)",
     psql(as(P1) + "select string_agg(who, ',' order by who) " +
          "from v_provider_staff where is_me = false") === "박**,이**",
     psql(as(P1) + "select string_agg(who, ',' order by who) " +
          "from v_provider_staff where is_me = false"));
  ok("  ⚠️ 동료의 **본이름이 글자로 한 번도** 안 나온다",
     psql(as(P1) + "select count(*) from v_provider_staff " +
          "where who in ('이이담','박삼담')") === "0");
  ok("제 줄은 **제 이름 그대로** 본다 (자기 정보입니다)",
     psql(as(P1) + "select who from v_provider_staff where is_me") === "김일담");
  ok("  내가 누구인지 표시가 **한 줄에만** 붙는다",
     psql(as(P1) + "select count(*) from v_provider_staff where is_me") === "1");
  ok("운영자는 **본이름을 전부** 본다 (내보낼 사람을 골라야 합니다)",
     psql(as(ADM) + "select string_agg(who, ',' order by who) " +
          "from v_provider_staff where provider_id = 'pvs-a'") === "김일담,박삼담,이이담",
     psql(as(ADM) + "select string_agg(who, ',' order by who) " +
          "from v_provider_staff where provider_id = 'pvs-a'"));
  /* ⚠️ uuid 도 운영자에게만 — 업체 담당자에게는 쓸 데가 없습니다 */
  ok("⚠️ 동료의 uuid 는 업체 담당자에게 **안 나온다** (전부 비어 있습니다)",
     psql(as(P1) + "select count(*) from v_provider_staff " +
          "where account_id is not null") === "0");
  ok("  운영자에게는 나온다 (그것으로 골라 내보냅니다)",
     psql(as(ADM) + "select count(*) from v_provider_staff " + MINE +
          " and account_id is not null") === "5");
  /* ⚠️⚠️ **이름이 비면 "회원"** 입니다 — 별표만 찍으면 고장처럼 보입니다 */
  psql("update account set name = null where id = '" + P3 + "'");
  ok("⚠️ 이름이 비어 있으면 **회원** 이라고 적는다 (별표만 찍지 않습니다)",
     psql(as(P1) + "select who from v_provider_staff " +
          "where provider_id = 'pvs-a' and is_me = false and " +
          "who not like '%*%'") === "회원",
     psql(as(P1) + "select string_agg(who, ',') from v_provider_staff"));
  psql("update account set name = '박삼담' where id = '" + P3 + "'");

  // ── ③ 이어진 날 — 없는 것을 지어내지 않는가 ───────────────────
  console.log("\n── ③ 이어진 날 — **초대로 들어온 분만** 있습니다");
  ok("⚠️ SQL 로 이은 분은 이어진 날이 **비어 있다** (지어내지 않습니다)",
     psql(as(ADM) + "select count(*) from v_provider_staff " + MINE +
          " and joined_at is null") === "5");
  /* ⚠️⚠️ 초대로 들어오면 그 날이 찍혀야 합니다 — **문으로** 넣습니다
     (표에 직접 넣으면 그 길의 자물쇠를 지나갑니다). */
  const code = psql(as(ADM) + "select make_provider_invite('" +
    J({ provider:"pvs-a" }) + "'::jsonb)");
  const NEW = psql("insert into auth.users (email) values ('pvs-new@x.test') returning id");
  psql("insert into account (id, role, name) values ('" + NEW + "','customer','새담당') " +
       "on conflict (id) do update set role = 'customer', name = '새담당'");
  const red = allowed(as(NEW) + "select redeem_provider_invite('" +
    J({ code: code }) + "'::jsonb)");
  ok("초대 코드로 **넷째 담당자**가 들어온다 (한 업체에 여럿입니다)",
     red.yes && red.out === "담당자셋인골프장", red.why || red.out);
  ok("  그 분은 이어진 날이 **찍힌다**",
     psql(as(ADM) + "select count(*) from v_provider_staff " +
          "where account_id = '" + NEW + "' and joined_at is not null") === "1");
  ok("  명단이 **넷**이 된다",
     psql(as(P1) + "select count(*) from v_provider_staff") === "4");
  /* ⚠️⚠️ **같은 사람이 같은 업체에 두 번 이어지면 줄이 둘이 되는가** —
     lateral 로 하나만 가져오는 자리입니다. 그냥 join 이면 명단에 같은
     사람이 두 번 찍힙니다 (에러는 안 납니다). */
  /* ⚠️ 코드 꼴은 0043 의 check 가 봅니다 — 헷갈리는 글자(0 · O · 1 ·
     I · L)를 뺀 `[2-9A-HJ-NP-Z]{10}` 입니다. 처음에 `PVSOLDCODE` 로
     적었다가 O · L 때문에 거절당했습니다 (**맞는 동작이고 틀린 것은
     검사**입니다 — 전화로 불러 주는 코드라 그렇게 좁혀 둔 것입니다). */
  psql("insert into provider_invite (code, provider_id, expires_at, used_by, used_at) " +
       "values ('PVS2345678','pvs-a', now() + interval '1 day', '" + NEW +
       "', now() - interval '1 day') on conflict (code) do nothing");
  ok("⚠️⚠️ 두 번 이어진 적이 있어도 명단에 **한 번만** 나온다 (lateral)",
     psql(as(ADM) + "select count(*) from v_provider_staff " +
          "where account_id = '" + NEW + "'") === "1",
     psql(as(ADM) + "select count(*) from v_provider_staff " +
          "where account_id = '" + NEW + "'"));

  // ── ④ 내보내는 문 — 누가 열 수 있나 ───────────────────────────
  console.log("\n── ④ 내보내는 문 — **운영자만** 엽니다");
  const d1 = denied(kick(P1, { user:P2, why:"그만두셨습니다" }));
  ok("⚠️⚠️ 업체 사장님은 **동료를 못 뗀다** (남의 권한을 거두는 일입니다)",
     d1.no && /운영자만/.test(d1.why), d1.why);
  const d2 = denied(kick(CUS, { user:P2, why:"까닭" }));
  ok("일반 회원도 못 뗀다", d2.no, d2.why);
  const d3 = denied(anon + "select drop_provider_staff('" +
    J({ user:P2, why:"까닭" }) + "'::jsonb)");
  ok("로그인 안 하면 못 뗀다", d3.no, d3.why);
  ok("  ⚠️ 그래도 명단은 **그대로**다 (거절이 조용히 지나가지 않았습니다)",
     psql(as(ADM) + "select count(*) from v_provider_staff " +
          "where provider_id = 'pvs-a'") === "4");

  // ── ⑤ 자물쇠마다 다른 말 ───────────────────────────────────────
  console.log("\n── ⑤ 자물쇠마다 **다른 말**로 거절하는가");
  /* ⚠️⚠️ **재려는 것 말고는 전부 올바르게** 채웁니다 — 까닭을 빼고
     uuid 도 틀리게 넣으면 **앞 자물쇠가 먼저** 막아서 "여럿이 다른
     말로 거절한다" 가 엉뚱하게 떨어집니다 (0046 에서 겪었습니다).
     ⚠️ **같은 `if` 가 막는 입력은 둘로 세지 않습니다** — 빈 uuid 와
     못 읽는 uuid 는 같은 자물쇠입니다 (0047 에서 그것을 둘로 세어
     멀쩡한 코드를 실패로 잡았습니다). */
  const says = [
    ["uuid 가 비었다",   denied(kick(ADM, { user:"",      why:"까닭" }))],
    ["까닭이 비었다",     denied(kick(ADM, { user:P2,      why:"  " }))],
    ["그런 담당자가 없다", denied(kick(ADM, { user:CUS,     why:"까닭" }))],
    ["운영자가 아니다",   d1]
  ];
  says.forEach(function(s){
    ok("  " + s[0] + " — 거절한다", s[1].no, JSON.stringify(s[1]));
  });
  const words = says.map(s => (s[1].why || "").replace(/^ERROR:\s*/, ""));
  ok("⚠️⚠️ 넷이 **서로 다른 말**로 거절한다 (어느 자물쇠인지 알아야 합니다)",
     new Set(words).size === 4, JSON.stringify(words));
  /* ⚠️ 못 읽는 uuid 는 **빈 것과 같은 자물쇠**입니다 — 말이 같은 것이
     맞습니다 (다르면 그 자리가 둘로 갈린 것입니다). */
  const bad = denied(kick(ADM, { user:"이건-uuid-가-아닙니다", why:"까닭" }));
  ok("  못 읽는 uuid 도 **같은 말**로 거절한다 (같은 자물쇠입니다)",
     bad.no && bad.why === says[0][1].why, bad.why);

  // ── ⑥ 마지막 담당자 ───────────────────────────────────────────
  console.log("\n── ⑥ **마지막 담당자**는 그냥 못 뗍니다 (0018 의 까닭)");
  const last = denied(kick(ADM, { user:SOLO, why:"그만두셨습니다" }));
  ok("⚠️⚠️ 배정 가능이 켜진 업체의 **마지막 담당자**는 거절한다",
     last.no && /마지막 담당자/.test(last.why), last.why);
  ok("  ⚠️ 무엇을 먼저 하라고 **사람 말로** 알려 준다",
     /배정 가능을 끄/.test(last.why), last.why);
  ok("  ⚠️ 그 분은 **그대로 담당자**다 (거절이 반쪽으로 지나가지 않았습니다)",
     psql("select role::text || ':' || coalesce(provider_id,'-') " +
          "from account where id = '" + SOLO + "'") === "provider:pvs-b");
  /* ⚠️ 배정 가능을 끄면 되어야 합니다 — 막는 까닭이 없어집니다 */
  const offa = allowed(as(ADM) + "select approve_provider('pvs-b', null, null, " +
    "'담당자 교체', false)");
  ok("배정 가능을 끄면", offa.yes, offa.why);
  const last2 = allowed(kick(ADM, { user:SOLO, why:"그만두셨습니다" }));
  ok("  그때는 마지막 담당자도 **나간다**", last2.yes && last2.out === "다른골프장",
     last2.why || last2.out);
  /* ⚠️ 배정을 아예 안 받는 업체는 처음부터 됩니다 */
  const nev = allowed(kick(ADM, { user:OTH, why:"그만두셨습니다" }));
  ok("배정 가능이 꺼진 업체는 마지막 담당자도 바로 나간다", nev.yes, nev.why);

  // ── ⑦ 내보낸 뒤 — 무엇이 같이 움직였나 ────────────────────────
  console.log("\n── ⑦ 내보낸 뒤 — **딱지와 보는 길**이 같이 닫히는가");
  const out = allowed(kick(ADM, { user:P2, why:"그만두셨습니다" }));
  ok("담당자 하나를 내보낸다", out.yes && out.out === "담당자셋인골프장",
     out.why || out.out);
  ok("  역할이 **일반 회원**으로 내려간다",
     psql("select role::text || ':' || coalesce(provider_id,'-') " +
          "from account where id = '" + P2 + "'") === "customer:-");
  /* ⚠️⚠️ **`biz` 딱지는 0028 의 트리거가 뗍니다** — 문이 손으로 떼지
     않습니다. 그래서 그 트리거가 **실제로 도는지**를 여기서 봅니다
     (장식인지 알 수 없는 자물쇠를 두지 않습니다). */
  ok("⚠️⚠️ **사업자 딱지가 저절로 떨어진다** (0028 의 트리거가 돕니다)",
     psql("select count(*) from account_hat where account_id = '" + P2 +
          "' and hat = 'biz'") === "0");
  ok("  ⚠️ 남은 담당자의 딱지는 **그대로**다",
     psql("select count(*) from account_hat where account_id = '" + P1 +
          "' and hat = 'biz'") === "1");
  ok("⚠️⚠️ 나간 분에게는 그 업체 명단이 **한 줄도** 안 보인다",
     psql(as(P2) + "select count(*) from v_provider_staff") === "0");
  ok("  남은 분의 명단은 **셋**이 된다",
     psql(as(P1) + "select count(*) from v_provider_staff") === "3");
  /* ⚠️ 감사 기록 — ⚠️⚠️ **성함 · 연락처가 들어가면 안 됩니다** */
  ok("감사 기록이 남는다 (까닭까지)",
     psql("select count(*) from audit_log where obj = 'account' " +
          "and obj_id = '" + P2 + "' and to_state = 'customer' " +
          "and why = '그만두셨습니다'") === "1");
  ok("⚠️⚠️ 그 기록에 **성함이 없다** (uuid 와 업체 주소만 남깁니다)",
     psql("select count(*) from audit_log where obj = 'account' " +
          "and obj_id = '" + P2 + "' and (why || coalesce(data::text,'')) " +
          "like '%이이담%'") === "0");

  // ── ⑧ 다시 들어오는 길이 살아 있는가 ──────────────────────────
  console.log("\n── ⑧ 내보낸 분이 **다시** 들어올 수 있는가");
  /* ⚠️ 내보내는 것이 영구 차단이면 안 됩니다 — 실수로 뗀 날 되돌릴
     길이 있어야 합니다 (그 길은 0043 의 초대 코드 그대로입니다). */
  const c2 = psql(as(ADM) + "select make_provider_invite('" +
    J({ provider:"pvs-a" }) + "'::jsonb)");
  const back = allowed(as(P2) + "select redeem_provider_invite('" +
    J({ code: c2 }) + "'::jsonb)");
  ok("새 초대 코드로 **다시** 들어온다 (영구 차단이 아닙니다)",
     back.yes && back.out === "담당자셋인골프장", back.why || back.out);
  ok("  사업자 딱지도 **다시** 붙는다 (0028 이 양쪽으로 돕니다)",
     psql("select count(*) from account_hat where account_id = '" + P2 +
          "' and hat = 'biz'") === "1");

  // ── ⑨ 표를 직접 고치는 길 ─────────────────────────────────────
  console.log("\n── ⑨ 표를 직접 고치는 길이 막혀 있는가");
  /* ⚠️⚠️ **문이 있는 자리는 문으로** 재지만, 문을 안 지나는 길이
     열려 있으면 그 문은 장식입니다. `account` 에는 쓰기 GRANT 가
     없어야 합니다 (0001 은 select 만 줍니다). */
  const raw = denied(as(ADM) + "update account set provider_id = null " +
    "where id = '" + P1 + "'");
  ok("⚠️⚠️ 운영자도 표를 **직접** 고칠 수 없다 (문으로만 바꿉니다)",
     raw.no, raw.why);
  ok("  ⚠️ 그래서 그 분은 그대로 담당자다",
     psql("select coalesce(provider_id,'-') from account " +
          "where id = '" + P1 + "'") === "pvs-a");
  const rawv = denied(as(P1) + "update v_provider_staff set who = '해킹'");
  ok("보기를 거쳐 고치는 길도 막혀 있다", rawv.no, rawv.why);
};

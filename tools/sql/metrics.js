/* ════════════════════════════════════════════════════════════════════
   매각 지표를 **실제 값으로** 눌러 봅니다 (2차 지시서 §9 · 0033)

   ⚠️⚠️⚠️ **이 숫자는 사업의 값을 매기는 데 쓰입니다.** 화면이 틀리면
   손님이 불편한 것이고, 여기가 틀리면 **투자자에게 거짓을 말한 것**이
   됩니다. 그래서 다른 어느 묶음보다 **경계값을 많이** 넣습니다.

   ⚠️⚠️ **기대값을 코드와 같은 식으로 적지 않습니다.** 같은 식을 두 번
   쓰면 식을 바꿔도 답이 같아서 아무것도 안 잡습니다 — 손으로 센 수를
   적습니다 (요청 4건 · 수락 1건 → 25.0%).

   ⚠️⚠️ **달 경계를 한국 시각으로 넣어 봅니다.** Supabase 는 UTC 라,
   한국 시각 12월 1일 0시 30분은 UTC 로 11월 30일입니다 — 그냥 자르면
   **12월 실적이 11월로** 갑니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;
  const path = require("path");

  console.log("\n── 0033 매각 지표 — 누가 볼 수 있나");

  const ADM = psql("insert into auth.users (email) values ('mx-adm@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('mx-cus@x.test') returning id");
  const CU2 = psql("insert into auth.users (email) values ('mx-cus2@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + ADM + "','admin','지표관리자')," +
       "('" + CUS + "','customer','손님하나')," +
       "('" + CU2 + "','customer','손님둘') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");
  ok("씨앗: 지표관리자가 실제로 admin 이다",
     psql("select role::text from account where id='" + ADM + "'") === "admin");

  const as = u => "select become('" + u + "'); set role authenticated; ";
  const M = (from, to) =>
    "select biz_metrics('{\"from\":\"" + from + "\",\"to\":\"" + to + "\"}'::jsonb)";

  const noCus = denied(as(CUS) + M("2029-11", "2029-11"));
  ok("손님은 지표를 볼 수 없다", noCus.no, noCus.why);
  ok("  그 거절이 **지표 때문**이라고 말한다 (다른 자물쇠와 다른 말)",
     noCus.no && noCus.why.indexOf("지표") >= 0, noCus.why);
  ok("관리자는 볼 수 있다", allowed(as(ADM) + M("2029-11", "2029-11")).yes);

  /* 한 달치를 꺼내 한 칸을 읽는 손잡이 */
  const one = (ym, key) =>
    psql(as(ADM) + "select coalesce((x->>'" + key + "'), '없음') from " +
         "jsonb_array_elements(biz_metrics('{\"from\":\"" + ym + "\",\"to\":\"" +
         ym + "\"}'::jsonb)->'months') as x");

  console.log("\n── 아무것도 없을 때 — 0 과 '못 냄' 을 가릅니다");
  ok("요청 0건이면 0 이라고 말한다", one("2029-01", "req") === "0");
  /* ⚠️⚠️ **분모가 0 이면 비율이 아닙니다.** "0%" 로 찍으면 "다 놓쳤다"
     로 읽힙니다 — 실제로는 잴 것이 없는 달입니다. */
  ok("요청 0건인 달은 유효 상담 비율을 **내지 않는다** (0% 가 아니라 빈 값)",
     one("2029-01", "rate_valid") === "없음");

  /* ── 씨앗 ──────────────────────────────────────────────────────── */
  /* ⚠️⚠️ **배정 줄을 넣으려면 업체가 "배정 가능" 이라야 합니다**
     (0012 · 0018 의 트리거). 그리고 배정 가능은 **계정이 이어진 뒤에만**
     켜집니다 — 지표 검사라고 그 자물쇠를 우회하지 않습니다. 우회하면
     여기서 쓰는 씨앗이 **운영에서는 만들 수 없는 모양**이 되고, 그러면
     지표가 "실제로는 생길 수 없는 자료" 위에서 초록이 됩니다. */
  psql("insert into provider (id, name, listed, assignable, is_test) values " +
       "('mx-real','지표 참업체', true, false, false)," +
       "('mx-real2','지표 참업체2', true, false, false)," +
       "('mx-test','[검사용] 지표', true, false, true) " +
       "on conflict (id) do update set is_test = excluded.is_test");
  ["mx-real", "mx-real2", "mx-test"].forEach(function(pv){
    const u = psql("insert into auth.users (email) values ('" + pv + "@x.test') returning id");
    psql("insert into account (id, role, name, provider_id) values ('" + u +
         "','provider','" + pv + " 사람','" + pv + "') on conflict (id) do update set " +
         "role = excluded.role, provider_id = excluded.provider_id");
  });
  psql("update provider set assignable = true where id like 'mx-%'");
  ok("씨앗: 세 업체가 배정 가능으로 켜졌다 (계정이 이어졌습니다)",
     psql("select count(*)::text from provider where id like 'mx-%' and assignable") === "3");

  /* ⚠️ 요청을 **한국 시각으로** 넣습니다. 아래 둘은 UTC 로는 같은 날,
     한국 시각으로는 **다른 달**입니다. */
  const mkReq = (no, kst, user) =>
    psql("insert into request (no, side, tel, name, agree_at, created_at, state, user_id) " +
         "values ('" + no + "','golf','010-0000-0000','ㅇ', now(), " +
         "timestamptz '" + kst + " Asia/Seoul', 'new'," +
         (user ? "'" + user + "'" : "null") + ") returning id::text");

  const R1 = mkReq("MX-0001", "2029-11-30 23:00", CUS);   /* KST 11월 */
  const R2 = mkReq("MX-0002", "2029-12-01 00:30", CUS);   /* KST 12월 · UTC 11월 */
  const R3 = mkReq("MX-0003", "2029-12-10 12:00", CU2);
  const R4 = mkReq("MX-0004", "2029-12-11 12:00", null);
  const R5 = mkReq("MX-0005", "2029-12-12 12:00", null);  /* 검사용에만 넘깁니다 */

  console.log("\n── 달 경계 (⚠️ Supabase 는 UTC 입니다)");
  ok("한국 시각 11/30 23:00 요청은 **11월**이다", one("2029-11", "req") === "1");
  /* ⚠️⚠️ UTC 로 자르면 이 요청이 11월로 가서 12월이 3건이 됩니다 */
  ok("한국 시각 12/1 00:30 요청은 **12월**이다 (UTC 로는 11/30 입니다)",
     one("2029-12", "req") === "4", one("2029-12", "req"));

  /* ⚠️⚠️⚠️ **앞 사업(중고폰)의 자료가 섞이면 안 됩니다** — 1차 지시서가
     "기존 창업 · 폐업 데이터를 새 사업에 활용하지 않는다" 고 적었고,
     섞이면 **골프올인원이 하지 않은 거래가 골프의 실적**이 됩니다.
     같은 표에 옛 자료가 그대로 남아 있으므로(지우지 않는 것이 맞습니다)
     `side` 로 갈라야 합니다. */
  console.log("\n── ⚠️ 앞 사업(중고폰) 자료가 골프 지표에 섞이나");
  const before = one("2029-12", "req");
  const beforeTest = one("2029-12", "req_test");
  psql("insert into request (no, side, tel, name, agree_at, created_at, state, user_id) " +
       "values ('MX-OLD1','fix','010-0000-0000','옛손님', now(), " +
       "timestamptz '2029-12-15 12:00 Asia/Seoul','new','" + CUS + "')");
  ok("중고폰 요청은 골프 '들어온 요청' 에 **안 들어간다**",
     one("2029-12", "req") === before, before + " → " + one("2029-12", "req"));
  /* ⚠️ "어디에도 안 들어갔는가" 를 봅니다 — 빠진 줄이 **다른 칸**으로
     새면 그것도 틀린 숫자입니다 (전을 재고 늘어난 값만 봅니다). */
  ok("  검사용 칸으로도 새지 않는다 (어느 칸도 안 늘었다)",
     one("2029-12", "req_test") === beforeTest,
     beforeTest + " → " + one("2029-12", "req_test"));

  console.log("\n── 검사용 업체를 빼되, **뺀 것을 세어 내놓는가**");
  const asg = (rid, pv, state) =>
    psql("insert into assignment (request_id, provider_id, agree3rd_at, state) values ('" +
         rid + "','" + pv + "', now(), '" + state + "') " +
         "on conflict (request_id, provider_id) do update set state = excluded.state");
  asg(R5, "mx-test", "accepted");                 /* 검사용에만 */
  ok("검사용에만 넘어간 요청은 **들어온 요청에서 빠진다**",
     one("2029-12", "req") === "3", one("2029-12", "req"));
  ok("  빠진 것을 **따로 센다** (조용히 사라지지 않는다)",
     one("2029-12", "req_test") === "1");
  ok("  검사용 쪽 수락은 유효 상담에 안 들어간다",
     one("2029-12", "accepted") === "0");

  /* ⚠️⚠️ **너무 넓게 막는 것도 고장입니다.** 참 업체에도 넘긴 요청은
     검사용이 섞였다고 빠지면 안 됩니다. */
  asg(R3, "mx-test", "sent");
  asg(R3, "mx-real", "sent");
  ok("참 업체에도 넘긴 요청은 **빠지지 않는다** (너무 넓게 막지 않았다)",
     one("2029-12", "req") === "3" && one("2029-12", "req_test") === "1",
     one("2029-12", "req") + " · " + one("2029-12", "req_test"));

  console.log("\n── 한 요청을 업체 여럿에 넘겨도 **한 건**입니다");
  asg(R3, "mx-real2", "sent");
  ok("업체 둘에 넘긴 요청이 '넘긴 요청' 1건으로 센다",
     one("2029-12", "assigned") === "1", one("2029-12", "assigned"));

  console.log("\n── 유효 상담 비율 — 손으로 센 값과 맞춰 봅니다");
  asg(R2, "mx-real", "accepted");
  /* 12월: 들어온 요청 3 (R2 · R3 · R4) · 수락 1 (R2) → 33.3% */
  ok("12월 들어온 요청이 3건이다", one("2029-12", "req") === "3");
  ok("12월 유효 상담이 1건이다", one("2029-12", "accepted") === "1");
  ok("  비율이 **33.3%** 다 (1 ÷ 3)", one("2029-12", "rate_valid") === "33.3",
     one("2029-12", "rate_valid"));
  asg(R3, "mx-real", "accepted");
  ok("  수락이 늘면 **66.7%** 다 (2 ÷ 3)", one("2029-12", "rate_valid") === "66.7",
     one("2029-12", "rate_valid"));
  asg(R4, "mx-real", "accepted");
  /* ⚠️ 경계값 — 전부 수락하면 100.0 입니다. 깎지 않습니다. */
  ok("  전부 수락하면 **100%** 다 (깎지 않습니다)",
     one("2029-12", "rate_valid") === "100.0", one("2029-12", "rate_valid"));

  console.log("\n── 견적 — 거둔 것도 '나간 견적' 입니다");
  const mkQuote = (rid, pv, amt, st) =>
    psql("insert into quote (request_id, provider_id, amount, scope, state) values ('" +
         rid + "','" + pv + "'," + amt + ",'ㅂ','" + st + "') " +
         "on conflict (request_id, provider_id) do update set state = excluded.state");
  mkQuote(R2, "mx-real", 500000, "open");
  mkQuote(R3, "mx-real", 600000, "withdrawn");
  mkQuote(R5, "mx-test", 900000, "open");
  ok("견적이 나간 요청이 2건이다 (거둔 것도 셉니다)",
     one("2029-12", "quoted") === "2", one("2029-12", "quoted"));
  ok("  검사용 업체가 낸 견적은 안 센다",
     one("2029-12", "quoted") === "2");

  console.log("\n── 거래액 — ⚠️ 플랫폼 매출이 아닙니다");
  const mkDeal = (rid, pv, amt, signedKst) =>
    psql("insert into deal (request_id, provider_id, amount, signed_at) values ('" +
         rid + "','" + pv + "'," + (amt === null ? "null" : amt) + "," +
         "timestamptz '" + signedKst + " Asia/Seoul') returning id::text");
  const D1 = mkDeal(R1, "mx-real", 3000000, "2029-12-05 10:00");  /* 요청은 11월 · 계약은 12월 */
  const D2 = mkDeal(R2, "mx-real", null,    "2029-12-06 10:00");  /* 금액 미기재 */
  const D3 = mkDeal(R3, "mx-real", 0,       "2029-12-07 10:00");  /* ⚠️ 0 은 값입니다 */
  mkDeal(R5, "mx-test", 9999999, "2029-12-08 10:00");             /* 검사용 — 빠져야 합니다 */

  ok("계약은 **계약일 기준**이다 (요청이 11월이어도 12월 계약입니다)",
     one("2029-12", "deals") === "3", one("2029-12", "deals"));
  ok("  11월에는 계약이 0건이다", one("2029-11", "deals") === "0");
  /* ⚠️⚠️ 손으로 센 값: 3,000,000 + 0 = 3,000,000 (null 은 안 더합니다) */
  ok("거래액이 3,000,000 원이다 (검사용 9,999,999 가 안 섞였다)",
     one("2029-12", "gmv") === "3000000", one("2029-12", "gmv"));
  ok("  금액이 빈 계약은 **따로 센다** (0 으로 더하지 않습니다)",
     one("2029-12", "gmv_missing") === "1", one("2029-12", "gmv_missing"));
  ok("  ⚠️ 0 원 계약은 '빈 것' 이 아니다 (0 은 값입니다)",
     one("2029-12", "gmv_missing") === "1" && one("2029-12", "deals") === "3");

  console.log("\n── 플랫폼이 버는 돈 — 확정과 입금을 **가릅니다**");
  /* ⚠️ 수수료는 승인자 · 승인시각이 있어야 들어갑니다 (0001 의 check).
     ⚠️⚠️ 그리고 **관리자로 접속한 셈**이라야 합니다 (0007 의
     deal_money_guard). 임자 권한으로 돌려도 트리거는 `my_role()` 을
     보므로, become() 없이 넣으면 거기서 막힙니다 — 그게 맞습니다. */
  psql("select become('" + ADM + "'); " +
       "update deal set fee = 300000, fee_vat = 30000, fee_total = 330000, " +
       "fee_by = '" + ADM + "', fee_at = timestamptz '2029-12-20 10:00 Asia/Seoul' " +
       "where id = '" + D1 + "'");
  ok("확정한 수수료가 330,000 원이다", one("2029-12", "fee_set") === "330000");
  ok("  아직 받은 돈은 0 원이다", one("2029-12", "fee_paid") === "0");
  ok("  확정했는데 못 받은 것이 330,000 원이다", one("2029-12", "fee_due") === "330000");

  /* 입금은 **다음 달**에 들어옵니다 — 흔한 일입니다 */
  psql("select become('" + ADM + "'); " +
       "update deal set paid = 330000, " +
       "paid_at = timestamptz '2030-01-05 10:00 Asia/Seoul' where id = '" + D1 + "'");
  ok("입금은 **입금일 기준**이다 (1월에 잡힙니다)",
     one("2030-01", "fee_paid") === "330000", one("2030-01", "fee_paid"));
  ok("  12월의 '받은 수수료' 는 여전히 0 이다", one("2029-12", "fee_paid") === "0");
  /* ⚠️⚠️ 음수를 0 으로 깎지 않습니다 — 깎으면 그 돈이 어디로 갔는지 사라집니다 */
  ok("  1월의 '확정했는데 못 받은 것' 이 **-330,000** 이다 (0 으로 깎지 않습니다)",
     one("2030-01", "fee_due") === "-330000", one("2030-01", "fee_due"));

  console.log("\n── 광고 · 멤버십 — 받은 기록이 없는 금액");
  const mkAd = (pv, start, price, st) =>
    psql("insert into ad_run (provider_id, place, starts_on, ends_on, price, state) values ('" +
         pv + "','main_hero', date '" + start + "', date '" + start +
         "'::date + 60, " + price + ",'" + st + "')");
  mkAd("mx-real", "2029-12-03", 500000, "live");
  mkAd("mx-real", "2029-12-04", 200000, "draft");    /* ⚠️ 아직 집행이 아닙니다 */
  mkAd("mx-test", "2029-12-05", 700000, "live");     /* 검사용 */
  ok("광고는 **집행 시작 달**에 500,000 원이다 (draft 와 검사용은 뺍니다)",
     one("2029-12", "ad") === "500000", one("2029-12", "ad"));
  /* ⚠️ 기간이 두 달에 걸쳐도 **쪼개지 않습니다** — 쪼개면 받은 적 없는
     돈을 달마다 나눠 적는 셈입니다. */
  ok("  기간이 1월까지 걸쳐도 1월에 **또 세지 않는다**",
     one("2030-01", "ad") === "0", one("2030-01", "ad"));

  psql("insert into membership_plan (id, name, monthly) values ('mx-pro','지표요금제', 99000) " +
       "on conflict (id) do nothing");
  psql("insert into provider_membership (provider_id, plan_id, starts_on, ends_on) values " +
       "('mx-real','mx-pro', date '2029-12-01', date '2030-01-31') " +
       "on conflict (provider_id) do update set starts_on = excluded.starts_on, " +
       "ends_on = excluded.ends_on");
  ok("멤버십은 살아 있던 달에 99,000 원이다", one("2029-12", "mship") === "99000");
  ok("  시작 전 달에는 0 원이다", one("2029-11", "mship") === "0");
  ok("  해지한 달까지는 센다 (경계 포함)", one("2030-01", "mship") === "99000");
  ok("  해지 다음 달은 0 원이다", one("2030-02", "mship") === "0");

  psql("insert into provider_membership (provider_id, plan_id, starts_on) values " +
       "('mx-test','mx-pro', date '2029-12-01') on conflict (provider_id) do nothing");
  ok("  검사용 업체의 멤버십은 안 센다", one("2029-12", "mship") === "99000",
     one("2029-12", "mship"));

  console.log("\n── 활동 회원 — ⚠️ 방문자가 아니고, 운영자는 뺍니다");
  const log = (u, kst) =>
    psql("insert into audit_log (by_user, obj, obj_id, at) values ('" + u +
         "','request','x', timestamptz '" + kst + " Asia/Seoul')");
  log(CUS, "2029-12-02 10:00");
  log(CUS, "2029-12-03 10:00");          /* 같은 사람 두 번 */
  log(CU2, "2029-12-04 10:00");
  log(ADM, "2029-12-05 10:00");          /* ⚠️ 운영자 — 빠져야 합니다 */
  ok("같은 사람이 여러 번 해도 **한 명**이다", one("2029-12", "users") === "2",
     one("2029-12", "users"));
  ok("  ⚠️ 운영자가 누른 것은 활동 회원이 아니다 (우리 손이 MAU 가 되면 안 됩니다)",
     one("2029-12", "users") === "2");

  /* ⚠️⚠️ 앞 사업만 쓰신 분이 **골프의 MAU** 로 잡히면 안 됩니다 */
  const OLD = psql("insert into auth.users (email) values ('mx-old@x.test') returning id");
  psql("insert into account (id, role, name) values ('" + OLD + "','customer','옛회원') " +
       "on conflict (id) do update set role = excluded.role");
  psql("insert into request (no, side, tel, name, agree_at, created_at, state, user_id) " +
       "values ('MX-OLD2','fix','010-0000-0000','옛손님2', now(), " +
       "timestamptz '2029-12-16 12:00 Asia/Seoul','new','" + OLD + "')");
  log(OLD, "2029-12-17 10:00");
  ok("  ⚠️ 골프 요청을 한 적 없는 옛 회원은 **활동 회원이 아니다**",
     one("2029-12", "users") === "2", one("2029-12", "users"));

  console.log("\n── 인자 경계");
  const back = denied(as(ADM) + M("2029-12", "2029-01"));
  ok("시작 달이 끝 달보다 뒤면 막힌다", back.no, back.why);
  const wide = denied(as(ADM) + M("2000-01", "2029-12"));
  ok("다섯 해를 넘기면 막힌다", wide.no, wide.why);
  ok("  그 거절은 **다른 말**이다 (어느 자물쇠인지 알아야 합니다)",
     back.no && wide.no && back.why !== wide.why, back.why + " / " + wide.why);
  ok("딱 다섯 해는 된다 (너무 좁게 막지 않았다)",
     allowed(as(ADM) + M("2025-01", "2030-01")).yes);
  const span = psql(as(ADM) +
    "select jsonb_array_length(biz_metrics('{\"from\":\"2029-10\",\"to\":\"2029-12\"}'::jsonb)->'months')::text");
  ok("빈 달도 줄을 낸다 (석 달을 물으면 석 줄)", span === "3", span);

  console.log("\n── 못 재는 것을 **같이 내놓는가**");
  const cannot = psql(as(ADM) +
    "select biz_metrics('{\"from\":\"2029-12\",\"to\":\"2029-12\"}'::jsonb)->>'cannot'");
  ok("방문자 MAU 를 못 잰다고 적는다", cannot.indexOf("방문자") >= 0, cannot.slice(0, 80));
  ok("  붙이는 날 방침의 수탁자를 적어야 한다고 같이 말한다",
     cannot.indexOf("수탁자") >= 0, cannot.slice(0, 200));
  ok("광고 · 멤버십에 입금 기록이 없다고 적는다",
     cannot.indexOf("입금") >= 0, cannot.slice(0, 300));

  /* ══ 화면의 말과 DB 의 키가 같은가 ═══════════════════════════════
     ⚠️⚠️ **같은 규칙을 두 곳에 적은 자리입니다.** DB 가 내는 키와
     `js/data/metrics.js` 의 키가 어긋나면 —
       · DB 에만 있으면 화면이 그 지표를 **안 보여 줍니다** (만들어
         놓고 아무도 안 쓰는 칸)
       · 화면에만 있으면 **늘 "—"** 로 찍힙니다 (못 재는 것처럼 보입니다)
     둘 다 에러가 안 납니다. */
  console.log("\n── 지표 이름이 화면과 DB 에서 같은가");
  const keys = psql(as(ADM) +
    "select string_agg(k, ' ' order by k) from jsonb_object_keys(" +
    "(biz_metrics('{\"from\":\"2029-12\",\"to\":\"2029-12\"}'::jsonb)->'months')->0) as k");
  const dbKeys = keys.split(" ").filter(x => x && x !== "month").sort();

  /* ⚠️ 화면 파일을 **실제로 돌려** 읽습니다 — 정규식으로 긁으면 주석에
     적힌 키까지 집습니다. ⚠️⚠️ 빌린 window 는 **그대로 돌려놓습니다**
     (check-deal 이 그것을 안 해서 빌드를 깨뜨린 적이 있습니다). */
  const W = { won: n => String(n) };
  /* ⚠️⚠️ **빌린 window 는 그대로 돌려놓습니다** (check-deal 이 그것을
     안 해서 빌드를 통째로 깨뜨린 적이 있습니다). 그런데 돌려놓고 나면
     `window.amMetric()` 이 **그 안에서 `window` 를 다시 찾다가 터집니다**
     — 실제로 여기서 `window is not defined` 로 떨어졌습니다. 그래서
     화면 함수를 부를 때마다 **잠깐 빌렸다 돌려줍니다.** */
  function withWindow(fn){
    const had = Object.prototype.hasOwnProperty.call(global, "window");
    const was = global.window;
    global.window = W;
    try{ return fn(); }
    finally{ if(had) global.window = was; else delete global.window; }
  }
  withWindow(function(){
    const f = path.join(__dirname, "..", "..", "js", "data", "metrics.js");
    delete require.cache[require.resolve(f)];
    require(f);
  });
  const scrKeys = (W.AM_METRICS || []).map(m => m.key).sort();

  ok("잰 것이 0개가 아니다 (검사가 그 파일을 보기는 했다)",
     dbKeys.length > 0 && scrKeys.length > 0, dbKeys.length + " · " + scrKeys.length);
  const onlyDb  = dbKeys.filter(k => scrKeys.indexOf(k) < 0);
  const onlyScr = scrKeys.filter(k => dbKeys.indexOf(k) < 0);
  ok("DB 가 내는 지표를 화면이 **빠짐없이** 안다", onlyDb.length === 0,
     "화면에 없는 것: " + onlyDb.join(" "));
  ok("화면이 아는 지표를 DB 가 **빠짐없이** 낸다", onlyScr.length === 0,
     "DB 에 없는 것: " + onlyScr.join(" "));

  /* ⚠️ 뜻을 안 적은 지표가 있으면 **숫자만 나갑니다** — 그게 §9 가
     말한 "근거 없는 통계 수치" 로 읽히는 자리입니다. */
  const noWhat = (W.AM_METRICS || []).filter(m => !m.what || !m.name || !m.unit);
  ok("지표마다 **이름 · 뜻 · 단위**가 다 있다", noWhat.length === 0,
     noWhat.map(m => m.key).join(" "));
  const badGroup = (W.AM_METRICS || []).filter(function(m){
    return !(W.AM_METRIC_GROUPS || []).some(function(g){ return g.key === m.group; });
  });
  ok("지표마다 묶음이 실제로 있다", badGroup.length === 0,
     badGroup.map(m => m.key).join(" "));
  /* ⚠️⚠️ 거래액과 플랫폼 수입이 **같은 묶음에 있으면 더하게 됩니다** */
  const seen = withWindow(function(){
    return {
      gmvG:  W.amMetric("gmv").group,
      feeG:  W.amMetric("fee_paid").group,
      rateU: W.amMetric("rate_valid").unit,
      gmvU:  W.amMetric("gmv").unit,
      reqU:  W.amMetric("req").unit,
      zero:  W.amMetricText("req", 0),
      none:  W.amMetricText("rate_valid", null),
      pct0:  W.amMetricText("rate_valid", 0),
      month: W.amMonthName("2029-12")
    };
  });
  /* ⚠️⚠️ 거래액과 플랫폼 수입이 **같은 묶음에 있으면 더하게 됩니다** */
  ok("거래액과 플랫폼 수입이 **다른 묶음**이다 (§9 분리)",
     seen.gmvG !== seen.feeG, seen.gmvG + " / " + seen.feeG);
  ok("비율은 단위가 %, 돈은 원, 건수는 건이다",
     seen.rateU === "%" && seen.gmvU === "원" && seen.reqU === "건");
  /* ⚠️ 0 을 기다리는 자리에 `||` 를 쓰면 0 이 "못 냄" 이 됩니다 */
  ok("화면이 **0 과 '못 냄' 을 가른다**",
     seen.zero === "0건" && seen.none === "—", seen.zero + " / " + seen.none);
  ok("  0% 도 '못 냄' 이 아니다", seen.pct0 === "0%", seen.pct0);
  ok("달 이름이 사람 말로 나온다 (2029-12 → 2029년 12월)",
     seen.month === "2029년 12월", seen.month);
};

/* ════════════════════════════════════════════════════════════════════
   0026 을 **눌러 봅니다** — 광고(C) · 멤버십(D)

   ⚠️⚠️ **경계값 바로 아래 · 바로 위를 넣어 봅니다.** 0 과 100% 는 다들
   막아 두고 사고는 그 옆에서 납니다 — 앞 서비스에서 비율 99.99% 에
   85조원이, 값 0.01 에 25,000년이 화면에 나갔습니다.

   ⚠️ **너무 넓게 막는 것도 고장입니다.** 막히는 것만 보지 말고 정상
   조건이 제대로 되는지 같이 봅니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  const U = psql("insert into auth.users (email) values ('biz@x.test') returning id");
  const AD = psql("insert into auth.users (email) values ('ad@x.test') returning id");
  /* ⚠️⚠️ **do nothing 으로 씨앗을 넣으면 안 됩니다.** 0005 의 트리거가
     auth.users 에 사람이 생길 때 account 줄을 먼저 만들어 둡니다 —
     그래서 여기 insert 는 충돌하고, do nothing 이면 역할이 customer 로
     남습니다. 관리자로 넣은 줄 알고 검사를 돌리면 "관리자인데 거절됐다"
     로 보입니다. 코드가 아니라 **씨앗이 틀린** 자리입니다. */
  psql("insert into account (id, role, name) values ('" + U + "','customer','업체사람')," +
       "('" + AD + "','admin','광고관리자') on conflict (id) do update set " +
       "role = excluded.role, name = excluded.name");
  ok("씨앗: 광고관리자가 실제로 admin 이다",
     psql("select role::text from account where id='" + AD + "'") === "admin");
  psql("insert into provider (id, name, listed) values ('gp-test','테스트 골프샵', true) " +
       "on conflict (id) do nothing");

  const as = u => "select become('" + u + "'); set role authenticated; ";
  const back = "; reset role; ";
  const mk = (place, extra, from, to, price) =>
    "insert into ad_run (provider_id, place, " + (extra ? extra[0] + ", " : "") +
    "starts_on, ends_on, price) values ('gp-test','" + place + "'," +
    (extra ? "'" + extra[1] + "'," : "") + from + "," + to + "," + price + ")";

  console.log("\n── 0026 요금을 지어내지 않았는가 (지시서 5번 · 절대 규칙 1)");
  ok("멤버십 요금제가 **빈 표**로 시작한다",
     psql("select count(*)::text from membership_plan") === "0");
  ok("광고 집행도 0건으로 시작한다",
     psql("select count(*)::text from ad_run") === "0");

  console.log("\n── 광고 자리마다 무엇이 더 필요한가");
  ok("분류 광고인데 분류를 안 적으면 막힌다",
     denied(mk("cat_top", null, "current_date", "current_date", 0)).no);
  ok("지역 광고인데 지역을 안 적으면 막힌다",
     denied(mk("region", null, "current_date", "current_date", 0)).no);
  ok("분류를 적으면 들어간다 (정상 길이 막히지 않았다)",
     allowed(mk("cat_top", ["cat_key","lesson"], "current_date", "current_date", 0)).yes);
  ok("메인 띠는 더 적을 것이 없다",
     allowed(mk("main_hero", null, "current_date", "current_date", 0)).yes);

  console.log("\n── 경계값");
  ok("하루짜리(시작=종료)는 된다",
     allowed(mk("main_band", null, "current_date", "current_date", 1000)).yes);
  ok("종료가 시작보다 **하루 이른** 것은 막힌다",
     denied(mk("main_band", null, "current_date", "current_date - 1", 1000)).no);
  ok("요금 0원은 된다 (무상 노출)",
     allowed(mk("main_band", null, "current_date", "current_date + 1", 0)).yes);
  ok("요금 -1원은 막힌다",
     denied(mk("main_band", null, "current_date", "current_date + 1", -1)).no);

  console.log("\n── 지금 나가는 광고만 보이는가");
  psql("update ad_run set state='live'");
  /* ⚠️ 어제 끝난 광고 · 내일 시작하는 광고를 같이 넣어 **경계 바로 옆**을 봅니다 */
  psql(mk("main_band", null, "current_date - 7", "current_date - 1", 100));
  psql(mk("main_band", null, "current_date + 1", "current_date + 7", 100));
  psql("update ad_run set state='live' where state='draft'");
  const liveAll = Number(psql("select count(*)::text from ad_run where state='live'"));
  const liveNow = Number(psql("select count(*)::text from v_ad_live"));
  ok("어제 끝난 것과 내일 시작하는 것은 안 보인다",
     liveAll === liveNow + 2, "집행 " + liveAll + " · 오늘 " + liveNow);
  ok("오늘치는 보인다 (전부 가려 버리지 않았다)", liveNow > 0, liveNow);
  ok("보기가 '광고' 표시를 들고 나온다",
     psql("select distinct label from v_ad_live") === "광고");
  ok("보기에 업체 이름이 같이 나온다",
     psql("select distinct provider_name from v_ad_live") === "테스트 골프샵");

  console.log("\n── 자물쇠를 하나씩 빼서 어느 것이 막는지");
  let d = denied(as(U) + "update ad_run set price = 1" + back);
  ok("① 일반 회원이 값을 못 바꾼다 — GRANT 가 먼저",
     d.no && /permission denied/i.test(d.why), d.why);

  /* ⚠️⚠️ **RLS 는 UPDATE 에서 에러를 내지 않습니다.** 보이지 않는 줄은
     그냥 **안 걸릴 뿐**이라 0줄이 바뀌고 성공으로 돌아옵니다. 처음에
     에러가 날 줄 알고 검사를 적었다가 "막히지 않았다" 로 읽었습니다 —
     막히기는 막혔고 **말이 없을 뿐**입니다. 그래서 값이 그대로인지를
     셉니다. (읽기 RLS 는 반대로 조용히 빈 결과를 줍니다.) */
  psql("grant update on ad_run to authenticated");
  const before = psql("select count(*)::text from ad_run where price = 1");
  const moved  = psql(as(U) + "with x as (update ad_run set price = 1 returning 1) " +
                      "select count(*)::text from x" + back);
  const after  = psql("select count(*)::text from ad_run where price = 1");
  ok("② GRANT 를 열어도 RLS 가 막는다 — 에러 없이 **0줄**만 바뀝니다",
     moved === "0" && before === after, "바뀐 줄 " + moved + " · 전 " + before + " 후 " + after);
  psql("revoke update on ad_run from authenticated");

  console.log("\n── 광고 집행 상태는 운영자만");
  const anyAd = psql("select id::text from ad_run limit 1");
  d = denied(as(U) + "select set_ad_state('" + anyAd + "','stopped','내가 멈추겠다')" + back);
  ok("일반 회원은 못 바꾼다", d.no && /운영자만/.test(d.why), d.why);
  d = denied(as(AD) + "select set_ad_state('" + anyAd + "','stopped','')" + back);
  ok("까닭 없이 못 바꾼다 (다른 말)", d.no && /까닭을 적어야/.test(d.why), d.why);
  d = denied(as(AD) + "select set_ad_state('00000000-0000-0000-0000-000000000000','stopped','없는 것')" + back);
  ok("없는 광고는 못 바꾼다 (또 다른 말)", d.no && /그런 광고가 없습니다/.test(d.why), d.why);
  ok("운영자는 바꾼다",
     psql(as(AD) + "select set_ad_state('" + anyAd + "','stopped','기간 종료')::text" + back) === "stopped");
  ok("광고 감사 기록이 남는다",
     psql("select count(*)::text from audit_log where obj='ad_run' and obj_id='" + anyAd + "'") === "1");
  ok("멈춘 광고는 보기에서 빠진다",
     psql("select count(*)::text from v_ad_live where id='" + anyAd + "'") === "0");

  console.log("\n── 멤버십 요금제는 관리자만");
  d = denied(as(U) + "select save_plan('basic','베이직',9900)" + back);
  ok("일반 회원은 요금제를 못 만든다", d.no && /관리자만/.test(d.why), d.why);
  d = denied(as(AD) + "select save_plan('basic','베이직',-1)" + back);
  ok("음수 요금은 막힌다 (다른 말)", d.no && /0 보다 작을 수 없습니다/.test(d.why), d.why);
  ok("관리자는 만든다",
     psql(as(AD) + "select save_plan('basic','베이직',9900,'{}'::jsonb,true,1,'첫 요금제')" + back) === "basic");
  ok("요금 0원 요금제(무료)도 된다",
     psql(as(AD) + "select save_plan('free','무료',0,'{}'::jsonb,true,0,'무료 입점')" + back) === "free");
  ok("같은 id 로 다시 부르면 **고쳐 쓴다** (줄이 안 늘어난다)",
     (psql(as(AD) + "select save_plan('basic','베이직',12000,'{}'::jsonb,true,1,'요금 인상')" + back),
      psql("select count(*)::text from membership_plan")) === "2");
  ok("바뀐 요금이 실제로 들어갔다",
     psql("select monthly::text from membership_plan where id='basic'") === "12000");
  ok("요금제 감사 기록이 남는다 (요금을 언제 누가 바꿨는지)",
     psql("select count(*)::text from audit_log where obj='membership_plan' and obj_id='basic'") === "2");

  console.log("\n── 업체 멤버십");
  ok("해지일이 없는 것(계속)은 된다",
     allowed("insert into provider_membership (provider_id, plan_id, starts_on) " +
             "values ('gp-test','basic', current_date)").yes);
  ok("해지일이 시작일보다 **하루 이른** 것은 막힌다",
     denied("update provider_membership set ends_on = current_date - 1 where provider_id='gp-test'").no);
  ok("해지일이 시작일과 같은 날은 된다 (하루짜리)",
     allowed("update provider_membership set ends_on = current_date where provider_id='gp-test'").yes);

  /* ══ 0036 — 넣는 문 둘 ══════════════════════════════════════ */
  console.log("\n── 0036 광고를 **넣는 문** (표를 직접 안 엽니다)");
  const asAd = u => "select become('" + u + "'); set role authenticated; ";
  const sa = (u, body) =>
    asAd(u) + "select save_ad(" + body + ")";
  const adBody = (extra) =>
    "jsonb_build_object('provider','gp-test','place','main_hero'," +
    "'starts_on','2030-01-01','ends_on','2030-01-31','why','검사'" +
    (extra ? ", " + extra : "") + ", 'price', 10000)";

  const byUser = denied(sa(U, adBody()));
  ok("업체 회원은 광고를 못 넣는다", byUser.no, byUser.why);
  ok("  그 거절이 **관리자만**이라고 말한다",
     byUser.no && byUser.why.indexOf("관리자만") >= 0, byUser.why);
  const noWhy = denied(asAd(AD) +
    "select save_ad(jsonb_build_object('provider','gp-test','place','main_hero'," +
    "'starts_on','2030-01-01','ends_on','2030-01-31','price',1000))");
  ok("까닭 없이는 못 넣는다 (감사 기록에 남습니다)", noWhy.no, noWhy.why);
  const badPlace = denied(sa(AD,
    "jsonb_build_object('provider','gp-test','place','어디','starts_on','2030-01-01'," +
    "'ends_on','2030-01-31','price',1000,'why','검사')"));
  ok("없는 자리는 **사람 말로** 거절한다", badPlace.no, badPlace.why);
  ok("  enum 에러를 그대로 보내지 않는다",
     badPlace.no && badPlace.why.indexOf("invalid input") < 0, badPlace.why);
  const noPrice = denied(sa(AD,
    "jsonb_build_object('provider','gp-test','place','main_hero'," +
    "'starts_on','2030-01-01','ends_on','2030-01-31','why','검사')"));
  ok("금액을 안 적으면 막힌다 (0 을 몰래 넣지 않습니다)", noPrice.no, noPrice.why);
  const zero = allowed(sa(AD,
    "jsonb_build_object('provider','gp-test','place','main_hero'," +
    "'starts_on','2030-01-01','ends_on','2030-01-31','price',0,'why','무상')"));
  ok("⚠️ 0 원은 **된다** (무상 노출 — 너무 넓게 막지 않았다)", zero.yes, zero.why);
  const NEWAD = zero.out;
  /* ⚠️⚠️ 넣자마자 손님 화면에 뜨면 안 됩니다 */
  ok("⚠️ 새로 넣은 광고는 **준비(draft)** 다 (바로 안 뜹니다)",
     psql("select state::text from ad_run where id='" + NEWAD + "'") === "draft");
  ok("  그래서 공개 보기에도 안 나온다",
     psql("select become(null); set role anon; " +
          "select count(*)::text from v_ad_live where id='" + NEWAD + "'") === "0");
  ok("  기록이 남는다",
     psql("select count(*)::text from audit_log where obj='ad_run' " +
          "and obj_id='" + NEWAD + "'") === "1");
  const ghostPv = denied(sa(AD,
    "jsonb_build_object('provider','없는곳','place','main_hero'," +
    "'starts_on','2030-01-01','ends_on','2030-01-31','price',0,'why','검사')"));
  ok("없는 업체로는 못 넣는다", ghostPv.no, ghostPv.why);
  const insDirect = denied(asAd(AD) +
    "insert into ad_run (provider_id, place, starts_on, ends_on, price) " +
    "values ('gp-test','main_hero', current_date, current_date, 0)");
  ok("표에 직접 넣는 길이 없다 (문으로만)", insDirect.no, insDirect.why);

  console.log("\n── 0036 업체에 멤버십을 **다는 문**");
  const sm = (u, body) => asAd(u) + "select set_membership(" + body + ")";
  psql("insert into membership_plan (id, name, monthly) values ('mz-basic','기본', 49000) " +
       "on conflict (id) do nothing");
  const mByUser = denied(sm(U,
    "jsonb_build_object('provider','gp-test','plan','mz-basic','why','검사')"));
  ok("업체 회원은 멤버십을 못 단다", mByUser.no, mByUser.why);
  const mNoWhy = denied(sm(AD,
    "jsonb_build_object('provider','gp-test','plan','mz-basic')"));
  ok("까닭 없이는 못 단다", mNoWhy.no, mNoWhy.why);
  const mGhost = denied(sm(AD,
    "jsonb_build_object('provider','gp-test','plan','없는요금제','why','검사')"));
  ok("없는 요금제는 못 단다", mGhost.no, mGhost.why);
  ok("관리자가 단다",
     allowed(sm(AD, "jsonb_build_object('provider','gp-test','plan','mz-basic'," +
                    "'why','제휴 계약')")).yes);
  ok("  달린다", psql("select plan_id from provider_membership " +
                     "where provider_id='gp-test'") === "mz-basic");
  /* ⚠️⚠️ 청구가 생기지 않습니다 — 받은 돈이라고 말하지 않습니다 */
  ok("⚠️ 달아도 **입금 기록이 생기지 않는다** (청구 장치가 없습니다)",
     psql("select count(*)::text from settlement where provider_id='gp-test'") === "0");
  const badDate = denied(sm(AD,
    "jsonb_build_object('provider','gp-test','plan','mz-basic'," +
    "'starts_on','2030-02-01','ends_on','2030-01-01','why','검사')"));
  ok("끝나는 날이 더 빠르면 막힌다", badDate.no, badDate.why);
  /* ⚠️ 떼는 것은 지우는 것이 아니라 끝나는 날을 적는 것입니다 */
  ok("요금제를 비워 보내면 **뗀다**",
     allowed(sm(AD, "jsonb_build_object('provider','gp-test','why','해지')")).yes);
  ok("  줄을 지우지 않고 **끝나는 날**을 적는다",
     psql("select (ends_on is not null)::text from provider_membership " +
          "where provider_id='gp-test'") === "true");
  ok("  그래도 줄은 남는다 (그때 얼마짜리였나가 사라지지 않게)",
     psql("select count(*)::text from provider_membership " +
          "where provider_id='gp-test'") === "1");
};

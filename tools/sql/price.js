/* ════════════════════════════════════════════════════════════════════
   업체가 등록하는 **가격**을 눌러 봅니다 (0042 · 업체찾기 개선 지시서 7번)

   ⚠️⚠️⚠️ **보기(view)는 RLS 를 지나지 않습니다** — 그래서 그 `where`
   절이 자물쇠 그 자체입니다. 0026 의 `v_ad_live` 가 검사용 업체의
   상호를 anon 에게 내보내고 있었고, 그때 정책은 그 길을 **못 막았습니다.**
   그러니 공개 보기를 **네 가지로 따로** 눌러 봅니다 —
     ① 내린 가격 ② 비공개 업체 ③ 승인 안 된 업체 ④ 검사용 업체

   ⚠️⚠️ **자물쇠가 겹치면 검사를 속입니다.** GRANT 와 RLS 를 따로
   눌러 보고, 거절하는 **말까지** 맞춰 봅니다.

   ⚠️⚠️ **경계값**: 0 원은 값입니다 (무료 체험). 음수와 자릿수 사고
   (1억 초과)만 막습니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0042 가격 — 씨앗");
  const PRO = psql("insert into auth.users (email) values ('pp-pro@x.test') returning id");
  const OTH = psql("insert into auth.users (email) values ('pp-oth@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('pp-cus@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('pp-adm@x.test') returning id");

  /* ⚠️ 하는 일(subs)이 있어야 가격을 답니다 — 트리거가 봅니다 */
  psql("insert into provider (id, name, listed, is_test, subs, state) values " +
       "('pp-a','[검사용] 가격 업체', true, true, '{ls-solo,rg-in}', 'approved')," +
       "('pp-b','[검사용] 남의 업체', true, true, '{ls-solo}', 'approved') " +
       "on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + PRO + "','provider','가격 업체 사람','pp-a')," +
       "('" + OTH + "','provider','남의 업체 사람','pp-b')," +
       "('" + CUS + "','customer','가격 손님', null)," +
       "('" + ADM + "','admin','가격 관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");

  const as = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const save = (u, o) => as(u) + "select save_provider_price('" +
    JSON.stringify(o).replace(/'/g, "''") + "'::jsonb)";

  console.log("\n── 누가 올릴 수 있나");
  const byAnon = denied(anon + "select save_provider_price('{\"sub\":\"ls-solo\"," +
    "\"label\":\"주 1회\",\"amount\":100000,\"unit\":\"8회\"}'::jsonb)");
  ok("비로그인은 못 올린다", byAnon.no, byAnon.why);
  const byCus = denied(save(CUS, { provider:"pp-a", sub:"ls-solo",
    label:"손님이 올려 봅니다", amount:1000, unit:"1회" }));
  ok("손님은 못 올린다", byCus.no, byCus.why);
  const byOth = denied(save(OTH, { provider:"pp-a", sub:"ls-solo",
    label:"남의 업체에 올려 봅니다", amount:1000, unit:"1회" }));
  ok("⚠️ 다른 업체의 가격은 못 올린다", byOth.no, byOth.why);
  ok("  그 거절이 **내 업체만**이라고 말한다",
     byOth.no && byOth.why.indexOf("내 업체") >= 0, byOth.why);

  console.log("\n── 빈 칸은 각각 **다른 말**로 거절합니다");
  let d = denied(save(PRO, { label:"서비스를 안 골랐습니다", amount:1000, unit:"1회" }));
  ok("서비스를 안 고르면 막힌다", d.no && /어느 서비스/.test(d.why), d.why);
  d = denied(save(PRO, { sub:"ls-solo", amount:1000, unit:"1회" }));
  ok("무엇의 가격인지 안 적으면 막힌다 (다른 말)",
     d.no && /무엇의 가격/.test(d.why), d.why);
  /* ⚠️⚠️ **단위를 안 받으면 "90만원" 이 한 번인지 한 달인지 모릅니다** */
  d = denied(save(PRO, { sub:"ls-solo", label:"주 1회 · 8회권", amount:900000 }));
  ok("⚠️ 단위를 안 적으면 막힌다 (또 다른 말)", d.no && /단위/.test(d.why), d.why);
  d = denied(save(PRO, { sub:"ls-solo", label:"주 1회 · 8회권", unit:"8회" }));
  ok("금액을 안 적으면 막힌다", d.no && /금액/.test(d.why), d.why);
  d = denied(save(PRO, { sub:"ls-solo", label:"주 1회", amount:"아홉만원", unit:"8회" }));
  ok("금액에 글자를 적으면 막힌다", d.no && /숫자/.test(d.why), d.why);

  console.log("\n── ⚠️⚠️ 그 업체가 **하지 않는 일**에는 가격을 못 답니다");
  const notMine = denied(save(PRO, { sub:"ft-grip", label:"안 하는 일입니다",
    amount:30000, unit:"1회" }));
  ok("하는 일에 없는 하위에는 못 올린다 (어느 화면에도 안 뜰 가격입니다)",
     notMine.no, notMine.why);
  ok("  그 거절이 **하는 일에 먼저 넣으라**고 말한다",
     notMine.no && notMine.why.indexOf("하는 일") >= 0, notMine.why);

  console.log("\n── ⚠️ 경계값 — 0 원은 값입니다");
  const free = psql(save(PRO, { sub:"ls-solo", label:"첫 상담 무료 체험",
    amount:0, unit:"1회" }));
  ok("0 원이 들어간다 (무료 체험)", /^[0-9a-f-]{36}$/.test(free), free);
  const neg = denied(save(PRO, { sub:"ls-solo", label:"음수를 넣어 봅니다",
    amount:-1, unit:"1회" }));
  ok("음수는 막힌다", neg.no, neg.why);
  /* ⚠️ 자릿수 사고 — 비율 99.99% 에서 85조원이 화면에 나간 그 자리 */
  const huge = denied(save(PRO, { sub:"ls-solo", label:"자릿수를 잘못 적습니다",
    amount:100000001, unit:"1회" }));
  ok("1억을 넘기면 막힌다 (자릿수를 잘못 적은 것입니다)", huge.no, huge.why);
  const edge = psql(save(PRO, { sub:"ls-solo", label:"딱 1억짜리 연간권",
    amount:100000000, unit:"1년" }));
  ok("⚠️ 1억은 들어간다 (경계 바로 위만 막습니다)", /^[0-9a-f-]{36}$/.test(edge), edge);
  const shortLab = denied(save(PRO, { sub:"ls-solo", label:"가", amount:1000, unit:"1회" }));
  ok("이름이 한 글자면 막힌다", shortLab.no, shortLab.why);

  console.log("\n── 올리고 고칩니다");
  const PID = psql(save(PRO, { sub:"ls-solo", label:"주 1회 · 8회권",
    amount:400000, unit:"8회", note:"타석 이용료 별도" }));
  ok("업체가 제 가격을 올린다", /^[0-9a-f-]{36}$/.test(PID), PID);
  ok("  금액 · 단위 · 덧말이 그대로 들어간다",
     psql("select amount::text || '/' || unit || '/' || coalesce(note,'') " +
          "from provider_price where id='" + PID + "'") === "400000/8회/타석 이용료 별도");
  ok("고칠 수 있다",
     allowed(save(PRO, { id: PID, amount: 380000 })).yes);
  ok("  고친 값이 들어간다",
     psql("select amount::text from provider_price where id='" + PID + "'") === "380000");
  /* ⚠️⚠️ **덧말은 지울 수 있어야 합니다** — coalesce 로 덮으면 한 번 적은
     글을 영원히 못 지웁니다 (칸을 보냈는지로 가릅니다). */
  ok("⚠️ 덧말을 **지울 수 있다**",
     allowed(save(PRO, { id: PID, note: "" })).yes &&
     psql("select coalesce(note,'(없음)') from provider_price where id='" + PID + "'") === "(없음)");
  ok("운영자는 대신 올릴 수 있다 (전화로 받은 가격을 담당자가 넣습니다)",
     allowed(save(ADM, { provider:"pp-a", sub:"rg-in", label:"타석 1시간",
       amount:12000, unit:"1시간" })).yes);
  ok("  누가 넣었는지 감사 기록에 남는다",
     Number(psql("select count(*)::text from audit_log where obj='provider_price'")) >= 2);
  const moveOther = denied(save(OTH, { id: PID, amount: 1 }));
  ok("⚠️ 남의 가격 줄은 **id 를 알아도** 못 고친다", moveOther.no, moveOther.why);

  console.log("\n── 표를 직접 고치는 길이 없는가");
  const ins = denied(as(PRO) + "insert into provider_price (provider_id, sub, label, " +
    "amount, unit) values ('pp-a','ls-solo','표에 직접 넣어 봅니다',1,'1회')");
  ok("표에 직접 넣는 길이 없다 (문 둘만 엽니다)", ins.no, ins.why);
  /* ⚠️⚠️ RLS 는 UPDATE 에서 에러를 안 냅니다 — **값**을 봅니다 */
  allowed(as(PRO) + "update provider_price set amount = 1 where id='" + PID + "'");
  ok("표를 직접 고치지 못한다 (0줄이 바뀝니다)",
     psql("select amount::text from provider_price where id='" + PID + "'") === "380000");

  console.log("\n── 내립니다 — ⚠️ 지우지 않습니다");
  const byCus2 = denied(as(CUS) + "select drop_provider_price(jsonb_build_object('id','" + PID + "'))");
  ok("손님은 못 내린다", byCus2.no, byCus2.why);
  const byOth2 = denied(as(OTH) + "select drop_provider_price(jsonb_build_object('id','" + PID + "'))");
  ok("다른 업체도 못 내린다", byOth2.no, byOth2.why);
  ok("업체가 제 가격을 내린다",
     allowed(as(PRO) + "select drop_provider_price(jsonb_build_object('id','" + PID + "'))").yes);
  ok("⚠️ 줄이 **지워지지 않는다** (얼마를 걸어 두었나가 기록입니다)",
     psql("select count(*)::text from provider_price where id='" + PID + "'") === "1");
  ok("  내려간 것으로 표시된다",
     psql("select active::text from provider_price where id='" + PID + "'") === "false");
  const twice = denied(as(PRO) + "select drop_provider_price(jsonb_build_object('id','" + PID + "'))");
  ok("두 번 내리면 **다른 말로** 거절한다", twice.no, twice.why);

  console.log("\n── ⚠️⚠️ 공개 보기 — 이 where 절이 자물쇠입니다");
  /* 보기는 RLS 를 지나지 않습니다 — anon 으로 **실제로 읽어** 봅니다
     (정책을 읽고 "열려 있다" 고 결론 내지 마세요 — 작업 기억).
     ⚠️⚠️ 업체 줄을 고치는 길은 **관리자뿐**입니다 (0030 의 provider_guard ·
     0038 의 provider_state_guard). 검사가 superuser 로 바로 update 하면
     `my_role()` 이 NULL 이라 트리거가 막습니다 — 그 자물쇠가 제 일을 한
     것이고, 틀린 것은 **검사**입니다. 그래서 관리자로 바꿉니다. */
  /* ⚠️⚠️ 여기서는 `set role` 을 **하지 않습니다.** 업체 줄은 GRANT 가
     아무에게도 update 를 주지 않아서(쓰는 길은 문뿐입니다) 관리자로
     바꿔도 `permission denied` 입니다 — 자물쇠가 **둘**인 자리입니다.
     검사는 임자 권한으로 돌면서 `become()` 으로 **역할만** 관리자로
     둡니다 (트리거가 보는 것은 `my_role()` 입니다). */
  const adm = sql => psql("select become('" + ADM + "'); " + sql);
  const pvState = (to, why) => psql(as(ADM) +
    "select set_provider_state(jsonb_build_object('id','pp-a','to','" + to + "'" +
    (why ? ",'why','" + why + "'" : "") + "))");
  adm("update provider set is_test = false where id in ('pp-a','pp-b')");
  const seeAnon = n => psql(anon + "select count(*)::text from v_provider_price_public " +
                            "where provider_id='" + n + "'");
  ok("공개 · 승인된 업체의 **올려 둔** 가격은 anon 이 읽는다",
     Number(seeAnon("pp-a")) >= 1, seeAnon("pp-a"));
  /* ① 내린 가격 */
  ok("⚠️ ① **내린** 가격은 안 나간다",
     psql(anon + "select count(*)::text from v_provider_price_public where id='" +
          PID + "'") === "0");
  /* ② 비공개 업체 */
  adm("update provider set listed = false where id='pp-a'");
  ok("⚠️ ② **비공개** 업체의 가격은 안 나간다", seeAnon("pp-a") === "0");
  adm("update provider set listed = true where id='pp-a'");
  /* ③ 승인 안 된 업체 (0038) — ⚠️ 문으로 정지합니다 (그 문이 공개도
     같이 끕니다. 관리자라도 정지된 업체를 공개로 켤 수는 없습니다). */
  pvState("suspended", "가격 검사");
  ok("⚠️ ③ **정지된** 업체의 가격은 안 나간다", seeAnon("pp-a") === "0");
  pvState("approved");
  adm("update provider set listed = true where id='pp-a'");
  ok("  정지를 풀고 다시 공개하면 나온다 (너무 넓게 막는 것도 고장입니다)",
     Number(seeAnon("pp-a")) >= 1, seeAnon("pp-a"));
  /* ④ 검사용 업체 (0030 · 2차 지시서 §8) */
  adm("update provider set is_test = true where id='pp-a'");
  ok("⚠️ ④ **검사용** 업체의 가격은 안 나간다", seeAnon("pp-a") === "0");
  adm("update provider set is_test = false where id='pp-a'");
  ok("  되돌리면 다시 나온다", Number(seeAnon("pp-a")) >= 1, seeAnon("pp-a"));

  console.log("\n── ⚠️ GRANT 와 RLS 를 **따로** 눌러 봅니다");
  /* 표 자체는 anon 에게 한 줄도 안 열립니다 (GRANT 가 없습니다) */
  const tbl = denied(anon + "select count(*) from provider_price");
  ok("anon 은 **표**를 아예 못 읽는다 (GRANT)", tbl.no && /permission denied/i.test(tbl.why),
     tbl.why);
  /* 로그인한 손님은 GRANT 는 있지만 정책이 없어 **빈 결과**입니다 —
     ⚠️ 읽기 쪽은 에러가 아니라 조용히 0줄입니다 (그래서 값을 봅니다). */
  ok("로그인한 손님은 GRANT 는 있어도 **0줄**을 받는다 (RLS)",
     psql(as(CUS) + "select count(*)::text from provider_price") === "0");
  ok("⚠️ 업체는 **제 줄만** 본다 (남의 가격표를 베낄 수 없습니다)",
     psql(as(PRO) + "select count(distinct provider_id)::text from provider_price") === "1" &&
     psql(as(PRO) + "select distinct provider_id from provider_price") === "pp-a");
  ok("운영자는 전부 본다",
     Number(psql(as(ADM) + "select count(*)::text from provider_price")) >= 2);
};

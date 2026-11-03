/* ════════════════════════════════════════════════════════════════════
   제3자 제공 **철회** · 요청 취소를 눌러 봅니다 (0039 · 3차 지시서 §5)

   ⚠️⚠️⚠️ **"끊었다" 를 한 길로만 재면 안 됩니다.** 업체가 손님을 보는
   길이 셋입니다 — 성함 · 연락처(request) · 무엇을 요청했나
   (request_item) · 올린 사진(request_photo). 하나만 끊고 "철회됐다" 고
   하면, 업체는 나머지 둘로 계속 봅니다. **셋을 따로** 눌러 봅니다.

   ⚠️⚠️ **일부러 안 끊은 것도 재 봅니다** — 막혀 있으면 그것도 고장
   입니다. 업체가 이미 낸 견적은 남아야 하고, 손님도 받아 둔 견적을
   계속 봐야 합니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0039 철회 · 취소 — 씨앗");
  const CUS = psql("insert into auth.users (email) values ('rv2-cus@x.test') returning id");
  const OTH = psql("insert into auth.users (email) values ('rv2-oth@x.test') returning id");
  const PRO = psql("insert into auth.users (email) values ('rv2-pro@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('rv2-adm@x.test') returning id");

  psql("insert into provider (id, name, listed, is_test) values " +
       "('rk-a','[검사용] 철회 업체', true, true) on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + CUS + "','customer','철회 손님', null)," +
       "('" + OTH + "','customer','남', null)," +
       "('" + PRO + "','provider','철회 업체 사람','rk-a')," +
       "('" + ADM + "','admin','철회 관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");
  psql("update provider set assignable = true where id = 'rk-a'");

  const as = u => "select become('" + u + "'); set role authenticated; ";
  const RID = psql("insert into request (no, side, tel, name, agree_at, state, user_id) " +
    "values ('RK-0001','golf','010-8888-0001','철회손님', now(), 'consult','" +
    CUS + "') returning id::text");
  const IID = psql("insert into request_item (request_id, service_id) values " +
    "('" + RID + "','ls-solo') returning id::text");
  psql("insert into request_photo (request_id, path, mime, bytes) values " +
       "('" + RID + "','x/one.jpg','image/jpeg', 1234)");
  const AID = psql("insert into assignment (request_id, provider_id, item_id, " +
    "agree3rd_at, state) values ('" + RID + "','rk-a','" + IID +
    "', now(), 'accepted') returning id::text");
  psql(as(PRO) + "select submit_quote('" + RID +
       "','{\"amount\":700000,\"scope\":\"철회 전에 낸 견적\"}'::jsonb)");

  console.log("\n── 끊기 전에는 업체가 셋 다 봅니다 (안 보이면 아래가 뜻이 없습니다)");
  ok("업체가 손님 성함 · 연락처를 본다",
     psql(as(PRO) + "select count(*)::text from request where id='" + RID + "'") === "1");
  ok("업체가 요청 내용을 본다",
     psql(as(PRO) + "select count(*)::text from request_item where request_id='" + RID + "'") === "1");
  ok("업체가 올린 사진을 본다",
     psql(as(PRO) + "select count(*)::text from request_photo where request_id='" + RID + "'") === "1");

  console.log("\n── 누가 철회할 수 있나");
  const rv = (u, id, why) => as(u) + "select revoke_third_party(jsonb_build_object(" +
    "'assignment','" + id + "'" + (why ? ",'why','" + why + "'" : "") + "))";
  const byOth = denied(rv(OTH, AID, "남이 철회해 봅니다"));
  ok("남은 철회할 수 없다", byOth.no, byOth.why);
  const byPro = denied(rv(PRO, AID, "업체가 철회해 봅니다"));
  ok("업체도 철회할 수 없다", byPro.no, byPro.why);
  /* ⚠️ 운영자도 대신 못 합니다 — 대신 하면 "손님이 원해서" 인지
     "운영자가 치워서" 인지 기록에서 갈리지 않습니다. */
  const byAdm = denied(rv(ADM, AID, "운영자가 대신 철회해 봅니다"));
  ok("운영자도 대신 못 한다 (누가 원했는지가 기록에서 갈려야 합니다)", byAdm.no, byAdm.why);
  const noWhy = denied(rv(CUS, AID));
  ok("까닭 없이는 못 철회한다", noWhy.no, noWhy.why);
  ok("  그 거절이 **업체가 알아야 한다**고 말한다",
     noWhy.no && noWhy.why.indexOf("업체가") >= 0, noWhy.why);

  console.log("\n── 철회합니다 — 세 길이 **전부** 끊기나");
  ok("손님은 까닭을 적고 철회한다",
     allowed(rv(CUS, AID, "다른 업체로 하기로 했습니다")).yes);
  ok("⚠️ ① 성함 · 연락처가 **안 보인다**",
     psql(as(PRO) + "select count(*)::text from request where id='" + RID + "'") === "0");
  ok("⚠️ ② 요청 내용이 **안 보인다**",
     psql(as(PRO) + "select count(*)::text from request_item where request_id='" + RID + "'") === "0");
  ok("⚠️ ③ 올린 사진이 **안 보인다**",
     psql(as(PRO) + "select count(*)::text from request_photo where request_id='" + RID + "'") === "0");
  /* ⚠️⚠️ **배정 줄은 지우지 않습니다** — 넘어간 적이 있다는 기록입니다 */
  ok("⚠️ 배정 줄은 **지워지지 않는다** (제공 이력입니다)",
     psql("select count(*)::text from assignment where id='" + AID + "'") === "1");
  ok("  철회한 때와 까닭이 남는다",
     psql("select (revoked_at is not null)::text || '/' || revoked_why " +
          "from assignment where id='" + AID + "'") === "true/다른 업체로 하기로 했습니다");
  ok("  손님은 제공 이력을 그대로 본다 (§5 의 '제공 이력 확인')",
     psql(as(CUS) + "select count(*)::text from assignment where id='" + AID + "'") === "1");
  ok("감사 기록이 남는다",
     Number(psql("select count(*)::text from audit_log where obj='assignment' " +
                 "and to_state='revoked'")) >= 1);
  const twice = denied(rv(CUS, AID, "또"));
  ok("두 번 철회하면 **다른 말로** 거절한다", twice.no, twice.why);

  console.log("\n── 철회한 업체는 더 진행하지 못합니다");
  const q2 = denied(as(PRO) + "select submit_quote('" + RID +
    "','{\"amount\":100000,\"scope\":\"철회 뒤에 내 봅니다\"}'::jsonb)");
  ok("⚠️ 새 견적을 못 낸다", q2.no, q2.why);
  const ap = denied("insert into appointment (request_id, provider_id, at) values " +
    "('" + RID + "','rk-a', now() + interval '2 days')");
  ok("⚠️ 새 일정도 못 잡는다", ap.no, ap.why);
  ok("  두 거절이 **철회 때문**이라고 말한다",
     q2.no && ap.no && q2.why.indexOf("철회") >= 0 && ap.why.indexOf("철회") >= 0,
     q2.why + " / " + ap.why);

  console.log("\n── ⚠️ 일부러 **안 끊은** 것 (철회는 '없던 일' 이 아닙니다)");
  ok("업체가 **이미 낸 견적**은 남는다",
     psql("select count(*)::text from quote where request_id='" + RID +
          "' and provider_id='rk-a'") === "1");
  ok("손님도 받아 둔 견적을 **그대로 본다**",
     psql(as(CUS) + "select count(*)::text from quote where request_id='" + RID + "'") === "1");
  /* ⚠️ 업체가 제 견적을 보는 것도 막지 않습니다 — 제가 낸 금액입니다 */
  ok("업체도 제가 낸 견적은 본다 (제 기록입니다)",
     psql(as(PRO) + "select count(*)::text from quote where request_id='" + RID + "'") === "1");

  console.log("\n── 요청 취소");
  const R2 = psql("insert into request (no, side, tel, name, agree_at, state, user_id) " +
    "values ('RK-0002','golf','010-8888-0002','철회손님', now(), 'consult','" +
    CUS + "') returning id::text");
  const A2 = psql("insert into assignment (request_id, provider_id, agree3rd_at, state) " +
    "values ('" + R2 + "','rk-a', now(), 'accepted') returning id::text");
  const cx = (u, id, why) => as(u) + "select cancel_request(jsonb_build_object(" +
    "'request','" + id + "'" + (why ? ",'why','" + why + "'" : "") + "))";
  const cOth = denied(cx(OTH, R2, "남이 취소"));
  ok("남의 요청은 취소할 수 없다", cOth.no, cOth.why);
  const cNoWhy = denied(cx(CUS, R2));
  ok("까닭 없이는 취소 못 한다", cNoWhy.no, cNoWhy.why);
  ok("취소한다", allowed(cx(CUS, R2, "직접 알아보기로 했습니다")).yes);
  ok("  상태가 '진행 안 함' 이 된다",
     psql("select state::text from request where id='" + R2 + "'") === "lost");
  /* ⚠️⚠️ 취소하면 **제공도 전부 철회**됩니다 — 거둔 요청의 연락처를
     업체가 계속 볼 까닭이 없습니다. */
  ok("⚠️ 취소하면 넘어가 있던 제공이 **전부 철회된다**",
     psql("select (revoked_at is not null)::text from assignment where id='" + A2 + "'") === "true");
  ok("  업체가 그 요청을 더는 못 본다",
     psql(as(PRO) + "select count(*)::text from request where id='" + R2 + "'") === "0");
  const cTwice = denied(cx(CUS, R2, "또"));
  ok("두 번 취소하면 **다른 말로** 거절한다", cTwice.no, cTwice.why);

  console.log("\n── ⚠️ 계약 뒤에는 혼자 못 거둡니다");
  const R3 = psql("insert into request (no, side, tel, name, agree_at, state, user_id) " +
    "values ('RK-0003','golf','010-8888-0003','철회손님', now(), 'signed','" +
    CUS + "') returning id::text");
  const cSigned = denied(cx(CUS, R3, "그만두겠습니다"));
  ok("계약 단계면 혼자 취소할 수 없다", cSigned.no, cSigned.why);
  /* ⚠️ 막다른 길로 두지 않습니다 — 무엇을 하라고 말해야 합니다 */
  ok("  그 거절이 **어디로 가라**고 말한다",
     cSigned.no && cSigned.why.indexOf("고객센터") >= 0, cSigned.why);
  ok("  그래서 상태가 안 바뀐다",
     psql("select state::text from request where id='" + R3 + "'") === "signed");
};

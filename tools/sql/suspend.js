/* ════════════════════════════════════════════════════════════════════
   업체 정지를 눌러 봅니다 (0038 · 3차 지시서 §2 · §11-3 · §11-7)

   ⚠️⚠️ **정지가 뜻하는 것 셋을 따로 눌러 봅니다.** 하나로 묶어 재면
   한 자물쇠가 내려가도 다른 것이 먼저 막아서 **엉뚱한 까닭으로
   통과**합니다 (이 저장소가 여러 번 겪은 자리).
     ① 공개 목록에서 빠지나
     ② 새 배정을 못 받나
     ③ 새 견적을 못 내나

   ⚠️⚠️ **일부러 안 막은 것도 재 봅니다** — 막혀 있으면 그것도 고장
   입니다 ("너무 넓게 막는 것도 고장" — 작업 기억).
     · 손님이 **이미 받은 견적을 고르는 것**은 그대로 되어야 합니다
     · 정지된 업체가 **제 소개글을 고치는 것**은 되어야 합니다
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0038 업체 정지 — 씨앗");
  const ADM = psql("insert into auth.users (email) values ('sp-adm@x.test') returning id");
  const STF = psql("insert into auth.users (email) values ('sp-stf@x.test') returning id");
  const PRO = psql("insert into auth.users (email) values ('sp-pro@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('sp-cus@x.test') returning id");

  psql("insert into provider (id, name, listed, is_test) values " +
       "('sp-a','[검사용] 정지 업체', true, true) on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + ADM + "','admin','정지 관리자', null)," +
       "('" + STF + "','staff','직원', null)," +
       "('" + PRO + "','provider','정지 업체 사람','sp-a')," +
       "('" + CUS + "','customer','정지 손님', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");
  psql("update provider set assignable = true where id = 'sp-a'");

  const as = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const mv = (u, to, why) => as(u) + "select set_provider_state(jsonb_build_object('id','sp-a'" +
    ",'to','" + to + "'" + (why ? ",'why','" + why + "'" : "") + "))";

  /* ⚠️ 기본값이 approved 인지부터 — 아니면 아래가 전부 엉뚱한 까닭으로
     통과합니다 (줄이 있다는 것 자체가 심사를 지났다는 뜻입니다). */
  ok("줄이 생기면 기본이 approved 다",
     psql("select state from provider where id='sp-a'") === "approved");

  console.log("\n── 누가 바꿀 수 있나");
  const byPro = denied(mv(PRO, "suspended", "제가 저를 내려 봅니다"));
  ok("업체는 제 상태를 못 바꾼다", byPro.no, byPro.why);
  const byStf = denied(mv(STF, "suspended", "직원이 내려 봅니다"));
  ok("직원도 못 바꾼다 (영업을 멈추는 일입니다)", byStf.no, byStf.why);
  const noWhy = denied(mv(ADM, "suspended"));
  ok("까닭 없이는 못 내린다", noWhy.no, noWhy.why);
  ok("  그 거절이 **까닭**을 말한다",
     noWhy.no && noWhy.why.indexOf("까닭") >= 0, noWhy.why);
  const bogus = denied(mv(ADM, "없는상태", "x"));
  ok("없는 상태로는 못 옮긴다", bogus.no, bogus.why);

  /* ⚠️⚠️ 칸 GRANT 가 첫 자물쇠입니다 — 업체가 표를 바로 고치는 길 */
  const direct = allowed(as(PRO) + "update provider set state = 'suspended' where id='sp-a'");
  ok("업체가 표를 직접 고쳐도 상태가 안 바뀐다 (칸 GRANT)",
     psql("select state from provider where id='sp-a'") === "approved",
     direct.why || direct.out);

  console.log("\n── 정지 전에 견적을 하나 받아 둡니다 (나중에 고를 수 있어야 합니다)");
  const RID = psql("insert into request (no, side, tel, name, agree_at, state, user_id) " +
    "values ('SP-0001','golf','010-7777-0001','정지손님', now(), 'consult','" +
    CUS + "') returning id::text");
  psql("insert into assignment (request_id, provider_id, agree3rd_at, state) " +
       "values ('" + RID + "','sp-a', now(), 'accepted') on conflict do nothing");
  psql(as(PRO) + "select submit_quote('" + RID +
       "','{\"amount\":500000,\"scope\":\"정지 전에 낸 견적\"}'::jsonb)");
  ok("씨앗: 정지 전 견적이 하나 있다",
     psql("select count(*)::text from quote where request_id='" + RID + "'") === "1");

  console.log("\n── 정지합니다");
  const sus = allowed(mv(ADM, "suspended", "서류가 확인되지 않았습니다"));
  ok("관리자는 까닭을 적고 정지한다", sus.yes, sus.why);
  ok("  까닭 · 때 · 누가가 남는다",
     psql("select (state_why is not null and state_at is not null " +
          "and state_by is not null)::text from provider where id='sp-a'") === "true");
  /* ⚠️⚠️ **공개도 같이 꺼져야 합니다** — 상태만 바꾸고 listed 를 켜 둔
     채 두면 listed 만 보는 다른 자리가 내보냅니다. */
  ok("⚠️ 공개(listed)도 같이 꺼진다",
     psql("select listed::text from provider where id='sp-a'") === "false");
  ok("감사 기록이 남는다",
     Number(psql("select count(*)::text from audit_log where obj='provider' " +
                 "and to_state='suspended'")) >= 1);
  const twice = denied(mv(ADM, "suspended", "또"));
  ok("두 번 정지하면 **다른 말로** 거절한다", twice.no, twice.why);

  console.log("\n── 자물쇠 ① 공개 목록에서 빠지나");
  /* ⚠️ 검사용 업체는 is_test 가 **먼저** 막습니다 — 그걸로 재면 엉뚱한
     까닭으로 통과합니다. **참 업체**를 따로 세워 누릅니다. */
  psql("insert into provider (id, name, listed, is_test) values " +
       "('sp-real','정지 참 업체', true, false) on conflict (id) do nothing");
  ok("씨앗: 참 업체가 공개 목록에 보인다",
     psql(anon + "select count(*)::text from v_provider_card where id='sp-real'") === "1");
  psql(as(ADM) + "select set_provider_state(jsonb_build_object(" +
       "'id','sp-real','to','suspended','why','검사'))");
  ok("⚠️ 정지하면 공개 목록에서 **빠진다**",
     psql(anon + "select count(*)::text from v_provider_card where id='sp-real'") === "0");
  /* ⚠️⚠️ 관리자라도 정지된 업체를 공개로 켤 수 없습니다 */
  const relist = denied("select become('" + ADM + "'); " +
                        "update provider set listed = true where id='sp-real'");
  ok("정지된 업체를 공개로 **켤 수 없다** (먼저 정지를 풀어야 합니다)",
     relist.no, relist.why);
  psql(as(ADM) + "select set_provider_state(jsonb_build_object('id','sp-real','to','approved'))");
  ok("정지를 풀면 까닭이 지워진다",
     psql("select coalesce(state_why,'비었음') from provider where id='sp-real'") === "비었음");

  console.log("\n── 자물쇠 ② 새 배정을 못 받나");
  const RID2 = psql("insert into request (no, side, tel, name, agree_at, state, user_id) " +
    "values ('SP-0002','golf','010-7777-0002','정지손님2', now(), 'check','" +
    CUS + "') returning id::text");
  const asg = denied("insert into assignment (request_id, provider_id, agree3rd_at, state) " +
                     "values ('" + RID2 + "','sp-a', now(), 'sent')");
  ok("⚠️ 정지된 업체에는 **새 배정이 안 걸린다**", asg.no, asg.why);
  ok("  그 거절이 **상태 때문**이라고 말한다 (배정 가능 탓으로 돌리지 않는다)",
     asg.no && asg.why.indexOf("상태") >= 0, asg.why);

  console.log("\n── 자물쇠 ③ 새 견적을 못 내나");
  const q2 = denied(as(PRO) + "select submit_quote('" + RID +
    "','{\"amount\":400000,\"scope\":\"정지 중에 내 봅니다\"}'::jsonb)");
  ok("⚠️ 정지된 업체는 **새 견적을 못 낸다**", q2.no, q2.why);
  ok("  그 거절도 **다른 말**이다",
     q2.no && asg.no && q2.why !== asg.why, q2.why + " / " + asg.why);
  /* ⚠️ 표에 직접 넣는 길도 막혀 있어야 합니다 (트리거가 봅니다) */
  const qDirect = denied("insert into quote (request_id, provider_id, amount, scope) " +
    "values ('" + RID + "','sp-a', 1000, '직접 넣어 봅니다')");
  ok("  표에 직접 넣어도 막힌다 (문이 아니라 트리거가 봅니다)", qDirect.no, qDirect.why);

  console.log("\n── ⚠️ 일부러 **안 막은** 것 (너무 넓게 막는 것도 고장입니다)");
  /* 손님이 정지 전에 받아 둔 견적을 고르는 것 */
  const pick = allowed(as(CUS) + "select choose_quote('" + RID + "','sp-a')");
  ok("손님은 **이미 받은 견적을 고를 수 있다** (업체 정지와 무관합니다)",
     pick.yes, pick.why);
  ok("  그 견적이 고른 상태가 된다",
     psql("select state from quote where request_id='" + RID + "'") === "chosen");
  /* 정지된 업체가 제 소개글을 고치는 것 — ⚠️⚠️ **문으로 눌러야 합니다.**
     처음에 표를 직접 update 해 보고 "permission denied" 가 떠서 실패로
     찍혔는데, 업체가 제 줄을 고치는 길은 애초에 그게 아닙니다:
     RLS 에 provider 의 update 정책이 없고, 고치는 길은
     `save_provider_self()`(0014→0023) **문 하나**입니다.
     ⚠️ 막혔는지 재려면 **실제로 쓰는 길**을 눌러야 합니다 — 안 그러면
     엉뚱한 자물쇠를 재고 "막혔다" 고 말하게 됩니다. */
  const edit = allowed(as(PRO) +
    "select save_provider_self('{\"intro\":\"고친 소개글입니다\"}'::jsonb)");
  ok("정지된 업체도 **제 소개글은 고칠 수 있다** (고칠 길이 있어야 합니다)",
     edit.yes && psql("select intro from provider where id='sp-a'") === "고친 소개글입니다",
     edit.why);
  /* ⚠️ 그래도 **공개 · 상태는 못 만집니다** — 그 문은 그 칸들을 안 받습니다 */
  ok("  그래도 공개 · 상태는 그대로다 (그 문이 받는 칸이 아닙니다)",
     psql("select listed::text || '/' || state from provider where id='sp-a'")
       === "false/suspended");

  console.log("\n── 풀면 돌아오나");
  psql(as(ADM) + "select set_provider_state(jsonb_build_object('id','sp-a','to','approved'))");
  ok("정지를 풀면 상태가 approved 다",
     psql("select state from provider where id='sp-a'") === "approved");
  const asg2 = allowed("insert into assignment (request_id, provider_id, agree3rd_at, state) " +
                       "values ('" + RID2 + "','sp-a', now(), 'sent')");
  ok("  새 배정이 다시 걸린다", asg2.yes, asg2.why);
  const q3 = allowed(as(PRO) + "select submit_quote('" + RID2 +
    "','{\"amount\":300000,\"scope\":\"풀린 뒤에 낸 견적\"}'::jsonb)");
  /* ⚠️ 배정을 수락해야 견적이 열립니다 (0008) — 그 자물쇠는 그대로입니다 */
  ok("  견적은 **수락을 먼저** 해야 열린다 (0008 의 자물쇠는 그대로다)",
     !q3.yes && String(q3.why).indexOf("수락") >= 0, q3.why);
};

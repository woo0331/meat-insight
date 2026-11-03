/* ════════════════════════════════════════════════════════════════════
   상담 예약 · 일정을 눌러 봅니다 (2차 지시서 §7 · 0034)

   ⚠️⚠️ **잡는 사람은 업체입니다.** 손님이 아무 때나 잡게 두면 업체가
   못 가는 시각이 잡히고, 그건 플랫폼이 한 약속이 됩니다. 손님은
   **보고 · 취소**합니다 — 그 갈림을 여기서 잽니다.

   ⚠️⚠️ **경계값을 넣어 봅니다.** 어제로 잡는 것은 오타이고(2025년으로
   찍히는 사고가 여기서 납니다), 반대로 **너무 좁게 막는 것도 고장**
   입니다 — 어젯밤 통화로 정한 오늘 아침 약속을 오늘 적는 일이 있습니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0034 일정 — 씨앗");
  const PRO = psql("insert into auth.users (email) values ('ap-pro@x.test') returning id");
  const PR2 = psql("insert into auth.users (email) values ('ap-pro2@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('ap-cus@x.test') returning id");
  const OTH = psql("insert into auth.users (email) values ('ap-oth@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('ap-adm@x.test') returning id");

  psql("insert into provider (id, name, listed, is_test) values " +
       "('ap-a','[검사용] 일정 가', true, true)," +
       "('ap-b','[검사용] 일정 나', true, true) " +
       "on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + PRO + "','provider','가 사람','ap-a')," +
       "('" + PR2 + "','provider','나 사람','ap-b')," +
       "('" + CUS + "','customer','일정 손님', null)," +
       "('" + OTH + "','customer','남', null)," +
       "('" + ADM + "','admin','일정 관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");
  psql("update provider set assignable = true where id in ('ap-a','ap-b')");
  ok("씨앗: 두 업체가 배정 가능으로 켜졌다",
     psql("select count(*)::text from provider where id like 'ap-%' and assignable") === "2");

  const RID = psql("insert into request (no, side, tel, name, agree_at, state, user_id) " +
    "values ('AP-0001','golf','010-3333-4444','일정손님', now(), 'consult','" +
    CUS + "') returning id::text");
  psql("insert into assignment (request_id, provider_id, agree3rd_at, state) values " +
       "('" + RID + "','ap-a', now(), 'accepted')," +
       "('" + RID + "','ap-b', now(), 'sent') on conflict do nothing");

  const as = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const set = (u, body) =>
    as(u) + "select set_appointment('" + body.replace(/'/g, "''") + "'::jsonb)";
  const AT = "now() + interval '3 days'";
  const good = extra =>
    "jsonb_build_object('request','" + RID + "','at', " + AT +
    (extra ? ", " + extra : "") + ")";
  const setJ = (u, obj) => as(u) + "select set_appointment(" + obj + ")";

  console.log("\n── 누가 잡을 수 있나");
  const byCus = denied(setJ(CUS, good()));
  ok("손님은 일정을 못 잡는다", byCus.no, byCus.why);
  ok("  그 거절이 **업체가 잡는다**고 말한다",
     byCus.no && byCus.why.indexOf("업체가 잡습니다") >= 0, byCus.why);
  const byAdm = denied(setJ(ADM, good()));
  ok("운영자도 대신 못 잡는다 (업체의 일정은 업체가 압니다)", byAdm.no, byAdm.why);
  const notAcc = denied(setJ(PR2, good()));
  ok("배정을 수락하지 않은 업체는 못 잡는다", notAcc.no, notAcc.why);
  ok("  그 거절이 **수락을 먼저**라고 말한다",
     notAcc.no && notAcc.why.indexOf("수락") >= 0, notAcc.why);

  console.log("\n── 때의 경계값");
  const past = denied(setJ(PRO,
    "jsonb_build_object('request','" + RID + "','at', now() - interval '2 days')"));
  ok("이틀 전으로는 못 잡는다 (오타를 막습니다)", past.no, past.why);
  /* ⚠️ 너무 좁게 막는 것도 고장입니다 — 어젯밤 통화로 정한 오늘 아침
     약속을 오늘 적는 일이 있습니다. */
  const yest = allowed(setJ(PRO,
    "jsonb_build_object('request','" + RID + "','at', now() - interval '3 hours')"));
  ok("세 시간 전은 **된다** (방금 만난 것을 적는 자리)", yest.yes, yest.why);
  const far = denied(setJ(PRO,
    "jsonb_build_object('request','" + RID + "','at', now() + interval '3 years')"));
  ok("세 해 뒤는 못 잡는다", far.no, far.why);
  const near = allowed(setJ(PRO,
    "jsonb_build_object('request','" + RID + "','at', now() + interval '23 months')"));
  ok("스물세 달 뒤는 된다 (경계 바로 안쪽)", near.yes, near.why);
  const noAt = denied(as(PRO) +
    "select set_appointment(jsonb_build_object('request','" + RID + "'))");
  ok("때를 안 적으면 막힌다", noAt.no, noAt.why);
  const badKind = denied(setJ(PRO, good("'kind','소풍'")));
  ok("만나는 방법을 엉뚱하게 적으면 막힌다", badKind.no, badKind.why);
  ok("  그 거절이 **사람 말**이다",
     badKind.no && badKind.why.indexOf("invalid input") < 0, badKind.why);

  console.log("\n── 잡히고, 고치면 줄이 쌓이지 않는가");
  const id1 = psql(setJ(PRO, good("'kind','call','place','남서울 3층'")));
  ok("일정 줄이 생긴다", /^[0-9a-f-]{36}$/.test(id1), id1);
  ok("  만나는 방법이 적힌 그대로다",
     psql("select kind from appointment where id='" + id1 + "'") === "call");
  psql(setJ(PRO, good("'kind','visit','place','연습장 1층'")));
  ok("고쳐도 줄이 **하나**다 (한 요청 × 한 업체 = 한 줄)",
     psql("select count(*)::text from appointment where request_id='" + RID + "'") === "1");
  ok("  고친 값이 들어갔다",
     psql("select kind || '|' || place from appointment where request_id='" + RID + "'")
       === "visit|연습장 1층");
  ok("고친 기록이 남는다 (문이 하나라서)",
     Number(psql("select count(*)::text from audit_log where obj='appointment'")) >= 2);
  /* ⚠️ 감사 기록에 가게 주소 · 손님 정보를 넣지 않습니다 */
  ok("⚠️ 감사 기록에 **장소가 안 실린다** (가게 주소입니다)",
     psql("select count(*)::text from audit_log where obj='appointment' " +
          "and coalesce(data::text,'') like '%연습장 1층%'") === "0");

  console.log("\n── 누가 보는가");
  ok("그 업체는 본다",
     psql(as(PRO) + "select count(*)::text from appointment where request_id='" + RID + "'") === "1");
  ok("손님도 본다",
     psql(as(CUS) + "select count(*)::text from appointment where request_id='" + RID + "'") === "1");
  ok("남은 **못 본다**",
     psql(as(OTH) + "select count(*)::text from appointment where request_id='" + RID + "'") === "0");
  ok("다른 업체는 못 본다",
     psql(as(PR2) + "select count(*)::text from appointment where request_id='" + RID + "'") === "0");
  ok("비로그인은 표 자체가 안 열린다 (GRANT)",
     denied(anon + "select count(*) from appointment").no);
  ok("운영자는 본다",
     psql(as(ADM) + "select count(*)::text from appointment where request_id='" + RID + "'") === "1");

  console.log("\n── 표를 직접 고치는 길이 없는가");
  const ins = denied(as(PRO) +
    "insert into appointment (request_id, provider_id, at) values ('" +
    RID + "','ap-a', now())");
  ok("표에 직접 넣는 길이 없다 (문 둘만 엽니다)", ins.no, ins.why);
  const upd = allowed(as(PRO) +
    "update appointment set at = now() where request_id='" + RID + "'");
  /* ⚠️⚠️ RLS · GRANT 는 UPDATE 에서 에러를 안 낼 수도 있습니다 —
     **바뀐 줄 수**가 아니라 값을 봅니다. */
  ok("표를 직접 고치지 못한다", !upd.yes ||
     psql("select (at > now() + interval '20 months')::text from appointment " +
          "where request_id='" + RID + "'") === "true", upd.why);

  console.log("\n── 만났음 · 취소");
  const APID = psql("select id::text from appointment where request_id='" + RID + "'");
  const mv = (u, to, why2) =>
    as(u) + "select move_appointment(jsonb_build_object('id','" + APID +
    "','to','" + to + "'" + (why2 ? ",'why','" + why2 + "'" : "") + "))";
  const doneByCus = denied(mv(CUS, "done"));
  ok("손님은 '만났음' 을 못 적는다", doneByCus.no, doneByCus.why);
  const cancelNoWhy = denied(mv(CUS, "cancel"));
  ok("취소에는 까닭이 필요하다", cancelNoWhy.no, cancelNoWhy.why);
  ok("  그 거절은 **다른 말**이다",
     doneByCus.no && cancelNoWhy.no && doneByCus.why !== cancelNoWhy.why,
     doneByCus.why + " / " + cancelNoWhy.why);
  const othCancel = denied(mv(OTH, "cancel", "남이 취소"));
  ok("남은 취소할 수 없다", othCancel.no, othCancel.why);
  ok("손님은 취소할 수 있다 (못 가게 된 것을 말할 길)",
     allowed(mv(CUS, "cancel", "갑자기 일이 생겼습니다")).yes);
  ok("  지우지 않는다 — 기록은 남습니다",
     psql("select state from appointment where id='" + APID + "'") === "cancel");
  ok("  까닭이 남는다 (업체가 봅니다)",
     psql("select why from appointment where id='" + APID + "'") === "갑자기 일이 생겼습니다");
  const twice = denied(mv(CUS, "cancel", "또"));
  ok("두 번 취소하면 **다른 말로** 거절한다", twice.no, twice.why);
  const badTo = denied(mv(PRO, "set"));
  ok("엉뚱한 상태로는 못 옮긴다", badTo.no, badTo.why);

  console.log("\n── 다시 잡으면 되살아나는가");
  psql(setJ(PRO, good("'kind','online'")));
  ok("다시 잡으면 '잡힘' 으로 돌아온다",
     psql("select state from appointment where id='" + APID + "'") === "set");
  ok("  취소 까닭은 지워진다 (지난 취소가 새 약속에 붙어 있으면 안 됩니다)",
     psql("select coalesce(why,'비었음') from appointment where id='" + APID + "'") === "비었음");
  ok("업체가 '만났음' 을 적는다", allowed(mv(PRO, "done")).yes);

  console.log("\n── 끝난 건에는 안 잡습니다");
  psql("update request set state = 'lost' where id = '" + RID + "'");
  const onLost = denied(setJ(PRO, good()));
  ok("진행 안 함인 건에는 일정을 못 잡는다", onLost.no, onLost.why);
  ok("  그 거절이 **상태 때문**이라고 말한다",
     onLost.no && onLost.why.indexOf("상태") >= 0, onLost.why);
};

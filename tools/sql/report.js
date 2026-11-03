/* ════════════════════════════════════════════════════════════════════
   신고 · 분쟁 · 쏟아붓기 막기를 눌러 봅니다 (0040 · 0041 · §5 · §6 · §8 · §10)

   ⚠️⚠️ **신고함에서 제일 위험한 것은 "남의 신고가 보이는 것"** 입니다.
   누가 누구를 신고했는지 드러나면 그 자체가 분쟁의 씨앗이고, 업체가
   신고한 손님을 찾아갑니다. 그 길을 역할마다 눌러 봅니다.

   ⚠️⚠️ **rate limit 은 경계값이 전부입니다.** 너무 좁게 막으면 레슨 ·
   피팅 · 부킹을 잇따라 넣는 **진짜 손님**이 막힙니다 — 되는 쪽도 같이
   재야 합니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0040 신고 · 분쟁 — 씨앗");
  const CUS = psql("insert into auth.users (email) values ('rp-cus@x.test') returning id");
  const OTH = psql("insert into auth.users (email) values ('rp-oth@x.test') returning id");
  const PRO = psql("insert into auth.users (email) values ('rp-pro@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('rp-adm@x.test') returning id");

  psql("insert into provider (id, name, listed, is_test) values " +
       "('rp-a','[검사용] 신고 업체', true, true) on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + CUS + "','customer','신고 손님', null)," +
       "('" + OTH + "','customer','남', null)," +
       "('" + PRO + "','provider','신고 업체 사람','rp-a')," +
       "('" + ADM + "','admin','신고 관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");
  psql("update provider set assignable = true where id = 'rp-a'");

  const as = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const RID = psql("insert into request (no, side, tel, name, agree_at, state, user_id) " +
    "values ('RP-0001','golf','010-9999-0001','신고손님', now(), 'consult','" +
    CUS + "') returning id::text");
  psql("insert into assignment (request_id, provider_id, agree3rd_at, state) " +
       "values ('" + RID + "','rp-a', now(), 'accepted') on conflict do nothing");

  const open = (u, obj) => as(u) + "select open_report('" +
    JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb)";

  console.log("\n── 열 수 있나");
  const anonOpen = denied(anon + "select open_report('{\"provider\":\"rp-a\"," +
    "\"body\":\"로그인 없이 신고해 봅니다\"}'::jsonb)");
  ok("비로그인은 신고할 수 없다", anonOpen.no, anonOpen.why);
  const noTarget = denied(open(CUS, { body:"무엇을 신고하는지 안 적었습니다" }));
  ok("무엇에 대한 것인지 안 적으면 막힌다", noTarget.no, noTarget.why);
  const shortBody = denied(open(CUS, { provider:"rp-a", body:"짧" }));
  ok("너무 짧으면 막힌다", shortBody.no, shortBody.why);
  ok("  그 거절이 **다섯 글자**라고 말한다",
     shortBody.no && shortBody.why.indexOf("다섯 글자") >= 0, shortBody.why);
  const badKind = denied(open(CUS, { kind:"칭찬", provider:"rp-a", body:"엉뚱한 갈래입니다" }));
  ok("없는 갈래로는 못 연다", badKind.no, badKind.why);

  const R1 = psql(open(CUS, { provider:"rp-a", body:"연락처를 다른 곳에 넘긴 것 같습니다" }));
  ok("손님이 업체를 신고한다", /^[0-9a-f-]{36}$/.test(R1), R1);

  /* ⚠️⚠️ 같은 것을 두 번 — 손이 미끄러지면 운영자가 두 번 읽습니다 */
  const dup = denied(open(CUS, { provider:"rp-a", body:"같은 건을 또 넣어 봅니다" }));
  ok("같은 건을 두 번 열 수 없다", dup.no, dup.why);
  ok("  그 거절이 **이미 보고 있다**고 말한다",
     dup.no && dup.why.indexOf("보고 있습니다") >= 0, dup.why);

  console.log("\n── ⚠️ 분쟁은 **그 거래의 당사자만**");
  const byOth = denied(open(OTH, { kind:"dispute", request:RID,
    body:"남의 거래에 분쟁을 열어 봅니다" }));
  ok("남은 분쟁을 못 연다", byOth.no, byOth.why);
  ok("  그 거절이 **당사자**를 말한다",
     byOth.no && byOth.why.indexOf("당사자") >= 0, byOth.why);
  ok("손님은 제 거래에 분쟁을 연다",
     /^[0-9a-f-]{36}$/.test(psql(open(CUS, { kind:"dispute", request:RID,
       body:"약속한 날에 오지 않으셨습니다" }))));
  ok("배정받은 업체도 분쟁을 연다 (업체도 당사자입니다)",
     /^[0-9a-f-]{36}$/.test(psql(open(PRO, { kind:"dispute", request:RID,
       body:"연락이 닿지 않습니다" }))));
  const noReq = denied(open(CUS, { kind:"dispute", provider:"rp-a",
    body:"요청 없이 분쟁을 열어 봅니다" }));
  ok("분쟁에 요청을 안 적으면 막힌다", noReq.no, noReq.why);

  console.log("\n── ⚠️⚠️ 누가 보는가 (제일 위험한 자리)");
  ok("신고한 사람은 제 신고를 본다",
     psql(as(CUS) + "select count(*)::text from report where id='" + R1 + "'") === "1");
  ok("⚠️ **남의 신고는 못 본다**",
     psql(as(OTH) + "select count(*)::text from report") === "0");
  /* ⚠️⚠️ 업체가 제게 들어온 신고를 보면 신고한 손님을 찾아갑니다 */
  ok("⚠️⚠️ **업체는 제게 들어온 신고를 못 본다**",
     psql(as(PRO) + "select count(*)::text from report where id='" + R1 + "'") === "0");
  ok("  업체가 보는 것은 **제가 연 분쟁뿐**이다",
     psql(as(PRO) + "select count(*)::text from report") === "1");
  ok("운영자는 전부 본다",
     Number(psql(as(ADM) + "select count(*)::text from report")) >= 3);
  ok("비로그인은 표 자체가 안 열린다 (GRANT)",
     denied(anon + "select count(*) from report").no);

  console.log("\n── 표를 직접 고치는 길이 없는가");
  const ins = denied(as(CUS) + "insert into report (kind, provider_id, body) " +
    "values ('abuse','rp-a','표에 직접 넣어 봅니다')");
  ok("표에 직접 넣는 길이 없다 (문 둘만 엽니다)", ins.no, ins.why);
  const upd = allowed(as(CUS) + "update report set state='resolved' where id='" + R1 + "'");
  /* ⚠️⚠️ RLS 는 UPDATE 에서 에러를 안 냅니다 — **값**을 봅니다 */
  ok("표를 직접 고치지 못한다",
     psql("select state from report where id='" + R1 + "'") === "open", upd.why || upd.out);

  console.log("\n── 운영자가 처리합니다");
  const mv = (u, id, to, res) => as(u) + "select move_report(jsonb_build_object('id','" +
    id + "','to','" + to + "'" + (res ? ",'resolution','" + res + "'" : "") + "))";
  const byCus = denied(mv(CUS, R1, "resolved", "제가 닫아 봅니다"));
  ok("신고한 사람이 제 신고를 닫을 수 없다", byCus.no, byCus.why);
  const noRes = denied(mv(ADM, R1, "resolved"));
  ok("어떻게 처리했는지 안 적으면 못 닫는다", noRes.no, noRes.why);
  ok("확인 중으로는 까닭 없이 옮긴다 (아직 안 끝났습니다)",
     allowed(mv(ADM, R1, "reviewing")).yes);
  ok("처리하면서 까닭을 적는다",
     allowed(mv(ADM, R1, "resolved", "업체에 확인했고 사실이 아니었습니다")).yes);
  ok("  끝난 때와 누가가 남는다",
     psql("select (closed_at is not null and closed_by is not null)::text " +
          "from report where id='" + R1 + "'") === "true");
  const after = denied(mv(ADM, R1, "reviewing"));
  ok("이미 끝난 신고는 다시 못 연다", after.no, after.why);
  ok("감사 기록이 남는다",
     Number(psql("select count(*)::text from audit_log where obj='report'")) >= 2);
  /* ⚠️ 감사 기록에 신고 본문을 넣지 않습니다 */
  ok("⚠️ 감사 기록에 **신고 본문이 안 실린다**",
     psql("select count(*)::text from audit_log where obj='report' " +
          "and coalesce(data::text,'') like '%다른 곳에 넘긴%'") === "0");

  console.log("\n── 0041 쏟아붓기 막기 — ⚠️ **문**을 눌러 봅니다");
  /* ⚠️⚠️⚠️ **표에 직접 insert 해서 재면 아무것도 안 재집니다.**
     `request` 에는 insert 정책도 GRANT 도 **없어서** 손님이 들어오는
     길은 `make_request` 하나이고, 자물쇠도 그 안에 있습니다. 처음에
     표에 바로 넣어 재고 "다섯 건까지 들어간다" 를 초록으로 받았는데,
     그건 자물쇠를 **지나지 않은** 것이었습니다.
     ⚠️⚠️ 그렇게 눌러 보고서야 "10분에 다섯" 이 **영원히 안 걸리는
     자물쇠**인 것을 알았습니다 — 0029 가 이미 같은 번호로 10분에 한
     건만 받습니다. 그래서 0041 은 **하루 한도**만 둡니다. */
  const send = (tel) => {
    const d = { name:"쏟기", tel: tel, services:["ls-solo"], cat:"lesson" };
    const j = JSON.stringify(d).replace(/'/g, "''");
    return "set role anon; select make_request(jsonb_set('" + j +
           "'::jsonb, '{agree_at}', to_jsonb(now()))); reset role; ";
  };
  const TEL  = "010-4444-5555";
  const TEL2 = "01044445555";          /* ⚠️ 같은 사람, 다른 꼴 */
  const same = "regexp_replace(tel, '[^0-9]', '', 'g') = '01044445555'";
  /* 10분 자물쇠를 넘기려고 때를 뒤로 밉니다 (하루 안에 머무릅니다) */
  const age = () => psql("update request set created_at = " +
    "created_at - interval '15 minutes' where " + same);

  ok("⚠️ 이 DB 의 `make_request` 가 **0041 판**이다 (아니면 아래가 뜻이 없습니다)",
     psql("select (pg_get_functiondef('make_request(jsonb)'::regprocedure) " +
          "like '%하루에 보내실%')::text") === "true");

  ok("첫 요청은 들어간다", allowed(send(TEL)).yes);
  const again = denied(send(TEL));
  ok("같은 번호로 10분 안에 또 넣으면 막힌다 (0029 가 막습니다)", again.no, again.why);
  /* ⚠️⚠️ 자물쇠마다 **다른 말**로 거절해야 어느 것이 막았는지 압니다 */
  ok("  그 거절은 **하루 한도와 다른 말**이다",
     again.no && again.why.indexOf("방금 같은 번호로") >= 0
              && again.why.indexOf("하루에") < 0, again.why);

  /* ⚠️⚠️ **되는 쪽을 먼저 재야 합니다** — 너무 좁게 막는 것도 고장입니다.
     꼴을 바꿔 가며 넣어 **하이픈을 떼면 한도가 두 배가 되는지**까지 봅니다. */
  age();
  let got = 1;
  for(let i = 2; i <= 20; i++){
    if(allowed(send(i % 2 ? TEL : TEL2)).yes) got++;
    age();
  }
  ok("하루에 **스무 건까지는 들어간다** (진짜 손님이 막히면 안 됩니다)",
     got === 20, got + "건");
  const over = denied(send(TEL));
  ok("스물한 번째는 막힌다", over.no, over.why);
  ok("  ⚠️ 꼴을 바꿔도 **같은 사람으로 센다** (하이픈을 떼도 한도가 안 늘어납니다)",
     over.no && over.why.indexOf("하루에") >= 0, over.why);
  /* ⚠️ 막다른 길로 두지 않습니다 — 무엇을 하라고 말해야 합니다 */
  ok("  그 거절이 **어디로 가라**고 말한다",
     over.no && over.why.indexOf("고객센터") >= 0, over.why);

  /* ⚠️ 한 사람 때문에 모두가 막히면 안 됩니다 */
  const other = allowed(send("010-4444-6666"));
  ok("⚠️ **다른 연락처는 막히지 않는다**", other.yes, other.why);

  /* ⚠️ 영구 차단이 아닙니다 — 하루가 지나면 다시 됩니다 */
  psql("update request set created_at = created_at - interval '25 hours' where " + same);
  ok("하루가 지나면 다시 된다 (영구 차단이 아닙니다)", allowed(send(TEL)).yes);

  /* ⚠️⚠️ **못 막는 것을 막는다고 적지 않습니다.** 번호를 바꿔 가며
     넣는 것은 못 막습니다 (IP 를 받지 않습니다 — 받으면 처리 항목이
     늘어 방침을 같이 고쳐야 합니다). 그 자리는 운영자가 신고로 봅니다. */
  const fresh = allowed(send("010-4444-7777"));
  ok("⚠️ 번호를 바꾸면 **막히지 않는다** (막는 척하지 않습니다 · 신고로 봅니다)",
     fresh.yes, fresh.why);
};

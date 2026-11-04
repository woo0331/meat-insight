/* ════════════════════════════════════════════════════════════════════
   고객센터 문의 접수를 눌러 봅니다 (0045 · 4차 지시서 §11)

   ⚠️⚠️⚠️ **이 문은 로그인 없이 열립니다** — 신고(0040)와 다릅니다.
   그래서 자물쇠가 더 많고, 자물쇠마다 **다른 말**로 거절하는지까지
   봅니다. 같은 말로 거절하면 하나를 빼 봐도 다른 것이 먼저 막아
   **엉뚱한 까닭으로 통과**합니다.

   ⚠️⚠️⚠️ **하루 제한이 "영원히 안 걸리는 자물쇠" 가 아닌지 봅니다.**
   0041 에서 10분 제한이 이미 막고 있어 제가 넣은 하루 제한이 **한 번도
   걸릴 수 없는 코드**였던 적이 있습니다. 여기서는 **10분보다 오래된**
   줄을 깔아 두고 **문으로** 눌러, 아홉 건까지는 들어가고 열째에
   막히는지 — 즉 경계가 실제로 거기 있는지를 봅니다.

   ⚠️ 깔아 두는 줄은 **검사 준비**이고, 재는 것은 늘 **문**입니다
   (표에 바로 넣고 재면 자물쇠를 통째로 지나칩니다).
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0045 고객센터 문의 — 씨앗");
  const CUS = psql("insert into auth.users (email) values ('iq-cus@x.test') returning id");
  const OTH = psql("insert into auth.users (email) values ('iq-oth@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('iq-adm@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + CUS + "','customer','문의 손님')," +
       "('" + OTH + "','customer','남')," +
       "('" + ADM + "','admin','문의 관리자') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const J    = o => JSON.stringify(o).replace(/'/g, "''");
  const NOW  = "select now()";
  const open = (who, obj) =>
    (who ? as(who) : anon) + "select open_inquiry('" + J(obj) + "'::jsonb)";
  const base = extra => Object.assign(
    { kind:"use", body:"이용 중 막히는 곳이 있어 여쭙니다", agree_at:"AGREE" }, extra);
  /* 동의 시각을 **지금**으로 — 문이 미래 · 오래된 것을 거절합니다 */
  const nowIso = psql(NOW);
  const mk = extra => {
    const o = base(extra);
    if(o.agree_at === "AGREE") o.agree_at = nowIso;
    return o;
  };

  console.log("\n── 넣을 수 있나 — ⚠️ 로그인 없이도 됩니다 (신고와 다릅니다)");
  const a1 = allowed(open(null, mk({ tel:"010-5000-0001", name:"손님" })));
  ok("비로그인도 연락처를 적으면 넣을 수 있다", a1.yes && /^IQ-/.test(a1.out), a1.out || a1.why);
  ok("  접수번호를 돌려준다 (화면이 지어내지 않습니다)", /^IQ-\d{6}-[0-9A-F]{4}$/.test(a1.out), a1.out);

  const a2 = allowed(open(CUS, mk({})));
  ok("로그인하셨으면 연락처 없이도 된다 (계정으로 답합니다)", a2.yes, a2.why);

  console.log("\n── 답을 보낼 길이 없으면 받지 않습니다");
  const noReach = denied(open(null, mk({})));
  ok("비로그인 + 연락처 없음은 막힌다", noReach.no, noReach.why);
  ok("  그 거절이 **전화번호나 메일**을 말한다",
     noReach.no && noReach.why.indexOf("메일 주소를 적어") >= 0, noReach.why);

  console.log("\n── 자물쇠마다 다른 말로 거절합니다");
  const says = {};
  const d1 = denied(open(CUS, mk({ body:"짧" })));                 says.short = d1.why;
  ok("너무 짧으면 막힌다", d1.no, d1.why);
  ok("  그 거절이 **다섯 글자**라고 말한다",
     d1.no && d1.why.indexOf("다섯 글자") >= 0, d1.why);
  const d2 = denied(open(CUS, mk({ body:"가".repeat(2001) })));    says.long = d2.why;
  ok("너무 길면 막힌다", d2.no, d2.why);
  const d3 = denied(open(CUS, mk({ kind:"칭찬" })));               says.kind = d3.why;
  ok("없는 갈래로는 못 넣는다", d3.no, d3.why);
  const d4 = denied(open(null, mk({ tel:"010-1" })));              says.tel = d4.why;
  ok("전화번호가 짧으면 막힌다", d4.no, d4.why);
  const d5 = denied(open(null, mk({ email:"@@@" })));              says.mail = d5.why;
  ok("메일 주소가 이상하면 막힌다", d5.no, d5.why);
  /* ⚠️ 말이 겹치면 하나를 빼 봐도 엉뚱한 까닭으로 통과합니다 */
  const uniq = new Set(Object.values(says));
  ok("⚠️ 다섯 자물쇠가 **서로 다른 말**로 거절한다",
     uniq.size === Object.keys(says).length, JSON.stringify(says));

  console.log("\n── 동의 (개인정보보호법 제15조)");
  const noAgree = denied((as(CUS)) + "select open_inquiry('" +
    J({ kind:"use", body:"동의 없이 넣어 봅니다" }) + "'::jsonb)");
  ok("동의 시각이 없으면 막힌다", noAgree.no, noAgree.why);
  const future = denied(open(CUS, { kind:"use", body:"동의 시각이 미래입니다",
    agree_at: psql("select (now() + interval '2 hours')::text") }));
  ok("동의 시각이 미래면 막힌다", future.no, future.why);
  const oldA = denied(open(CUS, { kind:"use", body:"동의가 오래되었습니다",
    agree_at: psql("select (now() - interval '2 days')::text") }));
  ok("동의가 오래됐으면 막힌다", oldA.no, oldA.why);

  console.log("\n── 쏟아붓기 — 10분에 한 건");
  const t2 = denied(open(null, mk({ tel:"010-5000-0001", body:"같은 번호로 또 넣어 봅니다" })));
  ok("같은 번호로 10분 안에 두 번째는 막힌다", t2.no, t2.why);
  const t3 = allowed(open(null, mk({ tel:"010-5000-0002", body:"다른 번호는 들어갑니다" })));
  ok("⚠️ 다른 번호는 **그대로 들어간다** (너무 넓게 막지 않습니다)", t3.yes, t3.why);

  console.log("\n── 쏟아붓기 — 하루 열 건 ⚠️ 영원히 안 걸리는 자물쇠가 아닌지");
  /* 깔아 두는 줄은 **10분보다 오래된** 것입니다 — 그래야 10분 자물쇠가
     먼저 막지 않고 하루 자물쇠를 실제로 눌러 볼 수 있습니다. */
  const seed = n => {
    psql("delete from inquiry where tel = '010-5000-0009'");
    for(let i = 0; i < n; i++)
      psql("insert into inquiry (no, kind, body, tel, agree_at, created_at) values " +
           "('IQ-SEED-" + String(i).padStart(4,'0') + "','use','깔아 두는 줄입니다'," +
           "'010-5000-0009', now(), now() - interval '1 hour')");
  };
  seed(9);
  const nine = allowed(open(null, mk({ tel:"010-5000-0009", body:"아홉 건 뒤에는 들어갑니다" })));
  ok("⚠️⚠️ 아홉 건까지는 **들어간다** (자물쇠가 더 좁게 잡히지 않았다)",
     nine.yes, nine.why);
  psql("delete from inquiry where tel = '010-5000-0009' and no not like 'IQ-SEED-%'");
  seed(10);
  const ten = denied(open(null, mk({ tel:"010-5000-0009", body:"열 건이 넘으면 막힙니다" })));
  ok("⚠️⚠️ 열 건이 넘으면 **막힌다** (경계가 실제로 거기 있다)", ten.no, ten.why);
  ok("  그 거절이 **하루**를 말한다 (10분 거절과 다른 말이다)",
     ten.no && ten.why.indexOf("하루") >= 0, ten.why);
  psql("delete from inquiry where tel = '010-5000-0009'");

  console.log("\n── 표에 바로 넣는 길은 없습니다 (문 하나뿐)");
  const direct = denied(as(CUS) +
    "insert into inquiry (no, kind, body, tel, agree_at) values " +
    "('IQ-DIRECT','use','문을 지나지 않고 넣어 봅니다','010-5000-0003', now())");
  ok("⚠️ 로그인해도 표에 바로 못 넣는다 (GRANT 가 없습니다)", direct.no, direct.why);
  const directAnon = denied(anon +
    "insert into inquiry (no, kind, body, tel, agree_at) values " +
    "('IQ-DIRECT2','use','비로그인으로 넣어 봅니다','010-5000-0004', now())");
  ok("  비로그인도 못 넣는다", directAnon.no, directAnon.why);

  console.log("\n── 누가 읽는가 — ⚠️ 남의 문의가 보이면 그 자체가 유출입니다");
  const mine = psql(as(CUS) + "select count(*)::int from inquiry");
  ok("제가 넣은 것은 보인다", Number(mine) >= 1, mine);
  const other = psql(as(OTH) + "select count(*)::int from inquiry");
  ok("⚠️ 남의 문의는 **한 줄도 안 보인다**", Number(other) === 0, other);
  /* ⚠️⚠️ **GRANT 와 RLS 는 따로 거는 자물쇠입니다.** anon 에게는 select
     GRANT 를 한 줄도 주지 않았으므로 **빈 결과가 아니라 거절**이 옵니다.
     처음에 빈 결과를 기다렸다가 검사가 터졌습니다 — 코드가 아니라
     **검사가 틀린** 자리였습니다 (작업 기억의 pull-providers 자리와 같습니다). */
  const anonRead = denied(anon + "select count(*)::int from inquiry");
  ok("비로그인은 표를 **아예 못 엽니다** (GRANT 가 없습니다)", anonRead.no, anonRead.why);
  const adm = psql(as(ADM) + "select count(*)::int from inquiry");
  ok("운영자는 전부 본다", Number(adm) >= 3, adm);
  /* ⚠️⚠️ 비로그인으로 들어온 문의는 **아무 회원도** 못 읽습니다 */
  const anonRow = psql(as(CUS) +
    "select count(*)::int from inquiry where by_user is null");
  ok("⚠️ 비로그인으로 들어온 문의는 회원도 못 읽는다 (운영자만)",
     Number(anonRow) === 0, anonRow);

  console.log("\n── 옮기기 — 운영자만, 답했다고 두려면 답이 있어야");
  const IQ = psql(as(ADM) + "select id::text from inquiry where by_user = '" + CUS + "' limit 1");
  const byCus = denied(as(CUS) + "select move_inquiry('" + J({ id:IQ, to:"reviewing" }) + "'::jsonb)");
  ok("손님은 못 옮긴다", byCus.no, byCus.why);
  const badTo = denied(as(ADM) + "select move_inquiry('" + J({ id:IQ, to:"지움" }) + "'::jsonb)");
  ok("없는 상태로는 못 옮긴다", badTo.no, badTo.why);
  const noAns = denied(as(ADM) + "select move_inquiry('" + J({ id:IQ, to:"answered" }) + "'::jsonb)");
  ok("⚠️⚠️ 답 없이 **답변함**으로 못 옮긴다", noAns.no, noAns.why);
  const mv1 = allowed(as(ADM) + "select move_inquiry('" + J({ id:IQ, to:"reviewing" }) + "'::jsonb)");
  ok("운영자는 확인 중으로 옮긴다", mv1.yes, mv1.why);
  const same = denied(as(ADM) + "select move_inquiry('" + J({ id:IQ, to:"reviewing" }) + "'::jsonb)");
  ok("같은 상태로 또 옮기지 않는다", same.no, same.why);
  const mv2 = allowed(as(ADM) + "select move_inquiry('" +
    J({ id:IQ, to:"answered", answer:"이렇게 하시면 됩니다" }) + "'::jsonb)");
  ok("답을 같이 적으면 답변함으로 옮긴다", mv2.yes, mv2.why);
  const stamp = psql("select state || '|' || (answered_at is not null)::text || '|' || " +
                     "(answered_by is not null)::text from inquiry where id = '" + IQ + "'");
  /* ⚠️ `::text` 는 참 · 거짓을 **true · false** 로 찍습니다 (t · f 가
     아닙니다). 처음에 "t" 를 기다렸다가 멀쩡한 코드를 실패로 잡았습니다. */
  ok("  답한 시각과 답한 사람이 남는다", stamp === "answered|true|true", stamp);
  const mv3 = allowed(as(ADM) + "select move_inquiry('" + J({ id:IQ, to:"closed" }) + "'::jsonb)");
  ok("닫을 수 있다", mv3.yes, mv3.why);
  const reopen = denied(as(ADM) + "select move_inquiry('" + J({ id:IQ, to:"reviewing" }) + "'::jsonb)");
  ok("⚠️ 닫힌 문의는 다시 못 옮긴다", reopen.no, reopen.why);

  console.log("\n── 감사 기록 — ⚠️ 성함 · 연락처 · 내용이 들어가지 않습니다");
  const leak = psql("select count(*)::int from audit_log where obj = 'inquiry' and " +
    "(data::text like '%010-5000%' or data::text like '%문의 손님%' " +
    " or data::text like '%막히는 곳%')");
  ok("⚠️⚠️ 감사 기록에 연락처 · 성함 · 글이 한 글자도 없다", Number(leak) === 0, leak);
  ok("  그래도 접수번호로 찾아갈 수 있다",
     Number(psql("select count(*)::int from audit_log where obj='inquiry' and obj_id like 'IQ-%'")) >= 1);

  console.log("\n── 0045 입점 신청의 **사업장 주소** (§9)");
  const ap = allowed(anon + "select make_apply('" + J({
    company:"[검사용] 주소 업체", name:"담당자", tel:"010-7000-0001",
    region:"서울", addr:"서울특별시 강남구 테헤란로 1",
    services:["개인 레슨"], agree_at: nowIso }) + "'::jsonb)");
  /* ⚠️⚠️ 신청번호 꼴을 **여기 박지 않습니다** — 0027 이 정한 것이고
     tools/sql/apply.js 가 이미 그 꼴을 봅니다. 여기서 재려는 뜻은
     "주소를 적어도 신청이 된다" 입니다. 번호 꼴을 두 곳에 적어 두면
     한쪽만 고쳐서 어긋납니다 (제가 0045 에서 실제로 그랬습니다). */
  ok("주소를 적어 신청할 수 있다",
     ap.yes && /^GA\d{6}-\d{4}$/.test(ap.out), ap.out || ap.why);
  ok("⚠️ 적은 주소가 **그대로 저장된다** (받고 버리지 않습니다)",
     psql("select addr from provider_apply where no = '" + ap.out + "'") ===
       "서울특별시 강남구 테헤란로 1");
  const longAddr = denied(anon + "select make_apply('" + J({
    company:"[검사용] 긴 주소", name:"담당자", tel:"010-7000-0002",
    addr:"가".repeat(201), services:["개인 레슨"], agree_at: nowIso }) + "'::jsonb)");
  ok("너무 긴 주소는 막힌다", longAddr.no, longAddr.why);
  const noAddr = allowed(anon + "select make_apply('" + J({
    company:"[검사용] 주소 없음", name:"담당자", tel:"010-7000-0003",
    services:["개인 레슨"], agree_at: nowIso }) + "'::jsonb)");
  ok("⚠️ 주소를 안 적어도 신청은 된다 (있는 칸을 필수로 만들지 않습니다)",
     noAddr.yes, noAddr.why);
};

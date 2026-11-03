/* ════════════════════════════════════════════════════════════════════
   견적을 **끝까지 눌러 봅니다** — 요청 → 배정 → 수락 → 상담 → 견적 → 고르기

   ⚠️⚠️ **이 검사가 있는 까닭.** 견적 문 셋(0008)은 2026-10 에 써 둔
   뒤로 **한 번도 돌아간 적이 없습니다.** 업체가 0곳이라 배정이 없고,
   배정이 없으면 `submit_quote` 는 첫 줄에서 거절합니다 — 즉 그 함수의
   본문 130줄은 **아무도 지나간 적이 없는 코드**였습니다. 거기서
   `quoted` 로 넘기는 `move_state` 호출 한 줄이 틀려 있어도 아무도
   몰랐을 것입니다.

   ⚠️⚠️ **자물쇠가 겹치면 검사를 속입니다.** 하나를 빼 봐도 다른 것이
   먼저 막아서 **엉뚱한 까닭으로 통과**합니다 — 그래서 거절하는
   **말까지** 맞춰 봅니다 (문마다 다른 말로 거절하게 두었습니다).

   ⚠️ 0030 의 검사용 표시 · 0031 의 상호 보기도 여기서 같이 잽니다 —
   둘 다 이 흐름 안에서만 뜻이 있습니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  /* ── 씨앗 ─────────────────────────────────────────────────────────
     ⚠️⚠️ **do nothing 으로 씨앗을 넣으면 안 됩니다.** 0005 의 트리거가
     auth.users 에 사람이 생길 때 account 줄을 먼저 만들어 둡니다 —
     충돌하고, do nothing 이면 역할이 customer 로 남습니다. "관리자인데
     거절됐다" 로 보이지만 코드는 멀쩡합니다 (실제로 겪은 자리). */
  const ADM = psql("insert into auth.users (email) values ('q-adm@x.test') returning id");
  const PRO = psql("insert into auth.users (email) values ('q-pro@x.test') returning id");
  const PR2 = psql("insert into auth.users (email) values ('q-pro2@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('q-cus@x.test') returning id");
  const OTH = psql("insert into auth.users (email) values ('q-oth@x.test') returning id");

  psql("insert into provider (id, name, listed, is_test) values " +
       "('q-a','[검사용] 가 업체', true, true)," +
       "('q-b','[검사용] 나 업체', true, true)," +
       "('q-real','참 업체', true, false) " +
       "on conflict (id) do update set name = excluded.name, " +
       "listed = excluded.listed, is_test = excluded.is_test");

  psql("insert into account (id, role, name, provider_id) values " +
       "('" + ADM + "','admin','관리자', null)," +
       "('" + PRO + "','provider','가 업체 사람','q-a')," +
       "('" + PR2 + "','provider','나 업체 사람','q-b')," +
       "('" + CUS + "','customer','손님', null)," +
       "('" + OTH + "','customer','남', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");

  ok("씨앗: 관리자가 실제로 admin 이다",
     psql("select role::text from account where id='" + ADM + "'") === "admin");
  ok("씨앗: 업체 사람이 실제로 provider 이고 업체가 이어져 있다",
     psql("select role::text || ' ' || provider_id from account where id='" + PRO + "'")
       === "provider q-a");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";

  /* ── 0030 검사용 표시 ─────────────────────────────────────────── */
  console.log("\n── 0030 · 0032 검사용 업체가 손님 쪽으로 새지 않는가 (2차 지시서 §8)");
  /* ⚠️⚠️ **GRANT 와 RLS 를 따로 눌러 봅니다.** 자물쇠가 겹쳐 있어서
     정책만 보고 "공개 목록은 읽힌다" 고 읽었다가, GRANT 가 먼저 막는
     것을 여기서 알았습니다 — `tools/pull-providers.js` 가 그 때문에
     한 번도 돌 수 없었습니다 (0032 머리말). */
  const anonTable = denied(anon + "select count(*) from provider");
  ok("비로그인(anon)에게는 provider **표** 자체가 안 열린다 (GRANT 가 먼저 막습니다)",
     anonTable.no, anonTable.why);
  ok("  그 거절이 **권한** 때문이라고 말한다 (정책이 아니라 GRANT 입니다)",
     anonTable.no && anonTable.why.indexOf("permission denied") >= 0, anonTable.why);
  /* ⚠️⚠️ **갯수를 박지 않습니다.** 앞 묶음(money.js)이 자기 업체를 넣어
     두어서, "전부 몇 곳" 으로 재면 그 묶음이 자랄 때마다 엉뚱하게
     떨어집니다 — 우리가 넣은 셋만 봅니다 (작업 기억의 "데이터가 늘면
     엉뚱하게 떨어집니다"). */
  ok("비로그인은 **공개 보기**로 읽는다 — 우리 셋 중 참 업체만 들어온다",
     psql(anon + "select coalesce(string_agg(id, ' ' order by id),'없음') " +
          "from v_provider_card where id like 'q-%'") === "q-real");
  ok("  공개 보기에 `is_test` 가 담겨 있고 전부 false 다 (도구가 다시 봅니다)",
     psql(anon + "select count(*)::text from v_provider_card where is_test") === "0");
  ok("  공개 보기에 **연락 · 운영 칸이 없다** (assignable · listed 는 손님 화면에 쓸 일이 없습니다)",
     denied(anon + "select assignable from v_provider_card").no);
  ok("운영자에게는 검사용도 보인다 (아니면 배정 화면에서 고를 수 없습니다)",
     psql(as(ADM) + "select count(*)::text from provider where is_test") === "2");
  ok("그 업체 자신에게는 자기 줄이 보인다",
     psql(as(PRO) + "select id from provider where id='q-a'") === "q-a");
  ok("검사용 업체는 **공개 목록을 켜도** 공개 보기에 안 나간다 (listed 와 다른 칸)",
     psql(anon + "select count(*)::text from v_provider_card where id='q-a'") === "0");
  ok("로그인한 일반 회원에게도 검사용 업체가 안 보인다 (RLS 의 provider_public)",
     psql(as(OTH) + "select count(*)::text from provider where is_test") === "0");

  /* ⚠️⚠️ 광고 보기는 RLS 를 지나지 않습니다 — 0030 의 정책이 그 길은
     못 막아서 검사용 업체의 상호가 광고로 나갈 참이었습니다 (0032 ②). */
  psql("insert into ad_run (provider_id, place, starts_on, ends_on, price, state) " +
       "values ('q-a','main_hero', current_date, current_date, 0, 'live') " +
       "on conflict do nothing");
  ok("광고 보기(v_ad_live)에도 검사용 업체의 상호가 안 나간다",
     psql(anon + "select count(*)::text from v_ad_live where provider_id='q-a'") === "0");
  ok("  광고가 광고라고 적히는 칸은 그대로다 (표시광고법 제3조)",
     psql(as(ADM) + "select count(*)::text from v_ad_live where label <> '광고'") === "0");

  /* ⚠️⚠️ **기대값을 코드와 같은 식으로 적지 않습니다** — 식을 바꿔도
     답이 같아서 아무것도 안 잡습니다. 여기서는 세는 쪽(함수)과 **다른
     식**(표를 직접 세기)으로 재서 견줍니다. */
  const cnt  = psql(as(ADM) + "select provider_counts()::text");
  const real = psql("select count(*)::text from provider where not is_test");
  const test = psql("select count(*)::text from provider where is_test");
  ok("provider_counts() 가 참 업체와 검사용을 **갈라서** 셉니다",
     cnt.indexOf('"real": ' + real) >= 0 && cnt.indexOf('"test": ' + test) >= 0,
     cnt + " · 표에서 센 것 real=" + real + " test=" + test);
  ok("  그 둘을 합치면 표 전체와 같다 (한쪽을 빼먹지 않았다)",
     Number(real) + Number(test) ===
       Number(psql("select count(*)::text from provider")),
     real + "+" + test);
  ok("  검사용이 **0 이 아니다** (0 이면 이 묶음이 아무것도 안 재고 있습니다)",
     Number(test) > 0, test);
  const noCnt = denied(as(CUS) + "select provider_counts()");
  ok("업체 수는 운영자만 셉니다", noCnt.no, noCnt.why);
  ok("  그 거절이 **업체 수 때문**이라고 말한다",
     noCnt.no && noCnt.why.indexOf("업체 수") >= 0, noCnt.why);

  /* ── 자물쇠 둘을 **따로** 눌러 봅니다 ───────────────────────────
     ⚠️⚠️ 하나를 빼 봐도 다른 것이 먼저 막아서 **엉뚱한 까닭으로
     통과**합니다. 업체가 `is_test` 를 끄는 길에는 자물쇠가 둘입니다 —
       ① GRANT   0001 의 칸 단위 update 권한에 `is_test` 가 없습니다
       ② 트리거  provider_guard() 가 그 칸의 변화를 거절합니다 (0030)
     ①만 보고 끝내면 0030 의 트리거가 **장식**인지 알 수 없습니다. */
  const flip = denied(as(PRO) + "update provider set is_test = false where id='q-a'");
  ok("업체가 스스로 검사용 표시를 끌 수 없다 — ① GRANT 가 먼저 막는다",
     flip.no, flip.why);
  ok("  그 거절이 **권한** 때문이다 (칸 단위 GRANT 에 is_test 가 없습니다)",
     flip.no && flip.why.indexOf("permission denied") >= 0, flip.why);

  /* ⚠️ ①을 **잠깐 열어** ②가 막는지 보고 **다시 닫습니다.** */
  psql("grant update (is_test) on provider to authenticated");
  const flip2 = denied(as(PRO) + "update provider set is_test = false where id='q-a'");
  psql("revoke update (is_test) on provider from authenticated");
  ok("  ② 권한을 열어도 트리거가 막는다 (0030 의 자물쇠가 장식이 아니다)",
     flip2.no, flip2.why);
  ok("  그 거절은 **검사용 표시 때문**이라고 말한다 (공개 여부와 다른 말)",
     flip2.no && flip2.why.indexOf("검사용 표시") >= 0, flip2.why);
  /* ⚠️⚠️ **값을 다시 봅니다.** 트리거가 아니라 RLS 가 막는 꼴이었다면
     에러 없이 0줄이 바뀌고 성공으로 돌아옵니다. */
  ok("  실제로 값이 안 바뀌었다",
     psql("select is_test::text from provider where id='q-a'") === "true");
  ok("  권한을 다시 닫았다 (열어 둔 채로 끝나지 않는다)",
     denied(as(PRO) + "update provider set is_test = false where id='q-a'").no);

  /* ⚠️ 배정은 `assignable` 이 켜진 업체에만 됩니다 (0012 · 0018).
     사장님은 /admin 에서 켜시고, 여기서는 임자 권한으로 켭니다 —
     ⚠️⚠️ 계정이 이어져 있어야 켜집니다 (0018 의 provider_link_check).
     씨앗이 그 짝을 맞춰 두었는지 **여기서** 드러납니다. */
  const turnOn = allowed("update provider set assignable = true " +
                         "where id in ('q-a','q-b')");
  ok("씨앗: 계정이 이어져 있어 배정 가능으로 켤 수 있다", turnOn.yes, turnOn.why);
  const noLink = denied("update provider set assignable = true where id='q-real'");
  ok("계정이 안 이어진 업체는 배정 가능으로 **못 켠다** (0018 의 자물쇠)",
     noLink.no, noLink.why);

  /* ── 요청 넣기 (0029 의 문) ───────────────────────────────────── */
  console.log("\n── 요청이 들어가고, 제3자 제공 동의는 **비어 있는가** (제17조)");
  const no = psql(as(CUS) +
    "select make_request('{\"name\":\"손님\",\"tel\":\"010-5555-6666\"," +
    "\"services\":[\"ls-solo\"],\"cat\":\"lesson\",\"region\":\"서울\"," +
    "\"agree_at\":\"now\",\"idem\":\"q-1\"}'::jsonb || " +
    "jsonb_build_object('agree_at', now()))");
  ok("요청번호가 SW- 꼴로 나온다", /^SW-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(no), no);
  const RID = psql("select id::text from request where no='" + no + "'");
  ok("접수 단계에서는 agree3rd_at 이 **비어 있다** (아직 업체를 모릅니다)",
     psql("select coalesce(agree3rd_at::text,'비었음') from request where id='" + RID + "'")
       === "비었음");

  /* ── 배정 (0004 의 문) ────────────────────────────────────────── */
  console.log("\n── 배정 — 동의 없이는 못 넘긴다");
  const mv = (u, to, ctx) =>
    as(u) + "select move_state('" + RID + "','" + to + "'::deal_state,'" +
    (ctx || "{}").replace(/'/g, "''") + "'::jsonb)";

  ok("손님이 스스로 확인 중으로 못 넘긴다", denied(mv(CUS, "check")).no);
  ok("운영자가 확인 중으로 넘긴다", allowed(mv(ADM, "check")).yes);

  const noAgree = denied(mv(ADM, "assigned", '{"providerId":"q-a"}'));
  ok("동의 칸이 아예 없으면 막힌다", noAgree.no, noAgree.why);
  const falseAgree = denied(mv(ADM, "assigned",
    '{"providerId":"q-a","agree3rd":false}'));
  ok("동의를 false 로 적어도 막힌다", falseAgree.no, falseAgree.why);
  ok("  그 거절이 **연락처 전달 동의 때문**이라고 말한다",
     falseAgree.no && falseAgree.why.indexOf("동의") >= 0, falseAgree.why);
  const ghost = denied(mv(ADM, "assigned",
    '{"providerId":"q-없는곳","agree3rd":true}'));
  ok("없는 업체로는 못 넘긴다", ghost.no, ghost.why);
  ok("  그 거절은 **다른 말**이다 (어느 자물쇠인지 알아야 합니다)",
     ghost.no && ghost.why.indexOf("동의") < 0, ghost.why);

  const asg = allowed(mv(ADM, "assigned", '{"providerId":"q-a","agree3rd":true}'));
  ok("동의를 받고 넘기면 들어간다 (정상 길이 막히지 않았다)", asg.yes, asg.why);
  ok("넘긴 순간 agree3rd_at 이 **채워진다** (시각으로 남깁니다)",
     psql("select (agree3rd_at is not null)::text from request where id='" + RID + "'")
       === "true");
  ok("배정 줄에도 동의 시각이 남는다",
     psql("select (agree3rd_at is not null)::text from assignment " +
          "where request_id='" + RID + "' and provider_id='q-a'") === "true");
  /* ⚠️ 감사 기록에 성함 · 연락처를 넣지 않습니다 */
  ok("감사 기록에 손님 성함 · 연락처가 안 들어갔다",
     psql("select count(*)::text from audit_log " +
          "where data::text like '%010-5555-6666%' or why like '%010-5555-6666%'") === "0");

  /* ── 업체가 읽는 것 ──────────────────────────────────────────── */
  console.log("\n── 배정받은 업체만 그 요청을 본다");
  ok("배정받은 업체는 요청을 본다",
     psql(as(PRO) + "select no from request where id='" + RID + "'") === no);
  ok("배정 안 받은 업체는 **한 줄도** 못 본다",
     psql(as(PR2) + "select count(*)::text from request where id='" + RID + "'") === "0");
  ok("남의 손님은 못 본다",
     psql(as(OTH) + "select count(*)::text from request where id='" + RID + "'") === "0");
  /* ⚠️ anon 에게는 `request` 표가 **아예 안 열립니다** (0001 의 GRANT) —
     "0줄 보인다" 가 아니라 "권한이 없다" 입니다. 둘을 같은 말로 재면
     GRANT 를 지우는 날 검사가 그대로 통과합니다. */
  const anonReq = denied(anon + "select count(*) from request where id='" + RID + "'");
  ok("비로그인에게는 request 표 자체가 안 열린다 (GRANT)", anonReq.no, anonReq.why);

  /* ── 견적 (0008 의 문) ───────────────────────────────────────── */
  console.log("\n── 견적 — 수락 전에는 못 낸다");
  const sub = (u, data, why2) =>
    as(u) + "select submit_quote('" + RID + "','" +
    data.replace(/'/g, "''") + "'::jsonb" +
    (why2 ? ",'" + why2 + "'" : "") + ")";
  const GOOD = '{"amount":600000,"scope":"주 1회 90분 8회 · 영상 분석 포함"}';

  const before = denied(sub(PRO, GOOD));
  ok("배정을 수락하기 전에는 못 낸다", before.no, before.why);
  ok("  그 거절이 **수락을 먼저**라고 말한다",
     before.no && before.why.indexOf("수락") >= 0, before.why);

  ok("업체가 수락한다",
     allowed(as(PRO) + "select answer_assignment('" + RID + "', true)").yes);
  ok("  수락하면 요청 상태가 accepted 가 된다",
     psql("select state::text from request where id='" + RID + "'") === "accepted");

  const atAccepted = denied(sub(PRO, GOOD));
  ok("수락만 하고 상담 전이면 못 낸다", atAccepted.no, atAccepted.why);
  ok("  그 거절은 **상담을 먼저**라고 말한다 (수락 얘기와 다른 말)",
     atAccepted.no && atAccepted.why.indexOf("상담") >= 0, atAccepted.why);

  ok("업체가 상담을 시작한다",
     allowed(as(PRO) +
       "select move_state('" + RID + "','consult'::deal_state,'{}'::jsonb)").yes);

  console.log("\n── 견적 — 무엇이 빠지면 거절하는가 (경계값)");
  const noAmt = denied(sub(PRO, '{"scope":"무엇을 하는가"}'));
  ok("금액을 안 적으면 막힌다 (0원을 몰래 넣지 않습니다)", noAmt.no, noAmt.why);
  const nulAmt = denied(sub(PRO, '{"amount":null,"scope":"무엇을 하는가"}'));
  ok("금액을 null 로 적어도 막힌다", nulAmt.no, nulAmt.why);
  const negAmt = denied(sub(PRO, '{"amount":-1,"scope":"무엇을 하는가"}'));
  ok("금액 -1 원은 막힌다", negAmt.no, negAmt.why);
  /* ⚠️⚠️ **경계값 바로 위 · 아래.** 0 은 값입니다 (무상 · 서비스). */
  const zero = allowed(sub(PRO, '{"amount":0,"scope":"첫 상담은 무료입니다"}'));
  ok("금액 0 원은 **된다** (무상 · 서비스 — 너무 넓게 막는 것도 고장입니다)",
     zero.yes, zero.why);
  const noScope = denied(sub(PRO, '{"amount":100000}'));
  ok("범위를 안 적으면 막힌다 (금액만 적힌 종이가 됩니다)", noScope.no, noScope.why);
  const badVat = denied(sub(PRO, '{"amount":1,"scope":"ㄱ","vat":"x"}'));
  ok("부가세 처리를 엉뚱하게 적으면 막힌다", badVat.no, badVat.why);
  ok("  그 거절이 **사람 말**이다 (enum 에러를 손님에게 그대로 보내지 않습니다)",
     badVat.no && badVat.why.indexOf("invalid input value") < 0, badVat.why);
  const badDay = denied(sub(PRO, '{"amount":1,"scope":"ㄱ","days":0}'));
  ok("예상 소요일 0 일은 막힌다 (하루 이상)", badDay.no, badDay.why);
  const badDate = denied(sub(PRO, '{"amount":1,"scope":"ㄱ","startOn":"엊그제"}'));
  ok("날짜를 글자로 적으면 **사람 말로** 거절한다", badDate.no, badDate.why);

  console.log("\n── 견적이 실제로 들어가고 상태가 같이 움직이는가");
  const qid = psql(sub(PRO, GOOD, '처음 제출'));
  ok("견적 줄이 생긴다", /^[0-9a-f-]{36}$/.test(qid), qid);
  ok("요청 상태가 **quoted 로 같이 넘어간다** (문 하나가 둘을 같이 합니다)",
     psql("select state::text from request where id='" + RID + "'") === "quoted");
  ok("금액 · 범위가 적힌 그대로다",
     psql("select amount::text || '|' || scope from quote where id='" + qid + "'")
       === "600000|주 1회 90분 8회 · 영상 분석 포함");
  ok("부가세는 안 적으면 **별도**다 (0001 의 fee_vat 기본값)",
     psql("select vat::text from quote where id='" + qid + "'") === "add");
  ok("상태 변경이 감사 기록에 남는다",
     Number(psql("select count(*)::text from audit_log where obj='quote' " +
                 "and obj_id='" + qid + "'")) >= 1);
  /* ⚠️ 금액을 감사 기록에 싣지 않습니다 — quote 한 곳에만 둡니다 */
  ok("감사 기록에 **금액이 안 실린다** (두 곳에 두면 어느 쪽이 맞는지 모릅니다)",
     psql("select count(*)::text from audit_log where obj='quote' " +
          "and coalesce(data::text,'') like '%600000%'") === "0");

  console.log("\n── 고쳐도 줄이 쌓이지 않는가 (한 신청 × 한 업체 = 한 줄)");
  psql(sub(PRO, '{"amount":550000,"scope":"주 1회 90분 8회","days":60}', '할인'));
  ok("줄이 하나로 남는다 (같은 업체가 금액만 다르게 둘 보이지 않습니다)",
     psql("select count(*)::text from quote where request_id='" + RID + "'") === "1");
  ok("고친 값이 들어갔다",
     psql("select amount::text from quote where request_id='" + RID + "'") === "550000");
  ok("고친 기록이 따로 남는다 (문이 하나라서)",
     Number(psql("select count(*)::text from audit_log where obj='quote' " +
                 "and obj_id='" + qid + "'")) >= 2);

  console.log("\n── 남의 견적을 건드릴 수 있는가");
  const other = denied(as(PR2) + "select submit_quote('" + RID + "','" + GOOD + "'::jsonb)");
  ok("배정 안 받은 업체는 견적을 못 낸다", other.no, other.why);
  const byAdm = denied(as(ADM) + "select submit_quote('" + RID + "','" + GOOD + "'::jsonb)");
  ok("운영자가 **대신 적어 줄 수 없다** (누가 적었는지가 사라집니다)",
     byAdm.no, byAdm.why);
  const byCus = denied(as(CUS) + "select submit_quote('" + RID + "','" + GOOD + "'::jsonb)");
  ok("손님은 자기 견적을 못 적는다", byCus.no, byCus.why);

  console.log("\n── 손님이 보는 것 (0008 의 정책 · 0031 의 상호)");
  ok("손님에게 자기 요청의 견적이 보인다",
     psql(as(CUS) + "select count(*)::text from quote where request_id='" + RID + "'") === "1");
  ok("남에게는 **안 보인다**",
     psql(as(OTH) + "select count(*)::text from quote where request_id='" + RID + "'") === "0");
  ok("비로그인에게는 quote 표 자체가 안 열린다 (GRANT)",
     denied(anon + "select count(*) from quote where request_id='" + RID + "'").no);
  /* ⚠️⚠️ 0031 — 이것이 없으면 금액만 있고 **누가 냈는지 없는 견적**이
     됩니다. 에러가 안 나서 listed 인 업체로만 눌러 보면 영원히 안
     보이는 고장입니다. */
  ok("손님이 **배정받은 업체의 상호**를 읽는다 (0031)",
     psql(as(CUS) + "select name from provider where id='q-a'") === "[검사용] 가 업체");
  ok("배정된 적 없는 업체는 손님에게 전과 같이 **안 보인다**",
     psql(as(CUS) + "select count(*)::text from provider where id='q-b'") === "0");
  ok("남의 손님에게는 그 업체도 안 보인다",
     psql(as(OTH) + "select count(*)::text from provider where id='q-a'") === "0");

  console.log("\n── 거둔 견적은 손님에게 안 보인다 (하지 않은 약속)");
  ok("업체가 거둔다",
     allowed(as(PRO) + "select withdraw_quote('" + RID + "','사정이 생겼습니다')").yes);
  ok("  지우지 않는다 — 기록은 남습니다",
     psql("select state from quote where request_id='" + RID + "'") === "withdrawn");
  ok("  손님에게는 안 보인다",
     psql(as(CUS) + "select count(*)::text from quote where request_id='" + RID + "'") === "0");
  ok("  업체 자신에게는 보인다 (무엇을 거뒀는지 알아야 합니다)",
     psql(as(PRO) + "select count(*)::text from quote where request_id='" + RID + "'") === "1");
  const twice = denied(as(PRO) + "select withdraw_quote('" + RID + "')");
  ok("  두 번 거두면 **다른 말로** 거절한다", twice.no, twice.why);
  ok("다시 내면 되살아난다 (그게 '다시 냈다' 입니다)",
     allowed(sub(PRO, GOOD, '다시 냅니다')).yes &&
     psql("select state from quote where request_id='" + RID + "'") === "open");

  console.log("\n── 손님이 고른다 (0008 ④)");
  /* 둘째 업체도 배정해서 **견줄 것이 둘** 있게 만듭니다 */
  /* ⚠️ `quoted → nego` 는 **업체와 손님만** 갈 수 있는 길입니다
     (0004 의 deal_move). 관리자로 부르면 "이 변경은 admin(으)로는 할 수
     없습니다" 로 거절합니다 — 길 표가 참이고 여기가 그것을 따릅니다. */
  const admNego = denied(as(ADM) +
    "select move_state('" + RID + "','nego'::deal_state,'{}'::jsonb)");
  ok("quoted → nego 는 관리자가 갈 수 없는 길이다 (길 표가 참입니다)",
     admNego.no, admNego.why);
  ok("손님은 그 길로 갈 수 있다",
     allowed(as(CUS) +
       "select move_state('" + RID + "','nego'::deal_state,'{}'::jsonb)").yes);
  psql("insert into assignment (request_id, provider_id, agree3rd_at, state) values " +
       "('" + RID + "','q-b', now(), 'accepted') on conflict do nothing");
  psql(as(PR2) + "select submit_quote('" + RID + "'," +
       "'{\"amount\":700000,\"scope\":\"주 2회 60분 8회\"}'::jsonb)");
  ok("견적이 둘이 된다",
     psql("select count(*)::text from quote where request_id='" + RID + "'") === "2");

  const pickOth = denied(as(OTH) + "select choose_quote('" + RID + "','q-a')");
  ok("남이 고를 수 없다", pickOth.no, pickOth.why);
  const pickGhost = denied(as(CUS) + "select choose_quote('" + RID + "','q-없는곳')");
  ok("없는 업체의 견적은 고를 수 없다", pickGhost.no, pickGhost.why);
  ok("손님이 고른다",
     allowed(as(CUS) + "select choose_quote('" + RID + "','q-a','조건이 맞습니다')").yes);
  ok("  고른 것은 chosen 이다",
     psql("select state from quote where request_id='" + RID + "' and provider_id='q-a'")
       === "chosen");
  ok("  고르지 않은 것은 passed 다 (거둔 것과 **다른 말**입니다)",
     psql("select state from quote where request_id='" + RID + "' and provider_id='q-b'")
       === "passed");
  ok("  두 번 눌러도 터지지 않는다",
     allowed(as(CUS) + "select choose_quote('" + RID + "','q-a')").yes);
  /* ⚠️⚠️ 고른 뒤에는 **상태를 여기서 넘기지 않습니다** — 고르는 것과
     계약하는 것은 다릅니다 (0008 ④ 머리말). */
  ok("  고르는 것만으로 **계약 상태가 되지 않는다**",
     psql("select state::text from request where id='" + RID + "'") === "nego");

  const editChosen = denied(sub(PRO, '{"amount":1,"scope":"몰래 바꿉니다"}'));
  ok("고른 견적은 업체가 **못 고친다** (조용히 말을 바꾸는 일입니다)",
     editChosen.no, editChosen.why);
  ok("  금액이 그대로다",
     psql("select amount::text from quote where request_id='" + RID + "' " +
          "and provider_id='q-a'") === "600000");
  const pullChosen = denied(as(PRO) + "select withdraw_quote('" + RID + "')");
  ok("고른 견적은 **못 거둔다**", pullChosen.no, pullChosen.why);

  /* ── 자물쇠를 갈라서 눌러 봅니다 ──────────────────────────────── */
  console.log("\n── GRANT 와 RLS 를 **따로** 눌러 봅니다");
  /* ⚠️⚠️ 자물쇠가 겹치면 검사를 속입니다 — GRANT 를 잠깐 열어 RLS 가
     막는지 보고 **다시 닫습니다.** */
  const wrote = allowed(as(PR2) +
    "update quote set amount = 1 where provider_id = 'q-a'");
  /* ⚠️⚠️ **RLS 는 UPDATE 에서 에러를 내지 않습니다.** 보이지 않는 줄은
     안 걸릴 뿐이라 0줄이 바뀌고 성공으로 돌아옵니다 — "막혔는지" 를
     에러로 재면 "안 막혔다" 로 읽습니다. **바뀐 줄 수**를 셉니다. */
  ok("남의 견적 금액을 고치는 질의가 **0줄을 바꾼다** (에러가 아니라 0줄입니다)",
     psql("select amount::text from quote where provider_id='q-a'") === "600000",
     "허용여부=" + wrote.yes);
  const ins = denied(as(PRO) +
    "insert into quote (request_id, provider_id, amount, scope) values ('" +
    RID + "','q-a',1,'표를 직접')");
  ok("표에 직접 넣는 길이 없다 (문 셋만 엽니다)", ins.no, ins.why);
};

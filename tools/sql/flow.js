/* ════════════════════════════════════════════════════════════════════
   **처음부터 끝까지** 한 줄로 눌러 봅니다 (4차 지시서 §6 — 시나리오 A~D)

   ⚠️⚠️⚠️ **토막으로 재면 이어지는 자리가 안 잡힙니다.** 문마다 따로
   눌러 보는 검사는 이미 600건이 넘습니다 — 그런데 "입점 신청이 업체가
   되고, 그 업체가 손님에게 보이고, 손님이 요청을 넣고, 그 업체에
   배정되어 견적이 오가는" **한 줄**은 아무도 눌러 본 적이 없었습니다.
   그 줄에서만 드러나는 고장이 있습니다 (앞 단계의 결과가 다음 단계의
   입력입니다 — 키 하나가 어긋나면 양쪽 검사는 다 초록인데 길이 끊깁니다).

   ⚠️⚠️ **운영 자료와 섞이지 않습니다.** 이 검사는 `tools/test-sql.js`
   가 띄우는 **임시 Postgres** 에서만 돕니다 (돌고 나면 통째로 버립니다).
   업체는 `is_test` 로 또 한 번 가릅니다.

   A 업체   신청 → 심사 → 등록 → 초대 → 잇기 → 정보 · 가격 → 검색 노출
   B 손님   요청 → 동의 → 배정(재동의) → 수락 → 견적 → 고르기
   C 운영자 승인 → 요청 확인 → 매칭 상태 → 거래 상태 → 감사 기록
   D 보안   비로그인 · 남의 업체 · 승인 전 공개 · 중복 · 개인정보

   ⚠️⚠️ **업체가 0곳이어도 되는 셋**도 여기서 한 줄로 눌러 봅니다
   (2026-11-05 — 그때까지 이 파일에 그 셋의 문이 **하나도** 없었습니다):
   E 조인   열기 → 신청 → 알림 → 수락 → 연락처 각자 → 가리면 셋이 막힘
   F 커뮤니티 질문 → 답변 → 알림 → 가리면 **답변도 같이** 빠짐
   G 인력   업체 이름으로 올리기 → 지원 → 연락처 → **정지되면 상호가 빠짐**
   H 중고   매물 올리기 → 문의 → 받아들이기 → **연락처는 따로 동의** → 가리기
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  const as = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const j = o => JSON.stringify(o).replace(/'/g, "''");

  console.log("\n══ 시나리오 A — 업체: 신청 → 심사 → 등록 → 잇기 → 노출");
  const ADM = psql("insert into auth.users (email) values ('fl-adm@x.test') returning id");
  const BIZ = psql("insert into auth.users (email) values ('fl-biz@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('fl-cus@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + ADM + "','admin','흐름 관리자')," +
       "('" + BIZ + "','customer','업체 담당자')," +
       "('" + CUS + "','customer','흐름 손님') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  /* A-1 입점 신청 — ⚠️ 로그인 없이 들어옵니다 (손님 문과 같습니다) */
  const APNO = psql(anon + "select make_apply('" + j({
    company:"흐름 골프아카데미", name:"박사장", tel:"010-7777-1234",
    brn:"123-45-67890", region:"서울", services:["ls-solo","ls-group"],
    note:"레슨 전문입니다", agree_at:"now" }) + "'::jsonb)");
  ok("A-1 입점 신청이 들어간다 (로그인 없이)", /^AP-/.test(APNO) || APNO.length > 0, APNO);
  const APID = psql("select id::text from provider_apply where no='" + APNO + "'");

  /* A-2 관리자가 심사합니다 */
  ok("A-2 관리자가 '연락함' 으로 옮긴다",
     allowed(as(ADM) + "select set_apply_state('" + APID + "','called','통화했습니다')").yes);

  /* A-3 업체 줄을 만듭니다 (/admin 의 업체 등록 양식이 부르는 문) */
  const PVID = psql(as(ADM) + "select save_provider('flow-a','흐름 골프아카데미','" +
    j({ intro:"레슨 전문", regions:["seoul"], subs:["ls-solo","ls-group"],
        consultHours:"평일 10~20시" }) + "'::jsonb,'입점 신청 " + APNO + " 등록')");
  ok("A-3 업체가 만들어진다", PVID === "flow-a", PVID);
  /* ⚠️⚠️ 만든 업체는 **비공개**로 들어갑니다 (0001 의 기본값) */
  ok("  ⚠️ 만든 업체는 **비공개**로 들어간다 (바로 손님에게 안 보입니다)",
     psql("select listed::text from provider where id='flow-a'") === "false");
  /* 검사용으로 표시해 둡니다 — ⚠️ 운영 자료와 섞이지 않게 */
  psql("select become('" + ADM + "'); update provider set is_test = true where id='flow-a'");

  /* A-4 담당자 초대 → 계정 잇기 */
  const CODE = psql(as(ADM) + "select make_provider_invite('" + j({ provider:"flow-a" }) + "'::jsonb)");
  ok("A-4 초대 코드가 나온다", /^[2-9A-HJ-NP-Z]{10}$/.test(CODE), CODE);
  ok("  담당자가 코드로 이어진다",
     allowed(as(BIZ) + "select redeem_provider_invite('" + j({ code: CODE }) + "'::jsonb)").yes);
  ok("  그 계정이 업체가 된다",
     psql("select role::text || '/' || provider_id from account where id='" + BIZ +
          "'") === "provider/flow-a");

  /* A-5 업체가 제 정보와 가격을 올립니다 */
  ok("A-5 업체가 제 정보를 고친다 (지역 · 상담 방식)",
     allowed(as(BIZ) + "select save_provider_self('" + j({
       intro:"주 1회부터 받습니다", regions:["seoul"], gu:["관악구"],
       consultHours:"평일 10~20시", contactWays:["phone","visit"],
       brands:[], scale:"small" }) + "'::jsonb,'업체가 고쳤습니다')").yes);
  const P1 = psql(as(BIZ) + "select save_provider_price('" + j({
    sub:"ls-solo", label:"주 1회 · 8회권", amount:400000, unit:"8회" }) + "'::jsonb)");
  const P2 = psql(as(BIZ) + "select save_provider_price('" + j({
    sub:"ls-group", label:"그룹 · 월 4회", amount:160000, unit:"1개월" }) + "'::jsonb)");
  ok("  서비스 둘에 가격을 올린다 (§6-A 의 '서비스 2개')",
     /^[0-9a-f-]{36}$/.test(P1) && /^[0-9a-f-]{36}$/.test(P2), P1 + " / " + P2);

  /* A-6 ⚠️ 아직 공개 전입니다 — 검색에 안 나와야 합니다 */
  const inCard = () => psql(anon + "select count(*)::text from v_provider_card " +
                            "where id='flow-a'");
  ok("A-6 ⚠️ **승인 · 공개 전에는 검색에 안 나온다**", inCard() === "0");
  ok("  가격도 안 나간다",
     psql(anon + "select count(*)::text from v_provider_price_public " +
          "where provider_id='flow-a'") === "0");

  /* A-7 관리자가 공개 · 배정을 켭니다 — ⚠️ 계정이 이어져 있어야 켜집니다(0018) */
  ok("A-7 관리자가 공개로 켠다",
     allowed(as(ADM) + "select approve_provider('flow-a', true, null, " +
             "'심사 끝났습니다', true)").yes);
  /* ⚠️ 검사용 표시를 잠깐 끄고 **손님 눈으로** 봅니다 (끝나면 다시 켭니다) */
  psql("select become('" + ADM + "'); update provider set is_test = false where id='flow-a'");
  ok("  ⚠️ 그제야 검색에 나온다 (§6-A 의 '검색 결과 노출')", inCard() === "1");
  ok("  올린 가격 둘도 같이 나온다",
     psql(anon + "select count(*)::text from v_provider_price_public " +
          "where provider_id='flow-a'") === "2");
  ok("  상담 방식도 실린다 (0044)",
     psql(anon + "select array_to_string(contact_ways, ',') from v_provider_card " +
          "where id='flow-a'") === "phone,visit");
  /* ⚠️⚠️ **등록 완료는 그 업체를 가리켜야 합니다** (0016) — 셋째 인자가
     까닭이 아니라 **업체**입니다. 이것을 안 보내던 관리자 화면이
     여기서 드러났습니다 (화면도 같이 고쳤습니다).
     ⚠️ 안 가리키는 쪽을 **먼저** 눌러 봅니다 — 한 번 가리키고 나면 그
     값이 줄에 남아서, 뒤에 눌러 보면 통과해 버립니다 (검사가 틀리는 자리). */
  const a8b = denied(as(ADM) + "select set_apply_state('" + APID + "','done',null,'업체 없이')");
  ok("A-8 ⚠️ 업체를 안 가리키면 막힌다 (어느 업체인지가 사라집니다)", a8b.no, a8b.why);
  const a8 = allowed(as(ADM) + "select set_apply_state('" + APID +
    "','done','flow-a','업체로 등록했습니다')");
  ok("  그 업체를 가리키면 '등록 완료' 가 된다", a8.yes, a8.why);
  ok("  신청에 그 업체가 적힌다",
     psql("select provider_id from provider_apply where id='" + APID + "'") === "flow-a");

  console.log("\n══ 시나리오 B — 손님: 요청 → 동의 → 배정 → 견적 → 고르기");
  /* B-1 요청 — ⚠️ 로그인 없이 들어옵니다 */
  const RNO = psql(anon + "select make_request(jsonb_set('" + j({
    name:"흐름손님", tel:"010-7777-5678", services:["ls-solo"], cat:"lesson",
    region:"서울", budget_min:300000, budget_max:600000, want_at:"이번 달",
    body:"주 1회 원합니다" }) + "'::jsonb, '{agree_at}', to_jsonb(now())))");
  ok("B-1 매칭 요청이 들어간다", /^SW-/.test(RNO), RNO);
  const RID = psql("select id::text from request where no='" + RNO + "'");
  /* ⚠️⚠️ **동의를 가릅니다** (개인정보보호법 제17조 제2항) */
  ok("B-2 ⚠️ 수집 · 이용 동의는 **있고**, 제3자 제공 동의는 **비어 있다**",
     psql("select (agree_at is not null)::text || '/' || (agree3rd_at is null)::text " +
          "from request where id='" + RID + "'") === "true/true");
  /* 손님 계정에 붙입니다 (화면에서는 claim 으로 합니다) */
  psql("update request set user_id = '" + CUS + "' where id='" + RID + "'");

  /* B-3 배정 — ⚠️ 재동의 없이 넘기면 막혀야 합니다 */
  psql(as(ADM) + "select move_state('" + RID + "','check','{}'::jsonb)");
  const noAgree = denied(as(ADM) + "select move_state('" + RID + "','assigned','" +
    j({ providerId:"flow-a", why:"재동의 없이 넘겨 봅니다" }) + "'::jsonb)");
  ok("B-3 ⚠️ **제3자 제공 재동의 없이는 못 넘긴다**", noAgree.no, noAgree.why);
  /* ⚠️⚠️ **길은 전이표가 정합니다** (0004 의 deal_move) — new 에서 바로
     assigned 로 못 갑니다. 운영자가 먼저 **확인 중**으로 옮깁니다. */
  const b3 = allowed(as(ADM) + "select move_state('" + RID + "','assigned','" +
    j({ providerId:"flow-a", agree3rd:true,
        why:"11/03 통화로 상호 안내 후 구두 동의" }) + "'::jsonb)");
  ok("  관리자가 재동의를 받고 넘긴다", b3.yes, b3.why);
  ok("  그때 제3자 제공 동의 시각이 적힌다",
     psql("select (agree3rd_at is not null)::text from assignment " +
          "where request_id='" + RID + "'") === "true");
  /* ⚠️ 그제야 업체가 손님 성함 · 연락처를 봅니다 */
  ok("  ⚠️ 그제야 업체가 손님 성함 · 연락처를 본다",
     psql(as(BIZ) + "select name from request where id='" + RID + "'") === "흐름손님");

  /* B-4 업체가 수락하고 견적을 냅니다 */
  ok("B-4 업체가 수락한다",
     allowed(as(BIZ) + "select answer_assignment('" + RID + "', true)").yes);
  ok("  상담을 시작한다",
     allowed(as(BIZ) + "select move_state('" + RID + "','consult','{}'::jsonb)").yes);
  ok("  견적을 낸다",
     allowed(as(BIZ) + "select submit_quote('" + RID + "','" + j({
       amount:400000, vat:"add", scope:"주 1회 · 8회", days:60,
       valid_to:"2029-12-31" }) + "'::jsonb)").yes);
  /* ⚠️⚠️⚠️ **견적을 냈다고 거래가 끝난 것이 아닙니다** (§4 의 그 줄) */
  ok("B-5 ⚠️⚠️ **견적을 냈다고 거래가 완료되지 않는다**",
     psql("select state::text from request where id='" + RID + "'") === "quoted");
  ok("  거래(deal) 줄도 아직 없다",
     psql("select count(*)::text from deal where request_id='" + RID + "'") === "0");

  /* B-6 손님이 고릅니다 */
  ok("B-6 손님이 그 견적을 고른다",
     allowed(as(CUS) + "select choose_quote('" + RID + "','flow-a')").yes);
  ok("  그 견적이 '고름' 이 된다",
     psql("select state from quote where request_id='" + RID + "'") === "chosen");
  /* ⚠️ 고른 것도 **계약이 아닙니다** — 운영자가 계약으로 옮깁니다 */
  ok("  ⚠️ 고른 것만으로 **계약도 아니다** (운영자가 확인하고 옮깁니다)",
     psql("select state::text from request where id='" + RID + "'") !== "signed",
     psql("select state::text from request where id='" + RID + "'"));

  console.log("\n══ 시나리오 C — 운영자: 상태 관리 · 감사 기록");
  /* ⚠️⚠️ **조율(nego)은 운영자가 못 옮깁니다** — 전이표가 손님과 업체
     에게만 열어 두었습니다 (조율은 둘 사이의 일이고, 운영자가 대신
     밟으면 그 기록의 뜻이 달라집니다). 끝까지 눌러 보고서야 알았습니다. */
  const admNego = denied(as(ADM) + "select move_state('" + RID + "','nego','{}'::jsonb)");
  ok("C-0 ⚠️ 조율로는 **운영자가 못 옮긴다** (손님 · 업체 사이의 걸음입니다)",
     admNego.no, admNego.why);
  if(psql("select state::text from request where id='" + RID + "'") === "quoted")
    psql(as(CUS) + "select move_state('" + RID + "','nego','{}'::jsonb)");
  const c1 = allowed(as(ADM) + "select move_state('" + RID + "','signed','" +
    j({ amount:400000, why:"계약서 받았습니다" }) + "'::jsonb)");
  ok("C-1 운영자가 계약으로 옮긴다", c1.yes, c1.why);
  ok("  거래 줄이 그때 생긴다",
     psql("select count(*)::text from deal where request_id='" + RID + "'") === "1");
  const c2 = allowed(as(ADM) + "select move_state('" + RID + "','done','" +
    j({ why:"수업 시작했습니다" }) + "'::jsonb)");
  ok("C-2 완료로 옮긴다", c2.yes, c2.why);
  /* ⚠️⚠️ 한 줄의 모든 걸음이 기록에 남아야 합니다 */
  ok("C-3 ⚠️ 이 요청의 걸음이 **전부 감사 기록에 남는다**",
     Number(psql("select count(*)::text from audit_log where obj='request' " +
                 "and obj_id in ('" + RID + "','" + RNO + "')")) >= 4,
     psql("select count(*)::text from audit_log where obj='request' " +
          "and obj_id in ('" + RID + "','" + RNO + "')"));
  ok("  업체 · 초대 · 가격의 걸음도 남는다",
     Number(psql("select count(*)::text from audit_log where obj in " +
                 "('provider','provider_invite','provider_price','account')")) >= 4);
  /* ⚠️ 감사 기록에 성함 · 연락처가 없어야 합니다 */
  ok("C-4 ⚠️ 감사 기록에 **성함 · 연락처가 없다**",
     psql("select count(*)::text from audit_log where " +
          "coalesce(data::text,'') || coalesce(why,'') like '%010-7777-5678%'") === "0");

  console.log("\n══ 시나리오 D — 보안");
  /* D-1 비로그인 */
  const d1 = denied(anon + "select count(*) from request");
  ok("D-1 비로그인은 요청 표를 못 읽는다", d1.no, d1.why);
  const d1b = denied(anon + "select count(*) from quote");
  ok("  견적 표도 못 읽는다", d1b.no, d1b.why);
  /* D-2 다른 업체 */
  const OTH = psql("insert into auth.users (email) values ('fl-oth@x.test') returning id");
  psql("insert into provider (id, name, listed, is_test, subs, state) values " +
       "('flow-b','[검사용] 남의 업체', true, true, '{ls-solo}','approved') " +
       "on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values ('" + OTH +
       "','provider','남의 업체 사람','flow-b') on conflict (id) do update set " +
       "role = excluded.role, provider_id = excluded.provider_id");
  ok("D-2 ⚠️ 다른 업체는 이 요청의 **성함 · 연락처를 못 본다**",
     psql(as(OTH) + "select count(*)::text from request where id='" + RID + "'") === "0");
  ok("  남의 견적도 못 본다",
     psql(as(OTH) + "select count(*)::text from quote where request_id='" + RID + "'") === "0");
  ok("  남의 가격표도 못 본다",
     psql(as(OTH) + "select count(*)::text from provider_price " +
          "where provider_id='flow-a'") === "0");
  const d2 = denied(as(OTH) + "select save_provider_price('" + j({
    provider:"flow-a", sub:"ls-solo", label:"남의 업체에 올려 봅니다",
    amount:1000, unit:"1회" }) + "'::jsonb)");
  ok("  남의 업체에 가격을 못 올린다", d2.no, d2.why);
  /* D-3 승인 전 공개 */
  psql("insert into provider (id, name, listed, is_test, subs, state) values " +
       "('flow-c','[검사용] 심사 중 업체', true, false, '{ls-solo}','under_review') " +
       "on conflict (id) do update set state = 'under_review', listed = true, is_test = false");
  ok("D-3 ⚠️ **승인 전** 업체는 공개 목록에 안 나온다",
     psql(anon + "select count(*)::text from v_provider_card where id='flow-c'") === "0");
  /* D-4 중복 요청 */
  const dup = denied(anon + "select make_request(jsonb_set('" + j({
    name:"흐름손님", tel:"010-7777-5678", services:["ls-solo"], cat:"lesson" }) +
    "'::jsonb, '{agree_at}', to_jsonb(now())))");
  ok("D-4 ⚠️ 같은 번호로 바로 또 넣으면 막힌다", dup.no, dup.why);
  /* D-5 개인정보 — ⚠️ 공개로 나가는 길에 성함 · 연락처가 한 글자도 없어야 합니다 */
  const leak = psql(anon +
    "select coalesce(string_agg(x, ' '), '') from (" +
    "  select v_provider_card::text as x from v_provider_card" +
    "  union all select v_provider_price_public::text from v_provider_price_public" +
    ") t");
  ok("D-5 ⚠️⚠️ 공개 보기에 **성함 · 연락처가 한 글자도 없다**",
     leak.indexOf("010-7777") < 0 && leak.indexOf("흐름손님") < 0 &&
     leak.indexOf("박사장") < 0, leak.slice(0, 200));
  /* 업체 담당자의 연락처(입점 신청에 적은 것)도 공개로 안 나갑니다 */
  const d5 = denied(anon + "select count(*) from provider_apply");
  ok("  입점 신청 표도 공개로 못 읽는다", d5.no, d5.why);
  /* ══════════════════════════════════════════════════════════════════
     E · F · G — **업체가 0곳이어도 되는 셋**을 한 줄로 눌러 봅니다

     ⚠️⚠️⚠️ 조인(0046) · 커뮤니티(0047) · 인력(0048) 은 문마다 따로
     재는 검사가 이미 수백 건인데, **한 줄로는 아무도 눌러 본 적이
     없었습니다** (이 파일에 그 셋의 문이 한 개도 없었습니다 — 작업
     기억에 "새 흐름을 만드는 날 이어 붙이세요" 라고 적어 놓고 안
     붙였습니다). 이 셋은 **업체가 0곳이어도 되는 것**이라, 문 여는 날
     손님이 실제로 쓸 길이 바로 이 셋입니다.

     ⚠️ 그래서 여기서 재는 것은 **문 하나하나가 아니라 이어지는 자리**
     입니다 — 토막 검사가 영원히 못 보는 곳만 고릅니다:
       · 0050 의 **알림 트리거**가 실제로 꽂히는가 (다른 마이그레이션입니다)
       · 0049 로 가리면 **신청 · 고치기 · 닫기가 저절로** 막히는가
       · 질문을 가리면 **답변도 같이** 빠지는가
       · 업체를 정지시키면 **그 순간** 상호가 빠지는가
     ══════════════════════════════════════════════════════════════════ */
  console.log("\n══ 시나리오 E — 조인: 열기 → 신청 → 알림 → 수락 → 연락처 → 가리기");

  const EH = psql("insert into auth.users (email) values ('fl-ehost@x.test') returning id");
  const EG = psql("insert into auth.users (email) values ('fl-eg@x.test') returning id");
  const EN = psql("insert into auth.users (email) values ('fl-enosy@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + EH + "','customer','조인 여는 사람')," +
       "('" + EG + "','customer','조인 신청자')," +
       "('" + EN + "','customer','조인 남') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  const NOW  = () => psql("select now()");
  const PLAY = psql("select (current_date + 10)::text");

  /* E-1 자리를 엽니다 — ⚠️ 업체가 한 곳도 없어도 됩니다 */
  const e1 = allowed(as(EH) + "select open_joinroom('" + j({
    region:"seoul", play_at:PLAY, need:2, title:"주말 아침 두 자리",
    body:"초보도 환영합니다", course:"흐름CC", tee:"07:30",
    /* ⚠️ `budget` 은 **int** 입니다 (원 단위 · 0~1,000만) — "18만원 선"
       처럼 글자로 넣으면 문이 아니라 **표의 칸**이 거절합니다.
       가짜 자료도 DB 가 받는 값이어야 합니다. */
    budget:180000, contact:"010-7100-0001", agree_at:NOW() }) + "'::jsonb)");
  ok("E-1 회원이 자리를 연다 (업체가 0곳이어도 됩니다)",
     e1.yes && /^[0-9a-f-]{36}$/.test(e1.out), e1.out || e1.why);
  const ERID = e1.out;

  /* ⚠️ 공개 목록은 **보기** 하나입니다 — 자리 수를 칸에 저장하지 않고 셉니다 */
  const eOpen = c => psql(as(EN) + "select coalesce(" + c +
    ", '(없음)') from v_join_open where id = '" + ERID + "'");
  /* ⚠️⚠️⚠️ **줄이 사라진 것을 coalesce 로 재면 안 됩니다** — 0줄이면 칸이
     아예 없어서 psql 이 **빈 글자**를 돌려줍니다. '(없음)' 과 견주면
     떨어지고, 반대로 빈 글자와 견주면 **엉뚱한 까닭으로 통과**합니다
     (칸이 null 인 것과 줄이 없는 것이 섞입니다). 줄이 있나 없나는
     **세어서** 봅니다. */
  const eGone = () => psql(as(EN) + "select count(*)::text from v_join_open " +
    "where id = '" + ERID + "'") === "0";
  ok("  남이 공개 목록에서 그 자리를 본다", eOpen("id::text") === ERID);
  ok("  남은 자리를 **세어서** 내려준다 (저장하지 않습니다 — 절대 규칙 1)",
     eOpen("left_n::text") === "2" && eOpen("taken_n::text") === "0",
     eOpen("left_n::text") + " / " + eOpen("taken_n::text"));
  /* ⚠️⚠️ 공개 목록에 **연락처가 한 글자도 없어야 합니다** */
  const eLeak = psql(as(EN) + "select v_join_open::text from v_join_open where id='" + ERID + "'");
  ok("  ⚠️⚠️ 공개 목록에 **연락처가 한 글자도 없다**",
     eLeak.indexOf("010-7100") < 0, eLeak.slice(0, 160));

  /* E-2 신청 → ⚠️⚠️ 0050 의 트리거가 **연 사람에게** 알림을 꽂아야 합니다 */
  /* ⚠️⚠️⚠️ **`to_user` 를 where 절에 쓰면 안 됩니다** — 0050 은 칸 단위로
     GRANT 를 주었고 그 칸은 **안 줬습니다.** 안 준 칸을 조건에 쓰면
     0줄이 아니라 **질의가 통째로 거절**됩니다 (`permission denied for
     table notice`). 처음에 그렇게 적어서 검사가 터졌는데, **맞는 동작이고
     틀린 것은 검사**였습니다 (0052 에서도 같은 자리를 밟았습니다).
     ⚠️ 줄은 RLS 가 이미 **제 것만** 내주므로 조건이 필요 없습니다. */
  const nCount = (u, k) => psql("select become('" + u + "'); set role authenticated; " +
    "select count(*)::text from notice where kind='" + k + "'");
  const e2 = allowed(as(EG) + "select apply_joinroom('" + j({
    room_id:ERID, contact:"010-7200-0002", msg:"같이 치고 싶습니다",
    agree_at:NOW() }) + "'::jsonb)");
  ok("E-2 다른 회원이 신청한다", e2.yes && /^[0-9a-f-]{36}$/.test(e2.out), e2.out || e2.why);
  const EAID = e2.out;
  /* ⚠️⚠️⚠️ **다른 마이그레이션(0050)의 트리거**입니다 — 0046 을 재는
     검사는 이 자리를 안 봅니다. 트리거가 떨어져 나가도 조인은 멀쩡히
     돌고, 연 사람만 **아무 소식을 못 받습니다.** */
  ok("  ⚠️⚠️ 0050 의 트리거가 **연 사람에게 알림을 꽂는다**",
     nCount(EH, "joinapply") === "1", nCount(EH, "joinapply"));
  /* ⚠️ 여기도 `to_user` 를 조건에 쓰면 거절됩니다 (위 nCount 의 까닭) */
  const eLink = psql(as(EH) + "select link from notice " +
    "where kind='joinapply' limit 1");
  ok("  ⚠️ 가는 주소가 **우리 주소**다 (`/` 로 시작 · `//` 아님 — 열린 넘겨주기)",
     eLink.indexOf("/") === 0 && eLink.indexOf("//") !== 0, eLink);
  /* ⚠️⚠️ 알림에 **본문 칸이 아예 없어야** 합니다 — 담으면 손님 글이 한 벌
     더 복사되고, 그 안에 연락처가 있으면 알림이 그것을 나릅니다. */
  ok("  ⚠️⚠️ 알림 표에 **본문 칸이 아예 없다** (제목 · 가는 자리까지)",
     psql("select count(*)::text from information_schema.columns where " +
          "table_name='notice' and column_name in ('body','text','msg','content')") === "0");
  /* ⚠️ 제가 한 일은 제게 안 알립니다 */
  ok("  ⚠️ 신청한 사람 제게는 안 알린다 (제가 한 일입니다)",
     nCount(EG, "joinapply") === "0");

  /* E-3 수락 → 신청자에게 알림 · 남은 자리가 **줄어야** 합니다 */
  const e3 = allowed(as(EH) + "select move_joinapply('" +
    j({ id:EAID, state:"accepted" }) + "'::jsonb)");
  ok("E-3 연 사람이 수락한다", e3.yes, e3.out || e3.why);
  ok("  신청자에게 알림이 간다 (0050)", nCount(EG, "joinmoved") === "1");
  ok("  남은 자리가 하나 줄어든다 (세어서 내려줍니다)",
     eOpen("left_n::text") === "1" && eOpen("taken_n::text") === "1",
     eOpen("left_n::text") + " / " + eOpen("taken_n::text"));

  /* E-4 ⚠️⚠️⚠️ **수락만으로는 연락처가 안 열립니다** (제17조 제2항) */
  const eCt = (u, c) => psql(as(u) + "select coalesce(" + c +
    ", '(없음)') from v_join_contact where apply_id = '" + EAID + "'");
  ok("E-4 ⚠️⚠️⚠️ **수락만으로는 양쪽 다 번호를 못 본다** (제17조 제2항)",
     eCt(EH, "apply_contact") === "(없음)" && eCt(EG, "room_contact") === "(없음)",
     eCt(EH, "apply_contact") + " / " + eCt(EG, "room_contact"));

  /* E-5 각자 **제 것만** 엽니다 — 맞바꾸기를 강요하지 않습니다 */
  ok("E-5 신청자가 제 번호만 연다",
     allowed(as(EG) + "select share_joincontact('" +
       j({ id:EAID, on:true, agree_at:NOW() }) + "'::jsonb)").yes);
  ok("  연 사람이 그 번호를 본다", eCt(EH, "apply_contact") === "010-7200-0002",
     eCt(EH, "apply_contact"));
  ok("  ⚠️ 한쪽만 열었으므로 **연 사람 번호는 아직 안 간다** (맞바꾸기 강요 없음)",
     eCt(EG, "room_contact") === "(없음)", eCt(EG, "room_contact"));
  ok("  연 사람도 제 것을 연다",
     allowed(as(EH) + "select share_joincontact('" +
       j({ id:EAID, on:true, agree_at:NOW() }) + "'::jsonb)").yes);
  ok("  그제야 신청자가 연 사람 번호를 본다",
     eCt(EG, "room_contact") === "010-7100-0001", eCt(EG, "room_contact"));
  /* ⚠️ 철회권 — 다시 닫을 수 있어야 합니다 */
  ok("E-6 ⚠️ 다시 닫으면 그 순간 안 보인다 (철회권)",
     allowed(as(EG) + "select share_joincontact('" +
       j({ id:EAID, on:false, agree_at:NOW() }) + "'::jsonb)").yes &&
     eCt(EH, "apply_contact") === "(없음)", eCt(EH, "apply_contact"));
  /* ⚠️ 남은 못 봅니다 — 보기의 where 가 짝만 냅니다 */
  ok("  ⚠️ 남은 그 줄을 **아예 못 본다** (보기의 where 가 짝만 냅니다)",
     psql(as(EN) + "select count(*)::text from v_join_contact " +
          "where apply_id='" + EAID + "'") === "0");

  /* E-7 ⚠️⚠️ 운영자가 가립니다(0049) → **셋이 저절로 막혀야** 합니다
     ⚠️ 작업 기억이 "상태 하나를 더하는 것만으로 신청 · 고치기 · 닫기가
        저절로 막힙니다 (셋 다 state='open' 을 요구합니다 — 문을 안 갈아
        끼웠습니다)" 라고 적어 두었습니다. 그 말이 참인지는 **여기서만**
        드러납니다 (0049 를 재는 검사는 0046 의 문 셋을 안 누릅니다). */
  ok("E-7 운영자가 그 자리를 가린다 (0049)",
     allowed(as(ADM) + "select move_joinroom('" +
       j({ id:ERID, state:"hidden", why:"신고가 들어와 확인 중입니다" }) +
       "'::jsonb)").yes);
  ok("  ⚠️ 공개 목록에서 **줄째** 빠진다 (세어서 봅니다)", eGone());
  const e7a = denied(as(EN) + "select apply_joinroom('" + j({
    room_id:ERID, contact:"010-7300-0003", msg:"저도요", agree_at:NOW() }) + "'::jsonb)");
  ok("  ⚠️⚠️ **신청이 저절로 막힌다** (문을 안 갈아 끼웠습니다)", e7a.no, e7a.why);
  const e7b = denied(as(EH) + "select edit_joinroom('" + j({
    id:ERID, region:"seoul", play_at:PLAY, need:2, title:"고쳐 봅니다",
    body:"가려진 자리를 고쳐 봅니다", contact:"010-7100-0001" }) + "'::jsonb)");
  ok("  ⚠️⚠️ **고치기도 저절로 막힌다**", e7b.no, e7b.why);
  const e7c = denied(as(EH) + "select close_joinroom('" + j({ id:ERID }) + "'::jsonb)");
  ok("  ⚠️⚠️ **닫기도 저절로 막힌다**", e7c.no, e7c.why);
  /* ⚠️ 자물쇠마다 **다른 말**로 거절해야 합니다 (같은 말이면 어느 것이
     막았는지 알 수 없고, 하나가 빠져도 티가 안 납니다) */
  ok("  ⚠️ 셋이 **다른 말**로 거절한다",
     new Set([e7a.why, e7b.why, e7c.why].map(w => String(w).slice(0, 40))).size >= 2,
     [e7a.why, e7b.why, e7c.why].join(" | ").slice(0, 200));

  console.log("\n══ 시나리오 F — 커뮤니티: 질문 → 답변 → 알림 → 가리면 답변도 빠짐");

  /* ⚠️ `ask_cq` 는 **10분에 한 건**입니다 — 시계를 되돌리지 않고
     **사람을 바꿉니다** (문을 지나가지 않게). */
  const FA = psql("insert into auth.users (email) values ('fl-fask@x.test') returning id");
  const FB = psql("insert into auth.users (email) values ('fl-fans@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + FA + "','customer','김묻는이')," +
       "('" + FB + "','customer','이답하는이') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  const f1 = allowed(as(FA) + "select ask_cq('" + j({
    cat:"lesson", title:"드라이버가 오른쪽으로 휩니다",
    body:"그립을 바꿔 봐도 계속 휩니다. 무엇부터 보면 될까요?" }) + "'::jsonb)");
  ok("F-1 회원이 질문을 올린다", f1.yes && /^[0-9a-f-]{36}$/.test(f1.out), f1.out || f1.why);
  const FQID = f1.out;
  const fq = c => psql(anon + "select coalesce(" + c +
    ", '(없음)') from v_cq_public where id = '" + FQID + "'");
  /* ⚠️ 줄이 있나 없나는 **세어서** 봅니다 (위 eGone 의 까닭) */
  const fGone = () => psql(anon + "select count(*)::text from v_cq_public " +
    "where id = '" + FQID + "'") === "0";
  ok("  ⚠️ 글은 **로그인 없이도** 읽힌다 (공개입니다)", fq("id::text") === FQID);
  /* ⚠️⚠️ 글은 공개지만 **글쓴이는 공개가 아닙니다** — 가리는 것은 보기가
     하고(`김**`), `by_user` 칸은 보기에 **아예 없습니다.** */
  /* ⚠️⚠️ **별 개수를 글자로 박지 마세요** — 보기는 `left(이름,1) ||
     repeat('*', 이름길이-1)` 이라 **이름이 길면 별도 늘어납니다.**
     처음에 `김**` 로 박아 두어서 네 글자 이름(`김묻는이`)에
     **멀쩡한 보기를 실패로** 잡았습니다 (또 "검사에 그날의 값을 박은"
     자리입니다). 재려는 뜻은 ① 첫 글자만 남고 ② 나머지가 전부 별이고
     ③ **본이름이 한 글자도 안 나온다** 셋입니다. */
  const masked = (got, real) => got.slice(0, 1) === real.slice(0, 1) &&
    /^.\*+$/.test(got) && got.indexOf(real.slice(1)) < 0;
  ok("  ⚠️⚠️ 이름을 **보기가** 가려서 낸다 (화면이 가리면 늦습니다)",
     masked(fq("who"), "김묻는이"), fq("who"));
  ok("  ⚠️⚠️ 공개 보기에 `by_user` 칸이 **아예 없다**",
     psql("select count(*)::text from information_schema.columns where " +
          "table_name='v_cq_public' and column_name in ('by_user','request_id')") === "0");
  ok("  답변 수를 **세어서** 낸다 (저장하지 않습니다)", fq("answer_n::text") === "0");

  /* F-2 답변 → ⚠️ 0050 의 트리거가 **질문한 사람에게** 알립니다 */
  const f2 = allowed(as(FB) + "select answer_cq('" + j({
    q_id:FQID, body:"그립보다 몸통 회전을 먼저 보시는 것이 좋습니다" }) + "'::jsonb)");
  ok("F-2 다른 회원이 답변을 단다", f2.yes && /^[0-9a-f-]{36}$/.test(f2.out), f2.out || f2.why);
  const FAID = f2.out;
  ok("  ⚠️⚠️ 0050 의 트리거가 **질문한 사람에게 알린다**",
     nCount(FA, "answer") === "1", nCount(FA, "answer"));
  ok("  답변 수가 하나로 세어진다", fq("answer_n::text") === "1");
  const faWho = psql(anon + "select who from v_ca_public where id='" + FAID + "'");
  ok("  답변 쪽 이름도 보기가 가린다", masked(faWho, "이답하는이"), faWho);

  /* F-3 ⚠️⚠️⚠️ 질문을 가리면 **답변도 같이 빠져야** 합니다 — 안 빠지면
     가린 글의 답글만 둥둥 떠서 무슨 말인지 알 수 없고, 가린 뜻이
     사라집니다 (`v_ca_public` 이 **질문 상태까지** 봅니다).
     ⚠️ 답변을 재는 검사는 질문의 상태를 안 바꿉니다 — 이어진 자리입니다. */
  const fNoWhy = denied(as(ADM) + "select move_cq('" +
    j({ id:FQID, state:"hidden" }) + "'::jsonb)");
  ok("F-3 ⚠️ 까닭 없이는 못 가린다 (까닭 없이 가릴 수 있으면 후기가 광고입니다)",
     fNoWhy.no, fNoWhy.why);
  ok("  운영자가 까닭을 적고 가린다",
     allowed(as(ADM) + "select move_cq('" +
       j({ id:FQID, state:"hidden", why:"특정 업체 비방이 섞여 있습니다" }) +
       "'::jsonb)").yes);
  ok("  ⚠️ 질문이 공개 목록에서 빠진다 (세어서 봅니다)", fGone());
  ok("  ⚠️⚠️⚠️ **답변도 같이 빠진다** (보기가 질문 상태까지 봅니다)",
     psql(anon + "select count(*)::text from v_ca_public where id='" + FAID + "'") === "0");
  /* ⚠️ 가린 **까닭은 글쓴이에게 보여 줍니다** — 까닭 없이 못 가리게 해
     두고 그 까닭을 숨기면 글쓴이는 무엇이 문제였는지 알 수 없습니다. */
  ok("  ⚠️ 가린 **까닭이 글쓴이에게 남는다**",
     psql(as(FA) + "select hidden_why from cq where id='" + FQID +
          "'").indexOf("비방") >= 0);
  ok("  ⚠️ 글쓴이에게 알림이 간다 (0050)", nCount(FA, "hidden") === "1");
  /* ⚠️ 지우지 않고 가립니다 — 지우면 다툴 때 아무 기록이 없습니다 */
  ok("  ⚠️ **지우지 않고 가린다** (줄은 그대로 있습니다)",
     psql("select state from cq where id='" + FQID + "'") === "hidden");

  console.log("\n══ 시나리오 G — 인력: 업체 이름으로 올리기 → 지원 → 연락처 → 정지");

  /* ⚠️⚠️ **업체 이름(상호)으로 올리는 것**은 고르는 것입니다(`as_pro`) —
     승인된 · 검사용이 아닌 업체만 되고, 보기가 **읽을 때 다시** 상태를
     봅니다. 그래서 "정지시키면 그 순간 빠지는가" 는 문을 따로 재는
     검사로는 영원히 안 드러납니다 (두 마이그레이션이 걸칩니다). */
  const GP = psql("insert into auth.users (email) values ('fl-gpro@x.test') returning id");
  const GS = psql("insert into auth.users (email) values ('fl-gseek@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + GP + "','customer','업체 담당자2')," +
       "('" + GS + "','customer','구직자') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  /* ⚠️⚠️ **이미 쓰이고 있으면 큰 소리로 멈춥니다** — `save_provider` 는
     있는 줄을 덮으므로, 다른 검사가 `flow-d` 를 먼저 만들어 두면 그
     줄을 **조용히 물려받습니다** (`subs` 가 비어 엉뚱한 자리에서
     떨어집니다 — 0051 에서 `pp-a` 로 그렇게 밟았습니다). */
  if(psql("select count(*)::text from provider where id='flow-d'") !== "0"){
    throw new Error("flow-d 가 이미 있습니다 — 다른 검사와 업체 id 가 부딪힙니다");
  }
  /* 업체를 **문으로** 세웁니다 (표를 직접 고치면 0038 의 트리거가 막습니다) */
  const GPV = psql(as(ADM) + "select save_provider('flow-d','흐름 골프아카데미2','" +
    j({ intro:"캐디 · 프런트를 뽑습니다", regions:["seoul"], subs:["cr-caddy"],
        consultHours:"평일 10~19시" }) + "'::jsonb,'인력 흐름 검사용')");
  ok("G-0 업체를 문으로 세운다", GPV === "flow-d", GPV);
  const GCODE = psql(as(ADM) + "select make_provider_invite('" +
    j({ provider:"flow-d" }) + "'::jsonb)");
  ok("  담당자가 초대 코드로 이어진다",
     allowed(as(GP) + "select redeem_provider_invite('" +
       j({ code: GCODE }) + "'::jsonb)").yes, GCODE);
  ok("  관리자가 승인 · 공개로 켠다",
     allowed(as(ADM) + "select approve_provider('flow-d', true, null, " +
             "'인력 흐름 검사용입니다', true)").yes);
  psql("select become('" + ADM + "'); update provider set is_test = false where id='flow-d'");

  /* G-1 업체 이름으로 글을 올립니다 — ⚠️ 급여 · 조건은 **비워** 둡니다 */
  const g1 = allowed(as(GP) + "select open_jobpost('" + j({
    kind:"hire", sub:"cr-caddy", region:"seoul", as_pro:true,
    title:"주말 캐디를 모십니다",
    body:"주말 오전 라운딩 캐디를 모십니다. 경험 있으신 분 환영합니다.",
    contact:"010-7400-0004", agree_at:NOW() }) + "'::jsonb)");
  ok("G-1 업체 담당자가 **업체 이름으로** 글을 올린다",
     g1.yes && /^[0-9a-f-]{36}$/.test(g1.out), g1.out || g1.why);
  const GPID = g1.out;
  const gp = c => psql(anon + "select coalesce(" + c +
    ", '(없음)') from v_job_open where id = '" + GPID + "'");
  ok("  ⚠️ 공개 목록에 **상호가 실린다**", gp("pro_name") === "흐름 골프아카데미2",
     gp("pro_name"));
  /* ⚠️ 급여 · 조건은 비면 **null 로 내려옵니다** — 화면이 줄째 뺍니다.
     "협의" 를 우리가 지어 적지 않습니다 (절대 규칙 2 · 5). */
  ok("  ⚠️ 급여 · 조건을 비우면 **null 로 내려온다** (\"협의\" 를 지어 적지 않습니다)",
     gp("pay") === "(없음)" && gp("terms") === "(없음)",
     gp("pay") + " / " + gp("terms"));
  const gLeak = psql(anon + "select v_job_open::text from v_job_open where id='" + GPID + "'");
  ok("  ⚠️⚠️ 공개 목록에 **연락처가 한 글자도 없다**",
     gLeak.indexOf("010-7400") < 0, gLeak.slice(0, 160));

  /* G-2 지원 → ⚠️ 글쓴이에게 알림 · 수락 → 지원자에게 알림 */
  const g2 = allowed(as(GS) + "select apply_jobpost('" + j({
    post_id:GPID, msg:"캐디 경력 3년입니다. 주말 모두 가능합니다.",
    contact:"010-7500-0005", agree_at:NOW() }) + "'::jsonb)");
  ok("G-2 구직자가 지원한다", g2.yes && /^[0-9a-f-]{36}$/.test(g2.out), g2.out || g2.why);
  const GAID = g2.out;
  ok("  ⚠️⚠️ 0050 의 트리거가 **글쓴이에게 알린다**",
     nCount(GP, "jobapply") === "1", nCount(GP, "jobapply"));
  ok("  지원 수를 **세어서** 낸다", gp("apply_n::text") === "1");
  ok("G-3 글쓴이가 수락한다",
     allowed(as(GP) + "select move_jobapply('" +
       j({ id:GAID, state:"accepted" }) + "'::jsonb)").yes);
  ok("  지원자에게 알림이 간다 (0050)", nCount(GS, "jobmoved") === "1");

  /* G-4 ⚠️⚠️⚠️ 인력도 조인과 **똑같이** 수락만으로는 안 열립니다 */
  const gCt = (u, c) => psql(as(u) + "select coalesce(" + c +
    ", '(없음)') from v_job_contact where apply_id = '" + GAID + "'");
  ok("G-4 ⚠️⚠️⚠️ **수락만으로는 양쪽 다 번호를 못 본다** (제17조 제2항)",
     gCt(GP, "apply_contact") === "(없음)" && gCt(GS, "post_contact") === "(없음)",
     gCt(GP, "apply_contact") + " / " + gCt(GS, "post_contact"));
  ok("  지원자가 제 것만 연다",
     allowed(as(GS) + "select share_jobcontact('" +
       j({ id:GAID, on:true, agree_at:NOW() }) + "'::jsonb)").yes &&
     gCt(GP, "apply_contact") === "010-7500-0005", gCt(GP, "apply_contact"));
  ok("  ⚠️ 글쓴이 번호는 아직 안 간다 (맞바꾸기 강요 없음)",
     gCt(GS, "post_contact") === "(없음)");

  /* G-5 ⚠️⚠️⚠️ **업체를 정지시키면 그 순간 상호가 빠져야** 합니다 —
     보기가 **읽을 때 다시** 상태를 봅니다. 글은 그대로 남고 상호만
     빠집니다 (업체가 정지됐다고 구직자의 지원까지 지우지 않습니다). */
  ok("G-5 관리자가 그 업체를 정지시킨다",
     allowed(as(ADM) + "select set_provider_state('" +
       j({ id:"flow-d", to:"suspended", why:"흐름 검사 — 정지 반영을 봅니다" }) +
       "'::jsonb)").yes);
  ok("  ⚠️⚠️⚠️ **그 순간 상호가 빠진다** (보기가 읽을 때 다시 봅니다)",
     gp("pro_name") === "(없음)", gp("pro_name"));
  ok("  ⚠️ 글 자체는 남는다 (상호만 빠집니다 — 지원을 지우지 않습니다)",
     gp("id::text") === GPID && gp("title") === "주말 캐디를 모십니다");
  ok("  ⚠️ 정지되면 업체 카드에서도 빠진다 (0038 이 listed 를 내립니다)",
     psql(anon + "select count(*)::text from v_provider_card where id='flow-d'") === "0");

  /* ════════════════════════════════════════════════════════════════
     ══ 시나리오 H — 중고 직거래: 올리기 → 문의 → 받아들이기 → 연락처
     ⚠️⚠️⚠️ **작업 기억이 "새 흐름을 만드는 날 이 줄을 이어 붙이세요"
     라고 적어 두고, 0046~0048 을 만들며 안 붙여서 조인 · 커뮤니티 ·
     인력이 한동안 이 파일에 하나도 없었습니다.** 0056 은 그날 바로
     붙입니다 — 업체가 0곳이어도 되는 **넷째** 길입니다.
     ⚠️ 토막으로 재면 안 드러나는 자리: 앞 단계의 결과가 다음 단계의
     입력입니다 (매물 id → 문의 id → 연락처 보기).
     ════════════════════════════════════════════════════════════════ */
  console.log("\n══ 시나리오 H — 중고: 올리기 → 문의 → 받아들이기 → 연락처");
  const HS = psql("insert into auth.users (email) values ('fl-hsel@x.test') returning id");
  const HB = psql("insert into auth.users (email) values ('fl-hbuy@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + HS + "','customer','파는 분')," +
       "('" + HB + "','customer','사는 분') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  const HL = psql(as(HS) + "select open_listing('" +
    j({ sub:"us-driver", region:"seoul", title:"흐름 검사용 드라이버",
        body:"흐름 검사로 올리는 매물입니다", price:"300000", cond:"good",
        /* ⚠️ 0068 — 브랜드가 필수입니다 */
        brand:"타이틀리스트",
        contact:"010-7777-7777", agree_at:psql("select now()") }) + "'::jsonb)");
  ok("H-1 매물을 문으로 올린다", /^[0-9a-f-]{36}$/.test(HL), HL);
  /* ⚠️ 공개 목록은 **비로그인도** 봅니다 (크롤러 몫) — 그런데 연락처는
     칸이 아예 없습니다 (보기의 where 절이 아니라 **칸 목록**이 자물쇠) */
  ok("  비로그인도 공개 목록에서 본다",
     psql(anon + "select count(*)::text from v_listing_open where id='" + HL + "'") === "1");
  ok("  ⚠️ 공개 목록에 연락처 칸이 **아예 없다**",
     psql("select count(*)::text from information_schema.columns " +
          "where table_name='v_listing_open' and column_name='contact'") === "0");

  const HA = psql(as(HB) + "select ask_listing('" +
    j({ listing_id:HL, msg:"사고 싶습니다", contact:"010-8888-8888",
        agree_at:psql("select now()") }) + "'::jsonb)");
  ok("H-2 사겠다고 문의한다", /^[0-9a-f-]{36}$/.test(HA), HA);
  /* ⚠️ 알림이 **파는 분에게** 붙습니다 (받는 사람 눈으로 읽습니다) */
  ok("  파는 분에게 알림이 붙는다",
     psql(as(HS) + "select count(*)::text from notice " +
          "where kind='listingask' and obj_id='" + HL + "'") === "1");

  ok("H-3 받아들이면 상태가 바뀐다",
     psql(as(HS) + "select move_listingask('" +
       j({ id:HA, state:"accepted" }) + "'::jsonb)") === "accepted");
  /* ⚠️⚠️⚠️ **여기가 이 흐름의 알맹이입니다** — 받아들여도 연락처는
     둘 다 비어 있어야 합니다 (제17조 제2항 · 별도 동의). */
  ok("⚠️⚠️⚠️ H-4 **받아들이기만으로는 연락처가 둘 다 비어 있다**",
     psql(as(HB) + "select coalesce(seller_contact,'(없음)') || '/' || " +
          "coalesce(buyer_contact,'(없음)') from v_listing_contact " +
          "where ask_id='" + HA + "'") === "(없음)/(없음)");
  psql(as(HS) + "select share_listingcontact('" +
    j({ id:HA, on:true, agree_at:psql("select now()") }) + "'::jsonb)");
  ok("  H-5 파는 분이 열면 **그쪽 것만** 간다",
     psql(as(HB) + "select coalesce(seller_contact,'(없음)') || '/' || " +
          "coalesce(buyer_contact,'(없음)') from v_listing_contact " +
          "where ask_id='" + HA + "'") === "010-7777-7777/(없음)");
  psql(as(HS) + "select share_listingcontact('" + j({ id:HA, on:false }) + "'::jsonb)");
  ok("  H-6 다시 닫으면 **그 즉시** 빠진다 (철회권)",
     psql(as(HB) + "select coalesce(seller_contact,'(없음)') from v_listing_contact " +
          "where ask_id='" + HA + "'") === "(없음)");

  /* ⚠️ 운영자가 가리면 공개 목록에서 빠지고, 글쓴이가 못 되돌립니다 */
  ok("H-7 운영자가 까닭을 적고 가린다",
     psql(as(ADM) + "select move_listing('" +
       j({ id:HL, state:"hidden", why:"흐름 검사로 가립니다" }) + "'::jsonb)") === "hidden");
  ok("  가려지면 공개 목록에서 빠진다",
     psql(anon + "select count(*)::text from v_listing_open where id='" + HL + "'") === "0");


  /* ════════════════════════════════════════════════════════════════
     ══ 시나리오 J — 예약중 (0069): 예약 → 문의 → 되돌리기 → 사진 차례 → 찜
     ⚠️⚠️⚠️ **상태 하나를 더하면 문 넷과 보기 둘이 같이 막힙니다.**
     0056 의 `edit_listing` · `ask_listing` · `close_listing` 과 0068 의
     사진 문 둘, 그리고 공개 보기 둘이 전부 `state = 'open'` 을
     요구했습니다 — 토막으로 재면 "예약중으로 바뀐다" 만 보고 통과하고,
     **그 뒤로 아무것도 못 한다**는 것은 한 줄로 눌러 봐야 드러납니다.
     ⚠️ 앞 단계의 결과가 다음 단계의 입력입니다 (매물 id → 예약중 →
     문의 id → 되돌리기 → 사진 id 셋 → 차례 → 찜).
     ════════════════════════════════════════════════════════════════ */
  console.log("\n══ 시나리오 J — 예약중: 예약 → 문의 → 되돌리기 → 사진 차례 → 찜");
  const JS2 = psql("insert into auth.users (email) values ('fl-jsel@x.test') returning id");
  const JB2 = psql("insert into auth.users (email) values ('fl-jbuy@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + JS2 + "','customer','예약 파는 분')," +
       "('" + JB2 + "','customer','예약 사는 분') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  const JL = psql(as(JS2) + "select open_listing('" + j({
    sub:"us-putter", region:"busan", title:"퍼터 팝니다 (흐름 검사)",
    body:"흐름 검사로 올린 매물입니다", price:120000, cond:"like",
    brand:"오디세이", model:"화이트핫 OG", ship:true,
    contact:"010-0000-0069", agree_at:NOW() }) + "'::jsonb)");
  ok("J-1 모델명과 함께 매물을 올린다", /^[0-9a-f-]{36}$/.test(JL), JL);
  ok("  ⚠️ 공개 보기가 **모델명**을 낸다",
     psql(anon + "select coalesce(model,'(없음)') from v_listing_open " +
          "where id='" + JL + "'") === "화이트핫 OG");
  /* ⚠️⚠️⚠️ **마스킹의 별 개수를 글자로 박지 않습니다.** 보기는
     `left(이름,1) || repeat('*', 길이-1)` 이라 **이름이 길면 별도
     늘어납니다** — 처음에 `예**` 로 박아 두었는데 이 씨앗의 성함은
     '예약 파는 분'(여섯 글자)이라 별이 다섯입니다. 0052 에서 `김**` 를
     박아 밟은 자리를 그대로 또 밟을 참이었습니다.
     ⚠️ 그래서 **뜻을 셋으로 갈라** 잽니다 — ① 첫 글자만 남는가
     ② 나머지가 전부 별인가 ③ **본이름이 한 글자도 안 나오는가**. */
  const JSEL = psql(anon + "select coalesce(seller,'(없음)') from v_listing_open " +
                    "where id='" + JL + "'");
  ok("  ⚠️ 가린 성함 ① **첫 글자만** 남는다", JSEL.slice(0, 1) === "예", JSEL);
  ok("  ⚠️ 가린 성함 ② 나머지가 **전부 별**이다",
     JSEL.length > 1 && JSEL.slice(1).replace(/\*/g, "") === "", JSEL);
  ok("  ⚠️⚠️ 가린 성함 ③ **본이름이 한 글자도 안 나온다**",
     JSEL.indexOf("약") < 0 && JSEL.indexOf("파는") < 0, JSEL);

  ok("J-2 파는 분이 **예약중**으로 둔다",
     psql(as(JS2) + "select close_listing('" +
       j({ id:JL, state:"reserved" }) + "'::jsonb)") === "reserved");
  /* ⚠️⚠️⚠️ **목록에 그대로 남아야** 합니다 — 빠지면 "팔렸다" 와 구분이
     없어지고 손님은 사라진 까닭을 알 수 없습니다 */
  ok("  ⚠️⚠️ 예약중도 **공개 목록에 남는다** (팔린 것과 다릅니다)",
     psql(anon + "select state from v_listing_open where id='" + JL + "'") === "reserved");

  /* ⚠️⚠️ **예약중에도 문의를 받습니다** — 앞의 거래가 깨질 수 있습니다 */
  const JA = psql(as(JB2) + "select ask_listing('" + j({
    listing_id:JL, msg:"앞 거래가 어그러지면 연락 주세요",
    contact:"010-0000-0070", agree_at:NOW() }) + "'::jsonb)");
  ok("J-3 예약중에도 **문의가 들어간다**", /^[0-9a-f-]{36}$/.test(JA), JA);
  /* ⚠️ 예약중에도 고칠 수 있어야 합니다 */
  ok("  예약중에도 **고칠 수 있다**",
     psql(as(JS2) + "select edit_listing('" +
       j({ id:JL, price:"99000" }) + "'::jsonb)") === "edited");

  /* ⚠️⚠️⚠️ **되돌리는 길이 있어야** 합니다 — 없으면 잘못 누른 분이
     매물을 다시 올려야 하고 **받아 둔 문의가 통째로 날아갑니다** */
  ok("J-4 **예약을 풀 수 있다** (막다른 길로 두지 않습니다)",
     psql(as(JS2) + "select close_listing('" +
       j({ id:JL, state:"open" }) + "'::jsonb)") === "open");
  ok("  풀고 나도 **문의가 그대로 있다** (다시 올리지 않아도 됩니다)",
     psql(as(JS2) + "select count(*)::text from listingask " +
          "where listing_id='" + JL + "'") === "1");

  /* ── 사진 차례 · 대표 ───────────────────────────────────────── */
  const JP1 = psql(as(JS2) + "select claim_listing_photo('" +
    j({ listing:JL, mime:"image/png", bytes:"1000" }) + "'::jsonb)->>'id'");
  const JP2 = psql(as(JS2) + "select claim_listing_photo('" +
    j({ listing:JL, mime:"image/png", bytes:"1000" }) + "'::jsonb)->>'id'");
  ok("J-5 사진 두 장을 붙인다",
     /^[0-9a-f-]{36}$/.test(JP1) && /^[0-9a-f-]{36}$/.test(JP2), JP1 + " / " + JP2);
  const TH1 = psql(anon + "select thumb from v_listing_open where id='" + JL + "'");
  ok("  대표가 **첫째**다",
     TH1 === psql("select path from listingphoto where id='" + JP1 + "'"), TH1);
  ok("J-6 차례를 바꾼다",
     psql(as(JS2) + "select order_listing_photo('" +
       j({ listing:JL, ids:[JP2, JP1] }) + "'::jsonb)") === "2");
  /* ⚠️⚠️ **보기가 따라 바뀌어야** 합니다 — 안 바뀌면 파는 분이 정한
     대표와 카드에 보이는 사진이 다릅니다 */
  ok("  ⚠️⚠️ **대표가 따라 바뀐다** (보기가 ord 로 고릅니다)",
     psql(anon + "select thumb from v_listing_open where id='" + JL + "'") ===
     psql("select path from listingphoto where id='" + JP2 + "'"));
  /* ⚠️ 공개 사진 보기도 그 차례를 내야 합니다 — 안 내면 상세 슬라이드가
     올린 차례로 돌아 **대표와 첫 장이 다릅니다** */
  ok("  ⚠️ 공개 사진 보기가 **그 차례로** 낸다 (상세 슬라이드가 씁니다)",
     psql(anon + "select string_agg(id::text, ',' order by ord) " +
          "from v_listing_photo_public where listing_id='" + JL + "'") ===
     JP2 + "," + JP1);

  /* ── 찜 ─────────────────────────────────────────────────────── */
  ok("J-7 사는 분이 찜한다",
     psql(as(JB2) + "select fav_listing('" + j({ id:JL, on:true }) + "'::jsonb)") === "t");
  ok("  관심상품 보기에 **제 것이 보인다**",
     psql(as(JB2) + "select count(*)::text from v_listing_fav where id='" + JL + "'") === "1");
  /* ⚠️⚠️ **파는 분도 · 운영자도 못 읽습니다** — 누가 무엇에 찜했는지는
     행동 기록입니다 (0059 의 조회 기록과 같은 결) */
  ok("  ⚠️⚠️ **파는 분도 못 읽는다** (누가 찜했는지는 행동 기록입니다)",
     psql(as(JS2) + "select count(*)::text from listingfav " +
          "where listing_id='" + JL + "'") === "0");
  ok("  ⚠️⚠️ **운영자도 못 읽는다**",
     psql(as(ADM) + "select count(*)::text from listingfav " +
          "where listing_id='" + JL + "'") === "0");
  /* ⚠️⚠️ **팔려도 관심상품에 남습니다** — `v_listing_open` 을 썼으면
     팔리는 순간 조용히 사라졌습니다 */
  psql(as(JS2) + "select close_listing('" + j({ id:JL, state:"done" }) + "'::jsonb)");
  ok("J-8 ⚠️⚠️ **팔려도 관심상품에 남고 상태를 낸다**",
     psql(as(JB2) + "select state from v_listing_fav where id='" + JL + "'") === "done");
  ok("  ⚠️ 그런데 **공개 목록에서는 빠진다** (더 살 수 없습니다)",
     psql(anon + "select count(*)::text from v_listing_open where id='" + JL + "'") === "0");

  /* ════════════════════════════════════════════════════════════════
     ══ 시나리오 I — 구합니다 (0061): 올리기 → 답 → 받아들이기 → 연락처
     ⚠️⚠️⚠️ **업체가 0곳이어도 되는 다섯째**입니다. 토막으로 재면
     앞 단계의 결과가 다음 단계의 입력인 자리가 영원히 안 드러납니다.
     ⚠️ 여기서는 **업체가 상호로 답하는** 갈래까지 한 줄로 밟습니다 —
     그 갈래만 `provider` 의 상태를 읽을 때 다시 봅니다.
     ════════════════════════════════════════════════════════════════ */
  console.log("\n══ 시나리오 I — 구합니다: 올리기 → 답 → 받아들이기 → 연락처");
  const IA = psql("insert into auth.users (email) values ('fl-iask@x.test') returning id");
  const IH = psql("insert into auth.users (email) values ('fl-ihlp@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + IA + "','customer','구하는 분')," +
       "('" + IH + "','customer','답하는 분') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  const IW = psql(as(IA) + "select open_wanted('" +
    j({ cat:"lesson", sub:"ls-solo", region:"seoul",
        title:"흐름 검사용 레슨 구합니다",
        body:"흐름 검사로 올리는 구합니다 글입니다", budget:"200000",
        when_txt:"주말 오전", contact:"010-5555-5555",
        agree_at:psql("select now()") }) + "'::jsonb)");
  ok("I-1 구합니다 글을 문으로 올린다", /^[0-9a-f-]{36}$/.test(IW), IW);
  /* ⚠️ 공개 목록은 **비로그인도** 봅니다 (업체가 찾아 들어오는 길) —
     그런데 연락처는 칸이 **아예 없습니다** (칸 목록이 자물쇠입니다) */
  ok("  비로그인도 공개 목록에서 본다",
     psql(anon + "select count(*)::text from v_wanted_open where id='" + IW + "'") === "1");
  ok("  ⚠️ 공개 목록에 연락처 칸이 **아예 없다**",
     psql("select count(*)::text from information_schema.columns " +
          "where table_name='v_wanted_open' and column_name='contact'") === "0");

  const IR = psql(as(IH) + "select reply_wanted('" +
    j({ w_id:IW, body:"주말 오전 자리가 있습니다", contact:"010-6666-6666",
        agree_at:psql("select now()") }) + "'::jsonb)");
  ok("I-2 회원이 답을 단다", /^[0-9a-f-]{36}$/.test(IR), IR);
  /* ⚠️ 알림이 **올리신 분에게** 붙습니다 (받는 사람 눈으로 읽습니다) */
  ok("  올리신 분에게 알림이 붙는다",
     psql(as(IA) + "select count(*)::text from notice " +
          "where kind='wantedreply' and obj_id='" + IW + "'") === "1");
  /* ⚠️⚠️ **답 수는 공개지만 답 내용은 아닙니다** — 공개 보기가 세어서
     냅니다 (칸에 저장하면 누군가 그 칸에 고쳐 적습니다 · 절대 규칙 1) */
  ok("  ⚠️ 답 수가 공개 목록에서 **세어져** 나온다",
     psql(anon + "select reply_n::text from v_wanted_open where id='" + IW + "'") === "1");

  psql(as(IA) + "select move_wantedreply('" + j({ id:IR, to:"accepted" }) + "'::jsonb)");
  ok("I-3 올리신 분이 받아들인다",
     psql(as(IA) + "select state from wantedreply where id='" + IR + "'") === "accepted");
  /* ⚠️⚠️⚠️ **여기가 이 흐름의 알맹이입니다** — 받아들여도 연락처는
     둘 다 비어 있어야 합니다 (제17조 제2항 · 별도 동의).
     ⚠️ 0046 · 0056 과 **같은 꼴**이고, 0060(예약)과는 **다릅니다** —
     거기는 업체가 전화를 해야 성립하므로 신청하는 자리에서 받습니다. */
  ok("⚠️⚠️⚠️ I-4 **받아들이기만으로는 연락처가 둘 다 비어 있다**",
     psql(as(IH) + "select coalesce(owner_contact,'(없음)') || '/' || " +
          "coalesce(helper_contact,'(없음)') from v_wanted_contact " +
          "where reply_id='" + IR + "'") === "(없음)/(없음)");
  psql(as(IA) + "select share_wantedcontact('" +
    j({ id:IR, on:true, agree_at:psql("select now()") }) + "'::jsonb)");
  ok("  I-5 올리신 분이 열면 **그쪽 것만** 간다 (맞바꾸기를 강요하지 않습니다)",
     psql(as(IH) + "select coalesce(owner_contact,'(없음)') || '/' || " +
          "coalesce(helper_contact,'(없음)') from v_wanted_contact " +
          "where reply_id='" + IR + "'") === "010-5555-5555/(없음)");
  psql(as(IA) + "select share_wantedcontact('" + j({ id:IR, on:false }) + "'::jsonb)");
  ok("  I-6 다시 닫으면 **그 즉시** 빠진다 (철회권 · 닫을 때는 동의를 안 받습니다)",
     psql(as(IH) + "select coalesce(owner_contact,'(없음)') from v_wanted_contact " +
          "where reply_id='" + IR + "'") === "(없음)");

  /* ⚠️⚠️ **업체가 상호로 답하는 갈래** — 그 갈래만 보기가 읽을 때 다시
     상태를 봅니다 (정지되면 그 순간 상호가 빠집니다 · 0048 · 0055 와
     같은 셋). 흐름으로 밟지 않으면 그 자리가 영원히 안 드러납니다. */
  const IW2 = psql(as(IA) + "select open_wanted('" +
    j({ cat:"lesson", region:"seoul", title:"업체 답을 받아 볼 글",
        body:"업체가 상호로 답해 보는 자리입니다", contact:"010-5555-5555",
        agree_at:psql("select now()") }) + "'::jsonb)");
  /* ⚠️⚠️ **시나리오 G 가 `flow-d` 를 정지된 채로 두고 끝납니다**(G-5 가
     "정지시키면 그 순간 상호가 빠지는가" 를 재는 자리입니다). 그대로
     쓰면 `reply_wanted` 가 "지금은 업체 이름으로 답할 수 없습니다" 로
     거절합니다 — **앞 검사가 만든 상태를 뒤 검사가 물려받는** 그
     자리이고, 코드가 아니라 제 검사가 틀린 것이었습니다. 되살려 놓고
     시작합니다 (0038 은 정지할 때 `listed` 도 같이 끕니다). */
  psql(as(ADM) + "select set_provider_state('" +
    j({ id:"flow-d", to:"approved" }) + "'::jsonb)");
  psql(as(ADM) + "select approve_provider('flow-d', true)");
  ok("  ⚠️ G 가 정지시킨 업체를 **되살려 놓고** 시작한다",
     psql("select state || '/' || listed::text from provider where id='flow-d'")
       === "approved/true",
     psql("select state || '/' || listed::text from provider where id='flow-d'"));
  const IPR = psql(as(GP) + "select reply_wanted('" +
    j({ w_id:IW2, as_pro:"flow-d", body:"저희 센터에서 잡아 드릴 수 있습니다",
        contact:"010-9999-9999", agree_at:psql("select now()") }) + "'::jsonb)");
  ok("I-7 업체 담당자가 **상호로** 답한다", /^[0-9a-f-]{36}$/.test(IPR), IPR);
  ok("  올리신 분에게 **상호가 보인다** (누가 답했는지 알아야 고릅니다)",
     psql(as(IA) + "select coalesce(pro_name,'(없음)') from v_wanted_reply " +
          "where id='" + IPR + "'") === "흐름 골프아카데미2",
     psql(as(IA) + "select coalesce(pro_name,'(없음)') from v_wanted_reply " +
          "where id='" + IPR + "'"));
  psql(as(ADM) + "select set_provider_state('" +
    j({ id:"flow-d", to:"suspended", why:"흐름 검사로 정지시켜 봅니다" }) + "'::jsonb)");
  ok("⚠️⚠️ I-8 업체가 **정지되면 그 순간 상호가 빠진다** (읽을 때 다시 봅니다)",
     psql(as(IA) + "select coalesce(pro_name,'(없음)') from v_wanted_reply " +
          "where id='" + IPR + "'") === "(없음)");
  ok("  ⚠️ 그 자리에 **가린 성함**이 대신 나온다 (빈 자리로 두지 않습니다)",
     psql(as(IA) + "select coalesce(who,'(없음)') from v_wanted_reply " +
          "where id='" + IPR + "'").indexOf("*") > 0);
  /* ⚠️ 바꾼 값을 **그 자리에서 되돌려** 놓습니다 — 앞 검사가 만든 상태를
     뒤 검사가 물려받는 자리입니다 (0057 에서 겪었습니다) */
  psql(as(ADM) + "select set_provider_state('" +
    j({ id:"flow-d", to:"approved" }) + "'::jsonb)");
  psql(as(ADM) + "select approve_provider('flow-d', true)");
  ok("  ⚠️ 바꾼 값을 **되돌려 놓았다**",
     psql("select state || '/' || listed::text from provider where id='flow-d'")
       === "approved/true",
     psql("select state || '/' || listed::text from provider where id='flow-d'"));

  /* ⚠️ 운영자가 가리면 공개 목록에서 빠지고, 글쓴이가 못 되돌립니다 */
  ok("I-9 운영자가 까닭을 적고 가린다",
     psql(as(ADM) + "select move_wanted('" +
       j({ id:IW, why:"흐름 검사로 가립니다" }) + "'::jsonb)") === "hidden");
  ok("  가려지면 공개 목록에서 빠진다",
     psql(anon + "select count(*)::text from v_wanted_open where id='" + IW + "'") === "0");

  /* ⚠️ 끝으로 — 이 셋이 만든 알림에 **손님이 적은 글이 한 글자도** 없어야
     합니다 (알림은 **우리가 쓴 말**이고, 담으면 한 벌 더 복사됩니다). */
  /* ⚠️⚠️ **운영자로 읽으면 안 됩니다** — 0050 은 운영자 정책을 일부러
     안 두었습니다(남의 알림을 읽을 까닭이 없습니다). 그래서 운영자는
     0줄이고, 그걸로 재면 **빈 글자를 보고 "안 샌다" 로 통과**합니다 —
     아무것도 안 잡는 검사입니다. **받은 사람 눈으로** 읽습니다. */
  const nLeak = [EH, EG, FA, GP, GS, HS, HB, IA, IH].map(u => psql(as(u) +
    "select coalesce(string_agg(title || ' ' || link, ' '), '') from notice")).join(" ");
  ok("⚠️ 알림을 **받은 사람 눈으로** 읽었다 (0줄을 보고 통과하지 않습니다)",
     nLeak.replace(/\s/g, "").length > 0, nLeak.slice(0, 120));
  ok("⚠️⚠️ 알림에 **손님이 적은 글 · 연락처가 한 글자도 없다**",
     nLeak.indexOf("010-7") < 0 && nLeak.indexOf("같이 치고 싶습니다") < 0 &&
     nLeak.indexOf("캐디 경력") < 0 &&
     /* ⚠️ 0056 — 중고 쪽 글자도 같이 봅니다 */
     nLeak.indexOf("사고 싶습니다") < 0 && nLeak.indexOf("010-8888") < 0 &&
     /* ⚠️ 0061 — 구합니다 쪽 글자도 같이 봅니다 */
     nLeak.indexOf("010-5555") < 0 && nLeak.indexOf("010-6666") < 0 &&
     nLeak.indexOf("주말 오전 자리가 있습니다") < 0,
     nLeak.slice(0, 200));

  /* ⚠️ 끝내며 — 이 검사가 만든 업체는 **검사용으로** 되돌립니다 */
  psql("select become('" + ADM + "'); update provider set is_test = true " +
       "where id in ('flow-a','flow-c','flow-d')");
  /* ⚠️ 세는 자리에 갯수를 박지 않습니다 — **제 씨앗만** 훑습니다 */
  ok("⚠️ 검사가 만든 업체를 **검사용으로 되돌렸다** (운영 자료와 섞이지 않습니다)",
     psql("select count(*)::text from provider where id in " +
          "('flow-a','flow-b','flow-c','flow-d') and is_test = false") === "0");
};

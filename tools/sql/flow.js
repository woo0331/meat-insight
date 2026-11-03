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
  /* ⚠️ 끝내며 — 이 검사가 만든 업체는 **검사용으로** 되돌립니다 */
  psql("select become('" + ADM + "'); update provider set is_test = true " +
       "where id in ('flow-a','flow-c')");
  ok("⚠️ 검사가 만든 업체를 **검사용으로 되돌렸다** (운영 자료와 섞이지 않습니다)",
     psql("select count(*)::text from provider where id in ('flow-a','flow-b','flow-c') " +
          "and is_test = false") === "0");
};

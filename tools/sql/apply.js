/* ════════════════════════════════════════════════════════════════════
   0027 입점 신청 문을 **눌러 봅니다**

   ⚠️⚠️ **경계값 바로 아래와 바로 위를 둘 다** 넣습니다. 막히는 것만
   보면 "너무 넓게 막는 고장" 을 못 잡습니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  const body = (o) => {
    const d = Object.assign({
      company:"테스트 골프연습장", name:"홍길동", tel:"010-1234-5678",
      services:["rg-in"], agree_at:"now"
    }, o);
    const j = JSON.stringify(d).replace(/'/g, "''");
    /* agree_at 은 SQL 쪽에서 now() 를 넣어야 시계가 맞습니다 */
    return "select make_apply(jsonb_set('" + j + "'::jsonb, '{agree_at}', " +
           (d.agree_at === "now" ? "to_jsonb(now())"
            /* ⚠️ 괄호를 꼭 감쌉니다 — "now() + interval '10 minutes'::timestamptz"
               는 형변환이 interval 에 붙어 터집니다. 코드가 아니라
               **검사가 틀린** 자리였습니다. */
            : "to_jsonb((" + d.agree_at + ")::timestamptz)") + "))";
  };
  const asAnon = "set role anon; ";
  const back   = "; reset role; ";

  console.log("\n── 0027 입점 신청 — 빈 칸은 각각 다른 말로 거절합니다");
  let d = denied(body({ company:"  " }));
  ok("상호가 비면 막힌다", d.no && /상호를 적어/.test(d.why), d.why);
  d = denied(body({ name:"" }));
  ok("성함이 비면 막힌다 (다른 말)", d.no && /성함을 적어/.test(d.why), d.why);
  d = denied(body({ tel:"" }));
  ok("연락처가 비면 막힌다 (또 다른 말)", d.no && /연락처를 적어/.test(d.why), d.why);
  d = denied(body({ services:[] }));
  ok("하시는 일을 안 고르면 막힌다", d.no && /하나 이상 골라/.test(d.why), d.why);
  d = denied(body({ company:"가".repeat(81) }));
  ok("상호가 너무 길면 막힌다", d.no && /너무 깁니다/.test(d.why), d.why);

  console.log("\n── 연락처 자릿수 — 경계 바로 아래 · 위");
  ok("여덟 자리는 막힌다",   denied(body({ tel:"0212345678".slice(0,8) })).no);
  ok("아홉 자리는 된다",     allowed(body({ tel:"021234567" })).yes);
  ok("열한 자리는 된다",     allowed(body({ tel:"01012345678" })).yes);
  ok("열두 자리는 막힌다",   denied(body({ tel:"010123456789" })).no);

  console.log("\n── 동의 시각");
  d = denied("select make_apply('{\"company\":\"가\",\"name\":\"나\",\"tel\":\"01011112222\"," +
             "\"services\":[\"rg-in\"]}'::jsonb)");
  ok("동의 시각이 없으면 막힌다", d.no && /동의가 필요합니다/.test(d.why), d.why);
  d = denied(body({ tel:"01011113333", agree_at:"now() + interval '10 minutes'" }));
  ok("미래의 동의는 막힌다 (다른 말)", d.no && /미래입니다/.test(d.why), d.why);
  d = denied(body({ tel:"01011114444", agree_at:"now() - interval '25 hours'" }));
  ok("하루 넘은 동의는 막힌다 (또 다른 말)", d.no && /오래되었습니다/.test(d.why), d.why);
  ok("4분 뒤 시계 어긋남은 봐준다 (너무 좁게 막지 않았다)",
     allowed(body({ tel:"01011115555", agree_at:"now() + interval '4 minutes'" })).yes);
  ok("23시간 전 동의는 된다 (경계 바로 안쪽)",
     allowed(body({ tel:"01011116666", agree_at:"now() - interval '23 hours'" })).yes);

  console.log("\n── 중복 신청 (지시서 5번 A)");
  const dupTel = "01099998888";
  ok("처음 한 번은 들어간다", allowed(body({ tel:dupTel })).yes);
  d = denied(body({ tel:dupTel }));
  ok("10분 안에 같은 번호로 또 넣으면 막힌다",
     d.no && /방금 같은 번호로/.test(d.why), d.why);
  ok("번호 모양이 달라도(하이픈) 같은 번호로 봅니다",
     denied(body({ tel:"010-9999-8888" })).no);
  /* 11분 전 것으로 만들어 두면 다시 받아야 합니다 — 너무 넓게 막지 않았는가 */
  psql("update provider_apply set created_at = now() - interval '11 minutes' " +
       "where regexp_replace(tel,'[^0-9]','','g') = '" + dupTel + "'");
  ok("11분이 지나면 다시 받는다", allowed(body({ tel:dupTel })).yes);

  console.log("\n── 신청번호");
  const no = psql("select no from provider_apply order by created_at desc limit 1");
  ok("신청번호가 GA + 서울 날짜 + 일련번호 꼴이다",
     /^GA\d{6}-\d{4}$/.test(no), no);
  /* ⚠️ Supabase 는 UTC 입니다. 서울 날짜를 안 쓰면 밤 9시 이후 신청이
     **다음 날 번호**를 답니다 — 눈으로는 안 보이는 어긋남입니다.
     코드와 같은 식으로 기대값을 적지 않도록, UTC 날짜와 **갈리는지**를 봅니다. */
  const seoul = psql("select to_char(now() at time zone 'Asia/Seoul','YYMMDD')");
  ok("번호의 날짜가 서울 날짜와 같다", no.slice(2, 8) === seoul, no + " vs " + seoul);
  ok("번호가 겹치지 않는다",
     psql("select (count(*) = count(distinct no))::text from provider_apply") === "true");

  console.log("\n── 누가 넣고 누가 읽는가");
  ok("로그인 없이(anon) 넣을 수 있다",
     allowed(asAnon + body({ tel:"01077776666" }).replace(/^select /, "select ") + back).yes);
  d = denied(asAnon + "select count(*) from provider_apply" + back);
  ok("anon 은 읽지 못한다", d.no && /permission denied/i.test(d.why), d.why);

  const U = psql("insert into auth.users (email) values ('ap@x.test') returning id");
  psql("insert into account (id, role, name) values ('" + U + "','customer','일반') " +
       "on conflict (id) do update set role = excluded.role");
  ok("일반 회원은 한 줄도 못 읽는다 (RLS)",
     psql("select become('" + U + "'); set role authenticated; " +
          "select count(*)::text from provider_apply" + back) === "0");
  d = denied("select become('" + U + "'); set role authenticated; " +
             "insert into provider_apply (no, company, name, tel, agree_at) " +
             "values ('X','가','나','010',now())" + back);
  ok("일반 회원이 직접 넣지 못한다 — 문으로만", d.no, d.why);

  console.log("\n── 감사 기록에 성함 · 연락처가 남지 않는가");
  ok("신청마다 감사 기록이 남는다",
     Number(psql("select count(*)::text from audit_log where obj='provider_apply'")) > 0);
  ok("⚠️ 감사 기록에 연락처가 **없다**",
     psql("select count(*)::text from audit_log where obj='provider_apply' " +
          "and (data::text like '%9999%' or why like '%9999%')") === "0");
  ok("⚠️ 감사 기록에 성함이 **없다**",
     psql("select count(*)::text from audit_log where obj='provider_apply' " +
          "and (data::text like '%홍길동%' or why like '%홍길동%')") === "0");
  ok("감사 기록이 신청번호로 찾아진다",
     psql("select count(*)::text from audit_log where obj='provider_apply' " +
          "and obj_id = '" + no + "'") === "1");
};

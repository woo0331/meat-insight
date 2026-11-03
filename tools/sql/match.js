/* ════════════════════════════════════════════════════════════════════
   0029 매칭 요청 문을 **눌러 봅니다** (2차 지시서 §5)

   ⚠️⚠️ **제3자 제공 동의가 여기서 들어가지 않는지**를 꼭 봅니다.
   들어가면 누구에게 줄지 모르는 상태의 뭉뚱그린 동의가 되어
   개인정보보호법 제17조 제2항 위반입니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  const body = (o) => {
    const d = Object.assign({
      name:"김손님", tel:"010-5555-1111", services:["ls-solo"], cat:"lesson",
      agree_at:"now"
    }, o);
    const j = JSON.stringify(d).replace(/'/g, "''");
    return "select make_request(jsonb_set('" + j + "'::jsonb, '{agree_at}', " +
           (d.agree_at === "now" ? "to_jsonb(now())"
            : "to_jsonb((" + d.agree_at + ")::timestamptz)") + "))";
  };
  const asAnon = "set role anon; ";
  const back   = "; reset role; ";

  console.log("\n── 0029 매칭 요청 — 빈 칸은 각각 다른 말로 거절합니다");
  let d = denied(body({ name:"  " }));
  ok("성함이 비면 막힌다", d.no && /성함을 적어/.test(d.why), d.why);
  d = denied(body({ tel:"", name:"가" }));
  ok("연락처가 비면 막힌다 (다른 말)", d.no && /연락처를 적어/.test(d.why), d.why);
  d = denied(body({ services:[], tel:"01055552222" }));
  ok("서비스를 안 고르면 막힌다 (또 다른 말)", d.no && /하나 이상 골라/.test(d.why), d.why);
  d = denied(body({ services:Array.from({length:11}, (_,i)=>"ls-solo"+i), tel:"01055553333" }));
  ok("열 개를 넘기면 막힌다", d.no && /너무 많습니다/.test(d.why), d.why);

  console.log("\n── 예산 — 0 은 값입니다");
  ok("예산 0 원은 된다", allowed(body({ tel:"01066660000", budget_min:0, budget_max:0 })).yes);
  ok("아래가 위보다 크면 막힌다",
     denied(body({ tel:"01066661111", budget_min:500000, budget_max:100000 })).no);
  ok("음수는 막힌다", denied(body({ tel:"01066662222", budget_min:-1 })).no);
  ok("아래만 적어도 된다", allowed(body({ tel:"01066663333", budget_min:100000 })).yes);

  console.log("\n── 동의");
  d = denied("select make_request('{\"name\":\"가\",\"tel\":\"01077770000\"," +
             "\"services\":[\"ls-solo\"]}'::jsonb)");
  ok("수집 · 이용 동의가 없으면 막힌다", d.no && /동의가 필요합니다/.test(d.why), d.why);
  ok("미래의 동의는 막힌다 (다른 말)",
     denied(body({ tel:"01077771111", agree_at:"now() + interval '10 minutes'" })).no);

  /* ⚠️⚠️ 여기가 핵심입니다 */
  const no1 = psql(body({ tel:"01088880000" }));
  ok("신청번호가 SW-XXXX-XXXX 꼴이다 (0005 의 claim 이 찾는 꼴)",
     /^SW-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/.test(no1), no1);
  ok("⚠️ 제3자 제공 동의(agree3rd_at)가 **비어 있다**",
     psql("select (agree3rd_at is null)::text from request where no='" + no1 + "'") === "true");
  ok("수집 · 이용 동의는 들어가 있다",
     psql("select (agree_at is not null)::text from request where no='" + no1 + "'") === "true");
  ok("고른 서비스가 request_item 에 들어간다",
     psql("select service_id from request_item ri join request r on r.id=ri.request_id " +
          "where r.no='" + no1 + "'") === "ls-solo");
  ok("분류가 들어간다", psql("select cat from request where no='" + no1 + "'") === "lesson");
  ok("side 가 golf 다", psql("select side from request where no='" + no1 + "'") === "golf");

  console.log("\n── 두 번 넣는 것을 두 겹으로 막습니다");
  const idem = "test-idem-0001";
  const a1 = psql(body({ tel:"01099990000", idem: idem }));
  const a2 = psql(body({ tel:"01099990000", idem: idem }));
  ok("같은 idem 으로 두 번 눌러도 **같은 번호**가 돌아온다", a1 === a2, a1 + " / " + a2);
  ok("줄이 하나만 생긴다",
     psql("select count(*)::text from request where idem='" + idem + "'") === "1");
  d = denied(body({ tel:"010-9999-0000", idem:"다른값" }));
  ok("10분 안에 같은 번호로 또 넣으면 막힌다 (하이픈이 달라도)",
     d.no && /방금 같은 번호로/.test(d.why), d.why);

  console.log("\n── 누가 넣고 누가 읽는가");
  ok("로그인 없이(anon) 넣을 수 있다",
     allowed(asAnon + body({ tel:"01012120000" }) + back).yes);
  d = denied(asAnon + "select count(*) from request" + back);
  ok("anon 은 읽지 못한다", d.no && /permission denied/i.test(d.why), d.why);

  console.log("\n── 감사 기록");
  ok("요청마다 감사 기록이 남는다",
     Number(psql("select count(*)::text from audit_log where obj='request' and to_state='new'")) > 0);
  ok("⚠️ 감사 기록에 연락처가 **없다**",
     psql("select count(*)::text from audit_log where obj='request' " +
          "and (data::text like '%8888%' or why like '%8888%')") === "0");
  ok("⚠️ 감사 기록에 성함이 **없다**",
     psql("select count(*)::text from audit_log where obj='request' " +
          "and (data::text like '%김손님%' or why like '%김손님%')") === "0");
};

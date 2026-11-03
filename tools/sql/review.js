/* ════════════════════════════════════════════════════════════════════
   후기 · 평점을 눌러 봅니다 (0037)

   ⚠️⚠️ **여기서 재는 것은 "누가 쓸 수 있나" 입니다.** 아무나 쓸 수
   있으면 후기가 아니고 광고입니다 — 경쟁사가 별 하나를 깔고, 업체가
   제 식구로 별 다섯을 깝니다. 0037 은 **우리 DB 로 확인되는 둘** 중
   하나를 요구합니다 (견적을 골랐거나 · 만났거나). 그 둘을 하나씩
   만들어 보고, 없을 때 **막히는지**를 봅니다.

   ⚠️⚠️ **자물쇠가 겹치면 검사를 속입니다.** 거절하는 **말까지** 맞춰
   보고, 자물쇠마다 다른 말로 거절하는지 봅니다 (같은 말이면 어느
   자물쇠가 막았는지 알 수 없고, 엉뚱한 까닭으로 통과합니다).

   ⚠️⚠️ **보기(view)는 RLS 를 지나지 않습니다** — 그 where 절이
   자물쇠입니다. 가린 후기 · 검사용 업체 · 공개 안 한 업체가 anon 에게
   새는지 눌러 봅니다 (0032 에서 실제로 샜던 자리와 같은 꼴입니다).

   ⚠️⚠️ **표에는 보기에 없는 칸이 둘 있습니다** (by_user · request_id).
   그 둘이 anon · 남에게 새지 않는지 따로 봅니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0037 후기 — 씨앗");
  const CUS = psql("insert into auth.users (email) values ('rv-cus@x.test') returning id");
  const OTH = psql("insert into auth.users (email) values ('rv-oth@x.test') returning id");
  const PRO = psql("insert into auth.users (email) values ('rv-pro@x.test') returning id");
  const PR2 = psql("insert into auth.users (email) values ('rv-pro2@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('rv-adm@x.test') returning id");

  psql("insert into provider (id, name, listed, is_test) values " +
       "('rv-a','[검사용] 후기 가', true, true)," +
       "('rv-b','[검사용] 후기 나', true, true)," +
       "('rv-hid','[검사용] 안 보이는 곳', false, true) " +
       "on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + CUS + "','customer','김후기', null)," +
       "('" + OTH + "','customer','남', null)," +
       "('" + PRO + "','provider','가 사람','rv-a')," +
       "('" + PR2 + "','provider','나 사람','rv-b')," +
       "('" + ADM + "','admin','후기 관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");
  psql("update provider set assignable = true where id in ('rv-a','rv-b')");

  const as = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";

  /* 요청 둘 — ① 견적을 고른 건 ② 아무 일도 없는 건 */
  const R1 = psql("insert into request (no, side, tel, name, agree_at, state, user_id) " +
    "values ('RV-0001','golf','010-5555-0001','김후기', now(), 'quoted','" +
    CUS + "') returning id::text");
  const R2 = psql("insert into request (no, side, tel, name, agree_at, state, user_id) " +
    "values ('RV-0002','golf','010-5555-0002','김후기', now(), 'consult','" +
    CUS + "') returning id::text");
  psql("insert into assignment (request_id, provider_id, agree3rd_at, state) values " +
       "('" + R1 + "','rv-a', now(), 'accepted')," +
       "('" + R1 + "','rv-b', now(), 'accepted')," +
       "('" + R2 + "','rv-a', now(), 'accepted') on conflict do nothing");

  const body = "생각보다 꼼꼼하게 봐 주셨습니다. 다음에도 맡기겠습니다.";
  const wr = (u, rid, pid, rate, b) =>
    as(u) + "select write_review(jsonb_build_object('request','" + rid +
    "','provider','" + pid + "','rating'," + rate + ",'body','" +
    String(b === undefined ? body : b).replace(/'/g, "''") + "'))";

  console.log("\n── 겪지 않았으면 못 씁니다 (0037 의 핵심 자물쇠)");
  const none = denied(wr(CUS, R2, "rv-a", 5));
  ok("아무 일도 없는 건에는 후기를 못 쓴다", none.no, none.why);
  ok("  그 거절이 **고르시거나 만나신 뒤**라고 말한다",
     none.no && none.why.indexOf("고르시거나") >= 0, none.why);

  const notMine = denied(wr(OTH, R1, "rv-a", 5));
  ok("남의 요청에는 못 쓴다", notMine.no, notMine.why);
  ok("  그 거절은 **다른 말**이다 (자물쇠가 갈립니다)",
     none.no && notMine.no && none.why !== notMine.why,
     none.why + " / " + notMine.why);

  console.log("\n── 견적을 고르면 열립니다");
  /* ⚠️ 견적을 **문으로** 넣습니다 — 표에 직접 넣으면 0008 의 자물쇠를
     건너뛰고, 그러면 여기서 통과한 것이 운영에서는 안 됩니다. */
  /* ⚠️ submit_quote 는 (요청 id, 꾸러미) 로 받습니다 (0008) */
  psql(as(PRO) + "select submit_quote('" + R1 +
       "','{\"amount\":900000,\"scope\":\"클럽 피팅 일체\"}'::jsonb)");
  psql(as(CUS) + "select choose_quote('" + R1 + "','rv-a')");
  ok("씨앗: 견적이 고른 상태다",
     psql("select state from quote where request_id='" + R1 + "' and provider_id='rv-a'")
       === "chosen");

  const id1 = psql(wr(CUS, R1, "rv-a", 5));
  ok("고른 업체에는 후기가 열린다", /^[0-9a-f-]{36}$/.test(id1), id1);

  /* ⚠️⚠️ 고르지 **않은** 업체에는 여전히 막힙니다 — 한 요청에 업체가
     둘 배정되었을 때 아무 업체에나 쓸 수 있으면 안 됩니다. */
  const other = denied(wr(CUS, R1, "rv-b", 1));
  ok("같은 요청의 **다른** 업체에는 못 쓴다 (고르지도 만나지도 않았습니다)",
     other.no, other.why);

  console.log("\n── 만나기만 해도 열립니다 (견적을 안 골랐어도)");
  psql(as(PRO) + "select set_appointment(jsonb_build_object('request','" + R2 +
       "','at', now() - interval '2 hours','kind','visit'))");
  const AP = psql("select id::text from appointment where request_id='" + R2 + "'");
  psql(as(PRO) + "select move_appointment(jsonb_build_object('id','" + AP + "','to','done'))");
  const id2 = psql(wr(CUS, R2, "rv-a", 4));
  ok("만난 업체에는 후기가 열린다", /^[0-9a-f-]{36}$/.test(id2), id2);

  console.log("\n── 별점의 경계값");
  /* ⚠️⚠️ 0 과 6 은 다들 막아 두고 사고는 그 옆에서 납니다 — 1 과 5 가
     **되는지**도 같이 봅니다 (너무 넓게 막는 것도 고장입니다). */
  const zero = denied(wr(CUS, R1, "rv-a", 0));
  ok("별점 0 은 막힌다", zero.no, zero.why);
  const six = denied(wr(CUS, R1, "rv-a", 6));
  ok("별점 6 은 막힌다", six.no, six.why);
  ok("  그 거절이 **1에서 5**라고 말한다 (check 제약 글이 아니다)",
     zero.no && zero.why.indexOf("1에서 5") >= 0 &&
     zero.why.indexOf("constraint") < 0, zero.why);
  ok("별점 1 은 된다 (경계 바로 안쪽)", allowed(wr(CUS, R1, "rv-a", 1)).yes);
  ok("별점 5 는 된다", allowed(wr(CUS, R1, "rv-a", 5)).yes);
  const noRate = denied(as(CUS) + "select write_review(jsonb_build_object('request','" +
    R1 + "','provider','rv-a','body','" + body + "'))");
  ok("별점을 안 적으면 막힌다", noRate.no, noRate.why);
  const words = denied(as(CUS) + "select write_review(jsonb_build_object('request','" +
    R1 + "','provider','rv-a','rating','최고','body','" + body + "'))");
  ok("별점에 글자를 적으면 **사람 말로** 거절한다",
     words.no && words.why.indexOf("invalid input") < 0, words.why);

  console.log("\n── 글자 수의 경계값");
  const nine = denied(wr(CUS, R1, "rv-a", 5, "아홉글자야요"));
  ok("열 글자가 안 되면 막힌다", nine.no, nine.why);
  const ten = allowed(wr(CUS, R1, "rv-a", 5, "열글자가되었습니다"));
  /* ⚠️ "열글자가되었습니다" 는 아홉 글자입니다 — 손으로 세어 적습니다
     (코드와 같은 식으로 적으면 아무것도 안 잡습니다). */
  ok("아홉 글자도 막힌다 (손으로 세었습니다)", !ten.yes, ten.why);
  ok("열 글자는 된다", allowed(wr(CUS, R1, "rv-a", 5, "열글자가되었습니다다")).yes);
  const long = denied(wr(CUS, R1, "rv-a", 5, "가".repeat(1001)));
  ok("천 글자를 넘으면 막힌다", long.no, long.why);
  ok("천 글자는 된다", allowed(wr(CUS, R1, "rv-a", 5, "가".repeat(1000))).yes);

  console.log("\n── 한 요청 × 한 업체 = 한 줄");
  ok("여러 번 써도 줄이 **하나**다 (평균을 만들 수 없습니다)",
     psql("select count(*)::text from review where request_id='" + R1 +
          "' and provider_id='rv-a'") === "1");
  ok("  마지막에 적은 것이 남는다",
     psql("select char_length(body)::text from review where request_id='" + R1 +
          "' and provider_id='rv-a'") === "1000");
  ok("고친 기록이 남는다 (문이 하나라서)",
     Number(psql("select count(*)::text from audit_log where obj='review'")) >= 2);
  /* ⚠️⚠️ 감사 기록은 오래 남고 보는 사람도 넓습니다 */
  ok("⚠️ 감사 기록에 **후기 본문이 안 실린다**",
     psql("select count(*)::text from audit_log where obj='review' " +
          "and coalesce(data::text,'') like '%꼼꼼하게%'") === "0");

  console.log("\n── 자기 업체에는 못 씁니다");
  /* 업체 사람이 손님으로 요청을 넣고 자기 업체를 고른 꼴을 만듭니다 */
  const R3 = psql("insert into request (no, side, tel, name, agree_at, state, user_id) " +
    "values ('RV-0003','golf','010-5555-0003','가 사람', now(), 'quoted','" +
    PRO + "') returning id::text");
  psql("insert into assignment (request_id, provider_id, agree3rd_at, state) " +
       "values ('" + R3 + "','rv-a', now(), 'accepted') on conflict do nothing");
  psql("insert into quote (request_id, provider_id, amount, scope, state) values " +
       "('" + R3 + "','rv-a', 100000,'자기 것','chosen')");
  const self = denied(wr(PRO, R3, "rv-a", 5));
  ok("자기 업체에는 후기를 못 쓴다 (제 식구 별 다섯)", self.no, self.why);
  ok("  그 거절이 **자기 업체**라고 말한다",
     self.no && self.why.indexOf("자기 업체") >= 0, self.why);

  console.log("\n── 표를 직접 고치는 길이 없는가");
  const ins = denied(as(CUS) + "insert into review (request_id, provider_id, rating, body) " +
    "values ('" + R1 + "','rv-b',5,'직접 넣어 본 후기입니다')");
  ok("표에 직접 넣는 길이 없다 (문 셋만 엽니다)", ins.no, ins.why);
  const upd = allowed(as(CUS) + "update review set rating = 5 where request_id='" + R2 + "'");
  /* ⚠️⚠️ RLS 는 UPDATE 에서 에러를 안 냅니다 — 0줄이 바뀌고 성공으로
     돌아옵니다. **값**을 봅니다. */
  ok("표를 직접 고치지 못한다 (별점이 그대로다)",
     psql("select rating::text from review where request_id='" + R2 + "'") === "4",
     upd.why || upd.out);
  const del = allowed(as(CUS) + "delete from review where request_id='" + R2 + "'");
  ok("지우는 길이 없다",
     psql("select count(*)::text from review where request_id='" + R2 + "'") === "1",
     del.why || del.out);

  console.log("\n── 업체의 답변");
  const RV2 = psql("select id::text from review where request_id='" + R2 + "'");
  const rep = (u, id, t) => as(u) + "select reply_review(jsonb_build_object('id','" +
    id + "','reply','" + String(t).replace(/'/g, "''") + "'))";
  const byCus = denied(rep(CUS, RV2, "제가 답해 봅니다"));
  ok("손님은 답변을 못 쓴다", byCus.no, byCus.why);
  const byOther = denied(rep(PR2, RV2, "남의 후기에 답해 봅니다"));
  ok("다른 업체는 답변을 못 쓴다", byOther.no, byOther.why);
  ok("  그 거절이 **우리 업체가 아니다**라고 말한다",
     byOther.no && byOther.why.indexOf("우리 업체") >= 0, byOther.why);
  ok("그 업체는 답변을 쓴다", allowed(rep(PRO, RV2, "찾아 주셔서 고맙습니다")).yes);
  ok("  답변이 들어갔다",
     psql("select reply from review where id='" + RV2 + "'") === "찾아 주셔서 고맙습니다");
  const empty = denied(rep(PRO, RV2, "   "));
  ok("빈 답변은 막힌다", empty.no, empty.why);
  /* ⚠️⚠️ **업체가 별점을 바꿀 길이 없어야 합니다** — 있으면 후기가
     아닙니다. 문에 그 칸이 없는지 값으로 봅니다. */
  psql(as(PRO) + "select reply_review(jsonb_build_object('id','" + RV2 +
       "','reply','답변을 고쳤습니다','rating','5'))");
  ok("⚠️ 답변 문에 별점을 실어 보내도 **별점이 안 바뀐다**",
     psql("select rating::text from review where id='" + RV2 + "'") === "4");

  console.log("\n── 운영자가 가립니다 (지우지 않습니다)");
  const hide = (u, id, to, w) => as(u) + "select hide_review(jsonb_build_object('id','" +
    id + "','to','" + to + "'" + (w ? ",'why','" + w + "'" : "") + "))";
  const byPro = denied(hide(PRO, RV2, "hide", "마음에 안 듭니다"));
  ok("업체는 후기를 못 가린다 (가리면 후기가 광고입니다)", byPro.no, byPro.why);
  const noWhy = denied(hide(ADM, RV2, "hide"));
  ok("까닭 없이는 못 가린다", noWhy.no, noWhy.why);
  ok("  그 둘은 **다른 말**로 거절한다",
     byPro.no && noWhy.no && byPro.why !== noWhy.why, byPro.why + " / " + noWhy.why);
  ok("운영자는 까닭을 적고 가린다",
     allowed(hide(ADM, RV2, "hide", "욕설이 들어 있습니다")).yes);
  ok("  지우지 않는다 — 줄이 그대로 있다",
     psql("select count(*)::text from review where id='" + RV2 + "'") === "1");
  ok("  가린 까닭이 남는다",
     psql("select hidden_why from review where id='" + RV2 + "'") === "욕설이 들어 있습니다");
  const onHidden = denied(rep(PRO, RV2, "가려진 것에 답해 봅니다"));
  ok("가려진 후기에는 답변할 수 없다", onHidden.no, onHidden.why);
  const editHidden = denied(wr(CUS, R2, "rv-a", 5));
  ok("⚠️ 손님도 가려진 후기를 고쳐 되살릴 수 없다", editHidden.no, editHidden.why);
  ok("  그 거절이 **운영자가 가렸다**고 말한다",
     editHidden.no && editHidden.why.indexOf("가린") >= 0, editHidden.why);
  ok("다시 내면 가림이 풀린다", allowed(hide(ADM, RV2, "show")).yes);
  ok("  까닭이 지워진다 (지난 가림이 새 줄에 붙어 있으면 안 됩니다)",
     psql("select coalesce(hidden_why,'비었음') from review where id='" + RV2 + "'")
       === "비었음");
  const twice = denied(hide(ADM, RV2, "show"));
  ok("두 번 다시 내면 **다른 말로** 거절한다", twice.no, twice.why);

  console.log("\n── 누가 보는가 (표)");
  ok("쓴 사람은 본다",
     psql(as(CUS) + "select count(*)::text from review where id='" + RV2 + "'") === "1");
  ok("그 업체는 본다",
     psql(as(PRO) + "select count(*)::text from review where id='" + RV2 + "'") === "1");
  ok("운영자는 본다",
     psql(as(ADM) + "select count(*)::text from review where id='" + RV2 + "'") === "1");
  /* ⚠️⚠️⚠️ **표에는 보기에 없는 칸이 둘 있습니다** — by_user 와
     request_id. 후기 글은 공개지만 **누가 썼는지는 공개가 아닙니다.**
     그래서 남이 표를 읽으면 0줄이어야 합니다 ("가리지 않은 것은
     로그인한 아무나" 정책을 두면 이 검사가 떨어집니다). */
  ok("⚠️ 남은 표를 읽어도 **0줄**이다 (by_user · request_id 가 있습니다)",
     psql(as(OTH) + "select count(*)::text from review") === "0");
  ok("다른 업체도 표에서는 못 본다",
     psql(as(PR2) + "select count(*)::text from review") === "0");
  ok("비로그인은 표 자체가 안 열린다 (GRANT)",
     denied(anon + "select count(*) from review").no);

  console.log("\n── 공개 보기 — ⚠️ where 절이 자물쇠입니다");
  /* 참 업체 하나를 세워 공개 보기로 나오는지 봅니다 */
  psql("insert into provider (id, name, listed, is_test) values " +
       "('rv-real','후기 참 업체', true, false) on conflict (id) do nothing");
  const PR3 = psql("insert into auth.users (email) values ('rv-pro3@x.test') returning id");
  /* ⚠️⚠️ **계정을 먼저 이어야** 배정 가능이 켜집니다 (0018 의 트리거).
     차례를 바꾸면 "계정이 이어져 있지 않습니다" 에서 멈춥니다 —
     seed.js 가 사장님께 같은 차례를 안내하는 그 자물쇠입니다. */
  psql("insert into account (id, role, name, provider_id) values ('" + PR3 +
       "','provider','참 사람','rv-real') on conflict (id) do update set " +
       "role = excluded.role, provider_id = excluded.provider_id");
  psql("update provider set assignable = true where id='rv-real'");
  const R4 = psql("insert into request (no, side, tel, name, agree_at, state, user_id) " +
    "values ('RV-0004','golf','010-5555-0004','김후기', now(), 'quoted','" +
    CUS + "') returning id::text");
  psql("insert into assignment (request_id, provider_id, agree3rd_at, state) " +
       "values ('" + R4 + "','rv-real', now(), 'accepted') on conflict do nothing");
  psql(as(PR3) + "select submit_quote('" + R4 +
       "','{\"amount\":500000,\"scope\":\"레슨 10회\"}'::jsonb)");
  psql(as(CUS) + "select choose_quote('" + R4 + "','rv-real')");
  psql(wr(CUS, R4, "rv-real", 4, "설명이 아주 꼼꼼하셨습니다. 추천합니다."));

  ok("공개 보기가 참 업체의 후기를 낸다",
     psql(anon + "select count(*)::text from v_review_public " +
          "where provider_id='rv-real'") === "1");
  /* ⚠️⚠️ 작성자 — "김후기" 가 "김***" 으로 나와야 합니다. 손으로 적습니다
     (코드와 같은 식으로 적으면 식을 바꿔도 답이 같아 아무것도 안 잡습니다). */
  /* ⚠️ "김후기" 는 **세 글자**입니다 — 성 한 글자 + 별표 둘 = 김**.
     처음에 별표를 셋으로 적어 이 검사가 떨어졌습니다 (손으로 세는
     까닭입니다 — 코드와 같은 식으로 적었으면 아무것도 안 잡습니다). */
  ok("⚠️ 작성자가 **성 한 글자 + 별표**로 나온다 (김후기 → 김**)",
     psql(anon + "select who from v_review_public where provider_id='rv-real'")
       === "김**");
  ok("⚠️ 공개 보기에 by_user 칸이 **없다**",
     denied(anon + "select by_user from v_review_public").no);
  ok("⚠️ 공개 보기에 request_id 칸이 **없다**",
     denied(anon + "select request_id from v_review_public").no);
  ok("⚠️⚠️ **검사용 업체의 후기가 공개 보기에 안 나온다**",
     psql(anon + "select count(*)::text from v_review_public " +
          "where provider_id in ('rv-a','rv-b')") === "0");

  /* ⚠️⚠️ 가린 후기가 새는지 — 참 업체의 것을 가려 보고 봅니다
     (검사용 업체로 누르면 is_test 가 먼저 막아서 **엉뚱한 까닭으로
     통과**합니다. 자물쇠를 하나씩 눌러야 합니다). */
  const RV4 = psql("select id::text from review where request_id='" + R4 + "'");
  psql(hide(ADM, RV4, "hide", "같은 글을 여러 번 올리셨습니다"));
  ok("⚠️⚠️ **가린 후기가 공개 보기에 안 나온다** (참 업체로 눌렀습니다)",
     psql(anon + "select count(*)::text from v_review_public " +
          "where provider_id='rv-real'") === "0");
  psql(hide(ADM, RV4, "show"));
  ok("  다시 내면 공개 보기에 돌아온다",
     psql(anon + "select count(*)::text from v_review_public " +
          "where provider_id='rv-real'") === "1");

  /* ⚠️⚠️ 공개를 끈 업체 — listed = false 를 보기가 거르는지.
     ⚠️ 공개 여부는 **관리자만** 바꿉니다 (0030 의 provider_guard) —
     그냥 update 하면 그 트리거가 거절합니다. 관리자가 되어 바꿉니다. */
  /* ⚠️ `set role authenticated` 로는 못 바꿉니다 — 0001 의 칸 단위
     GRANT 에 `listed` 가 아예 없습니다 (업체가 스스로 공개를 켤 수
     없게). 그래서 **자물쇠가 둘**입니다: 칸 GRANT 와 트리거. 여기서는
     관리자로 보이게만 하고 역할은 바꾸지 않습니다 (트리거를 누릅니다). */
  psql("select become('" + ADM + "'); update provider set listed = false " +
       "where id='rv-real'");
  ok("⚠️ 공개를 끈 업체의 후기가 안 나온다 (보기의 listed)",
     psql(anon + "select count(*)::text from v_review_public " +
          "where provider_id='rv-real'") === "0");
  psql("select become('" + ADM + "'); update provider set listed = true " +
       "where id='rv-real'");

  console.log("\n── 평균을 **세어** 보면 (저장된 값이 없습니다)");
  /* ⚠️⚠️⚠️ **평점 칸이 아예 없어야 합니다.** 칸이 있으면 누군가 거기에
     4.9 를 적습니다 (절대 규칙 1). 이름으로 훑습니다. */
  ok("⚠️ provider 표에 평점 · 후기 수 칸이 **하나도 없다**",
     psql("select count(*)::text from information_schema.columns " +
          "where table_name='provider' and (column_name like '%rating%' " +
          "or column_name like '%score%' or column_name like '%review%' " +
          "or column_name like '%star%')") === "0");
  ok("⚠️ 집계를 담아 둔 표도 **없다**",
     psql("select count(*)::text from information_schema.tables " +
          "where table_schema='public' and (table_name like '%rating%' " +
          "or table_name like 'review_stat%')") === "0");
  /* 참 업체에 둘째 후기를 넣어 평균이 **줄에서** 나오는지 봅니다 */
  const CU2 = psql("insert into auth.users (email) values ('rv-cus2@x.test') returning id");
  psql("insert into account (id, role, name) values ('" + CU2 +
       "','customer','이둘째') on conflict (id) do update set " +
       "role = excluded.role, name = excluded.name");
  const R5 = psql("insert into request (no, side, tel, name, agree_at, state, user_id) " +
    "values ('RV-0005','golf','010-5555-0005','이둘째', now(), 'quoted','" +
    CU2 + "') returning id::text");
  psql("insert into assignment (request_id, provider_id, agree3rd_at, state) " +
       "values ('" + R5 + "','rv-real', now(), 'accepted') on conflict do nothing");
  psql(as(PR3) + "select submit_quote('" + R5 +
       "','{\"amount\":300000,\"scope\":\"레슨 5회\"}'::jsonb)");
  psql(as(CU2) + "select choose_quote('" + R5 + "','rv-real')");
  psql(wr(CU2, R5, "rv-real", 5, "처음 배우는데도 편하게 알려 주셨습니다."));
  /* ⚠️ 기대값을 **손으로** 적습니다 — 4 와 5 의 평균은 4.5 입니다 */
  ok("⚠️ 평균은 줄에서 나온다 (4점과 5점 → 4.5)",
     psql(anon + "select round(avg(rating), 1)::text from v_review_public " +
          "where provider_id='rv-real'") === "4.5");
  ok("  건수도 줄에서 나온다 (2건)",
     psql(anon + "select count(*)::text from v_review_public " +
          "where provider_id='rv-real'") === "2");
  ok("  둘째 분의 성함도 마스킹된다",
     psql(anon + "select who from v_review_public where provider_id='rv-real' " +
          "and rating = 5") === "이**");

  console.log("\n── 가린 후기는 평균에서 빠집니다");
  const RV5 = psql("select id::text from review where request_id='" + R5 + "'");
  psql(hide(ADM, RV5, "hide", "같은 분이 여러 번 올리셨습니다"));
  ok("⚠️ 가린 뒤 평균이 4.0 으로 내려간다 (가린 것이 안 섞입니다)",
     psql(anon + "select round(avg(rating), 1)::text from v_review_public " +
          "where provider_id='rv-real'") === "4.0");
  psql(hide(ADM, RV5, "show"));

  console.log("\n── 끝난 뒤에 업체를 지우면");
  /* ⚠️ 업체를 지우면 그 후기도 같이 갑니다 (on delete cascade) — 남겨
     두면 아무 업체에도 안 붙은 후기가 평균에 섞입니다. */
  psql("insert into provider (id, name, listed, is_test) values " +
       "('rv-gone','[검사용] 지울 곳', true, true) on conflict (id) do nothing");
  const before = psql("select count(*)::text from review");
  psql("delete from provider where id='rv-gone'");
  ok("업체를 지워도 남의 후기는 안 지워진다",
     psql("select count(*)::text from review") === before, before);
};

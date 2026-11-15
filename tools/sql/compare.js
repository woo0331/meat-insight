/* 비교견적 — 눌러 봅니다 (0082 · 2026-11-15)
   ════════════════════════════════════════════════════════════════════
   ⚠️⚠️⚠️ **이 검사가 지키는 것 — 지금 흐름은 업체 한 곳만 끝까지 갑니다.**
   `answer_assignment` 가 `move_state(accepted)` 를 부르므로 두 번째 업체가
   수락하면 「같은 상태입니다」로 통째로 되돌아갑니다. 비교견적은 업체 여럿이
   각자 답하고 각자 견적을 내야 하므로 **새 문**이 맡고, 그 문들이
     ① 로그인한 분 · 분류 셋 · 맞는 서비스만 받는가
     ② 운영자만 · **분야와 지역이 맞는** 승인 업체만 배정하는가 (서버가 봅니다)
     ③ 업체 둘이 **각자** 참여하고 각자 견적을 내는가
     ④ 업체가 **남의 견적**을 못 읽는가
     ⑤ 연락처가 **표에서는 아무도 못 읽고**, 보기로는 본인 · 운영자 · 고른 업체만
        읽는가 (화면이 가리는 것으로 끝내지 않습니다)
     ⑥ 손님이 고를 때 **동의 없이는** 안 되고 · 고른 업체에만 연락처가 가고 ·
        유효기간이 지난 견적은 못 고르는가
   를 **자물쇠마다 다른 말로** 잽니다.
   ⚠️ 문으로 넣고 문으로 잽니다 — 표에 바로 넣으면 자물쇠를 통째로 지나칩니다. */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;
  console.log("\n════ 비교견적 (0082) ════");

  const U = e => psql("insert into auth.users (email) values ('" + e + "@x.test') returning id");
  const CUS = U("cq-cus"), CUS2 = U("cq-cus2"), STF = U("cq-stf");
  const PA = U("cq-pa"), PB = U("cq-pb"), PC = U("cq-pc"), PD = U("cq-pd");

  psql("insert into provider (id, name, listed, state, is_test, subs, regions) values " +
       "('cq-a','비교레슨A', true, 'approved', false, '{ls-solo,ls-group}', '{seoul}')," +
       "('cq-b','비교레슨B', true, 'approved', false, '{ls-solo}', '{seoul,gyeonggi}')," +
       "('cq-c','부산레슨', true, 'approved', false, '{ls-solo}', '{busan}')," +
       "('cq-d','피팅서울', true, 'approved', false, '{ft-iron}', '{seoul}') " +
       "on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + CUS + "','customer','비교손님', null)," +
       "('" + CUS2 + "','customer','다른손님', null)," +
       "('" + STF + "','staff','직원', null)," +
       "('" + PA + "','provider','에이', 'cq-a')," +
       "('" + PB + "','provider','비', 'cq-b')," +
       "('" + PC + "','provider','씨', 'cq-c')," +
       "('" + PD + "','provider','디', 'cq-d') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name, " +
       "provider_id = excluded.provider_id");
  psql("update provider set assignable = true where id in ('cq-a','cq-b','cq-c','cq-d')");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const back = "reset role; select become(null);";
  const last = s => String(s).split("\n").pop().trim();
  const why  = r => r.why || "";

  const req = (who, tel, extra) => (who ? as(who) : anon) +
    "select make_compare_request(jsonb_build_object(" +
    "'name','비교손님','tel','" + tel + "','region','seoul','cat','lesson'," +
    "'services', jsonb_build_array('ls-solo'), 'agree_at', now()::text," +
    "'detail', jsonb_build_object('goal','입문','style','개인','when','평일 저녁')" +
    (extra || "") + "));" + back;

  /* ── ① 요청 ─────────────────────────────────────────────────── */
  console.log("\n── ① 비교 요청은 로그인한 분 · 분류 셋 · 맞는 서비스만");
  const a0 = denied(req(null, "010-7000-0001"));
  ok("비로그인은 거절 — 문 자체가 비로그인에게 안 열려 있다 (내 정보에서 비교해야 합니다)",
     a0.no && /permission denied for function make_compare_request/.test(why(a0)), why(a0));
  const badSvc = denied(as(CUS) + "select make_compare_request(jsonb_build_object(" +
    "'name','x','tel','010-7000-0002','cat','lesson','services', jsonb_build_array('ft-iron')," +
    "'agree_at', now()::text));" + back);
  ok("레슨 요청에 피팅 서비스를 섞으면 거절", badSvc.no && /고를 수 없는 서비스/.test(why(badSvc)), why(badSvc));
  const badCat = denied(as(CUS) + "select make_compare_request(jsonb_build_object(" +
    "'name','x','tel','010-7000-0003','cat','matchup','services', jsonb_build_array('ls-solo')," +
    "'agree_at', now()::text));" + back);
  ok("비교견적을 받지 않는 분류는 거절", badCat.no && /받는 분야가 아닙니다/.test(why(badCat)), why(badCat));
  const badDet = denied(as(CUS) + "select make_compare_request(jsonb_build_object(" +
    "'name','x','tel','010-7000-0004','cat','lesson','services', jsonb_build_array('ls-solo')," +
    "'agree_at', now()::text, 'detail', jsonb_build_object('goal', 3)));" + back);
  ok("조건 꾸러미에 글자가 아닌 값이 오면 거절", badDet.no && /조건을 다시/.test(why(badDet)), why(badDet));
  const usedOk = allowed(as(CUS2) + "select make_compare_request(jsonb_build_object(" +
    "'name','y','tel','010-7000-0005','cat','used','services', jsonb_build_array('us-buyquote')," +
    "'agree_at', now()::text, 'detail', jsonb_build_object('brand','타이틀리스트')));" + back);
  ok("중고는 **매입 견적** 하나만 받는다 (개인 매물과 섞지 않습니다)", usedOk.yes, why(usedOk));
  const usedBad = denied(as(CUS2) + "select make_compare_request(jsonb_build_object(" +
    "'name','y','tel','010-7000-0006','cat','used','services', jsonb_build_array('us-consign')," +
    "'agree_at', now()::text));" + back);
  ok("  위탁판매는 비교견적이 아니다", usedBad.no, why(usedBad));

  const no = last(psql(req(CUS, "010-7000-0101")));
  ok("로그인한 손님은 넣을 수 있다 (접수번호)", /^SW-/.test(no), no);
  const RID = psql("select id from request where no = '" + no + "'");
  ok("  그 줄이 비교 요청이고 조건이 담겼다",
     psql("select compare::text || '|' || (detail->>'goal') from request where id = '" + RID + "'") === "true|입문",
     psql("select compare::text || '|' || coalesce(detail::text,'') from request where id = '" + RID + "'"));
  const again = denied(req(CUS, "010-7000-0101", ",'idem','cq-idem-1'"));
  ok("같은 번호로 10분 안에 또 넣으면 make_request 의 자물쇠가 그대로 막는다 (중복 요청)",
     again.no && /방금 같은 번호/.test(why(again)), why(again));
  ok("  그래서 줄은 하나뿐", psql("select count(*) from request where compare and tel_key like '%70000101'") === "1",
     psql("select count(*) from request where compare and tel_key like '%70000101'"));

  /* ── ⑤ 연락처는 표에서 못 읽는다 ─────────────────────────────── */
  console.log("\n── ⑤ 연락처 — 표에서는 아무도 · 보기로는 본인 · 운영자 · 고른 업체만");
  const telT = denied(as(CUS) + "select tel from request where id = '" + RID + "';" + back);
  ok("본인도 **표에서** tel 을 못 읽는다 (칸 권한)", telT.no && /permission denied/.test(why(telT)), why(telT));
  const nonContact = allowed(as(CUS) + "select no from request where id = '" + RID + "';" + back);
  ok("  연락처 아닌 칸은 그대로 읽힌다", nonContact.yes && last(nonContact.out) === no, why(nonContact));
  const cnt = (who) => last(psql(as(who) + "select count(*) from v_request_contact where id = '" + RID + "';" + back));
  ok("본인은 보기로 연락처를 읽는다", cnt(CUS) === "1", cnt(CUS));
  ok("다른 손님은 0줄", cnt(CUS2) === "0", cnt(CUS2));
  ok("직원은 읽는다 (배정 · 상담 연결)", cnt(STF) === "1", cnt(STF));
  ok("배정 전 업체는 0줄", cnt(PA) === "0", cnt(PA));

  /* ── ② 배정 ─────────────────────────────────────────────────── */
  console.log("\n── ② 운영자만 · 분야와 지역이 맞는 승인 업체만 배정");
  const asg = (who, pv) => (who ? as(who) : anon) +
    "select assign_more(jsonb_build_object('request','" + RID + "','provider','" + pv + "'));" + back;
  const c1 = denied(asg(CUS, "cq-a"));
  ok("손님은 배정 못 한다", c1.no && /운영자만/.test(why(c1)), why(c1));
  ok("직원이 A 를 배정", allowed(asg(STF, "cq-a")).yes);
  ok("직원이 B 도 배정 (**업체 여럿**)", allowed(asg(STF, "cq-b")).yes);
  const rgBad = denied(asg(STF, "cq-c"));
  ok("영업 지역이 다르면 서버가 거절", rgBad.no && /영업 지역/.test(why(rgBad)), why(rgBad));
  const catBad = denied(asg(STF, "cq-d"));
  ok("분야가 다르면 서버가 거절", catBad.no && /분야/.test(why(catBad)), why(catBad));
  const dup = denied(asg(STF, "cq-a"));
  ok("같은 업체를 두 번 배정하면 거절", dup.no && /이미 배정/.test(why(dup)), why(dup));
  ok("  요청은 배정 상태로", psql("select state from request where id = '" + RID + "'") === "assigned");
  ok("  배정은 **연락처를 넘기지 않는** 배정이다 (blind · 동의 시각 비어 있음)",
     psql("select count(*) from assignment where request_id = '" + RID +
          "' and blind and agree3rd_at is null") === "2");
  ok("배정받은 업체는 요청 내용(조건)을 읽는다",
     last(psql(as(PA) + "select detail->>'goal' from request where id = '" + RID + "';" + back)) === "입문");
  ok("  그러나 연락처는 0줄 (고르기 전)", cnt(PA) === "0", cnt(PA));
  const pcRead = last(psql(as(PC) + "select count(*) from request where id = '" + RID + "';" + back));
  ok("배정 안 된 업체는 요청 줄도 0줄", pcRead === "0", pcRead);

  /* ── ③ 각자 참여 · 각자 견적 ─────────────────────────────────── */
  console.log("\n── ③ 업체 둘이 **각자** 참여하고 각자 견적을 낸다");
  const ans = (who, yes) => as(who) + "select answer_compare(jsonb_build_object('request','" + RID +
    "','yes'," + yes + "));" + back;
  const qPre = denied(as(PA) + "select submit_compare_quote(jsonb_build_object('request','" + RID +
    "','kind','estimate','amount',400000,'scope','8회','validTo',(kst_today()+7)::text));" + back);
  ok("참여 전에는 견적을 못 낸다", qPre.no && /참여를 먼저/.test(why(qPre)), why(qPre));
  ok("A 참여", allowed(ans(PA, "true")).yes);
  const bOk = allowed(ans(PB, "true"));
  ok("⚠️⚠️ B 도 참여 (옛 흐름에서는 여기서 「같은 상태」로 되돌아갔습니다)", bOk.yes, why(bOk));
  const reAns = denied(ans(PA, "false"));
  ok("이미 답한 것을 또 답하면 거절", reAns.no && /이미 답하셨습니다/.test(why(reAns)), why(reAns));
  const notMine = denied(ans(PC, "true"));
  ok("배정 안 된 업체는 답 못 한다", notMine.no && /배정되지 않았습니다/.test(why(notMine)), why(notMine));

  const sub = (who, kind, amt, valid, terms) => as(who) +
    "select submit_compare_quote(jsonb_build_object('request','" + RID + "','kind','" + kind +
    "','amount'," + amt + ",'scope','레슨 8회 · 회당 50분','validTo','" + valid + "'" +
    (terms ? ",'terms'," + terms : "") + "));" + back;
  const today = psql("select kst_today()::text");
  const plus7 = psql("select (kst_today()+7)::text");
  const past  = psql("select (kst_today()-1)::text");
  const noKind = denied(sub(PA, "", 400000, plus7));
  ok("예상인지 확정인지 안 고르면 거절", noKind.no && /예상 견적인지/.test(why(noKind)), why(noKind));
  const oldV = denied(sub(PA, "estimate", 400000, past));
  ok("유효기간이 지난 날짜면 거절", oldV.no && /이미 지났습니다/.test(why(oldV)), why(oldV));
  const badT = denied(sub(PA, "estimate", 400000, plus7, "jsonb_build_object('pro', jsonb_build_array(1))"));
  ok("비교 항목에 글자가 아닌 값이면 거절", badT.no && /비교 항목/.test(why(badT)), why(badT));
  ok("A 가 예상 견적을 낸다",
     allowed(sub(PA, "estimate", 400000, plus7, "jsonb_build_object('pro','김프로','count','8')")).yes);
  ok("B 가 확정 견적을 낸다 (오늘까지 유효)",
     allowed(sub(PB, "fixed", 380000, today, "jsonb_build_object('pro','이프로','count','8')")).yes);
  ok("  요청은 견적 도착 상태로", psql("select state from request where id = '" + RID + "'") === "quoted");

  /* ── ④ 남의 견적 ───────────────────────────────────────────── */
  console.log("\n── ④ 업체는 **남의 견적**을 못 읽는다");
  ok("A 는 제 견적 1줄만", last(psql(as(PA) + "select count(*) from quote where request_id = '" + RID + "';" + back)) === "1");
  ok("손님은 둘 다 본다", last(psql(as(CUS) + "select count(*) from quote where request_id = '" + RID + "';" + back)) === "2");
  ok("다른 손님은 0줄", last(psql(as(CUS2) + "select count(*) from quote where request_id = '" + RID + "';" + back)) === "0");

  /* ── ⑥ 고르기 ───────────────────────────────────────────────── */
  console.log("\n── ⑥ 상담 선택 — 동의 없이는 안 되고 · 고른 업체에만 연락처");
  const pick = (who, pv, share) => as(who) + "select pick_quote(jsonb_build_object('request','" + RID +
    "','provider','" + pv + "','share'," + share + "));" + back;
  const noShare = denied(pick(CUS, "cq-a", "false"));
  ok("연락처 제공 동의가 없으면 거절", noShare.no && /동의해 주셔야/.test(why(noShare)), why(noShare));
  const other = denied(pick(CUS2, "cq-a", "true"));
  ok("남의 요청은 못 고른다", other.no && /요청하신 분만/.test(why(other)), why(other));
  ok("손님이 A 를 고른다", allowed(pick(CUS, "cq-a", "true")).yes);
  ok("  A 는 고름 · B 는 다른 업체 선택됨",
     psql("select string_agg(provider_id || ':' || state, ',' order by provider_id) from quote where request_id = '" + RID + "'") === "cq-a:chosen,cq-b:passed");
  ok("  ⚠️⚠️ A 는 이제 연락처를 읽는다", cnt(PA) === "1", cnt(PA));
  ok("  ⚠️⚠️ B 는 여전히 0줄", cnt(PB) === "0", cnt(PB));
  ok("  요청 상태는 그대로 (상담 선택은 계약이 아닙니다)",
     psql("select state from request where id = '" + RID + "'") === "quoted");
  const twice = denied(pick(CUS, "cq-b", "true"));
  ok("또 고르면 거절", twice.no && /이미 상담할 업체/.test(why(twice)), why(twice));
  const bAgain = denied(sub(PB, "fixed", 300000, plus7));
  ok("떨어진 업체가 다시 내도 거절 (옛 문은 다시 열렸습니다)", bAgain.no && /다른 업체를 고르셨습니다/.test(why(bAgain)), why(bAgain));
  const more = denied(asg(STF, "cq-b"));
  ok("고른 뒤에는 업체를 더 배정하지 않는다", more.no, why(more));

  /* 연락처 동의 철회 → 그 순간 0줄 */
  const AID = psql("select id from assignment where request_id = '" + RID + "' and provider_id = 'cq-a'");
  ok("손님이 제공을 거두면", allowed(as(CUS) + "select revoke_third_party(jsonb_build_object('assignment','" +
     AID + "','why','상담 안 하기로'));" + back).yes);
  ok("  A 는 그 순간 연락처 0줄", cnt(PA) === "0", cnt(PA));

  /* 유효기간이 지난 견적은 못 고른다 — 두 번째 요청 */
  console.log("\n── 유효기간이 지난 견적");
  const no2 = last(psql(req(CUS, "010-7000-0202")));
  const R2 = psql("select id from request where no = '" + no2 + "'");
  psql(as(STF) + "select assign_more(jsonb_build_object('request','" + R2 + "','provider','cq-b'));" + back);
  psql(as(PB) + "select answer_compare(jsonb_build_object('request','" + R2 + "','yes',true));" + back);
  psql(as(PB) + "select submit_compare_quote(jsonb_build_object('request','" + R2 +
       "','kind','fixed','amount',1,'scope','x','validTo','" + today + "'));" + back);
  /* ⚠️ 시계를 돌리는 대신 표를 고칩니다 — 옛 문을 막는 표(compare_door_guard)를
     그 거래 안에서만 엽니다 */
  psql("begin; set local app.compare_door = '1'; " +
       "update quote set valid_to = kst_today() - 1 where request_id = '" + R2 + "'; commit;");
  const exp = denied(as(CUS) + "select pick_quote(jsonb_build_object('request','" + R2 +
    "','provider','cq-b','share',true));" + back);
  ok("만료된 견적은 고를 수 없다", exp.no && /유효기간이 지난/.test(why(exp)), why(exp));
  const dec = allowed(as(STF) + "select assign_more(jsonb_build_object('request','" + R2 + "','provider','cq-a'));" + back);
  ok("만료 뒤에도 운영자가 다른 업체를 더할 수 있다", dec.yes, why(dec));
  ok("거절한 업체가 있어도 다른 배정이 살아 있으면 요청은 그대로",
     allowed(as(PA) + "select answer_compare(jsonb_build_object('request','" + R2 + "','yes',false));" + back).yes &&
     psql("select state from request where id = '" + R2 + "'") === "quoted");

  /* 옛 흐름은 비교 요청을 안 받는다 */
  const oldWay = denied(as(PB) + "select submit_quote('" + RID + "'::uuid, '{\"amount\":1,\"scope\":\"x\"}'::jsonb, null);" + back);
  ok("비교 요청에 옛 견적 문을 부르면 막힌다 (뒤섞이지 않게)", oldWay.no, why(oldWay));
};

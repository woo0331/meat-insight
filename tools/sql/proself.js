/* ════════════════════════════════════════════════════════════════════
   프로 직접 등록 · 개인과 사업자 구분 — 눌러 봅니다 (0071)

   ⚠️⚠️⚠️ **왜 이 검사가 있는가 — 역할을 올리는 길이 둘이 되었습니다.**
   0043 머리말이 초대 코드를 "역할을 올리는 **유일한** 길" 이라고 적어
   두었습니다. 0071 이 `link_apply_account` 를 내면서 둘이 되므로, 그
   문이 **얼마나 좁은지**를 눌러서 재야 합니다.

   ⚠️⚠️⚠️ **그리고 이 검사가 참 고장을 하나 잡았습니다.** 0071 을 처음
   쓸 때 `account` 의 키를 `user_id` 로 적었습니다 — 실제 칸은 `id`
   입니다(0001). plpgsql 은 **부를 때까지** 칸 이름을 안 보므로
   마이그레이션은 멀쩡히 돌았고, `check-chains` 도 · 빌드도 전부 초록
   이었습니다. **문으로 눌러 보고서야** 드러났습니다 (작업 기억:
   "문이 있는 자리는 문으로 재세요").

   ⚠️⚠️ **여기서 재는 것 다섯** —
     ① 신청에 계정이 담기는가 (`make_apply` 가 `auth.uid()` 를 씁니다 —
        화면이 보낸 값을 안 믿습니다)
     ② 잇는 문이 **자물쇠마다 다른 말로** 거절하는가
        (운영자 아님 · 까닭 없음 · 없는 신청 · 비로그인 신청 ·
         등록 안 된 신청 · 운영자 계정 · 이미 이어짐)
     ③ 제대로 이으면 **역할과 업체가 같이** 바뀌고 기록이 남는가
        — ⚠️ 기록에 **성함 · 연락처가 안 담기는가**까지
     ④ 개인 · 사업자 구분을 **관리자만** 정하는가 (직원도 거절) ·
        같은 값으로 옮기면 거절하는가 · 되돌릴 수 있는가
     ⑤ 공개 보기에 `kind` · `place_name` · `lesson_goals` 가 **실제로
        있는가** (없으면 손님에게 영원히 안 보입니다 — 에러 한 줄 없이)
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n════ 프로 직접 등록 · 개인 · 사업자 구분 (0071) ════");

  const PRO = psql("insert into auth.users (email) values ('ps-pro@x.test') returning id");
  const PR2 = psql("insert into auth.users (email) values ('ps-pr2@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('ps-cus@x.test') returning id");
  const STF = psql("insert into auth.users (email) values ('ps-stf@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('ps-adm@x.test') returning id");

  /* ⚠️ 업체 두 곳 — 하나는 이을 자리, 하나는 "이미 다른 업체에 이어짐" 을
     재는 자리입니다. 이름을 `ps-` 로 가릅니다(검사끼리 id 가 부딪히면
     앞 검사가 만든 상태를 조용히 물려받습니다 — 0051 에서 겪은 자리). */
  psql("insert into provider (id, name, listed, state, is_test, subs) values " +
       "('ps-a','셀프프로골프', true, 'approved', false, '{ls-solo}')," +
       "('ps-b','다른골프', true, 'approved', false, '{ls-group}') " +
       "on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + PRO + "','customer','프로지원', null)," +
       "('" + PR2 + "','provider','이미업체','ps-b')," +
       "('" + CUS + "','customer','손님', null)," +
       "('" + STF + "','staff','직원', null)," +
       "('" + ADM + "','admin','관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const back = "reset role; select become(null);";

  /* 신청 하나를 **문으로** 넣습니다 — ⚠️ 표에 바로 넣으면 `by_user` 를
     제가 적는 것이 되어 "문이 auth.uid() 를 쓰는가" 를 못 잽니다. */
  const mk = (who, tel) =>
    (who ? as(who) : anon) +
    "select make_apply(jsonb_build_object(" +
    "'company','셀프프로골프','name','프로지원','tel','" + tel + "'," +
    "'services', jsonb_build_array('1:1 레슨')," +
    "'agree_at', now()::text));" + back;

  /* ── ① 신청에 계정이 담기는가 ─────────────────────────────────── */
  console.log("\n── ① 신청에 **누가 넣었는지**가 담기는가");
  const no1 = psql(mk(PRO, "010-1111-0001")).split("\n").pop().trim();
  ok("로그인한 분의 신청에 접수번호가 돌아온다", /^GA\d{6}-\d{4}$/.test(no1), no1);
  ok("  ⚠️⚠️ 그 줄의 `by_user` 가 **그 계정**이다 (화면이 보낸 값이 아닙니다)",
     psql("select by_user::text from provider_apply where no = '" + no1 + "'") === PRO,
     psql("select coalesce(by_user::text,'(없음)') from provider_apply where no = '" + no1 + "'"));

  const no2 = psql(mk(null, "010-1111-0002")).split("\n").pop().trim();
  ok("비로그인 신청도 그대로 받는다 (막으면 전화만 하시려는 분이 못 들어옵니다)",
     /^GA\d{6}-\d{4}$/.test(no2), no2);
  ok("  그 줄의 `by_user` 는 **비어 있다**",
     psql("select coalesce(by_user::text,'NONE') from provider_apply where no = '" + no2 + "'") === "NONE");

  /* ── ② 잇는 문이 자물쇠마다 다른 말로 거절하는가 ────────────────
     ⚠️⚠️ **거절하는 말까지** 맞춰 봅니다 — "거절되었나" 만 보면 다른
     자물쇠가 먼저 막아 **엉뚱한 까닭으로 통과**합니다(0061 에서
     `coalesce(my_role(),'')` 가 터지는 것을 자물쇠가 막은 것으로 읽고
     초록으로 덮은 자리). */
  console.log("\n── ② 잇는 문 — 자물쇠마다 **다른 말**로 거절하는가");
  const link = (who, j) =>
    denied((who ? as(who) : anon) + "select link_apply_account('" + j + "'::jsonb);" + back);

  const d1 = link(CUS, JSON.stringify({ no: no1, why: "테스트" }));
  ok("손님은 못 부른다", d1.no && /운영자만/.test(d1.why || ""), d1.why);
  const d2 = link(ADM, JSON.stringify({ no: no1 }));
  ok("까닭 없이는 안 받는다", d2.no && /까닭/.test(d2.why || ""), d2.why);
  const d3 = link(ADM, JSON.stringify({ no: "GA999999-9999", why: "테스트" }));
  ok("없는 신청은 거절한다", d3.no && /그런 신청이 없습니다/.test(d3.why || ""), d3.why);
  const d4 = link(ADM, JSON.stringify({ no: no2, why: "테스트" }));
  ok("⚠️ 비로그인 신청은 **초대 코드로 보낸다** (막다른 길이 아닙니다)",
     d4.no && /초대 코드/.test(d4.why || ""), d4.why);
  const d5 = link(ADM, JSON.stringify({ no: no1, why: "테스트" }));
  ok("아직 업체로 등록 안 된 신청은 거절한다",
     d5.no && /업체로 등록되지 않은/.test(d5.why || ""), d5.why);
  ok("  ⚠️ 자물쇠 다섯이 **서로 다른 말**로 거절한다",
     new Set([d1.why, d2.why, d3.why, d4.why, d5.why].map(m => String(m).slice(0, 40))).size === 5,
     JSON.stringify([d1, d2, d3, d4, d5].map(x => String(x.why).slice(0, 30))));
  const d6 = link(null, JSON.stringify({ no: no1, why: "테스트" }));
  ok("비로그인은 아예 못 부른다", d6.no, "막지 않았습니다");

  /* 등록을 끝낸 꼴로 만듭니다 — ⚠️ 표를 바로 고치는 것은 **검사 준비**
     이고, 재려는 자물쇠(잇는 문)는 그대로 둡니다. */
  psql("update provider_apply set state = 'done', provider_id = 'ps-a' where no = '" + no1 + "'");

  const d7 = link(STF, JSON.stringify({ no: no1, why: "직원이 시도" }));
  ok("⚠️ **직원도 이을 수 있다** (운영자 일입니다 — 관리자 전용이 아닙니다)",
     !d7.no, d7.why);
  /* ⚠️ 위에서 직원이 실제로 이었으므로 되돌려 놓습니다 — 앞 검사가 만든
     상태를 뒤 검사가 물려받는 자리입니다(0061 에서 겪었습니다). */
  psql("update account set role = 'customer', provider_id = null where id = '" + PRO + "'");

  const d8 = link(ADM, JSON.stringify({ no: no1, why: "다시" }));
  ok("되돌린 뒤 관리자도 이을 수 있다", !d8.no, d8.why);

  /* ── ③ 이으면 역할과 업체가 같이 바뀌는가 ─────────────────────── */
  console.log("\n── ③ 이으면 **역할과 업체가 같이** 바뀌는가");
  ok("역할이 provider 가 되었다",
     psql("select role::text from account where id = '" + PRO + "'") === "provider");
  ok("  그 업체에 이어졌다",
     psql("select coalesce(provider_id,'NONE') from account where id = '" + PRO + "'") === "ps-a");
  ok("  기록이 남았다",
     Number(psql("select count(*) from audit_log where obj = 'provider' " +
                 "and obj_id = 'ps-a' and to_state = 'staff-linked'")) > 0);
  ok("  ⚠️⚠️ 기록에 **성함이 안 담겼다** (audit_log 는 오래 남고 보는 사람도 넓습니다)",
     psql("select count(*) from audit_log where to_state = 'staff-linked' " +
          "and data::text like '%프로지원%'") === "0");

  const d9 = link(ADM, JSON.stringify({ no: no1, why: "또" }));
  ok("이미 그 업체 담당자면 거절한다",
     d9.no && /이미 그 업체/.test(d9.why || ""), d9.why);

  /* 다른 업체에 이어진 분 — 그 신청을 따로 만듭니다 */
  const no3 = psql(mk(PR2, "010-1111-0003")).split("\n").pop().trim();
  psql("update provider_apply set state = 'done', provider_id = 'ps-a' where no = '" + no3 + "'");
  const d10 = link(ADM, JSON.stringify({ no: no3, why: "옮기기" }));
  ok("⚠️ 다른 업체에 이어진 분은 거절한다 (먼저 끊어야 합니다 · 0052)",
     d10.no && /다른 업체에 이어져/.test(d10.why || ""), d10.why);

  /* 운영자 계정은 못 씁니다 (0043 §10 과 같은 규칙) */
  const no4 = psql(mk(STF, "010-1111-0004")).split("\n").pop().trim();
  psql("update provider_apply set state = 'done', provider_id = 'ps-a' where no = '" + no4 + "'");
  const d11 = link(ADM, JSON.stringify({ no: no4, why: "직원을" }));
  ok("⚠️⚠️ **운영자 계정은 업체 담당자로 못 잇는다** (스스로 배정하고 스스로 견적을 냅니다)",
     d11.no && /운영자 계정/.test(d11.why || ""), d11.why);

  /* ── ④ 개인 · 사업자 구분 — 관리자만 ─────────────────────────── */
  console.log("\n── ④ 개인 · 사업자 구분 (제20조의4 ③) — **관리자만**");
  const kind = (who, j) =>
    denied((who ? as(who) : anon) + "select set_provider_kind('" + j + "'::jsonb);" + back);

  ok("기본은 **모름**이다 (지어내지 않습니다)",
     psql("select coalesce(kind,'NONE') from provider where id = 'ps-a'") === "NONE");
  const k1 = kind(STF, JSON.stringify({ id: "ps-a", kind: "biz", why: "서류 봤음" }));
  ok("⚠️⚠️ **직원은 못 정한다** (사업자등록증을 보는 사람과 같아야 합니다)",
     k1.no && /관리자만/.test(k1.why || ""), k1.why);
  const k2 = kind(ADM, JSON.stringify({ id: "ps-a", kind: "biz" }));
  ok("까닭 없이는 안 받는다", k2.no && /까닭/.test(k2.why || ""), k2.why);
  const k3 = kind(ADM, JSON.stringify({ id: "ps-a", kind: "nosuch", why: "오타" }));
  ok("모르는 값은 거절한다", k3.no && /사업자 · 개인/.test(k3.why || ""), k3.why);
  const k4 = kind(ADM, JSON.stringify({ id: "ps-zzz", kind: "biz", why: "없는 업체" }));
  ok("없는 업체는 거절한다", k4.no && /그런 업체가 없습니다/.test(k4.why || ""), k4.why);
  const k5 = kind(ADM, JSON.stringify({ id: "ps-a", kind: "biz", why: "서류 봤음" }));
  ok("관리자는 정할 수 있다", !k5.no, k5.why);
  ok("  실제로 담겼다",
     psql("select kind from provider where id = 'ps-a'") === "biz");
  const k6 = kind(ADM, JSON.stringify({ id: "ps-a", kind: "biz", why: "또" }));
  ok("⚠️ **같은 값으로 옮기면 거절한다** (조용히 성공하면 기록만 거짓이 됩니다)",
     k6.no && /이미 그 값/.test(k6.why || ""), k6.why);
  const k7 = kind(ADM, JSON.stringify({ id: "ps-a", kind: "person", why: "다시 봤음" }));
  ok("개인으로 바꿀 수 있다", !k7.no && psql("select kind from provider where id = 'ps-a'") === "person");
  const k8 = kind(ADM, JSON.stringify({ id: "ps-a", kind: "", why: "모름으로" }));
  ok("⚠️⚠️ **모름으로 되돌릴 수 있다** (잘못 켠 구분이 손님 화면에 남으면 법이 요구한 표시가 거꾸로 나갑니다)",
     !k8.no && psql("select coalesce(kind,'NONE') from provider where id = 'ps-a'") === "NONE",
     k8.why);
  ok("  ⚠️ 자물쇠 넷이 **서로 다른 말**로 거절한다",
     new Set([k1.why, k2.why, k3.why, k4.why].map(m => String(m).slice(0, 40))).size === 4,
     JSON.stringify([k1, k2, k3, k4].map(x => String(x.why).slice(0, 26))));
  const k9 = kind(null, JSON.stringify({ id: "ps-a", kind: "biz", why: "x" }));
  ok("비로그인은 아예 못 부른다", k9.no, "막지 않았습니다");
  ok("⚠️ 표의 check 도 모르는 값을 막는다 (화면 · 문 · 표 셋입니다)",
     denied("update provider set kind = 'nosuch' where id = 'ps-a';").no,
     "표가 받았습니다");

  /* ── ⑤ 공개 보기에 칸이 실제로 있는가 ─────────────────────────── */
  console.log("\n── ⑤ 공개 보기에 칸 셋이 **실제로** 있는가");
  psql("update provider set kind = 'person', place_name = 'OO골프클럽 연습장', " +
       "lesson_goals = '{beginner,swing}' where id = 'ps-a'");
  const cols = psql("select count(*) from information_schema.columns " +
                    "where table_name = 'v_provider_card' " +
                    "and column_name in ('kind','place_name','lesson_goals')");
  ok("⚠️⚠️ `kind` · `place_name` · `lesson_goals` 가 보기에 있다 " +
     "(없으면 손님에게 **영원히 안 보입니다** — 에러 한 줄 없이)",
     cols === "3", cols);
  const row = psql(anon + "select kind || '|' || place_name || '|' || " +
                   "array_to_string(lesson_goals, ',') from v_provider_card " +
                   "where id = 'ps-a';" + back).split("\n").pop().trim();
  ok("  비로그인 손님에게 그 값이 그대로 나온다",
     row === "person|OO골프클럽 연습장|beginner,swing", row);

  /* ⚠️ 바꾼 값을 되돌려 놓습니다 — 뒤 검사가 물려받지 않게 */
  psql("update provider set kind = null, place_name = null, lesson_goals = '{}' " +
       "where id in ('ps-a','ps-b')");
  ok("⚠️ 바꾼 값을 **되돌려 놓았다**",
     psql("select count(*) from provider where id in ('ps-a','ps-b') and kind is null") === "2");
};

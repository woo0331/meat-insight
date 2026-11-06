/* ════════════════════════════════════════════════════════════════════
   입점업체의 사업자 신원정보 — 눌러 봅니다 (0057)

   ⚠️⚠️⚠️ **왜 이 검사가 있는가 — 전자상거래법 제20조 제2항.**
   중개자는 입점업체가 사업자일 때 그 상호 · 대표자 성명 · 주소 ·
   전화번호 · 전자우편주소 · 사업자등록번호를 **손님이 볼 수 있게**
   해야 합니다 (시행령 제25조). 공정위가 당근마켓에 시정명령과
   과태료를 부과한 조항이 이것입니다.

   ⚠️⚠️ **여기서 재는 것 넷** —
     ① 공개 보기(`v_provider_card`)에 칸 다섯이 **실제로 있는가**
        (없으면 손님에게 영원히 안 보입니다 — 에러 한 줄 없이)
     ② 업체는 넷을 고치고 **사업자등록번호는 못 고치는가**
        — 자물쇠가 둘입니다. 칸 단위 GRANT 와 트리거를 **따로** 눌러
          보고 **거절하는 말까지** 갈라서 봅니다.
     ③ 운영자 문(`set_provider_ident`)이 **까닭 없이는 안 받는가**,
        직원은 번호를 못 넣는가, 꼴을 한 가지로 만드는가
     ④ 기록(`audit_log`)에 **값이 안 담기는가** (대표자 성함입니다 —
        작업 기억: 감사 기록에 성함 · 연락처를 넣지 마세요)

   ⚠️ 재는 것은 늘 **문**입니다. 표에 바로 `update provider set brn`
   을 하면 자물쇠를 통째로 지나가고 그 초록은 아무 뜻이 없습니다 —
   그래서 **표로도 한 번** 눌러 보고 거절되는지 따로 셉니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0057 사업자 신원정보 — 씨앗");
  /* ⚠️⚠️ **다른 검사와 id 가 부딪히면 조용히 물려받습니다** (0051 에서
     `pp-a` 가 price.js 와 겹쳐 엉뚱한 자리에서 떨어졌습니다). 앞머리를
     `idt-` 로 가르고 **이미 있으면 큰 소리로** 멈춥니다. */
  const taken = psql("select coalesce(string_agg(id, ','), '') from provider " +
    "where id in ('idt-a','idt-b')");
  ok("⚠️⚠️ 쓸 업체 id 가 **비어 있다** (다른 검사와 안 부딪힙니다)",
     taken === "", "이미 있습니다 — " + taken);

  const PRO = psql("insert into auth.users (email) values ('idt-pro@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('idt-cus@x.test') returning id");
  const STF = psql("insert into auth.users (email) values ('idt-stf@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('idt-adm@x.test') returning id");

  /* ⚠️⚠️⚠️ **번호는 insert 때 심습니다 — update 로는 못 심습니다.**
     `provider_ident_guard` 는 `before update` 이고 관리자만 통과시키는데,
     이 검사는 **임자 권한**으로 도므로 `my_role()` 이 admin 이 아닙니다.
     처음에 `update provider set brn = …` 로 준비하다가 트리거에 막혀
     검사가 통째로 터졌습니다 — **코드가 맞고 틀린 것은 검사**였습니다
     (작업 기억: "검사가 빨갛게 뜨면 코드부터 고치지 마세요").
     ⚠️ 트리거가 `insert` 를 안 보는 것은 맞습니다 — 새 업체를 만드는
     문(`save_provider`)은 운영자만 부르고, 거기엔 brn 칸이 없습니다. */
  psql("insert into provider (id, name, listed, state, is_test, brn) values " +
       "('idt-a','신원정보골프장', true, 'approved', false, '111-11-11111')," +
       "('idt-b','빈골프장', true, 'approved', false, null) " +
       "on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + PRO + "','provider','업체담당','idt-a')," +
       "('" + CUS + "','customer','손님', null)," +
       "('" + STF + "','staff','직원', null)," +
       "('" + ADM + "','admin','관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const back = "reset role; select become(null);";

  /* ── ① 공개 보기에 칸이 실제로 있는가 ───────────────────────────
     ⚠️⚠️ 이것이 가장 중요합니다. `provider` 표는 anon 에게 열려 있지
     않으므로(0032) 손님 · 크롤러에게 가는 길은 이 보기 하나입니다.
     보기에 칸을 안 더하면 업체가 적어도 **영원히 안 보입니다.** */
  console.log("\n── ① 공개 보기에 칸 다섯이 있는가");
  ok("⚠️⚠️ v_provider_card 에 칸 다섯이 **다 있다**",
     psql("select count(*)::int from information_schema.columns " +
          "where table_name = 'v_provider_card' " +
          "and column_name in ('ceo','addr','tel','email','brn')") === "5",
     psql("select coalesce(string_agg(column_name, ','), '(없음)') " +
          "from information_schema.columns where table_name = 'v_provider_card' " +
          "and column_name in ('ceo','addr','tel','email','brn')"));
  /* ⚠️⚠️ **배정 담당자 직통(0013)은 여기 없어야 합니다** — 그 표를
     가른 까닭이 "거기 직통을 넣으면 손님 전부가 담당자 휴대폰을
     본다" 였습니다. 공개하는 전화와 가리는 전화는 다른 칸입니다. */
  ok("⚠️⚠️ 배정 담당자 직통(provider_contact)은 공개 보기에 **없다**",
     psql("select count(*)::int from information_schema.columns " +
          "where table_name = 'v_provider_card' " +
          "and column_name in ('contact','contact_name','direct_tel')") === "0");

  /* ── ② 업체가 고치는 것과 못 고치는 것 ─────────────────────────── */
  console.log("\n── ② 업체는 넷을 고치고 번호는 못 고칩니다");
  const sv = allowed(as(PRO) +
    "select save_provider_self(jsonb_build_object(" +
    "'ceo','김대표','addr','서울 강남구 1','tel','02-111-2222'," +
    "'email','a@idt.test'), '검사');" + back);
  ok("업체가 문으로 넷을 적을 수 있다", sv.yes, sv.why);
  ok("  네 칸이 실제로 들어갔다",
     psql("select ceo || '|' || addr || '|' || tel || '|' || email " +
          "from provider where id = 'idt-a'") === "김대표|서울 강남구 1|02-111-2222|a@idt.test",
     psql("select coalesce(ceo,'(null)') || '|' || coalesce(addr,'(null)') " +
          "from provider where id = 'idt-a'"));

  /* ⚠️⚠️⚠️ **자물쇠 둘을 따로 눌러 봅니다.**
     ㉮ 칸 단위 GRANT — 0001 이 `brn` 을 안 줬습니다. 안 준 칸을 쓰면
        0줄이 아니라 **질의가 통째로 거절**됩니다 (0050 · 0052 에서
        밟은 그 자리).
     ㉯ 트리거 — GRANT 를 누가 넓히는 날 남는 둘째 자물쇠입니다. */
  const g1 = denied(as(PRO) +
    "update provider set brn = '999-99-99999' where id = 'idt-a';" + back);
  ok("㉮ 업체가 **표에서** 번호를 못 바꾼다 (칸 GRANT)", g1.no, "막지 않았습니다");
  ok("  ⚠️ 거절하는 말이 권한 이야기다 (트리거가 아니라 GRANT 가 막았습니다)",
     g1.no && /permission denied|권한/.test(g1.why), g1.why);
  /* ⚠️⚠️⚠️ **㉯ 트리거가 장식인지 확인합니다.** 위 ㉮ 는 칸 GRANT 가
     먼저 막아서, 그것만 보면 **트리거가 일을 하는지 알 수 없습니다**
     (작업 기억: 같은 칸을 지키는 자물쇠가 둘이면 하나를 열고 다른 것을
     눌러 보세요 — `tools/sql/quote.js` 가 `is_test` 로 하는 그것입니다).
     ⚠️ 잠깐 열고 **반드시 다시 닫습니다.** */
  psql("grant update (brn) on provider to authenticated");
  const g2 = denied(as(PRO) +
    "update provider set brn = '999-99-99999' where id = 'idt-a';" + back);
  psql("revoke update (brn) on provider from authenticated");
  ok("㉯ GRANT 를 열어도 **트리거가 막는다** (장식이 아닙니다)",
     g2.no, "안 막았습니다 — 트리거가 장식입니다");
  ok("  ⚠️ 트리거는 **운영자 이야기로** 거절한다 (GRANT 와 말이 다릅니다)",
     g2.no && /운영자가 서류를 보고/.test(g2.why), g2.why);
  ok("  ⚠️ 열어 둔 GRANT 를 **다시 닫았다**",
     psql("select count(*)::int from information_schema.column_privileges " +
          "where table_name = 'provider' and column_name = 'brn' " +
          "and privilege_type = 'UPDATE' and grantee = 'authenticated'") === "0",
     "열린 채 남았습니다");
  /* ⚠️ 관리자는 그 트리거를 지나갑니다 — 막기만 하고 통과를 안 재면
     "너무 넓게 막는 것도 고장" 을 못 봅니다. */
  psql("grant update (brn) on provider to authenticated");
  const g3 = allowed(as(ADM) +
    "update provider set brn = '333-44-55555' where id = 'idt-a';" + back);
  /* ⚠️⚠️ **제가 바꾼 값을 되돌려 놓습니다** — 아래 검사가 씨앗의 번호를
     견주므로, 안 되돌리면 **멀쩡한 코드를 실패로** 잡습니다 (앞 검사가
     만든 상태를 뒤 검사가 물려받는 그 자리 · 0046 에서 두 번 밟았습니다). */
  allowed(as(ADM) +
    "update provider set brn = '111-11-11111' where id = 'idt-a';" + back);
  psql("revoke update (brn) on provider from authenticated");
  ok("  관리자는 트리거를 지나간다 (정상 조건도 같이 봅니다)", g3.yes, g3.why);
  ok("  ⚠️ 바꿔 본 값을 **되돌려 놓았다**",
     psql("select brn from provider where id = 'idt-a'") === "111-11-11111",
     psql("select coalesce(brn,'(null)') from provider where id = 'idt-a'"));

  /* ⚠️ 문을 통해도 번호는 안 바뀝니다 — `save_provider_self` 가 그 칸을
     아예 안 건드립니다. "거절" 이 아니라 **안 바뀜**이 맞는 동작입니다.
     ⚠️ 씨앗에서 심어 둔 `111-11-11111` 이 그대로 남아야 합니다. */
  const sv2 = allowed(as(PRO) +
    "select save_provider_self(jsonb_build_object('brn','999-99-99999'), '검사');" + back);
  ok("문에 번호를 실어 보내도 **거절도 아니고 바뀌지도 않는다**",
     sv2.yes && psql("select brn from provider where id = 'idt-a'") === "111-11-11111",
     psql("select brn from provider where id = 'idt-a'"));

  /* ── ③ 운영자 문 ───────────────────────────────────────────────── */
  console.log("\n── ③ 운영자 문 (set_provider_ident)");
  const d1 = denied(as(CUS) +
    "select set_provider_ident(jsonb_build_object('provider','idt-b','why','검사'));" + back);
  ok("손님은 거절당한다", d1.no, "막지 않았습니다");
  const d2 = denied(as(PRO) +
    "select set_provider_ident(jsonb_build_object('provider','idt-a','why','검사'));" + back);
  ok("업체도 거절당한다 (제 업체라도)", d2.no, "막지 않았습니다");
  const d3 = denied(as(ADM) +
    "select set_provider_ident(jsonb_build_object('provider','idt-b','ceo','아무개'));" + back);
  ok("⚠️⚠️ **까닭이 없으면 거절한다** (손님에게 보이는 값입니다)", d3.no, "막지 않았습니다");
  ok("  ⚠️ 까닭이 없다고 **말로** 거절한다 (다른 자물쇠와 말이 다릅니다)",
     d3.no && /까닭/.test(d3.why), d3.why);
  const d4 = denied(as(ADM) +
    "select set_provider_ident(jsonb_build_object('provider','없는업체','why','검사'));" + back);
  ok("없는 업체는 거절한다", d4.no, "막지 않았습니다");

  /* ⚠️⚠️⚠️ **직원은 번호를 못 넣습니다.** 번호를 적는 일과 확인 배지를
     켜는 일은 같은 서류를 보는 한 사람이어야 합니다 — 배지는
     `provider_guard`(0030)가 관리자만 켜게 막습니다. */
  const d5 = denied(as(STF) +
    "select set_provider_ident(jsonb_build_object(" +
    "'provider','idt-b','brn','222-33-44444','why','검사'));" + back);
  ok("⚠️⚠️ 직원은 **번호를 못 넣는다**", d5.no, "막지 않았습니다");
  ok("  ⚠️ 트리거와 **다른 말로** 거절한다 (어느 쪽이 막았는지 알게)",
     d5.no && /관리자만/.test(d5.why), d5.why);
  const s1 = allowed(as(STF) +
    "select set_provider_ident(jsonb_build_object(" +
    "'provider','idt-b','ceo','직원이적음','tel','02-999-0000','why','통화로 확인'));" + back);
  ok("  직원도 나머지 넷은 적을 수 있다", s1.yes, s1.why);

  /* ⚠️⚠️ **보낸 칸만 고칩니다** — 통째로 덮으면 운영자가 전화로 번호
     하나만 받아 적는 날 나머지가 지워집니다 (`save_provider_self` 가
     바로 그 자리이고, `js/deskme.js` 가 industries 를 지우고 있었습니다). */
  const s2 = allowed(as(ADM) +
    "select set_provider_ident(jsonb_build_object(" +
    "'provider','idt-b','brn','2223344444','why','사업자등록증 확인'));" + back);
  ok("⚠️⚠️ **보낸 칸만** 고친다 (대표자 · 전화가 그대로다)",
     s2.yes && psql("select ceo || '|' || tel from provider where id = 'idt-b'") ===
       "직원이적음|02-999-0000",
     psql("select coalesce(ceo,'(null)') || '|' || coalesce(tel,'(null)') " +
          "from provider where id = 'idt-b'"));
  /* ⚠️ 꼴을 **한 가지로** 만듭니다 — 숫자만 보내도 하이픈을 붙여 저장합니다.
     꼴이 둘이면 같은 번호가 화면에서 두 모양으로 보입니다. */
  ok("⚠️ 숫자 열 자리를 보내도 **하이픈을 붙여** 저장한다",
     psql("select brn from provider where id = 'idt-b'") === "222-33-44444",
     psql("select coalesce(brn,'(null)') from provider where id = 'idt-b'"));
  const d6 = denied(as(ADM) +
    "select set_provider_ident(jsonb_build_object(" +
    "'provider','idt-b','brn','123','why','검사'));" + back);
  ok("자리 수가 안 맞으면 거절한다", d6.no, "막지 않았습니다");
  const d7 = denied(as(ADM) +
    "select set_provider_ident(jsonb_build_object(" +
    "'provider','idt-b','email','골뱅이없음','why','검사'));" + back);
  ok("이메일 꼴이 아니면 거절한다", d7.no, "막지 않았습니다");
  /* ⚠️ 비우는 것은 **됩니다** — 지어낼 수 없는 값이고, 비면 화면에서
     그 줄이 빠집니다 (절대 규칙 1 · 2). */
  const s3 = allowed(as(ADM) +
    "select set_provider_ident(jsonb_build_object(" +
    "'provider','idt-b','ceo','','why','잘못 적어 지웁니다'));" + back);
  ok("⚠️ **비우는 것은 된다** (지어낸 값을 남기지 않습니다)",
     s3.yes && psql("select coalesce(ceo,'(null)') from provider where id = 'idt-b'") === "(null)",
     psql("select coalesce(ceo,'(null)') from provider where id = 'idt-b'"));

  /* ── ④ 기록에 값이 안 담기는가 ─────────────────────────────────── */
  console.log("\n── ④ 감사 기록에 **값**이 안 담깁니다");
  /* ⚠️⚠️ `audit_log` 는 오래 남고 보는 사람도 넓습니다 — 대표자 성함이
     거기 들어가면 지울 수 없는 자리에 사람 이름이 쌓입니다.
     ⚠️ 무엇을 고쳤는지는 **칸 이름**으로 남깁니다. */
  const lg = psql("select coalesce(data::text,'(없음)') from audit_log " +
    "where obj = 'provider' and obj_id = 'idt-b' and to_state = 'ident-updated' " +
    "order by at desc limit 1");
  ok("기록에 **칸 이름**이 남는다", /fields/.test(lg) && /brn|ceo/.test(lg), lg);
  ok("⚠️⚠️ 기록에 **값이 안 담긴다** (대표자 성함 · 번호)",
     lg.indexOf("직원이적음") < 0 && lg.indexOf("222-33-44444") < 0, lg);
  ok("까닭은 남는다",
     psql("select coalesce(why,'(없음)') from audit_log where obj = 'provider' " +
          "and obj_id = 'idt-b' and to_state = 'ident-updated' order by at desc limit 1")
       .length > 0);

  /* ── ⑤ 안쪽 함수를 아무나 못 부르는가 ──────────────────────────
     ⚠️⚠️⚠️ **함수는 표와 반대입니다** — 만드는 순간 public 에게 EXECUTE
     가 붙습니다. 0050 의 `notify_one` 이 그래서 **로그인한 누구나 아무
     사람에게 알림을 꽂을 수** 있었습니다. 트리거 함수도 같습니다. */
  console.log("\n── ⑤ 트리거 함수를 직접 못 부릅니다");
  const d8 = denied(as(CUS) + "select provider_ident_guard();" + back);
  ok("⚠️⚠️ 트리거 함수를 **직접 못 부른다** (revoke 를 걸었습니다)",
     d8.no, "불러졌습니다 — revoke all … from public 이 빠졌습니다");
  const d9 = denied(anon + "select set_provider_ident('{}'::jsonb);" + back);
  ok("비로그인도 못 부른다", d9.no, "막지 않았습니다");
};

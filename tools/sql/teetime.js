/* ════════════════════════════════════════════════════════════════════
   티타임 공급 — 업체가 올리고 손님이 신청합니다 (0060)

   ⚠️⚠️ **여기서 재는 것 아홉** —
     ① 올리는 문 — 업체 담당자만 · **승인된 업체만** · 검사용 업체 거절
     ② 고치는 문 — **보낸 칸만** · 날짜 · 지역 · 골프장은 **안 바뀜**
     ③ 예약 신청 — **동의 없이는 거절** · 중복 · 자리 초과 · 제 업체
     ④ ⚠️⚠️⚠️ **신청자 성함 · 연락처가 다른 업체에 안 보이는가**
     ⑤ 확정 · 거절은 **그 업체만** · 거절에 까닭 · 취소는 신청자만
     ⑥ 정지되면 **읽을 때 바로** 빠지는가 · anon 은 읽고 못 쓰는가
     ⑦ ⚠️⚠️ **현황표의 숫자와 목록의 줄 수가 같은가** (지시서 §5)
     ⑧ 공개 번호 — **배정 담당자 직통이 한 글자도 안 나오는가** (0013)
     ⑨ 알림 둘 — **받는 사람 눈으로** 셉니다

   ⚠️⚠️⚠️ **자물쇠가 겹치는 자리는 갈라서** 잽니다 — 표의 칸 GRANT 와
   보기의 where 절은 **다른 자물쇠**입니다. 하나만 보고 "막혔다" 고 읽으면
   나머지가 장식인지 알 수 없습니다.

   ⚠️ **갯수를 박지 않습니다** — 앞 검사들이 만든 업체 · 알림이 이미
   있습니다. **전을 재고 늘어난 값**만 봅니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0060 티타임 — 씨앗");
  const OWN = psql("insert into auth.users (email) values ('tt-pv@x.test') returning id");
  const OTH = psql("insert into auth.users (email) values ('tt-pv2@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('tt-cus@x.test') returning id");
  const CU2 = psql("insert into auth.users (email) values ('tt-cus2@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('tt-adm@x.test') returning id");

  /* ⚠️ 업체 둘 — 하나는 승인 · 하나는 승인 전. 검사용 업체(is_test)도 하나.
     ⚠️⚠️ 이름을 `tt-*` 로 가릅니다 — 0051 에서 `pp-a` 가 다른 검사의
     업체와 부딪혀 엉뚱한 곳에서 떨어진 자리입니다. */
  ["tt-ok", "tt-new", "tt-test"].forEach(function(id){
    const n = psql("select count(*)::int from provider where id = '" + id + "'");
    if(n !== "0") throw new Error("업체 id 가 이미 쓰이고 있습니다: " + id);
  });
  psql("insert into provider (id, name, listed, is_test, state, tel, regions, subs) values " +
       "('tt-ok','검사용 그린CC', true, false, 'approved','031-000-0000'," +
       " array['gyeonggi'], array['bk-weekday'])," +
       "('tt-new','심사중 골프장', true, false, 'draft', '031-111-1111'," +
       " array['gyeonggi'], array['bk-weekday'])," +
       "('tt-test','검사용 티타임', true, true, 'approved','031-222-2222'," +
       " array['gyeonggi'], array['bk-weekday'])");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + OWN + "','provider','담당자','tt-ok')," +
       "('" + OTH + "','provider','남의담당자','tt-new')," +
       "('" + CUS + "','customer','손님하나', null)," +
       "('" + CU2 + "','customer','손님둘', null)," +
       "('" + ADM + "','admin','운영', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");
  /* ⚠️⚠️ **배정 담당자 직통**(0013)을 심어 둡니다 — 이 번호가 손님
     화면으로 새는지 보는 것이 이 검사의 핵심 하나입니다. */
  psql("insert into provider_contact (provider_id, name, tel, email, memo) " +
       "values ('tt-ok','현장담당','010-9999-0000','x@x.test','직통') " +
       "on conflict (provider_id) do update set tel = excluded.tel");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const back = "reset role; select become(null);";
  const DAY  = "(select (kst_today() + 10)::text)";

  /* ── ① 올리는 문 ───────────────────────────────────────────────── */
  console.log("\n── ① 자리를 올리는 문 — 승인된 업체만");
  const o0 = denied(anon + "select open_teetime(jsonb_build_object('kind','booking'));" + back);
  ok("비로그인은 거절당한다", o0.no, "막지 않았습니다");
  const o1 = denied(as(CUS) +
    "select open_teetime(jsonb_build_object('kind','booking','region','gyeonggi'," +
    "'course','그린CC','playAt'," + DAY + ",'slots','4'));" + back);
  ok("손님은 자리를 못 올린다", o1.no, "막지 않았습니다");
  /* ⚠️⚠️ **승인 전 업체**는 거절해야 합니다 — 그 업체는 `/pro/<id>` 화면이
     빌드에 없어 손님이 눌러도 404 입니다 (0055 에서 광고에 적용한 자리). */
  const o2 = denied(as(OTH) +
    "select open_teetime(jsonb_build_object('kind','booking','region','gyeonggi'," +
    "'course','심사중CC','playAt'," + DAY + ",'slots','4'));" + back);
  ok("⚠️⚠️ **승인 전 업체는 거절한다**", o2.no, "막지 않았습니다");
  ok("  까닭을 말로 적는다", o2.no && /승인된 업체/.test(o2.why), o2.why);

  const bad1 = denied(as(OWN) +
    "select open_teetime(jsonb_build_object('kind','booking','region','gyeonggi'," +
    "'course','그린CC','playAt','2000-01-01','slots','4'));" + back);
  ok("지난 날짜는 거절한다", bad1.no, "막지 않았습니다");
  const bad2 = denied(as(OWN) +
    "select open_teetime(jsonb_build_object('kind','booking','region','gyeonggi'," +
    "'course','그린CC','playAt',(select (kst_today() + 120)::text),'slots','4'));" + back);
  ok("90일 뒤는 거절한다", bad2.no, "막지 않았습니다");
  const bad3 = denied(as(OWN) +
    "select open_teetime(jsonb_build_object('kind','booking','region','gyeonggi'," +
    "'course','그린CC','playAt'," + DAY + ",'slots','4','greenFee','십오만원'));" + back);
  ok("그린피가 숫자가 아니면 거절한다", bad3.no, "막지 않았습니다");

  const TEE = psql(as(OWN) +
    "select open_teetime(jsonb_build_object('kind','booking','region','gyeonggi'," +
    "'course','그린CC 신코스','playAt'," + DAY + ",'teeAt','07:10','holes','18'," +
    "'slots','4','greenFee','150000','note','카트비 별도'));" + back);
  ok("승인된 업체는 자리를 올린다", /^[0-9a-f-]{36}$/.test(TEE), TEE);
  /* ⚠️⚠️ **0 은 무료입니다** — 빈 값과 뜻이 다릅니다 */
  const FREE = psql(as(OWN) +
    "select open_teetime(jsonb_build_object('kind','join','region','gyeonggi'," +
    "'course','무료 나눔 코스','playAt'," + DAY + ",'slots','2','greenFee','0'));" + back);
  ok("⚠️ 그린피 **0 이 0 으로 들어간다** (안 적음과 다릅니다)",
     psql("select coalesce(green_fee::text,'(없음)') from teetime where id = '" + FREE + "'") === "0",
     psql("select coalesce(green_fee::text,'(없음)') from teetime where id = '" + FREE + "'"));

  /* ── ② 고치는 문 ───────────────────────────────────────────────── */
  console.log("\n── ② 고치는 문 — 보낸 칸만 · 날짜는 못 바꿉니다");
  const e0 = denied(as(OTH) +
    "select edit_teetime(jsonb_build_object('id','" + TEE + "','slots','2'));" + back);
  ok("남의 업체 자리는 못 고친다", e0.no, "막지 않았습니다");
  psql(as(OWN) + "select edit_teetime(jsonb_build_object('id','" + TEE +
       "','note','카트비 포함으로 바뀌었습니다'));" + back);
  const keep = psql("select course || '|' || play_at::text || '|' || region || '|' || " +
                    "coalesce(green_fee::text,'') from teetime where id = '" + TEE + "'");
  ok("⚠️⚠️ **보낸 칸만 고친다** (골프장 · 날짜 · 지역 · 그린피가 그대로)",
     keep.indexOf("그린CC 신코스|") === 0 && keep.indexOf("|gyeonggi|150000") > 0, keep);
  /* ⚠️⚠️⚠️ 날짜 · 지역 · 골프장 · 갈래는 **보내도 안 바뀝니다** — 바꾸면
     이미 신청하신 분이 다른 자리에 묶입니다. */
  psql(as(OWN) + "select edit_teetime(jsonb_build_object('id','" + TEE +
       "','playAt','2030-01-01','region','jeju','course','딴 골프장','kind','join'));" + back);
  const keep2 = psql("select course || '|' || play_at::text || '|' || region || '|' || kind " +
                     "from teetime where id = '" + TEE + "'");
  ok("⚠️⚠️⚠️ 날짜 · 지역 · 골프장 · 갈래는 **보내도 안 바뀐다**",
     keep2.indexOf("그린CC 신코스|") === 0 && keep2.indexOf("|gyeonggi|booking") > 0, keep2);

  /* ── ③ 예약 신청 ───────────────────────────────────────────────── */
  console.log("\n── ③ 예약 신청 — 동의 없이는 안 받습니다");
  const b0 = denied(anon +
    "select book_teetime(jsonb_build_object('tee','" + TEE + "','name','손님'," +
    "'tel','010-1111-2222','people','2','agree3rd',true));" + back);
  ok("비로그인은 신청을 못 한다", b0.no, "막지 않았습니다");
  /* ⚠️⚠️⚠️ **동의가 없으면 거절** — 성함과 연락처가 그 업체에 넘어갑니다 */
  const b1 = denied(as(CUS) +
    "select book_teetime(jsonb_build_object('tee','" + TEE + "','name','손님하나'," +
    "'tel','010-1111-2222','people','2'));" + back);
  ok("⚠️⚠️⚠️ **제3자 제공 동의 없이는 거절한다** (제17조 제2항)",
     b1.no && /동의/.test(b1.why), b1.why);
  const b2 = denied(as(CUS) +
    "select book_teetime(jsonb_build_object('tee','" + TEE + "','name','손님하나'," +
    "'tel','010-1111-2222','people','9','agree3rd',true));" + back);
  ok("인원이 1~4 를 벗어나면 거절한다", b2.no, "막지 않았습니다");
  /* ⚠️ 제 업체 자리에는 제가 못 신청합니다 */
  const b3 = denied(as(OWN) +
    "select book_teetime(jsonb_build_object('tee','" + TEE + "','name','담당자'," +
    "'tel','010-1111-2222','people','1','agree3rd',true));" + back);
  ok("제 업체 자리에는 못 신청한다", b3.no, "막지 않았습니다");

  const BK = psql(as(CUS) +
    "select book_teetime(jsonb_build_object('tee','" + TEE + "','name','손님하나'," +
    "'tel','010-1111-2222','people','2','agree3rd',true,'memo','처음 갑니다'));" + back);
  ok("동의하면 신청이 들어간다", /^[0-9a-f-]{36}$/.test(BK), BK);
  ok("  ⚠️ **동의 시각이 비어 있지 않다**",
     psql("select (agree3rd_at is not null)::text from teebook where id = '" + BK + "'") === "true",
     "비어 있습니다");
  /* ⚠️⚠️ **같은 자리에 두 번** — 없으면 한 분이 자리를 다 먹습니다 */
  const b4 = denied(as(CUS) +
    "select book_teetime(jsonb_build_object('tee','" + TEE + "','name','손님하나'," +
    "'tel','010-1111-2222','people','1','agree3rd',true));" + back);
  ok("⚠️⚠️ 같은 자리에 **두 번은 못 신청한다**", b4.no, "막지 않았습니다");
  ok("  까닭을 사람 말로 적는다 (인덱스 이름이 아닙니다)",
     b4.no && /이미 신청/.test(b4.why) && !/teebook_once_idx/.test(b4.why), b4.why);
  /* ⚠️ 자리 초과 — 4자리에 2명이 들어갔으므로 3명은 안 됩니다 */
  const b5 = denied(as(CU2) +
    "select book_teetime(jsonb_build_object('tee','" + TEE + "','name','손님둘'," +
    "'tel','010-3333-4444','people','3','agree3rd',true));" + back);
  ok("⚠️ **남은 자리보다 많으면 거절한다**", b5.no && /남은 자리/.test(b5.why), b5.why);
  const BK2 = psql(as(CU2) +
    "select book_teetime(jsonb_build_object('tee','" + TEE + "','name','손님둘'," +
    "'tel','010-3333-4444','people','2','agree3rd',true));" + back);
  ok("남은 자리만큼은 들어간다", /^[0-9a-f-]{36}$/.test(BK2), BK2);

  /* ── ④ 신청자 연락처 ───────────────────────────────────────────── */
  console.log("\n── ④ 신청자 성함 · 연락처 — 그 업체에게만");
  /* ⚠️⚠️ **자물쇠가 둘입니다** — 표의 칸 GRANT 와 보기의 where 절.
     따로 눌러 봅니다 (하나만 보고 끝내면 다른 것이 장식인지 모릅니다). */
  const g0 = denied(as(CUS) + "select name from teebook where id = '" + BK + "';" + back);
  ok("⚠️⚠️ **표에서는 성함 칸을 아무도 못 읽는다** (칸 GRANT)",
     g0.no && /permission denied/.test(g0.why), g0.why);
  const g1 = denied(as(OWN) + "select tel from teebook where id = '" + BK + "';" + back);
  ok("  업체도 **표에서는** 못 읽는다 (길은 보기 하나입니다)",
     g1.no && /permission denied/.test(g1.why), g1.why);
  ok("⚠️⚠️⚠️ 그 업체는 **보기로** 신청자 연락처를 본다",
     psql(as(OWN) + "select tel from v_teebook_pv where id = '" + BK + "';" + back) ===
     "010-1111-2222", "못 봅니다");
  ok("⚠️⚠️⚠️ **다른 업체에는 한 줄도 안 보인다**",
     psql(as(OTH) + "select count(*)::text from v_teebook_pv where id = '" + BK + "';" + back) === "0",
     "보입니다");
  ok("  손님 본인에게도 **그 보기는 0줄**이다 (업체용입니다)",
     psql(as(CUS) + "select count(*)::text from v_teebook_pv where id = '" + BK + "';" + back) === "0",
     "보입니다");
  ok("  손님은 **제 신청 보기**로 제 것만 본다",
     psql(as(CUS) + "select count(*)::text from v_teebook_mine;" + back) === "1" &&
     psql(as(CU2) + "select count(*)::text from v_teebook_mine;" + back) === "1",
     "안 맞습니다");

  /* ── ⑤ 확정 · 거절 · 취소 ──────────────────────────────────────── */
  console.log("\n── ⑤ 확정은 업체만 · 거절에는 까닭");
  const m0 = denied(as(CUS) +
    "select move_teebook(jsonb_build_object('id','" + BK + "','state','confirmed'));" + back);
  ok("⚠️⚠️ **손님이 스스로 확정할 수 없다** (그러면 예약이 아닙니다)",
     m0.no, "막지 않았습니다");
  const m1 = denied(as(OTH) +
    "select move_teebook(jsonb_build_object('id','" + BK + "','state','confirmed'));" + back);
  ok("다른 업체도 못 한다", m1.no, "막지 않았습니다");
  const m2 = denied(as(OWN) +
    "select move_teebook(jsonb_build_object('id','" + BK2 + "','state','rejected'));" + back);
  ok("⚠️ 거절에는 **까닭이 반드시** 있어야 한다", m2.no && /까닭/.test(m2.why), m2.why);
  ok("그 업체는 확정한다",
     psql(as(OWN) + "select move_teebook(jsonb_build_object('id','" + BK +
          "','state','confirmed'));" + back) === "confirmed", "못 했습니다");
  const m3 = denied(as(OWN) +
    "select move_teebook(jsonb_build_object('id','" + BK + "','state','rejected','why','마감'));" + back);
  ok("이미 처리한 신청은 다시 못 옮긴다", m3.no, "막지 않았습니다");
  ok("손님은 제 신청을 취소한다",
     psql(as(CU2) + "select move_teebook(jsonb_build_object('id','" + BK2 +
          "','state','canceled'));" + back) === "canceled", "못 했습니다");
  /* ⚠️⚠️ 확정 인원보다 적게 줄일 수 없습니다 */
  const e1 = denied(as(OWN) +
    "select edit_teetime(jsonb_build_object('id','" + TEE + "','slots','1'));" + back);
  ok("⚠️ 확정하신 분보다 **적게 줄일 수 없다**", e1.no, "막지 않았습니다");

  /* ── ⑥ 공개 보기 ───────────────────────────────────────────────── */
  console.log("\n── ⑥ 공개 보기 — 읽기는 누구나 · 정지되면 그 순간 빠집니다");
  ok("⚠️ anon 이 자리 목록을 **읽는다**",
     Number(psql(anon + "select count(*)::int from v_teetime_open where id = '" +
                 TEE + "';" + back)) === 1, "못 읽습니다");
  ok("  ⚠️ 검사용 업체 자리는 **안 나간다**",
     psql(anon + "select count(*)::text from v_teetime_open where provider_id = 'tt-test';" + back) === "0",
     "나갑니다");
  ok("  ⚠️ 승인 전 업체 자리도 안 나간다",
     psql(anon + "select count(*)::text from v_teetime_open where provider_id = 'tt-new';" + back) === "0",
     "나갑니다");
  /* ⚠️⚠️ **읽을 때 다시 봅니다** — 정지시키면 그 순간 빠져야 합니다.
     ⚠️ 표를 직접 고치지 않고 **문으로** 옮깁니다 (0038 의 트리거가 막습니다). */
  psql(as(ADM) + "select set_provider_state(jsonb_build_object(" +
       "'id','tt-ok','to','suspended','why','검사로 잠시 정지합니다'));" + back);
  ok("⚠️⚠️ 업체를 정지시키면 **그 순간 자리가 빠진다**",
     psql(anon + "select count(*)::text from v_teetime_open where id = '" + TEE + "';" + back) === "0",
     "남아 있습니다");
  const b6 = denied(as(CU2) +
    "select book_teetime(jsonb_build_object('tee','" + TEE + "','name','손님둘'," +
    "'tel','010-3333-4444','people','1','agree3rd',true));" + back);
  ok("  정지된 업체 자리에는 **신청도 못 한다**", b6.no, "막지 않았습니다");
  psql(as(ADM) + "select set_provider_state(jsonb_build_object(" +
       "'id','tt-ok','to','approved','why','검사가 끝나 되돌립니다'));" + back);
  /* ⚠️⚠️ **정지는 공개(`listed`)도 같이 끄고, 다시 승인해도 안 켜집니다**
     (0038 — "상태만 바꾸고 listed 를 켜 두면 listed 만 보는 화면이
     내보낼 수 있습니다"). 그것이 맞는 동작이고, 운영자가 다시 공개를
     켭니다. 검사는 **그 문으로** 되돌립니다 — 표에 바로 쓰려다
     `provider_guard` 에 막혔고(그것이 맞습니다), **문이 있는 자리는
     문으로** 재야 합니다.
     ⚠️ `approve_provider` 는 **자리 인자**입니다 (0012 의 서명 그대로). */
  psql(as(ADM) + "select approve_provider('tt-ok', true, null, " +
       "'검사가 끝나 다시 공개합니다', null);" + back);
  ok("  ⚠️ 검사가 바꾼 상태를 **되돌렸다** (뒤 검사가 물려받지 않게)",
     psql(anon + "select count(*)::text from v_teetime_open where id = '" + TEE + "';" + back) === "1",
     "안 돌아왔습니다");

  /* ── ⑦ 현황표와 목록이 같은 수인가 ─────────────────────────────── */
  console.log("\n── ⑦ 현황표의 숫자 = 목록의 줄 수 (지시서 §5)");
  const listN = psql(anon + "select count(*)::text from v_teetime_open " +
    "where kind = 'booking' and region = 'gyeonggi' and play_at = kst_today() + 10;" + back);
  const cntN = psql(anon + "select coalesce(sum(n),0)::text from v_teetime_count " +
    "where kind = 'booking' and region = 'gyeonggi' and play_at = kst_today() + 10;" + back);
  ok("⚠️⚠️ 현황표와 목록이 **같은 수**다 (" + listN + " · " + cntN + ")",
     listN === cntN && listN !== "0", listN + " vs " + cntN);
  /* ⚠️ 집계 보기를 목록 보기 **위에** 세웠으므로 구조적으로 어긋날 수
     없습니다 — 그것을 눌러서 확인합니다 (닫으면 둘 다 줄어야 합니다). */
  psql(as(OWN) + "select close_teetime(jsonb_build_object('id','" + FREE + "'));" + back);
  const l2 = psql(anon + "select count(*)::text from v_teetime_open where kind = 'join' " +
    "and region = 'gyeonggi' and play_at = kst_today() + 10;" + back);
  const c2 = psql(anon + "select coalesce(sum(n),0)::text from v_teetime_count where kind = 'join' " +
    "and region = 'gyeonggi' and play_at = kst_today() + 10;" + back);
  ok("  자리를 닫으면 **둘 다** 줄어든다", l2 === c2 && l2 === "0", l2 + " vs " + c2);
  /* ⚠️⚠️⚠️ **조인 현황표는 표에서 직접 셉니다** — `v_join_open` 은
     0046 의 것이고, 그 위에 보기를 얹으면 붙여넣기 파일을 두 번째로
     붙여 넣을 때 0046 이 제 보기를 못 지웁니다 (`test-upgrade` ⑧ 이
     잡은 자리). 그 대가로 **조건이 두 곳**에 있으므로, 여기서
     **줄마다** 맞춰 봅니다.
     ⚠️⚠️ 총합만 보면 안 됩니다 — 한쪽이 더 세고 한쪽이 덜 세면
     **상쇄되어 엉뚱한 까닭으로 통과**합니다. 지역 · 날짜마다 봅니다. */
  const jmis = psql(anon +
    "select coalesce(string_agg(t, ' | '), '')::text from (" +
    "  select coalesce(a.region, b.region) || ' ' || " +
    "         coalesce(a.play_at, b.play_at)::text || ' 목록=' || " +
    "         coalesce(a.n::text, '없음') || ' 표=' || coalesce(b.n::text, '없음') as t" +
    "    from (select region, play_at, count(*)::int as n from v_join_open" +
    "           group by region, play_at) a" +
    "    full outer join v_join_count b" +
    "      on b.region = a.region and b.play_at = a.play_at" +
    "   where coalesce(a.n, -1) is distinct from coalesce(b.n, -1)" +
    ") x;" + back);
  ok("⚠️⚠️ 조인 현황표가 **줄마다 목록과 같다** (조건이 두 곳이라 꼭 봅니다)",
     jmis === "", jmis.slice(0, 200));
  /* ⚠️ 잰 것이 0줄이면 "잴 것이 없다" 로 초록입니다 — 실제로 센 줄이
     있는지 따로 봅니다 (인자가 없으면 0 으로 끝나는 검사를 만들지
     않습니다). */
  ok("  ⚠️ 맞춰 본 줄이 **0줄이 아니다** (잴 것이 0개면 실패입니다)",
     Number(psql(anon + "select count(*)::int from v_join_count;" + back)) > 0,
     "조인 현황표가 0줄입니다");

  /* ── ⑧ 공개 번호 ───────────────────────────────────────────────── */
  console.log("\n── ⑧ 공개 번호 — 배정 담당자 직통은 안 나갑니다");
  ok("업체가 번호를 안 적었으면 **사업자 전화번호**를 낸다 (제20조 제2항)",
     psql(anon + "select tel from v_teetime_open where id = '" + TEE + "';" + back) ===
     "031-000-0000", "다릅니다");
  psql(as(OWN) + "select edit_teetime(jsonb_build_object('id','" + TEE +
       "','tel','031-555-7777'));" + back);
  ok("업체가 적은 **예약 문의 번호**가 있으면 그것을 낸다",
     psql(anon + "select tel from v_teetime_open where id = '" + TEE + "';" + back) ===
     "031-555-7777", "다릅니다");
  /* ⚠️⚠️⚠️ 0013 이 `provider` 표에 안 넣은 그 번호입니다 */
  const leak = psql(anon + "select coalesce(string_agg(t.tel || ' ' || " +
    "coalesce(t.note,''), ' '), '') from v_teetime_open t;" + back);
  ok("⚠️⚠️⚠️ **배정 담당자 직통이 한 글자도 안 나온다** (0013)",
     leak.indexOf("010-9999-0000") < 0, leak.slice(0, 120));
  /* ⚠️⚠️ **RLS 는 읽기에서 에러를 안 냅니다 — 조용히 빈 결과를 줍니다.**
     처음에 `denied()` 로 재다가 "읽혔습니다" 로 떨어졌는데, 코드가 맞고
     **틀린 것은 검사**였습니다 (0052 에서 이미 밟은 자리). 줄 수를 셉니다.
     ⚠️ 그리고 **에러가 나는 자리와 0줄인 자리는 다른 자물쇠**이므로
     갈라서 봅니다 — 아래는 줄이 안 보이는 쪽입니다. */
  ok("  손님에게는 그 표가 **0줄**이다 (RLS 가 줄을 안 내줍니다)",
     psql(as(CUS) + "select count(*)::text from provider_contact " +
          "where provider_id = 'tt-ok';" + back) === "0", "보입니다");
  ok("  ⚠️ 그 업체 담당자에게는 보인다 (너무 넓게 막는 것도 고장입니다)",
     psql(as(OWN) + "select count(*)::text from provider_contact " +
          "where provider_id = 'tt-ok';" + back) === "1", "안 보입니다");

  /* ── ⑨ 알림 ────────────────────────────────────────────────────── */
  console.log("\n── ⑨ 알림 — 받는 사람 눈으로 셉니다");
  /* ⚠️ `obj_id` 로 좁혀 셉니다 — 갈래 전체를 세면 앞 검사가 만든 것이
     섞입니다 (0056 에서 밟은 자리). */
  ok("신청이 들어오면 **자리를 올린 담당자에게** 알림이 붙는다",
     psql(as(OWN) + "select count(*)::text from notice where kind = 'teebook' " +
          "and obj_id = '" + BK + "';" + back) === "1", "안 붙었습니다");
  ok("  ⚠️ **손님에게는 안 간다** (제가 한 일입니다)",
     psql(as(CUS) + "select count(*)::text from notice where kind = 'teebook' " +
          "and obj_id = '" + BK + "';" + back) === "0", "갔습니다");
  ok("처리하면 **신청하신 분에게** 알림이 붙는다",
     psql(as(CUS) + "select count(*)::text from notice where kind = 'teemoved' " +
          "and obj_id = '" + BK + "';" + back) === "1", "안 붙었습니다");
  /* ⚠️⚠️ 0050 은 본문 칸이 아예 없습니다 — 그래도 제목에 글자가 섞일 수
     있으므로 **손님이 적은 글이 안 담기는지** 봅니다. */
  const ntl = psql(as(OWN) + "select coalesce(string_agg(title, ' '), '') from notice " +
    "where kind in ('teebook','teemoved');" + back);
  ok("⚠️⚠️ 알림에 **손님이 적은 글 · 연락처가 한 글자도 없다**",
     ntl.indexOf("010-") < 0 && ntl.indexOf("처음 갑니다") < 0 && ntl.indexOf("손님하나") < 0,
     ntl.slice(0, 120));

  /* ── ⑩ 운영자가 가립니다 ───────────────────────────────────────── */
  console.log("\n── ⑩ 운영자가 가리는 길 (0046 이 빠뜨려 0049 를 따로 만든 자리)");
  const h0 = denied(as(OWN) +
    "select move_teetime(jsonb_build_object('id','" + TEE + "','why','제가 가려 봅니다'));" + back);
  ok("업체는 못 가린다", h0.no, "막지 않았습니다");
  const h1 = denied(as(ADM) + "select move_teetime(jsonb_build_object('id','" + TEE + "'));" + back);
  ok("까닭 없이는 못 가린다", h1.no, "막지 않았습니다");
  ok("운영자는 까닭과 함께 가린다",
     psql(as(ADM) + "select move_teetime(jsonb_build_object('id','" + TEE +
          "','why','검사로 가려 봅니다'));" + back) === "hidden", "못 했습니다");
  ok("  가려지면 공개 목록에서 빠진다",
     psql(anon + "select count(*)::text from v_teetime_open where id = '" + TEE + "';" + back) === "0",
     "남아 있습니다");
  const h2 = denied(as(ADM) +
    "select move_teetime(jsonb_build_object('id','" + TEE + "','why','또 가려 봅니다'));" + back);
  ok("⚠️ 이미 가려진 것을 또 가리면 **거절한다** (기록이 거짓이 되지 않게)",
     h2.no, "조용히 0줄로 끝냈습니다");

  /* ── ⑪ 신고 ───────────────────────────────────────────────────
     ⚠️⚠️⚠️ **이 줄이 2026-11-07 까지 없었습니다.** 0060 은 `teetime_id`
     칸을 더하고 `open_report` 도 고쳤는데, 0040 의 `report_target_ck`
     ("가리키는 칸 가운데 하나는 있어야 한다")를 **안 늘렸습니다** —
     그래서 티타임 자리를 신고하면 **표가 거절**했고, `js/adminrep.js`
     의 "티타임 자리 가리기" 가지는 한 번도 돌 수 없는 죽은 코드였습니다.
     ⚠️ 이 검사가 `open_report` 를 **안 눌러 봤기** 때문에 아무도
     몰랐습니다 (0061 의 검사가 같은 자리를 눌러서 드러났습니다).
     ⚠️ **칸을 더하는 날 그 칸으로 신고를 눌러 보세요** — check-doors 는
     `open_report` 를 부르는 화면이 있다고 세므로 못 잡습니다. */
  console.log("\n── ⑪ 신고 — 칸을 더했으면 report 의 check 도 늘어야 합니다");
  /* ⚠️ 가짜 자료도 **DB 가 받는 값**이어야 합니다 — 처음에 `kind:'field'`
     와 `play_at` · `seats` · `price` 로 적었다가 문에 거절당했습니다
     (이 저장소가 다섯 번째로 밟은 자리). 위의 ① 과 **같은 꼴**로 적습니다. */
  const TEE2 = psql(as(OWN) +
    "select open_teetime(jsonb_build_object('kind','booking','region','gyeonggi'," +
    "'course','신고될 골프장','playAt'," + DAY + ",'teeAt','07:00'," +
    "'slots','4','greenFee','120000'));" + back);
  const rp = allowed(as(CUS) + "select open_report(jsonb_build_object(" +
    "'kind','abuse','teetime','" + TEE2 + "','body','없는 자리로 보입니다'))::text;" + back);
  ok("⚠️⚠️ 티타임 자리를 **실제로 신고할 수 있다** (표의 check 가 거절하지 않습니다)",
     rp.yes && /^[0-9a-f-]{36}$/.test(rp.out), rp.out || rp.why);
  /* ⚠️ 앞 줄이 떨어졌으면 **여기서 터지지 않게** 합니다 — uuid 자리에
     undefined 가 들어가 psql 이 던지면 **남은 묶음이 통째로 안 돌고**,
     그 조용한 건너뜀을 통과로 읽게 됩니다 (작업 기억 — 건너뛴 묶음이
     있으면 "전부 초록" 이라고 말하지 않습니다). */
  const got = rp.yes
    ? psql(as(ADM) + "select coalesce(teetime_id::text,'(null)') from report " +
           "where id = '" + rp.out + "';" + back)
    : "(앞 줄이 떨어져서 못 쟀습니다)";
  ok("  그 칸에 **값이 실제로 들어간다** (운영자 화면이 그 칸을 읽습니다)",
     got === TEE2, got);
};

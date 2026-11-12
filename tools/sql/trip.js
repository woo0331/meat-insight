/* ════════════════════════════════════════════════════════════════════
   골프 여행 상품 — 눌러 봅니다 (0073)

   ⚠️⚠️⚠️ **여기서 가장 조심한 것은 「공개본과 수정본」입니다.**
   팔고 있는 상품을 고치면 **지금 팔리는 것은 그대로**여야 하고,
   수정본을 반려해도 **공개본이 그대로** 남아야 합니다. 그 둘이
   어긋나면 오타 하나를 고친 여행사의 상품이 목록에서 사라지거나,
   반대로 **심사도 안 거친 글이 손님에게 나갑니다.**

   ⚠️ 재는 것은 늘 **문**입니다 — `trip` · `tripphoto` 에는 GRANT 도
   정책도 **한 줄도 없습니다**(공개는 보기 · 쓰기는 문뿐). 표에 바로
   넣으면 자물쇠를 통째로 지나갑니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0073 골프 여행 상품 — 씨앗");
  /* ⚠️⚠️ 검사끼리 업체 id 가 부딪히면 **앞 검사가 만든 상태를 물려받아**
     엉뚱한 자리에서 떨어집니다 — 앞머리를 갈라 두고 이미 있으면 그
     자리에서 말합니다 (0051 에서 겪은 자리). */
  const taken = psql("select coalesce(string_agg(id, ','), '') from provider " +
    "where id in ('tpx-a','tpx-b')");
  ok("⚠️⚠️ 쓸 업체 id 가 **비어 있다** (다른 검사와 안 부딪힙니다)",
     taken === "", "이미 있습니다 — " + taken);

  const PRO = psql("insert into auth.users (email) values ('tpx-pro@x.test') returning id");
  const PR2 = psql("insert into auth.users (email) values ('tpx-pro2@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('tpx-cus@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('tpx-adm@x.test') returning id");
  psql("insert into provider (id, name, listed, state, is_test) values " +
       "('tpx-a','여행사가', true, 'approved', false)," +
       "('tpx-b','여행사나', true, 'approved', false) on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + PRO + "','provider','여행담당','tpx-a')," +
       "('" + PR2 + "','provider','다른담당','tpx-b')," +
       "('" + CUS + "','customer','손님', null)," +
       "('" + ADM + "','admin','여행 관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "provider_id = excluded.provider_id");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const J = o => JSON.stringify(o).replace(/'/g, "''");
  const open = (u, o) => as(u) + "select open_trip('" +
    J(Object.assign({ scope:"home", dest:"jeju", title:"제주 1박 2일 36홀",
                      body:"첫날 18홀, 둘째날 18홀입니다.", nights:1, days:2,
                      price_from:390000, incl:["숙박","36홀"], excl:["항공"] }, o)) +
    "'::jsonb)";

  console.log("\n── 0073 ① 올리는 길 — 자물쇠마다 다른 말로 거절하나");
  const says = {};
  const t1 = allowed(open(PRO, {}));
  ok("⚠️ 잴 것이 0개면 실패입니다 (승인된 여행사가 상품을 올릴 수 있다)",
     t1.yes && /^[0-9a-f-]{36}$/.test(String(t1.out).trim()), t1.why || t1.out);
  const TRIP = String(t1.out).trim();

  const n1 = denied(anon + "select open_trip('" + J({}) + "'::jsonb)");
  says.anon = n1.why;
  ok("비로그인은 못 올린다", n1.no, n1.why);
  const n2 = denied(open(CUS, {}));                     says.cus   = n2.why;
  ok("  업체가 아닌 분은 못 올린다", n2.no, n2.why);
  /* ⚠️⚠️ **값을 반드시 받습니다** — 비우면 화면이 "가격 문의" 를
     지어 적게 됩니다(0056 이 매물 값을 반드시 받는 그 까닭). */
  const n3 = denied(open(PRO, { price_from:0 }));       says.price = n3.why;
  ok("  ⚠️⚠️ 1인 최저가 0원은 거절한다", n3.no, n3.why);
  const n4 = denied(open(PRO, { nights:3, days:2 }));   says.span  = n4.why;
  ok("  ⚠️ 일수가 박수보다 적으면 거절한다", n4.no, n4.why);
  const n5 = denied(open(PRO, { scope:"somewhere" }));  says.scope = n5.why;
  ok("  모르는 갈래는 거절한다", n5.no, n5.why);
  const n6 = denied(open(PRO, { title:"짧" }));         says.title = n6.why;
  ok("  제목이 너무 짧으면 거절한다", n6.no, n6.why);
  /* ⚠️⚠️ **다른 자물쇠는 다른 말로** 거절해야 어느 것이 막았는지
     압니다 (같은 자물쇠가 두 번 걸리는 입력은 세는 자리에서 뺍니다). */
  const uniq = Object.keys(says).map(k => says[k]).filter(Boolean);
  ok("⚠️⚠️ 자물쇠마다 **다른 말**로 거절한다",
     new Set(uniq).size === uniq.length, JSON.stringify(says, null, 1));

  console.log("\n── 0073 ② 공개 보기 — 승인된 것만, 정지되면 그 순간 빠짐");
  ok("⚠️⚠️ 올린 직후에는 **손님에게 안 보인다** (심사 중)",
     psql(anon + "select count(*) from v_trip_open where id = '" + TRIP + "'") === "0");
  allowed(as(ADM) + "select move_trip('" +
          J({ id:TRIP, to:"approved" }) + "'::jsonb)");
  ok("  승인하면 손님 목록에 선다",
     psql(anon + "select count(*) from v_trip_open where id = '" + TRIP + "'") === "1");
  /* ⚠️ 업체 상태는 **문으로** 바꿉니다 — 표를 바로 고치면 0038 의
     트리거에 막혀 검사가 통째로 터집니다 (0064 에서 겪은 자리). */
  allowed(as(ADM) + "select set_provider_state('" +
          J({ id:"tpx-a", to:"suspended", why:"검사" }) + "'::jsonb)");
  ok("⚠️⚠️ 업체가 정지되면 **그 순간** 목록에서 빠진다",
     psql(anon + "select count(*) from v_trip_open where id = '" + TRIP + "'") === "0");
  allowed(as(ADM) + "select set_provider_state('" +
          J({ id:"tpx-a", to:"approved", why:"검사 되돌리기" }) + "'::jsonb)");
  ok("  되돌리면 다시 선다 (앞 검사가 만든 상태를 안 물려줍니다)",
     psql(anon + "select count(*) from v_trip_open where id = '" + TRIP + "'") === "1");

  console.log("\n── 0073 ③ 공개본과 수정본 — 팔던 상품이 안 사라지나");
  allowed(as(PRO) + "select edit_trip('" +
          J({ id:TRIP, scope:"home", dest:"jeju", title:"제주 2박 3일 54홀",
              body:"고친 일정입니다.", nights:2, days:3, price_from:490000,
              incl:["숙박","54홀"], excl:["항공"] }) + "'::jsonb)");
  ok("⚠️⚠️⚠️ 고쳐도 **지금 팔리는 제목이 그대로**다",
     psql(anon + "select title from v_trip_open where id = '" + TRIP + "'")
       === "제주 1박 2일 36홀",
     psql(anon + "select title from v_trip_open where id = '" + TRIP + "'"));
  ok("  수정본이 심사 대기로 들어간다",
     psql("select draft_state from trip where id = '" + TRIP + "'") === "pending");
  allowed(as(ADM) + "select review_trip_draft('" +
          J({ id:TRIP, to:"rejected", why:"일정이 안 맞습니다" }) + "'::jsonb)");
  ok("⚠️⚠️ 수정본을 반려해도 **공개본이 그대로**다",
     psql(anon + "select title from v_trip_open where id = '" + TRIP + "'")
       === "제주 1박 2일 36홀");
  ok("  반려 까닭이 남는다 (올린 분이 무엇이 문제였는지 압니다)",
     psql("select coalesce(draft_why,'') from trip where id = '" + TRIP + "'")
       === "일정이 안 맞습니다");
  const r1 = denied(as(ADM) + "select review_trip_draft('" +
                    J({ id:TRIP, to:"rejected" }) + "'::jsonb)");
  ok("  ⚠️ 까닭 없이는 반려 못 한다", r1.no, r1.why);
  allowed(as(PRO) + "select edit_trip('" +
          J({ id:TRIP, scope:"home", dest:"jeju", title:"제주 2박 3일 54홀",
              body:"다시 고친 일정입니다.", nights:2, days:3, price_from:490000,
              incl:["숙박","54홀"], excl:["항공"] }) + "'::jsonb)");
  allowed(as(ADM) + "select review_trip_draft('" +
          J({ id:TRIP, to:"approved" }) + "'::jsonb)");
  ok("⚠️⚠️ 수정본을 승인하면 **그때** 갈아 끼운다",
     psql(anon + "select title from v_trip_open where id = '" + TRIP + "'")
       === "제주 2박 3일 54홀");

  console.log("\n── 0073 ④ 남의 상품 · 운영자 자물쇠");
  const m1 = denied(as(PR2) + "select edit_trip('" +
                    J({ id:TRIP, scope:"home", dest:"jeju", title:"남의 상품",
                        body:"남이 고칩니다.", nights:1, days:2,
                        price_from:10000, incl:[], excl:[] }) + "'::jsonb)");
  ok("⚠️⚠️ 남의 업체 상품은 못 고친다", m1.no, m1.why);
  const m2 = denied(as(PRO) + "select move_trip('" +
                    J({ id:TRIP, to:"hidden", why:"내가 가립니다" }) + "'::jsonb)");
  ok("  여행사는 못 가린다 (운영자만)", m2.no, m2.why);
  const m3 = denied(as(ADM) + "select move_trip('" +
                    J({ id:TRIP, to:"hidden" }) + "'::jsonb)");
  ok("  ⚠️ 까닭 없이는 못 가린다", m3.no, m3.why);
  const m4 = denied(as(ADM) + "select move_trip('" +
                    J({ id:TRIP, to:"approved" }) + "'::jsonb)");
  ok("  ⚠️ 같은 상태로 옮기는 것은 거절한다 (조용히 성공하면 거짓말입니다)",
     m4.no, m4.why);

  console.log("\n── 0073 ⑤ 가리기 → 되돌리기");
  allowed(as(ADM) + "select move_trip('" +
          J({ id:TRIP, to:"hidden", why:"신고가 들어왔습니다" }) + "'::jsonb)");
  ok("가리면 손님에게 안 보인다",
     psql(anon + "select count(*) from v_trip_open where id = '" + TRIP + "'") === "0");
  /* ⚠️⚠️ **되돌리는 길이 없으면** 올린 분의 문이 전부 막혀 사장님이
     SQL 편집기를 여셔야 합니다 (0070 에서 중고 매물로 겪은 자리). */
  allowed(as(ADM) + "select move_trip('" + J({ id:TRIP, to:"restore" }) + "'::jsonb)");
  ok("⚠️⚠️ 되돌리면 **가리기 전 상태**로 돌아간다",
     psql("select state from trip where id = '" + TRIP + "'") === "approved",
     psql("select state from trip where id = '" + TRIP + "'"));

  console.log("\n── 0073 ⑥ 판매 중지 → 다시 판매");
  allowed(as(PRO) + "select close_trip('" + J({ id:TRIP }) + "'::jsonb)");
  ok("판매를 중지하면 그 자리에서 안 보인다",
     psql(anon + "select count(*) from v_trip_open where id = '" + TRIP + "'") === "0");
  allowed(as(PRO) + "select reopen_trip('" + J({ id:TRIP }) + "'::jsonb)");
  /* ⚠️⚠️ 되살린 상품은 **다시 심사**입니다 — 중지한 사이에 고친 것이
     있을 수 있으니 그대로 공개하면 안 봅니다. */
  ok("  다시 판매하면 **심사를 거칩니다** (바로 공개하지 않습니다)",
     psql("select state from trip where id = '" + TRIP + "'") === "pending",
     psql("select state from trip where id = '" + TRIP + "'"));
  allowed(as(ADM) + "select move_trip('" + J({ id:TRIP, to:"approved" }) + "'::jsonb)");

  console.log("\n── 0073 ⑦ 사진 — 경로는 문이 짓고, 승인 전에는 안 보인다");
  const p1 = allowed(as(PRO) + "select claim_trip_photo('" +
    J({ trip:TRIP, mime:"image/jpeg", bytes:"120000" }) + "'::jsonb)");
  ok("⚠️ 잴 것이 0개면 실패입니다 (사진 자리를 받는다)", p1.yes, p1.why);
  /* ⚠️⚠️⚠️ **경로를 화면이 못 짓습니다** — 문이 지어 돌려주고 표의
     check 가 그 꼴을 다시 봅니다 (0051 에서 세운 규칙). */
  ok("⚠️⚠️ 경로를 **문이 짓는다** (trip/<상품>/… 꼴)",
     psql("select count(*) from tripphoto where trip_id = '" + TRIP +
          "' and path like 'trip/" + TRIP + "/%'") === "1",
     psql("select coalesce(string_agg(path, ','), '') from tripphoto " +
          "where trip_id = '" + TRIP + "'"));
  ok("⚠️⚠️ 승인 뒤에 올린 사진은 **live 가 아니다** (심사를 거칩니다)",
     psql("select count(*) from tripphoto where trip_id = '" + TRIP +
          "' and live = false") === "1");
  ok("  그래서 공개 보기에 **한 줄도 안 나온다**",
     psql(anon + "select count(*) from v_trip_photo_public where trip_id = '" +
          TRIP + "'") === "0");
  const p2 = denied(as(PR2) + "select claim_trip_photo('" +
    J({ trip:TRIP, mime:"image/jpeg", bytes:"1000" }) + "'::jsonb)");
  ok("  남의 상품에는 못 붙인다", p2.no, p2.why);
  const p3 = denied(as(PRO) + "select claim_trip_photo('" +
    J({ trip:TRIP, mime:"application/pdf", bytes:"1000" }) + "'::jsonb)");
  ok("  사진이 아닌 것은 거절한다", p3.no, p3.why);

  console.log("\n── 0073 ⑧ 사진을 빼고 차례를 바꾸는 자리 (읽는 보기가 있나)");
  /* ⚠️⚠️⚠️ **이 보기가 없으면 사진 id 를 알 길이 없습니다** —
     `drop_trip_photo` · `order_trip_photo` 는 id 를 받는데 공개 보기는
     승인된 상품의 live 사진만 냅니다. 문만 서 있고 **읽는 자리가 없던**
     자리입니다 (0045 의 문의 답변과 같은 꼴). */
  const mine = psql(as(PRO) + "select count(*) from v_trip_photo_mine " +
                    "where trip_id = '" + TRIP + "'");
  ok("⚠️⚠️⚠️ 여행사가 **제 사진의 id 를 읽을 수 있다**", mine === "1", mine);
  ok("  남의 사진은 안 보인다",
     psql(as(PR2) + "select count(*) from v_trip_photo_mine") === "0");
  const PHID = psql(as(PRO) + "select id from v_trip_photo_mine " +
                    "where trip_id = '" + TRIP + "' limit 1");
  const d1 = denied(as(PR2) + "select drop_trip_photo('" +
                    J({ id:PHID }) + "'::jsonb)");
  ok("  남의 사진은 못 뺀다", d1.no, d1.why);
  const o1 = denied(as(PRO) + "select order_trip_photo('" +
                    J({ trip:TRIP, ids:[] }) + "'::jsonb)");
  ok("⚠️⚠️ 차례를 **일부만** 보내면 거절한다 (안 보낸 것이 0 이 되면 " +
     "그것이 대표가 됩니다)", o1.no, o1.why);
  const o2 = allowed(as(PRO) + "select order_trip_photo('" +
                     J({ trip:TRIP, ids:[PHID] }) + "'::jsonb)");
  ok("  빠짐없이 보내면 받는다", o2.yes, o2.why);
  /* ⚠️⚠️⚠️ **빼는 길이 둘입니다 — 갈라서 재야 합니다.**
     ① 아직 심사를 안 거친 사진(live = false)은 **그 자리에서 지웁니다**
        (손님에게 한 번도 안 보인 사진이라 남길 까닭이 없습니다)
     ② 지금 보이고 있는 사진(live)은 **지우지 않고 `drop_pending`** 으로
        표시만 합니다 — 안 그러면 "공개본은 그대로" 가 글자에만 남고
        사진은 그 자리에서 바뀝니다.
     ⚠️ 처음에 ②만 재다가 **멀쩡한 문을 실패로** 잡았습니다(그 사진은
       ①이었습니다) — 검사가 틀렸습니다. */
  allowed(as(PRO) + "select drop_trip_photo('" + J({ id:PHID }) + "'::jsonb)");
  ok("⚠️⚠️ 심사 전 사진은 **그 자리에서 지운다** (한 번도 안 보인 사진)",
     psql("select count(*) from tripphoto where id = '" + PHID + "'") === "0",
     psql("select count(*) from tripphoto where id = '" + PHID + "'"));

  /* ② 쪽 — 승인을 거쳐 **지금 보이는** 사진을 하나 만듭니다.
     ⚠️ `move_trip('approved')` 가 그때까지 올라온 사진을 live 로
     올립니다(0073 ③). 그래서 **판매 중지 → 사진 → 다시 승인** 으로
     그 자리를 만듭니다. */
  allowed(as(PRO) + "select close_trip('" + J({ id:TRIP }) + "'::jsonb)");
  allowed(as(PRO) + "select reopen_trip('" + J({ id:TRIP }) + "'::jsonb)");
  allowed(as(PRO) + "select claim_trip_photo('" +
    J({ trip:TRIP, mime:"image/jpeg", bytes:"120000" }) + "'::jsonb)");
  allowed(as(ADM) + "select move_trip('" + J({ id:TRIP, to:"approved" }) + "'::jsonb)");
  const LIVE = psql(as(PRO) + "select id from v_trip_photo_mine " +
                    "where trip_id = '" + TRIP + "' and live limit 1");
  ok("⚠️ 승인하면 그때까지 올라온 사진이 **보이기 시작한다**",
     LIVE !== "" && psql(anon + "select count(*) from v_trip_photo_public " +
       "where trip_id = '" + TRIP + "'") === "1", LIVE);
  allowed(as(PRO) + "select drop_trip_photo('" + J({ id:LIVE }) + "'::jsonb)");
  ok("⚠️⚠️ 보이는 사진은 **지우지 않고** 빼는 중으로 표시한다",
     psql("select coalesce(drop_pending::text,'') from tripphoto where id = '" +
          LIVE + "'") === "true",
     psql("select coalesce(drop_pending::text,'') from tripphoto where id = '" +
          LIVE + "'"));
  const d2 = denied(as(PRO) + "select drop_trip_photo('" +
                    J({ id:LIVE }) + "'::jsonb)");
  ok("  두 번 빼면 거절한다 (조용히 성공하면 기록이 거짓이 됩니다)",
     d2.no, d2.why);

  /* ══════════════════════════════════════════════════════════════
     0077 출발일 · 출발 가능 기간

     ⚠️⚠️⚠️ **담는 꼴이 셋**입니다(확정 출발일 · 기간 · 아직 안 정함).
     거르는 값은 `months`(text[])이고 **DB 가 세어서** 냅니다 — 화면이
     세게 두면 화면마다 다른 달을 말하게 됩니다.

     ⚠️⚠️ **아직 안 정한 상품은 `months` 가 빈 배열**이라 출발 월로
     좁히면 빠집니다 — 그것이 맞습니다(그 달에 출발한다고 말할 근거가
     없습니다). 빈 배열인지를 **세어서** 봅니다.
     ══════════════════════════════════════════════════════════════ */
  /* ══════════════════════════════════════════════════════════════
     사진 — **재심사 중인 것이 공개본을 바꾸지 않는가** (지시서 7번)

     ⚠️⚠️⚠️ **사진 칸이 그려지는 것으로 「된다」고 판정하지 않습니다.**
     여기서 재는 것은 올리기 · 저장 · 공개 조회 · 빼기 · **권한** 넷이
     DB 에서 실제로 갈리는가입니다.

     ⚠️⚠️ 가장 위험한 자리 — 팔고 있는 상품에 **새 사진을 올린 순간**
     그것이 손님 화면에 나가면 **심사도 안 거친 그림이 공개**됩니다.
     반대로 올렸다고 **기존 승인본이 사라지면** 멀쩡히 팔리던 상품이
     사진 0장으로 떨어집니다. 그 둘을 **갈라서** 눌러 봅니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 0073 사진 — 재심사 중인 것이 공개본을 바꾸는가 (7번)");
  {
    /* 지금 이 상품은 approved 이고 live 사진이 **0장**입니다
       (바로 위에서 하나 올리고 빼는 중으로 표시했습니다). 눈에 보이는
       상태를 **세어서** 적어 둡니다 — 갯수를 박지 않습니다. */
    const before = psql(anon + "select count(*) from v_trip_photo_public " +
                        "where trip_id = '" + TRIP + "'");
    const beforeN = psql(anon + "select photo_n::text from v_trip_open " +
                         "where id = '" + TRIP + "'");
    /* 새 사진을 하나 올립니다 — 승인된 상품에 올리면 `live` 가 **거짓** */
    const nw = allowed(as(PRO) + "select claim_trip_photo('" +
      J({ trip:TRIP, mime:"image/jpeg", bytes:"90000" }) + "'::jsonb)");
    ok("⚠️ 잴 것이 0개면 실패입니다 (새 사진이 올라갔는가)", nw.yes, nw.why);
    ok("⚠️⚠️⚠️ 새로 올린 사진은 **심사 전**이다 (live = false)",
       psql(as(PRO) + "select count(*) from v_trip_photo_mine where trip_id = '" +
            TRIP + "' and not live") === "1",
       psql(as(PRO) + "select count(*) from v_trip_photo_mine where trip_id = '" +
            TRIP + "' and not live"));
    ok("⚠️⚠️⚠️ **공개 목록이 안 바뀐다** (심사도 안 거친 그림이 안 나갑니다)",
       psql(anon + "select count(*) from v_trip_photo_public where trip_id = '" +
            TRIP + "'") === before,
       "전 " + before + " · 후 " + psql(anon +
         "select count(*) from v_trip_photo_public where trip_id = '" + TRIP + "'"));
    ok("  ⚠️⚠️ **카드의 사진 수도 안 바뀐다** (기존 승인본이 안 사라집니다)",
       psql(anon + "select photo_n::text from v_trip_open where id = '" +
            TRIP + "'") === beforeN,
       "전 " + beforeN + " · 후 " + psql(anon +
         "select photo_n::text from v_trip_open where id = '" + TRIP + "'"));
    /* ⚠️⚠️ 여행사는 **제 심사 중 사진의 id 를 봅니다** — 안 보이면 빼거나
       차례를 바꿀 길이 없습니다(0073 이 `v_trip_photo_mine` 을 낸 까닭). */
    const NEWID = psql(as(PRO) + "select id from v_trip_photo_mine where trip_id = '" +
                       TRIP + "' and not live limit 1");
    ok("  여행사는 심사 중 사진의 **id 를 읽는다**",
       /^[0-9a-f-]{36}$/.test(NEWID), NEWID);
    /* ⚠️⚠️⚠️ **권한** — 남은 그 사진을 못 보고 못 뺍니다 */
    ok("⚠️⚠️ **남의 여행사는 그 사진이 안 보인다**",
       psql(as(PR2) + "select count(*) from v_trip_photo_mine where id = '" +
            NEWID + "'") === "0");
    const dOther = denied(as(PR2) + "select drop_trip_photo('" +
                          J({ id:NEWID }) + "'::jsonb)");
    ok("  남의 여행사는 **못 뺀다**", dOther.no, dOther.why);
    const dCus = denied(as(CUS) + "select drop_trip_photo('" +
                        J({ id:NEWID }) + "'::jsonb)");
    ok("  손님도 못 뺀다", dCus.no, dCus.why);
    const dAnon = denied(anon + "select drop_trip_photo('" +
                         J({ id:NEWID }) + "'::jsonb)");
    ok("  비로그인은 문을 아예 못 부른다", dAnon.no, dAnon.why);
    /* ⚠️⚠️ **심사 전 사진은 그 자리에서 지웁니다** — 한 번도 안 보인
       그림이라 기록에 남길 것이 없습니다(0073 ⑧ 에서 세운 규칙). */
    allowed(as(PRO) + "select drop_trip_photo('" + J({ id:NEWID }) + "'::jsonb)");
    ok("⚠️ 올린 분은 빼고, **심사 전 사진은 줄째 사라진다**",
       psql("select count(*) from tripphoto where id = '" + NEWID + "'") === "0",
       psql("select count(*) from tripphoto where id = '" + NEWID + "'"));
    ok("  빼고 나서도 **공개 목록이 그대로**다",
       psql(anon + "select count(*) from v_trip_photo_public where trip_id = '" +
            TRIP + "'") === before);
    /* ⚠️⚠️⚠️ **승인해야 비로소 보입니다** — 다시 올리고 승인을 거칩니다.
       ⚠️ `move_trip` 은 **같은 상태로 못 옮깁니다**("이미 그 상태입니다") —
       지금 이 상품은 이미 approved 라, 그냥 승인을 부르면 **거절당하고
       아무 일도 안 일어납니다**. 처음에 그렇게 적어 멀쩡한 코드를 실패로
       잡았습니다(검사가 틀린 자리). 판매 중지 → 다시 판매로 **심사 중**
       으로 내린 뒤 승인합니다(이 파일이 ⑧ 에서 쓴 그 차례). */
    allowed(as(PRO) + "select close_trip('" + J({ id:TRIP }) + "'::jsonb)");
    allowed(as(PRO) + "select reopen_trip('" + J({ id:TRIP }) + "'::jsonb)");
    allowed(as(PRO) + "select claim_trip_photo('" +
      J({ trip:TRIP, mime:"image/jpeg", bytes:"90000" }) + "'::jsonb)");
    const mv = allowed(as(ADM) + "select move_trip('" +
      J({ id:TRIP, to:"approved" }) + "'::jsonb)");
    ok("⚠️ 잴 것이 0개면 실패입니다 (승인이 실제로 돌았는가)", mv.yes, mv.why);
    ok("⚠️⚠️ **승인을 거치면** 그때 공개 목록에 들어온다",
       Number(psql(anon + "select count(*) from v_trip_photo_public " +
                   "where trip_id = '" + TRIP + "'")) === Number(before) + 1,
       "전 " + before + " · 후 " + psql(anon +
         "select count(*) from v_trip_photo_public where trip_id = '" + TRIP + "'"));
  }

  console.log("\n── 0077 출발일 · 출발 가능 기간");
  const D1 = psql("select to_char(kst_today() + 30, 'YYYY-MM-DD')");
  const D2 = psql("select to_char(kst_today() + 60, 'YYYY-MM-DD')");
  const M1 = D1.slice(0, 7);
  const M2 = D2.slice(0, 7);

  const sd = (u, o) => as(u) + "select set_trip_depart('" +
    J(Object.assign({ trip:TRIP }, o)) + "'::jsonb)";

  /* ① 자물쇠마다 다른 말로 거절하나 */
  const dsay = {};
  const e1 = denied(sd(PRO, { kind:"dates", dates:[] }));
  dsay.empty = e1.why;
  ok("⚠️ 확정 출발일인데 **빈 목록**이면 거절한다", e1.no, e1.why);
  const e2 = denied(sd(PRO, { kind:"dates", dates:["2020-01-01"] }));
  dsay.past = e2.why;
  ok("  **지난 날짜**는 거절한다 (고를 수 없는 날을 목록에 세우지 않습니다)",
     e2.no, e2.why);
  const e3 = denied(sd(PRO, { kind:"range", from:D2, to:D1 }));
  dsay.rev = e3.why;
  ok("  **거꾸로 된 기간**은 거절한다", e3.no, e3.why);
  const e4 = denied(sd(PR2, { kind:"dates", dates:[D1] }));
  dsay.other = e4.why;
  ok("⚠️⚠️ **남의 상품**에는 못 넣는다", e4.no, e4.why);
  const e5 = denied(sd(CUS, { kind:"dates", dates:[D1] }));
  dsay.cus = e5.why;
  ok("  손님은 못 넣는다", e5.no, e5.why);
  const e6 = denied(anon + "select set_trip_depart('" +
                    J({ trip:TRIP, kind:"none" }) + "'::jsonb)");
  dsay.anon = e6.why;
  ok("  비로그인은 문을 아예 못 부른다", e6.no, e6.why);
  /* ⚠️⚠️ **같은 자물쇠에 두 번 걸리는 입력을 둘로 세지 않습니다** —
     세려는 뜻은 "**다른** 자물쇠가 다른 말을 하는가" 입니다. */
  const dvals = Object.keys(dsay).map(k => dsay[k]);
  ok("⚠️⚠️ 자물쇠마다 **다른 말**로 거절한다",
     new Set(dvals).size === dvals.length,
     JSON.stringify(dsay));

  /* ② 확정 출발일 — 달을 **DB 가 세어서** 내나 */
  allowed(sd(PRO, { kind:"dates", dates:[D1, D2] }));
  const mg = psql(as(PRO) + "select coalesce(array_to_string(months, ','), '') " +
                  "from v_trip_mine where id = '" + TRIP + "'");
  ok("⚠️⚠️ 달을 **DB 가 세어서** 낸다 (화면이 세면 화면마다 달라집니다)",
     mg.split(",").sort().join(",") === [M1, M2].sort().join(","),
     mg + " ← " + D1 + " · " + D2);
  ok("  가장 가까운 출발일을 같이 낸다",
     psql(as(PRO) + "select coalesce(depart_next::text,'') from v_trip_mine " +
          "where id = '" + TRIP + "'") === D1,
     psql(as(PRO) + "select coalesce(depart_next::text,'') from v_trip_mine " +
          "where id = '" + TRIP + "'"));
  ok("  넣은 날짜 수를 센다",
     psql(as(PRO) + "select date_n::text from v_trip_mine where id = '" +
          TRIP + "'") === "2");

  /* ③ **통째로 갈아 끼웁니다** — ⚠️ 더하기가 아닙니다. 빠뜨린 날짜가
     조용히 남아 있으면 손님이 없는 날에 문의하십니다. */
  allowed(sd(PRO, { kind:"dates", dates:[D2] }));
  ok("⚠️⚠️⚠️ 보낸 배열로 **통째로 갈아 끼운다** (더하기가 아닙니다)",
     psql(as(PRO) + "select date_n::text from v_trip_mine where id = '" +
          TRIP + "'") === "1" &&
     psql(as(PRO) + "select coalesce(depart_next::text,'') from v_trip_mine " +
          "where id = '" + TRIP + "'") === D2,
     psql(as(PRO) + "select date_n::text from v_trip_mine where id = '" + TRIP + "'"));

  /* ④ 기간 */
  allowed(sd(PRO, { kind:"range", from:D1, to:D2 }));
  const mg2 = psql(as(PRO) + "select coalesce(array_to_string(months, ','), '') " +
                   "from v_trip_mine where id = '" + TRIP + "'");
  ok("⚠️ 기간으로 바꾸면 **그 사이의 달이 전부** 나온다",
     mg2.indexOf(M1) >= 0 && mg2.indexOf(M2) >= 0, mg2);
  ok("⚠️⚠️ 기간으로 바꾸면 **확정 출발일 줄이 사라진다** (두 꼴이 섞이지 않게)",
     psql(as(PRO) + "select date_n::text from v_trip_mine where id = '" +
          TRIP + "'") === "0",
     psql(as(PRO) + "select date_n::text from v_trip_mine where id = '" + TRIP + "'"));

  /* ⑤ 아직 안 정함 — ⚠️⚠️ `months` 가 **빈 배열**이어야 출발 월
     거르개에서 빠집니다. null 이면 `cs` 가 어떻게 돌지 알 수 없습니다. */
  allowed(sd(PRO, { kind:"none" }));
  ok("⚠️⚠️⚠️ 아직 안 정하면 `months` 가 **빈 배열**이다 (출발 월로 좁히면 빠집니다)",
     psql(as(PRO) + "select coalesce(array_length(months,1)::text, '0') " +
          "from v_trip_mine where id = '" + TRIP + "'") === "0" &&
     psql(as(PRO) + "select (months is not null)::text from v_trip_mine " +
          "where id = '" + TRIP + "'") === "true",
     psql(as(PRO) + "select coalesce(months::text,'(null)') from v_trip_mine " +
          "where id = '" + TRIP + "'"));

  /* ⑥ 공개 보기에도 **같은 값**이 나오나 — ⚠️ 안 나오면 손님 화면의
     거르개가 영원히 0건입니다(에러 한 줄 없이). */
  allowed(sd(PRO, { kind:"dates", dates:[D1] }));
  const pubm = psql(anon + "select coalesce(array_to_string(months,','),'') " +
                    "from v_trip_open where id = '" + TRIP + "'");
  ok("⚠️⚠️ **공개 보기에도** 달과 가장 가까운 출발일이 나온다",
     pubm === M1 &&
     psql(anon + "select coalesce(depart_next::text,'') from v_trip_open " +
          "where id = '" + TRIP + "'") === D1,
     pubm);
  ok("  `months=cs` 로 **실제로 걸린다** (화면이 보내는 그 물음)",
     psql(anon + "select count(*) from v_trip_open where id = '" + TRIP +
          "' and months @> array['" + M1 + "']") === "1");

  /* ⑦ 공개 날짜 보기 — ⚠️ 지난 날짜는 **안 냅니다**(고를 수 없는 날) */
  psql("insert into tripdate (trip_id, depart_on) values ('" + TRIP +
       "', kst_today() - 5) on conflict do nothing");
  ok("⚠️ 공개 날짜 보기는 **지난 날짜를 안 낸다**",
     psql(anon + "select count(*) from v_trip_date_public where trip_id = '" +
          TRIP + "'") === "1" &&
     psql("select count(*) from tripdate where trip_id = '" + TRIP + "'") === "2",
     psql(anon + "select count(*) from v_trip_date_public where trip_id = '" +
          TRIP + "'"));
  /* ⚠️⚠️ **제 것만** 보입니다 — 남의 상품 날짜를 읽으면 안 됩니다 */
  ok("⚠️⚠️ `v_trip_date_mine` 은 **제 상품 것만** 낸다",
     psql(as(PR2) + "select count(*) from v_trip_date_mine where trip_id = '" +
          TRIP + "'") === "0",
     psql(as(PR2) + "select count(*) from v_trip_date_mine where trip_id = '" +
          TRIP + "'"));
  /* ⑧ 표에 바로 못 씁니다 */
  const dw = denied(as(PRO) + "insert into tripdate (trip_id, depart_on) " +
                    "values ('" + TRIP + "', kst_today() + 90)");
  ok("⚠️⚠️ `tripdate` 에도 **바로 못 넣는다** (문이 유일한 길입니다)",
     dw.no, dw.why);

  console.log("\n── 0073 ⑨ 표에 바로 쓰는 길이 없나");
  const w1 = denied(as(PRO) + "insert into trip (provider_id, by_user, scope, " +
    "dest, title, body, nights, days, price_from) values ('tpx-a','" + PRO +
    "','home','jeju','표에 바로','바로 넣습니다',1,2,10000)");
  ok("⚠️⚠️ 여행사도 표에 **바로 못 넣는다** (문이 유일한 길입니다)",
     w1.no, w1.why);
  const w2 = denied(anon + "select count(*) from trip");
  ok("  비로그인은 표를 **아예 못 읽는다**", w2.no, w2.why);
  const w3 = denied(as(CUS) + "select count(*) from trip");
  ok("  손님도 표를 아예 못 읽는다 (공개는 보기 하나뿐)", w3.no, w3.why);

  psql("select become(null); reset role;");
};

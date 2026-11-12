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

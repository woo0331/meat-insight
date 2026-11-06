/* ════════════════════════════════════════════════════════════════════
   중고 직거래 매물 — 눌러 봅니다 (0056)

   ⚠️⚠️⚠️ **연락처가 수락만으로 열리지 않는지**가 여기서 가장 중요한
   것입니다 (개인정보보호법 제17조 제2항). 조인에서 세운 세 겹을 그대로
   베꼈으니, **셋을 따로** 눌러 봅니다 —
     ① 공개 보기에 칸이 **아예 없음**
     ② 표의 칸 단위 GRANT 에서 뺌
     ③ 연락처 보기의 `case` 가 **각자 누른 것만** 냄
   하나만 보고 "막혔다" 고 읽으면 나머지 둘이 장식인지 알 수 없습니다.

   ⚠️⚠️ 재는 것은 늘 **문**입니다. 표에 바로 insert 하면 자물쇠를 통째로
   지나가고 그 초록은 아무 뜻이 없습니다 ("10분에 다섯 건" 자리).

   ⚠️ 쓰는 id 앞머리는 `ls-` 입니다 — 다른 검사와 부딪히면 조용히
   물려받아 엉뚱한 곳에서 떨어집니다 (0051 에서 겪었습니다).
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0056 중고 직거래 — 씨앗");
  const SEL  = psql("insert into auth.users (email) values ('ls-sel@x.test') returning id");
  const BUY  = psql("insert into auth.users (email) values ('ls-buy@x.test') returning id");
  const BUY2 = psql("insert into auth.users (email) values ('ls-buy2@x.test') returning id");
  const NOSY = psql("insert into auth.users (email) values ('ls-nosy@x.test') returning id");
  const ADM  = psql("insert into auth.users (email) values ('ls-adm@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + SEL  + "','customer','파는 사람')," +
       "('" + BUY  + "','customer','사는 사람')," +
       "('" + BUY2 + "','customer','또 사는 사람')," +
       "('" + NOSY + "','customer','남')," +
       "('" + ADM  + "','admin','중고 관리자') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const J    = o => JSON.stringify(o).replace(/'/g, "''");
  const nowIso = psql("select now()");

  const put = (who, extra) => as(who) + "select open_listing('" +
    J(Object.assign({ sub:"us-driver", region:"seoul", title:"드라이버 팝니다",
                      body:"2년 쓴 드라이버입니다", price:"350000", cond:"good",
                      contact:"010-7000-0000", agree_at:nowIso }, extra)) + "'::jsonb)";
  const ask = (who, lid, extra) => as(who) + "select ask_listing('" +
    J(Object.assign({ listing_id:lid, contact:"010-8000-0000",
                      msg:"사고 싶습니다", agree_at:nowIso }, extra)) + "'::jsonb)";
  const mv  = (who, aid, st) => as(who) + "select move_listingask('" +
    J({ id:aid, state:st }) + "'::jsonb)";
  const shr = (who, aid, on) => as(who) + "select share_listingcontact('" +
    J(on ? { id:aid, on:true, agree_at:nowIso } : { id:aid, on:false }) + "'::jsonb)";

  // ── ① 올립니다 ────────────────────────────────────────────────
  console.log("\n── 매물을 올립니다");
  const r1 = allowed(put(SEL, {}));
  ok("로그인하면 매물을 올릴 수 있다", r1.yes && /^[0-9a-f-]{36}$/.test(r1.out),
     r1.out || r1.why);
  const LID = r1.out;
  const anonPut = denied(anon + "select open_listing('" +
    J({ sub:"us-iron", region:"seoul", title:"아이언", body:"팝니다다",
        price:"1", cond:"good", contact:"010-1", agree_at:nowIso }) + "'::jsonb)");
  ok("비로그인은 못 올린다", anonPut.no, anonPut.why);

  console.log("\n── 자물쇠마다 다른 말로 거절합니다");
  /* ⚠️⚠️ **재려는 자물쇠 하나만 틀리게 하고 나머지는 전부 올바르게.**
     조인에서 날짜만 틀리게 넣고 제목을 빼 두었더니 제목 자물쇠가 먼저
     막아서, "여덟이 다른 말로 거절한다" 가 떨어졌습니다. */
  const says = {};
  const d = (k, extra) => { const x = denied(put(SEL, extra)); says[k] = x.why; return x; };
  ok("물건 종류가 없으면 막힌다", d("sub", { sub:"" }).no, says.sub);
  ok("지역이 없으면 막힌다", d("region", { region:"" }).no, says.region);
  ok("제목이 없으면 막힌다", d("title", { title:"" }).no, says.title);
  ok("설명이 없으면 막힌다", d("body", { body:"" }).no, says.body);
  /* ⚠️⚠️ **값을 비우면 막힙니다** — 비워 두면 화면이 "협의" 를 지어
     적게 됩니다 (절대 규칙 1). 0 은 무료라 **됩니다**. */
  ok("값이 없으면 막힌다 (협의를 지어 적지 않습니다)",
     d("price", { price:"" }).no, says.price);
  ok("값이 음수면 막힌다", d("neg", { price:"-1" }).no, says.neg);
  ok("물건 상태가 없으면 막힌다", d("cond", { cond:"" }).no, says.cond);
  ok("모르는 물건 상태는 막힌다", d("cond2", { cond:"zzz" }).no, says.cond2);
  ok("연락처가 없으면 막힌다", d("contact", { contact:"" }).no, says.contact);
  const dAg = denied(as(SEL) + "select open_listing('" +
    J({ sub:"us-iron", region:"seoul", title:"동의 없이", body:"올려 봅니다",
        price:"1000", cond:"good", contact:"010-1" }) + "'::jsonb)");
  says.agree = dAg.why;
  ok("동의 시각이 없으면 막힌다 (제15조 제2항)", dAg.no, dAg.why);
  /* ⚠️ 같은 자물쇠에 두 번 걸리는 것은 **세는 자리에서 뺍니다** — 모르는
     상태와 빈 상태는 다른 `if` 라 말이 달라야 하고, 음수와 범위 초과는
     같은 `if` 입니다 (2026-11-05 에 같은 자물쇠를 둘로 세어 떨어졌습니다). */
  const uniq = new Set(Object.values(says));
  ok("⚠️ 자물쇠들이 **서로 다른 말**로 거절한다",
     uniq.size === Object.keys(says).length, JSON.stringify(says));

  /* ⚠️ 0 은 됩니다 — 무료로 나누시는 자리입니다 (너무 넓게 막는 것도 고장) */
  const free = allowed(put(SEL, { price:"0", title:"무료로 나눔" }));
  ok("⚠️ 값 0 은 **됩니다** (무료로 나눔 — 너무 넓게 막지 않습니다)", free.yes,
     free.out || free.why);

  // ── ② 공개 보기 ───────────────────────────────────────────────
  console.log("\n── 공개 목록 (v_listing_open)");
  const seeAnon = allowed(anon + "select count(*) from v_listing_open where id = '" + LID + "'");
  ok("비로그인도 매물을 본다 (크롤러도 봅니다)", seeAnon.yes && seeAnon.out === "1",
     seeAnon.out || seeAnon.why);
  const cols = psql("select string_agg(column_name, ',' order by column_name) " +
    "from information_schema.columns where table_name = 'v_listing_open'");
  ok("⚠️⚠️ 공개 보기에 contact 칸이 **없다** (있는데 빈 것과 다릅니다)",
     cols.indexOf("contact") < 0, cols);
  ok("⚠️ 공개 보기에 by_user 칸도 **없다** (누가 올렸는지는 공개가 아닙니다)",
     cols.indexOf("by_user") < 0, cols);
  ok("  문의 수는 칸이 아니라 **세어서** 냅니다", cols.indexOf("ask_n") >= 0, cols);
  ok("  값 · 물건 상태 · 택배 여부가 목록에 나온다",
     cols.indexOf("price") >= 0 && cols.indexOf("cond") >= 0 &&
     cols.indexOf("ship") >= 0, cols);

  // ── ③ 칸 GRANT ────────────────────────────────────────────────
  console.log("\n── 칸 단위 GRANT (표에서 연락처를 못 읽습니다)");
  const myRow = allowed(as(SEL) + "select title from listing where id = '" + LID + "'");
  ok("내 매물 줄은 보인다", myRow.yes && myRow.out.indexOf("드라이버") >= 0,
     myRow.out || myRow.why);
  const myC = denied(as(SEL) + "select contact from listing where id = '" + LID + "'");
  ok("⚠️⚠️ **제 매물이라도 표에서 연락처를 못 읽는다** (칸 GRANT)",
     myC.no, myC.why);
  /* ⚠️⚠️ 안 준 칸을 `where` 절에 쓰면 0줄이 아니라 **질의가 통째로
     거절**됩니다 — 0050 · 0052 에서 두 번 밟은 자리입니다. 줄이
     보이는가와 이것은 **다른 자물쇠**라 갈라서 잽니다. */
  const whereC = denied(as(SEL) + "select count(*) from listing where contact = '010-7000-0000'");
  ok("  ⚠️ 안 준 칸을 조건에 쓰면 **질의가 거절된다** (0줄이 아닙니다)",
     whereC.no, whereC.why);

  console.log("\n── RLS (줄)");
  const nosy = allowed(as(NOSY) + "select count(*) from listing where id = '" + LID + "'");
  ok("남은 내 매물 줄을 못 본다 (0줄)", nosy.yes && nosy.out === "0",
     nosy.out || nosy.why);
  const admSee = allowed(as(ADM) + "select count(*) from listing where id = '" + LID + "'");
  ok("운영자는 본다 (가려야 하므로)", admSee.yes && admSee.out === "1",
     admSee.out || admSee.why);

  // ── ④ 문의 ───────────────────────────────────────────────────
  console.log("\n── 사겠다고 말을 겁니다");
  const a1 = allowed(ask(BUY, LID, {}));
  ok("문의를 보낼 수 있다", a1.yes && /^[0-9a-f-]{36}$/.test(a1.out), a1.out || a1.why);
  const AID = a1.out;
  const mine = denied(ask(SEL, LID, {}));
  ok("⚠️ **제 매물에는 제가 문의할 수 없다**", mine.no, mine.why);
  const twice = denied(ask(BUY, LID, {}));
  ok("⚠️ 같은 매물에 두 번은 막힌다 (표의 unique — 말을 사람 말로 바꿔 냅니다)",
     twice.no && twice.why.indexOf("이미") >= 0, twice.why);

  // ── ⑤ 연락처 — 수락만으로 열리지 않는가 ──────────────────────
  console.log("\n── ⚠️⚠️⚠️ 연락처는 수락만으로 안 열립니다 (제17조 제2항)");
  const before = allowed(as(BUY) + "select count(*) from v_listing_contact " +
    "where ask_id = '" + AID + "'");
  ok("수락 전에는 연락처 보기에 줄이 없다", before.yes && before.out === "0",
     before.out || before.why);
  const acc = allowed(mv(SEL, AID, "accepted"));
  ok("파는 분이 받아들일 수 있다", acc.yes && acc.out === "accepted", acc.out || acc.why);
  /* ⚠️⚠️⚠️ **여기가 핵심입니다.** 수락했는데도 둘 다 null 이어야 합니다 */
  const bothNull = psql(as(BUY) + "select coalesce(seller_contact,'(없음)') || '/' || " +
    "coalesce(buyer_contact,'(없음)') from v_listing_contact where ask_id = '" + AID + "'");
  ok("⚠️⚠️⚠️ **수락만으로는 둘 다 비어 있다** (수락은 '팔겠다' 이지 " +
     "'번호를 줘도 좋다' 가 아닙니다)",
     bothNull === "(없음)/(없음)", bothNull);

  console.log("\n── 각자 제 것만 엽니다");
  const s1 = allowed(shr(SEL, AID, true));
  ok("파는 분이 제 번호를 연다", s1.yes && s1.out === "seller_shared", s1.out || s1.why);
  const half = psql(as(BUY) + "select coalesce(seller_contact,'(없음)') || '/' || " +
    "coalesce(buyer_contact,'(없음)') from v_listing_contact where ask_id = '" + AID + "'");
  ok("⚠️⚠️ 한쪽만 열어도 **그쪽 것만** 간다 (맞바꾸기를 강요하지 않습니다)",
     half === "010-7000-0000/(없음)", half);
  const s2 = allowed(shr(BUY, AID, true));
  ok("문의하신 분도 제 번호를 연다", s2.yes && s2.out === "buyer_shared", s2.out || s2.why);
  const both = psql(as(SEL) + "select coalesce(seller_contact,'(없음)') || '/' || " +
    "coalesce(buyer_contact,'(없음)') from v_listing_contact where ask_id = '" + AID + "'");
  ok("  둘 다 열면 둘 다 간다", both === "010-7000-0000/010-8000-0000", both);
  /* ⚠️ 철회권 — 다시 닫을 수 있어야 합니다. 그리고 **닫을 때는 동의
     시각을 안 받습니다** (받으면 철회를 막는 꼴입니다). */
  const off = allowed(shr(SEL, AID, false));
  ok("⚠️ 다시 닫을 수 있다 (철회권 · 닫을 때는 동의를 안 받습니다)",
     off.yes && off.out === "seller_hidden", off.out || off.why);
  const afterOff = psql(as(BUY) + "select coalesce(seller_contact,'(없음)') " +
    "from v_listing_contact where ask_id = '" + AID + "'");
  ok("  닫으면 그 번호가 **바로 빠진다**", afterOff === "(없음)", afterOff);
  const nosyC = allowed(as(NOSY) + "select count(*) from v_listing_contact " +
    "where ask_id = '" + AID + "'");
  ok("⚠️ 남은 그 짝의 연락처 줄을 아예 못 본다", nosyC.yes && nosyC.out === "0",
     nosyC.out || nosyC.why);

  // ── ⑥ 고치기 ─────────────────────────────────────────────────
  console.log("\n── 올린 것을 고칩니다");
  const notMine = denied(as(NOSY) + "select edit_listing('" +
    J({ id:LID, title:"남의 것을 고쳐 봅니다" }) + "'::jsonb)");
  ok("남은 못 고친다", notMine.no, notMine.why);
  /* ⚠️⚠️⚠️ **보낸 칸만 고쳐야 합니다.** `save_provider_self` 처럼 통째로
     덮는 꼴이면 화면이 칸 하나를 빠뜨리는 날 그 칸이 **지워집니다**
     (`js/deskme.js` 가 `industries` 를 지우고 있던 그 자리). 제목만
     보내고 값 · 물건 상태가 그대로인지 봅니다. */
  const ed = allowed(as(SEL) + "select edit_listing('" +
    J({ id:LID, title:"드라이버 팝니다 (값 내림)" }) + "'::jsonb)");
  ok("올리신 분은 고칠 수 있다", ed.yes && ed.out === "edited", ed.out || ed.why);
  const kept = psql(as(SEL) + "select title || '|' || price || '|' || cond || " +
    "'|' || region from listing where id = '" + LID + "'");
  ok("⚠️⚠️ **보낸 칸만 바뀌고 나머지가 안 지워진다** (통째로 덮는 문이 아닙니다)",
     kept === "드라이버 팝니다 (값 내림)|350000|good|seoul", kept);

  // ── ⑦ 내리기 · 가리기 ────────────────────────────────────────
  console.log("\n── 내리기 (글쓴이) · 가리기 (운영자)");
  const r2 = allowed(put(SEL, { title:"가려 볼 매물", sub:"us-iron" }));
  const HID = r2.out;
  const hideNoWhy = denied(as(ADM) + "select move_listing('" +
    J({ id:HID, state:"hidden" }) + "'::jsonb)");
  ok("⚠️⚠️ 까닭 없이는 못 가린다", hideNoWhy.no, hideNoWhy.why);
  const hideNotAdm = denied(as(SEL) + "select move_listing('" +
    J({ id:HID, state:"hidden", why:"내 것이니 가려 볼까" }) + "'::jsonb)");
  ok("⚠️ 가리는 것은 **운영자만** (글쓴이도 못 합니다)", hideNotAdm.no, hideNotAdm.why);
  const hid = allowed(as(ADM) + "select move_listing('" +
    J({ id:HID, state:"hidden", why:"금지된 물건입니다" }) + "'::jsonb)");
  ok("운영자는 까닭을 적고 가린다", hid.yes && hid.out === "hidden", hid.out || hid.why);
  const gone = allowed(anon + "select count(*) from v_listing_open where id = '" + HID + "'");
  ok("  가려진 매물은 공개 목록에서 **빠진다**", gone.yes && gone.out === "0",
     gone.out || gone.why);
  const why = psql(as(SEL) + "select hidden_why from listing where id = '" + HID + "'");
  ok("  ⚠️ 가린 **까닭을 글쓴이가 본다** (무엇이 문제였는지 알아야 합니다)",
     why === "금지된 물건입니다", why);
  const undo = denied(as(SEL) + "select close_listing('" +
    J({ id:HID, state:"closed" }) + "'::jsonb)");
  ok("  ⚠️⚠️ 가려진 것을 글쓴이가 **못 되돌린다**", undo.no, undo.why);
  const askHid = denied(ask(BUY2, HID, {}));
  ok("  ⚠️ 가려진 매물에는 **문의도 안 들어간다** (상태 하나로 저절로 막힙니다)",
     askHid.no, askHid.why);

  const sold = allowed(as(SEL) + "select close_listing('" +
    J({ id:LID, state:"done" }) + "'::jsonb)");
  ok("팔렸다고 내릴 수 있다", sold.yes && sold.out === "done", sold.out || sold.why);
  const soldGone = allowed(anon + "select count(*) from v_listing_open where id = '" + LID + "'");
  ok("  팔린 매물도 공개 목록에서 빠진다", soldGone.yes && soldGone.out === "0",
     soldGone.out || soldGone.why);

  // ── ⑧ 신고 ───────────────────────────────────────────────────
  console.log("\n── 신고 (report 에 칸을 더했습니다 · 새 표가 아닙니다)");
  const r3 = allowed(put(SEL, { title:"신고될 매물", sub:"us-bag" }));
  const RPT = r3.out;
  const rep = allowed(as(BUY2) + "select open_report('" +
    J({ kind:"abuse", listing:RPT, body:"가짜 물건으로 보입니다" }) + "'::jsonb)");
  ok("매물을 신고할 수 있다", rep.yes && /^[0-9a-f-]{36}$/.test(rep.out),
     rep.out || rep.why);
  const dup = denied(as(BUY2) + "select open_report('" +
    J({ kind:"abuse", listing:RPT, body:"같은 것을 또 넣어 봅니다" }) + "'::jsonb)");
  ok("  ⚠️ 같은 것을 두 번은 막힌다 (0040 의 중복 막음이 살아 있습니다)",
     dup.no, dup.why);
  /* ⚠️ 0048 의 본문을 그대로 꺼내 썼으니, **앞 갈래도 그대로** 돌아야
     합니다 (손으로 다시 써서 조용히 날리지 않았는지 봅니다) */
  const repNone = denied(as(BUY2) + "select open_report('" +
    J({ kind:"abuse", body:"아무것도 안 가리키고 넣어 봅니다" }) + "'::jsonb)");
  ok("  ⚠️ 무엇에 대한 것인지 없으면 막힌다 (앞 갈래가 안 날아갔습니다)",
     repNone.no, repNone.why);

  // ── ⑨ 알림 ───────────────────────────────────────────────────
  console.log("\n── 알림 (0050 의 트리거 · 마이그레이션을 걸칩니다)");
  /* ⚠️⚠️ **받는 사람 눈으로** 읽습니다 — 0050 은 운영자 정책을 일부러
     안 두었으므로 운영자로 훑으면 0줄이고, 빈 글자를 보고 통과하는
     아무것도 안 잡는 검사가 됩니다. */
  const r4 = allowed(put(SEL, { title:"알림 볼 매물", sub:"us-wedge" }));
  const NID = r4.out;
  const a2 = allowed(ask(BUY2, NID, {}));
  /* ⚠️⚠️ **그 매물 것만 셉니다.** 처음에 `kind = 'listingask'` 전체를
     세었는데 앞에서 이미 문의를 하나 넣어 두어 2 가 나왔고, 그것은
     **DB 가 맞고 제 검사가 틀린** 것이었습니다 (작업 기억 — 갯수를 박지
     말고 전을 재고 늘어난 값만 보세요). */
  const got = psql(as(SEL) + "select count(*) from notice " +
    "where kind = 'listingask' and obj_id = '" + NID + "'");
  ok("문의가 들어오면 **파는 분에게** 알림이 붙는다", got === "1", got);
  /* ⚠️ 다른 분이 같은 매물에 또 문의해도 **안 쌓입니다** (0050 —
     안 읽은 같은 알림은 더 쌓지 않습니다. obj_id 까지 같을 때입니다). */
  allowed(ask(BUY, NID, {}));
  const again = psql(as(SEL) + "select count(*) from notice " +
    "where kind = 'listingask' and obj_id = '" + NID + "'");
  ok("  ⚠️ 같은 매물에 또 문의가 와도 **알림이 안 쌓인다** (안 읽은 동안)",
     again === "1", again);
  const title = psql(as(SEL) + "select title from notice " +
    "where kind = 'listingask' and obj_id = '" + NID + "'");
  ok("  ⚠️⚠️ 알림에 **손님이 적은 글 · 연락처가 한 글자도 없다**",
     title.indexOf("010-") < 0 && title.indexOf("사고 싶습니다") < 0, title);
  allowed(mv(SEL, a2.out, "accepted"));
  const moved = psql(as(BUY2) + "select count(*) from notice " +
    "where kind = 'listingmoved' and obj_id = '" + a2.out + "'");
  ok("문의가 처리되면 **문의하신 분에게** 알림이 붙는다", moved === "1", moved);
  /* ⚠️ 제가 한 일은 제게 안 알립니다 (0050) — 파는 분이 받아들였으니
     파는 분에게는 그 알림이 없어야 합니다 */
  const notSelf = psql(as(SEL) + "select count(*) from notice " +
    "where kind = 'listingmoved'");
  ok("  ⚠️ **제가 한 일은 제게 안 알린다**", notSelf === "0", notSelf);
  const hidN = psql(as(SEL) + "select count(*) from notice " +
    "where kind = 'hidden' and obj = 'listing' and obj_id = '" + HID + "'");
  ok("가려지면 올리신 분에게 알림이 붙는다 (갈래는 0050 의 hidden 그대로)",
     hidN === "1", hidN);
};

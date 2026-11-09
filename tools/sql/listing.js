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
    /* ⚠️ 0068 — `brand` 가 **필수**입니다. 안 넣으면 그 자물쇠가 먼저
       막아서, 재려던 자물쇠가 아닌 **엉뚱한 까닭으로** 거절됩니다
       (조인에서 날짜만 틀리게 넣고 제목을 빼 두어 겪은 자리). */
    J(Object.assign({ sub:"us-driver", region:"seoul", title:"드라이버 팝니다",
                      body:"2년 쓴 드라이버입니다", price:"350000", cond:"good",
                      brand:"타이틀리스트",
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
        price:"1", cond:"good", brand:"핑", contact:"010-1",
        agree_at:nowIso }) + "'::jsonb)");
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
  /* ⚠️⚠️ 0068 — **브랜드를 비우면 막힙니다.** 알아본 다섯 곳이 전부
     브랜드로 먼저 좁히는데, 비워 둘 수 있으면 그 칸이 반쯤 빈 채로
     쌓여 거르개가 아무것도 못 모읍니다. 모르시는 분은 「기타」입니다. */
  ok("브랜드가 없으면 막힌다 (0068)", d("brand", { brand:"" }).no, says.brand);
  ok("  브랜드가 너무 길면 막힌다 (30자)",
     d("brand2", { brand:"가".repeat(31) }).no, says.brand2);
  const dAg = denied(as(SEL) + "select open_listing('" +
    J({ sub:"us-iron", region:"seoul", title:"동의 없이", body:"올려 봅니다",
        price:"1000", cond:"good", brand:"핑", contact:"010-1" }) + "'::jsonb)");
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

  /* ══════════════════════════════════════════════════════════════
     0068 — 브랜드와 사진

     ⚠️⚠️⚠️ **0056 은 매물 사진을 담는 표를 아예 안 만들었습니다.**
     알아본 다섯 곳(2nd Swing · SidelineSwap · 번개장터 · 당근 · 골마켓)
     가운데 사진 없이 중고채를 파는 곳은 하나도 없었습니다.
     ⚠️⚠️ **경로는 문이 짓고 표의 check 가 다시 봅니다** — 화면이 짓게
     두면 남의 매물 칸에 쓸 수 있습니다 (0051 에서 세운 규칙).
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 0068 브랜드와 사진");

  /* ⚠️⚠️⚠️ **앞 검사가 만든 상태를 물려받지 않습니다.** 위에서 `LID` 는
     이미 팔렸다고 내려졌습니다(`close_listing`) — 그대로 쓰면 "팔고 있는
     매물만 고치실 수 있습니다" 로 **멀쩡한 문이 실패로** 잡힙니다
     (0061 의 G 가 업체를 정지된 채로 두고 끝나 I 가 터진 그 자리).
     그래서 이 묶음은 **제 매물을 새로 엽니다.** */
  const BID = allowed(put(SEL, { title:"브랜드 · 사진 검사용 매물" })).out;
  ok("이 묶음이 쓸 매물을 새로 연다 (앞 검사의 상태를 안 물려받습니다)",
     /^[0-9a-f-]{36}$/.test(BID), BID);

  /* ── ⑩ 브랜드 — 고치는 문도 받습니다 ─────────────────────────── */
  const brNow = () => psql(as(SEL) + "select coalesce(brand,'(없음)') " +
    "from listing where id = '" + BID + "'");
  ok("올릴 때 보낸 브랜드가 **글자 그대로** 담긴다 (키가 없습니다)",
     brNow() === "타이틀리스트", brNow());
  const edBr = allowed(as(SEL) + "select edit_listing('" +
    J({ id:BID, brand:"캘러웨이" }) + "'::jsonb)");
  ok("  고치는 문도 브랜드를 받는다", edBr.yes && brNow() === "캘러웨이",
     edBr.out || edBr.why);
  /* ⚠️ 안 보내면 **그대로 남습니다** (보낸 칸만 고치는 문입니다) */
  allowed(as(SEL) + "select edit_listing('" + J({ id:BID, title:"제목만" }) + "'::jsonb)");
  ok("  ⚠️ 안 보내면 그대로 남는다 (보낸 칸만 고칩니다)",
     brNow() === "캘러웨이", brNow());
  /* ⚠️⚠️ 빈 글자를 보내도 **지워지지 않습니다** — 브랜드는 필수이므로
     지워지면 필수인 칸이 빈 줄이 생깁니다 */
  allowed(as(SEL) + "select edit_listing('" + J({ id:BID, brand:"" }) + "'::jsonb)");
  ok("  ⚠️⚠️ 빈 글자로는 **안 지워진다** (필수인 칸이 비면 안 됩니다)",
     brNow() === "캘러웨이", brNow());
  const edBrLong = denied(as(SEL) + "select edit_listing('" +
    J({ id:BID, brand:"가".repeat(31) }) + "'::jsonb)");
  ok("  너무 긴 브랜드는 고치는 문도 막는다 (30자)", edBrLong.no, edBrLong.why);
  /* ⚠️ 표의 check 도 따로 봅니다 — 문만 막으면 SQL 편집기로 들어갑니다 */
  const tblBr = denied("update listing set brand = '" + "나".repeat(31) +
    "' where id = '" + BID + "'");
  ok("  ⚠️ **표의 check 도** 긴 브랜드를 막는다 (자물쇠 둘)", tblBr.no, tblBr.why);

  /* ── ⑪ 사진 — 경로는 문이 짓습니다 ──────────────────────────── */
  const claim = (who, extra) => as(who) + "select claim_listing_photo('" +
    J(Object.assign({ listing:BID, mime:"image/jpeg", bytes:"120000" }, extra)) +
    "'::jsonb)";
  const c1 = allowed(claim(SEL, {}));
  ok("올리신 분은 사진 자리를 청할 수 있다",
     c1.yes && c1.out.indexOf("lst/" + BID + "/photo/") > 0, c1.out || c1.why);
  /* ⚠️⚠️ **경로를 화면이 못 짓습니다** — 보낸 경로는 무시되고 문이
     짓습니다 (남의 매물 칸에 쓸 수 없게) */
  const c2 = allowed(claim(SEL, { path:"pv/other/doc/x.pdf" }));
  ok("  ⚠️⚠️ 보낸 경로를 **무시하고 문이 짓는다** (남의 칸에 못 씁니다)",
     c2.yes && c2.out.indexOf("lst/" + BID + "/photo/") > 0 &&
     c2.out.indexOf("pv/other") < 0, c2.out || c2.why);
  const cNot = denied(claim(NOSY, {}));
  ok("⚠️ 남의 매물에는 못 붙인다", cNot.no, cNot.why);
  /* ⚠️ 운영자도 못 붙입니다 — 남이 올린 자료에 사진을 넣는 일입니다 */
  const cAdm = denied(claim(ADM, {}));
  ok("  ⚠️ **운영자도** 못 붙인다 (남의 매물에 사진을 넣는 일입니다)",
     cAdm.no, cAdm.why);
  const cMime = denied(claim(SEL, { mime:"application/pdf" }));
  ok("⚠️ PDF 는 막힌다 (사진 자리입니다)", cMime.no, cMime.why);
  const cBig = denied(claim(SEL, { bytes:"9000000" }));
  ok("  8MB 를 넘으면 막힌다", cBig.no, cBig.why);
  const cCap = denied(claim(SEL, { caption:"가".repeat(61) }));
  ok("  사진 설명이 너무 길면 막힌다 (60자)", cCap.no, cCap.why);

  /* ⚠️⚠️⚠️ **몇 장까지인지를 검사에 박지 않습니다** (2026-11-08). 전에는
     "여덟 장" 을 글자로 박아 두어서, 0069 가 열 장으로 늘린 순간 **멀쩡한
     문을 실패로** 잡았습니다 — 이 저장소가 갯수를 박아 여러 번 밟은 그
     자리입니다. 지금은 **문을 마지막으로 덮은 마이그레이션에서 읽습니다**
     (번호도 박지 않습니다 — `test-desk` 가 `update provider set` 을 읽는
     그 방식입니다).
     ⚠️ 읽은 값이 없으면 **실패**입니다 — 못 읽으면 잴 것이 없는데 초록으로
     지나가면 그 초록은 아무 뜻이 없습니다. */
  const CAP = (function(){
    const fs = require("fs"), path = require("path");
    const dir = path.join(__dirname, "..", "..", "db", "migrations");
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort();
    let n = 0;
    files.forEach(function(f){
      const s = fs.readFileSync(path.join(dir, f), "utf8");
      let i = 0;
      for(;;){
        const a = s.indexOf("function claim_listing_photo(", i);
        if(a < 0) break;
        const seg = s.slice(a, s.indexOf("end $$;", a));
        const g = seg.indexOf("from listingphoto where listing_id = v_l) >=");
        if(g >= 0){
          const m = /\d+/.exec(seg.slice(g + 44));
          if(m) n = Number(m[0]);
        }
        i = a + 10;
      }
    });
    return n;
  })();
  ok("⚠️ 사진 한도를 마이그레이션에서 **읽었다** (검사에 박지 않습니다)",
     CAP >= 1, "읽은 값 " + CAP);

  /* ⚠️ 한도까지 채우고 **한 장 더**가 막히는지 봅니다 — 지금 한 장이
     들어 있으므로 CAP-1 장을 더 넣습니다. */
  for(let i = 0; i < CAP - 1; i++) allowed(claim(SEL, {}));
  const cntMax = psql("select count(*) from listingphoto where listing_id = '" + BID + "'");
  ok("한도(" + CAP + "장)까지 들어간다", cntMax === String(CAP), cntMax);
  const cOver = denied(claim(SEL, {}));
  ok("  ⚠️ 한 장 더는 막힌다", cOver.no, cOver.why);

  /* ⚠️⚠️ 공개 목록이 **첫 장과 장수**를 같이 냅니다 — 안 내면 카드마다
     사진을 따로 물어보게 되어 스무 장이면 호출이 스무 번 늘고, 그동안
     카드가 비어 있어 "사진 없는 장터" 로 보입니다. */
  const openPh = allowed(anon + "select photo_n || '/' || " +
    "case when thumb like 'lst/" + BID + "/photo/%' then 'ok' else coalesce(thumb,'(없음)') end " +
    "from v_listing_open where id = '" + BID + "'");
  ok("⚠️⚠️ 공개 목록이 **첫 장과 장수**를 같이 낸다 (카드마다 안 물어보게)",
     openPh.yes && openPh.out === CAP + "/ok", openPh.out || openPh.why);

  /* ⚠️ 공개 사진 보기 — 비로그인도 봅니다 (크롤러 몫) */
  const pubPh = allowed(anon + "select count(*) from v_listing_photo_public " +
    "where listing_id = '" + BID + "'");
  ok("비로그인도 매물 사진 목록을 본다 (크롤러 몫)",
     pubPh.yes && pubPh.out === String(CAP), pubPh.out || pubPh.why);
  /* ⚠️⚠️ 그 보기에 **올린 사람(by_user)이 없어야** 합니다 — 글은 공개지만
     누가 올렸는지는 공개가 아닙니다 (0047 · 0037 에서 세운 규칙) */
  const noWho = denied(anon + "select by_user from v_listing_photo_public limit 1");
  ok("  ⚠️⚠️ 그 보기에 **by_user 칸이 아예 없다** (누가 올렸는지는 공개가 아닙니다)",
     noWho.no, noWho.why);
  /* ⚠️ 아무도 표에 바로 못 씁니다 — 문 하나뿐입니다 */
  const rawIns = denied(as(SEL) + "insert into listingphoto " +
    "(listing_id, by_user, path, mime, bytes) values ('" + BID + "','" + SEL +
    "','lst/" + BID + "/photo/raw.jpg','image/jpeg',1)");
  ok("⚠️ 표에 **바로 못 넣는다** (들어오는 길은 문 하나입니다)",
     rawIns.no, rawIns.why);

  /* ── ⑫ 빼기 ───────────────────────────────────────────────────── */
  const fid = psql("select id from listingphoto where listing_id = '" + BID +
    "' order by created_at, id limit 1");
  const dNot = denied(as(NOSY) + "select drop_listing_photo('" +
    J({ id:fid }) + "'::jsonb)");
  ok("남의 사진은 못 뺀다", dNot.no, dNot.why);
  const dOk = allowed(as(SEL) + "select drop_listing_photo('" + J({ id:fid }) + "'::jsonb)");
  ok("올리신 분은 뺄 수 있다", dOk.yes && dOk.out === "1", dOk.out || dOk.why);
  /* ⚠️ 없는 것을 빼면 **거절합니다** — 조용히 0줄로 끝내면 기록에
     "뺐다" 가 남는데 실제로는 아무 일도 안 일어난 것입니다 (0054 의 그 자리) */
  const dAgain = denied(as(SEL) + "select drop_listing_photo('" + J({ id:fid }) + "'::jsonb)");
  ok("  ⚠️ 없는 것을 빼면 **거절한다** (기록이 거짓이 되지 않게)",
     dAgain.no, dAgain.why);

  /* ⚠️⚠️ 내린 매물의 사진은 **공개 보기에서 빠집니다** — 안 빠지면 내린
     뜻이 사라집니다 (0059 의 글 사진에서 세운 규칙) */
  const LID2 = allowed(put(SEL, { title:"내릴 매물입니다" })).out;
  allowed(as(SEL) + "select claim_listing_photo('" +
    J({ listing:LID2, mime:"image/png", bytes:"1000" }) + "'::jsonb)");
  const phWas = psql(anon + "select count(*) from v_listing_photo_public " +
    "where listing_id = '" + LID2 + "'");
  allowed(as(SEL) + "select close_listing('" + J({ id:LID2 }) + "'::jsonb)");
  const phNow = psql(anon + "select count(*) from v_listing_photo_public " +
    "where listing_id = '" + LID2 + "'");
  ok("⚠️⚠️ **내린 매물의 사진이 공개 보기에서 빠진다**",
     phWas === "1" && phNow === "0", phWas + " → " + phNow);

  /* ══════════════════════════════════════════════════════════════════
     ⑬ 0069 — 예약중 · 모델명 · 사진 차례 · 찜
     ⚠️⚠️⚠️ **상태 하나를 더하면 문 넷이 같이 막힙니다.** 0056 의
     `edit_listing` · `ask_listing` · `close_listing` 과 0068 의 사진 문
     둘이 전부 `state = 'open'` 을 요구했습니다 — 그대로 두면 예약중으로
     바꾸는 순간 그 매물을 **고칠 수도 · 문의받을 수도 · 되돌릴 수도**
     없어집니다. 그래서 **문마다 따로** 눌러 봅니다 (한 자리에서 재면
     하나만 보고 통과합니다).
     ══════════════════════════════════════════════════════════════════ */
  console.log("\n── 0069 예약중 · 모델명 · 사진 차례 · 찜");

  const RID = allowed(put(SEL, { title:"예약 걸어 볼 매물", model:"스텔스2 10.5도" })).out;
  ok("매물을 모델명과 함께 올린다", !!RID, RID);
  const mdl = psql(anon + "select coalesce(model,'(없음)') from v_listing_open where id = '" + RID + "'");
  ok("  ⚠️ 공개 보기가 **모델명을 낸다**", mdl === "스텔스2 10.5도", mdl);

  /* ⚠️⚠️ **모델명은 비워도 됩니다** — 반드시 받으면 모르시는 분이 매물을
     아예 못 올립니다 (브랜드와 **반대**입니다 · 절대 규칙 2) */
  const noMd = allowed(put(SEL, { title:"모델명 없는 매물" }));
  ok("  ⚠️ 모델명을 **안 보내도 올라간다** (모르시는 분이 못 올리면 안 됩니다)",
     noMd.yes, noMd.out || noMd.why);
  const tooMd = denied(put(SEL, { title:"모델명이 긴 매물", model:"가".repeat(41) }));
  ok("  모델명이 너무 길면 막힌다 (40자)", tooMd.no, tooMd.why);

  /* ⚠️⚠️⚠️ **비우는 것도 보내는 것입니다** — `coalesce` 로 받으면 빈
     글자가 "안 보냈다" 와 섞여 **지울 수가 없습니다**. */
  allowed(as(SEL) + "select edit_listing('" + J({ id:RID, model:"" }) + "'::jsonb)");
  const mdGone = psql("select coalesce(model,'(없음)') from listing where id = '" + RID + "'");
  ok("⚠️⚠️ 모델명을 **빈 글자로 보내면 지워진다** (coalesce 로 받으면 못 지웁니다)",
     mdGone === "(없음)", mdGone);
  allowed(as(SEL) + "select edit_listing('" + J({ id:RID, title:"제목만 고칩니다" }) + "'::jsonb)");
  const mdKeep = psql("select coalesce(model,'(없음)') from listing where id = '" + RID + "'");
  ok("  ⚠️ **안 보내면 그대로**입니다 (보낸 칸만 고칩니다)", mdKeep === "(없음)", mdKeep);
  allowed(as(SEL) + "select edit_listing('" + J({ id:RID, model:"P790" }) + "'::jsonb)");
  ok("  다시 적을 수 있다",
     psql("select model from listing where id = '" + RID + "'") === "P790");

  /* ── 예약중을 오갑니다 ─────────────────────────────────────────── */
  const toRes = allowed(as(SEL) + "select close_listing('" +
    J({ id:RID, state:"reserved" }) + "'::jsonb)");
  ok("⚠️⚠️ **파는 분이 예약중으로 둔다** (운영자가 아닙니다)",
     toRes.yes && toRes.out === "reserved", toRes.out || toRes.why);
  /* ⚠️⚠️⚠️ **예약중은 목록에 그대로 남습니다** — 빠지면 "팔렸다" 와
     구분이 없어지고, 손님은 사라진 까닭을 알 수 없습니다 */
  const resSeen = psql(anon + "select state from v_listing_open where id = '" + RID + "'");
  ok("⚠️⚠️⚠️ 예약중도 **공개 목록에 남고 상태를 낸다**", resSeen === "reserved", resSeen);
  const resPh = allowed(as(SEL) + "select claim_listing_photo('" +
    J({ listing:RID, mime:"image/png", bytes:"1000" }) + "'::jsonb)");
  ok("  ⚠️ 예약중 매물에도 **사진을 더할 수 있다**", resPh.yes, resPh.out || resPh.why);
  const resPub = psql(anon + "select count(*) from v_listing_photo_public " +
    "where listing_id = '" + RID + "'");
  ok("  ⚠️⚠️ 예약중 매물의 **사진도 공개로 나간다** (안 내면 카드가 아이콘으로 돌아갑니다)",
     resPub === "1", resPub);
  const resEdit = allowed(as(SEL) + "select edit_listing('" +
    J({ id:RID, price:"777000" }) + "'::jsonb)");
  ok("  ⚠️ 예약중에도 **고칠 수 있다**", resEdit.yes, resEdit.out || resEdit.why);
  const resAsk = allowed(as(BUY2) + "select ask_listing('" +
    J({ listing_id:RID, contact:"010-0000-0069", agree_at:nowIso }) + "'::jsonb)");
  ok("⚠️⚠️ 예약중에도 **문의를 받는다** (앞의 거래가 깨질 수 있습니다)",
     resAsk.yes, resAsk.out || resAsk.why);
  /* ⚠️⚠️⚠️ **되돌리는 길이 있어야** 합니다 — 없으면 잘못 누른 분이 매물을
     다시 올려야 하고 받아 둔 문의가 통째로 날아갑니다 (막다른 길) */
  const back = allowed(as(SEL) + "select close_listing('" +
    J({ id:RID, state:"open" }) + "'::jsonb)");
  ok("⚠️⚠️⚠️ 예약중에서 **되돌릴 수 있다** (막다른 길로 두지 않습니다)",
     back.yes && back.out === "open", back.out || back.why);
  /* ⚠️ 같은 상태로 옮기는 것은 거절합니다 — 조용히 성공으로 끝내면 화면이
     "바꿨습니다" 를 적는데 실제로는 아무 일도 안 일어났습니다 */
  const same = denied(as(SEL) + "select close_listing('" +
    J({ id:RID, state:"open" }) + "'::jsonb)");
  ok("  ⚠️ **같은 상태로는 못 옮긴다** (기록이 거짓이 되지 않게)", same.no, same.why);
  const resNot = denied(as(NOSY) + "select close_listing('" +
    J({ id:RID, state:"reserved" }) + "'::jsonb)");
  ok("  ⚠️ **남이 예약중으로 못 둔다**", resNot.no, resNot.why);
  const resBad = denied(as(SEL) + "select close_listing('" +
    J({ id:RID, state:"hidden" }) + "'::jsonb)");
  ok("  ⚠️ 파는 분이 **가릴 수는 없다** (가리는 문은 move_listing 입니다)",
     resBad.no, resBad.why);
  /* ⚠️⚠️ 예약중 매물도 운영자가 가릴 수 있어야 합니다 — 못 가리면 신고를
     받고도 내릴 길이 없습니다 */
  allowed(as(SEL) + "select close_listing('" + J({ id:RID, state:"reserved" }) + "'::jsonb)");
  const hidRes = allowed(as(ADM) + "select move_listing('" +
    J({ id:RID, state:"hidden", why:"검사로 가립니다" }) + "'::jsonb)");
  ok("  ⚠️⚠️ **예약중 매물도 운영자가 가린다**", hidRes.yes, hidRes.out || hidRes.why);

  /* ── 사진 차례 · 대표 사진 ─────────────────────────────────────── */
  /* ⚠️⚠️⚠️ **대표 사진을 boolean 으로 두지 않았습니다** — 둘 다 참인 줄이
     생길 수 있고 그러면 화면이 둘 가운데 하나를 멋대로 고릅니다. 대표는
     **차례가 가장 앞선 것**입니다. */
  const OID = allowed(put(SEL, { title:"사진 차례를 볼 매물" })).out;
  const p1 = JSON.parse(allowed(as(SEL) + "select claim_listing_photo('" +
    J({ listing:OID, mime:"image/png", bytes:"1000" }) + "'::jsonb)").out);
  const p2 = JSON.parse(allowed(as(SEL) + "select claim_listing_photo('" +
    J({ listing:OID, mime:"image/png", bytes:"1000" }) + "'::jsonb)").out);
  const p3 = JSON.parse(allowed(as(SEL) + "select claim_listing_photo('" +
    J({ listing:OID, mime:"image/png", bytes:"1000" }) + "'::jsonb)").out);
  ok("⚠️ 올릴 때 차례가 **뒤에 붙는다** (0 으로 두면 올릴 때마다 대표가 바뀝니다)",
     p1.ord === 0 && p2.ord === 1 && p3.ord === 2,
     p1.ord + "," + p2.ord + "," + p3.ord);
  const th1 = psql(anon + "select thumb from v_listing_open where id = '" + OID + "'");
  ok("  대표 사진이 **첫째**다", th1 === p1.path, th1);
  const ordr = allowed(as(SEL) + "select order_listing_photo('" +
    J({ listing:OID, ids:[p3.id, p1.id, p2.id] }) + "'::jsonb)");
  ok("차례를 바꾼다", ordr.yes && ordr.out === "3", ordr.out || ordr.why);
  const th2 = psql(anon + "select thumb from v_listing_open where id = '" + OID + "'");
  ok("⚠️⚠️ **대표 사진이 따라 바뀐다** (보기가 ord 로 고릅니다)", th2 === p3.path, th2);
  /* ⚠️ 공개 사진 보기도 그 차례를 내야 합니다 — 안 내면 상세 화면의
     슬라이드가 올린 차례로 보여서 **대표와 첫 장이 다릅니다** */
  const pubOrd = psql(anon + "select string_agg(ord::text, ',' order by ord) " +
    "from v_listing_photo_public where listing_id = '" + OID + "'");
  ok("  ⚠️ 공개 사진 보기가 **ord 칸을 낸다** (상세 슬라이드가 그 차례로 돕니다)",
     pubOrd === "0,1,2", pubOrd);
  /* ⚠️⚠️ **빠짐없이 와야** 합니다 — 일부만 보내면 안 보낸 것이 어디로
     가야 하는지 아무도 모르고, 조용히 0 으로 두면 그것이 대표가 됩니다 */
  const ordShort = denied(as(SEL) + "select order_listing_photo('" +
    J({ listing:OID, ids:[p1.id] }) + "'::jsonb)");
  ok("⚠️⚠️ **일부만 보내면 거절한다**", ordShort.no, ordShort.why);
  const ordDup = denied(as(SEL) + "select order_listing_photo('" +
    J({ listing:OID, ids:[p1.id, p1.id, p2.id] }) + "'::jsonb)");
  ok("  ⚠️ 같은 사진이 두 번이면 거절한다", ordDup.no, ordDup.why);
  const ordAlien = denied(as(SEL) + "select order_listing_photo('" +
    J({ listing:OID, ids:[p1.id, p2.id, fid] }) + "'::jsonb)");
  ok("  ⚠️ **남의 매물 사진이 섞이면 거절한다**", ordAlien.no, ordAlien.why);
  const ordNosy = denied(as(NOSY) + "select order_listing_photo('" +
    J({ listing:OID, ids:[p1.id, p2.id, p3.id] }) + "'::jsonb)");
  ok("  ⚠️ **남은 차례를 못 바꾼다**", ordNosy.no, ordNosy.why);
  const ordAdm = denied(as(ADM) + "select order_listing_photo('" +
    J({ listing:OID, ids:[p1.id, p2.id, p3.id] }) + "'::jsonb)");
  ok("  ⚠️ **운영자도 못 바꾼다** (남이 올린 자료의 차례입니다)", ordAdm.no, ordAdm.why);
  /* ⚠️ 기록에 **장수만** 남습니다 (사진 설명 · 경로는 손님 것입니다) */
  const ordLog = psql("select data::text from audit_log where obj = 'listing' " +
    "and obj_id = '" + OID + "' and to_state = 'photo_ordered' limit 1");
  ok("  ⚠️ 기록에 **장수만** 남는다 (경로 · 설명을 안 담습니다)",
     ordLog.indexOf("\"n\"") >= 0 && ordLog.indexOf("lst/") < 0, ordLog);

  /* ── 찜 (관심상품) ─────────────────────────────────────────────── */
  /* ⚠️⚠️⚠️ **찜 수를 공개하지 않습니다** — 세어 낼 수야 있지만 그 수는
     "인기" 로 읽히고 우리가 검증할 길이 없습니다. 그리고 누가 무엇에
     찜했는지는 **행동 기록**이라 파는 분에게도 · 운영자에게도 안 냅니다
     (0059 의 `cqview` 를 운영자도 못 읽게 둔 그 까닭). */
  const FID = allowed(put(SEL, { title:"찜해 볼 매물" })).out;
  const fav1 = allowed(as(BUY) + "select fav_listing('" + J({ id:FID, on:true }) + "'::jsonb)");
  ok("찜을 켠다", fav1.yes && fav1.out === "t", fav1.out || fav1.why);
  /* ⚠️ 두 번 켜도 줄은 하나입니다 (글 하나가 관심상품에 두 번 뜨지 않게) */
  allowed(as(BUY) + "select fav_listing('" + J({ id:FID, on:true }) + "'::jsonb)");
  const favN = psql("select count(*) from listingfav where listing_id = '" + FID + "'");
  ok("  ⚠️ 두 번 켜도 **줄은 하나**다", favN === "1", favN);
  const favMine = psql(as(BUY) + "select count(*) from v_listing_fav where id = '" + FID + "'");
  ok("  ⚠️ 관심상품 보기에 **제 것이 보인다**", favMine === "1", favMine);
  /* ⚠️⚠️ **남의 찜은 못 봅니다** — 표도 · 보기도 (행동 기록입니다) */
  const favNosy = psql(as(NOSY) + "select count(*) from v_listing_fav where id = '" + FID + "'");
  ok("⚠️⚠️ **남의 찜은 보기에 안 나온다**", favNosy === "0", favNosy);
  const favRaw = psql(as(NOSY) + "select count(*) from listingfav where listing_id = '" + FID + "'");
  ok("  ⚠️ 표에서도 **0줄**이다 (RLS 가 제 줄만 냅니다)", favRaw === "0", favRaw);
  /* ⚠️⚠️⚠️ **운영자도 못 읽습니다** — 0050 의 알림 · 0059 의 조회 기록과
     같은 결입니다 (남의 행동을 읽을 까닭이 없습니다) */
  const favAdm = psql(as(ADM) + "select count(*) from listingfav where listing_id = '" + FID + "'");
  ok("⚠️⚠️⚠️ **운영자도 남의 찜을 못 읽는다**", favAdm === "0", favAdm);
  /* ⚠️⚠️ **공개 보기에 찜 수 칸이 아예 없습니다** (절대 규칙 1 — 세어 낼
     수 있다고 내는 것이 아닙니다) */
  const noFavN = denied(anon + "select fav_n from v_listing_open limit 1");
  ok("⚠️⚠️ 공개 보기에 **찜 수 칸이 아예 없다**", noFavN.no, noFavN.why);
  /* ⚠️ 아무도 표에 바로 못 씁니다 — 문 하나뿐입니다 */
  const favIns = denied(as(BUY) + "insert into listingfav (by_user, listing_id) " +
    "values ('" + BUY + "','" + FID + "')");
  ok("  ⚠️ 표에 **바로 못 넣는다** (들어오는 길은 문 하나입니다)", favIns.no, favIns.why);
  const favOff = allowed(as(BUY) + "select fav_listing('" + J({ id:FID, on:false }) + "'::jsonb)");
  ok("찜을 끈다", favOff.yes && favOff.out === "f", favOff.out || favOff.why);
  ok("  ⚠️ 끄면 **그 즉시** 줄이 없어진다",
     psql("select count(*) from listingfav where listing_id = '" + FID + "'") === "0");
  /* ⚠️⚠️ **팔린 매물은 찜이 남습니다** — 찜해 둔 것이 팔리면 "팔렸습니다"
     를 보여 드리는 것이 맞습니다 (조용히 사라지면 손님은 까닭을 모릅니다) */
  allowed(as(BUY) + "select fav_listing('" + J({ id:FID, on:true }) + "'::jsonb)");
  allowed(as(SEL) + "select close_listing('" + J({ id:FID, state:"done" }) + "'::jsonb)");
  const favDone = psql(as(BUY) + "select state from v_listing_fav where id = '" + FID + "'");
  ok("⚠️⚠️ **팔린 매물도 관심상품에 남고 '팔렸습니다' 를 낸다**",
     favDone === "done", favDone);
  /* ⚠️ 내려간 매물은 찜할 수 없습니다 — 열 수 없는 줄이 쌓입니다 */
  const CID = allowed(put(SEL, { title:"내릴 매물" })).out;
  allowed(as(SEL) + "select close_listing('" + J({ id:CID, state:"closed" }) + "'::jsonb)");
  const favClosed = denied(as(BUY) + "select fav_listing('" + J({ id:CID }) + "'::jsonb)");
  ok("  ⚠️ **내려간 매물은 못 찜한다** (관심상품에 열 수 없는 줄이 쌓입니다)",
     favClosed.no, favClosed.why);
  const favNone = denied(as(BUY) + "select fav_listing('" +
    J({ id:"00000000-0000-0000-0000-000000000069" }) + "'::jsonb)");
  ok("  ⚠️ 없는 매물은 거절한다", favNone.no, favNone.why);


  /* ════════════════════════════════════════════════════════════════
     ⑭ 0070 — 가린 매물을 **되돌리는 길** · 그리고 칸 GRANT
     ⚠️⚠️⚠️ 0056 의 `move_listing` 은 `hidden` 으로만 갔습니다 — 한 번
     가리면 올린 분(제 문들이 전부 `state in ('open','reserved')` 를
     요구합니다)도 운영자도 못 되돌렸습니다.
     ⚠️ 되돌리는 자리는 **가리기 전 상태**여야 합니다 — 팔린 매물을
     가렸다가 `open` 으로 되살리면 이미 팔린 물건이 다시 살 수 있는
     것처럼 목록에 섭니다 (절대 규칙 1).
     ════════════════════════════════════════════════════════════════ */
  console.log("\n── 0070 가린 매물 되돌리기 · 칸 GRANT");
  {
    const HID = allowed(put(SEL, { title:"가릴 매물" })).out;

    const noWhy = denied(as(ADM) + "select move_listing('" +
      J({ id:HID, state:"hidden", why:"짧" }) + "'::jsonb)");
    ok("까닭이 짧으면 거절한다", noWhy.no, noWhy.why);
    const notAdm = denied(as(BUY) + "select move_listing('" +
      J({ id:HID, state:"hidden", why:"금지된 물건입니다" }) + "'::jsonb)");
    ok("  ⚠️ 손님은 못 가린다", notAdm.no, notAdm.why);
    const badTo = denied(as(ADM) + "select move_listing('" +
      J({ id:HID, state:"done", why:"금지된 물건입니다" }) + "'::jsonb)");
    ok("  ⚠️ 모르는 상태로는 못 옮긴다 (hidden · open 둘뿐)", badTo.no, badTo.why);

    /* ⚠️ 되돌아갈 자리를 만들려고 **예약중**으로 두고 가립니다 —
       `open` 으로 두면 "가리기 전 상태로 돌아갔는지" 와 "그냥 open 으로
       돌아갔는지" 가 **답이 같아** 아무것도 안 잡습니다. */
    allowed(as(SEL) + "select close_listing('" +
      J({ id:HID, state:"reserved" }) + "'::jsonb)");
    const hid = allowed(as(ADM) + "select move_listing('" +
      J({ id:HID, state:"hidden", why:"금지된 물건입니다" }) + "'::jsonb)");
    ok("운영자가 가린다", hid.yes && hid.out === "hidden", hid.out || hid.why);
    ok("  ⚠️ 가리기 전 상태를 적어 둔다 (hidden_from)",
       psql("select hidden_from from listing where id = '" + HID + "'") === "reserved");
    const again = denied(as(ADM) + "select move_listing('" +
      J({ id:HID, state:"hidden", why:"또 가립니다" }) + "'::jsonb)");
    ok("  ⚠️ **같은 상태로 또 옮기면 거절한다** (조용히 성공하면 화면이 " +
       "'바꿨습니다' 를 적는데 아무 일도 안 일어났습니다)", again.no, again.why);
    /* ⚠️ 가려지면 **공개 보기에서 빠집니다** — 되돌리기가 참으로 쓸모가
       있으려면 가리는 것이 실제로 듣고 있어야 합니다. */
    ok("  ⚠️ 가려진 매물은 공개 보기에서 빠진다",
       psql(anon + "select count(*) from v_listing_open where id = '" + HID + "'") === "0");

    const back = allowed(as(ADM) + "select move_listing('" +
      J({ id:HID, state:"open" }) + "'::jsonb)");
    ok("⚠️⚠️ **되돌리면 가리기 전 상태로** 돌아간다 (open 이 아니라 reserved)",
       back.yes && back.out === "reserved", back.out || back.why);
    ok("  ⚠️ 되돌리면 가린 기록을 비운다 (까닭 · 누가 · 언제 · 어디서)",
       psql("select coalesce(hidden_why,'') || '|' || coalesce(hidden_from,'') " +
            "from listing where id = '" + HID + "'") === "|");
    const notHid = denied(as(ADM) + "select move_listing('" +
      J({ id:HID, state:"open" }) + "'::jsonb)");
    ok("  ⚠️ 가려지지 않은 것을 되돌리면 거절한다", notHid.no, notHid.why);
    /* ⚠️ 기록에 **까닭 글자를 안 담습니다** — 길이만 남깁니다 */
    const log = psql("select coalesce(data::text,'') from audit_log where obj = 'listing' " +
                     "and obj_id = '" + HID + "' order by at desc limit 1");
    ok("  ⚠️ 감사 기록에 **까닭 글자가 안 담긴다** (길이만)",
       log.indexOf("금지된") < 0 && log.indexOf("why_len") >= 0, log);
  }

  /* ⚠️⚠️⚠️ **화면이 부르는 칸을 그대로 눌러 봅니다** (2026-11-09).
     `listing` 은 **칸 단위**로 select 를 줍니다(0056 이 연락처 · 동의
     시각을 빼려고 그렇게 했습니다). 칸 단위 GRANT 는 **나중에 생긴
     칸을 저절로 덮지 않습니다** — 0069 가 `model` 을 더해 놓고 GRANT 를
     안 줘서, `/my` 의 「내 판매글」 질의가 **통째로 거절**되고 그 상자가
     빈 채로 남았습니다(0줄이 아닙니다 · 에러도 화면에 안 나옵니다).
     ⚠️ 칸 이름을 **검사에 적지 않습니다** — 화면 파일에서 읽어 옵니다
     (적어 두면 화면이 칸을 하나 더 부르는 날 그 칸만 조용히 빠집니다). */
  {
    const src = require("fs").readFileSync(
      require("path").join(__dirname, "..", "..", "js", "mylisting.js"), "utf8");
    const m = /listing\?select=([A-Za-z0-9_,\s"+]*?)&/.exec(src);
    const cols = m ? m[1].replace(/["+\s]/g, "") : "";
    ok("⚠️ `js/mylisting.js` 에서 부르는 칸을 **읽어 왔다** (0개면 검사가 고장)",
       cols.split(",").filter(Boolean).length > 0, cols);
    const q = allowed(as(SEL) + "select " + cols + " from listing limit 1");
    ok("⚠️⚠️⚠️ `/my` 가 부르는 칸이 **칸 GRANT 를 전부 지난다** " +
       "(하나라도 안 주면 질의가 통째로 거절되고 그 상자가 빈 채로 남습니다)",
       q.yes, q.why);
  }
  /* ⚠️ 매물을 지우면 사진 줄도 같이 갑니다 (on delete cascade) — 다만
     이 저장소는 매물을 지우지 않고 **내립니다**. 그 사실만 적어 둡니다. */
};

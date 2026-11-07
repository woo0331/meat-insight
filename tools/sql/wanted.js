/* ════════════════════════════════════════════════════════════════════
   구합니다 — 눌러 봅니다 (0061)

   ⚠️⚠️⚠️ **연락처가 받아들이기만으로 열리지 않는지**가 여기서 가장
   중요한 것입니다 (개인정보보호법 제17조 제2항). 0046 · 0056 에서 세운
   세 겹을 그대로 베꼈으니 **셋을 따로** 눌러 봅니다 —
     ① 공개 보기에 칸이 **아예 없음**
     ② 표의 칸 단위 GRANT 에서 뺌
     ③ 연락처 보기의 `case` 가 **각자 누른 것만** 냄
   하나만 보고 "막혔다" 고 읽으면 나머지 둘이 장식인지 알 수 없습니다.

   ⚠️⚠️ 재는 것은 늘 **문**입니다. 표에 바로 insert 하면 자물쇠를 통째로
   지나가고 그 초록은 아무 뜻이 없습니다 ("10분에 다섯 건" 자리).

   ⚠️ 쓰는 id 앞머리는 `wt-` 입니다 — 다른 검사와 부딪히면 조용히
   물려받아 엉뚱한 곳에서 떨어집니다 (0051 에서 겪었습니다).
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0061 구합니다 — 씨앗");
  const ASK  = psql("insert into auth.users (email) values ('wt-ask@x.test') returning id");
  const PRO  = psql("insert into auth.users (email) values ('wt-pro@x.test') returning id");
  const MEM  = psql("insert into auth.users (email) values ('wt-mem@x.test') returning id");
  const MEM2 = psql("insert into auth.users (email) values ('wt-mem2@x.test') returning id");
  const NOSY = psql("insert into auth.users (email) values ('wt-nosy@x.test') returning id");
  /* ⚠️⚠️ 쏟아붓기는 **따로 쓰는 계정**으로 잽니다 — 처음에 올리는 분
     계정으로 열 개를 채웠더니 그 뒤의 검사가 **전부 "열입니다" 로**
     떨어졌습니다. **앞 검사가 만든 상태를 뒤 검사가 물려받는** 그
     자리입니다 (0046 에서 두 번 밟았습니다). */
  const FLOOD = psql("insert into auth.users (email) values ('wt-flood@x.test') returning id");
  const ADM  = psql("insert into auth.users (email) values ('wt-adm@x.test') returning id");
  /* ⚠️ 업체는 **insert 때** 심습니다 — `provider_guard` 가 `before update`
     만 보므로, update 로 심으려 하면 검사가 제 준비 SQL 에 막힙니다
     (0057 의 `sql/ident.js` 에서 겪은 자리). */
  psql("insert into provider (id, name, listed, is_test, state, subs, regions) " +
       "values ('wt-pv','구합니다 레슨센터', true, false, 'approved', " +
       "array['ls-solo'], array['seoul']) " +
       "on conflict (id) do update set name = excluded.name, listed = true, " +
       "is_test = false, state = 'approved'");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + ASK  + "','customer','구하는 사람', null)," +
       "('" + PRO  + "','provider','업체 담당자', 'wt-pv')," +
       "('" + MEM  + "','customer','김한국', null)," +
       "('" + MEM2 + "','customer','또 답하는 사람', null)," +
       "('" + NOSY + "','customer','남', null)," +
       "('" + FLOOD + "','customer','쏟아붓는 사람', null)," +
       "('" + ADM  + "','admin','구합니다 관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const J    = o => JSON.stringify(o).replace(/'/g, "''");
  const nowIso = psql("select now()");

  const put = (who, extra) => as(who) + "select open_wanted('" +
    J(Object.assign({ cat:"lesson", sub:"ls-solo", region:"seoul",
                      title:"주말 오전 레슨 구합니다",
                      body:"드라이버를 집중해서 배우고 싶습니다",
                      budget:"200000", when_txt:"주말 오전",
                      contact:"010-7000-0000", agree_at:nowIso }, extra)) + "'::jsonb)";
  const rep = (who, wid, extra) => as(who) + "select reply_wanted('" +
    J(Object.assign({ w_id:wid, body:"주말 오전 자리가 있습니다",
                      contact:"010-8000-0000", agree_at:nowIso }, extra)) + "'::jsonb)";
  const mv  = (who, rid, st) => as(who) + "select move_wantedreply('" +
    J({ id:rid, to:st }) + "'::jsonb)";
  const shr = (who, rid, on) => as(who) + "select share_wantedcontact('" +
    J(on ? { id:rid, on:true, agree_at:nowIso } : { id:rid, on:false }) + "'::jsonb)";

  // ── ① 올립니다 ────────────────────────────────────────────────
  console.log("\n── 구합니다 글을 올립니다");
  const r1 = allowed(put(ASK, {}));
  ok("로그인하면 구합니다 글을 올릴 수 있다",
     r1.yes && /^[0-9a-f-]{36}$/.test(r1.out), r1.out || r1.why);
  const WID = r1.out;
  const anonPut = denied(anon + "select open_wanted('" +
    J({ cat:"lesson", region:"seoul", title:"비로그인", body:"올려 봅니다",
        contact:"010-1", agree_at:nowIso }) + "'::jsonb)");
  ok("비로그인은 못 올린다 (쓰기는 로그인한 분만)", anonPut.no, anonPut.why);

  console.log("\n── 자물쇠마다 다른 말로 거절합니다");
  /* ⚠️⚠️ **재려는 자물쇠 하나만 틀리게 하고 나머지는 전부 올바르게.**
     조인에서 날짜만 틀리게 넣고 제목을 빼 두었더니 제목 자물쇠가 먼저
     막아서 "여덟이 다른 말로 거절한다" 가 떨어졌습니다. */
  const says = {};
  const d = (k, extra) => { const x = denied(put(ASK, extra)); says[k] = x.why; return x; };
  ok("분류가 없으면 막힌다", d("cat", { cat:"" }).no, says.cat);
  ok("지역이 없으면 막힌다", d("region", { region:"" }).no, says.region);
  ok("제목이 짧으면 막힌다", d("title", { title:"짧" }).no, says.title);
  ok("제목이 너무 길면 막힌다", d("title2", { title:"가".repeat(61) }).no, says.title2);
  ok("내용이 짧으면 막힌다", d("body", { body:"짧다" }).no, says.body);
  ok("내용이 너무 길면 막힌다", d("body2", { body:"가".repeat(2001) }).no, says.body2);
  ok("언제 필요하신지가 너무 길면 막힌다",
     d("when", { when_txt:"가".repeat(61) }).no, says.when);
  ok("예산이 숫자가 아니면 막힌다", d("bud", { budget:"이십만원" }).no, says.bud);
  ok("예산이 범위를 넘으면 막힌다", d("bud2", { budget:"999999999" }).no, says.bud2);
  ok("연락처가 없으면 막힌다 (제20조의4 ① — 신원정보 확인)",
     d("contact", { contact:"" }).no, says.contact);
  const dAg = denied(as(ASK) + "select open_wanted('" +
    J({ cat:"lesson", region:"seoul", title:"동의 없이", body:"올려 봅니다",
        contact:"010-1" }) + "'::jsonb)");
  says.agree = dAg.why;
  ok("동의 시각이 없으면 막힌다 (제15조 제2항)", dAg.no, dAg.why);
  const dFuture = denied(put(ASK, { agree_at:"2099-01-01T00:00:00Z" }));
  says.future = dFuture.why;
  ok("동의 시각이 미래면 막힌다", dFuture.no, dFuture.why);
  /* ⚠️ 같은 자물쇠에 두 번 걸리는 것은 **세는 자리에서 뺍니다** —
     음수와 범위 초과는 같은 `if` 라 말이 같은 것이 맞습니다
     (2026-11-05 에 같은 자물쇠를 둘로 세어 떨어졌습니다). */
  const uniq = new Set(Object.values(says));
  ok("⚠️ 자물쇠들이 **서로 다른 말**로 거절한다",
     uniq.size === Object.keys(says).length, JSON.stringify(says));

  /* ⚠️ 너무 넓게 막는 것도 고장입니다 — 비워도 되는 것은 되어야 합니다 */
  const noBud = allowed(put(ASK, { budget:"", title:"예산 없이 올립니다" }));
  ok("⚠️ 예산은 **비워도 된다** (강요하면 지어내서 적습니다)",
     noBud.yes && /^[0-9a-f-]{36}$/.test(noBud.out), noBud.out || noBud.why);
  const zeroBud = allowed(put(ASK, { budget:"0", title:"무료로 해 주실 분" }));
  ok("⚠️ 예산 **0 도 된다** (무료로 해 주실 분 — '안 적음' 과 다른 뜻입니다)",
     zeroBud.yes, zeroBud.out || zeroBud.why);
  const zv = psql(as(ASK) + "select coalesce(budget::text,'(null)') from wanted " +
    "where id = '" + zeroBud.out + "'");
  ok("  ⚠️⚠️ 0 이 **0 으로 담긴다** (`||` 를 쓰면 0 이 null 로 섞입니다)",
     zv === "0", zv);
  const nv = psql(as(ASK) + "select coalesce(budget::text,'(null)') from wanted " +
    "where id = '" + noBud.out + "'");
  ok("  빈 글자는 **null 로 담긴다** (0 과 섞이지 않습니다)", nv === "(null)", nv);
  const noSub = allowed(put(ASK, { sub:"", title:"하위 없이 올립니다" }));
  ok("⚠️ 하위분류도 **비워도 된다** (분류만 고르고 올리실 수 있습니다)",
     noSub.yes, noSub.out || noSub.why);

  console.log("\n── 쏟아붓기 막기 (한 번에 열까지)");
  /* ⚠️ 갯수를 박지 않습니다 — 열한 번째가 막히는지만 봅니다 */
  let hitTen = null, lastId = null;
  for(let i = 0; i < 12; i++){
    const x = allowed(put(FLOOD, { title:"쏟아붓기 " + i }));
    if(!x.yes){ hitTen = x.why; break; }
    lastId = x.out;
  }
  ok("⚠️ 열한 번째는 막힌다 (목록이 한 사람 글로 덮이지 않게)",
     hitTen !== null && hitTen.indexOf("열입니다") >= 0, String(hitTen));
  /* ⚠️ 내린 것은 안 셉니다 — 정리하면 다시 올릴 수 있어야 합니다
     (못 치우는 막다른 길로 두지 않습니다) */
  allowed(as(FLOOD) + "select close_wanted('" +
    J({ id:lastId, to:"closed" }) + "'::jsonb)");
  const afterClose = allowed(put(FLOOD, { title:"정리한 뒤에 올립니다" }));
  ok("  ⚠️ 내린 글은 **안 세어서** 정리하면 다시 올릴 수 있다",
     afterClose.yes, afterClose.out || afterClose.why);

  /* 올리는 분의 글 둘 — 하나는 내려 두고(뒤에서 "내려간 글" 로 씁니다)
     하나는 열어 둡니다 */
  allowed(as(ASK) + "select close_wanted('" + J({ id:WID, to:"closed" }) + "'::jsonb)");
  const r1b = allowed(put(ASK, { title:"답을 받아 볼 글" }));
  ok("  올리는 분의 열린 글을 하나 더 세웠다 (뒤 검사가 씁니다)",
     r1b.yes && /^[0-9a-f-]{36}$/.test(r1b.out), r1b.out || r1b.why);
  const WID2 = r1b.out;

  // ── ② 공개 보기 ───────────────────────────────────────────────
  console.log("\n── 공개 목록 (v_wanted_open)");
  const seeAnon = allowed(anon + "select count(*) from v_wanted_open where id = '" +
    WID2 + "'");
  ok("비로그인도 구합니다 글을 본다 (업체가 찾아 들어오는 길입니다)",
     seeAnon.yes && seeAnon.out === "1", seeAnon.out || seeAnon.why);
  const closedGone = allowed(anon + "select count(*) from v_wanted_open where id = '" +
    WID + "'");
  ok("  내린 글은 공개 목록에서 **빠진다**", closedGone.yes && closedGone.out === "0",
     closedGone.out || closedGone.why);
  const cols = psql("select string_agg(column_name, ',' order by column_name) " +
    "from information_schema.columns where table_name = 'v_wanted_open'");
  ok("⚠️⚠️ 공개 보기에 contact 칸이 **없다** (있는데 빈 것과 다릅니다)",
     cols.indexOf("contact") < 0, cols);
  ok("⚠️ 공개 보기에 by_user 칸도 **없다** (누가 올렸는지는 공개가 아닙니다)",
     cols.indexOf("by_user") < 0, cols);
  ok("⚠️ 공개 보기에 agree_at 칸도 **없다**", cols.indexOf("agree_at") < 0, cols);
  ok("  답 수는 칸이 아니라 **세어서** 냅니다 (절대 규칙 1)",
     cols.indexOf("reply_n") >= 0, cols);
  ok("  분류 · 하위 · 지역 · 예산이 목록에 나온다 (거르개가 읽습니다)",
     cols.indexOf("cat") >= 0 && cols.indexOf("sub") >= 0 &&
     cols.indexOf("region") >= 0 && cols.indexOf("budget") >= 0, cols);

  // ── ③ 칸 GRANT ────────────────────────────────────────────────
  console.log("\n── 칸 단위 GRANT (표에서 연락처를 못 읽습니다)");
  const myRow = allowed(as(ASK) + "select title from wanted where id = '" + WID2 + "'");
  ok("내 글 줄은 보인다", myRow.yes && myRow.out.indexOf("답을 받아 볼 글") >= 0,
     myRow.out || myRow.why);
  const myC = denied(as(ASK) + "select contact from wanted where id = '" + WID2 + "'");
  ok("⚠️⚠️ **제 글이라도 표에서 연락처를 못 읽는다** (칸 GRANT)", myC.no, myC.why);
  const myA = denied(as(ASK) + "select agree_at from wanted where id = '" + WID2 + "'");
  ok("  동의 시각도 못 읽는다", myA.no, myA.why);
  /* ⚠️⚠️ 안 준 칸을 `where` 절에 쓰면 0줄이 아니라 **질의가 통째로
     거절**됩니다 — 0050 · 0052 · 0056 에서 세 번 밟은 자리입니다.
     줄이 보이는가와 이것은 **다른 자물쇠**라 갈라서 잽니다. */
  const whereC = denied(as(ASK) +
    "select count(*) from wanted where contact = '010-7000-0000'");
  ok("  ⚠️ 안 준 칸을 조건에 쓰면 **질의가 거절된다** (0줄이 아닙니다)",
     whereC.no, whereC.why);
  const noWrite = denied(as(ASK) + "update wanted set title = '바꿔 봅니다' " +
    "where id = '" + WID2 + "'");
  ok("⚠️ 쓰기 GRANT 가 **한 줄도 없다** (들어오는 길은 문뿐입니다)",
     noWrite.no, noWrite.why);

  console.log("\n── RLS (줄)");
  const nosy = allowed(as(NOSY) + "select count(*) from wanted where id = '" + WID2 + "'");
  ok("남은 내 글 줄을 못 본다 (0줄 — 읽기는 조용히 빕니다)",
     nosy.yes && nosy.out === "0", nosy.out || nosy.why);
  const admSee = allowed(as(ADM) + "select count(*) from wanted where id = '" + WID2 + "'");
  ok("운영자는 본다 (가려야 하므로)", admSee.yes && admSee.out === "1",
     admSee.out || admSee.why);

  // ── ④ 답 ─────────────────────────────────────────────────────
  console.log("\n── 답을 답니다");
  const p1 = allowed(rep(MEM, WID2, {}));
  ok("회원이 답할 수 있다", p1.yes && /^[0-9a-f-]{36}$/.test(p1.out), p1.out || p1.why);
  const RID = p1.out;
  const mineRep = denied(rep(ASK, WID2, {}));
  ok("⚠️ **제 글에는 제가 답할 수 없다** (답 수를 제가 올리는 꼴입니다)",
     mineRep.no, mineRep.why);
  const twice = denied(rep(MEM, WID2, {}));
  ok("⚠️ 한 글에 두 번은 막힌다 (표의 unique — 말을 사람 말로 바꿔 냅니다)",
     twice.no && twice.why.indexOf("이미 답하셨습니다") >= 0, twice.why);
  const repClosed = denied(rep(MEM2, WID, {}));
  ok("⚠️ 내려간 글에는 **답이 안 들어간다** (상태 하나로 저절로 막힙니다)",
     repClosed.no, repClosed.why);

  console.log("\n── 업체 이름으로 답하기 (as_pro · 고르는 것입니다)");
  const proRep = allowed(rep(PRO, WID2, { as_pro:"wt-pv",
    body:"저희 센터에서 주말 오전 자리가 있습니다" }));
  ok("그 업체에 이어진 분은 상호로 답할 수 있다", proRep.yes, proRep.out || proRep.why);
  const PRID = proRep.out;
  const borrow = denied(rep(MEM2, WID2, { as_pro:"wt-pv" }));
  ok("⚠️⚠️ **남의 상호를 빌려 쓸 수 없다**", borrow.no, borrow.why);
  const proName = psql(as(ASK) + "select coalesce(pro_name,'(없음)') " +
    "from v_wanted_reply where id = '" + PRID + "'");
  ok("  상호가 올린 분에게 보인다 (누가 답했는지 알아야 고릅니다)",
     proName === "구합니다 레슨센터", proName);
  /* ⚠️⚠️ **보기가 읽을 때 다시 상태를 봅니다** — 정지되면 그 순간
     상호가 빠집니다 (0048 의 as_pro · 0055 의 광고 보기와 같은 셋). */
  allowed(as(ADM) + "select set_provider_state('" +
    J({ id:"wt-pv", to:"suspended", why:"검사에서 정지시켜 봅니다" }) + "'::jsonb)");
  const afterSus = psql(as(ASK) + "select coalesce(pro_name,'(없음)') " +
    "from v_wanted_reply where id = '" + PRID + "'");
  ok("⚠️⚠️ 업체가 **정지되면 그 순간 상호가 빠진다** (읽을 때 다시 봅니다)",
     afterSus === "(없음)", afterSus);
  const susWho = psql(as(ASK) + "select coalesce(who,'(없음)') " +
    "from v_wanted_reply where id = '" + PRID + "'");
  ok("  ⚠️ 그 자리에 **가린 성함**이 대신 나온다 (빈 자리로 두지 않습니다)",
     susWho !== "(없음)" && susWho.indexOf("업체 담당자") < 0, susWho);
  /* ⚠️ 바꾼 값을 그 자리에서 **되돌려 놓습니다** — 앞 검사가 만든 상태를
     뒤 검사가 물려받는 자리입니다 (0057 에서 겪었습니다). */
  /* ⚠️ `approve_provider` 는 **state 를 안 바꿉니다** (listed · verified ·
     assignable 뿐) — 처음에 그것으로 되돌리려다 `suspended/false` 가
     남았습니다. 상태를 되돌리는 문은 `set_provider_state` 이고, 정지가
     `listed` 를 같이 껐으니 **둘을 다** 되돌려야 합니다 (0038). */
  allowed(as(ADM) + "select set_provider_state('" +
    J({ id:"wt-pv", to:"approved" }) + "'::jsonb)");
  allowed(as(ADM) + "select approve_provider('wt-pv', true)");
  const back = psql("select state || '/' || listed::text from provider where id = 'wt-pv'");
  ok("  ⚠️ 바꾼 값을 **되돌려 놓았다** (뒤 검사가 물려받지 않게)",
     back === "approved/true", back);

  console.log("\n── 답 보기 (v_wanted_reply)");
  const rcols = psql("select string_agg(column_name, ',' order by column_name) " +
    "from information_schema.columns where table_name = 'v_wanted_reply'");
  ok("⚠️⚠️ 답 보기에 contact 칸이 **없다** (연락처는 v_wanted_contact 하나로만)",
     rcols.indexOf("contact") < 0, rcols);
  const masked = psql(as(ASK) + "select coalesce(who,'(없음)') " +
    "from v_wanted_reply where id = '" + RID + "'");
  /* ⚠️⚠️ **별 개수를 박지 않습니다** — 이름이 길면 별도 늘어납니다
     (0052 에서 `김**` 를 박아 네 글자 이름에 떨어졌습니다). 뜻을
     셋으로 갈라 잽니다. */
  ok("개인으로 답한 분은 **첫 글자만** 남는다", masked.slice(0, 1) === "김", masked);
  ok("  나머지가 전부 별이다",
     masked.length > 1 && /^\*+$/.test(masked.slice(1)), masked);
  ok("  ⚠️ **본이름이 한 글자도 안 나온다**", masked.indexOf("한국") < 0, masked);
  const nosyRep = allowed(as(NOSY) + "select count(*) from v_wanted_reply " +
    "where id = '" + RID + "'");
  ok("⚠️ 남은 그 답을 아예 못 본다 (보기의 where 가 자물쇠입니다)",
     nosyRep.yes && nosyRep.out === "0", nosyRep.out || nosyRep.why);
  const anonRep = denied(anon + "select count(*) from v_wanted_reply");
  ok("  ⚠️ 비로그인은 답 보기를 **질의째 거절당한다** (GRANT 가 없습니다)",
     anonRep.no, anonRep.why);
  const bodyPub = psql(anon + "select string_agg(column_name, ',') " +
    "from information_schema.columns where table_name = 'v_wanted_open' " +
    "and column_name = 'reply_n'");
  ok("⚠️⚠️ 공개로 나가는 것은 **개수뿐**이다 (답 내용에 연락처가 섞입니다)",
     bodyPub === "reply_n", bodyPub);

  // ── ⑤ 연락처 — 받아들이기만으로 열리지 않는가 ────────────────
  console.log("\n── ⚠️⚠️⚠️ 연락처는 받아들이기만으로 안 열립니다 (제17조 제2항)");
  const before = allowed(as(MEM) + "select count(*) from v_wanted_contact " +
    "where reply_id = '" + RID + "'");
  ok("받아들이기 전에는 연락처 보기에 줄이 없다", before.yes && before.out === "0",
     before.out || before.why);
  const notOwner = denied(mv(NOSY, RID, "accepted"));
  ok("⚠️ 남은 받아들일 수 없다", notOwner.no, notOwner.why);
  const wrongWay = denied(mv(MEM, RID, "accepted"));
  ok("⚠️ 답한 분이 제 답을 **스스로 받아들일 수 없다**", wrongWay.no, wrongWay.why);
  const acc = allowed(mv(ASK, RID, "accepted"));
  ok("올리신 분이 받아들일 수 있다", acc.yes, acc.why);
  /* ⚠️⚠️⚠️ **여기가 핵심입니다.** 받아들였는데도 둘 다 null 이어야 합니다 */
  const bothNull = psql(as(MEM) + "select coalesce(owner_contact,'(없음)') || '/' || " +
    "coalesce(helper_contact,'(없음)') from v_wanted_contact where reply_id = '" +
    RID + "'");
  ok("⚠️⚠️⚠️ **받아들이기만으로는 둘 다 비어 있다** (받아들이는 것은 " +
     "'얘기해 봅시다' 이지 '번호를 줘도 좋다' 가 아닙니다)",
     bothNull === "(없음)/(없음)", bothNull);

  console.log("\n── 각자 제 것만 엽니다");
  const noAgree = denied(as(ASK) + "select share_wantedcontact('" +
    J({ id:RID, on:true }) + "'::jsonb)");
  ok("⚠️ 동의 시각 없이는 못 연다 (제17조 제2항 — 별도 동의)",
     noAgree.no, noAgree.why);
  const s1 = allowed(shr(ASK, RID, true));
  ok("올리신 분이 제 번호를 연다", s1.yes && s1.out === "owner_shared",
     s1.out || s1.why);
  const half = psql(as(MEM) + "select coalesce(owner_contact,'(없음)') || '/' || " +
    "coalesce(helper_contact,'(없음)') from v_wanted_contact where reply_id = '" +
    RID + "'");
  ok("⚠️⚠️ 한쪽만 열어도 **그쪽 것만** 간다 (맞바꾸기를 강요하지 않습니다)",
     half === "010-7000-0000/(없음)", half);
  const s2 = allowed(shr(MEM, RID, true));
  ok("답하신 분도 제 번호를 연다", s2.yes && s2.out === "helper_shared",
     s2.out || s2.why);
  const both = psql(as(ASK) + "select coalesce(owner_contact,'(없음)') || '/' || " +
    "coalesce(helper_contact,'(없음)') from v_wanted_contact where reply_id = '" +
    RID + "'");
  ok("  둘 다 열면 둘 다 간다", both === "010-7000-0000/010-8000-0000", both);
  /* ⚠️ 철회권 — 다시 닫을 수 있어야 합니다. 그리고 **닫을 때는 동의
     시각을 안 받습니다** (받으면 철회를 막는 꼴입니다). */
  const off = allowed(shr(ASK, RID, false));
  ok("⚠️ 다시 닫을 수 있다 (철회권 · 닫을 때는 동의를 안 받습니다)",
     off.yes && off.out === "owner_hidden", off.out || off.why);
  const afterOff = psql(as(MEM) + "select coalesce(owner_contact,'(없음)') " +
    "from v_wanted_contact where reply_id = '" + RID + "'");
  ok("  닫으면 그 번호가 **바로 빠진다**", afterOff === "(없음)", afterOff);
  const nosyC = allowed(as(NOSY) + "select count(*) from v_wanted_contact " +
    "where reply_id = '" + RID + "'");
  ok("⚠️ 남은 그 짝의 연락처 줄을 아예 못 본다", nosyC.yes && nosyC.out === "0",
     nosyC.out || nosyC.why);
  const strangerShare = denied(shr(NOSY, RID, true));
  ok("  ⚠️ 남은 그 답의 연락처를 **열 수도 없다**", strangerShare.no, strangerShare.why);

  console.log("\n── 거절 · 거두기");
  const r5 = allowed(rep(MEM2, WID2, { body:"거절될 답입니다" }));
  const RJ = r5.out;
  const rej = allowed(mv(ASK, RJ, "rejected"));
  ok("올리신 분이 거절할 수 있다", rej.yes, rej.why);
  const shareRej = denied(shr(ASK, RJ, true));
  ok("⚠️ 거절된 답은 연락처를 **열 수 없다** (받아들인 뒤에만)",
     shareRej.no && shareRej.why.indexOf("받아들인 뒤에") >= 0, shareRej.why);
  const r6 = allowed(put(ASK, { title:"거둘 답이 올 글" }));
  const r7 = allowed(rep(MEM, r6.out, { body:"거둬 볼 답입니다" }));
  const cancelByOwner = denied(mv(ASK, r7.out, "canceled"));
  ok("⚠️ 올리신 분은 **못 거둔다** (거두는 것은 답하신 분의 뜻입니다)",
     cancelByOwner.no, cancelByOwner.why);
  const cancel = allowed(mv(MEM, r7.out, "canceled"));
  ok("답하신 분은 거둘 수 있다", cancel.yes, cancel.why);
  const twiceMv = denied(mv(ASK, RJ, "accepted"));
  ok("⚠️ 이미 처리된 답은 다시 못 옮긴다", twiceMv.no, twiceMv.why);

  // ── ⑥ 고치기 ─────────────────────────────────────────────────
  console.log("\n── 올린 것을 고칩니다");
  const notMine = denied(as(NOSY) + "select edit_wanted('" +
    J({ id:WID2, title:"남의 것을 고쳐 봅니다" }) + "'::jsonb)");
  ok("남은 못 고친다", notMine.no, notMine.why);
  /* ⚠️⚠️⚠️ **보낸 칸만 고쳐야 합니다.** `save_provider_self` 처럼 통째로
     덮는 꼴이면 화면이 칸 하나를 빠뜨리는 날 그 칸이 **지워집니다**
     (`js/deskme.js` 가 `industries` 를 지우고 있던 그 자리). 제목만
     보내고 예산 · 분류 · 지역이 그대로인지 봅니다. */
  const ed = allowed(as(ASK) + "select edit_wanted('" +
    J({ id:WID2, title:"주말 오전 레슨 구합니다 (다시)" }) + "'::jsonb)");
  ok("올리신 분은 고칠 수 있다", ed.yes, ed.why);
  const kept = psql(as(ASK) + "select title || '|' || coalesce(budget::text,'(null)') || " +
    "'|' || cat || '|' || coalesce(sub,'(null)') || '|' || region || " +
    "'|' || coalesce(when_txt,'(null)') from wanted where id = '" + WID2 + "'");
  ok("⚠️⚠️ **보낸 칸만 바뀌고 나머지가 안 지워진다** (통째로 덮는 문이 아닙니다)",
     kept === "주말 오전 레슨 구합니다 (다시)|200000|lesson|ls-solo|seoul|주말 오전",
     kept);
  /* ⚠️⚠️ **분류 · 하위 · 지역은 못 고칩니다** — 바꾸면 답하신 분이
     전혀 다른 것에 묶입니다. 보내도 **조용히 무시**합니다. */
  allowed(as(ASK) + "select edit_wanted('" +
    J({ id:WID2, cat:"market", sub:"us-iron", region:"jeju" }) + "'::jsonb)");
  const stillSame = psql(as(ASK) + "select cat || '|' || coalesce(sub,'(null)') || " +
    "'|' || region from wanted where id = '" + WID2 + "'");
  ok("⚠️⚠️ **분류 · 하위 · 지역은 보내도 안 바뀐다** (답하신 분이 다른 " +
     "것에 묶이지 않게)", stillSame === "lesson|ls-solo|seoul", stillSame);
  /* ⚠️ 예산은 **지울 수 있어야** 합니다 — 빈 글자를 null 로 읽습니다 */
  allowed(as(ASK) + "select edit_wanted('" + J({ id:WID2, budget:"" }) + "'::jsonb)");
  const cleared = psql(as(ASK) + "select coalesce(budget::text,'(null)') " +
    "from wanted where id = '" + WID2 + "'");
  ok("⚠️ 예산을 **비워 보내면 지워진다** (안 적은 것으로 돌아갑니다)",
     cleared === "(null)", cleared);
  allowed(as(ASK) + "select edit_wanted('" + J({ id:WID2, budget:"0" }) + "'::jsonb)");
  const zeroKept = psql(as(ASK) + "select coalesce(budget::text,'(null)') " +
    "from wanted where id = '" + WID2 + "'");
  ok("  ⚠️⚠️ **0 을 보내면 0 이 담긴다** (빈 글자와 섞이지 않습니다)",
     zeroKept === "0", zeroKept);
  const edClosed = denied(as(ASK) + "select edit_wanted('" +
    J({ id:WID, title:"내려간 글을 고쳐 봅니다" }) + "'::jsonb)");
  ok("⚠️ 내려간 글은 못 고친다", edClosed.no, edClosed.why);

  // ── ⑦ 내리기 · 가리기 ────────────────────────────────────────
  console.log("\n── 내리기 (글쓴이) · 가리기 (운영자)");
  const r2 = allowed(put(ASK, { title:"가려 볼 구합니다 글" }));
  const HID = r2.out;
  /* ⚠️⚠️⚠️ **거절하는 말까지 맞춰 봅니다.** 처음에 "거절되었나" 만
     보았더니, `coalesce(my_role(), '')` 가 `''::app_role` 로 터지는
     것을 **자물쇠가 막은 것으로** 읽고 통과했습니다 — 즉 아무도 글을
     가릴 수 없는 고장을 검사가 **초록으로 덮고** 있었습니다.
     작업 기억의 "자물쇠마다 다른 말로 거절하게 두세요" 그 자리입니다. */
  const hideNoWhy = denied(as(ADM) + "select move_wanted('" +
    J({ id:HID }) + "'::jsonb)");
  ok("⚠️⚠️ 까닭 없이는 못 가린다 (불평마다 지워 주는 자리가 되지 않게)",
     hideNoWhy.no && hideNoWhy.why.indexOf("까닭을") >= 0, hideNoWhy.why);
  const hideNotAdm = denied(as(ASK) + "select move_wanted('" +
    J({ id:HID, why:"내 것이니 가려 볼까" }) + "'::jsonb)");
  ok("⚠️ 가리는 것은 **운영자만** (글쓴이도 못 합니다)",
     hideNotAdm.no && hideNotAdm.why.indexOf("운영자만") >= 0, hideNotAdm.why);
  const hid = allowed(as(ADM) + "select move_wanted('" +
    J({ id:HID, why:"광고로 보이는 글입니다" }) + "'::jsonb)");
  ok("운영자는 까닭을 적고 가린다", hid.yes && hid.out === "hidden", hid.out || hid.why);
  const gone = allowed(anon + "select count(*) from v_wanted_open where id = '" +
    HID + "'");
  ok("  가려진 글은 공개 목록에서 **빠진다**", gone.yes && gone.out === "0",
     gone.out || gone.why);
  const why = psql(as(ASK) + "select hidden_why from wanted where id = '" + HID + "'");
  ok("  ⚠️ 가린 **까닭을 글쓴이가 본다** (무엇이 문제였는지 알아야 합니다)",
     why === "광고로 보이는 글입니다", why);
  const undo = denied(as(ASK) + "select close_wanted('" +
    J({ id:HID, to:"closed" }) + "'::jsonb)");
  ok("  ⚠️⚠️ 가려진 것을 글쓴이가 **못 되돌린다**", undo.no, undo.why);
  const repHid = denied(rep(MEM, HID, {}));
  ok("  ⚠️ 가려진 글에는 **답도 안 들어간다** (상태 하나로 저절로 막힙니다)",
     repHid.no, repHid.why);
  const edHid = denied(as(ASK) + "select edit_wanted('" +
    J({ id:HID, title:"가려졌는데 고쳐 봅니다" }) + "'::jsonb)");
  ok("  ⚠️ 가려진 글은 **못 고친다**", edHid.no, edHid.why);
  const twiceHid = denied(as(ADM) + "select move_wanted('" +
    J({ id:HID, why:"또 가려 봅니다" }) + "'::jsonb)");
  ok("  ⚠️ 이미 가려진 글은 다시 못 가린다", twiceHid.no, twiceHid.why);
  /* ⚠️ 감사 기록에 **까닭의 글자**를 넣지 않습니다 (오래 남고 보는
     사람도 넓습니다 — 길이만 남깁니다) */
  const logData = psql("select data::text from audit_log where obj = 'wanted' " +
    "and obj_id = '" + HID + "' order by at desc limit 1");
  ok("  ⚠️⚠️ 기록에 **까닭의 글자가 안 담긴다** (길이만 남깁니다)",
     logData.indexOf("광고") < 0 && logData.indexOf("why_len") >= 0, logData);

  const done = allowed(as(ASK) + "select close_wanted('" +
    J({ id:WID2, to:"done" }) + "'::jsonb)");
  ok("구했다고 내릴 수 있다", done.yes, done.why);
  const doneGone = allowed(anon + "select count(*) from v_wanted_open where id = '" +
    WID2 + "'");
  ok("  구한 글도 공개 목록에서 빠진다", doneGone.yes && doneGone.out === "0",
     doneGone.out || doneGone.why);
  const badTo = denied(as(ASK) + "select close_wanted('" +
    J({ id:HID, to:"zzz" }) + "'::jsonb)");
  ok("  모르는 자리로는 못 옮긴다", badTo.no, badTo.why);

  // ── ⑧ 신고 ───────────────────────────────────────────────────
  console.log("\n── 신고 (report 에 칸을 더했습니다 · 새 표가 아닙니다)");
  const r3 = allowed(put(ASK, { title:"신고될 구합니다 글" }));
  const RPT = r3.out;
  const rp = allowed(as(MEM2) + "select open_report('" +
    J({ kind:"abuse", wanted:RPT, body:"광고로 보이는 글입니다" }) + "'::jsonb)");
  ok("구합니다 글을 신고할 수 있다", rp.yes && /^[0-9a-f-]{36}$/.test(rp.out),
     rp.out || rp.why);
  const dup = denied(as(MEM2) + "select open_report('" +
    J({ kind:"abuse", wanted:RPT, body:"같은 것을 또 넣어 봅니다" }) + "'::jsonb)");
  ok("  ⚠️ 같은 것을 두 번은 막힌다 (0040 의 중복 막음이 살아 있습니다)",
     dup.no, dup.why);
  /* ⚠️ 0060 의 본문을 그대로 꺼내 썼으니, **앞 갈래도 그대로** 돌아야
     합니다 (손으로 다시 써서 조용히 날리지 않았는지 봅니다) */
  const repNone = denied(as(MEM2) + "select open_report('" +
    J({ kind:"abuse", body:"아무것도 안 가리키고 넣어 봅니다" }) + "'::jsonb)");
  ok("  ⚠️ 무엇에 대한 것인지 없으면 막힌다 (앞 갈래가 안 날아갔습니다)",
     repNone.no, repNone.why);
  const rptCol = psql("select count(*) from information_schema.columns " +
    "where table_name = 'report' and column_name = 'wanted_id'");
  ok("  칸을 더했습니다 (새 표를 안 만들었습니다)", rptCol === "1", rptCol);
  /* ⚠️ 앞 줄이 떨어졌으면 여기서 터지지 않게 (터지면 남은 묶음이 안 돕니다) */
  const rptSet = rp.yes
    ? psql(as(ADM) + "select coalesce(wanted_id::text,'(null)') " +
           "from report where id = '" + rp.out + "'")
    : "(앞 줄이 떨어져서 못 쟀습니다)";
  ok("  ⚠️⚠️ 그 칸에 **값이 실제로 들어간다** (문이 열쇠를 모르면 영원히 null 입니다)",
     rptSet === RPT, rptSet);
  /* ⚠️⚠️⚠️ **0040 의 `report_target_ck` 도 같이 늘려야 합니다.** 칸을
     더하고 문을 고쳐도, 그 check 가 옛 칸 목록이면 표가 **거절**합니다.
     0060 이 `teetime_id` 를 더하며 그것을 빠뜨렸고(그래서 티타임 신고가
     한 건도 안 들어갔습니다) 0061 이 **아홉을 다** 적었습니다 —
     ⚠️ 그래서 여기서 **칸 이름을 세지 않고** 그 check 가 가리키는
     칸들이 실제로 통과하는지를 봅니다 (이름을 박으면 칸을 더하는 날
     멀쩡한 코드가 떨어집니다). */
  const ck = psql("select pg_get_constraintdef(oid) from pg_constraint " +
    "where conname = 'report_target_ck'");
  const rcol = psql("select string_agg(column_name, ',' order by column_name) " +
    "from information_schema.columns where table_name = 'report' " +
    "and column_name like '%\\_id' and column_name <> 'id'");
  const missing = rcol.split(",").filter(c => ck.indexOf(c) < 0);
  ok("⚠️⚠️⚠️ 신고가 가리킬 수 있는 칸이 **하나도 빠지지 않았다** " +
     "(빠진 칸으로 신고하면 표가 거절합니다 — 0060 이 그 꼴이었습니다)",
     missing.length === 0, "빠진 칸: " + missing.join(",") + " · " + ck);

  // ── ⑨ 알림 ───────────────────────────────────────────────────
  console.log("\n── 알림 (0050 의 트리거 · 마이그레이션을 걸칩니다)");
  /* ⚠️⚠️ **받는 사람 눈으로** 읽습니다 — 0050 은 운영자 정책을 일부러
     안 두었으므로 운영자로 훑으면 0줄이고, 빈 글자를 보고 통과하는
     아무것도 안 잡는 검사가 됩니다. */
  const r4 = allowed(put(ASK, { title:"알림 볼 구합니다 글" }));
  const NID = r4.out;
  const n1 = allowed(rep(MEM, NID, { body:"알림이 붙을 답입니다" }));
  /* ⚠️⚠️ **그 글 것만 셉니다** — 앞에서 이미 답을 여러 번 넣었으므로
     갈래 전체를 세면 엉뚱한 수가 나오고 그것은 제 검사가 틀린
     것입니다 (0056 에서 겪은 자리). */
  const got = psql(as(ASK) + "select count(*) from notice " +
    "where kind = 'wantedreply' and obj_id = '" + NID + "'");
  ok("답이 들어오면 **올리신 분에게** 알림이 붙는다", got === "1", got);
  allowed(rep(MEM2, NID, { body:"또 다른 분의 답입니다" }));
  const again = psql(as(ASK) + "select count(*) from notice " +
    "where kind = 'wantedreply' and obj_id = '" + NID + "'");
  ok("  ⚠️ 같은 글에 또 답이 와도 **알림이 안 쌓인다** (안 읽은 동안)",
     again === "1", again);
  const title = psql(as(ASK) + "select title from notice " +
    "where kind = 'wantedreply' and obj_id = '" + NID + "'");
  ok("  ⚠️⚠️ 알림에 **손님이 적은 글 · 연락처가 한 글자도 없다**",
     title.indexOf("010-") < 0 && title.indexOf("알림이 붙을") < 0, title);
  const noBody = psql("select count(*) from information_schema.columns " +
    "where table_name = 'notice' and column_name = 'body'");
  ok("  ⚠️⚠️⚠️ 알림 표에 **본문 칸이 아예 없다** (담으면 손님 글이 한 벌 " +
     "더 복사됩니다)", noBody === "0", noBody);
  allowed(mv(ASK, n1.out, "accepted"));
  const moved = psql(as(MEM) + "select count(*) from notice " +
    "where kind = 'wantedmoved' and obj_id = '" + n1.out + "'");
  ok("답이 처리되면 **답하신 분에게** 알림이 붙는다", moved === "1", moved);
  /* ⚠️ 제가 한 일은 제게 안 알립니다 (0050) — 올리신 분이 받아들였으니
     올리신 분에게는 그 알림이 없어야 합니다 */
  const notSelf = psql(as(ASK) + "select count(*) from notice " +
    "where kind = 'wantedmoved'");
  ok("  ⚠️ **제가 한 일은 제게 안 알린다**", notSelf === "0", notSelf);
  const hidN = psql(as(ASK) + "select count(*) from notice " +
    "where kind = 'hidden' and obj = 'wanted' and obj_id = '" + HID + "'");
  ok("가려지면 올리신 분에게 알림이 붙는다 (갈래는 0050 의 hidden 그대로)",
     hidN === "1", hidN);
  /* ⚠️ 가는 자리는 **우리 주소만**입니다 (`//` 는 열린 넘겨주기입니다) */
  const href = psql(as(ASK) + "select link from notice " +
    "where kind = 'wantedreply' and obj_id = '" + NID + "'");
  ok("  ⚠️ 가는 자리가 **우리 주소**다 (`/` 로 시작하고 `//` 가 아닙니다)",
     href === "/my", href);

  console.log("\n── 안쪽 도움함수를 직접 못 부릅니다");
  /* ⚠️⚠️⚠️ **함수는 표와 반대입니다** — 만드는 순간 `public` 에게
     EXECUTE 가 붙습니다. 0050 의 `notify_one` 이 그 꼴이라 로그인한
     누구나 아무에게 아무 제목으로 알림을 꽂을 수 있었습니다. */
  const trg = denied(as(MEM) + "select notice_wantedreply()");
  ok("⚠️⚠️ 트리거 함수를 직접 못 부른다 (revoke all … from public)",
     trg.no, trg.why);
  const trg2 = denied(as(MEM) + "select notice_wantedmoved()");
  ok("  답 처리 트리거도 못 부른다", trg2.no, trg2.why);
  const trg3 = denied(as(MEM) + "select notice_hidden_wanted()");
  ok("  가리기 트리거도 못 부른다", trg3.no, trg3.why);
};

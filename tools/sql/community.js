/* ════════════════════════════════════════════════════════════════════
   골프 커뮤니티 — 질문과 답변을 눌러 봅니다 (0047 · 지시서 §2.C)

   ⚠️⚠️⚠️ **여기서 가장 조심한 것은 "글은 공개지만 글쓴이는 아니다"**
   입니다 (후기 0037 에서 배운 자리). 공개 보기에 `by_user` 가 들어가면
   누가 무엇을 물었는지가 통째로 공개됩니다 — 그래서 **칸이 있는지부터**
   봅니다. 비어 있는 것과 칸이 없는 것은 다릅니다.

   ⚠️⚠️ **지우지 않고 내립니다.** 내려간 글이 줄로 남아 있는지, 그리고
   공개 목록에서는 빠지는지를 **따로** 봅니다.

   ⚠️ 가릴 때 **까닭이 반드시** 있어야 합니다 — 까닭 없이 가릴 수 있으면
   불평할 때마다 지워 주는 자리가 됩니다.

   ⚠️ 재는 것은 늘 **문**입니다. 표에 바로 넣으면 자물쇠를 지나갑니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0047 커뮤니티 — 씨앗");
  const ASK = psql("insert into auth.users (email) values ('cm-ask@x.test') returning id");
  const ANS = psql("insert into auth.users (email) values ('cm-ans@x.test') returning id");
  const OTH = psql("insert into auth.users (email) values ('cm-oth@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('cm-adm@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + ASK + "','customer','김질문')," +
       "('" + ANS + "','customer','이답변')," +
       "('" + OTH + "','customer','남')," +
       "('" + ADM + "','admin','커뮤 관리자') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const J    = o => JSON.stringify(o).replace(/'/g, "''");

  /* ⚠️ 10분에 한 건이 막으므로, 여러 건을 넣어야 할 때는 **시계를
     되돌리지 않고** 사람을 바꿉니다 (문을 지나가지 않게). */
  const ask = (who, extra) => as(who) + "select ask_cq('" +
    J(Object.assign({ cat:"lesson", title:"드라이버 슬라이스 고치는 법",
                      body:"오른쪽으로 많이 휩니다. 어떻게 잡으셨나요?" }, extra)) + "'::jsonb)";
  const ans = (who, qid, extra) => as(who) + "select answer_cq('" +
    J(Object.assign({ q_id:qid, body:"그립을 먼저 보시는 것이 좋습니다" }, extra)) + "'::jsonb)";

  // ── ① 질문 올리기 ─────────────────────────────────────────────
  console.log("\n── 질문을 올립니다");
  const q1 = allowed(ask(ASK, {}));
  ok("로그인하면 질문을 올릴 수 있다", q1.yes && /^[0-9a-f-]{36}$/.test(q1.out),
     q1.out || q1.why);
  const QID = q1.out;

  const anonAsk = denied(anon + "select ask_cq('" +
    J({ cat:"lesson", title:"비로그인", body:"올려 봅니다" }) + "'::jsonb)");
  ok("비로그인은 못 올린다", anonAsk.no, anonAsk.why);

  console.log("\n── 자물쇠마다 다른 말로 거절합니다");
  const says = {};
  const d1 = denied(ask(ANS, { cat:"" }));        says.cat   = d1.why;
  ok("분류가 없으면 막힌다", d1.no, d1.why);
  const d2 = denied(ask(ANS, { title:"짧" }));    says.title = d2.why;
  ok("제목이 짧으면 막힌다", d2.no, d2.why);
  const d3 = denied(ask(ANS, { body:"짧" }));     says.body  = d3.why;
  ok("내용이 짧으면 막힌다", d3.no, d3.why);
  const d4 = denied(ask(ANS, { title:"가".repeat(81) })); says.long = d4.why;
  ok("제목이 길면 막힌다", d4.no, d4.why);
  const uniq = new Set(Object.values(says));
  ok("⚠️ 네 자물쇠가 **서로 다른 말**로 거절한다",
     uniq.size === Object.keys(says).length, JSON.stringify(says));

  // ── ② 공개 보기 — ⚠️ 글쓴이는 공개가 아닙니다 ─────────────────
  console.log("\n── ⚠️⚠️ 글은 공개지만 **글쓴이는 공개가 아닙니다**");
  const qcols = psql("select string_agg(column_name, ',' order by column_name) " +
    "from information_schema.columns where table_name = 'v_cq_public'");
  ok("⚠️ 공개 보기에 by_user 칸이 **없다** (비어 있는 것과 다릅니다)",
     qcols.indexOf("by_user") < 0, qcols);
  ok("  대신 가린 이름(who)이 있다", qcols.indexOf("who") >= 0, qcols);
  ok("  답변 수는 칸이 아니라 **세어서** 냅니다", qcols.indexOf("answer_n") >= 0, qcols);

  const who = psql(anon + "select who from v_cq_public where id = '" + QID + "'");
  ok("⚠️ 이름이 가려져 나온다 (김질문 → 김**)", who === "김**", who);

  const seeAnon = allowed(anon + "select count(*) from v_cq_public where id = '" + QID + "'");
  ok("비로그인도 질문을 읽는다 (크롤러도 봅니다)", seeAnon.yes && seeAnon.out === "1",
     seeAnon.out || seeAnon.why);
  const anonTbl = denied(anon + "select by_user from cq limit 1");
  ok("비로그인은 표를 못 읽는다", anonTbl.no, anonTbl.why);
  /* ⚠️⚠️ 로그인했다고 남의 글 임자를 읽을 수 있으면 안 됩니다 */
  const othTbl = allowed(as(OTH) + "select count(*) from cq where id = '" + QID + "'");
  ok("⚠️⚠️ 로그인해도 **남의 질문 줄은 표에서 안 보인다**",
     othTbl.yes && othTbl.out === "0", othTbl.out || othTbl.why);

  // ── ③ 답변 ────────────────────────────────────────────────────
  console.log("\n── 답변을 답니다");
  const a1 = allowed(ans(ANS, QID, {}));
  ok("남이 답변을 달 수 있다", a1.yes && /^[0-9a-f-]{36}$/.test(a1.out), a1.out || a1.why);
  const AID = a1.out;

  const n1 = psql(anon + "select answer_n from v_cq_public where id = '" + QID + "'");
  ok("⚠️ 답변 수가 **세어져** 올라간다 (칸에 저장하지 않습니다)", n1 === "1", n1);

  /* ⚠️ psql 은 boolean 을 **`t` · `f`** 로 돌려줍니다 (`true`/`false` 가
     아닙니다). `::text` 를 붙이면 `true`/`false` 입니다 — 섞어 쓰면
     멀쩡한 값을 틀렸다고 합니다. 여기서는 붙여서 읽습니다. */
  const byAsker = psql(anon +
    "select by_asker::text from v_ca_public where id = '" + AID + "'");
  ok("답변이 글쓴이 것인지 가려 준다 (여기서는 남이라 false)",
     byAsker === "false", byAsker);
  /* 글쓴이가 제 질문에 보충 설명을 달면 true 여야 합니다 */
  const selfA = allowed(ans(ASK, QID, { body:"제가 보충 설명을 답니다" }));
  if(selfA.yes){
    const mine = psql(anon +
      "select by_asker::text from v_ca_public where id = '" + selfA.out + "'");
    ok("  글쓴이가 단 답변은 true 로 가려 준다 (화면이 '글쓴이' 라고 적습니다)",
       mine === "true", mine);
  }

  const noQ = denied(as(OTH) + "select answer_cq('" +
    J({ q_id:"00000000-0000-0000-0000-000000000000", body:"없는 질문에 답합니다" }) + "'::jsonb)");
  ok("없는 질문에는 못 단다", noQ.no, noQ.why);

  // ── ④ 고치기 ──────────────────────────────────────────────────
  console.log("\n── 글쓴이가 제 글을 고칩니다 (§2.C)");
  const othEdit = denied(as(OTH) + "select edit_cq('" +
    J({ id:QID, title:"남이 고칩니다", body:"고쳐 봅니다" }) + "'::jsonb)");
  ok("⚠️ 남은 못 고친다", othEdit.no, othEdit.why);
  const myEdit = allowed(as(ASK) + "select edit_cq('" +
    J({ id:QID, title:"드라이버 슬라이스 (고침)", body:"내용도 고쳤습니다" }) + "'::jsonb)");
  ok("올리신 분은 고칠 수 있다", myEdit.yes, myEdit.why);
  const t2 = psql(anon + "select title from v_cq_public where id = '" + QID + "'");
  ok("  실제로 바뀌었다 (에러만 보지 않고 값을 봅니다)",
     t2 === "드라이버 슬라이스 (고침)", t2);
  /* ⚠️ 분류는 바꾸는 길이 없어야 합니다 — 바꾸면 답변이 다른 자리로 갑니다 */
  psql(as(ASK) + "select edit_cq('" +
    J({ id:QID, title:"또 고칩니다", body:"분류도 보내 봅니다", cat:"travel" }) + "'::jsonb)");
  const cat2 = psql(anon + "select cat from v_cq_public where id = '" + QID + "'");
  ok("⚠️ 분류는 고치는 문으로 **안 바뀐다** (보내도 무시합니다)", cat2 === "lesson", cat2);

  const othEditA = denied(as(OTH) + "select edit_ca('" +
    J({ id:AID, body:"남의 답변을 고칩니다" }) + "'::jsonb)");
  ok("⚠️ 남의 답변도 못 고친다", othEditA.no, othEditA.why);
  ok("  질문과 답변이 **다른 말**로 거절한다", othEdit.why !== othEditA.why,
     othEdit.why + " | " + othEditA.why);

  // ── ⑤ 내리기 · 가리기 ─────────────────────────────────────────
  console.log("\n── ⚠️ 지우지 않고 내립니다");
  const q2 = allowed(ask(ANS, { title:"내릴 질문", body:"내려 볼 글입니다" }));
  const QID2 = q2.out;
  const othDrop = denied(as(OTH) + "select move_cq('" + J({ id:QID2, state:"dropped" }) + "'::jsonb)");
  ok("남은 못 내린다", othDrop.no, othDrop.why);
  const myDrop = allowed(as(ANS) + "select move_cq('" + J({ id:QID2, state:"dropped" }) + "'::jsonb)");
  ok("올리신 분은 내릴 수 있다", myDrop.yes && myDrop.out === "dropped",
     myDrop.out || myDrop.why);
  const gone = psql(anon + "select count(*) from v_cq_public where id = '" + QID2 + "'");
  ok("  공개 목록에서 빠진다", gone === "0", gone);
  /* ⚠️⚠️ **줄은 남아 있어야 합니다** — 지우면 "그런 말 한 적 없다" 가 됩니다 */
  const still = psql("select state from cq where id = '" + QID2 + "'");
  ok("⚠️⚠️ 그런데 **줄은 남아 있다** (지우지 않습니다)", still === "dropped", still);

  console.log("\n── 가리는 것은 운영자만 · 까닭이 반드시");
  const userHide = denied(as(ASK) + "select move_cq('" +
    J({ id:QID, state:"hidden", why:"제가 가려 봅니다" }) + "'::jsonb)");
  ok("⚠️ 손님은 못 가린다", userHide.no, userHide.why);
  const noWhy = denied(as(ADM) + "select move_cq('" + J({ id:QID, state:"hidden" }) + "'::jsonb)");
  ok("⚠️⚠️ 운영자도 **까닭 없이는 못 가린다**", noWhy.no, noWhy.why);
  ok("  그 거절이 **까닭**을 말한다", noWhy.no && noWhy.why.indexOf("까닭") >= 0, noWhy.why);
  const hid = allowed(as(ADM) + "select move_cq('" +
    J({ id:QID, state:"hidden", why:"광고 글입니다" }) + "'::jsonb)");
  ok("운영자는 까닭을 적고 가릴 수 있다", hid.yes && hid.out === "hidden",
     hid.out || hid.why);
  const hidGone = psql(anon + "select count(*) from v_cq_public where id = '" + QID + "'");
  ok("  가려진 질문이 공개 목록에서 빠진다", hidGone === "0", hidGone);
  /* ⚠️ 질문이 가려지면 **그 답변도 공개에서 빠져야** 합니다 — 안 빠지면
     가린 글의 답글만 둥둥 떠서 무슨 말인지 알 수 없습니다. */
  const ansGone = psql(anon + "select count(*) from v_ca_public where id = '" + AID + "'");
  ok("⚠️⚠️ 가려진 질문의 **답변도 같이 빠진다**", ansGone === "0", ansGone);
  const whyRow = psql("select hidden_why from cq where id = '" + QID + "'");
  ok("  가린 까닭이 줄에 남는다", whyRow === "광고 글입니다", whyRow);
  const auditBody = psql("select coalesce(string_agg(data::text,'|'),'') from audit_log " +
    "where obj = 'cq' and obj_id = '" + QID + "'");
  ok("⚠️ 감사 기록에 **글 내용이 안 들어간다**",
     auditBody.indexOf("광고 글입니다") < 0 && auditBody.indexOf("why_len") >= 0, auditBody);

  const hidEdit = denied(as(ASK) + "select edit_cq('" +
    J({ id:QID, title:"가려졌는데 고칩니다", body:"고쳐 봅니다" }) + "'::jsonb)");
  ok("⚠️ 가려진 글은 글쓴이도 못 고친다 (고쳐서 가린 뜻을 지울 수 없습니다)",
     hidEdit.no, hidEdit.why);
  const hidAns = denied(ans(OTH, QID, {}));
  ok("⚠️ 가려진 질문에는 답변도 못 단다", hidAns.no, hidAns.why);

  // ── ⑥ 쏟아붓기 — ⚠️ 경계가 실제로 거기 있는지 ─────────────────
  console.log("\n── ⚠️ 쏟아붓기 막기");
  const again = denied(ask(ASK, { title:"바로 또 올립니다", body:"10분 안에 또 올려 봅니다" }));
  ok("⚠️ 10분 안에 또 올리면 막힌다", again.no, again.why);
  ok("  그 거절이 **10분**이라고 말한다", again.no && again.why.indexOf("10분") >= 0,
     again.why);

  /* ⚠️⚠️ 하루 제한이 **영원히 안 걸리는 자물쇠**가 아닌지 봅니다.
     10분 제한이 이미 막고 있으므로, 10분보다 오래된 줄을 **문으로
     넣은 뒤 시계를 뒤로 밀어** 열 건을 만들고 열한째를 눌러 봅니다. */
  psql("update cq set created_at = now() - interval '2 hours' where by_user = '" + ASK + "'");
  let made = 1;                       /* 이미 하나(QID) 있습니다 */
  for(let i = 0; i < 9; i++){
    const r = allowed(ask(ASK, { title:"하루 제한 검사 " + i, body:"열 건을 채웁니다" }));
    if(r.yes){ made++; psql("update cq set created_at = now() - interval '1 hour' " +
                            "where id = '" + r.out + "'"); }
  }
  ok("열 건까지는 들어간다", made === 10, "들어간 것 " + made);
  const day = denied(ask(ASK, { title:"열한째", body:"열한 번째를 넣어 봅니다" }));
  ok("⚠️ 열한째는 막힌다 — **경계가 실제로 거기 있습니다**", day.no, day.why);
  ok("  그 거절이 **하루 열 건**이라고 말한다 (10분과 다른 말)",
     day.no && day.why.indexOf("하루 열 건") >= 0, day.why);

  // ── ⑦ 신고 — ⚠️ 새 표를 만들지 않습니다 ───────────────────────
  console.log("\n── 신고는 기존 report 에 붙입니다 (§0-6)");
  const q3 = allowed(ask(OTH, { title:"신고될 질문", body:"신고해 볼 글입니다" }));
  const rep = allowed(as(ANS) + "select open_report('" +
    J({ kind:"abuse", question:q3.out, body:"광고 글로 보입니다" }) + "'::jsonb)");
  ok("질문을 신고할 수 있다", rep.yes && /^[0-9a-f-]{36}$/.test(rep.out), rep.out || rep.why);
  const where = psql("select cq_id from report where id = '" + rep.out + "'");
  ok("  그 신고가 **그 질문**을 가리킨다", where === q3.out, where);
  const repA = allowed(as(ASK) + "select open_report('" +
    J({ kind:"abuse", answer:AID, body:"비방하는 답변입니다" }) + "'::jsonb)");
  ok("답변도 신고할 수 있다", repA.yes, repA.why);
  /* ⚠️⚠️ 0040 · 0046 이 하던 일이 안 날아갔는지 */
  const shortB = denied(as(ANS) + "select open_report('" +
    J({ kind:"abuse", question:q3.out, body:"짧" }) + "'::jsonb)");
  ok("⚠️ 0040 의 **다섯 글자 막음이 살아 있다**", shortB.no, shortB.why);
  const dup = denied(as(ANS) + "select open_report('" +
    J({ kind:"abuse", question:q3.out, body:"또 넣어 봅니다" }) + "'::jsonb)");
  ok("⚠️ 중복 막음도 살아 있다", dup.no, dup.why);
  const noTarget = denied(as(ANS) + "select open_report('" +
    J({ kind:"abuse", body:"아무것도 안 가리킵니다" }) + "'::jsonb)");
  ok("⚠️ 가리키는 것이 없으면 여전히 막힌다", noTarget.no, noTarget.why);
  /* ⚠️ 0046 의 조인 신고도 아직 되는지 — 갈아 끼우며 안 날렸는지 */
  const jrId = psql("select id from joinroom limit 1");
  if(jrId){
    const repJ = allowed(as(ANS) + "select open_report('" +
      J({ kind:"abuse", joinroom:jrId, body:"조인 신고가 아직 되는지 봅니다" }) + "'::jsonb)");
    ok("⚠️⚠️ 0046 의 **조인 신고가 아직 된다** (갈아 끼우며 안 날렸습니다)",
       repJ.yes, repJ.why);
  }

  // ── ⑧ 들어오는 길은 문뿐 ──────────────────────────────────────
  console.log("\n── ⚠️ 들어오는 길은 문뿐입니다");
  const ins = denied(as(OTH) + "insert into cq (by_user, cat, title, body) values ('" +
    OTH + "','lesson','직접 넣기','표에 바로 넣어 봅니다')");
  ok("표에 직접 넣지 못한다", ins.no, ins.why);
  const upd = denied(as(OTH) + "update cq set state = 'live' where id = '" + QID + "'");
  ok("표를 직접 고치지 못한다", upd.no, upd.why);
  const stillHid = psql("select state from cq where id = '" + QID + "'");
  ok("⚠️ 그리고 실제로 **안 바뀌었다** (에러만 보지 않고 값을 봅니다)",
     stillHid === "hidden", stillHid);
};

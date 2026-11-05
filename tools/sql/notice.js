/* ════════════════════════════════════════════════════════════════════
   내부 알림 — 눌러 봅니다 (0050 · 지시서 §6)

   ⚠️⚠️⚠️ **알림은 "무엇이 생겼다" 까지입니다.** 표에 본문 칸이 아예
   없는지부터 봅니다 — 비어 있는 것과 칸이 없는 것은 다릅니다. 담으면
   손님이 적은 글이 한 벌 더 복사되고, 그 안에 연락처가 있으면 알림이
   그것을 나르는 길이 됩니다.

   ⚠️⚠️ **제 알림만 읽습니다.** 운영자 정책을 **안 두었는지**까지
   봅니다 (후기에서 "로그인한 아무나 읽는다" 를 두었다가 고친 자리).

   ⚠️⚠️ **문을 갈아 끼우지 않고 트리거로 답니다** — 그래서 기존 문
   (`apply_jobpost` · `answer_cq` …)을 **그대로 불러** 알림이 붙는지
   봅니다. 표에 직접 넣으면 트리거는 돌지만 **문이 하던 일**을 건너뛰어
   검사가 거짓이 됩니다.

   ⚠️ **RLS 는 UPDATE 에서 에러를 내지 않습니다** — 남의 알림을 읽음으로
   바꿔 보고 **바뀐 줄 수**를 봅니다 (에러가 안 나는 것이 정상입니다).
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0050 알림 — 씨앗");
  const HOST = psql("insert into auth.users (email) values ('nt-host@x.test') returning id");
  const GUE  = psql("insert into auth.users (email) values ('nt-gue@x.test') returning id");
  const OTH  = psql("insert into auth.users (email) values ('nt-oth@x.test') returning id");
  const ADM  = psql("insert into auth.users (email) values ('nt-adm@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + HOST + "','customer','알림주인')," +
       "('" + GUE  + "','customer','알림손님')," +
       "('" + OTH  + "','customer','남')," +
       "('" + ADM  + "','admin','알림 관리자') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const J    = o => JSON.stringify(o).replace(/'/g, "''");
  const NOW  = () => new Date().toISOString();

  // ── ① 표에 **본문 칸이 없는가** ────────────────────────────────
  console.log("\n── ⚠️⚠️ 알림에는 **본문 칸이 없습니다**");
  const cols = psql("select string_agg(column_name, ',' order by column_name) " +
    "from information_schema.columns where table_name = 'notice'");
  ok("⚠️ 본문(body) 칸이 **없다** (비어 있는 것과 다릅니다)",
     cols.indexOf("body") < 0, cols);
  ok("  제목 · 가는 자리 · 갈래만 있다",
     cols.indexOf("title") >= 0 && cols.indexOf("link") >= 0 &&
     cols.indexOf("kind") >= 0, cols);
  ok("  읽은 시각이 있다 (읽음을 지우지 않고 **적어 둡니다**)",
     cols.indexOf("read_at") >= 0, cols);

  /* ⚠️⚠️ **우리 주소만** 받습니다 — 바깥 주소가 들어가면 열린 넘겨주기 */
  const badLink = denied("insert into notice (to_user, kind, title, link) values ('" +
    HOST + "','quote','바깥으로','https://example.test/bad')");
  ok("⚠️⚠️ 바깥 주소는 표가 **거절한다** (열린 넘겨주기를 막습니다)",
     badLink.no, badLink.why);
  const badLink2 = denied("insert into notice (to_user, kind, title, link) values ('" +
    HOST + "','quote','빗금 둘','//example.test/bad')");
  ok("  `//` 로 시작하는 것도 거절한다 (그것도 바깥 주소입니다)",
     badLink2.no, badLink2.why);
  const badKind = denied("insert into notice (to_user, kind, title, link) values ('" +
    HOST + "','이런갈래는없습니다','제목','/my')");
  ok("  모르는 갈래도 거절한다", badKind.no, badKind.why);

  // ── ② 트리거 — 지원이 들어오면 알림이 붙는가 ──────────────────
  console.log("\n── 문을 그대로 부르면 알림이 붙습니다");
  const post = allowed(as(HOST) + "select open_jobpost('" +
    J({ kind:"hire", sub:"cr-caddy", region:"seoul", title:"알림 검사용 구인",
        body:"알림이 붙는지 봅니다.", contact:"010-1111-2222",
        agree_at:NOW() }) + "'::jsonb)");
  ok("  (씨앗) 글을 올렸습니다", post.yes, post.why);
  const PID = post.out;

  const before = psql("select count(*) from notice where to_user = '" + HOST + "'");
  ok("⚠️ 제 글을 올린 것만으로는 **제게 알림이 안 옵니다** (제가 한 일입니다)",
     before === "0", before);

  const ap = allowed(as(GUE) + "select apply_jobpost('" +
    J({ post_id:PID, msg:"지원합니다", contact:"010-3333-4444",
        agree_at:NOW() }) + "'::jsonb)");
  ok("  (씨앗) 지원을 보냈습니다", ap.yes, ap.why);
  const AID = ap.out;

  const got = psql("select count(*) from notice where to_user = '" + HOST +
                   "' and kind = 'jobapply'");
  ok("⚠️⚠️ 지원이 들어오면 **올린 사람에게** 알림이 붙는다", got === "1", got);
  const link = psql("select link from notice where to_user = '" + HOST +
                    "' and kind = 'jobapply'");
  ok("  가는 자리가 우리 주소다", link === "/my", link);
  const title = psql("select title from notice where to_user = '" + HOST +
                     "' and kind = 'jobapply'");
  /* ⚠️⚠️ 제목에 **손님이 적은 글이 섞이면 안 됩니다** */
  ok("⚠️⚠️ 제목에 손님이 적은 글(지원 내용 · 연락처)이 **안 섞인다**",
     title.indexOf("지원합니다") < 0 && title.indexOf("010-") < 0, title);
  const selfNone = psql("select count(*) from notice where to_user = '" + GUE + "'");
  ok("⚠️ 지원한 사람에게는 **제가 한 일**이라 안 옵니다", selfNone === "0", selfNone);

  /* ⚠️⚠️ **안 읽은 같은 알림은 더 쌓지 않습니다** — 같은 글에 다른
     사람이 또 지원해도 한 줄입니다 (열 줄이 되면 목록이 쓸모없습니다). */
  const ap2 = allowed(as(OTH) + "select apply_jobpost('" +
    J({ post_id:PID, msg:"저도 지원합니다", contact:"010-5555-6666",
        agree_at:NOW() }) + "'::jsonb)");
  ok("  (씨앗) 다른 사람도 지원했습니다", ap2.yes, ap2.why);
  const still1 = psql("select count(*) from notice where to_user = '" + HOST +
                      "' and kind = 'jobapply'");
  ok("⚠️⚠️ **안 읽은 같은 알림은 더 안 쌓인다** (한 줄입니다)",
     still1 === "1", still1);

  // ── ③ 수락 · 거절이 보낸 사람에게 갑니다 ───────────────────────
  console.log("\n── 수락 · 거절은 보낸 사람에게 갑니다");
  const acc = allowed(as(HOST) + "select move_jobapply('" +
    J({ id:AID, state:"accepted" }) + "'::jsonb)");
  ok("  (씨앗) 수락했습니다", acc.yes, acc.why);
  const toGue = psql("select title from notice where to_user = '" + GUE +
                     "' and kind = 'jobmoved'");
  ok("⚠️ 수락되면 **보낸 사람에게** 알림이 붙는다",
     toGue.indexOf("수락") >= 0, toGue);
  const rej = allowed(as(HOST) + "select move_jobapply('" +
    J({ id:ap2.out, state:"rejected" }) + "'::jsonb)");
  ok("  (씨앗) 다른 하나는 거절했습니다", rej.yes, rej.why);
  const toOth = psql("select title from notice where to_user = '" + OTH +
                     "' and kind = 'jobmoved'");
  ok("  거절도 알려 준다 (조용히 두지 않습니다)",
     toOth.indexOf("거절") >= 0, toOth);
  /* ⚠️ 거둔 것은 **제가 한 일**이라 안 옵니다 */
  const cancelPost = allowed(as(HOST) + "select open_jobpost('" +
    J({ kind:"hire", sub:"cr-caddy", region:"busan", title:"거두기 검사",
        body:"거두면 알림이 안 와야 합니다.", contact:"010-1111-2222",
        agree_at:NOW() }) + "'::jsonb)");
  const cancelAp = allowed(as(OTH) + "select apply_jobpost('" +
    J({ post_id:cancelPost.out, msg:"거둘 지원", contact:"010-5555-6666",
        agree_at:NOW() }) + "'::jsonb)");
  const nOthBefore = psql("select count(*) from notice where to_user = '" + OTH + "'");
  psql(as(OTH) + "select move_jobapply('" +
       J({ id:cancelAp.out, state:"canceled" }) + "'::jsonb)");
  const nOthAfter = psql("select count(*) from notice where to_user = '" + OTH + "'");
  ok("⚠️ 제가 거둔 것은 **제게 안 알립니다** (전 " + nOthBefore + " · 후 " +
     nOthAfter + ")", nOthBefore === nOthAfter, nOthBefore + "/" + nOthAfter);

  // ── ④ 답변 · 가리기 ───────────────────────────────────────────
  console.log("\n── 답변이 달리면 질문한 분에게 갑니다");
  const q = allowed(as(HOST) + "select ask_cq('" +
    J({ cat:"lesson", title:"알림 검사용 질문",
        body:"답변이 달리면 알림이 오는지 봅니다." }) + "'::jsonb)");
  ok("  (씨앗) 질문을 올렸습니다", q.yes, q.why);
  const an = allowed(as(GUE) + "select answer_cq('" +
    J({ q_id:q.out, body:"이렇게 하시면 됩니다" }) + "'::jsonb)");
  ok("  (씨앗) 답변을 달았습니다", an.yes, an.why);
  const toAsk = psql("select title || '|' || link from notice where to_user = '" +
                     HOST + "' and kind = 'answer'");
  ok("⚠️ 답변이 달리면 **질문한 분에게** 알림이 붙는다 (커뮤니티로 갑니다)",
     toAsk.indexOf("답변") >= 0 && toAsk.indexOf("/cat/community") >= 0, toAsk);
  /* ⚠️ 제 질문에 제가 답을 달면 **제게 안 옵니다** */
  const nBefore = psql("select count(*) from notice where to_user = '" + HOST +
                       "' and kind = 'answer'");
  psql(as(HOST) + "select answer_cq('" +
       J({ q_id:q.out, body:"제가 보충 설명을 답니다" }) + "'::jsonb)");
  const nAfter = psql("select count(*) from notice where to_user = '" + HOST +
                      "' and kind = 'answer'");
  ok("⚠️ 제 질문에 제가 답하면 **제게 안 옵니다**", nBefore === nAfter,
     nBefore + "/" + nAfter);

  console.log("\n── 운영자가 가리면 글쓴이에게 갑니다 (까닭은 안 담습니다)");
  const hid = allowed(as(ADM) + "select move_cq('" +
    J({ id:q.out, state:"hidden", why:"광고 글입니다" }) + "'::jsonb)");
  ok("  (씨앗) 가렸습니다", hid.yes, hid.why);
  const hidNt = psql("select coalesce(title,'') from notice where to_user = '" +
                     HOST + "' and kind = 'hidden'");
  ok("⚠️ 가려지면 글쓴이에게 알림이 붙는다", hidNt.indexOf("가려") >= 0, hidNt);
  ok("⚠️⚠️ **가린 까닭을 알림에 안 담는다** (그 까닭은 제 화면에서 봅니다)",
     hidNt.indexOf("광고 글입니다") < 0, hidNt);

  // ── ⑤ 자물쇠 — 제 알림만 ──────────────────────────────────────
  console.log("\n── ⚠️ 제 알림만 읽습니다");
  const mine = allowed(as(HOST) + "select count(*) from notice");
  ok("제 알림은 읽힌다", mine.yes && Number(mine.out) > 0, mine.out || mine.why);
  const others = allowed(as(OTH) + "select count(*) from notice where kind = 'jobapply'");
  ok("⚠️⚠️ 남의 알림은 **줄이 안 보인다** (빈 결과입니다)",
     others.yes && others.out === "0", others.out || others.why);
  /* ⚠️⚠️ **운영자도** 남의 알림을 못 읽습니다 — 읽을 까닭이 없습니다.
     ⚠️ 처음에 `where to_user = …` 로 눌러 보았는데 `permission denied`
     가 났습니다 — **그 칸은 GRANT 에서 뺐으니 맞는 동작**이고, 틀린
     것은 검사였습니다 (아래 따로 봅니다). 여기서는 **줄이 보이는가**
     만 봅니다. */
  const admSee = allowed(as(ADM) + "select count(*) from notice");
  ok("⚠️⚠️ **운영자도** 남의 알림이 **한 줄도 안 보인다** (정책을 안 두었습니다)",
     admSee.yes && admSee.out === "0", admSee.out || admSee.why);
  const anonSee = denied(anon + "select count(*) from notice");
  ok("비로그인은 표를 못 읽는다", anonSee.no, anonSee.why);
  /* ⚠️ `to_user` 는 칸 단위 GRANT 에서 뺐습니다 */
  const toCol = denied(as(HOST) + "select to_user from notice limit 1");
  ok("⚠️ `to_user` 칸은 **안 줍니다** (늘 제 것이라 화면이 쓸 일이 없습니다)",
     toCol.no, toCol.why);

  // ── ⑥ 읽음으로 — ⚠️ 바뀐 줄 수를 봅니다 ───────────────────────
  console.log("\n── 읽음으로 바꿉니다 (⚠️ 바뀐 줄 수를 봅니다)");
  const NID = psql("select id from notice where to_user = '" + HOST +
                   "' and kind = 'jobapply'");
  const noLogin = denied(anon + "select read_notice('" + J({ id:NID }) + "'::jsonb)");
  ok("비로그인은 못 바꾼다", noLogin.no, noLogin.why);
  /* ⚠️⚠️ **남의 알림을 가리키면 0줄입니다** — 에러가 아닙니다.
     갈라서 말하면 번호를 바꿔 가며 "그 알림이 있는지" 를 확인할 수
     있습니다. 그래서 **줄 수**로 잽니다. */
  const othRead = allowed(as(OTH) + "select read_notice('" + J({ id:NID }) + "'::jsonb)");
  ok("⚠️⚠️ 남의 알림을 가리키면 **0줄이 바뀐다** (에러로 갈라 주지 않습니다)",
     othRead.yes && othRead.out === "0", othRead.out || othRead.why);
  const stillUnread = psql("select count(*) from notice where id = '" + NID +
                           "' and read_at is null");
  ok("  그리고 실제로 **안 바뀌었다** (에러만 보지 않고 값을 봅니다)",
     stillUnread === "1", stillUnread);

  const myRead = allowed(as(HOST) + "select read_notice('" + J({ id:NID }) + "'::jsonb)");
  ok("제 알림은 **1줄이 바뀐다**", myRead.yes && myRead.out === "1",
     myRead.out || myRead.why);
  const again = allowed(as(HOST) + "select read_notice('" + J({ id:NID }) + "'::jsonb)");
  ok("  이미 읽은 것은 **0줄** (두 번 세지 않습니다)",
     again.yes && again.out === "0", again.out || again.why);

  /* ⚠️ 읽은 뒤에는 같은 알림이 **다시 올 수 있어야** 합니다 */
  const ap3 = allowed(as(OTH) + "select apply_jobpost('" +
    J({ post_id:PID, msg:"읽은 뒤 또 지원", contact:"010-7777-8888",
        agree_at:NOW() }) + "'::jsonb)");
  if(!ap3.yes){
    /* 같은 사람은 한 글에 한 번뿐이라, 새 사람으로 넣습니다 */
    const N2 = psql("insert into auth.users (email) values ('nt-n2@x.test') returning id");
    psql("insert into account (id, role, name) values ('" + N2 +
         "','customer','또다른') on conflict (id) do nothing");
    allowed(as(N2) + "select apply_jobpost('" +
      J({ post_id:PID, msg:"읽은 뒤 또 지원", contact:"010-7777-8888",
          agree_at:NOW() }) + "'::jsonb)");
  }
  const reNew = psql("select count(*) from notice where to_user = '" + HOST +
                     "' and kind = 'jobapply' and read_at is null");
  ok("⚠️ 읽은 뒤에는 같은 알림이 **다시 온다** (영원히 막지 않습니다)",
     reNew === "1", reNew);

  const allRead = allowed(as(HOST) + "select read_notice('" + J({ all:true }) + "'::jsonb)");
  ok("모두 읽음으로 바꿀 수 있다", allRead.yes && Number(allRead.out) > 0,
     allRead.out || allRead.why);
  const left = psql("select count(*) from notice where to_user = '" + HOST +
                    "' and read_at is null");
  ok("  안 읽은 것이 0 이 된다", left === "0", left);
  /* ⚠️ 남의 것까지 읽음으로 바꾸지 않았는지 */
  const othLeft = psql("select count(*) from notice where to_user = '" + OTH +
                       "' and read_at is null");
  ok("⚠️⚠️ **남의 알림은 안 건드린다** (모두 읽음은 제 것만입니다)",
     Number(othLeft) > 0, othLeft);

  // ── ⑦ 들어오는 길은 트리거뿐 ──────────────────────────────────
  console.log("\n── ⚠️ 알림을 손으로 만들 수 없습니다");
  const ins = denied(as(OTH) + "insert into notice (to_user, kind, title, link) " +
    "values ('" + HOST + "','quote','가짜 알림','/my')");
  ok("표에 직접 넣지 못한다 (남에게 가짜 알림을 보낼 수 없습니다)",
     ins.no, ins.why);
  const upd = denied(as(OTH) + "update notice set read_at = null where to_user = '" +
    HOST + "'");
  ok("표를 직접 고치지 못한다", upd.no, upd.why);
  const del = denied(as(HOST) + "delete from notice");
  ok("제 알림도 **지우지는** 못한다 (읽음으로 둡니다)", del.no, del.why);

  /* ⚠️ 안쪽 도움함수는 **문이 아닙니다** — 아무에게도 안 줍니다 */
  /* ⚠️⚠️⚠️ **함수는 표와 다릅니다 — 기본이 "누구나 실행" 입니다.**
     이 줄이 처음에 **통과하지 못했습니다**: `notify_one` 을 만들고
     GRANT 를 안 줬으니 막혔다고 생각했는데, 함수는 만드는 순간
     `public` 에게 EXECUTE 가 붙습니다. `security definer` 까지 달려
     있어서, 로그인한 누구나 **아무 사람에게 아무 제목으로** 알림을
     꽂을 수 있었습니다 (주소는 표의 check 가 막지만 제목은 자유
     글자입니다). 0050 에 `revoke all … from public` 을 넣어 막았습니다.
     ⚠️ 문법도 빌드도 다른 검사도 전부 통과했습니다 — **눌러 봐야**
     압니다. */
  const inner = denied(as(OTH) + "select notify_one('" + HOST +
    "','quote','직접 불러 봅니다','/my',null,null)");
  ok("⚠️⚠️⚠️ 안쪽 도움함수(notify_one)를 **직접 못 부른다** (함수는 " +
     "기본이 '누구나 실행' 입니다 — revoke 가 자물쇠입니다)",
     inner.no, inner.why);
  const faked = psql("select count(*) from notice where title = '직접 불러 봅니다'");
  ok("  그리고 실제로 **안 들어갔다** (에러만 보지 않고 값을 봅니다)",
     faked === "0", faked);
  /* ⚠️ 트리거 함수들도 같이 거두었는지 */
  const innerT = denied(as(OTH) + "select notice_quote()");
  ok("⚠️ 트리거 함수도 직접 못 부른다", innerT.no, innerT.why);
  /* ⚠️⚠️ **칸 단위 GRANT 가 진짜로 막는지** — 안 준 칸을 where 에
     써 보면 그 질의가 통째로 거절당합니다 (0 줄이 아니라 거절입니다). */
  const whereTo = denied(as(ADM) + "select count(*) from notice where to_user = '" +
                         HOST + "'");
  ok("⚠️⚠️ 안 준 칸(`to_user`)을 조건에 쓰면 **질의가 거절된다**",
     whereTo.no, whereTo.why);
};

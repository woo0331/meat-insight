/* ════════════════════════════════════════════════════════════════════
   자유게시판 — 로그인 없이 쓰고 · 고치고 · 내립니다 (0063 · 지시서 C)

   ⚠️⚠️⚠️ **비회원 글은 주인을 가리는 자물쇠가 비밀번호 하나뿐입니다.**
   그 하나가 새면 남의 글을 고치고 내립니다. 그래서 자물쇠를 **갈라서**
   눌러 봅니다 —
     ① 해시가 **밖으로 안 나가는가** — 공개 보기에 칸이 아예 없고,
        표의 칸 GRANT 에서도 빠졌는가 (둘은 **다른 자물쇠**입니다)
     ② 틀린 비밀번호로는 못 고치고 못 내리는가 · **회원 글에는
        아예 안 먹는가**
     ③ 맞는 비밀번호면 되는가 (너무 넓게 막는 것도 고장입니다)
     ④ 평문이 **어디에도 안 남는가**
     ⑤ 허니팟 · 길이 자물쇠가 **저마다 다른 말로** 거절하는가
     ⑥ 내리면 **지우지 않고** 공개 보기에서만 빠지는가
   ⚠️ 갯수를 박지 않습니다 — **전을 재고 늘어난 값**만 봅니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied } = T;

  console.log("\n── 0063 비회원 자유게시판");
  const anon = "select become(null); set role anon; ";
  const U = psql("insert into auth.users (email) values ('gq-u@x.test') returning id");
  psql("insert into account (id, role, name) values ('" + U + "','customer','최회원')" +
       " on conflict (id) do update set role = excluded.role, name = excluded.name");

  const PW = "pw-1234";
  const call = (fn, j) => psql(anon + "select " + fn + "('" + j + "'::jsonb)");

  /* ── ⑤ 자물쇠마다 다른 말 ─────────────────────────────────────── */
  const says = {};
  [["trap",   '{"nick":"손님","cat":"cm-open","title":"제목입니다","body":"내용입니다 여기", "pw":"pw-1234","website":"http://spam"}'],
   ["nocat",  '{"nick":"손님","cat":"","title":"제목입니다","body":"내용입니다 여기","pw":"pw-1234"}'],
   ["short",  '{"nick":"ㄱ","cat":"cm-open","title":"제목입니다","body":"내용입니다 여기","pw":"pw-1234"}'],
   ["fake",   '{"nick":"운영자","cat":"cm-open","title":"제목입니다","body":"내용입니다 여기","pw":"pw-1234"}'],
   ["title",  '{"nick":"손님","cat":"cm-open","title":"ㄱ","body":"내용입니다 여기","pw":"pw-1234"}'],
   ["body",   '{"nick":"손님","cat":"cm-open","title":"제목입니다","body":"짧","pw":"pw-1234"}'],
   ["pw",     '{"nick":"손님","cat":"cm-open","title":"제목입니다","body":"내용입니다 여기","pw":"12"}']
  ].forEach(function(x){ says[x[0]] = denied(anon + "select ask_cq_guest('" + x[1] + "'::jsonb)"); });

  ok("⚠️⚠️ 허니팟이 채워지면 **거절**한다 (조용히 성공시키지 않습니다)",
     !!says.trap, String(says.trap));
  ok("  게시판 · 닉네임 길이 · 사칭 · 제목 · 내용 · 비밀번호가 전부 막힌다",
     !!(says.nocat && says.short && says.fake && says.title && says.body && says.pw), "");
  /* ⚠️ **다른 자물쇠는 다른 말로** 거절해야 어디가 막혔는지 압니다 */
  /* ⚠️ `denied().no` 는 **객체**를 돌려줍니다 — `String()` 으로 묶으면
     전부 `[object Object]` 가 되어 **한 가지**로 세어집니다. 제 검사가
     틀렸던 자리입니다 — 거절하는 **말(`why`)**을 봅니다. */
  const uniq = new Set(Object.values(says).map(function(x){ return String(x && x.why); }));
  ok("  ⚠️ 자물쇠 일곱이 **일곱 가지 말**로 거절한다", uniq.size === 7,
     uniq.size + "가지: " + [...uniq].join(" / ").slice(0, 300));

  /* ── 올리기 ───────────────────────────────────────────────────── */
  const before = Number(psql("select count(*) from cq where by_user is null"));
  const ID = call("ask_cq_guest",
    '{"nick":"길손","cat":"cm-open","title":"비회원 글입니다","body":"로그인 없이 올린 글입니다","pw":"' + PW + '"}');
  ok("⚠️ 로그인 없이 **글이 올라간다**", /^[0-9a-f-]{36}$/.test(String(ID).trim()), String(ID));
  ok("  늘어난 줄이 하나다",
     Number(psql("select count(*) from cq where by_user is null")) === before + 1, "");

  /* ── ④ 평문이 안 남는가 ──────────────────────────────────────── */
  const plain = psql("select count(*) from cq where guest_pw = '" + PW + "'");
  ok("⚠️⚠️⚠️ **평문 비밀번호가 표에 한 줄도 없다** (단방향 해시입니다)",
     Number(plain) === 0, "평문으로 저장된 줄 " + plain);
  const hash = psql("select left(guest_pw, 4) from cq where id = '" + ID + "'");
  ok("  해시가 **bcrypt** 꼴이다 ($2…)", String(hash).trim().indexOf("$2") === 0, String(hash));

  /* ── ① 해시가 밖으로 안 나가는가 — 자물쇠 둘을 갈라서 ─────────── */
  const inView = psql("select count(*) from information_schema.columns " +
    "where table_name = 'v_cq_public' and column_name = 'guest_pw'");
  ok("⚠️⚠️⚠️ ① 공개 보기에 `guest_pw` 칸이 **아예 없다**",
     Number(inView) === 0, "칸 " + inView + "개");
  const g1 = psql("select has_column_privilege('anon','cq','guest_pw','select')::text");
  const g2 = psql("select has_column_privilege('authenticated','cq','guest_pw','select')::text");
  ok("⚠️⚠️ ② 표의 칸 GRANT 에서도 빠졌다 (anon · authenticated 둘 다)",
     g1.trim() === "false" && g2.trim() === "false", g1 + " / " + g2);
  /* ⚠️ 안 준 칸을 `where` 에 쓰면 **0줄이 아니라 질의가 통째로 거절**됩니다 */
  ok("  ⚠️ 그 칸을 조건에 쓰면 **질의가 거절된다**",
     denied(anon + "select count(*) from cq where guest_pw is not null").no, "");
  const open = psql(anon + "select count(*) from v_cq_public where id = '" + ID + "'");
  ok("  ⚠️ 그래도 글은 **비로그인에게 보인다** (읽기는 누구나)",
     Number(open) === 1, "줄 " + open);
  ok("  보기가 **닉네임을 그대로** 낸다",
     psql(anon + "select who from v_cq_public where id = '" + ID + "'").trim() === "길손", "");
  ok("  보기가 **비회원 글이라고** 말한다 (화면이 비밀번호 칸을 내는 데 씁니다)",
     psql(anon + "select guest::text from v_cq_public where id = '" + ID + "'").trim() === "true", "");

  /* ── ② 틀린 비밀번호 ─────────────────────────────────────────── */
  /* ⚠️⚠️⚠️ **0065 부터 비밀번호 갈래는 예외가 아니라 글자로 옵니다.**
     `raise exception` 은 그 함수가 한 일(틀린 시도 한 줄)을 통째로
     되돌리므로, 세려면 예외를 쓸 수가 없습니다. 그래서 `ok` ·
     `bad_pw` · `blocked` 를 **돌려줍니다**.
     ⚠️ 그러니 여기서도 **돌아온 글자**를 봅니다 — 예외로 재면
     "안 막혔다" 로 읽습니다 (RLS 가 UPDATE 에서 에러를 안 내서
     0줄을 성공으로 읽던 그 자리와 같은 결입니다). */
  const guestEdit = (id, pw, title) => psql(anon + "select edit_cq_guest('{\"id\":\"" +
    id + "\",\"pw\":\"" + pw + "\",\"title\":\"" + title + "\"}'::jsonb)").trim();
  const guestDrop = (id, pw) => psql(anon + "select drop_cq_guest('{\"id\":\"" +
    id + "\",\"pw\":\"" + pw + "\"}'::jsonb)").trim();

  ok("⚠️⚠️ 틀린 비밀번호로는 **못 고친다**",
     guestEdit(ID, "nope", "바뀐 제목") === "bad_pw");
  ok("  제목이 그대로다",
     psql("select title from cq where id = '" + ID + "'").trim() === "비회원 글입니다", "");
  ok("  틀린 비밀번호로는 **못 내린다**", guestDrop(ID, "nope") === "bad_pw");

  /* ⚠️⚠️ **회원 글에는 아예 안 먹어야** 합니다 — 비회원 문으로 회원 글을
     건드릴 수 있으면 비밀번호 없는 글을 아무나 고치는 자리가 됩니다. */
  const MQ = psql("select become('" + U + "'); set role authenticated; " +
    "select ask_cq('{\"cat\":\"cm-open\",\"title\":\"회원이 쓴 글\",\"body\":\"회원 글 내용입니다\"}'::jsonb)");
  ok("⚠️⚠️⚠️ **회원 글은 비회원 문으로 못 고친다**",
     guestEdit(MQ, "", "가로채기") === "bad_pw");
  ok("  회원 글은 비회원 문으로 **못 내린다**", guestDrop(MQ, "") === "bad_pw");
  /* ⚠️ **없는 글과 회원 글을 같은 말로** 거절합니다 — 말이 갈리면
     "이 번호는 있는 글" 을 알려 주는 자리가 됩니다. */
  const ghost = guestEdit("00000000-0000-0000-0000-000000000000", "x", "없는 글");
  const mem   = guestEdit(MQ, "x", "회원 글");
  ok("  ⚠️ 없는 글과 회원 글을 **같은 말로** 거절한다 (있는지를 안 알려 줍니다)",
     String(ghost) === String(mem), String(ghost) + " vs " + String(mem));

  /* ── ③ 맞는 비밀번호면 된다 ──────────────────────────────────── */
  call("edit_cq_guest", '{"id":"' + ID + '","pw":"' + PW + '","title":"고친 제목"}');
  ok("⚠️ 맞는 비밀번호면 **고쳐진다** (너무 넓게 막는 것도 고장입니다)",
     psql("select title from cq where id = '" + ID + "'").trim() === "고친 제목", "");
  /* ⚠️ **보낸 칸만** 고칩니다 — 내용은 그대로여야 합니다 */
  ok("  ⚠️ 안 보낸 칸(내용)은 **안 지워진다**",
     psql("select body from cq where id = '" + ID + "'").trim() === "로그인 없이 올린 글입니다", "");
  /* ⚠️ 게시판은 못 바꿉니다 (읽던 분이 다른 글을 보게 됩니다) */
  call("edit_cq_guest", '{"id":"' + ID + '","pw":"' + PW + '","cat":"cm-ask","title":"또 고침"}');
  ok("  ⚠️⚠️ 게시판은 **보내도 안 바뀐다**",
     psql("select cat from cq where id = '" + ID + "'").trim() === "cm-open", "");

  /* ── ⑥ 내리면 지우지 않고 빠진다 ─────────────────────────────── */
  call("drop_cq_guest", '{"id":"' + ID + '","pw":"' + PW + '"}');
  ok("⚠️⚠️ 내려도 **줄은 남는다** (지우면 분쟁 때 낼 것이 없습니다)",
     Number(psql("select count(*) from cq where id = '" + ID + "'")) === 1, "");
  ok("  상태가 `dropped` 다",
     psql("select state from cq where id = '" + ID + "'").trim() === "dropped", "");
  ok("  공개 보기에서는 **그 자리에서 빠진다**",
     Number(psql(anon + "select count(*) from v_cq_public where id = '" + ID + "'")) === 0, "");
  ok("  이미 내려간 글은 **다시 못 내린다**",
     denied(anon + "select drop_cq_guest('{\"id\":\"" + ID + "\",\"pw\":\"" + PW + "\"}'::jsonb)").no, "");


  /* ── 운영자가 **비회원 글을 가릴 수 있는가** ─────────────────────
     ⚠️⚠️⚠️ 0047 의 `move_cq` 는 `by_user` 가 비면 "그런 질문이 없습니다"
     로 튕겼습니다 — 비회원 글은 그 칸이 **비어 있는 것이 정상**이라,
     지시서가 요구한 관리자 숨김이 **처음부터 돌 수 없는 코드**였습니다.
     ⚠️ "줄이 없다" 와 "칸이 비었다" 는 **다른 자물쇠**입니다. */
  const AD = psql("insert into auth.users (email) values ('gq-ad@x.test') returning id");
  psql("insert into account (id, role, name) values ('" + AD + "','admin','운영')" +
       " on conflict (id) do update set role = excluded.role, name = excluded.name");
  const asAd = "select become('" + AD + "'); set role authenticated; ";
  const G2 = call("ask_cq_guest",
    '{"nick":"길손둘","cat":"cm-open","title":"가려질 글입니다","body":"운영자가 가릴 글입니다","pw":"' + PW + '"}');
  const hid = psql(asAd + "select move_cq('{\"id\":\"" + G2 +
    "\",\"state\":\"hidden\",\"why\":\"검사용으로 가립니다\"}'::jsonb)");
  ok("⚠️⚠️⚠️ 운영자가 **비회원 글을 가릴 수 있다** (0047 은 못 했습니다)",
     String(hid).trim() === "hidden", String(hid));
  ok("  까닭이 **반드시** 있어야 한다",
     denied(asAd + "select move_cq('{\"id\":\"" + G2 + "\",\"state\":\"hidden\",\"why\":\"짧\"}'::jsonb)").no, "");
  ok("  공개 보기에서 빠진다",
     Number(psql(anon + "select count(*) from v_cq_public where id = '" + G2 + "'")) === 0, "");
  /* ⚠️ 감사 기록에 **글 내용이 없어야** 합니다 — 번호로 찾아갑니다 */
  const log = psql("select data::text from audit_log where obj = 'cq' and obj_id = '" + G2 + "'");
  ok("  ⚠️ 감사 기록에 **글 내용이 안 담긴다** (길이와 비회원 여부만)",
     log.indexOf("운영자가 가릴 글") < 0 && log.indexOf("guest") >= 0, log.slice(0, 120));
  /* ⚠️ 없는 글은 **여전히** "그런 질문이 없습니다" 여야 합니다
     (너무 넓게 여는 것도 고장입니다) */
  const gone = denied(asAd + "select move_cq('{\"id\":\"00000000-0000-0000-0000-000000000000\"," +
    "\"state\":\"hidden\",\"why\":\"없는 글입니다\"}'::jsonb)");
  ok("  ⚠️ 없는 글은 **그대로 거절**한다 (너무 넓게 열지 않았습니다)",
     !!gone && String(gone.why).indexOf("그런 질문이 없습니다") >= 0, String(gone && gone.why));
  /* ⚠️ 비회원 글을 회원용 '내리기' 로는 못 내립니다 — 다른 말로 */
  const dq = denied(asAd + "select move_cq('{\"id\":\"" + G2 + "\",\"state\":\"dropped\"}'::jsonb)");
  ok("  ⚠️ 비회원 글은 회원용 내리기로 **못 내리고 다른 말로** 거절한다",
     !!dq && String(dq.why).indexOf("비밀번호") >= 0, String(dq && dq.why));

  /* ── 쏟아붓기 세는 표를 아무도 못 읽는가 ──────────────────────── */
  ok("⚠️⚠️ 주소를 세는 표(`cqguest_hit`)를 **anon 이 못 읽는다**",
     denied(anon + "select count(*) from cqguest_hit").no, "");
  ok("  로그인한 분도 **못 읽는다**",
     denied("select become('" + U + "'); set role authenticated; select count(*) from cqguest_hit").no, "");
  /* ⚠️ 안쪽 도움함수를 밖에서 못 부르는가 (0050 에서 겪은 자리) */
  ok("  안쪽 도움함수(`cq_ip_hash`)를 **anon 이 못 부른다**",
     denied(anon + "select cq_ip_hash()").no, "");


  /* ── 0065 — 링크 셋 이상은 안 받는가 (지시서 C 의 "광고 링크 필터") ── */
  console.log("\n── 0065 광고 링크");
  const askBody = (body) => denied(anon + "select ask_cq_guest('" +
    JSON.stringify({ nick:"길손", cat:"cm-open", title:"링크 검사",
                     body:body, pw:PW }).replace(/'/g, "''") + "'::jsonb)");
  const three = "보세요 https://a.test 그리고 https://b.test 또 www.c.test 입니다";
  const two   = "스윙 영상입니다 https://a.test 그리고 https://b.test 보세요";
  const lnk3 = askBody(three);
  ok("⚠️⚠️ 링크가 **셋이면 거절**한다", !!lnk3 &&
     String(lnk3.why).indexOf("링크는 둘까지") >= 0, String(lnk3 && lnk3.why));
  /* ⚠️⚠️ **둘까지는 들어가야** 합니다 — 링크를 통째로 막으면 스윙 영상
     한 편을 걸고 물으시는 분이 못 씁니다 (너무 넓게 막는 것도 고장). */
  const lnkOk = psql(anon + "select ask_cq_guest('" +
    JSON.stringify({ nick:"길손", cat:"cm-open", title:"링크 둘입니다",
                     body:two, pw:PW }).replace(/'/g, "''") + "'::jsonb)").trim();
  ok("  ⚠️ 링크 **둘은 들어간다** (너무 넓게 막지 않았습니다)",
     /^[0-9a-f-]{36}$/.test(lnkOk), lnkOk.slice(0, 80));
  /* ⚠️ 제목에 숨겨도 같이 셉니다 */
  /* ⚠️ `denied()` 는 **항상 객체를** 돌려줍니다 — `!x` 로 재면
     항상 거짓이라 **아무것도 안 잡는 검사**가 됩니다. `.no` 를 봅니다
     (이 파일에서 `!!denied(…)` 를 열세 곳 써 두었는데, 그것도
     항상 참이라 전부 초록이었습니다 — 같은 날 같이 고쳤습니다). */
  const lnk1 = askBody("내용입니다 https://a.test 하나뿐입니다");
  ok("  링크 하나는 당연히 들어간다 (거절하지 않습니다)",
     !lnk1.no, String(lnk1.why));
  /* ══════════════════════════════════════════════════════════════
     0065 — **비밀번호 반복 시도**를 막는가 (지시서 C 의 그 줄)

     ⚠️⚠️⚠️ 0063 은 쏟아붓기를 **새 글 올리기 한 곳에만** 걸었습니다.
     고치기 · 내리기에는 시도 제한이 **한 줄도 없어서**, 네 자리
     비밀번호를 끝까지 넣어 보면 남의 글을 고치고 내릴 수 있었습니다.

     ⚠️⚠️ **이 문 둘만 예외를 안 씁니다.** `raise exception` 은 그
     함수가 한 일을 통째로 되돌리므로, 틀린 시도를 적어도 **같이
     사라집니다** — 처음에 그렇게 썼다가 "전 0" 으로 잡혔습니다.
     그래서 비밀번호 갈래는 **글자**(`ok` · `bad_pw` · `blocked`)로
     돌아오고, 화면이 그 말을 고릅니다.

     ⚠️ 여기서 재는 것 여섯 —
       ① 틀리면 `bad_pw` 를 돌려주고 시도가 **쌓이는가**
       ② **맞은 시도는 안 세는가** (세면 제 글을 여러 번 고치시는
          분이 먼저 막힙니다)
       ③ 서른 번을 넘으면 `blocked` 가 되는가
       ④ **맞는 비밀번호도 그동안 막히는가** (막는 것이 실제로 먹는지 —
          이것을 안 재면 "틀린 것만 거절" 과 구별이 안 됩니다)
       ⑤ **내리는 문도 같은 자물쇠**를 지나는가 (한쪽만 걸면 구멍)
       ⑥ **다른 글은 멀쩡한가** (한 글이 막혔다고 게시판이 멈추면
          남이 일부러 틀려서 모두를 막는 자리가 됩니다)
     ⚠️⚠️ 이 검사는 `x-forwarded-for` 가 **없는** 자리에서 돕니다 —
     그러면 `cq_ip_hash()` 가 null 이라 주소 겹(ⓐ)은 안 걸리고
     **글 겹(ⓑ · 한 시간에 서른 번)** 이 걸립니다. 못 막는 것을
     막는다고 적지 않습니다 — 주소를 모르면 주소로는 못 셉니다.
     ══════════════════════════════════════════════════════════════ */
  console.log("\n── 0065 비밀번호 반복 시도");
  const PWQ = call("ask_cq_guest",
    '{"nick":"길손둘","cat":"cm-open","title":"시도 제한 검사","body":"비밀번호를 여러 번 넣어 봅니다","pw":"' + PW + '"}');
  ok("씨앗: 글이 하나 올라갔다", /^[0-9a-f-]{36}$/.test(String(PWQ).trim()), String(PWQ));
  const OTHER = call("ask_cq_guest",
    '{"nick":"길손셋","cat":"cm-open","title":"옆 글입니다","body":"이 글은 막히면 안 됩니다","pw":"' + PW + '"}');
  const edit = (id, pw, title) => psql(anon + "select edit_cq_guest('{\"id\":\"" + id +
    "\",\"pw\":\"" + pw + "\",\"title\":\"" + title + "\"}'::jsonb)").trim();
  const tries = () => Number(psql("select count(*) from cqpw_try where q_id = '" + PWQ + "'"));

  const t0 = tries();
  ok("틀리면 `bad_pw` 를 돌려준다", edit(PWQ, "nope-1", "바꾼 제목입니다") === "bad_pw");
  ok("  ⚠️ 틀린 시도가 **쌓인다** (전을 재고 늘어난 값만 봅니다)",
     tries() === t0 + 1, "전 " + t0 + " · 후 " + tries());
  ok("  틀렸으니 제목이 **안 바뀐다**",
     psql("select title from cq where id = '" + PWQ + "'") === "시도 제한 검사", "");

  /* ⚠️ **맞은 시도는 안 셉니다** — 막히기 전에 먼저 재야 합니다 */
  const t1 = tries();
  ok("맞는 비밀번호면 `ok` 다 (너무 넓게 막지 않았습니다)",
     edit(PWQ, PW, "맞는 비밀번호로 고칩니다") === "ok");
  ok("  ⚠️⚠️ **맞은 시도는 안 센다** (제 글을 여러 번 고치셔도 안 막힙니다)",
     tries() === t1, "전 " + t1 + " · 후 " + tries());
  ok("  실제로 고쳐졌다",
     psql("select title from cq where id = '" + PWQ + "'") === "맞는 비밀번호로 고칩니다", "");

  /* ⓑ 글 겹 — 한 시간에 서른 번. ⚠️ 이미 하나 쌓였으니 스물아홉 번 더 */
  for(let i = 0; i < 29; i++) edit(PWQ, "nope-" + i, "안 바뀝니다");
  const n30 = Number(psql("select count(*) from cqpw_try where q_id = '" + PWQ +
    "' and at > now() - interval '1 hour'"));
  ok("  시도가 서른 번 쌓였다", n30 === 30, String(n30));
  ok("⚠️⚠️⚠️ 서른 번을 넘으면 **막힌다**",
     edit(PWQ, "nope-last", "안 바뀝니다") === "blocked");
  /* ⚠️⚠️⚠️ **막는 것이 실제로 먹는지** — 맞는 비밀번호도 그동안 막힙니다 */
  ok("  ⚠️⚠️ **맞는 비밀번호도 그동안 막힌다**",
     edit(PWQ, PW, "막힌 동안에는 못 고칩니다") === "blocked");
  ok("  그래서 제목이 **안 바뀐다**",
     psql("select title from cq where id = '" + PWQ + "'") === "맞는 비밀번호로 고칩니다", "");
  /* ⚠️ 막는 동안에는 **더 안 쌓습니다** — 쌓으면 막힌 채로 안 풀립니다 */
  const nBlk = Number(psql("select count(*) from cqpw_try where q_id = '" + PWQ + "'"));
  edit(PWQ, "nope-more", "안 바뀝니다");
  ok("  ⚠️ 막는 동안에는 **더 안 쌓는다** (쌓으면 영원히 안 풀립니다)",
     Number(psql("select count(*) from cqpw_try where q_id = '" + PWQ + "'")) === nBlk,
     "전 " + nBlk);
  /* ⚠️ 내리는 문도 같은 자물쇠를 지나는가 */
  ok("  ⚠️⚠️ **내리는 문도 같은 자물쇠**를 지난다 (한쪽만 걸면 구멍입니다)",
     psql(anon + "select drop_cq_guest('{\"id\":\"" + PWQ + "\",\"pw\":\"" + PW +
          "\"}'::jsonb)").trim() === "blocked");
  ok("  그래서 글이 **안 내려간다**",
     psql("select state from cq where id = '" + PWQ + "'") === "live", "");
  /* ⚠️⚠️ 다른 글은 멀쩡해야 합니다 */
  ok("  ⚠️⚠️ **다른 글은 그대로 고쳐진다** (한 글이 막혀도 게시판은 돕니다)",
     edit(OTHER, PW, "옆 글은 멀쩡합니다") === "ok" &&
     psql("select title from cq where id = '" + OTHER + "'") === "옆 글은 멀쩡합니다", "");

  /* ── 세는 표 · 안쪽 함수를 밖에서 못 건드리는가 ───────────────── */
  ok("⚠️⚠️ 시도를 세는 표(`cqpw_try`)를 **anon 이 못 읽는다**",
     denied(anon + "select count(*) from cqpw_try").no, "");
  ok("  로그인한 분도 **못 읽는다**",
     denied("select become('" + U + "'); set role authenticated; select count(*) from cqpw_try").no, "");
  ok("  ⚠️ 운영자도 **못 읽는다** (누가 어느 글에 넣어 봤는지는 우리가 알 일이 아닙니다)",
     denied(asAd + "select count(*) from cqpw_try").no, "");
  ok("  안쪽 도움함수를 **anon 이 못 부른다** (0050 에서 겪은 자리)",
     denied(anon + "select cq_pw_blocked('" + PWQ + "'::uuid)").no, "");
  /* ⚠️ 표에 사람 정보가 없는가 — 칸을 **세어서** 봅니다 */
  const tc = psql("select coalesce(string_agg(column_name, ',' order by column_name), '') " +
    "from information_schema.columns where table_name = 'cqpw_try'");
  ok("⚠️⚠️⚠️ 표의 칸이 **넷뿐**이다 (주소는 해시로만 · 사람 정보 0건)",
     tc === "at,id,ip_hash,q_id", tc);
};
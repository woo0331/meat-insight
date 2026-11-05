/* ════════════════════════════════════════════════════════════════════
   골프 인력 · 비즈니스 — 구인 · 구직 · 제휴를 눌러 봅니다 (0048)

   ⚠️⚠️⚠️ **여기서 가장 조심한 것은 연락처입니다** (제17조 제2항).
   구인 글의 번호도 긁히면 안 되지만 **구직 글의 번호**가 더합니다 —
   이력이 붙은 개인정보입니다. 그래서 자물쇠를 **세 겹**으로 두고
   **셋을 따로** 눌러 봅니다:
     ① 공개 보기에 `contact` 칸이 **아예 없다**
     ② 표의 칸 단위 GRANT 에서 뺐다
     ③ 보기의 where 절이 **수락된 짝**만 낸다
   하나만 보고 "막혔다" 고 읽으면 나머지 둘이 장식인지 알 수 없습니다.

   ⚠️⚠️ **수락만으로는 안 열립니다.** 수락은 "이야기해 봅시다" 이고
   번호를 주는 것은 다른 결정입니다 — 각자 **제 것만** 열고 언제든
   닫습니다. 맞바꾸기를 강요하면 사실상 강제 동의입니다.

   ⚠️⚠️ **업체 이름은 고르는 것입니다** (`as_pro`). 승인된 · 검사용이
   아닌 업체만 나오고, **읽을 때 다시** 상태를 봅니다 — 정지되면 그
   순간부터 빠집니다. 검사용 업체(0030)가 섞이면 없는 회사를 광고하는
   것입니다 (절대 규칙 1).

   ⚠️ 재는 것은 늘 **문**입니다. 표에 바로 넣으면 자물쇠를 지나갑니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0048 인력 · 비즈니스 — 씨앗");
  const HOST = psql("insert into auth.users (email) values ('jb-host@x.test') returning id");
  const SEEK = psql("insert into auth.users (email) values ('jb-seek@x.test') returning id");
  const OTH  = psql("insert into auth.users (email) values ('jb-oth@x.test') returning id");
  const PRO  = psql("insert into auth.users (email) values ('jb-pro@x.test') returning id");
  const TPR  = psql("insert into auth.users (email) values ('jb-tpro@x.test') returning id");
  const ADM  = psql("insert into auth.users (email) values ('jb-adm@x.test') returning id");

  /* 업체 둘 — 하나는 승인된 참 업체, 하나는 **검사용**입니다 */
  psql("insert into provider (id, name, listed, state, is_test) values " +
       "('jb-real','참골프아카데미', true, 'approved', false)," +
       "('jb-test','검사용골프장', false, 'approved', true) " +
       "on conflict (id) do update set name = excluded.name, " +
       "state = excluded.state, is_test = excluded.is_test");

  psql("insert into account (id, role, name, provider_id) values " +
       "('" + HOST + "','customer','김사장', null)," +
       "('" + SEEK + "','customer','이프로', null)," +
       "('" + OTH  + "','customer','남', null)," +
       "('" + PRO  + "','provider','박담당','jb-real')," +
       "('" + TPR  + "','provider','검사담당','jb-test')," +
       "('" + ADM  + "','admin','인력 관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const J    = o => JSON.stringify(o).replace(/'/g, "''");
  const NOW  = () => new Date().toISOString();

  const post = (who, extra) => as(who) + "select open_jobpost('" +
    J(Object.assign({ kind:"hire", sub:"cr-caddy", region:"seoul",
                      title:"주말 캐디 구합니다",
                      body:"주말 오전 라운딩 캐디를 구합니다. 경험 있으신 분.",
                      contact:"010-1111-2222", agree_at:NOW() }, extra)) + "'::jsonb)";
  const apply = (who, pid, extra) => as(who) + "select apply_jobpost('" +
    J(Object.assign({ post_id:pid, msg:"캐디 경력 3년입니다. 주말 가능합니다.",
                      contact:"010-3333-4444", agree_at:NOW() }, extra)) + "'::jsonb)";

  // ── ① 글 올리기 ───────────────────────────────────────────────
  console.log("\n── 글을 올립니다");
  const p1 = allowed(post(HOST, {}));
  ok("로그인하면 구인 글을 올릴 수 있다", p1.yes && /^[0-9a-f-]{36}$/.test(p1.out),
     p1.out || p1.why);
  const PID = p1.out;

  const anonPost = denied(anon + "select open_jobpost('" +
    J({ kind:"hire", sub:"cr-caddy", region:"seoul", title:"비로그인",
        body:"올려 봅니다", contact:"010-0000-0000", agree_at:NOW() }) + "'::jsonb)");
  ok("비로그인은 못 올린다", anonPost.no, anonPost.why);

  /* ⚠️⚠️ **겹친 자물쇠를 재려면 재려는 것 말고는 전부 올바르게**
     채워야 합니다 — 하나를 비우고 다른 것도 비우면 **먼저 만나는
     자물쇠**가 막아서 "여덟이 다른 말로 거절한다" 가 떨어집니다. */
  console.log("\n── 자물쇠마다 다른 말로 거절합니다");
  const says = {};
  const dk = denied(post(SEEK, { kind:"" }));            says.kind    = dk.why;
  ok("갈래가 없으면 막힌다", dk.no, dk.why);
  /* ⚠️ 빈 갈래와 없는 갈래는 **같은 자물쇠**입니다 — 말이 같은 것이
     맞습니다. 그래서 아래 "서로 다른 말" 세는 자리에 넣지 않습니다
     (넣으면 멀쩡한 코드를 실패로 잡습니다 — 실제로 그랬습니다). */
  const dk2 = denied(post(SEEK, { kind:"nope" }));
  ok("없는 갈래도 막힌다 (같은 자물쇠라 같은 말입니다)",
     dk2.no && dk2.why === dk.why, dk2.why);
  const ds = denied(post(SEEK, { sub:"" }));             says.sub     = ds.why;
  ok("분류가 없으면 막힌다", ds.no, ds.why);
  const dr = denied(post(SEEK, { region:"" }));          says.region  = dr.why;
  ok("지역이 없으면 막힌다", dr.no, dr.why);
  const dt = denied(post(SEEK, { title:"짧" }));         says.title   = dt.why;
  ok("제목이 짧으면 막힌다", dt.no, dt.why);
  const db = denied(post(SEEK, { body:"짧" }));          says.body    = db.why;
  ok("내용이 짧으면 막힌다", db.no, db.why);
  const dc = denied(post(SEEK, { contact:"" }));         says.contact = dc.why;
  ok("연락처가 없으면 막힌다", dc.no, dc.why);
  const da = denied(post(SEEK, { agree_at:null }));      says.agree   = da.why;
  ok("⚠️ 동의 시각이 없으면 막힌다 (제15조 제2항)", da.no, da.why);
  const dp = denied(post(SEEK, { agree_at:"2000-01-01T00:00:00Z" })); says.old = dp.why;
  ok("⚠️ 하루 넘게 지난 동의는 안 받는다", dp.no, dp.why);
  const dd = denied(post(SEEK, { close_at:"2000-01-01" })); says.past = dd.why;
  ok("지난 마감일은 막힌다", dd.no, dd.why);
  const uniq = new Set(Object.values(says));
  ok("⚠️⚠️ 아홉 자물쇠가 **서로 다른 말**로 거절한다 (엉뚱한 까닭으로 " +
     "통과하지 않게)", uniq.size === Object.keys(says).length, JSON.stringify(says));

  // ── ② 공개 보기 — ⚠️ 연락처 칸이 **아예 없습니다** ────────────
  console.log("\n── ⚠️⚠️ 자물쇠 ① 공개 보기에 연락처 칸이 **없습니다**");
  const cols = psql("select string_agg(column_name, ',' order by column_name) " +
    "from information_schema.columns where table_name = 'v_job_open'");
  ok("⚠️ 공개 보기에 contact 칸이 **없다** (비어 있는 것과 다릅니다)",
     cols.indexOf("contact") < 0, cols);
  ok("⚠️ by_user 칸도 **없다** (글은 공개지만 글쓴이는 아닙니다)",
     cols.indexOf("by_user") < 0, cols);
  ok("⚠️ agree_at 도 **없다**", cols.indexOf("agree_at") < 0, cols);
  ok("  대신 가린 이름(who)이 있다", cols.indexOf("who") >= 0, cols);
  ok("  지원 수는 칸이 아니라 **세어서** 냅니다", cols.indexOf("apply_n") >= 0, cols);

  const seeAnon = allowed(anon + "select count(*) from v_job_open where id = '" + PID + "'");
  ok("비로그인도 글을 읽는다 (크롤러도 봅니다)", seeAnon.yes && seeAnon.out === "1",
     seeAnon.out || seeAnon.why);
  const who = psql(anon + "select who from v_job_open where id = '" + PID + "'");
  ok("⚠️ 이름이 가려져 나온다 (김사장 → 김**)", who === "김**", who);

  console.log("\n── ⚠️⚠️ 자물쇠 ② 표의 **칸 단위 GRANT**");
  const anonTbl = denied(anon + "select contact from jobpost limit 1");
  ok("비로그인은 표를 못 읽는다", anonTbl.no, anonTbl.why);
  /* ⚠️⚠️ **제 글이라도** 표에서 연락처 칸은 안 읽힙니다 (칸 GRANT) */
  const mineC = denied(as(HOST) + "select contact from jobpost where id = '" + PID + "'");
  ok("⚠️⚠️ **올린 사람도** 표에서 연락처 칸을 못 읽는다 (칸 단위 GRANT)",
     mineC.no, mineC.why);
  const mineRow = allowed(as(HOST) + "select title from jobpost where id = '" + PID + "'");
  ok("  그런데 같은 줄의 다른 칸은 읽힌다 (줄이 아니라 **칸**이 막힌 것)",
     mineRow.yes && mineRow.out === "주말 캐디 구합니다", mineRow.out || mineRow.why);
  const othRow = allowed(as(OTH) + "select count(*) from jobpost where id = '" + PID + "'");
  ok("⚠️ 로그인해도 **남의 글 줄은 표에서 안 보인다** (RLS)",
     othRow.yes && othRow.out === "0", othRow.out || othRow.why);

  // ── ③ 업체 이름 — ⚠️ 고르는 것이고, 읽을 때 다시 봅니다 ───────
  console.log("\n── ⚠️⚠️ 업체 이름(상호)으로 올리는 것은 **고르는 것**입니다");
  const noPro = denied(post(SEEK, { as_pro:true, title:"업체 이름으로 올려 봅니다" }));
  ok("⚠️ 업체 담당자가 아니면 업체 이름으로 못 올린다", noPro.no, noPro.why);
  const tPro = denied(post(TPR, { as_pro:true, title:"검사용 업체로 올려 봅니다" }));
  ok("⚠️⚠️ **검사용 업체**는 업체 이름으로 못 올린다 (손님 화면에 " +
     "검사용 상호가 나가면 없는 회사를 광고하는 것입니다)", tPro.no, tPro.why);
  ok("  둘이 **다른 말**로 거절한다", noPro.why !== tPro.why,
     noPro.why + " | " + tPro.why);

  const proPost = allowed(post(PRO, { as_pro:true, kind:"hire", sub:"cr-hire",
    title:"아카데미 프로를 구합니다", body:"정규직 프로를 구합니다. 경력 무관." }));
  ok("승인된 업체는 업체 이름으로 올릴 수 있다", proPost.yes, proPost.why);
  const PPID = proPost.out;
  const pname = psql(anon + "select coalesce(pro_name,'(없음)') from v_job_open " +
    "where id = '" + PPID + "'");
  ok("  목록에 **상호**가 나온다", pname === "참골프아카데미", pname);

  const plain = allowed(post(PRO, { kind:"seek", sub:"cr-coach",
    title:"개인으로 올리는 글", body:"업체 이름 없이 올려 봅니다.",
    contact:"010-5555-6666" }));
  const pn2 = psql(anon + "select coalesce(pro_name,'(없음)') from v_job_open " +
    "where id = '" + plain.out + "'");
  ok("⚠️ 안 고르면 **상호가 안 나온다** (업체 담당자라도)", pn2 === "(없음)", pn2);

  /* ⚠️⚠️ **읽을 때 다시 봅니다** — 저장된 이름을 믿지 않습니다.
     0038 은 정지에 **까닭이 반드시** 있게 해 두었습니다. */
  /* ⚠️⚠️ **문으로 바꿉니다.** 표를 직접 고치면 0038 의
     `provider_state_guard()` 가 막습니다 — 그리고 그것이 맞습니다
     (문이 있는 자리는 문으로 재세요). */
  psql(as(ADM) + "select set_provider_state(jsonb_build_object(" +
       "'id','jb-real','to','suspended','why','검사로 정지합니다'))");
  const pn3 = psql(anon + "select coalesce(pro_name,'(없음)') from v_job_open " +
    "where id = '" + PPID + "'");
  ok("⚠️⚠️ 업체가 **정지되면 그 순간부터 상호가 빠진다** (읽을 때 다시 봅니다)",
     pn3 === "(없음)", pn3);
  const stillThere = psql(anon + "select count(*) from v_job_open where id = '" + PPID + "'");
  ok("  글 자체는 남는다 (상호만 빠집니다)", stillThere === "1", stillThere);
  psql(as(ADM) + "select set_provider_state(jsonb_build_object(" +
       "'id','jb-real','to','approved'))");

  // ── ④ 지원 ────────────────────────────────────────────────────
  console.log("\n── 지원 · 제안을 보냅니다");
  const a1 = allowed(apply(SEEK, PID, {}));
  ok("남이 지원할 수 있다", a1.yes && /^[0-9a-f-]{36}$/.test(a1.out), a1.out || a1.why);
  const AID = a1.out;
  const n1 = psql(anon + "select apply_n from v_job_open where id = '" + PID + "'");
  ok("⚠️ 지원 수가 **세어져** 올라간다 (칸에 저장하지 않습니다)", n1 === "1", n1);

  const self = denied(apply(HOST, PID, {}));
  ok("⚠️ 제 글에는 못 넣는다", self.no, self.why);
  const twice = denied(apply(SEEK, PID, {}));
  ok("⚠️ 같은 글에 두 번은 못 넣는다", twice.no, twice.why);
  ok("  그 거절이 **알아들을 수 있는 말**이다 (중복 키 오류가 아니라)",
     twice.no && twice.why.indexOf("이미") >= 0, twice.why);
  const noPost = denied(apply(OTH, "00000000-0000-0000-0000-000000000000", {}));
  ok("없는 글에는 못 넣는다", noPost.no, noPost.why);
  const noAgree = denied(apply(OTH, PID, { agree_at:null }));
  ok("⚠️ 동의 시각 없이는 못 넣는다", noAgree.no, noAgree.why);
  const noC = denied(apply(OTH, PID, { contact:"" }));
  ok("연락처 없이는 못 넣는다", noC.no, noC.why);

  // ── ⑤ 연락처 — ⚠️⚠️⚠️ 수락만으로 안 열립니다 ─────────────────
  console.log("\n── ⚠️⚠️⚠️ 자물쇠 ③ 보기의 where 절 — **수락된 짝만**");
  const before = psql(as(SEEK) + "select count(*) from v_job_contact " +
    "where apply_id = '" + AID + "'");
  ok("⚠️ 수락 전에는 연락처 보기에 **줄이 아예 없다**", before === "0", before);

  const othMove = denied(as(OTH) + "select move_jobapply('" +
    J({ id:AID, state:"accepted" }) + "'::jsonb)");
  ok("⚠️ 남은 수락 못 한다", othMove.no, othMove.why);
  const acc = allowed(as(HOST) + "select move_jobapply('" +
    J({ id:AID, state:"accepted" }) + "'::jsonb)");
  ok("올리신 분은 수락할 수 있다", acc.yes && acc.out === "accepted", acc.out || acc.why);

  const rowNow = psql(as(SEEK) + "select coalesce(post_contact,'(비었음)') || '/' || " +
    "coalesce(apply_contact,'(비었음)') from v_job_contact where apply_id = '" + AID + "'");
  ok("⚠️⚠️⚠️ **수락만으로는 양쪽 다 비어 있다** (제17조 제2항 — 수락은 " +
     "'이야기해 봅시다' 이지 '내 번호를 줘도 좋다' 가 아닙니다)",
     rowNow === "(비었음)/(비었음)", rowNow);

  console.log("\n── 각자 **제 것만** 엽니다 · 맞바꾸기를 강요하지 않습니다");
  const shHost = allowed(as(HOST) + "select share_jobcontact('" +
    J({ id:AID, on:true }) + "'::jsonb)");
  ok("올리신 분이 제 연락처를 연다", shHost.yes && shHost.out === "host-on",
     shHost.out || shHost.why);
  const oneSide = psql(as(SEEK) + "select coalesce(post_contact,'(비었음)') || '/' || " +
    "coalesce(apply_contact,'(비었음)') from v_job_contact where apply_id = '" + AID + "'");
  ok("⚠️⚠️ **한쪽만 열면 그쪽 것만 간다** (강요하면 사실상 강제 동의입니다)",
     oneSide === "010-1111-2222/(비었음)", oneSide);

  const shGuest = allowed(as(SEEK) + "select share_jobcontact('" +
    J({ id:AID, on:true }) + "'::jsonb)");
  ok("보내신 분도 제 연락처를 연다", shGuest.yes && shGuest.out === "guest-on",
     shGuest.out || shGuest.why);
  const both = psql(as(HOST) + "select coalesce(post_contact,'(비었음)') || '/' || " +
    "coalesce(apply_contact,'(비었음)') from v_job_contact where apply_id = '" + AID + "'");
  ok("둘 다 열면 둘 다 보인다", both === "010-1111-2222/010-3333-4444", both);

  /* ⚠️ 철회권 — 다시 닫을 수 있어야 합니다 */
  const off = allowed(as(SEEK) + "select share_jobcontact('" +
    J({ id:AID, on:false }) + "'::jsonb)");
  ok("⚠️ 다시 **닫을 수 있다** (동의 철회)", off.yes && off.out === "guest-off",
     off.out || off.why);
  const closed = psql(as(HOST) + "select coalesce(apply_contact,'(비었음)') " +
    "from v_job_contact where apply_id = '" + AID + "'");
  ok("  닫으면 그 순간부터 안 보인다", closed === "(비었음)", closed);

  /* ⚠️⚠️ **남은 그 보기에 줄이 없어야** 합니다 — 당사자 둘만입니다 */
  const othSee = psql(as(OTH) + "select count(*) from v_job_contact " +
    "where apply_id = '" + AID + "'");
  ok("⚠️⚠️ 당사자가 아니면 그 보기에 **줄이 없다**", othSee === "0", othSee);
  const othShare = denied(as(OTH) + "select share_jobcontact('" +
    J({ id:AID, on:true }) + "'::jsonb)");
  ok("⚠️ 남이 남의 연락처를 열지 못한다", othShare.no, othShare.why);

  /* 수락 전에 열려 하면 거절 — "누구에게" 가 정해지기 전입니다 */
  const a2 = allowed(apply(OTH, PID, { contact:"010-7777-8888" }));
  const early = denied(as(OTH) + "select share_jobcontact('" +
    J({ id:a2.out, on:true }) + "'::jsonb)");
  ok("⚠️⚠️ **수락 전에는 못 연다** (누구에게 줄지 정해지기 전입니다)",
     early.no, early.why);

  // ── ⑥ 거절 · 거두기 ───────────────────────────────────────────
  console.log("\n── 거절 · 거두기");
  const rej = allowed(as(HOST) + "select move_jobapply('" +
    J({ id:a2.out, state:"rejected" }) + "'::jsonb)");
  ok("올리신 분이 거절할 수 있다", rej.yes && rej.out === "rejected", rej.out || rej.why);
  const again = denied(as(HOST) + "select move_jobapply('" +
    J({ id:a2.out, state:"accepted" }) + "'::jsonb)");
  ok("⚠️ 이미 처리된 것은 다시 못 옮긴다", again.no, again.why);

  const p2 = allowed(post(HOST, { title:"거둘 지원을 받을 글", body:"거두기를 봅니다." }));
  const a3 = allowed(apply(OTH, p2.out, { contact:"010-9999-0000" }));
  const hostCancel = denied(as(HOST) + "select move_jobapply('" +
    J({ id:a3.out, state:"canceled" }) + "'::jsonb)");
  ok("⚠️ 거두는 것은 **보낸 사람만** (올린 사람이 대신 거둘 수 없습니다)",
     hostCancel.no, hostCancel.why);
  const cancel = allowed(as(OTH) + "select move_jobapply('" +
    J({ id:a3.out, state:"canceled" }) + "'::jsonb)");
  ok("보낸 사람은 거둘 수 있다", cancel.yes && cancel.out === "canceled",
     cancel.out || cancel.why);

  // ── ⑦ 마감 · 내리기 · 가리기 ──────────────────────────────────
  console.log("\n── ⚠️ 지우지 않고 내립니다");
  const othClose = denied(as(OTH) + "select move_jobpost('" +
    J({ id:p2.out, state:"closed" }) + "'::jsonb)");
  ok("남은 못 마감한다", othClose.no, othClose.why);
  const close = allowed(as(HOST) + "select move_jobpost('" +
    J({ id:p2.out, state:"closed" }) + "'::jsonb)");
  ok("올리신 분은 마감할 수 있다", close.yes && close.out === "closed",
     close.out || close.why);
  const gone = psql(anon + "select count(*) from v_job_open where id = '" + p2.out + "'");
  ok("  공개 목록에서 빠진다", gone === "0", gone);
  const closedApply = denied(apply(SEEK, p2.out, { contact:"010-1212-1212" }));
  ok("⚠️ 마감된 글에는 못 넣는다", closedApply.no, closedApply.why);

  const drop = allowed(as(HOST) + "select move_jobpost('" +
    J({ id:p2.out, state:"dropped" }) + "'::jsonb)");
  ok("마감한 글을 내릴 수 있다", drop.yes && drop.out === "dropped", drop.out || drop.why);
  /* ⚠️⚠️ **줄은 남아 있어야 합니다** — 지우면 "그런 글 올린 적 없다" 가 됩니다 */
  const still = psql("select state from jobpost where id = '" + p2.out + "'");
  ok("⚠️⚠️ 그런데 **줄은 남아 있다** (지우지 않습니다)", still === "dropped", still);

  console.log("\n── 가리는 것은 운영자만 · 까닭이 반드시");
  const userHide = denied(as(HOST) + "select move_jobpost('" +
    J({ id:PID, state:"hidden", why:"제가 가려 봅니다" }) + "'::jsonb)");
  ok("⚠️ 손님은 못 가린다", userHide.no, userHide.why);
  const noWhy = denied(as(ADM) + "select move_jobpost('" +
    J({ id:PID, state:"hidden" }) + "'::jsonb)");
  ok("⚠️⚠️ 운영자도 **까닭 없이는 못 가린다**", noWhy.no, noWhy.why);
  ok("  그 거절이 **까닭**을 말한다", noWhy.no && noWhy.why.indexOf("까닭") >= 0, noWhy.why);
  const hid = allowed(as(ADM) + "select move_jobpost('" +
    J({ id:PID, state:"hidden", why:"허위 구인으로 보입니다" }) + "'::jsonb)");
  ok("운영자는 까닭을 적고 가릴 수 있다", hid.yes && hid.out === "hidden",
     hid.out || hid.why);
  const hidGone = psql(anon + "select count(*) from v_job_open where id = '" + PID + "'");
  ok("  가려진 글이 공개 목록에서 빠진다", hidGone === "0", hidGone);
  const whyRow = psql("select hidden_why from jobpost where id = '" + PID + "'");
  ok("  가린 까닭이 줄에 남는다 (글쓴이에게 보여 줍니다)",
     whyRow === "허위 구인으로 보입니다", whyRow);
  const auditBody = psql("select coalesce(string_agg(data::text,'|'),'') from audit_log " +
    "where obj = 'jobpost' and obj_id = '" + PID + "'");
  ok("⚠️ 감사 기록에 **글 내용이 안 들어간다**",
     auditBody.indexOf("허위 구인") < 0 && auditBody.indexOf("why_len") >= 0, auditBody);
  const hidMove = denied(as(HOST) + "select move_jobpost('" +
    J({ id:PID, state:"dropped" }) + "'::jsonb)");
  ok("⚠️ 가려진 글은 글쓴이가 **못 옮긴다** (옮겨서 가린 뜻을 지울 수 없습니다)",
     hidMove.no, hidMove.why);

  /* ⚠️ 까닭 없이 가릴 수 없게 **표에서도** 막아 두었는지 (문이 내려가는
     날 이 줄이 남습니다) */
  const ck = psql("select count(*) from pg_constraint where conname = 'jobpost_hidden_ck'");
  ok("⚠️ 까닭 없는 hidden 을 **표의 check 도** 막는다 (문이 내려가도)",
     ck === "1", ck);

  // ── ⑧ 고치기 ──────────────────────────────────────────────────
  console.log("\n── 글쓴이가 제 글을 고칩니다");
  const p3 = allowed(post(SEEK, { kind:"seek", sub:"cr-coach",
    title:"레슨 자리를 찾습니다", body:"주 3일 레슨 가능한 자리를 찾습니다.",
    contact:"010-2222-3333" }));
  const PID3 = p3.out;
  const othEdit = denied(as(OTH) + "select edit_jobpost('" +
    J({ id:PID3, title:"남이 고칩니다", body:"고쳐 봅니다",
        contact:"010-0000-0000" }) + "'::jsonb)");
  ok("⚠️ 남은 못 고친다", othEdit.no, othEdit.why);
  const myEdit = allowed(as(SEEK) + "select edit_jobpost('" +
    J({ id:PID3, title:"레슨 자리를 찾습니다 (고침)",
        body:"내용도 고쳤습니다. 주 4일도 됩니다.", pay:"협의",
        contact:"010-2222-3333" }) + "'::jsonb)");
  ok("올리신 분은 고칠 수 있다", myEdit.yes, myEdit.why);
  const t2 = psql(anon + "select title from v_job_open where id = '" + PID3 + "'");
  ok("  실제로 바뀌었다 (에러만 보지 않고 값을 봅니다)",
     t2 === "레슨 자리를 찾습니다 (고침)", t2);

  /* ⚠️⚠️ **연락처를 비워 보내면 거절해야** 합니다 — 안 막으면 양식이
     그 칸을 빠뜨리는 날 조용히 지워집니다 (`save_provider_self` 자리). */
  const blankC = denied(as(SEEK) + "select edit_jobpost('" +
    J({ id:PID3, title:"연락처를 비워 보냅니다", body:"비워 보내 봅니다.",
        contact:"" }) + "'::jsonb)");
  ok("⚠️⚠️ 고칠 때 **연락처를 비워 보내면 거절한다** (조용히 지워지지 않게)",
     blankC.no, blankC.why);
  const cStill = psql(as(HOST) + "select 1");  /* 자리 채우기 — 아래에서 봅니다 */
  ok("  그리고 제목도 안 바뀌었다 (통째로 거절합니다)",
     psql(anon + "select title from v_job_open where id = '" + PID3 + "'")
       === "레슨 자리를 찾습니다 (고침)", cStill);

  /* ⚠️ 갈래 · 분류 · 지역은 바꾸는 길이 없어야 합니다 */
  psql(as(SEEK) + "select edit_jobpost('" +
    J({ id:PID3, title:"또 고칩니다", body:"갈래도 보내 봅니다.",
        kind:"biz", sub:"cr-b2b", region:"busan",
        contact:"010-2222-3333" }) + "'::jsonb)");
  const k2 = psql(anon + "select kind || '/' || sub || '/' || region " +
    "from v_job_open where id = '" + PID3 + "'");
  ok("⚠️⚠️ 갈래 · 분류 · 지역은 고치는 문으로 **안 바뀐다** (보내도 무시합니다 — " +
     "바꾸면 들어온 지원이 전혀 다른 자리로 옮겨 갑니다)",
     k2 === "seek/cr-coach/seoul", k2);

  const hidEdit = denied(as(HOST) + "select edit_jobpost('" +
    J({ id:PID, title:"가려졌는데 고칩니다", body:"고쳐 봅니다.",
        contact:"010-1111-2222" }) + "'::jsonb)");
  ok("⚠️ 가려진 글은 글쓴이도 못 고친다", hidEdit.no, hidEdit.why);

  // ── ⑨ 마감일이 지나면 저절로 빠집니다 ─────────────────────────
  console.log("\n── 마감일이 지나면 저절로 빠집니다");
  const p4 = allowed(post(OTH, { title:"어제 마감인 글", body:"마감일을 봅니다.",
    contact:"010-4444-5555" }));
  ok("  (씨앗) 글이 들어갔다", p4.yes, p4.why);
  psql("update jobpost set close_at = current_date - 1 where id = '" + p4.out + "'");
  const expired = psql(anon + "select count(*) from v_job_open where id = '" + p4.out + "'");
  ok("⚠️ 마감일이 지난 글은 **공개 목록에서 빠진다**", expired === "0", expired);
  const expApply = denied(apply(SEEK, p4.out, { contact:"010-6666-7777" }));
  ok("⚠️ 마감일이 지난 글에는 못 넣는다", expApply.no, expApply.why);
  ok("  마감 상태와 **다른 말**로 거절한다", expApply.why !== closedApply.why,
     expApply.why + " | " + closedApply.why);

  // ── ⑩ 쏟아붓기 — ⚠️ 경계가 실제로 거기 있는지 ─────────────────
  console.log("\n── ⚠️ 쏟아붓기 막기");
  /* ⚠️⚠️ **영원히 안 걸리는 자물쇠**가 아닌지 — 열린 글 열까지입니다.
     ⚠️ 뒤 검사가 쓰는 글을 쓰지 않도록 **따로 사람**을 씁니다 (앞
     검사가 만든 상태를 뒤 검사가 물려받습니다 — 두 번 밟은 자리). */
  const FLOOD = psql("insert into auth.users (email) values ('jb-flood@x.test') returning id");
  psql("insert into account (id, role, name) values ('" + FLOOD +
       "','customer','쏟아') on conflict (id) do nothing");
  let made = 0;
  for(let i = 0; i < 10; i++){
    const r = allowed(post(FLOOD, { title:"쏟아붓기 검사 " + i,
      body:"열 건을 채웁니다.", contact:"010-8888-9999" }));
    if(r.yes) made++;
  }
  ok("열 건까지는 들어간다", made === 10, "들어간 것 " + made);
  const open11 = denied(post(FLOOD, { title:"열한째",
    body:"열한 번째를 넣어 봅니다.", contact:"010-8888-9999" }));
  ok("⚠️ 열한째는 막힌다 — **경계가 실제로 거기 있습니다**", open11.no, open11.why);
  ok("  그 거절이 **열**이라고 말한다", open11.no && open11.why.indexOf("열") >= 0,
     open11.why);
  /* ⚠️ 마감하면 다시 열 수 있어야 합니다 (닫고 다시 올리는 것은 정상) */
  const one = psql("select id from jobpost where by_user = '" + FLOOD + "' limit 1");
  psql(as(FLOOD) + "select move_jobpost('" + J({ id:one, state:"closed" }) + "'::jsonb)");
  const after = allowed(post(FLOOD, { title:"마감한 뒤 다시",
    body:"마감하면 자리가 생깁니다.", contact:"010-8888-9999" }));
  ok("⚠️ 마감하면 **다시 올릴 수 있다** (마감한 글은 안 셉니다)",
     after.yes, after.why);
  /* 하루 제한 — 열린 제한을 피하려고 시계를 뒤로 밀고 스무 건을 채웁니다 */
  psql("update jobpost set state = 'closed', created_at = now() - interval '1 hour' " +
       "where by_user = '" + FLOOD + "'");
  let day = 11;                      /* 위에서 열하나 들어갔습니다 */
  for(let i = 0; i < 9; i++){
    const r = allowed(post(FLOOD, { title:"하루 검사 " + i,
      body:"스무 건을 채웁니다.", contact:"010-8888-9999" }));
    if(r.yes){ day++; psql("update jobpost set state = 'closed' where id = '" +
                           r.out + "'"); }
  }
  ok("하루 스무 건까지는 들어간다", day === 20, "들어간 것 " + day);
  const d21 = denied(post(FLOOD, { title:"스물한째",
    body:"스물한 번째를 넣어 봅니다.", contact:"010-8888-9999" }));
  ok("⚠️ 스물한째는 막힌다", d21.no, d21.why);
  ok("  그 거절이 **하루**라고 말한다 (열린 글 제한과 다른 말)",
     d21.no && d21.why.indexOf("하루") >= 0 && d21.why !== open11.why, d21.why);

  // ── ⑪ 신고 — ⚠️ 새 표를 만들지 않습니다 ───────────────────────
  console.log("\n── 신고는 기존 report 에 붙입니다");
  const rep = allowed(as(SEEK) + "select open_report('" +
    J({ kind:"abuse", jobpost:PID3, body:"허위 구직으로 보입니다" }) + "'::jsonb)");
  ok("구인 · 구직 글을 신고할 수 있다", rep.yes && /^[0-9a-f-]{36}$/.test(rep.out),
     rep.out || rep.why);
  const where = psql("select jobpost_id from report where id = '" + rep.out + "'");
  ok("  그 신고가 **그 글**을 가리킨다", where === PID3, where);
  /* ⚠️⚠️ 0040 · 0046 · 0047 이 하던 일이 안 날아갔는지 */
  const shortB = denied(as(SEEK) + "select open_report('" +
    J({ kind:"abuse", jobpost:PID3, body:"짧" }) + "'::jsonb)");
  ok("⚠️ 0040 의 **다섯 글자 막음이 살아 있다**", shortB.no, shortB.why);
  const dup = denied(as(SEEK) + "select open_report('" +
    J({ kind:"abuse", jobpost:PID3, body:"또 넣어 봅니다" }) + "'::jsonb)");
  ok("⚠️ 중복 막음도 살아 있다", dup.no, dup.why);
  const noTarget = denied(as(SEEK) + "select open_report('" +
    J({ kind:"abuse", body:"아무것도 안 가리킵니다" }) + "'::jsonb)");
  ok("⚠️ 가리키는 것이 없으면 여전히 막힌다", noTarget.no, noTarget.why);
  const cqId = psql("select id from cq limit 1");
  if(cqId){
    const repQ = allowed(as(SEEK) + "select open_report('" +
      J({ kind:"abuse", question:cqId, body:"커뮤니티 신고가 아직 되는지 봅니다" }) + "'::jsonb)");
    ok("⚠️⚠️ 0047 의 **커뮤니티 신고가 아직 된다** (갈아 끼우며 안 날렸습니다)",
       repQ.yes, repQ.why);
  }
  const jrId = psql("select id from joinroom limit 1");
  if(jrId){
    const repJ = allowed(as(SEEK) + "select open_report('" +
      J({ kind:"abuse", joinroom:jrId, body:"조인 신고가 아직 되는지 봅니다" }) + "'::jsonb)");
    ok("⚠️⚠️ 0046 의 **조인 신고도 아직 된다**", repJ.yes, repJ.why);
  }

  // ── ⑫ 들어오는 길은 문뿐 ──────────────────────────────────────
  console.log("\n── ⚠️ 들어오는 길은 문뿐입니다");
  const ins = denied(as(OTH) + "insert into jobpost (by_user, kind, sub, region, " +
    "title, body, contact, agree_at) values ('" + OTH +
    "','hire','cr-caddy','seoul','직접 넣기','표에 바로 넣어 봅니다'," +
    "'010-0000-0000', now())");
  ok("표에 직접 넣지 못한다", ins.no, ins.why);
  const upd = denied(as(OTH) + "update jobpost set state = 'open' where id = '" + PID + "'");
  ok("표를 직접 고치지 못한다", upd.no, upd.why);
  const stillHid = psql("select state from jobpost where id = '" + PID + "'");
  ok("⚠️ 그리고 실제로 **안 바뀌었다** (에러만 보지 않고 값을 봅니다)",
     stillHid === "hidden", stillHid);
  const insA = denied(as(OTH) + "insert into jobapply (post_id, by_user, contact, " +
    "agree_at) values ('" + PID3 + "','" + OTH + "','010-0000-0000', now())");
  ok("지원도 표에 직접 넣지 못한다", insA.no, insA.why);
  /* ⚠️⚠️ **연락처를 직접 열지 못해야** 합니다 — 문 말고 길이 없습니다 */
  const updA = denied(as(OTH) + "update jobapply set host_share_at = now() " +
    "where id = '" + AID + "'");
  ok("⚠️⚠️ 연락처 여는 칸을 **표에서 직접 못 켠다**", updA.no, updA.why);
};

/* ════════════════════════════════════════════════════════════════════
   업체 사진 · 증빙서류 — 눌러 봅니다 (0051)

   ⚠️⚠️⚠️ **여기서 가장 조심한 것은 증빙서류입니다.** 사업자등록증 ·
   자격증이 공개로 새면 그건 그 서류가 인터넷에 올라간 것입니다.
   자물쇠를 **세 겹**으로 두고 **셋을 따로** 눌러 봅니다 —
     ① 공개 보기가 `kind = 'photo'` 만 냅니다 (서류는 **칸이 아니라
        줄이** 아예 없습니다)
     ② 표의 RLS 가 그 업체와 운영자에게만 줄을 보여 줍니다
     ③ 경로가 갈래를 **글자로** 들고 있고 표의 check 가 그것을 봅니다
        (서버가 그 경로로 버킷을 고릅니다 — 문이 내려가도 남습니다)
   하나만 보고 "막혔다" 고 읽으면 나머지 둘이 장식인지 알 수 없습니다.

   ⚠️ 재는 것은 늘 **문**입니다. 표에 바로 넣으면 자물쇠를 지나갑니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0051 업체 사진 · 증빙서류 — 씨앗");
  const PRO  = psql("insert into auth.users (email) values ('pp-pro@x.test') returning id");
  const PRO2 = psql("insert into auth.users (email) values ('pp-pro2@x.test') returning id");
  const TPR  = psql("insert into auth.users (email) values ('pp-tpro@x.test') returning id");
  const CUS  = psql("insert into auth.users (email) values ('pp-cus@x.test') returning id");
  const ADM  = psql("insert into auth.users (email) values ('pp-adm@x.test') returning id");

  psql("insert into provider (id, name, listed, state, is_test) values " +
       "('pp-a','사진올리는골프장', true, 'approved', false)," +
       "('pp-b','다른골프장', true, 'approved', false)," +
       "('pp-t','검사용골프장', false, 'approved', true) " +
       "on conflict (id) do update set name = excluded.name, " +
       "listed = excluded.listed, state = excluded.state, is_test = excluded.is_test");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + PRO  + "','provider','박담당','pp-a')," +
       "('" + PRO2 + "','provider','다른담당','pp-b')," +
       "('" + TPR  + "','provider','검사담당','pp-t')," +
       "('" + CUS  + "','customer','손님', null)," +
       "('" + ADM  + "','admin','사진 관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const J    = o => JSON.stringify(o).replace(/'/g, "''");
  const claim = (who, extra) => as(who) + "select claim_provider_photo('" +
    J(Object.assign({ kind:"photo", mime:"image/jpeg", bytes:"120000" }, extra)) +
    "'::jsonb)";

  // ── ① 올릴 자리를 받습니다 ────────────────────────────────────
  console.log("\n── 올릴 자리를 받습니다");
  const c1 = allowed(claim(PRO, { caption:"실내 타석" }));
  ok("업체 담당자는 사진 자리를 받는다", c1.yes && c1.out.indexOf("pv/pp-a/photo/") > 0,
     c1.out || c1.why);
  const PATH1 = (c1.out.match(/pv\/pp-a\/photo\/[0-9a-f-]+\.jpg/) || [""])[0];
  ok("  경로를 **DB 가** 짓는다 (화면이 보낸 이름을 안 씁니다)",
     /pv\/pp-a\/photo\/[0-9a-f-]{36}\.jpg$/.test(PATH1), PATH1);

  const d1 = allowed(as(PRO) + "select claim_provider_photo('" +
    J({ kind:"doc", mime:"application/pdf", bytes:"50000" }) + "'::jsonb)");
  ok("서류 자리도 받는다", d1.yes && d1.out.indexOf("pv/pp-a/doc/") > 0,
     d1.out || d1.why);
  /* ⚠️⚠️⚠️ **경로가 갈래를 글자로 들고 있습니다** — 서버가 이것으로
     버킷을 고릅니다 (api/upload.js 의 bucketForPath). */
  ok("⚠️⚠️ 서류 경로에 **photo 가 안 붙는다** (서버가 이 글자로 버킷을 고릅니다)",
     d1.out.indexOf("/photo/") < 0 && d1.out.indexOf("/doc/") > 0, d1.out);

  console.log("\n── 자물쇠마다 다른 말로 거절합니다");
  const says = {};
  const n1 = denied(anon + "select claim_provider_photo('" +
    J({ kind:"photo", mime:"image/jpeg", bytes:"1000" }) + "'::jsonb)");
  ok("비로그인은 못 받는다", n1.no, n1.why);
  const n2 = denied(claim(CUS, {}));                  says.role  = n2.why;
  ok("⚠️ 손님은 못 받는다 (업체 계정이어야 합니다)", n2.no, n2.why);
  const n3 = denied(claim(PRO, { kind:"" }));         says.kind  = n3.why;
  ok("갈래가 없으면 막힌다", n3.no, n3.why);
  /* ⚠️⚠️ **갈래와 형식이 짝이어야** 합니다 — 섞이면 공개 보기에 PDF 가
     `<img>` 로 나가고 화면이 깨집니다. */
  const n4 = denied(claim(PRO, { mime:"application/pdf" }));  says.pmime = n4.why;
  ok("⚠️⚠️ 사진 칸에 **PDF 를 못 넣는다** (서류를 사진으로 올리는 길을 막습니다)",
     n4.no, n4.why);
  const n5 = denied(as(PRO) + "select claim_provider_photo('" +
    J({ kind:"doc", mime:"image/jpeg", bytes:"1000" }) + "'::jsonb)");
  says.dmime = n5.why;
  ok("서류 칸에는 사진을 못 넣는다", n5.no, n5.why);
  const n6 = denied(claim(PRO, { bytes:"9000000" }));  says.bytes = n6.why;
  ok("8MB 를 넘으면 막힌다", n6.no, n6.why);
  const n7 = denied(claim(PRO, { caption:"가".repeat(61) })); says.cap = n7.why;
  ok("설명이 길면 막힌다", n7.no, n7.why);
  const uniq = new Set(Object.values(says));
  ok("⚠️⚠️ 일곱 자물쇠가 **서로 다른 말**로 거절한다 (엉뚱한 까닭으로 " +
     "통과하지 않게)", uniq.size === Object.keys(says).length, JSON.stringify(says));

  // ── ② 공개 보기 — ⚠️⚠️⚠️ 서류는 **줄이 아예 없습니다** ────────
  console.log("\n── ⚠️⚠️⚠️ 자물쇠 ① 공개 보기에 **서류가 아예 없습니다**");
  const vcols = psql("select string_agg(column_name, ',' order by column_name) " +
    "from information_schema.columns where table_name = 'v_provider_photo_public'");
  ok("⚠️ 공개 보기에 `kind` 칸이 **없다** (사진만 담으므로 가를 것이 없습니다)",
     vcols.indexOf("kind") < 0, vcols);
  ok("⚠️ `by_user` 도 없다 (누가 올렸는지는 공개가 아닙니다)",
     vcols.indexOf("by_user") < 0, vcols);
  ok("  경로 · 형식 · 설명은 있다 (화면이 그려야 합니다)",
     vcols.indexOf("path") >= 0 && vcols.indexOf("mime") >= 0 &&
     vcols.indexOf("caption") >= 0, vcols);

  const seePhoto = psql(anon + "select count(*) from v_provider_photo_public " +
    "where provider_id = 'pp-a'");
  ok("비로그인도 시설 사진은 본다 (크롤러도 봅니다)", seePhoto === "1", seePhoto);
  const seeDoc = psql(anon + "select count(*) from v_provider_photo_public " +
    "where path like '%/doc/%'");
  ok("⚠️⚠️⚠️ **증빙서류는 공개 보기에 줄이 하나도 없다**", seeDoc === "0", seeDoc);

  /* ⚠️⚠️ **검사용 업체 사진이 공개로 나가면 안 됩니다** (0032 의 그 자리) */
  const ct = allowed(claim(TPR, { caption:"검사용 사진" }));
  ok("  (씨앗) 검사용 업체도 자리를 받습니다", ct.yes, ct.why);
  const seeTest = psql(anon + "select count(*) from v_provider_photo_public " +
    "where provider_id = 'pp-t'");
  ok("⚠️⚠️ **검사용 업체 사진은 공개로 안 나간다** (없는 회사를 광고하지 않습니다)",
     seeTest === "0", seeTest);

  /* ⚠️ 공개를 끄거나 정지되면 그 순간부터 빠집니다 */
  psql("update provider set listed = false where id = 'pp-a'");
  const offListed = psql(anon + "select count(*) from v_provider_photo_public " +
    "where provider_id = 'pp-a'");
  ok("⚠️ 공개를 끄면 사진도 **그 순간** 빠진다", offListed === "0", offListed);
  psql("update provider set listed = true where id = 'pp-a'");
  psql(as(ADM) + "select set_provider_state(jsonb_build_object(" +
       "'id','pp-a','to','suspended','why','검사로 정지합니다'))");
  const offState = psql(anon + "select count(*) from v_provider_photo_public " +
    "where provider_id = 'pp-a'");
  ok("⚠️ 정지되면 사진도 **그 순간** 빠진다", offState === "0", offState);
  psql(as(ADM) + "select set_provider_state(jsonb_build_object('id','pp-a','to','approved'))");
  psql("update provider set listed = true where id = 'pp-a'");

  // ── ③ 표 — ⚠️ 그 업체와 운영자만 ──────────────────────────────
  console.log("\n── ⚠️⚠️ 자물쇠 ② 표는 그 업체와 운영자만");
  const anonTbl = denied(anon + "select count(*) from provider_photo");
  ok("비로그인은 표를 못 읽는다", anonTbl.no, anonTbl.why);
  const mineTbl = allowed(as(PRO) + "select count(*) from provider_photo");
  ok("그 업체 담당자는 제 것을 전부 본다 (서류 포함)",
     mineTbl.yes && mineTbl.out === "2", mineTbl.out || mineTbl.why);
  /* ⚠️⚠️ **다른 업체의 서류가 보이면 안 됩니다** */
  const othTbl = allowed(as(PRO2) + "select count(*) from provider_photo");
  ok("⚠️⚠️ **다른 업체의 것은 줄이 안 보인다** (서류도 사진도)",
     othTbl.yes && othTbl.out === "0", othTbl.out || othTbl.why);
  const cusTbl = allowed(as(CUS) + "select count(*) from provider_photo");
  ok("손님에게도 안 보인다", cusTbl.yes && cusTbl.out === "0",
     cusTbl.out || cusTbl.why);
  const admTbl = allowed(as(ADM) + "select count(*) from provider_photo");
  ok("운영자는 본다 (심사해야 합니다)", admTbl.yes && Number(admTbl.out) >= 2,
     admTbl.out || admTbl.why);

  // ── ④ 몇 장까지 — ⚠️ 경계가 실제로 거기 있는지 ────────────────
  console.log("\n── ⚠️ 몇 장까지");
  let made = 1;                           /* 위에서 하나 받았습니다 */
  for(let i = 0; i < 9; i++){
    const r = allowed(claim(PRO, { caption:"사진 " + i }));
    if(r.yes) made++;
  }
  ok("사진 열 장까지는 받는다", made === 10, "받은 것 " + made);
  const over = denied(claim(PRO, { caption:"열한째" }));
  ok("⚠️ 열한째는 막힌다 — **경계가 실제로 거기 있습니다**", over.no, over.why);
  ok("  그 거절이 **열 장**이라고 말한다", over.no && over.why.indexOf("열 장") >= 0,
     over.why);
  /* 서류는 다섯 장 — ⚠️ 사진 한도와 **따로** 셉니다 */
  let dn = 1;
  for(let i = 0; i < 4; i++){
    const r = allowed(as(PRO) + "select claim_provider_photo('" +
      J({ kind:"doc", mime:"application/pdf", bytes:"50000" }) + "'::jsonb)");
    if(r.yes) dn++;
  }
  ok("서류 다섯 장까지는 받는다 (사진 한도와 따로 셉니다)", dn === 5, "받은 것 " + dn);
  const dOver = denied(as(PRO) + "select claim_provider_photo('" +
    J({ kind:"doc", mime:"application/pdf", bytes:"50000" }) + "'::jsonb)");
  ok("⚠️ 여섯째 서류는 막힌다", dOver.no, dOver.why);
  ok("  사진과 **다른 말**로 거절한다", dOver.why !== over.why,
     over.why + " | " + dOver.why);

  // ── ⑤ 빼기 ────────────────────────────────────────────────────
  console.log("\n── 뺍니다");
  const PID = psql("select id from provider_photo where provider_id = 'pp-a' " +
                   "and kind = 'photo' limit 1");
  const othDrop = denied(as(PRO2) + "select drop_provider_photo('" +
    J({ id:PID }) + "'::jsonb)");
  ok("⚠️ 다른 업체는 못 뺀다", othDrop.no, othDrop.why);
  const cusDrop = denied(as(CUS) + "select drop_provider_photo('" +
    J({ id:PID }) + "'::jsonb)");
  ok("손님도 못 뺀다", cusDrop.no, cusDrop.why);
  const myDrop = allowed(as(PRO) + "select drop_provider_photo('" +
    J({ id:PID }) + "'::jsonb)");
  ok("그 업체는 뺄 수 있다", myDrop.yes && myDrop.out.indexOf("pv/pp-a/") === 0,
     myDrop.out || myDrop.why);
  ok("  ⚠️ **경로를 돌려준다** (서버가 이어서 Storage 에서 지웁니다)",
     /pv\/pp-a\/photo\//.test(myDrop.out), myDrop.out);
  const gone = psql("select count(*) from provider_photo where id = '" + PID + "'");
  ok("  줄이 지워진다", gone === "0", gone);
  const admDrop = allowed(as(ADM) + "select drop_provider_photo('" +
    J({ id: psql("select id from provider_photo where provider_id = 'pp-t' limit 1") }) +
    "'::jsonb)");
  ok("운영자도 뺄 수 있다", admDrop.yes, admDrop.why);

  /* ⚠️ 감사 기록에 **경로를 안 넣습니다** — 번호로 찾아갑니다 */
  const audit = psql("select coalesce(string_agg(data::text,'|'),'') from audit_log " +
    "where obj = 'provider_photo'");
  ok("⚠️ 감사 기록에 **경로가 안 들어간다**", audit.indexOf("pv/pp-a/") < 0, audit);

  // ── ⑥ 들어오는 길은 문뿐 ──────────────────────────────────────
  console.log("\n── ⚠️ 들어오는 길은 문뿐입니다");
  const ins = denied(as(PRO) + "insert into provider_photo (provider_id, kind, " +
    "path, mime, bytes) values ('pp-a','photo','pv/pp-a/photo/x.jpg','image/jpeg',100)");
  ok("표에 직접 넣지 못한다", ins.no, ins.why);
  const upd = denied(as(PRO) + "update provider_photo set kind = 'photo' " +
    "where provider_id = 'pp-a'");
  ok("표를 직접 고치지 못한다 (서류를 사진으로 바꿀 수 없습니다)", upd.no, upd.why);
  const del = denied(as(PRO) + "delete from provider_photo where provider_id = 'pp-a'");
  ok("표에서 직접 지우지 못한다", del.no, del.why);

  /* ⚠️⚠️⚠️ **경로가 갈래와 어긋나면 표가 거절합니다** — 문이 내려가는
     날 이 줄이 남습니다 (서버가 그 경로로 버킷을 고릅니다). */
  const badPath = denied("insert into provider_photo (provider_id, kind, path, " +
    "mime, bytes) values ('pp-a','doc','pv/pp-a/photo/sneaky.pdf','application/pdf',100)");
  ok("⚠️⚠️⚠️ 서류를 **사진 경로에** 넣으려 하면 표가 거절한다 (문이 " +
     "내려가도 이 줄이 남습니다)", badPath.no, badPath.why);
  const badPath2 = denied("insert into provider_photo (provider_id, kind, path, " +
    "mime, bytes) values ('pp-a','photo','pv/pp-b/photo/x.jpg','image/jpeg',100)");
  ok("⚠️ 남의 업체 경로로도 못 넣는다 (경로에 업체 id 가 들어갑니다)",
     badPath2.no, badPath2.why);
  const ck = psql("select count(*) from pg_constraint " +
    "where conname in ('pvphoto_path_ok','pvphoto_kind_mime_ok')");
  ok("⚠️ 그 두 줄이 **표에 실제로 있다**", ck === "2", ck);
};

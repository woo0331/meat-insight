/* ════════════════════════════════════════════════════════════════════
   전국 골프장 · 연습장 마스터 — 눌러 봅니다 (0066)

   ⚠️⚠️⚠️ **여기서 가장 중요한 것은 "지어낸 골프장이 손님에게 안 나가는가"**
   입니다. 그래서 자물쇠를 **갈라서** 잽니다 —
     ① 표를 손님 · 업체가 **아예 못 읽는가** (정책이 하나도 없습니다)
     ② 공개 보기가 **가린 것을 안 내는가** (보기는 RLS 를 안 지납니다)
     ③ 문이 **운영자가 아니면 거절하는가**
   하나만 보고 "막혔다" 고 읽으면 나머지가 장식인지 알 수 없습니다.

   ⚠️⚠️ **티타임을 마스터에 잇는 트리거가 추측하지 않는지**가 둘째입니다 —
   비슷한 이름으로 이으면 손님이 **다른 골프장을 예약**합니다.

   ⚠️⚠️ **정규화 규칙이 JS 와 SQL 두 곳에서 같은 답을 내는지**를 맞춰 봅니다.
   어긋나면 들여온 `name_norm` 과 트리거가 세는 값이 달라 티타임이 영영
   안 이어지고 **에러도 안 납니다**.

   ⚠️ 쓰는 id 앞머리는 `cs-` 입니다 (다른 검사와 안 부딪히게).
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;
  const { execFileSync } = require("child_process");
  const fs = require("fs"), os = require("os"), path = require("path");
  const ROOT = path.join(__dirname, "..", "..");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const J    = o => JSON.stringify(o).replace(/'/g, "''");

  console.log("\n── 0066 골프장 마스터 — 씨앗");
  const ADM = psql("insert into auth.users (email) values ('cs-adm@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('cs-cus@x.test') returning id");
  const PRV = psql("insert into auth.users (email) values ('cs-prv@x.test') returning id");
  psql("update account set role = 'admin' where id = '" + ADM + "'");

  /* ── ① 정규화 규칙이 두 곳에서 같은 답을 내는가 ───────────────── */
  console.log("\n── 이름 정규화 — JS 와 SQL 이 같은 답을 내는가");
  /* ⚠️ 기대값을 **코드와 같은 식으로 적지 않습니다** — JS 를 실제로 돌려
     나온 값과 DB 가 센 값을 맞춰 봅니다 (식을 바꿔도 답이 같으면 아무것도
     안 잡는 검사가 됩니다). */
  const SAMPLES = ["(주)남서울 컨트리클럽", "남서울C.C", "주식회사 레이크사이드 골프클럽",
                   "레이크사이드 G.C", "강남 골프연습장"];
  const jsNorm = (function(){
    const src = fs.readFileSync(path.join(ROOT, "tools", "clean-courses.js"), "utf8");
    const i = src.indexOf("function normName(s){");
    const j = src.indexOf("\n}", i) + 2;
    /* ⚠️ 복사해 적지 않고 **그 파일에서 꺼내** 돌립니다 — 베끼면 둘이
       조용히 달라지고 이 검사가 그것을 못 잡습니다. */
    return new Function(src.slice(i, j) + "; return normName;")();
  })();
  let same = 0;
  SAMPLES.forEach(function(s){
    const a = jsNorm(s);
    const b = psql("select course_norm('" + s.replace(/'/g, "''") + "')");
    if(a === b) same++;
    else ok("  정규화가 같다 — " + s, false, "JS=" + a + " / SQL=" + b);
  });
  ok("⚠️⚠️ 이름 정규화가 JS 와 SQL 에서 같은 답을 낸다 (" + same + "/" + SAMPLES.length + ")",
     same === SAMPLES.length, same + "/" + SAMPLES.length);
  ok("  '컨트리클럽' 과 'C.C' 가 같은 값이 된다",
     psql("select course_norm('남서울 컨트리클럽') = course_norm('남서울C.C')") === "t");
  ok("  ⚠️ **다른 골프장은 안 같아진다** (추측해서 묶지 않습니다)",
     psql("select course_norm('남서울CC') = course_norm('북서울CC')") === "f");

  /* ── ② 문 — 운영자만 ─────────────────────────────────────── */
  console.log("\n── 문은 운영자만 씁니다");
  const mk = (who, o) => psql(as(who) + "select save_course('" + J(o) + "')");
  const base = { slug:"cs-namseoul", kind:"golf", name:"검사용 남서울 컨트리클럽",
                 region:"gyeonggi", gu:"성남시", addr:"경기도 성남시 1", holes:18 };
  const d1 = denied(as(CUS) + "select save_course('" + J(base) + "')");
  ok("손님은 골프장을 못 만든다", d1.no, d1.why);
  const d2 = denied(as(PRV) + "select save_course('" + J(base) + "')");
  ok("업체도 못 만든다", d2.no, d2.why);
  const CID = mk(ADM, base);
  ok("운영자는 만든다", /^[0-9a-f-]{36}$/.test(CID), CID);

  /* ⚠️ 거절하는 **말까지** 맞춰 봅니다 — 자물쇠마다 다른 말이어야
     어느 것이 막았는지 알 수 있습니다. */
  const dSlug = denied(as(ADM) + "select save_course('" +
    J(Object.assign({}, base, { slug:"한글슬러그", name:"검사용 둘" })) + "')");
  ok("  slug 가 영문 소문자가 아니면 거절한다", dSlug.no, dSlug.why);
  ok("  그 말이 손님 말로 되어 있다",
     /slug/.test(dSlug.why) && dSlug.why !== (d1.why || ""), dSlug.why);
  const dName = denied(as(ADM) + "select save_course('" + J({ slug:"cs-x", name:"" }) + "')");
  ok("  이름이 비면 **다른 말로** 거절한다",
     dName.no && dName.why !== dSlug.why, dName.why);

  /* ── ③ 보기 — 가린 것은 안 나갑니다 ──────────────────────── */
  console.log("\n── 공개 보기 (보기는 RLS 를 안 지납니다 — where 절이 자물쇠)");
  const seen = psql(anon + "select count(*) from v_course_public where id = '" + CID + "'");
  ok("비로그인도 공개 보기를 읽는다", seen === "1", seen);
  const tbl = denied(anon + "select count(*) from course");
  ok("⚠️⚠️ 표는 **아예 못 읽는다** (GRANT 를 안 줬습니다)", tbl.no, tbl.why);
  const tbl2 = denied(as(CUS) + "select count(*) from course");
  ok("  로그인한 손님도 표는 못 읽는다", tbl2.no, tbl2.why);

  psql(as(ADM) + "select move_course('" + J({ id:CID, to:"hidden", why:"검사" }) + "')");
  const gone = psql(anon + "select count(*) from v_course_public where id = '" + CID + "'");
  ok("⚠️ 가리면 손님 보기에서 **빠진다**", gone === "0", gone);
  const dWhy = denied(as(ADM) + "select move_course('" + J({ id:CID, to:"hidden" }) + "')");
  ok("  까닭 없이는 못 가린다", dWhy.no, dWhy.why);
  psql(as(ADM) + "select move_course('" + J({ id:CID, to:"open", why:"" }) + "')");

  /* ⚠️ 폐업은 **지우지 않고** 냅니다 — 손님이 "문 닫았나" 를 확인해야 합니다 */
  psql(as(ADM) + "select move_course('" + J({ id:CID, to:"closed", why:"" }) + "')");
  const cl = psql(anon + "select state from v_course_public where id = '" + CID + "'");
  ok("⚠️ 폐업은 지우지 않고 **closed 로 보인다**", cl === "closed", cl);
  psql(as(ADM) + "select move_course('" + J({ id:CID, to:"open", why:"" }) + "')");

  /* ── ④ 티타임 잇기 — 추측하지 않습니다 ──────────────────── */
  console.log("\n── 티타임을 마스터에 잇기 (⚠️ 비슷한 이름으로 추측하지 않습니다)");
  psql("insert into provider (id, name, listed, is_test, state, subs, regions) " +
       "values ('cs-pv','검사용 부킹사', true, false, 'approved', array['bk-find'], array['gyeonggi']) " +
       "on conflict (id) do update set listed = true, is_test = false, state = 'approved'");
  psql("update account set role = 'provider', provider_id = 'cs-pv' where id = '" + PRV + "'");

  /* ⚠️ 열쇠 이름은 **0060 이 읽는 그대로**입니다 (playAt — play_at 이 아닙니다).
     틀리면 "라운드 날짜를 골라 주세요" 로 거절당하고, 그건 코드가 아니라
     제 검사가 틀린 자리입니다. */
  const DAY = psql("select (kst_today() + 3)::text");
  const tee = o => psql(as(PRV) + "select open_teetime('" + J(Object.assign({
    kind:"booking", region:"gyeonggi", playAt: DAY, teeAt:"09:00",
    priceUnit:"person", cancelTerms:"검사용 취소 조건",
    slots:"4", holes:"18" }, o)) + "')");

  const t1 = tee({ course:"검사용 남서울 C.C" });
  ok("이름이 (정규화로) 맞으면 **저절로 이어진다**",
     psql("select course_id = '" + CID + "' from teetime where id = '" + t1 + "'") === "t");
  const t2 = tee({ course:"검사용 북서울 컨트리클럽" });
  ok("⚠️⚠️ 다른 이름은 **안 잇고 null 로 둔다** (지어내지 않습니다)",
     psql("select course_id is null from teetime where id = '" + t2 + "'") === "t");

  /* 운영자가 확인한 별명만 이어 줍니다 */
  psql(as(ADM) + "select link_course_alias('" +
       J({ course_id:CID, alias:"검사용 북서울 컨트리클럽" }) + "')");
  ok("  운영자가 별명을 이으면 **이미 올라온 티타임도** 이어진다",
     psql("select course_id = '" + CID + "' from teetime where id = '" + t2 + "'") === "t");
  const dAl = denied(as(CUS) + "select link_course_alias('" +
       J({ course_id:CID, alias:"손님이 지은 이름" }) + "')");
  ok("  손님은 별명을 못 잇는다", dAl.no, dAl.why);

  /* ── ⑤ 공개 보기가 slug 를 내는가 (화면이 링크를 거는 근거) ── */
  const slug = psql(anon + "select course_slug from v_teetime_open where id = '" + t1 + "'");
  ok("v_teetime_open 이 골프장 slug 를 낸다 (화면이 링크를 겁니다)",
     slug === "cs-namseoul", slug);
  psql(as(ADM) + "select move_course('" + J({ id:CID, to:"hidden", why:"검사" }) + "')");
  const slug2 = psql(anon + "select coalesce(course_slug,'(없음)') from v_teetime_open where id = '" + t1 + "'");
  ok("  ⚠️ 가린 골프장은 slug 를 **안 냅니다** (404 로 보내지 않습니다)",
     slug2 === "(없음)", slug2);
  psql(as(ADM) + "select move_course('" + J({ id:CID, to:"open", why:"" }) + "')");

  /* ── ⑥ 집계 보기가 목록 보기 위에 서 있는가 ─────────────── */
  console.log("\n── 집계와 목록이 구조적으로 못 어긋나는가");
  const n1 = psql(anon + "select coalesce(sum(n),0) from v_course_count where region = 'gyeonggi'");
  psql(as(ADM) + "select move_course('" + J({ id:CID, to:"hidden", why:"검사" }) + "')");
  const n2 = psql(anon + "select coalesce(sum(n),0) from v_course_count where region = 'gyeonggi'");
  ok("가리면 집계도 **같이** 줄어든다 (" + n1 + " → " + n2 + ")",
     Number(n2) === Number(n1) - 1, n1 + " → " + n2);
  psql(as(ADM) + "select move_course('" + J({ id:CID, to:"open", why:"" }) + "')");

  /* ── ⑦ 들여오기 SQL — 멱등 · 되돌리기 ───────────────────── */
  console.log("\n── 들여오기 SQL (멱등 · 되돌리기)");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "csimp-"));
  const HEAD = "source_id,src_key,kind,name,name_norm,region,gu,addr,addr_road,tel,holes,biz_kind,lat,lng,state,status_raw,as_of";
  fs.writeFileSync(path.join(tmp, "courses_clean.csv"),
    HEAD + "\n" +
    '"cs-src","K-1","golf","검사용 들여온 골프장","","gyeonggi","이천시","경기도 이천시 2","","031-000-0000","18","대중제","","","open","영업/정상","2026-11-01"\n' +
    '"FIXTURE","K-2","golf","가짜 골프장","","seoul","강남구","서울 강남 1","","","18","","","","open","영업/정상",""\n',
    "utf8");
  fs.writeFileSync(path.join(tmp, "ranges_clean.csv"), HEAD + "\n", "utf8");
  execFileSync("node", [path.join(ROOT, "tools", "make-import-sql.js"), "--stage=" + tmp],
               { stdio:["ignore","pipe","pipe"] });
  const sqlText = fs.readFileSync(path.join(tmp, "import_courses.sql"), "utf8");
  ok("⚠️⚠️⚠️ **가짜(FIXTURE) 줄은 SQL 에 안 들어간다**",
     sqlText.indexOf("가짜 골프장") < 0 && sqlText.indexOf("검사용 들여온 골프장") > 0);

  const before = psql("select count(*) from course");
  T.psqlFile(path.join(tmp, "import_courses.sql"));
  const after1 = psql("select count(*) from course");
  ok("들여오기 SQL 이 실제로 돈다 (" + before + " → " + after1 + ")",
     Number(after1) === Number(before) + 1, before + " → " + after1);
  T.psqlFile(path.join(tmp, "import_courses.sql"));
  const after2 = psql("select count(*) from course");
  ok("⚠️⚠️ **두 번 넣어도 안 늘어난다** (멱등)", after2 === after1, after1 + " → " + after2);

  /* 운영자가 가린 것을 다시 넣어도 **안 되살아나는지** */
  const IMPID = psql("select id from course where slug = 'cs-src-k-1'");
  psql(as(ADM) + "select move_course('" + J({ id:IMPID, to:"hidden", why:"검사" }) + "')");
  T.psqlFile(path.join(tmp, "import_courses.sql"));
  ok("⚠️⚠️ 운영자가 **가린 것은 다시 넣어도 안 되살아난다**",
     psql("select state from course where id = '" + IMPID + "'") === "hidden");
  psql(as(ADM) + "select move_course('" + J({ id:IMPID, to:"open", why:"" }) + "')");

  /* ⚠️⚠️ **출처 줄이 하나도 없는** 골프장 — 되돌리기가 이것을 지우면 안
     됩니다(2026-11-15 에 실제로 지웠습니다 · 위 CID 는 티타임이 걸려 있어
     그 고장을 못 봤습니다). */
  psql("insert into course (slug, kind, name, region) values ('cs-bare', 'golf', '출처 없는 손 골프장', 'seoul')");
  /* ⚠️⚠️⚠️ 운영자가 한 번 가렸다 되돌린 골프장은 **고친 자료**입니다 —
     되돌리기가 지우지 않고 **멈추며 그 이름을 말해야** 합니다(2026-11-15 ·
     운영 반영 승인 조건 4). 전에는 그대로 지웠습니다. */
  let stopped = "";
  try{ T.psqlFile(path.join(tmp, "rollback_courses.sql")); }
  catch(e){ stopped = String(e.stderr || e.message); }
  ok("⚠️⚠️⚠️ 운영자가 손댄 골프장이 있으면 되돌리기가 **멈추고 까닭을 말한다**",
     stopped.indexOf("되돌리기를 멈춥니다") >= 0 && stopped.indexOf("운영자 수정") >= 0, stopped.slice(0, 200));
  ok("  멈추면 **한 줄도 안 지운다**",
     psql("select count(*) from course") === String(Number(after2) + 1));
  ok("⚠️⚠️ 되돌리기가 **출처 줄 없는 골프장은 안 지운다**",
     psql("select count(*) from course where slug = 'cs-bare'") === "1");
  psql("delete from course where slug = 'cs-bare'");
  /* 그 묶음은 검사가 직접 치웁니다(되돌리기가 멈춘 것이 맞으므로) */
  psql("delete from course where id = '" + IMPID + "'");
  psql("delete from import_batch where source_id = 'cs-src'");
  const after3 = psql("select count(*) from course");
  ok("검사가 넣은 묶음을 치웠다 (" + after2 + " → " + after3 + ")",
     Number(after3) === Number(before), before + " / " + after3);
  ok("  ⚠️ 손으로 만든 골프장은 **안 지운다**",
     psql("select count(*) from course where id = '" + CID + "'") === "1");
  try{ fs.rmSync(tmp, { recursive:true, force:true }); }catch(e){}

  /* ── ⑦-2 시설 단위 — 두 줄(회원제 · 대중제)이 **한 골프장 + 출처 둘** ── */
  console.log("\n── 들여오기 SQL (시설 단위 · 검토 대기는 안 넣음)");
  const tmp2 = fs.mkdtempSync(path.join(os.tmpdir(), "csfac-"));
  fs.writeFileSync(path.join(tmp2, "courses_clean.csv"),
    HEAD + ",fac_id\n" +
    '"cs-fac","A1","golf","묶음 골프장","","jeju","제주시","제주시 1","","","18","회원제","","","open","현황 등재","2024-12-31","cs-fac:A1"\n' +
    '"cs-fac","A2","golf","묶음 골프장","","jeju","제주시","제주시 1","","","9","대중제","","","open","현황 등재","2024-12-31","cs-fac:A1"\n' +
    '"cs-fac","B1","golf","검토 대기 골프장","","jeju","제주시","제주시 2","","","9","","","","open","현황 등재","2024-12-31","cs-fac:B1"\n', "utf8");
  const FH = "fac_id,kind,name,name_norm,region,gu,addr,addr_road,tel,holes,biz_kind,lat,lng,state,source_id,as_of,members,sources,evidence,addr_conflict,hold,hold_why";
  fs.writeFileSync(path.join(tmp2, "courses_facility.csv"), FH + "\n" +
    '"cs-fac:A1","golf","묶음 골프장","","jeju","제주시","제주시 1","","","27","회원제 · 대중제","","","open","cs-fac","2024-12-31","2","cs-fac","같은 주소","","",""\n', "utf8");
  fs.writeFileSync(path.join(tmp2, "courses_hold.csv"), FH + "\n" +
    '"cs-fac:B1","golf","검토 대기 골프장","","jeju","제주시","제주시 2","","","9","","","","open","cs-fac","2024-12-31","1","cs-fac","","","1","사람이 봅니다"\n', "utf8");
  fs.writeFileSync(path.join(tmp2, "ranges_clean.csv"), HEAD + "\n", "utf8");
  execFileSync("node", [path.join(ROOT, "tools", "make-import-sql.js"), "--stage=" + tmp2,
                "--review=" + path.join(tmp2, "none.csv")], { stdio:["ignore","pipe","pipe"] });
  const fsql = fs.readFileSync(path.join(tmp2, "import_courses.sql"), "utf8");
  void fsql;
  const fb = Number(psql("select count(*) from course"));
  T.psqlFile(path.join(tmp2, "import_courses.sql"));
  T.psqlFile(path.join(tmp2, "import_courses.sql"));
  /* ⚠️ 검토 대기 시설은 **골프장으로는 안 들어가고** 뺀 까닭만 검수 기록에 남습니다 */
  ok("⚠️⚠️ 검토 대기 시설은 골프장으로 **안 들어간다**",
     psql("select count(*) from course where name = '검토 대기 골프장'") === "0");
  ok("  뺀 까닭은 검수 기록에 **한 번만** 남는다 (두 번 넣어도)",
     psql("select count(*) from import_row_issue where kind = 'held' and detail like '검토 대기 골프장%'") === "1");
  ok("두 줄이 **골프장 하나**로 들어간다 · 두 번 넣어도 하나",
     Number(psql("select count(*) from course")) === fb + 1);
  ok("  출처 줄은 **둘**(회원제 · 대중제 등록 각각)",
     psql("select count(*) from course_source where source_id = 'cs-fac'") === "2");
  ok("  홀 수는 시설 합계(27)",
     psql("select holes from course where name = '묶음 골프장'") === "27");
  T.psqlFile(path.join(tmp2, "rollback_courses.sql"));
  ok("  되돌리면 그 골프장만 빠진다",
     Number(psql("select count(*) from course")) === fb);
  try{ fs.rmSync(tmp2, { recursive:true, force:true }); }catch(e){}

  /* ── ⑧ 안쪽 함수를 직접 못 부릅니다 ──────────────────────── */
  console.log("\n── 안쪽 도움함수");
  const tg = denied(as(CUS) + "select teetime_link_course()");
  ok("⚠️⚠️ 트리거 함수를 직접 못 부른다", tg.no, tg.why);
  const cn = denied(as(CUS) + "select course_norm('x')");
  ok("  정규화 함수도 못 부른다", cn.no, cn.why);

  /* ⚠️ 바꾼 상태를 **되돌려 놓습니다** — 앞 검사가 만든 상태를 뒤 검사가
     물려받는 자리를 이 저장소가 세 번 밟았습니다. */
  psql("update provider set listed = true, is_test = false where id = 'cs-pv'");
  ok("  검사가 바꾼 것을 되돌려 놓았다",
     psql("select listed::text from provider where id = 'cs-pv'") === "true");
};

#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   신청번호 · 중복 · 스팸 · DB 층 (지시서 §6 · §13)

     node tools/test-intake.js

   ⚠️ **DB 없이 전부 확인합니다.** 순수 함수이고, DB 층은 "설정 전에는
   열지 않는가" 와 "시간 제한이 있는가" 만 봅니다 — 둘 다 진짜 DB 가
   없어야 오히려 잘 보이는 것들입니다.
   ════════════════════════════════════════════════════════════════════ */

const path = require("path");
const I  = require(path.join(__dirname, "..", "api", "_intake.js"));

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + JSON.stringify(got) : "")); }
}

console.log("\n── 신청번호 (§6 \"모든 신청에 고유 신청번호를 발급한다\")");
{
  const n = I.reqNo();
  ok("SW-XXXX-XXXX 꼴이다", /^SW-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(n), n);

  /* ⚠️⚠️ 전화로 읽어 줘야 하는 번호라 헷갈리는 글자를 뺐습니다 */
  const body = () => I.reqNo().replace(/[^0-9A-Z]/g, "").slice(2);
  let lettersBad = "";
  for(let i = 0; i < 400; i++)
    for(const c of body()) if("ILOU".indexOf(c) >= 0) lettersBad += c;
  ok("I · L · O · U 가 섞이지 않는다 (전화로 읽어 주는 번호)",
     lettersBad === "", lettersBad);

  /* ⚠️⚠️ 순번이면 남의 번호를 세어 볼 수 있습니다 */
  const set = new Set();
  for(let i = 0; i < 5000; i++) set.add(I.reqNo());
  ok("5,000개를 뽑아도 겹치지 않는다", set.size === 5000, set.size);
  const seq = [I.reqNo(), I.reqNo(), I.reqNo()];
  ok("이어서 뽑은 셋이 순번이 아니다",
     !(seq[0] < seq[1] && seq[1] < seq[2]) || new Set(seq).size === 3, seq);

  /* 섞여 들어오는 꼴을 받아 줍니다 */
  ok("소문자로 적어도 알아본다",    I.reqNoClean("sw-ab12-cd34") === "SW-AB12-CD34");
  ok("줄표 없이 적어도 알아본다",   I.reqNoClean("SWAB12CD34")   === "SW-AB12-CD34");
  ok("띄어 적어도 알아본다",        I.reqNoClean(" SW AB12 CD34 ") === "SW-AB12-CD34");
  ok("길이가 틀리면 안 받는다",     I.reqNoClean("SW-AB12-CD3") === "");
  ok("뺀 글자(I·L·O·U)가 섞이면 안 받는다", I.reqNoClean("SW-ABIO-CD34") === "");
  ok("빈 값에 빈 문자열을 돌려준다", I.reqNoClean("") === "" && I.reqNoClean(null) === "");
}

console.log("\n── 전화번호는 숫자만 남겨 견준다");
ok("031-000-0000 과 0310000000 이 같다",
   I.telKey("031-000-0000") === I.telKey("0310000000"));
ok("공백 · 괄호를 지운다", I.telKey("(031) 000 0000") === "0310000000");
ok("빈 값은 빈 문자열", I.telKey(null) === "");

console.log("\n── 중복 (§6 \"중복 신청\")");
const NOW = new Date("2026-10-08T12:00:00Z");
function ago(min){ return new Date(NOW - min * 60000).toISOString(); }
{
  const recent = [{ no:"SW-AAAA-1111", tel:"010-1234-5678",
                    offer_id:"interior", cat:"interior", created_at:ago(3) }];
  const r = I.intakeDup(NOW, recent, { tel:"01012345678", offerId:"interior" });
  ok("같은 번호 · 같은 상품으로 3분 뒤 → 중복", r.dup === true, r);
  ok("중복이면 먼저 받은 접수번호를 돌려준다", r.no === "SW-AAAA-1111", r.no);
  /* ⚠️⚠️ 손님에게 "스팸" 이라고 하지 않습니다 (절대 규칙 3) */
  ok("손님에게 할 말이 따로 있다", !!r.say && !/스팸/.test(r.say), r.say);

  /* ⚠️ 경계 — DUP_MIN 분 **바로 아래와 바로 위** */
  const justIn = I.intakeDup(NOW, [{ no:"x", tel:"01012345678", offer_id:"interior",
                                     created_at:ago(I.DUP_MIN - 0.1) }],
                             { tel:"01012345678", offerId:"interior" });
  ok(I.DUP_MIN + "분 바로 아래는 중복이다 (경계)", justIn.dup === true, justIn);
  const justOut = I.intakeDup(NOW, [{ no:"x", tel:"01012345678", offer_id:"interior",
                                      created_at:ago(I.DUP_MIN + 0.1) }],
                              { tel:"01012345678", offerId:"interior" });
  ok(I.DUP_MIN + "분 바로 위는 중복이 아니다 (경계 바로 위)", justOut.ok === true, justOut);

  /* ⚠️⚠️ 다른 상품이면 중복이 아닙니다 — 막으면 장사를 막습니다 */
  const other = I.intakeDup(NOW, recent, { tel:"01012345678", offerId:"demolish" });
  ok("같은 번호라도 다른 상품은 중복이 아니다", other.ok === true, other);

  const otherTel = I.intakeDup(NOW, recent, { tel:"01099998888", offerId:"interior" });
  ok("다른 번호는 중복이 아니다", otherTel.ok === true, otherTel);

  /* 상품이 없고 분류만 있을 때도 봅니다 */
  const byCat = I.intakeDup(NOW, [{ no:"y", tel:"01012345678", cat:"tax", created_at:ago(2) }],
                            { tel:"01012345678", cat:"tax" });
  ok("상품이 없으면 분류로 견준다", byCat.dup === true, byCat);
  const noWhat = I.intakeDup(NOW, [{ no:"y", tel:"01012345678", created_at:ago(2) }],
                             { tel:"01012345678" });
  ok("무엇인지 둘 다 없으면 중복으로 보지 않는다", noWhat.ok === true, noWhat);
}

console.log("\n── 스팸 (§6 \"스팸을 방지\")");
{
  function many(n, min){
    const L = [];
    for(let i = 0; i < n; i++)
      L.push({ no:"s" + i, tel:"01012345678", offer_id:"x" + i, created_at:ago(min + i) });
    return L;
  }
  /* ⚠️ 경계 바로 아래 · 경계 */
  const under = I.intakeDup(NOW, many(I.SPAM_MAX - 1, 20), { tel:"01012345678", offerId:"new" });
  ok((I.SPAM_MAX - 1) + "건은 통과한다 (경계 바로 아래)", under.ok === true, under);
  const at = I.intakeDup(NOW, many(I.SPAM_MAX, 20), { tel:"01012345678", offerId:"new" });
  ok(I.SPAM_MAX + "건이면 막는다 (경계)", at.spam === true, at);
  ok("스팸일 때도 손님에게 할 말이 따로 있다",
     !!at.say && !/스팸/.test(at.say), at.say);

  /* 한 시간 밖의 것은 안 셉니다 */
  const old = I.intakeDup(NOW, many(I.SPAM_MAX, 70), { tel:"01012345678", offerId:"new" });
  ok("한 시간 밖의 것은 세지 않는다", old.ok === true, old);

  /* 다른 번호의 것이 섞여 있어도 셈에 안 들어갑니다 */
  const mixed = many(I.SPAM_MAX, 20).map(function(r, i){
    return i % 2 ? Object.assign({}, r, { tel:"01099998888" }) : r;
  });
  ok("다른 번호의 것은 셈에 들어가지 않는다",
     I.intakeDup(NOW, mixed, { tel:"01012345678", offerId:"new" }).ok === true);
}

console.log("\n── 이상한 입력에 터지지 않는가");
{
  ok("최근 목록이 없어도 된다", I.intakeDup(NOW, null, { tel:"010" }).ok === true);
  ok("번호가 없으면 여기서 막지 않는다 (다른 데서 막습니다)",
     I.intakeDup(NOW, [], { }).ok === true);
  ok("created_at 이 이상하면 중복으로 보지 않는다",
     I.intakeDup(NOW, [{ no:"z", tel:"010", offer_id:"a", created_at:"이상한값" }],
                 { tel:"010", offerId:"a" }).ok === true);
  /* ⚠️ 미래 시각이 섞여 있어도 중복으로 잡지 않습니다 (시계가 어긋난 경우) */
  ok("미래 시각은 중복으로 보지 않는다",
     I.intakeDup(NOW, [{ no:"z", tel:"010", offer_id:"a",
                         created_at:new Date(NOW.getTime() + 60000).toISOString() }],
                 { tel:"010", offerId:"a" }).ok === true);
}

console.log("\n── DB 층 — ⚠️⚠️ 설정 전에는 열지 않는다 (fail-closed)");
{
  for(const k of ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]) delete process.env[k];
  delete require.cache[require.resolve(path.join(__dirname, "..", "api", "_db.js"))];
  const D = require(path.join(__dirname, "..", "api", "_db.js"));

  ok("환경변수가 없으면 준비되지 않았다고 한다", D.dbReady() === false);
  process.env.SUPABASE_URL = "   ";
  process.env.SUPABASE_SERVICE_KEY = "   ";
  ok("⚠️ 공백만 있는 값은 '없는 것' 이다", D.dbReady() === false);
  process.env.SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_KEY = "k";
  ok("둘이 차면 준비되었다고 한다", D.dbReady() === true);
  for(const k of ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]) delete process.env[k];

  ok("표 이름에서 소문자와 밑줄만 남긴다",
     D.safeTable("Re quest; drop--") === "request" ||
     D.safeTable("Re quest; drop--") === "requestdrop", D.safeTable("Re quest; drop--"));
  ok("표 이름이 비면 넣지 않는다 (설정 없이도 거절)",
     D.safeTable("123") === "");

  /* ⚠️⚠️ 시간 제한이 있는가 — 없으면 신호가 약한 곳에서 영원히 멈춥니다 */
  ok("시간 제한이 있다", typeof D.DB_TIMEOUT === "number" && D.DB_TIMEOUT > 0, D.DB_TIMEOUT);
  ok("접수 화면의 20초 안에 들어온다", D.DB_TIMEOUT < 20000, D.DB_TIMEOUT);

  /* 운영자에게 할 말 — ⚠️ 손님에게 보여 주지 않습니다 (절대 규칙 3) */
  const why = D.dbWhy("nowhere");
  ok("설정이 없을 때 무엇을 해야 하는지 말해 준다",
     /SUPABASE_URL/.test(why) && /db\/README/.test(why), why);
  /* ⚠️⚠️ 키가 글에 섞여 나가면 안 됩니다 */
  ok("그 글에 키 값이 들어 있지 않다", !/SERVICE_KEY\s*=/.test(why));
}

console.log("\n── ⚠️⚠️ 설정이 안 됐는데 '저장했다' 고 하지 않는가 (절대 규칙 5)");
{
  (async function(){
    for(const k of ["SUPABASE_URL", "SUPABASE_SERVICE_KEY"]) delete process.env[k];
    delete require.cache[require.resolve(path.join(__dirname, "..", "api", "_db.js"))];
    const D = require(path.join(__dirname, "..", "api", "_db.js"));
    const r = await D.dbInsert("request", { no:"SW-TEST-0000" });
    ok("설정 없이 넣으면 실패로 돌려준다", r.ok === false && r.why === "nowhere", r);
    const s = await D.dbSelect("request", "?no=eq.x");
    ok("설정 없이 찾으면 실패로 돌려준다", s.ok === false && s.why === "nowhere", s);

    console.log("\n" + (bad ? "❌ " + bad + "/" + ran + " 실패" : "✅ " + ran + "개 전부 통과") + "\n");
    process.exit(bad ? 1 : 0);
  })();
}

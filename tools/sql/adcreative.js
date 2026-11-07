/* ════════════════════════════════════════════════════════════════════
   광고 소재 · 클릭 주소 · 청구 · 수납 · 환불 · 노출 · 클릭 (0064)

   ⚠️⚠️⚠️ **왜 이 검사가 있는가 — 2026-11-07 까지 `ad_run` 에 그림을
   담는 칸이 한 줄도 없었습니다.** 0026 이 표를 세우고 0036 이 문을
   세우고 0055 가 보기를 좁혔는데, 담긴 것은 업체 · 자리 · 기간 · 금액
   뿐이라 **배너 광고를 팔 수가 없었습니다** (손님 화면은 상호 글자만
   띄웠습니다).

   ⚠️⚠️⚠️ **그리고 0062 가 자리 셋을 더하면서 `save_ad` 를 안 고쳤습니다.**
   0036 의 그 문은 자리 이름 넷을 **글자로 박아** 가리고 있었고, enum 에
   있는 `home_sponsor_a` · `home_sponsor_b` · `home_bottom` 은 **문이
   거절**했습니다 — /admin 의 고르개에는 보이는데 누르면 거절되는 칸
   (절대 규칙 5). 아래 ① 이 그것을 셉니다.

   ⚠️⚠️ **여기서 재는 것 일곱** —
     ① 자리 **일곱 전부**가 문으로 들어가는가 (enum 에서 읽는가)
     ② 클릭 주소 — `javascript:` · `//` · `http://` · `@` 가 막히고
        `https://` 와 우리 주소(`/`)는 들어가는가. ⚠️ **문과 표를 갈라서**
        (화면에서만 가리면 꾸러미를 고쳐 지나갑니다)
     ③ 소재 경로를 **문이 짓는가** · 형식 · 크기 · 관리자만
     ④ 비로그인이 `ad_run` 표를 **못 읽는가** (0064 가 거둔 자리 —
        전에는 `price` · `note` 가 그대로 읽혔습니다) · 보기는 읽히는가
     ⑤ 공개 보기에 **계약액 칸이 아예 없는가**
     ⑥ 청구 · 수납 · 환불 — 관리자만 · 까닭 필수 · **환불 > 수납 거절** ·
        실매출을 **보기가 셈하는가**
     ⑦ 노출 · 클릭 — 비로그인도 세는가 · **안 돌고 있는 광고는 안 세는가** ·
        **사람 정보를 한 글자도 안 담는가**
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0064 광고 소재 — 씨앗");
  /* ⚠️⚠️ 다른 검사와 id 가 부딪히면 **조용히 물려받습니다** (0051 에서
     `pp-a` 가 price.js 와 겹쳐 엉뚱한 자리에서 떨어졌습니다). */
  const taken = psql("select coalesce(string_agg(id, ','), '') from provider " +
    "where id in ('adc-a','adc-b')");
  ok("⚠️⚠️ 쓸 업체 id 가 **비어 있다** (다른 검사와 안 부딪힙니다)",
     taken === "", "이미 있습니다 — " + taken);

  const ADM = psql("insert into auth.users (email) values ('adc-adm@x.test') returning id");
  const STF = psql("insert into auth.users (email) values ('adc-stf@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('adc-cus@x.test') returning id");

  psql("insert into provider (id, name, listed, state, is_test) values " +
       "('adc-a','소재골프장', true, 'approved', false)," +
       "('adc-b','정지골프장', true, 'approved', false) on conflict (id) do nothing");
  psql("insert into account (id, role, name) values " +
       "('" + ADM + "','admin','관리자')," +
       "('" + STF + "','staff','직원')," +
       "('" + CUS + "','customer','손님') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const back = "reset role; select become(null);";
  const J = o => "'" + JSON.stringify(o).replace(/'/g, "''") + "'::jsonb";
  const saveAd = o => as(ADM) + "select save_ad(" + J(o) + ")" + "; " + back;
  const base = { provider:"adc-a", starts_on:"2026-01-01", ends_on:"2036-01-01",
                 price:0, why:"검사" };

  /* ── ① 자리 일곱 전부가 들어가는가 ─────────────────────────────── */
  console.log("\n── ① 광고 자리 — enum 에 있는 것은 문도 받는가");
  const places = psql("select string_agg(x::text, ',' order by x::text) " +
                      "from unnest(enum_range(null::ad_place)) x").split(",");
  ok("⚠️ 잴 자리가 0개가 아니다 (enum 을 읽기는 했는가)", places.length > 0,
     places.length);
  let okPlace = 0;
  places.forEach(function(pl){
    const o = Object.assign({}, base, { place: pl });
    if(pl === "cat_top") o.cat_key = "lesson";
    if(pl === "region")  o.region  = "seoul";
    if(allowed(saveAd(o)).yes) okPlace++;
  });
  ok("⚠️⚠️⚠️ **자리 전부가 문을 지난다** (0062 의 셋이 거절당하던 자리)",
     okPlace === places.length, okPlace + "/" + places.length);
  ok("없는 자리 이름은 사람 말로 거절한다",
     denied(saveAd(Object.assign({}, base, { place:"nosuch" }))).why
       .indexOf("그런 광고 자리가 없습니다") >= 0);

  const AD = psql("select id::text from ad_run where provider_id='adc-a' " +
                  "and place='main_hero' order by at desc limit 1");
  ok("씨앗: 소재를 달 광고가 하나 있다", /^[0-9a-f-]{36}$/.test(AD), AD);

  /* ── ② 클릭 주소 ───────────────────────────────────────────────── */
  console.log("\n── ② 클릭 주소 — 문과 표를 갈라서");
  const url = u => saveAd(Object.assign({}, base, { place:"main_band", click_url:u }));
  ok("`javascript:` 는 문이 막는다",      denied(url("javascript:alert(1)")).no);
  ok("`//evil.test` 는 문이 막는다 (열린 넘겨주기)", denied(url("//evil.test/x")).no);
  ok("`http://` 는 문이 막는다",          denied(url("http://x.test/")).no);
  ok("`@` 가 든 주소는 문이 막는다",
     denied(url("https://good.test@evil.test/")).no);
  ok("`https://` 는 들어간다 (정상 길이 막히지 않았다)",
     allowed(url("https://golf.example.com/event")).yes);
  ok("우리 주소(`/cat/lesson`)도 들어간다",
     allowed(url("/cat/lesson?rg=seoul")).yes);
  /* ⚠️⚠️ **표로도 눌러 봅니다** — 문에서만 가리면 꾸러미를 고쳐
     지나갈 수 있고, 그때 막는 것은 표의 check 입니다. 자물쇠가 둘이고
     **거절하는 말이 다릅니다**(문은 사람 말 · 표는 제약 이름). */
  const direct = u => "update ad_run set click_url = '" + u + "' where id = '" + AD + "'";
  ok("⚠️⚠️ 표에 바로 넣어도 `javascript:` 는 **check 가** 막는다",
     denied(direct("javascript:alert(1)")).no);
  ok("⚠️ 두 자물쇠가 **다른 말로** 거절한다",
     denied(direct("javascript:alert(1)")).why.indexOf("ad_run_click_ck") >= 0,
     denied(direct("javascript:alert(1)")).why);

  /* ── ③ 소재 경로 ───────────────────────────────────────────────── */
  console.log("\n── ③ 소재 — 경로를 문이 짓는가");
  const claim = (u, o) => as(u) + "select path from claim_ad_image(" + J(o) + ")" + "; " + back;
  const good = { ad:AD, kind:"pc", mime:"image/webp", bytes:120000 };
  const got = allowed(claim(ADM, good));
  ok("관리자가 PC 소재 자리를 받는다", got.yes, got.why);
  ok("⚠️⚠️ 경로를 **문이 짓는다** (`ad/<광고>/pc/…`)",
     /^ad\/[0-9a-f-]{36}\/pc\/[0-9]{14}-[0-9a-f]{8}\.webp$/.test(String(got.out || "").trim()),
     got.out);
  ok("그 경로가 표에 적혔다",
     psql("select coalesce(img_pc,'') from ad_run where id='" + AD + "'") ===
       String(got.out || "").trim());
  ok("PDF 는 광고 소재가 아니다",
     denied(claim(ADM, Object.assign({}, good, { mime:"application/pdf" }))).no);
  ok("2MB 를 넘으면 거절한다",
     denied(claim(ADM, Object.assign({}, good, { bytes:3000000 }))).no);
  ok("크기를 안 적으면 거절한다",
     denied(claim(ADM, { ad:AD, kind:"pc", mime:"image/png" })).no);
  ok("PC · 모바일 말고는 거절한다",
     denied(claim(ADM, Object.assign({}, good, { kind:"tv" }))).no);
  ok("⚠️ 없는 광고에는 못 붙인다",
     denied(claim(ADM, Object.assign({}, good,
       { ad:"00000000-0000-0000-0000-000000000000" }))).no);
  ok("⚠️⚠️ **직원도 못 올린다** (관리자만)", denied(claim(STF, good)).no);
  ok("⚠️⚠️ 손님은 못 올린다", denied(claim(CUS, good)).no);
  /* ⚠️ 표의 check 를 따로 — 문을 지나지 않고 꽂으면 꼴이 막는가 */
  ok("⚠️⚠️ 표에 **남의 광고 경로**를 꽂으면 check 가 막는다",
     denied("update ad_run set img_pc = 'ad/zzz/pc/x.png' where id='" + AD + "'").no);
  ok("모바일 경로를 PC 칸에 꽂으면 막는다",
     denied("update ad_run set img_pc = 'ad/" + AD + "/mo/x.png' where id='" + AD + "'").no);

  console.log("\n── ③-2 소재 빼기");
  const drop = (u, o) => as(u) + "select drop_ad_image(" + J(o) + ")" + "; " + back;
  ok("⚠️ **없는 자리를 빼면 거절한다** (조용히 0줄로 끝내면 기록이 거짓입니다)",
     denied(drop(ADM, { ad:AD, kind:"mo" })).why.indexOf("올린 소재가 없습니다") >= 0,
     denied(drop(ADM, { ad:AD, kind:"mo" })).why);
  ok("직원은 못 뺀다", denied(drop(STF, { ad:AD, kind:"pc" })).no);
  ok("관리자가 뺀다", allowed(drop(ADM, { ad:AD, kind:"pc" })).yes);
  ok("칸이 비었다",
     psql("select coalesce(img_pc,'(비었음)') from ad_run where id='" + AD + "'") === "(비었음)");
  ok("뺀 일이 감사 기록에 남는다",
     Number(psql("select count(*)::text from audit_log where obj='ad_run' " +
       "and why='광고 소재 빼기' and obj_id='" + AD + "'")) >= 1);

  /* ── ④ 비로그인이 표를 못 읽는가 ───────────────────────────────── */
  console.log("\n── ④ 비로그인 — 표는 막히고 보기는 읽히는가");
  psql("update ad_run set state='live' where id='" + AD + "'");
  /* ⚠️⚠️⚠️ **0064 가 거둔 자리입니다.** 전에는 `grant select on ad_run
     to anon` + `ad_public` 정책이라, 비로그인 손님이
     `?select=price,note` 로 **광고 단가와 운영자 메모를 그대로** 읽을 수
     있었습니다 (RLS 는 줄은 막아도 **칸은 못 막습니다**).
     ⚠️ 표 GRANT 가 없으면 **0줄이 아니라 질의가 통째로 거절**됩니다 —
     0050 · 0052 에서 밟은 그 자리이고, 그것이 맞는 동작입니다. */
  const anonTab = denied(anon + "select price from ad_run; " + back);
  ok("⚠️⚠️⚠️ 비로그인은 `ad_run` 표를 **아예 못 읽는다**", anonTab.no, anonTab.why);
  ok("⚠️ 거절하는 말이 권한 문제라고 말한다",
     anonTab.why.indexOf("permission denied") >= 0, anonTab.why);
  const anonView = allowed(anon + "select count(*)::text from v_ad_live; " + back);
  ok("보기는 비로그인도 읽는다 (광고는 비로그인 손님이 더 많이 봅니다)",
     anonView.yes, anonView.why);

  /* ── ⑤ 공개 보기에 계약액이 없는가 ─────────────────────────────── */
  console.log("\n── ⑤ 공개 보기 — 돈 칸이 아예 없는가");
  const cols = psql("select coalesce(string_agg(column_name, ',' order by column_name), '') " +
    "from information_schema.columns where table_name='v_ad_live'");
  ok("⚠️⚠️ `price` 칸이 **아예 없다**", cols.split(",").indexOf("price") < 0, cols);
  ok("⚠️ `note`(운영자 메모) 칸도 없다", cols.split(",").indexOf("note") < 0, cols);
  ["img_pc","img_mo","img_alt","click_url","advertiser","label"].forEach(function(c){
    ok("보기에 `" + c + "` 가 **실제로 있다** (없으면 손님에게 영원히 안 보입니다)",
       cols.split(",").indexOf(c) >= 0, cols);
  });

  /* ── ⑥ 청구 · 수납 · 환불 ──────────────────────────────────────── */
  console.log("\n── ⑥ 청구 · 수납 · 환불 — 계약액과 실매출을 가르는가");
  const bill = (u, o) => as(u) + "select save_ad_bill(" + J(o) + ")" + "; " + back;
  ok("까닭 없이는 안 받는다",
     denied(bill(ADM, { ad:AD, kind:"bill", amount:100000 })).no);
  ok("⚠️⚠️ **직원도 못 적는다** (계약을 따는 사람과 청구서를 만드는 사람은 다릅니다)",
     denied(bill(STF, { ad:AD, kind:"bill", amount:100000, why:"검사" })).no);
  ok("0원짜리는 거절한다",
     denied(bill(ADM, { ad:AD, kind:"pay", amount:0, why:"검사" })).no);
  ok("앞날 날짜는 거절한다",
     denied(bill(ADM, { ad:AD, kind:"pay", amount:1000, why:"검사",
                        on_day:"2099-01-01" })).no);
  ok("관리자가 청구 100만원을 적는다",
     allowed(bill(ADM, { ad:AD, kind:"bill", amount:1000000, why:"검사" })).yes);
  ok("관리자가 수납 60만원을 적는다",
     allowed(bill(ADM, { ad:AD, kind:"pay", amount:600000, why:"검사" })).yes);
  ok("⚠️⚠️ **환불이 수납보다 많으면 거절한다**",
     denied(bill(ADM, { ad:AD, kind:"refund", amount:700000, why:"검사" })).no);
  ok("수납 안쪽의 환불은 들어간다",
     allowed(bill(ADM, { ad:AD, kind:"refund", amount:100000, why:"검사" })).yes);

  /* ⚠️ 기대값을 **손으로** 적습니다 — 코드와 같은 식으로 적으면
     식을 바꿔도 답이 같아 아무것도 안 잡습니다.
     청구 1,000,000 · 수납 600,000 · 환불 100,000 → 실매출 **500,000** */
  const row = psql(as(ADM) + "select billed || '|' || paid || '|' || refunded || " +
    "'|' || net || '|' || price from v_ad_board where id='" + AD + "'; " + back);
  ok("⚠️⚠️ 보기가 **계약액과 실매출을 갈라서** 낸다 (실매출 50만원)",
     row === "1000000|600000|100000|500000|0", row);
  ok("⚠️⚠️⚠️ 비로그인은 `v_ad_board` 에서 **아무것도 못 본다**",
     denied(anon + "select count(*) from v_ad_board; " + back).no ||
     psql(anon + "select count(*)::text from v_ad_board; " + back) === "0");
  ok("⚠️ 손님은 **0줄**이다 (보기의 where 절이 자물쇠입니다)",
     psql(as(CUS) + "select count(*)::text from v_ad_board; " + back) === "0");
  ok("직원은 본다 (읽기는 직원도 합니다 — 적는 것만 관리자입니다)",
     Number(psql(as(STF) + "select count(*)::text from v_ad_board; " + back)) >= 1);

  console.log("\n── ⑥-2 잘못 적은 줄을 빼기");
  const BID = psql("select id::text from ad_bill where ad_id='" + AD +
                   "' and kind='refund' limit 1");
  const dropBill = (u, o) => as(u) + "select drop_ad_bill(" + J(o) + ")" + "; " + back;
  ok("까닭 없이는 못 뺀다", denied(dropBill(ADM, { id:BID })).no);
  ok("직원은 못 뺀다", denied(dropBill(STF, { id:BID, why:"검사" })).no);
  ok("없는 줄을 빼면 거절한다",
     denied(dropBill(ADM, { id:"00000000-0000-0000-0000-000000000000", why:"검사" })).no);
  ok("관리자가 뺀다", allowed(dropBill(ADM, { id:BID, why:"검사" })).yes);
  ok("⚠️ 실매출이 **60만원으로 되돌아간다** (합계를 칸에 저장하지 않습니다)",
     psql(as(ADM) + "select net::text from v_ad_board where id='" + AD + "'; " + back)
       === "600000");
  ok("뺀 일이 감사 기록에 남는다",
     Number(psql("select count(*)::text from audit_log where obj='ad_bill' " +
       "and to_state='removed' and obj_id='" + BID + "'")) === 1);
  ok("⚠️⚠️ 업체는 `ad_bill` 을 **못 읽는다** (계약서가 말할 것입니다)",
     psql(as(CUS) + "select count(*)::text from ad_bill; " + back) === "0");

  /* ── ⑦ 노출 · 클릭 ─────────────────────────────────────────────── */
  console.log("\n── ⑦ 노출 · 클릭 — 비로그인도 세고, 안 도는 광고는 안 세는가");
  const bump = (pre, o) => pre + "select bump_ad(" + J(o) + ")" + "; " + back;
  const seen = () => psql("select coalesce((select views || '|' || clicks " +
    "from ad_stat where ad_id='" + AD + "' and on_day = kst_today()), '0|0')");
  /* ⚠️⚠️ **갯수를 박지 않습니다** — 전을 재고 늘어난 것만 봅니다
     (`allowed()` 도 그 문을 정말 부릅니다 — 그것까지 세야 합니다). */
  const was = seen();
  ok("⚠️⚠️ **비로그인도 셀 수 있다** (광고를 보는 분의 대부분이 그렇습니다)",
     allowed(bump(anon, { ad:AD, kind:"view" })).yes);
  psql(bump(anon, { ad:AD, kind:"view" }));
  psql(bump(anon, { ad:AD, kind:"click" }));
  const now2 = seen();
  const dv = Number(now2.split("|")[0]) - Number(was.split("|")[0]);
  const dc = Number(now2.split("|")[1]) - Number(was.split("|")[1]);
  ok("노출은 **2 늘고** 클릭은 **1 늘었다**", dv === 2 && dc === 1,
     was + " → " + now2);
  ok("⚠️ 하루에 **한 줄**만 쌓인다 (날짜마다 한 줄입니다)",
     psql("select count(*)::text from ad_stat where ad_id='" + AD + "'") === "1");

  const DRAFT = psql("select id::text from ad_run where provider_id='adc-a' " +
                     "and state='draft' limit 1");
  psql(bump(anon, { ad:DRAFT, kind:"view" }));
  ok("⚠️⚠️ **안 돌고 있는 광고(준비)는 안 센다**",
     psql("select count(*)::text from ad_stat where ad_id='" + DRAFT + "'") === "0");
  const b4 = seen();
  ok("갈래가 아닌 것은 조용히 끝낸다 (손님에게 할 말이 없습니다)",
     allowed(bump(anon, { ad:AD, kind:"nosuch" })).yes && seen() === b4, b4);
  ok("없는 광고 id 로 불러도 터지지 않는다",
     allowed(bump(anon, { ad:"zzz", kind:"view" })).yes);

  /* ⚠️⚠️⚠️ **사람 정보를 한 글자도 안 담습니다.** 담기 시작하면 그날부터
     처리 항목이 하나 늘어 개인정보 처리방침을 같이 고쳐야 합니다. */
  const sc = psql("select coalesce(string_agg(column_name, ',' order by column_name), '') " +
    "from information_schema.columns where table_name='ad_stat'");
  ok("⚠️⚠️⚠️ `ad_stat` 의 칸은 **광고 · 날짜 · 수 넷뿐**이다",
     sc === "ad_id,clicks,on_day,views", sc);
  ok("⚠️ 비로그인은 `ad_stat` 표를 **못 읽는다** (세는 것만 합니다)",
     denied(anon + "select count(*) from ad_stat; " + back).no);
  ok("⚠️⚠️ **아무도 표에 바로 못 씁니다** (문이 +1 씩만 올립니다)",
     denied(as(ADM) + "update ad_stat set views = 99999 where ad_id='" +
            AD + "'; " + back).no);

  /* ⚠️ 정지된 업체의 광고는 그 순간 빠집니다 — 조건은 `v_provider_card`
     와 같은 셋입니다 (0055). 읽을 때 다시 봅니다. */
  console.log("\n── ⑦-2 업체가 정지되면 그 순간");
  /* ⚠️⚠️ **문으로 바꿉니다.** 표를 바로 고치면 0038 의
     `provider_state_guard()` 가 막습니다 — 그리고 그것이 맞습니다
     (문이 있는 자리는 문으로 재세요 — 이 검사가 거기서 한 번 터졌습니다). */
  psql(as(ADM) + "select set_provider_state(jsonb_build_object(" +
       "'id','adc-a','to','suspended','why','검사로 정지합니다')); " + back);
  ok("⚠️⚠️ 정지되면 공개 보기에서 **그 즉시** 빠진다",
     psql("select count(*)::text from v_ad_live where id='" + AD + "'") === "0");
  const b5 = seen();
  psql(bump(anon, { ad:AD, kind:"view" }));
  ok("⚠️⚠️ 정지된 업체의 광고는 **더 안 센다**", seen() === b5, b5);
  psql(as(ADM) + "select set_provider_state(jsonb_build_object(" +
       "'id','adc-a','to','approved','why','검사를 되돌립니다')); " + back);
  ok("⚠️ 바꾼 값을 **되돌려 놓았다** (뒤 검사가 물려받지 않게)",
     psql("select state::text from provider where id='adc-a'") === "approved");
};

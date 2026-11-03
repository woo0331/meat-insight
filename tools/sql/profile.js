/* ════════════════════════════════════════════════════════════════════
   업체가 **제 정보를 고치는** 문을 눌러 봅니다
   (0014 → 0023 → 0044 · 4차 지시서 §2-4 · §2-6 · §2-7)

   ⚠️⚠️⚠️ **이 문은 보낸 것으로 통째로 덮어씁니다.** 화면이 칸 하나를
   빠뜨리면 그 칸이 **빈 값으로 지워집니다** — 지역을 안 보내면 그
   업체가 지역 거르개에서 통째로 사라지고, 아무 에러도 안 납니다.
   그래서 그 성질을 **검사로 박아 둡니다** (다음 차수가 화면을 고칠 때
   이 줄을 보게).

   ⚠️⚠️ **업체가 못 건드리는 것**이 더 중요합니다 — 상호 · 하는 일 ·
   확인 배지 · 공개 여부. 하나라도 열리면 지어낸 신뢰가 들어옵니다
   (절대 규칙 1). 꾸러미에 실어 보내 **안 바뀌는지**까지 봅니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0044 업체 제 정보 — 씨앗");
  const PRO = psql("insert into auth.users (email) values ('pf-pro@x.test') returning id");
  const CUS = psql("insert into auth.users (email) values ('pf-cus@x.test') returning id");
  const ADM = psql("insert into auth.users (email) values ('pf-adm@x.test') returning id");

  psql("insert into provider (id, name, listed, is_test, subs, regions, state, verified) " +
       "values ('pf-a','[검사용] 프로필 업체', true, true, '{ls-solo,rg-in}', " +
       "'{seoul}', 'approved', '{}'::jsonb) on conflict (id) do nothing");
  psql("insert into account (id, role, name, provider_id) values " +
       "('" + PRO + "','provider','프로필 업체 사람','pf-a')," +
       "('" + CUS + "','customer','프로필 손님', null)," +
       "('" + ADM + "','admin','프로필 관리자', null) " +
       "on conflict (id) do update set role = excluded.role, " +
       "name = excluded.name, provider_id = excluded.provider_id");

  const as = u => "select become('" + u + "'); set role authenticated; ";
  const save = (u, o, why) => as(u) + "select save_provider_self('" +
    JSON.stringify(o).replace(/'/g, "''") + "'::jsonb" +
    (why ? ", '" + why + "'" : "") + ")";

  console.log("\n── 누가 고칠 수 있나");
  const byCus = denied(save(CUS, { intro:"손님이 고쳐 봅니다" }));
  ok("손님은 못 고친다", byCus.no, byCus.why);
  /* ⚠️ 운영자도 이 문으로는 못 고칩니다 — 운영자 길은 save_provider 입니다
     (누가 고쳤는지가 기록에서 갈려야 합니다). */
  const byAdm = denied(save(ADM, { intro:"운영자가 이 문으로 고쳐 봅니다" }));
  ok("⚠️ 운영자도 **이 문으로는** 못 고친다 (운영자 길은 따로입니다)", byAdm.no, byAdm.why);

  console.log("\n── 업체가 제 정보를 고칩니다");
  const full = { intro:"레슨과 타석을 함께 합니다", regions:["seoul","gyeonggi"],
                 gu:["관악구"], consultHours:"평일 10~19시", since:2019,
                 brands:["타이틀리스트"], scale:"mid",
                 contactWays:["phone","visit"] };
  ok("고친다", allowed(save(PRO, full, "첫 등록")).yes);
  ok("  소개가 들어간다",
     psql("select intro from provider where id='pf-a'") === "레슨과 타석을 함께 합니다");
  ok("  지역이 **키로** 들어간다",
     psql("select array_to_string(regions, ',') from provider where id='pf-a'") === "seoul,gyeonggi");
  ok("  상담 시간 · 개업 · 규모가 들어간다",
     psql("select consult_hours || '/' || since::text || '/' || scale " +
          "from provider where id='pf-a'") === "평일 10~19시/2019/mid");
  /* ⚠️⚠️ 0044 가 더한 것 */
  ok("⚠️ 상담 **방식**이 들어간다 (0044)",
     psql("select array_to_string(contact_ways, ',') from provider where id='pf-a'") === "phone,visit");
  ok("  감사 기록이 남는다",
     Number(psql("select count(*)::text from audit_log where obj='provider' " +
                 "and to_state='self-updated'")) >= 1);

  console.log("\n── ⚠️ 상담 방식은 **정해진 넷**만");
  const badWay = denied(save(PRO, Object.assign({}, full, { contactWays:["카톡"] })));
  ok("모르는 방식은 막힌다 (조용히 버리지 않습니다)", badWay.no, badWay.why);
  ok("  그 거절이 **무엇 중에서** 고르라고 말한다",
     badWay.no && badWay.why.indexOf("전화") >= 0, badWay.why);
  ok("  그래서 값이 안 바뀐다",
     psql("select array_to_string(contact_ways, ',') from provider where id='pf-a'") === "phone,visit");
  ok("빈 배열은 된다 (아직 안 정하셨을 수 있습니다)",
     allowed(save(PRO, Object.assign({}, full, { contactWays:[] }))).yes &&
     psql("select coalesce(array_to_string(contact_ways, ','),'') " +
          "from provider where id='pf-a'") === "");
  psql(save(PRO, full));

  console.log("\n── ⚠️⚠️ 업체가 **못 건드리는 것** (실어 보내도 안 바뀝니다)");
  const sneak = Object.assign({}, full, {
    name:"내가 바꾼 상호", subs:["ft-grip","ls-solo","rg-in"],
    verified:{ brn:true, tel:true }, listed:false, state:"approved",
    id:"다른주소", is_test:false, assignable:true });
  ok("그런 꾸러미도 거절하지 않고 받는다 (모르는 칸은 그냥 버립니다)",
     allowed(save(PRO, sneak)).yes);
  ok("⚠️ 상호가 **안 바뀐다**",
     psql("select name from provider where id='pf-a'") === "[검사용] 프로필 업체");
  /* ⚠️⚠️ 하는 일을 스스로 넓히면 수거만 하는 곳이 수리 화면에 앉습니다 */
  ok("⚠️ 하는 일(subs)이 **안 바뀐다**",
     psql("select array_to_string(subs, ',') from provider where id='pf-a'") === "ls-solo,rg-in");
  ok("⚠️ 확인 배지가 **안 켜진다** (지어낸 신뢰입니다)",
     psql("select verified::text from provider where id='pf-a'") === "{}");
  ok("⚠️ 공개 여부가 **안 바뀐다**",
     psql("select listed::text from provider where id='pf-a'") === "true");

  console.log("\n── ⚠️⚠️⚠️ 보낸 것으로 **덮어씁니다** (화면이 다 담아 보내야 합니다)");
  /* 이 성질을 모르고 화면을 고치면 지역이 조용히 지워집니다 —
     그래서 검사로 박아 둡니다. */
  ok("지역을 빼고 보내면 지역이 **지워진다**",
     allowed(save(PRO, { intro:"지역을 빼고 보냅니다" })).yes &&
     psql("select coalesce(array_to_string(regions, ','),'') " +
          "from provider where id='pf-a'") === "");
  ok("  그래서 화면은 **읽은 값을 전부 다시 담아** 보내야 합니다 (위 줄이 그 까닭입니다)",
     true);
  psql(save(PRO, full));

  console.log("\n── 공개 보기에 상담 방식이 실리나 (0044 가 보기를 다시 만듭니다)");
  const anon = "select become(null); set role anon; ";
  psql("select become('" + ADM + "'); update provider set is_test = false where id='pf-a'");
  ok("⚠️ `v_provider_card` 에 상담 방식 칸이 있다 (없으면 손님 화면에 영원히 안 나옵니다)",
     psql(anon + "select array_to_string(contact_ways, ',') from v_provider_card " +
          "where id='pf-a'") === "phone,visit");
  psql("select become('" + ADM + "'); update provider set is_test = true where id='pf-a'");
  ok("  검사용으로 되돌리면 보기에서 빠진다",
     psql(anon + "select count(*)::text from v_provider_card where id='pf-a'") === "0");
};

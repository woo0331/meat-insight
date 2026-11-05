/* ════════════════════════════════════════════════════════════════════
   골프 조인을 눌러 봅니다 (0046)

   ⚠️⚠️⚠️ **여기서 가장 무서운 것은 연락처입니다.** 조인은 회원끼리
   만나는 자리라 연락처가 오가야 하는데, 한 번 새면 주워 담을 수
   없습니다. 그래서 자물쇠를 **세 겹**으로 두었고 —
     ① 공개 보기(v_join_open)에 연락처 칸이 **아예 없음**
     ② 표의 칸 단위 GRANT 에서 contact 를 **뺐음**
     ③ 연락처가 오가는 보기(v_join_contact)가 **수락된 짝**만 냄
   — 셋을 **따로따로** 눌러 봅니다. 하나만 보고 "막혔다" 고 읽으면
   나머지 둘이 장식인지 알 수 없습니다 (작업 기억 — 자물쇠가 겹치면
   검사를 속입니다).

   ⚠️⚠️ **정책을 읽고 결론 내지 않습니다. 그 역할로 실제로 질의합니다.**
   `pull-providers` 가 한 번도 돌 수 없었던 그 자리입니다 — 정책은
   열려 있는데 GRANT 가 없어 permission denied 였습니다.

   ⚠️ 재는 것은 늘 **문**입니다. 표에 바로 넣고 재면 자물쇠를 통째로
   지나갑니다.
   ════════════════════════════════════════════════════════════════════ */
module.exports = function(T){
  const { ok, psql, denied, allowed } = T;

  console.log("\n── 0046 골프 조인 — 씨앗");
  const HOST = psql("insert into auth.users (email) values ('jn-host@x.test') returning id");
  const G1   = psql("insert into auth.users (email) values ('jn-g1@x.test') returning id");
  const G2   = psql("insert into auth.users (email) values ('jn-g2@x.test') returning id");
  const G3   = psql("insert into auth.users (email) values ('jn-g3@x.test') returning id");
  const NOSY = psql("insert into auth.users (email) values ('jn-nosy@x.test') returning id");
  const ADM  = psql("insert into auth.users (email) values ('jn-adm@x.test') returning id");
  psql("insert into account (id, role, name) values " +
       "('" + HOST + "','customer','여는 사람')," +
       "('" + G1   + "','customer','신청1')," +
       "('" + G2   + "','customer','신청2')," +
       "('" + G3   + "','customer','신청3')," +
       "('" + NOSY + "','customer','남')," +
       "('" + ADM  + "','admin','조인 관리자') " +
       "on conflict (id) do update set role = excluded.role, name = excluded.name");

  const as   = u => "select become('" + u + "'); set role authenticated; ";
  const anon = "select become(null); set role anon; ";
  const J    = o => JSON.stringify(o).replace(/'/g, "''");
  const nowIso = psql("select now()");

  const room = (who, extra) => as(who) + "select open_joinroom('" +
    J(Object.assign({ region:"seoul", play_at:"PLAY", need:2,
                      title:"주말 아침 같이 치실 분", body:"초보도 환영합니다",
                      contact:"010-7000-0000", agree_at:nowIso }, extra)
        ).replace(/"PLAY"/, '"' + psql("select (current_date + 7)::text") + '"') +
    "'::jsonb)";
  const ap = (who, rid, extra) => as(who) + "select apply_joinroom('" +
    J(Object.assign({ room_id:rid, contact:"010-8000-0000", msg:"같이 치고 싶습니다",
                      agree_at:nowIso }, extra)) + "'::jsonb)";
  const mv = (who, aid, st) => as(who) + "select move_joinapply('" +
    J({ id:aid, state:st }) + "'::jsonb)";

  // ── ① 자리를 열 수 있나 ────────────────────────────────────────
  console.log("\n── 자리를 엽니다");
  const r1 = allowed(room(HOST, {}));
  ok("로그인하면 자리를 열 수 있다", r1.yes && /^[0-9a-f-]{36}$/.test(r1.out), r1.out || r1.why);
  const RID = r1.out;

  const anonOpen = denied(anon + "select open_joinroom('" +
    J({ region:"seoul", play_at:"2099-01-01", need:1, contact:"010-1", agree_at:nowIso }) + "'::jsonb)");
  ok("비로그인은 못 연다", anonOpen.no, anonOpen.why);

  console.log("\n── 자물쇠마다 다른 말로 거절합니다");
  const says = {};
  /* ⚠️⚠️ **재려는 자물쇠 하나만 틀리게 하고 나머지는 전부 올바르게.**
     처음에 제목 · 설명을 빼고 날짜만 틀리게 넣었더니 **제목 자물쇠가
     먼저** 막아서, "여덟이 다른 말로 거절한다" 가 떨어졌습니다 —
     코드가 아니라 검사가 틀린 자리였습니다. */
  const dPast = denied(room(HOST, { play_at: psql("select (current_date - 1)::text") }));
  says.past = dPast.why;
  ok("지난 날짜로는 못 연다", dPast.no, dPast.why);
  const dFar = denied(room(HOST, { play_at: psql("select (current_date + 400)::text") }));
  says.far = dFar.why;
  ok("너무 먼 날짜로는 못 연다", dFar.no, dFar.why);
  const dNeed = denied(room(HOST, { need: 9 }));
  says.need = dNeed.why;
  ok("더 필요한 인원이 4명 이상이면 막힌다 (한 팀은 넷입니다)", dNeed.no, dNeed.why);
  const dNoRg = denied(room(HOST, { region: "" }));
  says.region = dNoRg.why;
  ok("지역이 없으면 막힌다", dNoRg.no, dNoRg.why);
  const dNoC = denied(room(HOST, { contact: "" }));
  says.contact = dNoC.why;
  ok("연락처가 없으면 막힌다", dNoC.no, dNoC.why);
  const dNoAg = denied(as(HOST) + "select open_joinroom('" +
    J({ region:"seoul", play_at: psql("select (current_date + 7)::text"),
        need:1, title:"동의 없이 열어 봅니다", body:"설명입니다",
        contact:"010-1" }) + "'::jsonb)");
  says.agree = dNoAg.why;
  ok("동의 시각이 없으면 막힌다 (제15조 제2항)", dNoAg.no, dNoAg.why);
  const dNoT = denied(room(HOST, { title: "" }));
  says.title = dNoT.why;
  ok("제목이 없으면 막힌다 (지시서 §2.A — 필수)", dNoT.no, dNoT.why);
  const dNoB = denied(room(HOST, { body: "" }));
  says.body = dNoB.why;
  ok("설명이 없으면 막힌다 (§2.A — 필수)", dNoB.no, dNoB.why);
  const uniq = new Set(Object.values(says));
  ok("⚠️ 여덟 자물쇠가 **서로 다른 말**로 거절한다",
     uniq.size === Object.keys(says).length, JSON.stringify(says));

  // ── ② 공개 목록 ───────────────────────────────────────────────
  console.log("\n── 공개 목록 (v_join_open)");
  const seeAnon = allowed(anon + "select count(*) from v_join_open where id = '" + RID + "'");
  ok("비로그인도 열린 자리를 본다 (크롤러도 봅니다)", seeAnon.yes && seeAnon.out === "1",
     seeAnon.out || seeAnon.why);

  /* ⚠️⚠️⚠️ 보기에 연락처 칸이 **아예 없어야** 합니다. 있는데 비어
     있는 것과는 다릅니다 — 칸이 있으면 언젠가 채워집니다. */
  const cols = psql("select string_agg(column_name, ',' order by column_name) " +
    "from information_schema.columns where table_name = 'v_join_open'");
  ok("⚠️ 공개 보기에 contact 칸이 **없다**", cols.indexOf("contact") < 0, cols);
  ok("⚠️ 공개 보기에 by_user 칸도 **없다** (누가 열었는지는 공개가 아닙니다)",
     cols.indexOf("by_user") < 0, cols);
  ok("  잔여 인원은 칸이 아니라 **세어서** 냅니다", cols.indexOf("left_n") >= 0, cols);
  ok("  제목 · 설명이 목록에 나온다 (§2.A)",
     cols.indexOf("title") >= 0 && cols.indexOf("body") >= 0, cols);
  ok("  ⚠️ 골프장이 적혀도 **부킹 확정이 아니라는 표시**가 따로 있다 (§2.A)",
     cols.indexOf("booked") >= 0, cols);

  const anonTable = denied(anon + "select contact from joinroom limit 1");
  ok("비로그인은 표를 못 읽는다", anonTable.no, anonTable.why);

  // ── ③ 연락처 — 세 겹을 따로 눌러 봅니다 ───────────────────────
  console.log("\n── ⚠️⚠️ 연락처 (개인정보보호법 제17조)");
  /* 겹 ② — 칸 단위 GRANT. 줄은 보이는데 칸이 안 보여야 합니다. */
  const ownRow = allowed(as(HOST) + "select region from joinroom where id = '" + RID + "'");
  ok("연 사람은 제 자리 **줄**은 읽는다", ownRow.yes && ownRow.out === "seoul",
     ownRow.out || ownRow.why);
  const ownC = denied(as(HOST) + "select contact from joinroom where id = '" + RID + "'");
  ok("⚠️ 그런데 **연락처 칸은 제 것도 표에서 못 읽는다** (칸 단위 GRANT)",
     ownC.no, ownC.why);
  ok("  그 거절이 permission 이라고 말한다",
     ownC.no && /permission|권한/i.test(ownC.why), ownC.why);

  // ── ④ 신청 ────────────────────────────────────────────────────
  console.log("\n── 신청합니다");
  const own = denied(ap(HOST, RID, {}));
  ok("⚠️ 제가 연 자리에는 못 신청한다 (신청 수를 스스로 부풀립니다)", own.no, own.why);

  const p1 = allowed(ap(G1, RID, {}));
  ok("남은 신청할 수 있다", p1.yes && /^[0-9a-f-]{36}$/.test(p1.out), p1.out || p1.why);
  const AID1 = p1.out;

  const twice = denied(ap(G1, RID, {}));
  ok("같은 자리에 두 번은 못 넣는다", twice.no, twice.why);

  /* 겹 ③ — 수락 **전**에는 연락처가 안 보입니다 */
  const beforeHost = allowed(as(HOST) +
    "select count(*) from v_join_contact where room_id = '" + RID + "'");
  ok("⚠️⚠️ 수락 **전**에는 연 사람도 신청자 연락처를 못 본다",
     beforeHost.yes && beforeHost.out === "0", beforeHost.out || beforeHost.why);
  const beforeG1 = allowed(as(G1) +
    "select count(*) from v_join_contact where room_id = '" + RID + "'");
  ok("⚠️⚠️ 수락 전에는 신청자도 연 사람 연락처를 못 본다",
     beforeG1.yes && beforeG1.out === "0", beforeG1.out || beforeG1.why);

  const applyC = denied(as(HOST) + "select contact from joinapply where id = '" + AID1 + "'");
  ok("⚠️ 신청의 연락처 칸도 표에서는 안 읽힌다", applyC.no, applyC.why);

  // ── ⑤ 수락 · 거절 — 누가 할 수 있나 ───────────────────────────
  console.log("\n── 수락 · 거절 · 거두기");
  const g1Accept = denied(mv(G1, AID1, "accepted"));
  ok("⚠️ 신청한 사람이 스스로 수락 못 한다", g1Accept.no, g1Accept.why);
  const nosyAccept = denied(mv(NOSY, AID1, "accepted"));
  ok("⚠️ 남은 손도 못 댄다", nosyAccept.no, nosyAccept.why);
  ok("  둘이 **다른 말**로 거절한다 (자물쇠가 겹쳐 속이지 않게)",
     g1Accept.why !== nosyAccept.why,
     g1Accept.why + "  |  " + nosyAccept.why);

  const acc = allowed(mv(HOST, AID1, "accepted"));
  ok("연 사람은 수락할 수 있다", acc.yes && acc.out === "accepted", acc.out || acc.why);

  /* ⚠️⚠️⚠️ **여기가 이 기능에서 가장 조심한 자리입니다.**
     처음에는 "수락하면 서로 보이게" 로 지었는데, 지시서 §2.A 가
     "**수락만으로 자동 공개하지 말고 별도 적법한 동의 후**" 라고
     못박습니다 — 맞습니다. 수락은 "같이 치자" 이지 "내 번호를 줘도
     좋다" 가 아닙니다. 둘은 다른 결정입니다 (제17조 제2항).
     그래서 **수락 직후에도 둘 다 안 보여야** 합니다. */
  const accHost = allowed(as(HOST) +
    "select coalesce(apply_contact,'(없음)') from v_join_contact where apply_id = '" + AID1 + "'");
  ok("⚠️⚠️⚠️ **수락만으로는 연 사람도 신청자 번호를 못 본다**",
     accHost.yes && accHost.out === "(없음)", accHost.out || accHost.why);
  const accG1 = allowed(as(G1) +
    "select coalesce(room_contact,'(없음)') from v_join_contact where apply_id = '" + AID1 + "'");
  ok("⚠️⚠️⚠️ **수락만으로는 신청자도 연 사람 번호를 못 본다**",
     accG1.yes && accG1.out === "(없음)", accG1.out || accG1.why);

  console.log("\n── 연락처는 **각자 따로** 엽니다 (제17조 제2항)");
  const sh = (who, aid, on) => as(who) + "select share_joincontact('" +
    J({ id:aid, on: on === undefined ? true : on, agree_at:nowIso }) + "'::jsonb)";

  const shG1 = allowed(sh(G1, AID1));
  ok("신청자가 제 번호를 열 수 있다", shG1.yes && shG1.out === "guest_shared",
     shG1.out || shG1.why);
  const nowHost = allowed(as(HOST) +
    "select apply_contact from v_join_contact where apply_id = '" + AID1 + "'");
  ok("  그러면 연 사람이 그 번호를 본다", nowHost.yes && nowHost.out === "010-8000-0000",
     nowHost.out || nowHost.why);

  /* ⚠️⚠️ **한쪽만 열어도 그쪽 것만 갑니다** — 맞바꾸기를 강요하지
     않습니다. 강요하면 "줘야 받는" 구조가 되어 사실상 강제 동의입니다. */
  const stillG1 = allowed(as(G1) +
    "select coalesce(room_contact,'(없음)') from v_join_contact where apply_id = '" + AID1 + "'");
  ok("⚠️⚠️ 그래도 **연 사람 번호는 아직 안 보인다** (맞바꾸기 강요 없음)",
     stillG1.yes && stillG1.out === "(없음)", stillG1.out || stillG1.why);

  const shHost = allowed(sh(HOST, AID1));
  ok("연 사람도 제 번호를 열 수 있다", shHost.yes && shHost.out === "host_shared",
     shHost.out || shHost.why);
  const bothG1 = allowed(as(G1) +
    "select room_contact from v_join_contact where apply_id = '" + AID1 + "'");
  ok("  이제 신청자도 본다", bothG1.yes && bothG1.out === "010-7000-0000",
     bothG1.out || bothG1.why);

  /* ⚠️ 되돌릴 수 있어야 합니다 — 한 번 준 것을 영영 못 거두면
     그것도 제17조가 말하는 동의가 아닙니다 (철회권). */
  const unshare = allowed(sh(G1, AID1, false));
  ok("⚠️ 열었던 것을 **다시 닫을 수 있다** (동의 철회)",
     unshare.yes && unshare.out === "guest_hidden", unshare.out || unshare.why);
  const afterHide = allowed(as(HOST) +
    "select coalesce(apply_contact,'(없음)') from v_join_contact where apply_id = '" + AID1 + "'");
  ok("  닫으면 상대가 더는 못 본다", afterHide.yes && afterHide.out === "(없음)",
     afterHide.out || afterHide.why);
  psql(sh(G1, AID1));   /* 뒤 검사를 위해 다시 열어 둡니다 */

  /* ⚠️⚠️⚠️ 남 · 관리자에게는 **어느 단계에서도** 안 보입니다 */
  const afterNosy = allowed(as(NOSY) +
    "select count(*) from v_join_contact where apply_id = '" + AID1 + "'");
  ok("⚠️⚠️⚠️ 둘 다 열어도 **남에게는 안 보인다**",
     afterNosy.yes && afterNosy.out === "0", afterNosy.out || afterNosy.why);
  const afterAdm = allowed(as(ADM) +
    "select count(*) from v_join_contact where apply_id = '" + AID1 + "'");
  ok("⚠️ 관리자에게도 안 보인다 (둘 사이의 일입니다)",
     afterAdm.yes && afterAdm.out === "0", afterAdm.out || afterAdm.why);

  const nosyShare = denied(sh(NOSY, AID1));
  ok("⚠️ 남이 남의 번호를 대신 열지 못한다", nosyShare.no, nosyShare.why);

  const already = denied(mv(HOST, AID1, "rejected"));
  ok("이미 처리된 신청은 다시 못 옮긴다", already.no, already.why);

  // ── ⑥ 인원이 차면 ─────────────────────────────────────────────
  console.log("\n── 인원이 차면 (need = 2)");
  const p2 = allowed(ap(G2, RID, {}));
  ok("둘째도 신청할 수 있다", p2.yes, p2.why);
  const acc2 = allowed(mv(HOST, p2.out, "accepted"));
  ok("둘째도 수락된다 (need 2 를 채웁니다)", acc2.yes, acc2.why);

  const p3 = denied(ap(G3, RID, {}));
  ok("⚠️ 인원이 차면 더 못 신청한다", p3.no, p3.why);
  ok("  그 거절이 **인원이 찼다**고 말한다",
     p3.no && p3.why.indexOf("인원이 찼") >= 0, p3.why);

  // ── ⑦ 거두기 ──────────────────────────────────────────────────
  console.log("\n── 거두기는 신청한 사람만");
  const r2 = allowed(room(HOST, { need: 1 }));
  const RID2 = r2.out;
  const p4 = allowed(ap(G3, RID2, {}));
  const hostCancel = denied(mv(HOST, p4.out, "canceled"));
  ok("⚠️ 연 사람이 남의 신청을 대신 거두지 못한다", hostCancel.no, hostCancel.why);
  const g3Cancel = allowed(mv(G3, p4.out, "canceled"));
  ok("신청한 사람은 거둘 수 있다", g3Cancel.yes && g3Cancel.out === "canceled",
     g3Cancel.out || g3Cancel.why);

  // ── ⑧ 닫기 ────────────────────────────────────────────────────
  console.log("\n── 자리 닫기");
  const nosyClose = denied(as(NOSY) + "select close_joinroom('" + J({ id:RID2 }) + "'::jsonb)");
  ok("남은 못 닫는다", nosyClose.no, nosyClose.why);
  const admClose = allowed(as(ADM) + "select close_joinroom('" + J({ id:RID2 }) + "'::jsonb)");
  ok("운영자는 닫을 수 있다 (신고가 들어온 자리를 내려야 합니다)",
     admClose.yes && admClose.out === "closed", admClose.out || admClose.why);
  const gone = allowed(anon + "select count(*) from v_join_open where id = '" + RID2 + "'");
  ok("닫힌 자리는 공개 목록에서 빠진다", gone.yes && gone.out === "0",
     gone.out || gone.why);
  const twiceClose = denied(as(HOST) + "select close_joinroom('" + J({ id:RID2 }) + "'::jsonb)");
  ok("이미 닫힌 자리는 다시 못 닫는다", twiceClose.no, twiceClose.why);

  // ── ⑨ 쏟아붓기 — ⚠️ 경계가 실제로 거기 있는지 ─────────────────
  console.log("\n── ⚠️ 쏟아붓기 막기 (열린 자리 다섯)");
  /* ⚠️⚠️ 지금 HOST 는 r1(열림) + r2(닫힘) 을 가지고 있습니다.
     열린 것만 세므로 넷을 더 열면 다섯이 되고, 여섯째가 막혀야
     합니다. **문으로** 눌러 봅니다 (표에 바로 넣으면 자물쇠를
     지나갑니다). */
  let made = 0;
  for(let i = 0; i < 4; i++){
    if(allowed(room(HOST, { need: 1 })).yes) made++;
  }
  ok("넷을 더 열 수 있다 (다섯까지)", made === 4, "열린 것 " + made);
  const sixth = denied(room(HOST, { need: 1 }));
  ok("⚠️ 여섯째는 막힌다 — **경계가 실제로 거기 있습니다**", sixth.no, sixth.why);
  ok("  그 거절이 **다섯**이라고 말한다",
     sixth.no && sixth.why.indexOf("다섯") >= 0, sixth.why);

  /* ⚠️ 닫으면 다시 열 수 있어야 합니다 (닫은 것은 안 셉니다) */
  /* ⚠️ **뒤 검사가 쓰는 자리를 닫지 않습니다.** 처음에 "열린 것 아무거나"
     로 골랐더니 하필 RID 를 닫아, 뒤의 "고치기" 검사가 "닫힌 자리는 못
     고칩니다" 로 떨어졌습니다 — 코드가 아니라 검사끼리 부딪힌 자리입니다. */
  const anyOpen = psql("select id from joinroom where by_user = '" + HOST +
                       "' and state = 'open' and id <> '" + RID + "' limit 1");
  psql(as(HOST) + "select close_joinroom('" + J({ id:anyOpen }) + "'::jsonb)");
  const again = allowed(room(HOST, { need: 1 }));
  ok("하나 닫으면 다시 열 수 있다 (닫은 자리는 안 셉니다)", again.yes, again.why);

  // ── ⑩ 표에 직접 쓰는 길이 없는가 ──────────────────────────────
  console.log("\n── ⚠️ 들어오는 길은 문뿐입니다");
  const ins = denied(as(G1) + "insert into joinroom (by_user, region, play_at, need, " +
    "contact, agree_at) values ('" + G1 + "','seoul', current_date + 1, 1, '010-9', now())");
  ok("표에 직접 넣지 못한다 (쓰기 GRANT 를 안 줬습니다)", ins.no, ins.why);
  const upd = denied(as(G1) + "update joinapply set state = 'accepted' where id = '" + AID1 + "'");
  ok("표를 직접 고치지 못한다", upd.no, upd.why);

  // ── ⑪ 본인 수정 (지시서 §2.A) ────────────────────────────────
  console.log("\n── 여신 분이 제 자리를 고칩니다");
  const ed = o => as(o.who) + "select edit_joinroom('" +
    J(Object.assign({ id:RID, title:"고친 제목", body:"고친 설명입니다", need:2 }, o.ex)) +
    "'::jsonb)";
  const nosyEdit = denied(ed({ who:NOSY }));
  ok("⚠️ 남은 못 고친다", nosyEdit.no, nosyEdit.why);
  const myEdit = allowed(ed({ who:HOST }));
  ok("여신 분은 고칠 수 있다", myEdit.yes, myEdit.why);
  const newTitle = psql(as(HOST) + "select title from joinroom where id = '" + RID + "'");
  ok("  실제로 바뀌었다 (에러만 보지 않고 값을 봅니다)", newTitle === "고친 제목", newTitle);

  /* ⚠️⚠️ 이미 둘을 수락해 두었습니다. 하나로 줄이면 수락해 놓고
     자리를 뺏는 꼴이라 막혀야 합니다. */
  const shrink = denied(ed({ who:HOST, ex:{ need:1 } }));
  ok("⚠️⚠️ 이미 수락한 사람보다 적게 줄이지 못한다", shrink.no, shrink.why);

  /* ⚠️ 날짜 · 지역은 아예 안 받습니다 — 바꾸면 신청한 사람이 전혀
     다른 약속에 묶입니다. 보내도 안 바뀌어야 합니다. */
  psql(ed({ who:HOST, ex:{ region:"jeju", play_at:"2099-01-01" } }));
  const rg = psql(as(HOST) + "select region from joinroom where id = '" + RID + "'");
  ok("⚠️ 날짜 · 지역은 고치는 문으로 **안 바뀐다** (보내도 무시합니다)",
     rg === "seoul", rg);

  // ── ⑫ 신고 — ⚠️ 새 표를 만들지 않고 report 를 씁니다 ──────────
  console.log("\n── 신고는 기존 report 에 붙입니다 (지시서 §0-6)");
  const rep = allowed(as(G1) + "select open_report('" +
    J({ kind:"abuse", joinroom:RID, body:"연락처를 계속 요구합니다" }) + "'::jsonb)");
  ok("조인 자리를 신고할 수 있다", rep.yes && /^[0-9a-f-]{36}$/.test(rep.out),
     rep.out || rep.why);
  const where = psql("select joinroom_id from report where id = '" + rep.out + "'");
  ok("  그 신고가 **그 자리**를 가리킨다", where === RID, where);
  const dup = denied(as(G1) + "select open_report('" +
    J({ kind:"abuse", joinroom:RID, body:"또 넣어 봅니다" }) + "'::jsonb)");
  ok("  같은 건을 두 번은 못 넣는다 (0040 의 막음이 살아 있습니다)", dup.no, dup.why);
  /* ⚠️⚠️ 0040 이 하던 일이 안 날아갔는지 — 본문 다섯 글자 막음 */
  const shortB = denied(as(G1) + "select open_report('" +
    J({ kind:"abuse", joinroom:RID, body:"짧" }) + "'::jsonb)");
  ok("⚠️ 0040 의 **다섯 글자 막음이 살아 있다** (갈아 끼우며 안 날렸습니다)",
     shortB.no, shortB.why);
  const noTarget = denied(as(G1) + "select open_report('" +
    J({ kind:"abuse", body:"아무것도 안 가리킵니다" }) + "'::jsonb)");
  ok("⚠️ 가리키는 것이 없으면 여전히 막힌다", noTarget.no, noTarget.why);
  const auditBody = psql("select coalesce(string_agg(data::text,'|'),'') from audit_log " +
    "where obj = 'report' and obj_id = '" + rep.out + "'");
  ok("⚠️ 감사 기록에 **신고 본문이 안 들어간다** (0040 의 뜻입니다)",
     auditBody.indexOf("연락처를 계속") < 0, auditBody);

  // ── ⑬ 수락 전에는 연락처를 못 엽니다 ─────────────────────────
  console.log("\n── 수락 전에는 번호를 못 엽니다");
  /* ⚠️ **HOST 는 바로 위 쏟아붓기 검사로 다섯 칸을 다 썼습니다.**
     여기서 또 HOST 로 열면 열리지 않고, 그 뒤가 전부 "그런 신청이
     없습니다" 로 무너집니다 — 검사끼리 부딪히는 자리라 **아직 아무
     자리도 안 연 사람**으로 엽니다. */
  const r3 = allowed(room(G2, { need:1 }));
  ok("다른 회원도 자리를 열 수 있다 (앞 검사와 안 부딪히게)", r3.yes, r3.why);
  const p5 = allowed(ap(G3, r3.out, {}));
  ok("  거기 신청도 된다", p5.yes, p5.why);
  const early = denied(as(G3) + "select share_joincontact('" +
    J({ id:p5.out, on:true, agree_at:nowIso }) + "'::jsonb)");
  ok("⚠️ 수락되기 전에는 번호를 못 연다", early.no, early.why);
  ok("  그 거절이 **수락된 뒤**라고 말한다",
     early.no && early.why.indexOf("수락된 뒤") >= 0, early.why);

  /* ⚠️⚠️ **RLS 는 UPDATE 에서 에러를 내지 않습니다** — 보이지 않는
     줄은 그냥 안 걸릴 뿐이라 0줄이 바뀌고 성공으로 돌아옵니다.
     여기서는 GRANT 가 먼저 막아 에러가 나지만, **에러로만 재면**
     GRANT 를 여는 날 "막힌다" 가 조용히 거짓이 됩니다. 그래서
     바뀐 줄 수까지 봅니다. */
  const still = psql("select state from joinapply where id = '" + AID1 + "'");
  ok("⚠️ 그리고 실제로 **안 바뀌었다** (에러만 보지 않고 값을 봅니다)",
     still === "accepted", still);
};

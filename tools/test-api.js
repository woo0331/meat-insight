#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   접수 주소(/api/quote)가 화면이 보낸 칸을 빠짐없이 전달하는가

     node tools/test-api.js

   ⚠️ 이 검사가 있는 이유 — **화면이 보내는 칸 이름과 api/quote.js 가
   읽는 칸 이름이 어긋나면 그 칸은 조용히 사라집니다.** 에러도 안 나고
   접수도 성공합니다. 받아 보는 사람만 "왜 업체명이 없지?" 하게 됩니다.
   실제로 견적 요청의 service·budget·detail 과 파트너 등록의 company·
   services 가 그렇게 빠져 있었습니다.

   ⚠️ node check.js 는 이걸 못 잡습니다. 그쪽은 브라우저로 화면만 보고,
   Vercel 함수는 돌리지 않습니다.

   ⚠️ 진짜로 보내지 않습니다. fetch 를 가로채서 **무엇을 보내려 했는지**만
   들여다봅니다.
   ════════════════════════════════════════════════════════════════════ */

const path = require("path");
const QUOTE = path.join(__dirname, "..", "api", "quote.js");

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got ? "  →  " + got : "")); }
}

/* 화면에서 온 것처럼 보이게 합니다 (api/_send.js 의 fromOurPages) */
function fakeReq(body){
  return { method:"POST",
           headers:{ origin:"https://storeway.co.kr", host:"storeway.co.kr" },
           body: body };
}
function fakeRes(){
  const r = { code:0, body:null };
  r.status = function(c){ r.code = c; return r; };
  r.json   = function(j){ r.body = j; return r; };
  r.setHeader = function(){};
  return r;
}

/* 요청 하나를 흘려보내고, 웹훅으로 나가려던 것을 돌려줍니다 */
async function send(body){
  process.env.INTAKE_WEBHOOK_URL = "https://example.invalid/hook";
  delete require.cache[require.resolve(QUOTE)];
  delete require.cache[require.resolve(path.join(__dirname,"..","api","_send.js"))];
  const handler = require(QUOTE);

  let sentBody = null;
  const realFetch = global.fetch;
  global.fetch = async function(url, init){
    sentBody = JSON.parse(init.body);
    return { ok:true, status:200, headers:{ get(){ return ""; } }, text: async()=> "" };
  };
  const res = fakeRes();
  try{ await handler(fakeReq(body), res); }
  finally{ global.fetch = realFetch; }
  return { res:res, sent:sentBody };
}

/* ── DB 가 설정된 것처럼 ────────────────────────────────────────
   ⚠️ 진짜 Supabase 에 붙지 않습니다. fetch 를 가로채서, 찾기(GET)에는
   미리 정한 줄을 돌려주고 넣기(POST)에는 성공/실패를 흉내냅니다.
   ⚠️⚠️ 이 검사가 꼭 필요한 까닭 — DB 가 **없을 때** 오늘과 똑같이
   도는지, **있을 때** 번호와 중복 검사가 실제로 도는지, 그리고
   **저장이 실패했을 때** 손님에게 없는 번호를 주지 않는지. 셋 다
   코드 한 줄 차이로 뒤집힙니다. */
async function sendWithDb(body, opt){
  opt = opt || {};
  process.env.INTAKE_WEBHOOK_URL = "https://example.invalid/hook";
  process.env.SUPABASE_URL = "https://x.supabase.co";
  process.env.SUPABASE_SERVICE_KEY = "service-key-should-never-leak";
  for(const f of ["quote.js", "_send.js", "_db.js", "_intake.js"])
    delete require.cache[require.resolve(path.join(__dirname, "..", "api", f))];
  const handler = require(QUOTE);

  let hook = null, inserted = null, keySeen = "";
  const realFetch = global.fetch;
  global.fetch = async function(url, init){
    const u = String(url);
    if(/supabase/.test(u)){
      /* 키가 헤더로 가는지 (본문으로 새면 안 됩니다) */
      const h = (init && init.headers) || {};
      keySeen = h.apikey || "";
      if(init.method === "GET")
        return { ok:true, status:200, headers:{ get(){ return ""; } },
                 text: async()=> JSON.stringify(opt.rows || []) };
      inserted = JSON.parse(init.body)[0];
      if(opt.saveFails)
        return { ok:false, status:500, headers:{ get(){ return ""; } },
                 text: async()=> "boom" };
      return { ok:true, status:201, headers:{ get(){ return ""; } },
               text: async()=> JSON.stringify([inserted]) };
    }
    hook = JSON.parse(init.body);
    return { ok:true, status:200, headers:{ get(){ return ""; } }, text: async()=> "" };
  };
  const res = fakeRes();
  try{ await handler(fakeReq(body), res); }
  finally{
    global.fetch = realFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
  }
  return { res:res, sent:hook, row:inserted, keySeen:keySeen };
}

(async () => {
  console.log("\n── 사장님 SOS");
  {
    const { res, sent } = await send({
      kind:"sos", q:"덕트 냄새 민원이 들어옵니다", cat:"duct",
      name:"홍길동", tel:"010-1234-5678", biz:"고깃집", region:"경기 안양", agree:true });
    ok("200 으로 받는다", res.code === 200, "code=" + res.code);
    ok("적은 상황이 그대로 간다", /덕트 냄새 민원/.test(sent.text));
    ok("분류가 간다",     sent.cat === "duct", sent.cat);
    ok("업종·지역이 간다", sent.biz === "고깃집" && sent.region === "경기 안양");
    ok("제목에 [SOS] 가 붙는다", /\[SOS\]/.test(sent.text));
  }

  console.log("\n── 견적 요청");
  {
    const { res, sent } = await send({
      kind:"quote", service:"duct", serviceName:"덕트 · 환기",
      q:"3년 전에 시공했고 손 안 댔습니다", region:"경기 안양", budget:"500",
      name:"홍길동", tel:"010-1234-5678",
      detail:{ "화구 수":"12", "평수":"40", "왜 부르시나요":"냄새 · 민원" },
      asks:["배기구 위치를 바꿀 수 있나요.",
            "탈취 방식이 무엇이고 월 유지비가 얼마나 드나요."],
      agree:true });
    ok("200 으로 받는다", res.code === 200, "code=" + res.code);
    /* ⚠️ 여기가 실제로 빠져 있던 칸들입니다 */
    ok("서비스 이름이 간다", sent.serviceName === "덕트 · 환기", sent.serviceName);
    ok("서비스 key 가 간다", sent.service === "duct", sent.service);
    ok("예산이 간다",       /500/.test(sent.text), "본문에 없음");
    ok("화구 수가 간다",    /화구 수 — 12/.test(sent.text), "본문에 없음");
    ok("평수가 간다",       /평수 — 40/.test(sent.text), "본문에 없음");
    ok("제목에 [견적] 과 서비스가 붙는다", /\[견적\][\s\S]*덕트/.test(sent.text));
    /* ⚠️ 가이드에서 고르신 "물어볼 것" — 사장님이 **대신 물어봐 달라고
       맡기신 것**입니다. 빠지면 요청은 성공하는데 정작 물어볼 것이
       사라집니다. */
    ok("물어볼 것이 간다",   /배기구 위치를 바꿀 수 있나요/.test(sent.text), "본문에 없음");
    ok("물어볼 것이 번호와 같이 간다", /1\. 배기구 위치/.test(sent.text), "번호가 없음");
    ok("물어볼 것이 따로 묶여 간다",
       /물어봐 달라고 하신 것/.test(sent.text), "제목줄이 없음");
  }

  /* ⚠️ 안 고르셨으면 **그 칸이 아예 안 나와야** 합니다. "없음" 을 찍으면
     업체가 "물어볼 게 없다" 로 읽습니다. */
  {
    const { res, sent } = await send({
      kind:"quote", service:"duct", serviceName:"덕트 · 환기",
      q:"민원이 들어옵니다", name:"홍길동", tel:"010-1234-5678",
      asks:[], agree:true });
    ok("안 고르면 그 칸이 아예 안 나온다",
       res.code === 200 && !/물어봐 달라고 하신 것/.test(sent.text), "빈 칸이 찍힘");
  }

  console.log("\n── 파트너 등록");
  {
    const { res, sent } = await send({
      kind:"partner", company:"가나덕트", name:"김기사", tel:"010-1234-5678",
      brn:"123-45-67890", region:"경기 남부", exp:"고깃집 덕트 8년",
      note:"주말도 됩니다",
      services:["duct","kitchen"], serviceNames:["덕트 · 환기","주방설비"],
      agree:true });
    ok("200 으로 받는다", res.code === 200, "code=" + res.code);
    /* ⚠️ 파트너 등록이 통째로 "견적" 으로 처리되어 업체명이 사라졌었습니다 */
    ok("업체명이 간다",     sent.company === "가나덕트", sent.company);
    ok("취급 서비스가 간다", /덕트 · 환기/.test(sent.text) && /주방설비/.test(sent.text));
    ok("사업자번호·경력이 간다", /123-45-67890/.test(sent.text) && /8년/.test(sent.text));
    ok("제목에 [파트너] 가 붙는다", /\[파트너\]/.test(sent.text));
    ok("kind 가 partner 로 간다", sent.kind === "partner", sent.kind);
  }

  console.log("\n── 안 받아야 하는 것");
  {
    const a = await send({ kind:"sos", q:"x", name:"홍", tel:"010", agree:false });
    ok("동의 없이는 안 받는다", a.res.code === 400 && a.sent === null, "code=" + a.res.code);

    const b = await send({ kind:"sos", q:"x", name:"", tel:"010-1234-5678", agree:true });
    ok("성함 없이는 안 받는다", b.res.code === 400, "code=" + b.res.code);

    const c = await send({ kind:"partner", company:"가나덕트", name:"김기사",
                           tel:"010-1234-5678", services:[], agree:true });
    ok("파트너는 하는 일 없이 안 받는다", c.res.code === 400, "code=" + c.res.code);

    /* 화면 밖에서 온 요청 */
    delete require.cache[require.resolve(QUOTE)];
    const handler = require(QUOTE);
    const res = fakeRes();
    await handler({ method:"POST", headers:{}, body:{ kind:"sos", agree:true } }, res);
    ok("Origin 없는 요청은 안 받는다", res.code === 403, "code=" + res.code);
  }

  /* ⚠️⚠️ **매물 내놓기(/sell)는 칸이 많습니다.** 매장 항목이 열셋이라
     `detailLines()` 의 상한(예전 12)에 **닿아 있었습니다** — 하나만
     더해도 에러 없이 조용히 빠집니다. 열셋을 다 보내고 **마지막 칸까지**
     본문에 있는지 봅니다. */
  console.log("\n── 매물 내놓기 (매장)");
  {
    const { res, sent } = await send({
      kind:"quote", service:"", serviceName:"매장 내놓기",
      q:"평촌 18평 카페입니다. 주중 오후에 보실 수 있습니다.",
      region:"경기", name:"홍길동", tel:"010-1234-5678",
      detail:{ "거래 방식":"매장 양도", "업종":"카페 · 디저트", "시군구":"안양시",
               "평수":"18", "보증금":"3000", "월세":"180", "권리금":"2000",
               "시설 인수비":"1500", "시설 포함":"그대로 두고 갑니다",
               "문 연 해":"2019", "넘기고 싶은 시점":"2026년 12월",
               "월 매출(사장님이 적으신 값)":"1200",
               "사진 주소":"https://example.com/a" },
      agree:true });
    ok("200 으로 받는다", res.code === 200, "code=" + res.code);
    ok("무엇을 내놓는지가 제목에 간다", /\[견적\][\s\S]*매장 내놓기/.test(sent.text));
    ok("거래 방식이 간다", /거래 방식 — 매장 양도/.test(sent.text), "본문에 없음");
    ok("보증금 · 월세 · 권리금이 간다",
       /보증금 — 3000/.test(sent.text) && /월세 — 180/.test(sent.text) &&
       /권리금 — 2000/.test(sent.text), "본문에 없음");
    /* ⚠️ 열셋째 칸 — 상한이 12 이던 때는 **여기서 조용히 빠졌습니다** */
    ok("열셋째 칸(사진 주소)까지 간다",
       /사진 주소 — https:\/\/example\.com\/a/.test(sent.text), "상한에 잘렸습니다");
    ok("매출이 누구 값인지 같이 간다",
       /월 매출\(사장님이 적으신 값\) — 1200/.test(sent.text), "본문에 없음");
  }

  console.log("\n── 매물 내놓기 (시설 · 장비)");
  {
    const { res, sent } = await send({
      kind:"quote", service:"", serviceName:"시설 · 장비 내놓기",
      q:"정기 점검 받아 왔습니다.", region:"경기",
      name:"홍길동", tel:"010-1234-5678",
      detail:{ "품목":"에스프레소 머신 2그룹", "거래 단위":"낱개",
               "업종":"카페 · 디저트", "시군구":"안양시", "제조사":"La Marzocco",
               "연식":"2021", "수량":"1", "희망가":"300",
               "상태":"정기 점검 받아 왔습니다" },
      agree:true });
    ok("200 으로 받는다", res.code === 200, "code=" + res.code);
    ok("품목이 간다", /품목 — 에스프레소 머신 2그룹/.test(sent.text), "본문에 없음");
    ok("거래 단위가 간다", /거래 단위 — 낱개/.test(sent.text), "본문에 없음");
    ok("제조사 · 연식이 간다",
       /제조사 — La Marzocco/.test(sent.text) && /연식 — 2021/.test(sent.text), "본문에 없음");
  }

  console.log("\n── ⚠️⚠️ DB 가 없으면 오늘과 똑같이 동작한다 (fail-closed)");
  {
    for(const k of ["SUPABASE_URL","SUPABASE_SERVICE_KEY"]) delete process.env[k];
    const { res, sent } = await send({
      kind:"quote", service:"duct", q:"확인 부탁드립니다",
      name:"홍길동", tel:"010-1234-5678", agree:true });
    ok("200 으로 받는다", res.code === 200, "code=" + res.code);
    /* ⚠️⚠️ 저장을 안 했으니 접수번호를 주지 않습니다 — 번호를 주고
       저장은 안 하면 손님이 그 번호로 물어봐도 아무것도 없습니다
       (절대 규칙 5) */
    ok("접수번호를 발급하지 않는다", res.body.no === undefined, res.body);
    ok("슬랙 글에도 접수번호가 없다", !/접수번호/.test(sent.text));
  }

  console.log("\n── DB 가 있으면 접수번호가 생긴다 (§6)");
  {
    const { res, sent, row, keySeen } = await sendWithDb({
      kind:"quote", service:"interior", serviceName:"인테리어", offerId:"interior-basic",
      q:"20평 카페입니다", region:"경기", gu:"안양시", side:"start",
      name:"홍길동", tel:"010-1234-5678", agree:true });
    ok("200 으로 받는다", res.code === 200, "code=" + res.code);
    ok("접수번호를 돌려준다", /^SW-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(res.body.no || ""), res.body);
    ok("저장한 줄의 번호와 같다", row && row.no === res.body.no, row && row.no);
    /* ⚠️ 직원이 전화하면서 제일 먼저 묻는 것이라 글 맨 위입니다 */
    ok("슬랙 글 맨 위에 접수번호가 있다", /^접수번호 /.test(sent.text.split("\n\n")[1] || ""),
       (sent.text || "").slice(0, 60));
    ok("상태가 '신청 접수' 로 들어간다", row.state === "new", row.state);
    /* ⚠️⚠️ 동의를 시각으로 남깁니다 */
    ok("수집·이용 동의 시각이 들어간다", !!row.agree_at && !isNaN(Date.parse(row.agree_at)), row.agree_at);
    /* ⚠️⚠️ 제17조 제2항 — 접수 단계에는 제3자 제공 동의가 없어야 합니다 */
    ok("제3자 제공 동의는 비어 있다 (배정할 때 받습니다)",
       row.agree3rd_at === undefined || row.agree3rd_at === null, row.agree3rd_at);
    ok("업종·지역·시군구가 들어간다",
       row.region === "경기" && row.gu === "안양시", row);
    ok("상품 id 가 들어간다", row.offer_id === "interior-basic", row.offer_id);
    /* ⚠️⚠️ 키는 헤더로만 갑니다 */
    ok("키가 헤더로 간다", keySeen === "service-key-should-never-leak");
    ok("⚠️ 키가 슬랙 글에 섞이지 않는다", !/service-key/.test(JSON.stringify(sent)));
  }

  console.log("\n── 업체 입점은 저장하지 않는다 (§7 에서 붙습니다)");
  {
    const { res, row } = await sendWithDb({
      kind:"partner", company:"가나다 인테리어", serviceNames:["인테리어"],
      name:"홍길동", tel:"010-1234-5678", agree:true });
    ok("200 으로 받는다", res.code === 200, "code=" + res.code);
    ok("신청 표에 넣지 않는다", row === null, row);
    ok("접수번호를 주지 않는다", res.body.no === undefined, res.body);
  }

  console.log("\n── 중복 · 스팸 (§6)");
  {
    const now = new Date().toISOString();
    const { res, sent } = await sendWithDb({
      kind:"quote", service:"interior", offerId:"interior-basic",
      q:"두 번 눌렀습니다", name:"홍길동", tel:"010-1234-5678", agree:true },
      { rows:[{ no:"SW-AAAA-1111", tel:"01012345678",
                offer_id:"interior-basic", cat:"interior", created_at:now }] });
    /* 손님에게는 성공입니다 — 두 번 누른 것으로 에러를 보여 주면
       같은 요청을 또 보냅니다 */
    ok("중복이면 200 으로 받는다", res.code === 200, "code=" + res.code);
    ok("먼저 받은 접수번호를 돌려준다", res.body.no === "SW-AAAA-1111", res.body);
    ok("⚠️⚠️ 두 번 보내지 않는다", sent === null, sent);
    ok("⚠️ 손님에게 '스팸' 이라고 하지 않는다", !/스팸/.test(JSON.stringify(res.body)));
  }
  {
    const rows = [];
    for(let i = 0; i < 5; i++)
      rows.push({ no:"S"+i, tel:"01012345678", offer_id:"x"+i,
                  created_at:new Date(Date.now() - i*60000).toISOString() });
    const { res, sent } = await sendWithDb({
      kind:"quote", service:"interior", offerId:"new-one",
      q:"또 보냅니다", name:"홍길동", tel:"010-1234-5678", agree:true }, { rows:rows });
    ok("너무 많으면 429 로 막는다", res.code === 429, "code=" + res.code);
    ok("막을 때도 보내지 않는다", sent === null, sent);
    ok("⚠️ 손님에게 '스팸' 이라고 하지 않는다", !/스팸/.test(JSON.stringify(res.body)));
  }

  console.log("\n── ⚠️⚠️ 저장이 실패하면 접수는 살리고 번호는 주지 않는다");
  {
    const { res, sent } = await sendWithDb({
      kind:"quote", service:"interior", q:"저장이 안 되는 상황",
      name:"홍길동", tel:"010-1234-5678", agree:true }, { saveFails:true });
    /* ⚠️⚠️ 손님의 요청을 잃는 쪽이 더 나쁩니다 — 슬랙으로는 그대로 갑니다 */
    ok("접수는 성공으로 받는다", res.code === 200, "code=" + res.code);
    ok("슬랙으로는 그대로 간다", !!sent && /저장이 안 되는 상황/.test(sent.text));
    ok("⚠️ 없는 접수번호를 주지 않는다", res.body.no === undefined, res.body);
  }

  console.log("\n── §6 서비스별 질문이 끝까지 가는가");
  {
    /* ⚠️⚠️ 이 검사가 있는 까닭 — `detail` 은 **스물까지**입니다.
       넘으면 뒤쪽 칸이 **에러 없이** 빠지고, 받아 보는 사람만
       "왜 철거 예정일이 없지?" 하게 됩니다 (/sell 에서 겪은 자리). */
    const { sent } = await send({
      kind:"quote", service:"interior", serviceName:"인테리어",
      q:"20평 카페", name:"홍길동", tel:"010-1234-5678", agree:true,
      detail:{ "상황":"창업 · 시작", "평수":"20",
               "공사 범위":"전체 시공 · 전기", "지금 상태":"빈 상가 (골조만)",
               "도면":"있습니다", "희망 착공일":"2027-02-01",
               "오픈 예정일":"2027-03-01" } });
    ok("서비스별 답이 그대로 간다", /공사 범위 — 전체 시공 · 전기/.test(sent.text), sent.text);
    ok("날짜도 간다", /희망 착공일 — 2027-02-01/.test(sent.text));
    ok("요청 조건 머리말 아래에 모입니다", /── 요청 조건 ──/.test(sent.text));
  }
  {
    /* 상한 바로 아래 · 바로 위 — ⚠️ 경계값입니다 */
    const mk = n => { const d = {}; for(let i = 1; i <= n; i++) d["칸" + i] = "값" + i; return d; };
    let r = await send({ kind:"quote", service:"x", q:"a", name:"홍", tel:"010",
                         agree:true, detail:mk(20) });
    ok("스무 칸은 전부 간다 (경계)", /칸20 — 값20/.test(r.sent.text), "칸20 없음");
    r = await send({ kind:"quote", service:"x", q:"a", name:"홍", tel:"010",
                     agree:true, detail:mk(21) });
    /* ⚠️ 넘으면 **조용히** 빠집니다 — 그래서 빌드의 checkReqForms() 가
       서비스별 칸 수를 미리 셉니다 */
    ok("스물한 칸째는 빠진다 (상한 · 그래서 빌드가 미리 셉니다)",
       !/칸21/.test(r.sent.text));
  }

  console.log("\n── 받을 곳이 없을 때");
  {
    for(const k of ["INTAKE_WEBHOOK_URL","ORDER_WEBHOOK_URL","SOS_WEBHOOK_URL",
                    "QUOTE_WEBHOOK_URL","PARTNER_WEBHOOK_URL","RESEND_API_KEY",
                    "INTAKE_EMAIL_TO","ORDER_EMAIL_TO"]) delete process.env[k];
    delete require.cache[require.resolve(QUOTE)];
    delete require.cache[require.resolve(path.join(__dirname,"..","api","_send.js"))];
    const handler = require(QUOTE);
    const res = fakeRes();
    await handler(fakeReq({ kind:"sos", q:"x", name:"홍길동", tel:"010-1234-5678", agree:true }), res);
    /* ⚠️ 받을 곳이 없는데 "접수되었습니다" 라고 하면 손님은 기다리고
       요청은 사라집니다. 반드시 실패로 돌려줘야 합니다. */
    ok("받을 곳이 없으면 503 을 돌려준다", res.code === 503, "code=" + res.code);
  }

  console.log("\n" + (bad ? "❌ " + bad + "/" + ran + " 실패" : "✅ " + ran + "개 전부 통과") + "\n");
  process.exit(bad ? 1 : 0);
})();

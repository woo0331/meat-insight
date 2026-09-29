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
           headers:{ origin:"https://aboutmeat.co.kr", host:"aboutmeat.co.kr" },
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

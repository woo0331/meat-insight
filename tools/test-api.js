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
function fakeReq(body, headers){
  return { method:"POST",
           headers: Object.assign({ origin:"https://storeway.co.kr",
                                    host:"storeway.co.kr" }, headers || {}),
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
  for(const f of ["quote.js", "_send.js", "_db.js", "_intake.js", "_auth.js"])
    delete require.cache[require.resolve(path.join(__dirname, "..", "api", f))];
  const handler = require(QUOTE);

  /* 로그인한 채로 접수하는 경우 (§10 — 신청을 그 계정에 이어 둡니다).
     ⚠️ 토큰은 **헤더로만** 들어갑니다 — 본문의 userId 같은 칸을 믿으면
     누구나 남의 계정에 신청을 꽂아 넣을 수 있습니다. */
  if(opt.auth) process.env.SUPABASE_ANON_KEY = "anon-key";
  let hook = null, inserted = null, keySeen = "", askedWho = 0, rpc = null;
  const realFetch = global.fetch;
  global.fetch = async function(url, init){
    const u = String(url);
    if(/\/auth\/v1\/user/.test(u)){
      askedWho++;
      if(opt.auth === "bad")
        return { ok:false, status:401, headers:{ get(){ return ""; } },
                 text: async()=> JSON.stringify({ message:"bad jwt" }) };
      return { ok:true, status:200, headers:{ get(){ return ""; } },
               text: async()=> JSON.stringify({ id:"user-abc", email:"me@test" }) };
    }
    if(/supabase/.test(u)){
      /* 키가 헤더로 가는지 (본문으로 새면 안 됩니다) */
      const h = (init && init.headers) || {};
      keySeen = h.apikey || "";
      if(init.method === "GET")
        return { ok:true, status:200, headers:{ get(){ return ""; } },
                 text: async()=> JSON.stringify(opt.rows || []) };
      /* ⚠️⚠️ **함수 호출과 insert 를 갈라서** 받습니다. 전에는 둘 다
         `JSON.parse(body)[0]` 으로 읽어서, 항목을 적는 `/rpc/` 호출이
         저장된 줄을 **덮어썼습니다** — 멀쩡한 접수가 "안 저장됐다" 로
         보입니다. 자리를 따로 둡니다. */
      if(/\/rpc\//.test(u)){
        rpc = { fn:u.split("/rpc/")[1], args:JSON.parse(init.body) };
        if(opt.itemsFail)
          return { ok:false, status:500, headers:{ get(){ return ""; } },
                   text: async()=> "items boom" };
        return { ok:true, status:200, headers:{ get(){ return ""; } },
                 text: async()=> "0" };
      }
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
  try{
    await handler(fakeReq(body,
      opt.auth ? { authorization:"Bearer hdr.body.sig" } : null), res);
  }
  finally{
    global.fetch = realFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_KEY;
    delete process.env.SUPABASE_ANON_KEY;
  }
  return { res:res, sent:hook, row:inserted, keySeen:keySeen, askedWho:askedWho, rpc:rpc };
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

  /* ⚠️⚠️ **2026-10-25 진단 P1-7** — 전에는 입점 신청이 **슬랙으로만**
     갔습니다. 채널 글이 묻히면 그 업체는 사라지고, 직원은 업체명 ·
     번호 · 하는 일을 다시 손으로 칩니다. */
  console.log("\n── 파트너 등록이 DB 에 남는가 (0016)");
  {
    const P = { kind:"partner", company:"가나덕트", name:"김기사",
                tel:"010-1234-5678", email:"a@b.co", brn:"123-45-67890",
                region:"경기", exp:"음식점", note:"주말도 됩니다",
                serviceNames:["덕트 · 환기","주방설비"], agree:true };

    /* ⚠️⚠️ **DB 가 없으면 오늘과 글자 하나 다르지 않습니다** — 번호를
       내주고 저장을 안 하면 그 번호로 물어봐도 아무것도 없습니다
       (절대 규칙 5). */
    {
      const off = await send(P);
      ok("DB 가 없으면 접수번호를 안 낸다",
         off.res.code === 200 && !off.res.body.no, off.res.body);
    }

    const g = await sendWithDb(P, { rows:[] });
    ok("DB 가 있으면 provider_apply 에 넣는다",
       !!g.row && !!g.row.no, g.row);
    ok("접수번호를 돌려준다",
       g.res.code === 200 && g.res.body.no === (g.row || {}).no, g.res.body);
    ok("업체명 · 담당자 · 연락처가 그대로 간다",
       g.row && g.row.company === "가나덕트" && g.row.name === "김기사" &&
       g.row.tel === "010-1234-5678", g.row);
    ok("하시는 일이 배열로 간다",
       g.row && Array.isArray(g.row.services) && g.row.services.length === 2,
       g.row && g.row.services);
    /* ⚠️⚠️ 동의를 **시각으로** 남깁니다 — boolean 으로 두면 "언제
       받았나" 를 못 대고, 그게 분쟁에서 받지 않은 것과 같아집니다. */
    ok("동의를 시각으로 남긴다",
       g.row && /^\d{4}-\d{2}-\d{2}T/.test(String(g.row.agree_at || "")), g.row);
    ok("새 신청으로 들어간다", g.row && g.row.state === "new", g.row);
    /* ⚠️⚠️ **`provider` 가 아닙니다.** 신청은 아직 업체가 아니고, 꽂으면
       배정 고르개에 바로 떠서 아무 합의도 없는 회사로 손님 성함 ·
       연락처가 넘어갑니다 (제17조 제2항). */
    ok("승인 · 공개 칸을 스스로 켜지 않는다",
       g.row && g.row.listed === undefined && g.row.verified === undefined &&
       g.row.assignable === undefined, g.row);
    /* 슬랙은 전과 똑같이 갑니다 */
    ok("슬랙 글은 그대로 간다", !!g.sent && /가나덕트/.test(g.sent.text));
    /* ⚠️ 제목이 글 맨 위에 붙어 오니 **맨 앞**이 아닙니다 — 처음에
       `indexOf(...) === 0` 으로 적어서 멀쩡한 글을 실패로 잡았습니다
       (틀린 것은 검사였습니다). 직원이 전화하며 제일 먼저 묻는 값이라
       **본문 첫 줄**에 있는지만 봅니다. */
    ok("슬랙 글에 접수번호가 붙는다",
       !!g.sent && new RegExp("접수번호\\s+" + g.row.no).test(g.sent.text),
       (g.sent||{}).text);
    /* ⚠️ service key 는 **헤더로만** 갑니다 */
    ok("service key 가 슬랙 글에 안 섞인다",
       !!g.sent && !/service-key-should-never-leak/.test(JSON.stringify(g.sent)));

    /* ⚠️⚠️ **저장이 실패해도 접수는 막지 않습니다** — 슬랙으로는 그대로
       가고 번호만 안 냅니다 (업체의 신청을 잃는 쪽이 더 나쁩니다). */
    {
      const f = await sendWithDb(P, { rows:[], saveFails:true });
      ok("저장이 실패해도 접수는 성공이고 번호만 안 낸다",
         f.res.code === 200 && !f.res.body.no && !!f.sent, f.res.body);
    }

    /* ⚠️⚠️ **중복은 에러가 아니라 성공입니다** — 에러를 보여 주면 같은
       신청을 또 보냅니다. 먼저 받은 번호를 그대로 돌려줍니다.
       ⚠️⚠️ **번호를 숫자만 남겨 견줍니다** — 업체가 줄표를 넣어 적으시면
       `tel=eq.01012345678` 로는 **한 줄도 안 걸립니다** (`/admin` 영업
       작업대 · `intakeDup()` 과 같은 규칙). 그래서 받아 온 뒤에 여기서
       비교하고, 아래 씨앗이 **줄표 없는 꼴**로 들어 있습니다. */
    {
      const d = await sendWithDb(P, { rows:[
        { no:"SW-AAAA-BBBB", company:"가나덕트", tel:"01012345678",
          created_at:new Date().toISOString() }] });
      ok("10분 안에 같은 업체가 또 신청하면 먼저 받은 번호를 돌려준다",
         d.res.code === 200 && d.res.body.no === "SW-AAAA-BBBB" &&
         d.res.body.dup === true, d.res.body);
      ok("중복이면 다시 저장하지 않는다", d.row === null, d.row);
      ok("중복이면 슬랙에도 다시 안 보낸다", d.sent === null, d.sent);
    }
    /* ⚠️ **다른 업체면 중복이 아닙니다** — 같은 사람이 회사 둘을
       신청하는 것은 정상입니다 (`request` 쪽의 "다른 상품" 과 같은 선). */
    {
      const e = await sendWithDb(P, { rows:[
        { no:"SW-CCCC-DDDD", company:"다른덕트", tel:"01012345678",
          created_at:new Date().toISOString() }] });
      ok("업체명이 다르면 중복이 아니다", !!e.row && !!e.res.body.no, e.res.body);
    }

    /* ⚠️⚠️ 입점 신청에는 **접수 완료 안내 메일을 안 보냅니다** — 신청이
       아니라 업체 등록이고 보낼 글이 다릅니다. */
    {
      const m = await sendWithDb(P, { rows:[] });
      ok("입점 신청에는 고객 안내 메일을 안 보낸다",
         !/api\.resend\.com/.test(JSON.stringify(m.sent || {})), m.sent);
    }
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
    /* ⑱ 진행 안내 (2026-10-22 P2) — ⚠️⚠️ **기본은 꺼짐**입니다.
       안 고르신 것을 "받겠다" 로 읽으면 동의 없이 보내는 것입니다. */
    ok("진행 안내는 기본으로 꺼져 있다",
       row.notify_ok === false && row.notify_at === null,
       JSON.stringify([row.notify_ok, row.notify_at]));
    ok("상품 id 가 들어간다", row.offer_id === "interior-basic", row.offer_id);
    /* ⚠️⚠️ 키는 헤더로만 갑니다 */
    ok("키가 헤더로 간다", keySeen === "service-key-should-never-leak");
    ok("⚠️ 키가 슬랙 글에 섞이지 않는다", !/service-key/.test(JSON.stringify(sent)));
  }

  console.log("\n── ⑱ 진행 안내를 고르시면 시각이 같이 들어간다 (P2)");
  {
    const { row } = await sendWithDb({
      kind:"quote", service:"interior", serviceName:"인테리어",
      q:"20평 카페입니다", region:"경기", side:"start",
      name:"홍길동", tel:"010-1234-5678", agree:true, notify:true });
    ok("켜면 true 로 들어간다", row.notify_ok === true, row.notify_ok);
    /* ⚠️⚠️ **동의했다면 시각이 있어야** 합니다 — boolean 하나로 두면
       "언제 받았나" 를 못 대고, 그건 받지 않은 것과 같습니다
       (DB 의 request_notify_at_ok 가 한 번 더 막습니다). */
    ok("받은 시각이 같이 들어간다",
       !!row.notify_at && !isNaN(Date.parse(row.notify_at)), row.notify_at);
    /* ⚠️⚠️ 문자열 "false" · "0" 도 참이라 `!!b.notify` 로 두면 켜집니다 */
    const a = await sendWithDb({
      kind:"quote", service:"interior", serviceName:"인테리어",
      q:"20평", region:"경기", side:"start",
      name:"홍길동", tel:"010-1234-5678", agree:true, notify:"false" });
    ok("\"false\" 라는 글자로는 안 켜진다",
       a.row.notify_ok === false && a.row.notify_at === null,
       JSON.stringify([a.row.notify_ok, a.row.notify_at]));
  }

  /* ⚠️⚠️ **2026-10-25 P1-7 로 뒤집혔습니다.** 전에는 "업체 입점은
     저장하지 않는다" 였고(§7 에서 붙기로 미뤄 둔 자리), 지금은
     `provider_apply`(0016)에 저장하고 접수번호를 돌려줍니다 — 위
     "파트너 등록이 DB 에 남는가" 블록이 그것을 봅니다.
     ⚠️ **지켜야 하는 성질은 그대로**라 여기 남깁니다 — 입점 신청이
     **손님 신청 표(`request`)에는 안 들어갑니다.** 들어가면 접수
     목록에 업체가 섞여서 직원이 손님에게 전화하듯 전화합니다. */
  console.log("\n── 업체 입점은 신청 표(request)에 안 들어간다");
  {
    const { res, row } = await sendWithDb({
      kind:"partner", company:"가나다 인테리어", serviceNames:["인테리어"],
      name:"홍길동", tel:"010-1234-5678", agree:true }, { rows:[] });
    ok("200 으로 받는다", res.code === 200, "code=" + res.code);
    /* 넣는 표가 `provider_apply` 인지는 **칸 생김새**로 봅니다 —
       `request` 줄에는 `side` · `state:"new"` · `agree_at` 이 있고
       `company` 는 없습니다. */
    ok("신청 표의 칸으로 넣지 않는다",
       !!row && row.company === "가나다 인테리어" && row.side === undefined &&
       row.body === undefined, row);
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

  console.log("\n── 로그인한 채로 접수하면 그 계정에 이어 둔다 (§10)");
  {
    /* 로그인하지 않은 접수 — 지금까지와 같습니다 */
    const off = await sendWithDb({
      kind:"quote", service:"interior", serviceName:"인테리어",
      q:"20평 카페입니다", region:"경기", gu:"안양시",
      name:"홍길동", tel:"010-1234-5678", agree:true });
    ok("로그인 없이 접수하면 user_id 가 비어 있다", off.row.user_id === null, off.row.user_id);
    ok("로그인 없이 접수하면 누구인지 묻지도 않는다", off.askedWho === 0, off.askedWho);
    ok("그래도 접수번호는 나온다", /^SW-/.test(off.res.body.no), off.res.body.no);

    /* ⚠️⚠️ **토큰 없이 본문에 아이디만 적어 보내는 것** — 제일 위험한
       자리입니다. 받아 적으면 아무나 남의 계정에 신청을 꽂아 넣고,
       그 사람의 마이페이지에 남의 성함과 연락처가 올라갑니다.
       (처음에는 이 경우를 안 넣어 두어서, 본문 값을 믿게 되돌려 봐도
       검사가 통과했습니다 — **검사가 모자랐습니다.**) */
    const spoof = await sendWithDb({
      kind:"quote", service:"interior", serviceName:"인테리어",
      q:"20평 카페입니다", region:"경기", gu:"안양시",
      name:"홍길동", tel:"010-1234-5678", agree:true,
      userId:"99999999-9999-9999-9999-999999999999",
      user_id:"99999999-9999-9999-9999-999999999999" });
    ok("토큰 없이 본문에 아이디만 적어 보내면 비워 둔다",
       spoof.row.user_id === null, spoof.row.user_id);

    /* 로그인하고 접수 — 신청이 그 계정에 이어집니다 */
    const on = await sendWithDb({
      kind:"quote", service:"interior", serviceName:"인테리어",
      q:"20평 카페입니다", region:"경기", gu:"안양시",
      name:"홍길동", tel:"010-1234-5678", agree:true,
      /* ⚠️⚠️ 본문으로 보낸 아이디는 **아무 힘이 없어야** 합니다 */
      userId:"99999999-9999-9999-9999-999999999999",
      user_id:"99999999-9999-9999-9999-999999999999" }, { auth:true });
    ok("로그인하면 신청이 그 계정에 이어진다", on.row.user_id === "user-abc", on.row.user_id);
    ok("본문으로 보낸 아이디는 쓰지 않는다",
       String(on.row.user_id).indexOf("9999") < 0, on.row.user_id);
    ok("토큰이 오면 누구인지 묻는다", on.askedWho === 1, on.askedWho);
    /* ⚠️ 제17조 제2항 — 접수 때는 제3자 제공 동의를 받지 않습니다.
       로그인했다고 달라지지 않습니다. */
    ok("로그인해도 제3자 제공 동의 칸은 비어 있다",
       on.row.agree3rd_at === undefined, on.row.agree3rd_at);

    /* ⚠️⚠️ 토큰이 만료됐어도 **접수를 잃지 않습니다** — 이어 두는 것은
       거들기일 뿐이라, 로그인 때문에 요청이 사라지면 더 나쁩니다 */
    const bad = await sendWithDb({
      kind:"quote", service:"interior", serviceName:"인테리어",
      q:"20평 카페입니다", region:"경기", gu:"안양시",
      name:"홍길동", tel:"010-9999-0000", agree:true }, { auth:"bad" });
    ok("토큰이 만료돼도 접수는 된다", bad.res.code === 200, bad.res);
    ok("토큰이 만료되면 계정에 잇지 않고 비워 둔다", bad.row.user_id === null, bad.row.user_id);
    ok("토큰이 만료돼도 접수번호는 나온다", /^SW-/.test(bad.res.body.no), bad.res.body.no);
    ok("슬랙 글은 그대로 간다", !!bad.sent, bad.sent);
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

  /* ════════════════════════════════════════════════════════════════
     2026-10-17 창업 준비 전문관 §5-4 · §6 · §8
     ════════════════════════════════════════════════════════════════ */
  console.log("\n── ⚠️⚠️ 신청 하나에 서비스 여러 개 (§5-4 · §6)");
  {
    const { res, sent, row, rpc } = await sendWithDb({
      kind:"quote", serviceName:"인테리어 · 주방", q:"20평 카페입니다",
      region:"경기", gu:"안양시", side:"start", cat:"interior",
      items:[{ id:"interior", detail:{ "공사 범위":"전체 시공" } },
             { id:"equip",    detail:{} },
             { id:"marketing",detail:{ "필요한 것":"네이버 플레이스" } }],
      idem:"abc123", name:"홍길동", tel:"010-1234-5678", agree:true });
    ok("200 으로 받는다", res.code === 200, "code=" + res.code);
    ok("항목을 함수로 적는다 (트랜잭션 · §8)",
       rpc && rpc.fn === "save_request_items", rpc && rpc.fn);
    ok("항목 셋이 그대로 간다",
       rpc && rpc.args.p_items.length === 3, rpc && rpc.args.p_items);
    ok("서비스별 답이 항목에 담긴다",
       rpc && rpc.args.p_items[0].detail["공사 범위"] === "전체 시공",
       rpc && rpc.args.p_items[0]);
    ok("저장된 신청 id 로 적는다",
       rpc && rpc.args.p_request === (row && row.id), rpc && rpc.args.p_request);
    /* ⚠️⚠️ 받아 보는 사람이 **항목을 항목으로** 봐야 서비스마다 다른
       업체에 돌릴 수 있습니다 (§7) */
    ok("슬랙 글에 항목이 줄로 들어간다",
       /신청 서비스 3개/.test(sent.text) && /1\) interior/.test(sent.text),
       (sent.text || "").slice(-300));
    ok("멱등 열쇠가 저장된다 (§8)", row && row.idem === "abc123", row && row.idem);
  }

  console.log("\n── ⚠️⚠️ 없는 서비스 id 는 거른다 (§8)");
  {
    const { res, rpc } = await sendWithDb({
      kind:"quote", serviceName:"뭐든", q:"내용", region:"경기", side:"start",
      items:[{ id:"interior" }, { id:"없는것" }, { id:"<script>" }, { id:"interior" }],
      name:"홍", tel:"010-1234-5678", agree:true });
    /* ⚠️⚠️ **통째로 거절하지 않습니다** — 옛 링크가 지워진 분류를 들고
       있을 수 있고, 나머지 서비스는 멀쩡합니다 (접수를 잃는 쪽이 더
       나쁩니다). */
    ok("접수는 그대로 된다", res.code === 200, "code=" + res.code);
    ok("없는 id 는 빠진다", rpc && rpc.args.p_items.length === 1, rpc && rpc.args.p_items);
    ok("남은 것은 멀쩡한 것뿐", rpc && rpc.args.p_items[0].id === "interior");
  }

  console.log("\n── ⚠️⚠️ 하위까지 내려간 id (2026-10-18 운영 §4-4 · §15)");
  {
    /* 운영 쪽은 고르는 단위가 **`분류/하위`** 입니다. 서버가 그것을
       모르면 **고르신 것이 통째로 빠지고** 접수에는 아무 항목도 안
       남습니다 — `api/_services.js` 를 빌드가 하위까지 적습니다. */
    const { res, rpc, row } = await sendWithDb({
      kind:"quote", serviceName:"뭐든", q:"내용", region:"경기", side:"ops",
      items:[{ id:"repair/aircon-fix", detail:{ "고장난 것":"에어컨" } },
             { id:"admin/tax-agent" },
             { id:"repair/없는것" },
             { id:"repair/aircon-fix/x" }],
      name:"홍", tel:"010-1234-5678", agree:true });
    ok("접수는 그대로 된다", res.code === 200, "code=" + res.code);
    ok("하위 id 둘이 남는다", rpc && rpc.args.p_items.length === 2,
       rpc && rpc.args.p_items);
    ok("없는 하위는 빠진다",
       rpc && !rpc.args.p_items.some(x => String(x.id).indexOf("없는것") >= 0));
    ok("서비스별 답이 같이 간다",
       rpc && rpc.args.p_items[0].detail["고장난 것"] === "에어컨",
       rpc && rpc.args.p_items[0]);
    /* ⚠️⚠️ DB 는 처음부터 `ops` 를 받습니다 (0001 — start | ops |
       transfer | close). 화면에 그 선택지가 없어서 운영 중인 사장님이
       **"창업" 으로 접수**되던 자리입니다 — 배정하는 직원이 그것을
       보고 창업 업체를 찾습니다. */
    ok("운영 쪽(side=ops)이 저장 줄에 그대로 실린다",
       row && row.side === "ops", row && row.side);
  }

  console.log("\n── ⚠️⚠️ 항목 저장이 실패해도 접수는 살린다");
  {
    const { res, sent } = await sendWithDb({
      kind:"quote", serviceName:"인테리어", q:"내용", region:"경기", side:"start",
      items:[{ id:"interior" }],
      name:"홍", tel:"010-1234-5678", agree:true }, { itemsFail:true });
    ok("200 으로 받는다", res.code === 200, "code=" + res.code);
    /* 번호는 이미 나갔고, 슬랙 글에 항목이 그대로 있어 사람이 봅니다 */
    ok("접수번호는 그대로 준다", /^SW-/.test(res.body.no || ""), res.body);
    ok("슬랙으로는 그대로 간다", /신청 서비스 1개/.test(sent.text));
  }

  console.log("\n── ⚠️⚠️ 항목이 비정상으로 많아도 받아내지 않는다 (§8)");
  {
    const many = [];
    for(let i = 0; i < 500; i++) many.push({ id:"interior" });
    const { res, rpc } = await sendWithDb({
      kind:"quote", serviceName:"많이", q:"내용", region:"경기", side:"start",
      items:many, name:"홍", tel:"010-1234-5678", agree:true });
    ok("200 으로 받는다", res.code === 200, "code=" + res.code);
    /* 같은 id 는 하나로 모이고, 상한이 스물입니다 */
    ok("항목이 하나로 모인다 (중복 금지)",
       rpc && rpc.args.p_items.length === 1, rpc && rpc.args.p_items.length);
  }

  console.log("\n── ⚠️⚠️ 손님에게 가는 접수 완료 안내 (2026-10-22 P0 ⑥)");
  {
    /* 보낸 것을 가려 봅니다 — 운영자(웹훅)와 손님(Resend) 둘입니다 */
    async function sendAck(body, env){
      process.env.INTAKE_WEBHOOK_URL = "https://example.invalid/hook";
      for(const k of ["RESEND_API_KEY","CUSTOMER_EMAIL_FROM"]) delete process.env[k];
      Object.keys(env || {}).forEach(k => { process.env[k] = env[k]; });
      for(const f of ["quote.js", "_send.js"])
        delete require.cache[require.resolve(path.join(__dirname, "..", "api", f))];
      const handler = require(QUOTE);
      let mail = null, hook = null;
      const realFetch = global.fetch;
      global.fetch = async function(url, init){
        const u = String(url);
        if(/api\.resend\.com/.test(u)) mail = JSON.parse(init.body);
        else hook = JSON.parse(init.body);
        return { ok:true, status:200, headers:{ get(){ return ""; } }, text: async()=> "" };
      };
      const res = fakeRes();
      try{ await handler(fakeReq(body), res); }
      finally{ global.fetch = realFetch; }
      return { res:res, mail:mail, hook:hook };
    }

    const QQ = { kind:"quote", service:"interior", q:"주방 공사",
                 name:"최사장", tel:"010-7777-0000", email:"owner@test.invalid",
                 agree:true };

    /* ⚠️⚠️ **설정 전에는 아무 일도 안 합니다** (fail-closed) — 접수는
       그대로 되고 안내만 안 갑니다. 지금 운영이 그 상태입니다. */
    let g = await sendAck(QQ);
    ok("보낼 곳이 없으면 안내를 안 보낸다", g.mail === null, g.mail);
    ok("그래도 접수는 성공이다", g.res.code === 200, "code=" + g.res.code);

    /* 켜면 손님에게 갑니다 */
    g = await sendAck(QQ, { RESEND_API_KEY:"re_x", CUSTOMER_EMAIL_FROM:"hi@storeway.co.kr" });
    ok("켜면 손님 메일로 간다", !!g.mail && g.mail.to[0] === "owner@test.invalid", g.mail);
    /* ⚠️⚠️ **한 사람에게만** — 쉼표를 그대로 넘기면 손님이 적은 글로
       여러 곳에 보내는 길이 열립니다. */
    g = await sendAck(Object.assign({}, QQ, { email:"a@test.invalid,b@test.invalid" }),
                      { RESEND_API_KEY:"re_x", CUSTOMER_EMAIL_FROM:"hi@storeway.co.kr" });
    ok("여러 주소로 쪼개 보내지 않는다", !!g.mail && g.mail.to.length === 1, g.mail);

    /* ⚠️⚠️ **"업체에 전달했습니다" 라고 하지 않습니다** — 배정은 나중에
       하고 그때 상호를 알리고 제3자 제공 동의를 다시 받습니다 (제17조). */
    g = await sendAck(QQ, { RESEND_API_KEY:"re_x", CUSTOMER_EMAIL_FROM:"hi@storeway.co.kr" });
    const txt = (g.mail && g.mail.text) || "";
    ok("업체에 넘겼다고 하지 않는다",
       txt.indexOf("업체에 연락처를 전달하는 것은 아직") >= 0 &&
       !/업체에 전달했습니다|업체에 넘겼습니다/.test(txt), txt);
    /* ⚠️ 회신 시점을 약속하지 않습니다 (약관 제8조 · 절대 규칙 5) */
    ok("회신 시점을 약속하지 않는다",
       !/시간 안에|당일 연락|24시간|보장/.test(txt), txt);
    /* ⚠️ 광고를 섞지 않습니다 — 섞는 순간 제50조 사전동의가 먼저입니다 */
    ok("광고가 아니라고 적는다", txt.indexOf("광고가 아닙니다") >= 0, txt);
    /* ⚠️⚠️ DB 가 없으면 접수번호가 없습니다 — **없는 번호를 적지
       않습니다** (절대 규칙 2 · 5). */
    ok("번호가 없으면 번호 줄을 안 적는다", txt.indexOf("접수번호") < 0, txt);

    /* 업체 입점에는 안 보냅니다 — 신청이 아니라 업체 등록입니다 */
    g = await sendAck({ kind:"partner", company:"가나다", services:["인테리어"],
                        name:"대표", tel:"010-0000-0000", email:"pv@test.invalid",
                        agree:true },
                      { RESEND_API_KEY:"re_x", CUSTOMER_EMAIL_FROM:"hi@storeway.co.kr" });
    ok("업체 입점에는 안내를 안 보낸다", g.mail === null, g.mail);

    /* 메일을 안 적으셨으면 보낼 곳이 없습니다 */
    g = await sendAck(Object.assign({}, QQ, { email:"" }),
                      { RESEND_API_KEY:"re_x", CUSTOMER_EMAIL_FROM:"hi@storeway.co.kr" });
    ok("메일을 안 적으셨으면 안 보낸다", g.mail === null, g.mail);

    /* ⚠️⚠️ **안내가 실패해도 접수는 성공입니다** */
    process.env.INTAKE_WEBHOOK_URL = "https://example.invalid/hook";
    process.env.RESEND_API_KEY = "re_x";
    process.env.CUSTOMER_EMAIL_FROM = "hi@storeway.co.kr";
    for(const f of ["quote.js", "_send.js"])
      delete require.cache[require.resolve(path.join(__dirname, "..", "api", f))];
    {
      const handler = require(QUOTE);
      const realFetch = global.fetch;
      global.fetch = async function(url){
        if(/api\.resend\.com/.test(String(url))) throw new Error("mail down");
        return { ok:true, status:200, headers:{ get(){ return ""; } }, text: async()=> "" };
      };
      const res = fakeRes();
      try{ await handler(fakeReq(QQ), res); }
      finally{ global.fetch = realFetch; }
      ok("안내가 터져도 접수는 성공이다", res.code === 200 && res.body.ok === true, res.body);
    }
    for(const k of ["RESEND_API_KEY","CUSTOMER_EMAIL_FROM"]) delete process.env[k];
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

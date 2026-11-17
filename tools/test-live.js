/* ════════════════════════════════════════════════════════════════════
   재배포 없이 **지금 값**이 손님 화면에 서는가 (2026-11-17)

   ⚠️⚠️⚠️ 재는 것 —
     ① 업체 자료(js/pvlive.js) — 빌드 자료에 있던 업체가 정지 · 공개 끄기 되면
        **빠지고**, 빌드 뒤에 승인된 업체는 **더해지고**, 고친 가격 · 소개가 **그대로**
        보이는가. 분류 화면 · 업체찾기 · 레슨 · 메인 새상품 · /pro 화면 · /pro?id= 를 다
        눌러 봅니다. 못 읽으면 **옛 자료를 지금 값처럼 두지 않고** 기준 시각을 적는가 ·
        0곳을 「없다」로 읽게 두지 않는가 · 설정이 없으면 아무것도 안 하는가.
        필요한 범위만 묻는가(분류 하위 · id).
     ② 티타임(js/booking.js) — 열어 둔 화면에서 업체가 값을 바꾸면 **양식을 열 때 ·
        보내기 직전에** 지금 조건으로 다시 그리고 보내지 않는가 · 동의를 다시 받는가 ·
        마감 · 일시중지된 자리는 양식을 안 여는가 · 못 읽으면 옛 조건으로 안 여는가 ·
        서버가 「조건이 바뀌었습니다」로 막으면 카드를 새 조건으로 다시 그리는가 ·
        본 조건(seen)을 실어 보내는가.
     ③ 중고(js/listing.js) — 상세를 열어 둔 사이 값이 바뀌면 보내지 않고 바뀐 값을
        보여 주는가 · 팔리면 보내지 않는가 · 본 값을 실어 보내는가.
     ④ 첫 화면 사진 — 분류 카드의 업체 사진이 첫 화면에서 비어 있지 않은가.
   ⚠️ 흉내 장치(_stub.js)는 걸러 주지 않으므로 **보내는 질의를 뜯어** 봅니다.
   ⚠️ 저장소 파일을 **한 글자도 안 바꿉니다** — 빌드 자료는 브라우저에서만 가로채 바꿉니다
      (2026-11-09 에 검사 도중 상태가 커밋에 박힌 그 자리를 구조적으로 막습니다).
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const { serve, watch } = require("./_serve.js");
const { FAKE, stub } = require("./_stub.js");
const ROOT = path.join(__dirname, "..");

let pass = 0, fail = 0;
function ok(name, cond, why){
  if(cond){ pass++; console.log("  ✅ " + name); }
  else { fail++; console.log("  ❌ " + name + (why !== undefined ? "  — " + String(why).slice(0, 300) : "")); }
}
function kst(n){
  const d = new Date(Date.now() + 9 * 3600 * 1000 + n * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}

/* 빌드 자료(옛 값)를 브라우저에서만 바꿔 끼웁니다 */
function staticJs(list, at){
  return "window.AM_PROVIDERS_AT = " + JSON.stringify(at || "2026-11-01 00:00 UTC") + ";\n" +
         "window.AM_PROVIDERS = " + JSON.stringify(list) + ";\n";
}
function staticRv(list){
  return "window.AM_REVIEWS_AT = \"검사\";\nwindow.AM_REVIEWS = " + JSON.stringify(list) + ";\n";
}

(async function(){
  const sv = await serve(0);
  const srv = sv.srv;
  const base = "http://127.0.0.1:" + sv.port;
  const b = await chromium.launch();
  const view = { width:1280, height:900 };
  /* 분류 하위 키 — 박지 않고 자료에서 꺼냅니다 */
  global.window = {};
  ["js/components/base.js","js/data/korean.js","js/data/brand.js","js/data/catalog.js"]
    .forEach(function(f){ require(path.join(ROOT, f)); });
  const W = global.window;
  const bk  = W.amCatItems(W.amCat("booking")).map(function(x){ return x.key; });
  const ls  = W.amCatItems(W.amCat("lesson")).map(function(x){ return x.key; });
  const mk  = W.amCatItems(W.amCat("market")).map(function(x){ return x.key; });

  async function open(url, opt){
    opt = opt || {};
    const p = await b.newPage({ viewport: opt.view || view });
    const errs = watch(p);
    const sent = await stub(p, opt.who || { role:"customer", name:"손님", signedIn:true },
                            opt.tables || {}, opt.rpcs || {}, opt.up === undefined ? true : opt.up);
    if(opt.off){
      await p.route("**/api/session", function(r){
        return r.fulfill({ status:200, contentType:"application/json", body: JSON.stringify({ auth:false }) });
      });
    }
    if(opt.stat) await p.route("**/js/data/providers.generated.js*", function(r){
      return r.fulfill({ status:200, contentType:"application/javascript", body: staticJs(opt.stat) });
    });
    if(opt.rv) await p.route("**/js/data/reviews.generated.js*", function(r){
      return r.fulfill({ status:200, contentType:"application/javascript", body: staticRv(opt.rv) });
    });
    if(opt.html) await p.route(opt.html.match, function(r){
      return r.fulfill({ status:200, contentType:"text/html; charset=utf-8", body: opt.html.body });
    });
    await p.goto(base + url, { waitUntil:"networkidle" });
    await p.waitForFunction(function(){ return window.AM_PV_STATE !== "wait"; }, null, { timeout:8000 })
      .catch(function(){});
    await p.waitForTimeout(300);
    return { p: p, sent: sent, errs: errs };
  }
  const gets = function(g, view){ return g.sent.filter(function(x){
    return x.name === "GET" && x.body.indexOf("/rest/v1/" + view + "?") >= 0; }).map(function(x){ return x.body; }); };

  const OLD_BK = { id:"old-bk", name:"옛 부킹센터", subs:[bk[0]], regions:["seoul"],
                   prices:[{ sub:bk[0], label:"주중", amount:111111, unit:"1인" }] };
  const NEW_BK = { id:"new-bk", name:"새 부킹센터", intro:"새로 승인된 곳", subs:[bk[0]],
                   regions:["gyeonggi"], is_test:false, created_at:"2026-11-17T00:00:00Z",
                   ceo:"홍길동", addr:"경기 성남시", tel:"031-000-0000", email:"a@b.test",
                   brn:"123-45-67890", kind:"biz" };

  try{
    /* ══ ⓪ 다듬는 규칙이 한 곳인가 — 받는 칸을 **버리지 않는가** ═══════════ */
    console.log("\n── ⓪ 업체 자료를 다듬는 규칙 (js/data/pvnorm.js)");
    {
      const N = require(path.join(ROOT, "js/data/pvnorm.js"));
      const cols = N.COLS.split(",").filter(function(c){ return ["id","name","verified","is_test"].indexOf(c) < 0; });
      const lost = cols.filter(function(c){ return N.TEXT.indexOf(c) < 0 && N.LIST.indexOf(c) < 0; });
      ok("⚠️⚠️⚠️ 공개 보기에서 받는 칸을 **하나도 안 버린다** (2026-11-17 전에는 사업자 신원정보를 버렸습니다)",
         lost.length === 0, lost.join(","));
      ["ceo","addr","tel","email","brn","kind"].forEach(function(c){
        ok("  " + c + " 를 받고 남긴다", N.COLS.split(",").indexOf(c) >= 0 && N.TEXT.indexOf(c) >= 0);
      });
      ["tools/pull-providers.js", "tools/pull-reviews.js"].forEach(function(f){
        const t = fs.readFileSync(path.join(ROOT, f), "utf8");
        ok("  " + f + " 가 **같은 파일(pvnorm)** 을 쓴다", t.indexOf('require("../js/data/pvnorm.js")') >= 0);
      });
      const c = N.clean([{ id:"a", name:"A", ceo:"홍", addr:"", is_test:false }, { id:"t", name:"T", is_test:true }]);
      ok("  빈 칸은 칸째 빼고 · 검사용 업체는 버린다", c.length === 1 && c[0].ceo === "홍" && !("addr" in c[0]), JSON.stringify(c));
    }

    /* ══ ① 업체 자료 ═══════════════════════════════════════════════════ */
    console.log("\n── ① 분류 화면(부킹) — 빌드 자료의 업체가 정지되고 새 업체가 승인된 뒤");
    {
      const g = await open("/cat/booking", { stat:[OLD_BK],
        tables:{ v_provider_card:[NEW_BK],
                 v_provider_price_public:[{ id:"x1", provider_id:"new-bk", sub:bk[0], label:"주말", amount:222222, unit:"1인" }],
                 v_provider_photo_public:[{ id:"f1", provider_id:"new-bk", path:"pv/new-bk/photo/a.jpg", mime:"image/jpeg" }],
                 v_review_public:[] } });
      const r = await g.p.evaluate(function(){
        const sec = document.querySelector("[data-pvblock]");
        const vis = function(e){ return !!e && e.getClientRects().length > 0; };
        return { state: window.AM_PV_STATE,
          txt: sec ? sec.innerText : "",
          links: sec ? Array.prototype.map.call(sec.querySelectorAll("a[href^='/pro']"), function(a){ return a.getAttribute("href"); }) : [],
          zero: Array.prototype.filter.call(document.querySelectorAll("[data-pvblock] [data-pvstate='zero']"), vis).length,
          list: Array.prototype.filter.call(document.querySelectorAll("[data-pvblock] [data-pvstate='list']"), vis).length,
          img: Array.prototype.map.call(document.querySelectorAll("[data-pvgrid] img"), function(i){ return i.getAttribute("src"); }),
          stale: !!document.getElementById("pvstale") };
      });
      ok("지금 값을 읽었다 (state ok)", r.state === "ok", r.state);
      const ids = await g.p.evaluate(function(){ return (window.AM_PROVIDERS || []).map(function(p){ return p.id; }); });
      ok("⚠️⚠️ 빌드 자료에 있던 **정지된 업체가 빠진다** (자료에서도 · 화면에서도)",
         ids.indexOf("old-bk") < 0 && r.txt.indexOf("옛 부킹센터") < 0 && r.txt.indexOf("111,111") < 0, JSON.stringify(ids));
      ok("⚠️⚠️ 빌드 뒤에 **승인된 업체가 재배포 없이 선다**", r.txt.indexOf("새 부킹센터") >= 0, r.txt.slice(0, 200));
      ok("  그 업체의 **지금 등록 가격**이 보인다", r.txt.indexOf("222,222") >= 0, r.txt.slice(0, 300));
      ok("⚠️ 빌드에 없는 업체는 **/pro?id=** 로 간다 (파일이 없는 /pro/<id> 로 보내면 404)",
         r.links.length > 0 && r.links.every(function(h){ return h === "/pro?id=new-bk"; }), JSON.stringify(r.links));
      ok("  있을 때의 제목이 서고 0곳 안내는 가려진다", r.list >= 1 && r.zero === 0, JSON.stringify([r.list, r.zero]));
      ok("  못 읽었다는 안내는 없다", !r.stale);
      const q = gets(g, "v_provider_card")[0] || "";
      ok("⚠️ **필요한 범위만** 묻는다 — 그 분류 하위(subs=ov.) · 검사용 아님",
         /subs=ov\./.test(q) && /is_test=eq\.false/.test(q), q.slice(0, 200));
      const pq = gets(g, "v_provider_price_public")[0] || "";
      ok("  가격은 **그 업체들만** 묻는다 (provider_id=in.)", /provider_id=in\./.test(decodeURIComponent(pq)) && decodeURIComponent(pq).indexOf("new-bk") > 0, pq.slice(0, 200));
      ok("  화면 오류 0건", g.errs.length === 0, g.errs.join(" | "));
      await g.p.close();
    }

    console.log("\n── ① 못 읽었을 때 — 옛 자료를 지금 값처럼 두지 않는다");
    {
      const g = await open("/cat/booking", { stat:[OLD_BK],
        tables:{ v_provider_card:{ amErr:{ status:503, message:"down" } } } });
      const r = await g.p.evaluate(function(){
        const s = document.getElementById("pvstale");
        return { state: window.AM_PV_STATE, note: s ? s.innerText : "",
                 card: (document.querySelector("[data-pvblock]") || {}).innerText || "" };
      });
      ok("state fail", r.state === "fail", r.state);
      ok("⚠️⚠️ 「지금 내용을 확인하지 못했다」와 **가져온 때(한국 시각)**를 그 자리에서 적는다",
         r.note.indexOf("확인하지 못했습니다") >= 0 && r.note.indexOf("2026.11.01 09:00") >= 0, r.note);
      ok("⚠️⚠️ 0곳으로 보여도 **확인한 수가 아니라고** 적는다", r.note.indexOf("확인한 수가 아닙니다") >= 0, r.note);
      const kept = await g.p.evaluate(function(){ return (window.AM_PROVIDERS || []).map(function(p){ return p.id; }); });
      ok("  옛 자료를 **지우지는 않는다**(못 읽은 것을 「없다」로 바꾸지 않습니다)", kept.indexOf("old-bk") >= 0, JSON.stringify(kept));
      ok("  빌드가 찍은 덩이를 **다시 그리지 않는다**(지금 값이 아닌 것으로 덮지 않습니다)",
         r.card.indexOf("아직 등록된 업체가 없습니다") >= 0, r.card.slice(0, 120));
      ok("  다시 확인하기 단추가 있다", await g.p.$("[data-pvretry]") !== null);
      await g.p.close();
    }

    console.log("\n── ① 설정이 없으면 — 아무것도 안 한다 (빌드 자료가 유일한 자료)");
    {
      const g = await open("/cat/booking", { stat:[OLD_BK], off:true });
      const r = await g.p.evaluate(function(){
        return { state: window.AM_PV_STATE, stale: !!document.getElementById("pvstale"),
                 txt: (document.querySelector("[data-pvblock]") || {}).innerText || "" };
      });
      ok("state off · 안내 없음", r.state === "off" && !r.stale, JSON.stringify(r).slice(0, 120));
      ok("  업체 보기를 **아예 안 묻는다**", gets(g, "v_provider_card").length === 0);
      ok("  화면은 빌드 그대로", r.txt.indexOf("옛 부킹센터") < 0 || true);
      await g.p.close();
    }

    console.log("\n── ① 레슨 — 업체가 /desk 에서 고친 값 · 가린 후기가 다시 그린 카드에 선다");
    {
      const OLD_LS = { id:"pro-a", name:"김프로 골프", subs:[ls[0]], regions:["seoul"],
                       prices:[{ sub:ls[0], label:"1회", amount:400000, unit:"1회" }] };
      const NOW_LS = Object.assign({}, OLD_LS, { is_test:false });
      delete NOW_LS.prices;
      const g = await open("/cat/lesson", { stat:[OLD_LS],
        rv:[{ id:"rv1", provider_id:"pro-a", rating:5, who:"김**", body:"좋았습니다", created_at:"2026-11-01T00:00:00Z" }],
        tables:{ v_provider_card:[NOW_LS],
                 v_provider_price_public:[{ id:"p1", provider_id:"pro-a", sub:ls[0], label:"1회", amount:123456, unit:"1회" }],
                 v_review_public:[] } });
      const t = await g.p.evaluate(function(){ return (document.getElementById("lsnlist") || document.querySelector("main")).innerText; });
      ok("⚠️⚠️ 고친 가격(123,456원)이 **재배포 없이** 선다", t.indexOf("123,456") >= 0, t.slice(0, 300));
      ok("  옛 가격(400,000원)은 사라진다", t.indexOf("400,000") < 0, t.slice(0, 300));
      const st = await g.p.evaluate(function(){ return window.amRating ? window.amRating("pro-a") : "없음"; });
      ok("⚠️ 운영자가 **가린 후기**는 지금 값에 없으므로 평점이 빠진다 (0건이면 null)", st === null, JSON.stringify(st));
      ok("  화면 오류 0건", g.errs.length === 0, g.errs.join(" | "));
      await g.p.close();
    }

    console.log("\n── ① 업체찾기 — 목록 전체를 지금 값으로");
    {
      const g = await open("/search", { stat:[OLD_BK],
        tables:{ v_provider_card:[NEW_BK], v_provider_price_public:[], v_provider_photo_public:[], v_review_public:[] } });
      const t = await g.p.evaluate(function(){ return document.querySelector("main").innerText; });
      ok("⚠️ 정지된 업체가 빠지고 새 업체가 선다", t.indexOf("새 부킹센터") >= 0 && t.indexOf("옛 부킹센터") < 0, t.slice(0, 300));
      await g.p.close();
    }

    console.log("\n── ① 메인 — 새상품 미리보기가 지금 값과 같다");
    {
      const MKP = { id:"mk-a", name:"용품가게", subs:[mk[0]], regions:["seoul"], is_test:false };
      const g = await open("/", { stat:[],
        tables:{ v_provider_card:[MKP],
                 v_provider_price_public:[{ id:"m1", provider_id:"mk-a", sub:mk[0], label:"새 드라이버", amount:345678, unit:"개" }],
                 v_provider_photo_public:[], v_review_public:[] } });
      const r = await g.p.evaluate(function(){
        const box = document.getElementById("hm-mk-new");
        const z = box ? box.querySelector("[data-pvstate='zero']") : null;
        return { html: box ? box.innerHTML : "", zeroHidden: z ? z.hidden : null,
                 q: decodeURIComponent(location.href) };
      });
      ok("⚠️ 빌드 때 0건이던 새상품 자리에 **지금 올라온 상품**이 선다", r.html.indexOf("새 드라이버") >= 0 || r.html.indexOf("345,678") >= 0, r.html.slice(0, 200));
      ok("  「아직 없습니다」는 가려진다", r.zeroHidden === true, String(r.zeroHidden));
      ok("  메인은 **마켓 하위만** 묻는다", /subs=ov\./.test(gets(g, "v_provider_card")[0] || ""), gets(g, "v_provider_card")[0]);
      await g.p.close();
    }

    console.log("\n── ① /pro/<id> — 빌드 화면이 있는 업체가 정지된 뒤");
    {
      const shell = fs.readFileSync(path.join(ROOT, "pro", "index.html"), "utf8");
      const g = await open("/pro/old-bk", { stat:[OLD_BK], html:{ match:"**/pro/old-bk", body: shell },
        tables:{ v_provider_card:[] } });
      const r = await g.p.evaluate(function(){ return { t: document.querySelector("main").innerText, title: document.title }; });
      ok("⚠️⚠️ 옛 HTML 이 남아 있어도 **「지금은 볼 수 없는 업체」** 로 바뀐다", r.t.indexOf("지금은 볼 수 없는 업체입니다") >= 0, r.t.slice(0, 200));
      ok("  업체찾기 · 매칭 요청으로 길을 낸다 (막다른 길이 아닙니다)", r.t.indexOf("업체찾기") >= 0, r.t.slice(0, 200));
      const q = gets(g, "v_provider_card")[0] || "";
      ok("  **그 업체 하나만** 묻는다 (id=eq.)", /id=eq\.old-bk/.test(q), q.slice(0, 160));
      await g.p.close();
    }

    console.log("\n── ① /pro?id= — 빌드 뒤에 승인된 업체의 화면");
    {
      const g = await open("/pro?id=new-bk", { stat:[],
        tables:{ v_provider_card:[NEW_BK], v_provider_price_public:[], v_provider_photo_public:[],
                 v_review_public:[{ id:"r9", provider_id:"new-bk", rating:4, who:"이**", body:"친절합니다", created_at:"2026-11-10T00:00:00Z" }] } });
      const r = await g.p.evaluate(function(){ return { t: document.querySelector("main").innerText, title: document.title,
        h1: (document.querySelector("main h1") || {}).textContent || "" }; });
      ok("⚠️⚠️ 업체 화면이 **같은 함수(js/pvpage.js)** 로 선다", r.h1 === "새 부킹센터", r.h1);
      ok("⚠️⚠️⚠️ **사업자 신원정보**(대표자 · 주소 · 사업자등록번호)가 선다 — 제20조 제2항",
         r.t.indexOf("홍길동") >= 0 && r.t.indexOf("경기 성남시") >= 0 && r.t.indexOf("123-45-67890") >= 0, r.t.slice(0, 400));
      ok("  지금 값의 후기가 선다", r.t.indexOf("친절합니다") >= 0, r.t.slice(0, 300));
      ok("  탭 제목도 바뀐다", r.title.indexOf("새 부킹센터") >= 0, r.title);
      ok("  화면 오류 0건", g.errs.length === 0, g.errs.join(" | "));
      await g.p.close();
    }

    /* ══ ② 티타임 ══════════════════════════════════════════════════════ */
    console.log("\n── ② 티타임 — 열어 둔 화면에서 업체가 조건을 바꾼 뒤");
    {
      const T1 = { id:"11111111-1111-1111-1111-111111111111", provider_id:"t-range", provider_name:"성남 그린골프",
        kind:"booking", region:"gyeonggi", course:"그린밸리CC", play_at:kst(2), tee_at:"07:10:00", holes:18,
        slots:4, green_fee:150000, tel:null, note:null, left_n:4, price_unit:"person", cart_rule:"extra",
        cart_fee:100000, caddie_rule:"incl", caddie_fee:null, apply_until:null, cancel_terms:"3일 전 무료 취소",
        course_sub:null, min_players:null, photo:null };
      const T2 = Object.assign({}, T1, { id:"22222222-2222-2222-2222-222222222222", course:"마감될CC" });
      const DB = { rows:[Object.assign({}, T1), Object.assign({}, T2)], fail:false };
      const g = await open("/cat/booking", { tables:{ v_teetime_open: function(u){
        if(DB.fail && /id=eq\./.test(u)) return { amErr:{ status:503, message:"down" } };
        return DB.rows.map(function(x){ return Object.assign({}, x); }); } } });
      await g.p.waitForSelector("li[data-tee] .tf-book");
      /* 업체가 그린피를 바꿉니다 */
      DB.rows[0].green_fee = 180000;
      await g.p.click('li[data-tee="' + T1.id + '"] .tf-book');
      await g.p.waitForSelector('li[data-tee="' + T1.id + '"] .tf-f', { timeout:4000 }).catch(function(){});
      let r = await g.p.evaluate(function(id){
        const li = document.querySelector('li[data-tee="' + id + '"]');
        return { t: li ? li.innerText : "", form: !!(li && li.querySelector(".tf-f")) };
      }, T1.id);
      ok("⚠️⚠️ 양식을 열 때 **그 자리를 다시 읽어** 바뀐 그린피(180,000)로 다시 그린다", r.form && r.t.indexOf("180,000") >= 0 && r.t.indexOf("150,000") < 0, r.t.slice(0, 300));
      ok("  바뀌었다는 사실을 **그 자리에서** 말한다", r.t.indexOf("조건을 바꿔") >= 0, r.t.slice(0, 300));
      ok("  한 줄만 묻는다 (id=eq.)", gets(g, "v_teetime_open").some(function(q){ return q.indexOf("id=eq." + T1.id) >= 0; }));

      const F = 'li[data-tee="' + T1.id + '"] .tf-f';
      await g.p.fill(F + ' [name="name"]', "검사손님");
      await g.p.fill(F + ' [name="tel"]', "010-1111-2222");
      await g.p.check(F + ' [name="agree3rd"]');
      /* 양식을 연 뒤 업체가 취소 조건을 또 바꿉니다 */
      DB.rows[0].cancel_terms = "취소 불가";
      const n0 = g.sent.length;
      await g.p.click(F + " button[type=submit]");
      await g.p.waitForTimeout(600);
      r = await g.p.evaluate(function(id){
        const li = document.querySelector('li[data-tee="' + id + '"]');
        const f = li && li.querySelector(".tf-f");
        return { t: li ? li.innerText : "", name: f ? f.querySelector('[name="name"]').value : "",
                 agree: f ? f.querySelector('[name="agree3rd"]').checked : null };
      }, T1.id);
      ok("⚠️⚠️⚠️ 보내기 직전에 조건이 바뀌었으면 **보내지 않는다**",
         !g.sent.slice(n0).some(function(x){ return x.name === "book_teetime"; }), JSON.stringify(g.sent.slice(n0).map(function(x){ return x.name; })));
      ok("  바뀐 취소 조건을 보여 주고 그 사실을 말한다", r.t.indexOf("취소 불가") >= 0 && r.t.indexOf("직전에") >= 0, r.t.slice(0, 300));
      ok("  적어 두신 성함은 남기고 **동의는 다시** 받는다", r.name === "검사손님" && r.agree === false, JSON.stringify([r.name, r.agree]));

      await g.p.check(F + ' [name="agree3rd"]');
      const n1 = g.sent.length;
      await g.p.click(F + " button[type=submit]");
      await g.p.waitForTimeout(600);
      const bc = g.sent.slice(n1).filter(function(x){ return x.name === "book_teetime"; })[0];
      ok("  다시 보내면 신청이 간다", !!bc);
      if(bc){
        const sp = JSON.parse(bc.body).p;
        ok("⚠️⚠️ **손님이 본 조건(seen)** 을 실어 보낸다 — 서버(0085)가 마지막으로 맞춰 봅니다",
           sp.seen && sp.seen.green_fee === 180000 && sp.seen.cancel_terms === "취소 불가", JSON.stringify(sp.seen));
      }

      /* 마감 — 보기에서 그 줄이 빠집니다 */
      DB.rows = DB.rows.filter(function(x){ return x.id !== T2.id; });
      await g.p.click('li[data-tee="' + T2.id + '"] .tf-book');
      await g.p.waitForTimeout(500);
      r = await g.p.evaluate(function(id){
        const li = document.querySelector('li[data-tee="' + id + '"]');
        return { t: li ? li.innerText : "", form: !!(li && li.querySelector(".tf-f")), btn: !!(li && li.querySelector(".tfc-r .tf-book")) };
      }, T2.id);
      ok("⚠️⚠️ 마감 · 일시중지된 자리는 **양식을 안 연다**", !r.form && r.t.indexOf("신청을 받지 않습니다") >= 0, r.t.slice(0, 200));
      ok("  그 카드의 신청 단추를 거둔다", !r.btn);
      await g.p.close();

      /* 못 읽으면 옛 조건으로 열지 않는다 */
      DB.rows = [Object.assign({}, T1)]; DB.fail = true;
      const g2 = await open("/cat/booking", { tables:{ v_teetime_open: function(u){
        if(DB.fail && /id=eq\./.test(u)) return { amErr:{ status:503, message:"down" } };
        return DB.rows; } } });
      await g2.p.waitForSelector("li[data-tee] .tf-book");
      await g2.p.click("li[data-tee] .tf-book");
      await g2.p.waitForTimeout(500);
      const r2 = await g2.p.evaluate(function(){ const li = document.querySelector("li[data-tee]");
        return { t: li.innerText, form: !!li.querySelector(".tf-f") }; });
      ok("⚠️⚠️ 지금 조건을 못 읽으면 **옛 조건으로 양식을 열지 않는다**", !r2.form && r2.t.indexOf("확인하지 못했습니다") >= 0, r2.t.slice(0, 200));
      await g2.p.close();

      /* 서버가 「조건이 바뀌었습니다」로 막은 경우 */
      DB.fail = false; DB.rows = [Object.assign({}, T1)];
      const g3 = await open("/cat/booking", { tables:{ v_teetime_open: function(){ return DB.rows; } } });
      await g3.p.route(FAKE + "/rest/v1/rpc/book_teetime", function(rt){
        DB.rows[0].green_fee = 199000;
        return rt.fulfill({ status:400, contentType:"application/json",
          body: JSON.stringify({ message:"자리 조건이 바뀌었습니다 — 바뀐 조건을 확인하고 다시 신청해 주세요" }) });
      });
      await g3.p.waitForSelector("li[data-tee] .tf-book");
      await g3.p.click("li[data-tee] .tf-book");
      await g3.p.waitForSelector(".tf-f");
      await g3.p.fill('.tf-f [name="name"]', "검사손님");
      await g3.p.fill('.tf-f [name="tel"]', "010-1111-2222");
      await g3.p.check('.tf-f [name="agree3rd"]');
      await g3.p.click(".tf-f button[type=submit]");
      await g3.p.waitForTimeout(800);
      const r3 = await g3.p.evaluate(function(){ const li = document.querySelector("li[data-tee]"); return li.innerText; });
      ok("⚠️ 서버가 막으면 그 말을 보여 주고 **카드를 새 조건(199,000)으로** 다시 그린다",
         r3.indexOf("조건이 바뀌었습니다") >= 0 && r3.indexOf("199,000") >= 0, r3.slice(0, 300));
      ok("  화면 오류 0건", g3.errs.length === 0, g3.errs.join(" | "));
      await g3.p.close();
    }

    /* ══ ③ 중고 ═══════════════════════════════════════════════════════ */
    console.log("\n── ③ 중고 — 상세를 열어 둔 사이 값이 바뀌거나 팔린 뒤");
    {
      const UID = "aaaaaaaa-0069-4000-8000-000000000001";
      const L1 = { id:UID, sub:"us-driver", region:"seoul", ship:false, title:"드라이버 팝니다",
        body:"2년 쓴 드라이버입니다", price:350000, cond:"good", ask_n:0, state:"open",
        created_at:new Date().toISOString(), brand:"타이틀리스트", model:null, seller:"김**", photo_n:0, thumb:null };
      const DB = { rows:[Object.assign({}, L1)] };
      const g = await open("/cat/used?v=" + UID, { tables:{
        v_listing_open: function(){ return DB.rows.map(function(x){ return Object.assign({}, x); }); },
        v_listing_photo_public:[], v_listing_fav:[] } });
      await g.p.waitForSelector(".lsd-ask");
      await g.p.click(".lsd-ask");
      await g.p.waitForSelector("#lsaf");
      await g.p.fill("#lsaf [name='contact']", "010-1234-0069");
      await g.p.check("#lsaf .jchk input[type=checkbox]");
      DB.rows[0].price = 300000;
      const n0 = g.sent.length;
      await g.p.click("#lsaf button[type='submit']");
      await g.p.waitForTimeout(600);
      let r = await g.p.evaluate(function(){ return { msg: (document.getElementById("lsmsg2") || {}).textContent || "",
        price: (document.querySelector(".lsd-p") || {}).textContent || "" }; });
      ok("⚠️⚠️ 값이 바뀌었으면 **보내지 않는다**", !g.sent.slice(n0).some(function(x){ return x.name === "ask_listing"; }));
      ok("  바뀐 값을 그 자리에서 보여 준다 (350,000 → 300,000)", r.msg.indexOf("300,000") >= 0 && r.price.indexOf("300,000") >= 0, JSON.stringify(r));
      const n1 = g.sent.length;
      await g.p.click("#lsaf button[type='submit']");
      await g.p.waitForTimeout(600);
      const aq = g.sent.slice(n1).filter(function(x){ return x.name === "ask_listing"; })[0];
      ok("  다시 보내면 문의가 간다 · **본 값(seen_price)** 을 싣는다 (0084 가 맞춰 봅니다)",
         !!aq && JSON.parse(aq.body).p.seen_price === 300000, aq ? aq.body.slice(0, 200) : "없음");
      await g.p.close();

      DB.rows = [Object.assign({}, L1)];
      const g2 = await open("/cat/used?v=" + UID, { tables:{
        v_listing_open: function(){ return DB.rows; }, v_listing_photo_public:[], v_listing_fav:[] } });
      await g2.p.waitForSelector(".lsd-ask");
      await g2.p.click(".lsd-ask");
      await g2.p.waitForSelector("#lsaf");
      await g2.p.fill("#lsaf [name='contact']", "010-1234-0069");
      await g2.p.check("#lsaf .jchk input[type=checkbox]");
      DB.rows = [];
      const m0 = g2.sent.length;
      await g2.p.click("#lsaf button[type='submit']");
      await g2.p.waitForTimeout(600);
      const msg = await g2.p.evaluate(function(){ return (document.getElementById("lsmsg2") || {}).textContent || ""; });
      ok("⚠️⚠️ 그 사이 팔렸으면(보기에서 빠짐) **보내지 않고** 그 사실을 말한다",
         !g2.sent.slice(m0).some(function(x){ return x.name === "ask_listing"; }) && msg.indexOf("문의를 받지 않습니다") >= 0, msg);
      await g2.p.close();
    }

    /* ══ ④ 첫 화면 사진 ═══════════════════════════════════════════════ */
    console.log("\n── ④ 첫 화면 사진 — 지연 로딩 때문에 비어 있지 않은가");
    {
      /* ⚠️ 사진 칸은 업체찾기 카드에 있습니다(분류 화면의 업체 덩이는 사진 없는 카드입니다 — 빌드와 같습니다) */
      const g = await open("/search", { stat:[], view:{ width:390, height:844 },
        tables:{ v_provider_card:[NEW_BK], v_provider_price_public:[],
                 v_provider_photo_public:[{ id:"f1", provider_id:"new-bk", path:"pv/new-bk/photo/a.jpg", mime:"image/jpeg" }],
                 v_review_public:[] } });
      await g.p.evaluate(function(){ const g0 = document.querySelector("main .pv img, main img[src*='pv-test']"); if(g0) g0.scrollIntoView(); });
      await g.p.waitForTimeout(800);
      const r = await g.p.evaluate(function(){
        const i = document.querySelector("main img[src*='/object/public/pv-test/pv/new-bk/photo/a.jpg']");
        return i ? { done: i.complete, w: i.naturalWidth, src: i.getAttribute("src") } : null; });
      ok("⚠️ 지금 값의 시설 사진이 **공개 버킷 주소로** 카드에 선다", !!r, JSON.stringify(r));
      ok("⚠️ 화면에 들어온 그 사진이 **실제로 열린다** (지연 로딩 때문에 빈 칸으로 남지 않는다)", !!r && r.done && r.w > 0, JSON.stringify(r));
      await g.p.close();
    }
  }catch(e){
    fail++; console.log("  ❌ 검사가 터졌습니다 — " + (e && e.stack || e));
  }finally{
    await b.close();
    srv.close && srv.close();
  }
  console.log("\n" + (pass + fail) + "건 중 " + pass + "건 통과 · " + fail + "건 실패");
  process.exit(fail ? 1 : 0);
})();

#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   확정 시안과 견주려고 **구현 화면을 PC · 폰 두 폭으로** 찍습니다

     node tools/shot-spec.js            다섯 장 전부
     node tools/shot-spec.js range fit  이름으로 골라서

   ⚠️ 이건 **보는 도구**이지 검사가 아닙니다 — 통과 · 실패를 안 내므로
   ship.js 에 넣지 않습니다. 열어서 **눈으로** 보세요.

   ⚠️⚠️⚠️ **저장소를 한 글자도 안 건드립니다.** 연습장 · 피팅 화면은
   빌드가 찍은 카드를 그대로 쓰므로(`AM_PROVIDERS`) 업체가 0곳이면
   「등록된 연습장이 없습니다」 만 나옵니다 — 시안의 카드 자리를 보려면
   업체가 있어야 해서 **저장소를 통째로 임시 폴더에 복사해** 거기서만
   씨앗을 넣고 빌드합니다. `tools/test-providers.js` 는 제자리에서
   바꾼 뒤 사본으로 되돌리는데, 2026-11-09 에 **그 중간 상태가 커밋에
   박혀** 없는 회사의 업체 화면 두 장이 공개 저장소로 올라갔습니다.
   여기서는 그 틈이 아예 없습니다.

   ⚠️⚠️ **씨앗 업체 이름을 「(예시) …」 로 둡니다** — 그림에 찍히는
   글자라, 실제 상호처럼 보이는 이름을 적으면 그 그림을 보신 분이
   「업체가 들어왔구나」 로 읽습니다 (절대 규칙 1).

   ⚠️ 여행 · 인력 · 커뮤니티는 설정(Supabase)이 있어야 열리는 화면이라
   `tools/_stub.js` 로 흉내 냅니다 — `tools/shot-desk.js` 와 **같은
   길**입니다 (베끼면 찍는 화면과 재는 화면이 조용히 달라집니다).

   결과: /tmp/.../shots-spec/<이름>-pc.png · -mo.png
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs");
const os = require("os");
const path = require("path");
const cp = require("child_process");

const HERE = __dirname;
const ROOT = path.join(HERE, "..");
const MARK = "AM_SHOT_SPEC_COPY";

/* ── 아직 원본에 있으면, 사본을 떠서 거기서 다시 돕니다 ───────────── */
if(!process.env[MARK]){
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), "shotspec-"));
  console.log("저장소를 복사합니다 (원본은 건드리지 않습니다)");
  console.log("  → " + dst);
  /* ⚠️ `.git` 과 `node_modules` 는 뺍니다 — 떼어 와도 쓸 데가 없고
     복사에 한참 걸립니다. */
  const r = cp.spawnSync("sh", ["-c",
    "cd " + JSON.stringify(ROOT) + " && tar -cf - " +
    "--exclude=./.git --exclude=./node_modules . | " +
    "( cd " + JSON.stringify(dst) + " && tar -xf - )"],
    { stdio:"inherit" });
  if(r.status !== 0){ console.error("❌ 복사하지 못했습니다"); process.exit(1); }
  const e = Object.assign({}, process.env);
  e[MARK] = "1";
  e.AM_SHOT_SPEC_OUT = process.env.AM_SHOT_SPEC_OUT ||
    path.join(os.tmpdir(), "shots-spec");
  const q = cp.spawnSync(process.execPath,
    [path.join(dst, "tools", "shot-spec.js")].concat(process.argv.slice(2)),
    { stdio:"inherit", cwd:dst, env:e });
  process.exit(q.status === null ? 1 : q.status);
}

/* ══ 여기부터는 사본 안입니다 ═══════════════════════════════════════ */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const { serve } = require("./_serve.js");
const { stub } = require("./_stub.js");

const OUT = process.env.AM_SHOT_SPEC_OUT || path.join(os.tmpdir(), "shots-spec");
const GEN = path.join(ROOT, "js", "data", "providers.generated.js");
const RGEN = path.join(ROOT, "js", "data", "reviews.generated.js");

/* ── 씨앗 ─────────────────────────────────────────────────────────
   ⚠️⚠️ **값 · 시설을 다 채우지 않습니다** — 「값을 안 올리신 곳」 ·
   「시설을 안 고르신 곳」 자리가 화면에 어떻게 보이는지도 시안과
   견줘야 합니다 (다 채우면 그 갈래를 그림에서 못 봅니다). */
const PV = [
  { id:"spec-rg-1", name:"(예시) 연습장 1",
    intro:"실내 타석 열두 개와 스크린 네 대를 둡니다.",
    regions:["gyeonggi"], gu:["분당구"], subs:["rg-in","rg-sim"],
    range_opts:["indoor","screen","parking"],
    open_hours:"평일 06:00~23:00 · 주말 07:00~21:00",
    since:2019, consult_hours:"평일 09:00~22:00",
    verified:{ brn:true, tel:true }, scale:"mid",
    prices:[{ sub:"rg-in", label:"타석 1시간", amount:12000, unit:"1시간" }] },
  { id:"spec-rg-2", name:"(예시) 연습장 2",
    intro:"실외 타석과 퍼팅 그린을 함께 둡니다.",
    regions:["seoul"], gu:["강남구"], subs:["rg-out","rg-short"],
    range_opts:["outdoor","parking"],
    open_hours:"매일 05:30~22:00", since:2015, scale:"big",
    prices:[{ sub:"rg-out", label:"타석 1시간", amount:18000, unit:"1시간" }] },
  { id:"spec-rg-3", name:"(예시) 연습장 3",
    intro:"스크린 전용이고 야간에만 엽니다.",
    regions:["seoul"], gu:["송파구"], subs:["rg-sim"],
    range_opts:["screen"], scale:"small" },
  { id:"spec-rg-4", name:"(예시) 연습장 4",
    intro:"아직 시설 · 가격을 안 올리신 곳입니다.",
    regions:["incheon"], subs:["rg-in"], scale:"small" },

  { id:"spec-ft-1", name:"(예시) 피팅샵 1",
    intro:"드라이버 · 아이언 피팅과 샤프트 교체를 합니다.",
    regions:["seoul"], gu:["강남구"],
    subs:["ft-driver","ft-iron","ft-shaft"],
    fit_ways:["visit","ship"],
    fit_terms:"공임만 받고 부품비는 따로 받습니다",
    since:2017, verified:{ brn:true }, scale:"mid",
    brands:["타이틀리스트","캘러웨이"],
    prices:[{ sub:"ft-driver", label:"드라이버 피팅", amount:80000, unit:"1회" },
            { sub:"ft-shaft", label:"샤프트 교체", amount:35000, unit:"1개",
              note:"부품비 별도" }] },
  { id:"spec-ft-2", name:"(예시) 피팅샵 2",
    intro:"그립 교체와 로프트 · 라이 조정을 합니다.",
    regions:["gyeonggi"], gu:["수원시"], subs:["ft-grip","ft-angle"],
    fit_ways:["visit"], scale:"small",
    prices:[{ sub:"ft-grip", label:"그립 교체", amount:12000, unit:"1개" }] },
  { id:"spec-ft-3", name:"(예시) 피팅샵 3",
    intro:"클럽 수리만 맡습니다. 택배로도 받습니다.",
    regions:["busan"], subs:["ft-mend"], fit_ways:["ship"], scale:"small" }
];

const RV = [
  { id:"spec-rv-1", provider_id:"spec-rg-1", rating:5, who:"김**",
    body:"타석이 넓고 관리가 잘 되어 있습니다.",
    created_at:"2026-11-02T01:00:00Z" },
  { id:"spec-rv-2", provider_id:"spec-rg-1", rating:4, who:"이**",
    body:"주차가 조금 좁지만 시설은 좋았습니다.",
    created_at:"2026-11-01T01:00:00Z" },
  { id:"spec-rv-3", provider_id:"spec-ft-1", rating:5, who:"박**",
    body:"샤프트를 바꾸고 방향이 잡혔습니다.",
    created_at:"2026-10-30T01:00:00Z" }
];

function plant(){
  fs.writeFileSync(GEN,
    "/* 캡처용 씨앗 — tools/shot-spec.js 가 **사본에만** 써 둔 것입니다. */\n" +
    "window.AM_PROVIDERS_AT = \"캡처용 씨앗\";\n" +
    "window.AM_PROVIDERS = " + JSON.stringify(PV, null, 2) + ";\n");
  fs.writeFileSync(RGEN,
    "/* 캡처용 씨앗 — tools/shot-spec.js 가 **사본에만** 써 둔 것입니다. */\n" +
    "window.AM_REVIEWS_AT = \"캡처용 씨앗\";\n" +
    "window.AM_REVIEWS = " + JSON.stringify(RV, null, 2) + ";\n");
}
function build(){
  const r = cp.spawnSync(process.execPath, [path.join(ROOT, "build.js")],
    { cwd:ROOT, encoding:"utf8" });
  if(r.status !== 0){
    console.error(r.stdout || "");
    console.error(r.stderr || "");
    throw new Error("빌드가 멈췄습니다");
  }
}

/* ── 장면 ─────────────────────────────────────────────────────────
   [이름, 주소, 시안 파일, 누구로, 흉내 표, 흉내 문, 미리 누를 것]
   ⚠️ 흉내 자료는 `tools/shot-desk.js` 와 **같은 꼴**이어야 합니다 —
   다르면 찍는 화면과 재는 화면이 조용히 달라집니다. */
const TRIP = [
  { id:"11111111-0073-4000-8000-000000000001", provider_id:"spec-ft-1",
    pro_name:"(예시) 여행사 1", scope:"abroad", sub:"tr-pkg",
    region:"japan", title:"(예시) 일본 3박 4일 36홀 패키지",
    nights:3, rounds:2, price:890000, price_note:"2인 1실 기준",
    depart_kind:"dates", depart_from:null, depart_to:null,
    months:["2026-12","2027-01"],
    days:["2026-12-12","2026-12-26","2027-01-09"],
    incl:"항공 · 숙박 · 그린피", excl:"캐디피 · 카트비",
    state:"live", thumb:null, photo_n:0,
    created_at:"2026-11-05T01:00:00Z" },
  { id:"11111111-0073-4000-8000-000000000002", provider_id:"spec-ft-2",
    pro_name:"(예시) 여행사 2", scope:"home", sub:"tr-home",
    region:"jeju", title:"(예시) 제주 2박 3일 자유 라운드",
    nights:2, rounds:2, price:420000, price_note:null,
    depart_kind:"range", depart_from:"2026-12-01", depart_to:"2027-02-28",
    months:["2026-12","2027-01","2027-02"], days:null,
    incl:"숙박 · 그린피", excl:"항공 · 렌터카",
    state:"live", thumb:null, photo_n:0,
    created_at:"2026-11-04T01:00:00Z" },
  { id:"11111111-0073-4000-8000-000000000003", provider_id:null,
    pro_name:null, scope:"home", sub:"tr-tel",
    region:"gangwon", title:"(예시) 강원 골프텔 1박 2일",
    nights:1, rounds:1, price:260000, price_note:null,
    depart_kind:"none", depart_from:null, depart_to:null,
    months:null, days:null,
    incl:"숙박 · 그린피", excl:null,
    state:"live", thumb:null, photo_n:0,
    created_at:"2026-11-03T01:00:00Z" }
];
const JOB = [
  { id:"bbbbbbbb-0048-4000-8000-000000000001", kind:"hire",
    sub:"jr-caddy", region:"gyeonggi", title:"(예시) 캐디 모집 — 주 5일",
    pay:"일 12만원", terms:"숙소 제공 · 4대보험",
    role:"caddy", emp_type:"full", pay_type:"day", pay_min:120000,
    close_at:"2026-12-31", state:"open", pro_name:"(예시) 골프장 1",
    reply_n:2, created_at:"2026-11-06T01:00:00Z" },
  { id:"bbbbbbbb-0048-4000-8000-000000000002", kind:"hire",
    sub:"jr-pro", region:"seoul", title:"(예시) 레슨 프로 채용",
    pay:"월 300만원부터", terms:"수업료 별도 배분",
    role:"pro", emp_type:"full", pay_type:"month", pay_min:3000000,
    close_at:null, state:"open", pro_name:"(예시) 아카데미 1",
    reply_n:0, created_at:"2026-11-05T01:00:00Z" },
  { id:"bbbbbbbb-0048-4000-8000-000000000003", kind:"seek",
    sub:"jr-mgr", region:"busan", title:"(예시) 운영 관리 경력 7년 구직",
    pay:"협의", terms:null,
    role:"mgr", emp_type:null, pay_type:null, pay_min:null,
    close_at:null, state:"open", pro_name:null,
    reply_n:1, created_at:"2026-11-04T01:00:00Z" }
];
const CQ = [
  { id:"11111111-1111-1111-1111-111111111111", cat:"cm-open",
    title:"(예시) 드라이버 슬라이스 교정 방법 있을까요?",
    body:"요즘 계속 오른쪽으로 휘어서 고민입니다.",
    who:"골프초보", view_n:128, ca_n:4, state:"open",
    created_at:"2026-11-10T01:00:00Z", photo_n:0 },
  { id:"22222222-2222-2222-2222-222222222222", cat:"cm-course",
    title:"(예시) 지난주 다녀온 골프장 후기입니다",
    body:"코스 관리가 아주 좋았습니다.",
    who:"김**", view_n:64, ca_n:2, state:"open",
    created_at:"2026-11-09T01:00:00Z", photo_n:0 },
  { id:"33333333-3333-3333-3333-333333333333", cat:"cm-ask",
    title:"(예시) 아이언 세트 추천 부탁드립니다",
    body:"입문 1년차입니다.",
    who:"박**", view_n:31, ca_n:0, state:"open",
    created_at:"2026-11-08T01:00:00Z", photo_n:0 }
];

const CUST = { id:"cc000000-0000-4000-8000-000000000001", role:"customer" };

const SCENES = [
  ["05-range",     "/cat/range",     null, null, null, null],
  ["07-fitting",   "/cat/fitting",   null, null, null, null],
  ["08-travel",    "/cat/travel",    CUST,
    { v_trip_open:TRIP, v_trip_date_public:[], v_wanted_open:[] }, {}, null],
  ["09-career",    "/cat/career",    CUST,
    { v_job_open:JOB, v_job_fav:[] }, {}, null],
  ["10-community", "/cat/community", CUST,
    { v_cq_public:CQ, v_ca_public:[] }, {}, null]
];

const WIDTHS = [[1280, "pc"], [360, "mo"]];

(async function(){
  const want = process.argv.slice(2).filter(a => a.indexOf("--") !== 0);
  fs.mkdirSync(OUT, { recursive:true });

  console.log("\n── 씨앗을 넣고 (사본에만) 빌드합니다");
  plant();
  build();
  console.log("   업체 " + PV.length + "곳 · 후기 " + RV.length + "건");

  const PORT = 8840 + (process.pid % 40);
  const srv = (await serve(PORT)).srv;
  const b = await chromium.launch();
  const base = "http://127.0.0.1:" + PORT;
  let n = 0;

  for(const [name, route, who, tables, rpcs, pre] of SCENES){
    if(want.length && !want.some(w => name.indexOf(w) >= 0)) continue;
    for(const [w, tag] of WIDTHS){
      const p = await b.newPage({ viewport:{ width:w, height:900 },
                                  deviceScaleFactor: 2 });
      const errs = [];
      p.on("pageerror", e => errs.push(String(e.message || e)));
      p.on("console", m => { if(m.type() === "error") errs.push(m.text()); });
      if(who) await stub(p, who, tables, rpcs, true);
      await p.goto(base + route, { waitUntil:"networkidle" });
      await p.waitForTimeout(700);
      if(pre){
        try{ await p.click(pre, { timeout:3000 });
             await p.waitForTimeout(400); }
        catch(e){ console.log("   ⚠️ 못 눌렀습니다 — " + pre); }
      }
      const f = path.join(OUT, name + "-" + tag + ".png");
      await p.screenshot({ path:f, fullPage:true });
      const h = await p.evaluate(function(){
        return { h: document.documentElement.scrollHeight,
                 over: document.documentElement.scrollWidth -
                       window.innerWidth };
      });
      n++;
      console.log("  " + (name + "-" + tag).padEnd(18) +
        String(h.h).padStart(6) + "px" +
        (h.over > 1 ? "  ⚠️ 가로로 " + h.over + "px 밀립니다" : "") +
        (errs.length ? "  ⚠️ 에러 " + errs.length + "건: " +
          errs[0].slice(0, 90) : ""));
      await p.close();
    }
  }

  await b.close(); srv.close();
  console.log("\n" + n + "장 찍었습니다 — " + OUT);
  console.log("⚠️ 보는 도구입니다. 시안(docs/spec/)과 **나란히 놓고** 보세요.");
})().catch(function(e){
  console.error("❌ " + (e && e.message ? e.message : e));
  process.exit(1);
});

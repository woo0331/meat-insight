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
  const REV = process.env.AM_SHOT_SPEC_REV || "";
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), "shotspec-"));
  if(REV){
    console.log("옛 커밋을 꺼냅니다 (작업 가지는 한 글자도 안 건드립니다)");
    console.log("  " + REV + " → " + dst);
  }else{
    console.log("저장소를 복사합니다 (원본은 건드리지 않습니다)");
    console.log("  → " + dst);
  }
  /* ⚠️⚠️⚠️ **옛 판을 찍을 때도 `git checkout` 을 쓰지 않습니다** —
     작업 가지를 되돌리는 것이고, 검사가 돌고 있으면 그 중간 상태가
     커밋에 박힙니다(2026-11-09 사고). `git archive` 는 **읽기만**
     하므로 작업 폴더도 · HEAD 도 · 가지도 그대로입니다.
     ⚠️⚠️ 찍는 도구 셋(`shot-spec` · `_serve` · `_stub`)만 **지금 판으로
     덮습니다** — 비교하려는 것은 **화면 코드**이고, 찍는 자와 흉내
     장치가 판마다 다르면 「같은 폭 · 같은 자료」가 깨집니다. */
  const cmd = REV
    ? "cd " + JSON.stringify(ROOT) + " && git archive " +
      JSON.stringify(REV) + " | ( cd " + JSON.stringify(dst) + " && tar -xf - )"
    : "cd " + JSON.stringify(ROOT) + " && tar -cf - " +
      "--exclude=./.git --exclude=./node_modules . | " +
      "( cd " + JSON.stringify(dst) + " && tar -xf - )";
  const r = cp.spawnSync("sh", ["-c", cmd], { stdio:"inherit" });
  if(r.status !== 0){ console.error("❌ 복사하지 못했습니다"); process.exit(1); }
  if(REV){
    ["shot-spec.js", "_serve.js", "_stub.js"].forEach(function(f){
      fs.copyFileSync(path.join(HERE, f), path.join(dst, "tools", f));
    });
  }
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
    regions:["busan"], subs:["ft-mend"], fit_ways:["ship"], scale:"small" },

  /* ── 레슨 프로 (시안 ④) ─────────────────────────────────────────
     ⚠️ 「프로」는 새 표가 아니라 **분류가 레슨인 업체**입니다(0071) —
     그래서 씨앗도 `provider` 한 벌입니다. */
  { id:"spec-ls-1", name:"(예시) 레슨 프로 1",
    intro:"KPGA 투어 출신이고 초보 교정을 주로 합니다.",
    regions:["seoul"], gu:["강남구"], subs:["ls-solo","ls-group","ls-field"],
    kind:"biz", place_name:"(예시) 강남 골프아카데미",
    lesson_goals:["beginner","swing","score"],
    since:2014, consult_hours:"평일 10:00~21:00",
    verified:{ brn:true, tel:true }, scale:"mid",
    prices:[{ sub:"ls-solo", label:"1:1 레슨 8회권", amount:400000,
              unit:"8회", note:"타석료 포함" },
            { sub:"ls-group", label:"그룹 레슨 월 4회", amount:160000,
              unit:"월" }] },
  { id:"spec-ls-2", name:"(예시) 레슨 프로 2",
    intro:"숏게임과 퍼팅만 가르칩니다.",
    regions:["gyeonggi"], gu:["분당구"], subs:["ls-short","ls-point"],
    kind:"person", lesson_goals:["short","score"],
    since:2018, scale:"small",
    prices:[{ sub:"ls-short", label:"숏게임 1회", amount:70000, unit:"1회" }] },
  { id:"spec-ls-3", name:"(예시) 레슨 프로 3",
    intro:"주니어 선수반을 맡습니다.",
    regions:["incheon"], subs:["ls-junior"],
    kind:"biz", lesson_goals:["junior"], scale:"small" },
  /* ⚠️ 값을 **아직 안 올리신** 프로 — 가격대로 좁히면 빠지는 자리가
     그림에 어떻게 보이는지 봐야 합니다. */
  { id:"spec-ls-4", name:"(예시) 레슨 프로 4",
    intro:"아직 레슨 가격을 안 올리신 프로입니다.",
    regions:["busan"], subs:["ls-online"], scale:"small" },

  /* ── 용품 마켓 (시안 ⑥) ────────────────────────────────────────── */
  { id:"spec-mk-1", name:"(예시) 골프용품점 1",
    intro:"클럽 · 볼 · 의류를 함께 팝니다.",
    regions:["seoul"], gu:["송파구"], subs:["mk-club","mk-ball","mk-wear"],
    since:2011, verified:{ brn:true }, scale:"big",
    brands:["타이틀리스트","캘러웨이","핑"] },
  { id:"spec-mk-2", name:"(예시) 골프용품점 2",
    intro:"신발과 장갑 · 액세서리를 다룹니다.",
    regions:["gyeonggi"], gu:["수원시"], subs:["mk-shoe","mk-acc"],
    scale:"small" },
  { id:"spec-mk-3", name:"(예시) 골프용품점 3",
    intro:"연습용품과 대여를 합니다.",
    regions:["busan"], subs:["mk-train","mk-rent"], scale:"small" }
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
    provider_name:"(예시) 여행사 1", scope:"abroad", sub:"tr-pkg",
    dest:"japan", title:"(예시) 일본 3박 4일 36홀 패키지",
    body:"후지산이 보이는 코스에서 이틀 라운드합니다.",
    nights:3, days:4, price_from:890000, price_note:"2인 1실 기준",
    depart_kind:"dates", depart_from:null, depart_to:null,
    months:["2026-12","2027-01"], depart_next:"2026-12-12",
    incl:["항공","숙박","그린피"], excl:["캐디피","카트비"],
    state:"approved", thumb:null, photo_n:0,
    created_at:"2026-11-05T01:00:00Z" },
  { id:"11111111-0073-4000-8000-000000000002", provider_id:"spec-ft-2",
    provider_name:"(예시) 여행사 2", scope:"home", sub:"tr-home",
    dest:"jeju", title:"(예시) 제주 2박 3일 자유 라운드",
    body:"원하시는 날짜에 맞춰 티타임을 잡아 드립니다.",
    nights:2, days:3, price_from:420000, price_note:null,
    depart_kind:"range", depart_from:"2026-12-01", depart_to:"2027-02-28",
    months:["2026-12","2027-01","2027-02"], depart_next:null,
    incl:["숙박","그린피"], excl:["항공","렌터카"],
    state:"approved", thumb:null, photo_n:0,
    created_at:"2026-11-04T01:00:00Z" },
  /* ⚠️ 출발일을 **아직 안 올리신** 상품 — 「없음」과 다른 말을 하는지
     그림으로 봐야 하는 자리입니다(0077). */
  { id:"11111111-0073-4000-8000-000000000003", provider_id:"spec-rg-1",
    provider_name:"(예시) 여행사 3", scope:"home", sub:"tr-tel",
    dest:"gangwon", title:"(예시) 강원 골프텔 1박 2일",
    body:"골프텔에서 묵고 아침에 바로 라운드합니다.",
    nights:1, days:2, price_from:260000, price_note:null,
    depart_kind:"none", depart_from:null, depart_to:null,
    months:[], depart_next:null,
    incl:["숙박","그린피"], excl:[],
    state:"approved", thumb:null, photo_n:0,
    created_at:"2026-11-03T01:00:00Z" }
];const JOB = [
  /* ⚠️⚠️ 키는 **DB 가 받는 값**이어야 합니다 — 하위는 `cr-*`(catalog.js) ·
     직무는 `jr-*` · 고용 형태는 `je-*` · 급여 종류는 `AM_JOB_PAY` 입니다.
     아무 글자나 적으면 화면이 「하위분류 미확인」을 내는 것이 **맞고**,
     그것을 보고 멀쩡한 화면을 고치려 들게 됩니다(이 저장소가 여섯 번
     밟은 자리). */
  { id:"bbbbbbbb-0048-4000-8000-000000000001", kind:"hire",
    sub:"cr-caddy", region:"gyeonggi", title:"(예시) 캐디 모집 — 주 5일",
    pay:"주말 라운드 우선", terms:"숙소 제공 · 4대보험",
    role:"jr-etc", emp_type:"je-full", pay_type:"per_round", pay_min:120000,
    close_at:"2026-12-31", state:"open",
    pro_name:"(예시) 골프장 1", who:null,
    apply_n:2, created_at:"2026-11-06T01:00:00Z" },
  { id:"bbbbbbbb-0048-4000-8000-000000000002", kind:"hire",
    sub:"cr-coach", region:"seoul", title:"(예시) 레슨 프로 채용",
    pay:"수업료 별도 배분", terms:"4대보험",
    role:"jr-coach", emp_type:"je-full", pay_type:"monthly", pay_min:3000000,
    close_at:null, state:"open",
    pro_name:"(예시) 아카데미 1", who:null,
    apply_n:0, created_at:"2026-11-05T01:00:00Z" },
  /* ⚠️ 급여를 「협의」로 두신 글 — 금액 거르개에서 **빠져야** 합니다
     (단위를 모르는 값을 숫자로 견주지 않습니다 · 지시 4번). */
  { id:"bbbbbbbb-0048-4000-8000-000000000003", kind:"seek",
    sub:"cr-hire", region:"busan", title:"(예시) 운영 관리 경력 7년 구직",
    pay:"협의", terms:null,
    role:"jr-manage", emp_type:null, pay_type:"negotiate", pay_min:null,
    close_at:null, state:"open",
    pro_name:null, who:"김**",
    apply_n:1, created_at:"2026-11-04T01:00:00Z" }
];const CQ = [
  /* ⚠️ 칸 이름은 `v_cq_public`(0075)을 그대로 씁니다 — 댓글 수는
     `answer_n` 이고 `ca_n` 이 아닙니다. */
  { id:"11111111-1111-1111-1111-111111111111", cat:"cm-open",
    title:"(예시) 드라이버 슬라이스 교정 방법 있을까요?",
    body:"요즘 계속 오른쪽으로 휘어서 고민입니다.",
    who:"골프초보", named:true, guest:false, mine:false,
    answer_n:4, view_n:128, photo_n:0, thumb:null, state:"live",
    created_at:"2026-11-10T01:00:00Z" },
  { id:"22222222-2222-2222-2222-222222222222", cat:"cm-course",
    title:"(예시) 지난주 다녀온 골프장 후기입니다",
    body:"코스 관리가 아주 좋았습니다.",
    who:"김**", named:false, guest:false, mine:false,
    answer_n:2, view_n:64, photo_n:0, thumb:null, state:"live",
    created_at:"2026-11-09T01:00:00Z" },
  { id:"33333333-3333-3333-3333-333333333333", cat:"cm-ask",
    title:"(예시) 아이언 세트 추천 부탁드립니다",
    body:"입문 1년차입니다.",
    who:"박**", named:false, guest:false, mine:false,
    answer_n:0, view_n:31, photo_n:0, thumb:null, state:"live",
    created_at:"2026-11-08T01:00:00Z" }
];
const CUST = { id:"cc000000-0000-4000-8000-000000000001", role:"customer" };

/* ── 부킹 (시안 ①) ────────────────────────────────────────────────
   ⚠️ 칸 이름은 `v_teetime_open`(0060 · 0066)을 그대로 씁니다 —
   `tools/test-desk.js` 의 TEE 와 **같은 꼴**입니다. */
function KST(d){
  const t = new Date(Date.now() + d * 86400000 + 9 * 3600000);
  return t.toISOString().slice(0, 10);
}
const TEE = [
  { id:"dddddddd-0060-4000-8000-000000000001", provider_id:"spec-rg-1",
    provider_name:"(예시) 부킹 대행 1", kind:"booking", region:"gyeonggi",
    course:"(예시) 그린밸리CC 신코스", play_at:KST(1), tee_at:"07:10:00",
    holes:18, slots:4, green_fee:150000, tel:"031-000-0000",
    note:"카트비 별도", left_n:2 },
  { id:"dddddddd-0060-4000-8000-000000000002", provider_id:"spec-rg-2",
    provider_name:"(예시) 부킹 대행 2", kind:"booking", region:"seoul",
    course:"(예시) 한강CC", play_at:KST(2), tee_at:"13:40:00",
    holes:18, slots:2, green_fee:120000, tel:null, note:null, left_n:1 },
  /* ⚠️ 시각을 **아직 안 정한** 자리 — 시간대로 좁히면 빠집니다(0060).
     그 사실을 화면이 그 자리에서 말하는지 그림으로 봐야 합니다. */
  { id:"dddddddd-0060-4000-8000-000000000003", provider_id:"spec-rg-1",
    provider_name:"(예시) 부킹 대행 1", kind:"booking", region:"jeju",
    course:"(예시) 제주 오션CC", play_at:KST(3), tee_at:null,
    holes:null, slots:3, green_fee:0, tel:null, note:null, left_n:3 }
];
const TCNT = [
  { region:"gyeonggi", play_at:KST(1), n:3 },
  { region:"seoul",    play_at:KST(2), n:2 },
  { region:"jeju",     play_at:KST(3), n:1 }
];
const JCNT = [
  { region:"seoul",    play_at:KST(1), n:2 },
  { region:"gangwon",  play_at:KST(2), n:1 }
];

/* ── 조인 (시안 ②) ────────────────────────────────────────────────
   ⚠️ `v_join_open` 에는 연락처 칸이 **아예 없습니다**(0046) — 그래서
   씨앗에도 없습니다. */
const JROOM = [
  { id:"eeeeeeee-0046-4000-8000-000000000001",
    title:"(예시) 주말 아침 같이 치실 분 구합니다",
    body:"초보도 환영합니다. 편하게 치실 분이면 좋겠습니다.",
    region:"seoul", play_at:KST(2), course:"(예시) 한강CC",
    booked:true, tee:"아침", need:2, budget:150000, left_n:1 },
  { id:"eeeeeeee-0046-4000-8000-000000000002",
    title:"(예시) 평일 조인 한 자리",
    body:"카트비는 나눠 냅니다.", region:"gangwon", play_at:KST(4),
    course:"(예시) 설악CC", booked:false, tee:"오전", need:1,
    budget:0, left_n:1 }
];

/* ── 중고장터 (시안 ③) ────────────────────────────────────────────
   ⚠️⚠️ 키는 **DB 가 받는 값**이어야 합니다 — 물건 종류는 `us-*`
   (`js/data/catalog.js` · 열다섯)이고 상태는 0069 의 넷입니다. */
const LST = [
  { id:"aaaaaaaa-0069-4000-8000-000000000001", sub:"us-driver",
    region:"seoul", ship:false,
    title:"(예시) 드라이버 10.5도 팝니다 (헤드커버 포함)",
    body:"2년 쓴 드라이버입니다.", price:350000, cond:"good", ask_n:0,
    brand:"타이틀리스트", model:"(예시) 스텔스2 10.5도", state:"open",
    created_at:new Date(Date.now() - 3600000).toISOString(),
    seller:"김**", photo_n:0, thumb:null },
  /* ⚠️ **0 원은 무료로 나눔**입니다 — 빈 값과 뜻이 다릅니다(0056). */
  { id:"aaaaaaaa-0069-4000-8000-000000000002", sub:"us-iron",
    region:"gyeonggi", ship:true,
    title:"(예시) 연습용 아이언 무료로 나눔합니다",
    body:"연습용입니다.", price:0, cond:"fair", ask_n:2,
    brand:null, model:null, state:"open",
    created_at:new Date(Date.now() - 86400000).toISOString(),
    seller:"이**", photo_n:0, thumb:null },
  { id:"aaaaaaaa-0069-4000-8000-000000000003", sub:"us-wedge",
    region:"busan", ship:true,
    title:"(예시) 웨지 52도 · 56도 두 자루",
    body:"거의 안 썼습니다.", price:120000, cond:"like", ask_n:1,
    brand:"오디세이", model:null, state:"reserved",
    created_at:new Date(Date.now() - 2 * 86400000).toISOString(),
    seller:"박**", photo_n:0, thumb:null },
  { id:"aaaaaaaa-0069-4000-8000-000000000004", sub:"us-bag",
    region:"incheon", ship:false,
    title:"(예시) 캐디백 · 보스턴백 세트",
    body:"한 시즌 썼습니다.", price:90000, cond:"good", ask_n:0,
    brand:"기타", model:null, state:"done",
    created_at:new Date(Date.now() - 5 * 86400000).toISOString(),
    seller:"최**", photo_n:0, thumb:null }
];

/* ── 용품 마켓 (시안 ⑥) — 「구합니다 글」 ──────────────────────────
   ⚠️⚠️⚠️ **가짜 자료도 그 화면의 분류여야 합니다**(`cat:"market"`) —
   다른 분류 글을 꽂으면 하위가 **영문 키 그대로** 찍히고, 그것을 보고
   멀쩡한 화면을 고치려 들게 됩니다. */
const WT_MK = [
  { id:"bb111111-0061-4000-8000-000000000001", cat:"market", sub:"mk-club",
    region:"seoul", title:"(예시) 드라이버 10.5도 중고로 구합니다",
    body:"상태 좋은 것으로 찾습니다.", budget:400000,
    when_txt:"이번 달 안으로", created_at:"2026-11-07T01:00:00Z",
    reply_n:2 },
  { id:"bb222222-0061-4000-8000-000000000002", cat:"market", sub:"mk-shoe",
    region:"gyeonggi", title:"(예시) 여성용 골프화 240 구합니다",
    body:"브랜드는 상관없습니다.", budget:null, when_txt:null,
    created_at:"2026-11-06T01:00:00Z", reply_n:0 },
  /* ⚠️ **예산 0 은 "무료로 해 주실 분"** 입니다(0061). */
  { id:"bb333333-0061-4000-8000-000000000003", cat:"market", sub:"mk-train",
    region:"seoul", title:"(예시) 연습용 드라이버 무료로 주실 분",
    body:"스크린 연습용으로 쓰려고 합니다.", budget:0, when_txt:null,
    created_at:"2026-11-05T01:00:00Z", reply_n:1 }
];

const SCENES = [
  ["01-booking",   "/cat/booking",   CUST,
    { v_teetime_open:TEE, v_teetime_count:TCNT, v_join_count:JCNT }, {}, null],
  ["02-matchup",   "/cat/matchup",   CUST,
    { v_join_open:JROOM, v_teetime_count:TCNT, v_join_count:JCNT }, {}, null],
  ["03-used",      "/cat/used",      CUST,
    { v_listing_open:LST, v_listing_photo_public:[], v_listing_fav:[] },
    {}, null],
  ["04-lesson",    "/cat/lesson",    null, null, null, null],
  ["05-range",     "/cat/range",     null, null, null, null],
  ["06-market",    "/cat/market",    CUST,
    { v_wanted_open:WT_MK }, {}, null],
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

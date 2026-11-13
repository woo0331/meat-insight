/* ════════════════════════════════════════════════════════════════════
   시연용 예시 자료 — **운영 DB 와 아무 관계가 없습니다**

   ⚠️⚠️⚠️ **이 폴더(`tools/demo/`)와 `tools/demo.js` 를 지우면 예시
   자료가 통째로 사라집니다.** 저장소의 화면 코드 · 마이그레이션 ·
   검사에는 한 줄도 섞이지 않았습니다. 운영 DB 에 넣는 길도 없습니다
   (`db/seed/*.sql` 과 달리 SQL 이 아닙니다 — 시연 서버가 메모리에만
   들고 있습니다).

   ⚠️⚠️ **상호 · 프로 성함은 전부 「(예시)」로 시작합니다.** 실재하는
   업체 · 프로의 이름 · 상호 · 전화번호를 한 글자도 쓰지 않습니다
   (표시 · 광고의 공정화에 관한 법률 제3조 · 절대 규칙 1).
   ⚠️ 전화번호는 **안 씁니다** — 지어낸 번호를 적으면 엉뚱한 분께
   전화가 갑니다(`db/seed/test-listings.sql` 이 적어 둔 그 자리).
   공개 보기에 전화 칸이 있는 자리(`teetime.tel`)만 **시연 안내 글**을
   넣습니다.

   ⚠️⚠️ **사진은 저장소에 이미 있는 분류 사진뿐입니다**(`img/mock/`) —
   2026-11-04 에 상표를 확인하고 가린 그 파일들입니다. 밖에서 받아 온
   사진도 · 사람 얼굴을 새로 만든 사진도 없습니다. 시연 서버가 그
   파일에서 **자리를 달리해 잘라** 변화를 줍니다(`tools/demo.js`).

   ⚠️ 날짜는 **돌리는 날 기준**으로 짓습니다 — 글자로 박으면 며칠 뒤에
   전부 지난 날짜가 되어 목록이 빕니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── 한국 날짜 ─────────────────────────────────────────────────────
   ⚠️⚠️ `toISOString()` 을 그냥 쓰면 UTC 라 한국에서 아침 9시 전에
   하루 밀립니다(0046 에서 겪은 자리). 9시간을 더하고 UTC 로 꺼냅니다. */
function kst(n){
  var d = new Date(Date.now() + 9 * 3600e3 + (n || 0) * 86400e3);
  return d.toISOString().slice(0, 10);
}
function ago(h){
  return new Date(Date.now() - h * 3600e3).toISOString();
}

/* ── 사진 ──────────────────────────────────────────────────────────
   `c#n` → `img/mock/cat-<c>.jpg` 의 n 번째 자리를 잘라 낸 것입니다.
   자르는 일은 `tools/demo.js` 가 합니다(ImageMagick 이 없으면 원본
   그대로 — 깨진 그림을 내지 않습니다). */
function ph(k){ return "/demo-img/" + k + ".jpg"; }

/* ════════════════════════════════════════════════════════════════════
   ① 업체 · 프로 — 빌드가 읽습니다 (`js/data/providers.generated.js`)
   ⚠️ 레슨 프로는 **새 표가 아니라 분류가 레슨인 업체**입니다(0071).
   ⚠️⚠️ **값 · 시설을 다 채우지 않습니다** — 「값을 아직 안 올리신 곳」이
   거르개에서 어떻게 빠지는지도 같이 보셔야 합니다(절대 규칙 1).
   ════════════════════════════════════════════════════════════════════ */
var PROVIDERS = [
  /* ── 레슨 프로 일곱 ───────────────────────────────────────────── */
  { id:"dm-ls-1", name:"(예시) 강남 스윙랩 김프로",
    intro:"KPGA 투어 경력 8년. 초보 그립 · 셋업부터 스윙 교정까지 1:1 로 맡습니다. 스크린 스윙 분석기로 매 수업 영상을 남겨 드립니다.",
    regions:["seoul"], gu:["강남구"], subs:["ls-solo","ls-group","ls-point"],
    kind:"biz", place_name:"(예시) 강남 스윙랩",
    lesson_goals:["beginner","swing","score"],
    since:2016, consult_hours:"평일 10:00~22:00 · 토 10:00~18:00",
    open_hours:"평일 06:00~23:00 · 주말 07:00~20:00",
    verified:{ brn:true, tel:true }, scale:"mid",
    photos:[{ url:ph("lesson-1"), caption:"실내 타석" },
            { url:ph("lesson-2"), caption:"스윙 분석실" }],
    prices:[{ sub:"ls-solo",  label:"1:1 레슨 8회권", amount:480000, unit:"8회", note:"타석료 포함" },
            { sub:"ls-solo",  label:"1:1 레슨 1회",   amount:70000,  unit:"1회" },
            { sub:"ls-group", label:"그룹 레슨 월 4회", amount:160000, unit:"월" },
            { sub:"ls-point", label:"원포인트 교정",    amount:50000,  unit:"1회" }] },
  { id:"dm-ls-2", name:"(예시) 분당 숏게임 이프로",
    intro:"숏게임과 퍼팅만 가르칩니다. 어프로치 거리감을 100야드 안쪽으로 나눠 잡아 드립니다.",
    regions:["gyeonggi"], gu:["분당구"], subs:["ls-short","ls-point"],
    kind:"person", lesson_goals:["short","score"],
    since:2019, consult_hours:"평일 13:00~21:00",
    scale:"small",
    photos:[{ url:ph("lesson-3"), caption:"퍼팅 연습 그린" }],
    prices:[{ sub:"ls-short", label:"숏게임 1회", amount:70000, unit:"1회" },
            { sub:"ls-short", label:"숏게임 10회권", amount:600000, unit:"10회" }] },
  { id:"dm-ls-3", name:"(예시) 인천 주니어 아카데미",
    intro:"초 · 중 · 고 선수반을 맡습니다. 체력 · 멘탈 프로그램을 같이 돌립니다.",
    regions:["incheon"], gu:["연수구"], subs:["ls-junior","ls-group"],
    kind:"biz", place_name:"(예시) 송도 주니어 골프아카데미",
    lesson_goals:["junior"],
    since:2013, verified:{ brn:true }, scale:"large",
    photos:[{ url:ph("lesson-4") }, { url:ph("range-3") }],
    prices:[{ sub:"ls-junior", label:"주니어 선수반 월", amount:900000, unit:"월" },
            { sub:"ls-group",  label:"주말 그룹반 월 4회", amount:220000, unit:"월" }] },
  { id:"dm-ls-4", name:"(예시) 부산 필드레슨 박프로",
    intro:"실전 라운드 코칭만 합니다. 9홀 · 18홀 동반 라운드로 코스 매니지먼트를 잡아 드립니다.",
    regions:["busan"], gu:["해운대구"], subs:["ls-field","ls-solo"],
    kind:"person", lesson_goals:["score","swing"],
    since:2017, scale:"small",
    photos:[{ url:ph("booking-4"), caption:"필드 레슨" }],
    prices:[{ sub:"ls-field", label:"9홀 동반 라운드", amount:250000, unit:"1회", note:"그린피 · 카트비 별도" },
            { sub:"ls-field", label:"18홀 동반 라운드", amount:400000, unit:"1회", note:"그린피 · 카트비 별도" }] },
  { id:"dm-ls-5", name:"(예시) 온라인 스윙첨삭 정프로",
    intro:"보내 주신 스윙 영상을 보고 48시간 안에 글 · 그림으로 첨삭해 드립니다.",
    regions:["seoul"], gu:["마포구"], subs:["ls-online"],
    kind:"person", lesson_goals:["swing","beginner"],
    since:2021, scale:"small",
    photos:[{ url:ph("lesson-5") }],
    prices:[{ sub:"ls-online", label:"영상 첨삭 1회", amount:30000, unit:"1회" },
            { sub:"ls-online", label:"영상 첨삭 5회권", amount:120000, unit:"5회" }] },
  { id:"dm-ls-6", name:"(예시) 대구 비거리 최프로",
    intro:"비거리 늘리기 전문. 지면반력과 회전 순서를 측정 장비로 보면서 잡습니다.",
    regions:["daegu"], gu:["수성구"], subs:["ls-solo","ls-point"],
    kind:"biz", place_name:"(예시) 수성 골프퍼포먼스",
    lesson_goals:["distance","swing"],
    since:2018, verified:{ brn:true, tel:true }, scale:"mid",
    photos:[{ url:ph("range-4") }],
    prices:[{ sub:"ls-solo", label:"1:1 레슨 10회권", amount:550000, unit:"10회" }] },
  /* ⚠️ **값을 아직 안 올리신 프로** — 가격대로 좁히면 빠지는 자리를
     그대로 보셔야 합니다(모르는 값을 아무 칸에나 넣으면 지어낸 값입니다). */
  { id:"dm-ls-7", name:"(예시) 광주 여성레슨 한프로",
    intro:"여성 · 시니어 회원만 받습니다. 천천히 가는 수업입니다.",
    regions:["gwangju"], subs:["ls-group","ls-solo"],
    kind:"person", lesson_goals:["beginner","senior"],
    since:2020, scale:"small",
    photos:[{ url:ph("lesson-6") }] },

  /* ── 연습장 다섯 ─────────────────────────────────────────────── */
  { id:"dm-rg-1", name:"(예시) 분당 그린실내연습장",
    intro:"실내 타석 스물네 개 · 스크린 여섯 대. 주차 두 시간 무료입니다.",
    regions:["gyeonggi"], gu:["분당구"], subs:["rg-in","rg-sim","rg-short"],
    range_opts:["indoor","screen","parking","lesson"],
    open_hours:"평일 06:00~24:00 · 주말 07:00~22:00",
    since:2015, verified:{ brn:true, tel:true }, scale:"large",
    photos:[{ url:ph("range-1"), caption:"실내 타석" }, { url:ph("range-2") }],
    prices:[{ sub:"rg-in",  label:"타석 1시간", amount:15000, unit:"1시간" },
            { sub:"rg-in",  label:"월 회원권",  amount:220000, unit:"월" },
            { sub:"rg-sim", label:"스크린 1게임", amount:25000, unit:"1게임" }] },
  { id:"dm-rg-2", name:"(예시) 강남 실외타석장",
    intro:"2층 실외 타석 마흔 개. 야간 조명이 있어 밤 11시까지 칩니다.",
    regions:["seoul"], gu:["강남구"], subs:["rg-out","rg-short"],
    range_opts:["outdoor","parking"],
    open_hours:"매일 05:30~23:00",
    since:2009, verified:{ brn:true }, scale:"large",
    photos:[{ url:ph("range-3") }],
    prices:[{ sub:"rg-out", label:"타석 1시간", amount:22000, unit:"1시간" }] },
  { id:"dm-rg-3", name:"(예시) 송파 스크린전용",
    intro:"스크린 전용입니다. 퇴근 뒤 시간대만 엽니다.",
    regions:["seoul"], gu:["송파구"], subs:["rg-sim"],
    range_opts:["screen"],
    open_hours:"평일 17:00~02:00 · 주말 12:00~24:00",
    since:2022, scale:"small",
    photos:[{ url:ph("range-4") }],
    prices:[{ sub:"rg-sim", label:"1시간", amount:18000, unit:"1시간" }] },
  { id:"dm-rg-4", name:"(예시) 대전 둔산연습장",
    intro:"실내 · 실외 타석을 같이 둡니다. 레슨 프로 세 분이 상주합니다.",
    regions:["daejeon"], gu:["서구"], subs:["rg-in","rg-out"],
    range_opts:["indoor","outdoor","parking"],
    open_hours:"평일 06:00~23:00",
    since:2012, verified:{ brn:true }, scale:"mid",
    photos:[{ url:ph("range-5") }],
    prices:[{ sub:"rg-in", label:"타석 1시간", amount:12000, unit:"1시간" }] },
  /* ⚠️ **시설도 값도 아직 안 올리신 곳** */
  { id:"dm-rg-5", name:"(예시) 제주 바다뷰연습장",
    intro:"아직 시설과 가격을 안 올리신 곳입니다.",
    regions:["jeju"], subs:["rg-out"], scale:"small" },

  /* ── 피팅 · 수리 다섯 ────────────────────────────────────────── */
  { id:"dm-ft-1", name:"(예시) 강남 클럽피팅랩",
    intro:"드라이버 · 아이언 풀피팅을 합니다. 런치모니터 두 대로 전후를 재고 보고서를 드립니다.",
    regions:["seoul"], gu:["강남구"], subs:["ft-driver","ft-iron","ft-shaft"],
    fit_ways:["visit","ship"],
    fit_terms:"공임만 받고 부품비는 따로 받습니다 · 피팅비는 클럽 구매 시 차감",
    brands:["타이틀리스트","캘러웨이","핑","테일러메이드"],
    since:2014, verified:{ brn:true, tel:true }, scale:"mid",
    photos:[{ url:ph("fitting-1"), caption:"피팅 스튜디오" }, { url:ph("fitting-2") }],
    prices:[{ sub:"ft-driver", label:"드라이버 피팅", amount:100000, unit:"1회" },
            { sub:"ft-iron",   label:"아이언 풀세트 피팅", amount:250000, unit:"1세트" },
            { sub:"ft-shaft",  label:"샤프트 교체", amount:35000, unit:"1개", note:"부품비 별도" }] },
  { id:"dm-ft-2", name:"(예시) 수원 그립교체 전문",
    intro:"그립 교체와 로프트 · 라이 조정을 합니다. 그립은 가져오셔도 됩니다.",
    regions:["gyeonggi"], gu:["수원시"], subs:["ft-grip","ft-angle"],
    fit_ways:["visit"], fit_terms:"그립을 가져오시면 공임만 받습니다",
    since:2018, scale:"small",
    photos:[{ url:ph("fitting-3") }],
    prices:[{ sub:"ft-grip",  label:"그립 교체", amount:12000, unit:"1개" },
            { sub:"ft-angle", label:"로프트 · 라이 조정", amount:20000, unit:"1개" }] },
  { id:"dm-ft-3", name:"(예시) 부산 클럽수리소",
    intro:"헤드 빠짐 · 샤프트 부러짐 수리만 맡습니다. 택배로도 받습니다.",
    regions:["busan"], subs:["ft-mend","ft-shaft"],
    fit_ways:["ship"], fit_terms:"택배비는 보내시는 분 부담입니다",
    since:2011, verified:{ brn:true }, scale:"small",
    photos:[{ url:ph("fitting-4") }],
    prices:[{ sub:"ft-mend", label:"헤드 재접착", amount:25000, unit:"1개" }] },
  { id:"dm-ft-4", name:"(예시) 일산 퍼터피팅",
    intro:"퍼터 길이 · 라이각 · 밸런스를 맞춥니다. 스트로크 측정 장비가 있습니다.",
    regions:["gyeonggi"], gu:["일산동구"], subs:["ft-angle","ft-grip"],
    fit_ways:["visit"],
    since:2020, scale:"small",
    photos:[{ url:ph("fitting-5") }],
    prices:[{ sub:"ft-angle", label:"퍼터 라이각 조정", amount:80000, unit:"1회" }] },
  /* ⚠️ **공임을 아직 안 올리신 곳** */
  { id:"dm-ft-5", name:"(예시) 대구 샤프트공방",
    intro:"아직 공임을 안 올리신 곳입니다. 전화로 여쭤 주세요.",
    regions:["daegu"], subs:["ft-shaft"], fit_ways:["visit","ship"], scale:"small" },

  /* ── 용품 마켓 넷 ────────────────────────────────────────────── */
  { id:"dm-mk-1", name:"(예시) 송파 골프프라자",
    intro:"클럽 · 볼 · 의류를 함께 팝니다. 매장에서 시타하고 사실 수 있습니다.",
    regions:["seoul"], gu:["송파구"], subs:["mk-club","mk-ball","mk-wear"],
    brands:["타이틀리스트","캘러웨이","핑"],
    open_hours:"매일 10:00~21:00",
    since:2010, verified:{ brn:true }, scale:"large",
    photos:[{ url:ph("market-1"), caption:"매장" }, { url:ph("market-2") }] },
  { id:"dm-mk-2", name:"(예시) 수원 골프슈즈&장갑",
    intro:"신발과 장갑 · 액세서리만 다룹니다. 발볼 넓은 분 상담해 드립니다.",
    regions:["gyeonggi"], gu:["수원시"], subs:["mk-shoe","mk-acc"],
    since:2017, scale:"small",
    photos:[{ url:ph("market-3") }] },
  { id:"dm-mk-3", name:"(예시) 부산 연습용품점",
    intro:"연습용품과 대여를 합니다. 퍼팅매트 · 스윙연습기를 주로 둡니다.",
    regions:["busan"], subs:["mk-train","mk-rent"],
    since:2019, scale:"small",
    photos:[{ url:ph("market-4") }] },
  { id:"dm-mk-4", name:"(예시) 인천 골프의류 아울렛",
    intro:"지난 시즌 의류를 모아 팝니다. 사이즈 교환은 매장에서만 됩니다.",
    regions:["incheon"], gu:["남동구"], subs:["mk-wear"],
    since:2016, verified:{ brn:true }, scale:"mid",
    photos:[{ url:ph("market-5") }] },

  /* ── 부킹 · 여행 업체 (티타임 · 여행 상품을 올리는 자리) ─────── */
  { id:"dm-bk-1", name:"(예시) 수도권 부킹센터",
    intro:"수도권 제휴 골프장 티타임을 모아 드립니다.",
    regions:["seoul","gyeonggi","incheon"], subs:["bk-find","bk-time"],
    since:2015, verified:{ brn:true, tel:true }, scale:"mid",
    photos:[{ url:ph("booking-1") }] },
  { id:"dm-bk-2", name:"(예시) 영남 부킹하우스",
    intro:"영남권 골프장 티타임을 다룹니다.",
    regions:["busan","daegu","gyeongnam"], subs:["bk-find","bk-time"],
    since:2018, verified:{ brn:true }, scale:"small",
    photos:[{ url:ph("booking-2") }] },
  { id:"dm-tr-1", name:"(예시) 골프여행 투어원",
    intro:"일본 · 동남아 골프 패키지를 만듭니다. 인솔자가 같이 갑니다.",
    regions:["seoul"], gu:["중구"], subs:["tr-away","tr-pack","tr-quote"],
    since:2012, verified:{ brn:true, tel:true }, scale:"mid",
    photos:[{ url:ph("travel-1") }, { url:ph("travel-2") }] },
  { id:"dm-tr-2", name:"(예시) 제주 골프텔 투어",
    intro:"제주 골프텔 숙박 + 라운드 패키지를 다룹니다.",
    regions:["jeju"], subs:["tr-home","tr-tel"],
    since:2016, verified:{ brn:true }, scale:"small",
    photos:[{ url:ph("travel-3") }] }
];

/* ── 후기 ─────────────────────────────────────────────────────────
   ⚠️⚠️ **평균을 저장하지 않습니다** — `amRating()` 이 이 줄들에서
   셉니다(절대 규칙 1). 그래서 후기 0건인 업체는 별이 안 찍힙니다. */
var REVIEWS = [
  { id:"dm-rv-1", provider_id:"dm-ls-1", rating:5, who:"김**",
    body:"그립부터 다시 잡아 주셔서 두 달 만에 슬라이스가 잡혔습니다.",
    created_at:ago(24 * 6) },
  { id:"dm-rv-2", provider_id:"dm-ls-1", rating:4, who:"이**",
    body:"영상으로 전후를 보여 주시니 뭐가 달라졌는지 알겠습니다.",
    created_at:ago(24 * 20) },
  { id:"dm-rv-3", provider_id:"dm-ls-1", rating:5, who:"박**",
    body:"예약 잡기가 조금 어렵지만 수업은 좋았습니다.",
    created_at:ago(24 * 33) },
  { id:"dm-rv-4", provider_id:"dm-ls-2", rating:5, who:"최**",
    body:"어프로치 거리감이 확실히 생겼습니다.", created_at:ago(24 * 9) },
  { id:"dm-rv-5", provider_id:"dm-rg-1", rating:4, who:"정**",
    body:"타석이 넓고 관리가 잘 되어 있습니다. 주차가 편합니다.",
    created_at:ago(24 * 4) },
  { id:"dm-rv-6", provider_id:"dm-rg-1", rating:5, who:"강**",
    body:"스크린도 같이 있어서 비 오는 날에도 갑니다.", created_at:ago(24 * 15) },
  { id:"dm-rv-7", provider_id:"dm-ft-1", rating:5, who:"윤**",
    body:"샤프트를 바꾸고 방향이 잡혔습니다. 보고서가 자세합니다.",
    created_at:ago(24 * 11) },
  { id:"dm-rv-8", provider_id:"dm-ft-2", rating:4, who:"임**",
    body:"그립 교체가 빠르고 깔끔했습니다.", created_at:ago(24 * 27) },
  { id:"dm-rv-9", provider_id:"dm-mk-1", rating:4, who:"조**",
    body:"시타하고 살 수 있어 좋았습니다.", created_at:ago(24 * 18) }
];


/* ════════════════════════════════════════════════════════════════════
   ③ 전국 골프장 마스터 — 빌드가 읽습니다 (`js/data/courses.generated.js`)

   ⚠️⚠️⚠️ **이름이 `rows.js` 의 티타임 `course` 와 맞아야** 합니다 —
   「골프장 정보」 탭과 「예약 가능한 티타임」 탭이 **같은 골프장**을
   말해야 하기 때문입니다. 둘이 다르면 시연을 보시는 분이 "이 골프장은
   왜 자리가 없지" 로 읽습니다.
   ⚠️ 티타임 쪽에는 「… 신코스」 · 「… 구코스」 처럼 코스 이름이 붙은
   줄이 있습니다 — 마스터는 **골프장 하나**이고 그게 맞습니다(0066 의
   트리거도 이름이 **정확히 같을 때만** 잇습니다).

   ⚠️⚠️ **값을 다 채우지 않습니다** — 홀 수를 안 적은 곳 · 홈페이지가
   없는 곳 · 폐업한 곳 자리가 화면에 어떻게 보이는지도 보셔야 합니다.
   ⚠️⚠️ **좌표는 한 줄도 없습니다** — 0066 이 확인 전에는 비워 두는
   자리입니다(틀린 좌표로 지도에 찍으면 손님을 엉뚱한 곳으로 보냅니다).
   ⚠️ 사진은 **분류 사진을 자리를 달리해 잘라 만든 것**입니다 — 그
   골프장의 실제 사진이 아니고, 시연 서버의 띠가 그 사실을 적습니다.
   ════════════════════════════════════════════════════════════════════ */
var COURSES = [
  { id:"dm-cs-1", slug:"dm-cs-1", kind:"golf", name:"(예시) 그린밸리CC",
    region:"gyeonggi", gu:"용인시", addr_road:"경기 용인시 처인구 (예시)로 11",
    tel:"031-000-0011", holes:36, biz_kind:"대중제",
    site_url:"https://example.com/demo/greenvalley", state:"open",
    photo_url:ph("booking-1") },
  { id:"dm-cs-2", slug:"dm-cs-2", kind:"golf", name:"(예시) 북한산뷰CC",
    region:"gyeonggi", gu:"고양시", addr_road:"경기 고양시 덕양구 (예시)로 22",
    holes:18, biz_kind:"회원제", state:"open", photo_url:ph("booking-2") },
  { id:"dm-cs-3", slug:"dm-cs-3", kind:"golf", name:"(예시) 서해솔밭CC",
    region:"incheon", gu:"중구", addr_road:"인천 중구 (예시)로 33",
    tel:"032-000-0033", holes:27, biz_kind:"대중제",
    site_url:"https://example.com/demo/seohae", state:"open",
    photo_url:ph("booking-3") },
  { id:"dm-cs-4", slug:"dm-cs-4", kind:"golf", name:"(예시) 한강뷰CC",
    region:"seoul", gu:"강서구", addr_road:"서울 강서구 (예시)로 44",
    holes:9, biz_kind:"퍼블릭", state:"open", photo_url:ph("booking-4") },
  /* ⚠️ 홀 수 · 유형 · 홈페이지 · 사진을 **안 적은** 곳 — 그 줄이
     카드에서 빠지고 아이콘 타일로 돌아가는지 보셔야 합니다 */
  { id:"dm-cs-5", slug:"dm-cs-5", kind:"golf", name:"(예시) 설악하이랜드CC",
    region:"gangwon", gu:"속초시", addr_road:"강원 속초시 (예시)로 55",
    state:"open" },
  { id:"dm-cs-6", slug:"dm-cs-6", kind:"golf", name:"(예시) 금강힐스CC",
    region:"chungnam", gu:"천안시", addr_road:"충남 천안시 (예시)로 66",
    holes:18, biz_kind:"대중제", state:"open", photo_url:ph("booking-5") },
  { id:"dm-cs-7", slug:"dm-cs-7", kind:"golf", name:"(예시) 남강레이크CC",
    region:"gyeongnam", gu:"진주시", addr_road:"경남 진주시 (예시)로 77",
    holes:18, state:"open", photo_url:ph("booking-6") },
  { id:"dm-cs-8", slug:"dm-cs-8", kind:"golf", name:"(예시) 해운대오션CC",
    region:"busan", gu:"기장군", addr_road:"부산 기장군 (예시)로 88",
    holes:18, biz_kind:"회원제",
    site_url:"https://example.com/demo/haeundae", state:"open",
    photo_url:ph("booking-7") },
  { id:"dm-cs-9", slug:"dm-cs-9", kind:"golf", name:"(예시) 한라오름CC",
    region:"jeju", gu:"서귀포시", addr_road:"제주 서귀포시 (예시)로 99",
    holes:27, biz_kind:"대중제", state:"open", photo_url:ph("booking-8") },
  { id:"dm-cs-10", slug:"dm-cs-10", kind:"golf", name:"(예시) 남도바다CC",
    region:"jeonnam", gu:"여수시", addr_road:"전남 여수시 (예시)로 10",
    holes:18, state:"open" },
  { id:"dm-cs-11", slug:"dm-cs-11", kind:"golf", name:"(예시) 팔공산뷰CC",
    region:"daegu", gu:"동구", addr_road:"대구 동구 (예시)로 11",
    holes:18, biz_kind:"대중제", state:"open", photo_url:ph("booking-9") },
  { id:"dm-cs-12", slug:"dm-cs-12", kind:"golf", name:"(예시) 울산바다CC",
    region:"ulsan", gu:"울주군", addr_road:"울산 울주군 (예시)로 12",
    holes:18, state:"open" },
  /* 폐업 — ⚠️ 지우지 않고 **맨 뒤에서 그 자리에서 말합니다**(0066) */
  { id:"dm-cs-13", slug:"dm-cs-13", kind:"golf", name:"(예시) 옛터CC",
    region:"gyeonggi", gu:"이천시", addr_road:"경기 이천시 (예시)로 13",
    holes:9, biz_kind:"대중제", state:"closed" },
  /* 연습장 — ⚠️ 부킹 탭에는 **안 나와야** 합니다(kind 가 다릅니다) */
  { id:"dm-cs-14", slug:"dm-cs-14", kind:"range", name:"(예시) 한강 골프연습장",
    region:"seoul", gu:"영등포구", addr_road:"서울 영등포구 (예시)로 14",
    state:"open", photo_url:ph("range-1") }
];

module.exports = { PROVIDERS: PROVIDERS, REVIEWS: REVIEWS, COURSES: COURSES,
                   kst: kst, ago: ago, ph: ph };

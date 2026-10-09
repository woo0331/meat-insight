/* ════════════════════════════════════════════════════════════════════
   사장님의 네 가지 여정 (2026-10-05 V2 지시서 §1 · §4 · §8 · §31)

   > "창업 → 운영 → 인수·양도 → 폐업까지 사업자의 **전체 생애주기**를
   >  연결하는 플랫폼"

   ⚠️⚠️ **새 분류를 만든 것이 아닙니다.** `catalog.js` 의 분류 스물다섯과
   `lifecycle.js` 의 단계 여섯을 **손님이 자기 입으로 말하는 네 마디**로
   묶어 보는 틀입니다. key · 이름 · 하위 · 주소가 하나도 안 바뀌었습니다 —
   업체(`subs`) · 매물(`sub`) · 글(`cat`) · 업종(`startup`/`closure`)이
   전부 그 key 를 쓰기 때문에, 바꾸면 **등록된 모든 데이터가 조용히
   어긋납니다.**

       여정 넷  ──묶음──▶  단계 여섯  ──묶음──▶  분류 스물다섯
       (손님의 말)          (사업의 흐름)         (서비스의 단위)

   ⚠️ **단계 여섯을 지우지 마세요.** 여정은 "지금 내가 뭘 하려는가" 를
   고르는 **입구**이고, 단계는 그 안에서 **무엇부터 하는가**를 보는
   틀입니다. 둘은 같은 분류를 다른 각도로 가리킵니다.

   ⚠️⚠️ **여정 넷이 단계 여섯을 빠짐없이 나눠 가집니다.** `check.js` 가
   빠진 것 · 겹치는 것 · 없는 키를 전부 잡습니다.
   ════════════════════════════════════════════════════════════════════ */

window.AM_JOURNEYS = [
  { key:"startup",  no:"01", name:"창업 준비",   short:"창업",
    icon:"seed",     tone:"pt", side:"start", to:"/startup",
    q:"처음 시작하거나 새로운 매장을 준비하고 있어요",
    lead:"무엇부터 해야 하는지 순서대로 짚어 드립니다.",
    sub:"상권 · 점포 · 인테리어 · 장비 · 인허가 · 자금",
    stages:["startup","location","build"] },

  { key:"operation", no:"02", name:"매장 운영",  short:"운영",
    /* ⚠️ 운영은 창업도 폐업도 아닙니다 — 한쪽 색으로 칠하면
       "여긴 내 자리가 아니네" 가 됩니다. 중립(파랑)입니다. */
    icon:"store",   tone:"t2", side:"both", to:"/operation",
    q:"현재 가게를 운영하고 있어요",
    lead:"운영하다 막히는 자리마다 맡길 곳이 있습니다.",
    sub:"세무 · 노무 · 인력 · POS · 식자재 · 청소 · 마케팅",
    stages:["operation"] },

  /* ⚠️⚠️ `both` — 넘기시는 분과 받으시는 분이 **같은 화면**을 봅니다.
     한쪽 색으로 칠하면 다른 쪽에게 "여긴 내 자리가 아니네" 가 됩니다
     (`/stores` · `/assets` 를 중립으로 둔 것과 같은 까닭입니다). */
  { key:"acquisition", no:"03", name:"인수 · 양도", short:"인수·양도",
    icon:"handover", tone:"t3", side:"both", to:"/transfer",
    q:"가게를 인수하거나 넘기고 싶어요",
    lead:"한 사장님의 끝이 다른 사장님의 시작이 됩니다.",
    sub:"매장 매물 · 권리금 · 시설 인수 · 계약 · 승계",
    stages:["transfer"] },

  { key:"closing",  no:"04", name:"폐업 · 정리", short:"폐업",
    icon:"box",     tone:"t13", side:"close", to:"/closure",
    q:"사업을 정리하고 있어요",
    lead:"순서와 기한이 있는 일이라 빠뜨리면 돈이 나갑니다.",
    sub:"직원 · 재고 · 시설 · 철거 · 원상복구 · 폐업신고",
    stages:["closing"] }
];

/* ── 준비 과정 ───────────────────────────────────────────────────
   지시서 §4(창업 12단계) · §8(폐업 13단계) 를 그대로 옮겼습니다.

   ⚠️⚠️ **걸음마다 걸리는 것은 전부 "실제로 있는 것"** 입니다 —
   `cat` 은 `catalog.js` 의 분류 key, `sub` 는 그 분류의 하위 key,
   `read` 는 `content.js` 의 slug, `tool` 은 `tools.js` 의 key,
   `to` 는 실제 주소입니다. 하나라도 없는 것을 적으면 **가짜 링크**이고
   절대 규칙 5 입니다 — `build-pages.js` 의 `checkProcess()` 가
   빌드를 멈춥니다.
   ⚠️ **금액을 적지 마세요.** 걸음마다 "얼마" 는 지역 · 평수 · 업종에
   따라 몇 배로 갈립니다. 적는 것은 **무엇을 해야 하는가**까지이고,
   금액은 사장님이 받으신 견적을 도구에 적어 보시는 쪽입니다. */
window.AM_PROCESS = {

  /* 창업 — 지시서 §4 의 열두 걸음 */
  startup: [
    /* ⚠️ 2026-10-06 V2 확정 지시서 §6 이 적은 열두 걸음을 맞췄습니다 —
       맨 앞의 **아이템 · 업종 결정**과 아홉째 **세무 · 노무**가 빠져
       있었습니다. 원래 있던 `POS · CCTV` · `식자재 · 거래처` 는 실제
       걸음이라 그대로 두어 **열넷**입니다 (지시서의 열둘이 전부
       들어 있습니다). */
    { name:"아이템 · 업종 결정", lead:"무엇을 파는 가게인지부터 정합니다.",
      check:"내가 팔려는 것이 신고 대상인지 등록인지 허가인지부터 확인하세요 — 준비 기간이 여기서 갈립니다.",
      cat:"item", read:"franchise-vs-dokrip", to2:"/franchise", to2n:"프랜차이즈 보기" },
    { name:"사업계획",        lead:"무엇을 얼마로 시작할지부터 정합니다.",
      check:"매출보다 한 달 고정비를 먼저 적어 보세요. 못 버는 달에도 그대로 나가는 돈입니다.",
      cat:"item", tool:"cost", read:"franchise-vs-dokrip", to2:"/support", to2n:"자금 · 지원사업" },
    { name:"상권분석",        lead:"그 동네에 그 가게가 되는지 봅니다.",
      check:"낮과 밤, 평일과 주말에 각각 가 보세요. 한 번 본 거리는 그 시간대의 거리일 뿐입니다.",
      cat:"area", read:"sanggwon-boneun-sunseo" },
    { name:"점포 선정",       lead:"조건을 정하고 매물을 봅니다.",
      check:"건축물대장의 용도가 내 업종을 받는지 확인하세요. 계약한 뒤에 알면 되돌릴 수 없습니다.",
      cat:"store", to:"/stores", read:"sangga-gyeyak-check" },
    { name:"임대차 계약",     lead:"보증금 · 월세 · 권리금과 특약을 맞춥니다.",
      check:"원상복구 범위와 갱신 조건을 특약에 적으세요. 나갈 때 쓸 돈이 여기서 정해집니다.",
      cat:"store", read:"gwolligeum-bohostory", tool:"vs" },
    { name:"인테리어 · 시공", lead:"전기 · 가스 · 배관 · 소방이 같이 갑니다.",
      check:"견적서에 자재 · 수량 · 공정별 금액이 적혀 있는지 보세요. 뭉뚱그린 금액은 견줄 수가 없습니다.",
      cat:"interior", read:"interior-gyeyak-check" },
    { name:"시설 · 장비",     lead:"새것 · 중고 · 리스를 비교합니다.",
      check:"중고는 A/S 와 부품 수급을, 리스는 중도해지 위약금을 먼저 확인하세요.",
      cat:"equip", read:"jangbi-sae-junggo-lease", to2:"/assets", to2n:"중고 시설 · 장비" },
    { name:"인허가",          lead:"신고인지 등록인지 허가인지부터 갈립니다.",
      check:"업종마다 근거 법과 시설 기준이 다릅니다. 공사 전에 관할 기관에 확인하세요 — 공사 뒤면 뜯어야 합니다.",
      cat:"admin", read:"inheoga-jongryu" },
    { name:"POS · CCTV",      lead:"약정과 위약금을 먼저 봅니다.",
      check:"약정 기간 · 중도해지 위약금 · 폐업할 때 어떻게 되는지를 계약서에서 확인하세요.",
      cat:"it", read:"pos-kiosk-gyeyak" },
    { name:"식자재 · 거래처", lead:"단가보다 조건이 오래 갑니다.",
      check:"최소 주문량 · 결제 조건 · 반품 규정을 단가보다 먼저 보세요.",
      cat:"supply", read:"georaecheo-cheot-gyeyak" },
    { name:"세무 · 노무",     lead:"사업자등록 다음은 기장과 4대보험입니다.",
      check:"간이과세인지 일반과세인지, 그리고 내 업종이 간이과세가 되는 업종인지 확인하세요.",
      cat:"admin", sub:"tax-agent", tool:"hire", read:"sabeopja-deungrok" },
    { name:"직원 채용",       lead:"근로계약서와 4대보험이 첫날부터입니다.",
      check:"근로계약서는 첫 출근일에 써서 한 부를 드려야 합니다. 4대보험 신고 기한도 같이 확인하세요.",
      cat:"staff", read:"cheot-jigwon" },
    { name:"마케팅",          lead:"열기 전에 알려야 열고 나서 옵니다.",
      check:"지도 등록은 돈이 안 듭니다. 광고비를 쓰기 전에 공짜로 되는 것부터 끝내세요.",
      cat:"marketing", read:"gwanggo-munggu-gyusik" },
    { name:"오픈",            lead:"청소 · 시운전 · 한 달 고정비를 확인합니다.",
      check:"열기 전에 한 달 고정비와 본전 매출을 숫자로 확인하세요.",
      cat:"clean", tool:"fixed", read:"cheongso-bangyeok-euimu" }
  ],

  /* 폐업 — 지시서 §8 의 열세 걸음 */
  closing: [
    { name:"폐업 여부 결정",     lead:"넘기는 길이 있는지부터 봅니다.",
      check:"넘길 수 있는 가게인지 먼저 보세요. 양도가 되면 철거비와 원상복구가 줄어듭니다.",
      read:"pyeeop-sunseo", tool:"close", cat:"process" },
    { name:"임대차계약 확인",    lead:"원상복구 범위와 통보 기한이 계약서에 있습니다.",
      check:"해지 통보 기한과 원상복구 범위를 계약서에서 찾으세요. 기한을 넘기면 저절로 연장되는 계약이 있습니다.",
      cat:"restore", read:"wonsang-bokgu-beomwi" },
    { name:"직원 정리",          lead:"해고예고 · 퇴직금 · 상실 신고에 기한이 있습니다.",
      check:"해고예고 · 퇴직금 · 4대보험 상실 신고에 각각 기한이 있습니다. 날짜부터 적어 두세요.",
      cat:"labor", read:"pyeeop-jigwon-jeongri" },
    { name:"거래처 정산",        lead:"문을 닫아도 살아 있는 약정이 있습니다.",
      check:"정기 결제 · 렌탈 · 구독처럼 문을 닫아도 빠져나가는 것을 목록으로 만드세요.",
      cat:"contract", read:"gyeyak-haeji-modu" },
    { name:"재고 정리",          lead:"처분보다 세금이 먼저입니다.",
      check:"싸게 넘기더라도 세금계산서를 주고받으세요. 남는 것은 처분가가 아니라 증빙입니다.",
      cat:"stock", to:"/assets", read:"pyeeop-jaego-bugase" },
    { name:"시설 · 집기 매각",   lead:"내 것인지부터 확인하고 내놓습니다.",
      check:"임대인 것인지 · 리스 중인지 · 내 것인지부터 확인하세요. 내 것이 아닌 것을 팔면 문제가 됩니다.",
      cat:"asset", to:"/assets", read:"jangbi-nomgil-ttae-nae-geot" },
    { name:"매장 양도 검토",     lead:"통째로 넘기면 철거비가 안 듭니다.",
      check:"권리금과 시설 포함 범위를 목록으로 적어 두세요. 말로만 맞추면 반드시 어긋납니다.",
      cat:"transfer", to:"/stores", read:"maejang-yangdo-gyeyak" },
    { name:"사업자 폐업신고",    lead:"어디에 무엇을 먼저 내는지 순서가 있습니다.",
      check:"세무서와 인허가 기관 중 어디에 먼저 내는지가 업종마다 다릅니다.",
      cat:"tax", read:"pyeeop-sunseo" },
    { name:"세무 정산",          lead:"놓치면 가산세가 붙는 기한이 있습니다.",
      check:"폐업일을 기준으로 부가세 확정신고 기한이 따로 있습니다. 놓치면 가산세입니다.",
      cat:"tax", read:"pyeeop-bugase-gihan" },
    { name:"철거",               lead:"견적을 가르는 것은 평수가 아닙니다.",
      check:"폐기물 처리비가 견적에 들어 있는지, 처리 증명을 주는지 확인하세요.",
      cat:"demolish", read:"cheolgeo-gyeonjeok-gareuneun-geot" },
    { name:"원상복구",           lead:"어디까지가 내 몫인지 먼저 확인합니다.",
      check:"계약서에 적힌 범위와 입주 당시 사진을 먼저 맞춰 보세요.",
      cat:"restore", read:"wonsang-bokgu-beomwi" },
    { name:"보증금 반환",        lead:"다툼이 생기면 소송 말고 먼저 있는 자리들이 있습니다.",
      check:"정산 내역을 서면으로 받으세요. 공제 항목이 적혀 있어야 다툴 수 있습니다.",
      cat:"law", read:"datum-saenggyeoss-eul-ttae" },
    { name:"폐업지원 확인",      lead:"조건만 맞으면 받는 것이 있습니다.",
      check:"신청 기한이 폐업 신고 전인지 뒤인지 공고 원문에서 확인하세요.",
      cat:"support", to:"/support", read:"pyeeop-hal-ttae-batneun-geot" }
  ],

  /* 인수 — 받는 쪽 */
  "acq-in": [
    { name:"새로 할지, 받을지", lead:"들어가는 돈과 문 여는 시점이 다릅니다.",
      check:"같은 돈이면 어느 쪽이 먼저 문을 여는지 따져 보세요. 시간도 비용입니다.",
      tool:"vs", read:"gwolligeum-bohostory" },
    { name:"조건 정하기",       lead:"지역 · 업종 · 평수 · 예산을 먼저 좁힙니다.",
      check:"예산은 권리금만이 아니라 보증금 · 시설인수비 · 운영 자금까지 합쳐서 잡으세요.",
      to:"/stores", cat:"store" },
    { name:"매장 찾기",         lead:"보증금 · 월세 · 권리금으로 추립니다.",
      check:"적힌 값은 전부 올리신 사장님이 적은 값입니다. 확인된 값과 구별해서 보세요.",
      to:"/stores", cat:"transfer" },
    { name:"현장 확인",         lead:"계약 전에 봐야 할 것이 정해져 있습니다.",
      check:"낮과 밤에 각각 가 보고 간판 · 설비 · 누수 · 환기를 직접 보세요.",
      read:"sangga-gyeyak-check" },
    { name:"매출 · 비용 확인",  lead:"적힌 매출은 올리신 사장님이 적은 값입니다.",
      check:"카드 매출 자료와 임대료 · 인건비 영수증을 직접 보여 달라고 하세요.",
      tool:"bep", read:"gwolligeum-bohostory" },
    { name:"권리금 · 시설 범위",lead:"무엇까지 같이 오는지 목록으로 맞춥니다.",
      check:"무엇이 같이 오는지 품목 목록을 만들고 양쪽이 서명하세요.",
      to:"/assets", cat:"asset" },
    { name:"임대차 승계 · 계약",lead:"건물주 동의가 없으면 승계가 안 됩니다.",
      check:"건물주 동의 없이는 승계가 안 됩니다. 동의를 받기 전에 권리금을 치르지 마세요.",
      cat:"law", read:"maejang-yangdo-gyeyak" },
    { name:"인허가 승계",       lead:"업종에 따라 신고를 새로 해야 합니다.",
      check:"승계되는 업종과 새로 신고해야 하는 업종이 갈립니다. 관할 기관에 먼저 확인하세요.",
      cat:"admin", read:"inheoga-jongryu" },
    /* ⚠️ 2026-10-08 §13 — 받고 나서 **바로 열 수 있게** 하는 걸음이
       빠져 있었습니다. 인수는 계약으로 끝나는 것이 아니라 그날부터
       장사가 되어야 하는 일입니다. */
    { name:"운영 준비",         lead:"받은 다음 바로 열 수 있게 맞춥니다.",
      check:"인수 전 마지막 영업일과 내 첫 영업일 사이에 할 것을 적어 두세요 — 청소 · 간판 · 결제 단말 · 거래처 인수인계가 하루 안에 다 안 됩니다.",
      to:"/operation" }
  ],

  /* 양도 — 넘기는 쪽 */
  /* ⚠️⚠️ **2026-10-08 지시서 §15 의 열 걸음**입니다 (전에는 일곱).
     `/transfer?t=out` 과 `/closure?w=pass` 가 **같은 것**을 씁니다 —
     두 곳에 적으면 어긋납니다 (§19 콘텐츠 중복 방지).
     ⚠️ 걸음마다 적는 `cat` · `sub` · `read` · `tool` · `to` 는 전부
     **실제로 있는 것**이라야 합니다. 없는 것을 적으면 가짜 링크이고
     `checkProcess()` 가 빌드를 멈춥니다.
     ⚠️ **금액을 적지 마세요** — 지역 · 평수 · 업종에 따라 몇 배로
     갈립니다. 적는 것은 무엇을 해야 하는가까지입니다. */
  "acq-out": [
    { name:"매장 기본정보",     lead:"업종 · 지역 · 평수 · 영업기간부터 적습니다.",
      check:"넘길지 정리할지부터 정하세요 — 철거 · 원상복구에 들 돈을 먼저 뽑아 보면 양도를 따지는 기준선이 나옵니다.",
      read:"pyeeop-sunseo", tool:"closecost" },
    { name:"임대차 조건",       lead:"남은 기간 · 보증금 · 월세 · 관리비를 정리합니다.",
      check:"건물주 동의 없이 승계되는 계약은 없습니다. 내놓기 전에 말씀을 한 번 꺼내 두세요.",
      cat:"law", read:"sangga-gyeyak-check" },
    { name:"매출 · 비용자료",   lead:"보여 드릴 자료를 미리 한 벌로 묶습니다.",
      check:"매출은 사장님이 적으신 값으로 나갑니다 — 카드 매출 · 부가세 신고서처럼 근거가 되는 것을 같이 준비하세요.",
      cat:"tax", read:"pyeeop-bugase-gihan" },
    { name:"권리금",            lead:"얼마가 적정한지가 아니라 무엇이 금액을 가르는지부터.",
      check:"받으실 금액을 월 순이익으로 나눠 보세요 — 인수하시는 분이 제일 먼저 하는 계산입니다.",
      cat:"transfer", sub:"premium", tool:"premium", read:"gwolligeum-bohostory" },
    { name:"시설 · 장비",       lead:"무엇까지 같이 가는지 품목으로 적습니다.",
      check:"리스 · 할부 · 렌탈이 남은 장비는 따로 표시하세요 — 내 것이 아니면 넘길 수 없습니다.",
      cat:"transfer", sub:"equip-transfer", read:"jangbi-nomgil-ttae-nae-geot" },
    { name:"양도조건",          lead:"권리금 · 시설 포함 범위 · 넘길 시점을 정합니다.",
      check:"「있는 그대로」 는 나중에 다툼이 됩니다. 포함 · 제외를 품목으로 적으세요.",
      read:"maejang-yangdo-gyeyak", cat:"transfer" },
    { name:"매장 등록",         lead:"조건을 적어 보내 주시면 사람이 확인하고 올려 드립니다.",
      check:"연락처 · 상호 · 번지 주소는 매물에 안 나갑니다. 지역은 시 · 군 · 구까지입니다.",
      to:"/sell", cat:"transfer" },
    { name:"인수 희망자 연결",  lead:"보러 오시는 분과 조건을 맞춥니다.",
      check:"보여 드릴 서류를 미리 한 벌 묶어 두세요 — 임대차계약서 · 매출 근거 · 시설 목록.",
      cat:"transfer", sub:"find-buyer" },
    { name:"계약 검토",         lead:"넘기는 날과 정산 기준일을 맞춥니다.",
      check:"넘기는 날과 정산 기준일을 하루 단위로 맞추세요. 공과금 · 월세 · 재고가 그 날짜로 갈립니다.",
      cat:"law", read:"maejang-yangdo-gyeyak" },
    { name:"인계",              lead:"넘긴 뒤에도 내 이름으로 남는 것이 있습니다.",
      check:"폐업 신고를 안 하면 내 이름으로 세금과 과태료가 계속 붙습니다. 기한이 있습니다.",
      cat:"tax", read:"pyeeop-bugase-gihan" }
  ],

  /* ⚠️⚠️ **2026-10-08 지시서 §16 — 시설 · 장비만 정리하실 때**입니다.
     전에는 이 길이 **로드맵 없이 분류 카드로만** 있었습니다. 매장은
     안 넘기고 장비만 파시는 분이 제일 많은데, 그분께는 "무엇부터" 가
     없었습니다.
     ⚠️ 1 · 2 를 갈라 둔 까닭 — **붙박이**(떼면 못 쓰는 것)와 **떼어
     옮길 수 있는 것**은 가는 곳이 다릅니다. 앞은 원상복구 범위를
     가르고 뒤는 중고로 팔립니다. 한 걸음으로 묶으면 그 구분이 묻힙니다. */
  "asset-out": [
    { name:"시설 목록 작성",    lead:"붙박이로 들어간 것부터 적습니다.",
      check:"떼면 못 쓰는 것과 떼어 갈 수 있는 것을 갈라 적으세요 — 원상복구 범위가 거기서 갈립니다.",
      cat:"restore", read:"wonsang-bokgu-beomwi" },
    { name:"장비 목록 작성",    lead:"떼어 옮길 수 있는 것을 품목으로.",
      check:"제조사 · 연식 · 수량을 같이 적으세요. 없으면 값이 안 매겨집니다.",
      cat:"asset", sub:"kitchen-eq" },
    { name:"재사용 가능 여부",  lead:"연식과 상태, 수리 이력을 봅니다.",
      check:"직접 켜 보고 적으세요. 고장을 숨기면 가져가신 분이 그대로 돌려보냅니다.",
      cat:"asset" },
    { name:"양도 가능 여부",    lead:"리스 · 할부 · 렌탈이 남았는지부터.",
      check:"내 것이 아닌 장비는 넘길 수 없습니다 — 계약서부터 확인하세요.",
      cat:"contract", sub:"rental", read:"jangbi-nomgil-ttae-nae-geot" },
    { name:"판매 가능 여부",    lead:"중고로 수요가 있는 것과 없는 것이 갈립니다.",
      check:"업종 전용 장비는 같은 업종에서 더 받습니다. 급하게 넘기기 전에 같은 업종 쪽을 먼저 보세요.",
      to:"/assets", cat:"asset" },
    { name:"폐기 대상 구분",    lead:"남는 것은 그대로 비용입니다.",
      check:"사업장 폐기물은 종량제 봉투로 못 버립니다 — 치운 것보다 처리 증명이 남습니다.",
      cat:"waste", read:"pyegimul-jeungmyeong" },
    { name:"상태 · 가격 정리",  lead:"품목마다 상태와 희망가를 적습니다.",
      check:"사진은 켜 놓고 찍으세요. 꺼진 장비 사진은 고장으로 읽힙니다.",
      tool:"closecost" },
    { name:"판매 · 양도",       lead:"적어 보내 주시면 사람이 확인하고 올려 드립니다.",
      check:"바로 올라가지 않습니다 — 올리기 전에 한 번 연락드립니다.",
      to:"/sell?t=asset", cat:"asset" },
    { name:"남은 물품 처리",    lead:"안 팔린 것과 폐기할 것을 치웁니다.",
      check:"수거 날짜를 원상복구 공사보다 앞으로 잡으세요 — 치우고 들어가야 공사가 됩니다.",
      cat:"waste", sub:"biz-waste", read:"pyegimul-jeungmyeong" }
  ]
};

/* ── 운영 중에 막히는 자리 (지시서 §6) ───────────────────────────
   ⚠️ 창업할 때 한 번 쓰고 마는 사이트가 되지 않게 하는 구간입니다.
   ⚠️⚠️ **새 분류가 아닙니다** — 전부 `catalog.js` 의 분류와 하위
   key 입니다. `sub` 를 적으면 그 하위로 좁혀서 보냅니다 (`?s=`). */
window.AM_OPS = [
  { name:"세무 · 기장",      cat:"admin", sub:"tax-agent",   icon:"calc",      tone:"t6" },
  { name:"노무 · 4대보험",   cat:"admin", sub:"labor-agent", icon:"files",     tone:"t6" },
  { name:"직원 채용",        cat:"staff",                    icon:"users",     tone:"t5" },
  { name:"POS · 결제",       cat:"it",    sub:"pos",         icon:"monitor",   tone:"t1" },
  { name:"CCTV · 보안",      cat:"it",    sub:"cctv",        icon:"camera",    tone:"t1" },
  { name:"인터넷 · 통신",    cat:"it",    sub:"internet",    icon:"globe",     tone:"t1" },
  { name:"식자재 · 거래처",  cat:"supply",                   icon:"truck",     tone:"t2" },
  { name:"소모품 · 포장재",  cat:"supply",sub:"packaging",   icon:"pkgck",     tone:"t2" },
  { name:"청소 · 방역",      cat:"clean",                    icon:"sparkle",   tone:"t2" },
  { name:"시설 보수 · 관리", cat:"clean", sub:"facility",    icon:"tool",      tone:"t4" },
  { name:"마케팅 · 광고",    cat:"marketing",                icon:"megaphone", tone:"t8" },
  { name:"SNS · 플레이스",   cat:"marketing", sub:"place",   icon:"chat",      tone:"t8" },
  { name:"보험",             cat:"admin", sub:"insurance",   icon:"shield",    tone:"t6" },
  { name:"법률 · 분쟁",      cat:"law",                      icon:"scale",     tone:"t6" },
  { name:"계약 · 렌탈 점검", cat:"contract",                 icon:"filex",     tone:"t4" },
  { name:"원가 · 매출 관리", to:"/tools",                    icon:"chart",     tone:"t5" },
  /* ⚠️ 2026-10-06 V2 확정 지시서 §7 이 적은 스물셋을 맞췄습니다 —
     전기 · 수도 · 배관 · 가스 · 배달 · 리뷰관리 · 렌탈이 빠져 있었습니다.
     ⚠️⚠️ 전부 `catalog.js` 에 **이미 있는 하위 분류 key** 입니다 —
     새 분류를 만들지 않았습니다 (§0-6 · §0-7). 없는 key 를 적으면
     `checkProcess()` 가 빌드를 멈춥니다. */
  { name:"전기 · 설비",      cat:"interior", sub:"electric", icon:"plug",    tone:"t4" },
  { name:"수도 · 배관",      cat:"interior", sub:"plumbing", icon:"tool",    tone:"t4" },
  { name:"가스",             cat:"interior", sub:"gas",      icon:"fire",    tone:"t4" },
  { name:"냉난방 · 공조",    cat:"interior", sub:"hvac",     icon:"snow",    tone:"t4" },
  { name:"렌탈 · 정수기",    cat:"contract", sub:"rental",   icon:"refresh", tone:"t4" },
  { name:"배달 · 포장",      cat:"marketing",sub:"open-mkt", icon:"truck",   tone:"t8",
    tool:"delivery" },
  { name:"리뷰 · 플레이스",  cat:"marketing",sub:"blog",     icon:"star",    tone:"t8" },
  { name:"해충 방제",        cat:"clean",    sub:"pest",     icon:"shield",  tone:"t2" }
];

/* ── 찾아 주는 것들 ─────────────────────────────────────────────── */
window.amJourney = function(key){
  return (window.AM_JOURNEYS||[]).filter(function(j){ return j.key === key; })[0] || null;
};
/* 단계 key 로 그 단계가 속한 여정을 찾습니다 */
window.amJourneyOfStage = function(stageKey){
  return (window.AM_JOURNEYS||[]).filter(function(j){
    return (j.stages||[]).indexOf(stageKey) >= 0; })[0] || null;
};
/* 그 여정이 품은 단계 객체들 */
window.amJourneyStages = function(j){
  if(!j) return [];
  return (j.stages||[]).map(function(k){
    return (typeof amStage === "function") ? amStage(k) : null;
  }).filter(Boolean);
};
/* 그 여정이 품은 분류 전부 (단계를 거쳐 모읍니다 — 중복 없이) */
window.amJourneyCats = function(j){
  var out = [], seen = {};
  amJourneyStages(j).forEach(function(st){
    ((typeof amStageCats === "function") ? amStageCats(st) : []).forEach(function(c){
      if(c && !seen[c.key]){ seen[c.key] = 1; out.push(c); }
    });
  });
  return out;
};
window.amProcess = function(key){ return (window.AM_PROCESS||{})[key] || []; };

/* ── 분류 → 단계 → 여정 (2026-10-06 2차 §13) ───────────────────────
   ⚠️⚠️ **새 분류를 만들지 않았습니다.** 이미 있는 두 묶음을 타고
   올라갈 뿐입니다 —

     글(`cat`) ──▶ 단계 여섯(`AM_STAGES[].cats`) ──▶ 여정 넷(`AM_JOURNEYS[].stages`)

   그래서 글을 한 편 더 쓰면 저절로 그 여정에 붙고, 고쳐 쓸 자리가
   없습니다. ⚠️ 전에 메인 정보센터 네 칸에 글 편수를 붙였다가 창업과
   운영이 **둘 다 34편**으로 나왔습니다 — 그때는 글의 `side`(창업/폐업
   둘)로 나누려 해서였습니다. 이 길로 재면 31 · 3 · 6 · 20 으로
   갈립니다 (세는 값입니다).
   ⚠️ 어느 묶음에도 안 걸리는 분류가 생기면 `null` 입니다 — 그 글은
   탭에서 빠지지, 엉뚱한 탭에 들어가지 않습니다. */
window.amJourneyOfCat = function(catKey){
  if(!catKey) return null;
  var stKey = null, L = window.AM_STAGES || [];
  for(var i = 0; i < L.length; i++)
    if((L[i].cats || []).indexOf(catKey) >= 0){ stKey = L[i].key; break; }
  if(!stKey) return null;
  var J = window.AM_JOURNEYS || [];
  for(var k = 0; k < J.length; k++)
    if((J[k].stages || []).indexOf(stKey) >= 0) return J[k].key;
  return null;
};
window.amContentsByJourney = function(jyKey, limit){
  var out = (window.AM_CONTENTS || []).filter(function(c){
    return amJourneyOfCat(c.cat) === jyKey;
  });
  return limit ? out.slice(0, limit) : out;
};

/* ══════════════════════════════════════════════════════════════════
   창업 진단 — 묻는 것 넷 (2026-10-09 지시서 PART 4)
   ══════════════════════════════════════════════════════════════════
   PART 4 가 창업 쪽에 **여섯 가지**를 물으라고 적었습니다. 둘은 이미
   있습니다 —

     ① 업종        `/startup` 의 업종 고르개 (IndustryGrid)
     ② 신규 · 인수  `/startup/:업종` 의 `?how=` (StartWayBand)
     ③ 지역 ④ 예산 ⑤ 준비 단계 ⑥ 개업 시기   ← 여기 넷

   ⚠️⚠️ **아무것도 저장하지 않습니다.** 서버로도 localStorage 로도
   보내지 않고, 고르신 것은 **주소(`?r=` · `?b=` · `?st=` · `?when=`)**
   에만 실립니다 — 뒤로 가기 · 새로고침 · 링크 공유에 살아남고 그
   밖에서는 아무 데도 안 남습니다 (절대 규칙 5 · §18 과 같은 규칙).

   ⚠️⚠️ **받아 놓고 안 읽는 칸을 만들지 마세요.** 넷 다 화면을 바꿉니다 —

     지역      → 견적 요청 · 점포 보기 · 업체 찾기에 그대로 실립니다
     예산      → 견적 요청의 예산 칸에 미리 적힙니다 + 창업비 계산기
     준비 단계  → **로드맵에서 지금 걸음부터** 다시 냅니다
     개업 시기  → 견적 요청의 일정 칸에 미리 적힙니다

   `gu` · `withEquip` · `amStore()` 가 적어 받아 놓고 몇 달을 죽어
   있었던 자리입니다.

   ⚠️⚠️ **금액 구간을 "평균 창업비" 처럼 쓰지 마세요.** 이건 사장님이
   **스스로 고르시는 범위**이지 저희가 재 본 값이 아닙니다 (절대 규칙 1).
   ⚠️ 비워 두신 칸을 추측하지 않습니다 — 안 고르시면 그 줄이 안 나갑니다. */
window.AM_START_BUD = [
  { k:"u3",  n:"3천만원 이하" },
  { k:"3to5", n:"3천 ~ 5천만원" },
  { k:"5to10", n:"5천만원 ~ 1억원" },
  { k:"o10", n:"1억원 이상" }
];
/* ⚠️⚠️ `at` 은 **그 로드맵에서 몇 번째 걸음인가**(1부터)입니다. 걸음이
   늘거나 줄면 어긋나는데 **에러도 안 나고 화면도 멀쩡합니다** — 그래서
   `build-pages.js` 의 `checkStartAsk()` 가 빌드마다 두 로드맵에 실제로
   그 걸음이 있는지 봅니다 (없으면 빌드가 멈춥니다). */
window.AM_START_STAGE = [
  { k:"look", n:"아직 알아보는 중",        at:{ startup:1,  "acq-in":1 } },
  { k:"item", n:"업종 · 아이템은 정했어요", at:{ startup:2,  "acq-in":2 } },
  { k:"area", n:"상가 · 자리를 보는 중",    at:{ startup:3,  "acq-in":3 } },
  { k:"deal", n:"계약했어요",              at:{ startup:6,  "acq-in":7 } },
  { k:"work", n:"공사 중 · 오픈 준비",      at:{ startup:7,  "acq-in":9 } }
];
window.AM_START_WHEN = [
  { k:"m1", n:"한 달 안" },
  { k:"m3", n:"3개월 안" },
  { k:"m6", n:"6개월 안" },
  { k:"y1", n:"1년 안" }
];
window.amStartPick = function(list, key){
  var L = (window[list] || []);
  for(var i = 0; i < L.length; i++) if(L[i].k === key) return L[i];
  return null;
};

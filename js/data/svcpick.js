/* ════════════════════════════════════════════════════════════════════
   고를 수 있는 서비스 — 2026-10-17 "창업 준비 전문관" 지시서 §12 · §2-B

   > §12 — "서비스 목록을 프런트엔드 코드에 여러 번 하드코딩하지 않는다.
   >  기존 DB 또는 공통 서비스 데이터 소스를 기준으로 관리한다."
   > §2-B — "전체 서비스 보기에는 기존 DB에 등록된 창업 관련 서비스를
   >  모두 포함한다. 기존 서비스를 임의로 삭제하거나 6개로 제한하지 않는다."

   ⚠️⚠️ **새 분류를 만든 것이 아닙니다.** `lifecycle.js`(단계 여섯) ·
   `journey.js`(여정 넷) · `sales.js`(영업 열넷) · `indgroups.js`(업종군
   아홉) · `opsvc.js`(운영 묶음 여섯) · `halls.js`(전문관 넷)와 **같은
   성격**이고, `catalog.js` 의 분류를 **가리키기만** 합니다. 업체(subs) ·
   매물(sub) · 글(cat) · 업종(startup/closure)이 전부 그 key 를 쓰기
   때문에, 여기서 새로 만들면 **등록된 모든 데이터가 조용히 어긋납니다.**

   ── ⚠️⚠️ 고르는 단위가 **분류** 입니다 (하위가 아닙니다) ─────────
   까닭이 셋입니다.
   ① **추가 질문이 분류 단위**입니다 (`reqforms.js`). 하위로 고르게
      해도 물어볼 것이 같아서, 접수에 담기는 내용이 한 글자도 안
      달라집니다 — 고르는 단계만 늘어납니다.
   ② 하위 206 을 고르개로 깔면 그 줄이 **전화번호부**가 됩니다
      (메인에서 분류 열 개를 걷어낸 것과 같은 까닭).
   ③ `admin` 하나에 인허가 · 세무 · 보험이 같이 있어서, 하위로 고르면
      "행정 · 전문가" 가 목록에 나올 자리가 없어집니다.
   ⚠️ 구체적인 것은 **신청 화면의 서비스별 질문**이 받습니다 (예:
   인테리어의 "공사 범위" 에 전기 · 배관 · 소방이 있습니다).

   ── §12 가 적은 권장 필드가 어디에 있는가 ─────────────────────
   서비스 ID          분류 key (`catalog.js`) — ⚠️ 이 꼴을 바꾸지 마세요
   서비스명           catalog.js 의 `name`
   쉬운 표시 이름     **이 파일의 AM_PICK_EASY** (§9-3)
   상세 설명          catalog.js 의 `lead` · `desc`
   아이콘             halls.js 의 `ia`(컬러) · catalog.js 의 `icon`(선)
   소속 전문관        halls.js — ⚠️ 한 분류가 여러 전문관에 들어갑니다
                      (`marketing` 은 창업과 운영 둘 다). 그래서 목록이
                      전문관마다 따로입니다
   상위 카테고리      분류 key 자신
   노출 순서          catalog.js 의 AM_START_CATS 차례 · 대표는 아래
   활성 상태          AM_PICK_OFF 에 적으면 목록에서 빠집니다 (지금 없음)
   견적 신청 가능     분류 전부 — `/quote?c=<분류>` 가 이미 받습니다
   추가 입력 항목     reqforms.js 의 `AM_REQ_FORMS[분류]`

   ⚠️⚠️ **서비스명을 문자열로 저장하지 마세요** (§6 이 직접 적었습니다).
   주소에도 접수에도 **id** 가 실리고, 이름은 그때그때 `catalog.js` 에서
   읽습니다 — 관리자가 이름을 바꾸면 지난 신청까지 같이 따라옵니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── 어느 분류를 고르게 하는가 ───────────────────────────────────
   ⚠️⚠️ **손으로 적지 않습니다.** 창업 쪽은 `AM_START_CATS`, 폐업 쪽은
   `AM_CLOSE_CATS` 가 이미 그 목록이고, 업종을 고르시면 `amCatsFor()` 가
   **그 업종 차례**로 바꿔 줍니다. 여기 또 적으면 분류를 하나 늘릴 때
   한쪽만 고치게 됩니다. */
window.AM_PICK_SIDE = { startup:"start", closure:"close" };

/* 내려놓은 서비스 (§12 활성 상태) — ⚠️ **지우지 말고 여기에 적으세요.**
   지난 신청 기록은 그 분류를 가리키고 있어서, 분류를 지우면 그 기록이
   무엇에 대한 것인지 읽을 수 없게 됩니다 (§12 "서비스가 비활성화되어도
   과거 신청 기록은 보존한다"). */
window.AM_PICK_OFF = [];

/* ── 대표 여섯 (§2-B) ─────────────────────────────────────────────
   ⚠️⚠️ **`halls.js` 의 차례를 쓰지 않는 까닭** — 메인이 그 앞 여섯을
   `slice(0,6)` 으로 가져다 씁니다. 차례를 바꾸면 **메인이 바뀌는데**,
   §15 가 "메인페이지와 다른 전문관 페이지는 이번 작업에서 임의로
   변경하지 않는다" 고 적었습니다. 그래서 여기서 따로 가리킵니다.

   ⚠️ 지시서 §2-B 가 적은 여섯과 **같은 차례**입니다. 바꾸시려면
   지시서를 먼저 고치세요 — `checkSvcPick()` 이 여섯을 셉니다. */
window.AM_PICK_TOP = {
  startup: ["area", "interior", "equip", "admin", "fund", "marketing"]
};

/* ── 업종별 추천 (2026-10-20 지시서 PART 4-4) ─────────────────────
   > "예를 들어 카페 창업 선택 시 … 추천한다 · 추천 서비스는 기존
   >  서비스 분류 체계에 연결한다 · **업종별 추천은 초기에는 명시적인
   >  규칙 기반으로 구현한다** · 실제 데이터가 없는 상태에서 AI가
   >  분석한 것처럼 표시하지 않는다."

   ⚠️⚠️ **`amPickTop(전문관, 업종)` 이 업종을 한 글자도 안 읽고
   있었습니다.** 인자로는 받는데 대표 목록이 `AM_PICK_TOP.startup` 의
   박아 둔 여섯이라, 카페를 고르셔도 미용실을 고르셔도 **결과가
   똑같았습니다** — `gu` · `amStore()` · `withEquip` · 푸터의
   `stages` 로 겪은 "받아 놓고 안 읽는 칸" 입니다. 재서 알았습니다.

   ⚠️⚠️ **`industries.js` 의 `startup` 차례로 대신할 수 없습니다.**
   재 보니 **앞 여섯이 업종 열넷 전부 같습니다**
   (item · store · area · interior · equip · furniture) — 그 차례가
   가르는 것은 뒤쪽 멤버십(카페는 `supply`, 헬스는 `staff`)과
   `amCatItems()`(시설 · 장비 하위)입니다. 그래서 **무엇을 앞에
   낼지는 따로** 적습니다.

   ⚠️⚠️ **새 분류를 만든 것이 아닙니다.** 전부 `catalog.js` 의 분류
   key 이고, 그 업종의 `startup` 목록 **안에 있는 것만** 적습니다 —
   없는 것을 추천하면 고르개에서 조용히 빠집니다 (`checkPickInd()` 가
   빌드를 멈춥니다).

   ⚠️⚠️ **"인기" · "많이 찾는" 이라고 쓰지 마세요.** 조회 · 클릭 ·
   신청을 하나도 모으지 않아 무엇이 많이 나가는지 **우리는
   모릅니다.** 이것은 **저희가 추려 둔 순서**이고 화면에 그렇게
   적습니다. "AI 가 분석했습니다" 도 아닙니다 (절대 규칙 5).

   ⚠️ **고객이 빼고 더할 수 있습니다** — 추천도 그냥 체크칸이라
   끄시면 되고, 아래 "전체 서비스 보기" 에 나머지가 전부 있습니다
   (PART 4-4 가 요구한 것입니다).

   ⚠️ `기타`(etc)에는 적지 않았습니다 — 그건 업종이 아니라 **받는
   그릇**이라, 거기에 추천을 적으면 어느 사장님에게도 안 맞습니다
   (업종 글을 `etc` 에 쓰지 않는 것과 같은 까닭). 적지 않은 업종은
   `AM_PICK_TOP` 의 기본 여섯이 그대로 섭니다. */
window.AM_PICK_IND = {
  startup: {
    /* 주방 공사와 설비가 값을 가르고, 인허가(식품위생)가 먼저입니다 */
    restaurant: ["interior", "equip", "admin", "it", "staff", "supply"],
    cafe:       ["interior", "equip", "it", "admin", "marketing", "area"],
    /* 주점은 업종 구분(일반 · 단란 · 유흥)이 먼저라 행정이 앞입니다 */
    bar:        ["admin", "interior", "equip", "it", "area", "marketing"],
    /* 미용은 샴푸대 · 배수 공사와 사람이 핵심입니다 */
    hair:       ["interior", "equip", "staff", "admin", "marketing", "area"],
    beauty:     ["interior", "equip", "admin", "marketing", "it", "area"],
    /* 헬스는 기구 하중 · 소음과 회원 관리가 갈립니다 */
    gym:        ["area", "interior", "equip", "staff", "it", "marketing"],
    /* 학원은 학원이냐 교습소냐(행정)와 자리가 먼저입니다 */
    academy:    ["admin", "area", "interior", "staff", "marketing", "it"],
    pet:        ["admin", "interior", "equip", "supply", "marketing", "area"],
    /* 소매는 자리와 공급 · 담배 · 주류 같은 별도 허가가 갈립니다 */
    retail:     ["area", "store", "admin", "supply", "it", "interior"],
    /* 무인은 기계와 결제 · 영상이 사업의 거의 전부입니다 */
    unmanned:   ["equip", "it", "area", "interior", "admin", "clean"],
    /* 숙박은 업종이 갈리고 소방이 따라옵니다 */
    stay:       ["admin", "interior", "equip", "staff", "it", "marketing"],
    /* 사무 · 전문서비스는 설비보다 계약과 사람입니다 */
    office:     ["store", "area", "interior", "furniture", "it", "admin"],
    /* 온라인은 점포 · 상권이 아예 없습니다 (그 업종 목록에도 없습니다) */
    online:     ["it", "admin", "marketing", "supply", "interior", "fund"]
  }
};

/* ── 쉬운 표시 이름 (§9-3) ───────────────────────────────────────
   > "전문용어보다 일상적인 표현을 먼저 사용한다."

   ⚠️⚠️ **법적 · 행정적으로 다른 개념을 하나로 합치지 않습니다**
   (§9-3 이 직접 적었습니다). 그래서 —
     · `admin`(사업자 등록 · 허가)에 폐업 신고를 섞지 않았습니다.
       앞은 영업을 시작하는 허가이고 뒤는 사업을 닫는 신고(`tax`)입니다.
     · `equip`(기계 · 설비)과 `furniture`(가구 · 집기)를 "집기" 로
       묶지 않았습니다. 앞은 붙박이가 섞여 **원상복구 범위를 가르고**
       뒤는 떼어 옮겨 중고로 팝니다.
   ⚠️ 적을 말이 없으면 **칸째 비웁니다** — 억지로 풀어 쓰면 뜻이
   달라집니다. 그때는 원래 이름이 그대로 나옵니다 (절대 규칙 2). */
/* ── 빠른 선택 여섯 (2026-10-20 지시서 PART 5-3 · 6-2-B · 2-2 A) ──
   > PART 2-2 A — "필요한 서비스를 이미 아는 고객은 업종이나 복잡한
   >  질문을 거치지 않고 **서비스를 바로 선택할 수 있어야 한다.**"

   ⚠️⚠️ **재 보니 첫 화면에 고를 수 있는 칸이 0개였습니다.** 묶음
   여덟(여섯)이 전부 접힌 채 서서, 운영은 그 아래 **운영 체크리스트**
   칸이 먼저 보이고 폐업 · 양도양수는 **보이는 칸이 하나도** 없었습니다
   (창업만 대표 여섯이 보였습니다). 지시서가 세 전문관의 "주요 서비스
   빠른 선택" 을 직접 적은 까닭이 그것입니다.

   ⚠️⚠️ **같은 칸이 묶음 안에도 있습니다.** 그건 고장이 아닙니다 —
   `pickPaint()` 가 화면의 **모든 `[data-pick]`** 을 저장된 값에 맞추기
   때문에, 어느 쪽에서 고르셔도 둘이 같이 켜지고 바구니에는 한 번만
   들어갑니다 (`amPickGet()` 이 중복을 걸러 냅니다). 묶음에서 빼면
   "분야별로 보기" 가 그 분야의 전부가 아니게 됩니다.

   ⚠️⚠️ **폐업은 철거를 맨 앞에 두지 않았습니다.** 이 저장소가 여러
   곳에 못박아 둔 그대로입니다 — 양도 · 처분이 되면 철거비도
   원상복구비도 줄어듭니다. 넘기기 · 팔기가 먼저입니다.

   ⚠️ **"인기" · "많이 찾는" 이 아닙니다.** 이용 데이터를 하나도 모으지
   않습니다 — 지시서가 적은 목록이고 화면에도 그렇게 적습니다.

   ⚠️⚠️ **전부 `분류/하위` 꼴입니다 — 분류를 적지 마세요.** 분류를
   적으면 바로 아래 묶음 머리와 **글자까지 같은 칸**이 되어, 한 화면에
   같은 것이 두 번 나옵니다 (PART 16-12 "동일 서비스 중복 노출").
   찍어 보고 알았습니다 — "매장 양도 / 시설 · 집기 처분 / 철거 /
   원상복구 / 폐기물 · 수거" 여섯이 바로 밑 묶음 여섯과 1:1 이었습니다.
   `checkSvcPick()` 이 분류를 적으면 빌드를 멈춥니다. */
window.AM_PICK_QUICK = {
  /* PART 5-3 — 인터넷·통신 / POS·결제 / 매장 수리 / 직원 채용 /
     식자재·물품 / 세무·회계 */
  operation: ["it/internet", "it/pos", "repair/aircon-fix", "staff/fulltime",
              "supply/consumable", "admin/tax-agent"],
  /* PART 6-2-B — 철거·원상복구 / 폐기물 처리 / 집기 매각 / 폐업 세무.
     ⚠️⚠️ **철거를 맨 앞에 두지 않았습니다** — 양도 · 처분이 되면
     철거비도 원상복구비도 줄어듭니다 (이 저장소가 여러 곳에 못박아
     둔 그대로입니다). */
  closure:   ["transfer/store-transfer", "asset/furniture", "demolish/full",
              "restore/shop-restore", "waste/biz-waste", "tax/close-report"],
  /* PART 7-2 — 넘기시는 분과 받으시는 분이 **같이** 쓰는 여섯입니다
     (한쪽 것만 내면 다른 쪽이 "여긴 내 자리가 아니네" 가 됩니다). */
  transfer:  ["transfer/store-transfer", "transfer/premium", "law/lease",
              "repair/check-up", "it/pos", "asset/furniture"]
};

/* 빠른 선택을 한 벌로 — ⚠️ **없는 id 는 걸러 냅니다** (밖으로 나간
   링크가 옛 id 를 들고 있을 수 있습니다). 빌드는 `checkSvcPick()` 이
   멈춥니다. */
window.amPickQuick = function(hallKey){
  return ((window.AM_PICK_QUICK || {})[hallKey] || [])
    .map(window.amPickOne).filter(Boolean);
};

window.AM_PICK_EASY = {
  "area":      "가게 자리 알아보기",
  "interior":  "가게 인테리어",
  /* ⚠️⚠️ **업종이 드러나는 말을 쓰지 마세요** (2026-10-20 에 재서
     찾았습니다). 여기 "주방 기계 · 설비" 라고 적혀 있었는데, 이 칸은
     업종 열넷 **전부**에 나옵니다 — 미용실 · 헬스장 · 학원 · 사무실
     사장님께는 남의 말이고, 이 저장소가 사진 · 썸네일 · 팔레트에서
     여러 번 못박아 둔 "한 업종이 떠오르면 안 된다" 와 정면으로
     어긋납니다. 업종별 장비는 `amCatItems()` 가 그 업종 것으로
     바꿔 줍니다 (이 이름이 아니라 그쪽이 업종을 가릅니다).
     ⚠️ `checkSvcPick()` 이 업종 낱말을 찾아 빌드를 멈춥니다. */
  "equip":     "매장 기계 · 설비",
  "admin":     "사업자 등록 · 허가",
  "fund":      "창업 자금 · 대출",
  "marketing": "마케팅 · 홍보",
  "item":      "무엇을 팔지 정하기",
  "store":     "가게 자리 찾기",
  "furniture": "매장 가구 · 집기",
  "it":        "POS · 인터넷 · CCTV",
  "supply":    "재료 · 소모품 들이기",
  "repair":    "기계 고치기 · 점검",
  "staff":     "직원 구하기",
  "clean":     "청소 · 방역"
};

/* ── 읽기 ────────────────────────────────────────────────────────── */

/* 컬러 아이콘은 `halls.js` 에서 **빌려 옵니다** — 같은 서비스가 전문관
   카드와 고르개에서 다른 그림이면 한 시스템으로 안 읽힙니다 (§10
   "같은 서비스가 다른 섹션에 나타나더라도 아이콘과 명칭은 동일하게
   유지한다"). ⚠️ 여기 적지 마세요. */
var PICK_ART = {
  /* ⚠️ 전문관 카드에 없는 분류만 적습니다 — 나머지는 halls.js 에서
     빌려 옵니다 (§10 "같은 서비스는 같은 아이콘"). */
  furniture: "sofa"
};
/* 하위 하나가 실제로 가는 곳 — ⚠️ 주소 규칙은 `catTo()` **한 곳**
   입니다. 여기서 `/providers/` 를 다시 적으면 `amCatTo`/`catTo` 를 두
   벌로 두었다가 겪은 자리가 그대로 돌아옵니다. */
function catSubTo(c, sub){
  var base = (typeof window.catTo === "function") ? window.catTo(c)
    : (c.to ? c.to : ((c.kind === "provider")
        ? "/providers/" + c.key : "/c/" + c.key));
  if(!sub) return base;
  return base + (base.indexOf("?") < 0 ? "?" : "&") + "s=" + encodeURIComponent(sub);
}

function pickArtOf(cat){
  var hit = PICK_ART[cat] || "";
  (window.AM_HALLS || []).forEach(function(h){
    (h.items || []).forEach(function(it){
      if(!hit && it.cat === cat && it.ia) hit = it.ia;
    });
  });
  return hit;
}

/* ── id 꼴 — `분류` 또는 `분류/하위` ─────────────────────────────
   ⚠️⚠️ **2026-10-18 운영 전문관 §4-4 · §5-1 로 하위까지 넓혔습니다.**
   창업 쪽은 **분류 단위**가 그대로 맞습니다 (위 머리말의 까닭 셋) —
   "무엇부터 할까" 를 고르는 자리입니다. 운영은 **"지금 이게
   고장났다"** 를 고르는 자리라 단위가 다릅니다.

   ```
   repair              수리 전체 (= "어떤 수리가 필요한지 모르겠어요")
   repair/aircon-fix   에어컨 수리
   ```

   ⚠️ 구분자가 `/` 인 까닭 — 분류 key 와 하위 key 가 둘 다
   `[a-z0-9-]` 뿐이라 섞일 수가 없습니다. ⚠️⚠️ **key 에 `/` 를 쓰지
   마세요** — 그 순간 이 꼴이 깨집니다 (`checkSvcPick()` 이 셉니다).

   ⚠️⚠️ **추가 질문은 그대로 분류 단위입니다** (`reqforms.js`). 같은
   분류의 하위 둘을 고르셔도 질문은 **한 번만** 나옵니다 — §7-4 가
   "공통 정보는 한 번만 입력한다" 고 적은 것과 같은 규칙이고,
   `api/quote.js` 의 `detail` 상한(20)을 지키는 자리입니다. */
window.amPickSplit = function(id){
  var s = String(id || "").split("/");
  return { cat: s[0] || "", sub: (s.length > 1 ? s[1] : "") };
};

/* 분류 하나가 들고 있는 하위를 **고를 수 있는 한 벌**로 (§4-4).
   ⚠️ `byIndustry` 분류(시설 · 장비)는 하위가 업종에서 옵니다 —
   `amAllSubs()` 가 모든 업종의 장비를 합쳐 돌려줍니다 (`/join` 에서
   칸이 텅 비었던 그 자리와 같은 까닭). */
window.amPickSubs = function(catKey){
  var c = (typeof window.amCat === "function") ? window.amCat(catKey) : null;
  if(!c) return [];
  var subs = (typeof window.amAllSubs === "function")
    ? window.amAllSubs(c) : (c.items || []);
  var off = window.AM_PICK_OFF || [];
  var out = [];
  subs.forEach(function(s){
    if(!s || !s.key) return;
    if(off.indexOf(c.key + "/" + s.key) >= 0) return;
    out.push(window.amPickWrap(c, s));
  });
  return out;
};

/* 화면이 쓰는 한 벌 — 이름 · 설명 · 아이콘은 **원본에서** 읽습니다
   (여기 적으면 두 곳이 어긋납니다).
   ⚠️ `sub` 을 주면 **하위 한 벌**입니다. 아이콘 · 색은 **분류 것을
   그대로** 씁니다 — 같은 서비스가 다른 자리에서 다른 그림이면 한
   시스템으로 안 읽힙니다 (§13 "같은 아이콘 라이브러리"). */
window.amPickWrap = function(c, sub){
  if(!c) return null;
  if(sub && sub.key) return {
    id:   c.key + "/" + sub.key,
    cat:  c.key,
    sub:  sub.key,
    name: sub.name,
    easy: window.AM_PICK_EASY[c.key + "/" + sub.key] || "",
    lead: "",
    /* ⚠️ 작은 줄에 **분류 이름**을 냅니다 — "에어컨 수리" 만 있으면
       어느 분야 것인지 안 보이고, 바구니에서 섞이면 더 그렇습니다. */
    desc: c.name,
    ia:   pickArtOf(c.key),
    icon: (sub.icon || c.icon || "check"),
    tone: c.tone || "t7",
    to:   catSubTo(c, sub.key),
    ask:  !!(window.AM_REQ_FORMS && window.AM_REQ_FORMS[c.key])
  };
  return {
    id:   c.key,
    cat:  c.key,
    sub:  "",
    name: c.name,
    easy: window.AM_PICK_EASY[c.key] || "",
    lead: c.lead || "",
    desc: c.desc || "",
    ia:   pickArtOf(c.key),
    icon: c.icon || "check",
    tone: c.tone || "t7",
    to:   (typeof window.catTo === "function") ? window.catTo(c)
          : (c.to ? c.to : ((c.kind === "provider")
              ? "/providers/" + c.key : "/c/" + c.key)),
    /* 추가 입력 항목이 있는가 (§5-3) — 있으면 신청 화면에서 그 서비스
       칸이 열립니다. 없으면 **빈 머리말을 찍지 않습니다** (절대 규칙 2). */
    ask:  !!(window.AM_REQ_FORMS && window.AM_REQ_FORMS[c.key])
  };
};

/* 그 전문관에서 고를 수 있는 서비스 전부 (§2-B "모두 포함").
   ⚠️ 업종을 넘기시면 **그 업종 차례**로 나옵니다 — 카페 사장님과
   미용실 사장님에게 다른 차례가 보이는 것은 `amCatsFor()` 한 곳에서
   옵니다 (이 저장소에서 업종이 갈리는 두 자리 가운데 하나). */
window.amPickAll = function(hallKey, industryKey){
  var side = (window.AM_PICK_SIDE || {})[hallKey];
  if(!side) return [];
  var cats = (typeof window.amCatsFor === "function")
    ? window.amCatsFor(industryKey || "", side)
    : (side === "close" ? (window.AM_CLOSE_CATS || []) : (window.AM_START_CATS || []));
  var off = window.AM_PICK_OFF || [];
  var seen = {}, out = [];
  cats.forEach(function(c){
    if(!c || !c.key || seen[c.key]) return;     /* §3-2 중복 방지 */
    if(off.indexOf(c.key) >= 0) return;         /* 내려놓은 것 */
    seen[c.key] = 1;
    out.push(window.amPickWrap(c));
  });
  return out;
};

/* 대표 여섯 — ⚠️ 없는 id 를 적으면 **조용히 빠지는 대신** 빌드가
   멈춥니다 (`checkSvcPick()`). */
window.amPickTop = function(hallKey, industryKey){
  var all = window.amPickAll(hallKey, industryKey);
  return window.amPickTopIds(hallKey, industryKey).map(function(id){
    return all.filter(function(s){ return s.id === id; })[0];
  }).filter(Boolean);
};

/* 어느 여섯을 앞에 낼지 — ⚠️⚠️ **업종을 고르셨으면 그 업종 것**입니다
   (PART 4-4). 적어 두지 않은 업종은 기본 여섯이 그대로 섭니다.
   ⚠️ `amPickTop()` 과 `amPickRest()` 가 **둘 다 이것을 부릅니다** —
   한쪽만 고치면 추천이 대표에도 나오고 "전체 서비스 보기" 에도
   또 나와서, 같은 칸이 한 화면에 둘이 됩니다 (§3-2 중복 방지). */
window.amPickTopIds = function(hallKey, industryKey){
  var byInd = ((window.AM_PICK_IND || {})[hallKey] || {})[industryKey || ""];
  return byInd || ((window.AM_PICK_TOP || {})[hallKey] || []);
};

/* 업종 추천을 쓰고 있는가 — 화면이 머리말을 바꾸는 데만 씁니다.
   ⚠️ 추천이 **기본 여섯과 같아도** 참입니다 (업종을 고르셨으니까요). */
window.amPickIndOn = function(hallKey, industryKey){
  return !!((window.AM_PICK_IND || {})[hallKey] || {})[industryKey || ""];
};

/* 대표 여섯을 뺀 나머지 (§2-B "전체 서비스 보기") */
window.amPickRest = function(hallKey, industryKey){
  var ids = window.amPickTopIds(hallKey, industryKey);
  return window.amPickAll(hallKey, industryKey).filter(function(s){
    return ids.indexOf(s.id) < 0; });
};

/* id 하나를 되돌려 찾습니다 — 주소(`?sv=`)와 저장된 선택을 읽을 때.
   ⚠️⚠️ **없는 id 는 null 입니다.** 밖으로 나간 링크가 옛 id 를 들고
   있을 수 있어서, 거기서 에러를 내면 손님은 아무 잘못도 안 하시고
   깨진 화면을 봅니다 — 부르는 쪽이 걸러 냅니다.
   ⚠️ 내려놓은 서비스(`AM_PICK_OFF`)도 **찾아는 집니다** — 지난 신청
   기록을 읽어야 하기 때문입니다 (§12). 고르개에만 안 나옵니다. */
window.amPickOne = function(id){
  if(!id) return null;
  var p = window.amPickSplit(id);
  var c = (typeof window.amCat === "function") ? window.amCat(p.cat) : null;
  if(!c) return null;
  if(!p.sub) return window.amPickWrap(c);
  /* ⚠️⚠️ **없는 하위는 null 입니다.** 분류는 맞는데 하위만 틀린
     id(`repair/없는것`)를 분류로 눌러 주면, 손님이 고른 것과 접수에
     실리는 것이 **조용히 달라집니다** — 에어컨 수리를 고르셨는데
     "수리 전체" 로 들어가는 꼴입니다. */
  var subs = (typeof window.amAllSubs === "function")
    ? window.amAllSubs(c) : (c.items || []);
  var hit = subs.filter(function(s){ return s && s.key === p.sub; })[0];
  return hit ? window.amPickWrap(c, hit) : null;
};

/* 화면에 내는 딱지 — 쉬운 이름이 있으면 그것이 먼저입니다 (§9-3).
   ⚠️ 원래 이름을 **버리지 않습니다** — 업체 · 관리자 · 검색이 쓰는
   말이라 작은 줄로 같이 냅니다. */
window.amPickLabel = function(s){
  return (s && (s.easy || s.name)) || "";
};

/* ════════════════════════════════════════════════════════════════════
   운영 대표 여덟 — 2026-10-18 "매장 운영 전문관 2차" §4-2 · §4-3 · §4-4

   > §4-4 — "대표 서비스 카드를 누르면 해당 분야의 세부 서비스가
   >  펼쳐지도록 한다 · 세부 서비스를 선택하면 신청 목록에 추가한다 ·
   >  대표 카테고리 선택과 실제 서비스 선택을 혼동하지 않도록 한다."

   ⚠️⚠️ **창업 쪽(`AM_PICK_TOP`)과 구조가 다른 까닭.** 창업은 "무엇부터
   할까" 를 고르는 자리라 **분류**가 고르는 단위이고, 그래서 대표 여섯이
   그냥 id 목록입니다. 운영은 **"지금 이게 고장났다"** 를 고르는 자리라
   세부까지 내려가야 합니다 — 그래서 묶음마다 `subs` 가 있습니다.

   ⚠️⚠️ **새 분류도 새 하위도 만들지 않았습니다.** 전부 `catalog.js` 의
   것을 **가리키기만** 합니다 (`lifecycle` · `journey` · `sales` ·
   `indgroups` · `opsvc` · `halls` 와 같은 성격). 여기서 새로 만들면
   업체(`subs`) · 매물(`sub`) · 글(`cat`)이 전부 그 key 를 쓰기 때문에
   **등록된 모든 데이터가 조용히 어긋납니다.**

   ── 칸 ─────────────────────────────────────────────────────────────
   key    묶음 자신의 id — 화면 요소 id 에만 씁니다 (접수에 안 실립니다)
   name   §4-3 의 **쉬운 이름** ("세무 · 회계" 가 아니라 "세금 · 회계")
   lead   한 줄 설명 (§4-4 카드 구성)
   ia     컬러 아이콘 — ⚠️ `iconArt()` 키이고 **여덟이 서로 달라야**
          합니다 (`checkPickGroup()` 이 셉니다)
   tone   §13 "매장 운영 포인트에만 그린" — 여덟이 서로 다른 틴트
   any    **"어떤 것이 필요한지 모르겠어요"** 를 고르면 담기는 id (§4-4)
   subs   세부 선택지 — 전부 `분류/하위` 꼴입니다

   ⚠️⚠️ **`any` 를 분류로만 두지 마세요.** 세금 · 회계와 보험 · 운영
   상담이 둘 다 `admin` 분류라, 분류로 두면 **여덟 중 둘이 같은 칸**이
   됩니다 (`halls.js` 에서 "인허가 · 행정과 세무 · 회계가 같은 색" 으로
   겪은 자리). 그래서 그 둘만 하위를 가리킵니다.

   ⚠️ **묶음이 분류를 넘어갑니다** — 세금 · 회계가 `admin` 과 `it` 을
   같이 들고, 직원 쪽이 `staff` · `admin` · `it` 을 같이 듭니다.
   `opsvc.js` 의 묶음 F 가 이미 그렇게 하고 있어 새 성질이 아닙니다.
   ⚠️⚠️ 그래도 **추가 질문은 분류 단위**라, 같은 분류의 하위 둘을
   고르셔도 질문은 한 번만 나옵니다 (`askGroups()` · §7-4).
   ════════════════════════════════════════════════════════════════════ */
window.AM_PICK_GROUP = {
  operation: [
    { key:"ad",     name:"가게 광고 · 홍보",      ia:"marketing", tone:"sv1",
      lead:"플레이스 · SNS · 전단지까지",
      any:"marketing",
      subs:["marketing/place","marketing/sns","marketing/blog","marketing/review",
            "marketing/ad-agency","marketing/outdoor","marketing/flyer","marketing/crm"] },

    /* ⚠️ `any` 가 하위입니다 — 8번과 같은 `admin` 분류입니다 */
    { key:"tax",    name:"세금 · 회계",          ia:"tax",       tone:"sv5",
      lead:"기장 · 신고 · 회계 프로그램",
      any:"admin/tax-agent",
      subs:["admin/tax-agent","it/acct-sw","it/sales-mgmt"] },

    { key:"people", name:"직원 구하기 · 노무 상담", ia:"staff",     tone:"sv4",
      lead:"채용 · 근로계약 · 4대보험",
      any:"staff",
      subs:["staff/fulltime","staff/parttime","staff/pro-staff","staff/headhunt",
            "staff/training","admin/labor-agent","it/hr-pay"] },

    { key:"fix",    name:"매장 기계 · 시설 수리",  ia:"repair",    tone:"sv3",
      lead:"냉장고 · 에어컨 · 전기 · 주방기기",
      any:"repair",
      subs:["repair/fridge-fix","repair/aircon-fix","repair/elec-fix","repair/kitchen-fix",
            "repair/coffee-fix","repair/ice-fix","repair/it-fix","repair/check-up",
            "repair/rental-care"] },

    { key:"pos",    name:"POS · 인터넷 · 카드 단말기", ia:"pos",   tone:"sv2",
      lead:"설치 · 교체 · 통신",
      any:"it",
      subs:["it/pos","it/payment","it/kiosk","it/table-order","it/cctv",
            "it/internet","it/phone","it/wifi","it/booking","it/waiting"] },

    { key:"goods",  name:"식자재 · 매장 물품",     ia:"supply",    tone:"sv6",
      lead:"거래처 · 포장재 · 소모품",
      any:"supply",
      subs:["supply/ingredient","supply/meat","supply/seafood","supply/produce",
            "supply/beverage","supply/coffee-bean","supply/bakery","supply/liquor",
            "supply/packaging","supply/disposable","supply/consumable",
            "supply/hygiene","supply/uniform","supply/office-sup"] },

    { key:"clean",  name:"매장 청소 · 방역",       ia:"clean",     tone:"t5",
      lead:"주방 · 에어컨 · 방역 · 해충",
      any:"clean",
      subs:["clean/kitchen-clean","clean/aircon","clean/disinfect","clean/pest",
            "clean/regular","clean/facility","clean/move-in"] },

    /* ⚠️ `any` 가 하위입니다 — 2번과 같은 `admin` 분류입니다 */
    { key:"care",   name:"매장 보험 · 운영 상담",  ia:"shield",    tone:"t12",
      lead:"보험 · 법률 · 지원제도",
      any:"admin/insurance",
      subs:["admin/insurance","admin/legal","admin/admin-agent","admin/certify",
            "fund/policy-fund","fund/gov-program"] }
  ],

  /* ── 폐업 · 정리 여덟 (2026-10-18 전체 점검 지시서 §3 · §12) ──────
     > §12 — "폐업 서비스는 철거 · 원상복구 · 집기 매각 · 폐기물 ·
     >  세무정리 · 신고 등으로 구분한다. 동일한 작업이 중복 신청되지
     >  않도록 한다."

     ⚠️⚠️ **차례가 뜻입니다.** 넘기기 → 팔기 → 재고 → 철거 →
     원상복구 → 폐기물 → 신고 → 계약 해지. 2026-10-08 §17 이
     "폐업을 선택했다고 무조건 철거부터 안내하지 않는다" 고 적어서,
     **돈이 되는 쪽 셋이 먼저**입니다 — 양도가 되면 철거비도
     원상복구도 안 드는 경우가 있습니다.

     ⚠️⚠️ **`demolish/waste`(폐기물)를 대표 목록에서 뺐습니다.** 바로
     아래 여섯째 묶음이 **폐기물 버리기** 전부를 들고 있어서, 그대로
     두면 한 화면에 "폐기물" 체크칸이 둘이 됩니다 — §12-3 이 적은
     "집기 매각과 폐기물 처리 구분" 이 그 자리입니다. ⚠️ **지운 것이
     아닙니다** — `catalog.js` 에 그대로 있고 `/c/demolish` 화면과
     전체 서비스 보기(분류 단위)에서 그대로 걸립니다.

     ⚠️ `asset/*`(팔기)와 `waste/*`(버리기)에 **같은 이름이 둘**
     있습니다 (`가구` · `업소용 장비`). 지우면 안 됩니다 — 하나는
     돈을 받는 일이고 하나는 돈을 내는 일입니다. 묶음 이름이
     **"팔기" 와 "버리기"** 로 갈라 주는 자리입니다. */
  closure: [
    { key:"pass",   name:"매장 넘기기",          ia:"handover", tone:"t13",
      lead:"권리금 · 인수자 찾기까지",
      any:"transfer",
      subs:["transfer/store-transfer","transfer/premium","transfer/equip-transfer",
            "transfer/find-buyer","transfer/fc-transfer"] },

    { key:"sell",   name:"시설 · 장비 팔기",      ia:"money",    tone:"t12",
      lead:"주방장비 · 냉장고 · 가구를 돈으로",
      any:"asset",
      subs:["asset/kitchen-eq","asset/fridge","asset/espresso","asset/furniture",
            "asset/pos","asset/kiosk","asset/fitness","asset/salon-eq","asset/biz-eq"] },

    { key:"stock",  name:"남은 재고 정리",        ia:"supply",   tone:"t2",
      lead:"식자재 · 상품 · 포장재",
      any:"stock",
      subs:["stock/ingredient","stock/goods","stock/packaging","stock/consumable",
            "stock/material","stock/etc-stock"] },

    { key:"demo",   name:"철거",                 ia:"demolish", tone:"sv4",
      lead:"전체 · 부분 · 주방 · 간판",
      any:"demolish",
      subs:["demolish/full","demolish/partial","demolish/kitchen",
            "demolish/sign","demolish/facility"] },

    { key:"back",   name:"원상복구",             ia:"restore",  tone:"sv1",
      lead:"빌려 쓰기 전 상태로 돌려놓기",
      any:"restore",
      subs:["restore/shop-restore","restore/electric","restore/plumbing","restore/gas",
            "restore/floor","restore/wall","restore/ceiling","restore/sign"] },

    { key:"waste",  name:"폐기물 버리기",         ia:"trash",    tone:"t7",
      lead:"사업장 폐기물 · 대형 · 전자제품",
      any:"waste",
      subs:["waste/biz-waste","waste/bulky","waste/furniture","waste/electronics",
            "waste/biz-eq","waste/recycle"] },

    { key:"report", name:"폐업 신고 · 세금",      ia:"tax",      tone:"sv5",
      lead:"신고 · 부가세 · 인허가 정리",
      any:"tax",
      subs:["tax/close-report","tax/vat","tax/income-tax","tax/biz-reg",
            "tax/permit","tax/consult"] },

    /* ⚠️ 묶음이 분류를 넘어갑니다 (`contract` + `labor`) — 사장님에게는
       "달마다 나가는 것을 끊고 직원을 정리하는" 한 가지 일입니다.
       `opsvc.js` 의 묶음 F 가 이미 그렇게 하고 있어 새 성질이 아닙니다. */
    { key:"end",    name:"계약 해지 · 직원 정리",  ia:"contract", tone:"sv3",
      lead:"인터넷 · 렌탈 · 보험 · 퇴직금",
      any:"contract",
      subs:["contract/internet","contract/phone","contract/pos","contract/kiosk",
            "contract/rental","contract/water","contract/cctv","contract/security",
            "contract/insurance","labor/resign","labor/severance","labor/insurance4",
            "labor/contract-end","labor/consult"] }
  ],

  /* ── 매장 양도양수 여섯 (§3 · §13) ───────────────────────────────
     > §3 — "매장 양도양수처럼 성격이 다른 전문관은 매물 탐색과 거래
     >  절차를 고려하여 필요한 구조를 별도로 유지할 수 있다."
     > §4 — "실제 서비스가 부족한 경우 억지로 12개를 채우지 않는다."

     ⚠️⚠️ **여덟으로 안 늘렸습니다.** 양도양수에서 실제로 돈이 드는
     일이 여섯입니다 — 넘기기 · 계약 · 시설 인계 · 재고 인계 ·
     시스템 승계 · 인수 전 점검. 억지로 둘을 더하면 가짜 칸입니다.
     ⚠️ 매물 탐색(`/stores` · `/assets`)과 인수 · 양도 **절차**는
     전과 똑같이 그 화면에 남아 있습니다 — 고르는 자리가 하나 늘어난
     것이고 있던 것이 내려간 것이 아닙니다.

     ⚠️⚠️ **`asset/*` 가 폐업 쪽과 같은 하위입니다.** 폐업에서는
     "팔기" 이고 여기서는 "인계" 입니다 — 같은 장비를 넘기는 일인데
     돈을 받는 쪽과 받아 가는 쪽이 다릅니다. 분류를 새로 만들면
     업체 · 매물 · 글이 쓰는 key 가 어긋납니다. */
  transfer: [
    { key:"pass",   name:"내 매장 넘기기",        ia:"handover", tone:"t13",
      lead:"권리금 · 인수자 찾기까지",
      any:"transfer",
      subs:["transfer/store-transfer","transfer/premium","transfer/equip-transfer",
            "transfer/find-buyer","transfer/fc-transfer"] },

    { key:"deal",   name:"계약 · 임대차 검토",    ia:"contract", tone:"t6",
      lead:"계약서 · 임대차 승계 · 분쟁",
      any:"admin/legal",
      subs:["admin/legal","admin/admin-agent","admin/certify",
            "law/lease","law/dispute","law/consult"] },

    { key:"asset",  name:"시설 · 장비 인계",      ia:"equip",    tone:"t12",
      lead:"주방장비 · 냉장고 · 가구",
      any:"asset",
      subs:["asset/kitchen-eq","asset/fridge","asset/espresso","asset/furniture",
            "asset/pos","asset/kiosk","asset/fitness","asset/salon-eq","asset/biz-eq"] },

    { key:"stock",  name:"재고 인계",            ia:"supply",   tone:"t2",
      lead:"식자재 · 상품 · 포장재",
      any:"stock",
      subs:["stock/ingredient","stock/goods","stock/packaging","stock/consumable",
            "stock/material","stock/etc-stock"] },

    { key:"sys",    name:"POS · 인터넷 승계",     ia:"pos",      tone:"sv2",
      lead:"명의 변경 · 재설치 · 교체",
      any:"it",
      subs:["it/pos","it/payment","it/kiosk","it/cctv","it/internet","it/phone"] },

    /* ⚠️ 인수하시는 분이 제일 먼저 묻는 것이 "지금 쓸 수 있나" 입니다.
       `repair/check-up`(정기 시설 점검)이 그 자리이고, 손볼 것이
       나오면 `interior/*` 가 받습니다. */
    { key:"fix",    name:"인수 전 점검 · 손볼 것", ia:"repair",   tone:"sv3",
      lead:"시설 점검 · 부분 공사 · 간판 교체",
      any:"repair",
      subs:["repair/check-up","repair/elec-fix","repair/kitchen-fix","repair/it-fix",
            "interior/interior","interior/sign","interior/paint","interior/floor"] }
  ]
};

/* ── 읽기 ────────────────────────────────────────────────────────── */

/* 묶음 여덟 — 화면이 쓰는 한 벌로 (`any` 와 `subs` 가 서비스 한 벌이
   되어 옵니다). ⚠️ **없는 id 는 조용히 빠집니다** — 분류나 하위를
   내려놓으면 그 줄만 없어지고 묶음은 그대로 섭니다 (절대 규칙 2).
   빌드는 그것을 **미리** 막습니다 (`checkPickGroup()`). */
window.amPickGroups = function(hallKey){
  return ((window.AM_PICK_GROUP || {})[hallKey] || []).map(function(g){
    var any  = window.amPickOne(g.any);
    var subs = (g.subs || []).map(window.amPickOne).filter(Boolean);
    if(!any || !subs.length) return null;
    return {
      key:  g.key,
      name: g.name,
      lead: g.lead || "",
      ia:   g.ia || any.ia,
      tone: g.tone || any.tone,
      any:  any,
      subs: subs,
      /* 세부까지 합친 id 들 — 묶음에서 몇 개를 고르셨는지 셀 때 (§5-2) */
      ids:  [any.id].concat(subs.map(function(s){ return s.id; }))
            .filter(function(v, i, a){ return a.indexOf(v) === i; })
    };
  }).filter(Boolean);
};

/* 그 전문관에서 고를 수 있는 **분류** 전부 (§4-5 "전체 서비스 보기").
   ⚠️⚠️ **손으로 적지 않습니다.** 운영은 창업 · 폐업과 달리
   `AM_START_CATS` 같은 목록이 없어서, **그 화면에서 내려온 구간들이
   가리키던 분류**를 모아 옵니다 —
     · `halls.js` 의 그 전문관 칸      (전문관 카드가 가리키던 것)
     · `AM_PICK_GROUP` 의 묶음 여덟     (대표 여덟)
     · `AM_OPSVC` 의 묶음 여섯          (내려온 구간 2)
     · `AM_OPS` 의 운영 과제 스물넷     (내려온 구간 4)
   ⚠️ 이렇게 모으는 까닭 — §0 이 "기존 서비스 데이터" 보존을 적었고
   §2 는 선택 영역을 하나로 줄이라고 적었습니다. 둘을 같이 지키려면
   **내려온 구간이 가리키던 분류를 이 목록이 빠짐없이 받아야** 합니다
   (`checkPickGroup()` 이 그것을 셉니다). */
window.amPickHallCats = function(hallKey){
  var seen = {}, out = [];
  var add = function(k){
    if(!k || seen[k]) return;
    if((window.AM_PICK_OFF || []).indexOf(k) >= 0) return;
    var s = window.amPickOne(k);
    if(!s || s.sub) return;                  /* 분류만 */
    seen[k] = 1; out.push(s);
  };
  ((window.amHall ? [window.amHall(hallKey)] : [])).forEach(function(h){
    if(h && h.key === hallKey) (h.items || []).forEach(function(it){ add(it.cat); });
  });
  ((window.AM_PICK_GROUP || {})[hallKey] || []).forEach(function(g){
    add(window.amPickSplit(g.any).cat);
    (g.subs || []).forEach(function(id){ add(window.amPickSplit(id).cat); });
  });
  if(hallKey === "operation"){
    (window.AM_OPSVC || []).forEach(function(g){
      (g.items || []).forEach(function(o){ add(o.cat); });
    });
    (window.AM_OPS || []).forEach(function(o){ add(o.cat); });
  }
  /* ⚠️⚠️ 폐업은 **목록이 처음부터 있습니다** — `AM_CLOSE_CATS` 열둘이
     그 쪽 분류 전부이고, 업종 화면 · 메인 거르개가 몇 달째 그것을
     쓰고 있습니다. 손으로 다시 적으면 분류를 늘릴 때 조용히 어긋납니다
     (운영은 그런 목록이 없어서 위처럼 모아 오는 것입니다). */
  if(hallKey === "closure"){
    (window.AM_CLOSE_CATS || []).forEach(function(c){ add(c.key || c); });
  }
  return out;
};

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
   활성 상태          AM_PICK_OFF 에 적으면 목록에서 빠집니다 (지금 넷)
   견적 신청 가능     분류 전부 — `/quote?c=<분류>` 가 이미 받습니다
   추가 입력 항목     reqforms.js 의 `AM_REQ_FORMS[분류]`

   ⚠️⚠️ **서비스명을 문자열로 저장하지 마세요** (§6 이 직접 적었습니다).
   주소에도 접수에도 **id** 가 실리고, 이름은 그때그때 `catalog.js` 에서
   읽습니다 — 관리자가 이름을 바꾸면 지난 신청까지 같이 따라옵니다.
   ════════════════════════════════════════════════════════════════════ */

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

/* ⚠️⚠️ **2026-10-31 — `AM_HALLS` 를 안 봅니다.** 전에는 전문관 넷의
   아이콘을 되찾아 썼는데 그 데이터가 인수인계와 같이 내려갔습니다 —
   없는 것을 돌면 늘 빈 문자열이고, 돌지 않는 것과 같습니다.
   ⚠️ 지금 이 값(`ia`)을 그리는 화면이 한 곳도 없습니다 (고르는 카드가
   내려갔습니다). 남겨 둔 까닭은 `amPickWrap()` 의 칸을 비우지 않는
   것까지입니다 — 되살리시는 날 그대로 맞습니다. */
function pickArtOf(cat){
  return PICK_ART[cat] || "";
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

/* ── 읽기 ────────────────────────────────────────────────────────── */


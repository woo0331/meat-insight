/* ════════════════════════════════════════════════════════════════════
   골프 레슨 — 거르개 · 정렬 · 카테고리 카드를 담는 **한 곳**
   (2026-11-10 · 레슨 지시서 §4 · §5)

   ⚠️⚠️ 여기 적힌 것을 화면마다 따로 적지 마세요 — 빌드(`pages/category.js`)
   와 브라우저(`js/lesson.js`)가 **같은 줄**을 읽습니다. 두 벌로 적으면
   손님이 거르개를 누르는 순간 조건이 조용히 달라지고, 그려진 화면만
   보는 검사는 **영원히 통과**합니다.

   ⚠️⚠️⚠️ **시안의 「인기 검색어」를 그 이름으로 안 씁니다.** 저희는
   누가 무엇을 찾으셨는지 **한 줄도 안 셉니다** — 세어 본 적 없는 것을
   "인기" 라고 적으면 그건 지어낸 숫자입니다(절대 규칙 1). 같은 칩을
   **「자주 찾는 조건」** 으로 내고, 칩마다 **실제로 걸리는 조건**만
   답니다(걸 자료가 없는 말은 아예 안 냅니다 · 절대 규칙 5).

   ⚠️⚠️⚠️ **「최신 등록순」 을 안 냅니다.** 공개 보기(`v_provider_card`)에
   `created_at` 칸이 **없습니다** — 없는 값으로 줄을 세우면 아무 차례도
   아닌 것을 "최신" 이라고 적는 꼴입니다. 그 칸을 보기에 더하는 날
   여기에 한 줄만 더하면 됩니다.

   ⚠️⚠️ **「인기순」 도 안 냅니다** — 조회 수도 · 예약 수도 안 셉니다.
   기본 차례는 **가나다순**이고 화면이 그렇게 적습니다.

   ⚠️ 경계는 **아래를 열고 위를 닫습니다**(gte · lt) — 둘 다 닫으면
   10만원이 두 칸에 걸립니다. 이름도 그 뜻으로 적습니다("10만원 미만").
   ════════════════════════════════════════════════════════════════════ */

/* 1회 레슨 가격대 — ⚠️ `provider_price` 에 등록된 **가장 싼 값**으로
   가릅니다(`amPriceLow`). 등록이 0건인 프로는 **어느 가격대에도 안
   걸립니다** — 값을 모르는 것을 아무 칸에나 넣으면 그게 지어낸 값입니다.
   그 사실을 화면이 그 자리에서 말합니다. */
window.AM_LESSON_PRICE = [
  { key:"p1", name:"5만원 미만",        gte:null,   lt:50000 },
  { key:"p2", name:"5만 ~ 10만원",      gte:50000,  lt:100000 },
  { key:"p3", name:"10만 ~ 15만원",     gte:100000, lt:150000 },
  { key:"p4", name:"15만 ~ 20만원",     gte:150000, lt:200000 },
  { key:"p5", name:"20만원 이상",       gte:200000, lt:null }
];

/* 정렬은 **`js/data/providers.js` 의 `AM_PV_SORT` 한 곳**으로
   옥겼습니다 (2026-11-12) — 피팅 · 수리가 **같은 넷**을 씁니다.
   그때 여기 한 벌을 남겼으면 한쪽만 고치는 날 두 화면이 다른 차례를
   내고, 주소에 실린 키(`?o=`)는 같아서 **에러도 안 나고 조용히**
   어긋납니다. */

/* 카테고리 카드 — 시안 §5 의 가로 카드입니다.
   ⚠️⚠️⚠️ **이름을 시안 그대로 쓰지 못한 자리가 셋입니다.** 시안은
   「입문·초보 / 스윙 교정 / 숏게임 / 필드 / 주니어 / 여성 골퍼」 인데,
   저희가 지금 **걸 수 있는 축은 「레슨 종류」 하나**입니다
   (`provider.subs`). 「입문·초보」 · 「스윙 교정」 · 「여성 골퍼」 는
   **레슨 목적 · 대상**이라 담는 칸이 아직 없습니다 — 그 이름으로
   카드를 내면 눌러도 안 걸러지는 칸이 됩니다(절대 규칙 5).
   ⚠️ 그래서 지금은 **레슨 종류 일곱**을 그대로 냅니다. 목적 칸을
   더하는 날(프로 직접 등록 · 지시서 §8) 여기에 목적 카드를 같이
   내고 `goal` 열쇠로 거릅니다.
   ⚠️⚠️ 목록을 여기 **박지 않습니다** — `js/data/catalog.js` 의 레슨
   하위에서 끌어옵니다. 하위가 느는 날 카드가 저절로 늘어납니다
   (두 곳에 적으면 한쪽만 고치는 날 카드 하나가 조용히 빠집니다). */
window.amLessonCards = function(){
  var c = window.amCat ? window.amCat("lesson") : null;
  var L = (c && window.amCatItems) ? window.amCatItems(c) : [];
  var LEAD = {
    "ls-solo":   "한 분만 보는 1:1",
    "ls-group":  "둘 이상이 함께",
    "ls-field":  "실전 라운드 코칭",
    "ls-short":  "어프로치 · 퍼팅",
    "ls-point":  "한 가지만 짧게",
    "ls-junior": "성장 맞춤 프로그램",
    "ls-online": "영상으로 보는 레슨"
  };
  return L.map(function(i){
    return { key:i.key, name:i.name, lead: LEAD[i.key] || "" };
  });
};

/* 자주 찾는 조건 — ⚠️ 칩마다 **실제로 걸리는 열쇠**를 답니다.
   ⚠️⚠️ 지역 키 · 하위 키를 **글자로 박지 않습니다** — 키가 바뀌는 날
   그 칩만 조용히 0건이 됩니다. 아래는 키만 적고 이름은 그 표에서
   끌어옵니다(`amRegion()` · `amSub()`). */
window.AM_LESSON_TAGS = [
  { rg:"seoul" },
  { sub:"ls-solo" },
  { sub:"ls-field" },
  { sub:"ls-short" },
  { sub:"ls-junior" },
  { sub:"ls-online" }
];

/* 그 칩의 이름 — ⚠️ 못 찾으면 **null** 입니다(키를 그대로 찍지 않습니다).
   화면이 null 인 칩을 **줄째 뺍니다**(절대 규칙 2). */
/* ⚠️⚠️ **둘이 돌려주는 꼴이 다릅니다** — `amRegion()` 은 지역 **한
   덩이**(`{key,name,full,gu}`)를, `amSub()` 는 `{cat, item}` 을 냅니다.
   이름을 꺼내는 자리를 잘못 짚으면 화면에 `[object Object]` 가 찍히거나
   칩이 통째로 빠집니다 — 둘 다 **찍어 보고** 알았습니다(에러 0줄). */
window.amLessonTagName = function(t){
  if(!t) return null;
  if(t.rg){
    var r = window.amRegion ? window.amRegion(t.rg) : null;
    return (r && r.name) || null;
  }
  if(t.sub){
    var s = window.amSub ? window.amSub(t.sub) : null;
    return (s && s.item && s.item.name) || null;
  }
  return null;
};

/* 가격대 하나를 찾습니다 — 못 찾으면 null (모르는 키를 "전체" 로
   읽으면 손님이 고른 것과 다른 목록이 나옵니다). */
window.amLessonPrice = function(key){
  var L = window.AM_LESSON_PRICE || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

/* 그 프로의 **레슨** 값 가운데 가장 싼 것 — 0건이면 null 입니다.
   ⚠️⚠️⚠️ `amPriceLow()` 를 그대로 쓰면 **분류를 안 가립니다.** 씨앗
   업체가 연습장 타석 12,000원과 레슨 8회권 400,000원을 같이 올려
   두었는데, 레슨 화면 카드에 **12,000원 / 1시간**이 「1회 레슨 가격」인
   것처럼 찍혔습니다(검사가 잡았습니다). 레슨 화면에서는 **레슨 하위에
   달린 값만** 봅니다.
   ⚠️ 세는 자리는 여전히 `amPriceLow()` 한 곳입니다 — 여기서는 **무엇을
   세느냐**만 좁힙니다(셈을 두 벌로 적지 않습니다).
   ⚠️ 값이 0건인 프로는 **null** 입니다 — 0 이 아닙니다(0원은 무료 체험이고
   "값을 안 올렸다" 와 뜻이 다릅니다). */
window.amLessonLow = function(p){
  var L = (p && Array.isArray(p.prices)) ? p.prices : [];
  var only = L.filter(function(x){
    var s = (x && x.sub && window.amSub) ? window.amSub(x.sub) : null;
    return s && s.cat && s.cat.key === "lesson";
  });
  if(!only.length) return null;
  return window.amPriceLow ? window.amPriceLow({ prices: only }) : null;
};

/* ════════════════════════════════════════════════════════════════════
   레슨 목적 — 0071 이 담는 칸이 생겨서 냅니다   (2026-11-10)

   ⚠️⚠️⚠️ **2026-11-10 오전까지 이 거르개를 안 만들었습니다** — 레슨
   지시서 §3 이 요구했는데 `provider` 에 담는 칸이 없었습니다. 칸 없이
   고르개를 내면 골라도 걸러 주지 못하는 칸이고, 그건 눌러도 아무 일이
   안 나는 칸입니다(절대 규칙 5). 0071 이 `provider.lesson_goals` 를
   더해서 이제 참말이 됩니다.

   ⚠️⚠️ **키를 DB 에 박지 않았습니다** — `lesson_goals` 는 글자 배열입니다
   (0056 의 `listing.sub` · 0061 의 `wanted.region` 과 같은 규칙). 목록을
   쥐는 자리는 **여기 하나**이고, 늘리실 때는 **더하기만** 하십니다
   (이미 고르신 프로가 그 글자를 들고 있습니다).
   ⚠️ 모르는 키가 오면 화면이 **그 글자를 그대로** 보여 줍니다
   (이름을 지어내지 않습니다).
   ════════════════════════════════════════════════════════════════════ */
window.AM_LESSON_GOAL = [
  { key:"beginner", name:"처음 배웁니다" },
  { key:"score",    name:"스코어 줄이기" },
  { key:"swing",    name:"스윙 교정" },
  { key:"field",    name:"필드 준비" },
  { key:"short",    name:"숏게임 · 퍼팅" },
  { key:"distance", name:"비거리 늘리기" },
  { key:"junior",   name:"주니어" },
  { key:"senior",   name:"시니어" },
  { key:"women",    name:"여성" },
  { key:"pro",      name:"선수 · 프로 준비" }
];
/* ⚠️ 이름을 푸는 자리도 **하나**입니다 — 못 찾으면 받은 글자를 그대로
   돌려줍니다 (조인에서 영문 `closed` 가 손님 화면에 찍힌 그 자리의 반대). */
window.amLessonGoalName = function(k){
  var key = String(k || "").trim();
  if(!key) return "";
  for(var i = 0; i < window.AM_LESSON_GOAL.length; i++)
    if(window.AM_LESSON_GOAL[i].key === key) return window.AM_LESSON_GOAL[i].name;
  return key;
};
/* 프로가 고른 목적을 이름으로 — ⚠️ 0건이면 **빈 배열**이고 화면이 그
   줄을 줄째 뺍니다 (「목적 0개」 를 찍지 않습니다). */
window.amLessonGoalsOf = function(p){
  var L = (p && Array.isArray(p.lesson_goals)) ? p.lesson_goals : [];
  return L.map(function(k){ return window.amLessonGoalName(k); })
          .filter(function(x){ return !!x; });
};

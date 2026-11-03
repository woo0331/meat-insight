/* ════════════════════════════════════════════════════════════════════
   서비스 분류 — 골프올인원이 중개하는 일 (열 가지)

   ⚠️⚠️ **2026-11-03 전면 교체 (지시서 3번 · 첨부 시안).** 그 전까지
   이 파일은 중고폰 분류 10 · 하위 50 이었고, 그보다 앞에는 창업 · 폐업
   분류 26 · 하위 210 이었습니다. 둘 다 끝났습니다.
   옛것을 꺼내 보시려면 git show 4563539:js/data/catalog.js 입니다.

   ⚠️⚠️ **키를 지난 두 벌과 한 글자도 겹치지 않게 지었습니다.**
   request_item.service_id 가 **글자로** 저장되어 있어서, 같은 키를
   다른 뜻으로 다시 쓰면 **지난 신청 기록의 뜻이 조용히 바뀝니다.**
   겹치면 안 되는 옛 키를 tools/check-keys.js 가 들고 있고
   빌드에서 멈춥니다 (tools/check-keys.js). 하위 키는 분류마다 **두 글자 머리**를 붙여
   (ls- us- bk- jo- rg- mk- ft- tr- cr- cm-) 겹칠 길을 막았습니다.
   그래서 수리는 repair 도 fix 도 아닌 **ft-mend** 입니다 (repair 는
   창업 때 매장 설비 수리, fix 는 중고폰 수리였습니다).

   ⚠️⚠️ **이 분류가 쓰이는 자리는 넷입니다.**
     ① 메인의 분류 카드 열 장 (시안 그대로)
     ② 분류별 상세 화면 /c/<key> 와 그 안의 하위 거르개
     ③ 상담 · 견적 신청 — 손님이 고르는 칸 (복수 선택)
     ④ 관리자 배정 — 항목마다 그 하위를 하는 업체를 고릅니다
        (provider.subs 가 **하위 키**를 들고 있습니다)
   ①에 없는 분류를 만들면 아무도 못 찾는 칸이 되고, ④에 업체가 없는
   분류를 열면 **배정할 곳이 없는 신청**이 들어옵니다.

   ⚠️⚠️ **subs 는 분류 키가 아니라 하위 키입니다.** 업체를 등록할 때
   subs:["ls-pro","ls-screen"] 처럼 **하위**를 적습니다 — 분류 키를
   적으면 그 업체만 조용히 안 뜹니다.

   칸
     key    주소 · 저장 · 배정에 쓰는 값 — **바꾸지 마세요**
     name   화면에 나가는 이름 (시안의 카드 제목 그대로)
     lead   카드 아래 한 줄 (시안의 카드 부제 그대로)
     icon   icon() 의 이름 — **없는 이름을 적으면 빈 칸이 됩니다**
            (에러도 404 도 안 납니다. 빌드 가드가 셉니다.)
     kind   이 분류가 **누구를 잇는가** — 화면 짜임새가 여기서 갈립니다
              provider  업체와 손님을 잇습니다 (상담 · 견적 · 예약)
              trade     회원끼리 사고팝니다 (개인 판매자가 올립니다)
              match     회원끼리 모입니다 (업체가 없습니다)
              board     글을 올리고 읽습니다 (업체가 없습니다)
            ⚠️ provider 가 아닌 분류에 "업체 찾기" 를 붙이지 마세요 —
            눌러도 아무 일이 안 나는 단추가 됩니다.
     items  하위 — [{key,name}] · 업체 subs 와 배정이 이 키를 씁니다
     kw     검색 전용 다른 말 — 손님은 분류 이름을 모르고 하려는 일을
            칩니다 ("퍼터 팔기" 로 들어와도 중고 골프장터가 나와야 합니다)
   ════════════════════════════════════════════════════════════════════ */

window.AM_CATS = [

  { key:"lesson", name:"골프 레슨", icon:"swing", kind:"provider",
    lead:"프로매칭 · 레슨예약",
    kw:"레슨 프로 강습 배우기 골프배우기 입문 초보 원포인트 스윙교정 레슨비",
    items:[
      { key:"ls-pro",    name:"프로 1:1 레슨" },
      { key:"ls-group",  name:"그룹 레슨" },
      { key:"ls-screen", name:"스크린 레슨" },
      { key:"ls-field",  name:"필드 레슨" },
      { key:"ls-begin",  name:"초보 · 입문 레슨" },
      { key:"ls-junior", name:"주니어 레슨" },
      { key:"ls-video",  name:"스윙 분석 · 영상 레슨" }
    ]},

  { key:"used", name:"중고 골프장터", icon:"cart", kind:"trade",
    lead:"중고채 · 용품 거래",
    kw:"중고 중고채 중고클럽 팔기 삽니다 직거래 처분 되팔기 당근 중고거래",
    items:[
      { key:"us-driver", name:"드라이버" },
      { key:"us-wood",   name:"우드 · 유틸리티" },
      { key:"us-iron",   name:"아이언" },
      { key:"us-wedge",  name:"웨지" },
      { key:"us-putter", name:"퍼터" },
      { key:"us-set",    name:"풀세트" },
      { key:"us-bag",    name:"골프백 · 캐디백" },
      { key:"us-gear",   name:"기타 용품" }
    ]},

  { key:"booking", name:"골프장 부킹", icon:"flag", kind:"provider",
    lead:"전국 골프장 예약",
    kw:"부킹 예약 티타임 라운딩 골프장 그린피 주말부킹 조인부킹 잔여타임",
    items:[
      { key:"bk-week",   name:"주중 부킹" },
      { key:"bk-end",    name:"주말 부킹" },
      { key:"bk-group",  name:"단체 · 법인 부킹" },
      { key:"bk-deal",   name:"특가 · 잔여 타임" },
      { key:"bk-far",    name:"해외 골프장" },
      { key:"bk-right",  name:"회원권 · 멤버십" }
    ]},

  { key:"matchup", name:"골프 조인", icon:"people", kind:"match",
    lead:"함께 라운딩 · 모임",
    kw:"조인 동반자 라운딩 같이 모임 동호회 번개 조인방 인원구함",
    items:[
      { key:"jo-one",   name:"1인 조인" },
      { key:"jo-two",   name:"2인 조인" },
      { key:"jo-many",  name:"단체 조인" },
      { key:"jo-club",  name:"동호회 · 정기 모임" },
      { key:"jo-game",  name:"친선 경기 · 대회" }
    ]},

  { key:"range", name:"골프 연습장", icon:"balls", kind:"provider",
    lead:"실내 · 실외 · 스크린",
    kw:"연습장 실내연습장 실외연습장 스크린골프 타석 퍼팅연습 연습장회원권 타석권",
    items:[
      { key:"rg-in",    name:"실내 연습장" },
      { key:"rg-out",   name:"실외 연습장" },
      { key:"rg-sim",   name:"스크린골프" },
      { key:"rg-putt",  name:"퍼팅 · 어프로치 연습장" },
      { key:"rg-pass",  name:"정기권 · 회원권" }
    ]},

  { key:"market", name:"골프용품 마켓", icon:"bag", kind:"provider",
    lead:"신품 · 특가 · 브랜드",
    kw:"용품 신품 골프채 골프공 골프의류 골프화 장갑 거리측정기 할인 특가",
    items:[
      { key:"mk-club",  name:"클럽 (신품)" },
      { key:"mk-ball",  name:"골프공" },
      { key:"mk-wear",  name:"골프 의류" },
      { key:"mk-shoe",  name:"골프화" },
      { key:"mk-bag",   name:"골프백 · 가방" },
      { key:"mk-tool",  name:"거리측정기 · 장비" },
      { key:"mk-small", name:"장갑 · 소품" }
    ]},

  { key:"fitting", name:"피팅 · 수리", icon:"clubs", kind:"provider",
    lead:"클럽피팅 · 수리 · 리샤프트",
    kw:"피팅 클럽피팅 리샤프트 샤프트교체 그립교체 로프트 라이각 수리 헤드교체",
    items:[
      { key:"ft-full",  name:"풀피팅" },
      { key:"ft-shaft", name:"리샤프트 · 샤프트 교체" },
      { key:"ft-grip",  name:"그립 교체" },
      { key:"ft-angle", name:"로프트 · 라이각 조정" },
      { key:"ft-head",  name:"헤드 교체" },
      { key:"ft-mend",  name:"클럽 수리" }
    ]},

  { key:"travel", name:"골프 여행", icon:"plane", kind:"provider",
    lead:"국내 · 해외 골프투어",
    kw:"골프여행 골프투어 해외골프 동남아 일본골프 패키지 숙박 리조트 전지훈련",
    items:[
      { key:"tr-home",  name:"국내 골프투어" },
      { key:"tr-away",  name:"해외 골프투어" },
      { key:"tr-pack",  name:"패키지 · 단체 투어" },
      { key:"tr-stay",  name:"숙박 · 리조트" },
      { key:"tr-move",  name:"이동 · 렌터카" }
    ]},

  { key:"career", name:"골프 인력 · 비즈니스", icon:"case", kind:"board",
    lead:"구인 · 구직 · 제휴",
    kw:"구인 구직 채용 알바 캐디 프로채용 매장양도 창업 제휴 입점 도매",
    items:[
      { key:"cr-hire",  name:"구인" },
      { key:"cr-want",  name:"구직" },
      { key:"cr-caddy", name:"캐디" },
      { key:"cr-coach", name:"프로 · 강사" },
      { key:"cr-tieup", name:"제휴 · 입점" },
      { key:"cr-hand",  name:"매장 양도 · 창업" }
    ]},

  { key:"community", name:"골프 커뮤니티", icon:"chat", kind:"board",
    lead:"질문 · 후기 · 정보공유",
    kw:"커뮤니티 게시판 질문 후기 리뷰 정보 공유 자유게시판 입문질문",
    items:[
      { key:"cm-ask",   name:"질문" },
      { key:"cm-say",   name:"후기" },
      { key:"cm-tip",   name:"정보 공유" },
      { key:"cm-open",  name:"자유게시판" }
    ]}
];

/* ── 꺼내 쓰는 자리 — 규칙은 **한 함수**에 두고 모두가 그것을 부릅니다 ── */

/* 분류 하나 — 없는 키면 null (지어내지 않습니다) */
window.amCat = function(key){
  var L = window.AM_CATS || [];
  for(var i=0;i<L.length;i++) if(L[i].key === key) return L[i];
  return null;
};

/* 분류의 하위 — 없으면 빈 배열 */
window.amCatItems = function(c){
  if(typeof c === "string") c = window.amCat(c);
  return (c && Array.isArray(c.items)) ? c.items : [];
};

/* 하위 키 하나로 분류와 하위를 되찾습니다 — 배정 · 저장된 신청을 읽을 때 */
window.amSub = function(subKey){
  var L = window.AM_CATS || [];
  for(var i=0;i<L.length;i++){
    var it = window.amCatItems(L[i]);
    for(var j=0;j<it.length;j++) if(it[j].key === subKey)
      return { cat:L[i], item:it[j] };
  }
  return null;
};

/* 업체를 중개하는 분류만 — "업체 찾기" 가 걸리는 자리는 여기뿐입니다.
   ⚠️ kind 를 화면마다 다시 적지 마세요. 두 곳에 적으면 한쪽만 바뀝니다. */
window.amCatsOf = function(kind){
  return (window.AM_CATS || []).filter(function(c){ return c.kind === kind; });
};
/* ⚠️⚠️ **분류 주소는 여기서만 짓습니다.** 한 번 build.js 에서만 /cat/ 으로
   바꾸고 링크는 /c/ 로 남겨 둔 적이 있습니다 — 화면 열두 장의 링크
   예순다섯 곳이 전부 410 으로 갈 뻔했습니다 (tools/check-links.js 가
   잡았습니다). 주소를 바꾸실 때도 이 함수 하나만 고치세요.
   ⚠️ c 한 글자는 못 씁니다 — vercel.json 이 /c/:p* 를 410 으로 보냅니다. */
window.amCatUrl = function(c){
  var key = (typeof c === "string") ? c : (c && c.key);
  return key ? "/cat/" + key : "/categories";
};

window.amCatIsProvider = function(c){
  if(typeof c === "string") c = window.amCat(c);
  return !!(c && c.kind === "provider");
};

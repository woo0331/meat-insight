/* ════════════════════════════════════════════════════════════════════
   서비스 분류 — PHONEWAY 제휴업체가 하는 일 (열 가지)

   ⚠️⚠️ **2026-10-31 전면 교체.** 그 전까지 이 파일은 **창업 · 폐업
   분류 26 · 하위 210**(인테리어 · 철거 · 세무 · 노무 …)이었습니다.
   그 사업은 끝났고, 지금 중개하는 것은 중고폰입니다.
   ⚠️ 옛 분류를 꺼내 보시려면 `git show bf9e1bc:js/data/catalog.js`.

   ⚠️⚠️ **키를 하나도 겹치지 않게 지었습니다.** 옛 26개 키
   (item · store · area · interior · equip · furniture · it · supply ·
   repair · admin · staff · marketing · clean · fund · process ·
   transfer · asset · stock · demolish · restore · waste · tax ·
   labor · contract · law · support)와 **한 글자도 겹치지 않습니다** —
   `request_item.service_id` 가 글자로 저장되어 있어서, 같은 키를
   다른 뜻으로 쓰면 **지난 신청 기록의 뜻이 조용히 바뀝니다.**
   그래서 수리는 `repair` 가 아니라 **`fix`** 입니다 (옛 `repair` 는
   매장 설비 수리였습니다).

   ⚠️⚠️ **이 분류가 쓰이는 자리는 셋입니다.**
     ① `/quote` STEP 01 — 손님이 **고르는 칸** (복수 선택)
     ② `/quote` 의 서비스별 질문 — `reqforms.js` 가 이 키로 묶습니다
     ③ `/admin` 배정 — 항목마다 그 분류를 하는 업체를 고릅니다
        (`provider.subs` 가 **하위 키**를 들고 있습니다)
   그래서 ①에 없는 분류를 만들면 **아무도 고를 수 없는 칸**이 되고,
   ③에 업체가 없는 분류를 열면 **배정할 곳이 없는 신청**이 들어옵니다.

   ⚠️⚠️ **`subs` 는 분류 키가 아니라 하위 키입니다.** 업체를 등록할 때
   `subs:["lcd","battery"]` 처럼 **하위**를 적습니다 — 분류 키를 적으면
   그 업체만 조용히 안 뜹니다. `checkProviders()` 가 빌드를 멈춥니다.

   ⚠️ 업종(`industry`)이 없습니다. 창업 · 폐업에는 업종 열넷이 분류의
   하위를 갈랐지만(카페는 커피머신 · 미용실은 샴푸대), **중고폰은
   업종으로 갈리지 않습니다** — 갈리는 것은 **기기**(`devices.js` 의
   제조사 · 종류 · 모델)입니다. 그래서 `amCatItems(c)` 는 인자가
   하나이고 `c.items` 를 그대로 돌려줍니다.

   칸
     key    주소 · 저장 · 배정에 쓰는 값 — **바꾸지 마세요**
     name   화면에 나가는 이름
     icon   `icon()` 의 이름 — 없는 이름을 적으면 빈 칸이 됩니다
     lead   한 줄 설명 (고르는 칸 아래에 나갑니다)
     items  하위 — [{key,name}] · 업체 `subs` 와 배정이 이 키를 씁니다
     kw     검색 전용 다른 말 — 손님은 분류 이름을 모르고 하려는 일을 칩니다
     kind   지금은 전부 "provider"(업체가 하는 일)입니다
   ════════════════════════════════════════════════════════════════════ */

window.AM_CATS = [

  { key:"buyin", name:"중고폰 매입", icon:"mobile", kind:"provider",
    lead:"쓰던 기기를 팔고 싶으실 때입니다.",
    kw:"폰팔기 핸드폰 휴대폰 중고 처분 판매 되팔기 보상판매 공기계",
    items:[
      { key:"ph-buy",    name:"스마트폰 매입" },
      { key:"tab-buy",   name:"태블릿 매입" },
      { key:"watch-buy", name:"스마트워치 매입" },
      { key:"buds-buy",  name:"무선이어폰 매입" },
      { key:"nb-buy",    name:"노트북 매입" },
      { key:"self-buy",  name:"자급제 · 공기계 매입" }
    ]},

  { key:"broken", name:"고장 · 파손폰 매입", icon:"bolt", kind:"provider",
    lead:"깨지거나 켜지지 않아도 값이 나올 수 있습니다.",
    kw:"액정깨짐 파손 침수 먹통 안켜짐 고장 부품 폐폰 깨진폰",
    items:[
      { key:"lcd-bad",   name:"액정 파손" },
      { key:"wet-bad",   name:"침수" },
      { key:"pwr-bad",   name:"전원 불량" },
      { key:"batt-bad",  name:"배터리 불량" },
      { key:"back-bad",  name:"뒷판 · 프레임 파손" },
      { key:"part-bad",  name:"부품용 단말기" }
    ]},

  /* ⚠️⚠️ `icon` 은 **선 아이콘**(`icon()`)입니다 — 컬러 쪽(`iconArt()`)과
     이름이 다릅니다. 여기 `repair` 라고 적혀 있었는데 그건 컬러 아이콘
     이름이고, 선 쪽에는 그런 이름이 없어서 `icon()` 이 **빈 문자열**을
     돌려줬습니다 — 타일이 덩그러니 비는데 에러도 404 도 안 납니다
     (세어서 알았습니다). 선 쪽 이름은 `tool` 입니다. */
  { key:"fix", name:"수리 서비스", icon:"tool", kind:"provider",
    lead:"고쳐서 더 쓰실 수 있는지부터 봅니다.",
    kw:"수리 AS 사설수리 액정교체 배터리교체 충전 침수복구 데이터복구",
    items:[
      { key:"lcd",     name:"액정 교체" },
      { key:"battery", name:"배터리 교체" },
      { key:"charge",  name:"충전 단자 수리" },
      { key:"camera",  name:"카메라 수리" },
      { key:"sound",   name:"스피커 · 마이크 수리" },
      { key:"wet-fix", name:"침수 복구" },
      { key:"board",   name:"메인보드 수리" },
      { key:"data",    name:"데이터 복구" }
    ]},

  { key:"shop", name:"검수 중고폰 판매", icon:"cart", kind:"provider",
    lead:"검수하고 등급을 매긴 기기를 팝니다.",
    kw:"중고폰구매 구입 사기 쇼핑몰 리퍼 중고기기 자급제구매",
    items:[
      { key:"ph-sell",    name:"스마트폰" },
      { key:"tab-sell",   name:"태블릿" },
      { key:"watch-sell", name:"스마트워치" },
      { key:"buds-sell",  name:"무선이어폰" },
      { key:"nb-sell",    name:"노트북" }
    ]},

  { key:"wholesale", name:"B2B 도매 · 경매", icon:"boxes", kind:"provider",
    lead:"전문업체끼리 수량으로 거래하는 자리입니다.",
    kw:"도매 벌크 경매 입찰 물량 다량 업자 사입 등급별",
    items:[
      { key:"lot",      name:"단말기 도매" },
      { key:"bulk",     name:"등급별 벌크" },
      { key:"auction",  name:"경매 참여" },
      { key:"part-lot", name:"부품 · 모듈 도매" }
    ]},

  { key:"corp", name:"기업 · 법인 대량 매입", icon:"building", kind:"provider",
    lead:"업무용 기기를 한 번에 정리하실 때입니다.",
    kw:"기업 법인 단체 업무용 사내 임대폰 리스 자산정리 대량",
    items:[
      { key:"office",    name:"업무용 단말기 정리" },
      { key:"lease",     name:"임대 · 리스 단말기 회수" },
      { key:"wipe-cert", name:"데이터 완전 삭제 증명" },
      { key:"asset-val", name:"자산 목록 평가" }
    ]},

  { key:"export", name:"해외 수출 · 바이어", icon:"globe", kind:"provider",
    lead:"해외로 내보내는 거래를 잇습니다.",
    kw:"수출 해외 바이어 무역 통관 선적 컨테이너 외국",
    items:[
      { key:"buyer",     name:"해외 바이어 연결" },
      { key:"customs",   name:"수출 통관" },
      { key:"container", name:"등급별 컨테이너" },
      { key:"shipping",  name:"선적 · 물류" }
    ]},

  { key:"inspect", name:"검수 · 데이터 삭제", icon:"scan", kind:"provider",
    lead:"상태를 판정하고 안에 남은 것을 지웁니다.",
    kw:"검수 등급 판정 상태확인 초기화 데이터삭제 개인정보 잠금 아이클라우드",
    items:[
      { key:"grade",  name:"외관 등급 판정" },
      { key:"func",   name:"기능 검수" },
      { key:"imei",   name:"제조번호 조회" },
      { key:"wipe",   name:"데이터 완전 삭제" },
      { key:"unlock", name:"잠금 해제 확인" }
    ]},

  { key:"pickup", name:"수거 · 배송", icon:"truck", kind:"provider",
    lead:"기기를 가져오고 돌려보내는 일입니다.",
    kw:"택배 수거 방문 발송 보내는법 포장 배송 퀵",
    items:[
      { key:"post",  name:"택배 수거" },
      { key:"visit", name:"방문 수거" },
      { key:"store", name:"매장 방문" },
      { key:"pack",  name:"안전 포장" }
    ]},

  { key:"access", name:"액세서리 · 부자재", icon:"plug", kind:"provider",
    lead:"기기와 같이 쓰는 것들입니다.",
    kw:"케이스 필름 충전기 케이블 보호필름 거치대 포장재 액세서리",
    items:[
      { key:"case",    name:"케이스 · 필름" },
      { key:"charger", name:"충전기 · 케이블" },
      { key:"wrap",    name:"보호 포장재" },
      { key:"stand",   name:"거치대" }
    ]}

];


/* 분류 하나 — 없는 키에는 null 입니다 (빈 칸을 만들지 않습니다) */
window.amCat = function(key){
  var L = window.AM_CATS || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

/* 분류의 하위
   ⚠️ 인자가 **하나**입니다. 창업 · 폐업 때는 `amCatItems(c, 업종)` 으로
      업종마다 다른 장비를 냈는데(`시설 · 장비`), 중고폰은 업종으로
      갈리지 않습니다 — 갈리는 것은 기기이고 그건 `devices.js` 입니다. */
window.amCatItems = function(c){
  if(!c) return [];
  return c.items || [];
};

/* 모든 하위를 한 줄로 — 업체 등록 고르개가 씁니다
   ⚠️⚠️ **같은 하위 키가 둘 들어가면 안 됩니다.** 고르개에 체크칸이
   두 번 그려지고, 하나를 누르면 둘이 같이 켜지는데 바구니에는 한 번만
   담깁니다 (창업 · 폐업에서 `시설 · 장비` 하위 다섯이 그랬습니다).
   ⚠️ 지금은 분류마다 제 `items` 뿐이라 겹칠 수가 없지만, 하위를
   더하실 때 **같은 키를 두 분류에 적지 마세요** — 빌드가 막습니다. */
window.amAllSubs = function(c){
  if(!c) return [];
  return c.items || [];
};

/* 하위 하나의 이름 — 없으면 빈 문자열입니다 (키를 날것으로 찍지 않게) */
window.amSubName = function(catKey, subKey){
  var c = window.amCat(catKey); if(!c) return "";
  var L = c.items || [];
  for(var i = 0; i < L.length; i++) if(L[i].key === subKey) return L[i].name;
  return "";
};

/* ── id 꼴 · 한 벌로 읽기 ─────────────────────────────────────────
   ⚠️⚠️ **2026-10-31 — `js/data/svcpick.js` 에서 옮겨 왔습니다.** 그
   파일은 창업 준비 전문관의 고르개 데이터(쉬운 이름 열넷 · 대표 여섯 ·
   업종별 차례 · 묶음 여덟 · 전문관별 목록)였고 전부 인수인계 것이라
   지웠습니다 — 여기 넷만 **중고폰에서도 그대로 쓰는 것**이라 살렸습니다
   (`/quote` STEP 01 · `/admin` 접수 목록 · 회원 계정 저장이 읽습니다).
   ⚠️ 꺼내 보시려면 `git show 6d85a17:js/data/svcpick.js`.

   ```
   buyin              중고폰 매입 (분류 전체)
   buyin/ph-buy       스마트폰 매입 (하위 하나)
   ```
   ⚠️ 구분자가 `/` 인 까닭 — 분류 key 와 하위 key 가 둘 다
   `[a-z0-9-]` 뿐이라 섞일 수가 없습니다. ⚠️⚠️ **key 에 `/` 를 쓰지
   마세요** — 그 순간 이 꼴이 깨집니다.
   ⚠️⚠️ **추가 질문은 분류 단위입니다** (`reqforms.js`). 같은 분류의
   하위 둘을 고르셔도 질문은 **한 번만** 나옵니다 — `api/quote.js` 의
   `detail` 상한(20)을 지키는 자리입니다. */
window.amPickSplit = function(id){
  var s = String(id || "").split("/");
  return { cat: s[0] || "", sub: (s.length > 1 ? s[1] : "") };
};

/* 화면이 쓰는 한 벌 — 이름 · 설명 · 아이콘은 **원본(`catalog.js`)에서**
   읽습니다. 여기 적으면 두 곳이 어긋납니다.
   ⚠️ `sub` 을 주면 **하위 한 벌**입니다. 아이콘은 **분류 것을 그대로**
   씁니다 — 같은 서비스가 다른 자리에서 다른 그림이면 한 시스템으로
   안 읽힙니다. */
window.amPickWrap = function(c, sub){
  if(!c) return null;
  var ask = !!(window.AM_REQ_FORMS && window.AM_REQ_FORMS[c.key]);
  if(sub && sub.key) return {
    id:c.key + "/" + sub.key, cat:c.key, sub:sub.key,
    name:sub.name, easy:"", lead:"",
    /* ⚠️ 작은 줄에 **분류 이름**을 냅니다 — "스마트폰 매입" 만 있으면
       어느 분야 것인지 안 보이고, 목록에서 섞이면 더 그렇습니다. */
    desc:c.name,
    icon:(sub.icon || c.icon || "check"),
    to:(typeof window.catTo === "function") ? window.catTo(c) : "",
    ask:ask
  };
  return {
    id:c.key, cat:c.key, sub:"",
    name:c.name, easy:"", lead:(c.lead || ""), desc:(c.desc || ""),
    icon:(c.icon || "check"),
    to:(typeof window.catTo === "function") ? window.catTo(c) : "",
    ask:ask
  };
};

/* id 하나를 되돌려 찾습니다 — 주소(`?sv=`)와 저장된 선택을 읽을 때.
   ⚠️⚠️ **없는 id 는 null 입니다.** 밖으로 나간 링크가 옛 id 를 들고
   있을 수 있어서, 거기서 에러를 내면 손님은 아무 잘못도 안 하시고
   깨진 화면을 봅니다 — 부르는 쪽이 걸러 냅니다. */
window.amPickOne = function(id){
  if(!id) return null;
  var p = window.amPickSplit(id);
  var c = (typeof window.amCat === "function") ? window.amCat(p.cat) : null;
  if(!c) return null;
  if(!p.sub) return window.amPickWrap(c);
  /* ⚠️⚠️ **없는 하위는 null 입니다.** 분류는 맞는데 하위만 틀린
     id(`fix/없는것`)를 분류로 눌러 주면, 손님이 고른 것과 접수에
     실리는 것이 **조용히 달라집니다** — 액정 교체를 고르셨는데
     "수리 서비스 전체" 로 들어가는 꼴입니다. */
  var subs = (typeof window.amAllSubs === "function")
    ? window.amAllSubs(c) : (c.items || []);
  var hit = subs.filter(function(s){ return s && s.key === p.sub; })[0];
  return hit ? window.amPickWrap(c, hit) : null;
};

/* 화면에 내는 딱지 — ⚠️ 쉬운 이름(`easy`)은 창업 쪽 열넷을 위해 두었던
   칸이고 중고폰 분류 이름은 이미 쉬운 말입니다 (중고폰 매입 · 수리
   서비스 …). 칸은 **남겨 둡니다** — 되살리시는 날 여기만 채우면 됩니다. */
window.amPickLabel = function(s){
  return (s && (s.easy || s.name)) || "";
};

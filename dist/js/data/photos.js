

window.WOW_PHOTO_SLOTS = [

  { key:"hero-start", sizes:"100vw", where:"(지금 안 나옴) 옛 메인 브랜드 히어로의 바탕",
    min:[1400,560], ratio:[1.3,2.6], maxKB:300, anchor:"center",
    note:"실제 한국에서 운영될 법한 상업공간 · 자연광 · 고해상도. ⚠️ 위에 짙은 남색 막이 덮이고 글이 판 가운데 높이에 앉습니다 — 주인공을 거기 두지 마세요. ⚠️ 사진 안에 글자 · 상호 · 로고가 보이면 안 됩니다" },

  { key:"hero-close", sizes:"(max-width:900px) 52vw, (max-width:1100px) 48vw, 44vw", where:"(지금 안 나옴) 옛 히어로 오른쪽 판",
    min:[1400,560], ratio:[1.3,2.6], maxKB:300, anchor:"center",
    note:"같은 공간이 정리되는 듯한 장면이면 가장 좋습니다. 밝은 샌드 막이 덮입니다. ⚠️ 실패한 장면이 아니라 다음을 준비하는 장면입니다 — 불 꺼진 가게 · 고개 숙인 사람 금지" },

  { key:"hero-startup", sizes:"(max-width:1023px) 100vw, 42vw",
    where:"창업 전문관(/startup) 머리 · 메인 진입 카드 01",
    min:[840,740], ratio:[0.85,1.5], maxKB:200, anchor:"right",
    note:"새로 여는 밝은 상업공간 · 자연광. ⚠️ 상호 · 간판 · 로고가 읽히면 안 됩니다" },
  { key:"hero-closure", sizes:"(max-width:1023px) 100vw, 42vw",
    where:"폐업 · 정리 전문관(/closure) 머리 · 메인 진입 카드 03",
    min:[840,740], ratio:[0.85,1.5], maxKB:200, anchor:"right",
    note:"정리 중인 매장 — 의자를 올리고 박스를 싸는 장면. ⚠️⚠️ 불 꺼진 가게 · 고개 숙인 사람 · 폐허 금지. 실패가 아니라 다음을 준비하는 장면입니다" },
  { key:"hero-ops", sizes:"(max-width:1023px) 100vw, 42vw",
    where:"운영 서비스관(/operation) 머리 · 메인 진입 카드 02",
    min:[840,740], ratio:[0.85,1.5], maxKB:200, anchor:"right",
    note:"문을 연 매장에서 POS · 태블릿으로 일하는 장면. ⚠️ 실제 POS 상표 · 서비스 로고가 읽히면 안 됩니다" },

  { key:"category-startup", sizes:"(max-width:900px) 92vw, (max-width:1100px) 44vw, 32vw", where:"단계 카드 01 · 창업 준비",
    min:[900,560], ratio:[1.2,1.9], maxKB:160, anchor:"center",
    note:"사업계획서 · 노트 · 펜 · 노트북 · 밝은 상업공간. ⚠️ 커피컵처럼 한 업종이 떠오르는 사진에 기대지 마세요 — '준비한다' 는 느낌이 먼저입니다" },
  { key:"category-location", sizes:"(max-width:900px) 92vw, (max-width:1100px) 44vw, 32vw", where:"단계 카드 02 · 상가 · 입지",
    min:[900,560], ratio:[1.2,1.9], maxKB:160, anchor:"center",
    note:"한국의 깔끔한 상업지역 · 상가 외관. ⚠️ 브랜드 로고 · 간판 글자가 보이면 안 되고, 해외 거리 느낌도 피합니다" },
  { key:"category-build", sizes:"(max-width:900px) 92vw, (max-width:1100px) 44vw, 32vw", where:"단계 카드 03 · 매장 만들기",
    min:[900,560], ratio:[1.2,1.9], maxKB:160, anchor:"center",
    note:"마감 · 조명 설치 · 가구 배치. ⚠️ 거친 건설현장이 아니라 **매장이 완성되어 가는 모습**입니다" },
  { key:"category-operation", sizes:"(max-width:900px) 92vw, (max-width:1100px) 44vw, 32vw", where:"단계 카드 04 · 매장 운영",
    min:[900,560], ratio:[1.2,1.9], maxKB:160, anchor:"center",
    note:"POS · 매출 관리 · 주문 관리. ⚠️ 실제 서비스 상표나 POS 브랜드 로고가 보이면 안 됩니다" },
  { key:"category-transfer", sizes:"(max-width:900px) 92vw, (max-width:1100px) 44vw, 32vw", where:"단계 카드 05 · 매장 양도 · 양수",
    min:[900,560], ratio:[1.2,1.9], maxKB:160, anchor:"center",
    note:"계약서 · 열쇠 · 깔끔한 상업공간. ⚠️ 악수 스톡사진 느낌은 피합니다 — 이 플랫폼의 핵심 차별화 자리라 고급스럽고 신뢰감 있게" },
  { key:"category-closing", sizes:"(max-width:900px) 92vw, (max-width:1100px) 44vw, 32vw", where:"단계 카드 06 · 폐업 · 정리",
    min:[900,560], ratio:[1.2,1.9], maxKB:160, anchor:"center",
    note:"정리된 박스 · 집기 이동 · 전문 작업자의 정리. ⚠️⚠️ 폐허 · 쓰레기 더미 · 불 꺼진 매장 · 실패한 느낌 **절대 금지** — 폐업은 실패가 아니라 안전한 정리입니다" },

  { key:"side-start", sizes:"(max-width:900px) 28vw, 18vw", where:"(지금 안 나옴) START 카드 머리 · 새로 오픈하는 매장",
    min:[1200,530], ratio:[2.0,2.6], maxKB:180,
    note:"새롭게 오픈하는 밝은 매장. 가로로 길게 잘립니다" },
  { key:"side-close", sizes:"(max-width:900px) 28vw, 18vw", where:"(지금 안 나옴) CLOSE 카드 머리 · 깔끔하게 정리하는 매장",
    min:[1200,530], ratio:[2.0,2.6], maxKB:180,
    note:"깔끔하게 정리하는 매장. 어수선하거나 처연하면 안 됩니다" },

  { key:"flow-close", sizes:"(max-width:860px) 82vw, 30vw", where:"(지금 안 나옴) 연결 · 정리하는 사장님 쪽", min:[900,540],
    ratio:[1.5,1.9], maxKB:180,
    note:"정리 중인 매장 · 시설. 차분하되 어둡지 않게" },
  { key:"flow-start", sizes:"(max-width:860px) 82vw, 30vw", where:"(지금 안 나옴) 연결 · 이어받는 사장님 쪽", min:[900,540],
    ratio:[1.5,1.9], maxKB:180,
    note:"이어받아 새로 여는 밝은 매장 내부" },

  { key:"feat-franchise", sizes:"(max-width:900px) 92vw, 36vw", where:"(지금 안 나옴) 큰 카드 · 프랜차이즈", min:[900,620],
    ratio:[1.2,1.6], maxKB:200, note:"완성된 상업 매장 외관 또는 내부" },
  { key:"feat-store", sizes:"(max-width:900px) 92vw, 36vw", where:"(지금 안 나옴) 큰 카드 · 점포 · 상가", min:[900,620],
    ratio:[1.2,1.6], maxKB:200, note:"상가 · 점포 Exterior. 임대 안내가 붙은 빈 점포도 좋습니다" },
  { key:"feat-interior", sizes:"(max-width:900px) 92vw, 36vw", where:"(지금 안 나옴) 큰 카드 · 인테리어", min:[900,620],
    ratio:[1.2,1.6], maxKB:200, note:"상업공간 공사 중 또는 완성된 공간" },

  { key:"svc-store", sizes:"92px",     where:"(지금 안 나옴) 서비스 · 상가 · 점포",     min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"빈 상가 · 상권 거리. ⚠️ 상호 · 간판이 읽히면 안 됩니다" },

  { key:"svc-interior", sizes:"104px", where:"(지금 안 나옴) 서비스 · 인테리어 · 시공",  min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"시공 중인 상업공간 · 도면" },
  { key:"svc-equip", sizes:"92px",     where:"(지금 안 나옴) 서비스 · 시설 · 장비",     min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"업소용 장비. ⚠️ 한 업종으로 읽히지 않게" },
  { key:"svc-it", sizes:"104px",       where:"(지금 안 나옴) 서비스 · POS · CCTV · 매장시스템",  min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"POS · 키오스크 · CCTV. ⚠️ 브랜드가 보이면 안 됩니다" },
  { key:"svc-admin", sizes:"92px",     where:"(지금 안 나옴) 서비스 · 행정 · 전문가",    min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"서류 · 상담 책상. ⚠️ 실제 서류 글자가 읽히면 안 됩니다" },
  { key:"svc-marketing", sizes:"92px", where:"(지금 안 나옴) 서비스 · 마케팅 · 디자인",  min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"디자인 작업 · 촬영" },
  { key:"svc-demolish", sizes:"92px",  where:"(지금 안 나옴) 서비스 · 철거",            min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"철거 · 원상복구 현장" },
  { key:"svc-clean", sizes:"92px",     where:"(지금 안 나옴) 서비스 · 청소 · 방역",      min:[240,240], ratio:[0.95,1.08], maxKB:40, note:"청소 · 방역 장비" },

  { key:"kind-take", sizes:"(max-width:520px) 94vw, (max-width:600px) 480px, (max-width:900px) 47vw, (max-width:1280px) 31vw, 387px",
    where:"(지금 안 나옴) 자산 카드 01 · 매장 인수하기", min:[1120,840], ratio:[1.25,1.45], maxKB:140,
    note:"문 여는 상업공간 · 빈 점포 내부. ⚠️ 상호 · 간판 · 업종이 읽히면 안 됩니다" },

  { key:"kind-pass", sizes:"(max-width:900px) 96vw, (max-width:1100px) 42vw, 40vw",
    where:"메인 ④ 매장 양도양수 배너", min:[1120,840], ratio:[1.25,1.45], maxKB:140,
    note:"정리하는 상업공간 · 넘기는 열쇠. ⚠️ 처연하면 안 됩니다 — 불 꺼진 가게 · 고개 숙인 사람 금지" },
  { key:"kind-asset", sizes:"(max-width:520px) 94vw, (max-width:600px) 480px, (max-width:900px) 47vw, (max-width:1280px) 31vw, 387px",
    where:"(지금 안 나옴) 자산 카드 03 · 시설 · 장비 거래", min:[1120,840], ratio:[1.25,1.45], maxKB:140,
    note:"업소용 시설 · 장비. ⚠️ 한 업종으로 읽히지 않게 (주방설비만 쓰면 고깃집으로 읽힙니다)" },

  { key:"cta-consult", sizes:"(max-width:1024px) 92vw, 40vw",
    where:"(지금 안 나옴) 메인 06 · 견적 · 상담 신청 오른쪽", min:[1120,840], ratio:[1.25,1.45], maxKB:150,
    note:"밝은 매장 · 상담하는 장면. ⚠️ 한 업종이 드러나면 안 됩니다. 정리 · 철거 현장 금지" }
];

window.WOW_PHOTOS = {
  "hero-start": { src:"/img/hero-start.jpg?v=43939c5f",
    w:1701, h:756,
    webp:"/img/hero-start-sm.webp?v=d10230c9 936w, /img/hero-start.webp?v=61230e9c 1701w",
    jpg:"/img/hero-start-sm.jpg?v=7627d1c7 936w, /img/hero-start.jpg?v=43939c5f 1701w",
    alt:"큰 창으로 햇빛이 드는 상업공간에서 작업자들이 카운터와 조명을 설치하고 있습니다" },
  "hero-close": { src:"/img/hero-close.jpg?v=5011de99",
    w:1702, h:756,
    webp:"/img/hero-close-sm.webp?v=0c461161 936w, /img/hero-close.webp?v=a9bcb267 1702w",
    jpg:"/img/hero-close-sm.jpg?v=14d773b3 936w, /img/hero-close.jpg?v=5011de99 1702w",
    alt:"햇빛이 드는 상가 내부에서 작업자들이 마감재를 떼어 내고 정리하고 있습니다" },
  "hero-startup": { src:"/img/hero-startup.jpg?v=cafced7d",
    w:978, h:941,
    webp:"/img/hero-startup-sm.webp?v=7ebd4ab7 538w, /img/hero-startup.webp?v=1f776267 978w",
    jpg:"/img/hero-startup-sm.jpg?v=3fd69ce9 538w, /img/hero-startup.jpg?v=cafced7d 978w",
    alt:"갓 문을 연 카페 카운터에서 사장님이 태블릿을 들고 매장을 둘러보고 있습니다" },
  "hero-closure": { src:"/img/hero-closure.jpg?v=5ed467e1",
    w:869, h:941,
    webp:"/img/hero-closure-sm.webp?v=2aca1ddb 478w, /img/hero-closure.webp?v=f89dbdaf 869w",
    jpg:"/img/hero-closure-sm.jpg?v=f82fb7f1 478w, /img/hero-closure.jpg?v=5ed467e1 869w",
    alt:"햇빛이 드는 매장에서 사장님이 의자를 테이블에 올리고 포장 상자를 정리하고 있습니다" },
  "hero-ops": { src:"/img/hero-ops.jpg?v=4fd18720",
    w:953, h:941,
    webp:"/img/hero-ops-sm.webp?v=75ad6292 524w, /img/hero-ops.webp?v=34b13237 953w",
    jpg:"/img/hero-ops-sm.jpg?v=3ec4c91c 524w, /img/hero-ops.jpg?v=4fd18720 953w",
    alt:"문을 연 매장 카운터에서 사장님이 POS 화면을 보며 주문을 처리하고 있습니다" },
  "svc-interior": { src:"/img/svc-interior.jpg?v=b42e5abd",
    w:267, h:263,
    webp:"/img/svc-interior.webp?v=ee373d5e 267w",
    alt:"상업공간 인테리어 마감재 견본과 매장 평면도면이 작업대에 놓여 있습니다" },
  "svc-equip": { src:"/img/svc-equip.jpg?v=57207420",
    w:322, h:324,
    webp:"/img/svc-equip.webp?v=dab4866d 322w",
    alt:"업소용 주방의 스테인리스 가스레인지와 대형 조리 냄비들" },
  "svc-it": { src:"/img/svc-it.jpg?v=a7e82576",
    w:324, h:323,
    webp:"/img/svc-it.webp?v=82788821 324w",
    alt:"매장 천장에 설치된 CCTV 카메라 셋과 화면이 나뉜 관제 모니터" },
  "svc-clean": { src:"/img/svc-clean.jpg?v=41582a26",
    w:267, h:263,
    webp:"/img/svc-clean.webp?v=a079a198 267w",
    alt:"매장 청소에 쓰는 세정제 분무기와 밀대, 청소 카트" },
  "kind-take": { src:"/img/kind-take.jpg?v=88e14a31",
    w:1120, h:840,
    webp:"/img/kind-take-sm.webp?v=785bc293 560w, /img/kind-take.webp?v=fe3cdf82 1120w",
    jpg:"/img/kind-take-sm.jpg?v=8a843e3d 560w, /img/kind-take.jpg?v=88e14a31 1120w",
    alt:"큰 통창으로 햇빛이 드는 빈 상업공간 내부" },
  "kind-pass": { src:"/img/kind-pass.jpg?v=297df8c2",
    w:1120, h:840,
    webp:"/img/kind-pass-sm.webp?v=daeb2353 560w, /img/kind-pass.webp?v=6e251ce5 1120w",
    jpg:"/img/kind-pass-sm.jpg?v=397c4b96 560w, /img/kind-pass.jpg?v=297df8c2 1120w",
    alt:"따뜻한 조명이 켜진 매장 카운터와 좌석" },
  "kind-asset": { src:"/img/kind-asset.jpg?v=449ec642",
    w:1120, h:840,
    webp:"/img/kind-asset-sm.webp?v=d6f4fc74 560w, /img/kind-asset.webp?v=64cc0fe1 1120w",
    jpg:"/img/kind-asset-sm.jpg?v=428937df 560w, /img/kind-asset.jpg?v=449ec642 1120w",
    alt:"스테인리스 조리대와 장비가 늘어선 상업용 주방" },

};

window.wowPhoto = function(key){
  var p = (window.WOW_PHOTOS || {})[key];
  return (p && p.src) ? p : null;
};
window.hasPhoto = function(key){ return !!wowPhoto(key); };

window.wowSlot = function(key){
  var L = window.WOW_PHOTO_SLOTS || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === key) return L[i];
  return null;
};

window.photoBox = function(key, cls, eager, sz){
  var c = "ph" + (cls ? " " + cls : "");
  var p = wowPhoto(key);

  if(!p) return '<span class="' + c + ' ph-none" aria-hidden="true"></span>';

  var sl    = window.wowSlot(key) || {};
  var sizes = sz || p.sizes || sl.sizes || "";
  var szAtt = sizes ? ' sizes="' + esc(sizes) + '"' : "";

  var wh = (p.w && p.h) ? ' width="' + p.w + '" height="' + p.h + '"' : "";

  var img = '<img class="' + c + '" src="' + esc(p.src) + '"' +
    (p.jpg ? ' srcset="' + esc(p.jpg) + '"' + szAtt : "") + wh +
    ' alt="' + esc(p.alt || "") + '"' +
    (eager ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">';

  var alt = "";
  if(p.avif) alt += '<source type="image/avif" srcset="' + esc(p.avif) + '"' + szAtt + '>';
  if(p.webp) alt += '<source type="image/webp" srcset="' + esc(p.webp) + '"' + szAtt + '>';

  return alt ? '<picture class="ph-p">' + alt + img + '</picture>' : img;
};

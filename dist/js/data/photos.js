

window.WOW_PHOTO_SLOTS = [

  { key:"dev-iphone", sizes:"(max-width:359px) 222px, (max-width:1199px) 44vw, 270px",
    where:"메인 히어로 · /sell 01 기기 카드 — 아이폰", min:[400,400], ratio:[0.85,1.4], maxKB:330,
    note:"아이폰 한 대. ⚠️ 애플 로고가 **읽히지 않아야** 합니다 (남의 등록상표) · **배경 투명**" },
  { key:"dev-galaxy", sizes:"(max-width:359px) 222px, (max-width:1199px) 44vw, 270px",
    where:"/sell 01 기기 카드 — 갤럭시", min:[400,400], ratio:[0.85,1.4], maxKB:330,
    note:"갤럭시 한 대 + 스타일러스. ⚠️ 삼성 워드마크가 읽히지 않아야 합니다 · **배경 투명**" },
  { key:"dev-tablet", sizes:"(max-width:359px) 222px, (max-width:1199px) 44vw, 270px",
    where:"/sell 01 기기 카드 — 태블릿", min:[400,400], ratio:[0.85,1.4], maxKB:330,
    note:"태블릿 한 대(또는 두 대 나란히). ⚠️ 상표가 읽히지 않아야 합니다 · **배경 투명**" },
  { key:"dev-etc", sizes:"(max-width:359px) 222px, (max-width:1199px) 44vw, 270px",
    where:"/sell 01 기기 카드 — 기타 기기", min:[400,400], ratio:[0.85,1.4], maxKB:330,
    note:"워치 + 무선 이어폰. ⚠️ 특정 제조사가 드러나지 않아야 합니다 · **배경 투명**" },

  { key:"biz-sell", sizes:"(max-width:600px) 72px, 84px",
    where:"(지금 안 나옴) 메인 사업 배너 — 내 폰 팔기", min:[200,200], ratio:[0.9,1.15], maxKB:40,
    note:"손에 든 휴대폰 또는 택배 상자 하나. ⚠️ 제조사 상표 · 상호가 읽히면 안 됩니다" },
  { key:"biz-shop", sizes:"(max-width:600px) 72px, 84px",
    where:"(지금 안 나옴) 메인 사업 배너 — 중고폰 구매", min:[200,200], ratio:[0.9,1.15], maxKB:40,
    note:"포장을 푼 기기 또는 쇼핑백. ⚠️ 상표 · 상호가 읽히면 안 됩니다" },
  { key:"biz-bid", sizes:"(max-width:600px) 72px, 84px",
    where:"(지금 안 나옴) 메인 사업 배너 — 업체 경쟁입찰", min:[200,200], ratio:[0.9,1.15], maxKB:40,
    note:"견적서 · 숫자 비교가 보이는 장면. ⚠️ **금액을 읽을 수 있게 찍지 마세요** (지어낸 값이 됩니다)" },
  { key:"biz-export", sizes:"(max-width:600px) 72px, 84px",
    where:"(지금 안 나옴) 메인 사업 배너 — 기업 · 수출", min:[200,200], ratio:[0.9,1.15], maxKB:40,
    note:"상자 여러 개 또는 팔레트. ⚠️ 상호 · 국기 · 특정 국가가 드러나면 안 됩니다 (거래 절차가 아직 없습니다)" }
];

window.WOW_PHOTOS = {
  "dev-iphone": { src:"/img/dev-iphone.png?v=355b70a9",
    w:414, h:482,
    webp:"/img/dev-iphone.webp?v=d5a124d2 414w",
    alt:"앞면과 뒷면을 함께 보여 주는 검정 스마트폰. 뒷면 왼쪽 위에 렌즈 셋이 모여 있습니다" },
  "dev-galaxy": { src:"/img/dev-galaxy.png?v=4ac94913",
    w:449, h:502,
    webp:"/img/dev-galaxy.webp?v=162bb06d 449w",
    alt:"앞면과 뒷면을 함께 보여 주는 검정 스마트폰과 그 옆에 놓인 스타일러스 펜" },
  "dev-tablet": { src:"/img/dev-tablet.png?v=8d4a679b",
    w:479, h:522,
    webp:"/img/dev-tablet.webp?v=cc7202e7 479w",
    alt:"앞면과 뒷면을 함께 보여 주는 검정 태블릿" },
  "dev-etc": { src:"/img/dev-etc.png?v=922c22ec",
    w:540, h:422,
    webp:"/img/dev-etc.webp?v=d8ce29c4 540w",
    alt:"검정 스마트워치와 충전 케이스에 담긴 무선 이어폰" }
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

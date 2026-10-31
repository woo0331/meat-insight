

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

  { key:"svc-sell", sizes:"(max-width:1199px) 31vw, 186px",
    where:"메인 02 핵심 서비스 — 내 폰 판매", min:[320,156], ratio:[2.0,2.1], maxKB:60,
    note:"검정 스마트폰 둘 앞에 금화가 쌓인 그림. ⚠️ 바탕은 카드와 같은 #FDF6ED" },
  { key:"svc-buy", sizes:"(max-width:1199px) 31vw, 186px",
    where:"메인 02 핵심 서비스 — 중고폰 구매", min:[320,156], ratio:[2.0,2.1], maxKB:60,
    note:"주황 쇼핑백과 그 뒤로 늘어선 스마트폰. ⚠️ 바탕은 카드와 같은 #FDF6ED" },
  { key:"svc-repair", sizes:"(max-width:1199px) 31vw, 186px",
    where:"메인 02 핵심 서비스 — 수리 서비스", min:[320,156], ratio:[2.0,2.1], maxKB:60,
    note:"화면이 깨진 스마트폰과 수리 공구. ⚠️ 바탕은 카드와 같은 #FDF6ED" },
  { key:"svc-b2b", sizes:"(max-width:1199px) 31vw, 186px",
    where:"메인 02 핵심 서비스 — B2B 도매 · 경매", min:[320,156], ratio:[2.0,2.1], maxKB:60,
    note:"나무 경매 망치와 늘어선 스마트폰. ⚠️ 바탕은 카드와 같은 #FDF6ED" },
  { key:"svc-corp", sizes:"(max-width:1199px) 31vw, 186px",
    where:"메인 02 핵심 서비스 — 기업 대량 매입", min:[320,156], ratio:[2.0,2.1], maxKB:60,
    note:"사무용 건물들과 그 앞에 놓인 스마트폰. ⚠️ 바탕은 카드와 같은 #FDF6ED" },
  { key:"svc-export", sizes:"(max-width:1199px) 31vw, 186px",
    where:"메인 02 핵심 서비스 — 해외 수출", min:[320,156], ratio:[2.0,2.1], maxKB:60,
    note:"소포 상자와 지구본, 그 위를 지나는 비행기. ⚠️ 바탕은 카드와 같은 #FDF6ED" },

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
    alt:"검정 스마트워치와 충전 케이스에 담긴 무선 이어폰" },
  "svc-sell": { src:"/img/svc-sell.jpg?v=598fe425",
    w:320, h:156,
    webp:"/img/svc-sell.webp?v=af5b4548 320w",
    alt:"검정 스마트폰 두 대 앞에 금화가 여러 더미로 쌓여 있는 그림" },
  "svc-buy": { src:"/img/svc-buy.jpg?v=ff39889a",
    w:320, h:156,
    webp:"/img/svc-buy.webp?v=c78874fe 320w",
    alt:"주황색 쇼핑백과 그 뒤로 색이 다른 스마트폰 넉 대가 늘어서 있는 그림" },
  "svc-repair": { src:"/img/svc-repair.jpg?v=52f7eaa9",
    w:320, h:156,
    webp:"/img/svc-repair.webp?v=cdf92b1a 320w",
    alt:"화면이 깨진 스마트폰과 그 옆에 놓인 수리 공구들" },
  "svc-b2b": { src:"/img/svc-b2b.jpg?v=764d5bda",
    w:320, h:156,
    webp:"/img/svc-b2b.webp?v=dbd3b69e 320w",
    alt:"나무 경매 망치와 그 옆에 나란히 선 스마트폰 석 대" },
  "svc-corp": { src:"/img/svc-corp.jpg?v=fc57381e",
    w:320, h:156,
    webp:"/img/svc-corp.webp?v=fbd7a12b 320w",
    alt:"파란 사무용 건물들 앞에 검정 스마트폰 여러 대가 놓인 그림" },
  "svc-export": { src:"/img/svc-export.jpg?v=d26174c3",
    w:320, h:156,
    webp:"/img/svc-export.webp?v=9f487c4f 320w",
    alt:"소포 상자와 파란 지구본, 그 위를 지나가는 비행기" }
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

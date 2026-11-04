/* ════════════════════════════════════════════════════════════════════
   사진 자리 — 2026-11-03

   ⚠️⚠️ **지금 한 장도 없습니다.** 비어 있어도 화면은 멀쩡합니다 —
   사진이 없으면 **글이 주인공인 짜임새**로 갑니다 (`amPhoto()` 가
   null 을 돌려주고, 화면이 그것을 보고 갈라집니다).

   ⚠️⚠️ **"이미지 준비 중" 같은 자리표시자를 찍지 마세요.** 빈 회색
   칸이 보이면 그 순간 미완성 사이트로 읽힙니다 (절대 규칙 2).

   ⚠️⚠️ **사람 얼굴이 알아볼 만큼 크게 나온 사진을 쓰지 마세요.**
   초상권이고, AI 가 만든 얼굴이면 **없는 사람을 우리 손님처럼**
   보이게 하는 것입니다 (절대 규칙 1 과 같은 자리). 뒷모습 · 실루엣 ·
   손 · 장비 · 공간으로 갑니다.

   ⚠️⚠️ **특정 브랜드의 로고 · 상표가 보이는 사진을 쓰지 마세요.**
   우리가 그 브랜드와 제휴한 것처럼 읽힙니다.

   ⚠️ 자리를 늘리실 때는 **여기만** 고치면 됩니다. 규격(최소 크기 ·
   비율 · 용량)은 `AM_PHOTO_SLOTS` 한 곳에 있고 `tools/check-photos.js`
   가 **파일을 실제로 열어** 맞춰 봅니다 — 이름을 한 글자 틀리면 그냥
   안 나오고 에러도 안 납니다.
   ════════════════════════════════════════════════════════════════════ */

/* ── 자리 목록 ───────────────────────────────────────────────────
   ⚠️⚠️ 아래 **액자 크기는 열 폭에서 실제로 재 본 값**입니다
   (2560 ~ 360px). `object-fit:cover` 라 액자보다 넓으면 좌우가,
   좁으면 위아래가 잘립니다 — 그래서 **주인공을 가운데 3분의 1 안에**
   두셔야 합니다.

   | 자리 | 제일 큰 액자 | 제일 좁은 액자 | 비율 폭 |
   |---|---|---|---|
   | hero | 2560 × 458 (5.59) | 360 × 488 (0.74) | 0.74 ~ 5.59 |
   | zone | 356 × 186 (1.91) | 228 × 190 (1.20) | 1.20 ~ 1.91 |

   ⚠️ hero 는 비율이 **0.74 에서 5.59 까지** 움직입니다. 어떤 비율로
   만들어도 어딘가에서는 잘립니다 — 그래서 **가로로 넓게(2:1)** 만들고
   가운데에 주인공을 둡니다. 넓으면 좁은 화면에서 좌우만 잘리고,
   세로로 길면 넓은 화면에서 하늘과 바닥만 남습니다. */
window.AM_PHOTO_SLOTS = [
  { key:"hero",      where:"메인 첫 화면 배경",
    min:[2000, 1000], ratio:[1.6, 2.6], maxKB:320,
    note:"딥그린 막이 위에 깔립니다 — 글자 대비는 막이 책임집니다" },
  /* ⚠️⚠️ 키가 **AM_ZONES 의 key 와 같아야** 합니다 (`js/data/catalog.js`).
     한 글자 틀리면 그 카드만 조용히 사진 없이 나옵니다 —
     `tools/check-photos.js` 가 그 짝을 맞춰 봅니다. */
  { key:"zone-learn", where:"메인 '골프 배우기' 카드",
    min:[1000, 560], ratio:[1.5, 2.2], maxKB:180 },
  { key:"zone-trade", where:"메인 '골프 사고팔기' 카드",
    min:[1000, 560], ratio:[1.5, 2.2], maxKB:180 },
  { key:"zone-play", where:"메인 '골프 즐기기' 카드",
    min:[1000, 560], ratio:[1.5, 2.2], maxKB:180 },
  { key:"zone-biz", where:"메인 '골프 비즈니스 · 소통' 카드",
    min:[1000, 560], ratio:[1.5, 2.2], maxKB:180 },

  /* ── 분류 카드 열 장 (3차 시안) ────────────────────────────────
     ⚠️⚠️ 키가 **AM_CATS 의 key 와 같아야** 합니다 (`js/data/catalog.js`).
     한 글자 틀리면 그 카드만 조용히 사진 없이 나옵니다 —
     `tools/check-photos.js` 가 그 짝을 맞춰 봅니다.
     ⚠️ 액자는 작습니다 (제일 큰 폭에서 236 x 132 · 폰에서 163 x 92) —
     크게 만드셔도 줄여서 쓰니 **작게 보이는 것**을 고르세요. 멀리
     있는 풍경보다 가까이 찍은 것이 낫습니다. */
  { key:"cat-lesson",    where:"분류 카드 '골프 레슨'",
    min:[800, 450], ratio:[1.4, 2.0], maxKB:140 },
  { key:"cat-used",      where:"분류 카드 '중고 골프장터'",
    min:[800, 450], ratio:[1.4, 2.0], maxKB:140 },
  { key:"cat-booking",   where:"분류 카드 '골프장 부킹'",
    min:[800, 450], ratio:[1.4, 2.0], maxKB:140 },
  { key:"cat-matchup",   where:"분류 카드 '골프 조인'",
    min:[800, 450], ratio:[1.4, 2.0], maxKB:140 },
  { key:"cat-range",     where:"분류 카드 '골프 연습장'",
    min:[800, 450], ratio:[1.4, 2.0], maxKB:140 },
  { key:"cat-market",    where:"분류 카드 '골프용품 마켓'",
    min:[800, 450], ratio:[1.4, 2.0], maxKB:140 },
  { key:"cat-fitting",   where:"분류 카드 '피팅 · 수리'",
    min:[800, 450], ratio:[1.4, 2.0], maxKB:140 },
  { key:"cat-travel",    where:"분류 카드 '골프 여행'",
    min:[800, 450], ratio:[1.4, 2.0], maxKB:140 },
  { key:"cat-career",    where:"분류 카드 '골프 인력 · 비즈니스'",
    min:[800, 450], ratio:[1.4, 2.0], maxKB:140 },
  { key:"cat-community", where:"분류 카드 '골프 커뮤니티'",
    min:[800, 450], ratio:[1.4, 2.0], maxKB:140 },

  /* ── 띠 둘 (3차 시안) ──────────────────────────────────────────
     ⚠️⚠️ **글자가 얹히는 쪽을 비워 두셔야 합니다.** 매칭 띠는 **왼쪽
     55%** 에 검은 글자가, 입점 띠는 **왼쪽 55%** 에 글자가 앉습니다 —
     그 쪽이 복잡하면 글이 안 읽힙니다 (막을 깔지 않는 자리라
     사진이 그대로 보입니다). */
  { key:"match-banner",   where:"메인 '한 번에 견적 · 매칭' 띠 (오른쪽 사진)",
    min:[2000, 800], ratio:[2.2, 2.8], maxKB:300,
    note:"왼쪽 55% 는 밝고 단순하게 — 검은 글자가 그 위에 앉습니다" },
  { key:"partner-banner", where:"메인 맨 아래 '업체 입점' 띠",
    min:[2000, 480], ratio:[3.4, 4.6], maxKB:250,
    note:"왼쪽 55% 는 밝고 단순하게 — 검은 글자가 그 위에 앉습니다" }
];

/* ── 넣은 사진 ───────────────────────────────────────────────────
   ⚠️ 한 장 넣으실 때마다 `alt` 를 **반드시** 같이 적으세요. 비면
   `tools/check-a11y.js` 가 빌드에서 멈춥니다 (그게 맞습니다 — 소리로
   듣는 분께는 그 글이 사진입니다).
   ⚠️ `alt` 에 "이미지" · "사진" 이라고 쓰지 마세요. **무엇이 보이는지**
   적습니다.

   보기 —
     "hero": { src:"/img/hero.jpg", alt:"해 질 녘 페어웨이와 카트 길" }
   ════════════════════════════════════════════════════════════════ */
/* ⚠️⚠️⚠️ **경로가 둘입니다 — 일부러 갈라 두었습니다.**

     /img/…        원본 품질입니다 (따로 만든 사진). 그대로 씁니다.
     /img/mock/…   **시안 스크린샷에서 뽑아 늘린 것**입니다. 규격은
                   맞지만 원본 해상도가 아니라 **크게 보면 뿌옇습니다.**
                   원본 사진이 생기면 **그 파일만** /img/ 로 옮기고
                   아래 경로에서 `mock/` 만 지우면 끝입니다.

   ⚠️ 왜 갈라 두는가 — 한 폴더에 섞어 두면 **어느 것이 임시인지 아무도
   모릅니다.** 화면 코드에도 그대로 드러나야 다음 사람이 알아봅니다.
   ⚠️ 원본은 `img/raw/` 에 있고 `node tools/fit-photos.js` 가 그것을
   읽어 규격에 맞춥니다 (손으로 자르지 마세요).

   ⚠️⚠️ **아직 사람 눈으로 확인하셔야 하는 것 둘** (도구가 못 잡습니다) —
     · `cat-market` 상자에 **금색 글자**가 보입니다 (AI 가 만든 글자라
       읽히지는 않지만 글자꼴입니다). 규칙은 "글자 없음" 입니다.
     · `match-banner` 의 골프공에 **방패 로고**가 박혀 있습니다. 사진
       안에 있어 나중에 못 바꿉니다 — 그 로고를 브랜드로 쓰실지
       정하신 뒤에 두세요.

   ⚠️ `img/hold/biz-01~04.jpg` 는 **아무 데서도 안 씁니다.** 시안의
   "신규 입점업체" 예시 사진인데, 그 자리에 쓰면 없는 업체 넷을
   광고하는 것입니다 (절대 규칙 1). 실제 업체가 승인되면 그 업체의
   사진으로 채워집니다. */
window.AM_PHOTOS = {
  /* ── 원본 품질 ─────────────────────────────────────────────── */
  "hero":        { src:"/img/hero.jpg",
                   alt:"해 질 녘 골프장 페어웨이와 카트 길" },
  "zone-learn":  { src:"/img/zone-learn.jpg",
                   alt:"실내 연습장에서 스윙하는 골퍼의 뒷모습" },
  "zone-trade":  { src:"/img/zone-trade.jpg",
                   alt:"장갑 낀 손이 아이언 헤드를 손질하는 모습" },
  "zone-play":   { src:"/img/zone-play.jpg",
                   alt:"공이 놓인 넓은 페어웨이와 벙커" },
  "zone-biz":    { src:"/img/zone-biz.jpg",
                   alt:"창가 테이블에 마주 앉아 이야기하는 두 사람" },

  /* ── 시안에서 뽑아 늘린 것 (원본이 생기면 교체) ──────────────── */
  "cat-lesson":    { src:"/img/mock/cat-lesson.jpg",
                     alt:"해 질 녘 스윙을 마친 골퍼의 실루엣" },
  "cat-used":      { src:"/img/mock/cat-used.jpg",
                     alt:"잔디 위에 놓인 아이언과 우드 헤드" },
  "cat-booking":   { src:"/img/mock/cat-booking.jpg",
                     alt:"연못과 산이 보이는 골프장 페어웨이" },
  "cat-matchup":   { src:"/img/mock/cat-matchup.jpg",
                     alt:"골프백을 메고 함께 걸어가는 골퍼 셋의 뒷모습" },
  "cat-range":     { src:"/img/mock/cat-range.jpg",
                     alt:"대형 스크린이 있는 실내 골프 연습장 타석" },
  "cat-market":    { src:"/img/mock/cat-market.jpg",
                     alt:"잔디 위에 놓인 골프공과 포장 상자" },
  "cat-fitting":   { src:"/img/mock/cat-fitting.jpg",
                     alt:"피팅 장비에 물려 있는 클럽 헤드" },
  "cat-travel":    { src:"/img/mock/cat-travel.jpg",
                     alt:"야자수와 바다가 보이는 해외 골프 리조트" },
  "cat-career":    { src:"/img/mock/cat-career.jpg",
                     alt:"정장 차림의 두 사람이 악수하는 모습" },
  "cat-community": { src:"/img/mock/cat-community.jpg",
                     alt:"말풍선이 뜬 초록 화면의 휴대전화를 든 손" },
  "match-banner":  { src:"/img/mock/match-banner.jpg",
                     alt:"잔디 위에 놓인 골프공 클로즈업" },
  "partner-banner":{ src:"/img/mock/partner-banner.jpg",
                     alt:"나무가 늘어선 맑은 날의 골프장 잔디" }
};

/* 한 자리의 사진 — ⚠️ 없으면 **null** 입니다 (빈 객체가 아닙니다).
   화면이 `if(!p)` 로 갈라서 글 짜임새로 갑니다. */
/* ════════════════════════════════════════════════════════════════════
   화면 크기마다 **맞는 크기**로 내보내기 (srcset)

   ⚠️⚠️⚠️ **없는 또렷함을 만들어 낼 수는 없습니다.** 여기서 하는 일은
   둘입니다 —
     ① 작게 쓰는 자리에 **미리 줄여 둔 파일**을 줍니다. 브라우저가
        800px 그림을 108px 로 욱여넣는 것보다 또렷합니다.
     ② 폰이 PC 용 큰 파일을 안 받게 합니다 (히어로 307KB → 60KB).
   ⚠️ **원본보다 크게 만들지 않습니다** — 늘리면 용량만 커집니다.
   더 또렷해지려면 **원본 사진**이 와야 합니다 (img/README.md).

   ⚠️⚠️ **이 표가 한 곳**입니다. `tools/make-sizes.js` 가 이것을 읽어
   파일을 만들고, `tools/check-photos.js` 가 그 파일이 실제로 있는지
   봅니다 — 폭을 두 곳에 적으면 한쪽만 고치는 날 **srcset 이 없는
   파일을 가리킵니다** (404 가 나고 브라우저는 조용히 원본을 씁니다).

   칸
     w · h   원본의 가로 · 세로 (화면이 자리를 미리 잡는 데 씁니다 —
             안 적으면 그림이 올 때 글이 밀립니다)
     make    만들 폭들 — ⚠️ 원본보다 큰 값은 저절로 빠집니다
     sizes   브라우저에게 **얼마나 크게 그릴지** 알려 줍니다
             ⚠️ 이것이 틀리면 폰이 PC 용 파일을 받습니다 (실제로 재서
             적었습니다 · tools 로 그려지는 폭을 재 보세요)
     키 끝의 `*` 는 접두사입니다 (zone-learn · cat-lesson …)
   ════════════════════════════════════════════════════════════════════ */
window.AM_PHOTO_SIZES = {
  /* ⚠️⚠️ `sizes` 는 **재서 적은 값**입니다 (360 · 390 · 430 · 768 ·
     1000 · 1280 · 1440px 에서 실제로 그려지는 폭을 쟀습니다).
     넉넉하게 적으면 폰이 PC 용 파일을 받고, 짜게 적으면 뿌옇습니다. */
  "hero":           { w:2400, h:1200, make:[900, 1200, 1400, 1900], sizes:"100vw" },
  "match-banner":   { w:2000, h:800,  make:[700, 1100, 1300, 1600],
                      sizes:"(min-width: 1340px) 1216px, 95vw" },
  "partner-banner": { w:2000, h:480,  make:[700, 1100, 1300, 1600],
                      sizes:"(min-width: 1340px) 1216px, 95vw" },
  /* 묶음 카드 — 1280 이상 넷 · 620~1280 둘 · 그 아래 하나 */
  "zone-*":         { w:1200, h:667,  make:[400, 700],
                      sizes:"(min-width: 1200px) 300px, (min-width: 620px) 48vw, 92vw" },
  /* 분류 카드 — 1340 이상 열 칸(108px) · 그 아래 다섯 칸 · 폰 둘 칸 */
  /* ⚠️ 560 은 **3배 화면 폰**을 위한 것입니다 — 그 자리가 146px 라
     3배면 438px 가 필요한데, 560 이 없으면 800px 원본을 받습니다
     (한 장에 75KB · 열 장이면 750KB). 재 보고 넣었습니다. */
  "cat-*":          { w:800,  h:571,  make:[250, 450, 560],
                      sizes:"(min-width: 1340px) 112px, (min-width: 620px) 22vw, 40vw" }
};

/* 그 자리의 규격 — ⚠️ 접두사(`zone-*`)도 여기서 풉니다 */
window.amPhotoSpec = function(key){
  var S = window.AM_PHOTO_SIZES || {};
  if(S[key]) return S[key];
  var ks = Object.keys(S);
  for(var i = 0; i < ks.length; i++){
    var k = ks[i];
    if(k.slice(-1) === "*" && key.indexOf(k.slice(0, -1)) === 0) return S[k];
  }
  return null;
};

/* 변형 파일 이름 — ⚠️⚠️ **자리 이름이 아니라 원본 파일 이름**에서
   뽑습니다. 자리 이름으로 뽑으면, 그 자리에 **다른 사진을 끼운**
   순간(검사가 씨앗을 넣을 때처럼) srcset 만 옛 사진을 가리켜서
   화면에는 옛 사진이 나오고 src 는 새 사진인 꼴이 됩니다 — 아무
   에러도 없이 **엉뚱한 사진**이 보입니다. */
window.amPhotoSizeSrc = function(src, w){
  var base = String(src).split("?")[0].split("/").pop().replace(/\.[a-z]+$/i, "");
  return "/img/sizes/" + base + "-" + w + ".jpg";
};

/* srcset 한 줄 — ⚠️ 마지막은 **원본**입니다 (제일 큰 화면이 쓸 것)
   ⚠️⚠️ 빌드는 `amPhotoHasSize` 를 끼워 **파일이 실제로 있는지** 봅니다
   (없는 파일을 적으면 404 가 나고 브라우저는 조용히 원본을 씁니다 —
   그러면 폰이 PC 용 파일을 받는데 아무도 모릅니다). */
window.amPhotoSrcset = function(key){
  var sp = window.amPhotoSpec(key);
  var p  = (window.AM_PHOTOS || {})[key];
  if(!sp || !p || !p.src) return "";
  var has = window.amPhotoHasSize;
  var out = (sp.make || []).filter(function(w){ return w < sp.w; })
    .map(function(w){ return window.amPhotoSizeSrc(p.src, w); })
    .filter(function(u){ return has ? has(u) : true; })
    .map(function(u, i, L){
      return u + " " + u.replace(/^.*-(\d+)\.jpg$/, "$1") + "w";
    });
  if(!out.length) return "";          /* 변형이 하나도 없으면 안 답니다 */
  out.push(p.src + " " + sp.w + "w");
  return out.join(", ");
};

/* ⚠️⚠️ **그림 하나를 그리는 자리도 한 곳**입니다. 화면마다 따로
   적으면 한 곳에만 srcset 이 붙고 나머지는 조용히 큰 파일을 받습니다
   (그리고 width · height 를 빠뜨린 자리는 그림이 올 때 글이 밀립니다).
   ⚠️ 배경 장식이라 `alt=""` · `aria-hidden` 입니다 — 글이 주인공인
   자리에서는 이 함수를 쓰지 말고 alt 를 적어 주세요. */
window.amPhotoImg = function(key, o){
  var p = window.amPhoto(key);
  if(!p) return "";
  o = o || {};
  var sp = window.amPhotoSpec(key) || {};
  var ss = window.amPhotoSrcset(key);
  return '<img' + (o.cls ? ' class="' + window.esc(o.cls) + '"' : '') +
    ' src="' + window.esc(p.src) + '"' +
    (ss ? ' srcset="' + window.esc(ss) + '"' : '') +
    (ss && sp.sizes ? ' sizes="' + window.esc(sp.sizes) + '"' : '') +
    ' alt="" aria-hidden="true"' +
    (sp.w ? ' width="' + sp.w + '" height="' + sp.h + '"' : '') +
    (o.eager ? ' fetchpriority="high"' : ' loading="lazy"') +
  '>';
};

window.amPhoto = function(key){
  var p = (window.AM_PHOTOS || {})[key];
  if(!p || !p.src) return null;
  /* ⚠️⚠️ **alt 가 없으면 안 내보냅니다.** 내보내면 접근성 검사가 빌드를
     멈추는데, 그때 사진을 지우는 것보다 여기서 안 내보내는 편이
     낫습니다 — 어느 자리가 빠졌는지 check-photos 가 말해 줍니다. */
  if(!p.alt) return null;
  return p;
};
window.amHasPhoto = function(key){ return !!window.amPhoto(key); };

/* ⚠️⚠️ **적어 두고 안 만든 파일**을 잡으려고, 여기서 `jpg` 칸을
   채워 둡니다 — `tools/check-photos.js` 가 그 칸에 적힌 파일이 실제로
   있는지 봅니다 (없으면 빌드에서 멈춥니다). 손으로 적지 않습니다. */
(function(){
  Object.keys(window.AM_PHOTOS || {}).forEach(function(k){
    var ss = window.amPhotoSrcset(k);
    if(ss) window.AM_PHOTOS[k].jpg = ss;
  });
})();

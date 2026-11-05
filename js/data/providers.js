/* ════════════════════════════════════════════════════════════════════
   업체를 꺼내 쓰는 자리 — 규칙은 **여기 한 곳**입니다

   ⚠️⚠️ 업체 **자료**는 `js/data/providers.generated.js` 에 있고 그것은
   DB 에서 나옵니다 (`tools/pull-providers.js`). 이 파일은 그 자료를
   **어떻게 고르고 어떻게 읽는가**만 정합니다. 둘을 섞지 마세요.

   ⚠️⚠️ **업체가 어느 분류에 뜨는가는 `subs`(하위 키)로 정해집니다.**
   분류 키를 적으면 그 업체만 **조용히 아무 데도 안 뜹니다** — 에러도
   404 도 안 납니다. `build.js` 의 가드가 빌드에서 멈춥니다.

   ⚠️⚠️ **평점 · 후기 수를 값으로 들고 있지 않습니다.** 실제 후기에서
   **계산**합니다 (절대 규칙 1). 그래서 여기에 그런 함수가 없고,
   후기가 생기는 날 그때 **배열에서 세는** 함수를 만듭니다.
   ════════════════════════════════════════════════════════════════════ */

/* ⚠️⚠️ **업체 주소는 여기서만 짓습니다.** 한 글자짜리 p 는 못 씁니다 —
   vercel.json 이 /p/:p* 를 410 으로 보냅니다 (앞 서비스의 업체 주소).
   분류 주소(amCatUrl)와 같은 규칙입니다. */
window.amProviderUrl = function(p){
  var id = (typeof p === "string") ? p : (p && p.id);
  return id ? "/pro/" + id : "/search";
};

/* 전부 — 없으면 빈 배열입니다 (null 을 돌려주지 않습니다) */
window.amProviders = function(){
  return Array.isArray(window.AM_PROVIDERS) ? window.AM_PROVIDERS : [];
};

window.amProvider = function(id){
  var L = window.amProviders();
  for(var i = 0; i < L.length; i++) if(L[i].id === id) return L[i];
  return null;
};

/* 이 업체가 **실제로 하는** 하위 — 목록에 없는 키는 걸러 냅니다.
   ⚠️ 조용히 거르지 않고 빌드 가드가 먼저 잡습니다. 여기서 거르는 것은
   자료가 앞서 나갔을 때 화면이 안 깨지게 하는 안전장치입니다. */
/* ⚠️⚠️⚠️ **업체가 스스로 올린 시설 사진**입니다 (0051). 0건이면 빈
   배열이고, 화면은 그때 **분류 아이콘 타일**로 돌아갑니다.
   ⚠️ 증빙서류는 **한 장도 안 들어옵니다** — 공개 보기
   (`v_provider_photo_public`)에 그 줄이 아예 없습니다.
   ⚠️ 세는 자리는 **여기 하나**입니다 (카드와 업체 화면이 따로 세면
   한쪽만 고쳐서 어긋납니다).
   ⚠️ 주소가 없는 줄은 버립니다 — 깨진 그림을 손님 화면에 걸지
   않습니다 (`providers.generated.js` 가 주소 없이 찍힐 일은 없지만,
   그 파일이 옛것일 수 있습니다). */
window.amProviderPhotos = function(p){
  var L = (p && Array.isArray(p.photos)) ? p.photos : [];
  return L.filter(function(x){ return x && x.url; });
};

window.amProviderSubs = function(p){
  var subs = (p && Array.isArray(p.subs)) ? p.subs : [];
  return subs.filter(function(k){ return !!window.amSub(k); });
};

/* 이 업체가 뜨는 분류들 — ⚠️ **여기서만 셉니다.** 분류 화면과 업체
   화면이 따로 세면 한쪽만 고쳐서 어긋납니다. */
window.amProviderCats = function(p){
  var keys = {}, out = [];
  window.amProviderSubs(p).forEach(function(k){
    var f = window.amSub(k);
    if(f && !keys[f.cat.key]){ keys[f.cat.key] = 1; out.push(f.cat); }
  });
  return out;
};

/* 한 분류에 뜨는 업체들 — sub 를 주면 그 하위만 */
window.amProvidersOf = function(catKey, subKey){
  return window.amProviders().filter(function(p){
    var subs = window.amProviderSubs(p);
    if(subKey) return subs.indexOf(subKey) >= 0;
    return subs.some(function(k){
      var f = window.amSub(k);
      return f && f.cat.key === catKey;
    });
  });
};

/* 지역 이름 — ⚠️ 키가 아니라 **사람이 읽는 이름**입니다.
   regions.js 가 없으면 키를 그대로 돌려줍니다 (조용히 빈 칸이 되지
   않게 — 빈 칸이면 아무도 어긋난 것을 모릅니다). */
window.amProviderRegions = function(p){
  var L = (p && Array.isArray(p.regions)) ? p.regions : [];
  return L.map(function(k){
    var r = window.amRegion ? window.amRegion(k) : null;
    return (r && r.name) ? r.name : k;
  });
};

/* 거래 규모 — 0023 의 scale (small · mid · large).
   ⚠️ 없으면 **null** 입니다. "(미기재)" 를 찍지 않습니다. */
window.AM_SCALE = { small:"소규모", mid:"중간 규모", large:"대규모" };
window.amProviderScale = function(p){
  var s = p && p.scale;
  return (s && window.AM_SCALE[s]) ? window.AM_SCALE[s] : null;
};

/* 상담 방식 (0044) — ⚠️⚠️ **말은 여기 한 곳**입니다. 화면마다 따로
   적으면 한쪽만 고쳐서 "전화상담" 과 "전화" 가 섞입니다.
   ⚠️ 0건이면 **빈 배열**입니다 — 화면은 그때 그 줄을 뺍니다
   ("미정" 을 찍지 않습니다 · 절대 규칙 2). */
window.AM_CONTACT_WAYS = [
  { key:"phone",  name:"전화 상담" },
  { key:"visit",  name:"방문 상담" },
  { key:"online", name:"온라인 상담" },
  { key:"shop",   name:"매장 방문" }
];
window.amContactWays = function(p){
  var L = (p && Array.isArray(p.contact_ways)) ? p.contact_ways : [];
  return L.map(function(k){
    var f = window.AM_CONTACT_WAYS.filter(function(x){ return x.key === k; })[0];
    return f ? f.name : k;
  });
};

/* 취급 브랜드 — 업체가 적은 글자 그대로입니다 (esc() 는 화면이 합니다) */
window.amProviderBrands = function(p){
  return (p && Array.isArray(p.brands)) ? p.brands : [];
};

/* 확인된 것 — ⚠️ **플랫폼이 서류를 본 것만** 들어 있습니다.
   업체가 스스로 켤 수 없습니다 (provider_guard 트리거). */
window.AM_VERIFIED = {
  brn:   "사업자등록 확인",
  tel:   "연락처 확인",
  place: "사업장 확인"
};
window.amProviderVerified = function(p){
  var v = (p && p.verified && typeof p.verified === "object") ? p.verified : {};
  return Object.keys(window.AM_VERIFIED)
    .filter(function(k){ return v[k]; })
    .map(function(k){ return window.AM_VERIFIED[k]; });
};

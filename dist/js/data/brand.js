

window.AM_BRAND = {

  name:    "폰웨이",

  ko:      "폰웨이",

  en:      "PHONEWAY",

  logo:    "",

  sub:     "중고폰 통합 거래 플랫폼",

  slogan:  "내 폰의 가치를 찾는 새로운 방법.",

  desc:    "중고폰 직접 매입부터 전국 전문업체 최고가 견적 비교, 검수를 마친 " +
           "중고폰 구매까지 한 곳에서."
};

window.amBrand = function(){ return (window.AM_BRAND || {}).name || ""; };

window.amBrandKo = function(){
  var b = window.AM_BRAND || {}; return b.ko || b.name || ""; };

window.amTitle = function(pageTitle, route){
  var B = window.AM_BRAND || {};
  var name = B.name || "", sub = B.sub || "";
  if(route === "/") return name + " | " + (pageTitle || "");
  return (pageTitle ? pageTitle + " · " : "") + name + " · " + sub;
};

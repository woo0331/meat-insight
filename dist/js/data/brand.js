

window.AM_BRAND = {

  name:    "인수인계",

  ko:      "인수인계",

  en:      "STOREWAY",

  logo:    "",

  sub:     "창업의 시작부터 새로운 시작까지",

  slogan:  "자영업의 모든 순간을 연결합니다.",

  desc:    "창업, 매장 운영, 인수 · 양도, 폐업에 필요한 정보와 업체, 비용, " +
           "체크리스트를 한 곳에서 확인하세요."
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

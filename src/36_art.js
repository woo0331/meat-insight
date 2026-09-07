/* ════════════════════════════════════════════════════════════════════
   그림 — 아이콘·빈 자리·표지

   아이콘이 전부 굵기 하나짜리 선이라 도면처럼 보였습니다. 사진이 없는
   업체 카드의 그림 자리는 그냥 옅은 색 덩어리라 "이미지 깨진 자리"
   같았고, 빈 화면에는 아무 그림도 없었습니다.

   새로 그리지 않고, 이미 있는 선 그림에 **면(silhouette)을 한 겹**
   깔아 두 톤으로 만듭니다. 선은 그대로라 아이콘이 바뀌지 않고
   무게감만 생깁니다.

   바깥 <svg> 에 fill="none" 이 박혀 있지만, 면 레이어에 건 CSS(.du-f)가
   상속보다 우선하므로 그대로 칠해집니다.
   ════════════════════════════════════════════════════════════════════ */

/* 카테고리별 면 — 기존 선 그림에서 바깥 윤곽만 골라 재사용합니다 */
var ART_SIL={
  meat:   '<path d="M4.6 13.4c-.6-4.2 2.6-7.9 6.9-8.2 4.1-.3 7.6 2.5 7.9 6.4.3 4.3-3.1 7.7-7.4 7.7-3.8 0-6.9-2.4-7.4-5.9z"/>',
  process:'<path d="M3 21V10l6 4V10l6 4V6l6 3v12z"/>',
  logi:   '<path d="M2 6h11v10H2z"/><path d="M13 9h4l3 3v4h-7z"/>',
  labor:  '<circle cx="9" cy="8" r="3"/><circle cx="17.5" cy="9" r="2.2"/>',
  job:    '<rect x="3" y="7" width="18" height="13" rx="2"/>',
  equip:  '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/>',
  startup:'<path d="M4 20V9l8-4 8 4v11z"/>',
  haccp:  '<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/>'
};

function artDuo(key, strokes){
  var sil=ART_SIL[key];
  return (sil ? '<g class="du-f">'+sil+'</g>' : '')+'<g class="du-s">'+strokes+'</g>';
}

function patchArt(){
  if(G._art) return; G._art=true;

  /* ── 카테고리 아이콘 (홈 8분야·요청서 분야 고르기) ── */
  var origIcon=window.cat8Icon;
  if(typeof origIcon==="function"){
    window.cat8Icon=function(c, sz){
      if(!c || !c.ico) return origIcon.apply(this, arguments);
      var s=sz||24;
      return '<svg class="du" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" '+
        'stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+
        artDuo(c.k, c.ico)+'</svg>';
    };
  }

  /* ── 업체 카드의 그림 자리 ──
     supIconFor 는 12_redesign 안의 지역 함수라 window 로는 못 감쌉니다.
     지역 바인딩을 직접 바꿉니다. */
  if(typeof supIconFor==="function"){
    var origSup=supIconFor;
    supIconFor=function(s){
      var strokes=origSup.apply(this, arguments);
      var k=(s&&s.category_mains&&s.category_mains[0]) ||
            ((s&&s.cats&&s.cats.length&&typeof key8Of==="function")?key8Of(s.cats[0]):null) ||
            ((s&&s.categories&&s.categories.length&&typeof key8Of==="function")?key8Of(s.categories[0]):null) ||
            "process";
      return artDuo(k, strokes);
    };
  }

  /* 홈 8분야 타일은 페이지가 뜨자마자 한 번 그려지고 끝입니다 —
     감싸기 전에 그려진 것이라 다시 한 번 그려 줍니다. */
  if(typeof window.renderCat8Grid==="function"){ try{ window.renderCat8Grid(); }catch(e){} }

  /* 사진이 없는 그림 자리에 분야를 표시해 두면 CSS 가 결에 맞는 바탕을 깝니다 */
  artPaintSlots();
  var origSC=window.mkSC;
  if(typeof origSC==="function"){
    window.mkSC=function(s){
      var el=origSC.apply(this, arguments);
      try{
        var slot=el && el.querySelector && el.querySelector(".sc2-ic");
        if(slot && !slot.style.backgroundImage){
          var k=(s.category_mains&&s.category_mains[0]) ||
                ((s.cats&&s.cats.length&&typeof key8Of==="function")?key8Of(s.cats[0]):null) || "process";
          slot.setAttribute("data-k", k);
        }
      }catch(e){}
      return el;
    };
  }
}

/* 이미 그려진 카드에도 붙여 줍니다 */
function artPaintSlots(){
  [].slice.call(document.querySelectorAll(".sc2-ic:not([data-k])")).forEach(function(el){
    if(el.style.backgroundImage) return;
    el.setAttribute("data-k","process");
  });
}

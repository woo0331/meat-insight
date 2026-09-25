/* ════════════════════════════════════════════════════════════════════
   사진 자리 — 지시서 32번

   이 사이트는 **고기를 파는 곳이 아니라 사업자를 위한 서비스**입니다.
   그래서 접시에 담긴 고기 사진이 아니라 **실제 고깃집 · 정육점 · 주방 ·
   덕트 · 쇼케이스 · 사장 · 작업현장** 사진을 씁니다.
   사람과 사업장 사진의 비중을 높이세요.

   ⚠️ **AI 티가 강한 고기 사진을 남발하지 마세요** (지시서 32번).
   ⚠️ **글자가 박힌 이미지를 쓰지 마세요.** AI 가 만든 한글은 글자가
      틀려 있고, 틀린 글자는 고칠 수도 없습니다.

   ── 지금은 사진이 한 장도 없습니다 ──────────────────────
   그래서 `WOW_PHOTOS` 가 비어 있고, 화면은 사진 자리를 **빈 액자**로
   둡니다. 가짜 이미지나 "이미지 준비 중" 글자를 넣지 않습니다 —
   자리표시자를 찍으면 그 순간 미완성 사이트로 읽힙니다 (절대 규칙 2).

   사진이 생기면 아래에 한 줄씩 적으면 그 자리에 저절로 들어갑니다.
   파일은 /img/ 에 두고 경로는 **절대 경로**로 씁니다.

     "hero": { src:"/img/hero-butcher.jpg",
               alt:"정육점에서 고기를 손질하는 사장님" }

   ⚠️ `alt` 는 **사진에 무엇이 찍혀 있는지**를 적습니다. "고깃집 사진"
   같은 말은 눈이 불편한 손님에게 아무것도 알려 주지 않습니다.
   ⚠️ 뒤에 글자를 얹는 사진(hero · final)은 `dark:true` 를 주세요 —
   어두운 겹을 깔아 글자가 읽히게 합니다.
   ════════════════════════════════════════════════════════════════════ */

window.WOW_PHOTOS = {
  /* 아직 없습니다. 위 주석의 모양대로 채우세요.
     쓰는 자리(키)는 다음과 같습니다 —
       hero           메인 첫 화면 바탕
       sit-start · sit-run · sit-solve · sit-grow · sit-exit   상황 다섯 카드
       cat-meat · cat-space · cat-equip · cat-ops · cat-grow · cat-pro
                      "고기 장사에 필요한 모든 것" 여섯 칸
       worry          "요즘 어떤 고민이 있으세요?" 옆
       partner        파트너 모집 띠
       final          마지막 CTA 바탕 */
};

/* 사진 한 장. 없으면 null 입니다 — 화면이 알아서 빈 액자로 둡니다. */
window.wowPhoto = function(key){
  var p = (window.WOW_PHOTOS || {})[key];
  return (p && p.src) ? p : null;
};

/* ── 사진 자리 ──────────────────────────────────────────────
   있으면 <img>, 없으면 **빈 액자**입니다.
   ⚠️ 없을 때 `alt` 를 단 빈 칸을 만들지 않습니다. 읽어 주는 프로그램이
   "정육점에서 고기를 손질하는 사장님" 이라고 읽어 주는데 실제로는
   아무것도 없으면, 그건 없는 것보다 나쁩니다. aria-hidden 으로 둡니다. */
window.photoBox = function(key, cls){
  var c = "ph" + (cls ? " " + cls : "");
  var p = wowPhoto(key);
  if(!p) return '<div class="' + c + ' ph-none" aria-hidden="true"></div>';
  return '<img class="' + c + '" src="' + esc(p.src) + '" alt="' + esc(p.alt || "") + '"' +
    ' loading="lazy" decoding="async">';
};

/* 사진이 있는가. 화면은 이걸 보고 **짜임새 자체를 바꿉니다.**
   ⚠️ 빈 액자를 크게 두면 "사진 못 넣은 사이트" 로 보입니다. 사진이
   없을 때는 액자를 키우는 대신 **글이 주인공인 짜임새**로 갑니다.
   사진이 들어오면 그때 사진이 주인공인 짜임새로 저절로 바뀝니다. */
window.hasPhoto = function(key){ return !!wowPhoto(key); };

/* 글자를 얹는 바탕 사진. 없으면 어두운 면으로 둡니다. */
window.photoBg = function(key){
  var p = wowPhoto(key);
  if(!p) return "";
  return '<img class="ph-bg" src="' + esc(p.src) + '" alt="" aria-hidden="true"' +
    ' decoding="async">';
};

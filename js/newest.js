/* ════════════════════════════════════════════════════════════════════
   중고장터 최신 등록 — 메인 (DB 는 0056 · 지시서 A-7)

   ⚠️⚠️⚠️ **매물을 지어내지 않습니다.** 올라온 것이 0건이면 이 구간을
   **통째로 치웁니다** — 시안의 "드라이버 380,000원" 같은 카드는 그림이고,
   그것을 실제 데이터로 쓰는 것은 표시 · 광고의 공정화에 관한 법률
   제3조입니다 (지시서 최우선 원칙).

   ⚠️⚠️⚠️ **빈 띠를 남기지 않습니다.** 감싼 구간에는 빌드가 찍어 둔 제목과
   설명이 남아 있어서, 설정이 없거나 0건이면 "중고 골프장터 최신 등록"
   이라는 **제목만 덩그러니** 보입니다 — 오늘 현황표에서 한 번 낸 꼴이고
   절대 규칙 2 입니다. 그래서 여기서 `<section>` 을 직접 치웁니다
   (`.sec:has(> .wrap > [hidden]:only-child)` 는 제목 상자가 같이 들어
   있어 **못 잡습니다**).

   ⚠️⚠️ **값은 `amLstPrice()` 한 곳**에서 셉니다 — **0 은 "무료로 나눔"**
   이라 `||` 를 쓰면 0원이 사라집니다 (0056 에 적어 둔 그 자리).
   ⚠️ 손님이 적은 글은 **반드시 `esc()`** 를 지납니다 (절대 규칙 4).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("nwlist");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  var N = 6;                      /* 메인에 내는 줄 수 */

  function shut(){
    try{
      var sec = box.closest ? box.closest(".sec") : null;
      if(sec) sec.hidden = true;
    }catch(e){}
  }
  function rgName(k){
    var L = window.AM_REGIONS || [];
    for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
    return String(k || "");
  }
  function subName(k){
    var f = window.amSub ? window.amSub(k) : null;
    return f ? f.name : String(k || "");
  }
  function when(t){
    var d = new Date(String(t || ""));
    if(isNaN(d.getTime())) return "";
    /* ⚠️ 날짜는 **한국 기준**으로 적습니다 (UTC 로 꺼내면 하루 밀립니다) */
    var k = new Date(d.getTime() + 9 * 3600 * 1000);
    return (k.getUTCMonth() + 1) + "." + k.getUTCDate();
  }
  function card(l){
    var price = window.amLstPrice ? window.amLstPrice(l.price) : "";
    return '<a class="nw" href="' + esc(window.amCatUrl(window.amCat("used"))) +
        '?q=' + esc(String(l.id)) + '">' +
      '<span class="nw-t">' + esc(l.title) + '</span>' +
      '<span class="nw-p">' + esc(price) + '</span>' +
      '<span class="nw-m">' +
        '<span>' + esc(subName(l.sub)) + '</span>' +
        '<span>' + esc(rgName(l.region)) + '</span>' +
        (l.ship ? '<span>택배 가능</span>' : '') +
        '<span>' + esc(when(l.created_at)) + '</span>' +
      '</span>' +
    '</a>';
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[newest] 로그인 · 접수가 설정되지 않아 중고 최신 " +
        "등록을 열지 않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      shut();
      return;
    }
    var h = { apikey:a.conf.anonKey };
    if(window.amAuthHeaders) h = Object.assign(h, window.amAuthHeaders());
    return fetch(a.conf.url + "/rest/v1/v_listing_open?select=id,sub,region,ship," +
        "title,price,created_at&order=created_at.desc&limit=" + String(N),
        { headers:h })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(rows){
        /* ⚠️⚠️ 못 읽었으면 **0건이라고 말하지 않습니다** — 그냥 치웁니다
           (0건과 "못 읽었다" 는 다른 말이고, 메인에서 그 차이를 설명할
           자리가 없습니다). */
        if(!rows || !rows.length){ shut(); return; }
        box.hidden = false;
        box.innerHTML = '<div class="nw-grid">' + rows.map(card).join("") + '</div>';
      })
      .catch(function(){ shut(); });
  }).catch(function(){ shut(); });
})();

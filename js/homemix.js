/* 메인 — 골프장터(중고/새상품) · 함께 라운드해요 · 골퍼들의 질문 (최종 시안 · 2026-11-16)
   ════════════════════════════════════════════════════════════════════
   ⚠️⚠️⚠️ **실제 공개 자료만** 그립니다. 시안의 상품 · 가격 · 모집 글 · 질문은 예시이고
   한 줄도 옮겨 적지 않습니다(절대 규칙 1).
     · 중고    `v_listing_open` 의 **판매중**(state=open) 넷 — 예약중 · 팔림 · 가림은 뺍니다
     · 조인    `v_join_open`(모집 중 · 오늘 이후) 셋
     · 질문    `v_cq_public` 의 질문 게시판(cm-ask) 셋
   ⚠️⚠️ **0건과 못 읽음을 갈라** 적습니다 — 0건은 「아직 없습니다 + 올리는 길」,
   못 읽음은 「지금 불러오지 못했습니다 — 0건이라는 뜻이 아닙니다」.
   ⚠️ 설정(Supabase)이 없으면 빌드가 찍어 둔 「갈 길」을 그대로 둡니다.
   ⚠️ 새상품 탭은 빌드가 다 찍어 둡니다(업체가 올린 상품 · `amMkItems`) — 여기서는 탭만 바꿉니다. */
(function(){
  var W = window, d = document;
  var esc = W.esc, icon = W.icon;
  var sec = d.getElementById("hm-mk-used");
  if(!sec) return;

  /* ── 탭 ─────────────────────────────────────────────────────────── */
  var all = d.getElementById("hm-mk-all");
  var tabs = d.querySelectorAll("[data-mktab]");
  function setTab(k){
    tabs.forEach(function(a){
      var on = a.getAttribute("data-mktab") === k;
      a.classList.toggle("on", on);
      if(on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      if(on && all) all.setAttribute("href", a.getAttribute("href"));
    });
    d.querySelectorAll("[data-mkpane]").forEach(function(p){
      p.hidden = p.getAttribute("data-mkpane") !== k;
    });
  }
  tabs.forEach(function(a){
    a.addEventListener("click", function(e){ e.preventDefault(); setTab(a.getAttribute("data-mktab")); });
  });

  function catUrl(k){ var c = W.amCat ? W.amCat(k) : null; return c ? W.amCatUrl(c) : "/categories"; }
  function failHtml(what, href){
    return '<p class="hm-tg-none">' + esc(what) + '을 지금 불러오지 못했습니다 — 0건이라는 뜻이 아닙니다. ' +
      '<a class="hm-link hm-link-d" href="' + esc(href) + '">목록에서 보기' + icon("arrow", 16) + '</a></p>';
  }
  function kday(t){
    var x = new Date(String(t || "") + (String(t || "").length === 10 ? "T00:00:00Z" : ""));
    if(isNaN(x.getTime())) return "";
    var WD = ["일","월","화","수","목","금","토"];
    return (x.getUTCMonth() + 1) + "." + x.getUTCDate() + " (" + WD[x.getUTCDay()] + ")";
  }

  /* ── 중고 카드 — ⚠️ 사진이 없으면 아이콘 타일(남의 사진을 깔지 않습니다) ── */
  function usedCard(conf, l){
    var src = W.amPubUrl && l.thumb ? W.amPubUrl(conf, l.thumb) : "";
    var price = W.amLstPrice ? W.amLstPrice(l.price) : "";
    var cond = W.amLstCondName ? W.amLstCondName(l.cond) : "";
    return '<li class="hm-mkc"><a href="' + esc(catUrl("used") + "?v=" + encodeURIComponent(String(l.id))) + '">' +
      '<span class="hm-mkc-ph">' + (src
        ? '<img src="' + esc(src) + '" alt="" width="320" height="320" loading="lazy" decoding="async">'
        : icon("bag", 32)) + '</span>' +
      '<span class="hm-mkc-b"><span class="hm-mkc-n">' + esc(l.title) + '</span>' +
        (price ? '<b class="hm-mkc-p">' + esc(price) + '</b>' : "") +
        (cond ? '<span class="hm-mkc-c">' + esc(cond) + '</span>' : "") +
      '</span></a></li>';
  }
  function joinRow(j){
    var rg = W.amRegion ? (W.amRegion(j.region) || {}).name : "";
    var href = catUrl("matchup") + "?" + [j.region ? "rg=" + encodeURIComponent(j.region) : "",
      j.play_at ? "d=" + encodeURIComponent(String(j.play_at).slice(0, 10)) : ""].filter(Boolean).join("&");
    var meta = [kday(j.play_at), rg, j.course].filter(Boolean).join(" · ");
    return '<li><a class="hm-tgi" href="' + esc(href) + '">' + icon("people", 18) +
      '<span><b>' + esc(j.title) + '</b>' + (meta ? '<span class="hm-tgi-m">' + esc(meta) + '</span>' : "") +
      '</span>' + icon("arrow", 16) + '</a></li>';
  }
  function qaRow(q){
    return '<li><a class="hm-tgi" href="' + esc(catUrl("community") + "?q=" + encodeURIComponent(String(q.id))) + '">' +
      icon("chat", 18) + '<span><b>' + esc(q.title) + '</b></span>' + icon("arrow", 16) + '</a></li>';
  }

  if(!W.amAuthAsk) return;
  W.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.conf || !a.conf.url) return;   /* ⚠️ 빌드가 찍은 갈 길을 그대로 둡니다 */
    var h = Object.assign({ apikey:a.conf.anonKey }, W.amAuthHeaders ? W.amAuthHeaders() : {});
    function get(path){
      return fetch(a.conf.url + "/rest/v1/" + path, { headers:h }).then(function(r){
        if(!r.ok) throw new Error(path.split("?")[0] + " " + r.status);
        return r.json();
      });
    }
    /* 중고 */
    get("v_listing_open?select=id,title,price,cond,thumb,state&state=eq.open&order=created_at.desc&limit=4")
      .then(function(rows){
        sec.innerHTML = rows.length
          ? '<ul class="hm-mkg">' + rows.map(function(l){ return usedCard(a.conf, l); }).join("") + '</ul>'
          : '<p class="hm-tg-none">아직 판매 중인 중고 매물이 없습니다. ' +
            '<a class="hm-link hm-link-d" href="' + esc(catUrl("used")) + '#lsbox">첫 매물 올리기' + icon("arrow", 16) + '</a></p>';
      }).catch(function(e){
        if(W.amFailLog) W.amFailLog("home/used", e);
        sec.innerHTML = failHtml("중고 매물", catUrl("used"));
      });
    /* 조인 */
    var jn = d.getElementById("hm-jn");
    if(jn) get("v_join_open?select=id,title,region,play_at,course&order=play_at.asc&limit=3")
      .then(function(rows){
        jn.innerHTML = rows.length ? '<ul class="hm-tgl">' + rows.map(joinRow).join("") + '</ul>'
          : '<p class="hm-tg-none">지금 모집 중인 조인이 없습니다. ' +
            '<a class="hm-link hm-link-d" href="' + esc(catUrl("matchup")) + '">조인 모집하기' + icon("arrow", 16) + '</a></p>';
      }).catch(function(e){
        if(W.amFailLog) W.amFailLog("home/join", e);
        jn.innerHTML = failHtml("조인 모집", catUrl("matchup"));
      });
    /* 질문 */
    var qa = d.getElementById("hm-qa");
    if(qa) get("v_cq_public?select=id,title,created_at&cat=eq.cm-ask&order=created_at.desc&limit=3")
      .then(function(rows){
        qa.innerHTML = rows.length ? '<ul class="hm-tgl">' + rows.map(qaRow).join("") + '</ul>'
          : '<p class="hm-tg-none">아직 올라온 질문이 없습니다. ' +
            '<a class="hm-link hm-link-d" href="' + esc(catUrl("community") + "?s=cm-ask") + '">첫 질문 쓰기' + icon("arrow", 16) + '</a></p>';
      }).catch(function(e){
        if(W.amFailLog) W.amFailLog("home/qa", e);
        qa.innerHTML = failHtml("질문", catUrl("community") + "?s=cm-ask");
      });
  }).catch(function(){});
})();

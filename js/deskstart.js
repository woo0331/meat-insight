/* ════════════════════════════════════════════════════════════════════
   업체가 **무엇부터 하면 되는지** — /desk 맨 위 (2026-11-05)

   ⚠️⚠️⚠️ **처음 이어진 사장님이 할 일을 알 길이 없었습니다.** `/desk` 는
   구간 아홉이 평평하게 줄지어 있고(알림 · 배정 · 업체 정보 · 연락처 ·
   담당자 · 사진 · 가격 · 수수료), 목차도 · 차례도 · "이것부터" 도
   없었습니다. 그런데 **손님에게 보이느냐를 가르는 것들이 하필 화면
   맨 아래**에 있습니다 — 가격은 0건이면 카드에서 줄째 빠지고, 사진은
   0장이면 분류 아이콘 타일로 돌아가고, **영업 지역이 비면 요청이
   아예 배정되지 않습니다**(`js/assign.js` 는 분류 + 지역으로 고릅니다).
   사장님은 그 사실을 아무 데서도 못 들었습니다.

   ⚠️⚠️ **다 하셨으면 한 줄도 안 그립니다.** 할 일이 없는데 체크 목록을
   띄우면 그때부터는 치우지 못하는 잔소리입니다 (절대 규칙 2 — 빈
   자리에 자리표시자를 두지 않습니다). `css/app.css` 의
   `.sec:has(> .wrap > [hidden]:only-child)` 가 구간째 걷어 갑니다.

   ⚠️⚠️ **못 하시는 일은 "하세요" 라고 적지 않습니다.** 하시는 일(`subs`)
   은 업체가 못 고칩니다 — 운영자가 정합니다(`save_provider_self` 가
   그 칸을 안 받습니다). 그래서 그 줄만은 **고객센터로 보냅니다**
   (눌러도 아무 일이 안 나는 자리로 보내지 않습니다 · 절대 규칙 5).

   ⚠️ **사진 줄은 버킷이 켜졌을 때만 냅니다.** `PROVIDER_BUCKET` 이
   없으면 사진 상자가 아예 안 그려지는데(0051), 그 자리로 보내면
   빈 곳으로 보내는 것이 됩니다 — `/api/upload` 에 먼저 물어봅니다.

   ⚠️ 세는 값은 **저장하지 않고 셉니다** (절대 규칙 1). 그리고 "몇 개"
   가 아니라 **"있다 · 없다"** 만 말합니다 — 개수를 약속하면 그 숫자가
   또 하나의 규칙이 됩니다.

   ⚠️ 설정이 있어야 열리는 자리라 빌드가 찍은 HTML 만 보는 검사는
   영원히 못 봅니다 — `tools/test-desk.js` 가 직접 눌러 봅니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("dstbox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;

  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json().catch(function(){ return null; }) : null; })
      .catch(function(){ return null; });
  }
  var A = null, PV = null;

  /* ⚠️ 버킷이 켜졌는지 — `js/deskphoto.js` 와 **같은 자리**에 묻습니다
     (꼴이 다르면 한쪽만 고치는 날 조용히 어긋납니다). */
  function bucketOn(){
    return fetch("/api/upload", { headers:{ accept:"application/json" } })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ return !!(d && d.pvPhoto); })
      .catch(function(){ return false; });
  }

  /* ── 처음 사용하시나요? (2026-11-17) ─────────────────────────────────
     ⚠️⚠️ **이 업체가 하는 일(subs)에 맞는 차례만** 냅니다 — 부킹이 아닌 업체에게 「티타임
     올리기」를 안내하면 없는 칸으로 보내는 꼴입니다. 줄마다 **이 화면의 실제 구간**으로
     갑니다(#teebox · #triprobox · #deskbox · #pricebox · #mebox). 그 구간이 화면에 없으면
     (그 분야가 아니라 안 그려졌으면) 그 줄을 빼고 냅니다.
     ⚠️ 무료 · 수수료 · 처리 기간을 약속하지 않습니다. */
  function firstUse(subs){
    var has = function(pre){ return (subs || []).some(function(k){ return String(k).indexOf(pre) === 0; }); };
    var rows = [];
    rows.push(["업체 정보 · 영업 지역", "소개와 영업 지역을 채우시면 그 지역 요청이 배정됩니다.", "#mebox"]);
    if(has("bk-")) rows.push(["티타임 올리기 → 마감", "날짜 · 시각 · 그린피를 올리시면 손님이 예약을 신청합니다. 들어온 신청을 보고 가능하면 확정, 어려우면 거절하시고, 다 찬 자리는 닫으십니다.", "#teebox"]);
    if(has("tr-")) rows.push(["여행 상품 올리기 → 마감", "상품을 올리시면 운영자가 확인한 뒤 공개됩니다. 출발일을 마감하거나 상품을 내리실 수 있습니다.", "#triprobox"]);
    rows.push(["가격 올리기", "하시는 일마다 가격을 올리시면 손님 카드에 나옵니다. 안 올리시면 그 줄이 빠집니다.", "#pricebox"]);
    rows.push(["받은 요청 → 견적", "운영자가 배정한 요청을 수락하시고 견적을 내십니다. 손님이 고르시면 상담 일정을 잡습니다.", "#deskbox"]);
    return rows.filter(function(r){ return document.getElementById(r[2].slice(1)); });
  }
  function firstHtml(rows){
    if(!rows.length) return "";
    return '<div class="dst-first"><h2 class="adm-h">' + icon("info", 19) + '처음 사용하시나요?</h2>' +
      '<ol class="dst-l">' + rows.map(function(r){
        return '<li class="dst-r dst-fr"><span class="dst-t"><b>' + esc(r[0]) + '</b>' +
          '<span class="dst-d">' + esc(r[1]) + '</span></span>' +
          '<a class="btn btn-sm btn-line dst-go" href="' + esc(r[2]) + '">바로 가기</a></li>';
      }).join("") + '</ol>' +
      '<p class="myhint">분야별 자세한 차례는 이용안내에, 막히시면 고객센터에 적어 주세요.</p>' +
      '<p class="dst-more"><a class="btn btn-sm btn-line" href="/guide#pro">이용안내 보기</a> ' +
      '<a class="btn btn-sm btn-line" href="/help">고객센터</a></p></div>';
  }
  var FIRST = "";
  /* ── 접고 다시 여는 길 (2026-11-17) ──────────────────────────────
     ⚠️⚠️ 「처음 사용하시나요?」를 **접을 수 있고, 접힌 뒤에도 「이용방법」 단추로 다시 엽니다.**
     할 일을 다 마치신 분께는 처음부터 접혀 있습니다(치우지 못하는 잔소리를 남기지 않습니다) —
     그래도 단추 하나는 남겨 두어, 나중에 차례를 다시 보실 길이 끊기지 않게 합니다.
     접은 것은 이 브라우저에만 기억합니다(localStorage · 서버에 안 보냅니다). */
  var FOLD_KEY = "dst.fold";
  function folded(){ try{ return localStorage.getItem(FOLD_KEY) === "1"; }catch(e){ return false; } }
  function setFold(v){ try{ if(v) localStorage.setItem(FOLD_KEY, "1"); else localStorage.removeItem(FOLD_KEY); }catch(e){} }
  function openBtn(){
    return '<p class="dst-again"><button type="button" class="btn btn-sm btn-line dst-open" ' +
      'aria-expanded="false">' + icon("info", 17) + '이용방법</button></p>';
  }
  function foldBtn(){
    return '<p class="dst-more"><button type="button" class="btn btn-sm btn-line dst-fold" ' +
      'aria-expanded="true">이 안내 접기</button></p>';
  }
  var LAST = [];
  box.addEventListener("click", function(e){
    var t = e.target && e.target.closest ? e.target : null;
    if(!t) return;
    if(t.closest(".dst-open")){ setFold(false); OPEN = true; paint(LAST); focusFirst(); return; }
    if(t.closest(".dst-fold")){ setFold(true); OPEN = false; paint(LAST);
      var b = box.querySelector(".dst-open"); if(b) b.focus(); }
  });
  function focusFirst(){ var h = box.querySelector(".dst-first h2"); if(h){ h.tabIndex = -1; h.focus(); } }
  var OPEN = false;
  function guide(todo){
    if(!FIRST) return "";
    /* 할 일이 남았으면 펼쳐 두는 것이 기본 · 다 하셨으면 접힌 것이 기본 · 손으로 고른 것이 이깁니다 */
    var show = OPEN || (todo.length && !folded());
    return show ? FIRST.slice(0, -6) + foldBtn() + '</div>' : openBtn();   /* FIRST 는 '</div>' 로 끝납니다 */
  }
  function paint(todo){
    LAST = todo;
    /* ⚠️⚠️ 할 일이 없으면 「먼저 하실 것」은 안 그리고, 이용방법은 **접힌 단추 하나**만 남깁니다 */
    if(!todo.length){
      if(!FIRST){ box.hidden = true; box.innerHTML = ""; return; }
      box.className = "deskbox dst"; box.hidden = false; box.innerHTML = guide(todo); return;
    }

    box.className = "deskbox dst";
    box.hidden = false;
    box.innerHTML =
      '<h2 class="adm-h">' + icon("flag", 19) + '먼저 하실 것' +
        '<span class="dst-n">' + esc(String(todo.length)) + '</span></h2>' +
      /* ⚠️ 겁주지 않습니다 — 지금 어떻게 보이는지를 **사실로** 적습니다 */
      '<p class="myhint">아래를 채우시면 손님 화면에 제대로 나옵니다. ' +
        '지금은 비어 있는 만큼만 덜 보입니다.</p>' +
      '<ul class="dst-l">' + todo.map(function(t){
        return '<li class="dst-r">' +
          '<span class="dst-ic">' + icon("info", 17) + '</span>' +
          '<span class="dst-t"><b>' + esc(t.what) + '</b>' +
            '<span class="dst-d">' + esc(t.why) + '</span></span>' +
          '<a class="btn btn-sm btn-line dst-go" href="' + esc(t.go) + '">' +
            esc(t.cta) + '</a></li>';
      }).join("") + '</ul>' + guide(todo);
  }

  function load(){
    return Promise.all([
      get("provider?select=id,subs,regions&id=eq." + encodeURIComponent(PV)),
      get("provider_contact?select=tel&provider_id=eq." + encodeURIComponent(PV)),
      get("provider_price?select=id&active=eq.true&provider_id=eq." +
          encodeURIComponent(PV)),
      bucketOn()
    ]).then(function(r){
      var p = (r[0] && r[0][0]) || {};
      FIRST = firstHtml(firstUse(p.subs));
      var hasContact = !!(r[1] && r[1].length);
      var hasPrice   = !!(r[2] && r[2].length);
      var photoOn    = r[3];
      var todo = [];

      /* ① 하시는 일 — ⚠️ 업체가 못 고칩니다. 운영자에게 보냅니다. */
      if(!(p.subs && p.subs.length))
        todo.push({ what:"하시는 일이 아직 안 정해졌습니다",
                    why:"이것이 비면 어느 분류에도 안 나오고 요청도 안 옵니다. "
                        + "운영자가 정해 드립니다.",
                    go:"/help", cta:"알리기" });

      /* ② 영업 지역 — ⚠️ 비면 배정 자체가 안 됩니다 (가장 중요합니다) */
      if(!(p.regions && p.regions.length))
        todo.push({ what:"영업 지역을 고르지 않으셨습니다",
                    why:"요청은 분류와 지역으로 짝을 맞춥니다 — 비어 있으면 "
                        + "배정이 오지 않습니다.",
                    go:"#mebox", cta:"고르기" });

      /* ③ 배정받을 때 연락처 — 비면 대표번호로만 (0013) */
      if(!hasContact)
        todo.push({ what:"배정받을 때 연락처가 비어 있습니다",
                    why:"지금은 대표번호로만 연락드립니다. 현장에 계신 분께 "
                        + "닿는 데 하루가 갑니다.",
                    go:"#pvctbox", cta:"적기" });

      /* ④ 가격 — 0건이면 카드에서 줄째 빠집니다 (0042) */
      if(!hasPrice)
        todo.push({ what:"등록하신 가격이 없습니다",
                    why:"손님 카드에서 가격 줄이 통째로 빠집니다. 없는 값을 "
                        + "저희가 지어 적지 않습니다.",
                    go:"#pricebox", cta:"올리기" });

      /* ⑤ 시설 사진 — ⚠️ 버킷이 꺼져 있으면 그 상자가 없으므로 안 냅니다 */
      if(photoOn){
        var pics = get("provider_photo?select=id&kind=eq.photo&provider_id=eq." +
                       encodeURIComponent(PV));
        return pics.then(function(ph){
          if(!(ph && ph.length))
            todo.push({ what:"시설 사진이 없습니다",
                        why:"사진이 0장이면 카드가 분류 아이콘으로만 나옵니다.",
                        go:"#pvphbox", cta:"올리기" });
          return todo;
        });
      }
      return todo;
    });
  }

  window.amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 업체 담당자가 아니면 **한 줄도** 안 그리고 읽으러 가지도
       않습니다 (0050 의 알림 상자가 그 줄을 빠뜨렸던 자리입니다). */
    if(!a || !a.on || !a.signedIn || a.role !== "provider") return;
    PV = a.provider;
    if(!PV) return;
    return load().then(paint);
  }).catch(function(){});
})();

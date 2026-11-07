/* ════════════════════════════════════════════════════════════════════
   티타임 찾기 · 예약 신청 — /cat/booking · /cat/matchup (DB 는 0060)

   ⚠️⚠️⚠️ **'예약 완료' 라고 적지 않습니다.** 업체가 확인하기 전까지는
   **'예약 신청'** 입니다 (지시서 §6). 확정은 업체만 하고, 그 전에
   "완료" 라고 적으면 하지 않은 일을 했다고 말하는 것입니다 (절대 규칙 5).
   ⚠️ 우리는 **결제를 받지 않습니다** — "안전거래" 도 "에스크로" 도
   없습니다 (대금을 받는 날 전자상거래법 제20조의3 이 걸립니다).

   ⚠️⚠️⚠️ **성함과 연락처가 그 업체에 넘어갑니다** (개인정보보호법
   제17조 제2항). 그래서 신청 양식이 **상호를 보여 주면서** 동의를
   받습니다 — 누구에게 주는지가 정해진 뒤의 동의라 제2항을 만족합니다.
   ⚠️ 보유 기간(`site.js` 의 `bookKeep`)이 비면 **양식을 안 엽니다**
   (법이 요구하는 것을 안 보여 주고 동의를 받을 수는 없습니다 ·
   제15조 제2항 — `/help` 가 site.js 를 안 실어 문의 양식이 조용히
   안 열렸던 그 자리입니다).

   ⚠️⚠️ **거르는 것은 서버입니다** — 스무 줄만 받아 화면에서 거르면
   조건에 맞는 자리가 스무 줄 밖에 있을 때 **0건으로 보입니다**
   (0046 의 조인 거르개에서 적어 둔 그 자리).

   ⚠️⚠️ **날짜를 `toISOString()` 으로 짓지 않습니다** — UTC 라 한국에서
   아침 9시 전에 "오늘 · 내일" 이 하루 밀립니다.

   ⚠️ 로그인 안 하셔도 **목록은 보입니다.** 신청만 로그인입니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("ttlist");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  /* ⚠️ 이 화면이 부킹인지 조인인지 — 빌드가 상자에 적어 줍니다 */
  var KIND = box.getAttribute("data-teekind") || "booking";
  var A = null, PICK = null;
  var S = { rg:"", d:"" };
  var B = window.WOW_BIZ || {};
  var KEEP   = String(B.bookKeep || "");
  var SEARCH = Number(B.teeSearch) || 0;   /* 달력으로 찾을 수 있는 날 수 */
  var AHEAD  = Number(B.teeAhead)  || 0;   /* 표가 담는 끝 */

  var REG = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });
  function rgName(k){ return REG[k] || String(k || ""); }

  /* ⚠️⚠️ **한국 날짜**로 셉니다 (UTC 로 지으면 새벽에 하루 밀립니다) */
  function kstISO(plusDays){
    var t = Date.now() + 9 * 3600 * 1000 + (plusDays || 0) * 86400000;
    return new Date(t).toISOString().slice(0, 10);
  }
  function day(iso){
    var d = new Date(String(iso) + "T00:00:00+09:00");
    if(isNaN(d.getTime())) return String(iso || "");
    var W = ["일","월","화","수","목","금","토"];
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일(" + W[d.getDay()] + ")";
  }
  function hhmm(t){
    var m = /^(\d{2}):(\d{2})/.exec(String(t || ""));
    return m ? (m[1] + ":" + m[2]) : "";
  }

  function get(path){
    var h = { apikey:(A && A.conf ? A.conf.anonKey : "") };
    if(window.amAuthHeaders) h = Object.assign(h, window.amAuthHeaders());
    return fetch(A.conf.url + "/rest/v1/" + path, { headers:h })
      .then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; });
  }
  function call(fn, p){
    return fetch(A.conf.url + "/rest/v1/rpc/" + fn, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json", apikey:A.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {}),
      body: JSON.stringify({ p: p })
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    });
  }
  function loginUrl(){
    var here = window.location.pathname + window.location.search;
    return window.amLoginUrl ? window.amLoginUrl(here) : "/login";
  }

  /* ── 거르개 ─────────────────────────────────────────────────────── */
  function bar(){
    /* ⚠️⚠️⚠️ **지역 묶음으로 거릅니다** — 메인의 현황표가 묶음 단위로
       세고 그 칸이 `?rg=<묶음>` 으로 보냅니다. 여기서 지역 하나로 받으면
       **표의 숫자와 목록의 줄 수가 달라집니다** (지시서 §5). 묶는 규칙은
       `js/data/regions.js` 의 `AM_REGION_ZONES` **한 곳**입니다. */
    var regs = (window.AM_REGION_ZONES || []).map(function(z){
      return '<option value="' + esc(z.key) + '"' +
        (S.rg === z.key ? " selected" : "") + '>' + esc(z.name) + '</option>';
    }).join("");
    return '<form class="jform tf-bar" id="ttf-find">' +
      '<div class="jrow"><label for="tf-d">라운드 날짜</label>' +
      '<input id="tf-d" name="d" type="date" value="' + esc(S.d) + '" ' +
        'min="' + esc(kstISO(0)) + '"' +
        (SEARCH ? ' max="' + esc(kstISO(SEARCH)) + '"' : '') + '></div>' +
      '<div class="jrow"><label for="tf-rg">지역</label>' +
      '<select id="tf-rg" name="rg"><option value="">전체 지역</option>' +
        regs + '</select></div>' +
      '<div class="jrow tf-go">' +
      '<button type="submit" class="btn btn-pri">자리 찾기</button>' +
      (S.rg || S.d
        ? '<button type="button" class="btn btn-line tf-all">조건 지우기</button>'
        : '') +
      '</div></form>';
  }

  /* ── 자리 한 줄 ─────────────────────────────────────────────────── */
  function row(t){
    var fee = window.amTeeFee(t.green_fee);
    var left = Number(t.left_n);
    return '<li class="tf-i" data-tee="' + esc(t.id) + '">' +
      '<p class="tf-d"><b>' + esc(day(t.play_at)) + '</b>' +
        (hhmm(t.tee_at) ? ' <span>' + esc(hhmm(t.tee_at)) + '</span>' : '') +
      '</p>' +
      '<p class="tf-c">' + esc(t.course) +
        '<span class="tf-rg">' + esc(rgName(t.region)) + '</span></p>' +
      '<p class="tf-m">' +
        /* ⚠️⚠️ **상호와 전화번호는 공개가 맞는 값입니다** — 사업자
           신원정보(제20조 제2항)이거나 업체가 공개를 고른 예약 문의
           번호입니다. 배정 담당자 직통은 여기 안 옵니다 (0013). */
        '<span class="tf-pv">' + esc(t.provider_name) + '</span>' +
        (t.tel ? '<a class="tf-tel" href="tel:' + esc(t.tel) + '">' +
                 esc(t.tel) + '</a>' : '') +
        (t.holes ? '<span>' + esc(String(t.holes)) + '홀</span>' : '') +
        (fee ? '<span>' + esc(fee) + '</span>' : '') +
        '<span>' + (left > 0 ? '남은 자리 ' + esc(String(left)) : '자리 찼습니다') +
        '</span>' +
      '</p>' +
      (t.note ? '<p class="tf-n">' + esc(t.note) + '</p>' : '') +
      (left > 0
        ? '<button type="button" class="btn btn-sm btn-pt tf-book">예약 신청</button>'
        /* ⚠️ 자리가 찬 곳에는 단추를 **안 냅니다** (눌러도 거절됩니다) */
        : '') +
      '<div class="tf-bx"></div>' +
    '</li>';
  }

  /* ── 신청 양식 ──────────────────────────────────────────────────── */
  function bookForm(t){
    /* ⚠️⚠️ 로그인 전에는 **양식 대신 로그인 길**을 냅니다 — 신청은
       `/my` 에서 진행 상황을 보셔야 하므로 로그인이 필요합니다. */
    if(!(A && A.signedIn)){
      return '<div class="none"><h3>예약을 신청하시려면 로그인하셔야 합니다.</h3>' +
        '<p>신청하신 뒤 <b>업체가 확정했는지</b>를 내 정보에서 보셔야 하고, ' +
        '그러려면 누가 신청했는지 알아야 합니다.</p>' +
        '<a class="btn btn-pt" href="' + esc(loginUrl()) + '">로그인하기</a></div>';
    }
    /* ⚠️⚠️ 보유 기간이 비면 양식을 **안 엽니다** (제15조 제2항).
       운영자에게 할 말은 손님 화면에 안 적고 console 로 말합니다. */
    if(!KEEP){
      try{ console.warn("  ⚠️ js/data/site.js 의 bookKeep 이 비어 예약 신청 " +
        "양식을 열지 않았습니다 (개인정보보호법 제15조 제2항)."); }catch(e){}
      return '<p class="myhint">예약 신청은 지금 열려 있지 않습니다.</p>';
    }
    var max = Math.max(1, Math.min(4, Number(t.left_n) || 1));
    var opt = "";
    for(var i = 1; i <= max; i++) opt += '<option>' + i + '</option>';
    return '<form class="jform tf-f">' +
      '<div class="jrow"><label>성함 <b>*</b></label>' +
      '<input name="name" required minlength="2" maxlength="30"></div>' +
      '<div class="jrow"><label>연락처 <b>*</b></label>' +
      '<input name="tel" required minlength="7" maxlength="20" ' +
      'inputmode="tel" placeholder="010-0000-0000"></div>' +
      '<div class="jrow"><label>인원 <b>*</b></label>' +
      '<select name="people" required>' + opt + '</select></div>' +
      '<div class="jrow jrow-full"><label>하실 말씀</label>' +
      '<textarea name="memo" rows="2" maxlength="500" ' +
      'placeholder="보기: 초보입니다 · 카트 필요"></textarea></div>' +
      /* ⚠️⚠️⚠️ **상호를 보여 주면서** 동의를 받습니다 — 누구에게
         주는지가 정해진 뒤의 동의라야 제17조 제2항을 만족합니다.
         무엇을 · 왜 · 누구에게 · 얼마나를 **한 자리에서** 적습니다
         (제15조 제2항). */
      '<div class="jrow jrow-full"><label class="chk">' +
      '<input type="checkbox" name="agree3rd" required>' +
      '<span><b>' + esc(t.provider_name) + '</b>에 성함과 연락처를 넘기는 데 ' +
      '동의합니다. 그 업체가 예약을 확인하려고 연락드립니다. ' +
      '보유 기간은 <b>' + esc(KEEP) + '</b>입니다. 동의하지 않으시면 ' +
      '신청하실 수 없습니다.</span></label></div>' +
      /* ⚠️⚠️ 하지 않는 일을 적지 않습니다 */
      '<div class="jrow jrow-full"><p class="agree-no">' +
      '⚠️ 이것은 <b>예약 신청</b>입니다 — 업체가 확정해야 자리가 잡힙니다. ' +
      '골프올인원은 거래 당사자가 아니고 <b>결제를 받지 않습니다.</b></p></div>' +
      '<div class="jrow jrow-full">' +
      '<button type="submit" class="btn btn-pt">이대로 신청하기</button>' +
      '<p class="tf-msg lmsg" hidden></p></div>' +
    '</form>';
  }

  function zero(){
    /* ⚠️⚠️ 0건을 **두 가지로 갈라** 말합니다 (0046 에서 적어 둔 자리) —
       아직 아무도 안 올린 것과, 조건에 맞는 것이 없는 것은 다릅니다. */
    var k = (KIND === "join") ? "조인 자리" : "티타임";
    return '<div class="none">' +
      (S.rg || S.d
        ? '<h3>그 조건에 맞는 ' + esc(k) + '이 없습니다.</h3>' +
          '<p>날짜나 지역을 넓혀 보세요. 지어낸 자리를 채우지 않습니다.</p>' +
          '<button type="button" class="btn btn-line tf-all">조건 지우기</button>'
        : '<h3>아직 올라온 ' + esc(k) + '이 <b>0건</b>입니다.</h3>' +
          '<p>제휴 골프장이 확인한 자리만 여기에 올라옵니다. ' +
          '지금은 <b>상담 요청</b>으로 받고 있습니다.</p>' +
          '<a class="btn btn-pt" href="/match?cat=booking">부킹 상담 요청하기</a>') +
    '</div>';
  }

  function paint(rows){
    box.innerHTML = bar() +
      (rows.length
        ? '<ul class="tf-l">' + rows.map(row).join("") + '</ul>'
        : zero());
  }

  function load(){
    box.innerHTML = bar() + '<p class="myhint">불러오는 중입니다…</p>';
    /* ⚠️⚠️ **거르는 것은 서버입니다** (화면에서 거르면 조건에 맞는 자리가
       받아 온 줄 밖에 있을 때 0건으로 보입니다). */
    var qs = ["select=id,provider_id,provider_name,kind,region,course,play_at," +
              "tee_at,holes,slots,green_fee,tel,note,left_n",
              "kind=eq." + encodeURIComponent(KIND),
              "order=play_at.asc,tee_at.asc", "limit=100"];
    /* ⚠️⚠️ 묶음을 **지역 여럿**으로 풀어 서버에 보냅니다 (`in.(…)`).
       ⚠️ 모르는 묶음이면 안 거릅니다 — 거짓 0건을 만들지 않습니다. */
    if(S.rg){
      var rs = window.amZoneRegions ? window.amZoneRegions(S.rg) : [];
      if(rs.length) qs.push("region=in.(" + rs.map(encodeURIComponent).join(",") + ")");
    }
    if(S.d)  qs.push("play_at=eq." + encodeURIComponent(S.d));
    /* ⚠️ 달력으로 찾을 수 있는 끝 — 지시서 §5 (61~90일은 사전 상담만) */
    else if(SEARCH) qs.push("play_at=lte." + encodeURIComponent(kstISO(SEARCH)));
    return get("v_teetime_open?" + qs.join("&")).then(function(rows){
      if(!rows){
        /* ⚠️ 못 읽었으면 **0건이라고 말하지 않습니다** */
        box.innerHTML = bar() +
          '<p class="myhint">지금 불러오지 못했습니다. 잠시 뒤에 다시 열어 주세요.</p>';
        return;
      }
      paint(rows);
    });
  }

  box.addEventListener("submit", function(e){
    var f = e.target;
    if(!f || f.tagName !== "FORM") return;
    e.preventDefault();
    var val = function(n){
      var el = f.querySelector('[name="' + n + '"]');
      return el ? (el.value || "").trim() : "";
    };
    if(f.id === "ttf-find"){
      S.d = val("d"); S.rg = val("rg");
      load();
      return;
    }
    if(!f.classList.contains("tf-f") || !A) return;
    var li = f.closest("li[data-tee]");
    if(!li) return;
    var ag = f.querySelector('[name="agree3rd"]');
    var bt = f.querySelector('button[type="submit"]');
    var msg = f.querySelector(".tf-msg");
    if(bt) bt.disabled = true;
    call("book_teetime", {
      tee: li.getAttribute("data-tee"), name: val("name"), tel: val("tel"),
      people: val("people"), memo: val("memo"),
      agree3rd: !!(ag && ag.checked)
    }).then(function(){
      var bx = li.querySelector(".tf-bx");
      if(bx) bx.innerHTML = '<div class="none">' +
        '<h3>예약을 신청했습니다.</h3>' +
        /* ⚠️⚠️ **"완료" 라고 적지 않습니다** — 업체가 확정해야 잡힙니다 */
        '<p>업체가 확인한 뒤 확정 여부를 알려 드립니다. ' +
        '진행 상황은 <b>내 정보</b>에서 보실 수 있습니다.</p>' +
        '<a class="btn btn-pt" href="/my">내 정보에서 보기</a></div>';
    }).catch(function(err){
      if(bt) bt.disabled = false;
      /* ⚠️ DB 가 거절한 **그 말**을 그대로 보여 줍니다 */
      if(msg){ msg.hidden = false; msg.textContent = String(err.message || err); }
    });
  });

  box.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    if(t.closest(".tf-all")){ S.rg = ""; S.d = ""; return void load(); }
    var b = t.closest(".tf-book");
    if(!b) return;
    var li = b.closest("li[data-tee]");
    var bx = li ? li.querySelector(".tf-bx") : null;
    if(!bx) return;
    if(bx.innerHTML.trim()){ bx.innerHTML = ""; return; }
    /* 그 줄의 자료로 양식을 엽니다 (상호를 보여 주어야 하므로) */
    var name = li.querySelector(".tf-pv");
    var left = /남은 자리 (\d+)/.exec(li.textContent || "");
    bx.innerHTML = bookForm({
      provider_name: name ? name.textContent : "",
      left_n: left ? Number(left[1]) : 1
    });
  });

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[booking] 로그인 · 접수가 설정되지 않아 티타임 목록을 " +
        "열지 않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      /* ⚠️ 빌드가 찍어 둔 "아직 없는 것입니다" 를 그대로 두면
         0건이라고 말하는 것입니다 — 열지 않았다고 적습니다. */
      window.amShut("ttlist");
      return;                       /* 빌드가 찍어 둔 안내 그대로 */
    }
    A = a;
    /* ⚠️⚠️ 메인 현황표의 칸이 `?rg=<묶음>&d=<날짜>` 로 보냅니다 —
       그 조건으로 **열린 채** 시작해야 숫자와 목록이 맞습니다.
       ⚠️ 모르는 값은 버립니다 (영원히 0건인 화면을 내지 않습니다). */
    try{
      var u = new URLSearchParams(window.location.search);
      var rg = (u.get("rg") || "").trim();
      var d  = (u.get("d")  || "").trim();
      if(rg && window.amZone && window.amZone(rg)) S.rg = rg;
      if(/^\d{4}-\d{2}-\d{2}$/.test(d)) S.d = d;
    }catch(e){ }
    return load();
  }).catch(function(){});
})();

/* ════════════════════════════════════════════════════════════════════
   티타임 자리 — /desk 에서만 돕니다 (DB 는 0060)

   ⚠️⚠️⚠️ **2026-11-06 까지 티타임을 담는 표가 한 줄도 없었습니다.**
   그래서 메인에 "날짜 · 지역별 현황" 을 그리려 해도 **셀 자료가 아예
   없었고**, 부킹 숫자는 전부 0 이었습니다. 이 화면이 그 공급을 받습니다.

   ⚠️⚠️⚠️ **'예약 완료' 라는 말을 쓰지 않습니다.** 업체가 확인하기
   전까지는 **'예약 신청'** 입니다 (지시서 §6). 말은
   `js/data/deal.js` 의 `AM_TEEBOOK_ST` **한 곳**이고 `check-deal` 이
   0060 의 check 와 빌드마다 맞춰 봅니다.

   ⚠️⚠️ **신청자 성함 · 연락처는 보기 하나로만 옵니다**(`v_teebook_pv`).
   표에서는 칸 GRANT 가 그 둘을 안 줍니다 — 자물쇠가 둘이고 둘 다
   살아 있어야 합니다.

   ⚠️⚠️ **날짜 · 지역 · 골프장 · 갈래는 못 고칩니다** — 바꾸면 이미
   신청하신 분이 **다른 자리에 묶입니다** (0056 에서 물건 종류와 지역을
   막은 그 까닭). 화면에도 그 칸을 안 냅니다.

   ⚠️ **승인된 업체만** 올릴 수 있습니다 — 문이 거절하므로, 아직
   승인 전이면 **양식을 안 열고 그 까닭을 적습니다** (눌러도 거절되는
   칸을 그리지 않습니다 · 절대 규칙 5).

   ⚠️ 로그인 전에는 **한 글자도 안 그립니다.**
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("teebox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null, ROWS = [], BOOKS = [], PV = null;
  /* ⚠️ 표가 담는 끝 — `js/data/site.js` 한 곳에서 옵니다 (DB 에 박으면
     사장님이 바꾸실 때마다 마이그레이션이 필요합니다). */
  var AHEAD = Number((window.WOW_BIZ || {}).teeAhead) || 0;

  var REG = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });
  function rgName(k){ return REG[k] || String(k || ""); }

  function get(path){
    return fetch(A.conf.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey:A.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : null; })
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

  function day(iso){
    var d = new Date(String(iso) + "T00:00:00+09:00");
    if(isNaN(d.getTime())) return String(iso || "");
    var W = ["일","월","화","수","목","금","토"];
    return (d.getMonth() + 1) + "." + d.getDate() + "(" + W[d.getDay()] + ")";
  }
  function hhmm(t){
    var m = /^(\d{2}):(\d{2})/.exec(String(t || ""));
    return m ? (m[1] + ":" + m[2]) : "";
  }

  /* ── 올린 자리 한 줄 ────────────────────────────────────────────── */
  function row(t){
    var st = window.amTeeSt(t.state);
    var bk = BOOKS.filter(function(b){ return b.tee_id === t.id; });
    var wait = bk.filter(function(b){ return b.state === "applied"; }).length;
    var fee = window.amTeeFee(t.green_fee);
    return '<li data-tee="' + esc(t.id) + '">' +
      '<p class="tt-h"><b>' + esc(day(t.play_at)) + '</b> ' +
        esc(window.amTeeKind(t.kind).name) + ' · ' + esc(rgName(t.region)) +
        ' · ' + esc(t.course) +
        '<span class="tt-st tone-' + esc(st.tone) + '">' + esc(st.name) + '</span></p>' +
      '<p class="tt-m">' +
        /* ⚠️ 비어 있는 것은 **줄째 뺍니다** — "미정" 을 지어 적지 않습니다 */
        (hhmm(t.tee_at) ? '<span>' + esc(hhmm(t.tee_at)) + '</span>' : '') +
        (t.holes ? '<span>' + esc(String(t.holes)) + '홀</span>' : '') +
        '<span>' + esc(String(t.slots)) + '자리</span>' +
        (fee ? '<span>' + esc(fee) + '</span>' : '') +
        (wait > 0 ? '<span class="tt-w">새 신청 ' + esc(String(wait)) + '</span>' : '') +
      '</p>' +
      (bk.length ? books(bk) : '<p class="myhint">아직 신청이 없습니다.</p>') +
      (t.state === "open"
        ? '<div class="dk-b">' +
            '<button type="button" class="btn btn-sm btn-line tt-edit">고치기</button>' +
            '<button type="button" class="btn btn-sm btn-bad tt-close">이 자리 닫기</button>' +
          '</div>'
        : '') +
      '<form class="jform tt-ef" hidden>' +
        /* ⚠️⚠️ 날짜 · 지역 · 골프장 · 갈래 칸을 **안 냅니다** — 문이
           무시하므로 그리면 눌러도 안 바뀌는 칸이 됩니다. */
        '<div class="jrow"><label>티오프 시각</label>' +
        '<input name="teeAt" type="time" value="' + esc(hhmm(t.tee_at)) + '"></div>' +
        '<div class="jrow"><label>자리 수</label>' +
        '<input name="slots" inputmode="numeric" maxlength="1" value="' +
          esc(String(t.slots)) + '"></div>' +
        '<div class="jrow"><label>1인 그린피 (원)</label>' +
        '<input name="greenFee" inputmode="numeric" maxlength="9" value="' +
          esc(t.green_fee === null || t.green_fee === undefined ? "" : String(t.green_fee)) +
          '" placeholder="비우면 안 적습니다 · 0 은 무료"></div>' +
        '<div class="jrow"><label>예약 문의 번호</label>' +
        '<input name="tel" maxlength="20" value="' + esc(t.tel || "") +
          '" placeholder="비우면 사업자 전화번호를 냅니다"></div>' +
        '<div class="jrow jrow-full"><label>안내</label>' +
        '<textarea name="note" rows="2" maxlength="500">' + esc(t.note || "") +
          '</textarea></div>' +
        '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">이대로 고치기</button></div>' +
      '</form>' +
    '</li>';
  }

  /* ── 들어온 신청 ────────────────────────────────────────────────── */
  function books(bk){
    return '<ul class="tb-l">' + bk.map(function(b){
      var st = window.amTeeBookSt(b.state);
      return '<li data-bk="' + esc(b.id) + '">' +
        '<p class="tb-w"><b>' + esc(b.name) + '</b> · ' + esc(b.tel) +
          ' · ' + esc(String(b.people)) + '명' +
          '<span class="tt-st tone-' + esc(st.tone) + '">' + esc(st.name) + '</span></p>' +
        (b.memo ? '<p class="tb-m">' + esc(b.memo) + '</p>' : '') +
        (b.state === "applied"
          ? '<div class="dk-b">' +
              '<button type="button" class="btn btn-sm btn-pt tb-ok">확정하기</button>' +
              '<button type="button" class="btn btn-sm btn-bad tb-no">거절</button>' +
            '</div>' +
            '<form class="jform tb-nf" hidden>' +
              '<div class="jrow jrow-full"><label>거절하시는 까닭 <b>*</b></label>' +
              '<input name="why" required maxlength="200" ' +
              'placeholder="보기: 그 시간 자리가 찼습니다"></div>' +
              '<div class="jrow jrow-full">' +
              '<button type="submit" class="btn btn-pt">이 까닭으로 거절</button></div>' +
            '</form>'
          : (b.why ? '<p class="tb-m">거절 까닭 — ' + esc(b.why) + '</p>' : '')) +
      '</li>';
    }).join("") + '</ul>';
  }

  /* ── 올리는 양식 ────────────────────────────────────────────────── */
  function form(){
    var kinds = (window.AM_TEE_KIND || []).map(function(k){
      return '<option value="' + esc(k.key) + '">' + esc(k.name) +
        (k.lead ? " — " + esc(k.lead) : "") + '</option>';
    }).join("");
    /* ⚠️⚠️ 지역은 **업체가 적어 둔 영업 지역**만 냅니다 — 전국을 다 내면
       엉뚱한 지역에 자리를 올리게 됩니다. 비어 있으면 전체를 냅니다
       (그 업체가 지역을 아직 안 적으신 것입니다). */
    var mine = (PV && PV.regions && PV.regions.length) ? PV.regions : null;
    var regs = (window.AM_REGIONS || []).filter(function(r){
      return !mine || mine.indexOf(r.key) >= 0;
    }).map(function(r){
      return '<option value="' + esc(r.key) + '">' + esc(r.name) + '</option>';
    }).join("");
    return '<form id="ttf" class="jform">' +
      '<div class="jrow"><label for="t-kind">무엇으로 <b>*</b></label>' +
      '<select id="t-kind" name="kind" required>' + kinds + '</select></div>' +
      '<div class="jrow"><label for="t-rg">지역 <b>*</b></label>' +
      '<select id="t-rg" name="region" required>' +
      '<option value="">고르세요</option>' + regs + '</select></div>' +
      '<div class="jrow"><label for="t-cs">골프장 이름 <b>*</b></label>' +
      '<input id="t-cs" name="course" required minlength="2" maxlength="60" ' +
      'placeholder="보기: 그린밸리CC 신코스"></div>' +
      '<div class="jrow"><label for="t-day">라운드 날짜 <b>*</b></label>' +
      '<input id="t-day" name="playAt" type="date" required></div>' +
      '<div class="jrow"><label for="t-tee">티오프 시각</label>' +
      '<input id="t-tee" name="teeAt" type="time"></div>' +
      '<div class="jrow"><label for="t-hole">홀</label>' +
      '<select id="t-hole" name="holes"><option value="">안 적음</option>' +
      '<option>9</option><option selected>18</option><option>27</option>' +
      '<option>36</option></select></div>' +
      '<div class="jrow"><label for="t-slot">자리 수 <b>*</b></label>' +
      '<select id="t-slot" name="slots" required>' +
      '<option>1</option><option>2</option><option>3</option>' +
      '<option selected>4</option></select></div>' +
      '<div class="jrow"><label for="t-fee">1인 그린피 (원)</label>' +
      '<input id="t-fee" name="greenFee" inputmode="numeric" maxlength="9" ' +
      'placeholder="비우면 안 적습니다"></div>' +
      /* ⚠️ 0 의 뜻을 적어 둡니다 — 빈 값과 다릅니다 */
      '<div class="jrow jrow-full"><p class="agree-no">' +
      '그린피를 비우시면 화면에서 <b>그 줄이 빠집니다</b> — "협의" 를 ' +
      '저희가 지어 적지 않습니다. <b>0 을 적으시면 무료</b>로 나옵니다.</p></div>' +
      '<div class="jrow"><label for="t-tel">예약 문의 번호</label>' +
      '<input id="t-tel" name="tel" maxlength="20" ' +
      'placeholder="비우면 사업자 전화번호를 냅니다"></div>' +
      /* ⚠️⚠️⚠️ 공개되는 번호라는 것을 **적는 그 자리에서** 말합니다 */
      '<div class="jrow jrow-full"><p class="agree-no">' +
      '⚠️ 이 번호는 <b>손님에게 공개됩니다.</b> 비워 두시면 사업자 ' +
      '전화번호가 나갑니다. 배정받으실 때 쓰는 <b>담당자 직통</b>은 ' +
      '여기와 다른 자리이고 <b>손님에게 안 보입니다.</b></p></div>' +
      '<div class="jrow jrow-full"><label for="t-note">안내</label>' +
      '<textarea id="t-note" name="note" rows="2" maxlength="500" ' +
      'placeholder="보기: 카트비 별도 · 캐디 선택"></textarea></div>' +
      '<div class="jrow jrow-full">' +
      '<button type="submit" class="btn btn-pt">이 자리 올리기</button>' +
      '<p class="tt-m2 lmsg" hidden></p></div>' +
    '</form>';
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    /* ⚠️⚠️ 승인 전에는 **양식을 안 엽니다** — 문이 거절하므로 그리면
       눌러도 안 되는 칸이 됩니다. 대신 왜 안 되는지 적습니다.
       ⚠️ 제목을 **변수로 뽑지 않습니다** — `check-safe` 가 innerHTML 에
       변수를 넣는 줄을 잡습니다 (js/adminhat.js 에 적어 둔 그 자리). */
    if(PV && PV.state !== "approved"){
      box.innerHTML = '<h2 class="adm-h">' + icon("cal", 19) + '티타임 자리</h2>' +
        '<p class="myhint">자리를 올리시려면 <b>업체 승인</b>이 먼저 ' +
        '필요합니다. 심사가 끝나면 이 자리가 열립니다.</p>' +
        '<a class="btn btn-sm btn-line" href="/help">고객센터에 물어보기</a>';
      return;
    }
    box.innerHTML = '<h2 class="adm-h">' + icon("cal", 19) + '티타임 자리</h2>' +
      '<p class="myhint">남는 자리를 올려 두시면 손님이 <b>예약 신청</b>을 ' +
      '보내고, 사장님이 <b>확정</b>하십니다. ' +
      /* ⚠️⚠️ 하지 않는 일을 적지 않습니다 — 우리가 예약을 잡아 드리지 않습니다 */
      '골프올인원이 예약을 대신 잡아 드리지 않고 <b>결제도 받지 않습니다.</b> ' +
      (AHEAD ? '오늘부터 <b>' + esc(String(AHEAD)) + '일</b> 뒤까지 올리실 수 있습니다.' : '') +
      '</p>' +
      (ROWS.length
        ? '<ul class="tt-l">' + ROWS.map(row).join("") + '</ul>'
        /* ⚠️ 0건은 고장이 아닙니다 — 아래 양식이 바로 그 길입니다 */
        : '<p class="myhint">아직 올리신 자리가 없습니다. ' +
          '아래에서 첫 자리를 올려 보세요.</p>') +
      form();
    var d = document.getElementById("t-day");
    if(d){
      /* ⚠️ 한국 날짜로 둡니다 — `toISOString()` 은 UTC 라 아침 9시 전에
         하루가 밀립니다 (작업 기억에 적힌 그 자리). */
      var now = new Date(Date.now() + 9 * 3600 * 1000);
      var iso = function(t){ return new Date(t).toISOString().slice(0, 10); };
      d.min = iso(now.getTime());
      if(AHEAD) d.max = iso(now.getTime() + AHEAD * 86400000);
    }
  }

  function say(sel, t){
    var m = box.querySelector(sel);
    if(m){ m.hidden = false; m.textContent = t; }
  }

  function reload(){
    return Promise.all([
      get("teetime?select=id,kind,region,course,play_at,tee_at,holes,slots," +
          "green_fee,tel,note,state,created_at&order=play_at.asc&limit=200"),
      /* ⚠️⚠️ 신청자 성함 · 연락처는 **보기 하나**로만 옵니다 */
      get("v_teebook_pv?select=id,tee_id,name,tel,people,memo,state,why," +
          "created_at&order=created_at.asc&limit=500")
    ]).then(function(r){
      ROWS = r[0] || [];
      BOOKS = r[1] || [];
      paint();
    });
  }

  box.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest || !A) return;
    var li = t.closest("li[data-tee]");
    if(t.closest(".tt-edit") && li){
      var f = li.querySelector(".tt-ef");
      if(f) f.hidden = !f.hidden;
      return;
    }
    if(t.closest(".tt-close") && li){
      call("close_teetime", { id: li.getAttribute("data-tee") })
        .then(reload)
        .catch(function(err){ say(".tt-m2", String(err.message || err)); });
      return;
    }
    var bl = t.closest("li[data-bk]");
    if(t.closest(".tb-ok") && bl){
      call("move_teebook", { id: bl.getAttribute("data-bk"), state:"confirmed" })
        .then(reload)
        .catch(function(err){ say(".tt-m2", String(err.message || err)); });
      return;
    }
    if(t.closest(".tb-no") && bl){
      var nf = bl.querySelector(".tb-nf");
      if(nf) nf.hidden = !nf.hidden;
    }
  });

  box.addEventListener("submit", function(e){
    var f = e.target;
    if(!f || f.tagName !== "FORM" || !A) return;
    e.preventDefault();
    var val = function(n){
      var el = f.querySelector('[name="' + n + '"]');
      return el ? (el.value || "").trim() : "";
    };
    if(f.id === "ttf"){
      var bt = f.querySelector('button[type="submit"]');
      if(bt) bt.disabled = true;
      call("open_teetime", {
        kind: val("kind"), region: val("region"), course: val("course"),
        playAt: val("playAt"), teeAt: val("teeAt"), holes: val("holes"),
        slots: val("slots"), greenFee: val("greenFee"), tel: val("tel"),
        note: val("note")
      }).then(reload)
        .catch(function(err){
          if(bt) bt.disabled = false;
          say(".tt-m2", String(err.message || err));
        });
      return;
    }
    var li = f.closest("li[data-tee]");
    if(f.classList.contains("tt-ef") && li){
      /* ⚠️⚠️ **보낸 칸만 고칩니다** — 빈 글자도 보냅니다 (비우는 것이
         값입니다). 문이 `p ? '칸'` 으로 가리므로 안 보낸 칸은 그대로입니다. */
      call("edit_teetime", {
        id: li.getAttribute("data-tee"),
        teeAt: val("teeAt"), slots: val("slots"), greenFee: val("greenFee"),
        tel: val("tel"), note: val("note")
      }).then(reload)
        .catch(function(err){ say(".tt-m2", String(err.message || err)); });
      return;
    }
    var bl = f.closest("li[data-bk]");
    if(f.classList.contains("tb-nf") && bl){
      call("move_teebook", { id: bl.getAttribute("data-bk"),
                             state:"rejected", why: val("why") })
        .then(reload)
        .catch(function(err){ say(".tt-m2", String(err.message || err)); });
    }
  });

  window.amAuthAsk().then(function(a){
    /* ⚠️ 업체 담당자가 아니면 **한 줄도 안 그리고** 읽으러 가지도 않습니다 */
    if(!a || !a.on || !a.signedIn || !a.provider) return;
    A = a;
    return get("provider?select=id,name,state,regions&id=eq." +
               encodeURIComponent(a.provider) + "&limit=1")
      .then(function(rows){
        PV = (rows && rows[0]) || null;
        return reload();
      });
  }).catch(function(){});
})();

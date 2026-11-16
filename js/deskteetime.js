/* ════════════════════════════════════════════════════════════════════
   티타임 자리 — /desk 에서만 돕니다 (DB 는 0060 → 0085)

   ⚠️⚠️⚠️ **'예약 완료' 라는 말을 쓰지 않습니다.** 업체가 확인하기 전까지는 **'예약 신청'** 입니다.
   말은 js/data/deal.js 의 AM_TEEBOOK_ST **한 곳**이고 check-deal 이 DB 의 check 와 맞춰 봅니다.

   ⚠️⚠️ **신청자 성함 · 연락처는 보기 하나로만 옵니다**(v_teebook_pv) — 표의 칸 GRANT 가 그 둘을 안 줍니다.

   ⚠️⚠️ **날짜 · 지역 · 골프장 · 갈래는 못 고칩니다** — 바꾸면 이미 신청하신 분이 다른 자리에 묶입니다.
   다른 날짜가 필요하면 「복사해 새로 올리기」로 새 자리를 만듭니다(신청 · 확정은 복사하지 않습니다).

   ⚠️⚠️⚠️ **0085 를 운영 DB 에 올리기 전에도 이 화면이 깨지지 않아야 합니다** (2026-11-17).
   새 칸(가격 단위 · 비용 · 신청 마감 · 취소 조건 …)을 표에서 부르면 0085 전 DB 는 질의를 통째로 거절해
   목록이 빈 채로 남습니다. 그래서 처음에 **새 칸이 있는지 한 번 묻고**(V85) — 없으면 예전 양식 · 단추
   그대로, 있으면 새 칸 · 접수 중지 · 업체 취소 · 이용 결과를 냅니다. 0085 전 문은 모르는 칸을 무시하므로,
   새 칸을 그리고 보내면 **저장 안 되는 칸**이 됩니다(그래서 V85 일 때만 그립니다).

   ⚠️ **승인된 업체만** 올릴 수 있습니다 — 승인 전이면 양식을 안 열고 그 까닭을 적습니다.
   ⚠️ 로그인 전에는 **한 글자도 안 그립니다.**
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("teebox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null, ROWS = [], BOOKS = [], PV = null, V85 = false;
  var FILTER = { st:"live", q:"" };
  var PREVIEW = null;          /* 미리보기 중인 보낼 꾸러미들 */
  var DRAFT_KEY = "ttf.draft.v1";
  /* ⚠️ 몇 일 뒤까지 올리는지는 site.js 의 teeAhead 한 곳(운영 정책 · DB 에 안 박습니다) */
  var AHEAD = Number((window.WOW_BIZ || {}).teeAhead) || 0;

  var REG = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });
  function rgName(k){ return window.amKeyName ? window.amKeyName(REG, k, "지역") : ""; }

  /* 골프장 자료(빌드가 찍은 공개 골프장 · slug 가 고유합니다) — 이름 → slug */
  var CS = {};
  (window.AM_COURSES || []).forEach(function(c){
    if(c && c.slug && c.name && c.state !== "hidden") CS[c.name + " (" + rgName(c.region) + ")"] = c;
  });

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

  /* 날짜 — ⚠️ Z 로 읽고 getUTC* 로 꺼냅니다(보는 기계의 시간대가 어디든 적힌 날짜 그대로) */
  function day(iso){
    var d = new Date(String(iso) + "T00:00:00Z");
    if(isNaN(d.getTime())) return String(iso || "");
    var W = ["일","월","화","수","목","금","토"];
    return (d.getUTCMonth() + 1) + "." + d.getUTCDate() + "(" + W[d.getUTCDay()] + ")";
  }
  function hhmm(t){ var m = /^(\d{2}):(\d{2})/.exec(String(t || "")); return m ? (m[1] + ":" + m[2]) : ""; }
  /* 한국 오늘 · 지금(화면 계산용 — 막는 것은 서버입니다) */
  function kstNow(){ return new Date(Date.now() + 9 * 3600 * 1000); }
  function kstToday(){ return kstNow().toISOString().slice(0, 10); }
  function past(t){ return String(t.play_at) < kstToday(); }
  /* 신청 마감 — 화면의 날짜 · 시각 칸(한국 시각) → ISO(+09:00) */
  function untilIso(v){ return v ? (v.length === 16 ? v + ":00+09:00" : v) : ""; }
  function untilLocal(iso){
    if(!iso) return "";
    var d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16);
  }
  function untilText(iso){
    var v = untilLocal(iso); if(!v) return "";
    return day(v.slice(0, 10)) + " " + v.slice(11, 16);
  }

  /* ── 한 자리 ───────────────────────────────────────────────── */
  function costLine(t){
    if(!V85) return "";
    return '<span>' + esc(window.amTeeUnit(t.price_unit)) + ' 기준</span>' +
      '<span>카트 ' + esc(window.amTeeCost(t.cart_rule, t.cart_fee)) + '</span>' +
      '<span>캐디 ' + esc(window.amTeeCost(t.caddie_rule, t.caddie_fee)) + '</span>' +
      (t.apply_until ? '<span>신청 마감 ' + esc(untilText(t.apply_until)) + '</span>' : '');
  }
  function stateBtns(t){
    if(t.state === "hidden")
      return '<p class="myhint">운영자가 가린 자리입니다 — 까닭이 궁금하시면 고객센터로 알려 주세요.</p>';
    if(!V85)
      return t.state === "open"
        ? '<div class="dk-b"><button type="button" class="btn btn-sm btn-line tt-edit">고치기</button>' +
          '<button type="button" class="btn btn-sm btn-bad tt-close">이 자리 닫기</button></div>' : '';
    var b = [];
    if(t.state === "open" || t.state === "paused") b.push('<button type="button" class="btn btn-sm btn-line tt-edit">고치기</button>');
    b.push('<button type="button" class="btn btn-sm btn-line tt-copy">복사해 새로 올리기</button>');
    if(t.state === "open") b.push('<button type="button" class="btn btn-sm btn-line tt-st" data-to="paused">접수 중지</button>');
    if(t.state === "paused") b.push('<button type="button" class="btn btn-sm btn-pt tt-st" data-to="open">다시 받기</button>');
    if(t.state === "open" || t.state === "paused") b.push('<button type="button" class="btn btn-sm btn-bad tt-st" data-to="closed">마감</button>');
    if(t.state === "closed" && !past(t)) b.push('<button type="button" class="btn btn-sm btn-line tt-st" data-to="open">다시 열기</button>');
    return '<div class="dk-b">' + b.join("") + '</div>';
  }
  function row(t){
    var st = window.amTeeSt(t.state);
    var bk = BOOKS.filter(function(b){ return b.tee_id === t.id; });
    var wait = bk.filter(function(b){ return b.state === "applied"; }).length;
    var fee = window.amTeeFee(t.green_fee);
    return '<li data-tee="' + esc(t.id) + '">' +
      '<p class="tt-h"><b>' + esc(day(t.play_at)) + '</b> ' +
        esc(window.amTeeKind(t.kind).name) + ' · ' + esc(rgName(t.region)) +
        ' · ' + esc(t.course) + (t.course_sub ? ' ' + esc(t.course_sub) : '') +
        '<span class="tt-st tone-' + esc(st.tone) + '">' + esc(past(t) ? "지난 자리" : st.name) + '</span></p>' +
      '<p class="tt-m">' +
        (hhmm(t.tee_at) ? '<span>' + esc(hhmm(t.tee_at)) + '</span>' : '') +
        (t.holes ? '<span>' + esc(String(t.holes)) + '홀</span>' : '') +
        '<span>' + esc(String(t.slots)) + '자리</span>' +
        (t.min_players ? '<span>' + esc(String(t.min_players)) + '명부터</span>' : '') +
        (fee ? '<span>그린피 ' + esc(fee) + '</span>' : '') +
        costLine(t) +
        (wait > 0 ? '<span class="tt-w">새 신청 ' + esc(String(wait)) + '</span>' : '') +
      '</p>' +
      (bk.length ? books(bk, t) : '<p class="myhint">아직 신청이 없습니다.</p>') +
      stateBtns(t) +
      editForm(t) +
    '</li>';
  }

  /* 고치기 — ⚠️ 이미 들어온 신청의 조건은 **안 바뀝니다**(신청 순간의 조건을 따로 담습니다 · 0085) */
  function editForm(t){
    var v = function(x){ return esc(x === null || x === undefined ? "" : String(x)); };
    return '<form class="jform tt-ef" hidden>' +
      (V85 ? '<p class="jrow-full myhint">고친 값은 <b>새 신청부터</b> 적용됩니다. 이미 들어온 신청은 신청하신 때의 조건 그대로입니다.</p>' : '') +
      '<div class="jrow"><label>티오프 시각</label>' +
      '<input name="teeAt" type="time" aria-label="티오프 시각" value="' + esc(hhmm(t.tee_at)) + '"></div>' +
      '<div class="jrow"><label>자리 수</label>' +
      '<input name="slots" aria-label="자리 수" inputmode="numeric" maxlength="1" value="' + v(t.slots) + '"></div>' +
      '<div class="jrow"><label>' + (V85 ? '그린피 (원)' : '1인 그린피 (원)') + '</label>' +
      '<input name="greenFee" aria-label="그린피 (원)" inputmode="numeric" maxlength="9" value="' + v(t.green_fee) +
        '" placeholder="비우면 안 적습니다 · 0 은 무료"></div>' +
      (V85 ? costFields(t, "e") : '') +
      '<div class="jrow"><label>예약 문의 번호</label>' +
      '<input name="tel" aria-label="예약 문의 번호" maxlength="20" value="' + v(t.tel) +
        '" placeholder="비우면 사업자 전화번호를 냅니다"></div>' +
      '<div class="jrow jrow-full"><label>' + (V85 ? '추가 조건 · 안내' : '안내') + '</label>' +
      '<textarea name="note" aria-label="안내" rows="2" maxlength="500">' + v(t.note) + '</textarea></div>' +
      '<div class="jrow jrow-full">' +
      '<button type="submit" class="btn btn-pt">이대로 고치기</button></div>' +
    '</form>';
  }

  /* 0085 의 칸 — 올리기 · 고치기가 같이 씁니다(두 벌로 적지 않습니다) */
  function costFields(t, q){
    t = t || {};
    var v = function(x){ return esc(x === null || x === undefined ? "" : String(x)); };
    var sel = function(name, cur, label){
      return '<select name="' + name + '" aria-label="' + esc(label) + '">' +
        '<option value=""' + (cur ? '' : ' selected') + '>모름 (업체에 확인)</option>' +
        (window.AM_TEE_COST || []).map(function(c){
          return '<option value="' + esc(c.key) + '"' + (cur === c.key ? ' selected' : '') + '>' + esc(c.name) + '</option>';
        }).join("") + '</select>';
    };
    return '<div class="jrow"><label>가격 단위 <b>*</b></label>' +
      '<select name="priceUnit" aria-label="가격 단위" required>' +
        '<option value="">고르세요</option>' +
        (window.AM_TEE_UNIT || []).map(function(u){
          return '<option value="' + esc(u.key) + '"' + (t.price_unit === u.key && q === "e" ? ' selected' : '') + '>' + esc(u.name) + ' 기준</option>';
        }).join("") + '</select></div>' +
      '<div class="jrow"><label>최소 인원</label>' +
      '<select name="minPlayers" aria-label="최소 인원"><option value="">제한 없음</option>' +
        [1,2,3,4].map(function(n){ return '<option' + (t.min_players === n ? ' selected' : '') + '>' + n + '</option>'; }).join("") +
      '</select></div>' +
      '<div class="jrow"><label>카트비</label>' + sel("cartRule", t.cart_rule, "카트비") +
      '<input name="cartFee" aria-label="카트비 금액 (별도일 때)" inputmode="numeric" maxlength="9" value="' + v(t.cart_fee) +
        '" placeholder="별도일 때 금액 · 모르면 비움"></div>' +
      '<div class="jrow"><label>캐디피</label>' + sel("caddieRule", t.caddie_rule, "캐디피") +
      '<input name="caddieFee" aria-label="캐디피 금액 (별도일 때)" inputmode="numeric" maxlength="9" value="' + v(t.caddie_fee) +
        '" placeholder="별도일 때 금액 · 모르면 비움"></div>' +
      '<div class="jrow"><label>신청 마감</label>' +
      '<input name="applyUntil" type="datetime-local" aria-label="신청 마감 (한국 시각)" value="' + esc(untilLocal(t.apply_until)) + '"></div>' +
      '<div class="jrow jrow-full"><label>취소 · 변경 조건 <b>*</b></label>' +
      '<textarea name="cancelTerms" aria-label="취소 · 변경 조건" rows="2" maxlength="500" required ' +
        'placeholder="보기: 3일 전까지 무료 취소 · 이후 위약금은 골프장 규정">' + v(t.cancel_terms) + '</textarea></div>' +
      '<div class="jrow jrow-full"><p class="agree-no">모르는 비용은 <b>「모름」</b>으로 두세요 — 0원으로 적지 않고 손님 화면에 ' +
        '「업체에 확인」으로 나갑니다. 「포함」이면 금액을 비웁니다.</p></div>';
  }

  /* ── 신청 목록 ─────────────────────────────────────────────── */
  function books(bk, t){
    var after = String(t.play_at) <= kstToday();
    return '<ul class="tb-l">' + bk.map(function(b){
      var st = window.amTeeBookSt(b.state);
      var oc = V85 && b.state === "confirmed" && after && window.amTeeOutcome ? window.amTeeOutcome(b.outcome) : null;
      var snapFee = V85 && b.snap && b.snap.green_fee !== undefined && b.snap.green_fee !== null &&
                    String(b.snap.green_fee) !== String(t.green_fee) ? window.amTeeFee(b.snap.green_fee) : "";
      return '<li data-bk="' + esc(b.id) + '">' +
        '<p class="tb-w"><b>' + esc(b.name) + '</b> · ' + esc(b.tel) +
          ' · ' + esc(String(b.people)) + '명' +
          '<span class="tt-st tone-' + esc(st.tone) + '">' + esc(st.name) + '</span></p>' +
        (b.memo ? '<p class="tb-m">' + esc(b.memo) + '</p>' : '') +
        (snapFee ? '<p class="tb-m">신청하신 때 그린피 ' + esc(snapFee) + ' — 이 분께는 그 조건이 적용됩니다</p>' : '') +
        bookBtns(b, after) +
        (oc ? '<p class="tb-m">이용 결과 — ' + esc(oc.name) +
                (b.pv_result ? ' (업체 표시: ' + esc(b.pv_result === "used" ? "이용함" : "오지 않음") + ')' : '') + '</p>' : '') +
        ((b.state === "rejected" || b.state === "pcanceled") && b.why ? '<p class="tb-m">까닭 — ' + esc(b.why) + '</p>' : '') +
      '</li>';
    }).join("") + '</ul>';
  }
  function bookBtns(b, after){
    if(b.state === "applied")
      return '<div class="dk-b">' +
          '<button type="button" class="btn btn-sm btn-pt tb-ok">확정하기</button>' +
          '<button type="button" class="btn btn-sm btn-bad tb-no">거절</button></div>' +
        whyForm("tb-nf", "거절하시는 까닭", "보기: 그 시간 자리가 찼습니다", "이 까닭으로 거절");
    if(b.state === "confirmed" && V85 && !after)
      return '<div class="dk-b"><button type="button" class="btn btn-sm btn-bad tb-pc">예약 취소(업체)</button></div>' +
        whyForm("tb-pcf", "예약을 취소하시는 까닭", "보기: 골프장 사정으로 그 시각이 없어졌습니다", "이 까닭으로 예약 취소");
    if(b.state === "confirmed" && V85 && after)
      return '<div class="dk-b">' +
        '<button type="button" class="btn btn-sm btn-line tb-mk" data-r="used">이용함</button>' +
        '<button type="button" class="btn btn-sm btn-line tb-mk" data-r="noshow">오지 않음</button></div>' +
        '<p class="myhint">업체 표시만으로 이용 · 결제가 확인된 것은 아닙니다. 손님 표시와 다르면 「확인 필요」로 남습니다.</p>';
    return "";
  }
  function whyForm(cls, label, ph, btn){
    return '<form class="jform ' + cls + '" hidden>' +
      '<div class="jrow jrow-full"><label>' + esc(label) + ' <b>*</b></label>' +
      '<input name="why" aria-label="' + esc(label) + '" required maxlength="200" placeholder="' + esc(ph) + '"></div>' +
      '<div class="jrow jrow-full"><button type="submit" class="btn btn-pt">' + esc(btn) + '</button></div></form>';
  }

  /* ── 올리기 양식 ───────────────────────────────────────────── */
  function form(){
    var kinds = (window.AM_TEE_KIND || []).map(function(k){
      return '<option value="' + esc(k.key) + '">' + esc(k.name) + (k.lead ? " — " + esc(k.lead) : "") + '</option>';
    }).join("");
    var mine = (PV && PV.regions && PV.regions.length) ? PV.regions : null;
    var regs = (window.AM_REGIONS || []).filter(function(r){ return !mine || mine.indexOf(r.key) >= 0; })
      .map(function(r){ return '<option value="' + esc(r.key) + '">' + esc(r.name) + '</option>'; }).join("");
    var list = V85 ? Object.keys(CS).map(function(n){ return '<option value="' + esc(n) + '">'; }).join("") : "";
    return '<form id="ttf" class="jform">' +
      '<h3 class="jrow-full tt-fh">새 자리 올리기</h3>' +
      '<div class="jrow"><label for="t-kind">무엇으로 <b>*</b></label>' +
      '<select id="t-kind" name="kind" required>' + kinds + '</select></div>' +
      '<div class="jrow"><label for="t-cs">골프장 <b>*</b></label>' +
      '<input id="t-cs" name="course" required minlength="2" maxlength="80" ' + (V85 ? 'list="t-cl" autocomplete="off" ' : '') +
      'placeholder="' + (V85 ? '이름을 치면 골프장 목록에서 고릅니다' : '보기: 그린밸리CC 신코스') + '">' +
      (V85 ? '<datalist id="t-cl">' + list + '</datalist>' : '') + '</div>' +
      (V85 ? '<div class="jrow"><label for="t-sub">코스</label>' +
        '<input id="t-sub" name="courseSub" maxlength="30" placeholder="확인된 경우 · 보기: 동코스"></div>' : '') +
      '<div class="jrow"><label for="t-rg">지역 <b>*</b></label>' +
      '<select id="t-rg" name="region" required><option value="">고르세요</option>' + regs + '</select></div>' +
      '<div class="jrow"><label for="t-day">라운드 날짜 <b>*</b></label>' +
      '<input id="t-day" name="playAt" type="date" required></div>' +
      '<div class="jrow"><label for="t-tee">티오프 시각' + (V85 ? ' <b>*</b>' : '') + '</label>' +
      '<input id="t-tee" name="teeAt" type="time"' + (V85 ? ' required' : '') + '></div>' +
      (V85 ? '<div class="jrow jrow-full"><label for="t-more">같은 조건으로 시각 더 넣기</label>' +
        '<input id="t-more" name="more" maxlength="200" placeholder="보기: 07:17, 07:24 — 쉼표로 · 저장 전에 한 줄씩 보여 드립니다"></div>' : '') +
      '<div class="jrow"><label for="t-hole">홀</label>' +
      '<select id="t-hole" name="holes"><option value="">안 적음</option>' +
      '<option>9</option><option selected>18</option><option>27</option><option>36</option></select></div>' +
      '<div class="jrow"><label for="t-slot">자리 수 <b>*</b></label>' +
      '<select id="t-slot" name="slots" required><option>1</option><option>2</option><option>3</option>' +
      '<option selected>4</option></select></div>' +
      '<div class="jrow"><label for="t-fee">' + (V85 ? '그린피 (원)' : '1인 그린피 (원)') + '</label>' +
      '<input id="t-fee" name="greenFee" inputmode="numeric" maxlength="9" placeholder="비우면 안 적습니다"></div>' +
      (V85 ? costFields(null, "n") : '') +
      '<div class="jrow jrow-full"><p class="agree-no">그린피를 비우시면 화면에서 <b>그 줄이 빠집니다</b> — "협의" 를 ' +
      '저희가 지어 적지 않습니다. <b>0 을 적으시면 무료</b>로 나옵니다.</p></div>' +
      '<div class="jrow"><label for="t-tel">예약 문의 번호</label>' +
      '<input id="t-tel" name="tel" maxlength="20" placeholder="비우면 사업자 전화번호를 냅니다"></div>' +
      '<div class="jrow jrow-full"><p class="agree-no">⚠️ 이 번호는 <b>손님에게 공개됩니다.</b> 배정받으실 때 쓰는 ' +
      '<b>담당자 직통</b>은 여기와 다른 자리이고 <b>손님에게 안 보입니다.</b></p></div>' +
      '<div class="jrow jrow-full"><label for="t-note">' + (V85 ? '추가 조건 · 안내' : '안내') + '</label>' +
      '<textarea id="t-note" name="note" rows="2" maxlength="500" placeholder="' +
      (V85 ? '보기: 4인 필수 · 노캐디 불가 — 손님이 신청 전에 봅니다' : '보기: 카트비 별도 · 캐디 선택') + '"></textarea></div>' +
      '<div class="jrow jrow-full">' +
      '<button type="submit" class="btn btn-pt">' + (V85 ? '미리 보기' : '이 자리 올리기') + '</button>' +
      '<p class="tt-m2 lmsg" hidden></p></div>' +
      '<div class="tt-pv jrow-full" hidden></div>' +
    '</form>';
  }

  /* ── 목록 거르기 · 찾기 ─────────────────────────────────────── */
  function shown(){
    var q = FILTER.q.toLowerCase();
    return ROWS.filter(function(t){
      if(q && String(t.course || "").toLowerCase().indexOf(q) < 0 && String(t.course_sub || "").toLowerCase().indexOf(q) < 0) return false;
      if(FILTER.st === "all") return true;
      if(FILTER.st === "past") return past(t);
      /* ⚠️ 기본 보기에는 **결과를 아직 안 적은 지난 자리**도 남깁니다 — 숨기면 이용 결과를 적을 자리를 못 찾습니다 */
      if(past(t)) return FILTER.st === "live" && BOOKS.some(function(b){
        return b.tee_id === t.id && b.state === "confirmed" && !b.pv_result; });
      if(FILTER.st === "live") return t.state === "open" || t.state === "paused";
      return t.state === FILTER.st;
    });
  }
  function filterBar(){
    var o = [["live","받는 중 · 접수 중지 · 결과 남은 자리"],["open","받는 중"],["paused","접수 중지"],["closed","마감"],["past","지난 자리"],["all","전체"]];
    return '<div class="tt-fb">' +
      '<label class="sr-only" for="tt-fst">상태</label>' +
      '<select id="tt-fst">' + o.map(function(x){
        return '<option value="' + x[0] + '"' + (FILTER.st === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join("") + '</select>' +
      '<label class="sr-only" for="tt-fq">골프장 찾기</label>' +
      '<input id="tt-fq" type="search" maxlength="40" placeholder="골프장 · 코스 이름" value="' + esc(FILTER.q) + '">' +
    '</div>';
  }
  function listHtml(){
    var L = shown();
    if(!ROWS.length) return '<p class="myhint">아직 올리신 자리가 없습니다. 아래에서 첫 자리를 올려 보세요.</p>';
    return (V85 ? filterBar() : '') +
      (L.length ? '<ul class="tt-l">' + L.map(row).join("") + '</ul>'
                : '<p class="myhint">이 조건에 맞는 자리가 없습니다.</p>');
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    if(PV && PV.state !== "approved"){
      box.innerHTML = '<h2 class="adm-h">' + icon("cal", 19) + '티타임 자리</h2>' +
        '<p class="myhint">자리를 올리시려면 <b>업체 승인</b>이 먼저 필요합니다. 심사가 끝나면 이 자리가 열립니다.</p>' +
        '<a class="btn btn-sm btn-line" href="/help">고객센터에 물어보기</a>';
      return;
    }
    box.innerHTML = '<h2 class="adm-h">' + icon("cal", 19) + '티타임 자리</h2>' +
      '<p class="myhint">남는 자리를 올려 두시면 손님이 <b>예약 신청</b>을 보내고, 사장님이 <b>확정</b>하십니다. ' +
      '골프올인원이 예약을 대신 잡아 드리지 않고 <b>결제도 받지 않습니다.</b> ' +
      (AHEAD ? '오늘부터 <b>' + esc(String(AHEAD)) + '일</b> 뒤까지 올리실 수 있습니다.' : '') + '</p>' +
      (V85 ? '<p class="myhint">⚠️ 다른 곳(전화 · 다른 사이트)에서 팔린 자리는 저희가 알 수 없습니다 — <b>직접 「마감」</b>해 주세요. ' +
        '마감해도 이미 확정한 예약은 그대로입니다.</p>' : '') +
      listHtml() + form();
    var d = document.getElementById("t-day");
    if(d){
      var now = kstNow();
      var iso = function(t){ return new Date(t).toISOString().slice(0, 10); };
      d.min = iso(now.getTime());
      if(AHEAD) d.max = iso(now.getTime() + AHEAD * 86400000);
    }
    restoreDraft();
  }
  /* 목록만 다시 그립니다 — 양식에 적고 있던 것을 날리지 않게 */
  function paintList(){
    var f = document.getElementById("ttf");
    var old = box.querySelector(".tt-l") || box.querySelector(".tt-fb + .myhint");
    var holder = document.createElement("div");
    holder.innerHTML = listHtml();
    var fb = box.querySelector(".tt-fb");
    if(fb) fb.parentNode.removeChild(fb);
    if(old && old.parentNode) old.parentNode.removeChild(old);
    while(holder.firstChild) box.insertBefore(holder.firstChild, f);
    var q = document.getElementById("tt-fq");
    if(q && document.activeElement !== q && FILTER.q){ /* 그대로 둡니다 */ }
  }

  /* ── 작성 중 내용 보존 (이 브라우저에만 · 서버에 안 보냅니다) ──────── */
  var FIELDS = ["kind","course","courseSub","region","playAt","teeAt","more","holes","slots","greenFee","priceUnit",
                "minPlayers","cartRule","cartFee","caddieRule","caddieFee","applyUntil","cancelTerms","tel","note"];
  function saveDraft(){
    var f = document.getElementById("ttf"); if(!f) return;
    var o = {};
    FIELDS.forEach(function(n){ var el = f.querySelector('[name="' + n + '"]'); if(el) o[n] = el.value; });
    try{ localStorage.setItem(DRAFT_KEY, JSON.stringify(o)); }catch(e){}
  }
  function restoreDraft(){
    var f = document.getElementById("ttf"); if(!f) return;
    var o = null; try{ o = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); }catch(e){}
    if(o){ if(o.region) setRegion(o.region); fill(f, o); }
  }
  function fill(f, o){
    FIELDS.forEach(function(n){
      var el = f.querySelector('[name="' + n + '"]');
      if(el && o[n] !== undefined && o[n] !== null) el.value = String(o[n]);
    });
  }
  /* 목록에서 고른 골프장의 지역으로 맞춥니다 — 업체 영업 지역 밖의 골프장이어도 지역 칸이 비어 올리기가
     조용히 막히지 않게 그 지역을 칸에 더합니다(지역은 서버도 골프장 자료에서 다시 가져옵니다) */
  function setRegion(k){
    var rg = document.getElementById("t-rg");
    if(!rg || !k) return;
    if(!Array.prototype.some.call(rg.options, function(o){ return o.value === k; })){
      var op = document.createElement("option"); op.value = k; op.textContent = rgName(k); rg.appendChild(op);
    }
    rg.value = k;
  }
  function clearDraft(){ try{ localStorage.removeItem(DRAFT_KEY); }catch(e){} }

  function say(sel, t){ var m = box.querySelector(sel); if(m){ m.hidden = false; m.textContent = t; } }
  function sayIn(el, t){
    if(!el) return say(".tt-m2", t);
    var m = el.querySelector(":scope > .tt-rowmsg");
    if(!m){ el.insertAdjacentHTML("beforeend", '<p class="lmsg tt-rowmsg" role="alert"></p>');
            m = el.querySelector(":scope > .tt-rowmsg"); }
    if(m) m.textContent = t;
  }
  function busy(b, on){ if(b) b.disabled = !!on; }

  var COLS0 = "id,kind,region,course,play_at,tee_at,holes,slots,green_fee,tel,note,state,created_at";
  var COLS85 = COLS0 + ",course_sub,min_players,price_unit,cart_rule,cart_fee,caddie_rule,caddie_fee,apply_until,cancel_terms";
  var BK0 = "id,tee_id,name,tel,people,memo,state,why,created_at";
  var BK85 = BK0 + ",snap,pv_result,cus_result,outcome";
  function reload(keepForm){
    return Promise.all([
      get("teetime?select=" + (V85 ? COLS85 : COLS0) + "&order=play_at.asc,tee_at.asc&limit=200"),
      get("v_teebook_pv?select=" + (V85 ? BK85 : BK0) + "&order=created_at.asc&limit=500")
    ]).then(function(r){
      ROWS = r[0] || [];
      BOOKS = r[1] || [];
      if(keepForm && document.getElementById("ttf")) paintList(); else paint();
    });
  }

  /* ── 올릴 꾸러미 짓기 · 미리 보기 ─────────────────────────────── */
  function pack(f){
    var val = function(n){ var el = f.querySelector('[name="' + n + '"]'); return el ? (el.value || "").trim() : ""; };
    var p = { kind: val("kind"), region: val("region"), course: val("course"), playAt: val("playAt"),
              teeAt: val("teeAt"), holes: val("holes"), slots: val("slots"), greenFee: val("greenFee"),
              tel: val("tel"), note: val("note") };
    if(V85){
      var c = CS[p.course];
      if(c){ p.courseSlug = c.slug; if(!p.region) p.region = c.region; }
      p.courseSub = val("courseSub"); p.priceUnit = val("priceUnit"); p.minPlayers = val("minPlayers");
      p.cartRule = val("cartRule"); p.cartFee = val("cartFee"); p.caddieRule = val("caddieRule");
      p.caddieFee = val("caddieFee"); p.applyUntil = untilIso(val("applyUntil")); p.cancelTerms = val("cancelTerms");
    }
    var list = [p];
    if(V85 && val("more")){
      val("more").split(/[,\s]+/).forEach(function(x){
        var m = /^(\d{1,2}):(\d{2})$/.exec(x);
        if(m){ var q = Object.assign({}, p); q.teeAt = (m[1].length === 1 ? "0" + m[1] : m[1]) + ":" + m[2]; list.push(q); }
      });
    }
    return list;
  }
  function pvHtml(list){
    var p = list[0];
    var c = CS[p.course];
    return '<div class="tt-pvb"><h4>손님에게 이렇게 보입니다 — ' + esc(String(list.length)) + '자리</h4>' +
      (c ? '' : '<p class="agree-no">⚠️ 골프장 목록에서 고르지 않은 이름입니다. 목록에 있으면 목록에서 골라 주세요 — ' +
                 '이름이 정확하지 않으면 손님이 다른 골프장으로 읽습니다.</p>') +
      '<ul class="tt-pvl">' + list.map(function(x){
        return '<li><b>' + esc(day(x.playAt)) + ' ' + esc(x.teeAt) + '</b> · ' + esc(x.course) +
          (x.courseSub ? ' ' + esc(x.courseSub) : '') + ' · ' + esc(String(x.slots)) + '자리</li>';
      }).join("") + '</ul>' +
      '<p class="tb-m">그린피 ' + esc(window.amTeeFee(p.greenFee) || "안 적음 (줄이 빠짐)") + ' · ' + esc(window.amTeeUnit(p.priceUnit)) + ' 기준' +
        ' · 카트 ' + esc(window.amTeeCost(p.cartRule, p.cartFee)) + ' · 캐디 ' + esc(window.amTeeCost(p.caddieRule, p.caddieFee)) + '</p>' +
      (p.applyUntil ? '<p class="tb-m">신청 마감 ' + esc(untilText(p.applyUntil)) + '</p>' : '') +
      '<p class="tb-m">취소 · 변경 — ' + esc(p.cancelTerms) + '</p>' +
      '<p class="tb-m">신청 후 업체 확인을 거쳐 확정됩니다.</p>' +
      '<div class="dk-b"><button type="button" class="btn btn-pt tt-go">이대로 ' + esc(String(list.length)) + '자리 올리기</button>' +
      '<button type="button" class="btn btn-line tt-back">다시 고치기</button></div>' +
      '<ul class="tt-res"></ul></div>';
  }
  function sendAll(list, f){
    var res = f.querySelector(".tt-res"), ok = 0, fail = 0;
    return list.reduce(function(ch, p){
      return ch.then(function(){
        return call("open_teetime", p).then(function(){ ok++; resLine(res, p, ""); },
          function(err){ fail++; resLine(res, p, window.amErrText(err)); });
      });
    }, Promise.resolve()).then(function(){
      if(!fail){ clearDraft(); PREVIEW = null; return reload(false); }
      /* ⚠️ 일부만 됐으면 양식 · 결과를 그대로 둡니다 — 무엇이 안 됐는지 보고 다시 하시게 */
      say(".tt-m2", ok + "자리 올렸고 " + fail + "자리는 못 올렸습니다 — 아래 까닭을 보고 고쳐 주세요.");
      return reload(true);
    });
  }
  function resLine(ul, p, err){
    if(!ul) return;
    var li = document.createElement("li");
    li.textContent = day(p.playAt) + " " + p.teeAt + " — " + (err ? "못 올림: " + err : "올렸습니다");
    ul.appendChild(li);
  }

  /* ── 누름 ──────────────────────────────────────────────────── */
  box.addEventListener("input", function(e){
    var t = e.target;
    if(t && t.closest && t.closest("#ttf")) saveDraft();
    if(t && t.id === "tt-fq"){ FILTER.q = t.value.trim(); paintList(); var q = document.getElementById("tt-fq"); if(q){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }
  });
  box.addEventListener("change", function(e){
    var t = e.target;
    if(t && t.id === "tt-fst"){ FILTER.st = t.value; paintList(); return; }
    if(t && t.closest && t.closest("#ttf")){
      /* 골프장을 목록에서 고르면 지역을 그 골프장 지역으로 채웁니다 */
      if(t.name === "course" && CS[t.value]) setRegion(CS[t.value].region);
      saveDraft();
    }
  });

  box.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest || !A) return;
    var li = t.closest("li[data-tee]");
    var f = document.getElementById("ttf");
    if(t.closest(".tt-edit") && li){ var ef = li.querySelector(".tt-ef"); if(ef) ef.hidden = !ef.hidden; return; }
    if(t.closest(".tt-copy") && li && f){
      var r = ROWS.filter(function(x){ return x.id === li.getAttribute("data-tee"); })[0];
      if(!r) return;
      var cname = r.course;
      Object.keys(CS).forEach(function(k){ if(CS[k].name === r.course && CS[k].region === r.region) cname = k; });
      /* ⚠️ 날짜 · 시각은 비웁니다 — 손으로 다시 확인하시게. 신청 · 확정은 복사하지 않습니다(자리만 새로) */
      setRegion(r.region);
      fill(f, { kind:r.kind, course:cname, courseSub:r.course_sub || "", region:r.region, playAt:"", teeAt:"", more:"",
                holes:r.holes || "", slots:r.slots, greenFee:r.green_fee === null ? "" : r.green_fee,
                priceUnit:r.price_unit || "", minPlayers:r.min_players || "", cartRule:r.cart_rule || "",
                cartFee:r.cart_fee === null || r.cart_fee === undefined ? "" : r.cart_fee,
                caddieRule:r.caddie_rule || "", caddieFee:r.caddie_fee === null || r.caddie_fee === undefined ? "" : r.caddie_fee,
                applyUntil:"", cancelTerms:r.cancel_terms || "", tel:r.tel || "", note:r.note || "" });
      saveDraft();
      say(".tt-m2", "복사했습니다 — 날짜 · 시각 · 가격을 확인하고 「미리 보기」를 눌러 주세요. 신청 · 확정은 복사되지 않습니다.");
      var day0 = document.getElementById("t-day"); if(day0){ day0.focus(); day0.scrollIntoView({ block:"center" }); }
      return;
    }
    if(t.closest(".tt-st") && li){
      var sb = t.closest(".tt-st"), to = sb.getAttribute("data-to");
      var msg = to === "closed" ? "이 자리를 마감합니다. 이미 확정한 예약은 그대로이고, 남은 새 신청은 따로 확정 · 거절해 주세요."
              : to === "paused" ? "새 신청을 잠시 받지 않습니다. 이미 들어온 신청은 그대로 처리하실 수 있습니다." : "";
      if(msg && !window.confirm(msg)) return;
      busy(sb, true);
      call("set_teetime_state", { id: li.getAttribute("data-tee"), to: to })
        .then(function(r){ return reload(true).then(function(){
          var nl = box.querySelector('li[data-tee="' + li.getAttribute("data-tee") + '"]');
          if(r && r.applied) sayIn(nl, "확인 안 한 새 신청이 " + r.applied + "건 남아 있습니다 — 확정 · 거절해 주세요.");
        }); })
        .catch(function(err){ busy(sb, false); sayIn(li, window.amErrText(err)); });
      return;
    }
    if(t.closest(".tt-close") && li){
      if(!window.confirm("이 자리를 닫으면 새 신청을 받지 않습니다. 닫을까요?")) return;
      var cb = t.closest(".tt-close"); busy(cb, true);
      call("close_teetime", { id: li.getAttribute("data-tee") })
        .then(function(){ return reload(true); })
        .catch(function(err){ busy(cb, false); sayIn(li, window.amErrText(err)); });
      return;
    }
    if(t.closest(".tt-go") && f && PREVIEW){
      var gb = t.closest(".tt-go"); busy(gb, true);
      var back = f.querySelector(".tt-back"); busy(back, true);
      sendAll(PREVIEW, f).catch(function(err){ busy(gb, false); busy(back, false); say(".tt-m2", window.amErrText(err)); });
      return;
    }
    if(t.closest(".tt-back") && f){
      PREVIEW = null;
      var pv = f.querySelector(".tt-pv"); if(pv){ pv.hidden = true; pv.innerHTML = ""; }
      return;
    }
    var bl = t.closest("li[data-bk]");
    if(t.closest(".tb-ok") && bl){
      var ob = t.closest(".tb-ok"); busy(ob, true);
      call("move_teebook", { id: bl.getAttribute("data-bk"), state:"confirmed" })
        .then(function(){ return reload(true); })
        .catch(function(err){ busy(ob, false); sayIn(bl, window.amErrText(err)); });
      return;
    }
    if(t.closest(".tb-no") && bl){ var nf = bl.querySelector(".tb-nf"); if(nf) nf.hidden = !nf.hidden; return; }
    if(t.closest(".tb-pc") && bl){ var pf = bl.querySelector(".tb-pcf"); if(pf) pf.hidden = !pf.hidden; return; }
    if(t.closest(".tb-mk") && bl){
      var mb = t.closest(".tb-mk"); busy(mb, true);
      call("mark_teebook", { id: bl.getAttribute("data-bk"), result: mb.getAttribute("data-r") })
        .then(function(){ return reload(true); })
        .catch(function(err){ busy(mb, false); sayIn(bl, window.amErrText(err)); });
    }
  });

  box.addEventListener("submit", function(e){
    var f = e.target;
    if(!f || f.tagName !== "FORM" || !A) return;
    e.preventDefault();
    var val = function(n){ var el = f.querySelector('[name="' + n + '"]'); return el ? (el.value || "").trim() : ""; };
    if(f.id === "ttf"){
      var bt = f.querySelector('button[type="submit"]');
      if(V85){
        /* 첫 누름은 **미리 보기** — 여러 자리면 한 줄씩 보여 드리고 「이대로 올리기」로 저장합니다 */
        PREVIEW = pack(f);
        var pv = f.querySelector(".tt-pv");
        if(pv){ pv.hidden = false; pv.innerHTML = pvHtml(PREVIEW); pv.scrollIntoView({ block:"nearest" }); }
        return;
      }
      if(bt) bt.disabled = true;
      call("open_teetime", pack(f)[0]).then(function(){ clearDraft(); return reload(false); })
        .catch(function(err){ if(bt) bt.disabled = false; say(".tt-m2", window.amErrText(err)); });
      return;
    }
    var li = f.closest("li[data-tee]");
    if(f.classList.contains("tt-ef") && li){
      var p = { id: li.getAttribute("data-tee"), teeAt: val("teeAt"), slots: val("slots"),
                greenFee: val("greenFee"), tel: val("tel"), note: val("note") };
      if(V85){ p.priceUnit = val("priceUnit"); p.minPlayers = val("minPlayers"); p.cartRule = val("cartRule");
               p.cartFee = val("cartFee"); p.caddieRule = val("caddieRule"); p.caddieFee = val("caddieFee");
               p.applyUntil = untilIso(val("applyUntil")); p.cancelTerms = val("cancelTerms"); }
      var eb = f.querySelector('button[type="submit"]'); busy(eb, true);
      call("edit_teetime", p).then(function(){ return reload(true); })
        .catch(function(err){ busy(eb, false); sayIn(li, window.amErrText(err)); });
      return;
    }
    var bl = f.closest("li[data-bk]");
    if(bl && (f.classList.contains("tb-nf") || f.classList.contains("tb-pcf"))){
      var sb = f.querySelector('button[type="submit"]'); busy(sb, true);
      call("move_teebook", { id: bl.getAttribute("data-bk"),
                             state: f.classList.contains("tb-nf") ? "rejected" : "pcanceled", why: val("why") })
        .then(function(){ return reload(true); })
        .catch(function(err){ busy(sb, false); sayIn(bl, window.amErrText(err)); });
    }
  });

  window.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.signedIn || !a.provider) return;
    A = a;
    return Promise.all([
      get("provider?select=id,name,state,regions&id=eq." + encodeURIComponent(a.provider) + "&limit=1"),
      /* ⚠️ 0085 가 올라갔는지 — 새 칸을 한 번 묻습니다(없으면 예전 화면 그대로) */
      get("teetime?select=id,price_unit&limit=1")
    ]).then(function(r){
      PV = (r[0] && r[0][0]) || null;
      V85 = Array.isArray(r[1]);
      return reload(false);
    });
  }).catch(function(){});
})();

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
  /* ⚠️ `course` 는 메인의 찾는 칸이 보내는 열쇠입니다 — 여기 없으면
     `val("course")` 가 읽을 칸이 없어 조용히 안 걸립니다. */
  var S = { rg:"", d:"", course:"", t:"", p:"" };
  /* 티오프 시간대 — ⚠️ 말과 경계는 `js/data/deal.js` 의 `AM_TEE_BAND`
     **한 곳**이고 메인의 찾는 칸이 같은 줄을 읽습니다. 두 곳에 적으면
     "오전" 이 화면마다 다른 시각을 가리킵니다.
     ⚠️⚠️ **조인에는 안 냅니다** — `joinroom.tee` 가 자유 글자라
     숫자로 견줄 수가 없습니다(절대 규칙 5).
     ⚠️⚠️ **부를 때마다 읽습니다** — 불러올 때 담아 두면 스크립트 차례가
     바뀌는 날 그 칸이 조용히 사라집니다(에러 0줄). */
  function bands(){
    return (KIND === "join") ? [] : (window.AM_TEE_BAND || []);
  }
  var B = window.WOW_BIZ || {};
  var KEEP   = String(B.bookKeep || "");
  var SEARCH = Number(B.teeSearch) || 0;   /* 달력으로 찾을 수 있는 날 수 */
  var AHEAD  = Number(B.teeAhead)  || 0;   /* 표가 담는 끝 */
  var BOARD  = Number(B.teeBoard)  || 0;   /* 메인 현황표가 내는 날 수 */

  var REG = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });
  /* ⚠️⚠️ **못 찾은 키를 그대로 찍지 않습니다**(지시 6번) — 전에는
     `String(k)` 라 지역 키가 손님 화면에 날것으로 나갔습니다. 중립
     문구를 내고 누락은 `console.warn` 으로 운영자에게만 갑니다. */
  function rgName(k){
    return window.amKeyName ? window.amKeyName(REG, k, "지역") : "";
  }

  /* ⚠️⚠️ **한국 날짜**로 셉니다 (UTC 로 지으면 새벽에 하루 밀립니다) */
  function kstISO(plusDays){
    var t = Date.now() + 9 * 3600 * 1000 + (plusDays || 0) * 86400000;
    return new Date(t).toISOString().slice(0, 10);
  }
  function day(iso){
    /* ⚠️⚠️⚠️ **글자를 그대로 읽습니다** — 전에는 `"+09:00"` 으로 지어 놓고
       `getMonth()` · `getDate()` 로 꺼냈는데, 그 둘은 **보는 분 기계의
       시간대**로 돌려줍니다. 한국 밖(또는 시간대가 UTC 인 기계)에서
       보시면 **하루 앞으로** 찍혔습니다 — 11-08 자리가 "11월 7일" 로
       보였고, 그러면 손님이 **다른 날짜를 예약**하십니다.
       지금은 `Z` 로 읽고 `getUTC*` 로 꺼냅니다 — 보는 분의 시간대가
       어디든 **적힌 그 날짜 그대로** 나옵니다. */
    var d = new Date(String(iso) + "T00:00:00Z");
    if(isNaN(d.getTime())) return String(iso || "");
    var W = ["일","월","화","수","목","금","토"];
    return (d.getUTCMonth() + 1) + "월 " + d.getUTCDate() + "일(" + W[d.getUTCDay()] + ")";
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

  /* ── 날짜 띠 ───────────────────────────────────
     ⚠️⚠️ 메인 현황표의 **가로 줄과 같은 날짜**를 여기서도 냅니다 — 칸을
     눌러 들어오신 분이 다른 날을 보시려고 **달력을 여는 것**이 아니라
     한 번 누르면 가게 합니다 (시안 그대로).
     ⚠️⚠️⚠️ **단추로만 만들지 않습니다** — 자바스크립트가 꺼진 손님 · 봇에게는
     눌러도 아무 일이 안 나는 칸이 됩니다(절대 규칙 5). 링크로 두고 눌림을
     가로채서 주소만 바꿉니다 — 그래야 주소를 복사해 보내도 같은 화면입니다.
     ⚠️ `teeBoard` 가 비면 띠를 **안 냅니다**(우리가 날 수를 지어내지 않습니다). */
  function myUrl(d){
    var q = [];
    if(S.rg) q.push("rg=" + encodeURIComponent(S.rg));
    if(d)    q.push("d="  + encodeURIComponent(d));
    if(S.course) q.push("course=" + encodeURIComponent(S.course));
    /* ⚠️ 날짜 띠를 눌러도 **고르신 시간대는 그대로** 들고 갑니다 */
    if(S.t) q.push("t=" + encodeURIComponent(S.t));
    if(S.p) q.push("p=" + encodeURIComponent(S.p));
    return window.location.pathname + (q.length ? "?" + q.join("&") : "");
  }
  function shortDay(iso){
    var dt = new Date(String(iso) + "T00:00:00Z");   /* ⚠️ 위와 같은 까닭 */
    if(isNaN(dt.getTime())) return String(iso || "");
    var W = ["일","월","화","수","목","금","토"];
    return (dt.getUTCMonth() + 1) + "/" + dt.getUTCDate() + "(" + W[dt.getUTCDay()] + ")";
  }
  function dayStrip(){
    if(!BOARD) return "";
    var out = '<a class="tfd-b' + (S.d ? "" : " tfd-on") + '" href="' +
      esc(myUrl("")) + '" data-tfd="">전체</a>';
    for(var i = 0; i < BOARD; i++){
      var iso = kstISO(i);
      out += '<a class="tfd-b' + (S.d === iso ? " tfd-on" : "") + '" href="' +
        esc(myUrl(iso)) + '" data-tfd="' + esc(iso) + '">' +
        esc(shortDay(iso)) + '</a>';
    }
    return '<nav class="tfd" aria-label="라운드 날짜로 추리기">' + out + '</nav>';
  }

  /* ── 거르개 ─────────────────────────────────────────────────────── */
  function bar(){
    /* ⚠️⚠️⚠️ **지역 묶음으로 거릅니다** — 메인의 현황표가 묶음 단위로
       세고 그 칸이 `?rg=<묶음>` 으로 보냅니다. 여기서 지역 하나로 받으면
       **표의 숫자와 목록의 줄 수가 달라집니다** (지시서 §5). 묶는 규칙은
       `js/data/regions.js` 의 `AM_REGION_ZONES` **한 곳**입니다. */
    /* ⚠️ 고르개는 **자세한 이름**입니다(amZoneLong) — 메인 찾는 칸과
       같은 함수를 읽습니다(두 곳에 이으면 한쪽만 고치는 날 어긋납니다). */
    var regs = (window.AM_REGION_ZONES || []).map(function(z){
      return '<option value="' + esc(z.key) + '"' +
        (S.rg === z.key ? " selected" : "") + '>' +
        esc(window.amZoneLong(z.key)) + '</option>';
    }).join("");
    return dayStrip() +
      '<form class="jform tf-bar" id="ttf-find">' +
      '<div class="jrow"><label for="tf-d">라운드 날짜</label>' +
      '<input id="tf-d" name="d" type="date" value="' + esc(S.d) + '" ' +
        'min="' + esc(kstISO(0)) + '"' +
        /* ⚠️⚠️⚠️ **달력 끝은 `teeSearch`(60일)가 아니라 `teeAhead`(90일)
           입니다** (§5 · 2026-11-07). 60일에서 막아 두면, 70일 뒤를
           치시려는 분은 그 날짜를 **말할 자리조차 없습니다** — 아무
           안내도 없이 막힌 달력이고 그건 막다른 길입니다(절대 규칙 2).
           61~90일은 목록으로 보여 드리지 않고 **사전 상담으로** 받는
           것이 정책이므로, 날짜는 받고 `load()` 가 그 자리에서
           상담으로 보냅니다. ⚠️ `teeAhead` 가 비면 `teeSearch` 로
           떨어집니다 (둘 다 비면 달력 끝을 안 겁니다). */
        ((AHEAD || SEARCH)
          ? ' max="' + esc(kstISO(AHEAD || SEARCH)) + '"' : '') + '></div>' +
      /* ⚠️⚠️ **골프장 이름으로 찾기** (확정 시안 ①) — 전에는 메인에서
         고른 **이름이 정확히 같을 때만**(`eq.`) 걸려서, 「남서울」만
         치면 0건이었습니다. 지금은 서버가 `ilike` 로 찾습니다.
         ⚠️ 찾기도 **서버**가 합니다 — 백 줄만 받아 화면에서 찾으면 그
         백 줄 밖의 자리가 영영 안 나옵니다. */
      '<div class="jrow jrow-full tf-q"><label for="tf-course">골프장 이름</label>' +
      '<input id="tf-course" name="course" type="search" maxlength="40" ' +
        'value="' + esc(S.course) + '" placeholder="골프장 이름으로 찾기"></div>' +
      '<div class="jrow"><label for="tf-rg">지역</label>' +
      '<select id="tf-rg" name="rg"><option value="">전체 지역</option>' +
        regs + '</select></div>' +
      /* 티오프 시간대 — ⚠️ 부킹에만 섭니다 (조인이면 빈 배열입니다) */
      (bands().length
        ? '<div class="jrow"><label for="tf-t">시간대</label>' +
          '<select id="tf-t" name="t"><option value="">전체 시간</option>' +
          bands().map(function(b){
            return '<option value="' + esc(b.key) + '"' +
              (S.t === b.key ? " selected" : "") + '>' + esc(b.name) +
              ' ' + esc(b.lead) + '</option>';
          }).join("") + '</select></div>'
        : "") +
      /* 가격(1인 그린피) — ⚠️ **값을 안 올린 자리는 빠집니다**(null 과
         견주는 순간 빠집니다). 화면이 0건 상자에서 그 사실을 적습니다. */
      '<div class="jrow"><label for="tf-p">가격</label>' +
      '<select id="tf-p" name="p"><option value="">전체 가격</option>' +
        (window.AM_TEE_PRICE || []).map(function(x){
          return '<option value="' + esc(x.key) + '"' +
            (S.p === x.key ? " selected" : "") + '>' + esc(x.name) + '</option>';
        }).join("") + '</select></div>' +
      '<div class="jrow tf-go">' +
      '<button type="submit" class="btn btn-pri">자리 찾기</button>' +
      (S.rg || S.d || S.t || S.course || S.p
        ? '<button type="button" class="btn btn-line tf-all">조건 지우기</button>'
        : '') +
      '</div></form>';
  }

  /* ── 자리 한 줄 ─────────────────────────────────────────────────── */
  /* ── 티타임 카드 (확정 시안 ① · 2026-11-13) ──────────────────────
     ⚠️⚠️⚠️ **사진을 깔지 않습니다** — 골프장 사진을 담는 칸이 어디에도
     없습니다(0066 이 제휴가 필요한 값에 칸을 안 만든 그 자리). 남의
     사진이나 분류 사진을 깔면 **그 골프장인 것처럼** 보입니다(절대
     규칙 1 · 업체 카드 · 매물 카드와 같은 규칙) — **아이콘 타일**입니다.
     ⚠️⚠️ 「업체 확인 후 확정」은 시안의 말이고 **우리 코드의 참**입니다 —
     신청은 `applied` 로 들어가고 확정은 업체만 합니다(0060 · 지시서 §6).
     ⚠️⚠️ **「카트 · 캐디 별도」라고 단정하지 않습니다** — 그린피에 무엇이
     포함되는지 우리는 **모릅니다**. 포함 여부를 업체에 확인하시라고
     적습니다(모르는 것을 적으면 지어낸 약속입니다 · 절대 규칙 5). */
  function row(t){
    var fee = window.amTeeFee(t.green_fee);
    var left = Number(t.left_n);
    /* ⚠️ `tf-i` 를 **그대로 둡니다** — 그 이름으로 세는 검사가
       넷 있습니다(이름을 갈면 그 자리가 조용히 0건이 됩니다). */
    return '<li class="tf-i tfc" data-tee="' + esc(t.id) + '">' +
      '<span class="tfc-ph" aria-hidden="true">' + window.icon("flag", 26) + '</span>' +
      '<div class="tfc-b">' +
        '<p class="tfc-n">' + esc(t.course) + '</p>' +
        '<p class="tfc-rg">' + window.icon("pin", 14) + esc(rgName(t.region)) + '</p>' +
        '<p class="tfc-when">' + window.icon("cal", 14) +
          '<b>' + esc(day(t.play_at)) + '</b>' +
          (hhmm(t.tee_at)
            ? '<span class="tfc-sep">·</span>' + window.icon("clock", 14) +
              esc(hhmm(t.tee_at))
            : '') +
        '</p>' +
        '<p class="tfc-m">' +
          /* ⚠️⚠️ **상호와 전화번호는 공개가 맞는 값입니다** — 사업자
             신원정보(제20조 제2항)이거나 업체가 공개를 고른 예약 문의
             번호입니다. 배정 담당자 직통은 여기 안 옵니다 (0013). */
          '<span class="tfc-pv">' + esc(t.provider_name) + '</span>' +
          (t.tel ? '<a class="tfc-tel" href="tel:' + esc(t.tel) + '">' +
                   esc(t.tel) + '</a>' : '') +
          (t.holes ? '<span>' + esc(String(t.holes)) + '홀</span>' : '') +
          '<span>' + (left > 0 ? '남은 자리 ' + esc(String(left)) : '자리 찼습니다') +
          '</span>' +
        '</p>' +
        (t.note ? '<p class="tfc-note">' + esc(t.note) + '</p>' : '') +
      '</div>' +
      '<div class="tfc-r">' +
        '<span class="tfc-badge">업체 확인 후 확정</span>' +
        (fee
          ? '<p class="tfc-fee"><i>1인</i> ' + esc(fee) + '</p>' +
            '<p class="tfc-fee-x">카트 · 캐디 비용이 포함되는지는 ' +
            '업체에 확인해 주세요.</p>'
          /* ⚠️ 값을 안 올린 자리는 **"문의" 를 지어 적지 않습니다** */
          : '<p class="tfc-fee0">그린피가 아직 안 올라왔습니다</p>') +
        (left > 0
          ? '<button type="button" class="btn btn-pt tf-book">예약 신청</button>'
          /* ⚠️ 자리가 찬 곳에는 단추를 **안 냅니다** (눌러도 거절됩니다) */
          : '') +
      '</div>' +
      '<div class="tfc-bx tf-bx"></div>' +
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
      (S.rg || S.d || S.t || S.course || S.p
        ? '<h3>그 조건에 맞는 ' + esc(k) + '이 없습니다.</h3>' +
          '<p>날짜나 지역을 넓혀 보세요. 지어낸 자리를 채우지 않습니다.' +
          /* ⚠️ 시간대를 고르면 **시각이 안 적힌 자리**가 빠집니다 —
             손님이 "없다" 로 읽지 않게 그 사실을 적습니다. */
          (S.t ? ' 시간대를 고르시면 <b>티오프 시각이 적힌 자리만</b> 나옵니다.' : '') +
          /* ⚠️ 값을 안 올린 자리가 빠진다는 것을 **그 자리에서** 말합니다 */
          (S.p ? ' 가격으로 좁히시면 <b>그린피가 적힌 자리만</b> 나옵니다.' : '') +
          '</p>' +
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
    /* ⚠️⚠️⚠️ **61~90일은 묻지 않고 사전 상담으로 보냅니다** (§5).
       ⚠️ 여기서 그냥 질의하면 **0건**이 나오고, 손님은 "그날 자리가
       없다" 로 읽습니다 — 실제로는 **목록으로 보여 드리지 않는 구간**
       입니다. 없는 것과 안 보여 주는 것은 다릅니다(절대 규칙 5 ·
       "못 읽었으면 0건이라고 말하지 않습니다" 와 같은 결).
       ⚠️ 막다른 길로 두지 않습니다 — 그 자리에서 상담 요청으로
       보냅니다(절대 규칙 2).
       ⚠️ `teeSearch` 가 비면 이 가지를 **안 탑니다** (운영 정책이
       없는데 우리가 선을 지어내지 않습니다). */
    if(S.d && SEARCH && S.d > kstISO(SEARCH)){
      box.innerHTML = bar() +
        '<div class="none"><h3>이 날짜는 미리 상담으로 잡아 드립니다.</h3>' +
        '<p>고르신 날짜는 <b>' + esc(day(S.d)) + '</b> 입니다. ' +
        '자리 목록은 오늘부터 ' + esc(String(SEARCH)) + '일까지 보여 드리고, ' +
        '그 뒤 날짜는 담당자가 골프장에 확인해 드립니다.</p>' +
        '<a class="btn btn-pt" href="/match?cat=booking">부킹 상담 요청하기</a>' +
        '</div>';
      return Promise.resolve();
    }

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
    /* ⚠️⚠️ 메인의 찾는 칸이 보내는 열쇠입니다 — **받는 쪽이 없으면
       고르는 순간 아무 일이 안 납니다**(화면이 보내는 열쇠와 받는
       쪽이 달라 거르개가 아무것도 안 걸렀던 그 자리). 거르는 것은
       서버입니다 — 쉰 줄만 받아 화면에서 거르면 조건에 맞는 것이
       그 쉰 줄 밖에 있을 때 0건으로 보입니다. */
    /* ⚠️⚠️ **`eq.` 에서 `ilike` 로 바꿨습니다**(확정 시안 ①) — 전에는
       이름이 **정확히 같을 때만** 걸려서 「남서울」만 치면 0건이었습니다.
       ⚠️ `*` 는 PostgREST 의 자리표이고 손님 글자는 그대로 갑니다. */
    if(S.course) qs.push("course=ilike." +
      encodeURIComponent("*" + S.course + "*"));
    /* ⚠️⚠️ 가격(1인 그린피) — 아래를 닫고 위를 여달니다(gte · lt).
       ⚠️ **값을 안 올린 자리는 빠집니다**(null 과 견주는 순간 빠집니다) —
       0건 안내가 그 사실을 적습니다. */
    var pb = window.amTeePriceBand ? window.amTeePriceBand(S.p) : null;
    if(pb){
      if(pb.from !== null && pb.from !== undefined)
        qs.push("green_fee=gte." + encodeURIComponent(String(pb.from)));
      if(pb.to !== null && pb.to !== undefined)
        qs.push("green_fee=lt." + encodeURIComponent(String(pb.to)));
    }
    /* ⚠️⚠️ **시간대도 서버가 거릅니다** — 백 줄만 받아 화면에서 거르면
       맞는 자리가 그 백 줄 밖에 있을 때 0건으로 보입니다.
       ⚠️ 아래를 열고 위를 닫습니다(gte · lt) — 둘 다 닫으면 12:00 이
       오전에도 오후에도 걸립니다. `to` 가 없으면 위를 안 겁니다.
       ⚠️ `tee_at` 이 빈 자리는 여기서 빠집니다(비교가 null 입니다) —
       화면이 그 사실을 적습니다. */
    var bd = window.amTeeBand ? window.amTeeBand(S.t) : null;
    if(bd){
      qs.push("tee_at=gte." + encodeURIComponent(bd.from));
      if(bd.to) qs.push("tee_at=lt." + encodeURIComponent(bd.to));
    }
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
      S.d = val("d"); S.rg = val("rg"); S.course = val("course");
      S.t = val("t"); S.p = val("p");
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
    if(t.closest(".tf-all")){
      S.rg = ""; S.d = ""; S.course = ""; S.t = ""; S.p = "";
      return void load();
    }
    /* 날짜 띠 — ⚠️ 주소를 **같이 바꿉니다**(뒤로 가기도 됩니다) */
    var dd = t.closest("[data-tfd]");
    if(dd){
      e.preventDefault();
      S.d = dd.getAttribute("data-tfd") || "";
      try{ window.history.pushState(null, "", myUrl(S.d)); }catch(_){}
      return void load();
    }
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
      /* ⚠️ 골프장은 **글자 그대로** 받습니다 (목록이 DB 에서 오므로
         여기서 맞는 값인지 가릴 길이 없습니다 — 틀리면 0건입니다). */
      var cs = u.get("course");
      if(cs) S.course = String(cs).slice(0, 80);
      /* ⚠️ 시간대는 **아는 값만** 받습니다 — 모르는 값을 그대로 쓰면
         영원히 0건인 화면이 됩니다(절대 규칙 1). */
      var tb = (u.get("t") || "").trim();
      if(tb && window.amTeeBand && window.amTeeBand(tb)) S.t = tb;
      /* ⚠️ 가격대도 **아는 값만** 받습니다 — 모르는 값을 그대로 쓰면
         영원히 0건인 화면이 됩니다(절대 규칙 1). */
      var pv = (u.get("p") || "").trim();
      if(pv && window.amTeePriceBand && window.amTeePriceBand(pv)) S.p = pv;
    }catch(e){ }
    return load();
  }).catch(function(){});
})();

/* ════════════════════════════════════════════════════════════════════
   골프 인력 · 비즈니스 — /cat/career 에서만 돕니다 (DB 는 0048)

   ⚠️⚠️⚠️ **왜 이 화면이 생겼나.** `/cat/career` 는 막다른 길이었습니다 —
   하위분류 여섯 이름만 보이고, 구인 글을 올릴 자리도 지원할 자리도
   없었습니다. 막다른 분류 셋 가운데 마지막입니다 (조인 0046 ·
   커뮤니티 0047 · 여기).

   ⚠️⚠️ **목록은 브라우저가 그립니다** — 빌드가 못 찍습니다. 글은 아무
   때나 올라오므로 빌드 때 찍으면 배포할 때만 바뀝니다. 그래서
   **설명은 빌드가**(크롤러 · 자바스크립트 꺼진 분이 읽을 몫),
   **목록은 브라우저가** 그립니다.
   ⚠️ 그 설명 글을 지우면 봇에게는 **빈 화면**이 됩니다.

   ⚠️⚠️⚠️ **연락처는 여기서 한 번도 안 보입니다.** 목록이 읽는
   `v_job_open` 에는 연락처 칸이 **아예 없습니다**. 수락된 뒤 서로
   **따로 동의**해야 오가고, 그 자리는 `/my` 입니다 (0048 · 제17조
   제2항). 구직 글의 번호를 긁어 가는 것을 막는 자리입니다.

   ⚠️⚠️ **거르개를 목록 안에 둡니다.** 이 목록은 자바스크립트가 있어야
   보이므로, 거르개도 같이 그립니다 — 빌드가 찍어 두면 자바스크립트가
   꺼진 분에게 **눌러도 아무 일이 안 나는 칸**이 됩니다 (절대 규칙 5).
   ⚠️ 대신 **주소를 같이 바꿉니다**(`?k=`) — 복사해 보내도 같은 화면이고
   뒤로 가기도 됩니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var list = document.getElementById("joblist");
  if(!list || !window.amAuthAsk) return;

  var esc  = window.esc;
  var KEEP = (window.WOW_BIZ || {}).careerKeep || "";
  var REG  = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });

  /* ⚠️⚠️ **하위분류를 여기 다시 적지 않습니다** — `js/data/catalog.js`
     의 `career` 항목을 읽습니다. 두 곳에 적으면 하위분류가 느는 날
     화면은 보내는데 DB 가 거절합니다. */
  var SUBS = [];
  (window.AM_CATS || []).forEach(function(c){
    if(c.key === "career") SUBS = c.items || [];
  });
  var SUBNAME = {};
  /* 0078 — ⚠️ 로그인하신 분의 저장 목록. **서버가 돌려준 값**으로만
     바꿉니다(화면이 먼저 뒤집으면 거절당한 날 켜진 채 남습니다). */
  var ME = null, FAV = {};
  SUBS.forEach(function(i){ SUBNAME[i.key] = i.name; });

  /* 갈래 — ⚠️⚠️⚠️ **2026-11-08 에 `js/data/deal.js` 로 꺼냈습니다.**
     그전에는 이 세 줄이 여기에만 있어 **아무도 DB 와 맞춰 보지
     않았습니다** — 조인이 상태 말을 `js/myjoin.js` 안에 들고 있다가
     영문 `closed` 가 손님 화면에 찍혔던 그 자리와 같은 꼴입니다.
     현황표(0067)가 같은 목록을 읽게 되면서 두 곳이 될 차례였고,
     지금은 `check-deal` 이 0048 의 check 와 빌드마다 맞춰 봅니다.
     ⚠️⚠️ **불러올 때 담아 두지 않습니다** — 스크립트 차례가 바뀌는 날
     빈 배열이 되어 갈래 칸이 **조용히 안 그려집니다**(에러 0줄). */
  function kinds(){ return window.AM_JOB_KIND || []; }
  function kname(k){
    var x = window.amJobKind ? window.amJobKind(k) : null;
    return x ? x.name : "";
  }

  function dayText(iso){
    var d = new Date(iso + "T00:00:00");
    if(isNaN(d.getTime())) return iso;
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일";
  }
  function when(iso){
    var d = new Date(iso);
    if(isNaN(d.getTime())) return "";
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일";
  }

  /* 지금 걸린 거르개 — 주소에서 읽습니다 (복사해 보내도 같은 화면) */
  function nowKind(){
    var m = /[?&]k=([a-z]+)/.exec(window.location.search || "");
    var k = m ? m[1] : "";
    return kname(k) ? k : "";
  }
  /* ⚠️⚠️ 하위분류로 좁혀 오신 길 (`?s=` · 지시서 §4) — 분류 화면의
     하위 목록이 `amSubUrl()` 로 보냅니다. 전에는 하위 여섯이 **글로만**
     있어서 거기까지 가는 길이 없었습니다.
     ⚠️ 모르는 하위 키는 **버립니다** — 주소를 손으로 고쳐 오시면
     아무것도 안 걸리는 화면이 되는데, 그러면 "글이 없다" 로 읽힙니다. */
  function nowSub(){
    var m = /[?&]s=([a-z0-9-]+)/.exec(window.location.search || "");
    var k = m ? m[1] : "";
    return SUBNAME[k] ? k : "";
  }
  /* ⚠️⚠️⚠️ **지역으로 좁히는 길이 2026-11-08 까지 없었습니다** (`?rg=`).
     0048 은 `jobpost.region` 을 받아 놓고 목록은 그 칸으로 좁히지
     않았습니다 — 서울 사는 분이 제주 구인글까지 쉰 줄을 밀어 내려
     가셨습니다 (조인 거르개가 한 개도 없었던 그 자리).
     ⚠️⚠️ 현황표(0067)가 칸을 누르면 이 주소로 보냅니다 — 받는 쪽이 이
     열쇠를 모르면 **칸은 그려지는데 눌러도 안 걸립니다** (절대 규칙 5).
     ⚠️ 모르는 지역 키는 **버립니다** — 주소를 손으로 고쳐 오시면
     아무것도 안 걸리는 화면이 되는데, 그러면 "글이 없다" 로 읽힙니다. */
  function rgName(k){
    return window.amRegionLabel ? window.amRegionLabel(k) : "";
  }
  /* ⚠️⚠️⚠️ **0072 가 칸 넷을 더해 놓고 받는 쪽이 없었습니다**
     (`role` · `emp_type` · `pay_type` · `pay_min`). 칸은 DB 에 있는데
     화면이 그 칸으로 좁히지 않으면 시안 ⑨ 의 왼쪽 「상세 필터」는
     **골라도 아무것도 안 걸러 주는 칸**이 됩니다 (절대 규칙 5).
     ⚠️ 모르는 키는 **버립니다** — 주소를 손으로 고쳐 오시면 아무것도
     안 걸리는 화면이 되는데, 그러면 "글이 없다" 로 읽힙니다. */
  function oneOf(L, k){
    for(var i = 0; i < L.length; i++) if(L[i].key === k) return k;
    return "";
  }
  function nowRole(){
    var m = /[?&]ro=([a-z0-9-]+)/.exec(window.location.search || "");
    return oneOf(window.AM_JOB_ROLE || [], m ? m[1] : "");
  }
  function nowEmp(){
    var m = /[?&]em=([a-z0-9-]+)/.exec(window.location.search || "");
    return oneOf(window.AM_JOB_EMP || [], m ? m[1] : "");
  }
  function nowPay(){
    var m = /[?&]py=([a-z_]+)/.exec(window.location.search || "");
    return oneOf(window.AM_JOB_PAY || [], m ? m[1] : "");
  }
  function nowQ(){
    var m = /[?&]q=([^&]*)/.exec(window.location.search || "");
    if(!m) return "";
    try{ return decodeURIComponent(m[1].replace(/\+/g, " ")).trim(); }
    catch(e){ return ""; }
  }
  /* 공고 상세 — ⚠️⚠️ 시안 ⑨ 의 「공고 상세 >」가 갈 자리입니다.
     ⚠️ 보기를 새로 안 만들었습니다 — `v_job_open` 에 `?id=eq.` 로 한
     줄만 받습니다 (공개로 나가는 길이 둘이 되면 한쪽만 고치는 날
     한쪽만 샙니다 · 0069 에서 세운 규칙). */
  function nowView(){
    var m = /[?&]v=([0-9a-f-]{36})/.exec(window.location.search || "");
    return m ? m[1] : "";
  }
  /* 주소를 짓는 자리 **한 곳** — 열쇠가 늘 때 여기만 고칩니다
     (두 곳에 적으면 조건 하나가 조용히 풀립니다) */
  function urlOf(f){
    var q = [];
    if(f.k)  q.push("k="  + encodeURIComponent(f.k));
    if(f.sub)q.push("s="  + encodeURIComponent(f.sub));
    if(f.rg) q.push("rg=" + encodeURIComponent(f.rg));
    if(f.ro) q.push("ro=" + encodeURIComponent(f.ro));
    if(f.em) q.push("em=" + encodeURIComponent(f.em));
    if(f.py) q.push("py=" + encodeURIComponent(f.py));
    /* ⚠️⚠️⚠️ **금액은 급여 갈래를 고르셨을 때만** 실립니다 — 월급 ·
       연봉 · 시급을 한 칸으로 견주면 「300만원 이상」이 시급 300만원과
       연봉 300만원을 같은 줄에 세웁니다. 거는 자리는 `payMin()` 한
       곳이고 거기서 `py` 를 봅니다. */
    if(f.py && f.pm) q.push("pm=" + encodeURIComponent(f.pm));
    if(f.q)  q.push("q="  + encodeURIComponent(f.q));
    if(f.v)  q.push("v="  + encodeURIComponent(f.v));
    return "/cat/career" + (q.length ? "?" + q.join("&") : "");
  }
  function nowAll(){
    return { k:nowKind(), sub:nowSub(), rg:nowRg(), ro:nowRole(),
             em:nowEmp(), py:nowPay(), pm:nowPayMin(), q:nowQ(), v:nowView() };
  }
  /* 최소 금액 — ⚠️⚠️ **급여 갈래가 없으면 0 입니다**(단위를 모르는
     숫자로는 견줄 수가 없습니다). 숫자가 아니거나 0 이하면 안 겁니다. */
  function nowPayMin(){
    var m = /[?&]pm=(\d{1,12})/.exec(window.location.search || "");
    var n = m ? Number(m[1]) : 0;
    return (isFinite(n) && n > 0) ? String(n) : "";
  }
  function nowRg(){
    var m = /[?&]rg=([a-z0-9-]+)/.exec(window.location.search || "");
    var k = m ? m[1] : "";
    /* ⚠️ 묶음도 시 · 도도 받습니다 — 푸는 규칙 한 곳으로 가립니다 */
    return (window.amRegionsFor && window.amRegionsFor(k).length) ? k : "";
  }

  function get(a, path){
    return fetch(a.conf.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : []; });
  }
  function call(a, fn, p){
    return fetch(a.conf.url + "/rest/v1/rpc/" + fn, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json", apikey:a.conf.anonKey },
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

  /* ── 북마크 (0078) ─────────────────────────────────────────────
     ⚠️⚠️⚠️ **찜 수를 공개하지 않습니다** — 0069 가 중고 매물에서 세운
     규칙 그대로입니다. 세어 낼 수야 있지만 「인기」로 읽히고 검증할
     길이 없으며, 누가 무엇을 저장했는지는 **행동 기록**이라 올리신
     분에게도 · 운영자에게도 안 냅니다. `v_job_open` 에 `fav_n` 칸이
     **아예 없습니다**.
     ⚠️⚠️ **로그인하지 않으셨으면 단추를 안 냅니다** — 그리면 눌러도
     거절되는 칸입니다(절대 규칙 5). 대신 상세에서 로그인 길을 냅니다.
     ⚠️ 글자를 짓는 자리는 `favLabel()` **한 곳**입니다. */
  /* 받은 지원 · 제안 수 — ⚠️⚠️⚠️ **못 읽었으면 그 줄을 안 찍습니다.**
     전에는 `String(j.apply_n)` 이라 그 칸이 안 오면 손님 화면에
     **「받은 것 undefined」** 가 그대로 찍혔습니다(2026-11-12 에 찍어
     보고 알았습니다 · 절대 규칙 2).
     ⚠️ **0건도 안 찍습니다** — 「받은 것 0」은 우리가 만든 평가이고,
     새로 올리신 분의 공고가 전부 인기 없는 글로 보입니다(0061 이
     답 수를 0건이면 안 찍는 그 까닭).
     ⚠️ 센 값은 공개 보기가 **세어서** 냅니다(칸에 저장하지 않습니다). */
  function applyN(j){
    var n = Number(j && j.apply_n);
    if(!isFinite(n) || n <= 0) return "";
    return '<span class="jbc-n">받은 것 ' + esc(String(n)) + '</span>';
  }

  function favLabel(on){ return on ? "저장 해제" : "저장"; }
  function favBtn(j){
    if(!ME || !ME.signedIn) return "";
    var on = FAV[j.id] === true;
    return '<button type="button" class="btn btn-sm jbc-fav' +
      (on ? " on" : "") + '" data-fav="' + esc(j.id) + '" ' +
      'aria-pressed="' + (on ? "true" : "false") + '">' +
      (window.icon ? window.icon("heart", 14) : "") +
      esc(favLabel(on)) + '</button>';
  }

  function card(j){
    /* ⚠️⚠️ **업체 이름은 올리신 분이 고르셨을 때만** 옵니다
       (`pro_name`). 없으면 가린 이름(`김**`)입니다 — 글은 공개지만
       글쓴이는 공개가 아닙니다. */
    var who = j.pro_name ? j.pro_name : j.who;
    /* ⚠️ 시안 ⑨ 의 줄 — 제목 아래에 **지역 · 고용 형태 · 급여** 한 줄,
       그리고 오른쪽에 「공고 상세 >」. 본문은 **상세에서** 냅니다
       (목록에 본문을 다 펴 놓으면 한 화면에 서너 건밖에 안 들어갑니다). */
    var meta = [window.amKeyName(REG, j.region, "지역"),
                nameOf(window.AM_JOB_EMP, j.emp_type, "고용 형태"),
                (window.amJobPay ? window.amJobPay(j) : null)]
      .filter(Boolean).join(" · ");
    return '<li class="jbc" data-id="' + esc(j.id) + '">' +
      '<div class="jbc-h">' +
        '<h3>' + esc(j.title) + '</h3>' +
        '<span class="jbc-k">' + esc(window.amKeyName(kinds(), j.kind, "갈래")) + '</span>' +
      '</div>' +
      /* ⚠️ 값이 없는 칸은 **줄에서 빠집니다** — "협의" 를 우리가 지어
         적지 않습니다(절대 규칙 1 · 2). */
      (meta ? '<p class="jbc-m">' + esc(meta) + '</p>' : '') +
      '<p class="jbc-w2">' + esc(window.amKeyName(SUBNAME, j.sub, "하위분류")) + ' · ' +
        esc(who) + ' · ' + esc(when(j.created_at)) + '</p>' +
      (j.close_at ? '<p class="jbc-d">마감 ' + esc(dayText(j.close_at)) + '</p>' : '') +
      /* ⚠️⚠️ **등록자 확인 여부**를 그 자리에서 말합니다 — 개인과
         사업자가 섞여 있으면 구분해 표시해야 합니다(제20조의4 ③).
         ⚠️ 「확인됨」 쪽은 **입점 심사를 거친 업체**일 때만입니다. */
      (j.pro_name
        ? '<p class="jbc-ok">' + (window.icon ? window.icon("check", 13) : "") +
          '입점 업체</p>'
        : '<p class="jbc-no">등록자 확인 필요</p>') +
      '<p class="jbc-act">' +
        '<a class="btn btn-line btn-sm" href="' +
          esc(urlOf(Object.assign({}, nowAll(), { v:j.id }))) + '">공고 상세</a>' +
        favBtn(j) +
        applyN(j) +
      '</p>' +
    '</li>';
  }

  /* ⚠️⚠️ 개인정보보호법 제15조 제2항 — 수집 항목 · 이용 목적 · 보유
     기간을 **동의받는 그 자리에서** 같이 보여 줍니다. 링크로 빼 두면
     "같이 보여 준 것" 이 아닙니다. */
  function consentBox(what){
    return '<div class="jrow jrow-full jconsent">' +
      '<label class="jchk"><input type="checkbox" required> ' +
      '<span>아래 내용으로 개인정보 수집 · 이용에 동의합니다 <b>*</b></span></label>' +
      '<ul class="jterms">' +
        '<li><b>수집 항목</b> 연락처, 적어 주신 글</li>' +
        '<li><b>이용 목적</b> ' + esc(what) + '</li>' +
        '<li><b>보유 기간</b> ' + esc(KEEP) + '</li>' +
        '<li><b>제공</b> 연락처는 <b>수락 뒤 따로 고르셨을 때만</b> ' +
          '그 상대 한 분에게 보입니다. 언제든 다시 닫으실 수 있습니다.</li>' +
      '</ul>' +
      '<p class="jhint">동의하지 않으셔도 다른 기능은 그대로 쓰실 수 있습니다.</p>' +
    '</div>';
  }

  function applyForm(kind){
    var biz = kind === "biz";
    return '<form class="jform jbaf">' +
      '<div class="jrow jrow-full">' +
        '<label>' + (biz ? '제안 내용' : '하실 말씀') + ' <b>*</b></label>' +
        '<textarea name="msg" rows="4" required minlength="5" maxlength="1000" ' +
        'placeholder="' + (biz ? '어떤 제휴 · 거래를 바라시는지 적어 주세요.'
                               : '구력 · 자격 · 가능한 시간 등을 적어 주세요.') +
        '"></textarea>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label>연락처 <b>*</b></label>' +
        '<input name="contact" required maxlength="100" autocomplete="tel" ' +
        'placeholder="전화번호 또는 메신저 아이디">' +
        /* ⚠️⚠️⚠️ 제17조 — 언제 누구에게 가는지를 **적는 그 자리에서** 말합니다 */
        '<span class="jhint">⚠️ 올리신 분에게 <b>바로 가지 않습니다.</b> ' +
        '수락된 뒤 <b>다시 한 번 고르셔야</b> 보입니다.</span>' +
      '</div>' +
      consentBox(biz ? '제안을 전하고 올리신 분과 잇기'
                     : '지원을 전하고 올리신 분과 잇기') +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">보내기</button>' +
        '<button type="button" class="btn btn-line jbaf-x">그만두기</button>' +
        '<p class="jmsg jbafm" hidden></p>' +
      '</div>' +
    '</form>';
  }

  function openForm(hasPro){
    var kd = kinds().map(function(k){
      return '<option value="' + esc(k.key) + '">' + esc(k.name) +
             ' — ' + esc(k.lead) + '</option>';
    }).join("");
    var sb = SUBS.map(function(i){
      return '<option value="' + esc(i.key) + '">' + esc(i.name) + '</option>';
    }).join("");
    var rg = (window.AM_REGIONS || []).map(function(r){
      return '<option value="' + esc(r.key) + '">' + esc(r.name) + '</option>';
    }).join("");
    return '<form id="jbf" class="jform">' +
      '<div class="jrow">' +
        '<label for="b-kind">무엇을 올리시나요 <b>*</b></label>' +
        '<select id="b-kind" name="kind" required>' +
          '<option value="">고르세요</option>' + kd +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="b-sub">분류 <b>*</b></label>' +
        '<select id="b-sub" name="sub" required>' +
          '<option value="">고르세요</option>' + sb +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="b-rg">지역 <b>*</b></label>' +
        '<select id="b-rg" name="region" required>' +
          '<option value="">고르세요</option>' + rg +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="b-close">마감일</label>' +
        '<input id="b-close" name="close_at" type="date">' +
        '<span class="jhint">비워 두시면 직접 마감하실 때까지 보입니다.</span>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="b-title">제목 <b>*</b></label>' +
        '<input id="b-title" name="title" required minlength="2" maxlength="60" ' +
        'placeholder="보기: 주말 캐디 구합니다 (경기 남부)">' +
      '</div>' +
      /* ⚠️⚠️⚠️ **0072 가 칸 넷을 더해 놓고 올리는 양식이 그 칸을 한
         번도 안 보냈습니다** — 그러면 왼쪽 상세 필터로 좁히는 순간
         **모든 공고가 빠집니다**(그 칸이 전부 null 이니까요). 칸을
         만드는 것과 그 칸을 채울 길을 내는 것은 다른 일입니다. */
      '<div class="jrow">' +
        '<label for="b-role">직무 · 역할</label>' +
        '<select id="b-role" name="role">' +
          '<option value="">안 고름</option>' +
          (window.AM_JOB_ROLE || []).map(function(x){
            return '<option value="' + esc(x.key) + '">' + esc(x.name) +
              '</option>'; }).join("") +
        '</select>' +
        '<span class="jhint">고르시면 손님이 그 직무로 좁혀 찾습니다.</span>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="b-emp">고용 형태</label>' +
        '<select id="b-emp" name="emp_type">' +
          '<option value="">안 고름</option>' +
          (window.AM_JOB_EMP || []).map(function(x){
            return '<option value="' + esc(x.key) + '">' + esc(x.name) +
              '</option>'; }).join("") +
        '</select>' +
      '</div>' +
      /* ⚠️⚠️ 금액 갈래는 **갈래마다 고를 수 있는 것이 다릅니다**
         (`amJobPayFor`) — 시설 · 장비 거래에는 급여가 없고 「거래
         희망가」입니다. 못 고르는 것을 그리면 눌러도 거절되는 칸입니다.
         ⚠️ 처음에는 **전부** 그리고, 갈래를 고르시면 그때 좁힙니다. */
      '<div class="jrow">' +
        '<label for="b-ptype">금액 갈래</label>' +
        '<select id="b-ptype" name="pay_type">' +
          '<option value="">안 고름</option>' +
          (window.AM_JOB_PAY || []).map(function(x){
            return '<option value="' + esc(x.key) + '" data-k="' +
              esc((x.kinds || []).join(" ")) + '">' + esc(x.name) +
              '</option>'; }).join("") +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="b-pmin">금액 (원)</label>' +
        '<input id="b-pmin" name="pay_min" inputmode="numeric" ' +
          'maxlength="12" placeholder="보기: 3000000">' +
        /* ⚠️ 0 원도 값입니다 — 거저 넘기시는 시설 · 장비 자리입니다
           (`||` 를 쓰면 그 줄이 사라집니다 · 0056 에서 세운 규칙). */
        '<span class="jhint">숫자만 적어 주세요. 0 원도 받습니다 ' +
          '(거저 드리는 시설 · 장비).</span>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="b-pay">급여 · 조건</label>' +
        '<input id="b-pay" name="pay" maxlength="60" placeholder="보기: 일 12만원">' +
        /* ⚠️ 비우면 화면에서 그 줄이 줄째 빠집니다 — 우리가 "협의" 를
           지어 적지 않습니다 (절대 규칙 2 · 5) */
        '<span class="jhint">비워 두시면 그 줄이 아예 안 나옵니다.</span>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="b-terms">근무 조건</label>' +
        '<input id="b-terms" name="terms" maxlength="200" ' +
        'placeholder="보기: 주 3일 · 오전">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="b-body">내용 <b>*</b></label>' +
        '<textarea id="b-body" name="body" rows="5" required minlength="5" ' +
        'maxlength="2000" placeholder="하시는 일 · 바라시는 것을 적어 주세요."></textarea>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="b-contact">연락처 <b>*</b></label>' +
        '<input id="b-contact" name="contact" required maxlength="100" ' +
        'autocomplete="tel" placeholder="전화번호 또는 메신저 아이디">' +
        '<span class="jhint">⚠️ 목록에는 <b>안 나옵니다.</b> ' +
        '지원을 수락하신 뒤 <b>다시 한 번 고르셔야</b> 그분에게만 보입니다.</span>' +
      '</div>' +
      /* ⚠️⚠️ **업체 이름으로 올리는 것은 고르는 것입니다.** 승인된
         업체만 되고, 안 고르시면 다른 글과 같이 가린 이름입니다. */
      (hasPro
        ? '<div class="jrow jrow-full">' +
            '<label class="jchk"><input type="checkbox" id="b-aspro" name="as_pro"> ' +
            '<span>업체 이름(상호)으로 올립니다</span></label>' +
            '<span class="jhint">승인된 업체만 됩니다. 안 고르시면 ' +
            '가린 이름(김**)으로 보입니다.</span>' +
          '</div>'
        : '') +
      consentBox('올리신 글을 알리고 지원하신 분과 잇기') +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">글 올리기</button>' +
        '<p id="jbmsg" class="jmsg" hidden></p>' +
      '</div>' +
    '</form>';
  }

  /* 지금 조건 — ⚠️ 하위로 좁혀 오셨으면 **무엇으로 좁혔는지** 말하고
     풀 길을 같이 냅니다 (칸이 없는 조건이라 말해 주지 않으면 손님은
     "글이 없다" 로 읽습니다). */
  function subLine(sub, rg){
    if(!sub && !rg) return "";
    var b = [];
    if(sub) b.push(SUBNAME[sub]);
    if(rg)  b.push(rgName(rg));
    return '<p class="sf-now">' + esc(b.join(" · ")) + ' 글만 보고 있습니다. ' +
      '<a href="/cat/career">조건 지우기</a></p>';
  }

  /* 거르개 — ⚠️⚠️ **단추가 아니라 링크**입니다. 주소를 복사해 보내도
     같은 화면이고 뒤로 가기도 됩니다 (`/search` 에서 배운 자리).
     ⚠️ 모양은 `.chip` 한 곳에서 옵니다 — 거르개 모양을 두 벌로
     적으면 한쪽만 고치는 날 둘이 달라집니다.
     ⚠️ 눌림 표시는 `.chip-on` 과 `aria-current` 둘 다 답니다 (색만
     바꾸면 화면 읽는 기계에는 아무 말도 안 한 것입니다). */
  /* 탭 넷 — ⚠️⚠️ **단추가 아니라 링크**입니다. 주소를 복사해 보내도
     같은 화면이고 뒤로 가기도 됩니다 (`/search` 에서 배운 자리). */
  function tabs(f){
    var one = function(key, name){
      var on = (f.k === key);
      var g = Object.assign({}, f); g.k = key; g.v = "";
      return '<a class="jbtab-a' + (on ? ' on' : '') + '"' +
        (on ? ' aria-current="true"' : '') +
        ' href="' + esc(urlOf(g)) + '" data-k="' + esc(key) + '">' +
        esc(name) + '</a>';
    };
    return '<nav class="jbtab" aria-label="공고 유형">' + one("", "전체") +
      kinds().map(function(x){ return one(x.key, x.name); }).join("") +
    '</nav>';
  }

  /* 왼쪽 상세 필터 — ⚠️⚠️ **양식(form)** 입니다. 자바스크립트가 꺼져도
     GET 으로 그대로 돌고, 켜져 있으면 가로채서 주소만 바꿉니다.
     ⚠️⚠️ **지역은 칸(chip)으로 안 냅니다** — 열일곱이라 거르개 줄에
     놓으면 폰에서 "밀면 보이는 것" 이 됩니다 (머리말 메뉴 넷째가 폰에서
     없는 메뉴였던 그 자리). 고르개 하나로 냅니다. */
  function rail(f){
    var opt = function(L, cur, all){
      return '<option value="">' + esc(all) + '</option>' +
        L.map(function(x){
          return '<option value="' + esc(x.key) + '"' +
            (cur === x.key ? ' selected' : '') + '>' + esc(x.name) +
            '</option>';
        }).join("");
    };
    var rgOpt = '<option value="">전체 지역</option>' +
      '<optgroup label="지역 묶음">' +
      (window.AM_REGION_ZONES || []).map(function(z){
        return '<option value="' + esc(z.key) + '"' +
          (f.rg === z.key ? ' selected' : '') + '>' +
          esc(window.amZoneLong ? window.amZoneLong(z.key) : z.name) + '</option>';
      }).join("") + '</optgroup><optgroup label="시 · 도">' +
      (window.AM_REGIONS || []).map(function(r){
        return '<option value="' + esc(r.key) + '"' +
          (f.rg === r.key ? ' selected' : '') + '>' + esc(r.name) + '</option>';
      }).join("") + '</optgroup>';
    return '<form class="jbrail" id="jbrail" method="get" action="/cat/career">' +
      '<p class="jbrail-h">' + (window.icon ? window.icon("search", 15) : "") +
        '상세 필터</p>' +
      '<p class="jbrail-c"><label for="jb-rg">지역</label>' +
        '<select id="jb-rg" name="rg">' + rgOpt + '</select></p>' +
      '<p class="jbrail-c"><label for="jb-ro">직무 · 역할</label>' +
        '<select id="jb-ro" name="ro">' +
          opt(window.AM_JOB_ROLE || [], f.ro, "전체") + '</select></p>' +
      '<p class="jbrail-c"><label for="jb-em">고용 형태</label>' +
        '<select id="jb-em" name="em">' +
          opt(window.AM_JOB_EMP || [], f.em, "전체") + '</select></p>' +
      /* ⚠️ 급여는 **갈래**로 좁힙니다 — 0048 의 `pay` 는 자유 글자라
         숫자로 못 견줍니다(0072 가 `pay_type` 을 따로 둔 그 까닭). */
      '<p class="jbrail-c"><label for="jb-py">급여 조건</label>' +
        '<select id="jb-py" name="py">' +
          opt(window.AM_JOB_PAY || [], f.py, "전체") + '</select></p>' +
      /* ⚠️⚠️⚠️ **금액 칸은 급여 갈래를 고르셨을 때만** 냅니다 — 월급 ·
         연봉 · 시급을 한 칸으로 받으면 「300만원 이상」이 시급 300만원과
         연봉 300만원을 같은 줄에 세웁니다. 갈래를 안 고르셨을 때는 칸
         대신 **왜 없는지**를 적습니다(빈 칸을 두면 눌러도 아무 일이 안
         나는 칸입니다 · 절대 규칙 5). */
      (f.py
        ? '<p class="jbrail-c"><label for="jb-pm">' +
            esc(nameOf(window.AM_JOB_PAY, f.py, "급여 갈래")) +
            ' 최소 금액</label>' +
            '<input id="jb-pm" name="pm" inputmode="numeric" maxlength="12" ' +
              'placeholder="예: 3000000" value="' + esc(f.pm || "") + '">' +
            '<span class="jbrail-n">같은 갈래끼리만 견줍니다 · ' +
              '「협의」 와 금액을 안 적으신 공고는 빠집니다</span></p>'
        : '<p class="jbrail-n jbrail-n0">금액으로 좁히시려면 급여 조건을 ' +
          '먼저 고르셔야 합니다 — 월급 · 연봉 · 시급을 한 칸으로 견줄 수 ' +
          '없기 때문입니다.</p>') +
      (f.k ? '<input type="hidden" name="k" value="' + esc(f.k) + '">' : '') +
      (f.sub ? '<input type="hidden" name="s" value="' + esc(f.sub) + '">' : '') +
      '<p class="jbrail-b">' +
        '<button type="submit" class="btn btn-pri btn-sm">필터 적용</button>' +
        '<a class="jbrail-x" href="/cat/career">조건 모두 지우기</a>' +
      '</p>' +
    '</form>';
  }

  /* 찾는 칸 — ⚠️ 시안 ⑨ 의 「직무, 지역, 업체명 등으로 검색해 보세요」.
     ⚠️⚠️ **찾기도 서버가 합니다**(`title=ilike`) — 쉰 줄만 받아 화면에서
     찾으면 그 쉰 줄 밖의 공고가 영영 안 나옵니다. */
  function findBox(f){
    return '<form class="jbfind" id="jbfind" method="get" action="/cat/career">' +
      '<label for="jb-q" class="sr-only">공고 찾기</label>' +
      '<input id="jb-q" name="q" type="search" maxlength="40" ' +
        'value="' + esc(f.q) + '" ' +
        'placeholder="직무, 지역, 업체명 등으로 검색해 보세요">' +
      (f.k ? '<input type="hidden" name="k" value="' + esc(f.k) + '">' : '') +
      '<button type="submit" class="btn btn-pri">검색</button>' +
    '</form>';
  }

  /* 묶음 머리 — ⚠️ 시안 ⑨ 는 갈래를 **묶어서** 보여 줍니다
     (「채용 공고 (구인)」 · 「업체 제휴 공고 (파트너 모집)」).
     ⚠️⚠️ 갈래를 고르신 뒤에는 **안 냅니다** — 한 갈래만 남았는데 그
     머리를 또 내면 같은 말을 두 번 하는 것입니다. */
  /* ⚠️⚠️⚠️ **모르는 키를 그 글자 그대로 내지 않습니다** — 2026-11-12
     까지 그랬고, 공고 상세의 직무 자리에 `jr-caddy` 가 손님 화면에
     그대로 찍혔습니다. 이름을 지어내지 않는 것과 **내부 키를 보여 주는
     것**은 다릅니다. 중립 문구를 내고 매핑 누락은 운영 기록으로
     보냅니다 — `amKeyName()` 한 곳입니다. */
  function nameOf(L, k, kind){ return window.amKeyName(L, k, kind); }
  function groupHead(key){
    var x = (kinds().filter(function(y){ return y.key === key; })[0]) || null;
    if(!x) return "";
    return '<li class="jbg">' + esc(x.name) + ' 공고' +
      (x.lead ? ' <i>' + esc(x.lead) + '</i>' : "") + '</li>';
  }

  function listHtml(rows, f){
    if(f.k) return '<ul class="jbl">' + rows.map(card).join("") + '</ul>';
    /* 갈래 차례는 `AM_JOB_KIND` 한 곳에서 옵니다 — 화면이 따로 적으면
       갈래가 느는 날 새 갈래가 **어느 묶음에도 안 들어갑니다**. */
    var out = "";
    kinds().forEach(function(x){
      var mine = rows.filter(function(r){ return r.kind === x.key; });
      if(!mine.length) return;
      out += groupHead(x.key) + mine.map(card).join("");
    });
    /* ⚠️ 모르는 갈래가 섞여 있으면 **버리지 않고** 맨 뒤에 냅니다 —
       키를 늘린 날 그 공고가 조용히 사라지지 않게. */
    var known = kinds().map(function(x){ return x.key; });
    var rest = rows.filter(function(r){ return known.indexOf(r.kind) < 0; });
    if(rest.length) out += rest.map(card).join("");
    return '<ul class="jbl">' + out + '</ul>';
  }

  function noneHtml(f){
    /* ⚠️ 0건이어도 **막다른 길로 두지 않습니다** (절대 규칙 2).
       ⚠️⚠️ **조건이 걸렸을 때와 아무것도 없을 때는 다른 말**입니다 —
       섞으면 손님이 "공고가 없다" 로 읽습니다. */
    var narrow = (f.k || f.sub || f.rg || f.ro || f.em || f.py || f.q);
    if(narrow)
      return '<div class="none"><h3>고르신 조건에 맞는 공고가 없습니다.</h3>' +
        '<p>조건을 조금 넓혀 보세요. 직무 · 고용 형태 · 급여 조건을 ' +
        '안 적으신 공고는 그 조건으로 좁히면 빠집니다.</p>' +
        '<div class="none-b">' +
        '<a class="btn btn-line" href="/cat/career">조건 모두 지우기</a>' +
        '</div></div>';
    return '<div class="none"><h3>아직 등록된 공고가 없습니다.</h3>' +
      '<p>채용 공고나 제휴 제안을 등록해 인재와 파트너를 만나보세요.</p>' +
      '</div>';
  }

  /* 공고 상세 — ⚠️⚠️ 시안 ⑨ 의 「공고 상세 >」가 갈 자리입니다.
     ⚠️ 지원 양식을 **여기**서 엽니다(목록 카드가 아니라) — 목록에서
     열면 한 화면에 양식이 여럿 서고, 어느 공고에 쓰는지 흐려집니다. */
  function detail(j){
    var who = j.pro_name ? j.pro_name : j.who;
    var meta = [window.amKeyName(SUBNAME, j.sub, "하위분류"),
                window.amKeyName(REG, j.region, "지역"),
                nameOf(window.AM_JOB_ROLE, j.role, "직무"),
                nameOf(window.AM_JOB_EMP, j.emp_type, "고용 형태")]
      .filter(Boolean).join(" · ");
    return '<div class="jbd" data-id="' + esc(j.id) + '">' +
      '<p class="jbd-back"><a class="btn btn-line btn-sm" href="' +
        esc(urlOf(Object.assign({}, nowAll(), { v:"" }))) + '">목록으로</a></p>' +
      '<h2 class="jbd-t">' + esc(j.title) + '</h2>' +
      '<p class="jbd-k">' + esc(window.amKeyName(kinds(), j.kind, "갈래")) + '</p>' +
      '<p class="jbd-m">' + esc(meta) + '</p>' +
      '<p class="jbd-w">' + esc(who) + ' · ' + esc(when(j.created_at)) + '</p>' +
      /* ⚠️⚠️ 금액을 적는 자리는 `amJobPay()` **한 곳**입니다 — 적힌
         것이 하나도 없으면 null 이고 그 줄이 **줄째 빠집니다**
         ("협의" 를 우리가 지어 적지 않습니다 · 절대 규칙 1).
         ⚠️⚠️⚠️ **같은 말을 두 번 적고 있었습니다** — 바로 위에
         `j.pay`(올리신 분이 적은 자유 글자)를 따로 내고 있었는데,
         `amJobPay()` 가 **그 글자까지 이어 붙여** 줍니다. 그래서 상세에
         「급여 · 조건 일 12만원」과 「월 3,000,000원부터 · 일 12만원」이
         **나란히** 찍혔습니다. 2026-11-12 에 여행 · 인력 화면 검사를
         넣다가 찍어 보고 알았습니다(바로 위 주석이 "한 곳" 이라고 적어
         두고 코드는 두 곳이던 자리). */
      (function(t){ return t ? '<p class="jbd-p">급여 · 조건 ' + esc(t) +
        '</p>' : ''; })(window.amJobPay ? window.amJobPay(j) : null) +
      (j.terms ? '<p class="jbd-c">' + esc(j.terms) + '</p>' : '') +
      (j.close_at ? '<p class="jbd-d">마감 ' + esc(dayText(j.close_at)) + '</p>' : '') +
      '<div class="jbd-b">' + esc(j.body) + '</div>' +
      /* ⚠️⚠️ **등록자 확인 여부를 그 자리에서** 말합니다 — 개인과
         사업자가 섞여 있으면 구분해 표시해야 합니다(제20조의4 ③).
         업체 이름으로 올린 글만 우리가 승인한 업체입니다. */
      (j.pro_name
        ? '<p class="jbd-ok">' + (window.icon ? window.icon("check", 15) : "") +
          '입점 심사를 거친 업체가 올린 공고입니다.</p>'
        : '<p class="jbd-no">' + (window.icon ? window.icon("info", 15) : "") +
          '회원이 올린 공고입니다 — 등록자 확인이 필요합니다. ' +
          '골프올인원은 거래 당사자가 아닙니다.</p>') +
      '<div class="jbd-act">' +
        '<button type="button" class="btn btn-pt jbc-go">' +
          (j.kind === "hire" || j.kind === "seek" ? "지원하기" : "제안 보내기") +
        '</button>' +
        applyN(j) +
      '</div>' +
    '</div>';
  }

  function paint(a, rows, f, one){
    var html = tabs(f) + findBox(f) + subLine(f.sub, f.rg);
    /* ⚠️⚠️ 0058 — "조건을 저장하고 알림 받기". 글과 주소는
       js/data/deal.js 의 amWatchLink() 한 곳입니다 (분류 화면 셋이
       같은 말을 해야 합니다).
       ⚠️ 로그인한 분에게만 냅니다 — 로그인 전에 그리면 눌러서 로그인
       화면으로 갔다가 돌아와도 저장된 것이 없는 꼴입니다 (절대 규칙 5). */
    if(a && a.signedIn && window.amWatchLink) html += window.amWatchLink("job");
    if(f.v){
      /* ⚠️ 상세에서는 거르개를 **안 냅니다** — 무엇을 거르는 칸인지
         알 수 없게 됩니다(0069 에서 세운 규칙). */
      html += one ? detail(one)
        : '<div class="none"><h3>지금은 볼 수 없는 공고입니다.</h3>' +
          '<p>마감되었거나 내려간 공고일 수 있습니다.</p>' +
          '<div class="none-b"><a class="btn btn-line" href="' +
          esc(urlOf(Object.assign({}, f, { v:"" }))) + '">목록으로</a></div></div>';
    }else{
      html += '<div class="jbw">' + rail(f) +
        '<div class="jbmain">' +
          '<p class="jbcnt">전체 공고 <b>' +
            (window.won ? window.won(rows.length) : String(rows.length)) + '건</b>' +
            (rows.length >= 50 ? ' 이상' : '') + '</p>' +
          (rows.length ? listHtml(rows, f) : noneHtml(f)) +
        '</div>' +
      '</div>';
    }
    list.innerHTML = html;

    /* ⚠️ 탭 · 상세 · 목록으로 — 전부 **링크**이고 여기서 가로채기만
       합니다(자바스크립트가 꺼져 있으면 그대로 이동).
       ⚠️⚠️ 눌림은 **감싼 자리 한 곳**에서 받습니다 — 그릴 때마다 달면
       같은 손놀림에 호출이 여러 번 돕니다(0069 의 그 자리). */
    bindNav(a);

    Array.prototype.forEach.call(list.querySelectorAll(".jbc-go"), function(b){
      b.addEventListener("click", function(){
        if(!a.signedIn){ window.location.href = window.amLoginUrl
          ? window.amLoginUrl(window.location.pathname) : "/login"; return; }
        var li = b.closest(".jbd");
        var old = li.querySelector(".jbaf");
        if(old){ old.remove(); return; }
        /* ⚠️ 상세에서 엽니다 — 목록의 `rows` 가 아니라 **그 한 줄**입니다 */
        var src = one && one.id === li.getAttribute("data-id") ? one : null;
        if(!src) return;
        li.insertAdjacentHTML("beforeend", applyForm(src.kind));
        var f = li.querySelector(".jbaf");
        f.querySelector(".jbaf-x").addEventListener("click", function(){ f.remove(); });
        f.addEventListener("submit", function(e){
          e.preventDefault();
          var msg = f.querySelector(".jbafm");
          var sb = f.querySelector('button[type="submit"]');
          sb.disabled = true;
          msg.hidden = false; msg.textContent = "보내는 중입니다…";
          call(a, "apply_jobpost", {
            post_id: li.getAttribute("data-id"),
            msg: f.msg.value, contact: f.contact.value,
            /* ⚠️ 동의 시각은 **누른 그 순간**입니다 */
            agree_at: new Date().toISOString()
          }).then(function(){
            li.innerHTML = '<div class="none">' +
              '<h3>보냈습니다.</h3>' +
              /* ⚠️⚠️ 문장 한가운데 링크를 박지 않습니다 (높이 16px) —
                 문단 끝에 **단추**로 냅니다. */
              '<p>올리신 분이 보고 수락하시면 연락처를 주고받으실 수 ' +
              /* ⚠️ 지킬 수 없는 약속을 하지 않습니다 */
              '있습니다. 언제까지라고 약속드리지는 않습니다.</p>' +
              '<a class="btn btn-pt" href="/my">내 정보에서 보기</a></div>';
          }).catch(function(err){
            sb.disabled = false;
            /* ⚠️ DB 가 거절한 말을 **그대로** 보여 줍니다 */
            msg.textContent = String((err && err.message) || "보내지 못했습니다.");
          });
        });
      });
    });
  }

  var NAVON = false;
  function bindNav(a){
    if(NAVON) return;
    list.addEventListener("click", function(e){
      var t = e.target;
      /* 0078 북마크 — ⚠️⚠️ **눌린 그 단추만** 바꿉니다(목록을 다시
         그리면 보고 계신 자리가 맨 위로 튕깁니다). 그리고 **서버가
         돌려준 값**으로 바꿉니다 — 화면이 먼저 뒤집으면 거절당한 날
         켜진 채 남습니다(0069 가 중고 찜에서 세운 규칙). */
      var fb = t.closest ? t.closest("[data-fav]") : null;
      if(fb && list.contains(fb)){
        e.preventDefault();
        var fid = fb.getAttribute("data-fav");
        fb.disabled = true;
        /* ⚠️⚠️⚠️ 0078 의 문은 **켜고 끄는 값을 받습니다**(토글이
           아닙니다) — 열쇠는 `id` · `on` 입니다. `post` 로 보내면
           "어느 공고인지 알 수 없습니다" 로 거절합니다(화면은 보내는데
           DB 가 거절하는 자리). */
        call(a, "fav_jobpost", { id:fid, on: !(FAV[fid] === true) })
          .then(function(on){
          FAV[fid] = (on === true);
          fb.classList.toggle("on", on === true);
          fb.setAttribute("aria-pressed", on === true ? "true" : "false");
          /* ⚠️ 아이콘을 다시 그려야 글자만 남지 않습니다 */
          fb.innerHTML = (window.icon ? window.icon("heart", 14) : "") +
            esc(favLabel(on === true));
          fb.disabled = false;
        }, function(err){
          fb.disabled = false;
          try{ alert(String(err.message || err)); }catch(_){}
        });
        return;
      }
      var ln = t.closest ? t.closest("a[href^='/cat/career']") : null;
      if(!ln || !list.contains(ln)) return;
      if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      try{ window.history.pushState({}, "", ln.getAttribute("href")); }catch(_){}
      load(a);
      /* ⚠️ 목록 머리로 올립니다 — 안 올리면 누른 자리에 그대로 있어
         "아무 일도 안 일어났다" 로 보입니다. */
      try{ list.scrollIntoView({ block:"start" }); }catch(_){}
    });
    NAVON = true;
    /* 레일 · 찾는 칸은 **양식**입니다 — 가로채서 주소만 바꿉니다 */
    bindForm(a);
  }
  /* ⚠️⚠️⚠️ **양식도 감싼 자리 한 곳에서 받습니다.** 처음에
     `bindForm(a, id)` 로 그 양식 **자체**에 달고 `FORMON` 으로 두 번
     달기를 막았는데, `paint()` 가 `list.innerHTML` 을 통째로 갈아
     끼우므로 **그 양식 요소가 없어집니다** — 두 번째 그림부터는 새
     요소에 아무 귀도 안 달리고 `FORMON` 이 참이라 다시 달지도
     않았습니다. 그러면 「필터 적용」이 **통째로 새로고침**으로 돌아
     거르개를 누를 때마다 화면이 깜빡이고 보고 있던 자리를 잃습니다
     (에러는 0줄입니다 · 0069 가 `bindBar()` 로 세운 그 규칙).
     ⚠️ `list` 는 빌드가 찍은 그릇이라 **안 바뀝니다** — 거기 한 번만
     답니다. */
  var FORMON = false;
  function bindForm(a){
    if(FORMON) return;
    list.addEventListener("submit", function(e){
      var f = e.target.closest ? e.target.closest("form") : null;
      if(!f || !list.contains(f)) return;
      /* ⚠️ 레일 · 찾는 칸 **둘만** 받습니다 — 지원 양식(`.jbaf`) ·
         올리는 양식은 각자 제 자리에서 처리합니다. */
      if(f.id !== "jbrail" && f.id !== "jbfind") return;
      e.preventDefault();
      var g = Object.assign({}, nowAll(), { v:"" });
      ["rg", "ro", "em", "py", "pm", "q"].forEach(function(k){
        var el = f.elements[k];
        if(el) g[k] = (el.value || "").trim();
      });
      try{ window.history.pushState({}, "", urlOf(g)); }catch(_){}
      load(a);
    });
    FORMON = true;
  }

  function load(a){
    var f = nowAll();
    /* 상세 — ⚠️ 보기를 새로 안 만들고 같은 공개 보기에서 한 줄만 받습니다 */
    if(f.v){
      return get(a, "v_job_open?select=*&id=eq." + encodeURIComponent(f.v) +
                    "&limit=1").then(function(rows){
        /* ⚠️ 불러오는 사이에 뒤로 가셨으면 **안 그립니다** — 안 보면
           늦게 온 답이 목록을 덮어씁니다 (0069 의 그 자리). */
        if(nowView() !== f.v) return;
        paint(a, [], f, (rows || [])[0] || null);
      });
    }
    var q = "v_job_open?select=id,kind,sub,region,title,body,pay,terms," +
            "role,emp_type,pay_type,pay_min," +
            "close_at,created_at,who,pro_name,apply_n" +
            "&order=created_at.desc&limit=50";
    if(f.k)   q += "&kind=eq." + encodeURIComponent(f.k);
    /* ⚠️ 열쇠 이름이 DB 의 칸과 **글자까지** 같아야 합니다 — 다르면
       아무것도 안 걸렀는데 화면은 멀쩡해 보입니다. */
    if(f.sub) q += "&sub=eq." + encodeURIComponent(f.sub);
    /* ⚠️⚠️ 0072 의 칸 셋 — **안 적으신 공고는 빠집니다**(모르는 것을
       아무 칸에나 넣으면 지어낸 값입니다 · 절대 규칙 1). 화면이 그
       사실을 0건 안내에서 말합니다. */
    if(f.ro) q += "&role=eq." + encodeURIComponent(f.ro);
    if(f.em) q += "&emp_type=eq." + encodeURIComponent(f.em);
    if(f.py) q += "&pay_type=eq." + encodeURIComponent(f.py);
    /* ⚠️⚠️⚠️ **금액은 갈래와 짝으로만** 겁니다 — 월급 · 연봉 · 시급을
       한 칸으로 견주면 「300만원 이상」이 시급 300만원과 연봉 300만원을
       같은 줄에 세웁니다. 그래서 `f.py` 가 있을 때만 겁니다.
       ⚠️⚠️ **「협의」 · 안 적으신 공고는 빠집니다** — `pay_min` 이 null
       이면 `gte` 가 거짓입니다. 그것이 맞습니다(모르는 금액을 0 으로
       치면 가장 싼 공고가 되고 그건 지어낸 값입니다 · 절대 규칙 1).
       화면이 그 사실을 거르개 옆에서 말합니다. */
    if(f.py && f.pm) q += "&pay_min=gte." + encodeURIComponent(f.pm);
    /* ⚠️ `*` 와 `%` 는 ilike 의 글자라 빼고 보냅니다 (그대로 보내면
       손님이 친 말과 다른 것을 찾습니다). */
    if(f.q)  q += "&title=ilike.*" +
      encodeURIComponent(f.q.replace(/[*%]/g, "")) + "*";
    /* ⚠️⚠️ **거르는 것은 서버입니다** — 쉰 줄만 받아 화면에서 거르면
       서울 글이 쉰 줄 밖에 있을 때 **0건으로 보입니다**.
       ⚠️⚠️⚠️ **묶음(수도권)과 시 · 도(서울)를 한 열쇠로 받습니다** —
       현황표의 칸은 묶음을 보내고 고르개는 시 · 도를 보냅니다. 푸는
       규칙은 `amRegionsFor()` 한 곳입니다. */
    var rs = window.amRegionsFor ? window.amRegionsFor(f.rg) : [];
    if(rs.length) q += "&region=in.(" + rs.map(encodeURIComponent).join(",") + ")";
    return get(a, q).then(function(rows){ paint(a, rows || [], f, null); });
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[career] 로그인 · 접수가 설정되지 않아 구인 · 구직을 " +
        "열지 않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      /* ⚠️ 빌드가 찍어 둔 "아직 없는 것입니다" 를 그대로 두면
         0건이라고 말하는 것입니다 — 열지 않았다고 적습니다. */
      window.amShut("joblist");
      return;                       /* 빌드가 찍어 둔 글 그대로 */
    }
    if(!KEEP){
      /* ⚠️⚠️ 보유 기간을 못 보여 주면 동의를 받을 수 없습니다 (제15조
         제2항). 운영자에게만 말하고 양식은 안 엽니다. */
      try{ console.warn("[career] js/data/site.js 의 careerKeep(보유 기간)이 " +
        "비어 구인 · 구직 양식을 열지 않았습니다 — 개인정보보호법 제15조 제2항."); }catch(e){}
      return;
    }

    /* 0078 — ⚠️⚠️ **저장 목록을 먼저 받고** 그립니다. 안 기다리면 첫
       그림에서 단추가 전부 「저장」으로 서고, 이미 저장해 두신 분은
       눌러서 **해제**가 됩니다(에러 0줄). */
    ME = a;
    var favReady = a.signedIn
      /* ⚠️⚠️ 보기가 내는 칸 이름은 **`id`** 입니다(`f.post_id as id`) —
         `post_id` 로 읽으면 전부 undefined 가 되어 **저장해 둔 것이
         하나도 안 켜집니다**(에러 0줄). */
      ? get(a, "v_job_fav?select=id&limit=500").then(function(rows){
          FAV = {};
          (rows || []).forEach(function(x){ FAV[x.id] = true; });
        }, function(){ FAV = {}; })
      : Promise.resolve();
    favReady.then(function(){ load(a); });
    /* 뒤로 가기 — 주소가 바뀌면 다시 그립니다 */
    window.addEventListener("popstate", function(){
      load(a); });

    var box = document.getElementById("jobbox");
    if(!box) return;
    box.className = "jbox";
    box.innerHTML = a.signedIn
      ? '<h3 class="jbox-h">구인 · 구직 · 제휴 글 올리기</h3>' +
        openForm(!!a.provider)
      : '<div class="none"><h3>글을 올리려면 로그인하셔야 합니다.</h3>' +
        '<p>올리신 글을 나중에 고치거나 마감하시려면 누가 올렸는지 ' +
        '알아야 합니다.</p>' +
        '<a class="btn btn-pt" href="' +
          (window.amLoginUrl ? esc(window.amLoginUrl(window.location.pathname)) : "/login") +
        '">로그인하기</a></div>';
    if(!a.signedIn) return;

    /* ⚠️⚠️ 갈래를 고르시면 **금액 갈래를 그 갈래 것으로** 좁힙니다 —
       시설 · 장비 거래에 「월급」이 남아 있으면 골라도 DB 가 거절합니다
       (0072 가 `pay_type` 을 갈래마다 가른 그 까닭 · 절대 규칙 5). */
    var kindSel = document.getElementById("b-kind");
    var ptSel   = document.getElementById("b-ptype");
    if(kindSel && ptSel) kindSel.addEventListener("change", function(){
      var k = kindSel.value;
      var L = (k && window.amJobPayFor) ? window.amJobPayFor(k)
                                        : (window.AM_JOB_PAY || []);
      var cur = ptSel.value;
      ptSel.innerHTML = '<option value="">안 고름</option>' +
        L.map(function(x){
          return '<option value="' + esc(x.key) + '"' +
            (cur === x.key ? ' selected' : '') + '>' + esc(x.name) +
            '</option>'; }).join("");
    });

    /* 오늘보다 이전은 못 고르게 — 문도 막지만 화면이 먼저 말해 줍니다 */
    var cd = document.getElementById("b-close");
    if(cd) cd.min = new Date().toISOString().slice(0, 10);

    document.getElementById("jbf").addEventListener("submit", function(e){
      e.preventDefault();
      var f = e.target, msg = document.getElementById("jbmsg");
      var btn = f.querySelector('button[type="submit"]');
      var pro = document.getElementById("b-aspro");
      btn.disabled = true;
      msg.hidden = false; msg.textContent = "올리는 중입니다…";
      call(a, "open_jobpost", {
        kind: f.kind.value, sub: f.sub.value, region: f.region.value,
        title: f.title.value, body: f.body.value, pay: f.pay.value,
        /* ⚠️⚠️ 0072 의 칸 넷 — **안 보내면 거르개가 그 공고를 영원히
           못 찾습니다**(문은 받는데 화면이 안 보내던 자리). */
        role: f.role.value, emp_type: f.emp_type.value,
        pay_type: f.pay_type.value, pay_min: f.pay_min.value,
        terms: f.terms.value, close_at: f.close_at.value,
        contact: f.contact.value, as_pro: !!(pro && pro.checked),
        agree_at: new Date().toISOString()
      }).then(function(){
        box.className = "none";
        box.innerHTML = '<h3>글을 올렸습니다.</h3>' +
          '<p>목록에 바로 보입니다. 지원이 들어오면 내 정보에서 ' +
          '수락하실 수 있습니다.</p>' +
          '<a class="btn btn-pt" href="/my">내 정보에서 보기</a>';
        load(a);
      }).catch(function(err){
        btn.disabled = false;
        msg.textContent = String((err && err.message) || "올리지 못했습니다.");
      });
    });
  }).catch(function(){ /* 못 물어봤으면 빌드가 찍은 글 그대로 */ });
})();

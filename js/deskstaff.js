/* ════════════════════════════════════════════════════════════════════
   우리 업체 **담당자 명단** — /desk  (DB 는 0052)

   ⚠️⚠️ **한 업체에 담당자 여럿은 전부터 됩니다** — `account.provider_id`
   에 unique 가 없고, 0043 의 초대 코드가 각자 들어오는 길입니다.
   없던 것은 **그 명단을 보는 자리**였습니다. 그래서 업체는 우리 쪽에
   누가 이어져 있는지 알 길이 없었습니다 — 그만둔 사람이 아직 보고
   있는지도 모릅니다.

   ⚠️⚠️⚠️ **동료 이름은 가려서 나옵니다** (`김**`). 그 마스킹은 **DB 의
   보기**가 합니다 (`v_provider_staff`) — 화면이 가리면 본이름이 이미
   브라우저까지 온 것이고, 개발자 도구를 열면 그대로 보입니다.
   ⚠️ 그래서 여기서는 **받은 글자를 그대로 씁니다.** 가리는 규칙을
   여기 또 적으면 두 곳이 되고, 한쪽만 고치는 날 조용히 어긋납니다.

   ⚠️⚠️ **내보내는 단추를 안 냅니다.** 남의 권한을 거두는 일이고 문도
   업체를 거절합니다 (`drop_provider_staff` — 운영자만). 그려 두면
   눌러도 아무 일이 안 나는 단추입니다 (절대 규칙 5).
   ⚠️ 대신 **어디로 알리면 되는지**를 문단 끝 단추로 냅니다 (문장
   한가운데 링크를 박으면 높이가 16px 입니다).

   ⚠️ "이어진 날" 은 **초대 코드로 들어온 분만** 있습니다. SQL 로 직접
   이은 분에게는 기록이 없어 보기가 NULL 을 냅니다 — 그 줄을 **줄째**
   뺍니다 (절대 규칙 2: 없는 값에 자리표시자를 찍지 않습니다).

   ⚠️⚠️ **설정이 있어야 열리는 자리라 빌드가 찍은 HTML 만 보는 검사는
   영원히 못 봅니다** — `tools/test-desk.js` 가 직접 눌러 봅니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("pvstbox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null;

  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json().catch(function(){ return null; }) : null; })
      .catch(function(){ return null; });
  }

  /* ⚠️ 날짜만 냅니다 — 시각까지 내면 "몇 시에 들어왔나" 가 되어
     필요 없는 것을 보여 주는 자리가 됩니다. */
  function day(iso){
    var d = new Date(iso);
    if(isNaN(d.getTime())) return "";
    return d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " +
           d.getDate() + "일";
  }

  function row(s){
    /* ⚠️⚠️ `s.who` 는 **DB 가 이미 가린 글자**입니다 (제 줄만 본이름).
       그래도 `esc()` 를 지납니다 — 사람이 적은 이름입니다 (절대 규칙 4). */
    return '<li class="pvst-r' + (s.is_me ? " pvst-me" : "") + '">' +
      '<span class="pvst-ic">' + icon(s.is_me ? "user" : "people", 17) + '</span>' +
      '<span class="pvst-n">' + esc(s.who || "회원") + '</span>' +
      (s.is_me ? '<span class="pvst-b">나</span>' : "") +
      /* ⚠️ 없으면 **줄째** 빠집니다 (지어내지 않습니다) */
      (s.joined_at
        ? '<span class="pvst-d">' + esc(day(s.joined_at)) + ' 이어짐</span>'
        : "") +
    '</li>';
  }

  function paint(rows){
    var list = rows || [];
    /* ⚠️⚠️ **0줄이면 아무것도 안 그립니다.** 이 화면을 보는 사람은
       담당자이므로 제 줄이 반드시 있습니다 — 0줄은 자료를 못 읽은
       것이고, 그때 "담당자가 없습니다" 를 찍으면 거짓입니다. */
    if(!list.length){ box.hidden = true; box.innerHTML = ""; return; }
    box.className = "deskbox";
    box.hidden = false;

    /* ⚠️ 제 줄을 맨 위에 둡니다 (order 로 받지만 한 번 더 세웁니다 —
       서버 차례에 기대면 그 질의를 고치는 날 조용히 섞입니다). */
    list = list.slice().sort(function(a, b){
      return (b.is_me ? 1 : 0) - (a.is_me ? 1 : 0);
    });

    box.innerHTML =
      '<h2 class="adm-h">' + icon("people", 19) + '우리 업체 담당자</h2>' +
      /* ⚠️ 갯수는 **센 값**입니다 (저장하지 않습니다 — 절대 규칙 1) */
      '<p class="myhint">지금 <b>' + esc(String(list.length)) +
        '명</b>이 이 업체에 이어져 있습니다. 이 분들은 배정받은 요청과 ' +
        '손님 성함 · 연락처를 봅니다.</p>' +
      '<ul class="pvst-l">' + list.map(row).join("") + '</ul>' +
      /* ⚠️⚠️ **이름이 가려져 있다는 것을 그 자리에서 말합니다** — 안
         적으면 "왜 별표냐" 가 아니라 "자료가 깨졌다" 로 읽힙니다. */
      '<p class="pvst-z">동료의 성함은 가려서 보여 드립니다. 누구인지 ' +
        '확인하거나 그만두신 분을 빼야 하면 운영자가 처리해 드립니다.</p>' +
      /* ⚠️ 늘리는 길 — 코드를 넣는 칸은 이 화면에 이미 있습니다
         (js/desk.js). 없는 길을 적지 않습니다. */
      '<p class="pvst-z">담당자를 늘리시려면 운영자에게 <b>초대 코드</b>를 ' +
        '받아 이 화면의 초대 코드 칸에 넣으시면 됩니다.</p>' +
      /* ⚠️⚠️ 문단 **끝에 단추로** 냅니다 (문장 한가운데 링크는 16px) */
      '<p class="pvst-a"><a class="btn btn-sm btn-line" href="/help">' +
        '고객센터로 알리기</a></p>';
  }

  function load(){
    /* ⚠️ 칸을 글자로 적습니다 — `select=*` 로 받으면 보기에 칸이 붙는
       날 쓰지도 않는 것이 같이 내려옵니다.
       ⚠️⚠️ `account_id` 는 **안 받습니다** — 업체 담당자에게는 보기가
       NULL 로 내주고, 받아도 쓸 데가 없습니다 (내보내는 단추가
       없습니다). 안 받는 것이 최소 수집입니다. */
    return get("v_provider_staff?select=who,is_me,joined_at&order=is_me.desc")
      .then(paint);
  }

  window.amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 업체 담당자가 아니면 **한 줄도** 안 그립니다 — 왜 안 되는지도
       적지 않습니다 (권한 구조를 알려 주는 글이 됩니다).
       ⚠️⚠️ 일반 회원이 이 주소로 들어와도 **읽으러 가지도 않습니다** —
       0050 의 알림 상자가 그 줄을 빠뜨려 혼자 질의를 던지고 있었습니다. */
    if(!a || !a.on || !a.signedIn || a.role !== "provider") return;
    return load();
  }).catch(function(){});
})();

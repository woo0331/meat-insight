/* ════════════════════════════════════════════════════════════════════
   업체 심사 · 정지 — /admin 의 한 자리 (3차 지시서 §2 · §8 · §11-1)

   ⚠️⚠️⚠️ **이 화면이 없어서 `approve_provider` 를 아무도 못 불렀습니다.**
   그 문은 0007 에 쓰고 0012 · 0018 로 두 번 고쳤는데, **부르는 화면이
   한 곳도 없었습니다** — 즉 업체를 승인하려면 사장님이 SQL 편집기를
   열어야 했습니다. "만들어 놓고 안 쓰는 칸" 의 가장 큰 판입니다
   (작업 기억의 그 줄 — 부르는 자리를 세어 보세요).

   ⚠️⚠️ **쓰는 길은 전부 문(function)입니다.** 표를 직접 고치지
   않습니다 —
     set_apply_state      (0016)  입점 신청의 상태
     approve_provider     (0018)  공개 · 배정 가능 · 확인 배지
     set_provider_state   (0038)  승인 · 거절 · 정지
   문마다 **까닭을 받고** 감사 기록과 한 트랜잭션입니다.

   ⚠️⚠️ **확인 배지를 여기서 켜지 않습니다.** 배지는 "서류를 봤다" 는
   뜻인데, 단추 하나로 켜지면 보지 않고도 켜집니다. 서류를 본 사람이
   그 자리에서 켜는 화면이 생기는 날 붙입니다 (절대 규칙 1 · 5).

   ⚠️ 신청자의 성함 · 연락처가 나옵니다 — 운영자가 전화를 걸어야 하는
   자리라 그렇습니다. 화면 밖으로 내보내지 않습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("probox");
  if(!box || !window.amAuthAsk) return;

  var A = null;
  var TAB = "pv";          /* pv 업체 · ap 입점 신청 · new 업체 등록 */
  var LIST = [];           /* 읽어 둔 업체 — 겹치는 id 를 미리 묻습니다 */
  var APL  = [];           /* 읽어 둔 입점 신청 */
  /* ⚠️ 신청을 **읽었는가** — 못 읽었으면 수를 안 적습니다(0 과 다릅니다) */
  var APOK = false;
  var INV  = [];           /* 살아 있는 담당자 초대 코드 */
  var EDIT = "";           /* 사업자 정보를 지금 적고 있는 업체 id (0057) */

  function why(err){
    var w = String((err && err.message) || "");
    try{ w = JSON.parse(w).message || w; }catch(_){}
    return w || "하지 못했습니다.";
  }
  function rpc(name, args){
    return fetch(A.conf.url + "/rest/v1/rpc/" + name, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey: A.conf.anonKey }, window.amAuthHeaders()),
      body: JSON.stringify(args || {})
    }).then(function(r){
      if(!r.ok) return r.text().then(function(t){ throw new Error(t || ("HTTP " + r.status)); });
      return r.text().then(function(t){ try{ return JSON.parse(t); }catch(_){ return t; } });
    });
  }
  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json().catch(function(){ return null; }) : null; })
      .catch(function(){ return null; });
  }

  function load(){
    return Promise.all([
      /* ⚠️ RLS 가 운영자에게만 전부 내줍니다 — 화면이 또 좁히지 않습니다 */
      get("provider?select=id,name,state,state_why,state_at,listed,assignable," +
          /* ⚠️ 0057 — 사업자 신원정보 다섯 (제20조 제2항). 운영자가 적는
             자리라 여기서 읽습니다. */
          "ceo,addr,tel,email,brn," +
          "is_test,subs,regions&order=name.asc&limit=300"),
      /* ⚠️ `provider_id` 를 같이 읽습니다 — 등록까지 끝난 신청과 업체를
         이어서, 신청서에 적혀 온 번호 · 전화를 **미리 채워** 둡니다
         (운영자가 같은 것을 두 번 받아 적지 않게). */
      get("provider_apply?select=id,no,company,brn,name,tel,email,region," +
          "services,note,state,provider_id,by_user,created_at&order=created_at.desc&limit=200"),
      /* 담당자 초대 (0043) — ⚠️ 표는 아무도 못 읽습니다. 운영자가 보는
         길은 이 **보기** 하나이고, 그 where 절이 자물쇠입니다. */
      get("v_provider_invite_admin?select=code,provider_id,made_at,expires_at," +
          "used_at,void_at,live&order=made_at.desc&limit=100")
    ]);
  }

  function badge(name, tone){
    return '<span class="dk-st dk-' + esc(tone) + '">' + esc(name) + '</span>';
  }
  /* 상태 말 — ⚠️ **한 곳**입니다. 화면마다 따로 적으면 어긋납니다. */
  var ST = {
    draft:        { name:"작성 중",   tone:"ink"  },
    submitted:    { name:"접수됨",    tone:"ok"   },
    under_review: { name:"심사 중",   tone:"info" },
    approved:     { name:"승인",      tone:"grn"  },
    rejected:     { name:"거절",      tone:"bad"  },
    suspended:    { name:"정지",      tone:"bad"  }
  };
  var AP = {
    "new":   { name:"새 신청",  tone:"ok"   },
    called:  { name:"연락함",   tone:"info" },
    done:    { name:"등록 완료", tone:"grn" },
    drop:    { name:"진행 안 함", tone:"ink" }
  };
  function stOf(k){ return ST[k] || { name:String(k || ""), tone:"ink" }; }
  function apOf(k){ return AP[k] || { name:String(k || ""), tone:"ink" }; }

  /* ⚠️⚠️⚠️ **안 처리한 신청 수를 탭에 적습니다** (2026-11-10).
     `provider_apply` 에는 알림 트리거가 **0개**입니다 — 0050 의 트리거
     열셋 가운데 입점 신청에 붙은 것이 하나도 없어서, 신청이 들어와도
     사장님께 아무 소식이 안 갔습니다. `/admin` 을 직접 열어 보셔야
     아셨습니다.
     ⚠️ 알림을 **밖으로 보내지 않는 규칙은 그대로** 지킵니다(문자 · 카톡 ·
     메일을 붙이면 정보통신망법 제50조 · 수탁자 · 환경변수 셋이 같이
     움직입니다). 운영자 화면에서 **세어서** 보여 주는 것뿐입니다.
     ⚠️⚠️ **0 이면 아무것도 안 적습니다** — 「0건」을 뱃지로 달면 늘 켜져
     있는 잔소리가 됩니다. 그리고 **못 읽었을 때도 안 적습니다**(아래
     `APOK` 가 거짓이면 null) — 0 과 「못 읽음」은 다릅니다(절대 규칙 1).
     ⚠️ 세는 규칙은 **여기 한 곳**입니다. `new` 와 `called` 가 "아직
     운영자 손이 필요한" 상태이고, `done` · `drop` 은 끝난 것입니다. */
  function apTodo(){
    if(!APOK) return null;
    return (APL || []).filter(function(a){
      return a.state === "new" || a.state === "called"; }).length;
  }

  function tabs(){
    var n = apTodo();
    return '<div class="bz-tabs" role="tablist">' +
      [["pv","업체"],["ap","입점 신청"],["new","업체 등록"]].map(function(t){
        var lab = esc(t[1]);
        /* ⚠️ 0건 · 못 읽음에는 안 붙입니다 */
        if(t[0] === "ap" && n) lab += ' <span class="bz-n">' + n + '</span>';
        return '<button type="button" class="btn btn-sm ' +
          (TAB === t[0] ? "btn-pri" : "btn-line") + '" data-ptab="' + t[0] + '" ' +
          'role="tab" aria-selected="' + (TAB === t[0] ? "true" : "false") + '">' +
          lab + '</button>';
      }).join("") + '</div>';
  }

  /* ── 업체 ───────────────────────────────────────────────────────── */
  function pvView(list){
    if(!list.length)
      /* ⚠️ 0곳은 고장이 아닙니다 — 지어낸 값이 아니라고 말합니다 */
      return '<p class="myhint">아직 등록된 업체가 없습니다. ' +
             '입점 신청이 들어오면 <b>입점 신청</b> 갈래에서 등록하실 수 있습니다.</p>';
    return '<p class="myhint">⚠️ <b>정지</b>하면 그 업체는 ① 공개 목록에서 빠지고 ' +
      '② 새 배정을 못 받고 ③ 새 견적을 못 냅니다. ' +
      '손님이 <b>이미 받아 둔 견적을 고르는 것</b>은 그대로 됩니다.</p>' +
      '<ul class="fe-p">' + list.map(function(p){
        var s = stOf(p.state);
        return '<li><b>' + esc(p.name) + '</b> ' + badge(s.name, s.tone) +
          (p.is_test ? ' ' + badge("검사용", "warn") : '') +
          (p.listed ? ' ' + badge("공개", "grn") : ' ' + badge("비공개", "ink")) +
          (p.assignable ? ' ' + badge("배정 가능", "grn") : '') +
          '<p class="fe-r">' + esc(p.id) +
            (Array.isArray(p.subs) && p.subs.length
              ? " · 하는 일 " + p.subs.length + "가지" : " · ⚠️ 하는 일이 비었습니다") +
          '</p>' +
          (p.state_why ? '<p class="fe-r">까닭 — ' + esc(p.state_why) + '</p>' : '') +
          '<div class="dk-b">' +
            (p.state === "suspended"
              ? '<button class="btn btn-sm btn-pri" data-pvto="approved" ' +
                'data-pv="' + esc(p.id) + '">정지 풀기</button>'
              : '<button class="btn btn-sm btn-line" data-pvto="suspended" ' +
                'data-pv="' + esc(p.id) + '">정지하기</button>') +
            /* ⚠️ 정지된 업체에는 공개 단추를 **안 냅니다** — 눌러도 DB 가
               거절합니다 (절대 규칙 5). 먼저 정지를 풀어야 합니다. */
            (p.state === "suspended" ? '' :
              '<button class="btn btn-sm btn-line" data-pvlist="' + esc(p.id) + '" ' +
              'data-on="' + (p.listed ? "1" : "0") + '">' +
              (p.listed ? "비공개로" : "공개로") + '</button>' +
              '<button class="btn btn-sm btn-line" data-pvasg="' + esc(p.id) + '" ' +
              'data-on="' + (p.assignable ? "1" : "0") + '">' +
              (p.assignable ? "배정 끄기" : "배정 켜기") + '</button>') +
          '</div>' + kindBlock(p) + identBlock(p) + inviteBlock(p) + '</li>';
      }).join("") + '</ul>';
  }

  /* ── 사업자 신원정보 (0057) ───────────────────────────────────────
     ⚠️⚠️⚠️ **전자상거래법 제20조 제2항 · 시행령 제25조** — 중개자는
     입점업체가 사업자일 때 그 상호 · 대표자 성명 · 주소 · 전화번호 ·
     전자우편주소 · 사업자등록번호를 **손님이 볼 수 있게** 해야 합니다.
     공정위가 당근마켓에 시정명령과 과태료를 부과한 조항입니다.
     ⚠️ 업체도 /desk 에서 넷을 적을 수 있지만, 안 적는 업체가 있어서
     여기서도 적습니다 (0013 의 배정 연락처와 같은 꼴입니다).
     ⚠️⚠️ **사업자등록번호는 관리자만** 적습니다 — 직원에게는 칸을
     **안 냅니다**. 그려 두면 눌러도 문이 거절하는 칸이 됩니다
     (절대 규칙 5). 번호를 적는 일과 확인 배지를 켜는 일은 같은 서류를
     보는 한 사람이어야 합니다.
     ⚠️ 입점 신청에 적혀 온 값이 있으면 **미리 채워** 둡니다 — 운영자가
     같은 것을 두 번 받아 적지 않게. 지어낸 값이 아니라 그 업체가
     신청서에 직접 적은 값입니다. */
  function applyOf(id){
    var L = (APL || []).filter(function(a){ return a.provider_id === id; });
    return L.length ? L[0] : null;      /* created_at desc 로 읽었습니다 */
  }
  function identRows(p){
    var F = window.amProviderIdent(p);
    if(!F.length) return '<p class="fe-r">⚠️ 사업자 정보가 <b>한 칸도 ' +
      '없습니다</b> — 손님 화면(업체 화면)에서 그 구간이 빠집니다.</p>';
    return '<p class="fe-r">' + F.map(function(x){
      return esc(x.name) + ' ' + esc(x.value); }).join(' · ') + '</p>';
  }
  function identForm(p){
    var ap = applyOf(p.id) || {};
    var v = function(k){ return p[k] || ""; };
    /* ⚠️ 미리 채우는 것은 **비어 있을 때만** 입니다 — 이미 적힌 값을
       신청서의 옛 값으로 덮으면 고친 것이 되돌아갑니다. */
    var pre = function(k){ return v(k) || ap[k] || ""; };
    return '<form class="jform pvidf" data-pvidf="' + esc(p.id) + '">' +
      '<div class="jrow">' +
        '<label for="pi-ceo-' + esc(p.id) + '">대표자 성명</label>' +
        '<input id="pi-ceo-' + esc(p.id) + '" name="ceo" maxlength="40" value="' +
        esc(v("ceo")) + '">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="pi-tel-' + esc(p.id) + '">전화 (공개)</label>' +
        '<input id="pi-tel-' + esc(p.id) + '" name="tel" maxlength="40" value="' +
        esc(pre("tel")) + '">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="pi-addr-' + esc(p.id) + '">사업장 주소</label>' +
        '<input id="pi-addr-' + esc(p.id) + '" name="addr" maxlength="200" value="' +
        esc(v("addr")) + '">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="pi-email-' + esc(p.id) + '">이메일 (공개)</label>' +
        '<input id="pi-email-' + esc(p.id) + '" name="email" type="email" ' +
        'maxlength="120" value="' + esc(pre("email")) + '">' +
      '</div>' +
      (A && A.role === "admin"
        ? '<div class="jrow jrow-full">' +
            '<label for="pi-brn-' + esc(p.id) + '">사업자등록번호</label>' +
            '<input id="pi-brn-' + esc(p.id) + '" name="brn" maxlength="14" ' +
            'placeholder="000-00-00000" value="' + esc(pre("brn")) + '">' +
            '<p class="agree-no">⚠️ <b>사업자등록증을 보고</b> 적으세요. ' +
            '확인 배지(사업자등록 확인)가 가리키는 번호가 이것입니다.</p>' +
          '</div>'
        : '<div class="jrow jrow-full"><p class="agree-no">⚠️ ' +
          '<b>사업자등록번호는 관리자만</b> 적을 수 있습니다' +
          (p.brn ? ' — 지금 ' + esc(p.brn) + ' 입니다.' : ' — 아직 비어 있습니다.') +
          '</p></div>') +
      '<div class="jrow jrow-full">' +
        '<label for="pi-why-' + esc(p.id) + '">무엇을 보고 적으셨나요</label>' +
        '<input id="pi-why-' + esc(p.id) + '" name="why" maxlength="200" ' +
        'placeholder="사업자등록증 사본 확인" required>' +
        '<p class="agree-no">기록에 남습니다. ⚠️ 적으신 <b>값은 기록에 ' +
        '담지 않습니다</b> (대표자 성함이 들어갑니다) — 어느 칸을 고쳤는지만 ' +
        '남습니다.</p>' +
      '</div>' +
      '<button class="btn btn-pt btn-sm" type="submit">사업자 정보 저장</button>' +
      '<button class="btn btn-line btn-sm" type="button" data-pvidx="1">그만</button>' +
      '</form>';
  }
  /* ════════════════════════════════════════════════════════════════
     개인인가 사업자인가 — 전자상거래법 제20조의4 ③   (0071)

     ⚠️⚠️⚠️ **구분해 표시해야 합니다.** `/join` 이 「사업자등록 없어도
     신청하실 수 있습니다」 로 문을 열었으므로, 손님 화면에 개인 프로와
     사업자가 섞입니다. 그때 법이 구분해 표시하라고 합니다.
     ⚠️⚠️ **모르면 아무 딱지도 안 찍습니다**(`kind` 가 null) — 「미확인」
     같은 말도 안 찍습니다(그것도 우리가 만든 평가입니다 · 절대 규칙 1).
     ⚠️⚠️ **`brn` 이 비었다고 '개인' 으로 읽으면 안 됩니다** — 사업자인데
     번호를 아직 안 적은 업체가 개인으로 찍힙니다.
     ⚠️ **관리자만** 그립니다 — 문이 직원을 거절하므로, 그리면 눌러도
     거절되는 칸입니다(절대 규칙 5). 왜 없는지는 한 줄로 적습니다.
     ════════════════════════════════════════════════════════════════ */
  function kindBlock(p){
    var k = window.amPvKind ? window.amPvKind(p) : null;
    var admin = !!(A && A.role === "admin");
    var head = '<p class="fe-r">손님 화면 구분 — ' +
      (k ? '<b>' + esc(k.name) + '</b>' + (k.note ? ' <span class="dk-hint">' +
            esc(k.note) + '</span>' : '')
         : '<span class="dk-hint">아직 정하지 않았습니다 ' +
           '(손님 화면에 아무 표시도 안 나갑니다)</span>') + '</p>';
    if(!admin)
      return head + '<p class="dk-hint">이 구분은 <b>관리자</b>만 정합니다 — ' +
        '사업자등록증을 보는 사람과 같은 사람이어야 합니다.</p>';
    var bt = "";
    if(k === null || k.key !== "biz")
      bt += '<button class="btn btn-sm btn-line" data-pvkind="' + esc(p.id) +
            '" data-kindto="biz">사업자로</button>';
    if(k === null || k.key !== "person")
      bt += '<button class="btn btn-sm btn-line" data-pvkind="' + esc(p.id) +
            '" data-kindto="person">개인으로</button>';
    /* ⚠️ 되돌리는 길을 꼭 냅니다 — 잘못 켠 구분이 손님 화면에 그대로
       남으면 법이 요구한 표시가 거꾸로 나갑니다. */
    if(k !== null)
      bt += '<button class="btn btn-sm btn-bad" data-pvkind="' + esc(p.id) +
            '" data-kindto="">모름으로</button>';
    return head + '<div class="dk-b">' + bt + '</div>';
  }
  function identBlock(p){
    /* ⚠️ 값을 읽는 파일이 안 실렸으면 **지어내지 않고 안 그립니다** —
       그리고 운영자에게 말합니다 (절대 규칙 3). */
    if(!window.amProviderIdent){
      console.warn("  ⚠️ /admin 에 /js/data/providers.js 가 안 실려 " +
                   "사업자 정보 자리를 그리지 못했습니다 (0057).");
      return "";
    }
    /* ⚠️ 제목 태그를 쓰지 않습니다 — 이 상자의 제목은 h2(.adm-h) 이고
       그 아래 바로 h4 를 쓰면 **제목 단계가 건너뛰어집니다**(check-a11y). */
    return '<div class="pvidb"><p class="pvidb-t">사업자 정보 ' +
      '<span class="fe-r">(손님 화면에 그대로 나옵니다 · 제20조 제2항)</span></p>' +
      identRows(p) +
      (EDIT === p.id
        ? identForm(p)
        : '<button class="btn btn-sm btn-line" data-pvid="' + esc(p.id) + '">' +
          (window.amProviderHasIdent(p)
            ? "사업자 정보 고치기" : "사업자 정보 적기") + '</button>') +
      '</div>';
  }

  /* ── 담당자 초대 (0043) ───────────────────────────────────────────
     ⚠️⚠️⚠️ **역할을 올리는 길입니다.** 0018 이 이 연결을 일부러 화면
     없이 두었던 까닭이 "화면에서 역할을 올릴 수 있으면 그게 가장 큰
     구멍" 이어서입니다 — 그래서 단추 하나로 잇지 않고, **한 번 쓰는
     코드**를 내어 담당자가 /desk 에서 넣게 합니다. 올릴지 말지는
     여전히 운영자가 정합니다.
     ⚠️ 코드는 **열쇠**입니다. 화면에만 보이고 기록(audit_log)에는
     안 들어갑니다. 전화로 불러 주실 수 있게 헷갈리는 글자를 뺐습니다. */
  function inviteBlock(p){
    var live = (INV || []).filter(function(x){
      return x.provider_id === p.id && x.live;
    })[0];
    /* ⚠️ 정지된 업체에는 단추를 안 냅니다 — 눌러도 DB 가 거절합니다 */
    if(p.state === "suspended")
      return '<p class="dk-hint">정지된 업체에는 담당자를 새로 들이지 않습니다.</p>';
    if(live)
      return '<div class="inv"><p class="inv-t">담당자 초대 코드</p>' +
        '<p class="inv-c">' + esc(live.code) + '</p>' +
        '<p class="inv-d">' + esc(window.amDay ? window.amDay(live.expires_at) : "") +
        ' 까지 · <b>한 번만</b> 쓸 수 있습니다. 담당자가 로그인한 뒤 ' +
        '<b>업체 작업실(/desk)</b> 에서 넣으면 계정이 이어집니다.</p>' +
        '<div class="dk-b"><button class="btn btn-sm btn-line" data-ivvoid="' +
        esc(live.code) + '">코드 거두기</button></div></div>';
    return '<div class="dk-b"><button class="btn btn-sm btn-line" data-ivmake="' +
      esc(p.id) + '">담당자 초대 코드 만들기</button></div>';
  }

  /* ── 입점 신청 ──────────────────────────────────────────────────── */
  function apView(list){
    if(!list.length)
      return '<p class="myhint">아직 들어온 입점 신청이 없습니다.</p>';
    return '<ul class="fe-p">' + list.map(function(a){
      var s = apOf(a.state);
      return '<li><b>' + esc(a.company || "(상호 없음)") + '</b> ' +
        badge(s.name, s.tone) +
        '<p class="fe-r">' + esc(a.no || "") +
          (a.region ? " · " + esc(a.region) : "") +
          (a.brn ? " · 사업자 " + esc(a.brn) : "") + '</p>' +
        '<p class="fe-r">' + esc(a.name || "") +
          (a.tel ? " · " + esc(a.tel) : "") +
          (a.email ? " · " + esc(a.email) : "") + '</p>' +
        (a.services ? '<p class="fe-r">하려는 일 — ' + esc(a.services) + '</p>' : '') +
        (a.note ? '<p class="fe-r">' + esc(a.note) + '</p>' : '') +
        '<div class="dk-b">' +
          (a.state === "new"
            ? '<button class="btn btn-sm btn-line" data-apto="called" ' +
              'data-ap="' + esc(a.id) + '">연락했음</button>' : '') +
          (a.state !== "drop"
            ? '<button class="btn btn-sm btn-line" data-apto="drop" ' +
              'data-ap="' + esc(a.id) + '">진행 안 함</button>' : '') +
        '</div>' +
        /* ⚠️⚠️ **등록(done)을 단추 하나로 두지 않습니다** — 업체 줄을
           먼저 만들어야 합니다 (주소 · 하는 일 · 지역). 그 양식으로
           보내고, 만든 뒤에 이 신청을 <b>등록 완료</b>로 옮깁니다.
           ⚠️ 거둔 신청(진행 안 함)에는 안 냅니다 (절대 규칙 5). */
        (a.state !== "drop" && a.state !== "done"
          ? '<p class="dk-hint">업체 줄을 만든 뒤에 이 신청을 ' +
            '<b>등록 완료</b>로 옮기세요.</p>' +
            '<div class="dk-b"><button class="btn btn-sm btn-pt" ' +
            'data-mkpv="' + esc(a.id) + '">이 신청으로 업체 만들기</button></div>' +
            /* ⚠️⚠️⚠️ **등록 완료는 그 업체를 가리켜야 합니다** (0016) —
               안 가리키면 DB 가 "등록한 업체를 골라 주세요" 로 거절합니다.
               전에는 이 화면이 업체를 안 보내서 **등록 완료로 옮기는
               길이 아예 막혀 있었습니다** (끝까지 눌러 보는 검사가
               찾았습니다 — tools/sql/flow.js). */
            '<div class="dk-b ap-done">' +
              '<label class="sr" for="apd-' + esc(a.id) + '">등록한 업체</label>' +
              '<select id="apd-' + esc(a.id) + '" data-apsel="' + esc(a.id) + '">' +
                '<option value="">등록한 업체를 고르십니다</option>' +
                (LIST || []).map(function(p){
                  return '<option value="' + esc(p.id) + '">' + esc(p.name) + '</option>';
                }).join("") +
              '</select>' +
              '<button class="btn btn-sm btn-line" data-apdone="' + esc(a.id) +
              '">등록 완료로</button>' +
            '</div>'
          : '') +
          /* ⚠️⚠️⚠️ **초대 코드를 돌리지 않고 바로 잇습니다** (0071).
             전에는 등록까지 끝낸 뒤에도 ⑤ 초대 코드를 내고 ⑥ 전화 · 메일로
             전해 주고 ⑦ 프로가 그것을 넣어야 했습니다 — 프로 한 분당
             저장소 **밖의** 걸음이 셋이었습니다. 신청하실 때 로그인하셨으면
             그 계정이 `by_user` 에 담겨 있으므로 여기서 한 번에 잇습니다.
             ⚠️ 비로그인으로 넣으신 신청은 `by_user` 가 비어 이 단추를
             **안 냅니다** — 그때는 초대 코드 길(0043)이 맞습니다(막다른
             길로 두지 않습니다 · 아래 한 줄로 그렇게 말합니다).
             ⚠️⚠️ 화면이 계정 uuid 를 **안 보냅니다** — 접수번호만 보내고
             이을 계정은 문이 그 신청 줄에서 꺼냅니다(보내게 두면 운영자
             화면이 뚫리는 날 아무 계정이나 올릴 수 있습니다). */
          (a.state === "done" && a.provider_id
            ? (a.by_user
                ? '<div class="dk-b"><button class="btn btn-sm btn-pt" ' +
                  'data-aplink="' + esc(a.no || "") + '">' +
                  '신청하신 분을 담당자로 잇기</button>' +
                  '<span class="dk-hint">초대 코드 없이 바로 ' +
                  '/desk 에 들어가십니다.</span></div>'
                : '<p class="dk-hint">로그인하지 않고 넣으신 신청입니다 — ' +
                  '업체 줄에서 <b>초대 코드</b>를 내 주세요.</p>')
            : '') +
      '</li>';
    }).join("") + '</ul>';
  }

  /* ── 업체 등록 양식 (0007→0023 의 save_provider) ─────────────────
     ⚠️⚠️⚠️ **이 양식이 없어서 `save_provider` 도 부르는 자리가 0곳
     이었습니다.** 입점 신청을 받아 놓고 업체 줄을 만들 길이 없으면
     신청은 "연락했음" 에서 더 못 갑니다 — 사장님이 SQL 편집기를 열어야
     했습니다. `tools/check-doors.js` 가 그것을 세어서 찾았습니다.

     ⚠️⚠️ **주소가 될 값(id)은 나중에 못 바꿉니다** (`/pro/<id>` 가
     됩니다). 이미 있는 id 를 적으면 `save_provider` 가 **그 업체를
     덮어씁니다** — 조용히 남의 업체를 고치는 일이 생기지 않게 화면이
     먼저 묻습니다.
     ⚠️ 하는 일 · 지역의 **키**는 `js/data/catalog.js` ·
     `js/data/regions.js` 한 곳에서 옵니다 (손으로 적으면 어긋납니다). */
  var PRE = null;        /* 입점 신청에서 넘어온 값 */

  /* ⚠️ 이름표 · 체크칸은 **입점 양식과 같은 클래스**를 씁니다
     (.svcs · .svc · .chk) — 새 클래스를 지으면 누름 40px · 12px 규칙을
     그 자리에만 다시 적어야 하고, 한쪽만 고치는 날 어긋납니다. */
  function cbRow(nm, key, label, on){
    return '<label class="chk"><input type="checkbox" name="' + nm + '" value="' +
      esc(key) + '"' + (on ? " checked" : "") + '><span>' + esc(label) + '</span></label>';
  }
  function newForm(){
    /* ⚠️ 신청서의 지역은 **이름**으로 적혀 있고(0016) 업체 표는 **키**를
       씁니다 — 이름이 맞는 것 하나를 미리 켜 둡니다. */
    var want = (PRE && PRE.region) || "";
    var regs = (window.AM_REGIONS || []).map(function(r){
      return cbRow("rg", r.key, r.name, r.name === want || r.full === want);
    }).join("");
    var cats = (window.amCatsForProvider ? amCatsForProvider() : []).map(function(c){
      return '<fieldset class="svc"><legend>' + esc(c.name) + '</legend>' +
        amCatItemsForProvider(c).map(function(it){
          return cbRow("sb", it.key, it.name, false);
        }).join("") + '</fieldset>';
    }).join("");
    /* ⚠️ 고를 것이 없으면 양식을 내지 않습니다 (빈 칸만 보입니다) */
    if(!regs || !cats)
      return '<p class="myhint">분류 · 지역 자료를 읽지 못해 양식을 내지 못했습니다.</p>';
    return '<p class="myhint">⚠️ 만든 업체는 <b>비공개로</b> 들어갑니다 — ' +
      '<b>업체</b> 갈래에서 공개 · 배정을 켜셔야 손님에게 보입니다. ' +
      '손님 화면(검색 · 업체 목록)에 찍히는 것은 자료를 다시 가져와 ' +
      '올린 뒤입니다.</p>' +
      '<form id="pvnew" class="jform">' +
      (PRE && PRE.no
        ? '<p class="dk-hint">입점 신청 <b>' + esc(PRE.no) + '</b> 로 만듭니다.</p>'
        : '') +
      '<div class="jrow">' +
        '<label for="pn-id">주소가 될 값 <b>*</b></label>' +
        '<input id="pn-id" name="id" required maxlength="40" ' +
        'pattern="[a-z0-9][a-z0-9-]*" placeholder="green-academy" ' +
        'autocapitalize="off" spellcheck="false">' +
        '<p class="agree-no">영문 소문자 · 숫자 · 붙임표만 됩니다. ' +
        '주소가 <b>/pro/green-academy</b> 가 되고 <b>나중에 못 바꿉니다.</b></p>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="pn-name">상호 <b>*</b></label>' +
        '<input id="pn-name" name="name" required maxlength="60" value="' +
        esc((PRE && PRE.company) || "") + '">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="pn-hours">상담 가능 시간</label>' +
        '<input id="pn-hours" name="hours" maxlength="60" placeholder="평일 10~19시">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="pn-since">개업 연도</label>' +
        '<input id="pn-since" name="since" inputmode="numeric" maxlength="4" ' +
        'placeholder="2019">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label>맡는 지역</label>' +
        '<div class="svcs"><fieldset class="svc"><legend>지역</legend>' +
        regs + '</fieldset></div>' +
        '<p class="agree-no">하나도 안 고르시면 지역 거르개에 안 걸립니다.</p>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label>하는 일 <b>*</b></label>' +
        '<div class="svcs">' + cats + '</div>' +
        '<p class="agree-no">⚠️ 하나는 고르셔야 합니다 — 비면 ' +
        '<b>아무 분류에도 안 걸립니다.</b></p>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="pn-intro">소개</label>' +
        '<textarea id="pn-intro" name="intro" rows="3" maxlength="600"></textarea>' +
      '</div>' +
      '<button class="btn btn-pt" type="submit">업체 만들기</button>' +
      '<p class="pn-m lmsg" hidden></p>' +
      '</form>';
  }

  function picked(f, nm){
    return Array.prototype.map.call(
      f.querySelectorAll('input[name="' + nm + '"]:checked'),
      function(x){ return x.value; });
  }
  function submitNew(f, list){
    var m  = f.querySelector(".pn-m");
    var bt = f.querySelector('button[type="submit"]');
    var id = (f.id && f.querySelector("#pn-id").value || "").trim().toLowerCase();
    var nm = (f.querySelector("#pn-name").value || "").trim();
    /* ⚠️⚠️ 이미 있는 id 면 **덮어씁니다** — 먼저 묻습니다 */
    var dup = (list || []).filter(function(p){ return p.id === id; })[0];
    if(dup && !confirm("이미 있는 업체입니다 — 「" + dup.name +
                       "」의 정보를 덮어씁니다. 계속하시겠습니까?")) return;
    var data = {
      intro: (f.querySelector("#pn-intro").value || "").trim() || null,
      regions: picked(f, "rg"),
      gu: [],
      subs: picked(f, "sb"),
      consultHours: (f.querySelector("#pn-hours").value || "").trim() || null,
      since: (f.querySelector("#pn-since").value || "").trim() || null
    };
    bt.disabled = true;
    if(m){ m.hidden = false; m.textContent = "만드는 중입니다…"; }
    /* ⚠️ 감사 기록에 **어느 신청으로 만들었는지**를 남깁니다 */
    rpc("save_provider", { p_id: id, p_name: nm, p_data: data,
                           p_why: (PRE && PRE.no)
                             ? ("입점 신청 " + PRE.no + " 등록")
                             : "관리자 화면에서 등록" })
      .then(function(){
        /* ⚠️⚠️ **신청 상태는 여기서 안 옮깁니다.** 두 문을 한 번에
           부르면 뒤가 떨어졌을 때 무엇이 됐는지 알 수 없습니다 —
           무엇을 더 하셔야 하는지 적습니다. */
        var left = (PRE && PRE.no)
          ? " 입점 신청 " + PRE.no + " 는 **등록 완료**로 옮겨 주세요."
          : "";
        PRE = null; TAB = "pv";
        paint().then(function(){
          say("업체를 만들었습니다 — 아직 비공개입니다. 공개 · 배정을 켜 주세요." +
              left.replace(/\*\*/g, ""));
        });
      })
      .catch(function(err){
        bt.disabled = false;
        if(m) m.textContent = why(err);
      });
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">업체 심사 · 정지 · 등록</h2>' +
      '<p class="lmsg">읽는 중입니다…</p>';
    /* ⚠️ 돌려줍니다 — 다시 그린 **뒤에** 할 말이 있습니다 (그러지 않으면
       그 말이 "읽는 중입니다" 와 함께 지워집니다). */
    return load().then(function(got){
      var pvs = got[0], aps = got[1];
      /* ⚠️⚠️ 못 읽었으면 **0건이라고 말하지 않습니다.** */
      if(pvs === null || aps === null){
        box.innerHTML = '<h2 class="adm-h">업체 심사 · 정지</h2>' +
          '<p class="lmsg">읽지 못했습니다. ' +
          '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
        return;
      }
      LIST = pvs; APL = aps; APOK = true; INV = got[2] || [];
      box.innerHTML = '<h2 class="adm-h">업체 심사 · 정지 · 등록</h2>' + tabs() +
        '<div class="bz-body">' +
        (TAB === "pv" ? pvView(pvs) : TAB === "ap" ? apView(aps) : newForm()) +
        '</div><p class="dk-m lmsg" hidden></p>';
    });
  }
  function say(t){
    var m = box.querySelector(".dk-m");
    if(m){ m.hidden = false; m.textContent = t; }
  }

  box.addEventListener("click", function(e){
    var t = e.target.closest ? e.target.closest("button[data-ptab]") : null;
    if(t){ TAB = t.getAttribute("data-ptab"); return paint(); }
    var ag = e.target.closest ? e.target.closest("button[data-do='again']") : null;
    if(ag) return paint();

    /* 사업자 정보 (0057) — 적는 양식을 엽니다 · 닫습니다 */
    var ib = e.target.closest ? e.target.closest("button[data-pvid]") : null;
    if(ib){ EDIT = ib.getAttribute("data-pvid"); return paint(); }
    var ix = e.target.closest ? e.target.closest("button[data-pvidx]") : null;
    if(ix){ EDIT = ""; return paint(); }

    /* 상태 — ⚠️ 정지 · 거절에만 까닭을 받습니다 (DB 도 그렇습니다).
       푸는 데에도 까닭을 받으면 사람이 아무 글자나 적습니다. */
    var sb = e.target.closest ? e.target.closest("button[data-pvto]") : null;
    if(sb){
      var to = sb.getAttribute("data-pvto"), w = null;
      if(to === "suspended"){
        w = prompt("정지하시는 까닭을 적어 주세요 (기록에 남고, 업체도 볼 수 있습니다)");
        if(!(w && w.trim())) return;
        w = w.trim();
      }
      sb.disabled = true; say("바꾸는 중입니다…");
      rpc("set_provider_state", { p: { id: sb.getAttribute("data-pv"), to: to, why: w } })
        .then(paint).catch(function(err){ sb.disabled = false; say(why(err)); });
      return;
    }
    /* 공개 · 배정 — ⚠️ 둘 다 approve_provider 한 문입니다 */
    var lb = e.target.closest ? e.target.closest("button[data-pvlist]") : null;
    if(lb){
      var on = lb.getAttribute("data-on") === "1";
      var w2 = prompt((on ? "비공개로 돌리시는" : "공개로 켜시는") +
                      " 까닭을 적어 주세요 (기록에 남습니다)");
      if(!(w2 && w2.trim())) return;
      lb.disabled = true; say("바꾸는 중입니다…");
      rpc("approve_provider", { p_id: lb.getAttribute("data-pvlist"),
                                p_listed: !on, p_why: w2.trim() })
        .then(paint).catch(function(err){ lb.disabled = false; say(why(err)); });
      return;
    }
    var ab = e.target.closest ? e.target.closest("button[data-pvasg]") : null;
    if(ab){
      var on2 = ab.getAttribute("data-on") === "1";
      var w3 = prompt((on2 ? "배정을 끄시는" : "배정을 켜시는") +
                      " 까닭을 적어 주세요 (기록에 남습니다)");
      if(!(w3 && w3.trim())) return;
      ab.disabled = true; say("바꾸는 중입니다…");
      rpc("approve_provider", { p_id: ab.getAttribute("data-pvasg"),
                                p_assignable: !on2, p_why: w3.trim() })
        .then(paint).catch(function(err){ ab.disabled = false; say(why(err)); });
      return;
    }
    /* 담당자 초대 (0043) */
    var ivm = e.target.closest ? e.target.closest("button[data-ivmake]") : null;
    if(ivm){
      ivm.disabled = true; say("코드를 만드는 중입니다…");
      rpc("make_provider_invite", { p: { provider: ivm.getAttribute("data-ivmake") } })
        .then(function(){ return paint(); })
        .then(function(){ say("코드를 만들었습니다 — 담당자에게 전해 주세요. " +
          "그 업체의 **안 쓴 옛 코드는 거두었습니다**.".replace(/\*\*/g, "")); })
        .catch(function(err){ ivm.disabled = false; say(why(err)); });
      return;
    }
    var ivv = e.target.closest ? e.target.closest("button[data-ivvoid]") : null;
    if(ivv){
      /* ⚠️ 거두는 데에도 까닭을 받습니다 (DB 도 받습니다) */
      var w5 = prompt("코드를 거두시는 까닭을 적어 주세요 (기록에 남습니다)");
      if(!(w5 && w5.trim())) return;
      ivv.disabled = true; say("거두는 중입니다…");
      rpc("void_provider_invite", { p: { code: ivv.getAttribute("data-ivvoid"),
                                         why: w5.trim() } })
        .then(function(){ return paint(); })
        .then(function(){ say("거두었습니다. 그 코드는 더 쓸 수 없습니다."); })
        .catch(function(err){ ivv.disabled = false; say(why(err)); });
      return;
    }
    /* 신청에서 업체 등록 양식으로 — ⚠️ 그 신청의 값을 **채워서** 엽니다
       (운영자가 상호를 다시 타이핑하면 그때 오타가 들어갑니다). */
    var mk = e.target.closest ? e.target.closest("button[data-mkpv]") : null;
    if(mk){
      var id0 = mk.getAttribute("data-mkpv");
      PRE = (APL || []).filter(function(x){ return x.id === id0; })[0] || null;
      TAB = "new";
      return paint();
    }
    /* 등록 완료 — ⚠️ 그 업체를 **가리켜야** 합니다 (0016) */
    var apd = e.target.closest ? e.target.closest("button[data-apdone]") : null;
    if(apd){
      var aid = apd.getAttribute("data-apdone");
      var sel = box.querySelector("select[data-apsel='" + aid + "']");
      var pvid = sel ? sel.value : "";
      if(!pvid){
        /* ⚠️ 조용히 아무 일도 안 나면 고장으로 읽힙니다 */
        say("등록한 업체를 먼저 고르십니다 — 없으면 **이 신청으로 업체 만들기**로 ".replace(/\*\*/g, "") +
            "업체를 먼저 만드세요.");
        return;
      }
      apd.disabled = true; say("옮기는 중입니다…");
      rpc("set_apply_state", { p_apply: aid, p_to: "done", p_provider: pvid,
                               p_why: "업체로 등록했습니다" })
        .then(paint).catch(function(err){ apd.disabled = false; say(why(err)); });
      return;
    }
      /* ⚠️⚠️⚠️ 0071 — 신청하신 분을 담당자로 잇습니다 (초대 코드 없이).
         ⚠️ 접수번호만 보냅니다 — 이을 계정은 **문이** 그 신청 줄에서
         꺼냅니다(화면이 계정 uuid 를 보내면 거기가 구멍입니다).
         ⚠️ 되돌리기 어려운 일이라 **한 번 여쭙습니다** — 끊는 길은
         0052 의 `drop_provider_staff` 입니다. */
      var lk = e.target.closest ? e.target.closest("button[data-aplink]") : null;
      if(lk){
        var w5 = prompt("잇는 까닭을 적어 주세요 (기록에 남습니다)\n" +
                        "⚠️ 이으면 그분이 업체 담당자가 되어 그 업체의 요청 · " +
                        "견적 · 손님 연락처를 보십니다.");
        if(!(w5 && w5.trim())) return;
        lk.disabled = true; say("잇는 중입니다…");
        rpc("link_apply_account", { p: { no: lk.getAttribute("data-aplink"),
                                         why: w5.trim() } })
          .then(paint)
          .then(function(){ say("이었습니다. 그분이 /desk 에 바로 들어가십니다."); })
          .catch(function(err){ lk.disabled = false; say(why(err)); });
        return;
      }
      /* ⚠️⚠️⚠️ 0071 — 개인인가 사업자인가 (제20조의4 ③).
         ⚠️ **관리자만** 눌립니다 — 문이 직원을 거절합니다. 그래서 단추도
         관리자에게만 그립니다(그리면 눌러도 거절되는 칸입니다 · 절대 규칙 5).
         ⚠️ 빈 값으로 보내면 **모름으로 되돌립니다** — 잘못 켠 것을 되돌릴
         길이 없으면 손님 화면에 법이 요구한 구분이 거꾸로 남습니다. */
      var kb = e.target.closest ? e.target.closest("button[data-pvkind]") : null;
      if(kb){
        var k2 = kb.getAttribute("data-kindto") || "";
        /* ⚠️⚠️ 조사를 글자로 박지 않습니다 — 「사업자로」는 맞지만
           「개인로」는 틀립니다(「개인으로」). 문법도 · 빌드도 · 검사도 전부
           통과하고 **띄워 봐야** 압니다 — 붙이는 자리는 josa() 한 곳입니다. */
        var kn = k2 === "biz" ? "사업자" : "개인";
        var w6 = prompt((k2 ? "이 업체를 " + (window.koWith ? window.koWith(kn, "으로로") : kn + "로") +
                              " 정하시는" : "구분을 모름으로 되돌리시는") +
                        " 까닭을 적어 주세요 (기록에 남습니다)");
        if(!(w6 && w6.trim())) return;
        kb.disabled = true; say("바꾸는 중입니다…");
        rpc("set_provider_kind", { p: { id: kb.getAttribute("data-pvkind"),
                                        kind: k2, why: w6.trim() } })
          .then(paint).catch(function(err){ kb.disabled = false; say(why(err)); });
        return;
      }
    /* 입점 신청 */
    var pb = e.target.closest ? e.target.closest("button[data-apto]") : null;
    if(pb){
      var to2 = pb.getAttribute("data-apto");
      var w4 = prompt("까닭을 적어 주세요 (기록에 남습니다)");
      if(!(w4 && w4.trim())) return;
      pb.disabled = true; say("바꾸는 중입니다…");
      rpc("set_apply_state", { p_apply: pb.getAttribute("data-ap"),
                               p_to: to2, p_why: w4.trim() })
        .then(paint).catch(function(err){ pb.disabled = false; say(why(err)); });
      return;
    }
  });

  /* 업체 등록 양식 — ⚠️ 보내는 꾸러미는 **한 곳**에서 짓습니다
     (화면마다 짜면 칸 이름 하나가 어긋나도 열리기는 합니다). */
  box.addEventListener("submit", function(e){
    /* ── 사업자 정보 (0057) ─────────────────────────────────────────
       ⚠️⚠️ **보낸 칸만 고치는 문입니다** — 그래서 `brn` 은 관리자가
       아니면 꾸러미에 **넣지 않습니다**(넣으면 문이 거절합니다). 직원이
       나머지 넷을 적는 것은 됩니다.
       ⚠️ 인자는 꾸러미 하나(`{ p: {...} }`)입니다 — 0013 · 0003 만
       자리 인자이고 그것이 예외입니다. */
    var pf = e.target.closest ? e.target.closest("form[data-pvidf]") : null;
    if(pf){
      e.preventDefault();
      var pid = pf.getAttribute("data-pvidf");
      var gv = function(n){
        var el = pf.querySelector('[name="' + n + '"]');
        return el ? (el.value || "").trim() : null;
      };
      var w = gv("why");
      if(!w){ say("무엇을 보고 적으셨는지 까닭을 적어 주세요."); return; }
      var pk = { provider: pid, why: w,
                 ceo: gv("ceo"), addr: gv("addr"),
                 tel: gv("tel"), email: gv("email") };
      if(A && A.role === "admin" && pf.querySelector('[name="brn"]')){
        pk.brn = gv("brn");
      }
      var bt = pf.querySelector('button[type="submit"]');
      if(bt) bt.disabled = true;
      rpc("set_provider_ident", { p: pk })
        .then(function(){ EDIT = ""; return paint().then(function(){
          say("사업자 정보를 저장했습니다. ⚠️ 손님 화면에 찍히는 것은 " +
              "자료를 다시 올린 뒤입니다 (pull-providers → 배포).");
        }); })
        .catch(function(err){
          if(bt) bt.disabled = false;
          say(why(err));
        });
      return;
    }

    var f = e.target.closest ? e.target.closest("form#pvnew") : null;
    if(!f) return;
    e.preventDefault();
    submitNew(f, LIST);
  });

  amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 운영자가 아니면 **한 줄도 안 그립니다** (/admin 의 다른 자리와
       같습니다). 왜 안 되는지도 적지 않습니다 — 권한 구조를 알려 주는
       글이 됩니다. */
    if(!a.on || !a.signedIn) return;
    if(a.role !== "admin" && a.role !== "staff") return;
    paint();
  });
})();

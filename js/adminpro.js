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
  var INV  = [];           /* 살아 있는 담당자 초대 코드 */

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
          "is_test,subs,regions&order=name.asc&limit=300"),
      get("provider_apply?select=id,no,company,brn,name,tel,email,region," +
          "services,note,state,created_at&order=created_at.desc&limit=200"),
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

  function tabs(){
    return '<div class="bz-tabs" role="tablist">' +
      [["pv","업체"],["ap","입점 신청"],["new","업체 등록"]].map(function(t){
        return '<button type="button" class="btn btn-sm ' +
          (TAB === t[0] ? "btn-pri" : "btn-line") + '" data-ptab="' + t[0] + '" ' +
          'role="tab" aria-selected="' + (TAB === t[0] ? "true" : "false") + '">' +
          esc(t[1]) + '</button>';
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
          '</div>' + inviteBlock(p) + '</li>';
      }).join("") + '</ul>';
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
      LIST = pvs; APL = aps; INV = got[2] || [];
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

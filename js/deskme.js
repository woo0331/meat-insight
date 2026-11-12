/* ════════════════════════════════════════════════════════════════════
   업체가 **제 정보를 고치는** 자리 — /desk (0014→0023→0044 · 4차 §2-4)

   ⚠️⚠️⚠️ **이 화면이 없어서 `save_provider_self` 를 부르는 자리가
   0곳이었습니다** (`tools/check-doors.js` 가 세었습니다). 업체는 소개
   한 줄을 고치려고 운영자에게 전화해야 했습니다.

   ⚠️⚠️⚠️ **문이 보낸 것으로 통째로 덮어씁니다.** 칸 하나를 안 담아
   보내면 그 칸이 **빈 값으로 지워집니다** — 지역을 빠뜨리면 그 업체가
   지역 거르개에서 통째로 사라지고 아무 에러도 안 납니다. 그래서 이
   화면은 **읽은 값을 전부 다시 담아** 보냅니다 (`tools/sql/profile.js`
   가 그 성질을 검사로 박아 두었습니다).

   ⚠️⚠️ **업체가 못 고치는 것은 양식에 아예 없습니다** — 상호 · 하는
   일(subs) · 확인 배지 · 공개 여부 · 주소. 칸을 내놓고 DB 가 거절하게
   두면 눌러도 안 되는 칸이 됩니다 (절대 규칙 5). 왜 없는지는 한 줄로
   적습니다 (막다른 길로 두지 않습니다).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("mebox");
  if(!box || !window.amAuthAsk) return;

  var A = null, PV = null, ME = null;

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
    /* ⚠️ RLS 가 제 줄을 내줍니다 (0001 의 provider_public — id = my_provider()).
       ⚠️⚠️ **고칠 칸을 전부** 읽습니다. 안 읽은 칸을 안 보내면 지워집니다. */
    /* ⚠️⚠️⚠️ **문이 덮어쓰는 칸을 하나라도 안 읽으면 그 칸이 지워집니다**
       (`save_provider_self` 는 보낸 것으로 통째로 덮습니다). 그래서
       화면에 칸이 없는 것까지 **다 읽습니다** — `industries` 가 그래서
       여기 있습니다 (앞 서비스가 쓰던 칸이고 골프에서는 아무 화면도
       안 읽지만, 안 읽어 오면 저장할 때마다 비워집니다). */
    return get("provider?select=id,name,intro,regions,gu,industries,subs,since," +
               "consult_hours," +
               /* ⚠️⚠️ 0057 — 사업자 신원정보. `brn` 은 **읽기만** 합니다
                  (업체는 못 고칩니다 — 문과 트리거가 둘 다 막습니다).
                  ⚠️ 그래도 읽는 까닭: "여기서 못 고치는 것" 에 지금
                  적힌 번호를 보여 주어야 **무엇이 비었는지** 아십니다. */
               "ceo,addr,tel,email,brn," +
               /* ⚠️⚠️ 0071 — 레슨 장소 · 레슨 목적. **읽지 않으면 저장할 때마다 비워집니다** */
               "place_name,lesson_goals," +
               /* ⚠️⚠️ 0074 — 연습장 시설 속성 · 이용 시간.
                  **읽지 않으면 저장할 때마다 비워집니다**(`industries` 자리) */
               "range_opts,open_hours," +
               /* ⚠️⚠️ 0076 — 피팅 이용 방식. **읽지 않으면 저장할 때마다 비워집니다** */
               /* ⚠️⚠️ 0079 — 피팅 거래 조건. **읽지 않으면 저장할 때마다 비워집니다** */
               "fit_ways,fit_terms," +
               "brands,scale,contact_ways,verified,listed,assignable,state,state_why" +
               "&id=eq." + encodeURIComponent(PV) + "&limit=1");
  }

  /* ⚠️⚠️⚠️ **안 그려진 칸은 읽은 값을 그대로 돌려보냅니다.** 이 문은
     보낸 것으로 통째로 덮으므로, 빈 값을 보내면 그 칸이 **지워집니다** —
     `industries` 가 그래서 저장할 때마다 비워지고 있었습니다(2026-11-05).
     레슨 목적 칸은 레슨을 하시는 업체에만 그리므로 이 가지가 필요합니다. */
  function placeVal(f){
    var el = f.querySelector("#me-place");
    return el ? (el.value || "").trim()
              : ((ME && ME.place_name) ? ME.place_name : "");
  }
  function goalVal(f){
    var b = f.querySelectorAll('input[name="goal"]');
    /* ⚠️ 그려지지 않았으면 **읽은 값을 그대로** 돌려줍니다 */
    if(!b.length) return (ME && Array.isArray(ME.lesson_goals)) ? ME.lesson_goals : [];
    return [].slice.call(b).filter(function(x){ return x.checked; })
      .map(function(x){ return x.value; });
  }
  /* 레슨을 하시는 업체인가 — ⚠️ 분류 키를 글자로 안 박습니다
     (`amSub()` 이 하위 키에서 분류를 찾아 줍니다). */
  function doesLesson(p){
    var S = (p && Array.isArray(p.subs)) ? p.subs : [];
    for(var i = 0; i < S.length; i++){
      var s = window.amSub ? window.amSub(S[i]) : null;
      if(s && s.cat && s.cat.key === "lesson") return true;
    }
    return false;
  }
  /* ⚠️ 0074 — 연습장을 하시는 업체에만 그립니다(레슨 목적과 같은 규칙) */
  function doesRange(p){
    var S = (p && Array.isArray(p.subs)) ? p.subs : [];
    for(var i = 0; i < S.length; i++){
      var s = window.amSub ? window.amSub(S[i]) : null;
      if(s && s.cat && s.cat.key === "range") return true;
    }
    return false;
  }
  /* ⚠️ 0076 — 피팅을 하시는 업체에만 그립니다(연습장과 같은 규칙) */
  function doesFit(p){
    var S = (p && Array.isArray(p.subs)) ? p.subs : [];
    for(var i = 0; i < S.length; i++){
      var s = window.amSub ? window.amSub(S[i]) : null;
      if(s && s.cat && s.cat.key === "fitting") return true;
    }
    return false;
  }
  /* ⚠️⚠️ 그려지지 않은 업체는 **읽은 값을 그대로** 돌려보냅니다 —
     빈 값을 보내면 그 칸이 지워집니다(`placeVal` · `goalVal` 과 같은 꼴). */
  function optsVal(f){
    var b = Array.prototype.slice.call(f.querySelectorAll('input[name="ropt"]:checked'))
              .map(function(x){ return x.value; });
    if(!f.querySelector('input[name="ropt"]'))
      return (ME && Array.isArray(ME.range_opts)) ? ME.range_opts : [];
    return b;
  }
  function fitWayVal(f){
    var b = Array.prototype.slice.call(f.querySelectorAll('input[name="fway"]:checked'))
              .map(function(x){ return x.value; });
    if(!f.querySelector('input[name="fway"]'))
      return (ME && Array.isArray(ME.fit_ways)) ? ME.fit_ways : [];
    return b;
  }
  /* ⚠️⚠️ 0079 — 피팅 거래 조건(부품비 포함 여부 등). 피팅을 하시는
     업체에만 그리므로, 안 그려졌으면 **읽은 값을 그대로** 돌려보냅니다. */
  function fitTermsVal(f){
    var el = f.querySelector("#me-fterms");
    return el ? (el.value || "").trim()
              : ((ME && ME.fit_terms) ? ME.fit_terms : "");
  }
  function hoursVal(f){
    var el = f.querySelector("#me-open");
    return el ? (el.value || "").trim()
              : ((ME && ME.open_hours) ? ME.open_hours : "");
  }
  function cb(nm, key, label, on){
    return '<label class="chk"><input type="checkbox" name="' + nm + '" value="' +
      esc(key) + '"' + (on ? " checked" : "") + '><span>' + esc(label) + '</span></label>';
  }

  function form(p){
    var regs = (window.AM_REGIONS || []).map(function(r){
      return cb("rg", r.key, r.name, (p.regions || []).indexOf(r.key) >= 0);
    }).join("");
    var ways = (window.AM_CONTACT_WAYS || []).map(function(w){
      return cb("cw", w.key, w.name, (p.contact_ways || []).indexOf(w.key) >= 0);
    }).join("");
    var subs = (p.subs || []).map(function(k){
      var f = window.amSub ? window.amSub(k) : null;
      return '<li><span class="chip">' + esc(f ? (f.cat.name + " · " + f.item.name) : k) +
             '</span></li>';
    }).join("");
    return '<form id="mef" class="jform">' +
      '<div class="jrow jrow-full">' +
        '<label for="me-intro">업체 소개</label>' +
        '<textarea id="me-intro" name="intro" rows="3" maxlength="600">' +
        esc(p.intro || "") + '</textarea>' +
        '<p class="agree-no">업체찾기 카드와 업체 화면에 그대로 나옵니다.</p>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="me-hours">상담 가능 시간</label>' +
        '<input id="me-hours" name="hours" maxlength="60" placeholder="평일 10~19시" ' +
        'value="' + esc(p.consult_hours || "") + '">' +
      '</div>' +
        /* ⚠️⚠️ 0071 — 레슨 · 연습 장소. 어느 연습장에서 가르치시는지는
           손님이 가장 먼저 보는 것인데 담는 칸이 없었습니다. */
        '<div class="jrow">' +
          '<label for="me-place">레슨 · 연습 장소</label>' +
          '<input id="me-place" name="place" maxlength="80" ' +
          'placeholder="OO골프클럽 연습장 · OO스크린" ' +
          'value="' + esc(p.place_name || "") + '">' +
          '<span class="jhint">가르치시는 곳 이름입니다. 비워 두셔도 됩니다.</span>' +
        '</div>' +
        /* ⚠️⚠️⚠️ **레슨을 하시는 업체에만 그립니다.** 중고 매입만 하시는
           업체에 레슨 목적 칸을 내면 골라도 쓰이지 않는 죽은 칸입니다
           (절대 규칙 5). 그려지지 않은 업체는 `goalVal()` 이 **읽은 값을
           그대로** 돌려보냅니다 — 빈 배열을 보내면 지워집니다. */
        (doesLesson(p)
          ? '<div class="jrow jrow-full">' +
              '<label>레슨 목적 <span class="jhint">(고르신 것으로 손님이 좁혀 찾습니다)</span></label>' +
              '<div class="svcs"><fieldset class="svc">' +
              '<legend>어떤 분을 가르치시나요</legend>' +
                (window.AM_LESSON_GOAL || []).map(function(g){
                  /* ⚠️ 칸 하나하나는 `cb()` **한 곳**에서 그립니다 —
                     두 벌로 적으면 한쪽만 고치는 날 모양이 달라집니다.
                     그래서 `name="goal"` 이 붙고 `goalVal()` 이 그것으로
                     집습니다. */
                  return cb("goal", g.key, g.name,
                            (p.lesson_goals || []).indexOf(g.key) >= 0);
                }).join("") +
              '</fieldset></div>' +
            '</div>'
          : "") +
        /* ⚠️⚠️ 0074 — 연습장을 하시는 업체에만. 여기서 고르신 것으로
           손님이 좁혀 찾습니다(`/cat/range` 거르개). 안 고르신 업체는 그
           거르개에서 **빠집니다** — 모르는 것을 아무 칸에나 넣으면
           지어낸 값입니다(절대 규칙 1). */
        (doesRange(p)
          ? '<div class="jrow jrow-full">' +
              '<label>시설 <span class="jhint">(고르신 것으로 손님이 좁혀 찾습니다)</span></label>' +
              '<div class="svcs"><fieldset class="svc">' +
              '<legend>어떤 시설이 있나요</legend>' +
                (window.AM_RANGE_OPT || []).map(function(o){
                  return cb("ropt", o.key, o.name,
                            (p.range_opts || []).indexOf(o.key) >= 0);
                }).join("") +
              '</fieldset></div>' +
            '</div>' +
            '<div class="jrow">' +
              '<label for="me-open">이용 시간</label>' +
              '<input id="me-open" name="open" maxlength="60" ' +
              'placeholder="06:00 ~ 23:00" ' +
              'value="' + esc(p.open_hours || "") + '">' +
              '<span class="jhint">여는 시간과 닫는 시간입니다. 비워 두셔도 됩니다.</span>' +
            '</div>'
          : "") +
        /* ⚠️⚠️ 0076 — 피팅을 하시는 업체에만. 여기서 고르신 것으로
           손님이 좁혀 찾습니다(`/cat/fitting` 거르개). 안 고르신 업체는 그
           거르개에서 **빠집니다** — 모르는 것을 아무 칸에나 넣으면
           지어낸 값입니다(절대 규칙 1). */
        (doesFit(p)
          ? '<div class="jrow jrow-full">' +
              '<label>서비스 방식 <span class="jhint">(고르신 것으로 손님이 좁혀 찾습니다)</span></label>' +
              '<div class="svcs"><fieldset class="svc">' +
              '<legend>클럽을 어떻게 받으시나요</legend>' +
                (window.AM_FIT_WAY || []).map(function(o){
                  return cb("fway", o.key, o.name + (o.lead ? " (" + o.lead + ")" : ""),
                            (p.fit_ways || []).indexOf(o.key) >= 0);
                }).join("") +
              '</fieldset></div>' +
            '</div>' +
            /* ⚠️ 제 줄로 뗍니다 — `.jrow` 는 격자라 한 칸에 몰아 넣으면
               고르개 바로 밑에 붙어 같은 묶음으로 읽힙니다. */
            '<div class="jrow jrow-full">' +
              /* ⚠️⚠️⚠️ 0079 — 거래 조건은 **업체가 적는 값**입니다.
                 「부품비 포함」 같은 말을 저희가 지어 적으면 그것이 곧
                 지키지 못하는 약속입니다(절대 규칙 1 · 5). 비우시면
                 손님 화면에서 **줄째 빠집니다**. */
              '<label for="me-fterms">거래 조건 ' +
              '<span class="jhint">(비우시면 손님 화면에서 그 줄이 빠집니다 · 120자까지)</span></label>' +
              '<input id="me-fterms" name="fterms" maxlength="120" ' +
              'placeholder="예: 공임만 받고 부품비는 따로 받습니다" ' +
              'value="' + esc(p.fit_terms || "") + '">' +
            '</div>'
          : "") +
      '<div class="jrow">' +
        '<label for="me-since">개업 연도</label>' +
        '<input id="me-since" name="since" inputmode="numeric" maxlength="4" ' +
        'value="' + esc(p.since ? String(p.since) : "") + '">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label>상담 방식</label>' +
        '<div class="svcs"><fieldset class="svc"><legend>어떻게 상담하시나요</legend>' +
        ways + '</fieldset></div>' +
        '<p class="agree-no">고르지 않으시면 그 줄이 손님 화면에서 빠집니다 ' +
        '(없는 것을 "미정" 으로 적지 않습니다).</p>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label>맡는 지역</label>' +
        '<div class="svcs"><fieldset class="svc"><legend>지역</legend>' +
        regs + '</fieldset></div>' +
        '<p class="agree-no">⚠️ 하나도 안 고르시면 지역 거르개에 안 걸립니다.</p>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label>사업자 정보</label>' +
        '<p class="agree-no">⚠️ 여기 적으시는 것은 <b>손님 화면(업체 화면)에 ' +
        '그대로 나옵니다.</b> 전자상거래법 제20조 제2항이 중개 사이트에 ' +
        '요구하는 것이라, 비어 있으면 그 줄이 손님에게 안 보입니다.</p>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="me-ceo">대표자 성명</label>' +
        '<input id="me-ceo" name="ceo" maxlength="40" ' +
        'value="' + esc(p.ceo || "") + '">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="me-tel">전화 (공개)</label>' +
        '<input id="me-tel" name="tel" maxlength="40" placeholder="02-000-0000" ' +
        'value="' + esc(p.tel || "") + '">' +
        '<p class="agree-no">⚠️ 손님이 보는 번호입니다. 배정받을 때 쓰는 ' +
        '담당자 직통은 아래 <b>배정 연락처</b> 상자에 따로 적습니다 ' +
        '(그쪽은 운영자와 이 업체만 봅니다).</p>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="me-addr">사업장 주소</label>' +
        '<input id="me-addr" name="addr" maxlength="200" ' +
        'value="' + esc(p.addr || "") + '">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="me-email">이메일 (공개)</label>' +
        '<input id="me-email" name="email" type="email" maxlength="120" ' +
        'value="' + esc(p.email || "") + '">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="me-brands">취급 브랜드</label>' +
        '<input id="me-brands" name="brands" maxlength="200" ' +
        'placeholder="타이틀리스트, 캘러웨이" value="' +
        esc((p.brands || []).join(", ")) + '">' +
        '<p class="agree-no">쉼표로 나눠 적으세요.</p>' +
      '</div>' +
      '<button class="btn btn-pt" type="submit">고친 내용 저장</button>' +
      '<p class="me-m lmsg" hidden></p>' +
      '</form>' +
      /* ⚠️⚠️ 못 고치는 것은 **칸을 내지 않고** 왜인지 적습니다 */
      '<div class="me-fix"><h3>여기서 못 고치는 것</h3>' +
        '<dl class="me-d">' +
          '<dt>상호</dt><dd>' + esc(p.name) + ' — 바꾸시려면 운영자에게 알려 주세요.</dd>' +
          '<dt>하는 일</dt><dd>' + (subs
            ? '<ul class="chips">' + subs + '</ul>' +
              '<p class="me-s">늘리거나 줄이시려면 운영자에게 알려 주세요 — ' +
              '스스로 넓히면 안 하시는 일의 요청까지 받게 됩니다.</p>'
            : '<b class="rq-q-no">아직 등록되지 않았습니다 — 운영자에게 알려 주세요.</b>') +
          '</dd>' +
          '<dt>사업자등록번호</dt><dd>' + (p.brn
            ? esc(p.brn) + ' — 서류를 보고 운영자가 적습니다.'
            : '<b class="rq-q-no">아직 안 적혔습니다</b> — 손님 화면의 ' +
              '사업자 정보에 그 줄이 빠집니다. 운영자에게 알려 주세요.') +
          '</dd>' +
          '<dt>공개 여부</dt><dd>' + (p.listed ? "공개 중" : "비공개") +
            ' · 배정 ' + (p.assignable ? "받는 중" : "안 받는 중") +
            ' — 운영자가 정합니다.</dd>' +
          '<dt>확인 배지</dt><dd>플랫폼이 서류를 확인한 뒤에만 켜집니다. ' +
            '스스로 켤 수 없습니다.</dd>' +
        '</dl></div>';
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">업체 정보</h2><p class="lmsg">읽는 중입니다…</p>';
    return load().then(function(rows){
      /* ⚠️⚠️ 못 읽었으면 **빈 양식을 그리지 않습니다** — 빈 양식을 그리고
         저장을 누르면 그 순간 소개 · 지역이 통째로 지워집니다. */
      if(rows === null || !rows.length){
        box.innerHTML = '<h2 class="adm-h">업체 정보</h2>' +
          '<p class="lmsg">읽지 못했습니다. 저장하면 지금 적힌 것이 ' +
          '지워질 수 있어 양식을 내지 않았습니다. ' +
          '<button class="btn btn-sm btn-line" data-me="again">다시 읽기</button></p>';
        return;
      }
      ME = rows[0];
      box.innerHTML = '<h2 class="adm-h">업체 정보</h2>' +
        '<p class="myhint">고치시면 업체찾기 · 업체 화면에 그대로 나옵니다. ' +
        '손님 화면에 찍히는 것은 운영자가 자료를 다시 올린 뒤입니다.</p>' +
        (ME.state === "suspended"
          ? '<p class="myhint">⚠️ 지금 <b>정지</b> 상태입니다' +
            (ME.state_why ? ' — ' + esc(ME.state_why) : '') +
            '. 고치실 수는 있지만 손님 화면에는 나오지 않습니다.</p>'
          : '') +
        form(ME);
    });
  }

  box.addEventListener("click", function(e){
    var ag = e.target.closest ? e.target.closest("[data-me='again']") : null;
    if(ag) return paint();
  });

  box.addEventListener("submit", function(e){
    var f = e.target.closest ? e.target.closest("form#mef") : null;
    if(!f) return;
    e.preventDefault();
    var m = f.querySelector(".me-m");
    var bt = f.querySelector('button[type="submit"]');
    var pick = function(nm){
      return Array.prototype.map.call(
        f.querySelectorAll('input[name="' + nm + '"]:checked'),
        function(x){ return x.value; });
    };
    /* ⚠️⚠️⚠️ **읽은 값을 전부 다시 담습니다.** 문이 보낸 것으로 통째로
       덮어쓰므로, 여기서 빠뜨린 칸은 그 순간 지워집니다.
       ⚠️ 그래서 ME 가 없으면 **보내지 않습니다**. */
    if(!ME){ if(m){ m.hidden = false; m.textContent = "아직 읽지 못했습니다."; } return; }
    var data = {
      intro: (f.querySelector("#me-intro").value || "").trim(),
      regions: pick("rg"),
      contactWays: pick("cw"),
      consultHours: (f.querySelector("#me-hours").value || "").trim(),
      since: (f.querySelector("#me-since").value || "").trim(),
      brands: (f.querySelector("#me-brands").value || "").split(",")
        .map(function(x){ return x.trim(); }).filter(Boolean),
      /* ⚠️⚠️ 0057 — 사업자 신원정보 넷. **brn 은 안 보냅니다** (문이
         그 칸을 안 건드리고, 보내도 트리거가 막습니다). */
      ceo: (f.querySelector("#me-ceo").value || "").trim(),
      addr: (f.querySelector("#me-addr").value || "").trim(),
      tel: (f.querySelector("#me-tel").value || "").trim(),
      email: (f.querySelector("#me-email").value || "").trim(),
      /* ⚠️⚠️⚠️ 화면에 칸이 없는 것도 **읽은 값 그대로** 돌려보냅니다 —
         안 보내면 지워집니다 (gu · industries · scale).
         ⚠️ 이 주석은 셋을 적어 놓고 **`industries` 를 안 보내고**
         있었습니다 (2026-11-05 에 찾았습니다) — 업체가 작업실에서
         저장할 때마다 그 칸이 조용히 비워졌습니다. 골프에서는 아무
         화면도 그 칸을 안 읽어서 **아무 데서도 안 보이는 고장**이었고,
         누가 그 칸을 쓰기 시작하는 날 터질 참이었습니다.
         ⚠️⚠️ **주석이 적은 것과 코드가 보내는 것을 맞춰 보세요** —
         주석이 맞는다고 믿을 수 없습니다. */
      gu: ME.gu || [],
      industries: ME.industries || [],
      scale: ME.scale || "",
      /* ⚠️⚠️ 0071 — 네 칸이 라 **보내지 않으면 지워집니다** */
      placeName: placeVal(f),
      lessonGoals: goalVal(f),
      /* ⚠️⚠️ 0074 — 칸 둘을 더했으니 **읽고 또 보내야** 합니다 */
      rangeOpts: optsVal(f),
      fitWays: fitWayVal(f),
      /* ⚠️⚠️ 0079 — 칸을 더했으니 **읽고 또 보내야** 합니다 */
      fitTerms: fitTermsVal(f),
      openHours: hoursVal(f)
    };
    bt.disabled = true;
    if(m){ m.hidden = false; m.textContent = "보내는 중입니다…"; }
    rpc("save_provider_self", { p_data: data, p_why: "업체가 작업실에서 고쳤습니다" })
      .then(function(){ return paint(); })
      .then(function(){
        var m2 = box.querySelector(".me-m");
        if(m2){ m2.hidden = false;
          m2.textContent = "저장했습니다. 손님 화면에는 자료를 다시 올린 뒤에 보입니다."; }
      })
      .catch(function(err){
        bt.disabled = false;
        if(m) m.textContent = why(err);
      });
  });

  amAuthAsk().then(function(a){
    A = a;
    if(!a.on || !a.signedIn) return;
    if(a.role !== "provider" || !a.provider) return;
    PV = a.provider;
    paint();
  });
})();

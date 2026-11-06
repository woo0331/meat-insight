/* ════════════════════════════════════════════════════════════════════
   배정 — /admin 의 한 자리 (2차 지시서 §5 · §7)

   손님 요청을 보고, **업체를 정해 넘기는** 자리입니다.

   ⚠️⚠️⚠️ **이 단추가 개인정보보호법 제17조입니다.** 넘기는 순간 손님의
   성함 · 연락처가 그 업체에 갑니다 — 제3자 제공입니다. 제2항은
   **제공받는 자를 알리고** 동의를 받으라고 합니다. 그래서 —
     · 접수(`make_request`)에서는 그 동의를 **받지 않았습니다**
       (그때는 어느 업체인지 몰랐습니다 — 0029 머리말).
     · 여기서 업체를 고른 다음 **그 상호를 손님에게 알리고 다시**
       받습니다. 받았다는 것을 운영자가 여기서 확인합니다.
     · DB 가 한 번 더 막습니다 — `agree3rd` 가 true 가 아니면
       `move_state` 가 거절합니다 (0004). 화면의 체크는 **둘째
       자물쇠가 아니라 운영자가 거짓을 적을 수 없게 하는 기록**입니다.

   ⚠️⚠️ **동의받은 방법을 적게 합니다.** 분쟁에서 "받았다" 만으로는
   아무것도 대지 못합니다. 그 글은 `audit_log` 에 남습니다 —
   ⚠️ 그러니 **성함 · 연락처를 거기 적지 않습니다** (감사 기록은 오래
   남고 보는 사람이 넓습니다). 안내 글에 그렇게 적어 둡니다.

   ⚠️⚠️ **검사용 업체를 가리지 않고 그대로 보여 줍니다** (0030).
   운영자는 그것이 검사용인지 알아야 합니다 — 숨기면 참 업체로 읽습니다.
   ⚠️ 손님 화면에는 안 나갑니다 (공개 정책이 막습니다).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("assignbox");
  if(!box || !window.amAuthAsk) return;

  var A = null;
  var PICK = {};         /* 어느 요청을 펼쳤나 */

  function say(html, cls){
    box.hidden = false; box.className = cls || "none"; box.innerHTML = html;
  }
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

  /* ⚠️ 아직 업체가 안 정해진 것과 **정해진 것**을 같이 냅니다 —
     "넘긴 뒤에 어떻게 됐나" 를 못 보면 운영자가 전화로 물어야 합니다. */
  var WATCH = ["new","check","assigned","accepted","consult","quoted","nego"];

  function load(){
    return Promise.all([
      get("request?select=id,no,state,cat,region,gu,budget_min,budget_max," +
          /* ⚠️ 담당 직원 (0012 의 owner_id) — "누가 바꿨나"(audit_log)와
             다른 것입니다. 이것은 **지금 누가 맡고 있나** 입니다. */
          "want_at,body,name,tel,agree3rd_at,created_at,want_provider,owner_id" +
          "&state=in.(" + WATCH.join(",") + ")&order=created_at.desc&limit=50"),
      /* ⚠️ 하는 일 · 지역 · 상태까지 읽습니다 — 조건에 맞는 업체만
         고르게 하려면 그 셋이 필요합니다 (4차 지시서 §4). */
      get("provider?select=id,name,assignable,is_test,listed,state,subs,regions" +
          "&order=name.asc&limit=200"),
      get("request_item?select=request_id,service_id&limit=500"),
      get("assignment?select=request_id,provider_id,state&limit=500"),
      /* ⚠️⚠️ **0012 가 이 길을 일부러 열어 두었습니다** — `account` 의
         정책이 "내 줄" 과 "관리자 전부" 둘뿐이라 직원은 담당자 고르개에
         **아무것도 못 채웠습니다**(uuid 만 보입니다). 0012 의
         `account_staff` 정책이 **직원 · 관리자 줄만** 엽니다 — 고객
         계정의 성함은 그대로 안 보입니다. */
      get("account?select=id,name,role&role=in.(staff,admin)" +
          "&order=name.asc&limit=100")
    ]).then(function(got){
      /* ⚠️ 손님이 붙이신 사진 · 서류 (§5-4) — 운영자는 전부 봅니다
         (0011 의 photo_staff). 넘기기 전에 무엇이 왔는지 봐야 조건에
         맞는 업체를 고를 수 있습니다. */
      var rs = got[0];
      if(!rs || !window.amPhotoRows) return got.concat([{}]);
      return window.amPhotoRows(A.conf, rs.map(function(r){ return r.id; }))
        .then(function(by){ return got.concat([by]); });
    });
  }

  function badge(name, tone){
    return '<span class="dk-st dk-' + esc(tone) + '">' + esc(name) + '</span>';
  }

  /* 넘길 수 있는 업체 — ⚠️ `assignable` 이 꺼진 곳은 **고를 수 없게**
     합니다. 골라도 DB 가 거절하므로, 고르게 두면 눌러도 안 되는 단추가
     됩니다 (절대 규칙 5). */
  /* ⚠️⚠️⚠️ **조건에 맞는 업체만 고르게 합니다** (4차 지시서 §4).
     전에는 `assignable` 이 켜진 업체를 **전부** 늘어놓았습니다 — 서울
     레슨 요청에 부산 피팅 업체가 같은 목록에 앉아 있었고, 운영자가
     실수로 고르면 그 업체에 **손님 성함 · 연락처가 넘어갑니다**
     (개인정보 보호법 제17조 — 되돌릴 수 없는 사고입니다).
     ⚠️ 맞는 것이 0곳이면 **맞지 않는 곳을 고를 수 있게** 두되,
     "조건에 안 맞습니다" 를 그 자리에 적습니다 — 운영자가 전화로
     확인하고 넘기는 길까지 막으면 업체가 적은 동안 아무도 못 받습니다. */
  function fits(p, r){
    var okCat = true, okRg = true;
    if(r.cat && window.amSub){
      okCat = (p.subs || []).some(function(k){
        var f = window.amSub(k);
        return f && f.cat.key === r.cat;
      });
    }
    /* ⚠️ 지역은 **이름**으로 들어옵니다 (손님이 고른 글자 — 0016) 이고
       업체는 **키**로 들고 있습니다. 둘을 regions.js 한 곳에서 맞춥니다. */
    if(r.region){
      var want = (window.AM_REGIONS || []).filter(function(x){
        return x.name === r.region || x.full === r.region;
      })[0];
      okRg = !want || (p.regions || []).indexOf(want.key) >= 0;
    }
    return okCat && okRg;
  }

  function pickForm(r, provs, mine){
    var can = provs.filter(function(p){ return p.assignable === true; })
                   .filter(function(p){ return mine.indexOf(p.id) < 0; })
                   /* ⚠️ 승인되지 않은 업체는 DB 가 거절합니다 (0038) —
                      고르게 두면 눌러도 안 되는 단추가 됩니다. */
                   .filter(function(p){ return p.state !== "suspended"; });
    var good = can.filter(function(p){ return fits(p, r); });
    /* 보고 오신 업체를 맨 위로 (0035) — ⚠️ 고르는 것은 운영자입니다 */
    /* ⚠️ 차례: 보고 오신 곳 → 조건에 맞는 곳 → 나머지.
       거르지 않고 **차례**로 두는 까닭은 위 머리말에 적었습니다. */
    can = can.slice().sort(function(a, b){
      var wa = (a.id === r.want_provider ? 2 : 0) + (fits(a, r) ? 1 : 0);
      var wb = (b.id === r.want_provider ? 2 : 0) + (fits(b, r) ? 1 : 0);
      return wb - wa;
    });
    if(!can.length)
      return '<p class="dk-hint">넘길 수 있는 업체가 없습니다. ' +
        '업체를 승인하고 <b>배정 가능</b>으로 켜 두셔야 고를 수 있습니다 — ' +
        '업체 계정이 먼저 이어져 있어야 켜집니다 (db/README.md).</p>';

    return '<form class="jform dk-f as-f" data-req="' + esc(r.id) + '">' +
      '<div class="jrow jrow-full">' +
        '<label for="as-p-' + esc(r.id) + '">넘길 업체 <b>*</b></label>' +
        '<select id="as-p-' + esc(r.id) + '" name="pv" required>' +
          '<option value="">고르십니다</option>' +
          can.map(function(p){
            /* ⚠️⚠️ 검사용임을 **고르는 자리에서** 말합니다
               ⚠️⚠️ 조건에 **안 맞는** 곳도 그 자리에서 말합니다 —
               고를 수는 있지만 모르고 고르면 안 됩니다. */
            return '<option value="' + esc(p.id) + '">' + esc(p.name) +
              (p.id === r.want_provider ? " — 손님이 보고 오신 곳" : "") +
              (fits(p, r) ? "" : " — ⚠️ 조건에 안 맞습니다") +
              (p.is_test ? " — 검사용" : "") + '</option>';
          }).join("") +
        '</select>' +
        '<p class="agree-no">' +
          (good.length
            ? '조건(' +
              [r.cat && window.amCat && window.amCat(r.cat)
                 ? window.amCat(r.cat).name : "", r.region || ""]
                .filter(Boolean).map(esc).join(" · ") +
              ')에 맞는 업체 <b>' + good.length + '곳</b>을 먼저 놓았습니다.'
            : '⚠️ <b>조건에 맞는 업체가 없습니다.</b> 아래는 조건이 다른 곳입니다 — ' +
              '전화로 확인하신 뒤에만 넘기십니다.') +
        '</p>' +
      '</div>' +
      '<div class="agree">' +
        '<h3>제3자 제공 재동의 (개인정보보호법 제17조 제2항)</h3>' +
        '<dl>' +
          '<dt>제공받는 자</dt><dd>위에서 고르신 업체 — <b>상호를 손님에게 알려 드린 뒤</b>에 받습니다</dd>' +
          '<dt>제공 항목</dt><dd>성함 · 연락처 · 요청하신 내용</dd>' +
          '<dt>제공 목적</dt><dd>상담 · 견적 제시</dd>' +
        '</dl>' +
        '<p class="agree-no">접수 단계의 동의에는 이것이 <b>들어 있지 않습니다.</b> ' +
        '받지 않은 채 넘기면 그 자리에서 법 위반입니다 — 받지 못하셨으면 넘기지 마십니다.</p>' +
        '<label class="chk"><input type="checkbox" name="ok" required>' +
        '<span>상호를 알리고 제3자 제공 동의를 받았습니다.</span></label>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="as-w-' + esc(r.id) + '">어떻게 받으셨습니까 <b>*</b></label>' +
        '<input id="as-w-' + esc(r.id) + '" name="whyText" required maxlength="200" ' +
        'placeholder="예: 11/03 14:20 통화로 상호 안내 후 구두 동의">' +
        /* ⚠️⚠️ 감사 기록에 사람 정보를 쌓지 않습니다 */
        '<span class="dk-hint">기록에 남습니다 — <b>성함 · 연락처는 적지 마십니다.</b> ' +
        '요청번호로 찾아갑니다.</span>' +
      '</div>' +
      '<button class="btn btn-pt" type="submit">이 업체에 넘기기</button>' +
    '</form>';
  }

  function card(r, provs, items, asgs, pics, staff){
    var st = window.amDealSt(r.state) || { name:r.state, tone:"ink" };
    var svcs = items.filter(function(x){ return x.request_id === r.id; })
      .map(function(x){
        var f = window.amSub ? amSub(x.service_id) : null;
        return f ? (f.cat.name + " · " + f.item.name) : x.service_id;
      });
    var mine = asgs.filter(function(x){ return x.request_id === r.id; });
    var byId = {};
    provs.forEach(function(p){ byId[p.id] = p; });
    /* ⚠️ 바라시는 업체를 **맨 위로** 올립니다 — 목록이 길어지면
       운영자가 그것을 찾느라 다른 것을 고릅니다. 고르는 것은 그대로
       운영자의 몫이고, 자리만 옮깁니다. */

    var h = '<div class="dk-r" data-req="' + esc(r.id) + '">';
    h += '<div class="dk-h"><b>' + esc(r.no) + '</b>' + badge(st.name, st.tone) +
         (r.agree3rd_at ? badge("제3자 동의 받음", "grn") : "") + '</div>';

    h += '<dl class="dk-d">';
    if(svcs.length) h += '<dt>요청</dt><dd>' + esc(svcs.join(" / ")) + '</dd>';
    if(r.region)    h += '<dt>지역</dt><dd>' + esc(r.region + (r.gu ? " " + r.gu : "")) + '</dd>';
    if(r.want_at)   h += '<dt>희망 일정</dt><dd>' + esc(r.want_at) + '</dd>';
    if(r.body)      h += '<dt>하신 말씀</dt><dd>' + esc(r.body) + '</dd>';
    /* ⚠️ 운영자 화면입니다 — 연락처가 보입니다. 넘기기 전에 전화로
       상호를 알리고 동의를 받아야 하므로 여기서는 보여야 합니다. */
    h += '<dt>성함</dt><dd>' + esc(r.name) + '</dd>';
    h += '<dt>연락처</dt><dd>' + esc(r.tel) + '</dd>';
    /* ⚠️⚠️ **바라시는 업체는 배정이 아닙니다** (0035). 손님이 그 업체
       화면을 보고 오셨다는 뜻이고, 넘길지는 운영자가 정합니다 —
       여기 뜬다고 저절로 넘어가지 않습니다. */
    if(r.want_provider){
      var wp = byId[r.want_provider];
      h += '<dt>보고 오신 업체</dt><dd>' +
        esc(wp ? wp.name : r.want_provider) +
        (wp && wp.is_test ? ' <span class="as-t">검사용</span>' : "") +
        ' <span class="fe-when">바람입니다 — 넘길지는 확인하신 뒤에</span></dd>';
    }
    h += '</dl>';

    /* ⚠️⚠️⚠️ **담당 직원** (0012 의 `set_owner`) — 문이 2026-10-22 에
       서고 **부르는 칸이 2026-11-06 까지 없었습니다.** 직원이 여럿이면
       같은 건에 두 사람이 전화합니다.
       ⚠️ 비울 수 있습니다 (**아직 아무도**) — 0012 가 "담당자를 반드시
       정해야 다음 걸음으로 갈 수 있게 만들지 않았다" 고 적어 두었습니다.
       급한 건을 먼저 받고 담당을 나중에 정하는 것이 실제 차례입니다.
       ⚠️⚠️ 고르개에 **직원 · 관리자만** 담습니다 — 고객 계정을 꽂으면
       문이 거절하고(눌러도 안 되는 칸), 더 나쁘게는 "연락처를 열어도
       되는 사람" 으로 읽힙니다. */
    var own = (staff || []).filter(function(x){ return x.id === r.owner_id; })[0];
    h += '<div class="ow-w">' +
      '<label class="ow-l" for="ow-' + esc(r.id) + '">담당</label>' +
      '<select class="ow-s" id="ow-' + esc(r.id) + '">' +
        '<option value=""' + (r.owner_id ? "" : " selected") + '>아직 아무도</option>' +
        (staff || []).map(function(x){
          return '<option value="' + esc(x.id) + '"' +
            (x.id === r.owner_id ? " selected" : "") + '>' +
            esc(x.name || "(성함 없음)") + '</option>';
        }).join("") +
      '</select>' +
      '<button type="button" class="btn btn-sm btn-line ow-b" data-owner="' +
      esc(r.id) + '">담당 저장</button>' +
      /* ⚠️ 담당자가 **없으면 없다고** 말합니다 (빈 칸을 찍지 않습니다) */
      (r.owner_id && !own
        ? '<span class="fe-when">지금 담당이 직원 목록에 없습니다</span>'
        : "") +
    '</div>';

    if(window.amPhotoBlock) h += window.amPhotoBlock(pics);

    if(mine.length){
      h += '<ul class="as-l">' + mine.map(function(a){
        var p = byId[a.provider_id];
        var ast = window.amAssignSt(a.state) || { name:a.state, tone:"ink" };
        return '<li>' + esc(p ? p.name : a.provider_id) +
          (p && p.is_test ? ' <span class="as-t">검사용</span>' : "") +
          " " + badge(ast.name, ast.tone) + '</li>';
      }).join("") + '</ul>';
    }

    var btn = [];
    if(r.state === "new")
      btn.push('<button class="btn btn-sm btn-pri" data-do="check">확인 시작</button>');
    if(r.state === "check")
      btn.push('<button class="btn btn-sm btn-pt" data-do="pick">' +
               (PICK[r.id] ? "접기" : "업체에 넘기기") + '</button>');
    if(["new","check","assigned","accepted","consult","quoted","nego"].indexOf(r.state) >= 0)
      btn.push('<button class="btn btn-sm btn-line" data-do="hold">보류</button>');
    if(btn.length) h += '<div class="dk-b">' + btn.join("") + '</div>';

    if(r.state === "check" && PICK[r.id])
      h += pickForm(r, provs, mine.map(function(a){ return a.provider_id; }));

    h += '<p class="dk-m lmsg" hidden></p></div>';
    return h;
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">상담 요청 · 배정</h2><p class="lmsg">읽는 중입니다…</p>';
    load().then(function(got){
      /* ⚠️⚠️⚠️ **사진 묶음은 늘 맨 뒤에 붙습니다** — `load()` 가
         `got.concat([by])` 로 답니다. 그래서 읽는 것을 하나 더하면
         **자리가 한 칸씩 밀립니다.** 담당 직원 목록을 더하면서 이 줄을
         안 고쳐 `pics` 자리에 계정 배열이 앉았고, 화면이
         `(staff || []).filter is not a function` 으로 터졌습니다
         (검사가 잡았습니다 — "인덱스로 자르면 어긋난다" 의 작은 판).
         ⚠️ 자리를 세지 말고 **맨 뒤**로 집습니다. */
      var rs = got[0], provs = got[1], items = got[2], asgs = got[3];
      var staff = got[4] || [], pics = got[got.length - 1];
      if(rs === null || provs === null || items === null || asgs === null){
        box.innerHTML = '<h2 class="adm-h">상담 요청 · 배정</h2>' +
          '<p class="lmsg">읽지 못했습니다. ' +
          '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
        return;
      }
      if(!rs.length){
        box.innerHTML = '<h2 class="adm-h">상담 요청 · 배정</h2>' +
          '<p class="myhint">아직 진행 중인 요청이 없습니다. 지어낸 값이 아닙니다 — ' +
          '/match 로 요청이 들어오면 여기에 뜹니다.</p>';
        return;
      }
      /* ⚠️ 검사용 업체가 몇 곳인지 **갈라서** 말합니다 (2차 지시서 §8) */
      var tn = provs.filter(function(p){ return p.is_test === true; }).length;
      box.innerHTML = '<h2 class="adm-h">상담 요청 · 배정 ' + won(rs.length) + '건</h2>' +
        (tn ? '<p class="myhint">⚠️ 지금 업체 목록에 <b>검사용 ' + won(tn) +
              '곳</b>이 섞여 있습니다. 손님 화면 · 분류 화면 · 사이트맵에는 ' +
              '나가지 않습니다 — 지우실 때는 db/seed/test-providers.sql 의 ④ 를 보십니다.</p>' : "") +
        rs.map(function(r){
          return card(r, provs, items, asgs, (pics || {})[r.id], staff);
        }).join("");
    });
  }

  function msgOf(node){
    var r = node.closest(".dk-r");
    return r ? r.querySelector(".dk-m") : null;
  }

  box.addEventListener("click", function(e){
    /* ⚠️ 사진은 **누르셨을 때** 주소를 청합니다 (10분짜리) */
    var ph = e.target.closest ? e.target.closest("button[data-photo]") : null;
    if(ph){
      var pm = msgOf(ph);
      ph.disabled = true;
      if(pm){ pm.hidden = false; pm.textContent = "여는 중입니다…"; }
      window.amPhotoOpen(ph.getAttribute("data-photo")).then(function(url){
        ph.disabled = false;
        if(pm) pm.hidden = true;
        window.open(url, "_blank", "noopener");
      }).catch(function(err){
        ph.disabled = false;
        if(pm) pm.textContent = why(err);
      });
      return;
    }
    /* ⚠️⚠️ **담당 직원** (0012 의 `set_owner`) — 인자가 **자리로** 갑니다
       (`p_request` · `p_owner` · `p_why`). 저장소의 다른 문처럼
       `{ p: {...} }` 로 보내면 인자 이름이 안 맞아 거절됩니다. */
    var ow = e.target.closest ? e.target.closest("button[data-owner]") : null;
    if(ow){
      var orow = ow.closest(".dk-r");
      var sel  = orow ? orow.querySelector(".ow-s") : null;
      if(!sel) return;
      var om = msgOf(ow);
      ow.disabled = true;
      if(om){ om.hidden = false; om.textContent = "보내는 중입니다…"; }
      /* ⚠️ 비우는 것도 **값**입니다 (아직 아무도) — 빈 글자를 null 로
         보냅니다. `||` 로 쓰면 빈 글자가 그대로 갑니다. */
      rpc("set_owner", { p_request: ow.getAttribute("data-owner"),
                         p_owner: sel.value === "" ? null : sel.value,
                         p_why: null })
        .then(paint)
        .catch(function(err){
          ow.disabled = false;
          if(om) om.textContent = why(err);
        });
      return;
    }
    var b = e.target.closest ? e.target.closest("button[data-do]") : null;
    if(!b) return;
    var what = b.getAttribute("data-do");
    if(what === "again") return paint();
    var row = b.closest(".dk-r");
    var rid = row ? row.getAttribute("data-req") : null;
    if(what === "pick"){ PICK[rid] = !PICK[rid]; return paint(); }
    if(!rid) return;

    var m = msgOf(b), args = null;
    if(what === "check") args = { p_request: rid, p_to: "check", p_ctx: {} };
    if(what === "hold"){
      var w = prompt("보류하시는 까닭을 적어 주세요 (기록에 남습니다)");
      if(!(w && w.trim())) return;
      args = { p_request: rid, p_to: "hold", p_ctx: { why: w.trim() } };
    }
    if(!args) return;
    b.disabled = true;
    if(m){ m.hidden = false; m.textContent = "바꾸는 중입니다…"; }
    rpc("move_state", args).then(paint).catch(function(err){
      b.disabled = false;
      if(m) m.textContent = why(err);
    });
  });

  box.addEventListener("submit", function(e){
    var f = e.target.closest ? e.target.closest("form.as-f") : null;
    if(!f) return;
    e.preventDefault();
    var rid = f.getAttribute("data-req"), m = msgOf(f);
    var btn = f.querySelector('button[type="submit"]');
    var pv = f.pv.value, note = String(f.whyText.value || "").trim();
    if(!pv){ if(m){ m.hidden = false; m.textContent = "넘길 업체를 골라 주세요."; } return; }
    if(!f.ok.checked){
      if(m){ m.hidden = false;
             m.textContent = "제3자 제공 동의를 받으셨는지 확인해 주세요."; }
      return;
    }
    if(!note){
      if(m){ m.hidden = false; m.textContent = "동의를 어떻게 받으셨는지 적어 주세요."; }
      return;
    }
    btn.disabled = true;
    if(m){ m.hidden = false; m.textContent = "넘기는 중입니다…"; }
    /* ⚠️⚠️ `agree3rd` 를 **체크를 본 뒤에만** 보냅니다. 늘 true 로
       보내면 DB 의 자물쇠가 아무것도 안 막는 장식이 됩니다. */
    rpc("move_state", { p_request: rid, p_to: "assigned",
      p_ctx: { providerId: pv, agree3rd: true, why: note } })
      .then(function(){ PICK[rid] = false; paint(); })
      .catch(function(err){
        btn.disabled = false;
        if(m) m.textContent = why(err);
      });
  });

  amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 로그인이 꺼졌거나 운영자가 아니면 **아무것도 그리지 않습니다** —
       /admin 의 윗자리가 이미 안내를 하고 있습니다. 여기서 또 적으면
       같은 말이 두 번 나옵니다. */
    if(!a.on || !a.signedIn) return;
    if(a.role !== "admin" && a.role !== "staff") return;
    paint();
  });
})();

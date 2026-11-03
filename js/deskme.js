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
    return get("provider?select=id,name,intro,regions,gu,subs,since,consult_hours," +
               "brands,scale,contact_ways,verified,listed,assignable,state,state_why" +
               "&id=eq." + encodeURIComponent(PV) + "&limit=1");
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
      /* ⚠️ 화면에 칸이 없는 것도 **읽은 값 그대로** 돌려보냅니다 —
         안 보내면 지워집니다 (gu · industries · scale). */
      gu: ME.gu || [],
      scale: ME.scale || ""
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

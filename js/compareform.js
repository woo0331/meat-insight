/* 비교견적 요청 양식 — /match?compare=1&cat=<lesson|fitting|used> (2026-11-15 · 0082)
   ════════════════════════════════════════════════════════════════════
   ⚠️⚠️⚠️ **스위치(`site.js` 의 `compareOn`)가 꺼져 있으면 한 글자도 안 그립니다** —
   그때는 `js/matchform.js` 가 평소의 매칭 요청 양식을 그립니다. 0082 가 운영 DB 에
   없을 때 이 양식을 열면 「보냈는데 거절」만 나옵니다.
   ⚠️⚠️ 고르는 서비스 · 지역은 **catalog.js · regions.js** 에서, 분류마다 여쭙는
   조건은 **compare.js** 에서 꺼냅니다(여기 손으로 적지 않습니다).
   ⚠️⚠️ **로그인한 분만** 보냅니다 — 비교는 내 정보에서 하므로(0082 의 문이 비로그인을
   거절합니다). 로그인하러 가셨다 돌아오시면 **적던 조건이 그대로** 있습니다
   (`sessionStorage` · ⚠️ 성함 · 연락처 · 이메일은 **안 담습니다**).
   ⚠️⚠️ **연락처 제3자 제공 동의를 여기서 받지 않습니다**(제17조 제2항) — 상담할
   업체를 고르실 때 그 상호를 보여 드리고 받습니다(`pick_quote`).
   ⚠️ 두 번 눌러도 하나입니다 — 화면을 연 동안 하나인 idem 을 보냅니다. */
(function(){
  var W = window;
  var box = document.getElementById("matchbox");
  if(!box || !W.amCompareMode) return;
  var CAT = W.amCompareMode();
  if(!CAT) return;
  var C = W.amCmp(CAT), K = W.amCat ? W.amCat(CAT) : null;
  var KEEP = (W.WOW_BIZ || {}).applyKeep || "";
  var DKEY = "cmpDraft:" + CAT;
  var IDEM = (function(){
    try{ if(W.crypto && crypto.randomUUID) return "c-" + crypto.randomUUID(); }catch(e){}
    return "c-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
  })();

  function svcs(){
    var L = (K && W.amCatItems) ? W.amCatItems(K) : [];
    return L.filter(function(it){
      return CAT === "used" ? it.key === C.svcPrefix : String(it.key).indexOf(C.svcPrefix) === 0;
    });
  }
  function field(a){
    var id = "c-" + a.k, star = a.req ? " <b>*</b>" : "";
    var req = a.req ? " required" : "";
    if(a.type === "select"){
      return '<div class="jrow"><label for="' + id + '">' + esc(a.label) + star + '</label>' +
        '<select id="' + id + '" data-ck="' + esc(a.k) + '"' + req + '><option value="">고르세요</option>' +
        a.opts.map(function(o){ return '<option>' + esc(o) + '</option>'; }).join("") + '</select></div>';
    }
    return '<div class="jrow"><label for="' + id + '">' + esc(a.label) + star + '</label>' +
      '<input id="' + id + '" data-ck="' + esc(a.k) + '" maxlength="300"' + req +
      (a.ph ? ' placeholder="' + esc(a.ph) + '"' : "") + '></div>';
  }
  function svcHtml(){
    var L = svcs();
    if(CAT === "used"){
      return '<input type="hidden" name="svc" value="' + esc(C.svcPrefix) + '">';
    }
    return '<fieldset class="jrow jrow-full cmp-svc"><legend>원하시는 것 <b>*</b></legend>' +
      L.map(function(it){
        return '<label class="chk"><input type="checkbox" name="svc" value="' + esc(it.key) + '">' +
          '<span>' + esc(it.name) + '</span></label>';
      }).join("") + '</fieldset>';
  }
  function regionHtml(){
    var req = CAT === "lesson";
    return '<div class="jrow"><label for="c-region">' + (CAT === "lesson" ? "레슨 받을 지역" : "거래 · 맡기는 지역") +
      (req ? " <b>*</b>" : "") + '</label><select id="c-region" name="region"' + (req ? " required" : "") + '>' +
      '<option value="">고르세요</option>' +
      (W.AM_REGIONS || []).map(function(r){
        return '<option value="' + esc(r.key) + '">' + esc(r.name) + '</option>';
      }).join("") + '</select></div>';
  }
  function budgetHtml(){
    if(CAT === "used") return "";
    return '<div class="jrow"><label for="c-bmin">예산 (아래 · 원)</label>' +
        '<input id="c-bmin" name="budget_min" inputmode="numeric" placeholder="비워도 됩니다"></div>' +
      '<div class="jrow"><label for="c-bmax">예산 (위 · 원)</label>' +
        '<input id="c-bmax" name="budget_max" inputmode="numeric" placeholder="비워도 됩니다"></div>';
  }
  function formHtml(){
    return '<div class="cmp-lead"><h2>' + esc(C.name) + ' 비교견적 요청</h2>' +
      '<p>' + esc(C.lead) + '</p>' +
      '<ol class="cmp-steps"><li>조건을 남기시면 <b>공개되지 않고</b> 운영자가 분야 · 지역이 맞는 업체에 보냅니다</li>' +
      '<li>업체가 같은 칸으로 제안을 적습니다 — 내 정보 「내 요청」에서 나란히 비교합니다</li>' +
      '<li>상담할 업체를 고르실 때 그 업체에만 성함 · 연락처를 넘깁니다 (그때 여쭙니다)</li></ol>' +
      '<p class="jnote">상담 선택은 예약 · 계약 · 결제가 아닙니다. 제안이 오지 않을 수도 있고, 그때는 그렇다고 말씀드립니다.</p></div>' +
      '<form class="jform" id="cf" novalidate>' +
      svcHtml() + regionHtml() + C.ask.map(field).join("") + budgetHtml() +
      '<div class="jrow jrow-full"><label for="c-body">더 하실 말씀</label>' +
        '<textarea id="c-body" name="body" maxlength="2000" rows="3" placeholder="연락처 · 주소는 여기에 적지 마세요"></textarea></div>' +
      '<div class="jrow"><label for="c-name">성함 <b>*</b></label><input id="c-name" name="name" required maxlength="40" autocomplete="name"></div>' +
      '<div class="jrow"><label for="c-tel">연락처 <b>*</b></label><input id="c-tel" name="tel" required inputmode="tel" autocomplete="tel" placeholder="010-0000-0000"></div>' +
      '<div class="agree"><h3>개인정보 수집 · 이용 동의</h3><dl>' +
        '<dt>수집 항목</dt><dd>성함 · 연락처 · 요청하신 조건</dd>' +
        '<dt>이용 목적</dt><dd>조건에 맞는 업체를 찾아 제안을 받아 드리고 진행 상황을 알려 드리기 위하여</dd>' +
        '<dt>보유 기간</dt><dd>' + esc(KEEP) + '</dd></dl>' +
        '<p class="agree-no"><b>업체에 성함 · 연락처를 넘기는 동의는 여기서 받지 않습니다.</b> ' +
        '제안을 비교한 뒤 상담할 업체를 고르실 때 그 상호를 알려 드리고 그때 여쭙니다.</p>' +
        '<label class="chk"><input type="checkbox" id="c-agree" required><span>위 내용에 동의합니다.</span></label></div>' +
      '<button class="btn btn-pt" type="submit">비교견적 요청하기</button>' +
      '<p id="cmsg" class="lmsg" hidden></p></form>';
  }
  function loginNote(){
    return '<p class="jnote cmp-login">비교견적은 <b>로그인한 뒤에</b> 보내실 수 있습니다 — 도착한 제안을 ' +
      '내 정보에서 비교하시기 때문입니다. 먼저 적으셔도 됩니다: 로그인하고 돌아오시면 적으신 조건이 그대로 ' +
      '있습니다(성함 · 연락처는 담아 두지 않습니다).</p>';
  }

  /* 적던 조건 — ⚠️ 성함 · 연락처는 안 담습니다 */
  function saveDraft(f){
    var d = {};
    f.querySelectorAll("[data-ck], #c-region, #c-bmin, #c-bmax, #c-body").forEach(function(el){
      d[el.id] = el.value;
    });
    d.svc = [].slice.call(f.querySelectorAll('input[name="svc"]:checked')).map(function(i){ return i.value; });
    try{ sessionStorage.setItem(DKEY, JSON.stringify(d)); }catch(e){}
  }
  function loadDraft(f){
    var d = null;
    try{ d = JSON.parse(sessionStorage.getItem(DKEY) || "null"); }catch(e){}
    if(!d) return;
    Object.keys(d).forEach(function(id){
      if(id === "svc") return;
      var el = document.getElementById(id);
      if(el && typeof d[id] === "string") el.value = d[id];
    });
    (d.svc || []).forEach(function(v){
      var el = f.querySelector('input[name="svc"][value="' + String(v).replace(/"/g, "") + '"]');
      if(el) el.checked = true;
    });
  }

  function submit(e){
    e.preventDefault();
    var f = e.target, msg = document.getElementById("cmsg"), a = W.amAuthNow();
    /* ⚠️ 로그인 전이면 적던 조건을 담아 두고 로그인하러 갑니다 — 돌아오면 그대로 있습니다 */
    if(!(W.amAuthUid && W.amAuthUid())){
      saveDraft(f);
      location.href = W.amLoginUrl();
      return;
    }
    var bad = [].slice.call(f.querySelectorAll("[required]")).filter(function(el){
      return el.type === "checkbox" ? !el.checked : !String(el.value || "").trim();
    });
    var picked = [].slice.call(f.querySelectorAll('input[name="svc"]')).filter(function(i){
      return i.type === "hidden" || i.checked;
    }).map(function(i){ return i.value; });
    msg.hidden = false;
    if(!picked.length){ msg.textContent = "원하시는 것을 하나 이상 골라 주세요."; return; }
    if(bad.length){
      msg.textContent = "별표(*) 칸을 채워 주세요.";
      try{ bad[0].focus(); }catch(_){}
      return;
    }
    var detail = {};
    f.querySelectorAll("[data-ck]").forEach(function(el){
      var v = String(el.value || "").trim();
      if(v) detail[el.getAttribute("data-ck")] = v;
    });
    var num = function(v){ v = String(v || "").replace(/[^0-9]/g, ""); return v; };
    var btn = f.querySelector('button[type="submit"]');
    btn.disabled = true;
    msg.textContent = "보내는 중입니다…";
    fetch(a.conf.url + "/rest/v1/rpc/make_compare_request", {
      method: "POST",
      headers: Object.assign({ "content-type":"application/json", apikey:a.conf.anonKey },
                             W.amAuthHeaders ? W.amAuthHeaders() : {}),
      body: JSON.stringify({ p: {
        name: f.name.value, tel: f.tel.value, region: f.region.value,
        body: f.body.value,
        budget_min: f.budget_min ? num(f.budget_min.value) : "",
        budget_max: f.budget_max ? num(f.budget_max.value) : "",
        services: picked, cat: CAT, idem: IDEM, detail: detail,
        agree_at: new Date().toISOString()
      }})
    }).then(function(r){
      return r.json().catch(function(){ return null; }).then(function(j){
        if(!r.ok) throw new Error((j && (j.message || j.hint)) || ("HTTP " + r.status));
        return j;
      });
    }).then(function(no){
      try{ sessionStorage.removeItem(DKEY); }catch(_){}
      box.innerHTML = doneHtml(String(no || ""));
    }).catch(function(err){
      btn.disabled = false;
      msg.textContent = W.amErrText(err, "보내지 못했습니다.");
    });
  }
  function doneHtml(no){
    return '<div class="none"><h2>비교견적 요청을 받았습니다</h2>' +
      '<p>접수번호 <b>' + esc(no) + '</b></p>' +
      '<p>운영자가 조건을 확인한 뒤 분야 · 지역이 맞는 업체에 보냅니다. 제안이 오면 ' +
      '내 정보 「내 요청」에 나란히 보입니다. 업체에는 아직 성함 · 연락처가 가지 않았습니다.</p>' +
      '<p>지금은 문자 · 카카오톡으로 따로 알려 드리지 않습니다 — 내 정보에서 확인해 주세요.</p>' +
      '<p><a class="btn btn-pt" href="/my#reqbox">내 요청 보기</a></p></div>';
  }

  W.amGate(box, "요청", function(a){
    if(!a.on || !a.conf || !a.conf.url || !a.conf.anonKey){
      try{ console.warn("[compare] Supabase 설정이 없어 비교견적 양식을 열지 않았습니다."); }catch(e){}
      return false;
    }
    if(!KEEP){
      try{ console.warn("[compare] site.js 의 applyKeep(보유 기간)이 비어 양식을 열지 않았습니다."); }catch(e){}
      return false;
    }
    box.className = "jbox";
    var IN = !!(W.amAuthUid && W.amAuthUid());
    box.innerHTML = (IN ? "" : loginNote()) + formHtml();
    if(!IN){
      var sb = box.querySelector('#cf button[type="submit"]');
      if(sb) sb.textContent = "로그인하고 요청하기";
    }
    var f = document.getElementById("cf");
    loadDraft(f);
    f.addEventListener("input", function(){ saveDraft(f); });
    f.addEventListener("change", function(){ saveDraft(f); });
    f.addEventListener("submit", submit);
  });
  function esc(s){ return W.esc(s); }
})();

/* ════════════════════════════════════════════════════════════════════
   운영 감사 기록 — /admin 의 한 자리 (4차 지시서 §5)

   ⚠️⚠️⚠️ **기록은 있는데 보는 자리가 없었습니다.** 문마다 `audit_log`
   에 한 트랜잭션으로 적어 두었는데(0004 부터), 그것을 읽는 화면이
   0곳이라 사장님은 Supabase 를 열어야 했습니다 — "만들어 놓고 안 쓰는
   칸" 의 또 다른 꼴입니다.

   ⚠️⚠️ **아무도 고치거나 지울 수 없습니다** (0001 — update · delete
   정책을 일부러 안 만들었습니다). 이 화면도 **읽기만** 합니다.

   ⚠️⚠️ **성함 · 연락처는 기록에 안 들어 있습니다** (문들이 일부러
   안 넣습니다 — 기록은 오래 남고 보는 사람도 넓습니다). 그래서 이
   화면도 **번호 · id 로** 보여 줍니다. 누가 했는지는 역할까지만
   적습니다 (사람 이름을 붙이면 기록이 사람 목록이 됩니다).

   ⚠️ 읽는 것은 **관리자만**입니다 (0001 의 audit_read 정책 —
   `my_role() = 'admin'`). 직원은 제가 한 것만 보입니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("logbox");
  if(!box || !window.amAuthAsk) return;

  var A = null, OBJ = "", N = 60;

  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json().catch(function(){ return null; }) : null; })
      .catch(function(){ return null; });
  }

  /* 무엇에 대한 기록인가 — ⚠️ **말은 한 곳**입니다 */
  var OBJS = [
    ["",                 "전체"],
    ["request",          "요청"],
    ["assignment",       "제공 · 철회"],
    ["quote",            "견적"],
    ["deal",             "거래"],
    ["provider",         "업체"],
    ["provider_price",   "가격"],
    ["provider_invite",  "담당자 초대"],
    ["review",           "후기"],
    ["report",           "신고 · 분쟁"],
    ["account",          "계정"]
  ];
  function objName(k){
    var f = OBJS.filter(function(x){ return x[0] === k; })[0];
    return f ? f[1] : k;
  }
  /* 역할 말 — ⚠️ 영문 키를 그대로 찍지 않습니다 */
  var ROLE = { customer:"손님", provider:"업체", staff:"직원", admin:"관리자" };

  function load(){
    return get("audit_log?select=id,at,by_role,obj,obj_id,from_state,to_state,why" +
               (OBJ ? "&obj=eq." + encodeURIComponent(OBJ) : "") +
               "&order=at.desc&limit=" + N);
  }

  function tabs(){
    return '<div class="bz-tabs" role="tablist">' + OBJS.map(function(o){
      return '<button type="button" class="btn btn-sm ' +
        (OBJ === o[0] ? "btn-pri" : "btn-line") + '" data-ltab="' + esc(o[0]) + '" ' +
        'role="tab" aria-selected="' + (OBJ === o[0] ? "true" : "false") + '">' +
        esc(o[1]) + '</button>';
    }).join("") + '</div>';
  }

  function rows(list){
    if(!list.length)
      return '<p class="myhint">그런 기록이 없습니다.</p>';
    return '<div class="doc-t lg-t"><table>' +
      '<thead><tr><th scope="col">때</th><th scope="col">무엇</th>' +
      '<th scope="col">누가</th><th scope="col">무슨 일</th>' +
      '<th scope="col">까닭</th></tr></thead><tbody>' +
      list.map(function(r){
        var move = [r.from_state, r.to_state].filter(Boolean).join(" → ");
        return '<tr><td class="lg-at">' +
            esc(window.amWhen ? window.amWhen(r.at) : String(r.at || "")) + '</td>' +
          '<th scope="row">' + esc(objName(r.obj)) +
            '<i class="fe-d">' + esc(String(r.obj_id || "").slice(0, 14)) + '</i></th>' +
          '<td>' + esc(ROLE[r.by_role] || r.by_role || "—") + '</td>' +
          '<td>' + esc(move || "—") + '</td>' +
          /* ⚠️ 까닭은 사람이 적은 글입니다 — esc() 를 지납니다 */
          '<td>' + esc(r.why || "") + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  function paint(){
    box.hidden = false; box.className = "deskbox";
    box.innerHTML = '<h2 class="adm-h">운영 감사 기록</h2>' +
      '<p class="lmsg">읽는 중입니다…</p>';
    return load().then(function(list){
      /* ⚠️⚠️ 못 읽었으면 **0건이라고 말하지 않습니다** */
      if(list === null){
        box.innerHTML = '<h2 class="adm-h">운영 감사 기록</h2>' +
          '<p class="lmsg">읽지 못했습니다. ' +
          '<button class="btn btn-sm btn-line" data-ltab="' + esc(OBJ) +
          '">다시 읽기</button></p>';
        return;
      }
      box.innerHTML = '<h2 class="adm-h">운영 감사 기록</h2>' +
        '<p class="myhint">문을 지난 일이 모두 한 줄씩 남습니다. ' +
        '<b>아무도 고치거나 지울 수 없습니다.</b> ' +
        '⚠️ 성함 · 연락처는 기록에 담지 않습니다 — 번호로 찾아가십니다.</p>' +
        tabs() + '<div class="bz-body">' + rows(list) + '</div>' +
        '<p class="myhint">최근 ' + list.length + '건입니다.</p>';
    });
  }

  box.addEventListener("click", function(e){
    var t = e.target.closest ? e.target.closest("button[data-ltab]") : null;
    if(!t) return;
    OBJ = t.getAttribute("data-ltab") || "";
    paint();
  });

  amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 관리자만입니다 — 직원에게는 제가 한 것만 보이므로(정책),
       "전체 기록" 이라고 적을 수 없습니다. 그래서 자리 자체를 안 냅니다. */
    if(!a.on || !a.signedIn) return;
    if(a.role !== "admin") return;
    paint();
  });
})();

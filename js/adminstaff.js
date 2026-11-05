/* ════════════════════════════════════════════════════════════════════
   업체 담당자 — /admin 의 한 자리  (DB 는 0052)

   ⚠️⚠️⚠️ **내보내는 문이 저장소에 한 줄도 없었습니다.** 0043 이
   담당자를 **잇는** 길(초대 코드)을 냈는데, **끊는** 길이 없었습니다 —
   그래서 그만둔 담당자가 그 업체의 요청 · 견적 · 손님 성함과 연락처를
   **계속 봤습니다.** 0043 머리말이 "옮기는 일은 운영자가 먼저 끊어야
   합니다" 라고 적어 놓은 바로 그 자리이고, 끊으려면 사장님이 Supabase
   SQL 편집기를 열어야 했습니다.

   ⚠️⚠️ **여기만 본이름이 나옵니다.** 내보낼 사람을 골라야 하니
   어쩔 수 없습니다 — 업체 담당자끼리는 가려서 봅니다
   (마스킹은 `v_provider_staff` 가 합니다 · 화면이 가리면 늦습니다).
   ⚠️ 그래서 이 자리는 **운영자만**이고, 아니면 한 줄도 안 그립니다.

   ⚠️⚠️ **담당자가 0명인 업체를 따로 모아 냅니다.** 0018 이 세운 자리가
   그것입니다 — 계정이 안 이어진 업체는 배정해 놓아도 **아무도 수락 ·
   상담 · 견적으로 못 넘깁니다** (길 표의 네 걸음이 업체 전용입니다).
   배정 가능이 켜져 있으면서 담당자가 0명이면 ⚠️ 를 붙입니다.

   ⚠️ **까닭 없이 못 내보냅니다** (문이 거절합니다). 감사 기록에 남고,
   까닭 없이 거둘 수 있으면 "왜 빠졌는지" 를 아무도 모릅니다.
   ⚠️⚠️ **마지막 담당자는 문이 거절합니다** — 그 말을 화면이 **그대로**
   보여 줍니다 (여기서 다시 적으면 문과 화면이 두 곳이 됩니다).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("pvstadm");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null, ROWS = [], PVS = [], MSG = "";

  function why(err){
    var w = String((err && err.message) || "");
    try{ w = JSON.parse(w).message || w; }catch(_){}
    return w || "하지 못했습니다.";
  }
  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json().catch(function(){ return []; }) : []; })
      .catch(function(){ return []; });
  }
  function rpc(name, args){
    return fetch(A.conf.url + "/rest/v1/rpc/" + name, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey: A.conf.anonKey }, window.amAuthHeaders()),
      body: JSON.stringify(args || {})
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    });
  }
  function day(iso){
    var d = new Date(iso);
    if(isNaN(d.getTime())) return "";
    /* ⚠️ 전에는 `2026.11.1` 로 나왔습니다 — 두 자리로 맞춥니다 */
    function two(n){ return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "." + two(d.getMonth() + 1) + "." + two(d.getDate());
  }

  /* 업체마다 담당자를 모읍니다 — ⚠️ **세는 자리는 한 곳**입니다 */
  function byProvider(){
    var m = {};
    ROWS.forEach(function(s){
      (m[s.provider_id] = m[s.provider_id] || { name:s.provider_name, who:[] })
        .who.push(s);
    });
    return m;
  }

  function staffRow(s, n){
    return '<li class="pvst-r">' +
      '<span class="pvst-ic">' + icon("user", 17) + '</span>' +
      '<span class="pvst-n">' + esc(s.who || "회원") + '</span>' +
      /* ⚠️ 없으면 줄째 빠집니다 — 초대로 들어온 분만 있습니다 */
      (s.joined_at
        ? '<span class="pvst-d">' + esc(day(s.joined_at)) + '</span>'
        /* ⚠️ 전에는 "SQL 로 이어짐" 이라고 적었는데, 그건 **우리가
           모르는 것을 단정**하는 것입니다 (초대 기록이 없을 뿐입니다).
           있는 것만 적습니다. */
        : '<span class="pvst-d">이어진 날 기록 없음</span>') +
      /* ⚠️ `.btn-bad` 는 **없는 이름**입니다 — 처음에 그렇게 적었다가
         `css/app.css` 를 세어 보고 고쳤습니다 (있는 것은 btn-pri ·
         btn-pt · btn-gold · btn-line · btn-deep · btn-ghost · btn-sm).
         없는 클래스는 조용히 아무 모양도 안 입습니다. 위험한 단추라는
         표시는 **제 클래스**(`.pvst-x`)에서 색으로 냅니다. */
      '<button type="button" class="btn btn-sm btn-line pvst-x" ' +
        'data-u="' + esc(s.account_id || "") + '" ' +
        'data-pv="' + esc(s.provider_id) + '" ' +
        'data-n="' + esc(String(n)) + '" ' +
        'data-who="' + esc(s.who || "회원") + '">내보내기</button>' +
    '</li>';
  }

  function paint(){
    box.className = "adminbox";
    box.hidden = false;

    var m = byProvider();
    /* ⚠️ 전에는 `Object.keys(m).sort()` 라 **업체 id 순**이었습니다
       (t-fit 이 t-range 앞) — 사람이 읽는 차례는 **상호**입니다. */
    var keys = Object.keys(m).sort(function(a, b){
      return String(m[a].name || a).localeCompare(String(m[b].name || b), "ko");
    });
    /* ⚠️⚠️ **담당자가 0명인 업체** — 0018 이 막으려던 자리입니다.
       ⚠️ 정지 · 거절된 업체는 빼고 봅니다 (고칠 일이 아닙니다). */
    var none = PVS.filter(function(p){
      return !m[p.id] && p.state === "approved";
    });

    box.innerHTML =
      '<h2 class="adm-h">' + icon("people", 19) + '업체 담당자</h2>' +
      '<p class="myhint">한 업체에 담당자가 <b>여럿</b>일 수 있습니다. ' +
        '담당자는 그 업체의 배정 요청과 손님 성함 · 연락처를 봅니다 — ' +
        '그만두신 분은 여기서 내보내 주세요.</p>' +
      (MSG ? '<p class="pvst-msg">' + esc(MSG) + '</p>' : "") +

      /* ── 담당자가 0명인 업체 ─────────────────────────────────── */
      (none.length
        ? '<section class="pvst-g pvst-warn">' +
            '<h3 class="pvst-h">' + icon("info", 17) +
              '담당자가 없는 업체 ' + esc(String(none.length)) + '곳</h3>' +
            '<p class="pvst-z">계정이 이어지지 않아, 배정해도 수락 · 상담 · ' +
              '견적으로 넘길 사람이 없습니다. 초대 코드를 내 주세요.</p>' +
            '<ul class="pvst-l">' + none.map(function(p){
              return '<li class="pvst-r">' +
                '<span class="pvst-ic">' + icon("store", 17) + '</span>' +
                '<span class="pvst-n">' + esc(p.name) + '</span>' +
                /* ⚠️⚠️ 배정 가능이 켜져 있으면 **더 급합니다** */
                (p.assignable
                  ? '<span class="pvst-bad">배정 가능이 켜져 있습니다</span>'
                  : '') +
              '</li>';
            }).join("") + '</ul>' +
          '</section>'
        : "") +

      /* ── 업체마다 명단 ───────────────────────────────────────── */
      (keys.length
        ? keys.map(function(k){
            var g = m[k], n = g.who.length;
            return '<section class="pvst-g" data-pv="' + esc(k) + '">' +
              '<h3 class="pvst-h">' + icon("store", 17) + esc(g.name) +
                '<span class="pvst-c">' + esc(String(n)) + '명</span></h3>' +
              '<ul class="pvst-l">' +
                g.who.map(function(s){ return staffRow(s, n); }).join("") +
              '</ul>' +
            '</section>';
          }).join("")
        /* ⚠️ 0건이면 **0건이라고 말합니다** */
        : '<p class="pvst-z">아직 업체에 이어진 담당자가 없습니다.</p>');
  }

  function load(){
    MSG = "";
    return Promise.all([
      get("v_provider_staff?select=provider_id,provider_name,account_id,who," +
          "joined_at&order=provider_id.asc"),
      /* ⚠️ 담당자가 0명인 업체를 찾으려면 업체 목록이 필요합니다.
         ⚠️⚠️ 검사용 업체는 빼고 봅니다 — 세는 자리에 섞이면 안 됩니다
         (`is_test` · 0030 · 작업 기억의 그 줄). */
      get("provider?select=id,name,state,assignable&is_test=eq.false&" +
          "order=name.asc")
    ]).then(function(r){
      ROWS = r[0] || [];
      PVS  = r[1] || [];
      paint();
    });
  }

  box.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("button.pvst-x") : null;
    if(!b) return;
    var u = b.getAttribute("data-u");
    if(!u) return;
    /* ⚠️⚠️ **되돌리기 어려운 일이라 한 번 여쭙습니다** — 내보내면 그
       분은 일반 회원이 되고 사업자 딱지도 떨어집니다 (0028).
       ⚠️ 다시 들이는 길은 있습니다 (새 초대 코드) — 영구 차단이
       아니라는 것을 묻는 자리에서 같이 말합니다. */
    var n = Number(b.getAttribute("data-n")) || 0;
    var ask = b.getAttribute("data-who") + " 님을 이 업체에서 내보냅니다.\n" +
      "그 뒤로는 이 업체의 요청과 손님 연락처를 보지 못합니다.\n" +
      (n <= 1 ? "⚠️ 마지막 담당자입니다.\n" : "") +
      "다시 들이실 때는 새 초대 코드를 내시면 됩니다.\n\n까닭을 적어 주세요:";
    /* ⚠️ 까닭은 **문이** 요구합니다 — 여기서 비면 그냥 보내서 문의
       거절 글을 그대로 보여 줍니다 (규칙을 두 곳에 적지 않습니다). */
    var w = window.prompt(ask, "");
    if(w === null) return;
    b.disabled = true;
    MSG = "내보내는 중입니다…";
    paint();
    rpc("drop_provider_staff", { p: { user: u, why: w } })
      .then(function(name){
        return load().then(function(){
          MSG = (name ? name + " — " : "") + "담당자를 내보냈습니다.";
          paint();
        });
      })
      .catch(function(err){
        MSG = why(err);
        paint();
      });
  });

  window.amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 운영자가 아니면 **한 줄도 안 그립니다** (/admin 의 다른 자리와
       같습니다). 왜 안 되는지도 적지 않습니다.
       ⚠️⚠️ 읽으러 **가지도 않습니다** — 0050 의 알림 상자가 그 줄을
       빠뜨려 혼자 질의를 던지고 있었습니다. */
    if(!a || !a.on || !a.signedIn) return;
    if(a.role !== "admin" && a.role !== "staff") return;
    return load();
  }).catch(function(){});
})();

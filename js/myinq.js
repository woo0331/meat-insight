/* ════════════════════════════════════════════════════════════════════
   내가 보낸 문의 — /my 에서만 돕니다 (DB 는 0045 · 알림은 0053)

   ⚠️⚠️⚠️ **운영자가 적은 답이 아무 화면에도 안 나왔습니다.** 0045 는
   `move_inquiry` 로 답을 받으면서 "답했다고 두려면 답이 있어야 합니다"
   까지 막아 두었고(`inquiry_answer_ck`), 제 문의를 읽는 자물쇠도 이미
   있었습니다(`inquiry_mine` 정책 + select GRANT). 그런데 **그것을 읽는
   화면이 한 곳도 없었습니다** — 운영자는 답을 적고 "답변함" 으로 옮기고,
   손님은 그 답을 **어디서도 볼 수 없었습니다.** 문만 서 있고 보는 자리가
   없던 `save_provider_contact` · `drop_photo` 와 같은 자리입니다.

   ⚠️⚠️ **로그인 없이 보내신 문의는 여기 안 보입니다.** `by_user` 가
   비어 있어 누구 것인지 알 길이 없습니다 (알 수 있게 만들면 전화번호만
   알면 남의 문의를 읽는 자리가 됩니다). 그래서 그 경우는 적어 주신
   연락처로 운영자가 직접 답합니다 — 화면에 **그 사실을 적습니다**
   (안 적으면 "넣었는데 안 보인다" 가 됩니다).

   ⚠️⚠️ **문자 · 카톡 · 메일을 보내지 않습니다** (0050 의 까닭 그대로).
   그래서 "알려 드립니다" 라고 적지 않고 **"이 자리에서 보십니다"** 라고
   적습니다 (절대 규칙 5).

   ⚠️ 상태 · 갈래 말은 `js/data/deal.js` **한 곳**에서 옵니다 —
   운영자의 문의함(`js/admininq.js`)과 **같은 줄**을 읽습니다. 손님에게
   보이는 말은 그 줄의 `mine` 칸입니다 (운영자의 "새 문의" 를 손님
   화면에 찍지 않습니다 · 절대 규칙 3).

   ⚠️ 0건이면 **아무것도 안 그립니다** — 문의를 넣은 적 없는 분께 빈
   상자를 두면 그때부터 치울 수 없는 자리가 됩니다 (절대 규칙 2).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("myinqbox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;

  function get(a, path){
    return fetch(a.conf.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; });
  }

  function day(iso){
    return window.amDay ? window.amDay(iso) : "";
  }
  /* ⚠️ 모르는 키는 **키 그대로** 돌려줍니다 (빈 칸을 두면 화면과 DB 가
     어긋난 것을 아무도 모릅니다 — 0053 이 상태를 늘리는 날 여기가
     영문으로 찍히고, 그때 `check-deal` 이 빌드를 멈춥니다). */
  function stName(k){
    var x = window.amInqSt ? window.amInqSt(k) : null;
    return (x && x.mine) || String(k || "");
  }
  function kindName(k){
    return window.amInqKindShort ? window.amInqKindShort(k) : String(k || "");
  }

  function row(r){
    return '<li class="mq-i">' +
      '<p class="mq-t"><b>' + esc(kindName(r.kind)) + '</b>' +
        ' · ' + esc(r.no || "") +
        ' · ' + esc(day(r.created_at)) +
        ' · <span class="mq-s">' + esc(stName(r.state)) + '</span></p>' +
      /* ⚠️ 제가 쓴 글이지만 그래도 esc() 를 지납니다 (절대 규칙 4 —
         "내 글이니 괜찮다" 는 예외를 한 번 두면 그 예외가 번집니다). */
      '<p class="mq-b">' + esc(r.body || "") + '</p>' +
      (r.answer
        ? '<div class="mq-a">' +
            '<p class="mq-ah">답변' +
              (r.answered_at ? ' · ' + esc(day(r.answered_at)) : '') + '</p>' +
            '<p class="mq-ab">' + esc(r.answer) + '</p>' +
          '</div>'
        /* ⚠️⚠️ 언제까지 답한다고 **약속하지 않습니다** — 지킬 장치가
           없습니다 (절대 규칙 5). 지금 어떤 상태인지만 말합니다. */
        : '<p class="mq-z">아직 답변이 올라오지 않았습니다.</p>') +
    '</li>';
  }

  function paint(rows){
    /* ⚠️ 못 읽은 것(null)과 0건은 **다릅니다** — 못 읽었으면 숨긴 채로
       둡니다 ("문의가 없습니다" 라고 말하지 않습니다). */
    if(!rows || !rows.length){ box.hidden = true; box.innerHTML = ""; return; }

    box.className = "mj";
    box.hidden = false;
    box.innerHTML = '<h2 class="mj-h">내가 보낸 문의</h2>' +
      '<p class="jnote">⚠️ 문자 · 카톡 · 메일로는 보내 드리지 않습니다 — ' +
      '답변은 <b>이 자리에서</b> 보십니다. 로그인하지 않고 보내신 문의는 ' +
      '누구 것인지 알 수 없어 여기 나오지 않고, 적어 주신 연락처로 ' +
      '답을 받으십니다.</p>' +
      '<ul class="mq-l">' + rows.map(row).join("") + '</ul>';
  }

  function load(a){
    /* ⚠️⚠️ `memo` · `answered_by` 는 **부르지 않습니다** — 0053 이 그
       두 칸의 GRANT 를 거두었습니다 (운영자 메모이고, 누가 답했는지는
       손님이 알 까닭이 없습니다). 부르면 질의가 통째로 거절됩니다. */
    return get(a, "inquiry?select=id,no,kind,body,state,answer,answered_at," +
                  "created_at&order=created_at.desc&limit=50")
      .then(paint);
  }

  window.amAuthAsk().then(function(a){
    /* ⚠️ 로그인 전에는 한 글자도 안 그리고 읽으러 가지도 않습니다 */
    if(!a || !a.on || !a.signedIn) return;
    return load(a);
  }).catch(function(){});
})();

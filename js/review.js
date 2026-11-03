/* ════════════════════════════════════════════════════════════════════
   후기를 **그리고 보내는** 자리 — 화면 셋이 같이 씁니다
   (/my 손님이 씀 · /desk 업체가 답함 · /admin 운영자가 가림)

   ⚠️⚠️ **한 곳에 둡니다.** 같은 후기를 세 화면이 따로 그리면 한쪽만
   고쳐서 조용히 달라집니다 (앞 서비스에서 여러 번 겪은 자리). 보내는
   꾸러미를 짓는 것도 여기 한 함수입니다 — 화면마다 짜면 칸 이름 하나가
   어긋나 **열리기는 하는데 아무것도 안 걸리는** 자리가 생깁니다.

   ⚠️⚠️ **세는 것은 여기서 하지 않습니다.** 평균 · 건수는
   js/data/review.js 의 amRating() 한 함수입니다 (절대 규칙 1).

   ⚠️⚠️ **손님이 쓴 글 · 업체가 쓴 글 전부 esc() 를 거칩니다**
   (절대 규칙 4).

   ⚠️ 이 파일은 **그리는 것과 보내는 것**만 합니다. 읽어 오는 것은
   화면이 합니다 (RLS 가 화면마다 다른 줄을 내줍니다 — /my 는 내
   요청의 것, /desk 는 우리 업체의 것, /admin 은 전부).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var esc = window.esc;

  /* 별 — ⚠️ 글자는 소리로 들으면 뜻이 없어 aria-hidden 을 달고,
     같은 뜻을 .sr 로 한 번 적습니다 (check-a11y 가 봅니다). */
  window.amRvStars = function(n){
    return '<span class="stars" aria-hidden="true">' +
             window.amStarGlyphs(n) + '</span>' +
           '<span class="sr">' + esc(window.amStarLabel(n)) + '</span>';
  };

  /* 후기 한 줄 — opts
       who      작성자 자리에 적을 말 (없으면 v.who, 그것도 없으면 "회원")
       pname    업체 상호 (답변 앞에 적습니다)
       hidden   가려진 것을 **가려졌다고 적을지** (/desk · /admin 에서만)
     ⚠️⚠️ 손님 화면에서는 가려진 후기를 **아예 넘기지 않습니다** —
     "가려진 후기가 있습니다" 를 손님에게 찍으면 그게 더 큰 말입니다. */
  window.amRvRow = function(v, opts){
    var o = opts || {};
    var who = o.who || v.who || "회원";
    var h = '<div class="rv" data-rv="' + esc(v.id) + '">' +
      '<div class="rv-h">' + window.amRvStars(v.rating) +
        '<b class="rv-w">' + esc(who) + '</b>' +
        '<span class="rv-d">' + esc(window.amDay(v.created_at)) +
        (window.amRvEdited(v) ? " · 고침" : "") + '</span>' +
        (o.hidden && v.hidden_at
          ? '<span class="dk-st dk-bad">가려진 후기</span>' : '') +
      '</div>' +
      '<p class="rv-b">' + esc(v.body) + '</p>';
    if(o.hidden && v.hidden_at && v.hidden_why)
      h += '<p class="dk-hint">가린 까닭 — ' + esc(v.hidden_why) + '</p>';
    if(v.reply)
      h += '<div class="rv-r"><b>' + esc((o.pname || "업체") + " 답변") + '</b>' +
        (v.reply_at ? '<span class="rv-d">' + esc(window.amDay(v.reply_at)) + '</span>' : '') +
        '<p>' + esc(v.reply) + '</p></div>';
    return h + '</div>';
  };

  /* 고쳤는가 — ⚠️ **한 곳에서만 봅니다.** 가져오는 도구
     (tools/pull-reviews.js)와 같은 규칙입니다: 1분을 둡니다 (넣을 때
     updated_at 이 몇 밀리초 늦습니다). */
  window.amRvEdited = function(v){
    if(v && v.edited) return true;
    var t0 = Date.parse((v && v.created_at) || ""),
        t1 = Date.parse((v && v.updated_at) || "");
    return !!(t0 && t1 && t1 - t0 > 60000);
  };

  /* 별점 고르개 — ⚠️ 라디오입니다 (별 다섯 개를 누르는 꼴은 폰에서
     손가락이 맞지 않고, 소리로 듣는 분께는 아무 말도 안 됩니다).
     ⚠️ 누르는 자리가 40px 이상입니다 (.rvpick label 의 min-height). */
  window.amRvPick = function(name, cur){
    return '<div class="rvpick" role="radiogroup" aria-label="별점">' +
      window.AM_RATING_WORD.map(function(w){
        var id = name + "-" + w.v;
        return '<label for="' + esc(id) + '">' +
          '<input type="radio" id="' + esc(id) + '" name="' + esc(name) + '" ' +
            'value="' + w.v + '"' + (Number(cur) === w.v ? ' checked' : '') + '>' +
          '<span class="stars" aria-hidden="true">' + window.amStarGlyphs(w.v) + '</span>' +
          '<span>' + esc(w.name) + '</span></label>';
      }).join("") + '</div>';
  };

  /* 손님이 쓰는 양식 — ⚠️ `cur` 가 있으면 **고치는** 양식입니다.
     ⚠️⚠️ 글자 수 아래끝(열 글자)을 화면에도 적습니다. DB 가 거절하는
     말과 같은 뜻이어야 합니다 (0037 의 write_review) — 한쪽만 고치면
     "적었는데 안 된다" 가 됩니다. */
  window.amRvForm = function(rid, pid, pname, cur){
    var key = "rv-" + String(rid).slice(0, 8) + "-" + String(pid).replace(/[^a-zA-Z0-9_-]/g, "");
    return '<form class="jform rvform" data-rvreq="' + esc(rid) + '" ' +
             'data-rvpro="' + esc(pid) + '">' +
      '<h4 class="rv-ft">' + esc((pname || "이 업체") + (cur ? " 후기 고치기" : " 후기 쓰기")) + '</h4>' +
      /* ⚠️ 누구에게 보이는지 먼저 적습니다 — 공개되는 글입니다 */
      '<p class="dk-hint">쓰시면 <b>이 업체 화면에 공개</b>됩니다. ' +
      '성함은 <b>성 한 글자만</b> 보입니다 (김** 처럼).</p>' +
      window.amRvPick(key, cur && cur.rating) +
      '<div class="jrow">' +
        '<label for="' + esc(key) + '-b">어떠셨는지 적어 주세요 (열 글자 이상)</label>' +
        '<textarea id="' + esc(key) + '-b" name="body" rows="4" required ' +
          'minlength="10" maxlength="1000">' + esc((cur && cur.body) || "") + '</textarea>' +
      '</div>' +
      '<button class="btn btn-sm btn-pt" type="submit">' +
        (cur ? "후기 고치기" : "후기 올리기") + '</button>' +
      '<p class="lmsg rvmsg" hidden></p>' +
    '</form>';
  };

  /* 업체가 답하는 양식 */
  window.amRvReplyForm = function(v){
    var key = "rvr-" + String(v.id).slice(0, 8);
    return '<form class="jform rvform" data-rvreply="' + esc(v.id) + '">' +
      '<div class="jrow">' +
        '<label for="' + esc(key) + '">' +
          (v.reply ? "답변 고치기" : "이 후기에 답변하기") + '</label>' +
        /* ⚠️⚠️ 답변도 **공개**됩니다. 업체가 손님 연락처 · 성함을 여기
           적지 않도록 그 자리에서 알립니다 (적히면 공개 화면에 남습니다). */
        '<textarea id="' + esc(key) + '" name="reply" rows="3" required ' +
          'maxlength="1000">' + esc(v.reply || "") + '</textarea>' +
      '</div>' +
      '<p class="dk-hint">답변은 업체 화면에 <b>공개</b>됩니다 — ' +
      '손님 성함 · 연락처를 적지 마세요.</p>' +
      '<button class="btn btn-sm btn-line" type="submit">' +
        (v.reply ? "답변 고치기" : "답변 올리기") + '</button>' +
      '<p class="lmsg rvmsg" hidden></p>' +
    '</form>';
  };

  /* ⚠️⚠️ **보내는 꾸러미를 여기서만 짓습니다.** 화면이 각자 짜면 칸
     이름 하나가 어긋나도 열리기는 하고, 그러면 아무것도 안 걸립니다
     (앞 서비스의 `?m=apple` 자리와 같은 꼴입니다).
     ⚠️ 인자를 늘리지 않고 jsonb 하나로 보냅니다 (0037 의 문들이 그렇게
     받습니다) — 자리가 어긋나면 엉뚱한 값이 엉뚱한 칸에 들어갑니다. */
  window.amRvSend = function(rpc, form){
    var rid = form.getAttribute("data-rvreq");
    if(rid){
      var picked = form.querySelector('input[type="radio"]:checked');
      if(!picked) return Promise.reject(new Error("별점을 골라 주세요"));
      return rpc("write_review", { p: {
        request:  rid,
        provider: form.getAttribute("data-rvpro"),
        rating:   Number(picked.value),
        body:     form.body.value
      } });
    }
    var rvid = form.getAttribute("data-rvreply");
    if(rvid)
      return rpc("reply_review", { p: { id: rvid, reply: form.reply.value } });
    return Promise.reject(new Error("보낼 것이 없습니다"));
  };

  /* 운영자가 가리는 길 — ⚠️ 까닭을 받습니다 (DB 도 받습니다) */
  window.amRvHide = function(rpc, id, to, why){
    return rpc("hide_review", { p: { id: id, to: to, why: why || null } });
  };

  /* 후기를 쓸 수 있는 업체인가 — ⚠️⚠️ **화면이 제 표를 들고 있으면
     안 됩니다.** 조건은 DB(0037)에 있습니다: 그 업체의 견적을 골랐거나,
     그 업체와 만났거나. 여기서는 **같은 조건을 받은 자료로** 봅니다 —
     조건이 안 맞는데 양식을 내면 눌러도 거절되는 단추가 됩니다
     (절대 규칙 5).
     ⚠️ 한쪽만 고치면 어긋나는 자리입니다. 0037 의 write_review 를
     고치는 날 이 함수를 같이 고치세요. */
  window.amRvCanWrite = function(pid, quotes, appts){
    var byQuote = (quotes || []).some(function(q){
      return q.provider_id === pid && q.state === "chosen";
    });
    var byMeet = (appts || []).some(function(a){
      return a.provider_id === pid && a.state === "done";
    });
    return byQuote || byMeet;
  };
})();

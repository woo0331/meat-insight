/* ════════════════════════════════════════════════════════════════════
   /my — 내가 올린 구합니다 · 내가 보낸 답   (0061)

   ⚠️⚠️⚠️ **연락처는 받아들이기만으로 안 열립니다** (제17조 제2항).
   받아들이는 것은 "얘기해 봅시다" 이지 "내 번호를 줘도 좋다" 가
   아닙니다. 각자 **제 것만** 열고 **언제든 닫습니다**(철회권) —
   닫을 때는 동의 시각을 **안 받습니다**(받으면 철회를 막는 꼴입니다).
   ⚠️ **맞바꾸기를 강요하지 않습니다** — 한쪽만 열어도 그쪽 것만 갑니다.

   ⚠️⚠️ **말이 두 벌입니다** — 올린 분의 `name` 과 답한 분의 `mine`.
   "답을 받았습니다" 를 답한 분 화면에 찍으면 올린 분에게 할 말을
   답한 분에게 찍는 것입니다 (절대 규칙 3). `amWReplySt(key, mine)`
   한 함수가 가릅니다.

   ⚠️ `contact` · `agree_at` 을 **부르지 않습니다** — 0061 이 그 칸을
   안 줬으므로 부르면 **질의가 통째로 거절**됩니다 (0053 의 `memo` ·
   `answered_by` 에서 겪은 그 자리입니다).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("wtmine");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc;
  var REG = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });
  function rgName(k){ return REG[k] || String(k || ""); }
  /* 분류 · 하위 이름 — ⚠️ `catalog.js` 한 곳에서 끌어옵니다 */
  function catName(k){
    var c = window.amCat ? window.amCat(k) : null;
    return c ? c.name : String(k || "");
  }
  function subName(ck, sk){
    if(!sk) return "";
    var c = window.amCat ? window.amCat(ck) : null;
    var L = (c && window.amCatItems) ? (window.amCatItems(c) || []) : [];
    for(var i = 0; i < L.length; i++) if(L[i].key === sk) return L[i].name;
    return String(sk);
  }

  function get(a, path){
    return fetch(a.conf.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey: a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : []; });
  }
  function call(a, fn, p){
    return fetch(a.conf.url + "/rest/v1/rpc/" + fn, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json",
                               apikey: a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {}),
      body: JSON.stringify({ p: p })
    }).then(function(r){
      return r.text().then(function(t){
        if(!r.ok){ var m = t; try{ m = JSON.parse(t).message || t; }catch(_){}
                   throw new Error(m); }
        try{ return JSON.parse(t); }catch(_){ return t; }
      });
    });
  }

  /* 연락처 칸 — ⚠️ 없으면 "아직 안 여셨습니다" 라고 말합니다 (빈 자리를
     두면 "연락처가 없는 사람" 으로 읽힙니다). */
  function contactLine(label, val){
    return '<p class="mj-c">' + esc(label) + ' ' +
      (val ? '<b>' + esc(val) + '</b>'
           : '<span class="mj-no">아직 안 여셨습니다</span>') + '</p>';
  }
  /* ⚠️ 이름을 단추 글에 끼우지 않습니다 — 상호가 길면 단추가 폰에서
     두 줄이 되고, 조사도 받침에 따라 갈립니다. 누구에게 보여 주는지는
     그 답 카드 안이라 이미 분명합니다. */
  function shareBtn(id, mine){
    return '<button type="button" class="btn ' + (mine ? "btn-bad" : "btn-pt") +
      ' btn-sm wt-share" data-id="' + esc(id) + '" data-on="' + (mine ? "0" : "1") + '">' +
      (mine ? "내 연락처 다시 감추기" : "내 연락처 보여 주기") +
      '</button>';
  }

  /* ── 고치기 양식 ────────────────────────────────────────────────
     ⚠️⚠️ **분류 · 하위 · 지역은 못 고칩니다** — 바꾸면 답하신 분이
     전혀 다른 것에 묶입니다 (조인에서 날짜 · 지역을 막은 그 까닭).
     문도 그 셋은 아예 안 받습니다. 그래서 양식에 칸을 **안 내고**,
     못 고친다는 것을 그 자리에서 **말합니다** (안 적으면 손님은
     어디서 바꾸는지 찾아 헤맵니다 · 절대 규칙 2).
     ⚠️ 예산은 **비워 보내면 지워집니다** (문이 빈 글자를 null 로
     읽습니다) — 그래서 "비우면 안 적은 것이 됩니다" 를 적습니다. */
  function editForm(w){
    var cb = [catName(w.cat)];
    if(w.sub) cb.push(subName(w.cat, w.sub));
    cb.push(rgName(w.region));
    return '<form class="jform wt-ef" data-id="' + esc(w.id) + '">' +
      '<div class="jrow jrow-full"><label for="wtef-t">제목 <b>*</b></label>' +
      '<input id="wtef-t" name="title" required minlength="2" maxlength="60" value="' +
        esc(w.title) + '"></div>' +
      '<div class="jrow jrow-full"><label for="wtef-b">무엇을 찾으시는지 <b>*</b></label>' +
      '<textarea id="wtef-b" name="body" rows="4" required minlength="5" ' +
        'maxlength="2000">' + esc(w.body || "") + '</textarea></div>' +
      '<div class="jrow"><label for="wtef-w">언제 필요하신지</label>' +
      '<input id="wtef-w" name="when_txt" maxlength="60" value="' +
        esc(w.when_txt || "") + '" placeholder="예) 이번 달 안에"></div>' +
      '<div class="jrow"><label for="wtef-p">생각하시는 예산 (원)</label>' +
      '<input id="wtef-p" name="budget" type="number" min="0" max="100000000" ' +
        'step="1000" inputmode="numeric" value="' +
        esc(w.budget === null || w.budget === undefined ? "" : String(w.budget)) +
        '"></div>' +
      '<p class="jhint jrow-full"><b>' + esc(cb.join(" · ")) + '</b> 은 여기서 ' +
      '못 바꿉니다 — 바꾸시려면 이 글을 내리고 새로 올려 주셔야 합니다 ' +
      '(이미 답하신 분이 전혀 다른 것에 묶이지 않게).</p>' +
      '<p class="jhint jrow-full">예산을 <b>비워 두시면 안 적은 것</b>이 ' +
      '됩니다. 0 을 적으시면 <b>무료로 해 주실 분을 찾는다</b>는 뜻입니다.</p>' +
      '<div class="jrow jrow-full">' +
      '<button type="submit" class="btn btn-pt">고친 내용 저장</button> ' +
      '<button type="button" class="btn btn-line wt-ex">그만두기</button></div>' +
    '</form>';
  }

  /* 답 한 줄 — ⚠️ `mine` 이 true 면 **내가 보낸 답**입니다 (말이 갈립니다) */
  function replyRow(r, cm, mine){
    var st = window.amWReplySt ? window.amWReplySt(r.state, mine) : null;
    var c  = cm[r.id] || {};
    /* ⚠️ 이름은 **머리말 한 곳**에만 씁니다 (문장 · 단추에 끼우면
       조사가 받침에 따라 갈리고 상호가 길면 단추가 두 줄이 됩니다). */
    var head = mine ? "내가 보낸 답" : (r.pro_name || r.who || "회원");
    var open = (r.state === "accepted");
    /* 내가 연 것 · 상대가 연 것을 **갈라서** 봅니다 */
    var iOpened = mine ? !!c.helper_share_at : !!c.owner_share_at;
    var theirs  = mine ? c.owner_contact : c.helper_contact;
    return '<article class="lsc">' +
      '<div class="lsc-h"><h3>' + esc(head) +
        (!mine && r.pro_name ? ' <span class="chip">업체</span>' : '') + '</h3>' +
        (st ? '<span class="chip">' + esc(st.name) + '</span>' : '') +
      '</div>' +
      '<p class="lsc-b">' + esc(r.body) + '</p>' +
      (open
        ? '<p class="lsc-m">⚠️ 연락처는 <b>각자 제 것만</b> 엽니다. ' +
            '받아들였다고 저절로 열리지 않습니다.</p>' +
          /* ⚠️⚠️⚠️ **이름을 문장에 끼우지 않습니다.** 처음에
             `<상호>이(가) 열어 준` 으로 적었다가 찍어 보니
             "아카데미이(가)" 가 나왔습니다 — 조사를 글자로 박은
             자리입니다(작업 기억의 그 줄). `koWith()` 로 고쳐도
             가린 성함(`김**`)은 받침을 알 수 없어 "김**가" 가 됩니다.
             ⚠️ **누구인지는 바로 위 머리말이 이미 말합니다** — 여기서
             다시 적을 까닭이 없습니다. 끼우지 않으면 조사도 ·
             이중 escape 도 생기지 않습니다. */
          contactLine("상대가 열어 준 연락처 —", theirs) +
          '<p class="lsc-go">' + shareBtn(r.id, iOpened) + '</p>'
        : (mine ? ''
                : '<p class="lsc-go">' +
                  '<button type="button" class="btn btn-pt btn-sm wt-mv" ' +
                    'data-id="' + esc(r.id) + '" data-to="accepted">받아들이기</button> ' +
                  '<button type="button" class="btn btn-bad btn-sm wt-mv" ' +
                    'data-id="' + esc(r.id) + '" data-to="rejected">거절</button>' +
                  '</p>')) +
      '</article>';
  }

  /* ⚠️⚠️ 고치기 양식이 **읽을 값**을 들고 있어야 합니다 — 보낸 칸만
     고치는 문이라 양식이 빈 칸으로 열려도 DB 값은 그대로 남지만,
     사람은 적어 둔 것이 안 보이면 "지워진 것" 으로 읽고 다시 적습니다. */
  var ROWS = [];

  function paint(a, mine, byW, sent, cm){
    ROWS = mine;
    var html = '<h2 class="mj-h">내가 올린 구합니다</h2>';

    if(!mine.length){
      /* ⚠️⚠️ **0건이어도 막다른 길로 두지 않습니다** — 지금 실제로
         되는 것을 같이 냅니다 (절대 규칙 2). */
      html += '<p class="myhint">아직 올리신 글이 없습니다. ' +
        '찾으시는 것을 적어 두시면 업체나 다른 회원이 답을 답니다.</p>' +
        '<p class="lsc-go"><a class="btn btn-pt" href="/cat/lesson">' +
        '구합니다 글 올리기</a></p>';
    }else{
      html += '<ul class="lsl">' + mine.map(function(w){
        var st = window.amWantSt ? window.amWantSt(w.state) : null;
        var bud = window.amWantBudget ? window.amWantBudget(w.budget) : "";
        var rs = byW[w.id] || [];
        var bits = [catName(w.cat)];
        if(w.sub)      bits.push(subName(w.cat, w.sub));
        bits.push(rgName(w.region));
        if(w.when_txt) bits.push(w.when_txt);
        return '<li class="lsc">' +
          '<div class="lsc-h"><h3>' + esc(w.title) + '</h3>' +
            (st ? '<span class="chip">' + esc(st.name) + '</span>' : '') +
          '</div>' +
          '<p class="lsc-m">' + esc(bits.join(" · ")) +
            (bud ? ' · ' + esc(bud) : '') + '</p>' +
          /* ⚠️ 가린 까닭은 **글쓴이에게 보여 줍니다** — 까닭 없이 못
             가리게 해 두고 그 까닭을 숨기면 무엇이 문제였는지 알 수
             없습니다. */
          (w.state === "hidden" && w.hidden_why
            ? '<p class="lsc-m">가린 까닭 — ' + esc(w.hidden_why) + '</p>' : '') +
          (w.state === "open"
            ? '<p class="lsc-go">' +
              '<button type="button" class="btn btn-line btn-sm wt-edit" ' +
                'data-id="' + esc(w.id) + '">고치기</button> ' +
              '<button type="button" class="btn btn-line btn-sm wt-done" ' +
                'data-id="' + esc(w.id) + '">구했습니다</button> ' +
              '<button type="button" class="btn btn-bad btn-sm wt-close" ' +
                'data-id="' + esc(w.id) + '">내리기</button></p>'
            : '') +
          (rs.length
            ? '<p class="jafh"><b>받은 답 ' + esc(String(rs.length)) + '</b></p>' +
              rs.map(function(r){ return replyRow(r, cm, false); }).join("")
            : '<p class="lsc-m">아직 답이 없습니다.</p>') +
        '</li>';
      }).join("") + '</ul>';
    }

    /* ⚠️ 내가 **보낸** 답 — 0건이면 그 머리말을 **아예 안 그립니다**
       (빈 제목만 서 있으면 고장으로 보입니다). */
    if(sent.length){
      html += '<h2 class="mj-h">내가 보낸 답</h2>' +
        '<ul class="lsl">' + sent.map(function(r){
          return '<li class="lsc">' + replyRow(r, cm, true) + '</li>';
        }).join("") + '</ul>';
    }

    html += '<p class="jmsg" id="wtmmsg" role="status"></p>';
    box.innerHTML = html;
    box.hidden = false;
    box.classList.remove("none");
  }

  function reload(a){
    return Promise.all([
      /* ⚠️⚠️ `contact` · `agree_at` 은 **부르지 않습니다** — 0061 이 그
         칸을 안 줬으므로 부르면 질의가 통째로 거절됩니다. */
      get(a, "wanted?select=id,cat,sub,region,title,body,budget,when_txt," +
             "state,hidden_why,created_at&order=created_at.desc&limit=50"),
      /* ⚠️ 답은 **보기**로 읽습니다 — 업체 상호와 가린 성함이 거기서
         나옵니다 (화면이 가리면 본이름이 이미 브라우저까지 온 것입니다). */
      get(a, "v_wanted_reply?select=id,w_id,by_user,body,state,created_at," +
             "owner_share_at,helper_share_at,pro_name,who,owner&limit=200"),
      get(a, "v_wanted_contact?select=reply_id,owner_contact,helper_contact," +
             "owner_share_at,helper_share_at&limit=200")
    ]).then(function(r){
      var mine = r[0] || [], reps = r[1] || [], contacts = r[2] || [];
      var cm = {};
      contacts.forEach(function(c){ cm[c.reply_id] = c; });
      /* ⚠️ 보기가 **내 글에 온 것**과 **내가 보낸 것**을 둘 다 내려
         줍니다 — 어느 쪽인지는 `owner` 로 갈라야 합니다. */
      var ids = {}; mine.forEach(function(x){ ids[x.id] = true; });
      var byW = {}, sent = [];
      reps.forEach(function(x){
        if(ids[x.w_id]) (byW[x.w_id] = byW[x.w_id] || []).push(x);
        else sent.push(x);
      });
      paint(a, mine, byW, sent, cm);
    });
  }

  function say(m){
    var el = document.getElementById("wtmmsg");
    if(el) el.textContent = String(m || "");
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on || !a.signedIn) return;   /* 로그인 전에는 안 그립니다 */

    box.addEventListener("click", function(e){
      var t = e.target;
      if(!t || !t.closest) return;

      var mv = t.closest(".wt-mv");
      if(mv){
        say("보내는 중입니다…");
        call(a, "move_wantedreply", { id: mv.getAttribute("data-id"),
                                      to: mv.getAttribute("data-to") })
          .then(function(){ say(""); return reload(a); })
          .catch(function(err){
            say(String((err && err.message) || "처리하지 못했습니다."));
          });
        return;
      }

      var sh = t.closest(".wt-share");
      if(sh){
        var on = sh.getAttribute("data-on") === "1";
        /* ⚠️ **여는 쪽만** 동의 시각을 보냅니다 — 닫는 것은 철회라
           동의가 필요 없습니다 (요구하면 철회를 막는 꼴입니다). */
        var args = { id: sh.getAttribute("data-id"), on: on };
        if(on) args.agree_at = new Date().toISOString();
        say(on ? "여는 중입니다…" : "감추는 중입니다…");
        call(a, "share_wantedcontact", args)
          .then(function(){ say(""); return reload(a); })
          .catch(function(err){
            say(String((err && err.message) || "하지 못했습니다."));
          });
        return;
      }

      /* 고치기 — 한 번 더 누르면 접습니다 (열어 두면 어느 글을 고치는지
         헷갈립니다). ⚠️ 양식이 이미 열려 있으면 **그 자리에서** 지웁니다. */
      var ed = t.closest(".wt-edit");
      var ex = t.closest(".wt-ex");
      if(ed || ex){
        var li = (ed || ex).closest(".lsc");
        if(!li) return;
        /* ⚠️⚠️ **열린 양식은 상자 전체에서** 거둡니다 — 이 `<li>` 안만
           보면 다른 글의 양식이 같이 열려 있을 수 있고, 그러면 같은
           id 가 둘이 되어 화면 읽는 기계가 어느 칸인지 못 가립니다
           (0046 의 `#j-agree` 에서 겪은 자리). */
        var had = li.querySelector(".wt-ef");
        Array.prototype.forEach.call(box.querySelectorAll(".wt-ef"),
          function(f){ f.remove(); });
        if(ex || had) return;
        var id = ed.getAttribute("data-id");
        var row = ROWS.filter(function(x){ return x.id === id; })[0];
        if(!row) return;
        li.insertAdjacentHTML("beforeend", editForm(row));
        var inp = li.querySelector(".wt-ef input[name=title]");
        if(inp) inp.focus();
        return;
      }

      var dn = t.closest(".wt-done");
      var cl = t.closest(".wt-close");
      if(dn || cl){
        var btn = dn || cl;
        /* ⚠️ 되돌릴 수 없는 일이라 한 번 여쭙습니다 */
        if(!window.confirm(dn ? "구하셨습니까? 목록에서 내려갑니다."
                              : "이 글을 내릴까요?")) return;
        say("처리하는 중입니다…");
        call(a, "close_wanted", { id: btn.getAttribute("data-id"),
                                  to: dn ? "done" : "closed" })
          .then(function(){ say(""); return reload(a); })
          .catch(function(err){
            say(String((err && err.message) || "처리하지 못했습니다."));
          });
        return;
      }
    });

    /* ⚠️⚠️ **보낸 칸만** 고치는 문입니다 — 그래서 양식의 네 칸을 **다
       같이** 보냅니다. 한 칸을 빼면 그 칸은 그대로 남지만, 손님은
       고친 것이 안 들어간 줄로 읽습니다. ⚠️ 분류 · 하위 · 지역은
       **보내지 않습니다**(문이 안 받습니다 — 보내면 조용히 무시됩니다). */
    box.addEventListener("submit", function(e){
      var f = e.target;
      if(!f || !f.classList || !f.classList.contains("wt-ef")) return;
      e.preventDefault();
      var sb = f.querySelector('button[type="submit"]');
      if(sb) sb.disabled = true;
      say("저장하는 중입니다…");
      call(a, "edit_wanted", {
        id:       f.getAttribute("data-id"),
        title:    f.elements.title.value,
        body:     f.elements.body.value,
        when_txt: f.elements.when_txt.value,
        budget:   f.elements.budget.value
      }).then(function(){ say(""); return reload(a); })
        .catch(function(err){
          if(sb) sb.disabled = false;
          /* ⚠️ DB 가 거절한 말을 **그대로** 보여 줍니다 */
          say(String((err && err.message) || "저장하지 못했습니다."));
        });
    });

    reload(a).catch(function(){ /* 못 읽었으면 숨긴 채로 둡니다 */ });
  }).catch(function(){});
})();

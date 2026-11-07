/* ════════════════════════════════════════════════════════════════════
   골프 인력 · 비즈니스 — /cat/career 에서만 돕니다 (DB 는 0048)

   ⚠️⚠️⚠️ **왜 이 화면이 생겼나.** `/cat/career` 는 막다른 길이었습니다 —
   하위분류 여섯 이름만 보이고, 구인 글을 올릴 자리도 지원할 자리도
   없었습니다. 막다른 분류 셋 가운데 마지막입니다 (조인 0046 ·
   커뮤니티 0047 · 여기).

   ⚠️⚠️ **목록은 브라우저가 그립니다** — 빌드가 못 찍습니다. 글은 아무
   때나 올라오므로 빌드 때 찍으면 배포할 때만 바뀝니다. 그래서
   **설명은 빌드가**(크롤러 · 자바스크립트 꺼진 분이 읽을 몫),
   **목록은 브라우저가** 그립니다.
   ⚠️ 그 설명 글을 지우면 봇에게는 **빈 화면**이 됩니다.

   ⚠️⚠️⚠️ **연락처는 여기서 한 번도 안 보입니다.** 목록이 읽는
   `v_job_open` 에는 연락처 칸이 **아예 없습니다**. 수락된 뒤 서로
   **따로 동의**해야 오가고, 그 자리는 `/my` 입니다 (0048 · 제17조
   제2항). 구직 글의 번호를 긁어 가는 것을 막는 자리입니다.

   ⚠️⚠️ **거르개를 목록 안에 둡니다.** 이 목록은 자바스크립트가 있어야
   보이므로, 거르개도 같이 그립니다 — 빌드가 찍어 두면 자바스크립트가
   꺼진 분에게 **눌러도 아무 일이 안 나는 칸**이 됩니다 (절대 규칙 5).
   ⚠️ 대신 **주소를 같이 바꿉니다**(`?k=`) — 복사해 보내도 같은 화면이고
   뒤로 가기도 됩니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var list = document.getElementById("joblist");
  if(!list || !window.amAuthAsk) return;

  var esc  = window.esc;
  var KEEP = (window.WOW_BIZ || {}).careerKeep || "";
  var REG  = {};
  (window.AM_REGIONS || []).forEach(function(r){ REG[r.key] = r.name; });

  /* ⚠️⚠️ **하위분류를 여기 다시 적지 않습니다** — `js/data/catalog.js`
     의 `career` 항목을 읽습니다. 두 곳에 적으면 하위분류가 느는 날
     화면은 보내는데 DB 가 거절합니다. */
  var SUBS = [];
  (window.AM_CATS || []).forEach(function(c){
    if(c.key === "career") SUBS = c.items || [];
  });
  var SUBNAME = {};
  SUBS.forEach(function(i){ SUBNAME[i.key] = i.name; });

  /* 갈래 — ⚠️ **한 곳**에 적습니다 (DB 의 check 와 같은 글자) */
  var KINDS = [
    { key:"hire", name:"구인",  lead:"사람을 구합니다" },
    { key:"seek", name:"구직",  lead:"일자리를 구합니다" },
    { key:"biz",  name:"제휴 · 거래", lead:"업체끼리 제안합니다" }
  ];
  var KNAME = {};
  KINDS.forEach(function(k){ KNAME[k.key] = k.name; });

  function dayText(iso){
    var d = new Date(iso + "T00:00:00");
    if(isNaN(d.getTime())) return iso;
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일";
  }
  function when(iso){
    var d = new Date(iso);
    if(isNaN(d.getTime())) return "";
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일";
  }

  /* 지금 걸린 거르개 — 주소에서 읽습니다 (복사해 보내도 같은 화면) */
  function nowKind(){
    var m = /[?&]k=([a-z]+)/.exec(window.location.search || "");
    var k = m ? m[1] : "";
    return KNAME[k] ? k : "";
  }
  /* ⚠️⚠️ 하위분류로 좁혀 오신 길 (`?s=` · 지시서 §4) — 분류 화면의
     하위 목록이 `amSubUrl()` 로 보냅니다. 전에는 하위 여섯이 **글로만**
     있어서 거기까지 가는 길이 없었습니다.
     ⚠️ 모르는 하위 키는 **버립니다** — 주소를 손으로 고쳐 오시면
     아무것도 안 걸리는 화면이 되는데, 그러면 "글이 없다" 로 읽힙니다. */
  function nowSub(){
    var m = /[?&]s=([a-z0-9-]+)/.exec(window.location.search || "");
    var k = m ? m[1] : "";
    return SUBNAME[k] ? k : "";
  }

  function get(a, path){
    return fetch(a.conf.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey:a.conf.anonKey },
                             window.amAuthHeaders ? window.amAuthHeaders() : {})
    }).then(function(r){ return r.ok ? r.json() : []; });
  }
  function call(a, fn, p){
    return fetch(a.conf.url + "/rest/v1/rpc/" + fn, {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json", apikey:a.conf.anonKey },
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

  function card(j){
    /* ⚠️⚠️ **업체 이름은 올리신 분이 고르셨을 때만** 옵니다
       (`pro_name`). 없으면 가린 이름(`김**`)입니다 — 글은 공개지만
       글쓴이는 공개가 아닙니다. */
    var who = j.pro_name ? j.pro_name : j.who;
    return '<li class="jbc" data-id="' + esc(j.id) + '">' +
      '<div class="jbc-h">' +
        '<h3>' + esc(j.title) + '</h3>' +
        '<span class="jbc-k">' + esc(KNAME[j.kind] || j.kind) + '</span>' +
      '</div>' +
      '<p class="jbc-m">' + esc(SUBNAME[j.sub] || j.sub) + ' · ' +
        esc(REG[j.region] || j.region) + ' · ' + esc(who) +
        ' · ' + esc(when(j.created_at)) + '</p>' +
      /* ⚠️ 급여 · 조건은 비면 **줄째 빠집니다** (절대 규칙 2 — "협의"
         를 우리가 지어 적지 않습니다) */
      (j.pay   ? '<p class="jbc-p">급여 · 조건 ' + esc(j.pay) + '</p>' : '') +
      (j.terms ? '<p class="jbc-w">' + esc(j.terms) + '</p>' : '') +
      (j.close_at ? '<p class="jbc-d">마감 ' + esc(dayText(j.close_at)) + '</p>' : '') +
      '<p class="jbc-b">' + esc(j.body) + '</p>' +
      '<div class="jbc-act">' +
        '<button type="button" class="btn btn-pt jbc-go">' +
          (j.kind === "biz" ? "제안 보내기" : "지원하기") + '</button>' +
        '<span class="jbc-n">받은 것 ' + esc(String(j.apply_n)) + '</span>' +
      '</div>' +
    '</li>';
  }

  /* ⚠️⚠️ 개인정보보호법 제15조 제2항 — 수집 항목 · 이용 목적 · 보유
     기간을 **동의받는 그 자리에서** 같이 보여 줍니다. 링크로 빼 두면
     "같이 보여 준 것" 이 아닙니다. */
  function consentBox(what){
    return '<div class="jrow jrow-full jconsent">' +
      '<label class="jchk"><input type="checkbox" required> ' +
      '<span>아래 내용으로 개인정보 수집 · 이용에 동의합니다 <b>*</b></span></label>' +
      '<ul class="jterms">' +
        '<li><b>수집 항목</b> 연락처, 적어 주신 글</li>' +
        '<li><b>이용 목적</b> ' + esc(what) + '</li>' +
        '<li><b>보유 기간</b> ' + esc(KEEP) + '</li>' +
        '<li><b>제공</b> 연락처는 <b>수락 뒤 따로 고르셨을 때만</b> ' +
          '그 상대 한 분에게 보입니다. 언제든 다시 닫으실 수 있습니다.</li>' +
      '</ul>' +
      '<p class="jhint">동의하지 않으셔도 다른 기능은 그대로 쓰실 수 있습니다.</p>' +
    '</div>';
  }

  function applyForm(kind){
    var biz = kind === "biz";
    return '<form class="jform jbaf">' +
      '<div class="jrow jrow-full">' +
        '<label>' + (biz ? '제안 내용' : '하실 말씀') + ' <b>*</b></label>' +
        '<textarea name="msg" rows="4" required minlength="5" maxlength="1000" ' +
        'placeholder="' + (biz ? '어떤 제휴 · 거래를 바라시는지 적어 주세요.'
                               : '구력 · 자격 · 가능한 시간 등을 적어 주세요.') +
        '"></textarea>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label>연락처 <b>*</b></label>' +
        '<input name="contact" required maxlength="100" autocomplete="tel" ' +
        'placeholder="전화번호 또는 메신저 아이디">' +
        /* ⚠️⚠️⚠️ 제17조 — 언제 누구에게 가는지를 **적는 그 자리에서** 말합니다 */
        '<span class="jhint">⚠️ 올리신 분에게 <b>바로 가지 않습니다.</b> ' +
        '수락된 뒤 <b>다시 한 번 고르셔야</b> 보입니다.</span>' +
      '</div>' +
      consentBox(biz ? '제안을 전하고 올리신 분과 잇기'
                     : '지원을 전하고 올리신 분과 잇기') +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">보내기</button>' +
        '<button type="button" class="btn btn-line jbaf-x">그만두기</button>' +
        '<p class="jmsg jbafm" hidden></p>' +
      '</div>' +
    '</form>';
  }

  function openForm(hasPro){
    var kd = KINDS.map(function(k){
      return '<option value="' + esc(k.key) + '">' + esc(k.name) +
             ' — ' + esc(k.lead) + '</option>';
    }).join("");
    var sb = SUBS.map(function(i){
      return '<option value="' + esc(i.key) + '">' + esc(i.name) + '</option>';
    }).join("");
    var rg = (window.AM_REGIONS || []).map(function(r){
      return '<option value="' + esc(r.key) + '">' + esc(r.name) + '</option>';
    }).join("");
    return '<form id="jbf" class="jform">' +
      '<div class="jrow">' +
        '<label for="b-kind">무엇을 올리시나요 <b>*</b></label>' +
        '<select id="b-kind" name="kind" required>' +
          '<option value="">고르세요</option>' + kd +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="b-sub">분류 <b>*</b></label>' +
        '<select id="b-sub" name="sub" required>' +
          '<option value="">고르세요</option>' + sb +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="b-rg">지역 <b>*</b></label>' +
        '<select id="b-rg" name="region" required>' +
          '<option value="">고르세요</option>' + rg +
        '</select>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="b-close">마감일</label>' +
        '<input id="b-close" name="close_at" type="date">' +
        '<span class="jhint">비워 두시면 직접 마감하실 때까지 보입니다.</span>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="b-title">제목 <b>*</b></label>' +
        '<input id="b-title" name="title" required minlength="2" maxlength="60" ' +
        'placeholder="보기: 주말 캐디 구합니다 (경기 남부)">' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="b-pay">급여 · 조건</label>' +
        '<input id="b-pay" name="pay" maxlength="60" placeholder="보기: 일 12만원">' +
        /* ⚠️ 비우면 화면에서 그 줄이 줄째 빠집니다 — 우리가 "협의" 를
           지어 적지 않습니다 (절대 규칙 2 · 5) */
        '<span class="jhint">비워 두시면 그 줄이 아예 안 나옵니다.</span>' +
      '</div>' +
      '<div class="jrow">' +
        '<label for="b-terms">근무 조건</label>' +
        '<input id="b-terms" name="terms" maxlength="200" ' +
        'placeholder="보기: 주 3일 · 오전">' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="b-body">내용 <b>*</b></label>' +
        '<textarea id="b-body" name="body" rows="5" required minlength="5" ' +
        'maxlength="2000" placeholder="하시는 일 · 바라시는 것을 적어 주세요."></textarea>' +
      '</div>' +
      '<div class="jrow jrow-full">' +
        '<label for="b-contact">연락처 <b>*</b></label>' +
        '<input id="b-contact" name="contact" required maxlength="100" ' +
        'autocomplete="tel" placeholder="전화번호 또는 메신저 아이디">' +
        '<span class="jhint">⚠️ 목록에는 <b>안 나옵니다.</b> ' +
        '지원을 수락하신 뒤 <b>다시 한 번 고르셔야</b> 그분에게만 보입니다.</span>' +
      '</div>' +
      /* ⚠️⚠️ **업체 이름으로 올리는 것은 고르는 것입니다.** 승인된
         업체만 되고, 안 고르시면 다른 글과 같이 가린 이름입니다. */
      (hasPro
        ? '<div class="jrow jrow-full">' +
            '<label class="jchk"><input type="checkbox" id="b-aspro" name="as_pro"> ' +
            '<span>업체 이름(상호)으로 올립니다</span></label>' +
            '<span class="jhint">승인된 업체만 됩니다. 안 고르시면 ' +
            '가린 이름(김**)으로 보입니다.</span>' +
          '</div>'
        : '') +
      consentBox('올리신 글을 알리고 지원하신 분과 잇기') +
      '<div class="jrow jrow-full">' +
        '<button type="submit" class="btn btn-pt">글 올리기</button>' +
        '<p id="jbmsg" class="jmsg" hidden></p>' +
      '</div>' +
    '</form>';
  }

  /* 지금 조건 — ⚠️ 하위로 좁혀 오셨으면 **무엇으로 좁혔는지** 말하고
     풀 길을 같이 냅니다 (칸이 없는 조건이라 말해 주지 않으면 손님은
     "글이 없다" 로 읽습니다). */
  function subLine(sub){
    if(!sub) return "";
    return '<p class="sf-now">' + esc(SUBNAME[sub]) + ' 글만 보고 있습니다. ' +
      '<a href="/cat/career">조건 지우기</a></p>';
  }

  /* 거르개 — ⚠️⚠️ **단추가 아니라 링크**입니다. 주소를 복사해 보내도
     같은 화면이고 뒤로 가기도 됩니다 (`/search` 에서 배운 자리).
     ⚠️ 모양은 `.chip` 한 곳에서 옵니다 — 거르개 모양을 두 벌로
     적으면 한쪽만 고치는 날 둘이 달라집니다.
     ⚠️ 눌림 표시는 `.chip-on` 과 `aria-current` 둘 다 답니다 (색만
     바꾸면 화면 읽는 기계에는 아무 말도 안 한 것입니다). */
  function filters(k, sub){
    /* ⚠️⚠️ 갈래를 눌러도 **하위 조건을 지킵니다** — 풀리면 손님이
       좁혀 온 길이 조용히 사라집니다 (업체찾기에서 겪은 자리). */
    var keep = sub ? "&s=" + encodeURIComponent(sub) : "";
    var one = function(key, name){
      var on = (k === key);
      var qs = key ? ("?k=" + encodeURIComponent(key) + keep)
                   : (sub ? "?s=" + encodeURIComponent(sub) : "");
      return '<a class="chip' + (on ? ' chip-on' : '') + '"' +
        (on ? ' aria-current="true"' : '') +
        ' href="/cat/career' + esc(qs) +
        '" data-k="' + esc(key) + '">' + esc(name) + '</a>';
    };
    return '<div class="sf-c jbf-c">' + one("", "전체") +
      KINDS.map(function(x){ return one(x.key, x.name); }).join("") + '</div>';
  }

  function paint(a, rows, k, sub){
    var html = filters(k, sub) + subLine(sub);
    /* ⚠️⚠️ 0058 — "조건을 저장하고 알림 받기". 글과 주소는
       js/data/deal.js 의 amWatchLink() 한 곳입니다 (분류 화면 셋이
       같은 말을 해야 합니다).
       ⚠️ 로그인한 분에게만 냅니다 — 로그인 전에 그리면 눌러서 로그인
       화면으로 갔다가 돌아와도 저장된 것이 없는 꼴입니다 (절대 규칙 5). */
    if(a && a.signedIn && window.amWatchLink) html += window.amWatchLink("job");
    if(!rows.length){
      /* ⚠️ 0건이어도 **막다른 길로 두지 않습니다** (절대 규칙 2) */
      html += '<div class="none">' +
        '<h3>' + (sub ? esc(SUBNAME[sub]) + ' 글이 아직 없습니다.'
                : k ? esc(KNAME[k]) + ' 글이 아직 없습니다.'
                    : '아직 올라온 글이 없습니다.') + '</h3>' +
        '<p>첫 글을 올려 보세요. 분류와 지역만 정하시면 됩니다.</p></div>';
    }else{
      html += '<ul class="jbl">' + rows.map(card).join("") + '</ul>';
    }
    list.innerHTML = html;

    /* ⚠️ 거르개는 **가로채서** 주소만 바꿉니다 (뒤로 가기도 됩니다) */
    Array.prototype.forEach.call(list.querySelectorAll(".jbf-c .chip"), function(ln){
      ln.addEventListener("click", function(e){
        e.preventDefault();
        var want = ln.getAttribute("data-k");
        try{ window.history.pushState({}, "", ln.getAttribute("href")); }catch(_){}
        load(a, want, sub);
      });
    });

    Array.prototype.forEach.call(list.querySelectorAll(".jbc-go"), function(b){
      b.addEventListener("click", function(){
        if(!a.signedIn){ window.location.href = window.amLoginUrl
          ? window.amLoginUrl(window.location.pathname) : "/login"; return; }
        var li = b.closest(".jbc");
        var old = li.querySelector(".jbaf");
        if(old){ old.remove(); return; }
        var src = rows.filter(function(x){
          return x.id === li.getAttribute("data-id"); })[0];
        if(!src) return;
        li.insertAdjacentHTML("beforeend", applyForm(src.kind));
        var f = li.querySelector(".jbaf");
        f.querySelector(".jbaf-x").addEventListener("click", function(){ f.remove(); });
        f.addEventListener("submit", function(e){
          e.preventDefault();
          var msg = f.querySelector(".jbafm");
          var sb = f.querySelector('button[type="submit"]');
          sb.disabled = true;
          msg.hidden = false; msg.textContent = "보내는 중입니다…";
          call(a, "apply_jobpost", {
            post_id: li.getAttribute("data-id"),
            msg: f.msg.value, contact: f.contact.value,
            /* ⚠️ 동의 시각은 **누른 그 순간**입니다 */
            agree_at: new Date().toISOString()
          }).then(function(){
            li.innerHTML = '<div class="none">' +
              '<h3>보냈습니다.</h3>' +
              /* ⚠️⚠️ 문장 한가운데 링크를 박지 않습니다 (높이 16px) —
                 문단 끝에 **단추**로 냅니다. */
              '<p>올리신 분이 보고 수락하시면 연락처를 주고받으실 수 ' +
              /* ⚠️ 지킬 수 없는 약속을 하지 않습니다 */
              '있습니다. 언제까지라고 약속드리지는 않습니다.</p>' +
              '<a class="btn btn-pt" href="/my">내 정보에서 보기</a></div>';
          }).catch(function(err){
            sb.disabled = false;
            /* ⚠️ DB 가 거절한 말을 **그대로** 보여 줍니다 */
            msg.textContent = String((err && err.message) || "보내지 못했습니다.");
          });
        });
      });
    });
  }

  function load(a, k, sub){
    var q = "v_job_open?select=id,kind,sub,region,title,body,pay,terms," +
            "close_at,created_at,who,pro_name,apply_n" +
            "&order=created_at.desc&limit=50";
    if(k)   q += "&kind=eq." + encodeURIComponent(k);
    /* ⚠️ 열쇠 이름이 DB 의 칸과 **글자까지** 같아야 합니다 — 다르면
       아무것도 안 걸렀는데 화면은 멀쩡해 보입니다. */
    if(sub) q += "&sub=eq." + encodeURIComponent(sub);
    return get(a, q).then(function(rows){
      paint(a, rows || [], k || "", sub || ""); });
  }

  window.amAuthAsk().then(function(a){
    if(!a || !a.on){
      try{ console.warn("[career] 로그인 · 접수가 설정되지 않아 구인 · 구직을 " +
        "열지 않았습니다 (Vercel 의 SUPABASE_URL · SUPABASE_ANON_KEY)."); }catch(e){}
      /* ⚠️ 빌드가 찍어 둔 "아직 없는 것입니다" 를 그대로 두면
         0건이라고 말하는 것입니다 — 열지 않았다고 적습니다. */
      window.amShut("joblist");
      return;                       /* 빌드가 찍어 둔 글 그대로 */
    }
    if(!KEEP){
      /* ⚠️⚠️ 보유 기간을 못 보여 주면 동의를 받을 수 없습니다 (제15조
         제2항). 운영자에게만 말하고 양식은 안 엽니다. */
      try{ console.warn("[career] js/data/site.js 의 careerKeep(보유 기간)이 " +
        "비어 구인 · 구직 양식을 열지 않았습니다 — 개인정보보호법 제15조 제2항."); }catch(e){}
      return;
    }

    load(a, nowKind(), nowSub());
    /* 뒤로 가기 — 주소가 바뀌면 다시 그립니다 */
    window.addEventListener("popstate", function(){
      load(a, nowKind(), nowSub()); });

    var box = document.getElementById("jobbox");
    if(!box) return;
    box.className = "jbox";
    box.innerHTML = a.signedIn
      ? '<h3 class="jbox-h">구인 · 구직 · 제휴 글 올리기</h3>' +
        openForm(!!a.provider)
      : '<div class="none"><h3>글을 올리려면 로그인하셔야 합니다.</h3>' +
        '<p>올리신 글을 나중에 고치거나 마감하시려면 누가 올렸는지 ' +
        '알아야 합니다.</p>' +
        '<a class="btn btn-pt" href="' +
          (window.amLoginUrl ? esc(window.amLoginUrl(window.location.pathname)) : "/login") +
        '">로그인하기</a></div>';
    if(!a.signedIn) return;

    /* 오늘보다 이전은 못 고르게 — 문도 막지만 화면이 먼저 말해 줍니다 */
    var cd = document.getElementById("b-close");
    if(cd) cd.min = new Date().toISOString().slice(0, 10);

    document.getElementById("jbf").addEventListener("submit", function(e){
      e.preventDefault();
      var f = e.target, msg = document.getElementById("jbmsg");
      var btn = f.querySelector('button[type="submit"]');
      var pro = document.getElementById("b-aspro");
      btn.disabled = true;
      msg.hidden = false; msg.textContent = "올리는 중입니다…";
      call(a, "open_jobpost", {
        kind: f.kind.value, sub: f.sub.value, region: f.region.value,
        title: f.title.value, body: f.body.value, pay: f.pay.value,
        terms: f.terms.value, close_at: f.close_at.value,
        contact: f.contact.value, as_pro: !!(pro && pro.checked),
        agree_at: new Date().toISOString()
      }).then(function(){
        box.className = "none";
        box.innerHTML = '<h3>글을 올렸습니다.</h3>' +
          '<p>목록에 바로 보입니다. 지원이 들어오면 내 정보에서 ' +
          '수락하실 수 있습니다.</p>' +
          '<a class="btn btn-pt" href="/my">내 정보에서 보기</a>';
        load(a, nowKind(), nowSub());
      }).catch(function(err){
        btn.disabled = false;
        msg.textContent = String((err && err.message) || "올리지 못했습니다.");
      });
    });
  }).catch(function(){ /* 못 물어봤으면 빌드가 찍은 글 그대로 */ });
})();

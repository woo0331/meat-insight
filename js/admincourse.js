/* ════════════════════════════════════════════════════════════════════
   골프장 · 연습장 관리 — /admin 의 한 자리  (DB 는 0066)

   ⚠️⚠️⚠️ **이 자리가 없으면 0066 의 문 셋이 "만들어 놓고 안 쓰는 문"**
   입니다. 이 저장소가 다섯 번 겪은 자리이고(`approve_provider` ·
   `save_provider_contact` · `drop_photo` · 문의 답변 · 수수료), 그때마다
   사장님이 SQL 편집기를 직접 치셔야 했습니다.

   여기서 하는 일 셋
     ① slug 고치기 — 들여온 slug 는 **관리번호**라 읽기 어렵습니다.
        주소에 쓰는 값이므로 운영자가 예쁘게 고칩니다 (id 는 안 바뀝니다).
     ② 가리기 · 폐업 표시 — **지우는 길은 없습니다**
     ③ 같은 곳의 다른 이름 잇기 — 올라온 티타임이 그 자리에서 이어집니다

   ⚠️⚠️ **관리자만**입니다 — 문 셋이 전부 운영자만 받습니다. 직원에게
   그려 두면 눌러도 거절되는 칸이 됩니다 (절대 규칙 5).
   ⚠️⚠️ **가릴 때는 까닭이 반드시**입니다 (DB 가 막습니다) — 까닭 없이
   가릴 수 있으면 누가 불평할 때마다 지워 주는 자리가 됩니다.
   ⚠️ 공공 자료에서 온 이름이지만 **그래도 esc()** 를 지납니다.
   ⚠️ 0곳이면 **0곳이라고 말하고** 어떻게 넣는지 한 줄로 알려 줍니다
   (막다른 길로 두지 않습니다 · 절대 규칙 2).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("csadm");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null, D = null, Q = "";

  function get(q){
    return fetch(A.conf.url + "/rest/v1/" + q, {
      headers: Object.assign({ apikey: A.conf.anonKey }, window.amAuthHeaders())
    }).then(function(r){ return r.ok ? r.json().catch(function(){ return null; }) : null; })
      .catch(function(){ return null; });
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
  function why(err){
    var w = String((err && err.message) || "");
    try{ w = JSON.parse(w).message || w; }catch(_){}
    return w || "하지 못했습니다.";
  }
  function say(m){
    var p = box.querySelector(".csadm-msg");
    if(p){ p.textContent = m; p.hidden = false; }
  }
  /* ⚠️ 상태 말은 여기 한 곳입니다 — 값은 0066 의 check 와 한 글자도
     같아야 합니다 (다르면 DB 가 거절합니다). */
  var ST = { open:"영업 중", closed:"폐업 · 휴업", hidden:"가림" };
  function stName(k){ return ST[k] || String(k || ""); }

  function rgName(k){
    var L = window.AM_REGIONS || [];
    for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
    return String(k || "");
  }

  function row(c){
    return '<li data-cs="' + esc(c.id) + '">' +
      '<b>' + esc(c.name) + '</b>' +
      '<p class="fe-r">' + esc(window.amCourseKind(c.kind)) + ' · ' +
        esc([rgName(c.region), c.gu].filter(Boolean).join(" ")) +
        ' · ' + esc(stName(c.state)) +
        /* ⚠️ 출처를 같이 냅니다 — 손으로 넣은 줄과 공공 자료를 가릅니다 */
        (c.source_id ? ' · 출처 ' + esc(c.source_id) : ' · 손으로 넣음') +
      '</p>' +
      '<p class="fe-r">주소 <code>/course/' + esc(c.slug) + '</code></p>' +
      '<div class="dk-b">' +
        '<button type="button" class="btn btn-sm btn-pri" data-do="slug">주소(slug) 고치기</button>' +
        '<button type="button" class="btn btn-sm btn-pri" data-do="alias">다른 이름 잇기</button>' +
        '<button type="button" class="btn btn-sm btn-pri" data-do="photo">사진 경로</button>' +
        (c.state === "hidden"
          ? '<button type="button" class="btn btn-sm btn-line" data-do="open">다시 내기</button>'
          : '<button type="button" class="btn btn-sm btn-bad" data-do="hide">가리기</button>') +
      '</div>' +
      '<form class="jform cs-f" hidden>' +
        '<div class="jrow jrow-full cs-slug" hidden><label>새 주소(slug) <b>*</b> ' +
          '(영문 소문자 · 숫자 · 붙임표)</label>' +
          '<input name="slug" maxlength="60" value="' + esc(c.slug) + '"></div>' +
        '<div class="jrow jrow-full cs-alias" hidden><label>이을 다른 이름 <b>*</b> ' +
          '(이 이름으로 올라온 티타임이 이 골프장에 이어집니다)</label>' +
          '<input name="alias" maxlength="80"></div>' +
        /* 골프장 사진 (0081) — ⚠️⚠️ **올리는 자리는 아직
           없습니다**(다음 번호). 지금은 공개 버킷에 이미 올라간
           파일을 **가리키는 경로**를 적는 칸입니다. 비우고 보내면
           지워집니다. ⚠️ 꼴은 DB 가 다시 봅니다(`course_photo_ck`). */
        '<div class="jrow jrow-full cs-photo" hidden><label>사진 경로 ' +
          '(비워서 보내시면 지워집니다 · ' +
          'course/&lt;골프장 번호&gt;/파일이름.jpg)</label>' +
          '<input name="photo" maxlength="140" value="' + esc(c.photo || "") + '"></div>' +
        '<div class="jrow jrow-full cs-why" hidden><label>가리는 까닭 <b>*</b> ' +
          '(기록에 남고 지울 수 없습니다)</label>' +
          '<input name="cwhy" maxlength="200"></div>' +
        '<div class="jrow jrow-full">' +
          '<button type="submit" class="btn btn-pt">이대로 하기</button></div>' +
      '</form>' +
    '</li>';
  }

  function paint(){
    /* ⚠️⚠️ **상자를 직접 엽니다** — `/admin` 의 상자는 빌드가 `hidden` 으로
       찍어 두고(로그인 전에는 빈 띠를 안 남깁니다) 그리는 쪽이 엽니다.
       안 열면 그려 놓고도 **아무것도 안 보입니다** (에러 없이 조용히). */
    box.hidden = false; box.className = "deskbox";
    if(!D){
      box.innerHTML = '<h2 class="adm-h">' + icon("flag", 19) + '골프장 · 연습장</h2>' +
        '<p class="lmsg">읽지 못했습니다. ' +
        '<button class="btn btn-sm btn-line" data-do="again">다시 읽기</button></p>';
      return;
    }
    var L = D;
    if(Q){
      var q = Q.replace(/\s+/g, "").toLowerCase();
      L = L.filter(function(c){
        return (String(c.name) + String(c.slug)).replace(/\s+/g, "").toLowerCase().indexOf(q) >= 0;
      });
    }
    box.innerHTML = '<h2 class="adm-h">' + icon("flag", 19) + '골프장 · 연습장</h2>' +
      '<p class="adm-l">공공 자료에서 들여온 시설입니다. ' +
      '<b>주소(slug)는 바꿔도 됩니다</b> — 안쪽 번호는 그대로라 이어진 티타임이 안 끊깁니다.</p>' +
      '<form class="jform csadm-q"><div class="jrow jrow-full">' +
        '<label for="csq">이름 · 주소로 찾기</label>' +
        '<input id="csq" name="csq" value="' + esc(Q) + '" maxlength="40"></div></form>' +
      (D.length
        ? '<ul class="fe-list">' + L.map(row).join("") + '</ul>' +
          (L.length ? "" : '<p class="lmsg">찾으신 조건에 맞는 곳이 없습니다.</p>')
        /* ⚠️⚠️ 0곳이면 **넣는 길**을 한 줄로 말합니다 (막다른 길 금지) */
        : '<p class="lmsg">아직 들여온 골프장이 없습니다. ' +
          '공식 공공데이터를 받아 <code>data/staging/import_courses.sql</code> 을 ' +
          'SQL 편집기에 붙여 넣으시면 여기에 나옵니다.</p>') +
      '<p class="csadm-msg lmsg" hidden></p>';
  }

  function load(){
    /* ⚠️⚠️ **표가 아니라 공개 보기를 읽습니다** — `course` 표에는 GRANT 가
       한 줄도 없어서 읽으려 하면 질의가 통째로 거절됩니다 (그게 맞습니다).
       ⚠️ 가린 것은 보기에 안 나오므로, 가린 뒤에는 목록에서 빠집니다 —
       그 사실을 아래 안내가 말합니다. */
    return get("v_course_public?select=id,slug,kind,name,region,gu,state,source_id,photo" +
               "&order=name.asc&limit=500")
      .then(function(rows){ D = Array.isArray(rows) ? rows : null; paint(); });
  }

  box.addEventListener("input", function(e){
    if(e.target && e.target.id === "csq"){ Q = e.target.value || ""; paint(); }
  });
  box.addEventListener("click", function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    if(t.closest("button[data-do='again']")) return void load();
    var b = t.closest("button[data-do]");
    if(!b) return;
    var li = b.closest("li");
    if(!li) return;
    var kind = b.getAttribute("data-do");
    var f = li.querySelector(".cs-f");
    if(!f) return;
    /* ⚠️ 어느 단추로 열었는지 적어 둡니다 — 한 줄에 단추가 셋이라
       양식만 보고는 무엇을 하려는지 알 수 없습니다 (adminhat 과 같은 꼴) */
    f.setAttribute("data-kind", kind);
    f.querySelector(".cs-slug").hidden  = (kind !== "slug");
    f.querySelector(".cs-alias").hidden = (kind !== "alias");
    f.querySelector(".cs-photo").hidden = (kind !== "photo");
    f.querySelector(".cs-why").hidden   = (kind !== "hide");
    f.hidden = false;
  });
  box.addEventListener("submit", function(e){
    var f = e.target;
    if(!f || !f.classList || !f.classList.contains("cs-f")) return;
    e.preventDefault();
    var li = f.closest("li"), id = li.getAttribute("data-cs");
    var kind = f.getAttribute("data-kind");
    var sb = f.querySelector("button[type='submit']");
    if(sb) sb.disabled = true;

    var p;
    /* ⚠️⚠️ **0066 의 문은 jsonb 하나를 받습니다** — 자리 인자로 보내면
       거절됩니다 (0013 · 0003 과 **반대**입니다). */
    if(kind === "slug"){
      p = rpc("save_course", { p: { id:id, slug:(f.slug.value || "").trim(),
                                    name: li.querySelector("b").textContent } });
    }else if(kind === "alias"){
      p = rpc("link_course_alias", { p: { course_id:id, alias:(f.alias.value || "").trim() } });
    }else if(kind === "photo"){
      /* ⚠️⚠️ **빈 글자도 보내는 것입니다** — 문이 `p ? 'photo'` 로
         보냈는지를 보므로, 비워 보내면 지워집니다(0069 의 모델명과
         같은 결 — `coalesce` 로 받으면 지울 수가 없습니다). */
      p = rpc("save_course_photo", { p: { id:id, photo:(f.photo.value || "").trim() } });
    }else if(kind === "hide"){
      p = rpc("move_course", { p: { id:id, to:"hidden", why:(f.cwhy.value || "").trim() } });
    }else{
      p = rpc("move_course", { p: { id:id, to:"open", why:"" } });
    }
    p.then(load).catch(function(err){
      if(sb) sb.disabled = false;
      /* ⚠️ DB 가 거절하면 **그 말을 그대로** 보여 줍니다 — 우리가 지어낸
         말로 바꾸면 무엇이 막았는지 알 수 없습니다 */
      say(why(err));
    });
  });

  window.amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 관리자가 아니면 **한 줄도 안 그리고** 읽으러 가지도 않습니다 */
    if(!a || !a.on || !a.signedIn || a.role !== "admin") return;
    return load();
  }).catch(function(){});
})();

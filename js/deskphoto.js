/* ════════════════════════════════════════════════════════════════════
   업체가 올리는 **시설 사진**과 **증빙서류** — /desk (DB 는 0051)

   ⚠️⚠️⚠️ **둘은 같은 것이 아닙니다.** 화면에서도 갈라 둡니다 —
     시설 사진 — 손님 **누구나** 봅니다 (업체 카드 · 상세에 찍힙니다)
     증빙서류 — **운영자와 이 업체만** 봅니다 (심사용)
   그 사실을 **올리는 그 자리에서** 말합니다. 섞어 두면 사업자등록증을
   시설 사진 칸에 올리는 날이 옵니다 — 그러면 그게 공개됩니다.
   ⚠️ 받는 형식도 갈라 둡니다 (사진 JPG · PNG · WEBP / 서류 PDF) —
   DB 도 같은 것을 봅니다 (`pvphoto_kind_mime_ok`).

   ⚠️⚠️ **버킷이 설정되기 전에는 그 칸이 아예 안 나옵니다** — 단추도 ·
   안내도 · "준비 중" 도 없습니다 (js/photo.js 와 같은 방식).
   ⚠️ **갈래마다 따로 봅니다**: 공개 버킷(PROVIDER_BUCKET)만 없으면
   시설 사진 칸만 빠지고 서류 칸은 그대로 돕니다.

   ⚠️⚠️ **"올렸습니다" 는 파일이 간 뒤에만** 적습니다 (절대 규칙 5) —
   자리를 받은 것과 파일이 올라간 것은 다른 일입니다.

   ⚠️ 올린 사진이 손님 화면에 보이려면 **자료를 다시 가져와 올려야**
   합니다 (`node tools/pull-providers.js` — 빌드가 HTML 에 찍습니다).
   그 사실을 화면이 그대로 말합니다 — 안 적으면 업체는 "올렸는데 왜
   안 보이냐" 고 묻습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var box = document.getElementById("pvphbox");
  if(!box || !window.amAuthAsk) return;

  var esc = window.esc, icon = window.icon;
  var A = null, ST = { photo:false, doc:false };

  /* ⚠️ `api/upload.js` 의 OK_MIME · MAX_BYTES 와 같아야 합니다 —
     여기는 **먼저 걸러 주는 자리**이고, 마지막 자물쇠는 DB 와 버킷
     설정입니다 (자물쇠 셋). */
  var MIME = { photo:["image/jpeg","image/png","image/webp"],
               doc:["application/pdf"] };
  var MAX  = 8388608;                    /* 8MB */
  var MAXN = { photo:10, doc:5 };        /* 0051 의 한도와 같은 값 */

  var WORD = {
    photo:{ name:"시설 사진", who:"손님 누구나 봅니다",
            accept:"image/jpeg,image/png,image/webp",
            help:"매장 · 타석 · 시설을 찍어 올려 주세요. 업체 카드와 " +
                 "업체 화면에 그대로 나갑니다." },
    doc:{ name:"증빙서류", who:"운영자와 이 업체만 봅니다",
          accept:"application/pdf",
          help:"사업자등록증 · 자격증처럼 확인에 필요한 것을 올려 주세요. " +
               "손님 화면에는 한 번도 나오지 않습니다." }
  };

  function size(n){
    return (n >= 1048576) ? (Math.round(n / 104857.6) / 10) + "MB"
                          : Math.max(1, Math.round(n / 1024)) + "KB";
  }
  function why(err){
    var w = String((err && err.message) || "");
    try{ w = JSON.parse(w).message || w; }catch(_){}
    return w || "하지 못했습니다.";
  }
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

  function rowsOf(all, kind){
    return (all || []).filter(function(x){ return x.kind === kind; });
  }

  function group(kind, rows){
    if(!ST[kind]) return "";             /* ⚠️ 버킷이 없으면 줄째 빠집니다 */
    var W = WORD[kind], mine = rowsOf(rows, kind);
    return '<section class="pvph-g" data-kind="' + esc(kind) + '">' +
      /* ⚠️ **있는 이름만** 씁니다 — 없는 이름은 조용히 빈 칸이 됩니다
         (`check-safe` ⑨ 가 글자로 적은 자리를 전부 셉니다). */
      '<h3 class="pvph-h">' + icon(kind === "photo" ? "camera" : "shield", 17) +
        esc(W.name) +
        '<span class="pvph-w">' + esc(W.who) + '</span></h3>' +
      '<p class="pvph-help">' + esc(W.help) + '</p>' +
      (mine.length
        ? '<ul class="pvph-l">' + mine.map(function(x){
            return '<li>' +
              '<button type="button" class="btn btn-sm btn-line pvph-open" ' +
                'data-pp="' + esc(x.id) + '">' +
                esc((x.caption ? x.caption + " · " : "") + size(x.bytes)) +
              '</button>' +
              '<button type="button" class="btn btn-sm btn-line pvph-x" ' +
                'data-ppx="' + esc(x.id) + '" data-what="' +
                esc(W.name + " · " + size(x.bytes)) + '">빼기</button>' +
            '</li>';
          }).join("") + '</ul>'
        /* ⚠️ 0건이면 **0건이라고 말합니다** (빈 액자를 두지 않습니다) */
        : '<p class="pvph-z">아직 올리신 것이 없습니다.</p>') +
      (mine.length >= MAXN[kind]
        ? '<p class="pvph-z">' + esc(String(MAXN[kind])) +
          '장까지입니다. 먼저 빼 주세요.</p>'
        /* ⚠️ 머리말은 갈라 두었는데(사진 camera · 서류 shield) **단추만
           안 갈라서** 증빙서류(PDF) 고르는 자리에도 카메라가 붙어
           있었습니다 (찍어 보고 알았습니다). */
        : '<label class="pvph-b" for="pvph-f-' + esc(kind) + '">' +
            icon(kind === "photo" ? "camera" : "shield", 18) +
            '<span>' + esc(W.name) + ' 고르기</span></label>' +
          '<input type="file" class="pvph-i" id="pvph-f-' + esc(kind) + '" ' +
            'multiple accept="' + esc(W.accept) + '">') +
      '<ul class="pvph-up" id="pvph-up-' + esc(kind) + '"></ul>' +
    '</section>';
  }

  function paint(rows){
    /* ⚠️⚠️ **버킷이 둘 다 없으면 아무것도 안 그립니다** — 올릴 수
       없는 칸을 그리면 눌러도 아무 일이 안 나는 자리가 됩니다. */
    if(!ST.photo && !ST.doc){ box.hidden = true; box.innerHTML = ""; return; }
    box.className = "deskbox";
    box.hidden = false;
    box.innerHTML = '<h2 class="adm-h">사진 · 증빙서류</h2>' +
      /* ⚠️⚠️ 둘이 **누구에게 보이는지**를 맨 위에서 한 번 더 가릅니다 */
      '<p class="myhint">⚠️ <b>시설 사진은 손님 누구나 봅니다.</b> ' +
      '증빙서류는 <b>운영자와 이 업체만</b> 봅니다 — 서류를 사진 칸에 ' +
      '올리지 마세요.</p>' +
      group("photo", rows) + group("doc", rows) +
      /* ⚠️ 지어낸 약속을 하지 않습니다 — 올린다고 바로 보이지 않습니다 */
      '<p class="myhint">⚠️ 올리신 시설 사진은 <b>저희가 자료를 다시 올린 ' +
      '뒤에</b> 손님 화면에 보입니다.</p>' +
      '<p class="pvph-m lmsg" hidden></p>';
  }
  function say(t){
    var m = box.querySelector(".pvph-m");
    if(m){ m.hidden = false; m.textContent = t; }
  }

  function load(){
    /* ⚠️ 목록은 **RLS 가 좁혀 줍니다** (0051) — 그 업체와 운영자만
       봅니다. 화면이 또 거르지 않습니다 (두 곳에 적으면 어긋납니다). */
    return get("provider_photo?select=id,kind,mime,bytes,caption,created_at" +
               "&order=created_at.asc&limit=50")
      .then(function(rows){ paint(rows || []); return rows; });
  }

  /* ── 고르신 파일을 올립니다 — ⚠️ 하나씩 차례로 ──────────────── */
  function send(inp, kind){
    var list = document.getElementById("pvph-up-" + kind);
    var files = [].slice.call(inp.files || []);
    inp.value = "";                      /* 같은 파일을 다시 고를 수 있게 */
    if(!list || !files.length) return;

    var chain = Promise.resolve();
    files.forEach(function(f){
      chain = chain.then(function(){
        var li = document.createElement("li");
        /* ⚠️ 파일 이름은 **업체가 쓴 글자**입니다 — esc() 를 거칩니다.
           ⚠️ 서버에는 **안 보냅니다** (이름에 상호 · 성함이 흔합니다). */
        li.innerHTML = '<span class="pvph-n">' + esc(f.name) + '</span>' +
          '<i class="pvph-s">' + esc(size(f.size)) + '</i>' +
          '<b class="pvph-st">올리는 중…</b>';
        list.appendChild(li);
        function nope(s2){
          li.className = "is-bad";
          li.querySelector(".pvph-st").textContent = s2;
        }
        if(MIME[kind].indexOf(f.type) < 0){
          nope(kind === "photo" ? "사진은 JPG · PNG · WEBP 만 됩니다"
                                : "서류는 PDF 만 됩니다");
          return;
        }
        if(f.size > MAX){ nope("8MB 를 넘습니다"); return; }

        return fetch("/api/upload", {
          method:"POST",
          headers: Object.assign({ "content-type":"application/json" },
                                 window.amAuthHeaders()),
          /* ⚠️⚠️ `pv:true` 로 **업체 쪽 길**임을 말합니다. 버킷은
             서버가 DB 가 돌려준 **경로**로 고릅니다 — 여기서 보낸
             kind 로 고르면 거기가 구멍입니다. */
          body: JSON.stringify({ pv:true, kind:kind, mime:f.type, bytes:f.size })
        }).then(function(r){
          return r.json().then(function(j){ return { ok:r.ok, j:j }; });
        }).then(function(x){
          if(!x.ok || !x.j || !x.j.url)
            throw new Error((x.j && x.j.error) || "지금 올리지 못했습니다");
          /* ⚠️⚠️ **여기서 "올렸습니다" 라고 하지 않습니다** — 자리를
             받은 것이고 파일은 아직 안 갔습니다. */
          return fetch(x.j.url, { method:"PUT",
            headers:{ "content-type":f.type }, body:f });
        }).then(function(r){
          if(!r || !r.ok) throw new Error("올리지 못했습니다");
          li.className = "is-ok";
          li.querySelector(".pvph-st").textContent = "올렸습니다";
        }).catch(function(e){
          nope(why(e));
        });
      });
    });
    chain.then(function(){ return load(); });
  }

  box.addEventListener("change", function(e){
    var inp = e.target;
    if(!inp || !inp.classList || !inp.classList.contains("pvph-i")) return;
    var g = inp.closest(".pvph-g");
    if(g) send(inp, g.getAttribute("data-kind"));
  });

  box.addEventListener("click", function(e){
    /* 보기 — ⚠️ 누르셨을 때 주소를 청합니다 (서류는 10분짜리입니다) */
    var op = e.target.closest ? e.target.closest("button[data-pp]") : null;
    if(op){
      op.disabled = true; say("여는 중입니다…");
      fetch("/api/upload?pp=" + encodeURIComponent(op.getAttribute("data-pp")), {
        headers: Object.assign({ accept:"application/json" }, window.amAuthHeaders())
      }).then(function(r){
        return r.json().then(function(j){
          if(!r.ok || !j || !j.url)
            throw new Error((j && j.error) || "지금 불러오지 못했습니다");
          op.disabled = false; say("");
          window.open(j.url, "_blank", "noopener");
        });
      }).catch(function(err){ op.disabled = false; say(why(err)); });
      return;
    }
    /* 빼기 — ⚠️⚠️ 되돌릴 수 없는 일이라 한 번 여쭙습니다 */
    var dx = e.target.closest ? e.target.closest("button[data-ppx]") : null;
    if(dx){
      if(!window.confirm("이 파일을 뺄까요? — " + dx.getAttribute("data-what") +
                         "\n빼시면 되돌릴 수 없습니다.")) return;
      dx.disabled = true; say("빼는 중입니다…");
      rpc("drop_provider_photo", { p: { id: dx.getAttribute("data-ppx") } })
        .then(load)
        .catch(function(err){ dx.disabled = false; say(why(err)); });
      return;
    }
  });

  window.amAuthAsk().then(function(a){
    A = a;
    /* ⚠️ 업체 담당자가 아니면 **한 줄도** 안 그립니다 — 왜 안 되는지도
       적지 않습니다 (권한 구조를 알려 주는 글이 됩니다). */
    if(!a || !a.on || !a.signedIn || a.role !== "provider") return;
    /* ⚠️⚠️ **갈래마다 따로** 묻습니다 — 공개 버킷만 없으면 시설 사진
       칸만 빠지고 서류 칸은 그대로 돕니다. */
    return fetch("/api/upload", { headers:{ accept:"application/json" } })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){
        ST.photo = !!(d && d.pvPhoto);
        ST.doc   = !!(d && d.pvDoc);
        if(!ST.photo && !ST.doc){
          /* ⚠️ 운영자에게만 말합니다 (절대 규칙 3) */
          try{ console.warn("[deskphoto] PROVIDER_BUCKET · INTAKE_BUCKET 이 " +
            "없어 업체 사진 칸을 열지 않았습니다."); }catch(_){}
          return;
        }
        return load();
      });
  }).catch(function(){});
})();

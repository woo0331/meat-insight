/* ════════════════════════════════════════════════════════════════════
   매물 사진 상자 — ⚠️⚠️ **두 화면이 같은 함수를 부릅니다** (0068)

   ⚠️⚠️⚠️ **왜 따로 떼어 두었나.** 사진을 붙이는 자리가 둘입니다 —
   올리신 **직후**(`/cat/used`)와 **나중에**(`/my`). 올린 직후에만 붙일 수
   있게 두면 그 화면을 닫은 분의 매물은 **영원히 사진이 없습니다**
   (막다른 길 · 절대 규칙 2). 그런데 두 화면에 따로 적으면 한쪽만 고치는
   날 둘이 다른 말을 하고, **그려진 화면만 보는 검사는 영원히 통과**합니다
   (업체 카드 · 0곳 안내에서 두 번 겪은 자리입니다).

   ⚠️⚠️ **id 를 한 글자도 안 씁니다** — `/my` 는 매물 여러 개를 한 화면에
   내므로 id 를 달면 **같은 id 가 여러 개**가 됩니다 (조인의 동의 상자에서
   겪은 자리). 집는 것은 전부 **그 상자 안쪽의 클래스**입니다.

   ⚠️⚠️ **버킷이 꺼져 있으면 한 줄도 안 그립니다** — 그리면 눌러도 아무
   일이 안 나는 칸이 됩니다 (절대 규칙 5). 켜졌는지는 **서버만** 압니다
   (`/api/upload` 의 `lstPhoto`) — 공개 버킷 이름은 비밀이 아니지만
   화면이 그 값을 혼자 판단하면 서버와 어긋납니다.

   ⚠️⚠️ **경로는 문이 짓고 버킷은 서버가 고릅니다** — 화면은 고르지
   않습니다 (`lst/<매물>/photo/…` · `bucketForPath()`). 화면이 고르게 두면
   거기가 구멍입니다 (0051 에서 세운 규칙).

   ⚠️ **"올렸습니다" 를 자리를 받은 자리에서 말하지 않습니다** — 자리를
   받은 것이고 파일은 아직 안 갔습니다 (0051 에 적어 둔 그 자리).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var W = window;
  var esc = W.esc || function(x){ return String(x == null ? "" : x); };

  /* ⚠️ 한 번만 묻습니다 — 화면마다 묻게 두면 매물 스무 개에 호출 스무 번 */
  var ASK = null, ON = false;
  function ready(){
    if(ASK) return ASK;
    ASK = fetch("/api/upload", { headers:{ accept:"application/json" } })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ ON = !!(j && j.lstPhoto); return ON; })
      .catch(function(){ ON = false; return false; });
    return ASK;
  }

  /* ⚠️ **담기는 크기** — DB 가 다시 봅니다 (화면에서만 막으면 꾸러미를
     고쳐 지나갑니다). 다시 그린 뒤의 크기를 이 값과 견줍니다. */
  var MAX = 8388608;                 /* ⚠️ 0069 의 값과 같아야 합니다 */
  var MANY = 10;                     /* ⚠️ **0069** 의 값과 같아야 합니다 */
  /* ⚠️⚠️ **고르실 수 있는 크기 — 담기는 크기와 다릅니다.** 폰 사진은
     한 장이 6~12MB 인데 다시 그리면 1MB 아래로 떨어집니다. 원본을 8MB
     로 막으면 요즘 폰으로 찍은 사진을 **아예 못 올리십니다**(절대 규칙 2).
     이 수는 "읽어 볼 수 있는 크기" 일 뿐이고 DB 와 맞출 값이 아닙니다 —
     수백 MB 짜리를 canvas 에 그리려다 그 탭이 죽는 것을 막습니다.
     ⚠️ 종류를 여기서 안 셉니다 — `js/imgprep.js` 가 **첫 바이트**로
     봅니다(적어 보낸 `file.type` 은 확장자만 보고 쓰는 값입니다). */
  var PICK = 33554432;

  /* 상자 — ⚠️ 버킷이 꺼졌으면 **빈 글자**입니다 */
  function box(){
    if(!ON) return "";
    return '<div class="lsp">' +
      '<p class="lsp-h">사진</p>' +
      '<ul class="lsp-l"></ul>' +
      '<div class="lsp-r">' +
        /* ⚠️⚠️ `multiple` — 시안도 · 알아본 다섯 곳도 전부 여러 장을
           한 번에 고릅니다. 한 장씩만 되면 열 장을 올리는 데 열 번을
           누르셔야 합니다.
           ⚠️ `accept="image/*"` 라야 폰에서 **카메라 · 갤러리**가 같이
           나옵니다 (종류를 좁혀 적으면 기기마다 카메라가 안 뜹니다) —
           진짜 사진인지는 `js/imgprep.js` 가 첫 바이트로 봅니다. */
        '<input type="file" class="lsp-i" multiple ' +
          'accept="image/*" aria-label="올리실 사진 (여러 장을 고르셔도 됩니다)">' +
        '<button type="button" class="btn btn-sm btn-pt lsp-go">이 사진 올리기</button>' +
      '</div>' +
      /* ⚠️⚠️ **위치정보를 뗀다는 것을 그 자리에서** 말합니다 — 손님이
         올린 사진이 어떻게 다루어지는지는 그 자리에서 알려 드려야 합니다.
         ⚠️ 그리고 **못 막는 것을 막는다고 적지 않습니다** — 떼는 것은
         EXIF 뿐이고, 사진에 **찍혀 있는** 집 · 차 번호는 우리가 못 봅니다.
         ⚠️ 글은 `js/imgprep.js` 의 `amImgPrepNote()` **한 곳**입니다
         (세 화면이 같은 말을 해야 합니다). */
      '<p class="jhint">열 장까지 · 한 장에 32MB 까지 · JPG · PNG · WEBP · ' +
      esc(window.amImgPrepNote ? window.amImgPrepNote() : "") + ' ' +
      /* ⚠️ 0069 부터 **차례를 바꿀 수 있습니다** — 그래서 "첫 장" 이
         아니라 **대표**라고 적습니다(바꿀 수 있는 것을 못 바꾸는 것처럼
         적으면 그 단추를 아무도 안 누릅니다). */
      '<b>대표 사진</b>이 목록 카드에 보입니다.</p>' +
      '<p class="jmsg lsp-m" hidden></p>' +
    '</div>';
  }

  /* ⚠️⚠️⚠️ **보내는 자리는 여기 한 곳입니다.** 올리는 길이 둘이 되었습니다 —
     양식에서 **미리 고른** 사진(아래 `pickBind`)과 올린 **뒤에** 붙이는
     사진(`bind`). 두 벌로 적으면 한쪽만 고치는 날 둘이 다른 꾸러미를
     보내고, 그려진 화면만 보는 검사는 영원히 통과합니다.
     ⚠️ 받는 `x` 는 **이미 다시 그린 것**입니다(`amImgPrep` 이 돌려준 값) —
     원본을 받는 가지를 하나라도 두면 거기로 EXIF 가 샙니다.
     ⚠️ 버킷은 서버가 DB 가 돌려준 **경로**로 고릅니다 — 화면이 고르면
     거기가 구멍입니다(0051 에서 세운 규칙). */
  function sendPrepped(id, x){
    /* ⚠️ 줄인 뒤의 크기를 봅니다 — DB 도 **다시** 봅니다
       (화면에서만 막으면 꾸러미를 고쳐 지나갑니다). */
    if(x.bytes > MAX) return Promise.reject(new Error("줄여도 8MB 를 넘습니다."));
    return fetch("/api/upload", {
      method:"POST",
      headers: Object.assign({ "content-type":"application/json" },
                             W.amAuthHeaders ? W.amAuthHeaders() : {}),
      /* ⚠️⚠️ lst:true 로 **매물 쪽 길**임을 말합니다. */
      body: JSON.stringify({ lst:true, listing:id, mime:x.mime, bytes:x.bytes })
    }).then(function(r){
      return r.json().then(function(j){ return { ok:r.ok, j:j }; });
    }).then(function(y){
      if(!y.ok || !y.j || !y.j.url)
        throw new Error((y.j && y.j.error) || "지금 올리지 못했습니다");
      return fetch(y.j.url, { method:"PUT",
        headers:{ "content-type":x.mime }, body:x.blob });
    }).then(function(r){
      if(!r || !r.ok) throw new Error("올리지 못했습니다");
    });
  }

  /* 파일 한 장을 **다시 그려서** 보냅니다 (올린 뒤에 붙이는 길) */
  function sendOne(id, f){
    if(!W.amImgPrep)
      return Promise.reject(new Error("사진을 준비하지 못했습니다."));
    return W.amImgPrep(f).then(function(x){ return sendPrepped(id, x); });
  }

  /* ════════════════════════════════════════════════════════════════
     양식에서 **미리 고르는** 사진 (2026-11-10)

     ⚠️⚠️⚠️ **2026-11-09 까지 사진을 붙이는 길이 "올린 뒤" 하나뿐이었습니다.**
     글을 다 적고 「매물 올리기」를 누르고 **나서야** 사진 칸이 나왔습니다.
     사장님이 주신 시안도 · 알아본 다섯 곳도 전부 **사진이 글보다 위**에
     있고 한 번에 올립니다. 올린 뒤에만 붙게 두면 그 화면을 닫으신 분의
     매물은 사진이 0장인 채로 남고(아이콘 타일), 중고채는 사진 없는 카드로
     아무도 안 삽니다.

     ⚠️⚠️ **그래도 순서는 "매물 먼저 · 사진 나중" 입니다** — 사진 경로를
     문이 지으려면 매물 id 가 있어야 합니다(lst/<매물>/photo/…). 그래서
     여기서 고른 것은 **브라우저에만** 들고 있다가 `open_listing` 이
     성공한 뒤에 보냅니다. 그 사이에 사진이 실패하면 **매물은 이미
     올라가 있습니다** — 화면이 그 사실을 그대로 적어야 합니다
     (몇 장이 올라갔는지 · 아래에서 다시 올릴 수 있다는 것).

     ⚠️⚠️ **고르실 때 바로 다시 그립니다**(`amImgPrep`) — 그래야
     ① 사진이 아닌 파일을 그 자리에서 거절하고
     ② 미리 보시는 그림이 **실제로 올라갈 그림**과 같습니다
     (원본을 미리 보여 주면 "올리니까 달라졌다" 가 됩니다).
     ⚠️ 미리 보기 주소는 `URL.createObjectURL` 이라 **반드시 거둡니다**
     (빼실 때 · 다 올린 뒤) — 안 거두면 그 탭이 사진을 계속 들고 있습니다.
     ════════════════════════════════════════════════════════════════ */

  var SEQ = 1;                       /* 고른 사진을 집는 열쇠 (id 가 아닙니다) */

  /* 양식 안에 들어가는 상자 — ⚠️ 버킷이 꺼졌으면 **빈 글자**입니다 */
  function pickBox(){
    if(!ON) return "";
    return '<div class="lspk">' +
      '<p class="lspk-h">사진</p>' +
      '<ul class="lspk-l">' +
        /* ⚠️ 고르는 칸은 **늘 첫째**입니다 — 시안의 그 자리이고, 사진이
           늘어나도 누를 자리가 움직이지 않습니다.
           ⚠️⚠️ `<input type="file">` 을 숨기지 않고 **타일 전체에 깔아**
           둡니다. 따로 단추를 만들어 `click()` 으로 부르면 자바스크립트가
           꺼진 분에게는 눌러도 아무 일이 안 나는 칸입니다(절대 규칙 5). */
        '<li class="lspk-add">' +
          '<input type="file" class="lspk-i" multiple accept="image/*" ' +
            'aria-label="올리실 사진 (여러 장을 고르셔도 됩니다)">' +
          '<span class="lspk-ic" aria-hidden="true">' +
            (W.icon ? W.icon("camera", 26) : "") + '</span>' +
          '<span class="lspk-n">0/' + MANY + '</span>' +
        '</li>' +
      '</ul>' +
      /* ⚠️ 글은 `js/imgprep.js` 의 `amImgPrepNote()` **한 곳**입니다 */
      '<p class="jhint">열 장까지 · 한 장에 32MB 까지 · JPG · PNG · WEBP · ' +
      esc(W.amImgPrepNote ? W.amImgPrepNote() : "") + ' ' +
      '<b>대표 사진</b>이 목록 카드에 보입니다.</p>' +
      '<p class="jmsg lspk-m" hidden></p>' +
    '</div>';
  }

  /* 고르기 · 빼기를 답니다 — 돌려주는 것으로 양식이 고른 것을 읽습니다 */
  function pickBind(el){
    var none = { items: function(){ return []; }, clear: function(){} };
    if(!el || !ON) return none;
    var inp = el.querySelector(".lspk-i");
    var ul  = el.querySelector(".lspk-l");
    var msg = el.querySelector(".lspk-m");
    var add = el.querySelector(".lspk-add");
    if(!inp || !ul) return none;
    var list = [];
    function say(t){ if(msg){ msg.hidden = !t; msg.textContent = t || ""; } }

    /* ⚠️⚠️ 그리는 것을 **DOM 으로** 짓습니다(innerHTML 이 아닙니다) —
       미리 보기 주소 · 장수는 변수이고, 글자로 이어 붙이면 `check-safe`
       가 "esc() 없이 변수를 넣었다" 로 잡습니다. 그 검사가 맞습니다. */
    function paint(){
      var old = ul.querySelectorAll(".lspk-t");
      for(var i = 0; i < old.length; i++) old[i].parentNode.removeChild(old[i]);
      list.forEach(function(it, at){
        var li = document.createElement("li");
        li.className = "lspk-t" + (at === 0 ? " lspk-1st" : "");
        var im = document.createElement("img");
        im.src = it.url;
        im.alt = "고르신 사진 " + (at + 1) + "장째";
        li.appendChild(im);
        /* ⚠️ **대표는 첫째**입니다 — 따로 "대표로" 단추를 두면 차례와
           대표가 두 값이 되고 카드와 상세가 다른 사진을 냅니다(0069).
           차례는 올린 뒤에 바꾸실 수 있습니다(`lsp-up` · `lsp-dn`). */
        if(at === 0){
          var b = document.createElement("span");
          b.className = "lspk-b"; b.textContent = "대표";
          li.appendChild(b);
        }
        var x = document.createElement("button");
        x.type = "button";
        x.className = "btn btn-sm btn-bad lspk-x";
        /* ⚠️ 차례가 바뀌므로 **번호가 아니라 제 열쇠**로 집습니다 */
        x.setAttribute("data-k", it.key);
        x.textContent = "빼기";
        li.appendChild(x);
        ul.appendChild(li);
      });
      var n = el.querySelector(".lspk-n");
      if(n) n.textContent = list.length + "/" + MANY;
      /* ⚠️ 열 장이 차면 고르는 칸을 **줄째** 가립니다(눌러도 거절되는
         칸을 남기지 않습니다). `[hidden]` 에 `display:none` 을 CSS 에
         같이 적어 두었습니다 — flex 칸은 속성만으로 안 가려집니다. */
      if(add) add.hidden = list.length >= MANY;
    }

    ul.addEventListener("click", function(e){
      var t = e.target;
      if(!t || !t.closest) return;
      var x = t.closest(".lspk-x");
      if(!x) return;
      var k = x.getAttribute("data-k");
      for(var i = 0; i < list.length; i++) if(list[i].key === k){
        try{ URL.revokeObjectURL(list[i].url); }catch(_){}
        list.splice(i, 1);
        break;
      }
      say(""); paint();
    });

    inp.addEventListener("change", function(){
      var fs = inp.files ? Array.prototype.slice.call(inp.files) : [];
      /* ⚠️ 같은 사진을 다시 고르실 수 있게 **그 자리에서 비웁니다** */
      inp.value = "";
      if(!fs.length) return;
      if(!W.amImgPrep){ say("사진을 준비하지 못했습니다."); return; }
      var room = MANY - list.length;
      /* ⚠️⚠️ **몇 장이 남았는지 먼저 셉니다** — 다 읽고 나서 마지막 몇
         장만 거절되면 "들어간 줄 알았다" 가 됩니다. */
      if(room <= 0){ say("사진은 " + MANY + "장까지입니다. 먼저 빼 주세요."); return; }
      if(fs.length > room){
        say("지금 " + room + "장까지 더 고르실 수 있습니다. " +
            "고르신 것은 " + fs.length + "장입니다.");
        return;
      }
      /* ⚠️ **고르실 수 있는 크기(32MB)와 담기는 크기(8MB)는 다릅니다** —
         폰 사진은 한 장이 6~12MB 인데 다시 그리면 1MB 아래로 떨어집니다.
         이 수는 수백 MB 짜리를 canvas 에 그리려다 그 탭이 죽는 것을
         막는 값이고 DB 와 맞출 값이 아닙니다(절대 규칙 2). */
      for(var i = 0; i < fs.length; i++) if(fs[i].size > PICK){
        say("한 장이 너무 큽니다 — 32MB 까지 고르실 수 있습니다."); return;
      }
      say("사진을 읽는 중입니다…");
      /* ⚠️⚠️ **한 장씩 차례로** 읽습니다 — 열 장을 한꺼번에 canvas 에
         올리면 느린 기기에서 그 탭이 멈춥니다.
         ⚠️ 한 장이 사진이 아니어도 **나머지는 그대로 갑니다** — 한 장
         때문에 전부 버리면 다시 열 장을 고르셔야 합니다. */
      var bad = 0, says = [];
      fs.reduce(function(chain, f){
        return chain.then(function(){
          return W.amImgPrep(f).then(function(x){
            if(x.bytes > MAX) throw new Error("줄여도 8MB 를 넘습니다.");
            list.push({ key: String(SEQ++), mime: x.mime, bytes: x.bytes,
                        blob: x.blob, url: URL.createObjectURL(x.blob) });
          }).catch(function(err){
            bad += 1;
            var m = String((err && err.message) || "읽지 못했습니다.");
            if(says.indexOf(m) < 0) says.push(m);
          });
        });
      }, Promise.resolve()).then(function(){
        paint();
        /* ⚠️ 몇 장이 **안 들어갔는지** 말합니다 — 조용히 빼면 올리신
           뒤에야 모자란 것을 아십니다. */
        say(bad ? (bad + "장은 쓸 수 없습니다 — " + says.join(" · ")) : "");
      });
    });

    paint();
    return {
      items: function(){ return list.slice(); },
      clear: function(){
        for(var i = 0; i < list.length; i++)
          try{ URL.revokeObjectURL(list[i].url); }catch(_){}
        list = [];
        paint();
      }
    };
  }

  /* 미리 고른 사진을 **매물이 생긴 뒤에** 보냅니다.
     ⚠️⚠️⚠️ **여기서는 거절하지 않습니다**(reject 하지 않습니다) — 이
     자리에 올 때는 매물이 **이미 올라가 있습니다.** 실패를 그대로
     던지면 부르는 쪽이 "매물을 올리지 못했습니다" 를 적게 되고, 그건
     거짓말입니다. 몇 장이 올라갔는지를 **세어서** 돌려줍니다. */
  function sendPicked(id, items, onStep){
    var done = 0, total = items.length;
    return items.reduce(function(chain, it){
      return chain.then(function(){
        if(onStep) onStep(done + 1, total);
        return sendPrepped(id, it);
      }).then(function(){ done += 1; });
    }, Promise.resolve()).then(function(){
      return { done: done, total: total, error: "" };
    }).catch(function(e){
      return { done: done, total: total,
               error: String((e && e.message) || "올리지 못했습니다.") };
    });
  }

  /* 붙어 있는 사진을 그립니다 — ⚠️ 주소는 **서버가 짓습니다** */
  function draw(el, id){
    var ul = el.querySelector(".lsp-l");
    var hd = el.querySelector(".lsp-h");
    if(!ul) return Promise.resolve();
    return fetch("/api/upload?lstq=" + encodeURIComponent(id),
                 { headers:{ accept:"application/json" } })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        var L = (j && j.photos) || [];
        /* ⚠️ 0장이면 "0장" 이라고 **적지 않습니다** — 그 줄을 빼고
           올리는 칸만 냅니다 (절대 규칙 2). */
        if(hd) hd.textContent = L.length ? ("사진 " + L.length + "장") : "사진";
        /* ⚠️⚠️⚠️ **차례를 바꾸는 단추를 답니다** (0069) — 보내는 것은
           **늘어놓은 차례 통째로**이고(`order_listing_photo`), 한 장씩
           "위로" 보내면 중간에 다른 창에서 한 장이 빠졌을 때 번호가
           어긋납니다. 그래서 화면이 지금 줄 차례를 세어 보냅니다.
           ⚠️ **대표는 첫째**입니다 — 따로 "대표로" 단추를 두면 ord 와
           대표가 두 값이 되고, 둘이 어긋나는 날 카드와 상세가 다른
           사진을 냅니다. 「맨 앞으로」가 곧 「대표로」입니다.
           ⚠️⚠️ **id 를 한 글자도 안 씁니다** — `/my` 는 매물 여럿을 한
           화면에 내므로 id 를 달면 같은 id 가 여러 개가 됩니다. */
        ul.innerHTML = L.map(function(f, i){
          var first = i === 0, last = i === L.length - 1;
          return '<li class="lsp-t' + (first ? " lsp-1st" : "") +
            '" data-fid="' + esc(f.id) + '">' +
            '<img src="' + esc(f.url) + '" alt="' + esc(f.caption || "올리신 사진") +
              '" loading="lazy" decoding="async">' +
            (first ? '<span class="lsp-b">대표</span>' : "") +
            '<span class="lsp-mv">' +
              /* ⚠️ 맨 앞 · 맨 뒤에서는 그 단추를 **안 냅니다** — 그리면
                 눌러도 아무 일이 안 나는 칸입니다 (절대 규칙 5). */
              (first ? "" : '<button type="button" class="lsp-up" ' +
                'title="앞으로"><span class="sr-only">앞으로 옮기기</span>' +
                window.icon("arrow", 14) + '</button>') +
              (last ? "" : '<button type="button" class="lsp-dn" ' +
                'title="뒤로"><span class="sr-only">뒤로 옮기기</span>' +
                window.icon("arrow", 14) + '</button>') +
            '</span>' +
            '<button type="button" class="btn btn-sm btn-bad lsp-x">빼기</button>' +
          '</li>';
        }).join("");
      })
      .catch(function(){ /* ⚠️ 못 읽었으면 그대로 둡니다 — 0장이라고 적지 않습니다 */ });
  }

  /* ⚠️⚠️ 올리기 · 빼기를 답니다. `after` 는 목록을 다시 그리는 자리입니다
     (사진이 바뀌면 카드의 첫 장도 바뀝니다 — 안 부르면 올려도 카드가
     그대로여서 "안 올라갔다" 로 보입니다). */
  function bind(el, id, conf, after){
    if(!el || !ON) return;
    var msg = el.querySelector(".lsp-m");
    function say(t){ if(msg){ msg.hidden = false; msg.textContent = t; } }

    var go = el.querySelector(".lsp-go");
    var inp = el.querySelector(".lsp-i");
    /* ⚠️⚠️⚠️ **올리기 전에 `js/imgprep.js` 를 지나갑니다** — 거기서
       ① 첫 바이트로 **진짜 사진인지** 보고(브라우저가 적는 `file.type` 은
       확장자만 보고 쓰는 값이라 이름만 바꾼 파일이 통과합니다)
       ② canvas 에 다시 그려 **위치정보(EXIF)를 통째로** 떼고
       ③ 긴 변을 줄여 다시 압축합니다.
       ⚠️ 파일이 우리 서버를 **안 지나가므로**(서명된 주소로 브라우저가
       바로 올립니다) 떼는 자리는 여기뿐입니다. 못 떼면 **안 올립니다** —
       원본을 그냥 올리면 그 한 장만 조용히 집 좌표를 달고 공개 버킷에
       들어갑니다.
       ⚠️⚠️ 그래서 보내는 `mime` · `bytes` 는 **다시 그린 것**의 값입니다
       (원본 값을 보내면 DB 가 받은 종류 · 크기와 실제가 달라집니다). */
    /* ⚠️⚠️ 보내는 자리는 **위의 `sendOne` 한 곳**입니다 — 2026-11-10
       까지 그 코드가 이 안에 있었고, 양식에서 미리 고르는 길이 생기면서
       두 벌이 될 참이었습니다(한쪽만 고치는 날 둘이 다른 꾸러미를
       보내고, 그려진 화면만 보는 검사는 영원히 통과합니다). */

    if(go && inp) go.addEventListener("click", function(){
      var fs = inp.files ? Array.prototype.slice.call(inp.files) : [];
      if(!fs.length){ say("올리실 사진을 골라 주세요."); return; }
      var n = el.querySelectorAll(".lsp-t").length;
      /* ⚠️⚠️ **몇 장이 남았는지 먼저 셉니다** — 다 올리고 나서 마지막
         몇 장만 거절되면 "올라간 줄 알았다" 가 됩니다. 넘치면 그 자리에서
         몇 장까지 되는지 말합니다. */
      if(n >= MANY){ say("사진은 열 장까지입니다. 먼저 빼 주세요."); return; }
      if(fs.length > MANY - n){
        say("지금 " + (MANY - n) + "장까지 더 올리실 수 있습니다. " +
            "고르신 것은 " + fs.length + "장입니다.");
        return;
      }
      /* ⚠️ 고른 파일이 너무 크면 **풀기 전에** 막습니다 — 수백 MB 짜리를
         canvas 에 그리려다 그 탭이 죽습니다. 이 수는 "읽어 볼 수 있는
         크기" 이고 **담기는 크기(MAX)와 다릅니다.** */
      for(var i = 0; i < fs.length; i++) if(fs[i].size > PICK){
        say("한 장이 너무 큽니다 — 32MB 까지 고르실 수 있습니다."); return;
      }
      go.disabled = true;
      /* ⚠️⚠️ **한 장씩 차례로** 보냅니다 — 한꺼번에 보내면 열 장이 동시에
         올라가 느린 망에서 전부 실패하고, 몇 장이 올라갔는지도 알 수
         없습니다. 그리고 **몇 장째인지** 말합니다. */
      var done = 0;
      fs.reduce(function(chain, f){
        return chain.then(function(){
          say(fs.length > 1
            ? ("올리는 중입니다… " + (done + 1) + " / " + fs.length)
            : "올리는 중입니다…");
          return sendOne(id, f).then(function(){ done += 1; });
        });
      }, Promise.resolve()).then(function(){
        go.disabled = false;
        inp.value = "";
        if(msg) msg.hidden = true;
        return draw(el, id).then(function(){ if(after) after(); });
      }).catch(function(e){
        go.disabled = false;
        inp.value = "";
        /* ⚠️ **몇 장이 올라갔는지 말합니다** — 가운데서 실패하면 앞의
           것은 이미 올라가 있습니다. "실패" 만 적으면 다시 전부 고르셔서
           같은 사진이 두 벌이 됩니다. */
        say(String((e && e.message) || "올리지 못했습니다.") +
            (done ? (" (" + done + "장은 올라갔습니다)") : ""));
        return draw(el, id).then(function(){ if(after) after(); });
      });
    });

    /* ⚠️⚠️ **차례를 바꿉니다** (0069) — 보내는 것은 **늘어놓은 차례
       통째로**이고(`order_listing_photo`), 화면이 지금 줄 차례를 세어
       만듭니다. 한 장씩 "위로" 보내면 중간에 다른 창에서 한 장이
       빠졌을 때 번호가 어긋납니다.
       ⚠️ 문이 **그 매물의 사진이 빠짐없이** 와야 받습니다 — 그래서 화면에
       그려진 전부를 보냅니다(일부만 보내면 안 보낸 것이 조용히 0 이 되어
       그것이 대표가 됩니다). */
    el.addEventListener("click", function(e){
      var t0 = e.target;
      if(!t0 || !t0.closest) return;
      var mv = t0.closest(".lsp-up") || t0.closest(".lsp-dn");
      if(mv){
        var li0 = mv.closest(".lsp-t");
        var ul0 = el.querySelector(".lsp-l");
        if(!li0 || !ul0) return;
        var all = Array.prototype.slice.call(ul0.querySelectorAll(".lsp-t"));
        var at = all.indexOf(li0);
        var to = t0.closest(".lsp-up") ? at - 1 : at + 1;
        if(at < 0 || to < 0 || to >= all.length) return;
        var ids = all.map(function(x2){ return x2.getAttribute("data-fid"); });
        var one = ids.splice(at, 1)[0];
        ids.splice(to, 0, one);
        mv.disabled = true;
        fetch(conf.url + "/rest/v1/rpc/order_listing_photo", {
          method:"POST",
          headers: Object.assign({ "content-type":"application/json",
                                   apikey: conf.anonKey },
                                 W.amAuthHeaders ? W.amAuthHeaders() : {}),
          body: JSON.stringify({ p: { listing: id, ids: ids } })
        }).then(function(r){
          return r.text().then(function(t2){
            if(!r.ok){ var m = t2; try{ m = JSON.parse(t2).message || t2; }catch(_){}
                       throw new Error(m); }
          });
        }).then(function(){
          /* ⚠️ 차례가 바뀌면 **목록 카드의 대표 사진도** 바뀝니다 —
             `after()` 를 안 부르면 카드가 그대로여서 "안 바뀌었다" 로
             보입니다 (올리기 · 빼기와 같은 자리). */
          return draw(el, id).then(function(){ if(after) after(); });
        }).catch(function(err){
          mv.disabled = false;
          say(String((err && err.message) || "차례를 바꾸지 못했습니다."));
        });
        return;
      }
      var t = t0;
      var x = t.closest(".lsp-x");
      if(!x) return;
      var li = x.closest(".lsp-t");
      if(!li) return;
      /* ⚠️ 되돌릴 수 없는 일이라 한 번 여쭙습니다 */
      if(!W.confirm("이 사진을 뺍니다. 되돌릴 수 없습니다.")) return;
      x.disabled = true;
      fetch(conf.url + "/rest/v1/rpc/drop_listing_photo", {
        method:"POST",
        headers: Object.assign({ "content-type":"application/json",
                                 apikey: conf.anonKey },
                               W.amAuthHeaders ? W.amAuthHeaders() : {}),
        body: JSON.stringify({ p: { id: li.getAttribute("data-fid") } })
      }).then(function(r){
        return r.text().then(function(t2){
          if(!r.ok){ var m = t2; try{ m = JSON.parse(t2).message || t2; }catch(_){}
                     throw new Error(m); }
        });
      }).then(function(){
        return draw(el, id).then(function(){ if(after) after(); });
      }).catch(function(err){
        x.disabled = false;
        say(String((err && err.message) || "빼지 못했습니다."));
      });
    });

    draw(el, id);
  }

  /* ⚠️ `pick` · `pickBind` · `sendPicked` 는 **양식에서 미리 고르는**
     길입니다(2026-11-10) — `box` · `bind` 는 올린 **뒤에** 붙이는 길이고
     둘 다 남습니다(올린 뒤에 붙이는 길을 없애면 그 화면을 닫으신 분의
     매물은 영원히 사진이 없습니다 · 막다른 길 · 절대 규칙 2). */
  W.amLstPhoto = { ready: ready, on: function(){ return ON; },
                   box: box, bind: bind, draw: draw,
                   pick: pickBox, pickBind: pickBind, sendPicked: sendPicked };
})();

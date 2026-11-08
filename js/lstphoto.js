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

  var OK_MIME = ["image/jpeg", "image/png", "image/webp"];
  var MAX = 8388608;                 /* ⚠️ 0068 의 값과 같아야 합니다 */
  var MANY = 8;                      /* ⚠️ 0068 의 값과 같아야 합니다 */

  /* 상자 — ⚠️ 버킷이 꺼졌으면 **빈 글자**입니다 */
  function box(){
    if(!ON) return "";
    return '<div class="lsp">' +
      '<p class="lsp-h">사진</p>' +
      '<ul class="lsp-l"></ul>' +
      '<div class="lsp-r">' +
        '<input type="file" class="lsp-i" ' +
          'accept="image/jpeg,image/png,image/webp" aria-label="올리실 사진">' +
        '<button type="button" class="btn btn-sm btn-pt lsp-go">이 사진 올리기</button>' +
      '</div>' +
      /* ⚠️ 못 막는 것을 막는다고 적지 않습니다 — 픽셀 크기는 못 봅니다
         (파일이 우리 서버를 지나가지 않습니다). 세는 것만 적습니다. */
      '<p class="jhint">여덟 장까지 · 한 장에 8MB 까지 · JPG · PNG · WEBP · ' +
      '<b>첫 장</b>이 목록 카드에 보입니다.</p>' +
      '<p class="jmsg lsp-m" hidden></p>' +
    '</div>';
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
        ul.innerHTML = L.map(function(f){
          return '<li class="lsp-t" data-fid="' + esc(f.id) + '">' +
            '<img src="' + esc(f.url) + '" alt="' + esc(f.caption || "올리신 사진") +
              '" loading="lazy" decoding="async">' +
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
    if(go && inp) go.addEventListener("click", function(){
      var f = inp.files && inp.files[0];
      if(!f){ say("올리실 사진을 골라 주세요."); return; }
      /* ⚠️ DB 도 같은 것을 봅니다 — 여기서만 막으면 꾸러미를 고쳐 지나갑니다 */
      if(OK_MIME.indexOf(f.type) < 0){ say("사진은 JPG · PNG · WEBP 만 됩니다."); return; }
      if(f.size > MAX){ say("8MB 를 넘습니다."); return; }
      var n = el.querySelectorAll(".lsp-t").length;
      if(n >= MANY){ say("사진은 여덟 장까지입니다. 먼저 빼 주세요."); return; }
      go.disabled = true;
      say("올리는 중입니다…");
      fetch("/api/upload", {
        method:"POST",
        headers: Object.assign({ "content-type":"application/json" },
                               W.amAuthHeaders ? W.amAuthHeaders() : {}),
        /* ⚠️⚠️ `lst:true` 로 **매물 쪽 길**임을 말합니다. 버킷은 서버가
           DB 가 돌려준 **경로**로 고릅니다 (여기서 고르면 거기가 구멍). */
        body: JSON.stringify({ lst:true, listing:id, mime:f.type, bytes:f.size })
      }).then(function(r){
        return r.json().then(function(j){ return { ok:r.ok, j:j }; });
      }).then(function(x){
        if(!x.ok || !x.j || !x.j.url)
          throw new Error((x.j && x.j.error) || "지금 올리지 못했습니다");
        return fetch(x.j.url, { method:"PUT",
          headers:{ "content-type":f.type }, body:f });
      }).then(function(r){
        if(!r || !r.ok) throw new Error("올리지 못했습니다");
        go.disabled = false;
        inp.value = "";
        if(msg) msg.hidden = true;
        return draw(el, id).then(function(){ if(after) after(); });
      }).catch(function(e){
        go.disabled = false;
        say(String((e && e.message) || "올리지 못했습니다."));
      });
    });

    el.addEventListener("click", function(e){
      var t = e.target;
      if(!t || !t.closest) return;
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

  W.amLstPhoto = { ready: ready, on: function(){ return ON; },
                   box: box, bind: bind, draw: draw };
})();

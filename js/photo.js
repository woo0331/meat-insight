/* ════════════════════════════════════════════════════════════════════
   사진 · 서류 붙이기 — 2차 지시서 §5-4

   ⚠️⚠️ **접수한 뒤에 올립니다.** 접수 전에 올리게 하면 아무나 올리는
   길이 하나 생깁니다 (로그인 없이 들어오는 요청이라 변경자를 모릅니다)
   — 그래서 이 칸은 **접수 완료 안내 안**에만 나오고, 요청번호와
   연락처가 맞아야 자리를 받습니다 (`claim_photo_slot` · 0011).
   덕분에 적는 양식이 길어지지도 않고, 찍어 둔 것이 없으면 그냥 안
   올리고 넘어가실 수 있습니다.

   ⚠️⚠️ **버킷이 설정되기 전에는 칸이 아예 안 나옵니다.**
   `/api/upload` 가 `{ up:false }` 를 돌려주면 그려지지 않습니다 —
   단추도 · 안내도 · "준비 중" 도 없습니다 (절대 규칙 2 · 5 · 로그인과
   같은 방식). ⚠️ 지금이 그 상태입니다 (`INTAKE_BUCKET` 이 없습니다).

   ⚠️⚠️ **올라간 뒤에만 "올렸습니다" 라고 말합니다** (절대 규칙 5).
   자리를 받은 것과 파일이 올라간 것은 다른 일이라, 둘을 갈라서
   말합니다.

   ⚠️ 파일 자체는 서버 함수를 지나가지 않습니다 — 서명된 주소로
   **바로** 올립니다 (`api/upload.js` 머리말).

   ⚠️⚠️ **보는 주소는 그때그때 만듭니다.** 버킷은 비공개이고, 보기
   주소는 10분짜리입니다 — 화면에 미리 박아 두지 않고 **누르셨을 때**
   청합니다 (안 누른 사진의 주소를 만들어 둘 까닭이 없습니다).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  /* ⚠️ `api/upload.js` 의 OK_MIME · MAX_BYTES 와 같아야 합니다. 여기는
     **먼저 걸러 주는 자리**입니다 — 8MB 를 올려 보내고 거절당하면 그
     시간을 손님이 기다립니다. ⚠️ DB(0011)의 CHECK 가 마지막 자물쇠입니다. */
  var MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  var MAX  = 8388608;        /* 8MB */
  var N    = 5;              /* 한 요청에 다섯 장까지 (0011) */
  var ST   = { asked:false, up:false };

  function warn(e){ try{ console.warn("[photo] " + e); }catch(_){} }

  function size(n){
    return (n >= 1048576) ? (Math.round(n / 104857.6) / 10) + "MB"
                          : Math.max(1, Math.round(n / 1024)) + "KB";
  }

  /* 올릴 수 있는 상태인가 — ⚠️ **한 번만** 묻습니다 */
  window.amPhotoReady = function(){
    if(ST.asked) return Promise.resolve(ST.up);
    ST.asked = true;
    return fetch("/api/upload", { headers:{ accept:"application/json" } })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ ST.up = !!(d && d.up); return ST.up; })
      .catch(function(e){ warn(e); return false; });
  };

  /* ── 접수 완료 안내 안에 칸을 붙입니다 ─────────────────────────
     ⚠️ 요청번호가 없으면 **붙이지 않습니다** — 번호가 없으면 저장이
     안 된 요청이고, 그 자리에 사진 칸을 내면 올리는 척하는 화면이
     됩니다 (절대 규칙 5). */
  window.amPhotoAfter = function(box, no, tel){
    if(!box || !no || !tel) return;
    window.amPhotoReady().then(function(up){
      if(!up) return;
      var w = document.createElement("div");
      w.className = "phup";
      w.innerHTML =
        '<p class="phup-t">' + icon("camera", 17) +
          '<span><b>사진이나 서류를 같이 보내실 수 있습니다.</b> ' +
          '스윙 영상 캡처 · 클럽 상태 · 고치실 자리를 찍어 주시면 업체가 ' +
          '더 정확한 금액을 냅니다 — 없으시면 그냥 두셔도 됩니다.</span></p>' +
        '<label class="phup-b" for="phup-f">' + icon("camera", 18) +
          '<span>사진 고르기</span></label>' +
        /* ⚠️ 받는 형식을 `accept` 에도 적습니다 — 폰에서 고르개가
           사진만 보여 주어 한 단계가 줄어듭니다 */
        '<input type="file" id="phup-f" class="phup-i" multiple ' +
          'accept="image/jpeg,image/png,image/webp,application/pdf">' +
        '<ul class="phup-l" id="phup-l"></ul>' +
        /* 개인정보 — 무엇이 어디로 가는지 그대로 적습니다 */
        '<p class="phup-note">JPG · PNG · WEBP 사진과 PDF 서류를 ' +
          '<b>한 장에 8MB · 다섯 장까지</b> 올리실 수 있습니다. ' +
          '올리신 파일은 <b>배정된 업체와 저희 담당자만</b> 봅니다 — ' +
          '공개되지 않습니다. 사람 얼굴이나 서류의 주민등록번호는 ' +
          '가리고 찍어 주세요.</p>';
      box.appendChild(w);
      var inp = w.querySelector("#phup-f");
      inp.addEventListener("change", function(){
        window.amPhotoSend(inp, String(no), String(tel));
      });
    });
  };

  /* ── 고르신 파일을 올립니다 ───────────────────────────────────
     ⚠️ 하나씩 차례로 올립니다 — 다섯 장을 한꺼번에 밀면 폰에서
     끊기고, 어느 것이 실패했는지도 안 보입니다. */
  window.amPhotoSend = function(inp, no, tel){
    var list = document.getElementById("phup-l");
    var files = [].slice.call(inp.files || []);
    inp.value = "";                    /* 같은 파일을 다시 고를 수 있게 */
    if(!list || !files.length) return;

    var done = list.querySelectorAll("li.is-ok").length;
    var chain = Promise.resolve();
    files.forEach(function(f){
      chain = chain.then(function(){
        var li = document.createElement("li");
        /* ⚠️ 파일 이름은 **손님이 쓴 글자**입니다 — esc() 를 거칩니다
           (절대 규칙 4). ⚠️ 서버에는 **안 보냅니다** (0011 머리말 —
           파일 이름에 성함 · 상호가 들어 있는 경우가 흔합니다). */
        li.innerHTML = '<span class="phup-n">' + esc(f.name) + '</span>' +
          '<i class="phup-s">' + esc(size(f.size)) + '</i>' +
          '<b class="phup-st">올리는 중…</b>';
        list.appendChild(li);
        function nope(say){
          li.className = "is-bad";
          li.querySelector(".phup-st").textContent = say;
        }

        if(done >= N){ nope("다섯 장까지입니다"); return; }
        if(MIME.indexOf(f.type) < 0){ nope("이 형식은 올릴 수 없습니다"); return; }
        if(f.size > MAX){ nope("8MB 를 넘습니다"); return; }

        return fetch("/api/upload", {
          method:"POST",
          headers:{ "content-type":"application/json" },
          body: JSON.stringify({ no:no, tel:tel, mime:f.type, bytes:f.size })
        }).then(function(r){
          return r.json().then(function(j){ return { ok:r.ok, j:j }; });
        }).then(function(x){
          if(!x.ok || !x.j || !x.j.url)
            throw new Error((x.j && x.j.error) || "지금 올리지 못했습니다");
          /* ⚠️⚠️ **여기서 "올렸습니다" 라고 하지 않습니다** — 자리를
             받은 것이고 파일은 아직 안 갔습니다 (절대 규칙 5). */
          return fetch(x.j.url, { method:"PUT",
            headers:{ "content-type":f.type }, body:f });
        }).then(function(r){
          if(!r || !r.ok) throw new Error("올리지 못했습니다");
          done++;
          li.className = "is-ok";
          li.querySelector(".phup-st").textContent = "올렸습니다";
        }).catch(function(e){
          warn(e);
          /* ⚠️ 끊긴 것과 거절당한 것을 갈라서 말합니다 — 손님이
             무엇을 하셔야 하는지가 다릅니다. */
          nope((e && e.message) || "올리지 못했습니다");
        });
      });
    });
  };

  /* ── 붙은 사진을 **보는** 자리 (업체 · 운영자 · 손님) ───────────
     ⚠️⚠️ **목록은 RLS 가 좁혀 줍니다** (0011 의 세 정책) — 업체는
     배정된 건만, 손님은 자기 것만, 운영자는 전부. 화면이 또 거르지
     않습니다 (두 곳에 적으면 어긋납니다).
     ⚠️ 돌려주는 것은 **줄**뿐이고 보는 주소는 안 만듭니다. */
  window.amPhotoRows = function(conf, requestIds){
    if(!requestIds || !requestIds.length) return Promise.resolve({});
    /* ⚠️⚠️ **버킷이 없으면 아예 묻지 않습니다.** 줄이 남아 있어도 보는
       주소를 만들 수 없어서, 그리면 **눌러도 아무 일이 안 나는 단추**가
       됩니다 (절대 규칙 5). 올리는 칸과 같은 규칙입니다. */
    return window.amPhotoReady().then(function(up){
      if(!up) return {};
      return rows(conf, requestIds);
    });
  };

  function rows(conf, requestIds){
    return fetch(conf.url + "/rest/v1/request_photo?select=id,request_id,mime,bytes" +
      "&request_id=in.(" + requestIds.map(encodeURIComponent).join(",") + ")" +
      "&order=created_at.asc&limit=100",
      /* ⚠️ 토큰은 **여기서** 붙입니다 — 부르는 쪽마다 붙이면 한 곳에서
         빠뜨리고, 그러면 RLS 가 빈 결과를 줘서 "사진이 없다" 로 보입니다. */
      { headers: Object.assign({ apikey: conf.anonKey }, window.amAuthHeaders()) })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(rows){
        /* ⚠️ 못 읽었으면 **null** 입니다 — 0장과 다릅니다. */
        if(!rows) return null;
        var by = {};
        rows.forEach(function(p){
          (by[p.request_id] = by[p.request_id] || []).push(p);
        });
        return by;
      }).catch(function(e){ warn(e); return null; });
  }

  /* 한 장을 엽니다 — ⚠️ 누르셨을 때만 주소를 청합니다 (10분짜리) */
  window.amPhotoOpen = function(id){
    return fetch("/api/upload?p=" + encodeURIComponent(id), {
      headers: Object.assign({ accept:"application/json" }, window.amAuthHeaders())
    }).then(function(r){
      return r.json().then(function(j){
        if(!r.ok || !j || !j.url)
          throw new Error((j && j.error) || "지금 불러오지 못했습니다");
        return j.url;
      });
    });
  };

  /* 사진 줄을 그립니다 — ⚠️ 0장이면 **아무것도 안 그립니다**
     (빈 액자를 두면 "사진이 있었는데 안 보인다" 로 읽힙니다). */
  window.amPhotoBlock = function(rows){
    if(!rows || !rows.length) return "";
    return '<div class="phv"><b class="phv-t">' + icon("camera", 15) +
      ' 붙이신 파일 ' + won(rows.length) + '장</b>' +
      '<ul class="phv-l">' + rows.map(function(p){
        var pdf = p.mime === "application/pdf";
        return '<li><button type="button" class="btn btn-sm btn-line" ' +
          'data-photo="' + esc(p.id) + '">' +
          esc((pdf ? "서류" : "사진") + " · " + size(p.bytes)) + '</button></li>';
      }).join("") + '</ul>' +
      '<p class="phv-n">⚠️ 손님이 올리신 것입니다. 보는 주소는 10분 뒤에 닫힙니다.</p>' +
      '</div>';
  };
})();

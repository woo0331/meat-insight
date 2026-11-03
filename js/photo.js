/* ════════════════════════════════════════════════════════════════════
   사진 · 서류 붙이기 — 2026-10-18 "매장 운영 전문관 2차" §7-3 · §15

   ⚠️⚠️ **접수한 뒤에 올립니다.** 접수 전에 올리게 하면 아무나 올리는
   길이 하나 생깁니다 (§15 악용 방어) — 그래서 이 칸은 **접수 완료
   안내 안**에만 나오고, 접수번호와 연락처가 맞아야 자리를 받습니다.
   덕분에 적는 폼이 길어지지도 않고, 고장난 냉장고를 찍어 둔 것이
   없으면 그냥 안 올리고 넘어가실 수 있습니다.

   ⚠️⚠️ **버킷이 설정되기 전에는 칸이 아예 안 나옵니다.**
   `/api/upload` 가 `{ up:false }` 를 돌려주면 그려지지 않습니다 —
   단추도 · 안내도 · "준비 중" 도 없습니다 (§30-7 · 절대 규칙 2 ·
   로그인과 같은 방식). 지금 운영 사이트가 그 상태입니다.

   ⚠️⚠️ **올라간 뒤에만 "올렸습니다" 라고 말합니다** (§15 · 절대
   규칙 5). 자리를 받은 것과 파일이 올라간 것은 다른 일이라, 둘을
   갈라서 말합니다.

   ⚠️ 파일 자체는 서버 함수를 지나가지 않습니다 — 서명된 주소로
   **바로** 올립니다 (`api/upload.js` 머리말).
   ════════════════════════════════════════════════════════════════════ */

/* ⚠️ `api/upload.js` 의 OK_MIME · MAX_BYTES 와 같아야 합니다. 빌드가
   서버 ↔ DB 를 맞춰 보고, 여기는 **먼저 걸러 주는 자리**입니다 —
   8MB 를 올려 보내고 거절당하면 그 시간을 손님이 기다립니다. */
var AM_PH_MIME = ["image/jpeg","image/png","image/webp","application/pdf"];
var AM_PH_MAX  = 8388608;
var AM_PH_N    = 5;
var AM_PH = { asked:false, up:false };

function amPhLog(e){
  try{ console.warn("[photo] " + e); }catch(_){}
}

/* 올릴 수 있는 상태인가 — **한 번만** 묻습니다 */
window.amPhotoReady = function(){
  if(AM_PH.asked) return Promise.resolve(AM_PH.up);
  AM_PH.asked = true;
  return fetch("/api/upload", { headers:{ accept:"application/json" } })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){ AM_PH.up = !!(d && d.up); return AM_PH.up; })
    .catch(function(e){ amPhLog(e); return false; });
};

function amPhSize(n){
  return (n >= 1048576) ? (Math.round(n / 104857.6) / 10) + "MB"
                        : Math.max(1, Math.round(n / 1024)) + "KB";
}

/* ── 접수 완료 안내 안에 칸을 붙입니다 ───────────────────────────
   ⚠️ `no`(접수번호)가 없으면 **붙이지 않습니다** — 번호가 없으면
   저장이 안 된 접수이고, 그 자리에 사진 칸을 내면 올리는 척하는
   화면이 됩니다 (절대 규칙 5). */
window.amPhotoAfter = function(box, no, tel){
  if(!box || !no || !tel) return;
  amPhotoReady().then(function(up){
    if(!up) return;
    var w = document.createElement("div");
    w.className = "phup";
    w.innerHTML =
      '<p class="phup-t">' + icon("camera",16) +
        '<span><b>사진이나 서류를 같이 보내실 수 있습니다.</b> ' +
        '고장난 곳 · 공사할 자리를 찍어 주시면 업체가 더 정확한 금액을 ' +
        '냅니다 — 없으시면 그냥 두셔도 됩니다.</span></p>' +
      '<label class="phup-b" for="phup-f">' + icon("camera",17) +
        '<span>사진 고르기</span></label>' +
      /* ⚠️ 받는 형식을 `accept` 에도 적습니다 — 폰에서 고르개가
         사진만 보여 주어 한 단계가 줄어듭니다 */
      '<input type="file" id="phup-f" class="phup-i" multiple ' +
        'accept="image/jpeg,image/png,image/webp,application/pdf">' +
      '<ul class="phup-l" id="phup-l"></ul>' +
      /* §7-3 · 개인정보 — 무엇이 어디로 가는지 그대로 적습니다 */
      '<p class="note">JPG · PNG · WEBP 사진과 PDF 서류를 ' +
        '<b>한 장에 8MB · 다섯 장까지</b> 올리실 수 있습니다. ' +
        '올리신 파일은 <b>배정된 업체와 저희 담당자만</b> 봅니다 — ' +
        '공개되지 않습니다. 사람 얼굴이나 서류의 주민등록번호는 ' +
        '가리고 찍어 주세요.</p>';
    box.appendChild(w);
    var inp = w.querySelector("#phup-f");
    inp.addEventListener("change", function(){
      amPhotoSend(inp, String(no), String(tel));
    });
  });
};

/* ── 고르신 파일을 올립니다 ───────────────────────────────────────
   ⚠️ 하나씩 차례로 올립니다 — 다섯 장을 한꺼번에 밀면 폰에서
   끊기고, 어느 것이 실패했는지도 안 보입니다. */
window.amPhotoSend = function(inp, no, tel){
  var list = document.getElementById("phup-l");
  var files = [].slice.call(inp.files || []);
  inp.value = "";                      /* 같은 파일을 다시 고를 수 있게 */
  if(!list || !files.length) return;

  var done = list.querySelectorAll("li.is-ok").length;
  var chain = Promise.resolve();
  files.forEach(function(f){
    chain = chain.then(function(){
      var li = document.createElement("li");
      /* ⚠️ 파일 이름은 **손님이 쓴 글자**입니다 — `esc()` 를 거칩니다
         (절대 규칙 4). ⚠️ 서버에는 **안 보냅니다** (0011 머리말). */
      li.innerHTML = '<span class="phup-n">' + esc(f.name) + '</span>' +
        '<i class="phup-s">' + amPhSize(f.size) + '</i>' +
        '<b class="phup-st">올리는 중…</b>';
      list.appendChild(li);
      function no_(say){ li.classList.add("is-bad");
        li.querySelector(".phup-st").textContent = say; }

      if(done >= AM_PH_N){ no_("다섯 장까지입니다"); return; }
      if(AM_PH_MIME.indexOf(f.type) < 0){ no_("이 형식은 올릴 수 없습니다"); return; }
      if(f.size > AM_PH_MAX){ no_("8MB 를 넘습니다"); return; }

      return fetch("/api/upload", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ no:no, tel:tel, mime:f.type, bytes:f.size })
      }).then(function(r){ return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
        .then(function(x){
          if(!x.ok || !x.j || !x.j.url)
            throw new Error((x.j && x.j.error) || "지금 올리지 못했습니다");
          /* ⚠️⚠️ **여기서 "올렸습니다" 라고 하지 않습니다** — 자리를
             받은 것이고 파일은 아직 안 갔습니다 (절대 규칙 5). */
          return fetch(x.j.url, { method:"PUT",
            headers:{ "content-type":f.type }, body:f });
        })
        .then(function(r){
          if(!r || !r.ok) throw new Error("올리지 못했습니다");
          done++;
          li.classList.add("is-ok");
          li.querySelector(".phup-st").textContent = "올렸습니다";
        })
        .catch(function(e){
          amPhLog(e);
          /* ⚠️ 끊긴 것과 거절당한 것을 갈라서 말합니다 — 손님이
             무엇을 하셔야 하는지가 다릅니다 (접수와 같은 규칙). */
          no_((e && e.message) || "올리지 못했습니다");
        });
    });
  });
};

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

/* ── 사진 고르개 한 벌 ───────────────────────────────────────────
   2026-11-27 대표 지시 — **작성 화면에서 고르고 미리 보고**, 제출이 성공하면
   받은 접수번호로 올립니다. 일부가 실패하면 접수번호와 성공한 사진은 그대로 두고
   **실패한 사진만** 다시 올리게 합니다.
     '앨범에서 선택'  accept="image/*"          → 갤럭시 사진 선택기·갤러리 / 아이폰 사진 보관함
     '파일에서 선택'  확장자 + HEIC + PDF 같이   → 갤럭시 '내 파일' / 아이폰 '파일' 앱
   ⚠️⚠️ **capture 속성을 달지 마세요** — 달면 카메라 촬영 화면만 열립니다.
   ⚠️⚠️ **버킷이 설정되기 전에는 구역째 안 나옵니다** — 올릴 곳이 없는데
   고르게 하면 올리는 척하는 화면입니다 (절대 규칙 5). */
var AM_PH_EXT = { jpg:"image/jpeg", jpeg:"image/jpeg", png:"image/png", webp:"image/webp",
                  pdf:"application/pdf", heic:"image/heic", heif:"image/heif" };
var AM_PH_HEIC_SAY = "HEIC 사진은 이 브라우저에서 바로 올릴 수 없습니다. " +
  "'앨범에서 선택' 으로 고르시면 대부분 JPG 로 바뀌어 올라갑니다 — 그래도 안 되면 " +
  "카메라 설정에서 고효율(HEIC) 저장을 끄거나 사진을 JPG 로 저장한 뒤 다시 골라 주세요.";
var AM_PH_ACC2 = ".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";

/* 작성 화면에 넣는 구역 — pfx 로 id 를 가릅니다 (한 화면에 둘이면 getElementById 가 앞엣것만 집습니다) */
window.PhotoPick = function(pfx, opt){
  opt = opt || {};
  var a = "pp-" + pfx + "-a", f = "pp-" + pfx + "-f";
  return '<div class="phup phup-form" data-ph="' + esc(pfx) + '" hidden>' +
    '<p class="phup-h"><b>사진 추가</b> <i>(선택)</i> <span class="phup-cnt" data-ph-cnt>0/' + AM_PH_N + '장</span></p>' +
    '<p class="phup-sub">' + esc(opt.say || "현장 · 고장난 곳 · 공사할 자리를 찍어 주시면 더 정확한 견적을 받습니다. 없어도 제출할 수 있습니다.") + '</p>' +
    '<div class="phup-bs">' +
      '<label class="phup-b" for="' + a + '">' + icon("camera",17) + '<span>앨범에서 선택</span></label>' +
      '<label class="phup-b phup-b2" for="' + f + '">' + icon("files",17) + '<span>파일에서 선택</span></label>' +
    '</div>' +
    '<input type="file" id="' + a + '" class="phup-i" data-ph-in multiple accept="image/*">' +
    '<input type="file" id="' + f + '" class="phup-i" data-ph-in multiple accept="' + AM_PH_ACC2 + '">' +
    '<ul class="phup-l" data-ph-list></ul>' +
    '<p class="note phup-note">JPG · PNG · WEBP · PDF · 한 장 8MB · 앨범과 파일 섞어 ' + AM_PH_N + '장까지. ' +
      '제출하면 같이 저장되고 <b>배정된 업체와 저희 담당자만</b> 봅니다. 얼굴 · 주민등록번호는 가려 주세요.</p>' +
  '</div>';
};

/* 화면이 그려진 뒤 — 버킷이 있으면 구역을 켭니다 (app.js 가 화면마다 부릅니다) */
window.amPhotoWire = function(root){
  var ws = [].slice.call((root || document).querySelectorAll(".phup-form[data-ph]"));
  if(!ws.length) return;
  amPhotoReady().then(function(up){
    ws.forEach(function(w){
      if(!up){ w.setAttribute("hidden", ""); return; }
      w.removeAttribute("hidden");
      amPhState(w); amPhPaint(w);
    });
  });
};
function amPhState(w){
  if(!w.__ph) w.__ph = { no:"", tel:"", items:[], busy:false };
  return w.__ph;
}
/* 고르면 — 위임으로 받습니다 (양식이 다시 그려져도 다시 걸 필요가 없습니다) */
document.addEventListener("change", function(e){
  var inp = e.target;
  if(!inp || !inp.matches || !inp.matches("input[data-ph-in]")) return;
  var w = inp.closest(".phup"); if(!w) return;
  amPhState(w);
  var files = [].slice.call(inp.files || []);
  inp.value = "";                      /* 같은 파일을 다시 고를 수 있게 */
  files.reduce(function(ch, f){ return ch.then(function(){ return amPhStage(w, f); }); }, Promise.resolve())
    .then(function(){ amPhPaint(w); });
});
document.addEventListener("click", function(e){
  var b = e.target && e.target.closest && e.target.closest("[data-ph-x],[data-ph-retry],[data-ph-go]");
  if(!b) return;
  var w = b.closest(".phup"); if(!w || !w.__ph) return;
  if(b.hasAttribute("data-ph-x")){
    var it = w.__ph.items[+b.getAttribute("data-ph-x")]; if(!it) return;
    if(it.url){ try{ URL.revokeObjectURL(it.url); }catch(_){ } }
    w.__ph.items.splice(w.__ph.items.indexOf(it), 1);
    amPhRecount(w.__ph); amPhPaint(w);
  } else amPhotoGo(w);
});

/* 파일 꼴 — ⚠️ 갤럭시 '내 파일' 은 type 을 비워 줄 때가 있습니다. 확장자로 채웁니다 */
function amPhKind(f){
  var t = String(f.type || "").toLowerCase();
  var ext = String(f.name || "").split(".").pop().toLowerCase();
  if(!t || t === "application/octet-stream") t = AM_PH_EXT[ext] || t;
  if(t === "image/jpg") t = "image/jpeg";
  return t;
}
/* HEIC → JPG. 브라우저가 읽을 수 있을 때만 (아이폰 사파리는 읽습니다 · 크롬은 대개 못 읽습니다) */
function amPhToJpg(f){
  if(typeof createImageBitmap !== "function") return Promise.reject(new Error("no-decode"));
  return createImageBitmap(f).then(function(bm){
    var k = Math.min(1, 4000 / Math.max(bm.width, bm.height));
    var c = document.createElement("canvas");
    c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
    c.getContext("2d").drawImage(bm, 0, 0, c.width, c.height);
    return new Promise(function(ok, no){
      c.toBlob(function(b){ b ? ok(b) : no(new Error("no-blob")); }, "image/jpeg", 0.86); });
  }).then(function(b){
    var nm = String(f.name || "photo").replace(/\.(heic|heif)$/i, "") + ".jpg";
    try{ return new File([b], nm, { type:"image/jpeg" }); }catch(e){ b.name = nm; return b; }
  });
}
function amPhLive(st){ return st.items.filter(function(x){ return !x.bad || x.fail; }).length; }
function amPhRecount(st){
  st.items.forEach(function(o){ if(o.bad === "다섯 장까지입니다") o.bad = ""; });
  var n = 0; st.items.forEach(function(o){ if(!o.bad || o.fail){ n++; if(n > AM_PH_N){ o.bad = "다섯 장까지입니다"; o.fail = false; } } });
}

function amPhStage(w, f){
  var st = amPhState(w), kind = amPhKind(f);
  var it = { name:String(f.name || "사진"), size:f.size, bad:"", ok:false, f:f, mime:kind, url:"" };
  st.items.push(it);
  if(amPhLive(st) > AM_PH_N){ it.bad = "다섯 장까지입니다"; return Promise.resolve(); }
  var conv = (kind === "image/heic" || kind === "image/heif")
    ? amPhToJpg(f).then(function(j){ it.f = j; it.mime = "image/jpeg"; it.size = j.size; it.conv = true; },
                        function(){ it.bad = "HEIC 사진은 바로 올릴 수 없습니다"; it.heic = true; })
    : Promise.resolve();
  return conv.then(function(){
    if(it.bad) return;
    if(AM_PH_MIME.indexOf(it.mime) < 0){ it.bad = "이 형식은 올릴 수 없습니다"; return; }
    if(it.size > AM_PH_MAX){ it.bad = "8MB 를 넘습니다"; return; }
    if(it.mime !== "application/pdf"){ try{ it.url = URL.createObjectURL(it.f); }catch(e){} }
  });
}

function amPhPaint(w){
  var st = amPhState(w), list = w.querySelector("[data-ph-list]");
  if(!list) return;
  list.innerHTML = st.items.map(function(it, i){
    var cls = it.ok ? "is-ok" : (it.bad && !it.fail) ? "is-bad" : it.fail ? "is-fail" : "";
    var say = it.ok ? "저장됨" : it.fail ? ("저장 실패 — " + it.fail) : it.bad ? it.bad : it.busy ? "올리는 중…" : (st.no ? "올리기 전" : "제출하면 같이 저장");
    /* ⚠️ 파일 이름은 **손님이 쓴 글자**입니다 — `esc()` 를 거칩니다
       (절대 규칙 4). ⚠️ 서버에는 **안 보냅니다** (0011 머리말). */
    return '<li class="' + cls + '">' +
      '<span class="phup-th">' + (it.url ? '<img src="' + esc(it.url) + '" alt="">' : icon(it.mime === "application/pdf" ? "doc" : "camera", 22)) + '</span>' +
      '<span class="phup-tx"><span class="phup-n">' + esc(it.name) + '</span>' +
        '<i class="phup-s">' + (it.size ? amPhSize(it.size) : "") + (it.conv ? " · JPG 로 바꿈" : "") + '</i>' +
        '<b class="phup-st">' + esc(say) + '</b>' +
        (it.heic ? '<small class="phup-hint">' + esc(AM_PH_HEIC_SAY) + '</small>' : '') +
      '</span>' +
      (it.ok || it.busy ? '' : '<button type="button" class="phup-x" data-ph-x="' + i + '" aria-label="' + esc(it.name) + ' 빼기">' + icon("x",16) + '</button>') +
    '</li>';
  }).join("");
  var live = st.items.filter(function(o){ return !o.bad || o.fail; }).length;
  var c = w.querySelector("[data-ph-cnt]"); if(c) c.textContent = live + "/" + AM_PH_N + "장";
  /* 제출 뒤(번호가 있을 때)만 다시 올리기 단추 */
  var go = w.querySelector("[data-ph-retry]");
  var failN = st.items.filter(function(o){ return o.fail; }).length;
  var waitN = st.items.filter(function(o){ return !o.bad && !o.ok && !o.fail; }).length;
  if(go){
    var n = st.no ? (failN + waitN) : 0;
    go.hidden = !n || st.busy;
    go.lastChild.textContent = failN ? " 실패한 사진 " + n + "장 다시 올리기" : " 남은 사진 " + n + "장 올리기";
  }
}

/* ── 제출이 성공한 뒤 — 고르신 사진을 그 접수번호로 올립니다 ───────────
   ⚠️ 번호가 없으면(저장 안 된 접수) 올리지 않고 그렇게 말합니다 (절대 규칙 5). */
window.amPhotoSubmit = function(form, box, no, tel){
  var w = form && form.querySelector(".phup-form");
  if(!w || !w.__ph) return false;
  var st = w.__ph;
  var has = st.items.some(function(o){ return !o.bad; });
  if(!has) return false;
  /* 폼은 곧 비워집니다 — 구역을 결과 상자로 옮겨 붙입니다 (고르신 것 · 상태를 그대로) */
  w.classList.add("phup-done");
  var h = w.querySelector(".phup-h");
  if(h) h.innerHTML = '<b>사진</b> <span class="phup-cnt" data-ph-cnt></span>';
  [].forEach.call(w.querySelectorAll(".phup-bs, .phup-sub, .phup-note, input[data-ph-in]"), function(e){ e.remove(); });
  if(!no){
    st.items.forEach(function(o){ if(!o.bad) o.bad = "접수번호가 없어 저장하지 못했습니다"; });
    box.appendChild(w); amPhPaint(w); return true;
  }
  st.no = String(no); st.tel = String(tel || "");
  if(!w.querySelector("[data-ph-retry]")){
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn btn-b phup-go"; b.setAttribute("data-ph-retry", "");
    b.hidden = true; b.innerHTML = icon("refresh",17) + " 다시 올리기";
    w.appendChild(b);
  }
  box.appendChild(w);
  amPhotoGo(w);
  return true;
};

/* 접수 완료 안내 안에 칸을 붙입니다 — 작성 중에 고르지 않으셨을 때만 (붙여서 더 올릴 수 있게).
   ⚠️ `no`(접수번호)가 없으면 **붙이지 않습니다** (절대 규칙 5). */
window.amPhotoAfter = function(box, no, tel){
  if(!box || !no || !tel) return;
  amPhotoReady().then(function(up){
    if(!up) return;
    var d = document.createElement("div");
    d.innerHTML = PhotoPick("after", { say:"지금이라도 사진이나 서류를 같이 보내실 수 있습니다 — 없으시면 그냥 두셔도 됩니다." });
    var w = d.firstChild;
    w.removeAttribute("hidden");
    w.classList.add("phup-after");
    var st = amPhState(w); st.no = String(no); st.tel = String(tel);
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn btn-b phup-go"; b.setAttribute("data-ph-retry", "");
    b.hidden = true; b.innerHTML = icon("save",17) + " 올리기";
    w.appendChild(b);
    box.appendChild(w);
    amPhPaint(w);
  });
};

/* ── 올립니다 — 하나씩 차례로 (어느 것이 실패했는지 보이게) ──────────
   ⚠️ 이미 저장된 것은 다시 안 올립니다. 실패한 것과 아직 안 올린 것만. */
window.amPhotoGo = function(w){
  var st = w.__ph; if(!st || st.busy || !st.no) return Promise.resolve();
  st.busy = true;
  var todo = st.items.filter(function(o){ return (!o.bad || o.fail) && !o.ok; });
  var chain = Promise.resolve();
  todo.forEach(function(it){
    chain = chain.then(function(){
      it.busy = true; it.fail = ""; it.bad = ""; amPhPaint(w);
      return fetch("/api/upload", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ no:st.no, tel:st.tel, mime:it.mime, bytes:it.size })
      }).then(function(r){ return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
        .then(function(x){
          if(!x.ok || !x.j || !x.j.url)
            throw new Error((x.j && x.j.error) || "지금 올리지 못했습니다");
          /* ⚠️⚠️ **여기서 "저장됨" 이라고 하지 않습니다** — 자리를
             받은 것이고 파일은 아직 안 갔습니다 (절대 규칙 5). */
          return fetch(x.j.url, { method:"PUT", headers:{ "content-type":it.mime }, body:it.f });
        })
        .then(function(r){
          if(!r || !r.ok) throw new Error("올리지 못했습니다");
          it.ok = true;
        })
        .catch(function(e){
          amPhLog(e);
          it.fail = (e && e.message) || "올리지 못했습니다";
        })
        .then(function(){ it.busy = false; amPhPaint(w); });
    });
  });
  return chain.then(function(){ st.busy = false; amPhPaint(w); });
};

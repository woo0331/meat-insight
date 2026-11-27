

var AM_PH_MIME = ["image/jpeg","image/png","image/webp","application/pdf"];
var AM_PH_MAX  = 8388608;
var AM_PH_N    = 5;
var AM_PH = { asked:false, up:false };

function amPhLog(e){
  try{ console.warn("[photo] " + e); }catch(_){}
}

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

var AM_PH_EXT = { jpg:"image/jpeg", jpeg:"image/jpeg", png:"image/png", webp:"image/webp",
                  pdf:"application/pdf", heic:"image/heic", heif:"image/heif" };
var AM_PH_HEIC_SAY = "아이폰 · 갤럭시의 HEIC 사진은 이 브라우저에서 바로 올릴 수 없습니다. " +
  "'앨범에서 선택' 으로 고르시면 대부분 JPG 로 바뀌어 올라갑니다 — 그래도 안 되면 " +
  "카메라 설정에서 고효율(HEIC) 저장을 끄거나 사진을 JPG 로 저장한 뒤 다시 골라 주세요.";

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
      '<div class="phup-bs">' +
        '<label class="phup-b" for="phup-f">' + icon("camera",17) + '<span>앨범에서 선택</span></label>' +
        '<label class="phup-b phup-b2" for="phup-f2">' + icon("files",17) + '<span>파일에서 선택</span></label>' +
      '</div>' +
      '<input type="file" id="phup-f" class="phup-i" multiple accept="image/*">' +
      '<input type="file" id="phup-f2" class="phup-i" multiple ' +
        'accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf">' +
      '<ul class="phup-l" id="phup-l"></ul>' +
      '<p class="phup-cnt" id="phup-cnt" aria-live="polite"></p>' +
      '<button type="button" class="btn btn-b phup-go" id="phup-go" disabled>' + icon("save",17) + ' 고른 사진 올리기</button>' +

      '<p class="note">JPG · PNG · WEBP 사진과 PDF 서류를 ' +
        '<b>한 장에 8MB · 다섯 장까지</b> 올리실 수 있습니다 (앨범 · 파일 섞어서). ' +
        '고르신 사진은 <b>올리기 전에</b> × 로 빼실 수 있습니다. ' +
        '올리신 파일은 <b>배정된 업체와 저희 담당자만</b> 봅니다 — ' +
        '공개되지 않습니다. 사람 얼굴이나 서류의 주민등록번호는 ' +
        '가리고 찍어 주세요.</p>';
    box.appendChild(w);
    var st = { no:String(no), tel:String(tel), items:[], busy:false };
    w.__ph = st;
    ["phup-f","phup-f2"].forEach(function(id){
      var inp = w.querySelector("#" + id);
      inp.addEventListener("change", function(){
        var files = [].slice.call(inp.files || []);
        inp.value = "";
        files.reduce(function(ch, f){ return ch.then(function(){ return amPhStage(w, f); }); }, Promise.resolve())
          .then(function(){ amPhPaint(w); });
      });
    });
    w.querySelector("#phup-go").addEventListener("click", function(){ amPhotoGo(w); });
    amPhPaint(w);
  });
};

function amPhKind(f){
  var t = String(f.type || "").toLowerCase();
  var ext = String(f.name || "").split(".").pop().toLowerCase();
  if(!t || t === "application/octet-stream") t = AM_PH_EXT[ext] || t;
  if(t === "image/jpg") t = "image/jpeg";
  return t;
}

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
function amPhLive(st){ return st.items.filter(function(x){ return !x.bad; }).length; }

function amPhStage(w, f){
  var st = w.__ph, kind = amPhKind(f);
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
  var st = w.__ph, list = w.querySelector("#phup-l");
  list.innerHTML = "";
  st.items.forEach(function(it, i){
    var li = document.createElement("li");
    if(it.ok) li.className = "is-ok"; else if(it.bad) li.className = "is-bad";

    li.innerHTML =
      '<span class="phup-th">' + (it.url ? '<img src="' + esc(it.url) + '" alt="">' : icon(it.mime === "application/pdf" ? "doc" : "camera", 22)) + '</span>' +
      '<span class="phup-tx"><span class="phup-n">' + esc(it.name) + '</span>' +
        '<i class="phup-s">' + (it.size ? amPhSize(it.size) : "") + (it.conv ? " · JPG 로 바꿈" : "") + '</i>' +
        '<b class="phup-st">' + esc(it.ok ? "올렸습니다" : it.bad ? it.bad : it.busy ? "올리는 중…" : "올리기 전") + '</b>' +
        (it.heic ? '<small class="phup-hint">' + esc(AM_PH_HEIC_SAY) + '</small>' : '') +
      '</span>' +
      (it.ok || it.busy ? '' : '<button type="button" class="phup-x" aria-label="' + esc(it.name) + ' 빼기">' + icon("x",16) + '</button>');
    var x = li.querySelector(".phup-x");
    if(x) x.addEventListener("click", function(){
      if(it.url){ try{ URL.revokeObjectURL(it.url); }catch(e){} }
      st.items.splice(st.items.indexOf(it), 1);

      st.items.forEach(function(o){ if(o.bad === "다섯 장까지입니다") o.bad = ""; });
      var n = 0; st.items.forEach(function(o){ if(!o.bad){ n++; if(n > AM_PH_N) o.bad = "다섯 장까지입니다"; } });
      amPhPaint(w);
    });
    list.appendChild(li);
  });
  var wait = st.items.filter(function(o){ return !o.bad && !o.ok; }).length;
  var done = st.items.filter(function(o){ return o.ok; }).length;
  var go = w.querySelector("#phup-go");
  go.disabled = st.busy || !wait;
  go.lastChild.textContent = wait ? " 고른 사진 " + wait + "장 올리기" : " 고른 사진 올리기";
  w.querySelector("#phup-cnt").textContent = (done || wait) ? "올린 것 " + done + "장 · 올릴 것 " + wait + "장 · 최대 " + AM_PH_N + "장" : "";
}

window.amPhotoGo = function(w){
  var st = w.__ph; if(!st || st.busy) return;
  st.busy = true;
  var todo = st.items.filter(function(o){ return !o.bad && !o.ok; });
  var chain = Promise.resolve();
  todo.forEach(function(it){
    chain = chain.then(function(){
      it.busy = true; amPhPaint(w);
      return fetch("/api/upload", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ no:st.no, tel:st.tel, mime:it.mime, bytes:it.size })
      }).then(function(r){ return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
        .then(function(x){
          if(!x.ok || !x.j || !x.j.url)
            throw new Error((x.j && x.j.error) || "지금 올리지 못했습니다");

          return fetch(x.j.url, { method:"PUT",
            headers:{ "content-type":it.mime }, body:it.f });
        })
        .then(function(r){
          if(!r || !r.ok) throw new Error("올리지 못했습니다");
          it.ok = true;
        })
        .catch(function(e){
          amPhLog(e);

          it.bad = (e && e.message) || "올리지 못했습니다";
        })
        .then(function(){ it.busy = false; amPhPaint(w); });
    });
  });
  return chain.then(function(){ st.busy = false; amPhPaint(w); });
};

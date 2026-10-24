

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

      '<input type="file" id="phup-f" class="phup-i" multiple ' +
        'accept="image/jpeg,image/png,image/webp,application/pdf">' +
      '<ul class="phup-l" id="phup-l"></ul>' +

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

window.amPhotoSend = function(inp, no, tel){
  var list = document.getElementById("phup-l");
  var files = [].slice.call(inp.files || []);
  inp.value = "";
  if(!list || !files.length) return;

  var done = list.querySelectorAll("li.is-ok").length;
  var chain = Promise.resolve();
  files.forEach(function(f){
    chain = chain.then(function(){
      var li = document.createElement("li");

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

          no_((e && e.message) || "올리지 못했습니다");
        });
    });
  });
};

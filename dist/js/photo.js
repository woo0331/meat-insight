

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
var AM_PH_HEIC_SAY = "HEIC 사진은 이 브라우저에서 바로 올릴 수 없습니다. " +
  "'앨범에서 선택' 으로 고르시면 대부분 JPG 로 바뀌어 올라갑니다 — 그래도 안 되면 " +
  "카메라 설정에서 고효율(HEIC) 저장을 끄거나 사진을 JPG 로 저장한 뒤 다시 골라 주세요.";
var AM_PH_ACC2 = ".jpg,.jpeg,.png,.webp,.heic,.heif,.pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";

window.PhotoPick = function(pfx, opt){
  opt = opt || {};
  var a = "pp-" + pfx + "-a", f = "pp-" + pfx + "-f";
  var img = !!opt.imgOnly;
  return '<div class="phup phup-form" data-ph="' + esc(pfx) + '"' + (img ? ' data-ph-img="1"' : '') + ' hidden>' +
    '<p class="phup-h"><b>사진 추가</b> <i>(선택)</i> <span class="phup-cnt" data-ph-cnt>0/' + AM_PH_N + '장</span></p>' +
    '<p class="phup-sub">' + esc(opt.say || "현장 · 고장난 곳 · 공사할 자리를 찍어 주시면 더 정확한 견적을 받습니다. 없어도 제출할 수 있습니다.") + '</p>' +
    '<div class="phup-bs">' +
      '<label class="phup-b" for="' + a + '">' + icon("camera",17) + '<span>앨범에서 선택</span></label>' +
      '<label class="phup-b phup-b2" for="' + f + '">' + icon("files",17) + '<span>파일에서 선택</span></label>' +
    '</div>' +
    '<input type="file" id="' + a + '" class="phup-i" data-ph-in multiple accept="image/*">' +
    '<input type="file" id="' + f + '" class="phup-i" data-ph-in multiple accept="' + (img ? AM_PH_ACC2.replace(/,?\.pdf|,?application\/pdf/g, "") : AM_PH_ACC2) + '">' +
    '<ul class="phup-l" data-ph-list></ul>' +
    '<p class="note phup-note">' + (img
      ? 'JPG · PNG · WEBP · 한 장 8MB · ' + AM_PH_N + '장까지. 저장하면 같이 올라가고, <b>공개 전에는 올리신 분과 저희 담당자만</b> 봅니다.'
      : 'JPG · PNG · WEBP · PDF · 한 장 8MB · 앨범과 파일 섞어 ' + AM_PH_N + '장까지. ' +
        '제출하면 같이 저장되고 <b>배정된 업체와 저희 담당자만</b> 봅니다. 얼굴 · 주민등록번호는 가려 주세요.') + '</p>' +
  '</div>';
};

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

document.addEventListener("change", function(e){
  var inp = e.target;
  if(!inp || !inp.matches || !inp.matches("input[data-ph-in]")) return;
  var w = inp.closest(".phup"); if(!w) return;
  amPhState(w);
  var files = [].slice.call(inp.files || []);
  inp.value = "";
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
    if(w.getAttribute("data-ph-img") && it.mime === "application/pdf"){ it.bad = "상품 사진은 이미지만 올리실 수 있습니다"; return; }
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

  var go = w.querySelector("[data-ph-retry]");
  var failN = st.items.filter(function(o){ return o.fail; }).length;
  var waitN = st.items.filter(function(o){ return !o.bad && !o.ok && !o.fail; }).length;
  if(go){
    var n = st.no ? (failN + waitN) : 0;
    go.hidden = !n || st.busy;
    go.lastChild.textContent = failN ? " 실패한 사진 " + n + "장 다시 올리기" : " 남은 사진 " + n + "장 올리기";
  }

  var sum = w.querySelector("[data-ph-sum]");
  if(sum && st.no){
    var okN = st.items.filter(function(o){ return o.ok; }).length, pend = failN + waitN;
    sum.textContent = st.busy ? "사진을 올리고 있어요…"
      : (okN && !pend) ? "사진 " + okN + "장이 저장됐어요."
      : (okN && pend) ? "사진 " + okN + "장이 저장됐어요. " + pend + "장은 다시 올릴 수 있어요."
      : pend ? "사진을 저장하지 못했어요. " + pend + "장을 다시 올릴 수 있어요. 신청은 접수됐습니다."
      : "";
    sum.className = "phup-sum" + ((!st.busy && pend) ? " is-fail" : "");
  }
}

window.amPhotoSubmit = function(form, box, no, tel){
  var w = form && form.querySelector(".phup-form");
  if(!w || !w.__ph) return false;
  var st = w.__ph;
  var has = st.items.some(function(o){ return !o.bad; });
  if(!has) return false;

  w.classList.add("phup-done");
  var h = w.querySelector(".phup-h");
  if(h) h.innerHTML = '<b>사진</b> <span class="phup-cnt" data-ph-cnt></span>';
  if(!w.querySelector("[data-ph-sum]") && h){
    var sm = document.createElement("p"); sm.setAttribute("data-ph-sum", ""); sm.setAttribute("role", "status");
    h.parentNode.insertBefore(sm, h.nextSibling);
  }
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

window.amPhotoSubmitWith = function(form, key, slot){
  var w = form && form.querySelector(".phup-form");
  if(!w || !w.__ph) return Promise.resolve(false);
  var st = w.__ph;
  if(!st.items.some(function(o){ return !o.bad && !o.ok; })) return Promise.resolve(false);
  st.no = String(key); st.slot = slot;
  if(!w.querySelector("[data-ph-retry]")){
    var b = document.createElement("button");
    b.type = "button"; b.className = "btn btn-o phup-go"; b.setAttribute("data-ph-retry", "");
    b.hidden = true; b.innerHTML = icon("refresh",17) + " 다시 올리기";
    w.appendChild(b);
  }
  return amPhotoGo(w).then(function(){ return true; });
};

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

window.amPhotoGo = function(w){
  var st = w.__ph; if(!st || st.busy || !st.no) return Promise.resolve();
  st.busy = true;
  var todo = st.items.filter(function(o){ return (!o.bad || o.fail) && !o.ok; });
  var chain = Promise.resolve();
  todo.forEach(function(it){
    chain = chain.then(function(){
      it.busy = true; it.fail = ""; it.bad = ""; amPhPaint(w);

      return (st.slot ? st.slot(it) : fetch("/api/upload", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ no:st.no, tel:st.tel, mime:it.mime, bytes:it.size })
      })).then(function(r){ return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
        .then(function(x){
          if(!x.ok || !x.j || !x.j.url)
            throw new Error((x.j && x.j.error) || "지금 올리지 못했습니다");

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

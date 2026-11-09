/* js/imgprep.js — 올리기 전에 사진을 **다시 그립니다** (한 곳입니다)
   ────────────────────────────────────────────────────────────────
   ⚠️⚠️⚠️ **까닭은 위치정보입니다.** 폰으로 찍은 사진에는 EXIF 안에
   찍은 자리의 **위도 · 경도**가 들어갑니다. 저희 사진은 브라우저에서
   Supabase 의 **공개 버킷**으로 바로 올라가고(우리 서버를 지나가지
   않습니다) 공개 버킷은 **주소만 알면 누구나** 엽니다 — 집에서 찍은
   중고채 사진 한 장이 집 좌표를 그대로 공개하는 꼴입니다.
   방침은 "연락처 · 상세주소를 공개 설정 없이 노출하지 않는다" 인데
   좌표는 주소보다 정확합니다.

   ⚠️⚠️⚠️ **서버에서는 못 뗍니다.** 파일이 우리 서버를 안 지나가므로
   (`api/upload.js` 는 **서명된 주소만** 내주고 바이트를 안 봅니다),
   떼는 자리는 **브라우저뿐**입니다. canvas 에 다시 그려서 새로
   인코딩하면 EXIF 가 **통째로** 사라집니다 — 자리 · 기종 · 찍은
   시각이 한 줄도 안 남습니다.

   ⚠️⚠️ **못 하면 올리지 않습니다.** 다시 그리기가 실패했을 때 원본을
   그냥 올리면 그 한 장만 조용히 좌표를 달고 나갑니다 — 그래서 거절하고
   까닭을 말합니다 (절대 규칙 5 의 반대 꼴을 만들지 않습니다).

   ⚠️⚠️ **적어 보낸 종류를 믿지 않습니다.** `file.type` 은 브라우저가
   확장자를 보고 적는 값이라 `.jpg` 로 이름만 바꾼 아무 파일이 그대로
   통과합니다. 그래서 **첫 바이트**(파일 서명)를 읽어 봅니다.

   ⚠️ 덤으로 긴 변을 1600px 로 줄이고 다시 압축합니다 — 폰 사진 한
   장이 6MB 인데 카드에 쓰이는 크기는 300px 입니다.

   ⚠️ **광고 소재(`js/adminbiz.js`)와 증빙서류(`js/photo.js` ·
   `js/deskphoto.js` 의 doc)는 여기를 안 지나갑니다** — 광고 소재는
   광고주가 준 그림이라 우리가 고치면 안 되고(0064 가 원본 비율을
   보존합니다), 서류는 PDF 라 canvas 에 못 그립니다. */
(function(){
  "use strict";
  var W = window;

  /* 긴 변 · 품질 — ⚠️ 두 곳에 적지 않습니다 */
  var EDGE = 1600;
  var Q    = 0.84;

  /* 파일 서명 — ⚠️ WEBP 는 앞이 "RIFF" 이고 **8번째부터 "WEBP"** 라
     둘 다 봐야 합니다 (RIFF 만 보면 wav · avi 가 통과합니다). */
  function sigOf(b){
    if(b.length >= 3 && b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF)
      return "image/jpeg";
    if(b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E &&
       b[3] === 0x47 && b[4] === 0x0D && b[5] === 0x0A && b[6] === 0x1A &&
       b[7] === 0x0A) return "image/png";
    if(b.length >= 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 &&
       b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 &&
       b[11] === 0x50) return "image/webp";
    return "";
  }

  function head(file, n){
    return new Promise(function(ok, no){
      var fr = new FileReader();
      fr.onload  = function(){ ok(new Uint8Array(fr.result)); };
      fr.onerror = function(){ no(new Error("사진을 읽지 못했습니다.")); };
      try{ fr.readAsArrayBuffer(file.slice(0, n)); }
      catch(e){ no(new Error("사진을 읽지 못했습니다.")); }
    });
  }

  /* 그림으로 풉니다 — ⚠️ `createImageBitmap` 이 없는 브라우저가 있어
     `<img>` 로도 풀 수 있게 둡니다 (없으면 그 분은 못 올립니다). */
  function decode(file){
    if(W.createImageBitmap)
      return W.createImageBitmap(file).catch(function(){ return viaImg(file); });
    return viaImg(file);
  }
  function viaImg(file){
    return new Promise(function(ok, no){
      var u = URL.createObjectURL(file);
      var im = new Image();
      im.onload  = function(){ URL.revokeObjectURL(u); ok(im); };
      im.onerror = function(){ URL.revokeObjectURL(u);
        no(new Error("사진을 열지 못했습니다.")); };
      im.src = u;
    });
  }

  function toBlob(cv){
    return new Promise(function(ok, no){
      if(!cv.toBlob){ no(new Error("이 브라우저에서는 사진을 준비하지 못합니다.")); return; }
      cv.toBlob(function(b){
        if(b) ok(b);
        else no(new Error("사진을 준비하지 못했습니다. 다른 사진으로 해 보세요."));
      }, "image/jpeg", Q);
    });
  }

  /* ⚠️⚠️ 돌려주는 종류는 **늘 image/jpeg** 입니다 — 보내는 쪽이
     `file.type` 을 그대로 쓰면 DB 가 받은 종류와 실제가 달라집니다.
     ⚠️ 투명한 PNG 를 그냥 JPEG 로 바꾸면 **검은 바탕**이 됩니다 —
     먼저 흰 바탕을 깔고 그립니다. */
  W.amImgPrep = function(file){
    if(!file) return Promise.reject(new Error("올리실 사진을 골라 주세요."));
    return head(file, 16).then(function(b){
      var sig = sigOf(b);
      if(!sig) throw new Error("사진 파일이 아닙니다 — JPG · PNG · WEBP 만 됩니다.");
      return decode(file);
    }).then(function(im){
      var w = im.width, h = im.height;
      if(!(w > 0 && h > 0)) throw new Error("사진을 열지 못했습니다.");
      var s = Math.min(1, EDGE / Math.max(w, h));
      var cw = Math.max(1, Math.round(w * s)), ch = Math.max(1, Math.round(h * s));
      var cv = document.createElement("canvas");
      cv.width = cw; cv.height = ch;
      var cx = cv.getContext("2d");
      if(!cx) throw new Error("이 브라우저에서는 사진을 준비하지 못합니다.");
      cx.fillStyle = "#ffffff";
      cx.fillRect(0, 0, cw, ch);
      cx.drawImage(im, 0, 0, cw, ch);
      if(im.close) try{ im.close(); }catch(e){}
      return toBlob(cv).then(function(bl){
        return { blob: bl, mime: "image/jpeg", bytes: bl.size, w: cw, h: ch };
      });
    });
  };

  /* 화면이 적는 안내 한 줄 — ⚠️ **한 곳**입니다 (세 화면이 같은 말을
     해야 합니다). 못 막는 것을 막는다고 적지 않습니다 — 떼는 것은
     위치정보이고, 그 사진에 무엇이 **찍혀** 있는지는 못 봅니다. */
  W.amImgPrepNote = function(){
    return "올릴 때 사진의 위치정보를 떼고 긴 변을 " + EDGE +
           "px 로 줄여 올립니다. 사진에 찍힌 집 · 차 번호는 " +
           "직접 가려 주세요.";
  };
})();

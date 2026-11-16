/* 매물 사진 — 서버의 파일 검사(api/upload.js 의 imgCheck)를 참 파일 · 가짜 파일로 눌러 봅니다 (2026-11-17)
   ════════════════════════════════════════════════════════════════════
   ⚠️⚠️ 이 검사는 **브라우저를 안 지나고 업로드 주소를 직접 부른** 파일을 막는 자리입니다
   (위치정보가 그대로인 폰 원본 · 이름만 바꾼 파일 · 종류를 속인 파일).
   ⚠️ 서버는 **머리만** 풉니다(가로 · 세로 · 메타 칸) — 그림 전체를 해석(디코딩)하지 않습니다.
   그래서 "머리는 멀쩡한데 몸통이 깨진 파일" 은 여기서 못 막습니다 — 그 사실도 검사에 적어 둡니다.
   ════════════════════════════════════════════════════════════════════ */
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const { imgCheck } = require(path.join(ROOT, "api/upload.js"));
let pass = 0, fail = 0;
function ok(name, cond, why){ if(cond){ pass++; console.log("  ✅ " + name); }
  else { fail++; console.log("  ❌ " + name + (why ? "  →  " + why : "")); } }

/* 손으로 짓는 JPEG 머리 — SOI · (APP1) · SOF0(가로 · 세로) · SOS · EOI */
function jpeg(w, h, app1){
  const seg = [];
  seg.push(Buffer.from([0xFF, 0xD8]));
  seg.push(Buffer.from([0xFF, 0xE0, 0x00, 0x10, 0x4A,0x46,0x49,0x46,0x00, 1,1, 0, 0,1, 0,1, 0,0]));
  if(app1){
    const body = Buffer.concat([Buffer.from(app1, "latin1"), Buffer.alloc(20)]);
    const len = body.length + 2;
    seg.push(Buffer.from([0xFF, 0xE1, len >> 8, len & 255]), body);
  }
  seg.push(Buffer.from([0xFF, 0xC0, 0x00, 0x11, 0x08, h >> 8, h & 255, w >> 8, w & 255, 3,
                        1,0x22,0, 2,0x11,1, 3,0x11,1]));
  seg.push(Buffer.from([0xFF, 0xDA, 0x00, 0x0C, 3, 1,0, 2,0x11, 3,0x11, 0,0x3F,0]), Buffer.alloc(64, 0x55));
  seg.push(Buffer.from([0xFF, 0xD9]));
  return Buffer.concat(seg);
}
function png(w, h, extra){
  const sig = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const chunk = function(t, d){ const l = Buffer.alloc(4); l.writeUInt32BE(d.length);
    return Buffer.concat([l, Buffer.from(t, "latin1"), d, Buffer.alloc(4)]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  const parts = [sig, chunk("IHDR", ih)];
  if(extra) parts.push(chunk(extra, Buffer.from("MM\0*", "latin1")));
  parts.push(chunk("IDAT", Buffer.alloc(10)), chunk("IEND", Buffer.alloc(0)));
  return Buffer.concat(parts);
}
function webpX(w, h, flags){
  const d = Buffer.alloc(10); d[0] = flags; d.writeUIntLE(w - 1, 4, 3); d.writeUIntLE(h - 1, 7, 3);
  const ch = Buffer.concat([Buffer.from("VP8X", "latin1"), Buffer.from([10,0,0,0]), d]);
  const body = Buffer.concat([Buffer.from("WEBP", "latin1"), ch]);
  const hd = Buffer.alloc(8); hd.write("RIFF", 0, "latin1"); hd.writeUInt32LE(body.length, 4);
  return Buffer.concat([hd, body]);
}

console.log("\n── 매물 사진 서버 검사 (imgCheck)");
/* 참 파일 — 저장소의 줄인 사진(jpg · webp) */
const sz = fs.readdirSync(path.join(ROOT, "img/sizes"));
const realJ = sz.find(f => /-(1200|900|800)\.jpg$/.test(f)) || sz.find(f => /\.jpg$/.test(f));
const realW = sz.find(f => /-(1200|900|800)\.webp$/.test(f)) || sz.find(f => /\.webp$/.test(f));
const rj = imgCheck(fs.readFileSync(path.join(ROOT, "img/sizes", realJ)), "image/jpeg");
ok("참 JPG(" + realJ + ")를 받는다 · 가로 · 세로를 읽는다", rj.ok && rj.w > 0 && rj.h > 0, JSON.stringify(rj));
const rw = imgCheck(fs.readFileSync(path.join(ROOT, "img/sizes", realW)), "image/webp");
ok("참 WEBP(" + realW + ")를 받는다", rw.ok && rw.w > 0, JSON.stringify(rw));
ok("손으로 지은 1600×1067 JPG 를 받는다", imgCheck(jpeg(1600, 1067), "image/jpeg").ok);
ok("1×1 PNG 를 받는다", imgCheck(png(1, 1), "image/png").ok);

/* 막아야 하는 것 */
const r1 = imgCheck(jpeg(1600, 1067, "Exif\0\0"), "image/jpeg");
ok("⚠️⚠️ JPG 의 **위치정보(EXIF)**가 남아 있으면 거절", !r1.ok && /EXIF/.test(r1.why), JSON.stringify(r1));
const r2 = imgCheck(jpeg(1600, 1067, "http://ns.adobe.com/xap/1.0/\0"), "image/jpeg");
ok("  XMP 도 거절", !r2.ok, JSON.stringify(r2));
const r3 = imgCheck(png(800, 600, "eXIf"), "image/png");
ok("  PNG 의 eXIf 덩이도 거절", !r3.ok, JSON.stringify(r3));
const r4 = imgCheck(webpX(800, 600, 0x08), "image/webp");
ok("  WEBP 의 EXIF 표시도 거절", !r4.ok, JSON.stringify(r4));
const r5 = imgCheck(jpeg(4032, 3024), "image/jpeg");
ok("⚠️⚠️ 긴 변 4032px(폰 원본 크기)는 거절 — 브라우저 처리(1600)를 안 지난 파일", !r5.ok && /2048|4032|픽셀/.test(r5.why), JSON.stringify(r5));
const r6 = imgCheck(Buffer.from("<html><script>alert(1)</script></html>".repeat(20)), "image/jpeg");
ok("⚠️ 이름 · 종류만 JPG 인 HTML 은 첫 바이트로 거절", !r6.ok && /첫 바이트/.test(r6.why), JSON.stringify(r6));
const r7 = imgCheck(png(10, 10), "image/jpeg");
ok("  적어 보낸 종류와 실제가 다르면 거절", !r7.ok && /다름/.test(r7.why), JSON.stringify(r7));
const r8 = imgCheck(Buffer.from([0xFF, 0xD8, 0xFF, 0xD9]), "image/jpeg");
ok("  첫 바이트만 JPG 이고 머리 · 그림 자료가 없으면 거절", !r8.ok && /SOS|가로/.test(r8.why), JSON.stringify(r8));
const r9 = imgCheck(Buffer.alloc(8388609, 0), "image/jpeg");
ok("  8MB 를 넘으면 거절", !r9.ok && /크기|8MB/.test(r9.why), JSON.stringify(r9));
ok("  빈 파일은 거절", !imgCheck(Buffer.alloc(0), "image/jpeg").ok);
/* 중간에 잘린 파일(끝 표시가 없음)은 거절 */
const cut = jpeg(1600, 1067); const torn = cut.slice(0, cut.length - 10);
const rt = imgCheck(torn, "image/jpeg");
ok("⚠️ **중간에 잘린** JPG(끝 표시 없음)는 거절", !rt.ok && /EOI|잘린/.test(rt.why), JSON.stringify(rt));
ok("  끝에 0 이 몇 바이트 붙은 정상 JPG 는 받는다", imgCheck(Buffer.concat([cut, Buffer.alloc(6)]), "image/jpeg").ok);
const thin = imgCheck(jpeg(4000, 300), "image/jpeg");
ok("  가늘고 긴 그림(4000×300)도 긴 변으로 거절", !thin.ok, JSON.stringify(thin));
ok("  2000×2000 은 받는다 (넓이 한도 2048² 안)", imgCheck(jpeg(2000, 2000), "image/jpeg").ok);
const tOk = imgCheck(jpeg(480, 480), "image/jpeg", { maxSide: 512, maxBytes: 307200 });
const tBig = imgCheck(jpeg(1600, 1600), "image/jpeg", { maxSide: 512, maxBytes: 307200 });
ok("  작은 사진 검사: 480×480 은 받고 1600×1600 은 거절", tOk.ok && !tBig.ok, JSON.stringify([tOk, tBig]));
/* ⚠️ 못 막는 것도 적어 둡니다 — 머리 · 끝은 멀쩡하고 **그림 자료(몸통)만 깨진** 파일 */
const body = jpeg(1600, 1067); const bad2 = Buffer.from(body);
for(let i = 60; i < bad2.length - 2; i++) bad2[i] = 0x13;
bad2[bad2.length - 2] = 0xFF; bad2[bad2.length - 1] = 0xD9;
ok("  (알려 둠) 머리 · 끝은 멀쩡하고 몸통만 깨진 JPG 는 **통과합니다** — 서버는 그림 전체를 해석하지 않습니다",
   imgCheck(bad2, "image/jpeg").ok === true, JSON.stringify(imgCheck(bad2, "image/jpeg")));
/* 손님에게 할 말에 기록용 말(영문 · 숫자 세부)이 섞이지 않는가 */
ok("  손님에게는 짧은 말만 (기록용 까닭을 안 냅니다)",
   [r1, r5, r6, r7].every(r => r.say && r.say.indexOf("EXIF") < 0 && r.say.indexOf("px") < 0),
   [r1, r5, r6, r7].map(r => r.say).join(" | "));

console.log("\n" + (pass + fail) + "건 중 " + pass + "건 통과 · " + fail + "건 실패");
process.exit(fail ? 1 : 0);

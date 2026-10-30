/* ════════════════════════════════════════════════════════════════════
   기기 카탈로그 — 제조사 · 종류 · 모델 · 용량 · 등급 · 상태 (2026-10-29)

   PHONEWAY 가 다루는 **기기의 목록**입니다. 이 저장소의 다른 묶음 틀
   (lifecycle · journey · halls · svcpick)과 성격이 다릅니다 — 저쪽은
   서비스 분류를 묶어 보는 틀이고, 이쪽은 **실제 제품 목록**입니다.

   ⚠️⚠️ **모델명 · 출시 연도 · 용량은 공개된 사실입니다.** 지어낸 것이
   아니고, 제조사가 실제로 판 제품입니다 — 그래서 적어도 됩니다.
   ⚠️⚠️ **값(매입가)은 여기 없습니다.** 아래 AM_BUY_PRICE 가 비어
   있고, 그것은 사장님이 정하실 사업 결정입니다. 제가 숫자를 지어내면
   사장님이 그 값으로 **실제 매입**을 하시게 됩니다 (절대 규칙 1).

   ⚠️ 모델을 더하실 때 — key 는 소문자·숫자·하이픈만, maker 와 kind 는
   아래 목록에 있는 것만, caps 는 **실제 출시된 용량**만 적습니다.
   `build-pages.js` 의 checkDevices() 가 빌드마다 봅니다.
   ════════════════════════════════════════════════════════════════════ */

/* ─── 제조사 ─────────────────────────────────────────────────────── */
window.AM_MAKERS = [
  { key:"apple",   name:"애플",  en:"Apple"   },
  { key:"samsung", name:"삼성",  en:"Samsung" },
  { key:"etc",     name:"기타",  en:"Other"   }
];

/* ─── 제조사 로고 자리 ────────────────────────────────────────────
   ⚠️⚠️ **비어 있습니다 — 그리고 비어 있는 것이 맞습니다.**
   애플 마크와 삼성 워드마크는 **남의 등록상표**이고, 중고폰을 사고
   파는 상업 화면에 얹으면 "제조사가 보증한다" 로 읽힙니다. 두 회사의
   브랜드 가이드가 그 쓰임을 허락하지 않습니다.
   ⚠️⚠️ **제가 비슷하게 그려 넣지 않았습니다** — 사장님이 직접
   "AI 가 임의로 재현한 부정확한 로고는 쓰지 말 것" 이라고 적으셨고,
   그 말이 맞습니다. 부정확한 상표는 쓰지 않느니만 못합니다.
   ⚠️ **권한을 확인한 SVG 파일이 생기면** 여기에 주소 한 줄씩 적으세요
   (`"/img/logo-apple.svg"` 꼴) — 화면은 한 줄도 안 고칩니다. 값이
   비어 있는 동안은 **로고 칸 자체를 안 그립니다** (빈 액자를 깔지
   않습니다 · 절대 규칙 2). 제조사 이름은 카드의 글(`아이폰 / iPhone`)이
   이미 말하고 있어서, 로고가 없다고 못 고르는 것이 아닙니다. */
/* ⚠️ 2026-10-30 — 시안에서 잘라 흰 글자 · 투명 바탕으로 만든 것입니다
   (사장님이 쓸 권리를 확인하셨습니다). **흰색이라 어두운 카드에서만**
   보입니다 — /sell 의 흰 카드에는 일부러 안 그립니다. ⚠️ /img/ 는 1년
   캐시라 파일을 바꾸면 `?v=` 를 같이 고치세요. */
window.AM_MAKER_LOGO = { apple:"/img/brands/apple.png?v=7c53732b",
                         samsung:"/img/brands/samsung.png?v=a26d5261" };

/* ─── 기기 종류 ───────────────────────────────────────────────────── */
window.AM_DEVICE_KINDS = [
  { key:"phone",  name:"스마트폰" },
  { key:"tablet", name:"태블릿"   },
  { key:"watch",  name:"워치"     },
  { key:"buds",   name:"이어버즈" }
];

/* ─── 모델 ────────────────────────────────────────────────────────
   ⚠️ 차례는 **최신이 위**입니다 (고르개에서 위부터 봅니다).
   ⚠️ 여기 없는 기종은 "기타 기기" 로 받고, 적어 주신 내용을 보고
      사람이 등록합니다 — 목록에 없다고 못 파는 것이 아닙니다.     */
window.AM_MODELS = [
  /* ── 애플 · 아이폰 ── */
  { key:"iphone-16-pro-max", maker:"apple", kind:"phone", name:"아이폰 16 Pro Max", year:2024, caps:[256,512,1024] },
  { key:"iphone-16-pro",     maker:"apple", kind:"phone", name:"아이폰 16 Pro",     year:2024, caps:[128,256,512,1024] },
  { key:"iphone-16-plus",    maker:"apple", kind:"phone", name:"아이폰 16 Plus",    year:2024, caps:[128,256,512] },
  { key:"iphone-16",         maker:"apple", kind:"phone", name:"아이폰 16",         year:2024, caps:[128,256,512] },
  { key:"iphone-15-pro-max", maker:"apple", kind:"phone", name:"아이폰 15 Pro Max", year:2023, caps:[256,512,1024] },
  { key:"iphone-15-pro",     maker:"apple", kind:"phone", name:"아이폰 15 Pro",     year:2023, caps:[128,256,512,1024] },
  { key:"iphone-15-plus",    maker:"apple", kind:"phone", name:"아이폰 15 Plus",    year:2023, caps:[128,256,512] },
  { key:"iphone-15",         maker:"apple", kind:"phone", name:"아이폰 15",         year:2023, caps:[128,256,512] },
  { key:"iphone-14-pro-max", maker:"apple", kind:"phone", name:"아이폰 14 Pro Max", year:2022, caps:[128,256,512,1024] },
  { key:"iphone-14-pro",     maker:"apple", kind:"phone", name:"아이폰 14 Pro",     year:2022, caps:[128,256,512,1024] },
  { key:"iphone-14-plus",    maker:"apple", kind:"phone", name:"아이폰 14 Plus",    year:2022, caps:[128,256,512] },
  { key:"iphone-14",         maker:"apple", kind:"phone", name:"아이폰 14",         year:2022, caps:[128,256,512] },
  { key:"iphone-13-pro-max", maker:"apple", kind:"phone", name:"아이폰 13 Pro Max", year:2021, caps:[128,256,512,1024] },
  { key:"iphone-13-pro",     maker:"apple", kind:"phone", name:"아이폰 13 Pro",     year:2021, caps:[128,256,512,1024] },
  { key:"iphone-13",         maker:"apple", kind:"phone", name:"아이폰 13",         year:2021, caps:[128,256,512] },
  { key:"iphone-13-mini",    maker:"apple", kind:"phone", name:"아이폰 13 mini",    year:2021, caps:[128,256,512] },
  { key:"iphone-12-pro-max", maker:"apple", kind:"phone", name:"아이폰 12 Pro Max", year:2020, caps:[128,256,512] },
  { key:"iphone-12-pro",     maker:"apple", kind:"phone", name:"아이폰 12 Pro",     year:2020, caps:[128,256,512] },
  { key:"iphone-12",         maker:"apple", kind:"phone", name:"아이폰 12",         year:2020, caps:[64,128,256] },
  { key:"iphone-12-mini",    maker:"apple", kind:"phone", name:"아이폰 12 mini",    year:2020, caps:[64,128,256] },
  { key:"iphone-11-pro-max", maker:"apple", kind:"phone", name:"아이폰 11 Pro Max", year:2019, caps:[64,256,512] },
  { key:"iphone-11-pro",     maker:"apple", kind:"phone", name:"아이폰 11 Pro",     year:2019, caps:[64,256,512] },
  { key:"iphone-11",         maker:"apple", kind:"phone", name:"아이폰 11",         year:2019, caps:[64,128,256] },
  { key:"iphone-se-3",       maker:"apple", kind:"phone", name:"아이폰 SE 3세대",   year:2022, caps:[64,128,256] },
  { key:"iphone-se-2",       maker:"apple", kind:"phone", name:"아이폰 SE 2세대",   year:2020, caps:[64,128,256] },

  /* ── 삼성 · 갤럭시 ── */
  { key:"galaxy-s24-ultra",  maker:"samsung", kind:"phone", name:"갤럭시 S24 Ultra", year:2024, caps:[256,512,1024] },
  { key:"galaxy-s24-plus",   maker:"samsung", kind:"phone", name:"갤럭시 S24+",      year:2024, caps:[256,512] },
  { key:"galaxy-s24",        maker:"samsung", kind:"phone", name:"갤럭시 S24",       year:2024, caps:[256,512] },
  { key:"galaxy-s23-ultra",  maker:"samsung", kind:"phone", name:"갤럭시 S23 Ultra", year:2023, caps:[256,512,1024] },
  { key:"galaxy-s23-plus",   maker:"samsung", kind:"phone", name:"갤럭시 S23+",      year:2023, caps:[256,512] },
  { key:"galaxy-s23",        maker:"samsung", kind:"phone", name:"갤럭시 S23",       year:2023, caps:[256,512] },
  { key:"galaxy-s22-ultra",  maker:"samsung", kind:"phone", name:"갤럭시 S22 Ultra", year:2022, caps:[256,512] },
  { key:"galaxy-s22-plus",   maker:"samsung", kind:"phone", name:"갤럭시 S22+",      year:2022, caps:[256] },
  { key:"galaxy-s22",        maker:"samsung", kind:"phone", name:"갤럭시 S22",       year:2022, caps:[256] },
  { key:"galaxy-s21-ultra",  maker:"samsung", kind:"phone", name:"갤럭시 S21 Ultra", year:2021, caps:[256,512] },
  { key:"galaxy-s21-plus",   maker:"samsung", kind:"phone", name:"갤럭시 S21+",      year:2021, caps:[256] },
  { key:"galaxy-s21",        maker:"samsung", kind:"phone", name:"갤럭시 S21",       year:2021, caps:[256] },
  { key:"galaxy-z-fold6",    maker:"samsung", kind:"phone", name:"갤럭시 Z 폴드6",   year:2024, caps:[256,512,1024] },
  { key:"galaxy-z-fold5",    maker:"samsung", kind:"phone", name:"갤럭시 Z 폴드5",   year:2023, caps:[256,512,1024] },
  { key:"galaxy-z-fold4",    maker:"samsung", kind:"phone", name:"갤럭시 Z 폴드4",   year:2022, caps:[256,512] },
  { key:"galaxy-z-flip6",    maker:"samsung", kind:"phone", name:"갤럭시 Z 플립6",   year:2024, caps:[256,512] },
  { key:"galaxy-z-flip5",    maker:"samsung", kind:"phone", name:"갤럭시 Z 플립5",   year:2023, caps:[256,512] },
  { key:"galaxy-z-flip4",    maker:"samsung", kind:"phone", name:"갤럭시 Z 플립4",   year:2022, caps:[256,512] },
  { key:"galaxy-a55",        maker:"samsung", kind:"phone", name:"갤럭시 A55",       year:2024, caps:[128,256] },
  { key:"galaxy-a34",        maker:"samsung", kind:"phone", name:"갤럭시 A34",       year:2023, caps:[128,256] },
  { key:"galaxy-quantum5",   maker:"samsung", kind:"phone", name:"갤럭시 퀀텀5",     year:2024, caps:[128,256] },

  /* ── 태블릿 ── */
  { key:"ipad-pro-13-m4",    maker:"apple", kind:"tablet", name:"아이패드 Pro 13 (M4)", year:2024, caps:[256,512,1024,2048] },
  { key:"ipad-pro-11-m4",    maker:"apple", kind:"tablet", name:"아이패드 Pro 11 (M4)", year:2024, caps:[256,512,1024,2048] },
  { key:"ipad-air-11-m2",    maker:"apple", kind:"tablet", name:"아이패드 에어 11 (M2)", year:2024, caps:[128,256,512,1024] },
  { key:"ipad-10",           maker:"apple", kind:"tablet", name:"아이패드 10세대",   year:2022, caps:[64,256] },
  { key:"ipad-mini-6",       maker:"apple", kind:"tablet", name:"아이패드 미니 6세대", year:2021, caps:[64,256] },
  { key:"galaxy-tab-s9-ultra", maker:"samsung", kind:"tablet", name:"갤럭시 탭 S9 Ultra", year:2023, caps:[256,512,1024] },
  { key:"galaxy-tab-s9-plus",  maker:"samsung", kind:"tablet", name:"갤럭시 탭 S9+",     year:2023, caps:[256,512] },
  { key:"galaxy-tab-s9",       maker:"samsung", kind:"tablet", name:"갤럭시 탭 S9",      year:2023, caps:[128,256] },

  /* ── 워치 · 버즈 ── */
  { key:"apple-watch-s10",   maker:"apple", kind:"watch", name:"애플워치 시리즈 10", year:2024, caps:[] },
  { key:"apple-watch-s9",    maker:"apple", kind:"watch", name:"애플워치 시리즈 9",  year:2023, caps:[] },
  { key:"apple-watch-ultra2",maker:"apple", kind:"watch", name:"애플워치 울트라 2",  year:2023, caps:[] },
  { key:"galaxy-watch7",     maker:"samsung", kind:"watch", name:"갤럭시 워치7",     year:2024, caps:[] },
  { key:"galaxy-watch6",     maker:"samsung", kind:"watch", name:"갤럭시 워치6",     year:2023, caps:[] },
  { key:"airpods-pro-2",     maker:"apple", kind:"buds",  name:"에어팟 프로 2세대", year:2022, caps:[] },
  { key:"airpods-4",         maker:"apple", kind:"buds",  name:"에어팟 4세대",      year:2024, caps:[] },
  { key:"galaxy-buds3-pro",  maker:"samsung", kind:"buds", name:"갤럭시 버즈3 프로", year:2024, caps:[] },

  /* ⚠️ 목록에 없는 기종은 아래 "기타" 로 받습니다 — 적어 주신 내용을
       보고 사람이 확인합니다. 못 파는 것이 아닙니다. */
  { key:"etc-phone",  maker:"etc", kind:"phone",  name:"기타 스마트폰", year:0, caps:[], free:true },
  { key:"etc-tablet", maker:"etc", kind:"tablet", name:"기타 태블릿",   year:0, caps:[], free:true },
  { key:"etc-device", maker:"etc", kind:"watch",  name:"기타 기기",     year:0, caps:[], free:true }
];

/* ─── 외관 등급 ───────────────────────────────────────────────────
   ⚠️⚠️ **값을 적지 않았습니다.** 등급은 "무엇을 보는가" 까지이고,
   그 등급이 얼마인지는 AM_BUY_PRICE(아래)가 정합니다. 여기 금액을
   적으면 기준표가 두 곳으로 갈립니다.
   ⚠️ 등급 key 를 바꾸지 마세요 — 신청에 실려 DB 에 저장됩니다.     */
window.AM_GRADES = [
  { key:"S", name:"S급 · 미사용", lead:"개봉만 했거나 거의 쓰지 않아 흠이 없습니다." },
  { key:"A", name:"A급 · 생활기스", lead:"가까이 봐야 보이는 잔기스 정도입니다." },
  { key:"B", name:"B급 · 사용감", lead:"눈에 띄는 기스나 눌림이 있지만 기능은 정상입니다." },
  { key:"C", name:"C급 · 사용감 많음", lead:"찍힘 · 변색 · 도색 벗겨짐이 뚜렷합니다." },
  { key:"D", name:"D급 · 파손", lead:"액정 깨짐 · 후면 깨짐 · 휘어짐이 있습니다." }
];

/* ─── 상태 질문 ───────────────────────────────────────────────────
   STEP 2 에서 묻는 것입니다. ⚠️ 받아 놓고 안 읽는 칸을 만들지
   마세요 — 여기 적은 것은 전부 접수 글에 실립니다.                */
window.AM_COND = [
  { key:"power",  q:"전원이 켜지고 정상 작동하나요?",
    opt:[["ok","정상 작동합니다"],["part","일부 기능이 안 됩니다"],["no","전원이 안 켜집니다"]] },
  { key:"lcd",    q:"액정 상태는 어떤가요?",
    opt:[["ok","깨끗합니다"],["line","줄 · 멍 · 번짐이 있습니다"],["crack","깨졌습니다"]] },
  { key:"back",   q:"후면 · 테두리는 어떤가요?",
    opt:[["ok","깨끗합니다"],["scratch","기스가 있습니다"],["crack","깨졌습니다"]] },
  { key:"batt",   q:"배터리 성능 상태를 아시나요?",
    opt:[["high","80% 이상"],["mid","80% 미만"],["changed","교체한 적이 있습니다"],["unknown","모르겠습니다"]] },
  { key:"cam",    q:"카메라 · 스피커 · 버튼에 이상이 있나요?",
    opt:[["ok","이상 없습니다"],["cam","카메라에 이상이 있습니다"],["etc","그 밖에 이상이 있습니다"]] },
  { key:"fix",    q:"수리하신 적이 있나요?",
    opt:[["no","없습니다"],["official","공식 서비스센터에서 수리했습니다"],["private","사설 수리를 받았습니다"]] }
];

/* ─── 매입 기준가 ─────────────────────────────────────────────────
   ⚠️⚠️ **비어 있습니다. 사장님이 정하실 값입니다.**
   모델 × 용량 × 등급별 금액은 사업 결정이고, 제가 숫자를 지어내면
   그 값으로 **실제 매입**을 하시게 됩니다 (절대 규칙 1).

   ⚠️⚠️ **비어 있는 동안 화면이 직접 매입 예상가를 안 냅니다.**
   "예상가 준비 중" 같은 자리표시자를 찍지 않고, 그 자리에
   **경쟁입찰**을 냅니다 (절대 규칙 2 · 5).

   적으실 때의 모양 —
     { model:"iphone-15-pro", cap:256, grade:"A", price:620000 }
   ⚠️ price 는 **원 단위 정수**입니다. 적으신 조합만 값이 나오고,
   없는 조합은 그대로 "경쟁입찰" 로 갑니다.                        */
window.AM_BUY_PRICE = [];

/* ════════ 읽는 함수 ════════════════════════════════════════════ */
window.amMakerName = function(k){
  var m = (window.AM_MAKERS||[]).filter(function(x){ return x.key === k; })[0];
  return m ? m.name : ""; };
window.amKindName = function(k){
  var m = (window.AM_DEVICE_KINDS||[]).filter(function(x){ return x.key === k; })[0];
  return m ? m.name : ""; };
window.amModel = function(k){
  return (window.AM_MODELS||[]).filter(function(x){ return x.key === k; })[0] || null; };
window.amModelsOf = function(maker, kind){
  return (window.AM_MODELS||[]).filter(function(x){
    return (!maker || x.maker === maker) && (!kind || x.kind === kind); }); };
window.amGrade = function(k){
  return (window.AM_GRADES||[]).filter(function(x){ return x.key === k; })[0] || null; };

/* ⚠️⚠️ **값이 없으면 null 입니다 — 0 이 아닙니다.** 0 을 돌려주면
   화면이 "0원에 삽니다" 로 읽습니다. null 이면 화면이 직접 매입
   예상가를 **아예 안 냅니다** (경쟁입찰로 갑니다).                */
window.amBuyPrice = function(model, cap, grade){
  var L = window.AM_BUY_PRICE || [];
  for(var i = 0; i < L.length; i++){
    var r = L[i];
    if(r.model === model && r.grade === grade &&
       (!r.cap || !cap || r.cap === cap)) return (typeof r.price === "number") ? r.price : null;
  }
  return null;
};
/* 직접 매입 예상가를 낼 수 있는가 — 화면이 이것 하나만 봅니다 */
window.amBuyReady = function(){ return (window.AM_BUY_PRICE || []).length > 0; };



window.AM_MAKERS = [
  { key:"apple",   name:"애플",  en:"Apple"   },
  { key:"samsung", name:"삼성",  en:"Samsung" },
  { key:"etc",     name:"기타",  en:"Other"   }
];

window.AM_MAKER_LOGO = { apple:"", samsung:"" };

window.AM_DEVICE_KINDS = [
  { key:"phone",  name:"스마트폰" },
  { key:"tablet", name:"태블릿"   },
  { key:"watch",  name:"워치"     },
  { key:"buds",   name:"이어버즈" }
];

window.AM_MODELS = [

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

  { key:"ipad-pro-13-m4",    maker:"apple", kind:"tablet", name:"아이패드 Pro 13 (M4)", year:2024, caps:[256,512,1024,2048] },
  { key:"ipad-pro-11-m4",    maker:"apple", kind:"tablet", name:"아이패드 Pro 11 (M4)", year:2024, caps:[256,512,1024,2048] },
  { key:"ipad-air-11-m2",    maker:"apple", kind:"tablet", name:"아이패드 에어 11 (M2)", year:2024, caps:[128,256,512,1024] },
  { key:"ipad-10",           maker:"apple", kind:"tablet", name:"아이패드 10세대",   year:2022, caps:[64,256] },
  { key:"ipad-mini-6",       maker:"apple", kind:"tablet", name:"아이패드 미니 6세대", year:2021, caps:[64,256] },
  { key:"galaxy-tab-s9-ultra", maker:"samsung", kind:"tablet", name:"갤럭시 탭 S9 Ultra", year:2023, caps:[256,512,1024] },
  { key:"galaxy-tab-s9-plus",  maker:"samsung", kind:"tablet", name:"갤럭시 탭 S9+",     year:2023, caps:[256,512] },
  { key:"galaxy-tab-s9",       maker:"samsung", kind:"tablet", name:"갤럭시 탭 S9",      year:2023, caps:[128,256] },

  { key:"apple-watch-s10",   maker:"apple", kind:"watch", name:"애플워치 시리즈 10", year:2024, caps:[] },
  { key:"apple-watch-s9",    maker:"apple", kind:"watch", name:"애플워치 시리즈 9",  year:2023, caps:[] },
  { key:"apple-watch-ultra2",maker:"apple", kind:"watch", name:"애플워치 울트라 2",  year:2023, caps:[] },
  { key:"galaxy-watch7",     maker:"samsung", kind:"watch", name:"갤럭시 워치7",     year:2024, caps:[] },
  { key:"galaxy-watch6",     maker:"samsung", kind:"watch", name:"갤럭시 워치6",     year:2023, caps:[] },
  { key:"airpods-pro-2",     maker:"apple", kind:"buds",  name:"에어팟 프로 2세대", year:2022, caps:[] },
  { key:"airpods-4",         maker:"apple", kind:"buds",  name:"에어팟 4세대",      year:2024, caps:[] },
  { key:"galaxy-buds3-pro",  maker:"samsung", kind:"buds", name:"갤럭시 버즈3 프로", year:2024, caps:[] },

  { key:"etc-phone",  maker:"etc", kind:"phone",  name:"기타 스마트폰", year:0, caps:[], free:true },
  { key:"etc-tablet", maker:"etc", kind:"tablet", name:"기타 태블릿",   year:0, caps:[], free:true },
  { key:"etc-device", maker:"etc", kind:"watch",  name:"기타 기기",     year:0, caps:[], free:true }
];

window.AM_GRADES = [
  { key:"S", name:"S급 · 미사용", lead:"개봉만 했거나 거의 쓰지 않아 흠이 없습니다." },
  { key:"A", name:"A급 · 생활기스", lead:"가까이 봐야 보이는 잔기스 정도입니다." },
  { key:"B", name:"B급 · 사용감", lead:"눈에 띄는 기스나 눌림이 있지만 기능은 정상입니다." },
  { key:"C", name:"C급 · 사용감 많음", lead:"찍힘 · 변색 · 도색 벗겨짐이 뚜렷합니다." },
  { key:"D", name:"D급 · 파손", lead:"액정 깨짐 · 후면 깨짐 · 휘어짐이 있습니다." }
];

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

window.AM_BUY_PRICE = [];

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

window.amBuyPrice = function(model, cap, grade){
  var L = window.AM_BUY_PRICE || [];
  for(var i = 0; i < L.length; i++){
    var r = L[i];
    if(r.model === model && r.grade === grade &&
       (!r.cap || !cap || r.cap === cap)) return (typeof r.price === "number") ? r.price : null;
  }
  return null;
};

window.amBuyReady = function(){ return (window.AM_BUY_PRICE || []).length > 0; };



window.AM_PRODUCTS = [];

window.AM_SHOP_SAMPLE_ON = true;
window.AM_SHOP_SAMPLES = [
  { id:"sample-ip15p-256-a", model:"iphone-15-pro", cap:256, grade:"A",
    color:"내추럴 티타늄", price:1090000, batt:94, warranty:30,
    parts:["본체","충전 케이블"],
    check:["전원","액정","카메라","스피커","버튼","충전","통화"],
    note:"가까이 봐야 보이는 잔기스가 측면에 있습니다. 액정과 후면은 깨끗합니다." },
  { id:"sample-ip14-128-b", model:"iphone-14", cap:128, grade:"B",
    color:"미드나이트", price:620000, batt:86, warranty:30,
    parts:["본체"],
    check:["전원","액정","카메라","스피커","버튼","충전","통화"],
    note:"후면 하단에 눌림이 있습니다. 기능은 전부 정상입니다." },
  { id:"sample-s24u-512-s", model:"galaxy-s24-ultra", cap:512, grade:"S",
    color:"티타늄 그레이", price:1240000, batt:100, warranty:30,
    parts:["본체","충전 케이블","박스"],
    check:["전원","액정","카메라","스피커","버튼","충전","통화","S펜"],
    note:"개봉만 한 미사용 기기입니다." },
  { id:"sample-s23-256-a", model:"galaxy-s23", cap:256, grade:"A",
    color:"크림", price:540000, batt:91, warranty:30,
    parts:["본체","충전 케이블"],
    check:["전원","액정","카메라","스피커","버튼","충전","통화"],
    note:"보호 필름을 붙여 쓰던 기기로 액정에 흠이 없습니다." },
  { id:"sample-ipad-air11-128-a", model:"ipad-air-11-m2", cap:128, grade:"A",
    color:"스페이스 그레이", price:460000, batt:93, warranty:30,
    parts:["본체","충전 케이블"],
    check:["전원","액정","카메라","스피커","버튼","충전"],
    note:"잔기스 정도이고 화면은 깨끗합니다." },
  { id:"sample-watch-s9-s", model:"apple-watch-s9", cap:0, grade:"S",
    color:"미드나이트", price:390000, batt:98, warranty:30,
    parts:["본체","밴드","충전 케이블"],
    check:["전원","액정","버튼","충전","심박센서"],
    note:"거의 쓰지 않은 기기입니다." }
];

window.AM_SHOP_PRICE = [
  { k:"a", name:"40만원 이하",   max:400000 },
  { k:"b", name:"40~60만원",     min:400000, max:600000 },
  { k:"c", name:"60~80만원",     min:600000, max:800000 },
  { k:"d", name:"80~100만원",    min:800000, max:1000000 },
  { k:"e", name:"100만원 이상",  min:1000000 }
];

window.amShopReady = function(){ return (window.AM_PRODUCTS || []).length > 0; };

window.amShopSampleOn = function(){
  return !window.amShopReady() && window.AM_SHOP_SAMPLE_ON !== false &&
         (window.AM_SHOP_SAMPLES || []).length > 0;
};

window.amShopOne = function(id){
  var real = (window.AM_PRODUCTS || []).filter(function(x){ return x.id === id; })[0];
  if(real) return { it:real, sample:false };
  var sp = (window.AM_SHOP_SAMPLES || []).filter(function(x){ return x.id === id; })[0];
  if(sp && window.amShopSampleOn()) return { it:sp, sample:true };
  return null;
};

window.amShopList = function(f){
  f = f || {};
  var base = window.amShopReady() ? (window.AM_PRODUCTS || [])
           : (window.amShopSampleOn() ? (window.AM_SHOP_SAMPLES || []) : []);
  var q = String(f.q || "").trim().toLowerCase();
  var qn = q.replace(/\s+/g, "");
  return base.filter(function(p){
    var md = (typeof amModel === "function") ? amModel(p.model) : null;
    if(f.kind && (!md || md.kind !== f.kind)) return false;
    if(f.maker && (!md || md.maker !== f.maker)) return false;
    if(f.grade && p.grade !== f.grade) return false;
    if(f.price){
      var r = (window.AM_SHOP_PRICE || []).filter(function(x){ return x.k === f.price; })[0];

      if(r && !window.amInRange(p.price, r)) return false;
    }
    if(qn){

      var hay = [(md ? md.name : ""), p.color || "",
                 (typeof amMakerName === "function" && md ? amMakerName(md.maker) : ""),
                 (typeof amKindName === "function" && md ? amKindName(md.kind) : "")
                ].join(" ").toLowerCase().replace(/\s+/g, "");
      if(hay.indexOf(qn) < 0) return false;
    }
    return true;
  });
};

window.amShopName = function(p){
  var md = (typeof amModel === "function") ? amModel(p.model) : null;
  var cap = p.cap ? (p.cap >= 1024 ? (p.cap/1024)+"TB" : p.cap+"GB") : "";
  return [(md ? md.name : p.model), cap].filter(Boolean).join(" ");
};

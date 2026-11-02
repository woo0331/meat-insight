

window.AM_PROVIDERS = [];

window.AM_REVIEW_BADGES = {
  consult:  "상담 인증",
  contract: "계약 인증",
  deal:     "거래 인증",
  pay:      "결제 인증"
};

window.AM_REVIEW_AXES = [
  { key:"total",    name:"전체 만족도" },
  { key:"price",    name:"가격 만족도" },
  { key:"speed",    name:"응답속도" },
  { key:"pro",      name:"전문성" },
  { key:"schedule", name:"일정 준수" },
  { key:"again",    name:"재이용 의향" }
];

window.amProvider = function(id){
  var r = (window.AM_PROVIDERS||[]).filter(function(p){ return p.id === id; });
  return r.length ? r[0] : null;
};

window.amProviderStats = function(p){
  if(!p) return null;
  var rv = p.reviews || [];
  var pf = p.portfolio || [];
  var s = { reviews: rv.length, jobs: pf.length, rating: null };
  if(rv.length){
    var sum = rv.reduce(function(a, r){ return a + ((r.score||{}).total || 0); }, 0);
    s.rating = Math.round((sum / rv.length) * 10) / 10;
  }
  return s;
};

window.AM_VERIFY = [
  { key:"biz",       name:"사업자 확인",  what:"사업자등록증" },
  { key:"owner",     name:"대표자 확인",  what:"대표자 신원" },
  { key:"phone",     name:"전화 확인",    what:"연락 가능한 번호" },
  { key:"addr",      name:"주소 확인",    what:"사업장 소재지" },
  { key:"license",   name:"면허 확인",    what:"사업에 필요한 면허 · 자격" },
  { key:"insurance", name:"보험 가입",    what:"영업배상책임보험 등" }
];

window.amProviderBrandAxis = function(){
  return (window.amShopMakers ? window.amShopMakers() : []);
};

window.AM_PROVIDER_SCALE = [
  { key:"small", name:"소량",   what:"한 번에 몇 대까지 — 개인 손님 위주" },
  { key:"mid",   name:"중형",   what:"수십 대 단위까지 한 번에 받습니다" },
  { key:"large", name:"대량",   what:"수백 대 이상 · 기업 · 법인 물량까지" }
];

window.amProviderScale = function(p){
  var k = p && p.scale;
  if(!k) return null;
  var r = (window.AM_PROVIDER_SCALE || []).filter(function(x){ return x.key === k; });
  return r.length ? r[0] : null;
};

window.amProviderBrandNames = function(p){
  var ax = window.amProviderBrandAxis();
  return (p && p.brands || []).map(function(k){
    var r = ax.filter(function(x){ return x.key === k; });
    return r.length ? r[0].name : "";
  }).filter(Boolean);
};

window.amProviderCanFix = function(p){
  if(!p) return false;
  var c = window.amCat ? window.amCat("fix") : null;
  return c ? window.amProviderInCat(p, c) : false;
};

window.amProviderVerified = function(p){
  var v = (p && p.verified) || {};

  return (window.AM_VERIFY || []).filter(function(x){ return v[x.key]; })
    .map(function(x){ return x.name; });
};

window.amProviderBadges = function(p){
  var out = window.amProviderVerified(p);

  var n = ((p && p.portfolio) || []).length;
  if(n) out.push("포트폴리오 " + n + "건");
  return out;
};

window.amMaskName = function(n){
  n = String(n || "").trim();
  if(!n) return "";
  if(n.length === 1) return n;
  return n.charAt(0) + new Array(n.length).join("○");
};

window.amProviderInCat = function(p, cat){
  var keys = ((cat && cat.items) || []).map(function(i){ return i.key; });
  if(!keys.length) return false;
  return (p.subs || []).some(function(s){ return keys.indexOf(s) >= 0; });
};

window.amProviders = function(f){
  f = f || {};
  var cat = f.cat ? (window.amCat ? amCat(f.cat) : null) : null;
  return (window.AM_PROVIDERS||[]).filter(function(p){
    if(f.cat      && !window.amProviderInCat(p, cat)) return false;
    if(f.sub      && (p.subs||[]).indexOf(f.sub) < 0) return false;
    if(f.industry && (p.industries||[]).length &&
       (p.industries||[]).indexOf(f.industry) < 0) return false;
    if(f.region   && (p.regions||[]).length &&
       (p.regions||[]).indexOf(f.region) < 0) return false;

    if(f.verified && !window.amProviderVerified(p).length) return false;
    if(f.folio    && !((p.portfolio||[]).length)) return false;

    return true;
  });
};

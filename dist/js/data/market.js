

window.AM_STORES = [];
window.AM_ASSETS = [];

window.AM_DEAL_KINDS = [
  { key:"single", name:"개별 판매" },
  { key:"bulk",   name:"일괄 판매" },
  { key:"all",    name:"시설 전체 인수" }
];

window.amStore = function(id){
  var r = (window.AM_STORES||[]).filter(function(s){ return s.id === id; });
  return r.length ? r[0] : null;
};
window.amAsset = function(id){
  var r = (window.AM_ASSETS||[]).filter(function(a){ return a.id === id; });
  return r.length ? r[0] : null;
};

window.AM_STORE_RANGES = [
  { key:"py", name:"면적", unit:"평", field:"pyeong", opts:[
    { k:"a", name:"10평 이하",   max:10 },
    { k:"b", name:"10~20평",    min:10, max:20 },
    { k:"c", name:"20~30평",    min:20, max:30 },
    { k:"d", name:"30~50평",    min:30, max:50 },
    { k:"e", name:"50평 이상",   min:50 }
  ]},
  { key:"dp", name:"보증금", unit:"만원", field:"deposit", opts:[
    { k:"a", name:"1천만원 이하",  max:1000 },
    { k:"b", name:"1천~3천만원",   min:1000, max:3000 },
    { k:"c", name:"3천~5천만원",   min:3000, max:5000 },
    { k:"d", name:"5천만원~1억",   min:5000, max:10000 },
    { k:"e", name:"1억 이상",      min:10000 }
  ]},
  { key:"rt", name:"월세", unit:"만원", field:"rent", opts:[
    { k:"a", name:"100만원 이하",  max:100 },
    { k:"b", name:"100~200만원",   min:100, max:200 },
    { k:"c", name:"200~300만원",   min:200, max:300 },
    { k:"d", name:"300~500만원",   min:300, max:500 },
    { k:"e", name:"500만원 이상",   min:500 }
  ]},
  { key:"pm", name:"권리금", unit:"만원", field:"premium", opts:[

    { k:"z", name:"무권리",        max:0 },

    { k:"a", name:"1천만원 이하",  min:0, max:1000 },
    { k:"b", name:"1천~3천만원",   min:1000, max:3000 },
    { k:"c", name:"3천~5천만원",   min:3000, max:5000 },
    { k:"d", name:"5천만원 이상",   min:5000 }
  ]},

  { key:"yr", name:"영업기간", unit:"년",
    get:function(s){
      var y = Number(s && s.since);
      if(!isFinite(y) || !y) return null;
      var n = new Date().getFullYear() - y;
      return n < 0 ? null : n;
    }, opts:[
    { k:"a", name:"1년 이하",   max:1 },
    { k:"b", name:"1~3년",     min:1,  max:3 },
    { k:"c", name:"3~5년",     min:3,  max:5 },
    { k:"d", name:"5~10년",    min:5,  max:10 },
    { k:"e", name:"10년 이상",  min:10 }
  ]}
];

window.amInRange = function(val, opt){
  if(val == null || !opt) return false;
  var n = Number(val);
  if(!isFinite(n)) return false;
  if(opt.min != null && n <= opt.min) return false;
  if(opt.max != null && n >  opt.max) return false;
  return true;
};
window.amStoreRange = function(key, k){
  var g = (window.AM_STORE_RANGES||[]).filter(function(x){ return x.key === key; })[0];
  if(!g) return null;
  var o = (g.opts||[]).filter(function(x){ return x.k === k; })[0];
  return o ? { group:g, opt:o } : null;
};

window.amStores = function(f){
  f = f || {};
  return (window.AM_STORES||[]).filter(function(s){
    if(f.industry && s.industry !== f.industry) return false;
    if(f.region   && s.region   !== f.region)   return false;
    if(f.withEquip && !s.withEquip) return false;

    if(f.parking  && !s.parking) return false;
    if(f.kind     && s.kind !== f.kind) return false;

    var ok = true;
    (window.AM_STORE_RANGES||[]).forEach(function(g){
      if(!ok) return;
      var pick = f[g.key];
      if(!pick) return;
      var r = window.amStoreRange(g.key, pick);
      if(!r) return;

      var val = g.get ? g.get(s) : s[g.field];
      if(!window.amInRange(val, r.opt)) ok = false;
    });
    return ok;
  });
};

window.AM_ASSET_PRICE = [
  { k:"a", name:"50만원 이하",   max:50 },
  { k:"b", name:"50~150만원",   min:50,  max:150 },
  { k:"c", name:"150~300만원",  min:150, max:300 },
  { k:"d", name:"300~500만원",  min:300, max:500 },
  { k:"e", name:"500만원 이상",  min:500 }
];

window.amAssets = function(f){
  f = f || {};
  return (window.AM_ASSETS||[]).filter(function(a){
    if(f.industry && a.industry !== f.industry) return false;
    if(f.region   && a.region   !== f.region)   return false;
    if(f.cat      && a.cat      !== f.cat)      return false;
    if(f.sub      && a.sub      !== f.sub)      return false;
    if(f.deal     && a.deal     !== f.deal)     return false;

    if(f.pr){
      var o = (window.AM_ASSET_PRICE||[]).filter(function(x){ return x.k === f.pr; })[0];
      if(o && !window.amInRange(a.price, o)) return false;
    }
    return true;
  });
};

window.amMatchForStartup = function(industryKey, regionKey){
  return {
    stores: amStores({ industry:industryKey, region:regionKey }),
    assets: amAssets({ industry:industryKey, region:regionKey })
  };
};

window.AM_QUOTE_STATS = [];
window.amQuoteStats = function(){
  return (window.AM_QUOTE_STATS||[]).filter(function(q){
    return q && q.range && q.asOf && (q.n || 0) >= 10;
  });
};

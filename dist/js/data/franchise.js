

window.AM_FRANCHISE_CATS = [
  { key:"food",     name:"외식",        icon:"utensils", tone:"t1", ind:"restaurant" },
  { key:"cafe",     name:"카페 · 디저트", icon:"cup",     tone:"t2", ind:"cafe" },
  { key:"bar",      name:"주점",        icon:"glass",    tone:"t8", ind:"bar" },
  { key:"retail",   name:"소매",        icon:"cart",     tone:"t5", ind:"retail" },
  { key:"service",  name:"서비스",      icon:"hand",     tone:"t7", ind:"office" },
  { key:"academy",  name:"교육",        icon:"book",     tone:"t7", ind:"academy" },
  { key:"beauty",   name:"뷰티",        icon:"sparkle",  tone:"t8", ind:"beauty" },
  { key:"gym",      name:"헬스",        icon:"dumbbell", tone:"t5", ind:"gym" },
  { key:"pet",      name:"반려동물",     icon:"paw",      tone:"t4", ind:"pet" },
  { key:"unmanned", name:"무인",        icon:"robot",    tone:"t5", ind:"unmanned" },
  { key:"stay",     name:"숙박",        icon:"bed",      tone:"t7", ind:"stay" },
  { key:"etc",      name:"기타",        icon:"plus",     tone:"t3" }
];

window.AM_FRANCHISES = [];

window.amFranchiseCat = function(key){
  var r = AM_FRANCHISE_CATS.filter(function(c){ return c.key === key; });
  return r.length ? r[0] : null;
};

window.amFranchiseCost = function(f){
  var c = (f && f.cost) || {};
  return (c.source && c.asOf) ? c : null;
};

window.amFranchise = function(slug){
  var r = (window.AM_FRANCHISES||[]).filter(function(f){ return f.slug === slug; });
  return r.length ? r[0] : null;
};
window.amFranchises = function(f){
  f = f || {};
  return (window.AM_FRANCHISES||[]).filter(function(x){
    if(f.cat    && x.cat !== f.cat) return false;
    if(f.region && (x.regions||[]).length &&
       (x.regions||[]).indexOf(f.region) < 0) return false;
    return true;
  });
};

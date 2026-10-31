

window.AM_PICK_EASY = {
  "area":      "가게 자리 알아보기",
  "interior":  "가게 인테리어",

  "equip":     "매장 기계 · 설비",
  "admin":     "사업자 등록 · 허가",
  "fund":      "창업 자금 · 대출",
  "marketing": "마케팅 · 홍보",
  "item":      "무엇을 팔지 정하기",
  "store":     "가게 자리 찾기",
  "furniture": "매장 가구 · 집기",
  "it":        "POS · 인터넷 · CCTV",
  "supply":    "재료 · 소모품 들이기",
  "repair":    "기계 고치기 · 점검",
  "staff":     "직원 구하기",
  "clean":     "청소 · 방역"
};

var PICK_ART = {

  furniture: "sofa"
};

function catSubTo(c, sub){
  var base = (typeof window.catTo === "function") ? window.catTo(c)
    : (c.to ? c.to : ((c.kind === "provider")
        ? "/providers/" + c.key : "/c/" + c.key));
  if(!sub) return base;
  return base + (base.indexOf("?") < 0 ? "?" : "&") + "s=" + encodeURIComponent(sub);
}

function pickArtOf(cat){
  return PICK_ART[cat] || "";
}

window.amPickSplit = function(id){
  var s = String(id || "").split("/");
  return { cat: s[0] || "", sub: (s.length > 1 ? s[1] : "") };
};

window.amPickWrap = function(c, sub){
  if(!c) return null;
  if(sub && sub.key) return {
    id:   c.key + "/" + sub.key,
    cat:  c.key,
    sub:  sub.key,
    name: sub.name,
    easy: window.AM_PICK_EASY[c.key + "/" + sub.key] || "",
    lead: "",

    desc: c.name,
    ia:   pickArtOf(c.key),
    icon: (sub.icon || c.icon || "check"),
    tone: c.tone || "t7",
    to:   catSubTo(c, sub.key),
    ask:  !!(window.AM_REQ_FORMS && window.AM_REQ_FORMS[c.key])
  };
  return {
    id:   c.key,
    cat:  c.key,
    sub:  "",
    name: c.name,
    easy: window.AM_PICK_EASY[c.key] || "",
    lead: c.lead || "",
    desc: c.desc || "",
    ia:   pickArtOf(c.key),
    icon: c.icon || "check",
    tone: c.tone || "t7",
    to:   (typeof window.catTo === "function") ? window.catTo(c)
          : (c.to ? c.to : ((c.kind === "provider")
              ? "/providers/" + c.key : "/c/" + c.key)),

    ask:  !!(window.AM_REQ_FORMS && window.AM_REQ_FORMS[c.key])
  };
};

window.amPickOne = function(id){
  if(!id) return null;
  var p = window.amPickSplit(id);
  var c = (typeof window.amCat === "function") ? window.amCat(p.cat) : null;
  if(!c) return null;
  if(!p.sub) return window.amPickWrap(c);

  var subs = (typeof window.amAllSubs === "function")
    ? window.amAllSubs(c) : (c.items || []);
  var hit = subs.filter(function(s){ return s && s.key === p.sub; })[0];
  return hit ? window.amPickWrap(c, hit) : null;
};

window.amPickLabel = function(s){
  return (s && (s.easy || s.name)) || "";
};


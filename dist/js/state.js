

var AM_ST = { asked:false, on:false, pulled:false, at:0, busy:false,
              timer:null, want:{} };

function amStateLog(e){

  try{ console.warn("[state] " + e); }catch(_){}
}

function amStateLocal(){
  var pick = (typeof amPickGet === "function") ? amPickGet() : [];
  var draft = null, checks = [];
  try{
    var d = JSON.parse(localStorage.getItem("am.draft.v1") || "null");
    if(d && d.f) draft = d.f;
  }catch(e){}
  try{
    var c = JSON.parse(localStorage.getItem("am.opsck.v1") || "null");
    if(c && c.done) checks = c.done;
  }catch(e){}
  return { pick:pick, draft:draft, checks:checks };
}

function amStateEmpty(L){
  return !L.pick.length && !L.checks.length &&
         (!L.draft || !Object.keys(L.draft).length);
}

function amStateApply(st){
  if(!st) return;
  AM_ST.pulled = true;
  try{
    if(Array.isArray(st.pick) && st.pick.length && typeof amPickSet === "function")
      amPickSet(st.pick);
    if(st.draft && Object.keys(st.draft).length)
      localStorage.setItem("am.draft.v1",
        JSON.stringify({ f:st.draft, at:Date.parse(st.updated_at) || Date.now() }));
    if(Array.isArray(st.checks) && st.checks.length)
      localStorage.setItem("am.opsck.v1",
        JSON.stringify({ done:st.checks, at:Date.parse(st.updated_at) || Date.now() }));
  }catch(e){ amStateLog("내려받은 것을 못 적었습니다 — " + e); }
  AM_ST.pulled = false;

  try{ if(typeof pickPaint === "function") pickPaint(); }catch(e){}
  try{ if(typeof quoteDraftPaint === "function") quoteDraftPaint(); }catch(e){}
  try{ if(typeof opsCheckPaint === "function") opsCheckPaint(); }catch(e){}
}

function amStatePush(){
  if(!AM_ST.on) return Promise.resolve(false);
  if(AM_ST.busy){ AM_ST.timer = AM_ST.timer || setTimeout(amStateKick, 900); return Promise.resolve(false); }
  var L = amStateLocal(), args = {};
  if(AM_ST.want.pick)   args.p_pick   = L.pick;
  if(AM_ST.want.draft)  args.p_draft  = L.draft || {};
  if(AM_ST.want.checks) args.p_checks = L.checks;
  if(!Object.keys(args).length) return Promise.resolve(false);
  AM_ST.want = {};
  AM_ST.busy = true;
  return fetch("/api/deal", {
    method:"POST",
    headers: Object.assign({ "content-type":"application/json" },
      (typeof amAuthHeaders === "function") ? amAuthHeaders() : {}),
    body: JSON.stringify({ fn:"save_user_state", args:args })
  }).then(function(r){ return r.json().catch(function(){ return null; }); })
    .then(function(d){
      AM_ST.busy = false;

      if(!d || !d.ok){ amStateLog("저장 — " + ((d && d.error) || "실패")); return false; }
      AM_ST.at = Date.now();
      try{ if(typeof quoteDraftPaint === "function") quoteDraftPaint(); }catch(e){}
      return true;
    })
    .catch(function(e){ AM_ST.busy = false; amStateLog("저장 — " + e); return false; });
}

function amStateKick(){ AM_ST.timer = null; amStatePush(); }

window.amStateTouch = function(part){
  if(!AM_ST.on || AM_ST.pulled) return;
  AM_ST.want[part || "pick"] = 1;
  if(AM_ST.timer) clearTimeout(AM_ST.timer);
  AM_ST.timer = setTimeout(amStateKick, 1200);
};

window.amStateSync = function(){
  if(AM_ST.asked) return Promise.resolve(AM_ST);
  AM_ST.asked = true;
  if(typeof amAuthAsk !== "function") return Promise.resolve(AM_ST);
  return amAuthAsk().then(function(a){

    if(!a || !a.on || !a.signedIn) return AM_ST;
    AM_ST.on = true;
    return fetch("/api/me?s=1", { headers: Object.assign(
      { accept:"application/json" },
      (typeof amAuthHeaders === "function") ? amAuthHeaders() : {}) })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){
        if(!d || !d.signedIn){ AM_ST.on = false; return AM_ST; }
        var L = amStateLocal();
        if(amStateEmpty(L)){

          amStateApply(d.state);
          if(d.state && d.state.updated_at)
            AM_ST.at = Date.parse(d.state.updated_at) || 0;
        }else{

          AM_ST.want = { pick:1, draft:1, checks:1 };
          amStatePush();
        }
        return AM_ST;
      })
      .catch(function(e){ amStateLog("/api/me?s=1 — " + e); AM_ST.on = false; return AM_ST; });
  }).catch(function(){ return AM_ST; });
};

window.amStateDrop = function(part){
  if(!AM_ST.on) return;
  if(amStateEmpty(amStateLocal())){ amStateClear(); return; }
  amStateTouch(part);
};

window.amStateOn = function(){ return !!(AM_ST.on && AM_ST.at); };

window.amStateClear = function(){
  if(!AM_ST.on) return Promise.resolve(false);
  AM_ST.at = 0;
  return fetch("/api/deal", {
    method:"POST",
    headers: Object.assign({ "content-type":"application/json" },
      (typeof amAuthHeaders === "function") ? amAuthHeaders() : {}),
    body: JSON.stringify({ fn:"clear_user_state", args:{} })
  }).then(function(r){ return r.ok; })
    .catch(function(e){ amStateLog("지우기 — " + e); return false; });
};

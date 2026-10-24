

var AM_AUTH_KEY = "am.auth.v1";

var AM_AUTH = { asked:false, on:false, signedIn:false, role:"", name:"",
                provider:null, conf:null };
var AM_AUTH_FLY = null;

function amAuthSave(t){
  try{ localStorage.setItem(AM_AUTH_KEY, JSON.stringify(t)); }catch(e){}
}
function amAuthLoad(){
  var t = null;
  try{ var v = localStorage.getItem(AM_AUTH_KEY); t = v ? JSON.parse(v) : null; }
  catch(e){ return null; }
  if(!t || !t.access_token) return null;
  return t;
}
function amAuthClear(){
  try{ localStorage.removeItem(AM_AUTH_KEY); }catch(e){}
}

function amAuthTakeHash(){
  var h = "";
  try{ h = String(window.location.hash || ""); }catch(e){ return false; }
  if(h.indexOf("access_token=") < 0) return false;
  var q = {}, i;
  h.replace(/^#/, "").split("&").forEach(function(kv){
    i = kv.indexOf("=");
    if(i > 0) q[decodeURIComponent(kv.slice(0,i))] = decodeURIComponent(kv.slice(i+1));
  });
  if(!q.access_token) return false;
  amAuthSave({
    access_token:  q.access_token,
    refresh_token: q.refresh_token || "",

    at: Date.now() + (parseInt(q.expires_in, 10) || 3600) * 1000
  });
  try{
    window.history.replaceState({}, "",
      window.location.pathname + window.location.search);
  }catch(e){}
  return true;
}

function amAuthToken(){
  var t = amAuthLoad();
  if(!t) return "";

  if(t.at && Date.now() > t.at - 60000) return "";
  return t.access_token;
}

window.amAuthHeaders = function(){
  var tk = amAuthToken();
  return tk ? { authorization: "Bearer " + tk } : {};
};

function amAuthRefresh(){
  var t = amAuthLoad(), c = AM_AUTH.conf;
  if(!t || !t.refresh_token || !c) return Promise.resolve(false);
  return fetch(c.url + "/auth/v1/token?grant_type=refresh_token", {
    method:"POST",
    headers:{ "content-type":"application/json", apikey:c.anonKey },
    body: JSON.stringify({ refresh_token: t.refresh_token })
  }).then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      if(!d || !d.access_token){ amAuthClear(); return false; }
      amAuthSave({ access_token:d.access_token,
                   refresh_token:d.refresh_token || t.refresh_token,
                   at: Date.now() + (d.expires_in || 3600) * 1000 });
      return true;
    })
    .catch(function(){ return false; });
}

window.amAuthAsk = function(force){
  if(AM_AUTH.asked && !force) return Promise.resolve(AM_AUTH);

  if(AM_AUTH_FLY && !force) return AM_AUTH_FLY;
  amAuthTakeHash();
  function ask(){
    return fetch("/api/session", { headers: Object.assign(
      { accept:"application/json" }, window.amAuthHeaders()) })
      .then(function(r){ return r.ok ? r.json() : null; });
  }
  AM_AUTH_FLY = ask().then(function(d){

    if(d && d.auth && !d.signedIn && amAuthLoad()){
      AM_AUTH.conf = d.conf || null;
      return amAuthRefresh().then(function(ok){ return ok ? ask() : d; });
    }
    return d;
  }).then(function(d){
    AM_AUTH.asked = true;
    if(!d){ AM_AUTH.on = false; return AM_AUTH; }
    AM_AUTH.on       = !!d.auth;
    AM_AUTH.signedIn = !!d.signedIn;
    AM_AUTH.role     = d.role || "";
    AM_AUTH.name     = d.name || "";
    AM_AUTH.provider = d.provider || null;
    AM_AUTH.conf     = d.conf || AM_AUTH.conf;
    return AM_AUTH;
  }).catch(function(e){

    try{ console.warn("[auth] /api/session — " + e); }catch(_){}
    AM_AUTH.asked = true; AM_AUTH.on = false;
    return AM_AUTH;
  });

  return AM_AUTH_FLY.then(function(a){ AM_AUTH_FLY = null; return a; },
                          function(e){ AM_AUTH_FLY = null; throw e; });
};

window.amAuthNow = function(){ return AM_AUTH; };

window.amAuthSend = function(email){
  var c = AM_AUTH.conf;
  if(!c) return Promise.resolve({ ok:false, say:"지금은 로그인할 수 없습니다" });
  var to = String(email || "").trim();
  if(!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(to))
    return Promise.resolve({ ok:false, say:"메일 주소를 확인해 주세요" });
  return fetch(c.url + "/auth/v1/otp", {
    method:"POST",
    headers:{ "content-type":"application/json", apikey:c.anonKey },
    body: JSON.stringify({
      email: to,

      options: { email_redirect_to: window.location.origin + window.location.pathname }
    })
  }).then(function(r){
    if(r.ok) return { ok:true, say:"메일로 로그인 링크를 보냈습니다. 받은 편지함을 확인해 주세요." };

    if(r.status === 429)
      return { ok:false, say:"조금 뒤에 다시 눌러 주세요." };
    return { ok:false, say:"지금 보내지 못했습니다. 잠시 뒤 다시 눌러 주세요." };
  }).catch(function(){
    return { ok:false, say:"연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요." };
  });
};

window.amAuthOut = function(){
  var c = AM_AUTH.conf, tk = amAuthToken();
  var done = function(){
    amAuthClear();
    AM_AUTH.signedIn = false; AM_AUTH.role = ""; AM_AUTH.name = "";
    AM_AUTH.provider = null;
  };
  if(!c || !tk){ done(); return Promise.resolve(); }
  return fetch(c.url + "/auth/v1/logout", {
    method:"POST",
    headers:{ apikey:c.anonKey, authorization:"Bearer " + tk }
  }).catch(function(){}).then(done);
};

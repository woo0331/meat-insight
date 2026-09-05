/* ════════════════════════════════════════════════════════════════════
   고리 (aboutmeat.co.kr) — PHASE 2 애플리케이션
   요청 등록 → 조건 매칭 → 견적·지원 도착 → 비교 → 선택 → 거래 → 후기

   · index.html 의 기존 코드(전역 함수·Supabase 클라이언트 sb)를 그대로 사용합니다.
   · 기존 함수는 삭제하지 않고 window.<name> 재할당으로 확장합니다.
   · 신규 DB 컬럼/테이블이 아직 없어도 동작하도록 자동으로 물러섭니다.
     (db/phase2_schema.sql 실행 전에도 사이트가 깨지지 않습니다)
   ════════════════════════════════════════════════════════════════════ */
(function(){
"use strict";

var G = window.GORI = {};
var NEW_TABLES = ["quotes","reviews","day_jobs","day_job_applications","worker_profiles","favorites","notifications"];
var SCHEMA = G.SCHEMA = {};          // 테이블 존재 여부
var ME = G.ME = { user:null, name:"", email:"" };
var NOTIFS = [];

/* ── 기본 유틸 ────────────────────────────────────────────── */
function $(id){ return document.getElementById(id); }
function esc(v){ return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function num(v){ var n=parseFloat(String(v==null?"":v).replace(/[^0-9.\-]/g,"")); return isNaN(n)?null:n; }
function won(n){ return (n==null||isNaN(n))?"—":Number(n).toLocaleString("ko-KR"); }
function today(){ var d=new Date(); return d.toISOString().slice(0,10); }
function dday(dstr){
  if(!dstr) return "";
  var d=new Date(dstr+"T00:00:00"), t=new Date(); t.setHours(0,0,0,0);
  var diff=Math.round((d-t)/86400000);
  if(diff===0) return "오늘"; if(diff===1) return "내일"; if(diff===2) return "모레";
  return diff<0 ? Math.abs(diff)+"일 지남" : "D-"+diff;
}
function fmtDate(dstr){ if(!dstr) return "—"; var d=new Date(dstr); if(isNaN(d)) return dstr; return (d.getMonth()+1)+"월 "+d.getDate()+"일"; }
function ago(iso){ return (typeof relTime==="function") ? relTime(iso) : ""; }
function toast(msg, kind){
  var el=$("g-toast");
  if(!el){ el=document.createElement("div"); el.id="g-toast";
    el.style.cssText="position:fixed;left:50%;transform:translateX(-50%);bottom:88px;z-index:1200;padding:13px 20px;border-radius:10px;font-size:14px;font-weight:700;box-shadow:0 6px 24px rgba(0,0,0,.18);display:none;max-width:88vw;text-align:center;line-height:1.5;";
    document.body.appendChild(el); }
  el.textContent=msg;
  el.style.background = kind==="err" ? "#C62828" : (kind==="ok" ? "#1B5E20" : "#111315");
  el.style.color="#fff"; el.style.display="block";
  clearTimeout(el._t); el._t=setTimeout(function(){ el.style.display="none"; }, 2800);
}
G.toast = toast;

function setMsg(id, text, kind){
  var el=$(id); if(!el) return;
  el.textContent=text; el.className="gmsg on "+(kind||"info");
}
function clearMsg(id){ var el=$(id); if(el) el.className="gmsg"; }

function stars(rating, readonly){
  var r=Math.round(Number(rating)||0), h='<span class="stars'+(readonly?" ro":"")+'">';
  for(var i=1;i<=5;i++) h+='<span'+(i<=r?' class="on"':'')+'>★</span>';
  return h+"</span>";
}
G.stars = stars;

/* ── Supabase 접근 (스키마가 없어도 안전하게) ──────────────── */
function client(){ return (typeof sb!=="undefined" && sb) ? sb : null; }
G.client = client;

/* PostgREST 오류 구분
   · 테이블 없음  : PGRST205 / 42P01 / "Could not find the table '…' in the schema cache"
   · 컬럼 없음    : PGRST204 / "Could not find the 'x' column of 'y' in the schema cache"
   두 메시지 모두 "schema cache" 를 포함하므로 컬럼 여부를 먼저 판별합니다. */
function missingColumnOf(err){
  if(!err) return null;
  var m=(err.message||"")+" "+(err.details||"")+" "+(err.hint||"");
  var mm = m.match(/'([A-Za-z0-9_]+)'\s+column/) || m.match(/column\s+"?([A-Za-z0-9_]+)"?\s+.*does not exist/i);
  return mm ? mm[1] : null;
}
function isMissingTable(err){
  if(!err) return false;
  if(missingColumnOf(err)) return false;
  var m=(err.message||"")+" "+(err.code||"")+" "+(err.details||"");
  return /42P01|PGRST205|Could not find the table|relation .* does not exist/i.test(m);
}

/* 신규 컬럼이 아직 없으면 그 컬럼만 빼고 다시 시도합니다.
   → 마이그레이션 전에도 요청 등록이 실패하지 않습니다. */
async function insertSafe(table, payload){
  var c=client(); if(!c) return { error:{ message:"서버에 연결되어 있지 않습니다." } };
  var body=Object.assign({}, payload), dropped=[];
  for(var i=0;i<14;i++){
    var res = await c.from(table).insert(body).select();
    if(!res.error) return { data:res.data, dropped:dropped };
    if(isMissingTable(res.error)) return { error:res.error, missingTable:true };
    var col=missingColumnOf(res.error);
    if(col && Object.prototype.hasOwnProperty.call(body,col)){ delete body[col]; dropped.push(col); continue; }
    return { error:res.error };
  }
  return { error:{ message:"저장에 실패했습니다." } };
}
async function updateSafe(table, patch, idCol, idVal){
  var c=client(); if(!c) return { error:{ message:"서버에 연결되어 있지 않습니다." } };
  var body=Object.assign({}, patch);
  for(var i=0;i<10;i++){
    var res = await c.from(table).update(body).eq(idCol, idVal);
    if(!res.error) return { ok:true };
    if(isMissingTable(res.error)) return { error:res.error, missingTable:true };
    var col=missingColumnOf(res.error);
    if(col && Object.prototype.hasOwnProperty.call(body,col)){ delete body[col]; continue; }
    return { error:res.error };
  }
  return { error:{ message:"수정에 실패했습니다." } };
}
G.insertSafe=insertSafe; G.updateSafe=updateSafe;

async function selectSafe(table, build){
  var c=client(); if(!c) return { data:[], unavailable:true };
  try{
    var q=c.from(table).select("*");
    if(build) q=build(q);
    var res=await q;
    if(res.error){ if(isMissingTable(res.error)){ SCHEMA[table]=false; return { data:[], unavailable:true }; } return { data:[], error:res.error }; }
    SCHEMA[table]=true;
    return { data:res.data||[] };
  }catch(e){ return { data:[], unavailable:true }; }
}
G.selectSafe=selectSafe;

/* 신규 테이블 존재 여부 사전 확인 */
async function probeSchema(){
  var c=client(); if(!c){ NEW_TABLES.forEach(function(t){ SCHEMA[t]=false; }); return; }
  await Promise.all(NEW_TABLES.map(async function(t){
    try{
      var r=await c.from(t).select("id").limit(1);
      SCHEMA[t] = !(r.error && isMissingTable(r.error));
    }catch(e){ SCHEMA[t]=false; }
  }));
}
G.probeSchema=probeSchema;

function setupNote(what, file){
  return '<div class="setup-note"><b>'+esc(what)+' 기능을 쓰려면 DB 준비가 필요합니다.</b><br>'+
    'Supabase 대시보드 → SQL Editor 에서 저장소의 <code>db/'+esc(file||"phase2_schema.sql")+'</code> 을 실행해 주세요. '+
    '기존 테이블·데이터는 그대로 두고 필요한 테이블만 추가합니다.</div>';
}
G.setupNote=setupNote;

/* ── 인증 세션 ────────────────────────────────────────────── */
async function loadSession(){
  var c=client(); if(!c || !c.auth) return;
  try{
    var r=await c.auth.getSession();
    var u=r && r.data && r.data.session ? r.data.session.user : null;
    setUser(u);
    if(c.auth.onAuthStateChange){
      c.auth.onAuthStateChange(function(_e, session){ setUser(session?session.user:null); });
    }
  }catch(e){}
}
function setUser(u){
  ME.user=u||null;
  ME.email=u?(u.email||""):"";
  ME.name=u?((u.user_metadata&&u.user_metadata.name)||(u.email||"").split("@")[0]):"";
  ME.role=u?((u.user_metadata&&u.user_metadata.role)||"buyer"):null;
  renderHeaderUser();
  if(u) loadNotifs();
}
G.setUser=setUser;

async function logout(){
  var c=client(); if(c&&c.auth) { try{ await c.auth.signOut(); }catch(e){} }
  setUser(null); toast("로그아웃했습니다."); if(typeof go==="function") go("h");
}
window.gLogout=logout;

function renderHeaderUser(){
  var box=document.querySelector(".hdr-actions"); if(!box) return;
  if(!ME.user){
    box.innerHTML='<button class="ha-btn ha-login" onclick="openModal(\'login\')">로그인</button>'+
      '<button class="ha-btn ha-ghost" onclick="go(&quot;sj&quot;)">업체 등록</button>'+
      '<button class="ha-btn ha-reg" onclick="go(&quot;rw&quot;)">+ 요청 올리기</button>';
  }else{
    var unread=NOTIFS.filter(function(n){ return !n.is_read; }).length;
    box.innerHTML='<div class="hdr-user">'+
      '<button class="hu-bell" onclick="gToggleNotif(event)" aria-label="알림">'+
        '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/></svg>'+
        (unread?'<span class="hu-dot">'+(unread>9?"9+":unread)+'</span>':'')+
      '</button>'+
      '<span class="hu-name">'+esc(ME.name)+'</span>'+
      '<button class="ha-btn ha-login" onclick="go(&quot;my&quot;)">거래관리</button>'+
      '<button class="ha-btn ha-ghost" onclick="gLogout()">로그아웃</button>'+
      '<button class="ha-btn ha-reg" onclick="go(&quot;rw&quot;)">+ 요청 올리기</button>'+
      '</div><div class="notif-panel" id="notif-panel"></div>';
  }
}
G.renderHeaderUser=renderHeaderUser;

/* ── 알림 ─────────────────────────────────────────────────── */
async function loadNotifs(){
  if(!ME.user || SCHEMA.notifications===false){ return; }
  var r=await selectSafe("notifications", function(q){
    return q.eq("user_id", ME.user.id).order("created_at",{ascending:false}).limit(30);
  });
  NOTIFS = r.data||[];
  renderHeaderUser();
}
async function pushNotif(userId, type, title, body, link){
  if(!userId || SCHEMA.notifications===false) return;
  await insertSafe("notifications", { user_id:userId, type:type, title:title, body:body, link:link||null });
}
G.pushNotif=pushNotif;

window.gToggleNotif=function(ev){
  if(ev) ev.stopPropagation();
  var p=$("notif-panel"); if(!p) return;
  var open=!p.classList.contains("on");
  p.classList.toggle("on", open);
  if(!open) return;
  if(SCHEMA.notifications===false){ p.innerHTML='<div style="padding:16px;">'+setupNote("알림")+'</div>'; return; }
  if(!NOTIFS.length){ p.innerHTML='<div style="padding:26px 16px;text-align:center;font-size:13px;color:var(--ink4);">새 알림이 없습니다</div>'; return; }
  p.innerHTML=NOTIFS.map(function(n){
    return '<div class="nt'+(n.is_read?"":" unread")+'" onclick="gOpenNotif(\''+n.id+'\')">'+
      '<div class="nt-t">'+esc(n.title)+'</div>'+
      (n.body?'<div class="nt-b">'+esc(n.body)+'</div>':'')+
      '<div class="nt-d">'+ago(n.created_at)+'</div></div>';
  }).join("");
};
window.gOpenNotif=async function(id){
  var n=NOTIFS.find(function(x){ return String(x.id)===String(id); });
  if(!n) return;
  if(!n.is_read){ n.is_read=true; await updateSafe("notifications",{is_read:true},"id",id); renderHeaderUser(); }
  var p=$("notif-panel"); if(p) p.classList.remove("on");
  if(n.link) location.hash=n.link;
  if(n.link && n.link.indexOf("req:")===0) window.gOpenRequest(n.link.slice(4));
};
document.addEventListener("click", function(){ var p=$("notif-panel"); if(p) p.classList.remove("on"); });

/* ── 페이지 컨테이너 주입 (HTML 두 파일을 건드리지 않기 위해 JS 로 생성) ── */
var NEW_PAGES = ["reqd","quote","daily","djnew","review","wprof"];
function injectPages(){
  var nav=document.querySelector(".bnav");
  NEW_PAGES.forEach(function(id){
    if($("pg-"+id)) return;
    var d=document.createElement("div");
    d.className="pg"; d.id="pg-"+id;
    d.style.cssText="padding-top:var(--top-pad);padding-bottom:56px;";
    d.innerHTML='<div class="gp'+(id==="reqd"||id==="daily"?" gp-wide":"")+'" id="'+id+'-body"></div>';
    if(nav) document.body.insertBefore(d, nav); else document.body.appendChild(d);
  });
  if(typeof PGS!=="undefined"){ NEW_PAGES.forEach(function(id){ if(PGS.indexOf(id)<0) PGS.push(id); }); }
  if(typeof TM!=="undefined"){
    TM.reqd="reqs"; TM.quote="reqs"; TM.daily="jobs"; TM.djnew="jobs"; TM.review="my"; TM.wprof="my";
  }
}
G.injectPages=injectPages;

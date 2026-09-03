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

function setupNote(what){
  return '<div class="setup-note"><b>'+esc(what)+' 기능을 쓰려면 DB 준비가 필요합니다.</b><br>'+
    'Supabase 대시보드 → SQL Editor 에서 저장소의 <code>db/phase2_schema.sql</code> 을 실행해 주세요. '+
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

/* ════════════════════════════════════════════════════════════════════
   요청 등록 — 3단계
   STEP1 무엇이 필요한지 선택 → STEP2 필요 조건 입력 → STEP3 확인 후 등록
   카테고리에 따라 STEP2 입력 항목이 달라집니다.
   ════════════════════════════════════════════════════════════════════ */

var F = {
  sel:  function(id,l,opts,req){ return {id:id,l:l,t:"select",opts:opts,req:!!req}; },
  txt:  function(id,l,ph,req){ return {id:id,l:l,t:"text",ph:ph,req:!!req}; },
  n:    function(id,l,ph,unit,req){ return {id:id,l:l,t:"number",ph:ph,unit:unit,req:!!req}; },
  money:function(id,l,ph,unit){ return {id:id,l:l,t:"money",ph:ph,unit:unit}; },
  date: function(id,l,req){ return {id:id,l:l,t:"date",req:!!req}; },
  time: function(id,l){ return {id:id,l:l,t:"time"}; },
  chips:function(id,l,opts,req){ return {id:id,l:l,t:"chips",opts:opts,req:!!req}; },
  area: function(id,l,ph){ return {id:id,l:l,t:"textarea",ph:ph}; }
};
var REGIONS=["서울","경기","인천","강원","충북","충남·대전·세종","전북","전남·광주","경북·대구","경남·부산·울산","제주","전국"];
var TEMP=["냉장","냉동","상온","상관없음"];

/* 8개 대분류별 STEP2 입력 항목 */
var REQ_FORMS = {
  meat: [
    F.chips("species","축종",["한우","육우","한돈","수입 소","수입 돼지","오리·닭","기타"],true),
    F.txt("part","부위 / 품목","등심, 삼겹살, 곱창, 지육 …",true),
    F.sel("grade","등급",["상관없음","1++","1+","1등급","2등급","등외","수입 등급"]),
    F.n("qty","수량","100","kg",true),
    F.money("price","희망 단가","65,000","원/kg"),
    F.chips("temp","냉장 / 냉동",TEMP,true),
    F.sel("cycle","납품 주기",["일회성","주 1회","주 2~3회","월 정기","협의"]),
    F.sel("region","희망 지역",REGIONS,true),
    F.date("deadline","희망 납품일"),
    F.area("etc","추가 조건","원산지, 포장 형태, 도축일자, 인증 요구사항 등")
  ],
  process: [
    F.chips("work","작업 종류",["발골","정형","세절","포장","OEM 생산","도축","출하"],true),
    F.chips("species","축종",["한우","육우","한돈","수입육","기타"]),
    F.txt("item","품목 / 제품","한우 지육, 육포, 소시지, 양념육 …",true),
    F.n("qty","물량","500","kg 또는 두",true),
    F.sel("haccp","HACCP 필요 여부",["상관없음","선호","필수"]),
    F.sel("recipe","레시피 보유",["해당 없음","보유","미보유(개발 요청)"]),
    F.sel("region","작업 희망 지역",REGIONS,true),
    F.date("deadline","희망 완료일"),
    F.area("etc","추가 조건","가공 방식, 포장 규격, 라벨, 납기 조건 등")
  ],
  logi: [
    F.chips("temp","운송 유형",["냉장","냉동","지육 운송","상온"],true),
    F.txt("from","출발지","경기 안성시",true),
    F.txt("to","도착지","서울 마포구",true),
    F.n("volume","물량","5","톤 또는 파레트",true),
    F.sel("cycle","운송 주기",["단건","주 1회","주 2~3회","매일","월 정기"],true),
    F.date("deadline","희망 운송일"),
    F.money("budget","희망 운임","300,000","원/회"),
    F.area("etc","추가 조건","온도 조건, 상하차 방식, 차량 규격 등")
  ],
  labor: [
    F.chips("work","필요 업무",["발골","정형","세절","포장","생산 보조","상하차","청소·위생","기타"],true),
    F.date("work_date","작업 날짜",true),
    F.time("start","시작 시간"),
    F.time("end","종료 시간"),
    F.n("headcount","필요 인원","2","명",true),
    F.money("pay","일당 / 시급","150,000","원"),
    F.sel("pay_type","급여 형태",["일당","시급"],true),
    F.sel("region","근무 지역",REGIONS,true),
    F.txt("address","상세 주소","경기 안성시 ○○로 (선택)"),
    F.sel("exp","필요 경력",["무관","6개월 이상","1년 이상","3년 이상","5년 이상"],true),
    F.area("etc","추가 조건","식사 제공, 복장, 준비물, 교통편 등")
  ],
  job: [
    F.chips("role","모집 직무",["정육사","발골사","정형사","세절기사","생산직","포장직","배송직","영업직","사무직","점장","기타"],true),
    F.sel("employment","고용 형태",["정규직","계약직","아르바이트"],true),
    F.sel("exp","요구 경력",["신입 가능","1년 이상","3년 이상","5년 이상","10년 이상"],true),
    F.money("pay","급여","300","만원/월"),
    F.n("headcount","모집 인원","1","명"),
    F.sel("region","근무 지역",REGIONS,true),
    F.txt("company","업체명","○○정육공장",true),
    F.area("etc","근무 조건","4대보험, 숙소, 식사, 근무시간, 우대사항 등")
  ],
  equip: [
    F.chips("item","품목",["육절기","골절기","슬라이서","진공포장기","냉장·냉동설비","쇼케이스","포장재","소모품","기타"],true),
    F.txt("spec","상세 사양 / 모델","용량, 규격, 희망 모델명 등"),
    F.chips("condition","신품 / 중고",["신품","중고","상관없음"],true),
    F.n("qty","수량","1","대 또는 세트",true),
    F.money("budget","예산","3,000,000","원"),
    F.sel("region","설치·배송 지역",REGIONS,true),
    F.date("deadline","희망 납품일"),
    F.area("etc","추가 조건","설치·A/S, 전압, 반입 조건 등")
  ],
  startup: [
    F.chips("biz","업종",["정육점","고깃집","정육식당","육가공 공장","무인 정육","기타"],true),
    F.chips("need","필요한 것",["창업 컨설팅","인테리어","설비","간판","상권 분석","전체"],true),
    F.n("area","면적","30","평"),
    F.money("budget","예산","50,000,000","원"),
    F.sel("region","지역",REGIONS,true),
    F.date("deadline","희망 오픈일"),
    F.area("etc","추가 조건","현재 진행 상황, 점포 유무, 원하는 콘셉트 등")
  ],
  haccp: [
    F.chips("service","필요 서비스",["HACCP 인증","위생 점검","세무·기장","노무 관리","경영 컨설팅","마케팅"],true),
    F.txt("biz","사업장 업종","육가공 공장, 정육점, 도축장 …",true),
    F.sel("scale","사업장 규모",["1~5인","6~20인","21~50인","51인 이상"]),
    F.sel("stage","진행 단계",["처음 알아보는 중","준비 중","심사 예정","갱신·유지"]),
    F.sel("region","지역",REGIONS,true),
    F.date("deadline","희망 완료일"),
    F.money("budget","예산","3,000,000","원"),
    F.area("etc","추가 조건","현재 상태, 요청 사항 등")
  ]
};

var W = { step:1, cat:null, sub:null, data:{}, contact:{} };
G.W = W;

function catList(){ return (typeof CATS8!=="undefined") ? CATS8 : []; }
function catOfKey(k){ return (typeof cat8Of==="function") ? cat8Of(k) : null; }

function stepBar(n){
  var labels=["무엇이 필요한지","필요 조건 입력","확인 후 등록"];
  return '<div class="gstep">'+labels.map(function(l,i){
    var s=i+1, cls = s<n ? "done" : (s===n ? "on" : "");
    return '<div class="gstep-i '+cls+'"><div class="gstep-n">'+(s<n?"✓":s)+'</div><div class="gstep-l">STEP'+s+'. '+l+'</div></div>';
  }).join("")+'</div>';
}

/* ── STEP 1 ── */
function step1(){
  W.step=1;
  var body=$("rw-wizard"); if(!body) return;
  body.innerHTML = stepBar(1)+
    '<div class="gcard"><div class="gcard-t">어떤 분야가 필요하세요?</div>'+
      '<div class="gcat-grid">'+catList().map(function(c){
        return '<button class="gcat-c'+(W.cat===c.k?" on":"")+'" onclick="gPickCat(\''+c.k+'\')">'+
          '<div class="gcat-ic">'+(typeof cat8Icon==="function"?cat8Icon(c,22):"")+'</div>'+
          '<div class="gcat-n">'+esc(c.nm)+'</div></button>';
      }).join("")+'</div>'+
      '<div id="rw-subs"></div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="go(&quot;h&quot;)">취소</button>'+
    '<button class="gbtn gbtn-p" id="rw-next1" onclick="gStep2()" disabled>다음 단계 →</button></div>';
  if(W.cat) renderSubs();
}
window.gPickCat=function(k){
  W.cat=k; W.sub=null; W.data={};
  document.querySelectorAll(".gcat-c").forEach(function(el,i){ el.classList.toggle("on", catList()[i] && catList()[i].k===k); });
  renderSubs();
  var b=$("rw-next1"); if(b) b.disabled=false;
};
function renderSubs(){
  var c=catOfKey(W.cat), box=$("rw-subs"); if(!c||!box) return;
  box.innerHTML='<div class="glabel" style="margin-top:18px;">구체적으로 무엇인가요? <span style="font-weight:600;color:var(--ink4);">(선택)</span></div>'+
    '<div class="gpick">'+c.sub.map(function(s){
      return '<button class="gpick-i'+(W.sub===s?" on":"")+'" onclick="gPickSub2(\''+esc(s)+'\')">'+esc(s)+'</button>';
    }).join("")+'</div>';
}
window.gPickSub2=function(s){
  W.sub = (W.sub===s) ? null : s;
  renderSubs();
};

/* ── STEP 2 ── */
window.gStep2=function(){
  if(!W.cat){ toast("분야를 선택해주세요.","err"); return; }
  W.step=2;
  var c=catOfKey(W.cat), fields=REQ_FORMS[W.cat]||REQ_FORMS.meat;
  var body=$("rw-wizard"); if(!body) return;
  body.innerHTML = stepBar(2)+
    '<div class="gcard"><div class="gcard-t">'+esc(c?c.nm:"")+(W.sub?" · "+esc(W.sub):"")+' — 필요 조건</div>'+
      fields.map(fieldHtml).join("")+
    '</div>'+
    '<div class="gcard"><div class="gcard-t">연락처</div>'+
      '<label class="glabel">상호명</label><input class="gin" id="w-company" placeholder="업체명 (선택)" value="'+esc(W.contact.company||"")+'">'+
      '<div class="grow keep">'+
        '<div><label class="glabel">이름 <span class="greq">*</span></label><input class="gin" id="w-name" placeholder="홍길동" value="'+esc(W.contact.name||ME.name||"")+'"></div>'+
        '<div><label class="glabel">연락처 <span class="greq">*</span></label><input class="gin" id="w-phone" placeholder="010-0000-0000" value="'+esc(W.contact.phone||"")+'"></div>'+
      '</div>'+
      '<label class="glabel">비교 우선순위</label>'+
      '<div class="gpick" id="w-priority">'+["가격","품질","납기","인증","거래실적"].map(function(p,i){
        return '<button class="gpick-i'+(i<3?" on":"")+'" onclick="this.classList.toggle(\'on\')">'+p+'</button>';
      }).join("")+'</div>'+
      '<label class="glabel">공개 범위</label>'+
      '<select class="gin" id="w-visibility"><option value="all">전체 업체에 공개</option><option value="cert">인증 업체에만 공개</option><option value="private">비공개 매칭</option></select>'+
      '<div class="ghint">공개 범위가 넓을수록 더 많은 견적을 받을 수 있습니다.</div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="gStep1()">← 이전</button>'+
    '<button class="gbtn gbtn-p" onclick="gStep3()">다음 단계 →</button></div>';
  restoreFields(fields);
  window.scrollTo(0,0);
};
window.gStep1=function(){ step1(); window.scrollTo(0,0); };

function fieldHtml(f){
  var id="w-"+f.id, req=f.req?' <span class="greq">*</span>':'';
  var h='<label class="glabel">'+esc(f.l)+req+'</label>';
  if(f.t==="select") h+='<select class="gin" id="'+id+'">'+f.opts.map(function(o){ return '<option>'+esc(o)+'</option>'; }).join("")+'</select>';
  else if(f.t==="chips") h+='<div class="gpick" id="'+id+'" data-field="'+f.id+'">'+f.opts.map(function(o){
      return '<button type="button" class="gpick-i" onclick="gChip(this)">'+esc(o)+'</button>'; }).join("")+'</div>';
  else if(f.t==="textarea") h+='<textarea class="gin" id="'+id+'" placeholder="'+esc(f.ph||"")+'"></textarea>';
  else if(f.t==="money") h+='<div style="position:relative;"><input class="gin" id="'+id+'" inputmode="numeric" placeholder="'+esc(f.ph||"")+'" oninput="gNumFmt(this)">'+
      (f.unit?'<span style="position:absolute;right:13px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--ink4);font-weight:600;">'+esc(f.unit)+'</span>':'')+'</div>';
  else if(f.t==="number") h+='<div style="position:relative;"><input class="gin" id="'+id+'" inputmode="numeric" placeholder="'+esc(f.ph||"")+'">'+
      (f.unit?'<span style="position:absolute;right:13px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--ink4);font-weight:600;">'+esc(f.unit)+'</span>':'')+'</div>';
  else h+='<input class="gin" id="'+id+'" type="'+(f.t==="date"?"date":(f.t==="time"?"time":"text"))+'" placeholder="'+esc(f.ph||"")+'">';
  return h;
}
window.gChip=function(el){
  var wrap=el.parentNode, multi=wrap.id==="w-work"||wrap.id==="w-need"||wrap.id==="w-service"||wrap.id==="w-role"||wrap.id==="w-item";
  if(!multi) wrap.querySelectorAll(".gpick-i").forEach(function(b){ if(b!==el) b.classList.remove("on"); });
  el.classList.toggle("on");
};
window.gNumFmt=function(el){
  var raw=el.value.replace(/[^0-9]/g,"");
  el.value = raw ? parseInt(raw,10).toLocaleString("ko-KR") : "";
};
function readFields(fields){
  var out={};
  fields.forEach(function(f){
    var el=$("w-"+f.id); if(!el) return;
    if(f.t==="chips"){
      var v=[]; el.querySelectorAll(".gpick-i.on").forEach(function(b){ v.push(b.textContent.trim()); });
      out[f.id]=v;
    } else out[f.id]=String(el.value||"").trim();
  });
  return out;
}
function restoreFields(fields){
  fields.forEach(function(f){
    var v=W.data[f.id]; if(v==null) return;
    var el=$("w-"+f.id); if(!el) return;
    if(f.t==="chips"){ el.querySelectorAll(".gpick-i").forEach(function(b){ b.classList.toggle("on", (v||[]).indexOf(b.textContent.trim())>=0); }); }
    else el.value=v;
  });
}

/* ── STEP 3 (확인) ── */
window.gStep3=function(){
  var fields=REQ_FORMS[W.cat]||REQ_FORMS.meat;
  W.data=readFields(fields);
  W.contact={ company:($("w-company")||{}).value||"", name:(($("w-name")||{}).value||"").trim(), phone:(($("w-phone")||{}).value||"").trim() };
  var pr=[]; document.querySelectorAll("#w-priority .gpick-i.on").forEach(function(b){ pr.push(b.textContent.trim()); });
  W.priority=pr.join(","); W.visibility=(($("w-visibility")||{}).value)||"all";

  var miss=[];
  fields.forEach(function(f){
    if(!f.req) return;
    var v=W.data[f.id];
    if(f.t==="chips"){ if(!v||!v.length) miss.push(f.l); }
    else if(!v) miss.push(f.l);
  });
  if(!W.contact.name) miss.push("이름");
  if(!W.contact.phone) miss.push("연락처");
  if(miss.length){ toast("필수 항목을 입력해주세요: "+miss.slice(0,3).join(", ")+(miss.length>3?" 외 "+(miss.length-3)+"개":""),"err"); return; }

  W.step=3;
  var c=catOfKey(W.cat);
  var rows=fields.map(function(f){
    var v=W.data[f.id]; if(!v||(Array.isArray(v)&&!v.length)) return "";
    var txt=Array.isArray(v)?v.join(", "):v;
    if(f.unit) txt+=" "+f.unit;
    return '<div class="gsum-r"><div class="gsum-k">'+esc(f.l)+'</div><div class="gsum-v">'+esc(txt)+'</div></div>';
  }).join("");

  $("rw-wizard").innerHTML = stepBar(3)+
    '<div class="gcard"><div class="gcard-t">이대로 등록할까요?</div>'+
      '<div class="gsum">'+
        '<div class="gsum-r"><div class="gsum-k">분야</div><div class="gsum-v">'+esc(c?c.nm:"")+(W.sub?" · "+esc(W.sub):"")+'</div></div>'+
        rows+
        '<div class="gsum-r"><div class="gsum-k">연락처</div><div class="gsum-v">'+esc(W.contact.name)+' · '+esc(W.contact.phone)+(W.contact.company?" · "+esc(W.contact.company):"")+'</div></div>'+
        (W.priority?'<div class="gsum-r"><div class="gsum-k">비교 우선순위</div><div class="gsum-v">'+esc(W.priority)+'</div></div>':'')+
        '<div class="gsum-r"><div class="gsum-k">공개 범위</div><div class="gsum-v">'+({all:"전체 업체에 공개",cert:"인증 업체에만 공개",private:"비공개 매칭"}[W.visibility])+'</div></div>'+
      '</div>'+
      '<div class="ghint" style="margin-top:12px;">등록하면 조건에 맞는 업체에 알림이 전달되고, 견적이 도착하면 한 화면에서 비교할 수 있습니다.</div>'+
      '<div class="gmsg" id="rw-submit-msg"></div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="gStep2()">← 수정하기</button>'+
    '<button class="gbtn gbtn-p" id="rw-submit" onclick="gSubmitRequest()">요청 등록하기</button></div>';
  window.scrollTo(0,0);
};

function buildTitle(){
  var c=catOfKey(W.cat), d=W.data;
  var parts=[];
  if(d.part) parts.push(d.part);
  else if(d.item) parts.push(Array.isArray(d.item)?d.item.join("·"):d.item);
  else if(d.work) parts.push(Array.isArray(d.work)?d.work.join("·"):d.work);
  else if(d.service) parts.push(Array.isArray(d.service)?d.service.join("·"):d.service);
  else if(d.role) parts.push(Array.isArray(d.role)?d.role.join("·"):d.role);
  else if(d.biz) parts.push(Array.isArray(d.biz)?d.biz.join("·"):d.biz);
  if(d.qty) parts.push(d.qty+"kg");
  else if(d.volume) parts.push(d.volume+"톤");
  else if(d.headcount) parts.push(d.headcount+"명");
  if(!parts.length) parts.push(c?c.nm:"요청");
  return parts.join(" ") + " " + (W.cat==="job"?"채용":(W.cat==="labor"?"인력 요청":"요청"));
}
function buildSummary(){
  var fields=REQ_FORMS[W.cat]||[];
  return fields.map(function(f){
    var v=W.data[f.id]; if(!v||(Array.isArray(v)&&!v.length)) return null;
    return f.l+": "+(Array.isArray(v)?v.join(", "):v)+(f.unit?f.unit:"");
  }).filter(Boolean).join(" / ");
}

window.gSubmitRequest=async function(){
  var btn=$("rw-submit"); if(btn){ btn.disabled=true; btn.textContent="등록 중…"; }
  var c=catOfKey(W.cat);
  var legacy = (typeof primaryLegacy==="function" && c) ? primaryLegacy(c) : (c?c.nm:"기타");
  var d=W.data;
  var payload = {
    request_number: "REQ-"+Date.now(),
    category: legacy,
    category_main: W.cat,
    subcategory: W.sub||null,
    title: buildTitle(),
    status: "견적대기",
    quote_count: 0,
    buyer_name: W.contact.name,
    buyer_phone: W.contact.phone,
    buyer_company: W.contact.company||null,
    region: d.region || d.to || d.from || "전국",
    budget_text: d.price || d.budget || d.pay || null,
    description: buildSummary(),
    detail: d,
    deadline: d.deadline || d.work_date || null,
    priority: W.priority || null,
    visibility: W.visibility || "all",
    user_id: ME.user ? ME.user.id : null
  };
  var r = await insertSafe("purchase_requests", payload);
  if(btn){ btn.disabled=false; btn.textContent="요청 등록하기"; }
  if(r.error){
    setMsg("rw-submit-msg", "등록에 실패했습니다: "+(r.error.message||"알 수 없는 오류"), "err");
    return;
  }
  var newId = (r.data && r.data[0]) ? r.data[0].id : null;
  var note = r.dropped && r.dropped.length
    ? " (일부 상세 항목은 DB 확장 전이라 요약으로 저장되었습니다)" : "";
  toast("요청이 등록되었습니다"+note, "ok");
  W = G.W = { step:1, cat:null, sub:null, data:{}, contact:W.contact };
  if(typeof loadFromDB==="function") loadFromDB();
  if(newId) window.gOpenRequest(newId);
  else if(typeof go==="function") go("reqs");
};

/* 기존 initRW / goReq / goUX 를 3단계 마법사로 교체 (원본 함수는 index.html 에 그대로 남아 있습니다) */
window.initRW=function(){
  var host=$("pg-rw"); if(!host) return;
  var inner=host.querySelector(".gp-wizard");
  if(!inner){
    host.innerHTML='<div class="gp gp-wizard">'+
      '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="gWizBack()">← 뒤로</button>'+
      '<div><div class="gp-title">요청 등록</div><div class="gp-sub">필요한 것을 올리면 업체가 견적·제안을 보냅니다</div></div></div>'+
      '<div id="rw-wizard"></div></div>';
  }
  step1();
};
window.gWizBack=function(){
  if(W.step===3) return window.gStep2();
  if(W.step===2) return window.gStep1();
  if(typeof go==="function") go("h");
};
/* 히어로 검색어를 3단계 폼의 알맞은 칸으로 옮겨 담습니다
   (index.html 의 구버전은 rw-f-cond 를 찾으므로 여기서 교체) */
window.applyHeroQuery=function(){
  if(!HERO_Q) return;
  var q=HERO_Q; HERO_Q="";
  var order=["w-part","w-item","w-spec","w-biz","w-etc"];
  for(var i=0;i<order.length;i++){
    var el=$(order[i]);
    /* 칩(div) 이 아니라 실제 입력칸에만 넣습니다 */
    if(el && (el.tagName==="INPUT"||el.tagName==="TEXTAREA") && !String(el.value||"").trim()){ el.value=q; return; }
  }
  var etc=$("w-etc");
  if(etc) etc.value=(etc.value?etc.value+" / ":"")+q;
};

window.goReq=function(cat){
  var key=(typeof key8Of==="function") ? key8Of(cat) : null;
  W.cat = key || "meat";
  W.sub = null; W.data={};
  if(typeof go==="function") go("rw");
  setTimeout(function(){ window.gStep2(); window.applyHeroQuery(); }, 60);
};
window.goUX=function(){
  W.cat="job"; W.sub=null; W.data={};
  if(typeof go==="function") go("rw");
  setTimeout(function(){ window.gStep2(); window.applyHeroQuery(); }, 60);
};
window.pickSub=function(k,sub){
  W.cat=k||"meat"; W.sub=sub||null; W.data={};
  if(typeof go==="function") go("rw");
  setTimeout(function(){ window.gStep2(); }, 60);
};

/* ════════════════════════════════════════════════════════════════════
   요청 상세 · 견적 비교 · 견적 제출
   가격 + 업체 인증 / 지역 / 납기 / 평점 / 거래실적 / 배송조건 / 추가 제안
   ════════════════════════════════════════════════════════════════════ */

var CUR = { req:null, quotes:[], supMap:{} };
G.CUR = CUR;

function supOf(id){ return CUR.supMap[String(id)] || null; }

async function fetchSupplierMap(){
  var r=await selectSafe("suppliers", function(q){ return q.limit(500); });
  var m={}; (r.data||[]).forEach(function(s){ m[String(s.id)]=s; });
  CUR.supMap=m; return m;
}

window.gOpenRequest=async function(id){
  if(typeof go==="function") go("reqd");
  var body=$("reqd-body"); if(!body) return;
  body.innerHTML='<div style="padding:50px 0;text-align:center;color:var(--ink4);font-size:14px;">불러오는 중…</div>';
  var c=client();
  if(!c){ body.innerHTML='<div class="gempty"><div class="gempty-t">서버에 연결할 수 없습니다</div></div>'; return; }
  var rr=await c.from("purchase_requests").select("*").eq("id", id).limit(1);
  var req=(rr.data&&rr.data[0])||null;
  if(!req){ body.innerHTML='<div class="gempty"><div class="gempty-t">요청을 찾을 수 없습니다</div><button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;reqs&quot;)">요청 목록으로</button></div>'; return; }
  CUR.req=req;
  await fetchSupplierMap();
  var q=await selectSafe("quotes", function(qq){ return qq.eq("request_id", String(id)).order("created_at",{ascending:false}); });
  CUR.quotes = q.unavailable ? null : (q.data||[]);
  renderRequestDetail();
};

function detailRows(req){
  var d=req.detail;
  if(d && typeof d==="object"){
    var key=req.category_main||(typeof key8Of==="function"?key8Of(req.category):null);
    var fields=REQ_FORMS[key]||[];
    var seen={}, rows=[];
    fields.forEach(function(f){
      var v=d[f.id]; if(v==null||v===""||(Array.isArray(v)&&!v.length)) return;
      seen[f.id]=1;
      rows.push([f.l, (Array.isArray(v)?v.join(", "):v)+(f.unit?" "+f.unit:"")]);
    });
    Object.keys(d).forEach(function(k){
      if(seen[k]) return; var v=d[k]; if(v==null||v===""||(Array.isArray(v)&&!v.length)) return;
      rows.push([k, Array.isArray(v)?v.join(", "):String(v)]);
    });
    if(rows.length) return rows;
  }
  var out=[];
  if(req.description) out.push(["요청 내용", req.description]);
  if(req.budget_text) out.push(["희망 금액", req.budget_text]);
  return out;
}

function renderRequestDetail(){
  var req=CUR.req, body=$("reqd-body"); if(!req||!body) return;
  var qs=CUR.quotes;
  var label=(typeof cat8Label==="function")?cat8Label(req.category):(req.category||"요청");
  var mine = ME.user && req.user_id && String(req.user_id)===String(ME.user.id);
  var rows=detailRows(req);
  var prices=(qs||[]).map(function(q){ return num(q.price); }).filter(function(v){ return v!=null; });
  var lo=prices.length?Math.min.apply(null,prices):null, hi=prices.length?Math.max.apply(null,prices):null;
  var avg=prices.length?Math.round(prices.reduce(function(a,b){return a+b;},0)/prices.length):null;

  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;reqs&quot;)">← 요청 목록</button></div>'+
    '<div class="gcard">'+
      '<div class="ritem-top"><span class="gbadge gb-or">'+esc(label)+'</span>'+
        (req.subcategory?'<span class="gbadge gb-gy">'+esc(req.subcategory)+'</span>':'')+
        '<span class="gbadge '+(req.status==="완료"?"gb-ok":(req.status==="진행중"?"gb-bl":"gb-gy"))+'">'+esc(req.status||"견적대기")+'</span>'+
        '<span style="font-size:12px;color:var(--ink4);margin-left:auto;">'+ago(req.created_at)+'</span></div>'+
      '<div style="font-size:21px;font-weight:800;color:var(--ink);margin:6px 0 10px;letter-spacing:-.4px;">'+esc(req.title||req.description||label+" 요청")+'</div>'+
      '<div class="ritem-m"><span>📍 '+esc(req.region||"전국")+'</span>'+
        (req.deadline?'<span>🗓 희망일 '+fmtDate(req.deadline)+' ('+dday(req.deadline)+')</span>':'')+
        (req.request_number?'<span>'+esc(req.request_number)+'</span>':'')+'</div>'+
      (rows.length?'<div class="gsum" style="margin-top:14px;">'+rows.map(function(r){
        return '<div class="gsum-r"><div class="gsum-k">'+esc(r[0])+'</div><div class="gsum-v">'+esc(r[1])+'</div></div>';
      }).join("")+'</div>':'')+
      (req.priority?'<div class="ghint" style="margin-top:10px;">비교 우선순위: '+esc(req.priority)+'</div>':'')+
    '</div>'+

    (qs===null ? setupNote("견적") :
      '<div class="qbar">'+
        '<div class="qbar-i"><div class="qbar-v">'+qs.length+'</div><div class="qbar-l">받은 견적</div></div>'+
        '<div class="qbar-i"><div class="qbar-v">'+(lo!=null?won(lo):"—")+'</div><div class="qbar-l">최저</div></div>'+
        '<div class="qbar-i"><div class="qbar-v">'+(avg!=null?won(avg):"—")+'</div><div class="qbar-l">평균</div></div>'+
        '<div class="qbar-i"><div class="qbar-v">'+(hi!=null?won(hi):"—")+'</div><div class="qbar-l">최고</div></div>'+
      '</div>'+
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:20px 0 12px;flex-wrap:wrap;">'+
        '<div class="gp-title">견적 비교</div>'+
        '<div style="display:flex;gap:7px;align-items:center;">'+
          '<select class="gin" style="width:auto;padding:8px 11px;font-size:13px;" id="q-sort" onchange="gSortQuotes()">'+
            '<option value="price">가격 낮은순</option><option value="rating">평점 높은순</option>'+
            '<option value="lead">납기 빠른순</option><option value="deal">거래실적 많은순</option><option value="new">최신순</option>'+
          '</select>'+
          '<button class="gbtn gbtn-p gbtn-sm" onclick="gOpenQuoteForm()">견적 보내기</button>'+
        '</div>'+
      '</div>'+
      '<div id="q-list"></div>'
    )+
    (mine&&req.status!=="완료"?'<div style="margin-top:18px;"><button class="gbtn gbtn-w gbtn-full" onclick="gCloseRequest()">이 요청 마감하기</button></div>':'');

  if(qs) { $("q-sort").value="price"; renderQuotes(); }
  window.scrollTo(0,0);
}

function leadMinutes(t){
  var s=String(t||""); var n=parseFloat(s.replace(/[^0-9.]/g,""));
  if(isNaN(n)) return 1e9;
  if(/일/.test(s)) return n*1440; if(/시간/.test(s)) return n*60;
  if(/주/.test(s)) return n*10080; if(/분/.test(s)) return n;
  return n*60;
}
window.gSortQuotes=function(){ renderQuotes(); };

function renderQuotes(){
  var el=$("q-list"); if(!el) return;
  var qs=(CUR.quotes||[]).slice();
  if(!qs.length){
    el.innerHTML='<div class="gempty"><div class="gempty-t">아직 도착한 견적이 없습니다</div>'+
      '<div class="gempty-d">조건에 맞는 업체가 확인하면 견적을 보냅니다.<br>업체라면 지금 바로 견적을 보낼 수 있습니다.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="gOpenQuoteForm()">견적 보내기</button></div>';
    return;
  }
  var mode=(($("q-sort")||{}).value)||"price";
  function meta(q){ var s=supOf(q.supplier_id)||{}; return {
    rating:Number(s.rating)||0, deal:Number(s.deal_count)||0,
    verified:!!s.is_verified, haccp:!!s.haccp, brn:!!s.brn_verified,
    region:q.region||s.region||"", sup:s }; }
  qs.sort(function(a,b){
    var ma=meta(a), mb=meta(b);
    if(mode==="price"){ var pa=num(a.price), pb=num(b.price); if(pa==null) return 1; if(pb==null) return -1; return pa-pb; }
    if(mode==="rating") return mb.rating-ma.rating;
    if(mode==="deal")   return mb.deal-ma.deal;
    if(mode==="lead")   return leadMinutes(a.lead_time)-leadMinutes(b.lead_time);
    return new Date(b.created_at)-new Date(a.created_at);
  });
  var prices=qs.map(function(q){ return num(q.price); }).filter(function(v){ return v!=null; });
  var lo=prices.length?Math.min.apply(null,prices):null;
  var mine = ME.user && CUR.req && CUR.req.user_id && String(CUR.req.user_id)===String(ME.user.id);
  var hasSelected = qs.some(function(q){ return q.status==="선택됨"; });

  el.innerHTML='<div class="qcmp">'+qs.map(function(q){
    var m=meta(q), s=m.sup, isLow=(num(q.price)!=null && num(q.price)===lo);
    var sel=q.status==="선택됨";
    var certs=[];
    if(m.verified) certs.push('<span class="gbadge gb-or">고리인증</span>');
    if(m.brn)      certs.push('<span class="gbadge gb-gy">사업자</span>');
    if(m.haccp)    certs.push('<span class="gbadge gb-ok">HACCP</span>');
    return '<div class="qc'+(sel?" sel":(isLow?" best":""))+'">'+
      (sel?'<span class="gbadge gb-ok qc-tag">✓ 선택한 견적</span>'
          :(isLow?'<span class="gbadge gb-or qc-tag">최저가</span>'
                 :'<span class="gbadge gb-gy qc-tag ghost">·</span>'))+
      '<div class="qc-nm">'+esc(q.supplier_name||"업체")+'</div>'+
      (certs.length?'<div class="qc-certs">'+certs.join("")+'</div>':'')+
      '<div class="qc-price">'+(num(q.price)!=null?won(num(q.price)):"협의")+
        '<small>'+esc(q.price_unit||"총액")+'</small></div>'+
      '<div class="qc-spec">'+
        '<div class="qc-sr"><span class="qc-sk">납기</span><span class="qc-sv">'+esc(q.lead_time||"협의")+'</span></div>'+
        '<div class="qc-sr"><span class="qc-sk">지역</span><span class="qc-sv">'+esc(m.region||"—")+'</span></div>'+
        '<div class="qc-sr"><span class="qc-sk">배송 조건</span><span class="qc-sv">'+esc(q.delivery||"협의")+'</span></div>'+
        '<div class="qc-sr"><span class="qc-sk">평점</span><span class="qc-sv">'+(m.rating?('<span class="qstar">★ '+m.rating.toFixed(1)+'</span>'):"신규")+'</span></div>'+
        '<div class="qc-sr"><span class="qc-sk">거래실적</span><span class="qc-sv">'+(m.deal?m.deal+"건":"—")+'</span></div>'+
        (q.valid_until?'<div class="qc-sr"><span class="qc-sk">유효기간</span><span class="qc-sv">'+fmtDate(q.valid_until)+'</span></div>':'')+
      '</div>'+
      (q.conditions?'<div class="qc-note">'+esc(q.conditions)+'</div>':'')+
      '<div class="qc-act">'+
        (q.supplier_id?'<button class="gbtn gbtn-w gbtn-sm" onclick="curSID=\''+esc(q.supplier_id)+'\';go(&quot;sp&quot;)">업체 보기</button>':'')+
        (mine && !hasSelected ? '<button class="gbtn gbtn-p gbtn-sm" onclick="gSelectQuote(\''+q.id+'\')">이 견적 선택</button>'
          : (sel ? '<button class="gbtn gbtn-p gbtn-sm" onclick="gCompleteDeal(\''+q.id+'\')">거래 완료 처리</button>'
                 : '<button class="gbtn gbtn-w gbtn-sm" onclick="gContactQuote(\''+q.id+'\')">연락처 보기</button>'))+
      '</div></div>';
  }).join("")+'</div>'+
  (!mine?'<div class="ghint" style="margin-top:12px;">본인이 등록한 요청에 로그인하면 견적을 선택하고 거래를 진행할 수 있습니다.</div>':'');
}

window.gContactQuote=function(id){
  var q=(CUR.quotes||[]).find(function(x){ return String(x.id)===String(id); });
  if(!q) return;
  toast(q.contact ? (q.supplier_name+" · "+q.contact) : "연락처가 등록되지 않은 견적입니다.");
};

window.gSelectQuote=async function(id){
  if(!confirm("이 견적을 선택하시겠습니까?\n선택하면 다른 업체에는 미선택으로 표시됩니다.")) return;
  var q=(CUR.quotes||[]).find(function(x){ return String(x.id)===String(id); }); if(!q) return;
  await updateSafe("quotes",{status:"선택됨"},"id",id);
  var others=(CUR.quotes||[]).filter(function(x){ return String(x.id)!==String(id); });
  for(var i=0;i<others.length;i++){ await updateSafe("quotes",{status:"미선택"},"id",others[i].id); }
  await updateSafe("purchase_requests",{status:"진행중", selected_quote_id:String(id)},"id",CUR.req.id);
  if(q.user_id) pushNotif(q.user_id,"selected","견적이 선택되었습니다","'"+(CUR.req.title||"요청")+"' 건의 견적이 선택되었습니다.","req:"+CUR.req.id);
  toast("견적을 선택했습니다. 거래를 진행하세요.","ok");
  window.gOpenRequest(CUR.req.id);
};

window.gCompleteDeal=async function(quoteId){
  if(!confirm("거래를 완료 처리할까요?\n완료 후 업체에 후기를 남길 수 있습니다.")) return;
  await updateSafe("purchase_requests",{status:"완료", closed_at:new Date().toISOString()},"id",CUR.req.id);
  var q=(CUR.quotes||[]).find(function(x){ return String(x.id)===String(quoteId); });
  if(q && q.supplier_id){
    var s=supOf(q.supplier_id);
    if(s) await updateSafe("suppliers",{deal_count:(Number(s.deal_count)||0)+1},"id",q.supplier_id);
  }
  toast("거래를 완료했습니다. 후기를 남겨주세요.","ok");
  if(q) window.gOpenReview("supplier", q.supplier_id||"", q.supplier_name||"", CUR.req.id);
};

window.gCloseRequest=async function(){
  if(!confirm("이 요청을 마감할까요? 더 이상 견적을 받지 않습니다.")) return;
  await updateSafe("purchase_requests",{status:"마감", closed_at:new Date().toISOString()},"id",CUR.req.id);
  toast("요청을 마감했습니다.","ok");
  window.gOpenRequest(CUR.req.id);
};

/* ── 견적 보내기 ── */
window.gOpenQuoteForm=function(){
  if(SCHEMA.quotes===false){ toast("견적 기능을 쓰려면 db/phase2_schema.sql 을 먼저 실행해주세요.","err"); return; }
  if(typeof go==="function") go("quote");
  var req=CUR.req, body=$("quote-body"); if(!body) return;
  var sups=Object.keys(CUR.supMap).map(function(k){ return CUR.supMap[k]; });
  var mySups = ME.user ? sups.filter(function(s){ return String(s.user_id||"")===String(ME.user.id); }) : [];
  var opts = (mySups.length?mySups:sups).slice(0,200);
  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="gOpenRequest(\''+esc(req?req.id:"")+'\')">← 요청으로</button>'+
      '<div><div class="gp-title">견적 보내기</div><div class="gp-sub">'+esc(req?(req.title||req.category):"")+'</div></div></div>'+
    '<div class="gcard"><div class="gcard-t">우리 업체</div>'+
      '<label class="glabel">업체 선택</label>'+
      '<select class="gin" id="q-sup" onchange="gQuoteSupChange()">'+
        '<option value="">직접 입력</option>'+
        opts.map(function(s){ return '<option value="'+esc(s.id)+'">'+esc(s.name)+(s.region?" · "+esc(s.region):"")+'</option>'; }).join("")+
      '</select>'+
      '<div class="grow keep">'+
        '<div><label class="glabel">업체명 <span class="greq">*</span></label><input class="gin" id="q-name" placeholder="○○축산"></div>'+
        '<div><label class="glabel">연락처 <span class="greq">*</span></label><input class="gin" id="q-contact" placeholder="010-0000-0000"></div>'+
      '</div>'+
      '<label class="glabel">지역</label><input class="gin" id="q-region" placeholder="경기 안성시">'+
    '</div>'+
    '<div class="gcard"><div class="gcard-t">견적 내용</div>'+
      '<div class="grow keep">'+
        '<div><label class="glabel">금액 <span class="greq">*</span></label><input class="gin" id="q-price" inputmode="numeric" placeholder="4,500,000" oninput="gNumFmt(this)"></div>'+
        '<div><label class="glabel">단위</label><select class="gin" id="q-unit"><option>총액</option><option>원/kg</option><option>원/두</option><option>원/회</option><option>일당</option><option>월</option></select></div>'+
      '</div>'+
      '<div class="grow keep">'+
        '<div><label class="glabel">납기</label><input class="gin" id="q-lead" placeholder="3일 이내 / 당일 / 협의"></div>'+
        '<div><label class="glabel">견적 유효기간</label><input class="gin" id="q-valid" type="date"></div>'+
      '</div>'+
      '<label class="glabel">배송 조건</label><input class="gin" id="q-delivery" placeholder="냉장 차량 무료 배송 / 착불 / 방문 수령">'+
      '<label class="glabel">추가 제안</label><textarea class="gin" id="q-cond" placeholder="정기 계약 시 단가 인하, 샘플 제공, 결제 조건 등 강점을 적어주세요"></textarea>'+
      '<div class="gmsg" id="q-msg"></div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="gOpenRequest(\''+esc(req?req.id:"")+'\')">취소</button>'+
    '<button class="gbtn gbtn-p" id="q-submit" onclick="gSubmitQuote()">견적 보내기</button></div>';
  window.scrollTo(0,0);
};
window.gQuoteSupChange=function(){
  var id=($("q-sup")||{}).value, s=id?supOf(id):null;
  if(!s) return;
  if($("q-name")) $("q-name").value=s.name||"";
  if($("q-contact")) $("q-contact").value=s.contact||"";
  if($("q-region")) $("q-region").value=s.region||"";
  if($("q-lead") && !$("q-lead").value) $("q-lead").value=s.lead_time||"";
};
window.gSubmitQuote=async function(){
  var name=(($("q-name")||{}).value||"").trim(), contact=(($("q-contact")||{}).value||"").trim();
  var price=num(($("q-price")||{}).value);
  if(!name||!contact){ setMsg("q-msg","업체명과 연락처는 필수입니다.","err"); return; }
  if(price==null){ setMsg("q-msg","견적 금액을 입력해주세요.","err"); return; }
  var btn=$("q-submit"); if(btn){ btn.disabled=true; btn.textContent="전송 중…"; }
  var payload={
    request_id:String(CUR.req.id),
    supplier_id:(($("q-sup")||{}).value)||null,
    supplier_name:name,
    user_id: ME.user?ME.user.id:null,
    price:price,
    price_unit:(($("q-unit")||{}).value)||"총액",
    lead_time:(($("q-lead")||{}).value||"").trim()||null,
    delivery:(($("q-delivery")||{}).value||"").trim()||null,
    conditions:(($("q-cond")||{}).value||"").trim()||null,
    region:(($("q-region")||{}).value||"").trim()||null,
    contact:contact,
    valid_until:(($("q-valid")||{}).value)||null,
    status:"대기"
  };
  var r=await insertSafe("quotes", payload);
  if(btn){ btn.disabled=false; btn.textContent="견적 보내기"; }
  if(r.error){
    setMsg("q-msg", r.missingTable ? "견적 테이블이 아직 없습니다. db/phase2_schema.sql 을 실행해주세요." : ("전송 실패: "+(r.error.message||"")), "err");
    return;
  }
  var cnt=(Number(CUR.req.quote_count)||0)+1;
  await updateSafe("purchase_requests",{quote_count:cnt},"id",CUR.req.id);
  if(CUR.req.user_id) pushNotif(CUR.req.user_id,"quote","새 견적이 도착했습니다",name+" 업체가 견적을 보냈습니다.","req:"+CUR.req.id);
  toast("견적을 보냈습니다.","ok");
  window.gOpenRequest(CUR.req.id);
};

/* ════════════════════════════════════════════════════════════════════
   당일알바 — 현장 단기인력 실시간 매칭 (구인구직과 분리)
   지원자의 경력 / 가능업무 / 평점 / 작업횟수 / 후기를 보고 선택합니다.
   ════════════════════════════════════════════════════════════════════ */

var DJ = { list:[], apps:{}, workers:{}, filter:{ when:"all", work:"all", region:"all" } };
G.DJ = DJ;
var WORK_TYPES=["발골","정형","세절","포장","생산 보조","상하차","청소·위생","기타"];

var _dailyBusy=false;
window.gOpenDaily=async function(){
  if(_dailyBusy) return;              /* go("daily") → gOpenDaily 재귀 방지 */
  _dailyBusy=true;
  try{ await openDaily(); } finally { _dailyBusy=false; }
};
async function openDaily(){
  if(typeof go==="function") go("daily");
  var body=$("daily-body"); if(!body) return;
  body.innerHTML='<div style="padding:50px 0;text-align:center;color:var(--ink4);">불러오는 중…</div>';
  var r=await selectSafe("day_jobs", function(q){ return q.order("work_date",{ascending:true}).limit(200); });
  if(r.unavailable){
    body.innerHTML='<div class="gp-hd"><div><div class="gp-title">당일알바</div><div class="gp-sub">오늘·내일 바로 일할 사람을 찾습니다</div></div></div>'+setupNote("당일알바");
    return;
  }
  DJ.list=r.data||[];
  var wr=await selectSafe("worker_profiles", function(q){ return q.limit(500); });
  var wm={}; (wr.data||[]).forEach(function(w){ if(w.user_id) wm[String(w.user_id)]=w; });
  DJ.workers=wm;
  renderDaily();
};

function djFiltered(){
  var t=today();
  return DJ.list.filter(function(j){
    var f=DJ.filter;
    if(f.when==="today" && j.work_date!==t) return false;
    if(f.when==="soon"){ var d=new Date(j.work_date+"T00:00:00"), n=new Date(); n.setHours(0,0,0,0);
      var diff=(d-n)/86400000; if(diff<0||diff>3) return false; }
    if(f.work!=="all" && j.work_type!==f.work) return false;
    if(f.region!=="all" && String(j.region||"").indexOf(f.region)<0) return false;
    return true;
  });
}

function renderDaily(){
  var body=$("daily-body"); if(!body) return;
  var list=djFiltered();
  var openCount=DJ.list.filter(function(j){ return j.status==="모집중"; }).length;
  body.innerHTML=
    '<div class="gp-hd" style="justify-content:space-between;">'+
      '<div><div class="gp-title">당일알바</div><div class="gp-sub">오늘·내일 바로 일할 사람을 찾고, 바로 지원합니다</div></div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="gOpenDJNew()">+ 일감 등록</button></div>'+
    '<div class="qbar" style="grid-template-columns:repeat(3,1fr);">'+
      '<div class="qbar-i"><div class="qbar-v">'+openCount+'</div><div class="qbar-l">모집 중</div></div>'+
      '<div class="qbar-i"><div class="qbar-v">'+DJ.list.filter(function(j){return j.work_date===today();}).length+'</div><div class="qbar-l">오늘 일감</div></div>'+
      '<div class="qbar-i"><div class="qbar-v">'+DJ.list.reduce(function(a,j){ return a+(Number(j.headcount)||0); },0)+'</div><div class="qbar-l">총 모집 인원</div></div>'+
    '</div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:16px 0 12px;">'+
      chipRow("when",[["all","전체"],["today","오늘"],["soon","3일 이내"]])+
    '</div>'+
    '<div style="display:flex;gap:6px;overflow-x:auto;margin-bottom:16px;padding-bottom:4px;">'+
      chipRow("work",[["all","전체 업무"]].concat(WORK_TYPES.map(function(w){ return [w,w]; })))+
    '</div>'+
    '<div class="rlist" id="dj-list"></div>';
  var el=$("dj-list");
  if(!list.length){
    el.innerHTML='<div class="gempty"><div class="gempty-t">조건에 맞는 당일 일감이 없습니다</div>'+
      '<div class="gempty-d">지금 필요한 인력이 있다면 일감을 등록해보세요.<br>등록 즉시 인력에게 노출됩니다.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="gOpenDJNew()">일감 등록하기</button></div>';
    return;
  }
  el.innerHTML=list.map(function(j){
    var d=new Date(j.work_date+"T00:00:00");
    var closed=j.status!=="모집중";
    return '<div class="dj">'+
      '<div class="dj-date"><div class="dj-d">'+(isNaN(d)?"—":d.getDate())+'</div><div class="dj-mo">'+(isNaN(d)?"":(d.getMonth()+1)+"월")+'</div></div>'+
      '<div class="dj-b">'+
        '<div class="ritem-top"><span class="gbadge gb-or">'+esc(j.work_type)+'</span>'+
          '<span class="gbadge '+(closed?"gb-gy":"gb-ok")+'">'+esc(j.status||"모집중")+'</span>'+
          '<span class="gbadge gb-gy">'+dday(j.work_date)+'</span></div>'+
        '<div class="dj-t">'+esc(j.company)+' · '+esc(j.work_type)+' '+(j.headcount||1)+'명</div>'+
        '<div class="dj-m">'+
          '<span>📍 '+esc(j.region||"—")+'</span>'+
          (j.start_time?'<span>🕐 '+esc(j.start_time)+(j.end_time?"~"+esc(j.end_time):"")+'</span>':'')+
          (j.experience?'<span>경력 '+esc(j.experience)+'</span>':'')+
        '</div>'+
        (j.detail?'<div style="font-size:12.5px;color:var(--ink3);line-height:1.55;">'+esc(j.detail)+'</div>':'')+
      '</div>'+
      '<div class="dj-r">'+
        '<div class="dj-pay">'+won(j.pay)+'원</div><div class="dj-pt">'+esc(j.pay_type||"일당")+'</div>'+
        '<div style="display:flex;flex-direction:column;gap:6px;margin-top:9px;">'+
          '<button class="gbtn gbtn-p gbtn-sm" onclick="gApplyDJ(\''+j.id+'\')"'+(closed?" disabled":"")+'>지원하기</button>'+
          '<button class="gbtn gbtn-w gbtn-sm" onclick="gViewApps(\''+j.id+'\')">지원자 보기</button>'+
        '</div>'+
      '</div></div>';
  }).join("");
}
function chipRow(key, pairs){
  return pairs.map(function(p){
    var on=DJ.filter[key]===p[0];
    return '<button class="gpick-i'+(on?" on":"")+'" style="flex-shrink:0;" onclick="gDJFilter(\''+key+'\',\''+esc(p[0])+'\')">'+esc(p[1])+'</button>';
  }).join("");
}
window.gDJFilter=function(k,v){ DJ.filter[k]=v; renderDaily(); };

/* ── 일감 등록 ── */
window.gOpenDJNew=function(){
  if(SCHEMA.day_jobs===false){ toast("당일알바 기능을 쓰려면 db/phase2_schema.sql 을 먼저 실행해주세요.","err"); return; }
  if(typeof go==="function") go("djnew");
  var body=$("djnew-body"); if(!body) return;
  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="gOpenDaily()">← 당일알바</button>'+
      '<div><div class="gp-title">당일 일감 등록</div><div class="gp-sub">등록 즉시 인력에게 노출됩니다</div></div></div>'+
    '<div class="gcard"><div class="gcard-t">작업 정보</div>'+
      '<label class="glabel">업무 <span class="greq">*</span></label>'+
      '<div class="gpick" id="dj-work">'+WORK_TYPES.map(function(w){ return '<button type="button" class="gpick-i" onclick="gChip(this)">'+w+'</button>'; }).join("")+'</div>'+
      '<div class="grow keep">'+
        '<div><label class="glabel">작업 날짜 <span class="greq">*</span></label><input class="gin" id="dj-date" type="date" value="'+today()+'"></div>'+
        '<div><label class="glabel">필요 인원 <span class="greq">*</span></label><input class="gin" id="dj-head" inputmode="numeric" placeholder="2"></div>'+
      '</div>'+
      '<div class="grow keep">'+
        '<div><label class="glabel">시작 시간</label><input class="gin" id="dj-start" type="time" value="08:00"></div>'+
        '<div><label class="glabel">종료 시간</label><input class="gin" id="dj-end" type="time" value="17:00"></div>'+
      '</div>'+
      '<div class="grow keep">'+
        '<div><label class="glabel">금액 <span class="greq">*</span></label><input class="gin" id="dj-pay" inputmode="numeric" placeholder="150,000" oninput="gNumFmt(this)"></div>'+
        '<div><label class="glabel">급여 형태</label><select class="gin" id="dj-paytype"><option>일당</option><option>시급</option></select></div>'+
      '</div>'+
      '<label class="glabel">필요 경력</label>'+
      '<select class="gin" id="dj-exp"><option>무관</option><option>6개월 이상</option><option>1년 이상</option><option>3년 이상</option><option>5년 이상</option></select>'+
    '</div>'+
    '<div class="gcard"><div class="gcard-t">근무지 · 연락처</div>'+
      '<label class="glabel">지역 <span class="greq">*</span></label>'+
      '<select class="gin" id="dj-region">'+REGIONS.map(function(r){ return '<option>'+r+'</option>'; }).join("")+'</select>'+
      '<label class="glabel">상세 주소</label><input class="gin" id="dj-addr" placeholder="경기 안성시 ○○로 12 (선택)">'+
      '<div class="grow keep">'+
        '<div><label class="glabel">업체명 <span class="greq">*</span></label><input class="gin" id="dj-company" placeholder="○○축산"></div>'+
        '<div><label class="glabel">연락처 <span class="greq">*</span></label><input class="gin" id="dj-contact" placeholder="010-0000-0000"></div>'+
      '</div>'+
      '<label class="glabel">추가 안내</label><textarea class="gin" id="dj-detail" placeholder="식사 제공, 작업복 지참, 주차 가능 여부 등"></textarea>'+
      '<div class="gmsg" id="dj-msg"></div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="gOpenDaily()">취소</button>'+
    '<button class="gbtn gbtn-p" id="dj-submit" onclick="gSubmitDJ()">일감 등록하기</button></div>';
  window.scrollTo(0,0);
};
window.gSubmitDJ=async function(){
  var work=""; document.querySelectorAll("#dj-work .gpick-i.on").forEach(function(b){ work=b.textContent.trim(); });
  var v=function(id){ return (($(id)||{}).value||"").trim(); };
  if(!work||!v("dj-date")||!v("dj-head")||!v("dj-pay")||!v("dj-company")||!v("dj-contact")){
    setMsg("dj-msg","업무·날짜·인원·금액·업체명·연락처는 필수입니다.","err"); return; }
  var btn=$("dj-submit"); if(btn){ btn.disabled=true; btn.textContent="등록 중…"; }
  var r=await insertSafe("day_jobs",{
    user_id: ME.user?ME.user.id:null,
    company:v("dj-company"), contact:v("dj-contact"),
    work_type:work, work_date:v("dj-date"),
    start_time:v("dj-start")||null, end_time:v("dj-end")||null,
    headcount:parseInt(v("dj-head"),10)||1,
    pay:num(v("dj-pay")), pay_type:v("dj-paytype")||"일당",
    region:v("dj-region"), address:v("dj-addr")||null,
    experience:v("dj-exp"), detail:v("dj-detail")||null, status:"모집중"
  });
  if(btn){ btn.disabled=false; btn.textContent="일감 등록하기"; }
  if(r.error){ setMsg("dj-msg", r.missingTable?"db/phase2_schema.sql 을 먼저 실행해주세요.":("등록 실패: "+(r.error.message||"")),"err"); return; }
  toast("일감을 등록했습니다.","ok");
  window.gOpenDaily();
};

/* ── 지원 ── */
window.gApplyDJ=function(id){
  var j=DJ.list.find(function(x){ return String(x.id)===String(id); }); if(!j) return;
  var w = ME.user ? DJ.workers[String(ME.user.id)] : null;
  var host=$("daily-body");
  var box=document.createElement("div");
  box.id="dj-apply-modal";
  box.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1100;display:flex;align-items:flex-end;justify-content:center;padding:0;";
  box.innerHTML='<div style="background:#fff;border-radius:16px 16px 0 0;width:100%;max-width:560px;max-height:88vh;overflow-y:auto;padding:20px 18px 26px;" onclick="event.stopPropagation()">'+
    '<div style="font-size:17px;font-weight:800;margin-bottom:4px;">'+esc(j.company)+' · '+esc(j.work_type)+'</div>'+
    '<div style="font-size:13px;color:var(--ink3);margin-bottom:16px;">'+fmtDate(j.work_date)+' · '+won(j.pay)+'원 '+esc(j.pay_type||"일당")+' · '+esc(j.region||"")+'</div>'+
    '<div class="grow keep">'+
      '<div><label class="glabel">이름 <span class="greq">*</span></label><input class="gin" id="ap-name" value="'+esc((w&&w.name)||ME.name||"")+'"></div>'+
      '<div><label class="glabel">연락처 <span class="greq">*</span></label><input class="gin" id="ap-contact" placeholder="010-0000-0000" value="'+esc((w&&w.contact)||"")+'"></div>'+
    '</div>'+
    '<label class="glabel">경력 (년)</label><input class="gin" id="ap-exp" inputmode="numeric" placeholder="3" value="'+esc(w?String(w.experience_years||""):"")+'">'+
    '<label class="glabel">가능 업무</label>'+
    '<div class="gpick" id="ap-skills">'+WORK_TYPES.map(function(t){
      var on=w&&(w.skills||[]).indexOf(t)>=0;
      return '<button type="button" class="gpick-i'+(on?" on":"")+'" onclick="this.classList.toggle(\'on\')">'+t+'</button>'; }).join("")+'</div>'+
    '<label class="glabel">한마디</label><textarea class="gin" id="ap-msg" placeholder="가능한 시간, 경험, 보유 장비 등"></textarea>'+
    '<div class="gmsg" id="ap-err"></div>'+
    '<div class="grow keep" style="margin-top:16px;"><button class="gbtn gbtn-w" onclick="gCloseApply()">취소</button>'+
    '<button class="gbtn gbtn-p" onclick="gSubmitApply(\''+j.id+'\')">지원하기</button></div></div>';
  box.onclick=function(){ window.gCloseApply(); };
  document.body.appendChild(box);
  document.body.style.overflow="hidden";
};
window.gCloseApply=function(){ var m=$("dj-apply-modal"); if(m) m.remove(); document.body.style.overflow=""; };
window.gSubmitApply=async function(jobId){
  var name=(($("ap-name")||{}).value||"").trim(), contact=(($("ap-contact")||{}).value||"").trim();
  if(!name||!contact){ setMsg("ap-err","이름과 연락처는 필수입니다.","err"); return; }
  var skills=[]; document.querySelectorAll("#ap-skills .gpick-i.on").forEach(function(b){ skills.push(b.textContent.trim()); });
  var exp=parseInt((($("ap-exp")||{}).value||"0").replace(/[^0-9]/g,""),10)||0;
  var r=await insertSafe("day_job_applications",{
    day_job_id:String(jobId), user_id:ME.user?ME.user.id:null,
    worker_name:name, contact:contact, experience_years:exp, skills:skills,
    message:(($("ap-msg")||{}).value||"").trim()||null, status:"지원"
  });
  if(r.error){ setMsg("ap-err", r.missingTable?"db/phase2_schema.sql 을 먼저 실행해주세요.":("지원 실패: "+(r.error.message||"")),"err"); return; }
  if(ME.user){
    await insertSafe("worker_profiles",{ user_id:ME.user.id, name:name, contact:contact, experience_years:exp, skills:skills });
  }
  var j=DJ.list.find(function(x){ return String(x.id)===String(jobId); });
  if(j && j.user_id) pushNotif(j.user_id,"dayjob","당일알바 지원자가 있습니다",name+"님이 "+j.work_type+" 일감에 지원했습니다.");
  window.gCloseApply();
  toast("지원했습니다. 업체가 확인 후 연락드립니다.","ok");
};

/* ── 지원자 목록 (경력·가능업무·평점·작업횟수·후기 기준 선택) ── */
window.gViewApps=async function(jobId){
  var j=DJ.list.find(function(x){ return String(x.id)===String(jobId); }); if(!j) return;
  var r=await selectSafe("day_job_applications", function(q){ return q.eq("day_job_id",String(jobId)).order("created_at",{ascending:false}); });
  var apps=r.data||[];
  var body=$("daily-body");
  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="gOpenDaily()">← 당일알바</button>'+
      '<div><div class="gp-title">지원자 '+apps.length+'명</div><div class="gp-sub">'+esc(j.company)+' · '+esc(j.work_type)+' · '+fmtDate(j.work_date)+'</div></div></div>'+
    (r.unavailable ? setupNote("당일알바 지원") :
     (!apps.length ? '<div class="gempty"><div class="gempty-t">아직 지원자가 없습니다</div><div class="gempty-d">등록한 일감은 인력 목록에 계속 노출됩니다.</div></div>'
      : '<div class="rlist">'+apps.map(function(a){
          var w=a.user_id?DJ.workers[String(a.user_id)]:null;
          var rating=w?(Number(w.rating)||0):0, cnt=w?(Number(w.work_count)||0):0;
          return '<div class="wk">'+
            '<div class="wk-av">'+esc((a.worker_name||"?").slice(0,1))+'</div>'+
            '<div class="wk-b">'+
              '<div class="wk-n">'+esc(a.worker_name)+
                '<span class="gbadge '+(a.status==="선택됨"?"gb-ok":"gb-gy")+'">'+esc(a.status||"지원")+'</span></div>'+
              '<div class="wk-s">'+(a.skills||[]).map(function(s){ return '<span class="gbadge gb-or">'+esc(s)+'</span>'; }).join("")+'</div>'+
              '<div class="wk-st"><span>경력 <b>'+(a.experience_years||0)+'년</b></span>'+
                '<span>평점 <b>'+(rating?rating.toFixed(1):"신규")+'</b></span>'+
                '<span>작업 <b>'+cnt+'회</b></span></div>'+
              (a.message?'<div style="font-size:12.5px;color:var(--ink3);margin-top:8px;line-height:1.55;">'+esc(a.message)+'</div>':'')+
            '</div>'+
            '<div style="flex-shrink:0;display:flex;flex-direction:column;gap:6px;">'+
              '<button class="gbtn gbtn-p gbtn-sm" onclick="gChooseWorker(\''+a.id+'\',\''+esc(jobId)+'\')"'+(a.status==="선택됨"?" disabled":"")+'>선택</button>'+
              '<button class="gbtn gbtn-w gbtn-sm" onclick="GORI.toast(\''+esc(a.worker_name)+' · '+esc(a.contact)+'\')">연락처</button>'+
            '</div></div>';
        }).join("")+'</div>'))+
    '';
  window.scrollTo(0,0);
};
window.gChooseWorker=async function(appId, jobId){
  await updateSafe("day_job_applications",{status:"선택됨"},"id",appId);
  toast("지원자를 선택했습니다. 연락처로 안내해주세요.","ok");
  window.gViewApps(jobId);
};

/* ════════════════════════════════════════════════════════════════════
   업체 상세 · 후기 · 평점 · 관심업체
   ════════════════════════════════════════════════════════════════════ */

var SD = { sup:null, reviews:[], favs:[] };
G.SD = SD;

async function loadFavs(){
  if(!ME.user || SCHEMA.favorites===false){ SD.favs=[]; return; }
  var r=await selectSafe("favorites", function(q){ return q.eq("user_id",ME.user.id); });
  SD.favs=r.data||[];
}
function isFav(type,id){ return SD.favs.some(function(f){ return f.target_type===type && String(f.target_id)===String(id); }); }

window.gToggleFav=async function(type,id,name){
  if(!ME.user){ toast("로그인 후 이용할 수 있습니다.","err"); if(typeof openModal==="function") openModal("login"); return; }
  if(SCHEMA.favorites===false){ toast("db/phase2_schema.sql 을 먼저 실행해주세요.","err"); return; }
  var c=client(); if(!c) return;
  if(isFav(type,id)){
    await c.from("favorites").delete().eq("user_id",ME.user.id).eq("target_type",type).eq("target_id",String(id));
    SD.favs=SD.favs.filter(function(f){ return !(f.target_type===type && String(f.target_id)===String(id)); });
    toast("관심업체에서 해제했습니다.");
  }else{
    await insertSafe("favorites",{ user_id:ME.user.id, target_type:type, target_id:String(id) });
    SD.favs.push({ target_type:type, target_id:String(id) });
    toast((name||"업체")+"를 관심업체에 담았습니다.","ok");
  }
  if(SD.sup && String(SD.sup.id)===String(id)) renderSupplierDetail();
};

/* 기존 renderSP 를 확장 상세 페이지로 교체 */
window.renderSP=async function(id){
  var el=$("sp-body"); if(!el) return;
  el.innerHTML='<div style="padding:50px 0;text-align:center;color:var(--ink4);">불러오는 중…</div>';
  var c=client(), sup=null;
  if(c){
    var r=await c.from("suppliers").select("*").eq("id", id).limit(1);
    sup=(r.data&&r.data[0])||null;
  }
  if(!sup && typeof SUPS!=="undefined"){
    var s=SUPS.find(function(x){ return String(x.id)===String(id); });
    if(s) sup={ id:s.id, name:s.nm, region:(s.cat||"").split(" · ")[0], categories:s.cats, rating:s.rt, lead_time:s.rs, min_qty:s.minq, description:s.desc, is_verified:s.vf };
  }
  if(!sup){ el.innerHTML='<div class="gp"><div class="gempty"><div class="gempty-t">업체를 찾을 수 없습니다</div><button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;suppliers&quot;)">업체 목록으로</button></div></div>'; return; }
  SD.sup=sup;
  await loadFavs();
  var rv=await selectSafe("reviews", function(q){ return q.eq("target_type","supplier").eq("target_id",String(id)).order("created_at",{ascending:false}).limit(50); });
  SD.reviews = rv.unavailable ? null : (rv.data||[]);
  renderSupplierDetail();
};

function renderSupplierDetail(){
  var s=SD.sup, el=$("sp-body"); if(!s||!el) return;
  var rvs=SD.reviews||[];
  var avg = rvs.length ? (rvs.reduce(function(a,r){ return a+(Number(r.rating)||0); },0)/rvs.length) : (Number(s.rating)||0);
  var cats=(s.categories||[]).slice();
  var mains=(s.category_mains||[]).map(function(k){ var c=(typeof cat8Of==="function")?cat8Of(k):null; return c?c.nm:k; });
  var cover=(s.images&&s.images[0])?('background-image:url('+s.images[0]+');'):('background:'+((typeof supColor==="function")?supColor(s.id):"#1A2332")+';');
  var fav=isFav("supplier",s.id);

  el.innerHTML='<div class="gp">'+
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;suppliers&quot;)">← 업체 목록</button></div>'+
    '<div class="sd-hero">'+
      '<div class="sd-cover" style="'+cover+'"><div class="sd-ct">'+
        '<div class="sd-nm">'+esc(s.name)+'</div>'+
        '<div class="sd-loc">'+esc(s.region||"지역 미등록")+(cats.length?" · "+esc(cats.slice(0,3).join(" · ")):"")+'</div>'+
      '</div></div>'+
      '<div class="sd-stats">'+
        '<div class="sd-si"><div class="sd-sv qstar">★ '+(avg?avg.toFixed(1):"—")+'</div><div class="sd-sl">평점</div></div>'+
        '<div class="sd-si"><div class="sd-sv">'+(rvs.length||0)+'</div><div class="sd-sl">후기</div></div>'+
        '<div class="sd-si"><div class="sd-sv">'+(Number(s.deal_count)||0)+'</div><div class="sd-sl">거래실적</div></div>'+
        '<div class="sd-si"><div class="sd-sv">'+esc(s.lead_time||"—")+'</div><div class="sd-sl">평균 납기</div></div>'+
      '</div>'+
    '</div>'+

    '<div class="sd-certs">'+
      '<div class="sd-cert'+(s.is_verified?"":" off")+'">'+(s.is_verified?"✓":"·")+' 고리 인증</div>'+
      '<div class="sd-cert'+(s.brn_verified||s.brn?"":" off")+'">'+(s.brn_verified||s.brn?"✓":"·")+' 사업자 등록</div>'+
      '<div class="sd-cert'+(s.haccp?"":" off")+'">'+(s.haccp?"✓":"·")+' HACCP</div>'+
    '</div>'+

    '<div class="gcard"><div class="gcard-t">기본 정보</div>'+
      '<div class="gsum">'+
        row("취급 품목", (s.items&&s.items.length)?s.items.join(", "):(cats.length?cats.join(", "):"—"))+
        row("제공 서비스", (s.services&&s.services.length)?s.services.join(", "):(mains.length?mains.join(", "):"—"))+
        row("지역", s.region||"—")+
        row("최소 주문·작업량", s.min_qty||"—")+
        row("납기", s.lead_time||"—")+
        row("연락처", s.contact||"—")+
        (s.address?row("주소", s.address):"")+
      '</div></div>'+

    ((s.images&&s.images.length)?'<div class="gcard"><div class="gcard-t">회사 사진</div><div class="sd-imgs">'+
      s.images.slice(0,6).map(function(u){ return '<div class="sd-img" style="background-image:url('+esc(u)+');"></div>'; }).join("")+'</div></div>':'')+

    '<div class="gcard"><div class="gcard-t">업체 소개</div>'+
      '<p style="font-size:14px;color:var(--ink2);line-height:1.75;white-space:pre-wrap;">'+
        esc(s.intro||s.description||((s.region||"")+" 지역의 "+((cats[0]||"축산"))+" 전문 업체입니다."))+'</p></div>'+

    '<div class="gcard"><div class="gcard-t">후기 '+(SD.reviews===null?"":"("+rvs.length+")")+'</div>'+
      (SD.reviews===null ? setupNote("후기")
       : (!rvs.length ? '<div class="gempty" style="padding:26px 16px;"><div class="gempty-t">아직 후기가 없습니다</div><div class="gempty-d">거래를 완료하면 후기를 남길 수 있습니다.</div></div>'
          : rvs.map(function(r){
              return '<div class="rv"><div class="rv-top"><div class="rv-a">'+esc(r.author_name||"익명")+' '+stars(r.rating,true)+'</div>'+
                '<div class="rv-d">'+ago(r.created_at)+'</div></div>'+
                '<div class="rv-c">'+esc(r.content||"")+'</div>'+
                (r.deal_summary?'<div class="rv-deal">거래: '+esc(r.deal_summary)+'</div>':'')+'</div>';
            }).join("")))+
    '</div>'+

    '<div class="sd-cta">'+
      '<button class="gbtn gbtn-w" style="flex:0 0 auto;" onclick="gToggleFav(\'supplier\',\''+esc(s.id)+'\',\''+esc(s.name)+'\')">'+(fav?"♥ 관심":"♡ 관심")+'</button>'+
      '<button class="gbtn gbtn-w" style="flex:1;" onclick="GORI.toast(\''+esc(s.name)+' · '+esc(s.contact||"연락처 미등록")+'\')">연락처</button>'+
      '<button class="gbtn gbtn-p" style="flex:2;" onclick="gRequestToSupplier(\''+esc(s.id)+'\')">견적 요청하기</button>'+
    '</div></div>';
  window.scrollTo(0,0);
}
function row(k,v){ return '<div class="gsum-r"><div class="gsum-k">'+esc(k)+'</div><div class="gsum-v">'+esc(v)+'</div></div>'; }

window.gRequestToSupplier=function(id){
  var s=SD.sup;
  var key = s && s.category_mains && s.category_mains[0] ? s.category_mains[0]
          : (s && s.categories && s.categories.length && typeof key8Of==="function" ? key8Of(s.categories[0]) : "meat");
  G.W.cat=key||"meat"; G.W.sub=null; G.W.data={};
  if(typeof go==="function") go("rw");
  setTimeout(function(){ window.gStep2(); toast((s?s.name:"업체")+" 등 조건에 맞는 업체에 요청이 전달됩니다."); }, 60);
};

/* ── 후기 작성 ── */
window.gOpenReview=function(type, targetId, targetName, requestId){
  if(SCHEMA.reviews===false){ toast("db/phase2_schema.sql 을 먼저 실행해주세요.","err"); return; }
  if(typeof go==="function") go("review");
  var body=$("review-body"); if(!body) return;
  body.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;my&quot;)">← 거래관리</button>'+
      '<div><div class="gp-title">후기 남기기</div><div class="gp-sub">'+esc(targetName||"")+'</div></div></div>'+
    '<div class="gcard">'+
      '<label class="glabel">평점 <span class="greq">*</span></label>'+
      '<div class="stars" id="rv-stars" style="font-size:30px;">'+[1,2,3,4,5].map(function(i){
        return '<span style="font-size:30px;" onclick="gSetRating('+i+')">★</span>'; }).join("")+'</div>'+
      '<label class="glabel">거래 내용</label><input class="gin" id="rv-deal" placeholder="한우 지육 10두 / 냉장 정기배송 등">'+
      '<label class="glabel">후기 <span class="greq">*</span></label>'+
      '<textarea class="gin" id="rv-content" placeholder="납기, 품질, 소통, 가격 등 실제 경험을 적어주세요"></textarea>'+
      '<div class="gmsg" id="rv-msg"></div>'+
    '</div>'+
    '<div class="grow keep"><button class="gbtn gbtn-w" onclick="go(&quot;my&quot;)">나중에</button>'+
    '<button class="gbtn gbtn-p" id="rv-submit" onclick="gSubmitReview(\''+esc(type)+'\',\''+esc(targetId)+'\',\''+esc(requestId||"")+'\')">후기 등록</button></div>';
  G._rating=5; window.gSetRating(5);
  window.scrollTo(0,0);
};
window.gSetRating=function(n){
  G._rating=n;
  var st=$("rv-stars"); if(!st) return;
  st.querySelectorAll("span").forEach(function(s,i){ s.classList.toggle("on", i<n); });
};
window.gSubmitReview=async function(type,targetId,requestId){
  var content=(($("rv-content")||{}).value||"").trim();
  if(!content){ setMsg("rv-msg","후기 내용을 입력해주세요.","err"); return; }
  var btn=$("rv-submit"); if(btn){ btn.disabled=true; btn.textContent="등록 중…"; }
  var r=await insertSafe("reviews",{
    target_type:type, target_id:String(targetId), request_id:requestId||null,
    user_id:ME.user?ME.user.id:null, author_name:ME.name||"익명",
    rating:G._rating||5, content:content,
    deal_summary:(($("rv-deal")||{}).value||"").trim()||null
  });
  if(btn){ btn.disabled=false; btn.textContent="후기 등록"; }
  if(r.error){ setMsg("rv-msg", r.missingTable?"db/phase2_schema.sql 을 먼저 실행해주세요.":("등록 실패: "+(r.error.message||"")),"err"); return; }
  if(type==="supplier" && targetId){
    var rv=await selectSafe("reviews", function(q){ return q.eq("target_type","supplier").eq("target_id",String(targetId)); });
    var list=rv.data||[];
    if(list.length){
      var avg=list.reduce(function(a,x){ return a+(Number(x.rating)||0); },0)/list.length;
      await updateSafe("suppliers",{ rating:Math.round(avg*10)/10, review_count:list.length },"id",targetId);
    }
  }
  toast("후기를 등록했습니다. 감사합니다.","ok");
  if(typeof go==="function") go("my");
};

/* ════════════════════════════════════════════════════════════════════
   거래관리 (마이페이지)
   내 요청 / 받은 견적 / 보낸 견적 / 진행 중 / 완료 / 당일알바 /
   관심업체 / 후기 / 알림 / 회원·업체정보
   ════════════════════════════════════════════════════════════════════ */

var MY = { tab:"reqs", reqs:[], quotesIn:[], quotesOut:[], dayjobs:[], apps:[], favSups:[], reviews:[], sups:[] };
G.MY = MY;

var MY_TABS=[
  ["reqs","내 요청"],["in","받은 견적"],["out","보낸 견적"],["ing","진행 중"],
  ["done","완료 거래"],["daily","당일알바"],["fav","관심업체"],["rv","내 후기"],
  ["noti","알림"],["me","회원·업체정보"]
];

window.gOpenMy=async function(){
  var host=$("pg-my"); if(!host) return;
  host.innerHTML='<div class="gp gp-wide" id="my-body"></div>';
  var body=$("my-body");
  if(!ME.user){
    body.innerHTML='<div class="my-hd"><div class="my-nm">거래관리</div>'+
      '<div class="my-em">로그인하면 내 요청과 견적, 거래 진행 상황을 한 곳에서 볼 수 있습니다.</div></div>'+
      '<div class="gempty"><div class="gempty-t">로그인이 필요합니다</div>'+
      '<div class="gempty-d">요청·견적·거래·후기 내역은 계정에 연결되어 보관됩니다.</div>'+
      '<div class="grow keep" style="max-width:320px;margin:0 auto;">'+
      '<button class="gbtn gbtn-p" onclick="openModal(\'login\')">로그인</button>'+
      '<button class="gbtn gbtn-w" onclick="openModal(\'signup\')">회원가입</button></div></div>'+
      '<div class="gcard" style="margin-top:16px;"><div class="gcard-t">로그인 없이도 가능합니다</div>'+
      '<div class="grow keep"><button class="gbtn gbtn-w" onclick="go(&quot;rw&quot;)">요청 올리기</button>'+
      '<button class="gbtn gbtn-w" onclick="go(&quot;sj&quot;)">업체 등록</button>'+
      '<button class="gbtn gbtn-w" onclick="gOpenDaily()">당일알바</button></div></div>';
    return;
  }
  body.innerHTML='<div style="padding:50px 0;text-align:center;color:var(--ink4);">불러오는 중…</div>';
  await loadMy();
  renderMy();
};

async function loadMy(){
  var uid=ME.user.id;
  var r1=await selectSafe("purchase_requests", function(q){ return q.eq("user_id",uid).order("created_at",{ascending:false}); });
  MY.reqs=r1.data||[];
  var ids=MY.reqs.map(function(r){ return String(r.id); });
  var r2 = ids.length ? await selectSafe("quotes", function(q){ return q.in("request_id",ids).order("created_at",{ascending:false}); }) : {data:[]};
  MY.quotesIn=r2.data||[];
  var r3=await selectSafe("quotes", function(q){ return q.eq("user_id",uid).order("created_at",{ascending:false}); });
  MY.quotesOut=r3.data||[];
  var r4=await selectSafe("day_jobs", function(q){ return q.eq("user_id",uid).order("work_date",{ascending:false}); });
  MY.dayjobs=r4.data||[];
  var r5=await selectSafe("day_job_applications", function(q){ return q.eq("user_id",uid).order("created_at",{ascending:false}); });
  MY.apps=r5.data||[];
  var r6=await selectSafe("reviews", function(q){ return q.eq("user_id",uid).order("created_at",{ascending:false}); });
  MY.reviews=r6.data||[];
  await loadFavs();
  var supIds=SD.favs.filter(function(f){ return f.target_type==="supplier"; }).map(function(f){ return String(f.target_id); });
  MY.favSups = supIds.length ? (await selectSafe("suppliers", function(q){ return q.in("id",supIds); })).data||[] : [];
  MY.sups=(await selectSafe("suppliers", function(q){ return q.eq("user_id",uid); })).data||[];
  await loadNotifs();
}

function counts(){
  return {
    reqs:MY.reqs.length,
    in:MY.quotesIn.length,
    out:MY.quotesOut.length,
    ing:MY.reqs.filter(function(r){ return r.status==="진행중"; }).length,
    done:MY.reqs.filter(function(r){ return r.status==="완료"; }).length,
    daily:MY.dayjobs.length+MY.apps.length,
    fav:MY.favSups.length,
    rv:MY.reviews.length,
    noti:NOTIFS.filter(function(n){ return !n.is_read; }).length,
    me:0
  };
}

function renderMy(){
  var body=$("my-body"); if(!body) return;
  var c=counts();
  body.innerHTML=
    '<div class="my-hd">'+
      '<div class="my-nm">'+esc(ME.name)+'님</div>'+
      '<div class="my-em">'+esc(ME.email)+'</div>'+
      '<div class="my-kpi">'+
        '<div class="my-ki"><div class="my-kv">'+c.reqs+'</div><div class="my-kl">내 요청</div></div>'+
        '<div class="my-ki"><div class="my-kv">'+c.in+'</div><div class="my-kl">받은 견적</div></div>'+
        '<div class="my-ki"><div class="my-kv">'+c.ing+'</div><div class="my-kl">진행 중</div></div>'+
        '<div class="my-ki"><div class="my-kv">'+c.done+'</div><div class="my-kl">완료 거래</div></div>'+
      '</div></div>'+
    '<div class="my-tabs">'+MY_TABS.map(function(t){
      var n=c[t[0]]||0;
      return '<button class="my-tab'+(MY.tab===t[0]?" on":"")+'" onclick="gMyTab(\''+t[0]+'\')">'+t[1]+
        (n?'<span class="cnt">'+n+'</span>':'')+'</button>';
    }).join("")+'</div>'+
    '<div id="my-panel"></div>';
  renderMyPanel();
}
window.gMyTab=function(t){ MY.tab=t; renderMy(); };

function empty(t,d,btn){
  return '<div class="gempty"><div class="gempty-t">'+t+'</div><div class="gempty-d">'+d+'</div>'+(btn||"")+'</div>';
}
function reqRow(r){
  var label=(typeof cat8Label==="function")?cat8Label(r.category):(r.category||"");
  return '<div class="ritem" onclick="gOpenRequest(\''+esc(r.id)+'\')">'+
    '<div class="ritem-top"><span class="gbadge gb-or">'+esc(label)+'</span>'+
      '<span class="gbadge '+(r.status==="완료"?"gb-ok":(r.status==="진행중"?"gb-bl":"gb-gy"))+'">'+esc(r.status||"견적대기")+'</span>'+
      '<span style="font-size:12px;color:var(--ink4);margin-left:auto;">'+ago(r.created_at)+'</span></div>'+
    '<div class="ritem-t">'+esc(r.title||r.description||label+" 요청")+'</div>'+
    '<div class="ritem-m"><span>📍 '+esc(r.region||"전국")+'</span>'+
      (r.deadline?'<span>🗓 '+fmtDate(r.deadline)+'</span>':'')+'</div>'+
    '<div class="ritem-f"><span style="font-size:13px;font-weight:700;color:var(--ink2);">받은 견적 '+(r.quote_count||0)+'건</span>'+
      '<span style="font-size:13px;font-weight:700;color:var(--gn);">견적 비교 ›</span></div></div>';
}
function quoteRow(q, showReq){
  var r=MY.reqs.find(function(x){ return String(x.id)===String(q.request_id); });
  return '<div class="ritem" onclick="gOpenRequest(\''+esc(q.request_id)+'\')">'+
    '<div class="ritem-top"><span class="gbadge '+(q.status==="선택됨"?"gb-ok":(q.status==="미선택"?"gb-gy":"gb-or"))+'">'+esc(q.status||"대기")+'</span>'+
      '<span style="font-size:12px;color:var(--ink4);margin-left:auto;">'+ago(q.created_at)+'</span></div>'+
    '<div class="ritem-t">'+esc(q.supplier_name)+' · '+won(num(q.price))+' '+esc(q.price_unit||"")+'</div>'+
    '<div class="ritem-m">'+(q.lead_time?'<span>납기 '+esc(q.lead_time)+'</span>':'')+
      (q.delivery?'<span>'+esc(q.delivery)+'</span>':'')+
      (showReq&&r?'<span>요청: '+esc(r.title||r.category)+'</span>':'')+'</div></div>';
}

function renderMyPanel(){
  var el=$("my-panel"); if(!el) return;
  var t=MY.tab;

  if(t==="reqs"){
    el.innerHTML = MY.reqs.length
      ? '<div class="rlist">'+MY.reqs.map(reqRow).join("")+'</div>'
      : empty("등록한 요청이 없습니다","필요한 것을 올리면 업체가 견적을 보냅니다.",'<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;rw&quot;)">요청 올리기</button>');
  }
  else if(t==="in"){
    el.innerHTML = SCHEMA.quotes===false ? setupNote("견적")
      : (MY.quotesIn.length ? '<div class="rlist">'+MY.quotesIn.map(function(q){ return quoteRow(q,true); }).join("")+'</div>'
         : empty("받은 견적이 없습니다","요청을 올리면 조건에 맞는 업체가 견적을 보냅니다.",'<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;rw&quot;)">요청 올리기</button>'));
  }
  else if(t==="out"){
    el.innerHTML = SCHEMA.quotes===false ? setupNote("견적")
      : (MY.quotesOut.length ? '<div class="rlist">'+MY.quotesOut.map(function(q){ return quoteRow(q,true); }).join("")+'</div>'
         : empty("보낸 견적이 없습니다","실시간 요청에서 조건이 맞는 건에 견적을 보내보세요.",'<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;reqs&quot;)">실시간 요청 보기</button>'));
  }
  else if(t==="ing" || t==="done"){
    var list=MY.reqs.filter(function(r){ return t==="ing" ? r.status==="진행중" : r.status==="완료"; });
    el.innerHTML = list.length ? '<div class="rlist">'+list.map(function(r){
        var extra = t==="done" ? '<div style="margin-top:10px;"><button class="gbtn gbtn-w gbtn-sm" onclick="event.stopPropagation();gReviewFromRequest(\''+esc(r.id)+'\')">후기 남기기</button></div>' : "";
        return reqRow(r).replace("</div></div>", "</div>"+extra+"</div>");
      }).join("")+'</div>'
      : empty(t==="ing"?"진행 중인 거래가 없습니다":"완료된 거래가 없습니다",
              t==="ing"?"견적을 선택하면 거래가 시작됩니다.":"거래를 완료하면 여기에 쌓이고 후기를 남길 수 있습니다.");
  }
  else if(t==="daily"){
    el.innerHTML = SCHEMA.day_jobs===false ? setupNote("당일알바") :
      '<div style="display:flex;gap:8px;margin-bottom:14px;">'+
        '<button class="gbtn gbtn-p gbtn-sm" onclick="gOpenDJNew()">+ 일감 등록</button>'+
        '<button class="gbtn gbtn-w gbtn-sm" onclick="gOpenDaily()">당일알바 전체</button></div>'+
      '<div class="gcard-t" style="border:none;padding:0;margin-bottom:10px;">등록한 일감 ('+MY.dayjobs.length+')</div>'+
      (MY.dayjobs.length ? '<div class="rlist">'+MY.dayjobs.map(function(j){
        return '<div class="ritem" onclick="gViewApps(\''+esc(j.id)+'\')">'+
          '<div class="ritem-top"><span class="gbadge gb-or">'+esc(j.work_type)+'</span>'+
            '<span class="gbadge gb-gy">'+esc(j.status||"모집중")+'</span></div>'+
          '<div class="ritem-t">'+fmtDate(j.work_date)+' · '+(j.headcount||1)+'명 · '+won(j.pay)+'원</div>'+
          '<div class="ritem-m"><span>📍 '+esc(j.region||"")+'</span><span>지원자 보기 ›</span></div></div>';
      }).join("")+'</div>' : '<div class="ghint" style="margin-bottom:18px;">등록한 일감이 없습니다.</div>')+
      '<div class="gcard-t" style="border:none;padding:0;margin:20px 0 10px;">내 지원 ('+MY.apps.length+')</div>'+
      (MY.apps.length ? '<div class="rlist">'+MY.apps.map(function(a){
        return '<div class="ritem"><div class="ritem-top"><span class="gbadge '+(a.status==="선택됨"?"gb-ok":"gb-gy")+'">'+esc(a.status)+'</span>'+
          '<span style="font-size:12px;color:var(--ink4);margin-left:auto;">'+ago(a.created_at)+'</span></div>'+
          '<div class="ritem-t">'+esc((a.skills||[]).join(", ")||"당일알바 지원")+'</div>'+
          '<div class="ritem-m"><span>경력 '+(a.experience_years||0)+'년</span></div></div>';
      }).join("")+'</div>' : '<div class="ghint">지원한 일감이 없습니다.</div>');
  }
  else if(t==="fav"){
    el.innerHTML = SCHEMA.favorites===false ? setupNote("관심업체")
      : (MY.favSups.length ? '<div class="rlist">'+MY.favSups.map(function(s){
          return '<div class="ritem" onclick="curSID=\''+esc(s.id)+'\';go(&quot;sp&quot;)">'+
            '<div class="ritem-t">'+esc(s.name)+'</div>'+
            '<div class="ritem-m"><span>📍 '+esc(s.region||"")+'</span>'+
              (s.rating?'<span class="qstar">★ '+Number(s.rating).toFixed(1)+'</span>':'')+
              '<span>거래 '+(s.deal_count||0)+'건</span></div>'+
            '<div class="ritem-f"><span style="font-size:13px;color:var(--ink3);">'+esc((s.categories||[]).slice(0,3).join(" · "))+'</span>'+
            '<span style="font-size:13px;font-weight:700;color:var(--gn);">업체 보기 ›</span></div></div>';
        }).join("")+'</div>'
        : empty("관심업체가 없습니다","업체 상세에서 ♡ 를 누르면 여기에 모입니다.",'<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;suppliers&quot;)">업체 찾기</button>'));
  }
  else if(t==="rv"){
    el.innerHTML = SCHEMA.reviews===false ? setupNote("후기")
      : (MY.reviews.length ? '<div class="gcard">'+MY.reviews.map(function(r){
          return '<div class="rv"><div class="rv-top"><div class="rv-a">'+stars(r.rating,true)+'</div><div class="rv-d">'+ago(r.created_at)+'</div></div>'+
            '<div class="rv-c">'+esc(r.content||"")+'</div>'+
            (r.deal_summary?'<div class="rv-deal">거래: '+esc(r.deal_summary)+'</div>':'')+'</div>';
        }).join("")+'</div>'
        : empty("작성한 후기가 없습니다","거래를 완료하면 후기를 남길 수 있습니다."));
  }
  else if(t==="noti"){
    el.innerHTML = SCHEMA.notifications===false ? setupNote("알림")
      : (NOTIFS.length ? '<div class="gcard" style="padding:0;">'+NOTIFS.map(function(n){
          return '<div class="nt'+(n.is_read?"":" unread")+'" onclick="gOpenNotif(\''+n.id+'\')">'+
            '<div class="nt-t">'+esc(n.title)+'</div>'+(n.body?'<div class="nt-b">'+esc(n.body)+'</div>':'')+
            '<div class="nt-d">'+ago(n.created_at)+'</div></div>';
        }).join("")+'</div>'
        : empty("새 알림이 없습니다","견적 도착·선택 등 거래 소식이 여기에 표시됩니다."));
  }
  else if(t==="me"){
    el.innerHTML=
      '<div class="gcard"><div class="gcard-t">회원 정보</div>'+
        '<div class="gsum">'+row("이름",ME.name)+row("이메일",ME.email)+row("회원 유형",ME.role==="supplier"?"업체 회원":"일반 회원")+'</div>'+
        '<div style="margin-top:14px;"><button class="gbtn gbtn-w gbtn-sm" onclick="gLogout()">로그아웃</button></div>'+
      '</div>'+
      '<div class="gcard"><div class="gcard-t">내 업체 ('+MY.sups.length+')</div>'+
        (MY.sups.length ? MY.sups.map(function(s){
            return '<div class="ritem" style="margin-bottom:8px;" onclick="curSID=\''+esc(s.id)+'\';go(&quot;sp&quot;)">'+
              '<div class="ritem-t">'+esc(s.name)+'</div>'+
              '<div class="ritem-m"><span>📍 '+esc(s.region||"")+'</span><span>거래 '+(s.deal_count||0)+'건</span>'+
              '<span>'+(s.is_verified?"인증 완료":"인증 대기")+'</span></div></div>';
          }).join("")
          : '<div class="ghint" style="margin-bottom:12px;">등록한 업체가 없습니다. 업체를 등록하면 요청에 견적을 보낼 수 있습니다.</div>')+
        '<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;sj&quot;)">업체 등록하기</button></div>'+
      '<div class="gcard"><div class="gcard-t">운영</div>'+
        '<div class="grow keep"><button class="gbtn gbtn-w gbtn-sm" onclick="location.href=\'meat_insight_admin.html\'">관리자</button>'+
        '<button class="gbtn gbtn-w gbtn-sm" onclick="location.href=\'meat_insight_apply.html\'">컨설팅 신청</button></div></div>';
  }
}
window.gReviewFromRequest=async function(reqId){
  var r=MY.reqs.find(function(x){ return String(x.id)===String(reqId); });
  var q=MY.quotesIn.find(function(x){ return String(x.request_id)===String(reqId) && x.status==="선택됨"; });
  window.gOpenReview("supplier", q?(q.supplier_id||""):"", q?q.supplier_name:(r?r.title:""), reqId);
};

/* ════════════════════════════════════════════════════════════════════
   기존 화면과의 연결 · 초기화
   ════════════════════════════════════════════════════════════════════ */

/* 요청 목록/카드 클릭 → 요청 상세(견적 비교)로 연결 */
function patchRequestCards(){
  if(typeof renderRQWidget!=="function") return;
  var orig=window.renderRQWidget;
  window.renderRQWidget=function(){
    orig();
    var el=$("rq-widget"); if(!el || typeof REQS==="undefined") return;
    el.querySelectorAll(".rqc").forEach(function(card,i){
      var r=REQS[i]; if(!r) return;
      card.setAttribute("onclick","gOpenRequest('"+String(r.id)+"')");
      var cta=card.querySelector(".rqc-cta"); if(cta) cta.textContent="견적 비교 ›";
    });
  };
  var origReqs=window.renderReqs;
  window.renderReqs=function(){
    origReqs();
    var el=$("rq-list-full"); if(!el || typeof REQS==="undefined") return;
    var data=REQS.filter(function(r){ return (typeof matchCat8==="function") ? matchCat8([r.cat],curRC) : true; });
    el.querySelectorAll(".rqc").forEach(function(card,i){
      var r=data[i]; if(!r) return;
      card.style.cursor="pointer";
      card.setAttribute("onclick","gOpenRequest('"+String(r.id)+"')");
      var cta=card.querySelector(".rqc-cta"); if(cta) cta.textContent="견적 비교 ›";
    });
  };
}

/* 업체 카드의 "견적 요청" 버튼 → 해당 분야 요청서로 */
function patchSupplierCards(){
  if(typeof mkSC!=="function") return;
  var orig=window.mkSC;
  window.mkSC=function(s){
    var d=orig(s);
    var btns=d.querySelectorAll(".sc-btn");
    if(btns[0]) btns[0].setAttribute("onclick","event.stopPropagation();curSID='"+String(s.id)+"';gRequestToSupplier('"+String(s.id)+"')");
    return d;
  };
}

/* 홈에 "당일알바 · 구인구직" 진입 블록 추가 (프로세스 섹션 뒤) */
function injectLaborSection(){
  if($("sec-labor")) return;
  var proc=$("proc-grid"); if(!proc) return;
  var sec=proc.closest("section"); if(!sec) return;
  var el=document.createElement("section");
  el.className="sec sec-alt"; el.id="sec-labor";
  el.innerHTML='<div class="w">'+
    '<div class="sec-hd2 row"><div><h2 class="sec-h2">사람이 필요할 때</h2>'+
      '<p class="sec-d2">오늘 당장 필요한 현장 인력과, 함께 오래 갈 정규직을 나눠서 찾습니다</p></div></div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" id="labor-cards">'+
      '<div class="gcard" style="margin:0;cursor:pointer;" onclick="gOpenDaily()">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'+
          '<span class="gbadge gb-or">실시간 매칭</span><span class="gbadge gb-gy">단기</span></div>'+
        '<div style="font-size:17px;font-weight:800;color:var(--ink);margin-bottom:6px;">당일알바</div>'+
        '<div style="font-size:13px;color:var(--ink3);line-height:1.6;">발골·정형·포장·상하차 등 오늘·내일 바로 일할 인력을 찾습니다. '+
          '지원자의 경력·가능업무·평점·작업횟수를 보고 선택하세요.</div>'+
        '<div style="margin-top:14px;font-size:13.5px;font-weight:700;color:var(--gn);">일감 보기 · 등록하기 ›</div></div>'+
      '<div class="gcard" style="margin:0;cursor:pointer;" onclick="go(&quot;jobs&quot;)">'+
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'+
          '<span class="gbadge gb-bl">채용</span><span class="gbadge gb-gy">장기</span></div>'+
        '<div style="font-size:17px;font-weight:800;color:var(--ink);margin-bottom:6px;">구인구직</div>'+
        '<div style="font-size:13px;color:var(--ink3);line-height:1.6;">정규직·생산직·영업직·사무직·배송직·경력직 채용. '+
          '공고를 올리거나 구직 프로필을 등록하세요.</div>'+
        '<div style="margin-top:14px;font-size:13.5px;font-weight:700;color:var(--gn);">공고 보기 · 등록하기 ›</div></div>'+
    '</div></div>';
  sec.parentNode.insertBefore(el, sec.nextSibling);
}

/* 구인구직 페이지 상단에 당일알바 분리 안내 */
function patchJobsPage(){
  if(typeof renderJobsFull!=="function") return;
  var orig=window.renderJobsFull;
  window.renderJobsFull=function(){
    orig();
    var host=$("pg-jobs"); if(!host || $("jobs-split")) return;
    var wrap=host.querySelector(".job-page-wrap") || host.firstElementChild;
    if(!wrap) return;
    var box=document.createElement("div");
    box.id="jobs-split";
    box.style.cssText="display:flex;gap:8px;align-items:center;justify-content:space-between;background:var(--gnl);border:1px solid var(--gnb);border-radius:12px;padding:13px 16px;margin-bottom:16px;flex-wrap:wrap;";
    box.innerHTML='<div style="font-size:13.5px;color:var(--gn2);font-weight:600;">'+
      '<b>여기는 정규직·장기 채용입니다.</b> 오늘·내일 바로 필요한 현장 인력은 당일알바에서 찾으세요.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="gOpenDaily()">당일알바 보기</button>';
    wrap.insertBefore(box, wrap.firstChild);
  };
}

/* 회원가입에 회원 유형 추가 */
function patchSignup(){
  var box=$("auth-signup"); if(!box || $("s-role")) return;
  var pw=$("s-pw"); if(!pw) return;
  var wrap=document.createElement("div");
  wrap.style.cssText="margin-top:10px;";
  wrap.innerHTML='<label class="glabel" style="margin:0 0 6px;">회원 유형</label>'+
    '<div class="gpick" id="s-role">'+
      '<button type="button" class="gpick-i on" onclick="gPickRole(this,\'buyer\')">구매·의뢰</button>'+
      '<button type="button" class="gpick-i" onclick="gPickRole(this,\'supplier\')">업체·공급</button>'+
      '<button type="button" class="gpick-i" onclick="gPickRole(this,\'worker\')">인력·구직</button>'+
    '</div>';
  pw.parentNode.insertBefore(wrap, pw.nextSibling);
  G._role="buyer";
}
window.gPickRole=function(el,role){
  G._role=role;
  el.parentNode.querySelectorAll(".gpick-i").forEach(function(b){ b.classList.toggle("on", b===el); });
};

/* 가입 시 회원 유형 저장 */
function patchAuth(){
  var origSignup=window.doSignup;
  if(typeof origSignup!=="function") return;
  window.doSignup=async function(){
    var name=(($("s-name")||{}).value||"").trim(), email=(($("s-email")||{}).value||"").trim(), pw=(($("s-pw")||{}).value||"");
    if(!name||!email||!pw){ showAM("signup-msg","이름, 이메일, 비밀번호는 필수입니다.",false); return; }
    if(pw.length<8){ showAM("signup-msg","비밀번호는 8자 이상이어야 합니다.",false); return; }
    var c=client(); if(!c){ showAM("signup-msg","서버에 연결할 수 없습니다.",false); return; }
    try{
      var r=await c.auth.signUp({ email:email, password:pw, options:{ data:{ name:name, role:G._role||"buyer" } } });
      if(r.error) throw r.error;
      showAM("signup-msg","가입 완료! 이메일을 확인해주세요.",true);
      if(r.data && r.data.user) setUser(r.data.user);
    }catch(e){ showAM("signup-msg", e.message, false); }
  };
  var origLogin=window.doLogin;
  if(typeof origLogin==="function"){
    window.doLogin=async function(){
      await origLogin();
      await loadSession();
      if(ME.user && typeof closeModal==="function") closeModal();
    };
  }
}

/* go() 확장 — 신규 페이지 렌더 연결 */
function patchGo(){
  var orig=window.go;
  if(typeof orig!=="function") return;
  window.go=function(p){
    orig(p);
    if(p==="my") window.gOpenMy();
    else if(p==="daily") window.gOpenDaily();   /* 재진입 가드는 gOpenDaily 내부 */
    var mm=$("mobile-menu"); if(mm) mm.classList.remove("on");
  };
}

/* 하단 네비 '+' → 3단계 요청서 */
function patchBottomNav(){
  var plus=document.querySelector(".bplus");
  if(plus) plus.setAttribute("onclick","go(\"rw\")");
  var nav=document.querySelector(".bnav"); if(!nav) return;
  var jobsBtn=$("bn-my");
  if(jobsBtn && !$("bn-daily-hint")) { /* 구조는 유지 (홈/요청/+/업체/내활동) */ }
}

/* 헤더 카테고리 바에 '당일알바' 바로가기 */
function patchHeaderCats(){
  if(typeof renderHdrCats!=="function") return;
  var orig=window.renderHdrCats;
  window.renderHdrCats=function(){
    orig();
    var el=$("hdr-cats"); if(!el || el.querySelector(".hc-daily")) return;
    var b=document.createElement("button");
    b.className="hc-item hc-daily";
    b.style.cssText="margin-left:auto;color:var(--gn);font-weight:700;";
    b.textContent="⚡ 당일알바";
    b.onclick=function(){ window.gOpenDaily(); };
    el.appendChild(b);
  };
}

/* ── 초기화 ── */
async function init(){
  injectPages();
  patchGo();
  patchRequestCards();
  patchSupplierCards();
  patchJobsPage();
  patchHeaderCats();
  patchBottomNav();
  patchSignup();
  patchAuth();
  injectLaborSection();
  if(typeof renderHdrCats==="function") renderHdrCats();

  await probeSchema();
  await loadSession();
  await loadFavs();

  /* 홈 하단에 DB 준비 안내 (신규 테이블이 하나도 없을 때만) */
  var ready=NEW_TABLES.filter(function(t){ return SCHEMA[t]; }).length;
  if(client() && ready===0){
    var host=$("sec-labor");
    if(host && !$("db-note")){
      var n=document.createElement("div");
      n.id="db-note"; n.className="w"; n.style.cssText="padding-top:18px;";
      n.innerHTML=setupNote("견적 비교·당일알바·후기");
      host.querySelector(".w").appendChild(n.firstChild);
    }
  }
}

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init);
else init();

})();


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

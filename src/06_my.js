
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

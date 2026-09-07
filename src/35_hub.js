/* ════════════════════════════════════════════════════════════════════
   거래관리 — 한눈에 보기

   탭이 12개인데 전부 따로 놀았습니다. 견적이 왔는지, 안 읽은 채팅이
   있는지, 후기를 남겨야 하는지 알려면 탭을 열두 번 눌러야 했고,
   "진행 중" · "거래 진행" · "완료 거래" 는 이름만 봐서는 구분도
   안 됐습니다.

   두 가지를 합칩니다.

   1) 첫 화면에 "한눈에 보기" 를 둡니다. 지금 손이 가야 할 일과
      각 영역의 최근 몇 줄을 한 화면에 모으고, 누르면 원래 탭으로
      들어갑니다. 탭은 하나도 지우지 않았습니다.
   2) 흩어진 탭 12개를 네 묶음(요청·견적 / 거래 / 소통 / 그 밖)으로
      나눠 세로 목록에 소제목을 답니다.

   여기 숫자는 전부 이미 불러온 MY · CHAT · NOTIFS 에서 셉니다.
   표가 없어 못 불러온 영역은 0 으로 보이지, 지어내지 않습니다.
   ════════════════════════════════════════════════════════════════════ */

/* 탭 묶음 — 여기 없는 탭은 맨 끝 "그 밖" 으로 갑니다 */
var HUB_GRP=[
  ["", ["hub"]],
  ["요청·견적", ["reqs","in","out"]],
  ["거래",      ["ing","order","done"]],
  ["소통",      ["chat","noti"]],
  ["그 밖",     ["daily","fav","rv","me"]]
];

function hubRooms(){ return (typeof CHAT!=="undefined" && CHAT.rooms) ? CHAT.rooms : []; }
function hubNotis(){ return (typeof NOTIFS!=="undefined" && NOTIFS) ? NOTIFS : []; }

/* 요청 한 건에 살아 있는 견적 수 */
function hubQn(r){
  return (MY.quotesIn||[]).filter(function(q){
    return String(q.request_id)===String(r.id) && q.status!=="철회";
  }).length;
}

/* 지금 손이 가야 할 일 — 없는 건 아예 안 보여 줍니다 */
function hubTodos(){
  var t=[];
  var newQ=(MY.reqs||[]).filter(function(r){
    return String(r.status||"견적대기")==="견적대기" && hubQn(r)>0;
  });
  if(newQ.length) t.push({n:newQ.length, l:"견적이 도착한 요청", tab:"in", tone:"gn"});

  var unread=hubNotis().filter(function(n){ return !n.is_read; }).length;
  if(unread) t.push({n:unread, l:"안 읽은 알림", tab:"noti", tone:"gn"});

  var unchat=hubRooms().reduce(function(a,r){ return a+(Number(r._unread)||0); },0);
  if(unchat) t.push({n:unchat, l:"안 읽은 메시지", tab:"chat", tone:"gn"});

  var toRv=(MY.reqs||[]).filter(function(r){
    return r.status==="완료" && !(MY.reviews||[]).some(function(v){ return String(v.request_id)===String(r.id); });
  }).length;
  if(toRv) t.push({n:toRv, l:"후기를 남길 거래", tab:"done", tone:"am"});

  return t;
}

/* 한 줄짜리 항목 — 카드보다 훑기 쉽습니다 */
function hubRow(title, meta, onclick){
  return '<button class="hub-row" onclick="'+onclick+'">'+
    '<span class="hub-row-t">'+esc(title)+'</span>'+
    (meta?'<span class="hub-row-m">'+esc(meta)+'</span>':'')+
    '<span class="hub-row-c">›</span></button>';
}

function hubCard(title, n, tab, rows, emptyMsg){
  return '<div class="hub-card">'+
    '<div class="hub-hd"><div class="hub-t">'+esc(title)+
      '<b'+(n?'':' class="z"')+'>'+n+'</b></div>'+
      (n?'<button class="hub-all" onclick="gMyTab(\''+tab+'\')">전체 ›</button>':'')+
    '</div>'+
    (rows.length ? '<div class="hub-rows">'+rows.join("")+'</div>'
                 : '<div class="hub-none">'+esc(emptyMsg)+'</div>')+
  '</div>';
}

function hubPanel(){
  var el=$("my-panel"); if(!el) return;
  var reqs=MY.reqs||[], qin=MY.quotesIn||[], qout=MY.quotesOut||[];
  var ing=reqs.filter(function(r){ return r.status==="진행중"; });
  var rooms=hubRooms(), notis=hubNotis();
  var todos=hubTodos();

  var todoHtml = todos.length
    ? '<div class="hub-todo">'+todos.map(function(t){
        return '<button class="hub-td '+t.tone+'" onclick="gMyTab(\''+t.tab+'\')">'+
          '<span class="hub-td-n">'+t.n+'</span>'+
          '<span class="hub-td-l">'+esc(t.l)+'</span></button>';
      }).join("")+'</div>'
    : '<div class="hub-clear">지금 처리할 일이 없습니다. 새 요청을 올리거나 올라온 요청에 견적을 보내보세요.'+
      '<span class="hub-clear-b">'+
        '<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;rw&quot;)">요청 올리기</button>'+
        '<button class="gbtn gbtn-w gbtn-sm" onclick="go(&quot;reqs&quot;)">올라온 요청 보기</button>'+
      '</span></div>';

  var cards=[
    hubCard("내 요청", reqs.length, "reqs",
      reqs.slice(0,3).map(function(r){
        return hubRow(r.title||r.description||"요청",
          "견적 "+hubQn(r)+"건 · "+(r.status||"견적대기"),
          'gOpenRequest(\''+esc(r.id)+'\')');
      }), "등록한 요청이 없습니다"),

    hubCard("받은 견적", qin.length, "in",
      qin.slice(0,3).map(function(q){
        return hubRow(q.supplier_name||"업체",
          (num(q.price)!=null?won(num(q.price))+"원":"")+(q.lead_time?" · 납기 "+q.lead_time:""),
          'gOpenRequest(\''+esc(q.request_id)+'\')');
      }), "받은 견적이 없습니다"),

    hubCard("보낸 견적", qout.length, "out",
      qout.slice(0,3).map(function(q){
        return hubRow((q.status||"대기")+" · "+(num(q.price)!=null?won(num(q.price))+"원":"금액 미기재"),
          ago(q.created_at), 'gOpenRequest(\''+esc(q.request_id)+'\')');
      }), "보낸 견적이 없습니다"),

    hubCard("진행 중 거래", ing.length, "ing",
      ing.slice(0,3).map(function(r){
        return hubRow(r.title||r.description||"요청", r.region||"", 'gOpenRequest(\''+esc(r.id)+'\')');
      }), "진행 중인 거래가 없습니다"),

    hubCard("채팅", rooms.length, "chat",
      rooms.slice(0,3).map(function(r){
        var iAmBuyer=String(r.buyer_user_id||"")===String((ME.user||{}).id);
        return hubRow((iAmBuyer?(r.supplier_name||"업체"):(r.buyer_name||"요청자"))+(r._unread?" ("+r._unread+")":""),
          truncate(r.last_message||"", 22), 'gOpenChat(\''+esc(r.id)+'\')');
      }), "아직 대화가 없습니다"),

    hubCard("알림", notis.length, "noti",
      notis.slice(0,3).map(function(n){
        return hubRow(n.title||"알림", ago(n.created_at), 'gOpenNotif(\''+esc(n.id)+'\')');
      }), "받은 알림이 없습니다")
  ];

  var chips=[["daily","당일알바",(MY.dayjobs||[]).length+(MY.apps||[]).length],
             ["fav","관심업체",(MY.favSups||[]).length],
             ["rv","내 후기",(MY.reviews||[]).length],
             ["me","회원·업체정보",null]];

  el.innerHTML=
    todoHtml+
    '<div class="hub-grid">'+cards.join("")+'</div>'+
    '<div class="hub-chips">'+chips.map(function(c){
      return '<button class="hub-chip" onclick="gMyTab(\''+c[0]+'\')">'+esc(c[1])+
        (c[2]!=null?'<b>'+c[2]+'</b>':'')+'</button>';
    }).join("")+'</div>';
}

/* ── 탭 묶기 ── */
function hubGroupTabs(){
  var bar=document.querySelector("#my-body .my-tabs");
  if(!bar || bar.querySelector(".my-grp")) return;
  var byKey={};
  [].slice.call(bar.querySelectorAll(".my-tab")).forEach(function(b){
    var m=/gMyTab\('([^']+)'\)/.exec(b.getAttribute("onclick")||"");
    if(m) byKey[m[1]]=b;
  });
  var used={};
  HUB_GRP.forEach(function(g){
    var got=g[1].map(function(k){ return byKey[k]; }).filter(Boolean);
    if(!got.length) return;
    if(g[0]){
      var h=document.createElement("div");
      h.className="my-grp"; h.textContent=g[0];
      bar.appendChild(h);
    }
    got.forEach(function(b){ bar.appendChild(b); });
    g[1].forEach(function(k){ if(byKey[k]) used[k]=1; });
  });
  /* 묶음에 넣지 못한 탭은 순서 그대로 맨 뒤에 둡니다 */
  Object.keys(byKey).forEach(function(k){ if(!used[k]) bar.appendChild(byKey[k]); });
}

function patchHub(){
  if(G._hub) return; G._hub=true;

  if(typeof MY_TABS!=="undefined" && !MY_TABS.some(function(t){ return t[0]==="hub"; })){
    MY_TABS.unshift(["hub","한눈에 보기"]);
  }
  /* 처음 열면 요약부터 보여 줍니다 (사용자가 고른 탭은 건드리지 않습니다) */
  if(typeof MY!=="undefined" && MY.tab==="reqs") MY.tab="hub";

  if(typeof renderMyPanel==="function"){
    var origMP=renderMyPanel;
    renderMyPanel=function(){
      if(typeof MY!=="undefined" && MY.tab==="hub"){
        try{ hubPanel(); return; }catch(e){}
      }
      return origMP.apply(this, arguments);
    };
    window.renderMyPanel=renderMyPanel;
  }
  if(typeof renderMy==="function"){
    var origMy=renderMy;
    renderMy=function(){
      var r=origMy.apply(this, arguments);
      try{ hubGroupTabs(); }catch(e){}
      return r;
    };
  }
}

/* ════════════════════════════════════════════════════════════════════
   실시간 갱신 (Supabase Realtime)
   지금까지 새 견적·새 메시지·새 알림은 화면을 다시 열어야 보였고,
   채팅만 6초마다 다시 물어보고 있었습니다.

   Realtime 은 db/phase6_realtime.sql 을 실행해야 켜집니다.
   실행하지 않아도 아래 코드는 조용히 아무 것도 하지 않고,
   기존 폴링·수동 새로고침 동작이 그대로 유지됩니다.
   ════════════════════════════════════════════════════════════════════ */

var LIVE = { ch:{}, connected:false, seen:{} };
G.LIVE = LIVE;

function liveClient(){
  var c=client();
  return (c && typeof c.channel==="function") ? c : null;
}
function liveUnsub(name){
  var ch=LIVE.ch[name]; if(!ch) return;
  try{
    var c=liveClient();
    if(c && typeof c.removeChannel==="function") c.removeChannel(ch);
    else if(ch && typeof ch.unsubscribe==="function") ch.unsubscribe();
  }catch(e){}
  delete LIVE.ch[name];
}
function liveSub(name, table, filter, onRow){
  var c=liveClient(); if(!c) return null;
  liveUnsub(name);
  try{
    var opt={ event:"INSERT", schema:"public", table:table };
    if(filter) opt.filter=filter;
    var ch=c.channel("gori-"+name+"-"+Date.now())
      .on("postgres_changes", opt, function(payload){
        var row=payload && (payload.new || payload.record);
        if(!row) return;
        var k=name+":"+(row.id||JSON.stringify(row));
        if(LIVE.seen[k]) return;          /* 폴링과 겹쳐 두 번 처리되는 것 방지 */
        LIVE.seen[k]=1;
        try{ onRow(row); }catch(e){}
      })
      .subscribe(function(status){
        if(status==="SUBSCRIBED") LIVE.connected=true;
      });
    LIVE.ch[name]=ch;
    return ch;
  }catch(e){ return null; }
}

/* ── 알림: 내 계정으로 오는 새 알림 ── */
function liveNotifs(){
  liveUnsub("notif");
  if(!ME.user || SCHEMA.notifications===false) return;
  liveSub("notif","notifications","user_id=eq."+ME.user.id, function(n){
    if(typeof NOTIFS==="undefined") return;
    if(NOTIFS.some(function(x){ return String(x.id)===String(n.id); })) return;
    NOTIFS.unshift(n);
    if(typeof renderHeaderUser==="function") renderHeaderUser();
    toast(n.title||"새 알림이 도착했습니다","ok");
  });
}

/* ── 채팅: 열려 있는 방의 새 메시지 ── */
function liveChat(roomId){
  liveUnsub("chat");
  if(!roomId) return;
  liveSub("chat","chat_messages","room_id=eq."+roomId, function(m){
    if(!CHAT.cur || String(CHAT.cur.id)!==String(roomId)) return;
    if(typeof refreshMsgs==="function") refreshMsgs(true);
  });
}

/* ── 견적: 보고 있는 요청에 새로 도착하는 견적 ── */
function liveQuotes(reqId){
  liveUnsub("quote");
  if(!reqId || SCHEMA.quotes===false) return;
  liveSub("quote","quotes","request_id=eq."+String(reqId), async function(q){
    if(!CUR.req || String(CUR.req.id)!==String(reqId)) return;
    if((CUR.quotes||[]).some(function(x){ return String(x.id)===String(q.id); })) return;
    var r=await selectSafe("quotes", function(qq){
      return qq.eq("request_id", String(reqId)).order("created_at",{ascending:false});
    });
    CUR.quotes = r.unavailable ? CUR.quotes : (r.data||[]);
    if(typeof renderRequestDetail==="function") renderRequestDetail();
    toast((q.supplier_name||"업체")+" 견적이 도착했습니다","ok");
  });
}

function patchLive(){
  if(LIVE._patched) return; LIVE._patched=true;

  if(typeof loadNotifs==="function"){
    var orig=loadNotifs;
    loadNotifs=async function(){
      var r=await orig.apply(this, arguments);
      try{ liveNotifs(); }catch(e){}
      return r;
    };
  }

  var origChat=window.gOpenChat;
  if(typeof origChat==="function"){
    window.gOpenChat=async function(roomId){
      var r=await origChat.apply(this, arguments);
      try{ liveChat(roomId); }catch(e){}
      return r;
    };
  }
  var origClose=window.gCloseChat;
  if(typeof origClose==="function"){
    window.gCloseChat=function(){ liveUnsub("chat"); return origClose.apply(this, arguments); };
  }

  var origReq=window.gOpenRequest;
  if(typeof origReq==="function"){
    window.gOpenRequest=async function(id){
      var r=await origReq.apply(this, arguments);
      try{ liveQuotes(id); }catch(e){}
      return r;
    };
  }

  /* 다른 화면으로 나가면 구독을 정리합니다 */
  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(p){
      if(p!=="reqd" && p!=="quote") liveUnsub("quote");
      if(p!=="chat") liveUnsub("chat");
      return origGo.apply(this, arguments);
    };
  }

  /* 로그인/로그아웃 시 알림 구독 갱신 */
  if(typeof loadSession==="function"){
    var origLS=loadSession;
    loadSession=async function(){
      var r=await origLS.apply(this, arguments);
      try{ liveNotifs(); }catch(e){}
      return r;
    };
  }
  try{ liveNotifs(); }catch(e){}
}

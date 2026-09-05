
/* ════════════════════════════════════════════════════════════════════
   1:1 채팅 — 요청자 ↔ 업체
   숨고의 핵심 접점. 견적을 받은 뒤 실제 조율이 일어나는 곳입니다.
   ════════════════════════════════════════════════════════════════════ */

var CHAT = { rooms:[], cur:null, msgs:[], sub:null, timer:null };
G.CHAT = CHAT;

function chatUnread(){
  return CHAT.rooms.reduce(function(a,r){ return a+(r._unread||0); },0);
}
G.chatUnread=chatUnread;

async function loadRooms(){
  if(!ME.user || SCHEMA.chat_rooms===false){ CHAT.rooms=[]; return; }
  var c=client(); if(!c) return;
  var r=await c.from("chat_rooms").select("*").order("last_at",{ascending:false}).limit(100);
  if(r.error){ if(isMissingTable(r.error)) SCHEMA.chat_rooms=false; CHAT.rooms=[]; return; }
  var rooms=(r.data||[]).filter(function(x){
    return String(x.buyer_user_id||"")===String(ME.user.id) || String(x.supplier_user_id||"")===String(ME.user.id);
  });
  /* 안 읽은 메시지 수 */
  for(var i=0;i<rooms.length;i++){
    var m=await c.from("chat_messages").select("id,is_read,sender_id").eq("room_id",rooms[i].id);
    rooms[i]._unread=((m.data)||[]).filter(function(x){ return !x.is_read && String(x.sender_id||"")!==String(ME.user.id); }).length;
  }
  CHAT.rooms=rooms;
}
G.loadRooms=loadRooms;

/* 견적 카드 / 업체 상세에서 채팅 시작 */
window.gStartChat=async function(opts){
  if(!ME.user){ toast("로그인 후 이용할 수 있습니다.","err"); if(typeof openModal==="function") openModal("login"); return; }
  if(SCHEMA.chat_rooms===false){ toast("db/phase3_schema.sql 을 먼저 실행해주세요.","err"); return; }
  var c=client(); if(!c) return;
  var q=await c.from("chat_rooms").select("*")
    .eq("request_id", String(opts.requestId||""))
    .eq("supplier_id", String(opts.supplierId||""));
  var room=(q.data&&q.data[0])||null;
  if(!room){
    var r=await insertSafe("chat_rooms",{
      request_id:String(opts.requestId||""), quote_id:opts.quoteId?String(opts.quoteId):null,
      buyer_user_id:opts.buyerUserId||ME.user.id, buyer_name:opts.buyerName||ME.name,
      supplier_id:opts.supplierId?String(opts.supplierId):null,
      supplier_user_id:opts.supplierUserId||null, supplier_name:opts.supplierName||"업체",
      last_message:"대화를 시작했습니다", last_at:new Date().toISOString()
    });
    if(r.error){ toast(r.missingTable?"db/phase3_schema.sql 을 먼저 실행해주세요.":"채팅을 열지 못했습니다.","err"); return; }
    room=r.data&&r.data[0];
    if(room && opts.firstMessage){
      await insertSafe("chat_messages",{ room_id:room.id, sender_id:ME.user.id, sender_name:ME.name,
        body:opts.firstMessage, kind:"system" });
    }
  }
  window.gOpenChat(room.id);
};

window.gOpenChatList=async function(){
  if(typeof go==="function") go("chats");
  var body=$("chats-body"); if(!body) return;
  if(!ME.user){
    body.innerHTML='<div class="gempty"><div class="gempty-t">로그인이 필요합니다</div>'+
      '<div class="gempty-d">견적을 주고받은 상대와의 대화는 계정에 보관됩니다.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="openModal(\'login\')">로그인</button></div>'; return;
  }
  body.innerHTML='<div style="padding:50px 0;text-align:center;color:var(--ink4);">불러오는 중…</div>';
  await loadRooms();
  if(SCHEMA.chat_rooms===false){ body.innerHTML='<div class="gp-hd"><div class="gp-title">채팅</div></div>'+setupNote("채팅","phase3_schema.sql"); return; }
  body.innerHTML='<div class="gp-hd"><div><div class="gp-title">채팅</div>'+
      '<div class="gp-sub">견적을 주고받은 상대와 바로 조율하세요</div></div></div>'+
    (CHAT.rooms.length ? '<div class="rlist">'+CHAT.rooms.map(function(r){
        var iAmBuyer=String(r.buyer_user_id||"")===String(ME.user.id);
        var other=iAmBuyer?(r.supplier_name||"업체"):(r.buyer_name||"요청자");
        return '<div class="ritem" onclick="gOpenChat(\''+r.id+'\')">'+
          '<div class="ritem-top"><span class="gbadge '+(iAmBuyer?"gb-or":"gb-bl")+'">'+(iAmBuyer?"내 요청":"받은 요청")+'</span>'+
            (r._unread?'<span class="gbadge gb-rd">'+r._unread+'</span>':'')+
            '<span style="font-size:12px;color:var(--ink4);margin-left:auto;">'+ago(r.last_at)+'</span></div>'+
          '<div class="ritem-t">'+esc(other)+'</div>'+
          '<div class="ritem-m"><span>'+esc(truncate(r.last_message||"",40))+'</span></div></div>';
      }).join("")+'</div>'
      : empty("아직 대화가 없습니다","견적을 받으면 업체와 바로 대화할 수 있습니다.",
              '<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;reqs&quot;)">실시간 요청 보기</button>'));
  window.scrollTo(0,0);
};

window.gOpenChat=async function(roomId){
  if(typeof go==="function") go("chat");
  var body=$("chat-body"); if(!body) return;
  var c=client(); if(!c) return;
  var rr=await c.from("chat_rooms").select("*").eq("id",roomId).limit(1);
  var room=(rr.data&&rr.data[0])||null;
  if(!room){ body.innerHTML='<div class="gempty"><div class="gempty-t">대화를 찾을 수 없습니다</div></div>'; return; }
  CHAT.cur=room;
  var iAmBuyer=String(room.buyer_user_id||"")===String(ME.user&&ME.user.id);
  var other=iAmBuyer?(room.supplier_name||"업체"):(room.buyer_name||"요청자");

  body.innerHTML=
    '<div class="gp-hd" style="justify-content:space-between;">'+
      '<div style="display:flex;align-items:center;gap:10px;">'+
        '<button class="back-btn" style="padding:0;" onclick="gCloseChat();gOpenChatList()">←</button>'+
        '<div><div class="gp-title">'+esc(other)+'</div>'+
        '<div class="gp-sub">'+(room.request_id?'<span onclick="gOpenRequest(\''+esc(room.request_id)+'\')" style="cursor:pointer;color:var(--gn);font-weight:700;">연결된 요청 보기 ›</span>':'')+'</div></div>'+
      '</div>'+
      (room.supplier_id?'<button class="gbtn gbtn-w gbtn-sm" onclick="curSID=\''+esc(room.supplier_id)+'\';gCloseChat();go(&quot;sp&quot;)">업체 정보</button>':'')+
    '</div>'+
    '<div class="chat-wrap" id="chat-scroll"></div>'+
    '<div class="chat-bar">'+
      '<textarea class="chat-in" id="chat-input" rows="1" placeholder="메시지를 입력하세요" '+
        'oninput="gChatGrow(this)" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();gSendChat();}"></textarea>'+
      '<button class="chat-send" onclick="gSendChat()" aria-label="보내기">'+
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg></button>'+
    '</div>';
  await refreshMsgs(true);
  startChatPoll();
  window.scrollTo(0,0);
};

async function refreshMsgs(scroll){
  var c=client(); if(!c||!CHAT.cur) return;
  var m=await c.from("chat_messages").select("*").eq("room_id",CHAT.cur.id).order("created_at",{ascending:true});
  if(m.error) return;
  CHAT.msgs=m.data||[];
  var el=$("chat-scroll"); if(!el) return;
  var myId=String((ME.user&&ME.user.id)||"");
  el.innerHTML=CHAT.msgs.map(function(x){
    if(x.kind==="system") return '<div class="chat-sys">'+esc(x.body)+'</div>';
    var mine=String(x.sender_id||"")===myId;
    return '<div class="chat-row'+(mine?" me":"")+'">'+
      (mine?"":'<div class="chat-who">'+esc(x.sender_name||"")+'</div>')+
      '<div class="chat-bub">'+esc(x.body).replace(/\n/g,"<br>")+'</div>'+
      '<div class="chat-time">'+ago(x.created_at)+'</div></div>';
  }).join("")||'<div class="chat-sys">대화를 시작해보세요</div>';
  if(scroll) el.scrollTop=el.scrollHeight;
  /* 상대가 보낸 메시지 읽음 처리 */
  var unread=CHAT.msgs.filter(function(x){ return !x.is_read && String(x.sender_id||"")!==myId; });
  for(var i=0;i<unread.length;i++){ await updateSafe("chat_messages",{is_read:true},"id",unread[i].id); }
}
window.gChatGrow=function(el){ el.style.height="auto"; el.style.height=Math.min(el.scrollHeight,120)+"px"; };

window.gSendChat=async function(){
  var el=$("chat-input"); if(!el||!CHAT.cur) return;
  var body=String(el.value||"").trim(); if(!body) return;
  el.value=""; el.style.height="auto";
  var r=await insertSafe("chat_messages",{ room_id:CHAT.cur.id, sender_id:ME.user?ME.user.id:null,
    sender_name:ME.name||"", body:body, kind:"text" });
  if(r.error){ toast("전송에 실패했습니다.","err"); return; }
  await updateSafe("chat_rooms",{ last_message:body, last_at:new Date().toISOString() },"id",CHAT.cur.id);
  var other = String(CHAT.cur.buyer_user_id||"")===String(ME.user.id) ? CHAT.cur.supplier_user_id : CHAT.cur.buyer_user_id;
  if(other) pushNotif(other,"chat","새 메시지",(ME.name||"상대방")+": "+truncate(body,40),"chat:"+CHAT.cur.id);
  await refreshMsgs(true);
};

function startChatPoll(){
  stopChatPoll();
  CHAT.timer=setInterval(function(){ if(document.getElementById("pg-chat")&&document.getElementById("pg-chat").classList.contains("on")) refreshMsgs(false); else stopChatPoll(); }, 6000);
}
function stopChatPoll(){ if(CHAT.timer){ clearInterval(CHAT.timer); CHAT.timer=null; } }
window.gCloseChat=function(){ stopChatPoll(); CHAT.cur=null; };

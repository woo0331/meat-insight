/* ════════════════════════════════════════════════════════════════════
   알림 — 전체 읽음 · 하단 네비 미읽음 표시
   알림이 쌓이면 하나씩 눌러야 지워졌고, 모바일에서 주로 쓰는 하단
   네비에는 새 알림이 왔다는 표시가 전혀 없었습니다.
   ════════════════════════════════════════════════════════════════════ */

var NT = {};

function ntUnread(){
  if(typeof NOTIFS==="undefined") return 0;
  return NOTIFS.filter(function(n){ return !n.is_read; }).length;
}

/* 하단 네비 '내활동'에 빨간 점 */
function ntPaintNav(){
  var btn=document.getElementById("bn-my"); if(!btn) return;
  var n=ntUnread();
  var dot=btn.querySelector(".bni-dot");
  if(!n){ if(dot && dot.parentNode) dot.parentNode.removeChild(dot); return; }
  if(!dot){
    var ic=btn.querySelector(".bni-i") || btn;
    ic.style.position="relative";
    dot=document.createElement("span");
    dot.className="bni-dot";
    ic.appendChild(dot);
  }
  dot.textContent = n>9 ? "9+" : String(n);
}

window.gReadAllNotifs=async function(ev){
  if(ev && ev.stopPropagation) ev.stopPropagation();
  if(typeof NOTIFS==="undefined") return;
  var un=NOTIFS.filter(function(n){ return !n.is_read; });
  if(!un.length){ toast("읽지 않은 알림이 없습니다."); return; }
  un.forEach(function(n){ n.is_read=true; });
  if(typeof renderHeaderUser==="function") renderHeaderUser();
  ntPaintNav();
  var p=$("notif-panel"); if(p && p.classList.contains("on")) window.gToggleNotif(null, true);
  for(var i=0;i<un.length;i++){
    try{ await updateSafe("notifications",{is_read:true},"id",un[i].id); }catch(e){}
  }
  toast(un.length+"건을 읽음으로 표시했습니다.","ok");
};

function patchNotif(){
  if(NT._patched) return; NT._patched=true;

  /* 알림 목록 위에 "전체 읽음" 줄 추가 */
  var origToggle=window.gToggleNotif;
  if(typeof origToggle==="function"){
    window.gToggleNotif=function(ev, keepOpen){
      var p=$("notif-panel");
      var wasOpen = p && p.classList.contains("on");
      origToggle.call(this, ev);
      p=$("notif-panel");
      if(!p) return;
      if(keepOpen && !p.classList.contains("on")) p.classList.add("on");
      if(!p.classList.contains("on")) return;
      if(!p.querySelector(".nt-hd") && p.querySelector(".nt")){
        var hd=document.createElement("div");
        hd.className="nt-hd";
        hd.innerHTML='<span>알림</span>'+
          '<button type="button" class="nt-all" onclick="gReadAllNotifs(event)">전체 읽음</button>';
        p.insertBefore(hd, p.firstChild);
      }
      ntPaintNav();
    };
  }

  /* 알림 수가 바뀌는 지점마다 하단 네비 갱신
     (renderHeaderUser · paintBell 은 window 가 아니라 이 스코프의 이름입니다) */
  if(typeof renderHeaderUser==="function"){
    var origHdr=renderHeaderUser;
    renderHeaderUser=function(){ var r=origHdr.apply(this, arguments); try{ ntPaintNav(); }catch(e){} return r; };
  }
  if(typeof paintBell==="function"){
    var origBell=paintBell;
    paintBell=function(){ var r=origBell.apply(this, arguments); try{ ntPaintNav(); }catch(e){} return r; };
  }
  if(typeof loadNotifs==="function"){
    var origLoad=loadNotifs;
    loadNotifs=async function(){ var r=await origLoad.apply(this, arguments); try{ ntPaintNav(); }catch(e){} return r; };
  }
  var origOpen=window.gOpenNotif;
  if(typeof origOpen==="function"){
    window.gOpenNotif=async function(){ var r=await origOpen.apply(this, arguments); try{ ntPaintNav(); }catch(e){} return r; };
  }
  ntPaintNav();
  setInterval(ntPaintNav, 5000);
}

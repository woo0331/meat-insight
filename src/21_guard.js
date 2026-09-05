/* ════════════════════════════════════════════════════════════════════
   거래 무결성 · 연락처 검증
   확인된 구멍:
     · 마감·진행중·완료된 요청에도 견적을 계속 보낼 수 있었습니다.
     · 같은 업체가 같은 요청에 견적을 몇 번이든 중복으로 보낼 수 있었습니다.
     · 견적 선택 / 거래 완료 / 요청 마감에 소유자 확인이 없어, 버튼만
       숨겨져 있을 뿐 직접 호출하면 남의 요청도 처리됐습니다.
     · "거래 완료 처리" 버튼이 요청자가 아닌 사람에게도 보였습니다.
     · 전화번호를 아무 값이나 넣어도 요청·견적이 등록됐습니다.
   ════════════════════════════════════════════════════════════════════ */

var GD = {};
var GD_CLOSED = ["마감","진행중","완료"];

/* 국내 전화번호로 볼 수 있는 최소 조건.
   휴대폰(01x)·지역번호(02, 03x~06x)·인터넷전화(070)·안심번호(050x)·
   대표번호(15xx, 16xx, 18xx)·수신자부담(080) 을 모두 통과시키고,
   자릿수·시작자리만으로 명백한 오입력을 걸러냅니다. */
function validPhone(v){
  var d=String(v||"").replace(/[^0-9]/g,"");
  if(/^(1[5688]\d{2})\d{4}$/.test(d)) return true;   /* 1588-0000 같은 대표번호 */
  if(d.length<9 || d.length>11) return false;
  if(d.charAt(0)!=="0") return false;
  if(!/^0[1-8]/.test(d)) return false;                /* 00x, 09x 는 없는 번호 */
  if(/^(\d)\1+$/.test(d)) return false;              /* 00000000000 같은 값 */
  return true;
}
G.validPhone=validPhone;

function gdOwner(req){
  return !!(ME.user && req && req.user_id && String(req.user_id)===String(ME.user.id));
}
function gdClosedReason(req){
  var st=String((req&&req.status)||"견적대기");
  if(GD_CLOSED.indexOf(st)<0) return null;
  if(st==="마감")   return "이 요청은 마감되어 더 이상 견적을 받지 않습니다.";
  if(st==="진행중") return "이미 견적이 선택되어 거래가 진행 중인 요청입니다.";
  return "이미 완료된 거래입니다.";
}
/* 내가(또는 내 업체가) 이 요청에 이미 보낸 견적 */
function gdMyQuote(){
  if(!ME.user) return null;
  return (CUR.quotes||[]).find(function(q){
    return String(q.user_id||"")===String(ME.user.id) && q.status!=="철회";
  })||null;
}

/* ── 요청 상세: 마감 안내 · 견적 보내기 버튼 정리 · 권한 없는 버튼 교체 ── */
function gdPaintDetail(){
  var body=$("reqd-body"), req=CUR.req;
  if(!body || !req) return;
  var reason=gdClosedReason(req);
  var mine=gdOwner(req);

  /* 1) 상단 안내 */
  if(reason && !body.querySelector(".gd-closed")){
    var note=document.createElement("div");
    note.className="gnote gd-closed";
    note.textContent=reason;
    var card=body.querySelector(".gcard");
    if(card && card.parentNode) card.parentNode.insertBefore(note, card);
  }

  /* 2) 견적 보내기 버튼 */
  var send=null;
  body.querySelectorAll("button").forEach(function(b){
    if(b.textContent.trim()==="견적 보내기") send=b;
  });
  if(send){
    var mq=gdMyQuote();
    if(reason){
      send.disabled=true; send.classList.add("gbtn-off");
      send.textContent = req.status==="마감" ? "마감된 요청" : "견적 마감";
      send.removeAttribute("onclick");
    } else if(mq){
      send.classList.remove("gbtn-p"); send.classList.add("gbtn-w");
      send.textContent="내 견적 보냄";
      send.setAttribute("onclick","gShowMyQuote()");
    }
  }

  /* 3) 요청자가 아닌 사람에게 "거래 완료 처리"가 보이던 문제 */
  if(!mine){
    body.querySelectorAll(".qc-act button").forEach(function(b){
      if(b.textContent.trim()!=="거래 완료 처리") return;
      b.textContent="연락처 보기";
      b.className="gbtn gbtn-w gbtn-sm";
      var q=(CUR.quotes||[]).find(function(x){ return x.status==="선택됨"; });
      b.setAttribute("onclick", q ? ("gContactQuote('"+String(q.id).replace(/'/g,"")+"')") : "");
    });
  }
}

window.gShowMyQuote=function(){
  var q=gdMyQuote();
  if(!q){ toast("보낸 견적을 찾을 수 없습니다.","err"); return; }
  toast("이미 이 요청에 견적을 보냈습니다. 내용을 바꾸려면 거래관리 → 보낸 견적에서 철회 후 다시 보내주세요.");
};

function patchGuard(){
  if(GD._patched) return; GD._patched=true;

  /* ── 요청 상세를 그린 뒤 상태를 반영 ── */
  if(typeof renderRequestDetail==="function"){
    var origRRD=renderRequestDetail;
    renderRequestDetail=function(){
      var r=origRRD.apply(this, arguments);
      try{ gdPaintDetail(); }catch(e){}
      return r;
    };
  }
  if(typeof renderQuotes==="function"){
    var origRQ=renderQuotes;
    renderQuotes=function(){
      var r=origRQ.apply(this, arguments);
      try{ gdPaintDetail(); }catch(e){}
      return r;
    };
  }

  /* ── 견적 보내기 진입 차단 ── */
  var origForm=window.gOpenQuoteForm;
  if(typeof origForm==="function"){
    window.gOpenQuoteForm=function(){
      var reason=gdClosedReason(CUR.req);
      if(reason){ toast(reason,"err"); return; }
      if(gdOwner(CUR.req)){ toast("본인이 올린 요청에는 견적을 보낼 수 없습니다.","err"); return; }
      var mq=gdMyQuote();
      if(mq){ window.gShowMyQuote(); return; }
      return origForm.apply(this, arguments);
    };
  }

  /* ── 견적 전송 최종 확인 (폼을 우회해도 막힙니다) ── */
  var origSubmitQ=window.gSubmitQuote;
  if(typeof origSubmitQ==="function"){
    window.gSubmitQuote=async function(){
      var reason=gdClosedReason(CUR.req);
      if(reason){ setMsg("q-msg", reason, "err"); return; }
      if(gdOwner(CUR.req)){ setMsg("q-msg","본인이 올린 요청에는 견적을 보낼 수 없습니다.","err"); return; }
      if(gdMyQuote()){ setMsg("q-msg","이미 이 요청에 견적을 보냈습니다. 기존 견적을 철회한 뒤 다시 보내주세요.","err"); return; }
      var ct=(($("q-contact")||{}).value||"").trim();
      if(ct && !validPhone(ct)){ setMsg("q-msg","연락처를 다시 확인해주세요. 요청자가 전화할 수 있는 번호여야 합니다.","err"); return; }
      return origSubmitQ.apply(this, arguments);
    };
  }

  /* ── 견적 선택 · 거래 완료 · 요청 마감: 소유자 확인 ── */
  [["gSelectQuote","견적을 선택"],["gCompleteDeal","거래를 완료 처리"],["gCloseRequest","요청을 마감"]].forEach(function(pair){
    var name=pair[0], what=pair[1];
    var orig=window[name];
    if(typeof orig!=="function") return;
    window[name]=async function(){
      if(!ME.user){ toast("로그인이 필요합니다.","err"); return; }
      if(!gdOwner(CUR.req)){ toast("본인이 등록한 요청만 "+what+"할 수 있습니다.","err"); return; }
      if(name==="gCompleteDeal" && String((CUR.req||{}).status||"")==="완료"){
        toast("이미 완료된 거래입니다.","err"); return;
      }
      if(name==="gSelectQuote" && (CUR.quotes||[]).some(function(q){ return q.status==="선택됨"; })){
        toast("이미 선택한 견적이 있습니다.","err"); return;
      }
      return orig.apply(this, arguments);
    };
  });

  /* ── 요청 등록: 연락처 형식 확인 ── */
  var origStep3=window.gStep3;
  if(typeof origStep3==="function"){
    window.gStep3=function(){
      var ph=(($("w-phone")||{}).value||"").trim();
      if(ph && !validPhone(ph)){
        toast("연락처를 다시 확인해주세요. 업체가 전화할 수 있는 번호여야 합니다.","err");
        var el=$("w-phone"); if(el){ el.focus(); el.select&&el.select(); }
        return;
      }
      return origStep3.apply(this, arguments);
    };
  }
}

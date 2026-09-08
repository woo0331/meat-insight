/* ════════════════════════════════════════════════════════════════════
   같은 것을 두 번 보내지 않기

   제출 버튼들은 눌리는 순간 btn.disabled=true 를 걸어 둡니다. 그런데
   disabled 는 **클릭만** 막습니다. 함수가 다른 경로로 다시 불리면
   그대로 통과합니다 — 실제로 재 보니 gSubmitQuote() 를 세 번 부르면
   견적이 세 건 저장됐고, gSubmitRequest() 두 번이면 요청이 두 건
   올라갔습니다.

   현실에서 이렇게 됩니다.
     · 폰에서 touch 와 click 이 같이 발생
     · 느린 통신에서 답이 없자 Enter 를 다시 누름
     · 화면이 다시 그려져 버튼이 새로 생기면 disabled 도 같이 풀림

   버튼이 아니라 **함수에** 자물쇠를 겁니다. 앞 호출이 끝나기 전에는
   같은 함수가 다시 시작되지 않습니다. 끝나면(성공이든 실패든) 풀립니다.

   원본을 지우지 않고 감싸기만 하므로, 자물쇠가 없던 때와 동작이
   같습니다 — 중복 호출만 조용히 무시됩니다.
   ════════════════════════════════════════════════════════════════════ */

/* 두 번 보내면 안 되는 것들 — 저장·전송이 일어나는 자리만 */
var ONCE_FNS=[
  "gSubmitRequest",    /* 요청 등록 */
  "gSubmitQuote",      /* 견적 보내기 */
  "gSaveRequestEdit",  /* 요청 수정 */
  "gSubmitReview",     /* 후기 */
  "gSubmitVerify",     /* 인증 신청 */
  "gSubmitApply",      /* 당일알바 지원 */
  "gSubmitDJ",         /* 당일알바 등록 */
  "gApplyDJ",
  "gJobApply",         /* 구인 지원 */
  "gObSubmit",         /* 업체 등록 */
  "gSavePrefs",        /* 알림 설정 저장 */
  "gSendChat",         /* 채팅 보내기 */
  "gSendInquiry",      /* 문의 */
  "gSendReport"        /* 신고 */
];

var ONCE_BUSY={};

function onceWrap(name){
  var orig=window[name];
  if(typeof orig!=="function" || orig.__once) return;

  var wrapped=function(){
    if(ONCE_BUSY[name]) return;          /* 앞 호출이 아직 안 끝났습니다 */
    ONCE_BUSY[name]=true;
    var done=function(){ ONCE_BUSY[name]=false; };
    var r;
    try{
      r=orig.apply(this, arguments);
    }catch(e){
      done(); throw e;                    /* 터져도 자물쇠는 풉니다 */
    }
    if(r && typeof r.then==="function"){
      r.then(done, done);                 /* async — 끝나면 풀기 */
    }else{
      done();
    }
    return r;
  };
  wrapped.__once=true;
  window[name]=wrapped;
}

function patchOnce(){
  if(G._once) return; G._once=true;
  ONCE_FNS.forEach(function(n){ try{ onceWrap(n); }catch(e){} });
}

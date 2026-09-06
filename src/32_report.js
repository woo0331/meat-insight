/* ════════════════════════════════════════════════════════════════════
   신고 · 문의 창구

   고리는 요청자와 업체를 연결하는 중개 서비스인데, 문제가 생겼을 때
   알릴 곳이 없었습니다. 허위 요청·연락 두절·부적절한 게시물이 있어도
   이용자가 할 수 있는 게 없고, 운영하는 쪽도 그런 일이 있었는지
   알 방법이 없었습니다. 문의도 푸터의 전화·이메일이 전부였습니다.

   db/phase7_report.sql 을 실행하지 않아도 화면은 깨지지 않습니다.
   테이블이 없으면 "아직 준비되지 않았습니다" 안내와 고객센터 연락처를
   보여 줍니다 (insertSafe 가 PGRST205 를 알려 줍니다).
   ════════════════════════════════════════════════════════════════════ */

var RP = { type:"request", id:"", name:"", reason:"", sending:false, from:"h" };
G.RP=RP;

var RP_REASONS=["허위·과장된 내용","연락이 되지 않음","부적절한 내용","사기가 의심됨","중복 게시","기타"];
var IQ_KINDS=["일반","요청·견적","업체 등록","결제·환불","개인정보","신고"];

var RP_LABEL={ request:"요청", supplier:"업체", quote:"견적", job:"구인구직" };

function rpInjectPages(){
  var nav=document.querySelector(".bnav");
  ["report","contact"].forEach(function(id){
    if($("pg-"+id)) return;
    var d=document.createElement("div");
    d.className="pg"; d.id="pg-"+id;
    d.style.cssText="padding-top:var(--top-pad);padding-bottom:56px;";
    d.innerHTML='<div class="gp" id="'+id+'-body"></div>';
    if(nav) document.body.insertBefore(d, nav); else document.body.appendChild(d);
    if(typeof PGS!=="undefined" && PGS.indexOf(id)<0) PGS.push(id);
    if(typeof TM!=="undefined") TM[id]="my";
  });
}

/* 사업자 정보가 비어 있으면 (미기재) 로 두고 지어내지 않습니다 */
function rpDesk(){
  var B=window.GORI_BIZ||{};
  var bits=[];
  if(String(B.phone||"").trim()) bits.push("고객센터 "+B.phone);
  if(String(B.email||"").trim()) bits.push(B.email);
  return bits.length ? bits.join(" · ") : "고객센터 연락처가 아직 등록되지 않았습니다";
}

/* ══ 신고 ══════════════════════════════════════════════════════════ */
window.gOpenReport=function(type, id, name){
  RP.type=type||"request"; RP.id=String(id||""); RP.name=String(name||"");
  RP.reason=""; RP.sending=false;
  /* 어디서 눌렀는지 기억해 둡니다 — history.back() 은 주소를 직접 열고 들어온
     사람을 사이트 밖으로 내보냅니다 */
  var cur=document.querySelector(".pg.on");
  RP.from=(cur && cur.id.indexOf("pg-")===0) ? cur.id.slice(3) : "h";
  if(typeof go==="function") go("report");
  rpRender();
};

function rpRender(){
  var el=$("report-body"); if(!el) return;
  var label=RP_LABEL[RP.type]||"게시물";
  el.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="gReportBack()">← 뒤로</button>'+
      '<div><div class="gp-title">'+esc(label)+' 신고</div>'+
      '<div class="gp-sub">'+(RP.name?esc(RP.name):esc(label))+'</div></div></div>'+

    '<div class="gnote">신고 내용은 운영자만 봅니다. 신고했다는 사실은 상대에게 알리지 않습니다. '+
      '긴급하거나 범죄가 의심되는 상황은 경찰(112)에 먼저 알려 주세요.</div>'+

    '<div class="gcard"><div class="gcard-t">어떤 문제인가요? <span class="greq">*</span></div>'+
      '<div class="gpick" id="rp-reason">'+RP_REASONS.map(function(r){
        return '<button type="button" class="gpick-i" onclick="gPickOne(this)">'+esc(r)+'</button>'; }).join("")+'</div>'+
      '<label class="glabel">자세한 내용</label>'+
      '<textarea class="gin" id="rp-detail" placeholder="언제, 무슨 일이 있었는지 적어 주세요. 통화·문자 내용이 있으면 도움이 됩니다."></textarea>'+
      (ME.user?'':'<div class="grow keep">'+
        '<div><label class="glabel">이름</label><input class="gin" id="rp-name" placeholder="홍길동"></div>'+
        '<div><label class="glabel">연락처</label><input class="gin" id="rp-phone" placeholder="010-0000-0000"></div></div>'+
        '<div class="ghint">확인이 필요할 때 연락드립니다. 비워 두셔도 접수됩니다.</div>')+
      '<div class="gmsg" id="rp-msg"></div>'+
    '</div>'+
    '<div class="grow keep">'+
      '<button class="gbtn gbtn-w" onclick="gReportBack()">취소</button>'+
      '<button class="gbtn gbtn-p" id="rp-send" onclick="gSendReport()">신고 접수</button>'+
    '</div>';
  window.scrollTo(0,0);
}

window.gReportBack=function(){
  if(typeof go==="function") go(RP.from||"h");
};

window.gSendReport=async function(){
  if(RP.sending) return;
  var pick=document.querySelector("#rp-reason .gpick-i.on");
  if(!pick){ setMsg("rp-msg","어떤 문제인지 골라 주세요.","err"); return; }
  var btn=$("rp-send");
  RP.sending=true; if(btn){ btn.disabled=true; btn.textContent="접수 중…"; }

  var v=function(id){ var e=$(id); return e?String(e.value||"").trim():""; };
  var r=await insertSafe("reports",{
    target_type:RP.type, target_id:RP.id, target_name:RP.name||null,
    reason:pick.textContent, detail:v("rp-detail")||null,
    reporter_id: ME.user?ME.user.id:null,
    reporter_name: ME.user?ME.name:(v("rp-name")||null),
    reporter_phone: v("rp-phone")||null,
    status:"접수"
  });
  RP.sending=false;
  if(r.error){
    if(btn){ btn.disabled=false; btn.textContent="신고 접수"; }
    setMsg("rp-msg", r.missingTable
      ? "신고 접수 기능이 아직 준비되지 않았습니다 (db/phase7_report.sql 실행 필요). "+rpDesk()+" 로 알려 주세요."
      : "접수 실패: "+((r.error&&r.error.message)||""), "err");
    return;
  }
  rpDone("report");
};

/* ══ 문의 ══════════════════════════════════════════════════════════ */
window.gOpenContact=function(kind){
  if(typeof go==="function") go("contact");
  iqRender(kind);
};

function iqRender(kind){
  var el=$("contact-body"); if(!el) return;
  el.innerHTML=
    '<div class="gp-hd"><button class="back-btn" style="padding:0;" onclick="go(&quot;h&quot;)">← 홈</button>'+
      '<div><div class="gp-title">문의하기</div>'+
      '<div class="gp-sub">남겨 주시면 확인하고 연락드립니다</div></div></div>'+

    '<div class="gcard"><div class="gcard-t">무엇에 대한 문의인가요?</div>'+
      '<div class="gpick" id="iq-kind">'+IQ_KINDS.map(function(k,i){
        var on=(kind?k===kind:i===0);
        return '<button type="button" class="gpick-i'+(on?" on":"")+'" onclick="gPickOne(this)">'+esc(k)+'</button>';
      }).join("")+'</div>'+
      '<div class="grow keep">'+
        '<div><label class="glabel">이름 <span class="greq">*</span></label>'+
          '<input class="gin" id="iq-name" placeholder="홍길동" value="'+esc(ME.user?(ME.name||""):"")+'"></div>'+
        '<div><label class="glabel">연락처</label><input class="gin" id="iq-phone" placeholder="010-0000-0000"></div>'+
      '</div>'+
      '<label class="glabel">이메일</label>'+
      '<input class="gin" id="iq-email" placeholder="answer@example.com" value="'+esc(ME.user?(ME.email||""):"")+'">'+
      '<label class="glabel">내용 <span class="greq">*</span></label>'+
      '<textarea class="gin" id="iq-content" placeholder="어떤 점이 궁금하신가요?"></textarea>'+
      '<div class="gmsg" id="iq-msg"></div>'+
    '</div>'+
    '<div class="grow keep">'+
      '<button class="gbtn gbtn-w" onclick="gOpenGuide()">이용 가이드</button>'+
      '<button class="gbtn gbtn-p" id="iq-send" onclick="gSendInquiry()">문의 보내기</button>'+
    '</div>'+
    '<div class="ghint" style="margin-top:12px;">'+esc(rpDesk())+'</div>';
  window.scrollTo(0,0);
}

window.gSendInquiry=async function(){
  var v=function(id){ var e=$(id); return e?String(e.value||"").trim():""; };
  var name=v("iq-name"), content=v("iq-content");
  if(!name || !content){ setMsg("iq-msg","이름과 내용을 채워 주세요.","err"); return; }
  var kind=(document.querySelector("#iq-kind .gpick-i.on")||{}).textContent||"일반";
  var btn=$("iq-send"); if(btn){ btn.disabled=true; btn.textContent="보내는 중…"; }

  var r=await insertSafe("inquiries",{
    kind:kind, name:name, phone:v("iq-phone")||null, email:v("iq-email")||null,
    content:content, user_id: ME.user?ME.user.id:null, status:"접수"
  });
  if(r.error){
    if(btn){ btn.disabled=false; btn.textContent="문의 보내기"; }
    setMsg("iq-msg", r.missingTable
      ? "문의 접수 기능이 아직 준비되지 않았습니다 (db/phase7_report.sql 실행 필요). "+rpDesk()+" 로 연락 주세요."
      : "전송 실패: "+((r.error&&r.error.message)||""), "err");
    return;
  }
  rpDone("contact");
};

function rpDone(which){
  var el=$(which+"-body"); if(!el) return;
  var isReport=(which==="report");
  el.innerHTML=
    '<div class="gcard" style="text-align:center;padding:34px 22px;">'+
      '<div class="ob-ok">✓</div>'+
      '<div style="font-size:20px;font-weight:700;letter-spacing:-.03em;margin-bottom:8px;">'+
        (isReport?"신고가 접수되었습니다":"문의가 접수되었습니다")+'</div>'+
      '<div style="font-size:13.5px;color:var(--ink3);line-height:1.65;">'+
        (isReport
          ? '운영자가 확인한 뒤 필요한 조치를 합니다.<br>확인이 필요하면 남겨 주신 연락처로 연락드립니다.'
          : '확인하고 남겨 주신 연락처로 답변드립니다.')+
      '</div>'+
    '</div>'+
    '<div class="grow keep">'+
      '<button class="gbtn gbtn-w" onclick="go(&quot;h&quot;)">홈으로</button>'+
      '<button class="gbtn gbtn-p" onclick="go(&quot;reqs&quot;)">실시간 요청</button>'+
    '</div>';
  window.scrollTo(0,0);
}

/* ── 진입점 ─────────────────────────────────────────────────────── */

/* 요청 상세 — 내 요청이 아닐 때만 */
function rpArmRequest(){
  if(typeof renderRequestDetail!=="function") return;
  var orig=renderRequestDetail;
  renderRequestDetail=function(){
    orig.apply(this, arguments);
    try{ rpPaintRequest(); }catch(e){}
  };
}
function rpPaintRequest(){
  var body=$("reqd-body"), req=CUR.req;
  if(!body || !req || $("rp-req-link")) return;
  if(ME.user && String(req.user_id||"")===String(ME.user.id)) return;
  var d=document.createElement("div");
  d.id="rp-req-link";
  d.style.cssText="text-align:right;margin:4px 0 10px;";
  d.innerHTML='<button class="rp-flag" onclick="gOpenReport(\'request\',\''+esc(String(req.id))+'\',\''+
    esc(String(req.title||"요청").replace(/'/g,"")) +'\')">🚩 이 요청 신고</button>';
  body.appendChild(d);
}

/* 업체 상세 — 내 업체가 아닐 때만 */
function rpArmSupplier(){
  if(typeof renderSupplierDetail!=="function") return;
  var orig=renderSupplierDetail;
  renderSupplierDetail=function(){
    orig.apply(this, arguments);
    try{
      var s=SD.sup, body=$("sp-body");
      if(!s || !body || body.querySelector("#rp-sup-link")) return;
      if(typeof seMine==="function" && seMine(s)) return;
      var d=document.createElement("div");
      d.id="rp-sup-link";
      d.style.cssText="text-align:right;margin:4px 0 10px;";
      d.innerHTML='<button class="rp-flag" onclick="gOpenReport(\'supplier\',\''+esc(String(s.id))+'\',\''+
        esc(String(s.name||"업체").replace(/'/g,""))+'\')">🚩 이 업체 신고</button>';
      var gp=body.querySelector(".gp")||body;
      gp.appendChild(d);
    }catch(e){}
  };
}

/* 푸터·가이드에서 문의로 */
function rpInjectFooterLink(){
  var ul=document.querySelectorAll(".ft-ul");
  var last=ul[ul.length-1]; if(!last || last.querySelector(".rp-contact")) return;
  var li=document.createElement("li");
  li.className="rp-contact";
  li.textContent="문의하기";
  li.setAttribute("onclick","gOpenContact()");
  last.insertBefore(li, last.firstChild);
}

function patchReport(){
  if(G._report) return; G._report=true;
  rpInjectPages();
  rpArmRequest();
  rpArmSupplier();
  rpInjectFooterLink();
  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(p){
      var r=origGo.apply(this, arguments);
      if(p==="contact" && !$("iq-content")) iqRender();
      return r;
    };
  }
}

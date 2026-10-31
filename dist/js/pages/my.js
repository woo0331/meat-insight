

var MKEY = "am.profile.v1";

function MyDbBand(){
  return '<section class="sec sec-blue my-db" id="my-db" hidden></section>';
}

window.myLoadDb = function(){
  var box = document.getElementById("my-db");
  if(!box || typeof fetch !== "function") return;
  var hd = (typeof amAuthHeaders === "function") ? amAuthHeaders() : {};

  var pre = (typeof amAuthAsk === "function") ? amAuthAsk() : Promise.resolve(null);
  pre.then(function(){
    hd = (typeof amAuthHeaders === "function") ? amAuthHeaders() : {};
    return fetch("/api/me", { headers: Object.assign(
      { "accept":"application/json" }, hd) });
  })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){

      if(d && d.auth && !d.signedIn){
        box.innerHTML = '<div class="w">' + MySignInBand() + '</div>';
        box.hidden = false;
        return;
      }
      if(!d || !d.auth || !d.signedIn) return;

      myDbPaint(d);
    })
    .catch(function(e){ console.warn("[my] 신청 내역을 못 불러왔습니다 — " + e); });
};

var MYQ = { d:null, open:"", draft:{}, busy:false };

function myDbPaint(d){
  var box = document.getElementById("my-db");
  if(!box) return;
  if(d) MYQ.d = d; else d = MYQ.d;
  if(!d) return;
  var role = d.role || "customer";
  var inner = role === "provider" ? MyPvBand(d)
            : (role === "staff" || role === "admin") ? MyDeskBand(d)
            : MyCustBand(d);

  box.innerHTML = '<div class="w">' + inner +
    '<p class="my-out">' + esc(d.name || "") +
      (d.name ? " · " : "") +
      '<button class="btn btn-o" type="button" onclick="mySignOut()">나가기</button>' +
    '</p></div>';
  box.hidden = false;
}

function MySignInBand(){
  return myHd("MY", "로그인하고 신청 내역 보기",
    "메일 주소를 적으시면 로그인 링크를 보내 드립니다. 비밀번호는 없습니다.")+

    '<form class="my-in" onsubmit="return mySignIn(event)">'+
      '<div class="f-r">'+
        '<label for="my-em">메일 주소</label>'+
        '<div class="my-in-r">'+
          '<input id="my-em" type="email" name="email" required '+
            'autocomplete="email" placeholder="example@email.com">'+
          '<button class="btn btn-b" type="submit">로그인 링크 받기</button>'+
        '</div>'+
        '<span class="f-h">비밀번호는 없습니다. 메일로 온 링크를 누르면 로그인됩니다.</span>'+
      '</div>'+
      '<p class="my-in-n" id="my-in-n" role="status"></p>'+
    '</form>';
}

window.mySignIn = function(ev){
  if(ev && ev.preventDefault) ev.preventDefault();
  var em = document.getElementById("my-em");
  var note = document.getElementById("my-in-n");
  var btn = ev && ev.target ? ev.target.querySelector("button") : null;
  if(!em || typeof amAuthSend !== "function") return false;
  if(btn){ btn.disabled = true; btn.textContent = "보내는 중…"; }
  if(note) note.textContent = "";
  amAuthSend(em.value).then(function(r){
    if(btn){ btn.disabled = false; btn.textContent = "로그인 링크 받기"; }
    if(note) note.textContent = r.say;
    if(note) note.className = "my-in-n" + (r.ok ? " ok" : " bad");
  });
  return false;
};

window.mySignOut = function(){
  if(typeof amAuthOut !== "function") return;
  amAuthOut().then(function(){ window.location.reload(); });
};

function myHd(k, h, p){
  return '<div class="sec-hd"><p class="eyebrow">'+esc(k)+'</p><h2>'+esc(h)+'</h2>'+
    (p ? '<p>'+esc(p)+'</p>' : '')+'</div>';
}

function MyCustBand(d){
  var L = d.requests || [];
  return myHd("MY REQUEST", "내가 넣은 신청",
    "접수번호로 물어보실 수 있습니다. 진행 상태가 바뀌면 여기에 그대로 보입니다.")+
    (L.length ? MyReqList(L, d) : Empty({
      icon:"doc", title:"아직 넣으신 신청이 없습니다",
      text:"필요한 일을 적어 보내시면 조건에 맞는 업체를 찾아 드립니다.",
      cta:'<a class="btn btn-b" href="'+esc(quoteTo({}))+'">'+
          '서비스 신청하기'+icon("arrow",17)+'</a>'
    }))+
    MyClaimBand();
}

function MyClaimBand(){
  return '<details class="my-claim">'+
    '<summary><b>로그인 전에 넣은 신청이 있으세요?</b></summary>'+
    '<p class="my-claim-p">접수하실 때 받으신 <b>신청번호</b>와 그때 적어 '+
      '주신 <b>연락처</b>를 적으시면 이 계정으로 가져옵니다. '+
      '⚠️ 둘이 다 맞아야 합니다 — 번호만으로는 남의 신청이 열리면 안 되니까요.</p>'+
    '<form class="my-in" onsubmit="return myClaim(event)">'+
      '<div class="f-r">'+
        '<label for="my-cno">신청번호</label>'+
        '<input id="my-cno" type="text" name="no" required '+
          'autocomplete="off" inputmode="text" spellcheck="false" '+
          'placeholder="SW-AB12-CD34">'+
        '<span class="f-h">줄표와 띄어쓰기는 있어도 없어도 됩니다.</span>'+
      '</div>'+
      '<div class="f-r">'+
        '<label for="my-ctel">연락처</label>'+
        '<input id="my-ctel" type="tel" name="tel" required '+
          'autocomplete="tel" inputmode="tel" placeholder="010-0000-0000">'+
        '<span class="f-h">접수하실 때 적어 주신 번호입니다.</span>'+
      '</div>'+
      '<div class="my-in-r">'+
        '<button class="btn btn-b" type="submit">내 신청으로 가져오기</button>'+
      '</div>'+
      '<p class="my-in-n" id="my-cn" role="status"></p>'+
    '</form>'+
  '</details>';
}

window.myClaim = function(ev){
  if(ev && ev.preventDefault) ev.preventDefault();
  var no  = document.getElementById("my-cno");
  var tel = document.getElementById("my-ctel");
  var note = document.getElementById("my-cn");
  var btn = ev && ev.target ? ev.target.querySelector("button") : null;
  if(!no || !tel) return false;

  if(!String(no.value).trim() || !String(tel.value).trim()){
    if(note){ note.textContent = "신청번호와 연락처를 둘 다 적어 주세요";
              note.className = "my-in-n bad"; }
    return false;
  }
  if(btn){ btn.disabled = true; btn.textContent = "확인하는 중…"; }
  if(note){ note.textContent = ""; note.className = "my-in-n"; }
  fetch("/api/deal", {
    method:"POST",
    headers: Object.assign({ "content-type":"application/json",
      accept:"application/json" },
      (typeof amAuthHeaders === "function") ? amAuthHeaders() : {}),
    body: JSON.stringify({ fn:"claim_request",
      args:{ p_no:String(no.value).trim(), p_tel:String(tel.value).trim() } })
  }).then(function(r){
    return r.json().then(function(j){ return { ok:r.ok, j:j }; });
  }).then(function(x){
    if(btn){ btn.disabled = false; btn.textContent = "내 신청으로 가져오기"; }
    if(!x.ok){

      if(note){ note.textContent = (x.j && x.j.error) || "가져오지 못했습니다";
                note.className = "my-in-n bad"; }
      return;
    }
    if(note){ note.textContent = "가져왔습니다. 아래 목록에 들어왔습니다.";
              note.className = "my-in-n ok"; }
    no.value = ""; tel.value = "";

    window.myLoadDb();
  }).catch(function(e){
    if(btn){ btn.disabled = false; btn.textContent = "내 신청으로 가져오기"; }
    try{ console.warn("[my] claim_request — " + e); }catch(_){}
    if(note){ note.textContent = "연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요";
              note.className = "my-in-n bad"; }
  });
  return false;
};

function MyPvBand(d){
  var L = d.requests || [], DL = d.deals || [];
  return MyPvSelf(d)+
    myHd("PARTNER", "배정받은 신청",
    "연결된 건만 보입니다. 성함과 연락처는 배정이 된 뒤에 함께 옵니다.")+
    (L.length ? MyPvList(L, d) :
      '<p class="lead">아직 배정된 신청이 없습니다. 배정되면 여기에 '+
        '연락처와 함께 보입니다.</p>'+
      '<div class="row-cta"><a class="btn btn-o" href="/join">'+
        '입점 안내 다시 보기'+icon("arrow",16)+'</a></div>')+
    MyDealBand(DL);
}

function MyPvSelf(d){
  var m = d.mine;

  if(!m) return "";
  var c = d.myContact || {};
  var V = (typeof AM_VERIFY !== "undefined" && AM_VERIFY) || [];
  var on = V.filter(function(v){ return m.verified && m.verified[v.key]; });
  return myHd("MY COMPANY", "내 업체 정보",
    "손님에게 보이는 글입니다. 고치시면 바로 반영됩니다.")+
    '<div class="my-pv">'+
      '<dl class="my-pv-fix">'+
        '<dt>상호</dt><dd>'+esc(m.name || "")+'</dd>'+
        '<dt>하는 일</dt><dd>'+
          esc((m.subs || []).map(function(k){
            return (typeof amSubName === "function") ? (amSubName(k) || k) : k;
          }).join(" · ") || "아직 없습니다")+'</dd>'+
        '<dt>공개</dt><dd>'+(m.listed ? "공개 중" : "아직 공개 전")+'</dd>'+
        '<dt>확인된 것</dt><dd>'+
          (on.length ? esc(on.map(function(v){ return v.name; }).join(" · "))
                     : "아직 없습니다")+'</dd>'+
      '</dl>'+

      '<p class="f-h">위 넷은 여기서 못 고칩니다. <b>상호</b>와 '+
        '<b>하는 일</b>은 제휴 계약에 적힌 것이고, <b>공개</b>와 '+
        '<b>확인</b>은 저희가 서류를 보고 켭니다 — 바꾸실 일이 있으면 '+
        '담당 직원에게 말씀해 주세요.</p>'+

      '<form class="my-in" onsubmit="return myPvSave(event)">'+
        '<div class="f-r">'+
          '<label for="pvs-intro">업체 소개</label>'+
          '<textarea id="pvs-intro" rows="3" maxlength="400" '+
            'placeholder="어떤 일을 얼마나 해 오셨는지 적어 주세요">'+
            esc(m.intro || "")+'</textarea>'+

          '<span class="f-h">저희 직원이 요청을 넘길 곳을 고를 때 먼저 '+
            '읽는 글입니다. 지금은 손님 화면에 나가지 않습니다. '+
            '⚠️ 지어낸 실적 · 평점 · "검증된" 같은 말은 적지 마세요 '+
            '(표시 · 광고의 공정화에 관한 법률 제3조).</span>'+
        '</div>'+
        '<div class="f-r">'+
          '<label for="pvs-reg">서비스 지역</label>'+
          '<select id="pvs-reg" class="sel" multiple size="6">'+
            (typeof AM_REGIONS !== "undefined" ? AM_REGIONS : []).map(function(r){
              return '<option value="'+esc(r.key)+'"'+
                ((m.regions || []).indexOf(r.key) >= 0 ? " selected" : "")+'>'+
                esc(r.name)+'</option>'; }).join("")+
          '</select>'+
          '<span class="f-h">여럿 고르실 수 있습니다. '+
            '⚠️ <b>비워 두면 전국</b>으로 읽습니다 — 안 가는 곳까지 '+
            '요청이 가면 서로 헛걸음입니다.</span>'+
        '</div>'+
        '<div class="f-r">'+
          '<label for="pvs-gu">시 · 군 · 구</label>'+
          '<input id="pvs-gu" type="text" maxlength="200" '+
            'value="'+esc((m.gu || []).join(", "))+'" '+
            'placeholder="안양시, 군포시">'+
          '<span class="f-h">쉼표로 나눠 적어 주세요. 경기도처럼 넓은 '+
            '곳은 이것이 있어야 가까운 요청만 갑니다.</span>'+
        '</div>'+
        '<div class="f-r">'+
          '<label for="pvs-ind">취급 기기</label>'+
          '<select id="pvs-ind" class="sel" multiple size="4">'+
            (typeof AM_DEVICE_KINDS !== "undefined" ? AM_DEVICE_KINDS : []).map(function(i){
              return '<option value="'+esc(i.key)+'"'+
                ((m.industries || []).indexOf(i.key) >= 0 ? " selected" : "")+'>'+
                esc(i.name)+'</option>'; }).join("")+
          '</select>'+
          '<span class="f-h">비워 두면 전 기기로 읽습니다.</span>'+
        '</div>'+
        '<div class="f-r">'+
          '<label for="pvs-since">문 연 해</label>'+
          '<input id="pvs-since" type="number" min="1900" max="2100" step="1" '+
            'inputmode="numeric" value="'+esc(m.since == null ? "" : m.since)+'" '+
            'placeholder="2015">'+

          '<span class="f-h">연수는 이 해에서 저희가 셉니다.</span>'+
        '</div>'+
        '<div class="f-r">'+
          '<label for="pvs-hrs">상담 가능 시간</label>'+
          '<input id="pvs-hrs" type="text" maxlength="60" '+
            'value="'+esc(m.consult_hours || "")+'" '+
            'placeholder="평일 09:00~18:00">'+
        '</div>'+
        '<div class="my-in-r">'+
          '<button class="btn btn-b" type="submit">업체 정보 저장</button>'+
        '</div>'+
        '<p class="my-in-n" id="pvs-n" role="status"></p>'+
      '</form>'+

      '<h3 class="my-pv-h">연락 담당자</h3>'+

      '<p class="f-h">저희 직원이 배정할 때 연락하는 곳입니다 — '+
        '<b>손님에게는 보이지 않습니다.</b> 사람이 바뀌면 여기서 '+
        '고쳐 주세요.</p>'+
      '<form class="my-in" onsubmit="return myPvCon(event)">'+
        '<div class="f-r">'+
          '<label for="pvc-name">담당자 성함</label>'+
          '<input id="pvc-name" type="text" maxlength="40" '+
            'autocomplete="name" value="'+esc(c.name || "")+'">'+
        '</div>'+
        '<div class="f-r">'+
          '<label for="pvc-tel">직통 번호</label>'+
          '<input id="pvc-tel" type="tel" maxlength="30" '+
            'autocomplete="tel" value="'+esc(c.tel || "")+'" '+
            'placeholder="010-0000-0000">'+
        '</div>'+
        '<div class="f-r">'+
          '<label for="pvc-mail">메일</label>'+
          '<input id="pvc-mail" type="email" maxlength="80" '+
            'autocomplete="email" value="'+esc(c.email || "")+'">'+
        '</div>'+
        '<div class="f-r">'+
          '<label for="pvc-memo">언제 연락하면 좋은지</label>'+
          '<input id="pvc-memo" type="text" maxlength="100" '+
            'value="'+esc(c.memo || "")+'" placeholder="오전에 연락 주세요">'+
        '</div>'+
        '<div class="my-in-r">'+
          '<button class="btn btn-o" type="submit">담당자 저장</button>'+
        '</div>'+

        '<p class="f-h">넷을 다 비우고 저장하시면 담당자 칸을 '+
          '지웁니다.</p>'+
        '<p class="my-in-n" id="pvc-n" role="status"></p>'+
      '</form>'+
    '</div>';
}

function myPvSel(id){
  var el = document.getElementById(id), out = [], i;
  if(!el) return out;
  for(i = 0; i < el.options.length; i++)
    if(el.options[i].selected) out.push(el.options[i].value);
  return out;
}

window.myPvSave = function(ev){
  if(ev && ev.preventDefault) ev.preventDefault();
  var g = function(id){ var e = document.getElementById(id);
                        return e ? String(e.value).trim() : ""; };

  var gu = g("pvs-gu").split(",").map(function(x){ return x.trim(); })
             .filter(Boolean);
  myPvCall("save_provider_self",
    { p_data:{ intro:g("pvs-intro"), regions:myPvSel("pvs-reg"),
               gu:gu, industries:myPvSel("pvs-ind"),
               since:g("pvs-since"), consultHours:g("pvs-hrs") },
      p_why:"업체가 직접 고쳤습니다" },
    "pvs-n", ev, "업체 정보 저장");
  return false;
};

window.myPvCon = function(ev){
  if(ev && ev.preventDefault) ev.preventDefault();
  var g = function(id){ var e = document.getElementById(id);
                        return e ? String(e.value).trim() : ""; };
  var mail = g("pvc-mail");

  if(mail && mail.indexOf("@") < 1){
    var n = document.getElementById("pvc-n");
    if(n){ n.textContent = "메일 주소를 확인해 주세요"; n.className = "my-in-n bad"; }
    return false;
  }
  myPvCall("save_provider_contact",

    { p_provider:(MYQ.d && MYQ.d.mine && MYQ.d.mine.id) || "",
      p_data:{ name:g("pvc-name"), tel:g("pvc-tel"),
               email:mail, memo:g("pvc-memo") },
      p_why:"업체가 직접 적었습니다" },
    "pvc-n", ev, "담당자 저장");
  return false;
};

function myPvCall(fn, args, noteId, ev, label){
  var note = document.getElementById(noteId);
  var btn  = ev && ev.target ? ev.target.querySelector("button") : null;
  if(btn){ btn.disabled = true; btn.textContent = "저장하는 중…"; }
  if(note){ note.textContent = ""; note.className = "my-in-n"; }
  fetch("/api/deal", {
    method:"POST",
    headers: Object.assign({ "content-type":"application/json",
      accept:"application/json" },
      (typeof amAuthHeaders === "function") ? amAuthHeaders() : {}),
    body: JSON.stringify({ fn:fn, args:args })
  }).then(function(r){
    return r.json().then(function(j){ return { ok:r.ok, j:j }; });
  }).then(function(x){
    if(btn){ btn.disabled = false; btn.textContent = label; }
    if(!x.ok){
      if(note){ note.textContent = (x.j && x.j.error) || "저장하지 못했습니다";
                note.className = "my-in-n bad"; }
      return;
    }
    if(note){ note.textContent = "저장했습니다."; note.className = "my-in-n ok"; }
    window.myLoadDb();
  }).catch(function(e){
    if(btn){ btn.disabled = false; btn.textContent = label; }
    try{ console.warn("[my] " + fn + " — " + e); }catch(_){}
    if(note){ note.textContent = "연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요";
              note.className = "my-in-n bad"; }
  });
}

function MyPvList(L, d){
  return '<ul class="myq-l">'+L.map(function(r){
    var st  = (typeof amDealStName === "function") ? amDealStName(r.state) : r.state;
    var cat = r.cat && typeof amCat === "function" ? amCat(r.cat) : null;

    var tel = (r.tel || "").replace(/[^0-9+]/g, "");
    return '<li class="myq"><div class="myq-h">'+
        '<b class="myq-no">'+esc(r.no || "")+'</b>'+
        '<span class="myq-st myq-'+esc(myStTone(r.state))+'">'+esc(st)+'</span>'+
      '</div>'+
      '<p class="myq-m">'+myCond(r, cat)+'</p>'+
      (r.name || tel
        ? '<p class="myq-pv">'+icon("user",15)+esc(r.name || "")+
          (tel ? '<a class="myq-tel" href="tel:'+esc(tel)+'">'+
                 icon("phone",15)+esc(r.tel)+'</a>' : '')+'</p>'
        : "")+
      (r.body ? '<p class="myq-b">'+esc(String(r.body).slice(0, 160))+'</p>' : "")+

      (d ? MyQuoteMine(d, r) : "")+
    '</li>'; }).join("")+'</ul>';
}

function myCond(r, cat){
  return [ (typeof amSideShort === "function" ? amSideShort(r.side) : ""),
    (cat ? cat.name : ""),
    (r.industry && typeof amKindName === "function" ? amKindName(r.industry) : ""),
    (r.region && typeof amRegionName === "function" ? amRegionName(r.region) : ""),
    (r.gu || "")
  ].filter(Boolean).map(esc).join(" · ");
}

function MyDealBand(DL){
  if(!DL.length) return '<div class="my-next"><h2>내 계약</h2>'+
    '<p class="lead">아직 계약된 건이 없습니다. 계약이 확인되면 '+
      '여기에 금액과 수수료가 쌓입니다.</p></div>';

  return '<div class="my-next"><h2>내 계약 '+DL.length+'건</h2>'+
    '<ul class="myq-l">'+DL.map(function(x){
      var rows = [];
      if(x.amount != null) rows.push(["계약금액", won(x.amount)+"원"]);
      if(x.fee != null){
        rows.push(["수수료 확정", won(x.fee_total != null ? x.fee_total : x.fee)+"원"]);
        var due = Math.max(0, Number(x.fee_total != null ? x.fee_total : x.fee) -
                              Number(x.paid || 0));
        rows.push([x.paid != null ? "입금" : "입금 대기", won(x.paid || 0)+"원"]);
        if(due > 0) rows.push(["남은 금액", won(due)+"원"]);
      }
      return '<li class="myq"><div class="myq-h">'+
          '<b class="myq-no">'+esc(String(x.id || "").slice(0, 8))+'</b>'+
          '<span class="myq-st myq-'+(x.fee == null ? "on" :
            (Number(x.paid||0) >= Number(x.fee_total != null ? x.fee_total : x.fee)
              ? "ok" : "warn"))+'">'+
            esc(x.fee == null ? "수수료 확정 전"
               : (Number(x.paid||0) >= Number(x.fee_total != null ? x.fee_total : x.fee)
                  ? "정산 완료" : "정산 대기"))+'</span>'+
        '</div>'+
        (rows.length ? '<dl class="myd-l">'+rows.map(function(a){
          return '<div><dt>'+esc(a[0])+'</dt><dd>'+esc(a[1])+'</dd></div>'; }).join("")+'</dl>' : "")+
      '</li>'; }).join("")+'</ul>'+

    '<p class="sec-note">계약에 적용된 수수료는 그 계약을 맺을 때의 '+
      '정책으로 계산되어 그대로 남습니다.</p>'+
  '</div>';
}

function MyDeskBand(d){
  var L  = d.requests || [], DL = d.deals || [], AU = d.audits || [];
  var isAdmin = d.role === "admin";

  return myHd("DESK", isAdmin ? "관리자 작업대" : "접수 현황",
    "로그인한 계정의 권한으로 볼 수 있는 것만 나옵니다.")+
    MyFunnel(L)+
    (isAdmin ? MyFee(DL, AU) : "")+
    '<p class="sec-note">여기 숫자는 최근 접수 '+L.length+'건'+
      (isAdmin ? ' · 최근 계약 '+DL.length+'건' : '')+
      '에서 센 값입니다. 전체 누적이 아닙니다.</p>'+
    '<div class="row-cta"><a class="btn btn-o" href="/admin">'+
      '영업 작업대 열기'+icon("arrow",16)+'</a></div>';
}

function MyFunnel(L){
  if(!L.length) return '<p class="lead">아직 접수된 신청이 없습니다.</p>';

  var ST = window.AM_DEAL_ST || [];
  var n  = {};
  L.forEach(function(r){ n[r.state] = (n[r.state] || 0) + 1; });

  var deals = ST.filter(function(s){
      return typeof amDealAfterSign === "function" && amDealAfterSign(s.key); })
    .reduce(function(a, s){ return a + (n[s.key] || 0); }, 0);

  var side = {};
  L.forEach(function(r){ var k = r.side || "";
                         side[k] = (side[k] || 0) + 1; });
  var sideRows = (window.AM_SIDES || []).filter(function(s){ return side[s.key]; })
    .map(function(s){
      return '<div><dt>'+esc(s.short || s.name)+' 쪽</dt><dd>'+
             side[s.key]+'건</dd></div>'; }).join("");

  return '<ul class="myk-g">'+ST.filter(function(s){

      return !s.money;
    }).map(function(s){
      var c = n[s.key] || 0;
      return '<li class="myk'+(c ? "" : " myk-0")+'">'+
        '<b>'+c+'</b><span>'+esc(s.name)+'</span></li>';
    }).join("")+'</ul>'+
    '<dl class="myd-l myd-l3">'+
      sideRows+

      '<div><dt>계약까지 간 비율</dt><dd>'+
        Math.round(deals / L.length * 100)+'%</dd></div>'+
    '</dl>';
}

function MyFee(DL, AU){
  if(!DL.length) return '<div class="my-next"><h2>수수료 · 정산</h2>'+
    '<p class="lead">아직 계약된 건이 없습니다. 계약이 확인되면 '+
      '여기에 확정액 · 입금 · 미수금이 쌓입니다.</p></div>';

  var num = function(v){ var x = Number(v); return isFinite(x) ? x : 0; };
  var sum = function(k){ return DL.reduce(function(a, x){ return a + num(x[k]); }, 0); };

  var due = DL.reduce(function(a, x){
    if(x.fee == null) return a;
    return a + Math.max(0, num(x.fee_total != null ? x.fee_total : x.fee) - num(x.paid));
  }, 0);

  var back = AU.reduce(function(a, x){
    var b = (x && x.data) ? Number(x.data.back) : NaN;
    return a + (isFinite(b) && b > 0 ? b : 0);
  }, 0);
  var fixed = DL.filter(function(x){ return x.fee != null; }).length;

  var rows = [
    ["계약 "+DL.length+"건 금액", won(sum("amount"))+"원"],
    ["수수료 확정 "+fixed+"건", won(sum("fee"))+"원"],
    ["청구액 (부가세 포함)", won(sum("fee_total"))+"원"],
    ["입금 확인", won(sum("paid"))+"원"],
    ["미수금", won(due)+"원"]
  ];

  if(back > 0) rows.push(["환수 · 부분환불", won(back)+"원"]);

  return '<div class="my-next"><h2>수수료 · 정산</h2>'+
    '<dl class="myd-l myd-l3 myd-big">'+rows.map(function(a){
      return '<div><dt>'+esc(a[0])+'</dt><dd>'+esc(a[1])+'</dd></div>'; }).join("")+'</dl>'+
    '<p class="sec-note">수수료는 관리자가 증빙을 보고 확정한 것만, '+
      '정산 완료는 실제 입금이 확인된 것만 셉니다.</p>'+
  '</div>';
}

function myStTone(key){
  return (typeof amDealTone === "function") ? amDealTone(key) : "gray";
}

function MyReqList(L, d){
  return '<ul class="myq-l">'+L.map(function(r){
    var st = (typeof amDealStName === "function") ? amDealStName(r.state) : r.state;
    var pv = (r.assignment && r.assignment.length && r.assignment[0].provider)
               ? r.assignment[0].provider.name : "";
    var cat = r.cat && typeof amCat === "function" ? amCat(r.cat) : null;
    return '<li class="myq"><div class="myq-h">'+
        '<b class="myq-no">'+esc(r.no || "")+'</b>'+
        '<span class="myq-st myq-'+esc(myStTone(r.state))+'">'+esc(st)+'</span>'+
      '</div>'+
      '<p class="myq-m">'+myCond(r, cat)+'</p>'+

      (pv ? '<p class="myq-pv">'+icon("users",15)+esc(pv)+'</p>' : "")+

      (d ? MyQuoteCompare(d, r) : "")+
    '</li>'; }).join("")+'</ul>';
}

function myqOf(d, rid){
  return (d.quotes || []).filter(function(q){ return q.request_id === rid; });
}

function myqSpecs(q, side){

  var pw = (side === "buyin" || side === "bid");
  var rows = [];
  if(q.amount != null)
    rows.push([pw ? "매입 금액" : "견적 금액", won(q.amount)+"원 · "+
      ((typeof amQuoteVat === "function") ? amQuoteVat(q.vat) : "")]);
  if(q.days)      rows.push([pw ? "정산 소요" : "예상 소요", q.days+"일"]);
  if(q.start_on)  rows.push([pw ? "수거 가능" : "시작 가능", amDate(q.start_on)]);
  if(q.valid_to)  rows.push(["견적 유효", amDate(q.valid_to)+"까지"]);
  if(!rows.length) return "";
  return '<dl class="myd-l">'+rows.map(function(r){
    return '<div><dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd></div>';
  }).join("")+'</dl>';
}

function myqText(q, side){

  var N = (typeof amQuoteLabels === "function") ? amQuoteLabels(side) : {};
  var L = [[N.scopeRow || "포함", q.scope], [N.exRow || "별도", q.excludes],
           [N.wsRow || "A/S · 보증", q.warranty], ["메모", q.note]];
  return L.filter(function(r){ return r[1]; }).map(function(r){
    return '<p class="myq-b"><b>'+esc(r[0])+'</b> '+esc(String(r[1]))+'</p>';
  }).join("");
}

function MyQuoteCompare(d, r){
  var L = myqOf(d, r.id);
  if(!L.length) return "";
  var got = L.filter(function(q){ return q.state === "chosen"; })[0];
  return '<div class="myqt">'+
    '<p class="myqt-h">'+icon("doc",15)+'받은 견적 '+L.length+'건'+
      (got ? '' : ' <i>— 하나를 고르시면 업체에 전달됩니다</i>')+'</p>'+
    '<ul class="myqt-l">'+L.map(function(q){
      var pv = (q.provider && q.provider.name) || q.provider_id;

      var ih = !!(q.provider && q.provider.inhouse);
      var tone = (typeof amQuoteTone === "function") ? amQuoteTone(q.state) : "gray";
      return '<li class="myqt-c'+(q.state === "chosen" ? " is-got" : "")+'">'+
        '<div class="myq-h">'+

          '<b class="myqt-pv"><span class="myqt-nm">'+esc(pv)+'</span>'+
            '<i class="myqt-who'+(ih ? " is-ih" : "")+'">'+
              (ih ? "직접 매입" : "제휴 매입업체")+'</i></b>'+
          '<span class="myq-st myq-'+esc(tone)+'">'+
            esc((typeof amQuoteName === "function") ? amQuoteName(q.state) : q.state)+
          '</span>'+
        '</div>'+
        myqSpecs(q, r && r.side)+myqText(q, r && r.side)+

        (!got
          ? '<div class="row-cta"><button class="btn btn-b" type="button"'+
              ' onclick="myqPick(\''+esc(r.id)+'\',\''+esc(q.provider_id)+'\')"'+
              (MYQ.busy ? ' disabled' : '')+'>'+
              '이 견적으로 하겠습니다'+icon("check",16)+'</button></div>'
          : "")+
      '</li>';
    }).join("")+'</ul>'+

    '<p class="myqt-n">등록된 차례로 냅니다. 금액순으로 줄 세우지 않습니다 — '+
      '포함 범위가 서로 달라 금액만으로는 견줄 수 없습니다. '+
      '고르셔도 바로 계약이 되는 것은 아니고, 업체와 조건을 맞추신 뒤에 '+
      '계약으로 넘어갑니다.</p>'+
  '</div>';
}

window.myqPick = function(rid, pv){
  if(MYQ.busy) return;
  MYQ.busy = true; myDbPaint();
  myqCall("choose_quote", { p_request:rid, p_provider:pv },
          "이 견적으로 하겠다고 전달했습니다");
};

var MYQ_OK = { consult:1, quoted:1, nego:1 };

function MyQuoteMine(d, r){
  var mine = myqOf(d, r.id)[0] || null;
  var can  = MYQ_OK[r.state] === 1;
  var open = MYQ.open === r.id;

  if(!mine && !can)
    return '<p class="myqt-n">'+esc(
      r.state === "assigned" ? "배정을 수락하시면 견적을 낼 수 있습니다"
      : r.state === "accepted" ? "상담을 시작하시면 견적을 낼 수 있습니다"
      : "지금 상태에서는 견적을 낼 수 없습니다")+'</p>';

  return '<div class="myqt">'+
    (mine
      ? '<p class="myqt-h">'+icon("doc",15)+'내가 낸 견적'+
          '<span class="myq-st myq-'+esc((typeof amQuoteTone === "function")
            ? amQuoteTone(mine.state) : "gray")+'">'+
            esc((typeof amQuoteName === "function")
              ? amQuoteName(mine.state) : mine.state)+'</span></p>'+
        myqSpecs(mine, r && r.side)+myqText(mine, r && r.side)
      : '<p class="myqt-h">'+icon("doc",15)+'견적 내기</p>')+
    (open ? MyQuoteForm(r, mine) : MyQuoteBtns(r, mine, can))+
  '</div>';
}

function MyQuoteBtns(r, mine, can){
  var b = [];

  if(mine && mine.state === "chosen")
    return '<p class="myqt-n">고객이 이 견적을 골랐습니다. 바꿀 일이 '+
      '있으면 담당자에게 알려 주세요.</p>';
  if(can)
    b.push('<button class="btn btn-b" type="button" onclick="myqOpen(\''+esc(r.id)+'\')">'+(mine ? "견적 고치기" : "견적 내기")+
      icon("arrow",16)+'</button>');
  if(mine && mine.state === "open")
    b.push('<button class="btn btn-o" type="button" onclick="myqDrop(\''+esc(r.id)+'\')"'+(MYQ.busy ? ' disabled' : '')+'>견적 거두기</button>');
  return b.length ? '<div class="row-cta">'+b.join("")+'</div>' : "";
}

function myqRow(id, lab, html, hint){
  return '<div class="f-r"><label for="'+esc(id)+'">'+esc(lab)+'</label>'+
    html+(hint ? '<span class="f-h">'+esc(hint)+'</span>' : '')+'</div>';
}
function myqIn(id, k, v, extra){
  return '<input id="'+esc(id)+'" value="'+esc(v == null ? "" : String(v))+'" '+
    (extra || "")+' oninput="myqSet(\''+esc(k)+'\',this.value)">';
}

function MyQuoteForm(r, mine){

  var N = (typeof amQuoteLabels === "function") ? amQuoteLabels(r && r.side) : {};
  var g = function(k, fb){
    var v = MYQ.draft[k];
    return v === undefined ? (fb == null ? "" : fb) : v;
  };
  var vat = g("vat", (mine && mine.vat) || "add");
  return '<div class="myqt-f">'+
    myqRow("myq-amt", N.amount || "견적 금액 (원) *",
      myqIn("myq-amt", "amount", g("amount", mine && mine.amount),
            'type="number" min="0" step="1000" inputmode="numeric"'),
      N.amountHint || "")+
    myqRow("myq-vat", "부가세",
      '<select id="myq-vat" onchange="myqSet(\'vat\',this.value)">'+
        ["add","incl","free"].map(function(k){
          return '<option value="'+k+'"'+(vat === k ? ' selected' : '')+'>'+
            esc((typeof amQuoteVat === "function") ? amQuoteVat(k) : k)+'</option>';
        }).join("")+'</select>',
      "별도인지 포함인지가 없으면 고객이 두 견적을 견줄 수 없습니다")+
    myqRow("myq-sc", N.scope || "이 금액에 포함되는 것 *",
      '<textarea id="myq-sc" rows="3" oninput="myqSet(\'scope\',this.value)">'+
        esc(g("scope", mine && mine.scope))+'</textarea>',
      N.scopeHint || "")+
    myqRow("myq-ex", N.excludes || "별도로 드는 것",
      '<textarea id="myq-ex" rows="2" oninput="myqSet(\'excludes\',this.value)">'+
        esc(g("excludes", mine && mine.excludes))+'</textarea>',
      N.exHint || "")+
    myqRow("myq-dy", N.days || "예상 소요일",
      myqIn("myq-dy", "days", g("days", mine && mine.days),
            'type="number" min="1" step="1" inputmode="numeric"'))+

    myqRow("myq-st", N.startOn || "시작 가능일",
      myqIn("myq-st", "startOn", g("startOn", mine && mine.start_on), 'type="date"'))+
    myqRow("myq-vt", "견적 유효기간",
      myqIn("myq-vt", "validTo", g("validTo", mine && mine.valid_to), 'type="date"'))+
    myqRow("myq-ws", N.warranty || "A/S · 보증",
      '<textarea id="myq-ws" rows="2" oninput="myqSet(\'warranty\',this.value)">'+
        esc(g("warranty", mine && mine.warranty))+'</textarea>')+
    myqRow("myq-nt", "메모",
      '<textarea id="myq-nt" rows="2" oninput="myqSet(\'note\',this.value)">'+
        esc(g("note", mine && mine.note))+'</textarea>')+
    '<div class="row-cta">'+
      '<button class="btn btn-b" type="button" onclick="myqSend(\''+esc(r.id)+'\')"'+(MYQ.busy ? ' disabled' : '')+'>'+
        (MYQ.busy ? "보내는 중…" : (mine ? "고친 견적 보내기" : "견적 보내기"))+'</button>'+
      '<button class="btn btn-o" type="button" onclick="myqOpen(\'\')">그만두기</button>'+
    '</div>'+
  '</div>';
}

window.myqOpen = function(id){
  MYQ.open = id || ""; MYQ.draft = {}; myDbPaint();
};
window.myqSet = function(k, v){ MYQ.draft[k] = v; };

window.myqSend = function(rid){
  if(MYQ.busy) return;
  var d = MYQ.draft, mine = (MYQ.d ? myqOf(MYQ.d, rid)[0] : null) || {};
  var amt = d.amount !== undefined ? d.amount : mine.amount;
  var sc  = d.scope  !== undefined ? d.scope  : mine.scope;

  if(amt === "" || amt === null || amt === undefined){
    toast("견적 금액을 적어 주세요"); return;
  }
  if(!String(sc || "").trim()){
    toast("이 금액에 무엇이 포함되는지 적어 주세요"); return;
  }
  var data = amDropEmpty({
    amount: Number(amt),
    vat:      d.vat      !== undefined ? d.vat      : mine.vat,
    scope:    String(sc).trim(),
    excludes: d.excludes !== undefined ? d.excludes : mine.excludes,
    days:     d.days     !== undefined ? d.days     : mine.days,
    startOn:  d.startOn  !== undefined ? d.startOn  : mine.start_on,
    validTo:  d.validTo  !== undefined ? d.validTo  : mine.valid_to,
    warranty: d.warranty !== undefined ? d.warranty : mine.warranty,
    note:     d.note     !== undefined ? d.note     : mine.note
  });
  MYQ.busy = true; myDbPaint();
  myqCall("submit_quote", { p_request:rid, p_data:data }, "견적을 보냈습니다");
};

window.myqDrop = function(rid){
  if(MYQ.busy) return;

  if(typeof confirm === "function" &&
     !confirm("낸 견적을 거두시겠습니까? 고객 화면에서 사라집니다.")) return;
  MYQ.busy = true; myDbPaint();
  myqCall("withdraw_quote", { p_request:rid }, "견적을 거뒀습니다");
};

function myqCall(fn, args, say){
  fetch("/api/deal", {
    method:"POST",
    headers: Object.assign({ "content-type":"application/json",
      accept:"application/json" },
      (typeof amAuthHeaders === "function") ? amAuthHeaders() : {}),
    body: JSON.stringify({ fn:fn, args:args })
  }).then(function(r){
    return r.json().then(function(j){ return { ok:r.ok, j:j }; });
  }).then(function(x){
    MYQ.busy = false;
    if(!x.ok){ toast((x.j && x.j.error) || "처리하지 못했습니다"); myDbPaint(); return; }
    toast(say);
    MYQ.open = ""; MYQ.draft = {};

    window.myLoadDb();
  }).catch(function(e){
    MYQ.busy = false;
    try{ console.warn("[my] " + fn + " — " + e); }catch(_){}
    toast("연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요");
    myDbPaint();
  });
}

function MyPwBand(){
  var L = [

    { to:"/track", ia:"contract",   nm:"판매 진행 조회",
      s:"접수번호로 지금 어디까지 왔는지 보십시오." },
    { to:"/sell",  ia:"dev-iphone", nm:"내 폰 팔기",
      s:"기종과 상태만 고르시면 판매 방법을 바로 보실 수 있습니다." },
    { to:"/shop",  ia:"dev-tablet", nm:"중고폰 구매",
      s:"검수를 마친 기기만 올립니다." }
  ];
  return '<section class="sec sec-white"><div class="w">'+
    '<h2 class="pwf-h2">무엇을 하시겠어요?</h2>'+
    '<div class="my-pw">'+ L.map(function(x){
      return '<a class="my-pw-c" href="'+esc(x.to)+'">'+
        '<span class="my-pw-i">'+ iconArt(x.ia, 44) +'</span>'+
        '<b>'+esc(x.nm)+'</b><span class="my-pw-s">'+esc(x.s)+'</span></a>';
    }).join("") +'</div>'+
  '</div></section>';
}

function PageMy(){
  var qs = amGet("am.quotes.v1", []);

  return PgHero({
    kicker:"MY",

    h1raw:"내 기록",
    lead:"이 브라우저에만 남습니다. 서버로 보내지 않습니다.",
    tight:true
  })+

  MyDbBand()+
  MyPwBand()+
  '<section class="sec sec-white"><div class="w">'+

    '<h2>이 브라우저에 남은 기록</h2>'+
    '<p class="lead">고르신 기기 · 적어 두신 숫자 · 앞서 쓰시던 기록이 '+
      '<b>이 브라우저 안에만</b> 남아 있습니다. 저희 서버로는 보내지 않습니다.</p>'+
    '<div class="row-cta"><button class="btn btn-o" type="button" onclick="myClear()">'+
      '내 기록 전부 지우기</button></div>'+
  '</div></section>';
}

window.myClear = function(){
  if(!confirm("이 브라우저에 남은 기록을 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(MKEY); amDel("am.quotes.v1"); amDel(window.AM_SAVE_KEY || "am.saved.v1");

  try{
    var kill = [];
    for(var i = 0; i < localStorage.length; i++){
      var k = localStorage.key(i);
      if(k && k.indexOf("am.tool.") === 0) kill.push(k);
    }
    kill.forEach(function(k){ amDel(k); });
  }catch(e){}
  rerender(true);
};


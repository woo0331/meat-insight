

var MKEY = "am.profile.v1";

function MyDbBand(){
  return '<section class="sec sec-blue my-db" id="my-db" hidden></section>';
}

window.myLoadDb = function(){
  var box = document.getElementById("my-db");
  if(!box || typeof fetch !== "function") return;
  var hd = (typeof amAuthHeaders === "function") ? amAuthHeaders() : {};

  var pre = (typeof amAuthAsk === "function") ? amAuthAsk() : Promise.resolve(null);

  var on = function(){ return !!(window.amAuthNow && amAuthNow().on); };
  var fail = function(){
    if(!on()) return;
    box.innerHTML = '<div class="w"><div class="my-err" role="alert"><p>내 신청을 불러오지 못했습니다.</p>'+
      '<button class="btn btn-o" type="button" onclick="myLoadDb()">다시 시도</button></div></div>';
    box.hidden = false;
  };
  pre.then(function(){
    hd = (typeof amAuthHeaders === "function") ? amAuthHeaders() : {};
    if(on() && box.hidden){ box.innerHTML = '<div class="w"><p class="my-wait" role="status">불러오는 중…</p></div>'; box.hidden = false; }
    return fetch("/api/me", { headers: Object.assign(
      { "accept":"application/json" }, hd) });
  })
    .then(function(r){ if(!r.ok){ fail(); return null; } return r.json(); })
    .then(function(d){

      if(d && d.auth && !d.signedIn){
        if(!(window.amAuthNow && amAuthNow().kakao)){ box.innerHTML = ""; box.hidden = true; return; }
        box.innerHTML = '<div class="w">' + MySignInBand() + '</div>';
        box.hidden = false;

        if(typeof nowQS === "function" && nowQS("next") && !(window.amIsReloadView && window.amIsReloadView())){
          var hd = document.querySelector(".hd");
          window.scrollTo(0, Math.max(0, box.getBoundingClientRect().top + (window.scrollY || 0) - ((hd && hd.offsetHeight) || 64) - 8));
          var kb = box.querySelector(".my-kakao"); try{ if(kb) kb.focus({ preventScroll:true }); }catch(e){}
        }
        return;
      }
      if(d === null) return;
      if(!d.auth || !d.signedIn){ box.innerHTML = ""; box.hidden = true; return; }

      myDbPaint(d);
    })
    .catch(function(e){ console.warn("[my] 신청 내역을 못 불러왔습니다 — " + e); fail(); });
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
    (role === "customer" ? '' :
    '<p class="my-out">' + esc(d.name || "") +
      (d.name ? " · " : "") +
      '<button class="btn btn-o" type="button" onclick="mySignOut()">로그아웃</button>' +
    '</p>') + '</div>';
  box.hidden = false;
  if(typeof window.myPhInit === "function") window.myPhInit();

  var rd = document.getElementById("myrd") || document.getElementById("my-nohit") || (nowQS("claim") && document.getElementById("my-claim"));
  if(rd && (nowQS("no") || nowQS("claim"))){
    try{ rd.scrollIntoView({ block:"start" }); }catch(e){}
    var h2 = document.getElementById("myrd-h"); if(h2){ try{ h2.focus({ preventScroll:true }); }catch(e){} }
  }
}

function MySignInBand(){

  return '<div class="my-kk">'+
      '<button class="btn btn-lg my-kakao" type="button" onclick="myKakao()">'+icon("chat",18)+' 카카오로 시작하기</button>'+
      '<p class="f-h">견적 신청은 로그인 없이도 됩니다. 로그인하면 내 신청과 받은 견적을 볼 수 있습니다.</p>'+
      '<p class="my-in-n" id="my-kk-n" role="status"></p>'+
    '</div>';
}

window.mySignOut = function(){
  if(typeof amAuthOut !== "function") return;
  amAuthOut().then(function(){ window.location.reload(); });
};

function myHd(k, h, p){
  return '<div class="sec-hd"><p class="eyebrow">'+esc(k)+'</p><h2>'+esc(h)+'</h2>'+
    (p ? '<p>'+esc(p)+'</p>' : '')+'</div>';
}

function MyCustBand(d){

  var L = (d.requests || []).slice().sort(function(a, b){ return String(b.created_at || "").localeCompare(String(a.created_at || "")); });

  var nk = function(x){ return String(x || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); };
  var want = nk(nowQS("no"));
  var hit = want ? L.filter(function(r){ return nk(r.no) === want; })[0] : null;
  return MyMeCard(d)+
    (hit ? MyReqDetail(hit, d)
         : want ? '<div class="notice-bad" id="my-nohit"><b>이 계정에서 그 접수번호를 찾지 못했어요.</b>'+
             '<p>로그인하기 전에 넣으신 신청이면 아래 \'이전 신청 가져오기\' 로 가져오실 수 있습니다.</p></div>' : '')+

    (L.length ? '<div class="my-reqs"><h2 class="my-sh">내 신청</h2>'+MyReqRows(L, d, hit)+'</div>' : '')+
    MyClaimBand();
}

function MyMeCard(d){
  var nm = String(d.name || "").trim();
  return '<div class="my-me"><h2 class="my-sh">내 정보</h2>'+
    '<div class="my-me-r">'+icon("user",18)+
      '<span class="my-me-n">'+(nm ? esc(nm) : '카카오 계정으로 로그인됨')+'</span>'+
      '<button class="my-out-b" type="button" onclick="mySignOut()">로그아웃</button>'+
    '</div></div>';
}

function MyReqRows(L, d, hit){
  return '<ul class="my-rows">'+L.map(function(r){
    var nq = myqOf(d, r.id).length;
    var cv = amCustView(r.state, nq);
    var its = r.request_item || [];
    var svc = its.length ? its.map(function(i){ return myqSvcName(i.service_id); }).join(" · ")
            : (r.cat && typeof amCat === "function" && amCat(r.cat) ? amCat(r.cat).name : "상담 후 정하기");
    var href = "/my?no=" + encodeURIComponent(r.no || "");
    return '<li class="my-row'+(r === hit ? " is-on" : "")+'">'+
      '<a class="my-row-a" href="'+esc(href)+'">'+
        '<span class="my-row-s">'+esc(svc)+'</span>'+
        '<span class="my-row-d">'+esc(amDate(String(r.created_at || "").slice(0, 10)))+'</span>'+
        '<em class="myq-st myq-'+esc(cv.tone)+'">'+esc(cv.name)+'</em>'+
      '</a>'+
      (nq ? '<a class="my-row-q" href="'+esc(href)+'">'+icon("doc",14)+' 견적 보기</a>' : '')+
    '</li>'; }).join("")+'</ul>';
}

function MyClaimBand(){

  var cno = String(nowQS("claim") || "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 20);
  return '<details class="my-claim"'+(cno ? ' open id="my-claim"' : '')+'>'+
    '<summary>이전 신청 가져오기</summary>'+
    '<p class="my-claim-p">로그인 없이 넣으신 신청의 <b>접수번호</b>와 그때 적은 <b>휴대폰 번호</b>가 둘이 다 맞아야 이 계정으로 가져옵니다.</p>'+
    '<form class="my-in" onsubmit="return myClaim(event)">'+
      '<div class="f-r">'+
        '<label for="my-cno">신청번호</label>'+
        '<input id="my-cno" type="text" name="no" required '+
          'autocomplete="off" inputmode="text" spellcheck="false" '+
          'placeholder="SW-AB12-CD34"'+(cno ? ' value="'+esc(cno)+'"' : '')+'>'+
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

    var got = String(no.value).trim().toUpperCase().replace(/\s/g, "");
    no.value = ""; tel.value = "";
    try{ history.replaceState(history.state, "", "/my?no=" + encodeURIComponent(got)); }catch(e){}

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
          '<span class="f-h">손님이 업체찾기에서 먼저 읽는 글입니다. '+
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
          '<label for="pvs-ind">잘하시는 업종</label>'+
          '<select id="pvs-ind" class="sel" multiple size="6">'+
            (typeof AM_INDUSTRIES !== "undefined" ? AM_INDUSTRIES : []).map(function(i){
              return '<option value="'+esc(i.key)+'"'+
                ((m.industries || []).indexOf(i.key) >= 0 ? " selected" : "")+'>'+
                esc(i.name)+'</option>'; }).join("")+
          '</select>'+
          '<span class="f-h">비워 두면 전업종으로 읽습니다.</span>'+
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
  return [ (r.side === "close" ? "폐업·철거" : "창업"),
    (cat ? cat.name : ""),
    (r.industry && typeof amIndustryName === "function" ? amIndustryName(r.industry) : ""),
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
  var side = { start:0, close:0 };
  L.forEach(function(r){ if(r.side === "close") side.close++; else side.start++; });

  return '<ul class="myk-g">'+ST.filter(function(s){

      return !s.money;
    }).map(function(s){
      var c = n[s.key] || 0;
      return '<li class="myk'+(c ? "" : " myk-0")+'">'+
        '<b>'+c+'</b><span>'+esc(s.name)+'</span></li>';
    }).join("")+'</ul>'+
    '<dl class="myd-l myd-l3">'+
      '<div><dt>창업 쪽</dt><dd>'+side.start+'건</dd></div>'+
      '<div><dt>폐업·철거 쪽</dt><dd>'+side.close+'건</dd></div>'+

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

    var cs = window.amCustSt ? amCustSt(r.state) : r.state;
    var st = (typeof amDealStName === "function") ? amDealStName(cs) : cs;
    var pv = (r.assignment && r.assignment.length && r.assignment[0].provider)
               ? r.assignment[0].provider.name : "";
    var cat = r.cat && typeof amCat === "function" ? amCat(r.cat) : null;

    var nq = d ? myqOf(d, r.id).length : 0;

    var cv = amCustView(r.state, nq);
    return '<li class="myq"><div class="myq-h">'+
        '<a class="myq-no" href="/my?no='+encodeURIComponent(r.no || "")+'">'+esc(r.no || "")+'</a>'+
        '<span class="myq-st myq-'+esc(cv.tone)+'">'+esc(cv.name)+'</span>'+
      '</div>'+
      '<p class="myq-m">'+myCond(r, cat)+'</p>'+

      (pv ? '<p class="myq-pv">'+icon("users",15)+'<small class="myq-lb">배정된 업체</small>'+esc(pv)+'</p>' : "")+
      (nq ? '<p class="myq-qgo"><a class="btn btn-o btn-sm" href="#myqt-'+esc(r.id)+'" onclick="return hhJump(\'myqt-'+esc(r.id)+'\')">'+icon("doc",15)+' 견적 보기 '+nq+'건</a></p>' : "")+

      ((r.request_item || []).length > 1
        ? '<ul class="my-lk-it myq-it">'+myReqItemsHtml(r.state, r.request_item)+'</ul>' : "")+

      (d ? MyQuoteCompare(d, r) : "")+
    '</li>'; }).join("")+'</ul>';
}

function myqOf(d, rid){
  return (d.quotes || []).filter(function(q){ return q.request_id === rid; });
}

function myqSpecs(q){
  var rows = [];
  if(q.amount != null)
    rows.push(["견적 금액", won(q.amount)+"원 · "+
      ((typeof amQuoteVat === "function") ? amQuoteVat(q.vat) : "")]);
  if(q.days)      rows.push(["예상 소요", q.days+"일"]);
  if(q.start_on)  rows.push(["시작 가능", amDate(q.start_on)]);
  if(q.valid_to)  rows.push(["견적 유효", amDate(q.valid_to)+"까지"]);
  if(!rows.length) return "";
  return '<dl class="myd-l">'+rows.map(function(r){
    return '<div><dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd></div>';
  }).join("")+'</dl>';
}

function myqText(q){
  var L = [["포함", q.scope], ["별도", q.excludes],
           ["A/S · 보증", q.warranty], ["메모", q.note]];
  return L.filter(function(r){ return r[1]; }).map(function(r){
    return '<p class="myq-b"><b>'+esc(r[0])+'</b> '+esc(String(r[1]))+'</p>';
  }).join("") +

  (q.src === "staff"
    ? '<p class="myq-b"><b>적은 사람</b> 운영자가 업체에게 받아 적은 견적입니다 (업체가 직접 낸 것이 아닙니다)</p>' : '');
}

var MYQ_ASK = '<i class="myqc-ask">업체 확인 필요</i>';
function myqSvcName(id){ var sv = (typeof amPickOne === "function") ? amPickOne(id) : null;
  return sv ? amPickLabel(sv) : String(id || ""); }
function myqCard(q, r, d){
  var vatN = { add:"부가세 별도", incl:"부가세 포함", free:"면세" }[q.vat] || "";
  var kindN = { est:"가견적", final:"확정 견적" }[q.kind] || "";
  var siteN = { need:"실측 후 확정", done:"실측함", none:"실측 없이 산정" }[q.site] || "";
  var its = (r && r.request_item) || [];
  var row = function(k, v){ return '<div><dt>'+esc(k)+'</dt><dd>'+v+'</dd></div>'; };
  var tx = function(v){ return v ? esc(String(v)) : ""; };

  var amt = (q.amount != null) ? '<b class="myqc-amt">'+esc(won(q.amount))+'원</b>' : MYQ_ASK;
  var amtSub = [vatN || "부가세 업체 확인 필요", kindN || "가견적 · 확정 업체 확인 필요"].map(esc).join(" · ");

  var inc = [tx(q.scope), q.waste ? "폐기물 — "+tx(q.waste) : "", q.restore ? "원상복구 — "+tx(q.restore) : ""].filter(Boolean).join("<br>") || MYQ_ASK;
  var cover = "";
  if(its.length > 1){
    if(q.items && q.items.length){
      var outS = its.map(function(i){ return i.service_id; }).filter(function(x){ return q.items.indexOf(x) < 0; });
      cover = '<p class="myqc-cov">적용 범위 '+esc(q.items.map(myqSvcName).join(" · "))+
        (outS.length ? ' <span class="myqc-cov-x">— 이 견적에 없음: '+esc(outS.map(myqSvcName).join(" · "))+'</span>' : '')+'</p>';
    }else cover = '<p class="myqc-cov">적용 범위 '+MYQ_ASK+'</p>';
  }
  var exc = [tx(q.excludes), q.extra ? "추가 비용 — "+tx(q.extra) : ""].filter(Boolean).join("<br>") || MYQ_ASK;
  var when = [q.start_on ? esc(amDate(q.start_on))+" 시작 가능" : "", q.days ? esc(q.days)+"일 소요" : ""].filter(Boolean).join(" · ") || MYQ_ASK;
  var revs = ((d && d.quoteRevs) || []).filter(function(v){ return v.quote_id === q.id && v.old_amount != null && v.old_amount !== v.new_amount; });
  return '<dl class="myd-l myqc">'+
      row("총액", amt+'<small class="myqc-sub">'+amtSub+'</small>')+
      (q.buy_amount != null ? row("집기 매입", '<b>'+esc(won(q.buy_amount))+'원</b><small class="myqc-sub">공사비와 따로 — 업체가 사 가는 금액</small>') : "")+
      row("포함 작업", inc+cover)+
      row("제외 · 추가 비용", exc)+
      row("가능 일정", when)+
      row("실측", siteN ? esc(siteN) : MYQ_ASK)+
    '</dl>'+
    (revs.length ? '<div class="myqc-rev"><b>금액이 바뀌었습니다</b><ul>'+revs.map(function(v){
      return '<li>'+esc(amDate(String(v.at).slice(0,10)))+' · '+esc(won(v.old_amount))+'원 → '+esc(won(v.new_amount))+'원'+
        (v.why ? ' · '+esc(v.why) : ' · 사유 업체 확인 필요')+'</li>'; }).join("")+'</ul></div>' : "")+
    ((q.warranty || q.note) ? '<p class="myq-b myqc-etc">'+(q.warranty ? '<b>A/S</b> '+tx(q.warranty)+' ' : '')+(q.note ? '<b>메모</b> '+tx(q.note) : '')+'</p>' : '')+
    (q.src === "staff" ? '<p class="myq-b myqc-etc">운영자가 업체에게 받아 적은 견적입니다.</p>' : '');
}

function MyReqDetail(r, d){
  var L = myqOf(d, r.id);
  var cv = amCustView(r.state, L.length);
  var its = r.request_item || [];
  var svc = its.length ? its.map(function(i){ return myqSvcName(i.service_id); }).join(" · ")
          : (r.cat && typeof amCat === "function" && amCat(r.cat) ? amCat(r.cat).name : "잘 모르겠어요 — 상담 후 정하기");

  var reg = [((r.region && typeof amRegionName === "function") ? amRegionName(r.region) : "") || r.region || "", r.gu || ""].filter(Boolean).join(" ");
  var per = "";
  if(its.length > 1 && typeof amReqItemsView === "function"){
    var v = amReqItemsView(r.state, its);
    if(v.some(function(x){ return x.rec; }))
      per = '<ul class="myrd-per">'+v.map(function(x){
        var c2 = amCustView(x.state, L.length);
        return '<li><span>'+esc(myqSvcName(x.service_id))+'</span><em class="myq-st myq-'+esc(c2.tone)+'">'+esc(c2.name)+'</em></li>'; }).join("")+'</ul>';
  }
  return '<section class="myrd" id="myrd" aria-labelledby="myrd-h">'+
    '<p class="myrd-k">내 신청</p>'+
    '<h2 id="myrd-h" tabindex="-1">'+esc(r.no || "")+'</h2>'+
    '<dl class="myd-l myrd-l">'+
      '<div><dt>현재 상태</dt><dd><em class="myq-st myq-'+esc(cv.tone)+'">'+esc(cv.name)+'</em></dd></div>'+
      '<div><dt>신청한 서비스</dt><dd>'+esc(svc)+per+'</dd></div>'+
      (reg ? '<div><dt>지역</dt><dd>'+esc(reg)+'</dd></div>' : '')+

      (function(){ var pv = (r.assignment || []).map(function(a){ return a && a.provider && a.provider.name; }).filter(Boolean);
        return pv.length ? '<div><dt>배정된 업체</dt><dd class="myq-pv">'+esc(pv.join(" · "))+'</dd></div>' : ''; })()+
      '<div><dt>접수일</dt><dd>'+esc(amDate(String(r.created_at || "").slice(0, 10)))+'</dd></div>'+
    '</dl>'+
    (cv.next ? '<p class="myrd-next">'+esc(cv.next)+'</p>' : '')+
    (L.length ? '<p class="myrd-go"><a class="btn btn-b btn-full" href="#myqt-'+esc(r.id)+'" onclick="return hhJump(\'myqt-'+esc(r.id)+'\')">'+
       (L.length > 1 ? '견적 비교 '+L.length+'건' : '견적 보기')+icon("arrow",17)+'</a></p>' : '')+
    MyQuoteCompare(d, r)+
    MyReqPhotos(r)+
  '</section>';
}

function MyReqPhotos(r){
  var ph = r.request_photo || [];
  return '<div class="myph" id="myph" data-no="'+esc(r.no || "")+'" hidden>'+
    '<p class="myqt-h">'+icon("camera",15)+'사진 <span data-myph-n>'+ph.length+'/'+(window.AM_PH_N || 5)+'장</span></p>'+
    (ph.length ? '<ul class="phup-l myph-l">'+ph.map(function(p, i){
      return '<li data-myph="'+esc(p.id)+'" data-mime="'+esc(p.mime || "")+'">'+
        '<span class="phup-th">'+icon(p.mime === "application/pdf" ? "doc" : "camera", 22)+'</span>'+
        '<span class="phup-tx"><span class="phup-n">사진 '+(i + 1)+'</span>'+
          '<i class="phup-s">'+esc(p.bytes ? (Math.round(p.bytes / 104857.6) / 10) + "MB" : "")+'</i>'+
          '<b class="phup-st" data-myph-st>확인 중…</b></span>'+
      '</li>'; }).join("")+'</ul>' : '')+
    '<div class="myph-add">'+(typeof PhotoPick === "function" ? PhotoPick("myph", { say:"사진을 더 붙이시거나, 저장되지 않은 사진을 다시 골라 주세요." }) : "")+
      '<p class="row-cta"><button type="button" class="btn btn-b" data-myph-save hidden>'+icon("save",16)+' 고른 사진 저장</button></p></div>'+
  '</div>';
}
function myPhH(){ var h = { "content-type":"application/json" };
  try{ if(typeof amAuthHeaders === "function") Object.assign(h, amAuthHeaders()); }catch(e){} return h; }
function myPhSlot(no, photo){
  return function(it){
    return fetch("/api/upload", { method:"POST", headers:myPhH(),
      body:JSON.stringify({ op:"mine", no:no, photo:photo || undefined, mime:it.mime, bytes:it.size }) });
  };
}
window.myPhInit = function(){
  var box = document.getElementById("myph"); if(!box || typeof amPhotoReady !== "function") return;
  amPhotoReady().then(function(up){
    if(!up) return;
    box.hidden = false;
    if(typeof amPhotoWire === "function") amPhotoWire(box);
    var no = box.getAttribute("data-no");
    [].forEach.call(box.querySelectorAll("li[data-myph]"), function(li){
      var id = li.getAttribute("data-myph"), st = li.querySelector("[data-myph-st]");
      fetch("/api/upload?p=" + encodeURIComponent(id), { headers:myPhH() })
        .then(function(r){ return r.json().catch(function(){ return {}; }); })
        .then(function(j){
          if(j && j.ok){ st.textContent = "저장됨"; li.className = "is-ok";
            if(j.url && li.getAttribute("data-mime") !== "application/pdf")
              li.querySelector(".phup-th").innerHTML = '<img src="'+esc(j.url)+'" alt="">'; return; }
          if(j && j.missing){ myPhMissing(li, no, id); return; }
          st.textContent = "지금 확인하지 못했습니다";
        }).catch(function(){ st.textContent = "지금 확인하지 못했습니다"; });
    });
  });
};

function myPhMissing(li, no, id){
  li.className = "is-fail";
  var st = li.querySelector("[data-myph-st]");
  st.textContent = "파일이 저장되지 않았어요";
  var f = "myph-re-" + id;
  var lab = document.createElement("span");
  lab.className = "myph-re";
  lab.innerHTML = '<label class="btn btn-o" for="'+f+'">'+icon("refresh",15)+' 이 사진 다시 첨부</label>'+
    '<input type="file" id="'+f+'" class="phup-i" accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf">';
  li.querySelector(".phup-tx").appendChild(lab);
  lab.querySelector("input").addEventListener("change", function(){
    var file = this.files && this.files[0]; this.value = ""; if(!file) return;
    var mime = (typeof amPhKind === "function") ? amPhKind(file) : file.type;
    var conv = (mime === "image/heic" || mime === "image/heif") && typeof amPhToJpg === "function"
      ? amPhToJpg(file).then(function(j){ file = j; mime = "image/jpeg"; }) : Promise.resolve();
    st.textContent = "올리는 중…"; li.className = "";
    conv.then(function(){
      var it = { mime:mime, size:file.size, f:file };
      return myPhSlot(no, id)(it).then(function(r){ return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
        .then(function(x){
          if(x.j && x.j.saved){ return "saved"; }
          if(!x.ok || !x.j || !x.j.url) throw new Error((x.j && x.j.error) || "지금 올리지 못했습니다");
          var ctl = new AbortController(), ms = window.AM_PH_PUT_MS || Math.min(240000, 45000 + Math.round(file.size / 40));
          var tm = setTimeout(function(){ ctl.abort(); }, ms);
          return fetch(x.j.url, { method:"PUT", headers:{ "content-type":mime }, body:file, signal:ctl.signal })
            .then(function(r){ clearTimeout(tm); if(!r.ok) throw new Error("올리지 못했습니다"); return "ok"; },
                  function(e){ clearTimeout(tm); throw new Error(e && e.name === "AbortError" ? "시간이 오래 걸려 멈췄습니다. 다시 올려 주세요" : "연결이 끊겼습니다. 다시 올려 주세요"); });
        });
    }).then(function(){
      st.textContent = "저장됨"; li.className = "is-ok"; lab.remove(); toast("사진을 저장했습니다");
    }, function(e){
      st.textContent = "저장 실패 — " + ((e && e.message) || "다시 올려 주세요"); li.className = "is-fail";
    });
  });
}

document.addEventListener("click", function(e){
  var b = e.target && e.target.closest && e.target.closest("[data-myph-save]"); if(!b) return;
  var box = document.getElementById("myph"); if(!box || typeof amPhotoSubmitWith !== "function") return;
  var no = box.getAttribute("data-no");
  b.disabled = true;
  amPhotoSubmitWith(box.querySelector(".myph-add"), no, myPhSlot(no, "")).then(function(){ b.disabled = false; b.hidden = true; });
});
document.addEventListener("change", function(e){
  if(e.target && e.target.closest && e.target.closest("#myph .myph-add input[data-ph-in]")){
    var s2 = document.querySelector("#myph [data-myph-save]"); if(s2) setTimeout(function(){ s2.hidden = false; }, 0);
  }
});

function MyQuoteCompare(d, r){
  var L = myqOf(d, r.id);
  if(!L.length) return "";
  var got = L.filter(function(q){ return q.state === "chosen"; })[0];
  return '<div class="myqt" id="myqt-'+esc(r.id)+'">'+
    '<p class="myqt-h">'+icon("doc",15)+(L.length > 1 ? '견적 비교 '+L.length+'건' : '견적 보기')+
      (got ? '' : ' <i>— 하나를 고르시면 업체에 전달됩니다</i>')+'</p>'+
    '<ul class="myqt-l">'+L.map(function(q){
      var pv = (q.provider && q.provider.name) || q.provider_id;
      var tone = (typeof amQuoteTone === "function") ? amQuoteTone(q.state) : "gray";
      return '<li class="myqt-c'+(q.state === "chosen" ? " is-got" : "")+'">'+
        '<div class="myq-h">'+
          '<b class="myqt-pv">'+esc(pv)+'</b>'+
          '<span class="myq-st myq-'+esc(tone)+'">'+
            esc((typeof amQuoteName === "function") ? amQuoteName(q.state) : q.state)+
          '</span>'+
        '</div>'+
        myqCard(q, r, d)+

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
        myqSpecs(mine)+myqText(mine)
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
  var g = function(k, fb){
    var v = MYQ.draft[k];
    return v === undefined ? (fb == null ? "" : fb) : v;
  };
  var vat = g("vat", (mine && mine.vat) || "add");
  return '<div class="myqt-f">'+
    myqRow("myq-amt", "견적 금액 (원) *",
      myqIn("myq-amt", "amount", g("amount", mine && mine.amount),
            'type="number" min="0" step="1000" inputmode="numeric"'),
      "⚠️ 이 금액이 고객 화면에 그대로 나갑니다. 0 원은 '무상' 으로 읽힙니다")+
    myqRow("myq-vat", "부가세",
      '<select id="myq-vat" onchange="myqSet(\'vat\',this.value)">'+
        ["add","incl","free"].map(function(k){
          return '<option value="'+k+'"'+(vat === k ? ' selected' : '')+'>'+
            esc((typeof amQuoteVat === "function") ? amQuoteVat(k) : k)+'</option>';
        }).join("")+'</select>',
      "별도인지 포함인지가 없으면 고객이 두 견적을 견줄 수 없습니다")+
    myqRow("myq-sc", "이 금액에 포함되는 것 *",
      '<textarea id="myq-sc" rows="3" oninput="myqSet(\'scope\',this.value)">'+
        esc(g("scope", mine && mine.scope))+'</textarea>',
      "범위 없는 견적은 금액만 적힌 종이입니다")+
    myqRow("myq-ex", "별도로 드는 것",
      '<textarea id="myq-ex" rows="2" oninput="myqSet(\'excludes\',this.value)">'+
        esc(g("excludes", mine && mine.excludes))+'</textarea>',
      "나중에 또 받게 되는 비용을 미리 적어 두면 분쟁이 줄어듭니다")+
    myqRow("myq-dy", "예상 소요일",
      myqIn("myq-dy", "days", g("days", mine && mine.days),
            'type="number" min="1" step="1" inputmode="numeric"'))+

    myqRow("myq-st", "시작 가능일",
      myqIn("myq-st", "startOn", g("startOn", mine && mine.start_on), 'type="date"'))+
    myqRow("myq-vt", "견적 유효기간",
      myqIn("myq-vt", "validTo", g("validTo", mine && mine.valid_to), 'type="date"'))+
    myqRow("myq-ws", "A/S · 보증",
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

function PageMy(){
  if(nowQS("v") === "product") return PageMyProduct();

  if(nowQS("v") === "records") return PgHero({ kicker:"MY", h1raw:"이 브라우저의 기록", tight:true })+MyBrowserRecords();
  return PgHero({ kicker:"MY", h1raw:"내 계정", tight:true })+
    MyDbBand()+

    MyLookupBand();
}

function MyBrowserRecords(){
  var p = amGet(MKEY, { side:"", industry:"", region:"", gu:"", pyeong:"", dday:"" });
  var qs = amGet("am.quotes.v1", []);
  var ind = p.industry ? amIndustry(p.industry) : null;
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="my-area-hd"><h2>이 브라우저에 저장한 준비 기록</h2></div>'+
    '<div class="my-set">'+
      '<div class="f-r"><label for="my-side">상황</label>'+
        '<select class="sel" id="my-side" onchange="myPut()">'+
          '<option value=""'+(!p.side?" selected":"")+'>고르지 않음</option>'+
          '<option value="start"'+(p.side==="start"?" selected":"")+'>창업 준비중</option>'+
          '<option value="close"'+(p.side==="close"?" selected":"")+'>폐업 준비중</option>'+
        '</select></div>'+
      '<div class="f-r"><label for="my-ind">업종</label>'+IndustrySelect("my-ind", p.industry, "myPut()")+'</div>'+
      '<div class="f-r"><label for="my-reg">지역</label>'+RegionSelect("my-reg", p.region, "myPut()")+'</div>'+
      '<div class="f-r"><label for="my-py">평수</label>'+
        '<input id="my-py" inputmode="numeric" value="'+esc(p.pyeong||"")+'" onchange="myPut()" placeholder="예: 30"></div>'+
    '</div>'+
    (p.side && ind ? '<p class="lead">'+esc(ind.name)+'</p>' : '')+
    MySaved()+MyTools()+
    (qs.length ? '<p class="lead">받은 제안 '+qs.length+'건</p>' : '')+
    '<div class="row-cta"><button class="btn btn-o" type="button" onclick="myClear()">내 기록 전부 지우기</button></div>'+
  '</div></section>';
}

window.myPut = function(){
  amSet(MKEY, {
    side: $("my-side").value, industry: $("my-ind").value,
    region: $("my-reg").value, gu:"", pyeong: $("my-py").value.trim(), dday:""
  });
  rerender(true);
};

window.myClear = function(){
  if(!confirm("이 브라우저에 남은 기록을 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(MKEY); amDel("am.quotes.v1"); amDel(window.AM_SAVE_KEY || "am.saved.v1");

  (window.AM_TOOLS || []).forEach(function(t){ amDel("am.tool." + t.key); });
  rerender(true);
};

function MySaved(){
  var ids = (window.amSaved ? amSaved() : []);
  var ps  = ids.map(function(id){ return amProvider(id); }).filter(Boolean);

  if(ps.length !== ids.length)
    amSet(window.AM_SAVE_KEY || "am.saved.v1", ps.map(function(p){ return p.id; }));

  if(!ps.length) return '<div class="my-next"><h2>저장한 업체</h2>'+
    '<p class="lead">아직 저장하신 업체가 없습니다. 업체 화면에서 '+
      '\u201C관심 업체\u201D 를 누르시면 여기 모아 드립니다.</p>'+
    '<div class="row-cta"><a class="btn btn-o" href="/providers">업체찾기'+icon("arrow",16)+'</a></div>'+
  '</div>';

  return '<div class="my-next"><h2>저장한 업체 '+ps.length+'곳</h2>'+
    '<ul class="my-tl">'+ps.map(function(p){
      return '<li><a href="/p/'+esc(p.id)+'">'+
        '<span class="my-tl-ic">'+icon("users",18)+'</span>'+
        '<b>'+esc(p.name)+'</b>'+
        '<span class="my-tl-n">'+esc((p.regions||[]).map(amRegionName)
          .filter(Boolean).join(" · ") || "지역 미등록")+'</span>'+
        '<span class="my-tl-go" aria-hidden="true">'+icon("arrow",15)+'</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
    '<div class="row-cta">'+
      (ps.length > 1
        ? '<a class="btn btn-b" href="/compare?ids='+esc(ps.slice(0, window.AM_CMP_MAX || 3)
            .map(function(p){ return p.id; }).join(","))+'">저장한 업체 비교하기'+icon("arrow",16)+'</a>'
        : '')+
      '<a class="btn btn-o" href="/providers">업체 더 찾기</a>'+
    '</div>'+
  '</div>';
}

function MyTools(){
  var list = (window.AM_TOOLS || []).map(function(t){
    var v = amGet("am.tool." + t.key, null);
    var n = 0;
    if(v && typeof v === "object")
      n = Object.keys(v).filter(function(k){
        return v[k] !== "" && v[k] !== null && v[k] !== undefined && v[k] !== false; }).length;
    return { t:t, n:n };
  }).filter(function(x){ return x.n > 0; });

  if(!list.length) return '<div class="my-next"><h2>사장님 도구</h2>'+
    '<p class="lead">아직 적어 두신 숫자가 없습니다. '+
      '창업비 · 고정비 · 손익분기를 적어 두시면 여기 모아 드립니다.</p>'+
    '<div class="row-cta"><a class="btn btn-o" href="/tools">도구 보기'+icon("arrow",16)+'</a></div>'+
  '</div>';

  return '<div class="my-next"><h2>사장님 도구</h2>'+
    '<ul class="my-tl">'+list.map(function(x){
      return '<li><a href="'+esc(x.t.to)+'">'+
        '<span class="my-tl-ic">'+icon(x.t.icon,18)+'</span>'+
        '<b>'+esc(x.t.name)+'</b>'+
        '<span class="my-tl-n">'+x.n+'칸 적어 두셨습니다</span>'+
        '<span class="my-tl-go" aria-hidden="true">'+icon("arrow",15)+'</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
  '</div>';
}

var LKS = { step:"no", ch:"", no:"", say:"", test:"", err:"", data:null, busy:false };
var LK_TOK = "am.lookup.v1";
var LK_PHASE = { open:"진행 중", hold:"보류", done:"완료", lost:"종료", none:"확인 중" };

function MyLookupBand(){
  return '<section class="sec sec-white my-lk" id="my-lk-sec" aria-labelledby="my-lk-h" hidden><div class="w">'+
    '<div class="my-area-hd"><h2 id="my-lk-h">본인 확인 후 조회하는 신청 내역</h2>'+
      '<p>접수번호와 전화번호를 적으시면 그 번호로 인증번호를 보내 드리고, 인증번호까지 맞으면 '+
      '진행 상태를 보여 드립니다. 접수번호와 전화번호만으로는 열리지 않습니다.</p></div>'+
    '<div id="my-lk">'+ myLkBody(false) +'</div>'+
  '</div></section>';
}
function myLkBody(open){
  if(!open) return '<p class="note-box" data-lk="off">본인 확인 조회는 아직 열리지 않았습니다 — '+
    '인증번호를 보낼 수단이 정해지면 이 자리에서 바로 쓰실 수 있습니다.</p>';
  if(LKS.data) return myLkView(LKS.data);
  var err = LKS.err ? '<p class="notice-bad" role="alert">'+esc(LKS.err)+'</p>' : '';
  if(LKS.step === "code"){
    return err + '<form class="my-lk-f" onsubmit="return myLkVerify(event)" data-lk="code">'+
      '<p role="status">'+esc(LKS.say)+'</p>'+
      (LKS.test ? '<p class="note-box">시험용 — 실제로 보내지 않았습니다. 인증번호 <b>'+esc(LKS.test)+'</b></p>' : '')+
      '<div class="f-r"><label for="my-lk-code">인증번호 6자리 <b>*</b></label>'+
        '<input id="my-lk-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required></div>'+
      '<div class="row-cta">'+
        '<button class="btn btn-b" type="submit"'+(LKS.busy ? ' disabled' : '')+'>확인</button>'+
        '<button class="btn btn-o" type="button" onclick="myLkReset()">처음부터</button>'+
      '</div></form>';
  }
  return err + '<form class="my-lk-f" onsubmit="return myLkStart(event)" data-lk="start">'+
    '<div class="f-2">'+
      '<div class="f-r"><label for="my-lk-no">접수번호 <b>*</b></label>'+
        '<input id="my-lk-no" autocomplete="off" placeholder="예: SW-AB12-CD34" required></div>'+
      '<div class="f-r"><label for="my-lk-tel">신청할 때 적은 전화번호 <b>*</b></label>'+
        '<input id="my-lk-tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="010-0000-0000" required></div>'+
    '</div>'+
    '<p class="note">적으신 번호는 저장하지 않습니다. 인증번호는 10분 동안만 쓸 수 있고 다섯 번 틀리면 막힙니다.</p>'+
    '<button class="btn btn-b" type="submit"'+(LKS.busy ? ' disabled' : '')+'>인증번호 받기</button>'+
  '</form>';
}
function myLkKst(v){
  var d = new Date(v); if(isNaN(d)) return "";
  return d.toLocaleString("ko-KR", { timeZone:"Asia/Seoul", year:"numeric", month:"2-digit", day:"2-digit" });
}

function myReqItemsHtml(reqState, items){
  var V = window.amReqItemsView ? amReqItemsView(reqState, items) : (items || []);
  return V.map(function(it){
    var o = window.amPickOne ? amPickOne(it.service_id) : null;
    var nm = (o && window.amPickLabel) ? amPickLabel(o) : it.service_id;
    var st = window.amDealStName ? (amDealStName(it.state) || it.state) : it.state;
    return '<li data-own="'+(it.own === false ? "0" : "1")+'"><b>'+esc(nm)+'</b><span>'+esc(st)+
      (it.own === false ? ' <i class="my-it-with">신청 전체와 함께 진행</i>' : '')+'</span></li>';
  }).join("");
}
function myLkView(d){
  var ru = d.rollup || {};
  var cs = window.amCustSt ? amCustSt(d.state) : d.state;
  var tl = (d.state && window.amReqTally) ? amReqTally(d.state, d.items) : ru;

  var head = !d.state ? "" : (tl.rec ? (LK_PHASE[tl.phase] || "") : (window.amDealStName ? amDealStName(cs) : ""));
  var items = myReqItemsHtml(d.state, d.items);
  var notes = (d.notes || []).map(function(n){
    return '<li><em>'+esc(myLkKst(n.at))+'</em><p>'+esc(n.body)+'</p></li>';
  }).join("");
  return '<div class="my-lk-v" data-lk="view">'+
    '<p class="my-lk-no">접수번호 <b>'+esc(d.no)+'</b>'+(d.created_at ? ' · 접수일 '+esc(myLkKst(d.created_at)) : '')+'</p>'+

    '<p class="my-lk-ph">지금 상태 <b data-lk-st="'+esc(tl.rec ? "items" : (cs || ""))+'">'+esc(head || LK_PHASE[ru.phase] || "확인 중")+'</b>'+
      (tl.total > 1 ? ' — 서비스 '+tl.total+'개 중 진행 '+tl.open+' · 완료 '+tl.done+(tl.hold ? ' · 보류 '+tl.hold : '')+(tl.lost ? ' · 종료 '+tl.lost : '') : '')+'</p>'+
    (items ? '<h3>서비스별 상태</h3><ul class="my-lk-it">'+items+'</ul>' : '')+
    '<h3>안내</h3>'+(notes ? '<ol class="my-lk-nt">'+notes+'</ol>'
      : '<p class="note">아직 남겨 드린 안내가 없습니다.</p>')+
    '<p class="note">업체가 정해지면 업체에 연락처를 전하기 전에 따로 동의를 여쭙니다. 연락 시점은 약속드리지 않습니다.</p>'+
    '<button class="btn btn-o" type="button" onclick="myLkReset(true)">다른 신청 조회 · 확인 끝내기</button>'+
  '</div>';
}
function myLkDraw(){
  var box = document.getElementById("my-lk"); if(!box) return;
  box.innerHTML = myLkBody(!!(window.amAuthNow && amAuthNow().lookup));
}
function myLkPost(body, tok){
  var h = { "content-type":"application/json", accept:"application/json" };
  if(tok) h["x-lookup-token"] = tok;
  return fetch("/api/lookup", { method:"POST", headers:h, body: JSON.stringify(body) })
    .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(d){ return { ok:r.ok, d:d }; }); });
}
window.myLkStart = function(e){
  if(e && e.preventDefault) e.preventDefault();
  var no = (document.getElementById("my-lk-no") || {}).value || "";
  var tel = (document.getElementById("my-lk-tel") || {}).value || "";
  if(!no.trim() || tel.replace(/[^0-9]/g, "").length < 8){ LKS.err = "접수번호와 전화번호를 확인해 주세요"; myLkDraw(); return false; }
  LKS.busy = true; LKS.err = ""; myLkDraw();
  myLkPost({ op:"start", no:no, tel:tel }).then(function(x){
    LKS.busy = false;
    if(!x.ok){ LKS.err = (x.d && x.d.error) || "지금 처리하지 못했습니다"; myLkDraw(); return; }
    LKS.step = "code"; LKS.ch = x.d.challenge; LKS.no = no; LKS.say = x.d.say || ""; LKS.test = x.d.testCode || "";
    myLkDraw();
    var c = document.getElementById("my-lk-code"); if(c) c.focus();
  }).catch(function(){ LKS.busy = false; LKS.err = "연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요"; myLkDraw(); });
  return false;
};
window.myLkVerify = function(e){
  if(e && e.preventDefault) e.preventDefault();
  var code = ((document.getElementById("my-lk-code") || {}).value || "").replace(/[^0-9]/g, "");
  if(code.length !== 6){ LKS.err = "인증번호 여섯 자리를 적어 주세요"; myLkDraw(); return false; }
  LKS.busy = true; LKS.err = ""; myLkDraw();
  myLkPost({ op:"verify", challenge:LKS.ch, no:LKS.no, code:code }).then(function(x){
    LKS.busy = false;
    if(!x.ok || !x.d.token){ LKS.err = (x.d && x.d.error) || "확인하지 못했습니다"; myLkDraw(); return; }
    try{ sessionStorage.setItem(LK_TOK, JSON.stringify({ t:x.d.token, until: Date.now() + 29 * 60e3 })); }catch(_){}
    LKS.no = ""; LKS.ch = ""; LKS.test = "";
    myLkRead(x.d.token);
  }).catch(function(){ LKS.busy = false; LKS.err = "연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요"; myLkDraw(); });
  return false;
};
function myLkRead(tok){
  myLkPost({ op:"read" }, tok).then(function(x){
    if(!x.ok){ myLkReset(); LKS.err = (x.d && x.d.error) || "다시 확인해 주세요"; myLkDraw(); return; }
    LKS.data = x.d.data; myLkDraw();
  }).catch(function(){ LKS.err = "연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요"; myLkDraw(); });
}
window.myLkReset = function(end){
  LKS.step = "no"; LKS.ch = ""; LKS.no = ""; LKS.say = ""; LKS.test = ""; LKS.err = ""; LKS.data = null;
  if(end){ try{ sessionStorage.removeItem(LK_TOK); }catch(_){} }
  myLkDraw();
};

window.myLkInit = function(){
  if(typeof window.amAuthAsk !== "function") return;
  window.amAuthAsk().then(function(a){

    var sec = document.getElementById("my-lk-sec");
    if(!a || !a.lookup || a.signedIn){ if(sec) sec.hidden = true; myLkDraw(); return; }
    if(sec) sec.hidden = false;
    var saved = null;
    try{ saved = JSON.parse(sessionStorage.getItem(LK_TOK) || "null"); }catch(_){}
    if(saved && saved.t && saved.until > Date.now()){ myLkDraw(); myLkRead(saved.t); }
    else { try{ sessionStorage.removeItem(LK_TOK); }catch(_){} myLkDraw(); }
  });
};

window.myKakao = function(){
  var n = document.getElementById("my-kk-n");
  if(typeof amAuthKakao !== "function") return;
  if(n){ n.textContent = "카카오로 이동합니다…"; n.className = "my-in-n"; }
  amAuthKakao().then(function(r){
    if(!r.ok && n){ n.textContent = r.say; n.className = "my-in-n bad"; }
  });
};

var PD_CATS = [["kitchen","주방 · 집기"],["supply","소모품 · 포장재"],["furniture","매장 가구"],
               ["device","IT · 기기"],["etc","기타"]];
var PD_ST = { review:"검수 대기 — 아직 공개되지 않았습니다", live:"공개 중", hidden:"내려 둠" };
function PageMyProduct(){
  var edit = /^[0-9a-fA-F-]{36}$/.test(nowQS("id") || "");
  return PgHero({ kicker:"MY", h1raw: edit ? "상품 고치기" : "상품 올리기",
    lead:"사진과 상품명, 가격만 적어 주세요. 운영자가 확인한 뒤 공개합니다.", tight:true })+
  '<section class="sec sec-white"><div class="w form-wrap qf">'+
    '<div id="pd-gate" role="status"></div>'+
    '<form id="pd-f" onsubmit="return pdSend(event)">'+
      '<fieldset id="pd-fs" disabled>'+
        '<div id="pd-have"></div>'+
        PhotoPick("pd", { imgOnly:true, say:"앞면 · 옆면 · 흠집이 있는 곳을 찍어 주세요. 첫 장이 대표 사진이 됩니다." })+
        '<div class="f-r"><label for="pd-name">상품명 <b>*</b></label>'+
          '<input id="pd-name" maxlength="80" required placeholder="예: 업소용 반찬 냉장고 1500"></div>'+
        '<div class="f-2">'+
          '<div class="f-r"><label for="pd-cat">카테고리 <b>*</b></label>'+
            '<select class="sel" id="pd-cat"><option value="">골라 주세요</option>'+
              PD_CATS.map(function(c){ return '<option value="'+c[0]+'">'+esc(c[1])+'</option>'; }).join("")+'</select></div>'+
          '<div class="f-r"><label for="pd-price">판매 가격 (원)</label>'+
            '<input id="pd-price" inputmode="numeric" maxlength="12" placeholder="비워 두면 가격 협의"></div>'+
        '</div>'+
        '<div class="f-r"><label for="pd-body">상품 설명</label>'+
          '<textarea id="pd-body" rows="5" maxlength="3000" placeholder="상태 · 사용 기간 · 함께 드리는 것"></textarea></div>'+
        QMore("pd-more",
          '<div class="f-r"><label for="pd-ship">배송 · 수령 조건</label>'+
            '<input id="pd-ship" maxlength="500" placeholder="예: 직접 수령 / 택배 가능(착불)"></div>')+
        '<div id="pd-fail"></div>'+
        '<button class="btn btn-b btn-lg btn-full" type="submit" id="pd-go">'+
          (edit ? "고친 내용 저장하기" : "상품 등록하기")+icon("arrow",18)+'</button>'+
      '</fieldset>'+
    '</form>'+
    '<div id="pd-mine"></div>'+
  '</div></section>';
}
function pdH(){ var h = { "content-type":"application/json" };
  try{ if(typeof amAuthHeaders === "function") Object.assign(h, amAuthHeaders()); }catch(e){} return h; }
function pdGate(html){ var g = $("pd-gate"); if(g) g.innerHTML = html; }
window.myPdInit = function(){
  if(!$("pd-f")) return;
  var id = nowQS("id") || "";
  fetch("/api/product" + (/^[0-9a-fA-F-]{36}$/.test(id) ? "?id=" + encodeURIComponent(id) : ""), { headers:pdH() })
    .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return { ok:r.ok, j:j }; }); })
    .then(function(x){
      var j = x.j || {};
      if(!j.ready){
        pdGate('<div class="notice-bad"><b>지금은 상품을 올릴 수 없습니다.</b><p>적으셔도 저장되지 않습니다. 준비가 끝나면 이 화면에서 바로 올리실 수 있습니다.</p></div>');
        return;
      }
      if(!j.signedIn){
        pdGate('<div class="notice-bad"><b>로그인하시면 올리실 수 있습니다.</b><p>올린 상품은 로그인한 계정에만 묶이고, 그 계정에서만 고칠 수 있습니다.</p>'+
          '<p><a class="btn btn-b" href="/my?next='+encodeURIComponent("/my?v=product")+'">로그인 · 회원가입</a></p></div>');
        return;
      }
      $("pd-fs").disabled = false;
      var L = j.products || [];
      if(id){
        if(!x.ok || !L[0]){ pdGate('<div class="notice-bad"><b>이 상품을 찾을 수 없습니다.</b><p>내가 올린 상품만 고칠 수 있습니다.</p></div>'); $("pd-fs").disabled = true; return; }
        pdFill(L[0]);
      }
      if(!id) pdMine();
    })
    .catch(function(){ pdGate('<div class="notice-bad"><b>지금 불러오지 못했습니다.</b><p>잠시 뒤 다시 열어 주세요.</p></div>'); });
};
function pdFill(p){
  $("pd-f").setAttribute("data-id", p.id);
  $("pd-name").value = p.name || ""; $("pd-cat").value = p.cat || "";
  $("pd-price").value = p.price == null ? "" : String(p.price);
  $("pd-body").value = p.body || ""; $("pd-ship").value = p.ship || "";
  pdGate('<p class="note-box">지금 상태: <b>'+esc(PD_ST[p.state] || p.state)+'</b>'+
    (p.state === "live" ? ' — 고치시면 다시 확인한 뒤 공개합니다.' : '')+'</p>');
  pdHave(p.product_photo || []);
}

function pdHave(ph){
  var box = $("pd-have"); if(!box) return;
  box.innerHTML = ph.length ? '<p class="phup-h"><b>올린 사진</b> <span class="phup-cnt">'+ph.length+'/5장</span></p>'+
    '<ul class="phup-l pd-have-l">'+ph.map(function(p){
      return '<li class="is-ok">'+(p.url ? '<img class="phup-th" src="'+esc(p.url)+'" alt="">' : '')+
        '<span>저장됨</span><button type="button" class="phup-x" data-pd-x="'+esc(p.id)+'" aria-label="이 사진 빼기">'+icon("x",15)+'</button></li>';
    }).join("")+'</ul>' : '';
}
document.addEventListener("click", function(e){
  var b = e.target.closest && e.target.closest("[data-pd-x]"); if(!b) return;
  if(!window.confirm("이 사진을 뺄까요?")) return;
  b.disabled = true;
  fetch("/api/product", { method:"POST", headers:pdH(), body:JSON.stringify({ op:"drop", photo:b.getAttribute("data-pd-x") }) })
    .then(function(r){ return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
    .then(function(x){ if(!x.ok) throw new Error((x.j && x.j.error) || "빼지 못했습니다");
      var li = b.closest("li"); if(li) li.remove(); toast("사진을 뺐습니다"); })
    .catch(function(er){ b.disabled = false; toast(er.message || "빼지 못했습니다"); });
});
function pdMine(){
  fetch("/api/product", { headers:pdH() }).then(function(r){ return r.json(); }).then(function(j){
    var L = (j && j.products) || []; if(!L.length) return;
    $("pd-mine").innerHTML = '<div class="pd-mine"><h2>내가 올린 상품</h2><ul>'+L.map(function(p){
      return '<li><a href="/my?v=product&id='+encodeURIComponent(p.id)+'"><b>'+esc(p.name)+'</b>'+
        '<i>'+esc(PD_ST[p.state] || p.state)+' · 사진 '+(p.photos || 0)+'장</i></a></li>'; }).join("")+'</ul></div>';
  }).catch(function(){});
}
window.pdSend = function(ev){
  ev.preventDefault();
  var name = $("pd-name").value.trim(), cat = $("pd-cat").value;
  var price = $("pd-price").value.replace(/[^0-9]/g, "");

  if(!name){ toast("상품명을 적어 주세요"); $("pd-name").focus(); return false; }
  if(!cat){ toast("카테고리를 골라 주세요"); $("pd-cat").focus(); return false; }
  if(price.length > 10){ toast("판매 가격을 다시 확인해 주세요"); $("pd-price").focus(); return false; }
  var f = $("pd-f"), btn = $("pd-go"), id = f.getAttribute("data-id") || "";
  btn.disabled = true; var lab = btn.innerHTML; btn.textContent = "저장하는 중…";
  fetch("/api/product", { method:"POST", headers:pdH(), body:JSON.stringify({ op:"save", p:{
      id:id || undefined, name:name, cat:cat, price:price,
      body:$("pd-body").value.trim(), ship:$("pd-ship").value.trim() } }) })
    .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return { ok:r.ok, j:j }; }); })
    .then(function(x){
      if(!x.ok || !x.j || !x.j.id) throw new Error((x.j && x.j.error) || "지금 저장하지 못했습니다");

      f.setAttribute("data-id", x.j.id);
      $("pd-fail").innerHTML = '<div class="notice-ok"><b>저장되었습니다.</b><p>지금 상태는 <b>'+
        esc(PD_ST[x.j.state] || "검수 대기")+'</b>. 운영자가 확인한 뒤 공개합니다.</p></div>';
      return (typeof amPhotoSubmitWith === "function" ? amPhotoSubmitWith(f, x.j.id, function(it){
        return fetch("/api/product", { method:"POST", headers:pdH(),
          body:JSON.stringify({ op:"slot", id:x.j.id, mime:it.mime, bytes:it.size }) }); }) : Promise.resolve(false));
    })
    .then(function(){ btn.disabled = false; btn.innerHTML = lab; toast("저장되었습니다"); })
    .catch(function(e){
      btn.disabled = false; btn.innerHTML = lab;
      $("pd-fail").innerHTML = '<div class="notice-bad"><b>저장하지 못했습니다.</b><p>'+esc((e && e.message) || "")+
        ' 적으신 내용은 그대로 있습니다 — 다시 눌러 주세요.</p></div>';
    });
  return false;
};

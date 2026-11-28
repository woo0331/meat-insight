/* ════════════════════════════════════════════════════════════════════
   MY — 내 창업 / 내 폐업 (§42)

   로그인이 없어도 다시 올 이유를 만드는 자리입니다. 전부
   `localStorage` 이고 **서버로 보내지 않습니다.**

   ⚠️ **성함 · 연락처를 담지 않습니다.** 가게 컴퓨터는 여러 사람이 씁니다.
   ⚠️ `localStorage` 는 사파리 비공개 모드에서 **던집니다.** 감싸지
   않으면 화면이 통째로 안 그려집니다 (`amGet`/`amSet` 이 감쌉니다).
   ⚠️ **아직 안 하신 칸도 숨기지 않습니다.** 숨기면 여기서 무엇을 할 수
   있는지 모르게 됩니다.
   ════════════════════════════════════════════════════════════════════ */

var MKEY = "am.profile.v1";

/* ══════════════════════════════════════════════════════════════════
   내 신청 · 업체 대시보드 · 관리자 작업대 — 2026-10-09 지시서
   §11-1 · §9-4 · §11-2
   ══════════════════════════════════════════════════════════════════
   > §11-1 "상담 신청 내역 · 계약 진행 현황 · 재신청 및 추가 서비스"
   > §9-4  "배정받은 상담 요청 · 견적 · 계약 · 정산 내역 확인"
   > §11-2 "모든 통계는 실제 DB 데이터 기반으로 계산한다"

   ⚠️⚠️ **새 주소를 만들지 않았습니다.** 역할마다 다른 화면이 아니라
   **같은 `/my` 가 역할을 보고 다른 구간**을 냅니다 — `/dashboard` ·
   `/partner` 를 따로 만들면 로그인 전에는 전부 빈 화면이고, 색인은
   되는데 들어가면 아무것도 없는 주소가 셋 늘어납니다.

   ⚠️⚠️ **역할로 막는 것이 아닙니다.** 무엇이 보이는가는 DB 의 RLS 와
   `api/me.js` 의 칸 목록이 정합니다 — 화면은 **온 것을 보여 줄**
   뿐입니다. 화면 코드로만 막으면 버그 하나에 남의 연락처가 섭니다.

   ⚠️⚠️ **로그인이 설정되기 전에는 이 구간을 아예 안 그립니다.**
   `/api/session` 이 `auth:false` 를 돌려주면 `.my-db` 가 빈 채로
   남고, 화면에는 아무것도 안 보입니다 — "로그인" 단추도, "준비 중"
   자리표시자도 만들지 않습니다 (§30-7 · 절대 규칙 2 · 5).

   ⚠️⚠️ **상태 이름을 화면에 적지 마세요.** `deal.js` 의 `AM_DEAL_ST`
   에서 가져옵니다 — 두 곳에 적으면 상태를 하나 늘릴 때(이번 보류가
   그랬습니다) 한쪽만 바뀌어 어긋납니다.

   ⚠️ **고객에게 수수료 · 정산을 보여 주지 않습니다** (§11-1 · api/me.js
   의 PICK 이 애초에 안 가져옵니다). 보여 주면 우리와 업체 사이의 돈을
   자기가 내는 돈으로 읽습니다.
   ⚠️ 서버가 안 되면 **조용히 비워 둡니다** — 손님은 아무 잘못도 하지
   않았는데 빨간 에러를 보게 할 까닭이 없습니다 (운영자에게는
   console.warn · 절대 규칙 3). */
function MyDbBand(){
  return '<section class="sec sec-blue my-db" id="my-db" hidden></section>';
}

/* ⚠️⚠️ **2026-10-11 — 토큰을 안 보내고 있었습니다.** `/api/me` 는
   `Authorization: Bearer …` 로 누구인지 가리는데 여기서 안 붙여서,
   로그인이 서는 날에도 **영원히 `signedIn:false`** 가 돌아올 자리
   였습니다. 에러도 안 나고 화면도 멀쩡합니다 — 구간이 그냥 안
   보일 뿐입니다 (이 저장소가 "만들어 놓고 안 쓰는 칸" 으로 여러 번
   겪은 그 꼴). `amAuthHeaders()` 가 토큰이 없으면 **빈 객체**를
   돌려주므로, 로그인 전 동작은 전과 한 글자도 다르지 않습니다. */
window.myLoadDb = function(){
  var box = document.getElementById("my-db");
  if(!box || typeof fetch !== "function") return;
  var hd = (typeof amAuthHeaders === "function") ? amAuthHeaders() : {};
  /* 먼저 로그인 상태를 확인합니다 — 매직링크로 돌아온 해시를 받아
     치우는 일도 거기서 합니다 (`amAuthAsk`). */
  var pre = (typeof amAuthAsk === "function") ? amAuthAsk() : Promise.resolve(null);
  /* 2026-11-28 — 조회 중과 오류를 '신청 0건' 으로 읽지 않습니다. 로그인이 켜진 경우에만 짧게 말합니다. */
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
      /* ⚠️ 설정은 됐는데 아직 로그인 안 하셨으면 **로그인 칸**을 냅니다.
         설정 자체가 꺼져 있으면(`auth:false`) 구간째 없습니다 —
         작동하지 않는 단추를 만들지 않습니다 (§30-7). */
      /* ⚠️ 카카오가 꺼져 있으면 로그인 칸을 안 냅니다 (메일로 넘어가지 않습니다). */
      if(d && d.auth && !d.signedIn){
        if(!(window.amAuthNow && amAuthNow().kakao)){ box.innerHTML = ""; box.hidden = true; return; }
        box.innerHTML = '<div class="w">' + MySignInBand() + '</div>';
        box.hidden = false;
        /* 2026-11-26 — 상단 사람 아이콘 · 메뉴 · 하단 '내 기록' 으로 오셨으면(?next=) 로그인 칸으로 바로 내려갑니다 */
        if(typeof nowQS === "function" && nowQS("next") && !(window.amIsReloadView && window.amIsReloadView())){
          var hd = document.querySelector(".hd");
          window.scrollTo(0, Math.max(0, box.getBoundingClientRect().top + (window.scrollY || 0) - ((hd && hd.offsetHeight) || 64) - 8));
          var kb = box.querySelector(".my-kakao"); try{ if(kb) kb.focus({ preventScroll:true }); }catch(e){}
        }
        return;
      }
      if(d === null) return;   /* 오류 — fail() 이 그린 '다시 시도' 를 지우지 않습니다 */
      if(!d.auth || !d.signedIn){ box.innerHTML = ""; box.hidden = true; return; }
      /* ⚠️⚠️ **역할은 서버가 토큰으로 읽어 온 값**입니다 (`api/_auth.js`).
         화면이 고르는 것이 아니고, 여기서 고른다고 보이는 줄이 늘지도
         않습니다 — 무엇이 오는지는 RLS 와 `api/me.js` 의 칸 목록이
         정합니다. 여기서 하는 일은 **온 것을 어떻게 보여 줄지**까지입니다. */
      myDbPaint(d);
    })
    .catch(function(e){ console.warn("[my] 신청 내역을 못 불러왔습니다 — " + e); fail(); });
};

/* ⚠️⚠️ **그린 것을 다시 그릴 수 있어야 합니다.** 견적을 내고 · 거두고 ·
   고르는 자리가 생기면서 "눌렀더니 바뀐 것을 그 자리에서 보여 주는"
   일이 필요해졌습니다. 그래서 그리는 일을 떼어 두고, 온 것을 `MYQ.d` 에
   들고 있습니다 — ⚠️ **서버에서 온 것이 진실입니다.** 화면이 들고 있는
   값으로 상태를 추측하지 않고, 바꾼 뒤에는 `myLoadDb()` 로 다시 묻습니다
   (`/admin` 의 `rqLoad()` 와 같은 규칙).
   ⚠️ 적다가 거절당해도 **적으신 것이 날아가지 않게** `MYQ.draft` 에
   들고 있습니다 (이 저장소가 배정 화면에서 고른 업체가 빈 칸으로
   돌아간 것을 겪은 자리입니다). */
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
  /* ⚠️ 나가는 길을 반드시 같이 냅니다 — 가게 컴퓨터는 여러 사람이
     씁니다. 들어올 길만 만들면 앞사람 계정이 그대로 남습니다. */
  box.innerHTML = '<div class="w">' + inner +
    (role === "customer" ? '' :
    '<p class="my-out">' + esc(d.name || "") +
      (d.name ? " · " : "") +
      '<button class="btn btn-o" type="button" onclick="mySignOut()">로그아웃</button>' +
    '</p>') + '</div>';
  box.hidden = false;
  if(typeof window.myPhInit === "function") window.myPhInit();
  /* 2026-11-28 — '내 신청 보기'(?no=) 로 오셨으면 그 신청 상세로 데려가고 제목에 초점 */
  var rd = document.getElementById("myrd") || document.getElementById("my-nohit") || (nowQS("claim") && document.getElementById("my-claim"));
  if(rd && (nowQS("no") || nowQS("claim"))){
    try{ rd.scrollIntoView({ block:"start" }); }catch(e){}
    var h2 = document.getElementById("myrd-h"); if(h2){ try{ h2.focus({ preventScroll:true }); }catch(e){} }
  }
}

/* ── 로그인 칸 ───────────────────────────────────────────────────
   ⚠️⚠️ **2026-11-25 — 고객 로그인은 카카오 하나입니다.** 메일 로그인
   (주소 칸 · 링크 받기 단추 · 그 안내)을 고객 화면에서 뺐습니다.
   ⚠️⚠️ **카카오가 꺼져 있으면 이 칸 자체를 안 냅니다** — 메일로 넘어가는
   대체 길을 두지 않습니다 (작동하지 않는 단추를 만들지 않는 것과 같은 규칙).
   ⚠️ 관리자 로그인(`/admin`)과 `amAuthSend()` · `api/auth.js` 의 메일 길은
   **그대로**입니다 — 지우면 관리자가 못 들어옵니다. 견적 알림 메일과
   신청서의 이메일 칸도 그대로입니다. */
function MySignInBand(){
  /* 2026-11-28 — 카카오로 시작하기 + 한 줄. 로그인 뒤에는 지금 주소(?no= · ?claim= 포함)로 돌아옵니다 (amAuthKakao). */
  return '<div class="my-kk">'+
      '<button class="btn btn-lg my-kakao" type="button" onclick="myKakao()">'+icon("chat",18)+' 카카오로 시작하기</button>'+
      '<p class="f-h">견적 신청은 로그인 없이도 됩니다. 로그인하면 내 신청과 받은 견적을 볼 수 있습니다.</p>'+
      '<p class="my-in-n" id="my-kk-n" role="status"></p>'+
    '</div>';
}

/* 나가기 — ⚠️ 누르면 **이 브라우저에서는 반드시** 지웁니다 */
window.mySignOut = function(){
  if(typeof amAuthOut !== "function") return;
  amAuthOut().then(function(){ window.location.reload(); });
};

function myHd(k, h, p){
  return '<div class="sec-hd"><p class="eyebrow">'+esc(k)+'</p><h2>'+esc(h)+'</h2>'+
    (p ? '<p>'+esc(p)+'</p>' : '')+'</div>';
}

/* ── 고객 (§11-1) ───────────────────────────────────────────────── */
function MyCustBand(d){
  /* 최신순 (서버 차례를 믿지 않고 접수일로 한 번 더) */
  var L = (d.requests || []).slice().sort(function(a, b){ return String(b.created_at || "").localeCompare(String(a.created_at || "")); });
  /* 완료 화면의 '내 신청 보기'(?no=) 로 오셨으면 **그 신청을 맨 위에** 엽니다.
     ⚠️ 이 계정의 신청 목록(서버 · RLS 가 정한 것) 안에서만 찾습니다 — 번호만으로 남의 신청을 열지 않습니다. */
  var nk = function(x){ return String(x || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); };
  var want = nk(nowQS("no"));
  var hit = want ? L.filter(function(r){ return nk(r.no) === want; })[0] : null;
  return MyMeCard(d)+
    (hit ? MyReqDetail(hit, d)
         : want ? '<div class="notice-bad" id="my-nohit"><b>이 계정에서 그 접수번호를 찾지 못했어요.</b>'+
             '<p>로그인하기 전에 넣으신 신청이면 아래 \'이전 신청 가져오기\' 로 가져오실 수 있습니다.</p></div>' : '')+
    /* ⚠️⚠️ 신청이 0건이면 '내 신청' 구역째 없습니다 — 빈 카드 · 신청 권유를 깔지 않습니다 */
    (L.length ? '<div class="my-reqs"><h2 class="my-sh">내 신청</h2>'+MyReqRows(L, d, hit)+'</div>' : '')+
    MyClaimBand();
}
/* 내 정보 — 계정에 저장된 표시 이름(카카오 닉네임)만. 없는 칸을 빈칸으로 만들지 않습니다.
   ⚠️ 연락처는 계정 정보로 오지 않아 내지 않습니다(신청서의 번호를 계정 연락처처럼 쓰지 않습니다). */
function MyMeCard(d){
  var nm = String(d.name || "").trim();
  return '<div class="my-me"><h2 class="my-sh">내 정보</h2>'+
    '<div class="my-me-r">'+icon("user",18)+
      '<span class="my-me-n">'+(nm ? esc(nm) : '카카오 계정으로 로그인됨')+'</span>'+
      '<button class="my-out-b" type="button" onclick="mySignOut()">로그아웃</button>'+
    '</div></div>';
}
/* 내 신청 목록 — 서비스명 · 신청일 · 진행 상태. 접수번호 · 사진 · 견적은 상세에서.
   ⚠️ '견적 보기' 는 이 고객이 볼 수 있는 견적이 실제로 있을 때만 */
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

/* ── 로그인 전에 넣은 신청을 내 것으로 (2026-10-22 P1 ⑩ · §10) ──
   접수는 **로그인 없이** 들어오는 것이 맞습니다 — 견적 하나 받으려고
   가입하게 만들면 거기서 닫힙니다. 그래서 나중에 가입하신 분이
   **신청번호와 연락처로** 가져갑니다 (`claim_request` · 0005).

   ⚠️⚠️ **서버와 DB 는 2026-10-08 에 완성됐고 화면이 0 이었습니다** —
   `grep claim_request js/` 가 주석 한 줄만 맞혔습니다. 그래서 로그인
   전에 넣은 신청을 **영영 못 보는** 상태였습니다 (`amStore()` ·
   `gu` · `withEquip` · 푸터의 `stages` 와 같은 "만들어 놓고 안 쓰는
   칸" 입니다).

   ⚠️⚠️ **번호만으로는 안 됩니다.** 번호를 손에 넣은 사람이 남의
   성함 · 연락처 · 요청 내용을 다 봅니다 — **둘 다** 맞아야 합니다.
   ⚠️⚠️ **틀린 까닭을 갈라서 말하지 않습니다.** "그런 번호는 없습니다"
   와 "연락처가 다릅니다" 를 갈라 주면 번호가 있는지를 확인해 가며
   긁을 수 있습니다 — DB 가 **한 가지 말로만** 거절하고(검사가 둘이
   같은 말인지 봅니다) 화면은 **그 말을 그대로** 냅니다.
   ⚠️ 번호는 `SW` 머리까지 그대로 적으시면 되고, 줄표 · 띄어쓰기 ·
   소문자는 서버가 알아봅니다 (`reqNoClean()` 과 같은 규칙). */
function MyClaimBand(){
  /* ?claim=SW-… (완료 화면의 '로그인하고 이 신청 가져오기') 로 오셨으면 펴 두고 번호를 채워 둡니다.
     ⚠️ 휴대폰 번호는 채우지 않습니다 — 둘 다 맞아야 열리는 것이 본인 확인입니다. */
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
  /* ⚠️ 화면에서도 비었는지 봅니다 — `required` 는 폼 제출을 막아 주지만
     이 함수를 직접 부르면 그냥 지나갑니다 (이 저장소의 접수 폼과 같은
     규칙입니다). */
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
      /* ⚠️⚠️ **DB 가 거절한 그 말을 그대로** 냅니다 — 운영자 글을
         섞지 않습니다 (절대 규칙 3). 그 말은 틀린 까닭을 **가르지
         않습니다** (번호가 있는지를 긁을 수 없게). */
      if(note){ note.textContent = (x.j && x.j.error) || "가져오지 못했습니다";
                note.className = "my-in-n bad"; }
      return;
    }
    if(note){ note.textContent = "가져왔습니다. 아래 목록에 들어왔습니다.";
              note.className = "my-in-n ok"; }
    /* 2026-11-28 — 가져온 그 신청을 맨 위에 엽니다 (?no= · 번호는 이제 이 계정의 것입니다) */
    var got = String(no.value).trim().toUpperCase().replace(/\s/g, "");
    no.value = ""; tel.value = "";
    try{ history.replaceState(history.state, "", "/my?no=" + encodeURIComponent(got)); }catch(e){}
    /* ⚠️ 바뀐 뒤에는 **다시 묻습니다** (myqCall 과 같은 규칙) */
    window.myLoadDb();
  }).catch(function(e){
    if(btn){ btn.disabled = false; btn.textContent = "내 신청으로 가져오기"; }
    try{ console.warn("[my] claim_request — " + e); }catch(_){}
    if(note){ note.textContent = "연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요";
              note.className = "my-in-n bad"; }
  });
  return false;
};

/* ── 업체 대시보드 (§9-4) ────────────────────────────────────────
   ⚠️⚠️ **배정된 건만 옵니다.** 거르는 일은 화면이 아니라 DB 의 RLS
   (`request_assigned`)가 합니다 — 화면에 버그가 하나 생겨도 남의
   신청이 새지 않습니다.
   ⚠️ 그래서 여기 성함 · 연락처가 있는 것이 맞습니다. **배정이 곧
   제3자 제공이고 동의 시각이 `assignment.agree3rd_at` 에 남아
   있습니다** (제17조 제2항) — 배정 전에는 줄 자체가 안 옵니다. */
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

/* ── 내 업체 정보 (2026-10-22 오픈 전 전수검사 P2 ⑳) ──────────────
   > 감사 보고서 §5 ⑳ — "업체가 **스스로 등록 · 수정**하는 화면.
   >  지금은 직원이 /admin 9번 칸에서 적습니다."

   ⚠️⚠️ **고칠 수 있는 것과 못 하는 것을 그 자리에서 가릅니다.**
   소개 · 지역 · 시군구 · 업종 · 문 연 해 · 상담 시간은 업체 것이고,
   **상호 · 하는 일(분야) · 확인 배지 · 공개 여부 · 배정 가능**은
   승인 대상입니다 — 하는 일을 스스로 넓히면 철거만 하는 곳이 세무
   화면에 앉고(`amProviderInCat()`), 확인 배지를 스스로 켜면 그건
   지어낸 신뢰입니다 (절대 규칙 1 · 표시 · 광고의 공정화에 관한 법률
   제3조). 못 고치는 것도 **보여는 줍니다** — 안 보여 주면 "왜 안
   켜지나" 를 물으러 오시고, 그 답이 화면에 없습니다.

   ⚠️⚠️ **막는 것은 DB 입니다** (`save_provider_self()` 가 그 칸을
   아예 안 쓰고, 0014 가 표의 update 권한을 걷었습니다). 화면은
   거드는 것까지입니다 — 화면 코드로만 막으면 버그 하나에 뚫립니다. */
function MyPvSelf(d){
  var m = d.mine;
  /* ⚠️ 줄이 안 오면 **구간째 뺍니다** (절대 규칙 2). 업체 계정인데
     `provider_id` 가 안 꽂힌 경우라, 자리표시자를 찍는 대신
     배정받은 신청 쪽만 그립니다. */
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
      /* ⚠️⚠️ 이 줄을 지우지 마세요 — 왜 그 넷이 회색인지가 여기에만
         적혀 있습니다. 없으면 "칸이 고장났다" 로 읽힙니다. */
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
          /* ⚠️ "몇 년 했다" 는 **센 값**입니다 — 적는 칸이 아닙니다 */
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
      /* ⚠️⚠️ **손님에게 안 보입니다.** 저희 직원이 배정할 때 전화하는
         자리이고, `provider_contact` 는 고객 정책이 아예 없습니다. */
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
        /* ⚠️ 넷을 다 비우고 저장하면 줄째 지웁니다 (빈 줄을 안 남깁니다) */
        '<p class="f-h">넷을 다 비우고 저장하시면 담당자 칸을 '+
          '지웁니다.</p>'+
        '<p class="my-in-n" id="pvc-n" role="status"></p>'+
      '</form>'+
    '</div>';
}

/* 여러 개 고르는 칸에서 고른 것만 — ⚠️ `multiple` 은 `.value` 가
   **첫 하나**뿐입니다 (그대로 쓰면 지역이 늘 한 곳이 됩니다). */
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
  /* ⚠️ 쉼표로 적은 시군구 — 빈 토막을 버립니다 (빈 문자열을 보내면
     거르개에서 아무것도 안 걸리는 값이 하나 들어갑니다). */
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
  /* ⚠️ 꼴만 봅니다 — 보낼 수 있는지는 받는 쪽이 압니다 (DB 도 한 번 더) */
  if(mail && mail.indexOf("@") < 1){
    var n = document.getElementById("pvc-n");
    if(n){ n.textContent = "메일 주소를 확인해 주세요"; n.className = "my-in-n bad"; }
    return false;
  }
  myPvCall("save_provider_contact",
    /* ⚠️⚠️ 업체 id 를 보내지만 **DB 가 `my_provider()` 와 맞춰 봅니다** —
       요청이 보낸 값으로 남의 업체를 덮을 수 없습니다 (0014). */
    { p_provider:(MYQ.d && MYQ.d.mine && MYQ.d.mine.id) || "",
      p_data:{ name:g("pvc-name"), tel:g("pvc-tel"),
               email:mail, memo:g("pvc-memo") },
      p_why:"업체가 직접 적었습니다" },
    "pvc-n", ev, "담당자 저장");
  return false;
};

/* ⚠️⚠️ **거절한 말을 그대로** 냅니다 (절대 규칙 3 — 운영자 글을 섞지
   않습니다). 그리고 **적으신 것을 지우지 않습니다** — 실패했을 때
   비우면 다시 적어야 합니다. */
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
    /* ⚠️ `tel:` 은 폰에서 실제로 걸립니다 — 장식이 아닙니다. 숫자만
       남겨 거는 것은 `/admin` 영업 작업대와 같은 규칙입니다. */
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
      /* ⚠️⚠️ **견적을 내는 자리가 여기입니다** (§4). 전에는 상태만
         `quoted` 로 바뀌고 **금액이 아무 데도 안 남아서**, 고객은
         전화로 들은 금액을 기억해야 했습니다. */
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

/* ── 내 계약 · 수수료 ────────────────────────────────────────────
   ⚠️⚠️ **고객에게는 이 구간이 아예 없습니다** — 우리와 업체 사이의
   일인데 보여 주면 자기가 내는 돈으로 읽힙니다. `api/me.js` 가
   고객에게는 계약을 **묻지도 않습니다.**
   ⚠️ 수수료가 확정되기 전에는 그 줄을 아예 안 냅니다 (절대 규칙 2) —
   "0원" 은 "아직 확정 전" 과 다른 말입니다. */
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
    /* ⚠️ 수수료 정책은 계약마다 **사본**이 박혀 있습니다 — 요율을
       고쳐도 지난 계약의 수수료는 그대로입니다 (§9). */
    '<p class="sec-note">계약에 적용된 수수료는 그 계약을 맺을 때의 '+
      '정책으로 계산되어 그대로 남습니다.</p>'+
  '</div>';
}

/* ── 직원 · 관리자 작업대 (§11-2) ───────────────────────────────
   ⚠️⚠️ **모든 숫자는 서버에서 온 줄을 그 자리에서 센 값**입니다.
   저장해 둔 집계가 아니라서 손으로 고칠 자리가 없습니다 — 업체
   평점을 값으로 저장하지 않는 것과 같은 까닭입니다.
   ⚠️⚠️ **합계를 "전체" 라고 적지 마세요.** `api/me.js` 가 최근 것만
   가져옵니다 — 몇 건에서 센 값인지 화면이 밝힙니다.
   ⚠️ 목록에 성함 · 연락처가 없습니다 (`PICK.staff`). 전화하시려면
   건을 열어야 합니다 — 화면 하나가 곧 유출이 되지 않게요. */
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

  /* 계약 이후인가 — ⚠️⚠️ **`deal.js` 가 가릅니다** (`amDealAfterSign`).
     여기서 번호만 보고 잘랐다가 **보류(11)와 취소(10)가 계약으로
     집계**됐습니다 — 번호가 `signed`(8)보다 뒤인데 계약이 아닙니다.
     전환율이 조용히 부풀려지는 종류라 **찍어 보고** 알았습니다. */
  var deals = ST.filter(function(s){
      return typeof amDealAfterSign === "function" && amDealAfterSign(s.key); })
    .reduce(function(a, s){ return a + (n[s.key] || 0); }, 0);
  var side = { start:0, close:0 };
  L.forEach(function(r){ if(r.side === "close") side.close++; else side.start++; });

  return '<ul class="myk-g">'+ST.filter(function(s){
      /* 돈이 걸린 상태는 관리자 칸(아래)에서 금액과 같이 냅니다 */
      return !s.money;
    }).map(function(s){
      var c = n[s.key] || 0;
      return '<li class="myk'+(c ? "" : " myk-0")+'">'+
        '<b>'+c+'</b><span>'+esc(s.name)+'</span></li>';
    }).join("")+'</ul>'+
    '<dl class="myd-l myd-l3">'+
      '<div><dt>창업 쪽</dt><dd>'+side.start+'건</dd></div>'+
      '<div><dt>폐업·철거 쪽</dt><dd>'+side.close+'건</dd></div>'+
      /* ⚠️⚠️ **분모가 0 이면 비율을 안 냅니다** — "전환율 0%" 는 비율이
         아닙니다 (`/admin` 의 `slPct()` 와 같은 규칙). 여기는 위에서
         이미 0건을 걸러 냈으니 분모가 늘 1 이상입니다. */
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
  /* 미수금 — ⚠️⚠️ **확정된 건만** 셉니다. 확정 전인 건을 0 으로 더하면
     받을 돈이 없는 것처럼 읽힙니다 (§10 미수금 관리). */
  var due = DL.reduce(function(a, x){
    if(x.fee == null) return a;
    return a + Math.max(0, num(x.fee_total != null ? x.fee_total : x.fee) - num(x.paid));
  }, 0);
  /* 환수 — ⚠️⚠️ `deal` 이 아니라 **감사 기록**에서 옵니다. 확정했던 액을
     갈아 치우지 않고 차액을 적기 때문입니다 (0003 clawback_fee).
     ⚠️ 차액이 음수인 줄(올려 잡은 경우)은 환수가 아니라 더하지 않습니다. */
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
  /* ⚠️ 환수가 0 이면 줄째 뺍니다 — 없던 일을 "0원" 으로 적어 두면
     기록이 있는 것처럼 읽힙니다 (절대 규칙 2). */
  if(back > 0) rows.push(["환수 · 부분환불", won(back)+"원"]);

  return '<div class="my-next"><h2>수수료 · 정산</h2>'+
    '<dl class="myd-l myd-l3 myd-big">'+rows.map(function(a){
      return '<div><dt>'+esc(a[0])+'</dt><dd>'+esc(a[1])+'</dd></div>'; }).join("")+'</dl>'+
    '<p class="sec-note">수수료는 관리자가 증빙을 보고 확정한 것만, '+
      '정산 완료는 실제 입금이 확인된 것만 셉니다.</p>'+
  '</div>';
}

/* ⚠️ 상태 딱지 색은 `deal.js` 의 쓰임을 따릅니다 — 끝난 것(end)은 회색,
   돈(money)은 고객에게 안 옵니다, 보류는 **주의(warn)** 입니다.
   ⚠️⚠️ 보류를 실패와 같은 색으로 두지 마세요 — 멈춘 것과 접은 것은
   다른 일이고, 같은 색이면 사장님이 끝난 줄 압니다. */
/* ⚠️⚠️ **색을 여기 적지 않습니다.** `js/data/deal.js` 의 `amDealTone()`
   한 곳입니다 — `/admin` 의 접수 목록이 같은 딱지를 내므로, 여기 적어
   두면 두 화면이 같은 상태를 다른 색으로 냅니다. */
function myStTone(key){
  return (typeof amDealTone === "function") ? amDealTone(key) : "gray";
}

function MyReqList(L, d){
  return '<ul class="myq-l">'+L.map(function(r){
    /* ⚠️ 고객 화면이라 정산 상태(fee_*)는 '서비스 완료' 로 접습니다 */
    var cs = window.amCustSt ? amCustSt(r.state) : r.state;
    var st = (typeof amDealStName === "function") ? amDealStName(cs) : cs;
    var pv = (r.assignment && r.assignment.length && r.assignment[0].provider)
               ? r.assignment[0].provider.name : "";
    var cat = r.cat && typeof amCat === "function" ? amCat(r.cat) : null;
    /* 2026-11-26 모바일 시안 §12 — 실제로 받은 견적이 있을 때만 '견적 보기' (없으면 단추째 없음) */
    var nq = d ? myqOf(d, r.id).length : 0;
    /* 2026-11-28 — 고객 말 여섯 갈래 (amCustView · deal.js) — 상세와 같은 이름 */
    var cv = amCustView(r.state, nq);
    return '<li class="myq"><div class="myq-h">'+
        '<a class="myq-no" href="/my?no='+encodeURIComponent(r.no || "")+'">'+esc(r.no || "")+'</a>'+
        '<span class="myq-st myq-'+esc(cv.tone)+'">'+esc(cv.name)+'</span>'+
      '</div>'+
      '<p class="myq-m">'+myCond(r, cat)+'</p>'+
      /* ⚠️⚠️ 업체 상호는 **배정이 된 뒤에만** 나옵니다 — 그 전에 적으면
         정해지지도 않은 곳을 알려 주는 것입니다 (제17조 제2항). */
      (pv ? '<p class="myq-pv">'+icon("users",15)+'<small class="myq-lb">배정된 업체</small>'+esc(pv)+'</p>' : "")+
      (nq ? '<p class="myq-qgo"><a class="btn btn-o btn-sm" href="#myqt-'+esc(r.id)+'" onclick="return hhJump(\'myqt-'+esc(r.id)+'\')">'+icon("doc",15)+' 견적 보기 '+nq+'건</a></p>' : "")+
      /* 서비스가 둘 이상이면 서비스별 줄 — 비회원 조회와 같은 규칙 */
      ((r.request_item || []).length > 1
        ? '<ul class="my-lk-it myq-it">'+myReqItemsHtml(r.state, r.request_item)+'</ul>' : "")+
      /* ⚠️⚠️ **받은 견적을 여기에 냅니다** (§6). 신청 줄 안에 두는
         까닭은 "무슨 일의 견적인가" 가 바로 위에 있어야 하기
         때문입니다 — 따로 떼면 접수번호를 들고 두 목록을 왕복합니다. */
      (d ? MyQuoteCompare(d, r) : "")+
    '</li>'; }).join("")+'</ul>';
}

/* ════════════════════════════════════════════════════════════════════
   견적 — 업체가 내고 · 고객이 고릅니다 (0008 · 최종 통합 지시서 §4 · §6)

   ⚠️⚠️ **`/compare` 와 다른 화면입니다.** 그쪽은 **업체**를 나란히 놓고
   (분야 · 지역 · 배지), 여기는 **제출된 견적**을 나란히 놓습니다
   (금액 · 범위 · 기간 · A/S). 이름이 겹쳐서 "이미 있다" 로 읽히기 쉬운
   자리이고, 실제로 감사 보고서가 그렇게 세다가 1차의 가장 큰 일을
   통째로 빠뜨릴 뻔했습니다.

   ⚠️⚠️ **새 주소를 만들지 않았습니다.** `/my` 가 역할을 보고 다른 것을
   냅니다 — 로그인 전에는 구간째 안 보이니 `/quotes` 를 만들면 색인은
   되는데 들어가면 빈 화면인 주소가 하나 늘어납니다.
   ════════════════════════════════════════════════════════════════════ */

/* 그 신청의 견적만 — ⚠️ 거르는 일을 화면이 **또** 하지 않습니다.
   무엇이 오는지는 RLS 가 정하고(거둔 견적은 고객에게 아예 안 옵니다),
   여기서는 신청별로 나눠 담을 뿐입니다. */
function myqOf(d, rid){
  return (d.quotes || []).filter(function(q){ return q.request_id === rid; });
}

/* 한 견적의 값 줄 — ⚠️⚠️ **값이 없는 칸은 아예 안 넣습니다** (절대 규칙 2).
   CSS 로 숨기면 빈 상자가 칸 하나를 차지합니다 (매물 조건표에서 겪은
   자리). ⚠️ `0` 은 값입니다 — "무상 · 서비스" 를 0 으로 적을 수 있어서
   `!= null` 로 봅니다. */
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

/* 글로 적힌 것 — 범위 · 별도 · A/S · 메모.
   ⚠️⚠️ **업체가 적은 글입니다** — `esc()` 를 반드시 거칩니다 (절대 규칙 4). */
function myqText(q){
  var L = [["포함", q.scope], ["별도", q.excludes],
           ["A/S · 보증", q.warranty], ["메모", q.note]];
  return L.filter(function(r){ return r[1]; }).map(function(r){
    return '<p class="myq-b"><b>'+esc(r[0])+'</b> '+esc(String(r[1]))+'</p>';
  }).join("") +
  /* ⚠️⚠️ 0084 — 운영자가 업체에게 받아 적은 견적이면 그렇다고 밝힙니다.
     안 밝히면 업체가 직접 낸 견적으로 읽힙니다. */
  (q.src === "staff"
    ? '<p class="myq-b"><b>적은 사람</b> 운영자가 업체에게 받아 적은 견적입니다 (업체가 직접 낸 것이 아닙니다)</p>' : '');
}

/* ── 고객: 받은 견적을 나란히 (§6) ───────────────────────────────
   ⚠️⚠️ **금액순으로 줄 세우지 않습니다.** 포함 범위가 서로 달라서
   금액만으로는 견줄 수 없고, 줄을 세우면 그 순서가 곧 추천이 됩니다 —
   이 저장소가 `featured` 를 만들지 않는 것과 같은 까닭입니다
   (약관 제6조 제4항 · "최저가" 는 금지 문구).
   ⚠️ **"가장 저렴한" 딱지를 붙이지 마세요.** 범위가 적은 견적이 늘
   싸 보이고, 그걸 고른 사장님은 나중에 별도 비용을 또 냅니다. */
/* ── 2026-11-28 견적 카드 — 순서 통일: 업체명 → 총액 → 포함 작업 → 제외 · 추가 비용 → 가능 일정 → 실측 여부
   ⚠️⚠️ 빠진 값은 '업체 확인 필요' 입니다 — 미입력 금액을 0원으로, 모르는 부가세를 '포함' 으로 적지 않습니다.
   ⚠️ 여러 서비스 신청이면 **이 견적이 덮는 범위**를 밝힙니다 (전체철거만 vs 전체철거 · 원상복구).
   ⚠️ 업체가 적은 글은 esc() 를 거칩니다 (절대 규칙 4). */
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
  /* 총액 — 금액이 저장돼 있을 때만 숫자 · 부가세와 가견적/확정은 저장값 그대로 (없으면 확인 필요) */
  var amt = (q.amount != null) ? '<b class="myqc-amt">'+esc(won(q.amount))+'원</b>' : MYQ_ASK;
  var amtSub = [vatN || "부가세 업체 확인 필요", kindN || "가견적 · 확정 업체 확인 필요"].map(esc).join(" · ");
  /* 포함 작업 + 적용 범위 */
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

/* ── 2026-11-28 내 신청 상세 — 완료 화면 '내 신청 보기' 가 여는 자리 ─────────
   먼저 보이는 것: 신청한 서비스 · 지역 · 접수일 · 현재 상태 · 다음 단계. 그다음 견적.
   ⚠️ 이름 · 연락처 · 사진은 여기 안 냅니다 (서버가 고객에게 그 칸을 안 줍니다).
   ⚠️ '견적 도착' 은 **이 고객이 볼 수 있는 견적이 있을 때만** (amCustView).
   ⚠️ 신청 전체로 진행된 건은 서비스마다 따로 답한 것처럼 그리지 않습니다 — 항목에 제 기록이 있을 때만 서비스별 상태. */
function MyReqDetail(r, d){
  var L = myqOf(d, r.id);
  var cv = amCustView(r.state, L.length);
  var its = r.request_item || [];
  var svc = its.length ? its.map(function(i){ return myqSvcName(i.service_id); }).join(" · ")
          : (r.cat && typeof amCat === "function" && amCat(r.cat) ? amCat(r.cat).name : "잘 모르겠어요 — 상담 후 정하기");
  /* ⚠️ 지역은 key(gyeonggi) 로도 이름(경기) 으로도 저장돼 있습니다 — 이름을 못 찾으면 저장값 그대로 */
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
      /* ⚠️⚠️ 업체 상호는 **배정된 뒤에만** (제17조 제2항) — 서버가 배정된 줄만 줍니다 */
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

/* ── 2026-11-28 내 신청의 사진 — 저장됐는지 보고, 안 된 것은 다시 첨부 (SW-ZNF3-7W8E) ─────
   완료 화면을 닫으면 비로그인으로 접수하신 분은 사진을 다시 올릴 길이 없었습니다. 가져온 뒤
   (로그인 · 본인 확인) 여기서 다시 첨부합니다.
   ⚠️⚠️ 저장 여부는 **저장소가 답한 것**만 씁니다 (/api/upload?p= · 파일 없음은 missing).
   ⚠️ 파일이 없는 자리는 **그 자리를 다시 씁니다** (op:"mine" + photo) — 기록이 늘지 않습니다.
   ⚠️ 버킷이 꺼져 있으면 구역째 안 그립니다 (amPhotoWire 와 같은 규칙). */
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
/* 파일이 없는 자리 — 그 자리로 다시 첨부합니다 */
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
/* 새로 고른 사진 저장 — photo.js 의 같은 길(시간 제한 · 실패한 것만 다시 · 자리 재사용) */
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
        /* ⚠️ 이미 고른 뒤에는 단추를 아예 안 냅니다 — 누를 때마다
           거절당하는 단추를 만들지 않습니다 (§30-7). */
        (!got
          ? '<div class="row-cta"><button class="btn btn-b" type="button"'+
              ' onclick="myqPick(\''+esc(r.id)+'\',\''+esc(q.provider_id)+'\')"'+
              (MYQ.busy ? ' disabled' : '')+'>'+
              '이 견적으로 하겠습니다'+icon("check",16)+'</button></div>'
          : "")+
      '</li>';
    }).join("")+'</ul>'+
    /* ⚠️⚠️ **고른 것이 곧 계약이 아닙니다.** 조건을 더 맞춰 봐야 하는
       일이고, 계약은 업체와 적으신 뒤에 담당자가 기록합니다 — 여기서
       "계약되었습니다" 라고 하면 하지 않은 일을 했다고 말하는 것입니다. */
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

/* ── 업체: 견적을 냅니다 · 고칩니다 · 거둡니다 (§4) ───────────────
   ⚠️⚠️ **낼 수 있는 상태가 아니면 폼을 안 냅니다.** 배정을 수락한 뒤 ·
   상담을 시작한 뒤부터이고 계약 뒤에는 못 냅니다 — DB 가 거절하는 길에
   단추를 내면 누를 때마다 실패합니다 (§30-7).
   ⚠️ 막는 것은 여기가 아니라 `submit_quote()` 입니다. 여기는 **먼저
   알려 주는** 것까지입니다 (`/admin` 이 `amDealMove()` 를 먼저 보는 것과
   같은 규칙). */
var MYQ_OK = { consult:1, quoted:1, nego:1 };

function MyQuoteMine(d, r){
  var mine = myqOf(d, r.id)[0] || null;
  var can  = MYQ_OK[r.state] === 1;
  var open = MYQ.open === r.id;

  /* 아직 낼 수 없는 상태 — ⚠️ "준비 중" 을 찍지 않고 **무엇을 하면
     되는지**를 적습니다 (절대 규칙 2 · 3). */
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
  /* ⚠️⚠️ 고객이 고른 견적은 고칠 수도 거둘 수도 없습니다 — 고치면
     고객이 고른 것과 다른 금액이 되고, 그건 조용히 말을 바꾸는
     일입니다. DB 도 거절하므로 **단추를 아예 안 냅니다.** */
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

/* 적는 칸 — ⚠️ 폼 클래스는 이 저장소 것(`.f-r`)을 그대로 씁니다.
   새 이름을 지어내면 그 줄만 스타일이 안 먹고 에러도 안 납니다. */
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
    /* ⚠️ 날짜는 `date` 입니다 — 손으로 적게 하면 "다음달 초" 가
       들어오고 그건 일정이 아닙니다 (서비스별 질문에서 정한 규칙). */
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

/* ⚠️⚠️ **빈 칸을 보내지 않습니다** — `amDropEmpty()` 한 곳입니다.
   DB 에 저장되면 "안 적으신 것" 과 "비워 두신 것" 을 구분할 수가
   없습니다. ⚠️ `0` 은 값입니다 (무상 · 서비스). */
window.myqSend = function(rid){
  if(MYQ.busy) return;
  var d = MYQ.draft, mine = (MYQ.d ? myqOf(MYQ.d, rid)[0] : null) || {};
  var amt = d.amount !== undefined ? d.amount : mine.amount;
  var sc  = d.scope  !== undefined ? d.scope  : mine.scope;
  /* 먼저 알려 줍니다 — ⚠️ 자물쇠는 `submit_quote()` 입니다 */
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
  /* ⚠️ 되돌릴 수 없으니 한 번 물어봅니다 (localStorage 지우기와 같은 규칙) */
  if(typeof confirm === "function" &&
     !confirm("낸 견적을 거두시겠습니까? 고객 화면에서 사라집니다.")) return;
  MYQ.busy = true; myDbPaint();
  myqCall("withdraw_quote", { p_request:rid }, "견적을 거뒀습니다");
};

/* 한 곳에서 보냅니다 — ⚠️⚠️ **DB 가 거절한 그 말을 그대로** 냅니다.
   "상담을 시작한 뒤에 견적을 내 주세요" 처럼 **무엇을 하면 되는지**가
   거기 적혀 있습니다 (운영자 글은 섞지 않습니다 · 절대 규칙 3). */
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
    /* ⚠️ 바뀐 뒤에는 **다시 묻습니다.** 화면이 들고 있는 값으로
       추측하면 서버가 같이 바꾼 것(상태 · 다른 견적)을 못 봅니다. */
    window.myLoadDb();
  }).catch(function(e){
    MYQ.busy = false;
    try{ console.warn("[my] " + fn + " — " + e); }catch(_){}
    toast("연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요");
    myDbPaint();
  });
}

/* ════════════════════════════════════════════════════════════════════
   2026-11-28 대표 지시 — 고객 '내 계정' 화면 간소화
   기본 화면에 두는 것: 내 정보(계정의 표시 이름) · 로그아웃 · 내 신청(있을 때만).
   ⚠️⚠️ 빼기만 했습니다 — 브라우저 준비 기록(am.profile.v1) · 받은 제안(am.quotes.v1) ·
   저장한 업체(am.saved.v1) · 도구 숫자는 **지우지 않았고**, 그 함수도 그대로입니다
   (MyBrowserRecords · MySaved · MyTools · myClear). 다른 화면(업체 저장 단추 · /quote 비교 ·
   /tools)은 지금처럼 씁니다. 되살리려면 PageMy 끝에 MyBrowserRecords() 한 줄입니다.
   ⚠️ 업체 · 직원 · 관리자는 같은 주소에서 역할별 구간이 그대로 섭니다(myDbPaint).
   ⚠️ 상품 올리기(판매자 직접 진입)는 /my?v=product 그대로입니다 — 기본 화면에 단추만 뺐습니다.
   ════════════════════════════════════════════════════════════════════ */
function PageMy(){
  if(nowQS("v") === "product") return PageMyProduct();
  /* 예전 준비 기록 · 저장한 업체 · 도구 · 받은 제안 · 지우기 — 기본 화면에서 뺐고, 직접 주소로만 엽니다(링크 없음) */
  if(nowQS("v") === "records") return PgHero({ kicker:"MY", h1raw:"이 브라우저의 기록", tight:true })+MyBrowserRecords();
  return PgHero({ kicker:"MY", h1raw:"내 계정", tight:true })+
    MyDbBand()+
    /* 비회원 본인 확인 조회 — **열려 있을 때만** 섭니다 (닫힘 안내를 기본 화면에 깔지 않습니다) */
    MyLookupBand();
}
/* 예전 기본 화면의 '이 브라우저에 저장한 준비 기록' — 지금은 부르지 않습니다(위). 데이터는 그대로 남습니다. */
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
/* ⚠️ 되돌릴 수 없으므로 한 번 물어봅니다 */
window.myClear = function(){
  if(!confirm("이 브라우저에 남은 기록을 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(MKEY); amDel("am.quotes.v1"); amDel(window.AM_SAVE_KEY || "am.saved.v1");
  /* ⚠️⚠️ **도구에 적은 숫자도 같이 지웁니다.** 여기를 빠뜨리면
     "전부 지웁니다" 라고 해 놓고 계산기 숫자가 그대로 남습니다 —
     가게 컴퓨터는 여러 사람이 쓰므로 그게 그대로 남의 눈에 들어갑니다.
     ⚠️ 새 도구를 만들면 `AM_TOOLS` 에만 넣으면 여기도 같이 지워집니다.
     목록을 손으로 또 적지 마세요. */
  (window.AM_TOOLS || []).forEach(function(t){ amDel("am.tool." + t.key); });
  rerender(true);
};

/* ── 저장한 업체 (2026-10-05 V2 §13) ─────────────────────────────
   ⚠️⚠️ **이 화면의 설명이 "저장한 업체" 를 이미 약속하고 있었습니다** —
   기능은 없는 채로요. 하지 않은 일을 했다고 말한 자리라(절대 규칙 5)
   약속한 쪽을 만들었습니다.
   ⚠️ **담는 것은 업체 id 하나뿐**입니다. 성함 · 연락처는 안 담습니다.
   ⚠️ 내려간 업체는 조용히 빠집니다 — 없는 업체 이름을 들고 있으면
   눌렀을 때 404 입니다. */
function MySaved(){
  var ids = (window.amSaved ? amSaved() : []);
  var ps  = ids.map(function(id){ return amProvider(id); }).filter(Boolean);
  /* ⚠️ 내려간 업체는 기록에서도 지웁니다 — 안 지우면 영영 남습니다 */
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

/* ── 도구에 적어 두신 것 ──────────────────────────────────────────
   ⚠️ 도구를 만들어 놓고 MY 에 안 이으면, 사장님은 어디에 적었는지
   찾으러 돌아다니게 됩니다.
   ⚠️ **적은 값을 여기 그대로 찍지 않습니다.** 매출 · 인건비는 남이
   보면 안 되는 숫자입니다 — "적어 두셨습니다" 까지만 알리고 값은
   그 화면에서 보시게 합니다. */
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


/* ════════════════════════════════════════════════════════════════════
   W03 — 본인 확인 후 조회하는 신청 내역 (비회원)

   ⚠️⚠️ 접수번호 + 전화번호만으로는 열리지 않습니다 — 그 번호로 보낸 인증번호까지
      맞아야 30분짜리 확인이 나옵니다 (api/lookup.js · 0083).
   ⚠️ 적으신 접수번호 · 전화번호 · 인증번호를 저장하지 않습니다. 확인 토큰만
      **이 탭(sessionStorage)** 에 30분 둡니다 — 탭을 닫으면 사라집니다.
   ⚠️ 조회 결과에는 성함 · 연락처 · 적어 주신 원문이 없습니다 (서버가 안 보냅니다).
   ⚠️ 조회가 안 열려 있으면(운영 포함 · 문자 발송 수단 미정) 그 사실만 적습니다.
   ════════════════════════════════════════════════════════════════════ */
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
/* 서비스별 줄 — 비회원 조회와 회원 /my 가 같이 씁니다.
   ⚠️⚠️ 규칙은 js/data/deal.js 의 amReqItemsView() 한 곳입니다. 따로
   진행된 기록이 없는 항목(own:false)은 신청 전체 상태를 따라 보이고
   "함께 진행" 딱지가 붙습니다 — 계약까지 간 건에 "신청 접수" 가 남아
   전체 상태와 모순되던 자리입니다. */
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
  /* 맨 위 상태 — 서비스가 **따로 진행된 기록이 있으면** 그 셈(진행 중 ·
     완료 …)을, 없으면 **신청 전체 상태**(계약 완료 …)를 냅니다. 항목별로
     진행하면 신청 전체 상태가 뒤처질 수 있고, 신청 단위로 진행하면
     항목 상태가 'new' 에 머뭅니다 — 둘 중 실제로 움직인 쪽을 믿습니다. */
  var head = !d.state ? "" : (tl.rec ? (LK_PHASE[tl.phase] || "") : (window.amDealStName ? amDealStName(cs) : ""));
  var items = myReqItemsHtml(d.state, d.items);
  var notes = (d.notes || []).map(function(n){
    return '<li><em>'+esc(myLkKst(n.at))+'</em><p>'+esc(n.body)+'</p></li>';
  }).join("");
  return '<div class="my-lk-v" data-lk="view">'+
    '<p class="my-lk-no">접수번호 <b>'+esc(d.no)+'</b>'+(d.created_at ? ' · 접수일 '+esc(myLkKst(d.created_at)) : '')+'</p>'+
    /* ⚠️⚠️ 맨 위는 **신청 전체 상태**입니다 (d.state). 서비스 항목의
       상태만 모은 rollup 을 쓰면 신청 단위로 계약까지 간 건이
       "진행 중" 으로 보입니다. state 가 없는 옛 응답일 때만 rollup. */
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
/* 화면을 그린 뒤 — 조회가 열려 있으면 폼을, 이 탭에 남은 확인이 있으면 바로 결과를 */
window.myLkInit = function(){
  if(typeof window.amAuthAsk !== "function") return;
  window.amAuthAsk().then(function(a){
    /* 2026-11-28 — 열리지 않았거나 로그인한 고객이면 구역째 숨깁니다 (닫힘 안내를 기본 화면에 깔지 않습니다) */
    var sec = document.getElementById("my-lk-sec");
    if(!a || !a.lookup || a.signedIn){ if(sec) sec.hidden = true; myLkDraw(); return; }
    if(sec) sec.hidden = false;
    var saved = null;
    try{ saved = JSON.parse(sessionStorage.getItem(LK_TOK) || "null"); }catch(_){}
    if(saved && saved.t && saved.until > Date.now()){ myLkDraw(); myLkRead(saved.t); }
    else { try{ sessionStorage.removeItem(LK_TOK); }catch(_){} myLkDraw(); }
  });
};

/* 2026-11-18 카카오로 시작하기 */
window.myKakao = function(){
  var n = document.getElementById("my-kk-n");
  if(typeof amAuthKakao !== "function") return;
  if(n){ n.textContent = "카카오로 이동합니다…"; n.className = "my-in-n"; }
  amAuthKakao().then(function(r){
    if(!r.ok && n){ n.textContent = r.say; n.className = "my-in-n bad"; }
  });
};

/* ═════════════════════════════════════════════════════════════════
   2026-11-27 대표 지시 — **상품 올리기** (세 화면 시안의 셋째) · /my?v=product[&id=]

   순서  상품 사진 → 상품명 → 카테고리 → 판매 가격 → 상품 설명
         → 추가 정보(선택 · 접힘: 배송 · 수령 조건) → 상품 등록하기

   ⚠️⚠️ **주인은 로그인한 계정입니다** — 서버(api/product.js)와 DB 의 문(save_product)이
   토큰의 계정으로 정하고, 남의 상품은 고칠 수 없습니다. 화면은 주인 칸을 보내지 않습니다.
   ⚠️⚠️ **올려도 바로 공개되지 않습니다** — '검수 대기' 이고 공개는 운영자가 합니다.
   ⚠️⚠️ **적기 전에 닫힘을 말합니다** — 준비가 안 됐거나(표가 없는 DB) 로그인 전이면
   칸이 잠긴 채 그 까닭이 맨 위에 섭니다 (적고 나서 실패하지 않게).
   ⚠️ 한 번 저장하면 그 상품 id 를 들고 있어서, 다시 누르셔도 **새 상품이 또 생기지
   않습니다** (고치기로 갑니다). 사진은 실패한 것만 다시 올립니다. */
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
/* 이미 올린 사진 — 기존 저장분은 그대로 보여 드리고 한 장씩 뺄 수 있습니다 */
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
  /* 화면과 서버가 같은 규칙 — 상품명 · 카테고리 (가격은 비우면 협의) */
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
      /* ⚠️ 다시 누르셔도 새 상품이 생기지 않게 id 를 들고 있습니다 */
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

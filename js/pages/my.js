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
  pre.then(function(){
    hd = (typeof amAuthHeaders === "function") ? amAuthHeaders() : {};
    return fetch("/api/me", { headers: Object.assign(
      { "accept":"application/json" }, hd) });
  })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      /* ⚠️ 설정은 됐는데 아직 로그인 안 하셨으면 **로그인 칸**을 냅니다.
         설정 자체가 꺼져 있으면(`auth:false`) 구간째 없습니다 —
         작동하지 않는 단추를 만들지 않습니다 (§30-7). */
      if(d && d.auth && !d.signedIn){
        box.innerHTML = '<div class="w">' + MySignInBand() + '</div>';
        box.hidden = false;
        return;
      }
      if(!d || !d.auth || !d.signedIn) return;
      /* ⚠️⚠️ **역할은 서버가 토큰으로 읽어 온 값**입니다 (`api/_auth.js`).
         화면이 고르는 것이 아니고, 여기서 고른다고 보이는 줄이 늘지도
         않습니다 — 무엇이 오는지는 RLS 와 `api/me.js` 의 칸 목록이
         정합니다. 여기서 하는 일은 **온 것을 어떻게 보여 줄지**까지입니다. */
      myDbPaint(d);
    })
    .catch(function(e){ console.warn("[my] 신청 내역을 못 불러왔습니다 — " + e); });
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
    '<p class="my-out">' + esc(d.name || "") +
      (d.name ? " · " : "") +
      '<button class="btn btn-o" type="button" onclick="mySignOut()">나가기</button>' +
    '</p></div>';
  box.hidden = false;
}

/* ── 로그인 칸 ───────────────────────────────────────────────────
   ⚠️⚠️ **비밀번호를 받지 않습니다.** 매직링크 하나입니다 — 손님이
   40~60대 사장님이라 "메일로 온 링크를 누르면 끝" 이 제일 적게
   막히고, 비밀번호를 받는 순간 저장 · 재설정 · 유출 대비가 전부
   따라옵니다.
   ⚠️ **지킬 수 없는 약속을 적지 마세요.** "바로 로그인됩니다" 가
   아니라 메일이 가는 데까지가 우리가 아는 전부입니다. */
function MySignInBand(){
  return myHd("MY", "로그인하고 신청 내역 보기",
    "메일 주소를 적으시면 로그인 링크를 보내 드립니다. 비밀번호는 없습니다.")+
    /* ⚠️ 폼 클래스는 이 저장소 것을 그대로 씁니다 — `.f-r` 과 맨
       `<input type=email>` 입니다. 새 이름을 지어내면 그 줄만 스타일이
       안 먹고 에러도 안 납니다 (`.f-i` · `.f-l` 로 한 번 겪었습니다). */
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
    no.value = ""; tel.value = "";
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
  return [ (r.side === "close" ? "폐업 · 정리" : "창업"),
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
      '<div><dt>폐업 · 정리 쪽</dt><dd>'+side.close+'건</dd></div>'+
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
    var st = (typeof amDealStName === "function") ? amDealStName(r.state) : r.state;
    var pv = (r.assignment && r.assignment.length && r.assignment[0].provider)
               ? r.assignment[0].provider.name : "";
    var cat = r.cat && typeof amCat === "function" ? amCat(r.cat) : null;
    return '<li class="myq"><div class="myq-h">'+
        '<b class="myq-no">'+esc(r.no || "")+'</b>'+
        '<span class="myq-st myq-'+esc(myStTone(r.state))+'">'+esc(st)+'</span>'+
      '</div>'+
      '<p class="myq-m">'+myCond(r, cat)+'</p>'+
      /* ⚠️⚠️ 업체 상호는 **배정이 된 뒤에만** 나옵니다 — 그 전에 적으면
         정해지지도 않은 곳을 알려 주는 것입니다 (제17조 제2항). */
      (pv ? '<p class="myq-pv">'+icon("users",15)+esc(pv)+'</p>' : "")+
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
function myqSpecs(q, side){
  /* ⚠️ 이름은 `amQuoteLabels()` 한 곳입니다 — 중고폰 입찰은
     "견적 금액" 이 아니라 "매입 금액", "시작 가능" 이 아니라
     "수거 가능" 입니다. */
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

/* 글로 적힌 것 — 범위 · 별도 · A/S · 메모.
   ⚠️⚠️ **업체가 적은 글입니다** — `esc()` 를 반드시 거칩니다 (절대 규칙 4). */
function myqText(q, side){
  /* ⚠️ 이름은 `amQuoteLabels()` 한 곳입니다 (`js/data/deal.js`) —
     중고폰 입찰은 "A/S" 가 아니라 "검수 기준" 입니다. */
  var N = (typeof amQuoteLabels === "function") ? amQuoteLabels(side) : {};
  var L = [[N.scopeRow || "포함", q.scope], [N.exRow || "별도", q.excludes],
           [N.wsRow || "A/S · 보증", q.warranty], ["메모", q.note]];
  return L.filter(function(r){ return r[1]; }).map(function(r){
    return '<p class="myq-b"><b>'+esc(r[0])+'</b> '+esc(String(r[1]))+'</p>';
  }).join("");
}

/* ── 고객: 받은 견적을 나란히 (§6) ───────────────────────────────
   ⚠️⚠️ **금액순으로 줄 세우지 않습니다.** 포함 범위가 서로 달라서
   금액만으로는 견줄 수 없고, 줄을 세우면 그 순서가 곧 추천이 됩니다 —
   이 저장소가 `featured` 를 만들지 않는 것과 같은 까닭입니다
   (약관 제6조 제4항 · "최저가" 는 금지 문구).
   ⚠️ **"가장 저렴한" 딱지를 붙이지 마세요.** 범위가 적은 견적이 늘
   싸 보이고, 그걸 고른 사장님은 나중에 별도 비용을 또 냅니다. */
function MyQuoteCompare(d, r){
  var L = myqOf(d, r.id);
  if(!L.length) return "";
  var got = L.filter(function(q){ return q.state === "chosen"; })[0];
  return '<div class="myqt">'+
    '<p class="myqt-h">'+icon("doc",15)+'받은 견적 '+L.length+'건'+
      (got ? '' : ' <i>— 하나를 고르시면 업체에 전달됩니다</i>')+'</p>'+
    '<ul class="myqt-l">'+L.map(function(q){
      var pv = (q.provider && q.provider.name) || q.provider_id;
      /* ⚠️⚠️ **누구와 거래하는지 밝힙니다** (0021 · §10). 폰웨이 자신이
         낸 입찰과 제휴 매입업체가 낸 입찰이 구분 없이 섞여 있으면,
         손님은 저희가 **중개자인지 당사자인지** 모르는 채로 고릅니다 —
         전자상거래법 제20조 제1항이 미리 고지하라고 정한 그 구분입니다.
         ⚠️ 딱지는 **DB 가 켜 준 것만** 냅니다 (관리자 전용 문) — 이름을
         보고 짐작하지 않습니다 (절대 규칙 1). */
      var ih = !!(q.provider && q.provider.inhouse);
      var tone = (typeof amQuoteTone === "function") ? amQuoteTone(q.state) : "gray";
      return '<li class="myqt-c'+(q.state === "chosen" ? " is-got" : "")+'">'+
        '<div class="myq-h">'+
          /* ⚠️⚠️ **업체 이름을 제 태그로 감쌉니다** (`.myqt-nm`).
             `.myqt-pv` 는 칩이 붙으면서 flex 가 됐는데, 맨글로 두면
             ① 이름이 flex 항목이 되어 (이 저장소가 grid · flex 로
             다섯 번 겪은 자리) ② `.myqt-pv` 의 글을 읽는 쪽이
             **이름 + 칩**을 같이 읽습니다 — "등록된 차례로 냅니다"
             검사가 그래서 떨어졌습니다. 이름만 읽을 자리를 둡니다. */
          '<b class="myqt-pv"><span class="myqt-nm">'+esc(pv)+'</span>'+
            '<i class="myqt-who'+(ih ? " is-ih" : "")+'">'+
              (ih ? "직접 매입" : "제휴 매입업체")+'</i></b>'+
          '<span class="myq-st myq-'+esc(tone)+'">'+
            esc((typeof amQuoteName === "function") ? amQuoteName(q.state) : q.state)+
          '</span>'+
        '</div>'+
        myqSpecs(q, r && r.side)+myqText(q, r && r.side)+
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
        myqSpecs(mine, r && r.side)+myqText(mine, r && r.side)
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
  /* ⚠️⚠️ **칸 이름이 쪽마다 다릅니다** (2026-10-29 PHONEWAY).
     중고폰 입찰은 업체가 **사 가며 주는** 돈이라 "시작 가능일" 이
     아니라 "수거 가능일" 이고 "A/S" 가 아니라 "검수 기준" 입니다.
     `amQuoteLabels()` 한 곳에서 옵니다 — 여기 손으로 적지 마세요. */
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
    /* ⚠️ 날짜는 `date` 입니다 — 손으로 적게 하면 "다음달 초" 가
       들어오고 그건 일정이 아닙니다 (서비스별 질문에서 정한 규칙). */
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

/* 폰웨이 쪽 — ⚠️⚠️ **내 기록의 첫 화면이 창업 고르개였습니다.**
   중고폰을 팔러 오신 분이 헤더의 `내 기록` 을 누르면 상황 · 업종 ·
   평수부터 물었습니다 — 남의 질문입니다. 지금은 이 띠가 먼저이고
   창업 · 폐업 기록은 아래에 **접혀** 있습니다 (지운 것이 아닙니다 —
   157개 화면이 아직 살아 있고 0단계 ① 은 사장님이 정하실 일입니다).
   ⚠️ 지어낸 숫자를 내지 않습니다 — 진행 중인 건수는 서버에 물어야
   아는 값이고, 로그인 전에는 그 길이 없습니다. 가는 길만 냅니다. */
function MyPwBand(){
  var L = [
    /* ⚠️⚠️ **`iconArt()` 에 없는 이름을 적지 마세요** — 빈 문자열을
       돌려줘서 타일이 덩그러니 빕니다 (에러도 404 도 안 납니다).
       `search` 를 적었다가 찍어 보고 알았습니다. `contract` 는
       서류 · 진행이라 "어디까지 왔나" 에 맞습니다. */
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
  var p = amGet(MKEY, { side:"", industry:"", region:"", gu:"", pyeong:"", dday:"" });
  var qs = amGet("am.quotes.v1", []);
  var ind = p.industry ? amIndustry(p.industry) : null;

  return PgHero({
    kicker:"MY",
    /* ⚠️⚠️ 안 고르신 분께 **"어느 쪽이세요"** 로 묻지 않습니다 — 중고폰을
       팔러 오신 분께는 창업이냐 폐업이냐가 남의 질문입니다 (헤더
       메뉴 이름과 같은 **내 기록**입니다). 고르신 분께는 그대로. */
    h1raw: p.side === "close" ? "내 폐업" : (p.side === "start" ? "내 창업" : "내 기록"),
    lead:"이 브라우저에만 남습니다. 서버로 보내지 않습니다.",
    tight:true
  })+
  /* ⚠️⚠️ §11-1 — 로그인이 설정되면 **여기에 신청 내역이
     섭니다.** 지금은 `/api/session` 이 `auth:false` 라 구간이 빈 채로
     숨어 있고 화면에는 아무것도 안 보입니다 — "로그인" 단추도
     "준비 중" 자리표시도 만들지 않습니다 (§30-7 · 절대 규칙 2 · 5).
     ⚠️ 위의 상황 · 업종 칸은 **이 브라우저 안**에만 남는 것이고,
     이 구간은 **서버에 저장된 신청**입니다 — 둘은 다릅니다. */
  MyDbBand()+
  MyPwBand()+
  '<section class="sec sec-white"><div class="w">'+
    /* ⚠️⚠️ **창업 · 폐업 기록 칸을 2026-10-31 에 내렸습니다** (사장님
       지시 — "인수인계 자료들은 다 지워줘"). 전에는 `<details
       class="my-biz">` 로 **접어** 두었는데, 접혀 있어도 "창업 · 폐업
       기록" 이라는 **요약 줄이 화면에 보입니다** — 화면에서 내리는
       것이 범위라 통째로 뺐습니다.

       그 칸이 들고 있던 것 — 상황 · 업종 · 지역 · 평수 고르개 ·
       업종별 분류 카드 · `MySaved()`(저장한 업체) · `MyTools()`(계산기에
       적은 숫자) · 받은 제안.

       ⚠️⚠️ **같은 날 그 함수들도 지웠습니다** (사장님이 범위를 "그냥 다
       지워" 로 넓히셨습니다). 되살리시려면 `git show 6d85a17:js/pages/my.js`
       의 이 자리를 그대로 가져오고, 그날 `vercel.json` 의 redirect 와
       `js/app.js` 의 라우터도 같이 되돌리세요.

       ⚠️ **이 브라우저에 남아 있던 값은 아래 단추가 지웁니다** — 칸만
       빼고 값을 남겨 두면 지울 길이 없어집니다. */
    /* ⚠️⚠️ **이 단추는 지우지 마세요.** 창업 · 폐업 칸을 내린 뒤에도
       **전에 쓰시던 값이 이 브라우저에 그대로 남아 있습니다** (상황 ·
       업종 · 지역 · 평수 · 저장한 업체 · 계산기 숫자 · 받은 제안) —
       칸만 빼고 단추를 없애면 그 값을 지울 길이 아예 없어집니다.
       ⚠️ 가게 컴퓨터는 여러 사람이 씁니다. */
    '<h2>이 브라우저에 남은 기록</h2>'+
    '<p class="lead">고르신 기기 · 적어 두신 숫자 · 앞서 쓰시던 기록이 '+
      '<b>이 브라우저 안에만</b> 남아 있습니다. 저희 서버로는 보내지 않습니다.</p>'+
    '<div class="row-cta"><button class="btn btn-o" type="button" onclick="myClear()">'+
      '내 기록 전부 지우기</button></div>'+
  '</div></section>';
}

/* ⚠️ 되돌릴 수 없으므로 한 번 물어봅니다 */
window.myClear = function(){
  if(!confirm("이 브라우저에 남은 기록을 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(MKEY); amDel("am.quotes.v1"); amDel(window.AM_SAVE_KEY || "am.saved.v1");
  /* ⚠️⚠️ **계산기에 적어 두신 숫자도 같이 지웁니다.** 여기를 빠뜨리면
     "전부 지웁니다" 라고 해 놓고 매출 · 인건비가 그대로 남습니다 —
     가게 컴퓨터는 여러 사람이 쓰므로 그게 그대로 남의 눈에 들어갑니다.
     ⚠️⚠️ **목록을 돌지 않고 머리말로 훑습니다.** 전에는 `AM_TOOLS` 를
     돌았는데, 그 데이터가 인수인계와 같이 내려가면 **지울 길이 조용히
     없어집니다** — 앞서 쓰시던 분의 브라우저에는 값이 그대로 남아
     있습니다. ⚠️ 지우면서 돌면 자리가 밀립니다 — 먼저 모읍니다. */
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

/* ⚠️⚠️ **2026-10-31 — 이 파일에서 인수인계 덩이 셋을 지웠습니다.**
   `MySaved()`(저장한 업체) · `MyTools()`(계산기에 적은 숫자) ·
   `myPut()`(상황 · 업종 · 지역 · 평수 칸을 담는 것)이 거기 있었습니다.
   ⚠️ 셋을 부르는 자리가 이미 없어졌고(창업 · 폐업 기록 칸이 화면에서
   내려갔습니다), 그 셋이 보내던 `/providers` · `/tools` 는 308 로 `/` 에
   갑니다 — 남겨 두면 안 열리는 주소로 보내는 단추만 늘어납니다.
   ⚠️ 꺼내 보시려면 `git show 6d85a17:js/pages/my.js`. */

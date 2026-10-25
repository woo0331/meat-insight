/* ════════════════════════════════════════════════════════════════════
   /admin — 신규 신청 목록 · 상담 상태 변경 · 업체 수동 배정

   2026-10-11 전면 감사 지시서 §6 의 여덟 가지 중 **넷**입니다 —
   ① 신규 신청 목록  ② 상담 상태 변경  ③ 업체 수동 배정
   ④ 신청 · 변경 이력(감사 기록은 DB 가 스스로 남깁니다)

   ⚠️⚠️ **이 화면이 생긴 까닭.** 감사 보고서의 머리 발견이 그것이었습니다 —
   `api/deal.js` 와 `move_state()` 가 **아무 화면에서도 안 불리고**
   있었습니다. 상태를 바꾸는 문이 서버에 다 서 있는데 **누를 자리가
   없어서**, 접수가 들어와도 `new` 에서 영원히 멈췄습니다. 이 저장소가
   `amStore()` · `gu` · `withEquip` · 푸터의 `stages` 로 여러 번 겪은
   "만들어 놓고 안 쓰는 칸" 의 제일 비싼 판이었습니다.

   ⚠️⚠️ **DB 가 서기 전에는 한 픽셀도 안 그립니다.** `/api/session` 이
   `auth:false` 면 구간째 안 나옵니다 — "로그인" 단추도 · "준비 중" 도
   안 만듭니다 (§30-7 "클릭해도 작동하지 않는 버튼" · 절대 규칙 2).

   ⚠️⚠️ **목록에 성함 · 연락처가 없습니다.** `api/me.js` 의 `PICK.staff`
   가 그 칸을 애초에 안 가져옵니다 — 전화하려면 건을 열어야 합니다.
   목록 하나가 곧 유출인 자리입니다 (개인정보보호법 제3조 제1항).

   ⚠️⚠️ **상태를 직접 쓰지 않습니다.** `/api/deal` → `move_state()` 하나만
   부릅니다. 그 문이 §8 을 기계로 지킵니다 — 갈 수 없는 길 · 역할 ·
   같이 적어야 하는 것 · 변경자 · 제17조 재동의. **기록과 상태 변경이
   한 트랜잭션**이라 기록 없이 지나갈 길이 없습니다.

   ⚠️ **돈 쪽(정산 대기 · 정산 완료)은 여기서 안 바꿥니다.** `move_state()`
   가 스스로 거절합니다 ("confirm_fee() · mark_paid() 로만") — 그래서
   그 길은 **단추를 아예 안 냅니다.** 누르면 늘 실패하는 단추를 두는 것이
   §30-7 입니다.
   ════════════════════════════════════════════════════════════════════ */

/* ⚠️⚠️ **적으신 것을 `RQ.ctx` 에 들고 있습니다.** 처음에 칸을 그냥
   `<select>` · `<textarea>` 로 두었다가, 거절당해서 다시 그릴 때
   **고른 업체가 조용히 빈 칸으로 돌아갔습니다** — 동의를 켜고 다시
   누르면 업체 없이 나가는 꼴이었습니다 (검사가 잡았습니다). 다시
   그려도 살아남아야 하니 상태로 들고, 칸은 그 값을 되읽습니다. */
var RQ = { asked:false, on:false, signedIn:false, role:"", name:"",
           rows:null, provs:[], fil:"", open:"", to:"", busy:false,
           ctx:{},
           /* 2차 — 계약 · 수수료 정책 · 한 건의 이력 */
           deals:[], fees:[], hist:null, histOf:"", money:"", mctx:{},
           /* 2026-10-17 §7 — 펼친 **서비스 항목**과 거기 적은 것.
              ⚠️ `ctx`(신청 전체)와 **갈라 둡니다** — 섞으면 항목을
              배정하다 만 값이 신청 전체 배정에 실려 나갑니다. */
           itemOf:"", ictx:{} ,
           /* 2026-10-22 오픈 전 전수검사 P2 ⑲㉑ — 고르개의 검색말과
              "무엇에 맞는 업체인가"(조건). ⚠️⚠️ **고르개마다 따로**
              입니다 — 신청 전체 고르개와 서비스 항목 고르개가 한
              화면에 같이 서는데, 한 칸으로 두면 한쪽에 친 말이
              다른 쪽까지 거릅니다 (`ctx` ↔ `ictx` 와 같은 까닭).
              ⚠️ 아무 데도 저장하지 않습니다 — 화면을 떠나면 사라집니다. */
           pvq:{}, pvw:{},
           /* 2026-10-22 오픈 전 전수검사 P0 ③⑤ — 담당자와 연락처.
              ⚠️⚠️ **연락처는 열어 본 건 하나만** 들고 있습니다
              (`conOf`). 쉰 건을 들고 있으면 화면 하나가 곧 유출이고,
              열 때마다 열람 이력이 남는 뜻도 없어집니다. */
           staff:[], mine:false, conOf:"", con:null, conBusy:false,
           /* 2026-10-22 전수검사 P1 ⑬⑭ — 업체 담당자와 기간별 정산.
              ⚠️ `pvOf` 는 담당자 칸을 **펼친 업체 하나**입니다 —
              스물을 한꺼번에 펼쳐 두면 직통 번호가 한 화면에 깔립니다. */
           contacts:[], settles:[], pvOf:"", pctx:{}, sctx:{},
           /* 2026-10-25 진단 P1-7 — `/join` 입점 신청.
              ⚠️ `apOf` 는 **펼친 신청 하나**입니다 — 쉰 건의 담당자
              번호를 한 화면에 깔지 않습니다 (`pvOf` 와 같은 선). */
           applies:[], apOf:"", actx:{} };

/* ── 그리기 ──────────────────────────────────────────────────────── */

function rqDraw(){
  var root = $("rq");
  if(!root) return;

  /* ⚠️⚠️ 로그인이 설정되기 전에는 **아무것도** 안 그립니다 */
  if(!RQ.asked || !RQ.on){ root.innerHTML = ""; return; }

  /* ⚠️⚠️ **구간마다 제 클래스(`rq-s-*`)를 답니다.** 넷이 전부 `#rq`
     안에 있고 줄도 `.rq-r` 로 같아서, 이름이 없으면 검사가 **어느
     구간의 줄인지 못 가립니다** — 실제로 구간을 늘리자마자 1차 검사
     둘이 접수 줄 대신 업체 줄까지 세어 틀렸습니다. 이 저장소가
     "검사가 nth-child 로 구간을 세다가 조용히 엉뚱한 구간을 봤다"
     로 겪은 자리입니다. 지우지 마세요.
     ⚠️⚠️ 구간마다 **스스로 역할을 봅니다** (`""` 를 돌려줍니다) —
     여기서 역할을 또 보면 같은 규칙이 두 곳에 적히고, 한쪽만 고치는
     날이 옵니다. ⚠️ 무엇이 보이는가를 정하는 것은 화면이 아니라
     **RLS 와 `api/me.js` 의 칸 목록**입니다 — 화면은 온 것을 냅니다. */
  root.innerHTML =
    '<section class="ad-s rq-s rq-s-rq">'+
      '<h2>접수 · 배정</h2>'+
      rqBody()+
    '</section>'+
    (RQ.signedIn ? rqMoney() + rqFees() + rqSettles() + rqApplies() + rqProvs() : "");
}

function rqBody(){
  if(!RQ.signedIn) return rqSignIn();
  if(RQ.role !== "staff" && RQ.role !== "admin") return rqNoRole();
  return rqList();
}

/* ── 로그인 (매직링크) ───────────────────────────────────────────
   ⚠️ 비밀번호를 받지 않습니다 — 받으면 저장 · 재설정 · 유출 대비가
   전부 따라옵니다. 메일로 온 링크를 누르면 끝입니다. */
function rqSignIn(){
  return '<p class="ad-lead">접수를 보려면 <b>로그인</b>하셔야 합니다. '+
      '비밀번호는 받지 않습니다 — 적어 주신 메일로 <b>한 번 쓰는 링크</b>를 '+
      '보내 드리고, 그 링크를 누르면 들어옵니다.</p>'+
    '<form class="rq-in" onsubmit="return rqSend(event)">'+
      '<div class="f-r">'+
        '<label for="rq-em">메일 주소</label>'+
        '<div class="rq-in-r">'+
          '<input id="rq-em" type="email" required autocomplete="email" '+
            'placeholder="name@example.com">'+
          '<button class="btn btn-b" type="submit">'+icon("mail",18)+'링크 받기</button>'+
        '</div>'+
        '<p class="f-h">받은 편지함에 안 보이면 스팸함도 보세요.</p>'+
      '</div>'+
      '<p class="rq-in-n" id="rq-em-n"></p>'+
    '</form>';
}

window.rqSend = function(ev){
  if(ev && ev.preventDefault) ev.preventDefault();
  var el = $("rq-em"), n = $("rq-em-n");
  if(!el) return false;
  if(n){ n.className = "rq-in-n"; n.textContent = "보내는 중…"; }
  window.amAuthSend(el.value).then(function(r){
    if(!n) return;
    n.className = "rq-in-n " + (r.ok ? "ok" : "bad");
    n.textContent = r.say;
  });
  return false;
};

/* ── 역할이 모자랄 때 ────────────────────────────────────────────
   ⚠️ 여기는 운영자 화면이라 **무엇을 해야 하는지**를 그대로 적습니다
   (절대 규칙 3 은 손님 화면에 대한 것입니다).
   ⚠️⚠️ **역할을 화면에서 올릴 수 있게 만들지 않았습니다.** 올리는 길이
   화면에 있으면 누구나 관리자가 됩니다 — SQL 로만 올립니다. */
function rqNoRole(){
  return '<div class="notice-bad">'+
      '<b>이 계정에는 접수를 볼 권한이 없습니다</b>'+
      '<p>지금 역할은 <b>'+esc(window.amRoleName ? amRoleName(RQ.role) : RQ.role)+
      '</b> 입니다. 가입하면 누구나 <b>고객</b>으로 시작하고, 직원 · 관리자는 '+
      '<b>SQL 로만</b> 올립니다 — 화면에 올리는 단추를 두면 누구나 관리자가 '+
      '됩니다. Supabase 의 SQL Editor 에서 한 줄입니다.</p>'+
      '<pre class="rq-sql">update account set role = \'admin\'\n'+
      ' where id = \'&lt;내 user id&gt;\';</pre>'+
      '<p>user id 는 Supabase → Authentication → Users 에서 보입니다.</p>'+
    '</div>'+ rqOutRow();
}

function rqOutRow(){
  return '<p class="rq-out">'+esc(RQ.name || "로그인됨")+
    ' <button class="btn btn-o btn-sm" type="button" onclick="rqOut()">나가기</button></p>';
}

window.rqOut = function(){
  window.amAuthOut().then(function(){
    RQ.signedIn = false; RQ.role = ""; RQ.name = ""; RQ.rows = null;
    RQ.open = ""; RQ.to = "";
    rqDraw();
  });
};

/* ── 목록 ────────────────────────────────────────────────────────── */

function rqList(){
  if(RQ.rows === null)
    return '<p class="ad-empty">불러오는 중…</p>' + rqOutRow();

  var L = RQ.rows;
  if(!L.length)
    return '<p class="ad-empty">아직 들어온 접수가 없습니다. '+
      '손님이 견적 요청을 넣으시면 여기에 쌓입니다.</p>' + rqOutRow();

  var shown = RQ.fil ? L.filter(function(r){ return r.state === RQ.fil; }) : L;
  if(RQ.mine) shown = shown.filter(rqIsMine);

  return '<p class="ad-lead">'+
      '<b>목록에는 성함 · 연락처가 없습니다</b> — 가져오지 않습니다. '+
      '배정하면 그때 업체에게만 갑니다 (개인정보보호법 제17조). '+
      '상태를 바꾸면 <b>누가 · 언제 · 왜</b>가 DB 에 같이 남습니다.</p>'+
    rqChips(L)+
    '<div class="rq-g">'+ shown.map(rqRow).join("") +'</div>'+
    '<p class="rq-note">위 숫자는 <b>최근 '+L.length+'건에서 센 값</b>입니다. '+
      '전체 누적이 아닙니다.</p>'+
    rqOutRow();
}

/* 상태 칩 — ⚠️ 개수는 전부 **그 자리에서 세는 값**입니다 */
function rqChips(L){
  var n = {}, i;
  for(i = 0; i < L.length; i++) n[L[i].state] = (n[L[i].state] || 0) + 1;
  /* ⚠️⚠️ **담당자를 정해 두고 "내 건만" 을 못 보면 담당자가 뜻이
     없습니다** — 직원이 둘이 되는 날 서로 남의 건까지 훑습니다.
     ⚠️ 거르는 것은 화면 안에서입니다 (이미 받아 둔 목록을 좁힙니다) —
     서버에 또 묻지 않습니다. */
  var meN = L.filter(rqIsMine).length;
  var out = '<div class="chip-g chip-g-fil rq-fil">'+
    '<button class="chip'+(!RQ.fil && !RQ.mine ? " on" : "")+'" type="button" '+
      'onclick="rqFil(\'\')">전체 '+L.length+'</button>'+
    (RQ.me ? '<button class="chip'+(RQ.mine ? " on" : "")+'" type="button" '+
      'onclick="rqMineGo()">내 건 '+meN+'</button>' : '');
  (window.AM_DEAL_ST || []).forEach(function(s){
    if(!n[s.key]) return;
    out += '<button class="chip'+(RQ.fil === s.key ? " on" : "")+'" type="button" '+
      'onclick="rqFil(\''+esc(s.key)+'\')">'+esc(s.name)+' '+n[s.key]+'</button>';
  });
  return out + '</div>';
}

window.rqFil = function(k){ RQ.fil = k; RQ.mine = false; RQ.open = ""; RQ.to = ""; rqDraw(); };
window.rqMineGo = function(){ RQ.mine = !RQ.mine; RQ.fil = ""; RQ.open = ""; rqDraw(); };
function rqIsMine(r){ return !!(RQ.me && r.owner_id === RQ.me); }

/* 담당자 성함 — ⚠️ 신청 줄에는 **id 만** 옵니다 (최소 수집). 성함은
   직원 목록에서 찾고, 없으면 id 앞 토막을 냅니다 — **지어내지
   않습니다** (절대 규칙 1 · "이름 없음" 도 사실입니다). */
function rqStaffName(id){
  var L = RQ.staff || [], i;
  for(i = 0; i < L.length; i++) if(L[i].id === id)
    return (L[i].name || "").trim() || ("직원 " + String(id).slice(0, 4));
  return "직원 " + String(id || "").slice(0, 4);
}

/* ── 담당자 배정 (2026-10-22 P0 ⑤) ───────────────────────────────
   ⚠️⚠️ **`audit_log.by_user` 와 다른 것입니다.** 그쪽은 "누가 바꿨나"
   (지난 일)이고 이것은 "지금 누가 맡고 있나" 입니다. 없으면 직원이
   둘이 되는 날 **같은 건에 두 사람이 전화**합니다.
   ⚠️ 비울 수 있습니다 — 잘못 정한 날 되돌릴 길이 없으면 그 건이
   영영 남의 것이 됩니다. */
function rqOwnerRow(r){
  var L = RQ.staff || [];
  return '<div class="rq-s rq-own-b"><h4>담당자</h4>'+
    (!L.length
      ? '<p class="f-h">직원 계정이 아직 없습니다. '+
        '관리자가 <code>update account set role=\'staff\' where id=\'…\'</code> 로 '+
        '올려 주시면 여기 고르개에 나옵니다.</p>'
      : '<div class="f-r">'+
          '<label for="rq-own-'+esc(r.id)+'">이 건을 맡은 사람</label>'+
          '<select id="rq-own-'+esc(r.id)+'" class="sel" '+
            'onchange="rqOwnerGo(\''+esc(r.id)+'\',this.value)">'+
            '<option value="">담당자 없음</option>'+
            L.map(function(a){
              return '<option value="'+esc(a.id)+'"'+
                (r.owner_id === a.id ? " selected" : "")+'>'+
                esc((a.name || "").trim() || ("직원 " + String(a.id).slice(0,4)))+
                (a.role === "admin" ? " (관리자)" : "")+'</option>';
            }).join("")+
          '</select>'+
          '<p class="f-h">바꾸면 <b>누가 · 언제</b>가 기록에 같이 남습니다. '+
            '고객에게는 안 보입니다.</p>'+
        '</div>'+
        (RQ.me && r.owner_id !== RQ.me
          ? '<button class="btn btn-o btn-sm" type="button" '+
            'onclick="rqOwnerGo(\''+esc(r.id)+'\',\''+esc(RQ.me)+'\')">내가 맡기</button>'
          : ''))+
  '</div>';
}

window.rqOwnerGo = function(id, who){
  rqCall("set_owner", { p_request:id, p_owner: who || null,
    p_why: who ? "담당자 배정" : "담당자 해제" },
    who ? "담당자를 정했습니다" : "담당자를 비웠습니다");
};

/* ── 연락처 · 요청 내용 (2026-10-22 P0 ③) ────────────────────────
   ⚠️⚠️ **목록에는 없고 여기서 눌러야 옵니다.** 쉰 건의 성함 · 번호를
   깔아 두면 화면 하나가 곧 유출입니다 — 그런데 **여는 길도 없어서**
   관리자가 슬랙을 보고 전화하고 있었습니다 (작업대에서 상태를 바꾸는
   일과 전화하는 일이 다른 창에 있었습니다).
   ⚠️⚠️ **열면 열람 이력이 남습니다** (0012 의 `note_request_open` ·
   개인정보보호법 제29조 접속기록). 기록이 남으면 "필요할 때만 여는"
   것이 지켜집니다 — 이력 구간에 `contact:open` 으로 보입니다.
   ⚠️ 한 건만 들고 있습니다 — 다른 줄을 펼치면 치웁니다. */
function rqContactRow(r){
  var mine = RQ.conOf === r.id, c = mine ? RQ.con : null;
  return '<div class="rq-s rq-con-b"><h4>연락처 · 요청 내용</h4>'+
    (!c
      ? '<p class="f-h">전화를 걸어야 할 때만 여세요 — '+
          '<b>열어 본 것이 기록에 남습니다</b> (제29조 접속기록).</p>'+
        '<button class="btn btn-b" type="button"'+
          (RQ.conBusy ? " disabled" : "")+
          ' onclick="rqContactGo(\''+esc(r.id)+'\')">'+
          (RQ.conBusy && mine ? "불러오는 중…" : "연락처 보기")+'</button>'
      : '<dl class="rq-con">'+
          rqConItem("성함", c.name)+
          /* ⚠️ 번호에서 **숫자만** 남겨 `tel:` 을 만듭니다 — 하이픈이
             섞인 채로 넣으면 기기마다 못 거는 데가 있습니다. */
          (c.tel ? '<dt>연락처</dt><dd><a class="rq-tel" href="tel:'+
             esc(String(c.tel).replace(/[^0-9+]/g, ""))+'">'+esc(c.tel)+'</a></dd>' : '')+
          rqConItem("이메일", c.email)+
          rqConItem("넘기고 싶은 시점", c.want_at)+
          rqConItem("필요한 것", c.body)+
          rqConDetail(c.detail)+
        '</dl>'+
        '<p class="f-h">⚠️ 업체에 넘기는 것은 <b>배정</b>이고, 그때 상호를 '+
          '알리고 <b>제3자 제공 동의</b>를 다시 받습니다 (제17조 제2항).</p>')+
  '</div>';
}

function rqConItem(k, v){
  /* ⚠️ 값이 없는 칸은 **줄째 뺍니다** (절대 규칙 2) */
  if(v == null || String(v).trim() === "") return "";
  return '<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>';
}

/* 적어 주신 조건 — ⚠️ 칸 이름도 손님이 보낸 글이라 `esc()` 를 거칩니다 */
function rqConDetail(d){
  if(!d || typeof d !== "object") return "";
  var K = Object.keys(d).filter(function(k){
    return d[k] != null && String(d[k]).trim() !== ""; });
  if(!K.length) return "";
  return K.map(function(k){
    return '<dt>'+esc(k)+'</dt><dd>'+esc(d[k])+'</dd>'; }).join("");
}

window.rqContactGo = function(id){
  if(RQ.conBusy) return;
  RQ.conBusy = true; RQ.conOf = id; RQ.con = null; rqDraw();
  fetch("/api/me?c=1&r=" + encodeURIComponent(id), {
    headers: Object.assign({ accept:"application/json" }, window.amAuthHeaders()) })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      RQ.conBusy = false;
      /* ⚠️ 못 가져오면 **조용히 비웁니다** — 운영자에게만 남깁니다
         (절대 규칙 3). 다시 누르면 다시 묻습니다. */
      if(!d || !d.contact){ RQ.conOf = ""; toast("연락처를 불러오지 못했습니다"); }
      else { RQ.con = d.contact; if(d.history) RQ.hist = d.history; }
      rqDraw();
    })
    .catch(function(e){
      RQ.conBusy = false; RQ.conOf = "";
      try{ console.warn("[rq] contact — " + e); }catch(_){}
      toast("연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요");
      rqDraw();
    });
};

function rqRow(r){
  var st   = (window.amDealSt && amDealSt(r.state)) || null;
  var open = RQ.open === r.id;
  /* ⚠️ 값이 없는 칸은 **줄째 뺍니다** (절대 규칙 2) */
  var meta = [
    rqSideName(r.side), rqCatName(r.cat), rqIndName(r.industry), rqRegName(r)
  ].filter(Boolean).join(" · ");
  var day = window.amDate(String(r.created_at || "").slice(0, 10));

  return '<article class="rq-r'+(open ? " on" : "")+'">'+
    '<button class="rq-hd" type="button" onclick="rqOpen(\''+esc(r.id)+'\')">'+
      '<span class="rq-hd-l">'+
        (r.no ? '<b class="rq-no">'+esc(r.no)+'</b>' : '')+
        '<span class="rq-m">'+esc(meta || "조건이 적혀 있지 않습니다")+'</span>'+
      '</span>'+
      '<span class="rq-hd-r">'+
        /* ⚠️⚠️ 딱지 색은 `amDealTone()` 한 곳입니다 — `/my` 와 같은
           클래스를 씁니다. 여기 색을 또 적으면 같은 상태가 두 화면에서
           다른 색으로 나옵니다. */
        '<i class="myq-st myq-'+esc(window.amDealTone ? amDealTone(r.state) : "gray")+
          '">'+esc(st ? st.name : r.state)+'</i>'+
        /* ⚠️ 담당자가 없으면 **"없음" 을 찍습니다** — 비워 두면 "아직
           아무도 안 맡은 건" 과 "담당자 칸이 없는 화면" 을 못 가립니다.
           ⚠️ 성함은 직원 목록에서 찾습니다 (신청 줄에는 id 만 옵니다). */
        '<i class="rq-own'+(rqIsMine(r) ? " on" : "")+'">'+
          esc(r.owner_id ? rqStaffName(r.owner_id) : "담당자 없음")+'</i>'+
        (day ? '<em class="rq-d">'+esc(day)+'</em>' : '')+
      '</span>'+
    '</button>'+
    (open ? '<div class="rq-bd">'+ rqOwnerRow(r) + rqContactRow(r) +
              rqItems(r) + rqMove(r) + rqAsg(r) +
              rqQuotes(r) + rqHistRow(r) +'</div>' : '')+
  '</article>';
}

window.rqOpen = function(id){
  RQ.open = (RQ.open === id) ? "" : id;
  RQ.to = ""; RQ.ctx = {};
  /* ⚠️ 이력도 같이 닫습니다 — 안 닫으면 다른 줄을 펼쳤을 때 **남의
     건의 이력**이 그 줄 아래에 그대로 남습니다 (사유에 사정이
     적히는 자리라 더 그렇습니다). */
  RQ.histOf = ""; RQ.hist = null;
  /* ⚠️ 항목도 같이 닫습니다 — 안 닫으면 다른 건을 펼쳤을 때 **남의
     건의 항목 폼**이 열린 채로 남습니다 (배정 단추가 거기 있습니다). */
  RQ.itemOf = ""; RQ.ictx = {};
  /* ⚠️⚠️ **연락처도 같이 치웁니다** — 안 치우면 다른 건을 펼쳤을 때
     **남의 성함 · 번호**가 그 줄 아래에 그대로 남습니다 (이력에서
     겪은 자리와 같습니다). */
  RQ.conOf = ""; RQ.con = null;
  rqDraw();
};

/* ⚠️ 적으실 때마다 다시 그리지 않습니다 — 그러면 글을 적던 칸에서
   커서가 튑니다. 값만 들고 있다가 보낼 때 씁니다. */
window.rqCtx = function(k, v){ RQ.ctx[k] = v; };

/* 이름 — ⚠️ 전부 데이터에서 가져옵니다. 화면에 적어 두면 분류를
   늘릴 때마다 여기가 조용히 틀립니다. */
/* ⚠️⚠️ **`ops` 와 `transfer` 가 빈 칸이었습니다.** DB 는 넷을 받는데
   (0001 — start | ops | transfer | close) 여기가 둘만 적고 있어서,
   운영 · 양도양수 접수는 목록에서 **쪽이 안 보였습니다** — 무엇 때문에
   온 신청인지 모르는 채로 배정하게 됩니다. 이름은 `AM_SIDES`
   (`js/data/deal.js`) 한 곳입니다. */
/* ⚠️ 목록의 메타줄은 ` · ` 로 이어 붙이는 자리라 **짧은 이름**입니다
   ("폐업 · 정리 · 음식점 · 경기" 가 되면 어디까지가 쪽인지 안
   읽힙니다). 펼친 안쪽은 긴 이름(`amSideName`)을 씁니다. */
function rqSideName(v){
  var s = (typeof amSide === "function") ? amSide(v) : null;
  return s ? s.short : "";
}
function rqCatName(k){
  var L = window.AM_CATS || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
  return "";
}
function rqIndName(k){
  var L = window.AM_INDUSTRIES || [], i;
  for(i = 0; i < L.length; i++) if(L[i].key === k) return L[i].name;
  return "";
}
function rqRegName(r){
  var nm = window.amRegionName ? amRegionName(r.region) : "";
  return [nm, r.gu].filter(Boolean).join(" ");
}

/* ── 상태 바꾸기 ─────────────────────────────────────────────────
   ⚠️⚠️ 갈 수 있는 길은 `AM_DEAL_MOVE` 한 곳에서 옵니다. 화면이 또
   적으면 DB 의 `deal_move` 표와 어긋나고, 어긋나면 **화면이 내는
   단추가 서버에서 거절당합니다** (빌드가 둘을 맞춰 봅니다).
   ⚠️ 돈 쪽은 뺍니다 — `move_state()` 가 스스로 거절하는 길입니다. */
function rqMoves(r){
  return (window.amDealMoves ? amDealMoves(r.state, RQ.role) : []).filter(function(m){
    var s = amDealSt(m[1]);
    return s && !s.money;
  });
}

function rqMove(r){
  var M = rqMoves(r);
  if(!M.length)
    return '<p class="rq-none">여기서 '+
      esc(window.amRoleName ? amRoleName(RQ.role) : RQ.role)+
      ' 이(가) 옮길 수 있는 길이 없습니다.</p>';

  var sel = M.filter(function(m){ return m[1] === RQ.to; })[0];

  return '<div class="rq-mv">'+
    '<div class="f-r">'+
      '<label for="rq-to">다음 상태</label>'+
      '<select id="rq-to" class="sel" onchange="rqSetTo(this.value)">'+
        '<option value="">골라 주세요</option>'+
        M.map(function(m){
          return '<option value="'+esc(m[1])+'"'+(RQ.to === m[1] ? " selected" : "")+'>'+
            esc(amDealStName(m[1]))+'</option>';
        }).join("")+
      '</select>'+
    '</div>'+
    (sel ? rqNeed(sel, r) +
      '<div class="ad-acts">'+
        '<button class="btn btn-b" type="button"'+(RQ.busy ? " disabled" : "")+
          ' onclick="rqGo(\''+esc(r.id)+'\')">'+icon("check",18)+
          (RQ.busy ? "보내는 중…" : "이 상태로 바꾸기")+'</button>'+
      '</div>' : '')+
  '</div>';
}

window.rqSetTo = function(v){ RQ.to = v; rqDraw(); };

/* 같이 적어야 하는 것 — ⚠️ 목록은 `AM_DEAL_MOVE` 의 넷째 칸입니다 */
function rqNeed(m, r){
  var need = m[3] || [], out = "";

  if(need.indexOf("why") >= 0)
    out += '<div class="f-r">'+
      '<label for="rq-why">사유</label>'+
      '<textarea id="rq-why" rows="2" spellcheck="false" '+
        'oninput="rqCtx(\'why\',this.value)" '+
        'placeholder="예: 사장님이 다음 달에 다시 연락 달라고 하셨습니다">'+
        esc(RQ.ctx.why || "")+'</textarea>'+
      '<p class="f-h">§8 — 왜 이렇게 바뀌었는지가 안 남으면 '+
        '다음 사람이 이 건을 어떻게 다룰지 모릅니다.</p>'+
    '</div>';

  if(need.indexOf("amount") >= 0)
    out += '<div class="f-r">'+
      '<label for="rq-amt">계약금액 (원)</label>'+
      '<input id="rq-amt" type="number" min="0" step="1" inputmode="numeric" '+
        'oninput="rqCtx(\'amount\',this.value)" '+
        'value="'+esc(RQ.ctx.amount == null ? "" : RQ.ctx.amount)+'" '+
        'placeholder="10000000">'+
      '<p class="f-h">⚠️ 수수료는 여기서 <b>확정되지 않습니다</b>. '+
        '증빙을 보고 관리자가 따로 확정합니다 (§8 마지막 문장).</p>'+
    '</div>';

  if(need.indexOf("providerId") >= 0) out += rqPvField(r);

  /* ⚠️⚠️ 제17조 제2항 — 접수 단계의 동의에는 제3자 제공이 **포함되지
     않습니다**. 방침 제4조 제3항이 그렇게 적혀 있습니다. */
  if(need.indexOf("agree3rd") >= 0)
    out += '<div class="notice-bad rq-a3">'+
        '<b>배정은 제3자 제공입니다 — 개인정보보호법 제17조 제2항</b>'+
        '<p>배정하면 그 업체에게 사장님의 <b>성함 · 연락처 · 요청 내용</b>이 '+
        '갑니다. 접수 때 받은 동의에는 <b>그것이 들어 있지 않습니다</b> — '+
        '어느 업체에 줄지가 정해지지 않았기 때문입니다. '+
        '<b>업체 상호를 알려 드리고 그 자리에서 다시 동의를 받으신 뒤</b> '+
        '아래를 켜세요. 받지 않고 켜면 그 순간 법 위반입니다.</p>'+
      '</div>'+
      '<label class="f-ck rq-ck"><input id="rq-a3" type="checkbox"'+
        (RQ.ctx.agree3rd ? " checked" : "")+
        ' onchange="rqCtx(\'agree3rd\',this.checked)">'+
        '<span>고객에게 <b>업체 상호를 알리고</b> 연락처 전달 동의를 '+
        '받았습니다</span></label>';

  return out;
}

/* ── 배정할 업체 ─────────────────────────────────────────────────
   ⚠️⚠️ **없는 업체를 지어내지 않습니다** (절대 규칙 1). 0곳이면 0곳이라고
   말하고 **등록하는 길**을 같이 냅니다 (절대 규칙 2 — 막다른 길로 두지
   않습니다). */
/* 배정 고르개의 한 칸 — ⚠️⚠️ **두 고르개가 같은 규칙을 씁니다**
   (신청 전체 배정 · 서비스 항목 배정). 두 곳에 적으면 한쪽만 고치는
   날이 옵니다.
   ⚠️⚠️ **배정 가능이 꺼진 업체는 고를 수 없게 잠급니다** (0012).
   숨기지 않는 까닭 — 숨기면 "왜 그 업체가 목록에 없지" 가 되고,
   **왜 못 고르는지**를 그 자리에서 알려 주는 쪽이 낫습니다.
   ⚠️ 잠그는 것은 거드는 것이고 **막는 것은 DB 의 트리거**입니다
   (화면 코드로만 막으면 버그 하나에 뚫립니다). */
function rqPvOpt(p, cur){
  var on = p.assignable !== false;
  return '<option value="'+esc(p.id)+'"'+
    (cur === p.id ? " selected" : "")+(on ? "" : " disabled")+'>'+
    esc(p.name)+
    (on ? (p.listed ? "" : " (아직 공개 전)") : " — 배정 가능 꺼짐")+
  '</option>';
}

/* 고를 수 있는 업체가 몇 곳인가 — ⚠️ **세는 값**입니다.
   ⚠️ 2026-10-22 P2 ㉑ 로 **검색까지 거친 수**를 세야 해서 `rqPvNote()`
   안으로 들어갔습니다 — 두 곳에서 세면 화면에 적힌 수와 고르개에
   담긴 수가 어긋납니다. */

/* ── 조건에 맞는 업체 추리기 (2026-10-22 P2 ⑲) ──────────────────
   > 감사 보고서 §5 ⑲ — "자동 매칭. 지시서가 **수동 우선**을 적었고,
   >  '응답률 · 평가' 로는 고를 수 없습니다 — 재는 장치도 후기도 0건이라
   >  그걸로 순위를 매기면 **지어낸 기준**입니다."

   ⚠️⚠️ **자동으로 배정하지 않습니다.** 하는 일은 고르개의 차례를
   바꾸는 것까지이고, 고르는 것도 제17조 동의를 받는 것도 사람입니다.
   저절로 넘기면 동의를 받은 사람이 아무도 없게 됩니다.

   ⚠️⚠️ **보는 것은 넷뿐입니다** — 분야(하는 일) · 지역 · 업종 ·
   배정 가능. 평점 · 후기 수 · 응답속도 · 거래 수를 **쓰지 않습니다**:
   후기가 0건이고 응답 시각을 재는 장치가 없어서, 그 값으로 줄을
   세우면 그 순서가 곧 **지어낸 추천**입니다 (절대 규칙 1 · 약관
   제6조 제4항 "광고 순서의 기준을 밝힌다").

   ⚠️ 지역 · 업종을 **안 적은 업체는 맞는 것으로 봅니다** — 안 적은
   것을 "전국 · 전업종" 으로 읽는 게 말이 됩니다. 반대로 **하는
   일(`subs`)을 안 적은 업체는 어느 조건에도 안 맞습니다** (그걸
   "전부 다 합니다" 로 읽으면 인테리어 업체가 세무 화면에 앉습니다 —
   `amProviderInCat()` 과 같은 규칙입니다). */
function rqPvFit(p, w){
  if(!w) return false;
  if(p.assignable === false) return false;
  var subs = p.subs || [];
  if(w.sub){
    if(subs.indexOf(w.sub) < 0) return false;
  }else if(w.cat){
    /* ⚠️ 규칙은 `amProviderInCat()` **한 곳**입니다 — 여기 또 적으면
       업체찾기 화면과 어긋납니다 (`amCatTo`/`catTo` 로 겪은 자리). */
    var c = (typeof amCat === "function") ? amCat(w.cat) : null;
    if(!c || typeof amProviderInCat !== "function") return false;
    if(!amProviderInCat(p, c)) return false;
  }
  var R = p.regions || [];
  if(w.region && R.length && R.indexOf(w.region) < 0) return false;
  var I = p.industries || [];
  if(w.industry && I.length && I.indexOf(w.industry) < 0) return false;
  return true;
}

/* 조건을 사람 말로 — ⚠️ 무엇을 보고 추렸는지 **화면에 적습니다.**
   안 적으면 그 차례가 "저희가 추천한 것" 으로 읽힙니다. */
function rqPvWhy(w){
  var L = [];
  if(w && (w.sub || w.cat)) L.push("하는 일");
  if(w && w.region) L.push(
    (typeof amRegionName === "function" ? amRegionName(w.region) : w.region) || "지역");
  if(w && w.industry) L.push(
    (typeof amIndustryName === "function" ? amIndustryName(w.industry) : w.industry) || "업종");
  return L;
}

/* ── 검색 (2026-10-22 P2 ㉑) ─────────────────────────────────────
   > 감사 보고서 §5 ㉑ — "지금 고르개가 200곳까지 담습니다. 모자라기
   >  시작하는 때가 검색이 필요한 때입니다."

   ⚠️⚠️ **목록을 조용히 자르지 않습니다.** 거른 만큼 몇 곳이 빠졌는지
   그 자리에서 밝힙니다 (`/stores` 거르개와 같은 규칙) — 안 밝히면
   직원은 그 분야에 원래 그만큼만 있는 줄 알고 넘어갑니다.
   ⚠️ 보는 것은 **업체명 · 지역 이름 · 업종 이름 · 하는 일 이름**입니다.
   직원은 업체 id(`ganada-interior`)를 모르고 상호를 칩니다. */
function rqPvHit(p, q){
  if(!q) return true;
  var hay = [p.name || "", p.id || ""];
  (p.regions || []).forEach(function(k){
    hay.push(k);
    if(typeof amRegionName === "function") hay.push(amRegionName(k) || ""); });
  (p.gu || []).forEach(function(g){ hay.push(g); });
  (p.industries || []).forEach(function(k){
    hay.push(k);
    if(typeof amIndustryName === "function") hay.push(amIndustryName(k) || ""); });
  (p.subs || []).forEach(function(k){
    hay.push(k);
    var one = (typeof amSubName === "function") ? amSubName(k) : "";
    if(one) hay.push(one); });
  return hay.join(" ").toLowerCase().replace(/\s+/g, "")
    .indexOf(String(q).toLowerCase().replace(/\s+/g, "")) >= 0;
}

/* 고르개 한 벌 — 검색 칸 + 추천/그 밖 두 묶음 + 센 줄.
   ⚠️⚠️ **두 고르개가 이 함수 하나를 씁니다** (신청 전체 · 서비스 항목).
   ⚠️ `key` 가 곧 select 의 id 입니다 — 한 화면에 둘이 서니 겹치면
   `getElementById()` 가 먼저 나오는 하나만 집습니다 (`st-ind` 로
   겪은 자리). */
function rqPvBox(key, want, cur, onch){
  RQ.pvw[key] = want || null;
  return '<div class="rq-pvb" id="'+esc(key)+'-box">'+
    rqPvIn(key)+
    '<div class="f-r">'+
      '<label for="'+esc(key)+'">'+
        (want && want.item ? "이 서비스를 맡길 업체" : "배정할 업체")+'</label>'+
      '<select id="'+esc(key)+'" class="sel" onchange="'+onch+'">'+
        rqPvOpts(key, cur)+
      '</select>'+
      '<p class="f-h" id="'+esc(key)+'-n">'+rqPvNote(key, cur)+'</p>'+
    '</div>'+
  '</div>';
}

function rqPvIn(key){
  var q = RQ.pvq[key] || "";
  return '<div class="f-r rq-pvq">'+
    '<label for="'+esc(key)+'-q">업체 찾기</label>'+
    '<input id="'+esc(key)+'-q" class="in" type="search" '+
      'value="'+esc(q)+'" placeholder="상호 · 지역 · 업종 · 하는 일" '+
      'oninput="rqPvQ(\''+esc(key)+'\',this.value)">'+
  '</div>';
}

/* ⚠️⚠️ **고른 것이 걸러져 사라지지 않게** 합니다. 검색으로 좁힌 뒤
   고르개가 다시 그려질 때 고른 업체가 목록에서 빠지면, select 는
   **첫 칸으로 돌아가고** 직원은 자기가 고른 줄 압니다 — 그대로
   배정하면 엉뚱한 업체에 성함 · 연락처가 갑니다 (제17조). */
function rqPvOpts(key, cur){
  var P   = RQ.provs || [], w = RQ.pvw[key], q = RQ.pvq[key] || "";
  var L   = P.filter(function(p){ return rqPvHit(p, q) || p.id === cur; });
  var fit = w ? L.filter(function(p){ return rqPvFit(p, w); }) : [];
  var rest= L.filter(function(p){ return fit.indexOf(p) < 0; });
  var o = '<option value="">골라 주세요</option>';
  if(fit.length)
    o += '<optgroup label="조건에 맞는 곳 '+fit.length+'곳">'+
      fit.map(function(p){ return rqPvOpt(p, cur); }).join("")+'</optgroup>';
  if(rest.length)
    o += '<optgroup label="'+(fit.length ? "그 밖 " : "")+rest.length+'곳">'+
      rest.map(function(p){ return rqPvOpt(p, cur); }).join("")+'</optgroup>';
  return o;
}

function rqPvNote(key, cur){
  var P = RQ.provs || [], w = RQ.pvw[key], q = RQ.pvq[key] || "";
  var L = P.filter(function(p){ return rqPvHit(p, q); });
  /* ⚠️⚠️ 고른 곳은 걸러도 남겨 두기 때문에, **센 줄이 고르개보다 하나
     적게** 나오는 때가 있습니다 — 그대로 두면 "1곳" 이라고 적어 놓고
     둘이 보이는 꼴입니다. 그 한 곳을 적어서 갈라 줍니다. */
  var kept = !!cur && !L.some(function(p){ return p.id === cur; }) &&
             P.some(function(p){ return p.id === cur; });
  var on = L.filter(function(p){ return p.assignable !== false; }).length;
  var fit= w ? L.filter(function(p){ return rqPvFit(p, w); }).length : 0;
  var why= rqPvWhy(w);
  var t = "";
  if(q) t += '찾으신 말에 '+L.length+'곳이 걸렸습니다 (등록 '+P.length+'곳) — '+
    (P.length - L.length)+'곳은 검색으로 빠졌습니다. '+
    (kept ? '<b>고르신 곳은 찾으신 말과 안 맞아도 그대로 둡니다.</b> ' : '');
  else  t += '고를 수 있는 업체는 '+on+'곳입니다 (등록 '+P.length+'곳). ';
  if(why.length)
    t += '<b>'+esc(why.join(" · "))+'</b>이 맞는 곳 '+fit+'곳을 위에 모았습니다 — '+
      '추천이 아니라 <b>조건이 맞는 것</b>이고, 평점 · 응답속도로 줄을 세우지 '+
      '않습니다 (재는 장치가 없습니다). 고르는 것은 사람입니다.';
  if(on < L.length)
    t += ' ⚠️ <b>'+(L.length - on)+'곳</b>은 <b>배정 가능</b>이 꺼져 있습니다 — '+
      '제휴 계약을 확인하고 아래 <b>업체 · 공개 승인</b> 에서 켜 주세요. '+
      '켜기 전에 배정하면 그 순간 성함 · 연락처가 그 업체로 넘어갑니다 '+
      '(개인정보보호법 제17조).';
  return t;
}

/* ⚠️⚠️ **적는 칸에서는 다시 그리지 않습니다.** `rqDraw()` 를 부르면
   한 글자 칠 때마다 칸이 새로 그려져 **커서가 빠집니다** — 업체 빠른
   등록에서 겪은 자리입니다. 고르개와 센 줄 **둘만** 바꿔 끼웁니다. */
window.rqPvQ = function(key, v){
  RQ.pvq[key] = v;
  var sel = document.getElementById(key), n = document.getElementById(key + "-n");
  var cur = sel ? sel.value : "";
  if(sel) sel.innerHTML = rqPvOpts(key, cur);
  if(n)   n.innerHTML   = rqPvNote(key, cur);
};

function rqPvField(r){
  var P = RQ.provs || [];
  if(!P.length)
    return '<div class="notice-bad">'+
      '<b>등록된 업체가 0곳입니다 — 배정할 곳이 없습니다</b>'+
      '<p>업체를 먼저 등록하셔야 합니다. 위 <b>영업 작업대</b>에서 찾아 '+
      '전화하고, 입점에 동의한 업체를 Supabase 의 <b>provider</b> 표에 '+
      '한 줄 넣으면 여기 고르개에 바로 나옵니다 '+
      '(<b>listed</b> 가 꺼져 있어도 직원 · 관리자에게는 보입니다).</p>'+
    '</div>';

  return rqPvBox("rq-pv", rqWant(r), RQ.ctx.providerId,
                 "rqCtx('providerId',this.value)");
}

/* 이 신청이 무엇에 대한 것인가 — ⚠️ **목록이 주는 칸만** 봅니다
   (`PICK.staff` 의 `cat` · `industry` · `region`). 성함 · 연락처는
   목록에 애초에 안 옵니다. */
function rqWant(r){
  if(!r) return null;
  return { cat:r.cat || "", region:r.region || "",
           industry:r.industry || "" };
}

/* ── 신청 서비스 항목 (2026-10-17 §6 · §7) ───────────────────────
   > §7 — "각 서비스 항목은 독립적으로 배정 및 관리한다 ·
   >  인테리어 → 인테리어 업체 A · 주방설비 → 주방설비 업체 B"

   ⚠️⚠️ **항목이 0개면 구간째 뺍니다** (절대 규칙 2). 옛 접수와
   `/sell` · `/closure` 는 아직 항목을 안 보내서, 그 건은 전과 똑같이
   신청 전체로 배정합니다 (아래 `rqMove()`).
   ⚠️ 서비스 이름은 `catalog.js` 에서 읽습니다 — 저장된 것은 key 이고,
   이름을 바꾸셔도 지난 신청이 따라옵니다 (§6). */
function rqItems(r){
  var L = r.request_item || [];
  if(!L.length) return "";
  return '<div class="rq-it">'+
    '<b class="rq-it-h">신청 서비스 '+esc(L.length)+'개 — 서비스마다 따로 배정하세요</b>'+
    '<ul class="rq-it-l">'+L.map(function(it){ return rqItemRow(it, r); }).join("")+'</ul>'+
    '<p class="f-h">서비스마다 다른 업체에 보낼 수 있습니다. '+
      '배정은 <b>제3자 제공</b>이라 서비스마다 동의를 따로 기록합니다 '+
      '(개인정보보호법 제17조 제2항).</p>'+
  '</div>';
}

function rqItemRow(it, r){
  var open = RQ.itemOf === it.id;
  var st   = (window.amDealSt && amDealSt(it.state)) || null;
  var A    = it.assignment || [];
  /* ⚠️ 적힌 답도 같이 냅니다 — 업체에 물어볼 것이 거기 있습니다 */
  var d    = it.detail && typeof it.detail === "object" ? it.detail : {};
  var keys = Object.keys(d);
  return '<li class="rq-it-i'+(open ? " on" : "")+'">'+
    '<button class="rq-it-b" type="button" onclick="rqItemOpen(\''+esc(it.id)+'\')">'+
      '<span class="rq-it-n">'+esc(rqSvcName(it.service_id))+'</span>'+
      '<i class="myq-st myq-'+esc(window.amDealTone ? amDealTone(it.state) : "gray")+
        '">'+esc(st ? st.name : it.state)+'</i>'+
    '</button>'+
    (A.length
      ? '<p class="rq-it-pv">'+icon("check",14)+' '+
          esc(A.map(function(a){ return rqPvName(a.provider_id) || a.provider_id; })
               .join(" · "))+'</p>'
      : '')+
    (open ? rqItemForm(it, keys, d, r) : "")+
  '</li>';
}

/* ⚠️ 이름을 모르면 **key 를 그대로 냅니다** — 분류가 내려가도 지난
   신청은 남아야 하고(§12), 빈 줄보다 key 가 낫습니다 (운영자 화면). */
/* ⚠️⚠️ **하위 id(`repair/aircon-fix`)도 읽습니다** (2026-10-18 운영
   §4-4). 분류만 보면 운영 쪽 항목이 전부 **key 그대로** 찍혀서,
   관리자가 "repair/aircon-fix" 를 보고 업체를 고르게 됩니다 — 이
   저장소가 포트폴리오에 `gyeonggi` 를 그대로 찍었던 자리와 같습니다.
   ⚠️ 모르는 key 는 **그대로 냅니다** — 내려놓은 분류를 가리키는 지난
   신청을 읽어야 하고, 거기서 빈 칸을 내면 무엇에 대한 신청인지
   아무도 모릅니다 (§12 · 절대 규칙 2). */
function rqSvcName(k){
  var one = (typeof amPickOne === "function") ? amPickOne(k) : null;
  if(one) return one.sub ? (one.desc + " · " + one.name) : one.name;
  var c = (window.AM_CATS || []).filter(function(x){ return x.key === k; })[0];
  return c ? c.name : k;
}

window.rqItemOpen = function(id){
  RQ.itemOf = (RQ.itemOf === id) ? "" : id;
  RQ.ictx = {};
  rqDraw();
};
window.rqIctx = function(k, v){ RQ.ictx[k] = v; };

/* 항목 하나의 조건 — ⚠️ `service_id` 가 `분류/하위` 꼴일 수 있습니다
   (2026-10-18 운영 §4-4). 하위까지 적힌 것은 **하위로** 맞춥니다 —
   "에어컨 수리" 를 고르셨는데 "수리 전체" 로 넓히면 커피머신만 하는
   업체가 위로 올라옵니다. */
function rqItemWant(it, r){
  var id = String((it && it.service_id) || ""), i = id.indexOf("/");
  /* ⚠️⚠️ 고르개의 id 는 `분류/하위` 인데 **업체의 `subs` 는 하위
     key 만** 들고 있습니다 (`aircon-fix`). 통째로 견주면 어느 업체도
     안 맞아서 "조건에 맞는 곳 0곳" 이 늘 나옵니다 — 업체 `subs` 를
     분류 key 로 적었다가 조용히 안 뜨던 자리의 반대쪽입니다. */
  return { item:true,
           cat: i > 0 ? id.slice(0, i) : id,
           sub: i > 0 ? id.slice(i + 1) : "",
           region:   (r && r.region) || "",
           industry: (r && r.industry) || "" };
}

function rqItemForm(it, keys, d, r){
  var P = RQ.provs || [];
  return '<div class="rq-it-f">'+
    (keys.length
      ? '<dl class="rq-it-d">'+keys.map(function(k){
          return '<dt>'+esc(k)+'</dt><dd>'+esc(d[k])+'</dd>'; }).join("")+'</dl>'
      : '')+
    (P.length
      /* ⚠️⚠️ 조건은 **그 서비스 것**입니다 (신청 전체의 `cat` 이 아니라
         항목의 `service_id`). 신청 하나에 인테리어와 주방설비가 같이
         담기는데, 신청 전체 분류로 추리면 **두 항목이 같은 업체를
         위에 올립니다** — §7 이 "서비스마다 독립적으로 배정" 이라고
         적은 까닭입니다. */
      ? rqPvBox("rq-ipv-" + it.id, rqItemWant(it, r), RQ.ictx.providerId,
                "rqIctx('providerId',this.value)")+
        /* ⚠️⚠️ 제17조 안내가 **고르개 아래 · 단추 위**입니다. 체크를
           켜야 `p_agree3rd` 가 실리고, 안 켜면 DB 가 그 말 그대로
           거절합니다 (화면 코드로만 막지 않습니다). */
        '<label class="rq-ag" for="rq-iag-'+esc(it.id)+'">'+
          '<input type="checkbox" id="rq-iag-'+esc(it.id)+'" '+
            'onchange="rqIctx(\'agree3rd\',this.checked)">'+
          '<span>이 서비스의 성함 · 연락처를 위 업체에 넘기는 데 대해 '+
            '<b>상호를 알려 드리고 다시 동의를 받았습니다</b> '+
            '(개인정보보호법 제17조 제2항).</span>'+
        '</label>'+
        '<div class="row-cta">'+
          '<button class="btn btn-b" type="button" '+
            'onclick="rqItemGo(\''+esc(it.id)+'\')">이 서비스 배정하기</button>'+
        '</div>'
      : '<p class="f-h">등록된 업체가 0곳이라 배정할 곳이 없습니다.</p>')+
  '</div>';
}

/* ⚠️⚠️ **화면이 막는 것이 아닙니다.** 막는 것은 DB 의 `assign_item()`
   이고(화면 코드로만 막으면 버그 하나에 뚫립니다), 여기는 **왕복 한
   번을 아끼고 먼저 알려 주는** 것까지입니다. */
window.rqItemGo = function(id){
  if(RQ.busy) return;
  if(!RQ.ictx.providerId){ toast("배정할 업체를 골라 주세요"); return; }
  if(RQ.ictx.agree3rd !== true){
    toast("제3자 제공 동의를 받으셨는지 확인해 주세요"); return; }
  rqCall("assign_item",
    { p_item:id, p_provider:RQ.ictx.providerId, p_agree3rd:true },
    "배정했습니다");
};

/* 이미 배정된 곳 — ⚠️ 상호를 알려 드려야 제17조 재동의가 성립합니다 */
function rqAsg(r){
  var A = r.assignment || [];
  if(!A.length) return "";
  return '<div class="rq-as">'+
    '<b>이 건에 보낸 업체</b>'+
    '<ul>'+ A.map(function(a){
      var nm = rqPvName(a.provider_id);
      var d  = window.amDate(String(a.created_at || "").slice(0, 10));
      /* ⚠️ key 를 그대로 찍지 않습니다 — 이 저장소가 `gyeonggi` ·
         `espresso` 로 겪은 자리입니다. 이름을 모르면 줄째 뺍니다. */
      var st = window.amAssignName ? amAssignName(a.state) : "";
      return '<li>'+esc(nm || a.provider_id || "")+
        (st ? ' <i>'+esc(st)+'</i>' : '')+
        (d ? ' <em>'+esc(d)+'</em>' : '')+'</li>';
    }).join("") +'</ul>'+
  '</div>';
}

function rqPvName(id){
  var P = RQ.provs || [], i;
  for(i = 0; i < P.length; i++) if(P[i].id === id) return P[i].name;
  return "";
}

/* ── 보내기 ──────────────────────────────────────────────────────
   ⚠️⚠️ 상태를 화면이 쓰지 않습니다 — `move_state()` 를 부르고 **그
   문이 거절한 말**을 그대로 보여 줍니다. 무엇을 하면 되는지가 거기
   적혀 있습니다. */
window.rqGo = function(id){
  if(RQ.busy) return;
  var to = RQ.to;
  if(!to){ toast("다음 상태를 골라 주세요"); return; }

  /* ⚠️⚠️ **이 길이 요구한 것만 보냅니다.** 들고 있는 것을 통째로
     보내면, 배정하다 마음을 바꿔 보류로 넘길 때 `agree3rd:true` 가
     **보류 기록에 같이 남습니다** — 받지도 않은 동의가 기록에 남는
     것입니다 (`OK_ARG` 가 인자를 통째로 넘기지 않는 것과 같은 까닭).
     ⚠️ `0` 과 `false` 는 값입니다 — 빈 문자열만 뺍니다 (권리금
     "무권리" 에서 겪은 자리). */
  var row = (RQ.rows || []).filter(function(x){ return x.id === id; })[0];
  var mv  = row ? rqMoves(row).filter(function(m){ return m[1] === to; })[0] : null;
  var need = (mv && mv[3]) || [];
  var ctx = {}, i, k, v;
  for(i = 0; i < need.length; i++){
    k = need[i]; v = RQ.ctx[k];
    if(v === undefined || v === null || v === "") continue;
    ctx[k] = (k === "amount" || k === "paid") ? Number(v) : v;
  }

  /* ⚠️⚠️ **보내기 전에 한 번 봅니다** (3차 · §9 의 12). `amDealMove()` 가
     `AM_DEAL_MOVE` 로 같은 판단을 하는데 **검사에서만 돌고 화면은 한 번도
     안 부르고 있었습니다** — 검사 61개가 초록인데 그 길을 아무도 안
     지나가는 자리였습니다 (이 저장소의 "만들어 놓고 안 쓰는 칸").
     ⚠️ **자물쇠가 아닙니다.** 막는 것은 DB 의 `move_state()` 이고
     (화면 코드로만 막으면 버그 하나에 뚫립니다), 여기는 **왕복을 한
     번 아끼고 같은 말로 먼저 알려 주는** 것까지입니다.
     ⚠️ 두 곳이 어긋날 수는 없습니다 — `checkDealSql()` 이 `deal.js` 의
     길 표와 DB 의 `deal_move` 를 빌드마다 맞춰 봅니다. */
  var pre = window.amDealMove && window.amDealMove(row && row.state, to,
    Object.assign({ role: RQ.role, by: "me" }, ctx));
  if(pre && !pre.ok){ toast(pre.why); return; }

  RQ.busy = true; rqDraw();
  fetch("/api/deal", {
    method:"POST",
    headers: Object.assign(
      { "content-type":"application/json", accept:"application/json" },
      window.amAuthHeaders()),
    body: JSON.stringify({ fn:"move_state",
      args:{ p_request:id, p_to:to, p_ctx:ctx } })
  }).then(function(r){
    return r.json().then(function(d){ return { ok:r.ok, d:d }; });
  }).then(function(x){
    RQ.busy = false;
    if(!x.ok){
      /* ⚠️ DB 가 거절한 **그 말**입니다 — "같이 적어야 하는 것이
         빠졌습니다 — 사유" 처럼 무엇을 하면 되는지가 적혀 있습니다 */
      toast((x.d && x.d.error) || "바꾸지 못했습니다");
      rqDraw();
      return;
    }
    toast(amDealStName(to) + " 로 바꿨습니다");
    RQ.open = ""; RQ.to = ""; RQ.ctx = {};
    rqLoad();
  }).catch(function(e){
    RQ.busy = false;
    try{ console.warn("[rq] move_state — " + e); }catch(_){}
    toast("연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요");
    rqDraw();
  });
};

/* ── 불러오기 ────────────────────────────────────────────────────── */
function rqLoad(){
  RQ.rows = null; rqDraw();
  fetch("/api/me", { headers: Object.assign(
    { accept:"application/json" }, window.amAuthHeaders()) })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      if(!d || !d.signedIn){ RQ.signedIn = false; RQ.rows = null; rqDraw(); return; }
      RQ.role  = d.role || RQ.role;
      RQ.rows  = d.requests || [];
      RQ.provs = d.providers || [];
      /* ⚠️ 역할에 따라 **애초에 안 오는** 칸입니다 (api/me.js 의 PICK).
         화면이 없는 것을 숨기는 것이 아니라 서버가 안 보냅니다. */
      RQ.deals = d.deals || [];
      RQ.fees  = d.fees  || [];
      /* ⚠️⚠️ **받아만 놓지 않습니다.** 업체가 낸 견적을 직원이 못 보면
         상태를 넘겨 주면서 "얼마에 어떤 범위로 냈는지" 를 전화로 다시
         물어야 합니다 — 이 저장소가 "만들어 놓고 안 쓰는 칸" 으로 여러
         번 겪은 자리라, 펼친 줄에서 그대로 냅니다 (0008 · §4 · §6). */
      RQ.quotes = d.quotes || [];
      /* 담당자 고르개 (P0 ⑤) — ⚠️ 직원 · 관리자 계정만 옵니다
         (0012 의 `account_staff` 정책). 화면이 거르는 것이 아닙니다. */
      RQ.staff  = d.staff  || [];
      RQ.me     = d.me || "";
      /* 업체 담당자 · 기간별 정산 (P1 ⑬⑭) — ⚠️ 담당자는 직원 ·
         관리자에게만, 정산은 **관리자에게만** 옵니다 (api/me.js).
         화면이 숨기는 것이 아니라 서버가 안 보냅니다. */
      RQ.contacts = d.contacts || [];
      RQ.settles  = d.settles  || [];
      /* 업체 입점 신청 (P1-7) — ⚠️ 직원 · 관리자에게만 옵니다
         (0016 의 RLS 에 고객 · 업체 정책이 아예 없습니다). */
      RQ.applies  = d.applies  || [];
      rqDraw();
    })
    .catch(function(e){
      /* ⚠️ 운영자에게만 남깁니다 */
      try{ console.warn("[rq] /api/me — " + e); }catch(_){}
      RQ.rows = [];
      rqDraw();
    });
}

/* ── 시작 ────────────────────────────────────────────────────────── */
function rqBoot(){
  if(!$("rq")) return;
  window.amAuthAsk().then(function(a){
    RQ.asked = true;
    RQ.on = a.on; RQ.signedIn = a.signedIn; RQ.role = a.role; RQ.name = a.name;
    rqDraw();
    if(a.signedIn && (a.role === "staff" || a.role === "admin")) rqLoad();
  });
}

if(document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", rqBoot);
else rqBoot();

/* ════════════════════════════════════════════════════════════════════
   2차 — 계약 성과 · 수수료 확정 · 정산 · 미수금 (전면 감사 §6 의 5·7)

   ⚠️⚠️ **여기가 0003 이 만들어 둔 문 셋을 처음 부르는 자리입니다.**
   `confirm_fee` · `mark_paid` · `clawback_fee` 가 DB 에 서 있었는데
   누르는 자리가 없었습니다 — 1차에서 `move_state` 가 그랬던 것과
   같은 "만들어 놓고 안 쓰는 칸" 입니다.

   ⚠️⚠️ **숫자를 화면이 지어내지 않습니다.** 수수료는 `amFeeCalc()` 가
   정책 사본과 계약금액으로 **계산**하고, 화면은 그 결과를 보여 준 뒤
   **그대로** 서버에 넘깁니다. 손으로 적는 칸을 두면 정책과 어긋난
   청구서가 나가고, 그때는 어느 쪽이 맞는지 아무도 모릅니다.

   ⚠️ **관리자만 보입니다.** 돈은 `api/me.js` 가 관리자에게만 보냅니다 —
   화면이 숨기는 것이 아니라 **서버가 안 보냅니다** (버그 하나에 남의
   계약금액이 서지 않게).
   ════════════════════════════════════════════════════════════════════ */

function rqMoney(){
  if(RQ.role !== "admin") return "";
  var D = RQ.deals || [];

  /* ⚠️ 합계는 **그 자리에서 세는 값**입니다. 숫자로 들고 있으면
     누군가 그 칸을 고칠 수 있고 기록과 어긋나기 시작합니다. */
  var sum = { amount:0, fee:0, paid:0, due:0, n:D.length, wait:0 };
  D.forEach(function(d){
    sum.amount += Number(d.amount || 0);
    sum.fee    += Number(d.fee || 0);
    sum.paid   += Number(d.paid || 0);
    /* 미수금 — ⚠️ **확정된 것 중 아직 안 들어온 것**입니다.
       확정 전인 건을 미수금에 넣으면 받을 돈이 부풀려집니다. */
    if(d.fee != null) sum.due += Number(d.fee_total || d.fee || 0) - Number(d.paid || 0);
    if(d.fee == null) sum.wait++;
  });

  return '<section class="ad-s rq-s rq-s-mn">'+
    '<h2>계약 · 수수료 · 정산</h2>'+
    (!D.length
      ? '<p class="ad-empty">아직 계약이 없습니다. '+
        '신청을 <b>계약 완료</b>로 옮기시면 여기에 쌓입니다.</p>'
      : '<div class="rq-kpi">'+
          rqKpi("계약", sum.n + "건", won(sum.amount) + "원")+
          rqKpi("확정 수수료", won(sum.fee) + "원",
                sum.wait ? "확정 전 " + sum.wait + "건" : "")+
          rqKpi("입금", won(sum.paid) + "원", "")+
          rqKpi("미수금", won(sum.due) + "원", "확정 - 입금")+
        '</div>'+
        '<div class="rq-g">'+ D.map(rqDealRow).join("") +'</div>'+
        /* ⚠️⚠️ **"전체" 라고 적지 않습니다** — api/me.js 가 최근 것만
           가져옵니다 (전체 누적이라고 적으면 그게 틀린 숫자입니다). */
        '<p class="rq-note">위 숫자는 <b>최근 '+D.length+'건에서 센 값</b>입니다. '+
          '전체 누적이 아닙니다.</p>')+
  '</section>';
}

function rqKpi(t, v, s){
  return '<div class="rq-k"><span>'+esc(t)+'</span><b>'+esc(v)+'</b>'+
    (s ? '<em>'+esc(s)+'</em>' : '')+'</div>';
}

function rqDealRow(d){
  var r    = d.request || {};
  var open = RQ.money === d.id;
  var st   = (window.amDealSt && amDealSt(r.state)) || null;
  var tone = window.amDealTone ? amDealTone(r.state) : "gray";

  return '<article class="rq-r'+(open ? " on" : "")+'">'+
    '<button class="rq-hd" type="button" onclick="rqMoneyOpen(\''+esc(d.id)+'\')">'+
      '<span class="rq-hd-l">'+
        (r.no ? '<b class="rq-no">'+esc(r.no)+'</b>' : '')+
        '<span class="rq-m">'+esc(rqPvName(d.provider_id) || d.provider_id || "")+
          ' · 계약 '+esc(won(d.amount))+'원</span>'+
      '</span>'+
      '<span class="rq-hd-r">'+
        '<i class="myq-st myq-'+esc(tone)+'">'+esc(st ? st.name : r.state || "")+'</i>'+
        '<em class="rq-d">'+esc(d.fee == null ? "수수료 확정 전"
          : (d.paid == null ? "입금 대기" : "입금 " + won(d.paid) + "원"))+'</em>'+
      '</span>'+
    '</button>'+
    (open ? '<div class="rq-bd">'+ rqDealBody(d) +'</div>' : '')+
  '</article>';
}

window.rqMoneyOpen = function(id){
  RQ.money = (RQ.money === id) ? "" : id;
  RQ.mctx = {};
  rqDraw();
};
/* ⚠️ 적을 때마다 다시 그리지 않습니다 — 커서가 칸에서 빠집니다 */
window.rqMctx = function(k, v){ RQ.mctx[k] = v; };

/* ── 계약 한 건 ─────────────────────────────────────────────────── */
function rqDealBody(d){
  /* §9 가 **각각 구분해 저장**하라고 한 넷을 그대로 넷으로 냅니다 —
     합치면 "얼마를 확정했다가 얼마를 받았는가" 가 사라집니다. */
  var rows = [
    ["계약금액",     d.amount   == null ? "" : won(d.amount) + "원"],
    ["수수료(공급가)", d.fee      == null ? "" : won(d.fee) + "원"],
    ["부가세",       d.fee_vat  == null ? "" : won(d.fee_vat) + "원"],
    ["청구액",       d.fee_total == null ? "" : won(d.fee_total) + "원"],
    ["실제 입금액",   d.paid     == null ? "" : won(d.paid) + "원"],
    ["계약일",       amDate(String(d.signed_at || "").slice(0, 10))],
    ["완료일",       amDate(String(d.done_at   || "").slice(0, 10))],
    ["확정일",       amDate(String(d.fee_at    || "").slice(0, 10))]
  /* ⚠️ 값이 없는 칸은 **줄째 뺍니다** (절대 규칙 2) */
  ].filter(function(x){ return x[1]; });

  return '<dl class="rq-sp">'+ rows.map(function(x){
      return '<dt>'+esc(x[0])+'</dt><dd>'+esc(x[1])+'</dd>';
    }).join("") +'</dl>'+
    (d.fee == null ? rqFeeForm(d)
      : d.paid == null ? rqPaidForm(d)
      : rqClawForm(d));
}

/* ── ① 수수료 확정 (§9 "관리자의 최종 승인") ─────────────────────── */
function rqFeeForm(d){
  var P = (RQ.fees || []).filter(function(f){
    return f.provider_id === d.provider_id && f.active !== false;
  });
  if(!P.length)
    return '<div class="notice-bad">'+
      '<b>이 업체의 수수료 정책이 없습니다</b>'+
      '<p>아래 <b>수수료 정책</b> 칸에서 먼저 만드세요. 정책 없이 금액만 '+
      '적는 길을 두지 않았습니다 — 정책과 어긋난 청구서가 나가면 '+
      '어느 쪽이 맞는지 아무도 모릅니다 (§9).</p>'+
    '</div>';

  var pick = RQ.mctx.feeId || P[0].id;
  var pol  = window.amFeeFromDb(P.filter(function(f){ return f.id === pick; })[0] || P[0]);
  /* ⚠️⚠️ 숫자는 **계산값**입니다 — 손으로 적는 칸을 두지 않았습니다.
     ⚠️ 월 요금 · 회차는 **계산에 넣는 사실**이지 금액이 아닙니다
     (계약금액이 `deal.amount` 에서 오는 것과 같은 자리입니다). */
  var calc = window.amFeeCalc(window.amFeeSnap(pol), rqFeeIn(d, pol));

  return '<div class="rq-mv">'+
    '<div class="f-r">'+
      '<label for="rq-fp">적용할 수수료 정책</label>'+
      '<select id="rq-fp" class="sel" onchange="rqFeePick(this.value)">'+
        P.map(function(f){
          var t = window.amFeeType(f.type);
          return '<option value="'+esc(f.id)+'"'+(f.id === pick ? " selected" : "")+'>'+
            esc((t ? t.name : f.type) +
                (f.rate ? " · " + f.rate + "%" : "") +
                (f.flat ? " · " + won(f.flat) + "원" : ""))+'</option>';
        }).join("")+
      '</select>'+
      '<p class="f-h">⚠️ 고르신 정책은 계약에 <b>사본으로</b> 박힙니다 — '+
        '나중에 요율을 고쳐도 <b>이 계약의 수수료는 안 바뀝니다</b> (§9).</p>'+
    '</div>'+
    rqFeeMrrFields(pol, d.id)+
    '<div id="rq-calcbox">'+rqFeeCalcBox(calc)+'</div>'+
    '<div class="f-r">'+
      '<label for="rq-proof">계약 완료 증빙</label>'+
      '<input id="rq-proof" type="text" autocomplete="off" '+
        'oninput="rqMctx(\'proof\',this.value)" '+
        'value="'+esc(RQ.mctx.proof || "")+'" '+
        'placeholder="예: 세금계산서 2026-10-11 · 계약서 사본 받음">'+
      '<p class="f-h">§9 — 증빙 없이는 확정되지 않습니다. '+
        '⚠️ 사진 · 파일은 아직 받아 둘 자리가 없어 <b>무엇을 봤는지</b>만 적습니다.</p>'+
    '</div>'+
    '<div class="f-r">'+
      '<label for="rq-fwhy">사유 <em>(선택)</em></label>'+
      '<input id="rq-fwhy" type="text" autocomplete="off" '+
        'oninput="rqMctx(\'why\',this.value)" value="'+esc(RQ.mctx.why || "")+'">'+
    '</div>'+
    '<div class="ad-acts">'+
      '<button class="btn btn-b" type="button"'+
        ((RQ.busy || !calc.ok) ? " disabled" : "")+
        ' onclick="rqFeeGo(\''+esc(d.id)+'\')">'+icon("check",18)+
        '수수료 확정</button>'+
    '</div>'+
  '</div>';
}

/* 계산에 넣는 값 — ⚠️⚠️ **한 곳입니다.** 그리는 쪽과 보내는 쪽이
   따로 만들면 화면에 보여 준 금액과 실제로 보내는 금액이 어긋나고,
   그건 청구서에서 드러납니다.
   ⚠️ 유지분(`mrr_rate`)만 월 요금 · 회차를 받습니다 — 나머지는
   전과 글자 하나 다르지 않습니다. */
function rqFeeIn(d, pol){
  var o = {
    amount: Number(d.amount || 0),
    sell:   Number(d.amount || 0),
    cost:   0,
    times:  1,
    at:     String(d.done_at || "").slice(0, 10) || undefined
  };
  if(pol && pol.type === "mrr_rate"){
    /* ⚠️ 빈 칸은 **0 이 아니라 없는 것**입니다 — 0 으로 떨어뜨리면
       "월 요금이 아직 없습니다" 가 아니라 0원 수수료가 나옵니다. */
    var m = String(RQ.mctx.mrr == null ? "" : RQ.mctx.mrr).trim();
    var n = String(RQ.mctx.mon == null ? "" : RQ.mctx.mon).trim();
    o.monthly = m === "" ? null : Number(m);
    o.times   = n === "" ? null : Number(n);
  }
  return o;
}

/* 유지분일 때만 나오는 칸 둘 — ⚠️ 다른 모델에서는 **아예 안 그립니다**
   (안 쓰는 칸을 깔면 무엇을 적어야 하는지가 흐려집니다). */
function rqFeeMrrFields(pol, id){
  if(!pol || pol.type !== "mrr_rate") return "";
  return '<div class="f-r">'+
      '<label for="rq-mrr">손님이 내는 월 요금 (원)</label>'+
      '<input id="rq-mrr" type="number" min="0" step="1" autocomplete="off" '+
        'inputmode="numeric" oninput="rqMctxFee(\'mrr\',this.value,\''+esc(id)+'\')" '+
        'value="'+esc(RQ.mctx.mrr == null ? "" : RQ.mctx.mrr)+'" '+
        'placeholder="예: 55000">'+
      '<p class="f-h">⚠️ 이 금액의 요율이 <b>한 달치 수수료</b>입니다. '+
        '요금제가 바뀌면 그때부터 다시 잡습니다.</p>'+
    '</div>'+
    '<div class="f-r">'+
      '<label for="rq-mon">이번에 확정할 개월 수</label>'+
      '<input id="rq-mon" type="number" min="1" step="1" autocomplete="off" '+
        'inputmode="numeric" oninput="rqMctxFee(\'mon\',this.value,\''+esc(id)+'\')" '+
        'value="'+esc(RQ.mctx.mon == null ? "" : RQ.mctx.mon)+'" '+
        'placeholder="예: 12">'+
      '<p class="f-h">⚠️⚠️ <b>약정 기간 전부를 한 번에 적지 마세요.</b> '+
        '유지된 것이 확인된 달까지입니다 — 아직 받지도 않은 달을 '+
        '확정하면 해지되었을 때 환수해야 합니다.</p>'+
    '</div>';
}

/* 계산 결과 칸 — ⚠️ 그리는 쪽과 **다시 칠하는 쪽**이 같은 글을
   내야 합니다. 두 벌로 적으면 처음 그린 것과 값을 고친 뒤가
   달라집니다. */
function rqFeeCalcBox(calc){
  if(calc.ok)
    return '<div class="rq-calc">'+
      '<b>'+esc(won(calc.fee))+'원</b>'+
      '<span>+ 부가세 '+esc(won(calc.vat))+'원 = 청구 '+esc(won(calc.total))+'원</span>'+
      (calc.clamped ? '<em>'+(calc.clamped === "min" ? "최소" : "최대")+
        ' 수수료가 적용됐습니다</em>' : '')+
      '</div>';
  /* ⚠️⚠️ 계산이 안 되면 **0원을 내놓지 않고** 까닭을 적습니다 */
  return '<div class="notice-bad"><b>이 정책으로는 계산되지 않습니다</b>'+
    '<p>'+esc(calc.why)+'</p></div>';
}

/* ⚠️⚠️ **적는 칸에서는 다시 그리지 않습니다.** `rqDraw()` 를 부르면
   한 글자 칠 때마다 커서가 칸에서 빠집니다 (이 저장소가 업체 빠른
   등록에서 겪은 자리). 계산 칸과 단추 **둘만** 바꿔 끼웁니다.
   ⚠️ 둘 중 하나만 고치면 "못 누르는 단추 옆에 계산된 금액" 이 섭니다. */
window.rqMctxFee = function(k, v, id){
  RQ.mctx[k] = v;
  var d = (RQ.deals || []).filter(function(x){ return x.id === id; })[0];
  if(!d) return;
  var P = (RQ.fees || []).filter(function(f){
    return f.provider_id === d.provider_id && f.active !== false; });
  var pick = RQ.mctx.feeId || (P[0] && P[0].id);
  var pol  = window.amFeeFromDb(P.filter(function(f){ return f.id === pick; })[0] || P[0]);
  if(!pol) return;
  var calc = window.amFeeCalc(window.amFeeSnap(pol), rqFeeIn(d, pol));
  var box  = document.getElementById("rq-calcbox");
  if(box) box.innerHTML = rqFeeCalcBox(calc);
  var btn = box && box.parentElement &&
            box.parentElement.querySelector(".ad-acts button");
  if(btn) btn.disabled = !!RQ.busy || !calc.ok;
};

window.rqFeePick = function(v){ RQ.mctx.feeId = v; rqDraw(); };

window.rqFeeGo = function(id){
  if(RQ.busy) return;
  var d = (RQ.deals || []).filter(function(x){ return x.id === id; })[0];
  if(!d) return;
  var P = (RQ.fees || []).filter(function(f){
    return f.provider_id === d.provider_id && f.active !== false;
  });
  var pick = RQ.mctx.feeId || (P[0] && P[0].id);
  var pol  = window.amFeeFromDb(P.filter(function(f){ return f.id === pick; })[0]);
  if(!pol){ toast("적용할 정책을 골라 주세요"); return; }
  /* ⚠️⚠️ **사본을 만들어 보냅니다** — 정책을 가리키게만 두면 요율을
     고친 날 지난 계약의 수수료가 같이 바뀝니다 (§9). */
  var snap = window.amFeeSnap(pol);
  /* ⚠️⚠️ **그리는 쪽과 같은 함수**를 씁니다 — 두 곳에 적으면 화면에
     보여 준 금액과 실제로 보내는 금액이 어긋납니다. */
  var calc = window.amFeeCalc(snap, rqFeeIn(d, pol));
  if(!calc.ok){ toast(calc.why); return; }
  var proof = String(RQ.mctx.proof || "").trim();
  if(!proof){ toast("계약 완료 증빙을 적어 주세요"); return; }

  rqCall("confirm_fee", {
    p_deal:id, p_fee:calc.fee, p_vat:calc.vat, p_total:calc.total,
    p_snap:snap, p_proof:{ note:proof, at:new Date().toISOString() },
    p_why: String(RQ.mctx.why || "").trim() || null
  }, "수수료를 확정했습니다");
};

/* ── ② 입금 확인 (§9 · §13 가짜 정산 금지) ───────────────────────── */
function rqPaidForm(d){
  var due = Number(d.fee_total || d.fee || 0);
  return '<div class="rq-mv">'+
    '<div class="f-r">'+
      '<label for="rq-paid">실제 입금액 (원)</label>'+
      '<input id="rq-paid" type="number" min="0" step="1" inputmode="numeric" '+
        'oninput="rqMctx(\'paid\',this.value)" '+
        'value="'+esc(RQ.mctx.paid == null ? String(due) : RQ.mctx.paid)+'">'+
      '<p class="f-h">청구액은 '+esc(won(due))+'원입니다. '+
        '⚠️ <b>실제로 들어온 금액</b>을 적으세요 — 청구액을 그대로 적으면 '+
        '그게 가짜 정산입니다 (§13).</p>'+
    '</div>'+
    '<div class="f-r">'+
      '<label for="rq-pwhy">사유 <em>(선택)</em></label>'+
      '<input id="rq-pwhy" type="text" autocomplete="off" '+
        'oninput="rqMctx(\'why\',this.value)" value="'+esc(RQ.mctx.why || "")+'">'+
    '</div>'+
    '<div class="ad-acts">'+
      '<button class="btn btn-b" type="button"'+(RQ.busy ? " disabled" : "")+
        ' onclick="rqPaidGo(\''+esc(d.id)+'\')">'+icon("check",18)+
        '입금 확인</button>'+
    '</div>'+
  '</div>';
}

window.rqPaidGo = function(id){
  if(RQ.busy) return;
  var v = RQ.mctx.paid;
  if(v === undefined || v === null || v === ""){ toast("실제 입금액을 적어 주세요"); return; }
  /* ⚠️ `0` 은 값입니다 — 부분환불 뒤 0원이 될 수 있습니다 */
  rqCall("mark_paid", { p_deal:id, p_paid:Number(v),
    p_why: String(RQ.mctx.why || "").trim() || null }, "입금을 확인했습니다");
};

/* ── ③ 환수 · 부분환불 (§9) ──────────────────────────────────────── */
function rqClawForm(d){
  return '<div class="rq-mv">'+
    /* ⚠️ 붉은 상자(`notice-bad`)가 아닙니다 — 정산이 끝난 것은
       **잘못된 일이 아닌데** 붉게 두면 운영자가 "뭔가 틀렸나" 로
       읽습니다. 찍어 보고 알았습니다. */
    '<div class="note-box">'+
      '<b>이 건은 정산이 끝났습니다</b>'+
      '<p>계약이 취소되거나 금액이 줄었으면 <b>환수</b>로 고칩니다. '+
      '⚠️ 확정했던 액을 <b>갈아 치우지 않고</b> 차액을 기록으로 남깁니다 — '+
      '갈아 치우면 "얼마를 확정했다가 얼마를 돌려받았는가" 가 사라집니다.</p>'+
    '</div>'+
    '<div class="f-r">'+
      '<label for="rq-nfee">고쳐 적을 수수료 (원)</label>'+
      '<input id="rq-nfee" type="number" min="0" step="1" inputmode="numeric" '+
        'oninput="rqMctxDraw(\'newFee\',this.value)" '+
        'value="'+esc(RQ.mctx.newFee == null ? "" : RQ.mctx.newFee)+'" '+
        'placeholder="'+esc(String(d.fee || 0))+'">'+
    '</div>'+
    /* ⚠️⚠️ **얼마가 돌아오는지 보여 주고 보냅니다** (3차 · §9 의 12).
       `amFeeClawback()` 이 차액을 계산하는데 **검사에서만 돌고
       있었습니다** — 운영자는 "30만원을 3만원으로" 까지만 적고
       **27만원이 환수된다는 것을 숫자로 못 보고** 눌렀습니다.
       ⚠️ 이것도 자물쇠가 아닙니다 — 실제로 적는 것은 DB 의
       `clawback_fee()` 이고, 여기는 **눌리기 전에 보여 주는** 것입니다. */
    rqClawPreview(d)+
    '<div class="f-r">'+
      '<label for="rq-cwhy">환수 사유 <em>(필수)</em></label>'+
      '<input id="rq-cwhy" type="text" autocomplete="off" '+
        'oninput="rqMctx(\'why\',this.value)" value="'+esc(RQ.mctx.why || "")+'" '+
        'placeholder="예: 계약 일부 취소 — 2026-10-20">'+
    '</div>'+
    '<div class="ad-acts">'+
      '<button class="btn btn-o" type="button"'+(RQ.busy ? " disabled" : "")+
        ' onclick="rqClawGo(\''+esc(d.id)+'\')">'+icon("refresh",18)+
        '환수 기록</button>'+
    '</div>'+
  '</div>';
}

function rqClawPreview(d){
  var v = RQ.mctx.newFee;
  if(v === undefined || v === null || v === "") return "";
  var r = window.amFeeClawback && window.amFeeClawback(
    d.fee_snap || { type:"flat", flat:Number(v) }, Number(d.fee || 0),
    { amount:Number(d.amount || 0), sell:Number(d.amount || 0),
      cost:0, times:1, fixed:Number(v) });
  /* ⚠️ 계산이 안 되면 **0원을 내놓지 않고** 차액만 그대로 보여 줍니다
     (사본이 없는 옛 계약도 있습니다) */
  var was  = Number(d.fee || 0), now = Number(v);
  var back = (r && r.ok) ? r.back : (was - now);
  if(!isFinite(back)) return "";
  return '<div class="rq-calc">'+
      '<b>'+esc(won(Math.abs(back)))+'원</b>'+
      '<span>'+esc(won(was))+'원 확정 → '+esc(won(now))+'원 · '+
        (back >= 0 ? '돌려드릴 금액' : '더 청구할 금액')+'</span>'+
      /* ⚠️ 확정했던 액은 **그대로 남습니다** — 차액만 기록입니다 */
      '<em>확정했던 '+esc(won(was))+'원은 기록에 그대로 남습니다</em>'+
    '</div>';
}

window.rqClawGo = function(id){
  if(RQ.busy) return;
  var v = RQ.mctx.newFee, why = String(RQ.mctx.why || "").trim();
  if(v === undefined || v === null || v === ""){ toast("고쳐 적을 수수료를 적어 주세요"); return; }
  if(!why){ toast("환수 사유를 적어 주세요"); return; }
  rqCall("clawback_fee", { p_deal:id, p_new_fee:Number(v), p_why:why }, "환수를 기록했습니다");
};

/* ── 부르기 한 곳 ────────────────────────────────────────────────
   ⚠️⚠️ **DB 가 거절한 그 말**을 그대로 보여 줍니다 — "서비스 완료
   상태에서만 …" 처럼 무엇을 하면 되는지가 거기 적혀 있습니다. */
function rqCall(fn, args, say){
  RQ.busy = true; rqDraw();
  fetch("/api/deal", {
    method:"POST",
    headers: Object.assign(
      { "content-type":"application/json", accept:"application/json" },
      window.amAuthHeaders()),
    body: JSON.stringify({ fn:fn, args:args })
  }).then(function(r){
    return r.json().then(function(d){ return { ok:r.ok, d:d }; });
  }).then(function(x){
    RQ.busy = false;
    if(!x.ok){ toast((x.d && x.d.error) || "처리하지 못했습니다"); rqDraw(); return; }
    toast(say);
    RQ.money = ""; RQ.mctx = {}; RQ.open = ""; RQ.to = ""; RQ.ctx = {};
    RQ.itemOf = ""; RQ.ictx = {};
    RQ.pvOf = ""; RQ.pctx = {};
    RQ.apOf = ""; RQ.actx = {};
    rqLoad();
  }).catch(function(e){
    RQ.busy = false;
    try{ console.warn("[rq] " + fn + " — " + e); }catch(_){}
    toast("연결이 끊겼습니다. 잠시 뒤 다시 눌러 주세요");
    rqDraw();
  });
}

/* ════════════════════════════════════════════════════════════════════
   2차 — 수수료 정책 (전면 감사 §6 의 6 · §9)

   ⚠️⚠️ **정책을 고쳐도 지난 계약은 안 바뀝니다.** 계약에 `fee_snap`
   으로 사본이 박히기 때문입니다 — 그래서 마음 놓고 고칠 수 있고,
   그것이 §9 가 요구한 것입니다.
   ⚠️ **지우지 않고 끕니다.** 지난 계약이 그 정책의 사본을 들고 있고,
   기록에서 "그때 무엇을 썼는가" 가 사라지면 안 됩니다.
   ════════════════════════════════════════════════════════════════════ */

function rqFees(){
  if(RQ.role !== "admin") return "";
  var F = RQ.fees || [], P = RQ.provs || [];

  return '<section class="ad-s rq-s rq-s-fee">'+
    '<h2>수수료 정책</h2>'+
    '<p class="ad-lead">업체마다 · 상품마다 따로 둘 수 있습니다. '+
      '<b>고친 정책은 지난 계약에 영향을 주지 않습니다</b> — 계약에는 '+
      '그때의 <b>사본</b>이 박혀 있습니다 (§9).</p>'+
    (!P.length
      /* ⚠️ 0 은 에러가 아니라 **지금 사실**입니다 — 이 저장소가
         Empty 를 붉게 칠하지 않는 것과 같은 까닭입니다 */
      ? '<div class="note-box"><b>등록된 업체가 0곳입니다</b>'+
        '<p>정책은 업체에 붙는 것이라 업체를 먼저 등록하셔야 합니다.</p></div>'
      : (F.length
          ? '<div class="rq-g">'+ F.map(rqFeeRow).join("") +'</div>'
          : '<p class="ad-empty">아직 정책이 없습니다. 아래에서 만드세요.</p>')+
        rqFeeNew())+
  '</section>';
}

function rqFeeRow(f){
  var t = window.amFeeType(f.type);
  var bits = [
    f.rate ? f.rate + "%" : "",
    f.flat ? won(f.flat) + "원" : "",
    f.min_fee ? "최소 " + won(f.min_fee) + "원" : "",
    f.max_fee ? "최대 " + won(f.max_fee) + "원" : "",
    rqName(window.AM_FEE_VAT, f.vat),
    rqName(window.AM_FEE_WHEN, f.confirm_when),
    rqName(window.AM_FEE_CYCLE, f.cycle)
  /* ⚠️ 값이 없는 칸은 줄째 뺍니다 (절대 규칙 2) */
  ].filter(Boolean).join(" · ");

  return '<article class="rq-r">'+
    '<div class="rq-hd rq-hd-s">'+
      '<span class="rq-hd-l">'+
        '<b class="rq-no">'+esc(rqPvName(f.provider_id) || f.provider_id)+'</b>'+
        '<span class="rq-m">'+esc((t ? t.name : f.type) + " · " + bits)+'</span>'+
      '</span>'+
      '<span class="rq-hd-r">'+
        '<i class="myq-st myq-'+(f.active === false ? "gray" : "on")+'">'+
          (f.active === false ? "꺼짐" : "켜짐")+'</i>'+
        '<button class="btn btn-o btn-sm" type="button" '+
          'onclick="rqFeeToggle(\''+esc(f.id)+'\','+(f.active === false)+')">'+
          (f.active === false ? "켜기" : "끄기")+'</button>'+
      '</span>'+
    '</div>'+
  '</article>';
}

function rqName(L, k){
  var i, A = L || [];
  for(i = 0; i < A.length; i++) if(A[i].key === k) return A[i].name;
  return "";
}

window.rqFeeToggle = function(id, on){
  rqCall("set_fee_policy_active", { p_id:id, p_active:!!on,
    p_why: on ? "다시 켬" : "끔" }, on ? "켰습니다" : "껐습니다");
};

/* 새 정책 — ⚠️ 고르개로만 만듭니다. 수익모델 · 부가세 · 확정 조건 ·
   정산 주기는 전부 `js/data/fee.js` 에서 오고 **DB 의 enum 과 같은
   값인지는 빌드가 봅니다** (checkDealSql). */
function rqFeeNew(){
  var N = RQ.mctx || {};
  var t = window.amFeeType(N.ftype || "rate");
  var needFlat = t && (t.key === "lead" || t.key === "close" ||
                       t.key === "sub"  || t.key === "base_rate");
  var needRate = t && (t.key === "rate" || t.key === "base_rate");

  return '<details class="rq-new"><summary><b>새 정책 만들기</b></summary>'+
    '<div class="ad-g">'+
      rqSel("rq-fn-pv", "업체", "fpv",
        (RQ.provs || []).map(function(p){ return [p.id, p.name]; }))+
      rqSel("rq-fn-t", "수익모델", "ftype",
        (window.AM_FEE_TYPE || []).map(function(x){ return [x.key, x.name]; }), N.ftype || "rate")+
      rqSel("rq-fn-v", "부가세", "fvat",
        (window.AM_FEE_VAT || []).map(function(x){ return [x.key, x.name]; }), N.fvat || "add")+
      rqSel("rq-fn-w", "확정 조건", "fwhen",
        (window.AM_FEE_WHEN || []).map(function(x){ return [x.key, x.name]; }), N.fwhen || "done")+
      rqSel("rq-fn-c", "정산 주기", "fcycle",
        (window.AM_FEE_CYCLE || []).map(function(x){ return [x.key, x.name]; }), N.fcycle || "monthly")+
    '</div>'+
    '<div class="ad-g">'+
      (needRate ? rqNum("rq-fn-r", "요율 (%)", "frate", "3") : "")+
      (needFlat ? rqNum("rq-fn-f", "정액 (원)", "fflat", "50000") : "")+
      rqNum("rq-fn-min", "최소 수수료 (원 · 선택)", "fmin", "")+
      rqNum("rq-fn-max", "최대 수수료 (원 · 선택)", "fmax", "")+
    '</div>'+
    '<div class="ad-f"><label for="rq-fn-rr">환불 · 환수 조건 <em>(선택)</em></label>'+
      '<input id="rq-fn-rr" type="text" autocomplete="off" '+
      'oninput="rqMctx(\'frefund\',this.value)" value="'+esc(N.frefund || "")+'" '+
      'placeholder="예: 계약 취소 시 전액 환수 · 금액 변경 시 차액 정산"></div>'+
    '<p class="ad-rd-n">⚠️ 요율은 <b>0 초과 100 이하</b>이고 최소 ≤ 최대라야 '+
      '합니다 — 화면에서 한 번, DB 제약이 한 번 더 막습니다.</p>'+
    '<div class="ad-acts">'+
      '<button class="btn btn-b" type="button"'+(RQ.busy ? " disabled" : "")+
        ' onclick="rqFeeSave()">'+icon("plus",18)+'정책 만들기</button>'+
    '</div>'+
  '</details>';
}

function rqSel(id, label, key, opts, cur){
  return '<div class="ad-f"><label for="'+id+'">'+esc(label)+'</label>'+
    '<select id="'+id+'" onchange="rqMctxDraw(\''+key+'\',this.value)">'+
      opts.map(function(o){
        return '<option value="'+esc(o[0])+'"'+
          ((cur || RQ.mctx[key]) === o[0] ? " selected" : "")+'>'+esc(o[1])+'</option>';
      }).join("")+
    '</select></div>';
}
function rqNum(id, label, key, ph){
  return '<div class="ad-f"><label for="'+id+'">'+esc(label)+'</label>'+
    '<input id="'+id+'" type="number" min="0" step="any" inputmode="numeric" '+
    'oninput="rqMctx(\''+key+'\',this.value)" value="'+esc(RQ.mctx[key] || "")+'" '+
    'placeholder="'+esc(ph)+'"></div>';
}
/* ⚠️ 수익모델을 바꾸면 **적는 칸이 바뀝니다** — 그때만 다시 그립니다
   (적는 칸에서 다시 그리면 커서가 빠집니다). */
window.rqMctxDraw = function(k, v){ RQ.mctx[k] = v; rqDraw(); };

window.rqFeeSave = function(){
  if(RQ.busy) return;
  var N = RQ.mctx || {};
  var pv = N.fpv || ((RQ.provs || [])[0] || {}).id;
  if(!pv){ toast("업체를 골라 주세요"); return; }
  var pol = {
    type: N.ftype || "rate",
    vat:  N.fvat  || "add",
    when: N.fwhen || "done",
    cycle:N.fcycle|| "monthly",
    /* ⚠️ `0` 은 값입니다 — 빈 칸만 null 로 둡니다 */
    rate: N.frate === "" || N.frate == null ? null : Number(N.frate),
    flat: N.fflat === "" || N.fflat == null ? null : Number(N.fflat),
    min:  N.fmin  === "" || N.fmin  == null ? null : Number(N.fmin),
    max:  N.fmax  === "" || N.fmax  == null ? null : Number(N.fmax)
  };
  /* ⚠️⚠️ **저장하기 전에** 봅니다 — 저장된 뒤에 틀린 것을 찾으면 그
     정책으로 이미 계산된 건이 생깁니다 (fee.js 머리말). */
  var bad = window.amFeeBadPolicy(pol);
  if(bad){ toast(bad); return; }

  rqCall("save_fee_policy", {
    p_provider: pv,
    p_data: {
      type:pol.type, vat:pol.vat, confirmWhen:pol.when, cycle:pol.cycle,
      rate:pol.rate, flat:pol.flat, minFee:pol.min, maxFee:pol.max,
      refundRule: String(N.frefund || "").trim() || null
    },
    p_why: "새 정책"
  }, "정책을 만들었습니다");
};


/* ════════════════════════════════════════════════════════════════════
   기간별 정산 (2026-10-22 전수검사 P1 ⑭ · §9 · §12 · 0013)

   `settlement` 표는 0001 부터 있었고 **아무 함수도 안 썼습니다** —
   `amStore()` · `gu` · `withEquip` 과 같은 "만들어 놓고 안 쓰는 칸"
   의 제일 비싼 판이었습니다.

   ⚠️⚠️ **'입금' 으로 만드는 단추가 없습니다.** 입금의 진실은 건별
   `mark_paid()` 이고 `build_settlement()` 이 그걸 **세어서** 정합니다 —
   여기에 단추를 두면 §13 이 금지한 "가짜 정산" 의 길이 하나 더
   생깁니다. 사람이 누를 수 있는 것은 **보류 · 보류 풀기**뿐입니다.
   ⚠️⚠️ **`total` 은 그 시점의 사본**입니다 (정책 사본과 같은 까닭) —
   나중에 요율이나 계약금액이 바뀌어도 이미 보낸 청구서가 따라
   바뀌면 안 됩니다. 그래서 화면이 **언제 센 값인가**를 같이 냅니다.
   ════════════════════════════════════════════════════════════════════ */

function rqSettles(){
  /* ⚠️ 관리자만입니다 — 직원은 돈을 안 봅니다 (api/me.js 와 같은 선).
     화면이 거르는 것이 아니라 **서버가 안 보냅니다.** */
  if(RQ.role !== "admin") return "";
  var S = RQ.settles || [];
  var wait = S.filter(function(x){ return x.state === "wait"; }).length;
  var hold = S.filter(function(x){ return x.state === "hold"; }).length;

  return '<section class="ad-s rq-s rq-s-set">'+
    '<h2>기간별 정산</h2>'+
    '<p class="ad-lead">'+
      (S.length
        ? '정산 <b>'+S.length+'건</b>'+
          (wait ? ' · 입금 대기 <b>'+wait+'건</b>' : '')+
          (hold ? ' · 보류 <b>'+hold+'건</b>' : '')
        : '아직 집계한 정산이 없습니다.')+
      ' 업체와 기간을 고르고 <b>집계하기</b>를 누르면 '+
      '<b>그 기간에 확정된 수수료</b>를 세어 청구서 한 줄을 만듭니다.</p>'+
    '<p class="f-h">⚠️ <b>확정된 것만</b> 셉니다 — 확정 전인 건을 '+
      '계약금액으로 섞으면 받을 돈이 열 배로 부풀려집니다. '+
      '⚠️⚠️ <b>입금은 손으로 두지 않습니다</b> — 건별 입금 확인을 '+
      '하시면 다시 집계할 때 저절로 바뀝니다.</p>'+
    rqSetNew()+
    (S.length ? '<div class="rq-g">'+ S.map(rqSetRow).join("") +'</div>' : "")+
  '</section>';
}

window.rqSctx = function(k, v){ RQ.sctx[k] = v; };

function rqSetNew(){
  var N = RQ.sctx || {};
  var P = RQ.provs || [];
  return '<details class="rq-new"><summary><b>기간 정산 집계하기</b></summary>'+
    (!P.length
      ? '<p class="ad-empty">DB 에 등록된 업체가 없습니다.</p>'
      : '<div class="ad-g">'+
        '<div class="ad-f"><label for="rq-st-pv">업체</label>'+
          '<select id="rq-st-pv" onchange="rqSctx(\'spv\',this.value)">'+
            P.map(function(p){
              return '<option value="'+esc(p.id)+'"'+
                (N.spv === p.id ? " selected" : "")+'>'+esc(p.name)+'</option>';
            }).join("")+
          '</select></div>'+
        '<div class="ad-f"><label for="rq-st-f">시작일</label>'+
          '<input id="rq-st-f" type="date" '+
          'oninput="rqSctx(\'sfrom\',this.value)" value="'+esc(N.sfrom || "")+'"></div>'+
        '<div class="ad-f"><label for="rq-st-t">끝일</label>'+
          '<input id="rq-st-t" type="date" '+
          'oninput="rqSctx(\'sto\',this.value)" value="'+esc(N.sto || "")+'"></div>'+
      '</div>'+
      '<p class="ad-rd-n">⚠️ 같은 업체 · 같은 기간을 다시 집계하면 '+
        '<b>그 줄을 덮습니다</b> (줄이 늘지 않습니다). '+
        '보류로 세워 둔 줄은 <b>안 풀립니다</b>.</p>'+
      '<div class="ad-acts">'+
        '<button class="btn btn-b" type="button"'+(RQ.busy ? " disabled" : "")+
          ' onclick="rqSetGo()">'+icon("calc",18)+'집계하기</button>'+
      '</div>')+
  '</details>';
}

window.rqSetGo = function(){
  if(RQ.busy) return;
  var N = RQ.sctx || {};
  var pv = N.spv || ((RQ.provs || [])[0] || {}).id;
  if(!pv){ toast("업체를 골라 주세요"); return; }
  /* ⚠️ 화면에서 먼저 봅니다 — DB 도 막지만, 왕복 한 번을 아끼고
     사람 말로 알려 드립니다 (amDealMove 를 앞단에 둔 것과 같은 까닭). */
  if(!N.sfrom || !N.sto){ toast("기간을 골라 주세요"); return; }
  if(N.sfrom > N.sto){ toast("기간이 거꾸로입니다"); return; }
  rqCall("build_settlement", {
    p_provider: pv, p_from: N.sfrom, p_to: N.sto, p_why: "기간 정산 집계"
  }, "정산을 집계했습니다");
};

function rqSetRow(x){
  var st = x.state === "paid" ? ["ok","입금"]
         : x.state === "hold" ? ["warn","보류"] : ["on","입금 대기"];
  return '<article class="rq-r">'+
    '<div class="rq-hd rq-hd-s">'+
      '<span class="rq-hd-l">'+
        '<b class="rq-no">'+esc(rqPvName(x.provider_id))+'</b>'+
        '<span class="rq-m">'+
          esc(String(x.from_date || "").slice(0,10)+' ~ '+
              String(x.to_date || "").slice(0,10))+
          ' · 청구 '+esc(won(x.total) + "원")+
          /* ⚠️⚠️ **언제 센 값인가**를 같이 냅니다 — 사본이라 지금의
             계약 상태와 다를 수 있습니다. */
          (x.approved_at ? ' · 집계 '+esc(String(x.approved_at).slice(0,10)) : '')+
        '</span>'+
      '</span>'+
      '<span class="rq-hd-r">'+
        '<i class="myq-st myq-'+st[0]+'">'+st[1]+'</i>'+
        (x.state === "paid"
          /* ⚠️ 입금으로 집계된 줄에는 **보류 단추를 안 냅니다** — DB 가
             거절하는 길이라, 내면 누를 때마다 실패하는 단추입니다. */
          ? ''
          : '<button class="btn '+(x.state === "hold" ? "btn-b" : "btn-o")+' btn-sm" '+
            'type="button" onclick="rqSetHold(\''+esc(x.id)+'\','+
            (x.state !== "hold")+')">'+
            (x.state === "hold" ? "보류 풀기" : "보류")+'</button>')+
      '</span>'+
    '</div>'+
  '</article>';
}

/* ⚠️ **사유 없는 보류는 다음 사람이 어떻게 다룰지 모릅니다** (§8) —
   DB 도 거절하지만 여기서 먼저 받습니다. */
window.rqSetHold = function(id, on){
  if(RQ.busy) return;
  var why = "";
  if(on){
    why = String(prompt("보류하는 까닭을 적어 주세요 (기록에 남습니다)") || "").trim();
    if(!why){ toast("보류 사유를 적어 주세요"); return; }
  } else {
    why = String(prompt("보류를 푸는 까닭을 적어 주세요 (선택)") || "").trim();
  }
  rqCall("hold_settlement", { p_id:id, p_hold:!!on, p_why: why || null },
    on ? "보류했습니다" : "보류를 풀었습니다");
};


/* ════════════════════════════════════════════════════════════════════
   2차 — 업체 승인 (전면 감사 §6 의 3 · §7)

   ⚠️⚠️ **등록과 승인이 다른 문입니다.** 직원이 등록하고 **관리자가**
   공개합니다 — 한 사람이 등록하고 자기가 켜면 교차 확인이 없습니다
   (계약을 따는 사람과 수수료를 확정하는 사람을 가른 것과 같은 까닭).
   ⚠️⚠️ **확인 배지는 서류를 실제로 본 것만** 켭니다. 업체가 "확인했다"
   고 말했다고 켜면 그건 지어낸 신뢰입니다 (절대 규칙 1 · 표시 · 광고의
   공정화에 관한 법률 제3조).
   ════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════
   업체 입점 신청 (2026-10-25 진단 P1-7 · 0016)

   `/join` 으로 들어온 신청이 **슬랙으로만** 가고 있었습니다. 채널 글이
   묻히면 그 업체는 사라지고, 직원은 전화하려고 그 글을 찾아 **업체명 ·
   번호 · 하는 일을 다시 손으로 칩니다.**

   ⚠️⚠️ **여기서 `provider` 를 만들지 않습니다.** 신청은 아직 업체가
   아닙니다 — 통화도 안 해 봤고 계약도 없습니다. 통화해서 합의가 되면
   **관리자 설정 9번 칸**이 `provider` 줄을 만들고, 그 다음에 여기서
   `등록 완료` 로 두면 이 신청이 그 업체를 가리킵니다.
   ⚠️ 그래서 이 구간에 "바로 등록" 단추가 없습니다 — 있으면 통화도 안
   한 회사가 배정 고르개에 서고, 거기 배정되면 그 순간 손님 성함 ·
   연락처가 넘어갑니다 (개인정보보호법 제17조 제2항).
   ════════════════════════════════════════════════════════════════════ */

function rqApplies(){
  if(RQ.role !== "staff" && RQ.role !== "admin") return "";
  var A = RQ.applies || [];
  /* ⚠️ **세는 값**입니다 — 손으로 적으면 처리한 뒤에도 그 수가 남습니다 */
  var nNew = A.filter(function(x){ return x.state === "new";    }).length;
  var nCal = A.filter(function(x){ return x.state === "called"; }).length;

  return '<section class="ad-s rq-s rq-s-ap">'+
    '<h2>업체 입점 신청</h2>'+
    (!A.length
      ? '<p class="ad-empty">아직 들어온 입점 신청이 없습니다. '+
        '<b>/join</b> 으로 신청이 들어오면 여기에 쌓입니다.</p>'
      : '<p class="ad-lead">'+
          (nNew ? '<b>'+nNew+'곳</b>이 아직 통화 전입니다. ' : '')+
          (nCal ? '<b>'+nCal+'곳</b>은 통화했고 등록이 남았습니다. ' : '')+
          '통화해서 합의가 되면 <b>관리자 설정 9번 칸</b>에서 업체 줄을 '+
          '만들고, 그 다음에 여기서 <b>등록 완료</b>로 두세요.</p>'+
        '<p class="f-h">⚠️ 여기서 바로 업체가 되는 것이 아닙니다 — '+
          '통화도 안 한 회사가 배정 고르개에 서면 그 순간 손님 성함 · '+
          '연락처가 넘어갑니다 (개인정보보호법 제17조 제2항).</p>'+
        '<div class="rq-g">'+ A.map(rqApplyRow).join("") +'</div>')+
  '</section>';
}

function rqApplyRow(a){
  var open = RQ.apOf === a.id;
  var nm = (typeof amApplyName === "function") ? amApplyName(a.state) : "";
  var tn = (typeof amApplyTone === "function") ? amApplyTone(a.state) : "gray";
  var meta = [String(a.created_at || "").slice(0, 10),
              a.region || "", a.industry || "",
              (a.services || []).length ? "하는 일 " + a.services.length : ""]
             .filter(Boolean).join(" · ");
  return '<article class="rq-r">'+
    '<div class="rq-hd rq-hd-s">'+
      '<span class="rq-hd-l">'+
        '<b class="rq-no">'+esc(a.company)+'</b>'+
        '<span class="rq-m">'+esc(meta)+'</span>'+
      '</span>'+
      '<span class="rq-hd-r">'+
        /* ⚠️ 이름을 화면에 적지 않습니다 — `js/data/deal.js` 한 곳이고
           `checkDealSql()` 이 DB 의 enum 과 빌드마다 맞춰 봅니다.
           ⚠️ 모르는 값이면 **key 를 그대로** 냅니다 — 빈 딱지로 두면
           어긋난 것을 아무도 모릅니다 (여기서 보이면 한쪽만 고친
           것입니다). */
        '<i class="myq-st myq-'+esc(tn)+'">'+esc(nm || a.state)+'</i>'+
        '<button class="btn btn-o btn-sm" type="button" aria-expanded="'+
          (open ? "true" : "false")+'" '+
          'onclick="rqApOpen(\''+esc(a.id)+'\')">'+
          (open ? "접기" : "열기")+'</button>'+
      '</span>'+
    '</div>'+
    (open ? rqApplyBody(a) : "")+
  '</article>';
}

function rqApplyBody(a){
  var C = RQ.actx || {};
  var to = C.to || "";
  var svc = (a.services || []).filter(Boolean);
  return '<div class="rq-bd">'+
    '<dl class="rq-con">'+
      rqConItem("접수번호", a.no)+
      rqConItem("담당자", a.name)+
      /* ⚠️ 번호에서 **숫자만** 남겨 `tel:` 을 만듭니다 — 하이픈이 섞인
         채로 넣으면 기기마다 못 거는 데가 있습니다. */
      (a.tel ? '<dt>연락처</dt><dd><a class="rq-tel" href="tel:'+
         esc(String(a.tel).replace(/[^0-9+]/g, ""))+'">'+esc(a.tel)+'</a></dd>' : '')+
      rqConItem("이메일", a.email)+
      rqConItem("사업자등록번호", a.brn)+
      rqConItem("주로 하시는 업종", a.industry)+
      (svc.length ? '<dt>하시는 일</dt><dd>'+esc(svc.join(" · "))+'</dd>' : '')+
      rqConItem("더 하신 말씀", a.note)+
      rqConItem("마지막 메모", a.memo)+
      /* 등록까지 끝난 신청은 **어느 업체인지**가 남습니다 */
      rqConItem("등록된 업체", a.provider_id)+
    '</dl>'+
    '<div class="rq-mv">'+
      '<div class="ad-f">'+
        '<label for="rq-ap-to">상태 바꾸기</label>'+
        '<select id="rq-ap-to" class="sel" onchange="rqActx(\'to\',this.value)">'+
          '<option value="">골라 주세요</option>'+
          (window.AM_APPLY_ST || []).map(function(st){
            if(st.key === a.state) return "";
            return '<option value="'+esc(st.key)+'"'+
              (to === st.key ? " selected" : "")+'>'+esc(st.name)+'</option>';
          }).join("")+
        '</select>'+
      '</div>'+
      /* ⚠️⚠️ **등록 완료는 그 업체를 가리켜야 합니다.** 안 가리키면
         "등록했다" 는 말만 남고 어느 업체인지가 사라집니다 — DB 가
         거절하지만, 고를 자리를 안 주면 누를 때마다 실패하는 단추가
         됩니다 (§30-7). */
      (to === "done" ? rqApplyPvPick(a) : "")+
      '<div class="ad-f">'+
        '<label for="rq-ap-why">사유 · 메모'+
          (to === "drop" ? ' <em>(진행 안 함은 반드시)</em>' : '')+'</label>'+
        '<input id="rq-ap-why" type="text" autocomplete="off" '+
          'oninput="rqActx(\'why\',this.value)" value="'+esc(C.why || "")+'" '+
          'placeholder="예: 통화함 · 다음 주에 다시 연락">'+
      '</div>'+
      '<button class="btn btn-b" type="button"'+(RQ.busy ? " disabled" : "")+
        ' onclick="rqApGo(\''+esc(a.id)+'\')">바꾸기</button>'+
    '</div>'+
    '<p class="f-h">⚠️ 바꾼 사람 · 시각 · 사유가 <b>이력에 남습니다</b> '+
      '(§8) — 다만 <b>상호 · 성함 · 번호는 기록에 안 적습니다.</b> '+
      '⚠️ 업체가 적어 보낸 연락처라 <b>직원 · 관리자 밖으로는 한 글자도 '+
      '안 나갑니다.</b></p>'+
  '</div>';
}

/* 등록한 업체 고르개 — ⚠️ 목록은 `api/me.js` 가 보낸 것 그대로입니다
   (화면이 거르지 않습니다). 아직 업체가 하나도 없으면 **고를 것이
   없다고 그대로 말합니다** (절대 규칙 2). */
function rqApplyPvPick(a){
  var P = RQ.provs || [], C = RQ.actx || {};
  if(!P.length)
    return '<p class="note-box">DB 에 등록된 업체가 없습니다 — '+
      '<b>관리자 설정 9번 칸</b>에서 이 업체의 등록 줄을 먼저 만드세요.</p>';
  return '<div class="ad-f">'+
    '<label for="rq-ap-pv">등록한 업체</label>'+
    '<select id="rq-ap-pv" class="sel" onchange="rqActx(\'pv\',this.value)">'+
      '<option value="">골라 주세요</option>'+
      P.map(function(p){
        return '<option value="'+esc(p.id)+'"'+
          ((C.pv || a.provider_id) === p.id ? " selected" : "")+'>'+
          esc(p.name)+'</option>';
      }).join("")+
    '</select>'+
  '</div>';
}

window.rqApOpen = function(id){
  RQ.apOf = (RQ.apOf === id) ? "" : id;
  /* ⚠️ 다른 줄을 펼치면 **적던 것을 치웁니다** — 안 치우면 앞 줄에
     적은 사유가 다음 줄의 칸에 그대로 남습니다 (이력에서 겪은 자리). */
  RQ.actx = {};
  rqDraw();
};

/* ⚠️⚠️ **적는 칸에서는 다시 그리지 않습니다.** `rqDraw()` 를 부르면
   한 글자 칠 때마다 커서가 칸에서 빠집니다 (업체 빠른 등록에서 겪은
   자리) — 들고만 있습니다.
   ⚠️ 상태 고르개는 **다시 그려야** 합니다 (`등록 완료` 를 고르면 업체
   고르개가 생겨야 합니다) — 그 칸은 `<select>` 라 커서가 없습니다. */
window.rqActx = function(k, v){
  RQ.actx[k] = v;
  if(k === "to") rqDraw();
};

window.rqApGo = function(id){
  var C = RQ.actx || {};
  if(!C.to){ toast("바꿀 상태를 골라 주세요"); return; }
  /* ⚠️ DB 도 막지만 **왕복 한 번을 아끼고 먼저 말해 줍니다** — 자물쇠는
     DB 쪽입니다 (화면 코드로만 막으면 버그 하나에 뚫립니다). */
  if(C.to === "drop" && !String(C.why || "").trim()){
    toast("진행하지 않는 까닭을 적어 주세요"); return; }
  if(C.to === "done" && !C.pv){
    toast("등록한 업체를 골라 주세요"); return; }
  /* ⚠️⚠️ **이 길이 요구한 것만 보냅니다.** 들고 있는 것을 통째로
     보내면, 등록하다 마음을 바꿔 보류로 넘길 때 엉뚱한 업체가 기록에
     같이 남습니다 (배정에서 적어 둔 그 규칙). */
  var args = { p_apply:id, p_to:C.to };
  if(C.to === "done") args.p_provider = C.pv;
  if(String(C.why || "").trim()) args.p_why = String(C.why).trim();
  /* ⚠️⚠️ **조사를 손으로 적지 마세요.** 상태 이름이 "통화함"(받침 있음) ·
     "등록 완료"(없음) 로 갈려서 "으로/로" 가 둘 다 나옵니다 —
     `koWith()` 가 고릅니다 (이 저장소가 "인수인계은" 으로 겪은 자리).
     ⚠️ 변수 뒤에 띄어 붙이지도 않습니다 ("완료 으로" 가 됩니다). */
  var nm = (typeof amApplyName === "function" ? amApplyName(C.to) : "") || C.to;
  rqCall("set_apply_state", args,
    "입점 신청을 " + koWith(nm, "으로로") + " 두었습니다");
};

function rqProvs(){
  if(RQ.role !== "staff" && RQ.role !== "admin") return "";
  var P = RQ.provs || [];
  var off = P.filter(function(p){ return !p.listed; }).length;
  /* ⚠️⚠️ **공개와 배정 가능은 다른 것입니다** — 공개는 손님에게 보이는가,
     배정 가능은 신청을 넘겨도 되는가(계약이 되어 있는가)입니다. */
  var noAsg = P.filter(function(p){ return p.assignable === false; }).length;
  /* ⚠️ **세는 값**입니다 — 담당자를 적어 둔 곳이 몇인지 손으로 적으면
     채운 뒤에도 그 수가 남습니다 (adReady() 와 같은 까닭). */
  var noCon = P.filter(function(p){ return !rqPvCon(p.id); }).length;

  return '<section class="ad-s rq-s rq-s-pv">'+
    '<h2>업체 · 공개 승인</h2>'+
    (!P.length
      ? '<p class="ad-empty">DB 에 등록된 업체가 없습니다. '+
        '아래 <b>관리자 설정</b> 의 9번 칸에서 등록 줄을 만드세요.</p>'
      : '<p class="ad-lead">'+
          (off ? '<b>'+off+'곳</b>이 아직 공개 전입니다. ' : '')+
          '공개 전인 업체도 <b>배정 고르개에는 보입니다</b> — '+
          '손님 목록에만 안 나옵니다.'+
          (noAsg ? ' <b>'+noAsg+'곳</b>은 <b>배정 가능</b>이 꺼져 있어 '+
            '배정 고르개에서 잠겨 있습니다 — 제휴 계약을 확인하고 켜 주세요.' : '')+
          (noCon ? ' <b>'+noCon+'곳</b>은 <b>담당자</b>가 안 적혀 있어 '+
            '배정하고 걸 곳이 대표번호뿐입니다.' : '')+
          (RQ.role === "admin" ? ''
            : ' ⚠️ 공개 · 배정 가능을 켜는 것은 <b>관리자만</b> 할 수 있습니다.')+
        '</p>'+
        '<p class="f-h">⚠️ <b>공개</b>는 손님 목록에 보이는가이고, '+
          '<b>배정 가능</b>은 신청을 넘겨도 되는가입니다 — 둘은 다릅니다. '+
          '구두 합의 단계에서 배정되면 그 순간 성함 · 연락처가 그 업체로 '+
          '넘어갑니다 (개인정보보호법 제17조 제2항).</p>'+
        '<div class="rq-g">'+ P.map(rqProvRow).join("") +'</div>')+
  '</section>';
}

function rqProvRow(p){
  var subs = (p.subs || []).length, regs = (p.regions || []).length;
  var c = rqPvCon(p.id);
  return '<article class="rq-r">'+
    '<div class="rq-hd rq-hd-s">'+
      '<span class="rq-hd-l">'+
        '<b class="rq-no">'+esc(p.name)+'</b>'+
        '<span class="rq-m">'+
          esc([subs ? "하는 일 " + subs : "", regs ? "지역 " + regs : "",
               (p.industries || []).length ? "업종 " + p.industries.length : ""]
              .filter(Boolean).join(" · "))+'</span>'+
      '</span>'+
      '<span class="rq-hd-r">'+
        '<i class="myq-st myq-'+(p.listed ? "ok" : "gray")+'">'+
          (p.listed ? "공개" : "공개 전")+'</i>'+
        /* ⚠️ 꺼진 것을 **회색이 아니라 주황**으로 냅니다 — 회색이면
           "그냥 아직" 으로 읽히는데, 이건 배정이 막혀 있다는 뜻입니다. */
        '<i class="myq-st myq-'+(p.assignable === false ? "warn" : "ok")+'">'+
          (p.assignable === false ? "배정 불가" : "배정 가능")+'</i>'+
        (RQ.role === "admin"
          ? '<button class="btn '+(p.listed ? "btn-o" : "btn-b")+' btn-sm" type="button" '+
            'onclick="rqProvGo(\''+esc(p.id)+'\','+(!p.listed)+')">'+
            (p.listed ? "내리기" : "공개하기")+'</button>'+
            '<button class="btn '+(p.assignable === false ? "btn-b" : "btn-o")+' btn-sm" type="button" '+
            'onclick="rqAsgGo(\''+esc(p.id)+'\','+(p.assignable === false)+')">'+
            (p.assignable === false ? "배정 가능으로" : "배정 막기")+'</button>'
          : '')+
        '<button class="btn btn-o btn-sm" type="button" aria-expanded="'+
          (RQ.pvOf === p.id ? "true" : "false")+'" '+
          'onclick="rqPvConOpen(\''+esc(p.id)+'\')">'+
          (c ? "담당자 보기" : "담당자 적기")+'</button>'+
      '</span>'+
    '</div>'+
    (RQ.pvOf === p.id ? rqPvConForm(p, c) : "")+
  '</article>';
}

/* ── 업체 담당자 (2026-10-22 전수검사 P1 ⑬) ──────────────────────
   배정하고 **전화할 사람**입니다. 지금은 걸 곳이 업체 대표번호뿐이라,
   현장에 있는 담당자에게 닿는 데 하루가 갑니다.

   ⚠️⚠️ **`provider` 가 아니라 별도 표입니다** (`provider_contact`).
   0001 의 `grant select on provider to authenticated` 가 **표째**라,
   거기 직통 번호를 넣으면 `listed=true` 인 줄을 **로그인한 손님
   전부가** 읽습니다 — RLS 는 줄은 막아도 칸은 못 막습니다.
   ⚠️ **한 번에 한 업체만 펼칩니다** — 스물을 한꺼번에 펼쳐 두면
   직통 번호가 한 화면에 깔립니다 (목록에 고객 연락처를 안 깔는
   것과 같은 선).
   ⚠️⚠️ **감사 기록에 이름 · 번호가 안 갑니다** — 기록은 못 지우는
   것이라, 거기 번호를 박으면 그 자체가 또 하나의 보관입니다.
   ────────────────────────────────────────────────────────────── */
function rqPvCon(id){
  return (RQ.contacts || []).filter(function(c){ return c.provider_id === id; })[0] || null;
}

window.rqPvConOpen = function(id){
  RQ.pvOf = (RQ.pvOf === id) ? "" : id;
  /* ⚠️ 펼칠 때 **그 업체 값으로 칸을 채웁니다** — 비워 두고 저장하면
     문이 "넷이 다 비었다" 로 읽어 줄째 지웁니다 (실제로 그랬습니다). */
  if(RQ.pvOf){
    var c = rqPvCon(id) || {};
    RQ.pctx = { pname:c.name || "", ptel:c.tel || "",
                pmail:c.email || "", pmemo:c.memo || "" };
  } else RQ.pctx = {};
  rqDraw();
};

window.rqPctx = function(k, v){ RQ.pctx[k] = v; };

function rqPvConForm(p, c){
  var N = RQ.pctx || {};
  return '<div class="rq-bd rq-con-f">'+
    '<p class="f-h">⚠️ 이 칸은 <b>직원 · 관리자에게만</b> 보입니다 — '+
      '손님 화면에는 한 글자도 안 나갑니다. '+
      (c ? '마지막으로 고친 날 '+esc(String(c.updated_at || "").slice(0,10))
         : '아직 적어 둔 담당자가 없습니다')+'</p>'+
    '<div class="ad-g">'+
      '<div class="ad-f"><label for="rq-pc-n">담당자 이름</label>'+
        '<input id="rq-pc-n" type="text" autocomplete="off" '+
        'oninput="rqPctx(\'pname\',this.value)" value="'+esc(N.pname || "")+'" '+
        'placeholder="예: 김과장"></div>'+
      '<div class="ad-f"><label for="rq-pc-t">직통 · 휴대폰</label>'+
        '<input id="rq-pc-t" type="tel" autocomplete="off" inputmode="tel" '+
        'oninput="rqPctx(\'ptel\',this.value)" value="'+esc(N.ptel || "")+'" '+
        'placeholder="예: 010-0000-0000"></div>'+
      /* ⚠️⚠️ **이 칸이 비어 있으면 배정 알림이 안 갑니다** (2026-10-25
         P1-5). 전에는 "선택" 이라고만 적혀 있어서 안 채우고 넘어가기
         쉬웠는데, 지금은 업체가 배정을 아는 **유일한 길**입니다. */
      '<div class="ad-f"><label for="rq-pc-m">메일 '+
        '<em>(배정 알림이 이 주소로 갑니다)</em></label>'+
        '<input id="rq-pc-m" type="email" autocomplete="off" '+
        'oninput="rqPctx(\'pmail\',this.value)" value="'+esc(N.pmail || "")+'" '+
        'placeholder="예: damdang@gonggi.co.kr"></div>'+
    '</div>'+
    '<div class="ad-f"><label for="rq-pc-o">메모 <em>(선택)</em></label>'+
      '<input id="rq-pc-o" type="text" autocomplete="off" '+
      'oninput="rqPctx(\'pmemo\',this.value)" value="'+esc(N.pmemo || "")+'" '+
      'placeholder="예: 오전에만 통화 가능 · 현장에 있을 때가 많습니다"></div>'+
    (N.ptel ? '<p class="ad-rd-n">'+
      '<a class="rq-tel" href="tel:'+esc(String(N.ptel).replace(/[^0-9+]/g,""))+'">'+
      icon("phone",18)+esc(N.ptel)+'</a></p>' : "")+
    '<p class="ad-rd-n">⚠️ 메일을 비워 두시면 <b>배정 알림이 안 갑니다</b> — '+
      '그 업체는 로그인해서 들어와 봐야 압니다. '+
      '알림에는 신청하신 분의 성함 · 연락처를 싣지 않습니다.</p>'+
    '<p class="ad-rd-n">⚠️ 넷을 다 비워서 저장하면 <b>줄째 지웁니다</b> '+
      '(담당자가 그만두셨을 때). 바뀐 것은 기록에 남지만 '+
      '<b>이름과 번호는 기록에 안 적습니다</b>.</p>'+
    '<div class="ad-acts">'+
      '<button class="btn btn-b" type="button"'+(RQ.busy ? " disabled" : "")+
        ' onclick="rqPvConSave(\''+esc(p.id)+'\')">'+icon("check",18)+'담당자 저장</button>'+
    '</div>'+
  '</div>';
}

window.rqPvConSave = function(id){
  if(RQ.busy) return;
  var N = RQ.pctx || {};
  rqCall("save_provider_contact", {
    p_provider: id,
    p_data: { name: String(N.pname || "").trim(), tel: String(N.ptel || "").trim(),
              email: String(N.pmail || "").trim(), memo: String(N.pmemo || "").trim() },
    p_why: "업체에서 받아 왔습니다"
  }, "담당자를 저장했습니다");
};

/* ⚠️⚠️ **켜는 것은 "계약서를 봤다" 는 뜻입니다.** 구두 합의만으로
   켜면 계약 전에 손님의 성함 · 연락처가 그 업체로 넘어갑니다
   (개인정보보호법 제17조 제2항) — 그래서 켤 때 한 번 물어봅니다. */
window.rqAsgGo = function(id, on){
  if(on && !confirm("제휴 계약을 확인하셨습니까?\n켜면 이 업체에 신청을 배정할 수 있고, " +
                    "배정하면 손님의 성함 · 연락처가 그 업체로 넘어갑니다."))
    return;
  rqCall("approve_provider", { p_id:id, p_assignable:!!on,
    p_why: on ? "배정 가능 (계약 확인)" : "배정 막음" },
    on ? "배정 가능으로 켰습니다" : "배정을 막았습니다");
};

window.rqProvGo = function(id, on){
  /* ⚠️ 내리는 것은 되돌릴 수 있지만 손님 화면에서 바로 사라집니다 —
     한 번 물어봅니다 (지우는 단추와 같은 규칙). */
  if(!on && !confirm("이 업체를 손님 목록에서 내릴까요?")) return;
  rqCall("approve_provider", { p_id:id, p_listed:!!on,
    p_why: on ? "공개" : "내림" }, on ? "공개했습니다" : "내렸습니다");
};


/* ════════════════════════════════════════════════════════════════════
   2차 — 신청 한 건의 이력 (전면 감사 §6 의 8 · §8)

   ⚠️⚠️ **목록에 다 붙이지 않습니다.** 신청 쉰 건의 이력을 통째로
   내리면 사유에 적힌 사정까지 한 화면에 깔립니다 — 화면 하나가 곧
   유출입니다. **연 건 하나만** 가져옵니다.
   ════════════════════════════════════════════════════════════════════ */

/* 펼친 줄 안의 **이력 단추 + 이력**. ⚠️ 단추를 따로 두는 까닭 —
   목록에 이력을 다 붙이면 쉰 건의 사유가 한 화면에 깔립니다. 누른
   건 하나만 서버에 묻습니다 (`api/me.js` 의 `?r=`). */

/* ── 업체가 낸 견적 (0008 · §4 · §6) ───────────────────────────────
   ⚠️⚠️ **고르는 자리가 아닙니다.** 고르는 것은 고객이고(`/my`), 여기는
   직원이 **무엇이 와 있는지 보는** 자리입니다. 전화로 들은 선택을 대신
   적는 길(`choose_quote`)은 고객 화면과 같은 문이라 여기 단추를 또
   만들지 않았습니다 — 두 곳에 두면 "누가 골랐는가" 가 흐려집니다.
   ⚠️ 값이 없는 칸은 아예 안 넣습니다 (절대 규칙 2). `0` 은 값입니다. */
function rqQuotes(r){
  var L = (RQ.quotes || []).filter(function(q){ return q.request_id === r.id; });
  if(!L.length) return "";
  return '<div class="rq-s"><h4>받은 견적 '+L.length+'건</h4>'+
    '<ul class="rq-q">'+L.map(function(q){
      var bits = [];
      if(q.amount != null)
        bits.push(won(q.amount)+"원 · "+
          (typeof amQuoteVat === "function" ? amQuoteVat(q.vat) : ""));
      if(q.days)     bits.push(q.days+"일");
      if(q.start_on) bits.push(amDate(q.start_on)+" 시작");
      return '<li><div class="rq-q-h">'+
          '<b>'+esc(q.provider_id)+'</b>'+
          /* ⚠️ 딱지는 `css/pages.css` 의 `.myq-st` 를 그대로 씁니다 —
             `/my` 와 색이 같아야 한 시스템으로 읽힙니다 (admin.css 가
             적어 둔 그대로입니다). 새 이름을 지으면 그 줄만 스타일이
             안 먹고 에러도 안 납니다. */
          '<i class="myq-st myq-'+esc(typeof amQuoteTone === "function"
            ? amQuoteTone(q.state) : "gray")+'">'+
            esc(typeof amQuoteName === "function" ? amQuoteName(q.state) : q.state)+
          '</i></div>'+
        (bits.length ? '<p class="rq-q-m">'+esc(bits.join(" · "))+'</p>' : "")+
        (q.scope ? '<p class="rq-q-s">'+esc(String(q.scope))+'</p>' : "")+
      '</li>';
    }).join("")+'</ul></div>';
}

function rqHistRow(r){
  var on = RQ.histOf === r.id;
  return '<div class="rq-hist-b">'+
      '<button class="btn btn-o btn-sm" type="button" '+
        'onclick="rqHistGo(\''+esc(r.id)+'\')">'+icon("clock",18)+
        (on ? '이력 닫기' : '이력 보기')+'</button>'+
    '</div>'+ rqHist(r);
}

function rqHist(r){
  if(RQ.histOf !== r.id) return '';
  if(RQ.hist === null)
    return '<div class="rq-as"><b>이력</b><p class="rq-none">불러오는 중…</p></div>';
  if(!RQ.hist.length)
    return '<div class="rq-as"><b>이력</b><p class="rq-none">기록이 없습니다.</p></div>';

  return '<div class="rq-as rq-hist"><b>이력</b><ol>'+
    RQ.hist.map(function(h){
      var d = amDate(String(h.at || "").slice(0, 10));
      var to = window.amDealStName ? amDealStName(h.to_state) : h.to_state;
      var fr = window.amDealStName ? amDealStName(h.from_state) : h.from_state;
      return '<li>'+
        (d ? '<em>'+esc(d)+'</em>' : '')+
        '<span>'+esc((fr ? fr + " → " : "") + (to || ""))+'</span>'+
        /* ⚠️ 가운뎃점으로 가릅니다 — 띄어쓰기만 두었더니 "정보 확인 중
           직원" 으로 읽혀 상태 이름의 일부처럼 보였습니다 (찍어 보고
           알았습니다). 상태 이름에 띄어쓰기가 들어 있어서 그렇습니다. */
        (h.by_role ? ' <i>· '+esc(window.amRoleName ? amRoleName(h.by_role) : h.by_role)+'</i>' : '')+
        (h.why ? '<p>'+esc(h.why)+'</p>' : '')+
      '</li>';
    }).join("") +'</ol>'+
    '<p class="rq-none">⚠️ 기록은 <b>고치거나 지울 수 없습니다</b> — '+
      '고칠 수 있는 기록은 기록이 아닙니다 (§8).</p>'+
  '</div>';
}

window.rqHistGo = function(id){
  if(RQ.histOf === id){ RQ.histOf = ""; RQ.hist = null; rqDraw(); return; }
  RQ.histOf = id; RQ.hist = null; rqDraw();
  fetch("/api/me?r=" + encodeURIComponent(id), { headers: Object.assign(
    { accept:"application/json" }, window.amAuthHeaders()) })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      if(RQ.histOf !== id) return;          /* 그 사이에 닫으셨으면 버립니다 */
      RQ.hist = (d && d.history) || [];
      rqDraw();
    })
    .catch(function(e){
      try{ console.warn("[rq] 이력 — " + e); }catch(_){}
      if(RQ.histOf === id){ RQ.hist = []; rqDraw(); }
    });
};

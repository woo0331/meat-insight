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
           ctx:{} };

/* ── 그리기 ──────────────────────────────────────────────────────── */

function rqDraw(){
  var root = $("rq");
  if(!root) return;

  /* ⚠️⚠️ 로그인이 설정되기 전에는 **아무것도** 안 그립니다 */
  if(!RQ.asked || !RQ.on){ root.innerHTML = ""; return; }

  root.innerHTML =
    '<section class="ad-s rq-s">'+
      '<h2>접수 · 배정</h2>'+
      rqBody()+
    '</section>';
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
  var out = '<div class="chip-g chip-g-fil rq-fil">'+
    '<button class="chip'+(RQ.fil ? "" : " on")+'" type="button" '+
      'onclick="rqFil(\'\')">전체 '+L.length+'</button>';
  (window.AM_DEAL_ST || []).forEach(function(s){
    if(!n[s.key]) return;
    out += '<button class="chip'+(RQ.fil === s.key ? " on" : "")+'" type="button" '+
      'onclick="rqFil(\''+esc(s.key)+'\')">'+esc(s.name)+' '+n[s.key]+'</button>';
  });
  return out + '</div>';
}

window.rqFil = function(k){ RQ.fil = k; RQ.open = ""; RQ.to = ""; rqDraw(); };

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
        (day ? '<em class="rq-d">'+esc(day)+'</em>' : '')+
      '</span>'+
    '</button>'+
    (open ? '<div class="rq-bd">'+ rqMove(r) + rqAsg(r) +'</div>' : '')+
  '</article>';
}

window.rqOpen = function(id){
  RQ.open = (RQ.open === id) ? "" : id;
  RQ.to = ""; RQ.ctx = {};
  rqDraw();
};

/* ⚠️ 적으실 때마다 다시 그리지 않습니다 — 그러면 글을 적던 칸에서
   커서가 튑니다. 값만 들고 있다가 보낼 때 씁니다. */
window.rqCtx = function(k, v){ RQ.ctx[k] = v; };

/* 이름 — ⚠️ 전부 데이터에서 가져옵니다. 화면에 적어 두면 분류를
   늘릴 때마다 여기가 조용히 틀립니다. */
function rqSideName(v){ return v === "start" ? "창업" : v === "close" ? "폐업 · 정리" : ""; }
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
    (sel ? rqNeed(sel) +
      '<div class="ad-acts">'+
        '<button class="btn btn-b" type="button"'+(RQ.busy ? " disabled" : "")+
          ' onclick="rqGo(\''+esc(r.id)+'\')">'+icon("check",18)+
          (RQ.busy ? "보내는 중…" : "이 상태로 바꾸기")+'</button>'+
      '</div>' : '')+
  '</div>';
}

window.rqSetTo = function(v){ RQ.to = v; rqDraw(); };

/* 같이 적어야 하는 것 — ⚠️ 목록은 `AM_DEAL_MOVE` 의 넷째 칸입니다 */
function rqNeed(m){
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

  if(need.indexOf("providerId") >= 0) out += rqPvField();

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
function rqPvField(){
  var P = RQ.provs || [];
  if(!P.length)
    return '<div class="notice-bad">'+
      '<b>등록된 업체가 0곳입니다 — 배정할 곳이 없습니다</b>'+
      '<p>업체를 먼저 등록하셔야 합니다. 위 <b>영업 작업대</b>에서 찾아 '+
      '전화하고, 입점에 동의한 업체를 Supabase 의 <b>provider</b> 표에 '+
      '한 줄 넣으면 여기 고르개에 바로 나옵니다 '+
      '(<b>listed</b> 가 꺼져 있어도 직원 · 관리자에게는 보입니다).</p>'+
    '</div>';

  return '<div class="f-r">'+
    '<label for="rq-pv">배정할 업체</label>'+
    '<select id="rq-pv" class="sel" onchange="rqCtx(\'providerId\',this.value)">'+
      '<option value="">골라 주세요</option>'+
      P.map(function(p){
        return '<option value="'+esc(p.id)+'"'+
          (RQ.ctx.providerId === p.id ? " selected" : "")+'>'+esc(p.name)+
          (p.listed ? "" : " (아직 공개 전)")+'</option>';
      }).join("")+
    '</select>'+
    '<p class="f-h">고르개는 '+P.length+'곳입니다 — 세는 값입니다.</p>'+
  '</div>';
}

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

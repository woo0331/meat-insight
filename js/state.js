/* ════════════════════════════════════════════════════════════════════
   회원 계정에 남는 임시저장 · 체크리스트
   2026-10-18 "매장 운영 전문관 2차" §6-2 · §9

   > §6-2 — "회원 로그인 상태에서는 서버에 임시저장한다."
   > §9    — "로그인한 회원은 체크 상태를 계정에 저장한다."

   담는 것은 셋입니다 — **고르신 서비스 id**(`am.pick.v1`) ·
   **적어 두신 조건 여덟 칸**(`am.draft.v1`) · **체크해 두신 운영
   항목**(`am.opsck.v1`). 표는 `user_state` 한 줄이고 문은 0010 의
   `save_user_state()` 하나입니다.

   ⚠️⚠️ **로그인이 꺼져 있으면 이 파일은 아무 일도 안 합니다.**
   `/api/session` 이 `auth:false` 면 `fetch` 를 **한 번도 안 보내고**
   화면은 오늘과 글자 하나 다르지 않게 돕니다 — 브라우저 저장이
   여전히 주인이고, 이것은 **로그인한 분에게만** 한 겹 더 붙습니다.
   (지금 운영 사이트가 그 상태입니다.)

   ⚠️⚠️ **합치는 규칙은 하나입니다 — 보고 계신 화면이 이깁니다.**

     이 브라우저가 비어 있으면  →  서버 것을 내려받습니다
                                  (다른 기기에서 고르신 것을 잇습니다)
     이 브라우저에 뭔가 있으면  →  그대로 두고 **서버에 올립니다**

   합집합(union)으로 섞지 않습니다. 섞으면 폰에서 **지운 것이 PC 에서
   되살아나고**, 그걸 본 사장님은 자기가 지운 줄을 의심하게 됩니다 —
   "고른 것과 넘어가는 것이 다릅니다" 가 이 저장소에서 제일 나쁜
   종류입니다. 지금 눈앞의 화면이 늘 맞습니다.

   ⚠️⚠️ **성함 · 연락처는 한 글자도 안 올립니다.** 올라가는 것은 조건
   여덟 칸(상황 · 필요한 일 · 업종 · 지역 · 시군구 · 평수 · 예산 ·
   일정)까지이고, **0010 의 트리거가 그 밖의 칸을 거절합니다** — 화면
   버그로 섞여 들어와도 표에 안 들어갑니다 (화면을 믿지 않습니다).

   ⚠️⚠️ **실패하면 성공했다고 말하지 않습니다** (§15). 못 올렸으면
   운영자 로그에만 남기고 화면의 "서버에도 저장됨" 표시를 **켜지
   않습니다** — 브라우저에는 그대로 남아 있으니 손님이 잃는 것은
   없습니다.
   ════════════════════════════════════════════════════════════════════ */

/* `on` 은 **로그인이 켜져 있고 들어와 계신가**입니다.
   ⚠️ `pulled` 를 따로 두는 까닭 — 내려받는 중에 `amPickSet()` 이
   불리는데, 그때 또 올리면 왕복이 끝나지 않습니다. */
var AM_ST = { asked:false, on:false, pulled:false, at:0, busy:false,
              timer:null, want:{} };

function amStateLog(e){
  /* ⚠️ 운영자에게만 — 손님은 아무 잘못도 안 했습니다 (절대 규칙 3) */
  try{ console.warn("[state] " + e); }catch(_){}
}

/* 이 브라우저에 들어 있는 셋 — ⚠️ 저장이 막힌 브라우저에서도
   던지지 않게 전부 감싼 읽기만 씁니다 */
function amStateLocal(){
  var pick = (typeof amPickGet === "function") ? amPickGet() : [];
  var draft = null, checks = [];
  try{
    var d = JSON.parse(localStorage.getItem("am.draft.v1") || "null");
    if(d && d.f) draft = d.f;
  }catch(e){}
  try{
    var c = JSON.parse(localStorage.getItem("am.opsck.v1") || "null");
    if(c && c.done) checks = c.done;
  }catch(e){}
  return { pick:pick, draft:draft, checks:checks };
}

function amStateEmpty(L){
  return !L.pick.length && !L.checks.length &&
         (!L.draft || !Object.keys(L.draft).length);
}

/* ── 서버에서 내려받아 이 브라우저에 적습니다 ─────────────────────
   ⚠️ 화면을 다시 그리지 않고 **제자리에서** 맞춥니다 — 적던 칸이
   비워지면 안 됩니다 (`pickPaint()` 와 같은 규칙). */
function amStateApply(st){
  if(!st) return;
  AM_ST.pulled = true;
  try{
    if(Array.isArray(st.pick) && st.pick.length && typeof amPickSet === "function")
      amPickSet(st.pick);
    if(st.draft && Object.keys(st.draft).length)
      localStorage.setItem("am.draft.v1",
        JSON.stringify({ f:st.draft, at:Date.parse(st.updated_at) || Date.now() }));
    if(Array.isArray(st.checks) && st.checks.length)
      localStorage.setItem("am.opsck.v1",
        JSON.stringify({ done:st.checks, at:Date.parse(st.updated_at) || Date.now() }));
  }catch(e){ amStateLog("내려받은 것을 못 적었습니다 — " + e); }
  AM_ST.pulled = false;

  /* 이미 그려진 화면을 맞춥니다 — 있는 것만 부릅니다 */
  try{ if(typeof pickPaint === "function") pickPaint(); }catch(e){}
  try{ if(typeof quoteDraftPaint === "function") quoteDraftPaint(); }catch(e){}
  try{ if(typeof opsCheckPaint === "function") opsCheckPaint(); }catch(e){}
}

/* ── 올리기 (0010 의 문 하나) ─────────────────────────────────────
   ⚠️ 보낸 칸만 바뀝니다 — 안 보낸 칸은 DB 가 그대로 둡니다. 그래서
   `/operation` 의 체크가 `/quote` 의 조건을 쓸어 버리지 않습니다. */
function amStatePush(){
  if(!AM_ST.on) return Promise.resolve(false);
  if(AM_ST.busy){ AM_ST.timer = AM_ST.timer || setTimeout(amStateKick, 900); return Promise.resolve(false); }
  var L = amStateLocal(), args = {};
  if(AM_ST.want.pick)   args.p_pick   = L.pick;
  if(AM_ST.want.draft)  args.p_draft  = L.draft || {};
  if(AM_ST.want.checks) args.p_checks = L.checks;
  if(!Object.keys(args).length) return Promise.resolve(false);
  AM_ST.want = {};
  AM_ST.busy = true;
  return fetch("/api/deal", {
    method:"POST",
    headers: Object.assign({ "content-type":"application/json" },
      (typeof amAuthHeaders === "function") ? amAuthHeaders() : {}),
    body: JSON.stringify({ fn:"save_user_state", args:args })
  }).then(function(r){ return r.json().catch(function(){ return null; }); })
    .then(function(d){
      AM_ST.busy = false;
      /* ⚠️⚠️ **못 올렸으면 올렸다고 말하지 않습니다** (§15) */
      if(!d || !d.ok){ amStateLog("저장 — " + ((d && d.error) || "실패")); return false; }
      AM_ST.at = Date.now();
      try{ if(typeof quoteDraftPaint === "function") quoteDraftPaint(); }catch(e){}
      return true;
    })
    .catch(function(e){ AM_ST.busy = false; amStateLog("저장 — " + e); return false; });
}

function amStateKick(){ AM_ST.timer = null; amStatePush(); }

/* ⚠️⚠️ **바뀔 때마다 보내지 않습니다.** 체크를 다섯 번 누르면 요청이
   다섯 번 나가고, 그중 늦게 도착한 것이 이깁니다 — 1.2초 쉬고 **마지막
   상태 하나**를 보냅니다. */
window.amStateTouch = function(part){
  if(!AM_ST.on || AM_ST.pulled) return;
  AM_ST.want[part || "pick"] = 1;
  if(AM_ST.timer) clearTimeout(AM_ST.timer);
  AM_ST.timer = setTimeout(amStateKick, 1200);
};

/* ── 화면이 열릴 때 한 번 ─────────────────────────────────────────
   ⚠️ `amAuthAsk()` 가 이미 한 번만 묻고 들고 있습니다 — 여기서 또
   세지 않습니다. */
window.amStateSync = function(){
  if(AM_ST.asked) return Promise.resolve(AM_ST);
  AM_ST.asked = true;
  if(typeof amAuthAsk !== "function") return Promise.resolve(AM_ST);
  return amAuthAsk().then(function(a){
    /* ⚠️⚠️ 로그인이 꺼져 있거나 안 들어와 계시면 **여기서 끝납니다** —
       fetch 를 한 번도 안 보냅니다. */
    if(!a || !a.on || !a.signedIn) return AM_ST;
    AM_ST.on = true;
    return fetch("/api/me?s=1", { headers: Object.assign(
      { accept:"application/json" },
      (typeof amAuthHeaders === "function") ? amAuthHeaders() : {}) })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){
        if(!d || !d.signedIn){ AM_ST.on = false; return AM_ST; }
        var L = amStateLocal();
        if(amStateEmpty(L)){
          /* 이 브라우저가 비어 있습니다 — 서버 것을 잇습니다 */
          amStateApply(d.state);
          if(d.state && d.state.updated_at)
            AM_ST.at = Date.parse(d.state.updated_at) || 0;
        }else{
          /* 보고 계신 화면이 이깁니다 — 그대로 두고 올립니다 */
          AM_ST.want = { pick:1, draft:1, checks:1 };
          amStatePush();
        }
        return AM_ST;
      })
      .catch(function(e){ amStateLog("/api/me?s=1 — " + e); AM_ST.on = false; return AM_ST; });
  }).catch(function(){ return AM_ST; });
};

/* ── 한 칸만 비우기 ──────────────────────────────────────────────
   ⚠️⚠️ **지우는 단추마다 `amStateClear()` 를 부르면 안 됩니다.**
   조건을 지우셨는데 **고르신 서비스까지** 계정에서 날아갑니다 — 셋이
   한 줄에 같이 있을 뿐 서로 다른 것입니다. 그래서 그 칸만 비워
   올리고, **셋이 다 비었을 때만** 줄째 지웁니다 (빈 줄을 남겨 두지
   않습니다). ⚠️ 이 브라우저에서 **먼저 지운 뒤에** 부르세요 — 여기서
   지금 남아 있는 것을 읽습니다. */
window.amStateDrop = function(part){
  if(!AM_ST.on) return;
  if(amStateEmpty(amStateLocal())){ amStateClear(); return; }
  amStateTouch(part);
};

/* 화면이 "서버에도 남았는가" 를 묻는 자리 — ⚠️ 켜져 있고 실제로
   올린 적이 있을 때만 참입니다 (§15 · 절대 규칙 5) */
window.amStateOn = function(){ return !!(AM_ST.on && AM_ST.at); };

/* ── 지우기 ──────────────────────────────────────────────────────
   ⚠️ 이 저장소는 저장하는 자리마다 지우는 길을 같이 냅니다. 브라우저
   쪽을 지우는 단추가 **서버 쪽도 같이** 지웁니다 — 한쪽만 지우면
   다음에 열 때 되살아납니다. */
window.amStateClear = function(){
  if(!AM_ST.on) return Promise.resolve(false);
  AM_ST.at = 0;
  return fetch("/api/deal", {
    method:"POST",
    headers: Object.assign({ "content-type":"application/json" },
      (typeof amAuthHeaders === "function") ? amAuthHeaders() : {}),
    body: JSON.stringify({ fn:"clear_user_state", args:{} })
  }).then(function(r){ return r.ok; })
    .catch(function(e){ amStateLog("지우기 — " + e); return false; });
};

/* ════════════════════════════════════════════════════════════════════
   머리말의 **로그인 자리** — 모든 화면에 실립니다 (UX 검수 §8)

   ⚠️⚠️⚠️ **전에는 `/login` 과 `/my` 가 아무 데서도 안 이어져
   있었습니다.** 매칭 요청을 넣은 손님이 받은 견적을 보러 갈 길이
   **주소를 직접 치는 것뿐**이었습니다 — 화면도 문도 멀쩡한데 손님이
   거기까지 갈 수가 없었습니다 ("만들어 놓고 안 쓰는 칸" 의 화면 판).
   그리는 함수는 `js/account.js` 안에 이미 있었는데, 그 파일이
   /login · /my · /admin **세 장에만** 실려 있었습니다.

   ⚠️⚠️ **그래서 이 파일 하나로 뺐습니다.** 머리말 모양을 두 곳에
   적으면 한쪽만 고쳐서 조용히 달라집니다 — 그리는 곳은 여기 하나이고,
   `account.js` 는 제 화면(상자)만 그립니다.

   ⚠️⚠️ **로그인이 설정되기 전에는 아무것도 안 그립니다** (`auth:false`).
   눌러도 아무 일이 안 나는 단추를 만들지 않습니다 (절대 규칙 5) —
   문 여는 날 환경변수가 들어가면 **저절로** 나타납니다.

   ⚠️ 역할마다 **갈 곳이 다릅니다** (§8) — 손님은 내 정보, 업체는 작업실,
   운영자는 관리자. 한 칸만 냅니다 (폰에서 둘을 내면 메뉴를 밀어냅니다).
   그 화면들끼리는 서로 가는 길이 안에 있습니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  if(!window.amAuthAsk) return;

  /* 역할 → 갈 곳 · 이름 — ⚠️ **한 곳**입니다 */
  var GO = {
    provider: { href:"/desk",  name:"업체 작업실" },
    staff:    { href:"/admin", name:"관리자" },
    admin:    { href:"/admin", name:"관리자" }
  };

  amAuthAsk().then(function(a){
    var slot = document.querySelector(".hd-r");
    /* ⚠️ 꺼져 있으면 한 글자도 안 그립니다 */
    if(!slot || !a || !a.on) return;
    /* ⚠️ 두 번 그리지 않습니다 (스크립트가 두 번 실리는 날) */
    if(slot.querySelector(".hd-auth")) return;

    var go = a.signedIn ? (GO[a.role] || { href:"/my", name:"내 정보" }) : null;
    var wrap = document.createElement("span");
    wrap.className = "hd-auth";
    wrap.innerHTML = go
      ? '<a class="hd-lk" href="' + go.href + '">' + window.icon("user", 20) +
        '<span class="lbl">' + window.esc(a.name || go.name) + '</span></a>'
      : '<a class="hd-lk" href="/login">' + window.icon("user", 20) +
        '<span class="lbl">로그인</span></a>';
    slot.insertBefore(wrap, slot.firstChild);
  });
})();

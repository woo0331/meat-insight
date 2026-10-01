/* ════════════════════════════════════════════════════════════════════
   관리자 작업대 (/admin) — 지시서 35번

   ⚠️ **저장할 곳이 없습니다.** api/quote.js 는 받아서 밖으로 보내기만
   하고 DB 가 없습니다. 그래서 "접수 목록" 은 만들 수 없습니다 —
   만들면 그 순간 **지어낸 화면**이 됩니다 (절대 규칙 1).

   대신 지시서 35번이 말하는 **사람이 분류하는 자리**를 만듭니다.
   초기 운영은 이렇게 돕니다.

     슬랙·메일로 접수가 온다
       → 여기에 붙여 넣는다
       → 분류를 고른다 (사람이)
       → 세 가지 글이 나온다 — 사장님 회신 · 업체 요청 · 제3자 제공 동의

   ── 절대 지킬 것 ────────────────────────────────────────
   1. ⚠️ **"AI 가 분석했습니다" 라고 하지 않습니다** (절대 규칙 5).
      낱말이 겹치는 분류를 **먼저 보여 줄 뿐**이고, 고르는 것은
      사람입니다. 화면에도 그렇게 적혀 있습니다.
   2. ⚠️ **업체에 보내는 글에 성함·연락처를 넣지 않습니다.**
      개인정보보호법 제17조 — 업체가 정해진 뒤에 상호를 알리고 **다시**
      동의를 받아야 넘길 수 있습니다. 그래서 세 번째 글(동의 요청)이
      따로 있습니다. `adminVet()` 가 실제로 안 들어갔는지 봅니다.
   3. ⚠️ **아무것도 서버로 보내지 않습니다.** 붙여 넣으신 접수에는
      손님 성함·연락처가 들어 있습니다. 이 화면은 전부 브라우저
      안에서만 돕니다 — localStorage 에도 담지 않습니다.
      (가게 컴퓨터를 여러 사람이 씁니다.)
   ════════════════════════════════════════════════════════════════════ */

var AD = { kind:"sos", prob:"", svc:"", co:"" };

/* ── 1. 지금 접수가 되는가 ───────────────────────────────── */
function adHealth(){
  var box = $("ad-health");
  if(!box) return;
  fetch("/api/admin-health", { cache:"no-store" })
    .then(function(r){ return r.json().catch(function(){ return {}; })
      .then(function(j){ return { ok:r.ok, j:j }; }); })
    .then(function(x){
      box.innerHTML = x.ok && x.j.ok ? adHealthView(x.j) : adHealthFail(x.j);
    })
    .catch(function(){
      box.innerHTML = adHealthFail({ error:"주소를 부르지 못했습니다" });
    });
}

function adHealthFail(j){
  return '<div class="ad-bad"><b>설정 상태를 읽지 못했습니다</b>'+
    '<p>'+esc((j && j.error) || "알 수 없는 까닭")+'. '+
    '이 화면을 로컬에서 열면 원래 안 됩니다 — Vercel 함수가 필요합니다.</p></div>';
}

function adHealthView(h){
  var ready = h.allReady;
  /* 화면에 적힌 sosReady 와 실제 설정이 어긋나는지. **양쪽 다** 사고입니다. */
  var flag = (typeof WOW_BIZ === "object" && WOW_BIZ) ? !!WOW_BIZ.sosReady : false;
  var mismatch = ready !== flag;

  var rows = [
    ["웹훅 (INTAKE_WEBHOOK_URL)", h.common.webhook],
    ["메일 키 (RESEND_API_KEY)",  h.common.resend],
    ["받는 주소 (INTAKE_EMAIL_TO)", h.common.mailTo],
    ["SOS 따로 받기",     h.byKind.sos.webhook || h.byKind.sos.mailTo],
    ["견적 따로 받기",    h.byKind.quote.webhook || h.byKind.quote.mailTo],
    ["파트너 따로 받기",  h.byKind.partner.webhook || h.byKind.partner.mailTo]
  ];

  return '<div class="ad-h '+(ready ? "ad-h-on" : "ad-h-off")+'">'+
      '<b>'+(ready ? "접수가 실제로 들어옵니다" : "지금은 접수가 되지 않습니다")+'</b>'+
      '<p>'+(ready
        ? 'SOS · 견적 · 파트너 세 가지 모두 받을 곳이 있습니다.'
        : '받을 곳이 하나도 없어서 <b>손님이 다 적고 누르면 503</b> 이 납니다. '+
          'Vercel → Settings → Environment Variables 에 <code>INTAKE_WEBHOOK_URL</code> '+
          '하나를 넣거나 <code>RESEND_API_KEY</code> 와 <code>INTAKE_EMAIL_TO</code> 를 '+
          '같이 넣고 <b>다시 배포</b>하세요.')+'</p>'+
      '<span class="ad-h-env">돌고 있는 환경: '+esc(h.env)+'</span>'+
    '</div>'+

    /* ⚠️ 이 어긋남이 제일 위험합니다. 양쪽 방향 다 손님이 손해를 봅니다. */
    (mismatch
      ? '<div class="ad-bad"><b>화면과 설정이 어긋나 있습니다</b><p>'+
        (flag
          ? '<code>WOW_BIZ.sosReady</code> 는 켜져 있는데 <b>받을 곳이 없습니다.</b> '+
            '손님은 폼을 다 적고 눌렀다가 실패합니다 — 지금 당장 끄시거나 '+
            '환경변수를 넣으세요.'
          : '받을 곳은 있는데 <code>WOW_BIZ.sosReady</code> 가 꺼져 있습니다. '+
            '손님 화면에 아직 "접수하지 못합니다" 가 떠 있습니다 — '+
            '<code>js/data/site.js</code> 에서 켜고 커밋하세요.')+
        '</p></div>'
      : '')+

    /* 접수처가 생겼는데 방침을 안 고치면 사실과 다른 방침이 됩니다 */
    (ready && !adTrustees()
      ? '<div class="ad-bad"><b>개인정보처리방침을 같은 날 고쳐야 합니다</b>'+
        '<p>접수처가 생겼으니 그 회사(슬랙 · Resend 등)가 손님의 성함 · 연락처를 '+
        '받게 됩니다. <code>js/data/legal-privacy.js</code> 의 <code>trustees</code> 에 '+
        '한 줄 넣으세요 (개인정보보호법 제26조). 미국 회사면 국가도 적습니다 '+
        '(제28조의8).</p></div>'
      : '')+

    '<ul class="ad-rows">'+rows.map(function(r){
      return '<li><span>'+esc(r[0])+'</span>'+
        '<em class="'+(r[1] ? "on" : "off")+'">'+(r[1] ? "설정됨" : "없음")+'</em></li>';
    }).join("")+'</ul>'+
    '<p class="ad-note">값은 안 보여 드립니다 — 있는지 없는지만 봅니다. '+
      '환경변수를 넣은 뒤에는 <b>반드시 다시 배포</b>해야 반영됩니다.</p>';
}

/* ⚠️ **호스팅(Vercel)은 접수처가 아닙니다.** 그 줄은 접수처를 붙이기
   전부터 늘 있어서, 개수만 세면 이 경고가 **영원히 안 뜹니다** — 실제로
   그랬습니다. 접수 내용을 받아 가는 회사가 한 줄이라도 있는지 봅니다
   (호스팅 줄은 "호스팅" 이라고 적혀 있어 걸러집니다). */
function adTrustees(){
  try{
    var t = WOW_PRIVACY && WOW_PRIVACY.trustees;
    if(!t || !t.length) return false;
    return t.some(function(r){
      return String(r && r[1] || "").indexOf("호스팅") < 0;
    });
  }catch(e){ return false; }
}

/* ── 2. 접수 하나 붙여 넣고 분류하기 ─────────────────────── */

/* 붙여 넣은 글에서 칸을 꺼냅니다. api/quote.js 가 만드는 줄 모양
   ("성함      홍길동") 과, 그냥 옮겨 적은 글 둘 다 받습니다.
   ⚠️ 못 찾으면 **빈 칸**입니다. 지어내지 않습니다. */
function adPick(text, keys){
  var lines = String(text || "").split("\n");
  for(var i = 0; i < lines.length; i++){
    var ln = lines[i].trim();
    for(var k = 0; k < keys.length; k++){
      var key = keys[k];
      if(ln.indexOf(key) !== 0) continue;
      var rest = ln.slice(key.length).replace(/^[\s:·—-]+/, "").trim();
      if(rest) return rest;
    }
  }
  return "";
}

/* 낱말이 겹치는 분류를 **먼저 보여 줍니다.**
   ⚠️ 이것을 "분석" 이라고 부르지 마세요 (절대 규칙 5). 고르는 것은
   사람입니다 — 여기서는 후보를 위로 올려 줄 뿐입니다. */
function adGuess(text){
  var t = String(text || "");
  var best = null, bestN = 0;
  /* 분류와 **하위 분류 이름**을 같이 봅니다 — 접수 글에는 "닥트" ·
     "원상복구" 처럼 하위 분류 이름이 그대로 들어옵니다. */
  (window.AM_CATS || []).forEach(function(c){
    var words = [c.name, c.lead].concat((c.items||[]).map(function(i){ return i.name; }))
                  .join(" ").split(/[\s·,]+/).filter(Boolean);
    var n = 0;
    words.forEach(function(w){ if(w.length > 1 && t.indexOf(w) >= 0) n++; });
    if(n > bestN){ bestN = n; best = c.key; }
  });
  return bestN > 0 ? best : "";
}

window.adRead = function(){
  var raw = ($("ad-in") || {}).value || "";
  if(!raw.trim()){ toast("접수 내용을 붙여 넣어 주세요."); return; }

  var g = adGuess(raw);
  if(g){
    var sel = $("ad-prob");
    if(sel){ sel.value = g; AD.prob = g; }
  }
  adDraw();
  toast(g ? "낱말이 겹치는 분류를 골라 두었습니다. 맞는지 보세요."
          : "겹치는 낱말이 없습니다. 직접 골라 주세요.");
};

window.adSet = function(what, v){ AD[what] = v; adDraw(); };

/* 분류 전체의 하위 분류 — 업체 입점과 견적 전달의 단위입니다 */
function adAllSubs(){
  var out = [];
  (window.AM_CATS || []).forEach(function(c){
    (c.items || []).forEach(function(i){
      out.push([c.key + ":" + i.key, c.name + " · " + i.name]);
    });
  });
  return out;
}
function adSubName(v){
  var hit = adAllSubs().filter(function(x){ return x[0] === v; })[0];
  return hit ? hit[1].split(" · ").pop() : "";
}

function adFields(){
  var raw = ($("ad-in") || {}).value || "";
  return {
    raw:    raw,
    name:   adPick(raw, ["성함", "이름"]),
    tel:    adPick(raw, ["연락처", "전화", "휴대폰"]),
    region: adPick(raw, ["지역"]),
    biz:    adPick(raw, ["업종"]),
    budget: adPick(raw, ["예산"])
  };
}

/* ── 3. 나오는 글 세 가지 ────────────────────────────────── */

function adDraw(){
  var box = $("ad-out");
  if(!box) return;
  var F = adFields();
  var G = null;                       /* 가이드는 이 플랫폼에 없습니다 */
  var P = AD.prob && typeof amCat === "function" ? amCat(AD.prob) : null;
  var svcName = AD.svc ? adSubName(AD.svc) : "";

  if(!F.raw.trim()){
    box.innerHTML = '<p class="ad-empty">접수 내용을 붙여 넣고 '+
      '<b>읽어 오기</b>를 누르면 여기에 보낼 글이 만들어집니다.</p>';
    return;
  }

  box.innerHTML =
    adCard("사장님께 회신", "reply", adReply(F, P, G)) +
    adCard("업체에 보낼 요청", "vendor", adVendor(F, P, G, svcName)) +
    adCard("제3자 제공 동의 요청", "consent", adConsent(F, svcName));
}

function adCard(title, id, text){
  var vet = adVet(id, text);
  return '<section class="ad-c">'+
    '<div class="ad-c-h"><b>'+esc(title)+'</b>'+
      '<button class="btn btn-o" type="button" onclick="adCopy(\''+id+'\')">'+
        icon("doc",16)+'복사</button></div>'+
    (vet ? '<p class="ad-vet">'+icon("alert",16)+esc(vet)+'</p>' : '')+
    '<textarea id="ad-t-'+id+'" rows="'+Math.min(22, text.split("\n").length + 2)+
      '" spellcheck="false">'+esc(text)+'</textarea>'+
  '</section>';
}

/* ⚠️ 업체에 보내는 글에 성함·연락처가 섞이면 **개인정보보호법 제17조
   위반**입니다. 사람이 손으로 고치다 실수할 수 있으니 여기서 한 번 더
   봅니다. 막지는 않고 **보이게** 합니다 — 막으면 다른 데로 우회합니다. */
function adVet(id, text){
  if(id !== "vendor") return "";
  var F = adFields();
  var hit = [];
  if(F.name && text.indexOf(F.name) >= 0) hit.push("성함");
  if(F.tel){
    var digits = F.tel.replace(/[^0-9]/g, "");
    if(digits.length >= 8 && text.replace(/[^0-9]/g, "").indexOf(digits) >= 0)
      hit.push("연락처");
  }
  if(!hit.length) return "";
  return hit.join(" · ") + "가 들어 있습니다. 업체가 정해지기 전에는 넘길 수 "+
    "없습니다 (개인정보보호법 제17조) — 지우고 보내세요.";
}

/* ⚠️ 브랜드 이름을 손으로 적지 마세요. js/data/brand.js 한 줄이
   일하는 이름이고, 사장님이 정하시면 그 줄만 바꿉니다 — 여기에
   적어 두면 회신 글 · 동의 요청 글에만 옛 이름이 남습니다. */
function adBrand(){ return (window.AM_BRAND || {}).name || "저희"; }

function adReply(F, P, G){
  var L = [];
  L.push("사장님, " + adBrand() + "입니다.");
  L.push("");
  L.push("적어 주신 내용 잘 받았습니다" + (P ? " (" + P.name + ")" : "") + ".");
  L.push("");
  if(G){
    L.push("업체를 부르시기 전에 직접 확인해 보시면 좋은 것부터 알려 드립니다.");
    G.self.slice(0, 4).forEach(function(t, i){
      L.push("  " + (i + 1) + ". " + adPlain(t));
    });
    L.push("");
    L.push("전체는 여기에 정리해 두었습니다 — https://aboutmeat.co.kr/problem/" + G.key);
    L.push("");
    L.push("견적을 받으실 때는 이걸 꼭 물어보세요.");
    G.ask.slice(0, 3).forEach(function(t){ L.push("  · " + adPlain(t)); });
    L.push("");
  }
  /* ⚠️ 지킬 수 없는 약속을 적지 않습니다 (절대 규칙 5).
     "몇 시간 안에" · "며칠 안에" 를 넣지 마세요. */
  L.push("조건에 맞는 곳을 찾아 보고 다시 연락드리겠습니다.");
  L.push("업체에 연락처를 전달하기 전에는 어디인지 먼저 알려 드리고 다시 여쭙겠습니다.");
  return adText(L);
}

/* 신원이 드러나는 줄을 걷어냅니다 — 업체에 보내는 글에만 씁니다.
   ⚠️ 이름표(성함 · 연락처)가 없는 줄에 전화번호가 섞여 있을 수도 있어서
   **번호 꼴 자체**도 같이 지웁니다. */
function adStripPii(raw){
  var drop = /^\s*[·\-*]?\s*(성함|이름|연락처|전화|휴대폰|핸드폰|이메일|메일|E-?mail)\s*[:：]?/i;
  return String(raw || "").split("\n").filter(function(line){
    return !drop.test(line);
  }).join("\n")
    .replace(/0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}/g, "(연락처는 동의 후 전달)")
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, "(이메일은 동의 후 전달)");
}

function adVendor(F, P, G, svcName){
  var L = [];
  /* ⚠️ 브랜드 이름을 손으로 적지 마세요 — 이름을 바꾸면 여기만 옛
     이름이 남습니다. 실제로 한 번 그랬고, 이번에 또 한 자리가
     남아 있었습니다. adBrand() 를 쓰세요. */
  L.push("[" + adBrand() + "] 요청 한 건 보내 드립니다.");
  L.push("");
  if(svcName) L.push("· 서비스   " + svcName);
  if(P)       L.push("· 분류     " + P.name);
  if(F.region)L.push("· 지역     " + F.region);
  if(F.biz)   L.push("· 업종     " + F.biz);
  if(F.budget)L.push("· 예산     " + F.budget);
  L.push("");
  L.push("── 사장님이 적어 주신 상황 ──");
  /* ⚠️⚠️ **붙여 넣은 원문을 그대로 넣으면 안 됩니다.** 거기에는 성함과
     연락처가 같이 들어 있습니다 — 업체가 정해지기 전에 넘기면
     개인정보보호법 제17조 위반입니다. 신원 줄을 먼저 걷어냅니다.
     ⚠️ 걸러 낸 뒤에도 `adVet()` 가 한 번 더 보고 **보이게** 합니다
     (막지는 않습니다 — 막으면 다른 데로 우회합니다). */
  L.push(adBody(adStripPii(F.raw)));
  L.push("");
  if(G && G.ask.length){
    L.push("── 견적에 이 답을 같이 적어 주세요 ──");
    G.ask.forEach(function(t, i){ L.push("  " + (i + 1) + ". " + adPlain(t)); });
    L.push("");
  }
  L.push("가능하시면 회신 주시고, 어려우시면 그것도 알려 주시면 됩니다.");
  L.push("");
  L.push("※ 사장님 성함과 연락처는 아직 드리지 않습니다. 맡아 주시기로 하시면");
  L.push("   사장님께 귀사 상호를 알리고 동의를 받은 뒤에 전달해 드립니다.");
  return adText(L);
}

function adConsent(F, svcName){
  var co = AD.co.trim();
  var L = [];
  L.push("사장님, " + adBrand() + "입니다.");
  L.push("");
  L.push("요청하신 건을 맡아 주실 업체가 정해졌습니다.");
  L.push("");
  L.push("· 업체명   " + (co || "(업체명을 적어 주세요)"));
  if(svcName) L.push("· 서비스   " + svcName);
  L.push("");
  L.push("이 업체에 사장님 성함과 연락처를 전달해도 될지 여쭙습니다.");
  L.push("전달되는 것은 성함과 연락처이고, 목적은 견적 상담과 일정 조율,");
  L.push("보유 기간은 상담 종료 후 1년입니다.");
  L.push("");
  L.push("거부하실 수 있습니다. 거부하셔도 불이익은 없고, 다만 이 업체와의");
  L.push("연결은 진행되지 않습니다.");
  L.push("");
  L.push("동의하시면 \"동의합니다\" 라고 회신만 주시면 됩니다.");
  return adText(L);
}

/* 붙여 넣은 접수에서 **본문만** 꺼냅니다 (머리말 줄은 뺍니다).
   ⚠️ 못 찾으면 통째로 돌려줍니다 — 내용이 사라지는 것보다 낫습니다. */
function adBody(raw){
  var m = String(raw).split(/──+\s*(?:적어 주신 상황|필요한 것)\s*──+/);
  var tail = m.length > 1 ? m[m.length - 1] : "";
  tail = tail.split(/──+/)[0];
  return (tail.trim() || String(raw).trim());
}

/* 별표 표시를 떼어냅니다 — 메일과 문자에는 그대로 찍힙니다.
   ⚠️ 가이드에서 가져온 줄만이 아니라 **여기서 손으로 쓴 줄에도**
   별표를 쓰지 마세요. 실제로 두 군데 남아 그대로 나갈 뻔했습니다.
   `adText()` 가 마지막에 한 번 더 훑습니다. */
function adPlain(t){ return String(t).split("**").join(""); }

/* 내보내기 직전의 마지막 문지기. 손으로 고치다 별표가 다시 들어와도
   손님·업체에게는 안 나가게 합니다. */
function adText(lines){ return adPlain(lines.join("\n")); }

window.adCopy = function(id){
  var ta = $("ad-t-" + id);
  if(!ta) return;
  var text = ta.value;
  /* ⚠️ navigator.clipboard 는 https 가 아니면 없습니다. 옛 방법으로
     떨어지게 해 둡니다 — 요청서의 sendFail 과 같은 이유입니다. */
  function old(){
    try{
      ta.select(); ta.setSelectionRange(0, 99999);
      document.execCommand("copy");
      toast("복사했습니다.");
    }catch(e){ toast("복사가 안 됩니다 — 직접 긁어서 복사해 주세요."); }
  }
  if(navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(text)
      .then(function(){ toast("복사했습니다."); })
      .catch(old);
  else old();
};

window.adClear = function(){
  if(!confirm("붙여 넣으신 접수와 만들어진 글을 전부 지울까요?")) return;
  var i = $("ad-in"); if(i) i.value = "";
  AD.prob = ""; AD.svc = ""; AD.co = "";
  var p = $("ad-prob"); if(p) p.value = "";
  var s = $("ad-svc");  if(s) s.value = "";
  var c = $("ad-co");   if(c) c.value = "";
  adDraw();
  toast("지웠습니다.");
};

/* ── 그리기 ──────────────────────────────────────────────── */
function adInit(){
  var root = $("ad");
  if(!root) return;

  root.innerHTML =
    '<section class="ad-s">'+
      '<h2>1. 지금 접수가 되고 있나요</h2>'+
      '<div id="ad-health"><p class="ad-empty">확인하는 중…</p></div>'+
    '</section>'+

    '<section class="ad-s">'+
      '<h2>2. 들어온 접수를 붙여 넣으세요</h2>'+
      '<p class="ad-lead">슬랙이나 메일로 받은 접수를 그대로 붙여 넣으시면 '+
        '됩니다. <b>아무것도 서버로 보내지 않습니다</b> — 이 브라우저 안에서만 '+
        '돌고, 새로고침하면 사라집니다.</p>'+
      '<textarea id="ad-in" rows="10" spellcheck="false" '+
        'placeholder="[SOS] 덕트 · 경기 안양&#10;성함      홍길동&#10;연락처    010-0000-0000&#10;…"></textarea>'+
      '<div class="ad-acts">'+
        '<button class="btn btn-b" type="button" onclick="adRead()">'+
          icon("search",18)+'읽어 오기</button>'+
        '<button class="btn btn-o" type="button" onclick="adClear()">'+
          icon("refresh",18)+'전부 지우기</button>'+
      '</div>'+
    '</section>'+

    '<section class="ad-s">'+
      '<h2>3. 분류는 사람이 고릅니다</h2>'+
      /* ⚠️ 절대 규칙 5 — 하지 않은 일을 했다고 말하지 않습니다.
         자동분류를 하지 않으므로 "분석했습니다" 라고 쓰지 않습니다. */
      '<p class="ad-lead">읽어 오기를 누르면 <b>낱말이 겹치는 분류</b>를 먼저 '+
        '골라 둡니다. 맞는지 보시고 고치세요 — 자동으로 분류하지 않습니다.</p>'+
      '<div class="ad-g">'+
        adSel("ad-prob", "문제 분류", "prob",
          (window.AM_CATS||[]).map(function(c){ return [c.key, c.name]; }))+
        adSel("ad-svc", "견적 서비스", "svc",
          adAllSubs())+
        '<div class="ad-f"><label for="ad-co">업체명 <em>(정해졌으면)</em></label>'+
          '<input id="ad-co" type="text" autocomplete="off" placeholder="예: 가나덕트"'+
          ' oninput="adSet(\'co\',this.value)"></div>'+
      '</div>'+
    '</section>'+

    '<section class="ad-s">'+
      '<h2>4. 보낼 글</h2>'+
      '<p class="ad-lead">고치셔도 됩니다. 복사해서 슬랙 · 메일 · 문자로 '+
        '보내시면 됩니다.</p>'+
      '<div id="ad-out"></div>'+
    '</section>'+

    '<section class="ad-s">'+
      '<h2>5. 업체에 보낼 초대 글</h2>'+
      /* ⚠️ 운영자 화면이라 여기에 법 얘기를 적습니다 (절대 규칙 3).
         손님 화면에는 안 나갑니다. */
      '<div class="notice-bad"><b>보내기 전에 — 정보통신망법 제50조</b>'+
        '<p>영리 목적의 광고성 정보를 <b>문자 · 카톡 · 이메일</b>로 보내려면 '+
        '미리 <b>수신동의</b>를 받아야 합니다. 홈페이지에 번호가 공개돼 있다는 '+
        '것은 동의가 아닙니다. 제일 안전한 것은 <b>전화로 먼저 말하고 그 자리에서 '+
        '동의를 받는 것</b>입니다. 전자적으로 보내실 때는 제목의 (광고) 표기와 '+
        '본문의 보내는 사람 · 연락처 · 수신거부 방법을 지우지 마세요. '+
        '21시~08시 사이에는 보내지 마십시오.</p></div>'+
      '<p class="ad-lead">분야와 지역을 고르시면 그 업체에 맞는 글이 나옵니다. '+
        '<b>지금 등록된 업체 수는 세어서 그대로 적습니다</b> — 0이면 0이라고 '+
        '적습니다. 부풀리면 업체가 등록하고 바로 압니다.</p>'+
      '<div class="ad-g">'+
        adSel2("ad-icat", "분야", "icat",
          adInviteCat().map(function(c){ return [c.key, c.name]; }))+
        adSel2("ad-ireg", "지역", "ireg",
          (window.AM_REGIONS||[]).map(function(r){ return [r.key, r.name]; }))+
      '</div>'+
      '<div id="ad-inv-out"></div>'+
    '</section>';

  adHealth();
  adDraw();
  adInviteDraw();
}

/* ════════════════════════════════════════════════════════════════════
   업체에 보낼 초대 글 (§ 업체 입점)

   업체가 모이지 않으면 이 플랫폼은 아무것도 아닌데, 지금 업체가
   이 화면까지 오게 할 길이 없습니다. 그래서 **직접 연락하실 때 쓰실
   글**을 만들어 둡니다.

   ⚠️⚠️ **여기 적히는 것은 전부 지금 사실인 것과 약속까지입니다.**
   "월 n건의 요청이 옵니다" 를 넣지 마세요 — 지금 0 이고, 업체는
   등록하고 나서 바로 압니다. 그때 잃는 것이 훨씬 큽니다.

   ⚠️⚠️ **정보통신망법 제50조.** 영리 목적의 광고성 정보를 문자 ·
   카톡 · 이메일로 보내려면 **미리 수신동의**를 받아야 합니다.
   홈페이지에 번호가 공개돼 있다는 것은 동의가 아닙니다. 어겼을 때
   과태료가 작지 않습니다. 그래서 —
     · 제일 안전한 것은 **전화로 직접 말하는 것**입니다.
     · 전자적으로 보내실 거면 제목에 (광고), 보내는 사람과 연락처,
       무료 수신거부 방법이 **본문에 있어야 합니다.**
     · 21시~08시 사이에는 보내지 마세요 (별도 동의가 필요합니다).
   아래 글에 그 자리를 미리 넣어 두었습니다. 지우지 마세요.
   ════════════════════════════════════════════════════════════════════ */

function adInviteCat(){
  return (window.AM_CATS || []).filter(function(c){ return c.kind === "provider"; });
}

/* 지금 이 분야에 몇 곳인가 — ⚠️ 세는 값입니다 */
function adInviteN(catKey){
  var c = (window.amCat ? amCat(catKey) : null);
  return (c && window.amProvidersInCat) ? amProvidersInCat(c) : 0;
}

function adInvite(){
  var c = AD.icat ? (window.amCat ? amCat(AD.icat) : null) : null;
  var catName = c ? c.name : "";
  var reg = AD.ireg ? (window.amRegion ? (amRegion(AD.ireg) || {}).name : "") : "";
  var n = AD.icat ? adInviteN(AD.icat) : (window.AM_PROVIDERS || []).length;
  var brand = (window.AM_BRAND || {}).name || "";
  var site = "https://aboutmeat.co.kr/join";
  var B = window.WOW_BIZ || {};

  /* 무엇을 하는 곳인지 — 한 문장 */
  var what = brand + "는 창업 · 폐업을 준비하는 사장님이 필요한 업체를 " +
    "찾고 비교하는 곳입니다.";
  var who = (reg ? reg + " " : "") + (catName ? catName + " " : "") + "업체";

  /* ⚠️ 0 이면 0 이라고 말합니다. 이 단계에서 제일 센 말입니다. */
  var now = n === 0
    ? (catName ? catName + " 분야는 아직 등록된 업체가 없습니다." :
        "아직 등록된 업체가 없습니다.") + " 부풀려 말씀드리지 않겠습니다 — " +
      "지금 들어오시면 " + (catName ? "그 분야의 " : "") + "첫 번째입니다."
    : (catName ? catName + " 분야에 지금 " : "지금 ") + n + "곳이 등록돼 있습니다.";

  /* 약속 — js/data/join.js 와 **같은 말**이어야 합니다 */
  var promise = [
    "· 기본 입점은 무료입니다.",
    "· 지역과 전문 분야가 맞는 요청만 보내 드립니다.",
    "· 광고비를 받고 소개 순서를 바꾸지 않습니다.",
    "· 손님 연락처는 업체가 정해지고 그분이 다시 동의하신 뒤에 전달됩니다."
  ];

  /* ⚠️ 전송자 정보 — 사업자 정보가 비어 있으면 **그 줄을 빼고**
     대신 적어야 할 것이 있다고 알립니다 (절대 규칙 2 · 3). */
  var from = [];
  if(B.name)  from.push(B.name);
  if(B.bizNo) from.push("사업자등록번호 " + B.bizNo);
  if(B.phone) from.push(B.phone);
  if(B.email) from.push(B.email);

  return { catName:catName, reg:reg, n:n, brand:brand, site:site,
           what:what, who:who, now:now, promise:promise, from:from };
}

/* 문자 · 카톡 — ⚠️ 짧아야 읽힙니다 */
function adInviteSms(v){
  var L = [];
  L.push("(광고) " + v.brand);
  L.push("");
  L.push(v.who + " 사장님 안녕하세요.");
  L.push(v.what);
  L.push("");
  L.push(v.now);
  L.push("기본 입점은 무료이고, 지역과 분야가 맞는 요청만 보내 드립니다.");
  L.push("");
  L.push("등록: " + v.site);
  L.push("");
  if(v.from.length) L.push(v.from.join(" · "));
  else L.push("[보내는 사람 · 사업자등록번호 · 연락처를 여기 적으세요]");
  /* ⚠️ `"글" + 값 || "대체"` 로 쓰지 마세요 — 앞의 이어붙인 글이 늘
     참이라 대체값이 안 나오고 `undefined` 가 그대로 찍힙니다. */
  var off = (window.WOW_BIZ || {}).phone;
  L.push("무료수신거부 " + (off || "[수신거부 번호를 여기 적으세요]"));
  return adText(L);
}

/* 이메일 — ⚠️ 제목 앞의 (광고) 를 지우지 마세요 */
function adInviteMail(v){
  var L = [];
  L.push("제목: (광고) " + (v.catName ? v.catName + " " : "") +
    "업체를 찾고 있습니다 — " + v.brand);
  L.push("");
  L.push("안녕하세요. " + v.brand + "입니다.");
  L.push("");
  L.push(v.what);
  L.push((v.reg ? v.reg + " 지역의 " : "") +
    (v.catName ? v.catName + " " : "") + "업체를 찾고 있어 연락드립니다.");
  L.push("");
  L.push("[지금 상태]");
  L.push(v.now);
  L.push("");
  L.push("[업체에 이렇게 하겠습니다]");
  v.promise.forEach(function(x){ L.push(x); });
  L.push("");
  L.push("[어떻게 진행되나]");
  L.push("1. 하시는 일과 지역을 등록합니다 (아래 주소, 양식 한 번)");
  L.push("2. 조건이 맞는 요청을 받습니다 — 받으실지는 업체가 정하십니다");
  L.push("3. 사장님과 직접 계약하십니다 (저희는 중개자이고 거래 당사자가 아닙니다)");
  L.push("");
  L.push("등록: " + v.site);
  L.push("궁금하신 것은 이 메일로 그대로 답장 주셔도 됩니다.");
  L.push("");
  L.push("---");
  if(v.from.length) L.push(v.from.join(" · "));
  else L.push("[보내는 사람 · 사업자등록번호 · 주소 · 연락처를 여기 적으세요]");
  L.push("이 메일을 받지 않으시려면 이 주소로 '수신거부' 라고 답장해 주세요.");
  return adText(L);
}

/* 전화 — ⚠️ 읽는 글이 아니라 **말하는 순서**입니다 */
function adInviteCall(v){
  var L = [];
  L.push("[전화로 말할 순서 — 읽지 마시고 말로 하세요]");
  L.push("");
  L.push("1) 누구인지 (5초)");
  /* ⚠️ 이름을 두 번 말하지 않습니다 — 전화에서는 그게 바로 들립니다 */
  L.push("   " + koWith(v.brand, "이라고라고") + " 합니다. 창업 · 폐업을 준비하는");
  L.push("   사장님이 필요한 업체를 찾고 비교하는 곳입니다.");
  L.push("");
  L.push("2) 왜 전화했는지 (10초)");
  L.push("   " + (v.reg ? v.reg + " " : "") + (v.catName ? v.catName + " " : "") +
    "업체를 찾고 있어서 연락드렸습니다.");
  L.push("");
  L.push("3) 지금 상태 — ⚠️ 부풀리지 마세요");
  L.push("   " + v.now);
  L.push("");
  L.push("4) 무엇을 드리는지");
  v.promise.forEach(function(x){ L.push("   " + x); });
  L.push("");
  L.push("5) 무엇을 부탁드리는지");
  L.push("   " + v.site + "에서 하시는 일과 지역만 등록해 주시면 됩니다.");
  L.push("   문자로 주소 보내 드려도 될까요?  ← 여기서 수신동의를 받으십니다");
  L.push("");
  L.push("[자주 나오는 질문]");
  L.push("· 돈 드나요 → 기본 입점은 무료입니다. 유료 상품이 생기면 미리 알리고");
  L.push("  동의하신 경우에만 적용합니다.");
  L.push("· 요청이 얼마나 오나요 → 지금은 약속드릴 수 없습니다. 모으는 중이라");
  L.push("  건수를 말씀드리면 그건 지어낸 숫자입니다.");
  L.push("· 광고비 내면 위에 올려 주나요 → 아닙니다. 지역과 분야가 맞는지로");
  L.push("  냅니다. 광고 자리가 생기면 광고라고 표시합니다.");
  L.push("· 손님 연락처 바로 오나요 → 아닙니다. 업종 · 지역 · 필요한 것 ·");
  L.push("  상황까지입니다. 성함과 연락처는 그분이 다시 동의하신 뒤에 갑니다.");
  return adText(L);
}

function adInviteDraw(){
  var box = $("ad-inv-out");
  if(!box) return;
  var v = adInvite();
  var warn = v.from.length ? "" :
    '<p class="ad-vet">'+icon("alert",16)+
      '보내는 사람 정보(상호 · 사업자등록번호 · 연락처)가 비어 있습니다. '+
      '문자 · 메일로 보내실 때는 정보통신망법 제50조 제4항에 따라 본문에 '+
      '있어야 합니다 — js/data/site.js 의 WOW_BIZ 를 채우시거나 글에서 직접 '+
      '적어 넣으세요.</p>';
  box.innerHTML = warn +
    adCard("문자 · 카톡 (짧게)", "inv-sms",  adInviteSms(v)) +
    adCard("이메일",            "inv-mail", adInviteMail(v)) +
    adCard("전화로 말할 순서",   "inv-call", adInviteCall(v));
}

window.adInviteSet = function(what, v){ AD[what] = v; adInviteDraw(); };

function adSel2(id, label, key, opts){
  return '<div class="ad-f"><label for="'+id+'">'+esc(label)+'</label>'+
    '<select id="'+id+'" class="f-sel" onchange="adInviteSet(\''+key+'\',this.value)">'+
      '<option value="">고르지 않음</option>'+
      opts.map(function(o){
        return '<option value="'+esc(o[0])+'">'+esc(o[1])+'</option>';
      }).join("")+
    '</select></div>';
}

function adSel(id, label, key, opts){
  return '<div class="ad-f"><label for="'+id+'">'+esc(label)+'</label>'+
    '<select id="'+id+'" class="f-sel" onchange="adSet(\''+key+'\',this.value)">'+
      '<option value="">고르지 않음</option>'+
      opts.map(function(o){
        return '<option value="'+esc(o[0])+'">'+esc(o[1])+'</option>';
      }).join("")+
    '</select></div>';
}

document.addEventListener("DOMContentLoaded", adInit);

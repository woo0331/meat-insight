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

function adTrustees(){
  try{
    var t = WOW_PRIVACY && WOW_PRIVACY.trustees;
    return !!(t && t.length);
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
  WOW_PROBLEMS.forEach(function(p){
    var words = (p.name + " " + (p.hint || "")).split(/[\s·,]+/).filter(Boolean);
    var n = 0;
    words.forEach(function(w){ if(w.length > 1 && t.indexOf(w) >= 0) n++; });
    if(n > bestN){ bestN = n; best = p.key; }
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
  var G = AD.prob && typeof wowGuide === "function" ? wowGuide(AD.prob) : null;
  var P = AD.prob && typeof wowProblem === "function" ? wowProblem(AD.prob) : null;
  var svcName = AD.svc && typeof wowServiceName === "function"
    ? wowServiceName(AD.svc) : "";

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

function adReply(F, P, G){
  var L = [];
  L.push("사장님, ABOUTMEAT 입니다.");
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

function adVendor(F, P, G, svcName){
  var L = [];
  L.push("[ABOUTMEAT] 요청 한 건 보내 드립니다.");
  L.push("");
  if(svcName) L.push("· 서비스   " + svcName);
  if(P)       L.push("· 분류     " + P.name);
  if(F.region)L.push("· 지역     " + F.region);
  if(F.biz)   L.push("· 업종     " + F.biz);
  if(F.budget)L.push("· 예산     " + F.budget);
  L.push("");
  L.push("── 사장님이 적어 주신 상황 ──");
  L.push(adBody(F.raw));
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
  L.push("사장님, ABOUTMEAT 입니다.");
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
          WOW_PROBLEMS.map(function(p){ return [p.key, p.name]; }))+
        adSel("ad-svc", "견적 서비스", "svc",
          WOW_SERVICES.map(function(s){ return [s.key, s.groupName+" · "+s.name]; }))+
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
    '</section>';

  adHealth();
  adDraw();
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

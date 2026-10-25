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
    adHealthDb(h)+
    '<p class="ad-note">값은 안 보여 드립니다 — 있는지 없는지만 봅니다. '+
      '환경변수를 넣은 뒤에는 <b>반드시 다시 배포</b>해야 반영됩니다.</p>';
}

/* ── DB · 로그인 (2026-10-11 전면 감사 1차 ①) ──────────────────
   ⚠️⚠️ **접수 저장과 로그인을 갈라서** 봅니다. service key 만 넣고
   anon key 를 빠뜨리면 접수번호는 나오는데 **로그인만 조용히
   안 됩니다** — 화면은 `auth:false` 로 구간째 안 그려서 **아무
   에러도 안 납니다.** 한 덩어리로 보면 어느 쪽이 빠졌는지 모릅니다.
   ⚠️ 옛 답(`db` 가 없는 배포)에도 걸려 넘어지지 않게 합니다 — 환경
   변수를 넣고 **다시 배포하기 전**에는 함수가 옛것입니다. */
/* ── DB 가 **몇 번째 판**인가 (2026-10-21) ─────────────────────
   ⚠️⚠️ **환경변수가 들어간 것과 DB 가 준비된 것은 다른 일입니다.**
   키를 다 넣어도 `0008`~`0011` 을 안 돌리셨으면 견적도 · 항목별
   배정도 · 사진도 안 되는데, 이 칸은 그동안 "다 설정되어 있습니다"
   라고 했습니다 — 그걸 아는 길이 Supabase 를 열고 `db/verify.sql` 을
   붙여 넣는 것 하나였습니다.
   ⚠️⚠️ **남은 파일 이름을 손으로 적지 마세요.** 빌드가
   `db/migrations` 를 읽어 `api/_migrations.js` 에 적고 서버가 셉니다 —
   마이그레이션을 늘리면 저절로 따라옵니다.
   ⚠️ **못 읽은 것을 "안 돌렸습니다" 로 적지 않습니다** — 멀쩡한 DB 를
   고치러 가시게 됩니다. */
function adHealthMig(d){
  var m = d && d.mig;
  if(!m) return "";                 /* 옛 배포이거나 저장이 꺼져 있습니다 */
  if(!m.known)
    return '<p class="ad-note">지금 DB 가 <b>몇 번째 판인지 읽지 못했습니다.</b> '+
      '<code>db/verify.sql</code> 을 Supabase SQL Editor 에 붙여 넣어 보세요 '+
      '(<code>docs/GO-LIVE.md</code> 1번).</p>';
  if(m.at >= m.want)
    return '<div class="ad-h ad-h-on"><p><b>DB 가 저장소와 같은 판입니다 '+
      '(판 '+esc(String(m.at))+').</b> 마이그레이션은 더 돌리실 것이 없습니다.'+
      (m.at > m.want ? ' ⚠️ DB 가 저장소보다 앞섭니다 — 배포가 옛것이거나 '+
        '저장소에 없는 SQL 을 돌리신 것입니다.' : '')+'</p></div>';
  return '<div class="ad-h ad-h-off"><p><b>마이그레이션이 '+
    esc(String(m.want - m.at))+'개 남았습니다</b> — 지금 판 '+
    esc(String(m.at))+' · 저장소는 판 '+esc(String(m.want))+'. '+
    '안 돌리시면 <b>견적 · 항목별 배정 · 회원 저장 · 사진</b>이 '+
    '조용히 안 됩니다 (에러가 안 납니다).</p>'+
    '<ul class="ad-rows">'+m.left.map(function(f){
      return '<li><span>db/migrations/'+esc(f)+'</span><em class="off">남음</em></li>';
    }).join("")+'</ul>'+
    '<p class="ad-note">Supabase → SQL Editor 에 <b>통째로</b> 붙여 넣고 '+
    '<b>번호 차례대로</b> Run 하세요. 끝나면 <code>db/verify.sql</code> 로 '+
    '열세 줄이 ✅ 인지 보세요 (<code>docs/GO-LIVE.md</code> 1번).</p></div>';
}

/* ── 버킷이 **실제로** 비공개이고 상한이 걸려 있는가 ───────────
   ⚠️⚠️ 서명된 올리기 주소는 그 자체로 크기·형식을 막지 않습니다 —
   서버와 DB 가 보는 것은 "적어 보낸 값" 이고 **마지막으로 막는 것이
   버킷 설정**입니다 (GO-LIVE §2). 이름이 환경변수에 있는 것과 버킷이
   제대로 선 것은 다른 일입니다. */
function adHealthBucket(d){
  var b = d && d.bucketCheck;
  if(!b || !b.known)
    return '⚠️ 버킷이 <b>비공개</b>인지, <b>8MB · jpeg · png · webp · pdf</b> '+
      '상한이 버킷에도 걸려 있는지 <b>직접</b> 보세요 — 여기서 읽지 못했습니다.';
  if(!b.found)
    return '⚠️⚠️ <b>그 이름의 버킷을 찾지 못했습니다.</b> '+
      '<code>INTAKE_BUCKET</code> 에 적힌 이름과 Supabase → Storage 의 '+
      '버킷 이름이 같은지 보세요.';
  var bad = [];
  if(!b.priv) bad.push('<b>공개 버킷입니다</b> — 경로를 아는 누구나 사장님들이 '+
    '올린 사진을 봅니다. Storage → 그 버킷 → <b>Public 을 끄세요.</b>');
  if(!b.size) bad.push('<b>크기 상한이 안 걸려 있거나 8MB 보다 헐겁습니다.</b>');
  if(!b.mime) bad.push('<b>허용 형식이 넷과 다릅니다</b> — '+
    'image/jpeg · image/png · image/webp · application/pdf');
  if(!bad.length)
    return '버킷도 <b>비공개 · 8MB · 형식 넷</b>으로 맞게 서 있습니다.';
  return '⚠️⚠️ 버킷 설정에 손보실 것이 있습니다 — <br>· '+bad.join('<br>· ');
}

function adHealthDb(h){
  if(!h || !h.db)
    return '<p class="ad-note">DB · 로그인 상태는 이 배포에 아직 없습니다 — '+
      '<b>다시 배포</b>하시면 여기에 나옵니다.</p>';
  var d = h.db;
  var rows = [
    ["프로젝트 주소 (SUPABASE_URL)",      d.url],
    ["공개 키 (SUPABASE_ANON_KEY)",       d.anonKey],
    ["서버 키 (SUPABASE_SERVICE_KEY)",    d.svcKey]
  ];
  /* ⚠️ 2026-10-20 — 사진 첨부는 **버킷이 따로** 필요합니다.
     ⚠️⚠️ 옛 배포(이 칸이 없는 답)에서는 줄째 뺍니다 — 안 빼면
     "없음" 이라고 말해 놓고 실제로는 **못 보고 있는 것**입니다
     (아래 `db` 자체가 없을 때 줄째 빼는 것과 같은 규칙). */
  if(typeof d.bucket !== "undefined")
    rows.push(["사진 버킷 (INTAKE_BUCKET)", d.bucket]);
  var msg;
  if(d.store && d.auth)
    msg = '<b>DB 와 로그인이 다 설정되어 있습니다.</b> 접수가 저장되고 '+
      '접수번호가 나가며, <code>/my</code> 와 이 화면의 <b>접수 · 배정</b> 칸이 섭니다.';
  else if(d.store && !d.auth)
    msg = '<b>접수 저장은 되는데 로그인이 안 됩니다.</b> '+
      '<code>SUPABASE_ANON_KEY</code> 가 빠졌습니다 — 그 키는 '+
      '<b>새도 괜찮게 설계된 공개 키</b>이고, 무엇을 볼 수 있는지는 전부 '+
      'RLS 가 정합니다. 넣고 <b>다시 배포</b>하세요.';
  else if(!d.store && d.auth)
    msg = '<b>로그인은 되는데 접수가 저장되지 않습니다.</b> '+
      '<code>SUPABASE_SERVICE_KEY</code> 가 빠졌습니다 — 접수번호가 '+
      '안 나가고, 손님은 번호 없이 끝납니다.';
  else
    msg = '<b>아직 설정되지 않았습니다.</b> 지금은 접수가 슬랙 · 메일로만 '+
      '가고 번호가 없습니다. 화면도 로그인 칸을 <b>아예 안 그립니다</b> — '+
      '작동하지 않는 단추를 만들지 않습니다.';

  /* 사진 첨부는 DB 와 **따로** 말합니다 — 둘을 한 줄로 묶으면 어느
     쪽이 빠졌는지 모릅니다 (store 와 auth 를 가른 것과 같은 까닭). */
  var ph = "";
  if(typeof d.bucket !== "undefined"){
    if(d.photo)
      ph = '<p class="ad-note">사진 · 서류 첨부가 <b>켜져 있습니다.</b>';
    else if(d.store)
      ph = '<p class="ad-note">사진 · 서류 첨부는 <b>아직 꺼져 있습니다</b> — '+
        '<code>INTAKE_BUCKET</code> 이 없습니다. 접수 완료 안내에 사진 칸이 '+
        '<b>아예 안 나옵니다</b> (못 올리는데 올리는 척하지 않습니다).';
    else
      ph = '<p class="ad-note">사진 · 서류 첨부는 <b>DB 가 먼저</b>입니다 — '+
        '저장이 켜진 다음에 <code>INTAKE_BUCKET</code> 을 넣으세요.';
    ph += ' 만드는 법은 <code>docs/GO-LIVE.md</code> 2번입니다.</p>';
    /* ⚠️⚠️ **공개 버킷은 흐린 작은 글씨로 적을 일이 아닙니다.**
       찍어 보니 "공개 버킷입니다" 가 회색 안내문에 섞여, 바로 위
       분홍 상자(마이그레이션)보다 **덜 급해 보였습니다** — 실제로는
       사장님들이 올린 사진이 경로만 알면 다 보이는 상태입니다.
       손볼 것이 있으면 **상자로** 냅니다 (판 번호 칸과 같은 꼴).
       ⚠️ 그리고 안내 문장을 **버킷 결과 앞**으로 옮겼습니다 — 뒤에
       붙이니 마지막 줄이 "…application/pdf 만드는 법은 …" 으로
       한 줄에 이어 붙었습니다 (찍어 보고 알았습니다). */
    if(d.photo){
      var b = d.bucketCheck;
      var bad = !!(b && b.known && (!b.found || !b.priv || !b.size || !b.mime));
      ph += bad
        ? '<div class="ad-h ad-h-off"><p>'+adHealthBucket(d)+'</p></div>'
        : '<p class="ad-note">'+adHealthBucket(d)+'</p>';
    }
  }

  return '<h3 class="ad-h3">DB · 로그인</h3>'+
    '<div class="ad-h '+(d.store && d.auth ? "ad-h-on" : "ad-h-off")+'">'+
      '<p>'+msg+'</p></div>'+
    /* ⚠️ 키가 다 들어가도 **마이그레이션이 남아 있으면** 반쯤 됩니다 */
    adHealthMig(d)+
    ph+
    '<ul class="ad-rows">'+rows.map(function(r){
      return '<li><span>'+esc(r[0])+'</span>'+
        '<em class="'+(r[1] ? "on" : "off")+'">'+(r[1] ? "설정됨" : "없음")+'</em></li>';
    }).join("")+'</ul>'+
    /* ⚠️⚠️ 서버 키가 화면으로 내려가면 RLS 가 통째로 꺼집니다 */
    '<p class="ad-note">⚠️ <b>서버 키는 화면으로 내려가지 않습니다</b> — '+
      '그 키는 RLS 를 통째로 지나갑니다. 화면이 받는 것은 '+
      '<b>주소와 공개 키 둘뿐</b>입니다.</p>';
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

/* ── 2. 영업 시작 전에 남은 것 ───────────────────────────────
   ⚠️⚠️ **여기 적는 것은 전부 세는 값입니다.** "아직 남았습니다" 를
   손으로 적어 두면 채우신 날 고칠 자리가 하나 더 생기고, 그 자리를
   잊으면 다 끝난 뒤에도 "남았습니다" 가 떠 있습니다 — 이 저장소가
   CLAUDE.md 의 "아직 안 된 것" 표에서 실제로 그렇게 틀렸습니다
   (접수처는 10-01 에 켰는데 표에는 몇 주 동안 "해야 할 일" 로
   남아 있었습니다).
   ⚠️ 운영자 화면이라 법 조문을 그대로 적습니다 (절대 규칙 3) —
   손님 화면에는 안 나갑니다. */

/* 전자상거래법 제10조가 **표시하라고 정한 칸**과 개인정보보호법
   제31조의 보호책임자. ⚠️ 비어 있으면 화면에서 줄째 빠져서 **아무
   말도 안 하고 사라집니다** — 그래서 여기서 셉니다. */
/* ⚠️⚠️ **여덟 칸입니다** (2026-10-11 전면 감사 §1). 전에 일곱이었고
   **전화번호가 빠져 있었습니다** — 전자상거래법 제10조 제1항이
   "전화번호 · 전자우편주소" 를 **둘 다** 적으라고 정하고 있는데, 저희는
   메일만 세고 있었습니다. 게다가 `phone` 이 비면 화면의 **전화 버튼이
   통째로 안 나옵니다**(그게 맞습니다 — 자리표시자를 안 찍습니다). 그래서
   비어 있어도 아무 표가 안 나고, 이 칸만이 그것을 말합니다.
   ⚠️ `hours` 와 `privacyEmail` · `privacyPhone` 은 여기 없습니다 —
   법이 정한 칸이 아니고, 뒤의 둘은 비면 `email` · `phone` 을 씁니다. */
var AD_BIZ_NEED = [
  ["company",   "상호"],
  ["ceo",       "대표자 성명"],
  ["brn",       "사업자등록번호"],
  ["mailOrder", "통신판매업 신고번호"],
  ["address",   "사업장 주소"],
  ["phone",     "전화번호"],
  ["email",     "문의 이메일"],
  ["privacyOfficer", "개인정보 보호책임자"]
];

/* 비어 있는 칸만 모아 **그대로 붙여 넣을 줄**을 만듭니다.
   ⚠️⚠️ **값을 지어내지 않습니다** (절대 규칙 1). 따옴표 사이는 비어
   있고, 사장님이 적으셔야 합니다 — 예시 상호를 넣어 두면 그대로
   커밋되어 **없는 회사의 사업자 정보**가 푸터 · 약관 · 방침에
   나갑니다. 여기가 하는 일은 **키 이름을 틀리지 않게** 해 드리는
   것까지입니다 (업종 · 지역 key 를 골라 만드는 7번 칸과 같은 까닭). */
function adBizSnip(miss){
  var w = 0;
  miss.forEach(function(r){ if(r[0].length > w) w = r[0].length; });
  return miss.map(function(r){
    var pad = new Array(w - r[0].length + 1).join(" ");
    return "  " + r[0] + ":" + pad + ' "",        // ' + r[1];
  }).join("\n");
}

function adReadyRow(done, title, body){
  return '<li class="ad-rd '+(done ? "ad-rd-on" : "ad-rd-off")+'">'+
    '<span class="ad-rd-m" aria-hidden="true">'+(done ? icon("check",16) : icon("alert",16))+'</span>'+
    '<div><b class="ad-rd-t">'+esc(title)+'</b>'+body+'</div></li>';
}

function adReady(){
  var box = $("ad-ready");
  if(!box) return;
  var L = [];

  /* ① 사업자 정보 — 전자상거래법 제10조 */
  var B = (typeof WOW_BIZ === "object" && WOW_BIZ) ? WOW_BIZ : {};
  var miss = AD_BIZ_NEED.filter(function(r){
    return !String(B[r[0]] || "").trim(); });
  L.push(adReadyRow(!miss.length, "사업자 정보",
    miss.length
      ? '<p>아직 <b>'+miss.length+'칸</b>이 비어 있습니다 — '+
        esc(miss.map(function(r){ return r[1]; }).join(" · "))+'.</p>'+
        '<p class="ad-rd-n">비면 푸터 · 약관 · 방침에서 <b>줄째 빠집니다</b>'+
        ' (자리표시자를 안 찍습니다). 영업을 시작하시면 '+
        '<b>전자상거래법 제10조</b>가 표시하라고 정한 칸이라 반드시 채워야 '+
        '합니다. <code>js/data/site.js</code> 의 <code>WOW_BIZ</code> 한 곳입니다.</p>'+
        /* 키 이름을 틀리지 않게 — ⚠️ 값은 비어 있습니다. 지어내지
           않습니다 (절대 규칙 1). 틀린 키는 **에러도 없이 조용히**
           안 읽힙니다. */
        '<div class="ad-c-h ad-rd-cp"><b>빈 칸만 모은 줄</b>'+
          '<button class="btn btn-o btn-sm" type="button" '+
            'onclick="adCopy(\'biz\')">'+icon("doc",16)+'복사</button></div>'+
        '<textarea id="ad-t-biz" rows="'+(miss.length + 1)+'" '+
          'spellcheck="false">'+esc(adBizSnip(miss))+'</textarea>'+
        '<p class="ad-rd-n">따옴표 사이에 값을 적어 '+
          '<code>js/data/site.js</code> 의 같은 키를 바꾸시면 됩니다. '+
          '<b>빈 채로 커밋하지 마세요</b> — 지어낸 값을 넣는 것보다는 '+
          '비워 두는 것이 낫지만, 영업 전에는 둘 다 안 됩니다.</p>'
      : '<p>표시 의무 칸이 다 채워져 있습니다.</p>'));

  /* ② 지원사업 "찾는 곳" 링크 — 눌러 보고 켜야 나갑니다 */
  var W = window.AM_SUPPORT_WHERE || [];
  if(W.length){
    var hasUrl = W.filter(function(x){ return !!x.url; });
    var off = hasUrl.filter(function(x){ return !x.checked; });
    L.push(adReadyRow(!off.length, "지원사업 '찾는 곳' 링크",
      off.length
        ? '<p>주소가 적힌 <b>'+hasUrl.length+'곳</b> 가운데 <b>'+off.length+'곳</b>이 '+
          '아직 안 켜져 있습니다. <b>한 번씩 눌러 보시고</b> 살아 있으면 '+
          '<code>js/data/support.js</code> 에서 <code>checked:true</code> 로 '+
          '바꾸세요 — 죽은 링크는 없는 것보다 나쁩니다.</p>'+
          '<ul class="ad-rd-l">'+off.map(function(x){
            return '<li><a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+
              esc(x.org)+icon("up",14)+'</a></li>'; }).join("")+'</ul>'+
          '<p class="ad-rd-n">켜기 전에는 기관 이름과 찾는 말까지만 나갑니다 '+
          '— 손님 화면이 비지는 않습니다.</p>'
        : '<p>주소가 적힌 '+hasUrl.length+'곳을 전부 확인하셨습니다.</p>'));
  }

  /* ③ 약관 · 방침 — 사람이 봐야 하는 것이라 끝나는 날이 없습니다 */
  L.push(adReadyRow(false, "약관 · 개인정보처리방침 확인",
    '<p>두 문서는 <b>초안</b>입니다. 영업을 시작하시기 전에 변호사나 '+
    '한국소비자원 표준약관과 대조해 확인하세요.</p>'+
    '<p class="ad-rd-n">특히 약관 <b>제5조(회사의 지위)</b> — 통신판매중개자이고 '+
    '거래 당사자가 아니라는 고지입니다. 빼면 <b>전자상거래법 제20조의2</b> 에 '+
    '따라 연대책임을 집니다.</p>'));

  box.innerHTML = '<ul class="ad-rds">'+L.join("")+'</ul>'+
    '<p class="ad-note">접수가 실제로 되는지는 <b>위 1번 칸</b>이 '+
    '실시간으로 말합니다.</p>';
}

/* ── 3. 접수 하나 붙여 넣고 분류하기 ─────────────────────── */

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
  /* ⚠️⚠️ 여기 있던 "가이드 안내" 열두 줄을 지웠습니다 (2026-10-04).
     바로 위에서 `var G = null;` 이라 **한 번도 안 도는 블록**이었고,
     그 안이 `https://(옛 도메인)/problem/…` 를 적고 있었습니다 —
     `/problem/:key` 는 앞 서비스(고기 사업자 문제해결)의 주소라
     이 사이트에 **없습니다.** 죽은 코드가 죽은 주소를 들고 있어서
     지웠습니다. 가이드를 다시 만드시면 그때 되살리세요
     (`git show 406ba2f^:js/data/guides.js`). */

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
      '<h2>2. 영업 시작 전에 남은 것</h2>'+
      '<p class="ad-lead">사람이 직접 해야 하는 것만 모았습니다. '+
        '<b>전부 세는 값</b>이라 채우시면 이 칸에서 저절로 사라집니다 — '+
        '손으로 지울 자리가 없습니다.</p>'+
      '<div id="ad-ready"></div>'+
    '</section>'+

    '<section class="ad-s">'+
      '<h2>3. 들어온 접수를 붙여 넣으세요</h2>'+
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
      '<h2>4. 분류는 사람이 고릅니다</h2>'+
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
      '<h2>5. 보낼 글</h2>'+
      '<p class="ad-lead">고치셔도 됩니다. 복사해서 슬랙 · 메일 · 문자로 '+
        '보내시면 됩니다.</p>'+
      '<div id="ad-out"></div>'+
    '</section>'+

    '<section class="ad-s">'+
      '<h2>6. 업체에 보낼 초대 글</h2>'+
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
    '</section>'+

    '<section class="ad-s">'+
      '<h2>7. 매물 접수를 등록 줄로</h2>'+
      '<p class="ad-lead">내놓기(<b>/sell</b>)로 들어온 접수를 그대로 붙여 '+
        '넣으시면 <b>market.js 에 넣을 줄</b>을 만들어 드립니다. '+
        '손으로 치면 업종 · 지역 key 와 장비 key(sub)에서 틀리는데, '+
        '틀리면 <b>에러도 없이 그 매물만 안 뜨거나 빌드가 멈춥니다</b>. '+
        '여기도 아무것도 저장하지 않습니다.</p>'+
      '<textarea id="ad-mk-in" rows="10" spellcheck="false" '+
        'placeholder="[견적] 홍길동 · 매장 내놓기&#10;성함      홍길동&#10;지역      경기&#10;&#10;── 요청 조건 ──&#10;  · 거래 방식 — 매장 양도&#10;  · 업종 — 카페 · 디저트&#10;…"></textarea>'+
      '<div class="ad-acts">'+
        '<button class="btn btn-b" type="button" onclick="adMkRead()">'+
          icon("search",18)+'읽어 오기</button>'+
      '</div>'+
      '<div id="ad-mk-out"></div>'+
    '</section>'+

    '<section class="ad-s">'+
      '<h2>8. 수익상품 — 지금 낼 수 있는 상태인가</h2>'+
      '<p class="ad-lead">지시서 §5 가 <b>"실제 제휴사가 확보되지 않은 '+
        '상품은 신청 가능 상품처럼 오인시키지 말라"</b>고 적었습니다. '+
        '그래서 상품마다 <b>무엇이 남았는지</b>를 세어서 냅니다 — '+
        '손으로 적는 값이 아니라 <b>업체 수에서 세는 값</b>이라 '+
        '업체를 등록하시면 저절로 줄어듭니다.</p>'+
      adOffers()+
    '</section>'+

    '<section class="ad-s">'+
      '<h2>9. 제휴업체 등록 줄</h2>'+
      '<p class="ad-lead">받아 온 업체를 적으시면 <b>넣을 줄 둘</b>을 '+
        '만들어 드립니다 — <b>손님 화면</b>(정적 파일)과 <b>배정용 DB</b> '+
        '입니다. 한쪽만 넣으면 <b>에러 없이 반쪽</b>입니다 — 화면에는 '+
        '보이는데 배정이 안 되거나, 배정은 되는데 손님 화면에 없는 '+
        '업체가 됩니다.</p>'+
      '<p class="ad-lead">손으로 치면 <b>하위 분야 key</b> 에서 틀리는데, '+
        '틀리면 그 업체만 조용히 안 뜨거나 빌드가 멈춥니다 — '+
        '골라 만들면 틀릴 수가 없습니다. '+
        '<b>여기도 아무것도 저장하지 않습니다.</b></p>'+
      '<div id="ad-pv"></div>'+
    '</section>'+

    '<section class="ad-s">'+
      '<h2>10. 전문관 노출 순서</h2>'+
      '<p class="ad-lead">메인의 <b>전문관 넷</b>과 그 안의 서비스 차례를 '+
        '눌러서 바꾸고, <b>붙여 넣을 줄</b>을 만들어 드립니다 '+
        '(<code>js/data/halls.js</code>). ' +
        '<b>여기서 저장하지 않습니다</b> — 저장할 서버가 없는데 저장되는 '+
        '척하면 그게 거짓말입니다. 만든 줄을 붙여 넣고 '+
        '<code>node build-pages.js</code> 하시면 반영됩니다.</p>'+
      '<div id="ad-hl"></div>'+
    '</section>';

  adHealth();
  adReady();
  adDraw();
  adInviteDraw();
  adMkDraw();
  adPvDraw();
  adHlDraw();
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

/* ⚠️⚠️ **분야 · 지역을 인자로 받습니다.** 6번 칸은 고르개(`AD.icat` ·
   `AD.ireg`)에서 오고, 영업 작업대(`js/sales.js`)는 **업체 한 곳**의
   카테고리 · 지역을 넘깁니다. 글을 두 벌로 만들면 한쪽만 고치게 되고,
   그러면 화면에서 하는 말과 문자로 보내는 말이 달라집니다 (§30). */
function adInvite(catKey, regKey){
  var ic = (catKey === undefined ? AD.icat : catKey);
  var ir = (regKey === undefined ? AD.ireg : regKey);
  var c = ic ? (window.amCat ? amCat(ic) : null) : null;
  var catName = c ? c.name : "";
  var reg = ir ? (window.amRegion ? (amRegion(ir) || {}).name : "") : "";
  var n = ic ? adInviteN(ic) : (window.AM_PROVIDERS || []).length;
  var brand = (window.AM_BRAND || {}).name || "";
  var site = "https://storeway.co.kr/join";
  var B = window.WOW_BIZ || {};

  /* 무엇을 하는 곳인지 — 한 문장 */
  /* ⚠️ 이름 뒤 조사는 `koWith()` 가 고릅니다 — 손으로 적어 두면 이름을
     바꿀 때 "인수인계은" 같은 것이 업체에게 그대로 나갑니다. */
  var what = koWith(brand, "은는") + " 창업 · 폐업을 준비하는 사장님이 필요한 업체를 " +
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
  /* ⚠️⚠️ 칸 이름은 `js/data/site.js` 것 그대로입니다 — 여기도
     `B.name` · `B.bizNo` 를 읽고 있어서 **상호와 사업자등록번호가
     업체에게 가는 글에서 빠졌습니다** (정보통신망법 제50조 제4항이
     요구하는 전송자 표기입니다). 푸터와 같은 사고였습니다. */
  var from = [];
  if(B.company) from.push(B.company);
  if(B.brn)     from.push("사업자등록번호 " + B.brn);
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


/* ════════════════════════════════════════════════════════════════════
   7. 매물 접수를 **등록 줄**로 (2026-10-07)

   `/sell` 로 들어온 접수를 사람이 `js/data/market.js` 에 옮겨 적어야
   하는데, 그걸 손으로 치면 **조용히 깨지는 자리**가 둘 있습니다 —
   자산의 `sub`(장비 key)와 `industry` · `region` key 입니다. 틀리면
   에러도 안 나고 화면도 멀쩡한데 **그 매물만 안 뜨거나 빌드가
   멈춥니다.** 여기서 골라 만들면 그 둘이 틀릴 수가 없습니다.

   ⚠️⚠️ **아무것도 저장하지 않습니다.** 이 브라우저 안에서만 돌고
   새로고침하면 사라집니다 (구간 3 과 같습니다).
   ⚠️⚠️ **만든 줄에 성함 · 연락처를 넣지 않습니다.** 매물 하나가 곧
   올리신 사장님의 개인정보가 됩니다 — 스키마에 그 칸이 없는 것이
   맞고, 섞여 들어가면 아래 경고가 뜹니다.
   ⚠️ **읽지 못한 칸은 비워 둡니다.** 지어내지 않습니다 (절대 규칙 1).
   ════════════════════════════════════════════════════════════════════ */
var AD_MK = { id:"", sub:"", raw:"", got:null };

/* "  · 업종 — 카페 · 디저트" 꼴에서 값만 꺼냅니다.
   ⚠️ 값에도 가운뎃점이 들어오므로 **첫 번째 긴 줄표**에서만 자릅니다. */
function adMkVal(raw, label){
  var lines = String(raw || "").split("\n");
  for(var i = 0; i < lines.length; i++){
    var ln = lines[i].replace(/^[\s·]+/, "").trim();
    if(ln.indexOf(label) !== 0) continue;
    var rest = ln.slice(label.length);
    /* ⚠️ 줄 모양이 **둘**입니다 — 요청 조건은 "· 업종 — 카페",
       머리쪽 칸은 "지역      경기" 처럼 공백으로만 떨어져 있습니다.
       줄표만 보다가 지역을 통째로 못 읽었습니다.
       ⚠️ 줄표가 있으면 **첫 줄표**에서 자릅니다 — "월 매출(사장님이
       적으신 값)" 처럼 딱지 뒤에 괄호가 붙는 칸이 있어서, 공백부터
       잘라 버리면 괄호가 값으로 딸려 옵니다. */
    var cut = rest.indexOf("—");
    var v;
    if(cut >= 0) v = rest.slice(cut + 1).trim();
    else if(/^[\s:]/.test(rest)) v = rest.replace(/^[\s:]+/, "").trim();
    else continue;
    if(v) return v;
  }
  return "";
}
/* 숫자만 (쉼표 · 단위를 떼고). ⚠️ **0 은 값입니다** — 못 찾은 것과
   갈라야 해서 못 찾으면 null 입니다. */
function adMkNum(raw, label){
  var v = adMkVal(raw, label).replace(/[^0-9]/g, "");
  return v === "" ? null : Number(v);
}
function adMkKeyOf(list, name, nameKey){
  var hit = null;
  (list || []).forEach(function(x){
    if(!hit && x[nameKey || "name"] === name) hit = x.key;
  });
  return hit;
}
/* 설명 — "── 필요한 것 ──" 아래부터 다음 토막 전까지 */
function adMkText(raw){
  var lines = String(raw || "").split("\n");
  var from = -1;
  for(var i = 0; i < lines.length; i++)
    if(lines[i].indexOf("필요한 것") >= 0 && lines[i].indexOf("──") >= 0){ from = i + 1; break; }
  if(from < 0) return "";
  var out = [];
  for(var j = from; j < lines.length; j++){
    if(lines[j].indexOf("──") >= 0) break;
    out.push(lines[j]);
  }
  return out.join("\n").trim();
}

function adMkParse(raw){
  var isAsset = raw.indexOf("시설 · 장비 내놓기") >= 0 ||
                (!!adMkVal(raw, "품목") && !adMkVal(raw, "거래 방식"));
  var indName = adMkVal(raw, "업종");
  var regName = adMkVal(raw, "지역");
  var g = {
    asset: isAsset,
    industry: adMkKeyOf(window.AM_INDUSTRIES, indName),
    indName: indName,
    region: adMkKeyOf(window.AM_REGIONS, regName),
    regName: regName,
    gu: adMkVal(raw, "시군구"),
    text: adMkText(raw),
    img: adMkVal(raw, "사진 주소"),
    name: adMkVal(raw, "성함"),
    tel: adMkVal(raw, "연락처")
  };
  if(isAsset){
    g.item  = adMkVal(raw, "품목");
    g.brand = adMkVal(raw, "제조사");
    g.year  = adMkNum(raw, "연식");
    g.count = adMkNum(raw, "수량");
    g.price = adMkNum(raw, "희망가");
    g.state = adMkVal(raw, "상태");
    var dl = adMkVal(raw, "거래 단위");
    g.deal = dl.indexOf("묶음") >= 0 ? "bulk" : dl.indexOf("전체") >= 0 ? "all" : "single";
  }else{
    g.kind    = adMkVal(raw, "거래 방식").indexOf("임대") >= 0 ? "lease" : "transfer";
    g.pyeong  = adMkNum(raw, "평수");
    g.deposit = adMkNum(raw, "보증금");
    g.rent    = adMkNum(raw, "월세");
    g.premium = adMkNum(raw, "권리금");
    g.equipCost = adMkNum(raw, "시설 인수비");
    g.since   = adMkNum(raw, "문 연 해");
    g.wantAt  = adMkVal(raw, "넘기고 싶은 시점");
    g.sales   = adMkNum(raw, "월 매출");
    g.withEquip = !!adMkVal(raw, "시설 포함");
  }
  return g;
}

/* 오늘 날짜 — `at`(올린 날)입니다. 오래된 매물을 그대로 두면
   허위매물과 같아져서 화면이 이 날짜를 냅니다. */
function adMkToday(){
  var d = new Date(), z = function(n){ return (n < 10 ? "0" : "") + n; };
  return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
}

function adMkLine(g){
  var q = function(v){ return '"' + String(v).split('"').join('\\"').split("\n").join("\\n") + '"'; };
  var L = [];
  var push = function(k, v){ if(v !== null && v !== undefined && v !== "") L.push("    " + k + ": " + v + ","); };
  if(g.asset){
    L.push("  {");
    push("id", q(AD_MK.id || "여기에-주소가-될-id"));
    push("cat", q("asset"));
    push("sub", q(AD_MK.sub || "장비키를-골라-주세요"));
    push("industry", q(g.industry || "업종키-없음"));
    push("region", q(g.region || "지역키-없음"));
    push("gu", g.gu ? q(g.gu) : null);
    push("title", q(g.item || ""));
    push("brand", g.brand ? q(g.brand) : null);
    push("year", g.year);
    push("count", g.count);
    push("price", g.price);
    push("nego", g.price === null ? "true" : "false");
    push("deal", q(g.deal));
    push("state", g.state ? q(g.state) : null);
    push("text", q(g.text));
    push("images", "[]");
    push("at", q(adMkToday()));
  }else{
    var t = [g.gu, g.pyeong ? g.pyeong + "평" : "", g.indName,
             g.kind === "lease" ? "임대" : "양도"].filter(Boolean).join(" ");
    L.push("  {");
    push("id", q(AD_MK.id || "여기에-주소가-될-id"));
    push("kind", q(g.kind));
    push("industry", q(g.industry || "업종키-없음"));
    push("region", q(g.region || "지역키-없음"));
    push("gu", g.gu ? q(g.gu) : null);
    push("pyeong", g.pyeong);
    push("deposit", g.deposit);
    push("rent", g.rent);
    push("premium", g.premium);
    push("equipCost", g.equipCost);
    push("sales", g.sales);
    push("since", g.since);
    push("wantAt", g.wantAt ? q(g.wantAt) : null);
    push("withEquip", g.withEquip ? "true" : "false");
    push("fc", "false");
    push("title", q(t));
    push("text", q(g.text));
    push("images", "[]");
    push("at", q(adMkToday()));
  }
  /* 마지막 쉼표를 뗍니다 */
  if(L.length > 1) L[L.length - 1] = L[L.length - 1].replace(/,$/, "");
  L.push("  }");
  return (g.asset ? "/* js/data/market.js 의 AM_ASSETS 에 넣으세요 */\n"
                  : "/* js/data/market.js 의 AM_STORES 에 넣으세요 */\n") +
    L.join("\n");
}

/* ⚠️ **빌드를 멈추게 하는 것**을 먼저 말해 줍니다. 손으로 치면 여기서
   틀리고, 틀리면 에러 없이 그 매물만 안 뜹니다. */
function adMkWarn(g, line){
  var w = [];
  if(!AD_MK.id) w.push("id 를 적어 주세요 — 주소가 됩니다 (/s/… · /a/…)");
  if(!g.industry) w.push("업종을 못 읽었습니다" + (g.indName ? " (" + g.indName + ")" : ""));
  if(!g.region)   w.push("지역을 못 읽었습니다" + (g.regName ? " (" + g.regName + ")" : ""));
  if(g.asset && !AD_MK.sub) w.push("장비 key(sub)를 골라 주세요 — 비거나 틀리면 빌드가 멈춥니다");
  if(g.name && line.indexOf(g.name) >= 0) w.push("성함이 들어 있습니다 — 매물에 넣지 않습니다");
  if(g.tel){
    var d = g.tel.replace(/[^0-9]/g, "");
    if(d.length >= 8 && line.replace(/[^0-9]/g, "").indexOf(d) >= 0)
      w.push("연락처가 들어 있습니다 — 매물에 넣지 않습니다");
  }
  return w;
}

function adMkSubs(){
  var g = AD_MK.got;
  var out = [["", "장비 key 를 골라 주세요"]];
  if(!g || !g.industry) return out;
  (window.AM_INDUSTRIES || []).forEach(function(i){
    if(i.key !== g.industry) return;
    (i.equip || []).forEach(function(e){ out.push([e.key, e.name]); });
  });
  return out;
}

function adMkDraw(){
  var box = $("ad-mk-out");
  if(!box) return;
  var g = AD_MK.got;
  if(!g){ box.innerHTML = '<p class="ad-empty">접수를 붙여 넣고 ‘읽어 오기’ 를 누르세요.</p>'; return; }
  var line = adMkLine(g);
  var w = adMkWarn(g, line);
  box.innerHTML =
    '<div class="ad-g">'+
      '<div class="ad-f"><label for="ad-mk-id">id <em>(주소가 됩니다)</em></label>'+
        '<input id="ad-mk-id" type="text" autocomplete="off" value="'+esc(AD_MK.id)+'" '+
          'placeholder="예: anyang-pyeongchon-cafe-18" '+
          'oninput="adMkSet(\'id\', this.value)"></div>'+
      (g.asset
        ? '<div class="ad-f"><label for="ad-mk-sub">장비 key <em>(sub)</em></label>'+
            '<select id="ad-mk-sub" onchange="adMkSet(\'sub\', this.value)">'+
              adMkSubs().map(function(o){
                return '<option value="'+esc(o[0])+'"'+(o[0]===AD_MK.sub?" selected":"")+'>'+
                  esc(o[1])+'</option>'; }).join("")+
            '</select></div>'
        : '')+
    '</div>'+
    (w.length
      ? '<p class="ad-vet">'+icon("alert",16)+esc(w.join(" · "))+'</p>' : '')+
    adCard(g.asset ? "AM_ASSETS 에 넣을 줄" : "AM_STORES 에 넣을 줄", "mk", line)+
    '<p class="ad-lead">넣고 <b>node build-pages.js</b> 하시면 '+
      (g.asset ? '/a/' : '/s/')+'&lt;id&gt; 화면과 sitemap 이 같이 생깁니다. '+
      '사진은 사장님이 주신 것만 <b>images</b> 에 넣으세요.</p>';
}

window.adMkSet = function(what, v){ AD_MK[what] = v; adMkDraw(); };
window.adMkRead = function(){
  var raw = ($("ad-mk-in") || {}).value || "";
  if(!raw.trim()){ toast("매물 접수를 붙여 넣어 주세요."); return; }
  AD_MK.raw = raw;
  AD_MK.got = adMkParse(raw);
  if(!AD_MK.id && AD_MK.got.industry)
    AD_MK.id = AD_MK.got.industry + "-" + adMkToday().split("-").slice(0,2).join("") + "-1";
  adMkDraw();
  toast("읽었습니다. 못 읽은 칸은 비워 두었습니다 — 지어내지 않습니다.");
};

/* ── 8. 수익상품 상태 (§5) ──────────────────────────────────────
   ⚠️⚠️ **손님 화면이 아닙니다.** 여기 적는 것은 운영자가 해야 할
   일이고, 손님에게는 그 상품이 **그 분야의 진짜 화면**으로만 보입니다
   (절대 규칙 3).
   ⚠️ "아직 남았습니다" 를 손으로 적지 마세요 — `amOfferTodo()` 가
   세는 값입니다. 손으로 적으면 **다 끝난 뒤에도 남아 있습니다**
   (CLAUDE.md 의 "아직 안 된 것" 표가 실제로 그랬습니다). */
function adOffers(){
  var L = window.AM_OFFERS || [];
  if(!L.length) return '<p class="ad-lead">등록된 수익상품이 없습니다.</p>';
  var live = L.filter(function(x){ return window.amOfferOpen(x); }).length;

  return '<p class="ad-note">지금 <b>' + L.length + '개</b> 중 신청을 받는 상품 ' +
      '<b>' + live + '개</b>' +
      (live ? '' : ' — 업체가 등록되기 전에는 0개가 맞습니다') + '</p>' +
    '<div class="ad-of">' + L.map(function(x){
      var todo = window.amOfferTodo(x);
      var n = (typeof amProvidersInCat === "function") ? amProvidersInCat(x.cat) : 0;
      var cat = (typeof amCat === "function") ? amCat(x.cat) : null;
      return '<div class="ad-of-r">' +
        '<div class="ad-of-t"><b>' + esc(x.name) + '</b>' +
          '<span class="ad-of-s' + (todo.length ? "" : " ad-of-ok") + '">' +
            (todo.length ? "정보만" : "신청 받는 중") + '</span></div>' +
        '<p class="ad-of-m">' + esc(cat ? cat.name : x.cat) +
          ' · ' + esc(amOfferApplyName(x.apply)) +
          ' · 업체 ' + n + '곳 · 수익모델 ' +
          esc((window.amFeeType && amFeeType(x.fee) || {}).name || x.fee) + '</p>' +
        (todo.length
          ? '<p class="ad-of-d">남은 것 — ' + todo.map(esc).join(" · ") + '</p>'
          : '') +
        '<p class="ad-of-d">정산 기준 — ' + esc(x.feeNote) + '</p>' +
      '</div>';
    }).join("") + '</div>' +
    '<p class="ad-note">⚠️ 업체가 0곳인 분야의 상품을 <b>신청 받는 중</b>으로 ' +
      '켜면 <b>빌드가 멈춥니다</b> (손님이 다 적고 눌렀을 때 배정할 곳이 ' +
      '없기 때문입니다 — §5 · 절대 규칙 5).</p>';
}

/* ════════════════════════════════════════════════════════════════════
   9. 제휴업체 등록 줄 (2026-10-11 전면 감사 §6 "제휴업체 등록")

   ⚠️⚠️ **업체를 지어내지 않습니다** (절대 규칙 1). 이 칸이 하는 일은
   사장님이 **실제로 받아 온 업체**를 적으실 때 **key 를 틀리지 않게**
   해 드리는 것까지입니다 — 7번 칸(매물 등록 줄)과 같은 까닭입니다.

   ⚠️⚠️ **두 곳에 넣어야 합니다.** 이 저장소에서 업체가 사는 곳이
   **둘**이고 하는 일이 다릅니다 —

     js/data/providers.js   손님 화면 (빌드가 미리 만든 정적 HTML)
     DB 의 provider 표       배정 (move_state 가 "없는 업체입니다" 로 거절)

   한쪽만 넣으면 **에러 없이 반쪽**입니다 — 화면에는 보이는데 배정이
   안 되거나, 배정은 되는데 손님 화면에 없는 업체가 됩니다. 그래서 이
   칸이 **줄 둘을 같이** 만듭니다.

   ⚠️⚠️ **`subs` 는 분류 key 가 아니라 하위 분류 key 입니다.**
   `interior` 처럼 둘 다 있는 이름이 있어서 손으로 적으면 틀립니다 —
   틀리면 `checkProviders()` 가 빌드를 멈추고, 안 멈추는 경우에는 그
   업체만 **조용히 안 뜹니다.** 여기서는 **골라서** 만들기 때문에
   틀릴 수가 없습니다.

   ⚠️ **`verified` 를 적는 칸을 만들지 않았습니다.** 확인 배지는
   **플랫폼이 서류를 실제로 본 것만** 켭니다 — 등록 화면에 체크칸을
   두면 "등록하면 저절로 다 켜지는구나" 가 됩니다. 켤 때는 서류를 보고
   SQL · 파일에서 한 칸씩 켜세요.
   ⚠️ **평점 · 후기 수 · 작업 수를 적는 칸이 없습니다** — `reviews` ·
   `portfolio` 배열에서 **셉니다.** 값으로 저장하면 누군가 그 칸에
   4.9 를 적어 넣을 수 있습니다.
   ════════════════════════════════════════════════════════════════════ */

var AD_PV = { id:"", name:"", intro:"", since:"", hours:"",
              cat:"", regs:{}, gus:"", inds:{}, subs:{}, listed:false };

function adPvCats(){
  return (window.AM_CATS || []).filter(function(c){ return c.kind === "provider"; });
}

/* ⚠️ `시설 · 장비`(equip)는 하위가 **업종에서** 옵니다 (`byIndustry`).
   그 분류의 `items` 는 비어 있어서, 업종마다 적힌 장비를 전부 모아
   냅니다 — 안 모으면 그 분류만 고르개가 **덩그러니 빕니다**. */
function adPvSubs(catKey){
  var c = window.amCat ? amCat(catKey) : null;
  if(!c) return [];
  if(!c.byIndustry) return c.items || [];
  var seen = {}, out = [];
  (window.AM_INDUSTRIES || []).forEach(function(ind){
    (ind.equip || []).forEach(function(it){
      if(seen[it.key]) return;
      seen[it.key] = 1; out.push(it);
    });
  });
  return out;
}

/* 고른 것 — ⚠️ **세는 값**입니다. 숫자를 손으로 적지 않습니다. */
function adPvKeys(o){
  return Object.keys(o || {}).filter(function(k){ return o[k]; });
}

/* ⚠️⚠️ **적는 칸에서는 다시 그리지 않습니다.** 칸을 통째로 다시
   그리면 한 글자 칠 때마다 **커서가 칸에서 빠집니다** — 업체명을
   "가" 까지만 치고 멈추는 꼴입니다. 4번 칸의 `adSet()` 이 결과 칸만
   다시 쓰는 것과 같은 까닭이고, 체크칸도 같습니다 (스물 몇 개를
   고르는 자리라 다시 그리면 맨 위로 올라갑니다).
   ⚠️ 다시 그려야 하는 것은 **분야 고르개 하나**입니다 — 그 아래
   하위 목록이 통째로 바뀝니다 (`adPvCat()`). */
window.adPvSet = function(what, v){ AD_PV[what] = v; adPvOut(); };
window.adPvTog = function(what, k, on){ AD_PV[what][k] = !!on; adPvOut(); };
window.adPvCat = function(v){ AD_PV.cat = v; adPvDraw(); };

/* 슬러그 — ⚠️ 주소가 됩니다 (`/p/<이 값>`). 한글을 넣으면 주소가
   퍼센트 인코딩으로 길어지고 공유할 때 깨집니다. */
function adPvSlugBad(v){
  if(!v) return "주소가 될 값이라 반드시 적어야 합니다";
  if(!/^[a-z0-9][a-z0-9-]*$/.test(v))
    return "영문 소문자 · 숫자 · 붙임표만 쓰세요 (예: ganada-interior)";
  return "";
}

function adPvArr(L){
  return "[" + L.map(function(k){ return '"' + k + '"'; }).join(",") + "]";
}
function adPvSql(L){
  return "'{" + L.map(function(k){ return '"' + k + '"'; }).join(",") + "}'";
}
/* ⚠️ SQL 에 들어가는 글입니다 — 작은따옴표를 두 번으로 바꿉니다.
   업체 소개는 사장님이 붙여 넣는 글이라 따옴표가 섞입니다. */
function adPvQ(v){ return "'" + String(v || "").replace(/'/g, "''") + "'"; }
/* ⚠️ 자바스크립트 줄에 들어가는 글입니다 — 역슬래시와 큰따옴표. */
function adPvJs(v){
  return '"' + String(v || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

function adPvLines(){
  var regs = adPvKeys(AD_PV.regs), inds = adPvKeys(AD_PV.inds),
      subs = adPvKeys(AD_PV.subs);
  var gus = String(AD_PV.gus || "").split(/[,·]/)
              .map(function(x){ return x.trim(); }).filter(Boolean);
  var since = String(AD_PV.since || "").replace(/[^0-9]/g, "");

  var js = "  { id:" + adPvJs(AD_PV.id) + ",\n" +
    "    name:" + adPvJs(AD_PV.name) + ",\n" +
    "    regions:" + adPvArr(regs) + ",\n" +
    (gus.length ? "    gu:" + adPvArr(gus) + ",\n" : "") +
    "    industries:" + adPvArr(inds) + ",\n" +
    "    subs:" + adPvArr(subs) + ",\n" +
    (AD_PV.intro ? "    intro:" + adPvJs(AD_PV.intro) + ",\n" : "") +
    (since ? "    since:" + since + ",\n" : "") +
    (AD_PV.hours ? "    consultHours:" + adPvJs(AD_PV.hours) + ",\n" : "") +
    "    reviews:[], portfolio:[] }";

  /* ⚠️⚠️ `on conflict` 로 두 번 돌려도 안전하게 합니다. 한 번 넣고
     고치실 때 똑같은 줄을 다시 돌리게 되는데, 그때 "이미 있습니다"
     로 멈추면 사장님이 지우고 다시 넣게 됩니다 — 지우면 그 업체에
     붙은 배정 · 계약이 `on delete cascade` 로 **같이 지워집니다.**
     ⚠️ `verified` · `listed` 는 **일부러 손대지 않습니다** — 서류를
     보고 켜는 칸이라, 다시 돌릴 때 꺼지면 안 됩니다. */
  var sql =
    "insert into provider\n" +
    "  (id, name, intro, regions, gu, industries, subs, since, consult_hours, listed)\n" +
    "values (\n" +
    "  " + adPvQ(AD_PV.id) + ",\n" +
    "  " + adPvQ(AD_PV.name) + ",\n" +
    "  " + (AD_PV.intro ? adPvQ(AD_PV.intro) : "null") + ",\n" +
    "  " + adPvSql(regs) + ",\n" +
    "  " + adPvSql(gus) + ",\n" +
    "  " + adPvSql(inds) + ",\n" +
    "  " + adPvSql(subs) + ",\n" +
    "  " + (since ? since : "null") + ",\n" +
    "  " + (AD_PV.hours ? adPvQ(AD_PV.hours) : "null") + ",\n" +
    "  " + (AD_PV.listed ? "true" : "false") + "\n" +
    ")\n" +
    "on conflict (id) do update set\n" +
    "  name = excluded.name,\n" +
    "  intro = excluded.intro,\n" +
    "  regions = excluded.regions,\n" +
    "  gu = excluded.gu,\n" +
    "  industries = excluded.industries,\n" +
    "  subs = excluded.subs,\n" +
    "  since = excluded.since,\n" +
    "  consult_hours = excluded.consult_hours;";

  return { js:js, sql:sql, regs:regs, inds:inds, subs:subs };
}

/* 빠진 것 — ⚠️ **막지 않고 보이게** 합니다 (업체 글의 PII 경고와 같은
   방식). 막으면 다른 데로 우회해서 손으로 적습니다. */
function adPvWarn(L){
  var w = [];
  var bad = adPvSlugBad(AD_PV.id);
  if(bad) w.push("주소(id) — " + bad);
  if(!String(AD_PV.name || "").trim()) w.push("업체명이 비어 있습니다");
  if(!L.subs.length)
    w.push("하는 일(하위 분야)이 비어 있습니다 — 비면 **아무 분류에도 " +
           "안 걸립니다.** 지역 · 업종을 안 적은 것은 '전국 · 전업종' 으로 " +
           "읽는 게 말이 되지만, 하는 일을 안 적은 것을 '전부 다 합니다' 로 " +
           "읽으면 인테리어 업체가 세무 화면에 앉습니다 (빌드가 멈춥니다)");
  if(!L.regs.length) w.push("지역이 비어 있습니다 — 지역이 매칭의 첫 조건입니다");
  if(!L.inds.length) w.push("전문 업종이 비어 있습니다");
  if(!w.length) return "";
  return '<div class="notice-bad ad-pv-w"><b>아직 빠진 것</b><ul>'+
    w.map(function(x){ return '<li>'+mark(x)+'</li>'; }).join("")+'</ul></div>';
}

function adPvOut(){
  var box = $("ad-pv-out");
  if(!box) return;
  var L = adPvLines();
  box.innerHTML = adPvWarn(L)+
    adCard("① 손님 화면 — js/data/providers.js 의 AM_PROVIDERS 에 넣으세요",
           "pvjs", L.js)+
    '<p class="ad-note">넣으신 뒤 <code>node build-pages.js</code> 를 '+
      '돌리면 <code>/p/'+esc(AD_PV.id || "…")+'</code> 화면과 sitemap 이 '+
      '같이 생깁니다. ⚠️ <b>이것만 넣으면 배정이 안 됩니다</b> — 아래 '+
      '②도 같이 돌리세요.</p>'+
    adCard("② 배정용 — Supabase 의 SQL Editor 에서 돌리세요",
           "pvsql", L.sql)+
    '<p class="ad-note">⚠️ <b>listed</b> 는 DB 쪽 공개 여부입니다. '+
      '꺼져 있어도 <b>직원 · 관리자에게는 배정 고르개에 보입니다</b> — '+
      '손님 목록은 ①이 만든 정적 화면이 냅니다. '+
      '⚠️ <b>verified</b>(확인 배지)는 이 줄이 손대지 않습니다 — '+
      '서류를 실제로 보고 한 칸씩 켜세요.</p>';
}

function adPvChk(what, L, nameKey){
  return '<div class="ad-pv-chk">'+ L.map(function(x){
    var k = x.key, on = !!AD_PV[what][k];
    return '<label class="f-ck"><input type="checkbox"'+(on ? " checked" : "")+
      ' onchange="adPvTog(\''+what+'\',\''+esc(k)+'\',this.checked)">'+
      '<span>'+esc(x[nameKey || "name"])+'</span></label>';
  }).join("") +'</div>';
}

function adPvDraw(){
  var box = $("ad-pv");
  if(!box) return;
  var subs = adPvSubs(AD_PV.cat);

  box.innerHTML =
    '<div class="ad-g">'+
      '<div class="ad-f"><label for="ad-pv-nm">업체명 <em>(필수)</em></label>'+
        '<input id="ad-pv-nm" type="text" autocomplete="off" placeholder="예: 가나다 인테리어"'+
        ' value="'+esc(AD_PV.name)+'" oninput="adPvSet(\'name\',this.value)"></div>'+
      '<div class="ad-f"><label for="ad-pv-id">주소가 될 값 <em>(필수 · 영문)</em></label>'+
        '<input id="ad-pv-id" type="text" autocomplete="off" spellcheck="false"'+
        ' placeholder="ganada-interior" value="'+esc(AD_PV.id)+'"'+
        ' oninput="adPvSet(\'id\',this.value)"></div>'+
      '<div class="ad-f"><label for="ad-pv-sc">문 연 해 <em>(선택)</em></label>'+
        '<input id="ad-pv-sc" type="number" min="1900" max="2100" inputmode="numeric"'+
        ' placeholder="2015" value="'+esc(AD_PV.since)+'"'+
        ' oninput="adPvSet(\'since\',this.value)"></div>'+
      '<div class="ad-f"><label for="ad-pv-hr">상담 가능 시간 <em>(선택)</em></label>'+
        '<input id="ad-pv-hr" type="text" autocomplete="off"'+
        ' placeholder="평일 09:00~18:00" value="'+esc(AD_PV.hours)+'"'+
        ' oninput="adPvSet(\'hours\',this.value)"></div>'+
    '</div>'+

    '<div class="ad-f"><label for="ad-pv-in">한 줄 소개 <em>(선택 · 업체가 준 글만)</em></label>'+
      '<input id="ad-pv-in" type="text" autocomplete="off"'+
      ' placeholder="예: 카페 · 음식점 인테리어를 10년 해 왔습니다"'+
      ' value="'+esc(AD_PV.intro)+'" oninput="adPvSet(\'intro\',this.value)"></div>'+

    '<div class="ad-pv-b"><b>서비스 지역</b>'+
      '<p class="ad-rd-n">지역이 매칭의 <b>첫 조건</b>입니다.</p>'+
      adPvChk("regs", window.AM_REGIONS || [])+
      /* ⚠️ 경기도는 넓습니다 — 안양 업체가 포천 손님에게 뜨면 둘 다
         헛걸음입니다. `gu` 를 **적어 받아 놓고 안 읽던** 자리라
         이 저장소가 한 번 겪었습니다. */
      '<div class="ad-f ad-pv-gu"><label for="ad-pv-gu">시 · 군 · 구 '+
        '<em>(선택 · 쉼표로 여럿)</em></label>'+
        '<input id="ad-pv-gu" type="text" autocomplete="off"'+
        ' placeholder="안양시, 군포시" value="'+esc(AD_PV.gus)+'"'+
        ' oninput="adPvSet(\'gus\',this.value)"></div>'+
    '</div>'+

    '<div class="ad-pv-b"><b>전문 업종</b>'+
      adPvChk("inds", window.AM_INDUSTRIES || [])+
    '</div>'+

    '<div class="ad-pv-b"><b>하는 일 — 하위 분야</b>'+
      '<p class="ad-rd-n">⚠️ 분류가 아니라 <b>하위 분야</b>입니다 '+
        '(<code>interior</code> 처럼 둘 다 있는 이름이 있어서 손으로 적으면 '+
        '틀립니다). 분야를 고르면 그 아래가 나옵니다 — <b>여러 분야에 걸쳐</b> '+
        '고르실 수 있고 고른 것은 그대로 쌓입니다.</p>'+
      /* ⚠️ `adSel2()` 를 쓰지 않습니다 — 그 틀은 `onchange` 에
         `adInviteSet` 을 **박아** 두어서, 여기 쓰면 6번 칸의 초대 글
         상태가 같이 움직입니다 (한 객체에 두 화면을 섞는 자리). */
      '<div class="ad-g"><div class="ad-f">'+
        '<label for="ad-pv-cat">분야</label>'+
        '<select id="ad-pv-cat" onchange="adPvCat(this.value)">'+
          '<option value="">골라 주세요</option>'+
          adPvCats().map(function(c){
            return '<option value="'+esc(c.key)+'"'+
              (AD_PV.cat === c.key ? " selected" : "")+'>'+esc(c.name)+'</option>';
          }).join("")+
        '</select>'+
      '</div></div>'+
      (subs.length ? adPvChk("subs", subs)
        : '<p class="ad-rd-n">분야를 먼저 골라 주세요.</p>')+
    '</div>'+

    '<label class="f-ck ad-pv-ls"><input type="checkbox"'+
      (AD_PV.listed ? " checked" : "")+
      ' onchange="adPvSet(\'listed\',this.checked)">'+
      '<span>DB 의 공개 목록에 바로 올립니다 (<code>listed</code>)</span></label>'+

    '<div id="ad-pv-out"></div>';

  adPvOut();
}

/* ════════════════════════════════════════════════════════════════════
   10. 전문관 노출 순서 (2026-10-11 UI/UX 지시서 §5)

   > §5 — "관리자에서 노출 순서 변경 가능하도록 설계."

   ⚠️⚠️ **아무것도 저장하지 않습니다.** 백엔드가 없는데 "저장되었습니다"
   라고 하면 그게 절대 규칙 5 입니다. 여기가 하는 일은 **눌러서 차례를
   바꾸고, 그 차례대로 `js/data/halls.js` 에 붙여 넣을 줄을 만들어
   주는 것**까지입니다 — 7번 매물 등록 줄 · 9번 제휴업체 등록 줄과
   같은 방식입니다.

   ⚠️ 손으로 차례를 옮기면 쉼표 · 중괄호에서 틀리고, 틀리면 빌드가
   멈추거나(그나마 다행) 그 칸이 조용히 빠집니다.
   ⚠️ 이름 · 주소 · 아이콘은 **건드리지 않습니다** — 차례만 바꿉니다.
   ════════════════════════════════════════════════════════════════════ */
var AD_HL = null;

function adHlInit(){
  if(AD_HL) return;
  /* 원본을 복사해 둡니다 — 화면에서 AM_HALLS 를 직접 흔들면
     되돌릴 수가 없습니다 */
  AD_HL = (window.AM_HALLS || []).map(function(h){
    return { key:h.key, name:h.name, items:(h.items||[]).map(function(i){ return i.n; }) };
  });
}

function adHlMove(hi, ii, dir){
  adHlInit();
  var arr = (ii < 0) ? AD_HL : AD_HL[hi].items;
  var at  = (ii < 0) ? hi : ii;
  var to  = at + dir;
  if(to < 0 || to >= arr.length) return;
  var t = arr[at]; arr[at] = arr[to]; arr[to] = t;
  adHlDraw();
}

function adHlDraw(){
  var box = document.getElementById("ad-hl");
  if(!box) return;
  adHlInit();
  if(!AD_HL.length){
    box.innerHTML = '<p class="ad-lead">전문관 데이터가 없습니다 '+
      '(js/data/halls.js 가 admin.html 에 실려 있는지 보세요).</p>';
    return;
  }
  box.innerHTML = AD_HL.map(function(h, hi){
    return '<div class="ad-hl-h">'+
      '<div class="ad-hl-t">'+
        '<b>'+esc(h.name)+'</b> <i>'+esc(h.key)+' · '+h.items.length+'개</i>'+
        '<span class="ad-hl-b">'+
          '<button class="btn btn-s" type="button" onclick="adHlMove('+hi+',-1,-1)">↑</button>'+
          '<button class="btn btn-s" type="button" onclick="adHlMove('+hi+',-1,1)">↓</button>'+
        '</span>'+
      '</div>'+
      '<ol class="ad-hl-l">'+h.items.map(function(n, ii){
        return '<li><span>'+esc(n)+'</span>'+
          '<span class="ad-hl-b">'+
            '<button class="btn btn-s" type="button" onclick="adHlMove('+hi+','+ii+',-1)">↑</button>'+
            '<button class="btn btn-s" type="button" onclick="adHlMove('+hi+','+ii+',1)">↓</button>'+
          '</span></li>'; }).join("")+'</ol>'+
    '</div>';
  }).join("")+
  '<div class="ad-acts">'+
    '<button class="btn btn-b" type="button" onclick="adHlCopy()">'+
      '붙여 넣을 줄 만들기</button>'+
    '<button class="btn btn-o" type="button" onclick="AD_HL=null;adHlDraw()">'+
      '처음 차례로</button>'+
  '</div>'+
  '<textarea id="ad-t-halls" rows="12" spellcheck="false" '+
    'placeholder="차례를 바꾸신 뒤 단추를 누르시면 여기에 나옵니다"></textarea>';
}

/* ⚠️⚠️ **차례만 바꾼 줄을 만듭니다.** 원본 객체의 다른 칸(ia · cat ·
   sub · to · tone)은 손대지 않고 그대로 옮겨 적습니다 — 여기서 새로
   적으면 두 곳에 같은 규칙을 적는 셈이고 반드시 어긋납니다. */
function adHlCopy(){
  adHlInit();
  var src = {};
  (window.AM_HALLS || []).forEach(function(h){
    var m = {}; (h.items||[]).forEach(function(i){ m[i.n] = i; });
    src[h.key] = { h:h, byName:m };
  });
  var q = function(v){ return '"' + String(v).replace(/"/g, '\\"') + '"'; };
  var out = "window.AM_HALLS = [\n" + AD_HL.map(function(hh){
    var h = src[hh.key].h;
    var lines = hh.items.map(function(n){
      var it = src[hh.key].byName[n]; if(!it) return "";
      var bits = ["n:" + q(it.n), "ia:" + q(it.ia)];
      if(it.cat)  bits.push("cat:"  + q(it.cat));
      if(it.sub)  bits.push("sub:"  + q(it.sub));
      if(it.to)   bits.push("to:"   + q(it.to));
      if(it.tone) bits.push("tone:" + q(it.tone));
      return "      { " + bits.join(", ") + " }";
    }).filter(Boolean).join(",\n");
    return "  { key:" + q(h.key) + ", name:" + q(h.name) + ", lead:" + q(h.lead) + ",\n" +
           "    tone:" + q(h.tone) + ", to:" + q(h.to) + ", ic:" + q(h.ic) + ",\n" +
           "    items:[\n" + lines + "\n    ] }";
  }).join(",\n\n") + "\n];";
  var ta = document.getElementById("ad-t-halls");
  if(!ta) return;
  ta.value = out;
  /* ⚠️ adCopy 는 **요소 id** 를 받습니다 (글이 아닙니다) — 규칙을
     두 벌로 만들지 않습니다. */
  adCopy("halls");
}

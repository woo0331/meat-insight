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

window.myLoadDb = function(){
  var box = document.getElementById("my-db");
  if(!box || typeof fetch !== "function") return;
  fetch("/api/me", { headers:{ "accept":"application/json" } })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(d){
      /* 로그인이 꺼져 있거나 안 하셨으면 구간째 없습니다 */
      if(!d || !d.auth || !d.signedIn) return;
      /* ⚠️⚠️ **역할은 서버가 토큰으로 읽어 온 값**입니다 (`api/_auth.js`).
         화면이 고르는 것이 아니고, 여기서 고른다고 보이는 줄이 늘지도
         않습니다 — 무엇이 오는지는 RLS 와 `api/me.js` 의 칸 목록이
         정합니다. 여기서 하는 일은 **온 것을 어떻게 보여 줄지**까지입니다. */
      var role = d.role || "customer";
      var inner = role === "provider" ? MyPvBand(d)
                : (role === "staff" || role === "admin") ? MyDeskBand(d)
                : MyCustBand(d);
      box.innerHTML = '<div class="w">' + inner + '</div>';
      box.hidden = false;
    })
    .catch(function(e){ console.warn("[my] 신청 내역을 못 불러왔습니다 — " + e); });
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
    (L.length ? MyReqList(L) : Empty({
      icon:"doc", title:"아직 넣으신 신청이 없습니다",
      text:"필요한 일을 적어 보내시면 조건에 맞는 업체를 찾아 드립니다.",
      cta:'<a class="btn btn-b" href="'+esc(quoteTo({}))+'">'+
          '서비스 신청하기'+icon("arrow",17)+'</a>'
    }));
}

/* ── 업체 대시보드 (§9-4) ────────────────────────────────────────
   ⚠️⚠️ **배정된 건만 옵니다.** 거르는 일은 화면이 아니라 DB 의 RLS
   (`request_assigned`)가 합니다 — 화면에 버그가 하나 생겨도 남의
   신청이 새지 않습니다.
   ⚠️ 그래서 여기 성함 · 연락처가 있는 것이 맞습니다. **배정이 곧
   제3자 제공이고 동의 시각이 `assignment.agree3rd_at` 에 남아
   있습니다** (제17조 제2항) — 배정 전에는 줄 자체가 안 옵니다. */
function MyPvBand(d){
  var L = d.requests || [], DL = d.deals || [];
  return myHd("PARTNER", "배정받은 신청",
    "연결된 건만 보입니다. 성함과 연락처는 배정이 된 뒤에 함께 옵니다.")+
    (L.length ? MyPvList(L) :
      '<p class="lead">아직 배정된 신청이 없습니다. 배정되면 여기에 '+
        '연락처와 함께 보입니다.</p>'+
      '<div class="row-cta"><a class="btn btn-o" href="/join">'+
        '입점 안내 다시 보기'+icon("arrow",16)+'</a></div>')+
    MyDealBand(DL);
}

function MyPvList(L){
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
function myStTone(key){
  var s = (typeof amDealSt === "function") ? amDealSt(key) : null;
  if(!s) return "gray";
  if(s.key === "hold") return "warn";
  if(s.key === "lost") return "gray";
  if(s.end) return "ok";
  return "on";
}

function MyReqList(L){
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
    '</li>'; }).join("")+'</ul>';
}

function PageMy(){
  var p = amGet(MKEY, { side:"", industry:"", region:"", gu:"", pyeong:"", dday:"" });
  var qs = amGet("am.quotes.v1", []);
  var ind = p.industry ? amIndustry(p.industry) : null;

  return PgHero({
    kicker:"MY",
    h1raw: p.side === "close" ? "내 폐업" : (p.side === "start" ? "내 창업" : "지금 어느 쪽이세요?"),
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
  '<section class="sec sec-white"><div class="w">'+
    '<div class="my-set">'+
      '<div class="f-r"><label for="my-side">상황</label>'+
        '<select class="sel" id="my-side" onchange="myPut()">'+
          '<option value=""'+(!p.side?" selected":"")+'>고르지 않음</option>'+
          '<option value="start"'+(p.side==="start"?" selected":"")+'>창업 준비중</option>'+
          '<option value="close"'+(p.side==="close"?" selected":"")+'>폐업 준비중</option>'+
        '</select></div>'+
      '<div class="f-r"><label for="my-ind">업종</label>'+
        IndustrySelect("my-ind", p.industry, "myPut()")+'</div>'+
      '<div class="f-r"><label for="my-reg">지역</label>'+
        RegionSelect("my-reg", p.region, "myPut()")+'</div>'+
      '<div class="f-r"><label for="my-py">평수</label>'+
        '<input id="my-py" inputmode="numeric" value="'+esc(p.pyeong||"")+'" '+
        'onchange="myPut()" placeholder="예: 30"></div>'+
    '</div>'+

    (p.side && ind
      ? '<div class="my-next"><h2>'+esc(ind.name)+' '+
          (p.side==="close"?"정리":"창업")+'에 필요한 것</h2>'+
          '<div class="cat-g cat-g4">'+
            amCatsFor(p.industry, p.side==="close"?"close":"start").slice(0,8)
              .map(function(c){ return CatCard(c, p.industry); }).join("")+
          '</div>'+
          '<div class="row-cta">'+
            '<a class="btn btn-b" href="'+esc(p.side==="close"?("/closure/"+p.industry):("/startup/"+p.industry))+'">'+
              '전부 보기'+icon("arrow",16)+'</a>'+
            '<a class="btn btn-o" href="'+esc(quoteTo({industry:p.industry,region:p.region,side:p.side}))+'">'+
              '견적 요청</a>'+
          '</div></div>'
      : Empty({
          icon:"user",
          title:"상황과 업종을 고르시면",
          text:"그 업종에 실제로 필요한 것만 여기 모아 드립니다.",
          cta:'<a class="btn btn-b" href="/startup">창업 시작하기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/closure">폐업 시작하기</a>'
        }))+

    MySaved()+

    MyTools()+

    '<div class="my-next"><h2>받은 제안</h2>'+
      (qs.length
        ? '<p class="lead">'+qs.length+'건을 적어 두셨습니다.</p>'+
          '<div class="row-cta"><a class="btn btn-o" href="/quote">비교 화면으로</a></div>'
        /* ⚠️ 문장 한가운데 링크를 박지 않습니다 — 높이가 16px 이라
           누르기 어렵습니다. 문단 끝에 버튼으로 냅니다 (바로 위
           칸과 같은 꼴입니다). */
        : '<p class="lead">아직 적어 두신 제안이 없습니다. 견적을 받으시면 '+
          '나란히 놓고 보실 수 있습니다.</p>'+
          '<div class="row-cta"><a class="btn btn-o" href="/quote">'+
            '제안 비교 화면 열기</a></div>')+
    '</div>'+

    '<div class="row-cta"><button class="btn btn-o" type="button" onclick="myClear()">'+
      '내 기록 전부 지우기</button></div>'+
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

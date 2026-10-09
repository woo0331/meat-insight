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
   내 신청 내역 — 2026-10-09 최종 통합 지시서 §11-1
   ══════════════════════════════════════════════════════════════════
   > "상담 신청 내역 · 계약 진행 현황 · 재신청 및 추가 서비스"

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
      var L = (d.requests || []);
      box.innerHTML = '<div class="w">'+
        '<div class="sec-hd">'+
          '<p class="eyebrow">MY REQUEST</p>'+
          '<h2>내가 넣은 신청</h2>'+
          '<p>접수번호로 물어보실 수 있습니다. 진행 상태가 바뀌면 여기에 '+
            '그대로 보입니다.</p>'+
        '</div>'+
        (L.length ? MyReqList(L) : Empty({
          icon:"doc", title:"아직 넣으신 신청이 없습니다",
          text:"필요한 일을 적어 보내시면 조건에 맞는 업체를 찾아 드립니다.",
          cta:'<a class="btn btn-b" href="'+esc(quoteTo({}))+'">'+
              '서비스 신청하기'+icon("arrow",17)+'</a>'
        }))+
      '</div>';
      box.hidden = false;
    })
    .catch(function(e){ console.warn("[my] 신청 내역을 못 불러왔습니다 — " + e); });
};

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
      '<p class="myq-m">'+
        [ (r.side === "close" ? "폐업 · 정리" : "창업"),
          (cat ? cat.name : ""),
          (r.industry && typeof amIndustryName === "function" ? amIndustryName(r.industry) : ""),
          (r.region && typeof amRegionName === "function" ? amRegionName(r.region) : "")
        ].filter(Boolean).map(esc).join(" · ")+'</p>'+
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

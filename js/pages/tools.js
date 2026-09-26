/* ════════════════════════════════════════════════════════════════════
   도구 모음 (/tools) · 수율 원가 (/tools/yield) · 손익분기 (/tools/bep)

   이 사이트가 "업체 연결해 주는 곳" 과 갈라지는 자리입니다. 업체를
   붙여 주는 곳은 많고, 우리가 다른 점은 **고기 장사의 숫자를 안다**는
   것인데 그건 말이 아니라 **써 보게 해야** 증명됩니다.

   ⚠️ **기준값을 만들지 마세요** (절대 규칙 1). "수율 65%면 정상" ·
   "원가율 35% 이하로 맞추세요" 는 부위·손질 기준·업종·지역마다 달라서
   우리가 댈 근거가 없습니다. 여기서 나오는 숫자는 전부 **사장님이 적은
   값을 나눈 것**이라 틀릴 여지가 없고, 그래서 판정도 하지 않습니다.
   상태색(--ok/--warn/--bad)도 쓰지 않습니다.

   ⚠️ **안 적은 칸은 "—" 입니다.** 빈 칸을 0 으로 치거나 평균값으로
   메우면 그 순간 지어낸 숫자가 됩니다. 무엇을 더 적어야 답이 나오는지
   대신 적어 줍니다.

   ⚠️ 적으신 숫자는 **이 브라우저에만** 남습니다. 서버로 보내지
   않습니다. 성함·연락처는 담지 않습니다 — 가게 컴퓨터는 여러 사람이
   씁니다. 지우는 단추를 같이 냅니다.

   ⚠️ 입력 중에는 **화면을 다시 그리지 않습니다.** 다시 그리면 커서가
   날아가고 적던 글이 사라집니다. 결과 칸만 갈아 끼웁니다
   (창업비 정리표에서 쓰는 방법과 같습니다).
   ════════════════════════════════════════════════════════════════════ */

var YL_KEY  = "wow.yield.v1";
var BEP_KEY = "wow.bep.v1";
var LB_KEY  = "wow.labor.v1";

/* ⚠️ localStorage 는 사파리 비공개 모드 등에서 **던집니다.** 감싸지
   않으면 화면이 통째로 안 그려집니다. */
function tlLoad(key){
  try{
    var raw = localStorage.getItem(key);
    var o = raw ? JSON.parse(raw) : null;
    return (o && typeof o === "object") ? o : {};
  }catch(e){ return {}; }
}
function tlSave(key, o){
  try{ localStorage.setItem(key, JSON.stringify(o)); }catch(e){}
}

/* 사장님은 "1,250" 처럼 쉼표를 찍어 적습니다. 숫자가 아니면 null —
   0 과 구별해야 합니다. "안 적음" 과 "0 원" 은 다른 뜻입니다. */
function numOf(v){
  var s = String(v == null ? "" : v).replace(/[^0-9.]/g, "");
  if(!s) return null;
  var n = parseFloat(s);
  return isFinite(n) ? n : null;
}
function has(v){ var n = numOf(v); return n !== null && n > 0; }

/* 소수 한 자리까지. 정수면 정수로 — "65.0%" 는 읽기 나쁩니다.
   ⚠️ **음수를 그냥 floor 하지 마세요.** 공헌이익률은 음수가 됩니다
   (변동비율 합이 100%를 넘을 때). -10.5 를 floor 하면 -11 이 되어
   "-11.5" 라고 적게 됩니다 — 틀린 숫자입니다. 부호를 떼고 셉니다. */
function dec1(n){
  var r = Math.round(n * 10) / 10;
  if(r === Math.round(r)) return won(r);
  var sign = r < 0 ? "-" : "", a = Math.abs(r), i = Math.floor(a);
  return sign + won(i) + "." + Math.round((a - i) * 10);
}

/* ── 입력 한 줄 ─────────────────────────────────────────────
   ⚠️ label 을 빼지 마세요. 읽어 주는 프로그램에는 칸 이름이 그것뿐입니다. */
function tlRow(r, v, fn){
  return '<li class="tl-i">'+
    '<span class="tl-t"><b>'+esc(r.name)+'</b><span>'+esc(r.hint)+'</span></span>'+
    '<span class="tl-in">'+
      '<label class="sr" for="tl-'+esc(r.key)+'">'+esc(r.name)+'</label>'+
      '<input id="tl-'+esc(r.key)+'" type="text" inputmode="decimal" autocomplete="off"'+
        ' value="'+esc(v[r.key] || "")+'"'+
        ' oninput="'+esc(fn)+'(\''+esc(r.key)+'\',this.value)">'+
      '<em>'+esc(r.unit)+'</em></span>'+
  '</li>';
}

/* 결과 한 칸 — 값이 없으면 "—" 와 **무엇을 더 적어야 하는지** */
function tlOut(name, val, unit, need){
  return '<div class="tl-o'+(val === null ? " tl-o-off" : "")+'">'+
    '<span class="tl-o-n">'+esc(name)+'</span>'+
    '<b>'+(val === null ? '<em class="tl-dash">—</em>'
                        : esc(val)+'<em>'+esc(unit)+'</em>')+'</b>'+
    '<span class="tl-o-h">'+esc(val === null ? need : "")+'</span>'+
  '</div>';
}

/* ════════════════════════════════════════════════════════════
   도구 모음 (/tools)
   ⚠️ 명단이 아니라 **지금 바로 되는 것**을 모아 둔 자리입니다.
   전부 가입 없이, 사람 손을 안 타고 됩니다.
   ════════════════════════════════════════════════════════════ */
window.TOOL_LIST = [
  { to:"/check",      icon:"gauge", name:"무료 사업진단",
    line:"여덟 가지로 지금 무엇을 파악하고 계시고 무엇이 비어 있는지 셉니다.",
    time:"3분" },
  { to:"/tools/yield", icon:"knife", name:"수율 원가 계산",
    line:"원육을 손질하고 나면 원가가 달라집니다. 실제 1kg 원가와 1인분 원가를 냅니다.",
    time:"1분" },
  { to:"/tools/bep",   icon:"target", name:"손익분기 계산",
    line:"고정비와 재료비율을 적으시면 한 달에 얼마를 팔아야 본전인지 나옵니다.",
    time:"2분" },
  { to:"/start/cost",  icon:"won",   name:"창업비 정리표",
    line:"빠뜨리기 쉬운 칸을 전부 늘어놓고, 받으신 견적으로 합계와 빈 칸을 봅니다.",
    time:"5분" },
  { to:"/tools/labor", icon:"users", name:"인건비율 계산",
    line:"월 매출과 인건비를 적으시면 인건비율과 한 사람당 매출이 나옵니다.",
    time:"1분" },
  { to:"/quotes",      icon:"scale", name:"견적 비교",
    line:"받으신 견적을 나란히 놓고 금액·기간·A/S·포함 범위를 맞춰 봅니다.",
    time:"5분" }
];

function PageTools(){
  return '<section class="pg-hero"><div class="w pgh">'+
      '<div class="pgh-t">'+
      '<p class="eyebrow">도구</p>'+
      '<h1 class="pg-h1">숫자로 보셔야<br class="br-m"> 결정이 됩니다.</h1>'+
      '<p class="pg-lead">감으로 하시던 것을 사장님 가게 숫자로 확인하는 자리입니다. '+
        '가입하지 않으셔도 되고, 적으신 숫자는 이 브라우저 밖으로 나가지 않습니다.</p>'+
      '<ul class="pg-facts">'+
        fact("info", "<b>업계 평균을 알려 드리지 않습니다.</b> "+
          "부위·손질 기준·업종·지역마다 달라서 저희가 댈 근거가 없습니다. "+
          "여기 나오는 숫자는 전부 사장님이 적으신 값을 나눈 것입니다.")+
        fact("lock", "적으신 숫자는 이 브라우저에만 남습니다. 서버로 보내지 않습니다.")+
      '</ul>'+
      '</div>'+
      '<figure class="pgh-f">'+photoBox("hero-tools")+'</figure>'+
    '</div></section>'+

    '<div class="w tl-hub">'+
      '<ul class="tl-g">'+TOOL_LIST.map(function(t){
        return '<li><a class="tl-c" href="'+esc(t.to)+'">'+
          '<span class="tl-c-ic">'+icon(t.icon,24)+'</span>'+
          '<span class="tl-c-t"><b>'+esc(t.name)+'</b>'+
            '<span>'+esc(t.line)+'</span></span>'+
          '<span class="tl-c-go">'+esc(t.time)+icon("chev",16)+'</span>'+
        '</a></li>';
      }).join("")+'</ul>'+

      '<section class="st-cta">'+
        '<h2>숫자가 나왔는데 어디를 고쳐야 할지 모르시겠다면.</h2>'+
        '<p>계산은 어디가 새는지까지만 알려 줍니다. 막는 건 사람이 합니다 — '+
          '지금 막힌 것을 적어 주시면 무엇이 필요한 일인지부터 정리해 드립니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/sos">무료로 물어보기'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-o btn-lg" href="/my">MY BUSINESS 보기</a>'+
        '</div>'+
      '</section>'+
    '</div>';
}

/* ════════════════════════════════════════════════════════════
   수율 원가 (/tools/yield)

   ⚠️ 고깃집·정육점에서 원가가 어긋나는 제일 큰 이유입니다. 매입 단가는
   원육 기준인데 파는 것은 손질 후 정육이라, 손질로 빠진 무게만큼 원가가
   올라갑니다. 그런데 계산은 대개 매입 단가로 합니다.
   ════════════════════════════════════════════════════════════ */
var YL_ROWS = [
  { key:"price", name:"원육 매입 단가", unit:"원/kg",
    hint:"거래명세서에 적힌 그대로. 부가세 포함 여부를 통일하세요" },
  { key:"inkg",  name:"매입 무게",      unit:"kg",
    hint:"손질하기 전, 받으신 그대로의 무게" },
  { key:"outkg", name:"손질 후 무게",   unit:"kg",
    hint:"지방·힘줄·뼈를 떼고 실제로 팔 수 있게 된 무게" },
  { key:"serve", name:"1인분 중량",     unit:"g",
    hint:"모르시면 비워 두세요. 1kg 원가까지는 나옵니다" },
  { key:"sell",  name:"1인분 판매가",   unit:"원",
    hint:"메뉴판 가격. 비워 두시면 원가율만 안 나옵니다" }
];

function PageYield(){
  var v = tlLoad(YL_KEY);
  return '<section class="pg-hero"><div class="w pgh">'+
      '<div class="pgh-t">'+
      '<p class="eyebrow">도구 · 수율 원가</p>'+
      '<h1 class="pg-h1">손질하고 나면<br class="br-m"> 원가가 달라집니다.</h1>'+
      '<p class="pg-lead">매입 단가는 <b>원육</b> 기준인데 파는 것은 <b>손질 후 정육</b>입니다. '+
        '빠진 무게만큼 원가가 올라가는데, 계산은 대개 매입 단가로 합니다.</p>'+
      '<ul class="pg-facts">'+
        fact("info", "<b>몇 %가 정상이라고 말하지 않습니다.</b> "+
          "부위·손질 기준·거래처마다 다릅니다. 같은 부위를 두 거래처에서 받아 "+
          "<b>나란히 견줄 때</b> 쓰시는 것이 제일 정확합니다.")+
        fact("lock", "적으신 숫자는 이 브라우저에만 남습니다. 서버로 보내지 않습니다.")+
      '</ul>'+
      '</div>'+
      '<figure class="pgh-f">'+photoBox("hero-yield")+'</figure>'+
    '</div></section>'+

    '<div class="w tl">'+
      '<ul class="tl-l">'+YL_ROWS.map(function(r){ return tlRow(r, v, "ylIn"); }).join("")+'</ul>'+
      '<div class="tl-res" id="yl-res">'+YlRes(v)+'</div>'+

      '<div class="st-foot">'+
        '<p class="note">적으신 숫자는 이 브라우저에만 남습니다.</p>'+
        '<button class="btn btn-o" type="button" onclick="ylReset()">'+
          icon("refresh",18)+'적은 숫자 지우기</button>'+
      '</div>'+

      '<section class="st-cta">'+
        '<h2>원가가 높게 나왔다면, 고기부터 다시 보세요.</h2>'+
        '<p>같은 부위라도 거래처에 따라 단가도 수율도 다릅니다. '+
          '쓰시는 부위와 월 사용량을 적어 주시면 조건에 맞는 육류 공급처 견적을 받아 드립니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/request?s=beef-supply">육류 공급 견적 받기'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-o btn-lg" href="/tools/bep">손익분기 계산하기</a>'+
        '</div>'+
      '</section>'+
    '</div>';
}

function YlRes(v){
  var price = numOf(v.price), inkg = numOf(v.inkg), outkg = numOf(v.outkg),
      serve = numOf(v.serve), sell = numOf(v.sell);

  var rate = null, real = null, per = null, ratio = null, lost = null;
  if(has(v.inkg) && has(v.outkg)) rate = dec1(outkg / inkg * 100);
  if(has(v.inkg) && has(v.outkg)) lost = dec1(Math.max(0, inkg - outkg));
  if(has(v.price) && has(v.inkg) && has(v.outkg)) real = won(Math.round(price * inkg / outkg));
  if(real !== null && has(v.serve))
    per = won(Math.round(price * inkg / outkg * serve / 1000));
  if(per !== null && has(v.sell))
    ratio = dec1(price * inkg / outkg * serve / 1000 / sell * 100);

  var note;
  if(rate === null)
    note = "매입 무게와 손질 후 무게를 적으시면 수율부터 나옵니다.";
  else if(real === null)
    note = "원육 매입 단가를 더 적으시면 손질 후 실제 원가가 나옵니다.";
  else if(per === null)
    note = "1인분 중량을 더 적으시면 1인분 원가까지 나옵니다.";
  else if(ratio === null)
    note = "1인분 판매가를 더 적으시면 원가율까지 나옵니다.";
  else if(outkg > inkg)
    note = "손질 후 무게가 매입 무게보다 큽니다. 두 칸을 다시 봐 주세요.";
  else
    note = "이 숫자는 전부 사장님이 적으신 값을 나눈 것입니다. "+
           "저희가 정한 기준과 견준 값이 아닙니다.";

  return '<div class="tl-og">'+
      tlOut("수율", rate, "%", "무게 두 칸")+
      tlOut("손질 후 실제 원가", real, "원/kg", "매입 단가")+
      tlOut("1인분 원가", per, "원", "1인분 중량")+
      tlOut("원가율", ratio, "%", "1인분 판매가")+
    '</div>'+
    '<p class="tl-note">'+
      (lost !== null
        ? '<span>손질로 빠진 무게가 <b>'+esc(lost)+'kg</b> 입니다. '+
          '이 무게의 값이 남은 고기에 그대로 얹힙니다.</span> '
        : '')+
      '<span>'+esc(note)+'</span></p>';
}

window.ylIn = function(key, val){
  var o = tlLoad(YL_KEY);
  if(String(val || "").trim()) o[key] = val; else delete o[key];
  tlSave(YL_KEY, o);
  var el = $("yl-res");
  if(el) el.innerHTML = YlRes(o);   /* 입력 중이라 화면을 다시 그리지 않습니다 */
};
window.ylReset = function(){
  tlSave(YL_KEY, {});
  toast("적으신 숫자를 지웠습니다.");
  rerender(true);
};

/* ════════════════════════════════════════════════════════════
   손익분기 (/tools/bep)

   고정비 ÷ 공헌이익률. 공헌이익률 = 100% − 매출에 비례해 나가는 비용의 비율.
   ⚠️ 인건비를 고정비에 넣은 것은 **월급제 기준**입니다. 매출에 따라
   시간이 늘고 주는 가게는 일부를 변동비로 보셔야 맞습니다 — 그 말을
   화면에 적어 둡니다. 우리가 대신 정해 주면 그게 지어낸 기준입니다.
   ════════════════════════════════════════════════════════════ */
var BEP_FIX = [
  { key:"rent",  name:"임차료",   unit:"만원", hint:"월세 + 관리비" },
  { key:"labor", name:"인건비",   unit:"만원", hint:"월급·4대보험·퇴직충당까지. 사장님 인건비도 넣으세요" },
  { key:"util",  name:"공과금",   unit:"만원", hint:"전기·가스·수도·통신" },
  { key:"etc",   name:"그 외 고정비", unit:"만원", hint:"보험·이자·POS·정기구독·감가" }
];
var BEP_VAR = [
  { key:"food",  name:"식재료비 비율", unit:"%", hint:"매출 대비. 모르시면 수율 원가 계산부터 해 보세요" },
  { key:"fee",   name:"수수료 비율",   unit:"%", hint:"카드·배달앱·포장 용기 등 팔릴 때마다 나가는 것" }
];
var BEP_RUN = [
  { key:"days",   name:"월 영업일수", unit:"일", hint:"쉬는 날을 뺀 실제 영업일" },
  { key:"ticket", name:"객단가",     unit:"원", hint:"손님 한 분이 평균 얼마를 쓰시는지" }
];

function PageBep(){
  var v = tlLoad(BEP_KEY);
  return '<section class="pg-hero"><div class="w pgh">'+
      '<div class="pgh-t">'+
      '<p class="eyebrow">도구 · 손익분기</p>'+
      '<h1 class="pg-h1">한 달에 얼마를 팔아야<br class="br-m"> 본전인가요?</h1>'+
      '<p class="pg-lead">이 숫자를 모르면 매출이 늘어도 불안하고, 줄어도 얼마나 급한지 모릅니다. '+
        '고정비와 비율만 적으시면 바로 나옵니다.</p>'+
      '<ul class="pg-facts">'+
        fact("info", "<b>업계 평균으로 빈 칸을 메우지 않습니다.</b> "+
          "안 적으신 칸은 계산에서 빠지고, 무엇을 더 적어야 하는지 알려 드립니다.")+
        fact("hand", "인건비를 고정비에 넣었습니다. <b>월급제 기준</b>입니다 — "+
          "매출에 따라 시간이 늘고 주는 가게라면 그만큼을 아래 수수료 비율 쪽으로 보셔야 맞습니다.")+
        fact("lock", "적으신 숫자는 이 브라우저에만 남습니다. 서버로 보내지 않습니다.")+
      '</ul>'+
      '</div>'+
      '<figure class="pgh-f">'+photoBox("hero-bep")+'</figure>'+
    '</div></section>'+

    '<div class="w tl">'+
      '<h2 class="tl-h">매달 나가는 돈 <span>팔리든 안 팔리든</span></h2>'+
      '<ul class="tl-l">'+BEP_FIX.map(function(r){ return tlRow(r, v, "bepIn"); }).join("")+'</ul>'+

      '<h2 class="tl-h">팔릴 때마다 나가는 비율 <span>매출 대비</span></h2>'+
      '<ul class="tl-l">'+BEP_VAR.map(function(r){ return tlRow(r, v, "bepIn"); }).join("")+'</ul>'+

      '<h2 class="tl-h">나눠 볼 기준 <span>안 적으셔도 월 매출까지는 나옵니다</span></h2>'+
      '<ul class="tl-l">'+BEP_RUN.map(function(r){ return tlRow(r, v, "bepIn"); }).join("")+'</ul>'+

      '<div class="tl-res" id="bep-res">'+BepRes(v)+'</div>'+

      '<div class="st-foot">'+
        '<p class="note">적으신 숫자는 이 브라우저에만 남습니다.</p>'+
        '<button class="btn btn-o" type="button" onclick="bepReset()">'+
          icon("refresh",18)+'적은 숫자 지우기</button>'+
      '</div>'+

      '<section class="st-cta">'+
        '<h2>고정비를 줄이는 쪽이 대개 더 빠릅니다.</h2>'+
        '<p>매출을 올리는 데는 시간이 걸리지만, 임차·공과금·설비는 조건을 바꾸면 이번 달부터 바뀝니다. '+
          '어느 칸이 큰지 적어 주시면 그 항목부터 견적을 받아 드립니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/sos?q='+
            encodeURIComponent("손익분기를 계산해 보니 고정비가 부담입니다. 어디부터 줄일 수 있을까요?")+
            '">어디부터 줄일지 물어보기'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-o btn-lg" href="/tools/yield">수율 원가 계산하기</a>'+
        '</div>'+
      '</section>'+
    '</div>';
}

function BepRes(v){
  var fixSum = 0, fixN = 0;
  BEP_FIX.forEach(function(r){ if(has(v[r.key])){ fixSum += numOf(v[r.key]); fixN++; } });

  var varSum = 0, varN = 0;
  BEP_VAR.forEach(function(r){ if(has(v[r.key])){ varSum += numOf(v[r.key]); varN++; } });

  var cm = varN ? (100 - varSum) : null;          /* 공헌이익률 % */
  var month = null, day = null, guests = null;
  if(fixN && cm !== null && cm > 0) month = fixSum / (cm / 100);   /* 만원 */
  if(month !== null && has(v.days)) day = month / numOf(v.days);
  if(day !== null && has(v.ticket)) guests = Math.ceil(day * 10000 / numOf(v.ticket));

  var note;
  if(!fixN)             note = "매달 나가는 돈을 한 칸이라도 적으시면 시작됩니다.";
  else if(cm === null)  note = "식재료비 비율이나 수수료 비율을 적으시면 필요한 월 매출이 나옵니다.";
  else if(cm <= 0)      note = "팔릴 때마다 나가는 비율이 100%를 넘습니다. "+
                               "이 조건에서는 많이 팔수록 더 손해입니다. 비율 칸을 다시 봐 주세요.";
  else if(day === null) note = "월 영업일수를 적으시면 하루에 얼마가 필요한지까지 나옵니다.";
  else if(guests === null) note = "객단가를 적으시면 하루 몇 분을 받아야 하는지까지 나옵니다.";
  else                  note = "이 숫자는 사장님이 적으신 고정비를 공헌이익률로 나눈 것입니다. "+
                               "저희가 정한 기준이 아닙니다.";

  return '<div class="tl-og">'+
      tlOut("고정비 합계", fixN ? won(Math.round(fixSum)) : null, "만원", "고정비 한 칸")+
      tlOut("공헌이익률", cm === null ? null : dec1(cm), "%", "비율 한 칸")+
      tlOut("본전 월 매출", month === null ? null : won(Math.round(month)), "만원", "위 두 가지")+
      tlOut("하루 필요 매출", day === null ? null : won(Math.round(day)), "만원", "월 영업일수")+
    '</div>'+
    '<p class="tl-note">'+
      (guests !== null
        ? '<span>객단가대로라면 하루 <b>'+esc(won(guests))+'분</b>을 받으셔야 본전입니다.</span> '
        : '')+
      '<span>'+esc(note)+'</span></p>';
}

window.bepIn = function(key, val){
  var o = tlLoad(BEP_KEY);
  if(String(val || "").trim()) o[key] = val; else delete o[key];
  tlSave(BEP_KEY, o);
  var el = $("bep-res");
  if(el) el.innerHTML = BepRes(o);
};
window.bepReset = function(){
  tlSave(BEP_KEY, {});
  toast("적으신 숫자를 지웠습니다.");
  rerender(true);
};

/* ── MY BUSINESS 가 읽어 가는 요약 ───────────────────────────
   ⚠️ 없는 것을 있는 것처럼 만들지 않습니다. 안 적으셨으면 n:0 입니다. */
window.ylBrief = function(){
  var v = tlLoad(YL_KEY);
  var n = YL_ROWS.filter(function(r){ return has(v[r.key]); }).length;
  if(!n) return { n:0 };
  var out = { n:n, total:YL_ROWS.length, rate:null, real:null };
  if(has(v.inkg) && has(v.outkg)) out.rate = dec1(numOf(v.outkg) / numOf(v.inkg) * 100);
  if(has(v.price) && has(v.inkg) && has(v.outkg))
    out.real = won(Math.round(numOf(v.price) * numOf(v.inkg) / numOf(v.outkg)));
  return out;
};
window.bepBrief = function(){
  var v = tlLoad(BEP_KEY);
  var keys = BEP_FIX.concat(BEP_VAR).concat(BEP_RUN);
  var n = keys.filter(function(r){ return has(v[r.key]); }).length;
  if(!n) return { n:0 };
  var fixSum = 0, fixN = 0;
  BEP_FIX.forEach(function(r){ if(has(v[r.key])){ fixSum += numOf(v[r.key]); fixN++; } });
  var varSum = 0, varN = 0;
  BEP_VAR.forEach(function(r){ if(has(v[r.key])){ varSum += numOf(v[r.key]); varN++; } });
  var cm = varN ? (100 - varSum) : null;
  var month = (fixN && cm !== null && cm > 0) ? won(Math.round(fixSum / (cm / 100))) : null;
  return { n:n, total:keys.length, month:month };
};


/* ════════════════════════════════════════════════════════════
   인건비율 (/tools/labor)

   ⚠️ **"인건비율 몇 %가 적정" 이라고 쓰지 마세요.** 홀·주방 구성,
   사장님이 직접 뛰시는지, 배달 비중, 지역 시급이 전부 다릅니다.
   여기서 나오는 숫자는 사장님이 적으신 값을 나눈 것까지입니다.

   ⚠️ **사장 인건비는 따로 묻습니다.** 안 넣고 계산하면 실제보다
   인건비율이 낮게 보이고, 그 숫자로 사람을 더 뽑으시면 그때부터
   틀어집니다. 넣을지 말지는 사장님이 고르십니다 — 우리가 대신
   정하면 그게 지어낸 기준입니다.
   ════════════════════════════════════════════════════════════ */
var LB_SALES = [
  { key:"sales",  name:"월 매출",        hint:"부가세를 뺀 매출로 적으시면 비율이 더 정확합니다", unit:"만원" }
];
var LB_COST = [
  { key:"wage",   name:"직원 급여 합계",  hint:"이번 달에 실제로 나간 급여 (홀 · 주방 전부)", unit:"만원" },
  { key:"ins",    name:"4대보험 · 퇴직충당", hint:"사업주 부담분. 모르시면 비워 두세요", unit:"만원" },
  { key:"owner",  name:"사장 인건비",     hint:"직접 뛰시는 몫을 넣을지는 사장님이 고르십니다", unit:"만원" }
];
var LB_RUN = [
  { key:"heads",  name:"일하는 사람 수",  hint:"사장님 포함 여부는 위 사장 인건비와 맞추세요", unit:"명" },
  { key:"days",   name:"월 영업일수",     hint:"쉬는 날을 뺀 날수", unit:"일" }
];

function PageLabor(){
  var v = tlLoad(LB_KEY);
  return '<section class="pg-hero"><div class="w pgh">'+
      '<div class="pgh-t">'+
      '<p class="eyebrow">도구 · 인건비율</p>'+
      '<h1 class="pg-h1">사람 값이<br class="br-m"> 매출의 몇 %인가요?</h1>'+
      '<p class="pg-lead">급여만 보면 한 사람 값이 실제보다 적게 보입니다. '+
        '4대보험과 사장님 몫까지 넣어야 실제 비율이 나옵니다.</p>'+
      '<ul class="pg-facts">'+
        fact("info", "<b>몇 %가 적정이라고 말하지 않습니다.</b> 홀·주방 구성, "+
          "사장님이 직접 뛰시는지, 배달 비중, 지역 시급이 전부 다릅니다.")+
        fact("hand", "<b>사장 인건비를 넣을지는 사장님이 고르십니다.</b> 안 넣으면 "+
          "비율이 낮게 보이고, 그 숫자로 사람을 더 뽑으시면 그때부터 틀어집니다.")+
        fact("lock", "적으신 숫자는 이 브라우저에만 남습니다. 서버로 보내지 않습니다.")+
      '</ul>'+
      '</div>'+
      '<figure class="pgh-f">'+photoBox("hero-bep")+'</figure>'+
    '</div></section>'+

    '<div class="w tl">'+
      '<h2 class="tl-h">매출 <span>비율의 분모입니다</span></h2>'+
      '<ul class="tl-l">'+LB_SALES.map(function(r){ return tlRow(r, v, "lbIn"); }).join("")+'</ul>'+

      '<h2 class="tl-h">사람에게 나가는 돈 <span>한 달 기준</span></h2>'+
      '<ul class="tl-l">'+LB_COST.map(function(r){ return tlRow(r, v, "lbIn"); }).join("")+'</ul>'+

      '<h2 class="tl-h">나눠 볼 기준 <span>안 적으셔도 인건비율까지는 나옵니다</span></h2>'+
      '<ul class="tl-l">'+LB_RUN.map(function(r){ return tlRow(r, v, "lbIn"); }).join("")+'</ul>'+

      '<div class="tl-res" id="lb-res">'+LbRes(v)+'</div>'+

      '<div class="st-foot">'+
        '<p class="note">적으신 숫자는 이 브라우저에만 남습니다.</p>'+
        '<button class="btn btn-o" type="button" onclick="lbReset()">'+
          icon("refresh",18)+'적은 숫자 지우기</button>'+
      '</div>'+

      '<section class="st-cta">'+
        '<h2>사람을 줄이기 전에 시간을 먼저 보세요.</h2>'+
        '<p>같은 인원이라도 피크 시간과 한가한 시간에 몇 명이 서 있는지에 따라 '+
          '같은 비율이 전혀 다른 뜻이 됩니다. 어느 시간대가 무거운지 적어 주시면 '+
          '그 자리부터 같이 봅니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/problem/staff">직원 · 인건비 해결방법 보기'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-o btn-lg" href="/tools/bep">손익분기 계산하기</a>'+
        '</div>'+
      '</section>'+
    '</div>';
}

function LbRes(v){
  var sales = has(v.sales) ? numOf(v.sales) : null;
  var sum = 0, n = 0;
  LB_COST.forEach(function(r){ if(has(v[r.key])){ sum += numOf(v[r.key]); n++; } });
  var cost = n ? sum : null;
  var rate = (sales && cost !== null) ? (cost / sales * 100) : null;
  var perHead = (sales && has(v.heads)) ? (sales / numOf(v.heads)) : null;
  var perDay  = (cost !== null && has(v.days)) ? (cost / numOf(v.days)) : null;

  var note;
  if(cost === null)        note = "사람에게 나가는 돈을 한 칸이라도 적으시면 시작됩니다.";
  else if(sales === null)  note = "월 매출을 적으시면 인건비율이 나옵니다.";
  else if(!has(v.owner))   note = "사장 인건비를 비워 두셨습니다. 직접 뛰시는 몫을 넣으면 "+
                                  "비율이 올라갑니다 — 어느 쪽으로 보실지는 사장님이 정하십니다.";
  else if(perHead === null) note = "일하는 사람 수를 적으시면 한 사람당 매출까지 나옵니다.";
  else                     note = "이 숫자는 사장님이 적으신 값을 나눈 것입니다. "+
                                  "저희가 정한 기준이 아닙니다.";

  return '<div class="tl-og">'+
      tlOut("인건비 합계", cost === null ? null : won(Math.round(cost)), "만원", "사람 값 한 칸")+
      tlOut("인건비율", rate === null ? null : dec1(rate), "%", "월 매출")+
      tlOut("한 사람당 월 매출", perHead === null ? null : won(Math.round(perHead)), "만원", "사람 수")+
      tlOut("하루 인건비", perDay === null ? null : won(Math.round(perDay)), "만원", "월 영업일수")+
    '</div>'+
    '<p class="tl-note"><span>'+esc(note)+'</span></p>';
}

window.lbIn = function(key, val){
  var o = tlLoad(LB_KEY);
  if(String(val || "").trim()) o[key] = val; else delete o[key];
  tlSave(LB_KEY, o);
  var el = $("lb-res");
  if(el) el.innerHTML = LbRes(o);
};
window.lbReset = function(){
  tlSave(LB_KEY, {});
  toast("적으신 숫자를 지웠습니다.");
  rerender(true);
};
window.lbBrief = function(){
  var v = tlLoad(LB_KEY);
  var keys = LB_SALES.concat(LB_COST).concat(LB_RUN);
  var n = keys.filter(function(r){ return has(v[r.key]); }).length;
  if(!n) return { n:0 };
  var sales = has(v.sales) ? numOf(v.sales) : null;
  var sum = 0, c = 0;
  LB_COST.forEach(function(r){ if(has(v[r.key])){ sum += numOf(v[r.key]); c++; } });
  var rate = (sales && c) ? dec1(sum / sales * 100) : null;
  return { n:n, total:keys.length, rate:rate };
};

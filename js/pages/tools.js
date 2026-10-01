/* ════════════════════════════════════════════════════════════════════
   사장님 도구 (§10)

   ⚠️⚠️ **판정하지 않습니다.** "인건비율 25%면 좋다" 는 업종 · 지역 ·
   평수마다 달라서 우리가 댈 근거가 없습니다. 그래서 상태색
   (`--ok`/`--warn`/`--bad`)을 결과에 쓰지 않습니다.

   ⚠️ **안 적은 칸은 `—` 입니다.** 업계 평균으로 메우면 그 순간 지어낸
   숫자입니다. 대신 **무엇을 더 적어야 답이 나오는지**를 적어 줍니다.

   ⚠️⚠️ **입력 중에 화면을 다시 그리지 마세요.** 커서가 날아가고 적던
   것이 사라집니다. 결과 칸(`#tl-res`)만 갈아 끼웁니다.

   ⚠️ 적으신 숫자는 이 브라우저에만 남습니다. 서버로 안 보냅니다.
   ════════════════════════════════════════════════════════════════════ */

function tlKey(k){ return "am.tool." + k; }
function tlGet(k){ return amGet(tlKey(k)) || {}; }
function tlPut(k, v){ amSet(tlKey(k), v); }

/* 적힌 값이 있는가 — ⚠️ `0` 도 적은 값입니다. `!v` 로 보면 0 이
   "안 적음" 이 되어, 0 을 적으신 분의 답이 사라집니다. */
function tlHas(v){ return v !== undefined && v !== null && String(v).trim() !== ""; }
function tlNum(v){ var n = parseFloat(String(v).replace(/[^0-9.-]/g, "")); return isNaN(n) ? 0 : n; }
function tlMan(n){ return won(Math.round(n)) + "만원"; }

/* 결과 한 줄 — 값이 없으면 `—` */
function tlOut(label, val, sub){
  return '<div class="tl-o">'+
    '<span class="tl-o-k">'+esc(label)+'</span>'+
    '<b class="tl-o-v">'+(val === null || val === undefined ? "—" : val)+'</b>'+
    (sub ? '<span class="tl-o-s">'+esc(sub)+'</span>' : '')+
  '</div>';
}

/* 적는 줄 — ⚠️ 카드가 아닙니다. 옅은 면으로 **깔려** 있어야 합니다.
   떠 있으면 몇 줄만 이어져도 눈이 아픕니다. */
function tlRow(r, v, fn){
  var unit = r.unit || "만원";
  return '<li class="tl-i">'+
    '<span class="tl-i-l"><b>'+esc(r.name)+'</b>'+
      (r.hint ? '<i>'+esc(r.hint)+'</i>' : '')+'</span>'+
    '<span class="tl-i-f">'+
      '<input type="text" inputmode="decimal" id="'+esc(fn+"-"+r.key)+'" '+
        'value="'+esc(v[r.key] || "")+'" '+
        'oninput="'+esc(fn)+'(\''+esc(r.key)+'\', this.value)" '+
        'aria-label="'+esc(r.name)+'" placeholder="">'+
      '<em>'+esc(unit)+'</em>'+
    '</span>'+
  '</li>';
}

function tlFoot(resetFn, note){
  return '<div class="tl-foot">'+
    '<p class="note">'+esc(note || "적으신 숫자는 이 브라우저에만 남습니다. 서버로 보내지 않습니다.")+'</p>'+
    '<button class="btn btn-o" type="button" onclick="'+esc(resetFn)+'()">'+
      icon("refresh",18)+'적은 숫자 지우기</button>'+
  '</div>';
}

/* 도구 끝에서 다음 걸음 — 막다른 길로 두지 않습니다 */
function tlNext(label, href, other){
  return '<section class="sec"><div class="w band-cta">'+
    '<div><p class="eyebrow">다음으로</p><h2>'+esc(label)+'</h2></div>'+
    '<a class="btn btn-b btn-lg" href="'+esc(href)+'">견적 요청하기'+icon("arrow",18)+'</a>'+
  '</div></section>'+
  (other ? '' : '');
}

/* ════════ 도구 모음 ═════════════════════════════════════════════ */
function PageTools(){
  var list = (window.amTools ? amTools() : []);
  if(!list.length) return PgHero({ kicker:"사장님 도구", h1:"사장님 도구", tight:true });
  return PgHero({
    kicker:"사장님 도구",
    h1raw:"숫자를 넣어 보면<br class=\"br-m\"> 정해집니다.",
    lead:"전부 사장님이 적으신 숫자를 나누는 것까지입니다. 기준값을 만들어 "+
         "\"이 정도면 좋다\" 고 판정하지 않습니다 — 업종과 지역마다 달라서 "+
         "우리가 댈 근거가 없습니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<ul class="tl-g">'+list.map(function(t){
      return '<li><a class="tl-c" href="'+esc(t.to)+'">'+
        '<span class="tl-c-ic">'+icon(t.icon,22)+'</span>'+
        '<b>'+esc(t.name)+'</b>'+
        '<span class="tl-c-l">'+esc(t.lead)+'</span>'+
        /* ⚠️ 나오는 값 자리는 `—` 입니다. 그럴듯한 숫자를 넣으면 그
           순간 지어낸 값입니다. */
        '<span class="tl-c-m">'+
          '<em>'+esc(t.ask)+'</em>'+icon("arrow",14)+'<em>'+esc(t.out)+'</em>'+
        '</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
    '<p class="note note-mid">받으신 견적을 나란히 놓고 비교하는 것은 따로 있습니다.</p>'+
    '<div class="row-cta row-mid"><a class="btn btn-o" href="/quote">'+
      '견적 비교하기'+icon("arrow",16)+'</a></div>'+
  '</div></section>';
}

/* ════════ 창업비 정리표 ═══════════════════════════════════════════
   ⚠️ **예상 금액을 알려 주지 않습니다.** 근거 없는 "예상 3,200만원" 을
   적으면 사장님이 그 숫자로 돈을 빌리러 갑니다. */
window.costIn = function(k, val){
  var v = tlGet("cost"); v[k] = val; tlPut("cost", v);
  var el = document.getElementById("tl-res");
  if(el) el.innerHTML = CostRes(v);
};
window.costReset = function(){
  if(!confirm("적으신 금액을 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(tlKey("cost")); rerender(true);
};
function CostRes(v){
  var sum = 0, done = 0, total = 0, missing = [];
  (window.AM_COST_GROUPS||[]).forEach(function(g){
    g.items.forEach(function(it){
      total++;
      if(tlHas(v[it.key])){ sum += tlNum(v[it.key]); done++; }
      else missing.push(it.name);
    });
  });
  return '<div class="tl-res-g">'+
    tlOut("지금까지 적으신 합계", done ? tlMan(sum) : null,
          done ? done + " / " + total + "개 항목" : "한 칸이라도 적으시면 나옵니다")+
    tlOut("아직 견적을 안 받은 칸", done ? (total - done) + "개" : null,
          missing.length ? missing.slice(0, 3).join(" · ") +
            (missing.length > 3 ? " 외 " + (missing.length - 3) : "") : "전부 적으셨습니다")+
  '</div>'+
  /* ⚠️ 여기에 "예상 총액" 을 넣지 마세요. 안 적은 칸을 평균으로 메우는
     순간 지어낸 숫자가 됩니다. */
  '<p class="tl-res-n">안 적으신 칸은 계산에서 <b>빠집니다.</b> 업계 평균으로 '+
    '메우지 않습니다 — 지역 · 평수 · 시공 수준에 따라 항목마다 몇 배씩 '+
    '차이 나서, 그 숫자를 보고 예산을 잡으면 그만큼 어긋납니다.</p>';
}
function PageToolCost(){
  var v = tlGet("cost");
  return PgHero({
    crumb: Crumb([["사장님 도구","/tools"],["창업비 정리표"]]),
    kicker:"사장님 도구",
    h1:"창업비 정리표",
    lead:"예상 금액을 알려 드리지 않습니다. 빠뜨리기 쉬운 항목을 전부 늘어놓고, "+
         "실제로 받으신 견적을 적으시면 합계와 아직 안 받은 칸을 보여 드립니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w w-narrow">'+
    (window.AM_COST_GROUPS||[]).map(function(g){
      return '<h2 class="tl-h">'+esc(g.h)+'</h2>'+
        '<ul class="tl-l">'+g.items.map(function(it){
          return tlRow(it, v, "costIn"); }).join("")+'</ul>';
    }).join("")+
    '<div class="tl-res" id="tl-res">'+CostRes(v)+'</div>'+
    tlFoot("costReset")+
  '</div></section>'+
  tlNext("빠진 항목이 보이면 그 항목부터 견적을 받으세요", "/quote?side=start");
}

/* ════════ 월 고정비 ═══════════════════════════════════════════════ */
window.fixedIn = function(k, val){
  var v = tlGet("fixed"); v[k] = val; tlPut("fixed", v);
  var el = document.getElementById("tl-res");
  if(el) el.innerHTML = FixedRes(v);
};
window.fixedReset = function(){
  if(!confirm("적으신 숫자를 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(tlKey("fixed")); rerender(true);
};
function FixedRes(v){
  var sum = 0, n = 0;
  (window.AM_FIXED||[]).forEach(function(r){
    if(tlHas(v[r.key])){ sum += tlNum(v[r.key]); n++; }
  });
  var days = tlHas(v.days) ? tlNum(v.days) : null;
  var day = (n && days && days > 0) ? (sum / days) : null;
  return '<div class="tl-res-g">'+
    tlOut("월 고정비", n ? tlMan(sum) : null,
          n ? n + "개 항목" : "한 칸이라도 적으시면 나옵니다")+
    tlOut("하루에 벌어야 하는 돈", day !== null ? tlMan(day) : null,
          day !== null ? "고정비만 맞추는 기준입니다" : "월 영업일수를 적으시면 나옵니다")+
  '</div>'+
  '<p class="tl-res-n">이건 <b>고정비만</b> 맞추는 금액입니다. 재료비 · 수수료처럼 '+
    '팔릴 때마다 나가는 것은 안 들어갔습니다 — 그것까지 넣은 본전 매출은 '+
    '손익분기 계산에서 나옵니다.</p>';
}
function PageToolFixed(){
  var v = tlGet("fixed");
  var run = [{ key:"days", name:"월 영업일수", unit:"일", hint:"쉬는 날을 뺀 실제 영업일" }];
  return PgHero({
    crumb: Crumb([["사장님 도구","/tools"],["월 고정비 계산"]]),
    kicker:"사장님 도구",
    h1:"월 고정비 계산",
    lead:"팔리든 안 팔리든 나가는 돈입니다. 합계와, 하루에 얼마를 벌어야 "+
         "이것만이라도 맞는지까지 보여 드립니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w w-narrow">'+
    '<h2 class="tl-h">매달 나가는 돈</h2>'+
    '<ul class="tl-l">'+(window.AM_FIXED||[]).map(function(r){
      return tlRow(r, v, "fixedIn"); }).join("")+'</ul>'+
    '<h2 class="tl-h">나눠 볼 기준</h2>'+
    '<ul class="tl-l">'+run.map(function(r){ return tlRow(r, v, "fixedIn"); }).join("")+'</ul>'+
    '<div class="tl-res" id="tl-res">'+FixedRes(v)+'</div>'+
    tlFoot("fixedReset")+
  '</div></section>'+
  tlNext("큰 칸부터 조건을 바꾸면 이번 달부터 바뀝니다", "/quote");
}

/* ════════ 손익분기 ════════════════════════════════════════════════ */
window.bepIn = function(k, val){
  var v = tlGet("bep"); v[k] = val; tlPut("bep", v);
  var el = document.getElementById("tl-res");
  if(el) el.innerHTML = BepRes(v);
};
window.bepReset = function(){
  if(!confirm("적으신 숫자를 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(tlKey("bep")); rerender(true);
};
function BepRes(v){
  var fixSum = 0, fixN = 0;
  (window.AM_FIXED||[]).forEach(function(r){
    if(tlHas(v[r.key])){ fixSum += tlNum(v[r.key]); fixN++; }
  });
  var varSum = 0, varN = 0;
  (window.AM_BEP_VAR||[]).forEach(function(r){
    if(tlHas(v[r.key])){ varSum += tlNum(v[r.key]); varN++; }
  });
  var cm = varN ? (100 - varSum) : null;   /* 공헌이익률 % */
  /* ⚠️⚠️ **100% 를 넘는 것만 막으면 모자랍니다.** 변동비 합이 99.99%
     이면 공헌이익률이 0.01% 라, 나눈 값이 **85조원** 같은 숫자가 되어
     버젓이 나왔습니다 — 게다가 배지는 소수 첫째 자리에서 반올림해
     "공헌이익률 0%" 라고 적고 있었습니다. 0 으로 나눈 값이 유한할 수는
     없으니 화면이 스스로 모순된 말을 한 셈입니다.
     1% 아래에서는 적으신 비율이 0.1 만 틀려도 답이 몇 배로 흔들립니다.
     그런 숫자는 정보가 아니라 **잘못된 확신**이라, 숫자 대신 왜 안
     나오는지를 적습니다. */
  var tiny = (cm !== null && cm > 0 && cm < 1);
  var month = null, day = null, guests = null;
  if(fixN && cm !== null && cm >= 1) month = fixSum / (cm / 100);
  if(month !== null && tlHas(v.days) && tlNum(v.days) > 0) day = month / tlNum(v.days);
  if(day !== null && tlHas(v.ticket) && tlNum(v.ticket) > 0)
    guests = Math.ceil(day * 10000 / tlNum(v.ticket));

  /* ⚠️ **많이 팔수록 손해인 조건을 얼버무리지 마세요.** 변동비 합이
     100% 를 넘으면 손익분기 매출이라는 것이 없습니다. 큰 숫자를 하나
     내놓는 대신 그 사실을 적습니다. */
  var over = (cm !== null && cm <= 0);
  var note;
  if(!fixN)            note = "매달 나가는 돈을 한 칸이라도 적으시면 시작됩니다.";
  else if(cm === null) note = "재료비 비율이나 수수료 비율을 적으시면 필요한 월 매출이 나옵니다.";
  else if(over)        note = "팔릴 때마다 나가는 비율이 100%를 넘습니다. 이 조건에서는 "+
                              "많이 팔수록 더 손해입니다 — 손익분기 매출이라는 것이 없습니다. "+
                              "비율 칸을 다시 봐 주세요.";
  else if(tiny)        note = "팔릴 때마다 나가는 비율이 99%를 넘습니다. 남는 것이 "+
                              "100원에 1원이 안 되는 조건이라, 본전 매출이 현실에 없는 "+
                              "크기로 나옵니다 — 비율을 0.1만 다르게 적어도 답이 몇 배로 "+
                              "바뀝니다. 숫자를 내는 대신 적어 둡니다. 비율 칸을 다시 봐 주세요.";
  else                 note = "고정비를 공헌이익률(100% − 변동비율)로 나눈 값입니다. "+
                              "안 적으신 칸은 계산에서 빠집니다.";

  return '<div class="tl-res-g">'+
    tlOut("본전이 되는 월 매출", (month !== null && !over) ? tlMan(month) : null,
          /* ⚠️ 1% 아래를 반올림하면 "공헌이익률 0%" 가 됩니다 — 숫자를
             안 내는 자리라 배지도 안 답니다. */
          (cm !== null && cm >= 1) ? "공헌이익률 " + (Math.round(cm * 10) / 10) + "%" : "")+
    tlOut("하루 매출", day !== null ? tlMan(day) : null,
          day !== null ? "" : "월 영업일수를 적으시면 나옵니다")+
    tlOut("하루 손님 수", guests !== null ? won(guests) + "명" : null,
          guests !== null ? "" : "객단가를 적으시면 나옵니다")+
  '</div>'+
  '<p class="tl-res-n">'+esc(note)+'</p>'+
  /* ⚠️ 인건비를 고정비에 넣은 것은 **월급제 기준**입니다. 우리가 대신
     정해 주면 그게 지어낸 기준이라, 화면에 적고 사장님이 고르시게 둡니다. */
  '<p class="tl-res-n">인건비를 고정비에 넣었습니다 — <b>월급제 기준</b>입니다. '+
    '매출에 따라 시간이 늘고 주는 가게라면 그만큼을 위의 비율 쪽으로 '+
    '보셔야 맞습니다.</p>';
}
function PageToolBep(){
  var v = tlGet("bep");
  return PgHero({
    crumb: Crumb([["사장님 도구","/tools"],["손익분기 계산"]]),
    kicker:"사장님 도구",
    h1:"손익분기 계산",
    lead:"본전이 되는 매출이 얼마인지. 고정비를 공헌이익률로 나눈 값이라 "+
         "적으신 숫자가 전부이면 틀릴 여지가 없습니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w w-narrow">'+
    '<h2 class="tl-h">매달 나가는 돈 <span>팔리든 안 팔리든</span></h2>'+
    '<ul class="tl-l">'+(window.AM_FIXED||[]).map(function(r){
      return tlRow(r, v, "bepIn"); }).join("")+'</ul>'+
    '<h2 class="tl-h">팔릴 때마다 나가는 비율 <span>매출 대비</span></h2>'+
    '<ul class="tl-l">'+(window.AM_BEP_VAR||[]).map(function(r){
      return tlRow(r, v, "bepIn"); }).join("")+'</ul>'+
    '<h2 class="tl-h">나눠 볼 기준 <span>안 적으셔도 월 매출까지는 나옵니다</span></h2>'+
    '<ul class="tl-l">'+(window.AM_BEP_RUN||[]).map(function(r){
      return tlRow(r, v, "bepIn"); }).join("")+'</ul>'+
    '<div class="tl-res" id="tl-res">'+BepRes(v)+'</div>'+
    tlFoot("bepReset")+
  '</div></section>'+
  tlNext("고정비를 줄이는 쪽이 대개 더 빠릅니다", "/quote");
}

/* ════════ 인건비율 ════════════════════════════════════════════════ */
window.laborIn = function(k, val){
  var v = tlGet("labor"); v[k] = val; tlPut("labor", v);
  var el = document.getElementById("tl-res");
  if(el) el.innerHTML = LaborRes(v);
};
window.laborReset = function(){
  if(!confirm("적으신 숫자를 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(tlKey("labor")); rerender(true);
};
function LaborRes(v){
  var sales = tlHas(v.sales) ? tlNum(v.sales) : null;
  var cost = 0, n = 0;
  ["wage","ins","owner"].forEach(function(k){
    if(tlHas(v[k])){ cost += tlNum(v[k]); n++; }
  });
  var rate = (sales && sales > 0 && n) ? (cost / sales * 100) : null;
  var heads = tlHas(v.heads) ? tlNum(v.heads) : null;
  var per = (sales && heads && heads > 0) ? (sales / heads) : null;

  return '<div class="tl-res-g">'+
    /* ⚠️ 여기에 상태색을 쓰지 마세요. "몇 %면 좋다" 는 업종 · 지역 ·
       영업시간마다 달라서 우리가 댈 근거가 없습니다. */
    tlOut("인건비율", rate !== null ? (Math.round(rate * 10) / 10) + "%" : null,
          rate !== null ? "인건비 " + tlMan(cost) + " ÷ 매출 " + tlMan(sales) : "매출과 인건비를 적으시면 나옵니다")+
    tlOut("1인당 매출", per !== null ? tlMan(per) : null,
          per !== null ? "" : "일하는 사람 수를 적으시면 나옵니다")+
  '</div>'+
  '<p class="tl-res-n"><b>몇 %면 좋다고 말씀드리지 않습니다.</b> 업종 · 영업시간 · '+
    '지역 · 사장님이 직접 뛰시는 정도에 따라 크게 달라서, 그 기준을 뒷받침할 '+
    '데이터가 우리에게 없습니다. 대신 <b>달마다 적어 두시면</b> 사장님 가게의 '+
    '흐름이 보입니다 — 그게 남의 평균보다 쓸모 있습니다.</p>'+
  '<p class="tl-res-n">사장 인건비를 넣을지는 사장님이 고르십니다. 넣으면 "이 가게가 '+
    '사람을 쓸 여력이 있는가", 빼면 "지금 내 손에 남는 게 얼마인가" 에 가까운 '+
    '숫자가 됩니다.</p>';
}
function PageToolLabor(){
  var v = tlGet("labor");
  var g = {};
  (window.AM_LABOR||[]).forEach(function(r){ (g[r.group] = g[r.group] || []).push(r); });
  return PgHero({
    crumb: Crumb([["사장님 도구","/tools"],["인건비율 계산"]]),
    kicker:"사장님 도구",
    h1:"인건비율 계산",
    lead:"매출 대비 인건비가 몇 %인지. 판정하지 않습니다 — 달마다 적어 두시면 "+
         "사장님 가게의 흐름이 보입니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w w-narrow">'+
    Object.keys(g).map(function(k){
      return '<h2 class="tl-h">'+esc(k)+'</h2>'+
        '<ul class="tl-l">'+g[k].map(function(r){
          return tlRow(r, v, "laborIn"); }).join("")+'</ul>';
    }).join("")+
    '<div class="tl-res" id="tl-res">'+LaborRes(v)+'</div>'+
    tlFoot("laborReset")+
  '</div></section>'+
  tlNext("사람을 쓰기 전에 확인할 것이 여럿입니다", "/providers/staff");
}

/* ════════ 신규 창업 vs 매장 인수 (§16) ═══════════════════════════ */
window.vsIn = function(k, val){
  var v = tlGet("vs"); v[k] = val; tlPut("vs", v);
  var el = document.getElementById("tl-res");
  if(el) el.innerHTML = VsRes(v);
};
window.vsReset = function(){
  if(!confirm("적으신 숫자를 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(tlKey("vs")); rerender(true);
};
function vsSum(v, side){
  var sum = 0, n = 0;
  (window.AM_VS||[]).forEach(function(r){
    if(r.side !== side || r.unit) return;
    if(tlHas(v[r.key])){ sum += tlNum(v[r.key]); n++; }
  });
  return { sum:sum, n:n };
}
function VsRes(v){
  var a = vsSum(v, "new"), b = vsSum(v, "take");
  var diff = (a.n && b.n) ? (a.sum - b.sum) : null;
  var nd = tlHas(v.n_days) ? tlNum(v.n_days) : null;
  var td = tlHas(v.t_days) ? tlNum(v.t_days) : null;
  var dd = (nd !== null && td !== null) ? (nd - td) : null;

  return '<div class="tl-res-g tl-res-g2">'+
    tlOut("새로 만들 때", a.n ? tlMan(a.sum) : null,
          a.n ? a.n + "개 항목" : "한 칸이라도 적으시면 나옵니다")+
    tlOut("가게를 받을 때", b.n ? tlMan(b.sum) : null,
          b.n ? b.n + "개 항목" : "한 칸이라도 적으시면 나옵니다")+
  '</div>'+
  '<div class="tl-res-g tl-res-g2">'+
    tlOut("초기 비용 차이", diff !== null ? tlMan(Math.abs(diff)) : null,
          diff === null ? "양쪽을 다 적으시면 나옵니다"
            : (diff > 0 ? "받는 쪽이 적게 듭니다" :
               diff < 0 ? "새로 만드는 쪽이 적게 듭니다" : "같습니다"))+
    tlOut("문 여는 시점 차이", dd !== null ? (Math.abs(dd) + "일") : null,
          dd === null ? "양쪽 기간을 적으시면 나옵니다"
            : (dd > 0 ? "받는 쪽이 빠릅니다" :
               dd < 0 ? "새로 만드는 쪽이 빠릅니다" : "같습니다"))+
  '</div>'+
  /* ⚠️ **어느 쪽이 낫다고 말하지 마세요.** 금액과 기간만으로 정해지지
     않습니다 — 자리 · 기존 손님 · 시설 상태 · 계약 잔여기간이 전부
     다릅니다. 우리는 그 가게를 보지 않았습니다. */
  '<p class="tl-res-n"><b>어느 쪽이 낫다고 말씀드리지 않습니다.</b> 초기 비용과 '+
    '기간만으로 정해지지 않기 때문입니다 — 자리 · 기존 손님 · 시설 상태 · '+
    '임대차 잔여기간이 전부 다르고, 우리는 그 가게를 보지 않았습니다. '+
    '나란히 놓는 데까지가 저희 몫입니다.</p>'+
  '<p class="tl-res-n">받는 쪽을 보실 때는 <b>권리금이 무엇에 대한 값인지</b>와 '+
    '<b>시설을 그대로 쓸 수 있는지</b>를 꼭 확인하세요. 문 여는 날이 빨라도 '+
    '고칠 것이 많으면 결국 같아집니다.</p>';
}
function PageToolVs(){
  var v = tlGet("vs");
  var nw = (window.AM_VS||[]).filter(function(r){ return r.side === "new"; });
  var tk = (window.AM_VS||[]).filter(function(r){ return r.side === "take"; });
  return PgHero({
    crumb: Crumb([["사장님 도구","/tools"],["신규 창업 vs 매장 인수"]]),
    kicker:"사장님 도구",
    h1raw:"새로 만들까,<br class=\"br-m\"> 하던 가게를 받을까",
    lead:"들어가는 돈과 문 여는 시점을 나란히 놓습니다. 어느 쪽이 낫다고 "+
         "판정하지는 않습니다 — 그 가게를 본 사람만 알 수 있습니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w w-narrow">'+
    '<h2 class="tl-h">새로 만들 때</h2>'+
    '<ul class="tl-l">'+nw.map(function(r){ return tlRow(r, v, "vsIn"); }).join("")+'</ul>'+
    '<h2 class="tl-h">하던 가게를 받을 때</h2>'+
    '<ul class="tl-l">'+tk.map(function(r){ return tlRow(r, v, "vsIn"); }).join("")+'</ul>'+
    '<div class="tl-res" id="tl-res">'+VsRes(v)+'</div>'+
    tlFoot("vsReset")+
  '</div></section>'+
  '<section class="sec"><div class="w band-cta">'+
    '<div><p class="eyebrow">받는 쪽을 보고 계시면</p>'+
      '<h2>바로 시작할 수 있는 매장을 보세요</h2></div>'+
    '<a class="btn btn-b btn-lg" href="/stores">매장 보기'+icon("arrow",18)+'</a>'+
  '</div></section>';
}

/* ════════ 폐업 체크리스트 ═════════════════════════════════════════ */
window.closeTick = function(k){
  var v = tlGet("close"); v[k] = !v[k]; tlPut("close", v);
  var el = document.getElementById("tl-res");
  if(el) el.innerHTML = CloseRes(v);
  var box = document.getElementById("ck-" + k);
  if(box) box.setAttribute("aria-pressed", v[k] ? "true" : "false");
  var li = box && box.closest("li");
  if(li) li.className = "ck-i" + (v[k] ? " on" : "");
};
window.closeReset = function(){
  if(!confirm("체크한 것을 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(tlKey("close")); rerender(true);
};
function CloseRes(v){
  var total = 0, done = 0, dueLeft = [];
  (window.AM_CLOSE_CHECK||[]).forEach(function(g){
    g.items.forEach(function(it){
      total++;
      if(v[it.key]) done++;
      else if(it.due) dueLeft.push(it.t);
    });
  });
  return '<div class="tl-res-g">'+
    tlOut("끝낸 것", done + " / " + total, total ? Math.round(done / total * 100) + "%" : "")+
    tlOut("기한이 있는데 남은 것", dueLeft.length ? dueLeft.length + "개" : (done ? "없습니다" : null),
          dueLeft.length ? dueLeft[0] : "")+
  '</div>'+
  '<p class="tl-res-n">기한이 있는 것은 <b>늦으면 돈이 나갑니다</b> — 해고예고 · '+
    '금품청산 · 4대보험 상실 신고 · 폐업 신고가 그렇습니다. 체크한 것은 이 '+
    '브라우저에만 남습니다.</p>';
}
function PageToolClose(){
  var v = tlGet("close");
  return PgHero({
    crumb: Crumb([["사장님 도구","/tools"],["폐업 체크리스트"]]),
    kicker:"사장님 도구",
    h1:"폐업 체크리스트",
    lead:"순서대로 짚어 가며 빠뜨린 것을 찾습니다. 기한이 있는 것이 여럿이고, "+
         "늦으면 문을 닫은 뒤에도 돈이 나갑니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w w-narrow">'+
    (window.AM_CLOSE_CHECK||[]).map(function(g){
      return '<h2 class="tl-h">'+esc(g.h)+'</h2>'+
        '<ul class="ck-l">'+g.items.map(function(it){
          var on = !!v[it.key];
          /* ⚠️ grid 칸에 맨글을 두지 않습니다 — 태그로 감쌉니다. */
          return '<li class="ck-i'+(on?" on":"")+'">'+
            '<button class="ck-b" type="button" id="'+esc("ck-"+it.key)+'" '+
              'aria-pressed="'+(on?"true":"false")+'" '+
              'onclick="closeTick(\''+esc(it.key)+'\')">'+
              '<span class="ck-x" aria-hidden="true">'+icon("check",15)+'</span>'+
              '<span class="ck-t"><b>'+esc(it.t)+'</b>'+
                (it.n ? '<i>'+esc(it.n)+'</i>' : '')+'</span>'+
              (it.due ? '<em class="ck-due">기한 있음</em>' : '')+
            '</button>'+
          '</li>';
        }).join("")+'</ul>';
    }).join("")+
    '<div class="tl-res" id="tl-res">'+CloseRes(v)+'</div>'+
    tlFoot("closeReset", "체크한 것은 이 브라우저에만 남습니다. 서버로 보내지 않습니다.")+
  '</div></section>'+
  tlNext("철거 · 원상복구 · 폐기물은 업체가 합니다", "/quote?side=close");
}

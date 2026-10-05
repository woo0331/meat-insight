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
function tlNext(label, href, key){
  return '<section class="sec"><div class="w band-cta">'+
    '<div><p class="eyebrow">다음으로</p><h2>'+esc(label)+'</h2></div>'+
    '<a class="btn btn-b btn-lg" href="'+esc(href)+'">견적 요청하기'+icon("arrow",18)+'</a>'+
  '</div></section>'+
  tlRel(key);
}

/* ── 계산 결과 → 업체 (2026-10-05 V2 §17) ───────────────────────
   > "계산기 자체로 끝나면 안 된다. 정보 → 계산 → 업체 탐색 →
   >  상담/견적 이라는 전환 구조를 만든다."

   ⚠️ 어느 분야로 보낼지는 `tools.js` 의 `rel` 한 곳입니다 — 화면에
   적으면 도구를 늘릴 때마다 두 곳을 고치게 됩니다.
   ⚠️ 없는 분류 · 하위를 적으면 **빌드가 멈춥니다** (`checkProcess()`). */
function tlRel(key){
  var t = key && (window.amTool ? amTool(key) : null);
  var rel = (t && t.rel) || [];
  if(!rel.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">계산해 보셨으면</p>'+
      '<h2>이제 그 금액을 실제로 받아 보세요</h2>'+
      '<p>적으신 숫자는 받으신 견적이라야 뜻이 있습니다. 분야마다 업체를 '+
        '비교하고 한 번에 요청하실 수 있습니다.</p>'+
    '</div>'+
    '<ul class="ops-g">'+rel.map(function(r){
      var c = (window.amCat ? amCat(r.cat) : null);
      if(!c) return "";
      var nm = r.sub && window.amSubName ? amSubName(r.sub) : c.name;
      var to = catTo(c) + (r.sub ? "?s=" + encodeURIComponent(r.sub) : "");
      return '<li><a class="ops'+tn(c.tone)+'" href="'+esc(to)+'">'+
        '<span class="ops-i">'+icon(c.icon,22)+'</span>'+
        '<b>'+esc(nm)+'</b>'+
        '<span class="ops-go" aria-hidden="true">'+icon("chev",15)+'</span>'+
      '</a></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

/* 묶음별로 적는 줄을 냅니다 — ⚠️ 줄마다 `group` 을 데이터에 적고
   화면은 그것만 읽습니다. 화면에 묶음 이름을 또 적으면 데이터를
   고칠 때 두 곳을 고치게 됩니다. */
function tlGroups(rows, v, fn, subs){
  var seen = [], out = "";
  rows.forEach(function(r){ if(seen.indexOf(r.group || "") < 0) seen.push(r.group || ""); });
  seen.forEach(function(g){
    var mine = rows.filter(function(r){ return (r.group || "") === g; });
    if(!mine.length) return;
    if(g) out += '<h2 class="tl-h">'+esc(g)+
      ((subs && subs[g]) ? '<span>'+esc(subs[g])+'</span>' : '')+'</h2>';
    out += '<ul class="tl-l">'+mine.map(function(r){ return tlRow(r, v, fn); }).join("")+'</ul>';
  });
  return out;
}

/* 비율 한 줄 — ⚠️ 나누는 쪽이 0 이거나 안 적혔으면 `null` 입니다.
   0 으로 나눈 값을 내면 Infinity 가 화면에 찍힙니다. */
function tlPct(part, whole){
  if(!(whole > 0)) return null;
  return Math.round(part / whole * 1000) / 10;
}

/* 적는 함수 · 지우는 함수를 한 번에 만듭니다 — ⚠️ 도구 일곱 개에
   같은 코드를 일곱 번 적으면 한 곳만 고치는 사고가 납니다. */
function tlWire(key, resFn){
  window[key + "In"] = function(k, val){
    var v = tlGet(key); v[k] = val; tlPut(key, v);
    var el = document.getElementById("tl-res");
    if(el) el.innerHTML = resFn(v);
  };
  window[key + "Reset"] = function(){
    if(!confirm("적으신 숫자를 전부 지웁니다. 되돌릴 수 없습니다.")) return;
    amDel(tlKey(key)); rerender(true);
  };
}

/* 도구 한 화면의 틀 — 머리 · 적는 줄 · 결과 · 발 · 다음 걸음 */
function tlPage(o){
  var v = tlGet(o.key);
  return PgHero({
    crumb: Crumb([["사장님 도구","/tools"],[o.h1]]),
    kicker:"사장님 도구", h1:o.h1, lead:o.lead, tight:true
  })+
  '<section class="sec sec-white"><div class="w w-narrow">'+
    tlGroups(o.rows, v, o.key + "In", o.subs)+
    '<div class="tl-res" id="tl-res">'+o.res(v)+'</div>'+
    tlFoot(o.key + "Reset")+
  '</div></section>'+
  tlNext(o.next, o.nextTo || "/quote", o.key);
}

/* ════════ 목표 매출 (V2 §16) ══════════════════════════════════════
   ⚠️ 손익분기와 **같은 나눗셈**입니다 — 분자에 목표 순이익이 더해질
   뿐입니다. 그래서 경계 처리도 그대로 가져옵니다 (공헌이익률 1% 아래는
   숫자 대신 까닭). */
function TargetRes(v){
  var fix = tlHas(v.fixed) ? tlNum(v.fixed) : null;
  var pro = tlHas(v.profit) ? tlNum(v.profit) : null;
  var cm  = tlHas(v.varpct) ? (100 - tlNum(v.varpct)) : null;
  var over = (cm !== null && cm <= 0);
  var tiny = (cm !== null && cm > 0 && cm < 1);
  var month = null, day = null, guests = null;
  if(fix !== null && pro !== null && cm !== null && cm >= 1)
    month = (fix + pro) / (cm / 100);
  if(month !== null && tlHas(v.days) && tlNum(v.days) > 0) day = month / tlNum(v.days);
  if(day !== null && tlHas(v.ticket) && tlNum(v.ticket) > 0)
    guests = Math.ceil(day * 10000 / tlNum(v.ticket));
  /* 본전까지만 가는 매출도 같이 냅니다 — 목표와 얼마나 떨어져 있는지 */
  var bep = (fix !== null && cm !== null && cm >= 1) ? fix / (cm / 100) : null;

  var note;
  if(pro === null)      note = "가져가고 싶은 월 순이익을 적으시면 시작됩니다.";
  else if(fix === null) note = "월 고정비를 적으시면 필요한 매출이 나옵니다.";
  else if(cm === null)  note = "팔릴 때마다 나가는 비율을 적으시면 나옵니다.";
  else if(over)         note = "팔릴 때마다 나가는 비율이 100%를 넘습니다. 이 조건에서는 "+
                               "많이 팔수록 더 손해라, 목표에 닿는 매출이라는 것이 없습니다. "+
                               "비율 칸을 다시 봐 주세요.";
  else if(tiny)         note = "팔릴 때마다 나가는 비율이 99%를 넘습니다. 비율을 0.1만 "+
                               "다르게 적어도 답이 몇 배로 바뀌는 조건이라, 숫자를 내는 "+
                               "대신 적어 둡니다.";
  else                  note = "(고정비 + 목표 순이익)을 공헌이익률로 나눈 값입니다. "+
                               "안 적으신 칸은 계산에서 빠집니다.";

  return '<div class="tl-res-g">'+
    tlOut("필요한 월 매출", month !== null ? tlMan(month) : null,
          (cm !== null && cm >= 1) ? "공헌이익률 " + (Math.round(cm * 10) / 10) + "%" : "")+
    tlOut("하루 매출", day !== null ? tlMan(day) : null,
          day !== null ? "" : "월 영업일수를 적으시면 나옵니다")+
    tlOut("하루 손님 수", guests !== null ? won(guests) + "명" : null,
          guests !== null ? "" : "객단가를 적으시면 나옵니다")+
    tlOut("본전이 되는 매출", bep !== null ? tlMan(bep) : null,
          bep !== null ? "여기까지는 순이익 0입니다" : "")+
  '</div>'+
  '<p class="tl-res-n">'+esc(note)+'</p>'+
  '<p class="tl-res-n">순이익은 <b>세금을 내기 전</b> 기준입니다. '+
    '사장님 인건비를 고정비에 넣으셨는지에 따라 뜻이 달라집니다 — '+
    '넣으셨다면 여기 순이익은 그 위에 더 남는 몫입니다.</p>';
}

/* ════════ 권리금 따져보기 (V2 §16) ════════════════════════════════
   ⚠️⚠️ **월 순이익은 넘기시는 분이 적은 값입니다.** 우리가 확인할
   방법이 없는데 숫자만 내놓으면, 그걸 믿고 수천만 원을 내십니다 —
   매물 화면의 매출과 같은 자리입니다. 화면이 그 말을 같이 냅니다. */
function PremiumRes(v){
  var pre = tlHas(v.premium) ? tlNum(v.premium) : null;
  var eq  = tlHas(v.equip) ? tlNum(v.equip) : null;
  var pro = tlHas(v.profit) ? tlNum(v.profit) : null;
  var mon = tlHas(v.months) ? tlNum(v.months) : null;

  var back = (pre !== null && pro !== null && pro > 0) ? pre / pro : null;
  /* ⚠️⚠️ **손익분기의 85조원과 같은 자리입니다.** 월 순이익을 0.01 로
     적으면 회수 기간이 **300,000개월(25,000년)** 로 나왔습니다 — 숫자가
     나왔다는 것만으로 답처럼 읽힙니다. 상가건물 임대차보호법의 갱신요구권이
     최장 10년이라, 그 너머는 "언제 회수되나" 라는 질문 자체가 성립하지
     않습니다. 숫자 대신 그 사실을 적습니다. */
  var tooLong = (back !== null && back > 120);
  var good = (pre !== null && eq !== null) ? pre - eq : null;
  var inTerm = (back !== null && !tooLong && mon !== null && mon > 0) ? (back <= mon) : null;

  var note;
  if(pre === null)      note = "달라는 권리금을 적으시면 시작됩니다.";
  else if(pro === null) note = "월 순이익을 적으시면 몇 달이면 돌아오는지 나옵니다.";
  else if(!(pro > 0))   note = "월 순이익이 0 이하이면 권리금이 영업으로는 돌아오지 않습니다. "+
                               "시설값만 보시는 것이 맞습니다.";
  else if(tooLong)      note = "지금 적으신 값으로는 회수에 10년이 넘게 걸립니다. "+
                               "상가건물 임대차보호법의 갱신요구권이 최장 10년이라, "+
                               "그 안에 돌아오지 않는 조건입니다 — 월 순이익 칸을 다시 봐 주세요.";
  else                  note = "권리금을 월 순이익으로 나눈 값입니다. 안 적으신 칸은 계산에서 빠집니다.";

  return '<div class="tl-res-g">'+
    tlOut("돌아오는 데 걸리는 기간",
          back === null ? null
            : (tooLong ? "10년이 넘습니다" : (Math.round(back * 10) / 10) + "개월"),
          back === null ? "월 순이익을 적으시면 나옵니다"
            : (tooLong ? "월 순이익 칸을 다시 봐 주세요" : ""))+
    tlOut("시설값을 뺀 영업권 몫", good !== null ? tlMan(good) : null,
          good !== null ? "" : "시설 · 집기 값을 적으시면 나옵니다")+
    tlOut("남은 계약 안에 회수되나",
          inTerm === null ? null : (inTerm ? "계약 안에 들어옵니다" : "계약보다 깁니다"),
          mon !== null ? "남은 계약 " + won(mon) + "개월" : "남은 임대차 기간을 적으시면 나옵니다")+
  '</div>'+
  '<p class="tl-res-n">'+esc(note)+'</p>'+
  /* ⚠️ 지우지 마세요 — 이 도구에서 제일 중요한 줄입니다 */
  '<p class="tl-res-n"><b>월 순이익은 넘기시는 분이 적어 주신 값입니다.</b> '+
    '저희가 확인하거나 보증하는 값이 아닙니다 — 카드 매출 자료 · 부가세 '+
    '신고서 · 임대차 계약서를 직접 보시고 적으세요.</p>'+
  '<p class="tl-res-n">남은 계약보다 회수 기간이 길면, 계약이 갱신되어야 '+
    '본전이 됩니다 — <b>갱신 여부는 건물주가 정합니다.</b> 상가건물 임대차보호법의 '+
    '갱신요구권에는 기간과 예외가 있어서 계약서와 같이 보셔야 합니다.</p>';
}

/* ════════ 임대료 비율 (V2 §16) ════════════════════════════════════ */
function RentRes(v){
  var sal = tlHas(v.sales) ? tlNum(v.sales) : null;
  var monthly = 0, has = false;
  ["rent","mgmt"].forEach(function(k){ if(tlHas(v[k])){ monthly += tlNum(v[k]); has = true; } });
  var pct = (has && sal !== null) ? tlPct(monthly, sal) : null;

  var pre = tlHas(v.premium) ? tlNum(v.premium) : null;
  var mon = tlHas(v.months) ? tlNum(v.months) : null;
  var preMonthly = (pre !== null && mon !== null && mon > 0) ? pre / mon : null;
  var pct2 = (pct !== null && preMonthly !== null) ? tlPct(monthly + preMonthly, sal) : null;

  var note;
  if(!has)             note = "월세나 관리비를 적으시면 시작됩니다.";
  else if(sal === null)note = "월 매출을 적으시면 비율이 나옵니다.";
  else if(!(sal > 0))  note = "월 매출이 0이면 비율을 낼 수 없습니다.";
  else                 note = "달마다 나가는 임차료를 월 매출로 나눈 값입니다. "+
                              "몇 %면 좋다고 말씀드리지 않습니다 — 업종 · 상권 · 평수마다 "+
                              "달라서 우리가 댈 근거가 없습니다.";

  return '<div class="tl-res-g">'+
    tlOut("임차료 비율", pct !== null ? pct + "%" : null,
          has ? "월 " + tlMan(monthly) : "")+
    tlOut("권리금까지 나눠 보면", pct2 !== null ? pct2 + "%" : null,
          preMonthly !== null ? "권리금 월 " + tlMan(preMonthly) + " 몫"
            : (pre !== null ? "앞으로 영업할 개월을 적으시면 나옵니다"
                            : "권리금과 영업할 개월을 적으시면 나옵니다"))+
    tlOut("묶여 있는 보증금", tlHas(v.deposit) ? tlMan(tlNum(v.deposit)) : null,
          tlHas(v.deposit) ? "돌려받는 돈이라 비용에 안 더했습니다" : "")+
  '</div>'+
  '<p class="tl-res-n">'+esc(note)+'</p>'+
  '<p class="tl-res-n">권리금은 <b>한 번에 낸 돈</b>이라 달마다 나가지는 않습니다. '+
    '다만 그만큼을 영업 기간으로 나눠 보면 실제로 자리에 쓰는 돈이 보입니다 — '+
    '계약이 일찍 끝나면 그 몫은 더 커집니다.</p>';
}

/* ════════ 직원 고용비용 (V2 §16) ══════════════════════════════════
   ⚠️⚠️ **4대보험 요율을 박아 두지 않았습니다.** 해마다 바뀌고 산재는
   업종마다 다릅니다 — 적어 두면 틀린 날부터 거짓말입니다. */
function HireRes(v){
  var wage = tlHas(v.wage) ? tlNum(v.wage) : null;
  var ins  = (wage !== null && tlHas(v.insPct)) ? wage * tlNum(v.insPct) / 100 : null;
  /* 퇴직충당 — 근로자퇴직급여보장법의 30일분 평균임금(급여의 1/12) */
  var sev  = (wage !== null) ? wage / 12 : null;
  var meal = tlHas(v.meal) ? tlNum(v.meal) : 0;
  var etc  = tlHas(v.etc) ? tlNum(v.etc) : 0;
  var one  = (wage !== null) ? wage + (ins || 0) + sev + meal + etc : null;
  var n    = tlHas(v.heads) ? tlNum(v.heads) : null;
  var all  = (one !== null && n !== null && n > 0) ? one * n : null;
  var year = (all !== null) ? all * 12 : null;
  var up   = (one !== null && wage > 0) ? tlPct(one - wage, wage) : null;

  var note;
  if(wage === null)         note = "월 급여를 적으시면 시작됩니다.";
  else if(!tlHas(v.insPct)) note = "사업주 4대보험 부담률을 적으시면 그 줄이 더해집니다. "+
                                   "지금은 급여 · 퇴직충당 · 식대까지만 더했습니다.";
  else                      note = "급여에 사업주 부담 4대보험 · 퇴직충당 · 식대 · 그 외를 "+
                                   "더한 값입니다. 안 적으신 칸은 계산에서 빠집니다.";

  return '<div class="tl-res-g">'+
    tlOut("한 사람 월 실제 비용", one !== null ? tlMan(one) : null,
          up !== null ? "급여보다 " + up + "% 더" : "")+
    tlOut("전체 월", all !== null ? tlMan(all) : null,
          all !== null ? won(n) + "명 기준" : "사람 수를 적으시면 나옵니다")+
    tlOut("1년", year !== null ? tlMan(year) : null,
          year !== null ? "같은 조건이 열두 달 이어질 때" : "")+
  '</div>'+
  '<p class="tl-res-n">'+esc(note)+'</p>'+
  '<p class="tl-res-n">퇴직충당은 <b>급여의 1/12</b> 로 잡았습니다 — '+
    '퇴직금이 30일분 평균임금이라 미리 쌓아 두는 몫입니다. '+
    '계속 근로가 1년 미만이면 발생하지 않으니, 단기 아르바이트라면 그만큼 빼고 보세요. '+
    '주휴수당 · 연장 · 야간 · 휴일 수당은 근무 형태마다 달라서 '+
    '<b>급여 칸에 포함해서</b> 적어 주세요.</p>';
}

/* ════════ 배달 한 건 (V2 §16) ═════════════════════════════════════ */
function DeliveryRes(v){
  var price = tlHas(v.price) ? tlNum(v.price) : null;
  var pctSum = 0, pctHas = false;
  ["feePct","payPct"].forEach(function(k){
    if(tlHas(v[k])){ pctSum += tlNum(v[k]); pctHas = true; } });
  var feeWon = (price !== null && pctHas) ? price * pctSum / 100 : null;
  var flat = 0, flatHas = false;
  ["deliver","pack","food","ad"].forEach(function(k){
    if(tlHas(v[k])){ flat += tlNum(v[k]); flatHas = true; } });
  var left = (price !== null) ? price - (feeWon || 0) - flat : null;
  var pct  = (left !== null) ? tlPct(left, price) : null;

  var note;
  if(price === null)             note = "메뉴 판매가를 적으시면 시작됩니다.";
  else if(!pctHas && !flatHas)   note = "수수료율이나 건당 나가는 돈을 적으시면 나옵니다.";
  else if(left !== null && left < 0)
                                 note = "지금 적으신 조건에서는 한 건 팔 때마다 돈이 나갑니다. "+
                                        "칸을 다시 봐 주세요 — 특히 수수료율과 배달비 부담을요.";
  else                           note = "판매가에서 비율로 빠지는 것과 건마다 빠지는 것을 뺀 값입니다. "+
                                        "안 적으신 칸은 계산에서 빠집니다.";

  return '<div class="tl-res-g">'+
    tlOut("한 건 남는 돈", left !== null ? won(Math.round(left)) + "원" : null,
          pct !== null ? "판매가의 " + pct + "%" : "")+
    tlOut("수수료로 빠지는 돈", feeWon !== null ? won(Math.round(feeWon)) + "원" : null,
          pctHas ? "합 " + (Math.round(pctSum * 10) / 10) + "%" : "수수료율을 적으시면 나옵니다")+
    tlOut("건마다 빠지는 돈", flatHas ? won(Math.round(flat)) + "원" : null,
          flatHas ? "배달비 · 포장재 · 재료비 · 광고비" : "")+
  '</div>'+
  '<p class="tl-res-n">'+esc(note)+'</p>'+
  '<p class="tl-res-n">여기서 <b>임차료 · 인건비 같은 고정비는 빼지 않았습니다.</b> '+
    '한 건이 남기는 돈(공헌이익)이지 순이익이 아닙니다 — 고정비까지 보시려면 '+
    '손익분기 계산을 같이 쓰세요.</p>'+
  '<p class="tl-res-n">부가세는 다루지 않았습니다. 판매가와 재료비를 <b>같은 기준</b>'+
    '(둘 다 세금 포함이거나 둘 다 제외)으로 적어 주셔야 맞습니다.</p>';
}

/* ════════ 원가율 · 마진 (V2 §16) ══════════════════════════════════ */
function MarginRes(v){
  var price = tlHas(v.price) ? tlNum(v.price) : null;
  var cost  = tlHas(v.cost) ? tlNum(v.cost) : null;
  var etc   = tlHas(v.etc) ? tlNum(v.etc) : 0;
  var rate  = (price !== null && cost !== null) ? tlPct(cost, price) : null;
  var cm    = (price !== null && cost !== null) ? price - cost - etc : null;
  var cmPct = (cm !== null) ? tlPct(cm, price) : null;
  var qty   = tlHas(v.qty) ? tlNum(v.qty) : null;
  var month = (cm !== null && qty !== null) ? cm * qty : null;

  var note;
  if(price === null)    note = "판매가를 적으시면 시작됩니다.";
  else if(!(price > 0)) note = "판매가가 0이면 비율을 낼 수 없습니다.";
  else if(cost === null)note = "재료비를 적으시면 원가율이 나옵니다.";
  else if(cm !== null && cm < 0)
                        note = "지금 적으신 값으로는 한 개 팔 때마다 돈이 나갑니다. "+
                               "판매가와 원가 칸을 다시 봐 주세요.";
  else                  note = "원가를 판매가로 나눈 값입니다. 몇 %면 좋다고 말씀드리지 "+
                               "않습니다 — 업종마다 구조가 달라서 우리가 댈 근거가 없습니다.";

  return '<div class="tl-res-g">'+
    tlOut("원가율", rate !== null ? rate + "%" : null,
          rate !== null ? "판매가 대비 재료비" : "")+
    tlOut("한 개 남는 돈", cm !== null ? won(Math.round(cm)) + "원" : null,
          cmPct !== null ? "판매가의 " + cmPct + "%" : "")+
    tlOut("한 달 남는 돈", month !== null ? won(Math.round(month)) + "원" : null,
          month !== null ? won(qty) + "개 기준" : "판매 수량을 적으시면 나옵니다")+
  '</div>'+
  '<p class="tl-res-n">'+esc(note)+'</p>'+
  '<p class="tl-res-n">"한 달 남는 돈" 은 <b>고정비를 빼기 전</b> 값입니다 — '+
    '여기서 임차료 · 인건비 · 공과금이 빠져야 순이익입니다. '+
    '그 선을 보시려면 손익분기 계산을 같이 쓰세요.</p>';
}

/* ════════ 폐업 예상비용 (V2 §16) ══════════════════════════════════
   ⚠️⚠️ **나가는 돈만 세면 반쪽입니다.** 보증금과 시설 매각이 들어오는
   쪽에 있어서, 둘을 같이 놓아야 실제로 얼마가 드는지가 나옵니다. */
function CloseCostRes(v){
  function sum(rows){
    var t = 0, n = 0;
    rows.forEach(function(r){ if(tlHas(v[r.key])){ t += tlNum(v[r.key]); n++; } });
    return { t:t, n:n };
  }
  var out = sum(window.AM_CLOSE_OUT || []);
  var inn = sum(window.AM_CLOSE_IN || []);
  var net = (out.n || inn.n) ? out.t - inn.t : null;
  var total = (window.AM_CLOSE_OUT || []).length + (window.AM_CLOSE_IN || []).length;
  var filled = out.n + inn.n;

  var note;
  if(!filled) note = "한 칸이라도 적으시면 시작됩니다. 받으신 견적을 그대로 적으세요.";
  else        note = "적으신 " + filled + "칸으로 셈한 값입니다 (전체 " + total + "칸). "+
                     "안 적으신 칸은 계산에서 빠집니다 — 평균으로 메우지 않습니다.";

  return '<div class="tl-res-g">'+
    tlOut(net !== null && net < 0 ? "정리하고 남는 돈" : "실제로 드는 돈",
          net !== null ? tlMan(Math.abs(net)) : null,
          net !== null ? (net < 0 ? "돌아오는 돈이 더 큽니다" : "나가는 돈 − 돌아오는 돈") : "")+
    tlOut("나가는 돈", out.n ? tlMan(out.t) : null,
          out.n ? out.n + "칸 적으심" : "")+
    tlOut("돌아오는 돈", inn.n ? tlMan(inn.t) : null,
          inn.n ? inn.n + "칸 적으심" : "")+
  '</div>'+
  '<p class="tl-res-n">'+esc(note)+'</p>'+
  '<p class="tl-res-n"><b>금액을 대신 넣어 드리지 않습니다.</b> 철거비와 원상복구비는 '+
    '평수가 아니라 무엇을 뜯어내느냐로 갈립니다 — 업체 견적을 받아 그 값을 적으세요.</p>'+
  '<p class="tl-res-n">통째로 <b>넘기시면</b> 철거 · 원상복구 칸이 통째로 빠지는 경우가 '+
    '있습니다. 닫기로 정하기 전에 양도가 되는지부터 보시는 쪽이 대개 쌉니다.</p>';
}

/* ── 일곱 도구의 적는 함수 · 지우는 함수 · 화면 ─────────────────── */
tlWire("target",    TargetRes);
tlWire("premium",   PremiumRes);
tlWire("rent",      RentRes);
tlWire("hire",      HireRes);
tlWire("delivery",  DeliveryRes);
tlWire("margin",    MarginRes);
tlWire("closecost", CloseCostRes);

function PageToolTarget(){ return tlPage({
  key:"target", h1:"목표 매출 계산", rows:(window.AM_TARGET||[]), res:TargetRes,
  lead:"가져가고 싶은 돈을 먼저 적으시면, 그러려면 얼마를 팔아야 하는지가 나옵니다. "+
       "손익분기가 본전이라면 이것은 그 위입니다.",
  subs:{ "지금 조건":"손익분기 계산에 적으신 값을 그대로 옮기셔도 됩니다",
         "나눠 보기":"안 적으셔도 월 매출까지는 나옵니다" },
  next:"매출을 올리는 쪽과 비용을 줄이는 쪽을 같이 보세요" }); }

function PageToolPremium(){ return tlPage({
  key:"premium", h1:"권리금 따져보기", rows:(window.AM_PREMIUM||[]), res:PremiumRes,
  lead:"달라는 권리금이 몇 달이면 돌아오는지, 그중 눈에 보이는 시설값이 얼마인지를 "+
       "갈라 봅니다. 적으신 숫자를 나누는 것까지입니다.",
  subs:{ "받은 값":"넘기시는 분이 적어 주신 값입니다" },
  next:"계약 전에 봐 줄 전문가를 찾으세요", nextTo:"/providers/law" }); }

function PageToolRent(){ return tlPage({
  key:"rent", h1:"임대료 비율 계산", rows:(window.AM_RENT||[]), res:RentRes,
  lead:"매출에서 임차료가 몇 %인지. 권리금까지 영업 기간으로 나눠 보면 자리에 "+
       "실제로 쓰는 돈이 보입니다.",
  subs:{ "한 번에 낸 것":"비워 두셔도 위의 비율은 나옵니다" },
  next:"조건이 맞는 자리를 더 보세요", nextTo:"/stores" }); }

function PageToolHire(){ return tlPage({
  key:"hire", h1:"직원 고용비용 계산", rows:(window.AM_HIRE||[]), res:HireRes,
  lead:"급여만 보시면 실제보다 적게 잡힙니다. 사업주 부담 4대보험 · 퇴직충당 · "+
       "식대까지 더해 한 사람에게 실제로 드는 돈을 봅니다.",
  subs:{ "한 사람 기준":"요율은 해마다 바뀌어서 저희가 적어 두지 않습니다" },
  next:"채용과 노무는 맡기실 수 있습니다", nextTo:"/providers/staff" }); }

function PageToolDelivery(){ return tlPage({
  key:"delivery", h1:"배달 한 건 남는 돈", rows:(window.AM_DELIVERY||[]), res:DeliveryRes,
  lead:"중개 · 결제 수수료는 비율로, 배달비 · 포장재 · 재료비는 건마다 빠집니다. "+
       "둘을 갈라서 한 건에 얼마가 남는지 봅니다.",
  subs:{ "비율로 빠지는 것":"계약서에 적힌 값을 그대로 적으세요" },
  next:"포장재와 식자재 조건부터 비교해 보세요", nextTo:"/providers/supply" }); }

function PageToolMargin(){ return tlPage({
  key:"margin", h1:"원가율 · 마진 계산", rows:(window.AM_MARGIN||[]), res:MarginRes,
  lead:"원가율과 마진은 같은 값을 뒤집어 본 것입니다. 한 번에 같이 냅니다.",
  subs:{ "한 달로 보면":"비워 두셔도 비율은 나옵니다" },
  next:"재료비는 거래처 조건에서 갈립니다", nextTo:"/providers/supply" }); }

function PageToolCloseCost(){
  var v = tlGet("closecost");
  return PgHero({
    crumb: Crumb([["사장님 도구","/tools"],["폐업 예상비용"]]),
    kicker:"사장님 도구", h1:"폐업 예상비용",
    lead:"나가는 돈만 세면 반쪽입니다. 보증금과 시설 매각은 돌아오는 쪽이라, "+
         "둘을 같이 놓아야 실제로 얼마가 드는지가 나옵니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w w-narrow">'+
    '<h2 class="tl-h">나가는 돈 <span>받으신 견적을 그대로</span></h2>'+
    '<ul class="tl-l">'+(window.AM_CLOSE_OUT||[]).map(function(r){
      return tlRow(r, v, "closecostIn"); }).join("")+'</ul>'+
    '<h2 class="tl-h">돌아오는 돈 <span>확정된 것만</span></h2>'+
    '<ul class="tl-l">'+(window.AM_CLOSE_IN||[]).map(function(r){
      return tlRow(r, v, "closecostIn"); }).join("")+'</ul>'+
    '<div class="tl-res" id="tl-res">'+CloseCostRes(v)+'</div>'+
    tlFoot("closecostReset")+
  '</div></section>'+
  tlNext("철거 · 원상복구 · 폐기물은 업체가 합니다", "/quote?side=close", "closecost");
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
  /* ⚠️⚠️ **열셋을 한 줄로 늘어놓지 않습니다** (V2 §16 으로 여섯에서
     열셋이 됐습니다). 평평한 열셋은 다섯 줄이라 "무엇부터 누를까" 가
     묻힙니다 — 사장님이 던지는 질문으로 묶습니다.
     ⚠️ 묶음 차례는 `tools.js` 의 `AM_TOOL_GROUPS` 한 곳입니다. */
  '<section class="sec sec-white"><div class="w">'+
    (window.AM_TOOL_GROUPS||[]).map(function(g){
      var mine = list.filter(function(t){ return t.grp === g; });
      if(!mine.length) return "";        /* 빈 묶음은 줄째 뺍니다 */
      return '<h2 class="tl-gh">'+esc(g)+'</h2>'+
      '<ul class="tl-g">'+mine.map(function(t){
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
      }).join("")+'</ul>';
    }).join("")+
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
  tlNext("빠진 항목이 보이면 그 항목부터 견적을 받으세요", "/quote?side=start", "cost");
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
  tlNext("큰 칸부터 조건을 바꾸면 이번 달부터 바뀝니다", "/quote", "fixed");
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
  tlNext("고정비를 줄이는 쪽이 대개 더 빠릅니다", "/quote", "bep");
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
  tlNext("사람을 쓰기 전에 확인할 것이 여럿입니다", "/providers/staff", "labor");
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
  '</div></section>'+
  tlRel("vs");
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
  tlNext("철거 · 원상복구 · 폐기물은 업체가 합니다", "/quote?side=close", "close");
}

/* ════════════════════════════════════════════════════════════════════
   무료 사업진단 — 지시서 8번

   ⚠️ **좋다/나쁘다를 판정하지 않습니다.** 판정하려면 업종·평수·지역별
   기준값이 있어야 하는데 우리에게 없습니다. 이 화면이 하는 일은
   "지금 무엇을 알고 계시고 무엇을 모르시는지" 를 세어서 보여 주는
   것입니다 (js/data/check.js 머리말).

   ⚠️ **적으신 숫자는 이 브라우저 밖으로 나가지 않습니다.** 서버로
   보내지 않고 localStorage 에도 담지 않습니다 — 가게 컴퓨터·태블릿은
   여러 사람이 씁니다. 결과를 받아 두고 싶으시면 마지막에 직접
   보내시게 합니다.

   ⚠️ 결과 화면은 `noindex` 입니다 (사람마다 다릅니다).
   ════════════════════════════════════════════════════════════════════ */

var CHK = { step:"ask", ans:{}, sales:"", meat:"" };

/* 화면 머리의 "할 수 있는 것 · 할 수 없는 것" 한 줄.
   ⚠️ `html` 은 **우리가 쓴 문장**입니다. 손님이 쓴 글을 여기 넣지
   마세요 — 넣으려면 esc() 를 먼저 통과시키세요. */
window.fact = function(ic, html){
  return '<li>'+icon(ic,18)+'<span>'+html+'</span></li>';
};

function PageCheck(){
  return CHK.step === "done" ? CheckResult() : CheckAsk();
}

/* ── 묻는 화면 ────────────────────────────────────────────── */
function CheckAsk(){
  return '<section class="pg-hero"><div class="w">'+
      '<p class="eyebrow">무료 사업진단</p>'+
      '<h1 class="pg-h1">지금 가게, 어디가 새고 있을까요?</h1>'+
      '<p class="pg-lead">8가지만 고르시면 됩니다. 3분이면 끝나고, '+
        '가입하지 않으셔도 됩니다.</p>'+
      /* ⚠️ 할 수 있는 것과 할 수 없는 것을 **묻기 전에** 적습니다.
         다 고르고 나서 "사실 판정은 못 합니다" 라고 하면 시간을
         버리게 하는 짓입니다. */
      /* ⚠️ 아이콘 옆 글은 **반드시 하나의 <span> 안에** 넣으세요.
         .pg-facts li 는 grid 라, 감싸지 않으면 <b> 앞뒤 글이 각각
         딴 칸으로 흩어져 칸이 손톱만 해지고 글자가 한 자씩 쪼개집니다. */
      '<ul class="pg-facts">'+
        fact("lock", "적으신 내용은 이 브라우저 밖으로 나가지 않습니다.")+
        fact("info", "좋다 나쁘다를 판정하지 않습니다. "+
          "<b>무엇을 모르고 계신지</b>를 정리해 드립니다.")+
        fact("clock", "중간에 그만두셔도 아무것도 남지 않습니다.")+
      '</ul>'+
    '</div></section>'+

    '<div class="w chk">'+
      '<form onsubmit="return chkDone(event)">'+

      /* 숫자 두 칸 — 있으면 원가율을 같이 계산해 드립니다. 없어도
         진단은 됩니다. 그래서 선택입니다. */
      '<section class="chk-num">'+
        '<h2>'+icon("percent",20)+'숫자를 아시면 두 칸만 <em>(선택)</em></h2>'+
        '<p class="chk-num-p">적어 주시면 육류원가율을 같이 계산해 드립니다. '+
          '모르셔도 아래 8가지는 그대로 하실 수 있습니다.</p>'+
        '<div class="chk-num-g">'+
          '<div class="calc-f"><label for="ck-sales">월 매출</label>'+
            '<span class="calc-in"><input id="ck-sales" type="text" inputmode="numeric"'+
              ' placeholder="7,000" value="'+esc(CHK.sales)+'" autocomplete="off"'+
              ' oninput="chkRate()"><em>만원</em></span></div>'+
          '<div class="calc-f"><label for="ck-meat">그중 육류 매입비</label>'+
            '<span class="calc-in"><input id="ck-meat" type="text" inputmode="numeric"'+
              ' placeholder="2,400" value="'+esc(CHK.meat)+'" autocomplete="off"'+
              ' oninput="chkRate()"><em>만원</em></span></div>'+
          '<div class="chk-rate" id="ck-rate">'+ChkRate(null)+'</div>'+
        '</div>'+
      '</section>'+

      WOW_CHECK.map(ChkItem).join("")+

      '<div class="chk-go">'+
        '<button class="btn btn-b btn-lg btn-full" type="submit">'+
          '결과 보기'+icon("arrow",18)+'</button>'+
        '<p class="f-foot" id="ck-left"></p>'+
      '</div>'+
      '</form>'+
    '</div>';
}

function ChkItem(it, i){
  var picked = CHK.ans[it.key];
  return '<fieldset class="chk-q" id="ck-q-'+esc(it.key)+'">'+
    '<legend class="sr">'+esc(it.name)+'</legend>'+
    '<div class="chk-q-h">'+
      '<span class="chk-q-n">'+("0"+(i+1))+'</span>'+
      '<span class="chk-q-ic">'+icon(it.icon,22)+'</span>'+
      '<span class="chk-q-t"><b>'+esc(it.name)+'</b>'+
        '<span>'+esc(it.why)+'</span></span>'+
    '</div>'+
    '<div class="chk-o">'+it.opts.map(function(o, oi){
      var on = picked != null && picked === oi;
      return '<button type="button" class="chk-b'+(on?" on":"")+'"'+
        ' aria-pressed="'+(on?"true":"false")+'"'+
        ' onclick="chkPick(\''+esc(it.key)+'\','+oi+')">'+
        '<span class="chk-b-x" aria-hidden="true">'+icon("check",16)+'</span>'+
        esc(o[0])+'</button>';
    }).join("")+'</div>'+
  '</fieldset>';
}

/* 원가율 — 손님이 적은 두 숫자를 나눈 것뿐입니다.
   ⚠️ 몇 %면 좋다/나쁘다고 단정하지 않습니다. 그래서 상태색도 안 씁니다. */
function ChkRate(pct){
  if(pct == null) return '<b class="chk-rate-n chk-rate-none">—</b>'+
    '<span>두 칸을 다 적으시면 계산합니다</span>';
  return '<b class="chk-rate-n">'+pct.toFixed(1)+'<em>%</em></b>'+
    '<span>육류원가율 — 높은지 낮은지는 업종·부위·지역마다 다릅니다</span>';
}
window.chkRate = function(){
  var out = $("ck-rate"); if(!out) return;
  CHK.sales = String(($("ck-sales")||{}).value || "");
  CHK.meat  = String(($("ck-meat") ||{}).value || "");
  var s = chkNum(CHK.sales), m = chkNum(CHK.meat);
  out.innerHTML = (s > 0 && m > 0) ? ChkRate(m / s * 100) : ChkRate(null);
};
function chkNum(v){
  var n = parseFloat(String(v||"").replace(/[^0-9.]/g,""));
  return isFinite(n) ? n : 0;
}

window.chkPick = function(key, oi){
  CHK.ans[key] = oi;
  var box = $("ck-q-"+key);
  if(box){
    els(".chk-b", box).forEach(function(b, i){
      var on = i === oi;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    box.classList.remove("chk-miss");
  }
  chkLeft();
};

/* 몇 개 남았는지 단추 옆에 적어 줍니다 — 다 눌렀는데 아무 반응이
   없으면 "고장났나" 싶습니다. */
function chkLeft(){
  var el = $("ck-left"); if(!el) return;
  var left = WOW_CHECK.length - Object.keys(CHK.ans).length;
  el.textContent = left > 0 ? (left + "가지 남았습니다.")
                            : "다 고르셨습니다. 결과를 보세요.";
}

window.chkDone = function(ev){
  ev.preventDefault();
  /* ⚠️ 안 고른 칸이 있으면 **그 칸으로 데려갑니다.** "모두 선택해
     주세요" 라고만 하면 어디가 빈지 찾느라 다시 훑어야 합니다. */
  var miss = WOW_CHECK.filter(function(it){ return CHK.ans[it.key] == null; });
  if(miss.length){
    var box = $("ck-q-"+miss[0].key);
    if(box){
      box.classList.add("chk-miss");
      box.scrollIntoView({ behavior:"smooth", block:"center" });
    }
    toast(miss.length + "가지가 남았습니다.");
    return false;
  }
  CHK.step = "done";
  render(); window.scrollTo(0,0);
  return false;
};

window.chkAgain = function(){
  CHK.step = "ask"; CHK.ans = {};
  render(); window.scrollTo(0,0);
};

/* ── 결과 ─────────────────────────────────────────────────── */
function CheckResult(){
  var max = WOW_CHECK.length * 2, got = 0;
  var rows = WOW_CHECK.map(function(it){
    var oi = CHK.ans[it.key], o = it.opts[oi];
    got += o[1];
    return { it:it, opt:o };
  });
  var score = Math.round(got / max * 100);
  var band = wowCheckBand(score);

  /* 약한 것부터 위로 — 사장님이 제일 먼저 볼 것이 제일 급한 것이어야
     합니다. 같은 점수면 원래 순서를 지킵니다 (정렬이 흔들리지 않게). */
  var weak = rows.filter(function(r){ return r.opt[1] < 2; })
                 .sort(function(a,b){ return a.opt[1] - b.opt[1]; });

  var s = chkNum(CHK.sales), m = chkNum(CHK.meat);
  var rate = (s > 0 && m > 0) ? (m / s * 100) : null;

  return '<div class="w res">'+
    '<div class="res-hd">'+
      '<p class="eyebrow">진단 결과</p>'+
      ScoreRing(score, band)+
      '<h1 class="res-h">'+esc(band.name)+'</h1>'+
      '<p class="res-p">'+esc(band.line)+'</p>'+
      /* ⚠️ 이 숫자가 무엇인지 **결과 바로 옆에서** 밝힙니다.
         "78점" 만 크게 띄우면 업계 평균과 견준 점수로 읽힙니다. */
      '<p class="res-what">이 점수는 가게의 좋고 나쁨이 아니라 '+
        '<b>8가지 중 몇 가지를 파악하고 계신지</b>입니다. '+
        '업계 평균과 비교한 값이 아닙니다.</p>'+
      (rate != null ? '<p class="res-rate">적어 주신 숫자로 계산한 육류원가율은 '+
        '<b>'+rate.toFixed(1)+'%</b> 입니다.</p>' : '')+
    '</div>'+

    (weak.length ? '<section class="res-sec">'+
      '<h2>먼저 보실 것 '+weak.length+'가지</h2>'+
      '<ul class="res-l">'+weak.map(function(r){
        return '<li class="res-i res-'+esc(r.opt[2])+'">'+
          '<span class="res-i-ic">'+icon(r.it.icon,20)+'</span>'+
          '<span class="res-i-t"><b>'+esc(r.it.name)+'</b>'+
            '<span>'+esc(r.opt[0])+'</span></span>'+
          '<a class="btn btn-o res-i-go" href="'+esc(r.it.cta[1])+'">'+
            esc(r.it.cta[0])+'</a></li>';
      }).join("")+'</ul></section>'
    : '<section class="res-sec"><h2>여덟 가지를 다 보고 계십니다</h2>'+
      '<p class="lead">여기서부터는 "알고 있다" 가 아니라 "줄였다" 로 '+
      '넘어갈 차례입니다. 어느 칸을 줄이고 싶으신지 말씀해 주세요.</p></section>')+

    '<section class="res-sec"><h2>여덟 가지 전부</h2>'+
      '<ul class="res-all">'+rows.map(function(r){
        return '<li><span class="res-a-n">'+esc(r.it.name)+'</span>'+
          '<b class="st st-'+esc(r.opt[2])+'">'+esc(r.opt[0])+'</b></li>';
      }).join("")+'</ul></section>'+

    '<div class="res-cta">'+
      '<h2>여기까지가 저희가 혼자 해 드릴 수 있는 데까지입니다.</h2>'+
      '<p>나머지는 사장님 가게를 봐야 압니다. 위 결과를 그대로 가지고 '+
        '물어봐 주시면, 무엇부터 할지 같이 정리해 드립니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="'+esc(chkSosLink(weak))+'">'+
          '이 결과로 물어보기'+icon("arrow",18)+'</a>'+
        '<button class="btn btn-o btn-lg" type="button" onclick="chkAgain()">'+
          icon("refresh",18)+'다시 진단하기</button>'+
      '</div>'+
    '</div>'+
  '</div>';
}

/* 결과를 SOS 입력창에 미리 적어 보냅니다 — 사장님이 다시 쓰지 않게.
   ⚠️ 숫자(매출·매입비)는 넘기지 않습니다. 주소창에 남고 기록에도
   남습니다. 넘기는 것은 **무엇을 모르시는지**까지입니다. */
function chkSosLink(weak){
  if(!weak.length) return "/sos?c=cost";
  var names = weak.slice(0,3).map(function(r){ return r.it.name; });
  var q = "사업진단을 해 봤는데 " + names.join(" · ") +
          josa(names[names.length-1], "이가") + " 약하게 나왔습니다. " +
          "무엇부터 해야 할까요?";
  return "/sos?c=" + encodeURIComponent(weak[0].it.key === "supply" ? "supply" : "cost") +
         "&q=" + encodeURIComponent(q);
}

/* 점수 고리 — 색은 상태값이라 써도 됩니다 (지시서 31번) */
function ScoreRing(score, band){
  var R = 56, C = 2 * Math.PI * R;
  var off = C * (1 - Math.max(0, Math.min(100, score)) / 100);
  return '<div class="ring ring-'+esc(band.tone)+'">'+
    '<svg viewBox="0 0 136 136" aria-hidden="true">'+
      '<circle class="ring-t" cx="68" cy="68" r="'+R+'"/>'+
      '<circle class="ring-v" cx="68" cy="68" r="'+R+'"'+
        ' stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'"/>'+
    '</svg>'+
    '<span class="ring-n"><b>'+score+'</b><em>/100</em></span>'+
  '</div>';
}

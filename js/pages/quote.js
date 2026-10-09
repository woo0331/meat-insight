/* ════════════════════════════════════════════════════════════════════
   견적 요청 · 받은 제안 비교 (§38)

   **같은 내용을 업체마다 다시 적지 않게 하는 것**이 이 화면의 전부입니다.
   한 번 적으시면 조건에 맞는 곳에 같이 전달하고, 받으신 제안은 한
   화면에서 나란히 놓고 보십니다.

   ⚠️ **접수는 `api/quote.js` 가 받습니다.** 화면이 보내는 칸과 서버가
   읽는 칸이 어긋나면 **에러도 없이 조용히 사라집니다.** 고칠 때는
   `node tools/test-api.js` 를 같이 돌리세요.
   ⚠️ **동의 없이 보내지 않습니다.** 화면에서 한 번, 서버
   (`agree !== true`)에서 한 번 막습니다.
   ⚠️ **업체에 연락처를 넘기는 것은 이 동의에 포함되지 않습니다**
   (개인정보보호법 제17조). 업체가 정해지면 상호를 알리고 다시 받습니다.
   ⚠️ **첨부 칸을 만들지 마세요.** 지금 파일을 받아 둘 곳이 없습니다.
   고르게 해 놓고 조용히 버리면 그게 거짓말입니다. 사진은 주소를
   적어 주시게 합니다.
   ════════════════════════════════════════════════════════════════════ */

var QKEY = "am.quotes.v1";

/* ── 서비스별 질문 (§6) ───────────────────────────────────────
   ⚠️⚠️ **같은 것을 두 번 묻지 않습니다.** 면적 · 업종 · 지역 · 예산은
   공통 칸이고, 여기는 그 서비스에서만 쓰는 것입니다 (`reqforms.js`).
   ⚠️ 칸이 없는 분류면 **구간째 빠집니다** — 빈 머리말을 찍지 않습니다.
   ⚠️⚠️ `detail` 상한(스물)은 `checkReqForms()` 가 빌드에서 셉니다. */
function ReqFormBand(cat){
  var L = (typeof amReqForm === "function") ? amReqForm(cat) : [];
  if(!L.length) return "";
  var c = cat ? amCat(cat) : null;
  return '<div class="rqf">'+
    '<p class="rqf-h">'+esc(c ? c.name : "이 서비스")+
      ' <i>— 이것만 더 알려 주시면 견적이 훨씬 정확해집니다</i></p>'+
    L.map(function(f, i){ return ReqFormRow(f, i); }).join("")+
  '</div>';
}

function ReqFormRow(f, i){
  var id = "rq" + i, lab = esc(f.k) + (f.unit ? ' <i>('+esc(f.unit)+')</i>' : "");
  if(f.t === "chk")
    return '<div class="f-r"><span class="rqf-l">'+lab+'</span>'+
      '<div class="rqf-c">'+(f.opts || []).map(function(o, j){
        return '<label class="rqf-k"><input type="checkbox" id="'+id+'-'+j+'" '+
          'value="'+esc(o)+'" data-rq="'+i+'"><span>'+esc(o)+'</span></label>';
      }).join("")+'</div></div>';
  if(f.t === "sel")
    return '<div class="f-r"><label for="'+id+'" class="rqf-l">'+lab+'</label>'+
      '<select class="sel" id="'+id+'" data-rq="'+i+'">'+
        '<option value="">골라 주세요</option>'+
        (f.opts || []).map(function(o){
          return '<option value="'+esc(o)+'">'+esc(o)+'</option>'; }).join("")+
      '</select></div>';
  /* ⚠️ 날짜는 date 입니다 — 손으로 적게 하면 "다음달 초" 가 들어오고
     그건 일정이 아닙니다 */
  var type = f.t === "date" ? ' type="date"' : (f.t === "num" ? ' inputmode="numeric"' : "");
  return '<div class="f-r"><label for="'+id+'" class="rqf-l">'+lab+'</label>'+
    '<input id="'+id+'"'+type+' data-rq="'+i+'"'+
      (f.ph ? ' placeholder="'+esc(f.ph)+'"' : "")+'></div>';
}

/* 적으신 것을 `detail` 에 담습니다 — ⚠️ **빈 칸은 안 담습니다**
   (절대 규칙 2 · 받아 보는 사람이 빈 줄을 읽지 않게) */
function reqFormValues(cat){
  var L = (typeof amReqForm === "function") ? amReqForm(cat) : [], out = {};
  L.forEach(function(f, i){
    var v = "";
    if(f.t === "chk"){
      var on = [];
      document.querySelectorAll('[data-rq="'+i+'"]:checked').forEach(function(el){
        on.push(el.value);
      });
      v = on.join(" · ");
    }else{
      var el = $("rq" + i);
      v = el ? String(el.value || "").trim() : "";
    }
    if(v) out[f.k] = v;
  });
  return out;
}

function PageQuote(){
  var cat  = nowQS("c"), sub = nowQS("s");
  var ind  = nowQS("i"), reg = nowQS("r");
  var side = nowQS("side") || "start";
  /* ⚠️ 창업 진단(PART 4)에서 고르신 예산 · 일정입니다. 자유 입력 칸이라
     **고치실 수 있게** 미리 적어만 둡니다 — 못 고치게 잠그면 "3천 ~
     5천만원" 밖의 사정을 적을 자리가 없어집니다. */
  var bud  = nowQS("bud"), when = nowQS("when");
  var c    = cat ? amCat(cat) : null;
  var subName = "";
  if(c){
    var hit = amCatItems(c, ind).filter(function(x){ return x.key === sub; })[0];
    subName = hit ? hit.name : "";
  }
  var ready = !!(window.WOW_BIZ && WOW_BIZ.sosReady);
  var what = subName || (c ? c.name : "");

  return PgHero({
    kicker:"견적 요청",
    h1raw:"한 번만 적으시면<br class=\"br-m\"> 여러 곳에서 답이 옵니다.",
    lead:"업종 · 지역 · 평수 · 예산 · 일정만 적어 주세요. 조건에 맞는 업체에 같이 전달합니다. 무료입니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w form-wrap">'+
    (ready ? "" :
      '<div class="notice-bad"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
        '<p>접수처 설정이 끝나면 바로 열립니다. 그동안에는 '+
        '<a href="/providers">업체찾기</a>에서 분야를 보시거나, '+
        '<a href="/content">창업 · 폐업 정보</a>에서 무엇을 확인해야 하는지 '+
        '먼저 보실 수 있습니다.</p></div>')+

    '<form id="q-f" onsubmit="return quoteSend(event)">'+
      '<div class="f-r"><label for="q-side">무엇 때문에 <b>*</b></label>'+
        '<select class="sel" id="q-side">'+
          '<option value="start"'+(side!=="close"?" selected":"")+'>창업 — 시작하려고 합니다</option>'+
          '<option value="close"'+(side==="close"?" selected":"")+'>폐업 — 정리하려고 합니다</option>'+
        '</select></div>'+

      '<div class="f-r"><label for="q-what">필요한 일 <b>*</b></label>'+
        '<input id="q-what" required value="'+esc(what)+'" '+
          'placeholder="예: 카페 인테리어 / 주방 철거 / POS 설치"></div>'+

      '<div class="f-2">'+
        '<div class="f-r"><label for="q-ind">업종</label>'+IndustrySelect("q-ind", ind)+'</div>'+
        '<div class="f-r"><label for="q-reg">지역 <b>*</b></label>'+
          RegionSelect("q-reg", reg, "", "지역을 골라 주세요")+'</div>'+
      '</div>'+
      '<div class="f-2">'+
        '<div class="f-r"><label for="q-gu">시 · 군 · 구</label>'+
          '<input id="q-gu" autocomplete="address-level2" placeholder="예: 안양시"></div>'+
        '<div class="f-r"><label for="q-py">평수</label>'+
          '<input id="q-py" inputmode="numeric" placeholder="예: 30"></div>'+
      '</div>'+
      '<div class="f-2">'+
        '<div class="f-r"><label for="q-bud">예산</label>'+
          '<input id="q-bud" value="'+esc(bud||"")+'" '+
            'placeholder="예: 5,000만원 / 아직 모름"></div>'+
        '<div class="f-r"><label for="q-when">희망 일정</label>'+
          '<input id="q-when" value="'+esc(when||"")+'" '+
            'placeholder="예: 2027년 2월 오픈 / 이번 달 안"></div>'+
      '</div>'+

      /* §6 — 서비스마다 다르게 묻습니다. ⚠️ 분류를 안 고르고 들어오면
         구간째 빠집니다 (빈 머리말을 찍지 않습니다 · 절대 규칙 2). */
      ReqFormBand(cat)+

      '<div class="f-r"><label for="q-q">자세한 내용 <b>*</b></label>'+
        '<textarea id="q-q" rows="6" required '+
          'placeholder="지금 상황과 필요한 것을 그대로 적어 주세요. 양식이 없어도 됩니다."></textarea></div>'+
      /* ⚠️ 파일을 받아 둘 곳이 없어서 **주소로 받습니다.** 첨부 칸을
         만들어 놓고 버리는 것보다 낫습니다. */
      '<div class="f-r"><label for="q-img">사진 · 도면 주소</label>'+
        '<input id="q-img" placeholder="공유 링크가 있으면 붙여 주세요 (선택)"></div>'+

      '<div class="f-2">'+
        /* ⚠️ `autocomplete` — 폰으로 적는 분들이라 한 번에 채워지는 것이
           크게 다릅니다. 표준 값이라야 효과가 있습니다. */
        '<div class="f-r"><label for="q-name">성함 <b>*</b></label>'+
          '<input id="q-name" required autocomplete="name"></div>'+
        '<div class="f-r"><label for="q-tel">연락처 <b>*</b></label>'+
          '<input id="q-tel" type="tel" required autocomplete="tel" '+
            'placeholder="010-0000-0000"></div>'+
      '</div>'+

      AgreeBox("q-ag","성함 · 연락처 · 업종 · 지역 · 평수 · 예산 · 일정 · 적어 주신 내용",
               "견적 요청 접수와 상담 안내","접수일로부터 1년")+
      '<div id="q-fail"></div>'+
      '<button class="btn btn-b btn-lg btn-full" type="submit"'+(ready?"":" disabled")+'>'+
        '견적 요청하기'+icon("arrow",18)+'</button>'+
      /* ⚠️⚠️ **하지 않는 일을 했다고 적지 마세요** (절대 규칙 5).
         전에 여기가 "보내고 나면 이 브라우저에 요청 내용이 남아" 였는데
         `amSend()` 는 보낸 뒤 **아무것도 저장하지 않습니다** — 폼을 비우기만
         합니다. 아래 비교표는 사장님이 "제안 직접 적어두기" 로 손수 적는
         자리입니다. 사장님이 그 말을 믿고 탭을 닫으면 적으신 것이 없어집니다.
         ⚠️ 저장하는 쪽으로 고치고 싶어지는 자리인데, 그러면 성함·연락처가
         `localStorage` 에 남습니다 — 가게 컴퓨터는 여러 사람이 씁니다. */
      '<p class="note note-mid">업체에서 견적을 받으시면 <b>아래 표에 적어 '+
        '두세요.</b> 금액 · 기간 · 포함 범위를 나란히 놓고 보실 수 있습니다. '+
        '이 브라우저에만 남고 서버로 보내지 않습니다.</p>'+
    '</form>'+
  '</div></section>'+
  CompareBand();
}

/* ── 받은 제안 비교 (§38) ───────────────────────────────────────
   ⚠️ 저장할 곳이 없어서 **이 브라우저에만** 남습니다. 서버로 보내지
   않습니다 — 화면에도 그렇게 적혀 있습니다.
   ⚠️ **"이게 제일 좋습니다" 라고 하지 마세요.** 우리는 그 공사를 보지
   않았고, 제일 싼 것이 제일 좋은 것도 아닙니다. 포함 범위가 다르면
   금액 비교 자체가 뜻이 없습니다. */
function CompareBand(){
  var qs = amGet(QKEY, []);
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">받은 제안</p>'+
      '<h2>여러 곳을 나란히 놓고 보세요</h2>'+
      '<p>금액만 보면 틀립니다. <b>무엇이 포함됐는지</b>가 같아야 비교가 뜻을 가집니다.</p></div>'+
    (qs.length ? QcTable(qs) : Empty({
      icon:"scale",
      title:"아직 적어 두신 제안이 없습니다",
      text:"업체에서 견적을 받으시면 여기에 적어 두세요. 금액 · 기간 · 포함 범위 · "+
           "A/S 를 나란히 놓고 보실 수 있습니다. 이 브라우저에만 남고 서버로 보내지 않습니다.",
      cta:'<button class="btn btn-o" type="button" onclick="qcAdd()">'+
          '제안 직접 적어두기'+icon("plus",16)+'</button>'
    }))+
  '</div></section>';
}
function QcTable(qs){
  var rows = [["company","업체명"],["price","금액"],["days","기간"],
              ["scope","포함 범위"],["as","A/S"],["note","메모"]];
  return '<div class="qc-wrap"><table class="qc-t"><thead><tr><th>항목</th>'+
    qs.map(function(q,i){
      return '<th>'+esc(q.company || ("제안 "+(i+1)))+
        '<button class="qc-x" type="button" onclick="qcDel('+i+')" aria-label="지우기">'+
        icon("x",14)+'</button></th>';
    }).join("")+'</tr></thead><tbody>'+
    rows.map(function(r){
      return '<tr><th scope="row">'+esc(r[1])+'</th>'+
        qs.map(function(q,i){
          return '<td><input value="'+esc(q[r[0]]||"")+'" '+
            'oninput="qcSet('+i+',\''+r[0]+'\',this.value)" '+
            'aria-label="'+esc(r[1])+'"></td>';
        }).join("")+'</tr>';
    }).join("")+
    '</tbody></table></div>'+
    '<div class="row-cta"><button class="btn btn-o" type="button" onclick="qcAdd()">'+
      '제안 추가'+icon("plus",16)+'</button>'+
      '<button class="btn btn-o" type="button" onclick="qcClear()">전부 지우기</button></div>'+
    '<p class="note">어느 것이 낫다고 표시하지 않습니다. 저희는 그 현장을 보지 않았습니다.</p>';
}
window.qcAdd = function(){
  var qs = amGet(QKEY, []); qs.push({}); amSet(QKEY, qs); rerender(true);
};
/* ⚠️ 적는 중에 화면을 다시 그리지 마세요 — 커서가 날아가고 적던 것이
   사라집니다. 저장만 합니다. */
window.qcSet = function(i, k, v){
  var qs = amGet(QKEY, []); if(!qs[i]) return; qs[i][k] = v; amSet(QKEY, qs);
};
window.qcDel = function(i){
  var qs = amGet(QKEY, []); qs.splice(i,1); amSet(QKEY, qs); rerender(true);
};
window.qcClear = function(){
  if(!confirm("적어 두신 제안을 전부 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(QKEY); rerender(true);
};

/* ── 보내기 ─────────────────────────────────────────────────────
   ⚠️ **화면이 보내는 칸 = `api/quote.js` 가 읽는 칸.** 어긋나면
   조용히 사라집니다. `node tools/test-api.js` 로 같이 확인하세요. */
window.quoteSend = function(ev){
  ev.preventDefault();
  if(!$("q-ag").checked){ toast("개인정보 수집 · 이용 동의가 필요합니다"); return false; }
  /* ⚠️ **화면에서도 막습니다.** `required` 는 폼 제출을 막아 주지만
     이 함수를 직접 부르면 그냥 지나갑니다 — 서버가 400 을 돌려줘도
     그때는 이미 보낸 것입니다. */
  /* ⚠️ **지역은 딱지에 `*` 가 붙어 있는데 안 막고 있었습니다.**
     빈 채로 들어오면 어느 지역 업체에 돌릴지를 못 정합니다 — 지역이
     매칭의 첫 번째 조건입니다 (§44). */
  var need = [["q-what","필요한 일"],["q-reg","지역"],["q-q","자세한 내용"],
              ["q-name","성함"],["q-tel","연락처"]];
  for(var i=0;i<need.length;i++){
    if(!$(need[i][0]).value.trim()){
      toast(need[i][1]+"을(를) 적어 주세요"); $(need[i][0]).focus(); return false; }
  }
  var ind = $("q-ind").value, reg = $("q-reg").value;
  var body = {
    kind: "quote",
    name:  $("q-name").value.trim(),
    tel:   $("q-tel").value.trim(),
    region: reg ? amRegionName(reg) : "",
    service: "", serviceName: $("q-what").value.trim(),
    q:      $("q-q").value.trim(),
    budget: $("q-bud").value.trim(),
    /* ⚠️⚠️ 공통 여섯 + 서비스별(§6). `api/quote.js` 가 **스물까지**
       읽으므로 서비스별은 열넷이 상한이고, `checkReqForms()` 가
       빌드에서 셉니다 — 넘으면 뒤쪽이 조용히 사라집니다. */
    detail: amDropEmpty(Object.assign({
      "상황":  $("q-side").value === "close" ? "폐업 · 정리" : "창업 · 시작",
      "업종":  ind ? amIndustryName(ind) : "",
      "시군구": $("q-gu").value.trim(),
      "평수":  $("q-py").value.trim(),
      "일정":  $("q-when").value.trim(),
      "사진":  $("q-img").value.trim()
    }, reqFormValues(nowQS("c")))),
    agree: true
  };
  return amSend("q-fail", body, "quoteSend");
};

window.joinSend = function(ev){
  ev.preventDefault();
  if(!$("jn-ag").checked){ toast("개인정보 수집 · 이용 동의가 필요합니다"); return false; }
  var jneed = [["jn-name","업체명"],["jn-ceo","담당자 성함"],
               ["jn-tel","연락처"],["jn-svc","하시는 일"]];
  for(var j=0;j<jneed.length;j++){
    if(!$(jneed[j][0]).value.trim()){
      toast(jneed[j][1]+"을(를) 적어 주세요"); $(jneed[j][0]).focus(); return false; }
  }
  var reg = $("jn-reg").value, ind = $("jn-ind").value;
  var body = {
    kind: "partner",
    name:  $("jn-ceo").value.trim(),
    tel:   $("jn-tel").value.trim(),
    email: $("jn-mail").value.trim(),
    region: reg ? amRegionName(reg) : "",
    company: $("jn-name").value.trim(),
    exp:  ind ? amIndustryName(ind) : "",
    note: $("jn-note").value.trim(),
    serviceNames: [$("jn-svc").value.trim()].filter(Boolean),
    agree: true
  };
  return amSend("jn-fail", body, "joinSend");
};

/* 공통 보내기 — ⚠️ **실패했을 때가 더 중요합니다.** 길게 적으신 글을
   들고 막다른 길에 서게 하지 않습니다. 적으신 것을 화면에 그대로 두고,
   복사해 두실 수 있게 하고, 다시 시도를 줍니다.
   ⚠️ **화면을 다시 그리지 마세요** — 다시 그리면 적으신 글이 날아갑니다. */
window.amSend = function(failId, body, again){
  var btn = document.querySelector("#"+failId+" ~ button") ||
            document.querySelector("form button[type=submit]");
  if(btn){ btn.disabled = true; btn.textContent = "보내는 중…"; }

  /* ⚠️⚠️ **시간 제한이 없으면 영원히 "보내는 중…" 입니다.** 지하 상가나
     신호가 약한 곳에서 요청이 멈추면 `fetch` 는 돌아오지 않고, 단추는
     비활성인 채로 남고, 애써 만들어 둔 실패 처리(적은 글 보존 · 복사
     단추 · 다시 시도)가 **영영 안 나옵니다.** 길게 적어 주신 사장님이
     아무것도 못 하고 막다른 길에 섭니다.

     ⚠️ 20초입니다. 더 짧으면 Vercel 함수가 처음 깨어나는 동안(콜드
     스타트) 멀쩡한 요청을 끊고, 더 길면 손님이 먼저 포기하십니다.
     ⚠️ 끊어도 **서버에는 이미 닿았을 수 있습니다** — 그래서 실패 글이
     "접수되지 않았습니다" 가 아니라 "지금은 접수되지 않았습니다" 이고,
     다시 보내시면 운영자에게 두 번 올 뿐 잃는 것은 없습니다. */
  var ctl = (typeof AbortController === "function") ? new AbortController() : null;
  var late = setTimeout(function(){ if(ctl) ctl.abort(); }, 20000);
  var opt = { method:"POST", headers:{ "content-type":"application/json" },
              body: JSON.stringify(body) };
  if(ctl) opt.signal = ctl.signal;

  fetch("/api/quote", opt)
    .then(function(r){ clearTimeout(late);
      return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
    .then(function(x){
      if(!x.ok) throw new Error((x.j && x.j.error) || "보내지 못했습니다");
      var box = $(failId);
      /* §6 "모든 신청에 고유 신청번호를 발급한다"
         ⚠️⚠️ **번호가 없으면 줄째 뺍니다** (절대 규칙 2 · 5). 서버는
         실제로 저장됐을 때만 번호를 돌려줍니다 — 없는 번호를 보여
         주면 손님이 그 번호로 물어봤을 때 아무것도 없습니다.
         ⚠️ `esc()` 를 거칩니다 (절대 규칙 4). */
      var no = (x.j && x.j.no) ? String(x.j.no) : "";
      var dup = !!(x.j && x.j.dup);
      if(box) box.innerHTML = '<div class="notice-ok"><b>' +
        (dup ? "이미 접수되었습니다." : "접수되었습니다.") + '</b>' +
        (no ? '<p>접수번호 <b>' + esc(no) + '</b> — 문의하실 때 알려 주세요.</p>' : '') +
        '<p>적어 주신 연락처로 안내드리겠습니다. 회신 시점을 약속드리지는 않습니다.</p></div>';
      toast(dup ? "이미 접수되었습니다" : "접수되었습니다");
      var f = box && box.closest("form"); if(f) f.reset();
      if(btn){ btn.disabled = false; btn.textContent = "다시 보내기"; }
    })
    .catch(function(e){
      clearTimeout(late);
      /* 끊긴 것인지 서버가 거절한 것인지를 갈라서 말합니다 — 손님이
         무엇을 하셔야 하는지가 다릅니다. */
      var why = (e && (e.name === "AbortError" || /aborted/i.test(e.message || "")))
        ? "연결이 오래 걸려 끊었습니다. 신호가 잡히는 곳에서 다시 눌러 주세요."
        : (e && e.message);
      sendFail(failId, again, body, why);
    });
  return false;
};

function sendFail(failId, again, body, msg){
  var box = $(failId); if(!box) return;
  var txt = Object.keys(body).map(function(k){
    var v = body[k];
    if(v && typeof v === "object" && !Array.isArray(v)){
      return Object.keys(v).filter(function(kk){ return v[kk]; })
             .map(function(kk){ return kk + ": " + v[kk]; }).join("\n");
    }
    return (Array.isArray(v) ? v.join(", ") : v) ? (k + ": " + v) : "";
  }).filter(Boolean).join("\n");

  box.innerHTML = '<div class="notice-bad"><b>지금은 접수되지 않았습니다.</b>'+
    '<p>적어 주신 내용은 <b>그대로 남아 있습니다.</b> 잠시 뒤 다시 눌러 보시거나, '+
      '아래 단추로 복사해 두셨다가 보내 주세요.</p>'+
    '<div class="row-cta">'+
      '<button class="btn btn-o" type="button" onclick="amCopy(this)" '+
        'data-copy="'+esc(txt)+'">적은 내용 복사'+icon("doc",16)+'</button>'+
    '</div>'+
    (msg ? '<p class="note">'+esc(msg)+'</p>' : '')+
  '</div>';
  var btn = document.querySelector("form button[type=submit]");
  if(btn){ btn.disabled = false; btn.textContent = "다시 시도"; }
}

/* ⚠️ `navigator.clipboard` 는 https 가 아니거나 오래된 브라우저에
   없습니다. 옛 방법으로 떨어지게 해 둡니다. */
window.amCopy = function(btn){
  var t = btn.getAttribute("data-copy") || "";
  function done(){ toast("복사했습니다"); }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(t).then(done, fallback);
  }else fallback();
  function fallback(){
    var ta = document.createElement("textarea");
    ta.value = t; ta.style.position="fixed"; ta.style.opacity="0";
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); done(); }catch(e){ toast("복사하지 못했습니다"); }
    document.body.removeChild(ta);
  }
};

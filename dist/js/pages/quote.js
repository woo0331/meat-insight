

var QKEY = "am.quotes.v1";

function askGroups(list){
  var seen = {}, out = [];
  list.forEach(function(s){
    if(!s.ask) return;
    if(seen[s.cat]){ seen[s.cat].push(s); return; }
    seen[s.cat] = [s];
    out.push(s.cat);
  });
  return out.map(function(cat){ return { cat:cat, svs:seen[cat] }; });
}

function SvcAskBand(list){
  var G = askGroups(list);
  if(!G.length) return "";
  return '<div class="rqf-all">'+G.map(ReqFormBand).join("")+'</div>';
}

function ReqFormBand(g){
  var L = (typeof amReqForm === "function") ? amReqForm(g.cat) : [];
  if(!L.length) return "";
  var names = g.svs.map(amPickLabel).join(" · ");
  return '<div class="rqf" data-svc="'+esc(g.cat)+'">'+
    '<p class="rqf-h">'+esc(names)+
      ' <i>— 이것만 더 알려 주시면 견적이 훨씬 정확해집니다</i></p>'+
    L.map(function(f, i){ return ReqFormRow(g.cat, f, i); }).join("")+
  '</div>';
}

function ReqFormRow(svId, f, i){
  var key = svId + ":" + i;
  var id  = "rq-" + svId.replace(/[^a-z0-9]/gi, "-") + "-" + i;
  var lab = esc(f.k) + (f.unit ? ' <i>('+esc(f.unit)+')</i>' : "");
  if(f.t === "chk")
    return '<div class="f-r"><span class="rqf-l">'+lab+'</span>'+
      '<div class="rqf-c">'+(f.opts || []).map(function(o, j){
        return '<label class="rqf-k" for="'+id+'-'+j+'"><input type="checkbox" id="'+id+'-'+j+'" '+
          'value="'+esc(o)+'" data-rq="'+esc(key)+'"><span>'+esc(o)+'</span></label>';
      }).join("")+'</div></div>';
  if(f.t === "sel")
    return '<div class="f-r"><label for="'+id+'" class="rqf-l">'+lab+'</label>'+
      '<select class="sel" id="'+id+'" data-rq="'+esc(key)+'">'+
        '<option value="">골라 주세요</option>'+
        (f.opts || []).map(function(o){
          return '<option value="'+esc(o)+'">'+esc(o)+'</option>'; }).join("")+
      '</select></div>';

  var type = f.t === "date" ? ' type="date"' : (f.t === "num" ? ' inputmode="numeric"' : "");
  return '<div class="f-r"><label for="'+id+'" class="rqf-l">'+lab+'</label>'+
    '<input id="'+id+'"'+type+' data-rq="'+esc(key)+'"'+
      (f.ph ? ' placeholder="'+esc(f.ph)+'"' : "")+'></div>';
}

function reqFormValues(sv){
  var L = (typeof amReqForm === "function") ? amReqForm(sv.cat) : [], out = {};
  L.forEach(function(f, i){

    var key = sv.cat + ":" + i, v = "";
    var els = document.querySelectorAll('[data-rq="'+key+'"]');
    if(f.t === "chk"){
      var on = [];
      [].slice.call(els).forEach(function(el){ if(el.checked) on.push(el.value); });
      v = on.join(" · ");
    }else if(els[0]){
      v = String(els[0].value || "").trim();
    }
    if(v) out[f.k] = v;
  });
  return out;
}

function quoteItems(list){
  return list.map(function(sv){
    var d = sv.ask ? reqFormValues(sv) : {};
    return { id: sv.id, detail: d };
  });
}

function quoteServices(){
  var raw = nowQS("sv"), ids = [];
  if(raw) ids = raw.split(",").map(function(x){ return x.trim(); }).filter(Boolean);
  else if(typeof amPickGet === "function") ids = amPickGet();

  var one = nowQS("c");
  if(!ids.length && one) ids = [one];

  var seen = {}, out = [];
  ids.forEach(function(id){
    if(seen[id]) return;
    var sv = (typeof amPickOne === "function") ? amPickOne(id) : null;
    if(!sv) return;
    seen[id] = 1; out.push(sv);
  });
  if(raw && typeof amPickSet === "function")
    amPickSet(out.map(function(s){ return s.id; }));
  return out;
}

function QuoteSvcStep(list){
  var cats = (window.AM_CATS || []);
  var n = list.length;
  return '<div class="qs" id="qs-svc">'+
    QStepHd("01", "어떤 서비스가 필요하신가요?",
      "여러 개 고르실 수 있습니다. 하나도 안 고르셔도 보내실 수 있습니다.")+
    '<ul class="pk-g">'+cats.map(function(c){
      var on = (typeof amPickHas === "function") && amPickHas(c.key);
      var id = "q-pk-" + c.key;
      return '<li><label class="pk-c'+(on ? " is-on" : "")+'" for="'+id+'">'+

        '<span class="pk-i">'+icon(c.icon || "check", 34)+'</span>'+
        '<span class="pk-t"><b>'+esc(c.name)+'</b>'+
          (c.lead ? '<i>'+esc(c.lead)+'</i>' : "")+'</span>'+
        '<input class="pk-ck" type="checkbox" id="'+id+'" data-pick="'+esc(c.key)+'"'+
          (on ? " checked" : "")+
          ' onchange="quoteSvcPick(\''+esc(c.key)+'\',this)">'+
      '</label></li>';
    }).join("")+'</ul>'+

    '<p class="qs-sum" data-pick-row'+(n ? "" : " hidden")+'>'+icon("listck",16)+
      '<span><b data-pick-n>'+n+'</b>개 고르셨습니다. 아래에 그 서비스에서만 '+
      '쓰는 것을 더 묻습니다.</span>'+
      '<button class="qs-clr" type="button" onclick="pickClear()">전부 해제</button></p>'+
  '</div>';
}

window.quoteSvcPick = function(id, el){
  if(typeof pickToggle === "function") pickToggle(id, el);
  quoteSvcSync();
};

function quoteSvcSync(){
  var box = document.getElementById("q-ask");
  if(box){
    var keep = {};
    [].slice.call(box.querySelectorAll("[data-rq]")).forEach(function(el){
      var k = el.getAttribute("data-rq");
      if(el.type === "checkbox"){
        if(!keep[k]) keep[k] = {};
        keep[k][el.value] = el.checked;
      }else keep[k] = el.value;
    });
    box.innerHTML = SvcAskBand(quoteServices());
    [].slice.call(box.querySelectorAll("[data-rq]")).forEach(function(el){
      var k = el.getAttribute("data-rq"), v = keep[k];
      if(v == null) return;
      if(el.type === "checkbox"){ if(v && v[el.value]) el.checked = true; }
      else el.value = v;
    });
  }

  var n = (typeof amPickCount === "function") ? amPickCount() : 0;
  var t = document.getElementById("q-go-t");
  if(t) t.textContent = n ? ("선택한 " + n + "개 서비스 견적 신청하기")
                          : "견적 신청하기";

  var w = document.getElementById("q-what");
  if(w && !String(w.value || "").trim()){
    var L = (typeof amPickList === "function") ? amPickList() : [];
    w.value = L.map(amPickLabel).join(" · ");
  }
}

function QStepHd(no, t, lead){
  return '<div class="qs-h"><span class="qs-no">'+esc(no)+'</span>'+
    '<div><b>'+esc(t)+'</b>'+(lead ? '<i>'+esc(lead)+'</i>' : "")+'</div></div>';
}

var DKEY = "am.draft.v1";

var DRAFT_FIELDS = [["q-side","상황"],["q-what","필요한 일"],
  ["q-reg","지역"],["q-gu","시 · 군 · 구"],
  ["q-bud","희망 금액"],["q-when","희망 일정"]];

window.quoteDraftSave = function(){
  var d = {};
  DRAFT_FIELDS.forEach(function(f){ var el = $(f[0]); if(el) d[f[0]] = el.value; });

  amSet(DKEY, { f:d, at:Date.now() });

  if(typeof amStateTouch === "function") amStateTouch("draft");
  quoteDraftPaint();

  toast("적으신 조건을 이 브라우저에 저장했습니다");
};

window.quoteDraftLoad = function(){
  var d = amGet(DKEY, null);
  if(!d || !d.f){ toast("저장해 두신 것이 없습니다"); return; }
  DRAFT_FIELDS.forEach(function(f){
    var el = $(f[0]);
    if(el && d.f[f[0]] != null && d.f[f[0]] !== "") el.value = d.f[f[0]];
  });
  toast("저장해 두신 조건을 불러왔습니다");
};

window.quoteDraftDel = function(){
  if(!confirm("저장해 두신 조건을 지웁니다. 되돌릴 수 없습니다.")) return;
  amDel(DKEY);

  if(typeof amStateDrop === "function") amStateDrop("draft");
  quoteDraftPaint(); toast("지웠습니다");
};

function quoteDraftWhen(){
  var d = amGet(DKEY, null);
  if(!d || !d.at) return "";
  var t = new Date(d.at);
  function p(n){ return (n < 10 ? "0" : "") + n; }
  return t.getFullYear()+". "+p(t.getMonth()+1)+". "+p(t.getDate())+
         " "+p(t.getHours())+":"+p(t.getMinutes());
}

window.quoteDraftPaint = function(){
  var el = $("q-draft-when");
  if(!el) return;
  var w = quoteDraftWhen();

  var acct = (typeof amStateOn === "function" && amStateOn())
    ? " \u00b7 로그인한 계정에도 저장됨" : "";
  el.textContent = w ? ("마지막 저장 " + w + acct) : "아직 저장해 두신 것이 없습니다";
  var del = $("q-draft-del"); if(del) del.hidden = !w;
  var ld  = $("q-draft-load"); if(ld) ld.hidden = !w;
};

function QuoteDraftBox(){
  return '<div class="q-draft">'+
    '<p class="q-draft-t">'+icon("save",16)+
      '<span><b>지금 적은 조건을 저장해 두실 수 있습니다.</b> '+
      '저장만 해서는 <b>접수되지 않습니다</b> — 아래 신청하기를 '+
      '누르셔야 저희에게 옵니다.</span></p>'+
    '<div class="q-draft-b">'+
      '<button class="btn btn-o" type="button" onclick="quoteDraftSave()">'+
        '조건 저장'+icon("save",16)+'</button>'+
      '<button class="btn btn-o" type="button" id="q-draft-load" hidden '+
        'onclick="quoteDraftLoad()">저장한 조건 불러오기</button>'+
      '<button class="btn btn-o" type="button" id="q-draft-del" hidden '+
        'onclick="quoteDraftDel()">저장한 것 지우기</button>'+
    '</div>'+
    '<p class="q-draft-w" id="q-draft-when"></p>'+

    '<p class="note">저장되는 것은 <b>상황 · 필요한 일 · 지역 · '+
      '시군구 · 희망 금액 · 희망 일정</b>까지입니다. '+
      '<b>성함 · 연락처 · 자세한 내용 · 사진 주소는 저장하지 않습니다.</b> '+
      '이 브라우저에 남고, <b>로그인하신 경우에만</b> 같은 여섯 칸이 '+
      '계정에도 올라가 다른 기기에서 이어집니다. 위 단추로 지우시거나 '+
      '브라우저 기록을 지우시면 함께 사라집니다.</p>'+
  '</div>';
}

function QuoteStage(){
  var n = (window.AM_PROVIDERS || []).length;
  if(n > 0)
    return '<p class="note-box qt-stage">지금 제휴업체 <b>'+n+'곳</b>이 '+
      '등록되어 있습니다. 적어 주신 분야 · 지역에 맞는 곳을 찾아 '+
      '연결해 드립니다 — 어느 업체인지는 정해진 뒤에 알려 드리고, '+
      '그때 연락처 전달 동의를 다시 받습니다.</p>';
  return '<p class="note-box qt-stage"><b>지금 등록된 제휴업체는 없습니다.</b> '+
    '요청을 받아 그 분야 업체를 찾아 드리는 단계입니다 — 접수는 실제로 '+
    '저희에게 오고, 업체가 정해지면 어느 업체인지 알려 드린 뒤 연락처 '+
    '전달 동의를 다시 받습니다. 언제까지 연결된다고 약속드리지는 '+
    '않습니다.</p>';
}

function PageQuote(){
  var list = quoteServices();
  var cat  = nowQS("c"), sub = nowQS("s");
  var reg  = nowQS("r");

  var side = nowQS("side") || "shop";

  var bud  = nowQS("bud"), when = nowQS("when");
  var c    = cat ? amCat(cat) : null;
  var subName = "";
  if(c){

    var hit = amCatItems(c).filter(function(x){ return x.key === sub; })[0];
    subName = hit ? hit.name : "";
  }
  var ready = !!(window.WOW_BIZ && WOW_BIZ.sosReady);

  var svNames  = list.map(amPickLabel).join(" · ");
  var what = subName || svNames || (c ? c.name : "");

  return PgHero({
    kicker:"견적 요청",
    h1raw:"한 번만 적으시면<br class=\"br-m\"> 여러 곳에서 답이 옵니다.",

    lead:"고르신 서비스마다 업체를 찾아 연결해 드립니다. 같은 내용을 업체마다 다시 적지 않으셔도 됩니다. 신청하고 견적을 받는 데 드는 비용은 없습니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w form-wrap">'+

    QuoteStage()+
    (ready ? "" :
      '<div class="notice-bad"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+

        '<p>접수처 설정이 끝나면 바로 열립니다. 그동안에는 '+
        '아래에서 지금 되는 것을 보실 수 있습니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-o" href="/sell">내 폰 팔기</a>'+
          '<a class="btn btn-o" href="/guide">이용 안내</a>'+
        '</div></div>')+

    '<form id="q-f" onsubmit="return quoteSend(event)">'+
      QuoteSvcStep(list)+

      '<div class="qs">'+
        QStepHd("02", "어느 지역이신가요?",
          "지역이 업체를 고르는 첫 번째 조건입니다.")+
        '<div class="f-2">'+
          '<div class="f-r"><label for="q-reg">지역 <b>*</b></label>'+
            RegionSelect("q-reg", reg, "", "지역을 골라 주세요", true)+'</div>'+
          '<div class="f-r"><label for="q-gu">시 · 군 · 구</label>'+
            '<input id="q-gu" autocomplete="address-level2" placeholder="예: 안양시"></div>'+
        '</div>'+
        '<div class="f-r"><label for="q-side">무엇 때문에 <b>*</b></label>'+
            '<select class="sel" id="q-side">'+

              (window.AM_SIDES || []).filter(function(s){
                return s.pw || s.key === side;
              }).map(function(s){
                return '<option value="'+esc(s.key)+'"'+
                  ((side === s.key || (!side && s.key === "shop")) ? " selected" : "")+
                  '>'+esc(s.say)+'</option>';
              }).join("")+
            '</select></div>'+
      '</div>'+

      '<div class="qs">'+
        QStepHd("03", "연락처와 필요한 내용을 적어 주세요",
          "별표(*)만 필수입니다. 나머지는 아시는 만큼만 적어 주셔도 됩니다.")+
        '<div class="f-2">'+
          '<div class="f-r"><label for="q-name">성함 <b>*</b></label>'+
            '<input id="q-name" required autocomplete="name"></div>'+

          '<div class="f-r"><label for="q-tel">연락처 <b>*</b></label>'+
            '<input id="q-tel" type="tel" required autocomplete="tel" '+
              'inputmode="tel" placeholder="010-0000-0000"></div>'+
        '</div>'+

        '<div class="f-r"><label for="q-what">필요한 일 <b>*</b></label>'+
          '<input id="q-what" required value="'+esc(what)+'" '+
            'placeholder="예: 아이폰 14 매입 / 액정 교체 / 업무용 50대 정리"></div>'+

        '<div class="f-2">'+

          '<div class="f-r"><label for="q-bud">희망 금액</label>'+
            '<input id="q-bud" value="'+esc(bud||"")+'" '+
              'placeholder="예: 50만원 / 아직 모름"></div>'+
          '<div class="f-r"><label for="q-when">희망 시점</label>'+
            '<input id="q-when" value="'+esc(when||"")+'" '+
              'placeholder="예: 이번 주 안 / 이번 달 안"></div>'+
        '</div>'+

        '<div class="f-r"><label for="q-q">자세한 내용 <b>*</b></label>'+
          '<textarea id="q-q" rows="6" required '+
            'placeholder="기종 · 용량 · 상태(액정 · 배터리 · 침수) · 구성품을 아시는 만큼만 적어 주세요. 양식이 없어도 됩니다."></textarea></div>'+

        '<div class="f-r"><label for="q-img">사진 주소</label>'+
          '<input id="q-img" placeholder="기기 사진 링크가 있으면 붙여 주세요 (선택)"></div>'+

        '<div id="q-ask">'+SvcAskBand(list)+'</div>'+

        QuoteDraftBox()+
      '</div>'+

      '<div class="qs">'+
        QStepHd("04", "확인하고 보내기", "")+
        AgreeBox("q-ag","성함 · 연락처 · 지역 · 희망 금액 · 희망 시점 · 적어 주신 내용 · 사진 주소",
                 "중고폰 매입 · 판매 · 수리 신청 접수와 상담 안내","접수일로부터 1년")+
        QNotifyBox()+
        '<div id="q-fail"></div>'+
        '<button class="btn btn-b btn-lg btn-full" type="submit"'+(ready?"":" disabled")+'>'+
          '<span id="q-go-t">'+(list.length
            ? "선택한 "+list.length+"개 서비스 견적 신청하기"
            : "견적 신청하기")+'</span>'+icon("arrow",18)+'</button>'+

        '<p class="note note-mid">업체에서 견적을 받으시면 <b>아래 표에 적어 '+
          '두세요.</b> 금액 · 기간 · 포함 범위를 나란히 놓고 보실 수 있습니다. '+
          '이 브라우저에만 남고 서버로 보내지 않습니다.</p>'+
      '</div>'+
    '</form>'+
  '</div></section>'+
  CompareBand();
}

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

function QNotifyBox(){
  return '<label class="agree-l q-nt" for="q-nt">'+
    '<input type="checkbox" id="q-nt">'+
    '<span><b>진행 상황을 메일로 알려 주세요</b> (선택) — '+
      '업체가 정해졌을 때와 견적이 도착했을 때만 보냅니다. '+
      '광고는 보내지 않고, 받지 않으시려면 그 메일에 회신해 주시면 '+
      '바로 멈춥니다.</span>'+
  '</label>';
}

window.quoteSend = function(ev){
  ev.preventDefault();
  if(!$("q-ag").checked){ toast("개인정보 수집 · 이용 동의가 필요합니다"); return false; }

  var need = [["q-what","필요한 일"],["q-reg","지역"],["q-q","자세한 내용"],
              ["q-name","성함"],["q-tel","연락처"]];
  for(var i=0;i<need.length;i++){
    if(!$(need[i][0]).value.trim()){
      toast(need[i][1]+"을(를) 적어 주세요");

      $(need[i][0]).focus();
      $(need[i][0]).scrollIntoView({ block:"center" });
      return false; }
  }

  var tel = $("q-tel").value.replace(/[^0-9]/g, "");
  if(tel.length < 9 || tel.length > 11){
    toast("연락처를 다시 확인해 주세요");
    $("q-tel").focus(); $("q-tel").scrollIntoView({ block:"center" });
    return false;
  }

  var list = quoteServices();
  var reg = $("q-reg").value;
  var body = {
    kind: "quote",
    name:  $("q-name").value.trim(),
    tel:   $("q-tel").value.trim(),
    region: reg ? amRegionName(reg) : "",

    service: "", serviceName: $("q-what").value.trim(),
    side:  $("q-side").value,
    cat:   list.length ? list[0].id : (nowQS("c") || ""),

    gu:    $("q-gu").value.trim(),
    q:      $("q-q").value.trim(),
    budget: $("q-bud").value.trim(),
    wantAt: $("q-when").value.trim(),

    items: quoteItems(list),

    idem: quoteIdem(),

    detail: amDropEmpty({

      "상황":  amSideName($("q-side").value),
      "시군구": $("q-gu").value.trim(),
      "희망 금액": $("q-bud").value.trim(),
      "희망 시점": $("q-when").value.trim(),
      "사진":  $("q-img").value.trim(),

      "신청 서비스": list.map(amPickLabel).join(" · ")
    }),
    agree: true,

    notify: !!(document.getElementById("q-nt") &&
               document.getElementById("q-nt").checked)
  };
  return amSend("q-fail", body, "quoteSend", quoteAfterSend);
};

function quoteIdem(){ return amIdem("quote"); }

window.quoteIdemClear = function(){ amIdemClear("quote"); };

window.quoteAfterSend = function(){
  quoteIdemClear();
  amDel(DKEY);
  if(typeof amPickSet === "function") amPickSet([]);
  if(typeof pickPaint === "function") pickPaint();

  if(typeof quoteSvcSync === "function") quoteSvcSync();
  if(typeof window.quoteDraftPaint === "function") window.quoteDraftPaint();
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
  var reg = $("jn-reg").value;
  var body = {
    kind: "partner",
    name:  $("jn-ceo").value.trim(),
    tel:   $("jn-tel").value.trim(),
    email: $("jn-mail").value.trim(),
    region: reg ? amRegionName(reg) : "",
    company: $("jn-name").value.trim(),

    exp:  $("jn-ind").value.trim(),
    note: $("jn-note").value.trim(),
    serviceNames: [$("jn-svc").value.trim()].filter(Boolean),
    agree: true
  };
  return amSend("jn-fail", body, "joinSend");
};

window.amSend = function(failId, body, again, done){
  var btn = document.querySelector("#"+failId+" ~ button") ||
            document.querySelector("form button[type=submit]");
  if(btn){ btn.disabled = true; btn.textContent = "보내는 중…"; }

  var ctl = (typeof AbortController === "function") ? new AbortController() : null;
  var late = setTimeout(function(){ if(ctl) ctl.abort(); }, 20000);
  var opt = { method:"POST", headers:{ "content-type":"application/json" },
              body: JSON.stringify(body) };
  if(ctl) opt.signal = ctl.signal;

  fetch("/api/quote", opt)
    .then(function(r){ clearTimeout(late);
      return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
    .then(function(x){
      if(!x.ok){

        const err = new Error((x.j && x.j.error) || "보내지 못했습니다");
        err.fromServer = true;
        throw err;
      }
      var box = $(failId);

      var no = (x.j && x.j.no) ? String(x.j.no) : "";
      var dup = !!(x.j && x.j.dup);
      if(box) box.innerHTML = '<div class="notice-ok"><b>' +
        (dup ? "이미 접수되었습니다." : "접수되었습니다.") + '</b>' +
        (no ? '<p>접수번호 <b>' + esc(no) + '</b> — 문의하실 때 알려 주세요.</p>' : '') +
        '<p>적어 주신 연락처로 안내드리겠습니다. 회신 시점을 약속드리지는 않습니다.</p></div>';

      if(no && box && (!body || body.kind !== "partner") &&
         typeof amPhotoAfter === "function")
        amPhotoAfter(box, no, (body && body.tel) || "");
      toast(dup ? "이미 접수되었습니다" : "접수되었습니다");
      var f = box && box.closest("form"); if(f) f.reset();

      if(typeof done === "function"){ try{ done(); }catch(e){} }
      if(btn){ btn.disabled = false; btn.textContent = "다시 보내기"; }
    })
    .catch(function(e){
      clearTimeout(late);

      var why;
      if(e && (e.name === "AbortError" || /aborted/i.test(e.message || "")))
        why = "연결이 오래 걸려 끊었습니다. 신호가 잡히는 곳에서 다시 눌러 주세요.";
      else if(e && e.fromServer) why = e.message;
      else why = "인터넷 연결이 끊겼거나 서버에 닿지 못했습니다. " +
                 "잠시 뒤 다시 눌러 주세요.";
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

  var B = window.WOW_BIZ || {};
  var ways = [];
  if(B.phone)
    ways.push('<a class="btn btn-o" href="tel:'+
      esc(String(B.phone).replace(/[^0-9+]/g, ""))+'">'+
      icon("phone",16)+esc(B.phone)+'</a>');
  if(B.email)
    ways.push('<a class="btn btn-o" href="mailto:'+esc(B.email)+'">'+
      icon("mail",16)+esc(B.email)+'</a>');

  box.innerHTML = '<div class="notice-bad"><b>지금은 접수되지 않았습니다.</b>'+
    '<p>적어 주신 내용은 <b>그대로 남아 있습니다.</b> 잠시 뒤 다시 눌러 보시거나, '+
      '아래 단추로 복사해 두셨다가 보내 주세요.</p>'+
    '<div class="row-cta">'+
      '<button class="btn btn-o" type="button" onclick="amCopy(this)" '+
        'data-copy="'+esc(txt)+'">적은 내용 복사'+icon("doc",16)+'</button>'+
    '</div>'+
    (ways.length
      ? '<p>복사한 내용을 아래로 보내 주시면 저희가 받아 처리하겠습니다.</p>'+
        '<div class="row-cta">'+ways.join("")+'</div>'
      : '')+
    (msg ? '<p class="note">'+esc(msg)+'</p>' : '')+
  '</div>';
  var btn = document.querySelector("form button[type=submit]");
  if(btn){ btn.disabled = false; btn.textContent = "다시 시도"; }
}

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

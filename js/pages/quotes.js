/* ════════════════════════════════════════════════════════════════════
   견적 비교 (/quotes)

   업체를 찾아 주는 곳은 많습니다. 그런데 **받은 견적을 나란히 놓고
   비교하는 일**은 대부분 사장님이 종이와 머리로 합니다. 금액만 보고
   고르면 포함 범위가 달라서 나중에 추가금이 붙습니다.

   ⚠️ **백엔드가 없어도 이 기능은 됩니다.** 사장님이 받은 견적을 직접
   넣으시면 됩니다. 나중에 우리가 받아 온 견적이 생기면 같은 화면에
   그대로 채워 넣으면 됩니다 — 화면을 다시 만들 필요가 없습니다.

   ⚠️ **"이게 제일 좋습니다" 라고 하지 않습니다.** 우리는 그 공사를 안
   봤습니다. 제일 싼 것이 제일 좋은 것도 아닙니다. 우리가 하는 일은
   **같은 자리에 놓고 빠진 칸을 보여 주는 것**까지입니다.

   ⚠️ 적으신 것은 이 브라우저에만 남습니다. 업체명·금액이 들어가므로
   서버로 보내지 않습니다.

   ⚠️ 결과 화면이라 `noindex` 입니다 (사람마다 다릅니다).
   ════════════════════════════════════════════════════════════════════ */

var QC_KEY = "wow.quotes.v1";
var QC_MAX = 4;                 /* 넷을 넘으면 화면에서 비교가 안 됩니다 */

/* 견적 한 장에서 비교하는 칸 */
var QC_FIELDS = [
  { key:"co",    label:"업체명",   type:"text", ph:"예: 가나덕트" },
  { key:"price", label:"금액",     type:"num",  unit:"만원", cmp:"min" },
  { key:"days",  label:"공사 기간", type:"num",  unit:"일",   cmp:"min" },
  { key:"war",   label:"A/S 보증", type:"num",  unit:"개월", cmp:"max" },
  { key:"pay",   label:"결제조건", type:"text", ph:"예: 계약금 30%" },
  { key:"inc",   label:"포함",     type:"area", ph:"예: 철거 · 폐기물 처리 · 자재 포함" },
  { key:"exc",   label:"별도",     type:"area", ph:"예: 전기 증설 별도, 옥상 배관 별도" }
];

/* 견적서에서 대개 빠져 있는 것들 — 이걸 물어보셨는지가 금액보다
   중요합니다. ⚠️ 업종 상식이지 우리가 센 통계가 아닙니다. */
var QC_ASK = [
  "포함 범위와 별도 비용이 **글로** 적혀 있는가",
  "철거와 폐기물 처리가 포함인가",
  "공사 중 추가 공사가 생기면 **누가 어떻게** 정하는가",
  "A/S 기간과 범위 (부품인가 공임인가 둘 다인가)",
  "공사 일정과, 늦어지면 어떻게 하는가",
  "대금 지급 시점 (계약금 · 중도금 · 잔금)",
  "세금계산서가 전액 발행되는가",
  "하자보수보증 (보증서 · 보증보험 여부)",
  "영업을 며칠 쉬어야 하는가"
];

function qcLoad(){
  try{
    var o = JSON.parse(localStorage.getItem(QC_KEY) || "null");
    if(!o || typeof o !== "object") o = {};
    if(!Array.isArray(o.list)) o.list = [];
    if(!o.ask || typeof o.ask !== "object") o.ask = {};
    return o;
  }catch(e){ return { list:[], ask:{}, title:"" }; }
}
function qcSave(o){ try{ localStorage.setItem(QC_KEY, JSON.stringify(o)); }catch(e){} }

function PageQuotes(){
  var S = qcLoad();
  if(!S.list.length){ S.list = [{}, {}]; qcSave(S); }   /* 빈 화면을 두지 않습니다 */

  return '<section class="pg-hero"><div class="w pgh">'+
    '<div class="pgh-t">'+
      '<p class="eyebrow">견적 비교</p>'+
      '<h1 class="pg-h1">받으신 견적, 나란히 놓고 보세요.</h1>'+
      '<p class="pg-lead">금액만 보고 고르면 나중에 추가금이 붙습니다. '+
        '포함 범위가 다르면 애초에 비교가 안 되기 때문입니다.</p>'+
      '<ul class="pg-facts">'+
        fact("lock", "업체명과 금액이 들어갑니다. <b>이 브라우저 밖으로 나가지 않습니다.</b>")+
        fact("info", "<b>어느 것이 제일 좋다고 말하지 않습니다.</b> 저희는 그 공사를 보지 않았습니다. "+
                     "같은 자리에 놓고 빠진 칸을 보여 드리는 데까지입니다.")+
        fact("hand", "아직 견적이 하나뿐이어도 됩니다. 넣어 두시고 나중에 채우셔도 남아 있습니다.")+
      '</ul>'+
    '</div>'+
    '<figure class="pgh-f">'+photoBox("hero-quotes")+'</figure>'+
    '</div></section>'+

    '<div class="w qc">'+
      '<div class="qc-top">'+
        '<label class="sr" for="qc-title">무슨 공사인가요</label>'+
        '<input id="qc-title" class="qc-title" type="text" autocomplete="off"'+
          ' placeholder="무슨 공사인가요? (예: 40평 덕트 재시공)"'+
          ' value="'+esc(S.title||"")+'" oninput="qcTitle(this.value)">'+
        '<div class="qc-acts">'+
          (S.list.length < QC_MAX
            ? '<button class="btn btn-o" type="button" onclick="qcAdd()">'+
              icon("plus",18)+'견적 칸 늘리기</button>' : '')+
          '<button class="btn btn-o" type="button" onclick="qcReset()">'+
            icon("refresh",18)+'전부 지우기</button>'+
        '</div>'+
      '</div>'+

      '<div class="qc-wrap"><table class="qc-t"><tbody>'+
        '<tr class="qc-head"><th scope="row"><span class="sr">항목</span></th>'+
          S.list.map(function(_, i){
            return '<td><span class="qc-n">견적 '+(i+1)+'</span>'+
              (S.list.length > 1
                ? '<button class="qc-x" type="button" aria-label="견적 '+(i+1)+' 지우기"'+
                  ' onclick="qcDel('+i+')">'+icon("x",16)+'</button>' : '')+
              '</td>';
          }).join("")+'</tr>'+
        QC_FIELDS.map(function(f){ return qcRow(f, S.list); }).join("")+
      '</tbody></table></div>'+

      QcSum(S.list)+

      '<section class="qc-ask">'+
        '<div class="post-ck-h"><b>'+icon("chat",20)+'이건 물어보셨나요</b>'+
          '<span id="qc-askn">'+QC_ASK.filter(function(_,i){ return S.ask[i]; }).length+
          ' / '+QC_ASK.length+'</span></div>'+
        '<p class="qc-ask-p">견적서에서 제일 자주 빠지는 것들입니다. '+
          '금액보다 이쪽에서 돈이 갈립니다.</p>'+
        '<ul class="post-ck-l">'+QC_ASK.map(function(t, i){
          var on = !!S.ask[i];
          return '<li class="'+(on?"on":"")+'">'+
            '<label><input type="checkbox" '+(on?"checked ":"")+
              'onchange="qcAsk('+i+',this.checked)">'+
              '<span>'+labMark(t)+'</span></label></li>';
        }).join("")+'</ul>'+
      '</section>'+

      '<section class="st-cta">'+
        '<h2>견적이 모자라면 더 받아 드립니다.</h2>'+
        '<p>같은 조건으로 두세 곳을 받아야 비교가 됩니다. 어떤 공사인지 '+
          '적어 주시면 조건에 맞는 곳에만 요청을 보내 드립니다. 비용은 들지 않습니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/request">견적 더 받기'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-o btn-lg" href="/sos">이 견적이 맞는지 물어보기</a>'+
        '</div>'+
      '</section>'+
    '</div>';
}

function qcRow(f, list){
  /* 제일 싸다 · 제일 빠르다 · 제일 길다 를 표시합니다.
     ⚠️ "제일 좋다" 가 아닙니다. 그 말은 하지 않습니다. */
  var best = null;
  if(f.cmp){
    var nums = list.map(function(q){ return qcNum(q[f.key]); });
    var valid = nums.filter(function(n){ return n > 0; });
    if(valid.length > 1)
      best = f.cmp === "min" ? Math.min.apply(null, valid) : Math.max.apply(null, valid);
  }
  return '<tr>'+
    /* ⚠️ 좁은 화면에서는 단위를 일부러 아랫줄로 내립니다(칸이 84px 뿐).
       그래서 "문장 속 덩어리" 검사에서 빼 달라는 표시를 답니다. */
    '<th scope="row">'+esc(f.label)+
      (f.unit ? ' <em class="g-mix">('+esc(f.unit)+')</em>' : '')+'</th>'+
    list.map(function(q, i){
      var v = q[f.key] || "";
      var mark = (best !== null && qcNum(v) === best);
      var id = "qc-"+f.key+"-"+i;
      var cell = f.type === "area"
        ? '<textarea id="'+id+'" rows="3" placeholder="'+esc(f.ph||"")+'"'+
          ' oninput="qcSet('+i+',\''+f.key+'\',this.value)">'+esc(v)+'</textarea>'
        : '<input id="'+id+'" type="text"'+(f.type==="num"?' inputmode="numeric"':'')+
          ' autocomplete="off" placeholder="'+esc(f.ph||"")+'" value="'+esc(v)+'"'+
          ' oninput="qcSet('+i+',\''+f.key+'\',this.value)">';
      return '<td class="'+(mark?"qc-best":"")+'">'+
        '<label class="sr" for="'+id+'">견적 '+(i+1)+' '+esc(f.label)+'</label>'+
        cell+
        (mark ? '<span class="qc-tag">'+
          (f.cmp === "min" ? (f.key === "price" ? "제일 낮음" : "제일 짧음") : "제일 긺")+
          '</span>' : '')+
      '</td>';
    }).join("")+
  '</tr>';
}

/* 합계·차이 — 숫자는 전부 사장님이 적은 것입니다 */
function QcSum(list){
  var ps = list.map(function(q){ return qcNum(q.price); }).filter(function(n){ return n > 0; });
  var filled = list.filter(function(q){ return (q.co||"").trim() || qcNum(q.price) > 0; }).length;

  if(ps.length < 2)
    return '<p class="qc-sum qc-sum-none">'+icon("info",18)+
      '<span>'+(filled ? '견적이 하나입니다. <b>두 곳 이상</b>이어야 비교가 됩니다.'
                       : '받으신 견적을 위 칸에 적어 보세요.')+'</span></p>';

  var lo = Math.min.apply(null, ps), hi = Math.max.apply(null, ps);
  var gap = hi - lo;
  return '<div class="qc-sum">'+icon("won",18)+
    '<span>제일 낮은 곳과 높은 곳의 차이가 <b>'+won(gap)+'만원</b>입니다'+
    (lo > 0 ? ' (낮은 쪽의 '+Math.round(gap / lo * 100)+'%)' : '')+'. '+
    '<b>금액만 보고 고르지 마세요</b> — 포함 범위가 다르면 이 차이는 뜻이 없습니다. '+
    '아래 물어볼 것부터 맞춰 보세요.</span></div>';
}

function qcNum(v){
  var n = parseFloat(String(v == null ? "" : v).replace(/[^0-9.]/g, ""));
  return isFinite(n) ? n : 0;
}

/* ── 손대는 것들 ─────────────────────────────────────────────
   ⚠️ 글칸에 적는 중에는 화면을 다시 그리지 않습니다. 다시 그리면
   커서가 맨 앞으로 튀어 글을 못 씁니다. 바뀐 자리만 고칩니다. */
window.qcSet = function(i, key, val){
  var S = qcLoad();
  if(!S.list[i]) S.list[i] = {};
  S.list[i][key] = val;
  qcSave(S);
  qcPaint(S);
};
window.qcTitle = function(v){ var S = qcLoad(); S.title = v; qcSave(S); };

/* 표시(제일 낮음 …)와 요약만 새로 칠합니다 */
function qcPaint(S){
  QC_FIELDS.forEach(function(f){
    if(!f.cmp) return;
    var nums = S.list.map(function(q){ return qcNum(q[f.key]); });
    var valid = nums.filter(function(n){ return n > 0; });
    var best = valid.length > 1
      ? (f.cmp === "min" ? Math.min.apply(null, valid) : Math.max.apply(null, valid)) : null;
    S.list.forEach(function(q, i){
      var el = $("qc-"+f.key+"-"+i);
      var td = el && el.closest("td"); if(!td) return;
      var on = best !== null && qcNum(q[f.key]) === best;
      td.classList.toggle("qc-best", on);
      var tag = td.querySelector(".qc-tag");
      if(on && !tag){
        tag = document.createElement("span"); tag.className = "qc-tag";
        tag.textContent = f.cmp === "min" ? (f.key === "price" ? "제일 낮음" : "제일 짧음") : "제일 긺";
        td.appendChild(tag);
      }else if(!on && tag){ tag.remove(); }
    });
  });
  var sum = document.querySelector(".qc-sum");
  if(sum){
    var box = document.createElement("div");
    box.innerHTML = QcSum(S.list);
    sum.replaceWith(box.firstChild);
  }
}

window.qcAdd = function(){
  var S = qcLoad();
  if(S.list.length >= QC_MAX){ toast("견적은 "+QC_MAX+"개까지 나란히 놓을 수 있습니다."); return; }
  S.list.push({}); qcSave(S); rerender(true);
};
window.qcDel = function(i){
  var S = qcLoad();
  S.list.splice(i, 1);
  if(!S.list.length) S.list = [{}];
  qcSave(S); rerender(true);
  toast("견적 한 칸을 지웠습니다.");
};
window.qcAsk = function(i, on){
  var S = qcLoad();
  if(on) S.ask[i] = 1; else delete S.ask[i];
  qcSave(S);
  var n = $("qc-askn");
  if(n) n.textContent = QC_ASK.filter(function(_,k){ return S.ask[k]; }).length + " / " + QC_ASK.length;
  var li = document.activeElement && document.activeElement.closest("li");
  if(li) li.classList.toggle("on", !!on);
};
window.qcReset = function(){
  qcSave({ list:[{}, {}], ask:{}, title:"" });
  rerender(true);
  toast("적으신 견적을 전부 지웠습니다.");
};

/* MY 화면이 쓰는 요약 */
window.qcBrief = function(){
  var S = qcLoad();
  var filled = S.list.filter(function(q){ return (q.co||"").trim() || qcNum(q.price) > 0; });
  return { title:S.title || "", n:filled.length, asked:Object.keys(S.ask).length, total:QC_ASK.length };
};

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

/* ── 서비스별 질문 (§6 · 2026-10-17 §5-3) ───────────────────────
   ⚠️⚠️ **같은 것을 두 번 묻지 않습니다.** 면적 · 업종 · 지역 · 예산은
   공통 칸이고, 여기는 그 서비스에서만 쓰는 것입니다 (`reqforms.js`).
   ⚠️ 칸이 없는 서비스면 **그 묶음째 빠집니다** — 빈 머리말을 찍지
   않습니다 (절대 규칙 2).

   ⚠️⚠️ **2026-10-17 — 서비스 여러 개를 한 번에 받습니다** (§5-4).
   전에는 주소의 `?c=` 하나만 보고 칸 이름이 `rq0` · `rq1` 이었습니다 —
   서비스가 둘이면 **id 가 겹쳐서** 뒤엣것이 앞엣것의 값을 덮어씁니다
   (에러도 안 나고 화면도 멀쩡합니다). 지금은 서비스 id 를 앞에 붙여
   `rq-interior-0` 꼴입니다.
   ⚠️⚠️ **답을 `detail` 에 담지 않습니다.** `api/quote.js` 가 `detail` 을
   **스물까지** 읽는데, 서비스 다섯에 질문 다섯이면 스물다섯입니다 —
   뒤쪽이 에러 없이 사라집니다. 서비스별 답은 `items[].detail` 로
   **따로** 갑니다 (§6 QuoteRequestItem). */
/* ⚠️⚠️ **분류로 묶습니다** (2026-10-18 운영 §7-4). 운영 쪽은 하위를
   고르셔서 `repair/aircon-fix` 와 `repair/fridge-fix` 가 같이 올 수
   있는데, 질문은 **분류 단위**(`reqforms.js`)라 서비스마다 그리면
   **같은 질문이 두 번** 나옵니다 — §7-4 가 "공통 정보는 한 번만
   입력한다" 고 적은 그 자리이고, `/quote` 가 없애려는 헷갈림입니다.
   ⚠️ 머리말에는 그 분류에서 고르신 것을 **전부** 적습니다 — 안 적으면
   "에어컨 수리 질문인가 냉장고 질문인가" 가 안 보입니다. */
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
  /* ⚠️ 날짜는 date 입니다 — 손으로 적게 하면 "다음달 초" 가 들어오고
     그건 일정이 아닙니다 */
  var type = f.t === "date" ? ' type="date"' : (f.t === "num" ? ' inputmode="numeric"' : "");
  return '<div class="f-r"><label for="'+id+'" class="rqf-l">'+lab+'</label>'+
    '<input id="'+id+'"'+type+' data-rq="'+esc(key)+'"'+
      (f.ph ? ' placeholder="'+esc(f.ph)+'"' : "")+'></div>';
}

/* 그 서비스에 적으신 것 — ⚠️ **빈 칸은 안 담습니다** (절대 규칙 2 ·
   받아 보는 사람이 빈 줄을 읽지 않게). */
function reqFormValues(sv){
  var L = (typeof amReqForm === "function") ? amReqForm(sv.cat) : [], out = {};
  L.forEach(function(f, i){
    /* ⚠️ 칸 이름이 **분류**로 묶여 있습니다 (`askGroups()`) — 여기서
       `sv.id` 로 찾으면 하위를 고르신 분의 답을 **한 글자도 못
       읽습니다** (에러도 안 나고 접수는 성공합니다). */
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

/* 접수에 실을 **항목들** (§6 QuoteRequestItem).
   ⚠️⚠️ 서비스 id 는 `catalog.js` 의 분류 key 입니다 — 이름이 아닙니다.
   관리자가 분류 이름을 바꿔도 지난 신청이 따라옵니다 (§6 "서비스명을
   문자열로만 저장하여 이름 변경 시 데이터 관계가 깨지는 설계는 피한다"). */
function quoteItems(list){
  return list.map(function(sv){
    var d = sv.ask ? reqFormValues(sv) : {};
    return { id: sv.id, detail: d };
  });
}

/* ═════════════════════════════════════════════════════════════════
   복수 상품 신청 (2026-10-09 최종 통합 지시서 §4-4)
   ═════════════════════════════════════════════════════════════════
   ⚠️ 주소의 `?o=` 가 상품 id 목록입니다. **없는 id 는 조용히
   빠집니다** — 밖으로 나간 링크가 옛 id 를 들고 있을 수 있어서,
   거기서 에러를 내면 손님은 아무 잘못도 안 하시고 깨진 화면을 봅니다.
   ⚠️ `/closure` · `/transfer` 의 패키지가 아직 이 길로 옵니다 —
   창업 쪽은 2026-10-17 로 `?sv=`(서비스 고르개)가 받습니다. */
function quoteOffers(){
  var raw = nowQS("o");
  if(!raw) return [];
  return raw.split(",").map(function(id){
    return (typeof amOffer === "function") ? amOffer(id.trim()) : null;
  }).filter(Boolean);
}

/* 접수에 실을 한 줄 — ⚠️ 이름은 `offers.js` 에서 옵니다 */
function quoteOfferNames(){
  return quoteOffers().map(function(o){ return o.name; }).join(" · ");
}

/* 화면 맨 위에 고르신 것을 되읽어 드립니다.
   ⚠️⚠️ **패키지 하나가 계약 하나가 아닙니다** (§4-4) — 그 줄을
   지우지 마세요. 지금은 제휴사가 0곳이라 상품별로 **찾아서 연결**해
   드리는 단계까지입니다. */
function QuoteOfferBand(){
  var L = quoteOffers();
  if(!L.length) return "";
  var pk = (typeof amPackage === "function") ? amPackage(nowQS("pk")) : null;
  return '<div class="qof">'+
    '<p class="qof-k">'+icon("listck",15)+
      (pk ? esc(pk.name)+" — " : "")+'고르신 상품 '+L.length+'개</p>'+
    '<ul class="qof-l">'+L.map(function(o){
      return '<li>'+icon(o.icon || "check", 15)+esc(o.name)+'</li>'; }).join("")+'</ul>'+
    /* ⚠️ 바깥 칸이 `display:flex` · `gap` 이라 **맨글과 `<b>` 가 제각각
       flex 칸**이 됩니다 — "따로 입니다" 처럼 벌어졌습니다 (찍어 보고
       알았습니다). 문장을 한 칸에 둡니다. */
    '<p class="qof-n">'+icon("info",14)+
      '<span>한 번만 적으시면 저희가 나눠서 연결해 드립니다 — '+
      '<b>상품마다 업체와 계약은 따로</b>입니다.</span></p>'+
  '</div>';
}

/* ═════════════════════════════════════════════════════════════════
   고르신 서비스 (2026-10-17 창업 준비 전문관 §5-4)
   ═════════════════════════════════════════════════════════════════
   ⚠️⚠️ **읽는 자리가 셋입니다** — ① 주소의 `?sv=` ② 이 브라우저에
   저장된 선택 ③ 옛 링크의 `?c=`(분류 하나). 셋을 다 받는 까닭은,
   링크로 받으신 분에게는 저장된 것이 없고, 밖으로 퍼진 옛 링크는
   `?c=` 만 들고 있기 때문입니다.
   ⚠️ 주소에 실려 오면 **저장된 선택을 그것으로 맞춥니다** — 그래야
   화면 위에 적힌 것과 바구니가 같은 말을 합니다. */
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
    if(!sv) return;                     /* 없는 서비스는 조용히 거릅니다 */
    seen[id] = 1; out.push(sv);
  });
  if(raw && typeof amPickSet === "function")
    amPickSet(out.map(function(s){ return s.id; }));
  return out;
}

/* STEP 01 — 고르신 서비스 (§5-1 1단계 · §9-4 "항상 확인 가능")
   ⚠️⚠️ 하나도 안 고르셔도 **막지 않습니다.** 무엇이 필요한지 모르셔서
   오신 분이 있고, 그분께 "먼저 고르고 오세요" 라고 하면 거기서
   닫습니다 — 상황만 적으시면 저희가 찾아 드립니다. */
/* ⚠⚠ **돌아가는 길이 `/startup` 으로 박혀 있었습니다.** 2026-10-18
   로 운영 쪽(`side=ops`)도 같은 고르개를 쓰게 되면서, 운영 중인
   사장님이 "서비스 더 고르기" 를 누르면 **창업 준비 화면**으로
   갔습니다 — 고르던 자리를 잃습니다. 쪽을 보고 보냅니다. */
/* ⚠️⚠️ **네 쪽의 이름과 돌아갈 자리는 `js/data/deal.js` 한 곳입니다**
   (`AM_SIDES`). 전에 여기서 손으로 적고 있었고 `transfer` 가
   빠져 있어서, 양도양수에서 고르고 오신 분이 "서비스 더 고르기" 를
   누르면 **창업 고르개**로 갔습니다 — 고르신 것은 그대로 있는데
   화면이 다른 전문관이라 자기가 어디 있는지를 잃습니다. */
function quotePickBack(side){
  var s = (typeof amSide === "function") ? amSide(side) : null;
  /* ⚠️⚠️ **기본값을 `/sell` 로 바꿨습니다** (2026-10-31). 전에는 쪽을
     못 찾으면 `/startup` 이었고, `/quote` 의 고르개 기본값도 `"start"`
     라 **그냥 `/quote` 를 열기만 해도** 그 길로 갔습니다 (재서
     알았습니다) — 그 157개는 지금 **308 로 `/` 에** 갑니다.

     ⚠️⚠️ **쪽을 찾았으면 그 쪽의 `pick` 을 그대로 씁니다** — 중고폰
     쪽만 보내게 걸러 봤다가 물렀습니다. `side=ops` 로 오신 분을
     `/sell`(내 폰 팔기)로 보내는 것은 **다른 서비스로 보내는 것**이고,
     308 로 메인에 가는 것보다 나쁩니다 (고르신 것은 그대로인데 화면이
     남의 서비스입니다). `AM_SIDES` 의 `pick` 은 그 전문관의 **제
     주소**이고, 되살리시는 날 그대로 맞아야 합니다. */
  return (s && s.pick) ? s.pick : "/sell";
}

function QuoteSvcStep(list, side){
  return '<div class="qs" id="qs-svc">'+
    QStepHd("01", "어떤 서비스가 필요하신가요?",
      list.length ? "고르신 서비스입니다. 빼실 수 있고, 더 고르실 수도 있습니다."
                  : "아직 안 고르셨어도 됩니다. 아래에 상황만 적어 주시면 저희가 찾아 드립니다.")+
    (list.length
      ? '<ul class="qs-l" id="q-svl">'+list.map(function(sv){
          return '<li><span class="qs-n">'+esc(amPickLabel(sv))+'</span>'+
            '<button class="qs-x" type="button" onclick="quoteSvcDel(\''+esc(sv.id)+'\')" '+
              'aria-label="'+esc(amPickLabel(sv))+' 빼기">'+icon("x",15)+'</button></li>';
        }).join("")+'</ul>'
      : '<p class="qs-zero">'+icon("info",16)+
        ' 고르신 서비스가 없습니다. 그대로 보내셔도 됩니다.</p>')+
    '<p class="qs-go"><a class="btn btn-o" href="'+esc(quotePickBack(side))+'">'+
      (list.length ? "서비스 더 고르기" : "서비스 고르러 가기")+icon("arrow",16)+'</a></p>'+
  '</div>';
}

/* ⚠️ 빼면 **주소도 같이 고칩니다** — 안 그러면 새로고침했을 때
   주소에 남은 옛 목록이 되살아납니다 (고친 것과 보이는 것이 달라지는
   자리입니다). */
window.quoteSvcDel = function(id){
  /* ⚠️⚠️ **`amPickDel` 이라는 함수는 없습니다.** 처음에 그 이름으로
     막아 두었다가 조건이 **영영 false** 라 빼기가 아무 일도 안
     했습니다 — 주소만 다시 만들어서 지운 것이 **되살아났습니다.**
     에러도 안 나고 화면도 멀쩡했습니다 (검사가 3 → 3 으로 잡았습니다). */
  if(typeof pickDel === "function") pickDel(id);
  var left = (typeof amPickGet === "function") ? amPickGet() : [];
  var q = ["side=" + encodeURIComponent($("q-side") ? $("q-side").value : "start")];
  if(left.length) q.push("sv=" + encodeURIComponent(left.join(",")));
  go("/quote?" + q.join("&"));
};

function QStepHd(no, t, lead){
  return '<div class="qs-h"><span class="qs-no">'+esc(no)+'</span>'+
    '<div><b>'+esc(t)+'</b>'+(lead ? '<i>'+esc(lead)+'</i>' : "")+'</div></div>';
}

/* ═════════════════════════════════════════════════════════════════
   임시저장 (§4) — ⚠️⚠️ **접수가 아닙니다**
   ═════════════════════════════════════════════════════════════════
   > §4 — "임시저장과 실제 견적 신청은 반드시 구분한다. 저장만 했는데
   >  실제 신청이 접수된 것처럼 표시하면 안 된다."

   ⚠️⚠️ **담는 것은 조건 칸 여덟뿐입니다** — 상황 · 필요한 일 · 업종 ·
   지역 · 시군구 · 평수 · 예산 · 일정. **성함 · 연락처 · 자세한 내용 ·
   사진 주소는 담지 않습니다.** §4-1 이 "개인정보와 민감한 신청 정보는
   보안 위험을 고려하여 브라우저에 무분별하게 저장하지 않는다" 고
   적었고, 이 저장소도 "가게 컴퓨터는 여러 사람이 씁니다" 로 같은
   규칙입니다. 자세한 내용은 자유 입력이라 성함 · 번호 · 주소가 그대로
   들어오는 칸이어서 뺐습니다.
   ⚠️ 무엇이 남고 무엇이 안 남는지 **화면에 그대로 적습니다** (§4-1
   "브라우저 저장 정보의 유지 범위와 삭제 조건을 안내한다").
   ⚠️⚠️ 서버 임시저장(§4-2)은 **로그인이 서야** 됩니다 — `/api/session`
   이 `auth:false` 인 지금은 그 길이 없고, 있는 척하지 않습니다
   (절대 규칙 5). */
var DKEY = "am.draft.v1";
var DRAFT_FIELDS = [["q-side","상황"],["q-what","필요한 일"],["q-ind","업종"],
  ["q-reg","지역"],["q-gu","시 · 군 · 구"],["q-py","평수"],
  ["q-bud","예산"],["q-when","희망 일정"]];

window.quoteDraftSave = function(){
  var d = {};
  DRAFT_FIELDS.forEach(function(f){ var el = $(f[0]); if(el) d[f[0]] = el.value; });
  /* 고르신 서비스는 이미 `am.pick.v1` 에 있습니다 — 여기 또 담지
     않습니다 (두 곳에 있으면 어긋납니다). */
  amSet(DKEY, { f:d, at:Date.now() });
  /* §6-2 — 로그인하고 들어와 계시면 **계정에도** 남깁니다. 꺼져 있으면
     `amStateTouch()` 가 아무 일도 안 합니다 (js/state.js 머리말).
     ⚠️⚠️ 올라가는 것은 **이 여덟 칸까지**이고 0010 의 트리거가 그 밖의
     칸을 거절합니다 — 성함 · 연락처는 화면 버그로도 안 올라갑니다. */
  if(typeof amStateTouch === "function") amStateTouch("draft");
  quoteDraftPaint();
  /* ⚠️⚠️ **"계정에 저장했습니다" 라고 먼저 말하지 않습니다** (§15 ·
     절대 규칙 5). 서버 왕복은 뒤에 끝나고 실패할 수도 있어서, 지금
     확실한 것(이 브라우저)만 말합니다 — 계정에 올라간 것은
     `quoteDraftPaint()` 가 **올라간 뒤에** 적습니다. */
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
  /* ⚠️⚠️ **계정 쪽도 같이 지웁니다.** 한쪽만 지우면 다음에 열 때
     서버 것이 내려와 **지운 것이 되살아납니다.**
     ⚠️ `amStateClear()` 가 아니라 `amStateDrop("draft")` 입니다 —
     통째로 지우면 **고르신 서비스까지** 계정에서 날아갑니다. */
  if(typeof amStateDrop === "function") amStateDrop("draft");
  quoteDraftPaint(); toast("지웠습니다");
};

/* ⚠️ 마지막 저장 시각을 **절대 표기**로 냅니다 (§4-3). "3분 전" 같은
   상대 표기는 캐시된 화면에서 틀린 날부터 거짓말이 됩니다. */
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
  /* §6-2 — 계정에도 올라갔으면 그렇게 적습니다. ⚠️ `amStateOn()` 은
     **실제로 올린 적이 있을 때만** 참입니다 (절대 규칙 5). */
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
    /* §4-1 — 유지 범위와 삭제 조건을 그대로 적습니다 */
    '<p class="note">저장되는 것은 <b>상황 · 필요한 일 · 업종 · 지역 · '+
      '시군구 · 평수 · 예산 · 일정</b>까지입니다. '+
      '<b>성함 · 연락처 · 자세한 내용 · 사진 주소는 저장하지 않습니다.</b> '+
      '이 브라우저에 남고, <b>로그인하신 경우에만</b> 같은 여덟 칸이 '+
      '계정에도 올라가 다른 기기에서 이어집니다. 위 단추로 지우시거나 '+
      '브라우저 기록을 지우시면 함께 사라집니다.</p>'+
  '</div>';
}

/* ── 지금 어느 단계인가 (§10) ─────────────────────────────────────
   ⚠️⚠️ **지어내지 않습니다** — `AM_PROVIDERS` 를 그 자리에서 셉니다
   (절대 규칙 1). 0곳이면 0곳이라고 말하고, 그게 지금 사실입니다.
   ⚠️ **"검증된 업체" 라고 쓰지 마세요** — 검증 기능이 없습니다
   (표시 · 광고의 공정화에 관한 법률 제3조 · 금지 문구 표).
   ⚠️ 회신 시점을 약속하지 않습니다 (약관 제8조). */
function QuoteStage(){
  var n = (window.AM_PROVIDERS || []).length;
  if(n > 0)
    return '<p class="note-box qt-stage">지금 제휴업체 <b>'+n+'곳</b>이 '+
      '등록되어 있습니다. 적어 주신 분야 · 지역 · 업종에 맞는 곳을 찾아 '+
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
  var ind  = nowQS("i"), reg = nowQS("r");
  /* ⚠️⚠️ **기본값이 2026-10-31 로 `shop` 이 됐습니다.** 전에는 `start`
     (창업)라, 중고폰 구매하기로 들어오신 분의 문의가 **"창업" 건으로**
     저장됐습니다 (위 고르개 ⚠️ 와 같은 자리). */
  var side = nowQS("side") || "shop";
  /* ⚠️ 창업 진단(PART 4)에서 고르신 예산 · 일정입니다. 자유 입력 칸이라
     **고치실 수 있게** 미리 적어만 둡니다 — 못 고치게 잠그면 "3천 ~
     5천만원" 밖의 사정을 적을 자리가 없어집니다. */
  var bud  = nowQS("bud"), when = nowQS("when");
  /* ⚠️ 메인 §2-03 에서 고르신 매장 규모 — 숫자만 받습니다 */
  var py   = (nowQS("py") || "").replace(/[^0-9]/g, "").slice(0, 5);
  var c    = cat ? amCat(cat) : null;
  var subName = "";
  if(c){
    var hit = amCatItems(c, ind).filter(function(x){ return x.key === sub; })[0];
    subName = hit ? hit.name : "";
  }
  var ready = !!(window.WOW_BIZ && WOW_BIZ.sosReady);
  /* ⚠️⚠️ 고르신 것이 **필요한 일 칸에 그대로 적혀 있어야** 합니다.
     빈 칸이 뜨면 손님은 골라 놓은 것이 안 넘어왔다고 읽고 거기서
     닫습니다 — 이 저장소가 "업체 상세의 견적 단추가 조건을 안
     넘기더라" 로 겪은 자리입니다. */
  var offNames = (typeof quoteOfferNames === "function") ? quoteOfferNames() : "";
  var svNames  = list.map(amPickLabel).join(" · ");
  var what = subName || svNames || (c ? c.name : "") || offNames;

  return PgHero({
    kicker:"견적 요청",
    h1raw:"한 번만 적으시면<br class=\"br-m\"> 여러 곳에서 답이 옵니다.",
    lead:"고르신 서비스마다 업체를 찾아 연결해 드립니다. 같은 내용을 업체마다 다시 적지 않으셔도 됩니다. 무료입니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w form-wrap">'+
    /* ⚠️⚠️ **지금 어느 단계인지 그 자리에서 말합니다** (2026-10-25
       최종 지시서 §10 — "정보 제공과 실제 상담 가능한 서비스를 고객이
       구분할 수 있는가 · 아직 운영하지 않는 서비스를 운영 중인 것처럼
       표현하지 않는가").

       ⚠️ 이 줄이 **한 번 사라졌습니다.** 전에는 메인의
       `MainProviders()` · `MainLast()` 가 "지금은 요청을 받아 업체를
       찾아 드리는 단계입니다" 를 내고 있었는데, 2026-10-22 개편으로 그
       구간들이 `home-retired.js` 로 내려가면서 **손님이 보는 자리에서
       통째로 빠졌습니다** (띄워서 재 보고 알았습니다 — 열한 화면 가운데
       그 말을 하는 곳이 세 곳뿐이었고 `/quote` 는 없었습니다).

       ⚠️⚠️ **세는 값입니다.** 손으로 "아직 없습니다" 를 적으면 제휴가
       붙은 날에도 그대로 남습니다 — 업체를 등록하시면 **코드를 한 줄도
       안 고치고** 아래 문장이 바뀝니다 (이 저장소가 CLAUDE.md 의
       "아직 안 된 것" 표에서 겪은 자리). */
    QuoteStage()+
    (ready ? "" :
      '<div class="notice-bad"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
        /* ⚠️ 2026-10-31 — 전에는 `/providers` · `/content` 로 보냈는데
           그 둘은 지금 308 로 `/` 에 갑니다. 지금 실제로 열리는 곳으로
           보냅니다. ⚠️ **문장 한가운데 링크를 박지 않습니다** — 높이가
           글줄 높이(19px)라 누르기 어렵습니다 (누름 40px 이상). */
        '<p>접수처 설정이 끝나면 바로 열립니다. 그동안에는 '+
        '아래에서 지금 되는 것을 보실 수 있습니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-o" href="/sell">내 폰 팔기</a>'+
          '<a class="btn btn-o" href="/guide">이용 안내</a>'+
        '</div></div>')+
    QuoteOfferBand()+

    '<form id="q-f" onsubmit="return quoteSend(event)">'+
      QuoteSvcStep(list, side)+

      /* ── STEP 02 지역 (§5-1 2단계) ───────────────────────────── */
      '<div class="qs">'+
        QStepHd("02", "어느 지역이신가요?",
          "지역이 업체를 고르는 첫 번째 조건입니다.")+
        '<div class="f-2">'+
          '<div class="f-r"><label for="q-reg">지역 <b>*</b></label>'+
            RegionSelect("q-reg", reg, "", "지역을 골라 주세요", true)+'</div>'+
          '<div class="f-r"><label for="q-gu">시 · 군 · 구</label>'+
            '<input id="q-gu" autocomplete="address-level2" placeholder="예: 안양시"></div>'+
        '</div>'+
        '<div class="f-2">'+
          '<div class="f-r"><label for="q-ind">업종</label>'+IndustrySelect("q-ind", ind)+'</div>'+
          '<div class="f-r"><label for="q-side">무엇 때문에 <b>*</b></label>'+
            '<select class="sel" id="q-side">'+
              /* ⚠⚠ **운영이 없었습니다.** DB 는 처음부터 `ops` 를
                 받는데(0001 — start | ops | transfer | close) 화면에
                 그 선택지가 없어서, 운영 중인 사장님이 "창업" 을 고른
                 채로 접수됐습니다 — 배정하는 직원이 그것을 보고
                 **창업 업체**를 찾습니다. 받아 놓고 안 쓰던 값입니다.
                 ⚠️ 기본값은 그대로 창업입니다 (`side` 가 없을 때). */
              /* ⚠️⚠️ **넷을 손으로 적지 마세요.** `ops` 가 빠져서 운영
                 중인 사장님이 "창업" 으로 접수되는 사고를 고치고도
                 `transfer` 가 **같은 자리에 그대로** 남아 있었습니다 —
                 지금은 `AM_SIDES`(deal.js)를 세어서 냅니다. */
              /* ⚠️⚠️ **2026-10-31 로 거르는 쪽이 뒤집혔습니다.** 전에는
                 `!s.pw`(창업 · 폐업 넷)를 냈습니다 — 그 전제가 "이 화면은
                 창업 · 폐업 신청" 이었는데, 그 157개가 지금 308 로 `/` 에
                 가므로 **그 넷은 배정할 곳이 없습니다.** 지금은 중고폰
                 쪽(`pw:true`)만 냅니다.
                 ⚠️ 되살리시려면 `!s.pw` 로 되돌리고 `AM_SIDES` 의 `pick`
                 넷이 다시 열리는지 같이 보세요. */
              /* ⚠️⚠️ **주소가 들고 온 쪽은 걸러도 냅니다** (`s.key === side`).
                 거르기만 하면 맞는 칸이 없어서 브라우저가 **첫 칸을
                 고르고**, 적어 보내신 쪽이 조용히 다른 값으로 바뀝니다 —
                 `ops` · `transfer` · 중고폰 둘 · `repair` · `shop` 으로
                 여섯 번 겪은 그 사고를 거르개로 다시 만드는 것입니다.
                 주소가 말한 쪽은 **무엇이든 그대로** 저장돼야 합니다. */
              (window.AM_SIDES || []).filter(function(s){
                return s.pw || s.key === side;
              }).map(function(s){
                return '<option value="'+esc(s.key)+'"'+
                  ((side === s.key || (!side && s.key === "shop")) ? " selected" : "")+
                  '>'+esc(s.say)+'</option>';
              }).join("")+
            '</select></div>'+
        '</div>'+
      '</div>'+

      /* ── STEP 03 연락처와 필요한 정보 (§5-1 3단계 · §5-2) ─────── */
      '<div class="qs">'+
        QStepHd("03", "연락처와 필요한 내용을 적어 주세요",
          "별표(*)만 필수입니다. 나머지는 아시는 만큼만 적어 주셔도 됩니다.")+
        '<div class="f-2">'+
          '<div class="f-r"><label for="q-name">성함 <b>*</b></label>'+
            '<input id="q-name" required autocomplete="name"></div>'+
          /* ⚠️ `autocomplete` — 폰으로 적는 분들이라 한 번에 채워지는 것이
             크게 다릅니다. 표준 값이라야 효과가 있습니다. */
          '<div class="f-r"><label for="q-tel">연락처 <b>*</b></label>'+
            '<input id="q-tel" type="tel" required autocomplete="tel" '+
              'inputmode="tel" placeholder="010-0000-0000"></div>'+
        '</div>'+

        '<div class="f-r"><label for="q-what">필요한 일 <b>*</b></label>'+
          '<input id="q-what" required value="'+esc(what)+'" '+
            'placeholder="예: 카페 인테리어 / 주방 철거 / POS 설치"></div>'+

        '<div class="f-2">'+
          '<div class="f-r"><label for="q-py">평수</label>'+
            '<input id="q-py" inputmode="numeric" value="'+esc(py||"")+'" '+
              'placeholder="예: 30"></div>'+
          '<div class="f-r"><label for="q-bud">예산</label>'+
            '<input id="q-bud" value="'+esc(bud||"")+'" '+
              'placeholder="예: 5,000만원 / 아직 모름"></div>'+
        '</div>'+
        '<div class="f-r"><label for="q-when">희망 일정</label>'+
          '<input id="q-when" value="'+esc(when||"")+'" '+
            'placeholder="예: 2027년 2월 오픈 / 이번 달 안"></div>'+

        '<div class="f-r"><label for="q-q">자세한 내용 <b>*</b></label>'+
          '<textarea id="q-q" rows="6" required '+
            'placeholder="지금 상황과 필요한 것을 그대로 적어 주세요. 양식이 없어도 됩니다."></textarea></div>'+
        /* ⚠️ 파일을 받아 둘 곳이 없어서 **주소로 받습니다.** 첨부 칸을
           만들어 놓고 버리는 것보다 낫습니다. */
        '<div class="f-r"><label for="q-img">사진 · 도면 주소</label>'+
          '<input id="q-img" placeholder="공유 링크가 있으면 붙여 주세요 (선택)"></div>'+

        /* §5-3 — 고르신 서비스마다 그 서비스에서만 쓰는 것을 묻습니다.
           ⚠️ 칸이 없는 서비스면 그 묶음째 빠집니다 (절대 규칙 2). */
        SvcAskBand(list)+

        QuoteDraftBox()+
      '</div>'+

      /* ── STEP 04 확인하고 보내기 (§5-1 4단계) ─────────────────── */
      '<div class="qs">'+
        QStepHd("04", "확인하고 보내기", "")+
        AgreeBox("q-ag","성함 · 연락처 · 업종 · 지역 · 평수 · 예산 · 일정 · 적어 주신 내용",
                 "견적 요청 접수와 상담 안내","접수일로부터 1년")+
        QNotifyBox()+
        '<div id="q-fail"></div>'+
        '<button class="btn btn-b btn-lg btn-full" type="submit"'+(ready?"":" disabled")+'>'+
          '<span id="q-go-t">'+(list.length
            ? "선택한 "+list.length+"개 서비스 견적 신청하기"
            : "견적 신청하기")+'</span>'+icon("arrow",18)+'</button>'+
        /* ⚠️⚠️ **하지 않는 일을 했다고 적지 마세요** (절대 규칙 5).
           `amSend()` 는 보낸 뒤 **아무것도 저장하지 않습니다** — 폼을
           비우기만 합니다. 아래 비교표는 사장님이 "제안 직접 적어두기" 로
           손수 적는 자리입니다. */
        '<p class="note note-mid">업체에서 견적을 받으시면 <b>아래 표에 적어 '+
          '두세요.</b> 금액 · 기간 · 포함 범위를 나란히 놓고 보실 수 있습니다. '+
          '이 브라우저에만 남고 서버로 보내지 않습니다.</p>'+
      '</div>'+
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
/* ── 진행 안내 받기 (2026-10-22 오픈 전 전수검사 P2 ⑱) ───────────
   > 감사 보고서 §5 ⑱ — "고객에게 **상태 변경 알림**. 광고성이 섞이기
   >  쉬워 제50조 사전 수신동의를 받는 자리부터 필요합니다."

   ⚠️⚠️ **필수가 아닙니다.** 접수 동의(제15조)와 **다른 칸**이고, 안
   고르셔도 접수는 그대로 됩니다 — 한 상자에 묶으면 "이것도 켜야
   접수되나" 가 되고, 그렇게 받은 동의는 받은 것이 아닙니다.
   ⚠️⚠️ **광고를 섞지 않습니다.** 배정 · 견적 도착까지이고, 권유를 한
   줄이라도 넣으면 그때부터 광고성 정보입니다 (정보통신망법 제50조).
   ⚠️ 끄는 길을 **메일 안에** 적습니다 — 로그인 없이 들어오는 접수라
   수신거부 토큰이 없고, 지금 규모에서는 회신이 가장 정직합니다.
   ⚠️⚠️ **"몇 시간 안에" 를 적지 마세요** — 업체 회신 시점은 우리가
   지킬 수 있는 약속이 아닙니다 (약관 제8조). */
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
  /* ⚠️ **화면에서도 막습니다.** `required` 는 폼 제출을 막아 주지만
     이 함수를 직접 부르면 그냥 지나갑니다 — 서버가 400 을 돌려줘도
     그때는 이미 보낸 것입니다.
     ⚠️ **지역**은 딱지에 `*` 가 붙어 있는데 전에 안 막고 있었습니다.
     빈 채로 들어오면 어느 지역 업체에 돌릴지를 못 정합니다 — 지역이
     매칭의 첫 번째 조건입니다. */
  var need = [["q-what","필요한 일"],["q-reg","지역"],["q-q","자세한 내용"],
              ["q-name","성함"],["q-tel","연락처"]];
  for(var i=0;i<need.length;i++){
    if(!$(need[i][0]).value.trim()){
      toast(need[i][1]+"을(를) 적어 주세요");
      /* §9-4 — 빠뜨린 칸으로 **데려다 놓습니다**. 어디가 빈지 찾아
         올려다보게 하면 거기서 닫습니다. */
      $(need[i][0]).focus();
      $(need[i][0]).scrollIntoView({ block:"center" });
      return false; }
  }
  /* §8 — 잘못된 연락처를 막습니다. ⚠️ 숫자만 남겨 **9~11자리**까지
     받습니다 (지역번호 둘째자리 02-xxx-xxxx 가 9자리). 꼴을 더 좁게
     잡으면 멀쩡한 번호를 거절합니다. */
  var tel = $("q-tel").value.replace(/[^0-9]/g, "");
  if(tel.length < 9 || tel.length > 11){
    toast("연락처를 다시 확인해 주세요");
    $("q-tel").focus(); $("q-tel").scrollIntoView({ block:"center" });
    return false;
  }

  var list = quoteServices();
  var ind = $("q-ind").value, reg = $("q-reg").value;
  var body = {
    kind: "quote",
    name:  $("q-name").value.trim(),
    tel:   $("q-tel").value.trim(),
    region: reg ? amRegionName(reg) : "",
    /* ⚠️ `service` 는 옛 칸입니다 — 서버가 `cat` 을 먼저 봅니다 */
    service: "", serviceName: $("q-what").value.trim(),
    side:  $("q-side").value,
    cat:   list.length ? list[0].id : (nowQS("c") || ""),
    industry: ind,
    gu:    $("q-gu").value.trim(),
    q:      $("q-q").value.trim(),
    budget: $("q-bud").value.trim(),
    wantAt: $("q-when").value.trim(),
    /* ⚠️⚠️ **서비스 항목** (§6 QuoteRequestItem). 공통 칸은 한 번만
       적고, 서비스마다 다른 답은 여기 `detail` 로 따로 갑니다 —
       `detail`(공통)은 스물까지라 여기에 섞으면 뒤쪽이 조용히
       사라집니다. 관리자는 항목마다 다른 업체를 배정합니다. */
    items: quoteItems(list),
    /* §8 "재시도 요청의 중복 접수를 방지하기 위한 멱등성 처리"
       ⚠️⚠️ **한 번 적은 신청서에 하나**입니다 — 다시 보내기를 눌러도
       같은 값이라 서버가 같은 접수로 알아봅니다. 보내기가 성공하면
       비웁니다 (다음 신청은 새 값이라야 합니다).
       ⚠️ `Math.random()` 을 쓰지 않습니다 — 예측됩니다. */
    idem: quoteIdem(),
    /* ⚠️⚠️ 공통 여섯 + 신청 상품. `api/quote.js` 가 **스물까지** 읽습니다. */
    detail: amDropEmpty({
      /* ⚠️⚠️ **둘로 가르지 마세요.** 전에 "close 가 아니면 창업" 이라
         적혀 있어서, 운영 · 양도양수 접수가 슬랙 글에 **"창업 · 시작"**
         으로 나갔습니다 — 받아 보는 직원이 그것을 보고 창업 업체를
         찾습니다. 이름은 `AM_SIDES` 한 곳입니다. */
      "상황":  amSideName($("q-side").value),
      "업종":  ind ? amIndustryName(ind) : "",
      "시군구": $("q-gu").value.trim(),
      "평수":  $("q-py").value.trim(),
      "일정":  $("q-when").value.trim(),
      "사진":  $("q-img").value.trim(),
      /* ⚠️⚠️ 고르신 서비스는 **이름으로 한 줄** 더 적습니다. 받아 보는
         사람이 슬랙 글만 보고 바로 알아야 해서입니다 — 기계가 읽는
         것은 위의 `items` 이고 둘은 같은 것을 가리킵니다. */
      "신청 서비스": list.map(amPickLabel).join(" · "),
      "신청 상품": quoteOfferNames()
    }),
    agree: true,
    /* ⑱ 진행 안내 (2026-10-22 P2) — ⚠️⚠️ **선택**입니다. 안 고르시면
       `false` 가 그대로 가고 서버가 꺼진 채로 저장합니다 (fail-closed).
       ⚠️ 칸이 없는 화면에서도 터지지 않게 `$()` 를 바로 안 믿습니다. */
    notify: !!(document.getElementById("q-nt") &&
               document.getElementById("q-nt").checked)
  };
  return amSend("q-fail", body, "quoteSend", quoteAfterSend);
};

/* 멱등 열쇠 — 만드는 규칙은 `amIdem()` **한 곳**입니다
   (`js/components/base.js`). ⚠️⚠️ **여기 또 적지 마세요** — 2026-10-26 에
   `/sell` 도 열쇠가 필요해지면서 같은 열다섯 줄이 두 벌이 될 자리였고,
   이 저장소는 같은 규칙을 두 곳에 적어 어긋난 사고를 여러 번 겪었습니다.
   ⚠️ `ns` 가 `"quote"` 인 까닭 — `/sell` 과 **다른 열쇠**라야 합니다.
   하나로 쓰면 견적을 보내고 매물을 내놓으러 가신 분이 같은 열쇠를 들고
   가서, 서버가 "같은 신청서를 다시 보냈다" 로 보고 **먼저 받은
   접수번호를 돌려주고 끝냅니다** (매물이 접수되지 않는데 화면은
   성공으로 보입니다). */
function quoteIdem(){ return amIdem("quote"); }
/* 접수가 끝나면 열쇠를 비웁니다 — 다음 신청은 **다른 신청**입니다 */
window.quoteIdemClear = function(){ amIdemClear("quote"); };

/* 접수가 **성공한 뒤에만** 치웁니다 (§4-3 "최종 제출 후 중복 임시
   신청 정리").
   ⚠️⚠️ 실패했을 때는 **하나도 안 치웁니다** — 적으신 것과 고르신 것을
   들고 다시 누르실 수 있어야 합니다 (§8 "실패 시 기존 입력값 보존").
   ⚠️ 화면을 다시 그리지 않습니다 — 성공 안내와 접수번호가 그 자리에
   떠 있어야 합니다. 대신 고르신 것이 비었음을 띠에만 알립니다. */
window.quoteAfterSend = function(){
  quoteIdemClear();
  amDel(DKEY);
  if(typeof amPickSet === "function") amPickSet([]);
  if(typeof pickPaint === "function") pickPaint();
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
window.amSend = function(failId, body, again, done){
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
      if(!x.ok){
        /* ⚠️ 서버가 **사람 말로** 적어 준 것은 그대로 보여 줍니다
           ("성함과 연락처를 적어 주세요"). 아래 catch 가 기술 문구와
           가르려고 표시를 답니다 (2026-10-25 §4). */
        const err = new Error((x.j && x.j.error) || "보내지 못했습니다");
        err.fromServer = true;
        throw err;
      }
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
      /* §7-3 — ⚠️⚠️ **접수한 뒤에** 사진 칸이 붙습니다. 번호가
         없으면(저장 안 된 접수) · 버킷이 설정되기 전이면 **아예 안
         그려집니다** (js/photo.js 머리말). ⚠️ 연락처는 **보내신 몸통
         에서** 가져옵니다 — 폼은 바로 아래에서 비워집니다. */
      /* ⚠️⚠️ **업체 입점(partner)에는 안 붙입니다.** 사진 자리를 주는
         문은 `claim_photo_slot()` 이고 그것은 **신청(`request`)** 의
         번호와 연락처만 봅니다 — 입점 신청은 다른 표(`provider_apply` ·
         0016)라 **올릴 때마다 거절당합니다.** 2026-10-25 에 입점 신청도
         접수번호를 받게 되면서 이 줄이 그대로 켜질 자리였습니다
         (올리는 척하는 칸은 §30-7 이고 절대 규칙 5 입니다). */
      if(no && box && (!body || body.kind !== "partner") &&
         typeof amPhotoAfter === "function")
        amPhotoAfter(box, no, (body && body.tel) || "");
      toast(dup ? "이미 접수되었습니다" : "접수되었습니다");
      var f = box && box.closest("form"); if(f) f.reset();
      /* §4-3 "최종 제출 후 중복 임시 신청 정리" — 보낸 뒤에 치웁니다.
         ⚠️ **보내기 전에 치우면 안 됩니다** — 실패했을 때 적으신 것과
         고르신 것이 같이 날아갑니다. */
      if(typeof done === "function"){ try{ done(); }catch(e){} }
      if(btn){ btn.disabled = false; btn.textContent = "다시 보내기"; }
    })
    .catch(function(e){
      clearTimeout(late);
      /* 끊긴 것인지 서버가 거절한 것인지를 갈라서 말합니다 — 손님이
         무엇을 하셔야 하는지가 다릅니다.
         ⚠️⚠️ **기술 문구를 손님 화면에 찍지 않습니다** (2026-10-25 §4 ·
         절대 규칙 3). `fetch` 가 던지는 것은 "Failed to fetch" · "Load
         failed" 처럼 영어이고, 그걸 그대로 내면 사장님은 무엇을 하셔야
         하는지 알 수 없습니다 — 서버가 **사람 말로** 적어 준 것만
         그대로 내고, 나머지는 쉬운 한 줄로 바꿉니다. */
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

  /* ── 대체 연락 수단 (2026-10-25 §4) ────────────────────────────
     ⚠️⚠️ **전에는 "복사" 단추만 있고 보낼 곳이 없었습니다.** 길게
     적어 주신 사장님이 복사만 하고 막다른 길에 서는 자리였습니다.
     ⚠️⚠️ **등록된 연락처가 있을 때만 냅니다** — 없는 번호를 지어내면
     그게 더 나쁩니다 (절대 규칙 1 · 2 · §4 "등록되지 않은 연락처를
     임의로 생성하지 않는다"). 지금 `js/data/site.js` 의 `phone` ·
     `email` 이 비어 있어서 **이 줄이 아예 안 나옵니다** — 대표님이
     채우시는 날 코드를 한 줄도 안 고치고 나옵니다.
     ⚠️ `tel:` 에는 **숫자만** 넣습니다 (하이픈이 들어가면 기기에 따라
     안 걸립니다 · `/admin` 과 같은 규칙). */
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

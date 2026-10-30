/* ════════════════════════════════════════════════════════════════════
   PHONEWAY 화면 다섯 (2026-10-29)
     /sell   내 폰 팔기 — 다섯 걸음
     /shop   중고폰 구매 — ⚠️ 상품 0건이면 0건이라고 말합니다
     /bid    최고가 경쟁입찰 안내
     /track  판매 진행 조회 — ⚠️ 접수번호 + 연락처 **둘 다**
     /guide  이용 안내

   ⚠️⚠️ **지어낸 데이터가 한 글자도 없습니다.** 업체 0곳 · 상품 0건 ·
   매입 기준가 0건이라 화면이 그대로 0 이라고 말합니다 (절대 규칙 1).
   ⚠️⚠️ **새 API 를 만들지 않았습니다.** 접수는 이미 있는
   `/api/quote` 가 받고, 접수번호 · 중복 · 멱등 · 스팸 판정이 그대로
   돕니다.
   ════════════════════════════════════════════════════════════════════ */

/* 화면 사이에 들고 다니는 값 — ⚠️ 주소(질의문자)에 싣습니다.
   뒤로 가기 · 새로고침 · 링크 공유에 살아남습니다. 성함 · 연락처는
   절대 여기 안 싣습니다 (주소는 기록에 남고 공유됩니다). */
function pwSellQS(){
  return { maker: nowQS("mk")||"", kind: nowQS("kd")||"phone",
           model: nowQS("md")||"", cap: nowQS("cap")||"",
           grade: nowQS("gr")||"",
           more: nowQS("mo")||"" };
}
function pwSellGo(patch){
  var q = pwSellQS(), m = { mk:"maker", kd:"kind", md:"model", cap:"cap", gr:"grade",
                           mo:"more" };
  Object.keys(patch||{}).forEach(function(k){ q[k] = patch[k]; });
  var parts = [];
  Object.keys(m).forEach(function(p){ if(q[m[p]]) parts.push(p+"="+encodeURIComponent(q[m[p]])); });
  /* ⚠️⚠️ **고를 때마다 맨 위로 보내지 않습니다** (2026-10-30 모바일 지시서 §2).
     고른 것 아래에 다음 걸음이 붙는 화면이라, 맨 위로 올라가면 방금 고른
     칸과 다음 걸음을 다시 찾아 내려와야 합니다. */
  go("/sell" + (parts.length ? "?"+parts.join("&") : ""), { keepScroll:true });
}

/* 지금 몇 걸음째인가 — 고르신 것으로 정합니다 (억지로 막지 않습니다) */
function pwSellStep(q){
  /* ⚠️⚠️ **주소에 실린 값이 실제로 있는 것인지까지 봅니다.**
     전에는 `q.grade` 가 비어만 있지 않으면 3단계로 보냈는데,
     `?gr=a` 처럼 **없는 등급**이면(key 는 대문자 S·A·B·C·D)
     `amGrade()` 가 null 을 돌려줘서 접수 글의 **외관 등급이
     통째로 빠집니다** — 에러도 안 나고 화면도 멀쩡합니다.
     링크를 받으셨거나 주소를 손으로 고치면 나는 자리입니다. */
  var md = amModel(q.model);
  if(!md) return 1;
  if(md.caps && md.caps.length && md.caps.indexOf(+q.cap) < 0) return 1;
  if(!amGrade(q.grade)) return 2;
  return 3;
}

function pwSteps(now){
  var S = ["기기 선택","상태 · 등급","견적 · 신청"];
  return '<ol class="pwf-st">'+ S.map(function(s,i){
    var n = i+1, cls = n < now ? " done" : (n === now ? " on" : "");
    return '<li class="'+cls+'"><span>'+n+'</span>'+esc(s)+'</li>';
  }).join("") +'</ol>';
}

/* ⚠️⚠️ **PgHero() 의 칸 이름은 `h1` · `kicker` 입니다** (`h` · `k` 가
   아닙니다 — js/components/ui.js). 처음에 `h:` · `k:` 로 적었더니
   **다섯 화면 전부 제목이 빈 h1** 으로 나갔습니다 — 머리말 자리에
   아무것도 없고 설명만 덩그러니 떠 있었습니다.
   ⚠️⚠️ **에러도 안 나고 검사도 통과했습니다** — "화면마다 h1 이 딱
   하나" 는 **빈 h1 도 하나로 셉니다.** 찍어 보고 알았습니다.
   (전수 점검에 "제목이 비었음" 을 같이 넣었습니다.)
   ⚠️ `lead` 는 PgHero 가 **스스로 esc()** 합니다 — 여기서 또 거치면
   `&amp;` 가 글자로 찍힙니다 (`leadRaw:true` 일 때만 날것입니다). */
/* ─── /sell · 내 폰 팔기 ─────────────────────────────────────── */
function PageSell(){
  var q = pwSellQS(), step = pwSellStep(q);
  return PgHero({
      /* ⚠️ 제목은 아래 네비의 "팔기" 와 짝이고, **실행 단추는 "내 폰 팔기"**
         입니다 (2026-10-30 모바일 지시서 §1) — 둘을 같은 말로 두면 제목과
         단추가 구분이 안 됩니다. */
      kicker:"SELL", h1:"내 폰 팔기",
      lead:"기종과 상태만 고르시면 판매 방법을 바로 보실 수 있습니다. "+
           "가입하지 않으셔도 됩니다."
    })+
    '<section class="sec sec-white"><div class="w pwf">'+
      pwSteps(step)+
      pwSellPick(q)+
      (step >= 2 ? pwSellCond(q) : "")+
      (step >= 3 ? pwSellOffer(q) : "")+
    '</div></section>';
}

/* 빠른 선택 카드 넷 (2026-10-29 사장님 지시서 §2)
   ⚠️⚠️ **로고는 그리지 않고 받은 파일만 씁니다.** 애플 마크 · 삼성
   워드마크는 남의 등록상표이고, 사장님이 직접 "AI 가 임의로 재현한
   부정확한 로고는 쓰지 말 것" 이라고 적으셨습니다 — 지금 쓰는 것은
   사장님이 주시고 **쓸 권리를 확인하신 파일**입니다 (`AM_MAKER_LOGO`).
   그 파일이 없으면 로고 줄이 **통째로 빠집니다** (빈 자리를 안 깝니다).
   ⚠️⚠️ 2026-10-30 — 아이폰 · 갤럭시에도 `lg` 를 **넣었습니다.** 전에는
   임시 사진에 로고가 **박혀 있어서** 비워 두었는데, 정식 사진은 로고가
   한 글자도 없습니다 — 비워 두면 그 두 장만 로고 줄이 없어 글이 50px
   위로 떠서 넷이 따로 놉니다 (찍어 보고 알았습니다).
   ⚠️ 아래 줄(`sub`)의 영문은 **기종을 가리키는 말**입니다 — 고르는 데
   필요한 설명이고 상표를 흉내내는 것이 아닙니다.
   ⚠️⚠️ **넷째 장은 조합을 고르는 카드가 아니라 칩 줄을 펼치는
   단추입니다.** 워치 · 버즈 · 기타 제조사를 한 장에 담으면 고르신
   것과 접수에 실리는 것이 달라집니다. */
var PW_SELL_CARDS = [
  { ph:"dev-iphone", ia:"dev-iphone", lg:"apple",   nm:"아이폰",
    sub:"iPhone",                maker:"apple",   kind:"phone"  },
  { ph:"dev-galaxy", ia:"dev-galaxy", lg:"samsung", nm:"갤럭시",
    sub:"Galaxy",                maker:"samsung", kind:"phone"  },
  { ph:"dev-tablet", ia:"dev-tablet", lg:["apple","samsung"], nm:"태블릿",
    sub:"아이패드 · 갤럭시 탭",     maker:"",        kind:"tablet" },
  { ph:"dev-etc",    ia:"dev-etc",    lg:["apple","samsung"], nm:"기타 기기",
    sub:"워치 · 버즈 · 액세서리",    more:true }
];

/* 카드 한 장 — ⚠️⚠️ **사진이 없어도 그대로 돕니다** (지시서 §6).
   사진이 있으면 사진, 없으면 **직접 그린 기기 아이콘**입니다 — 옅은
   틴트 빈 액자를 깔지 않습니다 (그게 "준비 중" 으로 읽힙니다). */
/* 제조사 로고 줄 — `lg` 는 하나(글자)거나 여럿(배열)입니다.
   ⚠️⚠️ **권한이 확인된 파일이 있는 것만** 그립니다 (`AM_MAKER_LOGO`).
   하나도 없으면 **줄째 안 냅니다** — 빈 자리 · 비슷하게 그린 로고 ·
   글자로 흉내낸 워드마크 전부 안 됩니다 (사장님 지시 · 절대 규칙 2).
   여럿이면 사이에 가는 세로줄을 둡니다 (시안). */
function pwDevLogos(c){
  var M = window.AM_MAKER_LOGO || {};
  var L = [].concat(c.lg || []).map(function(k){ return M[k]; })
    .filter(function(u){ return !!u; });
  if(!L.length) return "";
  return '<span class="dvc-lgs" aria-hidden="true">'+ L.map(function(u){
    return '<img class="dvc-lg" src="'+ esc(u) +'" alt="" width="72" height="24" decoding="async">';
  }).join('<i class="dvc-lgsep"></i>') +'</span>';
}
function pwDevCard(c, on){
  /* ⚠️ `role="radio"` 를 쓰지 않았습니다 — 넷째가 라디오가 아니라
     **펼치개**라, 한 묶음에 역할 둘을 섞으면 읽어 주는 프로그램에
     깨진 라디오그룹으로 들립니다. 누름 단추 + `aria-pressed`(고르개)와
     `aria-expanded`(펼치개)가 각자 맞는 말입니다. */
  var act = c.more ? "pwSellGo({more:'1'})"
          : "pwSellGo({maker:'"+c.maker+"',kind:'"+c.kind+"'," +
            "model:'',cap:'',grade:''})";
  var st  = c.more ? ' aria-expanded="'+(on?"true":"false")+'" aria-controls="pf-chip"'
                   : ' aria-pressed="'+(on?"true":"false")+'"';
  return '<button type="button" class="dvc'+(on?" on":"")+'"'+ st +
    ' onclick="'+act+'">'+
    '<span class="dvc-ph">'+
      (typeof hasPhoto === "function" && hasPhoto(c.ph)
        ? photoBox(c.ph, "dvc-im")
        : iconArt(c.ia, 96))+
    '</span>'+
    '<span class="dvc-tx">'+
      /* ⚠️ 권한이 확인된 파일이 있을 때만 그립니다 — 없으면 **칸째**
         안 냅니다 (빈 액자 금지 · 절대 규칙 2). */
      /* ⚠️ 로고가 흰색이라 이 흰 카드에서는 안 그립니다 (메인만) */
      '<b class="dvc-nm">'+esc(c.nm)+'</b>'+
      '<span class="dvc-s">'+esc(c.sub)+'</span>'+
    '</span>'+
  '</button>';
}

/* STEP 1 — 기기 선택
   ⚠️⚠️ **고르개가 둘입니다** — 위의 큰 카드 넷이 빠른 선택이고, 아래
   칩 두 줄이 전부입니다 (`AM_PICK_QUICK` 위에 묶음을 둔 것과 같은
   꼴입니다). 카드만 두면 **워치 · 버즈 · 기타 제조사로 가는 길이
   사라집니다** — 네 장으로 덮이지 않는 조합이 그만큼 있습니다.
   ⚠️ 그래서 칩 줄은 `기타 기기` 를 누르셨을 때 펼치고, **이미 워치 ·
   버즈 · 기타 제조사를 고르신 상태면 저절로 펼칩니다** — 안 펼치면
   고르신 것이 화면에 아예 안 보입니다. */
function pwSellPick(q){
  var kinds = window.AM_DEVICE_KINDS || [], makers = window.AM_MAKERS || [];
  var models = (q.maker || q.kind) ? amModelsOf(q.maker, q.kind) : [];
  var md = q.model ? amModel(q.model) : null;
  var more = q.more === "1" || q.kind === "watch" || q.kind === "buds" ||
             q.maker === "etc";
  return '<div class="pwf-s" id="pf-1">'+
    '<h2 class="pwf-h"><b>01</b> 어떤 기기를 판매하시나요?</h2>'+
    /* ⚠️ 카드 넷이 덮는 것은 apple/phone · samsung/phone · tablet
       셋뿐입니다 — 나머지는 아래 칩 줄에만 있습니다. */
    '<div class="dvc-g">'+ PW_SELL_CARDS.map(function(c){
      var on = c.more ? more
                      : (q.kind === c.kind && (q.maker||"") === (c.maker||""));
      return pwDevCard(c, on);
    }).join("") +'</div>'+
    (more ?
      '<div id="pf-chip">'+
      '<div class="pwf-r"><span class="pwf-l">기기 종류</span>'+
        '<div class="chip-g">'+ kinds.map(function(k){
          return '<button type="button" class="chip'+(q.kind===k.key?" on":"")+'" aria-pressed="'+((q.kind===k.key)?"true":"false")+'" '+
            'onclick="pwSellGo({kind:\''+k.key+'\',model:\'\',cap:\'\',grade:\'\'})">'+
            esc(k.name)+'</button>'; }).join("") +'</div></div>'+
      '<div class="pwf-r"><span class="pwf-l">제조사</span>'+
        '<div class="chip-g">'+ makers.map(function(k){
          return '<button type="button" class="chip'+(q.maker===k.key?" on":"")+'" aria-pressed="'+((q.maker===k.key)?"true":"false")+'" '+
            'onclick="pwSellGo({maker:\''+k.key+'\',model:\'\',cap:\'\',grade:\'\'})">'+
            esc(k.name)+'</button>'; }).join("") +'</div></div>'+
      '</div>'
      : "")+
    (q.maker || q.kind ?
      '<div class="pwf-r"><span class="pwf-l">모델</span>'+
        (models.length ?
          '<select class="sel" id="pf-md" onchange="pwSellGo({model:this.value,cap:\'\',grade:\'\'})">'+
            '<option value="">모델을 골라 주세요</option>'+
            models.map(function(m){
              return '<option value="'+esc(m.key)+'"'+(q.model===m.key?" selected":"")+'>'+
                esc(m.name)+ (m.year ? ' ('+m.year+')' : '') +'</option>';
            }).join("") +'</select>'
          : '<p class="pwf-n">그 조합에는 아직 등록된 모델이 없습니다. '+
            '제조사를 <b>기타</b>로 고르시면 적어 주신 내용을 보고 사람이 확인합니다.</p>')+
      '</div>' : "")+
    (md && md.caps && md.caps.length ?
      '<div class="pwf-r"><span class="pwf-l">저장 용량</span><div class="chip-g">'+
        md.caps.map(function(c){
          var t = c >= 1024 ? (c/1024)+"TB" : c+"GB";
          return '<button type="button" class="chip'+(String(q.cap)===String(c)?" on":"")+'" aria-pressed="'+((String(q.cap)===String(c))?"true":"false")+'" '+
            'onclick="pwSellGo({cap:\''+c+'\',grade:\'\'})">'+t+'</button>';
        }).join("") +'</div></div>' : "")+
  '</div>';
}

/* STEP 2 — 상태 · 등급
   ⚠️ 고르신 것은 **접수 글에 그대로 실립니다** — 받아 놓고 안 읽는
   칸을 만들지 않습니다. */
function pwSellCond(q){
  return '<div class="pwf-s" id="pf-2">'+
    '<h2 class="pwf-h"><b>02</b> 기기 상태를 알려 주세요</h2>'+
    '<div class="pwf-r"><span class="pwf-l">외관 등급</span><div class="pwf-gr">'+
      (window.AM_GRADES||[]).map(function(g){
        return '<button type="button" class="pwf-g'+(q.grade===g.key?" on":"")+'" aria-pressed="'+((q.grade===g.key)?"true":"false")+'" '+
          'onclick="pwSellGo({grade:\''+g.key+'\'})">'+
          '<b>'+esc(g.name)+'</b><span>'+esc(g.lead)+'</span></button>';
      }).join("") +'</div></div>'+
    '<div class="pwf-q">'+ (window.AM_COND||[]).map(function(c){
      return '<div class="pwf-r"><span class="pwf-l">'+esc(c.q)+'</span>'+
        '<select class="sel" id="pf-c-'+esc(c.key)+'">'+
          c.opt.map(function(o){
            return '<option value="'+esc(o[0])+'">'+esc(o[1])+'</option>'; }).join("")+
        '</select></div>';
    }).join("") +'</div>'+
    '<p class="pwf-n">⚠️ 적어 주신 상태를 기준으로 안내드리고, '+
      '<b>기기를 받아 검수한 뒤 최종 금액을 다시 알려 드립니다.</b> '+
      '동의하신 뒤에 정산합니다.</p>'+
  '</div>';
}

/* STEP 3 — 견적 · 신청
   ⚠️⚠️ **매입 기준가가 없으면 직접 매입 예상가를 아예 안 냅니다.**
   "준비 중" 자리표시자를 찍지 않고 경쟁입찰을 냅니다 (절대 규칙 2 · 5). */
function pwSellOffer(q){
  var md = amModel(q.model), g = amGrade(q.grade);
  var price = amBuyReady() ? amBuyPrice(q.model, q.cap ? +q.cap : 0, q.grade) : null;
  var nPv = (window.AM_PROVIDERS || []).length;
  var cap = q.cap ? (+q.cap >= 1024 ? (+q.cap/1024)+"TB" : q.cap+"GB") : "";
  return '<div class="pwf-s" id="pf-3">'+
    '<h2 class="pwf-h"><b>03</b> 판매 방법을 고르세요</h2>'+
    '<p class="pwf-sum">'+ esc(md ? md.name : "") + (cap ? " · "+esc(cap) : "") +
      (g ? " · "+esc(g.name) : "") +'</p>'+
    '<div class="pwf-of">'+
      /* ① 직접 매입 */
      '<article class="pwf-o">'+
        '<span class="pwf-o-k">'+esc(amBrand())+' 직접 매입</span>'+
        (price != null
          ? '<b class="pwf-o-p">'+ price.toLocaleString() +'원</b>'+
            '<p class="pwf-n">적어 주신 상태를 기준으로 한 <b>예상 금액</b>입니다. '+
              '검수 뒤 달라질 수 있습니다.</p>'
          : '<p class="pwf-o-n">이 기종의 매입 기준가를 <b>아직 정하지 '+
            '않았습니다.</b> 지금은 아래 경쟁입찰로 신청하시면 업체 견적을 '+
            '받아 보실 수 있습니다.</p>')+
        (price != null
          ? '<button type="button" class="btn btn-pw" onclick="pwSellSend(\'direct\')">'+
            '이 금액으로 신청하기</button>' : "")+
      '</article>'+
      /* ② 경쟁입찰 */
      '<article class="pwf-o b">'+
        '<span class="pwf-o-k">전국 업체 경쟁입찰</span>'+
        (nPv
          ? '<p class="pwf-o-n">지금 <b>'+nPv+'곳</b>이 참여하고 있습니다. '+
            '신청하시면 업체가 기기 조건을 보고 견적을 냅니다.</p>'
          : '<p class="pwf-o-n">⚠️ <b>지금 입점업체를 모집하고 있습니다.</b> '+
            '신청은 받아 두고, 참여 업체가 생기는 대로 견적을 모아 '+
            '알려 드립니다 — 없는 업체를 미리 보여 드리지 않습니다.</p>')+
        '<button type="button" class="btn btn-pw-o" onclick="pwSellSend(\'bid\')">'+
          '경쟁입찰로 신청하기</button>'+
      '</article>'+
    '</div>'+
    '<div id="pf-form" hidden>'+ pwSellForm() +'</div>'+
  '</div>';
}

function pwSellForm(){
  return '<div class="pwf-fm">'+
    '<h3 class="pwf-h2">연락받으실 곳</h3>'+
    '<div class="f-r"><label for="pf-name">성함 <em>*</em></label>'+
      '<input id="pf-name" type="text" autocomplete="name" required></div>'+
    '<div class="f-r"><label for="pf-tel">연락처 <em>*</em></label>'+
      '<input id="pf-tel" type="tel" autocomplete="tel" inputmode="tel" required '+
      'placeholder="010-0000-0000"></div>'+
    '<div class="f-r"><label for="pf-memo">더 알려 주실 것 <em>(선택)</em></label>'+
      '<textarea id="pf-memo" rows="3" placeholder="구성품 · 수리 이력 · 사진 주소 등"></textarea></div>'+
    (typeof AgreeBox === "function" ? AgreeBox("pf-agree") : "")+
    '<button type="button" class="btn btn-pw pwf-send" id="pf-send" '+
      'onclick="pwSellSubmit()">내 폰 팔기</button>'+
    '<p class="pwf-n" id="pf-msg"></p>'+
  '</div>';
}

/* 고르신 판매 방법 — ⚠️ 화면 밖으로 안 나갑니다 (접수 글에만) */
var PW_WAY = "";
window.pwSellSend = function(way){
  PW_WAY = way;
  var f = document.getElementById("pf-form");
  if(f){ f.hidden = false; f.scrollIntoView({ block:"start", behavior:"smooth" }); }
};

window.pwSellSubmit = function(){
  var q = pwSellQS(), md = amModel(q.model), g = amGrade(q.grade);
  var $ = function(id){ return document.getElementById(id); };
  var name = ($("pf-name")||{}).value || "", tel = ($("pf-tel")||{}).value || "";
  if(!name.trim()){ toast("성함을 적어 주세요"); return; }
  /* ⚠️ required 는 폼 제출만 막습니다 — 여기서 한 번 더 봅니다 */
  if(String(tel).replace(/[^0-9]/g,"").length < 9){ toast("연락처를 다시 확인해 주세요"); return; }
  var ag = $("pf-agree");
  if(ag && !ag.checked){ toast("개인정보 수집 · 이용에 동의해 주세요"); return; }

  var cap = q.cap ? (+q.cap >= 1024 ? (+q.cap/1024)+"TB" : q.cap+"GB") : "";
  var det = { "판매 방법": PW_WAY === "direct" ? "직접 매입" : "경쟁입찰",
              "기기": md ? md.name : "", "저장 용량": cap,
              "외관 등급": g ? g.name : "" };
  (window.AM_COND||[]).forEach(function(c){
    var el = $("pf-c-"+c.key); if(!el) return;
    var o = c.opt.filter(function(x){ return x[0] === el.value; })[0];
    if(o) det[c.q] = o[1];
  });

  var btn = $("pf-send"), msg = $("pf-msg");
  if(btn){ btn.disabled = true; btn.textContent = "보내는 중…"; }
  var ctl = new AbortController();
  var t = setTimeout(function(){ ctl.abort(); }, 20000);
  fetch("/api/quote", {
    method:"POST", headers:{ "content-type":"application/json" },
    signal: ctl.signal,
    body: JSON.stringify({
      kind:"quote", name:name.trim(), tel:tel.trim(),
      /* ⚠️⚠️ **`side` 를 반드시 보냅니다.** 안 보내면 `api/quote.js` 가
         기본값 `"start"` 를 박아서, 중고폰 매입 신청이 **"창업"
         건으로** 저장되고 직원이 창업 업체를 찾습니다 (`AM_SIDES` 주석). */
      side: (PW_WAY === "direct" ? "buyin" : "bid"),
      serviceName:"중고폰 매입 — " + (md ? md.name : ""),
      agree:true, idem:(window.amIdem ? amIdem() : ""),
      detail: (window.amDropEmpty ? amDropEmpty(det) : det)
    })
  }).then(function(r){ return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
    .then(function(x){
      clearTimeout(t);
      if(!x.ok) throw new Error((x.j && x.j.say) || "보내지 못했습니다");
      /* ⚠️⚠️ 접수번호는 **실제로 저장된 뒤에만** 옵니다. 없으면 그 줄째
         뺍니다 — 번호를 내주고 저장을 안 하면 그 번호로 물어보셔도
         아무것도 없습니다 (절대 규칙 5). */
      var no = x.j && x.j.no;
      var f = $("pf-form");
      if(f) f.innerHTML = '<div class="pwf-ok"><b>신청이 접수되었습니다.</b>'+
        (no ? '<p>접수번호 <code>'+esc(no)+'</code> — 진행 조회에서 쓰실 수 있습니다.</p>' : '')+
        '<p>확인한 뒤 연락드리겠습니다. ⚠️ 회신 시점을 약속드리지는 않습니다.</p>'+
        '<a class="btn btn-pw-o" href="/track">판매 진행 조회</a></div>';
    })
    .catch(function(e){
      clearTimeout(t);
      if(btn){ btn.disabled = false; btn.textContent = "내 폰 팔기"; }
      if(msg) msg.textContent = "⚠️ " + (e && e.name === "AbortError"
        ? "연결이 끊겼습니다. 적으신 내용은 그대로 있습니다 — 다시 눌러 주세요."
        : (e && e.message) || "보내지 못했습니다. 잠시 뒤 다시 눌러 주세요.");
    });
};

/* ─── /shop · 중고폰 구매 ─────────────────────────────────────
   ⚠️⚠️ **실제 상품과 예시를 한 줄에 섞지 않습니다** (shop.js).
   실제 상품이 한 건이라도 생기면 예시가 저절로 사라집니다. */
function shopQS(){
  return { kind:nowQS("kd")||"", maker:nowQS("mk")||"", grade:nowQS("gr")||"",
           price:nowQS("pr")||"", q:nowQS("q")||"" };
}
/* 거르개 한 칸을 바꾸고 나머지는 그대로 — ⚠️ 주소에 전부 싣습니다.
   한 칸만 싣고 나머지를 버리면 손님이 자기가 끈 줄 모릅니다.
   ⚠️⚠️ **`patch` 의 열쇠는 긴 이름입니다** (`kind` · `maker` · `grade` ·
   `price` · `q`). 짧은 이름(`kd`)으로 받게 적었다가 **칩이 전부 죽은
   링크**가 됐습니다 — `shopQS()` 가 긴 이름으로 들고 있어서
   `f["kd"]=...` 가 아무도 안 읽는 칸을 채웠고, 주소에는 한 글자도
   안 실렸습니다. 에러도 안 나고 화면도 멀쩡했습니다 (전수 점검의
   "거르개가 주소를 안 바꿉니다" 가 잡았습니다). */
var SHOP_QK = { kd:"kind", mk:"maker", gr:"grade", pr:"price", q:"q" };
function shopUrl(patch){
  var f = shopQS();
  Object.keys(patch||{}).forEach(function(k){ f[k] = patch[k]; });
  var parts = [];
  Object.keys(SHOP_QK).forEach(function(p){
    if(f[SHOP_QK[p]]) parts.push(p+"="+encodeURIComponent(f[SHOP_QK[p]])); });
  return "/shop" + (parts.length ? "?"+parts.join("&") : "");
}
/* ⚠️⚠️ **거르개는 화면을 새로 그리지 않습니다** (2026-10-30 모바일 지시서 §2).
   전에는 칩이 평범한 링크라 click 가로채기 → `go()` → `render()` 를
   타고, `render()` 끝의 `scrollTo(0,0)` 이 **칩을 누를 때마다 맨
   위로** 올려 보냈습니다 — 폰에서 거르개 넷을 차례로 고르시려면 네 번
   다시 내려와야 했습니다. 스크롤을 되돌려 놓는 땜질이 아니라 **화면을
   통째로 다시 그리지 않는 것**이 고침입니다 —
     ① 주소만 `replaceState` 로 바꿉니다 (거르개 하나하나가 뒤로 가기
        한 칸이 되면 상세에서 돌아올 때 그만큼 더 눌러야 합니다)
     ② 칩은 **제자리에서** 켜고 끕니다 (포커스 · 보던 자리가 그대로)
     ③ 목록(`#shp-res`)만 갈아 끼웁니다 — 거르개 **아래**라 높이가 바뀌어도
        보고 계신 거르개가 안 움직입니다
   ⚠️ `href` 는 그대로 둡니다 — 새 탭 · 크롤러 · 자바스크립트 없는 화면이
   그 주소로 같은 결과를 받습니다. 가로채는 것은 그냥 누를 때뿐입니다. */
function shopApply(url){
  try { history.replaceState(history.state, "", url); }
  catch(e){ go(url, { keepScroll:true }); return; }
  var f = shopQS();
  [].forEach.call(document.querySelectorAll(".shp-fil [data-shf]"), function(a){
    var k = a.getAttribute("data-shf"), v = a.getAttribute("data-shv") || "";
    var on = (f[k] || "") === v;
    a.classList.toggle("on", on);
    a.setAttribute("aria-pressed", on ? "true" : "false");
    /* ⚠️⚠️ **`href` 도 지금 상태로 다시 적습니다.** 처음 그릴 때의 주소를
       그대로 두면 칩마다 **그때의 다른 거르개**를 들고 있어서, 애플을
       고른 뒤 스마트폰을 누르면 애플이 조용히 풀렸습니다 (눌러 보고
       알았습니다 — 쌓이지 않았습니다). */
    var p = {}; p[k] = v; a.setAttribute("href", shopUrl(p));
  });
  var res = document.getElementById("shp-res");
  if(res) res.innerHTML = shopRes(f);
}
window.shopGo = function(patch){ shopApply(shopUrl(patch)); };
/* 칩 — ⚠️ 새 탭 · 가운데 단추는 그대로 링크로 보냅니다 */
window.shopPick = function(ev, a){
  if(ev && (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button)) return true;
  if(ev) ev.preventDefault();
  /* 누른 순간의 상태에서 그 칸만 바꿉니다 (href 를 믿지 않습니다) */
  var p = {}; p[a.getAttribute("data-shf")] = a.getAttribute("data-shv") || "";
  shopApply(shopUrl(p));
  return false;
};
window.shopFind = function(){
  var el = document.getElementById("sh-q");
  shopGo({ q: el ? el.value : "" });
};
/* 초기화 — ⚠️ 거르개만 풉니다. 스크롤은 안 움직이고 찾는 말 칸도 비웁니다 */
window.shopReset = function(){
  var el = document.getElementById("sh-q"); if(el) el.value = "";
  shopApply("/shop");
};

function shopChips(f){
  function row(label, now, opts, key){
    return '<div class="pwf-r"><span class="pwf-l">'+esc(label)+'</span><div class="chip-g">'+
      opts.map(function(o){
        var on = now === o[0];
        return '<a class="chip'+(on?" on":"")+'" href="'+
          esc(shopUrl((function(){ var p={}; p[key]=o[0]; return p; })()))+'" '+
          'data-shf="'+esc(key)+'" data-shv="'+esc(o[0])+'" '+
          'aria-pressed="'+(on?"true":"false")+'" '+
          'onclick="return shopPick(event,this)">'+
          esc(o[1])+'</a>'; }).join("") +'</div></div>';
  }
  var kinds = [["","전체"]].concat((window.AM_DEVICE_KINDS||[]).map(function(k){ return [k.key,k.name]; }));
  var mks   = [["","전체"]].concat((window.AM_MAKERS||[]).map(function(k){ return [k.key,k.name]; }));
  var grs   = [["","전체"]].concat((window.AM_GRADES||[]).map(function(g){ return [g.key,g.name]; }));
  var prs   = [["","전체"]].concat((window.AM_SHOP_PRICE||[]).map(function(r){ return [r.k,r.name]; }));
  return '<div class="shp-fil" role="group" aria-label="상품 거르개">'+
    '<div class="pwf-r"><span class="pwf-l">기종 찾기</span>'+
      '<div class="shp-q"><input id="sh-q" type="search" value="'+esc(f.q)+'" '+
        'placeholder="아이폰 15 · 갤럭시 S23" '+
        'onkeydown="if(event.key===\'Enter\')shopFind()">'+
        '<button type="button" class="btn btn-pw" onclick="shopFind()">찾기</button></div></div>'+
    row("기기 종류", f.kind, kinds, "kind")+
    row("제조사", f.maker, mks, "maker")+
    row("외관 등급", f.grade, grs, "grade")+
    row("가격", f.price, prs, "price")+
  '</div>';
}

/* 카드 — ⚠️ 예시면 **딱지가 붙습니다.** 붙이지 않으면 지어낸 값이
   실제 상품으로 읽힙니다 (절대 규칙 1). */
/* 상품 아이콘 — ⚠️⚠️ **기종에 맞는 그림이라야 합니다.** 전에는 넷 다
   `mobile`(스마트폰)이라, 아이패드와 애플워치 카드에도 **휴대폰
   그림**이 붙어 있었습니다 (찍어 보고 알았습니다). 사진이 아니라
   아이콘이어도 그건 그 상품에 대한 거짓말입니다.
   ⚠️ 모르는 종류 · 모르는 제조사는 `mobile` 이 받습니다 — 빈 칸을
   만들지 않습니다 (절대 규칙 2). */
function shopIcon(md){
  var kd = md && md.kind, mk = md && md.maker;
  if(kd === "tablet")            return "dev-tablet";
  if(kd === "watch" || kd === "buds") return "dev-etc";
  if(kd === "phone" && mk === "apple")   return "dev-iphone";
  if(kd === "phone" && mk === "samsung") return "dev-galaxy";
  return "mobile";
}

function shopCard(p, sample){
  var md = (typeof amModel === "function") ? amModel(p.model) : null;
  var g  = (typeof amGrade === "function") ? amGrade(p.grade) : null;
  return '<a class="shp-c'+(sample?" ex":"")+'" href="/d/'+esc(p.id)+'">'+
    '<span class="shp-ph">'+
      (sample ? '<span class="shp-ex">예시</span>' : '')+
      iconArt(shopIcon(md), 84)+'</span>'+
    '<span class="shp-tx">'+
      '<b>'+esc(amShopName(p))+'</b>'+
      '<span class="shp-m">'+
        [ (md && typeof amMakerName === "function") ? amMakerName(md.maker) : "",
          g ? g.name : "", p.color || "" ].filter(Boolean).map(esc).join(" · ")+
      '</span>'+
      '<b class="shp-p">'+Number(p.price||0).toLocaleString()+'원</b>'+
      (p.batt ? '<span class="shp-b">배터리 '+esc(String(p.batt))+'%</span>' : '')+
    '</span></a>';
}

/* 목록 자리 — ⚠️ 거르개를 바꾸면 **이것만** 다시 그립니다 (shopApply).
   화면을 처음 그릴 때와 거르개를 바꿀 때 **같은 함수**를 씁니다 — 두 벌을
   두면 처음 연 화면과 거른 화면이 서로 다른 말을 합니다. */
function shopRes(f){
  var list = (typeof amShopList === "function") ? amShopList(f) : [];
  var sample = (typeof amShopSampleOn === "function") ? amShopSampleOn() : false;
  var all = (typeof amShopList === "function") ? amShopList({}) : [];
  var off = all.length - list.length;
  var any = !!(f.kind || f.maker || f.grade || f.price || f.q);
  /* ⚠️ 초기화는 **거르개 아래**에 둡니다 — 위에 두면 나타나고 사라질 때
     보고 계신 칩이 그만큼 위아래로 움직입니다. */
  var reset = any ? '<button type="button" class="btn btn-pw-o shp-rs" '+
    'onclick="shopReset()">필터 초기화</button>' : "";
  return (list.length ?
        '<div class="shp-nr"><p class="shp-n">'+ list.length +'건'+
          (off > 0 ? ' · 거르개로 '+off+'건을 숨겼습니다' : '') +'</p>'+ reset +'</div>'+
        '<div class="shp-g">'+ list.map(function(p){ return shopCard(p, sample); }).join("") +'</div>'
        : (all.length ?
            '<div class="pws-e"><b>그 조건에 맞는 기기가 없습니다.</b>'+
              '<p>거르개를 하나씩 풀어 보세요.</p>'+
              '<a class="btn btn-pw-o" href="/shop" onclick="shopReset();return false">조건 모두 풀기</a></div>'
          : '<div class="pws-e">'+
              '<b>지금 판매 중인 상품이 0건입니다.</b>'+
              '<p>검수를 마친 기기부터 이 자리에 올라옵니다. 한 대라도 올라오면 '+
                '사진 · 외관 등급 · 배터리 상태 · 기능 검수 결과 · 구성품 · '+
                '보증과 반품 조건이 그대로 보입니다.<br>'+
                '⚠️ 없는 상품을 미리 만들어 두지 않습니다.</p>'+
              '<a class="btn btn-pw" href="/sell">내 폰 팔기</a>'+
            '</div>'));
}

function PageShop(){
  var f = shopQS();
  var sample = (typeof amShopSampleOn === "function") ? amShopSampleOn() : false;
  var all = (typeof amShopList === "function") ? amShopList({}) : [];
  /* ⚠️ 제목은 아래 네비의 "구매" 와 짝입니다 (2026-10-30 모바일 지시서 §1) */
  return PgHero({ kicker:"SHOP", h1:"내 폰 구매",
      lead:amBrand()+"가 직접 매입하고 검수한 기기만 판매합니다. "+
           "사진 · 등급 · 배터리 상태 · 검수 결과를 그대로 밝힙니다." })+
    '<section class="sec sec-white"><div class="w">'+
      /* ⚠️⚠️ **예시 안내가 목록보다 위입니다.** 아래에 두면 카드를
         먼저 보고 실제 상품으로 읽으십니다 — 절대 규칙 3 이 "운영자에게
         할 말" 을 금지하는 것과 달리, 이것은 **손님이 꼭 알아야 하는
         사실**입니다. */
      (sample ?
        '<div class="shp-note">'+
          '<b>⚠️ 아래 '+all.length+'건은 실제 상품이 아니라 예시입니다.</b>'+
          '<p>지금 판매 중인 상품이 <b>0건</b>이라, 목록 · 검색 · 상세 화면이 '+
            '어떻게 보이는지 보여 드리는 자리입니다. 값 · 배터리 · 보증 '+
            '일수는 <b>지어낸 숫자</b>이고 <b>구매하실 수 없습니다.</b><br>'+
            '검수를 마친 기기가 한 대라도 올라오면 이 안내와 예시가 '+
            '저절로 사라집니다.</p>'+
          '<a class="btn btn-pw" href="/sell">내 폰 팔기</a>'+
        '</div>' : "")+
      shopChips(f)+
      '<div id="shp-res" aria-live="polite">'+ shopRes(f) +'</div>'+
    '</div></section>';
}

/* ─── /d/:id · 상품 상세 ──────────────────────────────────────
   ⚠️⚠️ **예시면 구매 단추를 아예 안 냅니다.** 비활성으로 두지도
   않습니다 — 왜 못 사는지를 그 자리에서 말하는 쪽이 낫습니다. */
function PageProduct(one){
  var p = one.it, sample = one.sample;
  var md = (typeof amModel === "function") ? amModel(p.model) : null;
  var g  = (typeof amGrade === "function") ? amGrade(p.grade) : null;
  /* ⚠️⚠️ **값이 없는 칸은 아예 안 넣습니다** (절대 규칙 2).
     CSS 로 숨기면 빈 상자가 칸 하나를 차지합니다. */
  var rows = [];
  if(md) rows.push(["기종", md.name]);
  if(md && typeof amMakerName === "function") rows.push(["제조사", amMakerName(md.maker)]);
  if(p.cap) rows.push(["저장 용량", p.cap >= 1024 ? (p.cap/1024)+"TB" : p.cap+"GB"]);
  if(p.color) rows.push(["색상", p.color]);
  if(g) rows.push(["외관 등급", g.name]);
  if(p.batt) rows.push(["배터리 성능", p.batt+"%"]);
  if(p.warranty) rows.push(["보증", p.warranty+"일"]);
  if(md && md.year) rows.push(["출시", md.year+"년"]);
  return '<div class="w crumb-w"><nav class="crumb" aria-label="위치">'+
      '<a href="/shop">중고폰 구매</a><span>'+esc(amShopName(p))+'</span></nav></div>'+
    '<section class="sec sec-white"><div class="w shp-d">'+
      (sample ?
        '<div class="shp-note">'+
          '<b>⚠️ 이 화면은 실제 상품이 아니라 예시입니다.</b>'+
          '<p>상세 화면이 어떻게 보이는지 보여 드리는 자리입니다. '+
            '아래 값 · 배터리 · 보증 일수는 <b>지어낸 숫자</b>이고, '+
            '<b>구매하실 수 없습니다.</b></p>'+
        '</div>' : "")+
      '<div class="shp-d-g">'+
        '<div class="shp-d-ph">'+
          (sample ? '<span class="shp-ex">예시</span>' : '')+
          iconArt(shopIcon(md), 150)+
          /* ⚠️ 사진이 없으면 **액자째 안 그립니다** — 옅은 틴트 상자를
             깔면 그게 빈 액자이고 "준비 중" 으로 읽힙니다. 지금은 큰
             아이콘 면이라 그 자체로 완성된 자리입니다. */
        '</div>'+
        '<div class="shp-d-tx">'+
          '<h1>'+esc(amShopName(p))+'</h1>'+
          (g ? '<p class="shp-d-g2">'+esc(g.name)+' · '+esc(g.lead)+'</p>' : '')+
          '<b class="shp-d-p">'+Number(p.price||0).toLocaleString()+'원</b>'+
          (sample
            ? '<div class="note-box">예시 상품이라 구매 단추가 없습니다. '+
              '지금 실제로 하실 수 있는 것은 <b>내 폰 팔기</b>입니다.'+
              '<div class="pwb-go" style="margin-top:12px">'+
                '<a class="btn btn-pw" href="/sell">내 폰 팔기</a>'+
                '<a class="btn btn-pw-o" href="/shop">다른 예시 보기</a></div></div>'
            : '<div class="pwb-go">'+
                '<a class="btn btn-pw" href="/quote?c=shop&p='+esc(p.id)+'">중고폰 구매하기</a>'+
              '</div>'+
              /* ⚠️⚠️ **온라인 결제를 만들지 않았습니다.** PG 계약이
                 먼저이고(지시서가 직접 적었습니다), 없는데 결제 단추를
                 내면 누를 때마다 실패합니다 (§30-7). */
              '<p class="pwf-n">⚠️ 온라인 결제는 아직 열지 않았습니다 — '+
                '문의를 남기시면 확인한 뒤 연락드립니다.</p>')+
        '</div>'+
      '</div>'+
      (rows.length ?
        '<h2 class="pwf-h2">기기 정보</h2>'+
        '<dl class="shp-sp">'+ rows.map(function(r){
          return '<div><dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd></div>'; }).join("") +'</dl>' : "")+
      (p.check && p.check.length ?
        '<h2 class="pwf-h2">검수한 것</h2>'+
        '<ul class="shp-ck">'+ p.check.map(function(c){
          return '<li>'+icon("check",16)+esc(c)+'</li>'; }).join("") +'</ul>'+
        '<p class="pwf-n">⚠️ 적힌 항목만 확인한 것입니다 — 적히지 않은 것은 '+
          '확인하지 않았습니다.</p>' : "")+
      (p.parts && p.parts.length ?
        '<h2 class="pwf-h2">같이 보내는 것</h2>'+
        '<ul class="shp-ck">'+ p.parts.map(function(c){
          return '<li>'+icon("check",16)+esc(c)+'</li>'; }).join("") +'</ul>' : "")+
      (p.note ? '<h2 class="pwf-h2">상태 설명</h2><p class="shp-no">'+esc(p.note)+'</p>' : "")+
      '<div class="note-box" style="margin-top:24px">'+
        '⚠️ 중고 기기라 같은 등급이어도 기기마다 상태가 다릅니다. '+
        '위에 적힌 것이 <b>이 기기 하나</b>의 상태입니다.<br>'+
        '⚠️ 분실 · 도난 조회는 공식 서비스 계약이 필요해 아직 연동하지 '+
        '않았습니다 — 받으신 뒤 사람이 확인합니다.'+
      '</div>'+
    '</div></section>';
}

/* ─── /bid · 경쟁입찰 안내 ─────────────────────────────────── */
function PageBid(){
  var nPv = (window.AM_PROVIDERS || []).length;
  var rows = [
    ["기기를 등록하시면", "기종 · 용량 · 상태를 적어 주시면 됩니다. 가입하지 않으셔도 됩니다."],
    ["업체가 견적을 냅니다", "참여 업체가 기기 조건을 보고 금액과 거래 조건을 냅니다."],
    ["나란히 놓고 고르세요", "금액만이 아니라 검수 기준 · 정산 소요일까지 같이 보실 수 있습니다."],
    ["고르는 것은 사장님입니다", "저희가 자동으로 정하지 않습니다. 고르신 뒤에 상호를 알려 드리고, 연락처 전달은 그때 다시 동의를 받습니다."],
    /* ⚠️⚠️ 2026-10-29 — 전에는 "고르세요" 에서 끝났습니다. 고른 뒤에
       무엇이 남았는지가 없으면 판매자는 거기서 멈춘 줄 압니다 —
       수거 · 검수 · 정산이 실제 거래의 절반입니다. 상태 열셋
       (`AM_DEAL_ST`)에 이미 있는 걸음이라 지어낸 말이 아닙니다. */
    ["수거하고 검수합니다", "택배나 방문으로 기기를 보내시면 업체가 상태를 확인합니다. 적어 주신 것과 다르면 먼저 알려 드립니다."],
    ["정산합니다", "받아들이시면 정산하고, 아니면 기기를 돌려받으십니다. 진행은 접수번호로 조회하실 수 있습니다."]
  ];
  return PgHero({ kicker:"BID", h1:"최고가 경쟁입찰",
      /* ⚠️⚠️ "인증 매입업체가 … 냅니다" 라고 적었다가 고쳤습니다 —
         업체가 0곳인데 **있는 것처럼** 읽히고(절대 규칙 1),
         "인증" 은 저희가 자격을 준다는 말입니다. 지금 상태는
         아래 note-box 가 세는 값으로 그대로 말합니다. */
      lead:"한 대의 기기를 여러 매입업체가 보고 각자 견적을 냅니다. "+
           "금액과 거래 조건을 나란히 놓고 고르세요." })+
    '<section class="sec sec-white"><div class="w">'+
      '<ol class="pwb-g">'+ rows.map(function(r,i){
        return '<li><span class="pwb-n">'+(i+1)+'</span><b>'+esc(r[0])+'</b>'+
          '<p>'+esc(r[1])+'</p></li>'; }).join("") +'</ol>'+
      '<div class="note-box">'+
        (nPv ? '지금 <b>'+nPv+'곳</b>이 참여하고 있습니다.'
             : '⚠️ <b>지금 입점업체를 모집하고 있습니다.</b> 신청은 받아 두고, '+
               '참여 업체가 생기는 대로 견적을 모아 알려 드립니다 — '+
               '없는 업체를 미리 보여 드리지 않습니다.')+
        '<br>⚠️ <b>최고가를 보장하지 않습니다.</b> 업체가 낸 금액을 그대로 '+
        '보여 드릴 뿐이고, 검수 뒤 금액이 달라질 수 있습니다.'+
        /* ⚠️⚠️ **저희가 당사자인 건을 섞으면 밝힙니다** (0021 · §10 ·
           전자상거래법 제20조 제1항). 밝히지 않으면 손님은 저희가
           중개자인지 거래 당사자인지 모르는 채로 고릅니다 — 받은
           견적 카드의 딱지(`직접 매입` · `제휴 매입업체`)가 그
           구분이고, 그 표시는 **DB 가 켜 준 것만** 냅니다.
           ⚠️ "폰웨이도 참여합니다" 라고 적지 않았습니다 — 지금 그런
           업체가 0곳이라 그건 하지 않은 일을 했다고 말하는 것입니다
           (절대 규칙 5). 적는 것은 **섞이면 밝힌다**까지입니다. */
        '<br>⚠️ <b>저희가 직접 매입하는 건이 섞이면 그렇게 밝힙니다.</b> '+
        '어느 쪽이 낸 견적인지 보고 고르실 수 있습니다.'+
      '</div>'+
      '<div class="pwb-go"><a class="btn btn-pw" href="/sell">내 기기 등록하고 견적 받기</a>'+
        '<a class="btn btn-pw-o" href="/join">매입업체로 참여하기</a></div>'+
      /* ⚠️ 이미 참여 중인 업체가 **입찰을 내는 자리**로 가는 길입니다.
         `/my` 는 로그인이 꺼져 있으면 구간째 안 그리므로 가짜 단추가
         아니라 **한 줄 안내**로 둡니다 — 켜지면 거기서 바로 냅니다. */
      /* ⚠️⚠️ **문장 한가운데 링크를 박지 마세요** — 높이가 20px 이라
         누르기 어렵습니다 (전수 점검이 "40px 미만 누름" 으로 잡았습니다).
         문단 끝에 **단추로** 내놓습니다. */
      '<p class="sec-note">'+icon("info",15)+
        '이미 참여 중인 매입업체이시면 내 기록에서 배정받은 기기에 '+
        '입찰을 내실 수 있습니다.</p>'+
      '<div class="row-cta"><a class="btn btn-o" href="/my">'+
        '내 기록 열기'+icon("arrow",16)+'</a></div>'+
    '</div></section>';
}

/* ─── /track · 판매 진행 조회 ───────────────────────────────
   ⚠️⚠️ **번호만으로는 안 됩니다.** 번호를 손에 넣은 사람이 남의 성함 ·
   연락처 · 요청 내용을 다 봅니다 — 번호와 연락처 **둘 다** 맞아야
   합니다. 이 규칙은 DB 의 claim_request 와 같습니다. */
function PageTrack(){
  /* ⚠️⚠️ 조회할 곳이 아직 없으면 **폼을 안 냅니다.** 전에는
     폼을 내고 누르면 "아직 안 열었습니다" 라고 답했는데,
     그것이 곧 **눌러도 작동하지 않는 단추**입니다 (§30-7).
     `/my` 의 `.my-db` · 사진 첨부 칸과 **같은 방식**입니다 —
     `pwTrackInit()` 이 `auth:true` 를 받으면 그때 열립니다. */
  return PgHero({ kicker:"TRACK", h1:"판매 진행 조회",
      lead:"접수하신 건이 지금 어디까지 왔는지 알려 드립니다." })+
    '<section class="sec sec-white"><div class="w pwf" style="max-width:720px">'+
      '<div class="pwf-fm" id="tk-fm" hidden>'+
        '<div class="f-r"><label for="tk-no">접수번호 <em>*</em></label>'+
          /* ⚠️⚠️ 접수번호는 **`SW-`** 로 시작합니다 (`api/_intake.js` 의
             `reqNo()` · `reqNoClean()` 이 `SW` + 여덟 글자만 받습니다).
             여기에 다른 머리를 적어 두면 그 꼴로 찾으시다가 못 찾습니다. */
          '<input id="tk-no" type="text" autocomplete="off" placeholder="SW-AB12-CD34"></div>'+
        '<div class="f-r"><label for="tk-tel">연락처 <em>*</em></label>'+
          '<input id="tk-tel" type="tel" autocomplete="tel" inputmode="tel" '+
          'placeholder="010-0000-0000"></div>'+
        '<button type="button" class="btn btn-pw pwf-send" onclick="pwTrackFind()">조회하기</button>'+
        '<p class="pwf-n" id="tk-msg"></p>'+
      '</div>'+
      '<div class="note-box" id="tk-off">'+
        '⚠ <b>온라인 조회는 아직 열지 않았습니다.</b> 신청하시면 저희가 '+
        '내용을 확인한 뒤 적어 주신 연락처로 직접 연락드립니다.<br>'+
        '⚠ 회신 시점을 약속드리지는 않습니다.'+
        '<div class="pwb-go" style="margin-top:14px">'+
          '<a class="btn btn-pw" href="/sell">내 폰 팔기</a></div>'+
      '</div>'+
      '<div class="note-box" id="tk-why" style="margin-top:22px">'+
        '⚠ 접수번호와 연락처가 <b>둘 다</b> 맞아야 열립니다. 번호만으로 열어 '+
        '드리면 번호를 아는 누구나 남의 신청 내용을 보게 됩니다.<br>'+
        /* ⚠️⚠️ "고객센터로 문의해 주세요" 라고 적었다가 고쳤습니다 —
           그런 창구가 없고 사업자 전화번호 칸조차 비어 있어서,
           그 말을 보고 번호를 찾다가 못 찾으십니다. */
        '번호를 잃어버리셨으면 <b>같은 연락처로 다시 신청</b>해 주세요 — '+
        '저희 쪽에서 같은 분의 건으로 확인합니다.'+
      '</div>'+
    '</div></section>';
}
/* ⚠️⚠️ `/track` 에서만 한 번 묻습니다. `amAuthAsk()` 는 이미 물어
   둔 답을 들고 있으면 그대로 돌려주고, 묻는 중이면 그 물음을
   다시 씁니다 — 왕복이 더 늘지 않습니다. */
window.pwTrackInit = function(){
  var fm = document.getElementById("tk-fm"), off = document.getElementById("tk-off");
  if(!fm || !off) return;
  var pre = (typeof amAuthAsk === "function") ? amAuthAsk() : Promise.resolve(null);
  pre.then(function(a){
    if(!a || !a.auth) return;            /* 꺼진 채로 둡니다 */
    fm.hidden = false; off.hidden = true;
  }).catch(function(){ /* 못 물었으면 그대로 둡니다 */ });
};
window.pwTrackFind = function(){
  var no = (document.getElementById("tk-no")||{}).value || "";
  var tel = (document.getElementById("tk-tel")||{}).value || "";
  var msg = document.getElementById("tk-msg");
  if(!no.trim() || !tel.trim()){
    if(msg) msg.textContent = "⚠ 접수번호와 연락처를 둘 다 적어 주세요.";
    return;
  }
  if(msg) msg.textContent = "조회 중입니다…";
  /* 폼은 로그인이 켜졌을 때만 나오므로, 여기까지 오면 길이 있습니다 —
     `/my` 에서 신청번호로 가져가실 수 있습니다 (`claim_request`). */
  go("/my?claim=" + encodeURIComponent(no.trim()));
};

/* ─── /guide · 이용 안내 ───────────────────────────────────── */
function PageGuide(){
  /* ⚠️⚠️ 걸음 다섯은 `js/data/steps.js` 한 곳입니다 — 메인 구간과
     크롤러 본문이 같은 값을 읽습니다. 여기 또 적지 마세요. */
  var S = window.AM_STEPS || [];
  return PgHero({ kicker:"GUIDE", h1:"이용 안내",
      lead:"등록부터 정산까지 어떻게 진행되는지, 무엇을 기준으로 보는지 "+
           "거래 전에 먼저 알려 드립니다." })+
    '<section class="sec sec-white"><div class="w">'+
      '<h2 class="pwf-h2">판매 절차</h2>'+
      '<ol class="pwb-g">'+ S.map(function(s,i){
        return '<li><span class="pwb-n">'+(i+1)+'</span><b>'+esc(s.n)+'</b>'+
          '<p>'+esc(s.d)+'</p></li>'; }).join("") +'</ol>'+
    '</div></section>'+
    '<section class="sec sec-gray"><div class="w">'+
      '<h2 class="pwf-h2">외관 등급 기준</h2>'+
      '<ul class="pwg-gr">'+ (window.AM_GRADES||[]).map(function(g){
        return '<li><b>'+esc(g.name)+'</b><span>'+esc(g.lead)+'</span></li>';
      }).join("") +'</ul>'+
      '<p class="pwf-n">⚠️ 등급은 <b>겉모습</b>을 보는 기준입니다. 최종 금액은 '+
        '전원 · 액정 · 배터리 · 카메라 · 수리 이력까지 검수한 뒤에 정해집니다.</p>'+
    '</div></section>'+
    '<section class="sec sec-white"><div class="w">'+
      '<h2 class="pwf-h2">보내시기 전에 해 두실 것</h2>'+
      '<ul class="pwg-ck">'+
        ['자료를 백업해 주세요 — 받은 뒤에는 돌려 드릴 수 없습니다.',
         '계정 잠금을 풀어 주세요 (아이폰은 나의 찾기, 갤럭시는 삼성 계정).',
         '기기를 초기화해 주세요. 저희도 받은 뒤 한 번 더 지웁니다.',
         '유심 · 메모리카드를 빼 주세요.',
         '분실 · 도난 신고된 기기는 매입할 수 없습니다.'
        ].map(function(t){ return '<li>'+esc(t)+'</li>'; }).join("") +'</ul>'+
      '<div class="note-box">⚠️ <b>분실 · 도난 조회는 아직 연동하지 '+
        '않았습니다.</b> 공식 조회 서비스는 계약이 필요해서, 지금은 '+
        '받으신 뒤 사람이 확인합니다. 신고된 기기로 확인되면 매입이 '+
        '취소되고 기기를 돌려 드립니다.</div>'+
    '</div></section>';
}

/* ─── /biz · 기업 · 수출 거래 (2026-10-29 시안 §3-E) ───────────────
   ⚠️⚠️ **거래 절차를 만든 것이 아닙니다.** §3-E 가 "실제 거래 절차가
   준비되지 않았다면 **문의 접수형으로 운영하고 준비 상태를 명확히
   표시한다**" 고 적었습니다 — 지금 이 화면이 하는 일은 **문의를 받아
   사람이 연락드리는 것**까지이고, 화면 맨 위가 그렇게 말합니다
   (절대 규칙 5).

   ⚠️⚠️ **수출국 · 거래량 · 단가 · 실적을 한 글자도 안 적었습니다.**
   지어내면 표시 · 광고의 공정화에 관한 법률 제3조입니다 — 지금
   거래 실적이 0건이고, 그걸 숨기지 않고 그대로 적습니다. */
var PW_BIZ_WHAT = [
  ["대량 매입",
   "법인 · 대리점 · 기기 교체처럼 한 번에 여러 대를 넘기시는 경우입니다. "+
   "수량과 기종을 알려 주시면 확인한 뒤 연락드립니다.",
   '<rect x="3.5" y="8" width="7" height="12" rx="1.6"/>'+
   '<rect x="13.5" y="4" width="7" height="16" rx="1.6"/><path d="M2.5 20h19"/>'],
  ["해외 수출",
   "등급별로 묶어 내보내는 거래입니다. ⚠️ 통관 · 수출 절차는 건마다 달라서 "+
   "상담으로 진행합니다.",
   '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/>'+
   '<path d="M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>'],
  ["기업 일괄 처분",
   "쓰던 업무용 기기를 한 번에 정리하시는 경우입니다. 개인정보 삭제 절차를 "+
   "먼저 알려 드립니다.",
   '<path d="M4 20V6.5L12 3l8 3.5V20"/><path d="M9.5 20v-5h5v5"/><path d="M2.5 20h19"/>']
];
/* ⚠️⚠️ **헤더 메뉴 둘이 이 화면 하나를 가리킵니다** (`기업 매입` ·
   `해외 수출`). 화면을 둘로 쳪지 않은 까닭 — 받는 칸이 글자까지
   같아서, 쳪면 **같은 내용이 두 주소로 나가고 구글이 둘 다 무시합니다**
   (옥 `/transfer?t=in|out` 과 같은 방식).
   ⚠️ 주소에만 실리고 매체가 달라지는 것은 **머리말과 거래 종류
   기본값 둘**입니다 — 받는 칸과 보내는 곳은 같습니다. */
var PW_BIZ_TAB = {
  corp:   { kicker:"BULK PURCHASE", h1:"기업 대량 매입",
            lead:"법인 · 대리점 · 기기 교체처럼 한 번에 여러 대를 넘기시는 경우입니다. "+
                 "수량 · 기종 · 상태를 알려 주시면 확인한 뒤 연락드립니다.",
            pick:"대량 매입" },
  export: { kicker:"EXPORT", h1:"해외 수출",
            lead:"등급별로 묶어 내보내는 거래입니다. "+
                 "⚠️ 통관 · 수출 절차는 건마다 달라서 상담으로 진행합니다.",
            pick:"해외 수출" }
};
function PageBiz(){
  /* ⚠️ 모르는 값은 **첫 칸**입니다 — 빈 머리말을 찍지 않습니다
     (`paintGnb()` 도 질의문자가 없으면 첫 칸을 켭니다 — 둘이 같아야 합니다). */
  var t = PW_BIZ_TAB[nowQS("t")] || PW_BIZ_TAB.corp;
  return PgHero({ kicker:t.kicker, h1:t.h1, lead:t.lead })+
    '<section class="sec sec-white"><div class="w pwf">'+
      /* ⚠️⚠️ **맨 위입니다.** 다 읽고 적으신 뒤에 "사실 아직 준비
         중입니다" 를 보시면 그 자리에서 닫습니다 (절대 규칙 3 · 5). */
      '<div class="pwz-now"><b>지금은 문의를 받는 단계입니다.</b>'+
        '<p>온라인에서 바로 견적 · 계약이 되는 절차는 아직 없습니다. '+
          '보내 주신 내용을 사람이 확인하고 연락드립니다. '+
          '⚠️ 회신 시점을 약속드리지는 않습니다.</p></div>'+
      '<h2 class="pwf-h2">이런 거래를 받습니다</h2>'+
      '<ul class="pwz-g">'+ PW_BIZ_WHAT.map(function(w){
        return '<li><i><svg width="26" height="26" viewBox="0 0 24 24" fill="none" '+
          'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '+
          'stroke-linejoin="round" aria-hidden="true">'+ w[2] +'</svg></i>'+
          '<b>'+ esc(w[0]) +'</b><p>'+ esc(w[1]) +'</p></li>';
      }).join("") +'</ul>'+
      '<h2 class="pwf-h2" id="biz-form">거래 문의</h2>'+
      '<div class="pwf-fm" id="pz-form">'+
        '<div class="f-r"><label for="pz-co">회사 · 기관명 <em>*</em></label>'+
          '<input id="pz-co" type="text" autocomplete="organization" required></div>'+
        '<div class="f-r"><label for="pz-name">담당자 성함 <em>*</em></label>'+
          '<input id="pz-name" type="text" autocomplete="name" required></div>'+
        '<div class="f-r"><label for="pz-tel">연락처 <em>*</em></label>'+
          '<input id="pz-tel" type="tel" autocomplete="tel" inputmode="tel" required '+
          'placeholder="010-0000-0000"></div>'+
        '<div class="f-r"><label for="pz-kind">거래 종류 <em>*</em></label>'+
          '<select id="pz-kind" class="sel" required>'+
            '<option value="">골라 주세요</option>'+
            PW_BIZ_WHAT.map(function(w){
              return '<option value="'+ esc(w[0]) +'"'+
                (w[0] === t.pick ? " selected" : "") +'>'+ esc(w[0]) +'</option>'; }).join("")+
          '</select></div>'+
        '<div class="f-r"><label for="pz-qty">예상 수량 <em>(선택)</em></label>'+
          '<input id="pz-qty" type="text" inputmode="numeric" placeholder="예: 120대"></div>'+
        '<div class="f-r"><label for="pz-memo">기종 · 상태 · 그 밖에 알려 주실 것 '+
          '<em>(선택)</em></label>'+
          '<textarea id="pz-memo" rows="4" placeholder="기종과 대략의 상태, 희망 일정 등"></textarea></div>'+
        (typeof AgreeBox === "function" ? AgreeBox("pz-agree") : "")+
        '<button type="button" class="btn btn-pw pwf-send" id="pz-send" '+
          'onclick="pwBizSubmit()">문의 보내기</button>'+
        '<p class="pwf-n" id="pz-msg"></p>'+
      '</div>'+
    '</div></section>';
}

window.pwBizSubmit = function(){
  var $ = function(id){ return document.getElementById(id); };
  var co = ($("pz-co")||{}).value || "", name = ($("pz-name")||{}).value || "";
  var tel = ($("pz-tel")||{}).value || "", kind = ($("pz-kind")||{}).value || "";
  var qty = ($("pz-qty")||{}).value || "", memo = ($("pz-memo")||{}).value || "";
  if(!co.trim()){  toast("회사 · 기관명을 적어 주세요"); return; }
  if(!name.trim()){ toast("담당자 성함을 적어 주세요"); return; }
  /* ⚠️ required 는 폼 제출만 막습니다 — 이 함수를 바로 부르면 그냥 지나갑니다 */
  if(String(tel).replace(/[^0-9]/g,"").length < 9){ toast("연락처를 다시 확인해 주세요"); return; }
  if(!kind){ toast("거래 종류를 골라 주세요"); return; }
  var ag = $("pz-agree");
  if(ag && !ag.checked){ toast("개인정보 수집 · 이용에 동의해 주세요"); return; }

  var btn = $("pz-send");
  if(btn){ btn.disabled = true; btn.textContent = "보내는 중…"; }
  var ctl = new AbortController();
  var t = setTimeout(function(){ ctl.abort(); }, 20000);
  var det = { "회사 · 기관명": co.trim(), "거래 종류": kind,
              "예상 수량": qty.trim(), "알려 주신 것": memo.trim() };
  fetch("/api/quote", {
    method:"POST", headers:{ "content-type":"application/json" },
    signal: ctl.signal,
    body: JSON.stringify({
      kind:"quote", name:name.trim(), tel:tel.trim(),
      /* ⚠️⚠️ `side` 를 안 보내면 `api/quote.js` 가 기본값 `"start"` 를
         박아서 **창업 건으로** 저장됩니다 (`/sell` 에서 겪은 자리). */
      side:"export", serviceName:"기업 · 수출 거래 — " + kind,
      agree:true, idem:(window.amIdem ? amIdem() : ""),
      detail:(window.amDropEmpty ? amDropEmpty(det) : det)
    })
  }).then(function(r){ return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
    .then(function(x){
      clearTimeout(t);
      if(!x.ok) throw new Error((x.j && x.j.say) || "보내지 못했습니다");
      /* ⚠️⚠️ 접수번호는 **실제로 저장된 뒤에만** 옵니다 — 없으면 줄째
         뺍니다 (절대 규칙 5). */
      var no = x.j && x.j.no, f = $("pz-form");
      if(f) f.innerHTML = '<div class="pwf-ok"><b>문의가 접수되었습니다.</b>'+
        (no ? '<p>접수번호 <code>'+ esc(no) +'</code></p>' : '')+
        '<p>확인한 뒤 연락드리겠습니다. ⚠️ 회신 시점을 약속드리지는 않습니다.</p>'+
        '<a class="btn btn-pw-o" href="/guide">이용 안내 보기</a></div>';
    })
    .catch(function(e){
      clearTimeout(t);
      if(btn){ btn.disabled = false; btn.textContent = "문의 보내기"; }
      var m = $("pz-msg");
      if(m) m.innerHTML = '<b>보내지 못했습니다.</b> '+
        esc(e && e.name === "AbortError"
            ? "연결이 끊겼습니다 — 적어 주신 내용은 그대로 있습니다. 다시 눌러 주세요."
            : (e && e.message) || "잠시 뒤 다시 눌러 주세요.");
    });
};


/* ══════════════════════════════════════════════════════════════════
   /repair — 수리 서비스  (2026-10-30 최종 지시서 §2-3 · §5)

   ⚠️⚠️ **등록된 수리업체가 0곳입니다.** 그래서 이 화면이 하는 일은
   **접수를 받아 수리점을 찾아 드리는 것**까지이고, 화면 맨 위가 그렇게
   적습니다 (§0-7 "기능이 미구현된 메뉴는 가짜 화면으로 연결하지 않고
   준비 중 또는 문의 접수로 명확히 처리한다" · 절대 규칙 3 · 5).

   ⚠️⚠️ **수리비 · 소요 시간을 적지 마세요** — `js/data/devices.js` 의
   `AM_REPAIR_WHAT` 머리말에 까닭을 적어 두었습니다. 같은 "액정 교체" 도
   기종 · 부품 · 지역에 따라 몇 배로 갈립니다.

   ⚠️ 증상 · 받는 방식은 **`js/data/devices.js` 한 곳**입니다. 여기
   또 적으면 크롤러 본문(`build-pages.js`)과 어긋납니다 — 이 저장소가
   이용 절차를 `js/pages` 안에 적었다가 크롤러에서 통째로 빠뜨린
   자리입니다 (빌드는 `js/data` 만 읽습니다).
   ══════════════════════════════════════════════════════════════════ */
function PageRepair(){
  var W = window.AM_REPAIR_WHAT || [], Y = window.AM_REPAIR_WAY || [];
  var pre = nowQS("w");   /* 메인 서비스 카드에서 증상을 미리 고르고 올 수 있습니다 */
  return PgHero({ kicker:"REPAIR", h1:"수리 서비스",
      lead:"깨진 액정 · 배터리 · 충전 단자처럼 고쳐 쓰실 수 있는 것이 많습니다. "+
           "증상을 알려 주시면 맞는 수리점을 찾아 연결해 드립니다." })+
    '<section class="sec sec-white"><div class="w pwf">'+
      /* ⚠️⚠️ **맨 위입니다.** 다 읽고 적으신 뒤에 "사실 아직 준비
         중입니다" 를 보시면 그 자리에서 닫습니다 (절대 규칙 3). */
      '<div class="pwz-now"><b>지금은 수리 접수를 받는 단계입니다.</b>'+
        '<p>온라인에서 바로 수리비가 나오고 결제까지 되는 절차는 아직 '+
          '없습니다. 보내 주신 증상을 보고 맞는 수리점을 찾아 연락드립니다. '+
          '⚠️ 수리비 · 소요 시간은 기종과 부품에 따라 갈려서 미리 '+
          '약속드리지 않습니다.</p></div>'+

      '<h2 class="pwf-h2">이런 증상을 받습니다</h2>'+
      '<ul class="rpw-g">'+ W.map(function(w){
        return '<li><b>'+ esc(w.name) +'</b><p>'+ esc(w.lead) +'</p></li>';
      }).join("") +'</ul>'+

      /* ⚠️⚠️ **고쳐 쓰는 것이 늘 이득이라고 말하지 않습니다.** 기종과
         증상에 따라 **파는 쪽이 나은 경우**가 실제로 많고, 그걸 안
         알려 드리면 손님이 수리비를 쓰고 나서 압니다. 두 길을 같이
         냅니다 (§2-6 의 "수리 vs 판매" 배너와 같은 말입니다). */
      '<div class="rpw-vs"><b>고치는 게 나을까, 파는 게 나을까?</b>'+
        '<p>수리비가 중고 시세에 가까우면 파시는 쪽이 나을 수 있습니다. '+
          '⚠️ 저희가 대신 정해 드리지 않습니다 — 두 가지를 다 보시고 '+
          '고르시라고 양쪽 길을 같이 둡니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-pw-o" href="/sell">파는 쪽 견적 보기</a>'+
          '<a class="btn btn-pw-o" href="/bid">경쟁입찰로 비교하기</a>'+
        '</div></div>'+

      '<h2 class="pwf-h2" id="repair-form">수리 접수</h2>'+
      '<div class="pwf-fm" id="rp-form">'+
        '<div class="f-r"><label for="rp-what">증상 <em>*</em></label>'+
          '<select id="rp-what" class="sel" required>'+
            '<option value="">골라 주세요</option>'+
            W.map(function(w){
              return '<option value="'+ esc(w.name) +'"'+
                (pre === w.key ? " selected" : "") +'>'+ esc(w.name) +'</option>';
            }).join("")+
          '</select></div>'+
        '<div class="f-r"><label for="rp-maker">제조사 <em>*</em></label>'+
          '<select id="rp-maker" class="sel" required>'+
            '<option value="">골라 주세요</option>'+
            (window.AM_MAKERS||[]).map(function(m){
              return '<option value="'+ esc(m.name) +'">'+ esc(m.name) +'</option>';
            }).join("")+
          '</select></div>'+
        /* ⚠️ 모델은 **자유 입력**입니다. 고르개로 두면 카탈로그 65종
           밖의 옛 기기를 가져오신 분이 **적을 자리가 없습니다** — 깨진
           기기는 오래된 것이 많습니다. */
        '<div class="f-r"><label for="rp-model">기종 <em>(아시는 만큼)</em></label>'+
          '<input id="rp-model" type="text" placeholder="예: 아이폰 13 · 갤럭시 S22"></div>'+
        '<div class="f-r"><label for="rp-way">받는 방식 <em>*</em></label>'+
          '<select id="rp-way" class="sel" required>'+
            '<option value="">골라 주세요</option>'+
            Y.map(function(y){
              return '<option value="'+ esc(y.name) +'">'+ esc(y.name) +
                ' — '+ esc(y.lead) +'</option>';
            }).join("")+
          '</select></div>'+
        /* ⚠️⚠️ 지역을 **막습니다** — 가까운 수리점을 찾는 첫 조건입니다.
           딱지에 `*` 만 붙여 두고 안 막으면 빈 채로 들어옵니다
           (`/quote` · `/sell-biz` 에서 겪은 자리). */
        '<div class="f-r"><label for="rp-reg">지역 <em>*</em></label>'+
          RegionSelect("rp-reg", "", "", "골라 주세요", true)+'</div>'+
        '<div class="f-r"><label for="rp-name">성함 <em>*</em></label>'+
          '<input id="rp-name" type="text" autocomplete="name" required></div>'+
        '<div class="f-r"><label for="rp-tel">연락처 <em>*</em></label>'+
          '<input id="rp-tel" type="tel" autocomplete="tel" inputmode="tel" required '+
          'placeholder="010-0000-0000"></div>'+
        '<div class="f-r"><label for="rp-memo">증상을 더 알려 주실 것 '+
          '<em>(선택)</em></label>'+
          '<textarea id="rp-memo" rows="4" placeholder="언제부터인지, 떨어뜨린 적이 있는지 등"></textarea></div>'+
        (typeof AgreeBox === "function" ? AgreeBox("rp-agree") : "")+
        '<button type="button" class="btn btn-pw pwf-send" id="rp-send" '+
          'onclick="pwRepairSubmit()">수리 접수하기</button>'+
        '<p class="pwf-n" id="rp-msg"></p>'+
      '</div>'+
    '</div></section>';
}

window.pwRepairSubmit = function(){
  var $ = function(id){ return document.getElementById(id); };
  var v = function(id){ return (($(id)||{}).value || "").trim(); };
  var what = v("rp-what"), maker = v("rp-maker"), model = v("rp-model");
  var way = v("rp-way"), reg = v("rp-reg"), name = v("rp-name");
  var tel = v("rp-tel"), memo = v("rp-memo");
  if(!what){ toast("증상을 골라 주세요"); return; }
  if(!maker){ toast("제조사를 골라 주세요"); return; }
  if(!way){ toast("받는 방식을 골라 주세요"); return; }
  if(!reg){ toast("지역을 골라 주세요"); return; }
  if(!name){ toast("성함을 적어 주세요"); return; }
  /* ⚠️ required 는 폼 제출만 막습니다 — 이 함수를 바로 부르면 그냥 지나갑니다 */
  if(String(tel).replace(/[^0-9]/g,"").length < 9){ toast("연락처를 다시 확인해 주세요"); return; }
  var ag = $("rp-agree");
  if(ag && !ag.checked){ toast("개인정보 수집 · 이용에 동의해 주세요"); return; }

  var btn = $("rp-send");
  if(btn){ btn.disabled = true; btn.textContent = "보내는 중…"; }
  var ctl = new AbortController();
  var t = setTimeout(function(){ ctl.abort(); }, 20000);
  var det = { "증상": what, "제조사": maker, "기종": model,
              "받는 방식": way, "알려 주신 것": memo };
  fetch("/api/quote", {
    method:"POST", headers:{ "content-type":"application/json" },
    signal: ctl.signal,
    body: JSON.stringify({
      kind:"quote", name:name, tel:tel, region:reg,
      /* ⚠️⚠️ `side` 를 안 보내면 `api/quote.js` 가 기본값 `"start"` 를
         박아서 **창업 건으로** 저장됩니다 (`/sell` · `/biz` 에서 겪은 자리). */
      side:"repair", serviceName:"수리 서비스 — " + what,
      agree:true, idem:(window.amIdem ? amIdem() : ""),
      detail:(window.amDropEmpty ? amDropEmpty(det) : det)
    })
  }).then(function(r){ return r.json().then(function(j){ return { ok:r.ok, j:j }; }); })
    .then(function(x){
      clearTimeout(t);
      if(!x.ok) throw new Error((x.j && x.j.say) || "보내지 못했습니다");
      /* ⚠️⚠️ 접수번호는 **실제로 저장된 뒤에만** 옵니다 — 없으면 줄째
         뺍니다 (절대 규칙 5). */
      var no = x.j && x.j.no, f = $("rp-form");
      if(f) f.innerHTML = '<div class="pwf-ok"><b>수리 접수가 되었습니다.</b>'+
        (no ? '<p>접수번호 <code>'+ esc(no) +'</code></p>' : '')+
        '<p>증상을 보고 맞는 수리점을 찾아 연락드리겠습니다. '+
          '⚠️ 회신 시점을 약속드리지는 않습니다.</p>'+
        '<a class="btn btn-pw-o" href="/track">판매 진행 조회</a></div>';
    })
    .catch(function(e){
      clearTimeout(t);
      if(btn){ btn.disabled = false; btn.textContent = "수리 접수하기"; }
      var m = $("rp-msg");
      if(m) m.innerHTML = '<b>보내지 못했습니다.</b> '+
        esc(e && e.name === "AbortError"
            ? "연결이 끊겼습니다 — 적어 주신 내용은 그대로 있습니다. 다시 눌러 주세요."
            : (e && e.message) || "잠시 뒤 다시 눌러 주세요.");
    });
};

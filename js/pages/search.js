/* ════════════════════════════════════════════════════════════════════
   통합검색 (§43)

   결과를 **업체 · 프랜차이즈 · 매장 · 시설장비 · 분류 · 정보**로
   나눠서 보여 줍니다.

   ⚠️ **새 데이터를 만들면 여기 색인에도 넣으세요.** 이 저장소에서
   글 열두 편을 만들어 놓고 검색에 안 넣어서, 손님에게는 없는 것과
   같았던 적이 있습니다.
   ⚠️ **분류 이름만 넣지 마세요.** 손님은 "닥트" 가 아니라 "후드" ·
   "배기" 라고 치고, "폐업신고" 를 "사업자 정리" 라고 칩니다.
   하위 분류 이름과 업종 이름을 전부 색인에 넣습니다.
   ⚠️ **못 찾았을 때 막다른 길로 두지 마세요.** 그대로 적어서 물어보는
   길을 반드시 같이 냅니다.
   ════════════════════════════════════════════════════════════════════ */

function PageSearch(){
  var q = (nowQS("q") || "").trim();
  var res = q ? amSearch(q) : null;
  return PgHero({
    kicker:"통합검색",
    h1raw:"무엇을 찾으세요?",
    lead:"기종 · 중고폰 상품 · 업체 · 정보를 한 번에 찾습니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<form class="sb" onsubmit="return searchGo(event)">'+
      '<span class="sb-ic" aria-hidden="true">'+icon("search",20)+'</span>'+
      '<input id="sb-q" value="'+esc(q)+'" placeholder="아이폰 15 · 갤럭시 S24 · 액정 수리 · 아이패드" '+
        'aria-label="검색어">'+
      '<button class="btn btn-b" type="submit">검색</button>'+
    '</form>'+
    (!q ? SearchHints() : (res.total
      ? res.groups.map(function(g){
          if(!g.rows.length) return "";
          return '<div class="sr-g"><h2>'+esc(g.name)+' <em>'+g.rows.length+'</em></h2><ul class="sr-l">'+
            g.rows.map(function(r){
              return '<li><a href="'+esc(r.to)+'"><b>'+esc(r.name)+'</b>'+
                (r.sub?'<span>'+esc(r.sub)+'</span>':'')+
                '<span class="sr-go" aria-hidden="true">'+icon("chev",15)+'</span></a></li>';
            }).join("")+'</ul></div>';
        }).join("")
      : Empty({
          icon:"search",
          title:'"'+q+'" 로 찾은 것이 없습니다',
          text:"다른 말로 찾아 보시거나, 필요한 일을 그대로 적어서 물어보세요. "+
               "분류에 없는 일도 찾아 드립니다.",
          cta:'<a class="btn btn-b" href="/quote">그대로 적어서 물어보기'+icon("arrow",16)+'</a>'+
              '<a class="btn btn-o" href="/shop">중고폰 둘러보기</a>'
        })))+
  '</div></section>';
}

function SearchHints(){
  /* ⚠️⚠️ **아홉 다 쳐 보고 골랐습니다** (2026-10-31). 전에는 창업 · 폐업
     말("카페 인테리어" · "원상복구" · "권리금")이었는데, 그쪽 색인을
     끄면서 **추천해 둔 말이 전부 0건**이 될 자리였습니다 — 이 저장소가
     메인 추천 검색어 넷으로 겪은 그 자리입니다.
     ⚠️ 바꾸실 때는 **반드시 쳐 보세요** (건수는 아래 주석에). */
  var eg = ["아이폰 15","갤럭시 S24","중고폰","아이패드",
            "애플워치","액정 수리","배터리 교체","택배 수거","경쟁입찰"];
  return '<div class="sr-hint"><b>이렇게 찾아 보세요</b><ul class="chip-g">'+
    eg.map(function(t){
      return '<li><a class="chip" href="/search?q='+encodeURIComponent(t)+'">'+esc(t)+'</a></li>';
    }).join("")+'</ul></div>';
}

window.searchGo = function(ev){
  ev.preventDefault();
  var v = $("sb-q").value.trim();
  go("/search"+(v ? "?q="+encodeURIComponent(v) : ""));
  return false;
};

/* 점수는 **몇 번 나오는지**로 셉니다 — 한 번이라도 나오면 1점으로 두면
   스치듯 언급한 것이 정작 그 말이 주제인 화면보다 위로 갑니다. */
function amScore(hay, words){
  var n = 0, hit = 0, low = hay.toLowerCase();
  /* ⚠️⚠️ **손님은 띄어쓰기를 안 합니다** (2026-10-04). 분류 이름은
     "상가 임대" · "매장 양도" · "시설 · 장비" 처럼 띄어 두었는데,
     손님은 **"상가임대" · "매장양도"** 라고 칩니다 — 그러면 글자가
     그대로 있는데도 **0건**이 나왔습니다. 추천 검색어로 내놓은 말이
     정작 검색이 안 되는 상태였습니다.
     그래서 띄어쓰기와 가운뎃점을 **양쪽에서 걷어낸 사본**으로 한 번
     더 봅니다. ⚠️ 점수는 **덜 줍니다**(0.5) — 띄어 쓴 그대로 맞은
     쪽이 위로 와야 합니다. */
  var flat = low.replace(/[\s·・]/g, "");
  words.forEach(function(w){
    var i = 0, c = 0;
    while((i = low.indexOf(w, i)) >= 0 && c < 4){ c++; i += w.length; }
    if(!c){
      var fw = w.replace(/[\s·・]/g, ""), j = 0, fc = 0;
      if(fw) while((j = flat.indexOf(fw, j)) >= 0 && fc < 4){ fc++; j += fw.length; }
      if(fc){ hit++; n += fc * 0.5; return; }
    }
    if(c) hit++;
    n += c;
  });
  /* ⚠️⚠️ **낱말을 더 많이 맞힌 쪽이 먼저입니다** (2026-10-01).
     전에는 낱말마다 센 수를 그냥 더했습니다. 그래서 "주류 면허" 를
     치면 **"면허" 하나만 맞은 미용실 글**이, 둘 다 맞은 주점 글보다
     위에 앉았습니다 — 흔한 낱말 하나가 드문 낱말을 묻어 버립니다.
     맞힌 낱말 수를 곱해서 둘 다 맞은 쪽을 올립니다.
     ⚠️ 한 낱말짜리 검색에는 아무 영향이 없습니다 (hit 가 1 이라서). */
  return words.length > 1 ? n * hit : n;
}

/* 글 한 편을 **검색할 수 있는 한 덩이 글자**로 폅니다.
   ⚠️ `body[]` 는 { h, p[], ul[] } 꼴입니다 — 셋 다 넣습니다.
   ⚠️ `source` 와 `next` 는 뺍니다. 출처 기관 이름("국세청")이 본문보다
   흔해서, 안 빼면 세무와 상관없는 글이 "국세청" 검색에 줄줄이 걸립니다. */
var AM_CT_TEXT = {};
function amContentText(c){
  /* ⚠️ 글 객체에 `__tx` 를 붙이지 않습니다 — 공유 데이터에 몰래 칸을
     하나 더하는 것이고, 나중에 그 객체를 그대로 내보내는 자리가
     생기면 거기에 같이 딸려 나갑니다. 밖에 따로 들고 있습니다. */
  if(AM_CT_TEXT[c.slug] !== undefined) return AM_CT_TEXT[c.slug];
  var out = [];
  (c.body || []).forEach(function(b){
    if(b.h) out.push(b.h);
    (b.p  || []).forEach(function(t){ out.push(t); });
    (b.ul || []).forEach(function(t){ out.push(t); });
  });
  /* 굵게 표시(**)는 검색감이 아닙니다 — 낱말 가운데 들어가면 못 맞힙니다 */
  return (AM_CT_TEXT[c.slug] = out.join(" ").split("**").join(""));
}

window.amSearch = function(q){
  var words = q.toLowerCase().split(" ").filter(Boolean);
  var G = {
    /* ⚠️⚠️ **기종과 상품이 맨 앞입니다** (2026-10-29 PHONEWAY).
       중고폰 플랫폼인데 "갤럭시 S24" 를 치면 **0건**이었습니다 —
       `AM_MODELS` 예순다섯도 `AM_SHOP_SAMPLES` 도 색인에 아예 없었고,
       헤더 검색은 **167개 화면 전부**에 있습니다. 차례가 곧 화면의
       차례라(`Object.keys(G)`) 손님이 제일 먼저 찾는 둘을 위에 둡니다. */
    model:{ name:"기종", rows:[] }, shop:{ name:"중고폰 상품", rows:[] },
    page:{ name:"폰웨이 서비스", rows:[] },
    provider:{ name:"업체", rows:[] }, franchise:{ name:"프랜차이즈", rows:[] },
    store:{ name:"매장 · 점포", rows:[] }, asset:{ name:"시설 · 장비", rows:[] },
    cat:{ name:"분류", rows:[] }, industry:{ name:"업종", rows:[] },
    content:{ name:"정보", rows:[] },
    tool:{ name:"도구", rows:[] },
    support:{ name:"지원사업", rows:[] },
    /* ⚠️ `push()` 는 없는 묶음 이름을 받으면 그 자리에서 던집니다 —
       화면이 통째로 안 그려집니다. 묶음을 먼저 만드세요. */
    info:{ name:"자주 묻는 것", rows:[] }
  };
  function push(g, name, sub, to, score){ if(score > 0) G[g].rows.push({name:name,sub:sub,to:to,s:score}); }

  /* ⚠️⚠️ **기종 예순다섯** — "갤럭시 S24" · "아이폰 15" 를 치는 분이
     제일 많은데 색인에 없었습니다. 가는 곳은 `/sell` 의 그 기종까지
     골라 둔 자리라, 누르면 바로 02 걸음(상태 · 등급)입니다.
     ⚠️ 제조사 · 종류 이름도 같이 읽습니다 — "삼성 태블릿" 이 걸립니다. */
  (window.AM_MODELS || []).forEach(function(m){
    var mk = (typeof amMakerName === "function") ? amMakerName(m.maker) : "";
    var kd = (typeof amKindName === "function") ? amKindName(m.kind) : "";
    push("model", m.name, mk + (kd ? " · " + kd : ""),
      "/sell?mk=" + encodeURIComponent(m.maker) +
      "&kd=" + encodeURIComponent(m.kind) +
      "&md=" + encodeURIComponent(m.key),
      amScore(m.name + " " + mk + " " + kd + " " + (m.en || ""), words) * 2);
  });
  /* ⚠️⚠️ **지금 /shop 이 내고 있는 것만** 색인합니다 (`amShopList()`).
     실제 상품이 생기면 예시는 저절로 빠집니다 — 두 곳에 규칙을 적으면
     검색에는 있는데 눌러 들어간 자리에 없는 상품이 생깁니다.
     ⚠️ 예시일 때는 **딱지를 붙입니다** — 안 붙이면 검색 결과에서는
     살 수 있는 것처럼 읽히고, 들어가서야 "구매하실 수 없습니다" 입니다. */
  if(typeof amShopList === "function"){
    var shSample = (typeof amShopSampleOn === "function") && amShopSampleOn();
    amShopList({}).forEach(function(p){
      var nm = (typeof amShopName === "function") ? amShopName(p) : (p.model || "");
      var g  = (typeof amGrade === "function") ? amGrade(p.grade) : null;
      push("shop", nm + (shSample ? " (예시)" : ""),
        (g ? g.name + " · " : "") + Number(p.price || 0).toLocaleString() + "원",
        "/d/" + p.id,
        amScore(nm + " " + (p.color || "") + " " + (g ? g.name : ""), words) * 2);
    });
  }
  /* ⚠️⚠️ **폰웨이 화면 다섯도 검색감입니다.** 전에는 "중고폰" · "택배"
     를 쳐도 **0건**이었습니다 — 사이트가 하는 일 그 자체인데 색인에
     아예 없었습니다 (업종 · 단계 · 여정이 색인에 없어 겪은 그 자리).
     ⚠️ 이름과 짧은 줄은 `META` **한 곳**에서 가져옵니다 — 여기 또
     적으면 제목을 고친 날 검색 결과만 옛 이름으로 남습니다.
     ⚠️ `kw` 는 **검색 전용 다른 말**입니다 (`catalog.js` 와 같은 꼴) —
     손님은 화면 이름을 모르고 하려는 일을 칩니다. 더하실 때는 반드시
     **쳐 보세요** (메인 추천 검색어 넷이 전부 0건이던 자리입니다). */
  [ { to:"/sell",  kw:"중고폰 폰팔기 핸드폰 휴대폰 스마트폰 판매 매입 처분 중고" },
    { to:"/shop",  kw:"중고폰 구매 구입 사기 쇼핑몰 상품 중고 리퍼" },
    { to:"/bid",   kw:"경쟁입찰 입찰 최고가 견적비교 여러곳 비교 중고폰" },
    { to:"/track", kw:"진행 조회 접수번호 상태확인 어디까지 배송 입금" },
    { to:"/guide", kw:"이용안내 택배 발송 보내는법 절차 등급기준 초기화 개인정보 삭제 중고폰" },
    /* ⚠️⚠️ **둘이 빠져 있었습니다** (2026-10-31 에 쳐 보고 알았습니다).
       화면은 2026-10-30 에 생겼는데 여기 안 넣어서 **"액정 수리" ·
       "기업 매입" 이 0건**이었고, `/sell` 의 자리글이 "액정 수리" 를
       추천하고 있었으니 **그 자리글이 거짓**이었습니다. */
    { to:"/repair", kw:"수리 액정 깨진 배터리 교체 충전 침수 카메라 버튼 스피커 고장 AS 사설" },
    { to:"/biz",   kw:"기업 법인 대량 단체 수출 해외 재고 임대폰 업무용 매입문의" }
  ].forEach(function(x){
    var m = (window.META || {})[x.to];
    if(!m) return;   /* ⚠️ 주소를 지우면 조용히 빠집니다 — 가짜 링크를 안 냅니다 */
    push("page", m[0], m[1], x.to,
      amScore(m[0] + " " + m[1] + " " + x.kw, words) * 2);
  });
  /* ⚠️⚠️ **창업 · 폐업 쪽 색인을 2026-10-31 로 껐습니다** (사장님 지시 —
     "인수인계 자료들은 다 지워줘"). 그 157개는 지금 `vercel.json` 이
     **308 로 `/` 에** 보내므로, 색인에 두면 검색 결과를 눌러도 메인으로
     튕깁니다 — 손님에게는 그게 **검색이 고장난 것**으로 읽힙니다.

     ⚠️⚠️ **코드를 지우지 않았습니다.** 아래 묶음 아홉(업종 · 단계 ·
     분류 · 도구 · 업체 · 프랜차이즈 · 점포 · 시설 · 공고)이 그대로
     있고, 되살리시려면 **이 한 줄을 `true` 로** 바꾸면 됩니다.
     ⚠️ 그날 `vercel.json` 의 redirect 스물넷과 `js/app.js` 의
     `NOINDEX_PRE` 도 같이 되돌리세요 — 색인만 켜면 결과는 뜨는데
     누르면 308 이 먼저 걸립니다.

     ⚠️ 묶음 선언(`G`)은 **안 지웁니다** — 줄이 0개면 화면이 그 묶음을
     아예 안 그립니다(`if(!g.rows.length) return ""`). 선언을 지우면
     `push()` 가 없는 묶음 이름을 받아 **그 자리에서 던지고 검색 화면이
     통째로 안 그려집니다** (바로 위 ⚠️ 가 적어 둔 그것입니다). */
  var AM_SEARCH_BIZ = false;

  if(AM_SEARCH_BIZ){
  (window.AM_INDUSTRIES||[]).forEach(function(i){
    /* ⚠️⚠️ **세부 업종 말까지 읽습니다** (2026-10-09 지시서 PART 3).
       전에는 이름과 짧은 줄만 봐서, 사장님들이 쓰는 업종 말 서른 중
       **스물한 개가 0건**이었습니다 — 지시서 PART 2 4-4 가 이름까지
       적은 "미용실"(우리 이름은 "미용 · 헤어")과 "소매업"(우리 이름은
       "소매 · 편의점")이 거기 있었습니다. 자기 업종 이름을 치는 분이
       0건을 보는 것이라 제일 나쁜 종류입니다.
       ⚠️ 세부 업종은 `indgroups.js` 한 곳이고, 짧은 줄과 어긋나면
       빌드가 멈춥니다 (checkIndGroups). */
    var subs = (window.amIndSubs ? window.amIndSubs(i.key) : []).join(" ");
    var s = amScore(i.name+" "+i.lead+" "+subs, words);
    /* ⚠️ 아래 줄(`sub`)은 **짧은 줄**을 그대로 냅니다 — 세부 업종
       스물넷을 다 깔면 결과 한 줄이 화면을 먹습니다. */
    push("industry", i.name+" 창업", i.lead, "/startup/"+i.key, s);
    push("industry", i.name+" 폐업", "정리에 필요한 것", "/closure/"+i.key, s ? s-0.5 : 0);
  });
  /* ⚠️ **사업 단계 여섯도 검색감입니다** (2026-10-04 구조 개편).
     손님은 "매장 운영" · "양도" 라고 치는데, 그건 분류 이름이 아니라
     **단계 이름**입니다 — 색인에 없으면 메인에서만 갈 수 있는 화면이
     됩니다. 대표 서비스(`sub`)까지 검색감으로 씁니다. */
  (window.AM_STAGES || []).forEach(function(st){
    /* ⚠️ 여정 넷과 **이름이 겹칩니다** (매장 운영 · 매장 양도 양수) —
       같은 이름 두 줄이 나란히 뜨면 검색이 고장난 것처럼 보입니다.
       단계 쪽에 "단계" 를 붙여 갈라 둡니다. */
    push("cat", st.name + " 단계", st.lead, "/g/" + st.key,
      amScore(st.name + " " + st.lead + " " + st.sub, words) * 2);
  });
  /* ⚠️⚠️ **여정 넷도 검색감입니다** (2026-10-05 V2 §1 · §22).
     손님은 "운영" · "인수" · "양도" 라고 치는데, 그건 분류 이름도
     단계 이름도 아니라 **여정 이름**입니다 — 색인에 없으면 메인에서만
     갈 수 있는 화면이 됩니다. */
  (window.AM_JOURNEYS || []).forEach(function(j){
    push("cat", j.name, j.q, j.to,
      amScore(j.name + " " + j.q + " " + j.lead + " " + j.sub, words) * 2);
  });
  /* ⚠️⚠️ **도구도 검색감입니다** (§22 — "검색 결과는 업체 · 정보 ·
     서비스 · 매물 · 도구로 구분한다"). "손익분기" · "창업비" · "폐업
     체크리스트" 를 치는 분이 실제로 많은데 색인에 없었습니다. */
  (window.AM_TOOLS || []).forEach(function(t){
    push("tool", t.name, t.lead, t.to,
      amScore(t.name + " " + t.lead + " " + (t.ask||"") + " " + (t.out||""), words) * 2);
  });
  AM_CATS.forEach(function(c){
    var subs = (c.items||[]).map(function(x){ return x.name; }).join(" ");
    /* ⚠️ `kw` 는 분류가 들고 있는 **검색 전용 다른 말**입니다 (catalog.js).
       화면에는 안 나오고 여기서만 씁니다 — "주방설비" 처럼 손님이 쓰는
       말과 우리 이름("시설 · 장비")이 다른 자리를 메웁니다. */
    var s = amScore(c.name+" "+c.lead+" "+c.desc+" "+(c.kw||"")+" "+subs, words);
    push("cat", c.name, c.lead, catTo(c), s);
    (c.items||[]).forEach(function(it){
      var ss = amScore(it.name, words);
      if(ss > 0) push("cat", it.name, c.name,
        (c.kind === "provider" ? "/providers/"+c.key+"?s="+encodeURIComponent(it.key) : catTo(c)), ss + 1);
    });
  });
  (window.AM_PROVIDERS||[]).forEach(function(p){
    push("provider", p.name, (p.regions||[]).map(function(k){ return amRegionName(k); }).join(" · "),
      "/p/"+p.id, amScore(p.name+" "+(p.intro||"")+" "+(p.subs||[]).join(" "), words));
  });
  (window.AM_FRANCHISES||[]).forEach(function(f){
    push("franchise", f.name, f.intro||"", "/f/"+f.slug, amScore(f.name+" "+(f.intro||""), words));
  });
  (window.AM_STORES||[]).forEach(function(s){
    push("store", s.title, amRegionName(s.region, s.gu), "/stores",
      amScore(s.title+" "+amIndustryName(s.industry), words));
  });
  (window.AM_ASSETS||[]).forEach(function(a){
    push("asset", a.title, amRegionName(a.region, a.gu), "/assets",
      amScore(a.title+" "+(a.brand||"")+" "+amIndustryName(a.industry), words));
  });
  /* ⚠️⚠️ **글은 본문까지 검색감입니다** (2026-10-01).
     전에는 제목과 머리말만 봤습니다. 그런데 손님은 글 제목을 치지
     않습니다 — "배달" · "간이과세" · "보건증" 이라고 칩니다. 그 낱말이
     **글 본문에는 다 있는데** 검색은 0건을 냈습니다. 사이트가 답을
     들고 있으면서 못 찾아 주는 셈이라, `/faq` 와 같은 방식으로
     바꿨습니다 (거기도 "답 본문 전체" 를 씁니다).

     ⚠️ 제목이 맞은 글이 본문만 맞은 글보다 **위로** 와야 합니다 —
     그래서 제목 · 머리말에 가중치 3 을 주고 본문은 1 입니다. 안 그러면
     "원상복구" 를 쳤을 때 그 말이 스쳐 지나가는 긴 글이 정작 원상복구
     글보다 위에 앉습니다. */
  (window.AM_CONTENTS||[]).forEach(function(c){
    push("content", c.title, c.lead, "/content/"+c.slug,
      amScore(c.title+" "+c.lead, words) * 3 + amScore(amContentText(c), words));
  });

  /* ⚠️⚠️ **지원사업 공고도 검색감입니다.** 전에는 색인에 아예 없어서,
     "소상공인" · "정책자금" · "간판 지원" 을 쳐도 공고가 안 나왔습니다.
     기한이 있는 것이라 못 찾으면 **기회를 놓치는** 쪽입니다.

     ⚠️ **`amSupports()` 를 거칩니다** — `link`(공고 원문) 없는 항목은
     화면에 안 나오는데 검색에만 나오면, 눌러 들어간 자리에 그 공고가
     없습니다. 거르는 규칙이 두 곳에서 갈리면 안 됩니다.

     ⚠️ 기관 이름(`org`)과 대상(`who`)까지 검색감입니다 — 손님은 공고
     이름을 모르고 "소상공인시장진흥공단" 이나 "폐업" 이라고 칩니다. */
  (typeof amSupports === "function" ? amSupports() : []).forEach(function(x){
    push("support", x.name, (x.org || "") + (x.when ? " · " + x.when : ""), "/support",
      amScore(x.name + " " + (x.org||""), words) * 3 +
      amScore([x.who, x.what, x.amount].filter(Boolean).join(" "), words));
  });
  } /* if(AM_SEARCH_BIZ) — 창업 · 폐업 색인 끝 */

  /* ⚠️ 자주 묻는 것은 **질문과 답 본문 전체**를 검색감으로 씁니다.
     손님은 "자주 묻는 것" 이라고 치지 않고 "무료" · "연락처" ·
     "환불" 이라고 칩니다. */
  (window.AM_FAQ || []).forEach(function(x){
    push("info", x.q, "자주 묻는 것", "/faq", amScore(x.q+" "+x.a, words));
  });

  /* ⚠️ 가는 곳이 같은 줄은 하나만 냅니다 — 같은 줄이 두세 개 나란히
     뜨면 검색이 고장난 것처럼 보입니다. */
  var total = 0;
  var groups = Object.keys(G).map(function(k){
    var seen = {};
    G[k].rows = G[k].rows.sort(function(a,b){ return b.s - a.s; })
      /* ⚠️⚠️ **같은 주소를 가리키는 서로 다른 줄이 있습니다.** 지원사업은
         공고마다 상세 화면이 없어서 **전부 `/support`** 로 갑니다 — 주소만
         보고 걸러내면 공고가 몇 건이든 **검색에 한 건만** 나옵니다.
         걸러내려던 것은 **같은 줄이 두 번** 나오는 것이라 이름까지 봅니다. */
      .filter(function(r){ var id = r.name + "|" + r.to;
        if(seen[id]) return false; seen[id] = 1; return true; })
      .slice(0, 12);
    total += G[k].rows.length;
    return G[k];
  });
  return { total:total, groups:groups };
};

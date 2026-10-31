/* ════════════════════════════════════════════════════════════════════
   통합검색 (§43)

   결과를 **기종 · 중고폰 상품 · 폰웨이 서비스 · 자주 묻는 것**
   넷으로 나눠서 보여 줍니다.

   ⚠️⚠️ **2026-10-31 — 창업 · 폐업 묶음 아홉을 껐습니다**(`AM_SEARCH_BIZ`).
   업체 · 프랜차이즈 · 매장 · 시설장비 · 분류 · 정보 · 공고 · 도구 ·
   여정이 거기 있었고, 그 157개 주소가 `vercel.json` 에서 308 로 `/` 에
   갑니다 — 검색에 남겨 두면 눌러도 메인으로 튕깁니다.
   ⚠️ 되살리시려면 그 값을 `true` 로 두고, `check.js` 의
   "검색이 기종과 상품을 같이 찾는다" 도 **그날 같이** 되돌리세요.

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
  /* ⚠️⚠️ **2026-10-31 — 창업 · 폐업 색인 묶음 아홉을 지웠습니다.**
     사장님 지시("그냥 인수인계 자료를 다 지워 · 중고폰 쪽은 살려두고").
     지운 묶음 — 업체 · 프랜차이즈 · 매장 · 시설 · 분류 · 업종 ·
     정보 · 도구 · 지원사업.
     ⚠️ 그 157개 주소는 `vercel.json` 이 **308 로 `/` 에** 보냅니다 —
     색인에 두면 검색 결과를 눌러도 메인으로 튕기고, 손님에게는 그게
     **검색이 고장난 것**으로 읽힙니다.
     ⚠️ 꺼내 보시려면 `git show 6d85a17:js/pages/search.js`. 그날
     `vercel.json` 의 redirect 와 `js/app.js` 의 라우터도 같이 되돌리세요. */

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

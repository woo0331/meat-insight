

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

function amScore(hay, words){
  var n = 0, hit = 0, low = hay.toLowerCase();

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

  return words.length > 1 ? n * hit : n;
}

window.amSearch = function(q){
  var words = q.toLowerCase().split(" ").filter(Boolean);
  var G = {

    model:{ name:"기종", rows:[] }, shop:{ name:"중고폰 상품", rows:[] },
    page:{ name:"폰웨이 서비스", rows:[] },

    info:{ name:"자주 묻는 것", rows:[] }
  };
  function push(g, name, sub, to, score){ if(score > 0) G[g].rows.push({name:name,sub:sub,to:to,s:score}); }

  (window.AM_MODELS || []).forEach(function(m){
    var mk = (typeof amMakerName === "function") ? amMakerName(m.maker) : "";
    var kd = (typeof amKindName === "function") ? amKindName(m.kind) : "";
    push("model", m.name, mk + (kd ? " · " + kd : ""),
      "/sell?mk=" + encodeURIComponent(m.maker) +
      "&kd=" + encodeURIComponent(m.kind) +
      "&md=" + encodeURIComponent(m.key),
      amScore(m.name + " " + mk + " " + kd + " " + (m.en || ""), words) * 2);
  });

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

  [ { to:"/sell",  kw:"중고폰 폰팔기 핸드폰 휴대폰 스마트폰 판매 매입 처분 중고" },
    { to:"/shop",  kw:"중고폰 구매 구입 사기 쇼핑몰 상품 중고 리퍼" },
    { to:"/bid",   kw:"경쟁입찰 입찰 최고가 견적비교 여러곳 비교 중고폰" },
    { to:"/track", kw:"진행 조회 접수번호 상태확인 어디까지 배송 입금" },
    { to:"/guide", kw:"이용안내 택배 발송 보내는법 절차 등급기준 초기화 개인정보 삭제 중고폰" },

    { to:"/repair", kw:"수리 액정 깨진 배터리 교체 충전 침수 카메라 버튼 스피커 고장 AS 사설" },
    { to:"/biz",   kw:"기업 법인 대량 단체 수출 해외 재고 임대폰 업무용 매입문의" }
  ].forEach(function(x){
    var m = (window.META || {})[x.to];
    if(!m) return;
    push("page", m[0], m[1], x.to,
      amScore(m[0] + " " + m[1] + " " + x.kw, words) * 2);
  });

  (window.AM_FAQ || []).forEach(function(x){
    push("info", x.q, "자주 묻는 것", "/faq", amScore(x.q+" "+x.a, words));
  });

  var total = 0;
  var groups = Object.keys(G).map(function(k){
    var seen = {};
    G[k].rows = G[k].rows.sort(function(a,b){ return b.s - a.s; })

      .filter(function(r){ var id = r.name + "|" + r.to;
        if(seen[id]) return false; seen[id] = 1; return true; })
      .slice(0, 12);
    total += G[k].rows.length;
    return G[k];
  });
  return { total:total, groups:groups };
};

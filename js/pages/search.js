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
    lead:"업체 · 프랜차이즈 · 매장 · 시설장비 · 정보를 한 번에 찾습니다.",
    tight:true
  })+
  '<section class="sec sec-white"><div class="w">'+
    '<form class="sb" onsubmit="return searchGo(event)">'+
      '<span class="sb-ic" aria-hidden="true">'+icon("search",20)+'</span>'+
      '<input id="sb-q" value="'+esc(q)+'" placeholder="카페 인테리어 · 안양 철거 · 미용실 POS · 카페 양도" '+
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
              '<a class="btn btn-o" href="/providers">분류로 찾기</a>'
        })))+
  '</div></section>';
}

function SearchHints(){
  var eg = ["카페 인테리어","안양 철거","미용실 POS","음식점 주방설비",
            "카페 양도","원상복구","폐업신고","권리금","세무사"];
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
  words.forEach(function(w){
    var i = 0, c = 0;
    while((i = low.indexOf(w, i)) >= 0 && c < 4){ c++; i += w.length; }
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
    provider:{ name:"업체", rows:[] }, franchise:{ name:"프랜차이즈", rows:[] },
    store:{ name:"매장 · 점포", rows:[] }, asset:{ name:"시설 · 장비", rows:[] },
    cat:{ name:"분류", rows:[] }, industry:{ name:"업종", rows:[] },
    content:{ name:"정보", rows:[] },
    support:{ name:"지원사업", rows:[] },
    /* ⚠️ `push()` 는 없는 묶음 이름을 받으면 그 자리에서 던집니다 —
       화면이 통째로 안 그려집니다. 묶음을 먼저 만드세요. */
    info:{ name:"자주 묻는 것", rows:[] }
  };
  function push(g, name, sub, to, score){ if(score > 0) G[g].rows.push({name:name,sub:sub,to:to,s:score}); }

  (window.AM_INDUSTRIES||[]).forEach(function(i){
    var s = amScore(i.name+" "+i.lead, words);
    push("industry", i.name+" 창업", i.lead, "/startup/"+i.key, s);
    push("industry", i.name+" 폐업", "정리에 필요한 것", "/closure/"+i.key, s ? s-0.5 : 0);
  });
  AM_CATS.forEach(function(c){
    var subs = (c.items||[]).map(function(x){ return x.name; }).join(" ");
    var s = amScore(c.name+" "+c.lead+" "+c.desc+" "+subs, words);
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
      .filter(function(r){ if(seen[r.to]) return false; seen[r.to] = 1; return true; })
      .slice(0, 12);
    total += G[k].rows.length;
    return G[k];
  });
  return { total:total, groups:groups };
};

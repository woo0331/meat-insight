

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

var AM_CT_TEXT = {};
function amContentText(c){

  if(AM_CT_TEXT[c.slug] !== undefined) return AM_CT_TEXT[c.slug];
  var out = [];
  (c.body || []).forEach(function(b){
    if(b.h) out.push(b.h);
    (b.p  || []).forEach(function(t){ out.push(t); });
    (b.ul || []).forEach(function(t){ out.push(t); });
  });

  return (AM_CT_TEXT[c.slug] = out.join(" ").split("**").join(""));
}

window.amSearch = function(q){
  var words = q.toLowerCase().split(" ").filter(Boolean);
  var G = {
    provider:{ name:"업체", rows:[] }, franchise:{ name:"프랜차이즈", rows:[] },
    store:{ name:"매장 · 점포", rows:[] }, asset:{ name:"시설 · 장비", rows:[] },
    cat:{ name:"분류", rows:[] }, industry:{ name:"업종", rows:[] },
    content:{ name:"정보", rows:[] },
    tool:{ name:"도구", rows:[] },
    support:{ name:"지원사업", rows:[] },

    info:{ name:"자주 묻는 것", rows:[] }
  };
  function push(g, name, sub, to, score){ if(score > 0) G[g].rows.push({name:name,sub:sub,to:to,s:score}); }

  (window.AM_INDUSTRIES||[]).forEach(function(i){

    var subs = (window.amIndSubs ? window.amIndSubs(i.key) : []).join(" ");
    var s = amScore(i.name+" "+i.lead+" "+subs, words);

    push("industry", i.name+" 창업", i.lead, "/startup/"+i.key, s);
    push("industry", i.name+" 폐업", "정리에 필요한 것", "/closure/"+i.key, s ? s-0.5 : 0);
  });

  (window.AM_STAGES || []).forEach(function(st){

    push("cat", st.name + " 단계", st.lead, "/g/" + st.key,
      amScore(st.name + " " + st.lead + " " + st.sub, words) * 2);
  });

  (window.AM_JOURNEYS || []).forEach(function(j){
    push("cat", j.name, j.q, j.to,
      amScore(j.name + " " + j.q + " " + j.lead + " " + j.sub, words) * 2);
  });

  (window.AM_TOOLS || []).forEach(function(t){
    push("tool", t.name, t.lead, t.to,
      amScore(t.name + " " + t.lead + " " + (t.ask||"") + " " + (t.out||""), words) * 2);
  });
  AM_CATS.forEach(function(c){
    var subs = (c.items||[]).map(function(x){ return x.name; }).join(" ");

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

  (window.AM_CONTENTS||[]).forEach(function(c){
    push("content", c.title, c.lead, "/content/"+c.slug,
      amScore(c.title+" "+c.lead, words) * 3 + amScore(amContentText(c), words));
  });

  (typeof amSupports === "function" ? amSupports() : []).forEach(function(x){
    push("support", x.name, (x.org || "") + (x.when ? " · " + x.when : ""), "/support",
      amScore(x.name + " " + (x.org||""), words) * 3 +
      amScore([x.who, x.what, x.amount].filter(Boolean).join(" "), words));
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

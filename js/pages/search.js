/* ════════════════════════════════════════════════════════════════════
   검색 (/search)

   글 12편 · 서비스 30개 · 문제 12개 · 창업 20단계가 쌓이면, 손님은
   메뉴를 훑는 대신 **찾습니다.** 백엔드가 없어도 됩니다 — 찾을 것이
   전부 이미 브라우저에 있습니다.

   ⚠️ **못 찾았을 때가 더 중요합니다.** "검색 결과가 없습니다" 로
   끝내면 손님은 그냥 나갑니다. 우리는 그 자리에서 **적어서 물어보는
   길**을 냅니다 — 그게 이 사이트가 하는 일이기도 합니다.

   ⚠️ 손님이 적은 말을 화면에 그대로 찍는 자리가 많습니다.
   전부 esc() 를 통과시킵니다 (절대 규칙 4).
   ════════════════════════════════════════════════════════════════════ */

/* 찾을 것을 한 벌로 모읍니다. 화면을 열 때 한 번만 만듭니다. */
var SEARCH_IX = null;
function searchIndex(){
  if(SEARCH_IX) return SEARCH_IX;
  var ix = [];

  (window.WOW_POSTS || []).forEach(function(p){
    var body = (p.body||[]).map(function(s){
      return [s.h].concat(s.p||[], s.list||[], [s.note||"", s.warn||""]).join(" ");
    }).join(" ");
    ix.push({ kind:"post", icon:p.icon || "doc",
      title:p.title, line:p.lead, to:"/lab/"+p.slug,
      tag:wowPostCatName(p.cat) || "연구소",
      hay:[p.title, p.lead, body, (p.check||[]).join(" ")].join(" ") });
  });

  (window.WOW_SERVICES || []).forEach(function(s){
    ix.push({ kind:"svc", icon:"doc",
      title:s.name, line:(s.line || s.groupName)+" 견적을 받아 드립니다",
      to:"/request?s="+encodeURIComponent(s.key), tag:"견적 요청",
      hay:[s.name, s.line, s.groupName].join(" ") });
  });

  (window.WOW_PROBLEMS || []).forEach(function(p){
    ix.push({ kind:"prob", icon:p.icon || "chat",
      title:p.name+" 문제", line:(p.hint||"")+" — 상황을 적어 주시면 정리해 드립니다",
      to:p.to || ("/sos?c="+encodeURIComponent(p.key)), tag:"물어보기",
      hay:[p.name, p.hint].join(" ") });
  });

  (window.WOW_STARTUP_STEPS || []).forEach(function(s){
    ix.push({ kind:"step", icon:s.icon || "seed",
      title:"창업 — "+s.name, line:s.line || "창업 단계에서 보는 것",
      to:"/start", tag:"창업 단계",
      hay:[s.name, s.line].join(" ") });
  });

  (window.WOW_CHECK || []).forEach(function(c){
    ix.push({ kind:"chk", icon:c.icon || "gauge",
      title:"진단 — "+c.name, line:c.why || "", to:"/check", tag:"사업진단",
      hay:[c.name, c.why].join(" ") });
  });

  /* 화면 자체도 찾아집니다 — "견적 비교" 를 치면 그 화면이 나와야 합니다 */
  [["사장님 SOS","무엇이든 적어서 물어보는 곳","/sos","alert"],
   ["무료 사업진단","8가지로 지금 상태를 정리합니다","/check","gauge"],
   ["창업 프로젝트","20단계를 순서대로","/start","seed"],
   ["창업비 정리표","빠뜨리기 쉬운 13칸","/start/cost","won"],
   ["견적 비교","받으신 견적을 나란히 놓고","/quotes","scale"],
   ["업체 찾기","무엇이 필요하신지 고르면 최대 세 곳","/partners","search"],
   ["사장님 연구소","고기 장사에 필요한 글","/lab","doc"],
   ["MY BUSINESS","지금까지 하신 것","/my","user"],
   ["파트너 등록","업체로 등록하기","/partner/apply","users"],
   ["ABOUTMEAT 소개","무엇을 하고 무엇을 안 하는가","/about","info"]
  ].forEach(function(r){
    ix.push({ kind:"page", icon:r[3], title:r[0], line:r[1], to:r[2], tag:"화면",
              hay:r[0]+" "+r[1] });
  });

  ix.forEach(function(r){ r.hay = String(r.hay||"").toLowerCase(); });
  SEARCH_IX = ix;
  return ix;
}

/* 낱말을 다 품고 있으면 맞은 것으로 봅니다.
   ⚠️ 한글은 형태소가 붙습니다 — "덕트가" 로 쳐도 "덕트" 를 찾아야
   하므로, 낱말 자체를 통째로 품는지만 봅니다. */
function searchRun(q){
  var words = String(q||"").toLowerCase().split(/[\s,·]+/).filter(Boolean);
  if(!words.length) return [];
  return searchIndex().map(function(r){
    var score = 0, all = true;
    words.forEach(function(w){
      if(r.hay.indexOf(w) < 0){ all = false; return; }
      score += 1;
      if(r.title.toLowerCase().indexOf(w) >= 0) score += 3;   /* 제목에 있으면 위로 */
    });
    return all ? { r:r, score:score } : null;
  }).filter(Boolean)
    .sort(function(a,b){ return b.score - a.score; })
    .map(function(x){ return x.r; });
}

function PageSearch(){
  var q = nowQS("q");
  var hits = q ? searchRun(q) : [];

  return '<div class="w srch">'+
    '<h1 class="pg-h1">무엇을 찾으세요?</h1>'+
    '<form class="srch-f" onsubmit="return srchGo(event)">'+
      '<label class="sr" for="sq">찾을 말</label>'+
      '<span class="srch-ic" aria-hidden="true">'+icon("search",20)+'</span>'+
      '<input id="sq" type="search" value="'+esc(q)+'" autocomplete="off"'+
        ' placeholder="덕트 · 원가율 · 창업비 · 인허가 …">'+
      '<button class="btn btn-b" type="submit">찾기</button>'+
    '</form>'+

    (!q
      ? '<div class="srch-hint">'+
          '<p class="note">많이 찾으시는 것</p>'+
          '<ul class="chips">'+["덕트","원가율","거래처","냉장고","창업비","인허가","주휴수당","2호점"]
            .map(function(w){
              return '<li><a href="/search?q='+encodeURIComponent(w)+'">'+esc(w)+'</a></li>';
            }).join("")+'</ul>'+
        '</div>'
      : hits.length
        ? '<p class="srch-n"><b>'+esc(q)+'</b> — '+hits.length+'개를 찾았습니다.</p>'+
          '<ul class="srch-l">'+hits.slice(0,30).map(function(r){
            return '<li><a href="'+esc(r.to)+'">'+
              '<span class="srch-r-ic">'+icon(r.icon,20)+'</span>'+
              '<span class="srch-r-t"><em>'+esc(r.tag)+'</em>'+
                '<b>'+esc(r.title)+'</b>'+
                '<span>'+esc(r.line)+'</span></span>'+
              '<span class="srch-r-go">'+icon("chev",16)+'</span></a></li>';
          }).join("")+'</ul>'
        /* ⚠️ 못 찾았을 때가 더 중요합니다. 여기서 끝내지 않습니다. */
        : '<div class="srch-none">'+
            '<b>'+esc(q)+' 로는 찾지 못했습니다.</b>'+
            '<p>글에 없는 것일 수 있습니다. 그대로 적어서 물어봐 주시면 '+
              '무엇이 필요한 일인지부터 같이 정리하겠습니다. 비용은 들지 않습니다.</p>'+
            '<div class="row-cta">'+
              '<a class="btn btn-b btn-lg" href="/sos?q='+encodeURIComponent(q)+'">'+
                '이대로 물어보기'+icon("arrow",18)+'</a>'+
              '<a class="btn btn-o btn-lg" href="/lab">연구소 글 보기</a>'+
            '</div>'+
          '</div>')+
  '</div>';
}

window.srchGo = function(ev){
  ev.preventDefault();
  var el = $("sq"), v = el ? String(el.value||"").trim() : "";
  go("/search" + (v ? "?q="+encodeURIComponent(v) : ""));
  return false;
};

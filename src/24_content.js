/* ════════════════════════════════════════════════════════════════════
   지어낸 콘텐츠 제거 · 운영자가 채우는 자리로 교체

   홈에 예시로 넣어둔 데이터가 실제 정보처럼 읽히고 있었습니다.
     · 축산 뉴스 — "ASF 방역 강화…전국 일제 점검",
       "농식품부, 축산 수급 안정 대책 발표", "수입육 관세 인하 검토"
       → 실제 기관·정책을 지목한 가짜 헤드라인. 방역 관련 허위정보는
         특히 위험합니다.
     · 실시간 매물 — "한우 유망 100kg / 경기 안성 / 5분 전" 처럼
       지역·시각까지 붙어 진짜 매물로 읽혔습니다.
     · 커뮤니티 인기글 — 가짜 글 제목과 가짜 댓글 수.
     · 고리페이 "안심결제" — 결제 코드가 한 줄도 없는데 홈 상단에
       광고되고 있었습니다. 에스크로는 전자금융거래법 대상입니다.

   기능과 화면은 그대로 두고, 내용만 site-info.js 에서 채우도록 바꿉니다.
   비어 있으면 각 칸에 "준비 중" 안내가 나옵니다.
   ════════════════════════════════════════════════════════════════════ */

var CT = {};

function ctCfg(){ return (typeof window.GORI_CONTENT==="object" && window.GORI_CONTENT) || {}; }
function ctFeat(){ return (typeof window.GORI_FEATURES==="object" && window.GORI_FEATURES) || {}; }
function ctList(k){ var v=ctCfg()[k]; return Array.isArray(v)?v:[]; }

function ctSoon(msg){
  return '<div class="ct-soon">'+esc(msg)+'</div>';
}
function ctLink(url){
  var u=String(url||"").trim();
  if(!u) return "";
  if(/^javascript:/i.test(u)) return "";
  return u;
}
function ctRow(icon, bg, title, meta, url){
  var u=ctLink(url);
  var open = u ? ' onclick="gCtOpen(\''+esc(u).replace(/'/g,"&#39;")+'\')" style="cursor:pointer;"' : '';
  return '<div class="news-row"'+open+'>'+
    '<div class="nr-thumb" style="background:'+bg+';display:flex;align-items:center;justify-content:center;font-size:16px;">'+icon+'</div>'+
    '<div><div class="nr-title">'+esc(title)+'</div>'+
    (meta?'<div class="nr-date">'+esc(meta)+'</div>':'')+'</div></div>';
}
window.gCtOpen=function(u){
  if(!u) return;
  if(/^https?:\/\//i.test(u)) window.open(u, "_blank", "noopener,noreferrer");
  else location.href=u;
};

/* ── 홈 위젯 ── */
function ctNews(){
  var el=$("news-widget"); if(!el) return;
  var rows=ctList("news");
  if(!rows.length){ el.innerHTML=ctSoon("등록된 뉴스가 없습니다. 운영자가 기사 링크를 넣으면 여기에 표시됩니다."); return; }
  el.innerHTML=rows.slice(0,5).map(function(n){
    return ctRow("📰","#E8F5E9", n.title, [n.source,n.date].filter(Boolean).join(" · "), n.url);
  }).join("");
}
function ctInsight(){
  var el=$("insight-widget"); if(!el) return;
  var rows=ctList("insights");
  if(!rows.length){ el.innerHTML=ctSoon("준비 중입니다. 창업·운영에 도움이 되는 글을 모아 올릴 예정입니다."); return; }
  el.innerHTML=rows.slice(0,5).map(function(n){
    return ctRow("💡","#FFF3E0", n.title, n.date||"", n.url);
  }).join("");
}
function ctProps(){
  var el=$("prop-widget"); if(!el) return;
  var rows=ctList("props");
  if(!rows.length){
    el.innerHTML=ctSoon("등록된 매물이 없습니다. 팔려는 물량이 있으면 업체로 등록하고 알려주세요.");
    return;
  }
  el.innerHTML=rows.slice(0,5).map(function(p){
    return '<div class="rq-row"'+(ctLink(p.url)?' onclick="gCtOpen(\''+esc(p.url)+'\')" style="cursor:pointer;"':'')+'>'+
      '<div class="rq-ico" style="background:#FFF8E1;">🥩</div>'+
      '<div class="rq-body"><div class="rq-title">'+esc(p.name||p.nm||"")+'</div>'+
      '<div class="rq-meta">'+esc(p.info||"")+'</div></div></div>';
  }).join("");
}
function ctComm(){
  var el=$("comm-widget"); if(!el) return;
  var rows=ctList("community");
  if(!rows.length){ el.innerHTML=ctSoon("커뮤니티는 준비 중입니다."); return; }
  el.innerHTML=rows.slice(0,5).map(function(c,i){
    return '<div class="comm-row"'+(ctLink(c.url)?' onclick="gCtOpen(\''+esc(c.url)+'\')" style="cursor:pointer;"':'')+'>'+
      '<div class="cr-rank">'+(i+1)+'</div><div style="flex:1;min-width:0;">'+
      '<div class="cr-title">'+esc(c.title)+'</div>'+
      (c.count?'<div style="font-size:10px;color:var(--ink4);">댓글 '+esc(c.count)+'</div>':'')+
      '</div></div>';
  }).join("");
}

/* ── 전체 화면(뉴스 / 커뮤니티) ── */
function ctNewsPage(){
  var el=$("news-full"); if(!el) return;
  var rows=ctList("news").concat(ctList("insights"));
  if(!rows.length){
    el.innerHTML='<div class="gempty"><div class="gempty-t">아직 등록된 소식이 없습니다</div>'+
      '<div class="gempty-d">업계 뉴스와 운영에 도움이 되는 글을 모아 올릴 예정입니다.<br>'+
      '먼저 필요한 것이 있으면 요청을 올려보세요.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;rw&quot;)">요청 올리기</button></div>';
    return;
  }
  el.innerHTML=rows.map(function(n){
    var u=ctLink(n.url);
    return '<div style="display:flex;gap:13px;padding:14px;background:#fff;border:1px solid var(--bd);border-radius:var(--r);'+
      (u?'cursor:pointer;':'')+'"'+(u?' onclick="gCtOpen(\''+esc(u)+'\')"':'')+'>'+
      '<div style="width:80px;height:60px;border-radius:8px;background:var(--bg2);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:22px;">📰</div>'+
      '<div><div style="font-size:14px;font-weight:700;color:var(--ink);margin-bottom:3px;">'+esc(n.title)+'</div>'+
      '<div style="font-size:12px;color:var(--ink4);">'+esc([n.source,n.date].filter(Boolean).join(" · "))+'</div></div></div>';
  }).join("");
}
function ctCommPage(){
  var ec=$("comm-cats"); if(ec) ec.innerHTML="";
  var el=$("comm-list-full"); if(!el) return;
  var rows=ctList("community");
  if(!rows.length){
    el.innerHTML='<div class="gempty"><div class="gempty-t">커뮤니티는 준비 중입니다</div>'+
      '<div class="gempty-d">현장에서 주고받을 이야기를 담을 공간을 준비하고 있습니다.<br>'+
      '지금은 요청과 견적으로 바로 연결됩니다.</div>'+
      '<button class="gbtn gbtn-p gbtn-sm" onclick="go(&quot;reqs&quot;)">실시간 요청 보기</button></div>';
    return;
  }
  el.innerHTML=rows.map(function(c){
    var u=ctLink(c.url);
    return '<div style="background:#fff;border:1px solid var(--bd);border-radius:var(--r);padding:14px;margin-bottom:9px;'+
      (u?'cursor:pointer;':'')+'"'+(u?' onclick="gCtOpen(\''+esc(u)+'\')"':'')+'>'+
      '<div style="font-size:14px;font-weight:700;color:var(--ink);margin-bottom:5px;">'+esc(c.title)+'</div>'+
      (c.count?'<div style="font-size:12px;color:var(--ink4);">댓글 '+esc(c.count)+'</div>':'')+'</div>';
  }).join("");
}

/* ── "샘플" 딱지 정리 · 만들지 않은 기능 숨기기 ── */
function ctTidy(){
  /* 내용이 실제로 들어온 칸에서는 샘플 딱지를 뗍니다 */
  var map=[["news-widget","news"],["insight-widget","insights"],["prop-widget","props"],["comm-widget","community"]];
  map.forEach(function(m){
    var box=$(m[0]); if(!box) return;
    var card=box.closest(".info-card") || box.parentNode;
    if(!card) return;
    var tag=card.querySelector(".sample-tag");
    if(tag && tag.parentNode) tag.parentNode.removeChild(tag);   /* 더 이상 샘플이 아닙니다 */
  });

  /* 고리페이 — 실제로 만들기 전에는 노출하지 않습니다 */
  if(!ctFeat().pay){
    var pay=document.querySelector(".gpay");
    if(pay){
      var sec=pay.closest("section") || pay.parentNode;
      if(sec) sec.hidden=true;
    }
  }
}

/* 소식·정보 섹션에 실제 내용이 하나도 없으면 섹션째 감춥니다.
   빈 칸 7개를 늘어놓는 것보다 낫고, 데이터가 들어오면 자동으로 다시 보입니다. */
var CT_BOXES=["prop-widget","rank-widget","new-sup-widget","news-widget",
              "insight-widget","job-widget","comm-widget"];
function ctInfoSection(){
  var host=$("prop-widget"); if(!host) return;
  var sec=host.closest("section"); if(!sec) return;
  var hasReal=CT_BOXES.some(function(id){
    var el=$(id); if(!el) return false;
    if(el.querySelector(".ct-soon")) return false;
    if(!el.children.length) return false;
    return !/없습니다|준비 중|아직 없어요/.test(el.textContent);
  });
  sec.hidden=!hasReal;
}

function patchContent(){
  if(CT._patched) return; CT._patched=true;

  /* 지어낸 배열을 비웁니다 (변수와 함수는 그대로 둡니다) */
  try{ if(typeof NEWS!=="undefined") NEWS=[]; }catch(e){}
  try{ if(typeof INSIGHTS!=="undefined") INSIGHTS=[]; }catch(e){}
  try{ if(typeof COMM_HOT!=="undefined") COMM_HOT=[]; }catch(e){}
  try{ if(typeof PROPS!=="undefined") PROPS=[]; }catch(e){}

  function after(fn){ return function(){ var r=fn.apply(this, arguments); try{ ctInfoSection(); }catch(e){} return r; }; }
  window.renderNewsWidget=after(ctNews);
  window.renderInsightWidget=after(ctInsight);
  window.renderPropWidget=after(ctProps);
  window.renderCommWidget=after(ctComm);
  window.renderNewsPage=ctNewsPage;
  window.renderComm=ctCommPage;

  /* 비동기로 채워지는 칸들도 그린 뒤 섹션 노출 여부를 다시 판단합니다 */
  ["renderRankWidget","renderNewSupWidget","renderJobWidget"].forEach(function(fn){
    var orig=window[fn];
    if(typeof orig!=="function") return;
    window[fn]=function(){ var r=orig.apply(this, arguments); try{ ctInfoSection(); }catch(e){} return r; };
  });

  ctNews(); ctInsight(); ctProps(); ctComm(); ctTidy(); ctInfoSection();
  setTimeout(ctInfoSection, 1500);
  setTimeout(ctInfoSection, 4000);

  var origGo=window.go;
  if(typeof origGo==="function"){
    window.go=function(p){
      var r=origGo.apply(this, arguments);
      if(p==="news") ctNewsPage();
      else if(p==="community") ctCommPage();
      else if(p==="h") setTimeout(ctInfoSection, 60);
      return r;
    };
  }
}

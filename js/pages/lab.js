/* ════════════════════════════════════════════════════════════════════
   사장님 연구소 — 목록(/lab)과 본문(/lab/:slug)

   이 화면이 "왜 여기를 써야 하는가" 에 답합니다. 업체를 연결해 주는
   곳은 많지만, **고기 장사를 안다**는 것은 글로만 증명됩니다.

   ⚠️ 글 안에서 "저희가 해 드립니다" 를 함부로 쓰지 않습니다. 우리가
   하는 일은 정리 · 매칭 · 견적까지입니다 (절대 규칙 5).

   ⚠️ 본문 끝의 체크리스트는 **이 브라우저에만** 남습니다. 서버로 보내지
   않습니다 — 가게 컴퓨터는 여러 사람이 씁니다.
   ════════════════════════════════════════════════════════════════════ */

var LAB_KEY  = "wow.lab.v1";     /* 체크리스트 */
var READ_KEY = "wow.read.v1";    /* 최근 본 글 (MY 에서 씁니다) */

function labLoad(k){
  try{ var o = JSON.parse(localStorage.getItem(k) || "{}");
       return (o && typeof o === "object") ? o : {}; }catch(e){ return {}; }
}
function labSave(k, o){ try{ localStorage.setItem(k, JSON.stringify(o)); }catch(e){} }

/* 본 글을 기억해 둡니다 — MY 화면이 "이어서 보기" 로 씁니다.
   ⚠️ 글 주소만 담습니다. 누가 봤는지는 담지 않습니다. */
window.labSeen = function(slug){
  try{
    var o = labLoad(READ_KEY);
    o[slug] = Date.now();
    /* 너무 쌓이지 않게 최근 20개만 */
    var keys = Object.keys(o).sort(function(a,b){ return o[b] - o[a]; }).slice(0, 20);
    var next = {}; keys.forEach(function(k){ next[k] = o[k]; });
    labSave(READ_KEY, next);
  }catch(e){}
};
window.labRecent = function(n){
  var o = labLoad(READ_KEY);
  return Object.keys(o)
    .sort(function(a,b){ return o[b] - o[a]; })
    .map(function(s){ return wowPost(s); })
    .filter(Boolean).slice(0, n || 3);
};

/* ── 목록 ─────────────────────────────────────────────────── */
function PageLab(){
  var cat  = nowQS("c") || "all";
  var list = wowPostsIn(cat);
  var tabs = [{ key:"all", name:"전체", icon:"list" }].concat(WOW_POST_CATS);

  return '<section class="pg-hero"><div class="w">'+
      '<p class="eyebrow">사장님 연구소</p>'+
      '<h1 class="pg-h1">알고 하면 덜 씁니다.</h1>'+
      '<p class="pg-lead">고기 장사를 하면서 실제로 막히는 것들을 정리했습니다. '+
        '원가 · 거래처 · 덕트 · 냉장 · 인허가 · 노무까지, '+
        '<b>읽고 나서 바로 할 수 있는 것</b>까지 적었습니다.</p>'+
      '<ul class="pg-facts">'+
        fact("check", "법령과 제도는 <b>어디서 확인하는지</b>까지 적었습니다.")+
        fact("info",  "근거를 댈 수 없는 시장 통계는 쓰지 않았습니다. "+
                      "\"평균 원가율 ○%\" 같은 말이 없는 이유입니다.")+
        fact("user",  "가입하지 않으셔도 전부 읽으실 수 있습니다.")+
      '</ul>'+
    '</div></section>'+

    '<div class="w lab">'+
      '<nav class="lab-tabs" aria-label="분류">'+tabs.map(function(t){
        var on = cat === t.key;
        var n  = t.key === "all" ? WOW_POSTS.length : wowPostsIn(t.key).length;
        return '<a class="lab-tab'+(on?" on":"")+'" href="/lab'+
          (t.key === "all" ? "" : "?c="+encodeURIComponent(t.key))+'"'+
          (on?' aria-current="page"':'')+'>'+
          icon(t.icon,18)+esc(t.name)+'<em>'+n+'</em></a>';
      }).join("")+'</nav>'+

      (list.length
        ? '<div class="lab-g">'+list.map(PostCard).join("")+'</div>'
        /* ⚠️ 빈 화면을 두지 않습니다 — 왜 비었고 지금 뭘 할 수 있는지 */
        : '<p class="lab-none">이 분류에는 아직 글이 없습니다. '+
          '<a href="/lab">전체 글</a>을 보시거나, 궁금하신 것을 바로 물어봐 주세요.</p>')+

      '<section class="st-cta">'+
        '<h2>글에 없는 것은 그냥 물어봐 주세요.</h2>'+
        '<p>사장님 가게 사정은 글과 다릅니다. 상황을 적어 주시면 '+
          '무엇이 필요한 일인지부터 같이 정리하겠습니다. 비용은 들지 않습니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/sos">무료로 물어보기'+icon("arrow",18)+'</a>'+
          '<a class="btn btn-o btn-lg" href="/check">무료 사업진단</a>'+
        '</div>'+
      '</section>'+
    '</div>';
}

/* 분류마다 그림이 두 벌 있습니다 (post-<분류>-0 · -1).
   ⚠️ 한 벌만 쓰면 같은 분류 카드 두 장이 **똑같아 보입니다** —
   목록에서 나란히 놓이면 바로 눈에 띕니다. 분류 안의 순서로 번갈아
   씁니다. 글이 늘어도 자동으로 나뉩니다. */
function postThumb(p){
  var same = wowPostsIn(p.cat), n = 0;
  for(var i = 0; i < same.length; i++) if(same[i].slug === p.slug){ n = i; break; }
  return "post-" + p.cat + "-" + (n % 2);
}

/* 목록 카드 — 메인(LabBand)도 같이 씁니다 */
window.PostCard = function(p){
  var cn = wowPostCatName(p.cat);
  return '<a class="pcard" href="/lab/'+esc(p.slug)+'">'+
    '<span class="pcard-ph">'+photoBox(postThumb(p))+
      '<span class="pcard-ic">'+icon(p.icon || "doc", 20)+'</span></span>'+
    '<span class="pcard-b">'+
      '<span class="pcard-m">'+(cn ? '<em>'+esc(cn)+'</em>' : '')+
        '<span>'+(p.read ? esc(p.read)+'분' : '')+'</span></span>'+
      '<b>'+esc(p.title)+'</b>'+
      '<span class="pcard-l">'+esc(p.lead)+'</span>'+
    '</span></a>';
};

/* ── 본문 ─────────────────────────────────────────────────── */
function PagePost(post){
  var done = labLoad(LAB_KEY)[post.slug] || {};
  var cn   = wowPostCatName(post.cat);
  var svc  = post.svc ? wowServiceName(post.svc) : null;
  var rel  = wowRelated(post, 3);

  return '<article class="w post">'+
    '<a class="back-l" href="/lab'+(post.cat?'?c='+encodeURIComponent(post.cat):'')+'">'+
      icon("back",18)+(cn ? esc(cn)+' 글 목록' : '연구소로')+'</a>'+

    '<header class="post-hd">'+
      '<p class="post-m">'+(cn ? '<em>'+esc(cn)+'</em>' : '')+
        (post.read ? '<span>'+esc(post.read)+'분이면 읽습니다</span>' : '')+
        (post.updated ? '<span>'+esc(post.updated)+' 고침</span>' : '')+'</p>'+
      '<h1>'+esc(post.title)+'</h1>'+
      '<p class="post-lead">'+esc(post.lead)+'</p>'+
    '</header>'+

    /* 목차 — 긴 글은 어디쯤인지 보여야 끝까지 읽힙니다 */
    (post.body.length > 2
      ? '<nav class="post-toc" aria-label="목차"><b>이 글에 있는 것</b><ol>'+
        post.body.map(function(s,i){
          return '<li><a href="#s'+i+'" onclick="postJump(event,'+i+')">'+esc(s.h)+'</a></li>';
        }).join("")+'</ol></nav>'
      : '')+

    '<div class="post-body">'+post.body.map(PostSection).join("")+'</div>'+

    (post.check && post.check.length ? PostCheck(post, done) : '')+

    /* ⚠️ 글은 알려 주는 것이고 도구는 해 보는 것입니다. 읽고 나서
       할 것이 없으면 그 글은 안 쓴 것과 같습니다. */
    (post.tool
      ? '<a class="post-tool" href="'+esc(post.tool[0])+'">'+
          '<span class="post-tool-ic">'+icon("gauge",22)+'</span>'+
          '<span class="post-tool-t"><em>읽으셨으면 바로 해 보세요</em>'+
            '<b>'+esc(post.tool[1])+'</b>'+
            '<span>'+esc(post.tool[2])+'</span></span>'+
          '<span class="post-tool-go">'+icon("arrow",18)+'</span></a>'
      : '')+

    '<section class="post-cta">'+
      '<h2>여기까지 보시고, 이제 어떻게 하시겠습니까?</h2>'+
      '<p>글로는 여기까지입니다. 사장님 가게를 봐야 아는 것은 '+
        '직접 여쭤보고 정리해 드립니다.</p>'+
      '<div class="row-cta">'+
        '<a class="btn btn-b btn-lg" href="/sos'+
          (post.ask ? '?q='+encodeURIComponent(post.ask) : '')+
          (post.cat === "cost" ? '&c=cost' : '')+'">'+
          '이 내용으로 물어보기'+icon("arrow",18)+'</a>'+
        (svc ? '<a class="btn btn-o btn-lg" href="/request?s='+encodeURIComponent(post.svc)+'">'+
               esc(svc)+' 견적 받기</a>' : '')+
      '</div>'+
    '</section>'+

    (rel.length
      ? '<section class="post-rel"><h2>같이 보시면 좋은 글</h2>'+
        '<div class="lab-g">'+rel.map(PostCard).join("")+'</div></section>'
      : '')+
  '</article>';
}

function PostSection(s, i){
  return '<section class="post-s" id="s'+i+'">'+
    '<h2>'+esc(s.h)+'</h2>'+
    (s.p || []).map(function(t){ return '<p>'+labMark(t)+'</p>'; }).join("")+
    (s.list && s.list.length
      ? '<ul class="post-l">'+s.list.map(function(t){
          return '<li>'+labMark(t)+'</li>'; }).join("")+'</ul>'
      : '')+
    (s.note ? '<p class="post-note">'+icon("info",18)+'<span>'+labMark(s.note)+'</span></p>' : '')+
    (s.warn ? '<p class="post-warn">'+icon("alert",18)+'<span>'+labMark(s.warn)+'</span></p>' : '')+
  '</section>';
}

/* 본문에서 **굵게** 만 허용합니다.
   ⚠️ 먼저 esc() 로 전부 막고, 그 다음에 별표 두 개만 되살립니다.
   순서를 바꾸면 글에 넣은 <img onerror=...> 가 남의 브라우저에서 돕니다. */
function labMark(t){
  return esc(t).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
}

window.postJump = function(ev, i){
  ev.preventDefault();
  var t = $("s"+i); if(!t) return;
  var hd = document.querySelector(".hd");
  var off = (hd ? hd.getBoundingClientRect().height : 0) + 16;
  window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - off,
                    behavior:"smooth" });
};

/* ── 체크리스트 ───────────────────────────────────────────── */
function PostCheck(post, done){
  var got = post.check.filter(function(_, i){ return done[i]; }).length;
  return '<section class="post-ck">'+
    '<div class="post-ck-h">'+
      '<b>'+icon("check",20)+'해 보셨는지 확인</b>'+
      '<span id="ck-n">'+got+' / '+post.check.length+'</span>'+
    '</div>'+
    '<ul class="post-ck-l">'+post.check.map(function(t, i){
      var on = !!done[i];
      return '<li class="'+(on?"on":"")+'">'+
        '<label><input type="checkbox" '+(on?"checked ":"")+
          'onchange="postCk(\''+esc(post.slug)+'\','+i+',this.checked)">'+
          '<span>'+labMark(t)+'</span></label></li>';
    }).join("")+'</ul>'+
    '<p class="note">체크한 것은 이 브라우저에만 남습니다. 서버로 보내지 않습니다.</p>'+
  '</section>';
}

window.postCk = function(slug, i, on){
  var all = labLoad(LAB_KEY);
  var one = all[slug] || (all[slug] = {});
  if(on) one[i] = 1; else delete one[i];
  labSave(LAB_KEY, all);
  /* ⚠️ 화면을 다시 그리지 않습니다 — 체크 하나 누를 때마다 맨 위로
     튀어 올라가면 사장님은 자기가 뭘 잘못 누른 줄 압니다. */
  var box = $("ck-n");
  var post = wowPost(slug);
  if(box && post){
    var n = post.check.filter(function(_, k){ return one[k]; }).length;
    box.textContent = n + " / " + post.check.length;
  }
  var li = document.activeElement && document.activeElement.closest("li");
  if(li) li.classList.toggle("on", !!on);
};

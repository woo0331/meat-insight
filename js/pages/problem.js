/* ════════════════════════════════════════════════════════════════════
   /problem/<key> — 문제별 해결 가이드

   선언한 흐름의 **가운데 두 칸**입니다.

     문제 입력 → **이해 → 해결방법** → 업체 찾기 → 견적 비교 → 계약

   ⚠️ 이 화면이 없으면 고민 카드가 곧장 "업체 찾기" 로 건너뛰고,
   그 순간 이 사이트는 지시서 3번이 금지한 **전화번호부**가 됩니다.

   화면 순서에 뜻이 있습니다 — **사장님이 실제로 하실 순서**입니다.
     1. 지금 무슨 상황인지          (intro)
     2. 위험하면 먼저 멈추기        (warn)   ← 있으면 제일 위
     3. 5분 안에 직접 확인할 것     (self)
     4. 먼저 의심할 것              (causes)
     5. 업체에 미리 알려 줄 것      (tell)
     6. 견적 받을 때 물어볼 것      (ask)    ← 이 사이트의 핵심 자산
     7. 법 · 제도와 어디서 확인하는지 (law)
     8. 그래서 지금 할 수 있는 것    (CTA)

   ⚠️ **순서를 바꾸지 마세요.** "물어볼 것" 을 위로 올리면 아직 무슨
   문제인지도 모르는 분께 질문지부터 들이미는 꼴이 됩니다.
   ⚠️ 데이터에 있는 문장에는 `**굵게**` 표시가 들어 있습니다.
   `labMark()` 가 **`esc()` 를 먼저 통과시킨 다음** 별표만 되살립니다 —
   순서를 바꾸면 넣어 둔 `<img onerror=…>` 가 돕니다.
   ════════════════════════════════════════════════════════════════════ */

/* 굵게 표시 한 가지만 허용합니다. ⚠️ lab.js 의 labMark 와 같은 일을
   하지만 **그 함수를 여기서 부릅니다** — 같은 이름을 또 만들면 나중에
   로드 순서에 따라 한쪽이 다른 쪽을 덮어씁니다 (이 저장소에서
   ScoreRing 으로 실제로 겪었습니다). */

function PageProblem(g){
  var prob = wowProblem(g.key);
  var svc  = g.svc ? wowServiceName(g.svc) : null;
  var post = g.post ? wowPost(g.post) : null;
  var tone = prob && prob.tone ? ' '+ tnClass(prob.tone) : '';

  return '<article class="w gd">'+

    '<a class="back-l" href="/#worry">'+icon("back",18)+'다른 고민 보기</a>'+

    '<header class="gd-hd'+tone+'">'+
      '<p class="gd-m">'+
        '<span class="tbadge">'+(prob ? icon(prob.icon,15) : '')+
          esc(prob ? prob.name : "고민")+'</span>'+
        '<span>업체를 부르기 전에 읽는 글</span></p>'+
      '<h1>'+esc(g.h1)+'</h1>'+
      '<p class="gd-lead">'+esc(g.lead)+'</p>'+
    '</header>'+

    '<div class="gd-intro">'+
      g.intro.map(function(t){ return '<p>'+labMark(t)+'</p>'; }).join("")+
    '</div>'+

    /* ⚠️ 위험 신호는 **제일 위**입니다. 아래에 두면 확인하다가
       다치거나 고기를 전부 잃은 뒤에 읽게 됩니다. */
    (g.warn && g.warn.length
      ? '<section class="gd-warn">'+
          '<b>'+icon("alert",20)+'이건 먼저 멈추세요</b>'+
          '<ul>'+g.warn.map(function(t){
            return '<li><span>'+labMark(t)+'</span></li>'; }).join("")+'</ul>'+
        '</section>'
      : '')+

    GdStep(1, "지금 5분 안에 직접 확인해 보세요",
      "업체를 부르기 전에 여기서 끝나는 것이 생각보다 많습니다.",
      '<ol class="gd-self">'+g.self.map(function(t,i){
        return '<li><i aria-hidden="true">'+(i+1)+'</i><span>'+labMark(t)+'</span></li>';
      }).join("")+'</ol>')+

    GdStep(2, "먼저 의심할 것",
      "같은 증상이라도 원인이 다르면 처방이 다릅니다.",
      '<div class="gd-cz">'+g.causes.map(function(c){
        return '<div class="gd-cz-i'+tone+'">'+
          '<b>'+esc(c.t)+'</b><p>'+labMark(c.d)+'</p></div>';
      }).join("")+'</div>')+

    GdStep(3, "업체에 미리 알려 주세요",
      "이것만 같이 보내시면 견적이 정확해지고, 기사가 두 번 오지 않습니다.",
      '<ul class="gd-tell">'+g.tell.map(function(t){
        return '<li>'+icon("check",16)+'<span>'+labMark(t)+'</span></li>';
      }).join("")+'</ul>')+

    /* ⚠️ 여기가 이 사이트가 다른 이유입니다. 업체를 대 주는 곳은
       많고, **무엇을 물어봐야 하는지** 알려 주는 곳은 없습니다. */
    GdStep(4, "견적 받을 때 이걸 물어보세요",
      "세 곳에 **같은 질문**을 하셔야 견적이 비교가 됩니다.",
      '<ol class="gd-ask">'+g.ask.map(function(t,i){
        return '<li><i aria-hidden="true">Q'+(i+1)+'</i>'+
               '<span>'+labMark(t)+'</span></li>';
      }).join("")+'</ol>'+
      '<p class="gd-ask-n">이 질문들은 요청서에도 그대로 들어갑니다 — '+
      '따로 적지 않으셔도 됩니다.</p>'+
      /* ⚠️ 흐름의 마지막 칸으로 잇는 자리입니다. 질문 바로 아래여야
         합니다 — 맺음까지 내리면 "받은 다음에 뭘 하지" 가 끊깁니다. */
      '<a class="gd-ask-go" href="/quotes?g='+esc(g.key)+'">'+
        '<span class="gd-ask-go-ic">'+icon("scale",20)+'</span>'+
        '<span class="gd-ask-go-t"><b>견적을 받으셨으면 나란히 놓아 보세요</b>'+
          '<span>업체마다 이 질문에 뭐라고 했는지 적어 두시면, '+
            '어디가 무엇을 빼고 계산했는지 보입니다.</span></span>'+
        '<span class="gd-ask-go-a">'+icon("arrow",18)+'</span></a>')+

    (g.law
      ? '<section class="gd-law">'+
          '<p class="gd-law-k">'+icon("shield",16)+'법 · 제도</p>'+
          '<b>'+esc(g.law.t)+'</b>'+
          '<p>'+labMark(g.law.d)+'</p>'+
          /* ⚠️ 법령은 바뀝니다. **어디서 확인하는지**를 반드시
             같이 적습니다 — 조문만 적으면 틀린 날이 옵니다. */
          /* ⚠️ 값을 **<span> 으로 감쌉니다.** 안 감싸면 <em> 만 덩어리인
             칸에 맨 글자가 섞여 "문장 속 덩어리" 가 됩니다 — 전수 점검이
             실제로 세 건을 잡았습니다. */
          '<p class="gd-law-w"><em>확인하는 곳</em>'+
            '<span>'+esc(g.law.where)+'</span></p>'+
        '</section>'
      : '')+

    GdEnd(g, svc, post)+
  '</article>';
}

/* 단계 한 칸. ⚠️ 제목을 <h2> 로 두어야 화면 제목이 h1 하나로
   유지됩니다 (check.js 의 "화면 제목(h1)" 이 봅니다). */
function GdStep(n, h, lead, inner){
  return '<section class="gd-s">'+
    '<div class="gd-s-h">'+
      '<span class="gd-s-n" aria-hidden="true">'+n+'</span>'+
      '<span class="gd-s-t"><h2>'+esc(h)+'</h2>'+
        (lead ? '<p>'+labMark(lead)+'</p>' : '')+'</span>'+
    '</div>'+ inner +
  '</section>';
}

/* 맺음 — ⚠️ "여기까지 읽었으니 이제 뭘 하지" 에 답이 없으면 그냥
   나갑니다. 지금 당장 되는 것만 냅니다 (접수처가 없어도 되는 것). */
function GdEnd(g, svc, post){
  return '<section class="gd-end">'+
    '<h2>그래서 지금 하실 수 있는 것</h2>'+
    '<div class="gd-end-g">'+

      '<a class="gd-end-c" href="/sos?q='+encodeURIComponent(g.ask0)+
        '&c='+encodeURIComponent(g.key)+'">'+
        '<b>이 내용으로 물어보기</b>'+
        '<span>적어 주시면 상황을 정리해서 맞는 곳을 찾아 드립니다. '+
          '가입 없이 됩니다.</span>'+
        '<em>무료로 물어보기'+icon("arrow",16)+'</em></a>'+

      (svc
        ? '<a class="gd-end-c" href="/request?s='+encodeURIComponent(g.svc)+'">'+
            '<b>'+esc(svc)+' 견적 받기</b>'+
            '<span>위의 질문들이 들어간 요청서로 갑니다. 조건이 맞는 곳 '+
              '최대 세 군데에만 보냅니다.</span>'+
            '<em>요청서 쓰기'+icon("arrow",16)+'</em></a>'
        : '')+

      (g.tool
        ? '<a class="gd-end-c" href="'+esc(g.tool[0])+'">'+
            '<b>'+esc(g.tool[1])+'</b>'+
            '<span>사장님 숫자를 넣으시면 그 자리에서 나옵니다. '+
              '서버로 보내지 않습니다.</span>'+
            '<em>계산해 보기'+icon("arrow",16)+'</em></a>'
        : '')+

      (g.also
        ? '<a class="gd-end-c" href="'+esc(g.also[0])+'">'+
            '<b>'+esc(g.also[1])+'</b>'+
            '<span>'+esc(g.also[2])+'</span>'+
            '<em>보러 가기'+icon("arrow",16)+'</em></a>'
        : '')+

      (post
        ? '<a class="gd-end-c" href="/lab/'+esc(post.slug)+'">'+
            '<b>'+esc(post.title)+'</b>'+
            '<span>'+esc(post.lead)+'</span>'+
            '<em>읽어 보기'+icon("arrow",16)+'</em></a>'
        : '')+
    '</div>'+

    /* 다른 고민으로 — 막다른 길을 만들지 않습니다 */
    '<div class="gd-more"><b>다른 고민도 있으신가요?</b>'+
      '<div class="gd-more-g">'+
        WOW_PROBLEMS.filter(function(p){
          return p.key !== g.key && wowHasGuide(p.key);
        }).slice(0,5).map(function(p){
          return '<a class="gd-more-i '+tnClass(p.tone)+'" href="/problem/'+p.key+'">'+
            '<span class="gd-more-ic">'+icon(p.icon,18)+'</span>'+
            esc(p.name)+'</a>';
        }).join("")+
      '</div>'+
    '</div>'+
  '</section>';
}

/* 분류색 클래스. ⚠️ tone 이 없으면 **빈 문자열**입니다 — 그러면
   CSS 의 되돌림 값이 살아서 예전처럼 버건디로 나옵니다. */
function tnClass(tone){ return tone ? "tn"+tone.replace("t","") : ""; }

/* ════════════════════════════════════════════════════════════════════
   /problems — 고민별 해결방법 목록

   ⚠️ **업체 목록이 아닙니다** (지시서 3번). 여기 있는 것은 전부
   "문제" 이고, 누르면 가는 곳도 업체가 아니라 **해결방법**입니다.
   업체 이름 · 평점 · 시공건수를 여기에 만들지 마세요.
   ════════════════════════════════════════════════════════════════════ */
function PageProblems(){
  var gs = WOW_PROBLEMS.filter(function(p){ return wowHasGuide(p.key); });

  return '<section class="pg-hero"><div class="w pgh">'+
      '<div class="pgh-t">'+
        '<p class="eyebrow">고민별 해결방법</p>'+
        '<h1>업체를 부르기 전에,<br class="br-m"> 먼저 읽어 보세요.</h1>'+
        '<p class="pgh-l">고깃집 · 정육점에서 자주 나오는 고민을 '+
          '<b>직접 확인할 것</b>과 <b>업체에 물어볼 것</b>으로 정리했습니다. '+
          '가입도 접수도 없이 그냥 읽으시면 됩니다.</p>'+
        '<div class="row-cta">'+
          '<a class="btn btn-b btn-lg" href="/sos">여기 없는 고민 물어보기'+
            icon("arrow",18)+'</a>'+
        '</div>'+
      '</div>'+
      '<figure class="pgh-f">'+photoBox("hero-lab")+'</figure>'+
    '</div></section>'+

    '<section class="sec"><div class="w">'+
      '<div class="gdl-g">'+gs.map(GdListCard).join("")+'</div>'+

      /* ⚠️ 가이드가 없는 분류를 숨기지 않습니다. 숨기면 "여기서는 그건
         못 물어보나" 로 읽힙니다 — 물어보실 수는 있습니다. */
      '<div class="gdl-rest">'+
        '<b>아직 정리 중인 고민</b>'+
        '<p>글은 아직이지만 <b>물어보시는 것은 지금도 됩니다.</b> '+
          '적어 주시면 상황을 정리해서 맞는 곳을 찾아 드립니다.</p>'+
        '<div class="gdl-rest-g">'+
          WOW_PROBLEMS.filter(function(p){ return !wowHasGuide(p.key); })
          .map(function(p){
            return '<a class="gdl-rest-i" href="'+(p.to ? esc(p.to) : '/sos?c='+p.key)+'">'+
              icon(p.icon,16)+esc(p.name)+'</a>';
          }).join("")+
        '</div>'+
      '</div>'+
    '</div></section>';
}

function GdListCard(p){
  var g = wowGuide(p.key);
  return '<a class="gdl '+tnClass(p.tone)+'" href="/problem/'+p.key+'">'+
    '<span class="gdl-ic">'+icon(p.icon,24)+'</span>'+
    '<span class="gdl-b">'+
      '<b>'+esc(g.h1)+'</b>'+
      '<span class="gdl-l">'+esc(g.lead)+'</span>'+
      /* 몇 가지가 들어 있는지 — ⚠️ 지어낸 실적이 아니라 **이 화면에
         실제로 들어 있는 항목 수**입니다. 세어서 냅니다. */
      '<span class="gdl-n">'+
        '<em>직접 확인 '+g.self.length+'</em>'+
        '<em>물어볼 것 '+g.ask.length+'</em>'+
        (g.law ? '<em>법 · 제도</em>' : '')+
      '</span>'+
    '</span>'+
    '<span class="gdl-go">'+icon("arrow",18)+'</span></a>';
}

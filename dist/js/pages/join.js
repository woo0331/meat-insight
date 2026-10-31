

function PageJoin(){

  var subs = (window.AM_DEVICE_KINDS || []).map(function(k){
    return { cat:{ key:k.key, name:k.name, items:[] },
             items:(window.AM_MODELS || []).filter(function(m){
               return m.kind === k.key; }) };
  }).filter(function(g){ return g.items.length; });
  var ready = !!(window.WOW_BIZ && WOW_BIZ.sosReady);

  return PgHero({

    kicker:"중고폰 매입업체 · 전문 수리업체",
    h1raw:"기기를 팔려는 분과<br class=\"br-m\"> 바로 이어 드립니다.",
    lead:"상호와 취급 기기만 남겨 주시면, 조건이 맞는 건만 보내 드립니다. 입찰에 참여하시는 데 받는 비용은 없습니다.",

    cta:'<a class="btn btn-b btn-lg" href="#join-form">입점 신청하기'+icon("arrow",18)+'</a>'+
        '<a class="btn btn-o btn-lg" href="#join-fields">어떤 분야를 찾나요</a>'
  })+
  JoinNow(subs)+

  JoinSix()+
  JoinWhat()+

  JoinShow()+
  JoinWhy()+
  JoinHow()+
  JoinFields(subs)+
  JoinFaq()+
  JoinForm(ready);
}

var JOIN_WHERE = [
  { ic:"gavel",    t:"경쟁입찰",        p:"판매자가 올린 기기에 견적을 내는 자리", to:"/bid" },
  { ic:"compare",  t:"견적 비교 화면",  p:"판매자가 받은 견적을 나란히 놓고 보는 자리" },
  { ic:"mobile",   t:"기기 조건",       p:"기종 · 용량 · 외관 등급 · 상태가 적혀 옵니다", to:"/sell" },
  { ic:"doc",      t:"진행 조회",       p:"고르신 뒤의 수거 · 검수 · 정산 기록", to:"/track" }
];

function JoinSix(){
  var L = (window.AM_JOIN_SIX || []);
  if(!L.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">PARTNER Q&amp;A</p>'+
      '<h2>입점하면 무엇이 달라지나요?</h2>'+
      '<p>업체 사장님이 제일 먼저 묻는 여섯입니다. 지금 사실인 것만 적었습니다.</p>'+
    '</div>'+
    '<ul class="jn6">'+L.map(function(x){
      return '<li>'+
        '<p class="jn6-q">'+
          '<span class="ic-t">'+icon(x.ic,22)+'</span>'+
          '<b>'+esc(x.q)+'</b></p>'+
        '<p class="jn6-a">'+esc(x.a)+'</p>'+
        (x.to ? '<a class="jn6-go" href="'+esc(x.to)+'">'+esc(x.toN||"보기")+
          icon("arrow",15)+'</a>' : '')+
      '</li>'; }).join("")+'</ul>'+
  '</div></section>';
}

function JoinShow(){

  var sp = null;
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">입점하면 어디에 보이나</p>'+
      '<h2>등록 한 번으로 이 자리에 같이 올라갑니다</h2>'+
      '<p>따로 신청하실 것이 없습니다. 하시는 일과 지역이 맞는 자리에 저절로 나갑니다.</p>'+
    '</div>'+
    '<ul class="ops-g">'+JOIN_WHERE.map(function(w){
      var in1 = '<span class="ops-i">'+icon(w.ic,22)+'</span>'+
        '<b>'+esc(w.t)+'</b>';

      return '<li>'+(w.to
        ? '<a class="ops" href="'+esc(w.to)+'">'+in1+
          '<span class="ops-go" aria-hidden="true">'+icon("chev",15)+'</span></a>'
        : '<span class="ops">'+in1+'</span>')+'</li>';
    }).join("")+'</ul>'+
    (sp ? '<div class="jn-ex">'+
      '<p class="jn-ex-h"><b>업체 카드는 이렇게 보입니다</b>'+
        '<em>아래는 예시입니다 — 실제 업체가 아니고, 손님 화면 어디에도 나오지 않습니다.</em></p>'+
      '<div class="jn-ex-b"><span class="jn-ex-tag">예시</span>'+
        ProviderCard(sp)+
      '</div>'+
      '<p class="jn-ex-h"><b>상세 화면에는 이만큼 들어갑니다</b>'+
        '<em>사진 · 전문분야 · 전문업종 · 활동지역 · 가격 · 포트폴리오 · 확인 · 후기 · 상담 시간.</em></p>'+
      '<ul class="jn-ex-l">'+ joinExRows(sp).map(function(r){
        return '<li><b>'+esc(r[0])+'</b><span>'+esc(r[1])+'</span></li>'; }).join("")+'</ul>'+
      '<p class="sec-note">'+icon("info",15)+

        '평점과 후기 수는 값으로 저장하지 않습니다 — 손님이 쓰신 후기에서 계산합니다. '+
        '등록하실 때 적는 칸 자체가 없습니다.</p>'+
    '</div>' : '')+
  '</div></section>';
}

function joinExRows(p){
  var st = amProviderStats(p) || {};
  var rows = [
    ["전문 서비스", (p.subs||[]).map(amSubName).join(" · ")],
    ["전문 업종",   (p.industries||[]).map(amIndustryName).join(" · ")],
    ["활동 지역",   (p.regions||[]).map(amRegionName).concat(p.gu||[]).join(" · ")],
    ["포트폴리오",  (p.portfolio||[]).length + "건 — 공사 내용 · 업종 · 지역 · 연도 · 사진"],

    ["확인",        amProviderVerified(p).join(" · ") || "확인한 것만"],
    ["상담 가능 시간", p.consultHours || ""]
  ];
  if(st.rating != null)
    rows.push(["후기", "평점 " + st.rating + " · " + st.reviews + "건 (후기에서 계산한 값입니다)"]);

  return rows.filter(function(r){ return r[1]; });
}

function JoinNow(subs){
  var n = (window.AM_PROVIDERS || []).length;
  var open = !!(window.WOW_BIZ && WOW_BIZ.sosReady);

  var empty = subs.filter(function(g){
    return window.amProvidersInCat ? amProvidersInCat(g.cat) === 0 : true; }).length;

  return '<section class="sec sec-white"><div class="w">'+
    '<div class="jn-now">'+
      '<div class="jn-now-t">'+
        '<p class="eyebrow">지금 상태</p>'+
        (n
          ? '<h2>지금 <em>'+n+'곳</em>이 등록돼 있습니다.</h2>'+
            '<p class="lead">분야와 지역이 맞는 요청을 나눠 받습니다.</p>'
          : '<h2>아직 <em>아무도</em> 등록하지 않았습니다.</h2>'+
            '<p class="lead">부풀려 말씀드리지 않겠습니다. 지금 등록된 업체는 '+
              '0곳이고, 그래서 지금 들어오시면 그 분야의 <b>첫 번째</b>입니다.</p>')+
      '</div>'+
      '<ul class="jn-now-l">'+

        '<li><b>'+esc(open ? "열려 있습니다" : "아직 열지 않았습니다")+'</b>'+
          '<span>판매자 쪽 판매 신청 접수</span></li>'+
        '<li><b>'+(empty || subs.length)+'개 분야</b>'+
          '<span>'+esc(empty ? "아직 등록된 업체가 없습니다" : "업체를 받고 있습니다")+'</span></li>'+
        '<li><b>비용 없음</b><span>입찰 참여 · 프로필 관리</span></li>'+
      '</ul>'+
    '</div>'+
  '</div></section>';
}

function JoinWhat(){
  var f = (window.AM_JOIN_FIELDS || []);
  if(!f.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">무엇을 받게 되나</p>'+
      '<h2>요청은 이런 칸으로 옵니다</h2>'+
      '<p>사장님이 직접 적어 보내신 내용을 그대로 전달합니다. '+
        '받으실지 말지는 업체가 정하십니다.</p>'+
    '</div>'+
    '<div class="jn-req">'+
      '<ul class="jn-req-l">'+ f.map(function(x){
        return '<li><b>'+esc(x[0])+'</b><span>'+esc(x[1])+'</span></li>';
      }).join("")+'</ul>'+

      '<p class="jn-req-n">'+icon("lock",16)+
        '<span>성함과 연락처는 <b>여기 들어 있지 않습니다.</b> 업체가 '+
        '정해지면 사장님께 어느 업체인지 알려 드리고, 그때 다시 동의를 '+
        '받은 뒤에 전달합니다 (개인정보보호법 제17조).</span></p>'+
    '</div>'+
  '</div></section>';
}

function JoinWhy(){
  var w = (window.AM_JOIN_WHY || []);
  if(!w.length) return "";
  return '<section class="sec sec-white"><div class="w">'+
    '<div class="sec-hd">'+
      '<p class="eyebrow">약속</p>'+
      '<h2>업체에 이렇게 하겠습니다</h2>'+
      '<p>전부 <a href="/terms">이용약관</a>에 근거가 있는 말입니다. '+
        '약관과 다른 말을 화면에 적지 않습니다.</p>'+
    '</div>'+
    '<ul class="jn-why rv-stg">'+ w.map(function(x){
      return '<li data-rv><span class="jn-why-ic">'+icon(x.icon,22)+'</span>'+
        '<b>'+esc(x.t)+'</b><span class="jn-why-d">'+esc(x.d)+'</span></li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

function JoinHow(){
  var st = (window.AM_JOIN_STEPS || []);
  if(!st.length) return "";
  return '<section class="sec"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">어떻게 진행되나</p>'+
      '<h2>세 걸음이면 됩니다</h2></div>'+
    '<ol class="how-g">'+ st.map(function(x){
      return '<li class="how-i">'+
        '<span class="how-n">'+esc(x.n)+'</span>'+
        '<b class="how-t">'+esc(x.t)+'</b>'+
        '<span class="how-d">'+esc(x.d)+'</span>'+
      '</li>';
    }).join("")+'</ol>'+
  '</div></section>';
}

function JoinFields(subs){
  if(!subs.length) return "";

  return '<section class="sec sec-white" id="join-fields"><div class="w">'+
    '<div class="sec-hd"><p class="eyebrow">이런 곳을 찾고 있습니다</p>'+
      '<h2>이런 기기가 들어옵니다</h2>'+
      '<p>여기 없는 기종도 적어 주시면 목록에 넣어 드립니다.</p></div>'+
    '<div class="join-g is-fold-chips" id="jn-fields-g">'+subs.map(function(g){
      var show = g.items.slice(0, 6), more = g.items.length - show.length;
      var n = window.amProvidersInCat ? amProvidersInCat(g.cat) : 0;
      return '<div class="join-cat"><b>'+esc(g.cat.name)+

        '<i class="join-n'+(n ? "" : " join-n0")+'">'+
          esc(n ? n + "곳" : "아직 없음")+'</i></b>'+
        '<ul class="chip-g">'+show.map(function(i){
          return '<li><span class="chip chip-flat">'+esc(i.name)+'</span></li>';
        }).join("")+
        (more > 0 ? '<li><span class="chip chip-flat chip-more">외 '+more+'</span></li>' : '')+
        '</ul></div>';
    }).join("")+'</div>'+

    '<div class="jn-fold-w">'+
      FoldAll("jn-fields-g", "기종마다 어떤 모델인지 보기", "접기", "is-fold-chips")+
    '</div>'+
  '</div></section>';
}

function JoinFaq(){
  var f = (window.amJoinFaq ? amJoinFaq() : []);
  if(!f.length) return "";
  return '<section class="sec"><div class="w w-narrow">'+
    '<div class="sec-hd"><p class="eyebrow">업체가 자주 묻는 것</p>'+
      '<h2>먼저 궁금해하시는 것들</h2></div>'+

    '<ul class="faq-l">'+ f.map(function(x, i){
      var id = "jn-faq-" + i;
      return '<li class="faq-i">'+
        '<button class="faq-q" type="button" aria-expanded="false"'+
          ' aria-controls="'+esc(id)+'" onclick="faqToggle(this)">'+
          '<span>'+esc(x.q)+'</span>'+
          '<span class="faq-x" aria-hidden="true">'+icon("chevd",18)+'</span>'+
        '</button>'+
        '<p class="faq-a" id="'+esc(id)+'" hidden>'+esc(x.a)+'</p>'+
      '</li>';
    }).join("")+'</ul>'+
  '</div></section>';
}

function JoinForm(ready){
  return '<section class="sec sec-white" id="join-form"><div class="w form-wrap">'+
    '<h2 class="pg-h2">입점 신청</h2>'+
    (ready ? "" :

      '<div class="notice-bad"><b>지금은 이 양식으로 접수하지 못합니다.</b>'+
        '<p>접수처 설정이 끝나면 바로 열립니다. 그동안에도 '+
        '<a href="/bid">경쟁입찰</a>과 <a href="/guide">이용 안내</a>는 '+
        '그대로 보실 수 있습니다.</p></div>')+
    '<form id="join-f" onsubmit="return joinSend(event)">'+
      Field("jn-name","업체명","",true,"text","organization")+
      Field("jn-ceo","담당자 성함","",true,"text","name")+
      Field("jn-tel","연락처","010-0000-0000",true,"tel","tel")+
      Field("jn-mail","이메일","",false,"email","email")+
      '<div class="f-r"><label for="jn-svc">하시는 일 <b>*</b></label>'+
        '<input id="jn-svc" required placeholder="예: 아이폰 · 갤럭시 매입, 액정 수리"></div>'+
      '<div class="f-r"><label for="jn-reg">서비스 가능 지역 <b>*</b></label>'+
        RegionSelect("jn-reg","")+'</div>'+

      '<div class="f-r"><label for="jn-ind">취급 기기</label>'+
        '<input id="jn-ind" placeholder="예: 아이폰 전 기종, 갤럭시 S 시리즈"></div>'+
      '<div class="f-r"><label for="jn-note">소개 · 경력 · 포트폴리오 주소</label>'+
        '<textarea id="jn-note" rows="5" placeholder="하신 일과 자신 있는 것을 적어 주세요."></textarea></div>'+
      AgreeBox("jn-ag","업체명 · 담당자 성함 · 연락처 · 이메일 · 취급 기기 · 지역",
               "입점 심사와 안내", "입점 종료 후 1년")+
      '<div id="jn-fail"></div>'+
      '<button class="btn btn-b btn-lg btn-full" type="submit"'+(ready?"":" disabled")+'>'+
        '입점 신청하기'+icon("arrow",18)+'</button>'+
    '</form>'+
  '</div></section>';
}

window.Field = function(id, label, ph, req, type, auto){
  return '<div class="f-r"><label for="'+esc(id)+'">'+esc(label)+(req?' <b>*</b>':'')+'</label>'+
    '<input id="'+esc(id)+'" type="'+esc(type||"text")+'"'+(req?" required":"")+
    (auto?' autocomplete="'+esc(auto)+'"':'')+
    (ph?' placeholder="'+esc(ph)+'"':'')+'></div>';
};

window.AgreeBox = function(id, what, why, how){
  return '<div class="agree">'+
    '<label class="agree-l"><input type="checkbox" id="'+esc(id)+'">'+
      '<span>개인정보 수집 · 이용에 동의합니다 <b>*</b></span></label>'+
    '<ul class="agree-u">'+
      '<li><b>수집 항목</b> '+esc(what)+'</li>'+
      '<li><b>이용 목적</b> '+esc(why)+'</li>'+
      '<li><b>보유 기간</b> '+esc(how)+'</li>'+
    '</ul>'+
    '<p class="agree-n">업체에 성함 · 연락처를 전달하는 것은 여기에 '+
      '포함되지 않습니다. 업체가 정해지면 <b>어느 업체인지 알려 드리고 '+
      '그때 다시</b> 동의를 받습니다. '+
      '<a href="/privacy">개인정보처리방침</a></p>'+
  '</div>';
};

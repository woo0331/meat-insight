

function legalArticle(a, idx){
  var title = a[0], items = a[1] || [];
  var n = 0, body = "";
  items.forEach(function(it){
    if(Array.isArray(it)){
      body += '<ol class="lg-sub">'+ it.map(function(s){
        return '<li>'+esc(s)+'</li>'; }).join("") +'</ol>';
    }else{
      n++;
      body += '<p class="lg-p"><span class="lg-n" aria-hidden="true">'+circled(n)+'</span>'+esc(it)+'</p>';
    }
  });
  return '<section class="lg-a" id="lg-'+idx+'">'+
    '<h2>'+esc(title)+'</h2>'+ body +'</section>';
}

function circled(n){
  return (n>=1 && n<=20) ? String.fromCharCode(0x2460 + n - 1) : "("+n+")";
}

function legalToc(arts){

  return '<nav class="lg-toc" aria-label="목차"><h2>목차</h2><ol>'+
    arts.map(function(a,i){
      return '<li><a href="#lg-'+i+'" onclick="lgJump(event,'+i+')">'+esc(a[0])+'</a></li>';
    }).join("")+'</ol></nav>';
}
window.lgJump = function(ev, i){
  ev.preventDefault();
  var t = $("lg-"+i); if(!t) return;

  var hd = document.querySelector(".hd");
  var off = (hd ? hd.getBoundingClientRect().height : 0) + 16;
  window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - off, behavior:"smooth" });
};

function legalTable(rows, emptyMsg, warnKeys){
  var have = rows.filter(function(r){ return r[1]; });
  if(!have.length){
    if(warnKeys){
      try{ console.warn("[site] "+warnKeys); }catch(e){}
    }
    return '<p class="lg-none">'+esc(emptyMsg)+'</p>';
  }
  var miss = rows.filter(function(r){ return !r[1]; }).map(function(r){ return r[0]; });
  if(miss.length && warnKeys){
    try{ console.warn("[site] "+warnKeys+" — 아직 빈 항목: "+miss.join(", ")); }catch(e){}
  }
  return '<table class="lg-cols"><tbody>'+ have.map(function(r){
    return '<tr><th>'+esc(r[0])+'</th><td>'+esc(r[1])+'</td></tr>';
  }).join("") +'</tbody></table>';
}

function bizTable(){
  return legalTable([
    ["상호",             bizVal("company")],
    ["대표자",           bizVal("ceo")],
    ["사업자등록번호",    bizVal("brn")],
    ["통신판매업 신고번호", bizVal("mailOrder")],
    ["사업장 주소",       bizVal("address")],
    ["고객센터",         bizVal("phone")],
    ["상담 시간",        bizVal("hours")],
    ["전자우편",         bizVal("email")]
  ],
  "사업자 정보는 서비스 준비가 끝나는 대로 이곳에 게시합니다.",
  "약관·방침의 사업자 정보가 비어 있습니다 — js/data/site.js 의 WOW_BIZ 를 채우세요. "+
  "전자상거래법 제10조 표시 의무라 영업 시작 전에 반드시 필요합니다.");
}

function PageTerms(){
  var D = window.WOW_TERMS;
  return legalShell(D, bizTable(), null);
}

function PagePrivacy(){
  var D = window.WOW_PRIVACY;

  var officer = legalTable([
    ["개인정보 보호책임자", bizVal("privacyOfficer")],
    ["연락처",             bizPrivacyPhone()],
    ["전자우편",           bizPrivacyEmail()]
  ],
  "개인정보 보호책임자는 서비스 준비가 끝나는 대로 이곳에 게시합니다.",
  "개인정보 보호책임자가 지정되지 않았습니다 — js/data/site.js 의 privacyOfficer 를 채우세요. "+
  "개인정보보호법 제31조상 지정·공개 의무입니다.");

  var tr = (D.trustees || []);
  var trustee = tr.length
    ? '<table class="lg-cols"><thead><tr><th>수탁자</th><th>위탁 업무</th><th>보유·이용 기간</th></tr></thead><tbody>'+
        tr.map(function(r){

          return '<tr><td data-h="수탁자"><span>'+esc(r[0])+
                 (r[3]?' <span class="lg-tag">국외 · '+esc(r[3])+'</span>':'')+
                 '</span></td><td data-h="위탁 업무"><span>'+esc(r[1])+
                 '</span></td><td data-h="보유·이용 기간"><span>'+esc(r[2])+'</span></td></tr>';
        }).join("")+'</tbody></table>'
    : (function(){
        try{ console.warn("[site] 개인정보 처리 위탁 현황이 비어 있습니다 — "+
          "호스팅·접수처(웹훅·메일) 업체를 붙일 때마다 js/data/legal-privacy.js 의 trustees 에 "+
          "한 줄씩 추가하세요. 안 적으면 개인정보보호법 제26조 위반입니다."); }catch(e){}
        return '<p class="lg-none">현재 외부에 위탁하고 있는 개인정보 처리 업무가 없습니다.</p>';
      })();

  return legalShell(D,
    '<h2>개인정보 보호책임자</h2>'+officer+
    '<h2>개인정보 처리 위탁 현황</h2>'+trustee,
    null);
}

function legalShell(D, tail){
  var eff = bizVal("effective");

  return '<div class="w lgp">'+
    '<a class="back-l" href="/">'+icon("back",18)+'홈으로</a>'+
    '<header class="lg-hd">'+
      '<h1>'+esc(D.title)+'</h1>'+
      '<p class="lg-intro">'+esc(D.intro)+'</p>'+
      (eff ? '<p class="lg-eff">시행일 '+esc(eff)+'</p>' : '')+
    '</header>'+
    '<div class="lg-cols">'+
      legalToc(D.articles)+
      '<article class="lg-body">'+
        D.articles.map(legalArticle).join("")+
        '<section class="lg-a lg-tail">'+ tail +'</section>'+
        (eff ? '<p class="lg-fin">부칙 — 이 '+esc(D.title)+'은 '+esc(eff)+'부터 시행합니다.</p>' : '')+
      '</article>'+
    '</div>'+
  '</div>';
}

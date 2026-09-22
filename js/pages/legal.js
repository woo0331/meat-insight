/* ════════════════════════════════════════════════════════════════════
   이용약관 · 개인정보처리방침 화면

   본문은 js/data/legal-*.js 에 있습니다. 여기는 그리기만 합니다 —
   문구를 고칠 일이 생기면 데이터 파일만 보면 됩니다.

   ⚠️ 신원 정보(상호·대표·사업자등록번호 등)는 본문에 박지 않고
   맨 끝 표 한 곳에서만 보여 줍니다. WOW_BIZ 를 채우면 푸터·약관·
   방침이 한꺼번에 따라옵니다.
   ════════════════════════════════════════════════════════════════════ */

/* 조문 하나 — 항에 번호(①②③)를 화면이 붙입니다.
   배열이 오면 그 앞 항에 딸린 하위 목록(1. 2. 3.)으로 그립니다. */
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
/* ①~⑳ — 그 위는 (21) 처럼 적습니다. 항이 스무 개 넘는 조는 없지만,
   넘었을 때 빈칸이 나오면 안 됩니다. */
function circled(n){
  return (n>=1 && n<=20) ? String.fromCharCode(0x2460 + n - 1) : "("+n+")";
}

/* 목차 — 조가 많아 스크롤이 깁니다. 눌러서 바로 갑니다. */
function legalToc(arts){
  return '<nav class="lg-toc" aria-label="목차"><h3>목차</h3><ol>'+
    arts.map(function(a,i){
      return '<li><a href="#lg-'+i+'" onclick="lgJump(event,'+i+')">'+esc(a[0])+'</a></li>';
    }).join("")+'</ol></nav>';
}
window.lgJump = function(ev, i){
  ev.preventDefault();
  var t = $("lg-"+i); if(!t) return;
  /* 헤더가 sticky 라 그냥 이동하면 제목이 헤더 밑에 가려집니다 */
  var hd = document.querySelector(".hd");
  var off = (hd ? hd.getBoundingClientRect().height : 0) + 16;
  window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - off, behavior:"smooth" });
};

/* 표 — 값이 있는 줄만 그립니다. 하나도 없으면 표째 빼고 한 줄로 알립니다.
   "(미기재)" 를 찍지 않습니다. */
function legalTable(rows, emptyMsg, warnKeys){
  var have = rows.filter(function(r){ return r[1]; });
  if(!have.length){
    if(warnKeys){
      try{ console.warn("[ABOUTMEAT] "+warnKeys); }catch(e){}
    }
    return '<p class="lg-none">'+esc(emptyMsg)+'</p>';
  }
  var miss = rows.filter(function(r){ return !r[1]; }).map(function(r){ return r[0]; });
  if(miss.length && warnKeys){
    try{ console.warn("[ABOUTMEAT] "+warnKeys+" — 아직 빈 항목: "+miss.join(", ")); }catch(e){}
  }
  return '<table class="lg-t"><tbody>'+ have.map(function(r){
    return '<tr><th>'+esc(r[0])+'</th><td>'+esc(r[1])+'</td></tr>';
  }).join("") +'</tbody></table>';
}

/* 사업자 정보 — 전자상거래법 제10조 표시 의무 */
function bizTable(){
  return legalTable([
    ["상호",             bizVal("company")],
    ["대표자",           bizVal("ceo")],
    ["사업자등록번호",    bizVal("brn")],
    ["통신판매업 신고번호", bizVal("mailOrder")],
    ["축산물 영업신고번호", bizVal("meatLicense")],
    ["HACCP 인증번호",   bizVal("haccp")],
    ["사업장 주소",       bizVal("address")],
    ["고객센터",         bizVal("phone")],
    ["상담 시간",        bizVal("hours")],
    ["전자우편",         bizVal("email")]
  ],
  "사업자 정보는 서비스 준비가 끝나는 대로 이곳에 게시합니다.",
  "약관·방침의 사업자 정보가 비어 있습니다 — js/data/site.js 의 WOW_BIZ 를 채우세요. "+
  "전자상거래법 제10조 표시 의무라 판매 시작 전에 반드시 필요합니다.");
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
    ? '<table class="lg-t lg-t3"><thead><tr><th>수탁자</th><th>위탁 업무</th><th>보유·이용 기간</th></tr></thead><tbody>'+
        tr.map(function(r){
          return '<tr><td>'+esc(r[0])+(r[3]?' <span class="lg-tag">국외 · '+esc(r[3])+'</span>':'')+
                 '</td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td></tr>';
        }).join("")+'</tbody></table>'
    : (function(){
        try{ console.warn("[ABOUTMEAT] 개인정보 처리 위탁 현황이 비어 있습니다 — "+
          "결제대행·배송·문자발송 업체를 붙일 때마다 js/data/legal-privacy.js 의 trustees 에 "+
          "한 줄씩 추가하세요. 안 적으면 개인정보보호법 제26조 위반입니다."); }catch(e){}
        return '<p class="lg-none">현재 외부에 위탁하고 있는 개인정보 처리 업무가 없습니다.</p>';
      })();

  return legalShell(D,
    '<h2>개인정보 보호책임자</h2>'+officer+
    '<h2>개인정보 처리 위탁 현황</h2>'+trustee,
    null);
}

/* 두 문서가 같은 껍데기를 씁니다 */
function legalShell(D, tail){
  var eff = bizVal("effective");
  return Breadcrumb([["홈","#/"],[D.title,""]])+
  '<div class="w lg">'+
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

/* ════════════════════════════════════════════════════════════════════
   사업자 정보 — 여기 한 곳만 채우면 푸터·이용약관·개인정보처리방침에
   모두 반영됩니다.

   전자상거래 등에서의 소비자보호에 관한 법률 제10조에 따라
   상호·대표자·주소·전화번호·이메일·사업자등록번호·통신판매업 신고번호는
   사이트에 표시해야 합니다. 비워두면 화면에 "(미기재)" 로 나옵니다.

   개인정보 보호책임자(privacyOfficer)는 개인정보 보호법 제31조에 따라
   지정·공개해야 합니다.

   ※ 값은 실제 등록된 것만 적어주세요. 확인되지 않은 번호를 적으면
     그 자체가 표시 의무 위반입니다.
   ════════════════════════════════════════════════════════════════════ */
window.GORI_BIZ = {
  service:      "고리",                    // 서비스명
  company:      "",                        // 상호 (법인명 또는 개인사업자 상호)
  ceo:          "",                        // 대표자 성명
  brn:          "",                        // 사업자등록번호 (000-00-00000)
  mailOrder:    "",                        // 통신판매업 신고번호 (제0000-지역-0000호)
  address:      "",                        // 사업장 주소
  phone:        "",                        // 고객센터 전화번호
  email:        "",                        // 문의 이메일
  privacyOfficer:"",                       // 개인정보 보호책임자 (직책·성명)
  privacyEmail: "",                        // 개인정보 관련 문의 이메일 (비우면 email 사용)
  hostRegion:   "",                        // 데이터 보관 리전 (예: 싱가포르 / 서울) — Supabase 프로젝트 리전
  effective:    "2026-09-05"               // 약관·방침 시행일
};

/* ════════════════════════════════════════════════════════════════════
   기능 스위치 — 아직 만들지 않은 기능을 사이트에 광고하지 않기 위한 것입니다.
   실제로 만들었을 때만 true 로 바꾸세요.
   ════════════════════════════════════════════════════════════════════ */
window.GORI_FEATURES = {
  pay: false          // 고리페이(거래대금 안심결제). 전자금융거래법 대상이라
                      // 실제로 등록·구축한 뒤에만 켜세요.
};

/* ════════════════════════════════════════════════════════════════════
   홈에 노출할 콘텐츠 — 여기에 넣은 것만 보입니다.
   비워두면 각 칸에 "준비 중" 안내만 나옵니다.
   ※ 확인되지 않은 뉴스·매물을 지어내서 넣지 마세요. 예전에 예시로 넣어둔
     기사 제목(ASF 방역, 관세 인하 등)이 실제 기사처럼 보여 전부 비웠습니다.
   ════════════════════════════════════════════════════════════════════ */
window.GORI_CONTENT = {
  /* 축산 뉴스 — {title, url, date, source} */
  news: [
    // { title:"한우 도매가 3주 연속 상승", url:"https://...", date:"2026-09-01", source:"농민신문" }
  ],
  /* 창업·운영 인사이트 — {title, url, date} */
  insights: [
    // { title:"소규모 육가공 공장 창업 체크리스트", url:"/meat_insight_cases.html", date:"2026-09-01" }
  ],
  /* 실시간 매물 — {name, info, url} (판매하려는 물량을 직접 올릴 때) */
  props: [],
  /* 커뮤니티 인기글 — {title, url, count} */
  community: []
};

/* 푸터에 사업자 정보를 그립니다 (index.html / meat_insight_main.html 공용) */
(function(){
  var B=window.GORI_BIZ;
  function v(x){ return (x&&String(x).trim()) ? String(x).trim() : '<span class="biz-none">(미기재)</span>'; }
  function paint(){
    var host=document.getElementById("ft-biz"); if(!host) return;
    host.innerHTML=
      '<div class="biz-row">'+
        '<span>상호 '+v(B.company)+'</span>'+
        '<span>대표 '+v(B.ceo)+'</span>'+
        '<span>사업자등록번호 '+v(B.brn)+'</span>'+
        '<span>통신판매업 신고 '+v(B.mailOrder)+'</span>'+
      '</div>'+
      '<div class="biz-row">'+
        '<span>주소 '+v(B.address)+'</span>'+
        '<span>고객센터 '+v(B.phone)+'</span>'+
        '<span>이메일 '+v(B.email)+'</span>'+
      '</div>'+
      '<div class="biz-row biz-note">고리는 축산업 관련 거래를 중개하는 플랫폼입니다. '+
        '거래의 조건·품질·이행에 대한 책임은 거래 당사자에게 있으며, 고리는 통신판매의 당사자가 아닙니다.</div>';
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", paint);
  else paint();
})();

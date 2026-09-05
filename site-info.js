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

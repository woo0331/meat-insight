/* ════════════════════════════════════════════════════════════════════
   레거시 콘텐츠 페이지 공통 꼬리말 (legacy-chrome.js)

   meat_insight_* 페이지들은 옛 브랜드 그대로라 이용약관·개인정보처리방침
   링크도, 사업자 정보도 없었습니다. 검색으로 이 페이지에 처음 들어온
   사람은 다른 사이트로 보였습니다.

   페이지 디자인은 건드리지 않고, 아래에 공통 꼬리말만 붙입니다.
   site-info.js 와 같은 값을 씁니다.
   ════════════════════════════════════════════════════════════════════ */
(function(){
  function paint(){
    if(document.getElementById("lc-foot")) return;
    var B=(window.GORI_BIZ&&typeof window.GORI_BIZ==="object")?window.GORI_BIZ:{};
    function v(x){ return (x&&String(x).trim()) ? String(x).trim() : '<span class="lc-none">(미기재)</span>'; }

    var st=document.createElement("style");
    st.textContent=
      "#lc-foot{background:#12161B;color:rgba(255,255,255,.45);padding:30px 20px 26px;"+
        "font-family:'Pretendard Variable',Pretendard,'Noto Sans KR',system-ui,sans-serif;"+
        "font-size:12.5px;line-height:1.9;}"+
      "#lc-foot .in{max-width:1100px;margin:0 auto;}"+
      "#lc-foot .top{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;"+
        "padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.09);margin-bottom:14px;}"+
      "#lc-foot .bd{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:800;color:#fff;"+
        "text-decoration:none;letter-spacing:-.5px;margin-right:auto;}"+
      "#lc-foot a{color:rgba(255,255,255,.62);text-decoration:none;font-weight:700;}"+
      "#lc-foot a:hover{color:#fff;}"+
      "#lc-foot .rows span{margin-right:16px;white-space:nowrap;}"+
      "#lc-foot .note{margin-top:10px;color:rgba(255,255,255,.32);max-width:760px;}"+
      "#lc-foot .lc-none{color:#F5A524;font-weight:800;}"+
      "#lc-foot :focus-visible{outline:3px solid #fff;outline-offset:2px;}"+
      "@media(max-width:600px){#lc-foot .rows span{display:block;margin:0;}}";
    document.head.appendChild(st);

    var f=document.createElement("footer");
    f.id="lc-foot";
    f.innerHTML='<div class="in">'+
      '<div class="top">'+
        '<a class="bd" href="index.html">'+
          '<svg width="20" height="20" viewBox="0 0 26 26" fill="none" aria-hidden="true"><circle cx="13" cy="13" r="13" fill="#D91F3A"/>'+
          '<path d="M7 14 C7 10 10 7 14 7 C18 7 21 10 21 14 C21 17.5 18 20 14 20 L9 20" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>'+
          '<circle cx="8" cy="20" r="2" fill="white"/></svg> 고리</a>'+
        '<a href="index.html">고리 홈</a>'+
        '<a href="terms.html">이용약관</a>'+
        '<a href="privacy.html">개인정보처리방침</a>'+
      '</div>'+
      '<div class="rows">'+
        '<span>상호 '+v(B.company)+'</span><span>대표 '+v(B.ceo)+'</span>'+
        '<span>사업자등록번호 '+v(B.brn)+'</span><span>통신판매업 신고 '+v(B.mailOrder)+'</span>'+
      '</div>'+
      '<div class="rows">'+
        '<span>주소 '+v(B.address)+'</span><span>고객센터 '+v(B.phone)+'</span>'+
        '<span>이메일 '+v(B.email)+'</span>'+
      '</div>'+
      '<div class="note">고리는 축산업 관련 거래를 중개하는 플랫폼입니다. 업체와의 거래에서 조건·품질·이행에 대한 '+
        '책임은 거래 당사자에게 있습니다. 고리가 직접 판매하는 유료 컨설팅·자료의 환불 기준은 '+
        '<a href="terms.html">이용약관 제13조</a>를 확인해 주세요.</div>'+
    '</div>';
    document.body.appendChild(f);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", paint);
  else paint();
})();

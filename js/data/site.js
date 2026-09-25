/* ════════════════════════════════════════════════════════════════════
   사업자 정보 · 사이트 설정 — 한 곳에만 둡니다

   여기 채운 값이 푸터 · 이용약관 · 개인정보처리방침 · 전화 버튼에
   한꺼번에 반영됩니다. 문서 본문은 "회사" 라는 말로 쓰여 있어서,
   상호를 몰라도 문장은 멀쩡합니다.

   ⚠️ **빈 칸은 화면에서 줄째 빠집니다.** "(미기재)" 를 찍지 않습니다.
   손님 눈에 그게 보이면 그 순간 미완성 사이트로 읽힙니다.
   무엇이 비었는지는 console.warn 으로 — 운영자만 봅니다.

   ⚠️ **키·비밀번호를 여기 적지 마세요.** 이 저장소는 공개입니다.
   접수처 주소·API 키는 Vercel 환경변수에만 둡니다.
   ════════════════════════════════════════════════════════════════════ */
window.WOW_BIZ = {
  service:        "ABOUTMEAT",
  site:           "https://aboutmeat.co.kr",

  /* ── 전자상거래법 제10조 표시 의무 (영업 시작 전 필수) ──────── */
  company:        "",     // 상호
  ceo:            "",     // 대표자 성명
  brn:            "",     // 사업자등록번호  000-00-00000
  mailOrder:      "",     // 통신판매업 신고번호  제0000-지역-0000호
  address:        "",     // 사업장 주소
  phone:          "",     // 고객센터 전화 — 비우면 전화 버튼이 안 나옵니다
  email:          "",     // 문의 이메일
  hours:          "",     // 상담 가능 시간 (예: 평일 09:00~18:00)

  /* ── 개인정보보호법 제31조 ───────────────────────────────── */
  privacyOfficer: "",     // 개인정보 보호책임자 (직책·성명)
  privacyEmail:   "",     // 비우면 email 을 씁니다
  privacyPhone:   "",     // 비우면 phone 을 씁니다

  /* ── 접수가 실제로 되는가 ────────────────────────────────
     ⚠️ 이 칸은 **"Vercel 환경변수 설정을 마쳤다" 는 표시**입니다.
     여기에 뭘 적는다고 접수가 되는 게 아닙니다. 실제 접수는
     INTAKE_WEBHOOK_URL 또는 RESEND_API_KEY·INTAKE_EMAIL_TO 가 합니다
     (api/_send.js 머리말을 보세요).

     꺼져 있으면 SOS 화면 **맨 위에** "지금은 이 양식으로 접수하지
     못합니다" 안내가 뜨고 전화 버튼이 나옵니다. 설정을 마치기 전에
     켜 두면, 손님이 다 적고 눌렀는데 실패하는 일이 생깁니다. */
  sosReady:       false,

  /* ── 약관·방침 시행일 ───────────────────────────────────── */
  effective:      "2026-09-25"
};

/* 값이 있으면 돌려주고 없으면 null — 화면은 null 이면 그 줄을 뺍니다.
   빈 문자열·공백만 있는 값도 "없음" 으로 봅니다. */
window.bizVal = function(k){
  var v = (window.WOW_BIZ || {})[k];
  if(v === true) return true;
  if(v === false || v == null) return null;
  v = String(v).trim();
  return v ? v : null;
};
window.bizPrivacyEmail = function(){ return bizVal("privacyEmail") || bizVal("email"); };
window.bizPrivacyPhone = function(){ return bizVal("privacyPhone") || bizVal("phone"); };

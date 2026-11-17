/* 동의 고지문 — 서버가 들고 있는 한 벌 (W02 · 동의 증거)

   ⚠️⚠️ 화면의 동의 상자(AgreeBox)와 **같은 글자**여야 합니다. 서버가 저장하는
   것은 "손님이 본 고지문" 이라, 두 곳이 다르면 저장된 증거가 거짓이 됩니다.
   tools/test-w02-api.js 가 화면 파일에서 이 글자를 찾아 맞춰 봅니다.
   ⚠️ 글을 고치면 VER 를 올리세요 — 언제 어떤 고지문에 동의했는지가 갈립니다.
   ⚠️⚠️ 보유기간(keep)은 처리방침과 아직 어긋납니다(W00 7절) — 대표 결정 뒤
   세 곳(이 파일 · 화면 · 방침)을 같은 날 고칩니다. */

const VER = "2026-11-18-a";

const NOTICE = {
  quote: { items: "성함 · 연락처 · 업종 · 지역 · 평수 · 예산 · 일정 · 적어 주신 내용",
           purpose: "견적 요청 접수와 상담 안내", keep: "접수일로부터 1년" },
  sos:   { items: "성함 · 연락처 · 업종 · 지역 · 적어 주신 상황",
           purpose: "문의 접수와 상담 안내", keep: "접수일로부터 1년" },
  sell:  { items: "성함 · 연락처 · 업종 · 지역 · 적어 주신 매물 조건과 설명",
           purpose: "매물 등록 확인과 문의 전달", keep: "등록을 내리신 날로부터 1년" },
  join:  { items: "업체명 · 담당자 성함 · 연락처 · 이메일 · 하시는 일 · 지역",
           purpose: "입점 심사와 안내", keep: "입점 종료 후 1년" }
};

function consentFor(form){
  const n = NOTICE[form];
  if (!n) return null;
  return { notice_ver: form + "-" + VER, items: n.items, purpose: n.purpose, keep: n.keep };
}

module.exports = { VER, NOTICE, consentFor };

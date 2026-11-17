// ABOUTMEAT 테스트 사이트 전용 수정 (2026-11-17 대표자 지시)
//  ① 커뮤니티 예시 글(DB 90개 + 코드에 박힌 CM_POSTS)을 검증 전까지 화면에서 숨김 · DB 를 읽지도 않음
//  ② TODAY PRICE · 시세 화면의 고정 숫자를 숨김 (실제 시세 자료가 연결되어 있지 않음)
//  ③ 폰 폭에서 머리말 메뉴 글자가 세로로 꺾이던 것 — 폰에서는 아래 탭이 같은 길을 냅니다
// 쓰는 법: node patch-test.js <meat_insight_main.html>
// 바꿀 자리가 정확히 한 번 나오지 않으면 멈춥니다 (조용히 안 바뀌는 일이 없게).
const fs = require("fs");
const f = process.argv[2];
let s = fs.readFileSync(f, "utf8");
function once(re, to, why) {
  const n = (s.match(new RegExp(re.source, "g")) || []).length;
  if (n !== 1) { console.error("바꿀 자리가 " + n + "번 나옵니다: " + why); process.exit(1); }
  s = s.replace(re, to);
}
function note(t, d) {
  return '<div class="am-hold"><div class="am-hold-t">' + t + '</div><div class="am-hold-d">' + d + '</div></div>';
}

// ② 홈 TODAY PRICE 구간을 통째로 뺌
once(/\s*<!-- 오늘 시세 미니 -->\s*<div[^>]*>\s*<div[^>]*>TODAY PRICE<\/div>\s*<div class="sise-mini" id="home-sise"[^>]*><\/div>\s*<\/div>/,
  "", "TODAY PRICE 구간");
once(/function renderHomeSise\(\)\{/, "function renderHomeSise(){return;", "renderHomeSise");
// ② 시세 화면: 고정 숫자 · '축산물품질평가원 · 매일 갱신' 글을 숨기고 안내만
once(/<div class="pg" id="pg-si">/, '<div class="pg" id="pg-si">' +
  note("시세 정보 준비 중", "확인된 시세 자료를 연결한 뒤 다시 열겠습니다. 지금은 화면에 시세 숫자를 싣지 않습니다."), "pg-si");
once(/function renderSise\(cat\)\{/, "function renderSise(cat){return;", "renderSise");

// ① 커뮤니티: 글 목록 · 글쓰기 · DB 읽기를 모두 끔
once(/<div class="pg" id="pg-cm">/, '<div class="pg" id="pg-cm">' +
  note("커뮤니티 준비 중", "기존 글을 확인하는 동안 잠시 닫아 두었습니다."), "pg-cm");
once(/function renderCm\(cat,elId\)\{/, "function renderCm(cat,elId){return;", "renderCm");
once(/async function loadCmPosts\(\)\{/, "async function loadCmPosts(){return;", "loadCmPosts");

// CSS — 안내 상자 · 숨김 · ③ 폰 머리말
const css = [
  ".am-hold{margin:76px 16px 20px;padding:28px 20px;background:var(--w,#fff);border:1px solid var(--cr3,#EDE0C4);border-radius:14px;text-align:center}",
  ".am-hold-t{font-size:17px;font-weight:700;color:var(--n2,#0d2137);margin-bottom:8px}",
  ".am-hold-d{font-size:14px;line-height:1.6;color:var(--ink3,#6b5a45)}",
  "#pg-si>*:not(.am-hold),#pg-cm>*:not(.am-hold){display:none!important}",
  ".nb,.nav-cta,.logo-main{white-space:nowrap}",
  "@media (max-width:860px){.nav-links{display:none}.logo-sub{display:none}.nav{padding:0 14px}}"
].join("\n");
once(/<\/style>/, css + "\n</style>", "첫 </style>");
fs.writeFileSync(f, s);
console.log("수정했습니다: " + f);

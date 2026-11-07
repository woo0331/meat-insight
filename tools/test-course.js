/* ════════════════════════════════════════════════════════════════════
   골프장이 **있을 때**를 눌러 봅니다 — /course/<slug>  (0066)

   ⚠️⚠️⚠️ **씨앗을 넣고 실제로 찍은 뒤 사본으로 되돌립니다.** 그리고
   **찍힌 파일이 실제로 없어졌는지**까지 봅니다 — 2026-11-03 에
   `test-providers` 가 자료 파일만 되돌리고 찍힌 HTML 을 안 지워서
   **없는 업체 화면 두 장이 커밋에 들어간** 적이 있습니다. 정적 사이트는
   목록에 없어도 주소를 치면 열립니다 (절대 규칙 1 · 표시광고법 제3조).

   ⚠️⚠️ **씨앗은 "검사용" 이라고 이름에 박습니다** — 혹시 남더라도
   사람이 바로 알아보게.

   재는 뜻 (갯수를 박지 않습니다)
     ① 자료가 있으면 그 수만큼 화면이 찍히는가
     ② 값이 없는 줄은 **줄째 빠지는가** (절대 규칙 2)
     ③ **출처와 기준일**을 그 자리에서 말하는가
     ④ 좌표가 **있을 때만** 지도로 가는 길을 내는가
     ⑤ **"예약 가능" · "공식 제휴" 를 안 적는가** (지시서 작업 4)
     ⑥ 폐업을 **맨 위에서** 말하는가
     ⑦ 이름에 태그를 넣어도 **날것으로 안 나가는가** (절대 규칙 4)
     ⑧ 되돌린 뒤 **파일이 실제로 없는가**
   ════════════════════════════════════════════════════════════════════ */
"use strict";
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const GEN  = path.join(ROOT, "js", "data", "courses.generated.js");
const BAK  = GEN + ".bak-test";

let bad = 0, ran = 0;
function ok(name, cond, got){
  ran++;
  if(cond) console.log("  ✅ " + name);
  else { bad++; console.log("  ❌ " + name + (got !== undefined ? "  →  " + String(got).slice(0,220) : "")); }
}
function build(){ execFileSync("node", [path.join(ROOT, "build.js")], { cwd:ROOT, stdio:["ignore","pipe","pipe"] }); }
function page(slug){
  const f = path.join(ROOT, "course", slug, "index.html");
  return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "";
}

const SEED = [
  { id:"11111111-1111-1111-1111-111111111111", slug:"t-course-open", kind:"golf",
    name:"검사용 남서울 컨트리클럽", region:"gyeonggi", gu:"성남시",
    addr:"경기도 성남시 분당구 1", addr_road:"경기도 성남시 분당구 1로 1",
    tel:"031-000-0000", holes:18, biz_kind:"회원제",
    lat:37.35, lng:127.1, state:"open", source_id:"t-src", as_of:"2026-11-01" },
  /* ⚠️ 좌표 · 홀 수가 **없는** 줄 — 그 줄이 빠지는지 봅니다 */
  { id:"22222222-2222-2222-2222-222222222222", slug:"t-course-bare", kind:"range",
    name:"검사용 <img src=x onerror=alert(9)> 연습장", region:"seoul",
    state:"open", source_id:"t-src" },
  { id:"33333333-3333-3333-3333-333333333333", slug:"t-course-closed", kind:"golf",
    name:"검사용 닫힌 골프장", region:"jeju", gu:"제주시",
    addr:"제주특별자치도 제주시 1", holes:9, state:"closed", source_id:"t-src" }
];

console.log("\n── 골프장이 있을 때 (/course)");
if(!fs.existsSync(GEN)){ console.log("  ❌ courses.generated.js 가 없습니다"); process.exit(1); }
fs.copyFileSync(GEN, BAK);
let okAll = true;
try{
  fs.writeFileSync(GEN,
    "/* 검사용 씨앗 — tools/test-course.js 가 넣고 지웁니다 */\n" +
    "window.AM_COURSES = " + JSON.stringify(SEED) + ";\n" +
    "window.AM_COURSES_AT = \"검사용\";\n", "utf8");
  build();

  const a = page("t-course-open");
  const b = page("t-course-bare");
  const c = page("t-course-closed");
  ok("① 자료 수만큼 화면이 찍힌다", a && b && c, [!!a, !!b, !!c].join("/"));

  ok("  이름 · 지역 · 갈래를 적는다",
     a.indexOf("검사용 남서울 컨트리클럽") > 0 && a.indexOf("경기 성남시") > 0 &&
     a.indexOf("골프장") > 0);
  ok("② 값이 있으면 그 줄을 낸다 (홀 수 · 전화)",
     a.indexOf("18홀") > 0 && a.indexOf("031-000-0000") > 0);
  ok("  ⚠️ **값이 없으면 줄째 뺀다** (홀 수 · 주소 · 전화가 없는 곳)",
     b.indexOf("홀 수") < 0 && b.indexOf("전화") < 0 && b.indexOf("undefined") < 0 &&
     b.indexOf("(미기재)") < 0, "빈 자리에 자리표시자가 찍혔습니다");
  ok("③ **출처와 기준일**을 그 자리에서 말한다",
     a.indexOf("출처 t-src") > 0 && a.indexOf("2026-11-01") > 0 &&
     a.indexOf("직접 확인한 값이 아닙니다") > 0);
  ok("  기준일이 없으면 그 조각만 뺀다",
     c.indexOf("출처 t-src") > 0 && c.indexOf("자료 기준일") < 0);
  ok("④ 좌표가 **있을 때만** 지도로 가는 길을 낸다",
     a.indexOf("map.kakao.com") > 0 && b.indexOf("map.kakao.com") < 0 &&
     c.indexOf("map.kakao.com") < 0);
  ok("  바깥 링크에 rel 을 단다",
     /map\.kakao[^"]*"[^>]*/.test(a) && a.indexOf("noopener noreferrer") > 0);

  /* ⚠️⚠️⚠️ 여기가 이 검사의 **알맹이**입니다 — 제휴가 아닌 시설에
     "예약 가능 · 공식 제휴" 를 적으면 지시서 작업 4 위반이고, 손님은
     저희가 그 골프장과 계약한 줄 압니다. */
  const claims = ["예약 가능", "공식 제휴", "공식 파트너", "제휴 골프장", "예약 완료"];
  const hit = claims.filter(function(w){ return a.indexOf(w) >= 0 || b.indexOf(w) >= 0 || c.indexOf(w) >= 0; });
  ok("⑤ ⚠️⚠️ **'예약 가능' · '공식 제휴' 를 안 적는다**", hit.length === 0, hit.join(" · "));
  ok("  예약을 보장하지 않는다고 말한다", a.indexOf("예약을 보장하지 않습니다") > 0);

  /* ⚠️ 앵커를 **구간 제목**으로 잡습니다 — 처음에 "시설 정보" 라는
     글자로 쟀는데 그 말이 meta description 에도 있어서(화면 맨 위) 늘
     앞섰습니다. 코드가 아니라 **제 검사가 틀린** 자리였습니다. */
  ok("⑥ 폐업을 **맨 위에서** 말한다 (시설 정보 구간보다 앞)",
     c.indexOf("cs-closed") > 0 &&
     c.indexOf("cs-closed") < c.indexOf("<h2>시설 정보</h2>") &&
     c.indexOf("전화로 확인") > 0,
     c.indexOf("cs-closed") + " / " + c.indexOf("<h2>시설 정보</h2>"));
  ok("  영업 중인 곳에는 그 띠를 안 낸다", a.indexOf("cs-closed") < 0);

  /* ⚠️⚠️⚠️ **구조화 데이터(ld+json)까지 봅니다.** 처음에 본문만 보고
     초록이었는데, `JSON.stringify` 는 `<` 를 안 바꿔서 그 자리에만
     **날것**으로 나가고 있었습니다 — 이름에 `</script>` 가 섞이면
     스크립트 자리를 빠져나갑니다. build.js 를 고쳤고, 이 검사는 이제
     **화면 전체**에 날것이 한 글자도 없는지 봅니다. */
  ok("⑦ ⚠️ 이름의 태그가 **화면 어디에도 날것으로 안 나간다**",
     b.indexOf("<img src=x") < 0 && b.indexOf("&lt;img") > 0,
     "esc() 를 지나지 않았습니다");
  ok("  ⚠️⚠️ 구조화 데이터(ld+json)도 날것이 아니다",
     b.indexOf("u003cimg") > 0, "JSON-LD 에 날것이 들어갔습니다");
  ok("  그래도 구조화 데이터가 **읽히는 JSON** 이다", (function(){
       var m = b.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
       if(!m.length) return false;
       return m.every(function(x){
         try{ JSON.parse(x.replace(/^[^>]*>/, "").replace(/<\/script>$/, "")); return true; }
         catch(e){ return false; }
       });
     })());

  /* 들어가는 길 — ⚠️ 화면만 있고 길이 없으면 없는 것과 같습니다 */
  ok("  골프장 찾기로 돌아가는 길이 있다", a.indexOf("/search?t=course") > 0);
}catch(e){
  okAll = false;
  console.log("  ❌ 검사가 터졌습니다: " + String(e.message || e).slice(0, 300));
  bad++;
}finally{
  /* ⚠️⚠️ 되돌리기는 **반드시** 돕니다 — 깨진 채로 커밋되면 안 됩니다 */
  try{ fs.copyFileSync(BAK, GEN); fs.unlinkSync(BAK); }catch(e){}
  try{ build(); }catch(e){}
}

/* ⚠️⚠️⚠️ **"목록에 없다" 와 "파일이 없다" 는 다릅니다.** 정적 사이트는
   목록에 없어도 주소를 치면 열립니다 — **파일**을 봅니다. */
const left = SEED.map(function(s){ return s.slug; })
  .filter(function(s){ return fs.existsSync(path.join(ROOT, "course", s, "index.html")); });
ok("⑧ ⚠️⚠️ 되돌린 뒤 **검사용 화면 파일이 하나도 안 남았다**",
   left.length === 0, left.join(" · "));
const dir = path.join(ROOT, "course");
ok("  빈 폴더도 안 남았다",
   !fs.existsSync(dir) || fs.readdirSync(dir).length === 0,
   fs.existsSync(dir) ? fs.readdirSync(dir).join(" · ") : "");

console.log("\n" + ran + "건 중 " + (ran - bad) + "건 통과 · " + bad + "건 실패");
process.exit(bad === 0 && okAll ? 0 : 1);

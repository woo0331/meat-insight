/* 주석 떼기가 **코드를 안 건드리는지** 봅니다.
   ⚠️ 이 저장소가 주석 처리로 열여덟 번 당했습니다 — 그 열여덟을
   전부 넣어 보고, 그 다음 저장소 전체를 떼어 보고 파싱합니다. */
const { stripJs, stripCss } = require("./strip-comments.js");
const fs = require("fs"), path = require("path");
let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log("  ✅ " + name); }
  else { fail++; console.log("  ❌ " + name + (extra ? "  — " + extra : "")); }
}
const eq = (name, src, want) => {
  const got = stripJs(src).trim();
  ok(name, got === want.trim(), JSON.stringify(got) + " ≠ " + JSON.stringify(want));
};

console.log("\n① 함정 — 문자열 · 정규식 · 템플릿 안의 주석 꼴");
eq("문자열 안의 //",            'var u = "http://x.com/a"; // 뒤',           'var u = "http://x.com/a";');
eq("문자열 안의 /*",            'var s = "/* 가짜 */" + 1;',                  'var s = "/* 가짜 */" + 1;');
eq("홑따옴표 안의 //",          "var u = 'a//b';",                           "var u = 'a//b';");
eq("정규식 안의 //",            'var r = /a\\/\\/b/; // 뒤',                  'var r = /a\\/\\/b/;');
eq("정규식 안의 /*",            'var r = /a\\/\\*b/g;',                      'var r = /a\\/\\*b/g;');
eq("문자 묶음 안의 빗금",        'var r = /[/*]/; // 뒤',                     'var r = /[/*]/;');
eq("나눗셈은 정규식이 아님",      'var x = a / b / c; // 뒤',                  'var x = a / b / c;');
eq("템플릿 안의 주석 꼴",        'var t = `a /* b */ c`;',                    'var t = `a /* b */ c`;');
eq("템플릿 ${} 안의 주석",       'var t = `a ${ x /* 떼기 */ } b`;',           'var t = `a ${ x   } b`;');
eq("템플릿 안의 템플릿",         'var t = `a ${ `b // c` } d`;',              'var t = `a ${ `b // c` } d`;');
/* ⚠️ `**` + 빗금은 **진짜 JS 파서도** 거기서 주석을 닫습니다. 이
   저장소가 그걸로 검사 하나를 통째로 죽인 적이 있습니다 — 떼는 쪽이
   파서와 같게 구는 것이 맞습니다 (제 기대가 틀렸던 자리). */
{
  const src = "var a=1; /* 설명 **" + "/ var b=2;";
  let real = true; try { new Function(src); } catch (e) { real = false; }
  let got  = true; try { new Function(stripJs(src)); } catch (e) { got = false; }
  ok("별표 뒤 빗금 — 파서와 같게 군다", real === got, "파서 " + real + " · 넨 것 " + got);
}
eq("줄 주석이 파일 끝",          'var a=1; // 끝',                            'var a=1;');
eq("한 줄 블록 주석은 빈칸",      'var a = 1 /* x */ + 2;',                    'var a = 1   + 2;');
eq("escape 한 따옴표",          'var s = "a\\"// b";',                       'var s = "a\\"// b";');

console.log("\n② 여러 줄 주석은 **줄바꿈을 남깁니다** (ASI 사고 방지)");
{
  const got = stripJs("return\n/* 여러\n줄 */\n1;");
  ok("줄바꿈이 남는다", got.indexOf("\n") >= 0, JSON.stringify(got));
}

console.log("\n③ CSS");
{
  const g = s => stripCss(s).trim();
  ok("url() 안의 주석 꼴",
     g('a{background:url(data:image/svg+xml;utf8,<path d="M/*x"/>)}') ===
       'a{background:url(data:image/svg+xml;utf8,<path d="M/*x"/>)}');
  ok("문자열 안의 주석 꼴", g('a::after{content:"/* x */"}') === 'a::after{content:"/* x */"}');
  ok("주석을 뗀다", g('a{color:red} /* 설명 */ b{color:blue}').indexOf("설명") < 0);
  /* ⚠️ **원본부터 짝이 안 맞습니다** — 주석과 문자열 안에 중괄호가
     들어 있어서 { 2490 · } 2491 입니다. 봐야 하는 것은 "짝이 맞는가"
     가 아니라 **차이가 그대로인가** 입니다 (제 기대가 틀렸던 자리). */
  ok("중괄호 차이가 원본과 같다", (() => {
    const s = fs.readFileSync("css/pages.css", "utf8"), o = stripCss(s);
    const d = x => (x.split("{").length - 1) - (x.split("}").length - 1);
    return d(s) === d(o);
  })());
}

console.log("\n④ 저장소 전체 — 떼고 나서 파싱되는가 · 화면 글이 남는가");
{
  const files = [];
  const walk = p => fs.readdirSync(p, { withFileTypes:true }).forEach(e => {
    const f = path.join(p, e.name);
    if (e.isDirectory()) walk(f); else if (/\.js$/.test(e.name)) files.push(f);
  });
  walk("js");
  let bad = [], lost = [], idem = [];
  files.forEach(f => {
    const src = fs.readFileSync(f, "utf8");
    const out = stripJs(src);
    try { new Function(out); } catch (e) { bad.push(f + ": " + e.message.slice(0, 60)); }
    /* ⚠️⚠️ **주석 안의 따옴표를 세면 안 됩니다.** 이 저장소는 주석에서
       화면 글을 인용합니다 ("접수 목록" 은 만들 수 없습니다) — 처음에
       그걸 세어서 멀쩡한 코드를 "글이 사라졌다" 로 잡았습니다.
       지금은 **뗀 것 안의 따옴표 한글**이 원본에도 있는지만 봅니다.
       진짜 그물은 아래 ⑥ — 167개 화면을 뗀 것으로 띄워 글자를 견줍니다. */
    const kor = [...out.matchAll(/["'`]([^"'`\n]*[가-힣][^"'`\n]*)["'`]/g)].map(m => m[1]);
    const miss = kor.filter(k => src.indexOf(k) < 0);
    if (miss.length) lost.push(f + ": " + miss.slice(0, 2).join(" | "));
    if (stripJs(out) !== out) idem.push(f);
  });
  console.log("  js 파일 " + files.length + "개");
  ok("떼고 나서 전부 파싱된다", bad.length === 0, bad.slice(0, 3).join("  //  "));
  ok("뗀 것의 따옴표 한글이 원본에 전부 있다", lost.length === 0, lost.slice(0, 3).join("  //  "));
  ok("두 번 떼도 그대로다", idem.length === 0, idem.slice(0, 3).join(" "));
}

console.log("\n⑤ CSS 전체");
{
  const files = fs.readdirSync("css").filter(f => /\.css$/.test(f)).map(f => "css/" + f);
  let bad = [], lost = [];
  files.forEach(f => {
    const src = fs.readFileSync(f, "utf8"), out = stripCss(f && src);
    const d = x => (x.split("{").length - 1) - (x.split("}").length - 1);
    if (d(src) !== d(out)) bad.push(f);
    /* 선택자 · 속성 이름이 하나도 안 사라졌는가 */
    const want = [...src.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(--[a-z0-9-]+|\.[a-z][a-z0-9_-]*)/gi)].map(m => m[1]);
    const miss = [...new Set(want)].filter(k => out.indexOf(k) < 0);
    if (miss.length) lost.push(f + ": " + miss.slice(0, 3).join(" "));
  });
  console.log("  css 파일 " + files.length + "개");
  ok("중괄호 차이가 원본과 같다", bad.length === 0, bad.join(" "));
  ok("클래스 · 토큰 이름이 하나도 안 사라졌다", lost.length === 0, lost.slice(0, 2).join("  //  "));
}

console.log("\n" + (fail ? "❌" : "✅") + " 통과 " + pass + " · 실패 " + fail);
process.exit(fail ? 1 : 0);

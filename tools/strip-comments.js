/* ════════════════════════════════════════════════════════════════════
   배포본에서만 주석을 뗍니다 — **소스는 한 글자도 안 건드립니다.**

   ⚠️⚠️ **정규식으로 하지 않습니다.** 이 저장소가 주석 처리로 열여덟 번
   당했습니다 — 문자열 안의 `/*`, URL 의 `//`, 템플릿 문자열 안의 주석,
   별표 뒤 빗금. 여기는 **글자를 하나씩 읽으면서** 지금 어디 안인지
   (보통 · 문자열 · 템플릿 · 정규식 · 주석)를 들고 갑니다.

   ⚠️ 왜 떼는가 — 재 본 값입니다 (2026-10-24).
     css 셋   gzip 124KB → 39KB     js 51개  gzip 483KB → 283KB
     합계     gzip 607KB → 322KB (−47%)
   주석은 이 저장소에서 같은 사고를 두 번 안 내게 해 주는 자산입니다.
   지우자는 말이 아니라 **손님에게까지 보낼 까닭이 없다**는 말입니다.

   ⚠️⚠️ 떼고 나서 **반드시 다시 파싱해 봅니다** (js 는 new Function,
   css 는 중괄호 짝). 그리고 `check.js` 가 167개 화면을 **뗀 결과물로**
   띄워 봅니다 — 그게 진짜 그물입니다.
   ════════════════════════════════════════════════════════════════════ */

/* 정규식이 올 수 있는 자리인가 — 바로 앞의 뜻 있는 글자로 가립니다.
   ⚠️ `)` 뒤는 보통 나눗셈이지만 `if (x) /re/.test(y)` 도 됩니다.
   틀려도 **떼지 않는 쪽**으로 기울게 두었습니다 (안 떼면 용량만
   그대로이고, 잘못 떼면 코드가 깨집니다). */
function reOk(prev) {
  if (prev === "") return true;
  if (/[A-Za-z0-9_$\]\)]/.test(prev)) return false;
  return true;
}

/* ── 자바스크립트 ────────────────────────────────────────────────── */
function stripJs(src) {
  let out = "", i = 0, prev = "";
  const n = src.length;
  /* 템플릿 안의 ${ } 깊이를 쌓아 둡니다 — 중첩이 됩니다 */
  const tpl = [];
  while (i < n) {
    const c = src[i], d = src[i + 1];

    if (tpl.length && tpl[tpl.length - 1] === 0) {
      /* 템플릿 문자열 본문 */
      if (c === "\\") { out += c + (d || ""); i += 2; continue; }
      if (c === "`") { tpl.pop(); out += c; i++; prev = c; continue; }
      if (c === "$" && d === "{") { tpl[tpl.length - 1] = 1; tpl.push(-1); out += "${"; i += 2; prev = "{"; continue; }
      out += c; i++; continue;
    }

    if (c === "/" && d === "*") {           /* 블록 주석 */
      const e = src.indexOf("*/", i + 2);
      const end = e < 0 ? n : e + 2;
      /* 줄바꿈이 들어 있었으면 한 줄은 남깁니다 — ASI 가 바뀌지
         않게 (`return` 뒤에 세미콜론이 끼는 사고와 같은 자리). */
      out += src.slice(i, end).indexOf("\n") >= 0 ? "\n" : " ";
      i = end; continue;
    }
    if (c === "/" && d === "/") {            /* 줄 주석 */
      let e = src.indexOf("\n", i);
      if (e < 0) e = n;
      i = e; continue;
    }
    if (c === '"' || c === "'") {            /* 문자열 */
      out += c; i++;
      while (i < n) {
        if (src[i] === "\\") { out += src[i] + (src[i + 1] || ""); i += 2; continue; }
        out += src[i];
        if (src[i] === c) { i++; break; }
        i++;
      }
      prev = c; continue;
    }
    if (c === "`") { tpl.push(0); out += c; i++; continue; }
    if (c === "/" && reOk(prev)) {           /* 정규식 */
      let j = i + 1, cls = false, okRe = false;
      while (j < n) {
        const x = src[j];
        if (x === "\\") { j += 2; continue; }
        if (x === "\n") break;               /* 한 줄 안에서 안 닫히면 정규식이 아닙니다 */
        if (x === "[") cls = true;
        else if (x === "]") cls = false;
        else if (x === "/" && !cls) { okRe = true; break; }
        j++;
      }
      if (okRe) {
        j++;
        while (j < n && /[a-z]/.test(src[j])) j++;   /* 깃발 gimsuy */
        out += src.slice(i, j); prev = "/"; i = j; continue;
      }
    }
    if (c === "}" && tpl.length && tpl[tpl.length - 1] === -1) { tpl.pop(); out += c; i++; prev = c; continue; }
    if (c === "{" && tpl.length && tpl[tpl.length - 1] === -1) { tpl.push(-1); out += c; i++; prev = c; continue; }

    out += c;
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  /* 빈 줄을 하나로 — 줄 수를 줄이되 차례는 그대로입니다 */
  return out.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
}

/* ── CSS ─────────────────────────────────────────────────────────────
   ⚠️ CSS 에는 줄 주석(`//`)이 없습니다. 문자열과 `url(...)` 만 피하면
   됩니다 — `url(data:image/svg+xml;...)` 안에 `/*` 가 들어올 수 있습니다. */
function stripCss(src) {
  let out = "", i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "*") {
      const e = src.indexOf("*/", i + 2);
      const end = e < 0 ? n : e + 2;
      out += src.slice(i, end).indexOf("\n") >= 0 ? "\n" : " ";
      i = end; continue;
    }
    if (c === '"' || c === "'") {
      out += c; i++;
      while (i < n) {
        if (src[i] === "\\") { out += src[i] + (src[i + 1] || ""); i += 2; continue; }
        out += src[i];
        if (src[i] === c) { i++; break; }
        i++;
      }
      continue;
    }
    if ((c === "u" || c === "U") && /^url\(/i.test(src.slice(i, i + 4))) {
      const e = src.indexOf(")", i);
      const end = e < 0 ? n : e + 1;
      out += src.slice(i, end); i = end; continue;
    }
    out += c; i++;
  }
  return out.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
}

module.exports = { stripJs, stripCss };

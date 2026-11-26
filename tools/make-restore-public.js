const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'restore-public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const dir of ['dist', 'img']) fs.cpSync(path.join(root, dir), path.join(out, dir), { recursive: true });
/* 2026-11-26 — 제목 글꼴(/fonts/*.woff2)이 배포본에서 빠져 운영에서 404 였습니다.
   css/pages.css 의 @font-face 가 가리키는 .woff2 와 그 글꼴 사용 허락서(OFL)만 옮깁니다. */
let fonts = 0;
const fontDir = path.join(root, 'fonts');
if (fs.existsSync(fontDir)) {
  fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
  for (const f of fs.readdirSync(fontDir)) {
    if (!/\.woff2$/.test(f) && !/OFL\.txt$/.test(f)) continue;
    fs.copyFileSync(path.join(fontDir, f), path.join(out, 'fonts', f));
    if (/\.woff2$/.test(f)) fonts++;
  }
}
/* @font-face 가 가리키는 글꼴이 배포본에 없으면 빌드를 멈춥니다 (다시 조용히 404 가 되지 않게) */
for (const css of ['dist/css/pages.css']) {
  const t = fs.existsSync(path.join(root, css)) ? fs.readFileSync(path.join(root, css), 'utf8') : '';
  for (const m of t.matchAll(/url\(["']?(\/fonts\/[^"')?]+)/g)) {
    if (!fs.existsSync(path.join(out, m[1]))) { console.error('글꼴이 배포본에 없습니다: ' + m[1]); process.exit(1); }
  }
}
const excluded = new Set(['.git', '.github', 'node_modules', 'api', 'db', 'docs', 'dist', 'img', 'js', 'css', 'fonts', 'restore-public']);
let pages = 0;
function walk(dir, rel = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!excluded.has(e.name)) walk(path.join(dir, e.name), path.join(rel, e.name)); continue; }
    const file = path.join(rel, e.name);
    if (e.name.endsWith('.html') || (!rel && ['robots.txt', 'sitemap.xml', 'manifest.json', 'sw.js', 'og.jpg', 'apple-touch-icon.png','favicon.ico','favicon-16.png','favicon-32.png','icon-192.png','icon-512.png','icon-maskable.png'].includes(e.name))) {
      const dest = path.join(out, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(dir, e.name), dest);
      if (e.name.endsWith('.html')) pages++;
    }
  }
}
walk(root);
console.log('Restoration public output: ' + pages + ' HTML pages, ' + fonts + ' font file(s); no source, SQL or internal docs.');

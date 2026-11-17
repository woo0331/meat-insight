const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'restore-public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const dir of ['dist', 'img']) fs.cpSync(path.join(root, dir), path.join(out, dir), { recursive: true });
const excluded = new Set(['.git', '.github', 'node_modules', 'api', 'db', 'docs', 'dist', 'img', 'js', 'css', 'restore-public']);
let pages = 0;
function walk(dir, rel = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (!excluded.has(e.name)) walk(path.join(dir, e.name), path.join(rel, e.name)); continue; }
    const file = path.join(rel, e.name);
    if (e.name.endsWith('.html') || (!rel && ['robots.txt', 'sitemap.xml', 'manifest.json', 'sw.js', 'og.jpg', 'apple-touch-icon.png'].includes(e.name))) {
      const dest = path.join(out, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(dir, e.name), dest);
      if (e.name.endsWith('.html')) pages++;
    }
  }
}
walk(root);
console.log('Restoration public output: ' + pages + ' HTML pages; no source, SQL or internal docs.');

/* ════════════════════════════════════════════════════════════════════
   색 대비 회귀 검사 (WCAG AA)

   모든 화면의 보이는 글자마다 실제로 칠해진 글자색과 배경색을 브라우저에서
   읽어 대비를 계산합니다. 배경은 조상 요소를 거슬러 올라가며 알파 합성해
   구하고, 그라디언트·이미지 배경은 판정할 수 없으므로 건너뜁니다.

   기준: 보통 글씨 4.5:1, 큰 글씨(24px 이상 또는 18.66px 이상 굵게) 3:1
   이모지·기호만 있는 요소는 color 가 적용되지 않으므로 제외합니다.
   ════════════════════════════════════════════════════════════════════ */
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const fs = require("fs");
const FAKE = fs.readFileSync(__dirname + "/fake-sb.js", "utf8");
const ROOT = "file://" + require("path").resolve(__dirname, "..") + "/";
const U = { id: "u1", user_metadata: { name: "김철수", role: "buyer" } };

const AUDIT = `(()=>{
 function px(s){const m=s.match(/rgba?\\(([^)]+)\\)/); if(!m)return null;
   const a=m[1].split(',').map(x=>parseFloat(x)); return {r:a[0],g:a[1],b:a[2],a:a.length>3?a[3]:1};}
 // f 를 b 위에 얹는 source-over 합성. 둘 다 반투명일 수 있으므로 알파도 같이 계산합니다.
 function over(f,b){const a=f.a+b.a*(1-f.a); if(a<=0) return {r:0,g:0,b:0,a:0};
   const m=(x,y)=>(x*f.a+y*b.a*(1-f.a))/a;
   return {r:m(f.r,b.r),g:m(f.g,b.g),b:m(f.b,b.b),a:a};}
 function lum(c){const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};
   return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b);}
 function cr(a,b){const x=lum(a),y=lum(b),hi=Math.max(x,y),lo=Math.min(x,y);return (hi+.05)/(lo+.05);}
 // 조상을 거슬러 올라가며 배경을 쌓습니다. 위쪽(자손) 배경이 앞, 아래쪽(조상)이 뒤.
 function bgOf(el){let cur=el, acc=null;
   while(cur){const cs=getComputedStyle(cur); const c=px(cs.backgroundColor);
     const bi=cs.backgroundImage;
     if(bi&&bi!=='none'&&(!c||c.a<1)) return {unknown:true};   // 그라디언트·이미지는 판정 불가
     if(c&&c.a>0){ acc = acc?over(acc,c):c; if(acc.a>=.999) return acc; }
     cur=cur.parentElement;}
   return acc&&acc.a>0 ? over(acc,{r:255,g:255,b:255,a:1}) : {r:255,g:255,b:255,a:1};}
 const out=[];
 document.querySelectorAll('*').forEach(el=>{
   const t=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join('').trim();
   if(!t) return;
   if(!/[A-Za-z0-9가-힣]/.test(t)) return;
   const cs=getComputedStyle(el);
   if(cs.display==='none'||cs.visibility==='hidden'||parseFloat(cs.opacity)===0) return;
   const r=el.getBoundingClientRect(); if(r.width<1||r.height<1) return;
   const fg=px(cs.color); if(!fg||fg.a<.05) return;
   const bg=bgOf(el); if(bg.unknown) return;
   const eff=fg.a<1?over(fg,bg):fg;
   const sz=parseFloat(cs.fontSize), w=parseInt(cs.fontWeight)||400;
   const need = (sz>=24 || (sz>=18.66 && w>=700)) ? 3 : 4.5;
   const v=cr(eff,bg);
   if(v<need) out.push({t:t.slice(0,26),v:+v.toFixed(2),need,
     cls:(el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className||'').toString().slice(0,34),
     fg:cs.color, bg:'rgb('+Math.round(bg.r)+','+Math.round(bg.g)+','+Math.round(bg.b)+')'});
 });
 return out;})()`;

const SPA = [["홈", "go('h')"], ["요청 목록", "go('reqs')"], ["업체 찾기", "go('suppliers')"],
             ["구인구직", "go('jobs')"], ["시세", "go('market')"], ["내 활동", "go('my')"],
             ["요청 상세", "gOpenRequest('r1')"], ["요청서 작성", "go('rw')"],
             ["업체 등록", "go('sj')"], ["이용 가이드", "gOpenGuide()"],
             ["가이드(업체)", "gGuideTab('sup')"], ["신고", "gOpenReport('supplier','s1','합신식 도축장')"],
             ["문의", "gOpenContact()"]];
const PAGES = ["terms.html", "privacy.html", "admin.html",
               "meat_insight_apply.html", "meat_insight_calculator.html", "meat_insight_cases.html",
               "meat_insight_diagnosis.html", "meat_insight_partner.html", "meat_insight_report.html",
               "dashboard.html", "suppliers.html", "jobs.html", "purchase_request.html",
               "404.html"];

function report(name, rows) {
  if (!rows.length) return 0;
  console.log("  ❌ " + name);
  rows.slice(0, 10).forEach(x =>
    console.log("       " + x.v + "/" + x.need + '  "' + x.t + '"  ' + x.cls + "  " + x.fg + " on " + x.bg));
  if (rows.length > 10) console.log("       … 외 " + (rows.length - 10) + "건");
  return rows.length;
}

(async () => {
  const b = await chromium.launch();
  let bad = 0;

  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.addInitScript(FAKE + "\nwindow.__FAKE_INIT(" + JSON.stringify({ user: U, realtime: true }) + ");");
  await p.goto(ROOT + "index.html", { waitUntil: "load" });
  await p.waitForTimeout(2800);
  for (const [nm, fn] of SPA) {
    await p.evaluate(fn); await p.waitForTimeout(900);
    bad += report("index / " + nm, await p.evaluate(AUDIT));
  }
  await p.close();

  for (const f of PAGES) {
    const q = await b.newPage({ viewport: { width: 1280, height: 1000 } });
    await q.goto(ROOT + f, { waitUntil: "load" });
    await q.waitForTimeout(1400);
    // 관리자 잠금 화면을 걷어내고 그 아래 실제 화면을 검사합니다.
    await q.evaluate(() => {
      document.documentElement.classList.remove("ag-lock");
      const g = document.getElementById("ag-gate"); if (g) g.remove();
    });
    await q.waitForTimeout(300);
    bad += report(f, await q.evaluate(AUDIT));
    await q.close();
  }

  await b.close();
  console.log(bad ? "❌ 대비 미달 " + bad + "건" : "✅ 전체 통과");
  process.exit(bad ? 1 : 0);
})();

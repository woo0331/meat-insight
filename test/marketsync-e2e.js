/* ════════════════════════════════════════════════════════════════════
   축평원 시세 자동 수집 (tools/market-sync.js)

   홈에 매일 들어올 이유가 하나도 없었습니다. "축산 시세" 메뉴는 있는데
   market_prices 가 비어 있어 구간째로 내려가 있었습니다. 축평원 경락가는
   공개 자료이니 하루 한 번 받아 넣습니다.

   ⚠️ 개발 환경에서는 축평원·공공데이터포털이 막혀 있어 **진짜 응답을
      확인하지 못했습니다.** 그래서 확인하는 것은 "우리 쪽 파이프라인" 입니다 —
      응답 모양을 받아 넘기고, 분류를 옮기고, 전일 대비를 계산하고,
      같은 날을 두 번 넣지 않는 것. 엔드포인트·칸 이름은 --probe 로 한 번
      맞추면 이 파이프라인이 그대로 돕니다.

   확인하는 것
     1. 기관마다 다른 응답 모양을 다 읽는다
     2. 축종을 우리 분류(beef·pork·byproduct·import)로 옮긴다
     3. 값이 없거나 0원인 줄은 버린다
     4. 전일 대비를 **실제로 계산**하고, 어제 값이 없으면 비워 둔다 (0 이 아니라)
     5. 같은 날·같은 출처를 두 번 넣지 않는다 (지우고 다시 넣음)
     6. 못 읽으면 **지어내지 않고 실패**한다
   ════════════════════════════════════════════════════════════════════ */
const { execFileSync } = require("child_process");
const { spawn } = require("child_process");
const path = require("path");
const MOCK = path.join(__dirname, "mock-postgrest.js");
const SYNC = path.join(__dirname, "..", "tools", "market-sync.js");
const FIX  = f => path.join(__dirname, "fixtures", f);
const PORT = 8913;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const log = [], errs = [];
const chk = (n, g, w) => { const ok = String(g) === String(w);
  log.push((ok ? "  ✅ " : "  ❌ ") + n + ": " + g + (ok ? "" : "  ← 기대 " + w)); if (!ok) errs.push(n); };

function run(args, env){
  try {
    return { ok:true, out: execFileSync("node", [SYNC].concat(args), {
      encoding:"utf8", env: Object.assign({}, process.env, env || {}), stdio:["ignore","pipe","pipe"] }) };
  } catch(e){
    return { ok:false, out: String(e.stdout || "") + String(e.stderr || ""), code: e.status };
  }
}

(async () => {
  log.push("1. 기관마다 다른 응답 모양");
  const a = run(["--file=" + FIX("kape-datago.json"), "--dry", "--date=2026-09-11"]);
  chk("공공데이터포털 중첩 모양", /정리된 4건/.test(a.out), "true");
  chk("  한우는 beef 로", /beef.*한우 지육/.test(a.out), "true");
  chk("  돼지는 pork 로", /pork.*돼지 지육/.test(a.out), "true");

  const b = run(["--file=" + FIX("ekape-flat.json"), "--dry", "--date=2026-09-11"]);
  chk("평평한 배열 모양", /정리된 4건/.test(b.out), "true");
  chk("  부산물·수입육도 나눔", /byproduct/.test(b.out) && /import/.test(b.out), "true");
  /* 다섯 줄 중 품목이 비고 0원인 한 줄은 버려야 합니다 */
  chk("  빈 줄·0원은 버림", /정리된 4건/.test(b.out), "true");

  log.push("2. 못 읽으면 지어내지 않는다");
  const c = run(["--file=" + FIX("kape-bad.json"), "--dry"]);
  chk("키 오류 응답이면 실패", c.ok, "false");
  chk("  목록을 못 찾았다고 말함", /목록을 못 찾았습니다/.test(c.out), "true");
  chk("  아무 숫자도 안 만듦", /정리된/.test(c.out), "false");

  const d = run(["--file=" + FIX("kape-datago.json"), "--dry"], { MARKET_SOURCE: "없는곳" });
  chk("--file 이면 출처 몰라도 됨", d.ok, "true");
  const e = run(["--dry"], { MARKET_SOURCE: "없는곳" });
  chk("모르는 출처는 실패", /모르는 출처/.test(e.out), "true");
  const f = run(["--dry"], { MARKET_SOURCE: "kape", KAPE_KEY: "" });
  chk("키 없으면 실패", /KAPE_KEY 가 없습니다/.test(f.out), "true");

  log.push("3. 실제로 넣기 — 전일 대비 · 중복 방지");
  const m = spawn("node", [MOCK, "service", String(PORT)], { stdio:["ignore","ignore","ignore"] });
  await sleep(700);
  try {
    const env = { SUPABASE_URL: "http://127.0.0.1:" + PORT, SUPABASE_SERVICE_KEY: "svc-test" };
    const g = run(["--file=" + FIX("kape-datago.json"), "--date=2026-09-11"], env);
    chk("넣었다고 말함", /4건 넣었습니다/.test(g.out), "true");

    const seen = await (await fetch("http://127.0.0.1:" + PORT + "/__posted")).json();
    const by = {};
    seen.posted.forEach(r => { by[r.item + "|" + (r.grade || "")] = r; });

    /* 어제: 한우 1++ 24000 · 1등급 20500 · 돼지 1등급 5820 */
    chk("전일 대비 오름", by["한우 지육|1++"] && by["한우 지육|1++"].change, 500);
    chk("전일 대비 내림", by["한우 지육|1등급"] && by["한우 지육|1등급"].change, -400);
    chk("변동 없으면 0", by["돼지 지육|1등급"] && by["돼지 지육|1등급"].change, 0);
    /* 어제 값이 아예 없는 품목은 0 이 아니라 비워 둬야 합니다 —
       0 을 넣으면 "변동 없음" 이라는 없는 사실을 말하게 됩니다 */
    chk("어제 값 없으면 비움", by["돼지 삼겹살|"] && by["돼지 삼겹살|"].change === null, "true");

    chk("단위·출처가 채워짐", seen.posted.every(r => r.unit === "원/kg" && r.source === "축산물품질평가원"), "true");
    chk("날짜가 전부 그 날", seen.posted.every(r => r.price_date === "2026-09-11"), "true");

    /* 같은 날 다시 돌려도 쌓이면 안 됩니다 — 지우고 넣습니다 */
    chk("먼저 그 날짜만 지움",
      seen.deleted.some(u => /market_prices/.test(u) && /price_date=eq\.2026-09-11/.test(decodeURIComponent(u))
                             && /source=eq\./.test(decodeURIComponent(u))), "true");
  } finally { m.kill(); await sleep(150); }

  console.log(log.join("\n"));
  console.log(errs.length ? "❌ " + errs.length + "건 실패: " + errs.join(", ") : "✅ 전체 통과");
  process.exit(errs.length ? 1 : 0);
})();

/* live-check.js 자체 검증 — PostgREST 를 흉내 낸 서버로 네 가지 상황을 만들고,
   점검 결과가 맞게 나오는지 확인합니다.
   (실제 Supabase 없이도 "점검 도구가 제대로 판단하는가" 를 지킵니다) */
const { spawn } = require("child_process");
const path = require("path");

const MOCK = path.join(__dirname, "mock-postgrest.js");
const CHECK = path.join(__dirname, "live-check.js");
const PORT = 8907;

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }

function runCheck(extra){
  return new Promise((res)=>{
    const p=spawn("node",[CHECK,"--url","http://127.0.0.1:"+PORT,"--key","testkey"].concat(extra||[]),
      {stdio:["ignore","pipe","pipe"]});
    let out=""; p.stdout.on("data",d=>out+=d); p.stderr.on("data",d=>out+=d);
    p.on("close",code=>res({out,code}));
  });
}

async function withMock(scenario, fn){
  const m=spawn("node",[MOCK,scenario,String(PORT)],{stdio:["ignore","ignore","ignore"]});
  await sleep(700);
  try { return await fn(); } finally { m.kill(); await sleep(150); }
}

(async()=>{
  const log=[], errs=[];
  const chk=(n,g,w)=>{const ok=String(g)===String(w);
    log.push((ok?'  ✅ ':'  ❌ ')+n+': '+g+(ok?'':'  ← 기대 '+w));if(!ok)errs.push(n);};

  log.push('1. 정상 — 표·컬럼·RLS 가 다 맞을 때');
  await withMock("ok", async()=>{
    const r=await runCheck();
    chk('종료 코드 0', r.code, '0');
    chk('문제 0건', /문제 0건/.test(r.out), 'true');
    chk('필수 표 전부 확인', /purchase_requests.*컬럼 20개 모두 확인/.test(r.out), 'true');
    chk('개인 표는 읽기 차단으로 인식', /읽기 차단됨:.*notifications/.test(r.out), 'true');
    chk('저장소 확인', /supplier-photos 버킷 있음/.test(r.out), 'true');
  });

  log.push('2. phase2·3 미실행 — 표가 없고 컬럼도 없을 때');
  await withMock("phase2-missing", async()=>{
    const r=await runCheck();
    chk('종료 코드 1', r.code, '1');
    chk('quotes 없음을 잡음', /❌ quotes\s+없음 — phase2/.test(r.out), 'true');
    chk('market_prices 는 phase3 로 안내', /market_prices\s+없음 — phase3/.test(r.out), 'true');
    chk('기존 표의 빠진 컬럼을 이름으로 알려줌', /purchase_requests.*선택 컬럼 없음:.*category_main/.test(r.out), 'true');
    chk('suppliers 빠진 컬럼', /suppliers.*선택 컬럼 없음:.*category_mains/.test(r.out), 'true');
  });

  log.push('3. phase7 만 안 했을 때 — 문제가 아니라 안내');
  await withMock("no-phase7", async()=>{
    const r=await runCheck();
    chk('종료 코드 0 (선택 사항)', r.code, '0');
    chk('reports 는 경고로만', /⚠️ reports\s+없음 — phase7 \(선택\)/.test(r.out), 'true');
    chk('문제 0건', /문제 0건/.test(r.out), 'true');
  });

  log.push('4. RLS 안 켠 상태 — 남의 데이터를 지울 수 있는지 잡아내는가');
  await withMock("rls-off", async()=>{
    const ro=await runCheck();
    chk('읽기 전용으로도 유출을 잡음', /개인 정보가 담긴 표를 누구나 읽습니다/.test(ro.out), 'true');
    chk('읽기 전용에선 삭제 판정 안 함', /anon 이 행을 지울 수 있습니다/.test(ro.out), 'false');

    const w=await runCheck(["--write"]);
    chk('--write 로 삭제 가능을 잡음', /purchase_requests.*anon 이 행을 지울 수 있습니다/.test(w.out), 'true');
    chk('phase4 실행을 안내', /phase4_admin\.sql 5번 블록/.test(w.out), 'true');
    chk('종료 코드 1', w.code, '1');
  });

  log.push('5. 연결 자체가 막혔을 때');
  {
    const p=spawn("node",[CHECK,"--url","http://127.0.0.1:1","--key","k"],{stdio:["ignore","pipe","pipe"]});
    let out=""; p.stdout.on("data",d=>out+=d); p.stderr.on("data",d=>out+=d);
    const code=await new Promise(r=>p.on("close",r));
    chk('연결 실패를 알림', /연결 실패/.test(out), 'true');
    chk('0 이 아닌 코드로 끝남', String(code!==0), 'true');
  }

  console.log(log.join('\n'));
  console.log(errs.length? ('\n❌ 실패 '+errs.length+'건\n  '+errs.join('\n  ')) : '\n✅ 전체 통과');
  process.exit(errs.length?1:0);
})();

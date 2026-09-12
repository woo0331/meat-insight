/* ════════════════════════════════════════════════════════════════════
   알림 내보내기 — 번호 · 템플릿 · 링크 · 지어내지 않음

   알림톡은 **건당 돈이 나갑니다.** 그래서 여기서 지키는 것은
   "예쁘게 나오는가" 가 아니라 "엉뚱한 데로 나가지 않는가" 입니다.
     · 번호가 이상하면 보내지 않는다 (아무 데나 보내면 안 됩니다)
     · 템플릿에 치환 안 된 #{…} 가 남지 않는다 (그대로 발송됩니다)
     · 링크가 실제로 열리는 주소다
     · 번호를 모르면 보낸 척하지 않는다

   대행사(api.solapi.com)는 개발 환경에서 막혀 있어 **실제 발송은
   확인하지 못했습니다.** 그래서 네트워크를 타지 않는 부분만 봅니다 —
   축평원 때와 같습니다. 브라우저가 필요 없습니다.
   ════════════════════════════════════════════════════════════════════ */
const path = require("path");
const N = require(path.join(__dirname, "..", "tools", "notify-sources.js"));

const log = [], errs = [];
const chk = (n, g, w) => { const ok = String(g) === String(w);
  log.push((ok ? "  ✅ " : "  ❌ ") + n + ": " + g + (ok ? "" : "  ← 기대 " + w)); if (!ok) errs.push(n); };

log.push("1. 전화번호 — 이상하면 안 보낸다");
chk("하이픈 제거",        N.normPhone("010-1234-5678"), "01012345678");
chk("공백·괄호 제거",     N.normPhone(" (010) 1234 5678 "), "01012345678");
chk("국가번호 +82",       N.normPhone("+82 10-1234-5678"), "01012345678");
chk("지역번호도 받는다",  N.normPhone("02-123-4567"), "021234567");
chk("빈 값은 null",       N.normPhone(""), "null");
chk("글자는 null",        N.normPhone("연락처 없음"), "null");
chk("너무 짧으면 null",   N.normPhone("010-1234"), "null");
chk("너무 길면 null",     N.normPhone("010123456789999"), "null");
chk("null 도 null",       N.normPhone(null), "null");

log.push("2. 링크 — 실제로 열리는 주소인가");
chk("요청", N.linkOf({ link: "req:abc-123" }), "https://aboutmeat.co.kr/#/req/abc-123");
chk("대화", N.linkOf({ link: "chat:r9" }),     "https://aboutmeat.co.kr/#/chat/r9");
chk("거래", N.linkOf({ link: "order:o1" }),    "https://aboutmeat.co.kr/#/order/o1");
chk("모르는 꼴은 홈으로", N.linkOf({ link: "wat:1" }), "https://aboutmeat.co.kr/");
chk("링크 없으면 홈으로", N.linkOf({}),               "https://aboutmeat.co.kr/");
chk("id 가 인코딩됨", N.linkOf({ link: "req:a b/c" }), "https://aboutmeat.co.kr/#/req/a%20b%2Fc");

log.push("3. 템플릿 — 치환 안 된 자리가 남으면 안 된다");
const ROW = { kind: "request", title: "한우 등심 300kg", body: "원육 구매 · 경기 포천시", link: "req:r1" };
for (const kind of Object.keys(N.TEMPLATES)){
  const t = N.TEMPLATES[kind];
  const out = N.render(t.text, t.vars(Object.assign({}, ROW, { kind })));
  chk(kind + " — #{} 안 남음", /#\{/.test(out), "false");
  chk(kind + " — 빈 줄만 있지 않음", out.trim().length > 20, "true");
  const btn = N.render(t.button.path, t.vars(Object.assign({}, ROW, { kind })));
  chk(kind + " — 버튼이 우리 주소", btn.indexOf("https://aboutmeat.co.kr/") === 0, "true");
}

log.push("4. 심사에서 반려되는 모양이 아닌가");
for (const kind of Object.keys(N.TEMPLATES)){
  const t = N.TEMPLATES[kind];
  /* 광고성 낱말이 있으면 정보성으로 안 봐 줍니다 */
  chk(kind + " — 광고 문구 없음",
    /할인|이벤트|무료|지금\s*가입|특가|쿠폰|혜택|추천인/.test(t.text), "false");
  /* 치환자만 있는 줄은 반려됩니다 — 고정 문구가 붙어 있어야 합니다 */
  const onlyVar = t.text.split("\n").some(l => /^\s*#\{[^}]+\}\s*$/.test(l));
  chk(kind + " — 치환자만 있는 줄 없음", onlyVar, "false");
  chk(kind + " — 발신자를 밝힘", t.text.indexOf("[고리]") === 0, "true");
}

log.push("5. body 를 분야·지역으로 가른다 (트리거가 만든 꼴)");
chk("가름", JSON.stringify(N.splitBody("원육 구매 · 경기 포천시")), '["원육 구매","경기 포천시"]');
chk("구분자 없으면 통째로", JSON.stringify(N.splitBody("원육 구매")), '["원육 구매",""]');
const v = N.TEMPLATES.request.vars(ROW);
chk("분야", v["분야"], "원육 구매");
chk("지역", v["지역"], "경기 포천시");

log.push("6. 문자 — 짧고, 링크는 남는다");
const sms = N.smsText(ROW);
chk("300자 이하", sms.length <= 300, "true");
chk("링크 포함",  sms.indexOf("https://aboutmeat.co.kr/#/req/r1") >= 0, "true");
chk("고리를 밝힘", sms.indexOf("[고리]") === 0, "true");
const long = N.smsText({ kind:"request", link:"req:r1",
  title: "가".repeat(200), body: "나".repeat(200) });
chk("긴 글도 300자 이하", long.length <= 300, "true");

log.push("7. 긴 값은 잘린다 (템플릿 글자수 제한)");
chk("40자로 자름", N.trim("다".repeat(100), 40).length, 40);
chk("짧으면 그대로", N.trim("한우", 40), "한우");
chk("줄바꿈은 공백으로", N.trim("한우\n등심", 40), "한우 등심");

log.push("8. 보내는 본문 — 템플릿이 없으면 문자로만 나간다");
const msgs = [
  { to: "01011112222", sms: "가", templateId: "TPL_A", vars: { "분야": "원육" } },
  { to: "01033334444", sms: "나", templateId: null,    vars: {} },
];
const body = JSON.parse(N.SEND.body(msgs, { from: "0212345678", pfId: "PF1" }));
chk("두 건", body.messages.length, 2);
chk("템플릿 있으면 알림톡", !!body.messages[0].kakaoOptions, "true");
chk("알림톡 실패 시 문자 대체", body.messages[0].kakaoOptions.disableSms, "false");
chk("템플릿 없으면 문자만", !!body.messages[1].kakaoOptions, "false");
chk("발신번호가 붙음", body.messages[0].from, "0212345678");
const noPf = JSON.parse(N.SEND.body(msgs, { from: "0212345678", pfId: "" }));
chk("발신프로필 없으면 전부 문자", !!noPf.messages[0].kakaoOptions, "false");

log.push("9. 서명 — 매번 달라야 한다 (재사용 공격 방지)");
const h1 = N.SEND.headers("k", "s"), h2 = N.SEND.headers("k", "s");
chk("HMAC-SHA256 꼴", /^HMAC-SHA256 apiKey=k, date=.+, salt=[0-9a-f]{64}, signature=[0-9a-f]{64}$/
  .test(h1.Authorization), "true");
chk("두 번이 다름", h1.Authorization === h2.Authorization, "false");
chk("시크릿이 안 실림", h1.Authorization.indexOf("s,") >= 0 || /secret/i.test(h1.Authorization), "false");

log.push("10. 대행사 응답 읽기 — 못 읽으면 성공으로 치지 않는다");
const okRes = N.SEND.parseResult({ messageList: [{ to: "01011112222", messageId: "M1", statusCode: "2000" }] });
chk("성공 한 건", JSON.stringify(okRes), '[{"to":"01011112222","id":"M1","ok":true,"error":null}]');
const badRes = N.SEND.parseResult({ messageList: [{ to: "01011112222", statusCode: "4004", statusMessage: "잔액 부족" }] });
chk("실패로 읽음", badRes[0].ok, "false");
chk("이유가 남음",  badRes[0].error, "잔액 부족");
chk("모르는 모양이면 빈 배열", JSON.stringify(N.SEND.parseResult({ hello: 1 })), "[]");
chk("빈 응답도 빈 배열",       JSON.stringify(N.SEND.parseResult(null)), "[]");

log.push("11. 키가 저장소에 없는가");
const fs = require("fs");
const files = ["tools/notify-sources.js", "tools/notify-send.js", ".github/workflows/notify.yml", "db/phase8_notify.sql"];
const leaked = files.filter(f => {
  const s = fs.readFileSync(path.join(__dirname, "..", f), "utf8");
  /* 진짜 키처럼 보이는 긴 문자열 · service_role JWT */
  return /eyJ[A-Za-z0-9_-]{30,}/.test(s) || /NCS[A-Z0-9]{15,}/.test(s);
});
chk("키가 박혀 있지 않음", leaked.join(", "), "");

/* ── 여기부터는 보내는 쪽(notify-send.js)을 통째로 돌려 봅니다 ──────
   재미있는 실수는 순수 함수가 아니라 여기 있습니다 — 번호를 어디서
   찾는지, 못 찾으면 어떻게 하는지, 아직 때가 안 된 것을 건드리지
   않는지. 대행사는 못 부르니 --probe 까지만 갑니다. */
const { spawn } = require("child_process");
const PORT = 8921;

function run(args, env){
  return new Promise(done => {
    const p = spawn("node", [path.join(__dirname, "..", "tools", "notify-send.js")].concat(args),
      { env: Object.assign({}, process.env, env), stdio: ["ignore", "pipe", "pipe"] });
    let out = ""; p.stdout.on("data", d => out += d); p.stderr.on("data", d => out += d);
    p.on("close", code => done({ out, code }));
  });
}
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const mock = spawn("node", [path.join(__dirname, "mock-notify.js"), String(PORT)],
    { stdio: ["ignore", "pipe", "pipe"] });
  await sleep(700);

  const ENV = { SUPABASE_URL: "http://127.0.0.1:" + PORT, SUPABASE_SERVICE_KEY: "test-key" };

  log.push("12. 밀린 알림을 읽어 보낼 내용을 만든다");
  const probe = await run(["--probe"], ENV);
  chk("정상 종료", probe.code, 0);
  chk("때가 된 것만 집음(4번은 2999년)", /밀린 알림 3건/.test(probe.out), "true");
  chk("업체 번호를 suppliers 에서", /01012345678/.test(probe.out), "true");
  chk("요청자 번호를 purchase_requests 에서", /01099990000/.test(probe.out), "true");
  chk("번호 없는 사람은 건너뜀", /건너뛸 것: 1건/.test(probe.out), "true");
  chk("아직 때가 안 된 건 안 나옴", /새벽에 올라온 요청/.test(probe.out), "false");
  chk("템플릿 없으면 문자로 표시", /· 문자/.test(probe.out), "true");
  chk("치환 안 된 자리 없음", /#\{/.test(probe.out), "false");
  chk("--probe 는 아무것도 안 적음",
    JSON.parse(await (await fetch("http://127.0.0.1:" + PORT + "/__patched")).text()).patched.length, 0);

  log.push("13. 발신프로필이 있으면 알림톡으로 나간다");
  const withTpl = await run(["--probe"], Object.assign({}, ENV, {
    ALIMTALK_PFID: "PF-TEST", ALIMTALK_TPL_REQUEST: "TPL-REQ", ALIMTALK_TPL_QUOTE: "TPL-QUO" }));
  chk("알림톡으로 표시", /· 알림톡/.test(withTpl.out), "true");
  chk("등록한 문구가 그대로", /요청 내용을 확인하고 견적을 보내실 수 있습니다/.test(withTpl.out), "true");

  log.push("14. 번호를 모르면 보낸 척하지 않는다");
  const real = await run([], Object.assign({}, ENV, { SOLAPI_KEY: "", SOLAPI_SECRET: "" }));
  const patched = JSON.parse(await (await fetch("http://127.0.0.1:" + PORT + "/__patched")).text()).patched;
  const ghost = patched.find(x => x.id === 3);
  chk("3번은 skipped 로 적힘", ghost && ghost.status, "skipped");
  chk("이유도 적힘",           ghost && ghost.error, "전화번호 없음");
  chk("보낼 수 있는 건 안 건드림", patched.filter(x => x.id === 1 || x.id === 2).length, 0);
  chk("키가 없으면 실패로 끝남", real.code, 1);
  chk("무엇이 없는지 말해 줌", /SOLAPI_KEY/.test(real.out), "true");

  log.push("15. 사이트가 그 링크를 실제로 열 수 있는가");
  const router = fs.readFileSync(path.join(__dirname, "..", "src", "14_router.js"), "utf8");
  const segs = (router.match(/var RT_SEG2PG\s*=\s*\{([^}]*)\}/) || [])[1] || "";
  ["req", "chat", "order", "sup"].forEach(seg => {
    chk("#/" + seg + "/<id> 라우트가 있음", new RegExp("\\b" + seg + "\\s*:").test(segs), "true");
  });

  mock.kill();
  console.log(log.join("\n"));
  console.log(errs.length ? "❌ " + errs.length + "건 실패: " + errs.join(", ") : "✅ 전체 통과");
  process.exit(errs.length ? 1 : 0);
})();

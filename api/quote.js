/* ════════════════════════════════════════════════════════════════════
   요청 접수 (Vercel Serverless Function)   POST /api/quote

   화면 세 곳이 이리로 들어옵니다. `kind` 로 구분합니다.

     "sos"      사장님 SOS        — 문제를 그대로 적어 보내는 것
     "quote"    견적 요청         — 서비스가 정해진 요청서
     "partner"  파트너 등록       — 업체가 등록을 신청하는 것

   ⚠️ **화면이 보내는 칸 이름과 여기서 읽는 칸 이름이 어긋나면 그 칸은
   조용히 사라집니다.** 에러도 안 나고 접수는 성공합니다 — 받아 보는
   사람만 "왜 업체명이 없지?" 하게 됩니다. 실제로 그랬습니다:
   견적 요청이 `service`·`budget`·`detail` 을 보내는데 여기서는 `svc`
   하나만 읽고 있었고, 파트너 등록은 아예 견적으로 처리되어 **업체명과
   취급 서비스가 통째로 빠졌습니다.**
   화면의 `body = {...}` 를 고치면 **여기도 같이 고치고**,
   `node tools/test-api.js` 로 확인하세요.

   받을 곳(환경변수)은 **api/_send.js** 머리말에 정리해 두었습니다.
   하나도 없으면 503 을 돌려주고, 화면은 "지금은 접수하지 못합니다" 와
   전화 버튼을 냅니다.

   ⚠️ **여기에 저장하지 않습니다.** 서버도 DB 도 없습니다. 받아서 밖으로
   보내기만 하고, 못 보내면 실패로 돌려줍니다. 성공했다고만 하고 흘려
   버리면 손님은 기다리고 요청은 사라집니다.

   ⚠️ **동의 없이 받지 않습니다.** 성함·연락처는 개인정보입니다. 화면에서
   한 번 막고 여기서 한 번 더 막습니다 — 화면만 믿으면 이 주소로 직접
   보내는 것을 못 막습니다 (개인정보보호법 제15조·제22조).
   ════════════════════════════════════════════════════════════════════ */

const { deliver, customerAck, clean, why, fromOurPages } = require("./_send.js");
/* ⚠️⚠️ 아래 둘은 **DB 가 설정되어 있을 때만** 일을 합니다. 설정 전에는
   이 주소가 **오늘과 글자 하나 다르지 않게** 동작합니다 — 받아서 슬랙
   으로 보내고 끝입니다. 반쯤 된 저장을 손님에게 보이지 않기 위해서고,
   `api/_send.js` 가 받을 곳이 없을 때 503 을 돌려주는 것과 같은
   규칙입니다 (fail-closed). */
const { dbReady, dbInsert, dbSelect, dbWhy, dbCallService } = require("./_db.js");
/* ⚠️⚠️ **빌드가 적어 주는 목록입니다** (`build-pages.js` 의
   `writeSvcList()`). 손으로 고치지 마세요 — 분류를 늘리면 저절로
   따라옵니다. 없는 서비스 id 를 거르는 자리입니다 (§8). */
const SERVICES = require("./_services.js");
const { reqNo, telKey, intakeDup } = require("./_intake.js");
/* ⚠️ 로그인은 **거들기만** 합니다. 접수는 로그인 없이 들어오는 것이
   맞습니다 — 견적 하나 받으려고 가입하게 만들면 거기서 닫힙니다.
   토큰이 같이 왔을 때만 신청을 그 계정에 이어 둡니다 (§10). */
const { authReady, bearer, whoami } = require("./_auth.js");
const { gate, formOf, CLOSED_SAY } = require("./_gate.js");
const { consentFor } = require("./_consent.js");
const { runJob } = require("./_notify.js");
const { inArea, svcOk, OUT_SAY } = require("./_scope.js");

/* 유입 경로 — ⚠️⚠️ 연락처 · 상담 원문을 담지 않습니다. 화면이 보낸
   경로(/closure · /quote …)와 utm 값만, 글자를 좁혀서 받습니다. 숫자가
   여덟 개 넘게 붙어 있거나 @ 가 있으면 통째로 버립니다 (전화번호 ·
   메일이 섞였을 수 있습니다 · DB 의 request_src_ck 가 한 번 더 막습니다).
   ⚠️ 그래서 숫자가 아홉 개 넘게 들어간 경로도 같이 버립니다. */
function cleanSrc(v){
  const t = String(v || "").slice(0, 300);
  /* ⚠️ 하이픈으로 끊긴 전화번호(010-1234-5678)도 잡게 **숫자 개수**로 봅니다 */
  if(!t || t.replace(/[^0-9]/g, "").length >= 9 || t.indexOf("@") >= 0) return "";
  return /^[A-Za-z0-9/_\-.,:=|?&]+$/.test(t) ? t : "";
}

const KINDS = { quote:1, partner:1 };   /* sos 는 받지 않습니다 — 동의 상자를 보여 주는 화면이 없습니다 (2026-11-18) */

/* ── 신청 서비스 항목 (2026-10-17 §5-4 · §6 · §8) ─────────────────
   > §8 — "서버 측 필수값 검증 · **잘못된 서비스 ID 차단**"

   ⚠️⚠️ **없는 서비스는 통째로 거절하지 않고 그 항목만 뺍니다.** 밖으로
   퍼진 옛 링크가 지워진 분류를 들고 있을 수 있는데, 거기서 400 을
   돌려주면 손님은 아무 잘못도 안 하시고 "접수되지 않았습니다" 를
   봅니다 — 나머지 서비스는 멀쩡합니다 (접수를 잃는 쪽이 더 나쁩니다).
   ⚠️ 운영자에게는 남깁니다 (절대 규칙 3 — 손님 화면에는 안 적습니다).

   ⚠️⚠️ **스물까지입니다.** 분류가 스물여섯이라 그보다 많이 올 수가
   없는데, 요청을 손으로 만들면 얼마든지 보낼 수 있습니다 — 한 신청에
   항목 천 개가 들어오면 DB 와 슬랙 글이 같이 터집니다 (§8 "비정상적인
   대량 요청 방지"). */
function readItems(raw){
  if(!Array.isArray(raw)) return { items:[], bad:[] };
  const seen = {}, items = [], bad = [];
  for(const it of raw.slice(0, 20)){
    if(!it || typeof it !== "object") continue;
    const id = clean(it.id, 60);
    if(!id) continue;
    if(seen[id]) continue;                       /* §3-2 중복 금지 */
    if(SERVICES.indexOf(id) < 0){ bad.push(id); continue; }
    seen[id] = 1;
    /* ⚠️ 항목의 `detail` 도 스물까지입니다 — 서비스마다 질문이 최대
       다섯인데, 손으로 만든 요청을 막는 자리입니다. */
    const d = {};
    if(it.detail && typeof it.detail === "object"){
      for(const k of Object.keys(it.detail).slice(0, 20)){
        const key = clean(k, 30), val = clean(it.detail[k], 200);
        if(key && val) d[key] = val;
      }
    }
    items.push({ id:id, detail:d });
  }
  return { items:items, bad:bad };
}

/* 받아 보는 사람이 읽는 줄 — ⚠️ 기계가 읽는 것은 `items` 이고 둘은
   같은 것을 가리킵니다 (한쪽만 고치면 어긋납니다). */
function itemLines(items){
  if(!items.length) return [];
  const L = ["", "신청 서비스 " + items.length + "개"];
  items.forEach(function(it, i){
    L.push("  " + (i + 1) + ") " + it.id);
    Object.keys(it.detail).forEach(function(k){
      L.push("     · " + k + " — " + it.detail[k]);
    });
  });
  return L;
}

/* 서비스별 요청서의 추가 답(js/data/reqforms.js)을 사람이 읽을 줄로.
   ⚠️ 칸 이름과 값 둘 다 씻습니다 — 여기 들어온 것은 손님이 보낸 것이고,
   메일 제목·본문에 개행이 섞이면 헤더가 쪼개집니다. */
function detailLines(d){
  if(!d || typeof d !== "object") return [];
  /* ⚠️⚠️ **상한에 닿으면 뒤쪽 칸이 조용히 사라집니다.** 매물 내놓기
     (/sell)의 매장 항목이 딱 열둘이라, 하나만 더해도 에러 없이
     빠집니다 — 이 파일 머리말이 경고해 둔 "칸이 조용히 사라지는"
     그 자리입니다. 스물로 둡니다 (메일 한 통이 길어질 뿐입니다). */
  return Object.keys(d).slice(0, 20).map(function(k){
    const key = clean(k, 30), val = clean(d[k], 200);
    return (key && val) ? "  · " + key + " — " + val : null;
  }).filter(Boolean);
}

module.exports = async function handler(req, res){
  if(req.method !== "POST"){
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST 로 보내 주세요" });
  }

  /* ⚠️ 화면에서 온 것만 받습니다. 자물쇠가 아니라 문턱입니다 —
     진짜 속도 제한은 Vercel Firewall 에서 거세요. */
  if(!fromOurPages(req)){
    console.warn("[site] 우리 화면 밖에서 온 요청을 받지 않았습니다 (origin=" +
      (req.headers.origin || "없음") + ")");
    return res.status(403).json({ error: "잘못된 요청입니다" });
  }

  let b = req.body;
  if(typeof b === "string"){ try{ b = JSON.parse(b); }catch(e){ b = null; } }
  if(!b || typeof b !== "object") return res.status(400).json({ error: "내용을 읽지 못했습니다" });

  /* ── W01 ① 서버 게이트 — 동의 · 칸 검사보다 **먼저** 봅니다 ──────
     닫혀 있으면 DB · 웹훅 · 메일을 한 번도 부르지 않고 끝냅니다.
     ⚠️ 화면의 sosReady 를 믿지 않습니다 — 이 주소로 직접 보낸 요청도
     여기서 막힙니다. */
  {
    const g = gate(formOf(b));
    if(!g.open){
      console.warn("[site] 접수 게이트가 닫혀 있습니다 — " + g.why);
      res.setHeader("Cache-Control", "no-store");
      return res.status(503).json({ error: CLOSED_SAY, closed: true });
    }
  }
  if(b.agree !== true) return res.status(400).json({ error: "개인정보 수집·이용 동의가 필요합니다" });

  /* ⚠️ 모르는 종류를 견적으로 바꿔 받지 않습니다 — 그러면 손님이 보지 않은
     고지문에 동의했다는 증거가 남습니다 (2026-11-18 · sos 가 그랬습니다). */
  if(b.kind !== undefined && !KINDS[b.kind])
    return res.status(400).json({ error: "지금은 받지 않는 양식입니다" });
  const kind = KINDS[b.kind] ? b.kind : "quote";

  /* 어느 화면에서 왔든 공통 */
  const q = {
    kind:   kind,
    name:   clean(b.name, 80),
    tel:    clean(b.tel, 30),
    email:  clean(b.email, 120),
    region: clean(b.region, 80),
    at:     new Date().toISOString()
  };

  if(kind === "sos"){
    q.q   = clean(b.q, 4000);       /* 손님이 적은 상황 */
    q.cat = clean(b.cat, 40);       /* 빠른 선택 분류 */
    q.biz = clean(b.biz, 80);       /* 업종 */
  }
  else if(kind === "quote"){
    q.service     = clean(b.service, 40);
    q.serviceName = clean(b.serviceName, 60);
    q.q           = clean(b.q, 4000);
    q.budget      = clean(b.budget, 40);
    q.detail      = detailLines(b.detail);   /* 서비스마다 다른 답 */
    /* 2026-10-17 §5-4 — 신청 서비스 항목 (여러 개를 한 신청으로) */
    const got     = readItems(b.items);
    q.items       = got.items;
    /* ⚠️ 2026-11-18 T06 — 없는 서비스 id 를 조용히 빼고 받지 않습니다.
       빼고 받으면 손님은 고른 서비스가 빠진 줄 모릅니다. */
    if(got.bad.length){
      console.warn("[site] 없는 서비스 id 로 왔습니다 — " + got.bad.join(", "));
      return res.status(400).json({ error: "고르신 서비스를 다시 확인해 주세요" });
    }
    /* ⚠️⚠️ 2026-11-28 — **대표 분류(cat)** 를 여기서 정합니다. 전에는 q.cat 을 sos 에서만 채워서
       견적 · 매장 정리 상담 · 매물 접수가 **전부 cat 이 빈 채로** 저장됐습니다 (화면은 cat 을 보내는데
       서버가 버렸습니다). 그 바람에 관리자 목록에 분야 이름이 안 나오고, 신청 전체로 배정할 때
       '하는 일' 로 업체를 못 추렸고, 같은 분야 재접수 표시(near)도 안 걸렸습니다.
       기준 — ① 고르신 서비스가 있으면 **첫 번째 서비스의 분류** (demolish/full → demolish)
              ② 없으면 화면이 보낸 cat 의 분류 (매물: transfer · asset / 분야에서 들어온 견적: ?c=)
              ③ 둘 다 없으면('잘 모르겠어요' 만) 비워 둡니다 — 지어내지 않습니다.
       ⚠️ 분류 목록(_services.js)에 없는 값은 버립니다. 하위까지 적지 않습니다 — 하위는 항목(request_item)에 있습니다. */
    const catOf = function(id){ const k = String(id || "").split("/")[0]; return SERVICES.indexOf(k) >= 0 ? k : ""; };
    q.cat = (q.items.length ? catOf(q.items[0].id) : "") || catOf(clean(b.cat, 60));
    /* 해결 가이드에서 고르신 "업체에 물어볼 것".
       ⚠️ 이건 사장님이 업체에게 **대신 물어봐 달라고 맡기신 것**입니다.
       빠뜨리면 요청은 성공하는데 정작 물어볼 것이 사라집니다. */
    q.asks        = (Array.isArray(b.asks) ? b.asks : [])
                      .slice(0, 20)
                      .map(function(x){ return clean(x, 200); })
                      .filter(Boolean);
  }
  else {                             /* partner */
    q.company = clean(b.company, 80);
    q.brn     = clean(b.brn, 40);
    q.exp     = clean(b.exp, 200);
    q.note    = clean(b.note, 2000);
    q.services = (Array.isArray(b.serviceNames) && b.serviceNames.length
                    ? b.serviceNames : (Array.isArray(b.services) ? b.services : []))
                 .slice(0, 40).map(function(s){ return clean(s, 40); }).filter(Boolean);
  }

  /* ── 매장 정리 상담 (form = "close") — 2026-11-18 STOREWAY 1차 ─────
     ⚠️⚠️ 화면이 막아도 여기서 한 번 더 봅니다 — 이 주소로 직접 보내면
     화면을 거치지 않습니다.
       ① 정리 분류(양도 · 집기 · 철거 · 원상복구 · 폐기물)의 서비스만
       ② 초기 지역(안양 · 군포 · 의왕) 밖이면 접수하지 않음 (422)
       ③ 업종 · 정리 희망일은 필수 · 상담 내용은 선택 (비면 고르신 것으로 채움)
     ⚠️ 상황(side)은 손님이 고르지 않고 close 로 둡니다. */
  const isClose = formOf(b) === "close";
  if(isClose){
    if(kind !== "quote") return res.status(400).json({ error: "지금은 받지 않는 양식입니다" });
    /* 2026-11-27 — '잘 모르겠어요' 만 고르셔도 받습니다 (화면과 같은 규칙) */
    if(!q.items.length && b.unsure !== true) return res.status(400).json({ error: "필요한 서비스를 하나 이상 골라 주세요" });
    if(q.items.some(function(it){ return !svcOk(it.id); }))
      return res.status(400).json({ error: "매장 정리 상담에서는 양도 · 집기 처분 · 철거 · 원상복구 · 폐기물만 받습니다" });
    if(!inArea(clean(b.regionKey, 20), q.region, clean(b.gu, 40))){
      console.warn("[site] 매장 정리 상담 — 초기 지역 밖 (" + (q.region || "-") + " " + (clean(b.gu, 40) || "-") + ")");
      return res.status(422).json({ error: OUT_SAY, outArea: true });
    }
    /* 2026-11-27 대표 지시 — 업종 · 정리 희망일은 '추가 정보(선택)' 로 내려갔습니다. 화면도 막지 않습니다. */
    if(!q.q) q.q = "매장 정리 상담 — " + (q.items.length ? q.items.map(function(it){ return it.id; }).join(", ") : "서비스는 상담 후 정하기");
  }

  /* ── 빠진 것 확인 ─────────────────────────────────────────
     ⚠️ 화면에서도 막지만 여기서 한 번 더 봅니다. 이 주소로 직접
     보내는 것은 화면을 거치지 않습니다. */
  if(!q.name || !q.tel) return res.status(400).json({ error: "성함과 연락처를 적어 주세요" });
  if(kind === "partner"){
    if(!q.company)         return res.status(400).json({ error: "업체명을 적어 주세요" });
    if(!q.services.length) return res.status(400).json({ error: "어떤 일을 하시는지 골라 주세요" });
  }else{
    /* 2026-11-27 — 견적 · 매물은 **지역이 필수**입니다 (화면도 막습니다 · 매칭의 첫 조건).
       내용(q)은 선택이 됐습니다 — 비면 고르신 서비스로 채웁니다. 고르신 것도 내용도 없으면 받지 않습니다. */
    if(kind === "quote" && !q.region) return res.status(400).json({ error: "지역을 골라 주세요" });
    if(!q.q && kind === "quote"){
      const what = q.serviceName || (q.items || []).map(function(it){ return it.id; }).join(", ");
      if(what) q.q = "견적 요청 — " + what;
    }
    if(!q.q) return res.status(400).json({ error: "어떤 일인지 적어 주세요" });
  }

  /* ════════════════════════════════════════════════════════════
     §6 "모든 신청에 고유 신청번호를 발급한다"
     §6 "중복 신청과 스팸을 방지한다"

     ⚠️⚠️ **DB 가 없으면 접수번호를 발급하지 않습니다.** 번호를 내주고
     저장은 안 하면, 손님이 그 번호로 물어봐도 아무것도 없습니다 —
     그게 "하지 않은 일을 했다고 말하는 것" 입니다 (절대 규칙 5).
     번호는 **실제로 저장된 뒤에만** 손님에게 갑니다.

     ⚠️ 업체 입점(partner)은 신청이 아니라 **업체 등록 신청**이라 다른
     표로 갑니다 (`provider_apply` · 0016) — 바로 아래 블록입니다.
     ════════════════════════════════════════════════════════════ */
  /* ════════════════════════════════════════════════════════════
     W02 (2026-11-18) — 저장이 먼저이고, 저장이 **확정된 뒤에만** 성공입니다.

     ① 부모 요청 · 서비스 항목 · 동의 증거 · 알림 작업 · 감사기록을
        `submit_intake()`(입점은 `submit_apply()`) **한 번의 호출**로 적습니다.
        DB 안에서 한 트랜잭션이라 일부만 남는 신청이 없습니다 (0082).
     ② 그 호출이 실패하면 **503 이고 접수번호를 내주지 않습니다.**
        전에는 저장이 실패해도 슬랙으로 보내고 "접수됐다" 고 했습니다 —
        손님은 번호 없이 성공을 보고, DB 에는 아무것도 없었습니다.
     ③ 알림은 그 **뒤에** 따로 보냅니다 (api/_notify.js). 실패해도 접수는
        그대로이고 notify_job 에 남아 다시 보냅니다 (api/notify-retry.js).
     ④ 같은 멱등 키는 DB 가 먼저 받은 번호를 돌려줍니다 — 더블클릭 ·
        끊긴 뒤 재시도 · 동시에 두 번 들어온 경우가 전부 한 건입니다.
     ════════════════════════════════════════════════════════════ */
  const form = formOf(b);
  const idem = clean(b.idem, 80);
  const consent = consentFor(kind === "partner" ? "join" : form);   /* close 는 close 고지문 */
  if(!consent) return res.status(400).json({ error: "지금은 받지 않는 양식입니다" });

  /* 같은 연락처의 최근 접수 — **막지 않고** 운영자에게 표시만 합니다.
     ⚠️ 1시간에 5건을 넘는 것만 막습니다 (공유 IP 가 아니라 연락처 기준 —
     같은 사무실에서 여러 분이 보내셔도 막지 않습니다). 조회가 실패해도
     접수는 막지 않습니다. */
  /* 로그인하고 넣으셨으면 그 계정에 잇습니다 — 토큰을 Supabase 에 물어 나온
     값만 씁니다 (요청이 보낸 아이디를 믿지 않습니다).
     ⚠️⚠️ 2026-11-28 (SW-F65J-ZKVY) — 토큰을 **보냈는데** 확인이 안 되면 **저장하지 않습니다.**
     전에는 계정 없이 그대로 저장해서, 로그인한 줄 아는 손님의 신청이 모르는 사이
     비회원 접수가 되었습니다. 토큰을 안 보낸 손님(처음부터 비로그인)은 예전과 같습니다.
       거절(401 · 403)      → 401 + relogin:true — 화면이 '다시 로그인하고 계속하기' 를 냅니다
       확인이 늦거나 고장  → 503 — 아직 안 보냈으니 다시 누르시면 됩니다 (자동 비회원 전환 없음)
     ⚠️ 중복 검사보다 **앞**입니다 — 확인 안 된 요청에 먼저 받은 접수번호를 내주지 않습니다. */
  let uid = null;
  if(kind !== "partner" && authReady() && bearer(req)){
    const who = await whoami(bearer(req));
    if(who.ok) uid = who.sub;
    else if(!who.timeout && (who.status === 401 || who.status === 403)){
      console.warn("[site] 로그인이 풀린 채 보냈습니다 — 저장하지 않고 재로그인을 안내합니다");
      return res.status(401).json({ error:"로그인이 풀려 아직 보내지 않았습니다. 다시 로그인하고 계속해 주세요.", relogin:true });
    }else{
      console.warn("[site] 로그인을 확인하지 못해 아직 저장하지 않았습니다 — " + who.why);
      return res.status(503).json({ error:"로그인 확인이 늦어 아직 보내지 않았습니다. 잠시 뒤 다시 눌러 주세요." });
    }
  }

  let near = false;
  if(kind !== "partner"){
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const found = await dbSelect("request",
      "?select=no,tel,offer_id,cat,idem,created_at" +
      "&tel_key=eq." + encodeURIComponent(telKey(q.tel)) +
      "&created_at=gte." + encodeURIComponent(since) +
      "&order=created_at.desc&limit=20");
    if(!found.ok) console.error("[site] 중복 검사를 못 했습니다 — " + dbWhy(found.why));
    else {
      const dup = intakeDup(new Date(), found.rows,
        { tel:q.tel, offerId:clean(b.offerId, 60), cat:q.cat || q.service, idem:idem });
      if(dup.near) near = true;
      if(dup.dup){
        console.warn("[site] 중복 접수 — " + dup.why);
        return res.status(200).json({ ok:true, no:dup.no, dup:true, say:dup.say });
      }
      if(dup.spam){
        console.warn("[site] 접수가 너무 많습니다 — " + dup.why);
        return res.status(429).json({ error:dup.say });
      }
    }
  }

  const cand = reqNo();
  let saved;
  if(kind === "partner"){
    saved = await dbCallService("submit_apply", { p: {
      no: cand, company: q.company, brn: q.brn || null, name: q.name, tel: q.tel,
      email: q.email || null, region: q.region || null, industry: q.exp || null,
      services: q.services, note: q.note || null, consent: consent } });
  }else{
    saved = await dbCallService("submit_intake", { p: {
      /* ⚠️ DB 의 양식 값은 quote 입니다 — 매장 정리 상담도 견적 요청이고,
         어느 접수 길인지는 channel 로 따로 적습니다 (0084). */
      no: cand, idem: idem || null, form: isClose ? "quote" : form,
      user_id: uid,
      side: isClose ? "close" : (clean(b.side, 20) || "start"),
      industry: clean(b.industry, 40) || null,
      cat: q.cat || q.service || null,
      offer_id: clean(b.offerId, 60) || null,
      region: q.region || null,
      gu: clean(b.gu, 40) || null,
      want_at: clean(b.wantAt, 40) || null,
      body: q.q || null,
      detail: (b.detail && typeof b.detail === "object" && !Array.isArray(b.detail)) ? b.detail : {},
      name: q.name, tel: q.tel, email: q.email || null,
      notify: b.notify === true,
      items: q.items || [],
      consent: consent } });
  }

  /* ② 저장이 확정되지 않았으면 성공이라 하지 않습니다 */
  const got = saved.ok && saved.data && typeof saved.data === "object" ? saved.data : null;
  if(!got || !got.no){
    console.error("[site] 접수를 저장하지 못했습니다 — " + dbWhy(saved.why || "no_row"));
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).json({ error: "지금 접수하지 못했습니다. 적어 주신 내용은 그대로 두었으니 잠시 뒤 다시 보내 주세요." });
  }
  /* 2026-11-28 — 완료 화면이 **저장된 실제 상태**를 내도록 그 줄의 상태를 읽어 돌려줍니다.
     ⚠️ 못 읽으면 상태를 지어내지 않고 비웁니다 (화면은 '접수됨' 줄을 안 그립니다).
     linked — 로그인한 채로 보내 계정에 이어졌는가 (화면이 '내 신청 보기' 를 낼지 가릅니다). */
  let stNow = "";
  if(kind !== "partner"){
    const rs = await dbSelect("request", "?select=state&no=eq." + encodeURIComponent(got.no) + "&limit=1");
    if(rs.ok && rs.rows[0]) stNow = String(rs.rows[0].state || "");
  }
  const linked = !!uid;
  if(got.dup){
    console.warn("[site] 같은 신청서를 다시 보내셨습니다 — " + got.no);
    return res.status(200).json({ ok:true, no:got.no, dup:true, state:stNow, linked:linked, say:"이미 접수되었습니다." });
  }

  /* ②-1 접수 길 · 유입 경로 (0084) — ⚠️ 연락처 · 원문 없이. 실패해도
     접수는 성공입니다 (기록은 거들기입니다). */
  if(kind !== "partner"){
    const meta = await dbCallService("note_intake_meta",
      { p_no: got.no, p_channel: form, p_src: cleanSrc(b.src) || null });
    if(!meta.ok) console.warn("[site] 접수 길을 적지 못했습니다 — " + dbWhy(meta.why));
  }

  /* ③ 알림 — 저장과 따로. 실패해도 응답은 성공입니다 (저장이 끝났으니까요).
     ⚠️ await 로 기다립니다 — 서버리스는 응답 뒤 멈춰서 안 기다리면 사라집니다. */
  const info = { form: kind === "partner" ? "join" : form, no: got.no,
                 services: kind === "partner" ? q.services
                   : (q.items || []).map(function(x){ return x && (x.name || x.id); }).filter(Boolean)
                       .concat(q.serviceName && !(q.items || []).length ? [q.serviceName] : []),
                 region: q.region || "", near: near, email: q.email || "" };
  for(const job of (Array.isArray(got.jobs) ? got.jobs : [])){
    try{ await runJob(job, info); }
    catch(e){ console.error("[site] 알림 작업이 터졌습니다 — " + (e && e.message)); }
  }

  res.status(200).json({ ok:true, no:got.no, state:stNow, linked:linked });
};


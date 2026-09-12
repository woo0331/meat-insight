/* ════════════════════════════════════════════════════════════════════
   알림을 어디로 어떻게 보내는가 — **이 파일 한 곳**에만 적습니다.

   ⚠️ 운영자가 확인해야 하는 곳입니다.
      개발 환경에서는 api.solapi.com 이 막혀 있어(403) **실제 응답을
      한 번도 못 봤습니다.** 축평원 때와 같은 규율을 씁니다 —
      추측한 모양을 코드에 박아 두고 "된다" 고 말하지 않습니다.

        node tools/notify-send.js --probe    보낼 내용을 그대로 보여줌 (안 보냄)
        node tools/notify-send.js --dry      대행사까지 붙되 실제 발송은 안 함

      응답이 다르면 아래 SEND · parseResult 만 고치면 됩니다.

   숫자를 지어내지 않는다(CLAUDE.md 3번)는 여기에도 걸립니다.
   전화번호가 없으면 **보낸 척하지 않고 skipped 로 남깁니다.**
   ════════════════════════════════════════════════════════════════════ */

"use strict";
const crypto = require("crypto");

/* ── 전화번호 ──────────────────────────────────────────────────────
   01012345678 형태로 맞춥니다. 아니면 null — 아무 데나 보내면 안 됩니다. */
function normPhone(v){
  const d = String(v == null ? "" : v).replace(/[^0-9]/g, "");
  if (/^82(1[0-9]{8,9})$/.test(d)) return "0" + d.slice(2);   /* +8210… */
  /* 01012345678 은 11자리입니다 — 01 + 9. 예전에 {7,8} 로 적어 두어
     정작 제일 흔한 010-1234-5678 이 통째로 걸러졌습니다. */
  if (/^01[0-9]{8,9}$/.test(d)) return d;                     /* 010…   */
  if (/^0[2-6][0-9]{7,9}$/.test(d)) return d;                 /* 지역번호 */
  return null;
}

/* ── 알림톡 템플릿 ─────────────────────────────────────────────────
   ⚠️ 아래 text 는 **대행사 콘솔에 등록한 문구와 글자 하나까지 같아야**
      합니다. 다르면 발송이 거절됩니다. 심사 통과용으로 지켜야 할 것:
        · 광고성 문구 금지 ("지금 가입", "할인", "이벤트" 등)
        · 치환자(#{…})만으로 이루어진 줄은 반려됩니다 — 고정 문구를 답니다
        · 정보성 메시지라 수신동의는 필요 없지만, 밤에는 안 보냅니다
          (조용한 시간은 db/phase8_notify.sql 의 트리거가 처리합니다)

   templateId 는 승인 뒤 대행사가 줍니다. 저장소에 두지 않고 Secrets 로
   받습니다 — 아래 idEnv 이름이 그 Secret 이름입니다. */
const TEMPLATES = {
  request: {
    idEnv: "ALIMTALK_TPL_REQUEST",
    name: "새 요청 등록 안내",
    text:
      "[고리] 새 요청이 등록되었습니다\n\n" +
      "▪ 분야 : #{분야}\n" +
      "▪ 지역 : #{지역}\n" +
      "▪ 내용 : #{내용}\n\n" +
      "요청 내용을 확인하고 견적을 보내실 수 있습니다.",
    button: { name: "요청 확인하기", path: "#{링크}" },
    vars(row){
      const [cat, region] = splitBody(row.body);
      return { "분야": cat || "요청", "지역": region || "전국",
               "내용": trim(row.title || row.body || "새 요청", 40),
               "링크": linkOf(row) };
    },
  },
  quote: {
    idEnv: "ALIMTALK_TPL_QUOTE",
    name: "견적 도착 안내",
    text:
      "[고리] 견적이 도착했습니다\n\n" +
      "▪ 요청 : #{요청}\n" +
      "▪ 내용 : #{내용}\n\n" +
      "받으신 견적을 비교해 보실 수 있습니다.",
    button: { name: "견적 확인하기", path: "#{링크}" },
    vars(row){
      return { "요청": trim(row.title || "요청", 40),
               "내용": trim(row.body || "새 견적", 40),
               "링크": linkOf(row) };
    },
  },
  selected: {
    idEnv: "ALIMTALK_TPL_SELECTED",
    name: "견적 선택 안내",
    text:
      "[고리] 보내신 견적이 선택되었습니다\n\n" +
      "▪ 요청 : #{요청}\n\n" +
      "요청자와 연결되었습니다. 세부 조건을 협의해 주세요.",
    button: { name: "거래 확인하기", path: "#{링크}" },
    vars(row){
      return { "요청": trim(row.body || row.title || "요청", 40), "링크": linkOf(row) };
    },
  },
};

const SITE = "https://aboutmeat.co.kr/";

/* notifications.link 는 "req:<id>" · "chat:<id>" 꼴입니다 (14_router 의 RT_SEG2PG 와 짝) */
function linkOf(row){
  const s = String(row && row.link || "");
  const i = s.indexOf(":");
  if (i < 0) return SITE;
  const kind = s.slice(0, i), id = s.slice(i + 1);
  const seg = { req: "req", chat: "chat", order: "order", sup: "sup" }[kind];
  return seg && id ? SITE + "#/" + seg + "/" + encodeURIComponent(id) : SITE;
}
function trim(v, n){
  const s = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
/* 트리거가 만든 body 는 "한우 등심 300kg · 경기" 꼴입니다 */
function splitBody(body){
  const s = String(body == null ? "" : body);
  const i = s.lastIndexOf(" · ");
  return i < 0 ? [s, ""] : [s.slice(0, i), s.slice(i + 3)];
}

/* #{변수} 를 실제 값으로 — 알림톡은 대행사가 치환하지만, 문자와
   --probe 는 우리가 직접 만들어야 합니다. */
function render(text, vars){
  return String(text).replace(/#\{([^}]+)\}/g, (m, k) =>
    (vars && vars[k] != null) ? String(vars[k]) : m);
}

/* 알림톡을 못 쓸 때(심사 전 · 실패) 나가는 문자. 짧게 — 길면 LMS 로
   올라가고 요금이 뜁니다. 링크는 반드시 남깁니다. */
function smsText(row){
  const t = TEMPLATES[row.kind];
  const head = "[고리] " + trim(row.title || "알림", 24);
  const body = trim(row.body || "", 40);
  const url  = t ? linkOf(row) : SITE;
  return (head + "\n" + (body ? body + "\n" : "") + url).slice(0, 300);
}

/* ── 대행사 (솔라피) ────────────────────────────────────────────────
   ⚠️ 아래 주소·본문 모양은 **확인 전입니다.** --probe 로 한 번 받아 보고
      다르면 이 블록만 고치면 됩니다. 다른 대행사로 갈아탈 때도 여기만
      바꾸면 나머지 코드는 그대로입니다. */
const SEND = {
  name: "솔라피",
  url: "https://api.solapi.com/messages/v4/send-many/detail",
  /* 솔라피는 HMAC-SHA256 서명을 헤더에 답니다.
     signature = HMAC-SHA256(date + salt, apiSecret) 를 hex 로. */
  headers(key, secret){
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(32).toString("hex");
    const sig  = crypto.createHmac("sha256", secret).update(date + salt).digest("hex");
    return {
      "Content-Type": "application/json",
      Authorization: "HMAC-SHA256 apiKey=" + key + ", date=" + date +
                     ", salt=" + salt + ", signature=" + sig,
    };
  },
  /* 한 번에 여러 건. 알림톡 템플릿이 있으면 알림톡으로 나가고,
     실패하면 대행사가 같은 내용을 문자로 대신 보냅니다(disableSms:false). */
  body(msgs, cfg){
    return JSON.stringify({
      messages: msgs.map(m => {
        const one = { to: m.to, from: cfg.from, text: m.sms };
        if (m.templateId && cfg.pfId){
          one.kakaoOptions = {
            pfId: cfg.pfId,
            templateId: m.templateId,
            variables: m.vars,
            disableSms: false,          /* 알림톡 실패 시 문자로 대체 */
          };
        }
        return one;
      }),
    });
  },
  /* 보낸 뒤 결과를 한 건씩 알아봅니다. 모양이 다르면 여기만 고칩니다. */
  parseResult(json){
    const out = [];
    const list = (json && (json.messageList || json.results || json.messages)) || null;
    if (Array.isArray(list)){
      for (const r of list){
        out.push({
          to: r.to || r.receiver || null,
          id: r.messageId || r.messageid || r.mid || null,
          ok: !r.statusCode || /^[23]/.test(String(r.statusCode)),
          error: r.statusMessage || r.reason || null,
        });
      }
    } else if (list && typeof list === "object"){
      for (const k of Object.keys(list)){
        const r = list[k] || {};
        out.push({ to: r.to || null, id: k,
                   ok: !r.statusCode || /^[23]/.test(String(r.statusCode)),
                   error: r.statusMessage || null });
      }
    }
    return out;
  },
};

module.exports = { TEMPLATES, SEND, SITE, normPhone, render, smsText, linkOf, trim, splitBody };

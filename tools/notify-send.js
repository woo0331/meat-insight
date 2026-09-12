#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════
   밀린 알림을 카카오 알림톡(없으면 문자)으로 내보냅니다.

   지금까지 알림은 notifications 표에 행 하나가 들어가는 게 전부였습니다.
   업체가 고리에 들어와 종을 눌러야 보이는데, 사장님들은 안 들어옵니다.
   요청이 올라와도 아무도 모르고 요청자는 견적을 못 받습니다.

     node tools/notify-send.js --probe     보낼 내용을 그대로 보여줌 (안 보냄)
     node tools/notify-send.js --dry       본문까지 만들고 발송만 안 함
     node tools/notify-send.js             실제로 보냄

   환경변수
     SUPABASE_URL          https://xxxx.supabase.co
     SUPABASE_SERVICE_KEY  service_role — ⚠️ 저장소에 넣지 마세요 (Secrets 만)
     SOLAPI_KEY            대행사 API 키
     SOLAPI_SECRET         대행사 API 시크릿
     SOLAPI_FROM           발신번호 (사전 등록된 번호여야 합니다)
     ALIMTALK_PFID         카카오 발신프로필 키 — 없으면 문자로만 나갑니다
     ALIMTALK_TPL_REQUEST / _QUOTE / _SELECTED   승인된 템플릿 id

   ⚠️ 지어내지 않습니다 (CLAUDE.md 3번).
      전화번호가 없으면 보낸 척하지 않고 skipped 로 남깁니다.
      대행사가 실패를 주면 failed 로 남기고 다음 차례에 다시 시도합니다.
   ════════════════════════════════════════════════════════════════════ */

"use strict";
const { TEMPLATES, SEND, normPhone, render, smsText } = require("./notify-sources.js");

const ARGS  = process.argv.slice(2);
const has   = f => ARGS.some(a => a === "--" + f);
const val   = f => { const a = ARGS.find(x => x.startsWith("--" + f + "=")); return a ? a.slice(f.length + 3) : null; };
const PROBE = has("probe"), DRY = has("dry");
const LIMIT = Number(val("limit") || 100);
const MAX_TRIES = 3;

function die(msg){ console.error("✗ " + msg); process.exit(1); }
function log(msg){ console.log(msg); }

/* ── Supabase ─────────────────────────────────────────────────────── */
function sbCfg(){
  const url = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  if (!url || !key) die("SUPABASE_URL · SUPABASE_SERVICE_KEY 가 필요합니다.");
  return { url, key };
}
async function rest(path, opts){
  const { url, key } = sbCfg();
  const r = await fetch(url + "/rest/v1/" + path, Object.assign({}, opts, {
    headers: Object.assign({
      apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json",
    }, (opts && opts.headers) || {}),
  }));
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch(e){}
  if (!r.ok) die("Supabase HTTP " + r.status + " — " + t.slice(0, 400));
  return j;
}

/* ── 받는 사람 번호 찾기 ────────────────────────────────────────────
   알림은 user_id 로만 옵니다. 번호는 업체(suppliers.contact) 또는
   요청자(purchase_requests.buyer_phone) 쪽에 있습니다. */
async function phoneMap(userIds){
  const map = {};
  if (!userIds.length) return map;
  const inList = "(" + userIds.map(u => '"' + u + '"').join(",") + ")";
  const put = (rows, f) => (rows || []).forEach(r => {
    const p = normPhone(r[f]);
    if (p && r.user_id && !map[r.user_id]) map[r.user_id] = p;
  });
  try { put(await rest("suppliers?select=user_id,contact&user_id=in." + inList), "contact"); } catch(e){}
  try {
    put(await rest("purchase_requests?select=user_id,buyer_phone&user_id=in." + inList
                 + "&order=created_at.desc&limit=500"), "buyer_phone");
  } catch(e){}
  return map;
}

/* ── 한 줄을 보낼 메시지로 ──────────────────────────────────────────
   템플릿이 없는 종류(chat · dayjob 등)는 아직 안 보냅니다. 심사는
   템플릿마다 따로 받아야 해서, 셋부터 시작합니다. */
function toMessage(row, phone, cfg){
  const tpl = TEMPLATES[row.kind];
  const templateId = tpl ? (process.env[tpl.idEnv] || "") : "";
  const vars = tpl ? tpl.vars(row) : {};
  return {
    outboxId: row.id,
    to: phone,
    kind: row.kind,
    templateId: (cfg.pfId && templateId) ? templateId : null,
    vars,
    sms: smsText(row),
    preview: tpl ? render(tpl.text, vars) : smsText(row),
  };
}

async function markAll(updates){
  for (const u of updates){
    const { id, ...patch } = u;
    try { await rest("notify_outbox?id=eq." + id, { method: "PATCH", body: JSON.stringify(patch) }); }
    catch(e){ console.error("  기록 실패 id=" + id); }
  }
}

(async function main(){
  const cfg = {
    key:    process.env.SOLAPI_KEY    || "",
    secret: process.env.SOLAPI_SECRET || "",
    from:   normPhone(process.env.SOLAPI_FROM || ""),
    pfId:   process.env.ALIMTALK_PFID || "",
  };

  const now  = new Date().toISOString();
  const rows = await rest("notify_outbox?select=*"
    + "&status=eq.pending&send_after=lte." + now
    + "&order=send_after.asc&limit=" + LIMIT) || [];

  if (!rows.length){ log("보낼 알림이 없습니다."); return; }
  log("밀린 알림 " + rows.length + "건");

  /* 번호 찾기 — 없으면 보낸 척하지 않고 skipped.
     ① 큐에 이미 번호가 적혀 있으면 그대로 (운영자가 대신 등록한 업체는
        계정이 없어서 phase9 트리거가 suppliers.contact 를 같이 담습니다)
     ② 아니면 user_id 로 업체·요청자 쪽에서 찾습니다 */
  const map  = await phoneMap([...new Set(rows.map(r => r.user_id).filter(Boolean))]);
  const msgs = [], skip = [];
  for (const r of rows){
    const phone = normPhone(r.to_phone) || map[r.user_id];
    if (!phone){ skip.push({ id: r.id, status: "skipped", error: "전화번호 없음", tries: (r.tries || 0) + 1 }); continue; }
    msgs.push(toMessage(r, phone, cfg));
  }

  if (PROBE){
    log("\n── 보낼 내용 (실제로는 안 보냅니다) ──");
    msgs.slice(0, 20).forEach(m => {
      log("\n▸ " + m.to + "  [" + m.kind + (m.templateId ? " · 알림톡" : " · 문자") + "]");
      log(m.preview.split("\n").map(s => "   " + s).join("\n"));
    });
    if (skip.length) log("\n번호가 없어 건너뛸 것: " + skip.length + "건");
    log("\n실제로 보내려면 --probe 를 빼고 다시 돌리세요.");
    return;
  }

  if (skip.length){ await markAll(skip); log("번호 없음 " + skip.length + "건은 건너뜁니다."); }
  if (!msgs.length){ log("보낼 수 있는 알림이 없습니다."); return; }

  if (!cfg.key || !cfg.secret) die("SOLAPI_KEY · SOLAPI_SECRET 가 없습니다. 대행사에 가입하고 Secrets 에 넣어 주세요.");
  if (!cfg.from) die("SOLAPI_FROM (발신번호) 가 없거나 형식이 틀렸습니다. 사전 등록된 번호여야 합니다.");
  if (!cfg.pfId) log("⚠️ ALIMTALK_PFID 가 없어 문자로만 보냅니다 (알림톡 심사 전이면 정상입니다).");

  const body = SEND.body(msgs, cfg);
  if (DRY){
    log("\n── 대행사에 보낼 본문 ──\n" + body.slice(0, 2000));
    log("\n실제로 보내려면 --dry 를 빼고 다시 돌리세요.");
    return;
  }

  const res  = await fetch(SEND.url, { method: "POST", headers: SEND.headers(cfg.key, cfg.secret), body });
  const text = await res.text();
  if (!res.ok) die("대행사 HTTP " + res.status + "\n" + text.slice(0, 800));

  let json = null; try { json = JSON.parse(text); } catch(e){
    die("대행사 응답이 JSON 이 아닙니다. --probe 로 확인해 주세요.\n" + text.slice(0, 400));
  }

  /* 결과를 번호로 맞춰 적습니다. 못 맞추면 성공으로 치지 않습니다 —
     보냈는지 모르는 것을 "보냈다" 고 적으면 안 됩니다. */
  const results = SEND.parseResult(json);
  const byPhone = {};
  results.forEach(r => { const p = normPhone(r.to); if (p) byPhone[p] = r; });

  const done = [], sentAt = new Date().toISOString();
  let ok = 0, bad = 0;
  for (const m of msgs){
    const r = byPhone[m.to];
    const row = rows.find(x => x.id === m.outboxId) || {};
    const tries = (row.tries || 0) + 1;
    if (r && r.ok){
      ok++;
      done.push({ id: m.outboxId, status: "sent", tries, sent_at: sentAt,
                  to_phone: m.to, channel: m.templateId ? "alimtalk" : "sms",
                  provider_id: r.id || null, error: null });
    } else {
      bad++;
      const err = (r && r.error) || "대행사 응답에서 결과를 못 찾았습니다";
      done.push({ id: m.outboxId, to_phone: m.to, tries,
                  status: tries >= MAX_TRIES ? "failed" : "pending", error: String(err).slice(0, 300) });
    }
  }
  await markAll(done);
  log("✓ 보냄 " + ok + "건" + (bad ? " · 실패 " + bad + "건 (다음 차례에 다시 시도)" : ""));
})().catch(e => die(e && e.stack ? e.stack : String(e)));

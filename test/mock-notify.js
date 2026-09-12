/* notify-send.js 를 시험하기 위한 최소 PostgREST 흉내.
   notify_outbox 를 읽고 PATCH 로 상태를 적는 것까지만 흉내 냅니다.
   PATCH 로 들어온 내용을 기억했다가 /__patched 로 보여줍니다. */
const http = require("http");
const PORT = Number(process.argv[2] || 8921);

const OUTBOX = [
  { id:1, notification_id:"n1", user_id:"u-sup", kind:"request", tries:0, status:"pending",
    title:"한우 등심 300kg", body:"원육 구매 · 경기 포천시", link:"req:r1",
    send_after:"2020-01-01T00:00:00Z" },
  { id:2, notification_id:"n2", user_id:"u-buyer", kind:"quote", tries:0, status:"pending",
    title:"한우 등심 300kg", body:"합신식 도축장이 견적을 보냈습니다.", link:"req:r1",
    send_after:"2020-01-01T00:00:00Z" },
  /* 번호를 어디에서도 못 찾는 사람 — 보낸 척하면 안 됩니다 */
  { id:3, notification_id:"n3", user_id:"u-ghost", kind:"request", tries:0, status:"pending",
    title:"돼지 삼겹살", body:"원육 구매 · 충남", link:"req:r2",
    send_after:"2020-01-01T00:00:00Z" },
  /* 아직 때가 안 된 것 (조용한 시간에 생겨 아침으로 밀린 것) */
  { id:4, notification_id:"n4", user_id:"u-sup", kind:"request", tries:0, status:"pending",
    title:"새벽에 올라온 요청", body:"원육 구매 · 전북", link:"req:r3",
    send_after:"2999-01-01T00:00:00Z" },
];
const SUPPLIERS = [{ user_id:"u-sup", contact:"010-1234-5678" }];
const REQUESTS  = [{ user_id:"u-buyer", buyer_phone:"010-9999-0000" },
                   { user_id:"u-ghost", buyer_phone:"연락처 없음" }];   /* 못 읽는 번호 */

const PATCHED = [];

function send(res, code, obj){
  const b = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type":"application/json", "Content-Length":Buffer.byteLength(b) });
  res.end(b);
}
function qs(url){ return new URL(url, "http://x").searchParams; }

http.createServer((req, res) => {
  const url = req.url || "";
  if (url === "/__patched") return send(res, 200, { patched: PATCHED });

  const path = url.replace(/^\/rest\/v1\//, "").split("?")[0];
  const p = qs(url);

  if (req.method === "GET" && path === "notify_outbox"){
    const due = String(p.get("send_after") || "").replace(/^lte\./, "");
    const st  = String(p.get("status") || "").replace(/^eq\./, "");
    let rows = OUTBOX.filter(r => (!st || r.status === st) && (!due || r.send_after <= due));
    rows.sort((a, b) => a.send_after.localeCompare(b.send_after));
    return send(res, 200, rows.slice(0, Number(p.get("limit") || 100)));
  }
  if (req.method === "GET" && path === "suppliers")          return send(res, 200, SUPPLIERS);
  if (req.method === "GET" && path === "purchase_requests")  return send(res, 200, REQUESTS);

  if (req.method === "PATCH" && path === "notify_outbox"){
    let body = ""; req.on("data", d => body += d);
    return req.on("end", () => {
      const id = String(p.get("id") || "").replace(/^eq\./, "");
      let patch = {}; try { patch = JSON.parse(body); } catch(e){}
      PATCHED.push(Object.assign({ id: Number(id) }, patch));
      send(res, 200, []);
    });
  }
  send(res, 404, { message: "not mocked: " + req.method + " " + path });
}).listen(PORT, () => console.log("mock notify :" + PORT));

/* ════════════════════════════════════════════════════════════════════
   로그인한 뒤에 그려지는 화면을 **흉내로 열어 주는 장치** — 한 곳

   ⚠️⚠️⚠️ **이 파일이 왜 따로 있나.** `/desk` · `/admin` · `/my` 의
   알맹이는 **로그인한 뒤에** 그려집니다. 그래서 —
     · `check-screens` · `check-a11y` 는 **빈 상자**만 봅니다 (늘 초록)
     · `tools/shot.js` 도 **빈 상자**만 찍습니다
   둘을 쓰려면 `/api/session` 과 Supabase 를 흉내 내야 하고, 그 장치가
   `tools/test-desk.js` **안에만** 있었습니다.

   ⚠️⚠️ **베껴 쓰면 찍는 화면과 재는 화면이 조용히 달라집니다.** 이
   저장소가 그 자리를 세 번 겪었습니다 (업체 카드 · 0곳 상자 · 분류
   화면이 "여쭙는다" 고 적은 것). 그래서 **한 곳**에 두고 재는 쪽
   (`test-desk.js`)과 찍는 쪽(`shot-desk.js`)이 **같은 함수**를
   부릅니다 — 한쪽만 고치는 날이 오지 않게.

   ⚠️ 가짜 자료(fixtures)는 **옮기지 않았습니다.** 그것은 규칙이 아니라
   **값**이고, 재는 쪽은 경계값을, 찍는 쪽은 "사람이 볼 만한 값" 을
   넣어야 합니다 — 섞으면 둘 다 어색해집니다.
   ⚠️⚠️ 대신 **그 둘이 같은 길을 지나는지**는 이 파일 하나가 보장합니다
   (보내는 주소 · 헤더 · 돌려주는 꼴).

   ⚠️ `FAKE` 는 운영 CSP(`connect-src`)가 허락하는 꼴이어야 합니다 —
   좁히면 검사가 같이 떨어집니다. 그게 맞습니다.
   ════════════════════════════════════════════════════════════════════ */
const FAKE = "https://sb-test.supabase.co";

/* ── 가짜 Supabase ────────────────────────────────────────────────── */
function stub(p, who, tables, rpcs, up){
  const sent = [];
  return Promise.all([
    /* ⚠️⚠️ **버킷이 설정되기 전에는 `{up:false}` 입니다** — 그때는
       사진 칸이 **아예 안 그려져야** 합니다 (단추도 · "준비 중" 도
       없습니다). 지금 운영이 그 상태라, 그 길을 먼저 잽니다. */
    p.route("**/api/upload*", function(r){
      const u = r.request().url();
      /* ⚠️ 보내는 **꾸러미까지** 적어 둡니다 — 주소만 적어 두면
         "버킷 이름을 화면이 고르지 않는가" 를 잴 수가 없습니다
         (0051 이 세운 규칙: 버킷은 서버가 경로를 보고 고릅니다). */
      sent.push({ name:"upload",
                  body: r.request().method() + " " + u +
                        " " + (r.request().postData() || "") });
      if(!up) return r.fulfill({ status:200, contentType:"application/json",
                                 body: JSON.stringify({ up:false }) });
      if(u.indexOf("p=") >= 0)
        return r.fulfill({ status:200, contentType:"application/json",
          body: JSON.stringify({ ok:true, url:"https://sb-test.supabase.co/x.jpg",
                                 mime:"image/jpeg", bytes:1234 }) });
      /* ⚠️⚠️⚠️ **`pvPhoto` · `pvDoc` 이 빠져 있었습니다** — `up` 만
         돌려주고 있어서 `js/deskphoto.js`(0051 의 /desk 사진 화면)가
         **한 번도 안 그려졌습니다.** 그래서 그 화면은 검사 0건인데
         작업 기억에는 "test-desk 가 누른다" 고 적혀 있었습니다
         (**없는 안전을 있다고** 읽은 자리입니다). 찍어 보다가
         그 상자가 안 나와서 알았습니다.
         ⚠️ 돌려주는 꼴은 `api/upload.js` 의 GET 과 **같아야** 합니다 —
         거기는 셋을 따로 냅니다 (공개 버킷이 없으면 시설 사진만
         안 되고 서류는 됩니다). */
      /* ⚠️⚠️ 0059 — 게시판 글 사진(`cqq=`)은 **주소를 서버가 짓습니다**.
         브라우저는 버킷 이름을 모르므로 그 목록을 여기서 흉내 냅니다.
         ⚠️ 그 사진 목록은 `photos` 로 줍니다 (`api/upload.js` 의 GET 과
         **같은 꼴**이어야 합니다 — 다르면 그 차이만큼이 영원히 안 재는
         자리가 됩니다). */
      if(u.indexOf("cqq=") >= 0)
        return r.fulfill({ status:200, contentType:"application/json",
          body: JSON.stringify({ photos: (up && up.photos) ? up.photos : [] }) });
      /* ⚠️⚠️ 0068 — 매물 사진(`lstq=`)도 **주소를 서버가 짓습니다**.
         ⚠️ 꼴은 `api/upload.js` 의 GET 과 **같아야** 합니다
         (`{ok:true, photos:[{id,caption,ord,url}]}`) — 다르면 그 차이만큼이
         영원히 안 재는 자리가 됩니다.
         ⚠️⚠️ **차례(`ord`)는 0069 가 더했습니다** — 진짜는 `ord` 차례로
         냅니다. 화면은 받은 **줄 차례**로 「앞으로 · 뒤로」를 세므로 이
         흉내가 주는 차례가 곧 그 차례입니다(섞어 주면 멀쩡한 화면이
         엉뚱한 차례를 보냅니다). */
      if(u.indexOf("lstq=") >= 0)
        return r.fulfill({ status:200, contentType:"application/json",
          body: JSON.stringify({ ok:true,
            photos: (up && up.lphotos) ? up.lphotos : [] }) });
      /* ⚠️⚠️⚠️ **올릴 자리를 청하는 것은 POST 입니다** — 주소에 질의가
         없어서 앞의 가지들로는 안 갈립니다. 여기를 안 내주면 사진을
         올리는 길이 **한 번도 안 돌고**, 그래도 상자는 그려지므로
         "눌러 보는 검사가 있다" 로 읽힙니다 (0051 에서 흉내가 `pvPhoto`
         를 안 줘서 상자가 아예 안 그려졌던 자리의 거울상입니다). */
      if(r.request().method() === "POST")
        return r.fulfill({ status:200, contentType:"application/json",
          body: JSON.stringify({ ok:true, id:"f-new",
                                 url: FAKE + "/storage/v1/upload/sign/x" }) });
      return r.fulfill({ status:200, contentType:"application/json",
                         body: JSON.stringify({ up:true, pvPhoto:true, pvDoc:true,
                                                cqPhoto:true,
                                                /* ⚠️ 0064 — 광고 소재. 없으면
                                                   /admin 이 그 칸을 안 냅니다 */
                                                adImg:true,
                                                /* ⚠️ 0068 — 매물 사진. 없으면
                                                   사진 상자가 안 그려집니다 */
                                                lstPhoto:true }) });
    }),
    p.route("**/api/session", function(r){
      /* ⚠️⚠️ 0064 — `pubBucket` 은 **공개 버킷 이름**입니다 (`publicConf()`).
         브라우저가 광고 소재의 주소를 그것으로 짓습니다 — 없으면 소재가
         한 장도 안 그려집니다.
         ⚠️ 진짜는 `PROVIDER_BUCKET` 이 없으면 **칸째 안 내려보냅니다**.
         여기서는 버킷 설정 여부를 `up` 하나로 흉내 내고 있으므로 같은
         값을 따릅니다 — 그래야 "버킷이 꺼진 화면" 을 잴 수 있습니다. */
      const cf = { url:FAKE, anonKey:"k" };
      if(up) cf.pubBucket = "pv-test";
      /* ⚠️ `sso` 는 이 흉내 장치만 쓰는 열쇠입니다 (어느 소셜 로그인을
         켠 것으로 칠까) — 진짜 `/api/session` 에는 없는 칸이라 답에
         실어 보내지 않습니다. */
      const w = Object.assign({}, who); delete w.sso;
      return r.fulfill({ status:200, contentType:"application/json",
        body: JSON.stringify(Object.assign({ auth:true, signedIn:true, hats:[],
          conf:cf }, w)) });
    }),
    /* ⚠️⚠️⚠️ **어떤 소셜 로그인이 켜져 있나** — 진짜 Supabase 의
       `/auth/v1/settings` 가 내주는 꼴 그대로입니다 (`external` 에
       공급자마다 참 · 거짓). `js/auth.js` 의 `amAuthProviders()` 가
       여기를 읽고, 참인 것만 단추로 그립니다.
       ⚠️⚠️ **안 주면 아무것도 안 켜진 것**입니다 — 지금 운영이 그
       상태이고, 그때는 단추가 한 개도 안 그려져야 합니다 (절대 규칙 5).
       그래서 `who.sso` 를 안 적은 장면은 저절로 "소셜 없음" 을 잽니다.
       ⚠️⚠️ **흉내가 진짜와 다른 꼴을 돌려주면 그 차이만큼이 영영 안
       재는 자리가 됩니다** — `content-range` 를 안 내줘서 쪽 수가
       여기서만 안 나온 그 자리입니다. */
    p.route(FAKE + "/auth/v1/settings", function(r){
      const ex = {};
      ((who && who.sso) || []).forEach(function(k){ ex[k] = true; });
      return r.fulfill({ status:200, contentType:"application/json",
                         body: JSON.stringify({ external: ex }) });
    }),
    /* ⚠️⚠️ **서명받은 자리에 파일을 올리는 PUT** — 이 길을 안 내주면
       올리기가 그물에서 멈춰 "올리지 못했습니다" 로만 보입니다 (화면은
       멀쩡한데 검사가 틀린 자리). 꼴은 Supabase 와 같게 200 입니다. */
    p.route(FAKE + "/storage/**", function(r){
      /* ⚠️⚠️ **이름을 `PUT` 으로 박지 않습니다** — 같은 주소 꼴로
         사진을 **내려받는 GET** 도 옵니다(카드의 `<img>`). 박아 두면
         올리지 않았는데도 "올렸다" 로 세어집니다. 방법은 body 에 적고
         재는 쪽이 가릅니다. */
      sent.push({ name:"storage",
                  body: r.request().method() + " " + r.request().url() });
      return r.fulfill({ status:200, contentType:"application/json",
                         body: JSON.stringify({ Key:"ok" }) });
    }),
    p.route(FAKE + "/rest/v1/**", function(r){
      const u = r.request().url();
      if(u.indexOf("/rpc/") >= 0){
        const fn = u.split("/rpc/")[1].split("?")[0];
        sent.push({ name: fn, body: r.request().postData() });
        /* ⚠️ 문이 무엇을 돌려주는지는 흉내만 냅니다 — 화면은 돌아오면
           다시 읽습니다 (그 길이 실제로 도는지도 여기서 드러납니다).
           ⚠️ 돌려줄 것이 있는 문은 `rpcs` 로 줍니다 (지표처럼 **받은
           것을 그리는** 화면은 그래야 잴 것이 생깁니다). */
        const v = (rpcs || {})[fn];
        if(v === null)
          return r.fulfill({ status:500, contentType:"application/json",
                             body: JSON.stringify({ message:"못 읽었습니다" }) });
        return r.fulfill({ status:200, contentType:"application/json",
                           body: JSON.stringify(v === undefined ? null : v) });
      }
      sent.push({ name:"GET", body:u });
      /* 어느 표를 묻는지는 주소 앞머리로 가릅니다 */
      const key = Object.keys(tables).filter(function(k){
        return u.indexOf("/rest/v1/" + k) >= 0;
      }).sort(function(a, c){ return c.length - a.length; })[0];
      if(key === undefined)
        return r.fulfill({ status:200, contentType:"application/json",
                           headers:{ "content-range":"0-0/0" }, body:"[]" });
      const v = tables[key];
      if(v === null)
        return r.fulfill({ status:500, contentType:"application/json", body:"{}" });
      /* ⚠️⚠️⚠️ **`content-range` 를 노출 헤더에 적어야 브라우저가 읽습니다.**
         이 흉내 서버는 다른 출처(FAKE)라, `access-control-expose-headers`
         가 없으면 화면의 `r.headers.get("content-range")` 가 **null** 입니다 —
         진짜 Supabase(PostgREST)는 그 헤더를 노출하므로, 안 적으면
         **흉내와 진짜가 다른 말**을 하고 쪽 수 같은 것이 여기서만 안
         나옵니다 (`_serve.js` 가 Content-Type 을 잘못 보내 사진 검사가
         영원히 초록이던 그 자리입니다). */
      return r.fulfill({ status:200, contentType:"application/json",
        headers:{ "content-range":"0-0/" + (Array.isArray(v) ? v.length : 0),
                  "access-control-expose-headers":"content-range" },
        body: JSON.stringify(v) });
    })
  ]).then(function(){ return sent; });
}
module.exports = { FAKE: FAKE, stub: stub };

/* ════════════════════════════════════════════════════════════════════
   업체 자료를 **화면이 쓰는 꼴로** 다듬는 곳 — 한 곳 (2026-11-17)

   ⚠️⚠️⚠️ 부르는 자리가 둘입니다 —
     ① `tools/pull-providers.js`(빌드 전에 DB 에서 가져와 파일로 찍습니다)
     ② `js/pvlive.js`(화면이 열릴 때 같은 공개 보기에서 **지금 값**을 읽습니다)
   둘이 따로 적으면 한쪽만 칸을 늘리는 날 같은 업체가 빌드 화면과 실시간
   화면에서 다른 말을 합니다. 그래서 받을 칸 · 다듬는 규칙 · 가격 · 사진을
   붙이는 규칙을 **여기 한 곳**에 둡니다.

   ⚠️⚠️⚠️ 2026-11-17 에 찾은 고장 — pull-providers 가 공개 보기에서 칸을
   받아 놓고 **열 칸만 남기고 버리고** 있었습니다. 버린 것이 0057 의
   사업자 신원정보(대표자 · 주소 · 전화 · 전자우편 · 사업자등록번호 —
   전자상거래법 제20조 제2항이 손님에게 보이라고 한 값)와 0071 의
   개인 · 사업자 구분(제20조의4 ③), 0074 · 0076 · 0079 의 연습장 · 피팅
   속성이었습니다. 업체를 승인하고 가져오는 날 그 줄들이 **조용히**
   빠질 참이었습니다(검사는 씨앗 파일을 직접 심어서 이 길을 안 지났습니다).

   ⚠️ 비어 있는 값은 **칸째 뺍니다** — 화면이 그 줄을 빼는 근거입니다
   (자리표시자를 찍지 않습니다 · 절대 규칙 2).
   ⚠️ 연락처 · 담당자 직통은 받지 않습니다(공개 보기에 없습니다 · 0013).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var COLS = "id,name,intro,regions,gu,subs,since,consult_hours,verified,brands,scale,contact_ways," +
             "ceo,addr,tel,email,brn," +                       /* 0057 — 공개해야 하는 사업자 정보 */
             "kind,place_name,lesson_goals," +                 /* 0071 */
             "range_opts,open_hours,fit_ways,fit_terms," +     /* 0074 · 0076 · 0079 */
             "created_at," +                                   /* 0079 — 「최신 등록순」 */
             "is_test";
  var PCOLS = "id,provider_id,sub,label,amount,unit,note";
  var FCOLS = "id,provider_id,path,mime,caption";
  /* 글자 칸 · 목록 칸 — ⚠️ 칸을 더하는 날 **여기와 COLS 를 같이** */
  var TEXT = ["intro", "since", "consult_hours", "scale",
              "ceo", "addr", "tel", "email", "brn",
              "kind", "place_name", "open_hours", "fit_terms", "created_at"];
  var LIST = ["regions", "gu", "subs", "brands", "contact_ways",
              "lesson_goals", "range_opts", "fit_ways"];

  function clean(rows){
    return (rows || []).filter(function(p){ return p && p.is_test !== true; })
      .map(function(p){
        var o = { id: p.id, name: p.name };
        TEXT.forEach(function(k){
          if(p[k] !== null && p[k] !== undefined && String(p[k]).trim() !== "") o[k] = p[k];
        });
        LIST.forEach(function(k){
          if(Array.isArray(p[k]) && p[k].length) o[k] = p[k];
        });
        if(p.verified && typeof p.verified === "object" && Object.keys(p.verified).length)
          o.verified = p.verified;
        return o;
      });
  }
  /* 공개 버킷 주소 — ⚠️ 버킷 이름이 없으면 **빈 글자**(사진 없이 갑니다 · 주소를 지어내지 않습니다) */
  function pubBase(url, bucket){
    var b = String(bucket || "").trim().replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 60);
    if(!url || !b) return "";
    return String(url).replace(/\/+$/, "") + "/storage/v1/object/public/" + b + "/";
  }
  /* 가격 · 사진을 업체에 붙입니다 — 업체가 없는 줄은 **버리지 않고 센 수를 돌려줍니다**
     (부르는 쪽이 말합니다). ⚠️ 가격 차례는 받은 차례 그대로입니다(질의가 amount.asc). */
  function join(list, prices, photos, base){
    var byId = {}, lostP = [], lostF = [];
    list.forEach(function(p){ byId[p.id] = p; });
    (prices || []).forEach(function(x){
      var p = byId[x.provider_id];
      if(!p){ lostP.push(x.provider_id); return; }
      if(!p.prices) p.prices = [];
      var o = { sub: x.sub, label: x.label, amount: Number(x.amount), unit: x.unit };
      if(x.note !== null && x.note !== undefined && String(x.note).trim() !== "") o.note = x.note;
      p.prices.push(o);
    });
    if(base) (photos || []).forEach(function(x){
      var p = byId[x.provider_id];
      if(!p){ lostF.push(x.provider_id); return; }
      if(!p.photos) p.photos = [];
      var o2 = { url: base + String(x.path).split("/").map(encodeURIComponent).join("/") };
      if(x.caption !== null && x.caption !== undefined && String(x.caption).trim() !== "")
        o2.caption = x.caption;
      p.photos.push(o2);
    });
    return { list: list, lostPrice: lostP, lostPhoto: lostF };
  }

  /* ── 후기 (0037 · v_review_public) ── pull-reviews 와 화면이 같은 규칙으로 다듬습니다.
     ⚠️ 별점이 1~5 밖이거나 작성자가 가려지지 않은 줄은 `bad` 로 돌려줍니다 —
     빌드 도구는 그때 **멈추고**, 화면은 그 줄을 **안 그립니다**(본이름을 내지 않습니다). */
  var RCOLS = "id,provider_id,rating,body,created_at,updated_at,reply,reply_at,who";
  function reviews(rows){
    var bad = [], out = [];
    (rows || []).forEach(function(v){
      var w = String(v.who || "");
      if(!(Number(v.rating) >= 1 && Number(v.rating) <= 5)){ bad.push({ id: v.id, why: "rating" }); return; }
      if(w.length > 1 && w !== "회원" && w.indexOf("*") < 0){ bad.push({ id: v.id, why: "who" }); return; }
      var o = { id: v.id, provider_id: v.provider_id, rating: Number(v.rating), body: v.body,
                created_at: v.created_at, who: v.who || "회원" };
      if(v.reply && String(v.reply).trim() !== ""){
        o.reply = v.reply;
        if(v.reply_at) o.reply_at = v.reply_at;
      }
      /* 고친 후기에는 고쳤다고 적습니다 — 1분은 넣을 때 updated_at 이 몇 밀리초 늦어서입니다 */
      var t0 = Date.parse(v.created_at || ""), t1 = Date.parse(v.updated_at || "");
      if(t0 && t1 && t1 - t0 > 60000) o.edited = true;
      out.push(o);
    });
    return { rows: out, bad: bad };
  }

  var api = { COLS: COLS, PCOLS: PCOLS, FCOLS: FCOLS, RCOLS: RCOLS, TEXT: TEXT, LIST: LIST,
              clean: clean, join: join, pubBase: pubBase, reviews: reviews };
  if(typeof module !== "undefined" && module.exports) module.exports = api;
  if(typeof window !== "undefined") window.amPvNorm = api;
})();

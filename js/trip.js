/* ════════════════════════════════════════════════════════════════════
   골프 여행 상품 — 찾기 · 목록 · 상세 (0073 · 확정 시안 ⑧)

   ⚠️⚠️⚠️ **이 화면이 2026-11-12 까지 한 줄도 없었습니다.** 0073 이
   표 둘 · 문 아홉 · 보기 넷을 세워 두고 손님 화면을 안 만들어서,
   `check-doors` 가 그 아홉을 전부 "빈 문" 으로 세고 있었습니다
   (그래서 0073 을 **운영 DB 에 올리면 안 되는** 상태였습니다).

   ⚠️⚠️ **설정(Supabase)이 없으면 목록을 못 읽습니다** — 그때는
   **0건이 아니라 "지금은 볼 수 없다"** 고 적습니다. 0 을 적으면
   세어 본 값이 아닙니다 (절대 규칙 1).

   ⚠️ 찾는 칸 · 탭 · 고르개는 **설정과 상관없이** 그립니다 — 주소만
   짓는 칸이라 DB 를 안 읽습니다 (메인의 부킹 찾는 칸이 설정이 없다고
   통째로 사라져 있던 그 자리).
   ════════════════════════════════════════════════════════════════════ */
(function(){
  var W = window, d = document;
  var box = d.getElementById("tripbox");
  if(!box) return;
  var esc = W.esc;
  var LIMIT = 24;
  /* ⚠️ 설정은 `/api/session` 이 한 번 내려줍니다 — 담아 두고 씁니다.
     ⚠️⚠️ **담아 두기 전에 그리지 않습니다** — 답이 오기 전에 그리면
     「준비가 끝나지 않았습니다」가 번쩍 보였다 사라집니다. */
  var A = null, CONF = null;

  /* ── 주소 ──────────────────────────────────────────────────────── */
  function now(){
    var u = new URLSearchParams(W.location.search);
    return { sc:u.get("sc") || "", ds:u.get("ds") || "", mo:u.get("mo") || "",
             sp:u.get("sp") || "", bd:u.get("bd") || "", v:u.get("v") || "",
             q:(u.get("q") || "").trim() };
  }
  function urlOf(f){
    var u = new URLSearchParams();
    ["sc", "ds", "mo", "sp", "bd", "q", "v"].forEach(function(k){
      if(f[k]) u.set(k, f[k]);
    });
    var s = u.toString();
    return "/cat/travel" + (s ? "?" + s : "");
  }

  /* ── 고르개가 내놓는 값 ─────────────────────────────────────────
     ⚠️⚠️ 목적지는 **갈래마다 다릅니다** — 국내는 시·도, 해외는
       AM_TRIP_REGIONS. 섞어 내면 「일본에서 국내 여행」 같은 칸이
       생깁니다 (2026-11-08 에 `amRegionsOf()` 를 만든 그 까닭). */
  function dests(scope){
    if(scope === "abroad") return W.AM_TRIP_REGIONS || [];
    if(scope === "home")   return W.AM_REGIONS || [];
    return (W.amRegionsOf ? W.amRegionsOf("travel") : (W.AM_REGIONS || []));
  }
  /* ⚠️⚠️⚠️ **못 찾은 키를 그대로 찍고 있었습니다** — `return String(k)`
     라 목적지 키가 손님 화면에 날것(`japan`)으로 나갔습니다(지시 6번 ·
     2026-11-12 에 찍어 보고 알았습니다). `check-safe` ⑪ 은 `MAP[a.b] ||
     a.b` 꼴만 세므로 **이 꼴은 못 잡습니다** — 그 자리도 같이 늘렸습니다.
     ⚠️ 중립 문구를 내고 매핑 누락은 `console.warn` 으로 운영자에게만
     갑니다(절대 규칙 3) — `amKeyName()` 한 곳입니다. */
  function destName(k){
    return W.amKeyName ? W.amKeyName(dests(""), k, "목적지") : "";
  }
  /* 일정(일수) · 예산 — ⚠️ 경계는 **아래를 열고 위를 닫습니다**(gte · lt).
     둘 다 닫으면 3일이 두 칸에 다 걸립니다. */
  var SPANS = [
    { key:"s1", name:"1 ~ 2일", gte:1, lt:3 },
    { key:"s2", name:"3 ~ 4일", gte:3, lt:5 },
    { key:"s3", name:"5일 이상", gte:5, lt:null }
  ];
  var BUDGETS = [
    { key:"b1", name:"50만원 미만",        gte:null,    lt:500000 },
    { key:"b2", name:"50만 ~ 100만원",     gte:500000,  lt:1000000 },
    { key:"b3", name:"100만 ~ 200만원",    gte:1000000, lt:2000000 },
    { key:"b4", name:"200만원 이상",       gte:2000000, lt:null }
  ];
  function pick(L, k){
    for(var i = 0; i < L.length; i++) if(L[i].key === k) return L[i];
    return null;
  }

  /* ── 읽기 ──────────────────────────────────────────────────────── */
  /* ⚠️⚠️ 운영 DB 에 아지직 없을 수 있는 **확인된 신괜 칸** — 0077 이
     더한 `months` 하나입니다(찾는 칸은 `select=*` 라 선택 칸 문제는
     없고, 위험한 것은 **거르개** 하나입니다 — 그 칸이 없으면
     PostgREST 가 400 을 내고 목록이 통째로 사라집니다).
     ⚠️⚠️ 보기 부재(404) · 권한(403) · 인증은 덮지 않습니다. */
  var OPTCOL = ["months"];
  var MISS = [];

  /* 거르개 한 칸만 주소에서 끩니다 */
  function dropFilter(path, col){
    return path.split("&").filter(function(p){
      return p.indexOf(col + "=") !== 0;
    }).join("&");
  }

  /* ⚠️⚠️ 한 번만 다시 묻습니다 */
  function get(path){
    return once(path).then(function(r){
      if(r.rows !== null || r.status !== 400) return r;
      var c = W.amMissCol ? W.amMissCol(r.why || "") : "";
      if(!c || OPTCOL.indexOf(c) < 0) return r;
      var p2 = dropFilter(path, c);
      if(p2 === path) return r;
      if(MISS.indexOf(c) < 0) MISS.push(c);
      try{ console.warn("[trip] 운영 DB 에 아지직 없는 칸으로 제한한 것을 " +
        "뻐고 다시 물었습니다 — " + c); }catch(_){}
      return once(p2);
    });
  }

  function once(path){
    return fetch(CONF.url + "/rest/v1/" + path, {
      headers: Object.assign({ apikey:CONF.anonKey },
                             W.amAuthHeaders ? W.amAuthHeaders() : {})
    }).then(function(r){
      /* ⚠️ 까닭은 **다시 묻는 한 곳**에서만 봅니다 — 손님 화면에는
         한 글자도 안 나가고(절대 주칙 3) 개발 기록에만 적힙니다. */
      if(!r.ok) return r.text().then(function(t){
        var o = {}; try{ o = JSON.parse(t) || {}; }catch(_){}
        return { rows:null, status:r.status, why:(o.message || t || "") };
      }, function(){ return { rows:null, status:r.status, why:"" }; });
      return r.json().then(function(rows){
        return { rows: Array.isArray(rows) ? rows : [] };
      }, function(){ return { rows:null }; });
    }, function(){ return { rows:null }; })
     .catch(function(){ return { rows:null }; });
  }

  /* ⚠️⚠️ **거르는 것은 서버입니다** — 스물넷만 받아 화면에서 거르면
     그 스물넷 밖의 상품이 영영 안 나옵니다 (0046 의 조인 거르개에서
     배운 자리). 찾는 말도 서버가 봅니다. */
  function query(f){
    var qs = ["select=*", "order=created_at.desc", "limit=" + LIMIT];
    if(f.sc) qs.push("scope=eq." + encodeURIComponent(f.sc));
    if(f.ds) qs.push("dest=eq." + encodeURIComponent(f.ds));
    var sp = pick(SPANS, f.sp);
    if(sp){
      qs.push("days=gte." + sp.gte);
      if(sp.lt !== null) qs.push("days=lt." + sp.lt);
    }
    var bd = pick(BUDGETS, f.bd);
    if(bd){
      if(bd.gte !== null) qs.push("price_from=gte." + bd.gte);
      if(bd.lt  !== null) qs.push("price_from=lt." + bd.lt);
    }
    /* ⚠️⚠️⚠️ **출발 월은 서버가 거릅니다** — 0077 이 `months`(text[])를
       세어서 내므로 `cs`(contains)로 묻습니다. 쉰 줄만 받아 화면에서
       고르면 그 쉰 줄 밖의 상품이 영영 안 나옵니다.
       ⚠️⚠️ 출발일을 아직 안 올리신 상품은 `months` 가 **빈 배열**이라
       이 조건에 **안 걸립니다** — 그것이 맞습니다(그 달에 출발한다고
       말할 근거가 없습니다). 그 사실을 0건 상자가 그 자리에서 말합니다. */
    if(f.mo && /^\d{4}-\d{2}$/.test(f.mo))
      qs.push("months=cs.%7B" + encodeURIComponent(f.mo) + "%7D");
    if(f.q) qs.push("title=ilike.*" + encodeURIComponent(
      f.q.replace(/[*%]/g, "")) + "*");
    return "v_trip_open?" + qs.join("&");
  }

  /* ── 찾는 칸 ───────────────────────────────────────────────────── */
  function opt(L, cur, all){
    return '<option value="">' + esc(all) + '</option>' +
      L.map(function(x){
        return '<option value="' + esc(x.key) + '"' +
          (cur === x.key ? " selected" : "") + '>' + esc(x.name) + '</option>';
      }).join("");
  }
  /* 출발 월 — ⚠️⚠️ **0077 이 담는 칸을 냈습니다**(2026-11-12). 그 전에는
     "담는 칸이 없어 이 고르개를 아예 안 냅니다" 라고 적어 두었습니다 —
     되는 날 **그 글도 같이** 고칩니다(여기가 그 자리입니다).
     ⚠️ 고르개에 낼 달은 `amTripMonths()` 한 곳이고 **이번 달부터**입니다. */
  function findBox(f){
    return '<form class="tpf" id="tripform" method="get" action="/cat/travel">' +
      /* ⚠️⚠️ 시안은 「국내」이 켜진 채로 그려 있지만 **「전체」를 먼저**
         냅니다 — 기본을 국내로 두면 해외 상품이 **지금 안 보이는 것**이
         되고, 고르지 않은 손님은 제가 좁혀진 목록을 보고 계신 줄 모릅니다.
         ⚠️ 칸이 하나도 안 켜져 있으면 **무엇으로 보고 있는지**를 알 길이
         없습니다(찍어 보고 알았습니다). */
      '<div class="tpf-tab" role="group" aria-label="국내 · 해외">' +
        [{ key:"", name:"전체" }].concat(W.AM_TRIP_SCOPE || [])
          .map(function(s){
            var on = (f.sc === s.key);
            return '<a class="tpf-t' + (on ? " on" : "") + '" data-sc="' +
              esc(s.key) + '" href="' + esc(urlOf({ sc:s.key })) + '"' +
              (on ? ' aria-current="true"' : '') + '>' + esc(s.name) + '</a>';
          }).join("") +
      '</div>' +
      '<div class="tpf-row">' +
        '<p class="tpf-c"><label for="tp-ds">목적지</label>' +
          '<select id="tp-ds" name="ds">' +
            opt(dests(f.sc), f.ds, "전체") + '</select></p>' +
        '<p class="tpf-c"><label for="tp-mo">출발 월</label>' +
          '<select id="tp-mo" name="mo">' +
            opt(W.amTripMonths ? W.amTripMonths(12) : [], f.mo, "전체") +
          '</select></p>' +
        '<p class="tpf-c"><label for="tp-sp">일정(일수)</label>' +
          '<select id="tp-sp" name="sp">' +
            opt(SPANS, f.sp, "전체") + '</select></p>' +
        '<p class="tpf-c"><label for="tp-bd">예산(1인 기준)</label>' +
          '<select id="tp-bd" name="bd">' +
            opt(BUDGETS, f.bd, "전체") + '</select></p>' +
        '<p class="tpf-c tpf-q"><label for="tp-q">찾는 말</label>' +
          '<input id="tp-q" name="q" type="search" maxlength="40" ' +
            'value="' + esc(f.q) + '" placeholder="상품 이름으로 검색"></p>' +
        '<p class="tpf-go"><button type="submit" class="btn btn-deep">' +
          (W.icon ? W.icon("search", 18) : "") + '여행 검색</button></p>' +
      '</div>' +
      /* ⚠️⚠️ **출발일을 아직 안 올리신 상품이 빠진다**는 것을 그 자리에서
         말합니다 — 안 적으면 손님이 0건을 "그 달에는 여행이 없다" 로
         읽습니다(없는 것이 아니라 **아직 안 올리신** 것입니다). */
      (f.mo
        ? '<p class="tpf-n">' + esc((W.amTripMonthName ?
            W.amTripMonthName(f.mo) : f.mo)) +
          ' 에 출발하는 상품만 보고 계십니다 — 출발일을 아직 안 올리신 ' +
          '상품은 이 목록에서 빠집니다.</p>'
        : '<p class="tpf-n">출발 월을 고르시면 그 달에 출발하는 상품만 ' +
          '보여 드립니다. 출발일을 아직 안 올리신 상품은 그때 빠집니다.</p>') +
    '</form>';
  }

  /* ── 카드 ──────────────────────────────────────────────────────── */
  /* ⚠️⚠️ 주소를 짓는 자리는 `amPubUrl()` 한 곳입니다 — 버킷이
     꺼져 있으면 **빈 글자**를 돌려주고 화면은 아이콘 타일로
     돌아갑니다(주소를 지어내지 않습니다 · 0068 에서 세운 규칙). */
  function photoUrl(path){
    return (W.amPubUrl ? W.amPubUrl(CONF, path) : "");
  }
  function chips(r){
    var inc = (Array.isArray(r.incl) ? r.incl : []).filter(Boolean);
    var exc = (Array.isArray(r.excl) ? r.excl : []).filter(Boolean);
    var out = "";
    if(inc.length) out += '<i class="tpc-in">' + esc(inc.join(" · ")) + ' 포함</i>';
    if(exc.length) out += '<i class="tpc-ex">' + esc(exc.join(" · ")) + ' 별도</i>';
    /* ⚠️ 카드 전체가 `<a>` 라 안쪽은 **`<span>`** 입니다 — `<p>` 를 넣으면
       브라우저가 링크를 그 자리에서 닫아 버립니다(인라인 안의 블록). */
    return out ? '<span class="tpc-ie">' + out + '</span>' : "";
  }
  function card(r){
    var ph = r.thumb ? photoUrl(r.thumb) : "";
    var price = W.amTripPrice ? W.amTripPrice(r) : "";
    var span  = W.amTripSpan ? W.amTripSpan(r) : "";
    var href  = urlOf({ v:r.id });
    /* ⚠️⚠️⚠️ **카드 전체가 상세로 가는 링크**입니다 (0069 의 `.lsc-a` 와
       같은 꼴). 처음에 사진과 제목을 **각자 링크**로 두었는데, 폰에서
       제목 링크가 **20px** 밖에 안 되어 손가락에 안 닿았습니다(누르는
       것은 40px 이상 · 손님이 40~60대입니다). 검사가 폰 세 폭에서
       **2칸씩** 잡아 드러났습니다.
       ⚠️ 안쪽에 또 링크를 넣지 않습니다 — 어느 쪽이 눌리는지 브라우저
       마다 다릅니다(0069 가 찜 단추를 링크 **바깥**에 둔 그 까닭). */
    return '<li class="tpc">' +
      '<a class="tpc-a" href="' + esc(href) + '">' +
      '<span class="tpc-ph' + (ph ? " tpc-ph-on" : "") + '">' +
        (ph ? '<img src="' + esc(ph) + '" alt="" loading="lazy" decoding="async">'
            : (W.icon ? W.icon("plane", 26) : "")) +
      '</span>' +
      '<span class="tpc-b">' +
        '<b class="tpc-t">' + esc(r.title) + '</b>' +
        (span || r.dest
          ? '<span class="tpc-m">' + esc([destName(r.dest), span]
              .filter(Boolean).join(" · ")) + '</span>'
          : "") +
        /* ⚠️⚠️ 값은 **"부터"** 입니다 — 빼면 우리가 값을 확정해 말하는
           것이 됩니다(amTripPrice 한 곳). 못 읽으면 그 줄이 빠집니다. */
        /* ⚠️⚠️⚠️ **출발 정보는 셋을 다른 말로** 냅니다(0077) — 확정
           출발일 · 출발 가능 기간 · **아직 안 올리심**. 셋을 같은 말로
           내면 안 올리신 상품이 「일정이 없는 상품」으로 읽힙니다.
           ⚠️ 글자를 짓는 자리는 `amTripDepart()` 한 곳입니다. */
        (function(){
          var dp = W.amTripDepart ? W.amTripDepart(r) : null;
          return dp ? '<span class="tpc-d tpc-d-' + esc(dp.kind) + '">' +
            (W.icon ? W.icon("cal", 13) : "") + esc(dp.text) + '</span>' : "";
        })() +
        (price ? '<span class="tpc-p">' + esc(price) + '</span>' : "") +
        chips(r) +
        (r.price_note ? '<span class="tpc-n">' + esc(r.price_note) + '</span>' : "") +
        /* ⚠️⚠️ 상호가 비면 **줄째 뺍니다** — 「판매사: 」만 찍으면
           자리표시자이고(절대 규칙 2) 손님은 빠진 값으로 읽습니다.
           ⚠️ 지금 공개 보기(`v_trip_open`)는 승인된 업체와 **안쪽
           조인**이라 빌 수가 없습니다 — 화면이 칸을 하나 빠뜨리는
           날을 막는 줄입니다(`industries` 로 겪은 자리). */
        (r.provider_name
          ? '<span class="tpc-s">' + (W.icon ? W.icon("store", 14) : "") +
            '판매사: ' + esc(r.provider_name) + '</span>'
          : "") +
      '</span>' +
      '<span class="tpc-go">일정 · 포함사항 보기</span>' +
      '</a>' +
    '</li>';
  }

  /* ── 0건 · 못 읽음 ─────────────────────────────────────────────
     ⚠️⚠️ **셋을 갈라 말합니다** — ① 아직 아무도 안 올렸다 ② 조건에
       맞는 것이 없다 ③ **못 읽었다**(0건이라는 뜻이 아닙니다). */
  function noneEmpty(){
    return '<div class="none tp-none">' +
      '<p class="tp-none-i">' + (W.icon ? W.icon("plane", 34) : "") + '</p>' +
      '<h3>등록된 여행 상품이 없습니다</h3>' +
      '<p>골프 여행 상품을 판매하고 싶다면 여행사 입점을 신청해 주세요.</p>' +
      '<div class="none-b">' +
      '<a class="btn btn-pri" href="/join">여행사 입점 신청</a>' +
      '<a class="btn btn-line" href="/match?cat=travel">희망 일정 남기기</a>' +
      '</div></div>';
  }
  function noneNarrow(){
    return '<div class="none"><h3>고르신 조건에 맞는 상품이 없습니다.</h3>' +
      '<p>조건을 조금 넓혀 보시거나, 원하시는 일정을 남기시면 맞는 ' +
      '상품을 찾아 이어 드립니다.</p>' +
      '<div class="none-b">' +
      '<a class="btn btn-line" href="/cat/travel">조건 모두 지우기</a>' +
      '<a class="btn btn-pri" href="/match?cat=travel">희망 일정 남기기</a>' +
      '</div></div>';
  }
  function failBox(){
    return '<div class="none tp-fail">' +
      '<p class="tp-none-i">' + (W.icon ? W.icon("info", 34) : "") + '</p>' +
      '<h3>지금 여행 상품을 불러오지 못했습니다</h3>' +
      '<p>상품이 없다는 뜻이 <b>아닙니다.</b> 잠시 뒤에 다시 눌러 주세요. ' +
      '계속 같으면 고객센터로 알려 주세요.</p>' +
      '<p class="tp-fail-b">' +
        '<button type="button" class="btn btn-pt tp-retry">다시 시도</button>' +
        '<a class="btn btn-bad" href="/help">고객센터</a>' +
      '</p></div>';
  }
  /* ⚠️⚠️ 무엇이 준비 중인지 **이름을 대고** 말합니다 — 한 화면에
     같은 안내가 둘(여행 상품 · 구합니다 글) 서는데 글이 똑같으면
     손님은 같은 말을 두 번 읽으십니다(찍어 보고 알았습니다).
     ⚠️ 무엇을 설정해야 하는지는 여기 안 적습니다 (절대 규칙 3). */
  function shutBox(){
    return '<div class="none"><h3>여행 상품은 아직 준비가 끝나지 않았습니다.</h3>' +
      '<p>준비가 끝나면 이 자리에서 바로 보실 수 있습니다. 먼저 ' +
      '물어보실 것이 있으면 고객센터로 알려 주세요.</p>' +
      '<div class="none-b"><a class="btn btn-pt" href="/help">고객센터</a></div>' +
    '</div>';
  }

  /* ── 상세 ──────────────────────────────────────────────────────
     ⚠️ 보기를 새로 안 만들었습니다 — `v_trip_open` 에 `?id=eq.<uuid>`
       로 한 줄만 받습니다 (공개로 나가는 길이 둘이 되면 한쪽만 고치는
       날 한쪽만 샙니다 · 0069 에서 세운 규칙). */
  /* 상세의 출발 구간 — ⚠️⚠️ **셋을 다른 말로** 냅니다(0077).
     ⚠️ 확정 출발일은 **받은 줄만** 적습니다 — 한도(60)에 닿으면 그
     사실을 적습니다(전체인 것처럼 적으면 세어 본 값이 아닙니다). */
  function departBox(r, days){
    var dp = W.amTripDepart ? W.amTripDepart(r) : null;
    if(!dp) return "";
    var L = (days || []).map(function(x){
      return W.amTripDay ? W.amTripDay(x.depart_on) : "";
    }).filter(Boolean);
    return '<div class="tpd-dp tpd-dp-' + esc(dp.kind) + '">' +
      '<p class="tpd-dp-h">' + (W.icon ? W.icon("cal", 16) : "") +
        esc(dp.text) + '</p>' +
      (L.length
        ? '<ul class="tpd-dl">' + L.map(function(s){
            return '<li>' + esc(s) + '</li>';
          }).join("") + '</ul>' +
          (L.length >= 60
            ? '<p class="tpd-dp-n">이 화면에는 60일까지만 적습니다 — ' +
              '나머지는 판매사에 문의해 주세요.</p>' : "")
        : "") +
      (dp.kind === "none"
        ? '<p class="tpd-dp-n">판매사가 출발일을 아직 안 올리셨습니다 — ' +
          '일정이 없다는 뜻이 아닙니다. 아래로 문의해 주세요.</p>' : "") +
    '</div>';
  }

  function detail(r, shots, days){
    var price = W.amTripPrice ? W.amTripPrice(r) : "";
    var span  = W.amTripSpan ? W.amTripSpan(r) : "";
    var inc = (Array.isArray(r.incl) ? r.incl : []).filter(Boolean);
    var exc = (Array.isArray(r.excl) ? r.excl : []).filter(Boolean);
    return '<div class="tpd">' +
      '<p class="tpd-back"><a class="btn btn-line btn-sm" href="' +
        esc(urlOf({})) + '">' + (W.icon ? W.icon("arrow", 15) : "") +
        '목록으로</a></p>' +
      '<h2 class="tpd-t">' + esc(r.title) + '</h2>' +
      '<p class="tpd-m">' + esc([destName(r.dest), span]
        .filter(Boolean).join(" · ")) + '</p>' +
      (shots && shots.length
        ? '<ul class="tpd-ph">' + shots.map(function(s){
            var u = photoUrl(s.path);
            if(!u) return "";
            return '<li><img src="' + esc(u) + '" alt="' +
              esc(s.caption || "") + '" loading="lazy" decoding="async"></li>';
          }).join("") + '</ul>'
        : "") +
      departBox(r, days) +
      (price ? '<p class="tpd-p">' + esc(price) + '</p>' : "") +
      (r.price_note ? '<p class="tpd-n">' + esc(r.price_note) + '</p>' : "") +
      '<div class="tpd-body">' + esc(r.body).replace(/\n/g, "<br>") + '</div>' +
      (inc.length ? '<p class="tpd-ie"><b>포함</b> ' + esc(inc.join(" · ")) + '</p>' : "") +
      (exc.length ? '<p class="tpd-ie"><b>별도</b> ' + esc(exc.join(" · ")) + '</p>' : "") +
      (r.provider_name
        ? '<p class="tpd-s">' + (W.icon ? W.icon("store", 15) : "") +
          '판매사: ' + esc(r.provider_name) + '</p>'
        : "") +
      /* ⚠️⚠️ **우리가 파는 것이 아닙니다** — 제20조 제1항을 그 자리에서
         다시 말하고, 문의는 이미 도는 길(매칭 요청)로 보냅니다.
         ⚠️ 결제를 안 받으므로 「예약」 단추를 내지 않습니다. */
      '<p class="tpd-note">골프올인원은 통신판매중개자이며 이 상품의 ' +
        '거래 당사자가 아닙니다. 일정 · 금액 · 포함 조건은 판매사가 ' +
        '정합니다.</p>' +
      '<p class="tpd-go"><a class="btn btn-pri" href="/match?cat=travel">' +
        '이 일정으로 문의하기</a></p>' +
    '</div>';
  }

  /* ── 그리기 ────────────────────────────────────────────────────── */
  var LIST = null, CNT = null, BOUND = false;
  function mount(f){
    box.innerHTML = findBox(f) +
      '<p class="tp-cnt" id="tripcnt"></p>' +
      '<div id="triplist"></div>';
    LIST = d.getElementById("triplist");
    CNT  = d.getElementById("tripcnt");
    bind();
  }
  function say(n, more){
    if(!CNT) return;
    /* ⚠️⚠️ 받아 온 줄이 한도에 닿으면 **「N건 이상」** 입니다 — 그 수를
       전체인 것처럼 적으면 세어 본 값이 아닙니다 (절대 규칙 1). */
    CNT.textContent = n === null ? "" :
      ("여행 상품 " + (W.won ? W.won(n) : String(n)) + "건" +
       (more ? " 이상" : ""));
  }

  function paint(){
    var f = now();
    if(!LIST) mount(f);
    else fill(f);
    if(!CONF || !CONF.url){
      say(null); LIST.innerHTML = shutBox(); return;
    }
    if(f.v){
      LIST.innerHTML = '<p class="tp-wait">불러오는 중입니다…</p>';
      say(null);
      Promise.all([
        get("v_trip_open?id=eq." + encodeURIComponent(f.v) + "&limit=1"),
        get("v_trip_photo_public?trip_id=eq." + encodeURIComponent(f.v) +
               "&order=ord.asc&limit=20"),
        /* ⚠️⚠️ 확정 출발일은 **표에서 따로** 받습니다(0077 의
           `v_trip_date_public`). `v_trip_open` 은 가장 가까운 하나만
           내므로, 상세에서 날짜를 다 보여 드리려면 이 길이 필요합니다.
           ⚠️ 못 읽어도 상세는 그립니다 — 날짜 줄만 빠집니다. */
        get("v_trip_date_public?trip_id=eq." + encodeURIComponent(f.v) +
               "&order=depart_on.asc&limit=60")
      ]).then(function(res){
        /* ⚠️ 불러오는 사이에 뒤로 가셨으면 **안 그립니다** — 안 보면
           늦게 온 답이 목록을 덮어씁니다 (0069 의 그 자리). */
        if(now().v !== f.v) return;
        var rows = res[0].rows;
        if(rows === null){ LIST.innerHTML = failBox(); return; }
        if(!rows.length){
          LIST.innerHTML = '<div class="none"><h3>지금은 볼 수 없는 상품입니다.</h3>' +
            '<p>판매가 끝났거나 내려간 상품일 수 있습니다.</p>' +
            '<div class="none-b"><a class="btn btn-line" href="' +
            esc(urlOf({})) + '">목록으로</a></div></div>';
          return;
        }
        LIST.innerHTML = detail(rows[0], res[1].rows || [], res[2].rows || []);
      });
      return;
    }
    LIST.innerHTML = '<p class="tp-wait">불러오는 중입니다…</p>';
    get(query(f)).then(function(res){
      if(now().v) return;
      var rows = res.rows;
      if(rows === null){ say(null); LIST.innerHTML = failBox(); return; }
      if(!rows.length){
        say(0);
        var any = (f.sc || f.ds || f.sp || f.bd || f.q);
        LIST.innerHTML = any ? noneNarrow() : noneEmpty();
        return;
      }
      say(rows.length, rows.length >= LIMIT);
      LIST.innerHTML = '<ul class="tpg">' + rows.map(card).join("") + '</ul>';
    });
  }

  /* 고르개를 지금 조건에 맞춥니다 — ⚠️ 안 맞추면 주소로 들어오신 분께
     「전체」라고 적힌 칸 아래 좁혀진 목록이 나옵니다.
     ⚠️⚠️ **찾는 칸은 다시 안 그립니다** — 글자를 칠 때마다 다시 그리면
       커서가 튕겨 나갑니다 (0068 의 그 자리). */
  function fill(f){
    var set = function(id, v){ var e = d.getElementById(id); if(e) e.value = v; };
    /* 목적지는 갈래가 바뀌면 **목록 자체가 바뀝니다** — 다시 채웁니다 */
    var ds = d.getElementById("tp-ds");
    if(ds) ds.innerHTML = opt(dests(f.sc), f.ds, "전체");
    set("tp-mo", f.mo); set("tp-sp", f.sp); set("tp-bd", f.bd);
    Array.prototype.forEach.call(d.querySelectorAll(".tpf-t"), function(a){
      var on = (a.getAttribute("data-sc") || "") === f.sc;
      a.classList.toggle("on", on);
      if(on) a.setAttribute("aria-current", "true");
      else   a.removeAttribute("aria-current");
      a.setAttribute("href", urlOf({ sc:a.getAttribute("data-sc") || "" }));
    });
  }

  function go(f, push){
    if(push){ try{ history.pushState({ trip:1 }, "", urlOf(f)); }catch(e){} }
    paint();
  }
  function fromForm(){
    var v = function(id){ var e = d.getElementById(id); return e ? e.value : ""; };
    var f = now();
    /* ⚠️⚠️ **보내는 열쇠와 읽는 칸을 맞춰야** 합니다 — `mo` 를 빈 글자로
       두고 있었습니다(그때는 그 고르개가 없었습니다). 0077 로 칸이
       생겼으니 여기서 읽습니다. 안 읽으면 고르개는 그려지는데 누르면
       **조건이 사라집니다**(에러 0줄). */
    return { sc:f.sc, ds:v("tp-ds"), sp:v("tp-sp"), bd:v("tp-bd"),
             mo:v("tp-mo"), v:"", q:(v("tp-q") || "").trim() };
  }

  /* ⚠️⚠️ 눌림은 **감싼 자리 한 곳**에서 받습니다 — 다시 그릴 때마다
     달면 같은 손놀림에 호출이 여러 번 돕니다 (0069 의 그 자리). */
  function bind(){
    if(BOUND) return;
    box.addEventListener("submit", function(e){
      if(!e.target || e.target.id !== "tripform") return;
      e.preventDefault();
      go(fromForm(), true);
    });
    box.addEventListener("change", function(e){
      var t = e.target;
      if(!t || !t.id) return;
      if(t.id === "tp-ds" || t.id === "tp-sp" || t.id === "tp-bd")
        go(fromForm(), true);
    });
    box.addEventListener("click", function(e){
      var t = e.target;
      if(t && t.closest && t.closest(".tp-retry")){ paint(); return; }
      var a = t && t.closest ? t.closest("a") : null;
      if(!a) return;
      var href = a.getAttribute("href") || "";
      if(href.indexOf("/cat/travel") !== 0) return;
      if(e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault();
      var u = new URL(href, W.location.origin);
      var q = new URLSearchParams(u.search);
      var f = { sc:"", ds:"", mo:"", sp:"", bd:"", v:"", q:"" };
      ["sc", "ds", "mo", "sp", "bd", "v", "q"].forEach(function(k){
        if(q.has(k)) f[k] = q.get(k) || "";
      });
      go(f, true);
    });
    BOUND = true;
  }

  /* ⚠️⚠️ 뒤로 가기를 받습니다 — `pushState` 로 주소를 바꾸므로, 이 줄이
     없으면 주소만 바뀌고 **화면이 그대로** 있습니다. */
  W.addEventListener("popstate", function(){ paint(); });

  /* ⚠️⚠️⚠️ **설정을 먼저 묻고 그립니다.** 찾는 칸·탭·고르개는
     주소만 짓습니다 — 그래서 **설정과 상관없이** 먼저 세우고(안 그리면
     시안의 왼쪽 반쪽이 통째로 빈 글이 됩니다 · 메인 현황표에서 겪은
     그 자리), 목록 자리만 답을 받아 갈아 끼욵니다. */
  mount(now());
  if(W.amAuthAsk){
    W.amAuthAsk().then(function(a){
      A = a; CONF = (a && a.conf) || null;
      if(!CONF || !CONF.url){
        /* ⚠️ 무엇을 설정해야 하는지는 **손님 화면에 안 적습니다**
           (절대 규칙 3) — 운영자에게만 기록으로 남깁니다. */
        try{ console.warn("[trip] 로그인 설정이 없어 여행 상품을 불러오지 " +
          "못했습니다 — SUPABASE_URL · SUPABASE_ANON_KEY."); }catch(e){}
      }
      paint();
    }, function(){ paint(); });
  }else{ paint(); }
})();
